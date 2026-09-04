/* ============================================================
   SHARED TOP-RIGHT MENU
   A single dropdown panel that lives in the top-right corner on every page.
   Projects are grouped into collapsible CATEGORIES (Lighting, Seating, Audio,
   ...), then plain Materials / About / Contact links beneath.

   HOW A PROJECT FINDS ITS CATEGORY
   It reads the letter prefix off the project's own `code` field in
   js/projects-data.js - KART is "L01.1", so it lands under Lighting; OMNI is
   "AU01.1", so it lands under Audio. There is deliberately NO second list of
   "which project goes where" to keep in sync: set the code correctly and the
   menu sorts itself. Add a project, it appears under the right heading with
   nothing else to edit.

   TO ADD A PROJECT   add its key to PROJECT_ORDER below (and to PROJECTS in
                      js/projects-data.js). Order within a category follows
                      PROJECT_ORDER, so keep that list most-recent-first.
   TO ADD A CATEGORY  add a row to CATEGORIES below. The key is the letter
                      prefix used in `code`, the value is the word shown in the
                      menu. Keep the words single, plain, and lowercase-looking
                      (the CSS uppercases them) - "Lighting", not "Lighting &
                      Lamps". Order in this object IS the order in the menu.
   A category with no projects in it never renders, so listing a category you
   have not designed for yet is harmless.

   OPEN/CLOSED BEHAVIOUR
   Categories start collapsed, except the one holding the project you are
   currently looking at - so a project page opens with its siblings already
   visible, and the home/about/contact pages get a short, calm menu. If there
   is only one category in total, it starts open (a lone collapsed dropdown is
   just a button that hides the whole site).

   Requires js/projects-data.js to be loaded first (for PROJECTS). If it is not
   present, the panel still wires up with just the Materials/About/Contact links
   so the menu never ends up empty.
   Toggled by #burger (and the footer .foot-burger on project pages).
   ============================================================ */
(function(){

  // Letter prefix of the `code` field -> the word shown in the menu.
  // Order here is the order they appear. See js/projects-data.js for what each
  // letter means (that file is the source of truth for the numbering scheme).
  var CATEGORIES = {
    "L":  "Lighting",
    "S":  "Seating",
    "AU": "Audio",
    "H":  "Appliances",
    "A":  "Accessories",
    "J":  "Jewelry",
    "X":  "Other"
  };
  var UNCATEGORIZED = "Other";   // where a project with a missing/odd code goes

  // every project, most recent first. This sets the order WITHIN each category.
  var PROJECT_ORDER = ["kart", "amsalp", "omni", "naf", "neb"];

  function esc(s){ return (s == null ? "" : String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  /* ============================================================
     WARMING THE NEXT PAGE  (window.NEWO_WARM)
     ------------------------------------------------------------
     Lives here because menu.js is the one script every page loads, so the
     version numbers below exist in exactly one place. index.html's dock uses
     it too - see warmProject() there.

     TWO TIERS, AND THE ORDER IS THE POINT.

     TIER 1, on contact: everything the next page's LOADING SCREEN needs before
     it can show anything - the stylesheet, the shared scripts, the loader's own
     three.js/STL chain, and then the document itself. In practice most of that
     is already in cache (index and project.html run the same loading screen, so
     whichever page you are on already fetched it) and a warmed URL that is
     already cached costs nothing. It is listed anyway so the loader is always
     first in the queue rather than last, including from the pages that do not
     run one - about, contact, materials, 404.

     TIER 2, only after the pointer has stayed put for DWELL_MS: the heavy
     per-project payload, which on KART is a 772KB GLB plus the ~700KB
     model-viewer library. Deliberately NOT started on contact. Sweeping across
     the dock hits four cards in half a second and each one would otherwise
     queue a megabyte; worse, a click at 100ms would leave that megabyte
     downloading against the page it is trying to open, which is exactly the
     stutter this is supposed to prevent. Dwelling is the real intent signal, so
     tier 2 waits for it and is cancelled outright if the pointer leaves first.

     rel=prefetch (never preload) throughout: it is the lowest priority the
     browser has, so none of this can compete with what the current page is
     still doing. Everything is deduped for the life of the page.

     KEEP THESE ?v= NUMBERS IN STEP with the <script>/<link> tags in the HTML
     pages. A stale one warms a URL the next page never asks for, which is
     worse than not warming at all.
     ============================================================ */
  var NEWO_WARM = (function(){
    var seen = {};
    function link(href){
      if(!href || seen[href]) return; seen[href] = 1;
      var l = document.createElement("link");
      l.rel = "prefetch"; l.href = href;
      document.head.appendChild(l);
    }
    // ordered: stylesheet, shared scripts, then the loading animation's own
    // chain. loader3d.worker.js and loader3d-core.js are fetched by the worker
    // rather than by a script tag, but a prefetch lands in the same HTTP cache
    // the worker reads from.
    var SHELL = [
      "css/style.css?v=50",
      "js/main.js?v=3",
      "js/materials-data.js?v=3",
      "js/loader3d.js?v=12",
      "js/loader3d-core.js?v=1",
      "js/loader3d.worker.js?v=3",
      "logo/3d-logo.stl"
    ];
    var MV_LIB  = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4/dist/model-viewer.min.js";
    var MODEL_V = "?v=2";      // must match the model-viewer data-src in project.html
    var MECH_V  = "?v=19";     // must match the mechanism iframe src in project.html
    var DWELL_MS = 400;

    function shell(){ SHELL.forEach(link); }

    function heavy(key, p){
      if(!p) return;
      if(p.mechanism && /\.html?$/i.test(p.mechanism)) link("projects/"+key+"/"+p.mechanism+MECH_V);
      var glb = p.modelRender || p.model;
      if(glb){ link("projects/"+key+"/"+glb+MODEL_V); link(MV_LIB); }
    }

    /* el is the thing being hovered, so tier 2 can be called off the moment the
       pointer leaves it. Safe to call repeatedly - link() dedupes and the
       timer is per call, so a re-entered card just schedules another tier 2
       that finds everything already warmed. */
    function project(el, key){
      shell();
      link("project.html?p=" + encodeURIComponent(key));
      var P = projects(), p = P[key];
      if(!p || !el) return;
      var t = setTimeout(function(){ heavy(key, p); }, DWELL_MS);
      function cancel(){
        clearTimeout(t);
        el.removeEventListener("pointerleave", cancel);
        el.removeEventListener("blur", cancel);
      }
      el.addEventListener("pointerleave", cancel);
      el.addEventListener("blur", cancel);
    }

    // a plain page (materials / about / contact): shell, then the document
    function page(href){ shell(); link(href); }

    return { shell: shell, project: project, page: page };
  })();
  window.NEWO_WARM = NEWO_WARM;

  function projects(){ return (typeof PROJECTS !== "undefined") ? PROJECTS : {}; }

  /* Same reason as the guard at the top of project.html: a bare P[key] test
     also matches inherited Object.prototype keys, so ?p=__proto__ would pick a
     category off Object.prototype. Harmless here, but keep the two consistent
     so neither drifts back to the unsafe form. */
  function known(P, key){ return !!key && Object.prototype.hasOwnProperty.call(P, key); }

  /* Pull the category label off a project's code. Codes look like "L01.1" or
     "AU01.1", so the prefix is the leading run of letters. Two-letter prefixes
     (AU) must be tested before one-letter ones (A) or "AU01.1" would match
     Accessories, hence the explicit length check rather than a loop over the
     CATEGORIES keys in object order. */
  function categoryOf(p){
    var code = (p && typeof p.code === "string") ? p.code.trim() : "";
    var m = code.match(/^([A-Za-z]+)/);
    if(!m) return UNCATEGORIZED;
    var prefix = m[1].toUpperCase();
    if(CATEGORIES[prefix]) return CATEGORIES[prefix];
    // a longer prefix than we know about: fall back to its first letter
    if(prefix.length > 1 && CATEGORIES[prefix.charAt(0)]) return CATEGORIES[prefix.charAt(0)];
    return UNCATEGORIZED;
  }

  /* Group PROJECT_ORDER into { label: [keys] }, keeping CATEGORIES order for
     the groups and PROJECT_ORDER order inside each one. */
  function grouped(){
    var P = projects(), buckets = {}, labels = [];
    PROJECT_ORDER.forEach(function(key){
      var p = P[key];
      if(!p) return;
      var label = categoryOf(p);
      if(!buckets[label]){ buckets[label] = []; }
      buckets[label].push(key);
    });
    // declared order first, then anything unexpected, then Other last
    Object.keys(CATEGORIES).forEach(function(prefix){
      var label = CATEGORIES[prefix];
      if(buckets[label] && labels.indexOf(label) === -1) labels.push(label);
    });
    Object.keys(buckets).forEach(function(label){
      if(labels.indexOf(label) === -1) labels.push(label);
    });
    return { labels: labels, buckets: buckets };
  }

  function currentKey(){
    try { return new URLSearchParams(location.search).get("p") || ""; }
    catch(e){ return ""; }
  }

  function build(overlay){
    var g = grouped();
    var P = projects();
    var here = currentKey();
    var openLabel = "";
    if(known(P, here)) openLabel = categoryOf(P[here]);
    if(!openLabel && g.labels.length === 1) openLabel = g.labels[0];

    var html = '<nav class="menu-nav">';

    g.labels.forEach(function(label, i){
      var keys = g.buckets[label];
      var id = "menu-cat-" + i;
      var isOpen = (label === openLabel);
      var items = keys.map(function(key){
        var p = P[key];
        var isHere = (key === here);
        return '<a href="project.html?p=' + encodeURIComponent(key) + '"' +
               (isHere ? ' class="is-here" aria-current="page"' : '') + '>' +
               esc(p.title || key.toUpperCase()) + '</a>';
      }).join("");

      html +=
        '<div class="menu-cat' + (isOpen ? ' open' : '') + '">' +
          '<button type="button" class="menu-head" aria-expanded="' + (isOpen ? 'true' : 'false') + '" aria-controls="' + id + '">' +
            '<span class="menu-head-label">' + esc(label) + '</span>' +
            '<span class="menu-head-mark" aria-hidden="true"></span>' +
          '</button>' +
          '<div class="menu-cat-wrap" id="' + id + '">' +
            '<div class="menu-cat-list">' + items + '</div>' +
          '</div>' +
        '</div>';
    });

    html +=
        '<div class="menu-links">' +
          '<a href="materials.html">Materials</a>' +
          '<a href="about.html">About</a>' +
          '<a href="contact.html">Contact</a>' +
        '</div>' +
      '</nav>';

    overlay.className = "menu-panel";
    overlay.setAttribute("role", "navigation");
    overlay.setAttribute("aria-label", "Main menu");
    overlay.innerHTML = html;
  }

  function init(){
    var overlay = document.getElementById("menu-overlay");
    if(!overlay) return;
    build(overlay);

    /* hover-to-warm on the menu's own links, through the shared NEWO_WARM
       above: the loading screen's chain first, then the page, then (only if the
       pointer settles) that project's model and mechanism. Materials / About /
       Contact get the shell and their document; they have no loading screen and
       no heavy assets, so there is no tier 2 for them.
       Delegated on pointerover rather than bound per link because the panel is
       rebuilt from data and the footer burger can open it on project pages. */
    overlay.addEventListener("pointerover", function(e){
      var a = e.target.closest && e.target.closest("a[href]");
      if(!a) return;
      var href = a.getAttribute("href") || "";
      var m = href.match(/^project\.html\?p=([^&]+)/);
      if(m){ NEWO_WARM.project(a, decodeURIComponent(m[1])); }
      else if(/^(materials|about|contact)\.html/.test(href)){ NEWO_WARM.page(href); }
    });

    // category dropdowns. Handled here rather than with a checkbox/details
    // hack so the panel keeps its own markup and the arrow state stays in one
    // place. Clicking an already-open category closes it; several can be open
    // at once (no accordion), since the panel is short and forcing one open at
    // a time makes comparing two categories annoying.
    overlay.addEventListener("click", function(e){
      var head = e.target.closest && e.target.closest(".menu-head");
      if(!head) return;
      e.preventDefault();
      e.stopPropagation();                 // don't let the outside-click handler see this
      var cat = head.parentNode;
      var open = !cat.classList.contains("open");
      cat.classList.toggle("open", open);
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });

    function setMenu(open){
      overlay.classList.toggle("open", open);
      var b = document.getElementById("burger");
      if(b) b.setAttribute("aria-expanded", open ? "true" : "false");
    }

    // one delegated click listener handles the header burger, the footer
    // burger (added dynamically on project pages), link clicks, and clicks
    // outside the panel.
    document.addEventListener("click", function(e){
      var toggle = e.target.closest("#burger, .foot-burger");
      if(toggle){ e.preventDefault(); setMenu(!overlay.classList.contains("open")); return; }
      if(!overlay.classList.contains("open")) return;
      if(e.target.closest(".menu-head")) return;                           // category toggle, panel stays open
      if(e.target.closest("#menu-overlay a")){ setMenu(false); return; }   // followed a link
      if(!e.target.closest("#menu-overlay")) setMenu(false);               // clicked outside
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape") setMenu(false);
    });

    var b = document.getElementById("burger");
    if(b) b.setAttribute("aria-expanded", "false");
  }

  if(document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
