/* headview.js : LOOK AROUND IT, the head-tracked 3D window (desktop only).
   Loaded by project.html on the first click of the LOOK AROUND IT button,
   never before. Opens a full-window viewer: the webcam finds the visitor's
   eyes and the 3D view is drawn as if the screen were a window into a box,
   so moving the head looks around the product (off-axis projection, the
   "fish tank VR" trick). Drag turns the product.

   v2 (2026-10-10, after "jittery and too weak"):
   - Tracking: MediaPipe FaceLandmarker, the two iris centres, not a face
     box. Distance comes from the 3D gap between the irises, which hardly
     changes when the head turns.
   - One Euro filter on x, y, z: steady when still, quick when moving.
   - Strength: head offsets are multiplied by DEPTH (default 1.6).
   - Product sits at the glass, not halfway back in the room.
   - Room is ink lines on paper plus one shadow catcher. No shaded walls.
   - Face lost: hold the last position 1.5 s, then drift slowly to centre.
   - Small mirrored camera preview with the eye points, can be hidden.
   - SET UP: screen size + sitting distance + one SET while sitting
     normally. Saved in this browser. Works without it on guesses
     (96 px per inch, 60 deg webcam, 6.3 cm between pupils).
   - Quality drops itself (pixel ratio, then shadows) if frames run slow.

   Modes: ON A SURFACE (gridded room, product on the floor at the glass)
   and FLOATING (hangs at the glass, half in front, faint shadow far below).

   Camera refused, no camera, or a library failed to load: the window closes.
   The page's own 3D model and VIEW IN YOUR SPACE are still there.

   The video never leaves the computer. Libraries come from CDNs, pinned:
     three 0.165.0, @mediapipe/tasks-vision 0.10.14 (jsdelivr),
     face_landmarker.task float16 v1 (storage.googleapis.com, ~3.6 MB),
     Draco decoder 1.5.6 (gstatic; the GLBs are Draco compressed).

   World units are centimetres. The screen is the plane z = 0, centred on the
   origin, x right, y up, the viewer on +z. */
(function(){
  if(window.NEWO_HEADVIEW) return;

  var CDN = "https://cdn.jsdelivr.net/npm/";
  var TV = "three@0.165.0";
  var MP = "@mediapipe/tasks-vision@0.10.14";
  var URL_ = {
    three: CDN + TV + "/+esm",
    gltf:  CDN + TV + "/examples/jsm/loaders/GLTFLoader.js/+esm",
    draco: CDN + TV + "/examples/jsm/loaders/DRACOLoader.js/+esm",
    room:  CDN + TV + "/examples/jsm/environments/RoomEnvironment.js/+esm",
    mp:    CDN + MP + "/vision_bundle.mjs",
    wasm:  CDN + MP + "/wasm",
    face:  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    dec:   "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
  };

  var IPD_CM = 6.3;                       // average adult pupil distance
  var AUTO_TAN = Math.tan(30 * Math.PI / 180);   // 60 deg webcam
  var AUTO_CM_PER_PX = 2.54 / 96;
  var REST_Z = 60;
  var IRIS_A = 468, IRIS_B = 473;
  var STORE = "newo-headview";

  function load(){
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch(e){ return {}; }
  }
  function save(o){
    try { localStorage.setItem(STORE, JSON.stringify(o)); } catch(e){}
  }

  /* One Euro filter (Casiez et al.): low cutoff when still kills jitter,
     cutoff rises with speed so real movement is not lagged. */
  function OneEuro(minCut, beta){ this.minCut = minCut; this.beta = beta; this.x = null; this.dx = 0; this.t = 0; }
  OneEuro.prototype.alpha = function(cut, dt){ var r = 2 * Math.PI * cut * dt; return r / (r + 1); };
  OneEuro.prototype.filter = function(v, t){
    if(this.x === null){ this.x = v; this.t = t; return v; }
    var dt = Math.max(0.001, (t - this.t) / 1000);
    this.t = t;
    this.dx += this.alpha(1, dt) * ((v - this.x) / dt - this.dx);
    this.x += this.alpha(this.minCut + this.beta * Math.abs(this.dx), dt) * (v - this.x);
    return this.x;
  };
  OneEuro.prototype.reset = function(){ this.x = null; this.dx = 0; };

  var CSS =
    '.hv{position:fixed; inset:0; z-index:9999; display:flex; flex-direction:column; background:var(--paper,#e9e7e2); color:var(--ink,#141414); opacity:0; transition:opacity .25s ease;}' +
    '.hv.on{opacity:1;}' +
    '.hv-strip{flex:0 0 auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:12px var(--mar,16px); background:var(--paper,#e9e7e2);}' +
    '.hv-strip[hidden]{display:none;}' +
    '.hv-title{font-family:var(--disp); font-style:italic; font-size:22px; margin-right:auto;}' +
    '.hv-msg{font-family:var(--body); font-size:12px; letter-spacing:.08em; text-transform:uppercase; margin:0 0 0 auto;}' +
    '.hv-view{flex:1 1 auto; position:relative; min-height:0;}' +
    '.hv-view canvas{position:absolute; inset:0; width:100%; height:100%; display:block; cursor:grab; touch-action:none;}' +
    '.hv-view canvas:active{cursor:grabbing;}' +
    '.hv-btn{font-family:var(--body); font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#fff; background:var(--red,#e2191b); border:0; padding:8px 14px; cursor:pointer;}' +
    '.hv-btn.active{background:var(--ink,#141414);}' +
    '.hv-lab{font-family:var(--body); font-size:12px; letter-spacing:.16em; text-transform:uppercase; display:flex; align-items:center; gap:8px;}' +
    '.hv-lab input[type=range]{accent-color:var(--red,#e2191b); width:120px;}' +
    '.hv-lab input[type=number]{font-family:var(--body); font-size:12px; width:64px; padding:6px; border:1px solid var(--ink,#141414); background:transparent; color:inherit;}' +
    '.hv-cam{width:96px; height:72px; display:block; background:var(--ink,#141414);}' +
    '.hv-cam[hidden]{display:none;}';

  var st = null;   // the one open viewer

  function open(opts){
    if(st) return;
    st = { raf:0, stream:null, detector:null, renderer:null, closed:false };
    var s = st;

    if(!document.getElementById("hv-css")){
      var css = document.createElement("style");
      css.id = "hv-css"; css.textContent = CSS;
      document.head.appendChild(css);
    }

    var root = document.createElement("div");
    root.className = "hv";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", (opts.title || "Product") + ", look around it");
    root.innerHTML =
      '<div class="hv-strip">' +
        '<span class="hv-title"></span>' +
        '<button class="hv-btn" type="button" data-x>CLOSE</button>' +
      '</div>' +
      '<div class="hv-view"></div>' +
      '<div class="hv-strip" data-main>' +
        '<button class="hv-btn active" type="button" data-mode="surface">ON A SURFACE</button>' +
        '<button class="hv-btn" type="button" data-mode="float">FLOATING</button>' +
        '<button class="hv-btn" type="button" data-act="centre">RECENTRE</button>' +
        '<label class="hv-lab">DEPTH <input type="range" min="0.6" max="3" step="0.05" value="1.6" data-depth></label>' +
        '<button class="hv-btn" type="button" data-act="setup">SET UP</button>' +
        '<button class="hv-btn" type="button" data-act="cam">HIDE CAMERA</button>' +
        '<canvas class="hv-cam" width="192" height="144" aria-hidden="true"></canvas>' +
        '<p class="hv-msg">Allow the camera. The video stays on this computer.</p>' +
      '</div>' +
      '<div class="hv-strip" data-setup hidden>' +
        '<label class="hv-lab">SCREEN <input type="number" min="10" max="60" step="0.1" data-diag> IN</label>' +
        '<label class="hv-lab">YOU SIT <input type="number" min="25" max="150" step="1" data-dist> CM</label>' +
        '<button class="hv-btn" type="button" data-act="set">SET</button>' +
        '<button class="hv-btn" type="button" data-act="auto">AUTO</button>' +
        '<button class="hv-btn" type="button" data-act="done">DONE</button>' +
        '<p class="hv-msg" data-setmsg>Enter your screen size, sit as you normally would, then press SET.</p>' +
      '</div>';
    root.querySelector(".hv-title").textContent = opts.title || "";
    document.body.appendChild(root);
    s.root = root;
    s.oldOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function(){ root.classList.add("on"); });

    var msg = root.querySelector("[data-main] .hv-msg");
    var view = root.querySelector(".hv-view");

    root.querySelector("[data-x]").addEventListener("click", close);
    s.onKey = function(e){ if(e.key === "Escape") close(); };
    document.addEventListener("keydown", s.onKey);

    // ask for the camera and fetch the libraries at the same time
    var camP = navigator.mediaDevices.getUserMedia({
      video:{ facingMode:"user", width:{ideal:640}, height:{ideal:480}, frameRate:{ideal:60} }, audio:false
    });
    var libP = Promise.all([
      import(URL_.three), import(URL_.gltf), import(URL_.draco), import(URL_.room), import(URL_.mp)
    ]);

    camP.then(function(stream){
      if(s.closed){ stream.getTracks().forEach(function(t){ t.stop(); }); return; }
      s.stream = stream;
      msg.textContent = "Loading the model.";
      return libP.then(function(m){ return start(s, opts, view, msg, stream, m); });
    }).catch(function(err){
      if(window.console) console.warn("headview:", err);
      close();
    });
  }

  function start(s, opts, view, msg, stream, m){
    if(s.closed) return;
    var THREE = m[0], GLTFLoader = m[1].GLTFLoader, DRACOLoader = m[2].DRACOLoader,
        RoomEnvironment = m[3].RoomEnvironment, vision = m[4];
    var root = s.root;
    var cfg = load();          // { diag, dist, tan, depth, hideCam }

    /* ---------- video + face landmarker ---------- */
    var video = document.createElement("video");
    video.muted = true; video.playsInline = true; video.srcObject = stream;
    var videoP = video.play();

    var fsP = vision.FilesetResolver.forVisionTasks(URL_.wasm);
    function makeDetector(fs, delegate){
      return vision.FaceLandmarker.createFromOptions(fs, {
        baseOptions:{ modelAssetPath:URL_.face, delegate:delegate },
        runningMode:"VIDEO", numFaces:1,
        minFaceDetectionConfidence:0.5, minFacePresenceConfidence:0.5, minTrackingConfidence:0.5
      });
    }
    var detP = fsP.then(function(fs){
      return makeDetector(fs, "GPU").catch(function(){ return makeDetector(fs, "CPU"); });
    });

    /* ---------- renderer + scene ---------- */
    var renderer = new THREE.WebGLRenderer({ antialias:true });
    s.renderer = renderer;
    var pr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pr);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    view.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var INK = 0x141414;
    scene.background = new THREE.Color(0xe9e7e2);
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;

    // the one light: high, front left, as in the renders
    var sun = new THREE.DirectionalLight(0xfff4e6, 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    scene.add(sun, sun.target);

    var cam = new THREE.PerspectiveCamera();
    var pivot = new THREE.Group();     // drag turns this
    var holder = new THREE.Group();    // positions + bobs the pivot
    holder.add(pivot);
    scene.add(holder);
    var room = null, model = null, modelSize = null;

    var mode = "surface", W = 40, H = 25, D = 30, floatY = 0;
    var yaw = -25 * Math.PI / 180, pitch = 0;

    function cmPerPx(){
      if(cfg.diag){
        var sw = screen.width, sh = screen.height;
        return cfg.diag * 2.54 / Math.sqrt(sw * sw + sh * sh);
      }
      return AUTO_CM_PER_PX;
    }

    function gridLines(w, h, step, pts, map){
      // lines on a w x h rectangle, mapped into 3D by map(u, v); centred so
      // the middle line is always on the axis
      var nu = Math.floor(w / 2 / step), nv = Math.floor(h / 2 / step), i;
      for(i = -nu; i <= nu; i++) pts.push(map(i * step, -h/2), map(i * step, h/2));
      for(i = -nv; i <= nv; i++) pts.push(map(-w/2, i * step), map(w/2, i * step));
      pts.push(map(-w/2, -h/2), map(-w/2, h/2), map(w/2, -h/2), map(w/2, h/2));   // edges
      pts.push(map(-w/2, -h/2), map(w/2, -h/2), map(-w/2, h/2), map(w/2, h/2));
    }

    function buildRoom(){
      if(room){
        scene.remove(room);
        room.traverse(function(o){ if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); });
      }
      room = new THREE.Group();
      var step = W / 14, pts = [], V = function(x, y, z){ return new THREE.Vector3(x, y, z); };
      var floorY, floorZ, floorD;
      if(mode === "surface"){
        D = W * 0.9;
        gridLines(W, D, step, pts, function(u, v){ return V(u, -H/2, v - D/2); });   // floor
        gridLines(W, D, step, pts, function(u, v){ return V(u,  H/2, v - D/2); });   // ceiling
        gridLines(W, H, step, pts, function(u, v){ return V(u, v, -D); });           // back
        gridLines(D, H, step, pts, function(u, v){ return V(-W/2, v, u - D/2); });   // left
        gridLines(D, H, step, pts, function(u, v){ return V( W/2, v, u - D/2); });   // right
        floorY = -H/2; floorZ = -D/2; floorD = D;
      } else {
        D = W * 1.8;
        gridLines(W * 3, H * 3, step * 1.5, pts, function(u, v){ return V(u, v, -D); });
        floorY = -H * 0.75; floorZ = -W * 0.4; floorD = W * 1.6;
      }
      var lines = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color:INK, transparent:true, opacity:mode === "surface" ? 0.28 : 0.12 })
      );
      room.add(lines);

      // invisible floor that only shows the shadow
      var catcher = new THREE.Mesh(
        new THREE.PlaneGeometry(W * 3, floorD),
        new THREE.ShadowMaterial({ color:INK, opacity:mode === "surface" ? 0.3 : 0.1 })
      );
      catcher.rotation.x = -Math.PI / 2;
      catcher.position.set(0, floorY + 0.01, floorZ);
      catcher.receiveShadow = true;
      room.add(catcher);
      scene.add(room);

      sun.position.set(-W * 0.35, H * 1.4, W * 0.5);
      sun.target.position.set(0, floorY, 0);
      var sc = sun.shadow.camera, r = Math.max(W, H) * 0.8;
      sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1; sc.far = Math.max(W, H) * 5;
      sc.updateProjectionMatrix();
    }

    /* The product sits AT the glass: its front face just behind the screen
       (surface) or its middle on the screen plane (floating). Things near the
       glass stay pinned while the room behind them swings, which is what sells
       the depth. */
    function placeModel(){
      if(!model) return;
      var k;
      if(mode === "surface"){
        k = Math.min(0.7 * H / modelSize.y, 0.5 * W / modelSize.x, 0.5 * D / modelSize.z);
        holder.position.set(0, -H/2, -0.5 * modelSize.z * k - 0.5);
      } else {
        k = Math.min(0.55 * H / modelSize.y, 0.45 * W / modelSize.x, 0.45 * W / modelSize.z);
        floatY = -0.5 * modelSize.y * k;
        holder.position.set(0, floatY, 0);
      }
      pivot.scale.setScalar(k);
    }

    function setSize(){
      var w = view.clientWidth || 1, h = view.clientHeight || 1;
      renderer.setSize(w, h, false);
      var c = cmPerPx();
      W = w * c; H = h * c;
      buildRoom(); placeModel();
    }
    s.onResize = setSize;
    window.addEventListener("resize", setSize);
    setSize();

    /* ---------- model ---------- */
    var draco = new DRACOLoader();
    draco.setDecoderPath(URL_.dec);
    var loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    var modelP = new Promise(function(res, rej){ loader.load(opts.src, res, undefined, rej); })
      .then(function(gltf){
        if(s.closed) return;
        model = gltf.scene;
        var b = new THREE.Box3().setFromObject(model);
        modelSize = b.getSize(new THREE.Vector3());
        var c = b.getCenter(new THREE.Vector3());
        // footprint centre on the turn axis, base on y = 0
        model.position.set(-c.x, -b.min.y, -c.z);
        model.traverse(function(o){ if(o.isMesh){ o.castShadow = true; } });
        pivot.add(model);
        placeModel();
        draco.dispose();
      });

    /* ---------- drag to turn ---------- */
    var cv = renderer.domElement, drag = null, lastInput = 0;
    cv.addEventListener("pointerdown", function(e){
      drag = { x:e.clientX, y:e.clientY };
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener("pointermove", function(e){
      if(!drag) return;
      yaw += (e.clientX - drag.x) * 0.008;
      if(mode === "float") pitch = Math.max(-0.6, Math.min(0.6, pitch + (e.clientY - drag.y) * 0.005));
      drag.x = e.clientX; drag.y = e.clientY;
      lastInput = performance.now();
    });
    function endDrag(){ drag = null; }
    cv.addEventListener("pointerup", endDrag);
    cv.addEventListener("pointercancel", endDrag);

    /* ---------- controls ---------- */
    var gain = cfg.depth || 1.6;
    var depthIn = root.querySelector("[data-depth]");
    depthIn.value = gain;
    depthIn.addEventListener("input", function(){
      gain = parseFloat(depthIn.value) || 1.6;
      cfg.depth = gain; save(cfg);
    });

    root.querySelectorAll("[data-mode]").forEach(function(b){
      b.addEventListener("click", function(){
        mode = b.getAttribute("data-mode");
        root.querySelectorAll("[data-mode]").forEach(function(o){ o.classList.toggle("active", o === b); });
        if(mode === "surface") pitch = 0;
        buildRoom(); placeModel();
      });
    });

    var calib = null;            // raw head x/y that counts as straight on
    var raw = null, lastSeen = 0, lastVT = -1, lastFrac = 0;
    root.querySelector("[data-act=centre]").addEventListener("click", function(){
      if(raw) calib = { x:raw.x, y:raw.y };
    });

    var camCv = root.querySelector(".hv-cam"), camCtx = camCv.getContext("2d");
    var camBtn = root.querySelector("[data-act=cam]");
    function showCam(on){
      camCv.hidden = !on;
      camBtn.textContent = on ? "HIDE CAMERA" : "SHOW CAMERA";
    }
    showCam(!cfg.hideCam);
    camBtn.addEventListener("click", function(){
      cfg.hideCam = !camCv.hidden; save(cfg); showCam(camCv.hidden);
    });

    // SET UP: screen size and sitting distance. SET records the gap between
    // the eyes at that distance, which fixes the webcam's field of view too.
    var mainStrip = root.querySelector("[data-main]"), setStrip = root.querySelector("[data-setup]");
    var diagIn = root.querySelector("[data-diag]"), distIn = root.querySelector("[data-dist]");
    var setMsg = root.querySelector("[data-setmsg]");
    function guessDiag(){
      var sw = screen.width, sh = screen.height;
      return Math.round(Math.sqrt(sw * sw + sh * sh) * AUTO_CM_PER_PX / 2.54 * 10) / 10;
    }
    root.querySelector("[data-act=setup]").addEventListener("click", function(){
      diagIn.value = cfg.diag || guessDiag();
      distIn.value = cfg.dist || REST_Z;
      setMsg.textContent = "Enter your screen size, sit as you normally would, then press SET.";
      mainStrip.hidden = true; setStrip.hidden = false;
    });
    root.querySelector("[data-act=set]").addEventListener("click", function(){
      var dg = parseFloat(diagIn.value), ds = parseFloat(distIn.value);
      if(!(dg >= 10 && dg <= 60) || !(ds >= 25 && ds <= 150)){
        setMsg.textContent = "Screen 10 to 60 inches, distance 25 to 150 cm."; return;
      }
      if(!lastFrac || performance.now() - lastSeen > 1000){
        setMsg.textContent = "Cannot see your eyes. Face the screen and press SET again."; return;
      }
      cfg.diag = dg; cfg.dist = ds;
      cfg.tan = IPD_CM / (2 * lastFrac * ds);
      save(cfg);
      fz.reset(); calib = null;
      setSize();
      setMsg.textContent = "Saved for this browser.";
    });
    root.querySelector("[data-act=auto]").addEventListener("click", function(){
      delete cfg.diag; delete cfg.dist; delete cfg.tan;
      save(cfg); fz.reset(); calib = null;
      setSize();
      diagIn.value = guessDiag(); distIn.value = REST_Z;
      setMsg.textContent = "Back to automatic.";
    });
    root.querySelector("[data-act=done]").addEventListener("click", function(){
      setStrip.hidden = true; mainStrip.hidden = false;
    });

    /* ---------- head position from the irises ---------- */
    var fx = new OneEuro(1.0, 0.05), fy = new OneEuro(1.0, 0.05), fz = new OneEuro(0.5, 0.02);
    function readHead(now){
      if(!s.detector || video.readyState < 2 || video.currentTime === lastVT) return;
      lastVT = video.currentTime;
      var res;
      try { res = s.detector.detectForVideo(video, now); } catch(e){ return; }
      var lm = res && res.faceLandmarks && res.faceLandmarks[0];
      if(!lm || lm.length <= IRIS_B){ drawCam(null); return; }
      var a = lm[IRIS_A], b = lm[IRIS_B], vw = video.videoWidth, vh = video.videoHeight;
      // landmark z is on the same scale as x, so this gap barely changes
      // when the head turns
      var gx = (a.x - b.x) * vw, gy = (a.y - b.y) * vh, gz = (a.z - b.z) * vw;
      var frac = Math.sqrt(gx * gx + gy * gy + gz * gz) / vw;
      if(frac <= 0.01) return;
      lastFrac = frac;
      var tan = cfg.tan || AUTO_TAN;
      var dist = Math.max(25, Math.min(200, IPD_CM / (2 * tan * frac)));
      var imgW = 2 * dist * tan, imgH = imgW * vh / vw;
      var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      // the webcam is not mirrored: moving right puts the face on the image left
      var rx = -(cx - 0.5) * imgW;
      var ry = -(cy - 0.5) * imgH + H / 2 + 1;       // webcam sits on the top edge
      raw = { x:fx.filter(rx, now), y:fy.filter(ry, now), z:fz.filter(dist, now) };
      if(!calib) calib = { x:raw.x, y:raw.y };       // first sighting = straight on
      lastSeen = now;
      drawCam(cx, cy, a, b);
    }

    function drawCam(cx, cy, a, b){
      if(camCv.hidden || video.readyState < 2) return;
      var w = camCv.width, h = camCv.height;
      camCtx.save();
      camCtx.translate(w, 0); camCtx.scale(-1, 1);     // mirrored, like a mirror
      camCtx.drawImage(video, 0, 0, w, h);
      if(a){
        camCtx.fillStyle = "#e2191b";
        [a, b].forEach(function(p){ camCtx.beginPath(); camCtx.arc(p.x * w, p.y * h, 4, 0, 6.3); camCtx.fill(); });
      }
      camCtx.restore();
    }

    /* ---------- quality: step down if frames run slow ---------- */
    var slow = 0, frames = 0, lastT = 0, level = 0;
    function watchSpeed(now){
      if(lastT){ frames++; if(now - lastT > 26) slow++; }
      lastT = now;
      if(frames < 90) return;
      if(slow > 30 && level < 3){
        level++;
        if(level === 1){ pr = Math.min(pr, 1); renderer.setPixelRatio(pr); setSize(); }
        if(level === 2){ pr = 0.75; renderer.setPixelRatio(pr); setSize(); }
        if(level === 3){ sun.castShadow = false; }
      }
      frames = 0; slow = 0;
    }

    /* ---------- render loop ---------- */
    var head = new THREE.Vector3(0, 0, REST_Z), tgt = new THREE.Vector3(0, 0, REST_Z);
    var t0 = performance.now(), found = false;
    function frame(now){
      if(s.closed) return;
      s.raf = requestAnimationFrame(frame);
      readHead(now);
      watchSpeed(now);

      var since = now - lastSeen;
      if(raw && since < 1500){
        tgt.set((raw.x - calib.x) * gain, (raw.y - calib.y) * gain, raw.z);
        head.lerp(tgt, 0.5);              // the filter already smooths; this only fills display frames
        if(!found && s.detector){ found = true; msg.textContent = "Move your head to look around. Drag to turn."; }
      } else {
        tgt.set(0, 0, REST_Z);
        head.lerp(tgt, 0.03);             // face lost: drift home slowly
        if(found && raw && since > 1500){ found = false; msg.textContent = "Looking for you."; }
      }

      // off-axis projection: the canvas is a window, the head is the eye
      var n = 1, fa = 3000, hz = Math.max(10, head.z);
      cam.position.copy(head);
      cam.quaternion.identity();
      cam.updateMatrixWorld();
      cam.projectionMatrix.makePerspective(
        (-W/2 - head.x) * n / hz, ( W/2 - head.x) * n / hz,
        ( H/2 - head.y) * n / hz, (-H/2 - head.y) * n / hz, n, fa);
      cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

      var t = (now - t0) / 1000, idle = now - lastInput > 2500;
      if(mode === "float"){
        holder.position.y = floatY + Math.sin(t * 0.8) * H * 0.012;
        if(idle && !drag) yaw += 0.0012;
      }
      pivot.rotation.set(pitch, yaw, 0, "YXZ");
      renderer.render(scene, cam);
      s.dbg = { raw:raw, head:[head.x, head.y, head.z], W:W, H:H, level:level, found:found };   // NEWO_HEADVIEW.debug()
    }

    Promise.all([videoP, detP, modelP]).then(function(r){
      if(s.closed){ if(r[1]) r[1].close(); return; }
      s.detector = r[1];
      msg.textContent = "Looking for you.";
    }).catch(function(err){
      if(window.console) console.warn("headview:", err);
      close();
    });
    s.raf = requestAnimationFrame(frame);
  }

  function close(){
    var s = st;
    if(!s || s.closed) return;
    s.closed = true;
    cancelAnimationFrame(s.raf);
    if(s.stream) s.stream.getTracks().forEach(function(t){ t.stop(); });
    if(s.detector){ try { s.detector.close(); } catch(e){} }
    if(s.renderer){ s.renderer.dispose(); try { s.renderer.forceContextLoss(); } catch(e){} }
    if(s.onResize) window.removeEventListener("resize", s.onResize);
    document.removeEventListener("keydown", s.onKey);
    document.documentElement.style.overflow = s.oldOverflow || "";
    s.root.remove();
    st = null;
  }

  window.NEWO_HEADVIEW = { open:open, close:close, debug:function(){ return st && st.dbg; } };
})();
