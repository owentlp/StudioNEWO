/* ============================================================
   SHARED TOP-RIGHT MENU
   A single dropdown panel that lives in the top-right corner on every page.
   One "Project" group listing every project (built from the project data),
   then plain Materials / About / Contact links beneath.
   Add a project by adding its key to PROJECT_ORDER (and PROJECTS); the home
   page dock is a separate, shorter list in index.html.
   Requires js/projects-data.js to be loaded first (for PROJECTS). If it is
   not present, the panel still wires up with just the Materials/About/Contact
   links so the menu never ends up empty.
   Toggled by #burger (and the footer .foot-burger on project pages).
   ============================================================ */
(function(){
  // every project, most recent first. NAF and any future project live here
  // even though the home dock only shows a shorter storefront list.
  var PROJECT_ORDER = ["kart", "amsalp", "omni", "naf", "neb"];

  function esc(s){ return (s == null ? "" : String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  function link(key){
    var P = (typeof PROJECTS !== "undefined") ? PROJECTS : {};
    var p = P[key];
    if(!p) return "";
    return '<a href="project.html?p=' + encodeURIComponent(key) + '">' + esc(p.title || key.toUpperCase()) + '</a>';
  }

  function group(label, keys){
    var links = keys.map(link).filter(Boolean).join("");
    if(!links) return "";
    return '<div class="menu-group"><span class="menu-head">' + label + '</span>' + links + '</div>';
  }

  function build(overlay){
    overlay.className = "menu-panel";
    overlay.setAttribute("role", "navigation");
    overlay.setAttribute("aria-label", "Main menu");
    overlay.innerHTML =
      '<nav class="menu-nav">' +
        group("Project", PROJECT_ORDER) +
        '<div class="menu-links">' +
          '<a href="materials.html">Materials</a>' +
          '<a href="about.html">About</a>' +
          '<a href="contact.html">Contact</a>' +
        '</div>' +
      '</nav>';
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
      if(a){ prefetch(a.getAttribute("href")); prefetch("css/style.css?v=25"); }
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
