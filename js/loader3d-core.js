/* ============================================================
   LOADER 3D · SHARED CORE
   ------------------------------------------------------------
   The geometry parsing and the tumble maths, with NO DOM in them, so the
   exact same code can run in two places:

     · js/loader3d.worker.js  - inside a Web Worker, drawing to an
                                OffscreenCanvas (the normal path)
     · js/loader3d.js         - on the main thread (the fallback, for
                                browsers without OffscreenCanvas)

   Loaded by <script> on the main thread and by importScripts() in the
   worker, so it must not assume `window` exists - it hangs itself off
   whatever global object it finds.
   ============================================================ */
(function(root){
  "use strict";

  var CORE = {};

  /* ---- timing. One diagonal quarter-turn, then a beat at rest. -----------
     The loader is only ever released DURING a settle, never mid-turn, so
     every landing is a valid logo pose. */
  CORE.TURN_MS   = 900;
  CORE.SETTLE_MS = 380;
  CORE.MIN_TURNS = 1;
  CORE.MAX_TURNS = 8;

  /* ---- binary STL -> two vertex lists, split by face normal ----
     Faces whose normal is dominated by one axis (|n| > 0.99) are the cube's
     flat sides; everything else is the sphere cut through it. Splitting them
     lets each take its own material, which is what makes the recess read as
     depth rather than a flat silhouette.
     Positions are centred on the geometry's own bounding box, and `half`
     (widest face) and `radius` (space diagonal) come back with it - the
     camera needs both, and they must not be guessed. */
  CORE.parseSTL = function(buf){
    var dv = new DataView(buf);
    var triCount = dv.getUint32(80, true);
    if(84 + triCount * 50 !== buf.byteLength) return null;   // ASCII or corrupt

    var flat = [], curved = [];
    var min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    var off = 84, i, v, p, x, y, z;

    for(i = 0; i < triCount; i++){
      var nx = dv.getFloat32(off, true), ny = dv.getFloat32(off+4, true), nz = dv.getFloat32(off+8, true);
      var dom = Math.max(Math.abs(nx), Math.abs(ny), Math.abs(nz));
      var target = (dom > 0.99) ? flat : curved;
      for(v = 0; v < 3; v++){
        p = off + 12 + v*12;
        x = dv.getFloat32(p, true); y = dv.getFloat32(p+4, true); z = dv.getFloat32(p+8, true);
        if(x < min[0]) min[0] = x; if(x > max[0]) max[0] = x;
        if(y < min[1]) min[1] = y; if(y > max[1]) max[1] = y;
        if(z < min[2]) min[2] = z; if(z > max[2]) max[2] = z;
        target.push(x, y, z);
      }
      off += 50;
    }
    if(!flat.length && !curved.length) return null;

    var cx = (min[0]+max[0])/2, cy = (min[1]+max[1])/2, cz = (min[2]+max[2])/2;
    function centre(arr){
      for(var k = 0; k < arr.length; k += 3){ arr[k] -= cx; arr[k+1] -= cy; arr[k+2] -= cz; }
      return new Float32Array(arr);
    }
    var sx = max[0]-min[0], sy = max[1]-min[1], sz = max[2]-min[2];

    return {
      flat:   centre(flat),
      curved: centre(curved),
      // half the space DIAGONAL - the furthest a corner swings mid-tumble, so
      // the ortho frustum sized off it never clips
      radius: Math.sqrt(sx*sx + sy*sy + sz*sz) / 2,
      // half the widest FACE - how much of that frustum the mark fills sitting
      // still, front-on. The gap between the two is why the canvas has to be
      // bigger than the mark; see the OVERSCAN note where the scene is built.
      half:   Math.max(sx, sy, sz) / 2
    };
  };

  /* ---- build the scene. Takes THREE so it works either side. ----
     Orthographic on purpose: no perspective foreshortening, so the mark keeps
     the flat, drawn look of the 2D logo even while it turns. */
  CORE.buildScene = function(THREE, parsed){
    var scene = new THREE.Scene();
    var FRUST = parsed.radius * 1.06;
    var camera = new THREE.OrthographicCamera(-FRUST, FRUST, FRUST, -FRUST, 1, parsed.radius * 20);
    camera.position.set(0, 0, parsed.radius * 4);
    camera.lookAt(0, 0, 0);

    // key from the upper LEFT front with low ambient, so the sphere's recessed
    // interior falls into shadow and the cut reads as a real void
    scene.add(new THREE.AmbientLight(0xffffff, 0.34));
    var key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(-0.6, 0.8, 1.1);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.18);
    fill.position.set(0.7, -0.5, 0.4);
    scene.add(fill);

    function meshFrom(arr, colour, roughness){
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      g.computeVertexNormals();
      var m = new THREE.MeshStandardMaterial({
        color: colour, roughness: roughness, metalness: 0.12, side: THREE.DoubleSide
      });
      return { mesh: new THREE.Mesh(g, m), geo: g, mat: m };
    }

    var group = new THREE.Group();
    // near-identical inks; the roughness split plus the lighting does the work
    var cube   = meshFrom(parsed.flat,   0x141414, 0.32);
    var sphere = meshFrom(parsed.curved, 0x161616, 0.30);
    group.add(cube.mesh);
    group.add(sphere.mesh);
    scene.add(group);

    return {
      scene: scene, camera: camera, group: group,
      FRUST: FRUST,
      OVERSCAN: FRUST / (parsed.half || 1),   // ~1.84 for the current logo
      dispose: function(){
        cube.geo.dispose(); cube.mat.dispose();
        sphere.geo.dispose(); sphere.mat.dispose();
      }
    };
  };

  /* ---- the tumble ----
     Each segment turns 90 degrees about X and Y at once. The four sign pairs
     cycle so the mark works around the cube's symmetries rather than rocking
     between two poses. Every landing is a cube symmetry, which is why any
     settle is a valid place to stop. */
  CORE.makeTumble = function(THREE){
    var AXIS_X = new THREE.Vector3(1, 0, 0);
    var AXIS_Y = new THREE.Vector3(0, 1, 0);
    var DIRX = [ 1, -1,  1, -1];
    var DIRY = [ 1,  1, -1, -1];
    var HALF_PI = Math.PI / 2;
    var qBase = new THREE.Quaternion();
    var qx = new THREE.Quaternion(), qy = new THREE.Quaternion(), qStep = new THREE.Quaternion();

    return {
      ease: function(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2; },
      apply: function(group, seg, e){
        qy.setFromAxisAngle(AXIS_Y, e * DIRY[seg] * HALF_PI);
        qx.setFromAxisAngle(AXIS_X, e * DIRX[seg] * HALF_PI);
        qStep.copy(qx).multiply(qy);
        group.quaternion.copy(qStep).multiply(qBase);
      },
      // land EXACTLY on the settled pose and make it the new base, so repeated
      // turns cannot accumulate float drift off the symmetry
      land: function(group){ qBase.copy(group.quaternion); }
    };
  };

  root.LOADER3D_CORE = CORE;
})(typeof self !== "undefined" ? self : this);
