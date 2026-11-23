# PLAN — dew_flow_mods, E3: the registration step replaces the installer

> Status: **plan only, nothing implemented yet, 2026-11-23.** Scope: in this repository the session-start step that
> registers the `dew-flow-mods` marketplace in `~/.claude/settings.json` and retires the old copy in `~/.claude/mods`
> (story 3.1, the cornerstone spec, `model: fable`), the removal of the mod and its installer (3.2) and the docs (3.3).
> Stories of epic E3 of [PLAN_dew_flow_mods.md](PLAN_dew_flow_mods.md) (§ A, § D, the Test plan rows R1–A4). No change
> ledger here: a change to E3's approved work is an entry in the parent's `## Plan changes`. The parent's ledger line
> already counts 3.1 (`todo/PLAN_dew_flow_mods.md:458`). No promotion and no consumer bump in this epic (E4).

Done when (the parent's E3, `todo/PLAN_dew_flow_mods.md:450-453`): R1–A4 and the rows added below green, each seen red first; one PR
merged, not promoted. Depends on: E1 ([the probe](../research/dew_flow_mods_probe_E1.md) § *Decision*), E2 ([stories](PLAN_dew_flow_mods_E2.md)).

## Facts this document rests on (read 2026-11-23 at `ceda8b5`)

- **The old step.** `ensureAgentModelsMod` (`settings/hooks/ensure-user-guard.mjs:193-202`) is the third step of `main`
  (`:240`), inside `guardStep` (`:248-255`), which shows a line only for an action in `SPEAKING` (`:229`). Skips:
  `AGENT_MODELS_MOD=off` (`:168`), win32, the reference repository (`:59-62`, `:194`), a file at
  `~/.claude/mods/agent-models.optout` or no mod folder (`:199`). Its libs load by a dynamic `import()`, so a load
  failure costs only this step (`:175-181`). The hook has 5 s (`settings/settings.json:25`); in `ensure-user-guard.mjs`
  stdin may take 2 s (`:50`) and the guard's `git status` 2 s more (`:98-99`). The released step (`c598a11`, every consumer's pin) tests the marker
  with `fs.existsSync` only (`:199` there): any file, whatever it holds, stops it.
- **Old names on disk** (`settings/hooks/lib/agent-models-decide.mjs:59-64`, `:73-83`): the folder `~/.claude/mods/agent-models`,
  `agent-models.installed.json` (`version`, `sha256` per file: `agent-models-swap.mjs:171-179`), `agent-models.reported.json`
  (`agent-models-swap.mjs:357-373`), the entry in `env.CLAUDE_CODE_PLUGIN_DIRS` (`agent-models-decide.mjs:15`, `:258-271`; `~/` matches, `:226`).
- **The one settings road.** `commitSettings` (`settings/hooks/lib/user-guard-install.mjs:494-501`): `beforeWrite`, a
  re-read of the bytes and of the resolved file, `prepare`, then `writeAtomic` at the real file with its own mode
  (`:468-470`, `:175-187`); `replace: false` creates a file only while its name is free (`:196-204`). Also exported:
  `settingsFileOf` (`:514-521`), `backupOnce` (`:605-610`), `parseSettings` (`:214-222`), `writableReason` (`:451-458`),
  `lstatOrNull` (`:590-597`), `normalise` (`:73`), `isObject` (`:80`), `serialise` (`:239`), `sha256` (`:26`).
- **Said once today**: one key in the reported file, and a start that ends clean deletes the file
  (`agent-models-install.mjs:121-125`, `:147-150`, `:230`). An old-pin session therefore erases whatever that file holds.
- **A vouched folder is replaced whole today**: `manifestMatches` reads only the files the record names
  (`agent-models-decide.mjs:156-165`); the swap then deletes the old folder with everything in it (`agent-models-swap.mjs:314`).
- **The engine** (the probe, `research/dew_flow_mods_probe_E1.md`, Claude Code 2.1.330). `installed_plugins.json` is
  `{"version":2,"plugins":{"agent-models@dew-flow-mods":[{"scope":"user","installPath":"…/cache/dew-flow-mods/agent-models/<version>",
  "version":…}]}}`; `gitCommitSha` may be absent (`:105-106`, `:201-205`); a record can exist with no folder (`:66-69`)
  and is written one start after the install (`:119-120`). `known_marketplaces.json` holds `{"dew-flow-mods":{"source":
  {"source":"git","url":…,"ref":"release"},…}}` (`:65`; the probe's scratch files, read again today). `agent-models@inline:
  false` frees the marketplace copy for every new start (`:157`, `:163-166`). Keys a hook writes are seen by the NEXT
  start (`:134-137`). A `-p` run never installs (`:231-233`).
- **This machine today** (read only): the old folder is 1.4.0 with a record of seven files and also holds `tsconfig.json`
  and `.claude-plugin/types/**`, which the record does not name; `env.CLAUDE_CODE_PLUGIN_DIRS` names the folder. Under the
  parent's step 2 (feature review, 2026-11-23) such a folder is `left`: the engine's own files are not trusted by name or path.

## Story 3.1 — the step and the retirement (cornerstone, `model: fable`)

| File | Change |
|---|---|
| `settings/hooks/lib/mods-marketplace.mjs` + its byte copy `.claude/hooks/lib/mods-marketplace.mjs` | NEW, one file. Imports only `node:crypto`, `node:fs`, `node:path`, `node:process` and `./user-guard-install.mjs`. No sibling lib, no child process, no network, no timer |
| `settings/hooks/ensure-user-guard.mjs` + its `.claude/hooks` copy | `:168-202` replaced by `ensureModsMarketplaceStep`; `:240` calls it third; `:229` gains `retired`, `removed`, `updated`, `told`; the header `:31-37` rewritten |
| `tools/mods-marketplace.test.mjs`, `tools/mods-marketplace-step.test.mjs`, `tools/lib/mods-marketplace-fixtures.mjs` | NEW. `snapshot`, `direntFolder`, `symlinkOrSkip` move here from `tools/lib/agent-models-fixtures.mjs:65-77`, `:135-143` (the old lib imports them until 3.2) |
| `tools/fixtures/retired-installer/` | NEW, frozen: `hooks/ensure-user-guard.mjs` and `hooks/lib/{user-guard-install,agent-models-decide,agent-models-read,agent-models-swap,agent-models-install}.mjs` as `git show c598a11:settings/hooks/…` (six files, 104 KB, as the parent says); `README.md` (the commit; "never wired, never copied to a consumer"). No `*.test.mjs` inside |
| `tools/agent-models-step.test.mjs` | deleted in this story (it imports the removed export, `:21`); its cases 3.3, 3.5–3.9 are R7, W2, W3 below |

The four `agent-models-*.mjs` libs and their other tests stay until 3.2; after 3.1 nothing imports them from the hook.

### The step in `ensure-user-guard.mjs`

```js
export async function ensureModsMarketplaceStep({ home, source, env, sessionSource, platform = process.platform }) {
  if (modSwitchedOff(env) || platform === 'win32' || isReferenceRepository(source)) return skipped();
  const { lib, failure } = await loadModsMarketplace();   // dynamic import('./lib/mods-marketplace.mjs'); the failure is returned, never swallowed
  if (lib === undefined) return refusal(failure);          // 'agent-models: the dew-flow-mods step could not run (<code>)', repeated at each start; the guard and effort steps still run
  try { return lib.ensureModsMarketplace({ home, env, sessionSource }); } catch (error) { return refusal(error); }   // a throw inside: the same refusal line
}
```

`SUBAGENT_MODEL_GUARD=off` does not skip it (as today, `:34`). The skip "no mod folder" is gone: the step reads nothing
from the project. The person's opt-out marker is judged inside the lib, which alone can tell it from our tombstone.

### The lib: names and paths

```js
export const MARKETPLACE = 'dew-flow-mods', PLUGIN_ID = 'agent-models@dew-flow-mods', INLINE_ID = 'agent-models@inline';
export const ANCHOR = Object.freeze({ source: 'git', url: 'https://github.com/oleksandrdubyna88/dew_flow_mods.git', ref: 'release' });
export const STEP2_DELAY_MS = 24 * 3600 * 1000, INSTALL_WAIT_MS = 72 * 3600 * 1000, MAX_RECORD_BYTES = 1 << 20, MAX_FOLDER_ENTRIES = 500;
export function paths(home, env)        // every path the lib may name; nothing else is read, written or deleted
export function decideRegistration(parsed)                       // pure, over parseSettings(bytes)
export function readMarker(p)           // 'absent' | 'ours' | 'person'
export function readProof(p, settings)  // { whole: true, version } | { whole: false, say?: reason }
export function readOldFolder(p, uid)   // { kind: 'missing' | 'removable' | 'left', reason? }
export function decideRetirement({ marker, registration, inline, proof })                  // pure
export function decideRemoval({ retirement, retiredAt, now, listed, folder, leftovers })   // pure
export function tombstoneBytes(now)     // the one builder of the tombstone
export const LINES                      // every line the step can say, as functions; tests read them, never retype
export function ensureModsMarketplace({ home, env, now = () => new Date(), uid = () => process.getuid?.(),
  beforeWrite = () => {}, remove = p => fs.rmSync(p, { recursive: true, force: false }), stopAfter }) // never throws
```

`paths`: `claude = <home>/.claude`; `settings`; `mods = claude/mods`; `oldFolder = mods/agent-models`; `oldManifest`,
`oldReported`, `optout` (the names in Facts); `state = mods/dew-flow-mods.seen.json`; `plugins =
env.CLAUDE_CODE_PLUGIN_CACHE_DIR` when it is a non-empty string, else `claude/plugins`; `installed =
plugins/installed_plugins.json`; `known = plugins/known_marketplaces.json`; `cacheRoot = plugins/cache/dew-flow-mods/agent-models`.
`stopAfter` is a test seam (`'tombstone' | 'inline' | 'variable' | 'rename' | 'folder'`): the function returns `none`
right after that sub-step and writes nothing more — the disk state of a process killed there.

### Registration — what is written, and only when absent

One builder, `anchorEntry()`, returns `{ source: { ...ANCHOR }, autoUpdate: true }`. An entry **equals the anchor** when
it is an object whose `source` is an object with exactly the keys `source`, `url`, `ref` and those three values (a
`path` key or any other key is "differs"). `decideRegistration`, the first match wins:

| Settings | Action | Written |
|---|---|---|
| unparsable; not an object; `env`, `extraKnownMarketplaces` or `enabledPlugins` present and not an object | `refuse` | nothing, at any sub-step |
| `enabledPlugins[PLUGIN_ID]` present and not `true` | `off` — the person's switch | nothing; silent; no retirement |
| `extraKnownMarketplaces[MARKETPLACE]` present and not equal to the anchor | `conflict` | nothing; named once; no retirement |
| the marketplace entry and/or the plugin key absent (the file may be absent) | `write` | only the absent key(s): `anchorEntry()`, `true` |
| both present: the anchor, `true` | `none` (`autoUpdateOff` when `autoUpdate` is not `true`) | nothing |

`write` works on a `structuredClone`; a key that exists keeps its place and its other members, a new top-level key is
appended last. Every settings write of the step is `commitSettings({ …, data: serialise(next), beforeWrite, prepare,
replace: false })` as `agent-models-install.mjs:63-104` does it: `readOrNull`, `settingsFileOf` (a refusal or a dangling
link refuses), `writableReason` on the file and its folder, `backupOnce` in `prepare` only for a file that existed.
`{ written: false, now }`: decide again on `now`; `none` is silent, anything else refuses ("changed while registering",
the next start tries again). **At most one settings write per start**: the first of registration, step 1, step 2 that applies.

### The proof (all of it, or no retirement)

1. `decideRegistration` is `none` (the settings entry equals the anchor and the plugin is `true`).
2. `known` is a regular file under `MAX_RECORD_BYTES`, parses to an object, and its `MARKETPLACE` entry equals the anchor.
3. `installed` is the same kind of file, `version === 2`, `plugins` an object, `plugins[PLUGIN_ID]` an array with exactly
   one member of `scope: 'user'`, whose `installPath` and `version` are strings. `gitCommitSha` is never read.
4. `installPath` is absolute, lies inside `cacheRoot` (`path.relative`, no `..`), and `lstat` says a real directory.
5. `<installPath>/.claude-plugin/plugin.json` is a regular file that parses to `name: 'agent-models'` and the recorded
   `version`; and `<installPath>/.orphaned_at` does not exist.

Silent "not yet": no `installed` file, no record for the id, no `known` entry, no folder at `installPath` (the ghost
record), no `plugin.json`. Said once (`say`): a record file that is too big, does not parse or has another shape; a
`known` entry with another URL or ref; another name or version; an orphaned folder. Both files are read, never written.

### The retirement state machine (the state is read from disk at every start)

| State (read) | What the start does | Next |
|---|---|---|
| **S0** not registered, marker absent or ours | registration `write` | S1 |
| **S1** registered, proof not whole | nothing is touched. `registeredAt` is stored at first sight; after `INSTALL_WAIT_MS` the manual command is said once | S2 when the engine installed |
| **S2** proof whole, `INLINE_ID` absent | **step 1**: marker absent → `writeAtomic(optout, tombstoneBytes(now()), 0o644, { replace: false })`, then `readMarker` must say `ours` (else stop: a person's marker appeared); then the settings write that adds `enabledPlugins[INLINE_ID] = false`; then `retiredAt` is stored | S3 |
| **S3** marker ours, `INLINE_ID` false, proof whole, `now − retiredAt < STEP2_DELAY_MS` | nothing (`retiredAt` absent, unreadable or in the future: set to `now`; it can only delay) | S4 at a later start |
| **S4** as S3, 24 h or more | **step 2**: judge the folder (`readOldFolder`). `removable` or `missing`: the settings write that takes our entry out of `env.CLAUDE_CODE_PLUGIN_DIRS` (other entries verbatim and in order; the key goes when the value is empty; `env` stays), then the aside is recorded in the state file (`aside: { name: "agent-models.retired-<ms>-<pid>", sha256: <the install record's map> }`, written before the rename), `rename(oldFolder, mods/<name>)`, `remove` it after judging it again, then delete `oldManifest` and `oldReported`. `left`: folder, entry and record stay, named once, with how to remove the folder by hand | S5 |
| **S5** nothing of the old copy left | the version line when the installed version changed; the shell warning (M9) | — |

- **Stops, at any state, writing nothing at all** (not even the state file): the switch, win32, the reference
  repository; a marker that is not ours. `readMarker` says `ours` only for a regular file by `lstat`, at most 4 KB,
  that parses to an object with `tombstone: 'dew-flow-mods'`; an empty file, a folder, a link, other JSON are the person's.
- **Stops that keep the old copy as it is, named once:** `refuse`, `conflict`; `INLINE_ID` present and not `false` (the
  person runs the folder copy), also after step 1; a proof with `say`. `off` is the same and silent.
- **Step 1 runs on a machine with no old folder too:** the tombstone stops an old-pin worktree from installing 1.4.0
  later, and `false` stops such a copy from hiding the marketplace copy. **The tombstone** is `{ "tombstone":
  "dew-flow-mods", "at": "<ISO>", "note": "<who wrote it and why>" }`. A filesystem that cannot make the hard link
  (`isHardLinkFailure`, `user-guard-install.mjs:207`), or a `mods` that is a link or not a folder: no tombstone, no
  retirement, said (when nothing can record it, the line stands at every start, as `agent-models-install.mjs:147-150`).
- **`removable`** (step 2): the folder's files EQUAL its install record, exactly (the parent: "the folder, its manifest and
  its reported file are deleted, when the folder's files equal its install record"). `oldFolder` is a real directory by
  `lstat`, owned by `uid()`; `oldManifest` parses to an object whose `sha256` is an object with at least one key; every key
  is a relative path with no `..` part and names a regular file with that sha256; the walk finds only files and folders and at
  most `MAX_FOLDER_ENTRIES`; and every entry is accounted for as a named file or as a folder that holds one. NO other entry is
  trusted, whatever its name or place: not `tsconfig.json`, not `.claude-plugin/types/**` (the first round of 3.1 trusted them
  by path; the feature review, 2026-11-23, took that out: it went further than the parent). Everything else is `left` with its
  reason: a link, another owner, not a folder, no record, a named file missing or changed, a link inside, too many entries, a
  file the installer did not write (the first one named), a `CLAUDE_CODE_PLUGIN_DIRS` that is not a string. The `left` line
  tells the person to remove the folder by hand once they have checked it. A `left` folder keeps its entry in
  `CLAUDE_CODE_PLUGIN_DIRS` and its record: the parent's "left with its entry". After the person removes the folder, the next
  start deletes the entry and the record.
- **Sweeps (the in-flight states).** The step deletes ONLY the aside it recorded. Before the rename, `aside` (the name and the
  install record's `sha256` map, kept in `dew-flow-mods.seen.json`; the hashes are kept there because the record file is
  deleted by this very step, and a kill must not leave an aside nothing can judge) is stored. A start finds the recorded
  aside: absent (the delete was done, or the rename never happened) clears the record; a real directory of our uid, not a
  link, whose files are still among the recorded ones (a file may be gone from a delete cut short; none may be added or
  changed) is deleted, and the record cleared; anything else is NOT deleted, named once with the first unknown path, and the
  record stays (the person removes it by hand). A recorded name that is not of the shape `agent-models.retired-<ms>-<pid>`
  reads as absent. Any other `agent-models.retired-*` real directory of our uid (an aside of an older build, or the person's
  own) is never deleted, and is named once. `oldManifest` and `oldReported` with no `oldFolder` are still deleted.

### What the person is told (`LINES`; each state said once, never twice)

| Action | When | Line (the sense; the exact text is the constant) |
|---|---|---|
| `registered` | after the registration write | `agent-models: marketplace dew-flow-mods registered in ~/.claude/settings.json — Claude Code installs the mod at the next interactive start; a copy in ~/.claude/mods keeps working until then` |
| `retired` | after step 1's settings write | `agent-models <version> is installed from dew-flow-mods; the old copy in ~/.claude/mods/agent-models is switched off and is removed after 24 hours — the new copy loads from the next session` (no old folder: without the middle part) |
| `removed` | step 2 removed something | `agent-models: the old copy ~/.claude/mods/agent-models and its CLAUDE_CODE_PLUGIN_DIRS entry were removed` |
| `updated` | the proof's version differs from the stored one | `agent-models updated 1.6.0 → 1.6.1 (dew_flow_mods release)` (parent `:213-214`); first sight stores it in silence |
| `told` | `conflict`; `autoUpdateOff`; `INLINE_ID` true; a proof `say`; `left`; the wait of three days (`run: claude plugin install agent-models@dew-flow-mods`); the shell's own variable still lists the folder at a start that began in S5 | one line each, naming the file, the reason and what stays; each ends `(said once)` |
| `refused` | a settings refusal; the tombstone could not be written | `agent-models: marketplace NOT registered: <reason>` / `… old copy NOT retired: <reason>` |

Several lines of one start are joined with `\n`; the action is the first in the table's order. **Said once** keeps the
contract of the reported file (once per state entered; a state left and entered again is said again), but the store is
the `said` map of the state file, not `agent-models.reported.json`: an old-pin session deletes that file at every clean
start (Facts), and step 2 deletes it. State file: `{ "registeredAt", "retiredAt", "version", "said": { "<key>": "<ISO>" } }`;
read as `{}` when absent or not an object, each field checked when read, written by `writeAtomic` only when it changed;
a failed write is tolerated (a line repeats, a clock starts again). Keys: `conflict:<digest>`, `auto-update-off`,
`inline-true`, `proof:<digest>`, `left:<digest>`, `wait`, `shell`, `refused:<digest>`; `said` ends a run with the live keys only.

### What grows, and who retires it (adds to the parent's table, `todo/PLAN_dew_flow_mods.md:276-287`)

| Surface | Size | Who retires it | Interrupted |
|---|---|---|---|
| `mods/dew-flow-mods.seen.json` | under 1 KB (about 1.5 KB while an `aside` with its seven hashes is recorded); `said` has at most the eight key families | kept forever, overwritten | a lost file restarts a clock; it never hastens step 2; a lost `aside` leaves the folder named once, never deleted |
| `mods/agent-models.retired-<ms>-<pid>` | the old folder, about 0.3 MB, for milliseconds | step 2 itself | the next start deletes it, when it is the recorded aside and still equals its record |
| `settings.json.bak-subagent-model-*` | at most three more files of the settings' size per machine (registration, step 1, step 2) | nobody, as today (`user-guard-install.mjs:226-236`); kept | `backupOnce` adds none on a retry |
| the old folder when it is `left`, or while the plugin is `off` | 0.3 MB | the person; named once | — |
| `tools/fixtures/retired-installer/` | 104 KB in the repository | kept while a consumer can pin a release that ships the old step; its removal is a later plan | — |

**What this does not give.** The step asks the engine to install; it never checks that the mod LOADED: E4.1 observes
that on this machine, the first install beside the active folder copy included. `.orphaned_at` and
`CLAUDE_CODE_PLUGIN_CACHE_DIR` are from the docs, not observed. A process of the same user can change a file between
two of our reads: the re-read of `commitSettings` and the exclusive tombstone are for honest concurrent sessions only.
`CLAUDE_CONFIG_DIR` is not read: the step writes under `os.homedir()`, as the guard step does (`ensure-user-guard.mjs:237`).

### Test scenarios (Given / When / Then; each RED before its code)

Fixture words, all built by `tools/lib/mods-marketplace-fixtures.mjs` on an `ownedDir` home (never `os.homedir()`):
**old(v)** = the old folder with the files its record names, the matching record, and `env.CLAUDE_CODE_PLUGIN_DIRS` naming it
(with `extras: true`, also the engine's files `tsconfig.json` and `.claude-plugin/types/x.d.ts`); **reg** = the two keys built by
`anchorEntry()`; **engine(v)** = the `known` entry, the cache folder with `plugin.json` v, the record; **tomb** =
`tombstoneBytes`; the clock is the `now` seam (no test reads the real clock; times are `NOW ± n` hours). "Untouched" =
`snapshot(home)` equal before and after (bytes and mtime). "The step" = `ensureModsMarketplace` in process.

| # | Given | When | Then |
|---|---|---|---|
| R1 | no `settings.json` | the step | the file holds exactly the two keys; no backup; line `registered` |
| R2 | settings with `env`, other marketplaces and plugins, `hooks`, mode 0600 | the step | the two keys added; every other member deep-equal and in its place; mode 0600; one backup with the old bytes |
| R3 | reg, no engine | the step, twice | untouched, silent |
| R4 | a `dew-flow-mods` entry with another url; another ref; a `path` key; `source: github` — no record | the step, twice; then the entry changed | untouched; the line once; the changed entry is said again |
| R5 | reg with the plugin `false`, old(1.4.0), engine | the step | untouched, silent, no tombstone |
| R6 | unparsable; an array; `env` a string; `enabledPlugins` an array; `extraKnownMarketplaces` a string | the step | nothing changed but the state file; `refused` once |
| R6c | settings changed by `beforeWrite`: (a) to hold reg, (b) to other bytes; (c) no file at the read and one appears before the write | the step | (a) silent, their bytes kept; (b), (c) nothing of ours written, `refused` with the retry; no leftover temp file |
| R7 | `AGENT_MODELS_MOD` `off`, `OFF`, ` off `; `platform: 'win32'`; a project with the reference layout; a marker that is empty, a folder, a link, `{}` — each with old + engine | `ensureModsMarketplaceStep` | `skipped`; untouched (no state file, no folder made) |
| R8 | the anchor source with `autoUpdate: false`, and with no `autoUpdate`; engine | the step | the entry untouched; `told` once; the retirement goes on |
| R9 | `settings.json` a link to a file elsewhere; a dangling link | the step | written through the link, the link kept; dangling: `refused`, nothing created |
| M1 | reg + old; no `installed` file; a file with no record for the id | the step | untouched, silent |
| M2 | reg + old + engine, changed in exactly one thing: no record; no cache folder; no `plugin.json`; another version in it; another name; `.orphaned_at` added; `version: 3`; `plugins` an array; two user records; `installPath` outside `cacheRoot`; `installPath` a link; a record file over 1 MB | the step | no tombstone, settings untouched; the silent ones silent, the others `told` once naming the file |
| M3 | reg + old + a whole record, and `known` names another url; another ref; has no entry; or the settings entry differs | the step | no retirement; `told` once (no entry: silent) |
| M4 | reg + old(1.4.0) + engine(1.6.0) | the step | marker `ours`; `enabledPlugins[INLINE_ID] === false`; the folder, its record and the variable untouched; one backup; line `retired` with 1.6.0. A `beforeWrite` probe sees the tombstone on disk before the settings write |
| M10 | reg + engine, no old folder, no variable | the step | as M4; the short `retired` line |
| M5p | the frozen project (a consumer-shaped folder: the frozen `hooks/` as `.claude/hooks`, the seven 1.4.0 mod files read by `git show c598a11:mods/agent-models/<file>` into the temp folder as `.agents/conventions/mods/agent-models`), no marker, an empty home | the FROZEN step | it installs 1.4.0 and registers the folder — the control: the fixture is not rejected |
| M5a | M4 with `stopAfter: 'tombstone'` | the frozen step, then the step | frozen: `skipped`, home untouched; then `INLINE_ID` false and the one `retired` line |
| M5b | M4 with `stopAfter: 'inline'` | the frozen step, then the step at +1 h and at +25 h | frozen: untouched; +1 h: `retiredAt` stored, silent; +25 h: step 2 |
| M5c–e | S4 with `stopAfter` `'variable'`, `'rename'`, `'folder'` | the frozen step, then the step | frozen: untouched, no folder comes back; the step finishes: no entry, no folder, no `retired-*`, no record, no reported file, no `aside` in the state; `removed` said once over the two runs |
| M6 | S3 with `retiredAt` = now − 23 h 59 min; then now − 24 h; the variable `/a:<old>:/b`, then `~/.claude/mods/agent-models` alone | the step | before: untouched. After: `/a:/b` (alone: the key gone, `env` kept); folder, record, reported file gone; marker and state kept; `removed` |
| M6b | S3 with `retiredAt` absent; unparsable; one hour in the future | the step, then +25 h | first: only `retiredAt` = now written; then step 2 |
| M6c | S4, but the plugin now `false`; the `known` entry changed; `INLINE_ID` set to `true` | the step | nothing removed (the proof and the switches are read again at step 2) |
| M7 | S4 with the old folder: a link (its target has files); owned by another uid (`uid` seam); a file; no record; a record key `../x`; a named file changed; a named file missing; a link inside; 501 entries; a variable that is a number | the step, twice | folder, link target, entry and record untouched; `told` once with the reason; `INLINE_ID` stays `false` |
| M7b | S4, old(1.4.0) with exactly the recorded files; then old(1.4.0, extras) = the same with `tsconfig.json` and `.claude-plugin/types/claude-code/index.d.ts`; then the same with `notes.txt`, and with an unknown nested folder | the step | only a folder whose files equal its record is removed. The extras folder, `notes.txt` and the unknown folder are `left`, with the entry and the record, said once, the first unknown path named, and the line says how to remove it by hand |
| M7c | S4 with a same-uid `agent-models.retired-123-456` the step never created (and look-alike names, and a link of that shape) | the step, twice | none is deleted; each real folder of the shape is named once; the record and the reported file are still deleted |
| M7d | S4 with `stopAfter: 'rename'` (the aside is recorded in the state, the rename done, the delete not); then the same with a file added to the aside, with a file of it changed, with the aside replaced by a link, with another uid, and with a recorded name that is not an aside's | the step | the first is finished at the next start and the record cleared; every other is NOT deleted (a link's target is untouched), the aside is named once with the first unknown path and its record stays; a recorded name of another shape reads as absent; a record written before a rename that never happened is cleared and the old folder is removed |
| M8 | reg + old + engine + `INLINE_ID: true`; the same with tomb and 25 h | the step, twice | no tombstone / no removal; `told` once |
| M9 | S5 and the process's `env.CLAUDE_CODE_PLUGIN_DIRS` lists the old folder; the start that itself did step 2 | the step, twice | `told` once; the step-2 start says only `removed` |
| U1 | S5, engine 1.6.0; then 1.6.1; then 1.6.1 | three starts | silent (stored); `updated 1.6.0 → 1.6.1`; silent |
| W1 | reg, no record, `registeredAt` = now − 71 h; − 72 h; then engine appears | the step | silent; the manual command once; then the key is gone and the retirement goes on |
| X1 | two `told` states at once; one leaves and comes back; a state file that is an array; a state file that cannot be written | starts | each said once; said again after it came back; read as empty; lines repeat, no throw |
| X2 | `mods` is a link; is a file — with reg + engine | the step | no tombstone through it, settings untouched, `refused` |
| X3 | reg + old + engine; a person's marker appears between `readMarker` and the write (seam) | the step | the marker's bytes kept; settings untouched; later starts write nothing |
| X4 | engine(v) alone | `readProof` | `whole` — asserted once, so every M2 row changes one thing in a fixture the code accepts |
| S1 | this machine's state: settings with other plugins and `runpod`, old(1.4.0), no keys | the spawned hook: start 1; the fixture plays the engine; start 2; start 3; `retiredAt` set back 25 h; start 4; start 5 | 1: `registered`; folder, variable and `INLINE_ID` untouched, no marker. 2: `retired`. 3: untouched, no output. 4: `removed`; other plugins and `runpod` deep-equal. 5: no output |
| S2 | an empty home | the spawned hook, then engine, then a start | the guard, effort and `registered` lines in that order (as `tools/agent-models-step.test.mjs:76-85`); then tombstone and `false`; nothing to remove later |
| W2, W3 | `SUBAGENT_MODEL_GUARD=off`; a lib that throws at import, and one that throws inside | the spawned hook | W2: the step still runs; W3: the guard and effort lines print, exit 0, the home has nothing of the step; the refusal `agent-models: the dew-flow-mods step could not run (<code>)` is repeated at each start (nothing can record it without the lib), and it never says the marketplace is not registered |
| T1 | (a) the lib's text; (b) S4 with a folder of 40 files and 400 KB, in process; (c) S1's start 4, spawned, stdin closed | scan; run | (a) no `node:child_process`, `node:net`, `node:http(s)`, `node:dns`, `node:worker_threads`, `fetch(`, `setTimeout`, and the scan finds a planted one; (b) under 1 000 ms; (c) under 3 000 ms |
| A3 | the lib's text | scan | every specifier is `node:*` or `./user-guard-install.mjs`; every imported name is exported there; `settings` reaches disk only through `commitSettings` (as `tools/agent-models-imports.test.mjs:220`, `:265`); each scan finds a planted instance |
| K1 | `ANCHOR`, `MARKETPLACE`, `PLUGIN_ID` | read | equal to the parent's § A text, typed once in the test on purpose: a changed URL or ref is a red test and a reviewed line |

RED, in two kinds. **A row that makes something happen** is written against a stub lib (every export present, `none`
and `{}` returned), run, and must fail on its own assertion, not on a missing module. **A row that asserts nothing
happened** passes on a stub: after the code exists, delete the one production line that guards it, see it red, restore
it. Both observations go into the PR for every row (`common/testing.md` § *Every bug fix starts with a RED test*).

### Brief for the Sonnet coder (3.1)

Work in `/home/jinx/git/wt-conv-mods-e3`, branch `feat/mods-marketplace-step`. Read first: this story, the parent § A
and § D, the probe § *Decision*, `settings/hooks/lib/user-guard-install.mjs:170-240` and `:451-610`,
`settings/hooks/lib/agent-models-install.mjs:54-104` (the pattern of a registration on the road). Order:

1. `tools/fixtures/retired-installer/` by `git show c598a11:<path>`, no byte edited; the fixtures lib; M5p (green with
   no new code: it proves the frozen step runs).
2. A stub lib with every export; the table's tests, red as said above (`node --test tools/mods-marketplace*.test.mjs`).
3. The lib: `paths`, the reads, the pure decisions, `LINES`, then `ensureModsMarketplace`. Import the helpers of
   `user-guard-install.mjs`; write no second body of one (`tools/agent-models-imports.test.mjs:118`).
4. `ensure-user-guard.mjs` as above; both files copied byte for byte to `.claude/hooks/`; `tools/agent-models-step.test.mjs` deleted.
5. `npm test`, `npm run check`, `node tools/adapter-check.mjs .`. Report per row: the red message and the green run.

Do not: touch the real `~/.claude`, start `claude`, add a dependency, write a second settings writer, commit or push.
Models: spec Fable (this document); code and tests Sonnet; review Opus; fixes Sonnet.

## Story 3.2 — the removal, the frozen fixture and `adapter-check` (brief)

- **Remove** (parent § D, `todo/PLAN_dew_flow_mods.md:254-258`): `mods/agent-models/` (33 files), `.gitattributes:4`,
  `tools/agent-models-pins.json`, `tools/lib/agent-models-pin.mjs`, `tools/lib/agent-models-fixtures.mjs`, the four
  `settings/hooks/lib/agent-models-*.mjs` with their `.claude/hooks/lib` copies, and the remaining
  `tools/agent-models-*.test.mjs`. The extractor test moves (parent `:224`); the clone of `dew_flow_mods` at `bcf09f6`
  has no such test in `tools/`, so it goes there first, by a PR in that repository, and is deleted here after it.
- **Keep what the deleted tests hold about the shared core.** `tools/agent-models-imports.test.mjs:230-302` (the one
  road in `user-guard-install.mjs`, the `writeAtomic` scan, U+FEFF) and the road cases of
  `tools/agent-models-register.test.mjs` move to `tools/user-guard-road.test.mjs`, pointed at `mods-marketplace.mjs`
  where they named the installer. The comments at `user-guard-install.mjs:194` and `:482` name the new caller.
- **The frozen fixture stays**, guarded: a test holds the sha256 of its six code files (the fixture's six files as of `c598a11`) (red on a changed byte),
  and only `tools/mods-marketplace-step.test.mjs` imports from it. **`adapter-check`** (`tools/adapter-check.mjs:143-157`)
  gains a finding for a file `agent-models-*.mjs` in a consumer's `.claude/hooks/lib` ("retired — delete it");
  `tools/adapter-check.test.mjs:66-67` name `lib/mods-marketplace.mjs`.
- **Scenarios** (each red first): A1 a consumer with one retired lib → named, exit 1; with none → clean. A2 the bare
  repository names the new lib as missing. A4 a scan of the tracked files for `mods/agent-models`, `RELEASED_MOD`,
  `agent-models-pins` → no hit outside `research/PLAN_*`, `todo/PLAN_*` and the fixture, and the scan finds a planted
  hit; its first run is the list to work from (`common/security.md`). F1 the fixture's hashes. Models: brief Opus; code
  Sonnet; review Opus.

## Story 3.3 — the docs (brief)

`research/module_rules.md:100-175` rewritten (the step, the proof, the two retirement steps, the lines, the trust
model of the parent's § B in short, what the step does not give); `research/architecture.md:27`;
`research/module_tests.md:240-305` (the two new test files, the frozen fixture, what is not covered: the engine's
install and load, E4.1); `README.md` (Consumers, the tenth row) and `ROLLOUT.md` (a bump deletes the four retired libs
and copies the new one). Every sentence about the old installer goes; a caveat that was true stays with its fact
(`common/knowledge-base.md`). `node tools/plan-lifecycle.mjs` clean. **Models:** Sonnet writes, Opus reviews.

## From the dew_flow_mods PR #1 review (2026-11-23)

- **No silent load failure** (coai, rejected there because the adapter is byte-identical, taken here): the new step
  never swallows a failure to load its lib. `ensure-user-guard.mjs` today returns `null` on a failed `import()`
  (`settings/hooks/ensure-user-guard.mjs:175-181`); the new step turns it into a refusal with the reason, said once,
  and the other steps still run. A test: the lib missing, the line is said, the guard and effort steps still run.
- **Follow-ups for this repository, not built in E3**: the adapter's process launcher kills only the child on a
  timeout, not the tree (`settings/hooks/load-instructions.mjs`, the security rule's "kills the entire process
  tree"); the adapter's `settings/settings.json` allows Bash and PowerShell without a prompt in every consumer — a
  family-wide permission choice for the owner.

## Open points for the caller

1. **Said once** is kept in the state file's `said` map, not in `agent-models.reported.json` (an old-pin session deletes
   that file, and so does step 2). Recommended as written.
2. **The fixture is made in 3.1** (M5 is red-first there) and holds only the parent's six files. The control M5p
   still runs the true old step: its test reads the seven 1.4.0 mod files from git history at test time
   (`git show c598a11:mods/agent-models/<file>` into the test's temp folder), so no mod bytes are stored in the
   fixture and the parent text stands (decided by the caller, 2026-11-23).
3. **`autoUpdate` is not part of the anchor** (R8); **step 2 reads the proof again** (M6c); **a missing engine
   marketplace record is "no proof"** (M3) — the stricter readings of the parent's "where it can be read". Recommended.
4. **Only a folder whose files equal its install record is removed** (M7b): every file is named by the record with its hash and nothing else is there; the engine's own `tsconfig.json` and `.claude-plugin/types/**` are NOT trusted by path (the first round did; the feature review of 2026-11-23 followed the parent instead); any other file keeps the folder with its entry, said once with the first unknown path and how to remove it by hand (owner check 1).
5. This document needs its `todo/README.md` row and the link from the parent's E3 line in the commit that adds it.

## Definition of Done (E3)

- [ ] Every row of 3.1 and 3.2 green, each with its red observation in the PR; `npm test`, `npm run check`,
      `adapter-check` and `plan-lifecycle` green.
- [ ] No mod, no pins table, no installer lib, no `RELEASED_MOD` in the tree; the frozen fixture guarded by its hashes.
- [ ] The docs of 3.3 describe the step as it is; the code round (coai `review_code` and an Opus review) is resolved;
      one PR merged; no promotion; the summary names models and counts.
