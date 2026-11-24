# REVIEW — the dew-flow-mods session step: findings left open after the rollout

> Status: **open findings, nothing fixed yet, 2026-11-24.** Scope: `settings/hooks/lib/mods-marketplace.mjs` at
> release `cd19c17` and the adapter around it. A fix goes into the reference, then a release and a bump in every
> consumer: a consumer's copy is never changed alone (`tools/adapter-check.mjs`).

The dew_flow_mods move (`todo/PLAN_dew_flow_mods.md`, epics E1–E4) shipped on 2026-11-24: all ten consumers pin
`cd19c17`. Its plans move to `research/` when the owner checks pass, so the open items they named, and the findings
CodeRabbit raised on two bump PRs after the release, are kept here. Each line is a finding, not a decision. A plan
that fixes some of them is written when the owner picks them up.

## Findings from the bump PRs (CodeRabbit, 2026-11-24, all graded "Minor" or "Trivial")

The threads were answered ("the copy is not changed alone; recorded in conventions") and resolved with the owner's
word: coai #1044 (five threads) and creds #390 (six threads). Line numbers are of the reference at `cd19c17`.

| # | Finding | Where | Raised on |
|---|---|---|---|
| R1 | The Claude folder is always `<home>/.claude`. When `CLAUDE_CONFIG_DIR` is set, Claude Code keeps its settings and plugin records there, so the step registers the default profile and reads the wrong install record. | `paths()` `:66-67` | coai |
| R2 | The cache containment check compares path text (`path.relative`). A symlink in an intermediate folder of `installPath` can point outside the cache root, and a matching manifest there gives `whole: true`. Resolve both paths with `realpath` first. The realpath gap was already a known follow-up of E3. | `installPathProblem` `:239-241`, `readProof` `:251-281` | coai, creds |
| R3 | When both settings keys are already present (registered by hand or by an earlier start) and the plugin is not installed, `registeredAt` is never set, so the 72-hour manual-install line never comes. | `:644`, `:657-658` | coai, creds |
| R4 | `retiredAt` takes the time sampled at the start of the run, before the settings write. The 24-hour delay is short by the time of one settings write (milliseconds). | `:567`, `:709` | coai |
| R5 | During the 24-hour wait every start reads and hashes the old folder before it decides `wait`. Decide the delay first. | `:724` against `:449-450` | coai |
| R6 | `agent-models@inline: false` is written by manifest name. A person's own local copy with the manifest name `agent-models` (not the managed folder) is turned off too. | step 1, `:662-709` | creds |
| R7 | A recorded aside judged with `partial` (the default for an earlier start's aside) lets a recorded file be absent. If the person deletes one file between the strict judgement and the next start, the next start can delete the rest. Keep a failed strict judgement in the state file. | `judgeFiles` `:344-353`, `readAside` `:395` | creds |
| R8 | The person's own opt-out marker is read once at the start (`:570-571`). If it replaces our tombstone during the run, step 2 still renames and deletes. Read the marker again before the state write and the rename. | `:570-571`, step 2 from `:754` | creds |
| R9 | Two starts at once can both read the old folder. The second can overwrite the first one's recorded `aside`, get `ENOENT`, clear the record and remove the settings entry and the records. Graded "heavy lift". | the state write before the rename `:595`, step 2 from `:754` | creds |

R7, R8 and R9 are about step 2, the only step that deletes. Each one needs a person to act during a run, or two starts
in the same seconds. Nothing was deleted on the one machine that ran step 1 (E4.1); its step 2 is due after
2026-11-24 17:04 UTC and is an owner check.

## Open items the plans named (carried here before they move to `research/`)

- The adapter's process launcher kills only the child on a timeout, not the process tree
  (`settings/hooks/load-instructions.mjs`; the security rule asks for the whole tree). From `todo/PLAN_dew_flow_mods_E3.md`.
- The adapter's `settings/settings.json` allows Bash and PowerShell without a prompt in every consumer: a family-wide
  permission choice for the owner. From `todo/PLAN_dew_flow_mods_E3.md`.
- The mod's R4 test (`limits-race`) fails about one run in eight; CI in dew_flow_mods says a red run is a red. From
  `todo/PLAN_dew_flow_mods_E2.md`.
- The release gate's agent identity (a GitHub App instead of the shared gh login) is deferred by the owner; the click
  stays a procedure with the owner's written acceptance. From `todo/PLAN_dew_flow_mods_E2_gate.md`.
- SonarCloud and CodeRabbit are not set up for `dew_flow_mods`: an owner action on the two services.
