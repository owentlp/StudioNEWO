/* ============================================================
   SOLUTIONS · edit this file only for solutions.html.
   One object per row of the table, top to bottom in this order.
   Files live in solutions/ (PDF, cover image) and solutions/sm/
   (the 640px copy of the cover image, used in the table).

   FIELDS (leave "" to hide that piece):
     id        short slug, also the #anchor (solutions.html#loots)
     title     the name, shown in caps
     what      one line saying what it is
     type      small label (Proposal, Research + prototype ...)
     year      "2025"
     summary   one sentence, shown in the closed row
     abstract  2-4 sentences, shown when the row is opened
     credits   "" or e.g. "With Finlay Brodylo and Noah McBriar"
     pdf       file name in solutions/
     pdfMB     size shown on the button, e.g. "3.7"
     video     YouTube video ID only (the bit after watch?v=), or ""
     image     cover file name in solutions/ and solutions/sm/
     alt       description of the cover image

   ADDING A ROW: drop the PDF and a cover JPG into solutions/, make the
   640px copy in solutions/sm/ (same name), add an object below, bump
   solutions-data.js ?v= in solutions.html.
   ============================================================ */
const SOLUTIONS = [
  {
    id: "sonic-touch",
    title: "Sonic Touch",
    what: "A multi-sensory music remote for people living with dementia",
    type: "Research + prototype",
    year: "2025",
    summary: "A handheld cherry bowl that answers touch with sound, light and vibration, so residents can start an activity on their own.",
    abstract: "On Baycrest's Possibilities Floor, residents living with dementia rely on care staff to prompt almost every activity, which is tiring for staff and can feel infantilizing for residents. Sonic Touch is lathe-turned from cherry, with five felt touch zones framing copper sensors: four play notes and one changes the mode. A hand resting on any zone gets an instant response, so cause and effect is obvious and no fine motor control is needed. Built as a working prototype and tested with residents and staff.",
    credits: "With Finlay Brodylo and Noah McBriar",
    pdf: "sonic-touch.pdf",
    pdfMB: "1.7",
    video: "v3q0BAfEyOM",
    image: "sonic-touch.jpg",
    alt: "Sonic Touch, a turned cherry bowl with orange, purple, yellow, pink and black felt touch patches, each framing a copper sensor"
  },
  {
    id: "loots",
    title: "LOOTS",
    what: "A collapsible stool from dimensional lumber",
    type: "Design for disassembly",
    year: "2025",
    summary: "Two lumber sizes and five part types: a stool designed from the first cut to be taken apart.",
    abstract: "A stool built from 1x3 and 1x12 lumber with straight cuts only, so it can be made with basic tools. Screws are the only fasteners: it comes apart into a top and two sides for storage or transport, and every part unscrews back to its original cut length to be reused. Sturdy, light and easy to align using the other parts and a flat surface as the reference. Exhibited at the Design for Disassembly Exhibition, April 2025.",
    credits: "",
    pdf: "loots.pdf",
    pdfMB: "2.7",
    video: "",
    image: "loots.jpg",
    alt: "The LOOTS stool in stained lumber on display at the Design for Disassembly Exhibition"
  },
  {
    id: "vacancy-to-value",
    title: "Vacancy to Value",
    what: "Non-fare revenue proposal for the TTC",
    type: "Feasibility proposal",
    year: "2026",
    summary: "Turning the dead booths, payphone alcoves and empty storefronts inside TTC fare-paid zones into small, TTC-run utility retail.",
    abstract: "Decommissioned booths and vacant retail sit dark across the subway network, and under CPTED (crime prevention through environmental design) empty space invites the conditions riders worry about most. Station retail earns the TTC about a quarter of a cent per ride, while its advertising per ride is already close to Hong Kong's MTR. This proposal pitches a three-phase feasibility study: a spatial audit of dormant footprints, a benchmark of owned versus leased station retail and a full-scale prototype of one module. One intervention, four returns: revenue, rider satisfaction, ridership and safety.",
    credits: "",
    pdf: "vacancy-to-value.pdf",
    pdfMB: "3.1",
    video: "",
    image: "vacancy-to-value.jpg",
    alt: "A Toronto subway station concourse with an unused red fare booth beside the fare gates"
  }
];


/* ============================================================
   SERVICES · the "Work with the studio" block at the top of solutions.html.
   One object per row. `from` is the starting price in CAD shown in the last
   column; set it to "" to show "Quote" instead. `time` is the usual duration.
   RATES and TERMS are the two short lines under the table.
   Edit the numbers here only; bump solutions-data.js ?v= in
   tools/pages/solutions.meta.json and re-run tools/make-simple-page.py.
   ============================================================ */
const SERVICES = [
  { name: "Product renders",
    what: "Your CAD in, studio-lit stills out, one lighting setup and colour grade across the whole series. Three stills minimum, five for $600.",
    time: "2 to 3 weeks", from: "150 / still" },
  { name: "Animation",
    what: "A 10 to 20 second turntable or exploded-view clip. $350 when added to a render set.",
    time: "2 to 3 weeks", from: "500 / clip" },
  { name: "Launch bundle",
    what: "Five stills, one clip and a 3D model that runs on your product page, in the browser or in AR. Built for Kickstarter and product launches.",
    time: "2 to 3 weeks", from: "1,500" },
  { name: "Drawing package",
    what: "Your 3D model in; PDF production drawings, DXF flat patterns and STEP files out. Three sheets minimum.",
    time: "2 to 3 weeks", from: "100 / sheet" },
  { name: "CAD cleanup and DFM pass",
    what: "Messy or STEP-only parts rebuilt as clean SolidWorks, with draft, walls, bends, fasteners and inserts fixed for manufacture, and a bill of materials. Quoted as a fixed price after seeing the files, at $55 an hour.",
    time: "By scope", from: "55 / hour" },
  /* 2026-10-26 review: custom work had no home on the site except a line on
     the contact page. No price: quoted per piece. Delete this row to drop it. */
  { name: "Custom piece",
    what: "Custom versions of any studio product in another size, material or finish are made to order. So are furniture and lighting designed from scratch.",
    time: "By scope", from: "" },
  /* 2026-11-03 (Q4): the work Selected work shows (Sonic Touch, LOOTS) had no
     row of its own. Quoted per job, like Custom piece. */
  { name: "Design and prototype",
    what: "From a brief to a tested prototype: research, concept, CAD and a working model.",
    time: "By scope", from: "" }
];
const SERVICE_RATES = "Prices are starting points, in Canadian dollars. US clients pay the same figures in US dollars. Every job gets a written scope and a fixed price before work starts. Drawings are not engineer-stamped.";
const SERVICE_TERMS = "Final files are released once the last invoice is paid. One job at a time, so each gets full attention.";
