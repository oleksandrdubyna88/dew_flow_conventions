# PLAN — the `agent-models` mod ships with the shared rules and the session self-install turns it on

> Status: **IMPLEMENTED, 2026-11-12.** E1 and E2 merged in #160 (`d23a2ea`), `release` promoted to it, all nine
> consumers bumped and merged; a fresh-HOME check in a consumer installed, then stayed silent. What shipped differently:
> § *Shipped, observed, deviations*; what was left on purpose: § *Follow-ups*. Scope: a
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
  - the mod: 7 shipped files, 11 test files (8 `*.test.tsx`, 3 fixtures), `tsconfig.json`, `.gitignore`;
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

The 7 shipped files byte-identical to 1.3.3, its 11 test files, `tsconfig.json` and `.gitignore`. `.gitattributes` gains
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
  most one `agent-models.replaced-<stamp>` folder, never downgrade — also when two sessions start at once: the source's
  swap moves the target aside without looking again (`agent-models-swap.mjs:262-268`, the cadence consultation of
  2026-11-11), so a newer copy another start placed meanwhile would be replaced; here the swap reads the version it
  moved aside and, when it is newer than its own, puts it back and drops its staging — keep a copy whose bytes its record does not vouch
  for, write the record, then register.
- **Registration**: `env.CLAUDE_CODE_PLUGIN_DIRS` is a string of paths joined by `path.delimiter` (`:` on Linux and
  macOS). The target is appended once; an entry equal to it after `normalise` and `~/` expansion means nothing to do;
  empty entries and duplicates of the carried value are dropped; a non-string value or a non-object `env` is refused
  with nothing written. The first registration into an empty value carries the session's own variable over, because
  the settings value replaces the shell's. The settings file is found through `effortTarget` and re-read before the
  write; the write is refused when the file or the path it resolves to changed (the `changedUnderUs` rule `:458`),
  and a dangling chain of links is a retry, not a "fix by hand".
- **No `settings.json`**: on a normal machine the guard step creates it earlier in the same start. Where it is still
  missing (`SUBAGENT_MODEL_GUARD=off`, the guard's marker), the mod step creates it holding only `env` with
  `CLAUDE_CODE_PLUGIN_DIRS`, decided exactly as for an existing file with an empty value — the session's own entries
  first, then the target — through the same atomic writer. The owner's goal is every session, and an absent file would
  leave the mod copied and never loaded.
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

## Shipped, observed, deviations (2026-11-11/12)

**Shipped.** E1 and E2 in one pull request, #160, squash-merged as `d23a2ea` after two coai code rounds per epic
(all `proceed`), an Opus review per epic, CodeRabbit (7 comments: 3 fixed, 4 answered and accepted by it) and
SonarCloud (one S2871 fixed). `release` moved to `d23a2ea` by the `promote-release` workflow (run 43092527240, its
`ci` green on that sha). The feature review (coai, 3 epics) ran from the merged `main`: 2 of 3 reviewers answered
with 0 findings, the third (vibe 3.0.2) failed twice with its own error `Agent 'plan' not found`, so the gate stopped
at `call_human`; the owner switched vibe off and pressed *Proceed despite the findings* on the card.

**E3, the consumers** (one pin-bump PR each: the gitlink plus the six hook copies, 7 files, +1170/−44; the owner
allowed the PR cap to be passed for this release):

| Consumer | PR | Merge |
|---|---|---|
| dew_flow_benchmark | #201 | `7d79502` |
| dew_flow_mcp | #74 | `21553ce` |
| dew_flow_rag_qln | #103 | `8908ec2` — also moved its code pins mcp `7e83ba1..21553ce` and benchmark `babbd1b..7d79502`, each range only that repository's rules bump (pull-requests rule 9) |
| dew_flow_vscode_kit | #33 | `3151731` |
| wsl_care | #197 | `0e6f3d8` |
| dew_flow_amd_r9700_tuning_ai | #34 | `fd0723a` |
| dew_flow_connect_other_ais | #983 | `80dbe56` (CodeRabbit "Review limit reached": merged on the other checks, said in the PR) |
| dew_flow_sidecar_rust | #79 | `7522be5` |
| dew_flow_creds_for_devs | #356 | `9ffe978` (4 CodeRabbit threads on the copied hooks, answered as recorded limits, resolved with the owner's word) |

A GitHub incident that day left check suites queued that could not be cancelled; mcp #74 and creds #356 got an empty
commit for a fresh head, never an admin merge.

**Observed.** In a fresh worktree of `dew_flow_vscode_kit` main (`3151731`, submodule at `d23a2ea`) with a fresh
temporary HOME, three session starts of `.claude/hooks/ensure-user-guard.mjs`: the first installed the guard, set
effort to high, installed mod 1.3.3 and registered it (carrying the session's own `CLAUDE_CODE_PLUGIN_DIRS` entry
over); the second and third printed nothing and changed nothing; `claude plugin validate` passed on the installed
copy. **Not met as E3's done-when words it:** a second session with that temporary HOME was not started, so the
band loading from a fresh install was not observed (it needs an interactive session signed in under that HOME). What
was observed instead: the band in the owner's own new WSL sessions, loaded from Part A's install of the same 1.3.3
bytes and the same registration shape; a resumed session there showed `account ?` (the mod's account read has no
ceiling — first item for the next mod version).

**What the plan said, and what shipped (deviations).**
- The reference skip is decided on the project's own hook path, never on the mod's (the source tested the mod's root,
  which would have skipped every consumer).
- `effortTarget` is reused under its own name; the parent's claim that a hardened road was taken was corrected before
  approval. The settings write became ONE extracted road, `commitSettings`, for the guard's three operations at its
  defaults (the guard's behaviour unchanged, its three test files byte-unchanged) and the mod's registration with
  `replace: false`; the effort write stays outside it.
- A filesystem without hard links is a by-hand refusal for the mod's creation (the first spec fell back to a look then a
  rename, which reopened the gap).
- The mod's modules load by `await import` inside the step (a static import let a broken mod module kill the guard step).
- A start that ends with no refusal forgets the said-once record, so a refusal whose state comes back is said again;
  the said-once key normalises staging-, aside- and replaced- folder names.
- The swap puts the moved folder back when it is newer, or when its version was readable at the decision and is not
  now; a target with an unreadable plugin.json is never treated as engine junk.
- The E1 stories' test count was 28 in decide, not 27; the mod has 11 test files, not 10.
- `lstatOrNull` and `sha256` were exported from the guard installer instead of being moved, so no second body exists.
- Checked and not built: a third coai round for E1's round-2 fixes (the stage allows two; the fixes were verified by
  the caller instead).

## Follow-ups (not built here; each needs its own plan)

- **The next mod version (1.4.0):** the owner's request (2026-11-11) for the time until the 5-hour limit resets,
  `5h 2% left · resets in 1h 23m · week 42% left · Fable 55% left`, the time green under 10 minutes, orange from 10 to
  30, red over 30; a ceiling on the account read; no double submit of a task after a refused state write; a cap on the
  session-log prompts the messages viewer reads; the limits line after an A→B→A account switch; the viewer actions'
  refused state writes.
- **The step and the swap:** an unchanged refusal stays silent on consecutive starts; after a put-back that itself
  fails a later start can install the older copy; `keep` is decided on the first read; `reconcile` can treat an aside
  whose plugin.json cannot be read as a stale leftover; `CLAUDE_CODE_PLUGIN_DIRS` is written to `~/.claude` through
  `os.homedir()`, not `CLAUDE_CONFIG_DIR` (as the guard).
- **The guard** (listed in the E2 stories): its creation can replace a file that appeared after its re-check; a
  created settings.json takes the umask; the effort write re-reads bytes only; no writable check; backup before re-check.
- **Windows (native, not WSL)** — parked by the owner on 2026-11-12: the step skips `win32` and the mod says Windows is
  not tested. Two facts found that day on the owner's machine: Node.js is not installed on Windows (only `claude.exe`),
  so no session-start hook of a dew_flow project runs there and the mod's own `node` read cannot run; and Claude on
  Windows had been opened only in the home folder and the VS Code folder, never in a dew_flow project, where the
  self-install runs. A start needs Node.js on Windows first, then its own plan: the skip removed, the mod and the
  installer tested on Windows, a Windows CI job.
- **Elsewhere:** the coai vibe reviewer fails with Vibe 3.0.2 (`Agent 'plan' not found`); the coai server lost the
  record of one cadence consultation (its close was refused).

## Epics

Three epics; cornerstone quota ⌈2·3/5⌉ = 2. Split by Fable on 2026-11-11 (entry 1.1), after the question consultants
were asked what is important: 2 of 2 answered, both said three epics and the same two cornerstone areas, and the caller
checked their reasons against the code. Each epic's stories are `research/PLAN_agent_models_mod_E<n>.md` (in `todo/` until the promotion), written by Opus
when the epic starts, with its `todo/README.md` row in the same commit and no `## Plan changes` of its own. The ledger
line at the end names the two areas; k stays 0 until a stories document marks its story.

E1 and E2 are code on this branch and share the one pull request of build-order step 6, each with its own code round.
Every commit that changes `settings/hooks/**` also updates this repository's own `.claude/hooks/**` copies, as #158
did: the session start of this repository imports them. One correction to the consultants: they named `effortTarget`
with a re-check of bytes and target as one road; the code has two roads (E2's cornerstone area says which to take).

### E1 — The release payload and its identity

- **Goal.** This repository holds mod 1.3.3 byte for byte, and can tell from bytes alone whether a mod folder is the
  released one. Nothing runs at session start yet.
- **Scope.** Build-order steps 1 and 2, and the half of step 3 that only reads and decides. Files: the exports in
  `settings/hooks/lib/user-guard-install.mjs`; `mods/agent-models/**`; the `.gitattributes` rule;
  `tools/agent-models-pins.json`, `tools/lib/agent-models-pin.mjs`, `tools/lib/agent-models-fixtures.mjs`;
  `settings/hooks/lib/agent-models-decide.mjs` (`MOD_FILES`, `RELEASED_MOD`) and `agent-models-read.mjs`
  (`readSource`) with their pointer rewrites; the ported tests that import only these, the pin test with its new cases
  among them. No module of this epic writes to the user's home. In the source, `agent-models-read.mjs:13` imports
  `lstatOrNull` from `agent-models-swap.mjs` (`:20`); here the existing private `lstatOrNull` of
  `user-guard-install.mjs` is exported and re-exported by `agent-models-read.mjs`, and the swap module imports it from
  there, so E1 imports nothing of E2. The stories: [PLAN_agent_models_mod_E1.md](PLAN_agent_models_mod_E1.md).
- **Depends on.** Nothing in this plan. Its inputs are the source port and the scan of 2026-11-11.
- **Done when.** `RELEASED_MOD` was watched RED, then equals the newest pin row, and that row equals the files at HEAD.
  A source that differs in one file or in the version gives a refusal that names the first file. Step 1 changed no
  behaviour and the suite is green. The company scan re-run on the branch finds nothing. `claude plugin validate` and
  `claude plugin test mods/agent-models` pass by hand. The code round and the Opus review are resolved.
- **Cornerstone area — the released-copy check.** This is the trust boundary: only reviewed bytes may become code that
  runs in every session on the machine. The area is the identity (`MOD_FILES`, `RELEASED_MOD`, the pin row, raw sha256
  under `eol=lf`), the one read of the source, and the refusal. Its spec settles what the read does with an extra
  file, a missing file and a symlink in the source. It also fixes what E2 must keep: the copy writes only the bytes
  that passed the check, never a second read.

### E2 — The complete self-install

- **Goal.** A session that starts in a consumer copies the released mod to `~/.claude/mods/agent-models`, registers it
  in the user settings and says each thing once. Or it skips or refuses, and leaves nothing half-written.
- **Scope.** The writing half of build-order step 3 (`agent-models-swap.mjs`, `agent-models-install.mjs`, their ported
  tests), then steps 4, 5 and 6. Files: those two modules; `settings/hooks/ensure-user-guard.mjs`
  (`ensureAgentModelsMod`, `SPEAKING`); the rewritten `install` and `step` tests and the new cases of the test plan,
  run in a consumer-shaped project; `research/module_rules.md` and `research/module_tests.md`. The stories:
  [PLAN_agent_models_mod_E2.md](PLAN_agent_models_mod_E2.md).
- **Depends on.** E1: the exports, `RELEASED_MOD`, `readSource`, the check, and its rule for the copy.
- **Done when.** Every new case of the test plan was watched RED, then green. The step installs, upgrades, registers,
  skips and refuses as Design B says, and the reported file stays one file. The guard and effort steps still run when
  the mod step throws. `npm test` and `npm run check` are green. The research docs describe the step as built, with
  the CI and Sonar gaps. The pull request of step 6 is merged after the code round and the Opus review.
- **Cornerstone area — the settings-file write.** `~/.claude/settings.json` is the user's own state for every project,
  and it can hold tokens. The area is the registration as ONE operation: read, find the real target, apply the
  `CLAUDE_CODE_PLUGIN_DIRS` value rule, back up, check again, write atomically with the mode kept, and create a
  missing file. This file has two write roads today. The guard's road checks the bytes AND the resolved target again
  (`changedUnderUs`, the test at `tools/install-user-hook.test.mjs:552`); the effort road reads the bytes again only.
  The registration takes the guard's checks. It must not become a third assembly of the parts that drops one.
- **Tests, not cornerstones.** The reference skip decided on the project, and the swap with its recovery. A mistake
  there fails more narrowly: one skipped or repeated install, one folder. Both consultants said so; the split agrees.

### E3 — Release and rollout

- **Goal.** Every consumer pins the release and carries its hooks, and one real WSL session shows the band.
- **Scope.** Build-order steps 7 and 8; no code in this repository. First the feature review that a plan of three
  epics owes before its release, from `main` after E2's merge. Then count the open consumer pull requests and
  in-flight releases, ask the owner, and promote `release`. Then one pin-bump commit per consumer of README
  § *Consumers*: the submodule pin and the six hook files of Design C together, with `adapter-check` green.
- **Depends on.** E2 merged to `main`, and the owner's answer at step 7.
- **Done when.** Every consumer's pin-bump is merged with its checks present and green. In one consumer on WSL, with
  a fresh temporary HOME (the owner's own home already holds Part A, so it cannot show an install): the first session
  start installs and registers, the second loads the band, a third leaves `settings.json` unchanged — each recorded
  with its date. The owner's own sessions show the band. The plan is promoted with its deviations.
- **Cornerstone areas.** None.

Cornerstones: 2 of 2 — E1.S3 the released-copy check (E1), E2.S2 the settings-file write (E2)
