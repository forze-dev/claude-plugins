# landing — turn-key one-page sites for cPanel hosting

![landing@forze icon](icon.png)

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

## What the plugin runs, sends and fetches

Everything runs on your machine. The plugin collects no data and has no
telemetry. In full:

- **Hook** — `hooks/guard.mjs` runs with Node before every file edit and shell
  command in a Claude Code session. It reads only the tool call it is given and
  checks for a `.forze/landing.json` marker in the project. In a project created
  by this plugin it blocks: edits inside `dist/` and `release/`, `.env` files in
  `public/`, `npm audit fix --force`, and a bare `npm install`. Everywhere else
  it does nothing. It makes no network requests and writes nothing.
- **Skill scripts** (run when the skill tells Claude to): `doctor.mjs` reads the
  installed versions of Node, npm, PHP and git; `scaffold.mjs` copies
  `template/` into the new project folder you name. Neither touches the network.
- **In the generated project**, at the skill's direction and only with your
  approval in Claude Code:
  - `npm ci` downloads the project's pinned dependencies from the npm registry;
  - `npm audit` sends the dependency list to the npm registry's audit service;
  - the Astro build, `check`, `pack`, `env`, `og` and `icons:preview` scripts
    run locally and make no network requests;
  - installing Node, PHP or git (only if missing, only after you confirm) uses
    your OS package manager (`winget`, `brew`, `apt`).
- **Links you share** (a Figma file, a reference site) are opened by Claude
  only when you provide them.
- **Websites built with the plugin** send form submissions only to the receiver
  you configure — Telegram by default, through the PHP handler on your hosting.

## Links

- Documentation: <https://github.com/forze-dev/claude-plugins/tree/main/plugins/landing#readme>
- Support and bug reports: <https://github.com/forze-dev/claude-plugins/issues>
- Privacy policy: <https://github.com/forze-dev/claude-plugins/blob/main/docs/PRIVACY.md>
- Terms of use: <https://github.com/forze-dev/claude-plugins/blob/main/docs/TERMS.md>
- License: MIT

Brand icons in the scaffold come from [Simple Icons](https://simpleicons.org)
(CC0). The Onest font is under the SIL Open Font License.
