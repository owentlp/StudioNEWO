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

/* ---- SHARED FOOTER ---------------------------------------------------------
   about / contact / materials / 404 carry an empty <footer class="site-foot"
   data-autofoot> and this fills its three marks by cloning the page's own
   header SVGs, so the logo, wordmark and burger paths exist once per page
   rather than a second time in the footer markup. project.html builds its
   footer the same way inside its own script, because there the whole page is
   rendered from data and the footer has to be appended after that.
   The footer burger opens the same panel as the header one - js/menu.js
   listens for "#burger, .foot-burger" through a delegated handler, so there is
   nothing to wire up here. */
(function(){
  function fill(){
    var foot = document.querySelector("footer.site-foot[data-autofoot]");
    if(!foot) return;
    var pairs = [
      [".foot-home",     ".site-home svg"],
      [".foot-wordmark", ".site-wordmark svg"],
      [".foot-burger",   "#burger svg"]
    ];
    pairs.forEach(function(pair){
      var slot = foot.querySelector(pair[0]);
      var src  = document.querySelector(pair[1]);
      if(slot && src && !slot.firstElementChild) slot.appendChild(src.cloneNode(true));
    });
  }
  if(document.readyState !== "loading") fill();
  else document.addEventListener("DOMContentLoaded", fill);
})();
