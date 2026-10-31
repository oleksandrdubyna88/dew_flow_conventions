# PLAN — C#/Node rule parity, E1: delivery and the parity contract (no new prose)

> Status: **plan only, nothing implemented yet, 2026-10-31 — reconciled with the parent's epoch 2 (main `aeeddda`).**
> Scope: the stories of epic E1 — the wording-only anonymisation of `typescript/doctrine.md` § 1 (S0); the `path_tasks`
> key in `tools/lib/rule-catalog.mjs` and the explain output (S1); `tools/selection-matrix.mjs` and
> `research/selection-matrix.json`, the pinned id list of every representative scope, regenerated and compared (S2);
> the single-read list of D5 and the caps of § 5 (S5); `research/parity-inventory.json`, `research/parity-matrix.json`
> and `research/consumers.json` with their tests (S3); `tools/moved-blocks.mjs` and the immutable manifest
> `research/moved-blocks.json` (S4); `ENTRY.md` step 7, `research/module_rules.md`, `research/module_tests.md`,
> `README.md` § *tools*.
>
> Stories of epic E1 of [PLAN_node_rule_parity.md](PLAN_node_rule_parity.md) (§ *Epics*, E1). First written by Opus on
> 2026-10-31 at `d986710` (`3392fb2`); rewritten the same day against epoch 2, whose re-review kept that version as
> "fits" and folded its nine points into the baseline (parent § 16). This document keeps no change ledger: a change to
> E1's approved work is an entry in the parent's `## Plan changes` (epoch 2, at 0 changes today). E1 holds no
> cornerstone area, so no story is marked `model: fable` and the parent's ledger line stays `Cornerstones: 0 of 3`.
> Where the parent is unclear or contradicts itself, the point is listed in § *Open points* with its line and the
> stories do NOT decide it.

Done when (the parent's E1, `todo/PLAN_node_rule_parity.md:912-915`): `npm test` green with the new tests; the matrix
test observed red when an ACTIVATED row names a missing id or section, and when a `planned` row names no owning epic,
then fixed; every `planned` row and move entry passes its structural check with its source bytes recorded; every tight
scope's headroom is in `research/module_rules.md`; one pull request through both gates. The commands, from the worktree
root, after the locked install (`npm test` does not run the family checks):

```bash
npm ci --ignore-scripts
npm test
npm run check
node tools/ownership-check.mjs
node tools/rule-bodies.mjs
node tools/plan-lifecycle.mjs .
```

## Gates, models, branch

- **Branch.** `feat/rule-parity-e1` (main merged in at `6773913`). One commit per story, `npm test` green after each —
  the six janitor cases that fail on this machine on a clean `main` aside (parent § 16, `:855-856`): name them, never
  fold them into a story's verdict. One pull request for the epic.
- **S0 is its own commit** carrying exactly `typescript/doctrine.md` and `research/rule-bodies.json`, listed in the pull
  request as **wording, no lesson removed** (parent § 4.4, `:421-427`; § 11, `:687-689`).
- **Gates.** `open` on this branch with `callerModel`; `review_plan` with this document as the scope of epic 1 of 7;
  `resolve` every finding, rejecting in round one what is wrong; build in the order below; `review_code` over the epic's
  diff with `baseRef` = the merge base with `main` at that time (`aeeddda` today) and an Opus review, both at once. A
  reply's `commands` are followed and named; a cadence-consultation order is made as written.
- **Models.** Scenarios and briefs: Opus (this document). Code, data, tests, documents: a Sonnet coder per story,
  re-discovering nothing. Review: Opus. Fixes: Sonnet. S0 (one rule file, 8 changed lines, plus the record the tool
  writes) may be done by the main session only if it bounds it so before the first edit; a Sonnet coder is always
  correct.

## Facts the stories rest on (read 2026-10-31; the rule files are unchanged from `f46982f` to `6773913`)

- **F1 — selection.** `selectRules` (`tools/lib/rule-catalog.mjs:141-166`) adds a rule for `load: always`, for each scope
  task in its `tasks`, for each (file, pattern) match of its `paths`; dependencies first, reason `dependency:<id>`,
  ignoring their own conditions. Reasons: `always`, `task:<t>`, `path:<file> (<pattern>)`, `dependency:<id>`. An unknown
  metadata key throws in `ruleFrom` (`:85`).
- **F2 — the explain manifest** lists per rule `id, source, hash, bytes, load, paths, tasks, depends, reasons`
  (`tools/lib/rule-cli.mjs:103`); `bytes` is the whole file text, front matter included (`rule-catalog.mjs:98`).
- **F3 — the body freeze** hashes the body after the front matter (`tools/lib/rule-body.mjs:24`); a changed `paths:`,
  `tasks:`, `depends:` or `path_tasks:` line passes it (`tools/rules.test.mjs:151-174`; `drifted` is exported by
  `tools/rule-bodies.mjs:72`). This is D12's reason for the id-list pins.
- **F4 — a mutation test depends on a literal.** `tools/rules.test.mjs:322` replaces `normalized.filter(file=>match(file))`
  in `rule-catalog.mjs`; S1 keeps that substring byte for byte.
- **F5 — the single-read pin** is `tools/rules.test.mjs:250-257`: `inspect` ×{none, `src/x.cs`, `src/x.csproj`,
  `ui/a.ts`}, `ui` ×{none, `src/x.cs`, `ui/a.ts`}, `gpu` ×{none, `src/x.cs`}, `storage` none.
- **F6 — section strings** in `research/rule-bodies.json` are whole heading lines with their `#` marks
  (`sectionsOf`, `rule-body.mjs:89`).
- **F7 — CI reads no history.** Pull requests are squash-merged and CI checks out at `actions/checkout`'s default depth
  1 (`.github/workflows/ci.yml:23-25`). Epoch 2 keeps it so (ledger 1.2, § 16 point 1): the move evidence is the
  manifest, and no test reads git history.
- **F8 — the moved ranges hold.** Re-measured with `Buffer.byteLength` on the folded text at `6773913`: `common/testing.md`
  `12-31` 1,113 B, `354-358` 252 B, the Rust sentence of `32-33` up to `.NET-specific.` 115 B; `common/reliability.md`
  `104-133` 1,698 B; `common/logging-serilog.md` `61-90` 1,640 B, `153-171` 497 B, `172-187` 875 B;
  `common/utc-timestamps.md` `65-69` 219 B; `typescript/doctrine.md` `15-48` 2,042 B (2,021 B after S0), `49-65` 755 B,
  `66-79` 932 B, `80-97` 1,151 B, its Definition of Done boxes at `100-101` (§ 1), `102` (§ 2), `103-104` (§ 3), `105`
  (§ 4); `csharp/nuget-packages.md` `12-23` 824 B, `25-37` 760 B, `39-47` 436 B, `50-54` **286 B** (the parent says
  287 — open point O9).
- **F9 — the consumers.** `README.md:188-199` § *Consumers* lists eight repositories; the parent's kinds are at
  `todo/PLAN_node_rule_parity.md:279-284`. Mount paths read from each local checkout's `.gitmodules`, 2026-10-31:
  `.claude/rules/shared` for `dew_flow_rag_qln`, `dew_flow_mcp`, `dew_flow_sidecar_rust`, `dew_flow_creds_for_devs`;
  `.agents/conventions` for `dew_flow_benchmark`, `dew_flow_connect_other_ais`, `wsl_care`, `dew_flow_vscode_kit`.
- **F10 — the measured matrix after S0** (S0 removes 21 B from `typescript.doctrine`, 5,909 → 5,888 B; measured on a copy
  of the rule directories with S0 applied; summed `bytes` of `selectRules(catalog, [task], files)`):

| Files | `inspect` | `ui` | `gpu` | `storage` | `implement` | `test` | `audit` | `logging` | `dependencies` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| (no file) | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,355 |
| `src/x.cs` | 28,820 | 31,033 | 32,293 | 34,019 | 291,538 | 284,106 | 222,853 | 78,866 | 164,968 |
| `src/x.csproj` | 31,901 | 34,114 | 35,374 | 37,100 | 294,619 | 287,187 | 225,934 | 81,947 | 164,968 |
| `Directory.Build.props` | 27,288 | 29,501 | 30,761 | 32,487 | 290,006 | 282,574 | 221,321 | 77,334 | 160,355 |
| `ui/a.ts` | 30,095 | 32,308 | 33,568 | 35,294 | 292,813 | 285,381 | 224,128 | 80,141 | 166,243 |
| `src/a.mjs` | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,355 |
| `src/x.cs` + `ui/a.ts` | 34,708 | 36,921 | 38,181 | 39,907 | 297,426 | 289,994 | 228,741 | 84,754 | 170,856 |
| `package.json` | 35,409 | 37,622 | 38,882 | 40,608 | 298,127 | 279,493 | 229,442 | 85,455 | 171,557 |
| `tsconfig.json` | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,355 |
| `.npmrc` | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,355 |
| `src/webview/page.ts` | 30,095 | 32,308 | 33,568 | 35,294 | 292,813 | 285,381 | 224,128 | 80,141 | 166,243 |
| `src/main.rs` | 40,743 | 42,956 | 44,216 | 45,942 | 291,304 | 296,029 | 222,619 | 78,632 | 176,891 |

  108 scopes, 1,509 ids. Before S0 the `ui/a.ts`, `src/webview/page.ts` and mixed rows are 21 B higher — the parent's
  § 5 "today" column (`inspect --file ui/a.ts` 30,116, `ui` 32,329, `gpu` 33,589, `storage` 35,315). The always core is
  15,055 B; `csharp/doctrine.md` 4,613 B. The parent's § 5 rows for `storage --file src/a.mjs` (≈ 33,300 B after E4) and
  `inspect --file src/main.rs` (≈ 38,030 B after E6) are its estimates; both stay over one read and unpinned.

## Order

**S0 → S1 → S2 → S5 → S3 → S4.** S0 first because every later number and the S4 hash of § 1 are taken after it; S1 is
the only resolver change; S2 pins what the resolver selects; S5 adds the single-read flags to S2's tool; S3 and S4 are
independent of each other, and S4 records its hashes only after S0 is committed. Each story writes its tests first and
watches them fail for the reason its RED step names.

## Growth

The parent's § 7 (`:592-605`) carries every data file E1 creates (`selection-matrix.json` ≈ 55 KB, `parity-matrix.json`,
`parity-inventory.json`, `moved-blocks.json`, `consumers.json`). E1 adds besides: two tools and two libraries
(`tools/selection-matrix.mjs`, `tools/moved-blocks.mjs`, `tools/lib/moved-blocks.mjs`, `tools/lib/parity-epics.mjs`)
with their tests, ≈ 1,200 lines, kept as long as the plan's records are; and ≈ 5 KB in `research/module_rules.md`, a
PROJECT `requires` source read at every session start — its measured table is REPLACED at each re-measurement, never
appended. Every temporary folder of the new tests is an owned folder (`ownedDir`), removed by the test and swept by the
next run if the test was killed.

## Not in E1

- No rule text changes except S0's wording; no rule gains `path_tasks` (the first gated rules arrive in E4–E6).
- No destination is written and no move entry is `landed`: S4 records the moves as `planned`.
- The move entries the parent describes only approximately are NOT recorded (O5): the reliability sentences of
  `:47-70`/`:95-103` and `:38-46`, the .NET sentences, C# block and Never/DoD lines of `utc-timestamps.md:25-48`, and the
  NuGet `:39-47` block minus its two lines.

---

## E1.S0 — The wording-only anonymisation of `typescript/doctrine.md` § 1, before anything records its hash

- **Size.** S — four lines of one rule, its body record.
- **Models.** Brief: Opus (below). Edit: a Sonnet coder (or the main session under a bound declared before the edit).
  Review: Opus.
- **Goal.** Parent § 4.4 (`:421-427`) and § 16 finding 3: § 1 names three source files and "a real vault"; they become
  "one module", "a second", "a third" and "a real credential store", every sentence, number and date kept, in the source
  file, as its own commit, with the body recorded, so that S4 hashes the anonymised text and E4.S2's move is one commit
  byte-equal to it.

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 0.1 | `typescript/doctrine.md` at `6773913` | lines 33–36 are replaced by the four lines of the brief | `git diff --stat` shows `typescript/doctrine.md` with 4 lines changed and `research/rule-bodies.json` with the one entry's hash; nothing else |
| 0.2 | the edited file, before the record moves | `node tools/rule-bodies.mjs` | exit 1, `DRIFT typescript.doctrine — its body changed without the record moving` |
| 0.3 | `node tools/rule-bodies.mjs --update typescript.doctrine` | then `node tools/rule-bodies.mjs` | `typescript.doctrine — <old> → <new>, 6 heading(s)`, then `OK — 39 rule(s)`; the recorded `sections` are unchanged |
| 0.4 | the edited file | `grep -n 'webauthnPrf\|entityFormScript\|depPickerScript\|real vault' typescript/doctrine.md` | no line |
| 0.5 | the edited file | its line count, and lines 15–48 | the same line count as before; § 1 still runs from line 15 to line 48, 2,021 B (F8) |
| 0.6 | the edited file | `node tools/rules.mjs explain --repo . --task inspect --file ui/a.ts` | 30,095 B (F10), `typescript.doctrine` 5,888 B |
| 0.7 | — | `npm test`, `node tools/ownership-check.mjs` | green (the six known janitor cases aside); OK |

### Files

`typescript/doctrine.md` (lines 33–36), `research/rule-bodies.json` (the `typescript.doctrine` entry, by the tool).

### Acceptance criteria

0.1–0.7 hold; the commit carries only those two files; its message says *wording only, no lesson removed* and names the
four replacements; the pull request lists the commit under *Wording*.

### RED → GREEN → RED

1. **RED.** After the edit and before `--update`: 0.2 — the freeze is red for the right reason (the body moved). Record
   the line.
2. **GREEN.** `--update typescript.doctrine`; 0.3, then `npm test`.
3. **RED again.** Revert line 36 alone in the working tree → `node tools/rule-bodies.mjs` names `typescript.doctrine`
   again; restore the edit → OK. Report both.

### Docs to update

None besides the record. The S4 section of `research/module_tests.md` names this commit as the source of the § 1 hash.

### The brief (for the Sonnet coder)

Change exactly lines 33–36 of `typescript/doctrine.md`. Today they read:

```
**Three instances, three different people, one of them shipped.** `webauthnPrf.ts` escaped by
hand; `entityFormScript.ts` did not; `depPickerScript.ts` reintroduced it in new code written
*beside* the fix for the previous one — and that build was cut, installed and running against a
real vault for an hour before it was found. The values were folder and entry names arriving from
```

Replace them with exactly these four lines (no other line of the file changes; line 37 still begins `a **synced** vault`):

```
**Three instances, three different people, one of them shipped.** One module escaped by hand; a
second did not; a third reintroduced it in new code written *beside* the fix for the previous one
— and that build was cut, installed and running against a real credential store for an hour
before it was found. The values were folder and entry names arriving from
```

Then `node tools/rule-bodies.mjs --update typescript.doctrine`, `node tools/rule-bodies.mjs`, `npm test`,
`node tools/ownership-check.mjs`. Stage the two files by path; `git diff --staged --stat` must show 2 files. Commit
message: `docs(rules): typescript/doctrine.md § 1 — wording only, no lesson removed: three file names and "a real
vault" anonymised (todo/PLAN_node_rule_parity.md § 4.4)`, the body naming the four replacements and the two observed
`rule-bodies` lines. Do not touch line 37 or line 39 (O8).

---

## E1.S1 — `path_tasks`: a path-selected rule loads only in a scope that names one of its tasks

- **Size.** M — about 30 lines in `rule-catalog.mjs` and `rule-cli.mjs`, about 150 lines of tests, three documents.
- **Models.** Brief: Opus (below). Code and tests: a Sonnet coder. Review: Opus.
- **Goal.** D3 and parent § 4.2 (`:291-316`): a new metadata key `path_tasks`. A rule's `paths` select it only when the
  scope also names one of the `path_tasks`; plain `tasks` still select regardless of files; `depends` is unaffected; a
  rule with `path_tasks` and no `paths` is a metadata error; the explain output names the gate. The T11 control
  (`:621`): a test holds every gated rule's gate equal to the `tasks:` line of the rule named as its source (O3 records
  the planned gated files whose gate has no such source).

### Scenarios (Given / When / Then)

Fixture catalogs come from the existing `fixture(t)` of `tools/rules.test.mjs` (a `common/core.md` always rule plus what
the case writes). `G` is `csharp/mech.md`: `id: csharp.mech · load: conditional · paths: ["**/*.cs"] ·
path_tasks: ["implement","test"]`.

| # | Given | When | Then |
|---|---|---|---|
| 1.1 | `G` | `selectRules(catalog, ["implement"], ["src/x.cs"])` | `csharp.mech` selected; `reasons` exactly `["path:src/x.cs (**/*.cs) when task:implement"]` |
| 1.2 | `G` | `["inspect"]`, `["src/x.cs"]` | NOT selected |
| 1.3 | `G` | `["implement"]`, no file | not selected — the gate is not a task selector |
| 1.4 | `G` | `["implement"]`, `["ui/a.ts"]` | not selected |
| 1.5 | `G` | `["inspect","test"]`, `["src/x.cs"]` | selected, reason `path:src/x.cs (**/*.cs) when task:test` |
| 1.6 | `G` | `["test","implement"]`, `["src/x.cs"]` | ONE reason `path:src/x.cs (**/*.cs) when task:implement,test` (the rule's own order) |
| 1.7 | `G` plus an ungated `csharp/plain.md`, same `paths` | `["inspect"]`, `["src/x.cs"]` | `csharp.plain` selected, `csharp.mech` not — the companion proving the glob matches |
| 1.8 | a gated rule with `tasks: ["audit"]` | `["audit"]`, no file | selected, reason `task:audit` |
| 1.9 | `common/dep.md` (`tasks: ["gpu"]`, `depends: ["csharp.mech"]`) and `G` | `["gpu"]`, no file | `csharp.mech` selected, reason `dependency:common.dep` |
| 1.10 | `G` with `depends: ["common.b"]`, `common/b.md` (`tasks: ["gpu"]`) | `["implement"]`, `["src/x.cs"]` | `common.b` before `csharp.mech`, reason `dependency:csharp.mech` |
| 1.11 | `path_tasks: ["implement"]`, no `paths` key | `loadCatalog` | throws `/path_tasks needs paths/` |
| 1.12 | `paths: []`, `path_tasks: ["implement"]` | `loadCatalog` | throws `/path_tasks needs paths/` |
| 1.13 | `paths: ["**/*.cs"]`, `path_tasks: []` | `loadCatalog` | throws `/path_tasks must name at least one task/` |
| 1.14 | `path_tasks: ["imlpement"]` | `loadCatalog` | throws `/imlpement.*legal: inspect/` |
| 1.15 | `path_tasks: "implement"` | `loadCatalog` | throws `/path_tasks must be an array of nonempty strings/` |
| 1.16 | `load: always`, `paths`, `path_tasks` | `loadCatalog` | throws `/path_tasks applies to a conditional rule only/` |
| 1.17 | any of 1.11–1.16 in a rule no scope selects | `loadCatalog` | still throws |
| 1.18 | `cliFixture` with `csharp/zz-gated.md` (`paths: ["**/*.cs"]`, `path_tasks: ["implement"]`) | `run(["explain","--task","implement","--file","src/x.cs","--repo",root], root)` | its entry has `path_tasks: ["implement"]`, `reasons: ["path:src/x.cs (**/*.cs) when task:implement"]`; `csharp.doctrine` has `path_tasks: []` |
| 1.19 | the same | `explain --task inspect --file src/x.cs` | `csharp.zz-gated` absent |
| 1.20 | the real catalog, `GATE_SOURCES` empty | `gateFindings(catalog, GATE_SOURCES)` | `[]` |
| 1.21 | fixture: `G` and `common/src.md` (`tasks: ["implement","test"]`); sources `{}` | `gateFindings` | one finding: `csharp.mech` gated with no declared source |
| 1.22 | sources `{"csharp.mech":"common.src"}` | | `[]` |
| 1.23 | `common/src.md` tasks `["implement","audit"]` | | one finding: path_tasks [implement, test] differ from `common.src`'s tasks [audit, implement] |
| 1.24 | sources `{"csharp.gone":"common.src"}` | | one finding: not in the catalog |
| 1.25 | sources `{"csharp.mech":"common.gone"}` | | one finding: the source is not in the catalog |
| 1.26 | sources `{"csharp.plain":"common.src"}` | | one finding: `csharp.plain` has no `path_tasks` |

### Files

`tools/lib/rule-catalog.mjs`, `tools/lib/rule-cli.mjs`, `tools/rules.test.mjs`, `ENTRY.md` step 7,
`research/module_rules.md`, `research/module_tests.md`.

### Acceptance criteria

Every scenario is a passing test; the 24 existing tests of `tools/rules.test.mjs` pass unchanged, `:322` included;
`node tools/rules.mjs explain --repo . --task implement --file src/x.cs` prints `"path_tasks": []` for every rule with
the same ids and `bytes` as before; `npm run check`, `node tools/rule-bodies.mjs` green.

### RED → GREEN → RED

1. **RED.** Write 1.1–1.26 first; `node --test tools/rules.test.mjs`: 1.1–1.10, 1.18, 1.19, 1.21–1.26 fail with
   `unknown metadata key path_tasks` (the real symptom: the key is unsupported); 1.11–1.16 fail because that message is
   not the one asserted; 1.20 passes. Record the lines.
2. **GREEN.** The brief; then the whole suite.
3. **RED again** (edit, watch, restore): (a) drop the gate filter → 1.2 fails; (b) drop the "needs paths" check → 1.11,
   1.12 fail; (c) drop `path_tasks` from the CLI manifest → 1.18 fails; (d) drop the set comparison in `gateFindings` →
   1.23 fails.

### Docs to update

`ENTRY.md` step 7; `research/module_rules.md` (metadata paragraph, new section); `research/module_tests.md`.

### The brief (for the Sonnet coder)

No rule file changes; `research/rule-bodies.json` does not change.

**1. `tools/lib/rule-catalog.mjs`.** `KEYS` (`:30`) gains `"path_tasks"`. In `ruleFrom`, after the `depends` line and
before `tasks.forEach`, in this order and with exactly these messages:

```js
const gated = Object.hasOwn(metadata, "path_tasks");
const pathTasks = stringList(metadata, "path_tasks", file);
pathTasks.forEach(task => { if (!Object.hasOwn(TASKS,task)) throw new Error(`${file}: unknown path_tasks task ${task}; legal: ${Object.keys(TASKS).join(", ")}`); });
if (gated && metadata.load === "always") throw new Error(`${file}: path_tasks applies to a conditional rule only`);
if (gated && !pathTasks.length) throw new Error(`${file}: path_tasks must name at least one task`);
if (gated && !paths.length) throw new Error(`${file}: path_tasks needs paths — it gates path selection and selects nothing alone`);
```

The returned object gains `pathTasks` after `depends`. In `selectRules` replace the `for (const pattern of rule.paths)`
loop with the form below, **keeping the literal `normalized.filter(file=>match(file))`** (F4):

```js
const gate = rule.pathTasks.filter(task => tasks.includes(task));
if (!rule.pathTasks.length || gate.length) {
  const when = rule.pathTasks.length ? ` when task:${gate.join(",")}` : "";
  for (const pattern of rule.paths) {
    const match=patternMatcher(pattern);
    normalized.filter(file=>match(file)).forEach(file=>add(rule,`path:${file} (${pattern})${when}`));
  }
}
```

**2. `tools/lib/rule-cli.mjs:103`** — destructure `pathTasks`, emit `path_tasks:pathTasks` after `depends`.

**3. `tools/rules.test.mjs`** — the scenarios as tests named for their guarantee (`a path_tasks rule is selected by its
paths only in a scope that names one of its tasks`, `plain tasks and dependencies still select a gated rule, and its own
dependencies follow it`, `path_tasks metadata errors fail the whole catalog`, `explain reports path_tasks and names the
gate in the reason`, `every gated rule's path_tasks equals the tasks line of the rule it mirrors`, `the gate-source check
refuses an undeclared, mismatched, stale or ungated entry`). 1.18/1.19 use `cliFixture(t)` and
`run([...,"--repo",root],root)`; the extra rule is written with `fs.writeFileSync` into the copy's `csharp/`. Reasons are
asserted with `assert.deepEqual`. Near `SPLIT_READ_TASKS` add:

```js
// Plan T11 (todo/PLAN_node_rule_parity.md): a gated rule's path_tasks is the tasks line of the rule its mechanics came
// from. The epic that creates a gated rule adds "<gated id>": "<source rule id>" here.
const GATE_SOURCES=Object.freeze({});

function gateFindings(catalog,sources){
  const byId=new Map(catalog.map(rule=>[rule.id,rule]));
  const findings=[];
  for(const rule of catalog)if(rule.pathTasks.length&&!Object.hasOwn(sources,rule.id))findings.push(`${rule.id} carries path_tasks but GATE_SOURCES names no source rule for it`);
  for(const [gated,source] of Object.entries(sources)){
    const rule=byId.get(gated), origin=byId.get(source);
    if(!rule){findings.push(`GATE_SOURCES names ${gated}, which is not in the catalog`);continue;}
    if(!rule.pathTasks.length){findings.push(`GATE_SOURCES names ${gated}, which has no path_tasks`);continue;}
    if(!origin){findings.push(`${gated}: its source ${source} is not in the catalog`);continue;}
    const a=[...new Set(rule.pathTasks)].sort(), b=[...new Set(origin.tasks)].sort();
    if(a.join()!==b.join())findings.push(`${gated}: path_tasks [${a.join(", ")}] differ from ${source}'s tasks [${b.join(", ")}]`);
  }
  return findings;
}
```

**4. `ENTRY.md` step 7** reads (wrap near 90 columns):

```
7. Dependencies are mandatory even when their own paths/tasks do not match. Selection is
   paths (optionally gated by `path_tasks`) OR tasks, plus always rules and transitive
   dependencies, deduplicated by id. A rule with `path_tasks` is selected by its paths only
   in a scope that also names one of those tasks.
   Metadata in each rule is the only selection source; todo, research, fixtures and tool
   comments are not policy catalogs. Local rules belong in `.agents/rules` with `local.*` ids.
```

**5. `research/module_rules.md`.** The paragraph at `:19-23` becomes: *Metadata keys: `id`, `load`, optional `paths`,
`tasks`, `depends`, `path_tasks`. Unknown fields/tasks, duplicate ids/keys, empty bodies, missing dependencies and cycles
are errors even in unselected rules, and so is a `path_tasks` that is empty, names an unknown task, sits on an `always`
rule or has no `paths` to gate. All Markdown in the four rule directories must declare metadata. Local rules use the same
schema and `local.*` ids. The migration inventory records every original rule section and body hash; it is historical
evidence, not a second selector.* Add before `References:` a section `## Task-gated path selection — path_tasks
(2026-10-31)`: the semantics (paths gated; reason `path:<file> (<pattern>) when task:<t>[,<t>…]`; plain `tasks` and
dependencies ignore the gate; explain lists `path_tasks`, `[]` when ungated); the one legitimate use (the plan's D3 and
T11, cited as plain text `todo/PLAN_node_rule_parity.md`, not a link); `GATE_SOURCES` in `tools/rules.test.mjs` and what
it refuses.

**6. `research/module_tests.md`** — a section naming the six tests, one line each, and: *What it does not prove: that a
gated rule's TEXT is its source's — that is `research/moved-blocks.json` and its test.*

---

## E1.S2 — The selection matrix: every representative scope's id list, regenerated by a tool and compared

- **Size.** M — a tool of about 150 lines, its test, the generated file (≈ 55 KB), one measured table.
- **Models.** Brief: Opus (below). Tool, data, test, table: a Sonnet coder. Review: Opus (it reads the single-read id
  lists against the table below and the split-read lists in the diff).
- **Goal.** Parent § 4.1 (`:217-238`), D12, § 7 (`:601`) and § 10 (`:658`): the exact ids each of the 108 representative
  scopes selects are in `research/selection-matrix.json`, produced by `tools/selection-matrix.mjs`; a test regenerates
  the file and fails on any difference, so a selector change the body freeze cannot see (F3) is red until the file is
  regenerated, and a hand edit that does not match the catalog is refused. The bytes of every scope are recorded in
  `research/module_rules.md` with their commit and the command that re-measures them.

### The scopes and the expected single-read lists

12 file sets × 9 tasks, file sets in this order: none · `src/x.cs` · `src/x.csproj` · `Directory.Build.props` · `ui/a.ts`
· `src/a.mjs` · `src/x.cs` + `ui/a.ts` · `package.json` · `tsconfig.json` · `.npmrc` · `src/webview/page.ts` ·
`src/main.rs`; tasks `inspect`, `ui`, `gpu`, `storage`, `implement`, `test`, `audit`, `logging`, `dependencies`. A scope's
name is `<task> <files joined by " + ">` or `<task> (no file)`.

| Task | Base (no file) | + `src/x.cs` | + `src/x.csproj` | + `Directory.Build.props` | + `ui/a.ts` or `src/webview/page.ts` | + both | + `package.json` | + `src/main.rs` |
|---|---|---|---|---|---|---|---|---|
| `inspect` | `common.coding-style`, `common.knowledge-base`, `common.security`, `common.task-lifecycle` | + `csharp.doctrine` | + `csharp.doctrine`, `csharp.nuget-packages` | + `csharp.nuget-packages` | + `typescript.doctrine` | + both doctrines | + `common.local-cpu-budget` | + `common.logging-serilog`, `rust.doctrine` |
| `ui` | inspect's four + `common.durable-status` | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect |
| `gpu` | inspect's four + `common.gpu-lease` | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect |
| `storage` | inspect's four + `common.utc-timestamps` | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect |

`src/a.mjs`, `tsconfig.json` and `.npmrc` select exactly the base list today.

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 2.1 | the real catalog and the committed file | `render(catalog)` against the file | byte-equal — the regeneration test |
| 2.2 | the committed file | read | 108 entries, names unique, every `tasks` a known task, `ids` sorted and unique, every (task, file set) of the tool's `SCOPES` exactly once |
| 2.3 | a copy of the four rule directories and `research/rule-bodies.json` in an owned folder, `tasks: ["dependencies"]` deleted from the copy's `csharp/nuget-packages.md` | `idDrift(loadCatalog(copy), file)` | contains `dependencies (no file): the matrix lists csharp.nuget-packages, which it no longer selects` |
| 2.4 | the same copy | `drifted(copy, manifest)` (`tools/rule-bodies.mjs`) | `[]` — 2.3 and 2.4 are D12's point, one test named for it |
| 2.5 | a copy with one body sentence of `csharp/doctrine.md` changed | `drifted` / `idDrift` | `drifted` names `csharp.doctrine`; `idDrift` is `[]` |
| 2.6 | the committed file with one id deleted in memory | `idDrift` | one finding naming the scope, the id and the direction |
| 2.7 | `node tools/selection-matrix.mjs` on a clean copy / after deleting one id from the copy's file | exit code and output | 0 and `selection-matrix: in step — 108 scope(s)`; 1, the finding line and `regenerate with --write after reading why` |

### Files

`tools/selection-matrix.mjs`, `tools/selection-matrix.test.mjs`, `research/selection-matrix.json` (all new);
`research/module_rules.md`, `research/module_tests.md`, `README.md` § *tools*.

### Acceptance criteria

2.1–2.7 pass; the single-read lists equal the table above; the bytes table in `research/module_rules.md` equals F10 number
for number (re-measured with `--bytes`; a difference is reported, not smoothed), with the commit and date.

### RED → GREEN → RED

1. **RED.** Write the test before the tool and the file: it fails at import (`Cannot find module …/selection-matrix.mjs`).
   Record the line.
2. **GREEN.** Write the tool, `node tools/selection-matrix.mjs --write`, all pass.
3. **RED again.** (a) Delete one id from a split-read entry of the file → 2.1 and the tool's verify fail naming it;
   restore. (b) Make `idDrift` ignore the "no longer selects" direction → 2.3 fails; restore.

### Docs to update

`research/module_rules.md` (the bytes table, the command); `research/module_tests.md`; `README.md` § *tools* (one row).

### The brief (for the Sonnet coder)

**1. `tools/selection-matrix.mjs`** — ESM; imports `loadCatalog`, `selectRules` from `./lib/rule-catalog.mjs`, `node:fs`,
`node:path`, `node:url`. Exports:

- `FILE_SETS` (the 12, in the order above), `TASKS_PINNED` (the 9), `SCOPES` = tasks × file sets, each
  `{ name, tasks: [task], files }`.
- `ONE_READ` — `Object.freeze({})` in S2; S5 fills it (`name → { oneRead, why? }`).
- `render(catalog)` → the file's exact text:
  ```js
  const note="The exact rule ids each representative scope selects (todo/PLAN_node_rule_parity.md section 4.1, D12). Generated by tools/selection-matrix.mjs --write; tools/selection-matrix.test.mjs fails when the catalog selects a different list or the file was edited by hand. The body freeze (rule-bodies.json) hashes bodies after the front matter, so a changed paths, tasks, depends or path_tasks line is seen here.";
  const line=s=>`    {"name": ${JSON.stringify(s.name)}, "tasks": ${JSON.stringify(s.tasks)}, "files": ${JSON.stringify(s.files)},${extra(s)}\n     "ids": ${JSON.stringify(s.ids)}}`;
  return `{\n  "note": ${JSON.stringify(note)},\n  "scopes": [\n${scopes.map(line).join(",\n")}\n  ]\n}\n`;
  ```
  where `extra(s)` is `""` in S2 (S5 makes it ` "oneRead": …,` and ` "why": …,`), and `ids` is
  `selectRules(catalog, s.tasks, s.files).map(r=>r.id).sort()`.
- `idDrift(catalog, parsedFile)` → `["<name>: selects <id>, which the matrix does not list", "<name>: the matrix lists <id>, which it no longer selects", …]`.
- `bytesTable(catalog)` → the markdown table of F10 (rows the file sets, columns the 9 tasks, thousands separators).
- CLI, when run directly: no argument → verify (`render(loadCatalog(root))` against the file; print the `idDrift`
  findings and the hint; exit 0/1); `--write` → write the file atomically (temporary file + rename, as
  `tools/rule-bodies.mjs:98-112`); `--bytes` → print `bytesTable`; anything else → usage, exit 2.

**2. `tools/selection-matrix.test.mjs`** — the scenarios; `ownedDir(t, "selection matrix")` for the copies (never
`mkdtemp`/`os.tmpdir()`), `fs.cpSync(…, {recursive: true})` of `common`, `csharp`, `rust`, `typescript`, `tools` and
`research`; 2.7 runs the copy's tool with `spawnSync(process.execPath, [tool], {cwd, timeout: GUARD_MS})`. Test names:
`the committed selection matrix is exactly what the catalog regenerates`, `the matrix covers its scopes once each with
sorted unique ids`, `a front-matter-only change passes the body freeze and fails the selection pin`, `a body-only change
is the freeze's to catch, not the pin's`, `a drift names the scope, the id and the direction`, `the tool verifies, and
refuses a hand edit with exit 1`.

**3. `research/module_rules.md`** — after the `path_tasks` section: `## The selection/budget matrix
(todo/PLAN_node_rule_parity.md § 4.1, measured 2026-10-31 at <sha>)` — one paragraph (what the file pins, the tool, the
test, "regenerate with `--write` in the commit that changes selection; the diff names every id that joined or left a
scope"), the table `node tools/selection-matrix.mjs --bytes` prints, the facts *`src/main.rs` selects
`common.logging-serilog` through `**/main.rs`; `src/a.mjs` selects no language rule until E4*, and *each later epic
re-runs `--bytes` and REPLACES this table, naming its commit*. `<sha>` is the commit measured (after S0).

**4. `README.md` § *tools*** — one row in the table's shape: `tools/selection-matrix.mjs` | the pinned id list of every
representative scope (D12) — regenerated, never hand-edited | `node tools/selection-matrix.mjs` to verify, `--write` to
regenerate, `--bytes` for the measured table (this repository only).

---

## E1.S5 — The single-read list of D5, the caps of § 5, and every later epic's allowance

- **Size.** S — one constant in the S2 tool, the regenerated file, the single-read test rewritten, two caps, two
  sections of `module_rules.md`.
- **Models.** Brief: Opus (below). Code, data, text: a Sonnet coder. Review: Opus.
- **Goal.** Parent § 4.1's exit criterion, § 5 (`:518-575`), § 10 (`:646`) and § 11 (`:700-702`): the scopes that must
  fit one read are data (`oneRead` in the matrix, set in the tool), with a reason for every single-read-task scope left
  out; the test reads them instead of a literal list; the core's hard cap and the `gpu` number are tests; the allowances
  of every later epic are written down with the scope each protects.

### The list (the parent's: the pinned scopes D5 keeps, plus the new config scopes)

`oneRead: true` — 16 scopes:

| Task | `oneRead: true` |
|---|---|
| `inspect` | none · `src/x.cs` · `src/x.csproj` · `ui/a.ts` · `tsconfig.json` · `.npmrc` |
| `ui` | none · `tsconfig.json` · `.npmrc` |
| `gpu` | none · `src/x.cs` · `tsconfig.json` · `.npmrc` |
| `storage` | none · `tsconfig.json` · `.npmrc` |

Every split-read-task scope: `oneRead: false`, no `why`. The other 32 single-read-task scopes: `oneRead: false` with a
`why`, exactly:

| Scopes | `why` |
|---|---|
| `ui src/x.cs`, `ui ui/a.ts`, `ui src/a.mjs`, `ui src/webview/page.ts` | `D5: ui with a language file is off the single-read list (plan section 5)` |
| `ui src/x.csproj`, `ui src/x.cs + ui/a.ts` | the D5 text, then `; over one read today: <bytes> B` (34,114; 36,921) |
| the 18 over-today scopes: `inspect` mixed, `package.json`, `src/main.rs`; `ui` `package.json`, `src/main.rs`; `gpu` `src/x.csproj`, `ui/a.ts`, mixed, `package.json`, `src/webview/page.ts`, `src/main.rs`; `storage` `src/x.cs`, `src/x.csproj`, `ui/a.ts`, mixed, `package.json`, `src/webview/page.ts`, `src/main.rs` | `over one read today: <bytes> B` with its F10 number; `inspect src/main.rs` adds `; about 38,030 B after the plan, still over (plan section 5)`; `gpu ui/a.ts` adds `; E4 pins it at 32,680 B or less (plan section 5, E4.S4)` |
| `storage src/a.mjs` | `fits today (29,406 B); about 33,300 B once E4 makes .mjs select the TypeScript doctrine, over one read and unpinned (plan section 5)` |
| `gpu src/a.mjs` | `fits today (27,680 B) and 32,680 B or less after E4, unpinned by the plan (section 5)` |
| `inspect Directory.Build.props`, `inspect src/a.mjs`, `inspect src/webview/page.ts`, `ui Directory.Build.props`, `gpu Directory.Build.props`, `storage Directory.Build.props` | `fits today (<bytes> B); not on the plan's single-read list (section 10) — open point O7` |

### The caps and allowances (parent § 5, `:528`, `:539`, `:567-575`)

| Epic | Allowance | Protects | Today (F10) | Tested in E1 |
|---|---|---|---|---|
| all | the always core ≤ **15,355 B** (15,055 + a hard 300 B for P7's pointer in E4, P15 in E5, P14 in E6) | `gpu --file src/x.cs`, every scope | 15,055 B | **yes** |
| E3 (+ the core) | `gpu --file src/x.cs` ≤ **32,613 B** (32,293 + 20 for `Nullable enable` + ≤ 300 core); `csharp/doctrine.md` ≤ 4,633 B, its only growth the `Nullable enable` line; the Definition of Done is the gated `csharp/definition-of-done.md` | `gpu src/x.cs` stays on the list | 32,293 B; 4,613 B | **yes** (the scope) |
| E2 | `common/dependencies.md` ≤ 4,000 B; `typescript/npm-packages.md` ≤ 3,500 B; the NuGet rule only loses bytes | the split-read `dependencies` scopes | `dependencies package.json` 171,557 B | no |
| E3 | `typescript/compiler-strictness.md` ≤ 3,300 B | `storage tsconfig.json` (≤ 31,900 B after `utc-timestamps` shrinks) | 29,406 B | no (the 32,768 pin holds it) |
| E4 | `typescript/doctrine.md` ≤ **4,700 B** after the moves (562 B intro + § 0 ≤ 3,800 B + pointers; § 1–§ 4 moved) | `gpu ui/a.ts`, `gpu src/a.mjs` ≤ 32,680 B; `inspect ui/a.ts`, `inspect src/a.mjs` ≤ 30,116 B | 5,888 B after S0 | no (holds only after E4) |
| E4, E6 | `csharp/boundaries.md` ≤ 1,400 B | `ui src/x.cs` ≤ 32,755 B, measured, not guaranteed (off the list by D5) | — | no |
| E5, E6 | gated rules: measured and recorded, no single-read cap; `typescript/utc-timestamps.md` ≤ 1,200 B | `storage ui/a.ts` improves | 35,294 B | no |

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 5.1 | the matrix's `oneRead: true` scopes | each selected on the real catalog | ≤ 32,768 B; the message names scope and bytes |
| 5.2 | the matrix | read | every entry has a boolean `oneRead`; every single-read-task entry with `false` has a `why` ≥ 10 characters; no split-read-task entry is `true`; at least one `true` |
| 5.3 | the matrix | the floor | the eight scopes of F5 that D5 keeps (`inspect` ×{none, `src/x.cs`, `src/x.csproj`, `ui/a.ts`}, `ui` none, `gpu` ×{none, `src/x.cs`}, `storage` none) are `true` |
| 5.4 | the matrix | D5 | no `ui` entry with a `.cs`, `.razor`, `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs` or `.cjs` file is `true` |
| 5.5 | an inline entry `inspect package.json` with `oneRead: true` | `oneReadFindings(catalog, [entry])` | `inspect package.json selects 35409 B, over the 32768 B read` |
| 5.6 | the real catalog | the always core (every `load: always` rule and its dependency closure, as `loadCatalog` computes it) | ≤ 15,355 B |
| 5.7 | the real catalog | `gpu src/x.cs` | ≤ 32,613 B |
| 5.8 | a fixture catalog whose core is 15,356 B / a fixture `gpu` scope over 32,613 B | the two cap checks as functions | each names its number |

### Files

`tools/selection-matrix.mjs` (`ONE_READ`, `extra`), `research/selection-matrix.json` (regenerated), `tools/rules.test.mjs`
(`:250-257` and two caps), `tools/selection-matrix.test.mjs` (5.2–5.4), `research/module_rules.md`.

### Acceptance criteria

5.1–5.8 pass; exactly the 16 `true` scopes; every `why` as above with F10's numbers; the allowances table in
`research/module_rules.md`.

### RED → GREEN → RED

1. **RED.** Rewrite the single-read test to read `oneRead` and add 5.2–5.8 before filling `ONE_READ`: 5.1 fails with
   `no oneRead scopes in research/selection-matrix.json — the single-read pin has nothing to check`, 5.2/5.3 fail naming
   the missing fields; 5.6/5.7 pass (today's numbers). Record.
2. **GREEN.** Fill `ONE_READ`, `--write`, all pass.
3. **RED again.** Set `inspect package.json` to `true` in `ONE_READ` and regenerate → 5.1 fails with 35,409 B; restore.
   Set `ui ui/a.ts` to `true` → 5.4 fails while 5.1 passes (32,308 B: D5, not the budget, removes it); restore. Lower the
   core cap constant to 15,054 → 5.6 fails naming 15,055; restore.

### Docs to update

`research/module_rules.md` — two sections (below); `research/module_tests.md` — the rewritten test and the new cases.

### The brief (for the Sonnet coder)

**1.** In `tools/selection-matrix.mjs`, fill `ONE_READ` with the 48 single-read-task names and their values from the two
tables above (`{ oneRead: true }` or `{ oneRead: false, why: "<text>" }`); every split-read name is `{ oneRead: false }`
by default in `render`. `extra(s)` writes ` "oneRead": <bool>,` and, when present, ` "why": <json>,` on the first line of
the entry. `node tools/selection-matrix.mjs --write`; read the diff: 108 `oneRead`, 32 `why`.

**2. `tools/rules.test.mjs:250-257`** — keep the test name `every single-read scope of the four excluded tasks still
fits one read`; it reads `research/selection-matrix.json`, takes `oneRead === true`, asserts there is at least one and
that `oneReadFindings(catalog, scopes)` is `[]`. Add `the always core stays within the plan's hard cap` (5.6, constant
`CORE_CAP = 15355` with a comment citing the plan's § 5) and `gpu with a C# file stays within the plan's number` (5.7,
constant `GPU_CS_CAP = 32613`), each over a function so 5.5 and 5.8 test it on fixtures. A comment above: the list is
D5's, set in the tool; a scope leaves it only with a `why` (D1: never by a cut).

**3. `tools/selection-matrix.test.mjs`** — 5.2, 5.3 (the floor written out: the one literal list that is right, the
record of what was pinned before E1) and 5.4.

**4. `research/module_rules.md`** — after the matrix section: `### The single-read list (D5)` — *the scopes that must
fit one read are the `oneRead: true` entries of `research/selection-matrix.json`, set in `tools/selection-matrix.mjs`
(16 at 2026-10-31); `tools/rules.test.mjs` fails when one passes 32,768 B, when the always core passes 15,355 B, and when
`gpu --file src/x.cs` passes 32,613 B; every single-read-task scope outside the list says why; a scope leaves the list
only by a decision with its measured number, never by a deletion (D1)* — and `### Byte allowances per later epic (the
plan's § 5)` with the allowances table above and the sentence *each epic measures its files and scopes before its pull
request and writes the numbers here; an allowance it cannot keep goes to the owner as an open question with the
numbers.*

---

## E1.S3 — The parity inventory, the parity matrix and the consumers file, with their tests

- **Size.** L — three data files (30 entries, 30 rows, 8 consumers), one shared constant module, two tests (≈ 450 lines
  with their fixtures).
- **Models.** Brief: Opus (below — the data is decided here, row by row, from the parent). Data and tests: a Sonnet
  coder. Review: Opus.
- **Goal.** Parent § 2 (`:139-152`), § 4.1 (`:240-289`), § 10, § 11 (`:676-686`): the inventory lists every requirement
  (P1–P20, R1–R5, G1–G5) with its status; the matrix holds one row per requirement; tests prove one-to-one, real
  locations, the `stronger-*` whitelist `['P4']`, the per-side equality fields of every `equal` row (side to side, and
  against the rule files and tools), the structural validity of `planned` rows with their owning epic, and that no
  `planned` row outlives its epic. `research/consumers.json` is derived from `README.md` § *Consumers* and tested equal to
  it.

### The schema

`research/parity-inventory.json` — `{ "note", "entries": [ { "id", "topic", "side", "status", "epic"?, "reason"? } ] }`:
`side` ∈ `csharp|typescript|both`; `status` ∈ `counterpart|deliberately-absent|planned`; `epic` exactly when `planned`;
`reason` exactly when `deliberately-absent` (≥ 20 characters) — **the one home of every deliberately-absent reason**
(§ 3.3 `:202`, § 11 `:676-678`).

`research/parity-matrix.json` — `{ "note", "rows": [ { "inventory", "topic", "status", "epic"?, "reason"?, "strength",
"csharp": <side>, "typescript": <side> } ] }`: `status` ∈ `planned|equal|stronger-ts|stronger-cs|deliberately-absent`;
`epic` exactly when `planned`; `reason` exactly when `stronger-*` (O2). A `<side>` is one of:

- **present** `{ "id", "section" }` — a location that exists now; in an `equal` or `stronger-*` row it also carries the
  five equality fields:
  - `selectors` `{ "paths": [], "path_tasks": [], "tasks": [] }`
  - `mood` `MUST|SHOULD`
  - `enforcement` `{ "class": "prose" }`, `{ "class": "test", "test": "tools/<x>.test.mjs" }`, `{ "class": "check", "tool": "<name>" }` or `{ "class": "hook", "hook": "<name>" }`
  - `consequence` `none|test-fails|check-fails|build-fails|hook-refuses`
  - `suppression` `none|inline-with-reason`
- **planned** `{ "planned": "E2".."E6", "id", "section"? }` — a destination not yet written;
- **absent** `{ "absent": true }` — deliberately absent on that side (the reason is the inventory's).

`tools/lib/parity-epics.mjs` — `export const LANDED_EPICS = Object.freeze([]);` with a comment: *the last story of each
epic of todo/PLAN_node_rule_parity.md adds its id here in its own pull request; a `planned` row or move entry naming a
listed epic is a red suite (plan § 4.1).* Read by S3's and S4's tests.

`research/consumers.json` — `{ "note", "consumers": [ { "repo", "kind", "mount", "notes" } ] }`, `kind` ∈
`dotnet|typescript|mixed|rust`.

### The rules the matrix test enforces (`parityFindings`)

1. Inventory: ids `^[PRG][1-9][0-9]*$`, unique; `topic` non-empty; `side`/`status` from their sets; `epic` and `reason`
   exactly as the schema says.
2. One-to-one: every inventory id has exactly one row, every row names an inventory id; the row's `topic` equals the
   entry's.
3. A **present** side, in any row: `id` in the catalog, `section` one of its recorded sections in
   `research/rule-bodies.json` (F6).
4. A **planned** side: `planned` ∈ E2–E6; `id` `^(common|csharp|rust|typescript)\.[a-z0-9-]+$`; `section`, if given,
   starts with `#`. Neither is checked against the catalog (parent § 4.1 `:262-271`). An absent side is exactly
   `{ "absent": true }`. Any other side shape is a finding.
5. Row status: `planned` ⇔ at least one side planned, no side absent, and `epic` = the latest planned side's epic;
   `deliberately-absent` ⇔ at least one side absent and none planned, with no `reason` in the row; `equal`,
   `stronger-ts`, `stronger-cs` ⇔ both sides present, each with all five fields.
6. **The whitelist** `STRONGER_EXCEPTIONS = ["P4"]`, a constant of the test file with a comment citing the plan's § 2 and
   § 11: a `stronger-*` row whose inventory id is not listed is a finding, with or without a `reason`; a listed one needs
   a non-empty `reason`; an `equal` row carries no `reason`.
7. Inventory status ↔ row: `counterpart` ⇔ the row is `equal` or `stronger-*`; `deliberately-absent` ⇔ the row is;
   `planned` ⇔ the row is, with the same `epic`.
8. A `planned` row or inventory entry whose epic is in `LANDED_EPICS` is a finding.
9. **Side to side** (every `equal` row): `mood`, `enforcement.class`, `consequence` and `suppression` equal;
   `selectors.path_tasks` and `selectors.tasks` equal as sets; and the sets of path KINDS equal, by `pathKind(glob)` on
   the glob's last segment: `*.cs`, `*.razor`, `*.ts`, `*.tsx`, `*.mts`, `*.cts`, `*.js`, `*.mjs`, `*.cjs`, `*.rs` →
   `source`; `*.csproj`, `tsconfig*.json`, `Cargo.toml` → `project`; `Directory.Packages.props`,
   `Directory.Build.props`, `NuGet.Config`, `package.json` → `manifest`; `Program.cs`, `main.rs` → `host-entry`;
   `*.slnx`, `*.sln`, `Directory.Build.rsp` → `build`; anything else → `other:<glob>` (O4).
10. **Against reality** (every side of an `equal` or `stronger-*` row): `selectors` equal the rule's catalog `paths`,
    `pathTasks`, `tasks` as sets; `mood` is `MUST` exactly when the recorded `section` heading contains `(MANDATORY)`
    (O6); `enforcement` `check` → `tools/<tool>.mjs` exists and its exported `CHECKED_RULES` array contains the side's
    `id` (E3's `tools/strictness-check.mjs` must export it); `hook` → `settings/hooks/<hook>.mjs` exists; `test` → the
    named file exists.

Messages: `` `<file>: <id>: <what>` ``, `<file>` `parity-inventory.json` or `parity-matrix.json`.

### The data (decided here from the parent; copy exactly)

At E1 every row is `planned` or `deliberately-absent`; no row carries the five fields yet (each owning epic adds them when
it activates its row). CD = `csharp.doctrine`, TD = `typescript.doctrine` in this table only.

| Inv. | side | topic | C# side | TypeScript side | row status | epic |
|---|---|---|---|---|---|---|
| P1 | csharp | runtime and compiler version statement | present CD `## 1. Language & runtime` | planned E4 TD `## 0. Language, runtime and design` | planned | E4 |
| P2 | csharp | warnings fail the build, checked | present CD `## 1. Language & runtime` | planned E3 `typescript.compiler-strictness` | planned | E3 |
| P3 | both | nullability is checked by the compiler | planned E3 CD `## 1. Language & runtime` | planned E3 `typescript.compiler-strictness` | planned | E3 |
| P4 | csharp | complexity and function size bounds | present CD `## 6. Pure functions, small methods` | planned E3 `typescript.compiler-strictness` | planned | E3 |
| P5 | csharp | data contracts, typed values, absence as a state | present CD `## 2. Records for data, classes for services` | planned E4 TD `## 0. Language, runtime and design` | planned | E4 |
| P6 | csharp | untrusted JSON is validated; identifiers above 2^53 keep their precision | planned E4 `csharp.boundaries` | planned E4 `typescript.boundaries` | planned | E4 |
| P7 | csharp | expected failures are values | present CD `## 5. Expected failures are values, not exceptions` | planned E4 TD `## 0. Language, runtime and design` | planned | E4 |
| P8 | csharp | the build worker pool is bounded | present `csharp.dotnet-build` ``# `dotnet build` — bound the worker pool, because several sessions build at once`` | absent | deliberately-absent | — |
| P9 | csharp | package approval, freshness, licence, pins | present `csharp.nuget-packages` `## Before adding any package` | planned E2 `typescript.npm-packages` | planned | E2 |
| P10 | csharp | the test runner and its exit code | present `common.testing` ``## Running tests — executables only, never `dotnet test` (MANDATORY)`` | planned E6 `typescript.testing` | planned | E6 |
| P11 | csharp | layer rules are a test | present `common.testing` `## Architecture is a test, not a review comment` | planned E6 `typescript.testing` | planned | E6 |
| P12 | csharp | the logging library and its shape | present `common.logging-serilog` `## The shape (C#)` | planned E6 `typescript.logging` | planned | E6 |
| P13 | csharp | cancellation, timeouts and shutdown | present `common.reliability` `### A timeout is not a cancellation — and .NET spells them the same` | planned E5 `typescript.lifecycle` | planned | E5 |
| P14 | csharp | secrets outside the source | present `common.security` `## Secret management` | planned E6 `common.security` `## Secret management` | planned | E6 |
| P15 | csharp | a timed-out child takes its tree with it | present `common.security` `## External processes` | planned E5 `typescript.lifecycle` | planned | E5 |
| P16 | csharp | instants are UTC; a calendar day is stamped | present `common.utc-timestamps` `## The rule` | planned E6 `typescript.utc-timestamps` | planned | E6 |
| P17 | csharp | limits counted in encoded bytes | present `common.platform-limits` `## 1. A platform limit is the KERNEL's number, in the KERNEL's unit — and one adapter owns it` | planned E6 `common.platform-limits`, the same section | planned | E6 |
| P18 | csharp | HTTP route groups and route coverage | present `common.http-contracts` `## Where the files live` | planned E6 `common.http-contracts` `## Where the files live` | planned | E6 |
| P19 | csharp | the published package registry is checked after a release | present `common.post-deploy-checks` `## What "prod" is, per repository — and nobody is exempt` | planned E6 `common.post-deploy-checks`, the same section | planned | E6 |
| P20 | csharp | which files select the language rules | present CD `# C# doctrine — the family's code rules` | planned E4 TD (no section) | planned | E4 |
| R1 | typescript | data serialised into a script element | planned E6 `csharp.boundaries` | present TD ``## 1. Never interpolate into a `<script>` element with `JSON.stringify` (MANDATORY)`` | planned | E6 |
| R2 | typescript | a fixture cast hides a shape | planned E6 `csharp.testing` | present TD ``## 3. An `as` cast is a promise to maintain a shape by hand — and it comes due silently`` | planned | E6 |
| R3 | typescript | a Definition of Done | planned E4 `csharp.definition-of-done` | planned E4 `typescript.definition-of-done` | planned | E4 |
| R4 | typescript | the compiler emits despite errors | absent | present TD ``## 4. `tsc` emits despite errors — so a green suite can be green against stale output`` | deliberately-absent | — |
| R5 | typescript | a backtick ends a template literal | absent | present TD `## 2. A backtick inside a template literal ends it — including inside a comment` | deliberately-absent | — |
| G1 | both | an analyzer or lint requirement | present CD `## 1. Language & runtime` | planned E3 `typescript.compiler-strictness` | planned | E3 |
| G2 | both | a lock file and a locked restore | present `csharp.nuget-packages` `# NuGet packages — approval, freshness, licence` | planned E2 `typescript.npm-packages` | planned | E2 |
| G3 | both | a vulnerability scan on the monthly bump | planned E2 `common.dependencies` | planned E2 `common.dependencies` | planned | E2 |
| G4 | both | coverage thresholds | absent | absent | deliberately-absent | — |
| G5 | both | CI steps per language | absent | absent | deliberately-absent | — |

Inventory `status` = the row status; `epic` as the table. Reasons (inventory only):

- **P8**: `no Node counterpart: the rule exists for a measured MSBuild worker-pool problem Node builds do not have; a hook is added for a measurement, not for symmetry, and Node's enforced rule is P2's check (plan section 3.1 P8, section 4.6)`
- **R4**: `no C# counterpart needed: the C# compiler emits nothing on an error; the TypeScript rule states it as a difference, not a gap (plan section 3.2 R4)`
- **R5**: `no comparable C# trap: a raw string literal cannot be ended by a shorter run of quotes (plan section 3.2 R5)`
- **G4**: `deliberately absent on both sides: the testing rule governs what a test may claim, and a coverage number is gamed the week it lands (plan section 3.3; the owner confirms in Q10)`
- **G5**: `deliberately absent as shared rules: each repository's own instructions and CI name the exact commands, and a shared list would be an inventory (plan section 3.3)`

`strength` (the parent's § 3 Strength column, short): P1 `prose, selected on every language file`; P2 `file and check on
both sides (tools/strictness-check.mjs, both halves)`; P3 `raised on both: Nullable enable and strictNullChecks inside
strict`; P4 `C#: prose; TypeScript: lint-enforced (complexity 4, max-lines-per-function 50, max-lines 800, no-console);
the one accepted exception, Q7`; P5, P7, P11 `prose and prose`; P6 `prose and prose in the gated boundaries pair; both
name the exact and the lossy readers`; P8 `C#: hook and check for a measured resource problem; Node: none`; P9 `prose
and prose, each selected by its own manifest; the shared part on --task dependencies`; P10 `prose and prose; gated on
the testing rule's tasks`; P12 `prose and prose; gated on the logging rule's tasks`; P13 `prose and prose; gated on the
reliability rule's tasks`; P14 `always core, equal`; P15 `always core, equal; the asymmetry stated (Node has no tree
kill)`; P16 `prose and prose; gated on the timestamp rule's tasks`; P17 `one clause in the same sentence`; P18 `rows and
rows; the route table through --routes`; P19 `one word in the same list`; P20 `selector and selector`; R1 `MANDATORY and
MANDATORY; gated on implement, test, audit, ui, http`; R2 `prose and prose; typed-fixture discipline side by side`; R3
`a gated Definition of Done on both sides, the same gate`; R4, R5 `TypeScript: prose; C#: none needed`; G1 `C#: the
compiler at TreatWarningsAsErrors with Nullable enable; TypeScript: lint at zero warnings; both checked`; G2 `TypeScript:
a lock and npm ci fix transitives; C#: central exact pins of direct packages; the asymmetry is Q1 (O1)`; G3 `the same
sentence for every ecosystem`; G4, G5 `none on either side`.

`research/consumers.json` (F9; kinds from the parent `:279-284`), in README order: `dew_flow_rag_qln` `dotnet`
`.claude/rules/shared`; `dew_flow_mcp` `dotnet` `.claude/rules/shared`; `dew_flow_sidecar_rust` `rust`
`.claude/rules/shared`; `dew_flow_benchmark` `dotnet` `.agents/conventions`; `dew_flow_creds_for_devs` `mixed`
`.claude/rules/shared`; `dew_flow_connect_other_ais` `mixed` `.agents/conventions`; `wsl_care` `mixed`
`.agents/conventions`; `dew_flow_vscode_kit` `typescript` `.agents/conventions`. `notes`: `mount read from the local
checkout's .gitmodules, 2026-10-31` on each, plus for `dew_flow_sidecar_rust` `the check passes without opinion; wired
only if Q8 says every consumer does`. The coder re-reads each `.gitmodules` (`git -C ../<repo> config -f .gitmodules
--get-regexp 'submodule\..*\.path'`) and reports a difference instead of copying this list blindly.

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 3.1 | the three real files, the real catalog, `research/rule-bodies.json`, `LANDED_EPICS` | `parityFindings` | `[]` |
| 3.2 | a minimal fixture: one entry `P1` (`counterpart`), one `equal` row, both sides present with the five fields, against a fake catalog `{a.x: paths ["**/*.cs"], sections ["# A","## One (MANDATORY)"]}` and `{b.y: paths ["**/*.ts"], sections ["# B","## Two (MANDATORY)"]}` | `parityFindings` | `[]` — the positive case every negative below mutates |
| 3.3–3.5 | an entry with no row / a row with no entry / two rows for one id | | one finding each, naming the id |
| 3.6–3.7 | an ACTIVATED (`equal`) row whose present side names `a.missing` / `## Gone` | | one finding each — the parent's E1 done-when, as a test |
| 3.8 | a `planned` row with no `epic` / `epic: "E9"` / a planned side with `planned: "E1"` | | one finding each — "a `planned` row names no owning epic", as a test |
| 3.9 | a `planned` row whose planned side names `typescript.not-yet` | | `[]` — a planned destination is not checked against the catalog |
| 3.10 | a `planned` row whose PRESENT side names a missing section | | a finding — the existing side is checked even in a planned row |
| 3.11 | `status: "stronger-ts"` on `P2`, with a reason / without | | one finding each: `P2` is not in the whitelist |
| 3.12 | `stronger-ts` on `P4` with a reason / without | | `[]` / one finding (a reason is required) |
| 3.13 | an `equal` row with a `reason` | | one finding |
| 3.14 | an `equal` row whose sides differ in `mood` / `enforcement.class` / `consequence` / `suppression` / `path_tasks` / path kinds (`**/*.csproj` on one side only) | | one finding each (side to side) |
| 3.15 | an `equal` row whose side's `selectors.paths` differ from the fake catalog's / `mood: "SHOULD"` under a `(MANDATORY)` heading / `enforcement` `check` naming a tool file that does not exist / a tool module exporting `CHECKED_RULES` without the id / `hook` naming no file under `settings/hooks/` | | one finding each (against reality; the tool and hook fixtures are files in an owned folder) |
| 3.16 | a `deliberately-absent` row with a `reason` / with no absent side / an absent side in an `equal` row | | one finding each |
| 3.17 | inventory `counterpart` beside a `planned` row / inventory epic `E3` beside a row epic `E5` / a `deliberately-absent` entry without `reason` | | one finding each |
| 3.18 | the fixture with landed epics `["E3"]` and a row planned for E3 | | one finding: the epic has landed and the row is still planned |
| 3.19 | `research/consumers.json` and `README.md` | the repository column of the `## Consumers` table (backticked first cells) against `consumers[].repo` | equal sets, the same count (8); every `kind` in its set |
| 3.20 | the consumers fixture with one repository missing / one extra / a kind `java` | | one finding each |

### Files

`research/parity-inventory.json`, `research/parity-matrix.json`, `research/consumers.json`, `tools/lib/parity-epics.mjs`,
`tools/parity-matrix.test.mjs`, `tools/consumers.test.mjs` (all new); `research/module_rules.md`,
`research/module_tests.md`.

### Acceptance criteria

3.1–3.20 pass; 30 entries, 30 rows, 8 consumers; the data equals the tables; the RED-again observations below are in the
commit body.

### RED → GREEN → RED

1. **RED.** Write both tests first: 3.1 fails with the test's message `research/parity-inventory.json is missing` (not a
   stack) and 3.19 with `research/consumers.json is missing`; the fixture cases need `parityFindings`, written in the same
   file, so they are green with it. Record.
2. **GREEN.** Write the files; all pass.
3. **RED again, on the real files** (the parent's "observed, then fixed"): set P10's row to `equal` with both sides
   present (the five fields filled), its C# `id` changed to `common.testng` → 3.1 names the id; restore. Delete P13's
   `epic` → 3.1 names it; restore. Set P2 to `stronger-ts` with a reason → 3.1 names the whitelist; restore. Delete the
   G3 row → 3.1 names G3; restore.

### Docs to update

`research/module_rules.md` — section *The parity matrix* (below); `research/module_tests.md` — the two tests and what they
do not prove (that a present location's text meets the requirement with equal strength — the review's, against the
plan's § 2).

### The brief (for the Sonnet coder)

**1. The files** from the tables, `JSON.stringify(…, null, 2)` with a trailing newline, P1…P20, R1…R5, G1…G5; ids written
out. Copy section strings from `research/rule-bodies.json`; report any difference from this document. The `note` of each
file: one sentence — the machine-readable form of the plan's § 3 (as plain text `todo/PLAN_node_rule_parity.md`), what
its test keeps true, and that an owning epic activates its rows in the commit that writes their text (status, the five
fields, and its id in `tools/lib/parity-epics.mjs` at its last story).

**2. `tools/parity-matrix.test.mjs`** — `parityFindings({ inventory, matrix, catalog, sectionsById, landedEpics, root })`
as a plain function (`catalog` an array of `{id, paths, pathTasks, tasks}`, `sectionsById` a `Map`, `root` the folder
`tools/` and `settings/hooks/` are resolved against), rules 1–10 one check at a time with small helpers (`sideShape`,
`epicNumber`, `pathKind`, `isMandatory(section)`, `checkedRules(root, tool)` — a dynamic `import()` of
`pathToFileURL(path.join(root,"tools",tool+".mjs"))` whose missing file or missing `CHECKED_RULES` export is a finding,
never a throw). Real data: `loadCatalog(sourceRoot)`, `research/rule-bodies.json`, `LANDED_EPICS`, `root = sourceRoot`.
Fixtures: one factory for the minimal case, `structuredClone` per case, an `ownedDir(t, "parity matrix")` holding the
fake tool and hook files for 3.15. Test names state the guarantee.

**3. `tools/consumers.test.mjs`** — parse the `## Consumers` table of `README.md` (rows from the heading to the next
heading; the repository is the backticked text of the first cell; skip the header and separator), compare with
`research/consumers.json`, and 3.20 on inline fixtures.

**4. `research/module_rules.md`** — after the allowances: `## The parity matrix (todo/PLAN_node_rule_parity.md § 3,
D12)`: what the two files hold; the side shapes; that `tools/parity-matrix.test.mjs` fails on an orphan, a present
location that does not exist, a `stronger-*` row outside `['P4']`, an `equal` row whose sides' five fields differ or do
not match the rule's front matter, heading and tools, and a `planned` row past its epic (`tools/lib/parity-epics.mjs`);
and: *the deliberately-absent requirements and their reasons are the `deliberately-absent` entries of
`research/parity-inventory.json` — the one home; this document keeps no copy.* Then `### The consumers` — one sentence:
`research/consumers.json` is derived from `README.md` § *Consumers*, which stays the one list, and
`tools/consumers.test.mjs` keeps them equal.

---

## E1.S4 — The moved-block manifest: the evidence of every move, immutable, checked without history

- **Size.** L — a tool and a library (≈ 350 lines), a self-test of ≈ 350 lines, 17 recorded entries.
- **Models.** Brief: Opus (below). Code, tests, the recording: a Sonnet coder. Review: Opus.
- **Goal.** Parent § 4.3 (`:320-343`), § 4.1 (`:262-271`), § 7 (`:599`), § 10 (`:652-653`), § 11 (`:687-689`, `:726`),
  E1 (`:903-911`), ledger 1.2, R-2, R-3: `research/moved-blocks.json` holds one entry per moved block — `source`, `lines`,
  `beforeCommit`, `sha256`, `length`, `destination` — recorded once by `tools/moved-blocks.mjs --record` from
  `git show <commit>:<source>`; the test reads no history and passes at CI's `fetch-depth: 1` (CI is not changed). The
  manifest is immutable: an original hash or length is never edited, and a later move or edit appends a provenance entry
  that supersedes, never replaces. E1 records every exactly-ranged block of § 4.3 as `planned` and checks it
  structurally (schema, the source and range recorded from a real commit, the owning epic, the source bytes still in the
  source); the owning epic lands it, and the test then compares the destination's bytes.

### The entry, and what the test checks

`{ "note", "entries": [ … ] }`, each entry
`{ "id", "status": "planned|landed", "epic": "E2".."E6", "source", "lines": "<from>-<to>", "endsWith"?, "beforeCommit",
"sha256", "length", "destination", "supersedes"? }`.

- The block is lines `from`–`to` of the source at `beforeCommit`, CRLF folded (`folded` from `tools/lib/rule-body.mjs`),
  each line ending in `"\n"` — except when `endsWith` is given: then the block ends right after the first occurrence of
  `endsWith` in line `to` (no newline), as the parent's 115 B Rust sentence requires (`:348`).
- **Schema** (every entry): `id` `^[a-z0-9][a-z0-9-]*$`, unique; `status`, `epic` from their sets; `source` and
  `destination` relative paths under `common/`, `csharp/`, `rust/` or `typescript/`, ending `.md`; `lines` `^\d+-\d+$`,
  1 ≤ from ≤ to; `endsWith` a non-empty string when present; `beforeCommit` `^[0-9a-f]{40}$`; `sha256`
  `^[0-9a-f]{64}$`; `length` a positive integer; `supersedes`, when present, an EARLIER entry's id.
- **`planned`**: the epic is not in `LANDED_EPICS`; the source file exists and holds exactly one run of `length` bytes
  hashing to `sha256` that starts at a line start — anywhere in the file, so a section added above it (E4's § 0) does not
  break the check, while an edited byte does. The destination is not read.
- **`landed`**: the destination exists and holds exactly one such run at a line start; the source holds none (a move,
  not a copy). `status` moves one way, `planned` → `landed`, in the owning epic's move commit; no other field of an entry
  changes, ever.
- **Superseded** (a later entry names it): evidence only, no live check.
- **No git call in the test.** The range was checked by `--record` against the commit; what a clone can check is the
  bytes.

### The entries E1 records (17, all `planned`, all from one commit after S0)

| id | source · lines | `endsWith` | destination | epic | length (F8) |
|---|---|---|---|---|---|
| `testing-runner` | `common/testing.md` · 12-31 | — | `csharp/testing.md` | E6 | 1,113 |
| `testing-runner-rust` | `common/testing.md` · 32-33 | `.NET-specific.` | `rust/testing.md` | E6 | 115 |
| `testing-architecture` | `common/testing.md` · 354-358 | — | `csharp/testing.md` | E6 | 252 |
| `reliability-timeout` | `common/reliability.md` · 104-133 | — | `csharp/lifecycle.md` | E5 | 1,698 |
| `logging-colour` | `common/logging-serilog.md` · 61-90 | — | `csharp/logging.md` | E6 | 1,640 |
| `logging-shape` | `common/logging-serilog.md` · 153-171 | — | `csharp/logging.md` | E6 | 497 |
| `logging-rust` | `common/logging-serilog.md` · 172-187 | — | `rust/logging.md` | E6 | 875 |
| `utc-rust` | `common/utc-timestamps.md` · 65-69 | — | `rust/utc-timestamps.md` | E6 | 219 |
| `ts-script` | `typescript/doctrine.md` · 15-48 | — | `typescript/boundaries.md` | E4 | 2,021 (after S0) |
| `ts-script-box` | `typescript/doctrine.md` · 100-101 | — | `typescript/boundaries.md` | E4 | (as recorded) |
| `ts-backtick` | `typescript/doctrine.md` · 49-65 | — | `typescript/testing.md` | E4 | 755 (O10) |
| `ts-cast` | `typescript/doctrine.md` · 66-79 | — | `typescript/testing.md` | E4 | 932 |
| `ts-tsc` | `typescript/doctrine.md` · 80-97 | — | `typescript/testing.md` | E4 | 1,151 |
| `ts-boxes-testing` | `typescript/doctrine.md` · 102-105 | — | `typescript/testing.md` | E4 | (as recorded; O10) |
| `nuget-before` | `csharp/nuget-packages.md` · 12-23 | — | `common/dependencies.md` | E2 | 824 |
| `nuget-licence` | `csharp/nuget-packages.md` · 25-37 | — | `common/dependencies.md` | E2 | 760 |
| `nuget-prefer` | `csharp/nuget-packages.md` · 50-54 | — | `common/dependencies.md` | E2 | 286 (O9) |

Each destination comes from the parent's § 4.3 table (`:347-356`) with the epoch 2 names; each epic from the parent's
§ *Epics* scopes. Not recorded, pending O5: the reliability sentences, the `utc-timestamps.md` .NET text, the NuGet
`:39-47` block.

### Scenarios

Fixtures are built in `ownedDir(t, "moved blocks")`; the `--record` cases build a git repository there with
`gitWith({timeoutMs: GUARD_MS})` and a fixed identity. The sample source has six lines; line 3 carries `é`, line 4 is
indented by two spaces, line 5 ends `… X. tail stays.`.

| # | Given | When | Then |
|---|---|---|---|
| 4.1 | a repository with the sample committed | `--record src.md 2-4 <commit> --destination d.md --epic E4 --id m1` (the fixture's rule-folder check relaxed by a root argument) | the manifest gains one entry: `status: "planned"`, the full 40-hex `beforeCommit` (an abbreviation resolved), `length` and `sha256` of lines 2–4 (`é` counted as 2 bytes) |
| 4.2 | the same, `--record src.md 5-5 … --ends-with "X."` | | `length` stops after `X.`; no newline in the block |
| 4.3 | an entry `m1` already present | `--record … --id m1` / `--supersedes nosuch` / lines `4-2` / lines past the end at that commit / a commit that does not exist | each refused (exit 1, one line naming why), and the manifest file is byte-identical afterwards |
| 4.4 | three entries, then a fourth recorded with `--supersedes m1` | the file before and after | the first three entries are byte-identical; the fourth names `m1` — append-only |
| 4.5 | `planned` `m1`, source unchanged | `verify` | no findings |
| 4.6 | `planned` `m1`, two lines inserted above the block in the source | | no findings — position-independent |
| 4.7 | `planned` `m1`, one byte of the block changed in the source | | a finding: the source no longer holds the recorded block |
| 4.8 | `planned` `m1` whose epic is in the given landed list | | a finding: the epic has landed and the entry is still planned |
| 4.9 | `landed` `m1`, the block cut from the source and appended to the destination | | no findings |
| 4.10 | `landed`, the destination holding it twice / mid-line / with one byte changed / absent | | one finding each |
| 4.11 | `landed`, the destination rewritten with CRLF line ends | | no findings |
| 4.12 | `landed`, the block also still in the source | | a finding: a copy, not a move |
| 4.13 | `landed` `m2` with `endsWith`, the destination holding the block followed by a newline | | no findings |
| 4.14 | `m1` superseded by `m3`; `m1`'s bytes gone from everywhere, `m3` valid | | no findings — superseded entries are evidence only |
| 4.15 | schema faults: a bad `id`, a duplicate, `epic: "E9"`, `status: "moved"`, a 7-hex `beforeCommit`, `length: 0`, a destination outside the rule folders, `supersedes` naming a LATER entry | | one finding each |
| 4.16 | a copy of the fixture folder with no `.git` at all | `verify` | the same results as 4.5–4.14 — the check reads no history (F7) |
| 4.17 | the real `research/moved-blocks.json`, the real tree, `LANDED_EPICS` | `verify` | no findings; 17 entries, all `planned` |
| 4.18 | the real entry `ts-script` | its `sha256` against the block 15–48 of `git show <S0's parent>:typescript/doctrine.md` — run once by the coder, not by the test | different hashes: the recorded evidence is the anonymised text, and a move from the un-anonymised text would be red. Both hashes go into the commit body |
| 4.19 | `node tools/moved-blocks.mjs` on the real tree | exit and output | 0, `moved-blocks: OK — 17 entries, 17 planned, 0 landed` |

### Files

`tools/moved-blocks.mjs`, `tools/lib/moved-blocks.mjs`, `tools/moved-blocks.test.mjs`, `research/moved-blocks.json`
(all new); `research/module_rules.md`, `research/module_tests.md`, `README.md` § *tools*. **`.github/workflows/ci.yml`
does not change.**

### Acceptance criteria

4.1–4.19 pass; the 17 entries equal the table (lengths as F8, the two "as recorded" ones whatever `--record` prints); the
recording commit is after S0's; no test calls git except the `--record` fixtures; no temporary folder outside
`ownedDir`.

### RED → GREEN → RED

1. **RED.** Write the test first: import fails (`Cannot find module …/lib/moved-blocks.mjs`). Record.
2. **GREEN.** The library and the tool; the fixture cases pass; then record the 17 entries (below); 4.17 and 4.19 pass.
3. **RED again.** (a) Drop the line-start condition → the mid-line case of 4.10 fails; (b) make the planned check use the
   recorded line numbers instead of a scan → 4.6 fails; (c) skip the copy check → 4.12 fails; (d) drop the CRLF fold →
   4.11 fails; (e) let `--record` rewrite the file from a re-serialised array that reorders keys → 4.4 fails. Edit one
   byte of `common/reliability.md:110` in the working tree → 4.17 names `reliability-timeout`; restore.

### Docs to update

`research/module_rules.md` — `## Moves` (below); `research/module_tests.md` — the test, and **what it does not prove**:
that an entry was never edited (the test sees one version of the file — the diff and the review are the control); that
the moved text still reads correctly in its new place; anything about the O5 blocks, which are not recorded; and that a
`beforeCommit` recorded in E1 is the recording commit, not the eventual move's parent — the planned check (the source
still holds the bytes) is what makes the two the same bytes (O11). `README.md` § *tools* — one row.

### The brief (for the Sonnet coder)

**1. `tools/lib/moved-blocks.mjs`** — imports only `node:fs`, `node:path`, `node:crypto` and `folded` from
`./rule-body.mjs`. Exports `blockOf(text, from, to, endsWith?)` (throws past the last line, or when `endsWith` is not in
line `to`); `runsAt(text, { length, sha256 })` → the number of line starts (byte 0 and every byte after `0x0a` of the
folded text's `Buffer`) where `length` bytes hash to `sha256`; `schemaFindings(manifest, { ruleFolders = true })`;
`verifyEntry(root, entry, { superseded, landedEpics })` → findings, reading files with `fs` only;
`verifyManifest(root, manifest, landedEpics)` → findings for every entry. Every message starts `` `${entry.id}: ` ``.

**2. `tools/moved-blocks.mjs`** — `node tools/moved-blocks.mjs` verifies (`LANDED_EPICS` from `./lib/parity-epics.mjs`;
exit 0 with the OK line of 4.19, or 1 with the findings);
`node tools/moved-blocks.mjs --record <source> <from>-<to> <commit> --destination <path> --epic <En> --id <id>
[--ends-with <text>] [--supersedes <id>]` resolves `<commit>` with `git rev-parse --verify <commit>^{commit}`, reads
`git show <full>:<source>` (both through `gitOutput` of `./lib/git.mjs` with its timeout), computes the block, refuses
(exit 1, nothing written) an existing id, an unknown `--supersedes`, a bad range, an unknown commit, and appends the new
entry as `planned` — **by inserting the new entry's text before the closing `]` of the file's text, never by re-serialising
the parsed array**, so every earlier byte stays (4.4); the result must still parse, and is written to a temporary file and
renamed. Export `main(argv, root)` so the fixtures run it in an owned folder. Unknown arguments: usage, exit 2.

**3. `tools/moved-blocks.test.mjs`** — the scenarios; test names state the guarantee (`a recorded entry is append-only`,
`a planned block is found wherever its source moved it, and a changed byte is red`, `a landed block is in its destination
once, byte for byte, and gone from its source`, `the check reads no history`, …).

**4. Record the 17 entries**, after S0 is committed, from one commit: `C=$(git rev-parse HEAD)`, then one `--record` per
row of the table, e.g. `node tools/moved-blocks.mjs --record common/testing.md 12-31 $C --destination csharp/testing.md
--epic E6 --id testing-runner` and `node tools/moved-blocks.mjs --record common/testing.md 32-33 $C --ends-with
".NET-specific." --destination rust/testing.md --epic E6 --id testing-runner-rust`. Start the file as
`{\n  "note": "<note>",\n  "entries": [\n  ]\n}\n` with the note: *Historical evidence of every block the plan
todo/PLAN_node_rule_parity.md moves out of a rule (D1: word for word). Recorded once by tools/moved-blocks.mjs --record
from git show at the named commit; never edited — a later move or edit appends an entry that supersedes, and status moves
once, planned to landed. The test reads no git history: a planned entry's bytes must still be in its source, a landed
entry's in its destination.* Check every printed length against the table; a difference is reported, not recorded over.
Then 4.18 by hand.

**5. `research/module_rules.md`** — `## Moves` before `References:`: the manifest's role and immutability, the planned
and landed checks, the two commands, the parent's order rule (a wording change is its own commit in the source first —
S0 did that for `typescript/doctrine.md` § 1, so `ts-script` hashes the anonymised text), why it differs from
`research/rule-bodies.json` (a historical slice against the current whole body; both kept, both read through
`tools/lib/rule-body.mjs`), and that CI's depth-1 checkout is enough. No table of entries: the JSON is the record.

**6. `README.md` § *tools*** — one row: `tools/moved-blocks.mjs` | the evidence that a moved block is word for word (D1)
— an immutable manifest, checked without history | `node tools/moved-blocks.mjs` to verify, `--record …` to append (this
repository only).

---

## Warnings for every coder of this epic

- **No rule file changes in E1 except S0's four lines.** `node tools/rule-bodies.mjs` prints OK with 39 rules after every
  story.
- **Temporary folders only through `ownedDir`** (`tools/lib/owned.mjs`); the guard run by `npm test`
  (`tools/leftovers-check.mjs`) refuses `mkdtemp`, `os.tmpdir()` and a bare `git worktree add` in a test.
- **Keep `normalized.filter(file=>match(file))` byte for byte** (F4).
- **No product or repository name** in a rule; the data files cite the plan as plain text. `research/consumers.json`
  names repositories because it is the derived index of `README.md` § *Consumers*.
- **Stage by path**, read `git diff --staged --stat`, one commit per story, the observed numbers in the body, the trailer
  the session names.
- **Report both observations** of every RED step, and the runner's totals with the six known janitor failures named.

## Open points — for the coordinator to judge (each would be entry 2.1 if decided as a plan change)

The stories above do not decide these; where a story needs an answer, it follows the parent's text as it stands and
names the point.

- **O1 — G2 has no admissible final status.** § 3.3 (`todo/PLAN_node_rule_parity.md:200`) raises TypeScript and only
  "records" .NET for the lock file — a `stronger-ts` row — while the whitelist is `['P4']` alone (`:150`, `:680-683`). At
  E1 G2 is `planned` (E2), so nothing is red, but E2 cannot activate it as `equal`, `stronger-ts` or
  `deliberately-absent` without a decision (Q1).
- **O2 — where a deliberately-absent reason lives.** § 4.1 (`:242-243`) requires a non-empty `reason` on a matrix row for
  `deliberately-absent`; § 3.3 (`:202`) and § 11 (`:676-678`) make `research/parity-inventory.json` the one home. S3
  follows § 3.3/§ 11 and the coordinator (a matrix `reason` only for `stronger-*`); `:242-243` still says otherwise.
- **O3 — T11 cannot hold for four planned gated files.** T11 (`:621`, § 11 `:696-697`) says every gated rule's gate equals
  its source rule's `tasks:` line. `typescript/boundaries.md` is gated `implement, test, audit, ui, http` (`:354`); its
  source `typescript/doctrine.md` has no `tasks`, and no rule has that task line; `csharp/boundaries.md` (R1, `:189`)
  likewise; `csharp/definition-of-done.md` and `typescript/definition-of-done.md` are gated on "the tasks at whose
  completion a checklist is read" (`:429-433`), no source rule's line. S1's `GATE_SOURCES` will refuse all four when E4
  and E6 land them unless the rule or the test's contract is decided.
- **O4 — the path-kind comparison makes the doctrine rows unequal.** `csharp/doctrine.md` selects on `**/*.csproj` (a
  project file); `typescript/doctrine.md` selects on source files only, after E4 too (`:444`). Under § 2's (a) "the same
  kind of scope" (`:139-141`), P1, P5, P7 and P20 cannot be `equal` unless the TypeScript doctrine also selects on
  `tsconfig*.json` (≈ +4,700 B on every `tsconfig.json` scope) or the comparison treats a project file differently. S3
  ships the kind table of rule 9; which kinds count as "the same kind of scope" needs a decision before E4 activates
  those rows.
- **O5 — four § 4.3 rows are not exact ranges, so E1 cannot record them.** `reliability.md` "the sentences of `:47-70` and
  `:95-103` naming …" (≈ 1,100 B) and "`:38-46`'s .NET launcher sentence" (`:349`); `utc-timestamps.md:25-48`'s ".NET
  sentences and the C# block (≈ 900 B); its Never/DoD lines" (`:352`); `nuget-packages.md:39-47` "minus the two `dotnet` /
  `Invoke-RestMethod` lines" (`:356`) — those two lines sit inside a fence opened at `:45` and closed at `:48`, so either
  file would hold an unbalanced fence. The parent's E1 says "the first entries are the blocks of § 4.3" (`:909-910`) and
  E2's done-when counts "the four moved blocks" (`:928`). Who fixes the exact ranges — E1 now, or the owning epic (E5 is
  a cornerstone area) — and how is the fence split?
- **O6 — "the mood against the section's heading".** `:248-249` reads MANDATORY from the recorded section's heading. Some
  rules mark it on the H1 only — `common/reliability.md`'s H1 carries it and its `### A timeout is not a cancellation`
  section (P13's C# side) does not. S3 implements the heading-only reading; whether the H1 counts is open.
- **O7 — the single-read list.** § 10 (`:646`) says "the list of D5 and the new config scopes"; S5 reads that as the eight
  pins D5 keeps plus `tsconfig.json` and `.npmrc` under each single-read task (16). Six scopes that fit today —
  `inspect`/`ui`/`gpu`/`storage` with `Directory.Build.props`, `inspect --file src/a.mjs`, `inspect --file
  src/webview/page.ts` — stay unpinned with that reason; pinning them adds guarantees, which the coordinator may want.
- **O8 — S0 leaves two names the rule-ownership rule would not.** The parent's wording list (`:422-424`) does not cover
  `typescript/doctrine.md:37` ("a **synced** vault") or `:39` (`scriptInterpolation.test.ts`, a path). S0 changes only
  what the parent names; both stay in the text E4 moves byte for byte.
- **O9 — `nuget-packages.md:50-54` is 286 B, not 287** (`:356`); with the blank line `:55` it is 287 B. S4 records the
  range the parent names (`50-54`, 286 B).
- **O10 — does doctrine § 2 move, and its box?** § 4.3 (`:355`), § 5 (`:540`, `:569`) and § 16 point 6 (`:850`) move § 2
  (755 B) to `typescript/testing.md`, and E4's ≤ 4,700 B allowance needs it; but § 4.4 (`:416-417`, `:434-435`) keeps § 2
  and its box in the doctrine, R3 (`:191`) keeps the § 2 box, and E4's scope and S2 move only "§ 1, § 3, § 4" with "the
  three move entries" (`:958`, `:969`, `:981`). S4 records `ts-backtick` and the boxes `102-105` for E4, as the
  coordinator directed; those sentences still contradict it.
- **O11 — "the commit RIGHT BEFORE the move" against "recorded now".** § 4.3 (`:323-324`) records a block at the commit
  right before the move; § 4.1 (`:265-266`) records the planned entries in E1 "from the commit the move will be made
  from", which does not exist yet. S4 records at E1's commit and lets the planned check (the bytes are still in the
  source) make the two equal; confirm that is the intent, or say which commit a planned entry names.
- **O12 — E1's scope line is short of its stories.** `:890-891` lists neither the consumers file, the two new tools nor
  `tools/lib/parity-epics.mjs`; E6's scope (`:1005`) lists `typescript/boundaries.md` as new although E4.S2 creates it
  (`:438`, `:969`). A repaired reference each, if the coordinator agrees.
