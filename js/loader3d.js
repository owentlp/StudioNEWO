/* ============================================================
   LOADING SCREEN · 3D LOGO (progressive enhancement)
   ------------------------------------------------------------
   2026-07-28: the motion was replaced with Owen's new tumble
   (prototyped in logo/3D Logo Loading Animation/). The old
   version turned 90° about Y only. This one turns 90° about X
   AND Y AT THE SAME TIME, so the mark tumbles diagonally through
   its vertex/petal views instead of spinning like a carousel.
   Ported changes, all from the prototype:
     · orthographic camera (was perspective) - no foreshortening,
       so the mark keeps the flat, drawn look of the 2D logo even
       while it turns
     · the STL is split into TWO meshes by face normal: axis-
       aligned faces (the cube) get one material, curved faces
       (the sphere cut through it) get a slightly different one,
       so the recessed sphere walls read as depth rather than a
       single flat silhouette
     · new three-light rig, key from the upper LEFT front, low
       ambient, so those recessed walls actually darken
     · easeInOutCubic on each turn (was smoothstep)

   WHY IT ALWAYS STOPS AT REST
   Every settle point is a cube symmetry, so a landed pose is
   always "the logo" again, never some odd in-between angle. The
   loader is pinned fully visible (an inline opacity override on
   #loader, which beats the body.ready CSS fade) and is only ever
   released DURING A SETTLE HOLD - never mid-turn. So the sequence
   is: turn, settle, and if the page is ready by then, release
   from that settled pose; if it isn't, take another turn and
   check again at the next settle. Normal fast load = exactly one
   turn. Extra turns only happen when the page genuinely needs
   the time. See SETTLE_MS / TURN_MS / MIN_TURNS / MAX_TURNS.

   IMPORTANT DEPARTURE FROM THE USUAL RULE: everywhere else on
   this site, loading-screen/decorative work is built to never
   delay the page. This sequence is a deliberate exception Owen
   asked for - once the 3D mark is running, the loader is held
   until at least one full turn+settle has played AND the page is
   ready, whichever is later. Guaranteed animation-through beats
   fastest-possible reveal here, by explicit request.

   If WebGL isn't available, the visitor has reduced-motion or
   data-saver on, or the CDN script / STL fetch fails, none of
   this applies - it quietly does nothing and the flat static
   mark (with the page's normal, un-delayed reveal timing) is all
   anyone sees.

   Bring your own THREE: loads three.js r128 from cdnjs, plus a small
   hand-rolled binary STL parser below (instead of pulling in the separate
   STLLoader addon file, one less thing that can 404).

   Source geometry: logo/3d-logo.stl - byte-identical to the
   prototype's uploads/3D-LOGO.STL, so there is nothing to copy
   across; the prototype folder is reference only and is not
   deployed.
   ============================================================ */
(function(){

  /* ---- timing knobs. TURN_MS is one diagonal quarter-turn, SETTLE_MS is the
     beat it rests on afterwards. The prototype ran a fixed 6s 4-turn loop
     (1230ms turn / 270ms settle); the loader wants to be quicker off the mark
     and to rest more obviously before handing over, hence the shorter turn and
     the longer settle. Raise SETTLE_MS if the pause before the page appears
     still feels rushed. */
  var TURN_MS   = 900;   // one simultaneous 90°-X + 90°-Y turn
  var SETTLE_MS = 380;   // rest on the landed pose before turning again / releasing
  var MIN_TURNS = 1;     // always play at least one full turn, even on an instant load
  var MAX_TURNS = 8;     // safety cap in case body.ready somehow never arrives

  function hasWebGL(){
    try{
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch(e){ return false; }
  }
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if(navigator.connection && navigator.connection.saveData) return;
  if(!hasWebGL()) return;

  var mark = document.querySelector(".ld-mark");
  var flatLogo = document.querySelector(".ld-logo");
  var loaderEl = document.getElementById("loader");
  if(!mark || !flatLogo || !loaderEl) return;

  function pageStillLoading(){ return !document.body.classList.contains("ready"); }

  /* ---- binary STL -> two vertex lists, split by face normal ----
     A face whose normal is dominated by one axis (|n| > 0.99 on x, y or z) is
     one of the cube's flat faces; anything else is part of the sphere cut
     through it. Splitting them here lets each get its own material, which is
     what makes the recess read as depth instead of a flat silhouette.
     Positions are centred on the geometry's own bounding box (the prototype
     hard-coded -127 for a 0..254 cube; deriving it means a re-exported STL at
     a different scale still centres correctly). */
  function parseSTL(buf){
    var dv = new DataView(buf);
    var triCount = dv.getUint32(80, true);
    // sanity check: a malformed/ASCII STL would make this wildly wrong
    if(84 + triCount*50 !== buf.byteLength) return null;

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
      return arr;
    }
    // half the space diagonal, i.e. the furthest any corner swings from centre
    // mid-tumble. The ortho frustum is sized off this so nothing ever clips.
    var sx = max[0]-min[0], sy = max[1]-min[1], sz = max[2]-min[2];
    var radius = Math.sqrt(sx*sx + sy*sy + sz*sz) / 2;

    return { flat: centre(flat), curved: centre(curved), radius: radius };
  }

  function loadScript(src, ok, fail){
    var s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  }

  loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", function(){
    if(!pageStillLoading()) return;   // the page beat us to it, don't bother
    fetch("logo/3d-logo.stl").then(function(r){ return r.arrayBuffer(); })
      .then(function(buf){
        if(!pageStillLoading()) return;
        var parsed = parseSTL(buf);
        if(!parsed) return;
        init(parsed);
      })
      .catch(function(){ /* keep the flat mark, no harm done */ });
  }, function(){ /* CDN unreachable, keep the flat mark */ });

  function init(parsed){
    var canvas = document.createElement("canvas");
    canvas.className = "ld-3d";
    mark.appendChild(canvas);

    var renderer;
    try{
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch(e){ canvas.remove(); return; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();

    // ORTHOGRAPHIC, per the prototype: no perspective foreshortening, so the
    // mark stays flat and drawn-looking rather than photographic as it turns.
    // The frustum is padded past the geometry's space-diagonal radius so a
    // corner mid-tumble never clips the edge of the box.
    var FRUST = parsed.radius * 1.06;
    var camera = new THREE.OrthographicCamera(-FRUST, FRUST, FRUST, -FRUST, 1, parsed.radius * 20);
    camera.position.set(0, 0, parsed.radius * 4);
    camera.lookAt(0, 0, 0);

    // key from the upper LEFT front with low ambient, so the sphere's recessed
    // interior walls fall into shadow and the cut reads as a real void.
    scene.add(new THREE.AmbientLight(0xffffff, 0.34));
    var key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(-0.6, 0.8, 1.1);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.18);
    fill.position.set(0.7, -0.5, 0.4);
    scene.add(fill);

    function meshFrom(arr, colour, roughness){
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
      g.computeVertexNormals();
      var m = new THREE.MeshStandardMaterial({
        color: colour, roughness: roughness, metalness: 0.12, side: THREE.DoubleSide
      });
      return { mesh: new THREE.Mesh(g, m), geo: g, mat: m };
    }

    var group = new THREE.Group();
    // the two materials are nearly the same ink; the difference that actually
    // does the work is the roughness split plus the lighting above.
    var cube   = meshFrom(parsed.flat,   0x141414, 0.32);
    var sphere = meshFrom(parsed.curved, 0x161616, 0.30);
    group.add(cube.mesh);
    group.add(sphere.mesh);
    scene.add(group);

    function resize(){
      var w = mark.clientWidth || 104, h = mark.clientHeight || 104;
      renderer.setSize(w, h, false);
      var a = w / h;
      camera.left = -FRUST * a; camera.right = FRUST * a;
      camera.top = FRUST; camera.bottom = -FRUST;
      camera.updateProjectionMatrix();
    }

    // the canvas and the flat mark are the SAME size (one --ld-size in the CSS),
    // so nothing resizes at the handoff - see the note by .ld-mark in style.css.
    resize();
    if(window.ResizeObserver){
      var ro = new ResizeObserver(resize);
      ro.observe(mark);
    } else {
      window.addEventListener("resize", resize);
    }

    // Pin the loader fully visible, overriding the page's own body.ready CSS
    // fade (an inline style beats a class-selector rule), until the sequence
    // below reaches a settle AND the page is ready.
    loaderEl.style.opacity = "1";

    /* ---- the tumble ----
       Each segment turns 90° about X and 90° about Y simultaneously. The four
       (X,Y) sign pairs below cycle so the mark works its way around the cube's
       symmetries rather than rocking between two poses; after four segments it
       is back where it started, so running on indefinitely stays seamless.
       Every landing is a cube symmetry, which is why any settle is a valid
       place to stop. */
    var AXIS_X = new THREE.Vector3(1, 0, 0);
    var AXIS_Y = new THREE.Vector3(0, 1, 0);
    var DIRX = [ 1, -1,  1, -1];
    var DIRY = [ 1,  1, -1, -1];
    var HALF_PI = Math.PI / 2;
    function easeInOutCubic(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2; }

    var qBase = new THREE.Quaternion();   // the settled pose the current turn starts from
    var qx = new THREE.Quaternion(), qy = new THREE.Quaternion(), qStep = new THREE.Quaternion();

    function applyTurn(seg, e){
      qy.setFromAxisAngle(AXIS_Y, e * DIRY[seg] * HALF_PI);
      qx.setFromAxisAngle(AXIS_X, e * DIRX[seg] * HALF_PI);
      qStep.copy(qx).multiply(qy);
      group.quaternion.copy(qStep).multiply(qBase);
    }

    var turnCount = 0, phase = "settle", phaseElapsed = 0, released = false;
    applyTurn(0, 0);   // start settled on the front face

    /* ---- the handoff from the flat mark to WebGL ----
       The static SVG mark and the model's front-on pose are the same silhouette
       (a square with a circular hole), and the animation starts settled in
       exactly that pose - so the flat mark IS the animation's first frame.
       Order matters here: render ONE frame first so the canvas actually has
       that pose in it, THEN fade the canvas up over the still-visible flat
       mark, and only hide the flat mark once the fade is done. Hiding it first
       (which is what this did before) left a frame or two of bare paper and
       read as a flicker. */
    renderer.render(scene, camera);
    canvas.style.opacity = "1";
    setTimeout(function(){ flatLogo.style.display = "none"; }, 260);

    var lastTs = null, rafId = null, stopped = false;
    function frame(ts){
      if(stopped) return;
      if(lastTs === null) lastTs = ts;
      var dt = Math.min(ts - lastTs, 50);   // ms, clamped so a stalled tab can't jump the animation
      lastTs = ts;

      if(!released){
        phaseElapsed += dt;
        if(phase === "turn"){
          var seg = turnCount % 4;
          var t = Math.min(phaseElapsed / TURN_MS, 1);
          applyTurn(seg, easeInOutCubic(t));
          if(phaseElapsed >= TURN_MS){
            // land EXACTLY on the settled quaternion and make it the new base,
            // so repeated turns can't accumulate float drift off the symmetry
            applyTurn(seg, 1);
            qBase.copy(group.quaternion);
            turnCount++;
            phase = "settle";
            phaseElapsed = 0;
          }
        } else {   // "settle" - the only phase the loader is ever allowed to release from
          if(phaseElapsed >= SETTLE_MS){
            var pageReady = document.body.classList.contains("ready");
            if(turnCount >= MIN_TURNS && (pageReady || turnCount >= MAX_TURNS)){
              released = true;
              loaderEl.style.opacity = "";   // hand back to the body.ready CSS rule, which now fades it
            } else {
              phase = "turn";
              phaseElapsed = 0;
            }
          }
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    // stop rendering and free the WebGL context shortly after the loader is
    // actually released to fade (its own fade is 650ms) - no point spending
    // GPU/battery animating something nobody can see anymore.
    (function waitForReleased(){
      if(released){
        setTimeout(function(){
          stopped = true;
          if(rafId) cancelAnimationFrame(rafId);
          renderer.dispose();
          cube.geo.dispose(); cube.mat.dispose();
          sphere.geo.dispose(); sphere.mat.dispose();
        }, 700);
      } else {
        requestAnimationFrame(waitForReleased);
      }
    })();
  }
})();
