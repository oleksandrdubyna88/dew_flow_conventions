# PLAN — C#/Node rule parity, E1: delivery and the parity contract (no new prose)

> Status: **plan only, nothing implemented yet, 2026-10-31 — reconciled with the parent's epoch 3 (main `2ee02c4`).**
> Scope: the stories of epic E1 — the wording-only anonymisation of `typescript/doctrine.md` § 1 (S0); the
> whitespace-only splits in `common/testing.md` and `csharp/nuget-packages.md` (S0b); the `path_tasks` key and the
> provenance check of gates (S1); `tools/selection-matrix.mjs` and `research/selection-matrix.json` (S2); the 22-pin
> single-read list, the byte caps and the four declared gates (S5); the parity inventory, matrix and consumers files with
> the normalised-equality, heading-inheritance and lock fixtures (S3); `tools/moved-blocks.mjs` and the immutable manifest
> `research/moved-blocks.json` (S4); `ENTRY.md` step 7, `research/module_rules.md`, `research/module_tests.md`,
> `README.md` § *tools*.
>
> Stories of epic E1 of [PLAN_node_rule_parity.md](PLAN_node_rule_parity.md) (§ *Epics*, E1). Written by Opus on
> 2026-10-31 (`3392fb2`), reconciled with epoch 2 (`72aaf8c`), whose open points O1–O12 stopped that epoch (parent
> ledger 2.1–2.6, § 17), and now reconciled with epoch 3 (§ 17, § 18). This document keeps no change ledger: a change to
> E1's approved work is an entry in the parent's `## Plan changes` — epoch 3, at 0 changes, where a second change stops
> the plan again. E1 holds no cornerstone area: no story is marked `model: fable`, and the parent's ledger line stays
> `Cornerstones: 0 of 3`. What the parent still leaves unbuildable or unclear is in § *Open points*, each classified as a
> change or not, and not decided in the stories.

Done when (the parent's E1, `todo/PLAN_node_rule_parity.md:1163-1170`): `npm test` green with the new tests; the matrix
test observed red when an ACTIVATED row names a missing id or section, and when a `planned` row names no owning epic,
then fixed; every `planned` row and move entry passes its structural check with its source bytes recorded; every tight
scope's headroom is in `research/module_rules.md`; **the fixtures of the parent's § 10 (`:793-808`) are green — one per
contract**:

| Contract | Fixture | Story |
|---|---|---|
| selection | one positive and one negative case per gated rule | S1 (fixture catalog), S5 (the four declared gates) |
| equality normalisation | one `equal` pair passing through the correspondence table; one mismatch that fails | S3 |
| the manifest case | `dependencies --file package.json` and `dependencies --file src/x.csproj` select the same rule kinds | S3 |
| heading inheritance | `common/reliability.md`'s `### A timeout…` read as MANDATORY from its H1; a section with no marker above it read as SHOULD | S3 |
| moves | an exact whole-line range recorded; a fence-splitting range refused; a mid-line range refused, naming S0b | S4 |
| G2's enforcement | a stale `packages.lock.json` fails a locked restore with `NU1004` and passes after `--force-evaluate`; an unsatisfied `package-lock.json` fails `npm ci` with `EUSAGE` | S3 |

— all before E2's stories document is written; one pull request through both gates. The commands, from the worktree
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

- **Branch.** `feat/rule-parity-e1` (main merged in at `a5dc95b`). One commit per story, `npm test` green after each —
  the six janitor cases that fail on this machine on a clean `main` aside (parent § 16, `:1027-1028`): name them, never
  fold them into a story's verdict. One pull request for the epic.
- **S0 and S0b are their own commits**, each carrying only its rule files and `research/rule-bodies.json`, listed in the
  pull request as **wording, no lesson removed** (S0) and **whitespace only** (S0b) (parent § 4.3 `:396-403`, § 4.4
  `:492-498`, § 11 `:843-845`).
- **Gates.** `open` on this branch with `callerModel`; `review_plan` with this document as the scope of epic 1 of 7;
  `resolve` every finding, rejecting in round one what is wrong; build in the order below; `review_code` over the epic's
  diff with `baseRef` = the merge base with `main` at that time (`2ee02c4` today) and an Opus review, both at once. A
  reply's `commands` are followed and named; a cadence-consultation order is made as written.
- **Models.** Scenarios and briefs: Opus (this document). Code, data, tests, documents: a Sonnet coder per story,
  re-discovering nothing. Review: Opus. Fixes: Sonnet. S0 and S0b may be done by the main session only if it bounds each
  to its files and lines before the first edit; a Sonnet coder is always correct.

## Facts the stories rest on (read 2026-10-31; the rule files are unchanged from `f46982f` to `a5dc95b`)

- **F1 — selection.** `selectRules` (`tools/lib/rule-catalog.mjs:141-166`) adds a rule for `load: always`, for each scope
  task in its `tasks`, for each (file, pattern) match of its `paths`; dependencies first, reason `dependency:<id>`,
  ignoring their own conditions. An unknown metadata key throws in `ruleFrom` (`:85`).
- **F2 — the explain manifest** lists per rule `id, source, hash, bytes, load, paths, tasks, depends, reasons`
  (`tools/lib/rule-cli.mjs:103`); `bytes` is the whole file text, front matter included (`rule-catalog.mjs:98`).
- **F3 — the body freeze** hashes the body after the front matter (`tools/lib/rule-body.mjs:24`); a changed `paths:`,
  `tasks:`, `depends:` or `path_tasks:` line passes it (`tools/rules.test.mjs:151-174`; `drifted` is exported by
  `tools/rule-bodies.mjs:72`) — D12's reason for the id-list pins.
- **F4 — a mutation test depends on a literal.** `tools/rules.test.mjs:322` replaces `normalized.filter(file=>match(file))`
  in `rule-catalog.mjs`; S1 keeps that substring byte for byte.
- **F5 — the single-read pin today** is `tools/rules.test.mjs:250-257`: `inspect` ×{none, `src/x.cs`, `src/x.csproj`,
  `ui/a.ts`}, `ui` ×{none, `src/x.cs`, `ui/a.ts`}, `gpu` ×{none, `src/x.cs`}, `storage` none.
- **F6 — section strings** in `research/rule-bodies.json` are whole heading lines with their `#` marks
  (`sectionsOf`, `rule-body.mjs:89`). The fence rule (CommonMark, any indent 0–3) is `FENCE_OPEN`/`FENCE_CLOSE` in the
  same file (`:30-31`).
- **F7 — CI reads no history.** Squash merges and `actions/checkout`'s default depth 1 (`.github/workflows/ci.yml:23-25`);
  epoch 3 keeps both (§ 4.3 `:363-371`).
- **F8 — S0 and S0b, measured on a copy** (2026-10-31): S0 removes 26 B from `typescript.doctrine` (5,909 → 5,883 B; § 1
  `15-48` becomes 2,016 B; the line count is unchanged); S0b's `common/testing.md` split replaces one space by one line
  end (+0 B, +1 line after `:33`) and its `csharp/nuget-packages.md` split replaces one space by a blank line (+1 B,
  +2 lines after `:41`). With all whitespace removed, both files are byte-identical before and after.
- **F9 — the exact ranges after S0 and S0b**, whole lines, `Buffer.byteLength` of the folded text, every range starting
  and ending outside a fence (measured with the F6 rule):

| Source | Lines | Bytes | Destination | Epic |
|---|---|---:|---|---|
| `common/testing.md` | 12-31 | 1,113 | `csharp/testing.md` | E6 |
| `common/testing.md` | 32-33 (the Rust sentence's two lines; `:34` "Everything below applies everywhere." stays) | 116 | `rust/testing.md` | E6 |
| `common/testing.md` | 355-359 (`## Architecture is a test…`; `:354-358` before S0b) | 252 | `csharp/testing.md` | E6 |
| `common/reliability.md` | 49-54 · 55-59 · 66-69 · 97-98 · 99-102 · 104-133 | 433 · 436 · 375 · 160 · 322 · 1,698 | `csharp/lifecycle.md` | E5 |
| `common/logging-serilog.md` | 61-90 · 153-171 | 1,640 · 497 | `csharp/logging.md` | E6 |
| `common/logging-serilog.md` | 172-187 | 875 | `rust/logging.md` | E6 |
| `common/utc-timestamps.md` | 41-47 (the whole indented C# fence of rule 3) | 311 | `csharp/utc-timestamps.md` | E6 |
| `common/utc-timestamps.md` | 65-69 | 219 | `rust/utc-timestamps.md` | E6 |
| `typescript/doctrine.md` | 15-48 (§ 1, after S0) · 100-101 (its box) | 2,016 · 166 | `typescript/boundaries.md` | E4 |
| `typescript/doctrine.md` | 49-65 (§ 2) · 66-79 (§ 3) · 80-97 (§ 4) · 102-105 (their boxes) | 755 · 932 · 1,151 · 278 | `typescript/testing.md` | E4 |
| `csharp/nuget-packages.md` | 12-23 · 25-29 · 39 (`## Bumping`) · 43-45 (the neutral cadence paragraph, after S0b) · 52-56 (*Prefer nothing*; `:50-54` before S0b) | 824 · 334 · 11 · 187 · 286 | `common/dependencies.md` | E2 |

  25 entries. What stays, by the parent: `common/testing.md:34`; `reliability.md:38-46`, `:60-62`, `:63-65`;
  `utc-timestamps.md:30-36` and its Never/DoD lines; `nuget-packages.md:31-37`, `:41` (the .NET-only sentence) and the
  `powershell` fence `:47-50` (§ 4.3 `:418-425`).
- **F10 — the measured matrix after S0 and S0b** (summed `bytes` of `selectRules(catalog, [task], files)` on the copy):

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

  108 scopes, 1,509 ids. The always core is 15,055 B; `csharp/doctrine.md` 4,613 B.
- **F11 — the consumers.** `README.md:188-199` lists eight; kinds are the parent's (`:322-327`); mounts read from each
  local checkout's `.gitmodules` on 2026-10-31: `.claude/rules/shared` for `dew_flow_rag_qln`, `dew_flow_mcp`,
  `dew_flow_sidecar_rust`, `dew_flow_creds_for_devs`; `.agents/conventions` for `dew_flow_benchmark`,
  `dew_flow_connect_other_ais`, `wsl_care`, `dew_flow_vscode_kit`.
- **F12 — both lock refusals are offline**, probed here 2026-10-31. npm 11: a `package.json` asking `picomatch` `4.0.6`
  against a lock at `4.0.7` → `npm ci --ignore-scripts --offline` exit 1, `npm error code EUSAGE`, `Invalid: lock file's
  picomatch@4.0.7 does not satisfy picomatch@4.0.6`. SDK 10.0.114: two projects with `RestorePackagesWithLockFile`,
  restored, then a `ProjectReference` added → `dotnet restore --locked-mode -m:4` exit 1, `error NU1004: A new project
  reference to lib was found …`; `dotnet restore --force-evaluate -m:4` then locked-mode → exit 0. No package source is
  contacted: the projects reference no package.

## Order

**S0 → S0b → S1 → S2 → S5 → S3 → S4.** S0 and S0b first because every later number and every S4 hash is taken after
them; S1 is the resolver change and the gate check; S2 pins what the resolver selects; S5 adds the single-read flags, the
caps and the four declared gates to S2's tool and creates `tools/lib/parity-epics.mjs`; S3 and S4 then reuse it. Each
story writes its tests first and watches them fail for the reason its RED step names.

## Growth

The parent's § 7 (`:725-738`) carries the data files. E1 adds besides: two tools and three libraries
(`tools/selection-matrix.mjs`, `tools/moved-blocks.mjs`, `tools/lib/moved-blocks.mjs`, `tools/lib/gates.mjs`,
`tools/lib/parity-epics.mjs`), two lock fixtures under `tools/fixtures/locks/` (< 4 KB), their tests (≈ 1,500 lines), and
≈ 5 KB in `research/module_rules.md`, a PROJECT `requires` source read at every session start — its measured table is
REPLACED at each re-measurement, never appended. Every temporary folder of the new tests is an owned folder (`ownedDir`);
the lock fixtures are copied into one before any `npm`/`dotnet` command writes there.

## Not in E1

- No rule text changes except S0's wording and S0b's whitespace; no rule gains `path_tasks`.
- No destination is written and no move entry is `landed`: S4 records 25 `planned` entries.
- The mirrored gates and their cases are declared by the epic that creates each gated file (E4–E6); E1 declares the four
  the parent names (§ 4.4 `:506-515`).

---

## E1.S0 — The wording-only anonymisation of `typescript/doctrine.md` § 1

- **Size.** S — six lines of one rule, its body record.
- **Models.** Brief: Opus. Edit: a Sonnet coder (or the main session under a declared bound). Review: Opus.
- **Goal.** Parent § 4.4 (`:492-498`) and E1 (`:1130-1134`; § 17 O8): § 1's three file names, "a real vault", "a
  **synced** vault" and `scriptInterpolation.test.ts` become "one module", "a second", "a third", "a real credential
  store", "a **synced** credential store" and "the scan test" — every sentence, number and date kept — in the source, as
  its own commit, with the body recorded, so S4 hashes the anonymised text and E4.S2's move is byte-equal to it.

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 0.1 | `typescript/doctrine.md` at `a5dc95b` | lines 33–37 and 39 are replaced as the brief says | `git diff --stat`: that file (6 lines) and `research/rule-bodies.json`; nothing else |
| 0.2 | the edit, before the record moves | `node tools/rule-bodies.mjs` | exit 1, `DRIFT typescript.doctrine — its body changed without the record moving` |
| 0.3 | `--update typescript.doctrine` | `node tools/rule-bodies.mjs` | `typescript.doctrine — <old> → <new>, 6 heading(s)`, then `OK — 39 rule(s)`; the sections unchanged |
| 0.4 | the edited file | `grep -nE 'webauthnPrf|entityFormScript|depPickerScript|scriptInterpolation|vault' typescript/doctrine.md` | no line |
| 0.5 | the edited file | its line count; lines 15–48 | unchanged count; § 1 still 15–48, 2,016 B (F9); the file 5,883 B (F8) |
| 0.6 | — | `npm test`, `node tools/ownership-check.mjs` | green (the six known janitor cases aside); OK |

### Files

`typescript/doctrine.md` (lines 33–37, 39), `research/rule-bodies.json` (by the tool).

### Acceptance criteria

0.1–0.6; the commit carries only the two files; its message says *wording only, no lesson removed* and names the six
replacements.

### RED → GREEN → RED

1. **RED.** After the edit, before `--update`: 0.2. Record the line.
2. **GREEN.** `--update typescript.doctrine`; 0.3; `npm test`.
3. **RED again.** Revert line 39 alone → `rule-bodies` names `typescript.doctrine`; restore → OK.

### Docs to update

None besides the record; S4's section of `research/module_tests.md` names this commit as the source of § 1's hash.

### The brief (for the Sonnet coder)

In `typescript/doctrine.md`, replace exactly lines 33–36, which read

```
**Three instances, three different people, one of them shipped.** `webauthnPrf.ts` escaped by
hand; `entityFormScript.ts` did not; `depPickerScript.ts` reintroduced it in new code written
*beside* the fix for the previous one — and that build was cut, installed and running against a
real vault for an hour before it was found. The values were folder and entry names arriving from
```

with exactly

```
**Three instances, three different people, one of them shipped.** One module escaped by hand; a
second did not; a third reintroduced it in new code written *beside* the fix for the previous one
— and that build was cut, installed and running against a real credential store for an hour
before it was found. The values were folder and entry names arriving from
```

and, on line 37, `a **synced** vault,` with `a **synced** credential store,`; on line 39,
`` `scriptInterpolation.test.ts` scans `` with `The scan test scans`. No other byte changes. Then
`node tools/rule-bodies.mjs --update typescript.doctrine`, `node tools/rule-bodies.mjs`, `npm test`,
`node tools/ownership-check.mjs`. Stage the two files by path (`git diff --staged --stat`: 2 files). Commit:
`docs(rules): typescript/doctrine.md § 1 — wording only, no lesson removed: three file names, two "vault"s and a test
file name anonymised (todo/PLAN_node_rule_parity.md § 4.4, § 17 O8)`, the body listing the six replacements and the two
`rule-bodies` lines observed.

---

## E1.S0b — The whitespace-only splits, D1-checked, before anything records a hash

- **Size.** S — one character in each of two rules, their body records, the D1 check.
- **Models.** Brief: Opus. Edit: a Sonnet coder (or the main session under a declared bound). Review: Opus.
- **Goal.** Parent § 4.3 (`:396-403`), § 17 O5, E1 (`:1134-1137`): where one line holds a sentence that moves and one
  that stays, a line break or a blank line goes between them in the SOURCE — nothing else — so every move is whole lines
  (F9) and every word stays where it belongs. The check that it is no shortening: each file with all whitespace removed
  is byte-identical before and after.

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 0b.1 | `common/testing.md:33` reads `.NET-specific. Everything below applies everywhere.` | the space after `specific.` becomes one line end | line 33 is `.NET-specific.`, line 34 `Everything below applies everywhere.`; the file is the same byte length (F8) |
| 0b.2 | `csharp/nuget-packages.md:41` reads `… the family is strictly .NET 10. Bump the whole set` | the space after `10.` becomes a blank line (`"\n\n"`) | line 41 ends `.NET 10.`, line 42 is empty, line 43 begins `Bump the whole set`; the file is 1 B longer |
| 0b.3 | both edits | the D1 check (brief) | `testing: whitespace-only` and `nuget-packages: whitespace-only`, exit 0 |
| 0b.4 | a copy where one word is also deleted | the D1 check | exit 1, naming the file — the check has teeth |
| 0b.5 | the edits | `--update common.testing csharp.nuget-packages`, then `node tools/rule-bodies.mjs` | both moved, the sections unchanged; `OK — 39 rule(s)` |
| 0b.6 | — | `npm test`, `npm run check` | green |

### Files

`common/testing.md` (`:33`), `csharp/nuget-packages.md` (`:41`), `research/rule-bodies.json`.

### Acceptance criteria

0b.1–0b.6; the commit holds only these three files; its message carries the D1 check's two output lines.

### RED → GREEN → RED

1. **RED.** After the edits, before `--update`: `node tools/rule-bodies.mjs` → `DRIFT common.testing`, `DRIFT
   csharp.nuget-packages`. Record.
2. **GREEN.** `--update`; the D1 check; `npm test`.
3. **RED again.** 0b.4 on a scratch copy outside the repository's tracked files (the scratchpad or an owned folder).

### Docs to update

None; S4's `## Moves` section in `research/module_rules.md` names this commit as the source of the post-split numbering.

### The brief (for the Sonnet coder)

1. In `common/testing.md`, replace the text `.NET-specific. Everything below applies everywhere.` (line 33, exactly once
   in the file) by `.NET-specific.` + `"\n"` + `Everything below applies everywhere.`.
2. In `csharp/nuget-packages.md`, replace `strictly .NET 10. Bump the whole set` (line 41, exactly once) by
   `strictly .NET 10.` + `"\n\n"` + `Bump the whole set`. Do not re-wrap any other line.
3. The D1 check, run from the worktree root before committing:
   ```bash
   node --input-type=module -e 'import {execFileSync} from "node:child_process";import fs from "node:fs";let bad=0;for(const f of process.argv.slice(1)){const w=s=>s.replace(/\s+/g,"");const before=execFileSync("git",["show","HEAD:"+f],{encoding:"utf8"});const ok=w(before)===w(fs.readFileSync(f,"utf8"));console.log(`${f}: ${ok?"whitespace-only":"WORDS CHANGED"}`);if(!ok)bad=1;}process.exitCode=bad' common/testing.md csharp/nuget-packages.md
   ```
4. `node tools/rule-bodies.mjs --update common.testing csharp.nuget-packages`, `node tools/rule-bodies.mjs`,
   `npm test`, `npm run check`. Commit the three files by path: `docs(rules): whitespace-only splits in
   common/testing.md and csharp/nuget-packages.md so every planned move is whole lines (todo/PLAN_node_rule_parity.md
   § 4.3, E1.S0b)`, the body carrying the D1 check's output.

---

## E1.S1 — `path_tasks`, and the provenance check of every gate

- **Size.** M — about 30 lines in `rule-catalog.mjs` and `rule-cli.mjs`, a library of about 80 lines, about 220 lines of
  tests, three documents.
- **Models.** Brief: Opus (below). Code and tests: a Sonnet coder. Review: Opus.
- **Goal.** D3 and parent § 4.2 (`:334-359`): the key `path_tasks` gates a rule's `paths` to scopes that name one of its
  tasks; plain `tasks` and dependencies ignore the gate; a gate without `paths` is a metadata error; explain names the
  gate. And the provenance rule (§ 4.3 `:405-412`, T11 `:754`, § 11 `:852-856`): every gated rule's gate either MIRRORS
  the `tasks:` line of the rule its requirement's text came from, or is DECLARED with a reason; every gated rule has at
  least one positive and one negative selection case, and each case holds. S1 builds the check (`tools/lib/gates.mjs`)
  and proves it on fixtures; S5 gives it the real declarations.

### The gate record (read by `gateFindings`; S5 writes it into `research/selection-matrix.json` → `gates`)

`{ "<rule id>": { "mirrors": "<source id>" | "declared": { "path_tasks": [...], "reason": "<≥ 20 chars>" },
"epic": "E2".."E6", "cases": [ { "tasks": [t], "files": [f…], "selected": true|false }, … ] } }` — exactly one of
`mirrors` and `declared`; `epic` the epic that creates the rule.

`gateFindings(catalog, gates, landedEpics)` → findings:

1. A catalog rule with `pathTasks` and no `gates` entry: `<id> carries path_tasks but has no gate record — mirror its source or declare it`.
2. An entry whose rule is not in the catalog: allowed only while its `epic` is not in `landedEpics` (`<id>: no such rule, and its epic <E> has landed`); its cases are still checked structurally (rule 5).
3. An entry for a present rule without `pathTasks`: `<id> has a gate record but no path_tasks`.
4. `mirrors`: the source exists; its `tasks` is non-empty (`<id>: <source> has no tasks: line, so it mirrors as no gate — declare the applicability change instead`); the rule's `pathTasks` equals the source's `tasks` as a set. `declared`: `path_tasks` equals the rule's `pathTasks` as a set; `reason` ≥ 20 characters. Both or neither present: a finding.
5. `cases`: at least one `selected: true` and one `selected: false`; every task known, every file a root-relative path (`targetPath` of `rule-catalog.mjs`); and, when the rule exists, `selectRules(catalog, case.tasks, case.files)` includes the id exactly when `selected` (`<id>: case <tasks> <files> expected selected|not selected`).

### Scenarios

Fixtures from the existing `fixture(t)` of `tools/rules.test.mjs`. `G` is `csharp/mech.md`:
`id: csharp.mech · load: conditional · paths: ["**/*.cs"] · path_tasks: ["implement","test"]`; `common/src.md` has
`tasks: ["implement","test"]`; `typescript/doc.md` is path-only (`paths: ["**/*.ts"]`).

| # | Given | When | Then |
|---|---|---|---|
| 1.1 | `G` | `selectRules(c, ["implement"], ["src/x.cs"])` | selected; `reasons` exactly `["path:src/x.cs (**/*.cs) when task:implement"]` |
| 1.2 | `G` | `["inspect"]`, `["src/x.cs"]` | NOT selected |
| 1.3 | `G` | `["implement"]`, no file | not selected |
| 1.4 | `G` | `["implement"]`, `["ui/a.ts"]` | not selected |
| 1.5 | `G` | `["test","implement"]`, `["src/x.cs"]` | ONE reason `… when task:implement,test` (the rule's order) |
| 1.6 | `G` and an ungated `csharp/plain.md`, same `paths` | `["inspect"]`, `["src/x.cs"]` | `csharp.plain` selected, `csharp.mech` not — the glob matches |
| 1.7 | a gated rule with `tasks: ["audit"]` | `["audit"]`, no file | selected, `task:audit` |
| 1.8 | `common/dep.md` (`tasks: ["gpu"]`, `depends: ["csharp.mech"]`) | `["gpu"]`, no file | `csharp.mech` selected, `dependency:common.dep` |
| 1.9 | `G` with `depends: ["common.b"]` | `["implement"]`, `["src/x.cs"]` | `common.b` first, `dependency:csharp.mech` |
| 1.10–1.15 | `path_tasks` with no `paths` key / `paths: []` / `path_tasks: []` / `["imlpement"]` / a string / on `load: always` | `loadCatalog` | throws `/path_tasks needs paths/` ×2, `/must name at least one task/`, `/imlpement.*legal: inspect/`, `/must be an array of nonempty strings/`, `/applies to a conditional rule only/`; also when no scope would select the rule |
| 1.16 | `cliFixture` + `csharp/zz-gated.md` | `explain --task implement --file src/x.cs` / `--task inspect` | `path_tasks: ["implement"]` and the gated reason / absent; `csharp.doctrine` has `path_tasks: []` |
| 1.17 | `G`, gates `{ "csharp.mech": { mirrors: "common.src", epic: "E5", cases: [+implement src/x.cs, −inspect src/x.cs] } }` | `gateFindings` | `[]` — the positive case |
| 1.18 | `G`, gates `{}` | | finding rule 1 |
| 1.19 | `common/src.md` tasks `["implement","audit"]` | | finding rule 4 (the sets differ) |
| 1.20 | `mirrors: "typescript.doc"` (path-only) | | finding rule 4 (mirrors as no gate) |
| 1.21 | `declared: { path_tasks: ["implement","test"], reason: "a checklist is read at task completion" }` | | `[]` |
| 1.22 | `declared` with reason `"x"` / with `path_tasks: ["implement"]` / both `mirrors` and `declared` | | one finding each |
| 1.23 | the 1.17 cases with the negative removed / with `+gpu src/x.cs` (which does not select) | | one finding each (rule 5) — the selection fixture: one positive and one negative per gated rule |
| 1.24 | an entry for `csharp.later` (absent), `epic: "E6"`, landed `[]` / landed `["E6"]` | | `[]` / finding rule 2 |
| 1.25 | an entry for the ungated `csharp.plain` | | finding rule 3 |

### Files

`tools/lib/rule-catalog.mjs`, `tools/lib/rule-cli.mjs`, `tools/lib/gates.mjs` (new), `tools/rules.test.mjs`,
`ENTRY.md` step 7, `research/module_rules.md`, `research/module_tests.md`.

### Acceptance criteria

Every scenario passes; the 24 existing tests of `tools/rules.test.mjs` pass unchanged (`:322` included); explain prints
`"path_tasks": []` for every real rule with the same ids and bytes as before; `npm run check`, `rule-bodies` green.

### RED → GREEN → RED

1. **RED.** Write 1.1–1.25 first: the selection and gate cases fail with `unknown metadata key path_tasks` (the key is
   unsupported) or `Cannot find module …/lib/gates.mjs`; 1.10–1.15 fail on the wrong message. Record.
2. **GREEN.** The brief; the whole suite.
3. **RED again**: (a) drop the gate filter → 1.2 fails; (b) drop "needs paths" → 1.10 fails; (c) drop `path_tasks` from
   the CLI manifest → 1.16 fails; (d) drop the set comparison of rule 4 → 1.19 fails; (e) drop the running of cases in
   rule 5 → the second half of 1.23 fails.

### Docs to update

`ENTRY.md` step 7; `research/module_rules.md`; `research/module_tests.md`.

### The brief (for the Sonnet coder)

No rule file changes. **1. `tools/lib/rule-catalog.mjs`** — `KEYS` gains `"path_tasks"`; in `ruleFrom`, after the
`depends` line, in this order and with these messages:

```js
const gated = Object.hasOwn(metadata, "path_tasks");
const pathTasks = stringList(metadata, "path_tasks", file);
pathTasks.forEach(task => { if (!Object.hasOwn(TASKS,task)) throw new Error(`${file}: unknown path_tasks task ${task}; legal: ${Object.keys(TASKS).join(", ")}`); });
if (gated && metadata.load === "always") throw new Error(`${file}: path_tasks applies to a conditional rule only`);
if (gated && !pathTasks.length) throw new Error(`${file}: path_tasks must name at least one task`);
if (gated && !paths.length) throw new Error(`${file}: path_tasks needs paths — it gates path selection and selects nothing alone`);
```

the returned object gains `pathTasks`; `selectRules`' path loop becomes (keep `normalized.filter(file=>match(file))`, F4):

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

**2. `tools/lib/rule-cli.mjs:103`** — emit `path_tasks:pathTasks` after `depends`.

**3. `tools/lib/gates.mjs`** — `export function gateFindings(catalog, gates, landedEpics)` implementing rules 1–5 above,
one check per helper, importing `selectRules`, `targetPath`, `TASKS` from `./rule-catalog.mjs`; messages as written.

**4. `tools/rules.test.mjs`** — the scenarios as tests named for their guarantee; 1.16 through `cliFixture(t)` and
`run([...,"--repo",root],root)` with the extra rule written into the copy's `csharp/`.

**5. `ENTRY.md` step 7** reads:

```
7. Dependencies are mandatory even when their own paths/tasks do not match. Selection is
   paths (optionally gated by `path_tasks`) OR tasks, plus always rules and transitive
   dependencies, deduplicated by id. A rule with `path_tasks` is selected by its paths only
   in a scope that also names one of those tasks.
   Metadata in each rule is the only selection source; todo, research, fixtures and tool
   comments are not policy catalogs. Local rules belong in `.agents/rules` with `local.*` ids.
```

**6. `research/module_rules.md`** — the metadata paragraph (`:19-23`) names `path_tasks` and its four errors; a section
`## Task-gated path selection — path_tasks (2026-10-31)`: the semantics and reason text; the two legitimate uses (a gate
that mirrors its requirement's source `tasks:` line; a gate declared with a reason for a new requirement or an
applicability the plan changed on purpose — cite `todo/PLAN_node_rule_parity.md` § 4.3 as plain text); the per-rule
positive and negative cases; `tools/lib/gates.mjs` and the record it reads (S5 points it at `research/selection-matrix.json`).

**7. `research/module_tests.md`** — the new tests, one line each, and *what it does not prove: that a gated rule's TEXT
is its source's — that is `research/moved-blocks.json`.*

---

## E1.S2 — The selection matrix: every representative scope's id list, regenerated by a tool and compared

- **Size.** M — a tool of about 180 lines, its test, the generated file (≈ 55 KB), the measured table.
- **Models.** Brief: Opus (below). Tool, data, test, table: a Sonnet coder. Review: Opus.
- **Goal.** Parent § 4.1 (`:243-264`), D12, § 7 (`:734`), § 10 (`:791`): the ids each of the 108 representative scopes
  selects are in `research/selection-matrix.json`, produced by `tools/selection-matrix.mjs`; a test regenerates the file
  and fails on any difference, so a selector change the body freeze cannot see (F3) is red until regenerated, and a hand
  edit is refused. The file's hand-authored parts — S5's `oneRead`/`why` and `gates` — live as constants in the tool, so
  the whole file is generated. The bytes of every scope are recorded in `research/module_rules.md` with the command that
  re-measures them.

### The scopes

12 file sets × 9 tasks, in this order: none · `src/x.cs` · `src/x.csproj` · `Directory.Build.props` · `ui/a.ts` ·
`src/a.mjs` · `src/x.cs` + `ui/a.ts` · `package.json` · `tsconfig.json` · `.npmrc` · `src/webview/page.ts` ·
`src/main.rs`; tasks `inspect`, `ui`, `gpu`, `storage`, `implement`, `test`, `audit`, `logging`, `dependencies`. A name
is `<task> <files joined by " + ">` or `<task> (no file)`. The expected single-read lists today: base `inspect` =
`common.coding-style`, `common.knowledge-base`, `common.security`, `common.task-lifecycle`; `ui` adds
`common.durable-status`, `gpu` `common.gpu-lease`, `storage` `common.utc-timestamps`; then `src/x.cs` adds
`csharp.doctrine`; `src/x.csproj` adds `csharp.doctrine`, `csharp.nuget-packages`; `Directory.Build.props` adds
`csharp.nuget-packages`; `ui/a.ts` and `src/webview/page.ts` add `typescript.doctrine`; mixed adds both doctrines;
`package.json` adds `common.local-cpu-budget`; `src/main.rs` adds `common.logging-serilog`, `rust.doctrine`;
`src/a.mjs`, `tsconfig.json`, `.npmrc` add nothing.

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 2.1 | the real catalog and the committed file | `render(catalog)` against the file | byte-equal — the regeneration test |
| 2.2 | the file | read | 108 scopes, names unique, `tasks` known, `ids` sorted and unique, every (task, file set) of `SCOPES` once |
| 2.3 | a copy of the rule directories and `research/rule-bodies.json` in an owned folder, `tasks: ["dependencies"]` deleted from the copy's `csharp/nuget-packages.md` | `idDrift(loadCatalog(copy), file)` / `drifted(copy, manifest)` | contains `dependencies (no file): the matrix lists csharp.nuget-packages, which it no longer selects` / `[]` — D12's point, one test |
| 2.4 | a copy with a body sentence of `csharp/doctrine.md` changed | `drifted` / `idDrift` | names `csharp.doctrine` / `[]` |
| 2.5 | the file with one id deleted in memory | `idDrift` | one finding: scope, id, direction |
| 2.6 | `node tools/selection-matrix.mjs` on a clean copy / after a hand edit of the copy's file | | exit 0, `selection-matrix: in step — 108 scope(s)` / exit 1, the finding and `regenerate with --write after reading why` |

### Files

`tools/selection-matrix.mjs`, `tools/selection-matrix.test.mjs`, `research/selection-matrix.json` (new);
`research/module_rules.md`, `research/module_tests.md`, `README.md` § *tools*.

### Acceptance criteria

2.1–2.6; the single-read lists equal the text above; the bytes table equals F10 (re-measured with `--bytes`; a
difference reported, not smoothed), with its commit (after S0b) and date.

### RED → GREEN → RED

1. **RED.** The test before the tool: `Cannot find module …/selection-matrix.mjs`.
2. **GREEN.** The tool, `--write`, all pass.
3. **RED again.** Delete one id from the file → 2.1 and 2.6 fail; restore. Make `idDrift` ignore one direction → 2.3
   fails; restore.

### Docs to update

`research/module_rules.md`; `research/module_tests.md`; `README.md` § *tools* (one row).

### The brief (for the Sonnet coder)

**1. `tools/selection-matrix.mjs`** exports `FILE_SETS`, `TASKS_PINNED`, `SCOPES` (`{ name, tasks: [task], files }`),
`ONE_READ = Object.freeze({})` and `GATES = Object.freeze({})` (both filled by S5), `render(catalog)`,
`idDrift(catalog, parsedFile)`, `bytesTable(catalog)`; and a CLI: no argument → verify (exit 0/1); `--write` → atomic
write (temporary file + rename, as `tools/rule-bodies.mjs:98-112`); `--bytes` → the F10 table in markdown; else usage,
exit 2. `render` writes, in this order: `note`; `scopes`, one entry per scope on two lines —
`{"name": …, "tasks": […], "files": […],` followed by S5's ` "oneRead": …,` and ` "why": …,` when set, then a second
line `"ids": [ … ]}`, ids `selectRules(catalog, s.tasks, s.files).map(r=>r.id).sort()`; and `gates`, `JSON.stringify` of
`GATES` with two-space indent nested at its level. The note: *The exact rule ids each representative scope selects, the
single-read flags and the gate records (todo/PLAN_node_rule_parity.md section 4.1, section 4.3, D12). Generated by
tools/selection-matrix.mjs --write from the catalog and the tool's constants; tools/selection-matrix.test.mjs fails
when the catalog selects a different list or the file was edited by hand.*

**2. `tools/selection-matrix.test.mjs`** — the scenarios, `ownedDir(t, "selection matrix")` for every copy (never
`mkdtemp`/`os.tmpdir()`); 2.6 runs the copy's tool with `spawnSync(process.execPath, [tool], {cwd, timeout: GUARD_MS})`.

**3. `research/module_rules.md`** — `## The selection/budget matrix (todo/PLAN_node_rule_parity.md § 4.1, measured
2026-10-31 at <sha>)`: what is pinned, the tool and the test, the table `--bytes` prints, the F10 facts (`src/main.rs`
selects `common.logging-serilog`; `src/a.mjs` no language rule until E4), and *each later epic re-runs `--bytes` and
REPLACES this table, naming its commit*.

**4. `README.md` § *tools*** — one row: `tools/selection-matrix.mjs` | the pinned id list of every representative scope,
the single-read flags and the gate records (D12) — regenerated, never hand-edited | `node tools/selection-matrix.mjs`,
`--write`, `--bytes` (this repository only).

---

## E1.S5 — The 22-pin single-read list, the caps, and the four declared gates

- **Size.** M — the tool's three constants, a new library constant, the single-read test rewritten, the cap test, the
  regenerated file, two sections of `module_rules.md`.
- **Models.** Brief: Opus (below). Code, data, text: a Sonnet coder. Review: Opus.
- **Goal.** Parent § 5 (`:682-707`), § 11 (`:852-861`), E1 (`:1160-1162`): the exact 22 pins as `oneRead: true`, every
  other single-read-task scope with a `why`; the caps of § 5 as tests; the allowances recorded; the four declared gates
  with their reasons and their positive and negative cases in `GATES`; `tools/lib/parity-epics.mjs`.

### The 22 pins (parent `:686-691`)

| Task | `oneRead: true` (today's bytes, F10) |
|---|---|
| `inspect` | none 24,207 · `src/x.cs` 28,820 · `src/x.csproj` 31,902 · `ui/a.ts` 30,090 · `tsconfig.json` 24,207 · `.npmrc` 24,207 · `Directory.Build.props` 27,289 · `src/a.mjs` 24,207 · `src/webview/page.ts` 30,090 |
| `ui` | none 26,420 · `tsconfig.json` 26,420 · `.npmrc` 26,420 · `Directory.Build.props` 29,502 |
| `gpu` | none 27,680 · `src/x.cs` 32,293 · `tsconfig.json` 27,680 · `.npmrc` 27,680 · `Directory.Build.props` 30,762 |
| `storage` | none 29,406 · `tsconfig.json` 29,406 · `.npmrc` 29,406 · `Directory.Build.props` 32,488 |

The other 26 single-read-task scopes are `oneRead: false` with a `why`, exactly:

| Scopes | `why` |
|---|---|
| `ui src/x.cs`, `ui ui/a.ts`, `ui src/a.mjs`, `ui src/webview/page.ts` | `D5: ui with a language file is off the single-read list (plan section 5)` |
| `ui src/x.csproj`, `ui src/x.cs + ui/a.ts` | the D5 text + `; over one read today: <bytes> B` (34,115; 36,916) |
| the 18 over-today scopes: `inspect` mixed, `package.json`, `src/main.rs`; `ui` `package.json`, `src/main.rs`; `gpu` `src/x.csproj`, `ui/a.ts`, mixed, `package.json`, `src/webview/page.ts`, `src/main.rs`; `storage` `src/x.cs`, `src/x.csproj`, `ui/a.ts`, mixed, `package.json`, `src/webview/page.ts`, `src/main.rs` | `over one read today: <bytes> B` with its F10 number; `inspect src/main.rs` adds `; about 38,030 B after the plan, still over (plan section 5)`; `inspect package.json` adds `; about 43,600 B after the plan (plan section 5)`; `gpu ui/a.ts` adds `; 32,680 B or less after E4 (plan section 5)` |
| `gpu src/a.mjs` | `fits today (27,680 B) and 32,680 B or less after E4; unpinned by the plan (section 5) — named because E4's .js selector creates it` |
| `storage src/a.mjs` | `fits today (29,406 B); about 33,300 B once E4 makes .mjs select the TypeScript doctrine — over one read, unpinned (plan section 5)` |

### The caps (tested from E1 on) and the allowances (recorded)

`CAPS` in `tools/rules.test.mjs` — a rule cap applies whenever the rule exists, except where an epic is named, which
holds from that epic's landing (`LANDED_EPICS`):

| Cap | Max | From | Source |
|---|---:|---|---|
| the always core (load-always rules and their dependency closure) | 15,355 B | now | § 5 `:643`, `:706-707` — the hard cap |
| `gpu --file src/x.cs` | 32,613 B | now | § 5 `:654`, § 11 `:859-861` |
| `csharp.doctrine` | 4,633 B | now | § 5 `:704` |
| `typescript.npm-packages` | 3,500 B | when present | § 5 `:691`, `:699`; § 18 finding 3 (the `.npmrc` pins) |
| `typescript.compiler-strictness` | 3,300 B | when present | § 5 `:661`, `:700` |
| `common.dependencies` | 4,000 B | when present | § 5 `:699` |
| `typescript.utc-timestamps` | 1,200 B | when present | § 5 `:705` |
| `csharp.boundaries` | 1,400 B | when present | § 5 `:652` |
| `typescript.doctrine` | 4,700 B | E4 landed | § 5 `:700-703` (5,883 B after S0, so not before E4) |

Recorded in `research/module_rules.md` beside them: E5 and E6 gated rules carry no single-read cap and are measured and
recorded by their epics.

### The four declared gates (parent § 4.4 `:506-515`; all `epic: "E4"`)

| Rule | `path_tasks` | `reason` | cases |
|---|---|---|---|
| `csharp.definition-of-done` | implement, test, audit, release, policy | `a new requirement: a checklist is read at task completion, never on gpu, ui, storage or inspect (plan section 4.4)` | + `implement src/x.cs`; + `test src/x.cs`; − `gpu src/x.cs`; − `inspect src/x.cs` |
| `typescript.definition-of-done` | implement, test, audit, release, policy | the same text | + `implement ui/a.ts`; − `gpu ui/a.ts`; − `inspect ui/a.ts` |
| `typescript.boundaries` | implement, test, audit, ui, http | `applicability changed on purpose and approved in the plan (section 4.4): doctrine text that loaded on every .ts file now loads where output reaches a page or a wire; ui because the webview trap is a ui trap` | + `ui ui/a.ts`; + `implement src/webview/page.ts`; − `inspect ui/a.ts`; − `gpu ui/a.ts` |
| `csharp.boundaries` | implement, test, audit, ui, http | `a new requirement (R1's C# side and P6's large-identifier mirror): output reaches a page or a wire on these tasks (plan section 4.4)` | + `ui src/x.cs`; + `http src/x.cs`; − `inspect src/x.cs`; − `gpu src/x.cs` |

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 5.1 | the `oneRead: true` scopes | selected on the real catalog | each ≤ 32,768 B |
| 5.2 | the matrix | read | exactly the 22 pins above are `true`; every other single-read-task entry has a `why` ≥ 10 chars; no split-read entry is `true` |
| 5.3 | the matrix | D5 | no `ui` entry with a `.cs`, `.razor`, `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.mjs` or `.cjs` file is `true` |
| 5.4 | an inline entry `inspect package.json` with `oneRead: true` | `oneReadFindings` | `inspect package.json selects 35409 B, over the 32768 B read` |
| 5.5 | the real catalog | `capFindings(catalog, CAPS, LANDED_EPICS)` | `[]` |
| 5.6 | fixtures: a core of 15,356 B / a `typescript.npm-packages` of 3,501 B / a `typescript.doctrine` of 4,701 B with landed `[]` and with `["E4"]` | `capFindings` | one finding / one finding / `[]` and one finding |
| 5.7 | the real catalog, `GATES`, `LANDED_EPICS` | `gateFindings` (S1) | `[]` — the four entries are absent rules of an unlanded epic, their cases structurally valid |
| 5.8 | `GATES` | read | the four entries exactly as the table above |
| 5.9 | `tools/lib/parity-epics.mjs` | imported | `LANDED_EPICS` is a frozen empty array at E1 |

### Files

`tools/selection-matrix.mjs` (`ONE_READ`, `GATES`), `research/selection-matrix.json` (regenerated),
`tools/lib/parity-epics.mjs` (new), `tools/rules.test.mjs` (`:250-257` rewritten, `CAPS`, the gate test on real data),
`tools/selection-matrix.test.mjs`, `research/module_rules.md`, `research/module_tests.md`.

### Acceptance criteria

5.1–5.9; 22 `true`, 26 `why`; the caps and allowances in `research/module_rules.md`.

### RED → GREEN → RED

1. **RED.** The rewritten single-read test, 5.2–5.9 before filling the constants: 5.1 fails with `no oneRead scopes in
   research/selection-matrix.json — the single-read pin has nothing to check`; 5.2, 5.8, 5.9 fail on the missing data.
2. **GREEN.** Fill `ONE_READ`, `GATES`, write `parity-epics.mjs`, `--write`.
3. **RED again.** Flip `inspect package.json` to `true` → 5.1 fails (35,409 B); `ui ui/a.ts` to `true` → 5.3 fails while
   5.1 passes (32,303 B: D5, not the budget); drop the negative cases of `csharp.boundaries` → 5.7 fails; lower the core
   cap to 15,054 → 5.5 fails. Restore each.

### Docs to update

`research/module_rules.md`: `### The single-read list (D5 and § 5)` — the list is the `oneRead: true` entries, set in
the tool; the three test-held numbers (32,768 per pin, 15,355 core, 32,613 `gpu src/x.cs`); every other scope says why;
a scope leaves the list only by a decision with its number, never by a deletion (D1) — and `### Byte caps and
allowances (the plan's § 5)` with the two tables above and *each epic measures before its pull request and writes the
numbers here; an allowance it cannot keep goes to the owner with the numbers*. `research/module_tests.md`: the changed
and new tests.

### The brief (for the Sonnet coder)

**1.** `tools/selection-matrix.mjs`: fill `ONE_READ` with the 48 single-read-task names (`{ oneRead: true }` or
`{ oneRead: false, why }`, texts from the tables, numbers from F10); every split-read scope renders `"oneRead": false`
with no `why`. Fill `GATES` with the four entries (the S1 record shape: `declared: { path_tasks, reason }`, `epic`,
`cases` as `{ tasks: [t], files: [f], selected }`). `--write`; the diff shows 108 `oneRead`, 26 `why`, 4 gates.

**2.** `tools/lib/parity-epics.mjs`: `export const LANDED_EPICS = Object.freeze([]);` and a comment: *the last story of
each epic of todo/PLAN_node_rule_parity.md adds its id here in its own pull request; a planned item of a listed epic is
a red suite (plan § 4.1).*

**3.** `tools/rules.test.mjs`: the test at `:250-257` keeps its name, reads the matrix's `oneRead: true` scopes and
asserts at least one and `oneReadFindings` empty; add `CAPS` and `capFindings` (the table above), `the plan's byte caps
hold` (5.5) and the fixture case 5.6; add `every gated rule mirrors its source or is declared, and its selection cases
hold` running `gateFindings(loadCatalog(sourceRoot), matrix.gates, LANDED_EPICS)` (5.7). `tools/selection-matrix.test.mjs`:
5.2, 5.3, 5.8. A comment above the single-read test: the list is § 5's, set in the tool; a scope leaves it only with a
`why` (D1).

---

## E1.S3 — The parity inventory, matrix and consumers; the equality, inheritance and lock fixtures

- **Size.** L — three data files (30 entries, 30 rows, 8 consumers), two lock fixtures, three test files (≈ 600 lines).
- **Models.** Brief: Opus (below — the data decided here from the parent). Data and tests: a Sonnet coder. Review: Opus.
- **Goal.** Parent § 2 (`:146-180`), § 3, § 4.1 (`:266-332`), § 10 (`:785-808`), § 11 (`:825-847`): the inventory lists
  every requirement (P1–P20, R1–R5, G1–G5); the matrix holds one row per requirement; the tests prove one-to-one, real
  locations, the whitelist `['P4']`, the five per-side fields, equality by NORMALISED selection behaviour through the
  correspondence table, MANDATORY inherited from the nearest ancestor heading, structural `planned` rows with their
  epic, and no `planned` row past its epic; `research/consumers.json` equals `README.md` § *Consumers*; and G2's two
  lock fixtures are green.

### The schema

`research/parity-inventory.json` — `{ "note", "entries": [ { "id", "topic", "side", "status", "epic"?, "reason"?,
"scopedAbsences"? } ] }`: `side` `csharp|typescript|both`; `status` `counterpart|deliberately-absent|planned`; `epic`
exactly when `planned`; `reason` (≥ 20 chars) exactly when `deliberately-absent` — **the one home of every
deliberately-absent reason** (§ 4.1 `:269-270`, § 11 `:825-827`); `scopedAbsences` — `[ { "where", "reason" } ]` — for a
requirement that is met in one setting and deliberately absent in another (P5's plain JavaScript, § 18 finding 5; O4).

`research/parity-matrix.json` — `{ "note", "rows": [ { "inventory", "topic", "status", "epic"?, "reason"?, "strength",
"suppression", "csharp": <side>, "typescript": <side> } ] }`: `status` `planned|equal|stronger-ts|stronger-cs|
deliberately-absent`; `epic` exactly when `planned`; `reason` exactly when `stronger-*` (a `deliberately-absent` row
carries none — § 17 O2). A `<side>` is **present** `{ "id", "section" }`, plus, in an `equal` or `stronger-*` row, the
five fields — `selectors` `{ paths, path_tasks, tasks }`, `mood` `MUST|SHOULD`, `enforcement` `{ "class": "prose" }` |
`{ "class": "test", "test": "<path>" }` | `{ "class": "check", "tool": "<name>" }` | `{ "class": "hook", "hook": "<name>" }`,
`consequence` `none|test-fails|check-fails|build-fails|hook-refuses`, `suppression` `none|inline-with-reason`; or
**planned** `{ "planned": "E2".."E6", "id", "section"? }`; or **absent** `{ "absent": true }`.

`research/consumers.json` — `{ "note", "consumers": [ { "repo", "kind", "mount", "notes" } ] }`.

### The rules the matrix test enforces (`parityFindings`)

1. Inventory: ids `^[PRG][1-9][0-9]*$`, unique; `topic`; `side`, `status` from their sets; `epic`, `reason`,
   `scopedAbsences` (each `where` and `reason` ≥ 20 chars) as the schema says.
2. One-to-one: every entry exactly one row, every row an entry; equal `topic`.
3. A **present** side, in any row: `id` in the catalog, `section` one of its recorded sections (`research/rule-bodies.json`).
4. A **planned** side: `planned` ∈ E2–E6, `id` `^(common|csharp|rust|typescript)\.[a-z0-9-]+$`, `section` starting with
   `#` if given; not checked against the catalog. An absent side is exactly `{ "absent": true }`.
5. Row status: `planned` ⇔ some side planned and none absent, `epic` = the latest planned side's; `deliberately-absent`
   ⇔ some side absent, none planned, no `reason`; `equal`/`stronger-*` ⇔ both present with the five fields.
6. `STRONGER_EXCEPTIONS = ["P4"]` (a test-file constant citing § 2 and § 11): any other `stronger-*` row is a finding,
   with or without a reason; P4 needs a non-empty `reason`; an `equal` row carries none.
7. Inventory ↔ row: `counterpart` ⇔ `equal`/`stronger-*`; `deliberately-absent` ⇔ the row is; `planned` ⇔ the row is,
   same `epic`.
8. A `planned` row or entry whose epic is in `LANDED_EPICS` is a finding.
9. **Equality by normalised selection behaviour** (§ 4.1 `:274-282`), for every `equal` row. The correspondence table
   pairs representative file sets of § 4.1: none ↔ none; `src/x.cs` ↔ `ui/a.ts`, `src/a.mjs`, `src/webview/page.ts` (the
   source kind); `src/x.csproj` ↔ `package.json` (the project manifest). For each of the nine tasks and each pair, the C#
   side's rule is selected on its file set exactly when the TypeScript side's rule is selected on each corresponding
   file set (`selectRules`, so dependencies count); and the two sides' `path_tasks` agree as sets. The configuration
   kind (`Directory.Build.props`, `Directory.Packages.props`, `NuGet.Config` ↔ `tsconfig*.json`, `.npmrc`) is "a kind of
   its own whose requirements are stated per counterpart" (`:278-279`) and is not in the mechanical comparison (O3).
   Then `mood`, `enforcement.class`, `consequence` and `suppression` must be equal. Literal selector fields are never
   compared side to side.
10. **The manifest case** (§ 10 `:807-808`, P20): once `LANDED_EPICS` holds both E2 and E4, `dependencies --file
    package.json` and `dependencies --file src/x.csproj` must each select the three kinds — `common.dependencies`; the
    ecosystem's package rule (`typescript.npm-packages` ↔ `csharp.nuget-packages`); the stack's doctrine
    (`typescript.doctrine` ↔ `csharp.doctrine`). Before that it runs on the fixture of 3.15 only, and the real-data test
    says so in a diagnostic.
11. **Against reality** (every side of an `equal`/`stronger-*` row): `selectors` equal the rule's catalog `paths`,
    `pathTasks`, `tasks` as sets; `mood` is `MUST` exactly when the nearest heading carrying `(MANDATORY)` exists among
    the section's own heading and its ancestors — each preceding heading of a lower level, up to the H1 (§ 4.1
    `:284-287`, § 17 O6); `check` → `tools/<tool>.mjs` exports a `CHECKED_RULES` array holding the side's id (E3's
    `tools/strictness-check.mjs` provides it); `hook` → `settings/hooks/<hook>.mjs` exists; `test` → the named file exists.

### The data (decided here from the parent; copy exactly)

At E1 every row is `planned` or `deliberately-absent`. CD = `csharp.doctrine`, TD = `typescript.doctrine`, NP =
`csharp.nuget-packages` in this table only.

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
| P9 | csharp | package approval, freshness, licence, pins | present NP `## Before adding any package` | planned E2 `typescript.npm-packages` | planned | E2 |
| P10 | csharp | the test runner and its exit code | present `common.testing` ``## Running tests — executables only, never `dotnet test` (MANDATORY)`` | planned E6 `typescript.testing` | planned | E6 |
| P11 | csharp | layer rules are a test | present `common.testing` `## Architecture is a test, not a review comment` | planned E6 `typescript.testing` | planned | E6 |
| P12 | csharp | the logging library and its shape | present `common.logging-serilog` `## The shape (C#)` | planned E6 `typescript.logging` | planned | E6 |
| P13 | csharp | cancellation, timeouts and shutdown | present `common.reliability` `### A timeout is not a cancellation — and .NET spells them the same` | planned E5 `typescript.lifecycle` | planned | E5 |
| P14 | csharp | secrets outside the source | present `common.security` `## Secret management` | planned E6 `common.security` `## Secret management` | planned | E6 |
| P15 | csharp | a timed-out child takes its tree with it | present `common.security` `## External processes` | planned E5 `typescript.lifecycle` | planned | E5 |
| P16 | csharp | instants are UTC; a calendar day is stamped | present `common.utc-timestamps` `## The rule` | planned E6 `typescript.utc-timestamps` | planned | E6 |
| P17 | csharp | limits counted in encoded bytes | present `common.platform-limits` `## 1. A platform limit is the KERNEL's number, in the KERNEL's unit — and one adapter owns it` | planned E6 `common.platform-limits`, the same section | planned | E6 |
| P18 | csharp | HTTP route groups and route coverage | present `common.http-contracts` `## Where the files live` | planned E6 `common.http-contracts`, the same section | planned | E6 |
| P19 | csharp | the published package registry is checked after a release | present `common.post-deploy-checks` `## What "prod" is, per repository — and nobody is exempt` | planned E6 `common.post-deploy-checks`, the same section | planned | E6 |
| P20 | csharp | which files select the language rules | present CD `# C# doctrine — the family's code rules` | planned E4 TD (no section) | planned | E4 |
| R1 | typescript | data serialised into a script element | planned E6 `csharp.boundaries` | present TD ``## 1. Never interpolate into a `<script>` element with `JSON.stringify` (MANDATORY)`` | planned | E6 |
| R2 | typescript | a fixture cast hides a shape | planned E6 `csharp.testing` | present TD ``## 3. An `as` cast is a promise to maintain a shape by hand — and it comes due silently`` | planned | E6 |
| R3 | typescript | a Definition of Done | planned E4 `csharp.definition-of-done` | planned E4 `typescript.definition-of-done` | planned | E4 |
| R4 | typescript | the compiler emits despite errors | absent | present TD ``## 4. `tsc` emits despite errors — so a green suite can be green against stale output`` | deliberately-absent | — |
| R5 | typescript | a backtick ends a template literal | absent | present TD `## 2. A backtick inside a template literal ends it — including inside a comment` | deliberately-absent | — |
| G1 | both | an analyzer or lint requirement | present CD `## 1. Language & runtime` | planned E3 `typescript.compiler-strictness` | planned | E3 |
| G2 | both | a committed lock file and a locked restore | planned E2 NP (the lock-file mechanics, § 4.5) | planned E2 `typescript.npm-packages` | planned | E2 |
| G3 | both | a vulnerability scan on the monthly bump | planned E2 `common.dependencies` | planned E2 `common.dependencies` | planned | E2 |
| G4 | both | coverage thresholds | absent | absent | deliberately-absent | — |
| G5 | both | CI steps per language | absent | absent | deliberately-absent | — |

Reasons (inventory only): **P8** `no Node counterpart: the rule exists for a measured MSBuild worker-pool problem Node
builds do not have; a hook is added for a measurement, not for symmetry, and Node's enforced rule is P2's check (plan
section 3.1 P8, section 4.6)`; **R4** `no C# counterpart needed: the C# compiler emits nothing on an error; the
TypeScript rule states it as a difference, not a gap (plan section 3.2 R4)`; **R5** `no comparable C# trap: a raw
string literal cannot be ended by a shorter run of quotes (plan section 3.2 R5)`; **G4** `deliberately absent on both
sides: the testing rule governs what a test may claim, and a coverage number is gamed the week it lands (plan section
3.3; the owner confirms in Q10)`; **G5** `deliberately absent as shared rules: each repository's own instructions and CI
name the exact commands, and a shared list would be an inventory (plan section 3.3)`. P5's `scopedAbsences`: where
`a repository with no TypeScript project (plain JavaScript only)`, reason `nothing checks a type there: the typed parts
(branded domain types, typed results) are absent, and the doctrine's JavaScript paragraph states the enforceable subset
(plan section 3.1 P5, section 18 finding 5)`.

`strength` (short, from § 3): P1 `prose, selected on every language file and its project manifest`; P2 `file and check
on both sides (tools/strictness-check.mjs, both halves)`; P3 `raised on both: Nullable enable and strictNullChecks
inside strict`; P4 `C#: prose; TypeScript: lint-enforced (complexity 4, max-lines-per-function 50, max-lines 800,
no-console); the one accepted exception, Q7`; P5 `prose and prose; in plain JavaScript inside a TypeScript project by
checkJs`; P6 `prose and prose in the gated boundaries pair; both name the exact and the lossy readers`; P7, P11 `prose
and prose`; P8 `C#: hook and check for a measured resource problem; Node: none`; P9 `prose and prose, each selected by
its own package configuration; the shared part on --task dependencies`; P10, P12, P13, P16 `prose and prose; gated on
their source rule's tasks`; P14 `always core, equal`; P15 `always core, equal; the asymmetry stated (Node has no tree
kill)`; P17 `one clause in the same sentence`; P18 `rows and rows; the route table through --routes`; P19 `one word in
the same list`; P20 `selector and selector, symmetric through the correspondence table`; R1 `MANDATORY and MANDATORY;
the declared boundaries gate on both sides`; R2 `prose and prose; typed-fixture discipline side by side`; R3 `a gated
Definition of Done on both sides, the same declared gate`; R4, R5 `TypeScript: prose; C#: none needed`; G1 `C#: the
compiler at TreatWarningsAsErrors with Nullable enable; TypeScript: lint at zero warnings; both checked`; G2 `a
committed lock and a locked restore on both sides (packages.lock.json and locked mode; package-lock.json and npm ci)`;
G3 `the same sentence for every ecosystem`; G4, G5 `none on either side`. `suppression`: P2, P4, G1 `plan section 3.4:
inline only, with the rule or warning id and a same-line reason; no baseline on either side`; every other row `none: a
prose rule has nothing to suppress`.

`research/consumers.json` (F11; kinds from `:322-327`), README order: `dew_flow_rag_qln` dotnet `.claude/rules/shared`;
`dew_flow_mcp` dotnet `.claude/rules/shared`; `dew_flow_sidecar_rust` rust `.claude/rules/shared`; `dew_flow_benchmark`
dotnet `.agents/conventions`; `dew_flow_creds_for_devs` mixed `.claude/rules/shared`; `dew_flow_connect_other_ais` mixed
`.agents/conventions`; `wsl_care` mixed `.agents/conventions`; `dew_flow_vscode_kit` typescript `.agents/conventions`.
`notes`: `mount read from the local checkout's .gitmodules, 2026-10-31`, plus for `dew_flow_sidecar_rust` `the check
passes without opinion; wired only if Q8 says every consumer does`. The coder re-reads each `.gitmodules` and reports a
difference.

### The lock fixtures (F12)

- `tools/fixtures/locks/npm-unsatisfied/`: `package.json` `{"name":"probe","version":"1.0.0","private":true,
  "devDependencies":{"picomatch":"4.0.6"}}` and a `package-lock.json` (`lockfileVersion` 3) whose root and
  `node_modules/picomatch` entries say `4.0.7`. The test copies it into an owned folder and runs
  `npm ci --ignore-scripts --offline` (timeout `GUARD_MS`, `npm_config_cache` set to an owned folder): exit 1, stderr
  `/EUSAGE/` and `/does not satisfy picomatch@4\.0\.6/`.
- `tools/fixtures/locks/nuget-stale/`: `lib/lib.csproj` and `app/app.csproj` (`Microsoft.NET.Sdk`,
  `RestorePackagesWithLockFile` true, no package references), `Directory.Build.rsp` holding `-nr:false`
  (`csharp/dotnet-build.md`), and the target framework written by the test as `net<major>.0` from `dotnet --version`,
  so any installed SDK runs it. The test copies it into an owned folder; `dotnet restore -m:4 --disable-build-servers` in
  `app/` writes the lock; it adds `<ProjectReference Include="../lib/lib.csproj" />` to `app.csproj`; `dotnet restore
  --locked-mode -m:4 --disable-build-servers` → exit 1 with `/NU1004/`; `dotnet restore --force-evaluate -m:4
  --disable-build-servers` then `--locked-mode` → exit 0. Environment: `DOTNET_CLI_TELEMETRY_OPTOUT=1`,
  `DOTNET_NOLOGO=1`, `NUGET_PACKAGES` an owned folder. Where `dotnet` does not resolve, the test is skipped with
  `t.skip("no dotnet SDK on PATH — the NU1004 fixture needs one")`, never passed (O6).

### Scenarios

| # | Given | When | Then |
|---|---|---|---|
| 3.1 | the real files, catalog, sections, `LANDED_EPICS` | `parityFindings` | `[]` |
| 3.2 | a minimal positive fixture: a fake catalog `csharp.x` (paths `**/*.cs`, `path_tasks` implement), `typescript.y` (paths `**/*.ts`, `**/*.mjs`, `path_tasks` implement), both with a section `## One` under an H1 marked `(MANDATORY)`; one `equal` row, five fields each | | `[]` — **the equality-normalisation pass**: literal paths differ, behaviour corresponds |
| 3.3 | the same with `typescript.y` lacking `**/*.mjs` (so `src/a.mjs` does not select it while `src/x.cs` selects `csharp.x`) | | a finding naming the task and the pair — **the mismatch that fails** |
| 3.4 | `typescript.y` gated `implement,test` | | a finding: the gates disagree |
| 3.5–3.7 | an entry with no row / a row with no entry / two rows | | one finding each |
| 3.8 | an `equal` row naming `csharp.missing` / `## Gone` | | one finding each — the ACTIVATED-row red of E1's done-when |
| 3.9 | a `planned` row with no `epic` / `E9` / a planned side `E1` | | one finding each — the no-owning-epic red |
| 3.10 | a planned row whose planned side names an absent id / whose present side names a missing section | | `[]` / a finding |
| 3.11 | `stronger-ts` on `P2` with a reason, and without / on `P4` without a reason / an `equal` row with a reason | | one finding each; `P4` with a reason passes |
| 3.12 | sides differing in `mood` / `enforcement.class` / `consequence` / `suppression` | | one finding each |
| 3.13 | against reality: `selectors.paths` ≠ the catalog's / `check` naming a missing tool / a tool whose `CHECKED_RULES` lacks the id / `hook` naming no file | | one finding each (tool and hook files in an owned folder) |
| 3.14 | **heading inheritance**: `mood: "MUST"` for `common.reliability` `### A timeout is not a cancellation — and .NET spells them the same` (real sections); `mood: "SHOULD"` for `common.testing` `## Every feature ships with tests, in the same task` (no marker on it or the H1 `# Testing`); and each flipped | `isMandatory` / rule 11 | the two pass; each flip is a finding |
| 3.15 | **the manifest case** on a fake catalog with `common.dependencies` (tasks dependencies), `csharp.nuget-packages` (`**/*.csproj`), `typescript.npm-packages` (`**/package.json`), the two doctrines (`**/*.csproj` / `**/package.json` among their paths), landed `["E2","E4"]` | rule 10 | `[]`; with `typescript.doctrine` lacking `**/package.json`, a finding |
| 3.16 | `deliberately-absent` with a `reason` / with no absent side / an absent side in an `equal` row | | one finding each |
| 3.17 | entry `counterpart` beside a `planned` row / epic mismatch / `deliberately-absent` without `reason` / a `scopedAbsences` item with a 5-char reason | | one finding each |
| 3.18 | a row planned for E3 with landed `["E3"]` | | one finding |
| 3.19 | `research/consumers.json` and `README.md` | the backticked first cells of the `## Consumers` table | equal sets, 8; kinds in their set |
| 3.20 | consumers missing one / with one extra / kind `java` | | one finding each |
| 3.21 | the npm lock fixture | `npm ci --ignore-scripts --offline` | exit 1, `EUSAGE`, `does not satisfy picomatch@4.0.6` |
| 3.22 | the NuGet lock fixture | the four restores | exit 0; exit 1 with `NU1004`; exit 0; exit 0 |

### Files

`research/parity-inventory.json`, `research/parity-matrix.json`, `research/consumers.json`,
`tools/fixtures/locks/npm-unsatisfied/*`, `tools/fixtures/locks/nuget-stale/*`, `tools/parity-matrix.test.mjs`,
`tools/consumers.test.mjs`, `tools/lock-fixtures.test.mjs` (all new); `research/module_rules.md`,
`research/module_tests.md`.

### Acceptance criteria

3.1–3.22 pass (3.22 observed on a machine with an SDK; its output in the commit body); 30 entries, 30 rows, 8 consumers.

### RED → GREEN → RED

1. **RED.** The tests first: 3.1 fails `research/parity-inventory.json is missing`; 3.19 `research/consumers.json is
   missing`; 3.21/3.22 fail on the missing fixture folders. The fixture cases carry `parityFindings` in the same file and
   pass with it.
2. **GREEN.** The files and fixtures.
3. **RED again on real data** (E1's "observed, then fixed"): P10's row set `equal` with both sides present and the five
   fields, its C# `id` → `common.testng` → 3.1 names it; P13's `epic` removed → named; P2 `stronger-ts` with a reason →
   the whitelist finding; the G3 row removed → named. On the fixtures: change the NuGet fixture's expectation to exit 0 →
   3.22 fails with NU1004's text; change the npm fixture's lock to `4.0.6` → 3.21 fails (the install proceeds and fails
   offline for another reason, or passes — either way not `EUSAGE`). Restore each.

### Docs to update

`research/module_rules.md` — `## The parity matrix (todo/PLAN_node_rule_parity.md § 3, D12)`: the files, the side
shapes, the eleven rules in one paragraph each sentence long, the correspondence table, *the deliberately-absent reasons
are the inventory's — the one home; this document keeps no copy*; `### The consumers` — derived from `README.md`
§ *Consumers*, which stays the one list. `research/module_tests.md` — the three test files and what they do not prove
(that a present location's text meets its requirement — the review's; the configuration kind's correspondence, stated
per counterpart).

### The brief (for the Sonnet coder)

**1.** The three files from the tables (`JSON.stringify(…, null, 2)`, trailing newline, P1…P20, R1…R5, G1…G5); ids
written out; sections copied from `research/rule-bodies.json`, any difference reported. Each `note`: the machine-readable
form of the plan's § 3 (plain text `todo/PLAN_node_rule_parity.md`), what its test keeps true, and that an owning epic
activates its rows in the commit that writes their text.

**2. `tools/parity-matrix.test.mjs`** — `parityFindings({ inventory, matrix, catalog, sectionsById, landedEpics, root })`
as a plain function with small helpers (`sideShape`, `epicNumber`, `behaviour(catalog, id)` — the selected/not-selected
grid over the correspondence pairs × nine tasks, `isMandatory(sections, section)` — walk back from the section to each
preceding heading of a lower `#` level up to the H1, true when one carries `(MANDATORY)`, `checkedRules(root, tool)` — a
dynamic `import()` whose missing file or export is a finding). The correspondence pairs and `STRONGER_EXCEPTIONS` are
constants with a comment citing the plan. Real data: `loadCatalog(sourceRoot)`, `research/rule-bodies.json`,
`LANDED_EPICS`. Fixtures: a factory, `structuredClone` per case, `ownedDir(t, "parity matrix")` for tool and hook files.

**3. `tools/consumers.test.mjs`** — parse `README.md`'s `## Consumers` table; compare; 3.20 inline.

**4. `tools/lock-fixtures.test.mjs`** — 3.21 and 3.22 as described, each fixture copied into `ownedDir(t, "lock
fixture")` (`fs.cpSync`), every child through `spawnSync` with `timeout: GUARD_MS` and a cleared environment plus the
named variables and `PATH`; the skip only when `dotnet --version` fails to run.

---

## E1.S4 — The moved-block manifest: exact whole-line ranges, immutable, checked without history

- **Size.** L — a tool and a library (≈ 350 lines), a self-test (≈ 350 lines), 25 recorded entries.
- **Models.** Brief: Opus (below). Code, tests, the recording: a Sonnet coder. Review: Opus.
- **Goal.** Parent § 4.3 (`:363-430`), § 4.1 (`:302-314`), § 10 (`:785-786`, `:798-799`), E1 (`:1147-1160`), ledger 1.2,
  2.4: `research/moved-blocks.json` holds one entry per exact whole-line range — `source`, `lines`, `beforeCommit`,
  `sha256`, `length`, `destination` — recorded once by `tools/moved-blocks.mjs --record` from `git show <commit>:<source>`
  at E1's recording commit in the post-split numbering; the recorder REFUSES a range that is not whole lines or that
  would split a fence, naming S0b as the remedy; the test reads no history (CI stays at `fetch-depth: 1`); the manifest
  is immutable and append-only.

### The entry, and what the test checks

`{ "note", "entries": [ { "id", "status": "planned|landed", "epic": "E2".."E6", "source", "lines": "<from>-<to>",
"beforeCommit", "sha256", "length", "destination", "supersedes"? } ] }`.

- The block is lines `from`–`to` of the source at `beforeCommit`, CRLF folded (`folded`), each line ending in `"\n"`.
- **`--record` refuses** (exit 1, nothing written): a range not matching `^[1-9]\d*-[1-9]\d*$` with from ≤ to — any
  column form such as `32:1-33:14` included — with `a move is whole lines; split the line by whitespace first (E1.S0b)`;
  a range where the line before `from` ends inside a fence, or line `to` ends inside one (F6's rule), with `the range
  would split a fenced block; move the whole fence or split by whitespace first (E1.S0b)`; lines past the end at that
  commit; an unknown commit; an existing id; an unknown `--supersedes`.
- **Schema**: `id` `^[a-z0-9][a-z0-9-]*$` unique; `status`, `epic` from their sets; `source`/`destination` relative paths
  under `common/`, `csharp/`, `rust/`, `typescript/`, ending `.md`; `lines` as above; `beforeCommit` 40 hex; `sha256` 64
  hex; `length` > 0; `supersedes` an EARLIER id.
- **`planned`**: the epic not in `LANDED_EPICS`; the source holds exactly one run of `length` bytes hashing to `sha256`
  that starts at a line start — anywhere in the file (E4's § 0 may land above § 1), while any edit of those bytes is red
  (§ 4.1 `:306-309`).
- **`landed`**: the destination holds exactly one such run at a line start; the source holds none (a move, not a copy).
  `status` moves once, `planned` → `landed`, in the owning epic's move commit; no other field ever changes.
- **Superseded** entries are evidence only. **No git call in the test.**

### The 25 entries

Exactly F9's table, one entry per range, recorded from ONE commit after S0 and S0b. Ids: `testing-runner`,
`testing-runner-rust`, `testing-architecture`, `reliability-scope`, `reliability-fire-and-forget`,
`reliability-sweep-at-start`, `reliability-token`, `reliability-signals`, `reliability-timeout`, `logging-colour`,
`logging-shape`, `logging-rust`, `utc-csharp-fence`, `utc-rust`, `ts-script`, `ts-script-box`, `ts-backtick`, `ts-cast`,
`ts-tsc`, `ts-boxes-testing`, `nuget-before`, `nuget-licence`, `nuget-bumping-heading`, `nuget-bumping-cadence`,
`nuget-prefer` — in F9's order (the reliability ranges in line order: `49-54`, `55-59`, `66-69`, `97-98`, `99-102`,
`104-133`).

### Scenarios

Fixtures in `ownedDir(t, "moved blocks")`; `--record` cases build a git repository there with `gitWith({timeoutMs:
GUARD_MS})` and a fixed identity. The sample source: six lines (line 3 carries `é`, line 4 indented two spaces), then a
fenced block (`` ```js `` / one line / `` ``` ``) as lines 8–10.

| # | Given | When | Then |
|---|---|---|---|
| 4.1 | the sample committed | `--record src.md 2-4 <commit> --destination common/d.md --epic E4 --id m1` | one `planned` entry; full 40-hex `beforeCommit`; `length`/`sha256` of lines 2–4, `é` as 2 bytes — **the exact-range fixture** |
| 4.2 | the same | `--record src.md 8-10 …` | recorded (the whole fence) |
| 4.3 | the same | `--record src.md 7-9 …` / `9-11 …` | refused, the fence message — **the fence-balanced refusal** |
| 4.4 | the same | `--record src.md 2:1-4:5 …` | refused, the whole-lines message naming E1.S0b — **the mid-line refusal** |
| 4.5 | `m1` present | `--id m1` again / `--supersedes nosuch` / `4-2` / past the end / an unknown commit | each refused; the file byte-identical |
| 4.6 | three entries, a fourth with `--supersedes m1` | the file before and after | the first three byte-identical — append-only |
| 4.7 | `planned m1`, source unchanged / two lines inserted above / one byte of the block changed | `verify` | none / none / a finding |
| 4.8 | `planned m1` whose epic is landed | | a finding |
| 4.9 | `landed m1`, block cut and appended to the destination / twice / mid-line / one byte changed / destination absent / CRLF destination / block still in the source | | none / finding / finding / finding / finding / none / copy finding |
| 4.10 | `m1` superseded by `m3` | | `m1` not checked; `m3` checked |
| 4.11 | schema faults (bad id, duplicate, `E9`, `status: "moved"`, 7-hex commit, `length: 0`, destination outside the rule folders, `supersedes` naming a later entry) | | one finding each |
| 4.12 | a copy of a fixture with no `.git` | `verify` | the same results — no history read |
| 4.13 | the real manifest, tree, `LANDED_EPICS` | `verify` | no findings; 25 entries, all `planned` |
| 4.14 | the real `ts-script` | its hash against lines 15–48 of `git show <S0's parent>:typescript/doctrine.md`, by hand | different — the evidence is the anonymised text; both hashes in the commit body |
| 4.15 | `node tools/moved-blocks.mjs` | | exit 0, `moved-blocks: OK — 25 entries, 25 planned, 0 landed` |

### Files

`tools/moved-blocks.mjs`, `tools/lib/moved-blocks.mjs`, `tools/moved-blocks.test.mjs`, `research/moved-blocks.json`
(new); `tools/lib/rule-body.mjs` (one export, below); `research/module_rules.md`, `research/module_tests.md`,
`README.md` § *tools*. `.github/workflows/ci.yml` does not change.

### Acceptance criteria

4.1–4.15; the 25 entries equal F9 (any printed length that differs is reported, not recorded over); the recording commit
is after S0b's; `node tools/rule-bodies.mjs` still OK after the `rule-body.mjs` change (no recorded heading list moves).

### RED → GREEN → RED

1. **RED.** The test first: `Cannot find module …/lib/moved-blocks.mjs`.
2. **GREEN.** The library, the tool, the fixtures; record the 25; 4.13, 4.15.
3. **RED again.** Drop the fence check → 4.3 passes wrongly (fails as a test); accept column ranges → 4.4 fails; use
   recorded line numbers in the planned check → 4.7's middle case fails; skip the copy check → 4.9's last fails; let
   `--record` re-serialise the array → 4.6 fails; edit a byte of `common/reliability.md:110` → 4.13 names
   `reliability-timeout`. Restore each.

### Docs to update

`research/module_rules.md` — `## Moves`: the manifest's role and immutability; whole lines only, fences unsplit, S0b's
whitespace splits as the remedy and the source of the post-split numbering (S0 for § 1's anonymised hash); the planned
and landed checks; the two commands; why it differs from `research/rule-bodies.json`; that CI's depth-1 checkout is
enough. No table of entries — the JSON is the record. `research/module_tests.md` — the test and what it does not prove
(that no entry was ever edited — the diff and review are the control; that the moved text reads correctly in its new
place). `README.md` § *tools* — one row.

### The brief (for the Sonnet coder)

**1. `tools/lib/rule-body.mjs`** — add `export function fenceDepth(text)` → an array, per line of the folded text, of
`true` when the line ENDS inside an open fence (the opener counts as inside, the closer as outside), computed with the
existing `FENCE_OPEN`/`FENCE_CLOSE` exactly as `outsideFencedBlocks` walks; refactor `outsideFencedBlocks` to use it only
if no output changes (`node tools/rule-bodies.mjs` OK, the rule-body tests green); otherwise leave it as it is.

**2. `tools/lib/moved-blocks.mjs`** — imports `node:fs`, `node:path`, `node:crypto`, `folded` and `fenceDepth` from
`./rule-body.mjs`. Exports `parseRange(text)` (the whole-lines grammar; throws the S0b message), `blockOf(text, from, to)`,
`fenceSplit(text, from, to)` (true when the line before `from` or line `to` ends inside a fence), `runsAt(text,
{length, sha256})`, `schemaFindings(manifest)`, `verifyEntry(root, entry, {superseded, landedEpics})`,
`verifyManifest(root, manifest, landedEpics)`; messages start `` `${entry.id}: ` ``.

**3. `tools/moved-blocks.mjs`** — no argument: verify (`LANDED_EPICS` from `./lib/parity-epics.mjs`; the OK line of 4.15,
exit 0/1). `--record <source> <from>-<to> <commit> --destination <path> --epic <En> --id <id> [--supersedes <id>]`:
`git rev-parse --verify <commit>^{commit}` and `git show <full>:<source>` through `gitOutput` of `./lib/git.mjs`; every
refusal of the entry section; append the entry as `planned` by inserting its text before the closing `]` of the file's
text — never by re-serialising the parsed array; the result must parse; temporary file and rename. Export
`main(argv, root)` for the fixtures. Unknown arguments: usage, exit 2.

**4. Record the 25** after S0b is committed: `C=$(git rev-parse HEAD)`, then one `--record` per row of F9, e.g.
`node tools/moved-blocks.mjs --record common/testing.md 32-33 $C --destination rust/testing.md --epic E6 --id
testing-runner-rust`. Start the file as `{\n  "note": "<note>",\n  "entries": [\n  ]\n}\n`; the note: *Historical
evidence of every block todo/PLAN_node_rule_parity.md moves out of a rule (D1: word for word), one entry per exact
whole-line range. Recorded once by tools/moved-blocks.mjs --record; never edited — a later move or edit appends an
entry that supersedes, and status moves once, planned to landed. The test reads no git history.* Then 4.14 by hand.

**5.** The docs as above; the `README.md` row: `tools/moved-blocks.mjs` | the evidence that a moved block is word for
word (D1) — whole-line ranges in an immutable manifest, checked without history | `node tools/moved-blocks.mjs`,
`--record …` (this repository only).

---

## Warnings for every coder of this epic

- **No rule file changes in E1 except S0's wording and S0b's whitespace.** `node tools/rule-bodies.mjs` prints OK with 39
  rules after every story.
- **Temporary folders only through `ownedDir`**; the guard run by `npm test` refuses `mkdtemp`, `os.tmpdir()`, a bare
  `git worktree add`, and a `dotnet`/`npm` write anywhere but an owned copy.
- **Keep `normalized.filter(file=>match(file))` byte for byte** (F4).
- **No product or repository name** in a rule; data files cite the plan as plain text; `research/consumers.json` names
  repositories because it is the derived index of `README.md` § *Consumers*.
- **Stage by path**, read `git diff --staged --stat`, one commit per story, the observed numbers in the body.
- **Report both observations** of every RED step, and the runner's totals with the six known janitor failures named.

## Open points — classified; none decided in the stories

Epoch 3 has 0 changes; a second would stop the plan. Each point says whether it is a change (by
`common/plan-change-control.md` § *What counts as a change*) in this writer's judgement — the coordinator judges.

- **O1 — `typescript/testing.md`'s gate has no admissible form. CHANGE.** Its first text is the doctrine's § 2–§ 4
  (§ 4.3 `:424`), whose source `typescript/doctrine.md` has no `tasks:` — so by the provenance rule it mirrors as "no
  gate" (`:405-408`), yet § 4.3 gives it `implement, test, audit, policy, release`. That is an applicability change, and
  "a change of applicability is approved explicitly in this plan (§ 4.4 names the four)" (`:409-410`); § 4.4 (`:506-515`)
  and T11 (`:754`) name only the two `boundaries` and two `definition-of-done` files. E1 is not blocked (it declares the
  four); E4.S2 will be refused by S1's check when it creates the file. Either a fifth approved declaration or an ungated
  `typescript/testing.md` (which changes § 5's numbers for every `.ts` single-read scope).
- **O2 — the new TypeScript mechanics files declare, not mirror. NOT a change.** `typescript/lifecycle.md`,
  `typescript/logging.md`, `typescript/utc-timestamps.md` (and the E6 Node runner text in `typescript/testing.md`) are
  new requirements — no existing rule text — so `:408-409` makes them DECLARED with a reason (no plan approval needed for
  a new requirement), while § 4.4 `:514` says "every other gated file mirrors its source's `tasks:` line". The gates
  themselves are § 4.3's; only `:514` and T11's "(the two `definition-of-done` files, the two `boundaries` files)"
  undercount. A repaired sentence; E5/E6 declare them.
- **O3 — the configuration kind is outside the mechanical equality test. NOT a change, if the reading holds.** § 4.1
  (`:277-281`) maps `Directory.Build.props`/`Directory.Packages.props`/`NuGet.Config` ↔ `tsconfig*.json`/`.npmrc` as "a
  kind of its own whose requirements are stated per counterpart", then compares "the selected-scope sets … row for row
  under the table". Compared mechanically, P2 (the doctrine on the C# side, `compiler-strictness` on `tsconfig.json`)
  and P9 (`NuGet` on `Directory.Build.props` against `npm-packages` on `.npmrc` but not `tsconfig.json`) could never be
  `equal`. S3's rule 9 leaves the configuration kind out of the mechanical comparison; if "stated per counterpart" is
  meant as a per-row mapping the test should check, the matrix needs a field the plan does not define — that would be a
  change.
- **O4 — P5 is `equal` in one setting and deliberately absent in another. NOT a change.** § 3.1 P5 and § 18 finding 5
  (`:194`, `:1098`) put both on one requirement; one inventory status cannot hold both, so S3 adds an optional
  `scopedAbsences` field that carries the plain-JavaScript reason in the inventory, as § 18 says. An implementation of
  the plan as written; a separate inventory id would be the change.
- **O5 — § 5's "none fits today" is not true for two scopes. NOT a change.** `:693-697` says every unpinned scope that
  fits after the plan is over today; `gpu --file src/a.mjs` (27,680 B) and `storage --file src/a.mjs` (29,406 B) fit
  today. Both have their reasons in § 5's own rows (`:656-657`), and S5 records them as `why`. A repaired sentence.
- **O6 — the NU1004 fixture needs a .NET SDK; CI installs none explicitly. NOT a change, if a visible skip is accepted.**
  `.github/workflows/ci.yml` sets up Node only; S3's fixture writes its target framework from whatever SDK resolves
  (`net<major>.0`) and needs no package source (F12), so it runs on any runner image that ships an SDK, and is a named
  `t.skip` where none resolves. If E1's done-when requires the fixture to RUN in CI, a `setup-dotnet` step joins E1's
  scope — a scope change.
- **O7 — the lock fixtures belong to no listed E1 story. NOT a change.** E1's done-when (`:1169`) requires them; its story
  list (`:1130-1162`) assigns them nowhere; S3 (which owns G2's row) carries them.
- **O8 — the gate declarations are listed under both S4 and S5. NOT a change.** `:1159-1160` (S4) and `:1162` (S5); S5
  carries them.
- **O9 — stale sentences, all repaired references. NOT a change.** The status paragraph still says "epoch 2 is open at 0
  changes" (`:17`); § 4.4 (`:492-496`) lists S0's replacements without the two O8 added (E1 `:1132-1134` has them);
  § 4.3 (`:365-366`) and E1 (`:1148`) give `--record` without its destination, epic and id arguments; § 7 (`:732`)
  projects "≈ 14" move entries where F9 counts 25 (the count is the manifest's, `:391`).
