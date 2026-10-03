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

/* ---- HEADER MARKS: HIDE ON SCROLL DOWN, SHOW ON SCROLL UP (2026-10-02) ----
   The logo and burger are fixed with no background, so while reading they sat
   on top of body text and photos. Scrolling down tucks them away; any scroll
   up brings them back. Always shown near the top, while the menu is open, and
   while either has keyboard focus. The CSS is with .site-home in style.css. */
(function(){
  var last = window.pageYOffset || 0, ticking = false, TOP = 80, NUDGE = 6;
  function menuOpen(){
    var o = document.getElementById("menu-overlay");
    return !!(o && o.classList.contains("open"));
  }
  function focused(){
    var a = document.activeElement;
    return !!(a && a.closest && a.closest(".site-home, #burger"));
  }
  function set(hide){ document.body.classList.toggle("hdr-hidden", hide); }
  function update(){
    ticking = false;
    var y = window.pageYOffset || 0, dy = y - last;
    if(y < TOP || menuOpen() || focused()){ set(false); last = y; return; }
    if(Math.abs(dy) < NUDGE) return;          // ignore jitter, keep the reference point
    set(dy > 0);
    last = y;
  }
  window.addEventListener("scroll", function(){
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }, { passive:true });
  document.addEventListener("focusin", function(e){
    if(e.target.closest && e.target.closest(".site-home, #burger")) set(false);
  });
})();

/* ---- JUSTIFIED PARAGRAPHS: PICK THE WIDTH WITH THE SMALLEST GAPS (2026-10-02) ----
   Body text is justified, so a line with few words spreads them apart. The body
   font (OCR-B) is monospaced, which means the browser's line breaks can be
   simulated exactly from character counts. For each justified paragraph this
   tries every width from its full column down to 15% narrower, one character at
   a time, and keeps the one whose WORST line has the smallest gap per space
   (ties go to the wider width). Re-run on resize, since the best width changes
   with the window. Paragraphs in proportional fonts are left alone.
   Alignment and type size are unchanged: only a max-width is set. */
(function(){
  var MIN_CHARS = 120, SHRINK = 0.15, monoCache = {};
  function charWidth(cs){
    var key = cs.font + "|" + cs.letterSpacing;
    if(key in monoCache) return monoCache[key];
    var sp = document.createElement("span");
    sp.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font:" + cs.font + ";letter-spacing:" + cs.letterSpacing;
    document.body.appendChild(sp);
    function w(t){ sp.textContent = new Array(41).join(t); return sp.getBoundingClientRect().width / 40; }
    var a = w("i"), b = w("W"), s = w(" ");
    sp.remove();
    return (monoCache[key] = (Math.abs(a - b) < 0.01 && Math.abs(a - s) < 0.01) ? a : 0);
  }
  // break opportunities: spaces, and after a hyphen inside a word (as the browser does)
  function tokens(text){
    var out = [];
    text.replace(/\s+/g, " ").trim().split(" ").forEach(function(word){
      var parts = [], cur = "";             // split after each inner hyphen (no lookbehind: old Safari)
      for(var k = 0; k < word.length; k++){
        cur += word[k];
        if(word[k] === "-" && k < word.length - 1){ parts.push(cur); cur = ""; }
      }
      parts.push(cur);
      parts.forEach(function(p, i){ out.push({ len: p.length, space: i === 0 }); });
    });
    if(out.length) out[0].space = false;
    return out;
  }
  // worst extra space per gap (in characters) over every line but the last
  function badness(toks, cols){
    var worst = 0, len = 0, gaps = 0, sum = 0;
    for(var i = 0; i < toks.length; i++){
      var t = toks[i], add = (len && t.space ? 1 : 0) + t.len;
      if(len && len + add > cols){
        var extra = cols - len;
        var per = gaps ? extra / gaps : (extra > 0 ? cols : 0);
        if(per > worst) worst = per;
        sum += per * per;
        len = t.len; gaps = 0;
      } else {
        if(len && t.space) gaps++;
        len += add;
      }
    }
    return worst * 1000 + sum;                 // worst line first, then the total
  }
  function fitOne(p){
    if(p.dataset.fit) p.style.maxWidth = "";
    var cs = getComputedStyle(p);
    if(cs.textAlign !== "justify" || !p.offsetParent) return false;
    var cw = charWidth(cs); if(!cw) return false;
    var text = p.textContent; if(text.length < MIN_CHARS) return false;
    var maxCols = Math.floor((p.clientWidth + 0.01) / cw); if(maxCols < 16) return false;
    var toks = tokens(text), best = maxCols, bestScore = badness(toks, maxCols);
    for(var c = maxCols - 1; c >= Math.ceil(maxCols * (1 - SHRINK)); c--){
      var sc = badness(toks, c);
      if(sc < bestScore - 0.5){ best = c; bestScore = sc; }
    }
    if(best < maxCols){ p.style.maxWidth = (best * cw + 0.5).toFixed(1) + "px"; p.dataset.fit = "1"; }
    else { delete p.dataset.fit; }
    return true;
  }
  var busy = false;
  function fitAll(){
    if(busy) return; busy = true;
    var changed = false;
    document.querySelectorAll(".desc, .info-panel-in, .lead").forEach(function(p){
      var before = p.style.maxWidth;
      fitOne(p);
      if(p.style.maxWidth !== before) changed = true;
    });
    busy = false;
    // layout that measures paragraph heights (the how-it-works pull on project
    // pages, the 3D model overlap) re-runs on resize, so give it one
    if(changed) window.dispatchEvent(new Event("resize"));
  }
  var t = null;
  function later(ms){ clearTimeout(t); t = setTimeout(fitAll, ms); }
  window.NEWO_FIT = fitAll;
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){ later(0); });
  window.addEventListener("load", function(){ later(50); });
  window.addEventListener("resize", function(){ if(!busy) later(160); }, { passive:true });
  // panels that open on click (the small "i", Process and detail) change what is visible
  document.addEventListener("click", function(){ later(120); });
})();
