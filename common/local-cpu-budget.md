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

| Runner | Where the cap goes |
|---|---|
| `node --test` | `--test-concurrency=8` on the command line, including inside a runner script that spawns `node --test` |
| vitest | `maxWorkers: 8` in its config, or `--maxWorkers=8` |
| jest | `--maxWorkers=8` |
| Playwright | `workers: 8` in its config |
| pytest-xdist | `-n 8`, never `-n auto` |
| xUnit v3 (MTP executable) | `"maxParallelThreads": 8` in the project's `xunit.runner.json`, or `--max-threads 8` |
| cargo | `.cargo/config.toml`: `[build] jobs = 8` and `[env] RUST_TEST_THREADS = "8"` |
| MSBuild / `dotnet build` | `-m:4`, per [dotnet-build.md](../csharp/dotnet-build.md). Stricter than 8, and this rule never raises it. |

- **The cap is per RUN, not per project.** Run test executables one after another. A script that
  starts N of them at once runs N × their thread count, and all of it counts against the 8.
- **8 is a ceiling, not a target.** A suite that is correct at 8 is correct at 4, and a suite that
  needs more than 8 to pass has a timing dependency that is a defect of its own.
- **A test that pins the runner's arguments pins this too.** Where a repository asserts its own
  `test` script or its runner's spawn arguments, the cap belongs in that assertion.

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

**A node runner script that spawns its own workers** calls the tool's exported
`lowerOwnPriority()` before it spawns them, so it needs no wrapper.

**A package.json script that CI also runs** cannot name a file inside the mount when CI does not
check the mount out. So it preloads `scripts/lower-priority.mjs`, a verbatim copy of
[`tools/templates/lower-priority-preload.mjs`](../tools/templates/lower-priority-preload.mjs). Its
one `MOUNT` line is edited to the repository's mount path, and it imports `lowerOwnPriority()` from
there:

```json
"test": "node --import ./scripts/lower-priority.mjs --test --test-concurrency=8"
"test": "node --import ./scripts/lower-priority.mjs ./node_modules/vitest/vitest.mjs run"
```

- **Only an absent mount falls back.** That is CI's normal state: nothing is lowered, and one notice
  is printed when `CI` is not set. A mount that is present but broken fails the run.
  `tools/lower-priority-preload.test.mjs` pins all four cases.
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
- **Linux / WSL**: `nice -n 19 <command>`.
  - `dotnet build`, `publish`, `pack` and `run` add `--disable-build-servers`. Otherwise
    long-lived build servers started at nice 0 do the compiling.
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
- A cap of 8 is a no-op on a runner with 8 or fewer cores.
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

## Definition of Done

- [ ] Every local test and build entry point (package.json scripts, runner configs, runner scripts,
      shell scripts) sets a worker count of 8 or fewer.
- [ ] Every one of them runs lowered: through `tools/low-priority.mjs`, `lowerOwnPriority()` (called
      directly or from a repository-local `--import` preload), or `nice -n 19` in a POSIX-only script.
- [ ] Where the repository pins its test script or runner arguments in a test, the pin covers the
      cap.
- [ ] No CI job was throttled.
