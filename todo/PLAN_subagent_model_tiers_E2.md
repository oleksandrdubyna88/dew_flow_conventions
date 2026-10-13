# PLAN — Model tiers, E2: the guard, its installer, and the harnesses prepared for it

> Status: **in progress, 2026-10-13.** Stories of epic E2 of [PLAN_subagent_model_tiers.md](PLAN_subagent_model_tiers.md)
> (§ *Epics*, E2). Split by Opus; models per story below.

Done when (from the parent): the guard and installer tests pass and both break-its went red and back; `adapter-check`
demands the hook and this repository hosts it; real payloads and the allowed-call context are recorded; every harness
that needs the opt-out sets it, proved through its real launcher — all merged BEFORE this epic merges.

## S1 — The hook's contract with the host — **cornerstone (2 of 2)**

- **Models.** Evidence first: a Sonnet scout records real payloads (with and without `model`, the denial, the
  allowed-call context reaching the parent). Then Fable writes the spec — the verdict matrix, the fail-open paths, the
  opt-out, the warning channel, the deny marker, the one-line digest — as scenarios + brief. Sonnet writes
  `settings/hooks/subagent-model.mjs` and `tools/subagent-model-hook.test.mjs` from it; Opus reviews.
- **Scope.** The hook; its test (the parent's §4 *Guard* list, both break-its); the digest-vs-rule test that parses
  E1.S1's role table.

## S2 — The installer

- **Models.** Brief by Opus; code by Sonnet; review by Opus.
- **Scope.** `tools/install-user-hook.mjs` (`--install` default, `--uninstall`, `--check`) and its test against a temporary
  home, with every requirement of the parent's §3.2 installer list and §4 *Installer* cases.

## S3 — Wiring and self-hosting

- **Models.** Sonnet, from this brief; review by Opus.
- **Brief.** `settings/settings.json`: a second `PreToolUse` entry, matcher `Agent|Task`, `node` +
  `${CLAUDE_PROJECT_DIR}/.claude/hooks/subagent-model.mjs` (the `build-flags` entry's shape at `settings/settings.json:24`).
  Copy the hook and the settings onto this repository's `.claude/` (self-hosting, `tools/adapter-check.test.mjs:48-50`).
  `tools/adapter-check.test.mjs`: `whole()` (`:36`) copies three hooks; the bare-repository case (`:55`) counts four
  findings. `research/module_tests.md` gains the two new test files.

## S4 — Harness preparation

- **Models.** Inventory by two Sonnet scouts (one per group of repositories); each opt-out patch by a Sonnet coder from
  an Opus brief; proofs judged by Opus.
- **Scope.** Every launcher of `claude` on this machine that must not be steered sets `SUBAGENT_MODEL_GUARD=off`
  (WSL: through `WSLENV`); each proved by an otherwise-denied call through the REAL launcher; the benchmark's PR (status
  line, three citations, the opt-out) merged first; the restart list for processes already running; all recorded in
  `research/RESULTS_subagent_model_tiers.md`.

## Order

S1's scout → S1's spec → {S1's code ∥ S2 ∥ S3} → S4 (needs the hook to prove against) → the epic's code round → PR,
merged after E1.
