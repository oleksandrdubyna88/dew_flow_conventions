# PLAN — agent-models mod, E2: the complete self-install

> Status: **built 2026-11-11 on `feat/agent-models-mod-e2` (760a6a9, 1cd74bd, bc3d04e), the coai code round
> `proceed` and an Opus review; review fixes in progress; not merged yet, and it promotes with its parent.** Stories of epic E2 of
> [PLAN_agent_models_mod.md](PLAN_agent_models_mod.md) (§ *Epics*, E2), written by Opus when the epic started. Scope:
> the writing installer modules `agent-models-swap.mjs` and `agent-models-install.mjs`, the registration in
> `~/.claude/settings.json`, the third session-start step `ensureAgentModelsMod` in `ensure-user-guard.mjs` with its
> said-once lines, their tests, `research/module_rules.md` and `research/module_tests.md`. This document keeps no change
> ledger: a change to E2's approved work is an entry in the parent's `## Plan changes`. One story is a cornerstone and is
> marked `model: fable` (E2.S2); the parent's ledger line counts it.

Done when (the parent's E2): every new case of the test plan was watched RED, then green. The step installs, upgrades,
registers, skips and refuses as Design B says, and the reported file stays one file. The guard and effort steps still
run when the mod step throws. `npm test` and `npm run check` are green. The research docs describe the step as built,
with the CI and Sonar gaps. The pull request of build-order step 6 is merged after the code round and the Opus review.

```bash
npm ci --ignore-scripts          # only when node_modules is missing
node --test <the story's test files>
npm test
npm run check
node tools/adapter-check.mjs
node tools/plan-lifecycle.mjs
```

## The mirror rule (every story)

Every commit that changes a file under `settings/hooks/**` copies the same bytes to `.claude/hooks/**` in the SAME
commit, as #158 did. This repository's own session start imports `.claude/hooks/**`, and `tools/adapter-check.mjs`
(`referenceHookFiles`, `:44`) demands a verbatim copy of every `settings/hooks/**/*.mjs` that is not a test. So
`node tools/adapter-check.mjs` is red between the edit and the copy, and green after it. Check each copy with `cmp`.

## Gates, models, branch

- **Branch** `feat/agent-models-mod-e2`, made from `248065d`, where E1 is complete. One commit per story.
- **Gates.** `open` with `callerModel`; `review_code` over E2's commits with this document and the parent as
  `planText`, `baseRef` = `248065d`. The Opus review runs at the same time. A reply's `commands` are followed and named.
- **Models.** Scenarios and briefs: Opus (this document) for E2.S1 and E2.S3; **Fable** for E2.S2. Code and tests: a
  Sonnet coder per story. Review: Opus. Fixes: Sonnet.

## Facts (read 2026-11-11 in this worktree and in the source port)

The source port is `…/scratchpad/k-repo/` (E1's F6: it lives only in the session scratchpad; if it is gone, the coder
stops and asks the caller).

- **F1 The two write roads of settings.json here** (`settings/hooks/lib/user-guard-install.mjs`). The guard's road:
  `install` `:313` resolves the write target with `settingsFileOf` (`:319`, defined `:472`), backs up with the private
  `writeBackup` (`:332`, `:203`), runs `beforeWrite` (`:333`), re-checks with `changedUnderUs` (`:334`, defined `:458`:
  the bytes AND `settingsFileOf(...).file`), writes with the private `writeSettings` (`:342`, `:449`, mode by the private
  `modeOf` `:442`). `repairRegistration` `:264-278` is the same road. The effort road: `applyEffort` `:604` finds the
  file with `effortTarget` (`:560`, null when nothing exists at the path, a dangling link included), and
  `commitEffort` `:589-595` re-reads the BYTES only (`:593`), then `backupOnce` (`:575`, `:565`) and `writeAtomic`.
- **F2** `changedUnderUs`, `settingsFileOf`, `writeSettings`, `modeOf` and `writeBackup` are PRIVATE. They are not among
  the twelve helpers E1.S1 exported (E1's F1). `effortTarget`, `backupOnce`, `writeAtomic`, `writableReason`,
  `readOrNull`, `sameBytes`, `parseSettings`, `serialise` are exported. `changedUnderUs(t, original, target)` reads only
  `t.settings`, and `modTargets(home).settings` (`agent-models-decide.mjs:75`) is the same path as `targets(home).settings`.
- **F3** The test of the re-pointed link is `tools/install-user-hook.test.mjs:552`: the link is pointed at another file
  with the same bytes between the resolve and the write; the guard's road refuses `changed while installing`.
- **F4 The source's registration takes the effort road.** Source `agent-models-install.mjs:74-89` (`registerIn`): it
  finds the file with `existingSettingsFile` (`:75`; E1's F1: the same body as `effortTarget`), refuses a missing file
  (`:76-79`, through `decideRegistration`'s `missing` branch), and after `beforeWrite` (`:86`) re-reads the bytes only
  (`:87-88`). A link re-pointed to a file with the same bytes is written at the OLD file.
- **F5 The ported decisions** (`settings/hooks/lib/agent-models-decide.mjs`, E1): `decideRegistration` `:251` refuses
  `{ missing: true }` with `<file> does not exist`, retry (`:253`); `withPluginDir` `:211` appends to a non-empty value
  as it is (empty entries in it are kept) and writes `[...carried, target]` into an empty one; `inheritedEntries` `:227`
  drops empties, duplicates and the target from the session's value, after `normalise` and `~/` expansion (`:220`).
- **F6 The source swap** (`agent-models-swap.mjs`): `swap` `:249-279` stages, renames the target aside (`:261-268`)
  without reading it again, renames the staging in (`:269-274`); `renameInFailed` `:227` handles a target that
  appeared (`lost`, F3a) or engine junk (retry once, 5a). `lstatOrNull` `:20-27` is a second body of E1's export and is
  not ported. Its header `:6-7` names "a consumer's mount".
- **F7 The source installer** (`agent-models-install.mjs`): header pointers `:9-13` (the mount, a plan path, "the Story 3
  spec") and `:202` ("resolved from the hook's own file"); `existingSettingsFile` imported `:22`; `run` `:175` calls
  `readSource(source)` (`:177`) with no identity, then `now()` for the first time (`:181`, inside `reconcile`'s
  arguments). `saidOnce` `:115` serves `edited`, `newer` and the symlinked target only; every other refusal is said at
  every start.
- **F8 The source step** (`…/k-repo/settings/hooks/ensure-user-guard.mjs`): `SHIPPED_MOD` `:159` is found from the
  hook's own file; `ensureAgentModelsMod` `:177-186` decides the reference skip on the MOD's root (`:178`) and
  silences a missing settings.json (`:182-184`); `SPEAKING` `:201` holds `pinned` (the login-method step, not ported);
  `main` `:203` is synchronous and uses `SHIPPED_GUARD`.
- **F9 This repository's step** (`settings/hooks/ensure-user-guard.mjs`): `isReferenceRepository(file)` `:51`;
  `ensureUserGuard` `:118`; `ensureEffort` `:155`; `SPEAKING` `:185`; `main` `:187` reads the project from
  `CLAUDE_PROJECT_DIR` or the payload `cwd` (`:190`), builds `source` = `<project>/.claude/hooks/subagent-model.mjs`
  (`:192`) and runs two steps (`:195`); `guardStep` `:203` turns a throw into no line.
- **F10 Fixtures and scans of E1.** `tools/lib/agent-models-fixtures.mjs` has `fixtureReleased` `:49`, `sandbox` `:86`
  (no `ensure`: E1's R6) and `renameSeam` `:137`. `tools/agent-models-imports.test.mjs` lists the modules from the folder
  and already names swap and install in its layer order (`:20`); its specifier scan (`:109-116`) and its
  duplicate-body scan (`:118`) cover swap and install as soon as they exist.
- **F11 Test counts of the source files**, run in the source port on 2026-11-11: `agent-models-install.test.mjs` 50
  (E1 moved 8 of them: `:245`, `:323`, `:526`, the four of `:536`, `:545`; **42 remain for E2**),
  `agent-models-refusals.test.mjs` 8, `agent-models-report.test.mjs` 8, `agent-models-swap.test.mjs` 32 — all pass
  there. `agent-models-step.test.mjs` has 14 cases and does not run in the scratch copy (its `mods/` lives in
  `k-mods/`); it imports `consumer-mount.mjs` and `login-method-fixtures.mjs` (`:20-21`) and asserts `LOGIN_LINE` in six
  cases (`:80`, `:129`, `:143`, `:151`, `:181`, `:196`).
- **F12 Source cases whose meaning Design B changes**: `install.test.mjs:406` ("a missing settings.json is never
  created"), `refusals.test.mjs:25-36` (1j, its first half: a missing file is "does not exist", retry),
  `step.test.mjs:155-176` (missing settings.json), `:207` and `:217` (the reference test on the mod's location). And
  `report.test.mjs:74` (1e) rewrites the SOURCE to 1.1.0, which the fixture identity of 1.2.3 refuses.
- **F13** A scan on 2026-11-11 of the source's swap and install modules: no `fs.*(`, `readTarget(` or `readOrNull(` call
  has `source` or `src` in its arguments. `hasModVersion` (`swap.mjs:50`) and `readReportedKey` (`:318`) read the
  target, an aside and the reported file, never the source.
- **F14** `sonar-project.properties`: `sonar.sources=tools`. CI runs `npm test` (`node tools/run-tests.mjs`), which
  collects `*.test.mjs`; no `.tsx` file under `mods/` is run.

## Boundary with E2 (the same table as E1's)

| Item | E1 builds | E2's part |
|---|---|---|
| The helper exports of `user-guard-install.mjs` | all of F1, `effortTarget` included (E1.S1) | imports them; adds no body |
| `lstatOrNull` | exported from `user-guard-install.mjs`; `agent-models-read.mjs` imports and re-exports it | `agent-models-swap.mjs` imports it; the source's `swap.mjs:20-27` is not ported |
| `tools/lib/agent-models-fixtures.mjs` | ported without the install import and `sandbox().ensure` | adds both back when `agent-models-install.mjs` exists |
| `install.test.mjs:245-252`, `:323-332` | moved to `tools/agent-models-read.test.mjs` | not ported again |
| `install.test.mjs:526-548` | moved to `tools/agent-models-imports.test.mjs`, the list derived | not ported again; the scan covers swap and install as soon as they exist |
| `install.test.mjs:203-243` (source refusals and the extra file, through `ensure`) | E1.S3's spec settles what the read does | ported in `install.test.mjs`, unchanged in meaning |
| The released check | `RELEASED_MOD`, the pure check, and its call inside `readSource` on the bytes it returns (E1.S3) | never calls the check itself: passes `released` through to `readSource` (production passes nothing), and the copy writes only the Map `readSource` returned |
| The pure registration decisions (`decideRegistration`, `withPluginDir`, `inheritedEntries`) | ported in `agent-models-decide.mjs` (E1.S1) | used by `agent-models-install.mjs` |

Disjoint otherwise: E1 adds no line to `ensure-user-guard.mjs`, `agent-models-swap.mjs`, `agent-models-install.mjs` or
`research/`. Two notes from E2's side. "Adds no body" holds for every story here: a helper E2 needs from
`user-guard-install.mjs` that is still private (F2) is reached by adding `export`, or by the shared function E2.S2's spec
chooses, never by a second body. And `decideRegistration` (E1's) may change in E2.S2 only if its spec decides so (Q4).

## What E2 keeps from E1.S3 (the rule, restated as work)

- `run()` calls `readSource(source, { released })` once. The Map it returns is the only source of bytes for the stage
  and for the record. No line of `agent-models-swap.mjs` or `agent-models-install.mjs` reads a file under `source`;
  `readTarget` (which reads the `MOD_FILES` bytes of any folder, unchecked — the E1 Opus review) is called on the
  target only.
- `ensureAgentModels` takes `released = RELEASED_MOD` and passes it on. `ensureAgentModelsMod` passes none.
  `sandbox().ensure` passes `fixtureReleased(version)`. E2 never calls `releasedModRefusal` itself.
- On `unreleased: true`, E2 adds the advice and says the line once (E2.S3).

## Order

**E2.S1, then E2.S2, then E2.S3.** S2 changes the registration that S1 ports, so S2's RED tests fail against the
ported road (F4) for the real reason. S3 wires the step and needs S2's created settings.json (a session with
`SUBAGENT_MODEL_GUARD=off` must still load the mod), and it says every refusal once, including the registration
refusals S2 defines. The research docs come last, in S3, so they describe what was built.

## Growth

- **At run time** (the parent's § Growth, unchanged): `~/.claude/mods/agent-models/` about 1 MB with what the host
  writes on load; the install record and `agent-models.reported.json` under 1 KB each, overwritten — S3 makes every
  refusal go through the reported file, and it still holds ONE key (a test). At most one `replaced-` folder (about
  1 MB): the swap removes the older one. `staging-` and `aside-` leftovers of an interrupted swap are removed by
  `reconcile` at the next start once 10 minutes old. `settings.json` gains one path, once; `backupOnce` adds at most
  one backup per distinct original, so a retry loop adds none. A killed settings write can leave one
  `settings.json.tmp-<pid>`, as the guard's road can today; nothing new sweeps it (recorded, not changed here).
- **A said-once source refusal** creates `~/.claude/mods/` holding only `agent-models.reported.json` (S3, decision
  D3.3). Bounded: one file under 1 KB.
- **In git**: two modules (about 560 lines ported, plus the put-back and the said-once code), the step (about 40 lines),
  and about 2,000 lines of tests.

---

## E2.S1 — The copy: the swap and the installer ported, and a newer copy put back

- **Size** L. **Model** scenarios and brief: Opus (here); code: Sonnet.
- **Goal.** `ensureAgentModels` exists here and copies the released mod into a temporary home: install, upgrade,
  no-op, edited, newer, the leftovers, the swap failures, the record and the said-once lines of edited, newer and a
  symlinked target, exactly as the source does. Two things differ from the source. The swap reads the version it moved
  aside and, when it is newer than its own, puts it back and drops its staging (the cadence consultation, parent
  `2a12677`). And the copy provably writes only the checked Map. The registration is ported as the source has it (F4);
  E2.S2 replaces it. Nothing runs at session start yet.

**Files.**

| File | How |
|---|---|
| `settings/hooks/lib/agent-models-swap.mjs` | ported with rewrites W1, W2, W3 |
| `settings/hooks/lib/agent-models-install.mjs` | ported with rewrites I1, I2, I3 |
| `.claude/hooks/lib/agent-models-swap.mjs`, `.claude/hooks/lib/agent-models-install.mjs` | the mirror copies, same commit |
| `tools/lib/agent-models-fixtures.mjs` | changed (rewrite X1): the install import and `sandbox().ensure` come back |
| `tools/agent-models-swap.test.mjs` | ported verbatim, plus the new cases 1.5-1.8 |
| `tools/agent-models-install.test.mjs` | ported with rewrite X2, plus the new case 1.9 |
| `tools/agent-models-refusals.test.mjs` | ported verbatim |
| `tools/agent-models-report.test.mjs` | ported with rewrite X3 |
| `tools/agent-models-imports.test.mjs` | changed (E1's file): the source-read scan 1.10-1.12 |

**The rewrites, each by name.**

- **W1** `swap.mjs:6-7` becomes: `Imports only node: builtins, ./user-guard-install.mjs and its agent-models-*.mjs
  siblings, because a consumer runs it from its verbatim copy in .claude/hooks/lib/ with nothing installed beside it.`
  (in the comment's own backticks, as E1's R4).
- **W2** `swap.mjs:20-27` (the `lstatOrNull` body) goes. `lstatOrNull` is imported from `./agent-models-read.mjs`
  (the parent's E1 scope: read re-exports it for swap). Nothing else of the module changes except W3.
- **W3 The put-back** (new code in `swap`, after the aside rename `:261-268` succeeded, before the rename in). Read the
  version the aside holds: `.claude-plugin/plugin.json` under `aside`, only when `lstatOrNull` says it is a regular
  file, parsed with `parseJsonObject` and `parseVersion` (the shape of `hasModVersion` `:50`; widen that helper to
  return the version, or add one beside it — no second JSON reader). When that version is newer than `src.version`
  (`compareVersions(...) > 0`): `rename(aside, t.target)`, then `rmQuiet(staging)`, and return `{ copy: 'lost' }` — the
  same outcome as F3a, because another start installed a copy at the same moment, and the registration then runs as
  for `lost`. When the rename back throws: `rmQuiet(staging)` and return a refusal with the text
  `<aside> holds version <v>, newer than this repository's <src>, and could not be renamed back to <target> (<code>);
  rename it back by hand`. An equal or older version, or no readable version, goes on with the swap as the source does. The `keep` case is the same:
  the aside is then the `replaced-<stamp>` folder, and the put-back empties that name.
- **I1** `install.mjs:9-13` and `:202`. `:9-10` become `Imports only node: builtins, ./user-guard-install.mjs and its
  agent-models-*.mjs siblings, because a consumer runs it from its verbatim copy in .claude/hooks/lib/ with nothing
  installed beside it.`; `:13`'s `The contract and the reasoning: todo/PLAN_agent_models_mod.md § Design B and the
  Story 3 spec. In short:` becomes `In short:`; `:202`'s `the mod folder resolved from the hook's own file` becomes `the
  mod folder the caller found (in a consumer: .agents/conventions/mods/agent-models)`. No path of a plan stays in code.
- **I2** `install.mjs:22` imports `effortTarget` in place of `existingSettingsFile`, and `:75` calls it. One body (E1's F1).
- **I3** `ensureAgentModels` gains `released = RELEASED_MOD` (imported from `./agent-models-decide.mjs`) in its
  parameters and in the comment list (`released  the identity a source must have; a test passes its fixture's own,
  production passes nothing`); `run` receives it and calls `readSource(source, { released })`.
- **X1** fixtures: `import * as mod from '../../settings/hooks/lib/agent-models-install.mjs';` back, and in `sandbox`:
  `ensure: (opts = {}) => mod.ensureAgentModels({ home, source, by: 'test', now: () => NOW, released: fixtureReleased(version), ...opts }),`.
  The header names the E2 users (`agent-models-install.test.mjs`, `agent-models-swap.test.mjs`,
  `agent-models-refusals.test.mjs`, `agent-models-report.test.mjs`) and drops `E2 adds sandbox().ensure …`.
- **X2** install.test: the cases E1 moved are not ported (F11: `:245-252`, `:323-332`, `:523-548`). Nothing else changes.
- **X3** report.test 1e (`:67-77`): after `writeTree(s.source, '1.1.0')`, the two `s.ensure()` calls pass
  `{ released: fixtureReleased('1.1.0') }`, and `fixtureReleased` is imported. The case keeps its meaning: a source of
  another version speaks once more.

**Scenarios.** Every case first runs RED for the reason named, then GREEN. "swap", "install", "imports" are the files
above. A fixture tree is `sandbox(t).source` at 1.2.3.

| # | Given / When | Then | RED before the change |
|---|---|---|---|
| 1.1 | install: the first ported case, a fresh home with `{ model: 'opus' }` | `installed`, the seven files, the manifest, one backup | fails to load: `Cannot find module '…/agent-models-install.mjs'` (from the fixtures) |
| 1.2 | install 42, refusals 8, report 8, swap 32 ported cases | all pass | as 1.1 |
| 1.3 | `sandbox(t).ensure()` reaches `readSource` with the fixture's identity | 1.1 is green; with X1's `released` removed every case refuses `… is not the released mod 1.3.3 …` (tooth T4) | — (the positive that keeps X1 honest) |
| 1.4 | the five ported F3a/5a/5b swap cases | unchanged: an appeared COMPLETE mod is `lost`, engine junk is retried once | as 1.1 |
| 1.5 | swap, **the cadence case**: target 1.0.0 with a matching manifest, settings already registered; a `renameSeam` whose first call (`from === t_.target`) first writes a 2.0.0 tree and its `goodManifest('2.0.0', …)` into the target, then delegates | `[action, line, copy] = ['none', '', 'lost']`; the target holds the 2.0.0 bytes of all seven files; the manifest is the 2.0.0 one; `listMods()` is `['agent-models', 'agent-models.installed.json']` (no staging, no aside); the seam saw two calls (target → aside, aside → target); settings byte-identical | the target holds 1.2.3: the newer copy was replaced (a downgrade) |
| 1.6 | swap: as 1.5, but the old target has NO manifest (so `keep`: the aside is `replaced-<stamp>`) | the 2.0.0 copy is at the target; no `replaced-` folder is left | as 1.5 |
| 1.7 | swap: as 1.5, but the arriving copy is 1.2.3 (this repository's own version) | the swap goes on: `upgraded`, the target holds our bytes, no staging or aside left | — (green before; it pins that only a NEWER copy is put back) |
| 1.8 | swap: as 1.5, and the seam's second call throws `EPERM` | `refused`; the line is `notInstalled(<aside> holds version 2.0.0, newer than this repository's 1.2.3, and could not be renamed back to <target> (EPERM); rename it back by hand)`; no staging left; the aside still holds 2.0.0 | as 1.5 (no such line) |
| 1.9 | install, **the `now` seam** (E1.S3's test): `ensure({ now })` where `now`, on its FIRST call only, appends `// changed after the read\n` to `s.sourceFile('hooks/prompts.ts')`; it returns `NOW` | `installed`; for every `rel` of `FILES`, `sha(s.installedBytes(rel))` equals `fixtureReleased('1.2.3').sha256[rel]`, and so does the manifest's `sha256[rel]` | — (green when written: the port copies the Map. T5 is its RED) |
| 1.10 | imports: in `agent-models-swap.mjs` and `agent-models-install.mjs`, every call of `readTarget(`, `readOrNull(` or `fs.<name>(` — its argument text up to the matching `)`, across lines | no argument text holds the word `source` or `src` | — (green when written, F13; T5 is its RED) |
| 1.11 | imports: `readSource(` in the two modules | install calls it exactly once, with `source` as the first argument; swap never | — (T5b is its RED) |
| 1.12 | imports, the companions: the call parser finds `readSource(source, { released })` in install; finds `fs.readFileSync(file)` in swap (an allowed read); and finds a finding in the planted text `fs.readFileSync(\n  path.join(source, rel))` | all three | — (a scan that matches nothing passes forever) |
| 1.13 | imports: E1's scans over the four modules | no finding: swap's imports are all exports of `user-guard-install.mjs` or earlier modules; no second body of `lstatOrNull` | with W2 undone: `agent-models-swap.mjs declares lstatOrNull, a second body …` |
| 1.14 | the pointer grep of the brief, step 5 | no line | lines before W1 and I1 |
| 1.15 | `cmp` of both modules with their `.claude/hooks/lib/` copies; `node tools/adapter-check.mjs` | equal; `OK` | before the copy: adapter-check names `.claude/hooks/lib/agent-models-swap.mjs` as missing |
| 1.16 | `npm test`, `npm run check` | green; the total rises by the ported and new cases | — |

**Teeth (RED → GREEN → RED), one at a time, each restored by the reverse edit:**

- **T1** W3's version read removed (the swap goes on whatever the aside holds) → 1.5 and 1.6 red.
- **T2** W3's rename back skipped (staging dropped, `lost` returned) → 1.5 red: no target.
- **T3** W3 compares `>= 0` → 1.7 red (`lost` instead of `upgraded`).
- **T4** X1's `released` removed from `sandbox().ensure` → 1.1 and nearly every ported case red with
  `is not the released mod 1.3.3`. Then I3's `{ released }` removed from `readSource(source, …)` in `run` → the same.
- **T5** in `run`, after `reconcile`, `for (const rel of MOD_FILES) src.files.set(rel, fs.readFileSync(path.join(source, rel)));`
  → 1.9 red (the `hooks/prompts.ts` digest differs) and 1.10 red, naming `agent-models-install.mjs`.
  **T5b** a second `readSource(source, { released: null })` call in `run` → 1.11 red.
- **T6** W2 undone → 1.13 red.
- **T7** (ported) in `reconcile`'s `newestRestorable`, drop `!d.young` → swap 2d red.
- **T8** (ported) `pruneReplaced` returns at once → swap 3d red.

**The brief.**

1. Check that the source port exists (F6 of E1) and that E1 is committed (`settings/hooks/lib/agent-models-read.mjs`
   exports `readSource` and `lstatOrNull`). Run `npm test` and write down the pass and fail counts.
2. **Tests first.** Fixtures: X1. Copy `agent-models-{install,refusals,report,swap}.test.mjs` from `<source port>/tools/`.
   Apply X2 and X3, nothing else. Add 1.5-1.8 to swap.test (build trees with `writeTree`, `goodManifest`, `renameSeam`,
   `failing`; folders by `ownedDir` through `sandbox` only), 1.9 to install.test, 1.10-1.12 to imports.test (read the
   two module texts as E1's cases do; the call parser matches `name(` and walks to the matching `)` with a depth count,
   so a call over several lines is one call; name each test for its guarantee). Run:
   ```bash
   node --test tools/agent-models-install.test.mjs tools/agent-models-swap.test.mjs tools/agent-models-refusals.test.mjs tools/agent-models-report.test.mjs tools/agent-models-imports.test.mjs
   ```
   Keep the RED message of 1.1 (the missing module).
3. **The port.** Copy `agent-models-swap.mjs` and `agent-models-install.mjs` from `<source port>/settings/hooks/lib/`.
   Apply W1, W2, I1, I2, I3. Run the files: 1.1-1.4 and 1.9-1.13 green, 1.5, 1.6 and 1.8 red for the reason named
   (keep the messages). Any other red is a stop: report it.
4. **W3.** Write the put-back. Run: all green. Do T1-T8 one at a time; write down the red test and its message; undo.
5. Copy both modules to `.claude/hooks/lib/` and check 1.15. The pointer grep of 1.14:
   ```bash
   grep -nE "\.claude/rules|plan §|PLAN_|Story 3|consumer's mount|hook's own file" settings/hooks/lib/agent-models-*.mjs tools/lib/agent-models-*.mjs tools/agent-models-*.test.mjs
   ```
   Then `npm test`, `npm run check`, `node tools/adapter-check.mjs`, and the company scan of E1.S2's brief, step 5,
   over the new files.
6. **Commit** by path (the two modules, their two copies, the fixtures, the five test files):
   `feat(adapter): the agent-models copy — swap and installer ported, a newer copy put back, nothing runs at session start yet`,
   with the RED messages, the GREEN counts, each tooth with the test it turned red, and the `npm test` counts before
   and after in the body. Do not touch `ensure-user-guard.mjs`, `user-guard-install.mjs` or `agent-models-decide.mjs`.

**Done when** 1.1-1.16 hold and T1-T8 were each seen red and restored; the two modules import nothing that reads the
source; the copy hashes to the identity after a source rewrite; `npm test`, `npm run check` and
`node tools/adapter-check.mjs` are green.

---

## E2.S2 — The settings-file write as one operation · `model: fable` · cornerstone

- **Size** M. **Model** scenarios and brief: **Fable** (this section, 2026-11-11, written after the document was
  committed, so the cornerstone was in the parent's ledger first); code: Sonnet; review: Opus.
- **Goal.** The registration of the mod in `~/.claude/settings.json` is ONE operation on ONE road: read; find the real
  write target (a link followed, never replaced; a chain of links to its last target); apply the
  `CLAUDE_CODE_PLUGIN_DIRS` value rule; back up; check AGAIN both the bytes and the resolved target before the write —
  the guard's road (`changedUnderUs`, F1, F3), not the effort road, which re-reads the bytes only (F1, F4); write
  atomically with the file's own mode. A MISSING settings.json is created holding only
  `env.CLAUDE_CODE_PLUGIN_DIRS`, decided exactly as an existing file with an empty value: the session's own entries
  first, then the target. It must not become a third assembly of the parts that drops one of them (the parent's E2
  cornerstone area).
- **The value rule** (the parent's Design B, decided): a string of paths joined by `path.delimiter`; the target is
  appended once; an entry equal to it after `normalise` and `~/` expansion means nothing to do; empty entries and
  duplicates of the carried value are dropped; a non-string value or a non-object `env` is refused with nothing
  written; the first registration into an empty value carries the session's own variable over, because the settings
  value replaces the shell's.
- **Evidence.** This design ran in a scratch copy on 2026-11-11 (Node 26.12.1, WSL, ext4): the road and the
  registration below, over a rough port of the source installer. The three guard suites (107 cases) were green before
  and after the road change, with no byte of them changed. The RED messages in the table are the ones the ported road
  printed. Every tooth below turned the named tests red there, run again after the road got the guard's defaults.
  The scratch copy is evidence, not a source: the coder writes the tests and the code from this section.
- **The guard does not change in this epic** (the caller's decision, 2026-11-11). The road's defaults are what the
  guard does at HEAD. Only the mod's registration asks for more. What the guard could gain is recorded under
  *Follow-ups for the guard* and is not built here.

**Decisions** (Fable, 2026-11-11). One per question.

- **D2.1 (Q1) One road, extracted.** `user-guard-install.mjs` gains one exported function,
  `commitSettings({ settingsPath, original, target, data, beforeWrite, prepare, replace = true })`. Its order:
  `beforeWrite()`; read the bytes again through `settingsPath`; resolve the target again; a difference in either
  returns `{ written: false, now }` (`now` = the bytes just read); `prepare()`; the write at `target.file`. `install`,
  `repairRegistration`, `uninstall` and the mod's registration all call it. At its defaults the road does what the
  guard's three operations do at HEAD, and they pass nothing new. `settingsFileOf` gains `export`: the caller
  resolves the target before it computes anything, as the guard does. `changedUnderUs`, `writeSettings`, `modeOf` and
  `writeBackup` stay private; `changedUnderUs` and `writeSettings` are called only inside `commitSettings` (a scan,
  2.30). The "settled" branch is the mod's own and stays in `agent-models-install.mjs`.
- **D2.2 (Q2) Backup.** The mod uses `backupOnce`, beside the real file, with the file's mode. It runs in `prepare`,
  so only when a write follows. A file that did not exist has no backup. The guard keeps its own backup
  (`writeBackup`, beside the settings path): not changed.
- **D2.3 (Q3) The re-check.** The mod's order: decide → the checks of D2.7 → `beforeWrite` → re-check → backup →
  write. Bytes changed: `settled` when the bytes the re-check saw already list the target; otherwise refused, retry.
  The target changed with equal bytes: refused, retry, the same text. **Rejected:** the source's re-read, which reads
  the old real file only (F4). **Rejected for the mod:** the guard's order (backup before the re-check); a refused
  change of the mod leaves no backup (the ported `:421` and `:434` pin it).
- **D2.4 (Q4) A missing file.** There is no `missing` form. The registration passes `parseSettings(original)`, and
  `parseSettings(null)` is `{ settings: {} }` — the guard's own rule for "no file". So the same lines decide a missing
  file and the file `{}`. The `missing` branch of `decideRegistration` (`:253`) and its words in the comment (`:247`)
  are deleted. A created file gets no mode of its own: it takes what `writeAtomic` gives a new file today (the
  umask), the same as a file the guard creates, so the two creators agree. `~/.claude` exists at this point (the copy
  made `~/.claude/mods`); `writeAtomic` still makes a missing folder, as today.
- **D2.5 (Q5) The mod's creation never replaces.** `writeAtomic` is widened, not copied:
  `writeAtomic(dest, data, mode, { replace = true } = {})`. With `replace: false` the complete temp file gets its name
  by `fs.linkSync(tmp, dest)`. A hard link fails with `EEXIST` when the name is taken — by a file or by a link,
  dangling or not — where a rename replaces. `writeAtomic` then returns `false` and `commitSettings` returns
  `{ written: false, now }`. There is no window on a filesystem with hard links. Where the link fails for another
  reason (no hard links there), nothing is created: the error goes up and the registration is a retry refusal. A
  look-then-rename fallback was rejected (the cadence consultation, 2026-11-11): in its gap a file another writer just
  created would be replaced, which breaks the promise; the cost is no automatic creation on a filesystem without hard
  links (the mod's step already skips win32; `~/.claude` on WSL and Linux is ext4 or similar). ONLY the
  registration passes `replace: false` to the road, and the road uses it only for a file that did not exist at the
  read: an existing file is always replaced. The default is `true`, the rename the guard uses today. **Rejected:** an
  exclusive open of the final name; a reader, or a kill, can meet an empty settings.json.
- **D2.6 (Q6) Links.** An existing file behind one link or a chain is written at its real path, and every link stays.
  A dangling chain: the mod refuses with the retry tail and creates nothing (the parent's rule). A link says the user
  keeps the file in another place, and that place is not there now: a dotfiles checkout not made yet, a share not
  mounted. `settingsFileOf` marks it: `{ file: <last target>, dangling: true }`. The guard still creates the last
  target (not changed); on a machine with the guard on, the mod then finds a file. More than 40 links, and a target
  through a missing folder and then `..`: refused, fix by hand. `settingsFileOf` returns `reason` beside `refusal`,
  so the mod's line does not say "nothing changed" after a copy.
- **D2.7 (Q7) Writable.** Checked in the mod, before `commitSettings`. An existing file that is not writable:
  `<settings> is not writable (<code>)`, by hand (the port). The folder of the write target not writable:
  `<folder> is not writable (<code>)`, by hand — for a file to create and for an existing one, because the temp file,
  the backup and the rename all need the folder. Any later failure is the write's own error: retry.
- **D2.8 (Q8) Values.** A non-empty value is kept byte for byte and gets `<delimiter><target>` (F5), also with empty
  entries or a trailing delimiter. Nothing is carried into it. A missing file, `{}`, no `env`, `env` without the key
  and the key `''` all carry the session's entries: empties and duplicates dropped, our target dropped in any
  spelling, each kept entry verbatim. `~/` is expanded for the comparison only. `~` alone is not expanded and is not
  our target. The comparison is text after `normalise`; no link is resolved.
- **D2.9 (Q9) Texts and tails.** The table below. A created file adds nothing to a line, and the outcome stays
  `registration: 'append'`: the `installed` and `registered` lines already name the file and the key.
- **D2.10 (Q10) Reads that fail.** settings.json that is a folder, a link to a folder, or unreadable: the read
  throws; one refusal, `<settings> could not be read (<code>)`, by hand; nothing written. A throw after the read is
  `could not be written`, retry. **Rejected:** the source's single catch, which called every throw "could not be read".
- **D2.11 (Q11) What stays.** `tools/install-user-hook.test.mjs`, `tools/effort-converge.test.mjs` and
  `tools/ensure-user-guard.test.mjs` change by no byte and stay green. The effort road is not touched. The guard's
  `install`, `repairRegistration` and `uninstall` do what they do at HEAD: the same lines, the same backup, the same
  order, the same rename, the same mode. Their code changes in one way only: the last three steps (the seam, the
  re-check, the write) are now the call of the road. Case 2.9 and scan 2.30 (B) hold the guard there.
- **D2.12 (Q12) The RED order and the teeth.** The table and the list below.

**The refusal texts** (D2.9). `<settings>` is `modTargets(home).settings`. Every line is
`notRegistered(<version>, <reason>, <tail>)` of the fixtures.

| Reason | Text of the reason | Tail |
|---|---|---|
| unparsable | `<settings> does not parse (<message>)` | by hand |
| not an object | `<settings> is not a JSON object` | by hand |
| `env` not an object | `<settings>: env is not an object` | by hand |
| the value not a string | `<settings>: env.CLAUDE_CODE_PLUGIN_DIRS is not a string` | by hand |
| the read throws | `<settings> could not be read (<code>)` | by hand |
| more than 40 links | `<settings> has more than 40 links (a loop, or a chain too long to open)` | by hand |
| a missing folder, then `..` | `<settings> is a link whose target goes through a folder that does not exist and then ".."` | by hand |
| the file not writable | `<settings> is not writable (<code>)` | by hand |
| the folder not writable | `<folder> is not writable (<code>)` | by hand |
| a dangling chain | `<settings> is a link to <last target>, which does not exist` | retry |
| changed under us, not settled | `settings.json changed while registering the agent-models mod; nothing written to it` | retry |
| the write throws | `<settings> could not be written (<code>)` | retry |

**Follow-up for the mod's step (not built here).** An unchanged refusal is said once and then silent for good: the
reported file keeps `{ key, at }` and no reminder (the cadence consultation, 2026-11-11). A stale submodule or an
unwritable settings.json is then shown once; the consumers' CI `pin-check` and `adapter-check` still catch the first.
A reminder interval changes the parent's "said once per state" contract, so it needs its own plan.

**Follow-ups for the swap (not built here; CodeRabbit on PR #160, 2026-11-11).** (1) After a put-back that itself
fails, a later start can install this repository's older copy and later remove the newer aside as a leftover; a
persisted "restore pending" marker that blocks the install would close it (`putBack` states the limit). (2) `keep` is
decided on the first read of the target, so an edit made in the milliseconds between `readTarget` and the rename is
removed with the aside; re-hashing the moved folder before `rmQuiet` would narrow that window.

**Follow-ups for the guard (not built here).** Each is a change of the guard's behaviour, so each needs its own plan.
The line numbers are of `settings/hooks/lib/user-guard-install.mjs` at HEAD; "measured" means run on 2026-11-11.

- **G1 The guard's creation can replace a file that appeared after its re-check.** `writeAtomic` renames over the
  name (`:180`). Measured in the scratch copy: at the road's defaults, a file written after the re-check was replaced.
  The fix is one argument, `replace: false`, in the guard's calls of the road; an install that loses the name then
  answers `changed while installing` with its hook already written, which the next session start registers.
- **G2 A created settings.json takes the umask** (mode 0644 under umask 022, measured), and it may later hold tokens
  in `env`. `writeSettings` (`:449-451`) passes no mode for a missing file. An owner-only mode at creation would
  apply to both creators.
- **The effort road re-reads the bytes only and writes by itself.** `commitEffort` reads again at `:593` and never
  resolves the target again; `writeConverged` calls `writeAtomic` at `:576`. It is the one write of settings.json
  outside `commitSettings`.
- **The guard's road has no writable check.** `install` (`:313-344`) never calls `writableReason`. Measured at HEAD:
  an install over a settings.json of mode 0444 answered code 0 and wrote the file.
- **The guard backs up before its re-check.** `install` `:332` is before `:334`. Measured at HEAD: an install refused
  as `changed while installing` left one backup.

**What this does not prove.**

- An EXISTING file that another program changes between the re-check and the rename is replaced. The gap is a few
  system calls. No lock is shared with the host. The guard's road has the same gap today.
- Windows and macOS were not run: CI is `ubuntu-latest`. `fs.linkSync` runs only in the mod's creation, and the mod's
  step skips `win32` (E2.S3, D3.2). If that call fails for a reason other than "the name is taken", nothing is
  created and the registration is refused by hand (no hard links there; the E2 Opus review, 2026-11-11).

**Files.**

| File | How |
|---|---|
| `settings/hooks/lib/user-guard-install.mjs` | changed: `writeAtomic` widened and `placeNew` (R1); `settingsFileOf` exported, with `dangling` and `reason` (R2); `commitSettings` (R3); `install`, `repairRegistration`, `uninstall` call the road at its defaults (R4) |
| `settings/hooks/lib/agent-models-decide.mjs` | changed: the `missing` branch and its words in the comment go (R5) |
| `settings/hooks/lib/agent-models-install.mjs` | changed: the registration (`settledOrChanged`, `blocked`, `registerIn`, `register`), its import list and the comment of `register` (R6) |
| the `.claude/hooks/lib/` copy of each of the three | the mirror copies, same commit |
| `tools/agent-models-register.test.mjs` | new: the road (2.1-2.9) and the registration (2.11-2.15, 2.17-2.23, 2.25-2.27, 2.27b) |
| `tools/agent-models-install.test.mjs` | changed: the ported `:406` case becomes 2.10; nothing else |
| `tools/agent-models-refusals.test.mjs` | changed: the first half of 1j (`:25-36`) becomes the short form of 2.27; nothing else |
| `tools/agent-models-decide.test.mjs` | changed: the `missing` line of `:199` goes; 2.29 is added |
| `tools/agent-models-imports.test.mjs` | changed: the two road scans and their companions (2.30) |
| `tools/install-user-hook.test.mjs`, `tools/effort-converge.test.mjs`, `tools/ensure-user-guard.test.mjs` | no byte changes; green |

**The rewrites, each by name.**

- **R1 `writeAtomic` and `placeNew`.** One body; the old comment stays and gains one sentence about `replace`.

  ```js
  export function writeAtomic(dest, data, mode, { replace = true } = {}) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const tmp = `${dest}.tmp-${process.pid}`;
    try {
      fs.writeFileSync(tmp, data, mode === undefined ? undefined : { mode });
      if (mode !== undefined) fs.chmodSync(tmp, mode);
      if (!replace) return placeNew(tmp, dest);
      fs.renameSync(tmp, dest);
      return true;
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  }

  /**
   * A complete temp file gets a NEW name. A hard link fails with EEXIST when the name is taken (by a file, or by a link,
   * dangling or not), where a rename would replace it. Where the filesystem cannot make a hard link, nothing is
   * created: the error is thrown, and the caller makes it a retry refusal (no look-then-rename: its gap could replace a
   * file another writer just created). False when the name is taken.
   */
  function placeNew(tmp, dest) {
    try {
      fs.linkSync(tmp, dest);
      return true;
    } catch (e) {
      if (e.code === 'EEXIST') return false;
      throw e;
    }
  }
  ```

- **R2 `settingsFileOf`.** `export` is added. Its two refusals and its last line become the lines below; `refusal`
  keeps today's exact text. The comment gains: `dangling` marks a chain that ends in a missing file, and `reason` is
  the refusal without its advice.

  ```js
  const linkRefusal = reason => ({ reason, refusal: `${reason}; nothing changed — point it at one file` });

  // inside settingsFileOf, after `last` is known:
  if (last === TOO_MANY_LINKS) return linkRefusal(`${settingsPath} has more than ${MAX_LINKS} links (a loop, or a chain too long to open)`);
  if (last === MISSING_FOLDER) return linkRefusal(`${settingsPath} is a link whose target goes through a folder that does not exist and then ".."`);
  return last === null ? { file: settingsPath } : { file: last, dangling: true };
  ```
- **R3 The road.** `changedUnderUs` becomes `(settingsPath, original, target, now)` and reads nothing itself:
  `return !sameBytes(now, original) || settingsFileOf(settingsPath).file !== target.file;` (its comment stays).
  `writeSettings` passes the options on and returns what `writeAtomic` returns; its comment stays.

  ```js
  function writeSettings(file, data, options) {
    return writeAtomic(file, data, modeOf(file), options);
  }

  /**
   * The ONE road a change of settings.json takes once its new text is known. install, repairRegistration, uninstall and
   * the agent-models registration all end here, so none of them can drop a step. `original` and `target` are what the
   * caller read and resolved (`settingsFileOf`) BEFORE it computed `data`. In order: `beforeWrite` (a test seam); the
   * bytes are read again through the path and the target is resolved again, and a difference in either answers
   * `{ written: false, now }` with the bytes just read; `prepare` (what a caller does only when the write follows: the
   * guard copies its hook, the mod takes its backup); then the write at `target.file`, with the file's own mode when
   * there is one. `replace: false` is for a file that did not exist at the read: it is then created only while its
   * name is still free, and a name taken meanwhile is `{ written: false, now }` too. An existing file is always
   * replaced. The default, `true`, renames over the name in both cases.
   */
  export function commitSettings({ settingsPath, original, target, data, beforeWrite = () => {}, prepare = () => {}, replace = true }) {
    beforeWrite();
    const now = readOrNull(settingsPath);
    if (changedUnderUs(settingsPath, original, target, now)) return { written: false, now };
    prepare();
    if (writeSettings(target.file, data, { replace: replace || original !== null })) return { written: true };
    return { written: false, now: readOrNull(settingsPath) };
  }
  ```

- **R4 The three callers.** Each keeps its read, its `settingsFileOf` call, its backup line and its result lines.
  Only the tail changes. No other line of the three functions moves. None of them passes `replace`.
  - `repairRegistration` `:274-276`: the three lines `beforeWrite();`, `if (changedUnderUs(…)) return …;`,
    `writeSettings(target.file, merged);` become
    `const done = commitSettings({ settingsPath: t.settings, original, target, data: merged, beforeWrite });` and
    `if (!done.written) return result(1, [...lines, CHANGED]);`.
  - `install` `:333-334` (`beforeWrite();` and the `changedUnderUs` line) go. `:340-342` become: a
    `const prepare = () => { writeManifest(t, source, sourceBytes, by, readOrNull(t.hook)); writeAtomic(t.hook, sourceBytes); };`,
    then `const done = commitSettings({ settingsPath: t.settings, original, target, data: serialise(merged), beforeWrite, prepare });`
    and `if (!done.written) return result(1, [...lines, CHANGED]);`. The comment `:335-339` stays as it is.
  - `uninstall` `:363-365` become
    `const done = commitSettings({ settingsPath: t.settings, original, target, data: serialise(removeEntry(parsed.settings, t.hook)), beforeWrite });`
    and `if (!done.written) return result(1, [CHANGED]);`.
- **R5 `decideRegistration`.** Line `:253` is deleted. The first sentence of the comment (`:247`) becomes:

  ```js
   * The registration decision over parsed settings (`{ settings }` or `{ error }`; a missing file is
   * `parseSettings(null)`, an empty object). `inherited` is the
  ```
- **R6 The registration** in `agent-models-install.mjs`. `appendRegistration` goes. The import from
  `./user-guard-install.mjs` becomes
  `backupOnce, commitSettings, parseSettings, readOrNull, serialise, settingsFileOf, writableReason` — no
  `effortTarget`, `sameBytes` or `writeAtomic`. The comment `beforeWrite  test seam: …` stays true. No line names a
  created file.

  ```js
  /** The file changed under us: fine when what is there now lists the folder, a refusal otherwise. */
  function settledOrChanged(now, target, home) {
    return decideRegistration(parseSettings(now), target, home).action === 'none' ? { registration: 'settled' } : refusedRegistration(SETTINGS_CHANGED, true);
  }

  /** Why the write must not start, as a refused registration; null when it may. */
  function blocked(t, original, target) {
    if (target.refusal) return refusedRegistration(target.reason, false);
    if (target.dangling) return refusedRegistration(`${t.settings} is a link to ${target.file}, which does not exist`, true);
    const file = original === null ? '' : writableReason(target.file);
    if (file) return refusedRegistration(`${t.settings} ${file}`, false);
    const folder = path.dirname(target.file);
    const reason = writableReason(folder);
    return reason ? refusedRegistration(`${folder} ${reason}`, false) : null;
  }

  function registerIn({ t, home, beforeWrite, inheritedPluginDirs, original, target }) {
    const decision = decideRegistration(parseSettings(original), t.target, home, inheritedPluginDirs);
    if (decision.action === 'none') return { registration: 'none' };
    if (decision.action === 'refuse') return refusedRegistration(decision.reason, decision.retry);
    const refusal = blocked(t, original, target);
    if (refusal) return refusal;
    // A backup only when a write follows, and none of a file that did not exist; a retry adds no file (backupOnce).
    const prepare = () => { if (original !== null) backupOnce(target.file, original, fs.statSync(target.file).mode & 0o777); };
    // replace: false — a settings.json this step creates never takes the place of one that appeared after the re-check.
    const done = commitSettings({ settingsPath: t.settings, original, target, data: serialise(decision.next), beforeWrite, prepare, replace: false });
    return done.written ? { registration: 'append', carried: decision.carried } : settledOrChanged(done.now, t.target, home);
  }

  /** Registers the target in settings.json, creating a missing file. Never throws. */
  function register(args) {
    const { settings } = args.t;
    let original;
    let target;
    try {
      original = readOrNull(settings);
      target = settingsFileOf(settings);
    } catch (e) {
      return refusedRegistration(`${settings} could not be read (${codeOf(e)})`, false);
    }
    try {
      return registerIn({ ...args, original, target });
    } catch (e) {
      return refusedRegistration(`${settings} could not be written (${codeOf(e)})`, true);
    }
  }
  ```

**Scenarios.** Every case first runs RED for the reason named, then GREEN. "register", "install", "refusals",
"decide" and "imports" are the test files above. "The road" cases call `commitSettings`, `settingsFileOf`,
`writeAtomic` and `install` of `user-guard-install.mjs` in a folder made by `ownedDir`; "open" there means
`{ settingsPath, original: readOrNull(settingsPath), target: settingsFileOf(settingsPath) }`. The registration cases
run `sandbox(t).ensure(…)`, after `seedTarget()` unless the row says a fresh home. `D` is `path.delimiter`. "—" in the
last column means the case is green on the ported road and names its RED tooth. A mode case skips on `win32`; a
permission case also skips as root; a link case skips where a symlink cannot be made. A `:NNN` of an install or
refusals case is its line in the SOURCE test file, as in F11 and F12. The guard's `:114`, `:322` and `:552` are lines
of this repository's `tools/install-user-hook.test.mjs`, and decide `:199` is a line of `tools/agent-models-decide.test.mjs`.

| # | Given / When | Then | RED before the change |
|---|---|---|---|
| 2.1 | the road: no file; `commitSettings({ ...open, data, replace: false })` under umask 022 | `{ written: true }`; the file holds `data`; mode `0644`, the umask's; no `.tmp-` file in the folder | `guard.settingsFileOf is not a function`, thrown by "open" |
| 2.2 | the road, **the creation in the gap**: no file; `replace: false`; `prepare` writes `{"theme":"dark"}` at the path | `written: false`; `now` is the other bytes; the file still holds them; no `.tmp-` file | as 2.1 |
| 2.3 | the road: no file; `replace: false`; `prepare` makes the path a link to a file that does not exist | `written: false`; the link stays a link; its target was not created | as 2.1 |
| 2.4 | the road, no hard links: `replace: false`; `fs.linkSync` replaced for the call by a function that counts and throws `EPERM` (restored in `finally`); once with no file, once with the replaced function creating the other file at the name just before it throws (a writer in the gap) | first: `commitSettings` throws `EPERM`; no settings.json, no `.tmp-` file; second: it throws too and the other file's bytes stay; at the registration level each is `could not be written (EPERM)` with `RETRY_TAIL` (the cadence consultation, 2026-11-11) | first: the file was created by the rename fallback; second: the other file was replaced |
| 2.5 | the road: an existing 0644 file; `commitSettings({ ...open, data, replace: false })` under umask 077 | `{ written: true }`: an existing file is always replaced; the file holds `data`; mode `0644` | as 2.1 |
| 2.6 | the road: an existing file; (a) `beforeWrite` writes other bytes; (b) the path is a link to `a.json`, and `beforeWrite` points it at `b.json` with the same bytes; `prepare` counts its calls | (a) `written: false`, `now` is the new bytes; (b) `written: false`, `a.json` and `b.json` byte-identical; `prepare` ran 0 times | as 2.1 |
| 2.7 | the road: `settingsFileOf` on a plain missing path; on a chain `settings → mid → real` with `real` missing; with `real` present; on a loop | `{ file: <path> }`; `{ file: <real>, dangling: true }`; `{ file: <realpath of real> }`; `reason` is `<path> has more than 40 links (a loop, or a chain too long to open)`, `refusal` is `reason` + `; nothing changed — point it at one file`, no `file` | as 2.1 |
| 2.8 | the road: a file `old`; `writeAtomic(file, 'new', undefined, { replace: false })`; then `writeAtomic(file, 'new')` | the first returns `false`, the file is `old`, no `.tmp-` file; the second returns `true`, the file is `new` | the first call replaced the file and returned `undefined` |
| 2.9 | the road, **the guard as at HEAD**: a fresh home; the guard's `install({ home, source })` under umask 022, with `fs.linkSync` replaced for the call by a function that counts and throws | code 0; settings.json holds the guard's entry; its mode is `0644`, the umask's; the replaced function ran 0 times (the rename, never a hard link) | — (green before and after: the guard must not change; tooth M2.6) |
| 2.10 | install (where `:406` stood), **a missing file is created**: a fresh home, `ensure()` under umask 022; then `ensure()` again | `[action, line, copy, registration]` = `['installed', installedLine('1.2.3'), 'install', 'append']`; the file text is `serialise({ env: { CLAUDE_CODE_PLUGIN_DIRS: <target> } })`; mode `0644`, the umask's, as the guard's file of 2.9; no backup; no `.tmp-` file; the second run is `['none', '', …, 'none']` | `refused`, `… NOT registered …: <settings> does not exist; the next session start registers it` |
| 2.11 | register: a fresh home; `ensure({ inheritedPluginDirs })` with `/a`, an empty entry, `~/c`, `/a` again, `~/.claude/mods/agent-models`, a trailing delimiter | the line is `installedLine('1.2.3') + carriedText(2)`; the file deep-equals `{ env: { CLAUDE_CODE_PLUGIN_DIRS: '/a' + D + '~/c' + D + <target> } }` | as 2.10 |
| 2.12 | register, three cases: `{ model }`; `{ model, env: { A } }`; `{ model, env: { A, CLAUDE_CODE_PLUGIN_DIRS: '' } }`; `ensure({ inheritedPluginDirs: '/a' + D + '/b' })` | `registered`, the line `registeredLine + carriedText(2)`; the value is `/a`, `/b`, then the target; `model`, `A` and the key order `['model', 'env']` kept; one backup that holds the old bytes | — (teeth M2.4, M2.10) |
| 2.13 | register: the value `/a` + D + D + `/b` + D; `ensure({ inheritedPluginDirs: '/zzz' })` | the line is `registeredLine`; the new value is the old value + D + the target, byte for byte | — (a pin of D2.8) |
| 2.14 | register, two spellings of a listed target: `~/.claude/mods/agent-models/`; `<mods>/../mods/agent-models`; `ensure({ inheritedPluginDirs: '/zzz' })` | `[action, registration]` = `['none', 'none']`; `snapshot(~/.claude)` equal before and after (bytes and mtimes; so no write, no backup) | — (a pin; the ported `:348` has three more spellings) |
| 2.15 | register: the value `~` | the new value is `~` + D + the target | — (a pin) |
| 2.16 | install, the ported `:379-404` (unparsable, an array, `env` an array, `env` a string, the value not a string) and refusals 1i | unchanged: the file byte-identical, no backup, the tail "by hand" | — (teeth M2.9, M2.17) |
| 2.17 | register, **another start creates the file first**: a fresh home; (a) `beforeWrite` writes a settings.json that lists the target; (b) `beforeWrite` writes `{ "hooks": {} }`; (c) **after the re-check**: no settings.json, and `fs.linkSync` wrapped for the call so that it first writes `{ "hooks": {} }` at its destination, then calls the real function | (a) `['installed', installedLine('1.2.3'), 'settled']`, the other bytes stay; (b) the line is `notRegistered('1.2.3', <changed text>, RETRY_TAIL)`, the other bytes stay, no backup; the next `ensure()` is `registered` and the file deep-equals `{ hooks: {}, env: { … } }`; (c) the same line as (b), the wrapper ran once, the other bytes stay, no `.tmp-` file, and the next `ensure()` is `registered` | as 2.10 |
| 2.18 | register, **a chain of links**: `settings → mid.json → settings.json` in a `dotfiles` folder, the real file `{"model":"x"}` with mode `0640` | `registered`; both links are still links; the real file deep-equals `{ model: 'x', env: { … } }` with mode `0640`; one backup beside the real file with mode `0640`; no backup in `~/.claude` | — (teeth M2.5, M2.7) |
| 2.19 | register, **a dangling chain**: the same chain, the real file missing | the line is `notRegistered('1.2.3', '<settings> is a link to <real>, which does not exist', RETRY_TAIL)`; the real file does not exist; `dotfiles` holds only `mid.json`; the first link stays; after the real file is written as `{}`, the next run is `registered` | the reason was `<settings> does not exist` |
| 2.20 | register, a loop: `settings → loop.json → settings` | the line is `notRegistered('1.2.3', '<settings> has more than 40 links (a loop, or a chain too long to open)', HAND_TAIL)`; both links stay | `<settings> does not exist`, with the retry tail |
| 2.21 | register: a chain of 41 links that ends in an existing file `{}` | the same line as 2.20; the file byte-identical | as 2.20 |
| 2.22 | register: `settings` is the link `missing/../real.json`; a decoy `~/.claude/real.json` | the line is `notRegistered('1.2.3', '<settings> is a link whose target goes through a folder that does not exist and then ".."', HAND_TAIL)`; the decoy byte-identical | as 2.20 |
| 2.23 | register, **the re-pointed link** (the shape of F3): `settings → a.json`; `b.json` holds the same bytes; `beforeWrite` points the link at `b.json` | the line is `notRegistered('1.2.3', <changed text>, RETRY_TAIL)`; `a.json` and `b.json` byte-identical; no backup in `dotfiles`; the next `ensure()` is `registered`, `b.json` has the key, `a.json` is still byte-identical | the line was `registeredLine`, and `a.json` was written |
| 2.24 | install, the ported `:421` (bytes changed: refused, the other bytes stay, no backup) and `:434` (another session registered first: settled) | unchanged and green | — (teeth M2.2, M2.14) |
| 2.25 | register: `~/.claude` made `0555`; once with no settings.json, once with `{ "model": "x" }`. And the ported `:454` (a read-only file), unchanged | each: the line is `notRegistered('1.2.3', '<~/.claude> is not writable (EACCES)', HAND_TAIL)`; settings as before; `~/.claude` holds nothing new | with no file: `<settings> does not exist`; with a file: `<settings> could not be written (EACCES)` and the retry tail |
| 2.26 | register: settings.json is a folder; is a link to a folder; is a file with mode `0000` | each: the line is `notRegistered('1.2.3', '<settings> could not be read (EISDIR)', HAND_TAIL)` (`EACCES` for the third); the folders stay empty; no backup | — (tooth M2.19) |
| 2.27 | register: no settings.json and a FOLDER at `<settings>.tmp-<pid>`, three runs; then the folder removed. Refusals 1j, first half: the same, one run | each run: the line matches `could not be written \(\w+\)` and ends with `RETRY_TAIL`; no settings.json, no backup; then `registered` | the line was `<settings> does not exist` |
| 2.27b | register (`replace: false`): no settings.json; `fs.linkSync` wrapped so that a FOLDER appears at `<settings>` just before the link (the name taken in the gap), restored in `finally` (the E2 plan round, 2026-11-11: the second `readOrNull` in `commitSettings` throws `EISDIR` on a folder) | `ensure()` does not throw; the outcome is `refused`, its line is `<settings> could not be written (<code>)` with `RETRY_TAIL` (the throw of the second `readOrNull` reaches `register`'s second catch — corrected by the cadence consultation, 2026-11-11); the folder is untouched and nothing else is written; a second `ensure()` reads the folder at the first read and answers `could not be read`, by hand (as 2.26) | `ensure()` threw, or the line read as `changed` with the folder treated as an empty file |
| 2.28 | install, the ported `:475` and refusals 1j, second half (the write fails after the backup, three runs) | unchanged: one backup, the file byte-identical | — (teeth M2.11, M2.20) |
| 2.29 | decide: `decideRegistration(guard.parseSettings(null), TARGET, HOME, '/a' + D + '/b')` | deep-equals `{ action: 'append', next: { env: { CLAUDE_CODE_PLUGIN_DIRS: '/a' + D + '/b' + D + TARGET } }, carried: 2 }` and the decision for `parsed({})` | — (a pin; 2.10 is the RED of the behaviour) |
| 2.30 | imports, **one road**. (A) in `agent-models-install.mjs`: the names imported from the guard installer hold `commitSettings` and `settingsFileOf` and none of `writeAtomic`, `effortTarget`, `sameBytes`; the text holds `commitSettings(` exactly once, and that call holds `replace: false`. (B) in `user-guard-install.mjs`: outside the body of `commitSettings`, no call of `writeSettings(` or `changedUnderUs(` (a declaration is not a call); the bodies of `install`, `repairRegistration` and `uninstall` each hold `commitSettings(` once and never the word `replace`. The companions: the body of `commitSettings` is found and holds both calls; the body finder finds `install` | all hold | (A): the imported names lack `commitSettings`; (B): `the body of commitSettings is found` fails |
| 2.31 | `git status --short -- tools/install-user-hook.test.mjs tools/effort-converge.test.mjs tools/ensure-user-guard.test.mjs`; then the three files run | no line; all green (107 cases on 2026-11-11) | — |
| 2.32 | `cmp` of the three changed modules with their copies; `node tools/adapter-check.mjs`; `npm test`; `npm run check`; `node tools/plan-lifecycle.mjs` | equal; all green | before the copy: adapter-check names the three `.claude/hooks/lib/` files |

**Teeth (RED → GREEN → RED), one at a time, each restored by the reverse edit.** "guard `:552`" is the guard's own
re-pointed-link test.

- **M2.1 The target re-check dropped** (`changedUnderUs` without `|| settingsFileOf(settingsPath).file !== target.file`)
  → 2.6, 2.23 and guard `:552` red.
- **M2.2 The byte re-check dropped** (`!sameBytes(now, original) ||` removed) → 2.6, the ported `:421` and `:434`, and
  the guard's `:114` and `:322` red.
- **M2.3 The mod's creation by rename.** (a) in `registerIn`, `replace: false` removed from the call → 2.17 (c) and
  2.30 (A) red. (b) in `commitSettings`, the option becomes `{ replace: true }` → 2.2, 2.3, 2.4 and 2.17 (c) red.
  (c) in `placeNew`, `fs.linkSync(tmp, dest)` becomes `fs.renameSync(tmp, dest)` → 2.2, 2.3, 2.4, 2.8 and 2.17 (c)
  red. (d) in `placeNew`, `|| lstatOrNull(dest) !== null` removed → 2.4 red. (e) in `placeNew`, the last two lines
  become `throw e;` → 2.4 red.
- **M2.4 The carry-over skipped** (`registerIn` calls `decideRegistration` without `inheritedPluginDirs`) → 2.11,
  2.12 and refusals A4 red.
- **M2.5 The mode not kept** (`writeSettings` passes `undefined` in place of `modeOf(file)`) → 2.5, 2.18, the ported
  `:490` and the guard's four mode tests red.
- **M2.6 The guard changed by the road.** (a) the default becomes `replace = false` → 2.9 red (the replaced
  `fs.linkSync` ran). (b) `writeSettings` gives a new file a fixed mode (`modeOf(file) ?? <a mode>`) → 2.1, 2.9 and
  2.10 red. (c) `repairRegistration` passes `replace: false` → 2.30 (B) red.
- **M2.7 The link not followed** (`commitSettings` writes at `settingsPath` in place of `target.file`) → 2.18, 2.23,
  the ported `:490` and the guard's three "writes through a symlinked settings.json" tests red.
- **M2.8 A dangling chain created** (the `dangling` line of `blocked` removed) → 2.19 red.
- **M2.9 A non-object `env` accepted** (the `isObject(settings.env)` line of `decideRegistration` removed) → the
  ported "env that is an array", "env that is a string" and refusals 1i red.
- **M2.10 No backup** (the body of `prepare` in `registerIn` emptied) → 2.12, 2.18 and the first ported install case red.
- **M2.11 The backup not once** (`backupOnce` returns `writeBackup(file, bytes, mode)` always) → the ported `:475` red.
- **M2.12 The file's writable check dropped** (`const file = '';` in `blocked`) → the ported `:454` red.
- **M2.13 The folder's writable check dropped** (`const reason = '';` in `blocked`) → 2.25 red.
- **M2.14 The settled branch dropped** (`settledOrChanged` always refuses) → 2.17 and the ported `:434` red.
- **M2.15 A loop not refused** (the `target.refusal` line of `blocked` removed) → 2.20, 2.21, 2.22 red.
- **M2.16 `prepare` before the re-check** (the two lines of `commitSettings` swapped) → 2.6, 2.23, the ported `:421`
  and `:434`, and the guard's `:322` and `:552` red.
- **M2.17 A non-string value accepted** (the `typeof value !== 'string'` line removed) → the ported "a plugin dirs
  value that is not a string" red.
- **M2.18 The registration off the road** (in `registerIn`, the `commitSettings(…)` call replaced by `beforeWrite();`,
  `prepare();`, `writeAtomic(target.file, serialise(decision.next));` and `const done = { written: true };`, with
  `writeAtomic` imported in place of `commitSettings`) → 2.30 (A), 2.10, 2.17, 2.18, 2.23 and the ported `:421` red.
- **M2.19 A read error told as a write error** (the first catch of `register` returns the second's text and `true`)
  → 2.26 red.
- **M2.20 A write error told as a read error** (the reverse) → 2.27 and the ported `:475` red.
- **M2.21 An existing file not replaced under `replace: false`** (`replace || original !== null` becomes `replace`)
  → 2.5, 2.12, 2.18 and the first ported install case red.
- **M2.22 The look-then-rename fallback put back** (`placeNew`'s catch: `if (lstatOrNull(dest) !== null) return
  false; fs.renameSync(tmp, dest); return true;` for a non-`EEXIST` error) → 2.4 red (both halves).

**The brief.**

1. Check that E2.S1 is committed (`settings/hooks/lib/agent-models-install.mjs` exists; its `registerIn` calls
   `effortTarget`). Run `npm test` and the three guard files; write down the counts.
2. **Tests first.** Write `tools/agent-models-register.test.mjs`: the road cases 2.1-2.9 and the registration cases
   2.11-2.15, 2.17-2.23, 2.25-2.27 and 2.27b. Import `* as guard` from `user-guard-install.mjs`, `fs` from `node:fs` (the
   same object the module calls, so 2.4, 2.9 and 2.17 (c) can replace `fs.linkSync` and restore it in `finally`), the lines and `sandbox`, `symlinkOrSkip`,
   `snapshot`, `IS_ROOT`, `D` from the fixtures, and `ownedDir` for the road's folder. Every expected line is built with the fixtures'
   builders (`notRegistered`, `installedLine`, `registeredLine`, `carriedText`, `RETRY_TAIL`, `HAND_TAIL`); the changed
   text is one constant of the test file. Set the umask with `process.umask` and restore it in `finally`; restore
   every `chmod` in `finally`. Name each test for its guarantee. Then: rewrite install `:406` to 2.10; rewrite the
   first half of refusals 1j to 2.27's one run; in decide, delete the `missing` assertion and add 2.29; add 2.30 to
   imports (a body finder: from `function <name>(` at a line start, with or without `export`, to the first line that
   is exactly `}`). Run:
   ```bash
   node --test tools/agent-models-register.test.mjs tools/agent-models-install.test.mjs tools/agent-models-refusals.test.mjs tools/agent-models-decide.test.mjs tools/agent-models-imports.test.mjs
   ```
   Keep the RED messages. They must be the ones of the table; any other red is a stop.
3. **The road.** In `settings/hooks/lib/user-guard-install.mjs`: R1, R2, R3, R4, nothing else. Run:
   ```bash
   node --test tools/install-user-hook.test.mjs tools/effort-converge.test.mjs tools/ensure-user-guard.test.mjs tools/agent-models-register.test.mjs
   ```
   The three guard files are green with the counts of step 1; 2.1-2.9 are green (2.9 was green before this step
   too); the registration cases are still red.
4. **The registration.** R5 in `agent-models-decide.mjs`, R6 in `agent-models-install.mjs`. Run the command of step 2
   and the swap and report files: all green. Then
   `grep -nE "missing: true|parsed\.missing|effortTarget|writeAtomic|sameBytes" settings/hooks/lib/agent-models-install.mjs settings/hooks/lib/agent-models-decide.mjs`
   prints no line.
5. **Teeth.** M2.1-M2.22, one at a time: make the edit, run the files of steps 2 and 3, write down the red tests and
   one message each, undo. A tooth that turns nothing red is a stop: report it.
6. **The mirror.** Copy the three modules to `.claude/hooks/lib/`; `cmp` each; `node tools/adapter-check.mjs`.
7. The pointer grep of E2.S1's brief, step 5, and the company scan of E1.S2's brief, step 5, over the new and changed
   files. Then:
   ```bash
   npm test
   npm run check
   node tools/adapter-check.mjs
   node tools/plan-lifecycle.mjs
   ```
   and 2.31's `git status` line.
8. **Commit** by path (the three modules, their three copies, the five test files):
   `feat(adapter): the agent-models registration on the one settings road — a missing file created, never replaced; the link target checked again`,
   with the RED messages, the GREEN counts, each tooth with the tests it turned red, the sentence "the guard's
   behaviour is unchanged", and the `npm test` counts before and after in the body. Do not touch `ensure-user-guard.mjs`, `agent-models-swap.mjs`,
   `agent-models-read.mjs`, the three guard test files or any plan.

**Done when** 2.1-2.32 hold and M2.1-M2.22 were each seen red and restored; the registration writes settings.json
only through `commitSettings`, and so do the guard's three operations; a re-pointed link with the same bytes is
refused; a missing file is created with only the registration, with the mode the guard's creation has, and never in
place of a file that appeared; a dangling chain is a retry and creates nothing; the guard does what it does at HEAD
(2.9, 2.30 (B)) and its three test files are unchanged and green; and
`npm test`, `npm run check`, `node tools/adapter-check.mjs` and `node tools/plan-lifecycle.mjs` are green.

---

## E2.S3 — The session-start step, every line said once, and the research docs

- **Size** M. **Model** scenarios and brief: Opus (here); code: Sonnet.
- **Goal.** A session that starts in a consumer runs a third step, `ensureAgentModelsMod`, after the guard and effort,
  each isolated by `guardStep`. It copies `<project>/.agents/conventions/mods/agent-models` and registers it, or skips,
  or refuses — and says each thing once. The research docs describe the step as built.

**Decisions** (Opus, 2026-11-11; each carries a point of the parent's Design B into code).

- **D3.1 Where the source is.** `mod = path.resolve(path.dirname(source), '..', '..', '.agents', 'conventions', 'mods',
  'agent-models')`, where `source` is the `<project>/.claude/hooks/subagent-model.mjs` that `main` already builds
  (F9). `main` and its `args` do not change except the third step. No `mod` seam: the tests build the layout.
- **D3.2 The order of the skips**, each returning `skipped()` and writing nothing: `AGENT_MODELS_MOD=off` (trimmed, any
  case); `platform === 'win32'` (a `platform = process.platform` seam); `isReferenceRepository(source)` — the same
  `source` the guard step uses, never the mod's root (the parent's Design B); the marker `~/.claude/mods/agent-models.optout`;
  a missing `mod` folder (silent). `SUBAGENT_MODEL_GUARD=off` is not read. Then
  `ensureAgentModels({ home, source: mod, inheritedPluginDirs: env.CLAUDE_CODE_PLUGIN_DIRS })` — no `released`.
- **D3.3 Every refusal said once** (in `agent-models-install.mjs`). Every outcome whose action is `refused` goes through
  `saidOnce` with the key `line:<sha256 of the line>`, so a new reason, version or digest gives a new line and the same
  one is silent (`repeated: true`, line `''`). The symlinked target keeps its own key. A refusal before the mods folder
  is known good (a source refusal, F7) first calls `modsProblem(t)`: when it answers `''`, the line is said once (the
  reported file is then the only file in `~/.claude/mods`); when it names a problem, nothing can be recorded and the
  line stands at every start. The install and upgrade still forget the reported file (`rmQuiet`), so a new copy is
  new information. The reported file stays `{ key, at }`, overwritten.
- **D3.4 The stale submodule line.** An outcome of a source refused with `unreleased: true` carries `unreleased: true`.
  `ensureAgentModelsMod` appends to a non-empty line of such an outcome the advice
  ` — the .agents/conventions submodule does not hold the pinned release; run git submodule update (said once)`.
  The install module keeps no word about the layout (E1.S3 decision 5).
- **D3.5 SPEAKING** becomes `['installed', 'upgraded', 'refused', 'newer', 'repaired', 'converged', 'edited', 'registered']`.
- **D3.6** The header of `ensure-user-guard.mjs` gains a paragraph `Agent-models mod.` saying D3.1-D3.4 in five lines.

**Files.**

| File | How |
|---|---|
| `settings/hooks/ensure-user-guard.mjs` | changed: `ensureAgentModelsMod` (new, from the source's `:158-186` rewritten by D3.1-D3.4), `SPEAKING` `:185` (D3.5), `main` `:195` runs the third step, the header (D3.6) |
| `settings/hooks/lib/agent-models-install.mjs` | changed: D3.3 and the `unreleased` flag of D3.4 |
| `.claude/hooks/ensure-user-guard.mjs`, `.claude/hooks/lib/agent-models-install.mjs` | the mirror copies, same commit |
| `tools/agent-models-step.test.mjs` | ported with rewrites S-R1-S-R5, plus the new cases 3.15-3.16 |
| `tools/agent-models-report.test.mjs` | changed: the new cases 3.17-3.18 |
| `tools/agent-models-install.test.mjs`, `tools/agent-models-refusals.test.mjs`, `tools/agent-models-swap.test.mjs` | rewritten ONLY where D3.3 changes what a case sees (rewrite S-R6) |
| `research/module_rules.md` | changed: a new section after § *The subagent-model rule and the guard that enforces it* (`:54-98`) |
| `research/module_tests.md` | changed: after the `ensure-user-guard.test.mjs` paragraph (`:217-243`) |

**The step test rewrites, each by name** (source `tools/agent-models-step.test.mjs`).

- **S-R1** No `consumer-mount.mjs`, no `login-method-fixtures.mjs`. The file's own `sandbox` builds a consumer-shaped
  project: `<project>/.claude/hooks/` = a copy of this repository's `settings/hooks/` (the real released guard
  included), and `<project>/.agents/conventions/mods/agent-models/` = a copy of `mods/agent-models/`. The spawned run is
  `<project>/.claude/hooks/ensure-user-guard.mjs` with `CLAUDE_PROJECT_DIR=<project>`, `HOME` and `USERPROFILE` = the
  temporary home, and `SUBAGENT_MODEL_GUARD`, `AGENT_MODELS_MOD`, `CLAUDE_CODE_PLUGIN_DIRS` empty. `step(env, platform)`
  calls `ensureAgentModelsMod({ home, source, env, platform })`.
- **S-R2** `LOGIN_LINE` and the login step leave every expected list (F11's six cases).
- **S-R3** `GUARD_LINE` is built from `RELEASED_GUARD.version`, `MOD_LINE` from `installedLine(RELEASED_MOD.version)`,
  `MOD_VERSION` from `RELEASED_MOD.version`; nothing typed.
- **S-R4** The reference cases `:207` (7a) and `:217` (7b) become 3.3 and 3.4.
- **S-R5** The missing-settings cases `:155` and `:170` become 3.8.
- **S-R6** In the other ported files, a case that is red after D3.3 ONLY because `agent-models.reported.json` now exists
  after a refusal, or because a repeated refusal now has the line `''` and `repeated: true`, is rewritten to assert
  exactly that, and named in the commit body. Known ones: install `sourceRefusal` (`:203-217`: "no mods folder made"
  becomes "the mods folder holds only the reported record"), install `:454` and `:475` (the second and third runs are
  silent; the backup counts stay), install `:508` (its `listMods` after the refused registration), refusals A6 `:68`
  (its snapshot), swap F2 `:65`, F3b `:81` and 3e `:487` (their `listMods`). Any red of another kind is a stop.

**Scenarios.** Every case first runs RED for the reason named, then GREEN. "step" is `tools/agent-models-step.test.mjs`,
"report" is `tools/agent-models-report.test.mjs`. The lines come from the fixtures' builders.

| # | Given / When | Then | RED before the change |
|---|---|---|---|
| 3.1 | step: a fresh home, one spawned run | one stdout line; lines `[GUARD_LINE, EFFORT_LINE, MOD_LINE]`; the mod's `plugin.json` installed; `env.CLAUDE_CODE_PLUGIN_DIRS` lists the installed folder | `ensureAgentModelsMod` is not exported; the spawned lines lack `MOD_LINE` |
| 3.2 | step: a second spawned run | stdout `''` | — (the companion of 3.1) |
| 3.3 | step: a project with this repository's layout at its root (`tools/rules.mjs`, `settings/hooks/subagent-model.mjs`) AND the mod folder under `.agents/conventions` | `skipped`; the home byte-identical (snapshot) | as 3.1 |
| 3.4 | step: a consumer whose `.agents/conventions` holds the full layout (`tools/rules.mjs`, `settings/hooks/subagent-model.mjs`, `mods/agent-models`) | `installed` | as 3.1 |
| 3.5 | step: `AGENT_MODELS_MOD` = `off`, `OFF`, ` off ` | `skipped` each; the home byte-identical | as 3.1 |
| 3.6 | step: the opt-out marker | `skipped`; a spawned run's stdout holds no `agent-models`; no installed folder | as 3.1 |
| 3.7 | step: `platform` `'win32'` on an empty home | `skipped`; `fs.readdirSync(home)` is `[]` | as 3.1 |
| 3.8 | step: spawned with `SUBAGENT_MODEL_GUARD=off` and no settings.json | lines `[MOD_LINE]`; settings.json deep-equals `{ env: { CLAUDE_CODE_PLUGIN_DIRS: <installed> } }` (E2.S2's creation, end to end); no guard hook in the home | as 3.1 |
| 3.9 | step: `<project>/.claude/hooks/lib/agent-models-install.mjs` replaced by one whose `ensureAgentModels` throws | lines `[GUARD_LINE, EFFORT_LINE]`; no mods folder | — (green before: there is no third step yet; M3.8 is its RED) |
| 3.10 | step: a project without `.agents/conventions/mods` | lines `[GUARD_LINE, EFFORT_LINE]`; no mods folder | — (green before; silent skip) |
| 3.11 | step: an edited installed copy, spawned twice (`SUBAGENT_MODEL_GUARD=off`) | `[editedLine(MOD_VERSION)]`, then stdout `''` | the first run prints nothing: `edited` is not in `SPEAKING` |
| 3.12 | step: the released copy and its record installed, settings `{}`, spawned (`SUBAGENT_MODEL_GUARD=off`) | `[registeredLine]` | nothing printed: `registered` is not in `SPEAKING` |
| 3.13 | step: spawned with `CLAUDE_CODE_PLUGIN_DIRS=/a`, settings `{}` | `[MOD_LINE + carriedText(1)]`; the value is `/a<delimiter><installed>` | as 3.1 |
| 3.14 | step: **Part A** — the home holds the seven released files, a record `{ version: '1.3.3', source: '/elsewhere', sha256: <their digests>, installedAt, by: 'self-install' }` and a registered settings.json | `{ action: 'none', line: '' }`; the home byte-identical | as 3.1 |
| 3.15 | step: the stale submodule. The project's mod copy with its `plugin.json` version text changed to `1.3.2`; spawned twice (`SUBAGENT_MODEL_GUARD=off`) | first: one line, `notInstalled('source <mod> is not the released mod 1.3.3: .claude-plugin/plugin.json is version 1.3.2, released 1.3.3')` + the D3.4 advice; second: stdout `''`; `~/.claude/mods` holds only `agent-models.reported.json` | the line repeats at the second run, and has no advice |
| 3.16 | step: one byte appended to `hooks/prompts.ts` of the copy, twice in a row, then another byte | the line names `hooks/prompts.ts` with both digests, once; after the second change, a new line once | as 3.15 |
| 3.17 | report: every refusal said once, through `ensure` — an unparsable source `plugin.json`, settings `{ env: [] }`, and swap F2 (`EPERM` on the first rename) — each run twice | the first run's line as before; the second: `refused`, line `''`, `repeated: true`; after `{ env: [] }` is fixed, the next run says `registeredLine` | the second runs repeat the line |
| 3.18 | report: the reported file never grows — after 3.17's three refusals, an edited-copy cycle and a newer copy | `agent-models.reported.json` parses to an object with exactly the keys `key` and `at`, is under 1 KB, and is the only `*.reported.json` in the mods folder | — (green before for its own cases; M3.6 is its RED) |
| 3.19 | S-R6's rewritten cases | pass, each asserting the said-once shape | red for the reason S-R6 names |
| 3.20 | `tools/ensure-user-guard.test.mjs` (its `:304` consumer case included), `tools/effort-converge.test.mjs`, `tools/install-user-hook.test.mjs` | unchanged and green | — |
| 3.21 | `cmp` of the two changed modules with their copies; `node tools/adapter-check.mjs`; `npm test`; `npm run check`; `node tools/plan-lifecycle.mjs` | equal; all green | before the copy: adapter-check names `.claude/hooks/ensure-user-guard.mjs` |
| 3.22 | read the two research sections against the code | `module_rules.md` names `ensureAgentModelsMod`, the source path, each skip of D3.2 in its order, the released check, the swap's put-back, the registration road of E2.S2, the said-once rule and `SPEAKING`; `module_tests.md` names each agent-models test file with its case count (from the runner), what the files do not prove, and the two known gaps (F14: CI does not run the mod's `.tsx` tests; Sonar's `sources=tools` covers neither `settings/hooks` nor `mods`) | — (a docs check) |

**Teeth (RED → GREEN → RED), one at a time, each restored by the reverse edit:**

- **M3.1** `edited` out of `SPEAKING` → 3.11 red. `registered` out → 3.12 red.
- **M3.2** the reference test on the mod's root (`isReferenceRepository(path.join(mod, '..', '..', 'settings', 'hooks', 'x'))`)
  → 3.4 red (skipped). And the reference skip removed → 3.3 red.
- **M3.3** the `win32` skip removed → 3.7 red.
- **M3.4** `optedOut(env)` added to the skips → 3.8 red.
- **M3.5** D3.3 removed (refusals said every start) → 3.15's second run, 3.16 and 3.17 red.
- **M3.6** `writeReported` appends (`fs.appendFileSync`) → 3.18 red.
- **M3.7** D3.4's advice removed → 3.15 red.
- **M3.8** the third step called outside `guardStep` → 3.9 red (no lines at all).
- **M3.9** the mod step run before the guard step in `main` → 3.1 red (the line order).

**The brief.**

1. Check that E2.S1 and E2.S2 are committed (`agent-models-install.mjs` exists and a missing settings.json is created).
   Run `npm test` and write down the counts.
2. **Tests first.** Copy `<source port>/tools/agent-models-step.test.mjs`; apply S-R1-S-R5 (import `RELEASED_GUARD`
   from `user-guard-install.mjs`, `RELEASED_MOD` from `agent-models-decide.mjs`, the lines from the fixtures; copy
   folders with `fs.cpSync`, leaving out `*.test.mjs`; temporary folders by `ownedDir` only) and add 3.15-3.16. Add
   3.17-3.18 to report.test. Run `node --test tools/agent-models-step.test.mjs tools/agent-models-report.test.mjs` and keep the RED
   messages.
3. **The step.** In `settings/hooks/ensure-user-guard.mjs`: import `ensureAgentModels` and `modTargets` from
   `./lib/agent-models-install.mjs`; write `ensureAgentModelsMod({ home, source, env, platform = process.platform })` by
   D3.1, D3.2 and D3.4; D3.5; `main` runs `guardStep(ensureAgentModelsMod, args)` third; D3.6.
4. **Said once.** In `agent-models-install.mjs`, D3.3 and the `unreleased` flag: one helper that takes a refused
   outcome and returns it said once (key `line:` + `sha256(line)`, imported from `./agent-models-decide.mjs`), used by
   every `refused` return of `run` except the symlinked target, which keeps its key.
5. Run every agent-models test file. Apply S-R6 to exactly the cases it names; any other red is a stop. GREEN. Do
   M3.1-M3.9 one at a time; write down the red test and its message; undo.
6. Copy both modules to `.claude/hooks/` (`ensure-user-guard.mjs` and `lib/agent-models-install.mjs`); `cmp` each;
   `node tools/adapter-check.mjs`.
7. **The research docs.** `research/module_rules.md`: a new section `## The agent-models mod and its self-install
   (2026-11-11)` after `:98`, in this repository's style (plain paragraphs, dates, file names), covering 3.22's list.
   `research/module_tests.md`: one paragraph per agent-models test file after `:243`, with the case counts the runner
   printed, what each does not prove, and the two gaps. Change no other section.
8. `npm test`, `npm run check`, `node tools/adapter-check.mjs`, `node tools/plan-lifecycle.mjs`.
9. **Commit** by path (the two modules, their two copies, the test files, the two research files):
   `feat(adapter): the agent-models step at session start — skips, said-once lines, the stale-submodule advice`,
   with the RED messages, the GREEN counts, each tooth with its red test, the S-R6 list and the `npm test` counts
   before and after in the body.

**Done when** 3.1-3.22 hold and M3.1-M3.9 were each seen red and restored; the reported file stays one file; the guard
and effort lines survive a throwing mod step; the research docs describe the step as built with the two gaps; and
`npm test`, `npm run check`, `node tools/adapter-check.mjs` and `node tools/plan-lifecycle.mjs` are green.
