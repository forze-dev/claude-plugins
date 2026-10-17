# Task: <short name>

> Copy this file to `docs/tasks/<slug>.md` and fill it in, in the conversation
> language from rule 1 of `CLAUDE.md`. Don't invent another shape — the format
> exists so that any agent can pick up any stage.

| | |
| --- | --- |
| **Status** | draft / in progress / blocked / done |
| **Created** | DD.MM.YYYY |
| **Owner** | who is responsible for the result |
| **Done when** | one sentence that makes the task objectively finished |

## Context

Why this exists. What the client asked for — in their words where possible.
What happens now and why it's not enough. Links to the brief, design,
screenshots, the previous task this follows from.

Separately record what is **already decided** — so no agent reopens it — and
what is still open.

## Scope

**In** — a list concrete enough to argue with.

**Out** — things that would otherwise be assumed included. Write them out;
this section saves most wasted work.

## Constraints

Rules this task must follow. Always carry over the relevant ones from
`CLAUDE.md` and add task-specific ones. For example:

- every visible contact comes from `src/site.config.js`, not typed into a page;
- one page per session — if the task needs four pages, it needs four sessions;
- JSON-LD and microdata describing one entity are linked through `itemid`;
- the build is deterministic: same inputs — byte-identical `dist/`;
- invent nothing: an unknown fact is asked for, not assumed.

## Stages

Each stage is a piece of work one agent can finish and verify on its own.
Number them. A stage never depends on a later one.

---

### Stage 1 — <name>

**Goal.** One sentence: what becomes true after this stage that wasn't before.

**Files this stage touches.** List them. If the list is unknown, the stage's
first job is to find out and write it here.

**Steps.**

1. …
2. …

**Check — must pass before Stage 2 starts.**

- [ ] `npm run build` passes
- [ ] a concrete, checkable claim about the output, not "looks fine"
- [ ] no regression in the checks added by previous stages

**Prompt for the implementing agent.**

```
You are working in <repository>, a static Astro site. First read CLAUDE.md
and follow it — these are mandatory rules, not suggestions. Talk to the
developer in the language set in rule 1.

BEFORE ANY CHANGES analyse:
- docs/tasks/<this file> — entirely, not just this stage
- <the specific files this stage touches>
- <a component or page where something similar is already done — name it>
Report what you found and what you're going to change, and only then start.

TASK
<what to do, concretely, in terms of files and behaviour>

CONSTRAINTS
- <the rules from "Constraints" that apply here>
- Don't touch <what's out of scope>

CHECK, and don't report success until every item has really passed:
- <the checklist items, phrased as commands and claims>
- Look at the built dist/ rather than assuming it follows from the code.

WHEN DONE
- Write docs/changelog/<today>.md: what you changed, why, what you checked,
  and what couldn't be checked and why.
- Add a line to docs/changelog/changelog.md.
- If there is a .git at the root — commit, naming the task and the stage.
  If there is no .git — run no git commands; mark the changelog entry [stage N].
- Report what's left. If something couldn't be checked, say so plainly
  instead of implying it works.
```

---

### Stage 2 — <name>

**Depends on.** Stage 1, specifically on <what it produced>.

**Re-check before starting.** The previous stage's check is **run again**, not
assumed passed. If it fails, this stage stops and the previous one is reopened.

- [ ] Stage 1's check still passes
- [ ] `docs/changelog/<day>.md` has an entry for Stage 1
- [ ] Stage 1's commit exists (or, without git, a `[stage 1]` changelog entry)

**Goal / Files / Steps / Check / Prompt** — the same structure as Stage 1.

---

## Open questions

What a person has to answer. Each item names who answers and what is blocked
until then. An agent that hits such an item stops and asks — it doesn't guess.

## Definition of done

For the whole task, not a stage:

- [ ] every stage verified
- [ ] `npm run build` is clean
- [ ] a changelog entry exists for every stage
- [ ] this file moved to `docs/archive/` with a note at the top
