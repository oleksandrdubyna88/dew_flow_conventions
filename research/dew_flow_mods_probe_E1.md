# dew_flow_mods — probe E1 (V1, V2, V3, V8): what the engine does with a marketplace set by user settings

Date: 2026-11-23. Machine: this WSL box. Claude Code: `2.1.330 (Claude Code)` (`claude --version`).
Plan: `todo/PLAN_dew_flow_mods.md` § A, test rows V1, V2, V3, V8, build order step 3.
Status: observed. Nothing here is shipped code. No commit.

## Rules this probe kept

- Every `claude` command ran through the wrapper `<scratchpad>/e1/c.sh` (clean environment with `env -i`; PATH, HOME and
  `CLAUDE_CONFIG_DIR=<scratch folder>` only; `CLAUDE_CODE_PLUGIN_DIRS` unset except in V3). Interactive starts ran in
  `tmux` through `c-tty.sh`.
- Scratchpad = `/tmp/claude-1000/-home-jinx-git-dew-flow-conventions/fca0c5b7-c57d-4970-ac7d-463813187faa/scratchpad/e1/`
  (below: `$S`). No login or credential file was copied. Every start answered `Not logged in · Please run /login`; this is
  enough to see plugin install and load (see "Not observed").
- The real `~/.claude/settings.json` has the same sha256 as before. The real `~/.claude.json` changed during the run;
  it has no `dew-flow-mods` text, no probe command used it, and the parent Claude Code session writes it all the time.
  The real `~/.claude/plugins/known_marketplaces.json` has no `dew-flow-mods`.
- Nothing on GitHub. The throw-away repository is the local bare repository `$S/repo.git`, branch `release`, reached by
  `file://$S/repo.git`. Its tree: `.claude-plugin/marketplace.json` and `plugins/agent-models/` (a copy of
  `/home/jinx/git/wt-conv-pins/mods/agent-models`: `hooks/`, `.claude-plugin/plugin.json` version 1.6.0, `types/`,
  `tsconfig.json`; no tests). Two commits on `release`: `25694a4` (tag `relpath-entry`) has the entry
  `"source": "./plugins/agent-models"`; `ca07330` (the tip) has the entry
  `{"source":"git-subdir","url":"file://$S/repo.git","ref":"release","path":"plugins/agent-models"}`.
  `claude plugin validate` passes (warning only: no marketplace description).
- Every case used a fresh scratch config folder (`$S/cfg-*`). A stray run of three `-p` starts hit the folder `$S/config`
  (the first V1 folder) while the repository already held the git-subdir commit; I did not use `config` for any result
  below except the first relative-path `-p` series (V1-a), which ran before that.
- Logs: `$S/logs/*.log` (`--debug-file`). Each case lists its log names.

## The engine's documentation (read 2026-11-23, code.claude.com)

- `plugins/org.md`: `extraKnownMarketplaces` registers a marketplace; the source object takes `github`, `git` (`url`,
  optional `ref`, `path`), `url`, `file`, `directory`; `autoUpdate` is a field of the entry. `enabledPlugins`
  (`plugin@marketplace`) names the plugins. "Claude Code registers the marketplace and installs the two plugins at the
  start of the user's next session" (said for managed settings). Table "When each surface applies the plugin keys":
  `-p` and CI: "installs running in the background", so "a plugin can be missing from the first turn"; the variable
  `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1` makes the run wait for the install before its first query. Repository
  `.claude/settings.json` marketplaces need folder trust; user settings are not mentioned as needing it.
- `plugins/host-marketplace.md`: `autoUpdate` is off by default and `marketplace.json` cannot turn it on; an
  `extraKnownMarketplaces` entry with `"autoUpdate": true` does. A new version reaches users only when the computed version
  changes (`plugin.json` `version` first). `claude plugin marketplace add <url>#<ref>` pins a branch or tag.
  A relative-path entry needs the whole repository clone (a bare `marketplace.json` URL fails).
- `claude plugin install --help` (2.1.330) has `--marketplace <source>` (adds the marketplace first, in user settings).
  `claude plugin marketplace --help`: `add`, `list`, `remove`, `update`.
- Not in the docs, found by observation below: the one-start-late installed record and the "gap start".

## V1 — the two keys alone in user settings

Scratch user settings (the only content), key names as the engine accepts them (a `git` source with a `file://` URL
**is accepted**; the debug line is `git clone: url=file://… ref=release`):

```json
{ "extraKnownMarketplaces": { "dew-flow-mods": { "source": { "source": "git", "url": "file://$S/repo.git", "ref": "release" }, "autoUpdate": true } },
  "enabledPlugins": { "agent-models@dew-flow-mods": true } }
```

Written by `$S/mkcfg.sh <name>`. `claude plugin list` alone installs nothing (it printed "No plugins installed").

### V1-a — relative-path entry (`./plugins/agent-models`)

`-p` starts (`claude --debug-file L -p "x"`, no login), folder `$S/config`, logs `v1a-start1..5`:

| start | what the engine did | `installed_plugins.json` after | mod loaded |
|---|---|---|---|
| 1 | log: "Skipping orphaned enabledPlugins entry … marketplace not registered"; then `[reconcile] dew-flow-mods(install)`, `git clone` ok, "Added marketplace source" (clone in `plugins/marketplaces/dew-flow-mods/`, `known_marketplaces.json` written with `autoUpdate: true`); "Plugin agent-models@dew-flow-mods not found in any marketplace, skipping" | `{"version":2,"plugins":{}}` | no |
| 2 | "Plugin loading errors: Plugin "agent-models" not cached at …/plugins/marketplaces/dew-flow-mods"; then "Added agent-models@dew-flow-mods with scope user" | **a record with no folder behind it**: `installPath` = `…/plugins/cache/dew-flow-mods/agent-models/1.6.0`, `version` 1.6.0, `gitCommitSha` = the marketplace commit `25694a48…`; `plugins/cache/` does **not exist** | no |
| 3, 4, 5 | "not cached at …/cache/dew-flow-mods/agent-models/1.6.0" each time | unchanged (ghost record) | no; the cache is never filled by `-p` |

So in `-p` without the sync variable the relative-path plugin is **never installed**, and the engine leaves a ghost record.

`-p` with `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1` (fresh `$S/cfg-sync`, logs `v1a-sync1`, `v1a-sync2-nosync`,
`v1a-sync3-nosync`):

- start 1: clone, "Loading plugin agent-models from source: ./plugins/agent-models", "Copying source directory",
  "Successfully cached plugin … 1.6.0", `hooks module agent-models@dew-flow-mods loaded (worker, environment 1, tier user)`;
  all in one start, before the first query. `installed_plugins.json` is still empty ("not recording enabled plugins:
  CLAUDE_CODE_SYNC_PLUGIN_INSTALL is set, so a full load follows").
- start 2 (variable not set): "not cached at …/marketplaces/dew-flow-mods" (the record is empty at load time); the record
  is written during the start (`gitCommitSha` 25694a48…, `installPath` = the existing cache folder).
- start 3: loads; `claude plugin list` shows `agent-models@dew-flow-mods`, `Version: 1.6.0`, `Scope: user`, `Status: ✔ enabled`.

Interactive starts (tmux; scratch `.claude.json` held only `{"hasCompletedOnboarding":true,"theme":"dark"}`;
`$S/cfg-int`, logs `v1a-int1..3`):

| interactive start | result |
|---|---|
| 1 | the **folder trust dialog** ("Is this a project you created or one you trust?") for the scratch work folder came first; **nothing was cloned while it was open** (no `plugins/` folder). After "Yes, I trust this folder": `[reconcile]`, clone, copy to `cache/dew-flow-mods/agent-models/1.6.0`, `hooks module agent-models@dew-flow-mods loaded`; the mod's row (`[ messages ] account ? … [ login ] [ tasks (0) ]`) drew in the same session, in about one second, with **no command**. `installed_plugins.json` after: `plugins: {}` |
| 2 | **the mod did not load**: "not cached at …/plugins/marketplaces/dew-flow-mods" although `cache/…/1.6.0` exists. The record was written during this start |
| 3 | loads |

`claude plugin install agent-models@dew-flow-mods` (folder `$S/cfg-install`, a `cp -a` of the ghost-record folder):
"✔ Successfully installed plugin: agent-models@dew-flow-mods (scope: user)", with a warning "marketplace not refreshed
(… corrupted installLocation …)" — that warning is an artefact of my copy (the recorded absolute path pointed at the
old folder). The record and the cache folder appeared at once. `/reload-plugins` in a start that has the marketplace
but no record loads the mod (see "Gap start" below).

### V1-b — `git-subdir` entry

Folder `$S/cfg-sub` (`-p`, no sync, logs `v1b-sub-p1..3`): start 1 clones the marketplace; starts 2 and 3: "External
plugin agent-models@dew-flow-mods not in cache, skipping"; **no record at all, no cache, no load** in three starts.

Folder `$S/cfg-subsync` (`-p` with `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1`, logs `v1b-subsync-p1,2`): start 1: "Caching plugin from
source: {"source":"git-subdir","url":"file://…/repo.git","path":"plugins/agent-models","ref":"release"…}", "Extracted
subdir plugins/agent-models from file://… ref=release sha=ca073303c598…", cached, loaded. Record empty after start 1;
after start 2 the record is `{"scope":"user","installPath":"…/cache/dew-flow-mods/agent-models/1.6.0","version":"1.6.0",
"installedAt":…,"lastUpdated":…}` — **no `gitCommitSha` key** for `git-subdir` (the relative-path record has one).

Folder `$S/cfg-subint` (interactive, logs `v1b-subint1..3`): same three-start pattern as the relative path: start 1 (after
the folder trust) loads; start 2 does not (record written); start 3 loads.

### What V1 decides

- Both forms install with no command in an **interactive** session, after folder trust. Both load in the same start that
  clones. In `-p` neither installs without `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1`; relative-path leaves a ghost record,
  `git-subdir` leaves nothing. So no form needs `claude plugin install` or `/reload-plugins` for the interactive path.
- The relative-path form is acceptable (same behaviour in the interactive path, and the record carries the marketplace
  commit sha). `git-subdir` works too and gives an extra pin point (the plan's layout gate could pin `url`, `ref`,
  `path`), but its record has no sha and needs an extra clone of the same repository (log: a second extract).
- The installed record is written **one start late** (interactive start 2) and the mod is absent from that start (see
  "Gap start"). A retirement step that needs the record must not run in start 1 or start 2 of a new install.

## V2 — keys written by a SessionStart hook

Setup (folders `$S/cfg-hp`, `$S/cfg-hps`, `$S/cfg-hint`): user settings hold only a `SessionStart` command hook
`node $S/hook-write.mjs`; the hook adds the two keys when absent (same JSON as V1) and appends a line to
`hook-write.log`. The SessionStart command hook runs in `-p` and in interactive starts (each start appended a line).

| run | start 1 (hook writes the keys) | start 2 | start 3 | start 4 |
|---|---|---|---|---|
| `-p`, no sync (`v2-p1..3`) | no clone, no `plugins/` content | marketplace cloned; no install (as V1) | ghost record | — |
| `-p`, SYNC=1 (`v2-ps1..3`) | no clone | cloned, cached, **mod loaded** | loaded (record written) | — |
| interactive (`v2-int1..4`, after folder trust) | no clone (hook ran after the settings had been read) | clone, install, **mod loaded**, record empty | **not loaded** (record written) | loaded |

Decides: keys written by a SessionStart hook are picked up by the **next** session start, never the same one. The
engine's settings file watcher saw the change in a running session ("Detected change to … settings.json", "Settings
changed from userSettings"), but it did not clone or install in that session. So "the first working session" is start 2,
and a new machine needs: start 1 (the hook writes), start 2 (install and load), start 3 (gap), start 4 (steady).

## Gap start (found while doing V1/V2)

In every run where the install happened in the foreground, the next start had `Loaded 0 installed plugins` at load time
and logged `Plugin "agent-models" not cached at <marketplace folder>` although the cache folder was complete. In that
interactive session `/reload-plugins` loaded the mod ("Reloaded: 1 plugin", module loaded; `$S/cfg-gap`, log
`gap2`). So a new install has one session (start 3 of the hook route, start 2 of the settings route) with no mod and
no message other than the `/plugin` Errors entry. The plan's "how many starts" in the owner checks must say this.

## V3 — the old folder and the marketplace copy

Setup: `$S/old-mod` = copy of the mod with `plugin.json` version `1.4.0-oldcopy` (so the two are told apart). Steady
folder `$S/cfg-subsync` (marketplace copy installed, record present). `claude plugin list` and the `-p` `init` event of
`--output-format stream-json --verbose` (lists the loaded plugins with path and version) were used. Logs `v3a`,
`v3a2`, `v3b`, `v3c`, `v3d-gone`, `v3d-gone2`, `v3-run`.

| step | setup | result |
|---|---|---|
| a | `CLAUDE_CODE_PLUGIN_DIRS=$S/old-mod` plus the marketplace copy | **The folder copy wins, in silence.** `init` plugins: `agent-models@inline` 1.4.0-oldcopy with the folder path; the marketplace copy is **not loaded** (0 module-loaded lines for `@dew-flow-mods`). `claude plugin list` still says `agent-models@dew-flow-mods … Status: ✔ enabled` and lists `agent-models@inline … Status: ✔ loaded` under "Session-only plugins" |
| b | user settings `enabledPlugins` adds `"agent-models@inline": false` | **The marketplace copy loads** (`init`: `agent-models@dew-flow-mods` 1.6.0, path in `cache/…`); the inline copy does not (`plugin list`: `agent-models@inline … Status: ✘ disabled`) |
| c | `--settings '{"enabledPlugins":{"agent-models@inline":true}}'` while the user settings say `false` | **The folder copy loads again**; the marketplace copy does not. `--settings` beats user settings |
| d | the variable still names the folder and the folder **does not exist** (a `-p` child that inherited it) | no failure, exit 0: `[WARN] Plugin path does not exist: … (ENOENT), skipping`, an error entry "Path not found: …" in the plugin errors; the marketplace copy loads (with and without `@inline false`) |
| e | the folder exists and `@inline false` is set, a `-p` child with the inherited variable | as b: the marketplace copy loads, the folder copy is disabled |
| f | a **running interactive** session (`$S/cfg-subint`) started with the variable and the folder copy loaded; then `agent-models@inline: false` written to user settings | the engine saw the file change, but the running session **kept the folder copy** (no marketplace module load) until `/reload-plugins`; after it: "Reloaded: 1 plugin" and the marketplace copy loaded |

Decides: step 1 of the retirement plan (tombstone, then `agent-models@inline: false`) frees the marketplace copy for
every **new** start, folder and variable can stay (e: works; d: also works if the folder is gone, one error entry). A
running session keeps what it loaded until `/reload-plugins` or a restart. Removing the variable entry in step 2 is
not needed for the marketplace copy to load; it only removes the error entry that appears when the folder is gone.
Nothing here shows a conflict warning for the name clash (silent shadowing, as the docs say).

## V8 — prompts, and whether a `-p` run loads the hooks module

- **No dialog or prompt names the marketplace or the plugin** for user-settings entries (`extraKnownMarketplaces`,
  `enabledPlugins` in the user settings file): not in `-p`, not in the interactive starts. The only dialog was the
  ordinary **folder trust** dialog of the working folder (a new scratch folder in a new config), and it appears for any
  start in an untrusted folder.
- In the interactive start that dialog is **in front of the install**: while it was open no `plugins/` folder existed;
  the clone, the copy and the module load ran after "Yes, I trust this folder". The log said "hooks modules not loaded
  until workspace trust is accepted" for the built-in modules, and the install ran only after the accept. A first
  start in a folder the person has never trusted therefore installs only after the person answers.
- `-p` has no trust dialog and **does load the hooks module** of a plugin that is already cached
  (`hooks module agent-models@dew-flow-mods loaded (worker, environment 1, tier user); events: session.start,…,ui.render`).
  The folder was never trusted in those `-p` runs.
- Interactive start side effect (engine's own): the first interactive start in a new config also registered
  `claude-plugins-official` from GitHub (`known_marketplaces.json`, `officialMarketplaceAutoInstalled`). This is not
  part of our two keys; a machine with the official marketplace already present is unaffected.

## Not observed (needs a logged-in session — owner/interactive check)

- A model answer, the mod's panels with real data (the row showed `account ?` and `claude exited 1` because there is no
  login), `/plugin` screens, the mod's behaviour with real limits.
- The timed background auto-update ("after the first message and a random delay up to ten minutes"): needs a sent
  message, so a login. Not tested: V4–V7, V9, V10 (E2 against the real repository).
- Real GitHub access: the clone used `file://`; the HTTPS clone and the SSH probe are E2's V4/V5.
- Real `~/.claude` state (an existing record, an existing `.optout` marker, a settings file with other keys).

## Decision inputs

1. **Source form.** Relative path `./plugins/agent-models` is enough for the interactive path: no command, no `/reload-plugins`, the
   catalog and the mod bytes are one commit, and the record carries `gitCommitSha`. `git-subdir` (url, `ref: release`,
   `path`) works the same and may be chosen if the layout gate must pin the source; it has no sha in the record and
   gives no benefit for installing. Plan choice stands: **relative path first**; `git-subdir` is not needed to get an install.
2. **Retirement key.** `~/.claude/plugins/installed_plugins.json` is `{"version":2,"plugins":{"agent-models@dew-flow-mods":[{"scope":"user",
   "installPath":…/plugins/cache/dew-flow-mods/agent-models/<version>,"version":…,"installedAt":…,"lastUpdated":…,
   ["gitCommitSha":…]}]}}`. A record can exist with **no folder** (`-p` without sync, relative path): the proof must check the
   `installPath` folder, its `.claude-plugin/plugin.json` version and the absence of `.orphaned_at` (the plan's list is right
   and needed). The record appears **one start after** the first load; do not treat "no record" in start 1 as a failure.
3. **Install with no command?** Yes in an interactive session after folder trust (same start as the first sight of the
   keys). No in `-p` unless `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1`; `-p` children never install by themselves.
4. **Hook-written keys.** Picked up by the **next** start, not the same one. Count: start 1 writes; start 2 installs and
   loads (interactive); start 3 has the mod absent (gap); start 4 steady. `/reload-plugins` fixes the gap start.
5. **Does `@inline false` free the marketplace copy?** Yes for any new start, including a `-p` child with the inherited
   variable and with the folder present or gone. A running session keeps the folder copy until `/reload-plugins` or a
   restart. `--settings` `true` brings the folder copy back for that run only.
6. **Prompts.** No dialog for user-settings marketplace or plugin entries; only the ordinary folder trust dialog, and the
   install waits for it in an interactive start.
7. **Retirement timing.** Because of the gap, step 1 (tombstone + `@inline false`) must wait until the install record is
   whole (the plan's proof) — and the owner should expect one session without the mod on a new install. Step 2's 24-hour
   delay is not needed for correctness of the marketplace copy; it protects running sessions and `-p` children.

## Decision (story E1.2, 2026-11-23)

The probe confirms the plan's choices, so the plan does not change:

- **Source form: the relative path `./plugins/agent-models`** in the marketplace at the `release` ref — the plan's
  first choice. `git-subdir` is not used.
- **The retirement proof** reads `installed_plugins.json` (version 2) as recorded above: the record for
  `agent-models@dew-flow-mods`, its `installPath` folder present, that folder's `plugin.json` version, no
  `.orphaned_at`, and the marketplace entry's url and ref equal to the trust anchor. "No record" at the first start is
  not a failure (the record comes one start later).
- **Retirement:** step 1 writes the tombstone and `agent-models@inline: false` only after that proof; step 2 removes the
  variable entry and the folder at a start at least 24 hours later (for running sessions and `-p` children).
- **Agent `-p` runs** do not install by themselves; the conventions step does not set
  `CLAUDE_CODE_SYNC_PLUGIN_INSTALL` (it would make every agent start wait for a clone); an agent run on a machine
  that has never had an interactive start runs without the mod, as today on a machine with no copy.
- **For E3 and the owner checks:** a new install has one session without the mod between the install start and the
  steady state (the "gap start"); `/reload-plugins` ends it at once.

Still to observe in E2 against the real repository (they need GitHub or a logged-in session): V4–V7, V9, V10, the
HTTPS clone time, the timed auto-update after the first message.

## E4.1 — the switch on the real ~/.claude (2026-11-23)

Claude Code 2.1.330, this WSL machine, the owner at the keyboard. `dew_flow_mods` `release` and the tag
`agent-models--v1.6.0` at `cf28dad` (promotion 1, approved by the owner). The step ran from a local canary branch of
`dew_flow_amd_r9700_tuning_ai` that pins conventions `4405544` by hand (never pushed).

**The boundary check** (the consultant's): with only the gitlink moved, `adapter-check` was red with exactly seven
findings (two drifted copies, `lib/mods-marketplace.mjs` missing, four retired libs); after the three hook copies and
the four deletions it was `OK`. `pin-check` was red `STALE` on that branch only, as expected.

**Before the click** the machine was already in state S1: the two registration keys had been written once at
14:04:34Z by an agent's probe during the E3 build (a hand run with the real home, outside the test sandbox — recorded
as a process defect; nothing else changed, the old copy kept loading). The baseline for a rollback was taken before
start 1.

| Start | The step said | Install record (`installed_plugins.json`) | Inline switch | Loaded |
|---|---|---|---|---|
| 1, install start (canary, trust accepted) | nothing (S1) | absent; the marketplace cloned at `cf28dad`, the cache holds 1.6.0 | absent | `@inline` 1.4.0 |
| 2 (canary) | `retired`: "the new copy loads from the next session" | user scope, 1.6.0, `gitCommitSha` `cf28dad`, the cache folder present, not orphaned | `false`; our tombstone written and read back; the variable entry kept (step 2 after 24 h) | `@inline` 1.4.0 (loaded before the step ran) |
| 3 (canary) | nothing — steady state | whole | `false` | **`@dew-flow-mods` 1.6.0** (the owner: "works perfectly") |
| 4, an old-pin checkout (`dew_flow_mods`, conventions `c598a11`) | the old step wrote nothing (the tombstone) | whole | `false` | **`@dew-flow-mods` 1.6.0** |

Against the baseline, the only settings member the step changed at retirement was `enabledPlugins["agent-models@inline"]`
(`undefined` → `false`); the registration keys were already present. The E1 timing held exactly: the record came one
start after the install start, and the copy switched one start after `retired`. No rollback was needed.

**Not observed yet:** step 2 (the variable entry and the old folder removed, from 24 hours after 17:04:44Z) — owner
check 1 of E4.3; the timed auto-update of a later promotion (V6); the HTTPS clone time (V5).

## V6 — a later release reaches an installed machine with no pin bump (2026-11-24)

`dew_flow_mods` promotion 2 (approved by the owner) moved `release` and the new tag `agent-models--v1.6.1` to
`7ec72a0` (1.6.1: the manifest names its author). Before it, this machine had `agent-models@dew-flow-mods` 1.6.0
(`cf28dad`) installed; the consumer pins were `c598a11` (r9700 and mcp read on GitHub).

The owner opened an interactive session, sent one message and kept it open, then started a new session. Read after
it: the install record says **1.6.1**, `gitCommitSha` `7ec72a0`, `lastUpdated` 2026-11-24T08:38:22Z, `installPath`
`cache/dew-flow-mods/agent-models/1.6.1` (the 1.6.0 cache folder kept beside it, as the engine does); no command was
run; the consumer pins are still `c598a11`. So a mod update reaches a machine with no consumer pin bump — the goal of
the move. Not observed separately: the update notice's exact time after the first message (the owner reported the
result, not the notice).
