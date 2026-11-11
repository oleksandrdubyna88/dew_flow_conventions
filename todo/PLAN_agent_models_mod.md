# PLAN — the `agent-models` mod ships with the shared rules and the session self-install turns it on

> Status: **plan approved 2026-11-11 (coai plan round `proceed`, 2 of 2 reviewers), nothing implemented yet.** Scope: a
> new `mods/agent-models/` folder (a Claude Code mod, version 1.3.3, ported from the owner's own earlier work), one new
> step in `settings/hooks/ensure-user-guard.mjs` with four installer modules under `settings/hooks/lib/`, helpers
> exported from `settings/hooks/lib/user-guard-install.mjs`, the version pin table, their tests,
> `research/module_rules.md`, `research/module_tests.md`, and the release to the consumers.

## Plan changes

> Epoch 1 · approved 2026-11-11 · by reviewers · state: open

- 1.1 · 2026-11-11 · reviewer · epics — the gate's operator command: split the plan into 2-3 epics, the split by Fable
  (The 17 findings accepted at the approving round itself, 4 from the gate and 13 from the Opus review, are the
  baseline this epoch was approved on and are written into the text below, not counted as changes.)

## Goal (the owner's words, 2026-11-11)

1. "Copy the mods into the conventions, and whatever else is needed, so that every dew_flow project installs and runs
   the mod automatically."
2. "I want every session on WSL to get this mod automatically."
3. "Clean out everything related to the company, if there is any. The mod does nothing secret; it only adds four
   buttons."

The mod draws one band above the prompt: a row per running subagent with its model, the signed-in account (a press
opens its usage limits), a `[ login ]` button, a `[ messages ]` viewer of the person's own prompts in this session,
and a `[ tasks (n) ]` list of notes. It is a hooks module (`hooks/hooks.json` → `register.tsx`); it holds no secret.

This repository is public. The owner was told so on 2026-11-11 and chose to publish the mod here. The source
repository's plan documents and git history are NOT copied; only the mod, its installer, the pin table and the tests.

## What exists today

- **Part A, done by hand on 2026-11-11** (not a deliverable; recorded because the new step meets it): mod 1.3.3
  installed on the owner's WSL by the original installer's own `ensureAgentModels` — `~/.claude/mods/agent-models/`,
  its record `~/.claude/mods/agent-models.installed.json`, and `env.CLAUDE_CODE_PLUGIN_DIRS` in
  `~/.claude/settings.json`. `claude plugin validate` passed, and the next session started with the variable set and
  drew the band. Observed there: the account stays `account ?` (unread) in a RESUMED session, while a NEW session
  showed the email (the owner, 2026-11-11) — a defect of the mod itself, very probably the account read having no
  ceiling (`hooks/prompts.ts:234-279`; not proven, the engine side was not observed), left to a separate plan for mod
  1.3.4 so this port stays byte-identical to 1.3.3.
- **The source port** (a copy outside this repository):
  - the mod: 7 shipped files, 10 test files, `tsconfig.json`, `.gitignore`;
  - the installer: `agent-models-decide.mjs` (218 lines), `agent-models-read.mjs` (120), `agent-models-swap.mjs`
    (334), `agent-models-install.mjs` (221);
  - the Node tests `agent-models-{decide,extract,install,pin,refusals,report,step,swap}.test.mjs`, the support files
    `tools/lib/agent-models-fixtures.mjs`, `tools/lib/agent-models-pin.mjs` and the table `tools/agent-models-pins.json`
    (raw sha256 per file per released version, rows only added).
  - A scan on 2026-11-11 for company names, hosts, VM names and e-mail addresses found none: test addresses are
    `@example.com`, the only URL is `https://api.anthropic.com/api/oauth/usage` (`hooks/limits.tsx:13`), `1.2.3.4` is a
    version-parser case. Stale pointers to the source repository's layout and plans are rewritten: `decide.mjs:6-7`,
    `decide.mjs:178`, `read.mjs:6`, `swap.mjs:7`, `install.mjs:9-13`, `install.test.mjs:536`.
- **The self-install here**: `settings/hooks/ensure-user-guard.mjs:187` `main()` reads the project from
  `CLAUDE_PROJECT_DIR` or the payload `cwd`; `:195` runs `ensureUserGuard` then `ensureEffort`; `:51`
  `isReferenceRepository(file)` takes a file two levels below a root and is true when that root has `tools/rules.mjs`
  and `settings/hooks/subagent-model.mjs`; `:185` `SPEAKING` decides which outcomes print. Consumers carry the hooks as
  verbatim copies in `.claude/hooks/` (`tools/adapter-check.mjs:44` `referenceHookFiles` derives the list from
  `settings/hooks/**/*.mjs`, so new lib files are demanded in every consumer without editing the check).
- **The released-copy check** (#158): `user-guard-install.mjs:37` `RELEASED_GUARD`; `:49` `releasedTextRefusal`;
  `install()` checks the bytes it writes, one read.
- **Helpers the ported modules import** from `user-guard-install.mjs`: `isObject` `:80`, `normalise` `:73`,
  `readOrNull` `:186`, `sameBytes` `:188`, `parseSettings` `:191`, `serialise` `:216`, `writeAtomic` `:174`,
  `writableReason` `:432`, `backupOnce` `:565`, and `existingSettingsFile`. All exist here as private functions and
  are exported, not copied (reuse-first, move 1). `existingSettingsFile` is the same bare `realpathSync` as
  `effortTarget` `:560-562`, so the port imports `effortTarget` under its own name, one implementation.

## Design

### A. The mod — `mods/agent-models/`

The 7 shipped files byte-identical to 1.3.3, its 10 tests, `tsconfig.json` and `.gitignore`. `.gitattributes` gains
`mods/agent-models/** text eol=lf`, so every checkout holds the same bytes the pin table names. No `.md` inside: the
rule loader reads rule folders only. `claude plugin validate` and `claude plugin test mods/agent-models` need the
`claude` CLI and are run by hand; CI does not run the mod's `.tsx` tests, and Sonar's `sources=tools` covers neither
`settings/hooks` nor `mods` — both recorded as known gaps in `research/module_tests.md`.

### B. The install step

A third step, `ensureAgentModelsMod`, in `ensure-user-guard.mjs`, after the guard and effort, each isolated by
`guardStep`:

- **Source**: `<project>/.agents/conventions/mods/agent-models`, the consumer's pinned submodule. A missing folder (the
  submodule not initialised) is a silent skip.
- **The reference skip is decided on the project, never on the mod**: `isReferenceRepository` is called with the same
  `<project>/.claude/hooks/subagent-model.mjs` path the guard step uses. A consumer's `.agents/conventions` has this
  repository's layout, so testing the mod's own root would skip the step in every consumer. The source's
  mount-shaped tests of that skip are rewritten for this layout.
- **Other skips**: `AGENT_MODELS_MOD=off`, the marker `~/.claude/mods/agent-models.optout`, and
  `process.platform === 'win32'` (the owner asked for WSL; the mod says Windows is not tested, `hooks/prompts.ts:447`;
  macOS is not skipped and not tested either). `SUBAGENT_MODEL_GUARD=off` does NOT skip it.
- **Released copy only, one table**: `RELEASED_MOD` in `agent-models-decide.mjs` is the version and the RAW sha256 of
  each `MOD_FILES` entry, equal to the newest row of `tools/agent-models-pins.json`; a test fails when it is not, and
  another when that row is not the files of `mods/agent-models` at HEAD. The check runs inside the install on the
  bytes `readSource` already holds (one read, as #158). A source that differs is refused naming the first file that
  differs; nothing is copied. Raw bytes are safe because of the `eol=lf` rule above; a checkout made before it is
  refused, said once.
- **Copy and register** (the ported core): install when missing, upgrade an older version by a rename swap keeping at
  most one `agent-models.replaced-<stamp>` folder, never downgrade, keep a copy whose bytes its record does not vouch
  for, write the record, then register.
- **Registration**: `env.CLAUDE_CODE_PLUGIN_DIRS` is a string of paths joined by `path.delimiter` (`:` on Linux and
  macOS). The target is appended once; an entry equal to it after `normalise` and `~/` expansion means nothing to do;
  empty entries and duplicates of the carried value are dropped; a non-string value or a non-object `env` is refused
  with nothing written. The first registration into an empty value carries the session's own variable over, because
  the settings value replaces the shell's. The settings file is found through `effortTarget` and re-read before the
  write; the write is refused when the file or the path it resolves to changed (the `changedUnderUs` rule `:458`),
  and a dangling chain of links is a retry, not a "fix by hand".
- **No `settings.json`**: on a normal machine the guard step creates it earlier in the same start. Where it is still
  missing (`SUBAGENT_MODEL_GUARD=off`, the guard's marker), the mod step creates it holding only
  `{ "env": { "CLAUDE_CODE_PLUGIN_DIRS": "<target>" } }` through the same atomic writer — the owner's goal is every
  session, and an absent file would leave the mod copied and never loaded.
- **Lines**: `SPEAKING` gains `edited` and `registered`. Every refusal and every registration line is said once per
  state (`agent-models.reported.json`, overwritten), so a stale submodule working tree after a `git checkout` without
  `git submodule update` gives one line naming `git submodule update`, not one at every start.
- **Part A's install** has a record that vouches for 1.3.3, so the answer there is `none`, silent (a test pins it).
- **Both installers write `~/.claude/mods/agent-models`.** On a machine with both, the higher version wins and neither
  downgrades. From this port on, versions released here are this repository's; the boundary note on the source side is
  a question for the owner (it is a change in another owner's repository).

Not ported: the original installer's fourth step that pins `forceLoginMethod` — not part of the ask.

### C. Consumers

`settings/settings.json` does not change. Each consumer's ONE pin-bump commit moves the submodule pin AND copies the
changed `ensure-user-guard.mjs`, `lib/user-guard-install.mjs` and the four new `lib/agent-models-*.mjs` into
`.claude/hooks/`, so the hook's `RELEASED_MOD` and the submodule's mod come from the same release. `adapter-check`
turns red until the copies are there.

## Growth

`~/.claude/mods/agent-models/` measured 1 012 KB on 2026-11-11: the 7 files (about 60 KB) plus what the host writes on
load (`.claude-plugin/types/`, about 900 KB, and a `tsconfig.json`). The record and the reported file are under 1 KB
each and overwritten. At most one `replaced-` folder (about 1 MB) stays: the swap removes the older one. `staging-` and
`aside-` leftovers of an interrupted swap are removed at the next start once 10 minutes old (`LEFTOVER_MIN_AGE_MS`).
`settings.json` gains one path, once; its backups `settings.json.bak-subagent-model-*` gain one per real write,
`backupOnce` refusing a duplicate. Bounded: about 2.1 MB at most, plus one backup per registration.

## Build order

1. Export the helpers and `effortTarget` from `user-guard-install.mjs` (no behaviour change; the suite stays green).
2. `mods/agent-models/`, the `.gitattributes` rule, the pin table and its pin test; `RELEASED_MOD` RED first, then
   green.
3. The four installer modules ported with the pointer rewrites; their ported tests green.
4. The step in `ensure-user-guard.mjs`: source path, reference skip on the project, other skips, released check,
   registration rules, missing `settings.json`, said-once lines; new tests RED first.
5. Research docs and this plan's Definition of Done.
6. PR, the coai code gate, own Opus review, merge.
7. Release: count open consumer PRs and in-flight consumer releases, ask the owner, promote `release`.
8. One pin-bump commit per consumer (Design C); observe one install on a real WSL session.

## Test plan

Each source test file is ported, rewritten or dropped:

| Source file | Here |
|---|---|
| `agent-models-decide.test.mjs` | ported |
| `agent-models-extract.test.mjs` | ported |
| `agent-models-install.test.mjs` | rewritten where it asserts `existingSettingsFile` (`:527`) or the mount (`:536`) |
| `agent-models-pin.test.mjs` | ported, plus the `RELEASED_MOD` = newest row case |
| `agent-models-refusals.test.mjs` | ported |
| `agent-models-report.test.mjs` | ported |
| `agent-models-step.test.mjs` | rewritten: its `consumer-mount` and `login-method-fixtures` imports and `LOGIN_LINE` cases go; the reference cases (`:207`, `:217`) become this layout's |
| `agent-models-swap.test.mjs` | ported |

New cases: the source found at `.agents/conventions/mods/agent-models` of a consumer-shaped project and installed;
this repository's own layout skips; a consumer whose `.agents/conventions` has the full layout is NOT skipped; `win32`
skips and writes nothing; `AGENT_MODELS_MOD=off` and the marker skip; one file or the version differing from
`RELEASED_MOD` is refused, nothing copied, said once; a project without the submodule is silent; Part A's record gives
`none`; the guard and effort steps still run when the mod step throws; no `settings.json` → created with only the
registration; a chain of links is registered at its last target; a dangling chain is a retry; a link re-pointed
between read and write is refused; `edited` and `registered` print; the reported file never grows. By hand:
`claude plugin validate` and `claude plugin test mods/agent-models`; after the rollout a new WSL session in a consumer
shows the band.

## Definition of Done

- [ ] `mods/agent-models/` holds mod 1.3.3 and its tests; the company scan re-run on the branch finds nothing.
- [ ] The step installs, upgrades, registers and skips as Design B says, and refuses a mod that is not released.
- [ ] `RELEASED_MOD` equals the newest pin row, and that row equals the files at HEAD (both tests green).
- [ ] The reported file stays one file, overwritten (a test).
- [ ] `npm test` and `npm run check` green; `claude plugin validate` and `claude plugin test` pass on the branch.
- [ ] The research docs describe the step and the mod as built, with the CI and Sonar gaps.
- [ ] Released, every consumer pins it with the hooks copied in the same commit, one real install observed on WSL.
- [ ] This plan promoted with its deviations.
