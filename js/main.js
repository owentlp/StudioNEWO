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
  // window.__revealPage() once its own assets are ready (project pages do this
  // to wait for the hero photo and clip, fonts, mechanism and the 3D model's
  // reserved space; since 3 Nov 2026 not the model itself, see js/project.js
  // "MODEL LOAD"). A hard cap still fires either way, so the loader
  // can never get stuck if an asset stalls.
  window.__revealPage = reveal;
  var defer = window.__DEFER_REVEAL === true;
  if(!defer){
    /* default (3 Nov 2026, Owen: "everything else should be loaded ... I just
       dont want any lag or things visibly loading in"): once the document is
       parsed, wait for the fonts and for the photos in the first screen to be
       downloaded and decoded (never the ones further down), at most 1.8 s,
       then two frames so that first paint happens under the loader, then
       reveal. It used to reveal 80 ms after parsing, so on a revisit (no logo
       tumble to hide it) a photo or a font swap could land after the fade.
       The 3D logo, when it shows, still holds for its full turn (loader3d.js). */
    var gate = function(){
      var waits = [];
      if(document.fonts && document.fonts.ready) waits.push(document.fonts.ready.catch(function(){}));
      var vh = window.innerHeight || 800;
      Array.prototype.forEach.call(document.images, function(im){
        if(im.closest && im.closest("#loader")) return;
        var r = im.getBoundingClientRect();
        if(!r.width || r.bottom <= 0 || r.top >= vh) return;
        var d;
        try { d = im.decode ? im.decode() : null; } catch(e){ d = null; }
        if(d) waits.push(d.catch(function(){}));
      });
      Promise.race([Promise.all(waits), new Promise(function(res){ setTimeout(res, 1800); })]).then(function(){
        requestAnimationFrame(function(){ requestAnimationFrame(reveal); });
      });
    };
    if(document.readyState !== "loading") gate();
    else document.addEventListener("DOMContentLoaded", gate);
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
  var MIN_CHARS = 30, SHRINK = 0.15, monoCache = {};
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
  // the real gaps, measured from the rendered words (the simulation above cannot
  // see the browser's hyphenation): mean and worst gap per line, in spaces,
  // every line but the last (3 Nov 2026, exit test: mean gap under 2 spaces)
  function realGaps(p, sp){
    var words = [], tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT), n, rg = document.createRange();
    while((n = tw.nextNode())){
      var t = n.textContent, re = /\S+/g, m;
      while((m = re.exec(t))){
        rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        var rs = rg.getClientRects();
        for(var k = 0; k < rs.length; k++) if(rs[k].width > 0) words.push(rs[k]);
      }
    }
    // a word belongs to a line when its middle falls inside that line's band
    // (a smaller inline label sits a little higher but on the same line)
    var lines = [];
    words.forEach(function(r){
      var mid = (r.top + r.bottom) / 2, L = null;
      for(var i = 0; i < lines.length; i++) if(mid >= lines[i].t && mid <= lines[i].b){ L = lines[i]; break; }
      if(!L){ L = { t: r.top, b: r.bottom, w: [] }; lines.push(L); }
      L.w.push([r.left, r.right]);
    });
    lines.sort(function(a, b){ return a.t - b.t; });
    var sum = 0, cnt = 0, worst = 0;
    for(var i = 0; i < lines.length - 1; i++){
      var W = lines[i].w.sort(function(a, b){ return a[0] - b[0]; });
      for(var j = 1; j < W.length; j++){
        var g = (W[j][0] - W[j - 1][1]) / sp;
        if(g > 0.3){ sum += g; cnt++; if(g > worst) worst = g; }
      }
    }
    return { mean: cnt ? sum / cnt : 1, worst: worst || 1 };
  }
  function realScore(r){ return (r.mean >= 1.9 ? 100 : 0) + r.worst * 10 + r.mean; }
  function fitOne(p){
    if(p.dataset.fit) p.style.maxWidth = "";
    var cs = getComputedStyle(p);
    if(cs.textAlign !== "justify" || !p.offsetParent) return false;
    var cw = charWidth(cs); if(!cw) return false;
    var text = p.textContent; if(text.length < MIN_CHARS) return false;
    var maxCols = Math.floor((p.clientWidth + 0.01) / cw); if(maxCols < 16) return false;
    // never narrower than 31 characters (the measure floor), nor 15% under the column
    var minCols = Math.max(Math.ceil(maxCols * (1 - SHRINK)), Math.min(maxCols, 31));
    var toks = tokens(text), cands = [];
    for(var c = maxCols; c >= minCols; c--) cands.push({ c: c, sim: badness(toks, c) });
    // the simulation ranks the widths; the best few are then checked as rendered
    var ranked = cands.slice().sort(function(a, b){ return a.sim - b.sim || b.c - a.c; });
    var sim = ranked[0], best = sim.c;
    var spW = cw;                                // a space is one character in a monospace
    p.style.maxWidth = (sim.c * cw + 0.5).toFixed(1) + "px";
    var r = realGaps(p, spW);
    if(r.mean >= 1.9 || r.worst >= 3){
      var bestScore = realScore(r), tries = ranked.slice(1, 6);
      if(tries.every(function(t){ return t.c !== maxCols; })) tries.push(cands[0]);
      for(var i = 0; i < tries.length; i++){
        p.style.maxWidth = (tries[i].c * cw + 0.5).toFixed(1) + "px";
        var sc = realScore(realGaps(p, spW));
        if(sc < bestScore - 0.05){ bestScore = sc; best = tries[i].c; }
      }
    }
    if(best < maxCols){ p.style.maxWidth = (best * cw + 0.5).toFixed(1) + "px"; p.dataset.fit = "1"; }
    else { p.style.maxWidth = ""; delete p.dataset.fit; }
    return true;
  }
  var busy = false;
  function fitAll(){
    if(busy) return; busy = true;
    var changed = false;
    document.querySelectorAll(".desc, .info-panel-in, .info-panel-in > *, .lead").forEach(function(p){
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
