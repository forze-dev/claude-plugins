# Landing sections: catalog and how to build the page

All sections live in the scaffold's `src/components/sections/`. Section data
are arrays in the frontmatter of `src/pages/index.astro`; components only render.

## Catalog

| Section | When to use | Props |
| --- | --- | --- |
| `Hero` | always, first | `title` (h1), `lead`, `facts[]`, `primary?`, `secondary?: {label, href}`, `image?: {src, alt, width, height}` |
| `Cards` | services, advantages, "who it's for" | `id`, `title`, `lead`, `items: {title, body, price?, icon?}[]`, `columns` 2/3, `surface` |
| `Steps` | the process matters to the decision | `id`, `title`, `lead`, `items: {title, body}[]`, `surface` |
| `Section` + `Gallery` | there are photos of work / premises | `items: {src, alt, caption?, width, height}[]`, `label`, `hint` |
| `Testimonials` | **there are real reviews** | `id`, `title`, `items: {quote, author, role?}[]` |
| `Section` + `Faq` | there are customer questions | an array of `{question, answer}`; the same one goes into `faqPage(faq)` |
| `Cta` | between blocks when the page is long | `title`, `text`, `label?` |
| `Contacts` | always, last, `id="contacts"` | `title`, `lead`, `formTitle`, `formNote` |

## Typical order

1. `Hero` — what, for whom, the main action.
2. `Cards` (services) — `id="services"`, `surface`.
3. `Cards` (advantages) or `Steps` — why you / how you work.
4. `Gallery` — if there are photos.
5. `Testimonials` — if there are reviews.
6. `Cta`.
7. `Faq` — `id="faq"`, `surface`.
8. `Contacts` — `id="contacts"`.

Alternate `surface` between neighbours. Don't add a section without data — an
empty section is worse than none. Every menu item (`SITE.nav`) = `/#<id>` of an
existing section; 4–5 items at most.

## Copy

- **Hero `title`** — a one-sentence promise in the customer's words: what the
  visitor gets. Not the company name (it's already in the logo and `<title>`).
- **`lead`** — 2–3 sentences: for whom, which problem it removes, what to do next.
- **`facts`** — 2–4 verifiable statements from the brief. None — leave it out.
- **Services** — a name + 1–2 sentences of benefit. Price only from the brief,
  in the client's format ("from 1,500 UAH").
- **FAQ** — real questions; answers of 1–3 sentences. Answers may contain
  `<a>` and `<strong>`.
- Edit the client's copy for the web (shorter, more concrete), but never add
  facts that aren't in it.

## Page SEO

- Page `title` ≤ 60 characters: `<what> in <city> — <name>` for a local business.
- `description` 120–160 characters, with the city and the main service.
- One h1 (in `Hero`), then h2 in the sections — `Section` already ensures this.
- Every photo gets an `alt` — what is on it, not "photo 1".
- `width` and `height` — the file's real dimensions.

## A new section not in the catalog

A component in `sections/` that wraps its content in `Section.astro`, plus CSS
in `src/styles/sections/` that the component imports itself. Tokens from
`variables.css` only. Describe it in the "Landing and sections" table of the
project's `CLAUDE.md`.
