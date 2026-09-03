# Reliability — a process that must run 24/7 (MANDATORY)

> Written from the 2026-08-16 four-repo audit, on the eve of the first long unattended runs. Every
> rule below names the audit finding that made it; none is hypothetical. The mission they serve:
> **no hangs, no leaks, no silent deaths — and every failure diagnosable from the log after the
> fact.** Citations are `repo · path:line` per [planning-docs.md](planning-docs.md) — **as of the
> audit date**: they are the evidence that made the rule, not live pointers, and most named
> violations are since fixed (each repo's `research/PLAN_reliability_tail.md` tracks its closures).
> Do not "correct" a citation to today's line numbers; the rule text is the durable part.

## Every wait has a ceiling

- Every outbound call — HTTP, database, external process, and any lock/semaphore acquired on a
  request path — carries a timeout or deadline. A framework default you rely on is a decision too:
  name it (axum's implicit 2 MB body cap and Kestrel's defaults both shipped here unnamed).
- An **infinite timeout is legal only as a documented pair**: the reason (a cold GPU compile is
  minutes of *correct* slowness) AND a compensating detector that can tell "slow but alive" from
  "wedged" — a progress heartbeat, a staleness watchdog, an activity stamp something actually
  checks. Audit: the daemon's infinite sidecar HTTP timeout composes with the sidecar's engine
  mutex into "one wedged inference blocks every pass forever, and `/health` cannot tell"
  (`dew_flow_rag_qln · src/Rag.Infrastructure/RagInfrastructureExtensions.cs:152`,
  `dew_flow_sidecar_rust · src/main.rs:1470`).
- A blocking lock is never taken directly on an async worker thread — `try_lock` or move to the
  blocking pool (`dew_flow_sidecar_rust · src/main.rs:1127` — `/unload`, the recovery tool itself,
  could starve the server that needed recovering).

## A timed-out child process is a killed child process

[security.md](security.md) already requires exe + argv + timeout. The timeout must also **kill the
entire process tree** — a timeout that merely stops *waiting* promotes the child to an orphan that
holds locks, handles and memory forever. Reference implementation:
`dew_flow_benchmark · src/Bench.Infrastructure/Process/ProcessRunner.cs` (linked token, tree-kill,
typed outcome). Violation: `dew_flow_rag_qln · src/Rag.Infrastructure/Processes/ProcessRunner.cs:61`
— `WaitForExitAsync` throws on timeout and the child lives on, on a probe that runs every five
minutes forever.

## Background work neither dies silently nor takes the host with it

- **Everything** a worker iteration does lives inside its `try` — including `CreateAsyncScope()` and
  `GetRequiredService<T>()`. A resolution failure outside the `try` escapes `ExecuteAsync`, and the
  .NET default (`BackgroundServiceExceptionBehavior.StopHost`) then stops the **whole host**
  (`dew_flow_rag_qln · src/Rag.Application/Indexing/IndexPassWorker.cs:53`). Decide the behaviour
  per host, explicitly.
- **No unobserved fire-and-forget.** A `Task.Run` whose fault nobody awaits is a worker that dies
  with no line in the log while the process looks healthy (`dew_flow_mcp ·
  src/Mcp.Telemetry/SpoolUsageSink.cs:59` — two caught exception types, everything else kills the
  drain loop silently for the life of the process). Every detached task ends in a catch-all that
  logs; hosts also register `TaskScheduler.UnobservedTaskException` as the net under the net.
- **Loop exits are decided on typed outcomes, never message substrings**; retry loops have backoff
  and a bound (`dew_flow_benchmark · hosts/Cli/RunCommand.cs:142` — exit by
  `Reason.Contains("no pending cell")`, and a lost claim race retries in a zero-delay spin).
- **One failed unit is recorded and skipped; it never kills the campaign.** The drain loop wraps
  each unit in its own `try/catch`: a transient `NpgsqlException` on leg 3,001 must fail *that leg*,
  not the remaining 7,000 (`dew_flow_benchmark · hosts/Cli/RunCommand.cs:133`).
- **A crash-recovery sweep exists AND is invoked at every owning host's startup.** The audit's most
  instructive find: a sweep fully implemented, fully tested, and called by nothing
  (`dew_flow_benchmark · PostgresRunStore.SweepAsync` — unreachable outside tests, so a killed run's
  claimed cells are stranded forever). Reference: `dew_flow_rag_qln · IndexPassWorker` runs its
  ownership-checked sweep first thing in `ExecuteAsync`.

## Where `try/catch` lives — the three boundaries

The audit found the same defect four times, and each time it was a **placement** mistake, not a
missing habit — the code around it caught exceptions elsewhere. So the placement is the rule:

1. **Per independent unit.** A loop over independent units — queue items, benchmark legs, requests,
   timer ticks — wraps **each unit** in its own `try/catch` that records the failure *on that unit*
   and continues. The loop's job is the campaign; one unit is never allowed to end it
   (`dew_flow_benchmark · hosts/Cli/RunCommand.cs:133` — no per-leg guard, one `NpgsqlException`
   kills the process and every pending cell).
2. **The whole unit body, setup included.** `CreateAsyncScope()`, `GetRequiredService<T>()`,
   opening the connection — that *is* the unit. Setup outside the `try` is the same crash through a
   side door (`dew_flow_rag_qln · IndexPassWorker.cs:53` — resolution above the `try`, and the
   escape stops the whole host).
3. **A catch-all at the outermost edge of every detached execution.** `ExecuteAsync`, a `Task.Run`
   body, an event handler, a thread main: the last frame before "nobody above me" ends in
   `catch (Exception ex)` that logs. A **list of anticipated types is not a guard** — it is a bet
   that the fourth type never comes (`dew_flow_mcp · SpoolUsageSink.cs` caught two types; the third
   killed the writer silently for the life of the process).

And the counter-rule, unchanged from [../csharp/doctrine.md](../csharp/doctrine.md) §5: **everywhere
else, don't catch.** Expected failures travel as `Outcome` values; an unexpected exception flies to
the nearest unit boundary, where the three rules above guarantee someone logs it and the process
survives. Mid-layer catch-log-rethrow padding and catch-and-swallow are the opposite defect, not
compliance. Catch a *specific* type only where this layer genuinely handles *that* type.

## Cancellation is real, shutdown is planned

- `CancellationToken` propagates end-to-end to the leaf I/O call. `CancellationToken.None` in a
  production path is a decision — write the reason beside it.
- Every host, **CLIs included**, wires Ctrl+C / SIGTERM into its root token
  (`PosixSignalRegistration` / `Console.CancelKeyPress`), so a planned stop produces a resumable
  state instead of a stranded one (`dew_flow_benchmark` — zero signal handling; every orchestrator
  stop has the same effect as a crash).

### A timeout is not a cancellation — and .NET spells them the same

The two facts are opposite in meaning and identical in type:

| what happened | exception | the token |
|---|---|---|
| the caller gave up | `OperationCanceledException` | `IsCancellationRequested == true` |
| **we** gave up — `HttpClient.Timeout`, a linked `CancelAfter` | `TaskCanceledException` (a SUBCLASS of the above) | **not** cancelled |

So `catch (Exception ex) when (ex is not OperationCanceledException)` — which reads as "handle
everything except the caller giving up" — **excludes our own timeout**, the one case the catch exists
for. Found live on 2026-08-16 in `dew_flow_rag_qln`: a 4-second sidecar probe timing out escaped the
handler, escaped the endpoint, and Kestrel answered **500** — six times in one day, on the operator's
Runtime page, which is the one place to look when something is slow. The same repository held
**twelve** copies of that filter. It is a language trap, not a lapse.

**Filter on the token's state, never on the exception's type:**

```csharp
catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
```

(`dew_flow_benchmark · src/Bench.Infrastructure/Models/OpenAiCompatibleRuntime.cs:73` — the reference.)

The same trap has a second face on the throwing side: a launcher whose timeout surfaced as
`OperationCanceledException` made every caller read "we overran" as "the host is shutting down", so a
docker probe that merely took too long travelled out of a `BackgroundService` and stopped it. Fixed by
throwing a distinct `TimeoutException`. **If you own the wait, give up in your own words** — a typed
value or a distinct exception — so no downstream filter has to guess which of you quit.

## Before designing a lock, name the atomic operation it rests on

A lock is not a data structure you write; it is one atomic operation you borrow, plus bookkeeping. If
you cannot name the operation — the one call that either succeeds or fails and cannot half-happen —
then what you are building is advisory coordination, and it must say so where a caller reads it.

Measured 2026-09-03 in `dew_flow_creds_for_devs`. A plan proposed coordinating two VS Code windows
through a lease key in the shared `globalState`, with a write-then-read-back to settle a tie: take it,
re-read it, proceed only if it is still ours. Its review round returned **three Blocking findings from
three vendors independently**, all the same — the store's `update` is asynchronous and a foreign write
arrives through a broadcast with no ordering against a local read, so both windows read empty, both
write, and each re-reads its own value. Two enter. The plan document had already written down that the
store has no compare-and-swap, one paragraph above the design that assumed one.

What to do instead:

1. **Name it first, in the plan.** `mkdir` without `recursive`, `O_EXCL` on create, a conditional PUT,
   a `SETNX`, a unique-index insert. The corrected design above became an atomic directory create in a
   directory every window already shares.
2. **Freshness is a HEARTBEAT, not a deadline.** A holder that renews a deadline goes on being a
   holder while wedged; a holder that stops writing a timestamp stops being one without having to
   notice, which is what a killed process and a stuck one have in common.
3. **Release is fenced.** The holder writes an id unique to the acquisition, and release removes the
   lock only if that id is still there — otherwise a holder that overran its expiry deletes the lock of
   whoever replaced it, and two run again.
4. **State the residual in the primitive's own header.** Every one of these leaves a narrow window.
   The header is where a caller will read it; a paragraph in a plan is not.

## Everything that grows has an owner

- **In memory:** every cache, dictionary or list that grows with traffic is bounded or evicted.
  Reference: `dew_flow_rag_qln · SpeedWindow` (capped ring), `dew_flow_sidecar_rust · RungCache`
  (LRU). Violations: `dew_flow_benchmark · LiveTrace._byLeg` and `GitCheckoutProvider._locks` —
  `GetOrAdd` forever, remove never (both latent today, live the day a long-running worker lands).
- **In the database:** an append-only table names its retention/rollup policy. Reference:
  `dew_flow_rag_qln · SizeHistoryStore` (7-day raw, hourly rollup). Violation: `index_passes` —
  one row per pass, deleted never.
- **On disk:** every directory a host writes — `logs/`, spools, artifacts — has a named retention
  owner. The rule lives in [logging-serilog.md](logging-serilog.md) § Retention.

## Transient faults are the weather, not an event

- Database access enables the provider's retry strategy (`EnableRetryOnFailure` for Npgsql/EF) or
  records why not. Today a one-second Postgres blip fails a whole pass
  (`dew_flow_rag_qln · PlatformExtensions.cs:12`).
- The loop that calls a flaky dependency carries a consecutive-failure circuit breaker: an endpoint
  that is *down* must fail the campaign in minutes, not burn the default wall-timeout per leg for
  every remaining leg (`dew_flow_benchmark · OpenAiCompatibleRuntime` — 10-minute default wall,
  no breaker).

## Health endpoints tell the truth and never block

- `/health` computes from live internal state — workers alive, queue depth, last-success time —
  never a constant (`dew_flow_mcp · McpApiEndpoints.cs:12` returns `"ok"` unconditionally, so an
  orchestrator cannot see the dead spool writer behind it).
- `/health` does zero blocking work inline: no locks that can queue behind a build, no first-call
  hashing of gigabytes on the probe path (`dew_flow_sidecar_rust · src/main.rs:1042` — first
  `/health` SHA-256-hashes every provider DLL beside the exe).

## Boundary numbers are clamped

Every numeric field a client sends is range-validated before arithmetic, and window math is
`checked` or done in `long` (`dew_flow_mcp · SandboxedFileReader.cs:41` — `startLine + lineCount`
overflows `int` into an unhandled exception any client can trigger with one call).

## Definition of Done

- [ ] Every new outbound call names its ceiling — or the documented pair: reason + watchdog.
- [ ] Every new background loop: whole body inside `try`, faults observed and logged, typed exits,
      backoff, and its sweep invoked at startup.
- [ ] `try/catch` sits on the three boundaries (per unit, setup included, catch-all at the detached
      edge) — and nowhere else.
- [ ] Every new growth surface (memory, table, directory) names its bound or retention in the
      summary.
- [ ] `CancellationToken` reaches the leaf I/O; the host handles Ctrl+C / SIGTERM.
- [ ] No handler distinguishes "we timed out" from "the caller cancelled" by exception TYPE — the
      token's state decides, and a wait you own gives up in its own words.
- [ ] Health reflects the new component's liveness if it has a failure mode worth seeing.
- [ ] Client-supplied numbers are clamped at the boundary.
- [ ] Any lock names the atomic operation it rests on, expires on a heartbeat, fences its release,
      and states its residual race in its own header.
