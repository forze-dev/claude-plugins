# Landing

A one-page site on Astro: the landing, a privacy policy, a thank-you page and
a 404. The request form sends data to Telegram through PHP — the site targets
ordinary cPanel hosting. Created by the `landing@forze` plugin.

The rules for working with the project are in `CLAUDE.md`. Claude Code reads
them too, so you can keep working with it directly: `/add-section`, `/add-page`.

## Quick start

```bash
npm ci               # ci, not install — exact versions from the lock file
npm run dev          # http://localhost:4321
```

Testing the form locally needs PHP 8.1+ and a `.env` file at the project root
(copy `.env.example`). Without PHP the site works and the form replies with an
explanation.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server; the form runs through local PHP |
| `npm run build` | Build into `dist/` with `form.php` and `.htaccess` |
| `npm run check` | Check the built site before delivery |
| `npm run pack` | `release/<domain>.zip` — the archive to upload |
| `npm run preview` | Preview `dist/` (no PHP: the form doesn't work here) |
| `npm run test:phone` | Phone mask test |

## What to change where

| What | Where |
| --- | --- |
| Name, domain, phones, email, address, hours, messengers, menu | `src/site.config.js` |
| Colors, fonts, spacing | `src/styles/base/variables.css` |
| Landing copy, section order | `src/pages/index.astro` |
| Privacy policy | `src/pages/privacy-policy.astro` |
| Photos and icons | `public/assets/` |
| OG image 1200×630 | `public/assets/seo/og.jpg` |

## Uploading to cPanel

```bash
npm run build && npm run check && npm run pack
```

1. **SSL.** In cPanel → SSL/TLS Status make sure the domain has a certificate
   (AutoSSL). The site redirects to `https://` and won't open without one.
2. **Files.** cPanel → File Manager → `public_html` → Upload →
   `release/<domain>.zip` → Extract. The archive contents must land directly
   in `public_html`, without an intermediate folder.
3. **Bot credentials.** Create a `.env` file **one level above** `public_html`
   (i.e. `/home/<user>/.env`), with content as in `.env.example` — the real
   bot token and chat id.
4. **PHP.** cPanel → MultiPHP Manager: PHP 8.1 or newer. If files over 8 MB
   don't arrive — cPanel → MultiPHP INI Editor: `upload_max_filesize` and
   `post_max_size` no lower than `SITE.form.maxFileMb`.
5. **Check.** Send a test request from the site and confirm it arrived in
   Telegram — with a file and without.

## Before handing over to the client

- [ ] `npm run check` is green
- [ ] The client's OG image and favicons are in place
- [ ] A lawyer has reviewed the privacy policy
- [ ] A test request reached Telegram on the live domain
- [ ] `npm audit` is clean or its findings are assessed (rule 6 in `CLAUDE.md`)
