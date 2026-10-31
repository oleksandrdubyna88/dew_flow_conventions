# PLAN — C#/Node rule parity: every C# requirement has a Node/TypeScript counterpart of equal strength, and the reverse

> Status: **plan only, nothing implemented yet, 2026-10-31 (revised the same day after the question consultants,
> consult `ce61c905`, and the operator's "we only add" rule — § 0).** Scope: the shared rule corpus (`common/`,
> `csharp/`, `rust/`, `typescript/`), its selection metadata and one new metadata key in the resolver
> (`tools/lib/rule-catalog.mjs`), `research/rule-bodies.json`, a machine-readable parity matrix and its test, the
> selection and size tests in `tools/rules.test.mjs`, two tools (`tools/http-coverage.mjs`'s `--routes` path for Node; a
> new `tools/node-strictness-check.mjs`), the documents that describe them, one `release` promotion and the bump pull
> requests of the consumers. It changes no consumer's code. The `## Plan changes` ledger opened at the plan round of
> 2026-10-31, whose verdict was `proceed` ([plan-change-control.md](../common/plan-change-control.md); the round is
> recorded in § 13); the owner's approval is still to come, and a change the owner asks for is entry 1.1.
>
> Related docs: [csharp/doctrine.md](../csharp/doctrine.md), [typescript/doctrine.md](../typescript/doctrine.md),
> [rust/doctrine.md](../rust/doctrine.md), [csharp/nuget-packages.md](../csharp/nuget-packages.md),
> [common/testing.md](../common/testing.md), [common/reliability.md](../common/reliability.md),
> [common/logging-serilog.md](../common/logging-serilog.md), [common/utc-timestamps.md](../common/utc-timestamps.md),
> [common/security.md](../common/security.md), [common/http-contracts.md](../common/http-contracts.md),
> [research/module_rules.md](../research/module_rules.md), [README.md](../README.md) § *Consumers*, § *How `release` moves*,
> [tools/lib/proc.mjs](../tools/lib/proc.mjs) (the lifecycle precedent).
> The other side of the boundary is a plan in another repository, cited as a path (§ 6):
> `dew_flow_benchmark · todo/PLAN_lang_comparison_v2.md` (branch `docs/plan-lang-comparison-v2`, read at `aa5e413`).

## Plan changes

> Epoch 1 · approved 2026-10-31 · by reviewers · state: open

  (The six findings of that round were accepted inside the round, before the verdict, and are part of the approved
  baseline — § 13. They are not entries. The owner has not yet approved; an owner's request is counted like any other.)

## 0. Decisions

Rows marked "operator" are the operator's, recorded as given; "consultants" are the question consultants' answers
(consult `ce61c905`: one reviewer read the repositories, one answered without file access; both agreed), each verified
against the tree before adoption; "this plan" are proposals for the owner's approval. A decision this revision replaced
stays in the document, marked **superseded** with a pointer to its replacement (D1).

| # | Decision | Who, when |
|---|---|---|
| D1 | **"Everything collected before must stay; we only add."** No existing rule text is removed or shortened. A move keeps the text word for word, the common rule keeps the neutral invariant plus a one-line pointer, and the moved bytes are shown equal to the source bytes. Evidence, dates and caveats travel with the text. The size budget is solved by placement only: language-scoped selection, moving tight tasks from single-read to split-read where the rules allow, new rules selected narrowly. A scope that cannot fit without a deletion is an open question with its numbers, never a deletion. Research records, measurements and earlier decisions are never removed; a changed decision is marked superseded with a pointer | operator, 2026-10-31 |
| D2 | **Common rules state only the language-neutral invariant; the language mechanics live in language-scoped rules**, so a single-language task never loads the other language's mechanics. The C# mechanics now in common rules move (verbatim, D1) to `csharp/`-scoped rules; the Node mechanics are written into `typescript/`-scoped rules; the Rust sections follow the same principle (§ 4.3) | consultants, 2026-10-31; verified § 4.3 |
| D3 | **Task-gated path selection** — a new metadata key so a path-selected mechanics rule loads only in a scope that also names one of the tasks its source rule listed (§ 4.2). Without it every language-scoped mechanics rule would land in every `inspect`/`ui`/`gpu`/`storage` scope with a language file (measured § 5: `inspect --file src/x.cs` 28,820 B + ≈ 8 KB of mechanics) | this plan |
| D4 | **The two doctrines are both DESIGN doctrines, selected on every language file.** `typescript/doctrine.md` gains the design counterparts of `csharp/doctrine.md` § 1–§ 7 by meaning; its four traps move verbatim (D1) to the gated rules that own their topics (§ 4.4) | consultants (the doctrine is its own deliverable), 2026-10-31; the placement: this plan |
| D5 | **The `ui` task with a language file leaves the single-read list** (`tools/rules.test.mjs:252`), because the webview trap is a `ui` trap by definition and the scope cannot hold it in one read without a deletion (§ 5). `ui` with no file stays single-read. `gpu --file src/x.cs` stays single-read on the estimate (105 B of headroom after the additions) and leaves the list only if the measurement says so — Q3 | this plan |
| D6 | **Placement exceptions, stated:** a one-line table row or a one-phrase list item that names a language stays in its common rule (`http-contracts.md:31-35`, `local-cpu-budget.md:31,:36`, `security.md:18,:26`'s parenthetical, `platform-limits.md:43`'s `GetByteCount`) and gains the other language's row or phrase beside it; moving one table row into a file of its own costs more than it saves. Prose paragraphs, subsections and code blocks move | this plan |
| D7 | **The TypeScript toolchain is stated as one tested combination** — compiler + parser + lint — never "the newest TypeScript": measured 2026-10-31, `typescript-eslint@8.72.1` peers `typescript >=4.8.4 <6.1.0`, so lint is impossible on `typescript@7.0.2`. The rule states the newest TypeScript the pinned typescript-eslint supports (today 6.0.x), recorded in the repository; the choice TS 6.0.x with full lint versus TS 7 without type-aware lint is the operator's — Q2 | consultants, 2026-10-31; verified by `npm view` |
| D8 | **Enforcement for TypeScript is a composite gate** — `tsc --noEmit` (or `noEmitOnError`) + lint `--max-warnings 0` + tests — the counterpart of `dotnet build` with warnings as errors; the check reads the EFFECTIVE configuration (`tsc --showConfig`), and is proven on deliberately invalid fixtures. A grep for `"strict": true` or a successful `node app.ts` proves nothing (measured: a type error ran with exit 0). Node has a check and no hook (§ 4.6) | consultants, 2026-10-31; verified § 4.3 of the probe table |
| D9 | **Runtime lifecycle's invariant is "ownership through completion"**: who cancels, who observes the rejection, who terminates descendants, who drains streams and bounds the shutdown. The rule decides by `signal.aborted` and by WHO aborted, never by the reason's name; `unhandledRejection` gets an explicit shutdown policy, not "log and continue". Precedent: `tools/lib/proc.mjs` | consultants, 2026-10-31; verified by the probes of § 4.3 |
| D10 | **HTTP coverage for Node goes through `--routes`** (the application's own route table, `tools/http-coverage.mjs:11, :27`), not through source regexes for Node frameworks | consultants, 2026-10-31; verified against the tool's usage |
| D11 | **Output encoding is decided by the output context.** The webview escape module one consumer already has (anonymised) is the counterpart of Razor's `MarkupString`/`Html.Raw`; both live in gated `output-encoding` rules per language, the invariant stays in `security.md` | consultants, 2026-10-31 |
| D12 | **The parity table is a file with a test**: `research/parity-matrix.json`, every row naming a rule id and section on both sides, asserted against the catalog and `rule-bodies.json`'s recorded sections. The body manifest hashes bodies after front matter, so a green body freeze does not prove selection is unchanged — selection tests pin which rules each representative scope selects (§ 4.1) | consultants, 2026-10-31; verified: `tools/lib/rule-body.mjs:24` strips the front matter |
| D13 | **The release epic starts with a consumer dry run**, and the record per benchmark arm carries the conventions sha, the selected rule ids and hashes per stack, the toolchain versions and the effective checks — equal source ownership does not prove equal instructions reached the agents | consultants, 2026-10-31 |
| D14 | **The dependency epic runs in parallel once E1 fixes placement**; the NuGet rule keeps central versions and the coupled-version exceptions; npm distinguishes the declared range, the lock's resolution and the reproducible install | consultants, 2026-10-31 |
| D15 | **The commit trailer names the model that wrote the commit** (Fable 5.1); the former Q11 is closed | coordinator, 2026-10-31 |

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
| `common/logging-serilog.md` | Serilog, the contract, `:61-90` the Serilog colour measurement, `:153` the C# shape, `:172-186` a **Rust** section, `:190` "never `Console.WriteLine`" | No Node section; a TypeScript agent is told about `ILogger<T>` and nothing about `console.log` or pino |
| `common/reliability.md:47-69, :95-132` | `BackgroundService`, `TaskScheduler.UnobservedTaskException` (`:59`), `CancellationToken` end-to-end (`:97`), `PosixSignalRegistration` (`:100`), `OperationCanceledException` vs `TaskCanceledException` (`:104-132`); the DoD at `:234-250` names the token's state as the decider | No `AbortSignal`, `unhandledRejection`, `SIGTERM`, timer-keeps-the-loop-alive, promise-without-catch — the exact mechanics the experiment's daemon tasks test |
| `common/security.md:18, :26` (always loaded) | `dotnet user-secrets`; `Process.Kill(entireProcessTree: true)` | No Node form of either, and Node has no tree-kill primitive (measured § 4.3) |
| `common/utc-timestamps.md` | `DateTimeOffset`, `TimeProvider.GetUtcNow()` (`:35`), a C# code block in rule 3, `:65` a **Rust** section | No `Date`/`Temporal` section; JavaScript's calendar-day trap is the **inverse** of .NET's (measured § 4.3) |
| `common/platform-limits.md:43` | `Encoding.UTF8.GetByteCount` | no `Buffer.byteLength` |
| `common/http-contracts.md:31-35` and `tools/http-coverage.mjs:45-49` | ASP.NET and axum rows; the scanner reads `Map*` and `.route(` (`http-contracts.md:166`); `--routes` takes the application's own table (`:11, :27`) | No Node framework row; the scanner is blind to every Node route although `.ts/.js/.mjs` are in its extension set (`http-coverage.mjs:41`), and nothing says a Node application should feed `--routes` |
| `common/post-deploy-checks.md:49`, `common/coding-style.md:32` | "a package (NuGet, ghcr, crates.io)"; "the C#-specific shape is in csharp/doctrine" | no npm; no pointer to the TypeScript shape |
| Balanced already | `common/local-cpu-budget.md:31, :36` (`node --test` and xUnit rows), `common/test-leftovers.md` (bash, Node and C# named together), `common/development-workflow.md:46, :56` (a `tsc` trap and a `dotnet` trap) | — |

**Absent on BOTH sides**: an analyzer/lint requirement, a lock file and a locked restore (only Rust has `--locked`,
`rust/doctrine.md`), a vulnerability scan, coverage thresholds, CI steps per language. **C# also lacks** `Nullable`
`enable`, which every .NET consumer's `Directory.Build.props` sets (read in three consumers, 2026-10-31) and no rule
requires.

**Reverse gaps** (a TypeScript rule with no C# counterpart): HTML/JSON-in-script encoding (`typescript/doctrine.md:15`;
the Razor shape is `MarkupString`/`Html.Raw`), test-fixture casts (`:66`; the C# shape is `null!`/`default!`), and a
Definition of Done.

**Suppression is not equal today either** (consultants, verified 2026-10-31): the two TypeScript consumers both run
eslint at complexity 4, but one carries 270 `eslint-disable` lines and ignores a typed-fixtures folder, the other 16 and
ignores `scripts/**` and `src/generated/**`; neither has a baseline file. The three .NET consumers' `Directory.Build.props`
carry no `NoWarn` and no `WarningsNotAsErrors`, and no `#pragma warning disable` was found in two server trees. "Both run
a linter" is therefore not equal enforcement; the parity matrix carries an *exemptions and suppression* column (§ 3.4).

The house precedent for a language mirror is `rust/doctrine.md:8` ("The Rust mirror of csharp/doctrine.md. Written down
from what the family's Rust crate already practices") and the `## Rust` sections of `logging-serilog.md:172` and
`utc-timestamps.md:65`.

## 2. Goal

1. A **parity matrix** (§ 3, and the file `research/parity-matrix.json` with its test — D12) in which every C#-specific
   requirement, and every C#-only section of a common rule, has a Node/TypeScript counterpart of equal strength, and
   every TypeScript requirement has a C# counterpart; a gap on both sides is either raised on both or recorded as
   deliberately absent, with the reason.
2. The rules that close the matrix, released through `promote-release` **before** the experiment's pre-registration, and
   pinned by the experiment's task repository (the other plan's E0.S3).
3. Every Node claim in a rule rests on a **run** recorded in this repository or a **cited document** — never on memory
   (§ 4.3, § 11).
4. Every size budget the resolver's tests pin stays green **without deleting a word** (D1), with the numbers measured
   before and after (§ 5).
5. A single-language scope never loads the other language's mechanics (D2), measured per representative scope (§ 4.1).

**Equal strength, defined.** Two requirements are of equal strength when (a) they are selected for the same kind of
scope (a language file, a manifest, a task) — a rule one agent gets on every source file and the other gets only on a
task is not equal; (b) they have the same mood — MANDATORY against MANDATORY, a Definition of Done box against a box;
(c) they have the same enforcement class — a file a check verifies, a command a hook refuses, or prose alone; (d) the
consequence is the same — a warning that fails the build on one side fails it on the other; and (e) **the exemption
policy is the same** — what may be suppressed, where (inline only, naming the rule and the reason), and that no baseline
of accepted violations exists. The matrix carries (c) and (e) as columns.

## 3. The parity table

Direction `C# → Node` first, then `TS → C#`, then the gaps on both sides, then suppression. *Where* names the file that
will carry each side after this plan under D2; *strength* is the class of § 2. The same rows, with rule ids and section
headings, are the content of `research/parity-matrix.json` (E1).

### 3.1 C# requirements → Node/TypeScript counterparts

| # | C# requirement (where today → where after) | Node/TypeScript counterpart (where after) | Strength |
|---|---|---|---|
| P1 | ".NET 10, latest C#" (`csharp/doctrine.md:10`, stays) | the toolchain line of D7 in `typescript/doctrine.md` § 0 and `typescript/compiler-strictness.md` | prose, on every language file — equal |
| P2 | `TreatWarningsAsErrors` (`:10`, stays) | `"strict": true`, `"noEmitOnError": true` wherever `tsc` emits, lint at `--max-warnings 0`, `tsc --noEmit` before a type-stripped run — `typescript/compiler-strictness.md`, selected by `**/tsconfig*.json`; the one-line statement also in the doctrine's § 0 | file + CI check (`tools/node-strictness-check.mjs`, § 4.6) — **stronger than C#**, which has prose only; C# gains nothing here because MSBuild already fails the build on a warning once the property is set, which is the check |
| P3 | `Nullable enable` — absent from the rule, present in every consumer | `strictNullChecks` (inside `strict`) — the same rule | raised on **both**: `csharp/doctrine.md` § 1 gains `Nullable enable` (≈ 20 B, no removal) |
| P4 | complexity ≤ 4, `private static` where no state is read (`:75-78`, stays) | the same number as a lint rule (`complexity: ["error", 4]`, `max-lines-per-function` 50, `max-lines` 800, `no-console`) — the shape two TypeScript consumers already run (read 2026-10-31) — in `compiler-strictness.md`; the suppression policy of § 3.4 | prose ↔ lint-enforced: TS stronger; C# stays prose (an analyzer rule for complexity needs a package the family has not adopted — Q7) |
| P5 | records for data, typed values, no primitive obsession, no null in business logic (§ 2–4, stay) | `typescript/doctrine.md` § 0 (E4, by meaning): `readonly` data contracts and `Readonly<T>`/`ReadonlyArray<T>` in public shapes; validated or branded domain types (`type CommitSha = string & { readonly __brand: … }` with a parsing factory returning a result, never a throwing constructor); `undefined`/`null` only at the edges, absence as a typed state ("not captured" and "empty" are different facts) | prose ↔ prose; cites, anonymised, one consumer's readonly outcome type that separates refusal, timeout and mechanism failure |
| P6 | § 4a a DTO field the client omitted is `null` (stays); **gains** the large-identifier mirror: `System.Text.Json` reads a `long` exactly and a `double` target or `JsonElement.GetDouble()` loses precision (measured: `{"id":9007199254740993}` → `long` 9007199254740993, `double` 9007199254740992, `GetInt64` exact, `GetDouble` …992, `GetRawText` exact, `decimal` exact; `2^63` into `long` throws `JsonException`); and the casing trap the same probe met: the default binder is case-sensitive, so `Id` against `"id"` bound to **0 with no error** — § 4a's silent default, in another door | § 0: a `JSON.parse` result is `any` and a declared type is a promise the parser never checked; validate at the single road in (a schema or a typed parser). **Identifiers that can exceed 2^53 travel as JSON strings, or are parsed losslessly before any conversion to `Number`**: `JSON.parse` rounds `{"id":9007199254740993}` to `9007199254740992` (measured); the lossless option exists on Node 26 — the reviver's third argument carries the source text (`JSON.parse(text, (k, v, context) => … BigInt(context.source))` → `9007199254740993n`, measured), and `JSON.rawJSON` writes such a value back unquoted (measured) while `JSON.stringify` of a bare `BigInt` throws `TypeError` (measured) | prose ↔ prose; both sides name the exact and the lossy readers |
| P7 | `Outcome<T>`, never `throw` for control flow (§ 5, stays) | § 0: a discriminated union result (`Result<T, E>`), `throw` only for the unexpected, one outcome shape per repository; `coding-style.md:32` points at BOTH doctrines | prose ↔ prose |
| P8 | `dotnet-build.md`: the worker pool, hook + check | **No Node counterpart.** The rule exists for a measured resource problem (72 MSBuild workers, 10 775 MB) that Node builds do not have; a hook is added for a measurement, not for symmetry (§ 4.6). Node's enforced rule is P2's check instead | deliberately absent; stated in `research/module_rules.md` |
| P9 | `nuget-packages.md`: central pins; publisher/freshness; licence before version; monthly bump; zero-reference projects | `typescript/npm-packages.md` (§ 4.5, D14): the declared range (`save-exact=true` in `.npmrc`; measured: a bare `--save-dev` writes `^5.9.3`), the lock's resolution (`package-lock.json` committed), the reproducible install (`npm ci --ignore-scripts` as the only install in CI; measured: it refuses a lock that does not SATISFY `package.json`, and accepts one that does), `npm outdated` and `npm audit` on the monthly bump, `engines.node`, `node:` built-ins before a package; the neutral text moves verbatim to `common/dependencies.md` | prose ↔ prose, each selected by its own manifest; the shared part on `--task dependencies` only |
| P10 | `testing.md:12-34` the runner section (1,267 B) → `csharp/testing.md` verbatim; `:368` DoD box | `typescript/testing.md`: `node --test` (built in) or vitest, run by a script that computes the concurrency cap (`local-cpu-budget.md:31`); the flags table (`--test-name-pattern`, `--test-only`, `--test-timeout`, `--test-concurrency`, `--test-skip-pattern` — present, measured); the compile-then-run contract and the exit code that must be read (the doctrine's § 4, moved here verbatim); `common/testing.md` keeps the invariant "run the repository's documented runner and read its exit; a result over a failed build is no result" and the pointer; the DoD box becomes neutral with the language box in each language rule | prose ↔ prose; gated on testing's tasks |
| P11 | `testing.md:354-358` architecture tests read assembly references (252 B) → `csharp/testing.md` verbatim | `typescript/testing.md`: a Node repository asserts its layer rules over the import graph (one scan of `import`/`require` statements kept as a test); the common rule keeps "architecture is a test, not a review comment" | prose ↔ prose |
| P12 | `logging-serilog.md:61-90` the Serilog colour measurement (1,640 B), `:153-171` the C# shape (497 B) → `csharp/logging.md` verbatim (paths `**/Program.cs` kept); `:190` "never `Console.WriteLine`" (a one-line Never — stays, D6) | `typescript/logging.md`: pino or a one-file equivalent; the same path shape, UTC, level from configuration, 14-day prune at startup, coloured console with a plain file; a stdio-protocol host logs to **stderr** (`:91`, the MCP-server case); "never `console.log` for a log" beside the C# line in the common Never list | prose ↔ prose; gated on logging's tasks |
| P13 | `reliability.md:104-133` the OCE/TCE subsection (1,698 B) and every sentence of `:47-70` and `:95-103` that names a .NET type → `csharp/lifecycle.md` verbatim; the DoD boxes at `:243-245` stay neutral ("the token's state decides" is the invariant) | `typescript/lifecycle.md` (D9): ownership through completion — every detached promise has an owner who observes it; `unhandledRejection` handler = log, set `exitCode`, begin the bounded shutdown (the default is a crash, measured; "log and continue" is forbidden); `AbortSignal` end-to-end, `AbortSignal.any` to combine; decide by `signal.aborted` and by who aborted — a reason may be any value (`abort(new RangeError())` → `RangeError`, `abort("text")` → a string with no `name`, measured), so no classifier on `reason.name`; a pre-aborted signal rejects at once (measured); `SIGTERM` handler on every host, CLIs included (default exit 143 with no cleanup, measured); a bounded shutdown timer `.unref()`'d; an ignored `SIGTERM` defeats the supervisor too (measured: `timeout 2` waited past two minutes); descendants holding pipes keep `close` from firing (measured: `exit` at 4 ms, `close` at 1,508 ms); kill the group, not the child (measured) | prose ↔ prose; gated on reliability's tasks; the Node paragraph is checked against the .NET checklist at `:243-245` and contradicts none of it |
| P14 | `security.md:18` `dotnet user-secrets` (stays, D6) | "…`dotnet user-secrets`, an uncommitted `.env` read with `node --env-file` (measured), or a secret manager" — the same list | always core — equal |
| P15 | `security.md:26` `Process.Kill(entireProcessTree: true)` (the parenthetical stays, D6) | the core sentence gains "Node has no tree kill: the process group — `typescript/lifecycle.md`"; the mechanics (spawn `detached: true`, `process.kill(-child.pid)`, Windows `taskkill /T`; `child.kill()` left 2 of 2 grandchildren, the group kill 0 — measured; `tools/lib/proc.mjs:18-31` is the shipped shape) live in `typescript/lifecycle.md`; the .NET parenthetical's mechanics (`Process.Kill`, `WaitForExitAsync`) are already in `reliability.md:38-46` and move with P13 | always core — equal, and the asymmetry stated |
| P16 | `utc-timestamps.md:25-48` the .NET sentences and the C# code block (≈ 900 B of the 1,643 B rule) → `csharp/utc-timestamps.md` verbatim; `:65-69` Rust (219 B) → `rust/utc-timestamps.md` verbatim | `typescript/utc-timestamps.md`: `Date` parses a date-only string as **UTC** and a date-time string without an offset as **local** (measured in two zones) — the inverse of the .NET trap, so the rule is "stamp the day; never give a day a time of day"; the clock is an injected function, never `Date.now()` in code that writes a row; `Temporal` is present on Node 26 (`typeof Temporal === "object"`, measured) and `Temporal.PlainDate` is the typed calendar day | prose ↔ prose; gated on utc's tasks (`storage` is single-read: § 5) |
| P17 | `platform-limits.md:43` `Encoding.UTF8.GetByteCount` (stays, D6) | "…(`Buffer.byteLength(path, "utf8")` in Node — measured: a 7-character string with one two-byte character is 8 bytes)" in the same sentence | one clause |
| P18 | `http-contracts.md:31-35` ASP.NET and axum rows (stay, D6); `http-coverage.mjs:45-49` | two rows: a Fastify/Express style `app.<verb>(path)` grouped by the plugin or router registered under a prefix; a Node application **prints its route table** (Fastify `printRoutes()`/`routes`, Express's router stack) into the JSON shape `--routes` already takes (`http-coverage.mjs:11, :27`) — D10; `:166` is extended to say so. **Superseded:** the first revision's `NODE_ROUTE` source regex (kept at § 4.8 for the record) | rows ↔ rows; the scanner's preferred path ↔ the same path |
| P19 | `post-deploy-checks.md:49` "(NuGet, ghcr, crates.io)" | "(NuGet, npm, ghcr, crates.io)" | one word |
| P20 | selection: `**/*.cs`, `**/*.razor`, `**/*.csproj` select the C# doctrine; `.csproj`, `Directory.*.props`, `NuGet.Config` select the package rule; nothing is task-gated | `**/*.ts,tsx,mts,cts` **and** `**/*.js,mjs,cjs` select the TypeScript doctrine; `**/tsconfig*.json` selects `compiler-strictness`; `**/package.json` selects `npm-packages`; the mechanics rules of both languages are path-selected and task-gated alike (§ 4.2) | selector ↔ selector |

### 3.2 TypeScript requirements → C# counterparts

| # | TypeScript requirement (where today → where after) | C# counterpart (where after) | Strength |
|---|---|---|---|
| R1 | § 1 `JSON.stringify` into `<script>` is a break-out; one shared escaper; a scan test (`typescript/doctrine.md:15-48`, 2,042 B) → `typescript/output-encoding.md` verbatim (anonymised wording, § 4.4) | `csharp/output-encoding.md`: `MarkupString` and `Html.Raw` are the same door — a value they wrap reaches the page unescaped; JSON for a `<script>` goes through ONE helper that also closes `</script>` and `<!--`; the general rule stays `security.md` § *A measure applied at SOME of its sites* | MANDATORY ↔ MANDATORY; gated on implement, test, audit, ui, http |
| R2 | § 3 an `as` cast in a fixture (`:66-79`, 932 B) → `typescript/testing.md` verbatim | `csharp/testing.md`: `null!` and `default!` in a fixture are the same promise — a typed factory with real defaults instead; adding a required member is the moment to grep for them | prose ↔ prose; typed-fixture discipline side by side |
| R3 | a Definition of Done (`:98-105`; each box moves with its section, the § 2 box stays) | a Definition of Done in `csharp/doctrine.md` (typed values, no `throw` for control flow, complexity, immutable contracts, `Nullable enable` and `TreatWarningsAsErrors` set) — and in every new rule of both sides | box ↔ box |
| R4 | § 4 `tsc` emits despite errors (`:80-97`, 1,151 B) → `typescript/testing.md` verbatim, with `compiler-strictness.md` carrying the flag | no C# counterpart needed: the C# compiler emits nothing on an error. Stated once in the TypeScript rule as a difference, not a gap | deliberately absent |
| R5 | § 2 backticks in template literals (`:49-65`, 755 B, stays in the doctrine) | C# raw string literals have no comparable trap (`"""` cannot be ended by a shorter run) — stated in § 2's placement note | deliberately absent |

### 3.3 Gaps on both sides — raised or recorded

| Gap | Decision | Why |
|---|---|---|
| Analyzer / lint requirement | **Raise both, asymmetrically named**: TS lint at zero warnings (P2, P4); C# `TreatWarningsAsErrors` + `Nullable enable` in `csharp/doctrine.md` § 1 | The compiler is the C# analyzer the family already pays for; an extra analyzer package is a dependency decision for the consumers, not a shared rule (Q7) |
| Lock file + locked restore | **Raise TS (lock + `npm ci`), record .NET**: central exact pins of direct packages exist today; `packages.lock.json` with `--locked-mode` is not required | Imposing lock files on six .NET consumers is a consumer change this plan does not own; the asymmetry (npm's lock also fixes transitives) is stated in `common/dependencies.md` and is Q1 for the owner |
| Vulnerability scan | **Raise both** in `common/dependencies.md`: the monthly bump runs the ecosystem's scanner (`npm audit`; `dotnet list package --vulnerable --include-transitive`; `cargo audit` where installed) and records the result beside the pins | Cheap, equal, and both commands exist today (npm measured) |
| Coverage thresholds | **Deliberately absent on both** | `testing.md` governs what a test may claim; a number is gamed the week it lands. Stated in `research/module_rules.md`, because it is a decision about the corpus, not a rule |
| CI steps per language | **Deliberately absent as shared rules** | `testing.md:16-18`: each repository's own instructions and CI name the exact commands. Shared text would be an inventory |
| A runtime version statement | **Raise TS** (P1, D7) | C# has one; TS gets one of the same shape, as one tested combination |

### 3.4 Exemptions and suppression — the column both sides need

| | C# | TypeScript | Equal? |
|---|---|---|---|
| Where a suppression may live | inline `#pragma warning disable <id>` with the reason on the same line; never `<NoWarn>`/`<WarningsNotAsErrors>` in a props file, never `GlobalSuppressions.cs` | inline `// eslint-disable-next-line <rule> -- <reason>`; never a file-wide disable, never `ignores` of production folders; `reportUnusedDisableDirectives: "error"` so a stale suppression fails | equal once written: today C# has no rule and TS has two divergent configs |
| A baseline of accepted violations | none (none found in three consumers) | none (none found; one consumer ignores a typed-fixtures folder that is MEANT not to compile — a legitimate exclusion the rule names as such) | equal |
| Who may widen it | a rule change here, never a repository | the same | equal |
| Where it is checked | the build (`TreatWarningsAsErrors`) | `tools/node-strictness-check.mjs` reads the effective lint and compiler configuration | equal class (file + build/check) |

## 4. Design

### 4.1 E1 first: the delivery contract — where every text lives, before any text is written

A selection/budget matrix over representative scopes, measured before the first rule edit and re-measured after every
epic, kept in `research/module_rules.md`:

| Scope | Files | Why it is representative |
|---|---|---|
| C# | `src/x.cs`; `src/x.csproj`; `Directory.Build.props` | the doctrine; the package rule |
| TypeScript | `ui/a.ts` | the doctrine |
| JavaScript | `src/a.mjs` | selects no language rule today |
| Mixed | `src/x.cs` + `ui/a.ts` | the two mixed consumers; measured today `inspect` 34,729 B — already a split read |
| Config-only | `package.json`; `tsconfig.json`; `.npmrc` | the manifests the new rules select on |
| Browser/webview | `src/webview/page.ts` | **the resolver cannot tell a webview file from a Node file by path** — the matrix records that the output-encoding rule reaches it through the `ui` gate, not through a selector |
| Rust | `src/main.rs` | the third language, same principle |

× every single-read task (`inspect`, `ui`, `gpu`, `storage`) and the split-read `implement`, `test`, `audit`, `logging`,
`dependencies`. The exit criterion of E1: the headroom of every tight scope is recorded, and every later epic has a byte
allowance it may not exceed (§ 5).

**Selection tests pin which rules each scope selects** (D12): the body manifest (`tools/rules.test.mjs:151`) hashes
bodies after the front matter (`tools/lib/rule-body.mjs:24`), so a changed `paths:` or `tasks:` line passes the freeze.
E1 adds one test per representative scope asserting the exact id list, in the style of `:176-200`.

**The parity matrix as a file**: `research/parity-matrix.json` — one row per P/R entry: `topic`, `csharp: { id, section }`,
`typescript: { id, section }`, `strength`, `suppression`, `status` (`equal`, `stronger-ts`, `stronger-cs`,
`deliberately-absent`). A test asserts every `id` exists in the catalog and every `section` is in that rule's recorded
`sections` in `research/rule-bodies.json`; a row with `deliberately-absent` names the side and the reason. A rule renamed
or a section retitled without the matrix is a red suite — the drift protection the consultants asked for.

**The inventory as a file, so the matrix is complete and not only consistent** (plan round 1, finding 4):
`research/parity-inventory.json` — one entry per requirement of § 3 (`P1`…`P20`, `R1`…`R5`, and one entry per
both-sides gap of § 3.3), each with `id`, `topic`, `side` (`csharp`, `typescript`, `both`) and `status`: `counterpart`
(the matrix row closes it), `deliberately-absent` (with the reason), or `planned` (the epic that will close it). A test
asserts that every inventory entry has exactly one matrix row and every matrix row maps to one inventory entry, so a
requirement added to the inventory without a row — or a row without a requirement — fails the suite. The two files are
the machine-readable form of § 3; the prose table is the human one, and the test is what keeps them one.

### 4.2 Task-gated path selection — the resolver change (D3)

Today selection is paths OR tasks (`ENTRY.md` step 7; `tools/lib/rule-catalog.mjs`). A language-scoped mechanics rule
(`csharp/lifecycle.md`, selected by `**/*.cs`) would then load in `inspect --file src/x.cs`, which has 3,948 B of
headroom, and in `gpu --file src/x.cs`, which has 475 B. One new metadata key:

```yaml
id: "csharp.lifecycle"
load: "conditional"
paths: ["**/*.cs"]
path_tasks: ["implement","audit","test","deploy","benchmark"]
```

`path_tasks` means: the `paths` select this rule only when the scope also names one of these tasks. `tasks` (plain)
still select regardless of files; `depends` is unaffected and still mandatory. A rule with `path_tasks` and no `paths`
is a metadata error. The list is the source rule's own `tasks:` line, so a C# agent on `implement` meets exactly the
mechanics it met inside `reliability.md` yesterday, and an `inspect` agent meets none — as today. `KEYS`
(`rule-catalog.mjs:30`) gains the key; `selectRules` applies it; `module_rules.md` documents it; `ENTRY.md` step 7's
sentence becomes "Selection is paths (optionally gated by `path_tasks`) OR tasks, plus always rules and transitive
dependencies". Tests: a gated rule is selected with path + gated task, not with path alone, not with the task alone; the
error case; the explain output names the gate in `reasons`.

**Why not the alternatives.** Without the gate, the mechanics rules select on every task: `inspect --file src/x.cs`
becomes ≈ 37 KB and every single-read task with a language file leaves the list (D1 forbids the deletion that would
avoid it). Keeping the mechanics in common rules is what the consultants rejected (cross-language context pollution, and
the benchmark bias of a C# agent reading Node mechanics). `depends:` cannot express "when this task".

### 4.3 D2 applied: which text moves where, verbatim, and the evidence behind each Node claim

**Moves (word for word, byte-equal — the E1.S4 test compares each moved block's bytes in the destination file with the
same line range of the source file at the commit RIGHT BEFORE the move, named per block in `research/module_rules.md`
§ *Moves*).** Where a block also needs a wording change (today only `typescript/doctrine.md` § 1, § 4.4), the order is
fixed by plan round 1 (findings 1–2): **first** a separate, documented commit that makes the wording change inside the
SOURCE file and records its body with `node tools/rule-bodies.mjs --update <id>`; **then** the move, byte for byte from
that anonymised source; the byte-equality test's "before" commit is the anonymisation commit. A move and a wording change
in one commit would leave nothing for the test to compare against.

| From (lines at `f46982f`, bytes by `Buffer.byteLength`) | To | Gate (= the source's `tasks`) |
|---|---|---|
| `common/testing.md:12-34` (1,267 B), `:354-358` (252 B) | `csharp/testing.md` (paths `**/*.cs`, `**/*.csproj`) | implement, test, audit, policy, release |
| `common/testing.md:32-33` the Rust sentence (inside the 1,267 B block; stays part of the moved text, and `rust/testing.md` quotes it) | `rust/testing.md` (paths `**/*.rs`, `**/Cargo.toml`) | the same |
| `common/reliability.md:104-133` (1,698 B); the sentences of `:47-70` and `:95-103` naming `BackgroundService`, `CreateAsyncScope`, `TaskScheduler.UnobservedTaskException`, `CancellationToken`, `PosixSignalRegistration`/`Console.CancelKeyPress` (≈ 1,100 B of 2,394 B); `:38-46`'s .NET launcher sentence | `csharp/lifecycle.md` (paths `**/*.cs`) | implement, audit, test, deploy, benchmark |
| `common/logging-serilog.md:61-90` (1,640 B), `:153-171` (497 B) | `csharp/logging.md` (paths `**/*.cs`, `**/Program.cs`) | logging, implement, audit |
| `common/logging-serilog.md:172-187` (875 B) | `rust/logging.md` (paths `**/*.rs`, `**/main.rs`) | the same |
| `common/utc-timestamps.md:25-48`'s .NET sentences and the C# block (≈ 900 B); its Never/DoD lines naming `DateTime.Now` | `csharp/utc-timestamps.md` (paths `**/*.cs`) | storage, implement, audit |
| `common/utc-timestamps.md:65-69` (219 B) | `rust/utc-timestamps.md` | the same |
| `typescript/doctrine.md:15-48` (2,042 B) + its DoD box | `typescript/output-encoding.md` (paths `**/*.ts,tsx,mts,cts,js,mjs,cjs`) | implement, test, audit, ui, http |
| `typescript/doctrine.md:66-79` (932 B), `:80-97` (1,151 B) + their DoD boxes | `typescript/testing.md` (paths as above) | implement, test, audit, policy, release |
| `csharp/nuget-packages.md:12-23` (824 B), `:25-37` (760 B), `:39-47` (436 B minus the two `dotnet`/`Invoke-RestMethod` lines, which stay), `:50-54` (287 B) | `common/dependencies.md` (tasks `dependencies`) | — |

Each source keeps its neutral invariant (already present as the section's opening sentences in every case above) and
gains one pointer line ("the .NET mechanics: `csharp/lifecycle.md`; Node: `typescript/lifecycle.md`"). Nothing is
shortened; a moved block is removed from the source only because its bytes appear, equal, in the destination — the test
of E1.S4 is what makes D1's "moves keep the text" checkable.

**Stays, by D6:** `security.md:18` and `:26` (one phrase each; the core gains the Node phrase beside them, § 5),
`platform-limits.md:43`, the `http-contracts.md:31-35` rows, the `local-cpu-budget.md` rows, `logging-serilog.md:190`
and the other one-line Never items, `reliability.md:243-245`'s DoD boxes (neutral: "the token's state decides").

**Reliability's .NET cancellation checklist versus the Node paragraph** (verified against `reliability.md:243-245`): the
checklist says the token's state decides and a wait you own gives up in its own words. The Node rule says the same with
Node's names — decide by the caller's `signal.aborted`, never by the reason's type or name (measured: a reason can be a
`RangeError` or a bare string), and a timeout you own is your own typed outcome. The combined-signal probe shows why the
.NET sentence transfers: with `AbortSignal.any([caller, timeout])`, `caller.signal.aborted` is `true` when the caller
quit and `false` when the timeout fired, exactly the `IsCancellationRequested` test.

**Measured on this machine, Node v26.12.1, npm 11.20.0, 2026-10-31**, every command and its output to be kept in
`research/2026-10-31_node_behaviour_probes.md` (E5.S1):

| Claim a rule will carry | Probe | Observed |
|---|---|---|
| `AbortSignal.timeout` rejects with a `DOMException` named `TimeoutError`; a caller's `abort()` gives `AbortError` | `AbortSignal.timeout(10)` read after 50 ms; `new AbortController().abort()` | `TimeoutError`, `instanceof DOMException` true; `AbortError` |
| A reason is whatever the aborter passed — no classifier on its name | `abort(new RangeError("budget spent"))`; `abort("a string reason")` | `RangeError`, `name` `RangeError`; a string, `name` `undefined` |
| `AbortSignal.any([caller, timeout])` carries whichever fired first; the caller's own signal says who | the two combined, caller aborts first; the two combined, timeout fires first | `caller.signal.aborted` true, reason "caller gave up"; `TimeoutError` |
| A pre-aborted signal rejects at once | `timers/promises.setTimeout(5000, …, { signal: AbortSignal.abort() })` | `AbortError` after 0 ms |
| An abort listener with `{ once: true }` runs once for two `abort()` calls | | 1 |
| `Date` parses a date-only ISO string as UTC and a date-time string without offset as local | `new Date("2026-07-01")`, `new Date("2026-07-01T12:00:00")` under `TZ=Europe/Paris` (offset −120) and `TZ=Europe/Kyiv` | `…T00:00:00.000Z` in both zones; `…T10:00:00.000Z` and `…T09:00:00.000Z` |
| `Temporal` is available unflagged | `typeof Temporal` | `object` |
| An unhandled rejection crashes the process by default | `Promise.reject(new Error("boom"))` with a later timer | stack printed, exit 1, the timer never ran |
| `SIGTERM` with no handler ends the process without cleanup; a handler runs the cleanup | `process.kill(process.pid, "SIGTERM")` with and without a listener | exit 143, nothing printed; "handler ran", "cleanup finished", exit 0 |
| An ignored `SIGTERM` (an empty handler) defeats the supervisor | `timeout 2 node -e 'process.on("SIGTERM",()=>{}); …setInterval'` | still alive after more than two minutes; ended only by `SIGKILL` |
| A pending timer keeps the loop alive until `.unref()` | `setTimeout(…, 2000).hasRef()` before and after `unref()` | `true`, then `false` |
| `child.kill()` does not reach grandchildren; a process-group kill does | `sh -c "sleep & sleep & wait"` spawned twice, once `detached: true`; `child.kill("SIGTERM")` vs `process.kill(-child.pid, "SIGTERM")`; `pgrep -f "^sleep N$"` | before: 2 and 2; after: **2 left** vs **0 left** |
| A grandchild holding the pipe delays `close` | `sh -c "sleep 1.5 & echo"` with `stdio: "pipe"` | `exit` at 4 ms, `close` at 1,508 ms |
| `Buffer.byteLength` counts encoded bytes | `"abcdefé"` | `length` 7, bytes 8 |
| `JSON.parse` rounds a 64-bit id | `JSON.parse('{"id":9007199254740993}').id` | `9007199254740992`; `Number.isSafeInteger` false |
| The reviver's third argument carries the source text (lossless parse) | `JSON.parse(text, (k, v, context) => k === "id" ? BigInt(context.source) : v)` | `context` = `{"source":"9007199254740993"}`; result `9007199254740993n`, a `bigint` |
| `JSON.rawJSON` writes a large id back unquoted; a bare `BigInt` does not stringify | `JSON.stringify({ id: JSON.rawJSON("9007199254740993") })`; `JSON.stringify({ id: 9007199254740993n })` | `{"id":9007199254740993}`; `TypeError` |
| **C# mirror** (SDK 10.0.114, `System.Text.Json`, `TreatWarningsAsErrors`, `-m:4`): a `long` target reads exactly, a `double` target or `GetDouble()` loses precision; the case-sensitive default binds nothing and says nothing | `Deserialize<record(long Id)>`, `Deserialize<record(double Id)>` with `PropertyNameCaseInsensitive`; `JsonElement.GetInt64/GetDouble/GetRawText`; `Deserialize<decimal>`; `Deserialize<long>("9223372036854775808")`; the same `long` record WITHOUT the option against `"id"` | 9007199254740993; 9007199254740992; exact / …992 / exact; exact; `JsonException`; **0, no error** |
| `node --env-file` loads an uncommitted secrets file | `node --env-file=.env -e …` | the value read |
| Node runs a `.ts` file with a type error (stripping checks nothing) | `const n: number = "not a number"` | ran, exit 0, `typeof n` `string` |
| `enum` is refused under type stripping | `enum Color { Red }` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| `tsc` emits despite errors unless `noEmitOnError` | tsc 5.9.3, `strict`, one type error, with and without the flag | exit 2 and `out/a.js` written; exit 1 and no output directory |
| `npm install --save-dev x@v` writes a caret range unless `--save-exact` | `typescript@5.9.3`, then `--save-exact picomatch@4.0.3`; `npm config get save-prefix`, `save-exact` | `"^5.9.3"`; `"4.0.3"`; `^`, `false` |
| `npm ci` refuses a lock out of step with `package.json` | the dev dependency changed to `5.8.3` against a lock at `5.9.3` | `EUSAGE … lock file's typescript@5.9.3 does not satisfy typescript@5.8.3`, exit 1; `^5.8.0` is accepted — the refusal is about satisfaction, not equality |
| `node --test` carries the flags P10 names | `node --help` | `--test-name-pattern`, `--test-only`, `--test-timeout`, `--test-concurrency`, `--test-skip-pattern` present |
| typescript-eslint's TypeScript range | `npm view typescript-eslint version peerDependencies.typescript`; `npm view typescript version` | `8.72.1`, `>=4.8.4 <6.1.0`; `7.0.2` |

Claims the stories still owe a run before the text lands (acceptance criteria in E5 and E6): `process.exitCode` versus
`process.exit()` inside a shutdown (`post-deploy-checks.md:154` already records the Windows crash); pino's file and
console transports writing the family's path shape with UTC; `readline`/stream backpressure under a slow consumer; a
`node --test` run of a type-stripped `.ts` suite with `--import` of the priority preload; the Windows `taskkill /T` half
of P15; a Fastify and an Express application printing its route table into the `--routes` shape.

### 4.4 D4 applied: the TypeScript doctrine becomes the design mirror; the traps move to their topics

After the moves of § 4.3, `typescript/doctrine.md` holds: its front matter and introduction (562 B, unchanged), a new
`## 0. Language, runtime and design` of about 3,200 B — P1 (D7), P2's one line, P5–P7 by meaning, each a short
paragraph that names the C# section it mirrors, and which sections apply to plain JavaScript — the existing § 2
(755 B, unchanged, with its DoD box), three pointer lines to the gated rules that now hold § 1, § 3 and § 4, and a
Definition of Done for the design section. Estimated size ≈ 4,900 B against 5,910 today — smaller, with nothing
deleted: 4,125 B of trap text left for the gated rules word for word.

**Wording changes, not content** (D1), **in the source, as their own commit, before the move** (plan round 1): in
`typescript/doctrine.md` § 1 as it stands, `webauthnPrf.ts` / `entityFormScript.ts` / `depPickerScript.ts` become
"one module, a second, and a third written beside the fix for the second", and "a real vault" becomes "a real credential
store"; every sentence, number and date stays — a recorded wording change with no lesson removed, its body hash updated
by `node tools/rule-bodies.mjs --update typescript.doctrine` in that commit, listed in the pull request as wording. The
move of § 1 to `typescript/output-encoding.md` follows in the next commit, byte for byte from the anonymised text.

**Placeholder files created by a move carry valid front matter from their first commit** (plan round 1, finding 2):
`typescript/output-encoding.md` and `typescript/testing.md` are created by E4.S2 with `id`, `load`, `paths`,
`path_tasks` and `depends` exactly as § 4.3 names them, holding exactly the moved text and nothing else, with their
`rule-bodies.json` entries added by hand in the same commit — so the catalog loads and `npm test` is green at every
story, and no byte is ever in flight between two commits. The same holds for every file a later move creates
(`csharp/*.md`, `rust/*.md`).

Selectors: `paths: ["**/*.ts","**/*.tsx","**/*.mts","**/*.cts","**/*.js","**/*.mjs","**/*.cjs"]`, no gate — like
`csharp/doctrine.md`. This repository's own `tools/*.mjs` then load the doctrine on an `inspect` (§ 5: 29,087 B, fits).

**`csharp/doctrine.md`** gains `Nullable enable` in § 1 (≈ 20 B) and a Definition of Done (≈ 350 B, R3). Nothing is
removed. The reverse items by topic (consultants' point 6): `null!`/`default!` → `csharp/testing.md` beside the moved
`as`-cast section; Razor encoding → `csharp/output-encoding.md`; a Definition of Done → every new rule on both sides.

**Superseded (D1), kept for the record — the first revision's § 4.7:** *"`typescript/doctrine.md` (5,909 B; ceiling
6,348 B): gains a § 0 of at most 1,000 B … gives up the three source-file names … the second bullet of § 4's
shared-checkout narrative is folded into one sentence … Target ≤ 6,300 B. `csharp/doctrine.md` (4,613 B; ceiling
5,088 B) … gives up ≈ 450 B of § 4a's narrative … Target ≤ 5,050 B."* Replaced by the paragraphs above: the ceilings
came from trimming, and trimming is forbidden; the anonymisation survives as a change of wording only.

### 4.5 The dependency rules (D14) — unchanged in substance from the first revision

**`common/dependencies.md`** — id `common.dependencies`, `tasks: ["dependencies"]`, no `paths`, no `depends`. Holds,
moved verbatim from `csharp/nuget-packages.md` (§ 4.3's last row): *Before adding any package* (the table; "nuget.org"
stays in the moved sentence and the rule adds "or the ecosystem's registry" beside it rather than editing it), *Licence
before version*, *Bumping* (the `dotnet`/`Invoke-RestMethod` lines stay in the NuGet rule), *Prefer nothing*; plus the
vulnerability scan (§ 3.3) and the lock/pin asymmetry sentence. Target ≤ 4,000 B; `dependencies` is a split-read task.

**`csharp/nuget-packages.md`** loses `tasks: ["dependencies"]` and the moved blocks, keeps central pins, the two
family-wide decisions (FluentAssertions 7.2.2, the Aspire pair — the coupled-version exceptions D14 names), the two
`dotnet` commands and the zero-reference box, and gains the pointer. Expected ≈ 1,000 B (from 3,081).

**`typescript/npm-packages.md`** — id `typescript.npm-packages`, `paths: ["**/package.json"]`, no gate (the
`package.json` scopes are already split reads, § 5). P9's three layers named as D14 asks: the declared range
(`save-exact=true` in `.npmrc`), the lock's resolution (`package-lock.json`, committed), the reproducible install
(`npm ci --ignore-scripts`, the only install in CI; what it refuses and what it accepts, measured). `package-lock.json`
and `.npmrc` are not selectors: they are what following the rule produces, and each would open a new single-read scope.

### 4.6 Enforcement parity (D8)

| .NET | Node | Class |
|---|---|---|
| `tools/build-flags-check.mjs`: `Directory.Build.rsp` exists and says `-nr:false`; no `-noautorsp`; a repository with no C# passes without opinion | **`tools/node-strictness-check.mjs`** (new): for every `tsconfig*.json` outside `node_modules`, the compiler's own merged view (`tsc --showConfig -p <file>`, so `extends`, nested packages, excludes and overrides resolve as `tsc` resolves them) has `strict: true`, where **`tsc` is found through package resolution, never a fixed path** (plan round 1, finding 3): `createRequire(<the tsconfig's package dir>/package.json).resolve("typescript/bin/tsc")`, falling back to a walk up the parents' `node_modules/.bin` — the resolution that covers a hoisted workspace install, pnpm and yarn shims; **INCOMPLETE is reported only when no TypeScript resolves at all**, and `noEmitOnError: true` unless `noEmit: true`; the `lint` script runs eslint with `--max-warnings 0` and the config sets `reportUnusedDisableDirectives: "error"`; a `test` script that runs `node` on a `.ts` file is preceded by `tsc --noEmit`; every `package.json` with dependencies has an `.npmrc` beside it or above it saying `save-exact=true`; `--warn` first, as every check here lands ([README.md](../README.md) § *tools*); a repository with no `tsconfig*.json` passes without opinion; **a TypeScript repository whose `tsc` is not installed is INCOMPLETE, never green**. Proven on deliberately invalid fixtures: `strict` missing in a base config inherited through `extends`; `noEmitOnError` missing with emit; `--max-warnings` absent; a stripped-TS test script without `tsc --noEmit`; a caret range with no `.npmrc`; a stale `eslint-disable`; and one VALID fixture with a hoisted install — `tsc` only in the parent's `node_modules`, the `tsconfig.json` in a workspace package — which must pass, not report INCOMPLETE | check ↔ check |
| `settings/hooks/build-flags.mjs`: a `PreToolUse` hook refusing a `dotnet build` without `-m:N` | **none** — the hook exists for a measured resource problem (`csharp/dotnet-build.md` § *Measured 2026-09-11*). The candidate Node hook — refuse `npm install <pkg>` without `--save-exact` — is unnecessary once `.npmrc` carries `save-exact=true`, which is a FILE the check verifies (measured: the setting is honoured). What a Node hook would need to earn its place: a measured cost that no file can carry | deliberately absent; stated in `research/module_rules.md` |
| `dotnet build` with `TreatWarningsAsErrors` + `Nullable enable` | the composite gate `tsc --noEmit` (or with `noEmitOnError`) + lint `--max-warnings 0` + tests, named in `compiler-strictness.md` as ONE gate the CI step runs | gate ↔ gate |
| `tools/http-coverage.mjs` reads `Map*` and `.route(`; `--routes` preferred | the same tool; a Node application prints its route table for `--routes` (D10) | one tool |

Consumers wire the new check as one CI step beside `build-flags-check` ([ROLLOUT.md](../ROLLOUT.md) § CI); a .NET-only
consumer may add it for uniformity because it passes without opinion (Q8).

### 4.7 Versions (D7)

`typescript/doctrine.md` § 0 and `typescript/compiler-strictness.md` open the way `csharp/doctrine.md:10` does, as one
tested combination: **"Node 26 (the current LTS line); TypeScript at the newest version the pinned typescript-eslint
supports (today 6.0.x — `typescript-eslint@8.72.1` peers `typescript >=4.8.4 <6.1.0`, read 2026-10-31), `strict`."**
Node 26's LTS status and the versions are read from the official indexes on the day the text lands and the date is
written beside them (`nodejs.org/dist/index.json`: v26.13.0 is LTS "Lithium", read 2026-10-31 by the other plan;
`npm view typescript version` → 7.0.2, read here). One consumer records exactly this constraint in its lint config and
sits on 6.0.3 for it. Q2 puts the alternative — TypeScript 7 without type-aware lint — to the operator.

**Superseded (D7):** the first revision's "TypeScript 7 where every tool in the chain accepts it; otherwise the newest
version every tool accepts" — the newest TypeScript was the headline and the lint the caveat; D7 inverts that, because a
toolchain is tested as one combination or not at all.

### 4.8 Superseded design of the first revision, kept for the record (D1)

- *Node sections inside the common rules* (`## Node` after `## Rust`; Node paragraphs inside reliability's sections) —
  superseded by D2: the mechanics live in `typescript/`-scoped gated rules, the common rule keeps the invariant and a
  pointer.
- *`typescript/doctrine.md` ≤ 6,348 B and `csharp/doctrine.md` ≤ 5,088 B by trimming* — superseded by D1 and § 4.4.
- *`NODE_ROUTE` and prefix regexes in `http-coverage.mjs`* — superseded by D10 (`--routes`).
- *The `utc-timestamps.md` Node section ≤ 1,200 B* — superseded by D2: `typescript/utc-timestamps.md`, gated.
- *Five epics, Q = 2, provisional* — superseded by the `## Epics` section's seven, after the consultants.

## 5. The size plan — measured, under D1

Budgets, from `tools/lib/rule-catalog.mjs:31` and `tools/rules.test.mjs:250-257`: the always-loaded core ≤ 16,384 B;
every pinned single-read scope ≤ 32,768 B. Measured on this worktree at `f46982f` with
`node tools/rules.mjs explain --repo . --task <t> --file <f>` (the `bytes` field). "After" is the estimate from the
block sizes of § 4.3 and the additions of § 4.4; every story measures and writes the number into
`research/module_rules.md`.

| Scope | Today | After (estimate) | Fits one read? | What changes it |
|---|---|---|---|---|
| always core | **15,055** B (`coding-style` 2,889 + `knowledge-base` 3,564 + `security` 8,602) | ≈ 15,280 | yes (≈ 1,100 B left) | `security.md` + ≈ 40 B (P14 phrase) + ≈ 120 B (P15 pointer phrase); `coding-style.md` + ≈ 60 B (P7 pointer). Nothing leaves the core |
| `inspect` (no file; the session-start hook's read) | 24,207 | 24,207 | yes | nothing |
| `inspect --file src/x.cs` | 28,820 | ≈ 29,190 | yes | `csharp/doctrine.md` + 370 B; the gated mechanics do not load on `inspect` (D3) |
| `inspect --file src/x.csproj` | 31,901 | ≈ 31,660 | yes | + 370 (doctrine) − 2,300 (NuGet blocks moved) + 150 (pointer) |
| `inspect --file ui/a.ts` | 30,116 | ≈ 29,090 | yes | the doctrine ≈ 4,900 B after the moves (4,125 B leave, ≈ 3,200 B of design and pointers arrive) |
| `inspect --file src/a.mjs` | 24,207 (no language rule) | ≈ 29,090 | yes | the `.js` selector |
| `inspect --file tsconfig.json` | 24,207 | ≤ 27,507 | yes | `compiler-strictness.md` ≤ 3,300 B |
| `ui` (no file) | 26,420 | 26,420 | yes | nothing |
| `ui --file ui/a.ts` | **32,329** (439 left) | ≈ 31,300 **+ output-encoding ≈ 2,300 = ≈ 33,600** | **no — leaves the single-read list (D5)** | the webview trap is gated on `ui`; without `ui` in its gate the scope would fit (≈ 31,300) but the trap would not reach the task it was written for — Q3 |
| `ui --file src/x.cs` | 31,033 | ≈ 31,400 | yes | + 370 |
| `ui --file src/a.mjs` | 26,420 | ≈ 33,600 | no (as `ui/a.ts`) | the same |
| `gpu --file src/x.cs` | **32,293** (475 left) | ≈ 32,660 | **yes, by ≈ 105 B — measured before the DoD lands; if over, D1 forbids the cut and `gpu` with a language file leaves the list (Q3)** | `Nullable enable` + the Definition of Done |
| `gpu --file ui/a.ts` | 33,589 (unpinned, over) | ≈ 32,580 | yes — improves | the doctrine shrinks by the moves |
| `gpu --file tsconfig.json` | 27,680 | ≤ 30,980 | yes | the compiler rule |
| `storage` (no file) | 29,406 | ≈ 28,300 | yes | `utc-timestamps.md` loses ≈ 1,100 B to `csharp/` and `rust/` (verbatim moves) |
| `storage --file tsconfig.json` | 29,406 | ≤ 31,600 | yes | sets the compiler rule's ceiling: **≤ 3,300 B** |
| `storage --file src/x.cs` | 34,019 (unpinned, over) | ≈ 28,300 + 4,983 + `csharp/utc-timestamps` ≈ 900 ≈ 34,200 | no, as today | the C# clock mechanics are gated on `storage` |
| `storage --file ui/a.ts` | 35,315 (unpinned, over) | ≈ 28,300 + 4,900 + `typescript/utc-timestamps` ≈ 1,200 ≈ 34,400 | no, as today | the same |
| mixed `inspect --file src/x.cs --file ui/a.ts` | 34,729 (unpinned, over) | ≈ 34,100 | no, as today | both doctrines |
| `inspect --file package.json` | 35,409 (`local-cpu-budget` 11,202) | ≈ 38,900 | no, as today | + `npm-packages` ≈ 3,500 |
| `logging --file src/Program.cs` | 78,866 | ≈ 78,900 | split read | the Serilog blocks leave `common/logging-serilog.md` and arrive in `csharp/logging.md` on the same scope |
| `logging --file src/server.ts` | 80,162 | ≈ 78,650 | split read | − 3,012 B of Serilog/Rust mechanics + ≈ 1,500 B of `typescript/logging.md` |
| `implement --file ui/a.ts` | 292,834 (28 rules) | ≈ 291,600 | split read | − ≈ 8,200 B of C# and Rust mechanics; + ≈ 7,000 B of TypeScript mechanics (lifecycle, testing, logging, utc, output-encoding) |
| `implement --file src/x.cs` | 291,538 (28 rules) | ≈ 292,000 | split read | the C# mechanics move within the scope; + 370 |
| `implement --file src/main.rs` | 291,304 | ≈ 284,200 | split read | − 8,200 B of C# mechanics; the Rust sections arrive as `rust/*` on the same scope |
| `dependencies --file package.json` | 171,557 (19 rules, with `csharp.nuget-packages`) | ≈ 175,000 | split read | − NuGet + `common.dependencies` + `npm-packages` |
| `test --file ui/a.ts` | 285,402 | ≈ 284,000 | split read | as `implement` |

**Does every scope fit?** Every scope the test pins today fits except `ui --file ui/a.ts`, which leaves the list by D5
(an allowed move under D1), and `gpu --file src/x.cs`, which fits by the estimate with ≈ 105 B and is the one number a
story must measure before the C# Definition of Done lands. Nothing is deleted anywhere; the scopes that are over today
and unpinned (`gpu`/`storage` with a `.ts`, `storage` with a `.cs`, mixed, `package.json`) get smaller or stay as they
are. The hook's session-start read (`inspect`, no file) is untouched.

**Byte allowances per epic** (E1's exit criterion): E2 ≤ 4,000 B `common/dependencies.md`, ≤ 3,500 B `npm-packages.md`,
no cap on the NuGet trim since it only moves bytes out; E3 ≤ 3,300 B `compiler-strictness.md`; E4 `typescript/doctrine.md`
≤ 5,900 B after the moves (so the `.ts` and `.mjs` single-read scopes stay at or under today's 30,116 B) and
`csharp/doctrine.md` ≤ 5,088 B (the `gpu` row); E5 and E6 gated rules: no single-read cap, each measured and recorded;
`typescript/utc-timestamps.md` ≤ 1,200 B so `storage --file ui/a.ts` improves rather than worsens. The core: ≤ 300 B in
total.

## 6. Boundary with the experiment's plan (named on both sides)

| Item | Built by | The other plan's part |
|---|---|---|
| The parity matrix, the rules, the tests, the check, the release | this plan | `dew_flow_benchmark · todo/PLAN_lang_comparison_v2.md` E0.S1–S2 name the audit and the rules as a prerequisite story; they point here by path once this plan exists |
| The task repository's pin at the parity release, on a snapshot branch | the other plan, E0.S3 | this plan reports the release sha (§ 9 E7) |
| **The record per benchmark arm (D13):** the conventions sha; the selected rule ids and hashes per stack for the arm's scopes (`explain` output, kept); the toolchain versions (compiler, parser, lint, Node, SDK); the effective checks that ran (the composite gate's commands and exit codes) | this plan provides the `explain` and check commands and their expected shape (§ 10); the other plan runs and records them per session | its T14 says "the bytes read per session are in the record" — this adds ids, hashes and checks, because equal source ownership does not prove equal instructions reached the agents |
| The record of rule bytes actually read per session (its T14) | the other plan | this plan records the bytes per scope (§ 5) so the two numbers can be compared |
| The consumers' bump pull requests and the dry run | this plan (E7) | none — a consumer change the experiment does not see |

Order: this plan first; its release is a precondition of the other plan's pre-registration (its D23). Disjoint: nothing
here touches the harness, the tasks or the task repository; nothing there edits a rule. The other plan was read on branch
`docs/plan-lang-comparison-v2` at `aa5e413`; adding this plan's path and the D13 record to its E0 is a repaired reference
plus one story line on that side (its ledger has not opened — its status says so).

## 7. Growth surface

| Surface | Projected size | Who retires it | Interrupted |
|---|---|---|---|
| The rule catalog: 3 + 5 + 3 new `typescript/` files, 5 new `csharp/` files, 3 new `rust/` files, 1 new `common/` file; ≈ 12 KB of new text, ≈ 10 KB moved | ≈ 56 rules, ≈ 400 KB of 4 MiB (`LIMITS.catalog`); 256-file limit far | the single-read and core tests bound the loaded part; a rule that stops being true is edited, never appended to | a half-landed rule set is a red `rule-bodies` suite — nothing partial reaches `release` |
| `research/parity-matrix.json` | ≈ 8 KB, one row per P/R entry | edited with the rules; its test retires a stale row | — |
| `research/parity-inventory.json` | ≈ 4 KB, one entry per requirement and both-sides gap | edited with the matrix; the one-to-one test refuses an orphan on either side | — |
| `research/2026-10-31_node_behaviour_probes.md` | one file, ≈ 14 KB, kept forever as the dated evidence | never pruned; superseded probes are re-run and the new date added (D1) | — |
| `tools/fixtures/node-strictness/` | ≈ 8 small fixture trees, < 60 KB | live as long as the check | — |

No process, table or cache is created.

## 8. Threats

| # | Threat | Control |
|---|---|---|
| T1 | **A Node rule written from knowledge rather than measurement.** The TS doctrine's traps are measured; a mirror of the C# runtime mechanics written by analogy will be wrong somewhere (the `Date` trap is the INVERSE of .NET's; `child.kill()` is not a tree kill; a reason need not be an `Error`) | § 4.3: every claim has a probe line or a cited document before the sentence lands; the record is a file in `research/`; the code round is told to check each Node sentence against the record |
| T2 | **A size budget breaks a test or, worse, an agent's read.** The real-agent migration once got INCOMPLETE and read nothing when a scope passed 32 KiB (`tools/rules.test.mjs:188-192`) | § 5's per-epic allowances; the measurement is part of every rule story's acceptance; new scopes are pinned; D1 means the answer to "over" is placement or an open question, never a cut |
| T3 | **.NET-only consumers receive Node text they do not need** | D2: path-selected rules never load for them; the common rules now carry LESS language text than today (the Serilog, MTP and OCE/TCE blocks leave); a .NET consumer's single-read scopes do not change |
| T4 | **The family's TypeScript practice contradicts the version rule** (typescript-eslint refuses TS 7) | D7 states the toolchain as one tested combination; Q2 |
| T5 | **A mirror written from VS Code extensions does not fit a server.** The family's TypeScript is extensions; the experiment's tasks are daemons and web APIs | the lifecycle rule's invariant is ownership through completion (D9), stated for hosts, not for webviews; one consumer's loopback HTTP broker (`http-contracts.md:170-173`) and this repository's `tools/lib/proc.mjs` are the server-side precedents; the owed probes include a stream under backpressure and a route table printed for `--routes` |
| T6 | **Two copies of the neutral dependency text drift** | it lives once, in `common/dependencies.md`; the ecosystem rules carry pointers |
| T7 | **The bare arm never reads a rule.** Parity matters only to the process arm; over-building here delays a release the experiment waits for | the scope is the matrix of § 3 and nothing wider; each epic is one pull request |
| T8 | **The release reaches eight consumers at once** and reddens every open pull request's `pin-check`; a consumer's CI fails on the new check | E7 dry-runs the check and the rule set against the TypeScript and .NET consumers first (D13) and records what would fail; announces; promotes once; bumps the pinned-by repository last ([README.md](../README.md) § *Bumping a pin*) |
| T9 | **A product name slips into a shared rule** (the TypeScript consumers' names, "the extension", "the vault") — or the anonymisation and a move land in one commit, leaving the byte-equality test nothing to compare against | `node tools/ownership-check.mjs` is armed; the anonymisation is a separate, documented commit in the SOURCE file first (`rule-bodies.mjs --update`), listed as wording with no lesson removed, and the move follows byte for byte (§ 4.3, § 4.4, E4.S2) |
| T10 | **A move loses a caveat.** A block moved "verbatim" by hand drops a sentence, or a neutral sentence goes with it and the common rule loses its invariant | the byte-equality test of E1.S4 on every moved block; the common rule's remaining section is read as an instruction from someone who has not seen the long one ([knowledge-base.md](../common/knowledge-base.md)) |
| T11 | **The resolver change (D3) is read as a loophole** — a rule gated to avoid a budget rather than to match its source's tasks | the gate list of every mechanics rule equals its source rule's `tasks:` line and a test asserts it; `module_rules.md` states the one legitimate use |
| T12 | **Equal source ownership is mistaken for equal instructions reaching the agents** | D13's per-arm record: ids, hashes, toolchain versions, effective checks |

## 9. Build order

1. **E1** delivery and the parity contract — the resolver gate, the matrix file and test, the selection tests, the
   measured headroom, the byte allowances; **no new prose**.
2. **E2** dependency policy — in parallel once E1 fixes placement.
3. **E3** compiler/lint enforcement contract (cornerstone).
4. **E4** TypeScript design doctrine parity (cornerstone).
5. **E5** runtime lifecycle (cornerstone).
6. **E6** application contracts with their C# and Rust counterparts.
7. **E7** consumer dry run, release, consumer adoption, the per-arm record.

Each of E1–E6 ends in one pull request through the coai plan and code gates; at most three are open at once
([pull-requests.md](../common/pull-requests.md) § 7). E7 has no diff of its own except the consumer bumps.

**Superseded order (first revision):** dependency rules → doctrines → Node sections → tools → release. Replaced because
placement (E1) must precede every text, and because the consultants ranked the compiler gate, the design doctrine and
the lifecycle as the three cornerstones.

## 10. Test plan

- `npm test` green at every story: the manifest test (`tools/rules.test.mjs:151`, every body recorded; new ids added
  by hand, `tools/rule-bodies.mjs:186`), the gate's selection tests (§ 4.2), the per-scope id-list tests (§ 4.1), the
  single-read scope test with the list of D5 and the new config scopes, the always-core budget, the parity-matrix test
  and the inventory↔matrix one-to-one test (§ 4.1), the byte-equality test over the moved blocks against the commit
  right before each move (§ 4.3), the `http-coverage` test that a Node route table in the `--routes` shape is read and
  compared, the new check's fixtures (§ 4.6; a repository with no TypeScript passes; the hoisted-install fixture passes;
  a TypeScript repository where no `typescript` package resolves is INCOMPLETE), and — at every story — the catalog
  loads with every placeholder file's front matter valid.
- `node tools/rule-bodies.mjs` in step.
- `node tools/ownership-check.mjs` passes with no baseline file.
- `node tools/plan-lifecycle.mjs` clean.
- The measurements of § 5, before and after each epic, in `research/module_rules.md`.
- The dry run (E7.S1): the new check with `--warn` and the resolver's `explain` for the representative scopes against
  the four TypeScript-bearing and four .NET-only consumers' checkouts; findings listed in E7's record (a finding is
  information, not a consumer change this plan makes).
- One bounded smoke the way `research/module_tests.md` records them: a real session on `inspect --file ui/a.ts`,
  `implement --file ui/a.ts` (split read, `--only` per rule), `inspect --file tsconfig.json` and
  `dependencies --file package.json` reads the selected rules to their END markers.
- The per-arm record's commands (D13): `explain` for the arm's scopes with ids and hashes; the composite gate's commands
  and their exit codes; the toolchain versions — written once here, run there.

## 11. Definition of Done

- [ ] Every row of § 3 is closed in the text of the rule it names, or recorded as deliberately absent in
      `research/module_rules.md` with the reason; `research/parity-matrix.json` carries the same rows and its test is green.
- [ ] No existing rule sentence was removed or shortened (D1); every moved block is byte-equal in its destination against
      the commit right before its move (the test of E1.S4); the one wording change was its own commit in the source file,
      with `rule-bodies.mjs --update`, before the move, and is listed in the pull request as wording.
- [ ] `research/parity-inventory.json` lists every requirement and both-sides gap of § 3 with a status, and the
      one-to-one test against `parity-matrix.json` is green.
- [ ] Every file a move created carried valid front matter and a manifest entry from its first commit; `npm test` was
      green at every story.
- [ ] Every Node sentence in a rule has a line in `research/2026-10-31_node_behaviour_probes.md` (a run with its output)
      or a cited document with its read date.
- [ ] The resolver's `path_tasks` key exists, is tested, documented in `research/module_rules.md` and `ENTRY.md` step 7,
      and every gated rule's gate equals its source rule's `tasks:` line (asserted).
- [ ] The language-scoped rules of § 4.3 exist with the metadata of § 4; `csharp/nuget-packages.md` has no `tasks`; the
      selectors of § 4.4–4.5 are in place and the per-scope id lists are tested.
- [ ] The always core ≤ 16,384 B; every scope in the single-read list ≤ 32,768 B, the list being D5's; `gpu --file
      src/x.cs` measured, and either in the list or recorded out of it with its number; the before/after table is in
      `research/module_rules.md`.
- [ ] The TypeScript toolchain is stated as one tested combination with its read date (D7); the operator's answer to Q2
      is recorded.
- [ ] `tools/node-strictness-check.mjs` exists, finds `tsc` through package resolution (and passes the hoisted-install
      fixture), reads the effective configuration, is proven on the invalid fixtures of § 4.6, is in `README.md`
      § *tools* and `ROLLOUT.md`, and the reason Node has a check and no hook is in `research/module_rules.md`.
- [ ] `tools/http-coverage.mjs` reads a Node route table through `--routes`; `http-contracts.md:166` says so.
- [ ] `rule-bodies.json`, `ownership-check`, `plan-lifecycle`, `npm test` green on the merged commit.
- [ ] Each of E1–E6 went through `mcp__coai__review_plan` → `mcp__coai__review_code` with every finding resolved, and its
      pull request records what the reviewers said that was not acted on; the plan's `mcp__coai__review_feature` ran once
      after E7's last epic (seven epics ≥ three).
- [ ] The dry run ran against the eight consumers and its findings are recorded before the promotion.
- [ ] `release` promoted once to the merged sha through `promote-release` with a `reason`; the sha is in this plan.
- [ ] Bump pull requests in the eight consumers of `README.md` § *Consumers* — `dew_flow_rag_qln`, `dew_flow_mcp`,
      `dew_flow_sidecar_rust`, `dew_flow_benchmark`, `dew_flow_creds_for_devs`, `dew_flow_connect_other_ais`, `wsl_care`,
      `dew_flow_vscode_kit` — the pinned-by repository last, each with `pin-check` green after its commit.
- [ ] The experiment's task repository pins the release (reported by the other plan's E0.S3); the sha here and there
      agree; the per-arm record's commands (D13) are handed over.
- [ ] This plan promoted to `research/` with its deviations, in the same task as the last bump.

## 12. Open questions

Not settled here; the owner or the named epic decides. No answer is invented.

- **Q1 .NET lock files.** Raise .NET to `packages.lock.json` + `dotnet restore --locked-mode` (a change in six consumers),
  or record the asymmetry (npm's lock fixes transitives; central pins fix directs) as § 3.3 proposes?
- **Q2 The TypeScript toolchain (D7).** TypeScript 6.0.x with full type-aware lint (the tested combination the rule
  states), or TypeScript 7 without type-aware lint until typescript-eslint supports it — and if the latter, what stands in
  for `no-floating-promises` and the complexity rule meanwhile?
- **Q3 The single-read list.** D5 takes `ui --file ui/a.ts` out of it so the webview trap reaches `ui`. Numbers: with
  `ui` in the output-encoding gate ≈ 33,600 B; without, ≈ 31,300 B and the trap does not load for the task it was written
  for. `gpu --file src/x.cs` is estimated at ≈ 32,660 B (105 B left) once the C# Definition of Done lands; if the
  measurement says over, does `gpu` with a language file leave the list too (D1 forbids the alternative)?
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
- **Q9 One pull request per epic (E1–E6) or fewer?** Six keep each diff reviewable; fewer land the release sooner.
- **Q10 Coverage thresholds** stay absent on both sides (§ 3.3). Confirm.
- **Q11** — closed by D15 (the trailer names the model that wrote the commit).
- **Q12 The gate key's name.** `path_tasks` is this plan's; a reader may prefer `when_tasks` or `paths_for_tasks`. The
  semantics are fixed by § 4.2 whatever the spelling.
- **Q13 Rust's doctrine.** `rust/doctrine.md` § 9 points at "the Rust section of logging-serilog.md"; after the move it
  points at `rust/logging.md`. Does the owner want the Rust sections moved in this plan (D2 applied to all three
  languages, as § 4.3 proposes) or left where they are with the principle stated for Rust as a later change?
- **Q14 The wire contract for 64-bit identifiers (P6).** Both doctrines will say "strings on the wire, or a lossless
  parse before any `Number`/`double`". Should the shared `http-contracts.md` go further and REQUIRE identifiers above
  2^53 to travel as JSON strings in every API this family serves (one neutral sentence, both stacks equal), or is the
  per-language reader guidance enough? Measured both ways in § 4.3: Node has the lossless reader (`context.source`) and
  .NET has `long`/`GetInt64`, so either answer is implementable.

## 13. Plan round 1 (2026-10-31) — findings and what changed

`mcp__coai__review_plan` over `ac798a0`: verdict **`proceed`**; six findings, all accepted inside the round and applied
in the commit that carries this section (gate-round edits before the owner's approval; the ledger opened at the verdict,
with no entry — the findings are the baseline).

| # | Finding | What changed |
|---|---|---|
| 1–2 | A byte-equal move and an anonymisation cannot share a commit; the test needs a "before" | § 4.3, § 4.4, E1.S4, E4.S2, T9: the wording change is its own commit in the source with `rule-bodies.mjs --update`, the move follows byte for byte, the test compares against the commit right before the move |
| 2 | A placeholder file created by a move needs valid front matter, or the catalog is red between stories | § 4.4, § 10, § 11, E4.S2: `id`, `load`, `paths`, `path_tasks`, `depends` and the manifest entry in the creating commit |
| 3 | The check must find `tsc` through package resolution, not a fixed `node_modules/.bin` path | § 4.6, § 10, § 11, E3.S2: `createRequire(...).resolve("typescript/bin/tsc")` or a walk up; INCOMPLETE only when nothing resolves; a hoisted-install fixture that must pass |
| 4 | The matrix is consistent but nothing proves it is complete | § 4.1, § 7, § 10, § 11, E1.S3: `research/parity-inventory.json` with a status per requirement and a one-to-one test against the matrix |
| 5 | P6 must say how identifiers above 2^53 travel, with the precision example, the lossless option if Node has one, and the C# mirror | P6, the probe table, Q14: strings on the wire or a lossless parse; `context.source` exists on Node 26 and `JSON.rawJSON` writes back; `System.Text.Json` `long` exact, `double`/`GetDouble` lossy, `decimal` exact, the case-sensitive default's silent 0 |

## Epics

Seven epics on the build order of § 9, each one branch, one reviewable diff and a usable state at its end. Stories are
written one epic at a time into `todo/PLAN_node_rule_parity_E<n>.md` when the epic starts
([planning-docs.md](../common/planning-docs.md) § *A plan split into epics and stories*); that document links back here.
The intended stories are listed per epic so the size is visible. **The split is final**: the question consultants were
asked (consult `ce61c905`, 2026-10-31) and both answers agreed on the order and the three cornerstone areas; Fable made
the split from them. Cornerstone areas, ranked: (1) the compiler/lint enforcement contract — the strongest C#
requirement's counterpart, and the first text the experiment's Node agent is judged by (E3); (2) the TypeScript design
doctrine — the mirror of `csharp/doctrine.md` § 1–§ 7 by meaning (E4); (3) the runtime lifecycle — the mechanics the
experiment's daemon tasks test (E5). Q = ⌈2·7/5⌉ = 3, at most one per epic.

Cornerstones: 0 of 3 — none marked yet; the stories documents of E3, E4 and E5 mark one each within the areas above

**Superseded split (first revision, before the consultants; kept by D1):** E1 the shared dependency rule and the two
ecosystem rules · E2 compiler strictness and the two doctrines · E3 Node sections in the common rules and the probe
record · E4 the two tools and the documents · E5 gates, release, bumps, the pin; Q = 2, areas: the compiler rule and
`reliability.md`'s Node paragraphs. Replaced by the seven below.

### E1 — Delivery and the parity contract (no new prose)

- **Goal:** every later text has a place, a selector, a gate and a byte allowance before it is written; the parity
  matrix is a file with a test; selection is pinned per representative scope.
- **Scope:** `tools/lib/rule-catalog.mjs` (`path_tasks`), `tools/rules.test.mjs`, `research/parity-matrix.json` and its
  test, the byte-equality test for moved blocks, `research/module_rules.md`, `ENTRY.md` step 7.
- **Stories:** S1 the gate key: semantics, errors, `reasons`, tests · S2 the selection/budget matrix of § 4.1 measured
  and recorded, with the per-scope id-list tests · S3 `parity-matrix.json` with every P/R row and its test against the
  catalog and the recorded sections, and `parity-inventory.json` with the one-to-one test (an orphan on either side is
  red — observed, then fixed) · S4 the moved-block byte-equality test: for each block, the destination file's bytes
  against the source file's line range at the commit RIGHT BEFORE the move (named per block in `module_rules.md`), so an
  anonymisation commit before the move is the "before" and a move folded into a wording change is a red test · S5 the
  byte allowances of § 5 written into `module_rules.md` and the single-read list of D5.
- **Depends on:** nothing. **Done when:** `npm test` green with the new tests; the matrix test is red when a row names a
  missing id or section (observed, then fixed); every tight scope's headroom is in `module_rules.md`; one pull request
  through both gates.

### E2 — Dependency policy (parallel after E1)

- **Goal:** P9 and § 3.3's dependency rows; D14.
- **Scope:** `common/dependencies.md` (new), `csharp/nuget-packages.md` (blocks moved out, paths only),
  `typescript/npm-packages.md` (new), the manifest, the selection tests.
- **Stories:** S1 the shared rule (moved blocks verbatim; the scan and the lock sentence added) · S2 the NuGet rule after
  the move, with the pointer and the coupled-version exceptions kept · S3 the npm rule: declared range, lock resolution,
  reproducible install, each with its probe line · S4 selection tests, manifest entries, the `inspect --file src/x.csproj`
  measurement.
- **Depends on:** E1. **Done when:** `dependencies --file package.json` selects `common.dependencies` and
  `typescript.npm-packages` and not `csharp.nuget-packages`; the byte-equality test passes for the four moved blocks;
  one pull request through both gates.

### E3 — Compiler/lint enforcement contract (cornerstone area 1)

- **Goal:** P2–P4, § 3.4, D7, D8; `Nullable enable` for C# in the same epic.
- **Scope:** `typescript/compiler-strictness.md` (new, ≤ 3,300 B), `csharp/doctrine.md` § 1 (+ `Nullable enable`),
  `tools/node-strictness-check.mjs` + tests + fixtures, `README.md` § *tools*, `ROLLOUT.md`.
- **Stories:** S1 the rule text: the composite gate, the toolchain as one combination with its read date, the
  suppression policy (**cornerstone**) · S2 the check: `tsc` resolved through `createRequire(...).resolve("typescript/bin/tsc")`
  or a walk up the parents' `node_modules/.bin`, effective configuration via `tsc --showConfig`, the six invalid
  fixtures and the hoisted-install fixture that must pass, INCOMPLETE only when no TypeScript resolves, `--warn` ·
  S3 the C# § 1 line and the `gpu --file src/x.cs` measurement ·
  S4 the documents and the dry-run command for E7.
- **Depends on:** E1. **Done when:** each invalid fixture fails naming the file; a grep-only check is shown insufficient
  by a fixture whose `strict` sits in an `extends` base; `storage --file tsconfig.json` ≤ 32,768 B; one pull request
  through both gates.

### E4 — TypeScript design doctrine parity (cornerstone area 2)

- **Goal:** D4, P1, P5–P7, R3; the doctrine becomes the mirror of `csharp/doctrine.md` § 1–§ 7 by meaning.
- **Scope:** `typescript/doctrine.md` (§ 0 added; § 1, § 3, § 4 moved out verbatim to the E5/E6 files, which this epic
  creates as placeholders holding exactly the moved text so no byte is in flight), `csharp/doctrine.md` (the Definition of
  Done), `common/coding-style.md:32`, the selectors (`.js/.mjs/.cjs`).
- **Stories:** S1 § 0: readonly contracts, branded domain types with parsing factories, discriminated outcome and absence
  states, boundary validation of untrusted JSON, pure functions and immutability, complexity ≤ 4 — each paragraph naming
  the C# section it mirrors and the anonymised precedents (one consumer's readonly outcome type separating refusal,
  timeout and mechanism failure; two consumers' complexity 4), including the large-identifier paragraph of P6 with
  its two measured readers (**cornerstone**) · S2 in TWO commits, in this order: (a) the wording-only anonymisation of
  § 1 inside `typescript/doctrine.md`, documented as wording with no lesson removed, `rule-bodies.mjs --update
  typescript.doctrine` in the same commit; (b) the moves of § 1, § 3, § 4 with their DoD boxes into
  `typescript/output-encoding.md` and `typescript/testing.md`, each created with its full front matter (`id`, `load`,
  `paths`, `path_tasks`, `depends`) and its manifest entry, byte-equal against commit (a) · S3 the C# Definition of Done
  and the `gpu` measurement (Q3 if over) · S4 the selectors and the pinned scopes.
- **Depends on:** E1. **Done when:** `inspect --file ui/a.ts` and `inspect --file src/a.mjs` ≤ 30,116 B; the matrix rows
  P5–P7 point at § 0's sections; the byte-equality test is green for the three moved blocks against commit (a); the
  catalog loaded and `npm test` was green after each of the two commits; the ownership check finds no name; one pull
  request through both gates.

### E5 — Runtime lifecycle (cornerstone area 3)

- **Goal:** P13, P15; D9.
- **Scope:** `typescript/lifecycle.md` (new, gated), `csharp/lifecycle.md` (the moved reliability blocks), the pointer
  lines and the Node phrase in `common/reliability.md` and `common/security.md`,
  `research/2026-10-31_node_behaviour_probes.md`.
- **Stories:** S1 the probe record: the table of § 4.3 plus the owed probes (pre-aborted signals, custom reasons,
  cleanup, an ignored `SIGTERM`, descendants holding pipes — all run; backpressure and `taskkill /T` to run) · S2 the
  Node rule: ownership through completion — who cancels, who observes the rejection, who terminates descendants, who
  drains streams and bounds the shutdown; the `unhandledRejection` shutdown policy; `signal.aborted` and who aborted;
  `tools/lib/proc.mjs` as the shipped shape (**cornerstone**) · S3 the C# moves, byte-equal, and the reliability DoD read
  against the Node text · S4 the core's two phrases within the ≤ 300 B allowance.
- **Depends on:** E1, E4 (the doctrine's § 0 points here). **Done when:** every Node sentence traces to a probe line; the
  always core ≤ 16,384 B; the common rule still states the invariant and the pointer; one pull request through both gates.

### E6 — Application contracts, with their C# and Rust counterparts

- **Goal:** P10–P12, P14, P16–P19, R1, R2, R4, R5; D6, D10, D11.
- **Scope:** `typescript/testing.md`, `typescript/logging.md`, `typescript/utc-timestamps.md`,
  `typescript/output-encoding.md` (new, gated); `csharp/testing.md`, `csharp/logging.md`, `csharp/utc-timestamps.md`,
  `csharp/output-encoding.md` (new, gated; the moved blocks plus the reverse items); `rust/testing.md`, `rust/logging.md`,
  `rust/utc-timestamps.md` (the moved Rust sections; `rust/doctrine.md` § 9's pointer updated); the invariant and
  pointer lines in `common/testing.md`, `logging-serilog.md`, `utc-timestamps.md`; the rows and phrases of D6 in
  `http-contracts.md`, `platform-limits.md`, `post-deploy-checks.md`, `security.md:18`; `tools/http-coverage.mjs`'s
  `--routes` documentation and test for a Node table; `http-contracts.md:166`.
- **Stories:** S1 the testing pair (runner sections, import-graph test, typed-fixture discipline side by side, the neutral
  DoD box) · S2 the logging pair (pino shape measured against the path contract; the Serilog blocks moved) · S3 the clock
  pair and the Rust clock file (`storage` measured) · S4 the output-encoding pair (the webview escape module anonymised;
  Razor's `MarkupString`/`Html.Raw`) · S5 the one-line additions of D6 and the route-table path of D10 with its test ·
  S6 the Rust files and `rust/doctrine.md`'s pointer (Q13).
- **Depends on:** E1, E4, E5. **Done when:** every moved block is byte-equal; every Node sentence traces to a probe line
  or a cited document; `storage` (no file) ≤ 32,768 B; one pull request through both gates.

### E7 — Dry run, release, consumer adoption, the per-arm record

- **Goal:** the rules reach the consumers and the experiment without a red build nobody expected (D13).
- **Scope:** the dry run over the eight consumers; `promote-release` with a `reason`; bump pull requests (pinned-by
  last); the per-arm record's commands handed to the other plan; this plan's promotion.
- **Stories:** S1 the dry run: the new check with `--warn` and `explain` for the representative scopes against each
  consumer's checkout, findings recorded · S2 `mcp__coai__review_feature` over the seven epics · S3 the promotion
  (`README.md:100-122`) and the `release-distance` read · S4 the bumps, each with `pin-check` green after its commit, the
  TypeScript-bearing ones adding the check step with `--warn` · S5 the sha and the per-arm record commands handed to the
  experiment's E0.S3 and confirmed equal · S6 this plan promoted with deviations.
- **Depends on:** E1–E6 merged. **Done when:** every box of § 11 is ticked.

### Order, and why

E1 first because every text needs a place, a gate and an allowance before it is written, and because its tests are what
make D1's "moves keep the text" checkable. E2 in parallel because its placement is settled by E1 alone. E3 before E4
because the gate is what the design doctrine's strictness line points at. E4 before E5 and E6 because the doctrine's § 0
is the index the gated rules are reached from, and because its moves create the files E5 and E6 fill. E7 last, once,
with the dry run before the promotion.
