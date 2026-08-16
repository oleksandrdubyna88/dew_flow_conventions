# Logging — Serilog, coloured to the console, and on disk per run (MANDATORY)

> **One copy, consumed everywhere.** This rule lives in `dew_flow_conventions` and reaches every
> `dew_flow_*` repository through the `.claude/rules/shared` submodule. The per-repo mirror copies and
> their checklist are gone — this file is the only one to edit, and an edit is followed by a pin bump in
> every consumer in the same task.

## The rule

Every host — a web app, a worker, a CLI, an AppHost — writes its logs to **two destinations, always**:

1. **The console, in colour**, so the Aspire dashboard renders levels and structure instead of grey text.
2. **A file on disk**, under a folder named for the day, with a **new file per host run**.

There is no third mode and no "production turns the file off". A log that only exists in a terminal buffer is
gone the moment the window closes, which is reliably the moment someone needs it.

### Path shape

```
logs/{yyyy-MM-dd}/{app}-{HH-mm-ss}-{pid}.log
```

- **A folder per day**, so a week of work is seven directories rather than one listing nobody scrolls.
- **A file per RUN**, not per day. This is the part people get wrong by reaching for a rolling sink: rolling
  by day appends every run into one file, and the question actually being asked is almost always "what did
  *that* run do". The timestamp is taken once at startup; the pid disambiguates two hosts started in the same
  second (an AppHost starting several children does exactly that).
- **A run that outlives the day continues in a `00-00-00` segment** under the next day's folder — same pid,
  so it is still one run. A run starting at 15:00 writes `…/2026-08-16/app-15-00-00-1234.log` and continues
  in `…/2026-08-17/app-00-00-00-1234.log`.

  This is not the rolling sink forbidden below, and the difference is the whole point: rolling by day merges
  *different runs* into one file, while these two files belong to *one run* and say so by pid. It exists
  because "a file per run" and "this process never restarts" had never been held against each other — a file
  per run is right, but its mitigating rotation IS the restart, and the 24/7 premise is that there is none.
  Together they produced one file growing for months.

  The boundary is the **clock**, not twenty-four hours of elapsed time. Elapsed-time segments drift a little
  each day until the files stop lining up with the folders they live in, and correlating two hosts becomes
  arithmetic. Segmenting on the clock also fixes something nobody had noticed: before it, a run that crossed
  midnight kept writing into the folder of the day it *started*.

  The name of a continuation segment is `00-00-00` rather than the moment its first line arrived — the
  segment BEGINS at the boundary, and a reader comparing it with the previous day's file should see the two
  meet rather than a gap of however long the host was quiet.
- `logs/` is git-ignored in every repo.
- **Everything is UTC** — the folder, the file name, and the timestamp on every line. Not a preference: the
  Rust sidecar has no timezone library and names its folder from a unix timestamp, so a local-time .NET host
  and a UTC sidecar put the same evening's logs into two different day folders, and the one time anyone
  correlates them is while chasing a failure across both. One clock, everywhere.

### Colour: Serilog's console theme does NOT work here — measured

**Do not use `WriteTo.Console(theme: …)` for the coloured sink.** It emits nothing once stdout is
redirected, and an orchestrator capturing a child's output redirects stdout by definition — so the theme
produces colour when you run the host by hand and grey text in the dashboard, which is the one place the
colour was for.

Measured on **Serilog.Sinks.Console 6.1.1**, escape bytes counted on a redirected stream:

| configuration | escapes |
|---|---|
| `theme: AnsiConsoleTheme.Code, applyThemeToRedirectedOutput: true` | **0** |
| `theme: AnsiConsoleTheme.Sixteen, applyThemeToRedirectedOutput: true` | **0** |
| `Serilog.Expressions` `ExpressionTemplate` with `TemplateTheme.Code` | **0** |
| a control writing one escape by hand, same process | **4** |

The control is what makes the result trustworthy: the measurement pipeline preserves escapes, the sink
simply does not write them. `applyThemeToRedirectedOutput` is a documented flag that changes nothing in this
version.

**So the coloured console sink is ours** — see `AnsiConsoleSink` in any repo's `ServiceDefaults`. About forty
lines that write the escapes unconditionally. Colour only the level strongly; a line where everything is
coloured is a line where nothing stands out.

Render the message through Serilog's own `MessageTemplateTextFormatter` with `{Message:lj}`, never
`LogEvent.RenderMessage()` — the latter quotes every string property, so a connection failure reads
``database '"qln"'``.

The file sink gets no colour: escape codes in a file are noise to every reader, `grep` included.

### stdio hosts write console logs to STDERR

An MCP server on the stdio transport uses **stdout for the protocol**. One log line on stdout corrupts the
JSON-RPC stream, and the failure looks like a protocol bug rather than a logging one. Any host with a stdio
mode sends its console sink to stderr; the file sink is unaffected.

### What every line carries

Machine-readable enough to grep, short enough to read:

```
[HH:mm:ss LVL] {SourceContext}: message {Properties}
```

Plus, as enrichers on every event: the application name and the process id. Two hosts writing into one
terminal is the normal case under an orchestrator, and a line that cannot say which one wrote it is a line
that has to be traced by guessing.

### Levels come from configuration, never from call sites

`MinimumLevel` and per-source overrides live in `appsettings.json` under `Serilog:`. Changing verbosity is a
config edit and a restart — never an edited call site, never a rebuilt binary. Default floor is
`Information`, with `Microsoft.AspNetCore` and `System.Net.Http.HttpClient` at `Warning`: request and
handler chatter drowns the application's own story at Information.

### A CLI verb that builds a service container is a host

The 2026-08-16 audit found the family's benchmark CLI registering `.AddLogging()` with zero
providers plus a `NullLoggerFactory` in its live `run`/`judge` path
(`dew_flow_benchmark · hosts/Cli/RunCommand.cs:204`) — while the repo's correct `AddDewFlowLogging`
sat unused one project over. Every `LogWarning` about crash-recovery and failed metrics went
nowhere, in the code path whose whole diagnosability budget this rule exists to protect. So: any
code path that builds a `ServiceCollection`/host — a CLI verb included — wires the same two sinks
as every other host. Code that *looks* instrumented and says nothing is worse than no logging,
because nobody goes looking for the gap.

### Retention — `logs/` must not grow forever

A file per run with no reaper is a disk that eventually fills — and on a machine running 24/7 the
"eventually" is a date. Every repo names its retention owner, one of exactly two:

1. **The host prunes at startup** (default): delete day-folders under its own `logs/` root older
   than 14 days, best-effort, logged at Information. Startup is the right moment — it is cheap,
   idempotent, and a host that never restarts is not producing new files either.
2. **An operator job owns it** — then the repo's README says so, and which job.

The same choice, made explicitly, applies to every other directory a host appends to (telemetry
spools, artifact folders). Never inside a library; the host that writes the files owns their
retirement.

**With one exception that is a rule of its own: a directory DRAINED by a consumer is not the writer's to
prune.** A telemetry spool is read and removed by an ingester, and the emitting process cannot know which
records that ingester has taken — deleting on a timer would destroy data nobody read, which is worse than
the growth it fixes. There the owner is the CONSUMER, and the emitting repo says so in writing rather than
reaching for the startup prune because it is the same shape of directory. Naming the owner is the
requirement; being the owner is not.

### Failures during startup must still be logged

Configure Serilog **before** the host is built, and wrap the run in `try/catch/finally` with
`Log.CloseAndFlush()`. A host that crashes while wiring itself up is precisely when the log matters, and a
logger configured after `Build()` has nothing to say about it.

## The shape (C#)

One project per repo, named `<Repo>.ServiceDefaults`, exposing one extension. Never configure Serilog in more
than one place in a repo.

```csharp
public static class <Repo>Logging
{
    public static void AddDewFlowLogging(this IHostApplicationBuilder builder, string appName, bool consoleToStdErr = false);
}
```

Call it as the first statement after creating the builder:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.AddDewFlowLogging("daemon");
```

## Rust

The sidecar has no Serilog; it has `tracing`, and the CONTRACT is what is shared, not the library:

- an stdout layer **with** ANSI (`.with_ansi(true)`),
- a file layer **without** ANSI, at the same `logs/{day}/{app}-{time}-{pid}.log` path,
- level from `RUST_LOG`, defaulting to the same floor.

## Never

- Never `Console.WriteLine` for anything that is a log. It has no level, no timestamp, no source, and it
  cannot be filtered.
- Never a rolling-by-day file sink for host logs — it merges runs, which is the opposite of the requirement.
  The midnight SEGMENT above is not that: it splits one run at the boundary and never joins two.
- Never a `SystemConsoleTheme` — it silently drops colour under an orchestrator.
- Never write logs to stdout in a process whose stdout carries a protocol.
- Never configure logging inside a library. Libraries take `ILogger<T>` and say nothing about sinks.
- Never register `.AddLogging()` with no providers (or a `NullLoggerFactory`) in a production
  container — wire the real sinks or do not accept `ILogger<T>` dependencies there at all.

## Definition of Done

- [ ] The repo has exactly one `AddDewFlowLogging` and every host calls it before `Build()`.
- [ ] Console output is coloured through an ANSI theme, and is visible as colour in the Aspire dashboard.
- [ ] A run produces `logs/{yyyy-MM-dd}/{app}-{HH-mm-ss}-{pid}.log`, and a second run produces a second file.
- [ ] A run that crosses midnight produces a `00-00-00` segment under the next day's folder, same pid.
- [ ] A stdio host's console sink goes to stderr.
- [ ] Levels are configured in `appsettings.json`, not in code.
- [ ] `logs/` is git-ignored.
- [ ] CLI hosts included: every code path that builds a container wires the same sinks.
- [ ] The repo names its `logs/` retention owner (startup prune or a named operator job).
- [ ] A new repository **mounts the submodule** (see the repo README) — it never copies this file.

The `AnsiConsoleSink` / `UtcTimestampEnricher` / `<Repo>Logging` *code* is still per-repo by deliberate
trade (independence bought with duplication); this rule is the contract that keeps the copies aligned,
and a fix measured in one repo is applied to all of them in the same task.
