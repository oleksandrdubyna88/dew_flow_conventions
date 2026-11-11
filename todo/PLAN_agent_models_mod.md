# PLAN — the `agent-models` mod ships with the shared rules and the session self-install turns it on

> Status: **plan only, nothing implemented yet, 2026-11-11.** Scope: a new `mods/agent-models/` folder (a Claude Code
> mod, version 1.3.3, ported from the owner's own earlier work), one new step in `settings/hooks/ensure-user-guard.mjs`
> with four installer modules under `settings/hooks/lib/`, nine helpers and the settings target exported from
> `settings/hooks/lib/user-guard-install.mjs`, their tests, `research/module_rules.md`, `research/module_tests.md`, and
> the release to the consumers.

## Goal (the owner's words, 2026-11-11)

1. "Copy the mods into the conventions, and whatever else is needed, so that every dew_flow project installs and runs
   the mod automatically."
2. "I want every session on WSL to get this mod automatically."
3. "Clean out everything related to the company, if there is any. The mod does nothing secret; it only adds four
   buttons."

The mod draws one band above the prompt: a row per running subagent with its model, the signed-in account (a press
opens its usage limits), a `[ login ]` button, a `[ messages ]` viewer of the person's own prompts in this session,
and a `[ tasks (n) ]` list of notes. It is a hooks module (`hooks/hooks.json` → `register.tsx`); it holds no secret.

This repository is public. The owner was told so on 2026-11-11 and chose to publish the mod here. The mod's earlier
plan documents are NOT copied (they name machines outside this family); only the mod, its installer and their tests.

## What exists today

- **Part A, done by hand on 2026-11-11** (not a deliverable of this plan, recorded because the new step meets it):
  mod 1.3.3 was installed on the owner's WSL by the original installer — `~/.claude/mods/agent-models/` (7 files),
  its record `~/.claude/mods/agent-models.installed.json`, and `env.CLAUDE_CODE_PLUGIN_DIRS` =
  `/home/jinx/.claude/mods/agent-models` in `~/.claude/settings.json`; `claude plugin validate` passed. Every new
  session on that WSL loads the mod already. This plan makes it automatic everywhere a dew_flow session starts, and
  keeps it upgraded.
- **The source port**: mod 1.3.3 (7 shipped files, 10 test files, `tsconfig.json`, `.gitignore`) and its installer
  (`agent-models-decide.mjs` 218 lines, `agent-models-read.mjs` 120, `agent-models-swap.mjs` 334,
  `agent-models-install.mjs` 221) with 8 Node test files and a fixture module. A scan on 2026-11-11 for company
  names, hosts, VM names and e-mail addresses found none: test addresses are `@example.com` only, and the only URL is
  `https://api.anthropic.com/api/oauth/usage` (`hooks/limits.tsx:13`). Two K-specific comments are rewritten: a
  pointer to a plan file that is not copied (`agent-models-install.mjs:13`), and the other layout's mount path
  `.claude/rules/shared` (`agent-models-decide.mjs:7`, `agent-models-install.mjs:10`).
- **The self-install here**: `settings/hooks/ensure-user-guard.mjs:186` `main()` reads the project from
  `CLAUDE_PROJECT_DIR` or the payload `cwd`, and `:195` runs two steps, `ensureUserGuard` and `ensureEffort`;
  `:51` `isReferenceRepository` skips this repository's own layout; `:185` `SPEAKING` decides which outcomes print.
  Consumers carry the hook as a verbatim copy in `.claude/hooks/` (`tools/adapter-check.mjs:44`
  `referenceHookFiles` derives the list from `settings/hooks/**/*.mjs`, tests excluded, so new lib files are
  demanded in every consumer without editing the check).
- **The released-copy check** (#158): `settings/hooks/lib/user-guard-install.mjs:37` `RELEASED_GUARD` is the
  version and the CRLF-folded sha256 of the guard; `:49` `releasedTextRefusal` refuses any other copy.
- **Helpers the ported modules import** from `user-guard-install.mjs`: `isObject`, `normalise`, `readOrNull`,
  `sameBytes`, `parseSettings`, `serialise`, `writeAtomic`, `writableReason`, `backupOnce` and
  `existingSettingsFile`. The first nine exist here as private functions (`:73`, `:80`, `:174`, `:186`, `:188`,
  `:191`, `:216`, `:432`, `:565`) and are exported, not copied (reuse-first, move 1). `existingSettingsFile` does
  NOT come across: the original is a bare `realpathSync`, while every `settings.json` write here goes through
  `settingsFileOf` (`:472`, a chain of up to 40 links, the last target found before any write, a loop refused —
  #149, #155) and `effortTarget` (`:560`). The mod's registration takes that same road, exported as one function, so
  the hardened write is not applied at only some of its sites.

## Design

### A. The mod — `mods/agent-models/`

The 7 shipped files byte-identical to 1.3.3 (`plugin.json`, `hooks/hooks.json`, `hooks/register.tsx`,
`hooks/prompts.ts`, `hooks/tasks.tsx`, `hooks/limits.tsx`, `types/index.d.ts`), its tests, `tsconfig.json` and
`.gitignore`. One comment line in `hooks/prompts.ts:4` already names `settings/hooks/lib/agent-models-decide.mjs`,
which is the path here too. No `.md` inside: the rule loader reads metadata from rule folders only, and a mod README
would add nothing the band does not show. `claude plugin validate` and `claude plugin test mods/agent-models` are
run by hand (they need the `claude` CLI; CI does not have it).

### B. The install step

A third step, `ensureAgentModelsMod`, in `ensure-user-guard.mjs`, after the guard and effort, each step still
isolated by `guardStep`:

- **Source**: `<project>/.agents/conventions/mods/agent-models`, the pinned submodule of the consumer (the hook copy
  in `.claude/hooks/` has no mod beside it). A missing folder (submodule not initialised) is a silent skip.
- **Skips**: `AGENT_MODELS_MOD=off`, the marker `~/.claude/mods/agent-models.optout`, this repository's own layout
  (`isReferenceRepository` on the project root), and `process.platform === 'win32'` (the owner asked for WSL; the mod
  says Windows is not tested, `hooks/prompts.ts:447`). `SUBAGENT_MODEL_GUARD=off` does NOT skip it.
- **Released copy only**: `RELEASED_MOD` in `agent-models-decide.mjs` — the version and the CRLF-folded sha256 of
  each of the 7 files of this commit. A source whose version or any digest differs is refused with one line naming
  the first file that differs, nothing copied. A test fails when `RELEASED_MOD` does not match `mods/agent-models`,
  so no release ships a stale pair. Same reason as #158: `~/.claude/mods` is loaded by every session on the
  machine.
- **Copy and register** (the ported core, unchanged in behaviour): install when missing, upgrade an older version by
  a rename swap keeping at most one `agent-models.replaced-<stamp>` folder, never downgrade, keep a copy whose bytes
  its record does not vouch for, write the record `agent-models.installed.json`, then add the folder to
  `env.CLAUDE_CODE_PLUGIN_DIRS` in an EXISTING `~/.claude/settings.json` (never creating it; the first registration
  carries the session's own `CLAUDE_CODE_PLUGIN_DIRS` entries over). A line is said once per state
  (`agent-models.reported.json`). Loads from the next session.
- **The existing manual install** of Part A has a record that vouches for 1.3.3, so the step's answer there is
  `none`, silent (a test pins it).

Not ported: the original installer's fourth step that pins `forceLoginMethod` — not part of the ask.

### C. Consumers

`settings/settings.json` does not change (the SessionStart hook already runs `ensure-user-guard.mjs`). Each consumer's
pin bump also copies the changed `ensure-user-guard.mjs`, `lib/user-guard-install.mjs` and the four new
`lib/agent-models-*.mjs` verbatim into `.claude/hooks/`; `adapter-check` turns red until it does.

## Growth

`~/.claude/mods/` holds the mod (about 60 KB), one record, one reported file (overwritten, never grows), at most one
`replaced-` folder (the swap removes the older one), and `staging-`/`aside-` leftovers of an interrupted swap, which
the next start removes once they are 10 minutes old (`LEFTOVER_MIN_AGE_MS`). `settings.json` gains one path, once.
Bounded: about 130 KB at most.

## Build order

1. Export the nine helpers and the settings target from `user-guard-install.mjs` (no behaviour change; the existing
   52 test files stay green).
2. `mods/agent-models/` copied; `RELEASED_MOD` and its pin test written RED first, then green.
3. The four installer modules ported, with the comment rewrites; their ported tests green.
4. The step in `ensure-user-guard.mjs`: source path, skips, released check; new tests RED first.
5. `research/module_rules.md`, `research/module_tests.md`, `research/architecture.md` if the module map changes;
   this plan's Definition of Done.
6. PR, the coai code gate, own Opus review, merge.
7. Release: count open consumer PRs and in-flight consumer releases, ask the owner, promote `release`.
8. Pin bumps with the hook copies in the consumers; observe one install on a real session.

## Test plan

- The ported Node tests (decide, read, swap, install, report, refusals, step, extract), with temp homes only.
- New: the source is found at `.agents/conventions/mods/agent-models` of a consumer-shaped project; this
  repository's layout skips; `win32` skips; `AGENT_MODELS_MOD=off` and the marker skip; a mod differing from
  `RELEASED_MOD` in one file or in the version is refused and nothing is copied; a project without the submodule is
  silent; a home with Part A's record at 1.3.3 gives `none`; the guard and effort steps still run when the mod step
  throws; a `settings.json` that is a chain of links is registered at its last target, and a link loop is refused
  with nothing written (the same cases the effort write has).
- The pin test: `RELEASED_MOD` equals the digests of `mods/agent-models` at HEAD.
- By hand: `claude plugin validate mods/agent-models`, `claude plugin test mods/agent-models`; after the rollout, a new
  session in a consumer on WSL shows the band, and the session-start line says installed or nothing.

## Definition of Done

- [ ] `mods/agent-models/` holds mod 1.3.3 and its tests; no company name, host or address in any added file
      (the scan re-run on the branch).
- [ ] The step installs, upgrades, registers and skips as Design B says, and refuses a mod that is not released.
- [ ] `npm test` and `npm run check` green; `claude plugin validate` and `claude plugin test` pass on the branch.
- [ ] The research docs describe the step and the mod as built.
- [ ] Released, every consumer pins it with the hooks copied, and one real install observed on WSL.
- [ ] This plan promoted with its deviations.
