/* GENERATED FILE - do not edit by hand.
 * Rebuild with:  python tools/make-image-variants.py
 *
 * Intrinsic pixel dimensions of every hero, gallery AND scatter image, so the
 * page can reserve the right box BEFORE an image arrives. Without this the
 * CSS-columns gallery relays out as each thumb lands (the visible jumping).
 *
 * Entry: [width, height] or [width, height, "tiers"]. Without the third
 * element, the sm/ (600px) copy exists when width > 600 and the md/ (1200px)
 * copy when width > 1200. With it, only the tiers named exist ("sm", "md",
 * "sm md" or "" for none): a copy that came out no smaller than its original
 * is not kept. Originals are never modified. See docs/HANDOFF.txt,
 * RESPONSIVE IMAGES. */
const IMG_SIZES = {
  "flow": {"gallery-01.jpg":[2400,1200],"gallery-04.jpg":[1315,877],"hero.jpg":[2048,1536],"scatter-01.jpg":[1186,1186],"scatter-03.jpg":[1400,1866],"scatter-04.jpg":[1384,1384],"scatter-06.jpg":[1012,1012],"scatter-07.jpg":[1488,1116],"scatter-08.jpg":[2010,1340],"scatter-12.jpg":[1847,923]},
  "halo": {"demo-poster.jpg":[1280,720,"sm"],"gallery-01.jpg":[2400,1800],"gallery-02.jpg":[2400,1800],"gallery-03.jpg":[2400,1800],"gallery-04.jpg":[2400,1800],"hero.jpg":[2000,1333],"scatter-01.jpg":[2400,1800],"scatter-03.jpg":[2400,1800]},
  "kart": {"demo-poster.jpg":[1280,720,"sm"],"gallery-01.jpg":[1500,2000],"gallery-02.jpg":[1500,2000],"gallery-03.jpg":[1500,2000],"gallery-04.jpg":[2000,1500],"gallery-05.jpg":[1426,1902],"hero.jpg":[1500,1125],"scatter-01.jpg":[2000,1500],"scatter-02.webp":[2000,1141],"scatter-03.jpg":[1200,1200],"scatter-04.webp":[2000,2000],"scatter-05.webp":[2000,1500],"scatter-06.jpg":[2000,1500]},
  "neb": {"gallery-01.jpg":[2000,1500],"gallery-02.jpg":[2000,1500],"gallery-03.jpg":[2000,1500],"gallery-04.jpg":[2000,1500],"hero.jpg":[2000,1500],"scatter-01.jpg":[2000,1621],"scatter-04.jpg":[2000,1500],"scatter-05.jpg":[1105,552],"scatter-08.jpg":[1641,820]},
  "omni": {"gallery-01.jpg":[2400,1800],"gallery-02.jpg":[2400,1800],"gallery-03.jpg":[2400,1800],"gallery-04.jpg":[1800,2400],"hero.jpg":[2400,1800],"scatter-01.jpg":[1186,889],"scatter-02.jpg":[2029,1522],"scatter-03.jpg":[1999,999],"scatter-05.jpg":[1504,1128]},
};
