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

var renderer = null, tumble = null, core = null;
var canvas = null, dpr = 1, cssSize = 0;
var pageReady = false, released = false, stopped = false;
var turnCount = 0, phase = "settle", phaseElapsed = 0, lastTs = null;
/* The tumble does not start until the main thread says the handoff from the
   flat SVG mark to this canvas has FINISHED fading. Before this existed the
   worker began its clock the instant it rendered its first frame, so the mark
   could already be turning while it was still cross-fading with the static
   logo underneath - which is what read as the loader "bugging out". Holding
   here keeps the settled pose on screen through the whole fade, so the static
   mark and the model's first frame are the same picture, motionless, and the
   motion only begins once there is a single clean image to move. */
var begun = false;
var FADE_IN_MS = 260, beginAt = null;   // matches the canvas fade-in in loader3d.js
/* QUIET WINDOW (2026-10-26). While the page has asked for one (see
   NEWO_LOADER.quiet in js/loader3d.js), the mark does not start a new turn: it
   finishes the one it is in, lands, tells the page it is resting ("held"), and
   stays on that pose until "unhold". The page runs its GPU-heavy work (the 3D
   model's shader compile and texture uploads, the first paint of the page)
   inside that window. Those stall the GPU for every canvas on the page, this
   one included, which is what made the tumble choppy on a project page's first
   load. A stall while the mark sits still cannot be seen. */
var holdOn = false, heldSent = false;
/* Only draw when the pose has changed. A settled mark is the same picture every
   frame, and an OffscreenCanvas keeps showing its last frame when nothing new
   is drawn, so redrawing it only competes with the page for the GPU. */
var dirty = true;

function fail(why){
  try { self.postMessage({ type: "failed", why: String(why || "") }); } catch(e){}
  stopped = true;
}

self.onmessage = function(ev){
  var d = ev.data || {};
  if(d.type === "init")      init(d);
  else if(d.type === "resize")    { dpr = d.dpr; cssSize = d.cssSize; applySize(); }
  else if(d.type === "pageReady") pageReady = true;
  // sent once the flat mark has finished fading out on the main thread
  else if(d.type === "begin")     { if(!begun){ begun = true; lastTs = null; } }
  else if(d.type === "hold")      { holdOn = true; heldSent = false; }
  else if(d.type === "unhold")    { holdOn = false; }
  else if(d.type === "stop")      { stopped = true; cleanup(); }
};

function applySize(){
  if(!renderer || !cssSize) return;
  // The canvas is OVERSCAN times the mark: the ortho frustum has to clear the
  // model's space diagonal so a corner never clips mid-tumble, but sitting
  // still it only shows its face. Sizing the canvas to the mark would draw the
  // logo at ~54% of the flat SVG it replaces. See loader3d-core.
  renderer.setSize(Math.max(1, Math.round(cssSize * renderer.OVERSCAN * dpr)));
  dirty = true;   // resizing clears the canvas
}

function init(d){
  canvas  = d.canvas;
  dpr     = d.dpr || 1;
  cssSize = d.cssSize || 104;
  holdOn  = !!d.hold;

  // the core and the baked logo mesh, together ~30 KB gzipped (three.js and
  // the raw STL used to be ~330 KB before the first frame could draw)
  try { importScripts(d.coreUrl, d.meshUrl); }
  catch(e){ return fail("core unreachable: " + e); }

  core = self.LOADER3D_CORE;
  if(!core || !self.LOADER3D_MESH) return fail("core or mesh missing");
  if(stopped) return;
  var parsed = core.decodeMesh(self.LOADER3D_MESH);
  if(!parsed) return fail("bad mesh");

  // a browser that advertises OffscreenCanvas can still refuse a WebGL
  // context on a worker thread; that hands the job back to the main thread
  try { renderer = core.createRenderer(canvas, parsed); } catch(e){ renderer = null; }
  if(!renderer) return fail("no worker WebGL");

  tumble = core.makeTumble();
  applySize();

  tumble.apply(0, 0);                       // start settled, front-on
  renderer.render(tumble.q);                // paint frame one before revealing
  dirty = false;
  // main thread fades the canvas up over the flat mark, then replies
  // with {type:"begin"} to release the animation. See `begun` above.
  // overscan tells the main thread the true canvas/mark ratio for THIS
  // geometry, so the 3D mark always lands exactly the size of the 2D one
  self.postMessage({ type: "firstFrame", overscan: renderer.OVERSCAN });

  requestAnimationFrame(frame);
}

function frame(ts){
  if(stopped) return;
  if(lastTs === null) lastTs = ts;
  var dt = Math.min(ts - lastTs, 100);   // clamped so a stall cannot jump the turn
  lastTs = ts;

  // hold the settled first pose until the main thread has finished the fade.
  // The canvas keeps showing that pose; the clock just does not advance yet.
  /* 2026-10-26: the worker no longer waits on the page's "begin" alone. That
     message comes from a main-thread timer, and on a project page the main
     thread is busy parsing model-viewer right then, so the first turn could
     start late. FADE_IN_MS after its first frame the worker begins by itself;
     "begin" can still start it earlier, never later. */
  if(!begun){
    if(beginAt === null) beginAt = ts + FADE_IN_MS;
    if(ts >= beginAt) begun = true;
  }
  if(!begun) dt = 0;

  if(!released){
    phaseElapsed += dt;
    if(phase === "turn"){
      var seg = turnCount % 4;
      var t = Math.min(phaseElapsed / core.TURN_MS, 1);
      tumble.apply(seg, tumble.ease(t));
      dirty = true;
      if(phaseElapsed >= core.TURN_MS){
        tumble.apply(seg, 1);
        tumble.land();
        turnCount++;
        phase = "settle";
        phaseElapsed = 0;
      }
    } else {
      // "settle" - the ONLY phase the loader may be released from, so it never
      // hands over mid-turn
      if(phaseElapsed >= core.SETTLE_MS){
        if(holdOn){
          // resting through a quiet window: no new turn, and no release either,
          // until "unhold" (the page may be painting for the first time)
        } else if(turnCount >= core.MIN_TURNS && (pageReady || turnCount >= core.MAX_TURNS)){
          released = true;
          self.postMessage({ type: "released" });
        } else {
          phase = "turn";
          phaseElapsed = 0;
        }
      }
    }
  }

  // tell the page the mark is at rest, once per hold. Any settle counts,
  // including the first pose before the tumble has begun.
  if(holdOn && !heldSent && (phase === "settle" || released)){
    heldSent = true;
    self.postMessage({ type: "held" });
  }

  if(dirty){ renderer.render(tumble.q); dirty = false; }

  // stay alive until the loader has faded out with the mark, then stand down
  if(released){
    if(!frame._t) frame._t = ts;
    if(ts - frame._t > 1500){ cleanup(); return; }   // after the loader's 650ms fade
  }
  requestAnimationFrame(frame);
}

function cleanup(){
  stopped = true;
  try { if(renderer) renderer.dispose(); } catch(e){}
  renderer = null;
}
