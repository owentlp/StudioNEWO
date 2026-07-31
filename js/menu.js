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

  function projects(){ return (typeof PROJECTS !== "undefined") ? PROJECTS : {}; }

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
    if(here && P[here]) openLabel = categoryOf(P[here]);
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

    // hover-to-prefetch: warm a project page's document + stylesheet the moment
    // the pointer lands on its menu link, so the click feels instant. Deduped,
    // and prefetch (not preload) so it never competes with the current page.
    var pf = {};
    function prefetch(href){
      if(!href || pf[href]) return; pf[href] = 1;
      var l = document.createElement("link"); l.rel = "prefetch"; l.href = href;
      document.head.appendChild(l);
    }
    overlay.addEventListener("mouseover", function(e){
      var a = e.target.closest && e.target.closest('a[href^="project.html"]');
      if(a){ prefetch(a.getAttribute("href")); prefetch("css/style.css?v=37"); }
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
