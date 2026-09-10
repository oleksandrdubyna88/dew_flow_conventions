# Conventions project instructions

This repository owns the shared policy and Node tools for the active dew_flow repositories.
Read `README.md` for editing discipline and `research/architecture.md` for the implementation.
The active rollout is recorded in `todo/PLAN_shared_rules_claude_codex.md`.

This is the source repository: its resolver lives at `tools/rules.mjs`, and its shared
entry is `ENTRY.md`. There is no nested conventions submodule here. Resolver output
explicitly labels this working-tree mode; consumers must use a clean pinned submodule.

Install locked dependencies with `npm ci --ignore-scripts`; run `npm test` and `npm run check`.
Run the same suite in WSL when changing path handling. Existing checks remain in `tools/`.
Do not fold the unrelated product-audit backlog into a rule-delivery change.

Shared rules are advisory instructions for agents. Runtime permissions, managed policies,
and system/user instructions retain their host-defined priority. No loader output is evidence
that a model obeyed a rule. Validate actual reads and behavior in a separate bounded smoke run.
