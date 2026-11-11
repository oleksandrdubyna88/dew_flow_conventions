# PLAN — agent-models mod, E2: the complete self-install

> Status: **plan only, nothing implemented yet, 2026-11-11.** Stories of epic E2 of
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

- **Size** M. **Model** scenarios and brief: **Fable** (written after this document is committed, so the cornerstone
  is in the parent's ledger first); code: Sonnet; review: Opus. Fable unavailable → Opus, said in the summary.
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

**Files** (the spec settles the ones marked "may").

| File | How |
|---|---|
| `settings/hooks/lib/agent-models-install.mjs` | changed: the registration (`registerIn`, `appendRegistration`, `settledOrChanged`, `register`, source `:57-98`) |
| `settings/hooks/lib/user-guard-install.mjs` | may change: `export` added before `settingsFileOf` (`:472`) and `changedUnderUs` (`:458`), or one shared settings-write function extracted from the guard's road (Q1) — no second body either way |
| `settings/hooks/lib/agent-models-decide.mjs` | may change: `decideRegistration`'s `missing` branch (`:253`) (Q4) |
| the `.claude/hooks/lib/` copy of each changed module | the mirror copies, same commit |
| `tools/agent-models-install.test.mjs` | changed: the ported `:406` case ("never created") rewritten to Design B |
| `tools/agent-models-refusals.test.mjs` | changed: the first half of 1j (`:25-36`) rewritten: a missing file is no longer "does not exist" |
| `tools/agent-models-register.test.mjs` | new (suggested): the registration cases of the parent's test plan — a missing file created with only the registration; a chain of links registered at its last target; a dangling chain; a link re-pointed between read and write refused (the shape of F3); the carry-over into a created file |
| `tools/agent-models-decide.test.mjs` | changed only if `decide.mjs` changes |
| `tools/install-user-hook.test.mjs`, `tools/effort-converge.test.mjs`, `tools/ensure-user-guard.test.mjs` | unchanged and green: the guard's road and the effort road keep their behaviour |

**The questions the spec must answer.**

- **Q1 The one road.** Export `settingsFileOf` and `changedUnderUs` (F2) and assemble the registration in
  `agent-models-install.mjs`, or extract the guard's read → resolve → backup → re-check → write sequence into one
  exported function of `user-guard-install.mjs` that both `install`/`repairRegistration` and the registration call
  (reuse-first, move 2)? If the second: does the guard's road keep its own tests unchanged, and where does the
  mod-specific "settled" branch live?
- **Q2 Backup.** `backupOnce` (the port: a retry adds no file) or the guard's `writeBackup` (a new file per write)? And
  none for a file that did not exist?
- **Q3 The re-check.** After `beforeWrite`: bytes changed → the port's "settled" branch (another session registered
  first is not an error) or a refusal? Target changed with equal bytes → refused, retry? What `beforeWrite` sees and
  where it runs (after the backup, before the re-check, as in the guard's road)?
- **Q4 A missing file.** Decided as `{ settings: {} }` by the caller, or `decideRegistration`'s `missing` branch made to
  answer as an empty value (an E1 file)? Which mode does a created file get (`writeAtomic` with no mode takes the
  umask; the file may later hold tokens in `env`)? Does `~/.claude` get created when it is missing?
- **Q5 Creation and a race.** `writeAtomic` renames over the destination. A file that ANOTHER start creates between the
  re-check and the rename (the guard step of a parallel session does exactly that on a fresh machine) would be
  replaced. How is a missing file created so that a file that appeared is never overwritten — an exclusive create of
  the final name, a re-check that is part of the write, or a refusal with retry?
- **Q6 Links.** The parent says a missing file is created AND "a dangling chain of links is a retry, not a fix by
  hand"; `settingsFileOf` (`:472-483`) answers a dangling chain with its last target, where the guard's road creates
  the file. Which one holds for the mod? And the `> 40 links` and `MISSING_FOLDER` refusals of `settingsFileOf`: the
  "fix by hand" tail or the retry tail?
- **Q7 Writable.** `writableReason` on an existing file (the port: fix by hand). And for a file to be created: the
  folder's writability, or the write's own error as a retry?
- **Q8 The value edge cases.** An existing value with empty entries (`/a::/b`) or a trailing delimiter: kept verbatim
  and appended to (F5), or cleaned? `~` alone, `~/` with a trailing separator, the target already listed in another
  spelling. `env` present without the key, `env` with the key `''`, the file `{}`: all carry the session's entries?
- **Q9 The refusal texts and tails.** Which reasons are retry and which are fix by hand, per reason, with the text of
  each; what a created file adds to the `installed` and `registered` lines, if anything.
- **Q10 Reads that fail.** settings.json that is a folder, unreadable, or a link to a folder: one refusal each, nothing
  written, and which tail?
- **Q11 What stays as it was.** The guard's `install`, `repairRegistration`, `uninstall` and the effort road keep their
  behaviour and their tests byte for byte, or a named, tested change if Q1 extracts a shared function.
- **Q12 The RED order and the teeth.** Which production line of the road, removed, turns which test red: at least the
  target re-check (the F3 shape), the byte re-check, the mode keep, the link follow, the creation guard of Q5, the
  carry-over into a created file, and the non-object `env` refusal.

**Done when** the spec's scenarios hold and its teeth were each seen red and restored; the registration is one function
on one road; a re-pointed link with the same bytes is refused; a missing file is created with only the registration;
the guard, effort and self-install suites are unchanged and green; `npm test`, `npm run check` and
`node tools/adapter-check.mjs` are green.

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
