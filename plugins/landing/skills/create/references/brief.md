# Brief: what must be known before the task file

Every item comes either from the client's materials (with its source) or from
the person's answer. **[req.]** — without it the site can't honestly be built;
the rest has a sensible default the person only confirms.

## Identity

| What | Config key | Note |
| --- | --- | --- |
| Business name **[req.]** | `name` | as the client wants to appear in search |
| Short name | `shortName` | ≤ 14 characters, for the header and the home screen |
| Domain **[req.]** | `url` | no trailing slash; without a domain there is no canonical and no sitemap |
| One- or two-sentence description **[req.]** | `description` | 120–160 characters; goes into search and the footer |
| Site language | `lang`, `locale`, `messages`, `ui` | default — the language of the materials |
| Business type | `businessType` | has an address visitors come to → `LocalBusiness` or a subtype (`Dentist`, `Restaurant`, `BeautySalon`, `AutoRepair`…); online only → `Organization` |

## Contacts

| What | Where | Note |
| --- | --- | --- |
| Phone(s) **[req.]** | `PHONES` | in E.164: `+380671234567` |
| Country number format **[req.]** | `PHONE_FORMAT` | `countryCode`, `digits` (after the country code), `groups`. Ukraine: `+380`, `9`, `[2, 3, 2, 2]` → `+380 (67) 123-45-67`. USA: `+1`, `10`, `[3, 3, 4]` |
| Email **[req.]** | `contacts.email` | |
| Address | `contacts.address` | street, city, region, postal code, ISO country code; none → `null` |
| Coordinates | `contacts.geo` | from Google Maps; none → `null` |
| Opening hours | `contacts.hours` | days in English (`Monday`…) for schema.org + a `label` in the site language |
| Messengers | `messengers` | only those the client gave; Telegram — a `t.me/…` link, WhatsApp — from the number |
| Social profiles | `social` | full URLs |

## Design

| What | Note |
| --- | --- |
| Design source | Figma / current site / screenshots / "up to you" (then — the scaffold's look) |
| Brand color | hex; from the logo or the mockup. None — offer 3 options, the person picks |
| Logo | SVG or PNG with a transparent background; none — the scaffold's text mark |
| Photos | real photos of the business; without them the hero has no image — that's fine |

## Landing content

| What | Note |
| --- | --- |
| What they sell and to whom **[req.]** | the basis of the hero |
| Services / products | names, short descriptions; **prices only if the client gave them** |
| Advantages | only verifiable ones ("same-day visit"), not "best in town" |
| Work steps | if the process matters to the client's decision |
| Questions and answers | from conversations with customers, if available |
| Reviews | **real ones only**, with permission to show the name |
| Work photos | for the gallery |

## Technical

| What | Note |
| --- | --- |
| Hosting | cPanel / another Apache with PHP 8.1+. Any other hosting type is outside this skill's scope |
| Lead receiver | Telegram (built in). Anything else — see `receivers.md` |
| Bot and chat id ready? | If not — give the instructions from `receivers.md`; the person enters the values in `.env` |
| Analytics | GTM id (`GTM-…`) or GA4 (`G-…`) or nothing |
| File size limit in the form | default 20 MB; cheap hosting may need less |

## How to ask

- Group: identity together, contacts together, design together.
- Offer options with the default first: "Site language: Ukrainian (as in the
  brief) / English / both — bilingual is out of scope".
- Show a conflict with both values and their sources: "The brief has
  +380 67…, the mockup has +380 50… — which is right?"
- Don't ask about what was already found in the materials — just confirm it as a list.
