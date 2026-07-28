/* ============================================================
   MATERIAL INDEX · edit this file only for materials.html.
   Structure is three levels: CATEGORY -> GROUP (dropdown) -> MATERIAL.

     CATEGORY  { label, slug, swatch, image, intro{...}, groups[] }
       image   category hero photo (e.g. a tree for WOOD, ore for METAL),
               dropped in materials/<file>. Until the file exists a plain
               colour swatch shows in its place (onerror fallback), so a
               missing photo never breaks the page.
       swatch  colour family used for that fallback and the material
               thumbnails in this category: wood | metal | bio | glass |
               plastic | soft.
       intro   { properties, finishes, lifecycle } - any of these can be ""
               and it is skipped. Shown at the top of the open category.

     GROUP     { label, properties, bestUses, lifecycle, items[] }
       properties / bestUses / lifecycle are short lines shown under the
       group heading; leave "" to skip.

     MATERIAL  { name, slug, used, image, usedIn[], aliases[], copy }
       used    true if it is currently in a Studio NEWO product (an "In use"
               mark shows). Mirrors the asterisks in the copy.
       image   small thumbnail in materials/<file>; colour swatch fallback
               if absent, same as the category image.
       usedIn  [{id,title}] links back to the project(s) using it (only the
               in-use materials have these).
       aliases optional extra names a project's material chip might use, so
               the chip on a project page can still deep-link here even when
               the chip word differs from `name`.
       copy    the material description, one or two lines.
   ============================================================ */
const MATERIAL_CATEGORIES = [
  {
    label: "WOOD", slug: "wood", swatch: "wood", image: "cat-wood.jpg",
    intro: {
      properties: "Cellular structure that expands and contracts with ambient humidity. High tensile and compressive strength parallel to the grain.",
      finishes:   "Penetrating oils or hard waxes. Polyurethane is avoided to allow for localized sanding and clean composting.",
      lifecycle:  "Biodegradable and carbon-sequestering if finished naturally."
    },
    groups: [
      {
        label: "Hardwood",
        properties: "Dense, slow-growing. High impact resistance.",
        bestUses:   "Load-bearing frames, wear surfaces, acoustic enclosures.",
        lifecycle:  "",
        items: [
          { name:"Purpleheart", slug:"purpleheart", used:true, image:"purpleheart.jpg", usedIn:[{id:"omni",title:"OMNI"}], aliases:[],
            copy:"Exceptionally high density and stiffness. Oxidizes to deep purple with UV exposure. High acoustic resonance." },
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
        properties: "Engineered wood fiber and adhesives. Isotropic dimensional stability (resists warping).",
        bestUses:   "",
        lifecycle:  "Adhesives prevent clean composting. Destined for landfill. Used strictly when solid wood fails engineering constraints.",
        items: [
          { name:"Baltic birch plywood", slug:"baltic-birch-plywood", used:true, image:"baltic-birch.jpg", usedIn:[{id:"neb",title:"NEB"}], aliases:["birch plywood"],
            copy:"Void-free cross-banded layers. High structural rigidity for tension mechanics. Edges can remain exposed." },
          { name:"MDF", slug:"mdf", used:false, image:"mdf.jpg", usedIn:[], aliases:[],
            copy:"Medium density fiberboard. Heavy, isotropic. Poor moisture resistance and relies on toxic binders. Avoided." }
        ]
      }
    ]
  },

  {
    label: "METAL", slug: "metal", swatch: "metal", image: "cat-metal.jpg",
    intro: {
      properties: "Isotropic structure. High tensile and yield strength. Highly thermally and electrically conductive.",
      finishes:   "",
      lifecycle:  "Infinitely recyclable. High initial embodied energy, offset by extreme longevity."
    },
    groups: [
      {
        label: "Aluminum",
        properties: "Low weight, non-magnetic. Naturally forms a protective oxide layer against corrosion.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Cast aluminum (A356)", slug:"cast-aluminum", used:true, image:"aluminum-cast.jpg", usedIn:[{id:"omni",title:"OMNI"}], aliases:["cast aluminum","aluminum"],
            copy:"Granular finish. High thermal conductivity. Ideal for acoustic diffusion or heat sinking." },
          { name:"Machined aluminum (6061/7075)", slug:"machined-aluminum", used:false, image:"aluminum-machined.jpg", usedIn:[], aliases:["machined aluminum"],
            copy:"High precision tolerances. Used for structural standoffs and rigid chassis." }
        ]
      },
      {
        label: "Steel",
        properties: "Heavy, magnetic, high tensile strength. Requires finishing to prevent oxidation.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Mild sheet steel", slug:"mild-sheet-steel", used:true, image:"steel-mild.jpg", usedIn:[{id:"naf",title:"NAF"}], aliases:["sheet steel","steel"],
            copy:"Formable, punches clean, welds easily via TIG/MIG. Used for folded housings and weighted bases." },
          { name:"Stainless steel", slug:"stainless-steel", used:false, image:"steel-stainless.jpg", usedIn:[], aliases:[],
            copy:"High rust resistance. Used for exposed hardware and high-moisture environments." }
        ]
      },
      {
        label: "Brass & Copper",
        properties: "Dense, naturally antimicrobial. Develops surface patina via oxidation.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Brass", slug:"brass", used:false, image:"brass.jpg", usedIn:[], aliases:[],
            copy:"Low friction coefficient. Ideal for mechanical pivot points and threaded inserts." }
        ]
      }
    ]
  },

  {
    label: "BIO MATERIALS", slug: "bio", swatch: "bio", image: "cat-bio.jpg",
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
            copy:"Tanned using natural organic tannins. 100% biodegradable." },
          { name:"Chrome-tanned leather", slug:"chrome-tanned-leather", used:false, image:"leather-chrome.jpg", usedIn:[], aliases:[],
            copy:"Highly water-resistant but relies on heavy metals during tanning. Avoided." }
        ]
      },
      {
        label: "Bio-plastics",
        properties: "Polymers derived from biological sources rather than petroleum.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Cellulose acetate", slug:"cellulose-acetate", used:false, image:"cellulose-acetate.jpg", usedIn:[], aliases:[],
            copy:"Derived from wood pulp or cotton linters. High impact resistance. Easily machined and polished. Slowly biodegradable under natural conditions." },
          { name:"PHA", slug:"pha", used:false, image:"pha.jpg", usedIn:[], aliases:["polyhydroxyalkanoate"],
            copy:"Polyhydroxyalkanoate, a thermoplastic synthesized by microbial fermentation. Extrudable for 3D printing. Unlike PLA, it is fully marine and soil biodegradable, breaking down naturally without industrial heating facilities." }
        ]
      },
      {
        label: "Bio-composites",
        properties: "Natural fibers or structures bound together using biological processes.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"Mycelium composite", slug:"mycelium", used:false, image:"mycelium.jpg", usedIn:[], aliases:[],
            copy:"Fungal root networks grown through agricultural waste. Lightweight, fire-resistant, and high acoustic absorption. Fully home-compostable." },
          { name:"Linoleum", slug:"linoleum", used:false, image:"linoleum.jpg", usedIn:[], aliases:[],
            copy:"Cured mixture of oxidized linseed oil, pine rosin, and wood flour on a jute backing. High wear and friction resistance. 100% biodegradable." }
        ]
      }
    ]
  },

  {
    label: "GLASS", slug: "glass", swatch: "glass", image: "cat-glass.jpg",
    intro: {
      properties: "High compressive strength, scratch-resistant, brittle against impact.",
      finishes:   "",
      lifecycle:  "100% recyclable if sorted by chemical formulation."
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
    label: "PLASTICS", slug: "plastics", swatch: "plastic", image: "cat-plastics.jpg",
    intro: {
      properties: "Moldable synthetic polymers.",
      finishes:   "",
      lifecycle:  "Generally anti-circular. We strictly use mechanical fasteners over adhesives to ensure parts can be separated for recycling."
    },
    groups: [
      {
        label: "Thermoplastics",
        properties: "Melts when heated, solidifies upon cooling.",
        bestUses:   "",
        lifecycle:  "",
        items: [
          { name:"PLA", slug:"pla", used:true, image:"pla.jpg", usedIn:[{id:"naf",title:"NAF"},{id:"kart",title:"KART"}], aliases:["polylactic acid"],
            copy:"Polylactic acid, a bio-based thermoplastic. Low glass transition temperature. Ideal for rapid prototyping and internal brackets. Requires industrial facilities to compost." },
          { name:"ABS / PETG", slug:"abs-petg", used:false, image:"abs-petg.jpg", usedIn:[], aliases:[],
            copy:"High impact and heat resistance. Used for functional parts requiring structural flexibility." },
          { name:"Acrylic", slug:"acrylic", used:false, image:"acrylic.jpg", usedIn:[], aliases:[],
            copy:"Optically clear, rigid. Shatters rather than bends." }
        ]
      }
    ]
  },

  {
    label: "SOFT GOODS", slug: "soft-goods", swatch: "soft", image: "cat-soft.jpg",
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
          { name:"Wool", slug:"wool", used:false, image:"wool.jpg", usedIn:[], aliases:[],
            copy:"Naturally flame-retardant and temperature-regulating." }
        ]
      },
      {
        label: "Foam",
        properties: "Cellular polymers for cushioning.",
        bestUses:   "",
        lifecycle:  "High degradation time. Difficult to recycle.",
        items: [
          { name:"Polyurethane foam", slug:"polyurethane-foam", used:false, image:"foam.jpg", usedIn:[], aliases:["foam"],
            copy:"Industry standard. We design strictly around pre-cut, standard block dimensions to allow users to replace foam locally without proprietary orders." }
        ]
      }
    ]
  }
];
