---
id: "common.local-cpu-budget"
load: "conditional"
tasks: ["test","benchmark"]
paths: ["**/package.json","**/vitest.config.*","**/jest.config.*","**/playwright.config.*","**/xunit.runner.json","**/Cargo.toml","**/.cargo/config.toml","**/pyproject.toml","**/pytest.ini","**/*.slnx","**/*.sln"]
---
# Local test and build runs — at most 8 workers, at lowered CPU priority (MANDATORY)

> Measured 2026-10-10 on a 24-thread Windows workstation that runs several agent sessions at once.
> One session's `npm test` was a plain `node --test`, and node sized its pool from the machine
> (`os.availableParallelism() - 1`). It started **23** test-file processes, each using about 0.7 of
> a core. The CPU sat at 100 % until the suite ended, and every other session and the editor lagged.
> Nothing was wrong with the suite. The runner's default assumes the machine belongs to it, and here
> it never does.
>
> The record behind every number below is
> [2026-10-10_windows_cpu_priority.md](../research/2026-10-10_windows_cpu_priority.md).

## 1. At most 8 workers per local run (MANDATORY)

Every local test or build run sets its worker count explicitly, at **8 or fewer**. A runner's
default is "one worker per CPU", so leaving it unset is how one session takes the whole machine.

**Every one of these switches is an EXACT number, not a ceiling.** A bare 8 RAISES a machine with
fewer threads: measured 2026-10-11 by one consumer, a 4-vCPU CI runner went from 3–4 workers to 8. So
the cap is written as `min(8, the runner's own default)` wherever the value can be computed, and kept
off CI where it cannot.

| Runner | Where the cap goes |
|---|---|
| `node --test` | `--test-concurrency=N` with `N = max(1, min(8, os.availableParallelism() - 1))`, computed in the runner script that spawns `node --test`; a literal 8 only in a script CI never runs |
| vitest | `maxWorkers: Math.max(1, Math.min(8, availableParallelism() - 1))` in its config |
| jest | `maxWorkers: Math.max(1, Math.min(8, os.availableParallelism() - 1))` in a JS config |
| Playwright | `workers: Math.max(1, Math.min(8, os.availableParallelism() - 1))` in its config |
| pytest-xdist | `-n 8` in the documented local command, never `-n auto`, and never in an `addopts` CI also reads |
| xUnit v3 (MTP executable) | `"maxParallelThreads": 8` in the project's `xunit.runner.json`, **plus** `<Content Include="xunit.runner.json" CopyToOutputDirectory="PreserveNewest" Condition="'$(CI)' != 'true'" />`. Measured on xunit.v3 4.0.1: a file that is not copied to the output is never read, and the runner stays at one thread per CPU. The condition keeps CI at its own count: GitHub Actions sets `CI=true` exactly. A CI that sets another value needs its own condition. |
| cargo | `-j 8` and `-- --test-threads=8` in the documented local commands. A `.cargo/config.toml` (`[build] jobs`, `[env] RUST_TEST_THREADS`) caps correctly (measured: 20 at once, then 8), but it also applies to CI and raises a small runner. |
| MSBuild / `dotnet build` | `-m:4`, per [dotnet-build.md](../csharp/dotnet-build.md). Stricter than 8, and this rule never raises it. |

- **The cap is per RUN, not per project.** Run test executables one after another. A script that
  starts N of them at once runs N × their thread count, and all of it counts against the 8.
- **8 is a ceiling, not a target.** A suite that is correct at 8 is correct at 4, and a suite that
  needs more than 8 to pass has a timing dependency that is a defect of its own.
- **A test that pins the runner's arguments pins this too.** Where a repository asserts its own
  `test` script or its runner's spawn arguments, the cap belongs in that assertion — for xUnit,
  the Content item with its copy metadata, not only the JSON value.

## 2. At lowered CPU priority (MANDATORY)

The 8 workers run below the interactive work. Lowering is what keeps the machine usable when
several sessions each run 8.

**The one command — Windows, Linux and WSL, from bash, pwsh, cmd or an npm script:**

```bash
node <conventions>/tools/low-priority.mjs <command> [args...]
node <conventions>/tools/low-priority.mjs node --test --test-concurrency=8
node <conventions>/tools/low-priority.mjs npm run build
```

`<conventions>` is wherever this repository is mounted. The tool sets ITSELF to BelowNormal
(Windows) or nice 19 (elsewhere) and then runs the command. Every descendant inherits the lowered
priority. The command's exit code, stdout, stderr and signals come back unchanged. It never raises
a priority, and it has no dependencies.

**A node runner script that spawns its own workers** lowers itself before it spawns them, with
`await import('./lower-priority.mjs')` — the same preload copy as below, imported rather than
preloaded — so it needs no wrapper.

**A package.json script that CI also runs** cannot name a file inside the mount when CI does not
check the mount out. So it preloads `scripts/lower-priority.mjs`, a verbatim copy of
[`tools/templates/lower-priority-preload.mjs`](../tools/templates/lower-priority-preload.mjs). Its
one `MOUNT` line is edited to the repository's mount path, and it imports `lowerOwnPriority()` from
there:

```json
"test": "node --import ./scripts/lower-priority.mjs ./node_modules/vitest/vitest.mjs run"
"test": "node scripts/run-tests.mjs"
```

The vitest cap lives in its config (§1). A bare `node --test` cannot compute `min(8, …)` on its
command line, so it moves into a runner script that does. A literal `--test-concurrency=8` in a
script CI also runs raises a small runner. Keep it only if that raise was measured and found
harmless: one consumer measured 6 m 39 s against 6 m 52 s on its CI.

- **Only an absent mount falls back.** Absent means the folder is missing or empty: an
  uninitialised submodule leaves an empty folder, and that is CI's normal state. Nothing is lowered
  then, and one notice is printed when `CI` is not set.
- **Every other case fails the run.** A mount with content but no tool is a stale checkout, and a
  tool that does not load is broken. `tools/lower-priority-preload.test.mjs` pins every case.
- `--import` reaches every worker `node --test` starts, and lowering twice is harmless.
- The preload holds no priority logic; the one implementation stays in the tool.
- A change to the template ships to every copy in the same rollout that bumps the pin.

**Measured, on one core:**

| Arms | Shares |
|---|---|
| Normal against Normal | 49.5 / 50.5 |
| Normal against BelowNormal | 99.1 / 0.9 and 100 / 0 |
| `nice 0` against `nice 19` (WSL) | 98.2 / 1.4 |

**An interactive probe, during a real suite:**

| Run | Probe's p99 |
|---|---|
| idle | 3.8–4.7 ms |
| 23 workers, normal priority | 9.7–15.0 ms |
| 8 workers, lowered | 3.9–4.0 ms |

Wall time was the same in every arm. When other work already saturates the machine, the lowered
suite finishes later — that is the point: the cost lands on the batch job, not on the person.

**A deadline that fires in a lowered run on a saturated machine may be starvation, not a defect.**
Measured the same day, on one suite of 249 tests with 5–30 s wall-clock deadlines:

- 7 deadline failures in a lowered run while other sessions kept the CPU at 100 %;
- 0 failures in both a lowered and a normal run at 64–76 % load, an hour later.

So diagnose before you debug:

- Re-run the failing file at BOTH priorities under the same load.
- A failure that also appears at normal priority is a defect.
- One that appears only lowered, and only on a saturated machine, is the machine.

Never raise the script's priority, or a test's deadline, to make a saturated machine look green.

**Shell-native equivalents**, when the tool is out of reach:

- **pwsh**: `pwsh -NoProfile -Command "(Get-Process -Id $PID).PriorityClass = 'BelowNormal'; & <command>; exit $LASTEXITCODE"`.
  The shell lowers itself and then starts the command, so the command inherits. Resolve `pwsh`
  from PATH: the Store build of PowerShell 7 lives under `%LOCALAPPDATA%\Microsoft\WindowsApps`,
  not `%ProgramFiles%\PowerShell\7`. Use `powershell` (5.1) only where pwsh 7 is absent.
- **Linux / WSL**: `nice -n 19 <command>`. **Not Git Bash on Windows:** its `nice` maps onto
  Windows priority classes, and `nice -n 19` there is the Idle class, which the never-list forbids
  (measured 2026-10-11: `nice -n 19` → 19, `nice -n 10` → BelowNormal). On Windows use the tool, or
  `nice -n 10` in a script that must stay in bash.
- **Every OS:** a lowered `dotnet build`, `publish`, `pack` or `run` adds `--disable-build-servers`.
  Otherwise a long-lived build server started earlier at normal priority does the compiling for
  the lowered build. Measured on Linux with nice 0 servers (2026-10-09), and on Windows by one
  consumer, where a Normal-priority VBCSCompiler compiled for the lowered builds (2026-10-11).
  - An MTP test project is built first, then its test executable runs under `nice`. `dotnet test`
    takes no `--disable-build-servers`.

**Ending a lowered run.** Ctrl+C reaches the whole tree. A background run is ended through the pid
you started, and never by image name:

- **Windows:** `taskkill /T /PID <pid>`.
- **Elsewhere:** `SIGTERM` to that pid. The tool forwards it to the child's whole process group.
- **`SIGKILL`** cannot be forwarded. After a `kill -9` of the wrapper, end the child's group
  yourself: `kill -- -<child pid>`.

## 3. CI is exempt

A CI runner is a dedicated machine with nobody at it.

- The tool lowers nothing when `CI` is set.
- **A cap must not RAISE a runner.** It is not a no-op on a small machine — the switches are exact
  values (§1). Write `min(8, default)`, condition the xUnit copy on `CI`, and keep cargo's caps in
  the local commands.
- Never add throttling to a CI job unless that runner itself needs it, and then say why in the
  workflow.

## Never

- Never leave a local runner at its default worker count.
- Never use `start /belownormal` to lower a command: measured, the child's exit code 37 came back
  as **0**.
- Never use the Idle class, `SCHED_IDLE` or `systemd-run --user --scope` with `CPUWeight`. The first
  two risk starving a suite into timeouts. The third was measured to be counter-productive.
- Never lower a process after it has started its workers. The ones already running keep their
  priority. Lower first, then spawn.
- Never run several test executables in parallel and count only one of them against the cap.
- Never write a bare 8 where CI runs it. Measured: it RAISES a 4-vCPU runner.
- Never cap xUnit with a JSON file that is not copied to the output. Measured: it is never read.

## Definition of Done

- [ ] Every local test and build entry point (package.json scripts, runner configs, runner scripts,
      shell scripts) sets a worker count of 8 or fewer.
- [ ] Every one of them runs lowered: through `tools/low-priority.mjs`, `lowerOwnPriority()` (called
      directly or from a repository-local `--import` preload), or `nice -n 19` in a POSIX-only script.
- [ ] Where the repository pins its test script or runner arguments in a test, the pin covers the
      cap.
- [ ] No CI job was throttled.
