# PLAN — Plan change control, E1: the ledger contract and its safe enforcement

> Status: **plan only, nothing implemented yet, 2026-10-28.** Scope: the stories of epic E1 — the change-ledger parser
> `tools/lib/plan-ledger.mjs`, its wiring in `tools/plan-lifecycle.mjs`, their tests, the compatibility fixtures, the
> dry run over the estate and S6b.
>
> Stories of epic E1 of [PLAN_plan_change_control.md](PLAN_plan_change_control.md) (§ *Epics*, E1). Split by Opus on
> 2026-10-28; models per story below. This document keeps no change ledger of its own: a change to E1's approved work
> is recorded in the parent (parent §3, finding 9).

Done when (from the parent): every test was watched failing first; every row of the parent's findings table (§3) has a
red case naming the file and the entry; the clean cases of the parent's test plan pass; the five commands are green; the
dry run added zero `changes` findings; `review_code` on this branch passed the parent plan as `planText` (S6b, recorded
in the parent); the Opus review and the code round are resolved; ONE commit on `feat/plan-change-control-e1`.

The five commands, from the worktree root (`npm test` does not run the family checks, `research/module_tests.md:989`):

```bash
npm test
npm run check
node tools/ownership-check.mjs
node tools/rule-bodies.mjs
node tools/plan-lifecycle.mjs
```

## Order

E1.S1 (Fable's spec) → E1.S2 RED, every new test watched failing for the right reason → E1.S3 GREEN → the
RED-GREEN-RED check (revert the line the behaviour depends on, see the test fail, restore — list in E1.S3) → E1.S4 (the
dry run, the header comments, S6b with the Opus review). **ONE commit for the whole epic**; review fixes are folded into
it. E1 opens no pull request (parent S10).

The gates of the parent's *Branches and gates* paragraph frame this order: `open` on this branch and `review_plan` with
`plan: "todo/PLAN_plan_change_control.md"` and `epic: "1/2"` before code; `review_code` over the epic's whole diff at the
end (that call is S6b).

## E1.S1 — The ledger grammar and its state machine, as the parser accepts them — **cornerstone (1 of 1)**

`model: fable`

- **Models.** Scenarios and brief by **Fable**. S1 makes no code of its own: its scenarios become test cases in E1.S2,
  and its brief governs the parser core in E1.S3. Code by Sonnet (in S2 and S3), review by Opus, as for every story.
  Where Fable's text and the S2/S3 text below disagree, Fable's wins; the Opus caller aligns S2 and S3 in this file
  before S2 starts.
- **Goal.** Fix, once, which text is a ledger and which is not, and how a ledger moves from state to state. Once plans
  in six repositories carry records, a change to what these lines mean is a migration of every one of them (parent,
  *Cornerstone area*).
- **Scope.** The epoch line, the entry line and the re-review record of the parent's §2; the transitions open →
  stopped → closed; the reset to epoch k+1 at 0 changes; the renumbering after a merge of two branches' entries;
  `Narrowed: yes` → `by owner`; the acceptance scenarios that fix which text is a ledger and which is not. The schema
  itself is decided (§2) and is not reopened here.
- **The five decisions S1 must take**, each with at least one scenario (parent, E1 *Scope* 1-5):
  1. **Fences.** `outsideFencedBlocks` (`tools/lib/rule-body.mjs:29`) strips only column-0 triple-backtick fences,
     non-greedy: no `~~~`, no indented fence, and a four-backtick fence that holds a triple-backtick line closes early.
     State the fence interpretation the parser uses. A widened shared helper also moves `sectionsOf` (`:55`), whose
     headings are recorded in `research/rule-bodies.json`; a new export leaves it alone. Decide: a new export, or the
     widening plus a `node tools/rule-bodies.mjs` verification. Both fence kinds are tested either way.
  2. **Tolerance.** The format uses `·` (U+00B7) and `—` (U+2014). Decide whether `|`, `--` and the en dash `–` are
     accepted or refused. Either way the finding names the character that was expected, so the message corrects the
     writer.
  3. **A stopped plan and `checkStatuses`.** A status paragraph that says `stopped for re-review` and also "all … done"
     must not become a `misfiled` finding (`TOTALITY_VERDICT`, `tools/plan-lifecycle.mjs:66`). Decide how, and where
     the stop regex lives (one source for both checks).
  4. **A caught throw is still a red CI.** The finding replaces the crash, not the red. State the finding's text and
     confirm the protection against a false red is the dry run (E1.S4), not a softer exit code.
  5. **What the check cannot see**, for the lib's header (written in E1.S4): a plan with no ledger, a change nobody
     recorded, code written during a stop. A stopped plan is clean by design (plan round 1, finding 0 rejected); the
     halt is the rule's.
- **The grammar edges §2 leaves open**, for Fable's scenarios to settle: a line in the section that is none of blank,
  `> Epoch …`, a column-0 list line, an indented line, `### Re-review for epoch <k>`, `Narrowed: …` or a table row (a
  paragraph, a `> note`); where the entries of epoch k may stand (only after epoch k's line?); an entry dated before its
  epoch's approval; what ends the section (the next `## ` heading, or also `# `); trailing spaces on the heading.

#### Scenarios and brief — Fable

Written by Fable on 2026-10-28, from the parent's §2 and §3, `tools/lib/rule-body.mjs`, `tools/plan-lifecycle.mjs`
and a survey of the estate. The §2 schema is not changed: everything below is either a decision the parent left to this
story, or a reading of §3 — the readings are listed by name in *Readings of §3* so the Opus caller can object to one
without reopening the rest. **No change to §2 is proposed.** Where this text and E1.S2/E1.S3 disagree, this text wins;
S2 and S3 below were aligned to it in this file on the same day.

##### The five decisions

**1. Fences — widen `outsideFencedBlocks` to CommonMark's fence rules; one road, verified.**

- *Decision.* `tools/lib/rule-body.mjs` keeps ONE fence definition and it becomes the right one: a fence opens on a
  line of 0–3 spaces then three or more backticks or three or more tildes (a backtick opener's info string may not
  hold a backtick); it closes on a line of 0–3 spaces then the SAME character, at least as many of them, and nothing
  else but trailing whitespace; an unclosed fence runs to the end of the text; a fence of one character is not closed
  by the other. Every line of a fence — opener, content, closer — becomes an EMPTY line, so what is left keeps the
  file's line numbers (a finding can say *line 90*). No new export; `sectionsOf` and `outsideFences` read the widened
  helper as they are. The lib imports `folded` and `outsideFencedBlocks` only (parent §3, unchanged).
- *Why.* `common/reuse-first.md` § *A decision applied at SOME of its sites*: a second fence definition beside the
  first is that defect by construction — `sectionsOf` would say a line is a heading while the ledger parser says it is
  inside a fence. Measured 2026-10-28 (a scratch script over the 38 rule files, old helper against the CommonMark one):
  **0 of 38** recorded heading lists change, so the widening costs nothing recorded. Measured the same day over the
  `todo/` and `research/` folders of this checkout, the six siblings and `wsl_care`: 2 214 column-0 ``` lines, **213
  indented** fence lines (one or two spaces), **3 four-backtick** fences, 0 `~~~`. The indented and four-backtick
  shapes exist in plan files today; a renderer hides their content, and a check that reads it would be a false red
  — the one thing that switches a check off. And the current regex LEAKS: measured on this Node, a four-backtick fence
  holding a ``` line leaves the lines after that inner line visible plus a stray backtick (`"a\n\nx\n\`\nz"`), and an
  unclosed fence leaves everything visible.
- *The verification is part of the story* (E1.S3, step 0, and the dry run of E1.S4): `node tools/rule-bodies.mjs`
  must print in step with NO `--update` in this epic, `node tools/ownership-check.mjs` must pass, `npm test` must pass
  (`tools/rules.test.mjs:171` compares `sectionsOf` with `research/rule-bodies.json`). A drifted body here means the
  widening moved a recorded heading, which is a stop, not a re-record.
- *Tests* — F1–F8 below, through `ledgerFindings` and directly on `outsideFencedBlocks`/`sectionsOf`.

**2. Tolerance — `·` (U+00B7) and `—` (U+2014) only; everything else is refused by a message that names them.**

- *Decision.* An entry is `- k.n · date · source · kinds — cause` and an epoch line is `> Epoch k · approved date ·
  by approver · state: s`, with the middle dot and the em dash. `|`, `-`, `--`, `–` (U+2013), `•` (U+2022) and a bare
  `—` with no space around it are refused. What IS tolerated: a run of spaces or tabs counts as one space, trailing
  whitespace is ignored, and a comma in the kinds field may be followed by spaces. Every refusal quotes the line and
  names the expected character with its code point: *fields are separated by " · " (U+00B7) and the cause follows " — "
  (U+2014)*.
- *Why.* A false red can only come from a plan that opted in (the heading exists), so the writer is already writing
  THIS format, and a message that names the character is a one-minute fix. Accepting `|` would make a second spelling
  of the format in six repositories: the rule text (E2) would have to describe both, and the next tool that reads a
  ledger (a promote script, a renumbering helper) would have to parse both — the drift the parent's decision 10 exists
  to prevent. Undercounting is impossible under refusal: a line that starts `- ` and does not parse is finding 4, red,
  never dropped. So refusal has zero silent failures and one loud one with the fix in it; acceptance has a permanent
  second grammar.
- *Tests* — T1–T6 below; S2 row 4d is fixed to *refused*.

**3. The stop phrase lives in the lib; `isFullyDone` consults it for the totality verdict only.**

- *Decision.* `tools/lib/plan-ledger.mjs` exports `STOP_PHRASE = /\bstopped for re-review\b/i`. The lib uses it for
  finding 2. `tools/plan-lifecycle.mjs` imports it and changes ONE function:

  ```js
  const isFullyDone = (status) =>
    PROMOTED_VERDICT.test(status)
    || (TOTALITY_VERDICT.test(status) && !STOP_PHRASE.test(status))
    || SELF_REPORTED_MISFILING.some((m) => status.includes(m));
  ```

  A stopped plan may say what is done ("all four stories of E1 are done; E2 has not started") — that is the totality
  verdict's false positive and the stop phrase lifts it. It does NOT lift the promoted form (`**implemented**`) or a
  self-reported misfiling ("belongs in `research/`"): a plan that says those asks to be moved, and a stop does not
  change where it belongs.
- *Why there.* One source for both checks (parent §1.6 step 1 names the phrase; finding 2 tests it; `checkStatuses`
  must agree with it). The lib owns the grammar, so the constant is the lib's; `plan-lifecycle.mjs` already imports
  the lib. The exemption is in `isFullyDone`, the one function that decides "finished", not in `checkStatuses`'s
  branch, so the two folders' verdicts cannot drift.
- *Tests* — W6 (exempt), W6b (the totality check still works without the phrase), W6c (new: the phrase does not exempt
  a self-reported misfiling). The W9 stub must export `STOP_PHRASE` too.

**4. A caught throw is still a red CI — per file, the whole unit body, one message, no stack.**

- *Decision.* The `try` wraps the WHOLE per-file body in `checkChangeLedgers` — `parentPlanOf`, `readFileSync`,
  `statusParagraph`, `ledgerFindings` — `common/reliability.md` § *Where `try/catch` lives*, boundaries 1 (per
  independent unit: one plan file) and 2 (setup included: the read IS the unit). The catch pushes exactly one finding:

  ```text
  changes   todo/PLAN_x.md — the ledger could not be read (stub: the parser threw); red until the file or the check is fixed
  ```

  `error?.message ?? error`, never `error.stack`. The exit code is 1 like any finding. No softer exit code, no
  warning class: the protection against a false red is E1.S4's dry run over the estate (zero `changes` lines in every
  diff), and a throw that the dry run did not see is a defect of the check, reported by the message that names the
  file.
- *Not added in E1:* an outermost catch-all around `main()` (boundary 3). A throw in `checkLinks` or the index checks
  crashes today and still will; it is outside the approved plan and is named here for a later one.
- *The W9 seam, confirmed 2026-10-28 on Node 26.12.1* with a two-file model of the same import: `--import` of a
  `data:` module that calls `module.registerHooks` with a `resolve` hook returning `{ url, shortCircuit: true }` for
  any specifier ending in `/plan-ledger.mjs` swaps the lib; the throw is caught; exit 1. CI runs `node-version: 22`
  (`.github/workflows/ci.yml:28`), which resolves to the latest 22.x, and `module.registerHooks` exists from 22.15 —
  so W9 RUNS in CI. The skip with a reason is for a local Node 20.x–22.14 only (`engines` says `>=20`). The stub must
  export every name `plan-lifecycle.mjs` imports: `ledgerFindings`, `parentPlanOf`, `STOP_PHRASE`.
- *Tests* — W9 as in S2, with the stub extended; the RED-GREEN-RED row *let the throw through* in S3.

**5. What the check cannot see — the lib's header paragraph (pasted in E1.S4):**

> This check reads the ledger as it stands in the checkout — never git history, never the diff. It cannot see: a
> plan with no `## Plan changes` heading (opt-in by presence — a plan that never opened its ledger is invisible here;
> the rule's Definition of Done and the code review own it); a change nobody recorded (every entry is a line in a
> reviewed diff, and an unrecorded change leaves no line); code written during a stop (a stopped plan is CLEAN by
> design — plan round 1, finding 0, rejected — because a red while stopped would block the stop commit, the
> re-review and its reverts; the halt is the rule's, `common/plan-change-control.md`, and the review server's when it
> refuses `review_code` until the new `proceed`); an entry dated before its epoch, or entries dated out of order (the
> check judges structure and count, not when); where the section stands in the file (the rule says under the status
> block; the check reads it anywhere). What it does see is exactly the grammar below, and every line it cannot read
> is a red, never a skip: an entry that fails to parse would otherwise lower the count in silence.

##### Grammar — the ledger as the parser accepts it

Precedence: `folded` first (CRLF = LF), then `outsideFencedBlocks` (decision 1; fenced lines are empty lines), then
the file is split on `\n`. Every regex below is applied to a line after `trimEnd()` and after a run of spaces or tabs
is folded to ONE space — EXCEPT the free-text test, which reads the original line. Messages quote the original line.
`·` is U+00B7 and `—` is U+2014 throughout.

The exported constants, the only lists (tests iterate them, never a retyped copy — `common/testing.md` § *A test
that repeats a list*). One test pins each to the parent's §2, deliberately: they are the contract.

```js
export const SOURCES   = ["owner", "agent", "reviewer"];
export const KINDS     = ["scope", "goals", "dod", "merge-conditions", "epics", "stories", "build-order", "contract", "approach"];
export const STATES    = ["open", "stopped", "closed"];
export const APPROVERS = ["reviewers", "owner"];
export const VERDICTS  = ["fits", "cut", "—"];
export const STOP_PHRASE = /\bstopped for re-review\b/i;
```

The regexes that carry a list are BUILT from the constant (`STATES.join("|")`), so there is one list per word.

| Line kind | Where | Regex / rule |
|---|---|---|
| ledger heading | anywhere at column 0, outside fences | `/^## Plan changes$/` — exact case |
| near-miss heading | same | `/^## plan changes$/i` and not the exact one → finding 3 *not a ledger heading; it must read exactly `## Plan changes`* (a ledger under a mis-cased heading would otherwise be invisible) |
| section end | after the heading | the first line matching `/^#{1,2} /` (a `# ` or `## ` heading), or the end of the file; `### …` lines are INSIDE |
| blank | in the section | `/^\s*$/` → skipped |
| free text | in the section | the ORIGINAL line starts with a space or a tab (any indent ≥ 1) → skipped, whatever it holds: an indented `- `, `>`, `\|` or `#` is free text |
| epoch line | column 0, starts with `>` | `` /^> Epoch ([1-9]\d*) · approved (\d{4}-\d{2}-\d{2}) · by (reviewers\|owner) · state: (open\|stopped\|closed)$/ `` built from `APPROVERS` and `STATES`; the date must be a calendar date (`Date.UTC` round-trip: `2026-02-30` is not); ANY other `>` line in the section is finding 3 *unreadable epoch line* |
| entry | column 0, matches `/^(?:[-*+]\|\d+[.)]) /` (a list line) | must start `- `; the rest splits on the FIRST ` — ` into head and cause; head splits on ` · ` into exactly 4 fields: number `/^([1-9]\d*)\.([1-9]\d*)$/`, calendar date, source ∈ `SOURCES`, kinds = comma-separated (spaces after a comma allowed), each ∈ `KINDS`, at least one; cause non-empty. Any failure is finding 4 *unreadable entry* with the detail (table below); the entry is then NOT counted — the red keeps the count honest |
| re-review heading | column 0, starts with `###` | `/^### Re-review for epoch ([1-9]\d*)$/`; any other `###`/`####` line → finding 7 *unreadable re-review heading* |
| Narrowed line | inside a record, column 0 | detected by `/^narrowed:/i`; must match `/^Narrowed: (yes\|no)(?: — .*)?$/` else finding 7; outside a record → *unreadable line* |
| table row | inside a record, column 0, starts with `\|` | strip one leading and one trailing `\|`, split on `\|`, trim cells; a row whose cells all match `/^:?-+:?$/` is the separator (skipped); the FIRST row is the header and must read `Work`, `Where`, `Verdict`, `Action`; every other row has exactly 4 cells and its third cell ∈ `VERDICTS`; outside a record → *unreadable line* |
| anything else | column 0 | finding 4 *unreadable line* — a paragraph, a `---` rule, a `\|` or `Narrowed:` outside a record, a list marker other than `- `, an entry that lost its `- ` (which is exactly the undercount the row exists for) |

Keywords are case-sensitive (`Epoch`, `approved`, `by`, `state:`, `Re-review`, `Narrowed:`, and every value): `Owner`
is *unknown source "Owner"* and the message lists the legal values, so the writer sees the case. Dates are ISO
`YYYY-MM-DD` and real calendar dates; nothing else. An entry's date is not compared with anything (decision 5); only
epoch dates are ordered (row 6).

**Structure.** The walk is top to bottom. An epoch line opens a BLOCK; entries belong to the block they stand in; a
re-review heading opens a RECORD that runs to the next epoch line, the next record heading or the section end;
`Narrowed` and table rows belong to the open record. An entry before the first epoch line is finding 3 (*stands before
the first epoch line*); a section with no epoch line at all is finding 3 *no epoch line*. Two ledger headings (exact
or near-miss, counted together) is finding 3 *two `## Plan changes` headings (lines a and b)*, and the parse stops.

##### The state machine

An epoch is `open` → `stopped` → `closed`. Nothing goes back, and `closed` is reached only by the next epoch line.

| Shape of a clean ledger | Checked by |
|---|---|
| epoch lines read 1, 2, …, m in text order (m ≥ 1); the LAST line is the current epoch | row 6 — *epochs not 1, 2, 3 … in order (found 1, 3)*; `Epoch 0` and a repeated k fall here |
| every epoch below the current is `closed`; the current is `open` or `stopped` | row 6 — *epoch 1 is not closed (state: open)*; *epoch 2 is the current epoch and reads closed; the current epoch is open or stopped* |
| epoch k's date ≥ epoch k−1's date (equal is fine: a same-day re-review) | row 6 — *epoch 2's date goes back: approved 2026-10-20, before epoch 1's 2026-10-21* |
| in each block, the entries are k.1, k.2, … k.n in order, k = the block's epoch | row 5 — `k` above the current: *entry 2.1 is above the current epoch 1*; `k` of another block: *entry 1.3 stands under epoch 2's line; an entry stands under its own epoch line*; a repeat: *entry 1.1 twice: two branches each recorded a change — renumber; the merge is the stop*; else not 1..n: *epoch 1's entries are numbered 1.1, 1.3; they must be 1..n in order* |
| the current epoch has < 2 entries, or is `stopped` | row 1 — *epoch 1 has 2 changes and is not stopped; stop for a whole re-review (entries 1.1, 1.2)* |
| a `stopped` current epoch has the status phrase | row 2 — *epoch 1 is stopped, but the status paragraph does not say "stopped for re-review"; the stop must be visible where a reader looks first* |
| every epoch k ≥ 2 has exactly ONE record `### Re-review for epoch k`, standing after epoch k−1's line and before epoch k's | row 7 — *no re-review for epoch 2: a `### Re-review for epoch 2` record must stand before its epoch line; the re-review must leave a record*; *re-review for epoch 2 stands after epoch 2's line; the record comes before the epoch line it opens*; *two re-review records for epoch 2*; *re-review for epoch 1; epoch 1 is the first approval and has no re-review* |
| **the re-review in progress:** a record for m+1 with NO epoch m+1 line is legal only while epoch m is `stopped` (parent §1.6 steps 5–8: the record is written during the stop, the epoch line at resume) | row 7 — *re-review for epoch 2 while epoch 1 is open; the stop comes first*; *re-review for epoch 4, but the next epoch is 3* |
| every record has one `Narrowed: yes\|no` line and one table with the exact header and ≥ 1 body row of 4 cells, verdicts ∈ `VERDICTS` | row 7 — *re-review for epoch 2: no `Narrowed: yes\|no` line*; *… Narrowed must be yes or no, not "maybe"*; *… no table; the record is a `\| Work \| Where \| Verdict \| Action \|` table*; *… the table header must read …*; *… the table has no rows; at least one row (verdict — when nothing was built)*; *… row 3 has 3 cells, not 4*; *… verdict "partly" in row 2; a verdict is fits, cut or —* |
| `Narrowed: yes` for epoch k ⇒ epoch k's line says `by owner` | row 8 — *epoch 2 is narrowed (Narrowed: yes) and approved by reviewers; a smaller plan needs the owner (by owner)* |
| a stories document (`parentPlanOf(file) !== null`) with a ledger and `parentInTodo` | row 9 — *a stories document carries a ledger; its changes count in the parent, todo/PLAN_x.md* — added beside whatever else the ledger yields |

The count is derived: the number of entries that PARSED in the current block. An entry that did not parse is a row-4
finding; the run is red, so a lower count never passes. Order of work in `ledgerFindings`: parse (findings in line
order) → if a row-3 finding was pushed (unreadable epoch line, no epoch line, two headings, an entry before the first
epoch line) return; row 6 (sequence first: if the sequence is not 1..m, return after row 6) → row 5 → row 1 → row 2
→ row 7 → row 8 → row 9. Every message is `${file} — …`. A transition between two commits, for the record: `open`
+ second entry → the same commit writes `state: stopped` and the status phrase (rows 1 and 2 together say so);
`stopped` + record for k+1 → still clean (in progress); the resume commit writes epoch k+1's line `open` and turns k
to `closed` (row 6 says k must be closed once k+1 exists).

##### Readings of §3 (not changes — say so if you disagree)

1. Row 4 reads *a column-0 line in the section that does not parse as an entry* as **any** column-0 line that is not
   a line kind of the grammar — a paragraph is red, not free text, because an entry that lost its `- ` IS a paragraph
   and would undercount in silence. Free text is indented, as §3 says.
2. Row 3 covers the near-miss heading and an entry before the first epoch line (both "a heading with no epoch line"
   in effect).
3. Row 6 covers a `closed` current epoch (the states of the sequence, not only the lower ones).
4. Row 7 covers the record in progress, a record for epoch 1, a duplicate record, a record too far ahead, and the
   exact table header (so "the verdict is the third cell" is a fact and not a guess).
5. Row 2's exemption is the totality verdict only (decision 3).
6. Not red, by choice: an entry dated before its epoch's approval; entries dated out of order; a repeated kind in one
   entry; a `Narrowed: no` epoch approved `by owner`; the section's position in the file.

##### Scenarios

Fixtures are S2's (`plan`, `run`, `STOPPED`, A, A2, B, P) plus:

- **A2s** — A2 with `state: stopped` (status `STOPPED` unless said otherwise).
- **R** — the re-review in progress: A2s, a blank line, then B's record block (`### Re-review for epoch 2`,
  `Narrowed: no`, the table) and NO epoch 2 line.

Each red case has its positive twin in the same row (the fixture that differs by one step and is clean, or the
reverse). *Expect* names the substring the test asserts; the full messages are in the tables above.

**Fences** (`tools/plan-ledger.test.mjs`; the first five through `ledgerFindings` with A2 open as the payload):

| # | Input | Expect | Twin |
|---|---|---|---|
| F1 | A2 only inside a column-0 ``` fence (the fence built with `` "`".repeat(3) ``) | `[]` | the same lines unfenced → row 1 |
| F2 | A2 only inside a `~~~` fence | `[]` | unfenced → row 1 |
| F3 | A2 only inside a fence whose markers are indented one, two and three spaces (three cases) | `[]` | the markers indented FOUR spaces are not a fence (they are free text), so A2's column-0 lines between them are live → row 1 |
| F4 | P: a four-backtick `markdown` fence holding B with its own `## Plan changes` heading and ``` lines inside | `[]` (one ledger, the live one) | the four-backtick markers replaced by three → the inner ``` lines close early and the inner heading leaks → row 3 *two* (this is C9) |
| F5 | A2 (open) under the heading, then an UNCLOSED ``` fence opened before a second heading with B | row 1 ONLY: A2 is live, and the second heading is inside the fence to the end of the file, so no *two* | the fence closed before the second heading → row 3 *two* |
| F6 | direct: `outsideFencedBlocks("a\n~~~\nb\n```\nc\n~~~\nd")` | `"a\n\n\n\n\n\nd"` — a ``` line does not close a `~~~` fence; line count kept | `outsideFencedBlocks("a\n```\nb\n```\nc")` → `"a\n\n\n\nc"` |
| F7 | direct: a ```` fence holding a ``` line, closed by ````; and a ``` fence closed by ````` (longer closer closes) | both stripped whole | a ```` fence "closed" by ``` → not closed, runs to the end |
| F8 | direct: `sectionsOf("~~~\n# not a heading\n~~~\n## real")` and the same with a two-space-indented ``` fence | `["## real"]` | `sectionsOf("## a\n\n## b")` → both |

**Tolerance** (`tools/plan-ledger.test.mjs`, each on A's entry; expect row 4 *unreadable entry* plus the detail):

| # | Input | Expect |
|---|---|---|
| T1 | `- 1.1 \| 2026-10-26 \| owner \| epics -- x` | `unreadable entry`, `·`, `U+00B7`, `—`, `U+2014`, and `found 1` (fields) |
| T2 | `- 1.1 – 2026-10-26 – owner – epics — x` (en dashes) | `found 1`, names `·` |
| T3 | `- 1.1 · 2026-10-26 · owner · epics - x` and `… epics -- x` and `… epics—x` (no spaces) | `no cause: the cause follows " — " (U+2014)` |
| T4 | `-  1.1  ·  2026-10-26 ·\towner · epics  —  x` (runs of spaces and a tab) and `- 1.1 · 2026-10-26 · owner · scope,dod — x` and `… scope ,  dod — x` | `[]` — runs fold to one space; spaces around the comma are free |
| T5 | `- 1.1 · 2026-10-26 · Owner · epics — x` | `unknown source "Owner"` and the list `owner, agent, reviewer` (joined from `SOURCES`) |
| T6 | `- 1.1 · 2026-02-30 · owner · epics — x` and `- 1.1 · 26-10-26 · owner · epics — x` | `not a calendar date` / `unreadable entry`; twin: `2026-02-28` → `[]` |

**Grammar edges** (`tools/plan-ledger.test.mjs`):

| # | Input | Expect | Twin |
|---|---|---|---|
| G1 | A2s, then `## Goal` as the next heading; the same with `# Part two` as the next heading; the same with `### Notes` BEFORE `## Goal` holding a column-0 paragraph | first two `[]`; third → row 7 *unreadable re-review heading* (a `###` inside the section is a record heading) and row 4 *unreadable line* for the paragraph | — |
| G2 | the heading `## Plan changes   ` (trailing spaces) and the epoch line with trailing spaces and a trailing tab, with A | `[]` | `## Plan changes (epoch 1)` is no heading → `[]` with no ledger seen — and `## Plan Changes` → row 3 *must read exactly* |
| G3 | the heading with nothing under it before `## Goal`; the heading with only blank and indented lines | row 3 `no epoch line` | — |
| G4 | A's entry ABOVE the epoch line | row 3 `stands before the first epoch line` | — |
| G5 | `> Epoch 0 · …` | row 3 `unreadable epoch line` (the regex wants `[1-9]`) | — |
| G6 | B with both epoch lines numbered 1 (and the record for epoch 1) | row 6 `epochs not 1, 2, 3` (found 1, 1) | — |
| G7 | B with epoch 1 `state: stopped` | row 6 `epoch 1 is not closed` | — |
| G8 | A2 with `state: closed` (no epoch 2) | row 6 `is the current epoch and reads closed` | — |
| G9 | B with epoch 2 approved `2026-10-21` (equal to epoch 1's) | `[]` | `2026-10-20` → row 6 (6c) |
| G10 | **R**, status `STOPPED` | `[]` — the re-review in progress | R with epoch 1 `state: open` → row 7 `while epoch 1 is open; the stop comes first`; R with the record named `epoch 3` → row 7 `the next epoch is 3` |
| G11 | B with a second `### Re-review for epoch 2` block | row 7 `two re-review records` | — |
| G12 | A with `### Re-review for epoch 1` + a valid record before the epoch line | row 7 `epoch 1 is the first approval` | — |
| G13 | B with the table's header `\| Item \| Where \| Verdict \| Action \|`; B with a body row of three cells | row 7 `header must read` / `has 3 cells` | — |
| G14 | B with the table before the `Narrowed` line | `[]` (order inside a record is free) | — |
| G15 | B with `Narrowed: no — nothing left` and `Narrowed: no` plain; with `narrowed: no` | first two `[]`; the third → row 7 `Narrowed` | — |
| G16 | B with a body row verdict `Fits` | row 7 `verdict "Fits"` | each of `VERDICTS` in turn → `[]` |
| G17 | A2s plus, at column 0: a paragraph `Consulted: 7bdf3086`; a `---` line; a `\| x \| y \| fits \| z \|` row outside a record; `Narrowed: no` outside a record | row 4 `unreadable line` naming the line, four cases | each of the four indented by two spaces → `[]` |
| G18 | B with its entry `1.2` moved below epoch 2's line | row 5 `entry 1.2 stands under epoch 2's line` | — |
| G19 | A with `- 1.1 · … · owner · epics, epics — x` | `[]` (a repeated kind is harmless) | `epics, wording` → row 4 `unknown kind "wording"` |
| G20 | A2s with entry 1.1 dated `2026-10-30` after 1.2's `2026-10-26`; A with 1.1 dated before the epoch's approval | `[]` (decision 5: dates are recorded, not judged) | — |
| G21 | for each of `STATES`: epoch 1 with that state and one entry, status `STOPPED` | `open`, `stopped` → `[]`; `closed` → row 6 (G8) — iterated from the constant, with the one exception named in the test | — |
| G22 | for each of `APPROVERS`: epoch 1 `by <a>` with A | `[]` | — |
| G23 | every fixture of this subsection with `\r\n` line ends | `deepEqual` the same findings (C12's rule) | — |

**The stop and the wiring** (`tools/plan-lifecycle.test.mjs`): W6, W6b, W6c, W9 as in S2 (fixed there).

##### The brief for the parser core (for the Sonnet coder of E1.S3)

1. `tools/lib/rule-body.mjs`: replace the one-line regex of `outsideFencedBlocks` with a line walk implementing
   decision 1 (opener `/^ {0,3}(`{3,}|~{3,})(.*)$/`, a backtick opener refused when its info string holds a backtick;
   closer `/^ {0,3}(`{3,}|~{3,})[ \t]*$/` with the same character and length ≥ the opener's; unclosed runs to the end;
   every fenced line → `""`). Keep the header comment's promise (dependency-free: the ownership check runs before `npm
   ci`). Then run `node tools/rule-bodies.mjs`, `node tools/ownership-check.mjs`, `npm test` BEFORE touching the lib:
   all three green with nothing recorded moved, or stop.
2. `tools/lib/plan-ledger.mjs`: the constants above (frozen arrays); the regexes built from them; `ledgerFindings` as
   the walk of *Grammar* + the checks of *The state machine* in the order given; `parentPlanOf` as S3 brief 6. Shape:
   `sectionOf(lines)` → `{ start, end }` or the heading findings; `classify(raw)` → one of the line kinds; `parseEntry`
   returning `{ entry }` or `{ detail }`; then one function per row that reads the parsed model and pushes messages.
   Keep the model plain data (`epochs: [{ k, date, approver, state, line, entries: [] }]`, `records: [{ k, line,
   narrowed, table }]`) so a test can read what the parser saw if a message is wrong.
3. Every message starts with `${file} — ` and carries the substring S2 asserts (the *Expect* columns); the detail of
   an unreadable entry comes after the quoted line: `unreadable entry "<line>" — <detail>`. The detail set: *entries
   start with "- "*; *expected 4 fields separated by " · " (U+00B7) before " — " (U+2014): <k>.<n> · <YYYY-MM-DD> ·
   owner|agent|reviewer · <kinds>; found N*; *no cause: the cause follows " — " (U+2014)*; *number "x" is not <k>.<n>*;
   *date "x" is not a calendar date YYYY-MM-DD*; *unknown source "x" (owner, agent, reviewer)*; *unknown kind "x"
   (scope, goals, …)* — the lists joined from the constants; *empty cause*.
4. The calendar check: `s` must first match `/^\d{4}-\d{2}-\d{2}$/` (E1 plan round, finding 3), then
   `const d = new Date(\`${s}T00:00:00Z\`); return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);`.
   (Cadence consultation, verified 2026-10-28 on Node 26: `Number.isNaN(new Date("2026-13-01T00:00:00Z"))` is
   `false` — a Date is not NaN — and `toISOString()` then throws `RangeError`. Cases: `2026-13-01` and `2026-01-00`
   in an entry and in an epoch line give the date finding, never "could not be read".)
5. Nothing in the lib reads the file system, the clock or the environment; nothing throws on any string input — a
   throw is W9's case and a defect. The tests of this subsection are the acceptance tests; S2's tables are the rest.

- **Done when.** This subsection stands; S2 and S3 were aligned to it in this file (4d, C8 → F1–F5, C11b, the stub's
  exports, W6c, W9's stub, S3 steps 0 and 1, the RED-GREEN-RED rows); `node tools/plan-lifecycle.mjs` in the worktree
  prints `clean` (the parent's live ledger parses under this grammar: one epoch, one entry with indented free text).

## E1.S2 — RED: the pure parser tests and the spawned wiring tests

- **Models.** Scenarios and brief by Opus (this section, aligned with S1); code by a **Sonnet** coder; review by Opus;
  fixes by Sonnet.
- **Goal.** Every row of the parent's findings table, every clean case of its test plan and every S1 scenario exists as
  a test, and every new test that asserts a finding or an exit code is watched failing for the right reason before
  E1.S3.
- **Files.**
  - `tools/plan-ledger.test.mjs` — **new, pure**: it imports the lib and calls functions on strings. It writes no file,
    makes no folder and spawns nothing, so `common/test-leftovers.md` asks nothing of it (no `ownedDir`, no temp path:
    the guard's `raw-temp` class would refuse `mkdtemp`/`tmpdir()` here, and nothing needs one).
  - `tools/plan-lifecycle.test.mjs` — **extended, spawned**. Every fixture folder comes from
    `ownedDir(t, "plan-lifecycle ")` with that literal, trailing space included: `tools/leftovers-check.test.mjs:524`
    pins it by regex. The existing test stays unchanged.
  - `tools/lib/plan-ledger.mjs` — **new, a stub only** in this story, so the RED is an assertion failure and not
    "Cannot find module" (a setup error proves nothing, `common/testing.md`): it exports `ledgerFindings` returning
    `[]`, `parentPlanOf` returning `null`, and the real constants of S1 — `KINDS`, `SOURCES`, `STATES`, `APPROVERS`,
    `VERDICTS`, `STOP_PHRASE` (data, not behaviour).
- **The lib's interface** (parent §3; S3 fills it):
  - `ledgerFindings({ file, text, status, parentInTodo })` → `string[]`. `file` is root-relative (`todo/PLAN_x.md`);
    `text` is the whole file; `status` is the status paragraph as `statusParagraph` returns it (lower-cased — the lib
    matches case-insensitively, and the pure tests pass mixed case); `parentInTodo` is true when the file is a stories
    document whose parent plan is in `todo/`. Every message starts with `file`; the class prefix is added by
    `plan-lifecycle.mjs`.
  - `parentPlanOf(name)` → `PLAN_<topic>.md` for `PLAN_<topic>_E<n>.md` or `PLAN_<topic>_E<n>_<more>.md`, else
    `null`.
  - `KINDS` = `scope`, `goals`, `dod`, `merge-conditions`, `epics`, `stories`, `build-order`, `contract`, `approach`;
    `SOURCES` = `owner`, `agent`, `reviewer`; `STATES` = `open`, `stopped`, `closed`; `APPROVERS` = `reviewers`,
    `owner`; `VERDICTS` = `fits`, `cut`, `—`; `STOP_PHRASE` = `/\bstopped for re-review\b/i` (S1, *Grammar*).

### The fixtures

The pure tests wrap ledger lines in a plan with one helper, so every case differs from its neighbour only in the
lines that matter:

```js
const plan = (ledger, { status = "> Status: **in progress, 2026-10-28.** Work is open." } = {}) =>
  ["# PLAN — x", "", status, "", "## Plan changes", "", ...ledger, "", "## Goal", "", "Body.", ""].join("\n");
const run = (text, { file = "todo/PLAN_x.md", status = "in progress", parentInTodo = false } = {}) =>
  ledgerFindings({ file, text, status, parentInTodo });
```

`STOPPED` is the status `> Status: **stopped for re-review, 2026-10-28.** Two changes after approval.`

**A** — epoch 1, one entry:

```text
> Epoch 1 · approved 2026-10-21 · by reviewers · state: open

- 1.1 · 2026-10-26 · owner · epics — consumers need the helper as a shipped file; S8 added
```

**A2** — A plus `- 1.2 · 2026-10-26 · reviewer · approach — restore before capture; S3 and S4 rewritten`.

**B** — a closed epoch, its re-review, and the reset:

```text
> Epoch 1 · approved 2026-10-21 · by reviewers · state: closed

- 1.1 · 2026-10-26 · owner · epics — consumers need the helper as a shipped file; S8 added
- 1.2 · 2026-10-26 · reviewer · approach — restore before capture; S3 and S4 rewritten

### Re-review for epoch 2

Narrowed: no

| Work | Where | Verdict | Action |
|---|---|---|---|
| S5a classifier, 2fb413c | main | fits | kept |
| quarantine step, b2df09c | pushed, unmerged | cut | revert commit 1a2b3c4 |

> Epoch 2 · approved 2026-10-28 · by reviewers · state: open

- 2.1 · 2026-10-28 · agent · build-order — E3 needs E2's helper first
```

**P** — the parent plan's own shape (it carries a live ledger, epoch 1, entry 1.1 with indented free text):

```text
> Epoch 1 · approved 2026-10-28 · by reviewers · state: open

- 1.1 · 2026-10-28 · reviewer · merge-conditions — S6a document round, finding 1: the server plan (S7) moves from a
  condition of the merge to a condition of the release, so a blocked review in another repository cannot strand this
  pull request
  (Plan round 1's accepted findings and the split its operator command ordered are part of the approval itself.)
  - an indented dash line is free text too
```

and, under a later `## Design` heading of the same file, B with its own `## Plan changes` heading inside a
` ```markdown ` fence opened and closed at column 0. The test builds the fence with `` "`".repeat(3) ``; this document
cannot show a fence inside a fence.

### Clean cases (`ledgerFindings` returns `[]`)

Each clean case has a twin one step further that is red. A clean result alone could come from a parser that saw
nothing; the twin proves it saw the ledger (`common/testing.md`, *a file full of negative assertions needs one
positive*).

| # | Input | Red twin |
|---|---|---|
| C1 | a plan with no `## Plan changes` heading; also one that names "Plan changes" and `> Epoch 1 · …` only in prose and inline code | — (opt-in by presence) |
| C2 | epoch 1 line of A, no entries | A2 with `state: open` → finding 1 |
| C3 | A | A2 → finding 1 |
| C4 | A2 with `state: stopped`, status `STOPPED` | the same with status `in progress` → finding 2 |
| C5 | the stop phrase as `**Stopped for re-review**`, plain, capitalised, and in mid-paragraph (`… the plan is stopped for re-review since …`) | `stopped for re-reviewing` → finding 2 (`\b` after `review`) |
| C6 | B (epoch 2 at one change: the reset) | B plus `- 2.2 · 2026-10-28 · owner · scope — x` → finding 1 naming epoch 2 |
| C7 | B with `Narrowed: yes — the Windows run left the merge conditions` and epoch 2 `by owner` | the same `by reviewers` → finding 8 |
| C8 | A2 (open) only inside a fence — S1 decision 1 settled the fence rules: the cases are S1's F1–F5 (column-0 ```, `~~~`, indented 1–3 spaces, four-backtick with ``` inside, unclosed) | the same lines unfenced → finding 1 (each F row names its twin) |
| C9 | P with its fenced B | P with the fence markers removed → finding 3 (two headings) |
| C10 | A with three indented lines under 1.1, one starting `(`, one starting `- ` | the `- ` line moved to column 0 → finding 4 |
| C11 | for each of `KINDS` and each of `SOURCES` (iterated from the lib's exports, never retyped), A with that value; and `scope, dod` as two kinds | — |
| C11b | for each of `STATES`, `APPROVERS` and `VERDICTS`, iterated the same way: S1's G21, G22 and G16's twin | G21's `closed` → finding 6 |
| C12 | **CRLF equals LF**: every fixture of this file, clean and red, run with `\r\n` line ends gives `deepEqual` the same findings | — |

One test pins `KINDS`, `SOURCES`, `STATES`, `APPROVERS` and `VERDICTS` to the parent's §2 lists, and `STOP_PHRASE` to
its source. That is deliberate: they are the contract, and changing them is a migration of recorded plans, not a
refactor.

### Red cases — one per row of the parent's findings table

Every message must contain the file (`todo/PLAN_x.md`) and, where the row has one, the entry or epoch. The quoted text
is the substring the test asserts with `assert.match`; S3 writes the full message around it.

| Row | Input | Must contain |
|---|---|---|
| 1 | A2 | `epoch 1 has 2 changes and is not stopped; stop for a whole re-review`, and `1.2` |
| 2 | A2 with `state: stopped`, status `in progress` | `stopped for re-review` (the phrase the status lacks) |
| 3a | A with `state: paused` | `unreadable epoch line` |
| 3b | A with `> Epoch one · approved …` | `unreadable epoch line` |
| 3c | the heading followed by A's entry and no epoch line | `no epoch line` |
| 3d | two unfenced `## Plan changes` headings, each with A | `two` and `## Plan changes` |
| 4a | A with source `bot` | `unknown source "bot"` and `1.1` |
| 4b | A with kind `wording` | `unknown kind "wording"` and `1.1` |
| 4c | A plus the column-0 line `- a note about the plan` | `unreadable entry` and the line's text |
| 4d | A written `- 1.1 \| 2026-10-26 \| owner \| epics -- x` | **refused** (S1 decision 2): `unreadable entry`, `U+00B7`, `U+2014` and `found 1` — S1's T1; T2–T6 are the rest of the tolerance cases |
| 4e | A's entry with `* ` instead of `- ` | `unreadable entry` |
| 5a | A with entry `2.1` in place of `1.1` | `2.1` and `above the current epoch` |
| 5b | entries `1.1` and `1.3` (state `stopped`, status `STOPPED`) | `1.3` and `1..n` |
| 5c | two entries numbered `1.1` | `two branches each recorded a change — renumber; the merge is the stop` |
| 6a | B with epoch 2 renamed epoch 3 (its re-review heading too) | `epochs not 1, 2, 3` |
| 6b | B with epoch 1 `state: open` | `epoch 1 is not closed` |
| 6c | B with epoch 2 approved `2026-10-20` (before epoch 1's `2026-10-21`) | `date goes back` |
| 7a | B without the `### Re-review for epoch 2` block | `re-review for epoch 2` and `must leave a record` |
| 7b | B without the `Narrowed:` line | `Narrowed` |
| 7c | B with `Narrowed: maybe` | `Narrowed` |
| 7d | B without the table | `table` |
| 7e | B with the table's header rows only | `at least one row` |
| 7f | B with a verdict `partly` | `verdict "partly"` |
| 7g | B with the re-review block after epoch 2's line | `before` and `epoch 2` |
| 8 | B with `Narrowed: yes` and epoch 2 `by reviewers` | `a smaller plan needs the owner` |
| 9 | A as `todo/PLAN_x_E1.md` with `parentInTodo: true` | `its changes count in the parent` and `PLAN_x.md`; with `parentInTodo: false` → `[]` |

`parentPlanOf`: `PLAN_plan_change_control_E1.md` → `PLAN_plan_change_control.md`; `PLAN_x_E12.md` → `PLAN_x.md`;
`PLAN_x_E1_remainder.md` → `PLAN_x.md`; `PLAN_x.md` → `null`; `PLAN_x_Eval.md` → `null`;
`PLAN_E1_feature_E2.md` → `PLAN_E1_feature.md` (rightmost); with `exists` true only for `PLAN_a.md`,
`PLAN_a_E1_b_E2.md` → `PLAN_a.md`.

### Spawned cases (`tools/plan-lifecycle.test.mjs`)

Add one helper beside the existing `repo()`; it writes the given files and an index that lists every plan, so no
`index` finding hides the one under test:

```js
function estate(t, files) {
  const root = ownedDir(t, "plan-lifecycle ");
  const put = (name, text) => {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), text);
  };
  for (const [name, text] of Object.entries(files)) put(name, text);
  const plans = folder => Object.keys(files).filter(n => n.startsWith(`${folder}/PLAN_`)).map(n => n.slice(folder.length + 1));
  put("todo/README.md", `# todo\n\n## Currently open\n\n| Plan | What |\n|---|---|\n${plans("todo").map(row).join("\n")}\n`);
  put("research/README.md", `# research\n\n${plans("research").join("\n")}\n`);
  return root;
}
```

The plan text comes from the same `plan(ledger, { status })` shape as the pure file (copy the helper; the two test
files share no module).

| # | Estate | Expected |
|---|---|---|
| W1 | `todo/PLAN_x.md` with no ledger | exit 0, stdout `clean` |
| W2 | `todo/PLAN_x.md` = A2, open | exit 1; stderr has a line matching `/^  changes   todo\/PLAN_x\.md — .*epoch 1 has 2 changes/m` (class padded to 10) and the hint line naming `common/plan-change-control.md` |
| W3 | `todo/PLAN_x.md` (no ledger) and `todo/PLAN_x_E1.md` = A | exit 1, `changes   todo/PLAN_x_E1.md`, `its changes count in the parent` |
| W4 | `todo/PLAN_x_E1.md` = A alone, no parent | exit 0 |
| W5 | `research/PLAN_old.md` with status `**IMPLEMENTED, 2026-10-01.**` and A2, open | exit 0: `research/` is history and is not read |
| W6 | `todo/PLAN_x.md` = A2 with `state: stopped`, status `> Status: **stopped for re-review, 2026-10-28.** All four stories of E1 are done; E2 has not started.` | exit 0, stdout `clean` — S1 decision 3: the stop phrase lifts the totality verdict in `isFullyDone` |
| W6b | the same status without `stopped for re-review` and with no ledger | exit 1, `misfiled` — the totality check still works |
| W6c | A2 `stopped`, status `> Status: **stopped for re-review, 2026-10-28.** All of it is done; it belongs in research/ now.` | exit 1, `misfiled` — the phrase lifts the totality verdict only, never a self-reported misfiling or `**implemented**` |
| W7 | A2 `stopped`; the stop phrase only in the status block's SECOND paragraph (after a `>` blank line) | exit 1, finding 2 — `statusParagraph` reads the first paragraph only |
| W8 | the existing missing-row case of `repo()` | stderr does NOT name `plan-change-control.md`: the hint comes only with a `changes` finding |
| W9 | `todo/PLAN_x.md` = A, while the lib is replaced by one whose `ledgerFindings` throws | exit 1; stderr has `changes   todo/PLAN_x.md` and `could not be read`; stderr has no `    at ` stack line and no `Node.js v` banner — a finding, not a crash |

W9 swaps the module with a resolve hook preloaded through `--import`, so `plan-lifecycle.mjs` needs no test seam. Checked
on Node 26.12.1 on 2026-10-28 with a two-file model of the same import. CI runs Node 22 (`.github/workflows/ci.yml:28`):
`module.registerHooks` exists from 22.15, so the test skips with a reason where it is absent (`engines` says `>=20`):

```js
import * as nodeModule from "node:module";

const THROWING_LEDGER = "data:text/javascript," + encodeURIComponent(
  // Export EVERY name plan-lifecycle.mjs imports from the lib, or the child dies at link time — a crash, not this case.
  "export const STOP_PHRASE = /x/; export const parentPlanOf = () => null;" +
  " export function ledgerFindings() { throw new Error('stub: the parser threw'); }");
const SWAP_LEDGER = "data:text/javascript," + encodeURIComponent(
  `import { registerHooks } from "node:module"; registerHooks({ resolve(s, c, n) {` +
  ` return s.endsWith("/plan-ledger.mjs") ? { url: ${JSON.stringify(THROWING_LEDGER)}, shortCircuit: true } : n(s, c); } });`);

test("W9 …", { skip: nodeModule.registerHooks ? false : "module.registerHooks needs Node 22.15 or later" }, t => {
  const root = estate(t, { "todo/PLAN_x.md": plan(A) });
  const run = spawnSync(process.execPath, ["--import", SWAP_LEDGER, script, root], { encoding: "utf8", timeout: 10000 });
  // …
});
```

### The RED run

```bash
node --test tools/plan-ledger.test.mjs
node --test tools/plan-lifecycle.test.mjs
node --test tools/leftovers-check.test.mjs
```

Expected: every red case and every red twin fails on its assertion (`[]` where a finding was expected; exit 0 where 1
was expected; W9 exit 0, because nothing imports the lib yet; S1's F6–F8 and the `~~~`/indented/four-backtick halves of
F2–F5 fail because the old one-line fence regex still runs; W6 fails with a `misfiled` line); the clean cases, W1, W4,
W5, W6b, W6c and W8 pass;
`leftovers-check` passes. A failure that names a missing module, a syntax error or an `ownedDir` error is the wrong
reason. Fix the test before going on.

- **Done when.** Both RED outputs are saved (the coder's summary quotes one failure per row) and show only assertion
  failures; nothing in `tools/plan-lifecycle.mjs` changed yet.

## E1.S3 — GREEN: `tools/lib/plan-ledger.mjs` and its wiring

- **Models.** Brief by Opus (this section; the parser core follows S1's brief); code by a **Sonnet** coder; review by
  Opus; fixes by Sonnet.
- **Goal.** Every S2 test passes; the estate and this worktree stay clean.
- **Files.** `tools/lib/rule-body.mjs` (S1 decision 1: `outsideFencedBlocks` widened, no new export),
  `tools/ownership-check.test.mjs` (the marker-in-a-new-fence regression, brief step 0),
  `tools/lib/plan-ledger.mjs` (the stub becomes the lib), `tools/plan-lifecycle.mjs`.

### The brief — the lib

0. **First, the fence widening and its verification** (S1 decision 1, step 1 of S1's brief): change
   `outsideFencedBlocks` in `tools/lib/rule-body.mjs`, then `node tools/rule-bodies.mjs` (in step, NO `--update`),
   `node tools/ownership-check.mjs`, and `npm test` with every test green EXCEPT S2's deliberate RED cases that wait for
   the lib (the fence cases F6–F8 on the helper go green here) — before the lib is touched. A drifted body is a stop.
   **And one regression the heading count cannot show** (cadence consultation, verified by reading
   `tools/ownership-check.mjs:128`: markers are read through `outsideFences`, findings through the whole text): in
   `tools/ownership-check.test.mjs`, an `owns:` marker inside a `~~~` fence and inside an indented fence grants NOTHING
   (a product word in prose outside it stays a finding), and a product word inside those fences is still a finding.
   Today the `~~~` marker would grant; after the widening it must not. Watch it red before the widening.
1. Dependency-free. It imports only `folded` and `outsideFencedBlocks` from `./rule-body.mjs` (`:21`, `:29`).
   `plan-lifecycle.mjs` runs in six consumers' CI from the submodule; the lib must import nothing that needs `npm ci`.
2. `ledgerFindings`: fold the text, take the text outside fences (decision 1; fenced lines are empty lines, so line
   numbers hold), find the ledger headings (exact and near-miss, S1 *Grammar*). None → `[]`. Two or more → finding 3,
   and stop. The section runs to the next `## ` or `# ` heading or the end of the file; `### …` lines are inside it.
3. Classify each line of the section by S1's *Grammar* table — its line kinds, regexes, constants and the detail set
   of an unreadable entry are the specification; the structure (blocks, records) is S1's *Structure* paragraph. The
   points the first draft got wrong, kept here so they are not re-learned: a line that starts with whitespace is free
   text whatever it holds; any OTHER column-0 line that is not a line kind is finding 4 `unreadable line`, never free
   text; an entry is split on the first ` — ` and then on ` · ` so the message says WHICH field is wrong; the table
   header is checked, so "the verdict is the third cell" is a fact.
4. Then the state checks in S1's order: row 6 (sequence first), 5, 1, 2 (`STOP_PHRASE`, the one exported constant —
   S1 decision 3), 7, 8, 9 — S1's *The state machine* table carries the message of each. The current epoch is the
   LAST epoch line, which row 6 proves is the highest. The count is the number of parsed entries of the current block
   — derived, never read from the text.
5. Every message starts with `file`, names the entry (`entry 1.3`) or the epoch (`epoch 2`) where it has one, and
   carries the substring the S2 and S1 tables assert.
6. `parentPlanOf(name, exists = () => false)`: the candidates are every split of `name` at a `_E<digits>` that is
   followed by `_` or `.md`, where the part before it is `PLAN_` plus at least one character — tried from the RIGHT
   (the longest topic first). Return the first candidate `` `${topic}.md` `` for which `exists(candidate)` is true;
   if none exists, the rightmost candidate; if there is no candidate, `null`. (E1 plan round, finding 2: a single
   non-greedy regex can cut a topic that itself holds `_E<n>`.) The wiring passes
   `(p) => fs.existsSync(path.join(todo, p))`.

### The brief — the wiring in `tools/plan-lifecycle.mjs`

1. `import { ledgerFindings, parentPlanOf, STOP_PHRASE } from "./lib/plan-ledger.mjs";` (W9's stub exports all
   three).
2. A new `checkChangeLedgers(root, findings)` beside `checkStatuses` (`:161`), over **`todo/` only**:

   ```js
   function checkChangeLedgers(root, findings) {
     const todo = path.join(root, "todo");
     for (const file of plansIn(todo)) {
       const name = `todo/${file}`;
       try {
         const parent = parentPlanOf(file, (p) => fs.existsSync(path.join(todo, p)));
         const found = ledgerFindings({
           file: name,
           text: fs.readFileSync(path.join(todo, file), "utf8"),
           status: statusParagraph(path.join(todo, file)),
           parentInTodo: parent !== null && fs.existsSync(path.join(todo, parent)),
         });
         for (const message of found) findings.push(`changes   ${message}`);
       } catch (error) {
         // One finding, no stack: a crash here would turn six consumers' CI red with a trace (S1 decision 4).
         findings.push(
           `changes   ${name} — the ledger could not be read (${error?.message ?? error}); red until the file or the check is fixed`,
         );
       }
     }
   }
   ```

   Reuse `plansIn` (`:95`) and `statusParagraph` (`:109`) as they are; do not copy them. The class `changes` is padded
   to 10 like the others (`:167`). The `try` wraps the whole per-file body, the read included (S1 decision 4).
3. Call it in `main()` right after `checkStatuses(root, findings)` (`:277`).
4. The hint: after the existing `/promote-plan` line, and only when `findings.some(f => f.startsWith("changes "))`,
   print one line, e.g. `A plan that changed twice after its approval stops for a whole re-review:
   common/plan-change-control.md`. That file is E2's; the one pull request carries both (parent S10).
5. `isFullyDone` (`:133`), not `checkStatuses`: the totality verdict counts only when `STOP_PHRASE` does not match —
   the exact function is in S1 decision 3 (W6, W6b, W6c). `TOTALITY_VERDICT` itself is unchanged.
6. `main()` already takes a root argument (`process.argv[2] ?? process.cwd()`, `:268`); E1.S4's dry run uses it.

### Commands

```bash
node --test tools/plan-ledger.test.mjs
node --test tools/plan-lifecycle.test.mjs
npm test
npm run check
node tools/ownership-check.mjs
node tools/rule-bodies.mjs
node tools/plan-lifecycle.mjs          # this worktree: must print "plan-lifecycle: clean."
```

The last one reads the parent's live ledger (fixture P's real twin) and this document, which carries no ledger: both
clean.

### The RED-GREEN-RED check

Revert the line the behaviour depends on, run, see the named tests fail with the real symptom, restore, see green
(`common/testing.md`, *If the fix already landed*):

| Revert | Must go red |
|---|---|
| the widened `outsideFencedBlocks` (put the old one-line regex back) | F2, F3, F4, F5, F6, F7, F8 — and `node tools/rule-bodies.mjs` stays in step either way, which is the proof that nothing recorded moved |
| the `checkChangeLedgers(root, findings)` call in `main()` | W2, W3, W7, W9 |
| the row-1 push in the lib | row 1 and the red twins of C2, C3, C6, C8 (F1–F5) |
| the `try`/`catch` in `checkChangeLedgers` (let the throw through) | W9, with a stack in stderr |
| the `&& !STOP_PHRASE.test(status)` in `isFullyDone` | W6 (W6b and W6c stay red-as-expected: they prove the other half) |

- **Done when.** Every S2 and S1 test passes; the five reverts each went red as listed and were restored; the seven
  commands above are green; the coder's summary quotes one RED message and the GREEN count.

## E1.S4 — The estate dry run, the header comments, S6b

- **Models.** The dry run and the record: a **Sonnet** coder or the main session (commands and a table, no judgement).
  The header comments: the small-edit exception (one file each, under 50 lines), or Sonnet. S6b and the Opus review:
  the main session, started together.
- **Goal.** Proof that the check adds no false red anywhere in the estate on the day it lands; the lib says what it
  cannot see; the parent plan is read by the code round.

### 1. The dry run (read-only, parent decision 4)

`main()` takes the repository root as its argument, so no `cd` is needed. Main's checker has no imports beyond `node:`,
so a copy of it runs from the scratchpad:

```bash
WT=/home/jinx/git/wt-plan-change-control
OLD="$SCRATCH/plan-lifecycle-main.mjs"          # $SCRATCH = the session's scratchpad directory
git -C "$WT" show main:tools/plan-lifecycle.mjs > "$OLD"
for r in /home/jinx/git/dew_flow_* /home/jinx/git/wsl_care "$WT"; do
  node "$OLD" "$r" > "$SCRATCH/old.txt" 2>&1; old=$?
  node "$WT/tools/plan-lifecycle.mjs" "$r" > "$SCRATCH/new.txt" 2>&1; new=$?
  n=$(diff "$SCRATCH/old.txt" "$SCRATCH/new.txt" | grep -c 'changes ')
  echo "$r | main exit $old | branch exit $new | changes lines in the diff: $n"
done
```

Expected: `0` changes lines for every checkout. Measured with main's checker on 2026-10-28: `dew_flow_benchmark`,
`dew_flow_creds_for_devs` and `dew_flow_rag_qln` already exit 1 on `link` findings, the two `*-wt` folders have no
`todo/` + `research/` pair, and the others are clean — the same lines must come out of both runs. `$WT` itself has no
`main` baseline for its ledger; the branch's run there must print `clean`. Any `changes` line is a stop: report it, do
not soften the check. The checkout not present here is checked on its remote before the release (parent S9), not
here.

Record the result in this document, in a `## Dry run record` section added at the end: one row per checkout, the date
and the two commits compared.

### 2. The header comments

- `tools/lib/plan-ledger.mjs`: a header in the house style of `tools/plan-lifecycle.mjs` — what the lib reads (the
  parent's §2, by path), that it reads the checkout and never git history, and S1 decision 5: what the check cannot see
  — a plan with no ledger, a change nobody recorded, code written during a stop; a stopped plan is clean by design,
  and the halt is the rule's (`common/plan-change-control.md`, E2).
- `tools/plan-lifecycle.mjs`: one paragraph in the header naming the new finding class `changes`, read over `todo/` only.

### 3. S6b and the reviews

`review_code` on `feat/plan-change-control-e1` over the epic's whole diff, with `planText` = the parent plan as it stands
(a non-empty `planText` is the round's scope, `PanelService.cs:1362-1363` in the review server's repository); an Opus
review started at the same time. Resolve both; fold the fixes into the one commit. Record S6b's outcome in the parent's
S6a section style (a short paragraph and the findings table) — in the parent, because this document keeps no record of
changes.

- **Done when.** The dry-run table shows zero `changes` lines in every diff; the two headers are written; the five
  commands are green on the final tree; S6b and the Opus review are resolved and recorded; ONE commit on
  `feat/plan-change-control-e1`.

## Dry run record

Recorded 2026-10-28 by the E1 coder (Sonnet), on branch `feat/plan-change-control-e1` at `0c3febe0797a55ff8b704009b9095d3faae5be05`
+ uncommitted E1 work. Compared: the checker of `main` (`git show main:tools/plan-lifecycle.mjs`, run from a scratch folder; it
imports nothing beyond `node:`) against the branch's `tools/plan-lifecycle.mjs` with its new lib, each given every checkout as
`argv[2]`.

**Prediction, written before the first run:** zero `changes` lines in the diff of the two outputs, for every checkout. The
reason: the parent plan measured on 2026-10-28 that no `todo/` or `research/` file in the estate carries `## Plan changes` or
an `> Epoch` line, and the check is opt-in by presence. The one file that carries a live ledger is the parent plan in this
worktree, and it has no `main` baseline: the branch's run there must print `clean`.

**Result: the prediction held.** Zero `changes` lines in the diff for every checkout; in fact the two outputs are
byte-identical for all eleven (`diff` printed nothing), so the branch adds nothing to any of them. The red the estate already
has comes from `link` findings that `main` reports too.

| Checkout | main exit | branch exit | `changes` lines in the diff | Note |
|---|---|---|---|---|
| `dew_flow_benchmark` | 1 | 1 | 0 | one finding, the same in both runs |
| `dew_flow_benchmark-wt` | 0 | 0 | 0 | no `todo/` + `research/` pair — nothing to check |
| `dew_flow_connect_other_ais` | 0 | 0 | 0 | clean |
| `dew_flow_connect_other_ais-wt` | 0 | 0 | 0 | no `todo/` + `research/` pair — nothing to check |
| `dew_flow_conventions` (the `main` checkout) | 0 | 0 | 0 | clean |
| `dew_flow_creds_for_devs` | 1 | 1 | 0 | 14 findings, the same in both runs |
| `dew_flow_rag_qln` | 1 | 1 | 0 | 6 findings, the same in both runs |
| `dew_flow_sidecar_rust` | 0 | 0 | 0 | clean |
| `dew_flow_vscode_kit` | 0 | 0 | 0 | clean |
| `wsl_care` | 0 | 0 | 0 | clean |
| `wt-plan-change-control` (this worktree, with the parent plan's live ledger) | 0 | 0 | 0 | the branch's run prints `plan-lifecycle: clean.` — the live ledger parses |

Diff count over the whole table: **0**. The checkout not present on this machine is checked on its remote before the release
(parent S9), not here.
