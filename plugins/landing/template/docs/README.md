# Documentation

Every project on this scaffold keeps its own written record here. This is not
optional: a task that isn't written down can't be handed to another agent,
picked up a week later, or explained to the client.

These templates are in English. Task files and changelog entries are written
in the conversation language set in rule 1 of `CLAUDE.md`.

```
docs/
├── changelog/
│   ├── changelog.md        index — one line per day, linking to the day file
│   └── DD.MM.YYYY.md       one file per day, everything done that day, in detail
├── tasks/
│   ├── _TEMPLATE.md        the task format — copy it, don't invent your own
│   └── <task>.md           one file per task, split into stages
└── archive/                closed tasks and outdated documents
```

## changelog

`changelog.md` is the index. One short line per working day, newest first,
linking to the day file. Several stages on one day update that day's line —
they don't add new ones. It's for a quick overview, not for details.

`DD.MM.YYYY.md` — one file per day, **never more**. Everything done that day
goes there: what changed, why, what broke, what was checked and how. Detailed
enough that someone who wasn't there can reconstruct the reasoning.

A new entry is written **after every task stage**, together with that stage's
commit (if the project has `.git`; without git — an entry marked `[stage N]`,
see rule 3 in `CLAUDE.md`). Not at the end of the week and not "when there's time".

## tasks

One file per task, created **before the first line of code is written**. On a
new project it is the very first artifact: collect the brief → write it as a
task → only then implement.

A task is split into stages. Each stage ends with a ready prompt for the agent
that will do it, and a check that must pass before the next stage starts. The
format is in `_TEMPLATE.md`; copy it rather than inventing a new shape.

Tasks are written so they can be handed to **several agents working
separately**. So a stage must be self-contained: an agent that reads only that
stage and the files it names must be able to do the work without asking what
was meant.

## archive

When a task is done or a document stops being true, it moves here instead of
being deleted. Keep the file name; add a line at the top: when it was closed
and why.

The point is that `docs/tasks/` only ever holds live work.
