# Planning Docs — `todo/` is open work, `research/` is documentation

Two folders, two jobs. Never mix them.

| Folder | Holds | Test |
|---|---|---|
| `todo/` | **Work not yet done** — proposals, implementation plans, task breakdowns | "Is someone still supposed to build this?" |
| `research/` | **The system as it is** — architecture, module deep-dives, and design records of decisions that already shipped | "Does this describe something that exists today?" |

A plan is a task while it is open and becomes documentation once it ships, so `research/` may hold
`PLAN_*.md` files — but only ones whose status is `IMPLEMENTED`, kept because they explain *why* the
system looks the way it does.

## Creating a plan

`todo/PLAN_<snake_case_topic>.md`. Never write a new plan into `research/`. Every plan opens with a
status line on the second or third line, so a reader knows its standing before reading anything else:

```markdown
# PLAN — <what this achieves>

> Status: **plan only, nothing implemented yet, <YYYY-MM-DD>.** Scope: <what it touches>.
```

A plan carries: the symptom or goal **before** any solution, references to real code as `file.cs:line`
(verified, not guessed), a build order, a test plan, and a Definition of Done checklist.

## Promoting a finished plan

1. `git mv todo/PLAN_x.md research/PLAN_x.md`
2. Status becomes `> Status: **IMPLEMENTED, <YYYY-MM-DD>.**` — **and record the deviations.** What
   shipped differently from the plan is the most valuable part of the record, and the part a future
   reader actually needs.
3. Fix relative links in both directions and every inbound `.cs` / `.md` reference.
4. Update the *Currently open* table in the repo's `todo/README.md`.

**Check at task completion, every time.** Before reporting work done, ask whether it finished a plan —
or whether a plan's status line simply no longer matches reality. Promote it in the same task, not
later. This convention was once written down long before anything made anyone run it, and by the time
someone looked, twelve implemented plans had piled up in `todo/`, one still claiming *"nothing
implemented yet"* after its entire measurement series had run.

## Partially implemented plans

Stay where the **majority of their value** lives. A plan that already documents shipped behaviour
belongs in `research/`; its unfinished phases are extracted into a fresh `todo/` plan rather than
holding the whole document hostage.

## Across repositories

- **A change that crosses a repository boundary is named in both repos' plans** — a plan that exists on
  only one side of a boundary is a plan the other side will contradict.
- **Cross-repository citations are paths, not links** — `dew_flow_mcp · research/architecture.md:12` —
  because a relative link that resolves only on one machine is worse than a citation that names its
  source. Findings that matter are **carried over** into the citing repo rather than linked, so nothing
  depends on a checkout that may not exist.

## Never

- A new, unimplemented plan in `research/`.
- An implemented plan left in `todo/` — it reads as outstanding work forever.
- A plan moved on the strength of its filename; the **status line** decides.
- `todo/` used for scratch notes or session summaries. It holds plans meant to be executed.

## Definition of Done

- [ ] New plans are in `todo/`, with a status line on line 2–3, verified references, a build order, a test plan and a DoD.
- [ ] The completion check ran: every plan the work touched was re-read and promoted if finished.
- [ ] Promoted plans carry `IMPLEMENTED <date>` **and their deviations**.
- [ ] Both folder READMEs match their folders.
