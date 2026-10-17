---
description: Add a page with correct SEO, breadcrumbs and structured data in both formats.
---

Add a new page to this Astro site. If the developer hasn't said what it is for
and what it should be called — ask.

**One page per session** (rule 5 in `CLAUDE.md`). If no task covers this page
yet — first write one from `docs/tasks/_TEMPLATE.md` (rule 3).

The reference inner page is `src/pages/privacy-policy.astro`. References for
the FAQ and sections — `src/pages/index.astro`.

Requirements, all of them:

1. **File** — `src/pages/<slug>.astro`. That's the whole routing step. Don't
   touch `server/htaccess.template` or the sitemap: they are generic.

2. **Layout** — `Base` for a regular page, `Bare` for a standalone screen
   without header and footer.

3. **SEO props** — `title`, `description` (40–160 characters, written for a
   person), `ogImage` if the page deserves its own social preview. Don't set
   `canonical`.

4. **Structured data** — the `schema` prop takes an **array** of the page's own
   nodes. Not `graph(...)`: the `@graph` wrapper, the business and `WebSite`
   are added by the layout, and a `graph()` inside it would produce a nested,
   invalid graph.

   ```astro
   import { SITE } from '../site.config.js';
   import { webPage, breadcrumbs } from '../lib/schema.js';

   const trail = [{ label: SITE.ui.home, href: '/' }, { label: 'Services' }];
   const schema = [webPage('/services', { name: title, description }), breadcrumbs(trail)];
   ```

   Pass **the same** `trail` array to `<Breadcrumbs trail={trail} />`. If the
   page has questions — add `faqPage(faq)` and feed it the same array that
   `<Faq entries={faq} />` renders.

5. **Microdata too** — rule 7. Values come from the same arrays and from
   `site.config.js`, never typed into an `itemprop` by hand. The business is
   already described by the footer — don't add a second business node.

6. **Styles** — a new file in `src/styles/pages/`, imported by the page.
   Sections from `src/components/sections/` can be reused. Tokens from
   `variables.css` only, no raw colors or pixels.

7. **Content** — real copy, in the site language. Don't know the business
   facts — ask (rule 4).

8. **Navigation** — the landing has an anchor menu (`/#id`). If the page
   belongs in the menu, add it to `SITE.nav` as a plain path (`/services`).

At the end: `npm run build` and `npm run check`. Confirm in the built HTML that
the canonical matches the sitemap entry, the JSON-LD parses, and the microdata
is in place.

Then — an entry in the day's changelog file, a line in
`docs/changelog/changelog.md`, and a commit if the project has `.git` (rule 3).
