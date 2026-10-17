# landing — turn-key one-page sites for cPanel hosting

<img src="icon.svg" width="72" height="72" alt="landing@forze icon">

A Claude Code plugin that takes a developer from "I have a client and a pile of
materials" to a finished one-page website packed for upload to ordinary PHP
hosting with cPanel.

```bash
claude plugin marketplace add forze-dev/claude-plugins
claude plugin install landing@forze
```

Then, in a new empty folder: `claude`, then `/landing:create`.

## What you get

- **A landing** built from a section library (hero, services, steps, gallery,
  reviews, FAQ, call to action, contacts), plus a privacy policy draft, a
  thank-you page and a 404.
- **A request form** delivered to Telegram through a small PHP handler with
  anti-spam checks (honeypot, fill time, origin, file signatures, rate limit).
- **SEO** baked in: canonical URLs, sitemap, robots.txt, Open Graph, JSON-LD and
  microdata describing one business entity, kept in sync by construction.
- **`release/<domain>.zip`** — the contents of `dist/`, ready to extract into
  `public_html`, and **`.env.<domain>`** with empty credentials and notes on
  where to get each value. Credentials go into `secrets/` one level above
  `public_html`, never into the public folder.
- **A project that lives on without the plugin**: `CLAUDE.md` with rules, task
  and changelog docs, `/add-section` and `/add-page` commands.

## How it works

`/landing:create` runs nine stages: environment check → project scaffold →
dependency audit → client materials → brief (only the gaps) → a task file you
approve → build, stage by stage, each checked by a read-only verifier agent →
your revisions → delivery. It never invents facts: a phone number, price or
review that isn't in the materials is asked for, not guessed.

## Requirements

- Claude Code with this plugin enabled, Node.js 22.12+ on your machine.
- PHP 8.1+ locally is optional (to test the form before upload).
- Hosting: Apache + PHP 8.1+ (cPanel or any shared hosting). Not for
  Vercel/Netlify-style static hosts — the form needs PHP.

## What runs where

Everything runs on your machine: the plugin's scripts, `npm ci` (from the npm
registry), the Astro build. The plugin sends nothing anywhere and collects no
data. The sites it builds send form submissions only to the receiver you
configure (Telegram by default).

## Links

- Documentation: <https://github.com/forze-dev/claude-plugins/tree/main/plugins/landing#readme>
- Support and bug reports: <https://github.com/forze-dev/claude-plugins/issues>
- Privacy policy: <https://github.com/forze-dev/claude-plugins/blob/main/docs/PRIVACY.md>
- Terms of use: <https://github.com/forze-dev/claude-plugins/blob/main/docs/TERMS.md>
- License: MIT

Brand icons in the scaffold come from [Simple Icons](https://simpleicons.org)
(CC0). The Onest font is under the SIL Open Font License.
