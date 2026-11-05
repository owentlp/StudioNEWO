/* Studio NEWO - project page script (js/project.js)
   Moved out of project.html on 2026-11-03 (review 2026-11-02_2 Q31) so the
   browser caches it once across the five product pages instead of downloading
   ~150 KB again inside each page. Loaded with a plain (classic, not defer)
   <script> at the same place the inline block sat, after projects-data.js,
   materials-data.js, image-sizes.js, main.js and menu.js, so it still runs
   in the same order with the same globals. Edit THIS file, not the generated
   kart / halo / omni / neb / flow .html pages. */
(function(){
  /* ---- LEGACY URL REDIRECT ----
     project.html?p=kart was the only address a project had until 2026-09-16.
     Anything already shared, bookmarked or indexed still uses it, so it is
     forwarded to the clean path rather than left to rot. replace(), not
     assign(), so the old URL does not sit in the back button. Only from
     project.html itself - the generated wrappers carry data-project and must
     never redirect, or kart.html would bounce to kart.html forever. */
  if(!document.body.getAttribute("data-project")){
    var legacy = null;
    try { legacy = new URLSearchParams(location.search).get("p"); } catch(e){}
    if(legacy && Object.prototype.hasOwnProperty.call(PROJECTS, legacy)){
      var keep = location.search.replace(/[?&]p=[^&]*/, "").replace(/^&/, "?");
      location.replace(legacy + ".html" + (keep && keep !== "?" ? keep : "") + location.hash);
      return;
    }
  }

  /* WHICH PROJECT THIS PAGE IS.
     The generated per-project wrappers (kart.html, neb.html, ...) carry it on
     <body data-project="...">, so the page knows before a query string is
     involved and the URL can stay clean. project.html?p=<id> still works and
     is what the legacy redirect below leans on. */
  var id = document.body.getAttribute("data-project") ||
           new URLSearchParams(location.search).get("p");
  /* hasOwnProperty, NOT a plain truthiness test. `!PROJECTS[id]` looks like a
     whitelist but every object inherits keys from Object.prototype, so
     ?p=__proto__ , ?p=constructor and ?p=toString all sailed through it. The
     page then ran with p = Object.prototype (every field undefined), threw
     part-way through the build, and the loading screen sat there forever -
     verified live on 2026-09-03. Not a security hole (nothing unescaped
     reaches the DOM; esc() covers every interpolation) but a crafted or
     mistyped URL should fall back to a real project, not brick the page. */
  if(!id || !Object.prototype.hasOwnProperty.call(PROJECTS, id)) id = Object.keys(PROJECTS)[0];
  var p = PROJECTS[id];
  var base = "projects/" + id + "/";
  document.title = p.title + (p.kind ? ", " + p.kind : "") + " · STUDIO NEWO";

  // WIREFRAME MODE: add &wire to the URL (project.html?p=kart&wire) to see the
  // page as a layout skeleton - photos/video/model become labelled placeholder
  // boxes, text keeps its real copy but every block is outlined, and the whole
  // page (including the process section) is shown. Purely a planning view;
  // non-destructive, styled entirely by the body.wire class (see css/style.css).
  if(/[?&]wire\b/.test(location.search)) document.body.classList.add("wire");

  function real(v){ return typeof v === "string" && v.trim() && !/^\s*\[/.test(v.trim()); }

  // ---- per-project metadata. The static tags in <head> are sensible
  // defaults (most link-preview scrapers do not run JS, so they fall back to
  // those); this updates the tab title, canonical URL, social preview, and
  // structured data for browsers and JS-aware crawlers on the actual project. ----
  (function setMeta(){
    var ORIGIN = "https://studionewo.com";
    var pageUrl = ORIGIN + "/" + id + ".html";
    var heroFile = (p.gallery && p.gallery[0]) ? p.gallery[0] : "hero.jpg";
    /* the 1200px md/ copy when make-image-variants.py made one (the original
       is up to 2400px and 380KB; scrapers only want 1200). Same rule as the
       generator, so the baked tag and this one name the same file. */
    var heroDims = (typeof IMG_SIZES !== "undefined" && IMG_SIZES[id]) ? IMG_SIZES[id][heroFile] : null;
    var heroImg = ORIGIN + "/" + base + ((heroDims && hasTier(heroDims, "md")) ? "md/" : "") + heroFile;
    var summary = real(p.summary) ? p.summary : (real(p.teaser) ? p.teaser : ("Studio NEWO project: " + p.title + "."));
    /* share title and description: the SAME formulas as tools/make-project-pages.py
       (title + kind; a short description cut at 160 characters), so a JS-aware
       crawler and a link scraper see one thing. */
    var shareTitle = real(p.kind) ? p.title + ", " + p.kind : p.title;
    var shortDesc = summary;
    if(real(p.kind)){
      shortDesc = p.title + ": " + p.kind + " by Studio NEWO, Toronto.";
      if(real(p.teaser) && shortDesc.length + 1 + p.teaser.length <= 160) shortDesc += " " + p.teaser;
    }
    function setMetaTag(sel, attr, val){
      var el = document.head.querySelector(sel);
      if(el){ el.setAttribute(attr, val); }
    }
    setMetaTag('link[rel="canonical"]', 'href', pageUrl);
    setMetaTag('meta[property="og:url"]', 'content', pageUrl);
    setMetaTag('meta[property="og:title"]', 'content', shareTitle + " · STUDIO NEWO");
    setMetaTag('meta[property="og:description"]', 'content', shortDesc);
    setMetaTag('meta[property="og:image"]', 'content', heroImg);
    setMetaTag('meta[name="twitter:title"]', 'content', shareTitle + " · STUDIO NEWO");
    setMetaTag('meta[name="twitter:description"]', 'content', shortDesc);
    setMetaTag('meta[name="twitter:image"]', 'content', heroImg);
    setMetaTag('meta[name="description"]', 'content', shortDesc);
    // CreativeWork structured data, for search engines
    var ld = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": p.title,
      "url": pageUrl,
      "image": heroImg,
      "creator": { "@type": "Person", "name": "Owen Palmer" },
      "publisher": { "@type": "Organization", "name": "Studio NEWO", "url": ORIGIN + "/" }
    };
    if(real(p.date)) ld.dateCreated = p.date;
    if(real(p.summary)) ld.description = p.summary;
    /* kart/halo/omni/neb/flow.html carry this in their HTML already
       (tools/make-project-pages.py, same fields), so it exists without JS;
       only the bare template gets it from here */
    if(document.head.querySelector('script[type="application/ld+json"]')) return;
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  })();
  function keep(it){ return (it && typeof it === "object") ? real(it.src) : real(it); }
  function img(src){ return base + src; }

  /* ---- RESPONSIVE IMAGES ------------------------------------------------
     Every hero + gallery photo has two pre-generated downscaled copies beside
     it, in projects/<id>/sm/ (600px wide) and projects/<id>/md/ (1200px wide).
     The ORIGINAL file is never touched and is always the last, largest srcset
     candidate, so nothing here can cost image quality: the browser simply
     picks the smallest copy whose pixel width still covers the box at this
     screen size and pixel density, exactly as it would have used the original
     otherwise. The lightbox deliberately bypasses this and loads the original.

     `sizes` tells the browser how wide the image will actually be BEFORE it
     has the CSS, which is what makes the choice correct rather than a guess.
     Keep these in step with the matching CSS if the layout changes:
       gallery  = a 4-column masonry across the full window (2 columns <=760px)
       hero     = columns 1-7 of the 12-column hero grid, roughly 58vw
     Dimensions come from js/image-sizes.js; if an image has no entry there
     (a new file added before the script was re-run) this quietly emits a plain
     src with no srcset, so the page still works, just without the saving. */
  var GAL_SIZES  = "(max-width:760px) 50vw, 25vw";
  var HERO_SIZES = "(max-width:760px) 100vw, 58vw";
  /* Scatter cells span between 2 and 12 of the 12 columns, and the span is
     known at build time, so each figure can declare its own real width instead
     of sharing one pessimistic guess. Below 600px the scatter collapses to two
     equal columns (see css/style.css), hence the fixed 50vw first term. */
  function scatterSizes(spanCols){
    var pct = Math.max(10, Math.min(100, Math.round((spanCols / 12) * 100)));
    return "(max-width:600px) 50vw, " + pct + "vw";
  }
  /* does this IMG_SIZES entry have the sm/ or md/ copy? Optional third element
     ("sm", "md", "sm md", "") from tools/make-image-variants.py; without it, the
     width rule (sm when w > 600, md when w > 1200). */
  function hasTier(d, t){
    return d.length > 2 ? (" " + d[2] + " ").indexOf(" " + t + " ") >= 0
                        : d[0] > (t === "sm" ? 600 : 1200);
  }
  function srcAttrs(file, sizes){
    var dims = (typeof IMG_SIZES !== "undefined" && IMG_SIZES[id]) ? IMG_SIZES[id][file] : null;
    if(!dims) return "";
    var w = dims[0], h = dims[1], set = [];
    if(hasTier(dims, "sm")) set.push(base + "sm/" + file + " 600w");
    if(hasTier(dims, "md")) set.push(base + "md/" + file + " 1200w");
    set.push(base + file + " " + w + "w");
    return (set.length > 1 ? ' srcset="' + set.join(", ") + '" sizes="' + sizes + '"' : '') +
           ' width="' + w + '" height="' + h + '"';
  }
  function pad(n){ return n < 10 ? "0"+n : ""+n; }
  // real HTML escaping (this used to be a passthrough): copy is all first-party
  // so it's not a security issue, but a stray & or < in a caption would have
  // silently broken the markup around it.
  function esc(s){ return (s==null?"":String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function isCut(src){ return /\.png$/i.test(src||""); }

  /* ALT TEXT, by filename, from the `alt` map in js/projects-data.js.
     Every gallery and process image used to be emitted with alt="", which tells
     a screen reader and an image crawler that the photo is decoration. On a
     portfolio the photographs ARE the content, so they say what they show.
     A file with no entry falls back to the project title rather than to an
     empty string, so a newly added photo is never silently unlabelled. */
  function altFor(src){
    var map = (p && p.alt) || {};
    var txt = map[src];
    return esc(real(txt) ? txt : p.title);
  }

  // material name -> slug, built from js/materials-data.js, so a chip under
  // the hero can link straight to its entry on the Material Guide
  // (materials.html#<slug>) without Owen having to hand-maintain slugs here.
  // materials-data.js is nested (category -> groups -> items); walk both the
  // legacy flat `items` and the current `groups[].items`, and index each
  // material's name AND any aliases, so a hero material chip can deep-link to
  // the right entry even when the chip word differs from the material's name.
  var MAT_SLUGS = {};
  (typeof MATERIAL_CATEGORIES !== "undefined" ? MATERIAL_CATEGORIES : []).forEach(function(cat){
    function idx(it){
      MAT_SLUGS[String(it.name).toLowerCase()] = it.slug;
      (it.aliases||[]).forEach(function(a){ MAT_SLUGS[String(a).toLowerCase()] = it.slug; });
    }
    (cat.items||[]).forEach(idx);
    (cat.groups||[]).forEach(function(g){ (g.items||[]).forEach(idx); });
  });

  // ---- INFO ICON: a small button that reveals a longer description on
  // click, so a long paragraph can be shown as a couple of sentences with
  // the rest one tap away instead of cluttering the page, or so an unlabeled
  // image can carry its full writeup without a caption sitting on the page
  // at rest. Uses Owen's own icon (logo/info.svg).
  var INFO_ICON = '<img src="logo/info.svg" alt="" aria-hidden="true">';
  function withInfo(shortHtml, moreText){
    if(!real(moreText)) return shortHtml;
    return shortHtml +
      '<span class="info-wrap">' +
        '<button type="button" class="info-btn" aria-expanded="false" aria-label="More detail">'+INFO_ICON+'</button>' +
        '<span class="info-panel"><span class="info-panel-in">'+esc(moreText)+'</span></span>' +
      '</span>';
  }

  // deterministic per-project RNG so the auto scatter is random but stable
  function seedFrom(s){ var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function pick(rnd,arr){ return arr[Math.floor(rnd()*arr.length)]; }

  var year = real(p.date) ? p.date : "";

  // a looping inline video figure (a section's video slot)
  /* Every video on the page is registered into the SAME lightbox set as the
     gallery images (see LB below), so tapping one opens it full screen and the
     arrows carry on through the rest of the project's media rather than
     stopping at the photos. Gallery images take indices 0..n-1; each video
     appends itself and stamps its own index onto the figure. */
  /* REDUCED MOTION (2026-11-03, score round 2, a11y A3 / WCAG 2.2.2): under
     prefers-reduced-motion the looping clips do not autoplay. The poster (or
     the first frame) shows; the clip plays when it is opened in the lightbox.
     Everyone else keeps autoplay (decided 2 Nov, Q34). */
  var CLIP_STILL = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function videoFig(src, ar){
    var u = img(src), i = -1;
    // reuse an existing slot if this clip is already in the set. That is how
    // the hero video picks up the index reserved for it above (and it keeps a
    // clip that appears in two places from being listed twice).
    for(var k = 0; k < LB.length; k++){ if(LB[k].type === "video" && LB[k].src === u){ i = k; break; } }
    if(i < 0) i = LB.push({ type:"video", src:u }) - 1;
    /* POSTER: projects/<id>/<clip>-poster.jpg (demo.mp4 -> demo-poster.jpg),
       a still of the first frame, painted before the clip has a frame. Only
       named when js/image-sizes.js lists it (make-image-variants.py found the
       file), so a clip without one never asks for a file that is not there. */
    var pf = String(src).replace(/\.[^.\/]+$/, "") + "-poster.jpg";
    var pd = (typeof IMG_SIZES !== "undefined" && IMG_SIZES[id]) ? IMG_SIZES[id][pf] : null;
    var poster = pd ? ' poster="' + img(pf) + '"' : '';
    return '<figure class="fig vid" style="aspect-ratio:'+(ar||"16/9")+'" data-lb="'+i+'" tabindex="0" role="button">' +
      '<video src="'+u+'"'+poster+' muted loop'+(CLIP_STILL ? '' : ' autoplay')+' playsinline preload="metadata" ' +
      'aria-label="'+esc(p.title)+' in use, silent looping clip"></video></figure>';
  }

  /* One figure. Cut-outs sit on the paper with no crop and no box.

     Now carries srcset. make-image-variants.py generates sm/ and md/ copies for
     scatter images as well as hero and gallery, so these no longer download a
     2000-2400px original into a box a few hundred pixels wide. Lazy loading
     already decided WHEN they arrive; this decides how big they are. srcAttrs()
     returns "" for any file with no entry in js/image-sizes.js, so a photo
     added before the script is re-run still works, just without the saving. */
  function figure(src, ar, cut, idxNum, sizes){
    var idx = (idxNum != null) ? '<span class="idx">'+pad(idxNum)+'</span>' : '';
    var attrs = srcAttrs(src, sizes || scatterSizes(6));
    var alt = altFor(src);
    if(cut) return '<figure class="fig cut">'+idx+'<img src="'+img(src)+'"'+attrs+' alt="'+alt+'" loading="lazy" decoding="async"></figure>';
    return '<figure class="fig" style="aspect-ratio:'+(ar||"4/3")+'">'+idx+'<img src="'+img(src)+'"'+attrs+' alt="'+alt+'" loading="lazy" decoding="async"></figure>';
  }

  // a component-spread image with positioned labels. Each label sits at an
  // x/y percent of the image (tune in projects-data.js) and carries an info
  // icon that opens a small panel with the part's real name + simple specs.
  /* The x/y in projects-data.js are percentages of the WHOLE SPREAD, authored
     against the desktop layout where the photo is 72% wide in a 28% gutter
     (--spread-img in css/style.css). On a narrow column that photo has to give
     width back to the labels or "MICROCONTROLLER" cannot be set at a readable
     size - but moving the photo edge would slide every part out from under its
     label. So x is converted here into a FRACTION of whichever band it falls
     in, gutter or photo, and CSS rebuilds the position from the live
     --spread-img. The authored numbers never change and the labels stay locked
     to their parts at any width. IMG_BASE must match the --spread-img default. */
  var IMG_BASE = 72;
  function compSpread(src, labels){
    var tags = labels.map(function(L){
      var x = +L.x || 0, inGut = x < (100 - IMG_BASE);
      var f = inGut ? (x / (100 - IMG_BASE)) : ((x - (100 - IMG_BASE)) / IMG_BASE);
      return '<div class="comp-label '+(inGut?'in-gut':'on-img')+'" data-top="'+(+L.y||0)+'%" style="--f:'+
             (Math.round(f*10000)/10000)+';top:'+(+L.y||0)+'%;">' +
        '<button type="button" class="comp-info" aria-expanded="false">' +
          '<span class="comp-name">'+esc((L.t||"").toUpperCase())+'</span>'+INFO_ICON +
        '</button>' +
        '<div class="comp-panel">' +
          (real(L.name)?'<span class="comp-panel-name">'+esc(L.name)+'</span>':'') +
          (real(L.spec)?'<span class="comp-panel-spec">'+esc(L.spec)+'</span>':'') +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="comp-spread-wrap"><div class="comp-spread">' +
      '<img src="'+img(src)+'"'+srcAttrs(src, "(max-width:600px) 92vw, 46vw")+' alt="'+(real((p.alt||{})[src]) ? altFor(src) : esc(p.title)+' internal components')+'" loading="lazy" decoding="async">' +
      tags +
    '</div></div>';
  }

  // SCATTER: string = auto-placed (random, stable); object = pinned anchor.
  // Captions hug the side of the cell nearest the page edge (or sit under it).
  function scatter(items, rnd, opts){
    opts = opts || {};
    return items.map(function(it, i){
      var o   = (it && typeof it === "object") ? it : null;
      var src = o ? o.src : it;
      if(!real(src)) return "";

      var cut    = (o && o.cut != null) ? !!o.cut : isCut(src);
      var idxNum = (o && o.idx != null) ? (o.idx ? i+1 : null) : (opts.index ? i+1 : null);
      var noteCap= (opts.notes && real(opts.notes[i])) ? opts.notes[i] : "";
      var capTxt = (o && real(o.cap)) ? o.cap : noteCap;
      var capOn  = !!(o && o.capOn) && capTxt && !cut;   // caption sits ON the image

      var ar = o && o.ar ? o.ar : null;
      var mt = (o && o.mt != null) ? o.mt : null;
      // shift: negative vw pushes the cell's left edge OFF the window (the
      // Figma's LED-matrix photo starts 21% off-canvas); html overflow-x is
      // hidden, so the overhang crops cleanly.
      var shift = (o && o.shift != null) ? "margin-left:" + o.shift + "vw;" : "";
      var colStyle, capSide = "left", startCol = null, spanCols = null;

      if(o && (o.col || o.bleed)){                       // ---- pinned anchor ----
        var span = o.span || 6;
        if(o.bleed === "full")       { colStyle = "grid-column:1 / -1;"; capSide="left"; spanCols = 12; }
        else if(o.bleed === "left")  { colStyle = "grid-column:1 / span "+span+";"; capSide="left"; spanCols = span; }
        else if(o.bleed === "right") { colStyle = "grid-column:"+(13-span)+" / -1;"; capSide="right"; spanCols = span; }
        else { colStyle = "grid-column:"+o.col+";"; var m=String(o.col).match(/(\d+)\s*\/\s*(\d+)/); if(m){ startCol=+m[1]; spanCols=(+m[2])-(+m[1]); capSide = startCol<=2 ? "left" : (startCol+spanCols>=11 ? "right":"left"); } }
        if(mt == null) mt = 0;
        if(!ar) ar = "3/2";
      } else {                                            // ---- seeded auto-scatter ----
        var poolsBig   = [[3,4,5,6],[4,4,5,5,6],[3,5,4,6,4]];
        var poolsSmall = [[2,3,4,5],[3,3,4,4,5],[2,4,3,5,3]];
        var spanPool = (opts.big ? poolsBig : poolsSmall)[(opts.variant||0) % 3];
        var sp = pick(rnd, spanPool);
        var maxStart = 13 - sp;
        var start = 1 + Math.floor(rnd()*maxStart);
        var e = rnd();
        if(e < 0.24) start = 1; else if(e < 0.48) start = maxStart;
        if(!ar) ar = pick(rnd, ["4/3","16/9","3/2","1/1","4/3","3/2","3/4","2/1"]);
        if(mt == null) mt = Math.floor(rnd() * (opts.big ? 150 : 130));
        if(!cut && rnd() < 0.10){ colStyle = "grid-column:1 / -1;"; ar = pick(rnd, ["2/1","16/9","3/2"]); capSide="left"; spanCols = 12; }
        else { colStyle = "grid-column:"+start+" / span "+sp+";"; capSide = (start+sp>=11) ? "right" : "left"; spanCols = sp; }
      }

      // captions are no longer shown under process images (removed by request).
      // An image with a `labels` array becomes a component spread instead: the
      // image with positioned, info-icon labels overlaid on it.
      var isSpread = !!(o && o.labels && o.labels.length);
      /* how many of the 12 columns this cell ends up spanning, so the figure
         can declare an accurate `sizes`. Set on every branch above; the
         fallback of 6 is only reached if a future branch forgets to. */
      var cellSpan = spanCols || 6;
      var mBleed = /grid-column:\s*1 \/ -1/.test(colStyle||"") ? 12 : null;
      if(mBleed) cellSpan = 12;
      var inner = isSpread ? compSpread(src, o.labels)
                           : figure(src, ar, cut, idxNum, scatterSizes(cellSpan));
      // horizontal placement (grid-column) + aspect ratio only; vertical
      // position is handled by the grid's dense auto-flow.
      // has-spread lets the mobile rules give a labelled parts photo the full
      // width; in a 2-column mobile scatter it would otherwise be ~180px wide.
      // showCap: the one case a process image carries a visible line UNDER it
      // (never over it): an image that is not the studio's own work, e.g. the
      // Braun fan shown as FLOW's reference.
      var refCap = (o && o.showCap && capTxt) ? '<span class="cap ref-cap">'+esc(capTxt)+'</span>' : '';
      return '<div class="cell cap-'+capSide+(isSpread?' has-spread':'')+'" style="'+colStyle+'">' + inner + refCap + '</div>';
    }).filter(Boolean);
  }
  // same idea as an image cell, but for the materials note (design-tags row + one lifecycle
  // sentence + a link to the Material Guide) that used to live in its own
  // standalone MATERIALS section. It now rides inside the process scatter
  // instead, same family of cell as the other process text.
  function matlNoteCell(dTags, lifecycle, col, mt){
    // text alignment follows whichever margin this cell is actually nearer:
    // a cell starting at column 6+ sits on the right half of the page, so
    // its last (ragged) line should align right instead of the site's left
    // default, same rule the scatter() captions already use.
    var m = String(col).match(/(\d+)\s*\/\s*(\d+)/);
    var startCol = m ? +m[1] : 1;
    var sideCls = startCol >= 6 ? " side-right" : "";
    var tagsHtml = dTags.length ? '<div class="matl-tags">'+esc(dTags.map(function(t){ return t.toUpperCase(); }).join("   /   "))+'</div>' : '';
    var lifeHtml = real(lifecycle) ? '<p class="desc'+sideCls+'">'+esc(lifecycle)+'</p>' : '';
    if(!tagsHtml && !lifeHtml) return '';
    return '<div class="cell proc-note matl-note" style="grid-column:'+col+';margin-top:'+mt+'px;">' +
      tagsHtml + lifeHtml +
      '<a class="matl-link" href="materials.html?for='+encodeURIComponent(id)+'">MATERIAL GUIDE &rarr;</a>' +
    '</div>';
  }

  var rnd = mulberry(seedFrom(id));

  // give each project's body paragraphs a slightly different measure (35-38ch,
  // stable per project via the same seed) so the page doesn't read as one
  // rigid 32ch column repeated identically everywhere. Only the paragraph
  // width varies, teaser/caption widths stay fixed so the hero still lines up.
  document.getElementById("content").style.setProperty("--w-desc", (35 + (seedFrom(id+"-w") % 4)) + "ch");

  // ---------- HERO (image bleeds left; text stuck to the right edge) ----------
  var gal = (p.gallery||["hero.jpg"]).filter(real);

  /* ---- The lightbox set: images and videos in ONE ordered list ----
     Order is hero image, then the hero video, then the rest of the gallery,
     then any other video on the page. The hero video's slot is RESERVED here
     rather than being appended whenever videoFig() happens to emit it - the
     hero markup is built after the thumbs, so left to itself the demo landed
     last, behind eight photos, when it belongs beside the shot it demonstrates.

     galOffset is where the gallery thumbs start, so their data-lb stamps stay
     correct whether or not this project has a hero video. */
  /* md: the 1200px copy (projects/<id>/md/) when there is one, so the lightbox
     on a phone does not fetch a 2400px original. "" when the file has no md
     variant or no entry in js/image-sizes.js; render() then uses the original. */
  function mdFor(file){
    var d = (typeof IMG_SIZES !== "undefined" && IMG_SIZES[id]) ? IMG_SIZES[id][file] : null;
    return (d && hasTier(d, "md")) ? base + "md/" + file : "";
  }
  var LB = [{ type:"img", src: img(gal[0]), md: mdFor(gal[0]) }];
  if(real(p.heroVideo)) LB.push({ type:"video", src: img(p.heroVideo) });
  var galOffset = LB.length;
  gal.slice(1).forEach(function(s){ LB.push({ type:"img", src: img(s), md: mdFor(s) }); });
  var heroSrc = gal[0] || "hero.jpg";

  // per-project rhythm seed, still used by the process / aesthetics scatter
  var gVar = seedFrom(id) % 3;
  // gallery (everything after the hero): randomly sized and scattered across
  // the 12-col grid below the hero, on its own seeded RNG so it does not shift
  // the process / aesthetics composition. Each thumb still swaps the hero.
  // gallery = the support shots after the hero, shown as a compact masonry
  // (CSS columns, see style.css). The masonry packs them top-down and keeps
  // each image's native aspect ratio, so there's no per-thumb column/span/crop
  // math - just emit the thumbs in order. Each still swaps the hero on click.
  // Each thumb is emitted with a srcset (sm/ 600px, md/ 1200px, plus the
  // full-resolution original) and its intrinsic width/height. The srcset lets
  // the browser download the smallest copy that still covers the box it is
  // actually painted into, which on a masonry of ~250-450px thumbs is a large
  // saving with no visible difference; a high-DPR screen still pulls the
  // bigger candidate, and the lightbox always opens the untouched original.
  // width/height reserve the correct box before the file arrives, so the
  // CSS-columns masonry lays out once instead of reflowing on every load.
  /* ---- GALLERY COLUMNS -------------------------------------------------
     This used to be a CSS multi-column (`columns:4`) masonry. Multi-column
     BALANCES: it works out an even height and fills columns to it, so five
     thumbs across four columns packed 2/2/1 and left the fourth column empty,
     which is where NEB's and FLOW's big dead strip on the right came from. It
     also could not be reasoned about in advance, because the balance depends
     on image heights that are not known until the files load.

     So the columns are built explicitly instead. Each thumb goes into whichever
     column is currently shortest, using its aspect ratio from js/image-sizes.js
     as the height - that is known up front, so the packing is decided before a
     single byte of image arrives and never reshuffles afterwards. The columns
     are flex children with `flex:1`, so whatever the count, they always span
     the full width edge to edge with no leftover margin.

     Column count is capped at the number of thumbs, so three photos make three
     full-width columns rather than three quarters of the page. */
  function buildColumns(files, colCount){
    var cols = [], heights = [];
    for(var c = 0; c < colCount; c++){ cols.push([]); heights.push(0); }
    files.forEach(function(entry){
      var dims = (typeof IMG_SIZES !== "undefined" && IMG_SIZES[id]) ? IMG_SIZES[id][entry.file] : null;
      // ratio = height per unit width. Unknown files get 1 (square-ish), which
      // is a reasonable neutral guess and never breaks the layout.
      var ratio = dims ? (dims[1] / dims[0]) : 1;
      var shortest = 0;
      for(var c = 1; c < colCount; c++){ if(heights[c] < heights[shortest]) shortest = c; }
      cols[shortest].push(entry);
      heights[shortest] += ratio;
    });
    return cols;
  }
  var galFiles = gal.slice(1).map(function(g, i){ return { file:g, lb:galOffset + i }; });
  function galleryHTML(colCount){
    return buildColumns(galFiles, colCount).map(function(col){
      return '<div class="gcol">' + col.map(function(e){
        return '<div class="gthumb">' +
                 '<img src="'+img(e.file)+'"'+srcAttrs(e.file, GAL_SIZES)+
                 ' alt="'+altFor(e.file)+'" loading="lazy" decoding="async" data-lb="'+e.lb+'" tabindex="0" role="button"></div>';
      }).join("") + '</div>';
    }).join("");
  }
  // 4 columns on desktop, 2 on a phone, never more than there are photos (so
  // three photos make three full-width columns, not three quarters of a page).
  var galMQ = window.matchMedia("(max-width:760px)");
  function galColCount(){ return Math.min(galMQ.matches ? 2 : 4, galFiles.length) || 1; }
  var galleryBlock = (galFiles.length || real(p.galleryVideo)) ?
    '<div class="hero-gallery" id="heroGallery">' +
      '<div class="gcols">' + galleryHTML(galColCount()) + '</div>' +
      (real(p.galleryVideo)?'<div class="gallery-vid">'+videoFig(p.galleryVideo,"16/9")+'</div>':'') +
    '</div>' : '';

  // material chips now sit directly under the hero image, single words, each
  // linking to its own entry on the Material Guide when a matching material
  // exists there (falls back to a plain link to the guide if not found, never
  // a dead link).
  /* chips from a comma list ("Cherry, Frosted glass, ..."). A function, not a
     one-off: a FINISH option with its own `materials` re-draws the line with
     it (see VARIANTS), so the chips say what the chosen finish is made of. */
  function matChips(list){
    var words = real(list) ? String(list).split(",").map(function(s){ return s.trim(); }).filter(Boolean) : [];
    return words.map(function(w){
      var slug = MAT_SLUGS[w.toLowerCase()];
      // ?for=<project> opens every material this project uses on the guide;
      // #slug then scrolls to the one that was clicked
      return '<a href="materials.html?for='+encodeURIComponent(id)+(slug?'#'+slug:'')+'">'+esc(w.toUpperCase())+'</a>';
    }).join('<span class="sep" aria-hidden="true">/</span>');
  }
  /* CUSTOM LINE (2026-11-02, site review section 2): one sentence under the
     chips on EVERY product, set in the chip row's own type, with a plain
     underlined link to the contact page. Not a red button: the row keeps its
     one button, INQUIRE. The two inline styles are the only styling it has
     (no .hero-custom rule in css/style.css yet); move them there if wanted.
     2026-11-03 (review 2026-11-02_2 finding 1, Q1): one wording for every
     product (no "woods": FLOW has none), framed as a commission, and the link
     names the product (&from=<CODE>) so the Contact page and the inquiry say
     where it came from. The FINISH block below adds &finish=<name> to it
     whenever a finish is chosen. The link has its own class,
     .hero-custom-link, for the stylesheet to take over the inline style. */
  var heroCustom =
    '<p class="hero-custom">A custom one can be made to order now, in another size, material or finish. ' +
      '<a class="hero-custom-link" href="contact.html?about=Custom&amp;from=' + encodeURIComponent(p.title) + '">ASK ABOUT CUSTOM &rarr;</a></p>';
  var heroMatl =
    '<div class="hero-materials">' +
      '<span class="hero-chips">' + matChips(p.materials) + '</span>' +
      heroCustom +
    '</div>';

  /* HERO BOX (2026-11-03, score round 2, 3D item 5): width/height alone give
     the box the default photo's shape only until a photo arrives; a FINISH
     photo of another shape then moved everything below it. The explicit
     aspect-ratio (from js/image-sizes.js) keeps the default's box whatever
     loads into it (object-fit:contain in the stylesheet letterboxes it). */
  var heroDims = (typeof IMG_SIZES !== "undefined" && IMG_SIZES[id]) ? IMG_SIZES[id][heroSrc] : null;
  var heroBox = heroDims ? ' style="aspect-ratio:' + heroDims[0] + ' / ' + heroDims[1] + '"' : '';
  var hero =
    '<section class="hero">' +
      '<figure class="hero-main">' +
        '<img src="'+img(heroSrc)+'"'+srcAttrs(heroSrc, HERO_SIZES)+heroBox+' alt="'+altFor(heroSrc)+'" fetchpriority="high" decoding="async" data-lb="0" tabindex="0" role="button">' +
      '</figure>' +
      // specs + INQUIRE share one row directly under the image, the red
      // INQUIRE block sitting at the row's right end (Figma: specs at the
      // hero's left edge, inquire at its right edge, same baseline).
      '<div class="hero-specs">' +
        (year?'<span class="sp">'+esc(year)+'</span>':'') +
        (real(p.size)?'<span class="sp">'+esc(p.size)+'</span>':'') +
        (real(p.status)?'<span class="brk" aria-hidden="true"></span><span class="sp st">'+esc(p.status)+'</span>':'') +
        // 2026-11-02 (review Q15): second line = price, when there is one,
        // then the availability sentence; third line = where it was shown.
        // All three are strings in js/projects-data.js (price, availability,
        // exhibited); "" or missing hides the line, via real().
        ((real(p.price) || real(p.availability)) ?
          '<span class="brk" aria-hidden="true"></span>' +
          (real(p.price)?'<span class="sp price">'+esc(p.price)+'</span>':'') +
          (real(p.availability)?'<span class="sp av" style="white-space:normal">'+esc(p.availability)+'</span>':'') : '') +
        (real(p.exhibited)?'<span class="brk" aria-hidden="true"></span><span class="sp ex" style="white-space:normal">Exhibited: '+esc(p.exhibited)+'</span>':'') +
        '<a class="inq" href="contact.html?about=' + encodeURIComponent(p.title) + '">INQUIRE &rarr;</a>' +
      '</div>' +
      heroMatl +
      // The aside fills the height of the hero image (align-self:stretch) and
      // splits top/bottom: title + tagline stacked at the TOP, against the
      // image's top-right; the summary paragraph + the demo video pinned to the
      // BOTTOM, level with the image's bottom edge (paragraph left, video out
      // at the right page margin).
      '<div class="hero-aside">' +
        '<div class="hero-aside-top">' +
          '<h1 class="hero-title">'+esc(p.title)+'</h1>' +
          (real(p.teaser)?'<p class="hero-tagline">'+esc(p.teaser)+'</p>':'') +
        '</div>' +
        '<div class="hero-aside-btm">' +
          (real(p.summary)?'<p class="desc">'+withInfo(esc(p.summary), p.summaryMore)+'</p>':'') +
          (real(p.heroVideo)?'<div class="hero-vid">'+videoFig(p.heroVideo,"16/9")+'</div>':'') +
        '</div>' +
      '</div>' +
    '</section>' +
    galleryBlock;

  // ---------- MODEL + MECHANISM, SIDE BY SIDE ----------
  // 2026-07-22: combined from two stacked sections (model above, mechanism
  // below - each faking a "connected" feel with a vertical overlap hack)
  // into ONE row, model on the left / mechanism on the right, per Owen's
  // explicit request. Falls back to a single full-width column if only one
  // half has content (only KART currently has either - see solo-model/
  // solo-mech classes below and the matching CSS).
  // The model-viewer element is deliberately bigger than its layout slot
  // (.cad-stage) so a zoomed model floods past it and underlaps the page.
  // To keep that flood from stealing the cursor everywhere, pointer input is
  // gated to the compact slot box by a script further down (search
  // "interaction contained"): the model only takes wheel/drag while the
  // cursor is over the box, and is pointer-events:none everywhere else so
  // the page scrolls and its links stay clickable through the flooded model.
  var glbView = real(p.modelRender) ? p.modelRender : (real(p.model) ? p.model : "");
  // load the model-viewer library only when there is actually a model to show
  var MV_SRC = "js/vendor/model-viewer.min.js?v=2";
  /* ---------- VIEWER FAILURE (2026-11-02, review A2 / Q38) ----------
     Library 404, GLB 404 or decode failure, no WebGL: the loader used to run to
     its 9 s cap and the page then showed RESET and VIEW IN YOUR SPACE around an
     empty stage. Now the viewer row hides itself, no message (Owen's default):
     the stage collapses, the controls and hint go, the mechanism or the next
     section moves up. Inline display:none as well as [hidden], because
     .mv-bar's display:flex would beat the attribute. Also fires a synthetic
     "error" on the element so holdLoader's wait and armModel's hold release
     at once instead of at their caps. Called from: the library <script>'s
     error event, the element's own "error" event, and the no-load watch in
     armModel. */
  var viewerFailedOnce = false;
  /* the drawn model's box on screen, {top, bottom} in viewport px, or null
     before it is framed. Set by frameModel(); read by the #model jump. */
  var modelExtent = null;
  function viewerFailed(why){
    if(viewerFailedOnce) return; viewerFailedOnce = true;
    try { console.warn("3D viewer hidden: " + why); } catch(e){}
    var el = document.getElementById("mv");
    var stage = el ? el.closest(".cad-stage") : document.querySelector(".cad-stage");
    var half = stage ? stage.closest(".cad-hiw-model") : null;
    var row = half ? half.closest(".cad-hiw") : null;
    [stage, half, row].forEach(function(n){ if(n) n.classList.add("mv-failed"); });
    var hide = (half || document).querySelectorAll(".mv-ar, .mv-qr, .mv-bar, .mv-hint");
    Array.prototype.forEach.call(hide, function(n){ n.hidden = true; n.style.display = "none"; });
    if(stage){ stage.hidden = true; stage.style.display = "none"; }
    /* 2026-11-03 (review 2026-11-02_2 finding 16, fix j): the empty model
       column used to stay as a 710 px hole beside the mechanism, because the
       grid kept its column. Done here in the DOM, not left to a CSS rule: the
       model half leaves the layout, and the row becomes exactly what a product
       with a mechanism and no model already is (.solo-mech, existing CSS). A
       row with no mechanism has nothing left to show and goes too. .mv-failed
       stays on the stage, the half and the row for the stylesheet. */
    if(half){ half.hidden = true; half.style.display = "none"; }
    if(row){
      if(row.querySelector(".cad-hiw-mech")){ row.classList.remove("solo-model"); row.classList.add("solo-mech"); }
      else { row.hidden = true; row.style.display = "none"; }
      // the how-it-works pull (alignHiw) is measured: measure again
      try { setTimeout(function(){ window.dispatchEvent(new Event("resize")); }, 0); } catch(e){}
    }
    // (the mechanism keeps its own DRAG TO INTERACT: every interactive element has one, 3 Nov 2026)
    if(el){ try { el.dispatchEvent(new Event("error")); } catch(e){} }
  }
  /* set by the model block below once <model-viewer> exists:
       relayoutModel()  reserves the model's space (size, overlap, control bar)
                        from the GLB's own numbers, before the model is loaded
       showModel()      fades the model and its control bar in, once drawn
       jumpModelNow()   the #model jump, run under the loader when it can be */
  var relayoutModel = function(){}, showModel = function(){}, jumpModelNow = null;
  var glbInfoP = null;   // readGlbInfo() of this page's GLB, started with the page
  /* ---------- THE GLB'S OWN NUMBERS, BEFORE THE MODEL (Owen, 3 Nov 2026) ----------
     The loading screen no longer waits for the model, so the model builds
     after the reveal. For nothing to move when it lands, its space has to be
     reserved first: its size on screen, the control bar under it and which
     buttons that bar carries. All of that is in the GLB's JSON chunk, the
     first few KB of the file: the bounding box of every mesh (accessor
     min/max, through the node transforms, the same box model-viewer's
     getDimensions() reports), whether there is an "explode" clip, whether a
     material glows (LIGHT ON), and the material variants. Read as a stream
     and cancelled once the JSON is in, so the 800 KB body is not downloaded
     twice. Resolves to null on any failure: the page then sizes the model
     when it loads, as before. General: nothing per product. */
  var glbInfo = null;
  function readGlbInfo(url){
    function parse(u8){
      var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      if(dv.getUint32(0, true) !== 0x46546C67) throw new Error("not a GLB");
      if(dv.getUint32(16, true) !== 0x4E4F534A) throw new Error("no JSON chunk");
      var len = dv.getUint32(12, true);
      return JSON.parse(new TextDecoder().decode(u8.subarray(20, 20 + len)));
    }
    function mul(a, b){                     // 4x4, column-major (glTF order)
      var o = new Array(16);
      for(var c = 0; c < 4; c++) for(var r = 0; r < 4; r++){
        var v = 0; for(var k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = v;
      }
      return o;
    }
    function local(n){
      if(n.matrix && n.matrix.length === 16) return n.matrix;
      var t = n.translation || [0,0,0], q = n.rotation || [0,0,0,1], sc = n.scale || [1,1,1];
      var x = q[0], y = q[1], z = q[2], w = q[3];
      return [
        (1 - 2*(y*y + z*z)) * sc[0], (2*(x*y + z*w)) * sc[0], (2*(x*z - y*w)) * sc[0], 0,
        (2*(x*y - z*w)) * sc[1], (1 - 2*(x*x + z*z)) * sc[1], (2*(y*z + x*w)) * sc[1], 0,
        (2*(x*z + y*w)) * sc[2], (2*(y*z - x*w)) * sc[2], (1 - 2*(x*x + y*y)) * sc[2], 0,
        t[0], t[1], t[2], 1];
    }
    function summarize(g){
      var nodes = g.nodes || [], meshes = g.meshes || [], acc = g.accessors || [];
      var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      function walk(i, parent, depth){
        var n = nodes[i]; if(!n || depth > 64) return;
        var M = mul(parent, local(n));
        var mesh = (n.mesh != null) ? meshes[n.mesh] : null;
        (mesh && mesh.primitives || []).forEach(function(pr){
          var a = acc[pr.attributes && pr.attributes.POSITION];
          if(!a || !a.min || !a.max) return;
          for(var c = 0; c < 8; c++){
            var v = [(c & 1) ? a.max[0] : a.min[0], (c & 2) ? a.max[1] : a.min[1], (c & 4) ? a.max[2] : a.min[2]];
            for(var r = 0; r < 3; r++){
              var w = M[r] * v[0] + M[4 + r] * v[1] + M[8 + r] * v[2] + M[12 + r];
              if(w < lo[r]) lo[r] = w; if(w > hi[r]) hi[r] = w;
            }
          }
        });
        (n.children || []).forEach(function(c){ walk(c, M, depth + 1); });
      }
      var I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
      var sc = (g.scenes || [])[g.scene || 0], roots = sc && sc.nodes;
      if(!roots){
        var child = {}; nodes.forEach(function(n){ (n.children || []).forEach(function(c){ child[c] = 1; }); });
        roots = nodes.map(function(n, i){ return i; }).filter(function(i){ return !child[i]; });
      }
      roots.forEach(function(i){ walk(i, I, 0); });
      if(!(hi[1] > lo[1])) return null;
      var ext = (g.extensions || {}).KHR_materials_variants;
      return {
        dims: { x: hi[0] - lo[0], y: hi[1] - lo[1], z: hi[2] - lo[2] },
        explode: (g.animations || []).some(function(a){ return /explode/i.test(a.name || ""); }),
        lamp: (g.materials || []).some(function(m){ var e = m.emissiveFactor; return !!(e && (e[0] > 0 || e[1] > 0 || e[2] > 0)); }),
        variants: ((ext && ext.variants) || []).map(function(v){ return v.name; })
      };
    }
    return fetch(url).then(function(res){
      if(!res.ok) throw new Error("GLB answered " + res.status);
      if(!res.body || !res.body.getReader) return res.arrayBuffer().then(function(b){ return parse(new Uint8Array(b)); });
      var reader = res.body.getReader(), parts = [], got = 0, need = 20;
      function joined(){
        var u = new Uint8Array(got), o = 0;
        parts.forEach(function(x){ u.set(x, o); o += x.length; });
        parts = [u]; return u;
      }
      return (function pump(){
        return reader.read().then(function(r){
          if(r.value){ parts.push(r.value); got += r.value.length; }
          if(need === 20 && got >= 20){ var h = joined(); need = 20 + new DataView(h.buffer).getUint32(12, true); }
          if(got >= need || r.done){
            try { reader.cancel(); } catch(e){}
            return parse(joined());
          }
          return pump();
        });
      })();
    }).then(summarize).catch(function(e){
      try { console.warn("GLB header not read, the model is sized when it loads:", e); } catch(e2){}
      return null;
    });
  }
  /* ---------- MODEL LOAD ----------
     Owen, 3 Nov 2026 (replaces his 5 Oct call that the loader waits for the
     model): "loading screen can finish before 3d model ... I just dont want
     any lag or things visibly loading in." So:
       1. under the loader: the GLB's JSON is read (readGlbInfo) and the
          model's space and control bar are reserved at their final size;
          the library, GLB and Draco decoder are prefetched (network only);
       2. the loader lets go without the model (holdLoader);
       3. once its fade has finished and the page is idle, armModel() calls
          loadModel(): the library is compiled, the GLB decoded, the shaders
          compiled and the textures uploaded one per frame (gateFirstDraw);
       4. the model and its control bar then fade in together (showModel,
          opacity only), already framed, so nothing moves or pops.
     (2026-08-29 to 2026-10-04 the model loaded on scroll-approach; 2026-10-05
     to 3 Nov 2026 the loader waited for it.) */
  var loadModel = null;
  if(glbView){
    loadModel = function(){
      if(loadModel.done) return;
      loadModel.done = true;
      /* Cap the resolution model-viewer renders at, and do it BEFORE its
         module loads - it reads devicePixelRatio once, on the way up.
         Measured on the live page: the element resolves to about 3150 x 3260
         CSS pixels (130vw by five --model-slot rows), so at dpr 2 that is a
         ~41 megapixel framebuffer, redrawn in full on every model frame, and
         doubled again by the frosted shade's transmission pass. Capping at 1.5
         matches the loader and the mechanism canvas (the site-wide rule) and is
         not visible on this matte model at display size.
         This used to run at the top of the page, where it capped dpr for
         EVERYTHING - including the loader's own canvas. It belongs here, with
         the only thing that needs it. Only JS reads change; srcset selection
         and media queries are browser-internal and untouched. */
      if((window.devicePixelRatio || 1) > 1.5){
        try {
          Object.defineProperty(window, "devicePixelRatio",
            { get: function(){ return 1.5; }, configurable: true });
        } catch(e){}
      }
      if(!document.querySelector('script[data-mv]')){
        var mvs = document.createElement("script");
        mvs.type = "module"; mvs.src = MV_SRC; mvs.setAttribute("data-mv","");
        // a blocked or missing library: hide the viewer and let the loader go
        mvs.addEventListener("error", function(){ viewerFailed("model-viewer library did not load (" + MV_SRC + ")"); });
        document.head.appendChild(mvs);
      }
      /* ---------- SELF-HOSTED DRACO DECODER ----------------------------------
         The GLBs are Draco-compressed (KHR_draco_mesh_compression is in their
         extensionsRequired), so model-viewer cannot show them at all until it
         has a decoder. Out of the box it fetches one from
         www.gstatic.com/draco/versioned/decoders/1.5.6/ - two requests,
         ~250KB, to a third-party host, on the critical path of the only piece
         of the page that is not already local. Measured on kart.html: the
         wrapper and the .wasm cost a round trip each before the model can even
         begin to decode, and the WebAssembly compile that follows is the
         single longest main-thread block on the page. Nothing else on this site
         touches a third-party server; this was the last one.
         The same decoder now ships in js/vendor/draco/, so it comes off the
         same connection as everything else, is cached under our own cache
         headers, and cannot break because Google moved a URL.
         Set on the class, not the element - it is a static property - and
         guarded by whenDefined so it lands before the first decode either way.
         The trailing slash matters: model-viewer concatenates the filenames. */
      if(window.customElements && customElements.whenDefined){
        customElements.whenDefined("model-viewer").then(function(){
          try {
            var C = customElements.get("model-viewer");
            if(C) C.dracoDecoderLocation = new URL("js/vendor/draco/", document.baseURI).href;
          } catch(e){}
        });
      }
      var el = document.getElementById("mv");
      /* setAttribute, NOT el.src. Until the module lands, <model-viewer> is an
         unknown element with no src accessor, so `el.src = ...` just parks a
         plain own property on it - which is then SHADOWING the real accessor
         once the element upgrades, so the fetch never starts. Verified: the
         GLB was never requested. The attribute is observed either way, so this
         works whichever arrives first, the library or this line. */
      if(el) el.setAttribute("src", el.getAttribute("data-src"));
    };
  }
  var modelHalf = glbView ?
    '<div class="cad-hiw-model">' +
      '<div class="cad-stage" role="region" aria-label="'+esc(p.title)+' 3D model">' +
        // NO src ATTRIBUTE in the markup. The GLB is attached by loadModel()
        // (see "MODEL LOAD"), which armModel() calls as soon as the page is
        // built; until then an empty model-viewer renders transparent and asks
        // for no WebGL context.
        // ?v=3 : OMNI GLB stripped of its INK_ outline meshes 2026-11-02 (?v=2: re-exported 2026-08-29 with 512px textures)
        // (1.5MB -> 772KB, ~122MB of GPU texture memory down to ~30MB) under
        // the same filename. Keep in step with MODEL_V in js/menu.js (the next-page warm-up list).
        '<model-viewer id="mv" data-src="'+img(glbView)+'?v=3" ' +
          (real(p.modelUSDZ)?'ios-src="'+img(p.modelUSDZ)+'" ':'') +
          'alt="'+esc(p.title)+' 3D model" camera-controls touch-action="pan-y" ' +
          // camera radius is set as a % of the auto-framing distance so the
          // DEFAULT model size is decoupled from the (deliberately huge) element:
          // 230% starts it small + clears the control bar; min 45% lets a zoom-in
          // grow it well past the element so it floods/underlaps the page.
          // disable-pan: the model TURNS, it never slides around.
          // model-viewer calls translating the model "pan" and rotating the
          // camera around it "orbit". Panning was on by default (two-finger
          // drag on touch, right-click drag on desktop), so on a phone the
          // lamp kept getting shoved off-centre with no obvious way back -
          // which is not a thing you want a product viewer to do. Orbit and
          // zoom stay; only the translation is gone.
          // 228%, not the old 130%: the viewer element is now ~1.72x taller.
          // The framing distance (100%) is INDEPENDENT of element size - it
          // only depends on the model and the field of view - so apparent size
          // works out as elementHeight / radius. That means the radius has to
          // grow by the FULL element-height factor to keep the model looking
          // the same size at rest. Change the element size in css/style.css
          // (.cad-stage model-viewer) and this has to move with it.
          /* loading="eager": model-viewer has an IntersectionObserver of its
             own, and on the default loading="auto" it refuses to build a
             scene until the element is near the viewport - $updateSource
             logs "BAILING OUT EARLY" and returns. That made the idle
             preload in armModel() impossible: the src was set, nothing
             happened, and 60s later the model was still unloaded, so every
             bit of its ~2s of compile cost landed on the scroll after all.
             eager does NOT mean "load on page load" here - the src is not
             attached until loadModel() runs, so this only removes
             model-viewer's veto and leaves the timing to us. */
          // disable-zoom (Owen, 2026-10-05): the model turns, it does not zoom. It
          // also means the wheel always scrolls the page, even over the model.
          'disable-pan disable-zoom loading="eager" interaction-prompt="none" camera-orbit="-25deg 76deg 228%" ' +
          // These attribute values are only a first frame's worth of defaults -
          // the real limits are set in metres once the model loads, because
          // model-viewer does not clamp radius percentages here reliably.
          // See setZoomRange() further down.
          // These are only placeholders for the first frame. They must be WIDER
          // than the real range or they will clamp the default before the JS
          // runs - a too-low max here quietly pulled the camera in and made the
          // model render bigger than intended. The real limits are set in
          // metres once the model loads: see setZoomRange().
          'min-camera-orbit="auto auto 20%" max-camera-orbit="auto auto 600%" ' +
          /* NO auto-rotate, deliberately (2026-08-29). model-viewer only
             draws when the scene is DIRTY; auto-rotate marks it dirty on every
             single frame, so the page carried a permanent WebGL loop for as
             long as it was open. The element is 130vw x 5 slots - about 6.5
             megapixels of CSS, ~14.5 MP at the 1.5 dpr cap - and the frosted
             shade (KHR_materials_transmission) makes three.js render the whole
             scene a SECOND time into a transmission target every frame. So the
             turntable cost roughly 29 MP of fill per frame, forever, competing
             with the compositor for exactly the frames scrolling needed. That
             was the "KART feels slow" report.
             Without it the model draws ONE frame, the loop stops, and the page
             costs nothing until you click into the model - at which point
             model-viewer wakes on its own and idles again when you let go.
             If a turntable is ever wanted back, put it behind the click-to-
             interact gate below (mv.autoRotate = true on engage, false on
             disengage) so it can never run while someone is reading. */
          'shadow-intensity="0" exposure="1" environment-image="neutral" tone-mapping="neutral" ' +
          // (loading="eager" is set above; a second loading="lazy" used to sit here
          //  and was a trap: delete the first and the idle preload silently stops.)
          'ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed">' +
          // an EMPTY ar-button slot: model-viewer still needs the slot to exist
          // to consider AR wired up, but we drive it from our own button above
          // via activateAR() so the layout is ours to control.
          '<span slot="ar-button" hidden></span>' +
          // an EMPTY progress-bar slot: model-viewer's own loading bar is a
          // thin line across the top of the element, which read as a stray
          // scroll bar on the model's frame (Owen, 2026-10-05). The model now
          // loads under the loading screen, so there is nothing to show.
          '<div slot="progress-bar"></div>' +
        '</model-viewer>' +
      '</div>' +
      // controls sit OUTSIDE the tilted stage on their own row: exploded +
      // reset, the material picker (and the light switch) beside them. No borders or chips; these should read as
      // printed text until touched.
      '<div class="mv-bar">' +
        '<div class="mv-group mv-left">' +
          '<button class="mv-btn" data-act="explode" hidden aria-pressed="false">EXPLODED VIEW</button>' +
          '<button class="mv-btn" data-act="reset">RESET</button>' +
        '</div>' +
        '<div class="mv-group mv-mid">' +
          '<select class="mv-sel" aria-label="Material" hidden></select>' +
          // hidden until the model has loaded AND turned out to have a lamp in it
          // (an emissive material). A speaker does not get a LIGHT ON button.
          // On / off only (Owen, 2026-10-28: the brightness slider is gone).
          '<button class="mv-btn" data-act="power" hidden>LIGHT ON</button>' +
        '</div>' +
        /* VIEW IN YOUR SPACE (R1-Q1 default, 3 Nov 2026): the last group of the
           control row, under the stage, never on the render. It used to be a
           label pinned over the model (.mv-ar-row, absolute at the top of the
           column), which put the red block on KART's glass and on OMNI's
           grille at rest, because the resting model reaches up past its slot
           by design. Here it can never touch the model on any product or
           width. The QR panel hangs UP from the button (bottom:100%), over the
           model, so opening it moves nothing. The inline styles stand in for
           a css/style.css rule (.mv-arw) until the stylesheet carries one. */
        '<div class="mv-group mv-arw">' +
          '<button class="mv-ar" type="button" hidden>VIEW IN YOUR SPACE &rarr;</button>' +
          // desktop only: the head-tracked window (js/headview.js, loaded on click)
          '<button class="mv-ar mv-look" type="button" hidden>LOOK AROUND IT &rarr;</button>' +
          '<div class="mv-qr" hidden>' +
            '<div class="mv-qr-img"></div>' +
            '<p class="mv-qr-note">Scan with your phone<br>to see it in your space.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' : '';

  var mechFile = p.mechanism || "";
  var mechEl = real(mechFile)
    ? (/\.html?$/i.test(mechFile)
        ? '<iframe id="mechFrame" class="mech-frame" src="'+img(mechFile)+'?v=27" title="'+esc(p.title)+' mechanism, interactive diagram" loading="lazy" scrolling="no"></iframe>'
        : '<figure class="fig cut"><img src="'+img(mechFile)+'" alt="'+esc(p.title)+' mechanism diagram"></figure>')
    : '';
  // p.mechNotes (a numbered list under the intro) isn't part of the Figma
  // reference - HOW IT WORKS there is just the graphic, the mode buttons, and
  // one line of intro text - so it's no longer rendered here. The data can
  // stay in projects-data.js, it's simply unused now.
  /* The .hiw-graphic box is emitted ONLY when there is something to put in it.
     This matters more than it looks: css/style.css pulls .hiw-graphic upward
     and downward with large negative margins, to crop the transparent buffer
     that a mechanism file carries around its artwork. An EMPTY .hiw-graphic
     still received those margins, which collapsed the section and dragged the
     process grid up over the how-it-works text above it. That was the
     "first process image overlaps the last paragraph" bug on every project
     without a mechanism (NEB, FLOW, HALO). No box, no negative margins,
     no overlap. The `has-mech` class is what the crop margins key off now,
     so the crop can never apply to a box that has nothing to crop. */
  var graphicInner = mechEl + (real(p.hiwVideo) ? videoFig(p.hiwVideo,"16/9") : '');
  var mechHalf = (graphicInner || real(p.howItWorks)) ?
    '<div class="cad-hiw-mech">' +
      (real(p.howItWorks)?'<div class="hiw-text"><p class="desc">'+withInfo(esc(p.howItWorks), p.howItWorksMore)+'</p></div>':'') +
      (graphicInner ? '<div class="hiw-graphic'+(mechEl?' has-mech':'')+'">'+graphicInner+'</div>' : '') +
    '</div>' : '';

  var cadHiwMode = (modelHalf && mechHalf) ? '' : (modelHalf ? ' solo-model' : (mechHalf ? ' solo-mech' : ''));
  // kept as `cad`/`hiw` (hiw always '') rather than renaming everywhere
  // below, since `sections` further down just does
  // [hero, cad, hiw, ...].filter(Boolean) - smaller diff, same result.
  var cad = (modelHalf || mechHalf) ?
    '<section class="cad-hiw'+cadHiwMode+'" id="model">' + modelHalf + mechHalf + '</section>' : '';
  var hiw = '';

  // ---------- PROCESS (dense scatter; the writing lives INSIDE it) ----------
  var procImgs = (p.process||[]).filter(keep);
  var procVidCell = real(p.processVideo) ? '<div class="cell" style="grid-column:2 / 8;margin-top:90px;">'+videoFig(p.processVideo,"16/9")+'</div>' : '';
  var procImgCells = scatter(procImgs, rnd, {notes:p.processNotes, variant:gVar}); // array of cells
  // processText: keep it to TWO short paragraphs (blank line splits them).
  // The first sits at the very TOP of the scatter, right under the mechanism
  // graphic; the second sits at the very BOTTOM, near whatever the last
  // process photo is (Figma reference: one block near the CAD/mechanism
  // area, one lower near the breadboard shot). Putting them first/last in
  // the cell array (rather than side by side under the first image) is what
  // actually lands them at the top/bottom of the scatter, since the grid
  // flows in DOM order. No PROCESS label, no lede block. processMore
  // (optional) hangs the fuller story behind the info icon on the first
  // block; anything past two paragraphs in processText is unused, keep it
  // to two.
  // processText is the short top block; processMore is the fuller detail shown
  // as its own block lower in the scatter. Both are archive-only content.
  // 4 columns, not 3 (2026-10-02): at 3 the justified text opened wide word
  // gaps. Checked on all five projects: no cell overlaps, same section height.
  var procTextTop = real(p.processText) ?
    '<div class="cell proc-note" style="grid-column:7 / 11;margin-top:0;">' +
      '<p class="desc">'+esc(p.processText)+'</p></div>' : '';
  var procTextBottom = real(p.processMore) ?
    '<div class="cell proc-note" style="grid-column:2 / 6;">' +
      '<p class="desc">'+esc(p.processMore)+'</p></div>' : '';
  var procCells = (procTextTop ? [procTextTop] : []).concat(procImgCells).concat(procTextBottom ? [procTextBottom] : []);
  // designTags: short, provable claims (Designed for disassembly, Repairable,
  // Open source, etc), shown as small red tags, plus the one-line lifecycle/
  // end-of-life note. This used to be its own standalone MATERIALS section;
  // it now rides inside the process scatter as one more text cell (the
  // per-material name chips moved up under the hero image instead, see
  // heroMatl above). Only list designTags that are actually true for THIS
  // project, this is a claim, not a mood board.
  // designTags are no longer shown (not part of the current copy); only the
  // one-line lifecycle note rides in the process scatter, archive pages only.
  var matlCell = matlNoteCell([], p.lifecycle, (gVar % 2 === 0) ? "2 / 8" : "6 / 12", 0);
  if(matlCell) procCells.push(matlCell);
  if(procVidCell) procCells.push(procVidCell);
  var process = (procImgCells.length || procVidCell || procTextTop || procTextBottom) ?
    '<section class="proc">' +
      '<div class="scatter">'+ procCells.join('') +'</div>' +
    '</section>' : '';

  // ---------- READ MORE: one page. The storefront content (hero + gallery +
  // CAD/graphic) shows first; this button reveals the fuller process /
  // portfolio section below it, on the same page. Hidden entirely if a
  // project has no process content to reveal. ----------
  var hasMore = !!process;
  var readmore = hasMore ?
    '<div class="readmore" id="readmoreWrap">' +
      '<button type="button" class="read-more-link" id="readMoreBtn" aria-expanded="false" aria-controls="procReveal">Process and detail</button>' +
    '</div>' : '';
  // the visually hidden h2 gives screen readers a heading for the section
  // (the page's only other heading is the h1 product name)
  var processReveal = hasMore ? '<div class="proc-reveal" id="procReveal" hidden><h2 class="vh">Process and detail</h2>' + process + '</div>' : '';

  // ---------- assemble: hero, CAD/graphic, the read-more button, then the
  // (revealed on click) process section. Material swatches, the component
  // spread, and V2 are retired. ----------
  var sections = [hero, cad, readmore, processReveal].filter(Boolean);
  var content = document.getElementById("content");
  content.innerHTML = sections.join('');
  /* ---------- VARIANTS: colour, material and finish options (2026-11-02) ----------
     p.variants is a list of options for the product; see the header of
     js/projects-data.js for the fields. With two or more options a FINISH row
     of swatches is drawn under the material chips. Choosing one:
       1. swaps the 3D model's material variant (KHR_materials_variants baked
          into the GLB, matched by `model` name). An option with no `model`, or
          a name the GLB does not have, shows the GLB's ORIGINAL materials
          (variantName = null; a missing name is warned once in the console);
       2. swaps every photo NAMED in its `images` list: same filename under
          projects/<id>/variants/<option id>/ (and its sm/ md/ copies, sizes from
          js/image-sizes.js). Photos not listed stay as the default; a listed
          photo that fails to load falls back to the default one. The option's
          optional `alt` map ({ "hero.jpg": "..." }) replaces those photos'
          descriptions; without it the default alt stays;
       3. writes the option into the INQUIRE and ASK ABOUT CUSTOM links
          (contact.html?about=KART&finish=Walnut, ...&from=KART&finish=Walnut);
       4. remembers the choice for this tab (sessionStorage, review Q21) and
          keeps it in the address (?finish=<id>, history.replaceState, no new
          history entry), so a copied or shared link opens in that finish;
       5. with a non-default finish and VIEW IN YOUR SPACE showing, a line says
          AR shows the default finish (the AR files carry one finish, Q20).
     The first option is the default and uses the original files and the GLB's
     original materials unless it names a variant (Q19).
     2026-11-03 order (review 2026-11-02_2 finding 6, UX 3.9): the row sits
     INSIDE .hero-materials, between the chips and the custom line, and INQUIRE
     moves to the end of the row (class .fin-inq), so it reads: chips, choose a
     finish, INQUIRE, then the custom offer. Without variants nothing moves.
     The selected swatch carries .fin-on (and aria-checked) so the stylesheet
     can draw it unlike the focus ring.
     Nothing here is keyed on a project: a product with no `variants` draws
     nothing. */
  var VPATH = function(s){ return s; };   // lightbox asks this for the current file
  var VALT = function(file, d){ return d; };   // ...and this for its description
  (function variants(){
    var vs = (p.variants || []).filter(function(v){ return v && typeof v === "object" && real(v.id); });
    if(vs.length < 2) return;
    var KEY = "newo-finish-" + id;
    var want = null;
    try { want = new URLSearchParams(location.search).get("finish"); } catch(e){}
    try { if(!want) want = sessionStorage.getItem(KEY); } catch(e){}
    var cur = vs[0], inUrl = false;
    try { inUrl = new URLSearchParams(location.search).has("finish"); } catch(e){}
    vs.forEach(function(v){ if(want && String(v.id).toLowerCase() === String(want).toLowerCase()) cur = v; });
    function warn(msg){ try { console.warn(msg); } catch(e){} }

    // ---- the row
    var row = document.createElement("div");
    row.className = "hero-finish";
    row.setAttribute("role", "radiogroup");
    row.setAttribute("aria-label", "Finish");
    row.innerHTML = '<span class="fin-label">FINISH</span>' +
      vs.map(function(v){
        var sw = real(v.swatch) ? String(v.swatch) : "#888";
        /* an image swatch is an ABSOLUTE url: inside a custom property a
           relative url() resolves against the stylesheet (css/), not the page,
           so it used to request css/projects/<id>/variants/... (review F1) */
        var style = /^#|^rgb|^hsl/.test(sw) ? "--sw:" + sw :
          "--sw:url(&quot;" + esc(new URL(base + "variants/" + encodeURIComponent(sw), location.href).href) + "&quot;)";
        return '<button type="button" class="fin-sw" role="radio" aria-checked="false" data-vid="' + esc(String(v.id)) + '" style="' + style + '" aria-label="' + esc(String(v.name || v.id)) + '" title="' + esc(String(v.name || v.id)) + '"></button>';
      }).join("") +
      '<span class="fin-name" aria-live="polite"></span>';
    var mats = content.querySelector(".hero-materials");
    var custom = mats && mats.querySelector(".hero-custom");
    var anchor = mats || content.querySelector(".hero-specs");
    if(!anchor) return;
    if(custom) custom.insertAdjacentElement("beforebegin", row);
    else anchor.insertAdjacentElement("afterend", row);
    // choose, then ask: INQUIRE follows the swatches (.hero-finish .fin-inq
    // in css/style.css: same button, pushed to the row's end)
    var inq = content.querySelector(".hero-specs a.inq");
    if(inq){
      inq.classList.add("fin-inq");
      row.appendChild(inq);
    }
    /* ONE NOTE LINE under the row (score round 1, UX 1 and layout 4). Its
       line is RESERVED (visibility, not hidden/display), so a note appearing
       never moves the gallery. It says, in this order:
         "Photos show <default name>."  the chosen finish swaps no photo on the
                                         page and the 3D model has no variant
                                         for it (or there is no model), so
                                         nothing on screen depicts it;
         "AR shows the default finish." something does depict it, but VIEW IN
                                         YOUR SPACE is showing and the AR files
                                         carry one finish.
       Empty (line kept) for the default finish. */
    var arNote = document.createElement("p");
    arNote.className = "fin-ar-note";
    arNote.setAttribute("aria-live", "polite");
    arNote.style.visibility = "hidden";
    arNote.textContent = "\u00a0";
    row.insertAdjacentElement("afterend", arNote);
    var nameEl = row.querySelector(".fin-name");
    var btns = Array.prototype.slice.call(row.querySelectorAll(".fin-sw"));

    // ---- photos
    var broken = {};   // "<option id>/<file>" that failed to load: use the default
    function fileOf(url){
      // base + (sm/|md/)? + file   ->   { pre:"sm/"|"md/"|"", file }
      var m = String(url).match(/(?:^|\/)(sm\/|md\/)?([^\/?#]+)(?:[?#].*)?$/);
      return m ? { pre: m[1] || "", file: m[2] } : null;
    }
    function hasImg(v, file){ return v !== vs[0] && Array.isArray(v.images) && v.images.indexOf(file) >= 0 && !broken[v.id + "/" + file]; }
    function vdir(v){ return base + "variants/" + encodeURIComponent(String(v.id)) + "/"; }
    function vsizes(v, file){
      var t = (typeof IMG_SIZES !== "undefined" && IMG_SIZES[id]) ? IMG_SIZES[id]["variants/" + v.id + "/" + file] : null;
      return t || null;
    }
    function valt(v, file){
      return (v && v.alt && typeof v.alt === "object" && real(v.alt[file]) && hasImg(v, file)) ? String(v.alt[file]) : null;
    }
    function restore(im){
      if(im.getAttribute("src") !== im.dataset.osrc) im.setAttribute("src", im.dataset.osrc);
      if(im.dataset.osrcset) im.setAttribute("srcset", im.dataset.osrcset); else im.removeAttribute("srcset");
      im.setAttribute("alt", im.dataset.oalt);
      im.dataset.vsw = "";
    }
    function onBroken(){
      var im = this, key = im.dataset.vsw;
      if(!key) return;               // the default photo itself: not ours to fix
      broken[key] = true;
      warn("FINISH photo missing, default shown: " + base + "variants/" + key);
      restore(im);
      applyArNote();
    }
    function applyImages(v){
      Array.prototype.forEach.call(content.querySelectorAll("img"), function(im){
        if(im.closest(".hero-finish")) return;
        if(im.dataset.osrc === undefined){
          im.dataset.osrc = im.getAttribute("src") || ""; im.dataset.osrcset = im.getAttribute("srcset") || "";
          im.dataset.oalt = im.getAttribute("alt") || "";
          im.addEventListener("error", onBroken);
        }
        var f = fileOf(im.dataset.osrc);
        if(!f) return;
        if(hasImg(v, f.file)){
          var dims = vsizes(v, f.file);
          var d = vdir(v);
          im.dataset.vsw = v.id + "/" + f.file;
          if(dims){
            var w = dims[0], set = [];
            if(hasTier(dims, "sm")) set.push(d + "sm/" + f.file + " 600w");
            if(hasTier(dims, "md")) set.push(d + "md/" + f.file + " 1200w");
            set.push(d + f.file + " " + w + "w");
            if(set.length > 1) im.setAttribute("srcset", set.join(", ")); else im.removeAttribute("srcset");
            im.setAttribute("src", d + (hasTier(dims, "sm") ? "sm/" : "") + f.file);
          } else {
            // no size entry yet (make-image-variants.py not re-run): plain file, no srcset
            im.removeAttribute("srcset");
            im.setAttribute("src", d + f.file);
          }
          var a = valt(v, f.file);
          im.setAttribute("alt", a !== null ? a : im.dataset.oalt);   // setAttribute: no markup, no escaping needed
        } else {
          restore(im);
        }
      });
    }
    VPATH = function(s){
      var f = fileOf(s);
      if(!f || !hasImg(cur, f.file)) return s;
      // a phone's lightbox asks for md/: keep it when the option has an md/ copy
      var dims = vsizes(cur, f.file);
      return vdir(cur) + ((f.pre === "md/" && dims && hasTier(dims, "md")) ? "md/" : "") + f.file;
    };
    VALT = function(file, d){ var a = valt(cur, file); return a !== null ? a : d; };

    // ---- model
    var warned = {};
    function applyModel(v){
      var mv = document.getElementById("mv");
      if(!mv || !mv.loaded) return;          // the load listener below applies it
      var avail = mv.availableVariants || [];
      var name = null;
      if(real(v.model)){
        if(avail.indexOf(v.model) >= 0) name = v.model;
        else if(!warned[v.model]){ warned[v.model] = true; warn('FINISH "' + (v.name || v.id) + '": the 3D model has no variant named "' + v.model + '" (it has: ' + (avail.join(", ") || "none") + '). Showing its original materials.'); }
      }
      // null = the GLB's original materials (model-viewer's reset value)
      if(mv.variantName !== name){ try { mv.variantName = name; } catch(e){} }
    }

    /* ---- material chips: an option may carry its own `materials` (the same
       comma list as the product's); without it the product's line stays. */
    var chipsEl = mats && mats.querySelector(".hero-chips");
    var chipsFor = p.materials;   // what the page was built with
    function applyMaterials(v){
      if(!chipsEl) return;
      var list = real(v.materials) ? v.materials : p.materials;
      if(list === chipsFor) return;
      chipsFor = list;
      chipsEl.innerHTML = matChips(list);
    }

    // ---- inquire + custom links
    function applyLink(v){
      Array.prototype.forEach.call(content.querySelectorAll("a.inq, a.hero-custom-link"), function(a){
        var h = a.getAttribute("href").replace(/&finish=[^&]*/, "");
        a.setAttribute("href", h + "&finish=" + encodeURIComponent(String(v.name || v.id)));
      });
    }

    // ---- address bar: a shared link shows the finish that was chosen
    function applyUrl(v){
      try {
        if(!window.history || !history.replaceState) return;
        var u = new URL(location.href);
        if(v === vs[0]) u.searchParams.delete("finish"); else u.searchParams.set("finish", String(v.id));
        if(u.href !== location.href) history.replaceState(history.state, "", u.href);
      } catch(e){}
    }

    // ---- AR note: VIEW IN YOUR SPACE always shows the default finish
    var arBtn = content.querySelector(".mv-ar:not(.mv-look)");
    function swapsPhoto(v){
      if(v === vs[0]) return true;
      return Array.prototype.some.call(content.querySelectorAll("img"), function(im){
        if(im.closest(".hero-finish")) return false;
        var f = fileOf(im.dataset.osrc !== undefined ? im.dataset.osrc : im.getAttribute("src"));
        return !!f && hasImg(v, f.file);
      });
    }
    function modelOnPage(){ return !!document.getElementById("mv") && !viewerFailedOnce; }
    function modelShows(v){
      var mv = document.getElementById("mv");
      if(!modelOnPage() || !real(v.model)) return false;
      // not loaded yet: the GLB's JSON says (readGlbInfo); unknown, say nothing
      if(!mv.loaded) return glbInfo ? glbInfo.variants.indexOf(v.model) >= 0 : true;
      return (mv.availableVariants || []).indexOf(v.model) >= 0;
    }
    /* 2026-11-03 (score round 2, UX 2): the photos can show the option while
       the 3D model below still shows the default (no matching GLB variant).
       The note now names that too, merged with the AR line, one line:
         nothing depicts it, model on the page  "Photos and 3D model show <default>."
         nothing depicts it, no model           "Photos show <default>."
         photos do, the model does not          "3D model shows <default>."
                                                 ("3D model and AR show <default>."
                                                  when VIEW IN YOUR SPACE is showing)
         photos or model do, AR showing         "AR shows the default finish." */
    function applyArNote(){
      var arShown = !!(arBtn && !arBtn.hidden && arBtn.getClientRects().length);
      var txt = "", dn = String(vs[0].name || vs[0].id);
      if(cur !== vs[0]){
        var ph = swapsPhoto(cur), md = modelShows(cur), mp = modelOnPage();
        if(!ph && !md) txt = (mp ? "Photos and 3D model show " : "Photos show ") + dn + ".";
        else if(mp && !md) txt = (arShown ? "3D model and AR show " : "3D model shows ") + dn + ".";
        else if(arShown) txt = "AR shows the default finish.";
      }
      arNote.textContent = txt || "\u00a0";
      arNote.style.visibility = txt ? "visible" : "hidden";
    }
    if(arBtn && window.MutationObserver){
      try { new MutationObserver(applyArNote).observe(arBtn, { attributes:true, attributeFilter:["hidden", "style", "class"] }); } catch(e){}
    }

    function select(v, remember){
      cur = v;
      btns.forEach(function(b){
        var on = b.getAttribute("data-vid") === String(v.id);
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.classList.toggle("fin-on", on);
        b.tabIndex = on ? 0 : -1;
      });
      nameEl.textContent = String(v.name || v.id).toUpperCase();
      applyMaterials(v);
      applyImages(v); applyModel(v); applyLink(v); applyArNote();
      if(remember){ try { sessionStorage.setItem(KEY, String(v.id)); } catch(e){} applyUrl(v); }
    }
    btns.forEach(function(b){
      b.addEventListener("click", function(){ var v = vs.filter(function(x){ return String(x.id) === b.getAttribute("data-vid"); })[0]; if(v) select(v, true); });
      b.addEventListener("keydown", function(e){
        // WAI radio group: Right/Down next, Left/Up previous (both wrap), Home/End
        var i = btns.indexOf(b), L = btns.length, j;
        if(e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % L;
        else if(e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i + L - 1) % L;
        else if(e.key === "Home") j = 0;
        else if(e.key === "End") j = L - 1;
        else return;
        e.preventDefault();
        btns[j].focus(); btns[j].click();
      });
    });
    select(cur, false);
    // a finish remembered from this tab (sessionStorage) goes back into the
    // address too, so a link copied now opens what is on screen; an unknown or
    // odd-cased ?finish= is rewritten to what is shown (removed for the default)
    if(cur !== vs[0] || inUrl) applyUrl(cur);
    // the gallery re-deals its columns at 760px (new <img> elements): re-apply
    try {
      var mq = window.matchMedia("(max-width:760px)");
      var re = function(){ setTimeout(function(){ applyImages(cur); }, 0); };
      if(mq.addEventListener) mq.addEventListener("change", re); else if(mq.addListener) mq.addListener(re);
    } catch(e){}
    // the 3D model arrives later than the page: apply once it is there too
    var mvEl = document.getElementById("mv");
    if(mvEl) mvEl.addEventListener("load", function(){ applyModel(cur); applyArNote(); });
    if(mvEl) mvEl.addEventListener("error", function(){ setTimeout(applyArNote, 0); });
    document.addEventListener("newo-glb-info", applyArNote);
  })();

  // footer mirrors the header: logo bottom-left, wordmark centre, hamburger right
  var foot = document.createElement("footer");
  foot.className = "site-foot";
  foot.innerHTML =
    '<a class="foot-home" href="index.html" aria-label="Studio NEWO home"></a>' +
    '<div class="foot-wordmark" role="img" aria-label="NEWO"></div>' +
    '<button class="foot-burger" aria-label="Open menu"></button>';
  var hSvg = document.querySelector(".site-home svg");
  var wSvg = document.querySelector(".site-wordmark svg");
  var bSvg = document.querySelector("#burger svg");
  if(hSvg) foot.querySelector(".foot-home").appendChild(hSvg.cloneNode(true));
  if(wSvg) foot.querySelector(".foot-wordmark").appendChild(wSvg.cloneNode(true));
  if(bSvg) foot.querySelector(".foot-burger").appendChild(bSvg.cloneNode(true));
  /* AFTER <main>, not inside it, so it is the page's contentinfo landmark
     (score round 1, a11y). Inside, .proj's --mar padding plus the footer's own
     --mar made --mar-edge; out here the footer carries the whole --mar-edge
     itself, and --fe follows (the foot-note maths), so every mark sits on
     exactly the pixel it did inside. The rule is in css/style.css (body > .site-foot). */
  content.insertAdjacentElement("afterend", foot);
  // the footer burger opens the same top-right dropdown as the header burger;
  // js/menu.js wires both via a delegated listener, nothing to bind here.

  // the full-width mechanism reports its own height from inside the iframe
  var mechFrame = document.getElementById("mechFrame");
  if(mechFrame){
    window.addEventListener("message", function(ev){
      if(ev.source !== mechFrame.contentWindow) return;   // only trust our own iframe
      var d = ev.data;
      if(d && d.type === "mechHeight" && typeof d.height === "number"){
        mechFrame.style.height = Math.ceil(d.height) + "px";
        mechFrame.style.minHeight = "0";
      }
    });

    /* ---------- tell the mechanism when it is actually on screen ----------
       The mechanisms run requestAnimationFrame loops that repaint a large
       canvas (KART) or a field of SVG wavefronts (OMNI) every frame. Inside an
       iframe they have no reliable way to know they have been scrolled past -
       browsers throttle offscreen iframes inconsistently - so they were still
       painting while you were reading something else further down the page,
       competing with model-viewer's WebGL loop and whatever else is running.
       The parent can see it clearly, so it just tells them. */
    (function(){
      /* Two reasons to hold the loop: the graphic is scrolled off screen, or
         the tab is hidden. Tracked separately so coming back to the tab does
         not leave it stopped when it is still on screen.
         (2026-10-27) It no longer pauses WHILE SCROLLING. That pause read as
         the animation freezing every time the page moved, and a message lost
         mid-scroll could leave it stopped until it was scrolled away and back.
         The off-screen pause covers the cost that matters. */
      var onScreen = true, tabOn = !document.hidden, sent = null;
      function sync(force){
        var run = onScreen && tabOn;
        if(run === sent && !force) return;   // don't spam the iframe
        sent = run;
        try { mechFrame.contentWindow.postMessage({ type:"mechVisible", visible:run }, "*"); } catch(e){}
      }
      function post(vis){ onScreen = !!vis; sync(); }

      if(window.IntersectionObserver){
        // generous margin so it is already running by the time it scrolls in
        new IntersectionObserver(function(entries){
          post(entries[0].isIntersecting);
        }, { rootMargin: "200px 0px" }).observe(mechFrame);
      }
      document.addEventListener("visibilitychange", function(){
        tabOn = !document.hidden; sync();
      });
      // the iframe may not have been listening for the first message
      mechFrame.addEventListener("load", function(){ sync(true); });
    })();
  }

  // ---------- model-viewer: variants + reset + explode (baked animation) ----------
  var mv = document.getElementById("mv");
  if(mv){
    var stage = mv.closest(".cad-hiw-model");
    var exBtn = stage.querySelector('[data-act="explode"]');
    var rsBtn = stage.querySelector('[data-act="reset"]');
    var pwrBtn= stage.querySelector('[data-act="power"]');
    var sel   = stage.querySelector('.mv-sel');
    var defaultOrbit = mv.getAttribute("camera-orbit");

    /* ---------- MODEL AND CONTROL BAR FADE IN TOGETHER (3 Nov 2026) ----------
       The model now builds after the loader has gone (see "MODEL LOAD"), so
       until its first frame is drawn the element and its control bar are
       invisible (inline opacity 0; the bar also visibility:hidden so nothing
       in it can be focused or pressed), with their space already reserved.
       showModel() lifts both two frames after model-viewer's first real draw:
       the element's own CSS transition (opacity .35s) fades the model up and
       the bar fades with it. Opacity only. */
    var mvBar = stage.querySelector(".mv-bar");
    mv.style.opacity = "0";
    if(mvBar){ mvBar.style.opacity = "0"; mvBar.style.visibility = "hidden"; }
    showModel = function(){
      if(showModel.done) return; showModel.done = true;
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        mv.style.opacity = "";
        if(mvBar){
          mvBar.style.transition = "opacity .35s ease";
          mvBar.style.visibility = ""; mvBar.style.opacity = "";
          setTimeout(function(){ mvBar.style.transition = ""; }, 500);
        }
      }); });
    };
    // backstop: loaded and framed but no first-draw signal 6 s on (a
    // model-viewer update that moved what gateFirstDraw reads): show it anyway
    mv.addEventListener("load", function(){ setTimeout(showModel, 6000); }, { once:true });

    /* the GLB's JSON (readGlbInfo): reserve the model's space and put the
       control bar's buttons in now, invisible, so the bar has its final
       height before the reveal. The load handler further down confirms them
       from the loaded model (and hides any the model turns out not to have). */
    glbInfoP = readGlbInfo(new URL(mv.getAttribute("data-src"), location.href).href);
    glbInfoP.then(function(info){
      glbInfo = info;
      if(info){
        if(info.explode && exBtn) exBtn.hidden = false;
        if((info.lamp || p.modelLight === true) && pwrBtn){
          pwrBtn.hidden = false; pwrBtn.classList.add("active"); pwrBtn.textContent = "LIGHT ON";
        }
        if(sel && info.variants.length > 1 && !(p.variants || []).length){
          sel.hidden = false;
          sel.innerHTML = info.variants.map(function(v){ return '<option value="'+esc(v)+'">'+esc(String(v).toUpperCase())+'</option>'; }).join("");
        }
      }
      relayoutModel();
      try { document.dispatchEvent(new CustomEvent("newo-glb-info")); } catch(e){}
    });

    /* ================= SIZING THE MODEL =================================
       The camera-orbit attribute carried a hard-coded 228%, hand-tuned once
       against the desktop element (130vw x five --model-slot rows). Apparent
       size is elementHeight / cameraRadius, so the moment any rule changed the
       element - and the max-width:900px rule made it a third as tall - that
       same 228% rendered the model at a third of its desktop size, marooned in
       a box of white space. That was the "tiny on mobile" report.

       So the radius is no longer authored. It is solved for, from the geometry,
       every time the model loads and every time the window changes shape:

         on-screen px = elementHeight * modelHeight / (2 * radius * tan(fov/2))

       set that equal to --model-fill x --model-slot and solve for radius. The
       model then lands at exactly the intended size on any screen, in any
       window, at any zoom, with no per-breakpoint tuning - change --model-fill
       in css/style.css and everything follows, including the control bar's
       clearance, which is derived from the same number.

       ZOOM RANGE (Owen, 2026-09-02): you cannot zoom OUT at all - the default
       IS the widest view, so there is no "where did it go" state to recover
       from - and you can zoom IN by 25%, no further. Both limits are set in
       METRES, never percentages: model-viewer does not clamp radius
       PERCENTAGES reliably ("105%" still let the camera through to about 60%,
       measured). Metres clamp exactly. */
    var ZOOM_IN = 1;             // no zoom (2026-10-05, was 1.25). See disable-zoom on the element.
    var framedOrbit = null;      // what RESET goes back to, once we know it
    var homeTheta = null, homePhi = null;
    /* EXPLODED FRAMING (2026-10-28, replaces the fixed p.modelExplode.zoom).
       The old way backed the camera off by one number from the pipeline the
       instant EXPLODED VIEW was pressed, so the model snapped small (OMNI 1.97x)
       before the parts had moved, and stayed smaller than it needed to be.
       Now the camera is solved from the parts themselves, every frame of the
       explode: the clip is sampled once (exSamples), each sample's corners are
       projected through the real camera, and the radius is the SMALLEST that
       keeps every part inside what the visitor can see of the viewer (the
       element, the window, and clear of the mechanism column and the button
       row). Never closer than the assembled framing. The look-at point rises
       with the centre of the parts. So the model stays as big as it can and
       the zoom moves with the parts, not ahead of them. Works for any GLB with
       an "explode" clip; nothing per project. */
    var homeR = null, homeTarget = null, exOpen = false;
    var exSamples = null, exFit = null, exT = 0;     // exT: explode progress 0..1 on screen now
    function mvScene(){
      var k = Object.getOwnPropertySymbols(mv).filter(function(s){ return s.description === "scene"; })[0];
      return k ? mv[k] : null;
    }
    // part corners in model coordinates (the frame camera-target is given in),
    // at EX_N points through the clip. Setting currentTime poses the parts at once.
    var EX_N = 24;
    function sampleExplode(dur){
      var sc = mvScene(); if(!sc || !sc.target) return null;
      var keep = mv.currentTime || 0, out = [];
      try {
        for(var i = 0; i <= EX_N; i++){
          mv.currentTime = dur * i / EX_N;
          sc.updateMatrixWorld(true);
          var to = sc.target.matrixWorld.elements, pts = [], lo = 1e9, hi = -1e9;
          sc.target.traverse(function(o){
            if(!o.isMesh || !o.visible || !o.geometry) return;
            var g = o.geometry; if(!g.boundingBox) g.computeBoundingBox();
            var b = g.boundingBox, V = b.min.constructor;
            for(var c = 0; c < 8; c++){
              var v = new V(c & 1 ? b.max.x : b.min.x, c & 2 ? b.max.y : b.min.y, c & 4 ? b.max.z : b.min.z).applyMatrix4(o.matrixWorld);
              // world -> model: the Target node only carries the camera-target offset
              var y = v.y - to[13];
              pts.push(v.x - to[12], y, v.z - to[14]);
              if(y < lo) lo = y; if(y > hi) hi = y;
            }
          });
          out.push({ pts:pts, lo:lo, hi:hi, mid:(lo + hi) / 2 });
        }
      } catch(e){ out = null; try { console.warn("sampleExplode failed, explode plays at the assembled framing:", e); } catch(e2){} }
      try { mv.currentTime = keep; } catch(e){}
      return out && out[0].pts.length ? out : null;
    }
    // what the visitor can see of the viewer, in px from the element's centre
    function exBounds(){
      var r = mv.getBoundingClientRect();
      var m = new DOMMatrix(getComputedStyle(mv).transform);
      var half = mv.offsetHeight * (Math.sqrt(m.a * m.a + m.b * m.b) || 1) / 2;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var vw = document.documentElement.clientWidth || window.innerWidth;
      var pad = 12, b = { half:half, l:Math.min(half, cx - pad), r:Math.min(half, vw - pad - cx), u:half, d:half };
      var mech = stage.querySelector(".cad-hiw-mech") || document.querySelector(".cad-hiw-mech");
      if(mech){ var mr = mech.getBoundingClientRect(); if(mr.width && mr.left > cx && mr.top < cy + half && mr.bottom > cy - half) b.r = Math.min(b.r, mr.left - pad - cx); }
      var bar = stage.querySelector(".mv-bar");
      if(bar){ var br = bar.getBoundingClientRect(); if(br.height && br.top > cy) b.d = Math.min(b.d, br.top - pad - cy); }
      // a little air, and room for the hover tilt (rotate -2deg, scale .97)
      ["l","r","u","d"].forEach(function(k){ b[k] = Math.max(40, b[k] * 0.94); });
      return b;
    }
    // smallest radius that fits one sample at camera angles (th, ph)
    function exNeed(s, th, ph, ty, b){
      var K = b.half / Math.tan((mv.getFieldOfView() || 30) * Math.PI / 360);
      var st = Math.sin(th), ct = Math.cos(th), sp = Math.sin(ph), cp = Math.cos(ph);
      var vx = sp * st, vy = cp, vz = sp * ct;                 // target -> camera
      var ux = -cp * st, uy = sp, uz = -cp * ct;               // screen up
      var p = s.pts, need = 0;
      for(var i = 0; i < p.length; i += 3){
        var x = p[i] - homeTarget.x, y = p[i+1] - ty, z = p[i+2] - homeTarget.z;
        var dv = x * vx + y * vy + z * vz, dr = x * ct - z * st, du = x * ux + y * uy + z * uz;
        var w = Math.max(Math.abs(dr) * K / (dr > 0 ? b.r : b.l), Math.abs(du) * K / (du > 0 ? b.u : b.d));
        if(dv + w > need) need = dv + w;
      }
      return need;
    }
    /* Radius and look-at height for every sample, at the current pitch. The
       radius covers the whole turn (24 headings), so the size holds while the
       model is spun; only a change of pitch refits it (on release). The look-at
       height for the fully open product is the one that lets it be biggest
       (the need is convex in it, so a ternary search finds it); the samples in
       between move toward it as their parts rise. If the assembled product
       already crosses a bound at rest, the plan is scaled so it starts exactly
       on the assembled framing (no jump on the first frame). */
    function exPlan(ph){
      if(!exSamples || homeR === null || !homeTarget) return null;
      if(ph == null) ph = mv.getCameraOrbit().phi;
      var b = exBounds(), plan = [], n = exSamples.length - 1;
      function needAll(s, ty){ var m = 0; for(var a = 0; a < 24; a++) m = Math.max(m, exNeed(s, a * Math.PI / 12, ph, ty, b)); return m; }
      var last = exSamples[n], lo = last.lo, hi = last.hi;
      for(var it = 0; it < 18; it++){
        var m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
        if(needAll(last, m1) < needAll(last, m2)) hi = m2; else lo = m1;
      }
      var best = (lo + hi) / 2, span = last.mid - exSamples[0].mid;
      for(var i = 0; i <= n; i++){
        var f = Math.abs(span) > 1e-6 ? (exSamples[i].mid - exSamples[0].mid) / span : i / n;
        var ty = homeTarget.y + (best - homeTarget.y) * Math.max(0, Math.min(1, f));
        plan.push({ r:needAll(exSamples[i], ty), ty:ty });
      }
      var g = homeR / Math.max(homeR, plan[0].r);
      plan.forEach(function(q){ q.r = Math.max(homeR, q.r * g); });
      return plan;
    }
    // radius and look-at height for explode progress k (0..1)
    function exAt(k){
      if(!exFit || k <= 0) return { r:homeR, ty:homeTarget ? homeTarget.y : 0 };
      var x = Math.min(1, k) * (exFit.length - 1), i = Math.min(exFit.length - 2, Math.floor(x)), f = x - i;
      return { r:exFit[i].r + (exFit[i+1].r - exFit[i].r) * f, ty:exFit[i].ty + (exFit[i+1].ty - exFit[i].ty) * f };
    }
    // the zoom range is the radius itself (disable-zoom); lo/hi open it while it moves
    function exLimits(lo, hi){
      mv.minCameraOrbit = "auto auto " + (lo / ZOOM_IN).toFixed(5) + "m";
      mv.maxCameraOrbit = "auto auto " + hi.toFixed(5) + "m";
    }
    // put the camera at progress k. jump: land this frame (during the explode,
    // so the zoom stays locked to the parts); otherwise model-viewer eases there.
    function exCamera(k, jump, th, ph){
      if(homeR === null) return;
      var q = exAt(k), o = mv.getCameraOrbit();
      if(th == null) th = o.theta; if(ph == null) ph = o.phi;
      mv.cameraOrbit = th.toFixed(5)+"rad "+ph.toFixed(5)+"rad "+q.r.toFixed(5)+"m";
      if(homeTarget) mv.cameraTarget = homeTarget.x.toFixed(5)+"m "+q.ty.toFixed(5)+"m "+homeTarget.z.toFixed(5)+"m";
      if(jump && mv.jumpCameraToGoal) mv.jumpCameraToGoal();
    }
    // refit at the current window and pitch (resize, pitch change, reset)
    function applyExplodeFraming(jump, th, ph){
      if(homeR === null) return;
      exFit = exPlan(ph) || exFit;
      var r = exAt(exT).r, now = mv.getCameraOrbit().radius;
      exLimits(Math.min(r, now), Math.max(r, now));
      exCamera(exT, jump || REDUCE_MOTION, th, ph);
      exLimits(r, r);
    }

    /* ---------- OVERLAP WITH THE PHOTOS ABOVE (2026-10-02) ----------
       Owen's rule: every 3D model overlaps the photos above it, slightly, for
       depth. Never more than 20% of any photo; aim for 15% of the lowest photo
       it sits under. Measured in HEIGHT (how far the model's top reaches into
       the photo), which is stricter than area since the model is narrower than
       a photo. Desktop and phone alike.
       The model's on-screen box comes from the same numbers frameModel just
       used: targetPx tall, centred on the slot, as wide as its footprint seen
       from the home angle. The stage's top margin is then moved (up or down)
       so the model's top lands on the target. Only the model column moves;
       the mechanism beside it and the gallery above stay put. */
    /* The estimate is the model's bounding box seen from the home camera angle:
       height times sin(phi) plus HALF the depth times cos(phi), so a box seen
       from above counts some of its top face. Half, because perspective shrinks
       the far edge: calibrated against the rendered pixels of KART (a tall
       cylinder) and OMNI (a cube), where the full depth over-shot by ~10 points
       and none under-shot by 4 to 12. */
    var OVERLAP_AIM = 0.15, OVERLAP_MAX = 0.19;
    /* THE ELEMENT'S RESTING TILT (3 Nov 2026). The desktop element is drawn
       tilted and scaled (css/style.css: rotate(-5deg) scale(.94)), and :hover
       eases it to rotate(-2deg) scale(.97). The model now loads after the
       reveal, often with the pointer already over it, and sizing read the
       hover transform: the model's space moved 5 px and the model came out
       3 % small. Sizing uses the resting transform, read whenever the element
       is neither hovered nor mid-transition, and remembered. */
    var restT = null;
    function restTilt(){
      var clean = true;
      try { clean = !mv.matches(":hover") && !(mv.getAnimations && mv.getAnimations().length); } catch(e){}
      if(clean || !restT){
        try {
          var m = new DOMMatrix(getComputedStyle(mv).transform);
          var t = { s: Math.sqrt(m.a * m.a + m.b * m.b) || 1, a: Math.atan2(m.b, m.a) };
          if(clean) restT = t; else return t;
        } catch(e){ return { s: 1, a: 0 }; }
      }
      return restT;
    }
    function restScale(){ return restTilt().s; }
    function fitOverlap(stage, targetPx, dims, theta, phi){
      try {
        var old = parseFloat(stage.style.marginTop) || 0;
        var sr = stage.getBoundingClientRect();
        var scale = restScale();
        var th = theta || 0, ph = (phi == null ? Math.PI / 2 : phi);
        var perM  = targetPx * scale / dims.y;                 // screen px per metre
        var wide  = Math.abs(dims.x * Math.cos(th)) + Math.abs(dims.z * Math.sin(th));
        var deep  = Math.abs(dims.x * Math.sin(th)) + Math.abs(dims.z * Math.cos(th));
        var h = perM * (dims.y * Math.sin(ph) + 0.5 * deep * Math.abs(Math.cos(ph)));
        var w = perM * wide;
        var cx = sr.left + sr.width / 2, cy = sr.top + sr.height / 2;
        var top = cy - h / 2, left = cx - w / 2, right = cx + w / 2;
        /* Which photos are "above" is judged from the slot's RESTING place
           (cy minus the shift already applied), never from where an earlier
           shift left it (5 Nov 2026). After a resize the old shift could put
           the slot above the gallery, the gallery then no longer counted as
           above, and the model jumped up to the hero photo. */
        var cy0 = cy - old;
        var imgs = Array.prototype.slice.call(document.querySelectorAll("#content img"))
          .map(function(i){ return i.getBoundingClientRect(); })
          .filter(function(b){ return b.height > 40 && b.bottom <= cy0 && b.right > left && b.left < right; });
        if(!imgs.length){ stage.style.marginTop = ""; return; }   // nothing above: no stale shift (5 Nov 2026)
        var low = imgs.reduce(function(a, b){ return b.bottom > a.bottom ? b : a; });
        var want = low.bottom - OVERLAP_AIM * low.height;
        imgs.forEach(function(b){ want = Math.max(want, b.bottom - OVERLAP_MAX * b.height); });
        var shift = Math.round(old + want - top);
        stage.style.marginTop = shift ? shift + "px" : "";
      } catch(e){}
    }

    /* the same silhouette estimate fitOverlap() uses, from the stage's
       current position: so it is right after the overlap shift and after any
       scroll. Height only (the jump is vertical). */
    var lastFit = null;
    modelExtent = function(){
      if(!lastFit) return null;
      try {
        var st = mv.parentElement, sr = st.getBoundingClientRect();
        var scale = restScale();
        var d = lastFit.dims, th = lastFit.th || 0, ph = (lastFit.ph == null ? Math.PI / 2 : lastFit.ph);
        var perM = lastFit.px * scale / d.y;
        var deep = Math.abs(d.x * Math.sin(th)) + Math.abs(d.z * Math.cos(th));
        var h = perM * (d.y * Math.sin(ph) + 0.5 * deep * Math.abs(Math.cos(ph)));
        var cy = sr.top + sr.height / 2;
        return { top: cy - h / 2, bottom: cy + h / 2 };
      } catch(e){ return null; }
    };
    /* the authored home angles: the model's own once it has loaded, the
       camera-orbit attribute's before (they are the same numbers) */
    function homeAngles(){
      if(homeTheta !== null) return { th: homeTheta, ph: homePhi };
      var a = String(defaultOrbit || "").trim().split(/\s+/);
      function ang(v, d){ var n = parseFloat(v); if(!isFinite(n)) return d; return /deg$/.test(v) ? n * Math.PI / 180 : n; }
      return { th: ang(a[0], 0), ph: ang(a[1], Math.PI / 2) };
    }
    /* ---------- THE SIZE AT REST: THE LARGEST THAT FITS (Owen, 3 Nov 2026) ----------
       "size it to the max size that fits". Replaces the --model-fill wish and
       its 1.2 x window-height cap (which put KART taller than a desktop
       window). The resting model is now the largest size at which the WHOLE
       model and the control bar under it fit in the window, with FIT_MARGIN
       above and below. Solved, not authored, for every product and width:
         model silhouette (the fitOverlap estimate: height plus some of the top
         face seen from the home pitch, times the desktop tilt's scale)
         + the gap from the model's slot to the bar + the bar itself
         <= window height - 2 x FIT_MARGIN.
       Then three caps that keep the model whole and in its place:
         - the element is the model's clipping edge: the plan diagonal inside
           its width (the phone layout, where the element is the column) and
           the silhouette inside its height;
         - a WIDE product (plan diagonal over 0.8 x height, OMNI) stays inside
           its own column, as before (2026-10-02).
       dims: the GLB's box, from readGlbInfo before the model loads (so the
       space is reserved at the reveal) or from the model itself. */
    var FIT_MARGIN = 24;
    function layoutModel(dims){
      var stage = mv.parentElement;
      var sr = stage.getBoundingClientRect(), slotPx = sr.height;
      if(!slotPx || !dims || !dims.y) return 0;
      var root = getComputedStyle(document.documentElement);
      var fill = parseFloat(root.getPropertyValue("--model-fill")) || 2;
      var effNow = parseFloat(root.getPropertyValue("--model-fill-eff")) || fill;
      var o = homeAngles(), th = o.th, ph = o.ph;
      var sc = restScale();
      var deep = Math.abs(dims.x * Math.sin(th)) + Math.abs(dims.z * Math.cos(th));
      var k = (Math.sin(ph) + 0.5 * deep / dims.y * Math.abs(Math.cos(ph))) * sc;   // screen px of silhouette per px of model height
      // the bar: its height, and its gap below the slot net of the model's
      // overhang (css/style.css: .cad-stage margin-bottom follows --model-fill-eff)
      var bar = stage.parentElement ? stage.parentElement.querySelector(".mv-bar") : null;
      var barH = 0, gap = 0;
      if(bar && bar.getClientRects().length){
        var br = bar.getBoundingClientRect();
        barH = br.height;
        gap = br.top - sr.bottom - slotPx * (effNow - 1) / 2;
      }
      var avail = (window.innerHeight || 900) - 2 * FIT_MARGIN;
      // silhouette top to bar bottom (the bar's top sits at slot centre + T/2 + gap)
      var T = 2 * (avail - gap - barH) / (k + 1);
      T = Math.min(T, avail / k);                        // the model alone, if it reaches below the bar's top
      var W = Math.sqrt(dims.x * dims.x + dims.z * dims.z);
      var elW = mv.offsetWidth, elH = mv.offsetHeight;
      if(elW && W) T = Math.min(T, 0.92 * elW * dims.y / W);
      if(elH) T = Math.min(T, 0.92 * elH * sc / k);
      if(W / dims.y > 0.8) T = Math.min(T, sr.width * 0.84 * dims.y / W);
      T = Math.max(T, Math.min(slotPx, 160));             // a window too short to fit anything
      document.documentElement.style.setProperty("--model-fill-eff", String(Math.round((T / slotPx) * 1000) / 1000));
      lastFit = { px: T, dims: dims, th: th, ph: ph };
      fitOverlap(stage, T, dims, th, ph);
      return T;
    }
    function frameModel(){
      var stage = mv.parentElement;                       // .cad-stage
      try{
        if(!stage) return;
        var real = (mv.loaded && mv.getDimensions) ? mv.getDimensions() : null;
        if(real && !real.y) real = null;
        // the space follows the GLB's numbers once known, so it never moves
        // when the model lands; the camera follows the model itself
        var targetPx = layoutModel((glbInfo && glbInfo.dims) || real);
        if(!real || !targetPx) return;
        /* the element's on-screen height AT REST (its bounding box, tilted
           and scaled), not whatever a hover has eased it to: what the camera
           was always solved from, so the resting size is unchanged */
        var rt = restTilt(), side = mv.offsetHeight;
        var elH = side * rt.s * (Math.abs(Math.cos(rt.a)) + Math.abs(Math.sin(rt.a)));
        var modelH = real.y;
        var t      = Math.tan((mv.getFieldOfView() || 45) * Math.PI / 360);
        if(!elH || !isFinite(t) || t <= 0) return;
        var r = (elH * modelH) / (2 * targetPx * t);
        if(!isFinite(r) || r <= 0) return;

        var o = mv.getCameraOrbit();
        // the authored angles, captured once - a re-frame after a resize keeps
        // whatever the visitor has rotated to, but RESET still goes home
        if(homeTheta === null){ homeTheta = o.theta; homePhi = o.phi; }
        framedOrbit = homeTheta.toFixed(5)+"rad "+homePhi.toFixed(5)+"rad "+r.toFixed(5)+"m";

        // limits BEFORE the orbit: whatever is in force clamps what we set next
        mv.minCameraOrbit = "auto auto " + (r / ZOOM_IN).toFixed(5) + "m";
        mv.maxCameraOrbit = "auto auto " + r.toFixed(5) + "m";
        mv.cameraOrbit = o.theta.toFixed(5)+"rad "+o.phi.toFixed(5)+"rad "+r.toFixed(5)+"m";
        homeR = r;
        if(!homeTarget){ try { var ct = mv.getCameraTarget(); homeTarget = { x:ct.x, y:ct.y, z:ct.z }; } catch(e2){} }
        if(exT > 0) applyExplodeFraming(true);
      } catch(e){ try { console.warn("frameModel failed, model-viewer's own framing stands:", e); } catch(e2){} }
      finally { if(stage) stage.classList.add("mv-framed"); }
    }
    relayoutModel = frameModel;

    /* Re-frame on resize, but never DURING a drag: a re-frame resets the
       distance, and having your zoom yanked out from under you mid-drag is
       worse than a slightly-off size until you let go. Rotating the phone or
       dragging a desktop window across a breakpoint both land here.
       2026-11-02: this used to skip on .mv-live, which is added on the first
       drag and never removed (it keeps the hint hidden), so after one drag a
       resize never re-framed again. mvDragging is true only between
       pointerdown on the model and pointerup (set by the gate below). */
    var mvDragging = false;
    var REDUCE_MOTION = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    (function watchResize(){
      var t = null;
      window.addEventListener("resize", function(){
        clearTimeout(t);
        t = setTimeout(function(){
          if(mvDragging) return;
          frameModel();      // before the model loads this re-reserves its space
        }, 220);
      }, { passive:true });
    })();

    /* ---------- AR, on phones AND on desktop ----------
       Phone -> launches AR (iOS Quick Look / Android Scene Viewer).
       Desktop -> there is no AR to launch, so the button opens a QR code of
       THIS page instead; scan it and the phone lands here with a button that
       does the real thing.

       TWO THINGS THIS GETS RIGHT THAT THE FIRST VERSION DID NOT:

       1) The decision is made AT CLICK TIME, not once at load. Before, it read
          mv.canActivateAR during a load/ar-status handler and permanently wired
          one behaviour or the other. model-viewer had not finished working out
          AR support at that moment on iOS, so canActivateAR was still false and
          iPhones got permanently wired to the QR panel - which is exactly the
          "Safari shows the QR instead of opening the viewer" bug.

       2) It does not trust canActivateAR alone. iOS Quick Look is driven by a
          plain <a rel="ar"> anchor, so if model-viewer has not (or will not)
          claim AR support, we can still open Quick Look ourselves. The anchor
          MUST contain an <img> child - that is Apple's requirement, not ours,
          and Quick Look silently does nothing without it. */
    (function(){
      var arBtn = stage.querySelector('.mv-ar');
      var qrBox = stage.querySelector('.mv-qr');
      if(!arBtn || !qrBox) return;
      var qrImg = qrBox.querySelector('.mv-qr-img');
      var qrDrawn = false, qrOpen = false;

      /* Does this browser advertise Apple's <a rel="ar"> hand-off? True in iOS
         Safari. NOT true in Chrome or Firefox on iOS, even though those are
         WebKit underneath and the device can absolutely do Quick Look - which
         is exactly why Chrome on the iPhone was being handed the desktop QR
         panel. So the device itself is detected separately below. */
      var supportsQuickLook = (function(){
        var a = document.createElement("a");
        return !!(a.relList && a.relList.supports && a.relList.supports("ar"));
      })();
      // iPadOS 13+ reports itself as "MacIntel", hence the touch-point check
      var isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent || "") ||
                  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      var isAndroid = /android/i.test(navigator.userAgent || "");
      var iosSrc = mv.getAttribute("ios-src") || "";

      function canDoAR(){
        if(mv.canActivateAR) return true;         // model-viewer says yes
        if(isIOS && iosSrc) return true;          // ANY iOS browser, not just Safari
        if(isAndroid) return true;                // Android: Scene Viewer intent
        return false;
      }

      /* Open iOS Quick Look directly, bypassing model-viewer.
         Built to mirror model-viewer's own implementation exactly: create the
         anchor, give it an empty <img> child (Apple requires one - Quick Look
         silently ignores an anchor without it), and click it WITHOUT adding it
         to the document. The previous version appended it to <body> with
         display:none first, which is a plausible reason Safari ignored it -
         a hidden element is a poor thing to hang a navigation off. */
      function openQuickLook(){
        // #allowsContentScaling=0 pins the model to real-world size, matching
        // ar-scale="fixed" on the viewer.
        var href = iosSrc + "#allowsContentScaling=0";
        if(supportsQuickLook){
          var a = document.createElement("a");
          a.setAttribute("rel", "ar");
          a.setAttribute("href", href);
          a.appendChild(document.createElement("img"));
          a.click();
          return;
        }
        // iOS browser that doesn't advertise rel="ar" (Chrome, Firefox):
        // navigating straight at the .usdz hands it to Quick Look anyway,
        // because the OS owns that file type regardless of which browser asked.
        window.location.href = href;
      }

      /* Open Google Scene Viewer directly with an intent URL, the same one
         model-viewer builds. Used when model-viewer cannot (Firefox on
         Android, or the GLB not attached yet) and for the QR hand-off below.
         The fallback URL is this page WITHOUT ?ar=1, so a phone without the
         Google app lands back here instead of looping. */
      function openSceneViewer(){
        var glb = new URL(mv.getAttribute("data-src"), location.href).href;
        var title = (mv.getAttribute("alt") || "").replace(/ 3D model$/, "");
        window.location.href = "intent://arvr.google.com/scene-viewer/1.0" +
          "?file=" + encodeURIComponent(glb) +
          "&mode=ar_preferred&resizable=false" +
          "&title=" + encodeURIComponent(title) +
          "#Intent;scheme=https;package=com.google.android.googlequicksearchbox;" +
          "action=android.intent.action.VIEW;" +
          "S.browser_fallback_url=" + encodeURIComponent(location.href) + ";end;";
      }

      /* The desktop QR does not point at this page, it points at this page
         with ?ar=1. A phone that arrives with that flag opens AR by itself,
         so scanning goes straight into the room instead of landing on the
         page and needing a second tap. */
      function arLink(){
        try {
          var u = new URL(location.href);
          u.hash = "";
          u.searchParams.delete("cb");
          u.searchParams.set("ar", "1");
          return u.href;
        } catch(e){ return location.href; }
      }

      // lazy: the QR library is only fetched if someone actually asks for the
      // code, so phones (which go straight to AR) never pay for it.
      var QR_SRC = "js/vendor/qrcode.js?v=1";
      function drawQR(){
        if(qrDrawn) return; qrDrawn = true;
        function make(){
          try{
            var q = qrcode(0, "M");
            q.addData(arLink());
            q.make();
            qrImg.innerHTML = q.createImgTag(5, 0);
          } catch(e){
            // no QR? fall back to the plain URL, still readable by eye
            qrImg.innerHTML = '<code class="mv-qr-url">' + esc(arLink()) + '</code>';
          }
        }
        if(window.qrcode){ make(); return; }
        var s = document.createElement("script");
        s.src = QR_SRC;
        s.onload = make;
        s.onerror = function(){ qrDrawn = false; qrImg.innerHTML = '<code class="mv-qr-url">' + esc(arLink()) + '</code>'; };
        document.head.appendChild(s);
      }

      function toggleQR(){
        qrOpen = !qrOpen;
        if(qrOpen) drawQR();
        qrBox.hidden = !qrOpen;
        arBtn.setAttribute("aria-expanded", qrOpen ? "true" : "false");
        arBtn.classList.toggle("active", qrOpen);
      }

      arBtn.addEventListener("click", function(){
        if(canDoAR()){
          // prefer model-viewer (it handles Scene Viewer + WebXR properly);
          // fall back to opening Quick Look ourselves on iOS.
          if(mv.canActivateAR){
            try { mv.activateAR(); return; } catch(e){}
          }
          if(isIOS && iosSrc){ openQuickLook(); return; }
          if(isAndroid){ openSceneViewer(); return; }
        }
        toggleQR();
      });

      /* ARRIVED FROM THE QR (?ar=1). The flag is taken off the address first,
         so Back from AR, a reload or a shared link shows the normal page and
         never relaunches. Then, on a phone, AR opens on its own once the page
         has loaded (launching mid-load can cancel the page's own requests).
         The button is scrolled into view first, so if the browser refuses to
         open AR without a tap (some Android browsers do), it is right there.
         iOS uses a plain navigation to the .usdz, not the rel="ar" anchor:
         that anchor is meant for a tap, while the navigation works in every
         iOS browser with or without one. */
      if(/[?&]ar=1(&|$)/.test(location.search)){
        try {
          var clean = new URL(location.href);
          clean.searchParams.delete("ar");
          history.replaceState(history.state, "", clean.href);
        } catch(e){}
        var phoneAR = (isIOS && iosSrc) || isAndroid;
        if(phoneAR){
          var launch = function(){
            setTimeout(function(){
              try { arBtn.scrollIntoView({ block: "center" }); } catch(e){}
              if(isIOS) window.location.href = iosSrc + "#allowsContentScaling=0";
              else openSceneViewer();
            }, 300);
          };
          if(document.readyState === "complete") launch();
          else window.addEventListener("load", launch, { once: true });
        }
      }

      // The button itself is always shown once there is a model - on desktop it
      // opens the QR, on a phone it opens AR. Nothing to wait for.
      arBtn.hidden = false;
      arBtn.setAttribute("aria-expanded", "false");

      /* LOOK AROUND IT: head-tracked window, desktop only (a mouse and a
         camera API). Phones keep VIEW IN YOUR SPACE. js/headview.js is only
         fetched on the first click.
         OFF for now (Owen, 2026-10-28: not polished enough for the live site).
         Set LOOK_AROUND to true to bring it back; nothing else changes. */
      var LOOK_AROUND = false;
      var lookBtn = LOOK_AROUND ? stage.querySelector('.mv-look') : null;
      var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
      if(lookBtn && finePointer && !isIOS && !isAndroid &&
         navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
        lookBtn.hidden = false;
        lookBtn.addEventListener("click", function(){
          if(qrOpen) toggleQR();
          var go = function(){
            window.NEWO_HEADVIEW.open({
              src: mv.getAttribute("data-src"),
              title: (mv.getAttribute("alt") || "").replace(/ 3D model$/, "")
            });
          };
          if(window.NEWO_HEADVIEW) return go();
          var hs = document.createElement("script");
          hs.src = "js/headview.js?v=3";
          hs.onload = go;
          document.head.appendChild(hs);
        });
      }

      /* ---------- ?ardebug ----------
         Add &ardebug to the URL to print what this device actually detected,
         right on the page. There is no console on an iPhone, so when AR "does
         nothing" there is otherwise no way to tell whether the code took the
         model-viewer path, the Quick Look path, or decided it could not do AR
         at all - which is the difference between a broken file and broken
         wiring. Off unless asked for; costs nothing otherwise. */
      if(/[?&]ardebug\b/.test(location.search)){
        var dbg = document.createElement("pre");
        dbg.className = "mv-ardebug";
        function refresh(note){
          dbg.textContent =
            "ios-src        : " + (iosSrc || "(none)") + "\n" +
            "canActivateAR  : " + mv.canActivateAR + "\n" +
            "rel=ar support : " + supportsQuickLook + "\n" +
            "isAndroid      : " + isAndroid + "\n" +
            "canDoAR()      : " + canDoAR() + "\n" +
            "UA             : " + navigator.userAgent + "\n" +
            (note ? ("\nlast tap  -> " + note) : "");
        }
        refresh("");
        arBtn.parentNode.appendChild(dbg);
        mv.addEventListener("ar-status", function(e){
          refresh("ar-status: " + (e.detail && e.detail.status));
        });
        arBtn.addEventListener("click", function(){
          // runs after the main handler above, so it reports what that chose
          refresh(mv.canActivateAR ? "used mv.activateAR()"
                : (isIOS && iosSrc) ? (supportsQuickLook ? "used <a rel=ar> Quick Look" : "navigated to .usdz (iOS non-Safari)")
                : "no AR -> showed QR");
        });
        // surface script errors too - otherwise they are invisible on a phone
        window.addEventListener("error", function(ev){
          dbg.textContent += "\nJS ERROR: " + ev.message;
        });
      }

      // close the QR on Escape or on a click outside it
      document.addEventListener("keydown", function(e){ if(e.key === "Escape" && qrOpen) toggleQR(); });
      document.addEventListener("click", function(e){
        if(!qrOpen) return;
        if(e.target.closest(".mv-arw")) return;
        toggleQR();
      });
      /* a click inside an iframe (the mechanism) never reaches this document:
         the page only sees its window lose focus to the frame. Close then too. */
      window.addEventListener("blur", function(){
        setTimeout(function(){
          var a = document.activeElement;
          if(qrOpen && a && a.tagName === "IFRAME") toggleQR();
        }, 0);
      });
    })();

    // ---------- click to interact ----------
    // The <model-viewer> element is larger than its slot so a zoomed model can
    // flood past it and underlap the page. By default the model is INERT
    // (pointer-events:none): the page scrolls and its links stay clickable
    // straight through it, so hovering the model never hijacks the scroll. A
    // click inside the compact .cad-stage box "engages" it (pointer-events:auto)
    // so you can rotate + wheel-zoom; a click anywhere outside disengages it,
    // handing scrolling back. A small hint shows until it's engaged.
    (function(){
      var box = mv.parentElement;   // .cad-stage (the compact slot)
      var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

      var hint = document.createElement("div");
      hint.className = "mv-hint";
      hint.textContent = coarse ? "TOUCH TO INTERACT" : "DRAG TO INTERACT";
      /* 4 Nov 2026 (Owen): the hint floats ON the model again, as a chip in
         the stage, so it is plain the model can be turned and how. It fades
         when the model is engaged (.cad-stage.mv-live .mv-hint). */
      box.appendChild(hint);

      /* ---------- WHY TOUCH IS HANDLED SEPARATELY ----------
         The gate below works by flipping pointer-events from none to auto on
         the first pointerdown. With a mouse that is fine: the click engages,
         and the drag that follows is a separate stream of events which the
         model then receives.

         On a touchscreen it was broken. A drag is ONE continuous pointer
         sequence, and by the time the capture-phase listener flips
         pointer-events the browser has already hit-tested that pointerdown
         against an inert element - so the model never saw the gesture that
         engaged it, and the whole drag was swallowed. That is why the model
         only responded after a second touch, or after a two-finger gesture
         started a fresh sequence.

         On coarse pointers the gate is therefore skipped entirely: the model
         is live from the start. It can afford to be, because touch-action
         "pan-y" already lets a vertical swipe scroll the page straight
         through it, and the mobile CSS keeps the element close to its slot so
         it is not sitting invisibly on top of neighbouring sections. */
      /* ---------- ONLY THE MODEL ITSELF IS LIVE (2026-10-27) ----------
         The element is far bigger than the model (room for the explode and the
         overlap), so "inside the element" or even "inside the slot box" also
         covered the buttons beside and below it: on OMNI, the widest model,
         Process and detail could not be pressed. The live area is now the
         model's own silhouette: model-viewer ray-casts the point against the
         meshes. PAD px of slack round the edge, sampled at five points, covers
         thin parts and the small error from the desktop tilt transform. */
      var PAD = 14;
      function onModel(x, y){
        var r = mv.getBoundingClientRect();
        if(x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
        // off screen the element is visibility:hidden and nothing can be on it
        if(box.classList.contains("mv-offscreen")) return false;
        if(!mv.loaded || !mv.positionAndNormalFromPoint) return inBox({ clientX:x, clientY:y });
        // five casts (the PAD ring) to catch a thin part on the way IN; one
        // cast is enough to confirm the pointer is still on it once live
        var pts = live ? [[0,0]] : [[0,0],[PAD,0],[-PAD,0],[0,PAD],[0,-PAD]];
        try {
          for(var i = 0; i < pts.length; i++){
            if(mv.positionAndNormalFromPoint(x + pts[i][0], y + pts[i][1])) return true;
          }
        } catch(e){ return inBox({ clientX:x, clientY:y }); }
        return false;
      }
      function inBox(e){
        var r = box.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right &&
               e.clientY >= r.top  && e.clientY <= r.bottom;
      }

      /* TOUCH: the element has to be live BEFORE the finger lands (see above),
         so it stays live, and a touch that starts off the model is stopped in
         the capture phase before model-viewer sees it. A vertical swipe still
         scrolls (touch-action pan-y); a tap is handed to whatever is under the
         model at that point, so the buttons and links there work. */
      if(coarse){
        mv.style.pointerEvents = "auto";
        var fade = function(){ box.classList.add("mv-live"); };
        var offTap = null;
        window.addEventListener("pointerdown", function(e){
          offTap = null;
          if(e.target !== mv) return;
          if(onModel(e.clientX, e.clientY)){ fade(); mvDragging = true; return; }
          e.stopPropagation();
          offTap = { x:e.clientX, y:e.clientY };
        }, true);
        window.addEventListener("pointerup", function(){ mvDragging = false; }, true);
        window.addEventListener("pointercancel", function(){ mvDragging = false; }, true);
        mv.addEventListener("click", function(e){
          if(!offTap) return;
          var t = offTap; offTap = null;
          mv.style.pointerEvents = "none";
          var under = document.elementFromPoint(t.x, t.y);
          mv.style.pointerEvents = "auto";
          if(under && under !== mv) under.click();
        });
        return;
      }

      /* MOUSE: live only while the cursor is over the model, so a click just
         off it (a button, a link, the gallery) reaches the page. Pointer-events
         is set on pointermove, before the press, which is what the browser
         hit-tests. Held live through a drag even when it leaves the model. */
      var live = false, dragging = false, queued = null;
      function setLive(on){
        if(live === on) return;
        live = on;
        mv.style.pointerEvents = on ? "auto" : "none";
      }
      window.addEventListener("pointermove", function(e){
        if(dragging || e.pointerType !== "mouse") return;
        if(queued){ queued.x = e.clientX; queued.y = e.clientY; return; }
        queued = { x:e.clientX, y:e.clientY };
        requestAnimationFrame(function(){
          var q = queued; queued = null;
          if(!dragging) setLive(onModel(q.x, q.y));
        });
      }, { passive:true });
      window.addEventListener("pointerdown", function(e){
        if(e.pointerType === "mouse" && !live) setLive(onModel(e.clientX, e.clientY));
        if(live && e.target === mv){ dragging = true; mvDragging = true; box.classList.add("mv-live"); }
      }, true);
      window.addEventListener("pointerup", function(){ dragging = false; mvDragging = false; }, true);
      window.addEventListener("pointercancel", function(){ dragging = false; mvDragging = false; }, true);
    })();

    rsBtn.addEventListener("click", function(){
      // framedOrbit is the computed home for THIS screen; defaultOrbit is only
      // the attribute's placeholder, and would put the model back at the wrong
      // size on anything but the window it was hand-tuned for.
      if(exT > 0){ applyExplodeFraming(false, homeTheta, homePhi); return; }   // exploded: refit at the home angles
      mv.cameraOrbit = framedOrbit || defaultOrbit;
      // also recentre. Panning is disabled now, but anyone who shifted the
      // model before this change still has that offset stored in cameraTarget,
      // and resetting the orbit alone would leave it stuck off-centre.
      mv.cameraTarget = "auto auto auto";
      mv.resetTurntableRotation && mv.resetTurntableRotation();
      if(REDUCE_MOTION && mv.jumpCameraToGoal) mv.jumpCameraToGoal();
    });

    /* DRAWING VIEW removed (Owen, 2026-10-28). Pipeline GLBs still carry the
       WEB_Ink linework material; it is exported invisible, so it never shows. */

    mv.addEventListener("load", function(){
      frameModel();
      // model-viewer's own focus ring draws round the whole oversized, tilted
      // element; the stage frame in css/style.css is the ring (3 Nov 2026)
      try { var ui = mv.shadowRoot && mv.shadowRoot.querySelector(".userInput"); if(ui) ui.style.outline = "none"; } catch(e){}
      // two frames of settle, then reveal: the first frame model-viewer paints
      // is its own auto-framing, which at these element proportions is the
      // wrong size. See the opacity note on .cad-stage model-viewer.
      requestAnimationFrame(function(){
        frameModel();
        var st = mv.parentElement; if(st) st.classList.add("mv-framed");
      });

      // ---- lamp on / off / dim ----
      // The render's LED material is emissive; scaling its emissiveFactor dims
      // the glow through the frosted-glass shade. If the emissive material can't
      // be read for some reason, fall back to dimming the whole scene exposure.
      var emis = [], base = [];
      try {
        (mv.model && mv.model.materials || []).forEach(function(m){
          var ef = null; try { ef = m.emissiveFactor; } catch(e){}
          // emissiveFactor only. A name regex (/255_0_0|emis|led|glow/) used to
          // stand in here too; dropped 2026-11-02, since a future part named
          // "led_housing" would get a LIGHT ON button that does nothing.
          var lit = ef && (ef[0]>0 || ef[1]>0 || ef[2]>0);
          if(lit){ emis.push(m); base.push([ef[0],ef[1],ef[2]]); }
        });
      } catch(e){}
      var lampOn = true, level = 0.8;     // the glow it always had at the slider's default
      function applyLamp(){
        var v = lampOn ? level : 0;
        if(emis.length){ emis.forEach(function(m,i){ var b=base[i]; try{ m.setEmissiveFactor([b[0]*v,b[1]*v,b[2]*v]); }catch(e){} }); }
        else { mv.exposure = 0.3 + 1.1*v; }   // fallback: dim the whole scene
      }
      /* The label carries the state (LIGHT ON / LIGHT OFF), so the button has
         no aria-pressed (score round 2, 3D item 7): with both, a screen reader
         heard "LIGHT OFF, toggle button, not pressed", the state twice. The
         changing label was kept over a fixed "LIGHT" + aria-pressed because it
         is what a sighted visitor reads; .active (ink) stays the visual cue. */
      function setPwr(on){ lampOn=on; pwrBtn.classList.toggle("active",on); pwrBtn.textContent = on?"LIGHT ON":"LIGHT OFF"; applyLamp(); }
      // p.modelLight:true forces the switch on for a lamp whose emissive
      // material could not be read (it then dims the whole scene instead).
      var hasLamp = emis.length > 0 || p.modelLight === true;
      if(hasLamp && pwrBtn){
        pwrBtn.hidden = false;
        pwrBtn.addEventListener("click", function(){ setPwr(!lampOn); });
        setPwr(true);
      } else if(pwrBtn) pwrBtn.hidden = true;     // put in early from the GLB's JSON, not confirmed

      // material variants (KHR_materials_variants): show a picker if the GLB
      // carries them. Author them in Blender / gltf-transform; nothing to wire
      // here beyond this once the file has them.
      var vs = mv.availableVariants || [];
      // (with p.variants set, the FINISH row under the chips drives this instead)
      if(vs.length > 1 && !(p.variants || []).length){
        sel.hidden = false;
        sel.innerHTML = vs.map(function(v){ return '<option value="'+v+'">'+String(v).toUpperCase()+'</option>'; }).join("");
        sel.value = mv.variantName || vs[0];
        sel.addEventListener("change", function(){ mv.variantName = sel.value; });
      }

      // explode: plays a baked glTF animation whose name contains "explode".
      // model-viewer has no built-in explode, so the clean path is to keyframe
      // the parts apart in Blender and export the animation; this scrubs it.
      var anims = mv.availableAnimations || [];
      var exName = anims.filter(function(a){ return /explode/i.test(a); })[0];
      if(!exName && exBtn) exBtn.hidden = true;   // put in early from the GLB's JSON, not confirmed
      if(exName){
        exBtn.hidden = false;
        mv.animationName = exName;
        mv.pause();
        try { mv.currentTime = 0; } catch(e){}
        var open = false, raf = null;
        exBtn.addEventListener("click", function(){
          open = !open; exOpen = open;
          exBtn.classList.toggle("active", open);
          exBtn.setAttribute("aria-pressed", open ? "true" : "false");   // state in words, not colour only
          // stop a hair short of the end: the clip loops, so currentTime = duration
          // wraps straight back to 0 and the product snaps shut again. Read at
          // click time: right after load, duration is not known yet.
          var dur = Math.max(0, (mv.duration || 1) - 0.02);
          if(!exSamples) exSamples = sampleExplode(dur);
          exFit = exPlan();
          var from = mv.currentTime || 0, to = open ? dur : 0;
          var t0 = performance.now(), D = 620;
          var rs = (exFit || [{ r:homeR }]).map(function(q){ return q.r; });
          exLimits(Math.min(homeR, mv.getCameraOrbit().radius), Math.max.apply(null, rs.concat([mv.getCameraOrbit().radius])));
          cancelAnimationFrame(raf);
          (function step(now){
            // reduced motion: land on the end state in one frame
            var k = REDUCE_MOTION ? 1 : Math.min(1, (now - t0) / D);
            var e = k < .5 ? 2*k*k : -1 + (4 - 2*k)*k;
            var t = from + (to - from) * e;
            try { mv.currentTime = t; } catch(err){}
            exT = dur ? t / dur : 0;
            exCamera(exT, true);            // the zoom moves with the parts
            if(k < 1) raf = requestAnimationFrame(step);
            else { var r = exAt(exT).r; exLimits(r, r); }
          })(performance.now());
        });
        // a change of pitch while exploded can bring a part to the edge: refit
        // once the drag is let go (spinning alone never needs it, see exPlan)
        var exPhi = null;
        mv.addEventListener("pointerdown", function(){ exPhi = mv.getCameraOrbit().phi; });
        window.addEventListener("pointerup", function(){
          if(exPhi === null) return;
          var was = exPhi; exPhi = null;
          setTimeout(function(){
            if(exT > 0 && Math.abs(mv.getCameraOrbit().phi - was) > 0.02) applyExplodeFraming(false);
          }, 250);
        });
      }
    });
  }

  // project title: now a real on-page h1 at the top of the hero's text
  // column (Figma: title box at 570,155). The docked-beside-the-logo running
  // title is therefore OFF to avoid saying the name twice; delete the next
  // line's comment markers to bring it back.
  var runHead = document.getElementById("runHead");
  // if(runHead){ runHead.innerHTML = '<span class="rh-in">'+esc(p.title)+'</span>'; runHead.classList.add("on"); }

  // info icon: click reveals the fuller "more" text sitting beside whatever
  // short line it's attached to (mechanism copy, a component note, etc).
  // One delegated listener covers every instance built into the page.
  content.addEventListener("click", function(e){
    var btn = e.target.closest(".info-btn");
    if(!btn) return;
    var panel = btn.parentElement.querySelector(".info-panel");
    var open = !btn.classList.contains("open");
    btn.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if(panel) panel.classList.toggle("open", open);
  });
  /* the info text is a popup (4 Nov 2026): a click anywhere outside an open
     one closes it, so it never sits over the page by accident */
  function closeInfo(each){
    content.querySelectorAll(".info-btn.open").forEach(function(btn){
      var wrap = btn.parentElement, panel = wrap && wrap.querySelector(".info-panel");
      btn.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
      if(panel) panel.classList.remove("open");
      if(each) each(btn, wrap);
    });
  }
  document.addEventListener("click", function(e){
    if(!e.target.closest(".info-wrap")) closeInfo();
  });

  // component-spread labels: click a label's info icon to open its spec panel;
  // opening one closes any other that's open so panels don't stack.
  content.addEventListener("click", function(e){
    var ci = e.target.closest(".comp-info");
    if(!ci) return;
    var label = ci.closest(".comp-label");
    var open = !label.classList.contains("open");
    content.querySelectorAll(".comp-label.open").forEach(function(l){ if(l !== label) l.classList.remove("open"); });
    label.classList.toggle("open", open);
    ci.setAttribute("aria-expanded", open ? "true" : "false");
  });

  /* LABELS ON THE PHOTO KEEP OFF THEIR PART (2026-11-03, score round 2,
     layout D2). A label set ON a cut-out photo (.comp-label.on-img) is placed
     by % of the spread, but its type has a floor (12 px-ish) while the photo
     keeps shrinking, so at 820 / 390 / 360 "LED MATRIX" landed on the LED
     panel. After layout, each such label is tested against the photo's own
     opaque pixels (alpha mask from the image, 160 px wide); if it touches the
     part it is lifted to sit 4 px above the part's top edge under the label's
     width. Re-run on any size change of the spread (ResizeObserver, which also
     fires when Process and detail is first revealed) and once fonts are in.
     General: every product, every label, nothing authored per label. */
  (function spreadLabels(){
    var spreads = content.querySelectorAll(".comp-spread");
    if(!spreads.length) return;
    Array.prototype.forEach.call(spreads, function(sp){
      var im = sp.querySelector("img"), mask = null, MW = 160, MH = 0;
      if(!im) return;
      function build(){
        try {
          if(!im.naturalWidth) return;
          MH = Math.max(1, Math.round(MW * im.naturalHeight / im.naturalWidth));
          var c = document.createElement("canvas"); c.width = MW; c.height = MH;
          var g = c.getContext("2d"); g.drawImage(im, 0, 0, MW, MH);
          var d = g.getImageData(0, 0, MW, MH).data;
          mask = new Uint8Array(MW * MH);
          for(var i = 0; i < MW * MH; i++) mask[i] = d[i * 4 + 3] > 40 ? 1 : 0;
        } catch(e){ mask = null; }
      }
      function fit(){
        var ir = im.getBoundingClientRect();
        if(!ir.width || !ir.height) return;
        if(!mask) build();
        if(!mask) return;
        var sr = sp.getBoundingClientRect();
        Array.prototype.forEach.call(sp.querySelectorAll(".comp-label.on-img"), function(l){
          if(l.dataset.top) l.style.top = l.dataset.top;     // authored place first
          var b = (l.querySelector(".comp-info") || l).getBoundingClientRect(), PAD = 2;
          function mx(px){ return Math.max(0, Math.min(MW - 1, Math.floor((px - ir.left) / ir.width * MW))); }
          function my(py){ return Math.max(0, Math.min(MH - 1, Math.floor((py - ir.top) / ir.height * MH))); }
          if(b.right < ir.left || b.left > ir.right || b.bottom < ir.top || b.top > ir.bottom) return;
          var x0 = mx(b.left - PAD), x1 = mx(b.right + PAD), y0 = my(b.top - PAD), y1 = my(b.bottom + PAD), hit = false, x, y;
          for(y = y0; y <= y1 && !hit; y++) for(x = x0; x <= x1; x++) if(mask[y * MW + x]){ hit = true; break; }
          if(!hit) return;
          var topRow = -1;
          for(y = 0; y < MH && topRow < 0; y++) for(x = x0; x <= x1; x++) if(mask[y * MW + x]){ topRow = y; break; }
          if(topRow < 0) return;
          var partTop = ir.top + topRow / MH * ir.height;
          l.style.top = (partTop - sr.top - (b.bottom - b.top) - 4 - (b.top - l.getBoundingClientRect().top)) + "px";
        });
      }
      var queued = false;
      function later(){ if(queued) return; queued = true; requestAnimationFrame(function(){ queued = false; fit(); }); }
      if(im.complete && im.naturalWidth) later(); else im.addEventListener("load", later);
      if(window.ResizeObserver){ try { new ResizeObserver(later).observe(sp); } catch(e){} }
      else window.addEventListener("resize", later);
      try { document.fonts && document.fonts.ready.then(later); } catch(e){}
    });
  })();

  /* Escape closes an open info panel or component label and hands focus
     back to its button (score round 2, a11y item 8). The lightbox's own
     Escape runs first, in the capture phase, and stops the key there. */
  document.addEventListener("keydown", function(e){
    if(e.key !== "Escape" && e.key !== "Esc") return;
    var back = null, act = document.activeElement;
    closeInfo(function(btn, wrap){ if(!back || (wrap && wrap.contains(act))) back = btn; });
    content.querySelectorAll(".comp-label.open").forEach(function(l){
      var ci = l.querySelector(".comp-info");
      l.classList.remove("open");
      if(ci){ ci.setAttribute("aria-expanded", "false"); if(!back || l.contains(act)) back = ci; }
    });
    if(back && (!act || act === document.body || content.contains(act))){ try { back.focus({ preventScroll:true }); } catch(err){ back.focus(); } }
  });

  /* FOCUS RING ON THE 3D STAGE (score round 2, a11y item 7). <model-viewer>
     takes keyboard focus (arrow keys turn the model), but the element is 130vw
     wide, so the site's :focus-visible ring was drawn off screen. The ring goes
     on the stage, the box the visitor sees, while the model has keyboard focus. */
  /* keyboard or pointer, for the stage frame in css/style.css (4 Nov 2026) */
  document.addEventListener("keydown", function(e){
    var k = e.key || "";
    if(k === "Tab" || k.indexOf("Arrow") === 0) document.documentElement.classList.add("kbd");
  }, true);
  document.addEventListener("pointerdown", function(){ document.documentElement.classList.remove("kbd"); }, true);
  (function stageRing(){
    var mv = document.getElementById("mv"), st = mv && mv.closest(".cad-stage");
    if(!st) return;
    mv.addEventListener("focus", function(){
      var kb = true; try { kb = mv.matches(":focus-visible"); } catch(e){}
      if(!kb) return;
      st.style.outline = "2px solid var(--ink)"; st.style.outlineOffset = "-2px";
    });
    mv.addEventListener("blur", function(){ st.style.outline = ""; st.style.outlineOffset = ""; });
  })();

  // read more: reveal the process / portfolio section, then retire the button
  var readMoreBtn = document.getElementById("readMoreBtn");
  if(readMoreBtn){
    readMoreBtn.addEventListener("click", function(e){
      var wrap = document.getElementById("procReveal");
      if(wrap){ wrap.hidden = false; requestAnimationFrame(function(){ wrap.classList.add("open"); }); }
      readMoreBtn.setAttribute("aria-expanded", "true");
      var rm = document.getElementById("readmoreWrap");
      var h = wrap && wrap.querySelector("h2");
      /* the button that had focus is gone: hand focus to the section it
         opened (its heading), or keyboard focus falls back to <body> and the
         next Tab starts again from the top of the page (score round 1, 3D 5).
         2026-11-03 (score round 2, 3D item 6): that heading is visually
         hidden, so a sighted KEYBOARD user saw focus vanish. From the keyboard
         (a click with detail 0) the heading now takes the button's place,
         same words, same type, same slot, so nothing moves and the focus ring
         has something to sit on. Inline colour: it is not a link, so it does
         not take the button's red hover. A mouse click is unchanged: the
         button goes, the heading stays for screen readers only. */
      if(h && rm && e && e.detail === 0){
        h.classList.remove("vh");
        h.className = "read-more-link proc-head";
        h.style.color = "var(--ink)"; h.style.cursor = "default"; h.style.margin = "0"; h.style.fontWeight = "normal";
        readMoreBtn.hidden = true; readMoreBtn.style.display = "none";
        rm.appendChild(h);
      } else if(rm) rm.style.display = "none";
      if(h){ h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll:true }); } catch(err){ h.focus(); } }
    });
  }

  // assigned by the lightbox block below, called by the gallery when it
  // re-deals its columns and the thumb elements are replaced.
  var bindLightbox = function(){};

  // ---------- LIGHTBOX: click the hero image or any gallery thumb to open a
  // near-fullscreen viewer. data-lb="N" on each <img> indexes into `gal`
  // (gal[0] is the hero, gal[1..] are the thumbs, same order they're built in
  // above), so the viewer always cycles the FULL project gallery regardless
  // of which image was clicked first. ----------
  (function(){
    var items = LB;                       // images AND videos, one shared set
    if(!items.length) return;
    var lb = document.getElementById("lightbox");
    var lbImg = document.getElementById("lbImg");
    var lbVid = document.getElementById("lbVid");
    var lbCount = document.getElementById("lbCount");
    var lbPrev = document.getElementById("lbPrev");
    var lbNext = document.getElementById("lbNext");
    var lbClose = document.getElementById("lbClose");
    var cur = 0, lastFocus = null;

    function render(){
      var it = items[cur];
      var isVid = it.type === "video";
      // swap which element is live, and always stop the video when leaving it -
      // otherwise its audio/decoding carries on behind a photo
      lbVid.hidden = !isVid;
      lbImg.hidden = isVid;
      if(isVid){
        lbImg.removeAttribute("src");
        if(lbVid.getAttribute("src") !== it.src) lbVid.setAttribute("src", it.src);
        lbVid.play().catch(function(){});
      } else {
        lbVid.pause();
        lbVid.removeAttribute("src");
        // on a phone the 1200px md/ copy, when there is one; the original elsewhere
        lbImg.src = VPATH((it.md && window.innerWidth <= 760) ? it.md : it.src);
        /* the photo's own description, not just its position in the set */
        var file = String(it.src).split("/").pop();
        var d = VALT(file, (p.alt || {})[file]);   // a finish's own description, when it has one
        lbImg.alt = (d ? d : p.title) + " (" + (cur+1) + " of " + items.length + ")";
      }
      lbCount.textContent = (cur+1<10?"0":"")+(cur+1) + " / " + (items.length<10?"0":"")+items.length;
      lbPrev.disabled = items.length < 2;
      lbNext.disabled = items.length < 2;
    }
    /* SCROLL LOCK. `document.body.style.overflow = "hidden"` did nothing here:
       the scrolling element on this page is <html>, not <body>, so the page
       carried on scrolling behind the open lightbox (measured: one wheel
       gesture moved it 900px) and closing it dropped you somewhere else
       entirely. overflow:hidden on documentElement is all it takes: it stops
       the scroll without moving anything, so the position is still exactly
       where it was when the overlay closes. */
    function lockScroll(){ document.documentElement.style.overflow = "hidden"; }
    function unlockScroll(){ document.documentElement.style.overflow = ""; }

    /* FOCUS TRAP. The lightbox covers the whole window, but Tab used to walk
       straight out of it into the page behind (verified: three presses put
       focus on the skip link). Keep the ring inside the three controls while
       it is open; focus returns to whatever opened it on close. */
    function trapKeys(e){
      /* Escape here, in the capture phase, as well as in the bubbling listener
         below: the video's own controls (play, timeline, volume, full screen)
         swallow the key before it bubbles, so with focus on one of them the
         lightbox used to stay open (score round 2, 3D item 2). */
      if(e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); close(); return; }
      /* ...but measured 3 Nov: once focus is INSIDE those native controls,
         Chrome delivers no key event to the page at all (not keydown, not
         keyup, not even the Tab), so no listener can see that Escape. The fix
         is to keep Tab from entering them: the video element itself is the
         ring's stop (Tab from it goes to Next, Shift+Tab to Prev, and back),
         and Space or Enter on it plays and pauses. The controls stay for the
         mouse and touch; the clips are silent loops, so play / pause is all a
         keyboard needs. */
      var vidOn = lbVid && !lbVid.hidden;
      if(vidOn && document.activeElement === lbVid && (e.key === " " || e.key === "Enter" || e.key === "Spacebar")){
        e.preventDefault(); e.stopPropagation();
        if(lbVid.paused) lbVid.play().catch(function(){}); else lbVid.pause();
        return;
      }
      if(vidOn && e.key === "Tab"){
        var ae = document.activeElement, to = null;
        if(ae === lbVid) to = e.shiftKey ? (lbPrev.disabled ? lbClose : lbPrev) : (lbNext.disabled ? lbClose : lbNext);
        else if(e.shiftKey && ae === lbNext) to = lbVid;
        else if(!e.shiftKey && ae === lbPrev) to = lbVid;
        else if(!e.shiftKey && ae === lbClose && lbPrev.disabled) to = lbVid;
        if(to){ e.preventDefault(); to.focus(); return; }
      }
      if(e.key !== "Tab") return;
      /* the video, when one is showing, is in the ring too, and its native
         controls (play, scrub, volume, full screen) are reached by Tab. The
         DOM order inside the lightbox is already the ring's order (Close,
         Prev, video, Next), so the browser moves focus itself and only the
         two ends wrap; Tab from outside the lightbox comes back to Close. */
      var f = [lbClose, lbPrev, lbVid, lbNext].filter(function(el){ return el && !el.disabled && !el.hidden; });
      if(!f.length) return;
      var a = document.activeElement, first = f[0], last = f[f.length - 1];
      if(!lb.contains(a)){ e.preventDefault(); first.focus(); return; }
      if(!e.shiftKey && a === last){ e.preventDefault(); first.focus(); }
      else if(e.shiftKey && a === first){ e.preventDefault(); last.focus(); }
    }

    function open(i){
      cur = ((i % items.length) + items.length) % items.length;
      lastFocus = document.activeElement;
      render();
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      lockScroll();
      document.addEventListener("keydown", trapKeys, true);
      requestAnimationFrame(function(){ lb.classList.add("show"); lb.classList.add("imgshow"); });
      lbClose.focus();
    }
    function close(){
      lb.classList.remove("show"); lb.classList.remove("imgshow");
      lb.setAttribute("aria-hidden", "true");
      document.removeEventListener("keydown", trapKeys, true);
      unlockScroll();
      // never leave a video playing behind a closed overlay
      lbVid.pause(); lbVid.removeAttribute("src");
      setTimeout(function(){ lb.classList.remove("open"); }, 220);
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function step(d){
      lb.classList.remove("imgshow");
      cur = ((cur + d) % items.length + items.length) % items.length;
      setTimeout(function(){ render(); lb.classList.add("imgshow"); }, 120);
    }

    /* Exposed so the gallery can rewire itself: when the column count changes
       at the 760px breakpoint the thumbs are rebuilt as brand new nodes, and
       their click handlers go with the old ones. Re-binding is safe to call
       repeatedly because it only ever runs over nodes inside the subtree it is
       handed, and those nodes have just been created. */
    bindLightbox = function(root){
      (root || content).querySelectorAll("[data-lb]").forEach(function(el){
        var n = +el.getAttribute("data-lb");
        /* KEYBOARD (2026-11-02, review A2): the hero, the thumbs and the video
           figures carry tabindex="0" role="button" in their markup; Enter or
           Space opens the same item a click does. The label says what the key
           does and keeps the photo's own description after it. */
        if(!el.hasAttribute("aria-label")){
          var it = items[n] || {}, d = el.getAttribute("alt") || "";
          el.setAttribute("aria-label", "Open " + (it.type === "video" ? "video" : "photo") + " " +
            (n + 1) + " of " + items.length + (d ? ", " + d : ""));
        }
        el.addEventListener("click", function(e){
          e.preventDefault();
          open(n);
        });
        el.addEventListener("keydown", function(e){
          if(e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
          e.preventDefault();
          open(n);
        });
      });
    };
    bindLightbox(content);
    lbPrev.addEventListener("click", function(){ step(-1); });
    lbNext.addEventListener("click", function(){ step(1); });
    lbClose.addEventListener("click", close);
    lb.addEventListener("click", function(e){ if(e.target === lb) close(); });
    document.addEventListener("keydown", function(e){
      if(!lb.classList.contains("open")) return;
      if(e.key === "Escape") close();
      else if(e.key === "ArrowLeft") step(-1);
      else if(e.key === "ArrowRight") step(1);
    });
  })();

  /* ---------- gallery: re-deal the columns when the layout breakpoint
     changes. Four columns on desktop, two on a phone (one if there is only a
     single photo). The columns are real elements, so unlike the old CSS
     multi-column this cannot re-flow itself and has to be rebuilt. Keyed off a
     matchMedia change event rather than every resize tick, so dragging a
     window edge does not rebuild the DOM continuously - it only fires when the
     page actually crosses 760px. ---------- */
  (function(){
    var wrap = document.getElementById("heroGallery");
    if(!wrap || !galFiles.length) return;
    var cols = wrap.querySelector(".gcols");
    // the markup was already built with galColCount(), so start in step with it
    // and only touch the DOM when the breakpoint actually changes.
    var current = galColCount();
    function apply(){
      var n = galColCount();
      if(n === current) return;
      current = n;
      cols.innerHTML = galleryHTML(n);
      bindLightbox(cols);          // the thumbs are new nodes, rewire them
    }
    if(galMQ.addEventListener) galMQ.addEventListener("change", apply);
    else if(galMQ.addListener) galMQ.addListener(apply);   // older Safari
  })();

  // ---------- inline loop videos: only play while on screen. autoplay still
  // starts them the normal way; this pauses any that scroll out of view and
  // resumes them as they come back, so a page with several loops never has
  // them all decoding at once. ----------
  if(!CLIP_STILL && "IntersectionObserver" in window){
    var vio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var v = en.target;
        if(en.isIntersecting){ v.play && v.play().catch(function(){}); }
        else { v.pause && v.pause(); }
      });
    }, {rootMargin:"120px 0px"});
    content.querySelectorAll(".fig.vid video").forEach(function(v){ vio.observe(v); });
  }

  // ---------- #model (2026-11-03): Solutions links kart.html#model. The page is
  // built by script, so the browser's own hash jump happens before the section
  // exists. Once the loader has let go AND the model is framed (or the viewer
  // has given up), scroll once so the MODEL is in view, not the section top:
  // the resting model rises out of its row by design, so "block:start" on the
  // section cut the top of the product off (score round 1, 3D item 1). The
  // model is centred in the window when it fits, with its top never closer
  // than 24 px to the window's top edge; a taller model shows from its top.
  (function jumpToModel(){
    if(location.hash !== "#model") return;
    var tries = 0, MARGIN = 24;
    try { if("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch(e){}
    /* 3 Nov 2026: the model's space is reserved from the GLB's JSON before
       the model loads (relayoutModel), so the jump no longer waits for the
       model: holdLoader runs it under the loading screen, just before the
       reveal (jumpModelNow), and the page appears already at the model. The
       poll below stays as the fallback (no GLB numbers, or no hold). */
    var jumped = false;
    /* The browser makes its own #model scroll when the page finishes loading
       (a smooth one: html has scroll-behavior:smooth). Now that the jump runs
       under the loader, usually before that, the browser's scroll then
       landed on top of it and left the section top in view, cutting the
       model's top off (measured: OMNI 1440 with CPU x4, 100 px off). So the
       section answers to no id until the page has loaded and the jump has
       been made; the address keeps #model. */
    var sect = document.getElementById("model");
    if(sect){
      sect.id = "";
      var giveBack = function(){ setTimeout(function(){ if(!document.getElementById("model")) sect.id = "model"; }, 300); };
      var whenLoaded = function(fn){ if(document.readyState === "complete") fn(); else window.addEventListener("load", fn, { once:true }); };
      (function back(){ if(jumped) whenLoaded(giveBack); else setTimeout(back, 200); })();
      setTimeout(function(){ whenLoaded(giveBack); }, 30000);
    }
    function framed(){
      var mvEl = document.getElementById("mv");
      if(!mvEl || viewerFailedOnce) return true;
      return !!(modelExtent && modelExtent());
    }
    jumpModelNow = function(){
      if(jumped || !sect || !framed()) return;
      jump();
    };
    (function poll(){
      if(jumped) return;
      var b = document.body.classList, el = sect;
      var up = el && b.contains("ready") && !b.contains("ld-pinned");
      if(up && (framed() || tries > 150)){ jump(); return; }
      if(++tries < 300) setTimeout(poll, 100);
    })();
    function jump(){
      jumped = true;
      var el = sect;
      {
        var x = (!viewerFailedOnce && modelExtent) ? modelExtent() : null;
        if(x){
          /* 2026-11-03 (score round 2, 3D item 3): the control bar (EXPLODED
             VIEW / LIGHT ON / RESET / VIEW IN YOUR SPACE) is part of what
             #model promises. A model that fits is centred, moved up only as
             far as the bar needs, never past its own top margin. Since
             3 Nov 2026 the model is sized so that it and the bar always fit
             (layoutModel); a window too short even for the floor size lands
             BASE FIRST: base and bar MARGIN above the bottom edge. */
          var vh = window.innerHeight, h = x.bottom - x.top;
          var bar = document.querySelector(".cad-hiw-model .mv-bar");
          var br = (bar && bar.getClientRects().length) ? bar.getBoundingClientRect() : null;
          var low = Math.max(x.bottom, br ? br.bottom : x.bottom);
          var to;
          if(low - x.top + 2 * MARGIN <= vh){
            to = x.top + h / 2 - vh / 2;                       // centred
            to = Math.max(to, low + MARGIN - vh);              // ...bar in view
            to = Math.min(to, x.top - MARGIN);                 // ...top kept
          } else {
            to = low + MARGIN - vh;                            // base first
          }
          window.scrollTo({ top: Math.max(0, window.scrollY + to), behavior: "instant" });
        } else {
          try { el.scrollIntoView({block:"start", behavior:"auto"}); } catch(e){ el.scrollIntoView(); }
        }
      }
    }
  })();

  // ---------- HOLD THE LOADER until the above-the-fold assets are actually
  // loaded, so the page never reveals with the hero image, hero video, fonts,
  // mechanism or near photos still popping in. Not the 3D model (Owen, 3 Nov
  // 2026): only its space, see "MODEL LOAD". Each wait has its own timeout and main.js keeps a
  // global 12s hard cap, so one stalled asset can never strand the loader.
  // (main.js hands us reveal control because window.__DEFER_REVEAL is set in
  // the head; if for any reason it isn't, this simply does nothing and the
  // page reveals on the normal timing.) ----------
  (function holdLoader(){
    if(typeof window.__revealPage !== "function") return;
    function settle(el, ev, ms){
      return new Promise(function(res){
        if(!el) return res();
        var t = setTimeout(res, ms);
        function ok(){ clearTimeout(t); res(); }
        el.addEventListener(ev, ok, {once:true});
        el.addEventListener("error", ok, {once:true});
      });
    }
    var waits = [];
    var heroImg = content.querySelector(".hero-main img");
    if(heroImg){
      if(heroImg.complete && heroImg.naturalWidth) waits.push(Promise.resolve());
      else waits.push(settle(heroImg, "load", 8000));
    }
    var heroVid = content.querySelector(".hero-aside-btm video, .hero-vid video");
    // first frame ready, not full download. Checked first: on a fast or cached
    // load canplay has often ALREADY fired by now, and waiting for it again
    // held the loader for the full 8s timeout on every visit (2026-10-02).
    // (reduced motion: the clip does not play, its poster is what shows, so
    // there is no first frame to wait for)
    if(heroVid && !CLIP_STILL){
      if(heroVid.readyState >= 3) waits.push(Promise.resolve());
      else waits.push(settle(heroVid, "canplay", 8000));
    }
    function capped(pr, ms){ return Promise.race([pr, new Promise(function(res){ setTimeout(res, ms); })]); }
    /* THE 3D MODEL IS NOT WAITED ON (Owen, 3 Nov 2026; it was from 2026-10-05).
       Only its SPACE is: the GLB's JSON (readGlbInfo, a few KB) gives the
       model's size and its buttons, so the model row and the control bar are
       laid out at their final size under the loader and nothing below them
       moves when the model arrives after the reveal. At most 3 s; without it
       the model is sized when it loads, as before. */
    if(glbInfoP && document.getElementById("mv")) waits.push(capped(glbInfoP, 3000));
    /* the fonts: every line wrap, and so the position of the model row, the
       mechanism and the gallery text, follows them. At most 3 s. */
    if(document.fonts && document.fonts.ready) waits.push(capped(document.fonts.ready.catch(function(){}), 3000));
    /* reduced motion: the hero clip does not play and its poster is what
       shows, so the poster is what must be in */
    if(heroVid && CLIP_STILL && heroVid.getAttribute("poster")){
      waits.push(new Promise(function(res){
        var im = new Image(), t = setTimeout(res, 6000);
        im.onload = im.onerror = function(){ clearTimeout(t); res(); };
        im.src = heroVid.getAttribute("poster");
      }));
    }
    // the mechanism iframe: its first paint is a big canvas render, and on
    // KART it sits beside the model above the fold - it should never pop in
    // (or first-paint-jank) after the loader clears
    var mechF = document.getElementById("mechFrame");
    // (guarded by position: a loading="lazy" iframe far below the fold never
    // starts loading until scrolled near, so waiting on it would just burn
    // the timeout. Near the fold - the KART/OMNI row - it loads immediately.)
    if(mechF && mechF.getBoundingClientRect().top < window.innerHeight * 2){
      // same already-fired guard as the video: a same-origin frame that has
      // finished loading will not fire load again
      var mechDone = false;
      try {
        var md = mechF.contentDocument;
        mechDone = !!md && md.readyState === "complete" && md.location.href !== "about:blank";
      } catch(e){}
      waits.push(mechDone ? Promise.resolve() : settle(mechF, "load", 8000));
    }
    Promise.all(waits).then(function(){
      /* the model's files, warmed into the HTTP cache while the loader is
         still up: network only, nothing parsed or compiled on this thread
         (rel=prefetch, the same warm-up js/menu.js uses for the next page).
         loadModel() then finds them local after the reveal. */
      var mvP = document.getElementById("mv");
      if(mvP && !viewerFailedOnce){
        try {
          var draco = new URL("js/vendor/draco/", document.baseURI).href;
          [MV_SRC, mvP.getAttribute("data-src"), draco + "draco_wasm_wrapper.js", draco + "draco_decoder.wasm"].forEach(function(h){
            if(!h) return;
            var l = document.createElement("link"); l.rel = "prefetch"; l.href = h;
            document.head.appendChild(l);
          });
        } catch(e){}
      }
      /* IMAGE DECODING, IN TWO PASSES (revised 2026-08-29).
         The previous version force-decoded EVERY image on the page before
         revealing - decode() triggers the request even on a loading="lazy"
         image - so a project page could not appear until its entire image set
         had downloaded AND decoded. That is what made the loading screen "take
         its time", and the decode burst itself was landing on the same main
         thread the logo tumble had to share.
         Now only what is within ~2 screens is decoded up front, which is all
         that can possibly be seen in the first second of scrolling. Everything
         below that is decoded after the reveal, during idle time, so it is
         still warm long before you reach it but it costs the loader nothing.
         Each decode is raced against a timeout and errors are swallowed, and
         main.js's global 12s hard cap still stands, so nothing can strand the
         loader. */
      var imgs = Array.prototype.slice.call(content.querySelectorAll("img"));
      var fold = window.innerHeight * 2;
      var near = [], far = [];
      /* NOT RENDERED = FAR (2026-10-05). The process photos sit inside the
         collapsed "Read more" section, where every rect is 0,0,0,0 - so "top <
         fold" counted all of them as near. Their decode() never resolves while
         they are not rendered (a lazy image out of layout is never fetched), so
         the loader sat out the full 6s timeout on every project page. That was
         most of the "6 seconds to load". */
      imgs.forEach(function(im){
        var r = im.getBoundingClientRect();
        (r.width > 0 && r.top < fold ? near : far).push(im);
      });
      function warm(list, ms){
        return Promise.all(list.map(function(im){
          var t = new Promise(function(res){ setTimeout(res, ms); });
          var d;
          try { d = im.decode ? im.decode() : Promise.resolve(); }
          catch(e){ d = Promise.resolve(); }
          return Promise.race([d.catch(function(){}), t]);
        }));
      }
      // the rest, once the page is up and the browser is otherwise idle
      var later = window.requestIdleCallback || function(fn){ setTimeout(fn, 1200); };
      later(function(){ warm(far, 20000); });
      return warm(near, 6000);
    }).then(function(){
      /* two frames of settle so the first full-page layout/paint happens
         UNDER the loader, not during its fade, and inside a quiet window: that
         paint (every image near the top going up to the GPU at once) is a GPU
         stall, so it waits for the logo's next rest instead of landing
         mid-turn. The logo is resting there anyway before it hands over. */
      function show(done){
        // the model's space at its final size, and the #model jump, both
        // under the loader so the page appears already in place
        try { relayoutModel(); } catch(e){}
        try { if(jumpModelNow) jumpModelNow(); } catch(e){}
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            window.__revealPage();
            // the logo may move again once that first paint has drained
            if(window.NEWO_LOADER) window.NEWO_LOADER.whenSmooth(done, 150, 800);
            else done();
          });
        });
      }
      if(window.NEWO_LOADER) window.NEWO_LOADER.quiet(show);
      else show(function(){});
    });
  })();

  /* ---------- ALIGN THE HOW-IT-WORKS ROW WITH THE GALLERY ABOVE ----------
     Owen's composition rule (2026-09-03): the bottom of the how-it-works
     paragraph sits on the bottom of the gallery above it, and the model and
     the mechanism move up TOGETHER by the same amount so the row stays in
     step. Pulling the row up is also what finally gets the model overlapping
     the photos: the gallery's short columns are on the left, directly above the
     model, and the tall one is on the right, so the section's own bottom edge
     is no guide to what the model actually reaches.

     Measured, not authored: the paragraph's height depends on the project's
     copy and on how it wraps at this width, so the pull is its own height,
     read at runtime and written to --hiw-pull for the CSS to apply as a
     negative margin. Desktop only - the stacked mobile layout puts the
     full-width gallery directly above and pulling up there would run the two
     into each other. Re-measured on resize because a rewrap changes the
     height. */
  (function alignHiw(){
    var cad = content.querySelector(".cad-hiw");
    var txt = cad && cad.querySelector(".hiw-text");
    if(!cad || !txt) return;
    var wide = window.matchMedia("(min-width:901px)");
    var GAP = 16;          // breathing room between a photo and the text under it (4 px grid, 4 Nov 2026)

    function apply(){
      /* MEASURE FROM AN EXPLICIT ZERO, never by REMOVING the property.
         The CSS is `margin-top: var(--hiw-pull, 32px)`, so removing the custom
         property does not return the row to its origin - it falls back to the
         32px default. Every measurement below was therefore taken with the row
         sitting 32px lower than the point the pull is actually applied from,
         which made `headroom` 32px too generous and overshot the pull by
         exactly that much. On HALO and NEB (how-it-works copy with the
         gallery directly above it and no model beside it) the overshoot landed
         the paragraph's first line 18px INSIDE the photo above it, at every
         width from 901px up - the one thing this function exists to prevent.
         Setting 0px explicitly makes the measurement and the value written
         back share an origin. */
      cad.style.setProperty("--hiw-pull", "0px");
      txt.style.removeProperty("max-width");
      if(!wide.matches){ cad.style.removeProperty("--hiw-pull"); return; }

      var gal  = content.querySelector(".hero-gallery");
      var cols = gal ? Array.prototype.slice.call(gal.querySelectorAll(".gcol")) : [];
      var imgs = gal ? Array.prototype.slice.call(gal.querySelectorAll("img, video")) : [];
      if(!cols.length || !imgs.length) return;

      /* 1. KEEP THE PARAGRAPH INSIDE ITS OWN GALLERY COLUMN.
         --w-desc is a fixed 32ch (~448px) but the gallery columns narrow with
         the window - 459px at 1920, 340 at 1440, 279 at 1180 - so from about
         1500px down the paragraph hung past its own column and into the next
         one. That next column is the TALL one, the only column that reaches
         down to where the paragraph now sits, so the text landed on a photo.
         Measured overlap before this: 48px at 1600, 88 at 1440, 153 at 1180.
         Capping to the column it starts under fixes it at every width and
         needs nothing authored per project. */
      var tl = txt.getBoundingClientRect().left, own = null;
      cols.forEach(function(c){
        var r = c.getBoundingClientRect();
        if(tl >= r.left - 2 && tl < r.right) own = r;
      });
      if(own){
        var cap = Math.max(200, Math.round(own.right - tl));
        txt.style.maxWidth = cap + "px";
        /* Justified text needs a measure to justify against. This paragraph is
           set justified like every other .desc on the site, which reads well at
           the full 32ch but opens ugly rivers of white space once the column
           caps it to ~20ch. Flag it so the CSS can fall back to plain left
           alignment when it has been squeezed. */
        txt.classList.toggle("hiw-narrow", cap < 380);
      }

      /* 2. Pull up by the paragraph's own height so its bottom lands on the
         gallery's bottom - but NEVER far enough to put its top over a photo
         that is genuinely above it. Owen's rule: no body text over any image,
         ever; only labels that belong to an image may sit on one. With the cap
         above this clamp should not bite, and it is here so that a longer
         how-it-works paragraph on some future project cannot reintroduce the
         bug. */
      var t = txt.getBoundingClientRect();
      /* -Infinity, not 0: these are viewport coordinates, so a photo scrolled
         above the screen has a NEGATIVE bottom. Starting at 0 threw those
         away, and any resize while scrolled down (opening Process and detail
         fires one, so does turning a tablet) dropped the clamp and landed the
         text on the photo: 10px into it on FLOW at 1180 (2026-10-27). */
      var deepest = -Infinity;
      imgs.forEach(function(im){
        var r = im.getBoundingClientRect();
        // only photos that actually sit in this paragraph's horizontal band
        /* + 5% of its height: a gallery photo grows 10% about its centre on
           hover (4 Nov 2026), so its bottom can come down by that much */
        if(r.right > t.left + 2 && r.left < t.right - 2) deepest = Math.max(deepest, r.bottom + r.height * 0.05);
      });
      var pull = t.height;
      if(deepest > -Infinity){
        /* No Math.max(0, ...) here. Clamping at zero meant that when the
           paragraph already sat too close to the photo above it, the best this
           could do was pull nothing - it could not push the row back DOWN to
           restore the gap. A negative pull is a positive margin, which is
           exactly the right answer in that case. */
        var headroom = t.top - (deepest + GAP);
        if(headroom < pull) pull = headroom;
      }
      cad.style.setProperty("--hiw-pull", (-Math.round(pull)) + "px");
    }
    apply();
    // fonts land after first layout and change the wrap; re-measure once they do
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(apply).catch(function(){});
    var t = null;
    window.addEventListener("resize", function(){
      clearTimeout(t); t = setTimeout(apply, 180);
    }, { passive:true });
    if(wide.addEventListener) wide.addEventListener("change", apply);
  })();

  /* ---------- START THE MODEL (armModel, at the end of this file) ----------
     Started once the loader has gone and its fade is over (see "MODEL
     LOAD"); the model then fades in already framed (showModel). */
  /* ---------- STOP COMPOSITING THE MODEL WHEN IT IS OFF SCREEN ----------
     Separate from the load gate below and it runs for the whole life of the
     page, not once: the model can be scrolled away from as often as it is
     scrolled to. See the .mv-offscreen note in css/style.css for why a static,
     idle model still costs something.
     50%, not 100%: a project page before "read more" is only about three
     viewports tall, so a full-viewport margin on either side meant the model
     counted as on-screen from everywhere and the class never engaged at all
     (measured). Half a viewport still gives ~450px of scroll warning, and the
     toggle is only a visibility flip - the canvas keeps its rendered contents,
     so there is nothing to redraw and no chance of arriving at a blank box. */
  /* ---------- PAUSE THE INLINE VIDEOS WHEN THEY ARE NOT ON SCREEN ----------
     The mechanism iframe and the 3D model are both already gated on visibility
     (see the mechVisible messages above and .mv-offscreen below) - the <video>
     elements were the one thing on the page still working while nobody was
     looking at it. A project page can carry four of them (hero demo, gallery
     clip, how-it-works clip, process clip), all autoplay+loop, and a browser
     will happily keep decoding every one of them while you read something two
     screens further down. That is a real cost on a phone.
     Same pattern as the other two: pause on the way out, play on the way back
     in. Nothing is torn down and no bytes are re-fetched, so resuming is
     instant. A video the visitor has paused themselves is left alone. */
  (function pauseOffscreenVideos(){
    var vids = Array.prototype.slice.call(content.querySelectorAll(".fig.vid video, .hero-vid video"));
    if(!vids.length) return;

    if(!window.IntersectionObserver) return;   // leave them running, as before
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var v = e.target;
        if(e.isIntersecting){
          if(v.dataset.autopaused === "1"){ v.dataset.autopaused = ""; v.play().catch(function(){}); }
        } else if(!v.paused){
          v.dataset.autopaused = "1"; v.pause();
        }
      });
    }, { rootMargin: "100px 0px" });
    vids.forEach(function(v){ io.observe(v); });

    // a hidden tab should not be decoding video either
    document.addEventListener("visibilitychange", function(){
      if(document.hidden){
        vids.forEach(function(v){ if(!v.paused){ v.dataset.autopaused = "1"; v.pause(); } });
      } else {
        vids.forEach(function(v){
          if(v.dataset.autopaused === "1"){ v.dataset.autopaused = ""; v.play().catch(function(){}); }
        });
      }
    });
  })();

  /* The offscreen gate and the idle preload below both want to own
     .mv-offscreen, and they want opposite things. visibility:hidden takes the
     element out of paint, and model-viewer will not build a scene it cannot
     paint - so with the gate on, the preload would fetch the GLB and then sit
     there, `loaded` never flipping, and the whole cost would land on the
     scroll anyway. (That is exactly what happened the first time this was
     tried: the model still had not loaded 60s after ready.)
     So the gate is written once, here, and asked rather than set: onScreen is
     the observer's answer, holds is the preload saying "not yet". */
  var modelGate = null;
  (function hideOffscreenModel(){
    if(!loadModel || !window.IntersectionObserver) return;
    var box = document.querySelector(".cad-stage");
    if(!box) return;
    var onScreen = false, holds = 0;
    function apply(){ box.classList.toggle("mv-offscreen", !onScreen && holds === 0); }
    apply();
    new IntersectionObserver(function(entries){
      onScreen = entries[0].isIntersecting; apply();
    }, { rootMargin: "50% 0px" }).observe(box);
    modelGate = { refresh: apply, hold: function(){ holds++; apply(); },
                  release: function(){ holds = Math.max(0, holds - 1); apply(); } };
  })();

  /* ---------- WHEN THE MODEL IS ALLOWED TO LOAD ---------------------------
     This used to wait for an IntersectionObserver at 150% viewport margin, so
     the model started loading as soon as the visitor scrolled a little way
     down. That put the whole cost of starting it - and it is a lot of cost -
     directly underneath the scroll it was triggered by, which is the worst
     possible moment for it. Measured on kart.html at 1920x1080, from the
     instant loadModel() ran:

       ~1000ms   parsing and compiling model-viewer.min.js (1.1MB of module,
                 injected lazily by loadModel, so none of it had been touched
                 before this point)
       ~150ms    decoding the Draco mesh
       ~800ms    32 getProgramParameter stalls - the GPU driver linking the
                 PBR shader programs, doubled by the frosted shade's
                 KHR_materials_transmission, which needs its own variants

     Roughly two seconds of main-thread block, arriving in two lumps, on a
     container CPU - call it a few hundred milliseconds on a real desktop. Any
     of it landing mid-scroll reads as the page seizing up, and that is what
     the "jittery and laggy on desktop" report was. kart.html is the only page
     with a model AND a mechanism, which is why it was the only page reported.

     None of that work gets cheaper, so it moves instead: it now runs on the
     first idle callback after the page is ready, while the visitor is still
     looking at the hero and the page is not moving. By the time they scroll
     down to the model it is already built. The observer is kept only as a
     guarantee for the case where idle never comes (a busy tab, or a browser
     without requestIdleCallback that also beat the timeout) - whichever fires
     first wins, and `fired` makes sure it happens exactly once. */
  /* ---------- THE MODEL'S FIRST DRAW (2026-10-26) ----------
     Owen: the logo tumble was choppy on a project's first load. The tumble
     runs on its own thread, but every canvas shares the GPU, and model-viewer's
     first draw links about 30 shader programs in one blocking step, then uploads
     every texture. That landed in the middle of a turn.
     So model-viewer is not allowed to draw this model until:
       1. its shaders are compiled with three.js compileAsync, which uses the
          browser's background compile (KHR_parallel_shader_compile) where it
          exists, so the GPU is not blocked while the logo turns,
       2. its textures are uploaded, one per frame (small enough to hide), and
       3. the loading screen has faded out.
     Then the first draw is cheap, and it happens after the logo has gone.
     "newo-model-ready" on the element marks step 2. Since 3 Nov 2026 the
     model only starts after the loader has gone (armModel), so step 3 is
     already true; the first real draw calls showModel(), which fades it in.
     This reaches into model-viewer's internals (its renderer, found by symbol
     name). If a model-viewer update moves them, it does nothing and the model
     draws the old way, with model-visibility standing in for the ready event. */
  function gateFirstDraw(mvEl){
    if(!mvEl || gateFirstDraw.done) return;
    gateFirstDraw.done = true;
    function ready(){ try { mvEl.dispatchEvent(new CustomEvent("newo-model-ready")); } catch(e){} }
    function fallback(){
      try { console.warn("gateFirstDraw: model-viewer internals not found, the first draw is not gated (model-visibility stands in)"); } catch(e){}
      mvEl.addEventListener("model-visibility", function(e){ if(e.detail && e.detail.visible){ ready(); showModel(); } });
    }
    function sym(o, name){
      for(var p = o; p; p = Object.getPrototypeOf(p)){
        var list = Object.getOwnPropertySymbols(p);
        for(var i = 0; i < list.length; i++) if(list[i].description === name) return list[i];
      }
      return null;
    }
    var R, scene, three;
    try {
      R = mvEl[sym(mvEl, "renderer")];
      scene = mvEl[sym(mvEl, "scene")];
      three = R && R.threeRenderer;
    } catch(e){}
    if(!R || !scene || !three || typeof R.shouldRender !== "function" ||
       typeof three.compileAsync !== "function" || typeof three.initTexture !== "function"){
      return fallback();
    }

    var state = 0;           // 0 waiting for the model, 1 preparing, 2 prepared
    var goneAt = 0;          // when the loading screen was first seen gone
    function loaderGone(){
      var b = document.body.classList;
      if(!b.contains("ready") || b.contains("ld-pinned")){ goneAt = 0; return false; }
      if(!goneAt) goneAt = performance.now();
      return performance.now() - goneAt > 700;   // its fade is 650ms
    }
    /* Any exception in prepare (a three.js or model-viewer internal rename)
       used to leave state at 1 for good: shouldRender kept returning false,
       the nudge loop polled forever and the model never drew, silently. Now
       it marks the model prepared and lets it draw the old way. */
    function prepare(){
      try { prepareInner(); }
      catch(e){
        try { console.warn("gateFirstDraw: prepare failed, model draws ungated:", e); } catch(e2){}
        state = 2; ready();
      }
    }
    function prepareInner(){
      if(state !== 0 || !mvEl.loaded) return;
      state = 1;
      var tm = three.toneMapping, getRT = three.getRenderTarget;
      var p, jobs = [];
      try {
        // the same tone mapping model-viewer renders with, so the programs match
        three.toneMapping = scene.toneMapping;
        jobs.push(three.compileAsync(scene, scene.camera));
        /* The frosted glass (transmission) draws the scene a second time into
           an offscreen target, in linear colour with no tone mapping, and the
           glass's back face on its own. Those are different shader programs,
           and were the bulk of the first-draw stall. three.js picks the
           program from getRenderTarget(), so for this compile it is told a
           target is bound (nothing is actually bound or drawn). */
        var backs = [];
        scene.traverse(function(o){
          var m = o.material;
          if(m && !Array.isArray(m) && m.transmission > 0 && m.side === 2) backs.push(m);
        });
        if(backs.length){
          three.getRenderTarget = function(){ return { isXRRenderTarget: false, texture: {} }; };
          jobs.push(three.compileAsync(scene, scene.camera));
          backs.forEach(function(m){ m.side = 1; m.needsUpdate = true; });
          jobs.push(three.compileAsync(scene, scene.camera));
          backs.forEach(function(m){ m.side = 2; m.needsUpdate = true; });
        }
      } catch(e){}
      three.getRenderTarget = getRT;
      three.toneMapping = tm;
      p = Promise.all(jobs);
      /* No background compile in this browser (no KHR_parallel_shader_compile):
         the link would block at the first draw, after the loader, maybe
         mid-scroll. Force it now instead, while the logo rests (quiet window). */
      var gl = null, parallel = false;
      try { gl = three.getContext(); parallel = !!gl.getExtension("KHR_parallel_shader_compile"); } catch(e){}
      if(!parallel && gl){
        p = p.catch(function(){}).then(function(){
          return new Promise(function(res){
            function link(done){
              try {
                (three.info.programs || []).forEach(function(pr){
                  if(pr && pr.program) gl.getProgramParameter(pr.program, gl.LINK_STATUS);
                });
              } catch(e){}
              res();
              if(window.NEWO_LOADER) window.NEWO_LOADER.whenSmooth(done, 0, 400); else done();
            }
            if(window.NEWO_LOADER) window.NEWO_LOADER.quiet(link); else link(function(){});
          });
        });
      }
      p.catch(function(){}).then(function(){
        var tex = [], seen = new Set();
        try {
          scene.traverse(function(o){
            var mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
            mats.forEach(function(m){
              for(var k in m){
                var v = m[k];
                if(v && v.isTexture && !seen.has(v)){ seen.add(v); tex.push(v); }
              }
            });
          });
        } catch(e){ try { console.warn("gateFirstDraw: texture walk failed:", e); } catch(e2){} tex = []; }
        (function upload(){
          if(tex.length){
            try { three.initTexture(tex.shift()); } catch(e){}
            return requestAnimationFrame(upload);
          }
          state = 2;
          ready();
          try { scene.queueRender(); } catch(e){}
        })();
      });
    }
    var shouldRender = R.shouldRender;
    R.shouldRender = function(s){
      if(s === scene){
        if(state === 0) prepare();
        if(state !== 2 || !loaderGone()) return false;
        var go = shouldRender.apply(this, arguments);
        if(go) showModel();      // its first real frame is drawn now: fade it in
        return go;
      }
      return shouldRender.apply(this, arguments);
    };
    mvEl.addEventListener("load", prepare);
    // nothing asks for a frame once the loader has gone, so nudge one.
    // Capped at 30 s: past that the gate opens whatever state it is in.
    var nudgeT0 = performance.now();
    (function nudge(){
      if(state === 2 && loaderGone()){ try { scene.queueRender(); } catch(e){} return; }
      if(performance.now() - nudgeT0 > 30000){
        try { console.warn("gateFirstDraw: gave up waiting (state " + state + "), model draws ungated"); } catch(e){}
        state = 2; ready();
        try { scene.queueRender(); } catch(e){}
        return;
      }
      setTimeout(nudge, 100);
    })();
  }

  (function armModel(){
    if(!loadModel) return;
    /* NO WEBGL (score round 1, 3D item 4): asked once, before anything is
       fetched. Without a context the model can never draw, and the loader used
       to hold its full 9 s for it. Now the viewer row collapses at once
       (viewerFailed fires "error", which releases holdLoader's wait). */
    var hasGL = false;
    try {
      var cv = document.createElement("canvas");
      hasGL = !!(window.WebGLRenderingContext && (cv.getContext("webgl2") || cv.getContext("webgl") || cv.getContext("experimental-webgl")));
    } catch(e){}
    if(!hasGL){ viewerFailed("no WebGL in this browser"); return; }
    var box = document.querySelector(".cad-stage"), fired = false;
    function go(){
      if(fired) return; fired = true;
      /* let it paint for as long as it takes to build, then hand the element
         back to the observer. It is transparent and 1700px down the page, so
         nothing is visible either way - this is only about model-viewer being
         willing to do the work. */
      var mvEl = document.getElementById("mv"), released = false;
      function release(){ if(released || !modelGate) return; released = true; modelGate.release(); }
      if(modelGate) modelGate.hold();
      if(mvEl){
        mvEl.addEventListener("load", release, { once: true });
        mvEl.addEventListener("error", release, { once: true });
        /* GLB 404 or decode failure (model-viewer's "error", detail.type
           "loadfailure"); a context loss AFTER a successful load is left alone. */
        mvEl.addEventListener("error", function(e){
          var t = e && e.detail && e.detail.type;
          if(mvEl.loaded && t !== "loadfailure") return;
          viewerFailed(t ? "model-viewer error: " + t : "model-viewer error");
        });
        /* No "load" by the time the loading screen has gone AND the library
           has defined <model-viewer>, plus 3 s of silence: WebGL never came
           up, the GLB never answered, anything that fails without an "error"
           event. A slow but moving download keeps pushing the deadline (each
           "progress" event restarts the 3 s), so a phone on a weak connection
           keeps its model.
           2026-11-03 (score round 2, 3D item 1): the 3 s used to start at the
           reveal even while model-viewer.min.js (290 KB gzipped) was still
           downloading, and the library sends no "progress" while it is only a
           script, so at 400 kbps the viewer was hidden for good at 13.7 s. The
           grace now starts only once customElements has "model-viewer". A
           library that fails outright fires its <script> error (viewerFailed
           there); one that never arrives at all is given up on 120 s in. The
           same 120 s cap covers a GLB that never answers (it used to collapse
           at about 15 s; a slow phone keeping its model was judged worth more). */
        /* 8 s, not 3: the GLB is already here, so the wait is the Draco
           decoder and the decode itself: about 5.5 s in a 400 kbps, CPU x4
           test (3 Nov 2026), so 3 s hid a model that was about to show. A broken model still fires "error" at once. */
        var lastProgress = 0, GRACE = 8000;
        mvEl.addEventListener("progress", function(){ lastProgress = performance.now(); });
        /* ...and the GLB itself has finished downloading (its resource timing
           entry exists). Measured at 400 kbps with CPU x4: model-viewer sent no
           "progress" while the 790 KB GLB came down, so the 3 s ran out mid
           download and the model, which did load 3 s later, stayed hidden.
           A GLB 404 or a decode failure fires "error" (handled above). */
        var glbDone = false;
        function glbHref(){ try { var u = mvEl.getAttribute("src"); return u ? new URL(u, location.href).href : ""; } catch(e){ return ""; } }
        try {
          /* an observer as well as the buffer: the buffer stops recording at
             250 entries, an observer does not */
          new PerformanceObserver(function(list){
            var h = glbHref();
            list.getEntries().forEach(function(en){ if(h && en.name === h) glbDone = true; });
            lastProgress = performance.now();   // any download finishing (the Draco decoder after the GLB) is progress
          }).observe({ type: "resource", buffered: true });
        } catch(e){ glbDone = true; }   // no observer: do not wait on it
        function glbArrived(){
          if(glbDone) return true;
          var h = glbHref();
          if(!h) return false;
          try { if(performance.getEntriesByName(h).length) glbDone = true; } catch(e){ glbDone = true; }
          return glbDone;
        }
        (function watchReveal(waited){
          if(mvEl.loaded || viewerFailedOnce) return;
          var b = document.body.classList;
          if(!b.contains("ready") || b.contains("ld-pinned")){
            if(waited < 60000) setTimeout(function(){ watchReveal(waited + 300); }, 300);
            return;
          }
          if(!(window.customElements && customElements.get("model-viewer")) || !glbArrived()){
            if(waited < 120000) setTimeout(function(){ watchReveal(waited + 300); }, 300);
            else viewerFailed("model not loaded 120 s in (library or GLB still downloading)");
            return;
          }
          lastProgress = Math.max(lastProgress, performance.now());
          (function grace(){
            if(mvEl.loaded || viewerFailedOnce) return;
            var quiet = performance.now() - lastProgress;
            if(quiet < GRACE){ setTimeout(grace, GRACE - quiet + 50); return; }
            viewerFailed("model not loaded " + GRACE / 1000 + " s after the GLB arrived");
          })();
        })(0);
      }
      setTimeout(release, 20000);   // never leave the hold stuck on
      loadModel();
    }
    /* (arm(), the idle / scroll-approach deferral, was removed 3 Nov 2026:
       it had not been called since 2026-10-05, when the loader started
       waiting for the model, see "MODEL LOAD".) */
    /* 2026-10-26: the model is fetched, decoded and its shaders compiled
       under the loading screen, but it is not DRAWN until the loader has gone
       (gateFirstDraw). While the page loads, the logo is the only thing the GPU
       draws. (The old .mv-warm pin, which forced a first draw behind the
       loader, is gone: that draw was what stalled the logo's turn.) */
    if(window.customElements && customElements.whenDefined){
      customElements.whenDefined("model-viewer").then(function(){
        gateFirstDraw(document.getElementById("mv"));
      });
    }
    /* AFTER THE REVEAL (Owen, 3 Nov 2026): the loader no longer waits for the
       model, and the model's start (about a second of library compile and
       Draco decode on the main thread, more on a phone) must never land in
       the loader's fade. So: the loader released (body.ready, not pinned),
       its 650 ms fade over (+100 ms), then the first idle moment (at most
       1 s more). The files are already in the HTTP cache (prefetched by
       holdLoader under the loader). */
    (function afterReveal(){
      var b = document.body.classList;
      if(!b.contains("ready") || b.contains("ld-pinned")){ setTimeout(afterReveal, 50); return; }
      setTimeout(function(){
        if(window.requestIdleCallback) requestIdleCallback(go, { timeout: 1000 });
        else setTimeout(go, 50);
      }, 750);
    })();
  })();
})();
