---
id: "common.plan-change-control"
load: "conditional"
tasks: ["audit","plan","implement","docs","policy","test","git","pr","release","deploy","dependencies","http","benchmark","logging"]
depends: ["common.planning-docs"]
---
# A plan changed twice after its approval stops for a whole re-review (MANDATORY)

<!-- owns: coai — the server named in every tool below and in the coai rule files this one links -->
<!-- owns: mcp__coai__review_plan — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__review_code — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__review_document — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__resolve — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__consult — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__ask_consultants — a tool name a session types; there is no generic spelling of it -->

> This governs a plan's life AFTER its first approval. Where plans live:
> [planning-docs.md](planning-docs.md). Who acts: [subagent-models.md](subagent-models.md). How a round runs:
> [coai-review-gate.md](coai-review-gate.md).

**After the first approval, ONE change is allowed — record it and go on. The SECOND is a full stop: no new code on any epic of the plan until the whole plan has been reviewed again.**

## Why — measured

*The case that made the rule.* A plan in this family passed its plan review on 2026-10-21. Then a story was
added (the owner, 2026-10-26); two stories moved to a remainder plan; a platform run and one of its tests left the merge
conditions (the owner, 2026-10-27); eight lines were rewritten after a later review; and a merged predecessor
epic had its contract rewritten and its 308-line script replaced by an 874-line one, while its release never
happened. Each was judged alone; all were first seen together at promotion. Counted by this rule, the stop comes
on 2026-10-26, before the merge conditions were cut.

*This rule's own first run.* The plan that introduced it ran under it from its first approval on 2026-10-28. Its
second change, the same day (an entry indented one space hid from the count), stopped it. The re-review was consulted,
nothing was cut, and the owner approved a narrowed epoch 2 on 2026-10-29, as the first change had made the merge
conditions smaller.

One change is learning; the second triggers a review of whether the plan's model of the work is drifting — the same
signal as a test still red after two fixes or a person saying twice that it is still broken
([coai-consultant.md](coai-consultant.md), triggers 1 and 4).

## What counts as a change

A change is an accepted change to scope, goals, the Definition of Done, the merge conditions, epics or stories (added,
removed, moved to another plan), the build order, a contract or the approach. A review finding accepted after approval
that changes a planned step counts on the day it is accepted.

Not a change: wording, a typo, a repaired reference, ticked boxes, a progress table, a fix that only satisfies the plan
as written, an epic's stories document written when the epic starts. **In doubt, it is a change.**

**An owner's request counts exactly like one you find.** The count measures how far the plan moved, not whose idea it was.

One cause is one change, however many lines it edits; independent causes count one each, even in one review round. The
FIRST change is not free of the other rules: if it changes the shape of the work, trigger 5 of
[coai-consultant.md](coai-consultant.md) still fires before `mcp__coai__resolve`.

## How it is counted

- Per parent plan, across sessions, branches and epics. A stories document keeps no ledger; its changes are
  entries in the parent.
- Approval is the first passing plan-round verdict (`proceed`, `good_enough` or `continue_anyway`) or the owner's
  go-ahead where no review server runs, whichever comes first. It opens epoch 1: that commit writes the heading and
  the epoch 1 line.
- Two branches that each record one change merge into a plan with two: the check turns red at the merge, which is where
  the stop belongs. That merge or the commit after it renumbers the later entry `k.2` and writes the stop.
- A plan approved before this rule reaches its repository (with the rules pin)
  gets its ledger at its next change: that commit opens it, epoch
  1 dated at the plan's last approval, the change as entry 1.1. Earlier changes stay in the deviations. No open plan
  stops on arrival.

## The ledger

Its heading is exactly `## Plan changes`, directly under the status block, before the first other section, so `## Epics`
stays last. Append only; each entry goes in the commit that accepts its change.

```markdown
## Plan changes

> Epoch 1 · approved 2026-10-21 · by reviewers · state: closed

- 1.1 · 2026-10-24 · owner · epics — consumers need the helper as a shipped file; S8 added
- 1.2 · 2026-10-26 · reviewer · approach — restore before capture; S3 and S4 rewritten
  (Free text is indented, like this line. This second change stopped the plan.)

### Re-review for epoch 2

Narrowed: yes — the Windows run left the merge conditions

| Work | Where | Verdict | Action |
|---|---|---|---|
| S5a classifier, 2fb413c | main | fits | kept |
| quarantine step, b2df09c | pushed, unmerged | cut | revert commit 1a2b3c4 |

> Epoch 2 · approved 2026-10-28 · by owner · state: open

- 2.1 · 2026-10-29 · agent · build-order — E3 needs E2's helper first
```

Line shapes: `> Epoch <k> · approved <YYYY-MM-DD> · by reviewers|owner · state: open|stopped|closed` and
`- <k>.<n> · <YYYY-MM-DD> · owner|agent|reviewer · <kinds> — <cause>`, kinds comma-separated from `scope`, `goals`,
`dod`, `merge-conditions`, `epics`, `stories`, `build-order`, `contract`, `approach`. The highest epoch is current, the
rest `closed`. The separators are ` · ` (U+00B7) and ` — ` (U+2014), never `|`, `--` or an en dash; keywords and values
are lower case as shown.

**Free text is INDENTED.** Every ledger line stands at column 0; anything else goes on an indented line. A prose line at
column 0 is a finding: it reads like an entry that lost its `- `, and a lost entry lowers the count in silence.
**Reserved prefixes:** an indented line that starts like a ledger line — an entry number, with or without list markers
(`- 1.2`, `1. 1.2`, `- - 1.2`, a bare `1.2`), a `>` or a `#` — is a finding too (a renderer shows a list item, quote or
heading). Free text may not begin that way; write `  (quoted) …` or `  version 1.2 …`.

The re-review record, `### Re-review for epoch <k>` before epoch k's line for every k ≥ 2, holds one `Narrowed: yes|no`
line (optionally ` — <why>`) and a `| Work | Where | Verdict | Action |` table of at least one row; the verdict is
`fits`, `cut` or `—` (nothing was built). While stopped it may stand without a next epoch line. **The count
is never written**: it is the entries of the current epoch.

## The full stop

1. **Record** the second entry, set `state: stopped` and say `stopped for re-review` in the status paragraph; one
   commit, pushed. Another branch sees the stop only when it reads this one.
2. **Halt.** No new code on any epic of the plan, no merge of a pull request carrying its work. Allowed: the re-review,
   its reverts, work outside the plan, an incident fix the owner orders.
3. **Consult.** One `mcp__coai__consult` for the re-review, every change of the epoch quoted as evidence; owner
   questions go through `mcp__coai__ask_consultants` first. None to be had: say so, verify, ask the owner.
4. **Revise the WHOLE plan** (goal, Definition of Done, merge conditions, epics, build order) against what is known now,
   not a patch of the two changes. **What the re-review changes is not counted: it is the baseline the next epoch is
   approved on**, never an entry.
5. **Sort the done work.** An Opus judge marks every merged pull request, pushed commit and local commit
   `fits` or `cut` in the record's table.
6. **Cut.** Merged and contradicting the revised plan: reverted or corrected in a NEW pull request; merged and
   compatible: kept; pushed, unmerged: revert commits or a fix forward, never a history rewrite; local, never pushed:
   may be dropped.
7. **Re-split** when the epics changed: Fable, after the question consultants; Opus rewrites changed stories documents
   when they start; the cornerstone ledger is recounted.
8. **Re-review**, then **resume**: epoch k+1's line, `open`; epoch k becomes `closed`. If scope, the Definition of Done,
   the merge conditions or the release got smaller, the record says `Narrowed: yes`, the owner approves first and the
   epoch line says `by owner`. Epoch k+1 starts at 0 changes.

## Reviewing the revised plan

The re-review is planning work: select rules with `--task plan`. Epics not yet started get their own
`mcp__coai__review_plan` on their own branch.

A branch whose plan round has already passed (its session is in the code stage, whether or not a code round has run)
takes an **interim path, named so**: `mcp__coai__review_document` with `documentPath` = the plan file and a
`purposeText` naming the re-review of epoch k+1 (after `open`, per [coai-document-gate.md](coai-document-gate.md)),
`newReview: true` when an earlier review of that file finished, and `mcp__coai__resolve` for every finding with the same
`document`. The next `mcp__coai__review_code` there passes the revised plan as `planText`, with `again: true` when its
last code round closed.

**This is the only case where a plan goes to the document review, and only on a branch whose plan round has already passed.**
coai-document-gate keeps plans out because a document round leaves the code round shut; here the code round is already
open, and what is missing is a reading of the whole plan.

**When `mcp__coai__review_plan` accepts `again: true` after `proceed`, use that, and this paragraph goes.** Your own Opus
review runs as always, in addition.

## The check

[`tools/plan-lifecycle.mjs`](../tools/plan-lifecycle.mjs) reads the ledger of every plan in `todo/` — never `research/`
or git history. It is red when the current epoch has two entries and is not stopped, a stop is not in the status
paragraph, a line cannot be read, numbers or epochs are out of order or an epoch's date goes back, a re-review record is
missing, reviewers approved a narrowed epoch, or a stories document whose parent is in `todo/` carries a ledger.

**The check validates the prescribed ledger syntax and detects specified malformed variants; a clean result does not prove that every change was recorded or the stop obeyed.**

It cannot see a plan with no ledger, a change nobody recorded, code written during a stop, entry dates, or where the
section stands in the file; this rule, its Definition of Done and the code review own those. **A stopped plan is clean
by design**: a red would block the stop commit, the re-review and its reverts.

Never write the two shapes it misses: a setext heading (`Plan changes` over `---` or `===`) and a heading with
inline markup or a character reference (`## **Plan changes**`, `## Plan&nbsp;changes`). Two list markers are a finding.

## Never

- Never keep building after a second change, or fold independent causes into one entry.
- Never edit or delete an entry to lower a count.
- Never rewrite pushed history to cut work.
- Never resume a narrowed plan without the owner.
- Never send a plan to the document review outside the interim case.

## Definition of Done

- [ ] Every approved plan the task touched has its ledger, one entry per cause in the parent, in the commit that accepts
      it; at the second change the stop was recorded in one commit and no code or merge followed until re-approval.
- [ ] The re-review asked the consultants, revised the whole plan, had an Opus judge sort the done work with every
      disposition recorded, made the cuts, re-split by Fable if the epics changed, and was re-approved by the path above
      (the owner, when narrowed).
- [ ] `plan-lifecycle.mjs` is clean; the summary names the epoch, the count and what was cut.
