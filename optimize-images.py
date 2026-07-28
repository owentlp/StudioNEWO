#!/usr/bin/env python3
"""
STUDIO NEWO image optimizer.

Your project JPG/PNGs are currently full camera resolution (some 5000-7000px,
up to 12MB each). Browsers display them at maybe 600-1400px. This downsizes and
recompresses every image under projects/ to web-sane dimensions and weight,
writing to projects_optimized/ so your originals are never touched.

Review the output, and if it looks right, replace projects/ with it.

Needs Pillow:  pip install pillow
Run:           python3 optimize-images.py
"""
import os, shutil
from PIL import Image

SRC = "projects"
OUT = "projects_optimized"
MAX_EDGE = 2000      # longest side in px (plenty for full-bleed on a 4k screen)
JPG_QUALITY = 82     # 80-85 is the sweet spot for photos
PASSTHROUGH = (".glb", ".html", ".svg", ".mp4", ".mov")

def process(src_path, out_path):
    ext = os.path.splitext(src_path)[1].lower()
    if ext in PASSTHROUGH:
        shutil.copy2(src_path, out_path)
        return 0, 0
    if ext not in (".jpg", ".jpeg", ".png"):
        shutil.copy2(src_path, out_path)
        return 0, 0
    before = os.path.getsize(src_path)
    im = Image.open(src_path)
    w, h = im.size
    scale = min(1.0, MAX_EDGE / max(w, h))
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    if ext == ".png":
        # keep PNG only if it actually has transparency (your cut-outs); else JPG
        if im.mode in ("RGBA", "LA") and im.getchannel("A").getextrema()[0] < 255:
            im.save(out_path, optimize=True)
        else:
            im.convert("RGB").save(out_path, "PNG", optimize=True)
    else:
        im.convert("RGB").save(out_path, "JPEG", quality=JPG_QUALITY,
                               optimize=True, progressive=True)
    after = os.path.getsize(out_path)
    return before, after

def main():
    if not os.path.isdir(SRC):
        print("No projects/ folder here. Run this from the site root.")
        return
    total_before = total_after = 0
    for root, _, files in os.walk(SRC):
        rel = os.path.relpath(root, SRC)
        out_dir = os.path.join(OUT, rel) if rel != "." else OUT
        os.makedirs(out_dir, exist_ok=True)
        for f in files:
            b, a = process(os.path.join(root, f), os.path.join(out_dir, f))
            total_before += b
            total_after += a
            if b and a:
                print(f"  {f:28s} {b/1048576:6.1f}MB -> {a/1048576:5.1f}MB")
    if total_before:
        print(f"\nImages: {total_before/1048576:.1f}MB -> {total_after/1048576:.1f}MB "
              f"({100*(1-total_after/total_before):.0f}% smaller)")
    print(f"\nWrote {OUT}/. Check it, then if happy:  rm -rf projects && mv {OUT} projects")

if __name__ == "__main__":
    main()
