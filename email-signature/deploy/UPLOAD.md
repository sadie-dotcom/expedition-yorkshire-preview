# Deployment — Expedition Yorkshire email signatures

Everything in **this `deploy/` folder** is production-ready. The image paths are already absolute and
point at the **Cloudflare Pages preview domain**:

```
https://expedition-yorkshire-preview.pages.dev/email-signature/assets/
```

**No further editing is required.** When the real site goes live, the only change will be swapping that
host back to `https://expeditionyorkshire.com/` (see the last section).

---

## How this hosts (GitHub → Cloudflare Pages)

Cloudflare Pages serves your GitHub repository at the preview domain, so a file in the repo at
`email-signature/assets/andrew-portrait.png` becomes:

```
https://expedition-yorkshire-preview.pages.dev/email-signature/assets/andrew-portrait.png
```

That means **you don't upload anything manually** — you just commit the images to GitHub and push.
The signature `.html` files are pasted into the email client (Outlook / Gmail); they don't need to be
served, but committing them is recommended for record-keeping.

---

## ✅ What to commit & push to make it work immediately

From the repo root:

```bash
git add email-signature/
git commit -m "Add Expedition Yorkshire email signature + hosted assets"
git push
```

The one thing that **must** be live for the signature to work in email is the images folder:

```
email-signature/assets/
├── andrew-portrait.png
├── logo-forest.png
├── logo-cream.png
├── icon-phone.png
├── icon-email.png
├── icon-web.png
├── icon-instagram.png
└── icon-facebook.png
```

Push to whichever branch Cloudflare Pages builds (your production branch). Once the Pages build
finishes (usually under a minute), the images are live at the preview domain.

> Note: the images that back the signature URLs are the ones at the **top level**
> `email-signature/assets/` — that path maps exactly to
> `…pages.dev/email-signature/assets/`. (`deploy/assets/` is just a local convenience copy.)

---

## Verify after the push

1. Paste this into a browser — you should see Andrew's portrait:
   `https://expedition-yorkshire-preview.pages.dev/email-signature/assets/andrew-portrait.png`
2. Then install the signature (see `../README.md` → *Step 2*) and send yourself a test in Outlook and Gmail.
   The images will now load from the preview domain.

## Which file Andrew pastes into his email

| Signature | File to paste from |
|-----------|--------------------|
| Primary (recommended) | `deploy/index.html` |
| Minimal (replies) | `deploy/index-minimal.html` |
| Business-card | `deploy/business-card.html` |

Optional hosted gallery (after push):
`https://expedition-yorkshire-preview.pages.dev/email-signature/deploy/preview.html`

---

## Contact links (unchanged — already correct)

| Element | Target |
|---------|--------|
| Phone | `tel:+441904235928` (displays 01904 235928) |
| Email | `mailto:andrew@expeditionyorkshire.com` |
| Website | `https://expeditionyorkshire.com` |
| Instagram | `https://www.instagram.com/expedition_yorkshire/` |
| Facebook | `https://www.facebook.com/Expedition-Yorkshire-102983935644434` |
| CTA button | `https://www.expeditionyorkshire.com/contact/` |

These stay on `expeditionyorkshire.com` on purpose — they are real destination links, not images. Only
the **image** URLs use the preview domain for now.

---

## When the website goes live — switch back

Replace the image host in the three `deploy/*.html` files:

| Find | Replace with |
|------|--------------|
| `https://expedition-yorkshire-preview.pages.dev/email-signature/assets/` | `https://expeditionyorkshire.com/email-signature/assets/` |

Re-paste the updated signature into the email client. Nothing else changes.
