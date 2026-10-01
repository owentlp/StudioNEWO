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
    id: "vacancy-to-value",
    title: "Vacancy to Value",
    what: "Non-fare revenue proposal for the TTC",
    type: "Feasibility proposal",
    year: "2026",
    summary: "Turning the dead booths, payphone alcoves and empty storefronts inside TTC fare-paid zones into small, TTC-run utility retail.",
    abstract: "Decommissioned booths and vacant retail sit dark across the subway network, and under CPTED principles empty space invites exactly the conditions riders worry about most. Station retail earns the TTC about a quarter of a cent per ride, while its advertising per ride is already close to Hong Kong's MTR. This proposal pitches a three-phase feasibility study: a spatial audit of dormant footprints, a benchmark of owned versus leased station retail, and a full-scale prototype of one module. One intervention, four returns: revenue, rider satisfaction, ridership and safety.",
    credits: "",
    pdf: "vacancy-to-value.pdf",
    pdfMB: "3.1",
    video: "",
    image: "vacancy-to-value.jpg",
    alt: "A Toronto subway station concourse with an unused red fare booth beside the fare gates"
  },
  {
    id: "sonic-touch",
    title: "Sonic Touch",
    what: "A multi-sensory music remote for people living with dementia",
    type: "Research + prototype",
    year: "2025",
    summary: "A handheld cherry bowl that answers touch with sound, light and vibration, so residents can start an activity on their own.",
    abstract: "On Baycrest's Possibilities Floor, residents living with dementia rely on care staff to prompt almost every activity, which is tiring for staff and can feel infantilizing for residents. Sonic Touch is a lathe-turned cherry bowl with four felt touch zones framing copper sensors. Resting a hand on any zone plays a tone, lights an LED and vibrates, so cause and effect is obvious and no fine motor control is needed. Built as a working prototype and tested with residents and staff.",
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
    summary: "Two lumber sizes, five part types, straight cuts and screws only. Breaks down into three pieces, and back to its original cut lengths.",
    abstract: "A stool built from 1x3 and 1x12 lumber with straight cuts only, so it can be made with basic tools. Screws are the only fasteners: it comes apart into a top and two sides for storage or transport, and every part unscrews back to its original cut length to be reused. Sturdy, light, and easy to align using the other parts and a flat surface as the reference. Exhibited at the Design for Disassembly Exhibition, April 2025.",
    credits: "",
    pdf: "loots.pdf",
    pdfMB: "2.7",
    video: "",
    image: "loots.jpg",
    alt: "The LOOTS stool in stained lumber on display at the Design for Disassembly Exhibition"
  }
];
