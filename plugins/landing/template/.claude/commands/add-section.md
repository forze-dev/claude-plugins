---
description: Add or change a landing section (advantages, services, steps, reviews, gallery, etc.).
---

Add a section to the landing (`src/pages/index.astro`). If the developer
hasn't said what the section should contain and where it goes — ask.

First check whether an existing section in `src/components/sections/` fits
(the table in `CLAUDE.md`, "Landing and sections"). `Cards` covers advantages,
services and "who it's for"; `Section` + any component covers the rest. A new
section only when the existing ones really don't fit.

Requirements:

1. **Section data is an array in the frontmatter of `index.astro`**, not text
   typed into the component. The component only renders.
2. **Facts only from the brief or the config** (rule 4). Prices, figures,
   reviews, certificates, years in business — ask. Reviews — real ones only,
   with the client's permission to show the name.
3. **Anchor.** If the section belongs in the menu, its `id` and the
   `SITE.nav` item (`/#<id>`) are added together.
4. **A new section component** — `src/components/sections/<Name>.astro` that
   wraps its content in `Section.astro`, and `src/styles/sections/<name>.css`
   that the component imports itself. Tokens from `variables.css` only.
5. **Structured data.** FAQ — `faqPage(faq)` in the page's `schema` array with
   the same array that renders `<Faq>`. Other sections usually have none — if
   you add some, then in both formats (rule 7).
6. **Rhythm.** Alternate `surface` between neighbouring sections.

At the end: `npm run build`, `npm run check`, a look in `npm run preview` at
phone and desktop widths. Then — the changelog and a commit if there is `.git`
(rule 3).
