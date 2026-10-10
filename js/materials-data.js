/* ============================================================
   MATERIAL INDEX · edit this file only for materials.html.
   Structure is three levels: CATEGORY -> GROUP (dropdown) -> MATERIAL.

     CATEGORY  { label, slug, swatch, image, intro{...}, groups[] }
       image   category hero photo (e.g. a tree for WOOD, ore for METAL),
       imageCaption  two words under the photo when the category is open,
               dropped in materials/<file>. Until the file exists a plain
               colour swatch shows in its place (onerror fallback), so a
               missing photo never breaks the page.
       swatch  colour family used for that fallback and the material
               thumbnails in this category: wood | metal | bio | glass |
               plastic | soft.
       take    one or two lines on how the studio uses this kind of material,
               shown beside the photo (rewritten 2026-10-08 around lifespan,
               use and environmental impact; no material is ruled in or out).
       intro   { properties, finishes, lifecycle } - the technical notes behind
               the category's info icon. Any can be "" and it is skipped.
               lifecycle shows as "End of life".

     GROUP     { label, properties, bestUses, lifecycle, items[] }
       properties / bestUses / lifecycle show behind the info icon of every
       material in the group; leave "" to skip.

     MATERIAL  { name, slug, used, image, usedIn[], aliases[], copy }
       used    IGNORED since 2026-10-01: materials.html works out which
               materials are in use from the project chips in
               js/projects-data.js. Safe to leave as is.
       image   small thumbnail in materials/<file>; colour swatch fallback
               if absent, same as the category image.
       usedIn  IGNORED since 2026-10-01, derived the same way as `used`.
       aliases optional extra names a project's material chip might use, so
               the chip on a project page can still deep-link here even when
               the chip word differs from `name`.
       copy    the material description, one or two lines. Always visible.
       origin  optional, behind the material's info icon: where it comes
               from (species origin, mill, supplier, recycled content).
       details optional, behind the info icon: anything more specific.
   ============================================================ */
const MATERIAL_CATEGORIES = [
  {
    label: "WOOD", slug: "wood", swatch: "wood", image: "cat-wood.jpg", imageCaption: "Tree bark",
    take: "Solid wood where a product is handled every day and can be sanded and refinished for decades. Plywood where stiffness and flatness matter more.",
    intro: {
      properties: "Cellular structure that expands and contracts with ambient humidity. High tensile and compressive strength parallel to the grain.",
      finishes:   "Penetrating oils or hard waxes, so a worn surface can be sanded locally and refinished.",
      lifecycle:  "Biodegradable and carbon-sequestering if finished naturally. Bonded composites such as plywood cannot be composted."
    },
    groups: [
      {
        label: "Hardwood",
        properties: "Dense, slow-growing. High impact resistance.",
        bestUses:   "Load-bearing frames, wear surfaces, acoustic enclosures.",
        lifecycle:  "",
        items: [
          { name:"Purpleheart", slug:"purpleheart", used:true, image:"purpleheart.jpg", usedIn:[{id:"omni",title:"OMNI"}], aliases:[],
            copy:"Exceptionally high density and stiffness. Oxidizes to deep purple with UV exposure. Mass and stiffness suit speaker enclosures." },
          { name:"Cherry", slug:"cherry", used:true, image:"cherry.jpg", usedIn:[{id:"kart",title:"KART"}], aliases:[],
            copy:"Medium density, uniform grain. Darkens with UV exposure. High machinability." },
          { name:"Walnut", slug:"walnut", used:false, image:"walnut.jpg", usedIn:[], aliases:[],
            copy:"High shock resistance, dimensionally stable. Ideal for complex CNC joinery." },
          { name:"Maple", slug:"maple", used:false, image:"maple.jpg", usedIn:[], aliases:[],
            copy:"High density, closed grain. Holds tapped threads well for direct mechanical connections." },
          { name:"Oak", slug:"oak", used:false, image:"oak.jpg", usedIn:[], aliases:[],
            copy:"Prominent open grain. High durability for heavy-use friction surfaces." }
        ]
      },
      {
        label: "Softwood",
        properties: "Fast-growing, lower density. Easily dented.",
        bestUses:   "Hidden structural framing, rapid volumetric prototyping, sacrificial jigs.",
        lifecycle:  "",
        items: [
          { name:"Pine / Spruce", slug:"pine-spruce", used:false, image:"pine-spruce.jpg", usedIn:[], aliases:[],
            copy:"High strength-to-weight ratio. Prone to tear-out during machining." }
        ]
      },
      {
        label: "Composites",
        properties: "Engineered wood fiber and adhesives. More dimensionally stable than solid wood (resists warping).",
        bestUses:   "",
        lifecycle:  "Bonded with adhesives, so it cannot be composted. Used where solid wood would warp, split or move too much.",
        items: [
          { name:"Baltic birch plywood", slug:"baltic-birch-plywood", used:true, image:"baltic-birch.jpg", usedIn:[{id:"neb",title:"NEB"}], aliases:["birch plywood"],
            copy:"Void-free cross-banded layers. High structural rigidity for tension mechanics. Edges can remain exposed." },
          { name:"MDF", slug:"mdf", used:false, image:"mdf.jpg", usedIn:[], aliases:[],
            copy:"Medium density fiberboard. Heavy, isotropic. Poor moisture resistance. Its binders make clean disposal difficult." }
        ]
      }
    ]
  },

  {
    label: "METAL", slug: "metal", swatch: "metal", image: "cat-metal.jpg", imageCaption: "Iron ore",
    take: "Energy-intensive to make and close to endlessly recyclable. Used where strength, heat or weight keep a product working for years, long enough to pay that energy back.",
    intro: {
      properties: "Isotropic structure. High tensile and yield strength. Highly thermally and electrically conductive.",
      finishes:   "",
      lifecycle:  "Recyclable again and again without loss of quality. High embodied energy, offset by a long service life."
    },
    groups: [
      {
        label: "Aluminum",
        properties: "Low weight, non-magnetic. Naturally forms a protective oxide layer against corrosion.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Cast aluminum (A356)", slug:"cast-aluminum", used:true, image:"aluminum-cast.jpg", usedIn:[{id:"omni",title:"OMNI"}], aliases:["cast aluminum"],
            copy:"Granular finish. High thermal conductivity. Ideal for acoustic diffusion or heat sinking." },
          { name:"Machined aluminum (6061/7075)", slug:"machined-aluminum", used:false, image:"aluminum-machined.jpg", usedIn:[], aliases:["machined aluminum","aluminum"],
            copy:"High precision tolerances. Used for structural standoffs and rigid chassis." }
        ]
      },
      {
        label: "Steel",
        properties: "Heavy, magnetic, high tensile strength. Requires finishing to prevent oxidation.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Mild sheet steel", slug:"mild-sheet-steel", used:true, image:"steel-mild.jpg", usedIn:[{id:"flow",title:"FLOW"}], aliases:["sheet steel","steel"],
            copy:"Formable, punches clean, welds easily via TIG/MIG. Used for folded housings and weighted bases." },
          { name:"Stainless steel", slug:"stainless-steel", used:false, image:"steel-stainless.jpg", usedIn:[], aliases:[],
            copy:"High rust resistance. Used for exposed hardware and high-moisture environments." }
        ]
      }
    ]
  },

  {
    label: "BIO MATERIALS", slug: "bio", swatch: "bio", image: "cat-bio.jpg", imageCaption: "Plant fiber",
    take: "Grown rather than mined. Used where the way it wears and ages suits the product, treated only as much as that life needs.",
    intro: {
      properties: "Derived from renewable biomass. Requires chemical or organic treatment to prevent decay during use.",
      finishes:   "",
      lifecycle:  "Compostable only if processed without heavy metals or toxic binders."
    },
    groups: [
      {
        label: "Leather",
        properties: "High tensile strength. Molds permanently under prolonged tension.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Vegetable-tanned leather", slug:"vegetable-tanned-leather", used:false, image:"leather-veg.jpg", usedIn:[], aliases:[],
            copy:"Tanned using natural organic tannins. Biodegradable." },
        ]
      }
    ]
  },

  {
    label: "GLASS", slug: "glass", swatch: "glass", image: "cat-glass.jpg", imageCaption: "Silica sand",
    take: "Used where light has to pass through or be softened. Glass outlasts almost anything if it is not broken, and recycles cleanly when sorted by type.",
    intro: {
      properties: "High compressive strength, scratch-resistant, brittle against impact.",
      finishes:   "",
      lifecycle:  "Recyclable without loss of quality if sorted by chemical formulation."
    },
    groups: [
      {
        label: "Soda-lime",
        properties: "Standard commercial glass composition.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Frosted glass", slug:"frosted-glass", used:true, image:"frosted-glass.jpg", usedIn:[{id:"kart",title:"KART"}], aliases:["frosted"],
            copy:"Acid-etched or sandblasted. Diffuses light output to eliminate LED hot spots." }
        ]
      },
      {
        label: "Borosilicate",
        properties: "Low coefficient of thermal expansion. Highly resistant to thermal shock.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Borosilicate glass", slug:"borosilicate-glass", used:false, image:"borosilicate.jpg", usedIn:[], aliases:["clear borosilicate"],
            copy:"Used for components housed near heat sources or high-frequency fields." }
        ]
      }
    ]
  },

  {
    label: "PLASTICS", slug: "plastics", swatch: "plastic", image: "cat-plastics.jpg", imageCaption: "Plastic regrind",
    take: "Used where it performs best: precise, light and quick to remake. Printed parts are kept small and easy to reprint, so one broken part does not end the product.",
    intro: {
      properties: "Moldable synthetic polymers.",
      finishes:   "",
      lifecycle:  "Recyclable only when parts come apart cleanly and are sorted by type. Mechanical fasteners are used over adhesives wherever they can be."
    },
    groups: [
      {
        label: "Thermoplastics",
        properties: "Melts when heated, solidifies upon cooling.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"PLA", slug:"pla", used:true, image:"pla.jpg", usedIn:[{id:"flow",title:"FLOW"},{id:"kart",title:"KART"}], aliases:["polylactic acid"],
            copy:"Polylactic acid, a bio-based thermoplastic. Low glass transition temperature. Ideal for rapid prototyping and internal brackets. Requires industrial facilities to compost." },
          { name:"ABS / PETG", slug:"abs-petg", used:false, image:"abs-petg.jpg", usedIn:[], aliases:[],
            copy:"High impact and heat resistance. Used for functional parts requiring structural flexibility." },
        ]
      }
    ]
  },

  {
    label: "SOFT GOODS", slug: "soft-goods", swatch: "soft", image: "cat-soft.jpg", imageCaption: "Wound thread",
    take: "Fabric wears faster than the frame around it, so it is made to come off for washing or replacement.",
    intro: {
      properties: "Woven or extruded fibers. Requires tension or a skeletal frame for structure.",
      finishes:   "",
      lifecycle:  "Natural fibers decompose. Synthetics shed microplastics and are difficult to recycle."
    },
    groups: [
      {
        label: "Textiles",
        properties: "Woven planar fabrics.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Heavyweight canvas", slug:"canvas", used:true, image:"canvas.jpg", usedIn:[{id:"neb",title:"NEB"}], aliases:["canvas","heavyweight canvas (cotton)"],
            copy:"Cotton. Breathable, high tensile strength. Used for suspended sling seating. Easily removable for washing or replacement." },
        ]
      },
      {
        label: "Foam",
        properties: "Cellular polymers for cushioning.",
        bestUses:   "",
        lifecycle:  "Slow to degrade and difficult to recycle, so it is kept replaceable on its own.",
        items: [
          { name:"Polyurethane foam", slug:"polyurethane-foam", used:false, image:"foam.jpg", usedIn:[], aliases:["foam"],
            copy:"Industry standard. Designed around pre-cut, standard block sizes, so foam can be replaced locally without a proprietary order." }
        ]
      }
    ]
  }
];
