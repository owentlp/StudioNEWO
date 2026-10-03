/* ============================================================
   PROJECT TEXT + IMAGE LISTS · edit this file only.
   Replace anything inside [square brackets]. Any field left in
   [brackets] or "" is treated as empty and its section hides
   automatically, so you can fill projects in as you go.

   All copy below is final English. Dimensions left as
   "[dimensions]" hide their spec row until filled (no em dashes).

   IMAGE SETS (drop real files in projects/<name>/, keep the names):
     gallery[]     hero gallery, first item is the opening hero image
     process[]     labelled process scatter (processNotes captions them) -
                   this is the ONLY scatter section project.html renders. All
                   hand-positioned photos (fabrication steps AND finished/
                   aesthetic shots alike) belong in this one array.
     v2images[]    closing V2 shots

   TWO RULES THAT CONTROL THE LOOK:

   1) FILE TYPE = INTENT
        .jpg  -> a framed photo, cropped to fit its box
        .png  -> a CUT-OUT: transparent background, no crop, sits on
                 the paper "printed on the page"

   2) STRING = RANDOM,  OBJECT = PINNED
        "scatter-05.jpg"                         <- auto-scattered
        { src:"scatter-01.jpg", bleed:"left",    <- pinned (an anchor)
          span:6, ar:"1/1", mt:0 }
      Object fields (all optional except src):
        bleed : "left" | "right" | "full"   (touch that page edge)
        span  : 1-12 columns wide            (used with bleed, default 6)
        col   : "3 / 8"                      (exact grid columns)
        ar    : "4/3" "3/2" "16/9" "1/1" ... (aspect for framed photos)
        mt    : 120                          (white space above, px)
        shift : -21                          (vw: pull the LEFT edge that far
                                              PAST the window edge, so the
                                              image hangs off the page like
                                              KART's LED photo in the Figma)
        cut   : true / false                (force cut-out; else read .png)
        cap   : "caption text"             (micro caption under it)
        capOn : true                        (sit that caption ON the image)
        idx   : true                        (show the [NN] index number)

   TEXT FIELDS
        status   where the product is right now, shown in the spec line under
                    the hero photo after a small red square, e.g. "Prototype 01",
                    "V2 in development", "Made to order", "Small batch, spring".
                    Keep it factual and short. Leave "" to hide.
        kind     what the product IS, in plain words ("flat-pack lounge chair").
                    Goes into the page title and search/share previews:
                    "NEB, flat-pack lounge chair · STUDIO NEWO". Re-run
                    tools/make-project-pages.py after changing it.
        teaser   the short italic line on the hero (the "catchy sentence").
                    This only lives on the project page now, the home page
                    dock shows title/date only, no catch phrase, so don't
                    add a "caption" field back in without checking with Owen.
        summary  the brief description paragraph under the hero (right column).
                    Keep to a couple of sentences.
        summaryMore optional. Fuller version behind an info icon next to the
                    summary. Leave "" for no icon.
        howItWorks  the mechanism paragraph
        processText the process writing. Blank-line-separated paragraphs
                    render as SMALL text cells side by side INSIDE the
                    scatter, under the first image (like the Figma's two
                    description boxes). Keep each one short.
        processMore optional. Fuller process story behind an info icon on
                    the first process text cell. Leave "" for no icon.
        processBottomMore optional. Fuller story behind an info icon on the
                    SECOND process text cell (the bottom block). Leave ""
                    for no icon. Only KART and NEB currently use this.
        v2          next steps / reflection paragraph. Keep to a couple of
                    sentences, and don't restate a diagnosis the process
                    section already made, only state what changes next.
        v2More      optional. Fuller version behind an info icon next to v2.
                    Leave "" for no icon.

   PRODUCT CODE (the "code" field, shown as the small L01.1-style tag)
        Format: CATEGORY + product number within that category + ".version"
          S  = Seating       (NEB is S01, the first seating piece)
          L  = Lighting      (KART is L01, AMSALP is L02, a separate product)
          A  = Accessories
          H  = Appliances    (NAF, a desk fan; kept distinct from "A" above)
          J  = Jewelry
          AU = Audio         (OMNI; two letters since "A" was already taken twice)
          X  = Other / uncategorized
        The number identifies the PRODUCT LINE (01 = the first seating design
        ever made); the .version identifies an iteration of that SAME product
        (a NEB V2 would be S01.2, not a new S02). A genuinely new, separate
        product in the same category gets the next number instead (AMSALP is
        L02, not a version of KART). Not final, rename/renumber freely.

   HERO SPEC BLOCK (the small block under the hero photo)
        Two terse lines, kept deliberately blocky. They come straight from:
          date       -> e.g. "2026"
          size       -> e.g. "180 x 180 x 320 mm"  (leave "[dimensions]" to hide)

   MATERIALS (2026-07-09: moved. materials is now shown as single-word chips
   directly under the hero image/specs, each one linking to its entry on the
   Material Guide (materials.html) automatically, matched by name against
   js/materials-data.js - no slug to maintain by hand here, just spell the
   material the same way it's named there. designTags and lifecycle moved
   into the PROCESS section as one more scattered text cell instead of their
   own section.)
        materials  -> comma-separated, e.g. "Cherry, glass, aluminum" becomes
                      three linked chips: CHERRY / GLASS / ALUMINUM.
        lifecycle  -> one sentence on disassembly / end of life / repairability,
                      shown in the process scatter. Leave "" to hide.
        designTags -> array of short, provable claims shown in red in the
                      process scatter, e.g. ["Designed for disassembly",
                      "Repairable", "Open source"]. Only list ones that are
                      actually true for that project, this is a claim, not a
                      mood board. Leave [] to hide.
        materialsImage -> no longer used (the standalone MATERIALS section
                      this was for was retired). Safe to ignore/delete.

   INFO ICON (progressive disclosure: a short line stays on the page, a
   longer one sits behind a small "i" button, click to expand)
        howItWorksMore -> optional. If set, howItWorks can stay to a couple of
                      sentences and the rest goes here, behind an info icon
                      next to it. Leave "" and howItWorks just shows in full
                      with no icon.
        components -> optional array for the COMPONENT SPREAD section (a row
                      of individual labelled part photos after PROCESS):
                        { src:"part.jpg", name:"Driver board", note:"..." }
                      note is optional too and, if set, becomes that part's
                      info-icon detail. Leave the array empty (or omit) to
                      hide the whole section, same as everything else here.

   VIDEO SLOTS (one per section, leave "" to hide; drop an mp4 in the
   project folder and name it here to fill it):
        heroVideo   plays in the hero, under the title/photo
        galleryVideo  sits as one more tile in the hero's thumbnail gallery
        hiwVideo    plays below the mechanism graphic in HOW IT WORKS
        processVideo  sits as one more tile in the PROCESS scatter
        v2Video     plays alongside the V2 images

   3D MODEL  (the rendered model + AR run on Google's <model-viewer>)
        model        plain geometry GLB (fallback if no render is set)
        modelRender  the textured render GLB -> shown in the viewer
        modelUSDZ    optional .usdz for iOS AR (Quick Look). Android AR works
                     from the GLB without this; iOS needs the .usdz.
        modelV2      optional, a V2 model to swap to
        Material switching: bake KHR_materials_variants into the GLB and a
        material dropdown appears automatically. Explode: bake a glTF animation
        whose name contains "explode" and an EXPLODE button appears. The
        viewer now auto-rotates slowly at rest and pauses while you drag it.
   ============================================================ */
const PROJECTS = {

  "kart": {
    objects:   true,
    title:     "KART",
    kind:      "presence-sensing table lamp",
    status:    "Prototype 01 / V2 in development",
    code:      "L01.1",
    date:      "2026",
    teaser:    "A light that responds to your presence.",
    summary:   "The light switch has barely changed in over a century. KART updates this interaction by replacing the switch with spatial awareness. The lamp tracks movement within a room, scaling its intensity as you approach, dimming as you walk away, and turning off entirely when you leave the room.",
    summaryMore:"",
    materials: "Cherry, frosted glass, aluminum, electronics",
    lifecycle: "The base, shade, and chassis pull apart entirely. Components can be repaired, upgraded, or cleanly recycled.",
    designTags:["Designed for disassembly", "Repairable"],
    size:      "4 in dia x 8 in tall",
    price:     "",
    parts:     ["Cherry base", "Frosted glass shade", "LED matrix", "Aluminum knob"],
    /* ALT TEXT. What each photo actually shows, for screen readers and for
       image search - these photographs are the portfolio, and an empty alt
       tells both of them the image is decorative. Keyed by filename so the
       gallery and process arrays stay as they are. A file with no entry
       here falls back to the project title. */
    alt: {
      "gallery-01.jpg": "The KART smart lamp unlit on a wooden cabinet beside a window, showing the frosted glass shade and turned cherry cap",
      "gallery-02.jpg": "KART lit deep blue and seen from above, the turned cherry cap and the LED matrix's graded light across the frosted shade",
      "gallery-03.jpg": "KART lit warm orange against a dark wall, the addressable LED matrix visible as a pixel grid through the frosted glass",
      "gallery-04.jpg": "KART lit red beside a white brick wall, the LED matrix pixels legible through the glass diffuser",
      "gallery-05.jpg": "Close detail of KART's frosted glass shade lit red, showing the LED matrix pixels and the seam at the aluminum base",
      "hero.jpg": "KART presence-sensing LED table lamp lit warm amber in a dark room, its frosted glass cylinder glowing above a cherry and aluminum base",
      "scatter-01.jpg": "Close view of the addressable RGB LED matrix panel used in KART, individual LED packages on a flexible circuit board",
      "scatter-02.webp": "KART's breadboard prototype: microcontroller, millimetre-wave radar presence sensor and jumper wires on the workbench",
      "scatter-03.jpg": "Cherry hardwood grain, the material used for KART's turned cap and base",
      "scatter-04.webp": "KART's electronics laid out flat: the addressable LED matrix panel with its microcontroller, radar sensor module and power supply",
      "scatter-05.webp": "KART separated into its three main parts: the frosted glass shade, the turned cherry cap, and the LED cylinder on its aluminum base",
      "scatter-06.jpg": "KART lit low in a dark room, the lamp's ambient glow reflected across the floor"
    },
    gallery:   ["hero.jpg", "gallery-01.jpg", "gallery-02.jpg", "gallery-03.jpg", "gallery-04.jpg", "gallery-05.jpg"],
    heroVideo: "demo.mp4",
    galleryVideo: "",
    model:     "model.glb",
    modelRender: "modelrender.glb",
    modelUSDZ: "model.usdz",
    modelV2:   "",
    mechanism: "mechanism.html",
    hiwVideo:  "",
    howItWorks:"A hidden radar module tracks presence and proximity, translating your physical location into dynamic lighting on an LED matrix.",
    howItWorksMore:"Many modern conveniences require pulling out a phone. KART deliberately avoids this. A single push-button dial allows for quick access to dimming and power, while also managing mode customization. Set it once, and let the lamp react to you. (A mobile interface is in development for those who prefer it, but the primary experience will always remain tactile.)",
    components: [],
    mechNotes: [
      "Follow. A column of light tracks your position, brightening as you get closer.",
      "Dim Away. Brightness fades the further you move from the lamp.",
      "Dim Toward. Brightness fades as you approach, brightest from across the room.",
      "Shadow. The full cylinder glows and a dark column follows you instead, widening as you approach."
    ],
    // pinned to the Figma composition: LED macro bleeding OFF the left edge
    // (shift is vw past the window edge), breadboard cut-out lower right.
    // The two processText paragraphs land side by side under the LED photo.
    process:   [
      { src:"scatter-01.jpg",  col:"1 / 7",  ar:"4/3", mt:0, shift:-21 },
      { src:"scatter-02.webp", col:"9 / 13", cut:true, mt:300 },
      { src:"scatter-04.webp", col:"3 / 9",  cut:true, mt:130, labels:[
        /* x/y are % positions of each label's top-left on the container. The
           photo is shifted right (see .comp-spread img in style.css) so the
           left labels sit in the gap, level with their part. */
        { t:"LED Matrix",      x:46, y:8,  name:"WS2812B 16×16 panel", spec:"256 individually addressable RGB LEDs on a single data line, 5 V." },
        { t:"mmWave Radar",    x:1,  y:23, name:"Ai-Thinker RD-03D", spec:"24 GHz mmWave radar. Tracks up to three people at once and senses through the non-conductive housing, so it stays fully hidden. UART output." },
        { t:"Microcontroller", x:1,  y:49, name:"ESP32-S3 Mini", spec:"Dual-core MCU with Wi-Fi and Bluetooth. Runs the firmware: reads the radar and dial and drives the 256-LED matrix over a single data line." },
        { t:"Dial",            x:1,  y:74, name:"EC11 rotary encoder", spec:"Rotate to dim, push to switch power and modes. 20 detents per turn." }
      ] },
      { src:"scatter-03.jpg",  bleed:"right", span:4, ar:"3/4", mt:60, cap:"Cherry, laminated and cut" },
      { src:"scatter-05.webp", col:"1 / 7",           cut:true, mt:80,  cap:"Exploded view" },
      { src:"scatter-06.jpg",  bleed:"right", span:6, ar:"3/2", mt:90, cap:"Lit", capOn:true }
    ],
    processNotes:[],
    processText:"The objective was to leverage modern sensor technology to fundamentally improve how people interact with light, moving beyond the standard binary switch without relying on complex smart-home ecosystems.",
    processMore:"The design hinges on the RD-03D millimetre-wave radar. It can track up to three people simultaneously through non-conductive materials, allowing the sensor to be completely hidden. The hardest compromise was balancing the internal electronics with the exterior aesthetics. In the studio's process, form follows function, so the electronic chassis was built first. The final proportions were entirely dictated by the dimensions of the frosted glass shade available during prototyping.",
    processBottomMore:"",
    processVideo: "",
    v2:        "The focus for V2 is to create a core which holds all necessary electronics. The core can then be dropped into different chassis.",
    v2More:    "",
    v2images:  [{ src:"v2-01.png", bleed:"left", span:7 }],
    v2Video:   ""
  },

  "omni": {
    objects:   true,
    title:     "OMNI",
    kind:      "omnidirectional loudspeakers",
    status:    "Prototype 01",
    code:      "AU01.1",
    date:      "2025",
    teaser:    "A continuous acoustic field.",
    summary:   "Listening to music at home has become more transient. People no longer sit in a single, dedicated \"sweet spot\" facing two directional speakers. OMNI is a pair of omnidirectional loudspeakers designed to scatter sound outward in 360 degrees, creating a continuous acoustic field that fills the room evenly, no matter where you are sitting or walking.",
    summaryMore:"",
    materials: "Cast aluminum, purpleheart, driver",
    lifecycle: "The driver unscrews from the enclosure, allowing for easy servicing or future audio upgrades.",
    designTags:["Upgradable electronics"],
    size:      "7 x 7 x 9 in each (pair)",
    price:     "",
    parts:     ["Purpleheart enclosure", "Aluminum diffuser", "Aluminum standoffs", "Coaxial driver"],
    /* ALT TEXT. What each photo actually shows, for screen readers and for
       image search - these photographs are the portfolio, and an empty alt
       tells both of them the image is decorative. Keyed by filename so the
       gallery and process arrays stay as they are. A file with no entry
       here falls back to the project title. */
    alt: {
      "gallery-01.jpg": "Detail of OMNI's upward-firing driver and the sand-cast aluminum diffuser cone suspended beneath the purpleheart top plate",
      "gallery-02.jpg": "OMNI from a low angle, the gap between cabinet and top plate revealing the driver firing up into the diffuser cone",
      "gallery-03.jpg": "The OMNI speaker on a wooden cabinet beside a window, showing its proportions in a room",
      "gallery-04.jpg": "OMNI photographed square on, the purpleheart grain running across the solid hardwood speaker cabinet",
      "hero.jpg": "The OMNI omnidirectional speaker: a solid purpleheart cabinet with a floating top plate on machined aluminum standoffs",
      "scatter-01.jpg": "Purpleheart cabinet blanks for OMNI on the workbench beside a mallet and hand tools",
      "scatter-02.jpg": "The sand-casting mould opened to reveal OMNI's cast aluminum diffuser cone still sitting in the sand",
      "scatter-03.jpg": "Two raw sand-cast aluminum diffuser cones straight out of the mould, before machining",
      "scatter-04.jpg": "A machined aluminum diffuser cone beside a raw sand casting on the metal shop bench",
      "scatter-05.jpg": "An assembled OMNI prototype, purpleheart cabinet and top plate mounted on their aluminum standoffs"
    },
    gallery:   ["hero.jpg", "gallery-01.jpg", "gallery-02.jpg", "gallery-03.jpg", "gallery-04.jpg"],   // keep at 4 thumbnails: the 3D model and mechanism are laid out against the gallery columns
    heroVideo: "",
    galleryVideo: "",
    model:     "",
    modelRender: "modelrender.glb",
    modelExplode: { zoom: 1.97, rise: 0.109 },   // from OMNI_web.json (pipeline): camera backs off and looks higher while exploded
    modelV2:   "",
    mechanism: "mechanism.html",
    hiwVideo:  "",
    howItWorks:"A solid, hand-finished cast aluminum diffuser sits directly above a coaxial driver, dispersing sound horizontally in all directions.",
    howItWorksMore:"The system pairs a 5.5-inch coaxial driver with a sand-cast aluminum diffuser. The enclosure is mitered from solid purpleheart wood, one of the densest hardwoods available, chosen for mass and stiffness so the cabinet itself stays quiet. The studio does not hide its assembly hardware. The solid aluminum diffuser and machined standoffs are left fully exposed to be appreciated as clean, functional, and timeless mechanical elements.",
    components: [],
    mechNotes: [],
    process:   [
      /* 2026-10-02 image pass: scatter-04 (parts lying on a scrap pile) cut.
         Captions are not displayed; they are kept true to the image anyway. */
      { src:"scatter-01.jpg", bleed:"left", span:6, ar:"4/3", mt:0, cap:"Cabinet blanks" },
      { src:"scatter-03.jpg", col:"8 / 13",           mt:70,  cap:"Cast, before trimming" },
      { src:"scatter-05.jpg", col:"2 / 7",            mt:90,  cap:"Assembled, second cabinet behind" },
      { src:"scatter-02.jpg", bleed:"right", span:5, ar:"4/3", mt:40,  cap:"The mould, opened" }
    ],
    processNotes:[],
    processText:"The project was initiated after evaluating a high-end omnidirectional speaker, the BeoLab 5. The goal was to engineer a similar acoustic geometry using premium, raw materials but delivering it at a fraction of the cost through highly efficient fabrication.",
    processMore:"Aesthetically, there were no compromises. The constraints of the materials, the casting process, and the intended acoustic outcome entirely dictated the form. Purpleheart and solid aluminum were chosen for their sonic and structural properties. By utilizing a coaxial driver and calculating the exact dispersion angle for the aluminum cast, the speaker trades the traditional stereo sweet spot for an immersive, room-filling experience.",
    processVideo: "",
    v2:        "The current pair runs on inexpensive coaxial drivers and their stock crossover, chosen to prove the enclosure and diffuser before investing further. Next is higher-quality drivers matched to the diffuser's dispersion pattern, the part of the signal chain most likely limiting the sound right now.",
    v2More:    "",
    v2images:  [{ src:"v2-01.jpg", bleed:"left", span:7, ar:"3/2" }],
    v2Video:   ""
  },

  "neb": {
    objects:   true,
    title:     "NEB",
    kind:      "flat-pack lounge chair",
    status:    "Prototype 01",
    code:      "S01.1",
    date:      "2024",
    teaser:    "A study in tension and flat-pack mechanics.",
    summary:   "Flat-pack furniture usually implies cheap materials and a temporary lifespan. NEB intentionally pushes against that idea. It is a lounge chair that ships flat and assembles in minutes, relying entirely on tension mechanics and heavy-duty materials to create a rock-solid frame meant to last.",
    summaryMore:"",
    materials: "Birch plywood, hardwood dowels, foam, canvas",
    lifecycle: "No glue anywhere in the frame. The chair unscrews back to flat panels and dowels, so any single part can be replaced on its own.",
    designTags:[],
    size:      "24 x 24 x 24 in (assembled)",
    price:     "",
    parts:     ["Side panel", "Seat", "Back"],
    /* ALT TEXT. What each photo actually shows, for screen readers and for
       image search - these photographs are the portfolio, and an empty alt
       tells both of them the image is decorative. Keyed by filename so the
       gallery and process arrays stay as they are. A file with no entry
       here falls back to the project title. */
    alt: {
      "gallery-01.jpg": "NEB from the side, showing the birch plywood panel pinned onto the tapered hardwood dowel frame",
      "gallery-02.jpg": "NEB's bare frame: tapered hardwood dowels running between two plywood side panels, held by tension with no glue or brackets",
      "gallery-03.jpg": "A disassembled NEB leaning against a wall outdoors, one plywood panel and the bundle of hardwood dowels ready to flat-pack",
      "gallery-04.jpg": "Detail of NEB's red seat cushion meeting the birch plywood side panel and its row of dowel ends",
      "gallery-05.jpg": "NEB's dowel frame part-built, seven tapered hardwood dowels standing in the Baltic birch plywood base",
      "hero.jpg": "The NEB flat-pack lounge chair assembled, red upholstery between two Baltic birch plywood side panels",
      "scatter-01.jpg": "NEB's cut parts laid out on the floor: the row of tapered dowels above the Baltic birch plywood panels",
      "scatter-02.jpg": "NEB's dowel frame part-built, seven tapered hardwood dowels standing in the Baltic birch plywood base",
      "scatter-03.webp": "The finished NEB lounge chair outdoors, low sun throwing the dowel shadows across the ground",
      "scatter-04.jpg": "A NEB birch plywood side panel lit from the side, its drilled dowel holes catching the light",
      "scatter-05.jpg": "Technical drawings for NEB: exploded assembly, elevations and tapered dowel dimensions",
      "scatter-06.png": "CAD render of the finished NEB flat-pack lounge chair with red cushions and a hardwood frame",
      "scatter-07.png": "CAD elevations of NEB in front, side and exploded views",
      "scatter-08.jpg": "Close detail of Baltic birch plywood, showing the face grain and the sanded edge"
    },
    gallery:   ["hero.jpg", "gallery-01.jpg", "gallery-02.jpg", "gallery-03.jpg", "gallery-04.jpg"],   // gallery-05 cut 2026-10-02: near duplicate of gallery-02, and the orphan thumbnail
    heroVideo: "",
    galleryVideo: "",
    model:     "",
    modelRender: "",
    modelV2:   "",
    mechanism: "",
    hiwVideo:  "",
    howItWorks:"Two Baltic birch plywood side panels lock onto seven tapered hardwood dowels. Hex screws clamp the assembly under high tension, eliminating the need for glue or hidden brackets.",
    howItWorksMore:"Designed as a low-back lounge chair, NEB is proportioned to be incredibly versatile, fitting seamlessly into a living room, patio, or office. By utilizing simple flat planes and cylindrical dowels, the architecture of the chair allows it to be manufactured across various material grades. This delivers an easily customizable, mid-to-high-end furniture experience with a strong value proposition.",
    components: [],
    mechNotes: [],
    process:   [
      { src:"scatter-01.jpg", col:"1 / 6",                     mt:0,   cap:"Parts, laid out" },
      /* scatter-02.jpg removed 2026-09-16: it was byte-identical to gallery-05.jpg
         (and to the unreferenced gallery-06.jpg), so the same shot of the dowel
         frame appeared twice on one page. It stays in the gallery, where it
         reads as a build shot, and is out of the process scatter. */
      /* 2026-10-02 image pass. Cut: scatter-03.webp (same photo as gallery-02),
         scatter-06.png (CAD render with a fake dark wood texture), scatter-07.png
         (CAD screenshot with the view cube showing). Placement rewritten for
         what the remaining files actually are. */
      { src:"scatter-04.jpg", bleed:"right", span:6, ar:"4/3", mt:60,  cap:"Side panel" },
      { src:"scatter-05.jpg", cut:true, col:"2 / 8",           mt:100, cap:"Drawings" },
      { src:"scatter-08.jpg", bleed:"right", span:4, ar:"3/4", mt:40,  cap:"Plywood grain" }
    ],
    processNotes:[],
    processText:"The primary engineering challenge was bridging the gap between flat-pack efficiency and timelessness. The solution was perfecting the mechanical tension across the dowels.",
    processMore:"The structural frame relies on seven dowels, each precisely tapered from 1.25 inches down to 1 inch. Achieving this exact tolerance required multiple physical iterations on a table saw jig before moving to final CNC production. The resulting tension-clamped frame proves that high-quality, long-lasting furniture can still be flat-packed for efficient shipping and storage.",
    processBottomMore:"",
    processVideo: "",
    v2:        "V1 proved the tension-clamped frame holds up. V2 replaces the multi-dowel field with three dowels and a canvas sling, cutting weight, cost, and assembly time.",
    v2More:    "",
    v2images:  [{ src:"v2-01.jpg", bleed:"left", span:7, ar:"3/2" }],
    v2Video:   ""
  },

  "naf": {
    objects:   false,
    title:     "NAF",
    kind:      "crossflow desk fan",
    status:    "Prototype 01",
    code:      "H01.1",
    date:      "2025",
    teaser:    "Clean, quiet airflow in a continuous curtain.",
    summary:   "The desk fan has seen little fundamental change in years, often resulting in noisy, low-quality plastic disks. Taking formal cues from 1970s Braun design and industrial HVAC systems, NAF utilizes tangential crossflow technology. It pulls air in along its full length and pushes it out as one steady, quiet curtain, while looking like an object you'd want on your desk.",
    summaryMore:"",
    materials: "Sheet steel, PLA, rubber, reclaimed motor",
    lifecycle: "Built around a reclaimed motor and off-cut sheet steel. The turbine is a single printed part, so a damaged one can be printed again.",
    designTags:["Designed for disassembly", "Built from reclaimed parts"],
    size:      "4 in dia x 8 in tall (approx.)",
    price:     "",
    parts:     ["Housing", "Turbine", "Motor"],
    /* ALT TEXT. What each photo actually shows, for screen readers and for
       image search - these photographs are the portfolio, and an empty alt
       tells both of them the image is decorative. Keyed by filename so the
       gallery and process arrays stay as they are. A file with no entry
       here falls back to the project title. */
    alt: {
      "gallery-01.jpg": "NAF crossflow desk fan prototypes on a white plinth beside their spec card at a design show",
      "gallery-02.jpg": "A single red NAF crossflow desk fan photographed against a plain background",
      "gallery-03.jpg": "Three NAF crossflow fans in a row, two in brushed steel and one painted red",
      "gallery-04.jpg": "Four NAF fan bodies grouped together in brushed steel and painted red, seen from above",
      "hero.jpg": "The NAF crossflow desk fan in red, a perforated steel cylinder with a folded side vane",
      "scatter-01.jpg": "Steel offcuts and formed sheet on the workbench after rolling NAF's fan bodies",
      "scatter-02.jpg": "Flat steel blanks with a rule and layout tools, marked out before rolling",
      "scatter-03.jpg": "Reference: the Braun HL 70 desk fan from 1971, a yellow crossflow fan on a clear stand, the precedent NAF takes its cues from",
      "scatter-04.jpg": "NAF's impeller printing on the bed of a 3D printer",
      "scatter-05.jpg": "Cut steel discs and sheet stock for NAF laid out on the bench, including a perforated end cap",
      "scatter-06.jpg": "NAF's motor and wiring assembled inside a rolled steel fan body",
      "scatter-07.jpg": "Two steel sheets marked out with NAF's perforation drilling pattern",
      "scatter-08.jpg": "Rolled steel cylinders and end caps for NAF grouped on the bench mid-assembly",
      "scatter-09.jpg": "Three perforated steel NAF fan bodies standing together on the workbench",
      "scatter-10.jpg": "NAF assembly in progress: fan bodies, a motor and hand tools beside a laptop showing the CAD model",
      "scatter-11.jpg": "Sheets of dark rubber gasket material on a cutting mat during NAF's build",
      "scatter-12.jpg": "The finished NAF crossflow desk fans lined up, alternating brushed steel and painted red"
    },
    gallery:   ["hero.jpg", "gallery-01.jpg", "gallery-04.jpg"],   // 2026-10-02: gallery-02 cut (same shot as the hero, 820px); gallery-03 swapped for the tighter gallery-04
    heroVideo: "",
    galleryVideo: "",
    model:     "",
    modelRender: "",
    modelV2:   "",
    mechanism: "mechanism.html",   // 2026-10-02: crossflow vs axial airflow, top-down section
    hiwVideo:  "",
    howItWorks:"A custom crossflow turbine spans the housing, moving a high volume of air at a much lower RPM than a conventional fan, significantly reducing noise and motor strain.",
    howItWorksMore:"",
    components: [],
    mechNotes: [],
    process:   [
      /* 2026-10-02, pass 2 (Owen: simplify). 9 -> 7. Cut scatter-02 (blanks,
         same story as the off-cuts) and scatter-10 (cluttered modelling desk).
         The turbine print and the perforated sheets are now the two LARGE
         images (span 7); the rest sit smaller between them.
         scatter-03 is the BRAUN HL 70, shown as inspiration: showCap prints its
         caption under it so it is never read as a NAF prototype. */
      { src:"scatter-04.jpg", bleed:"left",  span:7, ar:"1/1", mt:0,   cap:"Turbine, printing" },
      { src:"scatter-01.jpg", col:"9 / 13",                    mt:70,  cap:"Off-cuts" },
      { src:"scatter-03.jpg", col:"2 / 6",                     mt:110, cap:"Reference: Braun HL 70 desk fan, 1971", showCap:true },
      { src:"scatter-07.jpg", bleed:"right", span:7, ar:"4/3", mt:50,  cap:"Perforation pattern" },
      { src:"scatter-08.jpg", bleed:"left",  span:6, ar:"3/2", mt:90,  cap:"Rolled housings and turbine" },
      { src:"scatter-06.jpg", col:"9 / 13",                    mt:110, cap:"Reclaimed motor" },
      { src:"scatter-12.jpg", bleed:"full", ar:"2/1", mt:90, cap:"Five colourways" }
    ],
    processNotes:[],
    processText:"NAF was developed under a strict material brief: source three reused or found materials within a 3 km radius of home. A reclaimed motor and off-cut sheet steel dictated the structural parameters.",
    processMore:"The core design constraint was the crossflow turbine. Unlike an axial fan that requires a large circular housing, the crossflow layout allowed the fan to take the shape of a tall, minimal cylinder. The steel housing was manually cut, punched, formed, and TIG welded. Countless variations of the turbine blade were modelled and 3D printed to solve balancing issues, eventually moving to a single-piece, support-free print to achieve the precision needed for smooth performance.",
    processVideo: "",
    v2:        "V2 moves to a purpose-built motor and turbine assembly. Once that core is solid, it becomes a shared platform, the same mechanism dropping into different housings without a redesign each time.",
    v2More:    "",
    v2images:  [{ src:"v2-01.jpg", bleed:"left", span:7, ar:"3/2" }],
    v2Video:   ""
  },

  "amsalp": {
    objects:   true,
    title:     "AMSALP",
    kind:      "plasma lamp",
    status:    "Prototype 01",
    code:      "L02.1",
    date:      "2026",
    teaser:    "Noble gas, wirelessly ionized into light.",
    summary:   "AMSALP explores gas discharge physics for residential lighting. By driving a high-frequency electromagnetic field into a sealed glass orb, noble gas is ionized into a glowing plasma. It feels like no other lamp and gives off a magical, wireless light from a seemingly empty globe.",
    summaryMore:"",
    materials: "Borosilicate glass, hardwood, plasma circuit",
    lifecycle: "The sealed orb has no wires or electrodes and simply lifts off its shelf. The electronics are housed separately in the wooden base.",
    designTags:[],
    size:      "8 x 4 x 4 in",
    price:     "",
    parts:     ["Glass envelope", "Hardwood base", "Driver"],
    /* ALT TEXT. What each photo actually shows, for screen readers and for
       image search - these photographs are the portfolio, and an empty alt
       tells both of them the image is decorative. Keyed by filename so the
       gallery and process arrays stay as they are. A file with no entry
       here falls back to the project title. */
    alt: {
      "gallery-01.jpg": "The AMSALP plasma lamp glowing orange, ionized noble gas filling the glass sphere and washing the hardwood base in red light",
      "gallery-02.jpg": "AMSALP glowing orange-white on its cantilevered wooden shelf, beside the perforated wooden base that houses and ventilates its resonant inverter",
      "gallery-03.jpg": "AMSALP running cooler, a ring of white plasma suspended inside the clear borosilicate orb with no electrode touching it",
      "gallery-04.jpg": "AMSALP lit in daylight: the glass orb on a cantilevered wooden shelf projecting from the ventilated hardwood base",
      "hero.jpg": "AMSALP wireless plasma lamp lit red-orange in darkness, a borosilicate glass orb of plasma resting in its hardwood cradle",
      "scatter-01.jpg": "A hand-wound copper resonator coil held beside AMSALP's high-frequency driver electronics on the workbench",
      "scatter-03.jpg": "AMSALP's resonator coil energised on the bench, a ring of blue-white plasma forming above the windings"
    },
    gallery:   ["hero.jpg", "gallery-01.jpg", "gallery-02.jpg", "gallery-03.jpg", "gallery-04.jpg"],
    heroVideo: "demo.mp4",
    galleryVideo: "",
    model:     "",
    modelRender: "",
    modelV2:   "",
    mechanism: "",
    hiwVideo:  "",
    howItWorks:"A shielded resonant inverter drives a high-frequency magnetic field into a glass sphere, exciting the low-pressure noble gas inside into a steady plasma glow.",
    howItWorksMore:"The core of the light is a solid-state resonant inverter circuit concealed within the wooden base. When the high-frequency field intersects with the sealed gas inside the orb, it excites the atoms into a plasma state. By cantilevering the coil and hiding all the electronics, the technology driving the lamp disappears, leaving only the illusion of a wireless glowing orb.",
    components: [],
    mechNotes: [],
    process:   [
      { src:"scatter-01.jpg", bleed:"right", span:7, ar:"3/2", mt:0,  cap:"Plasma toroid" },
      { src:"scatter-03.jpg", col:"1 / 7",            mt:80, cap:"Cove-mounted" }
    ],
    processNotes:[],
    processText:"The concept originated from a high-voltage science demonstration of a tokamak fusion reactor. The objective was to adapt this highly volatile, complex plasma toroid generator into a stable, quiet residential light.",
    processMore:"The primary engineering challenge was packaging and thermal management. The original off-the-shelf circuit board was visually cluttered and produced significant heat. The hardest compromise was ensuring the electronics were properly ventilated while completely hiding the induction coil to maintain the illusion of the floating orb. The circuit was consolidated and housed in a solid wood base with carefully engineered airflow routing.",
    processVideo: "",
    v2:        "AMSALP proves a stable plasma discharge can be used as a residential light. Next is designing a custom PCB to consolidate the electronics and coil into a single plane. The high-frequency circuit interferes with everything near it, so shielding is the next necessary step. The base will be made from a solid block of aluminum, doubling as a Faraday cage around the oscillator.",
    v2More:    "",
    v2images:  [{ src:"v2-01.jpg", bleed:"left", span:7, ar:"3/2" }],
    v2Video:   ""
  }

};
