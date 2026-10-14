# PLAN — Model tiers, E1: the rule rewritten, the layout written down

> Status: **IMPLEMENTED, 2026-10-13.** Stories of epic E1 of [PLAN_subagent_model_tiers.md](PLAN_subagent_model_tiers.md)
> (§ *Epics*, E1), shipped in PR #65 together with E2 and E4 S1–S3. Deviations: the rule is 8 875 B and rides fourteen
> tasks — `inspect`, `ui`, `gpu` and `storage` are excluded by measurement, pinned by `tools/rules.test.mjs`
> ([RESULTS](RESULTS_subagent_model_tiers.md) § *Read budget*); one sentence was added to S1's text after smoke run 1
> answered the unsplit "research AND propose" request with `fable` ("a design … outside them is a judge's — Opus",
> `6bc7e51`); E1 goes to `main` in the same pull request as E2 (#65), not its own (E1 code round). Open tail: none in this epic — the
> release that publishes the text is [PLAN_subagent_model_tiers_rollout.md](PLAN_subagent_model_tiers_rollout.md).
>
> Split by Opus; models per story below.

Done when (from the parent): `npm test`, `npm run check`, `node tools/ownership-check.mjs`, `node tools/rule-bodies.mjs`
and `node tools/plan-lifecycle.mjs` are clean; the rule is ≤ 9 000 B; every scope that is single-read today still fits;
the numbers are in the research record; merged to `main`.

## S1 — The canonical text of `common/subagent-models.md` — **cornerstone (1 of 2)**

- **Models.** Fable writes the spec. For a rule the spec and the deliverable coincide — the prose IS what sessions obey —
  so Fable drafts the body itself; Opus (the caller) reviews it against the parent's §1, §3.1 and the §3.4
  classification fixture; edits after review are the caller's when they are one-file and ≤ 50 lines.
- **Scope.** Frontmatter (`tasks` = every key of `TASKS` except `inspect`, `ui`, `gpu`, `storage`); the body sections of
  the parent's §3.1 in that order; a parseable role table (first column the role, second exactly `sonnet`, `opus`,
  `fable` or `main session or sonnet`) — E2's digest test reads it.
- **Scenarios.** Each of the nine §3.4 classification requests is decided by a sentence of the text; no family repository
  or product is named (`tools/ownership-check.mjs`); ≤ 9 000 B.

## S2 — The layout section in `common/planning-docs.md`

- **Models.** Opus, written by the main session (one file, under 50 lines — the exception).
- **Scope.** `### A plan split into epics and stories` under *Creating a plan*: epics last in the plan with the ledger,
  one stories document per epic written when the epic starts, own README rows, promote together, no renames.

## S3 — The guards and the record

- **Models.** Brief by Opus (below); code by a Sonnet coder; review by Opus.
- **Brief.**
  1. `research/rule-bodies.json`: `node tools/rule-bodies.mjs --update common.subagent-models common.planning-docs` after
     S1 and S2 are final; verify with `node tools/rule-bodies.mjs`.
  2. `tools/rules.test.mjs`: a test that enumerates `TASKS` (`tools/lib/rule-catalog.mjs:9`) and asserts
     `common.subagent-models` is selected for exactly the fourteen tasks and not for `inspect`, `ui`, `gpu`, `storage`;
     a test that, for those four, every scope measured in the parent's §3.1 *Tasks* paragraph that fits today still
     selects ≤ 32 768 B (use `selectRules` + the rule byte counts, the same way the existing build-flags test reaches the
     catalog). Name each test after the guarantee.
  3. `tools/plan-lifecycle.test.mjs` (or the existing test file for that tool): a fixture with a parent plan and a
     `PLAN_<topic>_E1.md` in `todo/` — clean only when `todo/README.md` lists both.
  4. `research/RESULTS_subagent_model_tiers.md` (new): the read-budget measurements (all 18 tasks × 7 scopes, from the
     parent), the rule's byte count, and a `research/README.md` row.
- **Scenarios.** Moving `ui` into the rule's `tasks` turns the selection test red naming `ui` (break-it, then restore);
  dropping the stories document's README row turns the lifecycle fixture red.

## Order

S1 ∥ S2 → S3 (needs both texts final for the body records) → the epic's code round (`review_code`, base = the plan's
last commit) → PR.
