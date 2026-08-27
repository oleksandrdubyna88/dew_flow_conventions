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

### A plan that creates something that GROWS names its budget — before the first write

Reviewed across 21 plans on 2026-08-16: the single most repeated omission was a design that adds a
table, a collection, a directory, a cache or a spawned process and says nothing about how large it gets
or who retires it. It is not a small omission at this family's volumes. One review pass found a variant
matrix whose corpora were assumed to be 24 and were actually the cross product — **96**, at ~2 GB each,
≈190 GB for one target repository — against a recorded incident where 24.38 GB of vector store was
already the crisis; four new append-only payload tables with no retention line between them; and a
`Building` state with no sweep, which blocks every cell of its variant forever after one restart.

[reliability.md](reliability.md) § *Everything that grows has an owner* governs the CODE. This governs
the PLAN, and it is deliberately earlier: retention chosen after the first write is a migration and a
conversation about data somebody already values, while retention chosen in the plan is a sentence. So
any plan introducing a growth surface carries a short section naming, for each one:

- **the projected size** at the plan's own stated volumes — a number, computed, not "small";
- **who retires it** — a window, a rollup, an eviction rule, or an explicit *"kept forever, projected
  N GB, stored on X"*, which is a legitimate answer once it is a decision rather than an oversight;
- **what happens when it is interrupted** — anything with an in-flight state also names the sweep that
  ends rows a crash stranded, and the host that invokes it.

Two anti-patterns this exists to stop, both observed: a growth bound described in a sibling plan and
assumed by this one without a link (the two then disagree — one deletes on finish, the other needs the
artefact back later), and a state machine whose non-terminal state has no timeout.

## Promoting a finished plan

1. `git mv todo/PLAN_x.md research/PLAN_x.md`
2. Status becomes `> Status: **IMPLEMENTED, <YYYY-MM-DD>.**` — **and record the deviations.** What
   shipped differently from the plan is the most valuable part of the record, and the part a future
   reader actually needs.
3. Fix the links. **There are THREE cases, not two** — see below.
4. Update the *Currently open* table in the repo's `todo/README.md`.


### The `git mv` goes LAST, not first

The numbering above is the order of a checklist, not the order to work in. Done literally — move,
then rewrite, then fix links — the rename sits **staged** for the whole of the rest, and a `git mv`
has already staged itself: any peer's plain `git commit` in that window carries it away. No shared
file, no `git add <path>`, nothing to notice.

Measured 2026-08-27, on a session that had written the rule about this an hour earlier. What made it
more than a wrong commit message is the shape it left: the **add** was swept and the **delete** of
`todo/PLAN_x.md` was not, so the plan sat in BOTH folders at HEAD and the lifecycle check went red —
the swept-HALF that [git-workflow.md](git-workflow.md) rule 10 step 2 exists to make you look for.

**"Commit the `git mv` immediately" does not rescue a promotion**, which is why it needs saying here
rather than being left to that rule: a promotion is a move *plus* a status rewrite *plus* link fixes
in several files, and committing the move alone lands a plan in `research/` still claiming it is
unfinished. The window is structural, not carelessness — unless you invert the order:

```bash
$EDITOR todo/PLAN_x.md          # status → IMPLEMENTED, links written for the DESTINATION
$EDITOR <inbound referrers>     # every case-3 link, and todo/README.md
git mv todo/PLAN_x.md research/PLAN_x.md
git add research/PLAN_x.md      # git mv staged the ORIGINAL bytes — see rule 8
git commit -- research/PLAN_x.md todo/PLAN_x.md <the rest>
```

Every edit happens while the file is still in `todo/`, where nothing about it is staged; the move is
the last thing done and is committed in the same breath. The exposure shrinks from the length of the
whole promotion to the seconds between `git mv` and `git commit`.

The cost is one transient inconsistency: between the rewrite and the move, `todo/PLAN_x.md` claims
IMPLEMENTED and carries destination-relative links, so a peer running the lifecycle check in that
gap sees a finding. That is smaller, shorter and self-correcting — unlike half a move on `main`.

### The three link cases, because "both directions" hides one

This step used to read "fix relative links in both directions", and it failed twice on 2026-08-16 —
in two different repositories, found by accident. "Both directions" invites you to think about links
whose **target** moved, and there are two of those. The one that breaks is the third, where the target
never moved at all:

| # | The link | What happens | Fix |
|---|---|---|---|
| 1 | **The mover's own links to plans still in `todo/`** | The source moved, the target did not. Nothing about the target changed, so nothing draws attention to it — and the link now resolves inside `research/`, where the file is not. | **Add** `../todo/` |
| 2 | The mover's own links to things already in `research/` | Now siblings | **Drop** the `../research/` |
| 3 | Inbound links pointing AT the mover | From `todo/`: add `../research/`. From `research/`: drop the `../todo/` | Rewrite each |

Case 1 is the invisible one and it is the one that broke: a promoted plan kept a sibling-style link to
the founding plan it implements, which was still open, so it pointed at a `research/` file that does not
exist. Both instances survived every subsequent read of those documents.

Also fix every inbound `.cs` / `.md` reference outside these folders — a plan is cited from code
comments, and those citations are paths rather than links, so no renderer will ever complain.

**Verify by walking, not by remembering.** The check is mechanical: for every markdown link in `todo/`
and `research/`, resolve it relative to its own file and assert the target exists.

*Restored 2026-08-17.* This paragraph used to end "nothing in this family currently runs that check —
the predecessor repository had it as a test and it was lost in the split into four". It is now
[`tools/plan-lifecycle.mjs`](../tools/plan-lifecycle.mjs), run by every consumer's CI:

```bash
node .claude/rules/shared/tools/plan-lifecycle.mjs
```

Six findings, all of them failures this family has actually made: a plan with no status line where the
convention says to look, a finished plan left in `todo/`, an unstarted one sitting in `research/`, a
link between the folders that does not resolve, the open table drifting from its folder, and a promoted
plan the research index never mentions. One implementation for all four repositories rather than a copy
each — the check reads markdown, not code, and one of the four is Rust.

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
- [ ] Every growth surface the plan creates names its projected size, who retires it, and its sweep.
- [ ] The completion check ran: every plan the work touched was re-read and promoted if finished.
- [ ] Promoted plans carry `IMPLEMENTED <date>` **and their deviations**.
- [ ] All three link cases were fixed, and checked by resolving every link rather than from memory —
      including the invisible one, the mover's own links to plans that stayed in `todo/`.
- [ ] Both folder READMEs match their folders — and a README row is committed in the SAME commit as the
      plan it links, never before it ([git-workflow.md](git-workflow.md) § *a reference and its target are
      one commit*; a row pointing at an untracked file is a broken link in every clone but yours).

## A boundary between two plans is named on BOTH sides (MANDATORY)

When a new plan takes a slice of an existing one — the common case, because a plan large enough to be worth
writing is large enough to be built in pieces — it is not enough for the newcomer to say which slice it
took. **Go back and write the same boundary into the older document.**

Measured here 2026-08-16: a plan authored a day after another read it and delimited its slice carefully, in
prose, in two sections. The older plan said nothing. A reader starting from the older one would have built
commit stamping and chunk variants a second time, and neither author would have been careless — the
division existed, it was simply legible from one direction only.

The cheap shape that holds:

- **A table, not a paragraph**, in both documents: item · which plan builds it · what the other one's part is.
- **State the order** — which plan goes first, and why. Usually the one that lands a field or a seam the
  other generalizes.
- **Say what is disjoint**, so the table is read as complete rather than as examples.

A division of labour named on one side is not a division of labour. And the failure it produces — duplicated
work discovered late — is the same one that closing repository boundaries was meant to end.
