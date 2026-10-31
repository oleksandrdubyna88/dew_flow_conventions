# PLAN — C#/Node rule parity, E1: delivery and the parity contract (no new prose)

> Status: **plan only, nothing implemented yet, 2026-10-31 — rewritten to the slimmed E1 of the parent's epoch 4 (main
> `b396902`).** Scope: the wording-only anonymisation (S0) and the whitespace-only splits (S0b); the `path_tasks` key
> with provenance gates (S1); the selection baseline — `tools/selection-matrix.mjs`, `research/selection-matrix.json`,
> the 22 pins, the caps, the negative-case definition (S2); the allowances and the empty gate schema (S5); a minimal
> parity matrix and inventory with the completeness test and the real-row proof on fixtures (S3); the reusable move
> verifier with its baseline (S4); the two lock fixtures and their required CI job (S4b).
>
> Stories of epic E1 of [PLAN_node_rule_parity.md](PLAN_node_rule_parity.md) (§ *Epics*, E1). Written by Opus on
> 2026-10-31 and reconciled with each epoch since (`3392fb2`, `72aaf8c`, `3b7d7db`); the re-review for epoch 4 kept that
> version as the input and slimmed E1 (ledger 3.4, § 19, § 20). This document keeps no change ledger: a change to E1's
> approved work is an entry in the parent's `## Plan changes` — epoch 4, at 0 changes. E1 holds no cornerstone area: no
> story is marked `model: fable`; the parent's ledger line stays `Cornerstones: 0 of 3`. What the parent leaves
> unbuildable or unclear is in § *Open points*, classified; nothing there is decided by a story beyond what the plan as
> written already requires.

Done when (the parent's E1, `todo/PLAN_node_rule_parity.md:1395-1405`): `npm test` green with the new tests; the matrix
test observed red when an ACTIVATED row names a missing id or section and when a `planned` row names no owning epic,
then fixed; the P2/P3 real-row fixture passes the union comparison and its negative fails; every tight scope's headroom
is in `research/module_rules.md`; E1's fixtures green — selection (a positive and the defined negatives per gated rule),
the real-row equality and its negative, heading inheritance, the verifier's four cases, and the two lock fixtures, the
NuGet one exercised in the REQUIRED `tools · lock fixtures` job on this pull request and never skipped there — before
E2's stories document is written; `research/moved-blocks.json` holds exactly the 25 baseline `planned` entries, no
destination; `research/selection-matrix.json` carries no gate declaration; one pull request through both gates.

```bash
npm ci --ignore-scripts
npm test
npm run check
node tools/ownership-check.mjs
node tools/rule-bodies.mjs
node tools/plan-lifecycle.mjs .
```

## Gates, models, branch

- **Branch** `feat/rule-parity-e1` (main merged at `97ee28f`); one commit per story, `npm test` green after each (the six
  janitor cases that fail on this machine on a clean `main` aside — parent § 16 — named, never folded into a verdict);
  one pull request.
- **S0 and S0b are their own commits**, each only its rule files and `research/rule-bodies.json`, listed as *wording, no
  lesson removed* and *whitespace only* (parent § 4.3 `:474-481`, § 4.4, § 11 `:994-996`).
- **Gates.** `open` with `callerModel`; `review_plan` with this document as the scope of epic 1 of 7; `resolve` every
  finding, rejecting in round one what is wrong; `review_code` over the epic's diff (`baseRef` = the merge base with
  `main`, `b396902` today) and an Opus review, both at once. A reply's `commands` are followed and named.
- **Models.** Briefs: Opus (this document). Code, data, tests, documents: a Sonnet coder per story. Review: Opus. Fixes:
  Sonnet. S0 and S0b may be done by the main session only under a bound declared before the first edit.

## Facts (read 2026-10-31; the rule files are unchanged from `f46982f` to `97ee28f`)

- **F1** `selectRules` (`tools/lib/rule-catalog.mjs:141-166`): always, `tasks`, `paths`; dependencies first, ignoring
  their own conditions; an unknown metadata key throws (`:85`); `patternMatcher` (`:69`) is private.
- **F2** The explain manifest's rule fields (`tools/lib/rule-cli.mjs:103`); `bytes` is the whole file, front matter
  included.
- **F3** The body freeze hashes after the front matter (`tools/lib/rule-body.mjs:24`): a selector edit passes it
  (`drifted`, `tools/rule-bodies.mjs:72`) — D12.
- **F4** `tools/rules.test.mjs:322` mutates the literal `normalized.filter(file=>match(file))`; keep it byte for byte.
- **F5** Fences: `FENCE_OPEN`/`FENCE_CLOSE` in `tools/lib/rule-body.mjs:30-31`; sections are whole heading lines
  (`sectionsOf`, `:89`).
- **F6** CI: squash merges, `actions/checkout` at depth 1 (`.github/workflows/ci.yml:23-25`); jobs `tools · selftest`
  (Node 22, `npm test`) and `workflows · actionlint`; `.github/branch-protection.json` lists the required contexts per
  branch (main: five; release: `tools · selftest`, `workflows · actionlint`), applied by an admin with
  `node .github/scripts/branch-protection.mjs --apply`.
- **F7** S0 and S0b measured on a copy: `typescript.doctrine` 5,909 → 5,883 B, its line count unchanged;
  `common/testing.md` +0 B, +1 line after `:33`; `csharp/nuget-packages.md` +1 B, +2 lines after `:41`; both splits
  whitespace-identical.
- **F8** The 25 move ranges after S0 and S0b — whole lines, outside any fence at both ends, `Buffer.byteLength` of the
  folded text — and their owning epics (§ 4.3 `:492-…`, E1 `:1387-1389`):

| Source | Lines → bytes | Owning epic |
|---|---|---|
| `common/testing.md` | 12-31 → 1,113 · 32-33 → 116 · 355-359 → 252 | E6 |
| `common/reliability.md` | 49-54 → 433 · 55-59 → 436 · 66-69 → 375 · 97-98 → 160 · 99-102 → 322 · 104-133 → 1,698 | E5 |
| `common/logging-serilog.md` | 61-90 → 1,640 · 153-171 → 497 · 172-187 → 875 | E6 |
| `common/utc-timestamps.md` | 41-47 → 311 · 65-69 → 219 | E6 |
| `typescript/doctrine.md` | 15-48 → 2,016 · 49-65 → 755 · 66-79 → 932 · 80-97 → 1,151 · 100-101 → 166 · 102-105 → 278 | E4 |
| `csharp/nuget-packages.md` | 12-23 → 824 · 25-29 → 334 · 39 → 11 · 43-45 → 187 · 52-56 → 286 | E2 |

- **F9** The matrix after S0 and S0b (summed `bytes`; 108 scopes, 1,509 ids):

| Files | `inspect` | `ui` | `gpu` | `storage` | `implement` | `test` | `audit` | `logging` | `dependencies` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| (no file) | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,356 |
| `src/x.cs` | 28,820 | 31,033 | 32,293 | 34,019 | 291,538 | 284,106 | 222,853 | 78,866 | 164,969 |
| `src/x.csproj` | 31,902 | 34,115 | 35,375 | 37,101 | 294,620 | 287,188 | 225,935 | 81,948 | 164,969 |
| `Directory.Build.props` | 27,289 | 29,502 | 30,762 | 32,488 | 290,007 | 282,575 | 221,322 | 77,335 | 160,356 |
| `ui/a.ts` | 30,090 | 32,303 | 33,563 | 35,289 | 292,808 | 285,376 | 224,123 | 80,136 | 166,239 |
| `src/a.mjs` | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,356 |
| `src/x.cs` + `ui/a.ts` | 34,703 | 36,916 | 38,176 | 39,902 | 297,421 | 289,989 | 228,736 | 84,749 | 170,852 |
| `package.json` | 35,409 | 37,622 | 38,882 | 40,608 | 298,127 | 279,493 | 229,442 | 85,455 | 171,558 |
| `tsconfig.json` | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,356 |
| `.npmrc` | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,356 |
| `src/webview/page.ts` | 30,090 | 32,303 | 33,563 | 35,289 | 292,808 | 285,376 | 224,123 | 80,136 | 166,239 |
| `src/main.rs` | 40,743 | 42,956 | 44,216 | 45,942 | 291,304 | 296,029 | 222,619 | 78,632 | 176,892 |

- **F10** Both lock refusals are offline, probed here 2026-10-31: npm 11 `npm ci --ignore-scripts --offline` against a
  lock at `picomatch@4.0.7` for a `package.json` asking `4.0.6` → exit 1, `EUSAGE`, `lock file's picomatch@4.0.7 does
  not satisfy picomatch@4.0.6`; SDK 10.0.114, two projects with `RestorePackagesWithLockFile`, restored, then a
  `ProjectReference` added → `dotnet restore --locked-mode -m:4` exit 1 `NU1004`; `--force-evaluate` then locked mode →
  exit 0. No package source is contacted.

## Order

**S0 → S0b → S1 → S2 → S5 → S3 → S4 → S4b.** S0 and S0b before anything measures or hashes; S1 the resolver change; S2
the baseline it is pinned by (and `tools/lib/parity-epics.mjs`); S5 the allowances and the empty gate schema; S3 and S4
then reuse the epic vocabulary; S4b last because its CI job runs the suite's lock test. Each story's tests come first and
fail for the reason its RED step names.

## Growth

The parent's § 7 holds the data files. E1 adds: `tools/selection-matrix.mjs`, `tools/moved-blocks.mjs`,
`tools/lib/moved-blocks.mjs`, `tools/lib/gates.mjs`, `tools/lib/parity-epics.mjs`, two lock fixtures under
`tools/fixtures/locks/` (< 4 KB), their tests (≈ 1,300 lines), one CI job, and ≈ 4 KB in `research/module_rules.md`
(a PROJECT `requires` source; its measured table is replaced at each re-measurement, never appended). Every temporary
folder is an owned folder (`ownedDir`); the lock fixtures are copied into one before `npm`/`dotnet` write anything.

## Not in E1 (moved to the owning epics — ledger 3.4)

- The destination record of every move (E2 the NuGet ranges, E4 the doctrine's, E5 reliability's, E6 the rest) — E1
  records the baseline only.
- Every gate declaration and its selection cases — each written by the epic that lands its file; E1 ships the schema and
  the check, empty of entries.
- `research/consumers.json` and its test — E7.S0.
- Every row activation — E1's matrix holds `planned` and `deliberately-absent` rows only; the real-row proof runs on
  fixtures (E3 runs the first real-catalog proof).

---

## E1.S0 — The wording-only anonymisation of `typescript/doctrine.md` § 1

- **Size** S. **Goal** parent § 4.4 and E1 (`:1358-1362`): the three file names, "a real vault", "a **synced** vault" and
  `scriptInterpolation.test.ts` become "one module", "a second", "a third", "a real credential store", "a **synced**
  credential store" and "the scan test", every sentence, number and date kept, before S4 hashes § 1.

| # | Given / When | Then |
|---|---|---|
| 0.1 | the edit of the brief | `git diff --stat`: `typescript/doctrine.md` (6 lines) and `research/rule-bodies.json` only |
| 0.2 | before `--update` | `node tools/rule-bodies.mjs` exit 1, `DRIFT typescript.doctrine` |
| 0.3 | `--update typescript.doctrine` | `OK — 39 rule(s)`, the sections unchanged |
| 0.4 | `grep -nE 'webauthnPrf|entityFormScript|depPickerScript|scriptInterpolation|vault' typescript/doctrine.md` | no line |
| 0.5 | the file | the same line count; § 1 still `15-48`, 2,016 B; the file 5,883 B |
| 0.6 | `npm test`, `node tools/ownership-check.mjs` | green; OK |

**RED → GREEN → RED.** 0.2 before the record; 0.3 after; revert line 39 alone → DRIFT again; restore.

**The brief.** Replace lines 33–36 of `typescript/doctrine.md`:

```
**Three instances, three different people, one of them shipped.** `webauthnPrf.ts` escaped by
hand; `entityFormScript.ts` did not; `depPickerScript.ts` reintroduced it in new code written
*beside* the fix for the previous one — and that build was cut, installed and running against a
real vault for an hour before it was found. The values were folder and entry names arriving from
```

by

```
**Three instances, three different people, one of them shipped.** One module escaped by hand; a
second did not; a third reintroduced it in new code written *beside* the fix for the previous one
— and that build was cut, installed and running against a real credential store for an hour
before it was found. The values were folder and entry names arriving from
```

and on line 37 `a **synced** vault,` by `a **synced** credential store,`, on line 39 `` `scriptInterpolation.test.ts`
scans `` by `The scan test scans`. Nothing else. `node tools/rule-bodies.mjs --update typescript.doctrine`; verify; stage
the two files by path; commit `docs(rules): typescript/doctrine.md § 1 — wording only, no lesson removed` with the six
replacements and the observed lines in the body. **Docs:** none besides the record.

---

## E1.S0b — The whitespace-only splits, D1-checked

- **Size** S. **Goal** parent § 4.3 (`:474-481`), E1 (`:1362-1365`): a line break before "Everything below applies
  everywhere." in `common/testing.md:33`, a blank line after "… strictly .NET 10." in `csharp/nuget-packages.md:41`, so
  every planned move is whole lines; each file with all whitespace removed byte-identical before and after.

| # | Given / When | Then |
|---|---|---|
| 0b.1 | the testing split | `:33` is `.NET-specific.`, `:34` `Everything below applies everywhere.`; same byte length |
| 0b.2 | the NuGet split | `:41` ends `.NET 10.`, `:42` empty, `:43` begins `Bump the whole set`; +1 B |
| 0b.3 | the D1 check (brief) | two `whitespace-only` lines, exit 0 |
| 0b.4 | a scratch copy with one word also deleted | the check exits 1 naming the file |
| 0b.5 | `--update common.testing csharp.nuget-packages` | `OK — 39 rule(s)`, sections unchanged; `npm test`, `npm run check` green |

**RED → GREEN → RED.** `DRIFT` for both before the record; OK after; 0b.4 on a scratch copy.

**The brief.** (1) In `common/testing.md` replace `.NET-specific. Everything below applies everywhere.` by
`.NET-specific.` + `"\n"` + `Everything below applies everywhere.`. (2) In `csharp/nuget-packages.md` replace
`strictly .NET 10. Bump the whole set` by `strictly .NET 10.` + `"\n\n"` + `Bump the whole set`; re-wrap nothing. (3) The
D1 check, before committing:

```bash
node --input-type=module -e 'import {execFileSync} from "node:child_process";import fs from "node:fs";let bad=0;for(const f of process.argv.slice(1)){const w=s=>s.replace(/\s+/g,"");const ok=w(execFileSync("git",["show","HEAD:"+f],{encoding:"utf8"}))===w(fs.readFileSync(f,"utf8"));console.log(`${f}: ${ok?"whitespace-only":"WORDS CHANGED"}`);if(!ok)bad=1;}process.exitCode=bad' common/testing.md csharp/nuget-packages.md
```

(4) `--update common.testing csharp.nuget-packages`; `npm test`; `npm run check`; commit the three files by path,
`docs(rules): whitespace-only splits so every planned move is whole lines`, the check's output in the body. **Docs:**
none; S4's `## Moves` names this commit as the source of the post-split numbering.

---

## E1.S1 — `path_tasks`, and gates by provenance

- **Size** M. **Goal** D3, parent § 4.2 (`:394-419`) and § 4.3 (`:483-490`), T11: the key `path_tasks` gates a rule's
  `paths` to scopes that name one of its tasks; plain `tasks` and dependencies ignore it; a gate without `paths` is a
  metadata error; explain names the gate. A gate MIRRORS the `tasks:` line of the rule its requirement's text came from
  (a path-only source mirrors as "no gate"), or is DECLARED with a reason; `tools/lib/gates.mjs` checks both against a
  gate record. S1 proves it on fixtures; no real rule is gated and no record is written in E1.

**The gate record** (S5 puts the empty map in `research/selection-matrix.json` → `gates`; each owning epic adds its
entries): `"<rule id>": { "mirrors": "<source id>" | "declared": { "path_tasks": [...], "reason": "<≥ 20 chars>" },
"epic": "E2".."E6", "cases": [ { "tasks": [t], "files": [f…], "selected": true|false } ] }` — exactly one of `mirrors`
and `declared`.

`provenanceFindings(catalog, gates, landedEpics)`:

1. a rule with `pathTasks` and no record → `<id> carries path_tasks but has no gate record — mirror its source or declare it`;
2. a record for an absent rule → allowed only while its `epic` has not landed;
3. `mirrors`: the source exists; if it has `tasks`, the rule's `pathTasks` equals them as a set; if it has none, the rule
   has no `pathTasks` (mirrors as no gate) — otherwise `<id>: <source> has no tasks: line; declare the applicability
   change instead`;
4. `declared`: `path_tasks` equals the rule's `pathTasks` as a set; `reason` ≥ 20 characters; `declared` on an ungated
   rule is a finding;
5. both or neither of `mirrors`/`declared` → a finding.

(The `cases` are S2's — `caseFindings`.)

| # | Given (fixtures of `fixture(t)`; `G` = `csharp/mech.md`, `paths: ["**/*.cs"]`, `path_tasks: ["implement","test"]`) | When | Then |
|---|---|---|---|
| 1.1 | `G` | `selectRules(c, ["implement"], ["src/x.cs"])` | selected, reasons `["path:src/x.cs (**/*.cs) when task:implement"]` |
| 1.2 | `G` | `["inspect"]`, `["src/x.cs"]` | NOT selected |
| 1.3 | `G` | `["implement"]`, no file / `["ui/a.ts"]` | not selected |
| 1.4 | `G` | `["test","implement"]`, `["src/x.cs"]` | one reason `… when task:implement,test` |
| 1.5 | `G` + an ungated `csharp/plain.md` with the same paths | `["inspect"]`, `["src/x.cs"]` | `csharp.plain` selected, `csharp.mech` not |
| 1.6 | a gated rule with `tasks: ["audit"]`; a dependent `common/dep.md` (`tasks: ["gpu"]`) | `["audit"]` / `["gpu"]`, no file | `task:audit` / `dependency:common.dep` |
| 1.7–1.12 | `path_tasks` without `paths` / `paths: []` / `path_tasks: []` / `["imlpement"]` / a string / on `load: always` | `loadCatalog` | throws `/path_tasks needs paths/` ×2, `/must name at least one task/`, `/imlpement.*legal: inspect/`, `/must be an array of nonempty strings/`, `/applies to a conditional rule only/` |
| 1.13 | `cliFixture` + `csharp/zz-gated.md` | `explain --task implement --file src/x.cs` / `--task inspect` | `path_tasks: ["implement"]` with the gated reason / absent; `csharp.doctrine` has `path_tasks: []` |
| 1.14 | `G`, `common/src.md` (`tasks: ["implement","test"]`), record `mirrors: "common.src"` | `provenanceFindings` | `[]` |
| 1.15 | no record / `common/src.md` tasks `["implement","audit"]` / `mirrors` a path-only `typescript/doc.md` | | one finding each (rules 1, 3, 3) |
| 1.16 | `declared` with a valid reason / reason `"x"` / `path_tasks: ["implement"]` / both keys / `declared` on `csharp.plain` | | `[]` / one finding each |
| 1.17 | a record for `csharp.later` (absent), `epic: "E6"`, landed `[]` / `["E6"]` | | `[]` / one finding |
| 1.18 | the real catalog, `gates: {}` | | `[]` |

**Files** `tools/lib/rule-catalog.mjs`, `tools/lib/rule-cli.mjs`, `tools/lib/gates.mjs` (new), `tools/rules.test.mjs`,
`ENTRY.md`, `research/module_rules.md`, `research/module_tests.md`. **Acceptance** every case; the 24 existing tests
unchanged (`:322` included); explain shows `"path_tasks": []` for every real rule with the same ids and bytes.
**RED → GREEN → RED** the cases first (they fail on `unknown metadata key path_tasks` or the missing module); then, one
at a time: drop the gate filter → 1.2; drop "needs paths" → 1.7; drop the CLI field → 1.13; drop the set comparison →
1.15's second case.

**The brief.** (1) `rule-catalog.mjs`: `KEYS` gains `"path_tasks"`; in `ruleFrom` after `depends`:

```js
const gated = Object.hasOwn(metadata, "path_tasks");
const pathTasks = stringList(metadata, "path_tasks", file);
pathTasks.forEach(task => { if (!Object.hasOwn(TASKS,task)) throw new Error(`${file}: unknown path_tasks task ${task}; legal: ${Object.keys(TASKS).join(", ")}`); });
if (gated && metadata.load === "always") throw new Error(`${file}: path_tasks applies to a conditional rule only`);
if (gated && !pathTasks.length) throw new Error(`${file}: path_tasks must name at least one task`);
if (gated && !paths.length) throw new Error(`${file}: path_tasks needs paths — it gates path selection and selects nothing alone`);
```

the rule object gains `pathTasks`; export `matchesPaths(rule, file)` (the existing `patternMatcher` over `rule.paths`,
for S2's case check); the path loop of `selectRules` becomes (F4 literal kept):

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

(2) `rule-cli.mjs:103` emits `path_tasks:pathTasks`. (3) `tools/lib/gates.mjs` exports `provenanceFindings` (rules 1–5).
(4) The cases in `tools/rules.test.mjs`, named for their guarantee. (5) `ENTRY.md` step 7: *Selection is paths
(optionally gated by `path_tasks`) OR tasks, plus always rules and transitive dependencies, deduplicated by id. A rule
with `path_tasks` is selected by its paths only in a scope that also names one of those tasks.* (rest unchanged, wrap
near 90 columns). (6) `research/module_rules.md`: the metadata paragraph (`:19-23`) names `path_tasks` and its four
errors; a section `## Task-gated path selection — path_tasks` with the semantics, the two legitimate uses (mirrored by
provenance; declared with a reason for a new requirement or an applicability the plan changed on purpose — cite
`todo/PLAN_node_rule_parity.md` § 4.3 as plain text) and the record. (7) `research/module_tests.md`: the tests.

---

## E1.S2 — The selection baseline: pinned id lists, the 22 pins, the caps, the negative-case definition

- **Size** M. **Goal** parent § 4.1 (`:264-285`), § 4.4 (`:607-610`), § 5 (`:787-833`), D12, E1 (`:1366-1368`): the ids
  of the 108 representative scopes in `research/selection-matrix.json`, generated by `tools/selection-matrix.mjs` and
  compared by a test (a hand edit or an unregenerated selector change is red); the 22 single-read pins; the caps; and the
  case check that holds every gated rule to the defined positive and negatives.

**The scopes.** 12 file sets (none · `src/x.cs` · `src/x.csproj` · `Directory.Build.props` · `ui/a.ts` · `src/a.mjs` ·
`src/x.cs` + `ui/a.ts` · `package.json` · `tsconfig.json` · `.npmrc` · `src/webview/page.ts` · `src/main.rs`) × 9 tasks
(`inspect`, `ui`, `gpu`, `storage`, `implement`, `test`, `audit`, `logging`, `dependencies`); name `<task> <files joined
by " + ">` or `<task> (no file)`. Today's single-read lists: base `common.coding-style`, `common.knowledge-base`,
`common.security`, `common.task-lifecycle` (+ `common.durable-status` for `ui`, `common.gpu-lease` for `gpu`,
`common.utc-timestamps` for `storage`); `src/x.cs` + `csharp.doctrine`; `src/x.csproj` + `csharp.doctrine`,
`csharp.nuget-packages`; `Directory.Build.props` + `csharp.nuget-packages`; `ui/a.ts`, `src/webview/page.ts` +
`typescript.doctrine`; mixed + both doctrines; `package.json` + `common.local-cpu-budget`; `src/main.rs` +
`common.logging-serilog`, `rust.doctrine`; `src/a.mjs`, `tsconfig.json`, `.npmrc` nothing more.

**The 22 pins** (§ 5 `:809-814`; today's bytes from F9):

| Task | `oneRead: true` |
|---|---|
| `inspect` | none 24,207 · `src/x.cs` 28,820 · `src/x.csproj` 31,902 · `ui/a.ts` 30,090 · `tsconfig.json` 24,207 · `.npmrc` 24,207 · `Directory.Build.props` 27,289 · `src/a.mjs` 24,207 · `src/webview/page.ts` 30,090 |
| `ui` | none 26,420 · `tsconfig.json` 26,420 · `.npmrc` 26,420 · `Directory.Build.props` 29,502 |
| `gpu` | none 27,680 · `src/x.cs` 32,293 · `tsconfig.json` 27,680 · `.npmrc` 27,680 · `Directory.Build.props` 30,762 |
| `storage` | none 29,406 · `tsconfig.json` 29,406 · `.npmrc` 29,406 · `Directory.Build.props` 32,488 |

Every other single-read-task scope is `oneRead: false` with a `why`: the six `ui` scopes with a language file
(`src/x.cs`, `src/x.csproj`, `ui/a.ts`, `src/a.mjs`, mixed, `src/webview/page.ts`) `D5: ui with a language file is off
the single-read list (plan section 5)`, adding `; over one read today: <bytes> B` for `src/x.csproj` (34,115) and mixed
(36,916); the 18 over-today scopes (`inspect` mixed, `package.json`, `src/main.rs`; `ui` `package.json`, `src/main.rs`;
`gpu` `src/x.csproj`, `ui/a.ts`, mixed, `package.json`, `src/webview/page.ts`, `src/main.rs`; `storage` `src/x.cs`,
`src/x.csproj`, `ui/a.ts`, mixed, `package.json`, `src/webview/page.ts`, `src/main.rs`) `over one read today: <bytes> B`
with F9's number; `gpu src/a.mjs` `fits today (27,680 B); a split read after E3 (about 33,839 B), 32,380 B or less after
E4; unpinned by the plan (section 5)`; `storage src/a.mjs` `fits today (29,406 B); about 35,565 B after E3 and about
33,300 B after E6 — over one read, unpinned (plan section 5)`.

**The caps** (`CAPS`; a rule cap applies whenever the rule exists, a "from" cap once that epic is in `LANDED_EPICS`):
the always core ≤ 15,355 B; `gpu --file src/x.cs` ≤ 32,613 B; `csharp.doctrine` ≤ 4,633 B; `typescript.npm-packages` ≤
3,300 B (§ 5 `:798`, `:814`, E2 `:1418` — O5); `typescript.compiler-strictness` ≤ 3,300 B; `common.dependencies` ≤
4,000 B; `typescript.utc-timestamps` ≤ 1,200 B; `csharp.boundaries` ≤ 1,400 B; `typescript.doctrine` ≤ 4,700 B from E4.

**The negative-case definition** (§ 4.4 `:607-610`), `caseFindings(catalog, gates)` in `tools/lib/gates.mjs`: every
record has ≥ 1 `selected: true` case; for a gated rule, ≥ 1 negative whose file matches the rule's paths
(`matchesPaths`) with every task outside the gate, and ≥ 1 negative with a task inside the gate and no file matching;
for an ungated rule (a mirror of a path-only source), ≥ 1 negative with no matching file; every task known and every
file root-relative; and, when the rule exists, each case holds under `selectRules`. Messages name the rule, the case and
what is missing or wrong.

| # | Given | When | Then |
|---|---|---|---|
| 2.1 | the real catalog and the committed file | `render(catalog)` against the file | byte-equal |
| 2.2 | the file | read | 108 scopes once each, ids sorted and unique, exactly the 22 pins `true`, every other single-read-task scope a `why` ≥ 10 chars, no `ui` + language-file scope `true` |
| 2.3 | a copy with `tasks: ["dependencies"]` removed from `csharp/nuget-packages.md` | `idDrift` / `drifted` | names `dependencies (no file)` and `csharp.nuget-packages` / `[]` — D12's point |
| 2.4 | `node tools/selection-matrix.mjs` on a clean copy / after a hand edit | | exit 0 `in step` / exit 1 with the finding |
| 2.5 | the pins | each selected | ≤ 32,768 B |
| 2.6 | the real catalog | `capFindings(catalog, CAPS, LANDED_EPICS)` | `[]` |
| 2.7 | fixtures: core 15,356 B / `typescript.npm-packages` 3,301 B / `typescript.doctrine` 4,701 B with landed `[]` and `["E4"]` | `capFindings` | finding / finding / `[]` and finding |
| 2.8 | the S1 fixture `G` with cases + `implement src/x.cs`, − `inspect src/x.cs`, − `implement ui/a.ts` | `caseFindings` | `[]` — **the selection fixture: a positive and the defined negatives** |
| 2.9 | the same without the out-of-gate negative / without the no-path negative / with `+gpu src/x.cs` | | one finding each |
| 2.10 | a mirror-as-no-gate record on an ungated fixture rule with + `inspect ui/a.ts`, − `inspect src/x.cs` | | `[]`; without the negative, a finding |

**Files** `tools/selection-matrix.mjs`, `tools/selection-matrix.test.mjs`, `research/selection-matrix.json`,
`tools/lib/parity-epics.mjs` (new); `tools/lib/gates.mjs` (`caseFindings`); `tools/rules.test.mjs` (`:250-257` reads the
pins; `CAPS`); `research/module_rules.md`, `research/module_tests.md`, `README.md` § *tools*. **Acceptance** 2.1–2.10;
the bytes table in `module_rules.md` equals F9 with its commit (after S0b). **RED → GREEN → RED** the tests before the
tool (`Cannot find module`); then: delete an id → 2.1/2.4; flip `inspect package.json` to `true` → 2.5 (35,409 B); flip
`ui ui/a.ts` → 2.2 while 2.5 passes (D5, not the budget); lower the core cap to 15,054 → 2.6.

**The brief.** (1) `tools/selection-matrix.mjs` exports `FILE_SETS`, `TASKS_PINNED`, `SCOPES`, `ONE_READ` (the 48
single-read names → `{ oneRead: true }` or `{ oneRead: false, why }` from the texts above), `GATES =
Object.freeze({})`, `render(catalog)`, `idDrift(catalog, parsed)`, `bytesTable(catalog)`; CLI: verify (exit 0/1),
`--write` (temporary file + rename), `--bytes` (the F9 table), else usage exit 2. `render` writes `note`; `scopes` — one
entry per scope on two lines, `{"name", "tasks", "files", "oneRead", "why"?,` then `"ids": [...]}`; and `gates`. The
note: *The exact ids each representative scope selects, the single-read pins and the gate records
(todo/PLAN_node_rule_parity.md sections 4.1, 4.3, 5; D12). Generated by tools/selection-matrix.mjs --write; the test
fails on a hand edit or a selection the file does not record. Owning epics add gate records to GATES in the tool.*
(2) `tools/lib/parity-epics.mjs`: `export const LANDED_EPICS = Object.freeze([]);` with *the last story of each epic of
todo/PLAN_node_rule_parity.md adds its id here in its own pull request; a planned item of a listed epic is red*.
(3) `caseFindings` in `tools/lib/gates.mjs` as defined. (4) Tests: `tools/selection-matrix.test.mjs` (2.1–2.4, 2.2's
pins), `tools/rules.test.mjs` (2.5 keeps the test name `every single-read scope of the four excluded tasks still fits
one read`, 2.6–2.10). Copies in `ownedDir(t, "selection matrix")`; the tool run with `spawnSync(process.execPath,
[tool], {cwd, timeout: GUARD_MS})`. (5) `research/module_rules.md` § *The selection baseline*: the file, the tool, the
bytes table from `--bytes` with its commit, the pins, the caps, the negative-case definition, and *each later epic
re-runs `--bytes` and replaces this table*. (6) `README.md` § *tools*: one row for `tools/selection-matrix.mjs`.

---

## E1.S5 — The allowances, and the empty gate schema

- **Size** S. **Goal** parent § 5 (`:825-833`), E1 (`:1395-1397`): every later epic's byte allowance written into
  `research/module_rules.md` with the scope it protects; the gate-declaration and selection-case schema documented
  beside S2's empty `gates`, with the five gates the plan already approves named as what their owning epics will
  declare.

| # | Given | Then |
|---|---|---|
| 5.1 | `research/module_rules.md` | a table: E2 `common/dependencies.md` ≤ 4,000 B, `typescript/npm-packages.md` ≤ 3,300 B (the `.npmrc` pins after E3); E3 `typescript/compiler-strictness.md` ≤ 3,300 B, the P2/P3 statement ≤ 250 B, `csharp/doctrine.md` ≤ 4,633 B; E4 `typescript/doctrine.md` ≤ 4,700 B; E4/E6 `csharp/boundaries.md` ≤ 1,400 B; E6 `typescript/utc-timestamps.md` ≤ 1,200 B; the core ≤ 300 B over the plan; E5/E6 gated rules measured, no single-read cap — each with its protected scope and § 5's "after E3" interim numbers |
| 5.2 | `research/selection-matrix.json` | `gates` is `{}` (asserted by a test: E1 declares nothing) |
| 5.3 | the schema section | the record shape of S1, the case definition of S2, and the approved declarations each epic will write (§ 4.4): the two `definition-of-done` files and the two `boundaries` files (E4, E4/E6), `typescript/testing.md` (E4, ledger 3.1); the new mechanics files declared by their epics (`typescript/lifecycle.md` E5, `typescript/logging.md`, `typescript/utc-timestamps.md` E6); every other gated file mirrors |

**Files** `research/module_rules.md`, `tools/selection-matrix.test.mjs` (5.2). **The brief.** Write the two sections
from 5.1 and 5.3, citing the plan as plain text; add the test `the selection matrix carries no gate declaration at E1`
(it becomes `every gate record belongs to a landed or unlanded owning epic` once the first epic writes one — say so in
its comment).

---

## E1.S3 — The minimal parity matrix and inventory, and the real-row proof

- **Size** M. **Goal** parent § 2, § 4.1 (`:286-373`), E1 (`:1369-1377`), ledger 3.2: the schema with per-side
  `delivery` and `enforcement` sets; the completeness test (one-to-one with the inventory; the whitelist `['P4']`;
  `planned` rows structural, with an owning epic among E2–E6); the fields-versus-reality test (front matter, MANDATORY
  inherited from the nearest marked ancestor heading, the check tool's exported rule list, `settings/hooks/`); and the
  equality machinery — the UNION of a side's delivery locations' selection behaviour over the correspondence table, the
  configuration kind apart — PROVEN on fixtures carrying P2/P3's actual planned selectors: they pass, and the negative
  without the TypeScript source-file statement fails. P4 is asserted as the whitelisted exception. In the real files
  every row is `planned` or `deliberately-absent`.

**The schema.** `research/parity-inventory.json` `{ "note", "entries": [ { "id", "topic", "side", "status", "epic"?,
"reason"?, "scopedAbsences"? } ] }` — `status` `counterpart|deliberately-absent|planned`; `epic` iff planned; `reason`
(≥ 20 chars) iff deliberately absent, the one home of those reasons; `scopedAbsences` `[ { "scope", "reason" } ]` (P5,
§ 4.1 `:347-351`). `research/parity-matrix.json` `{ "note", "rows": [ { "inventory", "topic", "status", "epic"?,
"reason"?, "strength", "suppression", "csharp": <side>, "typescript": <side> } ] }` — `status`
`planned|equal|stronger-ts|stronger-cs|deliberately-absent`; `reason` iff `stronger-*`. A `<side>` is `{ "absent": true }`,
or `{ "planned": "E2".."E6", "delivery"?: [ { "id", "section"? } ] }` (intended locations where the plan names them,
unchecked), or an active side `{ "delivery": [ { "id", "section" } ], "enforcement": [ { "class": "prose" } | { "class":
"test", "test" } | { "class": "check", "tool" } | { "class": "hook", "hook" } ], "selectors": [ { "id", "paths",
"path_tasks", "tasks" } ], "mood": "MUST|SHOULD", "consequence": "none|test-fails|check-fails|build-fails|hook-refuses",
"suppression": "none|inline-with-reason" }`.

**The rules** (`parityFindings`): (1) inventory ids `^[PRG][1-9][0-9]*$` unique, fields as the schema; (2) one-to-one,
equal topics; (3) every delivery location of an active side: `id` in the catalog, `section` among its recorded sections;
(4) a planned side: epic E2–E6, intended ids well-formed; (5) row status: `planned` ⇔ some side planned, none absent,
`epic` the latest; `deliberately-absent` ⇔ some side absent, none planned, no `reason`; `equal`/`stronger-*` ⇔ both
active; (6) `STRONGER_EXCEPTIONS = ["P4"]`: another `stronger-*` row is a finding with or without a reason; P4 needs a
reason; `equal` carries none; (7) inventory ↔ row status and epic agree; (8) a `planned` row of a landed epic is a
finding; (9) **equality**, every `equal` row: the correspondence pairs are none ↔ none, `src/x.cs` ↔ `ui/a.ts`,
`src/a.mjs`, `src/webview/page.ts`, and `src/x.csproj` ↔ `package.json`; for each of the nine tasks and each pair, the
C# side's delivery UNION (any of its locations' rules selected) holds exactly when the TypeScript side's union holds on
each corresponding file set; the configuration kind is not compared (§ 4.1 `:326-331`); then `mood`,
`enforcement[].class` (as sets), `consequence`, `suppression` equal; (10) **against reality**, every active side: each
`selectors` item equals its rule's catalog `paths`/`pathTasks`/`tasks` as sets; `mood` is `MUST` exactly when a heading
carrying `(MANDATORY)` is found walking from the section's own heading to each preceding heading of a lower level up to
the H1; `check` → `tools/<tool>.mjs` exports `CHECKED_RULES` containing the row's delivery ids of that side; `hook` →
`settings/hooks/<hook>.mjs` exists; `test` → the file exists.

**The real data** — 31 entries and rows, P1…P21, R1…R5, G1…G5; every row `planned` except P8, R4, R5, G4, G5
(`deliberately-absent`, O6):

| Inv. | side | C# side | TypeScript side | status · epic |
|---|---|---|---|---|
| P1 | csharp | planned E4 | planned E4 | planned · E4 |
| P2, P3 | csharp, both | planned E3, delivery `csharp.doctrine` `## 1. Language & runtime` | planned E3, delivery `typescript.doctrine`, `typescript.compiler-strictness` | planned · E3 |
| P4, G1 | csharp, both | planned E3, delivery `csharp.doctrine` (`## 6. Pure functions, small methods` for P4, `## 1. Language & runtime` for G1) | planned E3, delivery `typescript.compiler-strictness` | planned · E3 |
| P5, P7, P20 | csharp | planned E4, delivery `csharp.doctrine` | planned E4, delivery `typescript.doctrine` | planned · E4 |
| P6 | csharp | planned E4, delivery `csharp.boundaries` | planned E4, delivery `typescript.boundaries` | planned · E4 |
| P8 | csharp | the existing text (the note below) | absent | deliberately-absent |
| P9, G2 | csharp, both | planned E2, delivery `csharp.nuget-packages` | planned E2, delivery `typescript.npm-packages` | planned · E2 |
| G3 | both | planned E2, delivery `common.dependencies` | planned E2, delivery `common.dependencies` | planned · E2 |
| P10, P11 | csharp | planned E6, delivery `csharp.testing` | planned E6, delivery `typescript.testing` | planned · E6 |
| P12 | csharp | planned E6, delivery `csharp.logging` | planned E6, delivery `typescript.logging` | planned · E6 |
| P13, P15 | csharp | planned E5, delivery `csharp.lifecycle` (P15: `common.security`) | planned E5, delivery `typescript.lifecycle` | planned · E5 |
| P14 | csharp | planned E6, delivery `common.security` | planned E6, delivery `common.security` | planned · E6 |
| P16 | csharp | planned E6, delivery `csharp.utc-timestamps` | planned E6, delivery `typescript.utc-timestamps` | planned · E6 |
| P17, P18, P19 | csharp | planned E6, delivery `common.platform-limits` / `common.http-contracts` / `common.post-deploy-checks` | planned E6, the same | planned · E6 |
| P21 | both | planned E3, delivery `csharp.doctrine` | planned E3 | planned · E3 |
| R1 | typescript | planned E6, delivery `csharp.boundaries` | planned E4, delivery `typescript.boundaries` | planned · E6 |
| R2 | typescript | planned E6, delivery `csharp.testing` | planned E4, delivery `typescript.testing` | planned · E6 |
| R3 | typescript | planned E4, delivery `csharp.definition-of-done` | planned E4, delivery `typescript.definition-of-done` | planned · E4 |
| R4, R5 | typescript | absent | the existing text (the note below) | deliberately-absent |
| G4, G5 | both | absent | absent | deliberately-absent |

**P8, R4, R5 — the present side of a deliberately-absent row.** A `deliberately-absent` row's non-absent side is the
existing text: P8 C# `{ "delivery": [ { "id": "csharp.dotnet-build", "section": "# `dotnet build` — bound the worker
pool, because several sessions build at once" } ] }`; R4 TS `{ "delivery": [ { "id": "typescript.doctrine", "section":
"## 4. `tsc` emits despite errors — so a green suite can be green against stale output" } ] }`; R5 TS likewise with `## 2.
A backtick inside a template literal ends it — including inside a comment`. Rule 3 checks these locations; rules 9–10 do
not apply (they are not `equal`), so no other field is needed. When E4 moves § 2 and § 4, E4 re-points R4/R5.

Reasons (inventory only): P8 `no Node counterpart: the rule exists for a measured MSBuild worker-pool problem Node
builds do not have; a hook is added for a measurement, not for symmetry, and Node's enforced rule is P2's check (plan
section 3.1 P8, section 4.6)`; R4 `no C# counterpart needed: the C# compiler emits nothing on an error (plan section 3.2
R4)`; R5 `no comparable C# trap: a raw string literal cannot be ended by a shorter run of quotes (plan section 3.2 R5)`;
G4 `deliberately absent on both sides: a coverage number is gamed the week it lands (plan section 3.3; Q10)`; G5
`deliberately absent as shared rules: each repository's own CI names the exact commands (plan section 3.3)`; P5's
`scopedAbsences` `[{ "scope": "javascript-without-project", "reason": "nothing checks a type there: the typed parts are
absent and the doctrine's JavaScript paragraph states the enforceable subset (plan section 3.1 P5, section 18 finding
5)" }]`. Topics, `strength` and `suppression`: one short phrase each from the plan's § 3 rows (`suppression` for P2, P4,
G1, P21 `plan section 3.4: inline only, with the rule or warning id and a same-line reason; no baseline`; otherwise
`none: a prose rule has nothing to suppress`).

**The fixtures.**

| # | Given | When | Then |
|---|---|---|---|
| 3.1 | the real files, catalog, sections, `LANDED_EPICS` | `parityFindings` | `[]` |
| 3.2 | **the real-row proof**: an owned folder holding the real `csharp/doctrine.md`, a `typescript/doctrine.md` whose front matter is E3's planned one (`paths` `**/*.ts`, `**/*.tsx`, `**/*.mts`, `**/*.cts`, `**/*.js`, `**/*.mjs`, `**/*.cjs`, `**/package.json`), a `typescript/compiler-strictness.md` (`paths` `**/tsconfig*.json`), the core, and P2 and P3 as `equal` rows with these delivery sets, enforcement `check: strictness-check` on both sides (a fixture tool exporting `CHECKED_RULES`), mood, consequence `check-fails`, suppression `inline-with-reason` | `parityFindings` | `[]` — the union holds on source and manifest scopes, the configuration kind apart |
| 3.3 | 3.2 with the TypeScript delivery reduced to `typescript.compiler-strictness` | | findings naming P2 and P3, a task and the pair `src/x.cs` ↔ `ui/a.ts` — a `.ts` scope would deliver nothing |
| 3.4 | 3.2 with P4 `stronger-ts` and its reason / P2 `stronger-ts` with a reason | | `[]` / a whitelist finding |
| 3.5 | an `equal` row naming `csharp.missing` / a missing section | | one finding each — the ACTIVATED-row red |
| 3.6 | a `planned` row with no epic / `E9` / a side `E1` | | one finding each — the no-owning-epic red |
| 3.7 | an entry with no row / a row with no entry / two rows / mismatched status or epic / a `deliberately-absent` row with a reason | | one finding each |
| 3.8 | **heading inheritance**: `mood: "MUST"` on `common.reliability` `### A timeout is not a cancellation — and .NET spells them the same`; `mood: "SHOULD"` on `common.testing` `## Every feature ships with tests, in the same task` (real sections); each flipped | rule 10 | the two pass; each flip a finding |
| 3.9 | a `selectors` item differing from the front matter / a `check` tool without the id / a `hook` naming no file | | one finding each |
| 3.10 | a row planned for E3 with landed `["E3"]` | | a finding |

**Files** `research/parity-inventory.json`, `research/parity-matrix.json`, `tools/parity-matrix.test.mjs` (new);
`research/module_rules.md`, `research/module_tests.md`. **Acceptance** 3.1–3.10; 31 entries and rows. **RED → GREEN →
RED** the test first (3.1 fails on the missing files, by the test's own message); then on the real files: give P10 an
active `equal` shape with a C# delivery `common.testng` → named; drop P13's `epic` → named; restore. On 3.2: replace the
union by an intersection → 3.2 fails; restore.

**The brief.** Write the files from the tables (`JSON.stringify(…, null, 2)`, trailing newline; sections copied from
`research/rule-bodies.json`). `tools/parity-matrix.test.mjs`: `parityFindings({ inventory, matrix, catalog,
sectionsById, landedEpics, root })` with small helpers (`sideShape`, `epicNumber`, `union(catalog, ids, tasks, files)`,
`isMandatory(sections, section)`, `checkedRules(root, tool)` — a dynamic `import()` whose missing file or export is a
finding); `STRONGER_EXCEPTIONS` and the correspondence pairs as constants citing the plan. 3.2's catalog is built in
`ownedDir(t, "parity proof")` with `fs.cpSync` of the real `csharp/doctrine.md` and `common/` core and the two written
TypeScript files; `loadCatalog` of that folder. `research/module_rules.md` § *The parity matrix*: the files, the side
shapes, the rules in one sentence each, the union over the correspondence table with the configuration kind apart, and
*the deliberately-absent reasons are the inventory's; this document keeps no copy*.

---

## E1.S4 — The reusable move verifier, and the baseline

- **Size** L. **Goal** parent § 4.1 (`:356-373`), § 4.3 (`:423-481`), § 10 (`:920-928`), E1 (`:1377-1390`), ledger 1.2,
  2.4, 3.4, § 20 finding 1: `tools/moved-blocks.mjs` (the recorder) and `tools/lib/moved-blocks.mjs` (the checker) over
  `research/moved-blocks.json`, one JSON array, append-only; whole-line ranges only, fences unsplit; the baseline of the
  25 ranges as `planned` entries with no destination; the activation pairing for an unchanged block and the superseding
  procedure for a changed one, both proven on fixtures; the checker reads no history (CI stays at depth 1).

**The entries.** *Baseline*: `{ "id", "status": "planned", "epic", "source", "lines": "<from>-<to>", "beforeCommit",
"sha256", "length" }`. *Activation* (an owning epic, unchanged bytes): `{ "id", "activates": "<baseline id>",
"destination", "destinationLines", "beforeCommit" }`. *Superseding* (an owning epic, changed bytes): `{ "id",
"supersedes": "<baseline id>", "justifiedBy": "<40-hex>", "justifiedFiles": [ … ], "epic", "source", "lines",
"beforeCommit", "sha256", "length", "destination", "destinationLines" }`, and the old entry gains `"supersededBy": "<new
id>"` — the only field ever added to an existing entry.

**The recorder** (`node tools/moved-blocks.mjs`):

- `--baseline <source> <from>-<to> <commit> <epic> <id>` — reads `git show <commit>:<source>` (the commit resolved to 40
  hex), appends a baseline.
- `--record <source> <from>-<to> <commit> <destination> <epic> <id> [--supersedes <baseline id> --justified-by
  <commit>]` (the parent's form, `:426`) — run by the owning epic after placing the block in the destination's working
  tree and before committing: if the bytes equal an unpaired baseline of that source, it appends an ACTIVATION, finding
  `destinationLines` by scanning the working-tree destination (refused if the block is not there exactly once); if they
  differ, it requires `--supersedes` and `--justified-by`, verifies with git that the commit exists and touches only the
  block's source file (recording `justifiedFiles`), appends the superseding entry and adds `supersededBy` to the old one.
- Refuses, writing nothing: a range not `^[1-9]\d*-[1-9]\d*$` with from ≤ to (a column form such as `32:1-33:14`
  included) — `a move is whole lines; split the line by whitespace first (E1.S0b)`; a range whose preceding line or last
  line ends inside a fence (F5) — `the range would split a fenced block; move the whole fence or split by whitespace first
  (E1.S0b)`; lines past the end; an unknown commit; an existing id; a superseding without both flags; a `justifiedBy`
  commit touching any other file.
- Writes by inserting the new entry's text before the closing `]` of the file — with the separating comma — never by
  re-serialising, so earlier bytes stay; the `supersededBy` insertion is the one in-place edit. Temporary file + rename.

**The checker** (`verifyManifest(root, entries, landedEpics)`; `node tools/moved-blocks.mjs` with no argument; no git):
schema per shape; ids unique; references (`activates`, `supersedes`, `supersededBy`) resolve to earlier/later entries as
their direction requires; a baseline is paired by at most one activation OR superseded, never both; an unpaired,
unsuperseded baseline: its epic not landed (else `unpaired baseline whose epic has landed`) and its source holding
exactly one line-start run of `length` bytes hashing to `sha256` — anywhere, so a section added above it does not break
the check while a changed byte does; an activation: the destination's `destinationLines` hash to the baseline and the
source holds the run no more; a superseding entry: its destination holds its own bytes at `destinationLines`, the source
holds them no more, `justifiedBy` is 40 hex and `justifiedFiles` is exactly `[source]`; a superseded baseline is evidence
only.

**The baseline E1 records** — F8's 25 ranges, from ONE commit after S0b, `--baseline` each, ids in F8's order:
`testing-runner`, `testing-runner-rust`, `testing-architecture`, `reliability-scope`, `reliability-fire-and-forget`,
`reliability-sweep-at-start`, `reliability-token`, `reliability-signals`, `reliability-timeout`, `logging-colour`,
`logging-shape`, `logging-rust`, `utc-csharp-fence`, `utc-rust`, `ts-script`, `ts-backtick`, `ts-cast`, `ts-tsc`,
`ts-script-box`, `ts-boxes-testing`, `nuget-before`, `nuget-licence`, `nuget-bumping-heading`, `nuget-bumping-cadence`,
`nuget-prefer`; epics as F8.

| # | Given (an owned git repository; `src.md`: six lines, `é` on 3, two-space indent on 4, then a fence `` ```js `` · one line · `` ``` `` on 8–10; destination `common/d.md`) | When | Then |
|---|---|---|---|
| 4.1 | the sample committed | `--baseline src.md 2-4 <c> E4 b1` | one baseline; 40-hex commit; `length`/`sha256` with `é` as 2 bytes — **the exact range** |
| 4.2 | the same | `--baseline src.md 7-9 …` / `9-11 …`; `8-10` | refused with the fence message / recorded — **the fence-balanced refusal** |
| 4.3 | the same | `--baseline src.md 2:1-4:5 …` | refused naming E1.S0b — **the mid-line refusal** |
| 4.4 | `b1`; lines 2–4 placed in `common/d.md`, removed from `src.md` (working tree) | `--record src.md 2-4 <c> common/d.md E4 a1` | an activation `a1` with `destinationLines`; verify after committing: no findings |
| 4.5 | `b1`; line 3 changed in a commit `j` that touches only `src.md`; the new lines placed in `common/d.md` | `--record src.md 2-4 <j> common/d.md E4 s1 --supersedes b1 --justified-by <j>` | `s1` appended, `b1` gains `supersededBy: "s1"` and nothing else (byte-compare the rest) — **the superseding entry with its `justifiedBy`** |
| 4.6 | 4.5 with a `j` that also touches another file / without `--justified-by` / a destination holding `b1`'s OLD bytes | | refused / refused / a checker finding (a move may never change the block's words) |
| 4.7 | `b1` unpaired, source unchanged / two lines inserted above / one byte changed / its epic landed | verify | none / none / finding / finding |
| 4.8 | an activation whose destination holds the block twice, mid-line, changed, absent; the block also left in the source | | one finding each |
| 4.9 | two activations of one baseline / an activation and a supersession of one baseline / a dangling `activates` | | one finding each |
| 4.10 | three entries, then a fourth appended | the file | the first three byte-identical; the array parses |
| 4.11 | a copy of the fixture folder with no `.git` | verify | the same results — no history read |
| 4.12 | the real manifest, tree, `LANDED_EPICS` | verify | no findings; exactly 25 baselines, no destination |
| 4.13 | `node tools/moved-blocks.mjs` | | exit 0, `moved-blocks: OK — 25 baseline(s), 0 activated, 0 superseded` |

**Files** `tools/moved-blocks.mjs`, `tools/lib/moved-blocks.mjs`, `tools/moved-blocks.test.mjs`,
`research/moved-blocks.json` (new); `tools/lib/rule-body.mjs` (export `fenceDepth(text)` — per line, true when the line
ends inside an open fence, by the existing `FENCE_OPEN`/`FENCE_CLOSE`; `outsideFencedBlocks` untouched unless it can use
it with no output change); `research/module_rules.md`, `research/module_tests.md`, `README.md` § *tools*.
**Acceptance** 4.1–4.13; the 25 lengths equal F8 (a difference reported, not recorded over); the recording commit after
S0b; `node tools/rule-bodies.mjs` OK. **RED → GREEN → RED** the test first (`Cannot find module`); then: drop the fence
check → 4.2; accept column ranges → 4.3; use line numbers in the planned check → 4.7's second case; drop the
`justifiedFiles` check → 4.6's first; re-serialise on append → 4.10; edit a byte of `common/reliability.md:110` → 4.12
names `reliability-timeout`.

**The brief.** Build the library and the tool as specified, git calls through `gitOutput` of `tools/lib/git.mjs` with its
timeout, `LANDED_EPICS` from `tools/lib/parity-epics.mjs`; start the file as `[\n]\n`; record the 25 with
`C=$(git rev-parse HEAD)` and one `--baseline` per row; tests in `ownedDir(t, "moved blocks")` with `gitWith({timeoutMs:
GUARD_MS})` and a fixed identity. `research/module_rules.md` § *Moves*: the three shapes, immutability and the one
added field, whole lines and unsplit fences with S0b as the remedy and the source of the post-split numbering (S0 for
§ 1's anonymised hash), the checks, the commands, why it differs from `research/rule-bodies.json`, and that a depth-1
checkout is enough. `README.md` § *tools*: one row for `tools/moved-blocks.mjs`. `research/module_tests.md`: the test
and what it does not prove (that no entry was edited — the diff and review are the control).

---

## E1.S4b — The two lock fixtures, and the required CI job that runs them

- **Size** M. **Goal** parent § 10 (`:936-951`), § 11 (`:987-990`), § 19 (the epoch 4 round), E1 (`:1390-1395`): an npm
  fixture whose lock does not satisfy `package.json` fails `npm ci` with `EUSAGE`; a NuGet fixture whose
  `packages.lock.json` is stale fails a locked restore with `NU1004` and passes after `--force-evaluate`; green at E1's
  exit; the NuGet one runs in a REQUIRED CI job with `actions/setup-dotnet` pinned by sha, is a named `t.skip` only
  LOCALLY where no SDK exists, and FAILS under `CI` when `dotnet` is missing.

**The fixtures** (F10). `tools/fixtures/locks/npm-unsatisfied/`: `package.json` `{"name":"probe","version":"1.0.0",
"private":true,"devDependencies":{"picomatch":"4.0.6"}}` and a `package-lock.json` (v3) whose root and
`node_modules/picomatch` entries say `4.0.7`. `tools/fixtures/locks/nuget-stale/`: `global.json`
`{"sdk":{"version":"10.0.100","rollForward":"latestPatch"}}`, `Directory.Build.rsp` with `-nr:false`, `lib/lib.csproj`
and `app/app.csproj` (`Microsoft.NET.Sdk`, `net10.0`, `RestorePackagesWithLockFile` true, no package references).

**The test** `tools/lock-fixtures.test.mjs`: each fixture copied into `ownedDir(t, "lock fixture")`; children through
`spawnSync` with `timeout: GUARD_MS` and a cleared environment plus `PATH`, `HOME` (an owned folder),
`npm_config_cache`/`NUGET_PACKAGES` (owned folders), `DOTNET_CLI_TELEMETRY_OPTOUT=1`, `DOTNET_NOLOGO=1`. npm:
`npm ci --ignore-scripts --offline` → exit 1, `/EUSAGE/`, `/does not satisfy picomatch@4\.0\.6/`. NuGet, in `app/`:
`dotnet restore -m:4 --disable-build-servers` → 0; add `<ProjectReference Include="../lib/lib.csproj" />`;
`--locked-mode` → 1 with `/NU1004/`; `--force-evaluate` → 0; `--locked-mode` → 0. When `dotnet --version` cannot run:
under `CI` the test FAILS (`dotnet SDK missing under CI — the NU1004 fixture must run here`); otherwise `t.skip("no dotnet
SDK on PATH — NU1004 not exercised locally; CI's tools · lock fixtures job runs it")`. In the `tools · selftest` job
(`npm test`, no SDK) the step sets `LOCK_FIXTURES_JOB: "tools · lock fixtures"` and the NuGet case skips with `runs in
the required tools · lock fixtures job`, so that job is where it runs (O3).

**The job** (`.github/workflows/ci.yml`, after `tools`):

```yaml
  locks:
    name: tools · lock fixtures
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: 22
      - uses: actions/setup-dotnet@a98b56852c35b8e3190ac28c8c2271da59106c68 # v6.0.0
        with:
          global-json-file: tools/fixtures/locks/nuget-stale/global.json
      - name: Lock fixtures
        run: |
          npm ci --ignore-scripts
          node --test tools/lock-fixtures.test.mjs
```

with a comment above it saying what it proves and why it is its own job (the plan's § 10). The `Selftest` step gains
`env: LOCK_FIXTURES_JOB: "tools · lock fixtures"`. `.github/branch-protection.json`: `tools · lock fixtures` in
`release`'s contexts beside `tools · selftest` and `workflows · actionlint`, and in `main`'s (O4); the change is applied
by an admin with `--apply` after the job has reported once on this pull request (the file's own rule: a required check
that never reports blocks every merge).

| # | Given | Then |
|---|---|---|
| 4b.1 | the npm fixture | exit 1, `EUSAGE`, `does not satisfy picomatch@4.0.6` |
| 4b.2 | the NuGet fixture with an SDK | 0, then 1 with `NU1004`, then 0, 0 |
| 4b.3 | no SDK, `CI` unset / `CI=true` / `LOCK_FIXTURES_JOB` set | named skip / failure / named skip |
| 4b.4 | the job on this pull request | green; 4b.2's four exit codes in its log |
| 4b.5 | `workflows · actionlint`; `node .github/scripts/branch-protection.mjs --selftest` | green |

**Files** the two fixture folders, `tools/lock-fixtures.test.mjs`, `.github/workflows/ci.yml`,
`.github/branch-protection.json`, `research/module_tests.md`. **RED → GREEN → RED** the test before the fixtures (missing
folders); then expect exit 0 from the stale locked restore → 4b.2 fails with NU1004's text; set the npm lock to `4.0.6`
→ 4b.1 fails (no EUSAGE); unset `PATH`'s dotnet with `CI=true` → 4b.3 fails as specified. **Docs** `research/module_tests.md`
— the fixtures, the job, and what they do not prove (a consumer's real lock; that is E2's policy and E7's remediation).

---

## Warnings for every coder of this epic

- No rule file changes in E1 except S0's wording and S0b's whitespace; `node tools/rule-bodies.mjs` OK with 39 rules
  after every story.
- Temporary folders only through `ownedDir`; never `mkdtemp`, `os.tmpdir()`, a bare `git worktree add`, or an
  `npm`/`dotnet` write outside an owned copy.
- Keep `normalized.filter(file=>match(file))` byte for byte (F4).
- Every `uses:` pinned by a 40-hex sha with its version comment; no new action beyond `actions/setup-dotnet`.
- No product or repository name in a rule; data files cite the plan as plain text.
- Stage by path (never `git add -A`), read `git diff --staged --stat`, one commit per story, observed numbers in the body.

## Open points — classified (none decided beyond what the plan as written requires)

- **O1 — the checker cannot verify `justifiedBy` without history. NOT a change.** § 4.3 (`:443-444`) has "the checker
  verifies that the cited commit exists in the repository and touches only the source file(s)", while the same section
  (`:427-428`) and E1 (`:1381-1382`) say the checker reads no history and passes at depth 1, where that commit (often a
  squashed branch commit) is absent. S4 does the git verification in the RECORDER, when the entry is written and history
  is at hand, records the touched files as `justifiedFiles`, and the checker verifies their shape — both sentences hold.
- **O2 — an activation cannot name its own move commit. NOT a change.** § 4.3 (`:446-448`) puts "the move commit" in the
  activation record; a commit cannot contain its own sha, and E2 activates "in the same commit as its move" (`:1418`). S4
  records `beforeCommit` (the commit right before the move) and the destination range; the move commit is the one that
  adds the record.
- **O3 — the suite's lock test would fail in `tools · selftest`. NOT a change.** "Under `CI` the test FAILS when `dotnet`
  is missing" (`:947-948`), and `npm test` in `tools · selftest` has no SDK (F6). S4b names the dedicated job in that
  step's environment, and the NuGet case defers to it by name there; it runs, never skipped, in `tools · lock fixtures`.
  (The alternative, `setup-dotnet` in `tools · selftest` too, would run the fixture twice.)
- **O4 — required on `release` only, or on every pull request? NOT a change.** § 19 (`:1275`) and E1 (`:1393-1394`) add
  `tools · lock fixtures` to `release`'s required checks; § 10 (`:943-946`) calls it "a REQUIRED job … running the two lock
  fixtures on every pull request". S4b adds it to `main`'s contexts as well, which is what makes it required on a pull
  request.
- **O5 — `npm-packages.md` is 3,500 B in one sentence, 3,300 B in three. NOT a change.** § 5's allowance paragraph
  (`:825`) still says ≤ 3,500 B; the "after E3" table (`:798`), the pin list (`:814`) and E2 (`:1418`) set the hard cap at
  3,300 B. S2 tests 3,300 B. A stale sentence.
- **O6 — "every other row `planned`". NOT a change.** E1 (`:1345-1346`, `:1376-1377`) says every row but the proof is
  `planned`; P8, R4, R5, G4, G5 are already decided `deliberately-absent` (§ 3) and have no owning epic among E2–E6, so S3
  records them as such.
- **O7 — stale sentences. NOT a change.** § 10 (`:913-914`) still lists the `consumers.json` equality test among `npm
  test`'s at every story (it is E7's now, ledger 3.4); § 7 projects "≈ 14" move entries (F8 counts 25; the count is the
  manifest's).

## Risk items for the gate (the whole plan, at most three)

1. **E7.S3–S4 — the `release` promotion and the eight consumer bumps** (public contract, hard to reverse). One promotion
   changes what every consumer's agents load; a moved `release` is not rolled back without reddening every pin
   (`README.md` § *How `release` moves*), and the bumps flip a new CI gate to enforcing in eight repositories.
2. **E2.S3 — the exception to `npm ci --ignore-scripts`** (security). The allow-list decides which packages may run
   install-time code in every consumer's CI; a wildcard, a wrong name or a check that misses one turns the family's
   default supply-chain guard into an open door (§ 19, the epoch 4 round, finding 2).
3. **E1.S1 — the `path_tasks` resolver change** (public contract). Every consumer's agents receive their rules through
   `selectRules`; a gating mistake drops rules from a scope silently — nothing fails, an agent simply never reads them —
   so the selection baseline (S2) is the only control, and it must land in the same pull request.
