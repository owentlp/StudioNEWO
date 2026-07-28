/* ============================================================
   LOADING SCREEN · 3D LOGO (progressive enhancement)
   ------------------------------------------------------------
   2026-07-22: replaced the old flat pulsing mark + red spinning
   sweep line entirely, per Owen. Rewritten twice more the same
   day, also per Owen - first to a fixed hold/turn/hold/turn/hold
   sequence (always two 90° turns), then to the current ADAPTIVE
   version below, because the fixed version always played both
   turns even on a fast load. The loader now shows either the
   flat static logo mark (.ld-mark > .ld-logo, instant-paint +
   true fallback, no animation of its own), or - once three.js
   and the STL both load in time - a real 3D render that plays:
   hold on the front face, turn 90°, hold - and stops there if the
   page is ready. If it isn't, it does another turn+hold, and
   another, one at a time, until the page is ready. So the normal
   case is exactly one 90° turn; extra turns only happen on a
   slow connection/big first paint, which is exactly the "if it
   needs more time to load then more will be necessary" Owen
   asked for. It never stops mid-turn, only ever on a resting
   "logo" pose (see MIN_TURNS/MAX_TURNS in init() below).

   IMPORTANT DEPARTURE FROM THE USUAL RULE: everywhere else on
   this site, loading-screen/decorative work is built to never
   delay the page (see js/loader3d.js history and HANDOFF.txt).
   This sequence is a deliberate exception Owen asked for: once
   the 3D mark is actually running, the loader is held fully
   visible (via an inline opacity override on #loader, which beats
   the body.ready CSS fade) until at least one full turn+hold has
   played AND the page itself is ready - whichever is later. On a
   typical fast load that's just the one turn (~1.15s of motion
   plus its two holds); it only runs longer when the page actually
   needs longer. This trade-off (guaranteed animation-through vs.
   fastest-possible reveal) was an explicit ask, not an oversight.

   If WebGL isn't available, the visitor has reduced-motion or
   data-saver on, or the CDN script / STL fetch fails, none of
   this applies - it quietly does nothing and the flat static
   mark (with the page's normal, un-delayed reveal timing) is all
   anyone sees.

   Bring your own THREE: loads three.js r128 from cdnjs, plus a small
   hand-rolled binary STL parser below (instead of pulling in the separate
   STLLoader addon file, one less thing that can 404) since the STL only
   needs its raw triangle data, nothing STLLoader does beyond that.

   Source geometry: logo/3d-logo.stl. Owen also supplied a GLTF
   export (3d-logo.gltf + data.bin) of the same model, but it uses
   Draco mesh compression, which would need a separate DRACOLoader
   + WASM decoder loaded as an ES module - a real architecture
   change from the plain <script> three.js setup used sitewide,
   for geometry that's otherwise identical to the STL already in
   place. Skipped for now; the STL stays the source of truth
   unless a reason to switch comes up later.
   ============================================================ */
(function(){
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

  // ---- binary STL -> {positions, normals} Float32Arrays, no external loader ----
  function parseSTL(buf){
    var dv = new DataView(buf);
    var triCount = dv.getUint32(80, true);
    // sanity check: a malformed/ASCII STL would make this wildly wrong
    if(84 + triCount*50 !== buf.byteLength) return null;
    var positions = new Float32Array(triCount*9);
    var normals   = new Float32Array(triCount*9);
    var off = 84;
    for(var i=0; i<triCount; i++){
      var nx=dv.getFloat32(off,true), ny=dv.getFloat32(off+4,true), nz=dv.getFloat32(off+8,true);
      off += 12;
      for(var v=0; v<3; v++){
        var vi = i*9 + v*3;
        positions[vi]   = dv.getFloat32(off,   true);
        positions[vi+1] = dv.getFloat32(off+4, true);
        positions[vi+2] = dv.getFloat32(off+8, true);
        normals[vi]=nx; normals[vi+1]=ny; normals[vi+2]=nz;
        off += 12;
      }
      off += 2; // attribute byte count, unused
    }
    return { positions: positions, normals: normals };
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
    var w = mark.clientWidth || 62, h = mark.clientHeight || 62;

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(parsed.positions, 3));
    geo.setAttribute("normal",   new THREE.BufferAttribute(parsed.normals, 3));
    geo.computeBoundingBox();
    var bb = geo.boundingBox, center = new THREE.Vector3(), size = new THREE.Vector3();
    bb.getCenter(center); bb.getSize(size);
    geo.translate(-center.x, -center.y, -center.z);
    var maxDim = Math.max(size.x, size.y, size.z) || 1;

    var canvas = document.createElement("canvas");
    canvas.className = "ld-3d";
    mark.appendChild(canvas);

    var renderer;
    try{
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch(e){ canvas.remove(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(28, w/h, 0.1, maxDim*10);
    camera.position.set(0, 0, maxDim*2.15);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.68));
    var key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(0.6, 0.9, 1.2);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.22);
    fill.position.set(-0.8, -0.3, 0.6);
    scene.add(fill);

    var mat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.6, metalness: 0.04 });
    var mesh = new THREE.Mesh(geo, mat);
    // starts at rotation (0,0,0): the STL's own front/top/side views are all
    // identical (square with an inscribed circle cut through on every axis),
    // same silhouette as the flat 2D mark, so this pose already "starts on
    // the front face" with no calibration rotation needed - and, because of
    // that same symmetry, landing on a 90°/180° turn also reads as "the
    // logo" again rather than some odd in-between angle.
    scene.add(mesh);

    // now that the 3D mark can actually show something, hide the flat one
    // and reveal the canvas together, so there's no double-image frame.
    flatLogo.style.display = "none";
    canvas.style.opacity = "1";

    // Pin the loader fully visible, overriding the page's own body.ready
    // CSS fade (an inline style beats a class-selector rule), until the
    // choreographed sequence below finishes AND the page is actually ready.
    // See the file header for why this is a deliberate exception to the
    // "never delay the page" rule used everywhere else.
    loaderEl.style.opacity = "1";

    var EASE = function(t){ return t*t*(3-2*t); };            // smoothstep, ease-in-out
    var HOLD_MS = 600;      // beat on each resting "logo" pose
    var ROTATE_MS = 550;    // one 90° turn
    var MIN_TURNS = 1;      // always play at least one turn, even on the fastest load
    var MAX_TURNS = 8;      // hard safety cap, in case body.ready never appears - should never
                             // actually get hit given the page's own reveal() hard caps

    // Adaptive, not a fixed-length sequence: hold on the front face, do one
    // 90° turn, hold again - and release right there if the page is ready.
    // If it isn't (slow connection, big first paint, whatever), keep doing
    // one more turn+hold at a time until it is. So the common case is
    // exactly one turn; extra turns only happen when the page genuinely
    // needs the extra time, per Owen's ask.
    var turnCount = 0, phaseType = "hold", phaseElapsed = 0;
    var rotateFrom = 0, rotateTo = 0, released = false;
    mesh.rotation.y = 0;

    var lastTs = null, rafId = null, stopped = false;
    function frame(ts){
      if(stopped) return;
      if(lastTs === null) lastTs = ts;
      var dt = Math.min((ts - lastTs) / 1000, 0.05) * 1000; // ms
      lastTs = ts;

      if(!released){
        phaseElapsed += dt;
        if(phaseType === "rotate"){
          var t = Math.min(phaseElapsed / ROTATE_MS, 1);
          mesh.rotation.y = rotateFrom + (rotateTo - rotateFrom) * EASE(t);
          if(phaseElapsed >= ROTATE_MS){
            mesh.rotation.y = rotateTo; // land exactly, no float drift
            turnCount++;
            phaseType = "hold";
            phaseElapsed = 0;
          }
        } else { // "hold"
          if(phaseElapsed >= HOLD_MS){
            var pageReady = document.body.classList.contains("ready");
            if(turnCount >= MIN_TURNS && (pageReady || turnCount >= MAX_TURNS)){
              released = true;
              loaderEl.style.opacity = ""; // hand back to the body.ready CSS rule, which now fades it
            } else {
              rotateFrom = mesh.rotation.y;
              rotateTo = rotateFrom + Math.PI/2;
              phaseType = "rotate";
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
          geo.dispose();
          mat.dispose();
        }, 700);
      } else {
        requestAnimationFrame(waitForReleased);
      }
    })();
  }
})();
