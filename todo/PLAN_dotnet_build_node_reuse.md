# PLAN — bound the MSBuild node pool that agent builds leave behind

> Status: **in progress, 2026-09-11** — the rule, its enforcing hook and the two checks are on
> `feat/dotnet-build-node-reuse`; the five-consumer rollout and the pin cascade are still open.
> Scope: `csharp/dotnet-build.md`, `settings/hooks/build-flags.mjs`, `tools/build-flags-check.mjs`,
> `tools/adapter-check.mjs`, and a `Directory.Build.rsp` in every .NET consumer.
>
> Related docs: [csharp/doctrine.md](../csharp/doctrine.md), [common/testing.md](../common/testing.md),
> [common/measurement.md](../common/measurement.md), [README.md](../README.md).

## The symptom, measured

On the operator's machine, 2026-09-11, WSL Ubuntu (24 logical CPUs, 44 GB RAM, SDK 10.0.112):

```
72 processes:  dotnet /usr/lib/dotnet/sdk/10.0.112/MSBuild.dll /nodemode:1 /nodeReuse:true /low:false
total RSS:     10 775 MB
```

A quarter of the machine, held by build workers nobody was using, next to Postgres, Docker and a
running e2e suite. Windows showed the same shape at a smaller scale (9 nodes, 930 MB, from two
sessions). The second WSL distribution, Ubuntu-26.04, has no .NET installed and was clean — the
problem belongs to the machine that builds, not to WSL.

`scoreMeter` — the repository those nodes came from — has **13 `.csproj` in one `src/ScoreMeter.slnx`**,
so one build opens a pool of about twelve workers at roughly 150 MB each.

## Why the nodes are not reused — established, not assumed

The open question in the original report was why later builds did not reuse the existing set.
Measured with a throwaway 8-project solution, leaving the ambient pool untouched:

| arm | new nodes retained |
|---|---|
| 3 builds **sequential**, default flags | **0** — reuse works perfectly |
| 3 builds **concurrent**, default flags | **+14 nodes, +1.9 GB** |
| 3 builds concurrent, `-nr:false` | **0** |
| 3 builds concurrent, `-m:4 -nr:false` | **0** |

A node busy in another build cannot be reused, so every concurrent build opens its own pool and the
total ratchets up to the high-water mark of simultaneous demand. That machine runs **five autonomous
Claude sessions** at once; five pools of twelve at ~150 MB is the 10.5 GB, and it is not a bug in
MSBuild. C# Dev Kit is not the source — it has its own separate `BuildHost` process, which confirms
the original report's conclusion.

The pool is a high-water mark, not an unbounded leak: with builds stopped it decayed 72 → 36 → 24 →
18 → 7 → 0 over about fifty minutes on MSBuild's idle timeout. That is the wrong direction of help —
the memory comes back exactly when it is no longer needed and is held for the whole working day.

## The two flags do different jobs

Full rebuild of a real 12-project solution, peak sampled every 250 ms, counting only the nodes each
build created:

| arm | wall | peak nodes | peak RAM | retained |
|---|---|---|---|---|
| default | 19.1 s | 11 | 1222 MB | 11 |
| `-nr:false` | 12.3 s | 11 | 1485 MB | **0** |
| **`-m:4 -nr:false`** | **12.6 s** | **3** | **365 MB** | **0** |

- `-nr:false` removes the **tail** — what the build leaves behind.
- `-m:4` removes the **peak** — and the peak never expires, so against "it ate 20 GB" this is the
  larger half.
- Neither costs wall time. `-m:4 -nr:false` was the fastest arm measured, twice.

## The delivery problem, and the measurement that settles it

A rule that says *type these flags* is obeyed by whoever reads it; on the machine in question the
build command is written by five autonomous agents. So the question is what can be enforced by a file.

| delivery | peak nodes | peak RAM | retained |
|---|---|---|---|
| control: nothing | 11 | 1222 MB | 11 |
| **command line `-m:4 -nr:false`** | **3** | **365 MB** | **0** |
| `Directory.Build.rsp` = `-m:4 -nr:false` | 11 | 1225 MB | **0** |
| `Directory.Build.rsp` = `-m:4` | 11 | 1232 MB | 11 |
| env `MSBUILDMAXCPUCOUNT=4` | 11 | 1237 MB | 11 |
| env `MSBUILDDISABLENODEREUSE=1` | 11 | 1212 MB | **0** |

Two facts come out of this, and the second one shapes the rule:

1. **`-nr:false` can be enforced by a file.** `Directory.Build.rsp` is read by `dotnet build`,
   `restore`, `msbuild` and `pack`, on Windows and on Linux, and is discovered by walking up from the
   directory of the **project or solution being built** — never from the current directory. Measured
   with a negative control and reproduced run-to-run: an rsp at the repository root applies even when
   the build is launched from an unrelated directory by absolute path, and an rsp sitting in the
   current directory that is not an ancestor of the project is not read at all. So one file at a
   repository root covers every invocation from anywhere. Proven twice on a real solution: control
   retained 11 and 12 workers, the rsp arms retained zero.

   *(An earlier draft of this plan said "walking up from the current directory". That was wrong and
   is recorded here because the corrected fact is the stronger one — the rule's promise does not
   depend on where anyone stands when they type the command.)*
2. **`-m` cannot be enforced by a file at all.** Neither the response file nor an environment variable
   moves the peak. `dotnet build` always injects its own `-maxcpucount`, and the command line beats the
   response file — measured directly: rsp `-nr:false` + command-line `-nr:true` retained 11 nodes, so
   the command line wins.

CI is therefore not trapped by the file — but **not** via the escape hatch this plan first proposed.
`-noautorsp`, `-noAutoResponse` and `/noautoresponse` each make `dotnet` ignore the response file
*entirely* (proven with a deliberately invalid switch in the rsp — without them the build dies with
MSB1001, with them it succeeds), which also discards `-nr:false` and leaves a persistent runner
accumulating the very workers this exists to prevent. The review gate caught that, and the rule now
forbids it: a runner that wants the whole machine passes `-m` on the command line, which already
overrides the file — measured directly, an rsp saying `-nr:false` with `-nr:true` typed on the
command line retained 11 workers.

One more measured correction, from the same round: **`dotnet restore` is not exempt.** With no flags
it peaked at 11 workers and retained all 11 on the 12-project solution — the same as a full build. It
does not compile; it opens the pool to evaluate the projects. The hook's first draft exempted it on
exactly that reasoning and was wrong.

## What ships

Three stories on this branch, each committed, reviewed and documented before the next begins.

| # | Story | What it delivers |
|---|---|---|
| 1 | The rule and the guard that enforces it | `csharp/dotnet-build.md` (path-scoped to `**/*.slnx`, `**/*.sln`, `**/Directory.Build.rsp`, and deliberately **no** `tasks` — both narrowings are read-budget decisions, measured; see below) plus `settings/hooks/build-flags.mjs`, the `PreToolUse` guard that refuses an unbounded command and names the flag, wired in `settings/settings.json` and self-hosted here |
| 2 | The rollout is verifiable | `tools/build-flags-check.mjs` — the root `Directory.Build.rsp` exists, says `-nr:false`, carries no inert `-m`, and no workflow suppresses the file; a repository with no C# passes without an opinion |
| 3 | The guard cannot drift unseen | `tools/adapter-check.mjs` generalised over every hook event and every file under `settings/hooks/`, so a consumer that copies the settings without the guard, or edits its copy, is a finding |

The rule states, with the measurements above as its evidence: the root `Directory.Build.rsp`; `-m:N`
on every MSBuild-driven command including `restore`; that `-m` in a file or an environment variable is
measured to do nothing; that `-noautorsp` is forbidden because it discards `-nr:false` with it; the
`VBCSCompiler` floor (one per SDK, 486 MB in WSL, 241–332 MB on Windows) and that only
`dotnet build-server shutdown` clears it — which is never routine on a shared machine; and that the
idle timeout returns the memory only after the work has stopped.

It also states **where the guard does not reach**, which is the honest half of the gate's top
finding: the hook runs only in a Claude Code session in a repository that has copied the adapter. No
consumer has, yet. A Codex session, a human at a terminal and CI have the rule's word only.

### The read budget is the binding constraint, and it is nearly spent

The rule's `paths` are narrower than the obvious choice, and the reason is measured. `rules.mjs read`
refuses a selected payload over **32 KiB**. On `origin/main`, before this rule exists:

| scope | payload | headroom |
|---|---|---|
| a `.cs` file | 27 800 B | 4 968 B |
| a `.csproj` | 31 173 B | **1 595 B** |
| a `.razor` | 27 800 B | 4 968 B |

The first draft matched `**/*.cs`, `**/*.razor` and `**/*.csproj` at 7 816 B and put every one of
those scopes over the ceiling. That is not a theoretical cost: the real-agent migration test
(`tools/migrate-rules.test.mjs`) spawns a Claude session which reads the selected rules for
`src/fixture.cs`, and it went red — `status: incomplete`, `exitCode: 1`, every read `complete: false`,
zero trace bytes. It had passed on an earlier run of the same tree, which is exactly how a payload
regression hides.

The rule is now 5.2 KB and matches `**/*.slnx`, `**/*.sln` and `**/Directory.Build.rsp` only, which
leaves every scope under the ceiling. Nothing is lost, because neither half of the rule depends on
its text being in context: `-m:N` is enforced by the `PreToolUse` guard whatever was loaded, and the
response file by `build-flags-check` in CI.

**For [PLAN_product_improvements.md](PLAN_product_improvements.md), not for this branch:** a `.csproj`
scope has 1 595 B of headroom, so the next C#-project rule anyone writes cannot fit either. The
constraint is the always-core plus `csharp.doctrine` plus `csharp.nuget-packages`, not this rule.

### The open tail — `Directory.Build.rsp` in every .NET consumer

Measured baseline, 2026-09-11, `build-flags-check` run from each repository root:

| repository | today |
|---|---|
| `dew_flow_rag_qln` | FAILED — no `Directory.Build.rsp` |
| `dew_flow_mcp` | FAILED — no `Directory.Build.rsp` |
| `dew_flow_benchmark` | FAILED — no `Directory.Build.rsp` |
| `dew_flow_creds_for_devs` | FAILED — no `Directory.Build.rsp` (it is .NET **and** TypeScript) |
| `dew_flow_connect_other_ais` | FAILED — no `Directory.Build.rsp` |
| `dew_flow_sidecar_rust` | nothing to check — no C# |
| `dew_flow_conventions` | nothing to check — no C# |

One two-line file each, in its own branch and pull request per repository, per
[common/task-lifecycle.md](../common/task-lifecycle.md), with the CI step that runs the check in the
same commit. Also in the tail: extending the guard to `dotnet test` is deliberately **not** done here
— this family forbids that command in [common/testing.md](../common/testing.md), and enforcing
another rule from this hook widens a review that should stay about one thing.

### The pin cascade

Per [README.md](../README.md) the rule-change author owns the rollout: bump the conventions pin in
every consumer, doing the pinned-BY repositories (`dew_flow_rag_qln`) last.

## Build order

1. Worktree + branch off `origin/main` (done before this plan was written).
2. This plan in `todo/`, registered in `todo/README.md`.
3. `csharp/dotnet-build.md`.
4. `npm ci --ignore-scripts`, `npm test`, `npm run check` — the rule must be selectable and must not
   break the resolver's schema or budget.
5. A test that the new rule is discovered, alongside the existing assertions in `tools/rules.test.mjs`.
6. Pull request, reviewer threads, merge.
7. The rsp files and the pin cascade, as separate pull requests per repository.

## Test plan

- `npm test` — the resolver's own suite, including the new-rule assertion.
- `npm run check` — `rules.mjs check --repo .` resolves with the new file present.
- `node tools/rules.mjs explain --repo . --task implement --file src/X.csproj` selects
  `csharp.dotnet-build`, and the same command with a `.ts` file does not.
- `node tools/plan-lifecycle.mjs` — this plan is in `todo/`, has a status line, and `todo/README.md`
  matches the folder.
- The behavioural claims in the rule are already measured; the rule's own numbers are not re-derived
  by a test, they are cited with their conditions.

## Definition of Done

- [ ] `csharp/dotnet-build.md` exists with valid frontmatter and is selected for `.csproj`/`.slnx`.
- [ ] `todo/README.md` lists this plan.
- [ ] `npm test`, `npm run check` and `plan-lifecycle` are green.
- [ ] The rule states what a file CAN enforce and what it cannot, with the measurement that shows it.
- [ ] The pull request is merged by its author, with every check green and every thread resolved.
- [ ] The `Directory.Build.rsp` rollout and the pin cascade are either done or recorded as the plan's
      open tail.
