# forze — Claude Code plugin marketplace

Plugins for building client websites with Claude Code.

| Plugin | Command | What it does |
| --- | --- | --- |
| `landing@forze` | `/landing:create` | Turn-key one-page landing: client materials → brief → Astro site with a Telegram request form → zip for cPanel |

## Install

Requires [Claude Code](https://claude.com/claude-code) and Node.js 22.12+.

```bash
claude plugin marketplace add forze-dev/claude-plugins
claude plugin install landing@forze
```

Then, in a new empty folder: `claude`, then `/landing:create`. The skill checks
the environment, asks before installing anything missing (PHP, git), and walks
you from raw client materials to a zip you upload to cPanel.

The skill asks which language to talk in. That language is used for the
conversation and for the project's task files and changelog; the site's own
language is asked separately in the brief.

Update: `claude plugin marketplace update forze`. Remove:
`claude plugin marketplace remove forze`.

## `landing@forze` in short

- **Brief from real materials.** Drop in the brief, screenshots, photos, a
  Figma link. The skill sorts what is known, what conflicts and what is
  missing, and asks only about the gaps. It never invents a phone number,
  a price or a review.
- **One approval point.** A task file with the page structure and every fact
  is approved before any build work starts.
- **Static Astro site** that search engines read: one config drives the header,
  footer, form, JSON-LD and microdata.
- **Request form → Telegram** through a PHP back end with honeypot, fill-time,
  origin, file-signature and rate-limit checks.
- **Pre-launch check** that fails on template placeholders, missing OG images,
  broken links, invalid JSON-LD and duplicate ids.
- **Deterministic build and zip** — the same input gives a byte-identical archive.
- **Lives on without the plugin.** The generated project has `CLAUDE.md`,
  task/changelog docs and `/add-section`, `/add-page` commands.

## Development

```bash
claude --plugin-dir ./plugins/landing     # run with the plugin, no install
claude plugin validate ./plugins/landing  # validate the plugin manifest
claude plugin validate .                  # validate the marketplace
```

To work on a local clone as an installed marketplace:
`claude plugin marketplace add <path to clone>` — edits are picked up on the
next session or with `/reload-plugins`.

Checking the landing scaffold:

```bash
cd plugins/landing/template
npm ci && npm run build && npm run check   # check fails on demo data — by design
npm run test:phone
```

Remove build artifacts from `template/` before committing: `node_modules/`,
`dist/`, `release/`, `.astro/` (they are git-ignored).

## Layout

```
.claude-plugin/marketplace.json     the "forze" marketplace catalog
plugins/landing/
  .claude-plugin/plugin.json        plugin manifest
  skills/create/SKILL.md            the /landing:create flow (9 stages)
  skills/create/references/         brief, sections, environment, receivers, deploy
  skills/create/scripts/            doctor.mjs (environment), scaffold.mjs (project setup)
  agents/verifier.md                read-only verifier agent
  hooks/                            guards: dist/ is build output, npm ci not install, no audit fix --force
  template/                         the project scaffold a client gets
docs/competitive-audit.md           competitive analysis
```

## Versioning

Users receive an update only when `version` in `plugin.json` changes. Changed
the skill or the scaffold — bump the version.

## License

MIT
