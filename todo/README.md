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
| [PLAN_rule_ownership_and_release_pinning.md](PLAN_rule_ownership_and_release_pinning.md) | A shared rule names no product, and a consumer follows a `release` ref rather than this repository's live tip — the governance rule, its check, the 53-reference cleanup, and the pin mechanism that stops one commit here reddening six repositories |
| [PLAN_pin_actions_to_shas.md](PLAN_pin_actions_to_shas.md) | Every `uses:` in every workflow names a reviewed commit sha rather than a mutable tag, with Dependabot raising the bumps and a check that refuses a tag |
| [PLAN_mutation_harness.md](PLAN_mutation_harness.md) | `npm run mutate` re-runs the mutations that prove these checks have teeth, and fails when one reddens the wrong set of cases — replacing prose that records somebody did it once |
