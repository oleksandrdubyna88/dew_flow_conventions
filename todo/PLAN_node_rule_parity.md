# PLAN — C#/Node rule parity: every C# requirement has a Node/TypeScript counterpart of equal strength, and the reverse

> Status: **plan only, nothing implemented yet; epoch 2 open with 0 changes, 2026-10-31 — epoch 1 closed at its
> second change (the PR #94 review, § 14), the re-review revised the whole plan (§ 15, § 16) and the coai document
> gate over `e055974` returned `proceed`; revised the same day after the question consultants, consult `ce61c905`,
> and the operator's "we only add" rule — § 0.** Scope: the shared rule corpus (`common/`,
> `csharp/`, `rust/`, `typescript/`), its selection metadata and one new metadata key in the resolver
> (`tools/lib/rule-catalog.mjs`), `research/rule-bodies.json`, a machine-readable parity matrix and its test, the
> selection and size tests in `tools/rules.test.mjs`, two tools (`tools/http-coverage.mjs`'s `--routes` path for Node; a
> new `tools/strictness-check.mjs` with a TypeScript and a .NET half), the documents that describe them, one `release`
> promotion and the bump pull requests of the consumers. It changes no consumer's code. The `## Plan changes` ledger
> opened at the plan round of 2026-10-31, whose verdict was `proceed`
> ([plan-change-control.md](../common/plan-change-control.md); the round is recorded in § 13); the PR #94 review of the
> same day is entries 1.1–1.5 and the stop (§ 14); the re-review's revision of the whole plan — the epoch 2 baseline,
> consult `58f05c75` — is § 15, its review round (the interim path, `mcp__coai__review_document`, verdict `proceed`,
> six findings accepted as baseline) is § 16; epoch 2 is open at 0 changes; the owner's approval is still to come.
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

> Epoch 1 · approved 2026-10-31 · by reviewers · state: closed

  (The six findings of the plan round were accepted inside the round, before the verdict, and are part of the approved
  baseline — § 13. They are not entries. The owner has not yet approved; an owner's request is counted like any other.)
- 1.1 · 2026-10-31 · reviewer · contract — PR #94 review (CodeRabbit), comment 1: equal strength admits a stronger side only as a recorded exception with a reason; P2 made equal by a .NET half of the strictness check
- 1.2 · 2026-10-31 · reviewer · approach — PR #94 review (CodeRabbit), comment 2: the byte-equality test reads a checked manifest, `research/moved-blocks.json`, not git history
  (This second change stopped the plan. The three entries below were accepted in the same review and are recorded one
  per cause, as the rule asks; comment 5 of that review was a repaired range in the moves table and is not an entry.
  All six edits are applied in the stop commit as the draft the re-review starts from — § 14.)
- 1.3 · 2026-10-31 · reviewer · contract — PR #94 review (CodeRabbit), comment 3: one TypeScript-repository predicate for the strictness check; `.ts` files with no project are a finding
- 1.4 · 2026-10-31 · reviewer · stories — PR #94 review (CodeRabbit), comment 4: E4 gains a typed lossless-JSON fixture with a declaration file, because neither TypeScript 6.0.3 nor 7.0.2 declares the reviver context or `JSON.rawJSON`
- 1.5 · 2026-10-31 · reviewer · scope — PR #94 review (CodeRabbit), comment 6: `research/consumers.json` as the derived consumer inventory, with a test against `README.md` § *Consumers*

### Re-review for epoch 2

Narrowed: no — judged against the gate-approved epoch 1 baseline `ac798a0` with its in-round findings `d986710`, not against the stop commit: D5 (`ui` with a language file off the single-read list) is already part of that baseline, so it is no relaxation now; epoch 2 keeps every merge guarantee (`gpu --file src/x.cs` stays single-read, § 5) and adds obligations — the check wired and enforcing for three consumer kinds, the suppression read, zero `planned` rows, the gated C# Definition of Done — and cuts nothing

| Work | Where | Verdict | Action |
|---|---|---|---|
| The E1 stories document (planning work, not on main; nothing was built) | `feat/rule-parity-e1` | fits | kept as the input to E1 — judged by the team lead as the Opus judge, 2026-10-31 |

> Epoch 2 · approved 2026-10-31 · by reviewers · state: open

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
| D11 | **Output encoding is decided by the output context.** The webview escape module one consumer already has (anonymised) is the counterpart of Razor's `MarkupString`/`Html.Raw`; both live in the gated `boundaries` rules per language (output encoding and input parsing, § 16), the invariant stays in `security.md` | consultants, 2026-10-31 |
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

**A stronger side is allowed only as a recorded exception** (PR #94 review, comment 1 — ledger 1.1; tightened by the
epoch 2 review, § 16): a matrix row whose `status` is `stronger-ts` or `stronger-cs` carries a non-empty `reason`
naming what the weaker side would need and why it is not taken now, AND its id is in the explicit whitelist the matrix
test holds (today `['P4']`, § 11); any other row with that status fails the suite, with or without a reason, so a new
exception is a reviewed edit of the test and of § 11, never a field in a JSON file. Equality is preferred where it is cheap: P2 is made equal by giving the strictness check a .NET half (§ 4.6); P4
stays `stronger-ts` with its reason (an analyzer package is a dependency decision for every .NET consumer — Q7).

## 3. The parity table

Direction `C# → Node` first, then `TS → C#`, then the gaps on both sides, then suppression. *Where* names the file that
will carry each side after this plan under D2; *strength* is the class of § 2. The same rows, with rule ids and section
headings, are the content of `research/parity-matrix.json` (E1).

### 3.1 C# requirements → Node/TypeScript counterparts

| # | C# requirement (where today → where after) | Node/TypeScript counterpart (where after) | Strength |
|---|---|---|---|
| P1 | ".NET 10, latest C#" (`csharp/doctrine.md:10`, stays) | the toolchain line of D7 in `typescript/doctrine.md` § 0 and `typescript/compiler-strictness.md` | prose, on every language file — equal |
| P2 | `TreatWarningsAsErrors` (`:10`, stays) | `"strict": true`, `"noEmitOnError": true` wherever `tsc` emits, lint at `--max-warnings 0`, `tsc --noEmit` before a type-stripped run — `typescript/compiler-strictness.md`, selected by `**/tsconfig*.json`; the one-line statement also in the doctrine's § 0 | file + CI check on BOTH sides (`tools/strictness-check.mjs`, § 4.6): its .NET half reads the EFFECTIVE `TreatWarningsAsErrors` and `Nullable` of every project with `dotnet msbuild <project> -getProperty:TreatWarningsAsErrors -getProperty:Nullable -m:4` (probed 2026-10-31, SDK 10.0.114: `"true"`, `"enable"`, `LangVersion` `"14.0"` — inherited props resolved as MSBuild resolves them), INCOMPLETE when no SDK resolves; status `equal`. **Superseded (ledger 1.1):** the first revision's "stronger than C#, which has prose only; MSBuild already fails the build once the property is set" — true of the build, but nothing checked that the property WAS set |
| P3 | `Nullable enable` — absent from the rule, present in every consumer | `strictNullChecks` (inside `strict`) — the same rule | raised on **both**: `csharp/doctrine.md` § 1 gains `Nullable enable` (≈ 20 B, no removal) |
| P4 | complexity ≤ 4, `private static` where no state is read (`:75-78`, stays) | the same number as a lint rule (`complexity: ["error", 4]`, `max-lines-per-function` 50, `max-lines` 800, `no-console`) — the shape two TypeScript consumers already run (read 2026-10-31) — in `compiler-strictness.md`; the suppression policy of § 3.4 | prose ↔ lint-enforced: status `stronger-ts`, reason recorded in the matrix: "a C# complexity rule needs an analyzer package the family has not adopted; a dependency decision for every .NET consumer (Q7), not a shared-rule edit" |
| P5 | records for data, typed values, no primitive obsession, no null in business logic (§ 2–4, stay) | `typescript/doctrine.md` § 0 (E4, by meaning): `readonly` data contracts and `Readonly<T>`/`ReadonlyArray<T>` in public shapes; validated or branded domain types (`type CommitSha = string & { readonly __brand: … }` with a parsing factory returning a result, never a throwing constructor); `undefined`/`null` only at the edges, absence as a typed state ("not captured" and "empty" are different facts) | prose ↔ prose; cites, anonymised, one consumer's readonly outcome type that separates refusal, timeout and mechanism failure |
| P6 | § 4a a DTO field the client omitted is `null` (stays); the gated `csharp/boundaries.md` **gains** (not § 4a itself — that file loads under `gpu`, § 16) the large-identifier mirror: `System.Text.Json` reads a `long` exactly and a `double` target or `JsonElement.GetDouble()` loses precision (measured: `{"id":9007199254740993}` → `long` 9007199254740993, `double` 9007199254740992, `GetInt64` exact, `GetDouble` …992, `GetRawText` exact, `decimal` exact; `2^63` into `long` throws `JsonException`); and the casing trap the same probe met: the default binder is case-sensitive, so `Id` against `"id"` bound to **0 with no error** — § 4a's silent default, in another door | § 0: a `JSON.parse` result is `any` and a declared type is a promise the parser never checked; validate at the single road in (a schema or a typed parser). **Identifiers that can exceed 2^53 travel as JSON strings, or are parsed losslessly before any conversion to `Number`**: `JSON.parse` rounds `{"id":9007199254740993}` to `9007199254740992` (measured); the lossless option exists on Node 26 — the reviver's third argument carries the source text (`JSON.parse(text, (k, v, context) => … BigInt(context.source))` → `9007199254740993n`, measured), and `JSON.rawJSON` writes such a value back unquoted (measured) while `JSON.stringify` of a bare `BigInt` throws `TypeError` (measured) | prose ↔ prose; both sides name the exact and the lossy readers |
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
| R1 | § 1 `JSON.stringify` into `<script>` is a break-out; one shared escaper; a scan test (`typescript/doctrine.md:15-48`, 2,042 B) → `typescript/boundaries.md` verbatim (anonymised wording, § 4.4) | `csharp/boundaries.md`: `MarkupString` and `Html.Raw` are the same door — a value they wrap reaches the page unescaped; JSON for a `<script>` goes through ONE helper that also closes `</script>` and `<!--`; the general rule stays `security.md` § *A measure applied at SOME of its sites* | MANDATORY ↔ MANDATORY; gated on implement, test, audit, ui, http |
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
| Coverage thresholds | **Deliberately absent on both** | `testing.md` governs what a test may claim; a number is gamed the week it lands. Recorded, like every deliberately-absent reason, in `research/parity-inventory.json` (`status: "deliberately-absent"`, `reason`) — the one home; `research/module_rules.md` points there (§ 16, stories-writer point 9: the first revision's "in `research/module_rules.md`" is superseded) |
| CI steps per language | **Deliberately absent as shared rules** | `testing.md:16-18`: each repository's own instructions and CI name the exact commands. Shared text would be an inventory |
| A runtime version statement — **not a both-sides gap** (§ 16, stories-writer point 3; the first revision listed it here by mistake) | it is P1's TypeScript side (D7): C# has the statement, TS gets one of the same shape, as one tested combination | the both-sides gaps are the five rows above, as § 1 says |

### 3.4 Exemptions and suppression — the column both sides need

| | C# | TypeScript | Equal? |
|---|---|---|---|
| Where a suppression may live | inline `#pragma warning disable <id>` with the reason on the same line; never `<NoWarn>`/`<WarningsNotAsErrors>` in a props file, never `GlobalSuppressions.cs` | inline `// eslint-disable-next-line <rule> -- <reason>`; never a file-wide disable, never `ignores` of production folders; `reportUnusedDisableDirectives: "error"` so a stale suppression fails | equal once written: today C# has no rule and TS has two divergent configs |
| A baseline of accepted violations | none (none found in three consumers) | none (none found; one consumer ignores a typed-fixtures folder that is MEANT not to compile — a legitimate exclusion the rule names as such) | equal |
| Who may widen it | a rule change here, never a repository | the same | equal |
| Where it is checked | the build (`TreatWarningsAsErrors`), and `tools/strictness-check.mjs`'s .NET half reads the effective `TreatWarningsAsErrors`/`Nullable` per project AND the effective `NoWarn`/`WarningsNotAsErrors` — a repository-added entry in either is a finding (§ 4.6; SDK defaults such as `1701;1702` are told apart by a clean-project baseline for the pinned SDK and by the repository's own props/csproj declarations) | `tools/strictness-check.mjs`'s TypeScript half reads the effective lint and compiler configuration, `reportUnusedDisableDirectives` included | equal class (file + check) |

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
`deliberately-absent`) and `reason` (required and non-empty for `stronger-ts`, `stronger-cs` and
`deliberately-absent`; refused on an `equal` row — ledger 1.1), and the exception whitelist of § 2 (`stronger-*` only
for the ids the test lists, today `['P4']`; any other such row fails — § 16). **Equality is checkable, not asserted**
(§ 16): every `equal` row records, PER SIDE, `selectors` (`paths`, `path_tasks`, `tasks`), `mood` (`MUST`/`SHOULD`),
`enforcement` (`prose`, `test`, `check`, `hook`), `consequence` (what fails) and `suppression` (the policy of § 3.4); one
test compares the two sides' fields and fails on any mismatch, and a second test checks the recorded fields against the
world — the selectors against the rule's actual front matter, the mood against the section's heading (`MANDATORY`),
and the enforcement against the actual tool (a side recorded as `check: strictness-check` must be named in that tool's
exported rule list; a side recorded as `hook` must be matched by a hook under `settings/hooks/`). A test asserts every `id` exists in the catalog and every `section` is in that rule's recorded
`sections` in `research/rule-bodies.json`; a row with `deliberately-absent` names the side and the reason. A rule renamed
or a section retitled without the matrix is a red suite — the drift protection the consultants asked for.

**The inventory as a file, so the matrix is complete and not only consistent** (plan round 1, finding 4):
`research/parity-inventory.json` — one entry per requirement of § 3 (`P1`…`P20`, `R1`…`R5`, and one entry per
both-sides gap of § 3.3), each with `id`, `topic`, `side` (`csharp`, `typescript`, `both`) and `status`: `counterpart`
(the matrix row closes it), `deliberately-absent` (with the reason), or `planned` (the epic that will close it). A test
asserts that every inventory entry has exactly one matrix row and every matrix row maps to one inventory entry, so a
requirement added to the inventory without a row — or a row without a requirement — fails the suite. The two files are
the machine-readable form of § 3; the prose table is the human one, and the test is what keeps them one.

**How E1 exits green before any destination exists** (re-review, § 15): a matrix row or an inventory entry whose
destination is not yet written has `status: "planned"` and names its owning epic (`epic: "E4"`); a move entry in
`research/moved-blocks.json` whose destination does not yet exist is `planned` too. **E1 validates `planned` items
STRUCTURALLY only**: the schema, an existing source file and line range, an owning epic among E2–E6, and — for a move —
the SOURCE bytes' `sha256` and `length`, recorded now from the commit the move will be made from. E1 does NOT check a
destination's bytes or a destination's `id`/`section`: there is nothing to check yet. **Each owning epic activates its
items when it lands them**: the status becomes `counterpart` (or `deliberately-absent`/`stronger-*` with a reason), the
reference test then requires the `id` and `section` to exist, and the move test then compares the destination's live
bytes with the recorded source hash. The final Definition of Done (§ 11) requires **zero `planned` items**; a `planned`
item whose owning epic has merged is a red suite.

**The consumers as a file** (PR #94 review, comment 6 — ledger 1.5): `research/consumers.json`, derived from the one
place the estate is listed, [README.md](../README.md) § *Consumers* (`README.md:188-199`), and asserted equal to that
table's repository column by a test, so the README stays the source and the file cannot drift from it
([rule-ownership.md](../common/rule-ownership.md) § *Never* — the estate is listed in exactly one place; this file is a
derived index with a test, not a second list). One entry per repository: `repo`, `kind`, `mount`, `notes`. Kinds:

| Kind | Meaning | Gets | Repositories (README, 2026-10-31) |
|---|---|---|---|
| `dotnet` | C# product code; Node only as tooling scripts, if at all | the `csharp/*` rules; the strictness check's .NET half; the TypeScript doctrine only on a `.mjs` tooling file | `dew_flow_rag_qln`, `dew_flow_mcp`, `dew_flow_benchmark` |
| `typescript` | TypeScript product code and no C# | the `typescript/*` rules; the check's TypeScript half | `dew_flow_vscode_kit` |
| `mixed` | C# and TypeScript product code in one repository | both languages' rules; both halves | `dew_flow_creds_for_devs`, `dew_flow_connect_other_ais`, `wsl_care` |
| `rust` | Rust product code; `csharp/` and `typescript/` never match | the `rust/*` rules (the moved sections); the check passes without opinion | `dew_flow_sidecar_rust` — decided explicitly: it wires the check for uniformity only if Q8 says every consumer does |

**"TypeScript-bearing"** = kind `typescript` or `mixed` (four repositories at the time of writing); **"TypeScript
consumer"** = kind `typescript` (one). Every count in this plan that names consumers is derived from this file: § 10's
dry run, T8, E7 and the bump list of § 11 say "every consumer in `research/consumers.json`" and give today's number in
parentheses from the README.

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
source block's recorded `sha256` and `length` in `research/moved-blocks.json`, a checked manifest with one entry per
block: `source`, `lines`, `beforeCommit`, `sha256`, `length`, `destination`.** The entry is recorded once, by
`node tools/moved-blocks.mjs --record <source> <from>-<to> <commit>`, which reads the block with `git show
<commit>:<source>` at the commit RIGHT BEFORE the move; the test itself needs no history, so it is green in CI's
`actions/checkout` at `fetch-depth: 1` and in every shallow clone (PR #94 review, comment 2 — ledger 1.2; the
alternative, `fetch-depth: 0` or a targeted fetch of each named commit, makes a test about rule text depend on the
runner's network and on commits a squash merge may not keep — the manifest is reviewed in the same diff as the move and
survives both). The semantics are unchanged: byte for byte, against the source as it stood before the move.

**The manifest is historical evidence and immutable** (re-review, § 15): original source hashes and lengths are never
edited; a later move or edit of a destination appends a provenance entry (`supersedes: <entry id>`, the new commit,
the new hash) and never replaces earlier evidence — the same stance `research/shared-rules-migration-map.json` takes for
the 24 migrated bodies. It differs from `research/rule-bodies.json` on purpose: `recordFor()` there hashes the CURRENT
whole body and its headings and is moved with every deliberate edit, while `moved-blocks.json` holds a HISTORICAL slice
of a file at one commit. Both are kept; the extraction and normalisation (`folded`, `bodyOf` in `tools/lib/rule-body.mjs`)
are shared where a slice is taken from a rule body, so the two never disagree about what a byte of rule text is.

Where a block also needs a wording change (today only `typescript/doctrine.md` § 1, § 4.4), the order is fixed by plan
round 1 (findings 1–2) and placed by the epoch 2 review (§ 16, finding 3): the wording change is **E1's preparatory
story E1.S0** — its own commit inside the SOURCE file, body recorded with `node tools/rule-bodies.mjs --update
typescript.doctrine` — and it lands BEFORE E1.S4 records `research/moved-blocks.json`, so the recorded source hash is
the anonymised text; E4.S2's move is then one commit, byte for byte equal to that recorded hash. A move and a wording
change in one commit would leave nothing for the test to compare against.

| From (lines at `f46982f`, bytes by `Buffer.byteLength`) | To | Gate (= the source's `tasks`) |
|---|---|---|
| `common/testing.md:12-31` (1,113 B — re-measured after PR #94 comment 5; the first revision listed `:12-34`, 1,267 B, which included the Rust sentence), `:354-358` (252 B) | `csharp/testing.md` (paths `**/*.cs`, `**/*.csproj`) | implement, test, audit, policy, release |
| `common/testing.md:32-33` up to ".NET-specific." — the Rust sentence, 115 B; the 37 B that follow, "Everything below applies everywhere.", are the invariant and stay | `rust/testing.md` (paths `**/*.rs`, `**/Cargo.toml`) | the same |
| `common/reliability.md:104-133` (1,698 B); the sentences of `:47-70` and `:95-103` naming `BackgroundService`, `CreateAsyncScope`, `TaskScheduler.UnobservedTaskException`, `CancellationToken`, `PosixSignalRegistration`/`Console.CancelKeyPress` (≈ 1,100 B of 2,394 B); `:38-46`'s .NET launcher sentence | `csharp/lifecycle.md` (paths `**/*.cs`) | implement, audit, test, deploy, benchmark |
| `common/logging-serilog.md:61-90` (1,640 B), `:153-171` (497 B) | `csharp/logging.md` (paths `**/*.cs`, `**/Program.cs`) | logging, implement, audit |
| `common/logging-serilog.md:172-187` (875 B) | `rust/logging.md` (paths `**/*.rs`, `**/main.rs`) | the same |
| `common/utc-timestamps.md:25-48`'s .NET sentences and the C# block (≈ 900 B); its Never/DoD lines naming `DateTime.Now` | `csharp/utc-timestamps.md` (paths `**/*.cs`) | storage, implement, audit |
| `common/utc-timestamps.md:65-69` (219 B) | `rust/utc-timestamps.md` | the same |
| `typescript/doctrine.md:15-48` (2,042 B) + its DoD box | `typescript/boundaries.md` (paths `**/*.ts,tsx,mts,cts,js,mjs,cjs`) | implement, test, audit, ui, http |
| `typescript/doctrine.md:49-65` (755 B, § 2 — its guard is a test, § 16 point 6), `:66-79` (932 B), `:80-97` (1,151 B) + their DoD boxes | `typescript/testing.md` (paths as above) | implement, test, audit, policy, release |
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

**Wording changes, not content** (D1), **in the source, as E1.S0's own commit, before E1.S4 records anything** (plan
round 1; placed in E1 by § 16): in `typescript/doctrine.md` § 1 as it stands, `webauthnPrf.ts` / `entityFormScript.ts`
/ `depPickerScript.ts` become "one module, a second, and a third written beside the fix for the second", and "a real
vault" becomes "a real credential store"; every sentence, number and date stays — a recorded wording change with no
lesson removed, its body hash updated by `node tools/rule-bodies.mjs --update typescript.doctrine` in that commit,
listed in the pull request as wording. E1.S4 then records the anonymised block's hash, and E4.S2 moves § 1 to
`typescript/boundaries.md` in one commit, byte for byte equal to it.

**The C# Definition of Done is gated, so `gpu --file src/x.cs` stays one read** (§ 16, finding 1): the R3 checklist
for the C# doctrine lives in `csharp/definition-of-done.md` (id `csharp.definition-of-done`, paths
`**/*.cs`, `**/*.razor`, `**/*.csproj`, `path_tasks: ["implement","test","audit","release","policy"]`) — the tasks at
whose completion a checklist is read, never `gpu`, `ui`, `storage` or `inspect`. Its TypeScript mirror is
`typescript/definition-of-done.md` with the same gate, holding the design section's checklist (§ 0), so the two boxes
have the same scope kind (equal strength (a)); the doctrine's existing § 2 box stays in the doctrine, as its section
does. `csharp/doctrine.md` therefore grows by the `Nullable enable` line only (≈ 20 B).

**Placeholder files created by a move carry valid front matter from their first commit** (plan round 1, finding 2):
`typescript/boundaries.md` and `typescript/testing.md` are created by E4.S2 with `id`, `load`, `paths`,
`path_tasks` and `depends` exactly as § 4.3 names them, holding exactly the moved text and nothing else, with their
`rule-bodies.json` entries added by hand in the same commit — so the catalog loads and `npm test` is green at every
story, and no byte is ever in flight between two commits. The same holds for every file a later move creates
(`csharp/*.md`, `rust/*.md`).

Selectors: `paths: ["**/*.ts","**/*.tsx","**/*.mts","**/*.cts","**/*.js","**/*.mjs","**/*.cjs"]`, no gate — like
`csharp/doctrine.md`. This repository's own `tools/*.mjs` then load the doctrine on an `inspect` (§ 5: 29,087 B, fits).

**`csharp/doctrine.md`** gains `Nullable enable` in § 1 (≈ 20 B). Its Definition of Done (≈ 350 B, R3) is the gated
`csharp/definition-of-done.md` above — **superseded (§ 16):** the sentence "and a Definition of Done (≈ 350 B, R3)" in
this file, which would have pushed `gpu --file src/x.cs` over one read. Nothing is removed. The reverse items by topic (consultants' point 6): `null!`/`default!` → `csharp/testing.md` beside the moved
`as`-cast section; Razor encoding → `csharp/boundaries.md`; a Definition of Done → every new rule on both sides.

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
| **Resource limits:** `tools/build-flags-check.mjs` — `Directory.Build.rsp` exists and says `-nr:false`; no `-noautorsp`; a repository with no C# passes without opinion (the measured worker-pool problem, `csharp/dotnet-build.md`) | none — P8: no measured Node counterpart | deliberately absent |
| **Compiler properties and suppressions — the .NET half of `tools/strictness-check.mjs`** (new; named `node-strictness-check.mjs` until ledger 1.1 gave it this half; it COMPLEMENTS `build-flags-check` and its hook, which enforce resource limits, and replaces neither — E3 owns it on both stacks): for every `*.csproj` outside the skip set, `dotnet msbuild <project> -getProperty:TreatWarningsAsErrors -getProperty:Nullable -getProperty:NoWarn -getProperty:WarningsNotAsErrors -m:4` must answer `true` and `enable` (the EFFECTIVE values, `Directory.Build.props` inheritance included — probed § 14), and the effective `NoWarn` and `WarningsNotAsErrors` may hold nothing the REPOSITORY added: SDK defaults are told apart two ways, both required — the effective value is compared with a clean-project baseline captured for the pinned SDK (`tools/fixtures/strictness/sdk-baseline.json`, keyed by `global.json`'s SDK; probed on 10.0.114: a clean project answers `NoWarn` `1701;1702`, `WarningsNotAsErrors` empty — § 15), and the repository's own props and csproj files are read for a `<NoWarn>` or `<WarningsNotAsErrors>` element, which is a finding wherever it sits; INCOMPLETE when projects exist and no `dotnet` SDK resolves, or the pinned SDK has no baseline; a repository with no project passes without opinion | **The TypeScript half, under ONE predicate** (ledger 1.3): `isTypeScriptRepository(dir)` = any `tsconfig*.json` outside `node_modules`, OR any `package.json` whose `dependencies`/`devDependencies` name `typescript`; the same predicate decides which files are walked and whether a missing `tsc` is INCOMPLETE. For every `tsconfig*.json` the predicate found, the compiler's own merged view (`tsc --showConfig -p <file>`, so `extends`, nested packages, excludes and overrides resolve as `tsc` resolves them) has `strict: true`, where **`tsc` is found through package resolution, never a fixed path** (plan round 1, finding 3): `createRequire(<the tsconfig's package dir>/package.json).resolve("typescript/bin/tsc")`, falling back to a walk up the parents' `node_modules/.bin` — the resolution that covers a hoisted workspace install, pnpm and yarn shims; **INCOMPLETE is reported only when no TypeScript resolves at all**, and `noEmitOnError: true` unless `noEmit: true`; the `lint` script runs eslint with `--max-warnings 0` and the config sets `reportUnusedDisableDirectives: "error"`; a `test` script that runs `node` on a `.ts` file is preceded by `tsc --noEmit`; every `package.json` with dependencies has an `.npmrc` beside it or above it saying `save-exact=true`; `--warn` first, as every check here lands ([README.md](../README.md) § *tools*); a repository the predicate calls non-TypeScript passes that half without opinion; **a TypeScript repository (by the predicate) where no `typescript` package resolves is INCOMPLETE, never green**; and `.ts` files outside any project — `.ts` present, no `tsconfig*.json`, no `typescript` dependency — are a FINDING, not INCOMPLETE and not a pass: `strictness-check: N .ts file(s) and no TypeScript project — nothing type-checks them (compiler-strictness.md)`, exit 1 (exit 0 under `--warn`), because the rule says a type-stripped run is preceded by `tsc --noEmit` and here nothing can run it. Proven on deliberately invalid fixtures: `strict` missing in a base config inherited through `extends`; `noEmitOnError` missing with emit; `--max-warnings` absent; a stripped-TS test script without `tsc --noEmit`; a caret range with no `.npmrc`; a stale `eslint-disable`; and one VALID fixture with a hoisted install — `tsc` only in the parent's `node_modules`, the `tsconfig.json` in a workspace package — which must pass, not report INCOMPLETE; the `.ts`-without-project fixture above with its exact expected line and exit code; .NET fixtures: `Directory.Build.props` omitting `Nullable` (finding); no SDK on `PATH` (INCOMPLETE); a VALID project with `TreatWarningsAsErrors=true`, `Nullable=enable` and only the SDK's default `NoWarn` (must pass); an INVALID project with the same two properties plus a repository `<NoWarn>` (must fail naming the file and the codes); an INVALID one with `<WarningsNotAsErrors>` (must fail) | check ↔ check |
| `settings/hooks/build-flags.mjs`: a `PreToolUse` hook refusing a `dotnet build` without `-m:N` | **none** — the hook exists for a measured resource problem (`csharp/dotnet-build.md` § *Measured 2026-09-11*). The candidate Node hook — refuse `npm install <pkg>` without `--save-exact` — is unnecessary once `.npmrc` carries `save-exact=true`, which is a FILE the check verifies (measured: the setting is honoured). What a Node hook would need to earn its place: a measured cost that no file can carry | deliberately absent; stated in `research/module_rules.md` |
| `dotnet build` with `TreatWarningsAsErrors` + `Nullable enable` | the composite gate `tsc --noEmit` (or with `noEmitOnError`) + lint `--max-warnings 0` + tests, named in `compiler-strictness.md` as ONE gate the CI step runs | gate ↔ gate |
| `tools/http-coverage.mjs` reads `Map*` and `.route(`; `--routes` preferred | the same tool; a Node application prints its route table for `--routes` (D10) | one tool |

**Every consumer of kind `dotnet`, `typescript` or `mixed` wires the check** as one CI step beside `build-flags-check`
([ROLLOUT.md](../ROLLOUT.md) § CI) — required, not optional: P2's equality is delivered only where both halves run
(re-review, § 15; the first revision's "a .NET-only consumer may add it for uniformity" is superseded). **The CI step
runs in ENFORCING mode** — a finding is a non-zero exit and a red build (§ 16, finding 6); `--warn` exists for E7.S1's
pre-release dry run and for nothing else, which supersedes the "`--warn` first, as every check here lands" sentence above
for this check: the dry run is where the backfill is found, before the pin moves. The `rust` kind is Q8's only remaining
subject.

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
| always core | **15,055** B (`coding-style` 2,889 + `knowledge-base` 3,564 + `security` 8,602) | ≤ 15,355 | yes (≥ 1,029 B left) | `security.md` + ≈ 40 B (P14 phrase) + ≈ 120 B (P15 pointer phrase); `coding-style.md` + ≈ 60 B (P7 pointer): ≈ 220 B, **capped at 300 B** because the core loads under `gpu` too (next rows). Nothing leaves the core |
| `inspect` (no file; the session-start hook's read) | 24,207 | ≤ 24,507 | yes | the core's ≤ 300 B |
| `inspect --file src/x.cs` | 28,820 | ≤ 29,140 | yes | `csharp/doctrine.md` + 20 B (`Nullable enable`); the core ≤ 300; the gated mechanics and the gated Definition of Done do not load on `inspect` (D3, § 4.4) |
| `inspect --file src/x.csproj` | 31,901 | ≈ 30,070 | yes | + 20 (doctrine) + ≤ 300 (core) − 2,300 (NuGet blocks moved) + 150 (pointer) |
| `inspect --file ui/a.ts` | 30,116 | ≈ 29,060 | yes | the doctrine ≈ 4,550 B after the moves (4,125 B leave; ≈ 2,850 B of design and pointers arrive, the design checklist being the gated `typescript/definition-of-done.md`); the core ≤ 300 |
| `inspect --file src/a.mjs` | 24,207 (no language rule) | ≈ 29,060 | yes | the `.js` selector |
| `inspect --file tsconfig.json` | 24,207 | ≤ 27,810 | yes | `compiler-strictness.md` ≤ 3,300 B; the core |
| `ui` (no file) | 26,420 | ≤ 26,720 | yes | the core |
| `ui --file ui/a.ts` | **32,329** (439 left) | ≈ 31,270 **+ `typescript/boundaries.md` ≈ 2,300 = ≈ 33,570** | **no — off the single-read list by D5, which is part of the approved epoch 1 baseline** | the webview trap is gated on `ui`; without `ui` in its gate the scope would fit (≈ 31,270) but the trap would not reach the task it was written for — Q3 |
| `ui --file src/x.cs` | 31,033 | ≤ 31,355 **+ `csharp/boundaries.md` (R1 gates it on `ui`) ≤ 1,400 = ≤ 32,755** | **expected to fit, but OFF the single-read list by D5** — ac798a0's D5 says "`ui` with a language file", which covers `src/x.cs` as well as `ui/a.ts`, so this row is a measurement, not a guarantee (§ 16, stories-writer point 4) | + 20 + ≤ 300 + the gated C# boundaries rule, whose allowance is therefore ≤ 1,400 B (E6 measures) |
| `ui --file src/a.mjs` | 26,420 | ≈ 33,570 | no (as `ui/a.ts`) | the same |
| `gpu --file src/x.cs` | **32,293** (475 left) | **≤ 32,613** | **yes — ≥ 155 B of headroom, and `gpu` STAYS on the single-read list** (§ 16, finding 1): the C# Definition of Done is gated away from `gpu` (§ 4.4), so only `Nullable enable` (20 B) and the core's capped ≤ 300 B load here. The first revision's "≈ 32,660, by ≈ 105 B, measured before the DoD lands" and the earlier "32,883 with the DoD and ≈ 220 B of core" are superseded by this placement — no deletion, no list removal | `Nullable enable` + the core ≤ 300 B |
| `gpu --file ui/a.ts` | 33,589 (unpinned, over) | ≤ 32,680 | yes — improves, and the number now agrees with E4's allowance: `typescript/doctrine.md` ≤ 4,700 B (§ 16, stories-writer point 6; the first revision's ≤ 5,900 B contradicted this row) | the doctrine after the moves — § 2 (755 B) also goes, verbatim, to the gated `typescript/testing.md`, whose guard it names — plus the core ≤ 300 |
| `gpu --file src/a.mjs` | 27,680 (no language rule today) | ≤ 32,680 | yes, unpinned — named because E4's `.js` selector creates it (point 5) | the same doctrine allowance |
| `storage --file src/a.mjs` | 29,406 (no language rule today) | ≈ 33,300 | **no, unpinned** — the approved baseline's § 4.4 already placed `gpu`/`storage` with a `.mjs` file where those tasks stand with a `.ts` file, outside the test's list, so this is not a list removal (point 5) | the doctrine ≤ 4,700 after `utc-timestamps` loses ≈ 1,100 B |
| `inspect --file src/main.rs` | 40,743 (unpinned, over: `logging-serilog.md` selects `**/main.rs`) | ≈ 38,030 | no, unpinned — improves (point 7) | `logging-serilog.md` loses its Serilog and Rust blocks (3,012 B) to `csharp/logging.md` and `rust/logging.md`, both gated, so an `inspect` on `main.rs` reads the invariant only; the core ≤ 300; `rust/doctrine.md` unchanged (Q13 decides whether the Rust moves ride in this plan) |
| `gpu --file tsconfig.json` | 27,680 | ≤ 31,280 | yes | the compiler rule; the core |
| `storage` (no file) | 29,406 | ≈ 28,600 | yes | `utc-timestamps.md` loses ≈ 1,100 B to `csharp/` and `rust/` (verbatim moves); the core + ≤ 300 |
| `storage --file tsconfig.json` | 29,406 | ≤ 31,900 | yes | sets the compiler rule's ceiling: **≤ 3,300 B** |
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

**Does every scope fit?** Every scope the test pins today fits except `ui --file ui/a.ts`, which is off the list by D5
(part of the approved epoch 1 baseline `ac798a0`/`d986710`, so no relaxation of epoch 2). `gpu --file src/x.cs` stays
on the list at ≤ 32,613 B (the gpu number: 32,293 + 20 + ≤ 300), because the C# Definition of Done is gated away from
`gpu` and the core's additions are capped at 300 B — the two allowances E3 and E5 measure before their text lands.
Nothing is deleted anywhere and no guarantee is removed; the scopes that are over today and unpinned (`gpu`/`storage`
with a `.ts`, `storage` with a `.cs`, mixed, `package.json`) get smaller or stay as they are. The hook's session-start
read (`inspect`, no file) grows by the core's ≤ 300 B only.

**Byte allowances per epic** (E1's exit criterion): E2 ≤ 4,000 B `common/dependencies.md`, ≤ 3,500 B `npm-packages.md`,
no cap on the NuGet trim since it only moves bytes out; E3 ≤ 3,300 B `compiler-strictness.md`; E4 `typescript/doctrine.md`
**≤ 4,700 B** after the moves — intro 562 B + § 0 design ≤ 3,800 B + pointers; § 1, § 2, § 3, § 4 all moved verbatim to
gated files — so `gpu --file ui/a.ts` and `gpu --file src/a.mjs` are ≤ 32,680 B and the `.ts`/`.mjs` `inspect` scopes
stay under today's 30,116 B (the first revision's ≤ 5,900 B is superseded, § 16) and
`csharp/doctrine.md` ≤ 4,633 B (today's 4,613 + the `Nullable enable` line; the Definition of Done is gated — § 4.4);
E5 and E6 gated rules: no single-read cap, each measured and recorded; `typescript/utc-timestamps.md` ≤ 1,200 B so
`storage --file ui/a.ts` improves rather than worsens. The core: ≤ 300 B in total, **a hard cap** — it is what keeps
`gpu --file src/x.cs` at ≤ 32,613 B.

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
| `research/moved-blocks.json` | ≈ 3 KB, one entry per moved block (≈ 14), plus provenance entries | immutable historical evidence: original source hashes and lengths are never edited; a later move or edit appends a provenance entry that supersedes, never replaces, the earlier one (§ 4.3) | — |
| `research/consumers.json` | < 2 KB, one entry per consumer | edited with `README.md` § *Consumers*; the equality test refuses drift | — |
| `research/selection-matrix.json` — the pinned per-scope id lists of § 4.1 | ≈ 55 KB: 108 scopes (12 file sets × 9 tasks), 1,509 ids (the E1 stories writer's measurement, 2026-10-31) | regenerated by its tool when a selector changes; the test compares it with the catalog and refuses an unregenerated edit; grows by one file set or one task at a time | — |
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
| T8 | **The release reaches every consumer in `research/consumers.json` at once** (eight today, from the README) and reddens every open pull request's `pin-check`; a consumer's CI fails on the new check | E7 dry-runs the check and the rule set against the TypeScript and .NET consumers first (D13) and records what would fail; announces; promotes once; bumps the pinned-by repository last ([README.md](../README.md) § *Bumping a pin*) |
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
  a TypeScript repository where no `typescript` package resolves is INCOMPLETE; `.ts` files with no project are a
  finding with the exact line of § 4.6; the .NET half's five fixtures, the defaults-only VALID one and the two
  suppression INVALID ones among them), the moved-blocks manifest test (a `planned` entry: schema and source bytes only;
  an activated entry: destination bytes against `sha256` and `length`; no git history read), the
  `consumers.json` ↔ `README.md` § *Consumers* equality test, the `stronger-*` whitelist rule of the matrix test (an id
  outside `['P4']` with that status fails, with or without a reason), the `planned`-needs-an-owning-epic rule, the two
  equality tests of § 4.1 (the two sides' recorded `selectors`/`mood`/`enforcement`/`consequence`/`suppression` must
  match; the recorded fields must match the rule's real front matter, its heading's mood and the check tool's exported
  rule list), the `selection-matrix.json` regeneration test, and — at every story — the catalog loads with every
  placeholder file's front matter valid.
- `node tools/rule-bodies.mjs` in step.
- `node tools/ownership-check.mjs` passes with no baseline file.
- `node tools/plan-lifecycle.mjs` clean.
- The measurements of § 5, before and after each epic, in `research/module_rules.md`.
- The dry run (E7.S1): the new check with `--warn` and the resolver's `explain` for the representative scopes against
  every consumer in `research/consumers.json` (the `typescript` and `mixed` kinds exercise the TypeScript half, the
  `dotnet` and `mixed` kinds the .NET half, `rust` passes without opinion); findings listed in E7's record (a finding is
  information, not a consumer change this plan makes).
- One bounded smoke the way `research/module_tests.md` records them: a real session on `inspect --file ui/a.ts`,
  `implement --file ui/a.ts` (split read, `--only` per rule), `inspect --file tsconfig.json` and
  `dependencies --file package.json` reads the selected rules to their END markers.
- The per-arm record's commands (D13): `explain` for the arm's scopes with ids and hashes; the composite gate's commands
  and their exit codes; the toolchain versions — written once here, run there.

## 11. Definition of Done

- [ ] Every row of § 3 is closed as `equal` in the text of the rule it names, recorded as `deliberately-absent` with its
      reason in `research/parity-inventory.json` (the one home; `research/module_rules.md` points there and holds no
      second copy), or is one of the accepted `stronger-*` exceptions listed in the next box;
      `research/parity-matrix.json` carries the same rows, **no row is `planned`**, and its test is green.
- [ ] **The accepted `stronger-*` exceptions are exactly these**, and the permission is bounded to the rows reviewed
      and listed here: **P4** (`stronger-ts` — complexity ≤ 4 is lint-enforced in TypeScript and prose in C#, because a
      C# analyzer package is a dependency decision for every .NET consumer, Q7). The matrix test holds the same list
      (`['P4']`) and fails any other row with that status; any other `stronger-*` row is a plan change, not an exception.
- [ ] Every `equal` row records both sides' `selectors`, `mood`, `enforcement`, `consequence` and `suppression`; the
      side-to-side test and the fields-versus-reality test (front matter, heading mood, the check tool's rule list) are
      green.
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
- [ ] The always core ≤ 16,384 B with its additions ≤ 300 B; every scope in the single-read list ≤ 32,768 B, the list
      being D5's with `gpu --file src/x.cs` ON it (measured ≤ 32,613 B after E3's `Nullable enable` line and E5's core
      phrases, § 5); the before/after table is in `research/module_rules.md`.
- [ ] The TypeScript toolchain is stated as one tested combination with its read date (D7); the operator's answer to Q2
      is recorded.
- [ ] `tools/strictness-check.mjs` exists with both halves, finds `tsc` through package resolution (and passes the
      hoisted-install fixture), applies one TypeScript-repository predicate, reads the effective configuration on both
      sides (`tsc --showConfig`; `dotnet msbuild -getProperty`, `NoWarn` and `WarningsNotAsErrors` included, SDK defaults
      told apart by the baseline and the repository's own declarations), is proven on the invalid and the defaults-only
      fixtures of § 4.6, is in `README.md` § *tools* and `ROLLOUT.md` as the complement of `build-flags-check`, and the
      reason Node has a check and no hook is in `research/module_rules.md`.
- [ ] `tools/http-coverage.mjs` reads a Node route table through `--routes`; `http-contracts.md:166` says so.
- [ ] `rule-bodies.json`, `ownership-check`, `plan-lifecycle`, `npm test` green on the merged commit.
- [ ] Each of E1–E6 went through `mcp__coai__review_plan` → `mcp__coai__review_code` with every finding resolved, and its
      pull request records what the reviewers said that was not acted on; the plan's `mcp__coai__review_feature` ran once
      after E7's last epic (seven epics ≥ three).
- [ ] The dry run ran against every consumer in `research/consumers.json` and its findings are recorded before the
      promotion.
- [ ] `release` promoted once to the merged sha through `promote-release` with a `reason`; the sha is in this plan.
- [ ] Bump pull requests in every consumer of `research/consumers.json` (derived from `README.md` § *Consumers*; eight
      at the time of writing: `dew_flow_rag_qln`, `dew_flow_mcp`, `dew_flow_sidecar_rust`, `dew_flow_benchmark`,
      `dew_flow_creds_for_devs`, `dew_flow_connect_other_ais`, `wsl_care`, `dew_flow_vscode_kit`) — the pinned-by
      repository last, each with `pin-check` green after its commit; the `dotnet`, `typescript` and `mixed` kinds add
      the `strictness-check` step in ENFORCING mode — non-zero on findings — (required — P2's equality is delivered by
      the wiring; `--warn` was E7.S1's dry run only; `rust` per Q8).
- [ ] `research/consumers.json` exists, equals the README table, and every consumer count in this plan is derived
      from it; `research/moved-blocks.json` holds one entry per moved block.
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
  `ui` in the boundaries rule's gate ≈ 33,570 B; without, ≈ 31,300 B and the trap does not load for the task it was written
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
- **Q8 Does the `rust` consumer wire the strictness check?** The `dotnet`, `typescript` and `mixed` kinds wire it by § 4.6 (seven today); the question is now the `rust` kind only (one today): wire it for uniformity, since it passes without
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

## 14. PR #94 review (CodeRabbit, 2026-10-31) — six comments, the decisions, and the stop

The plan was pushed as `d986710` and opened as PR #94; CodeRabbit left six comments, all valid, accepted the same day.
Under [plan-change-control.md](../common/plan-change-control.md) a review finding accepted after approval that changes
a planned step counts on the day it is accepted, independent causes count one each even in one review round, and the
second stops the plan. Five of the six change a contract, an approach, a story or the scope; one repairs a range. So the
ledger carries entries 1.1–1.5, the state is `stopped`, and the status paragraph says so. All six edits are applied in
the stop commit as the draft the re-review starts from (step 4 of the full stop: revise the WHOLE plan against what is
known now); what the re-review itself changes is not counted. The halt forbids new code on any epic and any merge of
the plan's work until re-approval; the re-review, its consult and planning documents are allowed.

| # | Comment | Decision | Ledger |
|---|---|---|---|
| 1 | § 2's "equal strength" contradicts the matrix statuses `stronger-ts`/`stronger-cs` (P2, P4) | One contract: a stronger side is an allowed, explicit, RECORDED exception — the row carries a non-empty `reason`, and the completeness test is green for `stronger-*` only with it. Equality where cheap: **P2 is made equal** — the strictness check gains a .NET half reading the effective `TreatWarningsAsErrors` and `Nullable` through `dotnet msbuild -getProperty` (probed below), so both sides are file + check; the tool is renamed `tools/strictness-check.mjs`. P4 stays `stronger-ts` with its reason (Q7) | 1.1 |
| 2 | The byte-equality check reads a commit CI does not have (`actions/checkout` at depth 1) | The manifest, `research/moved-blocks.json` (`sha256` + `length` + source, lines, before-commit, destination), recorded once from `git show <beforeCommit>:<source>` by `tools/moved-blocks.mjs --record`; the test compares the destination against the manifest and reads no history. Chosen over `fetch-depth: 0`/a targeted fetch because it makes a test about rule text independent of the runner's network and of commits a squash merge may drop, and the manifest is reviewed in the same diff as the move. Semantics unchanged | 1.2 — the stop |
| 3 | Two criteria for "a TypeScript repository" (walking `tsconfig*.json` vs deciding INCOMPLETE) | One predicate, `isTypeScriptRepository(dir)`: any `tsconfig*.json` outside `node_modules` OR a `package.json` naming `typescript` in `dependencies`/`devDependencies`; both uses read it. New fixture: `.ts` files, no `tsconfig*.json`, no `typescript` dependency → a FINDING with the exact line `strictness-check: N .ts file(s) and no TypeScript project — nothing type-checks them (compiler-strictness.md)`, exit 1 (0 under `--warn`) — not INCOMPLETE, not a pass | 1.3 |
| 4 | P6 relies on `JSON.parse`'s reviver `context` and `JSON.rawJSON`, which TypeScript 6.0.x may not declare | **Probed, both absent in both compilers.** `typescript@6.0.3` AND `typescript@7.0.2`, `strict`, `lib: ["esnext"]`, `target: esnext`, `module: nodenext`: a reviver `(key, value, context) => …` is refused with TS2345 ("Target signature provides too few arguments. Expected 3 or more, but got 2") and TS7006 on each parameter; `JSON.rawJSON` and `JSON.isRawJSON` are TS2339 ("does not exist on type 'JSON'"); exit 2 on 6.0.3, exit 1 on 7.0.2. No compiler/lint combination the family can pin today declares them. So E4.S1 writes a minimal typed declaration, `json-lossless.d.ts` (`interface JSON { rawJSON(text: string): unknown; isRawJSON(value: unknown): boolean }` and a reviver type with the third `context: { source: string }` parameter), and a wrapper `parseLossless(text, bigIntKeys)` that is the single road in and the one site holding the cast — the typed fixture compiles under the pinned TypeScript, and a test runs it on Node 26 against `{"id":9007199254740993}` expecting `9007199254740993n` | 1.4 |
| 5 | The testing move `:12-34` includes the Rust sentence `:32-33` | Split: `common/testing.md:12-31` (1,113 B) → `csharp/testing.md`; the Rust sentence up to ".NET-specific." (115 B) → `rust/testing.md`; "Everything below applies everywhere." (37 B) stays as the invariant. Re-measured with `Buffer.byteLength`; the moves table and E1.S4's list updated | not an entry — a repaired range; the destination was already `rust/testing.md` |
| 6 | Consumer counts are typed by hand ("eight", "four TypeScript-bearing") | `research/consumers.json`, derived from `README.md:188-199` and asserted equal to it by a test (the README stays the one list); kinds `dotnet`, `typescript`, `mixed`, `rust`; "TypeScript-bearing" = `typescript` or `mixed`; the Rust repository decided explicitly (`rust`; the check passes without opinion; wires it only if Q8 says all do). § 4.1 defines it; § 10, T8, E7 and the bump list of § 11 derive from it and give today's number in parentheses | 1.5 |

**Probe for comment 1** (SDK 10.0.114, 2026-10-31, the scratch project of P6's probe): `dotnet msbuild probe.csproj
-getProperty:TreatWarningsAsErrors -getProperty:Nullable -getProperty:LangVersion -m:4` → `{"Properties":
{"TreatWarningsAsErrors":"true","Nullable":"enable","LangVersion":"14.0"}}`, exit 0 — the effective values, so a
`Directory.Build.props` that sets them is seen through the project that inherits them, which is what the .NET half reads.

## 15. Re-review revision for epoch 2 (2026-10-31, consult `58f05c75`)

Step 4 of the full stop: the whole plan revised against what is known now, after the consultant's two turns (both
verified against this text before adoption). These revisions are the baseline the next plan round approves — **not
ledger entries**. Nothing is cut; every change below adds an obligation, which is why the re-review record says
`Narrowed: no`.

| # | Revision | Where |
|---|---|---|
| R-1 | **P2's equality is delivered, not offered.** Every consumer of kind `dotnet`, `typescript` or `mixed` wires `strictness-check` as a CI step; Q8 keeps only the `rust` kind. E3 owns compiler-property and suppression enforcement on both stacks; the check COMPLEMENTS `build-flags-check` and its hook (resource limits) and replaces neither. § 4.6's first table row is split into a resource row and a compiler row | § 4.6, Q8, § 11, E3, E7 |
| R-2 | **`moved-blocks.json` is immutable historical evidence.** Original hashes and lengths are never edited; a later move or edit appends a provenance entry. Why it differs from `rule-bodies.json` (current whole body vs a historical slice); both kept; extraction and normalisation shared through `tools/lib/rule-body.mjs` | § 4.3, § 7 |
| R-3 | **E1 exits green before any destination exists** by validating `planned` matrix rows and move entries STRUCTURALLY only — schema, an existing source and range, an owning epic, the SOURCE bytes' hash; the destination's `id`/`section` and bytes are checked by the owning epic when it lands the move (live destination-byte validation deferred, not only reference existence). § 11 requires zero `planned` items | § 4.1, E1.S3–S4, E2–E6 done-when, § 11 |
| R-4 | **The suppression check.** The .NET half also reads the effective `NoWarn` and `WarningsNotAsErrors`; a repository-added entry is a finding. SDK defaults are told apart two ways, both required: a clean-project baseline captured per pinned SDK, and the repository's own props/csproj declarations. Fixtures: VALID defaults-only (must pass); INVALID with a repository `<NoWarn>` beside `TreatWarningsAsErrors=true` and `Nullable=enable` (must fail); INVALID with `<WarningsNotAsErrors>` (must fail) | § 3.4, § 4.6, § 10, § 11, E3.S2 |
| R-5 | E4 depends on E3 as well as E1, matching *Order, and why* | E4 |
| R-6 | § 11 enumerates the accepted `stronger-*` exceptions — today only P4 with Q7's reason — and bounds the permission to the rows listed; any other `stronger-*` row is a plan change | § 11 |

## 16. Epoch 2 review round (2026-10-31, the interim path) — six findings, the baseline, and the resume

`mcp__coai__review_document` over `e055974` with the plan as `documentPath` (the interim path of
[plan-change-control.md](../common/plan-change-control.md) § *Reviewing the revised plan*): verdict **`proceed`**, six
findings, all accepted and applied as the re-review baseline — not entries. Step 8 of the full stop then resumed the
plan: epoch 1 `closed`, epoch 2 `open` at 0 changes, `Narrowed: no` judged against the gate-approved baseline
`ac798a0` with its in-round findings `d986710`.

| # | Finding | What changed |
|---|---|---|
| 1 | `gpu --file src/x.cs` would reach ≈ 32,883 B (32,293 + 370 + ≈ 220) — over one read; taking `gpu` off the list would narrow a merge guarantee | The C# Definition of Done moves to the gated `csharp/definition-of-done.md` (`path_tasks` implement, test, audit, release, policy — never `gpu`), mirrored by `typescript/definition-of-done.md` with the same gate; the core's additions are capped at 300 B. **The gpu number: 32,293 + 20 + ≤ 300 = ≤ 32,613 B**, ≥ 155 B of headroom, `gpu` stays on the list (§ 4.4, § 5) |
| 2 | The matrix test must enforce an exception whitelist, not accept any `stronger-*` with a reason | The test holds `['P4']`; any other row with `stronger-ts`/`stronger-cs` fails, with or without a reason (§ 2, § 4.1, § 10, § 11, E1.S3) |
| 3 | The anonymisation must precede E1's recording of `moved-blocks.json`, or the recorded hash is the un-anonymised text | E1.S0 — the wording-only anonymisation of `typescript/doctrine.md` § 1 as its own commit with `rule-bodies.mjs --update`, before E1.S4 records; E4.S2 becomes one commit, byte-equal to the recorded hash (§ 4.3, § 4.4, E1, E4) |
| 4 | `Narrowed:` must be judged against the approved baseline, not the stop commit; D5 is already in it | The re-review line names `ac798a0` + `d986710`, D5 as part of that baseline, and the guarantees kept; one line |
| 5 | Equality must be checkable: every `equal` row records both sides' selectors, mood, enforcement class, consequence and suppression, with a side-to-side test and a fields-versus-reality test | § 4.1, § 10, § 11, E1.S3: the five per-side fields; the first test compares the sides; the second checks the recorded selectors against the rule's front matter, the mood against the heading, and `check: strictness-check` against that tool's exported rule list (a `hook` against `settings/hooks/`) |
| 6 | Consumer CI must enforce; `--warn` is for the dry run only | § 4.6, § 11, E7.S4: the CI step runs in enforcing mode (non-zero on findings); `--warn` only in E7.S1 |

**The E1 stories writer's nine points** (`feat/rule-parity-e1`, read against this text, 2026-10-31), folded into the
same baseline:

| # | Point | What changed |
|---|---|---|
| 1 | Moved-block history: the stories document chose `fetch-depth: 0` | Not adopted: E1.S4 says CI stays at `fetch-depth: 1` and `research/moved-blocks.json` is the evidence |
| 2 | The pinned selection lists live in `research/selection-matrix.json` (≈ 55 KB, 108 scopes, 1,509 ids) | § 7's growth table gains the row |
| 3 | § 3.3's last row is not a both-sides gap | Rewritten as P1's TypeScript side; the gaps are the five rows above it |
| 4 | D5 removes "`ui` with a language file", yet § 5 kept `ui --file src/x.cs` in one read without `csharp/boundaries.md` | One statement: `ui --file src/x.cs` is OFF the list by ac798a0's D5 (it already said "a language file"), and measured at ≤ 32,755 B with the gated C# boundaries rule ≤ 1,400 B — expected to fit, not guaranteed; no narrowing beyond the baseline |
| 5 | `storage --file src/a.mjs` ≈ 34,300 B and `gpu --file src/a.mjs` were unnamed | Both rows added: `gpu` ≤ 32,680 B (fits, unpinned); `storage` ≈ 33,300 B (over, unpinned — the approved § 4.4 already placed the `.mjs` scopes of those tasks outside the list, so no list removal) |
| 6 | E4's ≤ 5,900 B contradicts `gpu --file ui/a.ts` ≈ 32,580 | Allowance ≤ 4,700 B by placement, not by cutting: § 2 (755 B) also moves verbatim to the gated `typescript/testing.md`; the row now reads ≤ 32,680 B |
| 7 | No Rust row in § 5 | `inspect --file src/main.rs` 40,743 → ≈ 38,030 B (unpinned; the Serilog and Rust logging blocks leave the common rule), Q13 named |
| 8 | P6's C# half had no story | E4.S5: the large-identifier mirror with the `System.Text.Json` facts (`long` exact, `double`/`GetDouble` lossy, `decimal` exact, the case-sensitive default's silent 0) — placed in the gated `csharp/boundaries.md`, NOT in `csharp/doctrine.md` § 4a, because that file loads under `gpu` (finding 1); the TypeScript half's large-identifier text goes to `typescript/boundaries.md` likewise, with § 0 keeping a one-line pointer, so both sides have the same scope kind. The `output-encoding` pair is renamed `boundaries` (input parsing and output encoding are the two faces of one road) |
| 9 | Two homes for deliberately-absent reasons | One: `research/parity-inventory.json`; `research/module_rules.md` points there (§ 3.3, § 11) |

`npm test` on the owner's machine showed six janitor failures (S4-23, 34, 35, 37, 38, 46) on `d986710` with nothing
changed; they do not come from this plan and are investigated separately.

**Probe for R-4** (SDK 10.0.114, 2026-10-31, the same scratch project): a clean project with no `NoWarn` anywhere
answers `dotnet msbuild probe.csproj -getProperty:NoWarn -getProperty:WarningsNotAsErrors -m:4` →
`"NoWarn": "1701;1702"`, `"WarningsNotAsErrors": ""` — the SDK's own defaults, which is why a raw non-empty `NoWarn`
cannot be the finding. With a `Directory.Build.props` carrying `<NoWarn>CS1591;$(NoWarn)</NoWarn>` and
`<WarningsNotAsErrors>CS8600</WarningsNotAsErrors>` the same call answers `"NoWarn": "CS1591;"`,
`"WarningsNotAsErrors": "CS8600"` (note: the SDK's `1701;1702` did NOT survive the override — the effective value is
what the repository wrote, so comparing against the clean baseline shows the difference in both directions). Both
readings exit 0.

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
- **Stories:** S0 the preparatory wording-only anonymisation of `typescript/doctrine.md` § 1 (§ 4.4) — its own commit,
  `rule-bodies.mjs --update typescript.doctrine`, listed as wording with no lesson removed, BEFORE S4 records a hash
  (§ 16, finding 3) · S1 the gate key: semantics, errors, `reasons`, tests · S2 the selection/budget matrix of § 4.1
  measured and recorded, with the per-scope id-list tests · S3 `parity-matrix.json` with every P/R row and its test
  against the catalog and the recorded sections — the `stronger-*` whitelist `['P4']` (any other such row fails, reason
  or not), the per-side `selectors`/`mood`/`enforcement`/`consequence`/`suppression` fields on every `equal` row with
  the side-to-side test and the fields-versus-reality test (front matter, heading mood, the check tool's exported rule
  list; § 16, findings 2 and 5) — and `parity-inventory.json` with the one-to-one test (an orphan on either side is
  red — observed, then fixed; a `planned` row is validated structurally — schema, an existing source, an owning epic
  among E2–E6 — and its destination `id`/`section` only once its epic activates it, § 4.1), and `consumers.json` with
  its equality test against `README.md` § *Consumers* ·
  S4 the moved-block byte-equality test and its manifest (a `planned` entry: schema and SOURCE bytes only; the
  destination's bytes when the owning epic lands the move): `tools/moved-blocks.mjs --record <source> <from>-<to>
  <commit>` reads the block with `git show` at the commit RIGHT BEFORE the move and writes `sha256`, `length`, source,
  lines, commit and destination into `research/moved-blocks.json`; the test compares each destination's bytes with the
  manifest and reads no history — **CI stays at `actions/checkout`'s `fetch-depth: 1`; the manifest is the evidence,
  and a `fetch-depth: 0` is not adopted** (§ 16, stories-writer point 1); the recording happens AFTER S0, so the `typescript/doctrine.md`
  § 1 entry hashes the anonymised text and a move folded into a wording change is a red test; the first entries are the
  blocks of § 4.3 as re-measured (testing `:12-31` 1,113 B and the 115 B Rust sentence among them) · S5 the byte
  allowances of § 5 written into `module_rules.md` and the single-read list of D5 (with `gpu --file src/x.cs` on it).
- **Depends on:** nothing. **Done when:** `npm test` green with the new tests; the matrix test is red when an ACTIVATED
  row names a missing id or section, and when a `planned` row names no owning epic (both observed, then fixed); every
  `planned` row and move entry passes its structural check with its source bytes recorded; every tight scope's headroom
  is in `module_rules.md`; one pull request through both gates.

### E2 — Dependency policy (parallel after E1)

- **Goal:** P9 and § 3.3's dependency rows; D14.
- **Scope:** `common/dependencies.md` (new), `csharp/nuget-packages.md` (blocks moved out, paths only),
  `typescript/npm-packages.md` (new), the manifest, the selection tests.
- **Stories:** S1 the shared rule (moved blocks verbatim; the scan and the lock sentence added) · S2 the NuGet rule after
  the move, with the pointer and the coupled-version exceptions kept · S3 the npm rule: declared range, lock resolution,
  reproducible install, each with its probe line · S4 selection tests, manifest entries, the `inspect --file src/x.csproj`
  measurement.
- **Depends on:** E1. **Done when:** `dependencies --file package.json` selects `common.dependencies` and
  `typescript.npm-packages` and not `csharp.nuget-packages`; E2's matrix rows and move entries are activated (no longer
  `planned`) and the byte-equality test passes for the four moved blocks against their recorded source hashes; one pull
  request through both gates.

### E3 — Compiler/lint enforcement contract (cornerstone area 1)

- **Goal:** P2–P4, § 3.4, D7, D8; `Nullable enable` for C# in the same epic. **E3 owns compiler-property and
  suppression enforcement on both stacks** (R-1, R-4): the check COMPLEMENTS `build-flags-check` and its hook, which
  enforce resource limits, and replaces neither.
- **Scope:** `typescript/compiler-strictness.md` (new, ≤ 3,300 B), `csharp/doctrine.md` § 1 (+ `Nullable enable`, the
  only growth of that file — measured against the `gpu` row of § 5),
  `tools/strictness-check.mjs` (both halves) + tests + fixtures, `README.md` § *tools*, `ROLLOUT.md`.
- **Stories:** S1 the rule text: the composite gate, the toolchain as one combination with its read date, the
  suppression policy (**cornerstone**) · S2 the check, both halves: the one TypeScript-repository predicate; `tsc`
  resolved through `createRequire(...).resolve("typescript/bin/tsc")` or a walk up the parents' `node_modules/.bin`;
  effective configuration via `tsc --showConfig`; the .NET half via `dotnet msbuild -getProperty:TreatWarningsAsErrors
  -getProperty:Nullable -getProperty:NoWarn -getProperty:WarningsNotAsErrors -m:4` per project, with the SDK baseline
  file and the props/csproj declaration read (R-4); the six invalid TypeScript fixtures, the hoisted-install fixture that
  must pass, the `.ts`-without-project fixture with its exact expected line and exit, the five .NET fixtures (the
  defaults-only VALID one, the two suppression INVALID ones among them); INCOMPLETE only when the predicate says
  TypeScript and nothing resolves, or projects exist and no SDK (or no baseline for the pinned SDK) resolves; `--warn` ·
  S3 the C# § 1 line and the `gpu --file src/x.cs` measurement ·
  S4 the documents and the dry-run command for E7.
- **Depends on:** E1. **Done when:** each invalid fixture fails naming the file and the defaults-only .NET fixture
  passes; a grep-only check is shown insufficient by a fixture whose `strict` sits in an `extends` base; `storage --file
  tsconfig.json` ≤ 32,768 B; E3's matrix rows are activated; one pull request through both gates.

### E4 — TypeScript design doctrine parity (cornerstone area 2)

- **Goal:** D4, P1, P5–P7, R3 (as two gated Definition-of-Done rules, § 4.4); the doctrine becomes the mirror of
  `csharp/doctrine.md` § 1–§ 7 by meaning.
- **Scope:** `typescript/doctrine.md` (§ 0 added; § 1, § 3, § 4 moved out verbatim to the E5/E6 files, which this epic
  creates as placeholders holding exactly the moved text so no byte is in flight), `csharp/definition-of-done.md` and
  `typescript/definition-of-done.md` (the two gated checklists, § 4.4 — the C# one NOT in `csharp/doctrine.md`, so
  `gpu --file src/x.cs` stays one read), `common/coding-style.md:32`, the selectors (`.js/.mjs/.cjs`).
- **Stories:** S1 § 0: readonly contracts, branded domain types with parsing factories, discriminated outcome and absence
  states, boundary validation of untrusted JSON, pure functions and immutability, complexity ≤ 4 — each paragraph naming
  the C# section it mirrors and the anonymised precedents (one consumer's readonly outcome type separating refusal,
  timeout and mechanism failure; two consumers' complexity 4), including the large-identifier paragraph of P6 with
  its two measured readers and the typed fixture of § 14 item 4 — `json-lossless.d.ts` declaring the reviver's
  `context` and `JSON.rawJSON`/`isRawJSON`, a `parseLossless` wrapper as the single road in, compiled under the pinned
  TypeScript and run on Node 26 against `{"id":9007199254740993}` (**cornerstone**) · S2 ONE commit: the moves of
  § 1 (already anonymised by E1.S0), § 3, § 4 with their DoD boxes into `typescript/boundaries.md` and
  `typescript/testing.md`, each created with its full front matter (`id`, `load`, `paths`, `path_tasks`, `depends`) and
  its manifest entry, byte-equal to the hashes E1.S4 recorded (the first revision's two-commit shape (a)+(b) is
  superseded by § 16, finding 3: (a) is now E1.S0) · S3 the two gated Definition-of-Done rules (`csharp/definition-of-done.md`,
  `typescript/definition-of-done.md`, § 4.4) and the `gpu --file src/x.cs` measurement, expected ≤ 32,613 B · S4 the
  selectors and the pinned scopes, `gpu --file ui/a.ts` ≤ 32,680 B among them · S5 P6's two halves in the gated
  boundaries pair (§ 16, stories-writer point 8): `csharp/boundaries.md` — the large-identifier mirror with the
  `System.Text.Json` probe facts (`long` exact, `double` and `GetDouble()` lossy, `decimal` exact, `2^63` a
  `JsonException`, the case-sensitive default binding `Id` to 0 with no error) and `typescript/boundaries.md` — strings
  on the wire or the lossless reviver, with § 0 keeping one pointer line.
- **Depends on:** E1, E3 (the strictness line § 0 carries points at E3's rule — R-5). **Done when:** `inspect --file
  ui/a.ts` and `inspect --file src/a.mjs` ≤ 30,116 B; the matrix rows P5–P7 are activated and point at § 0's sections;
  the three move entries are activated and the byte-equality test is green against the source hashes E1.S4 recorded
  after E1.S0; `gpu --file src/x.cs` ≤ 32,768 B with the Definition of Done gated; the catalog loaded and `npm test` was
  green after the commit; the ownership check finds no name; one pull request through both gates.

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
  always core ≤ 16,384 B; the common rule still states the invariant and the pointer; E5's matrix rows and move entries
  are activated and byte-equal; one pull request through both gates.

### E6 — Application contracts, with their C# and Rust counterparts

- **Goal:** P10–P12, P14, P16–P19, R1, R2, R4, R5; D6, D10, D11.
- **Scope:** `typescript/testing.md`, `typescript/logging.md`, `typescript/utc-timestamps.md`,
  `typescript/boundaries.md` (new, gated); `csharp/testing.md`, `csharp/logging.md`, `csharp/utc-timestamps.md`,
  `csharp/boundaries.md` (new, gated; the moved blocks plus the reverse items); `rust/testing.md`, `rust/logging.md`,
  `rust/utc-timestamps.md` (the moved Rust sections; `rust/doctrine.md` § 9's pointer updated); the invariant and
  pointer lines in `common/testing.md`, `logging-serilog.md`, `utc-timestamps.md`; the rows and phrases of D6 in
  `http-contracts.md`, `platform-limits.md`, `post-deploy-checks.md`, `security.md:18`; `tools/http-coverage.mjs`'s
  `--routes` documentation and test for a Node table; `http-contracts.md:166`.
- **Stories:** S1 the testing pair (runner sections, import-graph test, typed-fixture discipline side by side, the neutral
  DoD box) · S2 the logging pair (pino shape measured against the path contract; the Serilog blocks moved) · S3 the clock
  pair and the Rust clock file (`storage` measured) · S4 the boundaries pair — output encoding (the webview escape module anonymised;
  Razor's `MarkupString`/`Html.Raw`) · S5 the one-line additions of D6 and the route-table path of D10 with its test ·
  S6 the Rust files and `rust/doctrine.md`'s pointer (Q13).
- **Depends on:** E1, E4, E5. **Done when:** every moved block of E6 is activated and byte-equal; every Node sentence
  traces to a probe line or a cited document; `storage` (no file) ≤ 32,768 B; after E6 no matrix row and no move entry
  is `planned`; one pull request through both gates.

### E7 — Dry run, release, consumer adoption, the per-arm record

- **Goal:** the rules reach the consumers and the experiment without a red build nobody expected (D13).
- **Scope:** the dry run over every consumer in `research/consumers.json` (eight today); `promote-release` with a
  `reason`; bump pull requests (pinned-by last); the per-arm record's commands handed to the other plan; this plan's
  promotion.
- **Stories:** S1 the dry run: the new check with `--warn` and `explain` for the representative scopes against each
  consumer's checkout, findings recorded · S2 `mcp__coai__review_feature` over the seven epics · S3 the promotion
  (`README.md:100-122`) and the `release-distance` read · S4 the bumps, each with `pin-check` green after its commit, the
  `dotnet`, `typescript` and `mixed` kinds adding the `strictness-check` step in ENFORCING mode — non-zero on findings, no
  `--warn` (R-1; § 16, finding 6 — the dry run of S1 is the only `--warn` run, and its findings are fixed or recorded
  before the bump) · S5 the sha and the per-arm record commands handed to the
  experiment's E0.S3 and confirmed equal · S6 this plan promoted with deviations.
- **Depends on:** E1–E6 merged. **Done when:** every box of § 11 is ticked.

### Order, and why

E1 first because every text needs a place, a gate and an allowance before it is written, and because its tests are what
make D1's "moves keep the text" checkable. E2 in parallel because its placement is settled by E1 alone. E3 before E4
because the gate is what the design doctrine's strictness line points at. E4 before E5 and E6 because the doctrine's § 0
is the index the gated rules are reached from, and because its moves create the files E5 and E6 fill. E7 last, once,
with the dry run before the promotion.
