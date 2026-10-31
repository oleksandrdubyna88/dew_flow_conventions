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
even in unselected rules. `path_tasks` has four errors of its own: it is refused on a
`load: always` rule (`applies to a conditional rule only`), when empty (`must name at least one
task`), when it names a task outside the vocabulary (the legal ones are listed), and when
the rule has no `paths` (`path_tasks needs paths`). All Markdown in the four rule directories must declare metadata.
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
repository's own layout, refuses a project copy with uncommitted changes, and writes a provenance manifest. The same hook, at EVERY start, converges an existing `~/.claude/settings.json` so `effortLevel` and every
`modelSettings.*.effortLevel` (`sonnet`, `opus`, `fable` and any other key) are `high` — backup and atomic write, silent
when already converged, skipped under `SUBAGENT_MODEL_GUARD=off` and in this repository (the `subagent-model.optout` marker does NOT skip it: high everywhere), never creating the file, following a symlink and keeping the file mode, refusing (one warning line, nothing written) a read-only file, an unwritable target, or a non-object `modelSettings` / per-model value
(`applyEffort`; `install-user-hook.mjs --check` reports it without gating the exit code). Design
record: [PLAN_subagent_model_tiers.md](PLAN_subagent_model_tiers.md); its release to the consumers is recorded in
[PLAN_subagent_model_tiers_rollout.md](PLAN_subagent_model_tiers_rollout.md).

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
a red suite. It records, for 108 representative scopes (12 file sets x 9 tasks: `inspect`, `ui`, `gpu`, `storage`,
`implement`, `test`, `audit`, `logging`, `dependencies`), the sorted ids each selects; for the 48 scopes of the four
single-read tasks, whether the scope is a **pin** (`oneRead: true`) or off the list with a `why`; and the `gates` map.

- `node tools/selection-matrix.mjs` verifies (exit 0, or exit 1 naming each scope whose selection moved);
  `--write` regenerates (temporary file, then rename) and its diff is what a reviewer reads beside the rule change;
  `--bytes` prints the table below; anything else is usage, exit 2.
- **The 22 pins** are the single-read scopes of plan section 5 that fit one 32,768 B read today: `inspect` with no file,
  `src/x.cs`, `src/x.csproj`, `ui/a.ts`, `tsconfig.json`, `.npmrc`, `Directory.Build.props`, `src/a.mjs` and
  `src/webview/page.ts` (9); `ui` with no file, `tsconfig.json`, `.npmrc` and `Directory.Build.props` (4); `gpu` with no
  file, `src/x.cs`, `tsconfig.json`, `.npmrc` and `Directory.Build.props` (5); `storage` with no file, `tsconfig.json`,
  `.npmrc` and `Directory.Build.props` (4). `tools/rules.test.mjs` selects each and asserts it still fits. Every other
  single-read-task scope is `oneRead: false` with a reason: `ui` with a language file is off the list by decision D5, the
  rest were over one read when the baseline was taken, and two `src/a.mjs` scopes fit today but are unpinned by the plan.
- **The caps** (`CAPS` in `tools/rules.test.mjs`): the always core, 15,055 B today, at most 15,355 B; `gpu --file src/x.cs`
  at most 32,613 B; `csharp/doctrine.md` at most 4,633 B; `typescript/npm-packages.md` and
  `typescript/compiler-strictness.md` at most 3,300 B each; `common/dependencies.md` at most 4,000 B;
  `typescript/utc-timestamps.md` at most 1,200 B; `csharp/boundaries.md` at most 1,400 B; and `typescript/doctrine.md` at
  most 4,700 B from the moment E4 is in `LANDED_EPICS` (`tools/lib/parity-epics.mjs`). A rule cap applies whenever the rule
  exists; a cap with a `from` epic applies once that epic has landed.
- **The negative-case definition** (`caseFindings` in `tools/lib/gates.mjs`): every gate record has at least one case that
  selects the rule; a gated rule also needs a negative whose file matches its paths with every task outside the gate, and a
  negative with a task inside the gate and no matching file; an ungated rule (a mirror of a path-only source) needs a
  negative with no matching file; every task is known, every file root-relative, and each case holds under `selectRules`.
  The messages name the rule, the case and what is missing.

Summed bytes of the selected rules per scope, as `node tools/selection-matrix.mjs --bytes` prints them. Measured 2026-10-31 at
the commit that added the whitespace-only splits (E1.S0b), over 39 rules; each later epic re-runs `--bytes` and replaces
this table, never appends to it.

| Files | inspect | ui | gpu | storage | implement | test | audit | logging | dependencies |
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

