/* ============================================================
   LOADER 3D · SHARED CORE
   ------------------------------------------------------------
   The mesh decoding, a tiny WebGL renderer and the tumble maths, with NO DOM
   in them, so the exact same code can run in two places:

     · js/loader3d.worker.js  - inside a Web Worker, drawing to an
                                OffscreenCanvas (the normal path)
     · js/loader3d.js         - on the main thread (the fallback, for
                                browsers without OffscreenCanvas)

   Loaded by <script> on the main thread and by importScripts() in the
   worker, so it must not assume `window` exists - it hangs itself off
   whatever global object it finds.

   NO THREE.JS (2026-10-15). The loader used to download three.js (600 KB,
   148 KB gzipped) and the raw logo STL (177 KB, served uncompressed) before
   it could draw anything, which on a phone meant the 4s cap often fired first
   and the animation never showed. The geometry now comes pre-baked from
   js/loader3d-mesh.js (tools/bake-logo-mesh.py, ~25 KB gzipped) and is drawn
   by the ~100 lines below. The shading is three.js r128's MeshStandardMaterial
   maths (Lambert diffuse + GGX specular, linear output, no tone mapping) with
   the same lights, inks and roughness, so the mark looks the same.
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

  /* ---- baked mesh -> two flat-shaded triangle lists ----
     The bake keeps the old split: faces facing straight down an axis are the
     cube's flat sides (listed first), everything else is the sphere cut. Each
     gets its own material, which is what makes the recess read as depth.
     Normals are per face, as computeVertexNormals() gave on the old
     non-indexed geometry. `radius` (half the space diagonal) and `half` (half
     the widest face) size the camera and the canvas, as before. */
  CORE.decodeMesh = function(M){
    if(!M || !M.data) return null;
    var bin = atob(M.data), bytes = new Uint8Array(bin.length);
    for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var dv = new DataView(bytes.buffer);
    var nv = M.verts, idxOff = nv * 6;
    function pos(k, a){ return dv.getInt16(k*6 + a*2, true) * M.scale; }
    function build(firstTri, count){
      var out = new Float32Array(count * 18), o = 0;   // xyz + normal per vertex
      for(var t = firstTri; t < firstTri + count; t++){
        var a = dv.getUint16(idxOff + t*6, true), b = dv.getUint16(idxOff + t*6 + 2, true), c = dv.getUint16(idxOff + t*6 + 4, true);
        var ax = pos(a,0), ay = pos(a,1), az = pos(a,2);
        var bx = pos(b,0), by = pos(b,1), bz = pos(b,2);
        var cx = pos(c,0), cy = pos(c,1), cz = pos(c,2);
        // (C-B) x (A-B), the same winding three.js uses
        var ux = cx-bx, uy = cy-by, uz = cz-bz, vx = ax-bx, vy = ay-by, vz = az-bz;
        var nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
        var l = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
        nx /= l; ny /= l; nz /= l;
        out.set([ax,ay,az,nx,ny,nz, bx,by,bz,nx,ny,nz, cx,cy,cz,nx,ny,nz], o); o += 18;
      }
      return out;
    }
    var s = M.size;
    return {
      flat:   build(0, M.flatTris),
      curved: build(M.flatTris, M.curvedTris),
      radius: Math.sqrt(s[0]*s[0] + s[1]*s[1] + s[2]*s[2]) / 2,
      half:   Math.max(s[0], s[1], s[2]) / 2
    };
  };

  var VS = [
    "attribute vec3 p; attribute vec3 n;",
    "uniform mat3 R; uniform float F; uniform float D;",
    "varying vec3 vN;",
    "void main(){ vec3 q = R * p; vN = R * n;",
    // orthographic: x,y straight off the frustum, depth = distance from the camera
    "  gl_Position = vec4(q.xy / F, -q.z / D, 1.0); }"
  ].join("\n");

  // three.js r128 MeshStandardMaterial with non-physical lights: diffuse is
  // dotNL * light * albedo, specular is dotNL * light * PI * GGX(F,G,D)
  var FS = [
    "precision highp float;",
    "varying vec3 vN;",
    "uniform vec3 C; uniform float Rg;",
    "uniform vec3 L1; uniform vec3 L2;",
    "const float PI = 3.141592653589793;",
    "const float MET = 0.12;",
    "vec3 light(vec3 N, vec3 L, float I, vec3 dif, vec3 f0, float a){",
    "  vec3 V = vec3(0.0, 0.0, 1.0);",
    "  float nl = clamp(dot(N, L), 0.0, 1.0);",
    "  vec3 H = normalize(L + V);",
    "  float nv = clamp(dot(N, V), 0.0, 1.0), nh = clamp(dot(N, H), 0.0, 1.0), lh = clamp(dot(L, H), 0.0, 1.0);",
    "  float fr = exp2((-5.55473 * lh - 6.98316) * lh);",
    "  vec3 Fs = (1.0 - f0) * fr + f0;",
    "  float a2 = a * a;",
    "  float gv = nl * sqrt(a2 + (1.0 - a2) * nv * nv), gl = nv * sqrt(a2 + (1.0 - a2) * nl * nl);",
    "  float G = 0.5 / max(gv + gl, 1e-6);",
    "  float dn = nh * nh * (a2 - 1.0) + 1.0;",
    "  float Dg = a2 / (PI * dn * dn);",
    "  return nl * I * (dif + PI * Fs * G * Dg);",
    "}",
    "void main(){",
    "  vec3 N = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);",
    "  vec3 dif = C * (1.0 - MET);",
    "  vec3 f0 = mix(vec3(0.04), C, MET);",
    "  float r = max(Rg, 0.0525); float a = r * r;",
    "  vec3 col = 0.34 * dif;",
    "  col += light(N, L1, 1.0, dif, f0, a);",
    "  col += light(N, L2, 0.18, dif, f0, a);",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function norm(v){ var l = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]); return [v[0]/l, v[1]/l, v[2]/l]; }
  function hex(h){ return [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]; }

  /* ---- the renderer. Returns null if WebGL is refused, so the caller can
     fall back exactly as it did when three.js threw. ---- */
  CORE.createRenderer = function(canvas, parsed){
    var gl = null;
    try { gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true }); } catch(e){}
    if(!gl) return null;

    function sh(type, src){
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if(!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var aP = gl.getAttribLocation(prog, "p"), aN = gl.getAttribLocation(prog, "n");
    var u = {};
    ["R", "F", "D", "C", "Rg", "L1", "L2"].forEach(function(k){ u[k] = gl.getUniformLocation(prog, k); });

    var FRUST = parsed.radius * 1.06;
    gl.uniform1f(u.F, FRUST);
    gl.uniform1f(u.D, parsed.radius * 1.05);
    // directional lights point from their position toward the origin; the
    // camera sits on +Z with no rotation, so world space is view space
    gl.uniform3fv(u.L1, norm([-0.6, 0.8, 1.1]));
    gl.uniform3fv(u.L2, norm([0.7, -0.5, 0.4]));

    function part(arr, colour, rough){
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      return { buf: b, count: arr.length / 6, col: hex(colour), rough: rough };
    }
    // near-identical inks; the roughness split plus the lighting does the work
    var parts = [part(parsed.flat, 0x141414, 0.32), part(parsed.curved, 0x161616, 0.30)];

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    var size = 1;

    return {
      FRUST: FRUST,
      OVERSCAN: FRUST / (parsed.half || 1),   // ~1.84 for the current logo
      setSize: function(px){
        size = px;
        if(canvas.width !== px) canvas.width = px;
        if(canvas.height !== px) canvas.height = px;
      },
      // q = [x, y, z, w] rotation of the mark
      render: function(q){
        var x = q[0], y = q[1], z = q[2], w = q[3];
        gl.viewport(0, 0, size, size);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix3fv(u.R, false, [
          1 - 2*(y*y + z*z), 2*(x*y + z*w),     2*(x*z - y*w),
          2*(x*y - z*w),     1 - 2*(x*x + z*z), 2*(y*z + x*w),
          2*(x*z + y*w),     2*(y*z - x*w),     1 - 2*(x*x + y*y)
        ]);
        for(var i = 0; i < parts.length; i++){
          var pt = parts[i];
          gl.bindBuffer(gl.ARRAY_BUFFER, pt.buf);
          gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 24, 0);
          gl.enableVertexAttribArray(aN); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 24, 12);
          gl.uniform3fv(u.C, pt.col);
          gl.uniform1f(u.Rg, pt.rough);
          gl.drawArrays(gl.TRIANGLES, 0, pt.count);
        }
      },
      // give the context back now, not when the garbage collector gets to it:
      // browsers allow only a handful, and model-viewer wants one next
      dispose: function(){
        try {
          parts.forEach(function(pt){ gl.deleteBuffer(pt.buf); });
          gl.deleteProgram(prog);
          var ext = gl.getExtension("WEBGL_lose_context");
          if(ext) ext.loseContext();
        } catch(e){}
      }
    };
  };

  /* ---- the tumble ----
     Each segment turns 90 degrees about X and Y at once. The four sign pairs
     cycle so the mark works around the cube's symmetries rather than rocking
     between two poses. Every landing is a cube symmetry, which is why any
     settle is a valid place to stop. Quaternions are [x, y, z, w]. */
  function qmul(a, b){
    return [
      a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1],
      a[3]*b[1] - a[0]*b[2] + a[1]*b[3] + a[2]*b[0],
      a[3]*b[2] + a[0]*b[1] - a[1]*b[0] + a[2]*b[3],
      a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2]
    ];
  }
  CORE.makeTumble = function(){
    var DIRX = [ 1, -1,  1, -1];
    var DIRY = [ 1,  1, -1, -1];
    var HALF_PI = Math.PI / 2;
    var qBase = [0, 0, 0, 1];
    var T = {
      q: [0, 0, 0, 1],
      ease: function(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2; },
      apply: function(seg, e){
        var ax = e * DIRX[seg] * HALF_PI / 2, ay = e * DIRY[seg] * HALF_PI / 2;
        var qx = [Math.sin(ax), 0, 0, Math.cos(ax)];
        var qy = [0, Math.sin(ay), 0, Math.cos(ay)];
        T.q = qmul(qmul(qx, qy), qBase);
      },
      // land EXACTLY on the settled pose and make it the new base, so repeated
      // turns cannot accumulate float drift off the symmetry
      land: function(){ qBase = T.q.slice(); }
    };
    return T;
  };

  root.LOADER3D_CORE = CORE;
})(typeof self !== "undefined" ? self : this);
