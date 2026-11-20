/* MECHANISM HINT AND TOUCH (Owen, 14 Nov 2026). Shared by every
   projects/<id>/mechanism.html; nothing in here names a product.

   Each frame says what its drawing does, on its .stage element:
     data-drag="yes"   the drawing can be dragged (a marker, a cursor, a flow)
     data-drag="no"    nothing on it to drag, only its buttons and sliders:
                       no DRAG / TOUCH TO INTERACT label and no drag; on touch
                       the page scrolls straight through it ("no need for a
                       drag to interact with omni graphic", Owen 14 Nov)
     data-hint-in=".ui"  where the label sits: first in that element, in the
                       text flow beside the caption (last with
                       data-hint-pos="last"). Without it the label goes in the
                       flow straight after the stage.

   The label is plain 8.5px text and is never on the drawing, never a box and
   never a button (Owen, 13 and 16 Nov 2026: "it doesnt need to be a button, i
   want it to be a tap on the mechanism graphic to wake it").

   Mouse: the label fades on the first drag, as before.
   Touch ("tap to wake", Owen 14 Nov): the drawing starts ASLEEP. The page
   scrolls through it and touches do not reach it; the label stays. One tap
   anywhere on the drawing wakes it: then it takes drags and touches, and the label takes
   the chosen text-link look (ink, red underline; no box, no outline). It
   sleeps again when it scrolls out of view (the parent's mechVisible message)
   or on a tap anywhere outside it (the parent's mechSleep message, sent by
   js/project.js). Buttons, sliders and links work asleep or awake. */
(function(){
  var stage = document.querySelector(".stage");
  if(!stage || stage.getAttribute("data-drag") === "no") return;

  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  var cv = document.getElementById("c") || stage.querySelector("canvas, svg");
  var h = document.createElement("div");
  h.className = "hint";
  h.textContent = coarse ? "TOUCH TO INTERACT" : "DRAG TO INTERACT";
  var inSel = stage.getAttribute("data-hint-in"), host = inSel && document.querySelector(inSel);
  var last = stage.getAttribute("data-hint-pos") === "last";
  // position, transform and size come from each frame's own .hint rule (review 16 Nov 2026, S9);
  // only the margin is set here, because it depends on where the label was put
  h.style.margin = last ? "0" : "0 0 10px";
  if(host) host.insertBefore(h, last ? null : host.firstChild);
  else stage.parentNode.insertBefore(h, stage.nextSibling);

  if(!coarse){
    var gone = function(){ h.classList.add("gone"); };
    stage.addEventListener("pointerdown", gone, { once:true });
    stage.addEventListener("pointermove", function(e){ if(e.pointerType === "mouse") gone(); }, { once:true });
    return;
  }

  // the awake look: the chosen state of the site's text links
  var st = document.createElement("style");
  st.textContent = ".hint.on{color:#141414;opacity:1;text-decoration:underline;text-decoration-color:#e2191b;" +
                   "text-decoration-thickness:1.5px;text-underline-offset:4px;}";
  document.head.appendChild(st);

  var awake = false, down = null;
  var surfaces = [stage].concat(cv ? [cv] : []);
  function set(a){
    awake = a;
    h.classList.toggle("on", a);
    // asleep, a vertical swipe is the page's; awake, every touch is the drawing's
    surfaces.forEach(function(el){ el.style.touchAction = a ? "none" : "pan-y"; });
    if(window.parent !== window){ try { window.parent.postMessage({ type:"mechAwake", awake:a }, "*"); } catch(e){} }
  }
  set(false);

  function isControl(t){ return !!(t && t.closest && t.closest("button, input, select, textarea, a, label")); }
  // capture on window runs before the drawing's own listeners: asleep, touch
  // input stops here (a tap is measured first, to wake it)
  ["pointerdown", "pointermove", "pointerup", "pointerover", "pointerenter", "pointerout", "pointerleave"].forEach(function(type){
    window.addEventListener(type, function(e){
      if(e.pointerType === "mouse" || awake || isControl(e.target)) return;
      if(type === "pointerdown") down = { x:e.clientX, y:e.clientY, t:performance.now() };
      if(type === "pointerup" && down){
        var dx = e.clientX - down.x, dy = e.clientY - down.y;
        if(dx * dx + dy * dy < 144 && performance.now() - down.t < 700) set(true);
        down = null;
      }
      e.stopImmediatePropagation();
    }, true);
  });
  window.addEventListener("pointercancel", function(){ down = null; }, true);   // the page took the swipe
  window.addEventListener("message", function(ev){
    var d = ev.data;
    if(!d || !awake) return;
    if((d.type === "mechVisible" && !d.visible) || d.type === "mechSleep") set(false);
  });
})();
