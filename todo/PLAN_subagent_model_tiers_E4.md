# PLAN — Model tiers, E4: prove it in a real session, then ship once

> Status: **in progress, 2026-10-13.** Stories of epic E4 of [PLAN_subagent_model_tiers.md](PLAN_subagent_model_tiers.md)
> (§ *Epics*, E4). Split by Opus; models per story below. No cornerstone here (the ledger's two are E1.S1 and E2.S1).

Done when (from the parent, § 3.4 and E4): the smoke checker's recorded-trace tests pass; the negative control showed
the guard's marker; one recorded behaviour run met every § 3.4 expectation with zero denials inside its cap; the
classification fixture answered as § 3.4 expects; one release; every consumer's pin green; promotion clean.

## S1 — The trace reader learns delegation

- **Models.** Brief by Opus (this section); code by a Sonnet coder; review by Opus.
- **Brief.** `tools/lib/rule-trace.mjs` today remembers only `Bash` blocks and pools every `message.model`
  (`claudeEvents`, `:79-90`). Add an exported `delegationEvidence(events, {marker})` for Claude stream-json events,
  leaving the existing source-read evidence untouched:
  - **Launches**: every parent-level (`parent_tool_use_id` null) assistant `tool_use` block named `Agent` or `Task` →
    `{id, model: input.model ?? null, subagentType, prompt, background: input.run_in_background}`.
  - **Children**: grouped by launch id through `system/task_started`, `system/task_notification` and the parent-level
    `tool_result`; a child is **terminated** when both its completed notification and that `tool_result` arrived.
    **Measured while building this story** (the recorded trace): a child's own assistant events never reach the
    parent's stream, so there is no per-child resolved model. Resolution is read in aggregate instead — every requested
    family must have a `claude-<family>-*` key with nonzero usage in `result.modelUsage` (other families ignored), and
    `result.subagent_stats` must count the launches; an Opus child cannot be told from an Opus parent (a stated limit).
  - **Denials**: a parent-level `tool_result` with `is_error: true` whose text contains the marker
    (`subagent-models.md:`) — counted per launch.
  - **Parent edits**: parent-level `tool_use` named `Edit`, `Write`, `MultiEdit` or `NotebookEdit` → their `file_path`.
  - **Nested launches**: an Agent `tool_use` inside a child (its event has a non-null `parent_tool_use_id`).
  - **Completion**: the final `result` event, its `subtype`, `is_error`, and `total_cost_usd` if present.
- **Verdict function** `behaviourVerdict(evidence, expectation)` → `{outcome: 'pass'|'fail'|'inconclusive', reasons[]}`,
  three outcomes, never two: **inconclusive** when the trace has no `result` event, the result says the budget or
  turns ran out, a launch has no terminal `tool_result`, a launch was retried (two launches with the same prompt hash),
  or a nested launch exists the expectation did not ask for; otherwise **fail** on any unmet expectation, else
  **pass**. The expectation object is data (counts per model, required focus tokens per scout, required headings in
  the coder's prompt, the fixture files the parent must not edit, the exact denial count).
- **Recorded traces first.** Before the checker is trusted, record ONE real trace with a tiny paid run (a session
  told to launch two foreground Agents, one `sonnet`, one `opus`, each replying OK) and commit it under
  `tools/fixtures/traces/` with secrets and paths scrubbed (session ids may stay); it is what confirms that a child's
  assistant events carry the child's `message.model` (unconfirmed by the payload probe). Derive the failure fixtures
  from it by editing copies (truncate, drop a terminal result, add a retry, add a nested launch, add a parent `Edit`,
  add a marker denial, empty the child set).
- **Scenarios** (`tools/smoke-rules.test.mjs`): the recorded trace yields two launches with the two models and each
  child's resolved family; each inconclusive cause; a parent edit → fail; a missing focus token → fail; an empty child
  set → fail (never pass); the marker present / absent; an unknown event type is ignored, not fatal.

## S2 — The behaviour mode and its three fixtures

- **Models.** Fixture design by Opus (below); code by a Sonnet coder; review by Opus.
- **Mode.** `tools/smoke-rules.mjs --behaviour <fixture>` (and `npm run smoke:behaviour`, a new script that runs the
  three fixtures in the order *negative → classification → behaviour* and stops at the first non-pass). It reuses
  `rule-smoke.mjs`'s launcher, its disposable-worktree check and its report writing; what changes, each deliberately
  (parent § 3.4): the Agent tool is offered and delegation allowed; the prompt is the fixture's; the scope resolves
  `--task implement`; `complete` expects exactly the fixture's files changed instead of an unchanged tree; time,
  output, spend and report caps come from the fixture (measured in S3, never silently raised in code).
- **Fixtures** live in `tools/fixtures/behaviour/`, each a JSON file `{name, prompt, tools, caps, expectation}`:
  1. **negative** — prompt: launch exactly one foreground Agent, `general-purpose`, with NO model, prompt "Reply OK",
     report the result verbatim, do not retry. Expectation: one launch, model null, exactly one denial carrying the
     marker, zero children. Caps: $1, 120 s.
  2. **classification** — tools: none. Prompt: the eleven requests of the parent's § 3.4, numbered, and "For each,
     answer with the model the repository's rules prescribe (sonnet, opus, fable, or main) and nothing else, as a JSON
     array". Expectation: the eleven answers, with the two "main OR sonnet" cases accepting either. Caps: $1, 180 s.
  3. **behaviour** — a toy package in `tools/fixtures/behaviour/toy/` (five small files: `args.mjs`, `format.mjs`,
     `config.mjs`, `toy.test.mjs`, `README.md`; ~40 lines each). Prompt: "Add a `--json` output flag to the toy CLI.
     An Opus team would send three scouts for this; follow the repository's rules for who you launch. Before any
     change, learn these five areas, one per scout: argument parsing (args.mjs), output formatting (format.mjs),
     configuration defaults (config.mjs), the existing tests (toy.test.mjs), the documented usage (README.md). The
     change touches format.mjs and toy.test.mjs, about 120 lines in total. Have the change reviewed before you
     finish. Launch every subagent in the foreground." Expectation: 5 `sonnet` launches whose prompts each name exactly
     one of the five file names and together all five; 1 `sonnet` launch whose prompt contains the headings
     `Scenarios` and `Brief` and which edits `format.mjs` and `toy.test.mjs`; 1 `opus` launch that reviews; no parent
     edit to any toy file; 7 children with matching resolved families; zero denials; `node --test` on the toy green
     afterwards. Caps: set in S3 from the first measured run, recorded.
- **Scenarios** (unit, no paid run): each fixture file validates against the shape; the mode refuses to run outside a
  disposable worktree; the npm script stops at the first non-pass; the caps come from the fixture.
- **Deviations, each forced by a paid run (RESULTS § *Behaviour smoke runs*):**
  - **The rule must be LOADED, or the run proves nothing** (run 2): fixtures carry `loadRules`; a rule-loading fixture
    gets the resolver's `explain`/`read` commands and a run that did not read `common.subagent-models` completely is
    **inconclusive**. The classification loads only that rule (`loadOnly`) — a full implement-scope load overflowed
    256 KiB of stream (run 4); the behaviour fixture keeps the full, realistic load.
  - **Roles, not phrasing** (runs 5 and 6): the session followed the rule both times, and the phrasing checks (a
    `Scenarios` heading, one file name per scout, an exact launch count) failed it anyway. The behaviour fixture now
    asks each launch to declare its role from the rule's table in `description`; the verdict reads the table itself
    (`parseRoleTable`, as the guard's digest test does) and checks each launch's model against its declared role, plus
    structural minimums: ≥ 5 scouts whose prompts together cover the five files, ≥ 1 coder, a judge after the first
    coder, no role outside scout/coder/judge, 7–10 launches. A judge writing the brief and a review-fix coder on
    `sonnet` are what the rule prescribes, and pass.
  - The toy's tests are `toy-checks.mjs`, a name `node --test`'s default globs do not pick up.
  - Caps are measured: classification $2 / 1 MiB / 300 s; behaviour $10 / 8 MiB / 1 800 s (a full run cost $3.06–3.16).

## S3 — Run it and record it

- **Models.** Run by the Opus caller (a paid run is a judgement of the rule, not code).
- The three fixtures in order; every run — pass, fail or inconclusive — recorded in
  `research/RESULTS_subagent_model_tiers.md` with its launches, resolved models, denials, cost and duration. A fail
  is a defect in the RULE TEXT (parent § 3.4): fixed in `common/subagent-models.md`, re-recorded, re-run — never a
  loosened expectation.

## S4 — Wire the self-install, release once, cascade

- **Models.** Opus (release orchestration is judgement), mechanical edits by Sonnet where a consumer needs a copy.
- Wire `ensure-user-guard.mjs` as a second `SessionStart` entry in `settings/settings.json` and the self-hosted
  `.claude/settings.json` (parent § 3.2, D13) in the commit the release is cut from. Then the parent's E4 cascade:
  PR → CI → automatic review comments → merge → `promote-release` with the 40-character sha → the six pins in the
  README's order (rag_qln last), connect_other_ais' bump carrying the hook files and both settings entries.
- The SessionStart entry carries a short host `timeout` (5 s) so a stalled self-install can never hold a session
  (E2 risk consultation); a test asserts the entry's shape.
- **Precondition, checked and written into the release PR** (benchmark gate round): the scout calibration — the third
  model-measuring harness, on another session's branch — carries `SUBAGENT_MODEL_GUARD=off` in its child allow-list or
  runs no paid arms. If neither holds, the self-install is left out of this release (the project-level guard still
  ships) and the operator is asked.

## S5 — Promotion

- After E3 (the first self-install observed on this machine): this plan and its four stories documents to
  `research/`, `IMPLEMENTED <date>` with deviations, both READMEs, `research/module_rules.md` and
  `research/module_tests.md`.

## Order

S1 → S2 → S3 → (E1 + E2 + this epic's S1–S3 in one pull request, parent § Order) → S4 → E3 → S5.
