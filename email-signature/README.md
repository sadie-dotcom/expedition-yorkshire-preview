# Expedition Yorkshire — Email Signature

A set of premium, brand-matched HTML email signatures for **Andrew Ward**. Built to mirror the new Expedition Yorkshire website — the "Quiet Moor" palette, Georgia/serif display type, gold accents and generous whitespace — while staying maximally compatible with Outlook.

> ## ⭐ Ready to go live? Use the `deploy/` folder
> **`deploy/`** contains the **production-ready** files. Image paths currently point at the **Cloudflare
> Pages preview domain** (`https://expedition-yorkshire-preview.pages.dev/email-signature/assets/`) so
> Andrew can start using the signature **before the real site is live** — **no editing needed**.
> Commit `email-signature/` to GitHub and push; Cloudflare Pages then serves the images. Full
> instructions, the exact URLs, and the "switch back when live" step are in
> **[`deploy/UPLOAD.md`](deploy/UPLOAD.md)**.
>
> The files in *this* top-level folder are the **editable source** (relative `./assets/` paths) — handy
> for local previewing.

## What's in this folder

| File | What it is | When to use |
|------|-----------|-------------|
| `index.html` | **Primary signature** (640px) — portrait, contact, tagline, logo, CTA & rating. | First contact, proposals, enquiries. |
| `index-minimal.html` | **Minimal signature** — portrait, contact details & wordmark. | Replies and everyday threads. |
| `business-card.html` | **Business-card signature** (600px, deep-forest background). | A statement footer — new clients & travel trade. |
| `preview.html` | Local comparison page showing all three (open this first). | Reviewing / choosing. |
| `assets/` | All images (portrait, logos, icons). | Uploaded to your server. |

### Assets

| File | Displayed at | Notes |
|------|--------------|-------|
| `andrew-portrait.png` | 100 × 100 (2× retina) | Circular head-and-shoulders crop with a hairline gold ring. |
| `logo-forest.png` | up to 196 × 48 | Deep-forest wordmark for light backgrounds. |
| `logo-cream.png` | up to 184 × 45 | Cream wordmark for the forest business-card version. |
| `icon-phone / email / web / instagram / facebook.png` | 14–18px | Line icons in the brand accent (#B7642F). |

All images are exported at 2× so they stay crisp on Retina / high-DPI screens.

---

## Preview it first

1. Open a terminal in this folder and run a tiny local server (images need to load over HTTP, not `file://`):

   ```bash
   cd email-signature
   python3 -m http.server 8080
   ```

2. In your browser go to **http://localhost:8080/preview.html** to compare all three side by side, including an "in context" mock-up under a real message.

You can also open `index.html`, `index-minimal.html` or `business-card.html` directly at that address.

---

## Step 1 — Host the images (do this once)

Email clients cannot read local file paths — every image must live at a public **HTTPS** URL. The signature files currently point at the placeholder path `./assets/…`.

1. Upload the entire `assets/` folder to your website, e.g. to:

   ```
   https://expeditionyorkshire.com/email-signature/assets/
   ```

2. In `index.html`, `index-minimal.html` and `business-card.html`, replace every `./assets/` with your hosted base URL. A find-and-replace does all of them at once:

   | Find | Replace with |
   |------|--------------|
   | `./assets/` | `https://expeditionyorkshire.com/email-signature/assets/` |

3. Confirm a URL resolves by pasting it into a browser, e.g.
   `https://expeditionyorkshire.com/email-signature/assets/andrew-portrait.png`

> **Tip:** keep the images at a stable URL and never rename them — if the path breaks later, the signature will show broken images in everyone's past emails. A CDN or your normal web host is fine.

---

## Step 2 — Install the signature

### Outlook (Windows — new & classic)

1. Open the chosen `.html` file in a browser (after Step 1).
2. Select the whole signature (click just above it and drag to just below), then **Ctrl + C**.
3. In Outlook: **File → Options → Mail → Signatures…**
4. Click **New**, name it *Expedition Yorkshire*, click into the edit box and **Ctrl + V**.
5. Set it as the default for **New messages** (and **Replies** if you like — the minimal version suits replies).
6. **OK**, then send yourself a test.

*If pasting strips the layout,* use the classic trick: save the file, then in the Signatures dialog Outlook reads files from
`%USERPROFILE%\AppData\Roaming\Microsoft\Signatures\` — create the signature once, then replace the generated `.htm` file there with this HTML (keep the same filename) and restart Outlook.

### Outlook (Mac)

1. Open the `.html` in Safari/Chrome, select all, **Cmd + C**.
2. **Outlook → Settings → Signatures → +**.
3. Paste into the signature body, name it, and set it as default.

### Gmail

1. Open the `.html` in a browser (after Step 1), select the whole signature, **Cmd/Ctrl + C**.
2. Gmail → **Settings (gear) → See all settings → General → Signature**.
3. **Create new**, give it a name, click into the box and paste.
4. Under *Signature defaults*, set it for new emails / replies.
5. **Save changes** at the bottom.

### Apple Mail

1. **Mail → Settings → Signatures**, create a new signature for your account and untick *"Always match my default message font"*.
2. Quit Mail. In Finder open
   `~/Library/Mail/V*/MailData/Signatures/` and find the newest `.mailsignature` file.
3. Open it in a text editor, keep the top header lines, and replace the HTML below them with this file's contents. Save, then lock the file (Get Info → Locked) so Mail doesn't overwrite it, and reopen Mail.

---

## Step 3 — Test before rolling out

- Send a test to yourself and open it in **Outlook, Gmail (web + app) and on your phone**.
- Check every link works: phone (`tel:`), email (`mailto:`), website, Instagram, Facebook and the **Plan Your Journey** button.
- Confirm all images load (no red X / broken icons) — that means Step 1 hosting is correct.
- Forward the test to a colleague on a different mail client as a final check.
- Free cross-client render check (optional): paste the HTML into a tool such as *Litmus* or *Email on Acid* if you have access.

---

## Replacing images later

- **New photo of Andrew:** crop to a square, save as `andrew-portrait.png` at ~200 × 200px, and overwrite the file on your server (same name — no HTML changes needed).
- **Updated logo:** export on a transparent background and replace `logo-forest.png` (dark artwork) / `logo-cream.png` (light artwork), keeping the same filenames.
- Keep new images the **same dimensions and filenames** so nothing shifts.

---

## Editing contact details

Details are plain text inside each `.html`. To change them, open the file and edit:

- **Phone:** the visible `01904 235928` **and** the `tel:+441904235928` link.
- **Email:** the visible address **and** the `mailto:` link.
- **Links:** website, Instagram, Facebook and the CTA (`/contact/`) are standard `href="…"` attributes.

---

## Technical notes

- Table-based layout, **inline CSS only** — no JavaScript, Flexbox, Grid, SVG, `<style>` blocks or CSS variables.
- The CTA button uses a bulletproof **VML** fallback so it renders as a rounded, filled button in Outlook and everywhere else.
- Fonts are email-safe: **Georgia** (serif, headings/name) with Times fallback; **Arial/Helvetica** (body).
- Colours are taken from the live site: Forest `#324B3E`, Ink `#1F2A24`, Amber `#B7642F`, Gold `#C9A24B`, Cream `#F5F0E7`, Paper `#FBFAF6`, Heather `#6B7F70`.
- Fixed pixel widths (as requested) — on very narrow phones some clients will scale or allow a small horizontal scroll; this is normal for premium fixed-width signatures.
