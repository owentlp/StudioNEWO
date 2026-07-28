# Publish Studio NEWO — Step by Step

Written for Porkbun (your registrar) + GitHub Pages + a free Gmail email forward. No coding needed. Do the parts in order. Total hands-on time ~30 min, plus some waiting for DNS.

Three parts:
- **Part A** — put the site on GitHub and turn on hosting
- **Part B** — point studionewo.com at it (Porkbun DNS)
- **Part C** — make owen@studionewo.com forward to your Gmail

---

## Part A — Put the site on GitHub Pages

### A1. Make a GitHub account
Go to https://github.com and sign up (free). Pick a username, e.g. `owenpalmer`. **Write it down** — you need it in Part B. Your username becomes part of a backup URL like `owenpalmer.github.io`.

### A2. Clean up the folder first
In your `Website` folder, right-click **`cleanup.ps1`** → **Run with PowerShell**. This deletes dead files and fixes the image-folder capitalization (GitHub is case-sensitive, so this matters). Let it finish and close.

### A3. Create the repository
1. On GitHub, click the **+** (top right) → **New repository**.
2. **Repository name:** `studionewo` (the name does not affect your domain).
3. Choose **Public** (required for free GitHub Pages).
4. Do **NOT** check "Add a README", ".gitignore", or "license" — you already have files.
5. Click **Create repository**.

### A4. Upload your files with GitHub Desktop (do it this way)
The browser uploader caps each file at 25 MB and fails when you commit many files or videos at once (that is the "Commit failed" error). GitHub Desktop is a free app that handles all of it cleanly. No command line.

1. Download **GitHub Desktop** from https://desktop.github.com and install it.
2. Open it → **Sign in to GitHub.com** → log in with the account from A1.
3. **File → Clone repository** → **GitHub.com** tab → select **studionewo**.
   - For **Local path**, pick a simple spot **outside OneDrive**, e.g. `C:\Users\Owent\studionewo` (OneDrive can interfere with git). Click **Clone**.
   - This creates an empty local folder that is linked to your repo.
4. In File Explorer, open your `Website` folder. Select **everything inside it EXCEPT the `_backup_originals` folder**, and **copy** it into the new cloned folder you just made.
   - Turn on hidden files first (**View → Show → Hidden items**) so `.nojekyll`, `.gitignore`, and `CNAME` come along. `.nojekyll` is what stops GitHub from breaking your folders.
   - You can skip `_backup_originals` (61 MB of backups) and, if you like, `cleanup.ps1`, `optimize-images.py`, `COPY.txt`, `README.txt`, and the `docs` folder — they are local-only and not needed on the live site. Everything else must go in.
5. Switch back to GitHub Desktop. It now lists all your files as changes. In the bottom-left **Summary** box type `initial site`, then click **Commit to main**.
6. Click **Push origin** at the top. Wait for it to finish. Your whole site is now on GitHub.

> Fallback if you truly can't install the app: in the browser uploader, commit in small batches instead of all at once. First commit the HTML + config files plus the `css`, `js`, `fonts`, and `logo` folders. Then **Add file → Upload files** again for the `projects` folder. Then once more for the `videos` folder. Small commits stay under the limit.

### A5. Turn on GitHub Pages
1. In the repo, go to **Settings** (top) → **Pages** (left sidebar).
2. Under **Build and deployment → Source**, pick **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)**. Click **Save**.
4. Wait 1–2 minutes, then refresh. A box shows a live link like `https://owenpalmer.github.io/studionewo/`. Open it and confirm the site works before touching the domain.

### A6. Tell GitHub your domain
Still in **Settings → Pages**, under **Custom domain**, type `studionewo.com` and click **Save**. (Your repo already includes a `CNAME` file with this, so it may already be filled in.) GitHub will say DNS check is in progress — that is expected until Part B is done.

---

## Part B — Point studionewo.com at GitHub (Porkbun)

### B1. Open your DNS records
1. Log in at https://porkbun.com.
2. Go to **Account → Domain Management**.
3. Find **studionewo.com** and click the **Details** button (or the DNS / edit icon) to open its **DNS Records**.

### B2. Remove Porkbun's default parking records
New Porkbun domains come with placeholder records that point at Porkbun's parking page. Delete these so they don't fight GitHub:
- Any **ALIAS** or **A** record on the root (Host is blank or `@`) that points to something like `pixie.porkbun.com`.
- The **CNAME** record for **www** pointing to `pixie.porkbun.com`.

Use the trash/delete icon next to each. **Leave any MX records alone** (those are for email; Part C adds them).

### B3. Add the four GitHub A records
Add each of these as a new record. Type **A**, Host **left blank** (this means the root domain), TTL default:

```
Type: A   Host: (blank)   Answer: 185.199.108.153
Type: A   Host: (blank)   Answer: 185.199.109.153
Type: A   Host: (blank)   Answer: 185.199.110.153
Type: A   Host: (blank)   Answer: 185.199.111.153
```

### B4. Add the www record
Add one CNAME so `www.studionewo.com` works too. **Replace `owenpalmer` with your actual GitHub username** from step A1:

```
Type: CNAME   Host: www   Answer: owenpalmer.github.io
```

### B5. (Optional) IPv6
If you want IPv6 too, add four **AAAA** records, Host blank:

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

### B6. Wait, then lock in HTTPS
DNS spreads in anywhere from a few minutes to a day (usually under an hour on Porkbun). Go back to **GitHub → Settings → Pages** and refresh. When it shows the domain verified, check the **Enforce HTTPS** box (free padlock / `https://`). If it is greyed out, the certificate is still being made — wait and check again later.

**Your site is now live at https://studionewo.com.**

---

## Part C — Make owen@studionewo.com forward to your Gmail

Porkbun includes free email forwarding (up to 20 addresses). This makes mail sent to `owen@studionewo.com` land in your normal Gmail inbox.

### C1. Create the forward
1. In Porkbun, go to **Account → Domain Management**, find **studionewo.com**.
2. Click the **email (envelope) icon** next to the domain.
3. Click **Create New Email Forward** (or **Add**).
4. **Email Address:** `owen`  (Porkbun adds `@studionewo.com` for you).
5. **Forward To:** `owentlp@gmail.com`.
6. Save. Porkbun automatically adds the MX records it needs — you don't touch DNS for this.

### C2. Test it
Wait ~15 minutes, then from any account send a test email to `owen@studionewo.com`. It should arrive in your Gmail. Done.

### C3. (Optional) Replying AS owen@studionewo.com
Forwarding delivers mail to you, but a reply would go out from your Gmail address. If you want replies to come **from** `owen@studionewo.com`, that needs an outbound (SMTP) mailbox, which plain forwarding does not include. Easiest options when you want it: Porkbun's paid email hosting, or a free Zoho Mail mailbox. Not needed to launch — tell me and I'll walk you through it later.

---

## Updating the site after launch
Any time you finish a render or edit copy:
- **Text change:** open the file in your GitHub repo, click the **pencil** icon, edit, **Commit changes**. Live in ~1 minute.
- **New images / files:** in the repo, **Add file → Upload files**, drag them in, commit.
- Bigger changes: send them to me, I'll prep the files and tell you exactly which to upload.

Publishing before the CAD renders are done is fine — empty model/graphic sections hide themselves, so those project pages just show text and photos until you add the renders.

---

**Sources:**
[GitHub Pages custom domain — GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) ·
[Porkbun email forwarding — Porkbun KB](https://kb.porkbun.com/article/10-how-to-set-up-email-forwarding-service)
