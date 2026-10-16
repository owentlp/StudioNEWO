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

   No three.js since 2026-10-15: js/loader3d-core.js draws the mark with
   plain WebGL from js/loader3d-mesh.js, which tools/bake-logo-mesh.py bakes
   from the STL (~30 KB gzipped in all, against ~330 KB before).

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

  /* ---- THE PIN, and why it is set HERE and not in init() ----
     The loader is held fully visible by an inline opacity, which beats the
     body.ready CSS fade. That pin used to be set inside init(), i.e. only AFTER
     three.js had come down off the CDN and the STL had been fetched - roughly
     500-800ms in. But the page's own reveal() adds body.ready at about 350ms.
     So on a normal load the order was:

        350ms  body.ready lands, the loader STARTS FADING OUT
        ~600ms init() runs, sets opacity:1, the loader SNAPS BACK to full

     which is exactly the flicker: it begins to disappear, then jumps back.
     Pinning immediately, before the CDN request goes out, closes that window.

     The safety net matters just as much: if anything on the 3D path fails or
     is slow (no network, CDN blocked, bad STL, WebGL refuses a context) the
     pin MUST come off or the loader would sit there forever. Every failure
     path below calls unpin(), and PIN_CAP_MS is a backstop in case one is
     missed. */
  var PIN_CAP_MS = 4000;
  var pinned = false, started3d = false, pinCap = null;
  /* If the cap fires, the 3D path is ABANDONED, not just unpinned. The old
     code only unpinned, so on a cold cache (three.js + STL downloading inside
     the worker while the KART GLB hogs the connection) the animation could
     arrive AFTER the cap, start tumbling on an unpinned loader, and then
     body.ready would fade the loader out mid-turn - the "glitches out on a
     fresh tab" bug. Now a late 3D path is torn down and the loader simply
     fades out showing the flat 2D mark, which is always clean. */
  var capFired = false, abort3d = null;

  // where this script lives, so the worker can be pointed at its siblings
  // without hard-coding "/js/" (the pages sit at the site root today, but a
  // relative path survives being moved)
  var BASE = (function(){
    var s = document.currentScript;
    if(s && s.src) return s.src.replace(/[^\/]*$/, "");
    return new URL("js/", location.href).href;
  })();
  function pin(){
    if(pinned) return;
    pinned = true;
    /* body.ld-pinned: the home page keeps its cards and header hidden while the
       loader is held, so the page appears exactly as the loader lets go. */
    document.body.classList.add("ld-pinned");
    loaderEl.style.opacity = "1";
    /* visibility must be pinned TOO, not just opacity. css/style.css sets
       `body.ready #loader{opacity:0; visibility:hidden}` (visibility delayed to
       the end of the fade, so the finished loader stops costing the compositor
       a full-viewport layer). An inline opacity beats the opacity half of that
       rule, but says nothing about visibility - so as soon as body.ready landed
       the loader went invisible MID-TURN even though it was pinned, and the
       guaranteed full rotation never got shown. Pinning both is what keeps the
       animation on screen until this file decides to release it. */
    loaderEl.style.visibility = "visible";
    pinCap = setTimeout(function(){
      if(started3d) return;
      capFired = true;
      if(abort3d){ try { abort3d(); } catch(e){} abort3d = null; }
      unpin();
    }, PIN_CAP_MS);
  }
  function unpin(){
    if(!pinned) return;
    pinned = false;
    document.body.classList.remove("ld-pinned");
    if(pinCap){ clearTimeout(pinCap); pinCap = null; }
    loaderEl.style.opacity = "";      // hand back to the body.ready CSS rule
    loaderEl.style.visibility = "";   // ...including the delayed visibility flip

    /* Free the WebGL canvas once the loader has faded out.
       It is hooked HERE rather than to any one success path because the loader
       can be released several different ways (the worker finishing, the
       main-thread fallback finishing, PIN_CAP_MS firing, a failure bailing
       out) and every one of them ends up calling unpin(). Hanging it off a
       single path meant the canvas survived whenever a different path won,
       which is what was leaving a live WebGL context parked in a hidden loader
       for the rest of the session - on a project page the browser then wants
       another one for model-viewer, and contexts are a limited resource.
       Checked on a short RETRY rather than a single timer: unpin() can fire
       before the canvas has even been appended (the PIN_CAP backstop, or a
       fast release), and a one-shot timeout in that case finds nothing and
       gives up, leaving the canvas behind for good. A few cheap re-checks
       cover every ordering, and the first one lands after the loader's own
       650ms fade so nothing blanks early. */
    var tries = 0;
    var sweep = setInterval(function(){
      var c = loaderEl.querySelector("canvas.ld-3d");
      if(c){ try { c.remove(); } catch(e){} clearInterval(sweep); }
      else if(++tries > 8) clearInterval(sweep);   // ~3.6s, then stop looking
    }, 450);
  }
  /* ================= WHEN THE ANIMATION IS ALLOWED TO PLAY =================
     Owen's rule, 2026-09-16: the tumble is a LOADING animation, so it should
     only ever be the thing you watch while you are actually waiting.

       first time this page is opened  ->  play it, as before
       a page you have already opened  ->  play it ONLY if, two seconds in,
                                           the page still is not ready

     Before this, every page played the full ~2.5s sequence every time, so
     clicking through three projects cost about eight seconds at the logo even
     though everything after the first page was served from cache.

     "This page" is the path plus the ?p= project, so KART and NEB count
     separately. It is kept in sessionStorage, not localStorage: coming back
     tomorrow is a fresh visit and gets the animation again, and a stale flag
     can never permanently suppress it. Every access is wrapped - storage
     throws in a private window and can be disabled outright - and if it is
     unavailable we simply treat the page as new, which is the old behaviour. */
  var REVISIT_HOLD_MS = 2000;

  function pageKey(){
    var p = "";
    try { p = new URLSearchParams(location.search).get("p") || ""; } catch(e){}
    return "newo:seen:" + location.pathname + (p ? "?p=" + p : "");
  }
  function seenBefore(){
    try { return sessionStorage.getItem(pageKey()) === "1"; } catch(e){ return false; }
  }
  function markSeen(){
    try { sessionStorage.setItem(pageKey(), "1"); } catch(e){}
  }

  /* Set at the kickoff site further down: on a revisit the 3D path is not
     started at all until the hold below decides the page is genuinely slow. */
  var deferredKickoff = null;

  if(!seenBefore()){
    markSeen();
    pin();                       // first view of this page: unchanged
  } else {
    /* A revisit. Do NOT pin - if the page is ready quickly the loader should
       just fade on its own with the flat mark showing, and nothing 3D should
       ever be fetched or drawn. Only if we are still waiting at the hold does
       this become a loading screen worth animating. */
    setTimeout(function(){
      if(!pageStillLoading()) return;      // fast enough, no animation at all
      pin();
      if(deferredKickoff){ var k = deferredKickoff; deferredKickoff = null; k(); }
    }, REVISIT_HOLD_MS);
  }

  function loadScript(src, ok, fail){
    var s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  }

  /* ================= WORKER PATH (the normal one) =================
     Hand the whole animation to a worker thread via OffscreenCanvas. This is
     the actual fix for loader stutter: the animation stops sharing a thread
     with HTML parsing, font loading, image decoding and model-viewer's parse,
     so page work physically cannot stall it. Everything DOM stays here.

     If anything at all goes wrong - no OffscreenCanvas, worker blocked, no
     WebGL on the worker thread, core unreachable - it falls through to the
     main-thread version below, which is the code that shipped before. Nothing
     regresses; it just stops being smooth on those browsers. */
  var workerTried = false;
  function tryWorker(){
    workerTried = true;
    if(!window.Worker || !window.OffscreenCanvas) return false;

    var canvas = document.createElement("canvas");
    canvas.className = "ld-3d";
    if(typeof canvas.transferControlToOffscreen !== "function") return false;
    mark.appendChild(canvas);

    // sizing lives here because only the main thread can read layout; the
    // worker is told the numbers and never touches the DOM
    var cssSize = mark.clientWidth || 104;
    canvas.style.position = "absolute";
    canvas.style.left = "50%";
    canvas.style.top = "50%";
    canvas.style.transform = "translate(-50%, -50%)";

    var w;
    try { w = new Worker(BASE + "loader3d.worker.js?v=5"); }
    catch(e){ canvas.remove(); return false; }

    var handedOff;
    try { handedOff = canvas.transferControlToOffscreen(); }
    catch(e){ w.terminate(); canvas.remove(); return false; }

    var settled = false, aborted = false;
    abort3d = function(){
      aborted = true;
      try { w.terminate(); } catch(e){}
      try { canvas.remove(); } catch(e){}
      flatLogo.style.display = "";   // make sure the 2D mark is what fades out
    };
    w.onmessage = function(ev){
      var d = ev.data || {};
      if(aborted) return;
      if(d.type === "firstFrame"){
        if(d.overscan) OVERSCAN_EL = d.overscan;
        started3d = true;
        if(pinCap){ clearTimeout(pinCap); pinCap = null; }
        // size the element now that we know the overscan is applied worker-side
        sizeCanvasEl();
        // one frame exists, so fade it up over the still-visible flat mark and
        // only hide that once the fade is done - same handoff as the fallback
        void canvas.offsetWidth;
        canvas.style.opacity = "1";
        setTimeout(function(){
          flatLogo.style.display = "none";
          // ONLY NOW may the tumble start. The worker holds its settled first
          // pose until this arrives, so the mark never begins turning while it
          // is still cross-fading with the static logo underneath it.
          try { w.postMessage({ type: "begin" }); } catch(e){}
        }, 260);
      } else if(d.type === "released"){
        settled = true;
        /* Hand BACK to the 2D mark before the loader fades. The settled pose
           and the flat SVG are the same silhouette, so restoring the flat mark
           under the canvas and fading the canvas out is invisible - and it
           means the loader's own fade-out always shows the crisp 2D logo, with
           no live WebGL involved. Owen's spec: 2D -> 3D turn(s) -> rest as the
           2D logo -> fade out. */
        flatLogo.style.display = "";
        void canvas.offsetWidth;
        canvas.style.opacity = "0";
        setTimeout(function(){
          unpin();
          // The canvas is an OffscreenCanvas holding a live WebGL context, and
          // browsers allow only a handful of those per page - on KART the page
          // goes on to want one for model-viewer. Drop it as soon as the 2D
          // mark is back.
          try { w.terminate(); } catch(e){}
          try { canvas.remove(); } catch(e){}
        }, 240);
      } else if(d.type === "failed"){
        // worker could not do it: clean up and let the main-thread path try
        try { w.terminate(); } catch(e){}
        canvas.remove();
        flatLogo.style.display = "";
        if(!started3d){ startMainThread(); }
        else { unpin(); }
      }
    };
    w.onerror = function(){
      try { w.terminate(); } catch(e){}
      canvas.remove();
      flatLogo.style.display = "";
      if(!started3d) startMainThread(); else unpin();
    };

    // 1.836 is the value for the current logo; the worker reports the real
    // one (computed from the geometry) with its first frame, so a re-exported
    // STL can never leave the 3D mark a different size from the 2D one.
    var OVERSCAN_EL = 1.836;
    function sizeCanvasEl(){
      var s = mark.clientWidth || 104;
      var px = Math.round(s * OVERSCAN_EL);
      canvas.style.width = px + "px";
      canvas.style.height = px + "px";
    }
    sizeCanvasEl();

    w.postMessage({
      type: "init",
      canvas: handedOff,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      cssSize: cssSize,
      coreUrl: BASE + "loader3d-core.js?v=2",
      meshUrl: BASE + "loader3d-mesh.js?v=1"
    }, [handedOff]);

    // tell it when the page is ready; it releases at its next settle
    (function watchReady(){
      if(document.body.classList.contains("ready")){ w.postMessage({ type:"pageReady" }); return; }
      setTimeout(watchReady, 60);
    })();

    window.addEventListener("resize", function(){
      sizeCanvasEl();
      w.postMessage({ type:"resize", dpr: Math.min(window.devicePixelRatio || 1, 1.5), cssSize: mark.clientWidth || 104 });
    });

    return true;
  }

  function kickoff(){
    if(tryWorker()){
      mark.classList.add("has3d");
    } else {
      startMainThread();
    }
  }
  /* pinned is true only on a first view. On a revisit the kickoff is parked
     here and the hold above runs it if - and only if - the page is still
     loading two seconds in, so a cached page never pays for the mesh,
     a worker or a WebGL context at all. */
  if(pinned) kickoff();
  else deferredKickoff = kickoff;

  // ================= MAIN-THREAD FALLBACK =================
  function startMainThread(){
  // NOTE: every exit below unpins. The old code just returned, which was safe
  // only because the pin was set late; now that it is set up front, an
  // un-unpinned exit would freeze the loader on screen.
  /* BASE + ..., not a bare relative path. loadScript() appends a <script src>,
     and that resolves against the DOCUMENT, not against this file. BASE is
     this script's own directory (/js/), the same value the worker is given. */
  var CORE = null;
  loadScript(BASE + "loader3d-core.js?v=2", function(){
    loadScript(BASE + "loader3d-mesh.js?v=1", function(){
      if(!pageStillLoading() || capFired){ unpin(); return; }   // the page (or the cap) beat us to it
      CORE = window.LOADER3D_CORE;
      var parsed = CORE && CORE.decodeMesh(window.LOADER3D_MESH);
      if(!parsed){ unpin(); return; }
      init(parsed);
    }, function(){ unpin(); });
  }, function(){ unpin(); });

  function init(parsed){
    var canvas = document.createElement("canvas");
    canvas.className = "ld-3d";
    mark.appendChild(canvas);

    var renderer = null;
    try { renderer = CORE.createRenderer(canvas, parsed); } catch(e){}
    if(!renderer){ canvas.remove(); unpin(); return; }   // no WebGL context available
    /* Pixel ratio capped at 1.5, not 2: this runs during the busiest moment of
       the page's life on the main thread, and at this size the difference is
       not visible on a matte ink logo. */
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    /* ---- canvas sizing, and why the canvas is BIGGER than the mark ----
       The ortho frustum has to clear the model's space diagonal (220) so a
       corner never clips mid-tumble, but sitting still front-on the model only
       shows its face (half-width 127). So the mark fills just 127/233 = 54% of
       the canvas. Sizing the canvas to the mark - which is what this did before
       - therefore drew the 3D logo at 54% of the flat SVG's size, and for the
       ~260ms both were on screen you saw the small 3D square nested inside the
       big flat one. That was the flash.

       Fix: blow the canvas up by frustum/face so the front-on face lands at
       exactly --ld-size, and let the canvas overflow the mark (nothing clips
       it) to give the tumble its room back. Derived from the geometry rather
       than hard-coded, so a re-exported STL still lines up. */
    var OVERSCAN = renderer.OVERSCAN;   // ~1.84 for the current logo
    canvas.style.position = "absolute";
    canvas.style.left = "50%";
    canvas.style.top = "50%";
    canvas.style.transform = "translate(-50%, -50%)";

    function resize(){
      var m = mark.clientWidth || 104;
      var px = Math.round(m * OVERSCAN);
      canvas.style.width = px + "px";
      canvas.style.height = px + "px";
      renderer.setSize(Math.max(1, Math.round(px * DPR)));
    }

    resize();
    if(window.ResizeObserver){
      var ro = new ResizeObserver(resize);
      ro.observe(mark);
    } else {
      window.addEventListener("resize", resize);
    }

    // the 3D path made it: cancel the safety timer so the pin now stays on
    // until the tumble reaches a settle (see the release in frame() below).
    started3d = true;
    if(pinCap){ clearTimeout(pinCap); pinCap = null; }

    /* ---- the tumble ----
       Each segment turns 90° about X and 90° about Y simultaneously. The four
       (X,Y) sign pairs below cycle so the mark works its way around the cube's
       symmetries rather than rocking between two poses; after four segments it
       is back where it started, so running on indefinitely stays seamless.
       Every landing is a cube symmetry, which is why any settle is a valid
       place to stop. */
    var tumble = CORE.makeTumble();
    function applyTurn(seg, e){ tumble.apply(seg, e); }
    function easeInOutCubic(x){ return tumble.ease(x); }

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
    renderer.render(tumble.q);
    // A CSS transition only runs if the browser has computed a STARTING value
    // for the property first. The canvas was appended and its opacity set in
    // the same frame, so there was no starting value and the .22s fade was
    // skipped entirely - it cut in hard. Reading offsetWidth forces the style
    // flush that gives opacity:0 a chance to exist before we set it to 1.
    void canvas.offsetWidth;
    canvas.style.opacity = "1";
    // same handshake as the worker path: hold the settled pose until the flat
    // mark has finished fading out, so motion never overlaps the cross-fade.
    var begun = false;
    setTimeout(function(){
      flatLogo.style.display = "none";
      begun = true; lastTs = null;
    }, 260);

    var lastTs = null, rafId = null, stopped = false;
    function frame(ts){
      if(stopped) return;
      if(lastTs === null) lastTs = ts;
      var dt = Math.min(ts - lastTs, 50);   // ms, clamped so a stalled tab can't jump the animation
      lastTs = ts;
      if(!begun) dt = 0;                    // rendering, but not yet animating

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
            tumble.land();
            turnCount++;
            phase = "settle";
            phaseElapsed = 0;
          }
        } else {   // "settle" - the only phase the loader is ever allowed to release from
          if(phaseElapsed >= SETTLE_MS){
            var pageReady = document.body.classList.contains("ready");
            if(turnCount >= MIN_TURNS && (pageReady || turnCount >= MAX_TURNS)){
              released = true;
              // same hand-back as the worker path: restore the flat mark, fade
              // the canvas out over it, THEN release the loader - so the fade
              // always shows the 2D logo at rest, never live WebGL.
              flatLogo.style.display = "";
              void canvas.offsetWidth;
              canvas.style.opacity = "0";
              setTimeout(unpin, 240);
            } else {
              phase = "turn";
              phaseElapsed = 0;
            }
          }
        }
      }

      renderer.render(tumble.q);
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
          try { canvas.remove(); } catch(e){}
        }, 700);
      } else {
        requestAnimationFrame(waitForReleased);
      }
    })();
  }
  }   // end startMainThread
})();
