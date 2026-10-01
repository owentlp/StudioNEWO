/* Shared renderer for jewelry.html and photography.html.
   Reads JEWELRY or PHOTO_SERIES (see js/jewelry-data.js / js/photos-data.js),
   packs photos into columns by aspect ratio (the same idea as the project
   galleries: CSS multi-column balances badly), and opens a simple viewer with
   prev / next / arrow keys / Escape. Empty data shows the "soon" line. */
(function(){
  var root = document.getElementById("gp");
  if(!root) return;
  var mode = root.getAttribute("data-mode");
  function esc(s){ return (s == null ? "" : String(s)).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  var groups = [];
  if(mode === "jewelry" && typeof JEWELRY !== "undefined"){
    groups = [{ title:"", items: JEWELRY.map(function(p){
      return { src:"jewelry/" + (p.photos || [])[0], all:(p.photos || []).map(function(f){ return "jewelry/" + f; }),
               cap:p.title, meta:[p.material, p.year].filter(Boolean).join(" / "), note:p.note, alt:p.alt || p.title, w:p.w || 4, h:p.h || 5 };
    }).filter(function(x){ return x.all.length; }) }];
  } else if(mode === "photo" && typeof PHOTO_SERIES !== "undefined"){
    groups = PHOTO_SERIES.map(function(s){
      return { title:s.title, note:s.note, items:(s.photos || []).map(function(p){
        var src = "photography/" + s.slug + "/" + p.src;
        return { src:src, all:[src], cap:p.cap, meta:p.meta, alt:p.alt || p.cap || s.title, w:p.w || 3, h:p.h || 2 };
      }) };
    });
  }
  groups = groups.filter(function(g){ return g.items.length; });
  if(!groups.length){ root.innerHTML = '<p class="desc">New work going up soon.</p>'; return; }

  var flat = [];
  function cols(){ return innerWidth < 600 ? 1 : innerWidth < 1000 ? 2 : 3; }
  function render(){
    flat = [];
    var n = cols();
    root.innerHTML = groups.map(function(g){
      var c = []; var hgt = [];
      for(var i=0;i<n;i++){ c.push(""); hgt.push(0); }
      g.items.forEach(function(it){
        var k = hgt.indexOf(Math.min.apply(null, hgt));
        it.all.forEach(function(s){ flat.push({ src:s, alt:it.alt }); });
        var idx = flat.length - it.all.length;
        c[k] += '<figure class="gp-fig"><button type="button" class="gp-open" data-i="' + idx + '"><img loading="lazy" decoding="async" src="' + esc(it.src) + '" alt="' + esc(it.alt) + '" width="' + it.w + '" height="' + it.h + '"></button>' +
                '<figcaption>' + (it.cap ? '<span class="gp-cap">' + esc(it.cap) + '</span>' : '') + (it.meta ? '<span class="gp-meta">' + esc(it.meta) + '</span>' : '') + (it.note ? '<span class="gp-note">' + esc(it.note) + '</span>' : '') + '</figcaption></figure>';
        hgt[k] += it.h / it.w;
      });
      return '<section class="gp-group">' + (g.title ? '<h2 class="gp-title">' + esc(g.title) + '</h2>' : '') + (g.note ? '<p class="desc gp-gnote">' + esc(g.note) + '</p>' : '') +
             '<div class="gp-cols">' + c.map(function(x){ return '<div class="gp-col">' + x + '</div>'; }).join("") + '</div></section>';
    }).join("");
  }
  render();
  var lastN = cols();
  addEventListener("resize", function(){ if(cols() !== lastN){ lastN = cols(); render(); } });

  var lb = document.createElement("div");
  lb.className = "lightbox"; lb.setAttribute("role","dialog"); lb.setAttribute("aria-modal","true");
  lb.innerHTML = '<img alt=""><button class="lb-close" type="button">Close</button><button class="lb-prev" type="button" aria-label="Previous">&larr;</button><button class="lb-next" type="button" aria-label="Next">&rarr;</button><span class="lb-count"></span>';
  document.body.appendChild(lb);
  var img = lb.querySelector("img"), cur = 0;
  function show(i){
    cur = (i + flat.length) % flat.length;
    lb.classList.remove("imgshow");
    img.onload = function(){ lb.classList.add("imgshow"); };
    img.src = flat[cur].src; img.alt = flat[cur].alt || "";
    lb.querySelector(".lb-count").textContent = (cur + 1) + " / " + flat.length;
  }
  function open(i){ lb.classList.add("open"); requestAnimationFrame(function(){ lb.classList.add("show"); }); document.documentElement.style.overflow = "hidden"; show(i); }
  function close(){ lb.classList.remove("show","open","imgshow"); document.documentElement.style.overflow = ""; }
  root.addEventListener("click", function(e){ var b = e.target.closest(".gp-open"); if(b) open(+b.getAttribute("data-i")); });
  lb.addEventListener("click", function(e){
    if(e.target.closest(".lb-prev")) show(cur - 1);
    else if(e.target.closest(".lb-next")) show(cur + 1);
    else if(e.target === lb || e.target.closest(".lb-close")) close();
  });
  document.addEventListener("keydown", function(e){
    if(!lb.classList.contains("open")) return;
    if(e.key === "Escape") close(); else if(e.key === "ArrowLeft") show(cur - 1); else if(e.key === "ArrowRight") show(cur + 1);
  });
})();
