# PLAN — C#/Node rule parity: every C# requirement has a Node/TypeScript counterpart of equal strength, and the reverse

> Status: **plan only, nothing implemented yet; epoch 4 open with one change (4.1), 2026-10-31 — epoch 3 closed at its second
> change (the cadence consult for epics 1–3, entries 3.2–3.4, § 19) after its one allowed change (3.1); the re-review
> revised the whole plan (§ 19, consults `69c2eb3f`, `354b1a67`), its plan round returned `proceed` and the second full
> reading by the document gate returned `proceed` with all four reviewers (§ 20); epoch 2 had closed at its own second
> change (§ 17) and epoch 1 at its own (§ 14); revised the same day after the question consultants, consult `ce61c905`,
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
> six findings accepted as baseline) is § 16; epoch 2 closed at its second change (§ 17); epoch 3 closed at its second
> change after 3.1, its re-review is § 19–§ 20 and epoch 4 is open with one change (4.1); the owner's approval is still to
> come.
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

> Epoch 2 · approved 2026-10-31 · by reviewers · state: closed

- 2.1 · 2026-10-31 · agent · contract — E1 stories O1: G2 (the lock file) had no admissible status; the question consultants (consult `1f4d8688`, the owner away) and the team lead put G2 on the exception whitelist as `stronger-ts` with its reason; Q1 closed, for the owner to confirm 2026-11-01
- 2.2 · 2026-10-31 · agent · contract — E1 stories O3: T11 ("every gate equals its source rule's `tasks:` line") cannot hold for the four planned gated files that have no source rule
  (This second change stopped the plan. The four entries below were found in the same stories document and are
  recorded one per cause, as the rule asks; O2 and O8–O12 of that document are repaired references and fixes that only
  satisfy the plan as written, not entries. The re-review's revision for epoch 3 is § 17.)
- 2.3 · 2026-10-31 · agent · contract — E1 stories O4: the doctrine rows P1, P5, P7 and P20 cannot be `equal` under § 2 (a) while `csharp/doctrine.md` also selects `.csproj` and the TypeScript doctrine selects source files only
- 2.4 · 2026-10-31 · agent · approach — E1 stories O5: four § 4.3 moves were not exact line ranges (reliability's sentences, the .NET text of `utc-timestamps`, the NuGet `:39-47` split inside a code fence), so E1 could not record them
- 2.5 · 2026-10-31 · agent · contract — E1 stories O6: whether `MANDATORY` is read from the section's own heading only or inherited from an ancestor heading (P13's C# section carries none of its own)
- 2.6 · 2026-10-31 · agent · contract — E1 stories O7: "the list of D5 and the new config scopes" named no exact single-read list; six scopes that fit today were unpinned without a reason

### Re-review for epoch 3

Narrowed: no — judged against the epoch 2 baseline `400d878` + `01d1bbf`: G2 is RAISED on the .NET side to a committed lock and a locked-mode restore (option A, consult `e1c58f6d`), so the whitelist stays exactly the baseline's `['P4']` and nothing is admitted against it; the gate test keeps every assertion and gains the provenance rule, declared gates with reasons and pinned positive/negative cases; the doctrine gains a selector; the moves become exact whole-line ranges with every word staying in place (a whitespace-only split, D1-checked); the single-read list gains six pins and drops none; no guarantee, scope, Definition-of-Done box or merge condition of epoch 2 is removed (§ 17)

| Work | Where | Verdict | Action |
|---|---|---|---|
| The E1 stories document (planning work, not on main; nothing was built) | `feat/rule-parity-e1`, `72aaf8c` | fits | kept — to be reconciled with the epoch 3 revision (§ 17: E1.S0b, the provenance gates, the normalised equality, the exact ranges, the fixtures) when E1 starts; judged by the team lead as the Opus judge, 2026-10-31 |

> Epoch 3 · approved 2026-10-31 · by reviewers · state: closed

- 3.1 · 2026-10-31 · agent · contract — E1 stories O1: `typescript/testing.md`'s gate had no form the provenance rule accepts (its first text is doctrine § 2–§ 4, whose source has no `tasks:` line, so it would mirror as "no gate"); approved as the fifth declared gate, `implement, test, audit, policy, release` — the trap texts are test-and-fixture discipline that loads where tests are written or reviewed, and the gate preserves § 5's `.ts` budgets
- 3.2 · 2026-10-31 · agent · contract — cadence consult `69c2eb3f`: the equality model cannot express a requirement that lives in different rule locations per side; P2, P3 and P4's C# side is `csharp/doctrine.md` (`.cs/.razor/.csproj`) and their TypeScript side is `typescript.compiler-strictness` (`tsconfig*.json`), so the normalised-selection test that compares source-file sets can never pass the real rows
  (This second change stopped the plan. The two entries below were found by the same consult and are recorded one per
  cause, as the rule asks. The re-review's revision for epoch 4 is § 19.)
- 3.3 · 2026-10-31 · agent · contract — cadence consult `69c2eb3f`: E3's applicability predicate (a TypeScript project or dependency) skips exactly the plain-JavaScript repository whose lint subset § 4.4 promises — `package.json` + `src/app.mjs` with `console.log`, no `tsconfig`, no TypeScript dependency, no lint script passes without a finding
- 3.4 · 2026-10-31 · agent · epics — cadence consult `69c2eb3f`: E1 front-loads work E2 and E3 do not need — recording every E4–E6 move, their gate provenance, the consumer inventory and the lock fixtures E2 owns

### Re-review for epoch 4

Narrowed: no — judged against the epoch 3 baseline `2ee02c4` + 3.1: every guarantee stays and only the form changes — a requirement may name a SET of delivery locations per side and equality compares the union of their selection behaviour (the configuration kind still apart), a wider test, not a weaker one; E3 gains a second applicability predicate and the plain-JavaScript lint floor becomes a row with its symmetric C# finding; E1 keeps every contract and its fixtures, INCLUDING the two lock fixtures green at E1's exit as the baseline required, and records a baseline hash for every planned move range, while only the destination entries, the gate declarations and the consumer inventory move to the epics that land them; `moved-blocks.json` stays append-only with the superseding procedure defined and an independently justified source change required; no pin, cap, Definition-of-Done box, merge condition or DoD TIMING condition is relaxed (§ 19)

| Work | Where | Verdict | Action |
|---|---|---|---|
| The E1 stories document (planning work, not on main; nothing was built) | `feat/rule-parity-e1`, `3b7d7db` | fits | kept as the input to E1; to be rewritten to the slimmed E1 of § 19 (the baseline hashes, the real-row proof, the lock fixtures kept) when E1 starts — judged by the team lead as the Opus judge, 2026-10-31 |

> Epoch 4 · approved 2026-10-31 · by reviewers · state: open

- 4.1 · 2026-10-31 · agent · contract — Opus review of E1: an activation record matched the moved block at FIXED `destinationLines`, so any later edit above the block in its destination file (E4 lands `typescript/testing.md`, E6 edits it) would turn the checker permanently red with no recovery path, entries being immutable; an activation now matches by CONTENT — the block's exact bytes (`sha256`, `length`) found in the destination file anywhere, exactly once — and `destinationLines` is recorded for information only

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
task is not equal; **"the same kind of scope" is defined** (§ 17, O4) as *selected by the stack's SOURCE files plus the
stack's PROJECT MANIFEST, gated alike where gated*: `**/*.cs`, `**/*.razor` + `**/*.csproj` on one side, the
`.ts/.tsx/.mts/.cts/.js/.mjs/.cjs` set + `**/package.json` on the other; a compiler-configuration file
(`tsconfig*.json`, `Directory.Build.props`) is a kind of its own and is compared with its own counterpart, never with a
source-file selector; (b) they have the same mood — MANDATORY against MANDATORY, a Definition of Done box against a box;
(c) they have the same enforcement class — a file a check verifies, a command a hook refuses, or prose alone; (d) the
consequence is the same — a warning that fails the build on one side fails it on the other; and (e) **the exemption
policy is the same** — what may be suppressed, where (inline only, naming the rule and the reason), and that no baseline
of accepted violations exists. The matrix carries (c) and (e) as columns.

**A stronger side is allowed only as a recorded exception** (PR #94 review, comment 1 — ledger 1.1; tightened by the
epoch 2 review, § 16): a matrix row whose `status` is `stronger-ts` or `stronger-cs` carries a non-empty `reason`
naming what the weaker side would need and why it is not taken now, AND its id is in the explicit whitelist the matrix
test holds (today `['P4']`, § 11 — ledger 2.1 had put G2 there; the epoch 3 re-review reversed that and made G2
`equal`, § 17); any other row with that status fails the suite, with or without a reason, so a new exception is a
reviewed edit of the test and of § 11, never a field in a JSON file. Equality is preferred where it is cheap: P2 is made equal by giving the strictness check a .NET half (§ 4.6); P4
stays `stronger-ts` with its reason (an analyzer package is a dependency decision for every .NET consumer — Q7).

## 3. The parity table

Direction `C# → Node` first, then `TS → C#`, then the gaps on both sides, then suppression. *Where* names the file that
will carry each side after this plan under D2; *strength* is the class of § 2. The same rows, with rule ids and section
headings, are the content of `research/parity-matrix.json` (E1).

### 3.1 C# requirements → Node/TypeScript counterparts

| # | C# requirement (where today → where after) | Node/TypeScript counterpart (where after) | Strength |
|---|---|---|---|
| P1 | ".NET 10, latest C#" (`csharp/doctrine.md:10`, stays) | the toolchain line of D7 in `typescript/doctrine.md` § 0 and `typescript/compiler-strictness.md` | prose, on every language file — equal |
| P2 | `TreatWarningsAsErrors` (`:10`, stays) | `"strict": true`, `"noEmitOnError": true` wherever `tsc` emits, lint at `--max-warnings 0`, `tsc --noEmit` before a type-stripped run — `typescript/compiler-strictness.md`, selected by `**/tsconfig*.json`; the one-line statement also in the doctrine so a `.ts` scope sees it — **landed by E3** (§ 19: a minimal source-file statement in `typescript/doctrine.md`, ≤ 250 B, which E4's § 0 later absorbs), so E3's activation of this row holds against the post-E3 catalog. **The TypeScript DELIVERY set is therefore {`typescript/doctrine.md` (the statement), `typescript/compiler-strictness.md`}, the C# set {`csharp/doctrine.md` § 1}; the enforcement evidence — the check's two halves — is recorded apart from delivery** (§ 4.1, ledger 3.2) | file + CI check on BOTH sides (`tools/strictness-check.mjs`, § 4.6): its .NET half reads the EFFECTIVE `TreatWarningsAsErrors` and `Nullable` of every project with `dotnet msbuild <project> -getProperty:TreatWarningsAsErrors -getProperty:Nullable -m:4` (probed 2026-10-31, SDK 10.0.114: `"true"`, `"enable"`, `LangVersion` `"14.0"` — inherited props resolved as MSBuild resolves them), INCOMPLETE when no SDK resolves; status `equal`. **Superseded (ledger 1.1):** the first revision's "stronger than C#, which has prose only; MSBuild already fails the build once the property is set" — true of the build, but nothing checked that the property WAS set |
| P3 | `Nullable enable` — absent from the rule, present in every consumer | `strictNullChecks` (inside `strict`) — the same rule | raised on **both**: `csharp/doctrine.md` § 1 gains `Nullable enable` (≈ 20 B, no removal) |
| P4 | complexity ≤ 4, `private static` where no state is read (`:75-78`, stays) | the same number as a lint rule (`complexity: ["error", 4]`, `max-lines-per-function` 50, `max-lines` 800, `no-console`) — the shape two TypeScript consumers already run (read 2026-10-31) — in `compiler-strictness.md`; the suppression policy of § 3.4 | prose ↔ lint-enforced: status `stronger-ts`, reason recorded in the matrix: "a C# complexity rule needs an analyzer package the family has not adopted; a dependency decision for every .NET consumer (Q7), not a shared-rule edit" |
| P5 | records for data, typed values, no primitive obsession, no null in business logic (§ 2–4, stay) | `typescript/doctrine.md` § 0 (E4, by meaning): `readonly` data contracts and `Readonly<T>`/`ReadonlyArray<T>` in public shapes; validated or branded domain types (`type CommitSha = string & { readonly __brand: … }` with a parsing factory returning a result, never a throwing constructor); `undefined`/`null` only at the edges, absence as a typed state ("not captured" and "empty" are different facts) | prose ↔ prose; cites, anonymised, one consumer's readonly outcome type that separates refusal, timeout and mechanism failure. **Plain JavaScript** (§ 18, finding 5): `.js/.mjs/.cjs` inside a TypeScript project are type-checked (`allowJs` + `checkJs` under `strict`, JSDoc types — the compiler enforces it, so the typed doctrine applies and the row is `equal` there); in a repository with NO TypeScript project the typed parts (branded types, typed results) are `deliberately-absent` with the reason in the inventory ("nothing checks a type there"), and the enforceable subset stated in § 0's JavaScript paragraph applies — `Object.freeze` at the boundary, Result objects, validation at the boundary, complexity ≤ 4 and `no-console` by lint — enforced by the check's lint half |
| P6 | § 4a a DTO field the client omitted is `null` (stays); the gated `csharp/boundaries.md` **gains** (not § 4a itself — that file loads under `gpu`, § 16) the large-identifier mirror: `System.Text.Json` reads a `long` exactly and a `double` target or `JsonElement.GetDouble()` loses precision (measured: `{"id":9007199254740993}` → `long` 9007199254740993, `double` 9007199254740992, `GetInt64` exact, `GetDouble` …992, `GetRawText` exact, `decimal` exact; `2^63` into `long` throws `JsonException`); and the casing trap the same probe met: the default binder is case-sensitive, so `Id` against `"id"` bound to **0 with no error** — § 4a's silent default, in another door | § 0: a `JSON.parse` result is `any` and a declared type is a promise the parser never checked; validate at the single road in (a schema or a typed parser). **Identifiers that can exceed 2^53 travel as JSON strings, or are parsed losslessly before any conversion to `Number`**: `JSON.parse` rounds `{"id":9007199254740993}` to `9007199254740992` (measured); the lossless option exists on Node 26 — the reviver's third argument carries the source text (`JSON.parse(text, (k, v, context) => … BigInt(context.source))` → `9007199254740993n`, measured), and `JSON.rawJSON` writes such a value back unquoted (measured) while `JSON.stringify` of a bare `BigInt` throws `TypeError` (measured) | prose ↔ prose; both sides name the exact and the lossy readers |
| P7 | `Outcome<T>`, never `throw` for control flow (§ 5, stays) | § 0: a discriminated union result (`Result<T, E>`), `throw` only for the unexpected, one outcome shape per repository; `coding-style.md:32` points at BOTH doctrines | prose ↔ prose |
| P8 | `dotnet-build.md`: the worker pool, hook + check | **No Node counterpart.** The rule exists for a measured resource problem (72 MSBuild workers, 10 775 MB) that Node builds do not have; a hook is added for a measurement, not for symmetry (§ 4.6). Node's enforced rule is P2's check instead | deliberately absent; stated in `research/module_rules.md` |
| P9 | `nuget-packages.md`: central pins; publisher/freshness; licence before version; monthly bump; zero-reference projects | `typescript/npm-packages.md` (§ 4.5, D14): the declared range (`save-exact=true` in `.npmrc`; measured: a bare `--save-dev` writes `^5.9.3`), the lock's resolution (`package-lock.json` committed), the reproducible install (`npm ci --ignore-scripts` as the only install in CI, with the narrow allow-listed exception of § 4.5 for packages that need a lifecycle script; measured: it refuses a lock that does not SATISFY `package.json`, and accepts one that does), `npm outdated` and `npm audit` on the monthly bump, `engines.node`, `node:` built-ins before a package; the neutral text moves verbatim to `common/dependencies.md` | prose ↔ prose, each selected by its own manifest; the shared part on `--task dependencies` only |
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
| P21 | the compiler is the floor under every C# file: `TreatWarningsAsErrors` + `Nullable enable` apply to any `.cs` in any project, and there is no C# file outside a project | **the plain-JavaScript floor** (§ 19, ledger 3.3): any `.js/.mjs/.cjs` under the repository outside `node_modules` is covered by a `lint` script at `--max-warnings 0` running the subset of § 0's JavaScript paragraph (`complexity: 4`, `no-console`, the boundary rules a linter can see) — the strictness check's JavaScript-lint half applies this with its own predicate, independent of any TypeScript project; the typed parts stay P5's `scopedAbsences` | floor ↔ floor, `equal` by the check, with a SYMMETRIC finding on each side (consult `354b1a67`, § 19): the .NET half reports an orphan C# file — a `.cs` outside any `.csproj` project — as a finding (fixture: only `src/a.cs`, no project → a finding), as the JavaScript-lint half reports an unlinted `.js`; and the lint half checks file COVERAGE, not only that a script exists — a JavaScript file an otherwise conforming lint configuration excludes through `ignores`/`overrides` is a finding (fixture: a conforming config whose `ignores` drops `src/app.mjs` → a finding); the negative fixture (`package.json` + `src/app.mjs` with `console.log`, no `tsconfig`, no TypeScript dependency, no lint script) produces the lint finding |
| P20 | selection: `**/*.cs`, `**/*.razor`, `**/*.csproj` select the C# doctrine; `.csproj`, `Directory.*.props`, `NuGet.Config` select the package rule; nothing is task-gated | `**/*.ts,tsx,mts,cts`, `**/*.js,mjs,cjs` **and `**/package.json`** select the TypeScript doctrine (the manifest ↔ `.csproj`); `**/tsconfig*.json` selects `compiler-strictness`; **`**/package.json` and `**/.npmrc`** select `npm-packages` (↔ `.csproj`/`Directory.*.props`/`NuGet.Config`); the mechanics rules of both languages are path-selected and task-gated alike (§ 4.2). **Symmetric through the correspondence table** (§ 18, finding 3): `dependencies --file package.json` and `dependencies --file src/x.csproj` each select the same rule KINDS — the shared dependency rule, the ecosystem's package rule, the stack's doctrine | selector ↔ selector, checked by the normalised-selection test (§ 4.1) |

### 3.2 TypeScript requirements → C# counterparts

| # | TypeScript requirement (where today → where after) | C# counterpart (where after) | Strength |
|---|---|---|---|
| R1 | § 1 `JSON.stringify` into `<script>` is a break-out; one shared escaper; a scan test (`typescript/doctrine.md:15-48`, 2,042 B) → `typescript/boundaries.md` verbatim (anonymised wording, § 4.4) | `csharp/boundaries.md`: `MarkupString` and `Html.Raw` are the same door — a value they wrap reaches the page unescaped; JSON for a `<script>` goes through ONE helper that also closes `</script>` and `<!--`; the general rule stays `security.md` § *A measure applied at SOME of its sites* | MANDATORY ↔ MANDATORY; gated on implement, test, audit, ui, http |
| R2 | § 3 an `as` cast in a fixture (`:66-79`, 932 B) → `typescript/testing.md` verbatim | `csharp/testing.md`: `null!` and `default!` in a fixture are the same promise — a typed factory with real defaults instead; adding a required member is the moment to grep for them | prose ↔ prose; typed-fixture discipline side by side |
| R3 | a Definition of Done (`:98-105`; each of the four boxes moves with its section — the § 2 box to `typescript/testing.md` with § 2, § 17 O10) | a Definition of Done for the C# doctrine in the gated `csharp/definition-of-done.md` (typed values, no `throw` for control flow, complexity, immutable contracts, `Nullable enable` and `TreatWarningsAsErrors` set), mirrored by `typescript/definition-of-done.md` for § 0 — and a box in every new rule of both sides | box ↔ box, same gate |
| R4 | § 4 `tsc` emits despite errors (`:80-97`, 1,151 B) → `typescript/testing.md` verbatim, with `compiler-strictness.md` carrying the flag | no C# counterpart needed: the C# compiler emits nothing on an error. Stated once in the TypeScript rule as a difference, not a gap | deliberately absent |
| R5 | § 2 backticks in template literals (`:49-65`, 755 B, stays in the doctrine) | C# raw string literals have no comparable trap (`"""` cannot be ended by a shorter run) — stated in § 2's placement note | deliberately absent |

### 3.3 Gaps on both sides — raised or recorded

| Gap | Decision | Why |
|---|---|---|
| Analyzer / lint requirement | **Raise both, asymmetrically named**: TS lint at zero warnings (P2, P4); C# `TreatWarningsAsErrors` + `Nullable enable` in `csharp/doctrine.md` § 1 | The compiler is the C# analyzer the family already pays for; an extra analyzer package is a dependency decision for the consumers, not a shared rule (Q7) |
| Lock file + locked restore (**G2**) | **Raise BOTH — option A: G2 is `equal`.** TypeScript: `package-lock.json` committed, `npm ci` the only install in CI. .NET: every project restores with `RestorePackagesWithLockFile=true` (in `Directory.Build.props`), `packages.lock.json` committed, and CI restores in locked mode (`RestoreLockedMode=true` under `CI`, or `dotnet restore --locked-mode`). Decided in the epoch 3 re-review (consult `e1c58f6d`, the owner away; **for the owner to confirm 2026-11-01**). The whitelist stays `['P4']` | **Observed, SDK 10.0.114, 2026-10-31** (the scratch project of P6's probe): `dotnet restore -m:4` with `RestorePackagesWithLockFile` wrote `packages.lock.json`; the declaration changed from `10.0.0` to `9.0.0` without regenerating → `dotnet restore --locked-mode -m:4` **failed, `NU1004`** ("the package reference … version has changed … the packages lock file is inconsistent … pass `--force-evaluate`"), exit 1; `--force-evaluate` regenerated it and locked mode passed, exit 0 — the mirror of `npm ci`'s `EUSAGE` (§ 4.3). **Why the first decision was reversed:** "NuGet resolves to the lowest applicable version, so exact pins already make the graph deterministic" is refuted — the resolution changes when a missing version is published later or a package is unlisted, which is why Microsoft documents lock files for repeatable restores (devblogs, *Enable repeatable package restores using a lock file*); and admitting G2 as an exception against epoch 2's explicit "only P4" would have been a narrowing needing the owner. **Adoption cost, honestly:** one `packages.lock.json` per project in the six .NET-bearing consumers (generated once, committed, regenerated with `--force-evaluate` on every bump), one property pair in each `Directory.Build.props`, one CI flag — E2 writes the rule, E7's dry run generates the locks and the bumps commit them. **Superseded, kept as history:** ledger 2.1's whitelisting of G2 as `stronger-ts` (its text stays in the ledger) and the first revision's "record .NET … Q1 for the owner" |
| Install scripts at dependency install | **TS: a narrow, reviewed exception to `npm ci --ignore-scripts`** — a committed allow-list with one reason per package, `npm rebuild <pkg>` for those only, a check that the list is exact and that each listed package has an install script (§ 4.5, E2.S3). **.NET: `deliberately-absent`** in the inventory, with the reason: NuGet has no install scripts, so there is nothing to allow-list (the epoch 4 round, § 19) | A native module that needs its build script is the one legitimate case; a wildcard or an unreasoned entry is what the check refuses |
| Vulnerability scan | **Raise both** in `common/dependencies.md`: the monthly bump runs the ecosystem's scanner (`npm audit`; `dotnet list package --vulnerable --include-transitive`; `cargo audit` where installed) and records the result beside the pins | Cheap, equal, and both commands exist today (npm measured) |
| Coverage thresholds | **Deliberately absent on both** | `testing.md` governs what a test may claim; a number is gamed the week it lands. Recorded, like every deliberately-absent reason, in `research/parity-inventory.json` (`status: "deliberately-absent"`, `reason`) — the one home; `research/module_rules.md` points there (§ 16, stories-writer point 9: the first revision's "in `research/module_rules.md`" is superseded) |
| CI steps per language | **Deliberately absent as shared rules** | `testing.md:16-18`: each repository's own instructions and CI name the exact commands. Shared text would be an inventory |
| A runtime version statement — **not a both-sides gap** (§ 16, stories-writer point 3; the first revision listed it here by mistake) | it is P1's TypeScript side (D7): C# has the statement, TS gets one of the same shape, as one tested combination | the both-sides gaps are the five rows above, as § 1 says |

### 3.4 Exemptions and suppression — the column both sides need

| | C# | TypeScript | Equal? |
|---|---|---|---|
| Where a suppression may live | inline `#pragma warning disable <id>` with the reason on the same line; never `<NoWarn>`/`<WarningsNotAsErrors>` in a props file, never `GlobalSuppressions.cs`. **Checked by `strictness-check`** (§ 18, finding 4): a `#pragma warning disable` with no warning id, or without a same-line `// <reason>`, is a finding | inline `// eslint-disable-next-line <rule> -- <reason>`; never a file-wide disable, never `ignores` of production folders; `reportUnusedDisableDirectives: "error"` so a stale suppression fails. **Checked by `strictness-check`** (§ 18, finding 4): a file-wide `/* eslint-disable */` with no rule id, or any `eslint-disable` line without a same-line `-- <reason>`, is a finding | equal **by the check, not by prose**: fixtures for both violations and a valid form on each side (§ 4.6); today C# has no rule and TS has two divergent configs |
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
| Browser/webview | `src/webview/page.ts` | **the resolver cannot tell a webview file from a Node file by path** — the matrix records that the boundaries rule (output encoding) reaches it through the `ui` gate, not through a selector |
| Rust | `src/main.rs` | the third language, same principle |

× every single-read task (`inspect`, `ui`, `gpu`, `storage`) and the split-read `implement`, `test`, `audit`, `logging`,
`dependencies`. The exit criterion of E1: the headroom of every tight scope is recorded, and every later epic has a byte
allowance it may not exceed (§ 5).

**Selection tests pin which rules each scope selects** (D12): the body manifest (`tools/rules.test.mjs:151`) hashes
bodies after the front matter (`tools/lib/rule-body.mjs:24`), so a changed `paths:` or `tasks:` line passes the freeze.
E1 adds one test per representative scope asserting the exact id list, in the style of `:176-200`.

**The parity matrix as a file**: `research/parity-matrix.json` — one row per P/R entry: `topic`, `csharp: { delivery:
[{ id, section }, …], enforcement: [{ check | hook | test | prose, …}] }`, `typescript: { delivery: [...], enforcement:
[...] }` — **a requirement may span SEVERAL rule locations per side** (ledger 3.2, § 19): `delivery` is the set of
places the instruction is READ, `enforcement` the evidence of what enforces it, kept apart so that listing a
compiler-check location never implies its instructions reach a source-file scope — `strength`, `suppression`, `status` (`equal`, `stronger-ts`, `stronger-cs`,
`deliberately-absent`) and `reason` (required and non-empty for `stronger-ts` and `stronger-cs`; refused on an
`equal` row — ledger 1.1; **a `deliberately-absent` row carries NO matrix reason — its reason lives in the inventory,
§ 3.3 and § 11, the one home** — § 17, O2), and the exception whitelist of § 2 (`stronger-*` only for the ids the test
lists, today `['P4']` — G2 is `equal` since the epoch 3 re-review; any other such row fails — § 16, § 17). **Equality is checkable, not asserted**
(§ 16): every `equal` row records, PER SIDE, `selectors` (`paths`, `path_tasks`, `tasks`), `mood` (`MUST`/`SHOULD`),
`enforcement` (`prose`, `test`, `check`, `hook`), `consequence` (what fails) and `suppression` (the policy of § 3.4).
**Multiple locations mean the UNION of the scopes that deliver the requirement** (ledger 3.2; cadence consult
`69c2eb3f` turn 2): the test takes each side's `delivery` set, maps every location's selectors through the
correspondence table, and compares the UNIONS of the representative scopes they select — never equality between every
pair of files. **Proven on the real rows first, before any generic machinery** (E1.S3): P2 and P3's C# delivery is
{`csharp/doctrine.md` § 1} on `.cs/.razor/.csproj`; their TypeScript delivery is {the minimal source-file statement E3
lands in `typescript/doctrine.md`, `typescript/compiler-strictness.md` on `tsconfig*.json`} — the union, with the
configuration kind set apart, is the source files plus the manifest on both sides, and the fixture with those ACTUAL
planned selectors must pass; a negative fixture that removes the TypeScript source-file statement (leaving only
`compiler-strictness.md`) must FAIL, because a `.ts` scope would then deliver nothing. P4 stays the explicit
`stronger-ts` exception and is not forced through the equal-enforcement assertion. **The timing** (turn 2): E3 activates
P2 and P3, so they are evaluated against the post-E3, pre-E4 catalog — which is why E3, not E4, lands the minimal
source-file statement (a short paragraph in `typescript/doctrine.md` that E4's § 0 later absorbs) AND the doctrine's
selector expansion (`.js/.mjs/.cjs` and `**/package.json` — consult `354b1a67`, § 19: without it a `dependencies
--file package.json` scope selects the C# doctrine through `.csproj` while the TypeScript union would select nothing);
the activation is not postponed. **The proof uses only what exists at the owning epic's exit** (consult `354b1a67`):
*use only the artifacts and selectors available at the owning epic's exit; include the source, JavaScript and manifest
scopes* — for P2/P3 that is E3's exit (today's doctrine plus E3's statement and selectors, `compiler-strictness.md`,
the catalog as it then stands), and each later epic runs the same proof for the rows it activates, at its own exit,
against the catalog of that moment. E1 proves the MACHINERY on fixtures carrying the actual planned selectors; E3 runs
the first real-catalog proof.

**The sides are compared by NORMALISED selection behaviour, never by literal selector fields** (§ 17, consult
`e1c58f6d`): `.cs` and `.ts` globs necessarily differ, so the test maps each side's selectors through the correspondence
table — C# source globs (`**/*.cs`, `**/*.razor`) ↔ TypeScript source globs (`**/*.ts,tsx,mts,cts,js,mjs,cjs`);
`**/*.csproj` ↔ `**/package.json` (the project manifests); the C# project configuration (`Directory.Build.props`,
`Directory.Packages.props`, `NuGet.Config`) ↔ the TypeScript compiler configuration (`tsconfig*.json`, `.npmrc`), a
kind of its own whose requirements are stated per counterpart — and then asks the catalog which REPRESENTATIVE scopes
(§ 4.1's matrix: source file, manifest, configuration, each under the nine tasks) select each side; two sides are equal
in (a) when the selected-scope sets correspond row for row under the table and the gates agree. **The configuration
kind is OUTSIDE the mechanical comparison** (the E1 stories' O3): `Directory.*.props`/`NuGet.Config` and
`tsconfig*.json`/`.npmrc` have no row-for-row correspondence to assert — one stack keeps its compiler and package
settings in MSBuild properties, the other in two files of different shape — so the test does not compare their selection
sets; their requirements are stated per counterpart in the matrix row (P2, P9) and enforced by the strictness check's two
halves, which is where the equality is checked. One test compares that
normalised behaviour plus the `mood`, `enforcement`, `consequence` and `suppression` fields and fails on any mismatch,
and a second test checks the recorded fields against the
world — the selectors against the rule's actual front matter, the mood against the **nearest ancestor heading that
carries a marker** — the section's own heading, else its parent's, up to the H1, so `MANDATORY` is inherited (§ 17,
O6: `common/reliability.md`'s H1 carries it and its `### A timeout is not a cancellation` section, P13's C# side, does
not; the test reads it that way) — and the enforcement against the actual tool (a side recorded as `check:
strictness-check` must be named in that tool's exported rule list; a side recorded as `hook` must be matched by a hook
under `settings/hooks/`). A test asserts every `id` exists in the catalog and every `section` is in that rule's recorded
`sections` in `research/rule-bodies.json`; a row with `deliberately-absent` names the side, and its reason is the
inventory's. A rule renamed
or a section retitled without the matrix is a red suite — the drift protection the consultants asked for.

**The inventory as a file, so the matrix is complete and not only consistent** (plan round 1, finding 4):
`research/parity-inventory.json` — one entry per requirement of § 3 (`P1`…`P20`, `R1`…`R5`, and one entry per
both-sides gap of § 3.3), each with `id`, `topic`, `side` (`csharp`, `typescript`, `both`) and `status`: `counterpart`
(the matrix row closes it), `deliberately-absent` (with the reason), or `planned` (the epic that will close it); and the
optional `scopedAbsences` field — a list of `{ scope, reason }` for a requirement that is a counterpart in one scope
kind and deliberately absent in another, which is P5's shape after § 18's finding 5 (equal inside a TypeScript project,
the typed parts absent in a repository with no TypeScript project: `scopedAbsences: [{ scope: "javascript-without-
project", reason: "nothing checks a type there" }]`; the E1 stories' O4). A test
asserts that every inventory entry has exactly one matrix row and every matrix row maps to one inventory entry, so a
requirement added to the inventory without a row — or a row without a requirement — fails the suite. The two files are
the machine-readable form of § 3; the prose table is the human one, and the test is what keeps them one.

**How E1 exits green before any destination exists** (re-review, § 15): a matrix row or an inventory entry whose
destination is not yet written has `status: "planned"` and names its owning epic (`epic: "E4"`); a move entry in
`research/moved-blocks.json` whose destination does not yet exist is `planned` too. **E1 validates `planned` items
STRUCTURALLY only**: the schema, an existing source file and line range, an owning epic among E2–E6, and — for a move —
the SOURCE bytes' `sha256` and `length`, **recorded TWICE: a small BASELINE at E1 — for every planned move range its
source file, line range and `sha256` as a `planned` entry with no destination check — and the full destination entry
by the OWNING epic right before it moves the block, with E1's recorder, which requires the bytes to equal E1's baseline
or a superseding entry with an independently justified reason** (ledger 3.4 as amended by consult `354b1a67`, § 19;
the first revision's "recorded at E1's own recording commit" and the epoch 4 draft's "E1 records nothing" are both
superseded): the baseline is what detects a source change between E1 and the move, which recording only at the move
could not, and the `planned` check requires those bytes to be still present, unchanged, at the source range until the
move happens, so any edit of the source in between is a red test, not a silently different "before" (§ 17, O11). E1
does NOT check a
destination's bytes or a destination's `id`/`section`: there is nothing to check yet. **Each owning epic activates its
items when it lands them**: the status becomes `counterpart` (or `deliberately-absent`/`stronger-*` with a reason), the
reference test then requires the `id` and `section` to exist, and the move test then compares the destination's live
bytes with the recorded source hash. The final Definition of Done (§ 11) requires **zero `planned` items**; a `planned`
item whose owning epic has merged is a red suite.

**The consumers as a file** (PR #94 review, comment 6 — ledger 1.5; **built in E7, where the dry run first needs it** —
ledger 3.4, § 19; until then every consumer count reads the README directly): `research/consumers.json`, derived from the one
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
`node tools/moved-blocks.mjs --record <source> <from>-<to> <commit> <destination> <epic> <id>`, which reads the block with `git show
<commit>:<source>` at the commit RIGHT BEFORE the move; the test itself needs no history, so it is green in CI's
`actions/checkout` at `fetch-depth: 1` and in every shallow clone (PR #94 review, comment 2 — ledger 1.2; the
alternative, `fetch-depth: 0` or a targeted fetch of each named commit, makes a test about rule text depend on the
runner's network and on commits a squash merge may not keep — the manifest is reviewed in the same diff as the move and
survives both). The semantics are unchanged: byte for byte, against the source as it stood before the move.

**The manifest is historical evidence and immutable** (re-review, § 15): original source hashes and lengths are never
edited; a later move or edit of a destination appends a provenance entry (`supersedes: <entry id>`, the new commit,
the new hash) and never replaces earlier evidence. **The superseding procedure, defined** (§ 19, E1's plan round): a
`planned` block whose source range or bytes change before its move gets a NEW entry recorded by the owning epic, with
`supersedes: "<old id>"`; the recorder then adds `supersededBy: "<new id>"` to the old entry and touches nothing else in
it (its hash and length stay as recorded); the owning epic lands the NEWEST entry's bytes, and the checker ignores a
superseded entry for destination comparison while still asserting it is present and unaltered. **A superseding entry
needs an INDEPENDENTLY justified source change** (consult `354b1a67` turn 2, § 19): "a reason is present" alone must not
let a wording change folded into a move pass the preservation check, so the entry cites `justifiedBy: "<commit>"` —
the commit that changed the source block OUTSIDE the move (its own commit, a recorded wording change such as E1.S0's,
or a commit named by a ledger entry) — and the checker verifies that the cited commit exists in the repository and
touches only the source file(s) of the block; **a move commit may never also change the block's words** — a destination
whose bytes differ from the newest entry fails whatever the commit message says. **The activation of an UNCHANGED
baseline entry** (the second full reading, § 20): when the owning epic moves a block whose bytes still equal E1's
baseline, it appends a DESTINATION record that references the baseline by id (`activates: "<baseline id>"`, with the
destination file, the position at activation time and the move commit); the checker pairs the two, the baseline stays
immutable, and a paired baseline is no longer counted as `planned`; an UNPAIRED baseline whose owning epic has landed
(its id in the test's `LANDED_EPICS`) is a finding. **An activation matches by CONTENT, never by line numbers** (ledger
4.1, the Opus review of E1): the checker looks for the activated block's exact bytes — the baseline's `sha256` and
`length` — ANYWHERE in the destination file and requires exactly one occurrence (none is a finding; two copies is a
finding too); `destinationLines` is recorded as the position at activation time, for information only, and is never
compared. The reason: an activation pinned to fixed lines would go permanently red the first time anything above the
block changed in its destination (E4 lands `typescript/testing.md`, E6 edits it) and, entries being immutable with only
`supersededBy` addable, there would be no recovery path. A destination edit INSIDE the block remains a finding, and a
superseding entry with its `justifiedBy` commit remains the remedy. The superseding procedure above is for CHANGED
blocks; activation is for unchanged ones — every baseline entry ends in exactly one of the two. The recorder writes the
file as one JSON array, inserting the separating comma between entries (E1's plan round, brief fix 1), so an append
never produces an unparsable file — the same stance `research/shared-rules-migration-map.json` takes for
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

**A move is a list of EXACT line ranges** (§ 17, O5 — ledger 2.4): every range below is whole lines, measured with
`Buffer.byteLength` on this worktree, and each range is its own entry in `research/moved-blocks.json`; where a range
would split a code fence, the whole fenced block stays on one side. The count of moves anywhere in this plan is the
manifest's count, never a hand-typed number. A dated audit sentence that shares a paragraph with a neutral invariant
(for example `reliability.md:38-46`'s .NET launcher sentence, and the .NET names inside `utc-timestamps.md`'s rules 1
and 2) is **evidence inside the invariant and stays** (the D6 kind), with the Node form added beside it; only whole
bullets, subsections and fenced blocks move.

**A mixed-content line is split by whitespace only, before anything is recorded** (§ 17, consult `e1c58f6d` turn 2):
where one line or paragraph holds a sentence that moves and a sentence that stays, E1.S0b inserts a line break or a
blank line between them in the SOURCE — nothing else — in its own commit next to the anonymisation, before E1.S4
records any hash. The check that it is no shortening (D1): the file with all whitespace removed is byte-identical
before and after. Two such splits today: `common/testing.md:33` ("Everything below applies everywhere." goes on its
own line) and `csharp/nuget-packages.md:41-43` (the .NET-only sentence "Monthly, to the latest **stable** — never a
preview; the family is strictly .NET 10." becomes its own paragraph). The ranges are then whole lines, recorded at
E1.S4's commit in the post-split numbering, and the original words stay in place on whichever side they belong.

**Gates follow the REQUIREMENT'S PROVENANCE, not the file's age** (§ 17, O3 revised by consult `e1c58f6d`): a gate
MIRRORS when the requirement's text comes from an existing rule — its `path_tasks` equals that source's `tasks:` line,
and a source with no `tasks:` (a path-only rule such as `typescript/doctrine.md`) mirrors as "no gate". A gate is
DECLARED only when the requirement is new, or when its applicability is changed on purpose; the declaration in
`research/selection-matrix.json` (`gates: { "<id>": { path_tasks, reason } }`) carries the reason, and a change of
applicability is approved explicitly in this plan (§ 4.4 names the four). Independently of any declaration, the same
file pins POSITIVE and NEGATIVE selection cases per gated rule (scope → selected / not selected), so that editing both
the declaration and the front matter cannot make a wrong gate pass.

| From (lines at `f46982f`, bytes by `Buffer.byteLength`) | To | Gate (mirrors the source's `tasks:`; a declared gate says so and names its reason in `selection-matrix.json`) |
|---|---|---|
| `common/testing.md:12-31` (1,113 B — re-measured after PR #94 comment 5; the first revision listed `:12-34`, 1,267 B, which included the Rust sentence), `:354-358` (252 B) | `csharp/testing.md` (paths `**/*.cs`, `**/*.csproj`) | implement, test, audit, policy, release |
| `common/testing.md:32-33` AFTER E1.S0b's whitespace split — the two whole lines of the Rust sentence (116 B with their line ends; 153 B today for the unsplit `:32-33`); "Everything below applies everywhere." stays on its own new line `:34` as the invariant — **superseded:** "up to '.NET-specific.' (115 B)", a mid-line range the whole-line recorder refuses | `rust/testing.md` (paths `**/*.rs`, `**/Cargo.toml`) | the same |
| `common/reliability.md:104-133` (1,698 B, the OCE/TCE subsection); the whole bullets `:49-54` (433 B, `CreateAsyncScope`/`BackgroundServiceExceptionBehavior`), `:55-59` (436 B, `Task.Run`/`TaskScheduler.UnobservedTaskException`), `:66-69` (375 B, `ExecuteAsync`), `:97-98` (160 B, `CancellationToken`), `:99-102` (322 B, `PosixSignalRegistration`/`Console.CancelKeyPress`) — **superseded (2.4):** "the sentences of `:47-70` and `:95-103` … (≈ 1,100 B)" and "`:38-46`'s .NET launcher sentence", which were not ranges; `:38-46`, `:60-62` and `:63-65` stay whole (neutral invariants with dated evidence) and the common section keeps its heading, the remaining bullets, one neutral sentence per moved bullet and the pointer | `csharp/lifecycle.md` (paths `**/*.cs`) | implement, audit, test, deploy, benchmark |
| `common/logging-serilog.md:61-90` (1,640 B), `:153-171` (497 B) | `csharp/logging.md` (paths `**/*.cs`, `**/Program.cs`) | logging, implement, audit |
| `common/logging-serilog.md:172-187` (875 B) | `rust/logging.md` (paths `**/*.rs`, `**/main.rs`) | the same |
| `common/utc-timestamps.md:41-47` (311 B — the whole C# fenced block of rule 3, opened at `:41` and closed at `:47`) — **superseded (2.4):** "`:25-48`'s .NET sentences and the C# block (≈ 900 B); its Never/DoD lines", not a range; rules 1 and 2 (`:30-36`) and the Never/DoD lines stay whole, their .NET names being evidence inside neutral sentences (the D6 kind), with the Node forms added beside them | `csharp/utc-timestamps.md` (paths `**/*.cs`) | storage, implement, audit |
| `common/utc-timestamps.md:65-69` (219 B) | `rust/utc-timestamps.md` | the same |
| `typescript/doctrine.md:15-48` (2,042 B) + its DoD box | `typescript/boundaries.md` (paths `**/*.ts,tsx,mts,cts,js,mjs,cjs`) | implement, test, audit, ui, http |
| `typescript/doctrine.md:49-65` (755 B, § 2 — its guard is a test, § 16 point 6), `:66-79` (932 B), `:80-97` (1,151 B) + their DoD boxes | `typescript/testing.md` (paths as above) | implement, test, audit, policy, release — a DECLARED gate (ledger 3.1, § 4.4): the source has no `tasks:` line, so the applicability is changed on purpose |
| `csharp/nuget-packages.md:12-23` (824 B, *Before adding any package*); `:25-29` (334 B, the *Licence before version* heading and its "in any ecosystem" paragraph) — **`:31-37` (425 B, the two family-wide NuGet decisions: FluentAssertions 7.2.2, the Aspire pair) STAYS in the NuGet rule**, they are NuGet facts (§ 17, consult `e1c58f6d`; the earlier "`:25-37` (760 B)" is superseded); after E1.S0b's split of `:41-43`, the `## Bumping` heading `:39` and the neutral cadence paragraph ("Bump the whole set together … not a silent downgrade.") move, while the .NET-only sentence ("Monthly … strictly .NET 10.") stays in the NuGet rule under a new heading `## Bumping — the NuGet cadence and commands` together with the `powershell` fence `:45-48` (153 B), so both files keep their fences balanced and every word stays where it belongs (bytes recorded at E1.S4 in the post-split numbering; today `:39-43` is 286 B); `:50-54` (286 B — O9: 287 B counted the blank `:55`, *Prefer nothing*) — the count of entries is the manifest's | `common/dependencies.md` (tasks `dependencies`) | — |

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
`## 0. Language, runtime and design` of at most 3,800 B — P1 (D7), P2's one line, P5–P7 by meaning, each a short
paragraph that names the C# section it mirrors, and which sections apply to plain JavaScript — and four pointer lines
to the gated rules that now hold § 1, § 2, § 3 and § 4 (the design section's checklist is the gated
`typescript/definition-of-done.md`, § 16). Size ≤ 4,700 B against 5,910 today — smaller, with nothing deleted: all
4,880 B of trap text (§ 1 2,042 + § 2 755 + § 3 932 + § 4 1,151) and the four DoD boxes leave for the gated rules word
for word. **Superseded (§ 17, O10):** the first revision's "the existing § 2 (755 B, unchanged, with its DoD box) …
three pointer lines … ≈ 4,900 B" — § 2 moves too (§ 4.3, § 5, § 16 point 6), and this paragraph had not caught up.

**Wording changes, not content** (D1), **in the source, as E1.S0's own commit, before E1.S4 records anything** (plan
round 1; placed in E1 by § 16): in `typescript/doctrine.md` § 1 as it stands, `webauthnPrf.ts` / `entityFormScript.ts`
/ `depPickerScript.ts` become "one module, a second, and a third written beside the fix for the second", "a real
vault" becomes "a real credential store", `:37`'s "a **synced** vault" becomes "a **synced** credential store" and
`:39`'s `scriptInterpolation.test.ts` becomes "the scan test" (the two items the first list missed — E1.S0 carries all
six); every sentence, number and date stays — a recorded wording change with no
lesson removed, its body hash updated by `node tools/rule-bodies.mjs --update typescript.doctrine` in that commit,
listed in the pull request as wording. E1.S4 then records the anonymised block's hash, and E4.S2 moves § 1 to
`typescript/boundaries.md` in one commit, byte for byte equal to it.

**The C# Definition of Done is gated, so `gpu --file src/x.cs` stays one read** (§ 16, finding 1): the R3 checklist
for the C# doctrine lives in `csharp/definition-of-done.md` (id `csharp.definition-of-done`, paths
`**/*.cs`, `**/*.razor`, `**/*.csproj`, `path_tasks: ["implement","test","audit","release","policy"]`) — the tasks at
whose completion a checklist is read, never `gpu`, `ui`, `storage` or `inspect`. Its TypeScript mirror is
`typescript/definition-of-done.md` with the same gate, holding the design section's checklist (§ 0), so the two boxes
have the same scope kind (equal strength (a)); the doctrine's § 2 box moves with § 2 to `typescript/testing.md` (O10).
`csharp/doctrine.md` therefore grows by the `Nullable enable` line only (≈ 20 B). **The gated files whose gates are
DECLARED rather than mirrored, by provenance** (§ 4.3; § 17, O3 as revised by consult `e1c58f6d` — ledger 2.2; the
fifth added by ledger 3.1; the count repaired after the E1 stories' O2 — the first wording said "four"):
the Definition-of-Done pair holds NEW requirements (no source rule) and declares `implement, test, audit, release,
policy` ("a checklist is read at task completion"); `typescript/boundaries.md` inherits existing doctrine text whose
source has no `tasks:` (it loads on every `.ts` today), so its mirror would be "no gate" — **this plan changes its
applicability on purpose** to `implement, test, audit, ui, http` ("output reaches a page or a wire on these tasks; `ui`
because the webview trap is a `ui` trap"), approved here as the explicit exception the provenance rule requires, with
the reason recorded in the declaration; `csharp/boundaries.md` holds a new requirement (R1's C# side) and declares the
same gate. **`typescript/testing.md` is the fifth** (ledger 3.1): its first text is the doctrine's § 2–§ 4, whose
source has no `tasks:` line, so by the provenance rule it would mirror as "no gate" — this plan changes its
applicability on purpose to `implement, test, audit, policy, release`, because the trap texts are test-and-fixture
discipline that loads where tests are written or reviewed, and the gate is what keeps § 5's `.ts` budgets (the
doctrine's ≤ 4,700 B allowance assumes those 2,838 B leave the every-`.ts` scope); § 5's numbers do not move, since
§ 4.3 already gated the file so. **The new TypeScript mechanics files are declared too, as new requirements with no
source rule** (the E1 stories' O2): `typescript/lifecycle.md` (reason: the Node counterpart of the C# lifecycle
mechanics moved out of `reliability.md`, gated as that rule's tasks), `typescript/logging.md` (as `logging-serilog.md`'s
tasks), `typescript/utc-timestamps.md` (as `utc-timestamps.md`'s tasks), and the runner text E6 adds to
`typescript/testing.md` under the gate 3.1 approved. Eight declared gates in all; every other gated file mirrors its
source's `tasks:` line. All of them, declared and mirrored, carry positive and negative selection cases in
`research/selection-matrix.json` — **each declaration and its cases written by the OWNING epic when it lands the file,
in E1's schema** (ledger 3.4, § 19); E1 declares nothing. A negative case is DEFINED (E1's plan round, brief fix 2;
the first stories draft's "no scope would select" clause is replaced): for a gated rule, one scope with a matching path
and a task outside the gate, and one with a task inside the gate and no matching path — both must NOT select; for an
ungated rule, one scope with no matching path.

**Placeholder files created by a move carry valid front matter from their first commit** (plan round 1, finding 2):
`typescript/boundaries.md` and `typescript/testing.md` are created by E4.S2 with `id`, `load`, `paths`,
`path_tasks` and `depends` exactly as § 4.3 names them, holding exactly the moved text and nothing else, with their
`rule-bodies.json` entries added by hand in the same commit — so the catalog loads and `npm test` is green at every
story, and no byte is ever in flight between two commits. The same holds for every file a later move creates
(`csharp/*.md`, `rust/*.md`).

Selectors: `paths: ["**/*.ts","**/*.tsx","**/*.mts","**/*.cts","**/*.js","**/*.mjs","**/*.cjs","**/package.json"]`,
no gate — **the expansion (the JavaScript globs and the manifest) is landed by E3, not E4** (consult `354b1a67`, § 19),
together with the minimal P2/P3 statement, so that the union equality holds at E3's exit; its interim budget, measured
against the post-E3, pre-E4 catalog, is § 5's "after E3" table — like `csharp/doctrine.md`, whose `**/*.csproj` is the project manifest; `**/package.json` is Node's (§ 2 (a)
as defined by § 17, O4 — ledger 2.3), and it costs nothing a budget sees: every `package.json` scope is already a split
read (§ 5). `tsconfig*.json` is NOT added — it is the compiler configuration, a kind of its own, and adding ≈ 4,700 B to
every `tsconfig.json` scope would break three of the pins of § 5 (`ui`, `gpu`, `storage` with `tsconfig.json`). This
repository's own `tools/*.mjs` then load the doctrine on an `inspect` (§ 5: ≈ 29,060 B, fits). **Symmetric manifest
selectors** (§ 18, finding 3): the doctrines select the stack's project manifest on both sides (`.csproj` ↔
`package.json`), the package rules select the stack's package configuration on both sides (`.csproj`, `Directory.*.props`,
`NuGet.Config` ↔ `package.json`, `.npmrc`), so a `dependencies` scope on either manifest evaluates the same rule kinds
— the shared dependency rule, the ecosystem's package rule and the stack's doctrine — and § 4.1's normalised-selection
test asserts exactly that correspondence.

**The typed doctrine and plain JavaScript** (§ 18, finding 5, chosen by enforceability): § 0 says which of its
requirements are TYPED (branded domain types, typed results, `readonly` contracts) and that for `.js/.mjs/.cjs` they
hold **inside a TypeScript project**, where `allowJs` + `checkJs` under `strict` with JSDoc types makes the compiler
enforce them — the check's TypeScript half requires `checkJs` when a project's `include` reaches a `.js/.mjs/.cjs` file
(§ 4.6). In a repository with NO TypeScript project nothing checks a type, so the typed parts are `deliberately-absent`
there (the inventory holds the reason) and § 0's JavaScript paragraph states the enforceable subset: `Object.freeze` at
the boundary for `readonly`, Result objects for outcomes, validation at the boundary, complexity ≤ 4 and `no-console`
by lint — all enforced by the lint half. Option (b), a separate short JavaScript rule, was not taken: it would be a
second body for the same ideas (the drift [knowledge-base.md](../common/knowledge-base.md) warns of) and a new selector
competing for the same single-read scopes; the JavaScript paragraph is part of § 0's ≤ 3,800 B.

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
moved verbatim from `csharp/nuget-packages.md` (§ 4.3's last row, as settled by the epoch 3 re-review): *Before adding
any package* (the table; "nuget.org" stays in the moved sentence and the rule adds "or the ecosystem's registry" beside
it rather than editing it), the *Licence before version* heading and its "in any ecosystem" paragraph (`:25-29`), the
*Bumping* heading and its neutral cadence paragraph (after E1.S0b's split), *Prefer nothing*; plus the vulnerability scan
(§ 3.3) and **the lock-file requirement for both ecosystems (G2, § 3.3): a committed lock and a locked restore in CI,
with each ecosystem's mechanism named in its own rule**. **Superseded (consult `e1c58f6d`):** the first revision's
"the lock/pin asymmetry sentence" — there is no asymmetry to state once G2 is `equal`. Target ≤ 4,000 B; `dependencies`
is a split-read task.

**`csharp/nuget-packages.md`** loses `tasks: ["dependencies"]` and the moved blocks, **gains the .NET lock-file
mechanics (G2 option A): `RestorePackagesWithLockFile=true` in `Directory.Build.props`, `packages.lock.json` committed
per project, `RestoreLockedMode=true` when `CI` is set (or `dotnet restore --locked-mode`), `--force-evaluate` as the
only way to move a lock — with the observed `NU1004` fixture of § 3.3**, keeps central pins, the two
family-wide decisions (FluentAssertions 7.2.2, the Aspire pair — the coupled-version exceptions D14 names), the two
`dotnet` commands and the zero-reference box, and gains the pointer. Expected ≈ 1,000 B (from 3,081).

**`typescript/npm-packages.md`** — id `typescript.npm-packages`, `paths: ["**/package.json","**/.npmrc"]`, no gate
(the `package.json` scopes are already split reads; the `.npmrc` scopes are pinned and fit with the rule's ≤ 3,300 B —
§ 5). P9's three layers named as D14 asks: the declared range (`save-exact=true` in `.npmrc`), the lock's resolution
(`package-lock.json`, committed), the reproducible install (`npm ci --ignore-scripts`, the only install in CI; what it
refuses and what it accepts, measured). **A narrow, reviewed exception to `--ignore-scripts`** (the epoch 4 round,
§ 19): some dependencies need a lifecycle script (a native module's build). The default stays `--ignore-scripts`; a
consumer that needs scripts lists the EXACT packages in a committed allow-list (`.npm-scripts-allowlist.json` beside
the `package.json`: `{ "<package>": "<reason>" }`, one reason per package, no wildcard); after `npm ci --ignore-scripts`
CI runs `npm rebuild <pkg>` for the listed packages only; and the strictness check's TypeScript half verifies the list
— every key is an exact package name present in the lock, and each listed package actually declares an `install`,
`preinstall` or `postinstall` script in the installed `package.json` (a listed package with no script is a finding, as
is a wildcard or a missing reason). **No .NET mirror:** NuGet has no install scripts, so the inventory records the
counterpart as `deliberately-absent` with that reason. **Superseded (§ 18, finding 3):** "`package-lock.json` and `.npmrc` are not
selectors: they are what following the rule produces" — `.npmrc` IS a selector, the counterpart of `Directory.*.props`
and `NuGet.Config` through the correspondence table; `package-lock.json` stays unselected, as `packages.lock.json` is
on the other side.

### 4.6 Enforcement parity (D8)

| .NET | Node | Class |
|---|---|---|
| **Resource limits:** `tools/build-flags-check.mjs` — `Directory.Build.rsp` exists and says `-nr:false`; no `-noautorsp`; a repository with no C# passes without opinion (the measured worker-pool problem, `csharp/dotnet-build.md`) | none — P8: no measured Node counterpart | deliberately absent |
| **Compiler properties and suppressions — the .NET half of `tools/strictness-check.mjs`** (new; named `node-strictness-check.mjs` until ledger 1.1 gave it this half; it COMPLEMENTS `build-flags-check` and its hook, which enforce resource limits, and replaces neither — E3 owns it on both stacks): for every `*.csproj` outside the skip set, `dotnet msbuild <project> -getProperty:TreatWarningsAsErrors -getProperty:Nullable -getProperty:NoWarn -getProperty:WarningsNotAsErrors -m:4` must answer `true` and `enable` (the EFFECTIVE values, `Directory.Build.props` inheritance included — probed § 14), and the effective `NoWarn` and `WarningsNotAsErrors` may hold nothing the REPOSITORY added: SDK defaults are told apart two ways, both required — the effective value is compared with a clean-project baseline captured for the pinned SDK (`tools/fixtures/strictness/sdk-baseline.json`, keyed by `global.json`'s SDK; probed on 10.0.114: a clean project answers `NoWarn` `1701;1702`, `WarningsNotAsErrors` empty — § 15), and the repository's own props and csproj files are read for a `<NoWarn>` or `<WarningsNotAsErrors>` element, which is a finding wherever it sits; INCOMPLETE when projects exist and no `dotnet` SDK resolves, or the pinned SDK has no baseline; a repository with no project passes without opinion. **The properties are read only after a successful LOCKED restore** of the solution or project (`dotnet restore --locked-mode -m:4` — § 18, finding 2): MSBuild evaluation of an unrestored project can answer defaults or fail on missing assets, so without a successful restore the half reports INCOMPLETE and never a finding; fixtures: an unrestored project (INCOMPLETE, naming the restore) and a restored one (evaluated). **Inline suppressions** (§ 18, finding 4): every `#pragma warning disable` in a source file carries at least one warning id AND a same-line `// <reason>`, or it is a finding; fixtures: no id, no reason, and the valid form | **The TypeScript half, under TWO predicates** (ledger 1.3, then 3.3 — § 19): the **compiler half** runs where `isTypeScriptRepository(dir)` = any `tsconfig*.json` outside `node_modules`, OR any `package.json` whose `dependencies`/`devDependencies` name `typescript`; that predicate decides which `tsconfig*.json` files are walked and whether a missing `tsc` is INCOMPLETE. The **JavaScript-lint half** runs where ANY `.js/.mjs/.cjs` exists under the repository outside `node_modules`, whatever the compiler predicate says: it requires a `lint` script at `--max-warnings 0` whose configuration enables the subset of § 0's JavaScript paragraph (`complexity: ["error", 4]`, `no-console`, `reportUnusedDisableDirectives: "error"`) and reports `strictness-check: N JavaScript file(s) and no lint script — compiler-strictness.md's JavaScript subset` (exit 1; 0 under `--warn`) when there is none; the negative fixture — `package.json` + `src/app.mjs` with `console.log`, no `tsconfig`, no TypeScript dependency, no lint script — must produce exactly that finding (it passed silently under the single predicate, which is what ledger 3.3 records). For every `tsconfig*.json` the predicate found, the compiler's own merged view (`tsc --showConfig -p <file>`, so `extends`, nested packages, excludes and overrides resolve as `tsc` resolves them) has `strict: true`, where **`tsc` is found through package resolution, never a fixed path** (plan round 1, finding 3): `createRequire(<the tsconfig's package dir>/package.json).resolve("typescript/bin/tsc")`, falling back to a walk up the parents' `node_modules/.bin` — the resolution that covers a hoisted workspace install, pnpm and yarn shims; **INCOMPLETE is reported only when no TypeScript resolves at all**, and `noEmitOnError: true` unless `noEmit: true`; the `lint` script runs eslint with `--max-warnings 0` and the config sets `reportUnusedDisableDirectives: "error"`; **inline suppressions** (§ 18, finding 4): a file-wide `/* eslint-disable */` with no rule id, or any `eslint-disable` / `eslint-disable-next-line` / `eslint-disable-line` without a same-line `-- <reason>`, is a finding (fixtures: the bare file-wide disable, a line without a reason, and the valid `// eslint-disable-next-line <rule> -- <reason>`); **plain JavaScript in a TypeScript project** (§ 18, finding 5): when the project's `include` reaches a `.js/.mjs/.cjs` file, the effective configuration has `allowJs` and `checkJs` (fixture: a project including `.mjs` files without `checkJs` is a finding); a `test` script that runs `node` on a `.ts` file is preceded by `tsc --noEmit`; every `package.json` with dependencies has an `.npmrc` beside it or above it saying `save-exact=true`; `--warn` first, as every check here lands ([README.md](../README.md) § *tools*); a repository the predicate calls non-TypeScript passes that half without opinion; **a TypeScript repository (by the predicate) where no `typescript` package resolves is INCOMPLETE, never green**; and `.ts` files outside any project — `.ts` present, no `tsconfig*.json`, no `typescript` dependency — are a FINDING, not INCOMPLETE and not a pass: `strictness-check: N .ts file(s) and no TypeScript project — nothing type-checks them (compiler-strictness.md)`, exit 1 (exit 0 under `--warn`), because the rule says a type-stripped run is preceded by `tsc --noEmit` and here nothing can run it. Proven on deliberately invalid fixtures: `strict` missing in a base config inherited through `extends`; `noEmitOnError` missing with emit; `--max-warnings` absent; a stripped-TS test script without `tsc --noEmit`; a caret range with no `.npmrc`; a stale `eslint-disable`; and one VALID fixture with a hoisted install — `tsc` only in the parent's `node_modules`, the `tsconfig.json` in a workspace package — which must pass, not report INCOMPLETE; the `.ts`-without-project fixture above with its exact expected line and exit code; .NET fixtures: `Directory.Build.props` omitting `Nullable` (finding); no SDK on `PATH` (INCOMPLETE); a VALID project with `TreatWarningsAsErrors=true`, `Nullable=enable` and only the SDK's default `NoWarn` (must pass); an INVALID project with the same two properties plus a repository `<NoWarn>` (must fail naming the file and the codes); an INVALID one with `<WarningsNotAsErrors>` (must fail) | check ↔ check |
| `settings/hooks/build-flags.mjs`: a `PreToolUse` hook refusing a `dotnet build` without `-m:N` | **none** — the hook exists for a measured resource problem (`csharp/dotnet-build.md` § *Measured 2026-09-11*). The candidate Node hook — refuse `npm install <pkg>` without `--save-exact` — is unnecessary once `.npmrc` carries `save-exact=true`, which is a FILE the check verifies (measured: the setting is honoured). What a Node hook would need to earn its place: a measured cost that no file can carry | deliberately absent; stated in `research/module_rules.md` |
| `dotnet build` with `TreatWarningsAsErrors` + `Nullable enable` | the composite gate `tsc --noEmit` (or with `noEmitOnError`) + lint `--max-warnings 0` + tests, named in `compiler-strictness.md` as ONE gate the CI step runs | gate ↔ gate |
| `tools/http-coverage.mjs` reads `Map*` and `.route(`; `--routes` preferred | the same tool; a Node application prints its route table for `--routes` (D10) | one tool |

**Every consumer of kind `dotnet`, `typescript` or `mixed` wires the check** as one CI step beside `build-flags-check`
([ROLLOUT.md](../ROLLOUT.md) § CI) — required, not optional: P2's equality is delivered only where both halves run
(re-review, § 15; the first revision's "a .NET-only consumer may add it for uniformity" is superseded). **The CI step's
END state is ENFORCING mode** — a finding is a non-zero exit and a red build (§ 16, finding 6; § 11's box) — **reached
by the README's own adoption rule** ([README.md](../README.md) § *tools*: "`--warn` first, so the finding is visible
without a red build, then the flag comes off once the backfill is done"; § 18, finding 1): no consumer meets the
suppression and lock requirements today (one TypeScript consumer carries 270 `eslint-disable` lines; no .NET consumer
has a `packages.lock.json`), so E7.S1's dry run lists each consumer's findings with `--warn`, E7.S1b's remediation
stories clean them per consumer, and only then does that consumer's CI step flip to enforcing. **Superseded (§ 18):**
"`--warn` exists for E7.S1's pre-release dry run and for nothing else" — it also covers each consumer's CI between its
bump and the merge of its remediation story; what never changes is the end state. The `rust` kind is Q8's only
remaining subject.

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
| `inspect --file package.json` | 35,409 (`local-cpu-budget` 11,202) | ≈ 43,600 | no, as today | + `npm-packages` ≤ 3,500 + the TypeScript doctrine ≤ 4,700 (the manifest selector, § 18 finding 3) |
| `logging --file src/Program.cs` | 78,866 | ≈ 78,900 | split read | the Serilog blocks leave `common/logging-serilog.md` and arrive in `csharp/logging.md` on the same scope |
| `logging --file src/server.ts` | 80,162 | ≈ 78,650 | split read | − 3,012 B of Serilog/Rust mechanics + ≈ 1,500 B of `typescript/logging.md` |
| `implement --file ui/a.ts` | 292,834 (28 rules) | ≈ 291,600 | split read | − ≈ 8,200 B of C# and Rust mechanics; + ≈ 7,000 B of TypeScript mechanics (lifecycle, testing, logging, utc, boundaries) |
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

**After E3, before E4 — the intermediate budget** (consult `354b1a67` turn 2, § 19). E3 adds prose and selectors
(the ≤ 250 B P2/P3 statement, the `.js/.mjs/.cjs` and `package.json` selectors on today's 5,909 B doctrine, and
`compiler-strictness.md` ≤ 3,300 B) BEFORE E4 moves the trap sections out, so the twenty-two pins are measured against
that catalog too (E2 assumed merged — the larger case for `.npmrc`; the core unchanged until E5; `utc-timestamps.md`
unchanged until E6):

| Task | After E3 (B), in the order of the pin list | Fits |
|---|---|---|
| `inspect` | 24,207 · 28,840 · ≈ 29,840 (31,921 before E2) · **30,366** · 27,507 · ≤ 27,507 · ≈ 25,207 · **30,366** · **30,366** | all |
| `ui` | 26,420 · 29,720 · ≤ 29,720 · ≈ 27,420 | all |
| `gpu` | 27,680 · 32,313 · 30,980 · ≤ 30,980 · ≈ 28,680 | all |
| `storage` | 29,406 · **≤ 32,706** (62 B of headroom until E6 moves ≈ 1,100 B out of `utc-timestamps.md`) · **≤ 32,706** · ≈ 30,406 | all — **provided `npm-packages.md` ≤ 3,300 B**, not 3,500: at E3's exit `storage --file .npmrc` is 29,406 + the rule, so the rule's cap is tightened to 3,300 B (the same as `compiler-strictness.md`); the first allowance assumed E6's utc move had already happened |

The unpinned JavaScript scopes are split reads in the interim and improve at E4: `gpu --file src/a.mjs` 27,680 →
≈ 33,839 (E3) → ≤ 32,380 (E4); `storage --file src/a.mjs` 29,406 → ≈ 35,565 (E3) → ≈ 33,300 (E6); `ui --file src/a.mjs`
≈ 32,579 (off the list by D5); `inspect --file package.json` ≈ 45,068 (E3), a split read throughout. Nothing is
deleted; the one placement decision is the `npm-packages.md` cap, and E3 exits green on every pin.

**The single-read list, exactly** (§ 17, O7 — ledger 2.6; this replaces "the list of D5 and the new config scopes").
The test at `tools/rules.test.mjs:252` pins these scopes and no others; each must be ≤ 32,768 B, the numbers are the
after-estimates above and E1.S5 writes the measured ones:

| Task | Pinned files | After (B) | Note |
|---|---|---|---|
| `inspect` | none · `src/x.cs` · `src/x.csproj` · `ui/a.ts` · `tsconfig.json` · `.npmrc` · `Directory.Build.props` · `src/a.mjs` · `src/webview/page.ts` | ≤ 24,507 · ≤ 29,140 · ≈ 30,070 · ≈ 29,060 · ≤ 27,810 · ≤ 28,007 (`.npmrc` now selects `npm-packages` ≤ 3,500 B, § 18) · ≈ 25,660 · ≈ 29,060 · ≈ 29,060 | the four kept from today, plus `tsconfig.json`/`.npmrc` (E1's), plus the three that fit today and were unpinned without a reason — pinned now (adding a guarantee is allowed; `.npmrc` selects nothing and `src/webview/page.ts` equals `ui/a.ts` by selector, both pinned so a later selector cannot change that silently) |
| `ui` | none · `tsconfig.json` · `.npmrc` · `Directory.Build.props` | ≤ 26,720 · ≤ 30,020 · ≤ 30,220 · ≈ 27,870 | `ui` with a language file is off the list by D5 (approved baseline) |
| `gpu` | none · `src/x.cs` · `tsconfig.json` · `.npmrc` · `Directory.Build.props` | ≤ 27,980 · **≤ 32,613** · ≤ 31,280 · ≤ 31,480 · ≈ 29,130 | `gpu --file src/x.cs` stays, § 16 |
| `storage` | none · `tsconfig.json` · `.npmrc` · `Directory.Build.props` | ≈ 28,600 · ≤ 31,900 · ≤ 32,100 (after E6; at E3's exit ≤ 32,706 B, the tightest `.npmrc` pin, which sets `npm-packages.md` ≤ 3,300 B as the hard cap — § 5 "after E3") · ≈ 29,750 | `storage` with a language file is over today and stays unpinned |

Twenty-two pins. `Directory.Build.props` selects `csharp.nuget-packages` (≈ 1,000 B after E2's moves, 3,081 B today — so
the four `Directory.Build.props` scopes fit today too: 27,288 / 29,501 / 30,761 / 32,487). Every other scope that fits
after this plan but is not in the list is one of: a `gpu`/`storage` scope with a `.ts`/`.mjs`/`.cs` file (over today, § 5),
a mixed scope (over today), a `package.json` scope (over today), or a Rust scope (over today) — none of those fits
today, so none is a guarantee the baseline gave — or one of the two `.mjs` scopes that DO fit today because nothing
selects a `.mjs` file yet: `gpu --file src/a.mjs` (27,680 B) and `storage --file src/a.mjs` (29,406 B), whose reasons
for staying unpinned are in their rows above (the approved § 4.4 placed them where those tasks stand with a `.ts` file;
the E1 stories' O5 corrected the first wording "none fits today"). Each is named in the table above with its number.

**Byte allowances per epic** (E1's exit criterion): E2 ≤ 4,000 B `common/dependencies.md`, ≤ 3,300 B `npm-packages.md`
(the "after E3" cap; the first 3,500 B assumed E6's utc move had happened),
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
| **The TypeScript toolchain — a conflict the owner must reconcile (Q2):** this plan's D7 binds the family to ONE tested combination, Node 26 LTS + TypeScript 6.0.x + typescript-eslint 8.72.x (peers `<6.1`); the other plan's D6 pins **TypeScript 7.0.2** for the Node stack today | the owner, through Q2's override: either the experiment's Node arm runs TypeScript 7 without type-aware lint (a recorded change here with its parity consequence — the lint rows of P2/P3 become `deliberately-absent` with that reason) or the other plan moves to the D7 combination | the other plan's pre-registration records whichever the owner chose and why; until then D7 holds here and nothing blocks E3/E4 (§ 20) |
| **The C# task workspaces are prepared and LOCKED before measurement** (G2 option A, § 3.3): `packages.lock.json` generated and committed in every `csharp/<task>/` workspace at the pinned task-repository sha, `RestorePackagesWithLockFile` and `RestoreLockedMode` in place, so a C# agent inherits a locked restore exactly as a TypeScript agent inherits `package-lock.json` and `npm ci` — neither pays a migration during a measured session | the other plan's E1 (the task repository's workspaces), using the rule this plan ships | this plan names the requirement and the fixture; the other plan's pre-registration records both locks' hashes beside the package-set hashes |

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
| `research/moved-blocks.json` | ≈ 5 KB, one entry per moved range (25 after the exact-range split of § 4.3 and E1.S0b; the E1 stories' count — "≈ 14" was the block count before ranges), plus provenance entries | immutable historical evidence: original source hashes and lengths are never edited; a later move or edit appends a provenance entry that supersedes, never replaces, the earlier one (§ 4.3) | — |
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
| T11 | **The resolver change (D3) is read as a loophole** — a rule gated to avoid a budget rather than to match its source's tasks | gates follow the requirement's PROVENANCE (§ 4.3): a gate that MIRRORS existing rule text equals that source's `tasks:` line, asserted by the test; a gate is DECLARED only for a new requirement or an applicability changed on purpose and approved in this plan (eight today — the two `definition-of-done` files, the two `boundaries` files, `typescript/testing.md` (ledger 3.1), `typescript/lifecycle.md`, `typescript/logging.md`, `typescript/utc-timestamps.md` — § 4.4 names which is which and why), with a reason in `research/selection-matrix.json`; and every gated rule has positive and negative selection cases pinned there, so editing the declaration and the front matter together cannot make a wrong gate pass — an undeclared, unreasoned or case-less gate is red (§ 17, O3 — ledger 2.2; the first wording, "every gate equals its source", could not hold for a file with no source, and "new file" as the criterion was wrong too: `typescript/boundaries.md` inherits doctrine text); `module_rules.md` states both legitimate uses |
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
  single-read scope test with the exact twenty-two-scope list of § 5, the always-core budget, the parity-matrix test
  and the inventory↔matrix one-to-one test (§ 4.1), the byte-equality test over the moved blocks against the commit
  right before each move (§ 4.3), the `http-coverage` test that a Node route table in the `--routes` shape is read and
  compared, the new check's fixtures (§ 4.6; a repository with no TypeScript passes; the hoisted-install fixture passes;
  a TypeScript repository where no `typescript` package resolves is INCOMPLETE; `.ts` files with no project are a
  finding with the exact line of § 4.6; the .NET half's five fixtures, the defaults-only VALID one and the two
  suppression INVALID ones among them), the moved-blocks manifest test (a `planned` entry: schema and source bytes only;
  an activated entry: its bytes found by CONTENT, exactly once, anywhere in the destination — ledger 4.1; no git history
  read), the `stronger-*` whitelist rule of the matrix test (an id
  outside `['P4']` with that status fails, with or without a reason), the `planned`-needs-an-owning-epic rule, the two
  equality tests of § 4.1 (the two sides' recorded `selectors`/`mood`/`enforcement`/`consequence`/`suppression` must
  match; the recorded fields must match the rule's real front matter, its heading's mood and the check tool's exported
  rule list), the `selection-matrix.json` regeneration test, and — at every story — the catalog loads with every
  placeholder file's front matter valid.
- The epoch 4 round's fixtures (§ 19): the real-row equality proof — P2 and P3 with their ACTUAL planned delivery sets
  pass through the union comparison, and the negative fixture that removes the TypeScript source-file statement fails
  (E1.S3); the JavaScript-lint half's negative fixture (`package.json` + `src/app.mjs` with `console.log`, no
  `tsconfig`, no TypeScript dependency, no lint script → the lint finding) and a positive one with a conforming `lint`
  script (E3.S2); the superseding-entry fixture of the recorder (a changed planned block → a new entry with
  `supersedes`, the old one marked `supersededBy` and otherwise unaltered — E1.S4); **the real-catalog manifest
  assertion** — every `moved-blocks.json` entry whose owning epic is in the test's `LANDED_EPICS` list has its
  destination bytes equal to the recorded hash — runs in the epic that completes `LANDED_EPICS` for it, never before
  (E1's plan round, brief fix 5).
- **One concrete fixture per contract, green before E2's stories begin** (E1's Done-when; § 17, consult `e1c58f6d`),
  so the next stories writer does not stop the plan again: selection — one positive and one negative case per gated
  rule (scope → selected / not selected); equality normalisation — one `equal` pair that passes through the
  correspondence table and one deliberate mismatch that fails; heading inheritance — a section marked only by its H1
  (`common/reliability.md`'s `### A timeout…`) read as MANDATORY, and a section with no marker anywhere above it read as
  SHOULD; moves — one exact whole-line range entry, one fence-balanced case (a block that would split a fence is
  refused), one mid-line case (refused by the whole-line recorder, with E1.S0b's whitespace split as the remedy);
  G2's enforcement — **E1's, green at E1's exit, as the approved baseline `2ee02c4` required** (restored by consult
  `354b1a67`, § 19 — the epoch 4 draft had moved them to E2, which would have relaxed a DoD timing condition; E2 keeps
  the lock POLICY text and the consumer-facing mechanics) — a NuGet fixture whose
  `packages.lock.json` is stale against its declaration fails `dotnet restore --locked-mode -m:4` with `NU1004` and
  passes after `--force-evaluate` (observed, § 3.3), and an npm fixture whose lock does not satisfy `package.json`
  fails `npm ci` with `EUSAGE` (observed, § 4.3). **The NuGet fixture
  runs where a `dotnet` SDK exists and is a NAMED, visible `t.skip` where it is missing LOCALLY — and in CI it is never
  skipped: E1 adds a job to `ci.yml`, `tools · lock fixtures` — it RUNS on every pull request and is REQUIRED on
  `release` (`.github/branch-protection.json`) — with
  `actions/setup-dotnet@a98b56852c35b8e3190ac28c8c2271da59106c68 # v6.0.0` (pinned by sha with the version in a
  comment, the style of every `uses:` in that file) at the .NET 10 SDK the fixture's own `global.json` pins
  (`rollForward: latestPatch`), running the two lock fixtures on every pull request, so `NU1004` is exercised on every
  change; under `CI` the test FAILS when `dotnet` is missing instead of skipping (detected through the `CI` environment
  variable GitHub sets). Cost: one extra job, about a minute (the epoch 4 round, § 19). **Superseded in place (D1):**
  "this repository's CI installs Node only (`ci.yml`) and E1 does not add `setup-dotnet`" — the E1 stories' O6 choice,
  revised inside the re-review; the local skip's name still says what was not proven, so a green local run never reads
  as the fixture having passed.
- The epoch 3 round's fixtures (§ 18): an unrestored .NET project → INCOMPLETE and a restored one → evaluated (finding 2);
  the inline-suppression fixtures on both sides — a file-wide `eslint-disable` without a rule id, an `eslint-disable`
  line without a same-line reason, the valid form; a `#pragma warning disable` without an id, one without a same-line
  reason, the valid form (finding 4); a TypeScript project including `.mjs` files without `checkJs` → a finding
  (finding 5); the normalised-selection test's manifest case: `dependencies --file package.json` and `dependencies --file
  src/x.csproj` select the same rule kinds (finding 3).
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
      C# analyzer package is a dependency decision for every .NET consumer, Q7). **G2 is `equal`** (the epoch 3
      re-review reversed ledger 2.1's whitelisting: .NET consumers commit `packages.lock.json` and restore in locked
      mode, for the owner to confirm 2026-11-01). The matrix test holds the same list (`['P4']`) and fails any other
      row with that status; any other `stronger-*` row is a plan change, not an exception.
- [ ] G2 delivered on both sides: every .NET-bearing consumer has `RestorePackagesWithLockFile`, a committed
      `packages.lock.json` per project and a locked-mode restore in CI; every TypeScript-bearing consumer has its
      committed `package-lock.json` and `npm ci`; both enforcement fixtures of § 10 are green.
- [ ] E1's fixtures of § 10 (selection, the real-row union equality with its negative, heading inheritance, the three
      move cases and the superseding entry) AND the two lock fixtures (`NU1004`, `EUSAGE`) were green at E1's exit,
      before E2's stories document was written — the timing the approved baseline set (§ 19); the NuGet fixture runs
      in the required `tools · lock fixtures` CI job (`setup-dotnet` pinned by sha) and is never skipped in CI.
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
      and every gated rule's gate mirrors its requirement's source `tasks:` line — or, where the requirement is new or
      its applicability was changed on purpose in this plan, equals the gate declared with a reason in
      `research/selection-matrix.json` — and every gated rule has its positive and negative selection cases pinned
      there (all asserted, § 17 O3).
- [ ] The language-scoped rules of § 4.3 exist with the metadata of § 4; `csharp/nuget-packages.md` has no `tasks`; the
      selectors of § 4.4–4.5 are in place and the per-scope id lists are tested.
- [ ] The always core ≤ 16,384 B with its additions ≤ 300 B; every scope in the exact twenty-two-scope single-read list
      of § 5 ≤ 32,768 B, `gpu --file src/x.cs` among them (measured ≤ 32,613 B after E3's `Nullable enable` line and
      E5's core phrases); the before/after table is in `research/module_rules.md`.
- [ ] The TypeScript rules state and the consumers adhere to D7's pinned combination — Node 26 LTS, TypeScript 6.0.x,
      typescript-eslint 8.72.x (peers `<6.1`) — with its read date; D7 is binding (§ 20). Q2 is an OWNER OVERRIDE only:
      if the owner chooses TypeScript 7 without type-aware lint, that is a recorded change with its parity consequence
      (the lint rows of P2/P3 become `deliberately-absent` with that reason); the conflict with the benchmark plan's
      TypeScript 7.0.2 pin is named in § 6 for the owner to reconcile.
- [ ] `tools/strictness-check.mjs` exists with both halves, finds `tsc` through package resolution (and passes the
      hoisted-install fixture), applies two predicates (the compiler predicate and the JavaScript-lint predicate — § 4.6,
      § 19, P21), reads the effective configuration on both
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
      the `strictness-check` step — with `--warn` in the bump, flipped to ENFORCING mode (non-zero on findings) in the
      same pull request that merges that consumer's remediation story (E7.S1b), the README's adoption rule — so that
      at the end of E7 every such consumer runs it enforcing (required — P2's equality is delivered by the wiring;
      `rust` per Q8).
- [ ] Every consumer's remediation story (E7.S1b) merged: locks generated and committed, suppressions registered or
      justified per § 3.4, the `tsconfig` flags and `.npmrc` in place — counted against the dry run's findings list,
      which is the budget.
- [ ] `research/consumers.json` exists, equals the README table, and every consumer count in this plan is derived
      from it; `research/moved-blocks.json` holds one entry per moved block.
- [ ] The experiment's task repository pins the release (reported by the other plan's E0.S3); the sha here and there
      agree; the per-arm record's commands (D13) are handed over.
- [ ] This plan promoted to `research/` with its deviations, in the same task as the last bump.

## 12. Open questions

Not settled here; the owner or the named epic decides. No answer is invented.

- **Q1 .NET lock files — decided A under owner absence, for the owner to confirm 2026-11-01** (§ 3.3 G2, § 17): .NET
  is raised to `packages.lock.json` + a locked-mode restore (`RestorePackagesWithLockFile`, `RestoreLockedMode`/
  `--locked-mode`), G2 is `equal`, the whitelist stays `['P4']`. **History:** ledger 2.1 first closed Q1 the other way
  (G2 whitelisted `stronger-ts`, "NuGet's lowest-applicable resolution already makes the graph deterministic"); the
  epoch 3 re-review (consult `e1c58f6d`) refuted that — resolution changes when a missing version is published later
  or a package is unlisted, Microsoft documents lock files for repeatable restores — and found that admitting G2 as an
  exception against epoch 2's explicit "only P4" would itself be a narrowing. The question as first asked: *raise .NET
  to `packages.lock.json` + `dotnet restore --locked-mode` (a change in six consumers), or record the asymmetry?*
- **Q2 The TypeScript toolchain — an OWNER OVERRIDE, not an open decision** (§ 20). D7 is binding: Node 26 LTS,
  TypeScript 6.0.x, typescript-eslint 8.72.x (peers `<6.1`), one tested combination, and nothing in E3/E4 waits on this
  question. The owner MAY override it and choose TypeScript 7 without type-aware lint; that is a recorded plan change
  with its parity consequence (the lint rows of P2/P3 become `deliberately-absent` with that reason), and it would also
  have to say what stands in for `no-floating-promises` and the complexity rule meanwhile. **The reason the question
  stays open:** the benchmark plan (`dew_flow_benchmark · todo/PLAN_lang_comparison_v2.md`, D6) pins TypeScript 7.0.2
  for the Node stack today, which conflicts with D7 — § 6 names it for the owner to reconcile.
- **Q3 The single-read list.** D5 takes `ui --file ui/a.ts` out of it so the webview trap reaches `ui`. Numbers: with
  `ui` in the boundaries rule's gate ≈ 33,570 B; without, ≈ 31,300 B and the trap does not load for the task it was written
  for. **Superseded in part (§ 16):** "`gpu --file src/x.cs` is estimated at ≈ 32,660 B (105 B left) once the C#
  Definition of Done lands" — the Definition of Done is gated away from `gpu` and the scope is ≤ 32,613 B, on the list;
  what remains open is only whether the owner wants `ui --file ui/a.ts` back on the list at the price of the webview
  trap not loading for `ui`.
- **Q4 The check's reader.** `tsc --showConfig` from the consumer's own `node_modules` (the compiler resolves `extends`;
  INCOMPLETE when absent), or a JSONC parser of our own (a new dependency, and a second implementation of `extends`)?
- **Q5 — closed 2026-10-31 in the epoch 4 re-review (§ 19, § 20):** `.js/.mjs/.cjs` and `**/package.json` select the
  TypeScript doctrine, landing in E3 with the minimal P2/P3 statement (consult `354b1a67`); this repository's own
  `tools/*.mjs` then load the doctrine on an `inspect` (§ 5). E3 waits on nothing here. The question as first asked:
  *confirm, or leave plain JavaScript with the always core only, as `ENTRY.md:57-58` allows?*
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

## 17. Epoch 2's stop and the re-review revision for epoch 3 (2026-10-31)

The Opus E1 stories writer (`feat/rule-parity-e1`, `72aaf8c`, `todo/PLAN_node_rule_parity_E1.md` § *Open points*)
found that the plan could not be built as written in twelve places. Six are changes (a contract, an approach — one
cause each, ledger 2.1–2.6; the second stopped the plan, step 1 in commit `347d08b`); six are repaired references or
fixes that only satisfy the plan as written (O2, O8–O12), applied here without an entry. This section is step 4 of the
full stop: the whole plan revised for epoch 3. Its decisions are the baseline the next round approves, not entries.
O1 was decided by the question consultants (consult `1f4d8688`: one reviewer chose raising .NET, one chose the
whitelist; the team lead chose the whitelist and verified the resolution fact) because the owner was away — marked for
the owner to confirm on 2026-11-01.

| # | Open point | Decision (where) |
|---|---|---|
| O1 (2.1) | G2 had no admissible status | **Revised in this re-review (consult `e1c58f6d`): option A.** Ledger 2.1 had whitelisted G2 as `stronger-ts` on "NuGet's lowest-applicable resolution already makes the graph deterministic"; the consultant refuted it — the resolution changes when a missing version is published later or a package is unlisted, and Microsoft documents lock files for repeatable restores — and admitting G2 against epoch 2's explicit "only P4" would have been a narrowing. So .NET consumers commit `packages.lock.json` (`RestorePackagesWithLockFile`) and CI restores in locked mode; G2 is `equal`; the whitelist stays `['P4']`; the enforcement was observed (`NU1004` on a stale lock, pass after `--force-evaluate`); the benchmark's C# workspaces are locked before measurement (§ 6). 2.1's text stays in the ledger as history. Q1 reads "decided A under owner absence, for the owner to confirm 2026-11-01" (§ 2, § 3.3, § 4.5, § 6, § 10, § 11, Q1, E2, E7) |
| O2 (not an entry) | § 4.1 still required a matrix `reason` for `deliberately-absent` | § 3.3/§ 11 win: a `deliberately-absent` row carries no matrix reason; the inventory holds it (§ 4.1) |
| O3 (2.2, the stop) | T11 cannot hold for four planned gated files with no source rule | Gates by the requirement's PROVENANCE, not the file's age (consult `e1c58f6d`): a gate MIRRORS when the text comes from an existing rule (its `path_tasks` = the source's `tasks:`; a path-only source mirrors as no gate); a gate is DECLARED only for a new requirement or an applicability changed on purpose and approved in the plan, with a reason — `typescript/boundaries.md` inherits doctrine text, so its gate is the approved applicability change, not a "new file"; positive and negative selection cases are pinned per gated rule independently of the declaration (§ 4.3, § 4.4, T11, § 10, § 11, E1.S5) |
| O4 (2.3) | The doctrine rows cannot be `equal` while one doctrine selects a project file and the other does not | "The same kind of scope" is defined as the stack's source files plus its project manifest; `typescript/doctrine.md` gains `**/package.json` (its `package.json` scopes are split reads already, so no budget moves); `tsconfig*.json` stays a kind of its own because adding it would break three pins (§ 2, § 4.4) |
| O5 (2.4) | Four moves were not exact ranges; a NuGet split would unbalance a fence | A move is a list of exact whole-line ranges, each its own manifest entry; reliability moves the whole bullets `:49-54`, `:55-59`, `:66-69`, `:97-98`, `:99-102` (and `:104-133`), utc the whole fenced block `:41-47`; dated audit sentences inside neutral paragraphs stay (the D6 kind); every count of moves is the manifest's. **Refined by consult `e1c58f6d` turn 2:** a mixed-content line is split by WHITESPACE ONLY in E1.S0b (the no-shortening check: the text with all whitespace removed is identical before and after), so `common/testing.md:33`'s "Everything below applies everywhere." and `csharp/nuget-packages.md:41-43`'s .NET-only cadence sentence each get their own line/paragraph and whole-line ranges follow, with every original word staying in place — this replaces "add a new neutral sentence". The NuGet contract settled: `:25-29` (licence, "in any ecosystem") moves, `:31-37` (the FluentAssertions and Aspire decisions — NuGet facts) stays, the `## Bumping` heading and its neutral paragraph move, the .NET sentence and the `powershell` fence `:45-48` stay under a new heading (§ 4.3, § 4.5, E1.S0b, E1.S4, E2, E4) |
| O6 (2.5) | `MANDATORY` on the section heading only, or inherited | Inherited from the nearest ancestor heading that carries a marker, the H1 included; the fields-against-reality test reads it so (§ 4.1) |
| O7 (2.6) | No exact single-read list | § 5 names the list: twenty-two pins with their bytes — the eight kept from today, `tsconfig.json` and `.npmrc` under each single-read task, and the six fitting scopes the stories found unpinned (`Directory.Build.props` ×4, `inspect --file src/a.mjs`, `inspect --file src/webview/page.ts`), pinned now; every other fitting scope is named with the reason it is not a baseline guarantee (§ 5, § 10, § 11, E1.S5) |
| O8 (not an entry) | Two names the anonymisation list missed | E1.S0's list gains `:37` "a synced vault" → "a synced credential store" and `:39` `scriptInterpolation.test.ts` → "the scan test" (E1) |
| O9 (not an entry) | `:50-54` is 286 B | Corrected; 287 B counted the blank `:55` (§ 4.3) |
| O10 (not an entry) | Leftover sentences kept § 2 in the doctrine or counted three moves | § 2 and its box move to `typescript/testing.md`; every count is the manifest's (§ 4.4, R3, E4) |
| O11 (not an entry) | "the commit right before the move" vs "recorded now" | Equivalent: a planned entry is recorded at E1's commit, and the planned check requires the bytes to be still present and unchanged at the source until the move (§ 4.1, E1.S4) |
| O12 (not an entry) | E1's scope line was short; E6 listed `typescript/boundaries.md` as new | E1's scope names the inventory, consumers, selection-matrix and moved-blocks files, `tools/moved-blocks.mjs`, `tools/selection-matrix.mjs`, `tools/lib/parity-epics.mjs`; E6 fills the two files E4 created (E1, E4, E6) |

**The consult for step 3 — the problem text as sent**, quoting every change of epoch 2 as evidence:

> The plan `todo/PLAN_node_rule_parity.md` (epoch 2, approved 2026-10-31 by reviewers at `400d878`+`01d1bbf`) stopped
> at its second change the same day. The six changes, verbatim from the ledger: *2.1 · contract — E1 stories O1: G2
> (the lock file) had no admissible status; … whitelisted as `stronger-ts` with its reason; Q1 closed, for the owner to
> confirm 2026-11-01.* *2.2 · contract — E1 stories O3: T11 ("every gate equals its source rule's `tasks:` line") cannot
> hold for the four planned gated files that have no source rule.* *2.3 · contract — E1 stories O4: the doctrine rows P1,
> P5, P7 and P20 cannot be `equal` under § 2 (a) while `csharp/doctrine.md` also selects `.csproj` and the TypeScript
> doctrine selects source files only.* *2.4 · approach — E1 stories O5: four § 4.3 moves were not exact line ranges
> (reliability's sentences, the .NET text of `utc-timestamps`, the NuGet `:39-47` split inside a code fence), so E1 could
> not record them.* *2.5 · contract — E1 stories O6: whether `MANDATORY` is read from the section's own heading only or
> inherited from an ancestor heading.* *2.6 · contract — E1 stories O7: "the list of D5 and the new config scopes" named
> no exact single-read list; six scopes that fit today were unpinned without a reason.* The question for the re-review:
> does the plan's model of the work drift — six build-time contradictions found by the first stories writer in one
> reading — or are these the ordinary gap between a plan's prose and a test's contract? Specifically: (1) is "a NEW gated
> file declares its gate with a reason, and the test checks the declaration" a loophole in T11 or its correct form;
> (2) is "source files + project manifest" the right definition of equal scope kind, given that `tsconfig*.json` cannot
> join the doctrine without breaking three single-read pins; (3) is whitelisting G2 as `stronger-ts` (NuGet lowest-wins
> vs npm highest-wins) sound, or should .NET be raised to a locked restore; (4) is anything in the epoch 3 revision
> (§ 17) a narrowing against the epoch 2 baseline?

**Probe for R-4** (SDK 10.0.114, 2026-10-31, the same scratch project): a clean project with no `NoWarn` anywhere
answers `dotnet msbuild probe.csproj -getProperty:NoWarn -getProperty:WarningsNotAsErrors -m:4` →
`"NoWarn": "1701;1702"`, `"WarningsNotAsErrors": ""` — the SDK's own defaults, which is why a raw non-empty `NoWarn`
cannot be the finding. With a `Directory.Build.props` carrying `<NoWarn>CS1591;$(NoWarn)</NoWarn>` and
`<WarningsNotAsErrors>CS8600</WarningsNotAsErrors>` the same call answers `"NoWarn": "CS1591;"`,
`"WarningsNotAsErrors": "CS8600"` (note: the SDK's `1701;1702` did NOT survive the override — the effective value is
what the repository wrote, so comparing against the clean baseline shows the difference in both directions). Both
readings exit 0.

## 18. Epoch 3 plan round (2026-10-31) — five findings, the baseline, and the resume

`mcp__coai__review_plan` over the epoch 3 revision (`9cf6649`): verdict **`proceed`**, both reviewers answering, five
findings — all accepted and applied as the re-review baseline, not entries. Step 8 of the full stop then resumed the
plan: epoch 2 `closed`, epoch 3 `open` at 0 changes.

| # | Finding | What changed |
|---|---|---|
| 1 | No consumer meets the suppression and lock requirements yet; enforcing on day one would redden every build | E7 follows the README's own adoption rule: S1's dry run lists findings per consumer with `--warn`; **S1b remediation stories** (one per consumer kind, split per consumer in E7's stories document) generate the locks, register or justify suppressions per § 3.4, add the `tsconfig` flags and `.npmrc`; each flips that consumer's CI step to enforcing in the same pull request; enforcing stays the END state and § 11's box; the budget is the dry run's findings list, seeded with today's counts (270 + 16 `eslint-disable` lines, one missing `noEmitOnError`, four `.npmrc` files, zero .NET locks across six consumers, zero `NoWarn` found) (§ 4.6, § 11, E7) |
| 2 | `dotnet msbuild -getProperty` on an unrestored project can answer defaults or fail | The .NET half runs it only after a successful locked restore; otherwise INCOMPLETE, never a false finding; fixtures for an unrestored and a restored project (§ 4.6, § 10, E3.S2) |
| 3 | Manifest selectors were asymmetric | Mapped through the correspondence table: the doctrines select `.csproj` ↔ `package.json`; the package rules select `.csproj`/`Directory.*.props`/`NuGet.Config` ↔ `package.json`/`.npmrc`; a `dependencies` scope on either manifest evaluates the same rule kinds, asserted by the normalised-selection test; the `.npmrc` pins re-measured (`storage --file .npmrc` ≤ 32,100 B after E6 — and ≤ 32,706 B at E3's exit, which is what sets `npm-packages.md` ≤ 3,300 B as the hard cap (§ 5 "after E3"; the 3,500 B of the first measurement assumed E6's utc move had happened); `inspect --file package.json` ≈ 43,600 B, a split read as before) (P20, § 4.1, § 4.4, § 4.5, § 5) |
| 4 | Suppression equality held by prose only | `strictness-check` rejects a file-wide `eslint-disable` without a rule id and any `eslint-disable` line without a same-line `-- reason`; a `#pragma warning disable` without a warning id or without a same-line `// reason`; fixtures for both violations and the valid form on each side (§ 3.4, § 4.6, § 10, E3.S2) |
| 5 | The typed doctrine (branded types, typed results) cannot apply to plain JavaScript as written | Chosen by enforceability: option (a) — JavaScript inside a TypeScript project is type-checked (`allowJs` + `checkJs` under `strict`, JSDoc types) and follows the doctrine, `equal`; the check requires `checkJs` where a project includes `.js/.mjs/.cjs`; in a repository with no TypeScript project the typed parts are `deliberately-absent` with the reason in the inventory and § 0's JavaScript paragraph states the enforceable subset (`Object.freeze` at the boundary, Result objects, boundary validation, complexity ≤ 4 and `no-console` by lint); option (b), a separate JavaScript rule, rejected as a second body and a competing selector (P5, § 4.4, § 4.6) |

## 19. Epoch 3's stop and the re-review revision for epoch 4 (2026-10-31)

After epoch 3's one allowed change (3.1), the cadence consult for epics 1–3 (`69c2eb3f`, two turns) found three contract
problems; the first was verified in the text. Each is an independent cause (ledger 3.2–3.4; the second stopped the plan,
step 1 in commit `3b38a96`). This section is step 4: the whole plan revised for epoch 4 — baseline, not entries; every
guarantee stays and only the timing and the form change, which is why the re-review record says `Narrowed: no`. E1's
own plan round (passed; five brief-level fixes accepted for its stories document, two "setup-dotnet in CI" findings
rejected on O6's repair) is folded in where the plan states those things.

| # | Cause | Decision (where) |
|---|---|---|
| 3.2 (the stop) | The equality model could not express a requirement that lives in different rule locations per side; the normalised-selection test compared source-file sets, so the real P2/P3/P4 rows could never pass | **(a)** A matrix row lists, per side, a SET of `delivery` locations (id + section) and, apart from it, the `enforcement` evidence; equality compares the UNION of the delivery locations' selection behaviour over the correspondence table (the configuration kind still apart), never pairwise file equality, and a compiler-check location never implies its instructions reach a source-file scope. PROVEN on the real rows in E1.S3 before any generic machinery: P2/P3 with their actual planned delivery sets pass; a negative fixture that removes the TypeScript source-file statement fails. **Timing (turn 2):** E3 activates P2/P3 against the post-E3, pre-E4 catalog, so E3 lands the minimal source-file statement in `typescript/doctrine.md` (≤ 250 B; E4's § 0 absorbs it) — the activation is not postponed. P4 stays the explicit `stronger-ts` exception, not forced through the equal-enforcement assertion (§ 3.1 P2, § 4.1, E1, E3) |
| 3.3 | E3's applicability predicate skipped the plain-JavaScript repository whose lint subset § 4.4 promises | **(b)** Two predicates in E3's check: the compiler half (a TypeScript project or dependency) and the JavaScript-lint half (any `.js/.mjs/.cjs` outside `node_modules`); the negative fixture — `package.json` + `src/app.mjs` with `console.log`, no `tsconfig`, no TypeScript dependency, no lint script — produces the lint finding. The JavaScript floor is its own matrix row, **P21** (the compiler floor under every `.cs` ↔ the lint floor under every `.js`), chosen because a row is testable against the check's exported rule list; P5 keeps `scopedAbsences` for the typed parts (§ 3.1 P21, § 4.6, § 10, E3) |
| 3.4 | E1 front-loaded work E2/E3 do not need | **(c)** E1 slimmed to the contracts and their fixtures: KEPT the selection baseline, caps and pins, the gate semantics with provenance, a MINIMAL matrix/inventory schema with its completeness test and the real-row proof, the reusable move verifier (recorder + checker + its own fixtures), S0 and S0b (they must precede any recording), **the two lock fixtures (restored by consult `354b1a67` — moving them to E2 would have relaxed the approved baseline's "green before E2's stories" timing)**, and **a small BASELINE in `moved-blocks.json`: one `planned` entry per move range with its source, line range and `sha256` at E1, no destination** (consult `354b1a67` — recording only at the move could not detect a source change between E1 and the move; the owning epic's recorder requires equality with the baseline or a superseding entry with an independently justified `justifiedBy` commit). MOVED: the full destination entries to the owning epics (right before the move — E2 the NuGet ranges, E4 the doctrine's, E5 reliability's, E6 testing's/logging's/utc's); the gate declarations and selection cases to the epic that lands each file; the consumer inventory to E7 (its dry run is the first need). `moved-blocks.json` stays append-only with the superseding procedure defined (§ 4.3). Cornerstone areas unchanged: E3, E4, E5 (§ 4.1, § 4.3, § 4.4, § 10, § 11, E1–E7) |
| the epoch 4 round | `mcp__coai__review_plan` over `3919214`: `proceed` (one reviewer read the whole plan; the other did not receive it whole), two findings accepted as baseline | (1) **The NuGet lock fixture runs in a REQUIRED CI job**: `tools · lock fixtures` in `ci.yml` with `actions/setup-dotnet@a98b56852c35b8e3190ac28c8c2271da59106c68 # v6.0.0` (sha-pinned with the version comment, as every `uses:` in that file; resolved 2026-10-31 with `gh api repos/actions/setup-dotnet/git/ref/tags/v6.0.0`) at the fixture's pinned .NET 10 SDK, required on `release` beside `tools · selftest` and `workflows · actionlint`; a local run without an SDK may skip it by name, CI never does and FAILS when `dotnet` is missing (the `CI` variable); cost one job, about a minute; O6's "CI installs Node only, E1 adds no setup-dotnet" is superseded in place (§ 10, § 11, E1). (2) **A narrow, reviewed exception to `npm ci --ignore-scripts`**: the default stays; a consumer lists the exact packages that need a lifecycle script in a committed allow-list with a reason each; CI runs `npm rebuild <pkg>` for those only; the check verifies the list is exact (no wildcard) and each listed package has an install script; .NET `deliberately-absent` — NuGet has no install scripts (§ 3.3, § 4.5, E2.S3) |
| consult `354b1a67` | The re-review consult's five points and its second turn | (1) E3 owns the doctrine's selector expansion (`.js/.mjs/.cjs`, `package.json`) with its budget, because the union equality needs it at E3's exit — a `dependencies --file package.json` scope selects the C# doctrine through `.csproj` and the TypeScript union would select nothing (§ 4.1, § 4.4, E3, E4); (2) P21's symmetric findings: the .NET half reports an orphan `.cs` outside any project, the lint half checks file COVERAGE (a `.js` dropped by `ignores`/`overrides` is a finding) — fixtures for both (P21, § 4.6, E3); (3) the baseline hash inventory in E1 (above); (4) the lock fixtures restored to E1 (above), so `Narrowed: no` holds with no DoD timing condition relaxed; (5) the real-row proof uses only the artifacts and selectors available at the owning epic's exit — the source, JavaScript and manifest scopes included — applied to P2/P3 at E3's exit, and each later epic runs the same proof for its rows at its exit (§ 4.1, E3–E6). **Turn 2:** (a) the intermediate budget after E3 and before E4 measured for all twenty-two pins — every pin fits, provided `npm-packages.md` ≤ 3,300 B (not 3,500: `storage --file .npmrc` is 29,406 + the rule until E6's utc move), with `storage --file tsconfig.json` at ≤ 32,706 B (62 B of headroom until E6); the unpinned JavaScript scopes are split reads in the interim and improve at E4 (§ 5 "after E3"); (b) a superseding baseline entry cites the commit that changed the source block OUTSIDE the move (`justifiedBy`), the checker verifies the commit exists and touches only the source, and a move commit may never also change the block's words (§ 4.3) |
| brief fixes | E1's plan round, five accepted | (1) the recorder writes one JSON array and inserts the comma between entries (§ 4.3, E1.S4); (2) the "no scope would select" clause of the stories' scenarios 1.10–1.15 is replaced by the negative-case definition of § 4.4; (3) the superseding procedure (§ 4.3); (4) O1 is settled by ledger 3.1; (5) the real-catalog manifest assertion runs in the epic that completes `LANDED_EPICS` for the entry, never before (§ 10) |

**The consult for step 3 — the problem text as sent**, quoting every change of epoch 3 as evidence:

> The plan `todo/PLAN_node_rule_parity.md` (epoch 3, approved 2026-10-31 by reviewers at `2ee02c4`) took its one
> allowed change and then stopped at its second, the same day. The changes, verbatim from the ledger: *3.1 · contract —
> E1 stories O1: `typescript/testing.md`'s gate had no form the provenance rule accepts …; approved as the fifth declared
> gate, `implement, test, audit, policy, release`.* *3.2 · contract — cadence consult `69c2eb3f`: the equality model
> cannot express a requirement that lives in different rule locations per side; P2, P3 and P4's C# side is
> `csharp/doctrine.md` (`.cs/.razor/.csproj`) and their TypeScript side is `typescript.compiler-strictness`
> (`tsconfig*.json`), so the normalised-selection test that compares source-file sets can never pass the real rows.*
> *3.3 · contract — cadence consult `69c2eb3f`: E3's applicability predicate (a TypeScript project or dependency) skips
> exactly the plain-JavaScript repository whose lint subset § 4.4 promises — `package.json` + `src/app.mjs` with
> `console.log`, no `tsconfig`, no TypeScript dependency, no lint script passes without a finding.* *3.4 · epics —
> cadence consult `69c2eb3f`: E1 front-loads work E2 and E3 do not need — recording every E4–E6 move, their gate
> provenance, the consumer inventory and the lock fixtures E2 owns.* The question for the re-review: is the plan's model
> of the work drifting — three epochs stopped in one day, each by the first reader who tried to build from it — or is
> each stop the ordinary gap between a plan's prose and a test's contract, closing as the contracts are written down?
> Specifically: (1) does "a requirement may span several delivery locations per side, compared as the union of their
> selection behaviour" express P2/P3 without weakening the equality test; (2) is a second applicability predicate the
> right fix for the plain-JavaScript gap, or should the JavaScript floor be a rule of its own; (3) does moving the
> recording, the declarations, the lock fixtures and the consumer inventory out of E1 lose any guarantee E1's green
> exit gave; (4) is anything in the epoch 4 revision a narrowing against the epoch 3 baseline `2ee02c4` + 3.1?

## 20. Epoch 4's second full reading (2026-10-31) — four findings, the baseline, and the resume

The epoch 4 re-review's plan round (§ 19) had `proceed` from one reviewer with the whole plan; the second full reading,
through the document gate with all four reviewers, returned **`proceed`**. Four findings accepted as baseline (not
entries); one — "the file is truncated" — rejected, because the file is whole and that reviewer had received a cut copy.
Step 8 of the full stop then resumed the plan: epoch 3 `closed`, epoch 4 `open` at 0 changes.

| # | Finding | What changed |
|---|---|---|
| 1 | How an UNCHANGED baseline move entry is activated was undefined | A destination record with `activates: "<baseline id>"`; the checker pairs it with the immutable baseline, a paired baseline is no longer `planned`, an unpaired baseline whose epic has landed is a finding; the superseding procedure stays for changed blocks (§ 4.3) |
| 2 | Q5 was still open although the re-review decided it | Q5 closed with the pointer: the JavaScript and manifest selectors land in E3 (§ 19); E3 waits on nothing (Q5) |
| 3 | § 11 made the toolchain depend on "the operator's answer to Q2" while D7 states one tested combination | D7 is binding — Node 26 LTS, TypeScript 6.0.x, typescript-eslint 8.72.x — and § 11 requires adherence to it; Q2 is rephrased as an OWNER OVERRIDE (TypeScript 7 without type-aware lint = a recorded change with its parity consequence: P2/P3's lint rows `deliberately-absent` with that reason); the conflict with the benchmark plan's TypeScript 7.0.2 pin (its D6) is named in § 6 for the owner to reconcile; until then nothing blocks E3/E4 (§ 6, § 11, Q2) |
| 4 | § 11's strictness-check item still said "one TypeScript-repository predicate" | "applies two predicates (the compiler predicate and the JavaScript-lint predicate)", matching § 4.6, § 19 and P21 (§ 11) |

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
  matrix is a file with a test; selection is pinned per representative scope. **Slimmed by the epoch 4 re-review**
  (ledger 3.4, § 19): E1 ships the CONTRACTS and their fixtures and front-loads no epic's data — the recording of each
  move, the gate declarations, the lock fixtures and the consumer inventory belong to the epics that need them.
- **Scope (kept):** `tools/lib/rule-catalog.mjs` (`path_tasks` with provenance), `tools/rules.test.mjs`,
  `.github/workflows/ci.yml` (the required `tools · lock fixtures` job with `actions/setup-dotnet` pinned by sha, and
  its entry in `.github/branch-protection.json` — the epoch 4 round, § 19),
  `research/selection-matrix.json` (the selection baseline: pinned id lists, caps, the single-read pins; the schema for
  gate declarations and selection cases, empty of E2–E7's entries), a MINIMAL `research/parity-matrix.json` and
  `research/parity-inventory.json` (the schema, the completeness test, and the real P2/P3 rows as the proof — every
  other row `planned`), the reusable move verifier — `tools/moved-blocks.mjs` (recorder) with `tools/lib/moved-blocks.mjs`
  (checker), `research/moved-blocks.json` holding the BASELINE — one `planned` entry per move range of § 4.3 with its
  source file, line range and `sha256` at E1, no destination (consult `354b1a67`) — the two lock fixtures (`NU1004`,
  `EUSAGE` — kept in E1, green at E1's exit, as the approved baseline required), and the verifier's own fixtures —
  `tools/selection-matrix.mjs`, `tools/lib/parity-epics.mjs` (the owning-epic vocabulary the activation tests share),
  their tests, `research/module_rules.md`, `ENTRY.md` step 7. **Moved out:** the recording of E2–E6's blocks (each
  owning epic records right before it moves), the gate declarations (each owning epic declares when it lands the file),
  `research/consumers.json` and its equality test (E7, where the dry run first needs it). (The lock fixtures were moved
  to E2 in the first epoch 4 draft and RESTORED to E1 by consult `354b1a67`: moving them relaxed a DoD timing condition.)
- **Stories:** S0 the preparatory wording-only anonymisation of `typescript/doctrine.md` § 1 (§ 4.4) — its own commit,
  `rule-bodies.mjs --update typescript.doctrine`, listed as wording with no lesson removed, BEFORE S4 records a hash
  (§ 16, finding 3); the list is the three file names, "a real vault", **and the two the first list missed** (§ 17,
  O8): `:37` "a **synced** vault" → "a **synced** credential store", `:39` `scriptInterpolation.test.ts` → "the
  scan test" · **S0b the whitespace-only splits** (§ 4.3): a line break before "Everything below applies everywhere."
  in `common/testing.md:33` and a paragraph break after the .NET-only cadence sentence in `csharp/nuget-packages.md:41-43`,
  its own commit, `rule-bodies.mjs --update common.testing csharp.nuget-packages`, with the D1 check in the commit
  message (the two files with all whitespace removed are byte-identical before and after), BEFORE S4 records a hash ·
  S1 the gate key: semantics (mirrored and declared, by provenance), errors, `reasons`, tests · S2 the selection/budget
  matrix of § 4.1 measured and recorded — the pinned id lists, the caps, the exact twenty-two-scope single-read list of
  § 5 (with `gpu --file src/x.cs` on it), the negative-case definition of § 4.4 — with the per-scope id-list tests ·
  S3 the MINIMAL `parity-matrix.json` and `parity-inventory.json`: the schema (per-side `delivery` and `enforcement`
  sets, `mood`, `consequence`, `suppression`, `status`, `reason`, `scopedAbsences`), the completeness test (one-to-one
  with the inventory; the `stronger-*` whitelist `['P4']`; a `planned` row validated structurally — schema, an existing
  source, an owning epic among E2–E6 — and its destination `id`/`section` only once its epic activates it), the
  fields-versus-reality test (front matter, heading mood inherited from the nearest marked ancestor, the check tool's
  exported rule list), and **the proof on the real rows** (§ 4.1, ledger 3.2): P2 and P3 with their actual planned
  delivery sets pass the union comparison over the correspondence table, the configuration kind apart, and the negative
  fixture that removes the TypeScript source-file statement fails; P4 is asserted as the whitelisted exception; every
  other row is `planned` · S4 the reusable move verifier: `tools/moved-blocks.mjs --record <source> <from>-<to> <commit>
  <destination> <epic> <id>` reads the block with `git show` at the named commit and appends `sha256`, `length`,
  source, lines, commit, destination, epic and id to `research/moved-blocks.json` (one JSON array, the comma inserted
  between entries — brief fix 1); the checker compares an activated entry's destination bytes with the manifest and a
  `planned` entry's source bytes with the source as it stands, reading no history — **CI stays at `actions/checkout`'s
  `fetch-depth: 1`; the manifest is the evidence** (§ 16, stories-writer point 1); the recorder REFUSES a range that is
  not whole lines or that would split a code fence, naming S0b as the remedy, and implements the superseding procedure
  of § 4.3; its own fixtures: an exact range, a fence-balanced refusal, a mid-line refusal, a superseding entry.
  **S4 records the BASELINE and no destination** (ledger 3.4 as amended by consult `354b1a67`): after S0 and S0b, one
  `planned` entry per move range of § 4.3 — source file, line range in the post-split numbering, `sha256` at this
  commit — so the `typescript/doctrine.md` § 1 entry hashes the anonymised text; each owning epic then records the full
  destination entry right before moving (E2 the NuGet ranges; E4 the doctrine's; E5 reliability's; E6 testing's,
  logging's and utc's), and the recorder requires the bytes to equal the baseline or a superseding entry whose
  `justifiedBy` commit the checker verifies (§ 4.3), so a move folded into a wording change is a red test · **S4b the
  two lock fixtures** (`NU1004`, a named `t.skip` where no `dotnet` SDK exists locally, a FAILURE under `CI`; `EUSAGE`),
  green at E1's exit, **and the required CI job that runs them**: `tools · lock fixtures` in `ci.yml` with
  `actions/setup-dotnet@a98b56852c35b8e3190ac28c8c2271da59106c68 # v6.0.0` at the fixture's pinned .NET 10 SDK, added
  to `release`'s required checks beside `tools · selftest` and `workflows · actionlint` (`.github/branch-protection.json`)
  — one extra job, about a minute (§ 10) · S5 the byte allowances of § 5 written into `module_rules.md`; the gate-declaration and selection-case
  schema in `selection-matrix.json`, EMPTY of E2–E7's declarations (each owning epic writes its own when it lands its
  file — § 4.4).
- **Depends on:** nothing. **Done when:** `npm test` green with the new tests; the matrix test is red when an ACTIVATED
  row names a missing id or section, and when a `planned` row names no owning epic (both observed, then fixed); the real
  P2/P3 rows pass the union comparison and their negative fixture fails; every tight scope's headroom is in
  `module_rules.md`; **E1's fixtures of § 10 are green — selection (one positive, one negative case per gated rule, the
  negative as § 4.4 defines it), the real-row equality and its negative, heading inheritance (MANDATORY from an ancestor
  H1; a section with none), the verifier's four cases (an exact range, a fence-balanced refusal, a mid-line refusal, a
  superseding entry with its `justifiedBy` commit), and the two lock fixtures (`NU1004`, `EUSAGE`) — the NuGet one
  exercised in the REQUIRED `tools · lock fixtures` CI job on this pull request, never skipped there** — before E2's
  stories document is written; `moved-blocks.json` holds exactly the baseline `planned` entries (one per range of
  § 4.3, no destination) and `selection-matrix.json` carries no declaration yet; one pull request through both gates.
  (The consumer inventory is E7's — ledger 3.4; the lock fixtures stay here — consult `354b1a67`.)

### E2 — Dependency policy (parallel after E1)

- **Goal:** P9 and § 3.3's dependency rows; D14.
- **Scope:** `common/dependencies.md` (new), `csharp/nuget-packages.md` (blocks moved out, paths only; **the .NET
  lock-file mechanics added — G2 option A**), `typescript/npm-packages.md` (new), the manifest, the selection tests, the
  lock POLICY text and consumer-facing mechanics (the two lock fixtures themselves are E1's — consult `354b1a67`),
  **and the destination entries of E2's four NuGet ranges, recorded with E1's recorder right before the move against
  E1's baseline hashes** (`:12-23`, `:25-29`, the `## Bumping` heading and its neutral paragraph after S0b's split,
  `:50-54`), each entry activated in the same commit as its move; `npm-packages.md` ≤ 3,300 B (§ 5's "after E3" cap).
- **Stories:** S1 the shared rule (moved blocks verbatim; the scan and the both-sides lock requirement added) · S2 the
  NuGet rule after the move, with the pointer, the coupled-version exceptions kept (`:31-37` never moves), the .NET
  sentence and the `powershell` fence under their new heading, and the lock mechanics (`RestorePackagesWithLockFile`,
  `packages.lock.json` committed, `RestoreLockedMode` under `CI`, `--force-evaluate` to move a lock) with the
  **observed fixture**: a stale lock fails `dotnet restore --locked-mode` with `NU1004`, passes after `--force-evaluate`
  (§ 3.3) · S3 the npm rule: declared range, lock resolution, reproducible install, each with its probe line, the
  `EUSAGE` fixture among them, **and the narrow, reviewed exception to `--ignore-scripts`** (§ 4.5): the committed
  allow-list with one reason per package, `npm rebuild <pkg>` for the listed packages only, and the check that the list
  is exact (no wildcard, every key a package in the lock) and that each listed package really has an install script —
  fixtures: a valid list, a wildcard, a listed package with no script; the .NET counterpart recorded
  `deliberately-absent` in the inventory (NuGet has no install scripts) · S4 selection tests, manifest entries, the
  `inspect --file src/x.csproj` measurement.
- **Depends on:** E1. **Done when:** `dependencies --file package.json` selects `common.dependencies` and
  `typescript.npm-packages` and not `csharp.nuget-packages`; E2's matrix rows and move entries are activated (no longer
  `planned`) and the byte-equality test passes for every move entry E2 owns against its recorded source hash — each
  activation matched by content, exactly once in its destination (ledger 4.1) — the count is `moved-blocks.json`'s,
  never a number typed here; both lock fixtures are in the suite and green; one pull request
  through both gates.

### E3 — Compiler/lint enforcement contract (cornerstone area 1)

- **Goal:** P2–P4, § 3.4, D7, D8; `Nullable enable` for C# in the same epic. **E3 owns compiler-property and
  suppression enforcement on both stacks** (R-1, R-4): the check COMPLEMENTS `build-flags-check` and its hook, which
  enforce resource limits, and replaces neither.
- **Scope:** `typescript/compiler-strictness.md` (new, ≤ 3,300 B), **the minimal source-file statement of P2/P3 in
  `typescript/doctrine.md`** (a short paragraph — the toolchain and `strict`/`noEmitOnError`/lint-at-zero line — landed
  by E3 so that its activation of P2 and P3 holds against the post-E3 catalog; E4's § 0 absorbs it; ≤ 250 B, inside the
  doctrine's allowance — ledger 3.2, § 19), **the doctrine's selector expansion** (`.js/.mjs/.cjs` and `**/package.json`,
  with § 5's "after E3" measurements — consult `354b1a67`), `csharp/doctrine.md` § 1 (+ `Nullable enable`, the only
  growth of that file — measured against the `gpu` row of § 5), the JavaScript-lint half of the check with its two
  predicates (ledger 3.3), the symmetric findings of P21 (an orphan `.cs` outside any project; a `.js` a conforming lint
  configuration ignores) and the P21 row,
  `tools/strictness-check.mjs` (both halves) + tests + fixtures, `README.md` § *tools*, `ROLLOUT.md`.
- **Stories:** S1 the rule text: the composite gate, the toolchain as one combination with its read date, the
  suppression policy (**cornerstone**) · S2 the check, both halves: the one TypeScript-repository predicate; `tsc`
  resolved through `createRequire(...).resolve("typescript/bin/tsc")` or a walk up the parents' `node_modules/.bin`;
  effective configuration via `tsc --showConfig`; the .NET half via `dotnet msbuild -getProperty:TreatWarningsAsErrors
  -getProperty:Nullable -getProperty:NoWarn -getProperty:WarningsNotAsErrors -m:4` per project — **only after a
  successful locked restore, else INCOMPLETE** (§ 18, finding 2) — with the SDK baseline file and the props/csproj
  declaration read (R-4); the inline-suppression readers on both sides (`eslint-disable` without rule id or same-line
  reason; `#pragma warning disable` without id or same-line reason — § 18, finding 4); the `checkJs` requirement for a
  project that includes `.js/.mjs/.cjs` (finding 5); the six invalid TypeScript fixtures, the hoisted-install fixture
  that must pass, the `.ts`-without-project fixture with its exact expected line and exit, the `.mjs`-without-`checkJs`
  fixture, the three suppression fixtures per side (no id, no reason, valid), the .NET fixtures (the defaults-only
  VALID one, the two props-suppression INVALID ones, the unrestored project → INCOMPLETE, the restored project →
  evaluated); INCOMPLETE only when the predicate says TypeScript and nothing resolves, or projects exist and no SDK (or
  no baseline for the pinned SDK) resolves, or the locked restore did not succeed; `--warn` ·
  S3 the C# § 1 line and the `gpu --file src/x.cs` measurement ·
  S4 the documents and the dry-run command for E7.
- **Depends on:** E1. **Done when:** each invalid fixture fails naming the file and the defaults-only .NET fixture
  passes; the orphan-`.cs` fixture and the lint-coverage fixture fail (P21's symmetric findings); a grep-only check is
  shown insufficient by a fixture whose `strict` sits in an `extends` base; every pin of § 5's "after E3" table ≤ 32,768 B
  (`storage --file tsconfig.json` and `storage --file .npmrc` ≤ 32,706 B among them); E3's matrix rows P2, P3 and P21
  are activated and **pass the real-row proof at E3's exit, using only what exists then — the source, JavaScript and
  manifest scopes included** (§ 4.1); one pull request through both gates.

### E4 — TypeScript design doctrine parity (cornerstone area 2)

- **Goal:** D4, P1, P5–P7, R3 (as two gated Definition-of-Done rules, § 4.4); the doctrine becomes the mirror of
  `csharp/doctrine.md` § 1–§ 7 by meaning.
- **Scope:** `typescript/doctrine.md` (§ 0 added, absorbing E3's minimal statement; § 1, § 2, § 3, § 4 moved out
  verbatim to `typescript/boundaries.md` and `typescript/testing.md`, which this epic creates as placeholders holding
  exactly the moved text so no byte is in flight — O10; `csharp/boundaries.md` is created here too, by S5), **the
  recording of the doctrine's four ranges with E1's recorder right before the move and the declarations of this epic's
  five gates with their selection cases** (the Definition-of-Done pair, the boundaries pair, `typescript/testing.md` —
  ledger 3.4), `csharp/definition-of-done.md` and
  `typescript/definition-of-done.md` (the two gated checklists, § 4.4 — the C# one NOT in `csharp/doctrine.md`, so
  `gpu --file src/x.cs` stays one read), `common/coding-style.md:32`. (The doctrine's selector expansion is E3's —
  consult `354b1a67`; E4 inherits it and brings the doctrine to ≤ 4,700 B.)
- **Stories:** S1 § 0: readonly contracts, branded domain types with parsing factories, discriminated outcome and absence
  states, boundary validation of untrusted JSON, pure functions and immutability, complexity ≤ 4 — each paragraph naming
  the C# section it mirrors and the anonymised precedents (one consumer's readonly outcome type separating refusal,
  timeout and mechanism failure; two consumers' complexity 4), including the large-identifier paragraph of P6 with
  its two measured readers and the typed fixture of § 14 item 4 — `json-lossless.d.ts` declaring the reviver's
  `context` and `JSON.rawJSON`/`isRawJSON`, a `parseLossless` wrapper as the single road in, compiled under the pinned
  TypeScript and run on Node 26 against `{"id":9007199254740993}` (**cornerstone**) · S2 ONE commit: the moves of
  § 1 (already anonymised by E1.S0), § 2, § 3, § 4 with their four DoD boxes into `typescript/boundaries.md` and
  `typescript/testing.md`, each created with its full front matter (`id`, `load`, `paths`, `path_tasks`, `depends`) and
  its manifest entry, byte-equal to the hashes E1.S4 recorded (the first revision's two-commit shape (a)+(b) is
  superseded by § 16, finding 3: (a) is now E1.S0) · S3 the two gated Definition-of-Done rules (`csharp/definition-of-done.md`,
  `typescript/definition-of-done.md`, § 4.4) and the `gpu --file src/x.cs` measurement, expected ≤ 32,613 B · S4 the
  pinned scopes re-measured after the moves (the selectors having landed in E3), `gpu --file ui/a.ts` ≤ 32,680 B among
  them, and the real-row proof of § 4.1 for P5–P7 at E4's exit · S5 P6's two halves in the gated
  boundaries pair (§ 16, stories-writer point 8): `csharp/boundaries.md` — the large-identifier mirror with the
  `System.Text.Json` probe facts (`long` exact, `double` and `GetDouble()` lossy, `decimal` exact, `2^63` a
  `JsonException`, the case-sensitive default binding `Id` to 0 with no error) and `typescript/boundaries.md` — strings
  on the wire or the lossless reviver, with § 0 keeping one pointer line.
- **Depends on:** E1, E3 (the strictness line § 0 carries points at E3's rule — R-5). **Done when:** `inspect --file
  ui/a.ts` and `inspect --file src/a.mjs` ≤ 30,116 B; the matrix rows P5–P7 are activated, point at § 0's sections and
  pass the real-row proof at E4's exit; E4's move entries equal E1's baseline hashes, each activation matched by
  content, exactly once in its destination (ledger 4.1);
  E4's move entries (`moved-blocks.json`'s count — four ranges today, § 1–§ 4 — O10) are activated and the
  byte-equality test is green against the source hashes E1.S4 recorded after E1.S0; `gpu --file src/x.cs` ≤ 32,768 B with the Definition of Done gated; the catalog loaded and `npm test` was
  green after the commit; the ownership check finds no name; one pull request through both gates.

### E5 — Runtime lifecycle (cornerstone area 3)

- **Goal:** P13, P15; D9.
- **Scope:** `typescript/lifecycle.md` (new, gated; its declaration and selection cases written here), `csharp/lifecycle.md`
  (the moved reliability blocks — the six ranges recorded with E1's recorder right before the move, ledger 3.4), the
  pointer lines and the Node phrase in `common/reliability.md` and `common/security.md`,
  `research/2026-10-31_node_behaviour_probes.md`.
- **Stories:** S1 the probe record: the table of § 4.3 plus the owed probes (pre-aborted signals, custom reasons,
  cleanup, an ignored `SIGTERM`, descendants holding pipes — all run; backpressure and `taskkill /T` to run) · S2 the
  Node rule: ownership through completion — who cancels, who observes the rejection, who terminates descendants, who
  drains streams and bounds the shutdown; the `unhandledRejection` shutdown policy; `signal.aborted` and who aborted;
  `tools/lib/proc.mjs` as the shipped shape (**cornerstone**) · S3 the C# moves, byte-equal, and the reliability DoD read
  against the Node text · S4 the core's two phrases within the ≤ 300 B allowance.
- **Depends on:** E1, E4 (the doctrine's § 0 points here). **Done when:** every Node sentence traces to a probe line; the
  always core ≤ 16,384 B; the common rule still states the invariant and the pointer; E5's matrix rows and move entries
  are activated and byte-equal against E1's baseline (each activation matched by content, exactly once in its
  destination — ledger 4.1), and the real-row proof of § 4.1 passes for E5's rows at its exit; one pull request through
  both gates.

### E6 — Application contracts, with their C# and Rust counterparts

- **Goal:** P10–P12, P14, P16–P19, R1, R2, R4, R5; D6, D10, D11.
- **Scope:** `typescript/logging.md`, `typescript/utc-timestamps.md` (new, gated); `typescript/testing.md` and
  `typescript/boundaries.md` (created by E4.S2 as placeholders holding the moved doctrine sections — E6 FILLS them, O12);
  `csharp/testing.md`, `csharp/logging.md`, `csharp/utc-timestamps.md` (new, gated; the moved blocks plus the reverse
  items); `csharp/boundaries.md` (created by E4.S5 with P6's C# half — E6 adds R1's Razor output encoding); `rust/testing.md`, `rust/logging.md`,
  `rust/utc-timestamps.md` (the moved Rust sections; `rust/doctrine.md` § 9's pointer updated); **the recording of
  testing's, logging's and utc's ranges with E1's recorder right before each move, and the declarations of
  `typescript/logging.md` and `typescript/utc-timestamps.md` with their selection cases** (ledger 3.4); the invariant and
  pointer lines in `common/testing.md`, `logging-serilog.md`, `utc-timestamps.md`; the rows and phrases of D6 in
  `http-contracts.md`, `platform-limits.md`, `post-deploy-checks.md`, `security.md:18`; `tools/http-coverage.mjs`'s
  `--routes` documentation and test for a Node table; `http-contracts.md:166`.
- **Stories:** S1 the testing pair (runner sections, import-graph test, typed-fixture discipline side by side, the neutral
  DoD box) · S2 the logging pair (pino shape measured against the path contract; the Serilog blocks moved) · S3 the clock
  pair and the Rust clock file (`storage` measured) · S4 the boundaries pair — output encoding (the webview escape module anonymised;
  Razor's `MarkupString`/`Html.Raw`) · S5 the one-line additions of D6 and the route-table path of D10 with its test ·
  S6 the Rust files and `rust/doctrine.md`'s pointer (Q13).
- **Depends on:** E1, E4, E5. **Done when:** every moved block of E6 is activated and byte-equal (each activation matched
  by content, exactly once in its destination — ledger 4.1; E6's edits to `typescript/testing.md` above E4's blocks
  therefore stay green); every Node sentence
  traces to a probe line or a cited document; `storage` (no file) ≤ 32,768 B; after E6 no matrix row and no move entry
  is `planned`, and the real-row proof of § 4.1 passes for E6's rows at its exit; one pull request through both gates.

### E7 — Dry run, release, consumer adoption, the per-arm record

- **Goal:** the rules reach the consumers and the experiment without a red build nobody expected (D13).
- **Scope:** **`research/consumers.json` and its equality test against `README.md` § *Consumers*, built here as S0
  because the dry run is the first thing that needs it** (ledger 3.4 — moved out of E1); the dry run over every consumer
  in it (eight today); `promote-release` with a `reason`; bump pull requests (pinned-by last); the per-arm record's
  commands handed to the other plan; this plan's promotion.
- **Stories:** S1 the dry run: the new check with `--warn` and `explain` for the representative scopes against each
  consumer's checkout, findings recorded; **for every .NET-bearing consumer (`dotnet` and `mixed` kinds), the NuGet
  locks generated in the dry run (`RestorePackagesWithLockFile`, one `packages.lock.json` per project) and the
  locked-mode restore tried, so the bump pull request carries a lock that already restores — the adoption cost (G2
  option A) recorded per consumer: projects, lock sizes, any `NU1004` met and how it was resolved**; the dry run's
  findings list per consumer IS the remediation budget · **S1b remediation, one story per consumer kind in E7's stories
  document (split per consumer there), following the README's adoption rule (§ 18, finding 1):** the .NET-bearing kinds
  (six consumers: the three `dotnet` and the three `mixed`) — `RestorePackagesWithLockFile` in `Directory.Build.props`,
  one `packages.lock.json` per project generated and committed (one of them has seven projects by the README; the rest
  counted in S1), `RestoreLockedMode` under `CI`, every `#pragma warning disable` given its id and same-line reason (none
  found in two server trees on 2026-10-31; S1 counts the rest), no `<NoWarn>`/`<WarningsNotAsErrors>` in props (none
  found in three); the TypeScript-bearing kinds (four consumers: one `typescript`, three `mixed`) — every `eslint-disable`
  line given a rule id and a same-line reason or removed (measured 2026-10-31: 270 lines in one consumer, 16 in another,
  the other two counted in S1), the typed-fixtures `ignores` kept as the legitimate exclusion § 3.4 names, `noEmitOnError`
  where it is missing (one consumer today), `--max-warnings 0` in every `lint` script, `.npmrc` with `save-exact=true`
  beside every `package.json` (four files), `checkJs` where a project includes `.mjs`; each story ends by flipping that
  consumer's CI step from `--warn` to enforcing in the same pull request · S2 `mcp__coai__review_feature` over the seven
  epics · S3 the promotion (`README.md:100-122`) and the `release-distance` read · S4 the bumps, each with `pin-check`
  green after its commit, the `dotnet`, `typescript` and `mixed` kinds adding the `strictness-check` step with `--warn`
  (R-1; § 16, finding 6 — ENFORCING is the end state, reached per consumer when its S1b story merges; § 18 superseded
  "no `--warn` in the bump"), **and the .NET-bearing kinds committing their `packages.lock.json` files with
  `RestoreLockedMode` wired under `CI`** (G2) · S5 the sha and the per-arm record commands handed to the
  experiment's E0.S3 and confirmed equal · S6 this plan promoted with deviations.
- **Depends on:** E1–E6 merged. **Done when:** every box of § 11 is ticked.

### Order, and why

E1 first because every text needs a place, a gate and an allowance before it is written, and because its tests are what
make D1's "moves keep the text" checkable. E2 in parallel because its placement is settled by E1 alone. E3 before E4
because the gate is what the design doctrine's strictness line points at. E4 before E5 and E6 because the doctrine's § 0
is the index the gated rules are reached from, and because its moves create the files E5 and E6 fill. E7 last, once,
with the dry run before the promotion.
