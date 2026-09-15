---
id: "common.reliability"
load: "conditional"
tasks: ["implement","audit","test","deploy","benchmark"]
---
# Reliability — a process that must run 24/7 (MANDATORY)

> Written from a four-repository audit on **2026-08-16**, on the eve of the first long unattended
> runs. Every rule below names the finding that made it; none is hypothetical. The mission they
> serve: **no hangs, no leaks, no silent deaths — and every failure diagnosable from the log after
> the fact.**
>
> **Evidence names the KIND of host and the date, never a repository, a path or a line**
> ([rule-ownership.md](rule-ownership.md)). What a finding is worth is what happened, what it cost and
> when — and those survive a rename, a split and an archive, which an address does not. The addresses
> as they stood on the audit date are kept out of the corpus, in this repository's
> [`research/reliability-audit-2026-08-16.json`](../research/reliability-audit-2026-08-16.json), so a
> reader who wants to check a claim can, and nobody has to edit a shared rule when a product moves.
> That file is the only place those addresses are kept, and it is a HISTORICAL RECORD rather than a
> policy input: nothing loads it, and its line numbers are what they were on the audit date. Most of
> the violations below are since fixed; the rule text is the durable part.

## Every wait has a ceiling

- Every outbound call — HTTP, database, external process, and any lock/semaphore acquired on a
  request path — carries a timeout or deadline. A framework default you rely on is a decision too:
  name it (axum's implicit 2 MB body cap and Kestrel's defaults both shipped here unnamed).
- An **infinite timeout is legal only as a documented pair**: the reason (a cold GPU compile is
  minutes of *correct* slowness) AND a compensating detector that can tell "slow but alive" from
  "wedged" — a progress heartbeat, a staleness watchdog, an activity stamp something actually
  checks. Audit, 2026-08-16: an indexing host's infinite HTTP timeout into a local inference worker
  composes with that worker's engine mutex into "one wedged inference blocks every pass forever, and
  `/health` cannot tell" — two components, each defensible alone.
- A blocking lock is never taken directly on an async worker thread — `try_lock` or move to the
  blocking pool. Audit, in a Rust host: the `/unload` endpoint, the recovery tool itself, could
  starve the server that needed recovering.

## A timed-out child process is a killed child process

[security.md](security.md) already requires exe + argv + timeout. The timeout must also **kill the
entire process tree** — a timeout that merely stops *waiting* promotes the child to an orphan that
holds locks, handles and memory forever. Use ONE shared launcher, with a linked token, a tree-kill
and a typed outcome. Audit, 2026-08-16: a second launcher in a .NET host let
`WaitForExitAsync` throw on timeout while the child lived on — on a probe that runs every five
minutes forever.

## Background work neither dies silently nor takes the host with it

- **Everything** a worker iteration does lives inside its `try` — including `CreateAsyncScope()` and
  `GetRequiredService<T>()`. A resolution failure outside the `try` escapes `ExecuteAsync`, and the
  .NET default (`BackgroundServiceExceptionBehavior.StopHost`) then stops the **whole host**
  Decide the behaviour
  per host, explicitly. Audit, 2026-08-16: in a .NET indexing worker, the scope resolution sat above
  the `try`.
- **No unobserved fire-and-forget.** A `Task.Run` whose fault nobody awaits is a worker that dies
  with no line in the log while the process looks healthy. Audit, in a telemetry sink: two caught
  exception types, and everything else killed the drain loop silently for the life of the process.
  Every detached task ends in a catch-all that
  logs; hosts also register `TaskScheduler.UnobservedTaskException` as the net under the net.
- **Loop exits are decided on typed outcomes, never message substrings**; retry loops have backoff
  and a bound. Audit, in a measuring harness's CLI: the loop exited by
  `Reason.Contains("no pending cell")`, and a lost claim race retried in a zero-delay spin.
- **One failed unit is recorded and skipped; it never kills the campaign.** The drain loop wraps
  each unit in its own `try/catch`: a transient `NpgsqlException` on leg 3,001 must fail *that leg*,
  not the remaining 7,000. Audit: that guard was missing in the same harness's drain loop.
- **A crash-recovery sweep exists AND is invoked at every owning host's startup.** The audit's most
  instructive find: a sweep fully implemented, fully tested, and called by nothing
  — a store's sweep method, unreachable outside its own tests, so a killed run's claimed cells were
  stranded forever. Run the ownership-checked sweep as the first thing in `ExecuteAsync`.

## Where `try/catch` lives — the three boundaries

The audit found the same defect four times, and each time it was a **placement** mistake, not a
missing habit — the code around it caught exceptions elsewhere. So the placement is the rule:

1. **Per independent unit.** A loop over independent units — queue items, benchmark legs, requests,
   timer ticks — wraps **each unit** in its own `try/catch` that records the failure *on that unit*
   and continues. The loop's job is the campaign; one unit is never allowed to end it
   (audit: no per-leg guard, so one `NpgsqlException` killed the process and every pending cell).
2. **The whole unit body, setup included.** `CreateAsyncScope()`, `GetRequiredService<T>()`,
   opening the connection — that *is* the unit. Setup outside the `try` is the same crash through a
   side door (audit: resolution above the `try`, and the escape stopped the whole host).
3. **A catch-all at the outermost edge of every detached execution.** `ExecuteAsync`, a `Task.Run`
   body, an event handler, a thread main: the last frame before "nobody above me" ends in
   `catch (Exception ex)` that logs. A **list of anticipated types is not a guard** — it is a bet
   that the fourth type never comes (audit: a telemetry sink caught two types; the third killed the
   writer silently for the life of the process).

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
  state instead of a stranded one. Audit, in a measuring harness: zero signal handling, so every
  orchestrator stop had the same effect as a crash.

### A timeout is not a cancellation — and .NET spells them the same

The two facts are opposite in meaning and identical in type:

| what happened | exception | the token |
|---|---|---|
| the caller gave up | `OperationCanceledException` | `IsCancellationRequested == true` |
| **we** gave up — `HttpClient.Timeout`, a linked `CancelAfter` | `TaskCanceledException` (a SUBCLASS of the above) | **not** cancelled |

So `catch (Exception ex) when (ex is not OperationCanceledException)` — which reads as "handle
everything except the caller giving up" — **excludes our own timeout**, the one case the catch exists
for. Found live on 2026-08-16 in one .NET host here: a 4-second probe timing out escaped the
handler, escaped the endpoint, and Kestrel answered **500** — six times in one day, on the operator's
own status page, which is the one place to look when something is slow. The same repository held
**twelve** copies of that filter. It is a language trap, not a lapse.

**Filter on the token's state, never on the exception's type:**

```csharp
catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
```

(A model runtime's HTTP client here is the reference shape.)

The same trap has a second face on the throwing side: a launcher whose timeout surfaced as
`OperationCanceledException` made every caller read "we overran" as "the host is shutting down", so a
docker probe that merely took too long travelled out of a `BackgroundService` and stopped it. Fixed by
throwing a distinct `TimeoutException`. **If you own the wait, give up in your own words** — a typed
value or a distinct exception — so no downstream filter has to guess which of you quit.

## Before designing a lock, name the atomic operation it rests on

A lock is not a data structure you write; it is one atomic operation you borrow, plus bookkeeping. If
you cannot name the operation — the one call that either succeeds or fails and cannot half-happen —
then what you are building is advisory coordination, and it must say so where a caller reads it.

Measured 2026-09-03 in one repository here. A plan proposed coordinating two editor windows
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
  The shapes that work: a capped ring buffer for a rolling window, an LRU for a cache. Audit,
  2026-08-16: two dictionaries in a measuring harness — a per-leg trace and a checkout lock table —
  did `GetOrAdd` forever and removed never (both latent that day, live the day a long-running worker
  lands).
- **In the database:** an append-only table names its retention/rollup policy — a 7-day raw window
  with an hourly rollup is the shape to copy. Audit, 2026-08-16: a table with one row per index pass,
  deleted never.
- **On disk:** every directory a host writes — `logs/`, spools, artifacts — has a named retention
  owner. The rule lives in [logging-serilog.md](logging-serilog.md) § Retention.

## Transient faults are the weather, not an event

- Database access enables the provider's retry strategy (`EnableRetryOnFailure` for Npgsql/EF) or
  records why not. Audit, 2026-08-16: with it off, a one-second Postgres blip failed a whole indexing
  pass.
- The loop that calls a flaky dependency carries a consecutive-failure circuit breaker: an endpoint
  that is *down* must fail the campaign in minutes, not burn the default wall-timeout per leg for
  every remaining leg. Audit, 2026-08-16: a model runtime with a 10-minute default wall and no
  breaker.

## Health endpoints tell the truth and never block

- `/health` computes from live internal state — workers alive, queue depth, last-success time —
  never a constant. Audit, 2026-08-16: an endpoint returning `"ok"` unconditionally, so an
  orchestrator could not see the dead spool writer behind it.
- `/health` does zero blocking work inline: no locks that can queue behind a build, no first-call
  hashing of gigabytes on the probe path. Audit, 2026-08-16: in a Rust host, the first `/health`
  call SHA-256-hashed every provider library beside the executable.

## Paid work is written down as it is earned

When one unit of work costs money or minutes, the unit of work is the unit of SAVING. A pass that
computes for an hour and writes its file at the end is a pass that loses an hour to any fault in it —
and the fault will be in the last unit, because that is where the untested input is.

Measured twice in two days, in the same pass. A judgement over fourteen recorded runs spends one CLI
turn per finding and wrote `runs.json` once, after the loop. On 2026-09-05 it was stopped twelve runs
in, deliberately, to change the model: twelve runs of answers — about a hundred paid turns — existed
only in memory and went. On 2026-09-06 the same pass reached its **fourteenth run of fourteen** and
died there on an out-of-range citation; thirteen judged runs went the same way. The second loss was
the first loss with the fix known and not carried over.

Three properties, and each one was learned by not having it:

1. **Write after every unit**, before the next one starts. A few hundred kilobytes against a paid API
   call is not a trade worth thinking about.
2. **Record who produced it**, so a restart can skip what is already answered and a *different*
   producer re-does everything rather than leaving the file half in one opinion and half in another.
3. **Write beside the file and move it over.** Saving per unit creates a reader arriving mid-write
   where there was none, and half a JSON array reads as corruption. A move is one operation; a write
   of six hundred kilobytes is not.

The shape generalises past judgements: an indexing pass, a migration, a bulk send, any loop whose
iterations are individually expensive. If losing the loop would cost real money or a real hour, the
loop is resumable or it is not finished.

## Boundary numbers are clamped

Every numeric field a client sends is range-validated before arithmetic, and window math is
`checked` or done in `long`. Audit, 2026-08-16: a sandboxed file reader added `startLine + lineCount`
and overflowed `int` into an unhandled exception any client could trigger with one call.

**A model's answer is a client's input.** A number that came out of an LLM has been through no
validation at all, and it will be wrong in the way that hurts: a reviewer citing line 500 of a
fifty-line file made a code window start at 420 and end at 50, and `Enumerable.Range` with a count of
−369 took down an entire judgement on its last run of fourteen (2026-09-06). Line numbers, indices,
counts, offsets, file paths: clamp them, or refuse them, exactly as if a stranger had sent them —
because one did.

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
