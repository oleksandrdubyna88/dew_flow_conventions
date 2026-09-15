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
assuming they are loaded. For a migrated consumer, start with its `AGENTS.md` and
the entry it names, then run:

```bash
cat AGENTS.md .agents/PROJECT.md
node .agents/conventions/tools/rules.mjs check --repo .
node .agents/conventions/tools/rules.mjs explain --repo . --task git
```

An unmigrated consumer still uses its committed `CLAUDE.md` and `.claude/rules/` tree.
Read those until its migration lands; do not run neutral-layout commands there yet.
In this conventions source checkout the equivalent resolver is `tools/rules.mjs`.

The rules that govern are the ones belonging to **the repository you are committing to**, never the
one the session was opened in. When they are not in your context, the fix is one `cat`, and the cost
of skipping it is a commit that breaks a rule written precisely because breaking it is expensive.

## Editing discipline (MANDATORY)

- Shared rules are edited **here and only here**. A consumer repository never carries its own copy of a
  shared rule — if a repo needs different behaviour, that difference is a named repo-local rule beside
  the mount, extending this one, never a divergent copy.
- **The rule-change author owns the six-consumer rollout.** Review the source change, then **promote
  it**: `release` is the approved pin, and moving it is what publishes a rule. A commit on `main`
  reaches nobody until then. Each consumer is updated through a bump pull request with validation and
  rollback recorded; urgent fixes use the same explicit pin update.

  This paragraph used to end *"during staged rollout, old consumers retain their approved pins; do not
  move them to remote HEAD before verification"* — a policy `pin-check` could not implement, because
  it knew only the remote's live tip and had no concept of an approved pin. The check won and the
  policy was decoration. Now there is nothing to reconcile: a consumer that has not been bumped yet is
  simply behind `release`, and there is no other pin it could be at.
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
  consumer's CI and fails while **any** submodule pin is not at the tip of **the ref it tracks** —
  `submodule.<name>.branch` in that consumer's `.gitmodules`. The 2026-08-19 audit found three
  consumers two commits behind — one missing `gpu-lease.md` entirely — which is why the pin has a
  check instead of an owner.
- **Which ref a pin tracks is the whole difference between a check and a treadmill.** Until
  2026-09-14 every pin was compared against `ls-remote <url> HEAD`, so the expected value was this
  repository's LIVE tip resolved at CI run time — which made the check a function of somebody else's
  merge rather than of the pull request being checked. Measured over 29 days: main moved **95 times**,
  and each of those commits reddened every open pull request in six repositories at once; **317**
  pin-touching commits went downstream, a *majority* of all commits on main in two consumers. The
  shared rules track `release`, which moves when a rule author promotes a reviewed commit. **All six
  consumers follow it as of 2026-09-15**, so a commit on this repository's main now reddens nothing
  anywhere until somebody promotes it. A submodule that declares no `branch` is unaffected either way
  — git's own default for the unset key is the remote HEAD, which is what it was compared against
  before, and `dew_flow_rag_qln`'s two code pins go on using it.

  That last repository is where the behaviour was worth proving, because it mixes both kinds of pin
  and its CI now prints them judged separately in one run:

  ```
  pin-check: OK — 3 pin(s) at the tip of the ref each tracks (external/dew_flow_mcp → the default
  branch, .claude/rules/shared → release, external/dew_flow_benchmark → the default branch).
  ```
- **How `release` moves.** Through the `promote-release` workflow — the supported path, and while the
  ref is unprotected not the only possible one (see the gap below). It is
  `workflow_dispatch` only, so a merge to main never touches the ref. It takes a full 40-character
  sha and refuses it unless the commit is an ancestor of `main` **and** the `ci` run for that exact
  sha finished with conclusion `success` — an absent run and one still in progress are both refusals,
  because an unverified commit is what six repositories would then load. The judgement lives in
  [`tools/promote-release.mjs`](tools/promote-release.mjs) rather than in the YAML precisely so those
  refusals can be tested; thirty cases drive it.

  **Dispatch it against `main`, not against your branch.** The job refuses any other ref and checks
  out `refs/heads/main` explicitly: the checkout would otherwise take whatever ref the dispatch
  selected, so a branch carrying an edited `promote-release.mjs` could judge a main commit under
  rules nobody reviewed. A gate is only a gate if it is the one on main.

  **Rollback is a forward release**, not a rewind: revert the content on `main` and promote the new
  commit. There is no force input, and the push carries no `--force`, so git itself refuses a
  non-fast-forward move. Moving `release` backwards would make every consumer's committed pin differ
  from the tip at once — all six repositories red during the very incident the rollback exists to end
  — and would break every cached clone's `git submodule update --remote`.

  **And `release` is watched, because freezing it creates a silent failure of its own.** Once every
  consumer pins it and it stops moving, every pin equals its tracked tip and every `pin-check` is
  green — while the rules the family reads get older every week. That is the 2026-08-19 audit state
  recreated by design, with the alarm switched off.
  [`tools/release-distance.mjs`](tools/release-distance.mjs) runs weekly and **fails** past its
  bounds: 40 commits of distance, or a release commit 30 days old. Generous on purpose — a check that
  fires on an ordinary quiet week is a check people disable. The age bound is the one that matters:
  distance alone calls a repository healthy when nothing is being written *and* nothing published.
  It also refuses to measure at all when `release` is **not an ancestor of main** — a ref force-moved
  to something unrelated answers a small distance and a young age, so both metrics would report health
  while what consumers load is not on main's history. `promote-release` cannot produce that state; an
  unprotected ref and a hand-push can, and this is the only check that would ever look.

  **One trap on an existing clone, and `pin-check` now names it.** `git submodule update --remote`
  reads `submodule.<name>.branch` from `.git/config` **first**, and `git submodule sync` copies the
  url but not the branch — so a clone made before this rollout keeps following the default branch
  while CI follows `release`, and the bump lands at the wrong tip. `pin-check` reports
  `LOCAL OVERRIDE` with both values and the `git config --unset` that ends it.

  **Known gap, deliberately accepted (2026-09-14):** the ref has no server-side protection. Anyone
  with push rights can move `release` by hand and skip every check above. The workflow is the
  intended route, not an enforced one. Closing it needs a repository ruleset on `refs/heads/release`
  (deny direct and force pushes, bypass for the Actions actor) — settings rather than a file, which
  is why nothing in this tree can prove it.
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
| `dew_flow_creds_for_devs` | .NET + TypeScript — a VS Code extension over a C# broker, CLI and MCP server (one `.slnx`, seven projects), so `csharp/` and `typescript/` both match; `rust/` never does |
| `dew_flow_connect_other_ais` | .NET + TypeScript — the ConnectOtherAIs review gate: a C# AOT MCP server and a VS Code extension, so `csharp/` and `typescript/` both match |

A new repository joins with one `git submodule add` — see [ROLLOUT.md](ROLLOUT.md).

`settings/settings.json` remains the Claude settings reference. Preserve existing settings during
migration. Codex has a different schema; copying permissions into TOML does not produce equivalent
controls. Do not overwrite user/global/managed settings.

### The Claude host adapter is a hook, and that is not a preference

`ENTRY.md` is one loading procedure for two hosts, and `tools/lib/rule-cli.mjs` enforces the single
source: it refuses a `CLAUDE.md` that is anything but `@AGENTS.md`, and refuses a non-empty
`.claude/rules`. Those two are precisely the doors Claude Code loads project instructions through
**on its own** — no imports, no procedure, no cooperation from the model.

Shutting them is what makes one source true. It also means a Claude session starts holding an
instruction to go and read the rules rather than the rules. Measured in
`dew_flow_connect_other_ais` right after its migration: **561 bytes**, where `CLAUDE.md` (3 971 B)
and `.claude/rules/common/` (6 590 B) used to arrive by themselves. That is a change of kind rather
than of size — enforcement moved from the host to the model's diligence, and step 8 of the entry
requires the procedure again after every compaction.

So the third door carries it. `settings/hooks/load-instructions.mjs` runs the **same resolver Codex
is told to run, at the same pin**, with `read --task inspect` — what applies to every task — and
`SessionStart` output becomes session context. It does not replace the procedure and says so in its
own output: a session start cannot know which files the session will touch, so `explain`/`read` for
the real task is still owed. Without the submodule it reports loading INCOMPLETE in the entry's own
words and exits 0, because a hook that fails a fresh clone is a hook somebody deletes.

Copy `settings/settings.json` → `.claude/settings.json` (keeping that repository's own permissions)
and **every file under `settings/hooks/`** → `.claude/hooks/`, verbatim. There are two now:
`load-instructions.mjs` is the rules door above, and `build-flags.mjs` refuses a `dotnet build` that
does not bound its MSBuild worker pool ([`csharp/dotnet-build.md`](csharp/dotnet-build.md)) — the
half of that rule no file in the repository can enforce. `tools/adapter-check.mjs` compares every
one of them, because a copy nothing compares is a copy that quietly stops matching. This repository
runs both hooks on itself, which is the only test of the mechanism that cannot pass while the
mechanism is broken.

## `tools/` — the rules that check themselves

A rule nothing enforces is a rule that decays quietly. `common/planning-docs.md` described how to promote
a finished plan for as long as it existed, and by the time anyone counted, one repository had a plan
asking in writing to be moved and another had two promoted plans absent from its own index.

| Tool | Enforces | Run |
|---|---|---|
| [`tools/plan-lifecycle.mjs`](tools/plan-lifecycle.mjs) | [`common/planning-docs.md`](common/planning-docs.md) | `node .agents/conventions/tools/plan-lifecycle.mjs` |
| [`tools/pin-check.mjs`](tools/pin-check.mjs) | Editing discipline — every pin at the tip of the ref it tracks (`release` for the shared rules, its own default branch for a code pin) | `node .agents/conventions/tools/pin-check.mjs` |
| [`tools/promote-release.mjs`](tools/promote-release.mjs) | The `release` ref moves only to a commit that is on `main` and whose `ci` run finished green — an absent or unfinished run is a refusal, never a pass | `node tools/promote-release.mjs <sha> [--dry-run]` (this repository only) |
| [`tools/ownership-check.mjs`](tools/ownership-check.mjs) | [`common/rule-ownership.md`](common/rule-ownership.md) — no shared rule names a product, unless the name IS the instruction and says so in an `owns:` marker | `node tools/ownership-check.mjs [--warn]` (this repository only; **armed** — there is no baseline, so any undeclared product reference fails) |
| [`tools/rule-bodies.mjs`](tools/rule-bodies.mjs) | The other half of the body freeze — it records the body of the rules you NAME, so an edit nobody named stays a red suite | `node tools/rule-bodies.mjs` to verify, `node tools/rule-bodies.mjs --update <id>…` to record (this repository only) |
| [`tools/release-distance.mjs`](tools/release-distance.mjs) | The compensating detector: `release` is still being moved, and has not quietly stopped while every pin-check stays green | `node tools/release-distance.mjs [--warn]` (this repository only, weekly) |
| [`tools/adapter-check.mjs`](tools/adapter-check.mjs) | Every adapter hook `settings/` publishes is copied, wired on its own event and matcher, and byte-identical | `node .agents/conventions/tools/adapter-check.mjs` |
| [`tools/build-flags-check.mjs`](tools/build-flags-check.mjs) | [`csharp/dotnet-build.md`](csharp/dotnet-build.md) — the root `Directory.Build.rsp` exists, says `-nr:false`, and no workflow suppresses it | `node .agents/conventions/tools/build-flags-check.mjs` |
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
