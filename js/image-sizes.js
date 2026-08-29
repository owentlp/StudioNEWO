/* GENERATED FILE - do not edit by hand.
 * Rebuild with:  python make-image-variants.py
 *
 * Intrinsic pixel dimensions of every hero + gallery image, so the page can
 * reserve the right box BEFORE an image arrives. Without this the CSS-columns
 * gallery relays out as each thumb lands, which is the visible jumping.
 *
 * Paired with the sm/ (600px) and md/ (1200px) copies in each project folder:
 * the browser picks the smallest one that still covers the display size, and
 * falls back to the full-resolution original on high-DPR screens and in the
 * lightbox. Originals are never modified. See docs/HANDOFF.txt, RESPONSIVE
 * IMAGES, for the whole picture. */
const IMG_SIZES = {
  "amsalp": {"gallery-01.jpg":[2400,1800],"gallery-02.jpg":[2400,1800],"gallery-03.jpg":[2400,1800],"gallery-04.jpg":[2400,1800],"hero.jpg":[2000,1333]},
  "kart": {"gallery-01.jpg":[1500,2000],"gallery-02.jpg":[1500,2000],"gallery-03.jpg":[1500,2000],"gallery-04.jpg":[2000,1500],"gallery-05.jpg":[1426,1902],"hero.jpg":[1500,1125]},
  "naf": {"gallery-01.jpg":[2400,1200],"gallery-02.jpg":[820,1094],"gallery-03.jpg":[1466,1099],"gallery-04.jpg":[1315,877],"hero.jpg":[2048,1536]},
  "neb": {"gallery-01.jpg":[2000,1500],"gallery-02.jpg":[2000,1500],"gallery-03.jpg":[2000,1500],"gallery-04.jpg":[2000,1500],"gallery-05.jpg":[2000,1500],"gallery-06.jpg":[2000,1500],"hero.jpg":[2000,1500]},
  "omni": {"gallery-01.jpg":[2400,1800],"gallery-02.jpg":[2400,1800],"gallery-03.jpg":[2400,1800],"gallery-04.jpg":[1800,2400],"hero.jpg":[2400,1800]},
};
