# PLAN — C#/Node rule parity, E1: delivery and the parity contract (no new prose)

> Status: **plan only, nothing implemented yet, 2026-10-31.** Scope: the stories of epic E1 — the `path_tasks` key in
> `tools/lib/rule-catalog.mjs` and the explain output of `tools/lib/rule-cli.mjs`; the selection/budget matrix
> `research/selection-matrix.json` with its id-list test and the measured bytes in `research/module_rules.md`;
> `research/parity-inventory.json`, `research/parity-matrix.json` and their test; the moved-block byte-equality harness
> `tools/lib/moved-blocks.mjs` with its self-test and the `## Moves` record in `research/module_rules.md`; the byte
> allowances per later epic and the single-read list of D5; `ENTRY.md` step 7; `research/module_tests.md`; the CI
> checkout depth. No rule file changes.
>
> Stories of epic E1 of [PLAN_node_rule_parity.md](PLAN_node_rule_parity.md) (§ *Epics*, E1). Written by Opus on
> 2026-10-31 from the parent at `d986710` and the code at that commit. This document keeps no change ledger of its own:
> a change to E1's approved work is an entry in the parent's `## Plan changes`. E1 holds no cornerstone area (parent,
> § *Epics*), so no story here is marked `model: fable` and the parent's ledger line stays
> `Cornerstones: 0 of 3`.

Done when (from the parent's E1): `npm test` green with the new tests; the matrix test was observed red when a row named a
missing id or section, then fixed; every tight scope's headroom is in `research/module_rules.md`; every later epic has
its byte allowance written down; one pull request through both gates. The commands, from the worktree root, after the
locked install `.agents/PROJECT.md` requires (`npm test` does not run the family checks):

```bash
npm ci --ignore-scripts
npm test
npm run check
node tools/ownership-check.mjs
node tools/rule-bodies.mjs
node tools/plan-lifecycle.mjs .
```

## Gates, models, branch

- **Branch.** `feat/rule-parity-e1`, one worktree, based on the plan branch at `d986710`. One commit per story, each with
  `npm test` green; one pull request for the epic, squash-merged (the house shape — § *Facts*, F7).
- **Gates.** `open` on this branch (the checkout's own top level, `callerModel`); `review_plan` with this document's
  stories as the scope of epic 1 of 7; `resolve` every finding, rejecting in round one what is wrong; build in the order
  below; `review_code` over the epic's diff with `baseRef` `d986710` and an Opus review, both started at once. A reply's
  `commands` are followed and named in the summary; a cadence-consultation order is made as written.
- **Models.** Scenarios and briefs: Opus (this document). Code, tests and documents: a Sonnet coder per story, from the
  brief below, re-discovering nothing. Review: Opus. Fixes: Sonnet. No story qualifies for the small-edit exception
  (each touches more than one file).

## Facts the stories rest on (read at `d986710`, 2026-10-31)

- **F1 — selection.** `selectRules` (`tools/lib/rule-catalog.mjs:141-166`) adds a rule for `load: always`, for each scope
  task in its `tasks`, and for each (file, pattern) match of its `paths`; dependencies are added first with the reason
  `dependency:<id>` and ignore their own conditions. Reasons are `always`, `task:<t>`, `path:<file> (<pattern>)`,
  `dependency:<id>`. Metadata keys are the set `KEYS` (`:30`); an unknown key throws in `ruleFrom` (`:85`), so a rule
  carrying `path_tasks` today fails the whole catalog with `unknown metadata key path_tasks`.
- **F2 — the explain manifest** lists per rule `id, source, hash, bytes, load, paths, tasks, depends, reasons`
  (`tools/lib/rule-cli.mjs:103`). A rule's `bytes` is the whole file text, front matter included (`rule-catalog.mjs:98`).
- **F3 — the body freeze** hashes the body after the front matter (`tools/lib/rule-body.mjs:24`), so a changed `paths:`,
  `tasks:` or `depends:` line passes it (`tools/rules.test.mjs:151-174`; `drifted` in `tools/rule-bodies.mjs:72` is
  exported). This is D12's reason for the id-list pins.
- **F4 — a mutation test depends on a literal.** `tools/rules.test.mjs:322` replaces the exact text
  `normalized.filter(file=>match(file))` inside `rule-catalog.mjs` and expects the CLI to change behaviour. The S1 edit
  must keep that substring byte for byte, or that test goes red for a reason unrelated to the gate.
- **F5 — the single-read pin** is `tools/rules.test.mjs:250-257`, ten scopes: `inspect` ×{none, `src/x.cs`,
  `src/x.csproj`, `ui/a.ts`}, `ui` ×{none, `src/x.cs`, `ui/a.ts`}, `gpu` ×{none, `src/x.cs`}, `storage` none.
- **F6 — section strings** in `research/rule-bodies.json` are whole heading lines with their `#` marks, inline code kept
  (`sectionsOf`, `rule-body.mjs:89`), e.g. `"## 1. Language & runtime"`.
- **F7 — history is not there after the merge.** Pull requests here are squash-merged (`git log` on `main`: linear,
  one commit per `(#NN)`), and CI checks out with `actions/checkout`'s default depth of 1 (`.github/workflows/ci.yml:23-25`,
  no `fetch-depth`). A branch commit named as a move's "before" (E4.S2's anonymisation commit, parent § 4.4) therefore
  does not exist on `main` after the merge, and no commit but HEAD exists in CI at all. A byte-equality test that needs
  `git show <before>:<source>` in every run would be red on `main` after every squash merge. S4 is designed around this.
- **F8 — the measured matrix**, every scope by `selectRules(loadCatalog("."), [task], files)` summed `bytes`, at
  `d986710` (no rule file differs from `f46982f`, where the parent measured):

| Files | `inspect` | `ui` | `gpu` | `storage` | `implement` | `test` | `audit` | `logging` | `dependencies` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| (no file) | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,355 |
| `src/x.cs` | 28,820 | 31,033 | 32,293 | 34,019 | 291,538 | 284,106 | 222,853 | 78,866 | 164,968 |
| `src/x.csproj` | 31,901 | 34,114 | 35,374 | 37,100 | 294,619 | 287,187 | 225,934 | 81,947 | 164,968 |
| `Directory.Build.props` | 27,288 | 29,501 | 30,761 | 32,487 | 290,006 | 282,574 | 221,321 | 77,334 | 160,355 |
| `ui/a.ts` | 30,116 | 32,329 | 33,589 | 35,315 | 292,834 | 285,402 | 224,149 | 80,162 | 166,264 |
| `src/a.mjs` | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,355 |
| `src/x.cs` + `ui/a.ts` | 34,729 | 36,942 | 38,202 | 39,928 | 297,447 | 290,015 | 228,762 | 84,775 | 170,877 |
| `package.json` | 35,409 | 37,622 | 38,882 | 40,608 | 298,127 | 279,493 | 229,442 | 85,455 | 171,557 |
| `tsconfig.json` | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,355 |
| `.npmrc` | 24,207 | 26,420 | 27,680 | 29,406 | 286,925 | 279,493 | 218,240 | 74,253 | 160,355 |
| `src/webview/page.ts` | 30,116 | 32,329 | 33,589 | 35,315 | 292,834 | 285,402 | 224,149 | 80,162 | 166,264 |
| `src/main.rs` | 40,743 | 42,956 | 44,216 | 45,942 | 291,304 | 296,029 | 222,619 | 78,632 | 176,891 |

  108 scopes, 1,509 selected ids in all. Two facts the parent's § 5 does not carry: `src/main.rs` selects
  `common.logging-serilog` through its `**/main.rs` path, so every single-read task with a Rust file is already over one
  read (`inspect` 40,743 B); and `src/a.mjs` selects no language rule, so its scopes equal the no-file ones until E4.

## Order

S1 → S2 → S5 → S3 → S4. S1 first because it is the only code change to the resolver; S2 pins the selection the resolver
then produces (S1 adds no gated rule, so nothing in the pins moves); S5 extends S2's file with the single-read flags; S3
and S4 are independent of the others and of each other. Every story writes its tests first and watches them fail for the
reason named in its RED step.

## Growth (parent § 7, for the files E1 adds)

| Surface | Projected size | Who retires it | Interrupted |
|---|---|---|---|
| `research/selection-matrix.json` | ≈ 55 KB at E1 (108 scopes, 1,509 ids); each later epic adds the ids its rules bring, ≈ +10 % over the plan | edited by hand with every selection change; the test refuses a stale entry in either direction | — |
| `research/parity-inventory.json`, `research/parity-matrix.json` | ≈ 4 KB and ≈ 12 KB, 30 entries and 30 rows (the parent's estimate) | edited with the rules; the one-to-one test refuses an orphan | — |
| `research/module_rules.md` (a PROJECT `requires` source, read at every session start) | + ≈ 6 KB: the gate section, the measured table, the allowances, the `## Moves` record (one row per moved block, ≈ 15 rows over the plan) | the measured table is replaced, never appended, at each re-measurement; the § Moves rows are the permanent record of the moves | — |
| `tools/lib/moved-blocks.mjs` + its test | ≈ 200 + 300 lines | lives as long as moved blocks are recorded | the self-test's temporary repositories are owned folders (`ownedDir`), removed by the test and swept by the next run if it was killed |

## Not in E1

- No rule file, no rule section and no rule sentence changes; no rule gains `path_tasks` (the first gated rules arrive in
  E4–E6). `research/rule-bodies.json` does not change.
- No moved block is recorded in `## Moves`: E1 ships the harness and its self-test; E2, E4, E5 and E6 add rows.
- The deliberately-absent rows are recorded in `research/parity-matrix.json` with their reasons; the prose statements
  the parent assigns to later epics (P8's "check and no hook" paragraph in E3) are not written here.

---

## E1.S1 — `path_tasks`: a path-selected rule loads only in a scope that names one of its tasks

- **Size.** M — about 30 lines in `rule-catalog.mjs` and `rule-cli.mjs`, about 150 lines of tests, three documents.
- **Models.** Brief: Opus (below). Code and tests: a Sonnet coder. Review: Opus.
- **Goal.** D3 and parent § 4.2: a new metadata key `path_tasks`. A rule's `paths` select it only when the scope also
  names one of the `path_tasks`; plain `tasks` still select it regardless of files; `depends` is unaffected and still
  mandatory; a rule with `path_tasks` and no `paths` is a metadata error. The explain output shows the gate. A test holds
  every gated rule's gate equal to the `tasks:` line of the rule it mirrors (parent T11).

### Scenarios (Given / When / Then)

Fixture catalogs are built with the existing `fixture(t)` helper of `tools/rules.test.mjs` (a `common/core.md` always
rule plus whatever the case writes). `G` below is `csharp/mech.md` with
`id: csharp.mech · load: conditional · paths: ["**/*.cs"] · path_tasks: ["implement","test"]`.

| # | Given | When | Then |
|---|---|---|---|
| 1.1 | `G` | `selectRules(catalog, ["implement"], ["src/x.cs"])` | `csharp.mech` is selected; its `reasons` are exactly `["path:src/x.cs (**/*.cs) when task:implement"]` |
| 1.2 | `G` | `["inspect"]`, `["src/x.cs"]` | `csharp.mech` is NOT selected |
| 1.3 | `G` | `["implement"]`, no file | not selected — the gate is not a task selector |
| 1.4 | `G` | `["implement"]`, `["ui/a.ts"]` | not selected — the gate does not replace the path |
| 1.5 | `G` | `["inspect","test"]`, `["src/x.cs"]` | selected, reason `path:src/x.cs (**/*.cs) when task:test` |
| 1.6 | `G` | `["test","implement"]`, `["src/x.cs"]` | selected, ONE reason `path:src/x.cs (**/*.cs) when task:implement,test` — the gate tasks in the rule's own `path_tasks` order |
| 1.7 | `G` plus an ungated `csharp/plain.md` with the same `paths` | `["inspect"]`, `["src/x.cs"]` | `csharp.plain` IS selected and `csharp.mech` is not — the companion that proves the path matches, so 1.2 is about the gate and not about a glob that matches nothing |
| 1.8 | a gated rule that also has `tasks: ["audit"]` | `["audit"]`, no file | selected, reason `task:audit` |
| 1.9 | `common/dep.md` (`tasks: ["gpu"]`, `depends: ["csharp.mech"]`) and `G` | `["gpu"]`, no file | `csharp.mech` is selected with reason `dependency:common.dep` — a dependency ignores the gate as it ignores paths |
| 1.10 | `G` with `depends: ["common.b"]`, `common/b.md` (`tasks: ["gpu"]`) | `["implement"]`, `["src/x.cs"]` | `common.b` is selected before `csharp.mech`, reason `dependency:csharp.mech` |
| 1.11 | `path_tasks: ["implement"]` and no `paths` key | `loadCatalog` | throws `/path_tasks needs paths/` |
| 1.12 | `paths: []` and `path_tasks: ["implement"]` | `loadCatalog` | throws `/path_tasks needs paths/` |
| 1.13 | `paths: ["**/*.cs"]`, `path_tasks: []` | `loadCatalog` | throws `/path_tasks must name at least one task/` |
| 1.14 | `path_tasks: ["imlpement"]` | `loadCatalog` | throws a message naming `imlpement` AND the legal values (`/imlpement.*legal: inspect/`) |
| 1.15 | `path_tasks: "implement"` (a string) | `loadCatalog` | throws `/path_tasks must be an array of nonempty strings/` |
| 1.16 | `load: always`, `paths`, `path_tasks` | `loadCatalog` | throws `/path_tasks applies to a conditional rule only/` |
| 1.17 | any of 1.11–1.16 in a rule no scope would select | `loadCatalog` | still throws — metadata errors are catalog errors, as today |
| 1.18 | the CLI fixture (`cliFixture`) with `csharp/zz-gated.md` written into the copy (`paths: ["**/*.cs"]`, `path_tasks: ["implement"]`) | `run(["explain","--task","implement","--file","src/x.cs","--repo",root], root)` | the manifest's entry for `csharp.zz-gated` has `path_tasks: ["implement"]` and `reasons: ["path:src/x.cs (**/*.cs) when task:implement"]`; the entry for `csharp.doctrine` has `path_tasks: []` |
| 1.19 | the same fixture | `explain --task inspect --file src/x.cs` | `csharp.zz-gated` is absent from `rules` |
| 1.20 | the real catalog and `GATE_SOURCES` (empty at E1) | `gateFindings(loadCatalog(sourceRoot), GATE_SOURCES)` | `[]` |
| 1.21 | a fixture catalog: `G` and `common/src.md` with `tasks: ["implement","test"]`; sources `{}` | `gateFindings` | one finding naming `csharp.mech` as gated with no declared source |
| 1.22 | the same, sources `{"csharp.mech":"common.src"}` | `gateFindings` | `[]` (the positive case for the fixture) |
| 1.23 | `common/src.md` with `tasks: ["implement","audit"]`, sources as 1.22 | `gateFindings` | one finding: `csharp.mech`'s `path_tasks` [implement, test] differ from `common.src`'s tasks [audit, implement] |
| 1.24 | sources `{"csharp.gone":"common.src"}` | `gateFindings` | one finding: `csharp.gone` is not in the catalog |
| 1.25 | sources `{"csharp.mech":"common.gone"}` | `gateFindings` | one finding: the source `common.gone` is not in the catalog |
| 1.26 | sources naming an ungated rule `{"csharp.plain":"common.src"}` | `gateFindings` | one finding: `csharp.plain` has no `path_tasks` |

### Files

- `tools/lib/rule-catalog.mjs` — `KEYS`, `ruleFrom`, `selectRules`.
- `tools/lib/rule-cli.mjs` — the manifest's rule entries (`:103`).
- `tools/rules.test.mjs` — the scenarios above, `GATE_SOURCES` and `gateFindings`.
- `ENTRY.md` step 7; `research/module_rules.md`; `research/module_tests.md`.

### Acceptance criteria

- Every scenario above is a passing test; the 24 existing tests of `tools/rules.test.mjs` pass unchanged, the
  mutation case at `:322` included.
- `node tools/rules.mjs explain --repo . --task implement --file src/x.cs` prints `"path_tasks": []` for every rule and
  the same rule ids and `bytes` as before the change (no real rule is gated yet).
- `npm test`, `npm run check`, `node tools/rule-bodies.mjs` green.

### RED → GREEN → RED

1. **RED.** Write all of 1.1–1.26 first. Run `node --test tools/rules.test.mjs`. Expected: 1.1–1.10, 1.18, 1.19 and
   1.21–1.26 fail with `unknown metadata key path_tasks` (the key is not supported — the real symptom); 1.11–1.16 fail
   because the thrown message is `unknown metadata key path_tasks`, not the one asserted; 1.20 passes (empty table, real
   catalog without gated rules). Record the failure lines.
2. **GREEN.** Implement the brief. Every case passes; then the whole suite.
3. **RED again, per protection** (edit, watch the named case go red with the real symptom, restore, watch green):
   (a) in `selectRules`, drop the gate filter so a gated rule's paths select it like any other → 1.2 fails (selected on
   `inspect`); (b) delete the "needs paths" check → 1.11 and 1.12 fail; (c) delete `path_tasks` from the CLI manifest →
   1.18 fails; (d) in `gateFindings`, drop the set comparison → 1.23 fails. Report each observation.

### Docs to update

- `ENTRY.md` step 7 — the selection sentence (text in the brief).
- `research/module_rules.md` — the metadata-keys paragraph (`:19-23`) and a new section (text in the brief).
- `research/module_tests.md` — one section naming the new cases (text in the brief).

### The brief (for the Sonnet coder)

You change two library files, one test file and three documents. Nothing else. No rule file (`common/`, `csharp/`,
`rust/`, `typescript/`) changes, and `research/rule-bodies.json` does not change.

**1. `tools/lib/rule-catalog.mjs`.**

- Line 30: `const KEYS = new Set(["id", "load", "paths", "tasks", "depends", "path_tasks"]);`
- In `ruleFrom`, after `const depends = stringList(metadata,"depends",file);` and before the existing `tasks.forEach`
  line, add the gate's validation, in this order (each a `throw new Error(...)` with exactly these messages, `${file}:`
  first like every other message in the function):
  ```js
  const gated = Object.hasOwn(metadata, "path_tasks");
  const pathTasks = stringList(metadata, "path_tasks", file);
  pathTasks.forEach(task => { if (!Object.hasOwn(TASKS,task)) throw new Error(`${file}: unknown path_tasks task ${task}; legal: ${Object.keys(TASKS).join(", ")}`); });
  if (gated && metadata.load === "always") throw new Error(`${file}: path_tasks applies to a conditional rule only`);
  if (gated && !pathTasks.length) throw new Error(`${file}: path_tasks must name at least one task`);
  if (gated && !paths.length) throw new Error(`${file}: path_tasks needs paths — it gates path selection and selects nothing alone`);
  ```
  `stringList` already throws `path_tasks must be an array of nonempty strings` for a non-array (scenario 1.15).
  Note `paths` is computed above these lines; keep that order.
- In the returned object add `pathTasks` after `depends`: `{ id, load, paths, tasks, depends, pathTasks, source, … }`.
- In `selectRules`, replace the `for (const pattern of rule.paths)` loop with the gated form below. **Keep the literal
  `normalized.filter(file=>match(file))` exactly as it is** — `tools/rules.test.mjs:322` mutates that text:
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
  An ungated rule's reason text is unchanged (`when` is empty). `gate` keeps the rule's own `path_tasks` order
  (scenario 1.6). The `always` and `task:` lines above the loop do not change.

**2. `tools/lib/rule-cli.mjs` line 103.** Destructure `pathTasks` and emit it under the metadata's spelling:
`const rules=selected.map(({id,file,hash,bytes,load,paths,tasks,depends,pathTasks,reasons})=>({id,source:…,hash,bytes,load,paths,tasks,depends,path_tasks:pathTasks,reasons}));`
(keep the existing `source:` expression).

**3. `tools/rules.test.mjs`.** Add the cases of the scenario table as tests named for their guarantee, after the existing
`"tasks OR paths select a rule …"` test (fixture cases) and after `"CLI protocol validates scope …"` (the CLI cases 1.18 and
1.19, using `cliFixture(t)` and `run([...,"--repo",root],root)`; write the extra rule with
`fs.writeFileSync(path.join(root,"csharp/zz-gated.md"), "---\nid: csharp.zz-gated\nload: conditional\npaths: [\"**/*.cs\"]\npath_tasks: [\"implement\"]\n---\nA gated rule.\n")`).
Suggested names: `a path_tasks rule is selected by its paths only in a scope that names one of its tasks` (1.1–1.7),
`plain tasks and dependencies still select a gated rule, and its own dependencies follow it` (1.8–1.10),
`path_tasks metadata errors fail the whole catalog` (1.11–1.17; a table loop like the existing
`duplicates, unknown keys …` test, each case written with `put("common/b.md", meta)` and asserted with `assert.throws`),
`explain reports path_tasks and names the gate in the reason` (1.18–1.19),
`every gated rule's path_tasks equals the tasks line of the rule it mirrors` (1.20 on the real catalog) and
`the gate-source check refuses an undeclared, mismatched, stale or ungated entry` (1.21–1.26 on fixtures). Assert the
exact reason strings with `assert.deepEqual`.

Add, near `SPLIT_READ_TASKS`, the table and the pure function:

```js
// Plan T11 (todo/PLAN_node_rule_parity.md): a gated rule's path_tasks is the tasks line of the rule its mechanics came
// from, so a C# agent on implement meets exactly the mechanics it met inside the common rule, and the gate is never a
// way around a budget. The epic that creates a gated rule adds its line here: "<gated id>": "<source rule id>".
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

**4. `ENTRY.md` step 7.** Replace the second sentence so the step reads (keep the wrap at about 90 columns):

```
7. Dependencies are mandatory even when their own paths/tasks do not match. Selection is
   paths (optionally gated by `path_tasks`) OR tasks, plus always rules and transitive
   dependencies, deduplicated by id. A rule with `path_tasks` is selected by its paths only
   in a scope that also names one of those tasks.
   Metadata in each rule is the only selection source; todo, research, fixtures and tool
   comments are not policy catalogs. Local rules belong in `.agents/rules` with `local.*` ids.
```

**5. `research/module_rules.md`.** Replace the paragraph at `:19-23` ("Metadata keys: …") with:

> Metadata keys: `id`, `load`, optional `paths`, `tasks`, `depends`, `path_tasks`. Unknown fields/tasks, duplicate
> ids/keys, empty bodies, missing dependencies and cycles are errors even in unselected rules, and so is a `path_tasks`
> that is empty, names an unknown task, sits on an `always` rule or has no `paths` to gate. All Markdown in the four
> rule directories must declare metadata. Local rules use the same schema and `local.*` ids. The migration inventory
> records every original rule section and body hash; it is historical evidence, not a second selector.

and add a section after the `## The plan-change-control rule …` section, before `References:`:

> ## Task-gated path selection — `path_tasks` (2026-10-31)
>
> `path_tasks: [<task>, …]` gates a rule's `paths`: a matching file selects the rule only in a scope that also names one
> of those tasks, and the reason reads `path:<file> (<pattern>) when task:<t>[,<t>…]`. Plain `tasks` still select the rule
> whatever the files, and a rule selected as a dependency ignores the gate as it ignores paths. The explain manifest lists
> `path_tasks` for every rule (`[]` when ungated). The one legitimate use (todo/PLAN_node_rule_parity.md D3, T11): a
> language-scoped rule holding mechanics that came from a common rule carries that rule's `tasks:` line as its gate, so a
> scope meets exactly the mechanics it met before the move, and an `inspect`, `ui`, `gpu` or `storage` scope with a
> language file meets none it did not meet before. `GATE_SOURCES` in `tools/rules.test.mjs` names the source rule of
> every gated rule and the suite fails when a gate differs from its source's `tasks`, when a gated rule has no entry, or
> when an entry is stale. A gate chosen to fit a budget rather than to match its source is the misuse this guards.

(Write the plan path as plain code text, not a link: `research/` links to `todo/` break at promotion.)

**6. `research/module_tests.md`.** Append a section `## Task-gated path selection (\`path_tasks\`, 2026-10-31)` listing
the six new tests by name, one line each with what it pins, and a last line: *What it does not prove: that a gated rule's
TEXT matches its source's — that is the moved-block test of `tools/moved-blocks.test.mjs`.*

**Commands.** `node --test tools/rules.test.mjs` (RED, then GREEN), then the six commands at the top of this document.
Report the RED failure lines, the four RED-again observations, and the runner's totals.

---

## E1.S2 — The selection/budget matrix: the id list of every representative scope, pinned; its bytes, recorded

- **Size.** M — one generated data file (≈ 55 KB), one test file of about 150 lines, one measured table.
- **Models.** Brief: Opus (below). Data, test and table: a Sonnet coder. Review: Opus (it reads the single-read id lists
  against § *Facts* F8 and the lists below).
- **Goal.** Parent § 4.1 and D12: the exact id list each representative scope selects is a test, so a changed `paths:`,
  `tasks:`, `depends:` or `path_tasks:` line that the body freeze cannot see (F3) is a red suite; the bytes of every
  scope are recorded with the commit they were measured at, and the command that re-measures them is written beside them.

### The representative scopes

The 12 file sets of parent § 4.1 (each a separate scope; the mixed one is one scope with two files) × the 9 tasks the
parent names — `inspect`, `ui`, `gpu`, `storage` (single-read) and `implement`, `test`, `audit`, `logging`,
`dependencies` (split-read): 108 scopes.

File sets: none · `src/x.cs` · `src/x.csproj` · `Directory.Build.props` · `ui/a.ts` · `src/a.mjs` ·
`src/x.cs` + `ui/a.ts` · `package.json` · `tsconfig.json` · `.npmrc` · `src/webview/page.ts` · `src/main.rs`.

The single-read lists at `d986710` (the reviewer checks the generated file against these; every split-read list is
generated and read in the diff):

| Task | Base (no file) | + `src/x.cs` | + `src/x.csproj` | + `Directory.Build.props` | + `ui/a.ts`, `src/webview/page.ts` | + both | + `package.json` | + `src/main.rs` |
|---|---|---|---|---|---|---|---|---|
| `inspect` | `common.coding-style`, `common.knowledge-base`, `common.security`, `common.task-lifecycle` | + `csharp.doctrine` | + `csharp.doctrine`, `csharp.nuget-packages` | + `csharp.nuget-packages` | + `typescript.doctrine` | + both doctrines | + `common.local-cpu-budget` | + `common.logging-serilog`, `rust.doctrine` |
| `ui` | inspect's four + `common.durable-status` | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect |
| `gpu` | inspect's four + `common.gpu-lease` | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect |
| `storage` | inspect's four + `common.utc-timestamps` | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect | as inspect |

`src/a.mjs`, `tsconfig.json` and `.npmrc` select exactly the base list of each task today.

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 2.1 | the real catalog and `research/selection-matrix.json` | `selectionDrift(catalog, matrix.scopes)` | `[]` |
| 2.2 | the matrix file | its structure is read | 108 entries, names unique, every entry's `tasks` a non-empty list of known tasks, `files` an array, `ids` sorted and unique; and every (task, file set) pair of the distinct tasks and distinct file sets in the file appears exactly once — the cross product has no hole |
| 2.3 | a copy of the four rule directories and `research/rule-bodies.json` in an owned folder, with the line `tasks: ["dependencies"]` deleted from the copy's `csharp/nuget-packages.md` | `selectionDrift(loadCatalog(copy), scopes)` | non-empty, and it names the scope `dependencies (no file)` as no longer selecting `csharp.nuget-packages` |
| 2.4 | the same copy | `drifted(copy, manifest)` from `tools/rule-bodies.mjs` | `[]` — the body freeze does not see a front-matter change; 2.3 and 2.4 together are D12's point, kept as a test named for it |
| 2.5 | a copy with one sentence of `csharp/doctrine.md`'s body changed and no front matter touched | `drifted` / `selectionDrift` | `drifted` names `csharp.doctrine`; `selectionDrift` is `[]` — the two controls are complementary |
| 2.6 | a matrix entry listing an extra id, and another missing one (inline objects against the real catalog) | `selectionDrift` | one finding per id, each naming the scope and the id and saying which direction (`selects X, which the matrix does not list` / `the matrix lists X, which it no longer selects`) |

### Files

- `research/selection-matrix.json` (new, generated once, then edited by hand).
- `tools/selection-matrix.test.mjs` (new).
- `research/module_rules.md` (the measured table), `research/module_tests.md`.

### Acceptance criteria

- 2.1–2.6 pass; the single-read lists in the file equal the table above.
- The measured table in `research/module_rules.md` equals F8 number for number (the coder re-measures with the command
  below and writes what it prints; a difference is reported, not smoothed over), names the commit it was measured at and
  the date, and gives the command.

### RED → GREEN → RED

1. **RED.** Write `tools/selection-matrix.test.mjs` before the data file. `node --test tools/selection-matrix.test.mjs`
   fails in 2.1 and 2.2 with the file-missing message the test writes (`research/selection-matrix.json is missing — …`),
   not a raw stack; 2.3–2.6 are inline and may already pass or fail on the missing file — record which.
2. **GREEN.** Generate the file (command below); all six pass.
3. **RED again.** Delete one id from one split-read entry of the file → 2.1 fails naming that scope and id; restore.
   Swap two ids of one entry → 2.2 fails (`ids` not sorted); restore. Report both.

### Docs to update

- `research/module_rules.md` — section *The selection/budget matrix* (the brief gives its shape).
- `research/module_tests.md` — the new test file, its six cases and what it does not prove.

### The brief (for the Sonnet coder)

**1. Generate `research/selection-matrix.json` once**, from the worktree root, and read the diff before committing:

```bash
node --input-type=module -e '
import fs from "node:fs";
import {loadCatalog,selectRules} from "./tools/lib/rule-catalog.mjs";
const catalog=loadCatalog(".");
const F=[[],["src/x.cs"],["src/x.csproj"],["Directory.Build.props"],["ui/a.ts"],["src/a.mjs"],["src/x.cs","ui/a.ts"],["package.json"],["tsconfig.json"],[".npmrc"],["src/webview/page.ts"],["src/main.rs"]];
const T=["inspect","ui","gpu","storage","implement","test","audit","logging","dependencies"];
const scopes=T.flatMap(t=>F.map(f=>({name:`${t} ${f.length?f.join(" + "):"(no file)"}`,tasks:[t],files:f,ids:selectRules(catalog,[t],f).map(r=>r.id).sort()})));
const line=s=>`    {"name": ${JSON.stringify(s.name)}, "tasks": ${JSON.stringify(s.tasks)}, "files": ${JSON.stringify(s.files)},\n     "ids": ${JSON.stringify(s.ids)}}`;
const note="The exact rule ids each representative scope selects (todo/PLAN_node_rule_parity.md section 4.1, D12). tools/selection-matrix.test.mjs fails when the resolver selects a different list. The body freeze (rule-bodies.json) hashes bodies after the front matter, so a changed paths, tasks, depends or path_tasks line is seen only here. Edit by hand in the commit that changes selection; the diff names every id that joined or left a scope.";
fs.writeFileSync("research/selection-matrix.json",`{\n  "note": ${JSON.stringify(note)},\n  "scopes": [\n${scopes.map(line).join(",\n")}\n  ]\n}\n`);'
node -e 'const j=require("./research/selection-matrix.json");console.log(j.scopes.length)'   # 108
```

Do not commit a generator: the file is a record, changed by hand afterwards, as `research/rule-bodies.json` is.

**2. `tools/selection-matrix.test.mjs`.** `node:test`, `node:assert/strict`. Imports: `loadCatalog`, `selectRules`,
`TASKS` from `./lib/rule-catalog.mjs`; `drifted` from `./rule-bodies.mjs`; `ownedDir` from `./lib/owned.mjs` (the only
sanctioned way to make a temporary folder here — `common/test-leftovers.md`; never `mkdtemp` or `os.tmpdir()`).
`sourceRoot` as in `tools/rules.test.mjs:120`. Read the matrix with a helper that throws
`research/selection-matrix.json is missing — generate it as todo/PLAN_node_rule_parity_E1.md E1.S2 says` when absent.

```js
export function selectionDrift(catalog, scopes) {   // a plain function in the test file; export is not needed
  const findings = [];
  for (const scope of scopes) {
    const actual = selectRules(catalog, scope.tasks, scope.files).map(rule => rule.id).sort();
    for (const id of actual) if (!scope.ids.includes(id)) findings.push(`${scope.name}: selects ${id}, which the matrix does not list`);
    for (const id of scope.ids) if (!actual.includes(id)) findings.push(`${scope.name}: the matrix lists ${id}, which it no longer selects`);
  }
  return findings;
}
```

Tests, named for their guarantee:
`every representative scope selects exactly the ids the matrix records` (2.1, `assert.deepEqual(findings, [])` so the
message lists every finding); `the matrix covers the whole cross product of its tasks and file sets, once each, with
sorted unique ids` (2.2 — derive the distinct tasks and file sets FROM the file, then assert each pair once; assert
`scopes.length === tasks × fileSets`; assert every task is a key of `TASKS`);
`a front-matter-only change passes the body freeze and fails the selection pin` (2.3 + 2.4: copy `common`, `csharp`,
`rust`, `typescript` and `research/rule-bodies.json` into `ownedDir(t, "selection matrix")` with `fs.cpSync(…,{recursive:true})`,
remove the `tasks:` line from the copy's `csharp/nuget-packages.md`, assert `drifted(copy, manifest)` is `[]` and
`selectionDrift(loadCatalog(copy), scopes)` contains `dependencies (no file): the matrix lists csharp.nuget-packages, which it no longer selects`);
`a body-only change is the freeze's to catch, not the pin's` (2.5: in a second copy append ` (test)` to the first body
line after the H1 of `csharp/doctrine.md`); `a drift names the scope, the id and the direction` (2.6, inline).

**3. `research/module_rules.md`.** A section after the `path_tasks` section of S1:

> ## The selection/budget matrix (todo/PLAN_node_rule_parity.md § 4.1, measured 2026-10-31 at `<sha>`)
>
> One sentence on what `research/selection-matrix.json` pins and that `tools/selection-matrix.test.mjs` fails on any
> difference; then the bytes table in the shape of § *Facts* F8 of the E1 stories document (rows: the 12 file sets;
> columns: the 9 tasks; numbers with thousands separators), with a last line naming the two facts F8 states
> (`src/main.rs` selects `common.logging-serilog`; `src/a.mjs` selects no language rule until E4). Then the command:
>
> ```bash
> node --input-type=module -e 'import fs from "node:fs";import {loadCatalog,selectRules} from "./tools/lib/rule-catalog.mjs";const c=loadCatalog(".");for(const s of JSON.parse(fs.readFileSync("research/selection-matrix.json","utf8")).scopes)console.log(`${s.name}\t${selectRules(c,s.tasks,s.files).reduce((n,r)=>n+r.bytes,0)}`)'
> ```
>
> and the sentence: *Each later epic of the plan re-runs it and replaces this table (never appends a second one), naming
> its own commit.*

`<sha>` is the commit you measured at (`git rev-parse HEAD` before your commit — `d986710`'s rules are the ones
measured). **4. `research/module_tests.md`** — append the section for the new file.

---

## E1.S5 — The single-read list of D5, and the byte allowances of every later epic

- **Size.** S — one field added to 108 entries, one test rewritten, two short sections of `module_rules.md`.
- **Models.** Brief: Opus (below). Data, test, text: a Sonnet coder. Review: Opus.
- **Goal.** Parent § 4.1's exit criterion and § 5: the list of scopes that must fit one read (≤ 32,768 B) becomes data in
  the matrix file — D5's list — with a reason for every single-read-task scope left out, the test reads it instead of a
  literal list, and every later epic's byte allowance is written down with the scope it protects.

### The list (decided here, from F8, D5 and the parent's § 5)

`oneRead: true` (23 scopes — the ten of F5 except the two D5 removes, plus thirteen new ones that fit today and stay
within the parent's allowances):

| Task | `oneRead: true` |
|---|---|
| `inspect` | none · `src/x.cs` · `src/x.csproj` · `Directory.Build.props` · `ui/a.ts` · `src/a.mjs` · `tsconfig.json` · `.npmrc` · `src/webview/page.ts` |
| `ui` | none · `Directory.Build.props` · `tsconfig.json` · `.npmrc` |
| `gpu` | none · `src/x.cs` · `Directory.Build.props` · `src/a.mjs` · `tsconfig.json` · `.npmrc` |
| `storage` | none · `Directory.Build.props` · `tsconfig.json` · `.npmrc` |

Every split-read-task scope is `oneRead: false` with no reason needed. Every other single-read-task scope is
`oneRead: false` with a `why`, exactly:

| Scope | `why` |
|---|---|
| `ui src/x.cs` | `D5: ui with a language file leaves the single-read list; csharp.output-encoding is gated on ui (R1)` |
| `ui ui/a.ts`, `ui src/webview/page.ts` | `D5: ui with a language file leaves the single-read list; the webview trap is gated on ui` |
| `ui src/a.mjs` | `D5: ui with a language file leaves the single-read list; .mjs selects the TypeScript doctrine from E4` |
| `storage src/a.mjs` | `fits today (29,406 B) and stops fitting at E4, when .mjs selects the TypeScript doctrine (Q5), as storage ui/a.ts is over today` |
| each scope over 32,768 B today | `over one read today: <bytes> B` with its F8 number — `inspect`: mixed 34,729, `package.json` 35,409, `src/main.rs` 40,743; `ui`: `src/x.csproj` 34,114 (also D5), mixed 36,942, `package.json` 37,622, `src/main.rs` 42,956; `gpu`: `src/x.csproj` 35,374, `ui/a.ts` 33,589, mixed 38,202, `package.json` 38,882, `src/webview/page.ts` 33,589, `src/main.rs` 44,216; `storage`: `src/x.cs` 34,019, `src/x.csproj` 37,100, `ui/a.ts` 35,315, mixed 39,928, `package.json` 40,608, `src/webview/page.ts` 35,315, `src/main.rs` 45,942 |

### The allowances (parent § 5, recorded with the scope each protects)

| Epic | Allowance | Protects | That scope today |
|---|---|---|---|
| E2 | `common/dependencies.md` ≤ 4,000 B; `typescript/npm-packages.md` ≤ 3,500 B; the NuGet rule only loses bytes | split-read `dependencies` scopes; `package.json` scopes are over one read today | `dependencies package.json` 171,557 B |
| E3 | `typescript/compiler-strictness.md` ≤ 3,300 B | `storage tsconfig.json` ≤ 32,768 | 29,406 B → ≤ 32,706 B (62 B left) |
| E3 + E4 | `csharp/doctrine.md` ≤ 5,088 B (today 4,613; `Nullable enable` ≈ 20 B in E3, the Definition of Done ≈ 350 B in E4) | `gpu src/x.cs` ≤ 32,768 — **measured before the Definition of Done lands; over, and it leaves the list by the owner's answer to Q3, never by a cut** | 32,293 B (475 B left) |
| E4 | `typescript/doctrine.md` ≤ 5,900 B after the moves | `inspect ui/a.ts` and `inspect src/a.mjs` ≤ 30,116 B (E4's done-when) | 30,116 B and 24,207 B |
| E4 | the same file ≤ **5,088 B** if `gpu src/a.mjs` is to stay in the list (27,680 + 5,088 = 32,768) | `gpu src/a.mjs` | 27,680 B — over 5,088 B the scope leaves the list by Q3, with its number |
| E4–E6 | the always core grows by ≤ 300 B in total over the plan (the P7 pointer in E4, P15 in E5, P14 in E6) | every scope; the core ≤ 16,384 B | 15,055 B → ≤ 15,355 B |
| E5, E6 | gated rules: no single-read cap — each is measured and recorded; `typescript/utc-timestamps.md` ≤ 1,200 B | `storage ui/a.ts` improves rather than worsens | 35,315 B (over, unpinned) |

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 5.1 | the matrix's `oneRead: true` entries | each is selected on the real catalog | each is ≤ 32,768 B; the message names the scope and its bytes |
| 5.2 | the matrix | its single-read-task entries are read | every entry has a boolean `oneRead`; every single-read-task entry with `oneRead: false` has a `why` of at least 10 characters; no split-read-task entry has `oneRead: true` |
| 5.3 | the matrix | the floor is read | the eight scopes of F5 that D5 keeps (`inspect` ×{none, `src/x.cs`, `src/x.csproj`, `ui/a.ts`}, `ui` none, `gpu` ×{none, `src/x.cs`}, `storage` none) are `oneRead: true` — the list cannot shrink in silence below what was pinned before |
| 5.4 | the matrix | D5 is read | no `ui` entry whose files include a `.cs`, `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs` or `.cjs` file is `oneRead: true` |
| 5.5 | an inline copy of the matrix where `inspect package.json` is flipped to `oneRead: true` | the 5.1 check (as a function) runs | one finding: `inspect package.json selects 35409 B, over the 32768 B read` |

### Files

- `research/selection-matrix.json` — `oneRead` (and `why`) on every entry.
- `tools/rules.test.mjs` — the test at `:250-257` reads the matrix (5.1, 5.5); its name stays.
- `tools/selection-matrix.test.mjs` — 5.2–5.4.
- `research/module_rules.md` — the single-read list (a pointer) and the allowances table.

### Acceptance criteria

- 5.1–5.5 pass; the 23 `oneRead: true` scopes are exactly the table above; every `why` is exactly as above.
- `research/module_rules.md` carries the allowances table above, with the parent's § 5 as its source and the Q3 sentence
  on `gpu`.

### RED → GREEN → RED

1. **RED.** Change the single-read test to read `oneRead` from the matrix and add 5.2–5.4 before touching the data:
   5.1 runs over zero scopes, so it must fail — the test asserts at least the floor of 5.3 is present
   (`no oneRead scopes in research/selection-matrix.json — the single-read pin has nothing to check`); 5.2 and 5.3 fail
   naming the missing fields. Record the lines.
2. **GREEN.** Add the fields; all pass.
3. **RED again.** Flip `inspect package.json` to `true` in the file → 5.1 fails with its bytes; restore. Delete one `why`
   → 5.2 fails naming the scope; restore. Flip `ui ui/a.ts` to `true` → 5.4 fails (and 5.1 passes, 32,329 B — the reason
   it is D5 and not the budget that removes it); restore.

### Docs to update

`research/module_rules.md` (two sections, below); `research/module_tests.md` (the changed test and the three new cases).

### The brief (for the Sonnet coder)

**1. The data.** In `research/selection-matrix.json` add `"oneRead": true|false` to every entry (after `files`), and
`"why": "<text>"` after it on every single-read-task entry with `false`, with the values of the two tables above. Keep the
two-line-per-entry shape S2 wrote (the `ids` line last). Edit by a short one-off script or by hand; read the diff: 108
`oneRead` fields, 25 `why` fields (`ui src/x.cs`, `ui ui/a.ts`, `ui src/webview/page.ts`, `ui src/a.mjs`,
`storage src/a.mjs`, and the twenty over-today scopes; `ui src/x.csproj` takes the over-today text with `(also D5)`
appended).

**2. `tools/rules.test.mjs:250-257`.** Keep the test name `every single-read scope of the four excluded tasks still fits
one read`. Replace its body: read `research/selection-matrix.json` (`sourceRoot`), take the entries with
`oneRead === true`, assert there is at least one (message above), and assert `oneReadFindings(catalog, scopes)` is `[]`,
where `oneReadFindings` returns `` `${scope.name} selects ${bytes} B, over the 32768 B read` `` for each over-budget
scope. Add a second test `an over-budget scope marked oneRead is named with its bytes` for 5.5 over an inline copy of the
`inspect package.json` entry. Leave a comment above the test: the list is D5's, in the matrix file, and a scope leaves it
only with a `why` (D1: never by a cut).

**3. `tools/selection-matrix.test.mjs`.** Add 5.2, 5.3 (the floor written out as eight names — the one place a literal
list is right, because it is the record of what was pinned before E1) and 5.4 (derive "a language file" from the
extensions listed in 5.4).

**4. `research/module_rules.md`.** After the matrix section of S2, add:

> ### The single-read list (D5)
>
> The scopes that must fit one read are the `oneRead: true` entries of `research/selection-matrix.json` (23 at
> 2026-10-31); `tools/rules.test.mjs` fails when one passes 32,768 B. Every single-read-task scope outside the list says
> why in its `why` field. `ui` with a language file is out by D5; `gpu src/x.cs` and `gpu src/a.mjs` are in the list with
> the narrowest headroom, and either leaves it only by the owner's answer to Q3, with its measured number — never by a
> deletion (D1).

and the section `### Byte allowances per later epic (the plan's § 5)` holding the allowances table above verbatim, with
the sentence: *Each epic measures its files and scopes before its pull request and writes the numbers into the matrix
section; an allowance it cannot keep goes to the owner as an open question with the numbers.*

**Commands.** `node --test tools/rules.test.mjs tools/selection-matrix.test.mjs`, then the six at the top.

---

## E1.S3 — The parity inventory and the parity matrix, one-to-one, every present row naming a real rule and section

- **Size.** L — two data files of 30 entries each, a test of about 250 lines with a validator and its fixtures.
- **Models.** Brief: Opus (below — the data is decided here, row by row). Data and test: a Sonnet coder. Review: Opus.
- **Goal.** Parent § 4.1, D12 and plan round 1's finding 4: `research/parity-inventory.json` lists every requirement of
  § 3 (P1–P20, R1–R5) and every gap on both sides (G1–G5) with a status; `research/parity-matrix.json` holds one row per
  inventory entry with both sides' location; a test proves the two are one-to-one and that every location that exists is
  a real rule id and a recorded section. Counterparts not yet written are `planned` with the epic that writes them.

### The schema

`research/parity-inventory.json`: `{ "note": "…", "entries": [ … ] }`, each entry
`{ "id": "P1", "topic": "…", "side": "csharp|typescript|both", "status": "counterpart|deliberately-absent|planned", "epic": "E4", "reason": "…" }`
— `epic` present exactly when some side of its matrix row is `planned`; `reason` present exactly when `status` is
`deliberately-absent`.

`research/parity-matrix.json`: `{ "note": "…", "rows": [ … ] }`, each row
`{ "inventory": "P1", "topic": "…", "csharp": <side>, "typescript": <side>, "strength": "…", "suppression": "…", "status": "equal|stronger-ts|stronger-cs|deliberately-absent" }`.
A `<side>` is exactly one of three shapes:

- **present** `{ "id": "<rule id>", "section": "<heading line>" }` — the text that meets the requirement exists today;
- **planned** `{ "planned": "E3", "id": "<rule id>", "section": "<heading line>" }` — `section` optional (the intended
  heading, unchecked);
- **absent** `{ "absent": "<reason>" }` — deliberately absent on that side.

### The rules the test enforces (`parityFindings`)

1. Inventory ids match `^[PRG][1-9][0-9]*$` and are unique; `topic` non-empty; `side` and `status` from their sets.
2. Matrix rows: `inventory` unique; **every inventory id has exactly one row and every row names an inventory id** (an
   orphan either way is a finding naming it); the row's `topic` equals its entry's.
3. A present side: `id` is in the catalog; `section` is one of that id's `sections` in `research/rule-bodies.json`,
   string-equal (F6).
4. A planned side: `planned` is one of `E2`…`E7`; `id` matches `^(common|csharp|rust|typescript)\.[a-z0-9-]+$`; a
   `section`, when given, starts with `#`.
5. An absent side: `absent` at least 20 characters. A side with any other key set is a finding.
6. `status` is `deliberately-absent` exactly when at least one side is absent; `strength` and `suppression` non-empty.
7. The entry's status agrees with the row: `counterpart` ⇔ both sides present; `deliberately-absent` ⇔ the row is;
   `planned` ⇔ at least one side planned and none absent. When any side is planned, the entry's `epic` is the latest
   planned epic of the row (E2 < E3 < … < E7); otherwise there is no `epic`. `reason` exactly when deliberately absent.

Messages: `` `<file>: <id>: <what>` `` with `<file>` `parity-inventory.json` or `parity-matrix.json`.

### The data (decided here; copy exactly)

Sections are copied from `research/rule-bodies.json`; the strings below were read there at `d986710`. Abbreviations in
this table only: CD = `csharp.doctrine`; TD = `typescript.doctrine`. In the JSON every id is written out.

| Inv. | side | topic | C# side | TypeScript side | status | epic |
|---|---|---|---|---|---|---|
| P1 | csharp | runtime and compiler version statement | present CD `## 1. Language & runtime` | planned E4 TD `## 0. Language, runtime and design` | equal | E4 |
| P2 | csharp | warnings fail the build | present CD `## 1. Language & runtime` | planned E3 `typescript.compiler-strictness` | stronger-ts | E3 |
| P3 | both | nullability is checked by the compiler | planned E3 CD `## 1. Language & runtime` | planned E3 `typescript.compiler-strictness` | equal | E3 |
| P4 | csharp | complexity and function size bounds | present CD `## 6. Pure functions, small methods` | planned E3 `typescript.compiler-strictness` | stronger-ts | E3 |
| P5 | csharp | data contracts, typed values, absence as a state | present CD `## 2. Records for data, classes for services` | planned E4 TD `## 0. Language, runtime and design` | equal | E4 |
| P6 | csharp | untrusted JSON is validated; identifiers above 2^53 keep their precision | present CD `### 4a. A DTO field the client omitted is NULL, whatever its initializer says (MANDATORY)` | planned E4 TD `## 0. Language, runtime and design` | equal | E4 |
| P7 | csharp | expected failures are values | present CD `## 5. Expected failures are values, not exceptions` | planned E4 TD `## 0. Language, runtime and design` | equal | E4 |
| P8 | csharp | the build worker pool is bounded | present `csharp.dotnet-build` ``# `dotnet build` — bound the worker pool, because several sessions build at once`` | absent (reason P8 below) | deliberately-absent | — |
| P9 | csharp | package approval, freshness, licence, pins | present `csharp.nuget-packages` `## Before adding any package` | planned E2 `typescript.npm-packages` | equal | E2 |
| P10 | csharp | the test runner and its exit code | present `common.testing` ``## Running tests — executables only, never `dotnet test` (MANDATORY)`` | planned E6 `typescript.testing` | equal | E6 |
| P11 | csharp | layer rules are a test | present `common.testing` `## Architecture is a test, not a review comment` | planned E6 `typescript.testing` | equal | E6 |
| P12 | csharp | the logging library and its shape | present `common.logging-serilog` `## The shape (C#)` | planned E6 `typescript.logging` | equal | E6 |
| P13 | csharp | cancellation, timeouts and shutdown | present `common.reliability` `### A timeout is not a cancellation — and .NET spells them the same` | planned E5 `typescript.lifecycle` | equal | E5 |
| P14 | csharp | secrets outside the source | present `common.security` `## Secret management` | planned E6 `common.security` `## Secret management` | equal | E6 |
| P15 | csharp | a timed-out child takes its tree with it | present `common.security` `## External processes` | planned E5 `typescript.lifecycle` | equal | E5 |
| P16 | csharp | instants are UTC; a calendar day is stamped | present `common.utc-timestamps` `## The rule` | planned E6 `typescript.utc-timestamps` | equal | E6 |
| P17 | csharp | limits counted in encoded bytes | present `common.platform-limits` `## 1. A platform limit is the KERNEL's number, in the KERNEL's unit — and one adapter owns it` | planned E6 `common.platform-limits` (same section) | equal | E6 |
| P18 | csharp | HTTP route groups and route coverage | present `common.http-contracts` `## Where the files live` | planned E6 `common.http-contracts` `## Where the files live` | equal | E6 |
| P19 | csharp | the published package registry is checked after a release | present `common.post-deploy-checks` `## What "prod" is, per repository — and nobody is exempt` | planned E6 `common.post-deploy-checks` (same section) | equal | E6 |
| P20 | csharp | which files select the language rules | present CD `# C# doctrine — the family's code rules` | planned E4 TD (no section) | equal | E4 |
| R1 | typescript | data serialised into a script element | planned E6 `csharp.output-encoding` | present TD ``## 1. Never interpolate into a `<script>` element with `JSON.stringify` (MANDATORY)`` | equal | E6 |
| R2 | typescript | a fixture cast hides a shape | planned E6 `csharp.testing` | present TD ``## 3. An `as` cast is a promise to maintain a shape by hand — and it comes due silently`` | equal | E6 |
| R3 | typescript | a Definition of Done | planned E4 CD `## Definition of Done` | present TD `## Definition of Done` | equal | E4 |
| R4 | typescript | the compiler emits despite errors | absent (reason R4) | present TD ``## 4. `tsc` emits despite errors — so a green suite can be green against stale output`` | deliberately-absent | — |
| R5 | typescript | a backtick ends a template literal | absent (reason R5) | present TD `## 2. A backtick inside a template literal ends it — including inside a comment` | deliberately-absent | — |
| G1 | both | an analyzer or lint requirement | present CD `## 1. Language & runtime` | planned E3 `typescript.compiler-strictness` | equal | E3 |
| G2 | both | a lock file and a locked restore | present `csharp.nuget-packages` `# NuGet packages — approval, freshness, licence` | planned E2 `typescript.npm-packages` | stronger-ts | E2 |
| G3 | both | a vulnerability scan on the monthly bump | planned E2 `common.dependencies` | planned E2 `common.dependencies` | equal | E2 |
| G4 | both | coverage thresholds | absent (reason G4) | absent (reason G4) | deliberately-absent | — |
| G5 | both | CI steps per language | absent (reason G5) | absent (reason G5) | deliberately-absent | — |

Planned sides with "(same section)" carry the same `section` as their C# side. Inventory `status`: `planned` for every
row with an epic, `deliberately-absent` for P8, R4, R5, G4, G5; no row is `counterpart` at E1.

Reasons (the inventory's `reason` and the absent side's `absent`, the same text):

- **P8** (TypeScript side): `no Node counterpart: the rule exists for a measured MSBuild worker-pool problem Node builds do not have; a hook is added for a measurement, not for symmetry, and Node's enforced rule is P2's check (plan section 3.1 P8, section 4.6)`
- **R4** (C# side): `no C# counterpart needed: the C# compiler emits nothing on an error; the TypeScript rule states it as a difference, not a gap (plan section 3.2 R4)`
- **R5** (C# side): `no comparable C# trap: a raw string literal cannot be ended by a shorter run of quotes (plan section 3.2 R5)`
- **G4** (both sides): `deliberately absent on both sides: the testing rule governs what a test may claim, and a coverage number is gamed the week it lands (plan section 3.3; the owner confirms in Q10)`
- **G5** (both sides): `deliberately absent as shared rules: each repository's own instructions and CI name the exact commands, and a shared list would be an inventory (plan section 3.3)`

`strength` (from the parent's § 3 Strength column): P1 `prose, selected on every language file`; P2 `C#: prose (MSBuild
fails the build once the property is set); TypeScript: file + CI check (tools/node-strictness-check.mjs)`; P3 `raised on
both: Nullable enable and strictNullChecks inside strict`; P4 `C#: prose; TypeScript: lint-enforced (complexity 4,
max-lines-per-function 50, max-lines 800, no-console)`; P5, P7, P11 `prose and prose`; P6 `prose and prose; both name the
exact and the lossy readers`; P8 `C#: hook + check for a measured resource problem; Node: none, its enforced rule is P2's
check`; P9 `prose and prose, each selected by its own manifest; the shared part on --task dependencies only`; P10 `prose
and prose; gated on the testing rule's tasks`; P12 `prose and prose; gated on the logging rule's tasks`; P13 `prose and
prose; gated on the reliability rule's tasks`; P14 `always core, equal`; P15 `always core, equal; the asymmetry stated
(Node has no tree kill)`; P16 `prose and prose; gated on the timestamp rule's tasks`; P17 `one clause in the same
sentence`; P18 `rows and rows; the route table through --routes on both`; P19 `one word in the same list`; P20 `selector
and selector`; R1 `MANDATORY and MANDATORY; gated on implement, test, audit, ui, http`; R2 `prose and prose; typed-fixture
discipline side by side`; R3 `a Definition of Done box and a box`; R4, R5 `TypeScript: prose; C#: none needed`; G1 `C#:
the compiler at TreatWarningsAsErrors with Nullable enable; TypeScript: lint at zero warnings; both fail the build`; G2
`TypeScript: a lock and npm ci fix transitives; C#: central exact pins of direct packages; the asymmetry stated, Q1
open`; G3 `the same sentence for every ecosystem`; G4, G5 `none on either side`.

`suppression`: P2, P4, G1 `plan section 3.4: C# inline #pragma warning disable <id> with the reason, never NoWarn,
WarningsNotAsErrors or GlobalSuppressions.cs; TypeScript inline eslint-disable-next-line <rule> -- <reason>,
reportUnusedDisableDirectives error, no production folder ignored; no baseline on either side`; every other row
`none: a prose rule has nothing to suppress`.

`note` of each file: one sentence saying it is the machine-readable form of the plan's § 3 (`todo/PLAN_node_rule_parity.md`,
as plain text), that `tools/parity-matrix.test.mjs` keeps the two files one-to-one and every present location real, and
that a later epic changes a side from `planned` to `present` in the commit that writes its text.

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 3.1 | the two real files, the real catalog, `research/rule-bodies.json` | `parityFindings` | `[]` |
| 3.2 | a minimal fixture: one entry `P1` (`counterpart`) and one row with both sides present against a fake catalog `{a.x: ["# A","## One"]}` | `parityFindings` | `[]` — the positive case every negative below is a mutation of |
| 3.3 | the fixture plus an inventory entry `P2` with no row | | one finding naming `P2` as having no matrix row |
| 3.4 | the fixture plus a row `P9` with no entry | | one finding naming row `P9` as having no inventory entry |
| 3.5 | two rows for `P1` | | a finding naming the duplicate |
| 3.6 | a present side naming `a.missing` | | a finding: the id is not in the catalog |
| 3.7 | a present side naming `## Two` | | a finding: the section is not among `a.x`'s recorded sections |
| 3.8 | a planned side with `planned: "E9"` | | a finding naming the epic |
| 3.9 | an absent side of 5 characters | | a finding: the reason is too short |
| 3.10 | a side with both `id` and `absent` | | a finding: not one of the three shapes |
| 3.11 | an absent side under `status: "equal"` | | a finding: an absent side needs `deliberately-absent` |
| 3.12 | `status: "deliberately-absent"` with both sides present | | a finding: no side is absent |
| 3.13 | the entry `counterpart` while a side is planned | | a finding naming the expected status `planned` |
| 3.14 | planned sides E3 and E5, the entry's `epic` `E3` | | a finding: the epic must be `E5` |
| 3.15 | the row's `topic` differing from the entry's | | a finding |
| 3.16 | the REAL files with one present section retitled in memory (`"## 1. Language & runtime"` → `"## 1. Language and runtime"`) | | findings naming P1, P2 and G1 — the drift protection on the real data |

### Files

`research/parity-inventory.json`, `research/parity-matrix.json`, `tools/parity-matrix.test.mjs` (all new);
`research/module_rules.md`, `research/module_tests.md`.

### Acceptance criteria

- 3.1–3.16 pass; 30 entries and 30 rows; the data equals the tables above.
- The parent's E1 done-when, observed: the real-data test was red when a row named a missing id and when it named a
  missing section, then fixed (RED-again below).

### RED → GREEN → RED

1. **RED.** Write the test first. 3.1 fails with the test's own message `research/parity-inventory.json is missing`
   (not a stack); 3.2–3.15 pass or fail on their fixtures alone — they need `parityFindings`, written in the same file, so
   write it with the test and expect them green; 3.16 fails on the missing files.
2. **GREEN.** Write the two files from the tables; all pass.
3. **RED again, on the real files** (the parent's "observed, then fixed"): change P10's C# `id` to `common.testng` →
   3.1 fails naming it; restore. Retitle P13's section by one character → 3.1 fails naming it; restore. Delete the G3 row
   → 3.1 fails naming G3 as having no row; restore. Report the three messages.

### Docs to update

- `research/module_rules.md` — a section *The parity matrix* (text in the brief).
- `research/module_tests.md` — the new test file and what it does not prove.

### The brief (for the Sonnet coder)

**1. The two files**, from the tables above, `JSON.stringify(…, null, 2)` shape with a trailing newline, entries and rows in
the order P1…P20, R1…R5, G1…G5. Write every id out (`csharp.doctrine`, never `CD`). For the sections, copy the strings
from `research/rule-bodies.json` rather than from this document if any differs, and report the difference.

**2. `tools/parity-matrix.test.mjs`.** `node:test`, `node:assert/strict`, `loadCatalog` from `./lib/rule-catalog.mjs`.
Write `parityFindings({ inventory, matrix, catalogIds, sectionsById })` — `inventory` and `matrix` the parsed files,
`catalogIds` a `Set` of ids, `sectionsById` a `Map` id → array of section strings — as a plain function in the test file
returning an array of strings, implementing rules 1–7 above one check at a time (small helpers: `sideShape(side)` →
`"present"|"planned"|"absent"|null`; `epicNumber("E5")` → 5). The real-data test builds `catalogIds` from
`loadCatalog(sourceRoot)` and `sectionsById` from `research/rule-bodies.json`'s `rules`, and asserts
`assert.deepEqual(findings, [])`. The fixture tests (3.2–3.15) each build the minimal fixture with a small factory and
change one thing (`structuredClone`, never mutating a shared object). 3.16 reads the real files and retitles in a clone.
Name the tests for the guarantee (`every inventory requirement has exactly one matrix row and every row one requirement`,
`a present side names a rule in the catalog and one of its recorded sections`, …).

**3. `research/module_rules.md`** — after the allowances section of S5:

> ## The parity matrix (todo/PLAN_node_rule_parity.md § 3, D12)
>
> `research/parity-inventory.json` lists every requirement of the plan's § 3 — P1–P20 (C# → Node), R1–R5 (TypeScript →
> C#) and G1–G5 (gaps on both sides) — with its status: `counterpart`, `deliberately-absent` with the reason, or `planned`
> with the epic that closes it. `research/parity-matrix.json` holds one row per requirement: each side `present` (a rule
> id and one of its recorded section headings), `planned` (the epic and the intended rule), or `absent` (the reason).
> `tools/parity-matrix.test.mjs` fails when the two files are not one-to-one, when a present side names a rule or a
> section that does not exist (`research/rule-bodies.json`), or when a status disagrees with its sides — so a rule
> renamed or a section retitled without the matrix is a red suite. The deliberately-absent requirements and their reasons
> are the inventory's `deliberately-absent` entries; this document does not keep a second copy. What it does not prove:
> that the text at a present location meets the requirement with equal strength — that is the code review's, against the
> plan's § 2 definition.

**Commands.** `node --test tools/parity-matrix.test.mjs`, then the six at the top. Report the RED and RED-again messages.

---

## E1.S4 — The moved-block harness: a moved block is byte-equal to the source lines at the commit right before the move

- **Size.** L — a library of about 200 lines, a self-test of about 300 lines building real git repositories, a CI line,
  one documented record.
- **Models.** Brief: Opus (below). Code and tests: a Sonnet coder. Review: Opus.
- **Goal.** D1 and parent § 4.3: a block moved from a common rule to a language rule is checkable as "word for word". For
  each block recorded in `research/module_rules.md` § *Moves*, the destination file holds the source file's line range,
  as it stood at the commit right before the move, byte for byte, once, at a line boundary — so an anonymisation commit
  before the move is the "before", and a move folded into a wording change is red. E1 ships the harness and its
  self-test; the later epics add the rows.

### Design, given F7

A row records the block's **byte length and SHA-256** besides the source, line range, "before" commit and destination.

- **Always** (every clone, shallow or squashed): the destination file in the working tree, CRLF folded, holds exactly
  one line-aligned run of that length with that hash.
- **When the "before" commit is in the clone** (a developer's worktree; the pull request's CI run once the checkout
  fetches the history — see the CI change below): the recorded hash is recomputed from `git show <before>:<source>`
  lines a–b and must match; the destination at `<before>` must not hold the block yet; the first commit after `<before>`
  on the ancestry path to HEAD must hold it in the destination (so `<before>` is the commit RIGHT before the move); and
  the source at that commit must no longer hold it (a move, not a copy).
- **When it is not** (a shallow checkout, or `main` after the squash merge removed the branch commits): the source-side
  checks are not run and the test says so in a diagnostic line naming the commit. The destination check still runs.
  What the main-branch run proves is therefore "the destination still holds the bytes the pull request verified" — said
  in `research/module_tests.md`.

The block of lines a–b of a text is `lines.slice(a-1, b).join("\n") + "\n"` after folding CRLF, with `lines` the text
split on `"\n"`; `b` past the last line is an error. Line-aligned: the run starts at byte 0 or right after a `"\n"`.

### Scenarios

All repositories are built in `ownedDir(t, …)` with `gitWith({timeoutMs: GUARD_MS})` (as `tools/rules.test.mjs:15`), a
fixed identity (`-c user.name=… -c user.email=…@example.invalid -c commit.gpgsign=false`), and these files: `src.md`
with six lines, line 3 carrying `é` (a two-byte character) and line 4 indented by two spaces, so the moved lines 2–4 hold both; `dest.md` holding a
front-matter block only. History H: **A** (both files) → **B** (line 3 of `src.md` reworded, its `é` kept — the anonymisation) →
**C** (lines 2–4 of `src.md` cut and appended to `dest.md`) → **D** (an unrelated file added). A row is built with
`recordFor(repo, {before, source:"src.md", from:2, to:4})`.

| # | Given | When | Then |
|---|---|---|---|
| 4.1 | H, row with `before` = B | `verifyMove(repo, row)` | no findings, no notes |
| 4.2 | H, row with `before` = A (recorded from A) | | findings, among them: the destination does not hold the block — "a move measured against the commit before the wording change is red" |
| 4.3 | H, a row with B's `bytes` and `sha256` but `before` = C (the move commit itself) | | findings: lines 2–4 of `src.md` at C are not the recorded block (C's `src.md` has three lines), and the destination already held the block at C |
| 4.4 | history A → B → X (unrelated) → C; `before` = B | | a finding: the commit right after `before` (X) does not hold the block — `before` is not the commit right before the move |
| 4.5 | history where C changes `é` to `e` in the moved lines | | a finding: the destination does not hold the block byte for byte |
| 4.6 | history where C appends the lines to `dest.md` but does not cut them from `src.md` | | a finding: the source still holds the block after the move — a copy, not a move |
| 4.7 | the working-tree `dest.md` holds the block twice | | a finding: the destination holds it 2 times |
| 4.8 | the working-tree `dest.md` holds the block starting mid-line (`x` + block) | | a finding: no line-aligned run (0 times) |
| 4.9 | the working-tree `dest.md` rewritten with CRLF line ends, same text | | no findings — folding |
| 4.10 | H, a row whose `before` is a well-formed sha absent from the clone (`"0".repeat(40)`), with B's correct `bytes` and `sha256` | | no findings and one note naming the commit as not in this clone |
| 4.11 | the same with a wrong `sha256` | | a finding (the destination check runs without history) and the note |
| 4.12 | H, a row with `before` = B but `bytes`/`sha256` taken from the destination's first three lines | | a finding: the recorded hash is not lines 2–4 of `src.md` at B |
| 4.13 | a `## Moves` section with the exact header and two well-formed rows | `parseMoves(markdown)` | `found: true`, two rows with numbers parsed, no errors |
| 4.14 | no `## Moves` heading | `parseMoves` | `found: false` |
| 4.15 | a changed header (a column renamed) | `parseMoves` | `found: true` and an error naming the header |
| 4.16 | rows with `4-2`, a 7-character sha, `bytes` `12a`, a duplicate block id, a path with `..` | `parseMoves` | one error per row, each naming its line |
| 4.17 | the real `research/module_rules.md` | `parseMoves` | `found: true`, no errors (zero rows at E1 — a diagnostic says so); every row (later) verifies with no findings |

### Files

- `tools/lib/moved-blocks.mjs` (new), `tools/moved-blocks.test.mjs` (new).
- `research/module_rules.md` — the `## Moves` section with its empty table.
- `.github/workflows/ci.yml` — `fetch-depth: 0` on the `tools · selftest` checkout, with the reason.
- `research/module_tests.md`.

### Acceptance criteria

- 4.1–4.17 pass; the test leaves no folder behind (`ownedDir` cleanup) and makes no git call without the guard timeout.
- The real record parses with zero rows and the test prints the diagnostic.
- The CI checkout carries `fetch-depth: 0` with a comment naming this test as its reason.

### RED → GREEN → RED

1. **RED.** Write `tools/moved-blocks.test.mjs` first; it fails at import (`Cannot find module …/lib/moved-blocks.mjs`)
   — the harness does not exist. Record the line.
2. **GREEN.** Write the library; all pass; the whole suite.
3. **RED again** (edit, watch, restore): (a) drop the line-alignment condition → 4.8 fails; (b) skip the "first commit
   after `before`" check → 4.4 fails; (c) skip the source-at-child check → 4.6 fails; (d) skip the recomputation of the
   recorded hash → 4.12 fails; (e) drop the CRLF fold on the working-tree read → 4.9 fails. Report each.

### Docs to update

- `research/module_rules.md` — `## Moves` (text and empty table in the brief).
- `research/module_tests.md` — the new test, what each case pins, and **what it does not prove**: on a clone without the
  `before` commit only the destination is checked against the recorded hash; that the moved text still reads correctly
  in its new place (a caveat that pointed at a neighbouring section) is the review's.

### The brief (for the Sonnet coder)

**1. `tools/lib/moved-blocks.mjs`** — ESM, imports only `node:fs`, `node:path`, `node:crypto`, `folded` from
`./rule-body.mjs` and `gitOutput` from `./git.mjs`. Exports:

```js
export const MOVES_HEADING = "## Moves";
export const MOVES_HEADER = "| Block | Source | Lines | Before | Destination | Bytes | SHA-256 |";

/** Lines from..to (1-based, inclusive) of a text, CRLF folded, each ending in "\n". Throws past the last line. */
export function blockOf(text, from, to) { … }

/** How many line-aligned runs of `bytes` bytes in `text` (CRLF folded) hash to `sha256`. */
export function lineAlignedMatches(text, { bytes, sha256 }) { … }   // Buffer over the folded text; candidate starts are
                                                                    // byte 0 and every byte after a 0x0a; a candidate counts
                                                                    // when it is exactly `bytes` long, ends in 0x0a and hashes equal

/** { bytes, sha256 } of lines from..to of `source` as committed at `before`. */
export function recordFor(repo, { before, source, from, to }, { timeoutMs } = {}) { … }

/** { found, rows, errors } from the `## Moves` section of a markdown text (fenced blocks ignored). */
export function parseMoves(markdown) { … }

/** { findings, notes } for one row against the repository at `repo` (working tree for HEAD's destination). */
export function verifyMove(repo, row, { timeoutMs } = {}) { … }
```

`parseMoves`: find the line equal to `MOVES_HEADING` (run `outsideFencedBlocks` from `./rule-body.mjs` over the text
first, so a fenced example never counts and line numbers stay the file's); the section runs to the next line starting
with `#`. Its first line starting with `|` must equal `MOVES_HEADER` (else `found: true` with an error naming the
header; no such line at all is the same error), the next line must be a separator of `|---|` cells, then rows until the
first line that does not start with `|`. A row has seven cells, trimmed, backticks removed from Source and Destination: `block` `^[a-z0-9][a-z0-9-]*$`
unique; `source`, `destination` relative paths with no `..` segment, no leading `/`, no backslash; `lines` `^(\d+)-(\d+)$`
with 1 ≤ from ≤ to; `before` `^[0-9a-f]{40}$` (a full sha — a short one can become ambiguous); `bytes` `^\d+$` and > 0;
`sha256` `^[0-9a-f]{64}$`. Each error names the 1-based line of the markdown file. Thousands separators are not allowed
in `bytes` (digits only).

`verifyMove`, in this order, collecting every finding rather than stopping at the first:

1. Read `path.join(repo, row.destination)` from the working tree (missing → finding), `lineAlignedMatches` → 0:
   `destination does not hold the block byte for byte`; >1: `destination holds the block <n> times`.
2. `git cat-file -e <before>^{commit}` (through `gitOutput`, catching the throw): absent → push a note
   `` `before ${row.before} is not in this clone (a shallow checkout, or a squash-merged branch): the source side rests on the recorded hash` ``
   and return.
3. `git merge-base --is-ancestor <before> HEAD` (a throw is "not an ancestor") → finding.
4. `recordFor` at `before` (a throw — the file or the lines absent — is a finding); a different `bytes`/`sha256` →
   `the recorded hash is not lines <a>-<b> of <source> at <before>`.
5. `git show <before>:<destination>` (absent is fine) — any line-aligned match → `destination already held the block at <before>`.
6. `child` = the first line of `git rev-list --ancestry-path --reverse <before>..HEAD` (none → finding
   `no commit follows <before>`); `git show <child>:<destination>` must hold exactly one match, else
   `the commit right after <before> (<child>) does not hold the block: <before> is not the commit right before the move`;
   `git show <child>:<source>` (absent is fine) holding a match → `the source still holds the block after the move — a copy, not a move`.

Every message is prefixed with `` `${row.block}: ` ``. All git calls pass `{ timeoutMs }` (the test passes `GUARD_MS`).
No `try/catch` other than around the git calls whose failure is an answer (2, 3, 5, the absent-file cases of 4 and 6).

**2. `tools/moved-blocks.test.mjs`.** Build the histories with one helper `history(t, steps)` that makes an
`ownedDir(t, "moved blocks")`, inits a repository, and commits each step's file contents, returning the shas by step
name. Write the fixture texts once at the top (six lines, `é`, two-space indent). Name tests for the guarantee
(`a verbatim move measured against the commit right before it holds`, `a move measured against a commit before the
wording change is red`, `a commit between before and the move is red`, `a copy left in the source is red`, `a clone
without the before commit still checks the destination against the recorded hash`, …). For 4.17 read
`research/module_rules.md` from `sourceRoot`, assert `found` and no errors, `t.diagnostic` the row count, and for each
row assert `verifyMove(sourceRoot, row, {timeoutMs: GUARD_MS}).findings` is `[]`, passing every note to `t.diagnostic`.

**3. `research/module_rules.md`** — a section before `References:`, the heading exactly `## Moves`:

> ## Moves
>
> Every block the plan `todo/PLAN_node_rule_parity.md` moves out of a rule is one row here, written in the commit that
> moves it (D1: the text moves word for word). `tools/moved-blocks.test.mjs` checks each row: the destination holds the
> block — lines `a-b` of the source as committed at `Before`, CRLF folded — exactly once at a line boundary, by its
> recorded `Bytes` and `SHA-256`; and, when `Before` is in the clone, that the hash is those source lines, that the
> destination did not hold them at `Before`, that the very next commit towards HEAD did (so `Before` is the commit right
> before the move), and that the source no longer did (a move, not a copy). `Before` is the parent of the move commit:
> where a block also needs a wording change, that change is its own commit in the source first, and that commit is
> `Before`. A shallow clone, or `main` after a squash merge, does not hold `Before`; the test then checks the
> destination against the recorded hash alone and says so. Record a row with:
>
> ```bash
> node --input-type=module -e 'import {recordFor} from "./tools/lib/moved-blocks.mjs";const [before,source,from,to]=process.argv.slice(1);console.log(recordFor(".",{before,source,from:+from,to:+to}))' <before> <source> <from> <to>
> ```
>
> | Block | Source | Lines | Before | Destination | Bytes | SHA-256 |
> |---|---|---|---|---|---|---|

(The table has a header and a separator and no rows at E1. Keep a blank line after it.)

**4. `.github/workflows/ci.yml`** — on the `actions/checkout` step of the `tools · selftest` job add
`fetch-depth: 0` under `with:` (keep `persist-credentials: false`), and a comment above it:
`# Full history: tools/moved-blocks.test.mjs recomputes each moved block from the commit right before its move, which a
depth-1 checkout does not hold. On a pull request that commit is on the branch; after the squash merge only the recorded
hash is checked (research/module_rules.md § Moves).` Change nothing else in the file.

**Commands.** `node --test tools/moved-blocks.test.mjs`, then the six at the top. Report the RED line and the five
RED-again observations.

---

## Warnings for every coder of this epic

- **No rule file changes in E1.** If a step seems to need one, stop and report; `research/rule-bodies.json` must stay
  as it is (`node tools/rule-bodies.mjs` prints OK with 39 rules).
- **Temporary folders only through `ownedDir`** (`tools/lib/owned.mjs`); the structural guard run by `npm test`
  (`tools/leftovers-check.mjs`) refuses `mkdtemp`, `os.tmpdir()` and a bare `git worktree add` in a test.
- **Keep `normalized.filter(file=>match(file))` byte for byte** in `rule-catalog.mjs` (F4).
- **Do not name a product or a repository** in the data files' `note`, `topic` or reason strings; cite the plan as a
  path in plain text.
- **Stage by path**, read `git diff --staged --stat` against what the story meant to change, one commit per story, the
  message `<type>(rules): …` or `test(rules): …` with the observed numbers in the body and the trailer the session
  names.
- **Report both observations** of every RED step (the failure line and the pass), and the runner's totals.

## Judge's notes — decisions taken here within the parent, and points the parent leaves unclear

Decisions this document takes to make a parent sentence executable (each is the coordinator's to confirm before the plan
round; if one is judged a change, it is the parent's entry 1.1 and the second would stop the plan):

1. **The moves record carries a hash, and CI fetches the full history (S4)** — F7: squash merges and a depth-1
   checkout make "the source at the commit right before the move" unreadable on `main`; the parent (§ 4.3, E1.S4) does
   not say how the test reads it. The record stays where the parent puts it (`research/module_rules.md` § *Moves*).
2. **The selection pins live in `research/selection-matrix.json` (S2)** — 108 scopes and 1,509 ids do not fit "in the
   style of `:176-200`" inline; the parent names the test, not its data's place. Its growth is in § *Growth* above.
3. **Five both-sides gaps, not six (S3)** — the parent's § 3.3 table has six rows, but its last ("A runtime version
   statement — Raise TS (P1, D7) — C# has one", `todo/PLAN_node_rule_parity.md:174`) is not a gap on both sides (the
   parent's own list of both-sides gaps at `:83-84` names five) and is P1; a sixth entry would be a second row for P1.
4. **D5 read as written: `ui` with ANY language file leaves the list (S5)** — `todo/PLAN_node_rule_parity.md:43` names
   `tools/rules.test.mjs:252`, whose `ui` scopes are `src/x.cs` and `ui/a.ts`; but § 5 (`:437`, `:456`) keeps
   `ui --file src/x.cs` in one read (≈ 31,400 B) and removes only `ui/a.ts`. The § 5 estimate leaves out R1's
   `csharp/output-encoding.md`, gated on `ui` (`:159`), which lands on that scope in E6 — so D5's reading is the safe one.
   Taken here; the owner may restore `ui src/x.cs` by flipping its flag, at the cost of E6 measuring it first.
5. **`gpu src/a.mjs` is pinned and `storage src/a.mjs` is not (S5)** — both fit today. At E4 the `.mjs` selector (Q5)
   brings the TypeScript doctrine: `gpu` stays in one read only if the doctrine is ≤ 5,088 B, while E4's allowance is
   5,900 B (`:463-465`); `storage` goes from 29,406 B to ≈ 34,300 B. § 5 claims (`:458-460`) that scopes "over today and
   unpinned … get smaller or stay as they are", but does not list these two scopes that fit today and are pushed over by
   E4 (`storage src/a.mjs` certainly, `gpu src/a.mjs` if the doctrine exceeds 5,088 B). Recorded in the allowances; E4
   and Q3/Q5 decide.

Points left open, for the coordinator to carry to the owner or to the epic named:

6. **E4's allowance and the `gpu` row disagree** — `typescript/doctrine.md` ≤ 5,900 B (`:463`) against § 5's
   `gpu --file ui/a.ts` "≈ 32,580, yes — improves" (`:440`), which holds only at ≤ 5,088 B (27,680 + 5,088 = 32,768).
7. **The Rust representative scope is over one read today and § 5 has no Rust row** — `inspect --file src/main.rs` is
   40,743 B because `common.logging-serilog` selects on `**/main.rs` (§ *Facts* F8); § 4.1 (`:200`) lists the Rust scope
   as representative.
8. **P6's C# half has no story** — the large-identifier mirror in `csharp/doctrine.md` § 4a (`:139`) is in E4's goal
   (P5–P7, `:710`) but no E4 story names it (S1 is the TypeScript § 0, S3 the C# Definition of Done, `:714-723`).
9. **Who records the deliberately-absent statements in prose** — the DoD (`:556-557`) asks for them "in
   `research/module_rules.md` with the reason"; S3 records them in `research/parity-inventory.json` (in `research/`) and
   `module_rules.md` points there instead of keeping a second copy. If the owner wants prose, it is a later epic's line.
