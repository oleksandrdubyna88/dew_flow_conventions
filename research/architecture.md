# Architecture

Shared instruction delivery is implemented by `ENTRY.md`, root agent adapters and the
resolver in `tools/rules.mjs`. Rule bodies remain in `common/`, `csharp/`, `rust/` and
`typescript/`; each body owns its YAML applicability metadata. `tools/lib/rule-catalog.mjs`
validates and resolves that catalog using locked `yaml` and `picomatch` packages.

The consumer layout and rollout are still in progress in
[`PLAN_shared_rules_claude_codex.md`](../todo/PLAN_shared_rules_claude_codex.md).
Consumers move their project text to `.agents/PROJECT.md` and pin one submodule at
`.agents/conventions`. Host settings remain separate; the resolver never changes them.

Selection is deterministic and read-only. No model calls, generated policy copies, persistent
cache or background service are involved. Hashes cover UTF-8 text with CRLF normalized to LF,
so Windows checkout conversion does not create a false difference. See
[`module_rules.md`](module_rules.md) and [`module_tests.md`](module_tests.md).

`tools/migrate-rules.mjs` now prepares the neutral layout in an isolated consumer worktree.
`tools/smoke-rules.mjs` measures actual native-CLI source reads with bounded process ownership
and explicit incomplete results. See [module_rule_migration.md](module_rule_migration.md).
Product-specific rule discovery adapters and the six consumer PRs remain in the rollout plan.
