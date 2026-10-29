# PLAN — A plan changed twice after its approval stops for a whole re-review

> Status: **stopped for re-review, 2026-10-29 — the second change of epoch 2 (entry 2.2); the re-review for epoch 3 is written and waits for its review and the owner; E1 built (b256502 … 0af69b0) with one fix-forward commit owed after resume; E2 not started.** Scope: a new shared rule
> `common/plan-change-control.md`, two pointer lines in `common/planning-docs.md`, a change-ledger check in
> `tools/plan-lifecycle.mjs` through a new `tools/lib/plan-ledger.mjs`, their tests, `research/rule-bodies.json`,
> `research/module_rules.md`, `research/module_tests.md`, the `README.md` tools row, a `plan-lifecycle` step in
> `.github/workflows/ci.yml` — and, as a separate plan in another
> repository, `review_plan` with `again: true` after `proceed`.
>
> Related docs: [planning-docs.md](../common/planning-docs.md) (where plans live, epics and stories, promotion and
> deviations), [subagent-models.md](../common/subagent-models.md) (who acts at each step),
> [coai-review-gate.md](../common/coai-review-gate.md), [coai-document-gate.md](../common/coai-document-gate.md),
> [coai-consultant.md](../common/coai-consultant.md) (trigger 5), [coai-question-consultant.md](../common/coai-question-consultant.md),
> [rule-ownership.md](../common/rule-ownership.md), [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md)
> (the measured case).

## Plan changes

> Epoch 1 · approved 2026-10-28 · by reviewers · state: closed

- 1.1 · 2026-10-28 · reviewer · merge-conditions — S6a document round, finding 1: the server plan (S7) moves from a
  condition of the merge to a condition of the release, so a blocked review in another repository cannot strand this
  pull request
  (Plan round 1's accepted findings and the split its operator command ordered are part of the approval itself. S6a's
  findings 0, 2 and 3 clarify wording — not changes, decision 1. One change is allowed; the next stops this plan.)
- 1.2 · 2026-10-28 · reviewer · contract — E1 Opus code review, finding 5: an entry indented one space renders as a
  sibling list item but parses as free text, so a second change can hide (verified: ` - 1.2`, ` * 1.2`, `  1.2` give no
  finding); §2's "indented lines are free text" must reserve entry-shaped lines
  (A contract change by decision 1 — it reverses an explicit §2 sentence; the consultant agreed, consult 9dc03004.
  THE FULL STOP: no new code on E1 or E2 until the whole plan is re-reviewed.)

### Re-review for epoch 2

Narrowed: yes — entry 1.1 took the server plan (S7) out of the merge conditions
  (A merge without S7 was forbidden and is now allowed, so the merge conditions got smaller — consult 9dc03004, turn 2,
  checked against decision 5. Epoch 2 needs the owner's approval.)
  Consulted: `consult` 9dc03004 (trigger 5 for 1.2, then the re-review: both changes quoted; advice verified on the lib).
  Revised, the whole plan: §2 reserves entry-, epoch- and heading-shaped indented lines anywhere in the section (fences
  excluded); §3 row 4 and the lib's interface (`parent` name, not a boolean); E1's fixes become a second commit, since
  its first is pushed; the S6b record; the §5 table repaired. Epics and build order: unchanged (E1 → E2 → S10 and S7 →
  S9) — no re-split. Sorted by an Opus judge, 2026-10-28; nothing is cut and no revert is needed.

| Work | Where | Verdict | Action |
|---|---|---|---|
| 16ae967, 93109b1, ad7ba89 — the plan, round 1, the split, entry 1.1 | pushed, unmerged | fits | kept |
| b256502 — the parser (epochs, entries, records; rows 1-8) | pushed, unmerged | fits | fix forward: duplicate numbers with a Set; the Narrowed message names U+2014 and its line; field values cleaned like quote(); duplicate records found while stopped; parse() under 50 lines |
| b256502 — free text / indent handling | pushed, unmerged | fits | fix forward to the reserved prefixes of §2; the header comment rewritten |
| b256502 — row 9 and the wiring | pushed, unmerged | fits | fix forward: the wiring passes the resolved parent name; the caught message cleaned |
| b256502 — `isFullyDone` exemption, fence widening, ownership regression test | pushed, unmerged | fits | kept |
| b256502 — the two test files | pushed, unmerged | fits | fix forward: new red cases with twins for every fix, each watched failing first |
| b256502 — the dry-run record | pushed, unmerged | fits | run again on the final tree; prediction still 0 |
| b256502 — the E1 stories document | pushed, unmerged | fits | fix forward: status line, the cornerstone grammar's free-text rows (by Fable), S6b's findings and decisions, the fix story |
| 7e59e0d — the stop record | pushed, unmerged | fits | kept; epoch 1 becomes `closed` at resume |

> Epoch 2 · approved 2026-10-29 · by owner · state: stopped

- 2.1 · 2026-10-29 · reviewer · contract — E1 fix-forward Opus review, finding 3: an entry behind an ordered-list
  marker (`  1. 1.2 · …`, ` 1) 1.2 · …`) still hides when indented; §2's reserved entry prefix widens its marker group
  to `(?:[-*+]|\d{1,9}[.)])`
  (Its findings 1 — a lone CR is a line ending — and 2 — an indented or closing-hashes heading is the same h2 — are
  implementation fixes inside the contract, not changes: what a line is, and the near-miss heading E1 already
  specifies. One change is allowed in epoch 2; the next stops the plan again.)

  (The re-review passed on 2026-10-28 — `review_document` with `newReview: true`, `proceed`, 4 of 4 reviewers, gating 3
  of 5, its four findings accepted as part of this revision. Narrowed, so the owner approved epoch 2 in the conversation
  on 2026-10-29. One change is allowed in epoch 2; the next stops the plan again.)
- 2.2 · 2026-10-29 · agent · dod — E2's stories author measured the DoD's size item on main: the
  `inspect --file todo/…` scope is already 38 612 B before any work (the plan's author never measured it), so "stays
  ≤ 32 768 B" was never true; correcting the item is a change to the DoD
  (Discovering the false premise is not a change; accepting a different criterion is — consultants 074c2bab, both rows.
  The corrected item is weaker than the written one, so the re-review is narrowed and the owner approves. THE SECOND FULL
  STOP: no new code on E2 until the whole plan is re-reviewed.)

### Re-review for epoch 3

Narrowed: yes — the DoD's absolute size cap becomes a measured, attributed delta
  (The written item, "the `inspect --file todo/…` scope stays ≤ 32 768 B", could never be met: 38 612 B on `main` at
  `72ae2f3` before any work. The item that replaces it is weaker, so the owner approves epoch 3.)
  Consulted: `ask_consultants` 074c2bab (both rows: finding the false premise is not a change, accepting another
  criterion is) and `consult` b4b714d2 (the re-review, entries 2.1 and 2.2 quoted; advice verified).
  Audited: an Opus judge re-checked every premise of the plan against the code, A1-A32, 2026-10-29.
  Revised, the whole plan: the DoD's size item, the test plan's Size line, §1 and E2's scope (the ten scopes of the
  four single-read tasks; the measured cost of `depends: planning-docs`); the rule's size target at most 12 288 B;
  §1's rationale ("triggers a review of whether"); the rule's § The check says it validates syntax, not obedience; §2's
  reserved entry prefix accepts repeated markers, so known limit K1 is fixed (declined before only to avoid a counted
  change) and E1 owes one more fix-forward commit after resume; E1's done-when and S10 say what was built, and S10
  merges by squash; a `plan-lifecycle` step in this repository's CI (A19, E2); the stale line citations repaired.
  Epics and build order: unchanged (E1 → E2 → S10 and S7 → S9) — no re-split. Sorted by an Opus judge, 2026-10-29;
  nothing is cut and no revert is needed.

| Work | Where | Verdict | Action |
|---|---|---|---|
| 362d00a, 07608f6 — the re-review for epoch 2 and its resume | pushed, unmerged | fits | kept |
| dce67ed — E1 fixed forward: the reserved prefixes | pushed, unmerged | fits | kept; one more fix forward after resume: repeated list markers (K1) |
| cd3ccde — three more shapes under which a change hides (2.1) | pushed, unmerged | fits | kept |
| 603b52b — code round 3: heading spacing, format characters, escaped pipes | pushed, unmerged | fits | kept |
| c05f870 — code round 3 recorded | pushed, unmerged | fits | kept |
| 4d18e4d — code round 4: the pipe escape, format characters | pushed, unmerged | fits | kept |
| 04e423e — code round 5: every Unicode space is indent; K3 | pushed, unmerged | fits | kept |
| 0af69b0 — code round 5 recorded | pushed, unmerged | fits | kept |
| 8163cfe — the second stop record (2.2) | pushed, unmerged | fits | kept; epoch 2 becomes `closed` at resume |
| the E2 stories document and its `todo/README.md` row | local, uncommitted | fits | fix forward: Q1 becomes the adopted criterion, the size budget, the CI step, K1, the citations |

## Symptom

No rule says what happens when a plan changes AFTER its approval. Deviations are written down once, at promotion
([planning-docs.md](../common/planning-docs.md) § *Promoting a finished plan*, step 2), when the work is already built. Nothing
counts the changes and nothing stops the work.

Measured 2026-10-27 on [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md). Its plan round
passed on 2026-10-21 (`good_enough`, line 10). After that:

- story S8 was **added** (decision 11, owner, 2026-10-26 — Deviations item 1, line 398);
- S0 and S7 **moved out** to a remainder plan (Deviations item 6, line 412);
- the Windows run and S4 test 28 **left the merge conditions** (owner, 2026-10-27, item 2);
- **eight** lines were rewritten in place with a later review tag — "plan gate 2026-10-26" or "plan gate round 2"
  (lines 160, 169, 170, 245, 247, 248, 266, 300; counted with `grep -n -iE "plan gate (round 2|2026-10-26)"`);
- the merged predecessor E1 had its contract rewritten and its `tools/janitor.sh` (308 lines,
  [PLAN_test_leftovers_E1.md](../research/PLAN_test_leftovers_E1.md) line 47) replaced by one of 874 lines; E1's one release,
  an item of its Definition of Done, never happened (E1 Deviations, lines 34-39).

Each change was reasonable on its day and each was judged alone, against the text just before it. They were seen together
for the first time at promotion. Nobody asked whether a plan changed this often was still the plan that had been approved.

A second gap makes a rule alone unexecutable today. The review server takes ONE plan round per repository and branch:

- `dew_flow_connect_other_ais · src_mcp/core/Rounds/RoundMachine.cs:91-92` — `BeginPlanRound` refuses when the stage is not
  `PlanReview`: *"the plan stage is over for this session … open a new session for a new plan"*;
- `… · src_mcp/src/Server/PanelService.cs:500-542` — `open` reloads the stored session for the same repo+branch, so the
  "new session" the refusal names cannot be opened there;
- `review_code` has `again: true` (`RoundMachine.cs:225-236`); `review_plan` has none.

(Cross-repository citations are paths, per planning-docs § *Across repositories*; all checked 2026-10-28.)

## Goal

After the first approval of a plan, ONE change is allowed and recorded. The SECOND stops all new code on that plan until the
whole plan is reviewed again with what is known now, the consultants are asked, the work already done is sorted into "fits"
and "cut", and the cut is made. Then work continues by the normal pipeline — epics, stories, gates. A check fails a plan that
records two changes and is not stopped. The re-review has a legal path on today's server, named as interim, and the server
change that replaces it is planned in its own repository.

## Decisions (owner, 2026-10-28, after the question consultants)

The consultants (`ask_consultants` 7bdf3086…, two of three rows answered: a disk-reading GPT row and a Gemini row; the
Mistral row refused, too many repositories under the granted folder) agreed on 1, 2, 4, 6 and 7 below and disagreed on 3
and 5, which the owner decided.

| # | Decision | Source |
|---|---|---|
| 1 | **A change** is an accepted change to scope, goals, Definition of Done or merge conditions, epics or stories (added, removed, moved to another plan), build order, a contract, or the planned approach — including a review finding accepted after approval that changes a planned step, counted on the day it is accepted. **Not a change:** wording, a typo, a repaired reference, ticked boxes or a progress table, an implementation fix that only satisfies the plan as written, writing an epic's stories document when the epic starts. In doubt, it is a change. | consultants agree |
| 2 | **An owner's request counts exactly like one the agent finds.** The count measures how far the plan moved, not whose idea it was. | consultants agree; the measured case had two owner changes |
| 3 | **One cause is one change**, however many lines it edits. **Independent causes count one each**, even in one review round. | owner (consultants split) |
| 4 | **Counted per parent plan**, across sessions, branches and epics. A stories document keeps no count; a change it makes to the parent's approved work is recorded in the parent. | consultants agree |
| 5 | **Resume:** a passing re-review is enough when only the technical path changed. When scope, Definition of Done, merge conditions or the release got **smaller**, the owner approves before work continues. | owner (consultants split) |
| 6 | **Reset with history:** a passed re-review opens the next epoch at 0 changes; nothing recorded is deleted. | consultants agree |
| 7 | **Cutting:** merged and contradicting the revised plan → reverted or corrected in a NEW pull request; merged and compatible → kept and recorded; pushed but unmerged → revert commits, never a history rewrite; local and never pushed → may be dropped. Every disposition is recorded. | consultants agree, the unmerged split as recommended |
| 8 | **Re-review path:** interim (below) now; `review_plan` with `again: true` after `proceed` as a plan in the server's repository; the rule switches when that ships. | owner |
| 9 | **Rollout:** this task ends with the pull request merged to `main`. Promoting `release` and the consumer bumps happen only after asking the owner. | owner |
| 10 | **Design:** a dedicated rule file, exact tool names, a meaning test — with the simple line ledger, whose count is derived from its entries and never written a second time. | owner, from two architect designs (below) |
| 11 | **Plans approved before the rule** open their ledger at their next change, epoch 1 dated at their last approval; earlier changes stay in their deviations. No open plan stops on day one. | owner |

## Design

Two Opus architects designed it, one for the smallest change (a section in `planning-docs.md`) and one complete (a rule file,
a table ledger with a written summary). Taken: the complete design's file, selection, meaning test and server follow-up;
the minimal design's line ledger. Rejected: a section in `planning-docs.md` — it would make that rule product-specific
(its first `owns: coai`), load ~5 KB more into every scope that selects it by `todo/**`, and leave the interim caveat without
a test; and the table's written summary line — a count written twice is a count that can disagree with itself.

### 1. The rule — `common/plan-change-control.md`, id `common.plan-change-control`

```yaml
---
id: "common.plan-change-control"
load: "conditional"
tasks: ["audit","plan","implement","docs","policy","test","git","pr","release","deploy","dependencies","http","benchmark","logging"]
depends: ["common.planning-docs"]
---
```

- **The fourteen split-read tasks, exactly the set of [subagent-models.md](../common/subagent-models.md)**, and none of
  `inspect`, `ui`, `gpu`, `storage`: the ten scopes of those four single-read tasks that `tools/rules.test.mjs:215-222` pins
  must each fit one 32 768 B read.
- **No `paths`.** Selection is paths OR tasks (`tools/lib/rule-catalog.mjs:157-163`); a `todo/**` glob would pull it into
  `inspect --file todo/…`. For the same reason `planning-docs` must NOT `depends:` on it. The measured cost of the
  rule's own `depends: planning-docs`: `audit`, `http`, `benchmark` and `logging`, which `planning-docs` does not list,
  each gain `planning-docs` and the rule, about 26 KB (≈ 14.8 KB + ≤ 12.3 KB); all four are split reads already
  (190 574, 70 968, 69 787 and 47 207 B, measured 2026-10-29 at `0af69b0`), so no cap moves.
- **No `depends:` on the coai rules.** They share `planning-docs`' task list, so a scope that has this rule has them too, apart
  from `audit`, `http`, `benchmark` and `logging`; the rule says the re-review is planning work and is read with `--task plan`
  (ENTRY step 8).
- **`owns:` markers**, one per token the text really names, below the H1 (`tools/ownership-check.mjs:262-264`, exact match):
  `coai`, `mcp__coai__review_plan`, `mcp__coai__review_code`, `mcp__coai__review_document`, `mcp__coai__resolve`,
  `mcp__coai__consult`, `mcp__coai__ask_consultants`. Reason text: "a tool name a session types; there is no generic
  spelling of it". Never "the gate" / "its panel" in prose (`ownership-check.mjs:59`).
- Target size at most 12 288 B (the outline's content does not fit 11 KB: measured ≈ 12.1 KB), simple English, the house shape: lead blockquote, measured paragraph, sections, `## Never`,
  `## Definition of Done`.

Outline:

1. `# A plan changed twice after its approval stops for a whole re-review (MANDATORY)` — lead: it governs a plan's life after
   its first approval; where plans live is planning-docs, who acts is subagent-models, how a round runs is coai-review-gate.
   The pinned sentence: **"After the first approval, ONE change is allowed — record it and go on. The SECOND is a full stop:
   no new code on any epic of the plan until the whole plan has been reviewed again."**
2. `## Why — measured` — the case above, anonymised and dated per rule-ownership (*"a plan in this family that passed its plan
   review on 2026-10-21 …"*), ending: counted by this rule, the stop comes on 2026-10-26 — before the merge conditions were
   cut. One line of rationale: one change is learning; the second triggers a review of whether the plan's model of the work is
   drifting — the same
   signal as coai-consultant's second failed fix or a person saying twice that it is still broken.
3. `## What counts as a change` — decisions 1-3. The pinned phrase: **"counts exactly like one you find"**. The FIRST change
   is not free of the other rules: when it changes the shape of the work, coai-consultant trigger 5 still fires before
   `resolve`.
4. `## How it is counted` — decision 4. Approval = the plan's first passing plan-round verdict (`proceed`, `good_enough`,
   `continue_anyway`) or the owner's go-ahead where no review server runs — whichever comes first; that opens epoch 1. Two
   branches that each record one change merge into a plan with two: the check turns red at the merge that brings them
   together, which is where the stop belongs. Decision 11 for older plans, with the adoption date: **the commit that
   accepts an older plan's first change after adoption also opens its ledger** — epoch 1 at its last approval, that
   change as entry 1.1. The check cannot see a plan that skipped this (it has no approval marker to read); the rule's DoD
   and the code review own it, and S9 lists the estate's approved open plans once so none is forgotten.
5. `## The ledger` — the format (§2), its place (directly under the status block, before the first section, so `## Epics`
   stays last), append-only, written in the commit that accepts the change.
6. `## The full stop` — in order:
   1. **Record** the second entry and set `state: stopped`; the status paragraph (the `> Status:` block the checker
      already reads) carries the words `stopped for re-review` — the exact form is in §3, finding 2. One commit, pushed —
      the stop is then visible to every other session.
   2. **Halt:** no new code on any epic of the plan and no merge of a pull request carrying its work. Allowed: the re-review,
      the reverts it decides, work outside the plan, an incident fix the owner orders.
   3. **Consult:** one `mcp__coai__consult` for the re-review, every change of the epoch quoted as evidence (trigger 5's
      shape); every question meant for the owner through `mcp__coai__ask_consultants` first. No consultant to be had →
      say so, verify yourself, take it to the owner.
   4. **Revise the WHOLE plan** — goal, Definition of Done, merge conditions, epics, build order — against what is known
      now; not a patch of the two changes.
   5. **Sort the done work:** an Opus judge lists every merged pull request, pushed commit and local commit of the plan and
      marks each `fits` or `cut`, into `### Re-review for epoch <k+1>`.
   6. **Cut** by decision 7.
   7. **Re-split** when the epics changed: Fable, after the question consultant (subagent-models step 2); stories documents
      of changed epics rewritten by Opus when they start; the cornerstone ledger recounted.
   8. **Re-review** (§ below), then **resume**: a new epoch line; decision 5 — `Narrowed: yes` needs the owner, and the
      epoch line then says `by owner`.
   9. **Continue** with epics, stories and gates as the pipeline says.
7. `## Reviewing the revised plan` — epics not yet started: their own `mcp__coai__review_plan` on their own branch, as today.
   A branch whose plan round already passed (its session is then in the code stage, whether or not a code round has run)
   — **interim, and named so**:
   - `mcp__coai__review_document` with `documentPath` = the plan file and a `purposeText` naming the re-review of epoch
     k+1; `newReview: true` when an earlier review of that file finished; `mcp__coai__resolve` every finding with the same
     `document`; act on the verdict;
   - the next `mcp__coai__review_code` on that branch passes the revised plan as `planText` (a non-empty `planText` is the
     round's scope — `PanelService.cs:1362-1363`), with `again: true` when its last code round closed.
   - The pinned exception: **"This is the only case where a plan goes to the document review, and only on a branch whose
     plan round has already passed."** coai-document-gate keeps plans out because a document round leaves the code round
     shut; here it is open, and what is missing is a reading of the whole plan. Everywhere else that rule stands.
   - **"When `mcp__coai__review_plan` accepts `again: true` after `proceed`, use that, and this paragraph goes."** No
     repository named.
   - Your own Opus review runs as always, in addition.
8. `## The check` — what `plan-lifecycle.mjs` turns red (§3), and what it cannot see: a plan with no ledger, a change
   nobody recorded, code written during a stop. Those belong to this rule, its DoD and the code review. The sentence
   that bounds it: **the check validates the prescribed ledger syntax and detects specified malformed variants; a clean
   result does not prove that every change was recorded or the stop obeyed.**
9. `## Never` — keep building after a second change; fold independent causes into one entry; edit or delete an entry to
   lower a count; rewrite pushed history to cut work; resume a narrowed plan without the owner; send a plan to the document
   review outside the interim case.
10. `## Definition of Done` — every approved plan the task touched has its ledger; each change after approval is one entry
    per cause in the parent, in the commit that accepts it; at the second change the stop was recorded in one commit and no
    code or merge followed until re-approval; the re-review asked the consultants (or said why not), revised the whole plan,
    sorted the done work by an Opus judge with every disposition recorded, made the cuts, re-split by Fable if the epics
    changed; re-approval by the path above, with the owner when narrowed; `plan-lifecycle.mjs` clean; the summary names the
    epoch, the count and what was cut.

### 2. The ledger format

In the parent plan, a section of its own. Fenced here so the check never reads this plan's example as a ledger:

```markdown
## Plan changes

> Epoch 1 · approved 2026-10-21 · by reviewers · state: closed

- 1.1 · 2026-10-26 · owner · epics — consumers need the helper as a shipped file; S8 added
- 1.2 · 2026-10-26 · reviewer · approach — restore before capture; S3 and S4 rewritten

### Re-review for epoch 2

Narrowed: yes — the Windows run left the merge conditions

| Work | Where | Verdict | Action |
|---|---|---|---|
| S5a classifier, 2fb413c | main | fits | kept |
| quarantine step, b2df09c | pushed, unmerged | cut | revert commit 1a2b3c4 |

> Epoch 2 · approved 2026-10-28 · by owner · state: open
```

- **Epoch line:** `> Epoch <k> · approved <YYYY-MM-DD> · by reviewers|owner · state: open|stopped|closed`. The highest
  `k` is current; every lower one is `closed`.
- **Entry:** `- <k>.<n> · <YYYY-MM-DD> · owner|agent|reviewer · <kinds> — <cause>`, kinds comma-separated from `scope`,
  `goals`, `dod`, `merge-conditions`, `epics`, `stories`, `build-order`, `contract`, `approach`. Column 0 only.
- **Free text and the reserved prefixes (epoch 2, entry 1.2):** an indented line anywhere in the section is free text —
  EXCEPT one whose trimmed text starts like a ledger line: an entry,
  `^(?:(?:[-*+]|\d{1,9}[.)])\s+)*[1-9]\d*\.[1-9]\d*(?=\s|$)` (`- 1.2`, `* 1.2`, `+ 1.2`, `1. 1.2`, `1) 1.2`, a bare
  `1.2` — the ordered markers since entry 2.1; repeated markers such as `- - 1.2` and `1. - 1.2` since the re-review for
  epoch 3, which fixes known limit K1), an epoch line (`>`), or a heading (`#`). That line is finding 4, *a ledger line stands
  at column 0*: a renderer shows a one-space `- ` as a sibling list item and a one-space `>` or `###` as a real quote or
  heading, which a reader counts, so the check must not skip it. Cost: free text may not begin with an entry-shaped
  number, `>` or `#`. Fenced lines stay outside the ledger — an example is not a record.
- **Re-review record:** `### Re-review for epoch <k>` before epoch k's line, for every k ≥ 2: a `Narrowed: yes|no` line and
  a `Work | Where | Verdict | Action` table, at least one row, verdict `fits`, `cut` or `—` (nothing was built). Checked:
  the header, four cells per row, the verdict. Work, Where and Action are free text and not validated (an action is
  "kept", "revert commit …", "fix forward: …" — a list would refuse the honest one).
- **The count is never written** — it is the number of entries `k.*` of the current epoch.

### 3. The check — `tools/lib/plan-ledger.mjs` (new) called from `tools/plan-lifecycle.mjs`

The lib is dependency-free, imports only `folded` and `outsideFencedBlocks` from `tools/lib/rule-body.mjs` (`:21`, `:48`),
and exports `ledgerFindings({ file, text, status, parent })` → `string[]`, where `parent` is the parent plan's name the
wiring resolved on disk (`todo/PLAN_x.md`), or `null` when the file is no stories document or its parent is not in `todo/`
(epoch 2: it was a boolean, and row 9 then named a file the lib guessed). `plan-lifecycle.mjs` gains
`checkChangeLedgers(root, findings)` beside `checkStatuses` (`:172`), over **`todo/` only** (research is history), with the
finding class `changes` padded to 10 like the others (the push, `:211`). A throw inside one file's parse becomes a `changes` finding
naming the file, never a crash — a crash would turn every consumer's CI red.

- **Opt-in by presence.** No `## Plan changes` heading outside fences → no check. Measured by both architects on
  2026-10-28: zero `todo/` or `research/` files in this repository, the six siblings, `wsl_care` and the vscode kit carry
  the heading or an `> Epoch` line, so the day this lands, nothing turns red. The one repository not checked out here is
  checked on its remote before the release (S9).

Findings (each names the file and, where it has one, the entry):

| # | Red when | Message gist |
|---|---|---|
| 1 | the current epoch has ≥ 2 entries and is not `stopped` | `epoch k has n changes and is not stopped; stop for a whole re-review` |
| 2 | `stopped`, but the status paragraph (`statusParagraph`, `:115`) does not match `/\bstopped for re-review\b/i` | the stop must be visible where a reader looks first; tests cover bold, plain, capitalised and mid-paragraph forms, and a stopped status that also says "all … done" must not read as misfiled (`TOTALITY_VERDICT`, `:72`) |
| 3 | an `> Epoch` line that does not parse; a heading with no epoch line; two headings | `unreadable epoch line` / `no epoch line` |
| 4 | a column-0 list line in the section that does not parse as an entry; an unknown source or kind; an indented line with the reserved entry prefix (§2) | an unreadable or hidden entry would undercount |
| 5 | an entry's epoch above the current; entry numbers in an epoch not 1..n or repeated | repeated → *"two branches each recorded a change — renumber; the merge is the stop"* |
| 6 | epochs not 1, 2, 3 … in order; a lower epoch not `closed`; dates going back | |
| 7 | epoch k ≥ 2 without `### Re-review for epoch k`, or its `Narrowed` line or table missing or bad | the re-review must leave a record |
| 8 | `Narrowed: yes` and epoch k's line is `by reviewers` (k ≥ 2 only: a `Narrowed` line exists only in a re-review record; epoch 1 has none, and its approval is whatever approved the plan) | a smaller plan needs the owner |
| 9 | a stories document (`PLAN_<topic>_E<n>….md`) carries a ledger while its parent is in `todo/` — in the lib: the file carries a ledger AND `parent !== null`; the wiring passes a name only for a stories document whose parent exists in `todo/`, so a plan that is no stories document, or whose parent is not in `todo/`, gets `null` and no row 9 | its changes count in the parent, named |

Indented lines under an entry are free text and not parsed, except the reserved entry prefix of §2. **The check reads the file as it stands in the checkout — never
git history.** When two branches each recorded entry `k.1`, the merge keeps both causes: the later one is renumbered
`k.2` in the merge (or the commit right after it), and that second entry IS the stop — `state: stopped` in the same
commit. Earlier commits keep their old numbers; nothing reads them. A finding-free run prints nothing new; a run with any `changes`
finding adds one hint line naming `common/plan-change-control.md`.

### 4. The pointers in `common/planning-docs.md` (two lines, no new heading)

- In *Creating a plan*, after "A plan carries: …": *"From its first approval it also carries a change ledger — a plan
  approved before that rule opens one at its next change — and its second change stops it for a whole re-review —
  plan-change-control.md."* (written as a link to the new rule; the clause keeps decision 11 in the pointer, re-review
  for epoch 2, finding 0)
- *"Six findings, all of them failures …"* (`:161`) → seven, the seventh being that rule's. Without it the sentence turns
  false ([knowledge-base.md](../common/knowledge-base.md): a sentence that does not describe what runs is a bug).

`tools/rule-bodies.mjs --update common.planning-docs common.plan-change-control` after a hand-added entry for the new id
(`--update` refuses an id it has no entry for — `tools/rule-bodies.mjs:184-189`).

### 5. Re-review on today's server, verified 2026-10-28

| Fact | Where |
|---|---|
| A document review is its own session, keyed by the document per repo+branch | `PanelService.cs:593-620` |
| A non-empty `planText` is the code round's scope; empty falls back to the stored plan | `PanelService.cs:1362-1363` |
| `review_code` refuses a scope that is not substantial once the plan proceeded | `PanelService.cs:792-796` |
| `again: true` reopens a closed code stage and keeps the plan's approval | `RoundMachine.cs:225-236` |
| `review_document` refuses only: both or neither input, a credential-shaped name, an over-size text, a path outside the repository, a directory, a non-text extension, an unreadable file — nothing about plans | `DocumentReader.cs:65-291` |

Not yet observed live: a plan read under the document prompts. It is observed FIRST (S6 runs before any rule text is written,
after this branch's plan round passed — the rule's precondition), so the rule does not describe a path nobody has seen
work ([measurement.md](../common/measurement.md)), and a surprise costs a paragraph, not a rewrite.

## Boundary with the server plan (named on both sides)

| Item | Built by | The other plan's part |
|---|---|---|
| The rule, the ledger, the count, the check, the interim path | this plan | none |
| `review_plan` with `again: true` after `proceed`: back to the plan stage with a fresh round budget, `review_code` refused until the new `proceed`, the stored plan text replaced on `proceed`, an epoch shown in `status`, the tool description and the canonical review snippet updated | `dew_flow_connect_other_ais · todo/PLAN_review_plan_again_after_proceed.md` (S7 writes it, plan only) | none |
| The rule's interim paragraph replaced by `again: true` | a later change here, after that server release | ships the feature |

Order: this plan first, then the server plan, then the rule update. Disjoint: the server never reads a ledger or counts
changes; this plan changes no server code. The server plan also names its boundary with that repository's
`PLAN_the_plan_gate_reads_the_committed_plan.md` (`again` must accept `committedPlan` too).

## Growth surface

None that grows without an owner: a few lines per change inside a plan file, retired with the plan. No table, directory,
cache or process.

## Stories and build order

The work is split into two epics — see `## Epics`, the last section. The steps below are the ones that come BEFORE the
first epic and AFTER the last one; everything that ships in this repository is built inside an epic. The story numbers
S1–S5 and S8 name the work the epics carry (the sections above cite them); their stories documents are written by Opus when
each epic starts. Each story goes through the pipeline of [subagent-models.md](../common/subagent-models.md): scenarios and
brief by Opus (by Fable on the one cornerstone story), code by Sonnet, review by Opus, fixes by Sonnet; the small-edit
exception where a change is bounded to one file and ≤ 50 lines before it starts.

Before the epics:

- **S0 — this plan.** Done: worktree `feat/plan-change-control`; the `todo/README.md` row in the same commit; `open` +
  `review_plan` — `proceed` on 2026-10-28 (the round below). This plan opens its own `## Plan changes` with epoch 1 — its
  first live instance. The split into epics applies that round's operator command; it is not a change after approval
  (decision 1).
- **S6a — observe the interim path, now.** Right after S0's `proceed` (the branch's plan round has passed — the rule's
  precondition): `review_document` on this plan file once (one panel round), resolved, recorded in this plan. Runs before
  any rule text is written. The second half, S6b, needs a non-empty diff (`review_code` refuses an empty one), so it is
  inside E1.

Inside the epics (the numbers the sections above cite):

- **S1 — RED** and **S2 — GREEN**: the ledger tests and `tools/lib/plan-ledger.mjs` with its wiring — E1.
- **S6b**: E1's `review_code` passes this plan, as revised, as `planText` — E1.
- **S3 — the rule**, **S4 — the rule's tests**, **S5 — documentation** — E2.
- **S8 — verify and review**: the five commands (`npm test`, `npm run check`, `node tools/ownership-check.mjs`,
  `node tools/rule-bodies.mjs`, `node tools/plan-lifecycle.mjs` — five, because `npm test` does not run the family checks,
  `research/module_tests.md:989`), the dry run over the estate, `review_code` and an Opus review started together — once per
  epic, as its done-when says. The pull request, the bot threads and the merge are S10 below.

After the epics:

- **S10 — the pull request.** E1's branch opens NO pull request: it is reviewed by its own gates and E2 starts from its
  commit. ONE pull request, from E2's branch to `main`, carries both epics — E1's commits (`b256502` and its fix-forward
  commits with their records) and E2's one commit — and is merged by **squash** (`common/pull-requests.md`: squash for a
  fix-up trail): one commit on `main`, whose message summarises both epics. One pull request because `main` must never carry a check whose
  hint line names a rule it does not have, nor `planning-docs`' "seven findings" line without the seventh. Every bot
  thread verified and resolved.
- **S7 — the server plan**, in its own worktree, branch and pull request in that repository, under its own rules (plan
  only; no server code here). It is outside the epics because it changes no file here; it is written once E2 exists, when
  the rule's interim paragraph is there to be replaced. It is a condition of the RELEASE (S9), not of S10's merge: a
  blocked review in another repository must not strand this one's pull request.
- **S9 — ask the owner** about promoting `release` and the consumer bumps (decision 9), once S7 exists, with the
  unchecked repository's `todo/` checked on its remote first, and with a one-time list of the estate's open plans that
  passed a plan round — each one opens its ledger at its next change (decision 11). Until then this plan stays in `todo/`.

## Test plan

- **Unit (`plan-ledger.test.mjs`).** Clean: no heading; epoch 1 with 0 and with 1 entry; two entries with `state: stopped`
  and the status phrase; epoch 2 after a valid re-review, then one entry (the reset); `Narrowed: yes` by owner; the ledger
  only inside a fence; CRLF equals LF; indented lines under an entry ignored. Red: one case per row of the findings table,
  each asserting the file and the entry in the message.
- **Wiring (`plan-lifecycle.test.mjs`, spawned).** A plan without a ledger stays clean; two entries, open → exit 1 with a
  `changes` line; a stories document with a ledger and its parent in `todo/` → red, parent absent → clean; a red ledger in
  `research/` → ignored; a parse throw → a finding and exit 1, not a crash.
- **Rule.** Selection (14 / 4), the meaning test with its splice cases, the rule/check agreement case.
- **Dry run on the real estate (read-only).** `node tools/plan-lifecycle.mjs <repo>` on `main` and on the branch for every
  `dew_flow_*` checkout here and `wsl_care`: the diff of the two outputs has zero `changes` lines.
- **Size.** `node tools/rules.mjs explain` for `inspect --file todo/PLAN_x.md` before E2's first edit (38 612 B on `main`
  at `72ae2f3`) and after E2's commit, both with their commits in `research/module_rules.md`: the growth equals what the
  two `planning-docs` lines add by `wc -c` (≈ 370 B), `common.plan-change-control` is not selected there, and the ten
  scopes of the four single-read tasks pinned by `tools/rules.test.mjs` stay ≤ 32 768 B.

## Post-deploy

The completion question of [post-deploy-checks.md](../common/post-deploy-checks.md): does this change what must be true on the
deployed thing, in a way a green build would hide? **No** — the check runs inside each consumer's CI, which is the build; no
`POST_DEPLOY.md` item is added.

## Risks

1. **Opt-in gap.** A plan with no ledger is not seen by the check; the rule's DoD and the code review cover it. Requiring a
   ledger by date would read free-text status dates and fail falsely — not done.
2. **Self-reporting.** An unrecorded change is invisible to any check; every entry is a line in a reviewed diff.
3. **The interim path reads a plan under document prompts.** S6 observes it once; `purposeText` says what to judge.
4. **Seeming contradiction with coai-document-gate.** Narrow exception, pinned by a test; no canonical coai file is edited,
   so `tools/canonical-markers.test.mjs` and `tools/gate-routing.test.mjs` stay as they are.
5. **Ledger conflicts between epic branches** are intended: the repeated-number finding tells the fix, and the merge is where
   the stop belongs.
6. **Ownership check.** Any undeclared `mcp__coai__*` token or "the gate" fails CI; run it before every push.

## Plan round 1 (2026-10-28) — findings and what changed

`proceed`, 2 of 2 reviewers (Codex, Gemini), gating 5 of threshold 6. Both noted that the project rules were not sent with
the plan, so neither judged compliance with them.

| # | Finding | Decision |
|---|---|---|
| 0 | The check passes a stopped plan, so its pull requests can merge during the stop | **Rejected:** the check scans every plan in `todo/` on every pull request, so a red while stopped would block the stop commit itself, the re-review, its reverts and unrelated work the rule allows. The halt is the rule's; the server plan enforces it by refusing `review_code` until the new `proceed` |
| 1 | An older plan with no ledger stays invisible after adoption | Accepted: the commit that accepts its first change opens its ledger (§1.4); S9 lists the estate's approved open plans once; the check's blind spot is stated |
| 2 | S6 ran before the precondition it claims to observe | Accepted: the precondition is "the plan round passed" (§1.7); S6 runs right after S0 |
| 3 | `review_document` might refuse a plan file | Accepted the reorder (S6 first); the refusal itself was checked and does not exist (§5, `DocumentReader.cs`) |
| 4 | The stop phrase in the status paragraph was not specified | Accepted: the regex and its test variants (§3, finding 2) |
| 5 | Renumbering after a merge of two branches' entries | Accepted: the check reads the checkout, never history; the merge renumbers and stops (§3) |

The round's operator commands, applied: the split into epics by Fable after the question consultants; one plan round and
one code round per epic on its own branch; consultations on a cadence; autonomous work with questions at the end.

## S6a — the interim path, observed (2026-10-28)

`review_document` with `documentPath: todo/PLAN_plan_change_control.md` on `feat/plan-change-control`, after this
branch's plan round had passed: **accepted, ran, `proceed`** — 4 of 4 reviewers (a review and a summary role each from
Codex and Gemini), gating 3 of threshold 5. The plan file was read as a document with no refusal (§5); the reviewers judged
it as a plan for code, from the `purposeText` alone. Resolved with `document` passed back; the session closed at `Done`.
Codex again noted that the project rules were not sent. What it does NOT show: the second half — a `review_code` on this
branch reading the revised plan as `planText` — which is S6b, inside E1.

| # | Finding | Decision |
|---|---|---|
| 0 | E1's and E2's branches against one pull request: which merges where | Accepted: S10 — E1 opens no pull request; E2's carries the epics' commits (rebase-merged as decided then; squash-merged since the re-review for epoch 3 — S10) |
| 1 | S7 in another repository blocked this repository's merge | Accepted: S7 is a condition of the release (S9), not of S10 |
| 2 | Finding 8 for epoch 1 | Accepted: `Narrowed` exists only in a re-review record, k ≥ 2 (§3 row 8) |
| 3 | Two steps both called S8 | Accepted: the pull request is S10 |

## S6b — the second half, observed (2026-10-28)

E1's `review_code` on `feat/plan-change-control-e1` (base `ad7ba89`, head `b256502`) was given a non-empty `planText`
different from the plan its session stored (that session's plan round had read the E1 stories document): a scope preface
plus this plan, abridged only in sections E1 does not build, the abridged parts marked. **Accepted and used as the
scope: `proceed`, 8 of 8 reviewers, gating 4 of threshold 5** — their findings cite the epic's grammar rows, which only the
supplied text carried. Both halves of the interim path have now been seen working. Its eight findings and the parallel
Opus review are recorded in the E1 stories document; one of them was this plan's second change (1.2).

## Definition of Done

- [ ] `common/plan-change-control.md` exists by the outline, selected by the fourteen split-read tasks and none of the four
      single-read ones; `planning-docs` carries the two lines; `research/rule-bodies.json` records both.
- [ ] `tools/lib/plan-ledger.mjs` and `plan-lifecycle.mjs` report every row of the findings table; every test was watched
      failing first; a throw is a finding, not a crash.
- [ ] The meaning test pins the three sentences, with splice cases; the rule/check agreement case passes.
- [ ] The dry run over the estate added zero `changes` findings. The `inspect --file todo/PLAN_x.md` scope was measured
      with `node tools/rules.mjs explain` before E2's first edit (38 612 B on `main` at `72ae2f3`) and after E2's commit,
      both numbers with their commits recorded in `research/module_rules.md`; the growth equals what the two
      `planning-docs` pointer lines add by `wc -c` (≈ 370 B); `common.plan-change-control` is not selected in that scope;
      and the ten scopes of the four single-read tasks pinned by `tools/rules.test.mjs` remain ≤ 32 768 B.
- [ ] The interim path was observed once on this plan, and the result recorded here.
- [ ] The server plan exists in its repository with the same boundary table — before S9's release question, not as a
      condition of the merge.
- [ ] `research/module_rules.md`, `research/module_tests.md` and the `README.md` tools row describe what runs.
- [ ] `.github/workflows/ci.yml` runs `node tools/plan-lifecycle.mjs` over this repository's own plans.
- [ ] Five commands green; `review_code` and an Opus review resolved; every bot thread answered; merged by squash.
- [ ] The owner was asked about `release` and the consumer bumps; the answer is recorded here.

## Epics

Two epics; cornerstone quota ⌈2·2/5⌉ = 1. Split by Fable on 2026-10-28, after the question consultants were asked what
matters (two rows answered; both said two epics, and both named the durable ledger schema, not the parser alone, as the
cornerstone — the caller verified their reasons). Each epic's stories live in `todo/PLAN_plan_change_control_E<k>.md`,
written by Opus when the epic starts, with its own `todo/README.md` row in the same commit (`plan-lifecycle.mjs:263-279`
demands it) and NO `## Plan changes` of its own (finding 9: a stories document's changes count in the parent).

**Why two, not the four or five the gate asked for.** The gate's measure — 349 lines, 19 build steps, 58 files named, 9
areas, "Huge" — over-counts this plan. Most of the 58 names are citations of files that are read, not changed
(`RoundMachine.cs`, `PanelService.cs`, `DocumentReader.cs`, the line numbers in `rules.test.mjs`, `rule-catalog.mjs`,
`ownership-check.mjs`). What ships here is about ten files: one new rule, two lines in `planning-docs`, one new lib, one
changed check, three test files, three research documents and one README row — plus one plan document in another
repository. Of the 19 steps, one is done (S0), one is an observation (S6a) and three are closing steps that edit nothing
here (S7, the pull request, S9). Four epics would be epics of one or two stories each, and a plan round plus a code round
per epic would cost more than the stories they gate. Two epics give each one 3–5 complete stories, and they cut along the
one seam that matters: E1 is executable code that runs in six consumers' CI and is reviewed alone; E2 is the text that
describes it, which must describe what runs ([knowledge-base.md](../common/knowledge-base.md)) and so comes second.

**Branches and gates.** `feat/plan-change-control-e1` starts from this branch's commit after S6a is recorded;
`feat/plan-change-control-e2` starts from E1's commit. Each epic: `open` on its branch; `review_plan` with
`plan: "todo/PLAN_plan_change_control.md"` and `epic: "k/2"`; build its stories; ONE commit; `review_code` over the epic's
whole diff together with an Opus review; fixes folded into that one commit while it is unpushed. **Epoch 2:** E1's commit
was pushed with the stop record, and pushed history is never rewritten (decision 7), so E1's fixes after the re-review
are a SECOND commit on its branch, reviewed by `review_code` with `again: true` and this revised plan as `planText`. The
pull request is E2's branch, carrying the epics' commits, merged by squash (S10 above); E1 opens none of its own.
**Epoch 3:** the re-review fixed known limit K1 (§2), so E1 gets one more fix-forward commit after resume.

Cornerstones: 1 of 1 — E1.S1

### E1 — The ledger contract and its safe enforcement

Stories: `todo/PLAN_plan_change_control_E1.md` (written when the epic starts).

- **Goal.** `tools/lib/plan-ledger.mjs` reads the ledger of §2 and reports every row of the findings table of §3;
  `tools/plan-lifecycle.mjs` calls it over `todo/` only, a throw becomes a finding, and the whole estate stays clean on the
  day it lands.
- **Scope.** S1 (RED: `tools/plan-ledger.test.mjs`, pure; the spawned cases in `tools/plan-lifecycle.test.mjs`, keeping
  `ownedDir(t, "plan-lifecycle ")`), S2 (GREEN: the lib, `checkChangeLedgers`, the `changes` class, the hint line naming
  `common/plan-change-control.md` — a file E2 creates), the compatibility fixtures, the dry run over the estate, S6b. The
  stories document decides and tests these, each with a case:
  1. **Fences.** `outsideFencedBlocks` (`tools/lib/rule-body.mjs:48`) strips only column-0 triple-backtick fences,
     non-greedy: no `~~~`, no indented fence, and a four-backtick fence that holds ``` lines closes early. The ledger
     parser needs a stated fence interpretation. Widening the shared helper also moves `sectionsOf` (`:89`), whose
     headings are recorded in `research/rule-bodies.json`; a new export leaves it alone. The epic decides — new export
     or widening plus a `rule-bodies` verification — and tests both fence kinds either way.
  2. **Tolerance.** The format uses `·` and `—`. Decide whether `|`, `--` and the en dash are accepted or refused, and make
     the finding say which character was expected, so the message corrects the writer.
  3. **A stopped plan and `checkStatuses`.** A status paragraph that says `stopped for re-review` and also "all … done"
     must not become a `misfiled` finding (`TOTALITY_VERDICT`, `plan-lifecycle.mjs:72`) — a spawned integration case.
  4. **A caught throw is still a red CI.** The finding replaces the crash, not the red. The protection against a false red
     is the dry run: `node tools/plan-lifecycle.mjs <repo>` on `main` and on this branch for every `dew_flow_*` checkout
     here and `wsl_care`, the diff of the outputs with zero `changes` lines, recorded in the stories document.
  5. **What the check cannot see**, written in the lib's header: a plan with no ledger, a change nobody recorded, code
     written during a stop. A stopped plan is clean by design (plan round 1, finding 0 rejected); the halt is the rule's.
- **Depends on.** S0 and S6a done on this branch. Nothing else: the schema is §2, decided.
- **Done when.** Every test was watched failing first; every row of the findings table has a red case naming the file
  and the entry; the clean cases of the test plan pass (CRLF equals LF, indented lines ignored, the ledger only inside a
  fence); the five commands are green; the dry run added zero `changes` findings; `review_code` on E1's branch passed
  this plan as `planText` (S6b, recorded here); the Opus review and the code round are resolved. What was built:
  `b256502`, then the fix-forward commits `dce67ed`, `cd3ccde`, `603b52b`, `4d18e4d` and `04e423e` with their records
  (`c05f870`, `0af69b0`) — pushed, never folded (folding would rewrite pushed history) — and every one passed a code
  round with `again: true` and the revised plan as `planText`, the last being round 6 over `4d18e4d..0af69b0`:
  `proceed`, 8 of 8, 0 findings. **Epoch 3:** one more fix-forward commit after resume — the reserved entry prefix
  accepts repeated markers (§2, known limit K1 fixed): a Fable spec delta in the E1 stories document (the cornerstone
  area), Sonnet code with a red case and its twin, a code round with `again: true`.
- **Cornerstone area — the ledger schema and its state machine as the parser accepts them.** The epoch line, the
  entry line and the re-review record of §2; the transitions open → stopped → closed, the reset to epoch k+1 at 0,
  the renumbering after a merge of two branches' entries, `Narrowed: yes` → `by owner`; and the acceptance scenarios
  that fix which text is a ledger and which is not. Once plans in six repositories carry records, a change to what
  these lines mean is a migration of every one of them — the precedent is test-leftovers E1, whose contract text was
  the cornerstone and was later superseded at that cost. The parser's code is Sonnet's as for every story; the
  scenarios and the brief of this one story are Fable's.
- **Easy to get wrong.** (1) A list line in the section that is not an entry is finding 4, never free text — only
  indented lines are free text. (2) The check reads the checkout, never git history; a test that builds history tests
  nothing. (3) `research/` is history and is not read; a test must show a red ledger there is ignored.

### E2 — The rule, the lines that point at it, and what describes it

Stories: `todo/PLAN_plan_change_control_E2.md` (written when the epic starts).

- **Goal.** `common/plan-change-control.md` by the outline of §1, selected by the fourteen split-read tasks and none of the
  four single-read ones; the two `planning-docs` lines; the body freeze; the tests that pin the rule's meaning and its
  agreement with E1's check; the research documents; a `plan-lifecycle` step in this repository's CI; the hand-off to
  the server plan.
- **Scope.** S3 (the rule with its `owns:` markers; the two lines of §4; the `rule-bodies.json` entry and
  `tools/rule-bodies.mjs --update`), S4 (`tools/rules.test.mjs`: the 14 / 4 selection, with negative cases over
  `inspect --file todo/…` paths; `tools/plan-change-rule.test.mjs`: the three bold sentences with splice cases; the
  rule/check agreement case — the fenced example inside the rule, unfenced into a fixture plan, clean, and red once
  `state: closed` → `open` with a second entry), S5 (`research/module_rules.md`, `research/module_tests.md`, the
  `README.md` tools row, the `node tools/plan-lifecycle.mjs` step in `.github/workflows/ci.yml` — A19: this
  repository's CI did not run it over its own `todo/`), and the rule's § *The check* saying what E1 cannot see — the
  halt included. The size measurement of the test plan is a functional check of this epic: `inspect --file
  todo/PLAN_x.md` before (38 612 B) and after, the growth attributed to the two `planning-docs` lines, the rule not
  selected there, and the ten scopes of the four single-read tasks still ≤ 32 768 B — the numbers in
  `research/module_rules.md`.
- **Depends on.** E1's commit: the rule describes the check that runs, the agreement case needs the parser, and the
  "seven findings" line is true only with the seventh finding in place.
- **Done when.** `node tools/ownership-check.mjs` passes with every `mcp__coai__*` token declared and no "the gate" in
  prose; `node tools/rule-bodies.mjs` is clean with both ids re-recorded; selection, meaning and agreement tests pass and
  each splice case went red; the rule is at most 12 288 B; CI runs `plan-lifecycle`; the five commands are green; `review_code` and the Opus review are
  resolved; one commit on `feat/plan-change-control-e2`. The server plan (S7) and the owner's answer (S9) follow outside
  the epic.
- **Cornerstone area.** None. The quota is one, and the rule text does not take it: its sentences quote the schema E1
  fixed, and a wrong sentence is a body re-record and a release, not a migration of recorded plans. The meaning test
  with its splice cases is the guard on that text, as an Opus-spec story.
- **Easy to get wrong.** (1) `tools/ownership-check.mjs:262-264` matches an `owns:` marker exactly and `:59` forbids
  "the gate" / "its panel" in prose — run it before every push. (2) `--update` refuses an id it has no entry for
  (`tools/rule-bodies.mjs:184-189`): the hand-added entry comes first. (3) A `paths:` glob or a `depends:` from
  `planning-docs` would pull the rule into every `inspect` scope (§1); the negative selection cases exist to catch it.

### Order, and why

S0 (done) → S6a (done) → E1 → E2 → S10 (the pull request) and S7 in parallel → S9.

- E1 before E2: the text must describe what runs, and E2's agreement case reads E1's parser.
- One pull request after E2: a check that names an absent rule, or a rule line that counts a finding that is not there,
  must never sit on `main` alone.
- S7 after E2: the server plan replaces the rule's interim paragraph, which exists only after E2.

**Security:** neither epic touches authentication, authorisation or cryptography.
