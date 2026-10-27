# Lowered CPU priority on Windows — what works for a whole process tree, measured 2026-10-10

> Status: **measurement record, 2026-10-10.** It is the evidence behind
> [common/local-cpu-budget.md](../common/local-cpu-budget.md) and
> [tools/low-priority.mjs](../tools/low-priority.mjs). The WSL/Linux half was measured on
> 2026-10-09 in a sibling repository's `research/2026-10-09_cpu_fairness.md`; its conclusions are
> restated in the rule, and its numbers are not re-measured here.

## The question

The test runners leave one session taking the whole machine; the symptom is in
[the plan](PLAN_local_cpu_budget.md). Capping the worker count is half the answer. The other
half is a way to run those workers BELOW interactive work. That way must:

1. really lower the priority of the whole process tree: children and grandchildren too, not only
   the first process;
2. preserve the exit code, stdout and stderr;
3. work from bash (Git Bash), pwsh 7 and npm scripts.

## The machine and its conditions

| | |
|---|---|
| CPU | AMD Ryzen AI 9 HX 370: 12 cores, 24 logical processors |
| OS | Windows 11 Pro 10.0.26300 |
| Node | 24.18.0 |
| PowerShell | 7.6.4, the Microsoft Store build: `%LOCALAPPDATA%\Microsoft\WindowsApps\pwsh.exe`; `%ProgramFiles%\PowerShell\7` does not exist |
| Background load | Several other agent sessions were live throughout. Whole-machine busy time during the runs was 51–100 %. |

**Observed, not investigated:** during the runs, Microsoft Defender (`MsMpEng`) alone used about
3.5 cores of background load.

Because of that background load, the absolute numbers below are noisy. The **shares** and the
**differences between arms** are what the record relies on. Every arm was repeated, and the arms
were interleaved rather than run in blocks.

## M0 — which methods keep the exit code and reach the grandchild

Each method ran `tree.js`. That script prints its own `os.getPriority(0)`, spawns a child that does
the same, which spawns a grandchild, and then exits 37. On Windows, node maps the priority classes
onto the nice scale: Normal 0, BelowNormal 10, Idle 19.

| Method | Started from | levels 0 / 1 / 2 | Exit code |
|---|---|---|---|
| none (control) | bash | 0 / 0 / 0 | 37 |
| node wrapper: `os.setPriority(0, BELOW_NORMAL)`, then `spawnSync(cmd, {stdio: 'inherit'})` | bash | 10 / 10 / 10 | **37** |
| the same, `--idle` (`PRIORITY_LOW`) | bash | 19 / 19 / 19 | **37** |
| the same, inside an npm script | `npm run` | 10 / 10 / 10 | **37** |
| the same, wrapping `npm run`, which runs node | `npm run` → wrapper → `npm run` | 10 / 10 / 10 | **37** |
| the same | pwsh 7 | 10 / 10 / 10 | **37** |
| child pwsh lowers ITSELF, then `& node …` | pwsh 7 | 10 / 10 / 10 | **37** |
| `cmd /c start /belownormal /wait /b node …` | pwsh 7 | 10 / 10 / 10 | **0** |

- stdout and stderr stayed separate and complete in every wrapped case.
- `start /belownormal` lowers the tree and **loses the exit code**. A suite that failed would report
  success, so the method is ruled out.

**Why lowering yourself first is the method.** Windows gives a child created without a priority
flag the parent's class when that class is BelowNormal or Idle (`CreateProcess`, *dwCreationFlags*).
libuv passes no priority flag. So a process that lowers itself before it spawns lowers everything
it spawns afterwards, with no race against children that already started. POSIX gets the same
result from `fork` carrying the nice value. Lowering a process from outside after it started gives
neither guarantee.

### M0b — a second, independent script (`win-priority-measure.ps1`, run at ~18:45 by another session)

| Check | Result |
|---|---|
| **M1:** two node busy loops pinned to core 0 for 10 s, one Normal, one under a pwsh wrapper that lowered itself (`(Get-Process -Id $PID).PriorityClass = 'BelowNormal'`, then node through `-EncodedCommand`) | Normal **89.2 %** of the core, BelowNormal **0.2 %** |
| **M2:** wrapper, child and grandchild | all BelowNormal: inherited at creation, no race |
| **M3:** node exiting 37 under the same wrapper | the wrapper exited **37** |

## M1 — two busy loops on one core

Two node loops count iterations over the same 8-second window. Their start time is fixed in
advance, so the affinity can be set before either begins. Both are pinned to logical processor 22.
The lowered loop is started through the node wrapper, and it is the wrapper's child that gets
pinned.

| Arm | Repeat | Class A | Class B | Share A | Share B | Core used |
|---|---|---|---|---|---|---|
| normal vs normal | 1 | Normal | Normal | 49.5 % | 50.5 % | 101.7 % |
| normal vs normal | 2 | Normal | Normal | 49.9 % | 50.1 % | 97.2 % |
| normal vs below | 1 | Normal | BelowNormal | 99.1 % | 0.9 % | 83.8 % |
| normal vs below | 2 | Normal | BelowNormal | 100.0 % | 0.0 % | 69.0 % |
| normal vs idle | 1 | Normal | Idle | 98.6 % | 1.4 % | 69.4 % |
| normal vs idle | 2 | Normal | Idle | 100.0 % | 0.0 % | 77.0 % |

- **Core used** is the two loops' total, measured against a solo loop's rate on the same core.
  The swings are the other sessions' load on that core and its SMT sibling. They are why the shares,
  not the raw counts, are the result.
- BelowNormal and Idle are indistinguishable here. The rule picks **BelowNormal**: it gives the
  same protection one step further from starvation. A lowered suite also competes with other
  lowered work, and Idle would make its timeouts more likely for no measured gain.

## M2 — a real `npm test` at concurrency 8, lowered and not, with an interactive probe

**Workload:** a VS Code extension's compiled `node --test` suite. That repository's `npm test` is
literally `node --test "out/test/*.test.js"`, 496 files. It ran from its own worktree.

- The full suite takes 232 s lowered at concurrency 8, under ~85 % background load: 5576 pass,
  0 fail. That is too long for an arm, so the arms use fixed subsets.
- The subsets are every 24th and every 12th file of the 451 that contain no test slower than
  1.5 s: 26 and 51 files.

**Probe:** a node process at Normal priority wakes every 5 ms and runs a fixed task of 2 000 000
additions (~2 ms on an idle core). It reports the task's duration percentiles: how long a short
interactive burst takes while the suite runs. Timer lateness was recorded too; it moves the same
way, but less, because of the 15.6 ms Windows timer granularity.

**Arms**, interleaved and repeated:

- idle: the probe alone, 15 s;
- `default`: no `--test-concurrency`, which is 23 here;
- `8`: `--test-concurrency=8`;
- each concurrency at normal priority, and lowered through the wrapper.

Columns: `p50/p95/p99/max` is the probe task in ms; `busy` is the whole-machine CPU busy during
the arm.

### 26 files

| Arm | Repeat | Wall | busy | p50 / p95 / p99 / max | pass / fail |
|---|---|---|---|---|---|
| idle | 1 | — | 57.7 % | 2.39 / 3.38 / 4.71 / 10.13 | — |
| idle | 2 | — | 50.8 % | 2.34 / 3.00 / 3.80 / 6.69 | — |
| 23, normal | 1 | 5.3 s | 72.5 % | 2.53 / 4.23 / **9.67** / 15.65 | 248 / 0 |
| 23, normal | 2 | 8.8 s | 97.7 % | 3.35 / 7.93 / **15.02** / 55.94 | 248 / 0 |
| 8, normal | 1 | 6.0 s | 86.3 % | 2.42 / 4.04 / **5.81** / 7.47 | 248 / 0 |
| 8, normal | 2 | 8.3 s | 98.1 % | 3.31 / 7.48 / **11.30** / 18.13 | 248 / 0 |
| 8, lowered | 1 | 5.3 s | 66.1 % | 2.22 / 2.86 / **4.02** / 5.64 | 248 / 0 |
| 8, lowered | 2 | 6.3 s | 84.1 % | 2.14 / 2.99 / **3.88** / 7.19 | 248 / 0 |
| 23, lowered | 1 | 6.0 s | 75.4 % | 2.26 / 3.60 / **4.48** / 7.39 | 248 / 0 |
| 23, lowered | 2 | 7.4 s | 93.1 % | 1.90 / 3.52 / **5.29** / 7.27 | 248 / 0 |

- Lowered, the probe's p99 stays at the idle baseline (3.8–4.7 ms) at either concurrency.
- At normal priority it rises to 5.8–15.0 ms, and the max to 56 ms.
- Wall time does not change in any way the noise can distinguish.
- Every arm passed every test.

### 51 files, three repeats

The other sessions alone kept the machine at **96–100 % busy** here: the idle arm's own p99 was
41 ms in repeat 1. Repeats of 60 s or longer were cut by the harness's 60 s bound. No test failed
in any arm (0 `not ok`).

| Arm | Finished inside 60 s | Wall when finished | p99 range |
|---|---|---|---|
| idle | — | — | 6.3–41.0 |
| 23, normal | 2 / 3 | 46 s, 58 s | 11.4–20.1 |
| 8, normal | 1 / 3 | 46 s | 9.3–26.1 |
| 8, lowered | 0 / 3 | — | 7.5–25.5 |
| 23, lowered | 0 / 3 | — | 7.5–24.8 |

On a machine that is already saturated, the probe numbers are dominated by the other sessions,
and no arm separates from the noise. The one clear signal is the expected one. **Lowered suites got
less CPU and finished later.** The cost lands on the batch job rather than on whoever is at the
keyboard, which is the design. It also means a timing-sensitive test can take longer under
lowering; none failed here.

## M3 — the shared-rules repository's own suite, lowered, at concurrency 8

The suite grew while this work was done: 239 tests before the change that added this record, 262 at its
merge (counted afterwards with `npm test`, at `791b25e^` and `791b25e`; a total is pass + fail + skipped).
Each run below counted the suite as it was then, as pass + fail: 238 at the baseline, 247 later. The
revision of each run was not recorded, so compare the runs by their failures, not by their totals. Many tests
have 5–30 s wall-clock deadlines: process supervision, real git migrations, a resolver run bounded at 10 s.

| Run | Priority | Machine busy | Wall | Pass / fail |
|---|---|---|---|---|
| baseline: no cap (23 workers) | normal | (not sampled) | 188 s | 238 / 0 |
| lowered, run 1 | BelowNormal | saturated | 145 s | 246 / **1**: a 10 s resolver deadline |
| lowered, run 2 | BelowNormal | saturated | — | 240 / **7**: deadlines of 5–35 s in process-supervision, git-migration and release tests |
| an hour later | normal | 76 % | 102 s | 247 / 0 |
| an hour later | BelowNormal | 64 % | 77 s | 247 / 0 |

- The failing files passed alone, both normal and lowered, between those runs.
- On a machine that other work saturates, a starved test misses a wall-clock deadline that a
  Normal-priority process would have met. That is the hypothesis, not a proof: no normal-priority
  run was made under the same saturation. So the rule says to re-run the failing file at BOTH
  priorities under the same load before debugging it. Never "fix" it by raising the priority or
  the deadline.

## M4 — what the rollout measured (2026-10-11)

The first consumers to adopt the rule turned up five facts the first version of the rule got wrong or left out.

| # | Fact | Measured how |
|---|---|---|
| 1 | **An xUnit `xunit.runner.json` that is not copied to the output is never read.** | A probe of 30 sleeping test classes recording their peak concurrency, xunit.v3 4.0.1: no file 24; file beside the project 24; copied by `<Content … CopyToOutputDirectory="PreserveNewest" />` 8. A command-line `--max-threads 16` overrode it (16). Another consumer saw the runner's own banner go from `[24 threads]` to `[8 threads]`. |
| 2 | **Every cap switch is an exact value, so a bare 8 RAISES a small CI runner.** | Another consumer measured a 4-vCPU runner going from 3–4 workers to 8 (6 m 39 s against 6 m 52 s, harmless there). This repository's own `tools · selftest` went from 13 s to 21 s after its `npm test` gained a literal `--test-concurrency=8` (single runs). |
| 3 | **cargo caps correctly through `.cargo/config.toml`, but CI would inherit it.** | A 20-test probe crate: 20 at once by default, 8 with `[env] RUST_TEST_THREADS = "8"`. |
| 4 | **Git Bash's `nice -n 19` on Windows is the Idle class.** | `nice -n 19 node -e …os.getPriority(0)` printed 19 (Idle); `nice -n 10` printed 10 (BelowNormal). |
| 5 | **A Normal-priority build server compiles for a lowered Windows build.** | Reported by another consumer: VBCSCompiler started earlier at Normal priority did the compiling. This is the Windows twin of the Linux record's nice-0 build servers. |

What changed as a result: the rule writes the cap as `min(8, default)` where it can be computed, conditions the
xUnit copy on `CI`, keeps cargo's caps in the local commands, names `nice -n 10` for Git Bash, and asks for
`--disable-build-servers` on every OS. This repository's `npm test` moved to `tools/run-tests.mjs`, which computes
the cap.

## Conclusions

1. **Lower yourself, then spawn.** It is the only Windows method measured to lower the whole tree
   and keep the exit code. `tools/low-priority.mjs` does exactly that.
   - It covers bash, pwsh, cmd and npm scripts with one file.
   - On Linux it applies nice 19.
   - Under `CI` it does nothing.
2. **BelowNormal, not Idle.** They are equal against Normal work; BelowNormal is further from
   starvation.
3. **`start /belownormal` is ruled out.** It loses the exit code: 37 becomes 0.
4. **The pwsh-native form works** (`(Get-Process -Id $PID).PriorityClass = 'BelowNormal'` in a
   child pwsh, then `&` the command). It is documented as the alternative. Resolve `pwsh` from
   PATH: the Store build is not under `%ProgramFiles%`.
5. **The cap and the priority do different jobs.**
   - The cap bounds how much of the machine one run can take at all.
   - The priority decides who yields when the machine is full.
   - With headroom, lowering alone restored idle-baseline latency. On a saturated machine nothing
     restores it, but the lowered job is the one that waits.

## The scripts

The busy loop (M1). It waits for an agreed start time, so the affinity can be set first:

```js
// node busy.js <startAtEpochMs> <durationMs> <label>
const os = require('os');
const [startAt, dur, label] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
function run() {
  let n = 0; const end = startAt + dur;
  while (Date.now() < end) { for (let i = 0; i < 1000; i++) n++; }
  console.log(JSON.stringify({ label, pid: process.pid, n, prio: os.getPriority(0) }));
}
setTimeout(run, Math.max(0, startAt - Date.now()));
```

The driver (pwsh 7):

- It starts loop A directly and loop B through the wrapper, both with the same `startAt` (now +
  2.5 s).
- It finds B's leaf process through `Win32_Process.ParentProcessId`.
- It sets `ProcessorAffinity = 1 -shl 22` on both leaves, waits up to 20 s for each, and reads the
  counts.
- A process still running at the bound is stopped by its pid.

The probe (M2), forked by the arm driver at Normal priority:

```js
const { performance } = require('perf_hooks');
const ITER = 2000000; const lat = []; const work = []; let stop = false;
function chunk() { let x = 0; for (let i = 0; i < ITER; i++) x += i; return x; }
function tick() {
  const t0 = performance.now();
  setTimeout(() => {
    lat.push(performance.now() - t0 - 5);
    const c0 = performance.now(); chunk(); work.push(performance.now() - c0);
    if (!stop) tick(); else process.send({ lat, work });
  }, 5);
}
process.on('message', (m) => { if (m === 'stop') stop = true; });
tick();
```

The arm driver (node):

1. It forks the probe and waits 1 s.
2. It records `os.cpus()` times.
3. It runs `node --test --test-reporter=tap [--test-concurrency=N] <files>`, directly or through
   the wrapper, with its output to a log.
4. A `taskkill /T /F /PID <child>` bounds the run at 60 s.
5. It records `os.cpus()` again, for the machine-busy figure, stops the probe, and reads
   `# pass` / `# fail` from the TAP summary.
