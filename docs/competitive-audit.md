# Competitive audit: turn-key landing pages with Claude Code

Date: 2026-10-17. `landing@forze` (and the template it grew from) compared with
three groups of alternatives: other Claude Code skills/plugins, AI website
builders, and ready-made Astro templates.

> Popularity numbers and descriptions of third-party products come from their
> own pages and from directory aggregators; they were not independently
> verified. Check each point directly before any public comparison.

## 1. Claude Code skills and plugins for landing pages

| Product | What it does | Output | SEO / schema | Form & back end | Deploy |
| --- | --- | --- | --- | --- | --- |
| **alirezarezvani `landing`** (plugin, `/cs:landing`) | 4 questions (product, audience, colors, tone) → one HTML file with GSAP animations | single `.html`, inline CSS/JS, Google Fonts and GSAP from CDN | not stated | none | none |
| **alirezarezvani `landing-page-generator`** | conversion-focused landing | Next.js + Tailwind | not stated | none | none |
| **kuse-ai `landing-page-creator`** | landing generation, brand-consistent design | HTML/CSS in the project | not stated | none | none |
| **wshobson/agents `brand-landingpage`** | brand-styled landing, part of a large agent suite | not described | not stated | not described | not described |
| **Felo Landing Page** | generates a page from a prompt and hosts it | page on Felo's domain | not stated | — | Felo hosting, needs an API key |

**Common to all:** they generate *markup* — fast and good-looking, from a
single prompt. None covers the rest of the path to a live client site: a brief
built from real materials, fact checking, a form that actually delivers
leads, structured data, a legal page, deployment to ordinary hosting, and a
pre-launch check.

## 2. AI website builders

| Product | Strong | Weak for our use case |
| --- | --- | --- |
| **Framer AI** | best visual result out of the box | Framer hosting, proprietary markup, static export is not the main path, subscription |
| **Lovable** | front end + back end + database together, React/Tailwind | SPA: without prerendering crawlers see an empty page; managed services don't export as code |
| **v0 (Vercel)** | clean React/Tailwind components | front end only; back end, form and deploy are on the developer; tied to the Vercel ecosystem |
| **Bolt** | more control for technical users | React/Next in WebContainer; static export not confirmed |
| **Durable** | a site in ~30 seconds | minimal markup without semantic depth; own hosting |

**Common to all:** speed and visuals, paid for with hosting lock-in, an SPA or
weak semantics. None produces an archive you upload to a cheap cPanel plan and
forget.

## 3. Ready-made Astro templates

| Product | Has | Lacks |
| --- | --- | --- |
| **Stone** (premium) | 15+ sections, dark mode, View Transitions | form back end, schema, process |
| **SaaSify** (Colorlib; price differs between sources) | SaaS landing | form back end, local business |
| **Studiova** (WrapPixel, commercial) | business/agency, "SEO-friendly" | form back end, PHP deploy |
| **Astrolize** (free) | Astro + Tailwind, landing and blog | form via a third-party service (FabForm) |
| Astro + Telegram tutorials (Rodney Lab, mpz.im) | form → Telegram | serverless only (Netlify), not PHP/cPanel; no schema |

**Common to all:** a template is markup. Someone still has to collect the
brief, fill it in, wire the form, check it and deploy it. No ready solution
for PHP/cPanel with Telegram and structured data in both formats was found.

## 4. Our template (before the plugin) — honestly

Strong:

- one config for the whole site, verified: changing contacts rewrites 100% of the output;
- determinism that is actually checked (two builds → identical `dist/`);
- its own pre-launch check `check.mjs` that fails on placeholders;
- a form with careful anti-spam (honeypot, fill time, file signatures);
- JSON-LD + microdata linked through `itemid`;
- an agent process: staged tasks, changelog, rules.

Weak (audit of 2026-10-17, fixed in the plugin):

| Problem | In the plugin |
| --- | --- |
| Vercel function capped at 4.5 MB while the form promised 20 MB | PHP/cPanel only — no such cap |
| `npm audit`: 3 high, docs said "clean" | lock updated with transitive patches, audit clean |
| `/add-page` taught `graph(...)` — an invalid graph | fixed, with the reason explained |
| thank-you page: white card on white | fixed |
| `.htaccess` without HTTP→HTTPS | one redirect to https + non-www |
| "20 MB" hard-coded in 6 places | `{size}`/`{types}` from `SITE.form`, `.htaccess` generated |
| microdata diverged from JSON-LD (address, description, phones) | one node in the footer, values match |
| English strings scattered across components | `SITE.ui` + `messages` |
| `/start` ignored `temp/`, rules required git | the skill reads materials first; rule 3 works with or without git |
| rate limit before file validation blocked a retry | rate limit after the file |
| client showed the same error for 429 | separate message |

## 5. Positioning of `landing@forze`

The niche none of the above covers: **"a small-business site from raw
materials to a cPanel archive" for someone who is not a developer.**

| Capability | CC skills | AI builders | Astro templates | **landing@forze** |
| --- | --- | --- | --- | --- |
| Brief from real client materials, nothing invented | — | partly | — | **yes** |
| Static HTML visible to search engines | yes | depends | yes | **yes** |
| Form that delivers leads (Telegram), with anti-spam | — | partly | — | **yes** |
| Ordinary PHP hosting (cPanel) | — | — | manual | **yes, zip** |
| JSON-LD + microdata, in sync | — | — | — | **yes** |
| Pre-launch check that blocks placeholders | — | — | — | **yes** |
| Deterministic build and archive | — | — | — | **yes** |
| Project lives on without the tool | yes | no | yes | **yes** |
| Visual "wow" from one prompt | **yes** | **yes** | yes | moderate |

### Honest weak spots and what to do about them

1. **Visuals are plainer than Framer and the animation skills.** The scaffold
   is clean and restrained, no animations. Direction: 2–3 design themes
   (tokens) and an optional animated section that doesn't hurt Core Web Vitals.
2. **Entry barrier — Claude Code on a PC.** The user has to install and pay for
   it. The plugin removes the need to know Node/npm/git, not the install itself.
3. **No local form check without PHP.** The skill offers to install PHP;
   without it the form is verified on the hosting.
4. **One receiver out of the box (Telegram).** Email/CRM follow documentation
   the user provides. Direction: a built-in SMTP receiver as a second option.
5. **One site type only.** On purpose. Next plugins in the `forze` marketplace
   are separate products (`blog@forze`, `shop@forze`), not extensions of this one.

## Sources

- [alirezarezvani `landing` — Claude Plugin Hub](https://www.claudepluginhub.com/plugins/alirezarezvani-landing-marketing-landing)
- [Landing Page Generator — Claude Code Marketplaces](https://claudemarketplaces.com/skills/alirezarezvani/claude-skills/landing-page-generator)
- [Landing Page Creator — Claude Code Marketplaces](https://claudemarketplaces.com/skills/kuse-ai/kuse-skills/landing-page-creator)
- [brand-landingpage — vibeindex](https://www.vibeindex.ai/skills/wshobson/agents/brand-landingpage)
- [Felo Landing Page Skill](https://felo.ai/skills/claudecode/felo-landingpage)
- [Best AI Landing Page Builders 2026 — Dupple](https://dupple.com/learn/best-ai-landing-page-builders)
- [AI Website Builder Comparison — Till Freitag](https://till-freitag.com/en/blog/ai-website-builder-comparison)
- [Lovable vs Webflow vs Framer — Till Freitag](https://till-freitag.com/en/blog/lovable-vs-webflow-vs-framer)
- [Premium Astro Templates — AdminLTE](https://adminlte.io/blog/premium-astro-templates/)
- [Astro website templates — Colorlib](https://colorlib.com/wp/astro-website-templates)
- [Studiova — WrapPixel](https://wrappixel.com/templates/studiova-astro-business-agency-website-template)
- [Astrolize starter — godev](https://godev.substack.com/p/starter-template-for-astro-with-tailwind)
- [Astro landing page form — Rodney Lab](https://rodneylab.com/astro-landing-page-form/)
- [Plugins reference — Claude Code docs](https://code.claude.com/docs/en/plugins-reference)
- [Create a marketplace — Claude Code docs](https://code.claude.com/docs/en/plugin-marketplaces)
