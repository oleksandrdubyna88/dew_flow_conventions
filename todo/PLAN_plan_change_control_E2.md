# PLAN — Plan change control, E2: the rule, the lines that point at it, and what describes it

> Status: **built, 2026-10-29 — in epoch 3 of the parent (owner-approved 2026-10-29); its code round is recorded
> below.** Scope: the
> stories of epic E2 — the shared rule
> `common/plan-change-control.md`, two pointer lines in `common/planning-docs.md`, the body freeze in
> `research/rule-bodies.json`, the selection cases in `tools/rules.test.mjs`, a new `tools/plan-change-rule.test.mjs`,
> `research/module_rules.md`, `research/module_tests.md`, the `README.md` tools row, a `plan-lifecycle` step in
> `.github/workflows/ci.yml` and the parent's status line.
>
> Stories of epic E2 of [PLAN_plan_change_control.md](PLAN_plan_change_control.md) (§ *Epics*, E2). Split by Opus on
> 2026-10-29, from the parent and from what E1 really built ([PLAN_plan_change_control_E1.md](PLAN_plan_change_control_E1.md),
> `tools/lib/plan-ledger.mjs`). This document keeps no change ledger of its own: a change to E2's approved work is
> recorded in the parent (parent §3, finding 9). E2 has no cornerstone (parent, E2 *Cornerstone area*); the parent's
> ledger line stays `Cornerstones: 1 of 1 — E1.S1`.

Done when (from the parent): `node tools/ownership-check.mjs` passes with every `mcp__coai__*` token declared and no
"the gate" in prose; `node tools/rule-bodies.mjs` is clean with both ids re-recorded; the selection, meaning and
agreement tests pass and each splice case was watched going red; the rule is at most 12 288 B; the size measurement is
recorded as the parent's DoD states it; CI runs `node tools/plan-lifecycle.mjs`; the five commands are green;
`review_code` and the Opus review are resolved; ONE commit on `feat/plan-change-control-e2`.

The five commands, from the worktree root (`npm test` does not run the family checks, `research/module_tests.md:989`),
after the locked install that `.agents/PROJECT.md` requires (E2 plan round, finding 0):

```bash
npm ci --ignore-scripts
npm test
npm run check
node tools/ownership-check.mjs
node tools/rule-bodies.mjs
node tools/plan-lifecycle.mjs
```

## Gates, models, and the one commit

- **Gates, in order.** `open` on `feat/plan-change-control-e2` (this checkout's own top level and branch, with
  `callerModel`); `review_plan` with `plan: "todo/PLAN_plan_change_control.md"` and `epic: "2/2"`; `resolve` every finding
  (reject in round one what is wrong); build S4 → S3 → S5 (below); ONE commit; then `review_code` over the epic's whole
  diff with `baseRef` `0af69b0` (E1's last code-reviewed commit: round 6 covered `4d18e4d..0af69b0`, so `04e423e` is
  inside it — keep `0af69b0`) and an Opus review, both started AT ONCE;
  fixes folded into the one commit while it is unpushed. A reply's `commands` are followed and named in the summary.
- **Models.** Scenarios and briefs: Opus (this document). Code, rule text, tests and documentation: a Sonnet coder per
  story, from the brief below with no re-discovery. Review: Opus. Fixes: Sonnet. The small-edit exception may apply to S5's
  README row and status line (one file each, under 50 lines), never to S3 or S4.
- **No pull request from this epic alone** — S10 in the parent opens ONE pull request from this branch carrying E1's and
  E2's commits, merged by squash — one commit on `main` whose message summarises both epics. S7 (the server plan) and S9 (the owner's release question) follow outside the epic.
- **At the end:** `node tools/plan-lifecycle.mjs` must print `plan-lifecycle: clean.`

### Q1 — the size criterion, as the re-review for epoch 3 adopted it

Q1 found that the parent's old DoD item (*"the `inspect --file todo/…` scope stays ≤ 32 768 B"*) could never hold:
**measured 2026-10-29, before any E2 edit, on this branch at `0af69b0` and on `main` at `72ae2f3` alike, that scope is
38 612 B** — `common.coding-style` 2 889, `common.knowledge-base` 3 564, `common.planning-docs` 14 405,
`common.security` 8 602, `common.task-lifecycle` 9 152; a split read today (`read` refuses it without `--only`). The
owner's decision made that the parent's entry 2.2 (a DoD change) and the second full stop. The criterion the parent's DoD
now carries, and S4 measures:

- `explain` for `inspect --file todo/PLAN_x.md` before E2's first edit (38 612 B) and after E2's commit, both numbers with
  their commits recorded in `research/module_rules.md`;
- the growth equals what the two `planning-docs` pointer lines add by `wc -c` (≈ 370 B, so ≈ 38 979 B after);
- `common.plan-change-control` is not selected in that scope;
- the ten scopes of the four single-read tasks pinned by `tools/rules.test.mjs:215-222` (four of `inspect`, three of
  `ui`, two of `gpu`, one of `storage`) remain ≤ 32 768 B — none of them selects `planning-docs`.

S4 does NOT add a `todo/` scope to the `fits one read` test: it would be red on `main`.

**The measured cost of `depends: planning-docs`** (recorded in `research/module_rules.md` too): `audit`, `http`,
`benchmark` and `logging`, which `planning-docs` does not list, each gain `planning-docs` and the rule — about 26 KB
(≈ 14.8 KB + ≤ 12.3 KB). All four are split reads already (190 574, 70 968, 69 787 and 47 207 B at `0af69b0`), so no
cap moves.

### Not in E2

- S7, S9, S10 (parent, *After the epics*).
- `tools/lib/plan-ledger.mjs`'s header still says the format is in `todo/PLAN_plan_change_control.md` § 2. After E2 the
  rule carries it, and the plan moves to `research/` at promotion. Not changed here (E1's file, and no story owns it);
  named for the promotion's link pass.

## Order

Nothing starts before epoch 3 is approved and E1's fix-forward commit for known limit K1 has landed
(the reserved entry prefix accepting repeated markers — the parent's E1 done-when): A4 (c) below and the rule's
§ The check describe the fixed lib. Then E2.S4 first — the new tests written and watched failing for the right reason (the rule does not exist yet) → E2.S3 —
the rule, the two lines, the body freeze, every new test green → the RED-GREEN-RED splice checks of S4 → E2.S5 — the
documents and the CI step → the five commands → ONE commit → `review_code` + Opus review. The numbering follows the parent (S3 the rule,
S4 its tests, S5 documentation); the build order is TDD.

## What E1 built — the facts the rule describes

Read from `tools/lib/plan-ledger.mjs` at `0af69b0` and the E1 stories document. The rule states these in plain words;
it never restates the lib's regexes.

- `tools/plan-lifecycle.mjs` reads the `## Plan changes` section of every plan in `todo/` only (`research/` is history),
  through `tools/lib/plan-ledger.mjs`, as the finding class `changes`; a run with any `changes` finding ends with the
  hint line *"A plan that changed twice after its approval stops for a whole re-review: common/plan-change-control.md"*.
  A throw while reading one plan is a `changes` finding naming the file, never a crash, and still exit 1.
- Opt-in by presence: no `## Plan changes` heading outside fences → the plan is not read. The heading is exactly
  `## Plan changes`; another case, level, spacing or closing hashes is a finding (*not a ledger heading*).
- It reads the file as it stands in the checkout — never git history, never the diff.
- Fields are separated by ` · ` (U+00B7) and the cause follows ` — ` (U+2014); `|`, `--`, `-` and the en dash are
  refused by a message naming the expected character. Keywords and values are case-sensitive (`Owner` is refused).
- Every ledger line stands at column 0. Free text is indented; a prose line at column 0 is a finding (*unreadable
  line … put free text on an indented line*), because an entry that lost its `- ` is exactly such a line.
- The reserved prefixes: an indented line that starts like an entry (`- 1.2`, `* 1.2`, `+ 1.2`, `1. 1.2`, `1) 1.2`, a
  bare `1.2`, and — after E1's K1 fix-forward — repeated markers such as `- - 1.2` and `1. - 1.2`), with `>`, or with
  `#` is a finding (*a ledger line stands at column 0*), never parsed, never counted —
  invisible characters in the indent do not hide it. The cost: free text may not begin with an entry-shaped number, `>`
  or `#`.
- `STOP_PHRASE = /\bstopped for re-review\b/i`: a stopped epoch needs it in the status paragraph (row 2), and a stopped
  plan that says what is done is not called finished (`isFullyDone`).
- A stopped plan is CLEAN by design (plan round 1, finding 0, rejected): a red while stopped would block the stop
  commit, the re-review and its reverts. The halt is the rule's.
- What it cannot see (the lib's header): a plan with no ledger heading; a change nobody recorded; code written during a
  stop; entry dates (only epoch dates are ordered); where the section stands in the file. Known limits: **K1** (an
  indented line behind TWO list markers) is FIXED by the re-review for epoch 3 — §2's reserved entry prefix becomes
  `^(?:(?:[-*+]|\d{1,9}[.)])\s+)*[1-9]\d*\.[1-9]\d*(?=\s|$)`, built by E1's fix-forward commit after resume. Two stay,
  recorded and not fixed: **K2** a setext
  heading (`Plan changes` on its own line over `---` or `===`); **K3** a heading styled with inline markup or a character
  reference (`## **Plan changes**`, `## *Plan changes*`, a code span, `## Plan&nbsp;changes`).

## E2.S3 — The rule, the two pointer lines, the body freeze

- **Models.** Brief: Opus (below). Text: a Sonnet coder. Review: Opus.
- **Goal.** `common/plan-change-control.md` by the parent's outline (§1), describing what E1's check really does; the two
  lines of the parent's §4 in `common/planning-docs.md`; both bodies recorded.
- **Files.** New `common/plan-change-control.md`; `common/planning-docs.md` (two edits); `research/rule-bodies.json` (one
  new entry, two records).

### The brief — the rule file

**Frontmatter, verbatim** (parent §1 — the fourteen split-read tasks of `common/subagent-models.md`, NO `paths`, ONE
`depends`):

```yaml
---
id: "common.plan-change-control"
load: "conditional"
tasks: ["audit","plan","implement","docs","policy","test","git","pr","release","deploy","dependencies","http","benchmark","logging"]
depends: ["common.planning-docs"]
---
```

No `paths` (selection is paths OR tasks, `tools/lib/rule-catalog.mjs:157-163`, so a `todo/**` glob would pull the rule
into every `inspect --file todo/…` scope). `common/planning-docs.md` gets NO `depends:` on this rule, for the same
reason. No `depends:` on the coai rules.

**H1, verbatim, then the markers directly below it**, one per token the body really names, each matched EXACTLY by
`tools/ownership-check.mjs` (`MARKER`, `MCP_TOOL`, `PRODUCTS`):

```markdown
# A plan changed twice after its approval stops for a whole re-review (MANDATORY)

<!-- owns: coai — the server named in every tool below and in the coai rule files this one links -->
<!-- owns: mcp__coai__review_plan — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__review_code — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__review_document — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__resolve — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__consult — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__ask_consultants — a tool name a session types; there is no generic spelling of it -->
```

Write no other `mcp__*__*` name (not `open`, `close_consult`, `ask_human` or `status` with the prefix — say "as
coai-document-gate says" instead) and no product name (`ConnectOtherAIs`). The ownership check also refuses `the` / `its`
/ `our` directly before `gate`, `panel`, `extension`, `daemon`, `broker`, `vault`, `crate`, `sidecar` or `benchmark`
— the WHOLE file is scanned, the fenced example and the frontmatter included. Say "the review server", "the document
review", "the code round", "a review gate".

**Links.** In this document `[text]{target}` stands for the markdown link whose text is `text` and whose target is
`target`, written with round brackets in the rule. It is spelled with braces here only because this file sits in `todo/`,
where the lifecycle check would resolve it from the wrong folder. In the rule, a sibling rule is linked by its bare file
name, as `common/planning-docs.md` links its siblings, and a tool as `../tools/<name>`.

**The sections, in this order, with these exact headings** (they are recorded in `research/rule-bodies.json` and the
meaning test finds two of them by name). Byte budgets add up to about 11 900 B; the file must end between 9 000 B and
12 288 B as `wc -c` counts it (the outline's content does not fit 11 KB: measured ≈ 12.1 KB); the frontmatter, H1 and
seven markers take about 1 000 B of it (the catalog's `bytes` is the same number). Simple English, short sentences, hard-wrapped
at about 120 columns like the other rules.

1. **Lead blockquote** (≤ 400 B, plus ≈ 220 B for the pinned paragraph), then the first pinned sentence as its OWN bold paragraph (not inside the
   blockquote — a `> ` on a wrapped line would break the meaning test's match):
   - the blockquote: this governs a plan's life AFTER its first approval; where plans live and how they are split is
     [planning-docs.md]{planning-docs.md}; who acts at each step is [subagent-models.md]{subagent-models.md}; how a
     review round runs is [coai-review-gate.md]{coai-review-gate.md}.
   - **Pinned sentence 1, verbatim, bold, a paragraph alone:**
     `**After the first approval, ONE change is allowed — record it and go on. The SECOND is a full stop: no new code on any epic of the plan until the whole plan has been reviewed again.**`
2. **`## Why — measured`** (≤ 1 400 B), two dated cases, anonymised per `common/rule-ownership.md` (date kept; no
   repository, no path, no line):
   - *The case that made the rule:* a plan in this family passed its plan review on 2026-10-21. After that, a story was
     added (the owner, 2026-10-26); two stories moved out to a remainder plan; a platform run and one of its tests left
     the merge conditions (the owner, 2026-10-27); eight lines were rewritten in place after a later review; and a merged
     predecessor epic had its contract rewritten and its 308-line script replaced by one of 874 lines, while that epic's
     one release never happened. Each change was reasonable on its day and was judged alone; they were first seen
     together at promotion. Counted by this rule, the stop comes on 2026-10-26 — before the merge conditions were cut.
   - *This rule's own first run:* the plan that introduced this rule ran under it from its first approval on 2026-10-28.
     Its second change, the same day — a reviewer found that an entry indented one space hid from the count — stopped
     it. The re-review was consulted, the done work was sorted (nothing cut), and because the first change had made the
     merge conditions smaller, the owner approved a narrowed epoch 2 on 2026-10-29.
   - One line of rationale, in these words: one change is learning; the second triggers a review of whether the plan's
     model of the work is drifting — the same signal as a test still red after two fixes or a person saying twice that it is still broken
     ([coai-consultant.md]{coai-consultant.md}, triggers 1 and 4).
3. **`## What counts as a change`** (≤ 950 B) — parent decisions 1–3:
   - A change: an accepted change to scope, goals, the Definition of Done or the merge conditions, epics or stories
     (added, removed, moved to another plan), the build order, a contract, or the planned approach — a review finding
     accepted after approval that changes a planned step included, counted on the day it is accepted.
   - Not a change: wording, a typo, a repaired reference, ticked boxes or a progress table, an implementation fix that
     only satisfies the plan as written, writing an epic's stories document when the epic starts. **In doubt, it is a
     change.**
   - **Pinned sentence 2, verbatim, its own paragraph:** `**An owner's request counts exactly like one you find.**`
     followed in the same paragraph by: the count measures how far the plan moved, not whose idea it was. (ASCII
     apostrophe in `owner's`.)
   - One cause is one change, however many lines it edits; independent causes count one each, even in one review round.
   - The FIRST change is not free of the other rules: when it changes the shape of the work, coai-consultant's trigger 5
     still fires before `mcp__coai__resolve`.
4. **`## How it is counted`** (≤ 1 050 B) — decision 4, approval, merges, adoption (decision 11):
   - Per parent plan, across sessions, branches and epics. A stories document keeps no ledger; a change it makes to the
     parent's approved work is an entry in the parent (the check reports a ledger in a stories document whose parent is
     in `todo/`).
   - Approval is the plan's first passing plan-round verdict — `proceed`, `good_enough` or `continue_anyway` — or the
     owner's go-ahead where no review server runs, whichever comes first. It opens epoch 1.
   - Two branches that each record one change merge into a plan with two: the check turns red at the merge, which is
     where the stop belongs. That merge (or the commit right after it) renumbers the later entry `k.2` and writes the
     stop in the same commit.
   - **Plans approved before this rule** (its date: the day E2's commit is written, expected 2026-10-29) carry no ledger
     until their next change: the commit that accepts that change also opens the ledger — epoch 1 dated at the plan's
     last approval, that change as entry 1.1. Earlier changes stay in the plan's deviations. No open plan stops on the
     day this rule lands. The check cannot see a plan that skipped this; the Definition of Done and the code review own
     it.
5. **`## The ledger`** (≤ 2 300 B, the example ≈ 700 B of it):
   - Its place: a section `## Plan changes` directly under the status block, before the first other section, so
     `## Epics` stays the last section. Append only; an entry is written in the commit that accepts its change.
   - **The example, verbatim, inside a fence that opens with exactly ```` ```markdown ```` on its own line and closes
     with ```` ``` ```` on its own line.** It must stay the ONLY `markdown` fence in the rule whose first line is
     `## Plan changes` — the agreement test finds it that way. Verified on the lib at `0af69b0`, 2026-10-29: unfenced
     into a plan it gives no finding.

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

     (In the rule the fence starts at column 0; the indentation above is this list's.)
   - The two line shapes, each in a code span: `> Epoch <k> · approved <YYYY-MM-DD> · by reviewers|owner · state: open|stopped|closed`
     and `- <k>.<n> · <YYYY-MM-DD> · owner|agent|reviewer · <kinds> — <cause>`; kinds comma-separated from `scope`,
     `goals`, `dod`, `merge-conditions`, `epics`, `stories`, `build-order`, `contract`, `approach`. The highest epoch is
     current; every lower one is `closed`. The separators are ` · ` (U+00B7) and ` — ` (U+2014) — no `|`, `--` or en
     dash; keywords and values are lower case exactly as shown.
   - The heading is exactly `## Plan changes`.
   - **Free text is INDENTED.** Every ledger line stands at column 0; anything else in the section — a cause that
     continues, a note, a reason — goes on an indented line. A prose line at column 0 is a finding: it reads like an
     entry that lost its `- `, and a lost entry would lower the count in silence.
   - **The reserved prefixes, and their cost.** An indented line that starts like a ledger line — an entry number with or
     without a list marker, or behind several (`- 1.2`, `* 1.2`, `1. 1.2`, `- - 1.2`, a bare `1.2`), a `>` or a `#` — is
     a finding too: a renderer shows
     it as a list item, a quote or a heading that a reader counts. So free text may not begin with an entry-shaped number,
     `>` or `#`; write `  (quoted) …` or `  version 1.2 …` instead.
   - The re-review record: `### Re-review for epoch <k>` before epoch k's line, for every k ≥ 2, with one
     `Narrowed: yes|no` line (optionally ` — <why>`) and a `| Work | Where | Verdict | Action |` table of at least one row;
     the verdict is `fits`, `cut` or `—` (nothing was built). While the plan is stopped the record may stand with no next
     epoch line yet — that is the re-review in progress.
   - **The count is never written.** It is the number of entries of the current epoch.
6. **`## The full stop`** (≤ 1 850 B), a numbered list in this order (parent §1.6):
   1. **Record** the second entry and set `state: stopped`; the status paragraph says `stopped for re-review`. One commit,
      pushed — the stop is then visible to every other session.
   2. **Halt.** No new code on any epic of the plan, and no merge of a pull request carrying its work. Allowed: the
      re-review, the reverts it decides, work outside the plan, an incident fix the owner orders.
   3. **Consult.** One `mcp__coai__consult` for the re-review, every change of the epoch quoted as evidence (trigger 5's
      shape); every question meant for the owner goes through `mcp__coai__ask_consultants` first. No consultant to be
      had: say so, verify yourself, take it to the owner.
   4. **Revise the WHOLE plan** — goal, Definition of Done, merge conditions, epics, build order — against what is known
      now, not a patch of the two changes. **What the re-review changes is not counted: it is the baseline the next epoch
      is approved on**, recorded in the re-review record, never as entries.
   5. **Sort the done work.** An Opus judge lists every merged pull request, pushed commit and local commit of the plan and
      marks each `fits` or `cut` in the record's table.
   6. **Cut** (decision 7): merged and contradicting the revised plan → reverted or corrected in a NEW pull request;
      merged and compatible → kept; pushed but unmerged → revert commits or a fix forward, never a history rewrite; local
      and never pushed → may be dropped. Every disposition is the row's Action.
   7. **Re-split** when the epics changed: Fable, after the question consultants; stories documents of changed epics
      rewritten by Opus when they start; the cornerstone ledger recounted.
   8. **Re-review** (next section), then **resume**: epoch k+1's line, `open`, and epoch k becomes `closed`. When scope,
      the Definition of Done, the merge conditions or the release got smaller, the record says `Narrowed: yes`, the owner
      approves before work continues, and the epoch line says `by owner` (decision 5). Epoch k+1 starts at 0 changes;
      nothing recorded is deleted (decision 6).
   9. **Continue** with epics, stories and gates as the pipeline says.
7. **`## Reviewing the revised plan`** (≤ 1 150 B) — parent §1.7, exactly:
   - The re-review is planning work: select rules with `--task plan`.
   - Epics not yet started: their own `mcp__coai__review_plan` on their own branch, as today.
   - A branch whose plan round has already passed (its session is in the code stage, whether or not a code round has run)
     — **interim, and named so**: `mcp__coai__review_document` with `documentPath` = the plan file and a `purposeText`
     naming the re-review of epoch k+1 (after `open`, as [coai-document-gate.md]{coai-document-gate.md} says);
     `newReview: true` when an earlier review of that file finished; `mcp__coai__resolve` every finding with the same
     `document`; act on the verdict. Then the next `mcp__coai__review_code` on that branch passes the revised plan as
     `planText`, with `again: true` when its last code round closed.
   - **Pinned sentence 3, verbatim, bold, opening its own paragraph:**
     `**This is the only case where a plan goes to the document review, and only on a branch whose plan round has already passed.**`
     The same paragraph goes on: coai-document-gate keeps plans out because a document round leaves the code round shut;
     here the code round is already open, and what is missing is a reading of the whole plan. Everywhere else that rule
     stands.
   - Observed on 2026-10-28, both halves: a document round over a plan file ran and reached a verdict, and the next code
     round on that branch took the revised plan as its scope.
   - The switch, verbatim (not pinned): **"When `mcp__coai__review_plan` accepts `again: true` after `proceed`, use that,
     and this paragraph goes."** No repository named.
   - Your own Opus review runs as always, in addition.
8. **`## The check`** (≤ 1 000 B):
   - [`tools/plan-lifecycle.mjs`](../tools/plan-lifecycle.mjs) (the link form `common/planning-docs.md` already uses)
     reads the ledger of every plan in `todo/` — never `research/`, never git history — and is red when the current epoch
     has two entries and is not stopped, when a stop is not in the status paragraph, when a heading, epoch line, entry or
     record cannot be read, when numbers, epochs or dates are out of order, when an epoch after the first has no
     re-review record, when a narrowed epoch is approved by reviewers, and when a stories document carries its own ledger.
     Every line it cannot read is red, never skipped.
   - **The bound, verbatim:** `the check validates the prescribed ledger syntax and detects specified malformed variants;
     a clean result does not prove that every change was recorded or the stop obeyed.` (one sentence, its own line of
     the section — a reader must not take a green check for an audit).
   - What it cannot see, and therefore this rule, its Definition of Done and the code review own: a plan with no ledger;
     a change nobody recorded; code written during a stop — **a stopped plan is clean by design**, because a red while
     stopped would block the stop commit, the re-review and its reverts.
   - Two shapes it does not see — never write them: a setext heading (`Plan changes` over `---` or `===`); a heading
     styled with inline markup or a character reference (`## **Plan changes**`, `## Plan&nbsp;changes`). Shapes, not ids
     — the rule names no K-number. Two list markers are NOT among them: after E1's K1 fix that shape is a finding.
9. **`## Never`** (≤ 450 B), parent §1.9: keep building after a second change; fold independent causes into one entry;
   edit or delete an entry to lower a count; rewrite pushed history to cut work; resume a narrowed plan without the owner;
   send a plan to the document review outside the interim case.
10. **`## Definition of Done`** (≤ 750 B), checkboxes, parent §1.10: every approved plan the task touched has its ledger;
    each change after approval is one entry per cause in the parent, in the commit that accepts it, free text indented;
    at the second change the stop was recorded in one commit and no code or merge followed until re-approval; the
    re-review asked the consultants (or said why not), revised the whole plan, sorted the done work by an Opus judge with
    every disposition recorded, made the cuts, re-split by Fable if the epics changed; re-approval by the path above, with
    the owner when narrowed; `plan-lifecycle.mjs` clean; the summary names the epoch, the count and what was cut.

Each pinned sentence appears ONCE in the body: do not repeat it in `## Never` or `## Definition of Done` (S4's splice case
goes red if you do). The phrases "After the first approval, ONE change is allowed", "counts exactly like one you find"
and "This is the only case where a plan goes to the document review" must occur nowhere else in the file.

### The brief — the two lines in `common/planning-docs.md` (parent §4, no new heading)

1. In § *Creating a plan*, append to the paragraph that starts *"A plan carries: …"* (line 31, after *"a Definition of
   Done checklist."*), as its last sentence:
   `From its first approval it also carries a change ledger — a plan approved before that rule opens one at its next change — and its second change stops it for a whole re-review — [plan-change-control.md]{plan-change-control.md}.`
2. Line 161, *"Six findings, all of them failures this family has actually made: … and a promoted plan the research index
   never mentions."* → *"Seven findings, … the open table drifting from its folder, a promoted plan the research index
   never mentions, and a change ledger that cannot be read or records a second change without its stop
   ([plan-change-control.md]{plan-change-control.md})."* Every other word of that sentence stays.

Hard-wrap both like their neighbours. No other edit to that file.

### The brief — the body freeze

1. Hand-add the new entry to `research/rule-bodies.json`, in id order: AFTER `common.measurement` and BEFORE
   `common.planning-docs` (`-` sorts before `n`), with the four keys of every entry:
   `{"id": "common.plan-change-control", "source": "common/plan-change-control.md", "bodySha256": "", "sections": []}`.
   `--update` refuses an id it has no entry for (`tools/rule-bodies.mjs:184-189`), so this comes first.
2. `node tools/rule-bodies.mjs --update common.plan-change-control common.planning-docs` — it prints both ids, the
   first `→ <hash>` with 10 headings, the second with a moved hash and its 12 headings unchanged.
3. `node tools/rule-bodies.mjs` — in step.

### Scenarios (input → expected)

| # | Input | Expected |
|---|---|---|
| R1 | `node tools/ownership-check.mjs` | exit 0; any finding names the line — fix the prose, never add a marker for a word that can be rewritten |
| R2 | `wc -c common/plan-change-control.md` | 9 000 – 12 288 |
| R3 | `explain --task plan` (no file) | selects `common.plan-change-control` and `common.planning-docs` |
| R4 | `explain --task audit` (no file) | selects both; `common.planning-docs` with the reason `dependency:common.plan-change-control` |
| R5 | `explain --task inspect --file todo/PLAN_x.md` | does NOT select `common.plan-change-control`; `bytes` ≈ 38 979 = 38 612 + the `wc -c` growth of `planning-docs` (≈ 370 B) |
| R6 | `node tools/rule-bodies.mjs` before step 1 of the freeze | `UNRECORDED common.plan-change-control` and `DRIFT common.planning-docs`, exit 1 — the freeze's own red, observed |
| R7 | the same after step 2 | in step, exit 0 |
| R8 | `node --test tools/plan-change-rule.test.mjs` | every case green (S4) |
| R9 | `node tools/rules.mjs check --repo .` | resolved |

### Commands

```bash
node tools/ownership-check.mjs
wc -c common/plan-change-control.md common/planning-docs.md
node tools/rule-bodies.mjs
node tools/rule-bodies.mjs --update common.plan-change-control common.planning-docs
node tools/rules.mjs check --repo .
node tools/rules.mjs explain --repo . --task inspect --file todo/PLAN_x.md \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.bytes,j.rules.map(r=>r.id).join(" "))})'
node --test tools/plan-change-rule.test.mjs
```

### Done when

The rule exists with the frontmatter, H1, seven markers and ten headings above, in budget; the three pinned sentences
verbatim; the fenced example verbatim; the ownership check passes; both bodies recorded; R1–R9 as stated.

## E2.S4 — Selection, meaning and agreement tests (written FIRST)

- **Models.** Scenarios and brief: Opus (below). Tests: a Sonnet coder. Review: Opus.
- **Goal.** Pin what a hash cannot: that the rule is selected exactly where the parent says, that it still says its
  three sentences in their places, and that its ledger example is what E1's check accepts.
- **Files.** `tools/rules.test.mjs` (three cases added after the subagent-models test, `:207-213`);
  new `tools/plan-change-rule.test.mjs` (pure — writes no file, makes no folder, spawns nothing, so
  `common/test-leftovers.md` asks nothing of it; say so in its header as `plan-ledger.test.mjs` does).

### The brief — `tools/rules.test.mjs`

Reuse `SPLIT_READ_TASKS`, `SINGLE_READ_TASKS` and `sourceRoot` as they are (`:204-205`, `:120`); retype no task list.
Add, after the subagent-models test:

```js
// The plan-change-control rule is scoped like subagent-models — tasks alone, the same fourteen — and has no `paths`:
// selection is paths OR tasks, so a `todo/**` glob would pull it into every `inspect --file todo/…` scope, and so would
// a `depends:` on it from planning-docs, which IS selected there.
const PLAN_CHANGE_RULE="common.plan-change-control";

test("the plan-change-control rule is selected for the fourteen split-read tasks and for none of the four single-read ones",()=>{
  const catalog=loadCatalog(sourceRoot);
  const selects=task=>selectRules(catalog,[task],[]).some(rule=>rule.id===PLAN_CHANGE_RULE);
  for(const task of SPLIT_READ_TASKS)assert.ok(selects(task),`${task} must select ${PLAN_CHANGE_RULE}`);
  for(const task of SINGLE_READ_TASKS)assert.ok(!selects(task),`${task} must not select ${PLAN_CHANGE_RULE}`);
});

test("a plan file does not pull the plan-change-control rule into a scope of the four single-read tasks",()=>{
  const catalog=loadCatalog(sourceRoot);
  const byId=id=>catalog.find(rule=>rule.id===id);
  assert.ok(byId(PLAN_CHANGE_RULE),"the rule exists in the catalog — otherwise every negative below is vacuous");
  for(const task of SINGLE_READ_TASKS)for(const file of ["todo/PLAN_x.md","todo/PLAN_x_E2.md","research/PLAN_x.md"]){
    const ids=selectRules(catalog,[task],[file]).map(rule=>rule.id);
    assert.ok(!ids.includes(PLAN_CHANGE_RULE),`${task} --file ${file} selects ${PLAN_CHANGE_RULE}: a paths glob on it, or a depends on it from a rule that path selects`);
    // the companion: the path really reaches planning-docs, so the negative above is about the dependency, not about a path that matches nothing
    assert.ok(ids.includes("common.planning-docs"),`${task} --file ${file} no longer selects common.planning-docs, so this case proves nothing`);
  }
  assert.deepEqual(byId(PLAN_CHANGE_RULE).paths,[],"the rule carries no paths");
  assert.deepEqual(byId(PLAN_CHANGE_RULE).depends,["common.planning-docs"],"the rule depends on planning-docs and on nothing else");
  assert.ok(!byId("common.planning-docs").depends.includes(PLAN_CHANGE_RULE),"planning-docs must not depend on the rule");
});

test("the rule brings planning-docs where planning-docs' own tasks do not reach",()=>{
  const catalog=loadCatalog(sourceRoot);
  for(const task of ["audit","http","benchmark","logging"]){
    const docs=selectRules(catalog,[task],[]).find(rule=>rule.id==="common.planning-docs");
    assert.ok(docs?.reasons.includes(`dependency:${PLAN_CHANGE_RULE}`),`${task}: common.planning-docs must arrive as the rule's dependency`);
  }
});
```

The four tasks of the last case are the split-read tasks that `planning-docs` does not list (its `tasks` are `plan`,
`implement`, `docs`, `policy`, `test`, `git`, `pr`, `release`, `deploy`, `dependencies`) — checked 2026-10-29: `audit` today
selects no `planning-docs` at all. Do NOT add a `todo/` scope to the existing *"every single-read scope … still fits one
read"* test (`:215-222`): that scope is 38 612 B on `main` (Q1).

### The brief — `tools/plan-change-rule.test.mjs`, in the `tools/gate-routing.test.mjs` pattern

Header comment in that file's voice: the freeze proves a body CHANGED, never that it still SAYS what it exists to say; a
recorded replacement passes everything; so the three sentences the rule exists for are asserted, each with a splice case
that removes its paragraph and requires the phrase to vanish with it, and a placement case — a sentence in the wrong
section reads as something else. Then the agreement half: the rule SHOWS a ledger and E1's lib READS ledgers; two
documents of one format agree only while something compares them (`common/testing.md` § *A green suite is not evidence
about a contract with TWO IMPLEMENTATIONS*), so the rule's own example goes through `ledgerFindings`. Pure: strings in,
strings out.

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { bodyOf, outsideFencedBlocks } from "./lib/rule-body.mjs";
import { APPROVERS, KINDS, ledgerFindings, SOURCES, STATES, STOP_PHRASE, VERDICTS } from "./lib/plan-ledger.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "common/plan-change-control.md";
const TICKS = "`".repeat(3); // a fence inside a fence cannot be shown in a document

/** A sentence, verbatim, as a pattern in which any space may be a line break — the prose is hard-wrapped. */
const phrase = (text) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"));

const PINS = [
  { opens: "**After the first approval, ONE change is allowed", section: null,
    text: "After the first approval, ONE change is allowed — record it and go on. The SECOND is a full stop: no new code on any epic of the plan until the whole plan has been reviewed again.",
    why: "the rule itself: one change is allowed and the second stops all new code" },
  { opens: "**An owner's request counts", section: "## What counts as a change",
    text: "counts exactly like one you find",
    why: "an owner's change is counted, or the measured case's two owner changes would be free" },
  { opens: "**This is the only case where a plan goes to the document review", section: "## Reviewing the revised plan",
    text: "This is the only case where a plan goes to the document review, and only on a branch whose plan round has already passed.",
    why: "the narrow exception to coai-document-gate — without its second half every plan would go to the document review" },
];

function rule() {
  const file = path.join(root, SOURCE);
  assert.ok(fs.existsSync(file), `${SOURCE} does not exist — the rule E2 writes`);
  return bodyOf(fs.readFileSync(file, "utf8"));
}
```

`section: null` means "before the first `\n## ` heading". **Sections are cut from `outsideFencedBlocks(rule())`**, never
from the raw body: the rule's example fence opens with a column-0 `## Plan changes`, which would otherwise end
`## The ledger` at its own example (fenced lines become empty lines there, so nothing else moves). The cases:

| # | Test name | Assertion | Its message names |
|---|---|---|---|
| M1 | the rule says its three sentences | for each pin, `assert.match(body, phrase(pin.text))` | the phrase, `why`, and that the hash freeze cannot see this |
| M2 | every one of those sentences comes from its paragraph and nowhere else | locate `opens` (`notEqual -1`, naming it); cut from `opens` to the next `\n\n` (or the end); `doesNotMatch(without, phrase(text))` | the phrase survives the paragraph's removal, so M1 would stay green without it |
| M3 | each sentence stands in its section | the text from `pin.section`'s line to the next `\n## ` (or, for `null`, the text before the first `\n## `) matches the phrase; a missing section heading is its own message | the section, and that a sentence elsewhere reads as something else |
| A1 | the rule's ledger example is a clean ledger to the check | `example()` (below) into `plan()`; `ledgerFindings(...)` deep-equals `[]` | every finding, one per line |
| A2 | the example's first epoch, still open with its two changes, is red | the example's lines up to (not including) `### Re-review for epoch 2`, `state: closed` → `state: open` | `/epoch 1 has 2 changes and is not stopped/` (the parent's own wording of this case) |
| A3 | a second change in the example's open epoch is red, and its stop is clean | append `- 2.2 · 2026-10-29 · reviewer · approach — a second cause`; then the twin: the same, epoch 2's line `state: open` → `state: stopped` and the status `> Status: **stopped for re-review, 2026-10-29.** …` | red: `/epoch 2 has 2 changes and is not stopped/`; twin: `[]` |
| A4 | free text at column 0, and an indented entry, are findings — as the rule says | (a) the example's `  (Free text is indented…` line with its indent removed; (b) the example plus ` - 2.2 · 2026-10-29 · reviewer · approach — hidden` (one space); (c) the example plus `  - - 2.2 · 2026-10-29 · reviewer · approach — hidden` (two markers) | (a) `/unreadable line/` and `/put free text on an indented line/`; (b) and (c) `/a ledger line stands at column 0/` — (c) is red only once E1's K1 fix has landed, which is why E2 starts after it |
| A5 | the rule names every word the check accepts | in the text of `## The ledger`: each of `KINDS`, `SOURCES`, `STATES`, `APPROVERS`, `VERDICTS` (iterated from the lib, never retyped) matched as a whole word, `(?<![\w-])word(?![\w-])`; `U+00B7` and `U+2014` named; in the whole body, `STOP_PHRASE` matches | the missing word and the list it comes from |

The helpers:

```js
const STATUS = "> Status: **in progress, 2026-10-29.** The rule's example as a plan carries it.";
const STOPPED = "> Status: **stopped for re-review, 2026-10-29.** The rule's example, stopped.";
const plan = (ledger, status = STATUS) => ["# PLAN — the rule's example", "", status, "", ...ledger, "", "## Goal", "", "Text."].join("\n");
const findings = (ledger, status = STATUS) => ledgerFindings({ file: "todo/PLAN_x.md", text: plan(ledger, status), status, parent: null }); // the status line in the text and the status argument agree (E2 plan round, finding 1)

/** The ONE `markdown` fence of the rule whose first line is `## Plan changes`, as lines, fence lines excluded. */
function example() {
  const lines = rule().split("\n");
  const starts = lines.flatMap((line, i) => (line === `${TICKS}markdown` && lines[i + 1] === "## Plan changes" ? [i] : []));
  assert.equal(starts.length, 1, `${SOURCE} must carry exactly one ${TICKS}markdown fence that opens with "## Plan changes"`);
  const end = lines.indexOf(TICKS, starts[0] + 1);
  assert.notEqual(end, -1, "the example's fence is never closed");
  return lines.slice(starts[0] + 1, end);
}
```

Every case reads the rule through `rule()`, so a missing file fails each one with the same sentence. A2–A4 build their
fixture from `example()` by line operations — never from a retyped copy of the example. The probe that settled the
expected messages ran on the lib at `0af69b0` on 2026-10-29 with exactly this example: A1 `[]`; A2 *epoch 1 has 2
changes and is not stopped … (entries 1.1, 1.2)*; A3 *epoch 2 has 2 changes …*, twin `[]`; A4 (a) *unreadable line … put
free text on an indented line*, (b) *a ledger line stands at column 0: line 25 …*; and `by owner` → `by reviewers` gives
*epoch 2 is narrowed (Narrowed: yes) and approved by reviewers*.

### The RED run (before S3 writes a line of the rule)

| Case | Expected RED message, for the right reason |
|---|---|
| rules.test — the 14/4 case | `audit must select common.plan-change-control` |
| rules.test — the plan-file case | `the rule exists in the catalog — otherwise every negative below is vacuous` (the first assertion, so the red is never a `TypeError`) |
| rules.test — the dependency case | `audit: common.planning-docs must arrive as the rule's dependency` |
| M1–M3, A1–A5 | `common/plan-change-control.md does not exist — the rule E2 writes` |

Record the three distinct messages in S5's `research/module_tests.md` section.

### RED-GREEN-RED — prove each case has teeth, after GREEN (edit locally, watch red, restore, watch green)

| Break, in the working tree only | Case that must go red |
|---|---|
| delete pinned sentence 1's paragraph | M1 (and M3) |
| copy *"counts exactly like one you find"* into `## Never` | M2 |
| move pinned sentence 3's paragraph into `## The check` | M3 |
| in the rule's example, `by owner` → `by reviewers` | A1 (row 8 message) |
| in the rule's example, the first ` · ` of entry 2.1 → a pipe | A1 (a row 4 message naming U+00B7) |
| remove `dod` from `## The ledger` | A5 |
| add `paths: ["todo/**"]` to the rule's frontmatter | the plan-file case |
| add `depends: ["common.plan-change-control"]` to `planning-docs` | every case that calls `loadCatalog`: it throws `Rule dependency cycle: …` (`tools/lib/rule-catalog.mjs:113`) — that throw is the expected red |

Each break is reverted before the next; `git diff --stat` shows only the intended files at the end.

### The size measurement (Q1, the parent's DoD)

Run the `explain` command of S3 for `inspect --file todo/PLAN_x.md` before the first edit (expected 38 612 B) and after
E2's commit (expected ≈ 38 979 B, and no `common.plan-change-control` in the list). Compute the growth of
`planning-docs` with `wc -c common/planning-docs.md` before and after and check it equals the scope's growth exactly.
Run the existing *"every single-read scope … still fits one read"* test: its ten scopes stay ≤ 32 768 B. Record the two
numbers, the five rule ids, the commit each was taken on and the `wc -c` growth in `research/module_rules.md` (S5); also
`inspect` with no file (24 207 B before; unchanged after) and the four scopes that gain the dependency (`audit`, `http`,
`benchmark`, `logging`, before and after).

### Commands

```bash
node --test tools/plan-change-rule.test.mjs
node --test --test-name-pattern "plan-change-control|plan file does not pull|planning-docs where" tools/rules.test.mjs
node --test --test-name-pattern "fits one read" tools/rules.test.mjs
npm test
```

### Done when

Every new case was watched failing with the message in the RED table, then passed; every break in the RED-GREEN-RED table
turned its case red and was restored; the size numbers are recorded.

## E2.S5 — The research documents, the README row, the parent's status line

- **Models.** Brief: Opus (below). Text: a Sonnet coder (the README row and the status line qualify for the small-edit
  exception). Review: Opus.
- **Goal.** The documents describe what runs ([knowledge-base.md](../common/knowledge-base.md)): the rule, E1's check and
  every test that holds them, with the numbers the runner printed.
- **Files.** `research/module_rules.md`, `research/module_tests.md`, `README.md`, `.github/workflows/ci.yml` (one step),
  `todo/PLAN_plan_change_control.md` (line 3 only).

### `research/module_rules.md` — a new section at the end, before *References*

Heading: `## The plan-change-control rule and the change-ledger check (2026-10-29)`. In that file's voice, short, facts
only:

- `common/plan-change-control.md` (its `wc -c` bytes): what it governs in one sentence; its `tasks` are the fourteen of
  `subagent-models` and omit `inspect`, `ui`, `gpu` and `storage`; no `paths`; `depends: ["common.planning-docs"]`, which
  brings `planning-docs` into `audit`, `http`, `benchmark` and `logging`; `planning-docs` does not depend on it. Its seven
  `owns:` tokens.
- `common/planning-docs.md` carries the two pointer lines (the ledger sentence; "seven findings").
- The check: `tools/plan-lifecycle.mjs`'s `changes` class through `tools/lib/plan-ledger.mjs` — `todo/` only, opt-in by
  the `## Plan changes` heading, the file as checked out, a throw per file becomes a finding, the hint line naming the
  rule; `STOP_PHRASE` shared with `isFullyDone`; E1 widened `outsideFencedBlocks` (`tools/lib/rule-body.mjs`) to
  CommonMark's fences — measured over the 38 rule files then, 0 recorded heading lists changed.
- The size measurement, as the parent's DoD states it: the before/after numbers of `inspect --file todo/PLAN_x.md` with
  their commits (38 612 B on `main` at `72ae2f3`; after, from the run), the growth equal to `planning-docs`' `wc -c`
  growth, the rule not selected there, the ten single-read scopes still ≤ 32 768 B; one sentence that the old absolute
  cap could never hold (the parent's entry 2.2); and the cost of `depends: planning-docs` on `audit`, `http`,
  `benchmark` and `logging`, before and after.
- Design record: [PLAN_plan_change_control.md](../todo/PLAN_plan_change_control.md) (a `todo/` link; it becomes a
  sibling link at promotion).

### `research/module_tests.md` — a new section after *What a hash cannot say*

Heading:

```markdown
## The change ledger and its rule (`tools/plan-ledger.test.mjs`, `tools/plan-lifecycle.test.mjs`, `tools/plan-change-rule.test.mjs`, 2026-10-29)
```

Written like the sections around it — what each file guards, what was
observed red, what it does not prove — with the counts the runner printed, never typed from memory:

- `tools/plan-ledger.test.mjs` (pure): the E1.S1 scenarios and one red case per row of the parent's findings table, each
  beside its clean twin; every fixture run with `\n` and `\r\n`; the lists iterated from the lib and pinned ONCE to the
  parent's §2; `node --test tools/plan-ledger.test.mjs` → its numbers.
- `tools/plan-lifecycle.test.mjs`, the spawned cases: a plan without a ledger stays clean; two open entries → exit 1 and
  the hint line; a stories document's ledger red only while its parent is in `todo/`; a red ledger in `research/`
  ignored; a stopped plan that says what is done is not `misfiled`; the throw seam (W9: a `module.registerHooks` stub
  swapped in through `--import`, Node ≥ 22.15; skipped with a reason below that) → a finding and exit 1, not a crash.
- The dry run over the estate (E1.S4): zero `changes` lines added — cite the E1 stories document's *Dry run record*.
- `tools/plan-change-rule.test.mjs`: the three pinned sentences with their splice and placement cases; the agreement cases
  A1–A5; and the selection cases in `tools/rules.test.mjs`. The RED messages of S4 and the RED-GREEN-RED breaks, one line
  each.
- **What it does not prove:** that an agent counts, stops or re-reviews — no loader output and no check is evidence of
  behaviour; an unrecorded change, a plan with no ledger and code written during a stop are invisible by design; the two
  shapes the check does not see (a setext heading, a styled heading — two list markers are detected since E1's K1 fix); git history is never read.

### `README.md` — the `tools/plan-lifecycle.mjs` row (`:245`)

The *Enforces* cell becomes (the other two cells stay):

```markdown
[`common/planning-docs.md`]{common/planning-docs.md}, and a plan's change ledger — [`common/plan-change-control.md`]{common/plan-change-control.md}
```

### `.github/workflows/ci.yml` — run `plan-lifecycle` over this repository's own plans (A19)

The consumers' CI runs `plan-lifecycle`; this repository's own CI did not run it over its `todo/` and `research/` —
the workflow's comment says the tool *tests itself* here, which is the selftest, not a run over these folders. First
run `node tools/plan-lifecycle.mjs` on the branch and see `plan-lifecycle: clean.`; only then add, in the `tools` job,
directly after the `Ownership` step (it needs no `npm ci`, like the ownership check — the file imports only `node:`
modules and `./lib/`):

```yaml
      # The plan lifecycle over THIS repository's own todo/ and research/ — every consumer's CI runs it over
      # theirs, and until 2026-10-29 this one did not. Dependency-free, so it runs before npm ci.
      - name: Plan lifecycle
        run: node tools/plan-lifecycle.mjs
```

No new `uses:` (so no SHA to pin), no `${{ }}` in the `run:` (the actionlint job's injection rule). If `actionlint` is
on the machine, run it over the file; otherwise the `workflows` job checks it on the pull request. Scenario: the step
turns red when a `todo/` plan is missing its `todo/README.md` row — try it locally by running the command with that row
removed (exit 1, `index … omits …`), then restore.

### The parent's status line (`todo/PLAN_plan_change_control.md`, line 3 — progress, not a change, decision 1)

Replace only the bold part, keeping `Scope: …` and everything after it:

```markdown
> Status: **in progress, epoch 3 (approved by the owner <date> after the second full stop of 2026-10-29) — E1 and E2 built on `feat/plan-change-control-e2`; the pull request (S10), the server plan (S7) and the owner's release question (S9) are open.** Scope: …
```

It must not say "all … built/done" (the totality check, `TOTALITY_VERDICT`, `tools/plan-lifecycle.mjs:72`). Write the
real approval date of epoch 3 where the template says `<date>`.

### Commands

```bash
node --test tools/plan-ledger.test.mjs tools/plan-lifecycle.test.mjs tools/plan-change-rule.test.mjs
node tools/plan-lifecycle.mjs
```

### Done when

Both research sections exist with run numbers; the README row names the rule; CI runs `node tools/plan-lifecycle.mjs`;
the parent's status line says what is built; `node tools/plan-lifecycle.mjs` is clean.

## Warnings for every coder of this epic

- **Escape text turns into characters.** The Edit tool, and even text inside a shell command, turns a backslash-u escape
  written in the content into the literal character it names. Where a file must carry escape TEXT (none of E2's files
  should), write it with a script that builds the backslash from `String.fromCharCode(92)` (or Python's `chr(92)`), never
  by typing it. After every file is written, scan all of E2's files for invisible characters — controls other than tab
  and line feed, format characters, and any space separator that is not U+0020:

  ```bash
  node -e 'const fs=require("fs");let bad=0;for(const f of process.argv.slice(1))fs.readFileSync(f,"utf8").split("\n").forEach((l,i)=>{const s=l.replace(/\t/g,"");if(/[\p{Cc}\p{Cf}]/u.test(s)||/(?! )\p{Zs}/u.test(s)){console.log(`${f}:${i+1}`);bad++}});process.exit(bad?1:0)' \
    common/plan-change-control.md common/planning-docs.md tools/rules.test.mjs tools/plan-change-rule.test.mjs \
    research/module_rules.md research/module_tests.md README.md .github/workflows/ci.yml \
    todo/PLAN_plan_change_control.md todo/PLAN_plan_change_control_E2.md
  ```

  The ledger's ` · ` (U+00B7) and ` — ` (U+2014) are visible punctuation and are meant; A1 fails if either is a look-alike.
- **Ownership.** Run `node tools/ownership-check.mjs` after every edit to the rule: an undeclared `mcp__coai__*` name,
  a product name, or `the gate` / `its panel` in prose (fenced text included) fails CI.
- **Links.** A file in `todo/` or `research/` may link only to files that exist when `plan-lifecycle` runs; this document
  names the rule and the new test as code, not links, for that reason.
- **One commit.** Stage by path (`git add` each file by name), read `git diff --staged --stat`, commit with a
  conventional message (`feat(rules): plan change control — the rule, its pointers, tests and documents (E2)`) and the
  session's attribution trailer.
