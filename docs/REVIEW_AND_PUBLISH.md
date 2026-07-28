# Studio NEWO — Site Review & Publishing Guide

_Reviewed 2026-07-28._

---

## 1. Overall verdict

The site is in good shape. The code is clean, well-commented, and built the way a static site should be: no framework bloat, hand-written HTML/CSS/vanilla JS, sensible cache-busting, real SEO tags, structured data, accessibility (skip links, aria labels, focus states), lazy-loaded images, and a lazy 3D library that only loads on projects that need it. Every image, video, and model referenced in the data files actually exists on disk. Nothing is broken.

The main thing standing between you and a fast site is asset weight (videos and a few oversized images), not code. Details below.

---

## 2. Fixes I already made

These were small and safe, so they are done:

1. **Cache-version drift.** `index.html` was loading `projects-data.js?v=3` while every other page loaded `?v=8`. If you changed that data file, returning home-page visitors could see a stale copy. Bumped index to `?v=8` so all pages match.
2. **robots.txt would not have deployed.** Your `.gitignore` ignores `*.txt` (correct, that keeps your reference docs private). But that rule also caught `robots.txt`, which search engines need. Added an exception so `robots.txt` still ships.
3. **Stray `$null` file.** A zero-byte file named `$null` (left by a mistyped PowerShell command) sat in the root. Deletion is blocked in my environment, so I added it to `cleanup.ps1`; it clears next time you run that script.
4. **Asset compression (the big load-time win).** Compressed the two heavy background videos and 18 oversized images, tuned so the change is not visible:
   - `apple-blossom-sky-web.mp4`: 24 MB -> 19 MB. (This clip is noisy foliage, so it resists compression; kept conservative to stay invisible. Can go smaller if you eyeball it and approve.)
   - `apple-blossom-baker-web.mp4`: 12.7 MB -> 7.4 MB.
   - Project + material images: 23 MB -> 11 MB total (51% smaller), capped at 2400px and quality 88. Transparent cut-out PNGs kept as PNG so their look is unchanged.
   - **Originals are safe**: full-resolution copies are in `_backup_originals/` (which I added to `.gitignore`, so it stays on your disk and never deploys). Delete that folder whenever you're happy.

---

## 2b. Improvements added (second pass)

- **Project pages now hold the loader until the content is ready.** The loading screen stays up until the hero image, the hero video, and the 3D model have actually loaded, so nothing pops in after the loader clears. Each asset has its own timeout and there is a global 12-second hard cap, so a slow or stalled asset can never trap you on the loader. To make this work, the KART model is now loaded up front (eagerly) instead of only when scrolled to; that means the ~10 MB model downloads on every KART visit. That is the tradeoff for "no pop-in," and you asked for it. Other projects have no model, so they only wait on their image.
- **Hover-to-prefetch.** Hovering a project card on the home page, or a project link in the menu, now quietly pre-loads that project page's document and stylesheet in the background, so the click feels instant. It uses `prefetch` (low priority), so it never slows down the page you are on, and it does not pre-download the heavy model or video (that would waste data on a hover you might not click).
- **Contact email** wired to `owen@studionewo.com`.

## 3. Performance (the real load-time work)

> **Update:** the video + image compression below is now DONE (see fix #4). The table shows the original sizes and what they became. Home-page worst case dropped from ~24 MB to ~19 MB; a typical project page is ~12 MB lighter on images.

Typical page weight today:

- **Home page:** one random background video (3 MB, 12.7 MB, or 24 MB) plus tiny HTML/JS. So a load is roughly 3–24 MB depending on which clip is picked.
- **KART project page:** ~10.3 MB model file loads when the 3D viewer starts, plus the hero and any scattered images.

Where the weight is, biggest first:

| Asset | Size | Note |
|---|---|---|
| `videos/apple-blossom-sky-web.mp4` | 24 MB | home background, too heavy |
| `videos/apple-blossom-baker-web.mp4` | 12.7 MB | home background, too heavy |
| `projects/kart/modelrender.glb` | 10.3 MB | loads on the KART page |
| `projects/neb/scatter-03.png` | 3.1 MB | a drawing saved as PNG |
| `projects/amsalp/scatter-03.jpg` | 2.3 MB | full-res photo |
| `projects/omni/gallery-01..04.jpg` | 1.2–2 MB each | full-res photos |
| `projects/amsalp/scatter-01.jpg` | 2 MB | full-res photo |
| `materials/cat-wood.jpg` | 1.9 MB | category hero |

**What helps, and how much:**

- **Compress the two big background videos.** Target ~4–6 MB each at 1080p. This is the single biggest home-page win. Needs a re-encode (ffmpeg), which is slightly lossy but invisible for a soft, slow-drifting background.
- **Run your `optimize-images.py` script.** It already exists for exactly this: it caps images at 2000px and recompresses to ~82% quality, writing to a separate folder so originals are safe. It would cut roughly 12–15 MB across the site. The omni gallery, amsalp scatters, and `neb/scatter-03.png` are the main targets.
- **KART model (`modelrender.glb`, 10.3 MB).** Loads lazily (only when you scroll to it), so it does not block first paint. Shrinking it needs Draco mesh compression, which is a more advanced step. Optional for now.

**Already good:** background video is skipped on mobile, on data-saver, and on reduced-motion. Images are `loading="lazy"`. Inline loop videos pause when off-screen. `model-viewer` only loads on projects with a model. Fonts are preloaded with `font-display:swap`. The perceived load (loader screen + fade-in) is handled well.

---

## 4. Smaller concerns and cleanup

None of these break anything; they are tidiness and polish.

- **Dead CSS.** `css/style.css` still carries the old custom 3D viewer styles (`.viewer …`, ~24 lines), plus `.fignotes` and `.aesth` rules for sections that were retired. Harmless (the file is only ~24 KB) but removable.
- **Doc drift.** `HANDOFF.txt` lists the cleanup script as `cleanup-materials.ps1` in one spot; the actual file is `cleanup.ps1`. Tiny.
- **Contact form** now points to `owen@studionewo.com` (done this session). It uses a mailto draft until you add a Formspree endpoint. Note: for `owen@studionewo.com` to actually receive mail, you need email hosting on the domain (most registrars sell this, or use a free forwarder). Until then, keep in mind that address must exist somewhere.
- **Unused staged files.** `projects/kart/demo.mp4`, `projects/amsalp/demo.mp4`, and a few extra gallery images (`neb/gallery-06`, `naf/gallery-04`) are on disk but not referenced. HANDOFF says the demos are intentional; the extras are harmless.

---

## 5. Open items

- **Sky video:** you confirmed it looks good, leaving as-is (19 MB).
- **Contact form:** wired to `owen@studionewo.com` via mailto. Optional upgrade to a no-reload Formspree form later (publish guide step 8). Make sure that mailbox exists (needs email hosting on the domain).
- **Private research hub:** on hold, revisit after launch.
- **Remaining work you own:** CAD models + how-it-works graphics for OMNI, NEB, NAF, AMSALP. Publishing before these is fine; empty CAD/model sections auto-hide, so those pages just show text + photos with no gaps. Add renders project-by-project and re-upload.

---

# Publishing to GitHub Pages at studionewo.com

Follow these in order. You have no coding experience, so this is written click-by-click. It takes about 30 minutes, plus waiting for DNS.

## Step 1 — Make a GitHub account
Go to https://github.com and sign up (free). Pick a username; it becomes part of your backup URL (e.g. `yourname.github.io`).

## Step 2 — Run the cleanup script first
In your `Website` folder, right-click `cleanup.ps1` → **Run with PowerShell**. This removes dead files and fixes the image-folder capitalization (GitHub is case-sensitive, so this matters). Let it finish.

## Step 3 — Create the repository
On GitHub, click **+** (top right) → **New repository**.
- **Repository name:** `studionewo` (or anything; the name does not affect the custom domain).
- Set it to **Public** (GitHub Pages needs Public on the free plan).
- Do **not** add a README, .gitignore, or license (you already have files).
- Click **Create repository**.

## Step 4 — Upload your site
On the new empty repo page, click **uploading an existing file**.
- Open your `Website` folder, select **everything inside it** (not the folder itself), and drag it into the browser.
- Important: make sure the hidden files come too. `CNAME`, `.nojekyll`, and `.gitignore` must be uploaded. In Windows Explorer, turn on **View → Hidden items** so you can see and select them. `.nojekyll` is what tells GitHub not to mangle your folders.
- Wait for all files to finish (the videos take a minute).
- At the bottom, click **Commit changes**.

> Note: GitHub rejects any single file over 100 MB. Your largest file is 24 MB, so you are fine. (This is why the ~125 MB KART demo mentioned in your notes can't be pushed as-is; that one would need compression or a YouTube/Vimeo embed.)

## Step 5 — Turn on GitHub Pages
In the repo, go to **Settings** → **Pages** (left sidebar).
- Under **Build and deployment → Source**, choose **Deploy from a branch**.
- Branch: **main**, folder: **/ (root)**. Click **Save**.
- Wait 1–2 minutes. A green banner shows your temporary URL: `https://yourname.github.io/studionewo/`. Open it to confirm the site works before touching the domain.

## Step 6 — Point studionewo.com at GitHub
Two parts: tell GitHub the domain, and tell your domain registrar where to send traffic.

**6a. In GitHub** (Settings → Pages → Custom domain): type `studionewo.com` and **Save**. (Your repo already has a `CNAME` file with this, so it may fill in automatically.)

**6b. At your registrar** (wherever you bought studionewo.com — GoDaddy, Namecheap, Google Domains, etc.), open the **DNS settings** for the domain and add these records.

Apex domain (`studionewo.com`) — add **four A records**, all with host/name `@`:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Optional but recommended, IPv6 — add **four AAAA records**, host `@`:

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

The `www` version — add **one CNAME record**:

```
Host/Name:  www
Value:      yourname.github.io
```

(Replace `yourname` with your actual GitHub username. Note the trailing style your registrar expects; some want `yourname.github.io.` with a dot.)

If the registrar's DNS page currently has a "parking" or "forwarding" record pointing studionewo.com at a placeholder page, **delete it** first, or it will fight these records.

## Step 7 — Wait, then lock in HTTPS
DNS changes take anywhere from a few minutes to 24 hours to spread. Check back at GitHub → Settings → Pages. When it shows the domain as verified, tick **Enforce HTTPS** (this gives you the free padlock / `https://`). If the box is greyed out, the certificate is still being issued; wait and check again later.

Your site is now live at https://studionewo.com.

## Step 8 (optional) — Turn on the real contact form
1. Go to https://formspree.io, sign up free, create a form. It gives you an endpoint like `https://formspree.io/f/abcdwxyz`.
2. In `contact.html`, find the line `var FORMSPREE_ENDPOINT = "";` and paste your endpoint between the quotes.
3. Re-upload `contact.html` to the repo (in GitHub: open the file → pencil icon → paste → commit). The form now submits without leaving the page.

## Updating the site later
Any time you change a file: in the repo, open the file, click the **pencil** to edit (for text), or use **Add file → Upload files** to replace images. Commit, and GitHub redeploys in a minute or two. For bigger changes, ask me and I'll prep the files for you to upload.

---

**Sources for the DNS values:** [Managing a custom domain for your GitHub Pages site — GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
