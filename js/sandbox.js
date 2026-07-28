/* ============================================================
   LAYOUT SANDBOX (opt-in, 2026-07-21, extended to the whole page 2026-07-22)
   ------------------------------------------------------------
   Lets Owen drag/resize photos, text blocks, and graphics anywhere on a
   real project page (hero, hero gallery, the 3D model/mechanism, process,
   material swatches, components, V2), then export a plain-text
   description of the new layout to send back to Claude, who translates
   it into real CSS/layout values in js/projects-data.js and project.html.

   Started PROCESS-only; Owen asked for everything, so this now covers
   every section via the ZONES list below. Each zone names a "canvas"
   element (the section it lives in) and one or more unit selectors within
   it. Every matched unit gets lifted out of its normal layout (grid, flex,
   whatever that section uses) into a freely draggable/resizable absolutely
   positioned box, positioned relative to its own section - NOT one single
   whole-page canvas, because `.proj section{position:relative}` already
   gives every <section> its own positioning context, and overriding that
   sitewide felt riskier to verify blind than just keeping each section as
   its own local sandbox. In practice this still reads as "drag anything
   anywhere" since every section is right there on the same scrolling page.

   This is NOT a code generator. It can't reproduce every section's real
   layout engine (PROCESS/V2 use CSS Grid auto-placement that packs items
   into rows in document order; this bypasses that for free dragging).
   What it exports is an honest, readable description of where things
   ended up - approximate column span / aspect ratio / position, in visual
   order, grouped by section. Claude reads that and hand-tunes the real
   values against the live page, same as any other layout request. Owen
   knows this going in ("I will rough it out by eye then send it to you to
   lock in the values") - don't oversell the export as more precise than
   it is.

   Only loads when a project page is opened with ?sandbox in the URL (see
   the hook at the end of project.html's main script) - completely absent
   otherwise, zero cost for normal visitors.
   ============================================================ */
window.NEWO_SANDBOX = (function(){

  var COLORS = ["#e2191b","#1b6fe2","#1ba85a","#c98a1b","#8a3fd6"];

  // Each zone: canvasSel finds ONE section-level element (skipped if it
  // isn't on this page - e.g. no .cad section on non-KART projects). Each
  // unit in `units` is either a fixed {sel,kind,label}, or "auto" for the
  // PROCESS/V2 cell arrays where a mix of images and text already needs
  // the per-cell detection this tool started with.
  var ZONES = [
    { canvasSel:".hero", label:"HERO", units:[
        { sel:".hero-main",           kind:"image", label:"hero photo" },
        { sel:".hero-title",          kind:"text",  label:"title" },
        { sel:".teaser",              kind:"text",  label:"teaser line" },
        { sel:".hero-aside .desc",    kind:"text",  label:"summary" },
        { sel:".hero-specs",          kind:"text",  label:"spec row (date/size/inquire)" },
        { sel:".hero-materials",      kind:"text",  label:"materials row" },
        { sel:".hero-vid",            kind:"video", label:"hero video" }
    ]},
    { canvasSel:".hero-gallery", label:"HERO GALLERY", units:[
        { sel:":scope > .gthumb",     kind:"image", label:"gallery thumb" }
    ]},
    { canvasSel:".cad", label:"3D MODEL", units:[
        { sel:".cad-stage",           kind:"widget", label:"model viewer" }
    ]},
    { canvasSel:".hiw", label:"HOW IT WORKS", units:[
        { sel:".hiw-text",            kind:"text",   label:"intro line" },
        { sel:".hiw-graphic",         kind:"widget", label:"mechanism graphic" }
    ]},
    { canvasSel:".proc .scatter", label:"PROCESS", units:[
        { sel:":scope > .cell",       kind:"auto",   label:null }
    ]},
    { canvasSel:".matlspread", label:"MATERIAL SWATCHES", units:[
        { sel:".matl-swatch",         kind:"image",  label:"material swatch" }
    ]},
    { canvasSel:".compspread .comp-row", label:"COMPONENTS", units:[
        { sel:":scope > .comp-item",  kind:"image",  label:"component" }
    ]},
    { canvasSel:".v2-media", label:"V2 MEDIA", units:[
        { sel:":scope > .cell",       kind:"auto",   label:null }
    ]},
    { canvasSel:".v2", label:"V2 TEXT", units:[
        { sel:".v2-text",             kind:"text",   label:"V2 writeup" }
    ]}
  ];

  function init(meta){
    document.body.classList.add("sbx-mode");
    injectStyles();

    var registry = []; // { canvas, zoneLabel, cells:[...] }
    var colorIdx = 0;

    ZONES.forEach(function(zone){
      var canvas = document.querySelector(zone.canvasSel);
      if(!canvas) return; // section doesn't exist on this project, skip quietly

      freezeContainer(canvas);
      var cRect = canvas.getBoundingClientRect();

      // gather every unit this zone defines, each tagged with its role
      var found = [];
      zone.units.forEach(function(u){
        var els = Array.prototype.slice.call(canvas.querySelectorAll(u.sel));
        els.forEach(function(el){ found.push({ el:el, kind:u.kind, label:u.label }); });
      });
      if(!found.length) return;

      // capture every rect FIRST, before converting any of them - a cell
      // converted to position:absolute leaves its layout (grid or flex),
      // which reflows and mis-measures whatever in this zone hasn't been
      // captured yet.
      var rects = found.map(function(f){
        var r = f.el.getBoundingClientRect();
        return { left:r.left-cRect.left, top:r.top-cRect.top, width:r.width };
      });

      var entry = { canvas:canvas, zoneLabel:zone.label, cells:[] };
      found.forEach(function(f, i){
        var info = liftUnit(f.el, rects[i], f.kind, f.label);
        info.color = COLORS[colorIdx++ % COLORS.length];
        info.el.style.outlineColor = info.color;
        info.tag.style.background = info.color;
        entry.cells.push(info);
        makeInteractive(info, canvas);
      });
      registry.push(entry);
    });

    if(!registry.length){
      alert("Layout sandbox: no editable sections found on this page.");
      return;
    }

    buildToolbar(meta, registry);
  }

  // ---- turn one element into a freely-positioned, absolutely placed box.
  // `rect` was captured BEFORE any unit in its zone was converted (see the
  // two-phase capture in init), so it reflects the real as-rendered
  // position, not one already skewed by earlier removals in the same
  // zone. `kind` is "image"/"text"/"video"/"widget", or "auto" for the
  // PROCESS/V2 cell arrays (mixed images + text, detected per-cell). ----
  function liftUnit(el, rect, kind, label){
    var src = "", cap = "", cut = false, fig = null;

    if(kind === "auto"){
      // original PROCESS/V2 cell detection: a .cell with a .fig is a photo,
      // otherwise it's one of the text/material-note blocks.
      fig = el.querySelector(".fig");
      var img = el.querySelector("img");
      if(fig && img){
        kind = "image";
        src = (img.getAttribute("src")||"").split("/").pop();
        var figc = el.querySelector("figcaption");
        if(figc) cap = figc.textContent || "";
        cut = fig.classList.contains("cut");
      } else {
        kind = "text";
        label = el.classList.contains("matl-note") ? "material note" :
                el.classList.contains("proc-note") ? "process text" : "text block";
      }
    } else if(kind === "image"){
      var img2 = el.querySelector("img");
      src = img2 ? (img2.getAttribute("src")||"").split("/").pop() : "";
      fig = el.matches(".fig") ? el : el.querySelector(".fig");
      cut = !!(fig && fig.classList.contains("cut"));
      var tagEl = el.querySelector(".tag, figcaption");
      if(tagEl) cap = tagEl.textContent || "";
    } else if(kind === "video"){
      var v = el.querySelector("video");
      src = v ? (v.getAttribute("src")||"").split("/").pop() : "";
    }
    // widget/text: src/cap stay blank, the label + a text excerpt (added
    // at export time) are enough to identify them.

    // replace the old grid-column/margin-top/flex-driven style wholesale -
    // its visual effect is already baked into the rect we just measured.
    el.setAttribute("data-sbx-orig-style", el.getAttribute("style") || "");
    el.style.cssText = "position:absolute;left:"+Math.round(rect.left)+"px;top:"+Math.round(rect.top)+"px;width:"+Math.round(rect.width)+"px;margin:0;";

    var handle = document.createElement("div");
    handle.className = "sbx-handle";
    el.appendChild(handle);

    var tag = document.createElement("div");
    tag.className = "sbx-tag";
    tag.textContent = (label ? label+": " : "") + (kind === "image" ? src : (kind === "text" ? "" : kind.toUpperCase()));
    el.appendChild(tag);

    el.classList.add("sbx-cell");

    return { el:el, handle:handle, tag:tag, kind:kind, label:label, src:src, cap:cap, cut:cut };
  }

  function freezeContainer(container){
    var h = container.scrollHeight;
    container.style.position = "relative";
    container.style.minHeight = h + "px";
    container.classList.add("sbx-container");
  }

  function growContainer(container, cell){
    var need = parseFloat(cell.style.top) + cell.offsetHeight + 60;
    var cur = parseFloat(container.style.minHeight) || 0;
    if(need > cur) container.style.minHeight = need + "px";
  }

  // ---- resize behaviour varies by what the box actually contains:
  // natural-ratio images (cut-outs, the hero photo) follow width only;
  // aspect-ratio photo boxes get their .fig resized to match; model-viewer
  // and the mechanism iframe each size themselves off their own element,
  // not a parent box, so those get set directly; anything else (material
  // swatches, gallery thumbs) just gets its own height forced, matching
  // how their CSS already fills that box at width/height:100%. ----
  function applyResize(info, newW, newH){
    info.el.style.width = newW + "px";
    if(info.kind === "text") return;
    if(info.el.classList.contains("hero-main")) return; // height:auto, natural ratio
    if(info.cut) return;                                 // cut-outs: natural ratio too

    var mv = info.el.querySelector("model-viewer");
    if(mv){ mv.style.height = newH + "px"; return; }
    var ifr = info.el.querySelector("iframe");
    if(ifr){ ifr.style.height = newH + "px"; return; }

    var fig = info.el.matches(".fig") ? info.el : info.el.querySelector(".fig");
    if(fig){ fig.style.height = newH + "px"; }
    else { info.el.style.height = newH + "px"; }
  }

  // ---- drag to move, drag the corner handle to resize ----
  function makeInteractive(info, container){
    var cell = info.el, handle = info.handle;
    var drag = null;

    // sandboxed cells are for dragging, never for the site's own click
    // behaviour (lightbox, info icons, model-viewer AR button) - block
    // clicks outright, capture phase, so this runs before those bubble-
    // phase listeners ever see it.
    cell.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); }, true);

    cell.addEventListener("pointerdown", function(e){
      e.preventDefault(); e.stopPropagation();
      var mode = (e.target === handle) ? "resize" : "move";
      drag = {
        mode: mode, id: e.pointerId,
        startX: e.clientX, startY: e.clientY,
        startLeft: parseFloat(cell.style.left), startTop: parseFloat(cell.style.top),
        startW: cell.offsetWidth, startH: cell.offsetHeight
      };
      cell.setPointerCapture(e.pointerId);
      cell.classList.add("sbx-active");
    }, true);

    cell.addEventListener("pointermove", function(e){
      if(!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
      if(drag.mode === "move"){
        cell.style.left = Math.round(drag.startLeft + dx) + "px";
        cell.style.top  = Math.round(drag.startTop + dy) + "px";
      } else {
        var newW = Math.max(50, Math.round(drag.startW + dx));
        var newH = Math.max(30, Math.round(drag.startH + dy));
        applyResize(info, newW, newH);
      }
      growContainer(container, cell);
    });

    function end(e){
      if(!drag || e.pointerId !== drag.id) return;
      drag = null;
      cell.classList.remove("sbx-active");
      if(window.__sbxRefreshExport) window.__sbxRefreshExport();
    }
    cell.addEventListener("pointerup", end);
    cell.addEventListener("pointercancel", end);
  }

  // ---- toolbar + export ----
  function buildToolbar(meta, registry){
    var bar = document.createElement("div");
    bar.className = "sbx-bar";
    bar.innerHTML =
      '<div class="sbx-bar-title">LAYOUT SANDBOX &middot; '+esc(meta.title||meta.id||"")+'</div>' +
      '<div class="sbx-bar-help">Drag anything to move it. Drag its bottom-right corner to resize. Nothing is saved - when you\'re happy, hit Export and send me everything in the box.</div>' +
      '<div class="sbx-bar-row">' +
        '<button type="button" class="sbx-btn sbx-export">Export layout</button>' +
        '<button type="button" class="sbx-btn sbx-reset">Reset</button>' +
      '</div>' +
      '<textarea class="sbx-out" readonly placeholder="Export output appears here - copy it and paste it back to Claude in chat."></textarea>' +
      '<div class="sbx-bar-row">' +
        '<button type="button" class="sbx-btn sbx-copy">Copy to clipboard</button>' +
        '<span class="sbx-copied">Copied</span>' +
      '</div>';
    document.body.appendChild(bar);

    var out = bar.querySelector(".sbx-out");
    var copiedFlag = bar.querySelector(".sbx-copied");

    function refresh(){ out.value = buildExport(meta, registry); }
    window.__sbxRefreshExport = refresh;
    refresh();

    bar.querySelector(".sbx-export").addEventListener("click", refresh);
    bar.querySelector(".sbx-reset").addEventListener("click", function(){
      location.href = location.pathname + location.search;
    });
    bar.querySelector(".sbx-copy").addEventListener("click", function(){
      refresh();
      out.select();
      (navigator.clipboard ? navigator.clipboard.writeText(out.value) : Promise.reject())
        .catch(function(){ document.execCommand("copy"); })
        .then(function(){
          copiedFlag.classList.add("show");
          setTimeout(function(){ copiedFlag.classList.remove("show"); }, 1400);
        });
    });
  }

  // ---- reverse-engineer an approximate column span from a canvas's real
  // grid geometry when it has one (PROCESS/V2/HERO all use a 12-col grid;
  // sections like HERO GALLERY, MATERIAL SWATCHES etc. don't, so this
  // quietly returns nulls and the export just shows pixel position) ----
  function gridInfo(canvas){
    var cs = getComputedStyle(canvas);
    if(cs.display !== "grid") return null;
    var tracks = cs.gridTemplateColumns.split(" ").map(parseFloat);
    if(tracks.length < 6) return null; // not a 12-col track list
    var colW = tracks[0] || 0;
    var gap = parseFloat(cs.columnGap) || 0;
    var padL = parseFloat(cs.paddingLeft) || 0;
    return { colW:colW, gap:gap, padL:padL, contentW: canvas.clientWidth };
  }

  function approxColumns(left, width, g){
    if(!g || !g.colW) return null;
    var step = g.colW + g.gap;
    var startCol = Math.max(1, Math.round((left - g.padL) / step) + 1);
    var endCol = Math.min(13, Math.max(startCol+1, Math.round((left - g.padL + width + g.gap) / step) + 1));
    var bleedLeft  = left <= 6;
    var bleedRight = (left + width) >= (g.contentW - 6);
    var bleed = (bleedLeft && bleedRight) ? "full" : (bleedLeft ? "left" : (bleedRight ? "right" : null));
    return { startCol:startCol, endCol:endCol, bleed:bleed };
  }

  function approxRatio(w, h){
    var r = w / h;
    var known = [["1/1",1],["4/3",4/3],["3/4",0.75],["3/2",1.5],["2/1",2],["16/9",16/9]];
    for(var i=0;i<known.length;i++){ if(Math.abs(r - known[i][1]) < 0.045) return known[i][0]; }
    return r.toFixed(2);
  }

  function excerpt(el){
    var t = (el.textContent||"").trim().replace(/\s+/g," ");
    return t.length > 60 ? t.slice(0,60)+"…" : t;
  }

  function buildExport(meta, registry){
    var lines = [];
    lines.push("LAYOUT SANDBOX EXPORT - " + (meta.title||meta.id||""));
    lines.push("Paste this whole block back to Claude in chat.");
    lines.push("");
    registry.forEach(function(entry){
      lines.push("=== " + entry.zoneLabel + " ===");
      var g = gridInfo(entry.canvas);
      var sorted = entry.cells.slice().sort(function(a,b){
        var ta = parseFloat(a.el.style.top), tb = parseFloat(b.el.style.top);
        if(Math.abs(ta-tb) > 24) return ta-tb;
        return parseFloat(a.el.style.left) - parseFloat(b.el.style.left);
      });
      sorted.forEach(function(info, i){
        var left = parseFloat(info.el.style.left), top = parseFloat(info.el.style.top);
        var w = info.el.offsetWidth, h = info.el.offsetHeight;
        var cols = approxColumns(left, w, g);
        var colTxt = cols ? ("columns ~"+cols.startCol+"-"+cols.endCol+(cols.bleed?"  (bleed "+cols.bleed+")":"")) : ("left "+Math.round(left)+"px, width "+w+"px");
        var n = i+1;
        var head = (info.label ? info.label : info.kind) + (info.src ? "  "+info.src : "");
        if(info.kind === "image"){
          lines.push(n+". IMAGE - "+head+(info.cap?'  caption: "'+info.cap+'"':""));
          lines.push("   "+colTxt+"   ratio ~"+approxRatio(w,h)+"   top ~"+Math.round(top)+"px"+(info.cut?"   [natural ratio, no crop]":""));
        } else if(info.kind === "video"){
          lines.push(n+". VIDEO - "+head);
          lines.push("   "+colTxt+"   ratio ~"+approxRatio(w,h)+"   top ~"+Math.round(top)+"px");
        } else if(info.kind === "widget"){
          lines.push(n+". "+(info.label||"widget").toUpperCase()+" (interactive - position/size only, can't change its own content here)");
          lines.push("   "+colTxt+"   height "+h+"px   top ~"+Math.round(top)+"px");
        } else {
          lines.push(n+". TEXT - "+(info.label||"text block")+' — "'+excerpt(info.el)+'" (content unchanged, only position/width below)');
          lines.push("   "+colTxt+"   top ~"+Math.round(top)+"px");
        }
      });
      lines.push("");
    });
    lines.push("(Positions are approximate - Claude will fit these to each section's real layout system before updating the code. Sections without a 12-column grid, e.g. hero gallery or material swatches, are reported in raw pixels instead of columns.)");
    return lines.join("\n");
  }

  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function injectStyles(){
    var css =
      'body.sbx-mode{cursor:default;}' +
      '.sbx-container{outline:1px dashed #0002;}' +
      '.sbx-cell{outline:1px dashed #e2191b66; cursor:grab; -webkit-user-select:none; user-select:none; touch-action:none;}' +
      '.sbx-cell.sbx-active{cursor:grabbing; outline-color:#e2191b; z-index:5;}' +
      '.sbx-cell img{pointer-events:none;}' +
      '.sbx-tag{position:absolute; top:-18px; left:0; font:10px/1.4 monospace; background:#141414; color:#fff; padding:1px 5px; white-space:nowrap; pointer-events:none; z-index:2; max-width:260px; overflow:hidden; text-overflow:ellipsis;}' +
      '.sbx-handle{position:absolute; right:-6px; bottom:-6px; width:14px; height:14px; background:#e2191b; border:2px solid #fff; border-radius:50%; cursor:nwse-resize; z-index:3;}' +
      '.sbx-bar{position:fixed; right:16px; bottom:16px; width:320px; max-height:80vh; overflow:auto; background:#141414; color:#f3f2ee; padding:14px; font:11px/1.5 sans-serif; z-index:999; box-shadow:0 6px 30px rgba(0,0,0,.35);}' +
      '.sbx-bar-title{font-weight:600; letter-spacing:.04em; margin-bottom:6px;}' +
      '.sbx-bar-help{opacity:.75; margin-bottom:10px;}' +
      '.sbx-bar-row{display:flex; gap:8px; align-items:center; margin-bottom:8px;}' +
      '.sbx-btn{background:#e2191b; color:#fff; border:0; padding:7px 12px; font:11px/1 sans-serif; cursor:pointer;}' +
      '.sbx-btn.sbx-reset{background:#333;}' +
      '.sbx-btn.sbx-copy{background:#333;}' +
      '.sbx-copied{opacity:0; transition:opacity .2s ease; font-size:10px; color:#7be08a;}' +
      '.sbx-copied.show{opacity:1;}' +
      '.sbx-out{width:100%; height:220px; background:#0000004d; color:#f3f2ee; border:1px solid #ffffff22; font:10px/1.4 monospace; padding:8px; box-sizing:border-box; resize:vertical;}';
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  return { init: init };
})();
