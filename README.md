# dew_flow_conventions — shared Claude Code and Codex rules

One canonical body per rule, with applicability in that file's YAML frontmatter.
`AGENTS.md` directs both agents to the shared entry and project rules; `CLAUDE.md`
contains only `@AGENTS.md`. The resolver selects the same sources for both agents.
This is advisory instruction delivery, not enforcement of model behavior.

The source repository uses this setup now. Consumer migration from `.claude/rules/shared`
to `.agents/conventions` is in progress; see [the plan](todo/PLAN_shared_rules_claude_codex.md).
Existing consumers keep their current pins until migration is verified. Do not mount this
new checkout wholesale under Claude's automatic rules tree.

Run `npm ci --ignore-scripts`, `npm test`, `npm run check`. For selected sources:
`node tools/rules.mjs explain --repo . --task policy --file ENTRY.md`.
See [ENTRY.md](ENTRY.md) for complete reads and [module_rules.md](research/module_rules.md)
for schema, limits, dependencies and failures.

## Which rules a session actually has (MANDATORY)

Do not infer instruction loading from folders an IDE can edit. Claude additional-directory
loading depends on host configuration; Codex has its own discovery chain. Before working in
another repository, run that repository's entry procedure. Prior context cannot be unloaded
by reading a new file. Conflicting host instructions require a fresh rooted session and
explicit reconciliation. Supported mechanisms are linked in [the plan](todo/PLAN_shared_rules_claude_codex.md).

Measured 2026-09-03: a session rooted in the frozen `ClaudeRag` checkout did a day of work in
`dew_flow_connect_other_ais` and committed with `git add -A` twice — the one thing
[git-workflow.md](common/git-workflow.md) rule 1 forbids by name. Nothing foreign was swept, because
that checkout happened to have no other session in it. That is luck, not method.

So, **before the first commit in any `dew_flow_*` tree, read that repository's own rules** rather than
assuming they are loaded:

```bash
cat AGENTS.md .agents/PROJECT.md
node .agents/conventions/tools/rules.mjs check --repo .
node .agents/conventions/tools/rules.mjs explain --repo . --task git
```

The rules that govern are the ones belonging to **the repository you are committing to**, never the
one the session was opened in. When they are not in your context, the fix is one `cat`, and the cost
of skipping it is a commit that breaks a rule written precisely because breaking it is expensive.

## Editing discipline (MANDATORY)

- Shared rules are edited **here and only here**. A consumer repository never carries its own copy of a
  shared rule — if a repo needs different behaviour, that difference is a named repo-local rule beside
  the mount, extending this one, never a divergent copy.
- **The rule-change author owns the six-consumer rollout.** Review the source change, choose its
  approved commit, then update each consumer through a migration/bump PR with validation and
  rollback recorded. Urgent fixes use the same explicit pin update. During staged rollout,
  old consumers retain their approved pins; do not move them to remote HEAD before verification.
- **`pin-check` reads the pin from HEAD, not from the index.** After
  `git submodule update --remote` + `git add`, it still reports STALE — the pin it compares is the one
  in the last commit. Only the commit makes it green. Do not read that first STALE as a second failure
  and start debugging the bump; run the check after committing, or not at all until then.
- **Bumping a pin moves that repository's tip, so a consumer that is ITSELF pinned goes stale.**
  `dew_flow_rag_qln` pins `external/dew_flow_mcp` and `external/dew_flow_benchmark`, so bumping the
  rules pin in those two repositories leaves rag_qln reporting two stale pins that have nothing to do
  with any rule. Measured 2026-08-26, both directions in one afternoon. Two consequences: do the
  pinned-BY repositories last, and — because those two are CODE pins, not rules — a bump there is a
  change to what rag_qln builds against, so it is subject to *never commit work you have not seen
  working* and needs its build run. A rules-pin bump never needs that; a code-pin bump always does.
  Do not treat them as the same chore because the same tool reports both.
- The habit is now also a check: [`tools/pin-check.mjs`](tools/pin-check.mjs) runs in every
  consumer's CI and fails while **any** submodule pin (this one, and `dew_flow_rag_qln`'s
  `external/dew_flow_mcp` alike) is not at its remote's tip. The 2026-08-19 audit found three
  consumers two commits behind — one missing `gpu-lease.md` entirely — which is why the pin has a
  check instead of an owner.
- Repo-specific policy moves to `.agents/PROJECT.md` and `.agents/rules/`; runtime settings
  stay in their host configuration. Never copy a policy body into both hosts' trees.
- **`main` is closed, here and in every consumer that protects it.** A change is a branch and a pull
  request, merged by rebase or squash; the automated reviewer's comments are verified and then fixed or
  answered before the merge — [common/pull-requests.md](common/pull-requests.md).
- **What the machinery reports is work, down to zero** — CodeRabbit, SonarCloud, Dependabot, secret and
  code scanning: verify, fix or answer with a reason, and when a fix would break the product, ask and
  change the rule rather than the number — [common/automated-checks.md](common/automated-checks.md).

## Consumers

| Repository | Kind |
|---|---|
| `dew_flow_rag_qln` | .NET |
| `dew_flow_mcp` | .NET, public |
| `dew_flow_sidecar_rust` | Rust — `csharp/` never matches; `rust/doctrine.md` is its doctrine |
| `dew_flow_benchmark` | .NET |
| `dew_flow_creds_for_devs` | TypeScript — a VS Code extension; `typescript/doctrine.md` is its doctrine, `csharp/` and `rust/` never match |
| `dew_flow_connect_other_ais` | .NET + TypeScript — the ConnectOtherAIs review gate: a C# AOT MCP server and a VS Code extension, so `csharp/` and `typescript/` both match |

A new repository joins with one `git submodule add` — see [ROLLOUT.md](ROLLOUT.md).

`settings/settings.json` remains the Claude settings reference. Preserve existing settings during
migration. Codex has a different schema; copying permissions into TOML does not produce equivalent
controls. Do not overwrite user/global/managed settings.

## `tools/` — the rules that check themselves

A rule nothing enforces is a rule that decays quietly. `common/planning-docs.md` described how to promote
a finished plan for as long as it existed, and by the time anyone counted, one repository had a plan
asking in writing to be moved and another had two promoted plans absent from its own index.

| Tool | Enforces | Run |
|---|---|---|
| [`tools/plan-lifecycle.mjs`](tools/plan-lifecycle.mjs) | [`common/planning-docs.md`](common/planning-docs.md) | `node .agents/conventions/tools/plan-lifecycle.mjs` |
| [`tools/pin-check.mjs`](tools/pin-check.mjs) | Editing discipline (pins at remote tips) | `node .agents/conventions/tools/pin-check.mjs` |
| [`tools/http-coverage.mjs`](tools/http-coverage.mjs) | [`common/http-contracts.md`](common/http-contracts.md) — every route has a request | `node .agents/conventions/tools/http-coverage.mjs [--warn]` |
| [`tools/http-run.mjs`](tools/http-run.mjs) | The same rule's other half — the suite actually runs, and its verdict is an exit code | `node .agents/conventions/tools/http-run.mjs [--tag prod] [--target <url>]` |
| [`tools/post-deploy-check.mjs`](tools/post-deploy-check.mjs) | [`common/post-deploy-checks.md`](common/post-deploy-checks.md) — the file's shape in CI, its items against the live target | `node .agents/conventions/tools/post-deploy-check.mjs [--target <value>]` |
| [`tools/gate-snippet-check.mjs`](tools/gate-snippet-check.mjs) | [`common/coai-review-gate.md`](common/coai-review-gate.md) is the ONLY copy — a consumer carrying its own is named | `node .agents/conventions/tools/gate-snippet-check.mjs [--warn]` |

The last three are new and every repository adopts them the same way: **`--warn` first**, so the
finding is visible without a red build, then the flag comes off once the backfill is done. A check
that goes red on the day it lands teaches people to switch it off.

The tools have their own tests — `npm test` from this repository's root, including existing cases
over fixtures whose right answers are known. Two of them exist because `common/testing.md` demands it:
the route scan has a companion asserting it still finds a route **formatted across three lines**, which
is exactly what a line-anchored scan silently loses, and the JUnit reader is asserted to call an
unreadable report INVALID rather than empty-and-green.

**One implementation, not one per repository.** A copy each would mean the same rule in two languages —
one of the four consumers is Rust — and `common/logging-serilog.md` already documents what that costs.
These checks read markdown rather than code, so nothing about them needs to be written twice. Node is on
every GitHub runner, so a Rust repository pays no toolchain for it.

A consumer wires it as one CI step, and its checkout needs `submodules: true` to have the file at all —
see [ROLLOUT.md](ROLLOUT.md).

The previous-generation `ClaudeRag` repository is **frozen**: its rules were the seed of these, but it
is not a source any more.
