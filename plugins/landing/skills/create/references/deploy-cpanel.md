# Uploading to cPanel — instructions for the person

Retell this to the person in your own words and in the conversation language,
with their domain and the path to the archive filled in. cPanel menu names may
differ slightly between hosting providers.

## Before uploading

- The domain is already connected to the hosting (DNS points to the server).
- **SSL is in place.** cPanel → **SSL/TLS Status** → the domain is marked
  green. If not — the **Run AutoSSL** button, then wait a few minutes. Without
  a certificate the site won't open: it redirects to `https://`.
- **PHP 8.1 or newer.** cPanel → **MultiPHP Manager** → select the domain →
  PHP 8.1+ → Apply.

## Upload

1. cPanel → **File Manager** → the `public_html` folder.
2. If an old site is there — back it up (select all → Compress) or delete it
   if it's definitely not needed.
3. **Upload** → choose `release/<domain>.zip`.
4. Back in `public_html`, right-click the archive → **Extract** → into
   `public_html`. The files (`index.html`, `assets/`, `scripts/`…) must land
   **directly in `public_html`**, not in a subfolder.
5. Turn on hidden files (Settings → Show Hidden Files) and make sure
   `.htaccess` is there.
6. Delete the archive from `public_html` after extracting.

## Bot credentials

1. In File Manager go **one level above** `public_html` — the home folder
   (`/home/<user>/`).
2. **+ File** → name it `.env`.
3. Open it (Edit) and enter:
   ```
   TELEGRAM_BOT_TOKEN=the token from BotFather
   CHAT_ID=-100…
   ```
4. Save.

## Large files in the form

If files larger than a few megabytes don't arrive: cPanel → **MultiPHP INI
Editor** → the domain → `upload_max_filesize` and `post_max_size` — not lower
than the form limit (20M and 21M by default) → Apply.

## Check

1. Open the site at `http://domain` — it must redirect to `https://domain`.
2. Open `https://domain/privacy-policy` — the page exists.
3. Open `https://domain/no-such-page` — the 404 page must appear.
4. Send a test request **without a file**, then **with a file** — both must
   arrive in Telegram, and the thank-you page opens after sending.

The request didn't arrive:

- the message "The form is not configured yet" — `.env` is in the wrong place
  or the variable names are wrong;
- "Rejected." — the site was opened from a domain other than `SITE.url`
  (for example, the host's technical subdomain);
- "Too many requests" — wait 20 seconds between tests;
- a delivery error — wrong token or chat id, or the bot wasn't added to the group.
