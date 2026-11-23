# Shared rules resolver

`tools/rules.mjs check|explain|read --repo PATH --task NAME --file ROOT_RELATIVE_PATH`
discovers the target Git root, checks the instruction adapters and submodule, validates
metadata, selects rules and optionally returns their canonical text. Tasks/files repeat.
`--only ID` bounds one read without changing the selected scope.
The executable is a small error boundary; `tools/lib/rule-cli.mjs` owns the CLI protocol.
Missing npm dependencies fail with the locked installation command rather than an unhandled
module-load stack trace. PROJECT's optional `requires` metadata names mandatory root-relative
documents, checked for existence and included in the source manifest.

`tools/lib/rule-catalog.mjs` owns task vocabulary, YAML validation, glob matching,
dependency expansion, source hashes and payload budgets. It uses `yaml` (ISC) and
`picomatch` (MIT), exact versions in `package-lock.json`, installed with lifecycle scripts
disabled. These capabilities were absent from the existing tools; a second custom YAML
parser or glob engine was avoided. Existing lexical path validation is reused from
`tools/lib/paths.mjs`, supplemented with real-path checks for instruction sources.

Metadata keys: `id`, `load`, optional `paths`, `tasks`, `depends`, `path_tasks`. Unknown
fields/tasks, duplicate ids/keys, empty bodies, missing dependencies and cycles are errors
even in unselected rules. `path_tasks` has five errors of its own: it is refused on a
`load: always` rule (`applies to a conditional rule only`), when empty (`must name at least one
task`), when it repeats a task (`path_tasks must not repeat a task`), when it names a task outside the
vocabulary (the legal ones are listed), and when the rule has no `paths` (`path_tasks needs paths`). All Markdown in the four rule directories must declare metadata.
Local rules use the same schema and `local.*` ids. The migration inventory records every
original rule section and body hash; it is historical evidence, not a second selector.

Limits: 2 KiB metadata per file, 256 KiB per source, 256 sources / 4 MiB catalog,
16 KiB always core (including its dependency closure only), 256 KiB manifest,
32 KiB canonical text per read, 64 tasks and 256 file arguments per scope. Overflow fails
explicitly. The resolver does not persist artifacts and therefore has no retention job.

Consumer SHA verification compares the actual checkout to the index gitlink and reports
the HEAD pin separately. A staged migration is named as staged, not as committed. A dirty
mounted source fails; source-repository development is explicitly labelled working-tree mode.
Global/managed instruction policy is not visible to this process. `resolved` means source
selection succeeded, not that an agent read or complied with it.

Equivalent dot segments and repeated separators are normalized before glob matching;
parent traversal remains rejected. Scoped override detection has a separate ancestry walk.
Integration tests can inject an installed source root through the internal module API;
the executable accepts no root override. This lets coverage observe the real CLI protocol
without changing the resolver's pinned-submodule contract.

Sonar S4036 is treated as a false positive for this developer CLI's constant `git` executable:
the operator owns PATH and the process runs with the same identity, without privilege transfer.
Task and repository inputs are passed only as arguments. The scoped analyzer exclusion and
its rationale live in `sonar-project.properties`; it does not cover arbitrary process calls.

The S1 review found a root-target loop: `--file .` started ancestry at the parent and
never reached the repository again. Directory-like targets now fail validation and ancestry
also has a filesystem-root guard. The CLI regression was observed timing out before the fix.

## The subagent-model rule and the guard that enforces it (2026-10-13)

`common/subagent-models.md` (10 440 B) maps a subagent's role to a model alias: scouts and coders `sonnet`, judges
`opus`, the epic split, security judgements and cornerstone specs `fable`. Its `tasks` name fourteen tasks and
deliberately omit `inspect`, `ui`, `gpu` and `storage`, whose single-read scopes it would push past 32 768 B;
`tools/rules.test.mjs` enumerates `TASKS` and pins both halves of that split, so a new task must be placed by a person.
`common/planning-docs.md` carries the epics-and-stories layout the rule's pipeline refers to.

Where the rule is not loaded, the guard carries it. `settings/hooks/subagent-model.mjs` is a `PreToolUse` hook on
`Agent|Task`: a launch whose `model` is exactly `sonnet`, `opus` or `fable` gets a one-line role digest as
`additionalContext` and no permission decision; anything else in a well-formed call is denied with a fixed reason that
opens with `subagent-models.md:` and carries the table, and the guard does not judge `effort` (measured 2026-10-14: hooks never see the Agent tool's per-launch `effort`; the child's effort comes from the settings); a malformed payload, a throw or a stalled stdin fails open.
`SUBAGENT_MODEL_GUARD=off` silences it for harnesses that measure models. Its `ROLE_DIGEST` is its only copy of the
table, compared with the rule's own table by `tools/lib/role-table.mjs` in the test suite.

The guard reaches a session three ways: `settings/settings.json` wires it for consumers (`adapter-check` demands the
copy), this repository hosts it on itself in `.claude/`, and `tools/install-user-hook.mjs` (`--install`, `--uninstall`,
`--check`, `--force`) puts it into `~/.claude` through `settings/hooks/lib/user-guard-install.mjs` — refusal on
unparsable or concurrently changed settings, a backup, an atomic write, one handler upgraded in place. A second
`SessionStart` hook, `settings/hooks/ensure-user-guard.mjs` (5 s timeout), runs that core at session start when the
user copy is missing, older by `GUARD_VERSION`, or badly registered; it never downgrades, never runs from this
repository's own layout, refuses a project copy with uncommitted changes or one git cannot judge (no git on PATH,
a timeout — only "not a git repository" means nothing to compare), refuses to replace an installed copy changed since
its install (its bytes match neither the manifest's `sha256`, its `previous` — the bytes that install replaced — nor
the source; `--force` replaces it), writes the manifest, then the hook, then the registration, so a failed copy never
leaves `settings.json` naming a missing file and a stop between the writes is completed at the next start
(all three from the coai code gate on dew_flow_creds_for_devs #328, 2026-11-10). Since 2026-11-11 (the owner's go) it
copies only the RELEASED guard: `RELEASED_GUARD` in the core is the `GUARD_VERSION` and the sha256 (CRLF folded to
LF) of this commit's `settings/hooks/subagent-model.mjs`, and a project copy whose digest or version differs — edited
and committed in some repository, say — is refused with one line, because the guard in `~/.claude` runs for every
repository on the machine. A test fails when the pair does not match the file, so no release ships a stale one.
`tools/install-user-hook.mjs --install` makes the same check and asks for `--unreleased` to install anything else.
This keeps an unreviewed guard inside its repository; it is no sandbox (hostile hooks already run in their own
sessions). `load-instructions.mjs` bounds its
resolver call at 30 s (`RESOLVER_TIMEOUT_MS`; the host's own default for a command hook is 600 s) and then gives the
INCOMPLETE notice naming the bound. `build-flags.mjs` suggests the command with `-m:4` directly after the build verb (after any leading assignments,
quoted or not), and splits a wrapper's inner command line into its chain like the outer one. Every write of
`settings.json` (install, repair, uninstall, effort) follows a symlink and keeps the file's mode, its backup too. The
write target is found before anything is written: the real file, or the last target of a chain of links that ends in a
missing file (up to 40 links); a link loop is refused. `ensure-user-guard.mjs`, at EVERY start, converges an existing `~/.claude/settings.json` so `effortLevel` and every
`modelSettings.*.effortLevel` (`sonnet`, `opus`, `fable` and any other key) are `high` — backup and atomic write, silent
when already converged, skipped under `SUBAGENT_MODEL_GUARD=off` and in this repository (the `subagent-model.optout` marker does NOT skip it: high everywhere), never creating the file, following a symlink and keeping the file mode, refusing (one warning line, nothing written) a read-only file, an unwritable target, or a non-object `modelSettings` / per-model value
(`applyEffort`; `install-user-hook.mjs --check` reports it without gating the exit code). Design
record: [PLAN_subagent_model_tiers.md](PLAN_subagent_model_tiers.md); its release to the consumers is recorded in
[PLAN_subagent_model_tiers_rollout.md](PLAN_subagent_model_tiers_rollout.md).

## The marketplace step and the retirement of the old agent-models copy (2026-11-23)

The `agent-models` Claude Code mod (a band above the prompt with a row per running subagent and its model, the account and
its limits, a login button, a viewer of the person's own prompts, a list of notes, a `last answer` button and pins) does not
live in this repository. It lives in the public repository `dew_flow_mods`, a Claude Code plugin marketplace named
`dew-flow-mods`, and Claude Code itself installs it and keeps it up to date. This repository ships only the session step
that asks for that: it registers the marketplace and the plugin in the person's `~/.claude/settings.json`, and retires the
copy that the earlier installer had put in `~/.claude/mods`. The design record is `todo/PLAN_dew_flow_mods.md` and its
epic documents; the engine facts it rests on are in [dew_flow_mods_probe_E1.md](dew_flow_mods_probe_E1.md). The earlier
installer (the mod in this repository, its pins table and the four `agent-models-*.mjs` libs) is in the history of
[PLAN_agent_models_mod.md](PLAN_agent_models_mod.md) and its epics; a consumer pinned to a release before this one still
runs it.

The step is `ensureModsMarketplaceStep` in `settings/hooks/ensure-user-guard.mjs`, the third step of the session start after
the guard and effort, each inside `guardStep`, so a throw in one costs the others and the exit code nothing. Its code is
`settings/hooks/lib/mods-marketplace.mjs`, loaded by a dynamic `import()` when the step runs, never a static import. A lib
that does not load (a missing file, a syntax error) or throws is not swallowed: the step turns it into one refusal line
with the error's code, said at every start while it lasts (nothing can record that it was said), and the guard and effort
steps still run. The step is skipped, in this order, for `AGENT_MODELS_MOD=off` (trimmed, any case), for win32 (Windows is
parked: the mod is not tested there), and for the conventions repository itself, which is decided on the project's own
`.claude/hooks/subagent-model.mjs`, the file the guard step uses. It reads nothing from the project: a consumer's
`.agents/conventions` is not looked at. `SUBAGENT_MODEL_GUARD=off` does not skip it. The lib imports only `node:` builtins
and `./user-guard-install.mjs`, starts no child process, opens no connection and sets no timer, and reads no environment
variable of its own: the caller passes the home and the environment, and `paths` builds every path it may read, write or
delete. `SPEAKING` holds `installed`, `upgraded`, `refused`, `newer`, `repaired`, `converged`, `edited`, `registered`,
`retired`, `removed`, `updated` and `told`.

**Registration.** Only keys that are absent are written: `extraKnownMarketplaces["dew-flow-mods"]`, a git source at the
`release` ref of the `dew_flow_mods` URL with `autoUpdate: true` (`anchorEntry()`, the one builder), and
`enabledPlugins["agent-models@dew-flow-mods"]: true`. An entry equals the anchor only when its `source` has exactly the keys
`source`, `url` and `ref` with those values. A `false` plugin switch is the person's and is never turned on (silent, and no
retirement); a `dew-flow-mods` entry that differs from the anchor is left as it is and named once; an unparsable file, a file
that is not an object, or an `env`, `extraKnownMarketplaces` or `enabledPlugins` that is not an object is refused with
nothing written. A new top-level key goes last and every other member keeps its place. A missing `settings.json` is created
holding only the two keys. **At most one settings write per start:** the first of the registration, step 1 and step 2 that
applies.

**The one road.** Every write of `settings.json` ends in `commitSettings` of `settings/hooks/lib/user-guard-install.mjs`,
the road of the guard's three operations (install, repair, uninstall) and of this registration; the effort write
(`writeConverged`) is separate and a recorded follow-up. It runs the test seam, reads the bytes again and resolves the write
target again (a difference in either answers "changed while registering", written nothing, the next start tries again),
runs the backup only when a write follows, and writes atomically at the real file with the file's own mode. A missing file
is created by a hard link, which fails when the name is taken: a file another writer created meanwhile is never replaced,
and where hard links are not available nothing is created and the refusal names the code and says the filesystem cannot make
the hard link. A chain of links is written at its last target: every link stays, and the mode and the backup are those of the
real file, the backup beside it. Each of these is refused with its own line, nothing written and no backup: a dangling chain
(the next start registers once the file exists), a loop, a chain of more than 40 links, a link whose target goes through a
missing folder and then `..`, a link re-pointed between the resolve and the write, an existing file that is not writable, a
folder that is not writable (the nearest folder that exists, when `~/.claude` is not made yet), a `settings.json` that is a
folder, a link to a folder or a file that cannot be read, a creation whose write fails (said once; the next start tries again)
and a folder that takes the name in the gap (never replaced; the next start says it cannot read it). A refusal is a line to
the person and never a throw; an error nobody foresaw ends in the neutral line "the dew-flow-mods step could not run (code)".
`tools/user-guard-road.test.mjs` holds each of these cases; every branch of `blockedReason` in the lib was removed once by
hand and a case turned red.

**The proof, then the retirement.** The old copy is retired only when the engine's own record shows that the mod is
installed. The step reads, never writes, the engine's two files under the plugins root (`CLAUDE_CODE_PLUGIN_CACHE_DIR` when
it is a non-empty string, else `~/.claude/plugins`): `known_marketplaces.json` must hold the `dew-flow-mods` entry equal to
the anchor, and `installed_plugins.json` (version 2) must hold exactly one user-scope record for the plugin whose `installPath`
lies inside the plugin cache, is a real directory, and holds a `.claude-plugin/plugin.json` of that name and version and no
`.orphaned_at`. A shape the step does not know is "no proof", never a guess. The states, read from disk at every start:

1. Registered, proof not whole: nothing is touched. After three days with no install record the manual command
   (`claude plugin install agent-models@dew-flow-mods`) is said once.
2. Proof whole, `agent-models@inline` absent: **step 1.** The tombstone, a JSON file at
   `~/.claude/mods/agent-models.optout` made by an exclusive create and read back, so that a session on an older pin, which
   stops at that marker, does not install the mod again; then `enabledPlugins["agent-models@inline"] = false`, which stops the
   old copy from hiding the marketplace copy. Only after the read-back says the marker is ours. A marker that is not ours (an
   empty file, a folder, a link, other JSON) is the person's: nothing at all is written, not even the state file.
3. 24 hours after step 1: **step 2.** The old folder is judged: a real directory of the user, a record that vouches for at
   least one file, every file the record names present with its recorded sha256, only files and folders inside, at most 500
   entries, and the folder's files EQUAL the record: every entry is a named file with a matching hash or a folder that holds
   one, and no other entry is trusted, whatever its name or place (not `tsconfig.json`, not `.claude-plugin/types/**`: the
   parent's "a symlinked, foreign-owned or edited folder is left with its entry and named once"). Then the folder is
   recorded in the state file (`aside`: the name `agent-models.retired-<ms>-<pid>` and the record's hashes), renamed aside and
   deleted after it is judged once more; only after that our entry leaves `env.CLAUDE_CODE_PLUGIN_DIRS` (other entries
   verbatim and in order; the key goes when the value is empty), then its record and its reported file. When the last
   judgement refuses the aside (a file changed after the first judgement), the entry, the record and the reported file all
   stay and the aside is named once. A folder that fails the judgement is left with its entry and its record, and
   named once with the first unknown path and how to remove it by hand once the person has checked it; a link is never touched.

`INLINE_ID` set to `true` by the person, a `conflict`, an `off` switch and a proof with a reason keep the old copy as it is.
The tombstone is written on a machine with no old folder too. Interrupted runs finish at the next start: a kill after the
tombstone, after step 1's settings write, or after the folder work continues; a kill between the rename and the delete is finished by deleting the aside the
state file recorded, and only that one, after it is judged again (a real directory of the user, not a link, its files still among
the recorded ones). A recorded aside to which a file was added or in which a file was changed is not deleted and is named once, with the entry, the record and the reported file kept; any other
`agent-models.retired-*` folder is never deleted (named once). A record whose rename never happened is cleared.

**What the person is told.** The lines are the constants of `LINES` in the lib, each said once per state entered (the store
is `~/.claude/mods/dew-flow-mods.seen.json`, with `registeredAt`, `retiredAt`, `version`, the `aside` while step 2 holds one and a `said` map; an old-pin session
deletes `agent-models.reported.json` at every clean start, so that file is not used): `registered`, `retired`, `removed`,
`updated` (`agent-models updated 1.6.0 → 1.6.1 (dew_flow_mods release)`, silent at first sight), the `told` lines
(`conflict`, `autoUpdateOff`, `inline-true`, a proof reason, `left`, the three-day wait, the shell's own variable still
listing the removed folder) and the `refused` lines. A failed state write is tolerated: a line may repeat and a clock may
start again, and a lost file never hastens step 2.

**Trust.** Whatever the `release` ref of `dew_flow_mods` holds runs with the owner's permissions, outside any sandbox, in
every interactive session on every machine that registered the marketplace, about ten minutes plus one restart after it
moves. This repository keeps no hash or signature of the mod: a table here would need a conventions release for each mod
version, which the move exists to end. The control is the gate on that ref in `dew_flow_mods` (`release` moves only by its
`promote-release` workflow, from `main`, with the owner's approval in an environment; rulesets on `main`, `release` and
the version tags), and what this repository adds is visibility: the `updated` line. The owner's approval is not a second
person while every agent session holds the owner's login, and whoever controls the owner's account or an administration
token can move `release`; that residual risk is written in the plan, section B, and is not removed by this step. Rollback is
forward (revert on `main`, raise the version, promote); on one machine `claude plugin disable agent-models@dew-flow-mods`,
which the step never turns on again.

**What the step does not give.** It asks the engine to install; it never checks that the mod loaded (that is observed by
hand in a new session). `.orphaned_at` and `CLAUDE_CODE_PLUGIN_CACHE_DIR` are from the engine's documentation and were not
observed in the probe. A process of the same user can change a file between two of the step's reads: the re-read of
`commitSettings` and the exclusive tombstone are for honest concurrent sessions only, and an existing `settings.json` that
another program changes between the road's second read and its rename is replaced, as the guard's own write can be: no lock
is shared with the host. `CLAUDE_CONFIG_DIR` is not read: the step writes under `os.homedir()`, as the guard step does.

**What the consumers do.** A bump to this release deletes the four retired libs (`.claude/hooks/lib/agent-models-{decide,read,swap,install}.mjs`)
and copies `lib/mods-marketplace.mjs` with the new `ensure-user-guard.mjs`; `tools/adapter-check.mjs` names a retired lib
that is still there ("retired — delete it") and demands the new lib byte for byte. The frozen copy of the old step in
`tools/fixtures/retired-installer/` is not wired and is never copied to a consumer: it exists so a test can run the old step
against the same home as the new one, which proves that the tombstone stops an old-pin consumer.

## The plan-change-control rule and the change-ledger check (2026-10-29)

`common/plan-change-control.md` (12 274 B by `wc -c`; the catalog's `bytes` is the same number) governs a plan's life
after its first approval: one change is recorded and allowed, the second is a full stop until the whole plan has been
reviewed again. Its `tasks` are the fourteen of `subagent-models` and omit `inspect`, `ui`, `gpu` and `storage`. It has no
`paths`: selection is paths OR tasks, so a `todo/**` glob would pull it into every `inspect --file todo/…` scope.
`depends: ["common.planning-docs"]` brings `planning-docs` into `audit`, `http`, `benchmark` and `logging`, the four
split-read tasks `planning-docs` does not list. `planning-docs` does not depend on it, for the same reason. Seven `owns:`
tokens: `coai` and the six tools it types, `mcp__coai__review_plan`, `review_code`, `review_document`, `resolve`,
`consult` and `ask_consultants`.

`common/planning-docs.md` carries the two pointer lines: the ledger sentence in § *Creating a plan*, and "Seven
findings" (the seventh is a change ledger that cannot be read or records a second change without its stop).

The check is the `changes` class of `tools/plan-lifecycle.mjs`, through `tools/lib/plan-ledger.mjs`. It reads `todo/`
only, never `research/` and never git history, and only a plan that has the `## Plan changes` heading outside a fence. A
throw while reading one file becomes a `changes` finding that names the file, and the run still exits 1. A run with any
`changes` finding ends with a hint line naming `common/plan-change-control.md`. `STOP_PHRASE` (`stopped for re-review`)
is shared with `isFullyDone`, so a stopped plan that says what is done is not called finished. E1 widened
`outsideFencedBlocks` (`tools/lib/rule-body.mjs`) to CommonMark's fences; measured over the 38 rule files then, no
recorded heading list changed, and `node tools/rule-bodies.mjs` stays in step. A stopped plan is clean by design: a red
while stopped would block the stop commit, the re-review and its reverts, so the halt is the rule's, not the check's.

**The size measurement** (the parent's Definition of Done; `node tools/rules.mjs explain --repo . --task inspect --file
todo/PLAN_x.md`):

| | `inspect --file todo/PLAN_x.md` | `planning-docs` (`wc -c`) | `common.plan-change-control` selected |
|---|---|---|---|
| before, `main` at `72ae2f3` and this branch at `59543d1`, no E2 edit | 38 612 B | 14 405 B | no (file absent) |
| after, E2's commit (the one carrying this record) | 38 979 B | 14 772 B | no |

The scope's five rules are `common.coding-style` 2 889, `common.knowledge-base` 3 564, `common.planning-docs` (14 405,
then 14 772), `common.security` 8 602 and `common.task-lifecycle` 9 152. The growth, 367 B, equals the `wc -c` growth of
`planning-docs` exactly: the two pointer lines are all it is. `inspect` with no file stays at 24 207 B. The ten scopes of
the four single-read tasks that `tools/rules.test.mjs` pins (four of `inspect`, three of `ui`, two of `gpu`, one of
`storage`) stay at or under 32 768 B; the largest is `ui` with `ui/a.ts` at 32 329 B, and none of them selects
`planning-docs`. The old absolute cap, "this scope stays at or under 32 768 B", could never hold: 38 612 B on `main`
before any work (the parent's entry 2.2); the criterion above replaced it.

**The cost of `depends: planning-docs`** on the four tasks that gain `planning-docs` and the rule (they gain 14 772 +
12 274 = 27 046 B each; all four were split reads already, so no cap moves):

| Task | before | after |
|---|---|---|
| `audit` | 190 574 B | 217 620 B |
| `http` | 70 968 B | 98 014 B |
| `benchmark` | 69 787 B | 96 833 B |
| `logging` | 47 207 B | 74 253 B |

Design record: [PLAN_plan_change_control.md](PLAN_plan_change_control.md) (a sibling link since the promotion; it was a
`todo/` link while the plan was open).

References: [yaml parser](https://eemeli.org/yaml/),
[picomatch](https://github.com/micromatch/picomatch),
[Codex instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[Claude imports](https://code.claude.com/docs/en/memory#agentsmd).

## Task-gated path selection — `path_tasks`

A rule's `paths` select it for any scope that names a matching file. `path_tasks` narrows that:
the paths select the rule only in a scope that also names one of the listed tasks, and the
selection reason says so (`path:src/x.cs (**/*.cs) when task:implement`). Plain `tasks` and
dependencies ignore the gate (a dependency arrives whatever its own conditions say), a gate
without `paths` is a metadata error because it selects nothing alone, and `explain` names the
gate in a `path_tasks` field on every rule (an empty list for an ungated one). The selector
change is `selectRules` in `tools/lib/rule-catalog.mjs`; `matchesPaths(rule, file)` exports the
same predicate for the case check of the selection baseline.

A gate has two legitimate uses, and `tools/lib/gates.mjs` checks both against a gate record
(`research/selection-matrix.json`, `gates`, one entry per gated rule, written by the epic that
lands the rule):

- **Mirrored by provenance.** The gate repeats the `tasks:` line of the rule its requirement's
  text came from. A source that has no `tasks:` line mirrors as "no gate": the new rule has no
  `path_tasks` either.
- **Declared with a reason.** A new requirement, or an applicability the plan changed on purpose,
  declares its `path_tasks` and a reason of at least 20 characters (plan section 4.3 of
  `todo/PLAN_node_rule_parity.md`, as plain text).

The record is `"<rule id>": { "mirrors": "<source id>" | "declared": { "path_tasks": [...],
"reason": "..." }, "epic": "E2".."E6", "cases": [...] }` — exactly one of `mirrors` and
`declared`. `provenanceFindings(catalog, gates, landedEpics)` reports: a gated rule with no
record; a record for an absent rule once its epic has landed; a mirror whose source does not
exist, whose `tasks:` set differs from the rule's `path_tasks`, or that has no `tasks:` line while
the rule is gated; a declared gate whose set differs, whose reason is short, or that sits on an
ungated rule; and a record with both keys or neither. No real rule is gated in the first epic
and no record is written there.

## The selection baseline

`path_tasks`, a new `paths` glob or a rule's `tasks` line changes what every consumer's agents receive, and the rule-body
freeze (`research/rule-bodies.json`) cannot see it: it hashes a body after the front matter (D12 of
`todo/PLAN_node_rule_parity.md`). `research/selection-matrix.json` is the control. `tools/selection-matrix.mjs` generates
it and `tools/selection-matrix.test.mjs` compares it, so a hand edit and a selector change nobody regenerated for are both
a red suite. It records, for 165 representative scopes (15 file sets x 11 tasks: `inspect`, `ui`, `gpu`, `storage`,
`implement`, `test`, `audit`, `logging`, `dependencies`, `pr`, `policy`), the sorted ids each selects; for the 60 scopes of
the four single-read tasks, whether the scope is a **pin** (`oneRead: true`) or off the list with a `why`; and the `gates`
map. The scopes reach every rule: a test asserts that each rule of the catalog appears in the id list of at least one
scope, so a `paths` or `path_tasks` edit to any rule moves a recorded list. `App.sln`, `api/a.http`, `common/testing.md`
and the tasks `pr` and `policy` were added for that (they select `csharp.dotnet-build`, `common.rule-ownership` and
`common.pull-requests`, which no earlier scope did, and give `common.http-contracts` a scope where its `.http` glob matches
beyond its tasks); the original 108 scopes are unchanged.

- `node tools/selection-matrix.mjs` verifies (exit 0, or exit 1 naming each scope whose selection moved);
  `--write` regenerates (temporary file, then rename) and its diff is what a reviewer reads beside the rule change;
  `--bytes` prints the table below; anything else is usage, exit 2.
- **The 22 pins** are the single-read scopes of plan section 5 that fit one 32,768 B read today: `inspect` with no file,
  `src/x.cs`, `src/x.csproj`, `ui/a.ts`, `tsconfig.json`, `.npmrc`, `Directory.Build.props`, `src/a.mjs` and
  `src/webview/page.ts` (9); `ui` with no file, `tsconfig.json`, `.npmrc` and `Directory.Build.props` (4); `gpu` with no
  file, `src/x.cs`, `tsconfig.json`, `.npmrc` and `Directory.Build.props` (5); `storage` with no file, `tsconfig.json`,
  `.npmrc` and `Directory.Build.props` (4). `tools/rules.test.mjs` selects each and asserts it still fits. Every other
  single-read-task scope is `oneRead: false` with a reason: `ui` with a language file is off the list by decision D5, the
  rest were over one read when the baseline was taken (the 12 scopes of `App.sln`, `api/a.http` and `common/testing.md`
  are over one read, so none is a pin), and two `src/a.mjs` scopes fit today but are unpinned by the plan.
- **The caps** (`CAPS` in `tools/rules.test.mjs`): the always core, 15,055 B today, at most 15,355 B; `gpu --file src/x.cs`
  at most 32,613 B; `csharp/doctrine.md` at most 4,633 B; `typescript/npm-packages.md` and
  `typescript/compiler-strictness.md` at most 3,300 B each; `common/dependencies.md` at most 4,000 B;
  `typescript/utc-timestamps.md` at most 1,200 B; `csharp/boundaries.md` at most 1,400 B; and `typescript/doctrine.md` at
  most 4,700 B from the moment E4 is in `LANDED_EPICS` (`tools/lib/parity-epics.mjs`). A rule cap applies whenever the rule
  exists; a cap with a `from` epic applies once that epic has landed.
- **The negative-case definition** (`caseFindings` in `tools/lib/gates.mjs`): every gate record has at least one case that
  selects the rule; a gated rule also needs a positive through the gate (a file matching its paths and a task of the gate,
  not a case its `tasks:` line selects), a negative whose file matches its paths with every task outside the gate, and a
  negative with a task inside the gate and no matching file; an ungated rule (a mirror of a path-only source) needs a
  negative with no matching file; every task is known, every file root-relative, and each case holds under `selectRules`.
  The messages name the rule, the case and what is missing.

Summed bytes of the selected rules per scope, as `node tools/selection-matrix.mjs --bytes` prints them. Measured 2026-11-01 at
the commit that split `common/test-leftovers.md` into an 8,483 B core (hard cap 8,500 B: a consumer's review gate packs each
mounted rule file on its own under a free tail of about 9,990 units; owner decision 2026-11-01) and the 31,186 B
`common/test-leftovers-detail.md` (the former text moved whole, same `load` and `tasks`, loaded as the core's dependency), over
40 rules. It replaces the table measured 2026-10-31 at the whitespace-only splits (E1.S0b, branch commit `b2c6642`, over 39
rules): every `implement`, `test`, `audit` and `policy` cell rose by 9,113 B (8,483 + 31,186 − 30,556; the no-file scopes read
286,925, 279,493, 218,240 and 251,138 before, and `release`, not a column, 263,288 → 272,517), every other cell is as it was,
and the four single-read tasks are untouched. Each later epic re-runs `--bytes` and replaces this table, never appends to it.
The `App.sln`, `api/a.http` and `common/testing.md` rows and the `pr` and `policy` columns were added at the commit that made
the baseline reach every rule; the original cells did not change then. Re-measured 2026-11-02 for the `raw-temp` baseline
(`todo/PLAN_raw_temp_baseline.md`, epoch 2, E2-a): the core is 8,876 B, the detail 31,677 B, and the companion
`common/test-leftovers-baseline.md` (9,151 B after the named-guard text and the gate's rules, conditional) is now selected for `implement` as well as `test`, `audit`,
`policy`, `release` and `pr`, so the `implement` column carries it; every cell of the four single-read tasks is as it was.
Re-measured 2026-11-03 for F24 (`todo/PLAN_test_leftovers_merged_core_followups.md`): the companion's proof clause names the process-wide gate and says ordering is
no part of the proof, and the companion is 10,365 B (+1,214 B, after the review's additions: the child-run tests live in the proof file, each of `TEMP`, `TMP` and `TMPDIR` mismatched on its own, a Never bullet); only the cells of the `implement`, `test`, `audit`, `pr` and `policy` columns that select it moved (+1,214 B each), and every cell of the four single-read tasks is as it was.
Re-measured 2026-11-05 for F27 (`todo/PLAN_test_leftovers_merged_core_followups.md`): `common/testing.md` carries the process-bound and shim section and is 28,016 B (+3,317 B over the released text); the cells of the `implement`, `test`, `audit` and `policy` columns moved +3,317 B each (`release`, not a column: 283,766 → 287,083 B from `node tools/rules.mjs explain --repo . --task release`), and the `api/a.http` row moved +3,317 B in every column because the rule arrives there as `dependency:common.http-contracts`, so its four single-read cells and the `OVER` values in `tools/selection-matrix.mjs` (and the `why` strings `--write` derives from them, in `research/selection-matrix.json`) moved with it; every other cell and the 22 pins are as they were.

Re-measured 2026-11-16 for F41 (`todo/PLAN_F41_container_scoped.md`): the detail is unchanged (31,962 B; only its frontmatter gains `depends`), the core is 8,958 B, and the new companion `common/test-leftovers-exemptions.md` (3,796 B, conditional, the detail's tasks) is loaded through the detail's `depends`; so every cell of the `implement`, `test`, `audit`, `release` and `policy` scopes that selects the detail moved by the companion's size (and the core's), and every cell of the four single-read tasks is as it was.
| Files | inspect | ui | gpu | storage | implement | test | audit | logging | dependencies | pr | policy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| (no file) | 24,207 | 26,420 | 27,680 | 29,406 | 315,307 | 307,875 | 246,484 | 74,253 | 160,610 | 182,345 | 279,636 |
| `src/x.cs` | 28,820 | 31,033 | 32,293 | 34,019 | 319,920 | 312,488 | 251,097 | 78,866 | 165,223 | 186,958 | 284,249 |
| `src/x.csproj` | 31,902 | 34,115 | 35,375 | 37,101 | 323,002 | 315,570 | 254,179 | 81,948 | 165,223 | 190,040 | 287,331 |
| `Directory.Build.props` | 27,289 | 29,502 | 30,762 | 32,488 | 318,389 | 310,957 | 249,566 | 77,335 | 160,610 | 185,427 | 282,718 |
| `ui/a.ts` | 30,090 | 32,303 | 33,563 | 35,289 | 321,190 | 313,758 | 252,367 | 80,136 | 166,493 | 188,228 | 285,519 |
| `src/a.mjs` | 24,207 | 26,420 | 27,680 | 29,406 | 315,307 | 307,875 | 246,484 | 74,253 | 160,610 | 182,345 | 279,636 |
| `src/x.cs` + `ui/a.ts` | 34,703 | 36,916 | 38,176 | 39,902 | 325,803 | 318,371 | 256,980 | 84,749 | 171,106 | 192,841 | 290,132 |
| `package.json` | 35,409 | 37,622 | 38,882 | 40,608 | 326,509 | 307,875 | 257,686 | 85,455 | 171,812 | 193,547 | 290,838 |
| `tsconfig.json` | 24,207 | 26,420 | 27,680 | 29,406 | 315,307 | 307,875 | 246,484 | 74,253 | 160,610 | 182,345 | 279,636 |
| `.npmrc` | 24,207 | 26,420 | 27,680 | 29,406 | 315,307 | 307,875 | 246,484 | 74,253 | 160,610 | 182,345 | 279,636 |
| `src/webview/page.ts` | 30,090 | 32,303 | 33,563 | 35,289 | 321,190 | 313,758 | 252,367 | 80,136 | 166,493 | 188,228 | 285,519 |
| `src/main.rs` | 40,743 | 42,956 | 44,216 | 45,942 | 319,686 | 324,411 | 250,863 | 78,632 | 177,146 | 198,881 | 296,172 |
| `App.sln` | 40,676 | 42,889 | 44,149 | 45,875 | 331,776 | 313,142 | 262,953 | 90,722 | 177,079 | 198,814 | 296,105 |
| `api/a.http` | 63,442 | 65,655 | 66,915 | 68,641 | 315,307 | 319,094 | 246,484 | 113,488 | 199,845 | 221,580 | 290,855 |
| `common/testing.md` | 33,846 | 36,059 | 37,319 | 39,045 | 324,946 | 317,514 | 256,123 | 83,892 | 170,249 | 191,984 | 279,636 |

## Byte allowances per epic

Every later epic of `todo/PLAN_node_rule_parity.md` (section 5, as plain text) writes against a byte budget that the
suite already holds, so a story measures against this table before its text lands. The always core is 15,055 B today and its
total allowance is **300 B over it, a hard cap of 15,355 B**: the core loads under `gpu` too, and the cap is what keeps
`gpu --file src/x.cs` readable in one read. The budget of one read is 32,768 B; the 22 pins of the selection baseline are
each held under it.

| Owner | Rule | Allowance | Scope it protects |
|---|---|---|---|
| E2 | `common/dependencies.md` | at most 4,000 B | a split read (`dependencies --file package.json`); no single-read pin, the number keeps the rule one page |
| E2 | `typescript/npm-packages.md` | at most 3,300 B (not 3,500 B: the three-sentence allowance is the hard cap) | `storage --file .npmrc`, the tightest pin at E3's exit |
| E3 | `typescript/compiler-strictness.md` | at most 3,300 B | `storage --file tsconfig.json` (at most 31,900 B once E6 has moved the clock mechanics) |
| E3 | the P2/P3 statement in `typescript/doctrine.md` | at most 250 B | `inspect` and `gpu` with a `.ts` or `.mjs` file, split reads until E4 |
| E3 | `csharp/doctrine.md` | at most 4,633 B (4,613 B plus the `Nullable enable` line; its Definition of Done is gated, never loaded under `gpu`) | `gpu --file src/x.cs`, at most 32,613 B |
| E4 | `typescript/doctrine.md` | at most 4,700 B after the moves | `gpu --file ui/a.ts` and `gpu --file src/a.mjs`, at most 32,680 B |
| E4, E6 | `csharp/boundaries.md` | at most 1,400 B | `ui --file src/x.cs`, measured by E6 (off the single-read list by decision D5) |
| E6 | `typescript/utc-timestamps.md` | at most 1,200 B | `storage --file ui/a.ts`, which must improve rather than worsen |
| E5, E6 | the gated mechanics rules (`lifecycle`, `logging`, `testing`, `definition-of-done`) | measured and recorded, no single-read cap | split reads only |
| E3 to E6 | the core | in total at most 300 B over today, at most 15,355 B | every scope: the core is in all of them |

**After E3, before E4 — the interim budget.** E3 adds prose and selectors before E4 moves the trap sections out, so the 22
pins are held against that catalog too (E2 assumed merged, the core unchanged until E5, `utc-timestamps.md` unchanged until
E6). In the order of the pin list, in bytes: `inspect` 24,207 · 28,840 · about 29,840 · 30,366 · 27,507 · at most 27,507 ·
about 25,207 · 30,366 · 30,366; `ui` 26,420 · 29,720 · at most 29,720 · about 27,420; `gpu` 27,680 · 32,313 · 30,980 · at
most 30,980 · about 28,680; `storage` 29,406 · at most 32,706 · at most 32,706 · about 30,406. The `storage` pins leave 62 B of
headroom until E6 moves about 1,100 B out of `utc-timestamps.md`; that is why the `.npmrc` rule is capped at 3,300 B. The
unpinned JavaScript scopes are split reads in the interim and improve at E4 (`gpu --file src/a.mjs` about 33,839 B after E3,
32,380 B or less after E4; `storage --file src/a.mjs` about 35,565 B after E3 and about 33,300 B after E6).

Each epic re-measures with `node tools/selection-matrix.mjs --bytes` and replaces the table in the previous section. The
caps above are enforced by `CAPS` in `tools/rules.test.mjs`, which a test compares with this section.

## Gate declarations — the schema, and what each epic will declare

A gate record is written by the epic that lands the gated file, in `GATES` of `tools/selection-matrix.mjs` (rendered into
`research/selection-matrix.json` under `gates`); the first epic declares none. The record, keyed by the rule id:

```json
"csharp.definition-of-done": {
  "declared": { "path_tasks": ["implement", "test", "audit", "release", "policy"], "reason": "<at least 20 characters>" },
  "epic": "E4",
  "cases": [ { "tasks": ["implement"], "files": ["src/x.cs"], "selected": true } ]
}
```

The example is a declaration, as the plan's section 4.4 has it for the two `definition-of-done` files (written by E4). A
mirrored record has `"mirrors": "<source rule id>"` in place of `declared`.

A record has exactly one of `mirrors` (the source rule whose `tasks:` line the gate repeats; a source with no `tasks:` line
mirrors as "no gate") and `declared` (`{ "path_tasks": [...], "reason": "<at least 20 characters>" }`, for a new
requirement or an applicability the plan changed on purpose). `provenanceFindings` checks the gate against its source or its
reason, and `caseFindings` holds the cases to the definition in the previous sections: at least one case that selects the
rule, for a gated rule a negative with a matching file and every task outside the gate and a negative with a task inside the
gate and no matching file, for an ungated mirror a negative with no matching file.

The plan already approves five declarations, each written by the epic named, and nothing else is declared: the two
`definition-of-done` files and the two `boundaries` files (E4 and E4/E6 — the plan's section 4.4), and
`typescript/testing.md` (E4, ledger entry 3.1). The new mechanics files are declared by the epics that create them:
`typescript/lifecycle.md` by E5, `typescript/logging.md` and `typescript/utc-timestamps.md` by E6. Every other gated file
mirrors the `tasks:` line of the rule its requirement came from.

## The parity matrix

`research/parity-inventory.json` lists every requirement of `todo/PLAN_node_rule_parity.md` section 3 (P: C# requirements,
R: TypeScript requirements, G: gaps on both sides; 31 entries) with a status of `counterpart`, `planned` (and its owning
epic, E2 to E6) or `deliberately-absent` (and its reason, at least 20 characters). `research/parity-matrix.json` has exactly
one row per entry. A row carries a topic, a strength phrase, a status (`planned`, `equal`, `stronger-ts`, `stronger-cs`,
`deliberately-absent`) and two sides. In the first epic every real row is `planned` or `deliberately-absent`; an owning epic
turns its rows into active sides in the commit that lands the text.

A side is one of four shapes: `{ "absent": true }`; `{ "planned": "E2".."E6", "delivery"?: [...] }` (intended locations, not
checked); the **present side of a deliberately-absent row**, `{ "delivery": [ { "id", "section" } ] }` and nothing else, valid
only in a `deliberately-absent` row (the existing text of P8, R4 and R5); or an **active** side with `delivery` (rule id and
section heading), `enforcement` (classes `prose`, `test` with a file, `check` with a tool, `hook` with a hook), `selectors`
(a rule's `paths`, `path_tasks` and `tasks`), `mood` (`MUST` or `SHOULD`), `consequence` and `suppression`
(`none` or `inline-with-reason`, written on each active side and never on the row).

`tools/parity-matrix.test.mjs` holds `parityFindings`, the check the owning epics run. In one sentence each: inventory ids and
fields are well formed; the inventory and the matrix are one to one with equal topics; every delivery location of an active
side, and of a deliberately-absent row's present side, names a catalog rule and one of its recorded sections; a planned side
names an owning epic; a row's status follows from its sides, its epic is the latest of its planned sides, and a planned row of
a landed epic (`LANDED_EPICS`) is a finding; only P4 may be `stronger-*`, and then with a reason; the inventory and the row
agree on status and epic; and, for an active side, its `selectors` name exactly its delivery rules and each item equals the rule's front matter, `mood` is `MUST`
exactly when a heading carrying (MANDATORY) is found from the section's own heading up through each preceding heading of a
lower level to the H1, a `check` tool exports `CHECKED_RULES` containing the side's delivery ids, a `hook` is a file under
`settings/hooks/`, and a `test` file exists.

**Equality is a union over the correspondence table.** For an `equal` row, and for each of the nine tasks of the selection
baseline, the C# side's delivery (any of its rules selected) must hold exactly when the TypeScript side's does, on each pair of
corresponding file sets: none and none, `src/x.cs` with `ui/a.ts`, `src/a.mjs` and `src/webview/page.ts`, and `src/x.csproj`
with `package.json`. The configuration kind (the compiler's own file, `tsconfig.json`) is not paired and not compared. Then
`mood`, the set of enforcement classes, `consequence` and each side's `suppression` must be equal. A union, not a single rule,
because the same requirement may be delivered by a source-file statement and a configuration-file rule together. The
real-row proof runs on fixtures that carry the planned selectors of P2 and P3; without the TypeScript source-file statement it
fails, because a `.ts` scope would deliver nothing.

The deliberately-absent reasons are the inventory's; this document keeps no copy.

## Moves

Text that the parity work moves between rule files moves **verbatim**, and `research/moved-blocks.json` is the record that it
did. It is one JSON array, append-only, of three entry shapes: a **baseline** (`status: "planned"`, the owning epic, the
source file, the line range, the commit it was read at, and the `sha256` and byte `length` of its text); an **activation**
(an owning epic placed the unchanged bytes in a destination: `activates`, `destination`, `destinationLines`); and a
**superseding** entry (the bytes changed, justified by a commit that touched only the block's source file: `supersedes`,
`justifiedBy`, `justifiedFiles`, the new bytes and their destination). Entries are immutable: the one field ever added to an
existing entry is `supersededBy` on a superseded baseline.

A block is **whole lines and whole fences**. A range is `N` or `N-M`; a column range, a range that starts or ends inside a
fenced block, or lines past the end are refused, and the remedy for a sentence that shares a line with the block's boundary is
to split the line by whitespace first (the whitespace-only splits of E1.S0b are exactly that, and the numbering this file
records is the numbering after them; the anonymised first section of the TypeScript doctrine is E1.S0's, so its hash is the
anonymised one). The text hashed is the folded lines of the range with a closing line end, measured in bytes (`é` is two).

- `node tools/moved-blocks.mjs` verifies and prints `moved-blocks: OK — N baseline(s), A activated, S superseded`, or one
  finding per line (exit 1).
- `node tools/moved-blocks.mjs --baseline <source> <from>-<to> <commit> <epic> <id>` appends a baseline, reading the text from
  `git show <commit>:<source>`.
- `node tools/moved-blocks.mjs --record <source> <from>-<to> <commit> <destination> <epic> <id> [--supersedes <baseline id>
  --justified-by <commit>]` is run by the owning epic after placing the block in the destination's working tree and before
  committing. If the bytes equal an unpaired baseline of that source it appends an activation, finding the destination lines by
  scanning the working tree (refused unless the block is there exactly once). If they differ it requires both flags, verifies
  with git that the justifying commit exists, is not a merge commit and touches only the source file (and that the epic is the baseline's), appends the superseding entry and adds
  `supersededBy` to the old one. A refusal writes nothing. The file is written by inserting the new entry before the closing
  bracket, never by re-serialising, through a temporary file and a rename.

A `beforeCommit` is the commit the recorder read the text at; for the first epic's 25 baselines it is a commit of the feature
branch, which a squash merge does not put on `main` but which stays reachable through the pull request's ref. Nothing reads it
back: it is evidence of where the bytes came from, not an input of the check.

The checker reads no git history, so it runs in a depth-1 CI checkout: it finds a block by its hash anywhere in the file, which
means a section added above a planned block does not break the check while a changed byte does. An unpaired baseline needs its
text in the source exactly once and its epic not yet landed (`LANDED_EPICS`); an activation needs the destination lines to hash
to the baseline, the block exactly once in the destination, and none left in the source; a superseding entry the same for its
own bytes, a 40-hex `justifiedBy` and `justifiedFiles` of exactly the source; a baseline is paired at most once. The facts that
need history (the commit exists, the files it touched) are checked by the recorder when the entry is written and are recorded
in the entry. This is not `research/rule-bodies.json`: that file freezes what a whole rule body IS now and is updated with every
edit, this one records where named pieces went and is only ever appended to. The first epic records the 25 baselines and no
destination; the owning epics (E2, E4, E5, E6) activate them.

