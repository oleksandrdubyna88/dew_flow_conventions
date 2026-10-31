# PLAN — C#/Node rule parity: every C# requirement has a Node/TypeScript counterpart of equal strength, and the reverse

> Status: **plan only, nothing implemented yet, 2026-10-31.** Scope: the shared rule corpus (`common/`, `csharp/`,
> `typescript/`), its selection metadata, `research/rule-bodies.json`, the selection and size tests in
> `tools/rules.test.mjs`, two tools (`tools/http-coverage.mjs` gains Node routes; a new `tools/node-strictness-check.mjs`),
> the documents that describe them, one `release` promotion and the bump pull requests of the consumers. It changes no
> consumer's code. The `## Plan changes` ledger opens at this plan's first approval
> ([plan-change-control.md](../common/plan-change-control.md)); until then the plan has none.
>
> Related docs: [csharp/doctrine.md](../csharp/doctrine.md), [typescript/doctrine.md](../typescript/doctrine.md),
> [rust/doctrine.md](../rust/doctrine.md), [csharp/nuget-packages.md](../csharp/nuget-packages.md),
> [common/testing.md](../common/testing.md), [common/reliability.md](../common/reliability.md),
> [common/logging-serilog.md](../common/logging-serilog.md), [common/utc-timestamps.md](../common/utc-timestamps.md),
> [common/security.md](../common/security.md), [common/http-contracts.md](../common/http-contracts.md),
> [research/module_rules.md](../research/module_rules.md), [README.md](../README.md) § *Consumers*, § *How `release` moves*.
> The other side of the boundary is a plan in another repository, cited as a path (§ 6):
> `dew_flow_benchmark · todo/PLAN_lang_comparison_v2.md` (branch `docs/plan-lang-comparison-v2`, read at `aa5e413`).

## 1. The symptom, before any solution

An experiment compares C# (.NET 10) and TypeScript (Node 26) coding agents that both follow these conventions
(`dew_flow_benchmark · todo/PLAN_lang_comparison_v2.md` D20, D23, T14). Its process arm applies the family's rules to
both stacks, so a rule that exists for one stack and not the other is a treatment difference the arm applies to one side
only. The operator's requirement (2026-10-31): *if the conventions have rules for C#, there must be equivalent rules for
Node, adapted to Node's own features, so that everything is fair* — in **both directions** and in **strength**, not only
in topic. The new rules are released before the experiment's pre-registration, and the experiment's task repository pins
that release.

What the corpus holds today (every point re-verified against this worktree at `f46982f`, 2026-10-31):

| Where | What is there | The gap |
|---|---|---|
| `csharp/doctrine.md:10` | ".NET 10, latest C#, `TreatWarningsAsErrors`", records, typed values, no null in logic, § 4a the omitted DTO field, `Outcome<T>`, complexity ≤ 4 (`:78`), immutable contracts; no Definition of Done | The TypeScript doctrine states no runtime, no compiler version and no compiler strictness at all |
| `csharp/dotnet-build.md` | `-nr:false` and `-m:N`, a `PreToolUse` hook and `tools/build-flags-check.mjs` | No Node rule has an enforcement of any kind |
| `csharp/nuget-packages.md` | central pins, publisher/freshness table, *licence before version* "in any ecosystem" (`:25`), monthly bump, zero-reference projects; `tasks: ["dependencies"]` (`:5`) | A TypeScript agent on `--task dependencies` reads NuGet text and nothing about npm (measured: `dependencies --file package.json` selects `csharp.nuget-packages`, § 5) |
| `typescript/doctrine.md` | four traps measured in one VS Code extension (`<script>` interpolation, backticks in template literals, `as` casts in fixtures, `tsc` emits despite errors), a Definition of Done; `paths` `**/*.ts,tsx,mts,cts` (`:4`) | `.js/.mjs/.cjs`, `package.json` and `tsconfig*.json` select **no** language rule, and `ENTRY.md:57-58` forbids inventing one. The traps' evidence names three source files and "a real vault" (`:33-36`) — a path and a product shape [rule-ownership.md](../common/rule-ownership.md) says to anonymise |
| `common/testing.md:12-33` | the xUnit v3 / MTP runner section, "never `dotnet test`"; `:32` exempts the Rust runner by name; `:354` "Architecture is a test" reads assembly references; `:368` DoD "the runner executable was used" | No Node runner section; the DoD's first box cannot be ticked by a Node agent |
| `common/logging-serilog.md` | Serilog, the contract, `:153` the C# shape, `:172-186` a **Rust** section, `:190` "never `Console.WriteLine`" | No Node section; a TypeScript agent is told about `ILogger<T>` and nothing about `console.log` or pino |
| `common/reliability.md:47-69, :95-132` | `BackgroundService`, `TaskScheduler.UnobservedTaskException` (`:59`), `CancellationToken` end-to-end (`:97`), `PosixSignalRegistration` (`:100`), `OperationCanceledException` vs `TaskCanceledException` (`:104-132`) | No `AbortSignal`, `unhandledRejection`, `SIGTERM`, timer-keeps-the-loop-alive, promise-without-catch — the exact mechanics the experiment's daemon tasks test |
| `common/security.md:18, :26` (always loaded) | `dotnet user-secrets`; `Process.Kill(entireProcessTree: true)` | No Node form of either, and Node has no tree-kill primitive (measured § 4.3) |
| `common/utc-timestamps.md` | `DateTimeOffset`, `TimeProvider.GetUtcNow()` (`:35`), `:65` a **Rust** section | No `Date`/`Temporal` section; JavaScript's calendar-day trap is the **inverse** of .NET's (measured § 4.3) |
| `common/platform-limits.md:43` | `Encoding.UTF8.GetByteCount` | no `Buffer.byteLength` |
| `common/http-contracts.md:31-35` and `tools/http-coverage.mjs:45-49` | ASP.NET and axum rows; the scanner reads `Map*` and `.route(` (`http-contracts.md:166`) | No Node framework row; the scanner is blind to every Node route although `.ts/.js/.mjs` are in its extension set (`http-coverage.mjs:41`) |
| `common/post-deploy-checks.md:49`, `common/coding-style.md:32` | "a package (NuGet, ghcr, crates.io)"; "the C#-specific shape is in csharp/doctrine" | no npm; no pointer to the TypeScript shape |
| Balanced already | `common/local-cpu-budget.md:31, :36` (`node --test` and xUnit rows), `common/test-leftovers.md` (bash, Node and C# named together), `common/development-workflow.md:46, :56` (a `tsc` trap and a `dotnet` trap) | — |

**Absent on BOTH sides**: an analyzer/lint requirement, a lock file and a locked restore (only Rust has `--locked`,
`rust/doctrine.md`), a vulnerability scan, coverage thresholds, CI steps per language. **C# also lacks** `Nullable`
`enable`, which every .NET consumer's `Directory.Build.props` sets (read in three consumers, 2026-10-31) and no rule
requires.

**Reverse gaps** (a TypeScript rule with no C# counterpart): HTML/JSON-in-script encoding (`typescript/doctrine.md:15`;
the Razor shape is `MarkupString`/`Html.Raw`), test-fixture casts (`:66`; the C# shape is `null!`/`default!`), and a
Definition of Done.

The house precedent for a language mirror is `rust/doctrine.md:8` ("The Rust mirror of csharp/doctrine.md. Written down
from what the family's Rust crate already practices") and the `## Rust` sections of `logging-serilog.md:172` and
`utc-timestamps.md:65`.

## 2. Goal

1. A **parity table** (§ 3) in which every C#-specific requirement, and every C#-only section of a common rule, has a
   Node/TypeScript counterpart of equal strength, and every TypeScript requirement has a C# counterpart; a gap on both
   sides is either raised on both or recorded as deliberately absent, with the reason.
2. The rules that close the table, released through `promote-release` **before** the experiment's pre-registration, and
   pinned by the experiment's task repository (the other plan's E0.S3).
3. Every Node claim in a rule rests on a **run** recorded in this repository or a **cited document** — never on memory
   (§ 4.3, § 11).
4. Every size budget the resolver's tests pin stays green, with the numbers measured before and after (§ 5).

**Equal strength, defined.** Two requirements are of equal strength when (a) they are selected for the same kind of
scope (a language file, a manifest, a task) — a rule one agent gets on every source file and the other gets only on a
task is not equal; (b) they have the same mood — MANDATORY against MANDATORY, a Definition of Done box against a box;
(c) they have the same enforcement class — a file a check verifies, a command a hook refuses, or prose alone; and (d)
the consequence is the same — a warning that fails the build on one side fails it on the other. The table below carries
the class in the *strength* column.

## 3. The parity table

Direction `C# → Node` first, then `TS → C#`, then the gaps on both sides. *Where* names the file that will carry each
side after this plan; *strength* is the class of § 2.

### 3.1 C# requirements → Node/TypeScript counterparts

| # | C# requirement (where today) | Node/TypeScript counterpart (where after) | Strength |
|---|---|---|---|
| P1 | ".NET 10, latest C#" (`csharp/doctrine.md:10`) | "Node 26 (the current LTS line), TypeScript 7" stated the same way in `typescript/doctrine.md` § 0 and `typescript/compiler-strictness.md` (§ 4.1); the toolchain caveat of § 4.6 | prose, on every language file — equal |
| P2 | `TreatWarningsAsErrors` (`:10`) | `"strict": true`, `"noEmitOnError": true` wherever `tsc` emits, and the lint run at `--max-warnings 0` — `typescript/compiler-strictness.md`, selected by `**/tsconfig*.json`; the one-line statement also in the doctrine's § 0 so a `.ts` scope sees it | file + a CI check (`tools/node-strictness-check.mjs`, § 4.5) — **stronger than C#**, which has prose only; C# gains nothing here because MSBuild already fails the build on a warning once the property is set, which is the check |
| P3 | `Nullable enable` — absent from the rule, present in every consumer | `strictNullChecks` (inside `strict`) — the same rule | raised on **both**: `csharp/doctrine.md` § 1 gains `Nullable enable` |
| P4 | complexity ≤ 4, `private static` where no state is read (`:75-78`) | the same number as a lint rule (`complexity: ["error", 4]`, `max-lines-per-function` 50, `max-lines` 800, `no-console`) — the shape two TypeScript consumers already run (read 2026-10-31) — in `compiler-strictness.md` | prose ↔ lint-enforced: TS stronger; C# stays prose (an analyzer rule for complexity needs a package the family has not adopted — recorded, § 10 Q7) |
| P5 | records for data, typed values, no primitive obsession, no null in business logic (§ 2–4) | `readonly` object types and `Readonly<T>`, branded types for ids, `undefined` only at the edges, discriminated unions for outcomes — `typescript/doctrine.md` § 0 one sentence each, pointing at the C# doctrine for the reasoning ("the idea is the rule and the language is the accent", `rust/doctrine.md`) | prose ↔ prose; bytes bounded by § 5 |
| P6 | § 4a a DTO field the client omitted is `null` | a `JSON.parse` result is `any`: a field the client omitted is `undefined` whatever the declared type says; validate at the single road in (a schema, or a typed parser) — `typescript/doctrine.md` § 0; the 64-bit id trap (`JSON.parse` rounds `9007199254740993` to `…992`, measured § 4.3) beside it | prose ↔ prose |
| P7 | `Outcome<T>`, never `throw` for control flow (§ 5) | a discriminated union result; `throw` only for the unexpected; the shared outcome shape once per repository — `typescript/doctrine.md` § 0; `coding-style.md:32` points at BOTH doctrines | prose ↔ prose |
| P8 | `dotnet-build.md`: the worker pool, hook + check | **No Node counterpart.** The rule exists for a measured resource problem (72 MSBuild workers, 10 775 MB) that Node builds do not have; a hook is added for a measurement, not for symmetry (§ 4.5). Node's enforced rule is P2's check instead | deliberately absent; stated in `research/module_rules.md` |
| P9 | `nuget-packages.md`: central pins; publisher/freshness; licence before version; monthly bump; zero-reference projects | `typescript/npm-packages.md` (§ 4.2): exact pins (`save-exact=true` in `.npmrc`; measured: a bare `--save-dev` writes `^5.9.3`), a committed `package-lock.json`, `npm ci --ignore-scripts` as the only install in CI (measured: it refuses a lock out of step), `npm outdated` and `npm audit` on the monthly bump, `engines.node`, `node:` built-ins before a package; the neutral text (publisher table, licence, monthly bump, prefer nothing) moves to `common/dependencies.md` | prose ↔ prose, each selected by its own manifest; the shared part on `--task dependencies` only |
| P10 | `testing.md:12-33` the runner section; `:368` "the runner executable was used" | a `## Running tests — Node` section: `node --test` (built in) or vitest, run by a script that computes the concurrency cap (`local-cpu-budget.md:31`); the flags table (`--test-name-pattern`, `--test-only`, `--test-timeout`, `--test-concurrency`); the compile-then-run contract and the exit code that must be read (`typescript/doctrine.md:80`); the DoD box becomes "the repository's documented runner was used (the MTP executable, `cargo test`, `node --test`) — never `dotnet test`" | prose ↔ prose; both split-read tasks |
| P11 | `testing.md:354` architecture tests read assembly references | the same section gains one sentence: a Node repository asserts its layer rules over the import graph (one scan of `import`/`require` statements kept as a test) | prose ↔ prose |
| P12 | `logging-serilog.md`: the contract, the C# shape, the Rust section | a `## Node` section after `## Rust`: pino or a one-file equivalent; the same path shape, UTC, level from configuration, 14-day prune at startup, coloured console with a plain file; a stdio-protocol host logs to **stderr** (`:91`, the MCP-server case); "never `console.log` for a log" beside "never `Console.WriteLine`" (`:190`) | prose ↔ prose |
| P13 | `reliability.md:47-69, :95-132` | Node paragraphs in the same sections: every detached promise ends in a `catch` that logs; `process.on('unhandledRejection')` as the net under the net (the default is a crash, measured); `AbortSignal` end-to-end, `AbortSignal.any` to combine; a `SIGTERM` handler on every host, CLIs included (the default is exit 143 with no cleanup, measured); a bounded shutdown with `.unref()`; "a timeout is not a cancellation — and Node spells them **differently**": `AbortSignal.timeout` rejects with `TimeoutError`, a caller's abort with `AbortError` (measured) — filter on the reason's `name`, or on the caller's own `signal.aborted` when signals are combined | prose ↔ prose |
| P14 | `security.md:18` `dotnet user-secrets` | "…`dotnet user-secrets`, an uncommitted `.env` read with `node --env-file` (measured), or a secret manager" | always core — equal |
| P15 | `security.md:26` `Process.Kill(entireProcessTree: true)` | Node has no tree kill: spawn the child in its own process group (`detached: true`) and kill the group (`process.kill(-child.pid)`; Windows `taskkill /T`); `child.kill()` alone leaves the grandchildren (measured: 2 of 2 left, against 0 for the group kill) | always core — equal, and the asymmetry stated |
| P16 | `utc-timestamps.md` .NET bullets and `:65` Rust | a `## Node` section: `Date` parses a date-only string as **UTC** and a date-time string without an offset as **local** (measured in two zones) — the inverse of the .NET trap, so the rule is "stamp the day; never give a day a time of day"; the clock is an injected function, never `Date.now()` in code that writes a row; `Temporal` is present on Node 26 (`typeof Temporal === "object"`, measured) and `Temporal.PlainDate` is the typed calendar day | prose ↔ prose; bounded by the `storage` single-read cap (§ 5) |
| P17 | `platform-limits.md:43` `Encoding.UTF8.GetByteCount` | "…(`Buffer.byteLength(path, "utf8")` in Node — measured: a 7-character string with one two-byte character is 8 bytes)" | one clause |
| P18 | `http-contracts.md:31-35` ASP.NET and axum rows; `http-coverage.mjs:45-49` | two rows: a Fastify/Express style `app.<verb>(path)` grouped by the plugin or router registered under a prefix; `fastify.route({ url })`; the scanner gains a `NODE_ROUTE` and a prefix pattern (`register(…, { prefix })`, `app.use('/p', router)`) with the three-line companion test; `:166` is rewritten to say what the scanner now reads | rows ↔ rows; scanner ↔ scanner |
| P19 | `post-deploy-checks.md:49` "(NuGet, ghcr, crates.io)" | "(NuGet, npm, ghcr, crates.io)" | one word |
| P20 | selection: `**/*.cs`, `**/*.razor`, `**/*.csproj` select the C# doctrine; `.csproj`, `Directory.*.props`, `NuGet.Config` select the package rule | `**/*.ts,tsx,mts,cts` **and** `**/*.js,mjs,cjs` select the TypeScript doctrine; `**/tsconfig*.json` selects `compiler-strictness`; `**/package.json` selects `npm-packages` | selector ↔ selector (§ 4.4) |

### 3.2 TypeScript requirements → C# counterparts

| # | TypeScript requirement (where today) | C# counterpart (where after) | Strength |
|---|---|---|---|
| R1 | § 1 `JSON.stringify` into `<script>` is a break-out; one shared escaper; a scan test (`typescript/doctrine.md:15-47`) | `csharp/doctrine.md` § 8: `MarkupString` and `Html.Raw` are the same door — a value they wrap reaches the page unescaped; JSON for a `<script>` goes through ONE helper that also closes `</script>` and `<!--`; the general rule is `security.md` § *A measure applied at SOME of its sites* | MANDATORY ↔ MANDATORY |
| R2 | § 3 an `as` cast in a fixture (`:66-78`) | the same § 8: `null!` and `default!` in a fixture are the same promise — a typed factory with real defaults instead; adding a required member is the moment to grep for them | prose ↔ prose |
| R3 | a Definition of Done (`:98`) | `csharp/doctrine.md` gains a Definition of Done (typed values, no `throw` for control flow, complexity, immutable contracts, `Nullable enable` and `TreatWarningsAsErrors` set, no `MarkupString` outside the helper) | box ↔ box |
| R4 | § 4 `tsc` emits despite errors | no C# counterpart needed: the C# compiler emits nothing on an error. Stated once in the TypeScript rule as a difference, not a gap | deliberately absent |
| R5 | § 2 backticks in template literals | C# raw string literals have no comparable trap (`"""` cannot be ended by a shorter run) — stated in § 4's placement note | deliberately absent |

### 3.3 Gaps on both sides — raised or recorded

| Gap | Decision | Why |
|---|---|---|
| Analyzer / lint requirement | **Raise both, asymmetrically named**: TS lint at zero warnings (P2, P4); C# `TreatWarningsAsErrors` + `Nullable enable` + `AnalysisLevel` latest in `csharp/doctrine.md` § 1 | The compiler is the C# analyzer the family already pays for; an extra analyzer package is a dependency decision for the consumers, not a shared rule (Q7) |
| Lock file + locked restore | **Raise TS (lock + `npm ci`), record .NET**: central exact pins of direct packages exist today; `packages.lock.json` with `--locked-mode` is not required | Imposing lock files on six .NET consumers is a consumer change this plan does not own; the asymmetry (npm's lock also fixes transitives) is stated in `common/dependencies.md` and is Q1 for the owner |
| Vulnerability scan | **Raise both** in `common/dependencies.md`: the monthly bump runs the ecosystem's scanner (`npm audit`; `dotnet list package --vulnerable --include-transitive`; `cargo audit` where installed) and records the result beside the pins | Cheap, equal, and both commands exist today (npm measured) |
| Coverage thresholds | **Deliberately absent on both** | `testing.md` governs what a test may claim; a number is gamed the week it lands. Stated in `common/dependencies.md`? No — in `research/module_rules.md`, because it is a decision about the corpus, not a rule |
| CI steps per language | **Deliberately absent as shared rules** | `testing.md:16-18`: each repository's own instructions and CI name the exact commands. Shared text would be an inventory |
| A runtime version statement | **Raise TS** (P1) | C# has one; TS gets one of the same shape |

## 4. Design

### 4.1 New files in `typescript/`

The directory name is the namespace, not the file type — as `csharp/` holds `dotnet-build.md` and `nuget-packages.md`.
`tools/lib/rule-catalog.mjs:29` and `tools/rule-bodies.mjs:39` walk `common, csharp, rust, typescript`; nothing is added
to either list.

**`typescript/compiler-strictness.md`** — id `typescript.compiler-strictness`, `paths: ["**/tsconfig*.json"]`, no
`tasks`. ≤ 3,300 B (§ 5). Content: the version line (P1); `strict`; `noEmitOnError` where the project emits (measured
on tsc 5.9.3: without it a type error exits 2 **and writes `out/a.js`**; with it exits 1 and writes nothing); when Node
runs `.ts` directly (type stripping, no build), the TEST script runs `tsc --noEmit` first, because stripping checks
nothing (measured: a file with `const n: number = "x"` ran and exited 0) and `erasableSyntaxOnly` is on (measured:
`enum` is refused with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`); the lint set at `--max-warnings 0` with the four numeric
rules of P4 and `reportUnusedDisableDirectives: "error"` — the shape two consumers run; a Definition of Done.

**`typescript/npm-packages.md`** — id `typescript.npm-packages`, `paths: ["**/package.json"]`, no `tasks` (§ 4.4 says
why not `package-lock.json` or `.npmrc`). ≤ 3,500 B — the size class of the trimmed NuGet rule. Content: P9; the
pointer "licence before version, publisher and freshness, the monthly bump: [common/dependencies.md]"; the typescript-eslint
peer-range constraint as the family's worked example of a recorded transitive constraint (§ 4.6), anonymised to the shape.

### 4.2 The shared dependency rule, and the NuGet rule after it

**`common/dependencies.md`** — id `common.dependencies`, `tasks: ["dependencies"]`, no `paths`, no `depends`. Holds what
`csharp/nuget-packages.md` says that is true of every ecosystem: *Before adding any package* (the publisher/freshness
table, reworded without "nuget.org"), *Licence before version* (`:25-27`, moved verbatim), *Bumping* (monthly, latest
stable, never a preview, the suite run, the transitive-constraint comment), the vulnerability scan (§ 3.3), *Prefer
nothing*, and the lock/pin asymmetry sentence. `dependencies` is a split-read task (`tools/rules.test.mjs:204`), so the
rule has no single-read cap; target ≤ 4,000 B.

**`csharp/nuget-packages.md`** loses `tasks: ["dependencies"]` (so `package.json` work no longer reads NuGet text; the
file is then selected by `.csproj`, `Directory.Packages.props`, `Directory.Build.props`, `NuGet.Config` only — the test at
`tools/rules.test.mjs:176` still passes), keeps central pins, the two family-wide decisions (FluentAssertions 7.2.2, the
Aspire pair), the two `dotnet` commands and the zero-reference box, and carries the one-line pointer to the shared rule.
Expected size ≈ 2,000 B (from 3,081), which widens the `inspect --file src/x.csproj` headroom (§ 5).

**Why a new common rule and not `development-workflow.md`**: that rule is selected by nine tasks (`:4`) and would deliver
package policy to a `docs` scope; `dependencies` alone is the scope that needs it. Why no `depends:` from the two
ecosystem rules: `inspect --file src/x.csproj` has 867 B of headroom and a dependency would bring ≈ 4,000 B into it
(§ 5). An agent adding a package names `--task dependencies` (`ENTRY.md` step 5: every relevant task) and gets the
shared rule; one inspecting a manifest gets the ecosystem rule and its pointer.

### 4.3 Node sections in the common rules — the Rust precedent — and the evidence behind each claim

Each Node sentence enters a common rule the way the Rust sections did: a `## Node` section where the rule has a `## Rust`
one (`logging-serilog.md`, `utc-timestamps.md`), a Node paragraph inside the section whose C# paragraph it mirrors
(`reliability.md`, `testing.md`, `security.md`, `platform-limits.md`), a table row where there is a table
(`http-contracts.md`). No section is written from memory; this table is what E3 records in
`research/2026-10-31_node_behaviour_probes.md` (the record the rules cite by date), extended with every probe the stories
add. **Measured on this machine, Node v26.12.1, npm 11.20.0, 2026-10-31**, from the scratch directory, every command
and its output kept in the record:

| Claim a rule will carry | Probe | Observed |
|---|---|---|
| `AbortSignal.timeout` rejects with a `DOMException` named `TimeoutError`; a caller's `abort()` gives `AbortError` | `AbortSignal.timeout(10)` read after 50 ms; `new AbortController().abort()` | `TimeoutError`, `instanceof DOMException` true; `AbortError` |
| `AbortSignal.any([caller, timeout])` carries whichever fired first | the two combined, read after 50 ms | reason `TimeoutError` |
| `Date` parses a date-only ISO string as UTC and a date-time string without offset as local | `new Date("2026-07-01")`, `new Date("2026-07-01T12:00:00")` under `TZ=Europe/Paris` (offset −120) and `TZ=Europe/Kyiv` | `…T00:00:00.000Z` in both zones; `…T10:00:00.000Z` and `…T09:00:00.000Z` |
| `Temporal` is available unflagged | `typeof Temporal` | `object` |
| An unhandled rejection crashes the process by default | `Promise.reject(new Error("boom"))` with a later timer | stack printed, exit 1, the timer never ran |
| `SIGTERM` with no handler ends the process without cleanup; a handler runs the cleanup | `process.kill(process.pid, "SIGTERM")` with and without a listener | exit 143, nothing printed; "handler ran", "cleanup finished", exit 0 |
| A pending timer keeps the loop alive until `.unref()` | `setTimeout(…, 2000).hasRef()` before and after `unref()` | `true`, then `false` |
| `child.kill()` does not reach grandchildren; a process-group kill does | `sh -c "sleep & sleep & wait"` spawned twice, once `detached: true`; `child.kill("SIGTERM")` vs `process.kill(-child.pid, "SIGTERM")`; `pgrep -f "^sleep N$"` | before: 2 and 2; after: **2 left** vs **0 left** |
| `Buffer.byteLength` counts encoded bytes | `"abcdefé"` | `length` 7, bytes 8 |
| `JSON.parse` rounds a 64-bit id | `JSON.parse('{"id":9007199254740993}').id` | `9007199254740992`; `Number.isSafeInteger` false |
| `node --env-file` loads an uncommitted secrets file | `node --env-file=.env -e …` | the value read |
| Node runs a `.ts` file with a type error (stripping checks nothing) | `const n: number = "not a number"` | ran, exit 0, `typeof n` `string` |
| `enum` is refused under type stripping | `enum Color { Red }` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| `tsc` emits despite errors unless `noEmitOnError` | tsc 5.9.3, `strict`, one type error, with and without the flag | exit 2 and `out/a.js` written; exit 1 and no output directory |
| `npm install --save-dev x@v` writes a caret range unless `--save-exact` | `typescript@5.9.3`, then `--save-exact picomatch@4.0.3`; `npm config get save-prefix`, `save-exact` | `"^5.9.3"`; `"4.0.3"`; `^`, `false` |
| `npm ci` refuses a lock out of step with `package.json` | the dev dependency changed to `5.8.3` against a lock at `5.9.3` | `EUSAGE … lock file's typescript@5.9.3 does not satisfy typescript@5.8.3`, exit 1; a range the lock satisfies (`^5.8.0`) is accepted — the refusal is about satisfaction, not equality |
| `node --test` carries the flags P10 names | `node --help` | `--test-name-pattern`, `--test-only`, `--test-timeout`, `--test-concurrency`, `--test-skip-pattern` present |

Claims the stories still owe a run before the text lands (each is an acceptance criterion in E3): `process.exitCode`
versus `process.exit()` inside a shutdown (`post-deploy-checks.md:154` already records the Windows crash); pino's file
and console transports writing the family's path shape with UTC; `readline`/stream backpressure under a slow consumer;
a `node --test` run of a type-stripped `.ts` suite with `--import` of the priority preload; the Windows `taskkill /T`
half of P15; a Fastify and an Express route formatted across three lines found by the scanner.

### 4.4 Selectors

| File shape | Today | After | Why |
|---|---|---|---|
| `**/*.ts,tsx,mts,cts` | `typescript.doctrine` | the same | the two pinned scopes that carry it have 2,652 B and **439 B** of headroom (§ 5), so no second rule may join this selector; the doctrine grows only by what § 4.7 trims |
| `**/*.js,mjs,cjs` | nothing | `typescript.doctrine` | `ENTRY.md:57-58`: a scope with no language rule invents none; § 1, § 2 and § 0 of the doctrine are true of plain JavaScript. Measured cost: `inspect` 24,207 → 30,116 B, `ui` 26,420 → 32,329 B (the same numbers as `ui/a.ts` today); `gpu` and `storage` with a `.mjs` file land at 33,589 and 35,315 B — exactly where those tasks already stand with a `.ts` file, which the test at `tools/rules.test.mjs:252` does not pin. This repository's own `tools/*.mjs` then load the doctrine on an `inspect`; E2 verifies the scope stays one read. Q5 asks the owner to confirm |
| `**/tsconfig*.json` | nothing | `typescript.compiler-strictness` | the manifest the rule governs; `storage --file tsconfig.json` is the tightest new scope (29,406 B + the rule) and sets the 3,300 B ceiling |
| `**/package.json` | `common.local-cpu-budget` (11,202 B; `inspect` scope 35,409 B, already a split read) | `+ typescript.npm-packages` | adding to a scope that is already over 32 KiB crosses no cap; `package-lock.json` and `.npmrc` are **not** selectors — they are what following the rule produces, and each would open a new single-read scope with a 3,362 B ceiling for no reader |
| `.csproj`, `Directory.*.props`, `NuGet.Config` | `csharp.nuget-packages` (and `--task dependencies`) | paths only | § 4.2 |
| `--task dependencies` | `csharp.nuget-packages` | `common.dependencies` | § 4.2 |

New selection tests in `tools/rules.test.mjs`, in the style of `:176-200`: `tsconfig.json` and `src/tsconfig.build.json`
select `typescript.compiler-strictness` and `.ts`/`.cs` do not; `package.json` selects `typescript.npm-packages` and not
`csharp.nuget-packages`; `--task dependencies` with no file selects `common.dependencies` and neither ecosystem rule;
`src/a.mjs` and `src/a.cjs` select `typescript.doctrine`; `src/x.csproj` still selects both C# rules. The single-read
scope list at `:252` gains `inspect`/`ui`/`gpu`/`storage` × `tsconfig.json`, `inspect`/`ui` × `src/a.mjs`, and
`inspect` × `tools/rules.mjs` (this repository's own case).

### 4.5 Enforcement parity

| .NET | Node | Class |
|---|---|---|
| `tools/build-flags-check.mjs`: `Directory.Build.rsp` exists and says `-nr:false`; no `-noautorsp` in workflows, scripts, `package.json`; a repository with no C# passes without opinion | **`tools/node-strictness-check.mjs`** (new): for every `tsconfig*.json` outside `node_modules`, the compiler's own merged view (`<repo>/node_modules/.bin/tsc --showConfig -p <file>`, so `extends` chains resolve as `tsc` resolves them) has `strict: true`, and `noEmitOnError: true` unless `noEmit: true`; every `package.json` with dependencies has an `.npmrc` beside it or above it saying `save-exact=true`; a `test` script that runs `node` on a `.ts` file is preceded by a `tsc --noEmit`; `--warn` first, as every check here lands ([README.md](../README.md) § *tools*); a repository with no `tsconfig*.json` passes without opinion; **a TypeScript repository whose `tsc` is not installed is INCOMPLETE, never green** — the JUnit-reader principle (`README.md` § *tools*) | check ↔ check |
| `settings/hooks/build-flags.mjs`: a `PreToolUse` hook refusing a `dotnet build` without `-m:N` | **none** — the hook exists for a measured resource problem (`csharp/dotnet-build.md` § *Measured 2026-09-11*). The candidate Node hook — refuse `npm install <pkg>` without `--save-exact` — is unnecessary once `.npmrc` carries `save-exact=true`, which is a FILE the check verifies (measured: the setting is honoured). What a Node hook would need to earn its place: a measured cost that no file can carry, recorded like the MSBuild one | deliberately absent; stated in `research/module_rules.md` |
| `tools/http-coverage.mjs` reads `Map*` | reads `app.<verb>(` and `route({ url })` too (P18) | one tool |
| `tools/adapter-check.mjs` compares every hook | unchanged | — |

Consumers wire the new check as one CI step beside `build-flags-check` ([ROLLOUT.md](../ROLLOUT.md) § CI); a .NET-only
consumer may add it for uniformity because it passes without opinion (Q8).

### 4.6 Versions

`typescript/doctrine.md` § 0 and `typescript/compiler-strictness.md` open the way `csharp/doctrine.md:10` does:
**"Node 26 (the current LTS line), TypeScript 7, `strict`."** Node 26's LTS status and the newest TypeScript are read
from the official indexes on the day the text lands and the date is written beside them, as the other plan did
(`nodejs.org/dist/index.json`: v26.13.0 is LTS "Lithium", read 2026-10-31 there; `npm view typescript version` → 7.0.2,
read here 2026-10-31).

**The caveat the rule must carry, measured 2026-10-31:** `typescript-eslint@8.72.1` declares
`peerDependencies.typescript = ">=4.8.4 <6.1.0"`, so a repository that lints with it cannot be on TypeScript 7 today;
one consumer here records exactly that constraint in its lint config and sits on 6.0.3 for it. The rule therefore says:
TypeScript 7 **where every tool in the chain accepts it**; otherwise the newest version every tool accepts, with the
constraining tool and the date to revisit written beside the pin — the same shape `nuget-packages.md` § *Bumping* gives a
transitive constraint. ".NET 10 … never a preview" has no such caveat because nothing in the .NET chain refuses the
current SDK. Q2 asks whether the owner prefers the plain statement.

### 4.7 What the two doctrines gain, and what they give up to fit

**`typescript/doctrine.md`** (5,909 B; ceiling 6,348 B = the `ui --file ui/a.ts` scope at 32,768): gains a `## 0.
Language & runtime` section of at most 1,000 B — P1, P2's one line, P5–P7 one sentence each with a pointer to the C#
doctrine, and which sections apply to plain JavaScript (§ 1, § 2; § 3 and § 4 are TypeScript's). It gives up the three
source-file names and "a real vault" in § 1 (`:33-36`; anonymised to "three modules, three hands, one shipped build",
the date kept), and the second bullet of § 4's shared-checkout narrative is folded into one sentence that keeps its
qualifier (*say so; never work around a red file*) — [knowledge-base.md](../common/knowledge-base.md) § *Shortening a
rule drops the caveat* governs the trim. Target ≤ 6,300 B, measured.

**`csharp/doctrine.md`** (4,613 B; ceiling 5,088 B = the `gpu --file src/x.cs` scope at 32,768): gains `Nullable enable`
and `AnalysisLevel` in § 1 (≈ 80 B), § 8 *Razor output and test fixtures* (R1, R2; ≈ 500 B) and a Definition of Done
(R3; ≈ 350 B). It gives up ≈ 450 B of § 4a's narrative — the two instances stay as "measured 2026-09-03, two
repositories, one `.http` suite's first run", the three numbered steps stay whole. Target ≤ 5,050 B, measured.

Both trims are reviewed against the qualifier test: the short form, read by someone who has not seen the long one, must
not be followable into the failure the original prevented.

## 5. The size plan — measured

Budgets, from `tools/lib/rule-catalog.mjs:31` and `tools/rules.test.mjs:250-257`: the always-loaded core ≤ 16,384 B;
every pinned single-read scope ≤ 32,768 B. Measured on this worktree at `f46982f` with
`node tools/rules.mjs explain --repo . --task <t> --file <f>` (the `bytes` field; the per-rule `bytes` are the catalog's):

| Scope | Today | Rules in it | Headroom | What this plan adds | Ceiling it sets |
|---|---|---|---|---|---|
| always core | **15,055** B (`coding-style` 2,889 + `knowledge-base` 3,564 + `security` 8,602) | — | 1,329 B | P14 ≈ 150 B, P15 ≈ 350 B in `security.md`; P7's pointer ≈ 60 B in `coding-style.md` | ≤ 600 B total, measured |
| `inspect` (no file) | 24,207 | core + `task-lifecycle` | 8,561 | nothing | — |
| `inspect --file ui/a.ts` | 30,116 | + `typescript.doctrine` 5,909 | 2,652 | the doctrine's net growth | doctrine ≤ 6,348 B (the tighter `ui` row rules) |
| `ui --file ui/a.ts` | **32,329** | core + `task-lifecycle` + `durable-status` + doctrine | **439** | the doctrine's net growth | **doctrine ≤ 6,348 B** |
| `gpu --file src/x.cs` | **32,293** | core + `task-lifecycle` + `gpu-lease` + `csharp.doctrine` | **475** | R1–R3, P3 | **`csharp/doctrine.md` ≤ 5,088 B** |
| `inspect --file src/x.csproj` | 31,901 | + `csharp.doctrine` + `csharp.nuget-packages` | 867 | the doctrine's growth (≤ 475) minus the NuGet trim (≈ −1,000) | net headroom grows |
| `ui --file src/x.cs` | 31,033 | | 1,735 | ≤ 475 | fits |
| `storage` (no file) | 29,406 | core + `task-lifecycle` + `utc-timestamps` 5,199 | 3,362 | P16's `## Node` section | **≤ 1,200 B**, measured |
| `storage --file tsconfig.json` | 29,406 (nothing selected today) | + `compiler-strictness` | 3,362 | the whole rule | **`compiler-strictness.md` ≤ 3,300 B** |
| `gpu --file tsconfig.json` | 27,680 | + `compiler-strictness` | 5,088 | | fits under the 3,300 ceiling |
| `inspect --file src/a.mjs` | 24,207 → 30,116 | + doctrine | 8,561 → 2,652 | the `.js` selector | fits |
| `ui --file src/a.mjs` | 26,420 → 32,329 | + doctrine | 439 | the `.js` selector | fits, by the doctrine ceiling |
| `inspect --file package.json` | 35,409 | + `local-cpu-budget` 11,202 | already a split read | + `npm-packages` ≈ 3,500 | no cap crossed; recorded |
| `dependencies --file package.json` | 171,557 | 19 rules incl. `csharp.nuget-packages` | split read | − NuGet (3,081) + `common.dependencies` + `npm-packages` | recorded |
| `implement --file ui/a.ts` | 292,834 | 28 rules | split read | the Node sections of `testing`, `logging-serilog`, `reliability`, `platform-limits`, `http-contracts` | recorded per rule |

Not pinned today and already over one read with a language file: `gpu --file ui/a.ts` 33,589 B, `storage --file
ui/a.ts` 35,315 B, `storage --file src/x.cs` 34,019 B. The plan leaves them split reads and pins the new scopes of
§ 4.4 instead. Every story that touches a rule re-runs the eleven `explain` calls above and writes the after-column
into `research/module_rules.md` the way the plan-change-control record did (`research/module_rules.md` § *The size
measurement*).

## 6. Boundary with the experiment's plan (named on both sides)

| Item | Built by | The other plan's part |
|---|---|---|
| The parity table, the rules, the tests, the check, the release | this plan | `dew_flow_benchmark · todo/PLAN_lang_comparison_v2.md` E0.S1–S2 name the audit and the rules as a prerequisite story; they point here by path once this plan exists |
| The task repository's pin at the parity release, on a snapshot branch | the other plan, E0.S3 | this plan reports the release sha (§ 9 E5) |
| The record of rule bytes actually read per session (its T14) | the other plan | this plan records the bytes per scope (§ 5) so the two numbers can be compared |
| The consumers' bump pull requests | this plan (E5) | none — a consumer change the experiment does not see |

Order: this plan first; its release is a precondition of the other plan's pre-registration (its D23). Disjoint: nothing
here touches the harness, the tasks or the task repository; nothing there edits a rule. The other plan was read on branch
`docs/plan-lang-comparison-v2` at `aa5e413`; adding this plan's path to its E0 is a repaired reference on that side
(its ledger has not opened — its status says so).

## 7. Growth surface

| Surface | Projected size | Who retires it | Interrupted |
|---|---|---|---|
| The rule catalog: 3 new files, ≈ 10 KB; Node sections ≈ 6 KB | 40 rules, ≈ 393 KB of 4 MiB (`LIMITS.catalog`) | the single-read and core tests bound the loaded part; a rule that stops being true is edited, never appended to | a half-landed rule set is a red `rule-bodies` suite — nothing partial reaches `release` |
| `research/2026-10-31_node_behaviour_probes.md` | one file, ≈ 12 KB, kept forever as the dated evidence | never pruned; superseded probes are re-run and the new date added | — |
| `tools/fixtures/node-strictness/` | ≈ 6 small fixture trees, < 50 KB | live as long as the check | — |

No process, table or cache is created.

## 8. Threats

| # | Threat | Control |
|---|---|---|
| T1 | **A Node rule written from knowledge rather than measurement.** The TS doctrine's traps are measured; a mirror of the C# runtime mechanics written by analogy will be wrong somewhere (the `Date` trap is the INVERSE of .NET's; `child.kill()` is not a tree kill) | § 4.3: every claim has a probe line or a cited document before the sentence lands; the record is a file in `research/`; the code round is told to check each Node sentence against the record |
| T2 | **A size budget breaks a test or, worse, an agent's read.** The real-agent migration once got INCOMPLETE and read nothing when a scope passed 32 KiB (`tools/rules.test.mjs:188-192`) | § 5's ceilings per file; the measurement is part of every rule story's acceptance; new scopes are pinned |
| T3 | **.NET-only consumers receive Node text they do not need** | path-selected rules never load for them; the Node sections of common rules do, as the Rust sections do today — ≈ 6 KB over split-read tasks, recorded in § 5's after column; a .NET consumer's single-read scopes do not change |
| T4 | **The family's TypeScript practice contradicts the version rule** (typescript-eslint refuses TS 7) | § 4.6 carries the measured caveat; Q2 |
| T5 | **A mirror written from VS Code extensions does not fit a server.** The family's TypeScript is extensions; the experiment's tasks are daemons and web APIs | the Node sections cover the server shapes the common rules already govern for .NET (stdio hosts to stderr, SIGTERM, backpressure, routes); one consumer's loopback HTTP broker (`http-contracts.md:170-173`) is the server precedent; the owed probes of § 4.3 include a stream under backpressure |
| T6 | **Two copies of the neutral dependency text drift** | it lives once, in `common/dependencies.md`; the ecosystem rules carry pointers |
| T7 | **The bare arm never reads a rule.** Parity matters only to the process arm; over-building here delays a release the experiment waits for | the scope is the table of § 3 and nothing wider; E1–E4 are one pull request each |
| T8 | **The release reaches eight consumers at once** and reddens every open pull request's `pin-check` | E5 announces, promotes once, bumps the pinned-by repository last ([README.md](../README.md) § *Bumping a pin*) |
| T9 | **A product name slips into a shared rule** (the TypeScript consumers' names, "the extension", "the vault") | `node tools/ownership-check.mjs` is armed; the doctrine's anonymisation is a story of its own |
| T10 | **The epic split was made without the question consultants** (`subagent-models.md` step 2) | § 9 marks the split provisional until `mcp__coai__ask_consultants` has been asked what matters most; Fable confirms or re-splits before E1 starts |

## 9. Build order

1. **E1** the shared dependency rule and the two ecosystem rules (the selector change that the experiment's package
   work meets first).
2. **E2** strictness and the two doctrines (the version statement, the compiler rule, the reverse counterparts).
3. **E3** the Node sections of the common rules, with the probe record.
4. **E4** the two tools and the documents.
5. **E5** gates, pull requests, the release, the bumps, the pin.

E1–E4 each end in one pull request through the coai plan and code gates; at most three are open at once
([pull-requests.md](../common/pull-requests.md) § 7). E5 has no diff of its own except the consumer bumps.

## 10. Test plan

- `npm test` green at every story: the manifest test (`tools/rules.test.mjs:151`, every body recorded), the selection
  tests of § 4.4, the single-read scope test with the new scopes, the always-core budget, the `http-coverage` three-line
  companion for a Node route, the new check's fixtures (a strict repository passes; a missing `strict`, a missing
  `noEmitOnError` with emit, a type-stripped test script without `tsc --noEmit`, a `package.json` without `save-exact`
  each fail naming the file; a repository with no TypeScript passes; a TypeScript repository without `tsc` installed is
  INCOMPLETE).
- `node tools/rule-bodies.mjs` in step; new ids added by hand with `bodySha256` and `sections`
  (`tools/rule-bodies.mjs:186`).
- `node tools/ownership-check.mjs` passes with no baseline file.
- `node tools/plan-lifecycle.mjs` clean.
- The eleven `explain` measurements of § 5, before and after, in `research/module_rules.md`.
- The new check run against the four TypeScript-bearing consumers' checkouts with `--warn`, its findings listed in E4's
  pull request (a finding is information, not a consumer change this plan makes).
- One bounded smoke the way `research/module_tests.md` records them: a real session on `inspect --file ui/a.ts`,
  `inspect --file tsconfig.json` and `dependencies --file package.json` reads the selected rules to their END markers.

## 11. Definition of Done

- [ ] Every row of § 3 is closed in the text of the rule it names, or recorded as deliberately absent in
      `research/module_rules.md` with the reason.
- [ ] Every Node sentence in a rule has a line in `research/2026-10-31_node_behaviour_probes.md` (a run with its output)
      or a cited document with its read date.
- [ ] `typescript/compiler-strictness.md`, `typescript/npm-packages.md`, `common/dependencies.md` exist with the metadata
      of § 4; `csharp/nuget-packages.md` has no `tasks`; the selectors of § 4.4 are in place and tested.
- [ ] `typescript/doctrine.md` ≤ 6,348 B, `csharp/doctrine.md` ≤ 5,088 B, `compiler-strictness.md` ≤ 3,300 B, the
      `utc-timestamps` Node section ≤ 1,200 B, the always core ≤ 16,384 B; every pinned single-read scope ≤ 32,768 B;
      the before/after table is in `research/module_rules.md`.
- [ ] Node 26 and TypeScript 7 are stated in the TypeScript rules the way `.NET 10` is in the C# one, with the measured
      toolchain caveat and its date.
- [ ] `tools/node-strictness-check.mjs` exists, is tested over fixtures, is in `README.md` § *tools* and `ROLLOUT.md`,
      and the reason Node has a check and no hook is in `research/module_rules.md`.
- [ ] `tools/http-coverage.mjs` finds a Node route, including one formatted across three lines;
      `http-contracts.md:166` says what it now reads.
- [ ] `rule-bodies.json`, `ownership-check`, `plan-lifecycle`, `npm test` green on the merged commit.
- [ ] Each of E1–E4 went through `mcp__coai__review_plan` → `mcp__coai__review_code` with every finding resolved, and its
      pull request records what the reviewers said that was not acted on.
- [ ] `release` promoted once to the merged sha through `promote-release` with a `reason`; the sha is in this plan.
- [ ] Bump pull requests in the eight consumers of `README.md` § *Consumers* — `dew_flow_rag_qln`, `dew_flow_mcp`,
      `dew_flow_sidecar_rust`, `dew_flow_benchmark`, `dew_flow_creds_for_devs`, `dew_flow_connect_other_ais`, `wsl_care`,
      `dew_flow_vscode_kit` — the pinned-by repository last, each with `pin-check` green after its commit.
- [ ] The experiment's task repository pins the release (reported by the other plan's E0.S3); the sha here and there
      agree.
- [ ] This plan promoted to `research/` with its deviations, in the same task as the last bump.

## 12. Open questions

Not settled here; the owner or the named epic decides. No answer is invented.

- **Q1 .NET lock files.** Raise .NET to `packages.lock.json` + `dotnet restore --locked-mode` (a change in six consumers),
  or record the asymmetry (npm's lock fixes transitives; central pins fix directs) as § 3.3 proposes?
- **Q2 The version statement.** "TypeScript 7 where every tool accepts it, otherwise the newest they all accept, recorded"
  (§ 4.6), or the plain "TypeScript 7" with the lint constraint carried only in the consumer that has it?
- **Q3 The single-read tasks.** `gpu` and `ui` with a language file leave 475 B and 439 B. Trim the doctrines to fit
  (§ 4.7), or move `gpu` and `ui` to the split-read side of `tools/rules.test.mjs:204-205`, which frees ≈ 5 KB per
  language and changes what a `ui` session reads in one call?
- **Q4 The check's reader.** `tsc --showConfig` from the consumer's own `node_modules` (the compiler resolves `extends`;
  INCOMPLETE when absent), or a JSONC parser of our own (a new dependency, and a second implementation of `extends`)?
- **Q5 `.js/.mjs/.cjs` select the TypeScript doctrine** — including this repository's own `tools/`. Confirm, or leave
  plain JavaScript with the always core only, as `ENTRY.md:57-58` allows?
- **Q6 Framework names in `http-contracts.md`.** Rows named "Fastify / Express" (the experiment's Node web stack is
  Fastify), or the shape only ("`app.<verb>(path)` grouped by the registered prefix")?
- **Q7 A C# complexity analyzer.** Keep complexity ≤ 4 as prose on the C# side while TS enforces it by lint, or name an
  analyzer package (a dependency decision for every .NET consumer)?
- **Q8 Who wires the Node check.** The four TypeScript-bearing consumers only, or every consumer, since it passes without
  opinion where there is no TypeScript?
- **Q9 One pull request per epic (E1–E4) or one for all four?** Four keep each diff reviewable; one lands the release
  sooner.
- **Q10 Coverage thresholds** stay absent on both sides (§ 3.3). Confirm.
- **Q11 The commit trailer.** This plan was written by a Fable model and its commit says so; the brief asked for an Opus
  trailer. Which is wanted on the implementation commits?

## Epics

Five epics on the build order of § 9. Stories are written one epic at a time into `todo/PLAN_node_rule_parity_E<n>.md`
when the epic starts ([planning-docs.md](../common/planning-docs.md) § *A plan split into epics and stories*); that
document links back here. The intended stories are listed per epic so the size is visible. **The split is provisional**
(T10): the question consultants have not yet been asked what is important; Fable confirms or re-splits before E1 starts.
Cornerstone areas: (1) the compiler-strictness rule and its check — the strongest C# requirement's counterpart, and the
text the experiment's Node agent reads first (E2, E4); (2) the Node paragraphs of `reliability.md` — the mechanics the
experiment's daemon tasks test (E3). Q = ⌈2·5/5⌉ = 2.

Cornerstones: 0 of 2 — none marked yet; the stories documents mark them within the areas above

### E1 — The shared dependency rule and the two ecosystem rules

- **Goal:** a TypeScript agent adding a package reads npm text; a C# agent reads NuGet text; both read the neutral rule.
- **Scope:** `common/dependencies.md` (new), `csharp/nuget-packages.md` (trimmed, paths only), `typescript/npm-packages.md`
  (new); selection tests; the manifest; `research/module_rules.md`.
- **Stories:** S1 the shared rule text (moved paragraphs verbatim, the scan and the lock sentence added) · S2 the NuGet
  trim and the pointer · S3 the npm rule with its probe lines (`save-exact`, `npm ci`) · S4 selection tests and the
  manifest entries · S5 the size measurement before/after.
- **Depends on:** nothing. **Done when:** `dependencies --file package.json` selects `common.dependencies` and
  `typescript.npm-packages` and not `csharp.nuget-packages`; `inspect --file src/x.csproj` ≤ 32,768 B with more headroom
  than today; `npm test`, `rule-bodies`, `ownership-check` green; one pull request through both gates.

### E2 — Compiler strictness and the two doctrines

- **Goal:** P1–P7, R1–R3, P20's `.js` selector.
- **Scope:** `typescript/compiler-strictness.md` (new), `typescript/doctrine.md` (§ 0, the anonymisation, the trim, the
  selector), `csharp/doctrine.md` (§ 1, § 8, the DoD, the § 4a trim), `common/coding-style.md:32`.
- **Stories:** S1 the compiler rule (**cornerstone area 1**: its contract is what the Node agent's `tsconfig` is judged
  by) · S2 the TypeScript doctrine's § 0 and anonymisation, measured ≤ 6,348 B · S3 the C# doctrine's § 8 and DoD,
  measured ≤ 5,088 B · S4 the selectors and the pinned scopes · S5 the version caveat with its registry read.
- **Depends on:** E1 (the manifest and tests move together). **Done when:** every pinned scope ≤ 32,768 B; the ownership
  check finds no name in either doctrine; one pull request through both gates.

### E3 — Node sections in the common rules, and the probe record

- **Goal:** P10–P19, each sentence with its evidence.
- **Scope:** `common/testing.md`, `logging-serilog.md`, `reliability.md`, `utc-timestamps.md`, `platform-limits.md`,
  `security.md`, `http-contracts.md` (rows), `post-deploy-checks.md`; `research/2026-10-31_node_behaviour_probes.md`.
- **Stories:** S1 the probe record with the table of § 4.3 and the owed probes run · S2 `reliability.md`'s Node
  paragraphs (**cornerstone area 2**) · S3 `testing.md`'s runner section and DoD box · S4 `logging-serilog.md` `## Node`
  with a pino shape measured against the path contract · S5 `utc-timestamps.md` `## Node` ≤ 1,200 B · S6 the three
  one-clause edits (`security.md` P14–P15 within the core budget, `platform-limits.md`, `post-deploy-checks.md`) ·
  S7 the `http-contracts.md` rows.
- **Depends on:** E2 (the doctrine's § 0 points at these sections). **Done when:** the always core ≤ 16,384 B; `storage`
  ≤ 32,768 B; every Node sentence traces to a probe line; one pull request through both gates.

### E4 — The two tools and the documents

- **Goal:** enforcement parity (§ 4.5) and the scanner's Node routes (P18); the repository's documents say what changed.
- **Scope:** `tools/node-strictness-check.mjs` + tests + fixtures; `tools/http-coverage.mjs` + the three-line test;
  `README.md` § *tools*, `ROLLOUT.md`, `research/module_rules.md`, `research/module_tests.md`, `research/architecture.md`;
  `http-contracts.md:166`.
- **Stories:** S1 the check's contract and fixtures (**cornerstone area 1**) · S2 the check run over the four
  TypeScript-bearing consumers with `--warn`, findings listed · S3 the scanner's Node patterns and test ·
  S4 the documents, including why Node has a check and no hook, and the deliberately-absent decisions of § 3.3.
- **Depends on:** E2 (the rule the check enforces). **Done when:** the check fails each bad fixture naming the file,
  passes a repository with no TypeScript, reports INCOMPLETE without `tsc`; the scanner finds a three-line Node route; one
  pull request through both gates.

### E5 — Gates, release, bumps, the pin

- **Goal:** the rules reach the consumers and the experiment.
- **Scope:** `promote-release` with a `reason`; bump pull requests in the eight consumers (pinned-by last); the report of
  the release sha to the other plan; this plan's promotion.
- **Stories:** S1 the promotion (`README.md:100-122`) and the `release-distance` read · S2 the bumps, each with `pin-check`
  green after its commit, the TypeScript-bearing ones adding the check step with `--warn` · S3 the sha handed to the
  experiment's E0.S3 and confirmed equal · S4 this plan promoted with deviations.
- **Depends on:** E1–E4 merged. **Done when:** every box of § 11 is ticked.

### Order, and why

E1 first because the experiment's agents meet package work before anything else and because its selector change is
the one that removes text rather than adding it. E2 before E3 because the doctrine's § 0 is the index the Node sections
are reached from. E4 after E2 because a check enforces a rule that exists. E5 last, once.
