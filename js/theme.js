/* ============================================================
   THEME: LIGHT BY DAY, DARK ONLY AT NIGHT (Owen, 19 Nov 2026:
   "dark mode should only activate when viewing after dark and if preference
   is set to dark mode. should always be white during working hours.")

   Loaded in the <head> of every page, before css/style.css, so the first
   paint is already the right colour. It always sets html[data-theme] to
   "light" or "dark"; css/style.css and the mechanism frames read that.

   Dark needs BOTH:
   1. the visitor's system is set to dark (prefers-color-scheme), and
   2. it is after dark on the visitor's clock: from civil dusk to civil dawn
      (sun 6 degrees below the horizon), worked out for the date at Toronto's
      latitude, with noon moved an hour on daylight saving time. Between
      08:00 and 18:00 it is always light, whatever the sun says.
   Without JavaScript the page is light (css/style.css defaults to light).
   The choice is made once per page load; a page left open does not switch.

   Testing: ?theme=dark or ?theme=light forces one for the tab (links keep it);
   ?theme=system clears it. The mechanism frames copy the parent's choice.
   ============================================================ */
(function(){
  var h = document.documentElement, t = "";
  try {
    var q = new URLSearchParams(location.search).get("theme");
    if(q === "system") sessionStorage.removeItem("newo-theme");
    else if(q === "dark" || q === "light") sessionStorage.setItem("newo-theme", q);
    t = sessionStorage.getItem("newo-theme") || "";
  } catch(e){}

  function afterDark(now){
    var hr = now.getHours() + now.getMinutes() / 60;
    if(hr >= 8 && hr < 18) return false;                         // working hours: always light
    var y = now.getFullYear(), rad = Math.PI / 180, lat = 43.65 * rad;   // Toronto
    var day = Math.floor((now - new Date(y, 0, 0)) / 864e5);
    var dec = -23.44 * rad * Math.cos(2 * Math.PI / 365 * (day + 10));  // the sun's declination
    var c = (Math.sin(-6 * rad) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
    var half = Math.acos(Math.max(-1, Math.min(1, c))) / rad / 15;       // hours from noon to dusk
    var dst = now.getTimezoneOffset() < Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
    var noon = 12 + (dst ? 1 : 0);
    return hr >= noon + half || hr < noon - half;
  }

  if(t !== "dark" && t !== "light"){
    var prefersDark = false;
    try { prefersDark = !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches); } catch(e){}
    t = (prefersDark && afterDark(new Date())) ? "dark" : "light";
  }
  h.setAttribute("data-theme", t);
  // the browser's own colours (first canvas, address bar) follow the same choice
  var m = document.querySelector('meta[name="color-scheme"]'); if(m) m.setAttribute("content", t);
  var c2 = document.querySelector('meta[name="theme-color"]'); if(c2) c2.setAttribute("content", t === "dark" ? "#131312" : "#ffffff");
})();
