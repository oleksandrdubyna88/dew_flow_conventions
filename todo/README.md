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
| [PLAN_shared_rules_rollout_tooling.md](PLAN_shared_rules_rollout_tooling.md) | S2: disposable consumer migration, compatibility checks, rollback and bounded live-agent probes |
| [PLAN_shared_rules_claude_codex.md](PLAN_shared_rules_claude_codex.md) | One canonical policy for Claude Code and Codex: AGENTS bootstrap, CLAUDE import, neutral submodule, shared rule selection and migration of six consumers |
| [PLAN_product_improvements.md](PLAN_product_improvements.md) | Audit fixes, smaller Claude Code rule payload, reliable checker results, boundary tests and versioned rollout |
| [PLAN_prod_checks_and_http_contracts.md](PLAN_prod_checks_and_http_contracts.md) | `.http` contract suites and a `POST_DEPLOY.md` in every consumer, plus the three Node tools that check them |
| [PLAN_scenario_harness_check.md](PLAN_scenario_harness_check.md) | `tools/scenario-check.mjs` — the check behind [common/scenario-tests.md](../common/scenario-tests.md): every repository's `research/module_tests.md` exists, names its harness and its run command, and claims no coverage it cannot point at |
