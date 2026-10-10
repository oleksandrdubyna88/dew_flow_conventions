# PLAN — local test and build runs take at most 8 workers, at lowered CPU priority

> Status: **plan only, nothing implemented yet (2026-10-10).** Scope: a new shared rule and a
> priority wrapper tool here, the pin bump plus the local test scripts in every consumer, and the
> same rule in the corporate shared-rules repository and its consumers.
>
> Related docs: [csharp/dotnet-build.md](../csharp/dotnet-build.md),
> [PLAN_dotnet_build_node_reuse.md](../research/PLAN_dotnet_build_node_reuse.md),
> [common/measurement.md](../common/measurement.md), [README.md](../README.md).

## The symptom, measured

Measured 2026-10-10 on the owner's Windows machine (24 logical cores, several Claude Code sessions
open). One session ran `npm test`, which in that repository is `node --test "out/test/*.test.js"`.
Node's test runner sizes its pool from the machine (`os.availableParallelism() - 1` = **23**), so it
started 23 test-file processes at once. Each used about 0.7 of a core, the CPU sat at 100 %, and the
other Claude tabs and VS Code lagged until the suite finished. Nothing in any repository here sets a
pool size. A read-only inventory on 2026-10-10 found no `--test-concurrency`, no vitest `maxWorkers`,
no `xunit.runner.json`, no `RUST_TEST_THREADS` and no `.cargo/config.toml` in any of the seven
consumers. Every runner falls back to "one worker per CPU".

The family already bounds one pool. [csharp/dotnet-build.md](../csharp/dotnet-build.md) caps MSBuild
at `-m:4`. Test runners and the other build tools have no cap.

## What the measurements decide

The full record is [2026-10-10_windows_cpu_priority.md](../research/2026-10-10_windows_cpu_priority.md).
In short:

- **Lowering priority works on Windows, and children inherit it.** A process that sets itself to
  `BelowNormal` before it spawns passes that class to every child and grandchild. Measured three
  levels deep from bash, from pwsh 7 and from an npm script.
- **The share is decisive.** Two busy loops pinned to one core: Normal against Normal splits
  49.5/50.5; Normal against BelowNormal gives 99.1/0.9 and 100/0. Measured again by a second
  script: 89.2 % against 0.2 %.
- **Exit code and both streams survive** when the process lowers itself first and then runs the
  command with inherited stdio. A child exiting with 37 makes the wrapper exit with 37.
- **`start /belownormal` loses the exit code.** The child's 37 comes back as 0, reproduced. It is
  ruled out.
- **The interactive probe stays at its idle baseline.** A probe at normal priority runs a fixed
  ~2 ms task every 5 ms.

  | arm | probe task p99 |
  |---|---|
  | idle baseline | 4.7 / 3.8 ms |
  | 23 workers, normal priority | 9.7 / 15.0 ms |
  | 8 workers, normal priority | 5.8 / 11.3 ms |
  | 8 workers, lowered | 4.0 / 3.9 ms |

  Each arm ran twice, with another session's load in the background. Wall time was 5–9 s in every
  arm, and every test passed.
- **The cost lands on the lowered job, which is the intent.** When other work already saturates the
  machine, the lowered suite gets less CPU and finishes later. No test failed in any arm.
- **On WSL/Linux: `nice -n 19` works and nothing else here does.** Measured
  2026-10-09: 98.2 % against 1.4 % on one core.
  - `systemd-run --user --scope` with `CPUWeight` is counter-productive.
  - `SCHED_IDLE` is not recommended.
  - `dotnet build`, `publish`, `pack` and `run` need `--disable-build-servers`, or the build
    servers at nice 0 do the work.
  - An MTP test project is built first, then run as its executable under `nice`.

## What ships

### 1. Here — the rule, the tool, the record

| File | What |
|---|---|
| `common/local-cpu-budget.md` | New rule `common.local-cpu-budget`, `load: conditional`, `tasks: ["test","benchmark"]`, and `paths` on the files that configure a runner: `**/package.json`, `**/vitest.config.*`, `**/jest.config.*`, `**/xunit.runner.json`, `**/Cargo.toml`, `**/.cargo/config.toml`, `**/*.slnx`, `**/*.sln`. It says: at most 8 workers per local run, a runner table with the exact switch for each, lowered priority via the tool, CI exempt, and the never-list. It names no product, per [rule-ownership.md](../common/rule-ownership.md). |
| `tools/low-priority.mjs` | `node <mount>/tools/low-priority.mjs <command> [args…]`. See the contract below. |
| `tools/low-priority.test.mjs` | The tool's tests (see the test plan). |
| `research/2026-10-10_windows_cpu_priority.md` | The measurement record, its method and its scripts, inline. |
| `research/rule-bodies.json` | The new rule's entry, recorded with `node tools/rule-bodies.mjs --update common.local-cpu-budget`. |
| `package.json` | `"test": "node tools/low-priority.mjs node --test --test-concurrency=8"`. This repository's own suite follows the rule. |
| `README.md`, `research/module_rules.md`, `research/module_tests.md`, `research/README.md`, `todo/README.md` | The tools table, the module and test docs, and both indexes. |

**The tool's contract:**

- It lowers ITSELF, then spawns the command with inherited stdio, so every descendant inherits the
  priority. The level is `BelowNormal` on Windows and nice 19 elsewhere.
- It only ever lowers. A caller already at Idle or nice 19 stays there.
- Under `CI` it lowers nothing: CI is not throttled, per the owner.
- Its exit code is the child's. A signal that ends the child is re-raised. A missing command exits
  127 and says why.
- Terminating the wrapper does not orphan the child (plan round 1). `SIGINT`, `SIGTERM` and
  `SIGHUP` (plus `SIGBREAK` on Windows) are forwarded to the child, and the wrapper waits for it.
- A hard `TerminateProcess` of the wrapper alone cannot be forwarded on Windows without a Job
  Object. The rule names `taskkill /T /PID <pid>`, which ends the whole tree.
- On Windows it resolves `.cmd`/`.bat` shims (`npm`, `npx`, `vitest`) through `PATHEXT` and runs
  them via `cmd.exe` with quoted arguments. An `.exe` runs directly, and `node` is `process.execPath`.
- It exports `lowerOwnPriority()` for a node runner script that spawns its own workers.
- It has no dependencies, so a consumer needs no `npm ci` inside the mount.
- **Where CI does not check the mount out** (several consumers here; every corporate consumer: their CI never initialises it), a package.json script preloads a 10-line repository-local module with `node --import`. That module imports `lowerOwnPriority()` and treats a missing mount as CI. This is the delivery for a script; a copy of the tool is not, and the rule says so.

**Why a node tool and not a pwsh one:**

- Node is on every machine and runner in the family, and it is already the language of `tools/`.
- One file works unchanged from bash, pwsh 7, pwsh 5.1, cmd and npm scripts, and on Linux.
- The pwsh form (`(Get-Process -Id $PID).PriorityClass = 'BelowNormal'` in a child pwsh, then `&`
  the command) is measured and documented in the rule as the native alternative. It is pwsh 7
  first, 5.1 only when pwsh is absent. The Store build of pwsh 7 lives under
  `%LOCALAPPDATA%\Microsoft\WindowsApps`, not `%ProgramFiles%\PowerShell\7`, so the rule resolves
  `pwsh` on PATH rather than a fixed path.

**Builds.** MSBuild stays at `-m:4` from `csharp/dotnet-build.md`, which is stricter than 8. This
rule does not raise it, and says so.

### 2. The dew_flow consumers — one pull request each: pin bump plus the repository's own scripts

As of `origin/main`, 2026-10-10. Line numbers are from the read-only inventory.

| Repository | Mount | Change |
|---|---|---|
| connect_other_ais | `.agents/conventions` | `src_vs_code/scripts/run-tests.mjs` (`run()`, the `spawnSync(process.execPath, ['--test', …])` call) and `run-contract.mjs:49` get `--test-concurrency=8`, and their `main()` calls `lowerOwnPriority()` through a guarded import (a missing mount means CI: nothing is lowered). The existing `theBundleLoads.test.mjs`/`testDiscovery.test.mjs` style gets an assertion on the arguments. The four xUnit test projects get `maxParallelThreads: 8`. |
| creds_for_devs | `.claude/rules/shared` | `src_vs_code/package.json:57` `"test"` → `npm run compile && node --import ./scripts/lower-priority.mjs --test --test-concurrency=8 "out/test/*.test.js"`. The preload imports `lowerOwnPriority()` from the mount and treats a missing mount as CI, so the extension CI job is unchanged. The five xUnit test projects get the cap. |
| wsl_care | `.agents/conventions` | `src_vs_code/scripts/run-tests.mjs:55` the same as connect_other_ais. Its manifest test pins the change, and the xUnit projects get the cap. |
| rag_qln | `.claude/rules/shared` | `tools/vscode-extension/vitest.config.mts` gets `maxWorkers: 8`, and its `"test"` goes through the tool. `tools/wsl/build.sh:19` gets `-m:4 --disable-build-servers` under `nice -n 19`. `tools/wsl/test.sh` runs the exe under `nice -n 19`. Rag.Tests gets the cap. This repository goes last: it pins two others. |
| mcp, benchmark | `.claude/rules/shared` | The xUnit test projects get the cap. Pin bump. |
| sidecar_rust | `.claude/rules/shared` | `.cargo/config.toml`: `[build] jobs = 8` and `[env] RUST_TEST_THREADS = "8"`. Pin bump. |

**How the xUnit cap is delivered.** Each test project's own `xunit.runner.json` (or the
repository's `Directory.Build.props` linking one root file into every `*.Tests` project) sets
`"maxParallelThreads": 8`. Before a repository relies on it, I prove the runner reads the file: the
exe's `--diagnostic` output, or a probe test that records how many tests run at once.

The cap is per RUN, not per project (plan round 1). Several test executables running at once add up:
N of them at `maxParallelThreads: 8` is N × 8. So the rule says test executables run one after
another, and a script that starts several at once counts every one of them against the 8.

**Pins.** Each consumer's pull request moves its rules pin to the promoted `release` sha. The order
follows README *Editing discipline*: rag_qln goes last, and its code pins are bumped in the same
pull request with its build run.

### 3. The corporate rules repository and its consumers

Verified read-only on 2026-10-10 with `gh` (an account with org access) by reading every
non-archived repository's `.gitmodules`. Ten repositories pin the corporate rules repository at
`.claude/rules/shared`: SSO, loc-sim, project-tools, orchestrator, scoreMeter, access-server,
alert-center, llm-jira-estimates, email-service, knowledge_base.

Its own conventions, read 2026-10-10 from a fresh clone:

- **`common/` states contracts, never mechanics.** A command, library, config file or version
  belongs in a language layer (`typescript/`, `javascript/`, `csharp/`, `python/`, `php/`), and
  every such term is listed in `tools/mechanics-terms.txt`, which its PURITY check enforces.
  - So the cap and the "run below interactive work" contract go in `common/`.
  - The switches, the wrapper and `nice` go in the language layers.
- **No release branch.** A pin is a commit on `main`. The bump is `chore: bump conventions pin to
  <sha>`, in each consumer, in the same task.
- **Consumer CI never initialises the submodule.** Delivery to a script is therefore the
  repository-local preload with a guarded import, as above: in CI it lowers nothing, which is also
  the CI exemption.
- `main` is protected, needs the `conventions` check, and takes **0 approvals, so self-merge is
  allowed**.
- The deploy-on-push consumers (scoreMeter, orchestrator, llm-jira-estimates) squash pin bumps with
  `[skip ci]`. This rollout changes their scripts as well, so their pull requests run CI instead,
  and that is said in each pull request.

| Consumer | What it runs locally (default branch `main`, except orchestrator `master`) | Change |
|---|---|---|
| SSO | Next.js; `vitest run`, no cap | vitest `maxWorkers: 8`; `test` through the preload |
| loc-sim | node batteries, already sequential | `test` scripts lowered through the preload |
| project-tools | pnpm, jest `maxWorkers: 1`; `pnpm -r` | test/check scripts lowered. **Its PR title needs a ClickUp id** (an owner question) |
| orchestrator | vitest `fileParallelism: false`; a worker's `node --test` | `maxWorkers: 8`; the worker gets `--test-concurrency=8`; scripts lowered |
| scoreMeter | .NET, xUnit v2, `dotnet test` on the solution; ui `node --test` | `xunit.runner.json` `maxParallelThreads: 8`, `-m:8`; ui `--test-concurrency=8`; an xUnit file-reading test pins it |
| access-server | jest `maxWorkers: 1`; web vitest, `node --test`; mcp `tsx --test` | web vitest `maxWorkers: 8`; `--test-concurrency=8`; its runner-config spec pins it |
| alert-center | root jest without a cap; web vitest | jest `maxWorkers: 8`; vitest `maxWorkers: 8`; lowered |
| llm-jira-estimates | .NET, xUnit v2, `dotnet test` on the solution | `xunit.runner.json` cap, `-m:8` in its documented commands |
| email-service | Makefile; vitest (dataplane, frontend) without a cap; `node --test` | vitest `maxWorkers: 8`; `--test-concurrency=8`; `nice -n 19` in the Linux-only Makefile targets |
| knowledge_base | ui-template vitest without a cap; `node --test`; Blazor `dotnet test` | the caps per runner |

- Each consumer gets one PR with its pin bump and its own scripts.
- The work happens in fresh clones under `/tmp/orgmeter-concurrency-20261010T194657Z/`, driven by
  script files only.
- Each consumer's own CLAUDE.md wins in that repository.

## Build order

1. This plan, then the gate's plan round on it.
2. The tool and its tests, RED first: the tests exist before the tool does.
3. The rule, its `rule-bodies.json` entry, the research record, the docs.
4. `npm test`, `npm run check` and `node tools/ownership-check.mjs` pass. A code round, then a PR,
   CI, the review threads, and the merge.
5. Promote `release` through `promote-release` (the documented step) to the merge sha.
6. The consumers in the order: connect_other_ais, creds_for_devs, wsl_care, mcp, benchmark,
   sidecar_rust, then rag_qln. Each one gets a plan round, then a RED test, the change, a code
   round, a PR, CI and the merge.
7. The corporate repository, then its ten consumers.
8. This plan goes to `research/` with `IMPLEMENTED`, with its deviations and any open tail.

## Test plan

- `tools/low-priority.test.mjs`, run against a real child process:
  - Exit code 37 survives.
  - stdout and stderr stay separate and complete.
  - A child and a grandchild report the lowered priority (`os.getPriority`).
  - With `CI=true` the child keeps the parent's priority.
  - A caller already lower than the target is not raised.
  - A missing command exits 127 with a message.
  - No command prints the usage and exits 2.
  - Windows only: a `.cmd` shim on `PATH` gets an argument containing a space intact.
  - POSIX only: a `SIGTERM` to the wrapper ends the child as well (no orphan).
- Break-it (product code only): drop the `setPriority` call, and the inheritance case goes red. Pass
  `shell: true` without the quoting, and the space case goes red.
- Here: `npm test`, `npm run check`, `node tools/rule-bodies.mjs` and
  `node tools/ownership-check.mjs` stay green.
- Per consumer: that repository's own suite, plus the new assertion that pins its runner's arguments.
  The assertion is red before the change and green after.

## Definition of Done

- [ ] `common/local-cpu-budget.md` exists, recorded in `rule-bodies.json`, naming no product.
- [ ] `tools/low-priority.mjs` and its tests are merged. The Windows and Linux CI legs are green.
- [ ] The measurement record is in `research/`, dated, with numbers and method.
- [ ] `release` is promoted to the merge sha.
- [ ] Every dew_flow consumer is merged with its pin at that sha and its own scripts capped.
- [ ] The corporate rule is merged, and each of its consumers has a merged (or, where its rules
      forbid self-merge, an opened) PR.
- [ ] This plan is promoted to `research/` with `IMPLEMENTED <date>` and its deviations.
