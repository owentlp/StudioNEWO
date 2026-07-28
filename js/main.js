/* shared behaviour for inner pages: page reveal + layout guides.
   The top-right dropdown menu is built and wired entirely by js/menu.js now;
   the old menu toggle that used to live here was removed because it fought
   menu.js for control of #menu-overlay (one toggled a class, the other an
   inline display style), which made the menu open unreliably. */
(function(){
  var done = false, cap;
  function reveal(){ if(done) return; done = true; if(cap) clearTimeout(cap); document.body.classList.add("ready"); }
  // A page can take control of WHEN the loader lifts by setting
  // window.__DEFER_REVEAL = true before this script runs, then calling
  // window.__revealPage() once its own assets are ready (project.html does this
  // to wait for the hero image, hero video and 3D model so nothing pops in
  // after the loader clears). A hard cap still fires either way, so the loader
  // can never get stuck if an asset stalls.
  window.__revealPage = reveal;
  var defer = window.__DEFER_REVEAL === true;
  if(!defer){
    // default: reveal as soon as the document is parsed plus a short beat, so
    // the loader does not sit there waiting on full-resolution images.
    if(document.readyState !== "loading") setTimeout(reveal, 80);
    else document.addEventListener("DOMContentLoaded", function(){ setTimeout(reveal, 80); });
    window.addEventListener("load", reveal);   // safety net
  }
  cap = setTimeout(reveal, defer ? 12000 : 2500);   // hard cap either way
})();

/* ---- LAYOUT GUIDES ----------------------------------------------------------
   A visual aid for adjusting placements. Press the "g" key (or add ?guides to
   the URL) to overlay the 12-column grid and the page margin. It is display
   only and never ships anything visible to visitors unless they press g. Use it
   to read off which columns an image or text block should span, then set that
   span in js/projects-data.js (col / bleed / span) or in the CSS knobs.        */
(function(){
  var on = /[?&]guides\b/.test(location.search);
  var el = null;
  function build(){
    el = document.createElement("div");
    el.id = "grid-guides";
    var cols = "";
    for(var i=0;i<12;i++) cols += '<span></span>';
    el.innerHTML = '<div class="gg-cols">'+cols+'</div>';
    document.body.appendChild(el);
  }
  function apply(){
    if(on && !el) build();
    if(el) el.style.display = on ? "block" : "none";
  }
  document.addEventListener("keydown", function(e){
    if((e.key === "g" || e.key === "G") && !e.metaKey && !e.ctrlKey && !e.altKey){
      var t = e.target.tagName;
      if(t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
      on = !on; apply();
    }
  });
  if(on) document.addEventListener("DOMContentLoaded", apply);
})();
