# dew_flow_conventions — the family's shared Claude rules

One copy of every cross-repository rule, consumed by each `dew_flow_*` repository as a git submodule
mounted at `.claude/rules/shared`. Claude Code loads rules from subdirectories, so everything under
`common/` (always loaded) and `csharp/` (path-scoped frontmatter) applies in the consumer exactly as a
local rule would.

## Editing discipline (MANDATORY)

- Shared rules are edited **here and only here**. A consumer repository never carries its own copy of a
  shared rule — if a repo needs different behaviour, that difference is a named repo-local rule beside
  the mount, extending this one, never a divergent copy.
- **A rule change and the pin bumps are one task**: edit here → commit + push → in EVERY consumer
  `git submodule update --remote .claude/rules/shared` + commit, in the same task, never later. Drift
  that is visible as a stale pin is still drift; keep it at zero by habit.
- Repo-specific rules stay in the consumer's own `.claude/rules/` beside `shared/`.

## Consumers

| Repository | Kind |
|---|---|
| `dew_flow_rag_qln` | .NET |
| `dew_flow_mcp` | .NET, public |
| `dew_flow_sidecar_rust` | Rust — the C#-scoped rules simply never match |
| `dew_flow_benchmark` | .NET |

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

**One implementation, not one per repository.** A copy each would mean the same rule in two languages —
one of the four consumers is Rust — and `common/logging-serilog.md` already documents what that costs.
These checks read markdown rather than code, so nothing about them needs to be written twice. Node is on
every GitHub runner, so a Rust repository pays no toolchain for it.

A consumer wires it as one CI step, and its checkout needs `submodules: true` to have the file at all —
see [ROLLOUT.md](ROLLOUT.md).

The previous-generation `ClaudeRag` repository is **frozen**: its rules were the seed of these, but it
is not a source any more.
