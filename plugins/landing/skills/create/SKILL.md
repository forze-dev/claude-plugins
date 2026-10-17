---
name: create
description: Build a turn-key one-page landing site for a small business — from raw client materials to a zip ready for cPanel. Collects the brief from files and questions, scaffolds an Astro site with a Telegram request form (PHP back end), fills the sections, verifies and packages it. Use when asked to make a landing page, a one-page site, a business-card site or a lead page for a client.
argument-hint: "[project name]"
---

# Turn-key landing — `/landing:create`

You take a person from "I have a client and a pile of materials" to an archive
with a finished site they upload to cPanel. The person may know nothing about
web development: speak plainly, explain what you do and why, and keep
technical detail in the project files.

The result is a project that lives on **without this plugin**: it has
`CLAUDE.md` with rules, `docs/` with the task and changelog, and the
`/add-section` and `/add-page` commands.

Scope — **landing + privacy policy + thank-you page + 404**. This skill makes
no other pages. If the person asks for "a services page too", record it in the
task file as separate follow-up work and say that `/add-page` does it in the
finished project.

Scaffold: `${CLAUDE_PLUGIN_ROOT}/template`. References for this skill:

- `references/brief.md` — what to collect and which questions to ask;
- `references/sections.md` — the section catalog and how to build the page from the brief;
- `references/environment.md` — installing Node, PHP, git on Windows/macOS/Linux;
- `references/receivers.md` — Telegram, and what to do about other lead receivers;
- `references/deploy-cpanel.md` — instructions for the person: how to upload the site.

## Language

Three separate languages — never mix them up:

1. **Conversation language** — what you speak with the person in. Asked at
   stage 0. Use it for every message from then on, and for the project's task
   files and changelog.
2. **Documentation language of the scaffold** — English. `CLAUDE.md`, `docs/`
   templates and code comments stay English; you do **not** translate them.
   The conversation language is written into rule 1 of the project's
   `CLAUDE.md` by `scaffold.mjs --lang`, so later sessions behave the same.
3. **Site language** — what visitors read. Asked in the brief (stage 5).
   Drives `SITE.lang`, `SITE.locale`, `messages`, `ui` and the page content.

Until the person answers at stage 0, reply in the language they wrote to you in.

## Invariant rules

1. **Invent nothing.** Phone, address, price, hours, a review, "10 years on the
   market" — only from the materials or from the person's answer. No data —
   ask or drop the block. A plausible invention is the worst possible defect.
2. **Secrets never touch project files or the chat.** The person puts the bot
   token and chat id into `.env` themselves. You only explain where. Never ask
   them to paste a token into the chat, never write one into files.
3. **List and confirm before installing software.** Installs may need admin
   rights; never do it silently.
4. **One checkpoint before the big work** — approval of the task file
   (stage 6). Before it — only preparation; after it — execution without
   needless questions.
5. **Never say "everything works" without checking.** The form cannot be
   tested end to end without real credentials — say exactly that.
6. **The project's `CLAUDE.md` applies from the moment it exists.** After stage 2
   read it and follow it: changelog after every stage, determinism, both
   structured-data formats.

## Stages

Tell the person which stage you are on: "Stage 3 of 9 — dependency check".

### Stage 0. Introduction

One message:

- briefly — what will happen: questions → client files → a plan to approve →
  the site → revisions → the archive;
- what you'll need from them: the client's materials, answers, and later a
  Telegram bot token (which they enter themselves);
- that the skill will install software and run commands — and will ask before
  every install.

Ask:

- **the conversation language** (default: the language they wrote in);
- **the project name** and **where to create the folder** (default: a
  subfolder of the current folder named after the project in Latin letters,
  e.g. `kyiv-dental`). If the command argument already holds a name, use it and
  only confirm the folder.

### Stage 1. Environment

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/create/scripts/doctor.mjs"
```

The script changes nothing and prints what is installed. If Node is missing
entirely the script won't start — check `node -v` directly.

- **Node 22.12+ and npm** — required. No further progress without them.
- **PHP 8.1+** — recommended: without it the form can't be tested locally
  (the site still builds; the hosting has PHP).
- **git** — recommended: without it the project is kept without commits.

For whatever is missing, take the install commands for this OS from
`references/environment.md`, show them to the person and **wait for
confirmation**. Declined PHP — continue, and at the end say plainly that the
form was not tested locally. Declined git — same; rule 3 in the project's
`CLAUDE.md` already covers working without git.

After installing — run `doctor.mjs` again. A newly installed program may not be
visible in the current terminal session: then ask the person to restart Claude
Code in the same folder and run `/landing:create` again — the skill resumes
from stage 1.

### Stage 2. Scaffold

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/create/scripts/scaffold.mjs" --template "${CLAUDE_PLUGIN_ROOT}/template" --target "<project folder>" --lang "<conversation language, in English, e.g. Ukrainian>"
```

The script refuses if the folder is not empty — then ask for another one. It
writes the conversation language into rule 1 of the new project's `CLAUDE.md`.
Then, in the project folder:

```bash
npm ci
```

If git is available: `git init`, `git add -A`, commit
`chore: scaffold landing from landing@forze`.

Read the project's `CLAUDE.md`. From this point it is binding.

### Stage 3. Dependency audit

```bash
npm audit
```

- **Clean** — one line in the changelog at stage 6.
- **Findings** — read every advisory and assess reachability in a static
  build (rule 6). `npm audit fix` without `--force` is acceptable if it only
  changes transitive patch/minor versions: after it run `npm ci` and
  `npm run build`, and confirm the direct versions in `package.json` did not
  change. `--force` — never without talking to the person (the plugin's hook
  blocks it anyway).
- **A real vector that can't be closed without a major upgrade** — stop and
  explain to the person in plain words what it means and what you propose.

### Stage 4. Client materials

1. Ask them to drop in **everything they have**, in any form: files in the
   chat, a folder path, a Figma link or the current site, brief text, photos,
   a logo, screenshots of the client conversation.
2. After each batch: "Received: … Is that everything, or is there more?"
   Repeat until they say that's all.
3. Copy files given by path into the project's `temp/` (leave the originals
   alone). Open Figma links if you have access; if not, ask for screenshots.
4. **Analyse** everything and show a summary:
   - **known for certain** — the fact and its source (`brief.pdf, p. 2`);
   - **conflicts** — different phones in the brief and on the mockup, etc.;
   - **missing** — per the list in `references/brief.md`;
   - **looks like a guess** — something stated as fact without a source.
5. Media for the site: compress, give meaningful Latin names
   (`IMG_2041.jpg` → `clinic-reception.webp`), put in `public/assets/images/`;
   favicons — in `public/`; OG 1200×630 — `public/assets/seo/og.jpg`.
   No compression tool available — ask whether you may use one (`sharp-cli`
   via `npx`), or move files as they are and note it in the task.

### Stage 5. Brief — gaps only

Ask **only** about what stage 4 put under "missing", "conflicts" or "looks
like a guess". Use `AskUserQuestion`, grouped, with sensible defaults. The
full list of what must be known before stage 6 is in `references/brief.md`.
Assume nothing.

### Stage 6. Task file — the checkpoint

Write `docs/tasks/<slug>.md` from `docs/tasks/_TEMPLATE.md`, in the
conversation language:

- **Context** — who the client is, what they sell, to whom; sources (files in `temp/`).
- **Decided** — all brief data: contacts, phone format, domain, site language,
  palette, lead receiver, analytics.
- **Landing structure** — the sections in order, with anchors, and for each —
  where the text comes from (`references/sections.md`).
- **Out of scope** — other pages, CRM integrations, a blog, etc.
- **Stages** — per the scheme below, each with a checklist and a prompt.

Stage scheme (one page — the landing — plus the service pages):

1. Config and tokens: `site.config.js`, `variables.css`, media.
2. Landing: sections and copy in `index.astro`.
3. Privacy policy, thank-you page, 404 — copy for the client and the site language.
4. Verification, revisions, delivery.

Show it to the person **briefly** (page structure, key data, what stays on
them) and ask: "Do you approve? Any item can be changed." After "yes" — the
first entry in `docs/changelog/DD.MM.YYYY.md` (brief, audit, decisions) and a
line in `changelog.md`; commit if git is available.

### Stage 7. Execution

Task stages one by one, **sequentially**. After each:

1. `npm run build`; `npm run check` — only errors the stage explicitly leaves
   for later are acceptable;
2. a check by the **`landing:verifier`** agent — give it the project path,
   the task file and the stage number; it changes nothing, it only reports.
   Fix its `FAIL`s before moving on. Verify fixes against the files, not
   against your own account of them;
3. a changelog entry (rule 3), a commit if git is available.

What each stage is about:

- **Config.** All brief data into `src/site.config.js`: `url`, `name`,
  `shortName`, `description`, `businessType` (has an address → `LocalBusiness`
  or a subtype; online only → `Organization`, `address: null`), `PHONES`,
  `PHONE_FORMAT`, contacts, hours, messengers (only those the client gave),
  `social`, `nav` (section anchors), `analytics`, `lang`, `locale`, and
  `messages` and `ui` in the site language. Palette — in `variables.css`: an
  accent ramp from the brand color (`--accent`, `-hover` lighter, `-active`
  darker, `-tint` ~8%, `-tint-strong` ~16% on white), `themeColor` = `--accent`.
  Check the contrast of `--on-accent` on `--accent` ≥ 4.5:1.
- **Landing.** Build `index.astro` from sections per `references/sections.md`.
  Copy comes from the client's materials, edited for the web; what isn't
  there isn't written. Remove `data-demo-content`. `title` up to ~60
  characters, `description` 120–160.
- **Service pages.** Privacy policy: company details, receiver (Telegram),
  analytics — from the brief; remove `data-demo-content`; tell the person
  plainly that a lawyer must review the text. Thank-you page and 404 — in the
  site language.

### Stage 8. Review and revisions

```bash
npm run build
npm run preview
```

Give the person the address (`http://localhost:4321`) and ask them to look on
a phone and a computer. Warn them: the form doesn't work in preview (no PHP);
if PHP is installed, the form can be tried via `npm run dev` with a filled
`.env`.

They write revisions — you apply them, `build` + `check`, and briefly report
what changed. Loop until they say "done". Revisions outside the scope (a new
page, a CRM) — record in the task as follow-up work instead of doing them
silently.

### Stage 9. Delivery

```bash
npm audit
npm run build
npm run check
npm run pack
```

`check` must be green. If the client provided no OG image or favicons,
`check` fails on the OG image; don't work around it with a random picture:
tell the person what's needed and offer an option (a simple OG image with the
logo and name — only with their consent).

Verify determinism: keep a copy of `release/<domain>.zip`, run
`npm run build` and `npm run pack` again, compare — the archives must be
identical.

Final message to the person:

1. where the archive is (`release/<domain>.zip`) and **step-by-step upload
   instructions** from `references/deploy-cpanel.md` — in your own words, for
   their hosting;
2. what **remains on them** — as a checklist: `.env` with the token and chat id
   on the server, legal review of the privacy policy, OG/favicons (if not
   provided), a test request after upload;
3. what is **not verified** and why (the form end to end without credentials;
   locally without PHP);
4. that the project lives on without the plugin: `/add-section`, `/add-page`,
   rules in `CLAUDE.md`.

Move the task to `docs/archive/` with a note "closed DD.MM.YYYY: landing
delivered", a final changelog entry, a commit.
