/* ============================================================
   HOME PAGE SKY (2026-10-01)
   Replaces the background videos with a sky drawn for the visitor's own
   local time and current weather.

   HOW IT WORKS
   1. Location: approximate, from the browser's time zone (no permission
      prompt, nothing stored). Unknown zone -> longitude from the UTC offset.
   2. Sun: standard solar position maths -> elevation + azimuth, every minute.
   3. Weather: one request to Open-Meteo (free, no key) for cloud cover and
      weather code at those approximate coordinates, cached for 20 min.
      If it fails, the sky is simply clear.
   4. Drawing: a small canvas (the gradient is smooth, so it is drawn at low
      resolution and scaled up by CSS). MINIMAL SINCE 2026-10-05 (Owen: no
      sun): no sun or moon discs, no glow spot. Time of day is the colour of
      the sky alone, with a low band of warmth along the horizon at dawn and
      dusk and a few faint, still stars at night. Weather is the procedural
      cloud layer (drifts with a compositor-only transform), the grey of the
      sky, and rain / snow layers.
   5. body[data-sky="dark"] is set when the sky is dark, so the header marks
      and the loading mark switch to paper colour (css/style.css, index.html).
   6. The same sky sits under the loading mark on the project pages (inside
      #loader there). It goes away with the loader; once the loader is gone
      the layers are hidden and the timers stop.

   PREVIEW ANY STATE (URL parameters):
     ?t=18:40            local time to show
     &wx=clear|partly|cloudy|overcast|rain|snow|fog|storm
     &lat=43.67&lon=-79.40
   e.g. studionewo.com/?t=20:10&wx=partly
   ============================================================ */
(function(){
  "use strict";
  var Q = new URLSearchParams(location.search);
  if(Q.get("bg") === "video") return;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cv = document.getElementById("sky"); if(!cv) return;
  var ctx = cv.getContext("2d");
  var clouds = document.getElementById("sky-clouds");
  var precip = document.getElementById("sky-precip");

  /* ---------- location ---------- */
  var TZ = {
    "America/Toronto":[43.65,-79.38],"America/Montreal":[45.5,-73.57],"America/Vancouver":[49.28,-123.12],
    "America/Edmonton":[53.55,-113.49],"America/Winnipeg":[49.9,-97.14],"America/Halifax":[44.65,-63.57],
    "America/St_Johns":[47.56,-52.71],"America/Regina":[50.45,-104.6],"America/New_York":[40.71,-74.0],
    "America/Chicago":[41.88,-87.63],"America/Denver":[39.74,-104.99],"America/Phoenix":[33.45,-112.07],
    "America/Los_Angeles":[34.05,-118.24],"America/Anchorage":[61.22,-149.9],"Pacific/Honolulu":[21.31,-157.86],
    "America/Mexico_City":[19.43,-99.13],"America/Bogota":[4.71,-74.07],"America/Lima":[-12.05,-77.04],
    "America/Sao_Paulo":[-23.55,-46.63],"America/Argentina/Buenos_Aires":[-34.6,-58.38],"America/Santiago":[-33.45,-70.67],
    "Europe/London":[51.51,-0.13],"Europe/Dublin":[53.35,-6.26],"Europe/Lisbon":[38.72,-9.14],"Europe/Madrid":[40.42,-3.7],
    "Europe/Paris":[48.86,2.35],"Europe/Brussels":[50.85,4.35],"Europe/Amsterdam":[52.37,4.9],"Europe/Berlin":[52.52,13.4],
    "Europe/Zurich":[47.38,8.54],"Europe/Rome":[41.9,12.5],"Europe/Vienna":[48.21,16.37],"Europe/Prague":[50.08,14.44],
    "Europe/Copenhagen":[55.68,12.57],"Europe/Stockholm":[59.33,18.07],"Europe/Oslo":[59.91,10.75],"Europe/Helsinki":[60.17,24.94],
    "Europe/Warsaw":[52.23,21.01],"Europe/Athens":[37.98,23.73],"Europe/Istanbul":[41.01,28.98],"Europe/Moscow":[55.76,37.62],
    "Africa/Cairo":[30.04,31.24],"Africa/Lagos":[6.52,3.38],"Africa/Nairobi":[-1.29,36.82],"Africa/Johannesburg":[-26.2,28.05],
    "Asia/Dubai":[25.2,55.27],"Asia/Riyadh":[24.71,46.68],"Asia/Tehran":[35.69,51.39],"Asia/Karachi":[24.86,67.0],
    "Asia/Kolkata":[19.08,72.88],"Asia/Calcutta":[22.57,88.36],"Asia/Dhaka":[23.81,90.41],"Asia/Bangkok":[13.76,100.5],
    "Asia/Singapore":[1.35,103.82],"Asia/Jakarta":[-6.21,106.85],"Asia/Hong_Kong":[22.32,114.17],"Asia/Shanghai":[31.23,121.47],
    "Asia/Taipei":[25.03,121.57],"Asia/Seoul":[37.57,126.98],"Asia/Tokyo":[35.68,139.69],"Asia/Manila":[14.6,120.98],
    "Australia/Perth":[-31.95,115.86],"Australia/Adelaide":[-34.93,138.6],"Australia/Brisbane":[-27.47,153.03],
    "Australia/Sydney":[-33.87,151.21],"Australia/Melbourne":[-37.81,144.96],"Pacific/Auckland":[-36.85,174.76]
  };
  function locate(){
    var lat = parseFloat(Q.get("lat")), lon = parseFloat(Q.get("lon"));
    if(isFinite(lat) && isFinite(lon)) return [lat, lon];
    var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch(e){}
    if(TZ[tz]) return TZ[tz];
    var off = -new Date().getTimezoneOffset() / 60;
    var south = /^(Australia|Antarctica|Pacific\/(Auckland|Fiji)|America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|La_Paz|Lima)|Africa\/(Johannesburg|Maputo|Harare|Windhoek))/.test(tz);
    return [south ? -33 : 43, off * 15];
  }
  var LOC = locate();

  /* ---------- time ---------- */
  function now(){
    var t = Q.get("t");
    var d = new Date();
    if(t && /^\d{1,2}:\d{2}$/.test(t)){ var p = t.split(":"); d.setHours(+p[0], +p[1], 0, 0); }
    return d;
  }

  /* ---------- sun position ---------- */
  var R = Math.PI / 180;
  function sun(date, lat, lon){
    var d = (date.getTime() - 946728000000) / 86400000;
    var g = (357.529 + 0.98560028 * d) * R, q = 280.459 + 0.98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * R, e = (23.439 - 0.00000036 * d) * R;
    var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    return horizon(d, ra, dec, lat, lon);
  }
  function horizon(d, ra, dec, lat, lon){
    var gmst = (280.16 + 360.9856235 * d) * R;
    var H = gmst + lon * R - ra, la = lat * R;
    var alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H));
    var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(la) - Math.tan(dec) * Math.cos(la));
    return { alt: alt / R, az: (az / R + 180 + 360) % 360 };   // az from north, clockwise
  }

  /* ---------- palette by sun elevation: [elevation, zenith, horizon, glow] ---------- */
  /* Muted, closer to a photograph than a screen gradient. glow is only the
     colour of the low dawn / dusk band along the horizon. */
  var KEYS = [
    [-90, "#0a0d16", "#121826", "#000000"],
    [-18, "#0b1020", "#171f36", "#000000"],
    [-12, "#111a32", "#26304f", "#2a2a40"],
    [-7,  "#1c2a52", "#454b70", "#6a5470"],
    [-3,  "#2f4a7a", "#9c8088", "#d8957a"],
    [0,   "#46669a", "#d4a488", "#eeb48c"],
    [4,   "#5a7fb2", "#dcc0a4", "#f0caa6"],
    [10,  "#6890c2", "#d6d8d2", "#f4e2cc"],
    [22,  "#6a96c8", "#ccdae4", "#ffffff"],
    [50,  "#5f8dc4", "#c2d5e6", "#ffffff"],
    [90,  "#5a89c2", "#bed3e6", "#ffffff"]
  ];
  function hex(h){ return [parseInt(h.substr(1,2),16), parseInt(h.substr(3,2),16), parseInt(h.substr(5,2),16)]; }
  var KC = KEYS.map(function(k){ return [k[0], hex(k[1]), hex(k[2]), hex(k[3])]; });
  function mix(a, b, t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
  function palette(el){
    for(var i = 1; i < KC.length; i++){
      if(el <= KC[i][0]){
        var a = KC[i-1], b = KC[i], t = (el - a[0]) / (b[0] - a[0]);
        t = t * t * (3 - 2 * t);
        return { zen: mix(a[1], b[1], t), hor: mix(a[2], b[2], t), glow: mix(a[3], b[3], t) };
      }
    }
    var k = KC[KC.length-1]; return { zen: k[1], hor: k[2], glow: k[3] };
  }
  function lum(c){ return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function grey(c, amt, level){ var l = lum(c) * 255 * level; return mix(c, [l, l, l * 1.02], amt); }
  function css(c, a){ return "rgba(" + (c[0]|0) + "," + (c[1]|0) + "," + (c[2]|0) + "," + (a == null ? 1 : a) + ")"; }

  /* ---------- weather ---------- */
  /* cover + kind are what the weather service says. wet / fog / sn / st are the
     same thing as numbers, so a change of weather can be eased rather than
     snapped (see settle). */
  var WX = { cover: 0, kind: "clear", wet: 0, fog: 0, sn: 0, st: 0 };   // kind: clear | rain | snow | fog | storm
  var FORCED = { clear:[0.02,"clear"], partly:[0.35,"clear"], cloudy:[0.65,"clear"], overcast:[0.95,"clear"],
                 rain:[0.9,"rain"], snow:[0.9,"snow"], fog:[0.8,"fog"], storm:[1,"storm"] };
  function kindFromCode(c){
    if(c == null) return "clear";
    if(c === 45 || c === 48) return "fog";
    if((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return "rain";
    if((c >= 71 && c <= 77) || c === 85 || c === 86) return "snow";
    if(c >= 95) return "storm";
    return "clear";
  }
  function factors(k){
    return { wet: (k === "rain" || k === "storm") ? 1 : (k === "snow" ? 0.6 : 0), fog: k === "fog" ? 1 : 0,
             sn: k === "snow" ? 1 : 0, st: k === "storm" ? 1 : 0 };
  }
  function setNow(cover, kind){
    var f = factors(kind);
    WX.cover = cover; WX.kind = kind; WX.wet = f.wet; WX.fog = f.fog; WX.sn = f.sn; WX.st = f.st;
  }
  /* THE LAST WEATHER SEEN IS KEPT (localStorage) and used for the very first
     paint, so the sky behind the loading mark is already the sky the page ends
     up with. It used to start clear and jump to the real weather when the
     forecast answered. A fresh forecast still replaces it: unchanged = nothing
     to see, changed = eased over about a second, never a jump. */
  var WKEY = "newo-wx-" + LOC[0].toFixed(1) + "," + LOC[1].toFixed(1);
  function stored(){ try { return JSON.parse(localStorage.getItem(WKEY) || "null"); } catch(e){ return null; } }
  var easeT = null;
  function settle(cover, kind, cb){
    if(easeT){ clearInterval(easeT); easeT = null; }
    var a = { cover: WX.cover, wet: WX.wet, fog: WX.fog, sn: WX.sn, st: WX.st }, b = factors(kind);
    b.cover = cover;
    var same = kind === WX.kind && Math.abs(cover - a.cover) < 0.03;
    if(same || !last || document.hidden || RM){ setNow(cover, kind); if(last) draw(); return cb(); }
    WX.kind = kind;
    var t0 = Date.now(), DUR = 1200, N = ["cover", "wet", "fog", "sn", "st"];
    easeT = setInterval(function(){
      var t = Math.min(1, (Date.now() - t0) / DUR), e = t * t * (3 - 2 * t);
      for(var i = 0; i < N.length; i++) WX[N[i]] = a[N[i]] + (b[N[i]] - a[N[i]]) * e;
      draw();
      if(t >= 1){ clearInterval(easeT); easeT = null; cb(); }
    }, 66);
  }
  function getWeather(cb, force){
    var f = Q.get("wx");
    if(f && FORCED[f]){ setNow(FORCED[f][0], FORCED[f][1]); if(last) draw(); return cb(); }
    var c = stored();
    if(!force && c && Date.now() - c.at < 20 * 60000) return settle(c.cover, c.kind, cb);
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + LOC[0].toFixed(2) + "&longitude=" + LOC[1].toFixed(2) +
              "&current=cloud_cover,weather_code&timezone=auto";
    var done = false, timer = setTimeout(function(){ if(!done){ done = true; cb(); } }, 4000);
    fetch(url).then(function(r){ return r.json(); }).then(function(j){
      if(done) return; done = true; clearTimeout(timer);
      var cur = j && j.current || {};
      var cover = Math.max(0, Math.min(1, (cur.cloud_cover || 0) / 100)), kind = kindFromCode(cur.weather_code);
      try { localStorage.setItem(WKEY, JSON.stringify({ at: Date.now(), cover: cover, kind: kind })); } catch(e){}
      settle(cover, kind, cb);
    }).catch(function(){ if(!done){ done = true; clearTimeout(timer); cb(); } });
  }

  /* ---------- stars (fixed field, generated once) ---------- */
  var STARS = [];
  (function(){ var s = 7; function rnd(){ s = (s * 16807) % 2147483647; return s / 2147483647; }
    for(var i = 0; i < 110; i++) STARS.push([rnd(), rnd() * 0.8, rnd() * 0.9 + 0.1, rnd()]); })();

  /* ---------- draw ---------- */
  var W = 0, H = 0, last = null;
  function size(){
    var sc = 0.5;                                   // half resolution: smooth gradients, crisp enough stars
    W = Math.max(320, Math.round(innerWidth * sc)); H = Math.max(240, Math.round(innerHeight * sc));
    cv.width = W; cv.height = H;
  }
  function draw(){
    var date = now(), s = sun(date, LOC[0], LOC[1]);
    var P = palette(s.alt), cov = WX.cover, k = WX.kind;
    var wet = WX.wet, fog = WX.fog;
    // clouds and weather pull the sky toward grey; rain darkens, snow / fog lighten
    var g = Math.min(0.85, cov * 0.7 + wet * 0.2 + fog * 0.5);
    var level = 1 - wet * 0.22 + WX.sn * 0.12 + fog * 0.1 - WX.st * 0.15;
    var zen = grey(P.zen, g, level), hor = grey(P.hor, g * 0.9, level * 1.03);
    // horizon haze line slightly lighter than the horizon colour
    var haze = mix(hor, [255, 250, 240], 0.08 + fog * 0.25);

    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, css(zen));
    grd.addColorStop(0.55, css(mix(zen, hor, 0.55)));
    grd.addColorStop(0.86, css(hor));
    grd.addColorStop(1, css(haze));
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // dawn and dusk: a low band of warmth along the whole horizon. No sun
    // disc and no glow spot; the time of day is told by colour alone.
    var tw = Math.max(0, 1 - Math.abs(s.alt - 1) / 9);
    var clear = (1 - cov) * (1 - wet) * (1 - fog);
    if(tw > 0.01){
      var band = ctx.createLinearGradient(0, H, 0, H * 0.45);
      band.addColorStop(0, css(P.glow, 0.32 * tw * (0.3 + 0.7 * clear)));
      band.addColorStop(1, css(P.glow, 0));
      ctx.fillStyle = band; ctx.fillRect(0, H * 0.45, W, H * 0.55);
    }

    // a few faint stars, still, faded by twilight and by cloud
    var starA = Math.max(0, Math.min(1, (-s.alt - 8) / 8)) * (1 - cov * 0.95) * (1 - wet) * (1 - fog);
    if(starA > 0.02){
      for(var i = 0; i < STARS.length; i++){
        var st = STARS[i];
        ctx.fillStyle = "rgba(255,255,250," + (starA * st[2] * 0.55).toFixed(3) + ")";
        ctx.fillRect(st[0] * W, st[1] * H * 0.75, 0.8, 0.8);
      }
    }

    // header marks: paper on a dark sky, ink on a light one
    var topL = lum(zen), dark = topL < 0.32;
    document.body.setAttribute("data-sky", dark ? "dark" : "light");
    paintClouds(P, zen, hor, cov, k, s.alt, clear);
    last = { s: s, cov: cov, k: k };
  }

  /* ---------- clouds: one procedural texture, tinted per state ---------- */
  var cloudTex = null;
  function noiseTex(w, h){
    // value-noise fBm, tiling horizontally so the drift can loop
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var g = c.getContext("2d"), img = g.createImageData(w, h), D = img.data;
    var seed = 1337; function rnd(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var GS = 64, grid = []; for(var i = 0; i < GS * GS; i++) grid.push(rnd());
    function n(x, y, px){ var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      function v(a, b){ a = ((a % px) + px) % px; return grid[(a % GS) + ((b % GS + GS) % GS) * GS]; }   // px: wrap in x so the tile has no seam
      var u = xf * xf * (3 - 2 * xf), w2 = yf * yf * (3 - 2 * yf);
      return (v(xi, yi) * (1 - u) + v(xi + 1, yi) * u) * (1 - w2) + (v(xi, yi + 1) * (1 - u) + v(xi + 1, yi + 1) * u) * w2; }
    for(var y = 0; y < h; y++) for(var x = 0; x < w; x++){
      var fx = x / w * 8, fy = y / h * 4, a = 0, amp = 0.55, f = 1;
      for(var o = 0; o < 5; o++){ a += n(fx * f, fy * f, 8 * f) * amp; f *= 2; amp *= 0.5; }
      D[(y * w + x) * 4 + 3] = Math.max(0, Math.min(255, a * 255));
    }
    g.putImageData(img, 0, 0); return c;
  }
  var cloudKey = "", precipCls = null, LIVE = false;
  function paintClouds(P, zen, hor, cov, k, alt, clear){
    if(!clouds) return;
    /* A clear sky (under 6% cover) still gets a few faint wisps of the same
       cloud texture, as a 20% floor, so a clear noon is not an empty field.
       Real "clear" readings are 0-5% cover, so this stays true to the weather.
       Removed 2026-10-02: a drawn-shapes version (Owen: the noise clouds are
       better). */
    if(cov < 0.06 && k === "clear") cov = 0.2;
    var key = [cov.toFixed(2), k, Math.round(alt / 2), Math.round(clear * 10)].join("|");
    if(key === cloudKey) return; cloudKey = key;
    if(!cloudTex) cloudTex = noiseTex(512, 160);
    var w = 512, h = 160, c = document.createElement("canvas"); c.width = w; c.height = h;
    var g = c.getContext("2d");
    g.drawImage(cloudTex, 0, 0);
    // threshold the noise by cover: low cover = few soft puffs, high = a full deck
    var img = g.getImageData(0, 0, w, h), D = img.data, th = 1 - cov * 0.95, soft = 0.22;
    var day = Math.max(0, Math.min(1, (alt + 6) / 12));
    var skyMid = mix(zen, hor, 0.5);
    var dayLit = mix([250, 248, 244], [212, 214, 220], Math.min(1, cov * 0.9));   // white puffs -> grey deck
    var nightLit = mix(skyMid, [118, 110, 104], 0.35);                           // faint city-lit undersides
    var lit = mix(nightLit, dayLit, day);
    if(alt > -4 && alt < 8) lit = mix(lit, hex("#e8b498"), 0.25 * clear + 0.08);   // warm light at golden hour
    var shade = mix(lit, skyMid, 0.45 + 0.3 * cov);
    var aMul = (0.5 + 0.4 * cov) * (0.5 + 0.5 * day) * (cov > 0.85 ? 0.7 : 1);
    for(var i = 0; i < D.length; i += 4){
      var v = D[i + 3] / 255, a = Math.max(0, Math.min(1, (v - th) / soft));
      var y = ((i / 4) / w | 0) / h;                  // lighter tops, shaded bases
      var col = mix(lit, shade, Math.min(1, y * 0.9 + (1 - v) * 0.6));
      D[i] = col[0]; D[i+1] = col[1]; D[i+2] = col[2]; D[i+3] = a * 255 * aMul;
    }
    g.putImageData(img, 0, 0);
    var url = c.toDataURL("image/png");
    clouds.style.backgroundImage = "url(" + url + ")";
    clouds.style.opacity = 1;
    clouds.classList.toggle("drift", !RM);
    if(precip){
      var pc = (k === "rain" || k === "storm") ? "rain" : (k === "snow" ? "snow" : "");
      if(pc !== precipCls){
        precipCls = pc;
        // .in = fade it in. Only once the page is up: on the first paint it is simply there.
        precip.className = pc + (pc && LIVE && !RM ? " in" : "") + (RM ? " still" : "");
      }
    }
  }

  function tick(){ draw(); }
  size();
  (function(){                                          // first paint = the last weather seen here
    var f = Q.get("wx"), c = stored();
    if(f && FORCED[f]) setNow(FORCED[f][0], FORCED[f][1]);
    else if(c) setNow(c.cover, c.kind);
  })();
  draw();
  /* .live switches on the cloud layer's fade. It is added AFTER the first paint,
     so on load the clouds are just there instead of fading in behind the logo. */
  setTimeout(function(){ LIVE = true; if(clouds) clouds.classList.add("live"); }, 80);
  /* NEWO_SKY.ready resolves when the sky has settled on the real weather (or
     after 1.5s if the forecast is slow). The home page holds its reveal on it. */
  var readyDone, ready = new Promise(function(res){ readyDone = res; });
  setTimeout(readyDone, 1500);
  getWeather(function(){ readyDone(); });
  var rt; addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(function(){ if(cv.style.display !== "none"){ size(); draw(); } }, 200); });
  var TIMERS = [
    setInterval(function(){ if(!document.hidden) draw(); }, 60000),
    setInterval(function(){ if(!document.hidden && !Q.get("wx")) getWeather(tick, true); }, 20 * 60000)
  ];
  /* PROJECT PAGES: the sky lives inside #loader, so the loading screen holds
     the home page background. Once the loader has fully gone (body.ready, and
     loader3d.js has let go of its pin) the layers are hidden and the timers
     stop, so the project page pays nothing for it afterwards. */
  var LD = cv.closest && cv.closest("#loader");
  if(LD){
    var off = setInterval(function(){
      if(!document.body.classList.contains("ready")) return;
      if(getComputedStyle(LD).visibility !== "hidden") return;
      clearInterval(off); TIMERS.forEach(clearInterval);
      [cv, clouds, precip, document.getElementById("sky-grain")].forEach(function(el){ if(el) el.style.display = "none"; });
    }, 500);
  }
  window.NEWO_SKY = { ready: ready, redraw: draw, state: function(){ return { loc: LOC, wx: WX, sun: last && last.s }; } };
})();
