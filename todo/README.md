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
| [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md) | Every consumer's tests name what they leave behind `testsToDelete-…`: the 2026-10-14 audit (0 compliant sites), leaks first, then the rename, plus the shared-test-database refinement of the rule; split into seven epics; wave 1 (E3, E4) merged; stopped for re-review 2026-11-01 (seven changes after approval), the whole plan revised for epoch 2, awaiting the Opus judge's table and the owner's approval (narrowed) |
| [PLAN_test_leftovers_merged_core_release.md](PLAN_test_leftovers_merged_core_release.md) | What is left of the test-leftovers merged core (built and promoted 2026-10-27): the machine barrier on every machine and the three root-only places, the merge of PR #82, the private sibling's side, the ONE promotion of `release`, then the consumer migration with every sweep-only stage before any producer stage |
| [PLAN_test_leftovers_merged_core_followups.md](PLAN_test_leftovers_merged_core_followups.md) | Six low findings of the merged core's security pass and two test gaps of the real-daemon volume fix, parked: the Node sweep's temp-root trust check, a stranger's control-byte name and the exit code, the guard's `package.json` scripts, the override's reach over daemon objects, the scan's line-scan limits, the root trust of a registered worktree, the stub docker's missing "no such volume", the live check's other templates, the Windows run and S4-28, a `module-load` class for the guard, and the barrier scan's pass of the janitor line by its line hash alone |
| [PLAN_node_rule_parity.md](PLAN_node_rule_parity.md) | C#/Node rule parity for the language-comparison experiment: a parity matrix (a file with a test) of every C#-specific requirement and its Node/TypeScript counterpart of equal strength (and the reverse), language mechanics moved word for word from the common rules into `csharp/`-, `typescript/`- and `rust/`-scoped rules under a task-gated path selector, the TypeScript design doctrine, a compiler/lint enforcement check, a measured Node behaviour record, the measured size budgets under the operator's "we only add" rule, a consumer dry run, one `release` promotion before the experiment's pre-registration and the eight consumer bumps; seven epics after the question consultants; epoch 4 open 2026-10-31 after the third re-review (its § 19–§ 20), one change (4.1: activations match by content) |
| [PLAN_node_rule_parity_E1.md](PLAN_node_rule_parity_E1.md) | E1's stories of the C#/Node rule parity plan, rewritten to its slimmed epoch 4 E1 — no new rule prose beyond a wording-only anonymisation and two whitespace-only splits: the `path_tasks` gate with provenance, the selection baseline (pinned ids, the 22 pins, the caps, the negative-case definition), a minimal parity matrix and inventory with the real-row proof on fixtures, the reusable move verifier with its 25-entry baseline, and the two lock fixtures with their required CI job |
