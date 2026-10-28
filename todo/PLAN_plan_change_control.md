# PLAN — A plan changed twice after its approval stops for a whole re-review

> Status: **plan only, nothing implemented yet, 2026-10-28.** Scope: a new shared rule
> `common/plan-change-control.md`, two pointer lines in `common/planning-docs.md`, a change-ledger check in
> `tools/plan-lifecycle.mjs` through a new `tools/lib/plan-ledger.mjs`, their tests, `research/rule-bodies.json`,
> `research/module_rules.md`, `research/module_tests.md`, the `README.md` tools row — and, as a separate plan in another
> repository, `review_plan` with `again: true` after `proceed`.
>
> Related docs: [planning-docs.md](../common/planning-docs.md) (where plans live, epics and stories, promotion and
> deviations), [subagent-models.md](../common/subagent-models.md) (who acts at each step),
> [coai-review-gate.md](../common/coai-review-gate.md), [coai-document-gate.md](../common/coai-document-gate.md),
> [coai-consultant.md](../common/coai-consultant.md) (trigger 5), [coai-question-consultant.md](../common/coai-question-consultant.md),
> [rule-ownership.md](../common/rule-ownership.md), [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md)
> (the measured case).

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
  `inspect`, `ui`, `gpu`, `storage`: those four must fit one 32 768 B read (`tools/rules.test.mjs:215-222`).
- **No `paths`.** Selection is paths OR tasks (`tools/lib/rule-catalog.mjs:157-163`); a `todo/**` glob would pull it into
  `inspect --file todo/…`. For the same reason `planning-docs` must NOT `depends:` on it.
- **No `depends:` on the coai rules.** They share `planning-docs`' task list, so a scope that has this rule has them too, apart
  from `audit`, `http`, `benchmark` and `logging`; the rule says the re-review is planning work and is read with `--task plan`
  (ENTRY step 8).
- **`owns:` markers**, one per token the text really names, below the H1 (`tools/ownership-check.mjs:48`, exact match):
  `coai`, `mcp__coai__review_plan`, `mcp__coai__review_code`, `mcp__coai__review_document`, `mcp__coai__resolve`,
  `mcp__coai__consult`, `mcp__coai__ask_consultants`. Reason text: "a tool name a session types; there is no generic
  spelling of it". Never "the gate" / "its panel" in prose (`ownership-check.mjs:59`).
- Target size 9-11 KB, simple English, the house shape: lead blockquote, measured paragraph, sections, `## Never`,
  `## Definition of Done`.

Outline:

1. `# A plan changed twice after its approval stops for a whole re-review (MANDATORY)` — lead: it governs a plan's life after
   its first approval; where plans live is planning-docs, who acts is subagent-models, how a round runs is coai-review-gate.
   The pinned sentence: **"After the first approval, ONE change is allowed — record it and go on. The SECOND is a full stop:
   no new code on any epic of the plan until the whole plan has been reviewed again."**
2. `## Why — measured` — the case above, anonymised and dated per rule-ownership (*"a plan in this family that passed its plan
   review on 2026-10-21 …"*), ending: counted by this rule, the stop comes on 2026-10-26 — before the merge conditions were
   cut. One line of rationale: one change is learning; the second says the plan's model of the work is drifting — the same
   signal as coai-consultant's second failed fix or a person saying twice that it is still broken.
3. `## What counts as a change` — decisions 1-3. The pinned phrase: **"counts exactly like one you find"**. The FIRST change
   is not free of the other rules: when it changes the shape of the work, coai-consultant trigger 5 still fires before
   `resolve`.
4. `## How it is counted` — decision 4. Approval = the plan's first passing plan-round verdict (`proceed`, `good_enough`,
   `continue_anyway`) or the owner's go-ahead where no review server runs — whichever comes first; that opens epoch 1. Two
   branches that each record one change merge into a plan with two: the check turns red at the merge that brings them
   together, which is where the stop belongs. Decision 11 for older plans, with the adoption date.
5. `## The ledger` — the format (§2), its place (directly under the status block, before the first section, so `## Epics`
   stays last), append-only, written in the commit that accepts the change.
6. `## The full stop` — in order:
   1. **Record** the second entry and set `state: stopped`; the status paragraph starts `**Stopped for re-review, <date>.**`.
      One commit, pushed — the stop is then visible to every other session.
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
   A branch whose plan round already passed — **interim, and named so**:
   - `mcp__coai__review_document` with `documentPath` = the plan file and a `purposeText` naming the re-review of epoch
     k+1; `newReview: true` when an earlier review of that file finished; `mcp__coai__resolve` every finding with the same
     `document`; act on the verdict;
   - the next `mcp__coai__review_code` on that branch passes the revised plan as `planText` (a non-empty `planText` is the
     round's scope — `PanelService.cs:1362-1363`), with `again: true` when its last code round closed.
   - The pinned exception: **"This is the only case where a plan goes to the document review, and only on a branch whose
     code review is already open."** coai-document-gate keeps plans out because a document round leaves the code round
     shut; here it is open, and what is missing is a reading of the whole plan. Everywhere else that rule stands.
   - **"When `mcp__coai__review_plan` accepts `again: true` after `proceed`, use that, and this paragraph goes."** No
     repository named.
   - Your own Opus review runs as always, in addition.
8. `## The check` — what `plan-lifecycle.mjs` turns red (§3), and what it cannot see: a plan with no ledger, a change
   nobody recorded, code written during a stop. Those belong to this rule, its DoD and the code review.
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
- **Re-review record:** `### Re-review for epoch <k>` before epoch k's line, for every k ≥ 2: a `Narrowed: yes|no` line and
  a `Work | Where | Verdict | Action` table, at least one row, verdict `fits`, `cut` or `—` (nothing was built).
- **The count is never written** — it is the number of entries `k.*` of the current epoch.

### 3. The check — `tools/lib/plan-ledger.mjs` (new) called from `tools/plan-lifecycle.mjs`

The lib is dependency-free, imports only `folded` and `outsideFencedBlocks` from `tools/lib/rule-body.mjs` (`:21`, `:29`),
and exports `ledgerFindings({ file, text, status, parentInTodo })` → `string[]`. `plan-lifecycle.mjs` gains
`checkChangeLedgers(root, findings)` beside `checkStatuses` (`:161`), over **`todo/` only** (research is history), with the
finding class `changes` padded to 10 like the others (`:167`). A throw inside one file's parse becomes a `changes` finding
naming the file, never a crash — a crash would turn every consumer's CI red.

- **Opt-in by presence.** No `## Plan changes` heading outside fences → no check. Measured by both architects on
  2026-10-28: zero `todo/` or `research/` files in this repository, the six siblings, `wsl_care` and the vscode kit carry
  the heading or an `> Epoch` line, so the day this lands, nothing turns red. The one repository not checked out here is
  checked on its remote before the release (S9).

Findings (each names the file and, where it has one, the entry):

| # | Red when | Message gist |
|---|---|---|
| 1 | the current epoch has ≥ 2 entries and is not `stopped` | `epoch k has n changes and is not stopped; stop for a whole re-review` |
| 2 | `stopped`, but the status paragraph (`statusParagraph`, `:109`) lacks "stopped for re-review" | the stop must be visible where a reader looks first |
| 3 | an `> Epoch` line that does not parse; a heading with no epoch line; two headings | `unreadable epoch line` / `no epoch line` |
| 4 | a column-0 list line in the section that does not parse as an entry; an unknown source or kind | an unreadable entry would undercount |
| 5 | an entry's epoch above the current; entry numbers in an epoch not 1..n or repeated | repeated → *"two branches each recorded a change — renumber; the merge is the stop"* |
| 6 | epochs not 1, 2, 3 … in order; a lower epoch not `closed`; dates going back | |
| 7 | epoch k ≥ 2 without `### Re-review for epoch k`, or its `Narrowed` line or table missing or bad | the re-review must leave a record |
| 8 | `Narrowed: yes` and epoch k's line is `by reviewers` | a smaller plan needs the owner |
| 9 | a stories document (`PLAN_<topic>_E<n>….md`) carries a ledger while `PLAN_<topic>.md` is in `todo/` | its changes count in the parent |

Indented lines under an entry are free text and not parsed. A finding-free run prints nothing new; a run with any `changes`
finding adds one hint line naming `common/plan-change-control.md`.

### 4. The pointers in `common/planning-docs.md` (two lines, no new heading)

- In *Creating a plan*, after "A plan carries: …": *"From its first approval it also carries a change ledger, and its
  second change stops it for a whole re-review — plan-change-control.md."* (written as a link to the new rule)
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

Not yet observed live: a plan read under the document prompts. S6 runs it once on this plan before the rule merges, so the rule
does not describe a path nobody has seen work ([measurement.md](../common/measurement.md)).

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

No `## Epics`: one pull request here delivers everything that ships, and the hard decisions are already made. Each story goes
through the pipeline of [subagent-models.md](../common/subagent-models.md): scenarios and brief by Opus, code by Sonnet,
review by Opus, fixes by Sonnet; the small-edit exception where a change is bounded to one file and ≤ 50 lines before it starts.

- **S0 — this plan.** Worktree `feat/plan-change-control`; the `todo/README.md` row in the same commit; `open` +
  `review_plan` until `proceed`. Then this plan opens its own `## Plan changes` with epoch 1 — its first live instance.
- **S1 — RED.** `tools/plan-ledger.test.mjs` (pure, no temp folders) and new spawned cases in
  `tools/plan-lifecycle.test.mjs` (keeping `ownedDir(t, "plan-lifecycle ")`, pinned by `tools/leftovers-check.test.mjs:524`).
  Watch them fail for the right reason: the module does not exist / the finding is absent.
- **S2 — GREEN.** `tools/lib/plan-ledger.mjs` and the wiring in `plan-lifecycle.mjs`, its header comment naming the new rule.
- **S3 — the rule.** `common/plan-change-control.md` by the outline; the two `planning-docs` lines; the `rule-bodies.json`
  entry and `--update`. Can run beside S1-S2: no shared file.
- **S4 — the rule's tests.** In `tools/rules.test.mjs`: the new rule is selected by the fourteen split-read tasks and none of
  the four single-read ones (reusing `SPLIT_READ_TASKS` / `SINGLE_READ_TASKS`, `:204-213`). A new
  `tools/plan-change-rule.test.mjs` in the pattern of `tools/gate-routing.test.mjs`: it pins the three bold sentences above,
  and a splice case shows each assertion fails when its paragraph is removed. A rule/check agreement case: the fenced ledger
  example inside the rule, unfenced into a fixture plan, is clean; with `state: closed` → `open` and a second entry, red.
- **S5 — documentation.** `research/module_rules.md` (the rule, its 14 tasks, why no paths, the depends, the meaning test,
  opt-in by presence); `research/module_tests.md` (a *Change ledger* section: the cases, what they do not prove, the
  sibling measurement); the `README.md` tools row for `plan-lifecycle` (`:245`) names the ledger.
- **S6 — observe the interim path.** `review_document` on this plan file once (one panel round), recorded in this plan.
- **S7 — the server plan**, in its own worktree, branch and pull request in that repository, under its own rules (plan
  only; no server code here).
- **S8 — verify and review.** `npm test`, `npm run check`, `node tools/ownership-check.mjs`, `node tools/rule-bodies.mjs`,
  `node tools/plan-lifecycle.mjs` — five commands, because `npm test` does not run the family checks
  (`research/module_tests.md:989`). Then the dry run below. Then `review_code` and an Opus review started together; the pull
  request; every bot thread verified and resolved; merge by rebase.
- **S9 — ask the owner** about promoting `release` and the consumer bumps (decision 9), with the unchecked repository's
  `todo/` checked on its remote first. Until then this plan stays in `todo/`.

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
- **Size.** `node tools/rules.mjs explain` for `inspect --file todo/PLAN_x.md` before and after; the two `planning-docs`
  lines must not take that scope over 32 768 B.

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

## Definition of Done

- [ ] `common/plan-change-control.md` exists by the outline, selected by the fourteen split-read tasks and none of the four
      single-read ones; `planning-docs` carries the two lines; `research/rule-bodies.json` records both.
- [ ] `tools/lib/plan-ledger.mjs` and `plan-lifecycle.mjs` report every row of the findings table; every test was watched
      failing first; a throw is a finding, not a crash.
- [ ] The meaning test pins the three sentences, with splice cases; the rule/check agreement case passes.
- [ ] The dry run over the estate added zero `changes` findings; the `inspect --file todo/…` scope stays ≤ 32 768 B.
- [ ] The interim path was observed once on this plan, and the result recorded here.
- [ ] The server plan exists in its repository with the same boundary table.
- [ ] `research/module_rules.md`, `research/module_tests.md` and the `README.md` tools row describe what runs.
- [ ] Five commands green; `review_code` and an Opus review resolved; every bot thread answered; merged by rebase.
- [ ] The owner was asked about `release` and the consumer bumps; the answer is recorded here.
