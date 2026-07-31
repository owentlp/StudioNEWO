/* ============================================================
   LOADER 3D · WORKER
   ------------------------------------------------------------
   Runs the whole loader animation on a WORKER THREAD, drawing into an
   OffscreenCanvas transferred from the page.

   WHY THIS EXISTS
   The loader animates during the single busiest moment of the page's life:
   HTML parsing, font loading, image decoding, and on project pages
   model-viewer's ~700KB parse all land in the same window. On the main
   thread the animation was competing with all of it for the same thread, so
   it stuttered - not because the animation is expensive (it is not) but
   because nothing can paint while the main thread is blocked.

   A worker has its own thread. Page work cannot stall it, full stop. That is
   the only way to actually guarantee this animation is smooth rather than
   just cheaper.

   Everything here is DOM-free. The main thread keeps the DOM parts (pinning
   the loader, fading the canvas in) and talks to this file by message.
   ============================================================ */
"use strict";

var THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

var renderer = null, view = null, tumble = null, core = null;
var canvas = null, dpr = 1, cssSize = 0;
var pageReady = false, released = false, stopped = false;
var turnCount = 0, phase = "settle", phaseElapsed = 0, lastTs = null;

function fail(why){
  try { self.postMessage({ type: "failed", why: String(why || "") }); } catch(e){}
  stopped = true;
}

self.onmessage = function(ev){
  var d = ev.data || {};
  if(d.type === "init")      init(d);
  else if(d.type === "resize")    { dpr = d.dpr; cssSize = d.cssSize; applySize(); }
  else if(d.type === "pageReady") pageReady = true;
  else if(d.type === "stop")      { stopped = true; cleanup(); }
};

function applySize(){
  if(!renderer || !view || !cssSize) return;
  // The canvas is OVERSCAN times the mark: the ortho frustum has to clear the
  // model's space diagonal so a corner never clips mid-tumble, but sitting
  // still it only shows its face. Sizing the canvas to the mark would draw the
  // logo at ~54% of the flat SVG it replaces. See loader3d-core.
  var px = Math.max(1, Math.round(cssSize * view.OVERSCAN * dpr));
  renderer.setSize(px, px, false);
  view.camera.left = -view.FRUST; view.camera.right = view.FRUST;
  view.camera.top  =  view.FRUST; view.camera.bottom = -view.FRUST;
  view.camera.updateProjectionMatrix();
}

function init(d){
  canvas  = d.canvas;
  dpr     = d.dpr || 1;
  cssSize = d.cssSize || 104;

  try { importScripts(THREE_SRC); }
  catch(e){ return fail("three.js unreachable: " + e); }

  try { importScripts(d.coreUrl); }
  catch(e){ return fail("core unreachable: " + e); }

  core = self.LOADER3D_CORE;
  if(!core || typeof THREE === "undefined") return fail("core or THREE missing");

  fetch(d.stlUrl)
    .then(function(r){ return r.arrayBuffer(); })
    .then(function(buf){
      if(stopped) return;
      var parsed = core.parseSTL(buf);
      if(!parsed) return fail("malformed STL");

      try {
        // Wrapped because three.js r128 predates OffscreenCanvas being common,
        // and a browser that advertises OffscreenCanvas can still refuse a
        // WebGL context on a worker thread. Any throw here hands the whole job
        // back to the main thread rather than leaving a dead loader.
        renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      } catch(e){ return fail("no worker WebGL: " + e); }

      renderer.setClearColor(0x000000, 0);
      view   = core.buildScene(THREE, parsed);
      tumble = core.makeTumble(THREE);
      applySize();

      tumble.apply(view.group, 0, 0);          // start settled, front-on
      renderer.render(view.scene, view.camera); // paint frame one before revealing
      self.postMessage({ type: "firstFrame" });

      requestAnimationFrame(frame);
    })
    .catch(function(e){ fail("STL fetch failed: " + e); });
}

function frame(ts){
  if(stopped) return;
  if(lastTs === null) lastTs = ts;
  var dt = Math.min(ts - lastTs, 100);   // clamped so a stall cannot jump the turn
  lastTs = ts;

  if(!released){
    phaseElapsed += dt;
    if(phase === "turn"){
      var seg = turnCount % 4;
      var t = Math.min(phaseElapsed / core.TURN_MS, 1);
      tumble.apply(view.group, seg, tumble.ease(t));
      if(phaseElapsed >= core.TURN_MS){
        tumble.apply(view.group, seg, 1);
        tumble.land(view.group);
        turnCount++;
        phase = "settle";
        phaseElapsed = 0;
      }
    } else {
      // "settle" - the ONLY phase the loader may be released from, so it never
      // hands over mid-turn
      if(phaseElapsed >= core.SETTLE_MS){
        if(turnCount >= core.MIN_TURNS && (pageReady || turnCount >= core.MAX_TURNS)){
          released = true;
          self.postMessage({ type: "released" });
        } else {
          phase = "turn";
          phaseElapsed = 0;
        }
      }
    }
  }

  renderer.render(view.scene, view.camera);

  // keep drawing briefly after release so the page's own fade-out has
  // something live under it, then stand down
  if(released){
    if(!frame._t) frame._t = ts;
    if(ts - frame._t > 800){ cleanup(); return; }
  }
  requestAnimationFrame(frame);
}

function cleanup(){
  stopped = true;
  try { if(view) view.dispose(); } catch(e){}
  try { if(renderer) renderer.dispose(); } catch(e){}
  renderer = null; view = null;
}
