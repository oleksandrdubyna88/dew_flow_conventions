# PLAN — agent-models mod, E1: the release payload and its identity

> Status: **IMPLEMENTED, 2026-11-12.** Built on `feat/agent-models-mod-e1` (ec9b570 … 248065d), two coai code rounds
> `proceed` and an Opus review, merged with E2 in #160 (`d23a2ea`); deviations in the parent's § *Shipped, observed,
> deviations*. Stories of epic E1 of
> [PLAN_agent_models_mod.md](PLAN_agent_models_mod.md) (§ *Epics*, E1), written by Opus when the epic started. Scope:
> the helper exports of `settings/hooks/lib/user-guard-install.mjs`, the read-only installer modules
> `agent-models-decide.mjs` and `agent-models-read.mjs`, mod 1.3.3 in `mods/agent-models/` with its `eol=lf` rule, the
> pin table, `RELEASED_MOD` and the released-copy check, and their tests. Nothing runs at session start yet, and no
> module of E1 writes to the user's home. This document keeps no change ledger: a change to E1's approved work is an
> entry in the parent's `## Plan changes`. One story is a cornerstone and is marked `model: fable` (E1.S3); the
> parent's ledger line counts it.

Done when (the parent's E1): `RELEASED_MOD` was watched RED, then equals the newest pin row, and that row equals the
files at HEAD. A source that differs in one file or in the version gives a refusal that names the first file. The
export step changed no behaviour and the suite is green. The company scan re-run on the branch finds nothing.
`claude plugin validate mods/agent-models` and `claude plugin test mods/agent-models` pass by hand. The code round and
the Opus review are resolved.

```bash
npm ci --ignore-scripts          # only when node_modules is missing
npm test
npm run check
node tools/adapter-check.mjs
node tools/plan-lifecycle.mjs
claude plugin validate mods/agent-models
claude plugin test mods/agent-models
```

## The mirror rule (every story)

Every commit that changes a file under `settings/hooks/**` copies the same bytes to `.claude/hooks/**` in the SAME
commit, as #158 did. This repository's own session start imports `.claude/hooks/**`, and `tools/adapter-check.mjs`
(`referenceHookFiles`, `:44`) demands a verbatim copy of every `settings/hooks/**/*.mjs` that is not a test. So
`node tools/adapter-check.mjs` is red between the edit and the copy, and green after it. Check each copy with `cmp`.

## Gates, models, branch

- **Branch** `feat/agent-models-mod-e1` (the gate gives each epic its own branch). E1 and E2 share one pull request (the parent's build-order step 6); E1 has its
  own code round. One commit per story; E1.S1 has two (the export-only commit first).
- **Gates.** `open` with `callerModel`; `review_code` over E1's commits with this document and the parent as
  `planText`, `baseRef` = the merge base with `main` (`git merge-base HEAD origin/main` after a fetch). The Opus
  review runs at the same time. A reply's `commands` are followed and named.
- **Models.** Scenarios and briefs: Opus (this document) for E1.S1 and E1.S2; **Fable** for E1.S3. Code and tests:
  a Sonnet coder per story. Review: Opus. Fixes: Sonnet.

## Facts (read 2026-11-11 in this worktree and in the source port)

- **F1** This repository's `settings/hooks/lib/user-guard-install.mjs` holds as PRIVATE declarations, each with the
  same body as the source's exported one: `sha256` `:26`, `normalise` `:73`, `isObject` `:80`, `writeAtomic` `:174`
  (here it also `chmod`s the temp file, a later fix — this body wins), `readOrNull` `:186`, `sameBytes` `:188`,
  `parseSettings` `:191`, `serialise` `:216`, `writableReason` `:432`, `lstatOrNull` `:550`, `effortTarget` `:560`,
  `backupOnce` `:565`. `existingSettingsFile` is the source's name for `effortTarget` (source `:369`).
- **F2** The source's `agent-models-swap.mjs:20-27` `lstatOrNull` and `agent-models-decide.mjs:41` `sha256` are second
  bodies of F1's `lstatOrNull` and `sha256`. Here they are imported from `user-guard-install.mjs`, never defined again
  (reuse-first, move 1 — the parent's own rule for the other helpers).
- **F3** `tools/lib/agent-models-fixtures.mjs:12` imports `agent-models-install.mjs` (E2) only for `sandbox().ensure`
  (`:115`). `tools/agent-models-decide.test.mjs:11` imports `agent-models-install.mjs` only for its re-exports of
  `agent-models-decide.mjs`; it uses nothing else from it.
- **F4** The direct read cases and the reuse checks live in the source's `agent-models-install.test.mjs` (E2's file in
  the parent's table): `readSource` `:245-252`, `readTarget` `:323-332`, the exported-helper list `:526-530`, the
  import scan `:532-548`.
- **F5** The source mod is 20 files, 214,993 bytes: 7 shipped files, `tests/` with **11** files (8 `*.test.tsx`, 3
  fixture `.tsx`), `tsconfig.json`, `.gitignore`. No symlink, no CR byte, no raw control byte (`tools/source-bytes.test.mjs`
  stays green). The 7 shipped files hash to the 1.3.3 row of the source's `tools/agent-models-pins.json`
  (10 rows, `1.0.0` to `1.3.3`).
- **F6** The source port lives only in the session scratchpad
  (`…/scratchpad/k-mods/mods/agent-models/` and `…/scratchpad/k-repo/`). A WSL restart empties it. If it is gone, the
  coder stops and asks the caller; it never fetches the source again by itself.
- **F7** Test count of the E1 files in the source: `agent-models-decide.test.mjs` 28 (first written as 27; both the
  source and the port run 28), `agent-models-extract.test.mjs`
  18, `agent-models-pin.test.mjs` 8.

## Which ported tests belong to E1 (settled by their imports)

| Source test or support file | Its imports | Epic · story |
|---|---|---|
| `tools/agent-models-decide.test.mjs` | `agent-models-install.mjs` (re-exports of decide only), `user-guard-install.mjs`, fixtures | **E1.S1**, the import rewritten to `agent-models-decide.mjs` |
| `tools/agent-models-extract.test.mjs` | `tools/lib/owned.mjs` only; reads `mods/agent-models/hooks/` | **E1.S2**, verbatim |
| `tools/agent-models-pin.test.mjs` | `agent-models-decide.mjs`, `tools/lib/agent-models-pin.mjs`, fixtures, `owned.mjs` | **E1.S3**, ported plus new cases |
| `tools/lib/agent-models-fixtures.mjs` | `agent-models-install.mjs` (for `ensure` only), `owned.mjs` | **E1.S1**, without the install import and `ensure` |
| `tools/lib/agent-models-pin.mjs` | `agent-models-decide.mjs` | **E1.S3**, verbatim |
| `tools/agent-models-pins.json` | — | **E1.S3**, verbatim |
| `tools/agent-models-install.test.mjs` | `agent-models-install.mjs` | E2 (its F4 cases move to E1, see below) |
| `tools/agent-models-swap.test.mjs` | `agent-models-install.mjs` | E2 |
| `tools/agent-models-refusals.test.mjs` | fixtures only, but every case calls `sandbox().ensure` → install | E2 |
| `tools/agent-models-report.test.mjs` | fixtures only, but every case calls `sandbox().ensure` → install | E2 |
| `tools/agent-models-step.test.mjs` | `ensure-user-guard.mjs`, `consumer-mount.mjs`, `login-method-fixtures.mjs` | E2 |

Two new E1 test files hold the F4 cases, so E1's modules are tested without E2: `tools/agent-models-read.test.mjs`
(E1.S1, and E1.S3 adds its cases) and `tools/agent-models-imports.test.mjs` (E1.S1).

## Boundary with E2 (the same table goes into E2's stories document)

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
`research/`.

## Order

**E1.S1 and E1.S2 first, in either order (they share no file); E1.S3 last.** E1.S3 needs `agent-models-decide.mjs`
(S1) for `RELEASED_MOD`, and `mods/agent-models/` (S2) for the pin row at HEAD. This is why E1 cannot follow the
parent's build-order steps 2 and 3 literally: step 2 names `RELEASED_MOD` and the pin test, and both import
`agent-models-decide.mjs`, which step 3 ports.

## Growth

In git: the mod folder (about 215 KB), the pin table (about 6 KB, one row added per release, rows never changed), and
about 1,500 lines of tests. At run time nothing: no E1 module writes a file, and the read modules read only what a
caller names.

---

## E1.S1 — The shared helpers exported, and the read-only installer modules ported

- **Size** M. **Model** scenarios and brief: Opus (here); code: Sonnet.
- **Goal.** `user-guard-install.mjs` exports the helpers the installer reuses, with no behaviour change, as its own
  commit. Then `agent-models-decide.mjs` and `agent-models-read.mjs` exist here, ported with their pointer rewrites,
  importing each helper from `user-guard-install.mjs` and nothing from E2. Their pure decisions and reads are tested
  without E2.

**Files.**

| File | How |
|---|---|
| `settings/hooks/lib/user-guard-install.mjs` | changed: `export ` added before the 12 declarations of F1; no other byte |
| `settings/hooks/lib/agent-models-decide.mjs` | ported with rewrites R1, R2, R3 |
| `settings/hooks/lib/agent-models-read.mjs` | ported with rewrites R4, R5 |
| `.claude/hooks/lib/user-guard-install.mjs`, `.claude/hooks/lib/agent-models-decide.mjs`, `.claude/hooks/lib/agent-models-read.mjs` | the mirror copies, same commits |
| `tools/lib/agent-models-fixtures.mjs` | ported with rewrite R6 |
| `tools/agent-models-decide.test.mjs` | ported with rewrite R7 |
| `tools/agent-models-read.test.mjs` | created: the F4 read cases, direct |
| `tools/agent-models-imports.test.mjs` | created: the F4 reuse cases, derived (rewrite R8) |

**The rewrites, each by name.**

- **R1** `decide.mjs:6-7`, the mount pointer (`.claude/rules/shared/settings/hooks/lib/`), becomes the two lines of
  the first block below.
- **R2** `decide.mjs:178`, `(plan § The loading contract)`, becomes `(observed before this port; not re-measured in
  this repository)`. The claim stays; its address goes.
- **R3** `decide.mjs:9` (`import { createHash }`) goes; `:13` becomes `import { isObject, normalise, sha256 } from
  './user-guard-install.mjs';`; `:41` (`export const sha256 = …`) becomes `export { sha256 };`. One body (F2).
- **R4** `read.mjs:5-6`, the mount pointer, becomes the two lines of the second block below.

```text
 * Imports only `node:` builtins and `./user-guard-install.mjs` because a consumer runs it from its verbatim copy in
 * `.claude/hooks/lib/` (adapter-check demands that copy) with nothing installed beside it.
```

```text
 * Imports only `node:` builtins, `./user-guard-install.mjs` and `./agent-models-decide.mjs`, because a consumer runs it
 * from its verbatim copy in `.claude/hooks/lib/` with nothing installed beside it.
```

- **R5** `read.mjs:11` and `:13` become one line `import { lstatOrNull, readOrNull } from './user-guard-install.mjs';`,
  and the module adds `export { lstatOrNull };` (E2's swap module may import it from here, as the parent says). It no
  longer imports `./agent-models-swap.mjs`.
- **R6** `fixtures.mjs:12` (the install import) and `:115` (`ensure:`) go. The header (`:2-3`) names the E1 users
  (`agent-models-decide.test.mjs`, `agent-models-read.test.mjs`, `agent-models-pin.test.mjs`) and says: `E2 adds
  sandbox().ensure with the installer.`
- **R7** `decide.test.mjs:11` becomes `import * as mod from '../settings/hooks/lib/agent-models-decide.mjs';`; the
  header `:2-3` says `imported from it directly` instead of `imported through the installer's re-exports`.
- **R8** The source's `:527` list (which names `existingSettingsFile`, a name this repository does not have) is not
  retyped. The test derives the names from the modules' own import lines. The source's `:536` title "it runs from a
  consumer mount" becomes "a consumer runs it from its `.claude/hooks/lib/` copy".

**Scenarios.** Every case first runs RED for the reason named, then GREEN.

| # | Given / When | Then | RED before the change |
|---|---|---|---|
| 1.1 | the export-only edit; the check command of the brief, step 2 | `export-only, 12 lines`, exit 0 | — (a check of the edit, not a test) |
| 1.2 | `npm test` before and after the export-only edit | the same pass count, 0 new failures | — (no behaviour change: the observation IS the proof) |
| 1.3 | `node tools/adapter-check.mjs` after the edit, before the mirror copy / after it | names `.claude/hooks/lib/user-guard-install.mjs` as different / `OK` | the first half is the RED |
| 1.4 | `tools/agent-models-decide.test.mjs` | 28 pass | fails to load: `Cannot find module '…/settings/hooks/lib/agent-models-decide.mjs'` |
| 1.5 | read: `readSource(sandbox.source)` of the 1.2.3 fixture tree | `version` `[1, 2, 3]`; `[...files.keys()]` equals `FILES` in order; `files.get('hooks/hooks.json')` equals the file's bytes | fails to load: `Cannot find module '…/agent-models-read.mjs'` |
| 1.6 | read: `readSource(<root>/nowhere)` | `error` matches `/not a directory/` | as 1.5 |
| 1.7 | read: `readTarget(t_)` with no target / after `seedTarget({ version: '1.2.3' })` | `{ kind: 'missing', path }` / `kind: 'dir'`, `version [1, 2, 3]`, the seeded bytes, `manifest.version '1.2.3'` | as 1.5 |
| 1.8 | read: the target a symlink to a real tree (skip where symlinks are refused) / a regular file / a seeded tree with `{ uid: () => 999999 }` | `kind: 'symlink'` with the link text / `kind: 'other'` / `{ kind: 'foreign', path, uid: <real uid> }` | as 1.5 |
| 1.9 | imports: for every `settings/hooks/lib/agent-models-*.mjs` (listed from the folder, never typed), each name in its `import { … } from './user-guard-install.mjs'` | is an export of `user-guard-install.mjs` | with `export` removed from `normalise` (teeth, below): a finding naming `normalise` and `agent-models-decide.mjs` |
| 1.10 | imports: the layer order `decide`, `read`, `swap`, `install` | a module imports only siblings EARLIER in the order: decide none, read only decide | with R5 undone (`lstatOrNull` from `./agent-models-swap.mjs`): a finding naming `agent-models-read.mjs` and `agent-models-swap.mjs` |
| 1.11 | imports: every specifier of every module | `node:…`, `./user-guard-install.mjs` or `./agent-models-(decide\|read\|swap\|install).mjs`; no `process.env` in the text | — (ported; RED only by mutation) |
| 1.12 | imports: no module declares a `function`, or a `const` assigned a function, whose name is an export of `user-guard-install.mjs` that is a function (`typeof guard[name] === 'function'`; the string constants `OPTOUT_FILE` and `MANIFEST_FILE` share names on purpose and are not functions) | no finding | with R3 undone (`export const sha256 = …` back, `sha256` out of the import): a finding naming `sha256` and `agent-models-decide.mjs` (F2's second body) |
| 1.13 | imports, the companions: the folder scan finds `agent-models-decide.mjs` and `agent-models-read.mjs`; the import parser finds `isObject` in decide.mjs; the declaration scan, run over `user-guard-install.mjs` itself, finds `const lstatOrNull` | all three found | — (a scan that matches nothing passes forever; these keep it alive) |
| 1.14 | the pointer grep of the brief, step 5 | no line | lines before R1, R2, R4 |
| 1.15 | `cmp` of each `settings/hooks/lib/agent-models-*.mjs` with its `.claude/hooks/lib/` copy; `node tools/adapter-check.mjs` | equal; `OK` | before the copy: adapter-check names the missing `.claude/hooks/lib/agent-models-decide.mjs` |
| 1.16 | `npm test`, `npm run check` | green | — |

**Teeth (RED → GREEN → RED), one at a time, each restored:** remove `export` from `normalise` → 1.9 red (and decide.mjs
fails to load); undo R5 → 1.10 red; undo R3 → 1.12 red; in `decideCopy` change
`order < 0` to `order <= 0` → decide.test's upgrade and equal-copy cases red; in `readTarget` drop the uid check →
1.8's foreign case red.

**The brief.**

1. Check that the source port exists (F6). Run `npm ci --ignore-scripts` if `node_modules` is missing. Run `npm test`
   and write down the pass and fail counts.
2. **Commit A, export only.** In `settings/hooks/lib/user-guard-install.mjs`, put `export ` before each of the 12
   declarations of F1, at the lines F1 names. Change nothing else. Copy the file to `.claude/hooks/lib/`. Check:
   ```bash
   git diff -U0 -- settings/hooks/lib/user-guard-install.mjs | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=s.split("\n").filter(l=>/^[-+][^-+]/.test(l));const o=m.filter(l=>l[0]==="-").map(l=>l.slice(1));const n=m.filter(l=>l[0]==="+").map(l=>l.slice(1));const ok=o.length===12&&n.length===12&&n.every((l,i)=>l==="export "+o[i]);console.log(ok?"export-only, 12 lines":"NOT export-only");process.exitCode=ok?0:1})'
   ```
   Run `npm test` (1.2) and `node tools/adapter-check.mjs` (1.3). Commit the two files by path:
   `refactor(adapter): export the helpers the agent-models installer reuses — no behaviour change`, the counts of
   1.2 in the body.
3. **Tests first.** Port `tools/lib/agent-models-fixtures.mjs` (R6) and `tools/agent-models-decide.test.mjs` (R7).
   Write `tools/agent-models-read.test.mjs` (1.5-1.8; build every tree with `sandbox`, `seedTarget`, `writeTree` and
   `symlinkOrSkip` from the fixtures; temporary folders by `ownedDir` only) and `tools/agent-models-imports.test.mjs`
   (1.9-1.13; read the module texts with `fs.readFileSync`, find the modules with `fs.readdirSync` of
   `settings/hooks/lib` filtered by `/^agent-models-.*\.mjs$/`, find the exports of `user-guard-install.mjs` by
   `Object.keys(await import(...))`; match an import across lines). Name each test for its guarantee. Run
   `node --test tools/agent-models-decide.test.mjs tools/agent-models-read.test.mjs tools/agent-models-imports.test.mjs`
   and keep the RED messages.
4. **The port.** Copy `agent-models-decide.mjs` and `agent-models-read.mjs` from the source port and apply R1-R5,
   nothing else. Copy both to `.claude/hooks/lib/`.
5. Run the three files: GREEN. Do the teeth one at a time, run, restore. Run 1.14, 1.15, `npm test`, `npm run check`,
   `node tools/adapter-check.mjs`. The pointer grep of 1.14:
   ```bash
   grep -nE "\.claude/rules|plan §|consumer's mount" settings/hooks/lib/agent-models-*.mjs tools/lib/agent-models-*.mjs tools/agent-models-*.test.mjs
   ```
6. **Commit B** by path (the two modules, their two copies, the fixtures, the three test files):
   `feat(adapter): the agent-models installer's pure decisions and reads, ported — nothing runs at session start yet`,
   with the RED messages, the GREEN counts and the teeth results in the body.

**Done when** 1.1-1.16 hold, the teeth were seen red, commit A is export-only and green on its own, and
`agent-models-decide.mjs` and `agent-models-read.mjs` import nothing of E2.

---

## E1.S2 — Mod 1.3.3 byte for byte in `mods/agent-models/`

- **Size** S. **Model** scenarios and brief: Opus (here); code: Sonnet.
- **Goal.** This repository holds mod 1.3.3 exactly as released: the 7 shipped files, the 11 test files,
  `tsconfig.json` and `.gitignore`. `.gitattributes` makes every checkout hold the same bytes. The extractor test runs
  in the suite, the mod's own `.tsx` tests do not, and the mod passes `claude plugin validate` and `claude plugin test`.

**Files.**

| File | How |
|---|---|
| `mods/agent-models/.claude-plugin/plugin.json`, `hooks/hooks.json`, `hooks/register.tsx`, `hooks/prompts.ts`, `hooks/tasks.tsx`, `hooks/limits.tsx`, `types/index.d.ts` | created, verbatim |
| `mods/agent-models/tests/` — `account.test.tsx`, `band.test.tsx`, `limits-fixtures.tsx`, `limits-race.test.tsx`, `limits.test.tsx`, `tasks-fixtures.tsx`, `tasks-race.test.tsx`, `tasks-send.test.tsx`, `tasks.test.tsx`, `transcript-fixtures.tsx`, `viewer.test.tsx` | created, verbatim |
| `mods/agent-models/tsconfig.json`, `mods/agent-models/.gitignore` | created, verbatim |
| `.gitattributes` | changed: one line `mods/agent-models/** text eol=lf` |
| `tools/agent-models-extract.test.mjs` | created, verbatim (it has no pointer to rewrite) |

No file under `settings/hooks/**` changes, so no mirror copy.

**Scenarios.**

| # | Given / When | Then | RED before the change |
|---|---|---|---|
| 2.1 | `node --test tools/agent-models-extract.test.mjs` | 18 pass | fails to load: `ENOENT` on `mods/agent-models/hooks/prompts.ts` |
| 2.2 | `diff -r <source port>/k-mods/mods/agent-models mods/agent-models` | no output | — |
| 2.3 | the number of paths `git ls-files mods/agent-models` prints after staging | 20 | — |
| 2.4 | `sha256sum` of the 7 shipped files | `plugin.json` `5559766d…91e8`, `hooks.json` `d842d789…b828`, `register.tsx` `9735c090…7975`, `prompts.ts` `6d3234bc…f68c`, `tasks.tsx` `52541431…e4cb`, `limits.tsx` `52606232…ba2d`, `index.d.ts` `79c8bd52…873b` — the source's 1.3.3 row in full | — |
| 2.5 | `git check-attr text eol -- mods/agent-models/hooks/prompts.ts`; `git ls-files --eol mods/agent-models` | `text: set`, `eol: lf`; every line `i/lf w/lf attr/text eol=lf` | `text: unspecified` before the rule |
| 2.6 | **the rule has teeth**: a scratch clone of the branch made with `git clone -c core.autocrlf=true`, outside the repository | the 7 hashes equal 2.4. Then, in the clone only, a commit that deletes the rule line, the 7 files removed and checked out again: `prompts.ts` hashes differently (CRLF). The clone is removed after | — (this IS the RED: without the rule the bytes change) |
| 2.7 | the company scan of the brief, step 5, over `mods/agent-models`, `tools/agent-models-*`, `tools/lib/agent-models-*`, `settings/hooks/lib/agent-models-*` | no line from any of its four greps | — |
| 2.8 | the same scan on a scratch copy with `someone@corp.test` planted in one file | exactly one line | — (the companion: the scan can find something) |
| 2.9 | `npm test` before and after | the total rises by exactly 18 (extract's cases) and the failures do not rise: no `.tsx` file under `mods/` is collected, and `tools/source-bytes.test.mjs` stays green | — |
| 2.10 | `npm run check` | green: `mods/` holds no instruction file | — |
| 2.11 | by hand: `claude plugin validate mods/agent-models`; `claude plugin test mods/agent-models` | both pass; the output lines go in the commit body | — |

**Teeth:** put `${x}` into the `EXTRACT` template of `mods/agent-models/hooks/prompts.ts` → X1 red with "the template
must have no ${ substitution"; restore, and confirm 2.4's hash again.

**The brief.**

1. Check that the source port exists (F6). Record `npm test`'s total.
2. Add the line `mods/agent-models/** text eol=lf` to `.gitattributes` FIRST, so the files are added under it.
3. Copy the folder: `mkdir -p mods/agent-models && cp -r <source port>/k-mods/mods/agent-models/. mods/agent-models/`.
   Copy `tools/agent-models-extract.test.mjs` from `<source port>/k-repo/tools/`. Change no byte of either.
4. Run 2.1-2.5. Do 2.6 in a folder under the session scratchpad, never inside the repository, and remove it after.
5. The company scan (2.7). The names of the company come from the coder's launch prompt and are NEVER written into
   this repository, its commit messages or its pull request:
   ```bash
   F="mods/agent-models tools/agent-models-*.mjs tools/lib/agent-models-*.mjs settings/hooks/lib/agent-models-*.mjs"
   grep -rnEI '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' $F | grep -v '@example\.com'
   grep -rnEoI "https?://[^ \"'\`)]+" $F | grep -v 'https://api\.anthropic\.com/api/oauth/usage'
   grep -rnEoI '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' $F | grep -v ':1\.2\.3\.4$'
   grep -rniEI '<the names from the launch prompt, joined by |>' $F
   ```
   Then 2.8 on a scratch copy.
6. Run 2.9, 2.10, the teeth, and 2.11 by hand. If the `claude` CLI is not there, say so; E1 is not done until 2.11 ran.
7. Commit by path (`.gitattributes`, `mods/agent-models`, `tools/agent-models-extract.test.mjs`):
   `feat(mods): agent-models 1.3.3 byte for byte, eol=lf, and its extractor test`, with 2.4, 2.9 and 2.11 in the body.

**Done when** 2.1-2.11 hold and the teeth were seen red.

---

## E1.S3 — The released-copy check · `model: fable` · cornerstone

- **Size** M. **Model** scenarios and brief: **Fable** (written after this document is committed, so the cornerstone
  is in the parent's ledger first); code: Sonnet; review: Opus. Fable unavailable → Opus, said in the summary.
- **Goal.** From bytes alone, this repository can tell whether a mod folder is the released 1.3.3. `RELEASED_MOD` is the
  version and the RAW sha256 of each `MOD_FILES` entry, equal to the newest row of `tools/agent-models-pins.json`, and
  that row equals the files of `mods/agent-models` at HEAD — two tests, each watched RED. The check runs on the bytes
  that ONE read of the source already holds. A source that differs is refused, naming the first file that differs.
  The story also fixes the rule E2 must keep: the copy writes only the bytes that passed the check.

**Files.**

| File | How |
|---|---|
| `settings/hooks/lib/agent-models-decide.mjs` | changed: `RELEASED_MOD` and the pure check `releasedModRefusal` (new code; the source has neither) |
| `settings/hooks/lib/agent-models-read.mjs` | changed: `readSource` takes the `released` seam and runs the check on the bytes it holds. Nothing else: an extra file, a missing file and a link are read as the port reads them (decisions 6-8) |
| `.claude/hooks/lib/agent-models-decide.mjs`, `.claude/hooks/lib/agent-models-read.mjs` | the mirror copies, same commit |
| `tools/agent-models-pins.json` | created, verbatim (10 rows, `1.0.0` to `1.3.3`) |
| `tools/lib/agent-models-pin.mjs` | created, verbatim |
| `tools/lib/agent-models-fixtures.mjs` | changed (E1.S1's file): one new export, `fixtureReleased` |
| `tools/agent-models-pin.test.mjs` | created: the 8 source cases ported (3.1), plus 3.2-3.6 |
| `tools/agent-models-read.test.mjs` | changed (E1.S1's file): case 1.5 passes the fixture's identity (3.7); 3.8-3.20 added |

**Decisions** (Fable, 2026-11-11; one per question, same numbers). The design in one sentence: `readSource` is the only
function that makes a source value, and it returns bytes only after the pure check passed on those same bytes.

1. **Shape and home.** `RELEASED_MOD = { version: '1.3.3', sha256: { <MOD_FILES entry>: <64 hex>, … } }` in
   `agent-models-decide.mjs`, both objects frozen. The version is text: it is the key of a pin row and the `version` of
   an install record, and text needs no freeze. The keys of `sha256` are the seven `MOD_FILES` entries, in that order.
2. **The newest row** is the row with the highest version by `compareVersions`. It is not the last key of the file. A
   row added later for an older version changes nothing. A row for a newer version makes 3.3 red until `RELEASED_MOD`
   follows. A release therefore changes three things in one commit: the mod, its row and `RELEASED_MOD` with its copy.
3. **The files at HEAD** are the working tree the suite runs on. In CI that is the checkout of HEAD, and the `eol=lf`
   rule fixes its bytes. No test calls git, so a checkout of depth 1 is enough. A dirty tree makes 3.1 (`1l`) and 3.5
   red and names the changed file. That is the wanted answer: the developer sees it before the commit, not after.
4. **Where the check runs.** Inside `readSource`, as its last step, on the Map it is about to return. The check is the
   pure `releasedModRefusal` in `agent-models-decide.mjs`. A separate call in E2's `run()` is rejected: a caller can
   forget a call, but it cannot copy a value it never gets. An unreleased source is `{ error, unreleased: true }`,
   with no `files` and no `version`. A test passes its fixture's own identity as `{ released }`; production passes
   nothing and gets `RELEASED_MOD`. There is no "off" value (#158's `released = null` is not copied): an identity that
   is missing or malformed refuses.
5. **The refusal text** is `source <dir> is not the released mod <released version>: <detail>`. The detail names the
   first `MOD_FILES` entry, in order, whose digest differs: `<file> differs (sha256 <12 hex>, released <12 hex>)`. When
   that file is `plugin.json` and it holds another version, the detail is `.claude-plugin/plugin.json is version <v>,
   released <rv>` — the file and both versions, no digests. The text says what is wrong, not what to do. The
   advice (`git submodule update`) and the said-once rule are E2's, because E2 knows the layout; `unreleased: true`
   tells E2 which refusal it holds.
6. **An extra file** is ignored and never read. `readSource` reads the seven `MOD_FILES` paths and never lists the
   folder. 3.8 and 3.9 prove it, and 3.5 reads the real folder with its `tests/`, `tsconfig.json` and `.gitignore`.
7. **A missing file** stays the read error `source file <path> is missing`: one text, before the check, not marked
   `unreleased`. `RELEASED_MOD` names all seven files, so a source must hold all seven. An `INTRODUCED` exception for
   the source is rejected: no released source can reach that branch. `INTRODUCED` stays a fact about an installed
   target of an older release and about old pin rows. Limit, accepted: the read stops at the first file it cannot hold,
   so a tree that lacks one file AND has another version is named by its missing file.
8. **Links.** (a) A `MOD_FILES` entry that is a link is refused, `is not a regular file`, as in the port. The released
   tree holds regular files only, and the `lstat` keeps a pipe or a device from being read. (b) A linked folder on the
   way and (c) a linked source root are accepted, as in the port, now on purpose. The held bytes are checked, and that
   is the measure. A walk of every path part would be new code with a gap of its own, and it adds nothing to the hash.
9. **The gap between `lstat` and the read** stays open, and it does not matter. A file swapped for a link in that gap
   is read through the link; its bytes are then hashed like any others, and only released bytes pass. No `O_NOFOLLOW`:
   it guards one path part, and the hash makes it unnecessary. The code comment calls the `lstat` a courtesy, not a
   protection (`common/security.md`: a measure not observed working is a comment).
10. **Raw sha256, no fold.** The copy writes the held bytes as they are, so the digest must name exactly those bytes. A
    fold, as `guardDigest` does, would vouch for bytes that nobody reviewed. A CRLF tree is refused, and the text names
    `.claude-plugin/plugin.json`, the first file with a line end. An ordinary checkout cannot make such a tree: the
    rule and the files land in one commit (E1.S2), so "a checkout made before the rule" does not exist. An editor or a
    copy made outside git can still make one, and the refusal covers it. A BOM before `plugin.json` still parses to
    its version, and the digest refuses it.
11. **The rule for E2, made checkable**: see *What E2 must keep*. No copy and no freeze of the Buffers. A Buffer cannot
    be frozen (`Object.freeze` throws on one that holds bytes). The run is synchronous and holds the only reference.
    E2's test compares every installed file with the identity, so a write into a held Buffer shows there too.
12. **The source only.** `readTarget` and `decideCopy` take no identity. An installed copy is judged by its record
    (`manifestMatches`), as ported; Part A's 1.3.3 gives `none`. 3.20 keeps the two apart.
13. **The pin table.** Nothing more can be checked without history. The ported `I7` checks the shape; 3.3 ties the
    newest row to `RELEASED_MOD`; 3.5 ties the folder to both. So the three can only change together, and the change to
    `RELEASED_MOD` is a diff in the file that holds the trust boundary. "Rows only added" for the older rows stays a
    review matter: no code reads an older row at run time. `INTRODUCED` matters only for rows older than 1.3.0.
14. **RED order.** First the pin test cannot load (no `tools/lib/agent-models-pin.mjs`). Then, with the table ported,
    each new case fails on the missing export (`RELEASED_MOD`, `releasedModRefusal`) or on an unreleased tree read as
    good. Then the code, GREEN. Then a wrong digest (T1) — the digest RED the Done-when asks for. The production lines
    whose removal must turn a named test red are the teeth T3 (the check call), T7 (the hash comparison), T6 (the
    first-file order), T4 (raw bytes), T5 (one read) and T8 (the version).

**What E2 must keep** (this settles the row *The released check* of § *Boundary with E2*: E2's part is to pass
`released` through; it never calls the check itself).

- `run()` calls `readSource(source, { released })` once. The Map it returns is the only source of bytes for the stage
  and for the record. No line of `agent-models-swap.mjs` or `agent-models-install.mjs` reads a file under `source`.
- `ensureAgentModels` takes `released = RELEASED_MOD` and passes it on. `ensureAgentModelsMod` passes none.
  `sandbox().ensure` passes `fixtureReleased(version)`, so the ported cases keep their meaning.
- **The test that shows it** (E2 writes it): the `now` seam, which `run()` calls after the read, rewrites
  `hooks/prompts.ts` in the source on its first call. After the install, the sha256 of every installed `MOD_FILES`
  file equals the identity's digest. A copy that reads the source a second time installs the rewritten bytes and fails.
- On `unreleased: true`, E2 adds the advice and says the line once. The `error` text holds the version, or the file
  and its digests, so a new state gives a new line.
- The check never runs on the target.

**Scenarios.** Every case first runs RED for the reason named, then GREEN. "pin" is `tools/agent-models-pin.test.mjs`,
"read" is `tools/agent-models-read.test.mjs`. A fixture tree is `sandbox(t).source` (version 1.2.3) and its identity is
`fixtureReleased('1.2.3')`. A digest in an expected text is computed in the test from the bytes, never typed.

| # | Given / When | Then | RED before the change |
|---|---|---|---|
| 3.1 | pin: the 8 ported cases (`1k` four times, `--print` twice, `I7`, `1l`) | 8 pass; `1l` says the folder at HEAD equals its row | fails to load: `Cannot find module '…/tools/lib/agent-models-pin.mjs'` |
| 3.2 | pin: `newestVersion(pins)`, the test's own helper, over a table whose keys stand in the order `1.10.0`, `1.9.0`, `1.2.0` | `1.10.0`: by `compareVersions`, not by text, not the last key | — (the companion of 3.3: the helper can pick a row; T2 is its RED) |
| 3.3 | pin: `RELEASED_MOD` against the newest row of `PINS` | `RELEASED_MOD.version` equals `newestVersion(PINS)`; `{ ...RELEASED_MOD.sha256 }` deep-equals that row; `Object.keys(RELEASED_MOD.sha256)` equals `MOD_FILES` in order | `agent-models-decide.mjs exports RELEASED_MOD`: the export is `undefined` |
| 3.4 | pin: `RELEASED_MOD` is frozen at both levels | `Object.isFrozen` of both objects; an assignment to `RELEASED_MOD.sha256['hooks/hooks.json']` throws `TypeError` | as 3.3 |
| 3.5 | pin: the real road on the real folder — `readSource(LIVE)` with NO second argument; `LIVE` is `mods/agent-models`, which holds `tests/`, `tsconfig.json` and `.gitignore` | no `error`; `version` equals `parseVersion(RELEASED_MOD.version)`; the keys of `files` equal `MOD_FILES`; the sha256 of each held file equals `RELEASED_MOD.sha256[rel]` | as 3.3 |
| 3.6 | pin: the pure check. `releasedModRefusal({ version: [1, 2, 3], files })` with the fixture's Map and identity / the same with `hooks/tasks.tsx` set to `null` / with `released` `undefined` | `''` / `is not the released mod 1.2.3: hooks/tasks.tsx differs (sha256 none, released <12 hex>)` / `cannot be checked: there is no valid released identity` | `decide.releasedModRefusal is not a function` |
| 3.7 | read: the positive (case 1.5, changed). The fixture tree read with its own identity | 1.5's result; `Object.keys(result)` is `['version', 'files']` | — (green before the change too; it is the positive that keeps the fixture identity honest: 3.14 is the same tree with another identity) |
| 3.8 | read: one read. `t.mock.method(fs, 'readFileSync')` and `t.mock.method(fs, 'readdirSync')` around `readSource` of the fixture tree | the `readFileSync` calls under the source are the seven `MOD_FILES` paths, in order, once each; `files.get(rel)` IS the Buffer that call returned (`assert.strictEqual`); `readdirSync` was not called | — (green before; T5 is its RED. The count of seven is its own companion: a spy that sees nothing fails it) |
| 3.9 | read: extra files in the fixture tree — `tests/a.test.tsx`, `tsconfig.json`, `.gitignore`, `README.md`, `.claude-plugin/types/x.d.ts` | no `error`; the keys of `files` equal `MOD_FILES` | — (green before; it states decision 6) |
| 3.10 | read: the default identity is the real one. `readSource` of the fixture tree with NO second argument | `{ error: 'source <dir> is not the released mod <R>: .claude-plugin/plugin.json is version 1.2.3, released <R>', unreleased: true }` where `<R>` is `RELEASED_MOD.version`; the result has exactly these two keys — no bytes | `error` is `undefined`: an unreleased tree was read as good |
| 3.11 | read: one byte appended to `hooks/prompts.ts` | `source <dir> is not the released mod 1.2.3: hooks/prompts.ts differs (sha256 <12 hex of the file>, released <12 hex of the identity>)`, `unreleased: true` | as 3.10 |
| 3.12 | read: two files differ, `types/index.d.ts` and `hooks/register.tsx` | the text names `hooks/register.tsx`, the earlier one in `MOD_FILES` | as 3.10 |
| 3.13 | read: the version. `plugin.json` of 1.2.4 in the tree / `plugin.json` of 1.2.3 with a `description` key added | `…: .claude-plugin/plugin.json is version 1.2.4, released 1.2.3` / `…: .claude-plugin/plugin.json differs (sha256 …, released …)` | as 3.10 |
| 3.14 | read: an identity whose seven digests match the tree and whose `version` says `1.2.4` | `source <dir> is not the released mod 1.2.4: .claude-plugin/plugin.json is version 1.2.3, released 1.2.4` | as 3.10 |
| 3.15 | read: CRLF. Every file rewritten with `\n` → `\r\n` (built in the test) / only `hooks/prompts.ts` | refused, naming `.claude-plugin/plugin.json` with digests / refused, naming `hooks/prompts.ts` | as 3.10 |
| 3.16 | read: the bytes `EF BB BF` (built in the test) before `plugin.json` | refused: `.claude-plugin/plugin.json differs (…)` — the version still parsed, the digest did not match | as 3.10 |
| 3.17 | read: `hooks/limits.tsx` removed from the fixture tree (version 1.2.3, older than the file's `INTRODUCED` 1.3.0) | `{ error: 'source file <path> is missing' }`, and no `unreleased` key | — (green before; it states decision 7: `INTRODUCED` excuses no source file) |
| 3.18 | read: links, each skipped where symlinks are refused. (a) `types/index.d.ts` a link to a file with the same bytes. (b) `hooks` a link to a folder with the same bytes; then one byte appended to `tasks.tsx` in that folder. (c) the source root a link to the tree | (a) `source file <path> is not a regular file`. (b) read, with the same bytes; then refused, naming `hooks/tasks.tsx`. (c) read | (a), the first half of (b) and (c) are green before; the second half of (b) as 3.10 |
| 3.19 | read: an identity that is not valid — `released: null` / one digest deleted / one digest of 63 hex digits | each `{ error: 'source <dir> cannot be checked: there is no valid released identity', unreleased: true }` | as 3.10 |
| 3.20 | read: the target is never checked. `readTarget(t_)` after `seedTarget({ version: '1.2.3' })`, bytes that `RELEASED_MOD` does not name | `kind: 'dir'` with the seeded bytes, as 1.7 | — (green before; red if the check is ever put on the target) |
| 3.21 | `cmp` of the two changed modules with their `.claude/hooks/lib/` copies; `node tools/adapter-check.mjs` | equal; `OK` | before the copy: adapter-check names `.claude/hooks/lib/agent-models-decide.mjs` as different |
| 3.22 | `node --test tools/agent-models-decide.test.mjs tools/agent-models-imports.test.mjs`; `npm test`; `npm run check` | E1.S1's cases still pass (28 in decide); the total rises by the new cases, the failures do not rise; green | — |

**Teeth (RED → GREEN → RED), one at a time, each restored by the reverse edit** (the files are not committed yet, so
never by `git checkout`):

- **T1, a wrong digest.** Set the last digest of `RELEASED_MOD` (`types/index.d.ts`) to 64 zeros → 3.3 red with a diff
  at that key; 3.5 red with `types/index.d.ts differs (sha256 79c8bd52d8a2, released 000000000000)`.
- **T2, an older row.** Give `RELEASED_MOD` the version and the digests of row `1.3.2` → 3.3 red; 3.5 red with
  `.claude-plugin/plugin.json is version 1.3.3, released 1.3.2`. And in the test helper, take `.at(0)` → 3.2 red.
- **T3, the check call removed.** `readSourceFiles` returns `held` without calling `releasedModRefusal` → 3.10 to
  3.16, the second half of 3.18 (b) and 3.19 red; 3.7 stays green.
- **T4, CRLF folded.** In `releasedModRefusal`, hash
  `Buffer.from(held.toString('latin1').replaceAll('\r\n', '\n'), 'latin1')` → 3.15 red, and nothing else.
- **T5, a file read twice.** After the check, return a Map built by a second `fs.readFileSync` of each file → 3.8 red
  (14 calls, other Buffer objects).
- **T6, the order.** Loop over `[...MOD_FILES].reverse()` → 3.12 red: it names `types/index.d.ts`.
- **T7, the version alone.** In the loop, first line `if (rel !== PLUGIN_JSON) continue;` → 3.11 and 3.12 red.
- **T8, the last comparison removed.** End the function with `return '';` → 3.14 red.
- **T9, the identity guard removed.** → 3.19 red, and the third case of 3.6.

**The brief.**

1. Check that the source port exists (F6) and that E1.S1 and E1.S2 are committed on the branch
   (`settings/hooks/lib/agent-models-decide.mjs` and `mods/agent-models/` exist). Run `npm test` and write down the
   pass and fail counts.
2. **Tests first.**
   - `tools/lib/agent-models-fixtures.mjs`: add, after `fixtureBytes`:
     ```js
     /** The released identity of a fixture tree: what a test tells `readSource` to accept. Built from bytes, never typed. */
     export const fixtureReleased = (version, overrides = {}) => ({
       version,
       sha256: Object.fromEntries(FILES.map(rel => [rel, sha(overrides[rel] ?? fixtureBytes(rel, version))])),
     });
     ```
   - `tools/agent-models-pin.test.mjs`: copy it from `<source port>/k-repo/tools/`. Change no ported case. Add the
     imports of `readSource` (`../settings/hooks/lib/agent-models-read.mjs`) and `fixtureReleased`, the helper below
     and the cases 3.2-3.6. Read every new name through the existing `import * as decide`, and start 3.3 with
     `assert.ok(decide.RELEASED_MOD, 'agent-models-decide.mjs exports RELEASED_MOD')`: a missing export is then a
     failing test, not a file that cannot load.
     ```js
     /** The newest version of a pin table: the highest by `compareVersions`, never the last key. */
     const newestVersion = pins => Object.keys(pins).map(decide.parseVersion).sort(decide.compareVersions).at(-1).join('.');
     ```
   - `tools/agent-models-read.test.mjs`: give case 1.5 the second argument `{ released: fixtureReleased('1.2.3') }`
     and the key assertion of 3.7; add 3.8-3.20. In 3.8 import `fs` as the default export (`import fs from 'node:fs'`),
     the same object the modules call, and count only the calls whose first argument starts with the source path.
     Build CRLF and BOM bytes at run time (`replaceAll('\n', '\r\n')`, `Buffer.from([0xef, 0xbb, 0xbf])`): the test
     file itself holds no CR byte (`tools/source-bytes.test.mjs`). Use `sandbox`, `seedTarget`, `symlinkOrSkip` and
     `ownedDir` only. Name each test for its guarantee.
   - Run `node --test tools/agent-models-pin.test.mjs tools/agent-models-read.test.mjs` and keep the first RED
     message (3.1's).
3. **The table.** Copy `tools/agent-models-pins.json` and `tools/lib/agent-models-pin.mjs` from the source port and
   check each with `cmp`. Run the two files again: 3.1 is green; keep the RED messages of 3.3-3.6, 3.10-3.16, 3.18 (b)
   and 3.19. A case marked "green before" that is red, or a red with another message, is a stop: report it.
4. **The code.** In `settings/hooks/lib/agent-models-decide.mjs`, after `INTRODUCED`:
   ```js
   /**
    * The released mod: its version and the RAW sha256 of each `MOD_FILES` entry, from the SAME release as this file. A
    * consumer carries this file in `.claude/hooks/lib/` and the mod in its pinned submodule, both from one release, so
    * the pair matches. A folder that holds other bytes is not copied into ~/.claude, where it would run in every
    * session on the machine. A test fails when this differs from the newest row of `tools/agent-models-pins.json`, and
    * another when that row differs from `mods/agent-models`. Raw, never folded: the copy writes the held bytes as they
    * are, so the digest names exactly what is written (`.gitattributes` keeps the folder LF). This keeps an unreviewed
    * mod inside its repository; it is no sandbox: a repository with hostile hooks already runs code in its sessions.
    */
   export const RELEASED_MOD = Object.freeze({
     version: '1.3.3',
     sha256: Object.freeze({
       // seven lines `'<file>': '<sha256>',` in MOD_FILES order, from `node tools/lib/agent-models-pin.mjs --print`
     }),
   });
   ```
   Take the seven lines from the command's output (single quotes here); do not type a digest. After `versionText`:
   ```js
   const SHA256_HEX = /^[0-9a-f]{64}$/;
   const isReleasedIdentity = released => isObject(released) && parseVersion(released.version) !== null
     && isObject(released.sha256) && MOD_FILES.every(rel => SHA256_HEX.test(released.sha256[rel]));

   /**
    * Why a source read (`{ version, files }`) is not the released mod; '' when it is. Pure. It names the first
    * `MOD_FILES` entry whose raw sha256 differs; for plugin.json with another version it names the versions.
    * `released` has no default here: a missing or malformed identity refuses, it never passes.
    */
   export function releasedModRefusal(src, released) {
     if (!isReleasedIdentity(released)) return 'cannot be checked: there is no valid released identity';
     const not = `is not the released mod ${released.version}: `;
     const version = versionText(src.version);
     const otherVersion = `${PLUGIN_JSON} is version ${version}, released ${released.version}`;
     for (const rel of MOD_FILES) {
       const held = src.files.get(rel);
       const digest = Buffer.isBuffer(held) ? sha256(held) : 'none';
       if (digest === released.sha256[rel]) continue;
       if (rel === PLUGIN_JSON && version !== released.version) return not + otherVersion;
       return `${not}${rel} differs (sha256 ${digest.slice(0, 12)}, released ${released.sha256[rel].slice(0, 12)})`;
     }
     return version === released.version ? '' : not + otherVersion;
   }
   ```
   In `settings/hooks/lib/agent-models-read.mjs`: add `RELEASED_MOD` and `releasedModRefusal` to the import from
   `./agent-models-decide.mjs`. `readSourceFiles(source, released)` keeps its loop and ends:
   ```js
     const held = { version, files };
     // The release check runs on THESE buffers, the only ones returned: one read per file, so nothing can change a file
     // between the check and the copy. The lstat in readRegular is a courtesy for an honest mistake, not a protection:
     // a file swapped in after it is read through, and its bytes are then checked like any others.
     const refusal = releasedModRefusal(held, released);
     return refusal ? { error: `source ${source} ${refusal}`, unreleased: true } : held;
   ```
   `readSource` passes `released` to `readSourceFiles`, and its comment and signature become:
   ```js
   /**
    * Reads the source folder ONCE and returns its bytes only when they are the released mod. Never throws, whatever
    * `source` is. `released` is a test seam (a fixture tree's own identity); production passes nothing.
    */
   export function readSource(source, { released = RELEASED_MOD } = {}) {
   ```
   Change nothing else in either module: `readRegular`, `readTarget` and `decideCopy` stay as ported.
5. Run the two files: GREEN. Do the teeth T1-T9 one at a time; run, write down the red test and its message, undo the
   edit. Then copy both modules to `.claude/hooks/lib/` and check 3.21:
   ```bash
   cp settings/hooks/lib/agent-models-decide.mjs settings/hooks/lib/agent-models-read.mjs .claude/hooks/lib/
   cmp settings/hooks/lib/agent-models-decide.mjs .claude/hooks/lib/agent-models-decide.mjs
   cmp settings/hooks/lib/agent-models-read.mjs .claude/hooks/lib/agent-models-read.mjs
   node tools/adapter-check.mjs
   ```
6. Run the whole set, and the company scan of E1.S2's brief, step 5, over E1's files:
   ```bash
   node --test tools/agent-models-pin.test.mjs tools/agent-models-read.test.mjs
   node --test tools/agent-models-decide.test.mjs tools/agent-models-imports.test.mjs
   npm test
   npm run check
   node tools/adapter-check.mjs
   node tools/plan-lifecycle.mjs
   ```
7. Commit by path (the two modules, their two copies, the table, `tools/lib/agent-models-pin.mjs`, the fixtures, the
   two test files): `feat(adapter): the released-copy check of the agent-models mod — one read, refused naming the
   first file`, with the RED messages of steps 2 and 3, the GREEN counts, each tooth with the test it turned red, and
   the `npm test` counts before and after in the body. Do not write to `ensure-user-guard.mjs`, to the user's home, or
   to any file this story does not list.

**Done when** 3.1-3.22 hold and T1-T9 were each seen red and restored: `RELEASED_MOD` was watched RED (the missing
export, then T1) and equals the newest row; that row equals the files at HEAD; a source differing in one file or in
the version is refused naming the first file; a refused read carries no bytes; `npm test`, `npm run check` and
`node tools/adapter-check.mjs` are green; and the company scan of E1.S2 run again over E1's files finds nothing.
