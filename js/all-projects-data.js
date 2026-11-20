/* ============================================================
   ALL PROJECTS · the one list behind all-projects.html (19 Nov 2026).
   One entry per row of the table, top to bottom in this order.
   The page does not load this file: tools/make-simple-page.py reads it and
   writes the rows into all-projects.html. After editing it, re-run
     python tools/make-simple-page.py     then     python tools/make-sitemap.py

   TWO WAYS TO WRITE AN ENTRY

   1. Something the site already knows. Name it and the facts are read from
      its own data file, so nothing is written twice:
        { from:"kart" }            a product in js/projects-data.js
        { from:"sonic-touch" }     a case study in js/solutions-data.js
      Any field below may be added to replace what was read.

   2. Anything else, written out in full:
        { id:"sooke", name:"SOOKE", kind:"silver ring", year:"2026",
          type:"Jewellery", status:"Made to order",
          photo:"jewelry/sooke.jpg", thumb:"jewelry/sm/sooke.jpg",
          alt:"what the photo shows", href:"jewelry.html" }

   FIELDS
     id       short slug, unique
     name     shown in the name column
     kind     one line saying what it is
     year     "2026"
     type     Product, Case study, Jewellery ... (also the filter words)
     status   a few words
     photo    the picture shown beside the row (about 1200px wide is plenty)
     thumb    the small copy shown in the row on a phone (optional; photo if left out)
     alt      what the photo shows
     href     where the row goes (a page, or a PDF)
     pdf      true when href is a PDF: it opens in a new tab
     go       the red words at the end of the row ("View", "PDF, 1.7 MB")
     video    a YouTube video ID: adds a VIDEO link under the row's own link
     focus    where a photo that is not 4:3 is held when it is cropped
              ("50% 62%" = centre, a little below the middle)
     fit      "contain" shows the whole photo instead of cropping it; then
     bg       is the photo's own background colour, to fill the frame

   Only rows with a real destination and a real photo belong here.
   Left out until they have both (19 Nov 2026): SOOKE, FLIP, Photography.

   STATUS of the three case studies is written here (the Solutions data has
   none). These words came from the mock-up and are not confirmed by Owen.
   ============================================================ */
const ALL_PROJECTS = [
  { from:"kart" },
  { from:"neb" },
  { from:"omni" },
  { from:"halo", focus:"0% 50%" },
  { from:"flow" },
  { from:"sonic-touch",      status:"Prototype, tested", fit:"contain", bg:"#fcfcfa" },
  { from:"loots",            status:"Exhibited 2025",    focus:"50% 62%" },
  { from:"vacancy-to-value", status:"Proposal",          focus:"17% 50%" }
];

/* The list with every `from` filled in. Used by tools/make-simple-page.py
   (it needs PROJECTS, SOLUTIONS and IMG_SIZES loaded first). */
function allProjects(){
  var P = (typeof PROJECTS !== "undefined") ? PROJECTS : {};
  var S = (typeof SOLUTIONS !== "undefined") ? SOLUTIONS : [];
  var Z = (typeof IMG_SIZES !== "undefined") ? IMG_SIZES : {};
  function real(s){ return s && String(s).charAt(0) !== "["; }
  return ALL_PROJECTS.map(function(e){
    var o = {}, k = e.from, p, s, f, d;
    if(k && Object.prototype.hasOwnProperty.call(P, k)){
      p = P[k]; f = (p.gallery && p.gallery[0]) || "hero.jpg"; d = (Z[k] && Z[k][f]) || [0, 0];
      o = { id:k, name:p.title, kind:real(p.kind) ? p.kind : "", year:real(p.date) ? p.date : "", type:"Product",
            status:real(p.status) ? p.status : "", href:k + ".html", go:"View",
            photo:"projects/" + k + "/" + (d[0] > 1200 ? "md/" : "") + f,
            thumb:"projects/" + k + "/" + (d[0] > 600 ? "sm/" : "") + f,
            alt:(p.alt && p.alt[f]) || p.title };
    } else if(k){
      s = S.filter(function(x){ return x.id === k; })[0];
      if(!s) throw new Error("all-projects-data.js: nothing called \"" + k + "\" in projects-data.js or solutions-data.js");
      o = { id:k, name:s.title, kind:s.what, year:s.year, type:"Case study", status:s.type,
            href:"solutions/" + s.pdf, pdf:true, go:"PDF" + (s.pdfMB ? ", " + s.pdfMB + " MB" : ""),
            photo:"solutions/" + s.image, thumb:"solutions/sm/" + s.image, alt:s.alt, video:s.video || "" };
    }
    Object.keys(e).forEach(function(n){ if(n !== "from") o[n] = e[n]; });
    if(!o.thumb) o.thumb = o.photo;
    if(!o.go) o.go = o.pdf ? "PDF" : "View";
    return o;
  });
}
