# dew_flow_conventions — the family's shared Claude rules

One copy of every cross-repository rule, consumed by each `dew_flow_*` repository as a git submodule
mounted at `.claude/rules/shared`. Claude Code loads rules from subdirectories, so everything under
`common/` (always loaded), `csharp/` and `rust/` (path-scoped frontmatter) applies in the consumer
exactly as a local rule would.

## Editing discipline (MANDATORY)

- Shared rules are edited **here and only here**. A consumer repository never carries its own copy of a
  shared rule — if a repo needs different behaviour, that difference is a named repo-local rule beside
  the mount, extending this one, never a divergent copy.
- **A rule change and the pin bumps are one task**: edit here → commit + push → in EVERY consumer
  `git submodule update --remote .claude/rules/shared` + commit, in the same task, never later. Drift
  that is visible as a stale pin is still drift; keep it at zero by habit.
- The habit is now also a check: [`tools/pin-check.mjs`](tools/pin-check.mjs) runs in every
  consumer's CI and fails while **any** submodule pin (this one, and `dew_flow_rag_qln`'s
  `external/dew_flow_mcp` alike) is not at its remote's tip. The 2026-08-19 audit found three
  consumers two commits behind — one missing `gpu-lease.md` entirely — which is why the pin has a
  check instead of an owner.
- Repo-specific rules stay in the consumer's own `.claude/rules/` beside `shared/`.

## Consumers

| Repository | Kind |
|---|---|
| `dew_flow_rag_qln` | .NET |
| `dew_flow_mcp` | .NET, public |
| `dew_flow_sidecar_rust` | Rust — `csharp/` never matches; `rust/doctrine.md` is its doctrine |
| `dew_flow_benchmark` | .NET |
| `dew_flow_creds_for_devs` | TypeScript — a VS Code extension; `csharp/` and `rust/` never match |

A new repository joins with one `git submodule add` — see [ROLLOUT.md](ROLLOUT.md).

`settings/settings.json` is the reference copy of the family's `.claude/settings.json`. Settings cannot
be shared by mount, so each repo holds a copy and keeps it byte-identical to the reference.

## `tools/` — the rules that check themselves

A rule nothing enforces is a rule that decays quietly. `common/planning-docs.md` described how to promote
a finished plan for as long as it existed, and by the time anyone counted, one repository had a plan
asking in writing to be moved and another had two promoted plans absent from its own index.

| Tool | Enforces | Run |
|---|---|---|
| [`tools/plan-lifecycle.mjs`](tools/plan-lifecycle.mjs) | [`common/planning-docs.md`](common/planning-docs.md) | `node .claude/rules/shared/tools/plan-lifecycle.mjs` |
| [`tools/pin-check.mjs`](tools/pin-check.mjs) | Editing discipline (pins at remote tips) | `node .claude/rules/shared/tools/pin-check.mjs` |

**One implementation, not one per repository.** A copy each would mean the same rule in two languages —
one of the four consumers is Rust — and `common/logging-serilog.md` already documents what that costs.
These checks read markdown rather than code, so nothing about them needs to be written twice. Node is on
every GitHub runner, so a Rust repository pays no toolchain for it.

A consumer wires it as one CI step, and its checkout needs `submodules: true` to have the file at all —
see [ROLLOUT.md](ROLLOUT.md).

The previous-generation `ClaudeRag` repository is **frozen**: its rules were the seed of these, but it
is not a source any more.
