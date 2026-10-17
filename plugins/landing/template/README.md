# Landing

A one-page site on Astro: the landing, a privacy policy, a thank-you page and
a 404. The request form sends data to Telegram through a small PHP handler.
Created by the `landing@forze` plugin.

> **Built for PHP hosting with cPanel** (Apache + PHP 8.1+, any shared
> hosting). You upload static files plus one PHP script into `public_html` —
> no Node, no Vercel, no server setup.

The rules for working with the project are in `CLAUDE.md`. Claude Code reads
them too, so you can keep working with it directly: `/add-section`, `/add-page`.

## Quick start

```bash
npm ci               # ci, not install — exact versions from the lock file
npm run dev          # http://localhost:4321
```

Testing the form locally needs PHP 8.1+ and the filled credentials file at the
project root (`npm run env` creates `.env.<domain>`). Without PHP the site works
and the form replies with an explanation.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server; the form runs through local PHP |
| `npm run build` | Build into `dist/` with `form.php` and `.htaccess` |
| `npm run check` | Check the built site before delivery |
| `npm run pack` | `release/<domain>.zip` — the same files as `dist/`, zipped |
| `npm run env` | `.env.<domain>` — empty credentials with notes on where to get them |
| `npm run og` | A simple OG image from the config (only if the client has none) |
| `npm run icons:preview` | `temp/icons-preview.png` — check icons by eye |
| `npm run preview` | Preview `dist/` (no PHP: the form doesn't work here) |
| `npm run test:phone` | Phone mask test |

## What to change where

| What | Where |
| --- | --- |
| Name, domain, phones, email, address, hours, messengers, menu | `src/site.config.js` |
| Colors, spacing | `src/styles/base/variables.css` |
| Landing copy, section order | `src/pages/index.astro` |
| Privacy policy | `src/pages/privacy-policy.astro` |
| Photos and icons | `public/assets/` |
| OG image 1200×630 | `public/assets/seo/og.jpg` |
| Logo | `src/components/Logo.astro` (replace with the client's SVG) |

## Uploading to cPanel

```bash
npm run build && npm run check && npm run pack && npm run env
```

**What goes where on the hosting:**

```
/home/<user>/
├── secrets/
│   └── .env.<domain>     ← credentials (create the folder; NEVER in public_html)
└── public_html/          ← the CONTENTS of dist/ (or of release/<domain>.zip)
```

1. **SSL.** cPanel → SSL/TLS Status: the domain has a certificate (AutoSSL).
   The site redirects to `https://` and won't open without one.
2. **Files.** Upload the **contents** of `dist/` into `public_html` — directly,
   without a `dist` folder around them. Easiest: File Manager → `public_html` →
   Upload `release/<domain>.zip` → Extract → delete the zip.
3. **Credentials.** Fill in `.env.<domain>` (each variable has a note on where
   to get it). Create the folder `/home/<user>/secrets/` — one level above
   `public_html` — and upload the file there. It must **never** be inside
   `public_html`, `dist/` or `public/`: anything there can be downloaded by anyone.
4. **PHP.** cPanel → MultiPHP Manager: PHP 8.1 or newer. If files over 8 MB
   don't arrive — cPanel → MultiPHP INI Editor: `upload_max_filesize` and
   `post_max_size` no lower than `SITE.form.maxFileMb`.
5. **Check.** Send a test request from the site and confirm it arrived in
   Telegram — with a file and without.

## Before handing over to the client

- [ ] `npm run check` is green (and its favicon warning is resolved or agreed)
- [ ] The client's OG image, favicons and logo are in place
- [ ] A lawyer has reviewed the privacy policy
- [ ] `.env.<domain>` is filled in and sits in `secrets/` on the hosting
- [ ] A test request reached Telegram on the live domain
- [ ] `npm audit` is clean or its findings are assessed (rule 6 in `CLAUDE.md`)

Brand icons are from [Simple Icons](https://simpleicons.org) (CC0). The Onest
font is under the SIL Open Font License (`public/fonts/OFL.txt`).
