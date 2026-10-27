# `todo/` — open work on the shared rules

Plans for work that is **not finished**, per [common/planning-docs.md](../common/planning-docs.md). A
plan whose work has shipped moves to `research/` with an `IMPLEMENTED <date>` status.
The current implementation is documented in [research](../research/README.md).

A plan here is about the rules themselves or their rollout across the consumers. Work inside one
consumer belongs in that repository's own `todo/`.

## Currently open

Product audit: [REVIEW_product_audit_2026-09-09.md](REVIEW_product_audit_2026-09-09.md) — nine findings in the checking tools and the Claude Code rules payload, with evidence and proposed fixes.

| Plan | What it delivers |
|---|---|
| [PLAN_shared_rules_claude_codex.md](PLAN_shared_rules_claude_codex.md) | One canonical policy for Claude Code and Codex: AGENTS bootstrap, CLAUDE import, neutral submodule, shared rule selection and migration of six consumers |
| [PLAN_product_improvements.md](PLAN_product_improvements.md) | Audit fixes, smaller Claude Code rule payload, reliable checker results, boundary tests and versioned rollout |
| [PLAN_prod_checks_and_http_contracts.md](PLAN_prod_checks_and_http_contracts.md) | `.http` contract suites and a `POST_DEPLOY.md` in every consumer, plus the three Node tools that check them |
| [PLAN_scenario_harness_check.md](PLAN_scenario_harness_check.md) | `tools/scenario-check.mjs` — the check behind [common/scenario-tests.md](../common/scenario-tests.md): every repository's `research/module_tests.md` exists, names its harness and its run command, and claims no coverage it cannot point at |
| [PLAN_product_manuals_go_home.md](PLAN_product_manuals_go_home.md) | The obligation stays shared and the protocol goes to the product that serves it — extracted from the rule-ownership plan when it was promoted; blocked on a live-session check of an installed gate build, which a session cannot perform for itself |
| [PLAN_pin_actions_to_shas.md](PLAN_pin_actions_to_shas.md) | Every `uses:` in every workflow names a reviewed commit sha rather than a mutable tag, with Dependabot raising the bumps and a check that refuses a tag |
| [PLAN_mutation_harness.md](PLAN_mutation_harness.md) | `npm run mutate` re-runs the mutations that prove these checks have teeth, and fails when one reddens the wrong set of cases — replacing prose that records somebody did it once |
| [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md) | Every consumer's tests name what they leave behind `testsToDelete-…`: the 2026-10-14 audit (0 compliant sites), leaks first, then the rename, plus the shared-test-database refinement of the rule; split into seven epics |
| [PLAN_test_leftovers_E1.md](PLAN_test_leftovers_E1.md) | Stories of epic E1 of the test-leftovers rollout: the shared contract text, the Node owned-resource helper, the start-of-run sweep, the guard, this repository's own sites, one release |
| [PLAN_test_leftovers_merged_core.md](PLAN_test_leftovers_merged_core.md) | The merged core of the test-leftovers contract: the owner segment in the name scopes a sweep, the kernel owner and the owner record authorise it, three-valued liveness decides; one janitor, a barrier checklist for shared machines, one release that every consumer epic waits for — revises E1's contract |
| [PLAN_test_leftovers_merged_core_followups.md](PLAN_test_leftovers_merged_core_followups.md) | Six low findings of the merged core's security pass and two test gaps of the real-daemon volume fix, parked: the Node sweep's temp-root trust check, a stranger's control-byte name and the exit code, the guard's `package.json` scripts, the override's reach over daemon objects, the scan's line-scan limits, the root trust of a registered worktree, the stub docker's missing "no such volume", the live check's other templates |
