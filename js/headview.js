/* headview.js : LOOK AROUND IT, the head-tracked 3D window (desktop only).
   Loaded by project.html on the first click of the LOOK AROUND IT button,
   never before. Opens a full-window viewer: the webcam finds the visitor's
   face, and the 3D view is drawn as if the screen were a window into a box,
   so moving the head looks around the product (off-axis projection, the
   "fish tank VR" trick). Drag turns the product.

   Two modes: ON A SURFACE (the product stands in a shallow gridded room, one
   light, contact shadow) and FLOATING (no floor, slow drift, a far grid wall
   for depth).

   Camera refused, no camera, or a library failed to load: the window closes.
   The page's own 3D model and VIEW IN YOUR SPACE are still there.

   The video never leaves the computer: MediaPipe runs the face detector
   in the browser. Libraries come from jsdelivr, pinned:
     three 0.165.0, @mediapipe/tasks-vision 0.10.14,
     face model: blaze_face_short_range (Google, ~230 KB),
     Draco decoder: gstatic 1.5.6 (the GLBs are Draco compressed).

   World units are centimetres. The screen is the plane z = 0, centred on the
   origin; its size is the canvas size at an assumed 96 px per inch. The head
   distance comes from the face width in the webcam image (assumed 60 deg
   webcam field of view, 14 cm face). Both are guesses, so DEPTH scales how
   far the view moves, and RECENTRE takes the current head position as
   straight on. */
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
    face:  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
    dec:   "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
  };

  var CM_PER_PX = 2.54 / 96;
  var TAN_HALF_FOV = Math.tan(30 * Math.PI / 180);
  var FACE_CM = 14;
  var REST_Z = 60;            // where the head is assumed to be with no face

  var CSS =
    '.hv{position:fixed; inset:0; z-index:9999; display:flex; flex-direction:column; background:var(--paper,#e9e7e2); color:var(--ink,#141414); opacity:0; transition:opacity .25s ease;}' +
    '.hv.on{opacity:1;}' +
    '.hv-strip{flex:0 0 auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:12px var(--mar,16px); background:var(--paper,#e9e7e2);}' +
    '.hv-title{font-family:var(--disp); font-style:italic; font-size:22px; margin-right:auto;}' +
    '.hv-msg{font-family:var(--body); font-size:12px; letter-spacing:.08em; text-transform:uppercase; margin:0 0 0 auto;}' +
    '.hv-view{flex:1 1 auto; position:relative; min-height:0;}' +
    '.hv-view canvas{position:absolute; inset:0; width:100%; height:100%; display:block; cursor:grab; touch-action:none;}' +
    '.hv-view canvas:active{cursor:grabbing;}' +
    '.hv-btn{font-family:var(--body); font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:#fff; background:var(--red,#e2191b); border:0; padding:8px 14px; cursor:pointer;}' +
    '.hv-btn.active{background:var(--ink,#141414);}' +
    '.hv-depth{font-family:var(--body); font-size:12px; letter-spacing:.16em; display:flex; align-items:center; gap:8px;}' +
    '.hv-depth input{accent-color:var(--red,#e2191b); width:120px;}';

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
      '<div class="hv-strip">' +
        '<button class="hv-btn active" type="button" data-mode="surface">ON A SURFACE</button>' +
        '<button class="hv-btn" type="button" data-mode="float">FLOATING</button>' +
        '<button class="hv-btn" type="button" data-act="centre">RECENTRE</button>' +
        '<label class="hv-depth">DEPTH <input type="range" min="0.4" max="2" step="0.05" value="1"></label>' +
        '<p class="hv-msg">Allow the camera. The video stays on this computer.</p>' +
      '</div>';
    root.querySelector(".hv-title").textContent = opts.title || "";
    document.body.appendChild(root);
    s.root = root;
    s.oldOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function(){ root.classList.add("on"); });

    var msg = root.querySelector(".hv-msg");
    var view = root.querySelector(".hv-view");

    root.querySelector("[data-x]").addEventListener("click", close);
    s.onKey = function(e){ if(e.key === "Escape") close(); };
    document.addEventListener("keydown", s.onKey);

    // ask for the camera and fetch the libraries at the same time
    var camP = navigator.mediaDevices.getUserMedia({
      video:{ facingMode:"user", width:{ideal:640}, height:{ideal:480} }, audio:false
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

    /* ---------- video + face detector ---------- */
    var video = document.createElement("video");
    video.muted = true; video.playsInline = true; video.srcObject = stream;
    var videoP = video.play();

    var fsP = vision.FilesetResolver.forVisionTasks(URL_.wasm);
    function makeDetector(fs, delegate){
      return vision.FaceDetector.createFromOptions(fs, {
        baseOptions:{ modelAssetPath:URL_.face, delegate:delegate },
        runningMode:"VIDEO", minDetectionConfidence:0.5
      });
    }
    var detP = fsP.then(function(fs){
      return makeDetector(fs, "GPU").catch(function(){ return makeDetector(fs, "CPU"); });
    });

    /* ---------- renderer + scene ---------- */
    var renderer = new THREE.WebGLRenderer({ antialias:true });
    s.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    view.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var PAPER = new THREE.Color(0xe9e7e2), INK = 0x141414;
    scene.background = PAPER;
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;

    // the one light: high, front left, as in the renders
    var sun = new THREE.DirectionalLight(0xfff4e6, 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0004;
    scene.add(sun, sun.target);

    var cam = new THREE.PerspectiveCamera();
    var pivot = new THREE.Group();     // drag turns this
    var holder = new THREE.Group();    // positions + bobs the pivot
    holder.add(pivot);
    scene.add(holder);
    var room = null, model = null, modelSize = null;

    var mode = "surface", W = 40, H = 25, D = 30;
    var yaw = -25 * Math.PI / 180, pitch = 0;

    function gridLines(w, h, step, pts, map){
      // lines on a w x h rectangle, mapped into 3D by map(u, v)
      for(var u = -w/2; u <= w/2 + 1e-6; u += step){ pts.push(map(u, -h/2), map(u, h/2)); }
      for(var v = -h/2; v <= h/2 + 1e-6; v += step){ pts.push(map(-w/2, v), map(w/2, v)); }
    }

    function buildRoom(){
      if(room){
        scene.remove(room);
        room.traverse(function(o){ if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); });
      }
      room = new THREE.Group();
      var step = W / 12, pts = [], V = function(x, y, z){ return new THREE.Vector3(x, y, z); };
      if(mode === "surface"){
        D = Math.max(W, H) * 0.75;
        var box = new THREE.Mesh(
          new THREE.BoxGeometry(W, H, D),
          new THREE.MeshStandardMaterial({ color:0xe9e7e2, roughness:1, side:THREE.BackSide })
        );
        box.position.z = -D / 2;
        box.receiveShadow = true;
        room.add(box);
        var e = 0.02;   // lift the lines off the walls
        gridLines(W, D, step, pts, function(u, v){ return V(u, -H/2 + e, v - D/2); });   // floor
        gridLines(W, D, step, pts, function(u, v){ return V(u,  H/2 - e, v - D/2); });   // ceiling
        gridLines(W, H, step, pts, function(u, v){ return V(u, v, -D + e); });           // back
        gridLines(D, H, step, pts, function(u, v){ return V(-W/2 + e, v, u - D/2); });   // left
        gridLines(D, H, step, pts, function(u, v){ return V( W/2 - e, v, u - D/2); });   // right
        sun.position.set(-W * 0.35, H * 1.2, W * 0.6);
        sun.target.position.set(0, -H/2, -D * 0.45);
        var sc = sun.shadow.camera, r = Math.max(W, D);
        sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1; sc.far = r * 4;
        sc.updateProjectionMatrix();
      } else {
        D = W * 1.6;
        gridLines(W * 2.4, H * 2.4, step * 1.5, pts, function(u, v){ return V(u, v, -D); });
        sun.position.set(-W * 0.35, H * 1.2, W * 0.6);
        sun.target.position.set(0, 0, -W * 0.25);
      }
      var lines = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color:INK, transparent:true, opacity:mode === "surface" ? 0.13 : 0.08 })
      );
      room.add(lines);
      scene.add(room);
      sun.castShadow = mode === "surface";
    }

    function placeModel(){
      if(!model) return;
      var k;
      if(mode === "surface"){
        k = Math.min(0.62 * H / modelSize.y, 0.55 * W / modelSize.x, 0.55 * D / modelSize.z);
        holder.position.set(0, -H/2, -D * 0.45);
      } else {
        k = Math.min(0.55 * H / modelSize.y, 0.5 * W / modelSize.x, 0.5 * W / modelSize.z);
        holder.position.set(0, -0.5 * modelSize.y * k, -W * 0.25);
      }
      pivot.scale.setScalar(k);
    }

    function setSize(){
      var w = view.clientWidth || 1, h = view.clientHeight || 1;
      renderer.setSize(w, h, false);
      W = w * CM_PER_PX; H = h * CM_PER_PX;
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
        model.traverse(function(o){ if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
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
    var gain = 1;
    var calib = null;            // raw head x/y that counts as straight on
    var raw = null, lastSeen = 0, lastVT = -1;
    s.root.querySelectorAll("[data-mode]").forEach(function(b){
      b.addEventListener("click", function(){
        mode = b.getAttribute("data-mode");
        s.root.querySelectorAll("[data-mode]").forEach(function(o){ o.classList.toggle("active", o === b); });
        if(mode === "surface") pitch = 0;
        buildRoom(); placeModel();
      });
    });
    s.root.querySelector("[data-act=centre]").addEventListener("click", function(){
      if(raw) calib = { x:raw.x, y:raw.y };
    });
    s.root.querySelector(".hv-depth input").addEventListener("input", function(e){
      gain = parseFloat(e.target.value) || 1;
    });

    /* ---------- head position from the face box ---------- */
    function readHead(now){
      if(!s.detector || video.readyState < 2 || video.currentTime === lastVT) return;
      lastVT = video.currentTime;
      var res;
      try { res = s.detector.detectForVideo(video, now); } catch(e){ return; }
      var d0 = res && res.detections && res.detections[0];
      if(!d0) return;
      var bb = d0.boundingBox, vw = video.videoWidth, vh = video.videoHeight;
      var f = bb.width / vw;
      if(f <= 0.02) return;
      var dist = FACE_CM / (2 * TAN_HALF_FOV * f);
      var imgW = 2 * dist * TAN_HALF_FOV, imgH = imgW * vh / vw;
      var cx = (bb.originX + bb.width / 2) / vw;
      var cy = (bb.originY + bb.height * 0.4) / vh;    // eye line, not box centre
      // the webcam is not mirrored: moving right puts the face on the image left
      raw = {
        x: -(cx - 0.5) * imgW,
        y: -(cy - 0.5) * imgH + H / 2 + 1,             // webcam sits on the top edge
        z: Math.max(25, Math.min(150, dist))
      };
      if(!calib) calib = { x:raw.x, y:raw.y };         // first sighting = straight on
      lastSeen = now;
    }

    /* ---------- render loop ---------- */
    var head = new THREE.Vector3(0, 0, REST_Z), tgt = new THREE.Vector3(0, 0, REST_Z);
    var t0 = performance.now();
    function frame(now){
      if(s.closed) return;
      s.raf = requestAnimationFrame(frame);
      readHead(now);

      if(raw && now - lastSeen < 800){
        tgt.set((raw.x - calib.x) * gain, (raw.y - calib.y) * gain, REST_Z + (raw.z - REST_Z) * gain);
      } else {
        tgt.set(0, 0, REST_Z);      // face lost: drift back to straight on
      }
      head.lerp(tgt, 0.22);

      // off-axis projection: the canvas is a window, the head is the eye
      var n = 1, fa = 2000, hz = Math.max(10, head.z);
      cam.position.copy(head);
      cam.quaternion.identity();
      cam.updateMatrixWorld();
      cam.projectionMatrix.makePerspective(
        (-W/2 - head.x) * n / hz, ( W/2 - head.x) * n / hz,
        ( H/2 - head.y) * n / hz, (-H/2 - head.y) * n / hz, n, fa);
      cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

      var t = (now - t0) / 1000, idle = now - lastInput > 2500;
      if(mode === "float"){
        holder.position.y = (modelSize ? -0.5 * modelSize.y * pivot.scale.x : 0) + Math.sin(t * 0.8) * H * 0.012;
        if(idle && !drag) yaw += 0.0012;
      }
      pivot.rotation.set(pitch, yaw, 0, "YXZ");
      renderer.render(scene, cam);
    }

    Promise.all([videoP, detP, modelP]).then(function(r){
      if(s.closed){ if(r[1]) r[1].close(); return; }
      s.detector = r[1];
      msg.textContent = "Move your head to look around. Drag to turn.";
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

  window.NEWO_HEADVIEW = { open:open, close:close };
})();
