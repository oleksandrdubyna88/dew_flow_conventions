---
id: "csharp.dotnet-build"
load: "conditional"
paths: ["**/*.slnx","**/*.sln","**/Directory.Build.rsp"]
---
# `dotnet build` — bound the worker pool, because several sessions build at once

> Measured 2026-09-11: 24 CPUs, 44 GB, SDK 10.0.112, **five autonomous Claude sessions building in
> parallel**. That condition is the rule. Full record:
> [PLAN_dotnet_build_node_reuse.md](../research/PLAN_dotnet_build_node_reuse.md).

Left alone: **72 `MSBuild.dll /nodemode:1` processes holding 10 775 MB**, beside Postgres, Docker and
a running e2e suite. Not an MSBuild bug, and not C# Dev Kit (which has its own `BuildHost`): a worker
busy in one build cannot be reused by another, so every *concurrent* build opens its own pool and the
total ratchets to the high-water mark of simultaneous demand. Three builds run sequentially retained
**0** new workers; the same three run concurrently retained **14**. The idle timeout does return them
— about fifty minutes after the work stopped, which is the wrong direction of help.

## 1. Every .NET repository carries `Directory.Build.rsp` at its root (MANDATORY)

```
-nr:false
```

The whole file. It takes what a build leaves behind from **11 workers / 1222 MB to zero** — the half
a file can hold, so nobody has to remember it.

It is found by walking up from the directory of the **project or solution being built**, *not* from
the current directory (measured with a negative control, reproduced). So the root file applies even
to a build launched from an unrelated directory by absolute path, and one sitting beside your shell
instead of beside the code does nothing. Read by `build`, `restore`, `msbuild` and `pack`, on Windows
and Linux alike.

## 2. Every MSBuild-driven command carries `-m:N` (MANDATORY)

```bash
dotnet build   src/Thing.slnx -c Release -m:4
dotnet restore src/Thing.slnx -m:4
```

`build`, `restore`, `msbuild`, `publish`, `pack` — all five open a pool and all five accept the flag.
**`restore` is not the exception it looks like:** with no flags it peaked at 11 workers and retained
all 11, exactly like a full build. It does not compile; it opens the pool to evaluate the projects.

`-m:4` takes the peak from **11 workers / 1222 MB to 3 / 365 MB** and costs no wall time — it was the
fastest arm measured, twice. `N = 4` unless a repository says otherwise: a policy about how much of a
shared machine one build may take while four other sessions build, not a tuning constant.

**It cannot be delivered by a file.** `-m:4` in `Directory.Build.rsp` leaves the peak at 11 workers;
so does `MSBUILDMAXCPUCOUNT=4`. `dotnet build` injects its own `-maxcpucount`, and the command line
beats the response file.

### What enforces it, and where it does not reach

`settings/hooks/build-flags.mjs`, wired as a `PreToolUse` hook, refuses such a command and names the
flag to add. **Its reach is narrower than it sounds:** only a Claude Code session, in a repository
that copied the adapter. As of 2026-09-11 exactly one has — `dew_flow_connect_other_ais`, the only
migrated consumer — so in the other five, and for Codex, a human at a terminal and CI anywhere,
this rule has its own word and nothing more. `tools/adapter-check.mjs` names a repository whose copy is
missing, drifted or unwired, so "not copied yet" stays visible instead of becoming "quietly never".

## 3. CI overrides on the command line — never `-noautorsp` (MANDATORY)

`-noautorsp`, `-noAutoResponse` and `/noautoresponse` make `dotnet` ignore the response file
*entirely*, discarding `-nr:false` with it, so a persistent runner accumulates the workers this
exists to prevent. There is no reason to reach for them: the command line already wins, so a runner
that wants the whole machine passes `-m` and gets it, response file intact.

## 4. Know the floor

`-nr:false` does not touch `VBCSCompiler`, which survives independently — **one per SDK**, 486 MB in
WSL and 241–332 MB on Windows — and is what makes repeat builds fast. Only `dotnet build-server
shutdown` clears it, and on a shared machine that evicts *other sessions'* warm compiler too: a
deliberate act when memory has run out, never a post-build step.

## Never

- Never leave a .NET repository without its root `Directory.Build.rsp`.
- Never type a build command without `-m:N` because this build looks small — the other four sessions
  are also building something small.
- Never assume a command that does not compile is free: `dotnet restore` opens the same pool.
- Never put `-m` in a response file or an environment variable and believe it took effect.
- Never use `-noautorsp` to widen a build — pass `-m` instead.
- Never rely on the idle timeout: it returns the memory after the work is over.
- Never run `dotnet build-server shutdown` as routine cleanup on a shared machine.

## Definition of Done

- [ ] The repository has `Directory.Build.rsp` at its root containing `-nr:false`.
- [ ] Every `build`, `restore`, `msbuild`, `publish` and `pack` command — in the task, in scripts and
      in CI — carries `-m:N`, and no `-noautorsp` appears anywhere.
- [ ] `node <conventions>/tools/build-flags-check.mjs` passes from the repository root.
- [ ] `node <conventions>/tools/adapter-check.mjs` passes, so the guard is wired rather than assumed.
