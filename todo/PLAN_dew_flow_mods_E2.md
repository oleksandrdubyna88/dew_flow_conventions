# PLAN — dew_flow_mods, E2: the new repository and its gate

> Status: **plan only, nothing implemented yet, 2026-11-23.** Scope: the public repository `oleksandrdubyna88/dew_flow_mods`
> (the copy of mod 1.6.0, the layout, CI, the family mount), its release gate (story 2.2, a separate spec), the first
> promotion and the observations V4–V7, V9, V10 against the real repository with a second version 1.6.1. Stories of epic
> E2 of [PLAN_dew_flow_mods.md](PLAN_dew_flow_mods.md) (§ *Epics*, E2), written by Opus when the epic started. This
> document keeps no change ledger: a change to E2's approved work is an entry in the parent's `## Plan changes`. One
> story is a cornerstone (2.2, `model: fable`); the parent's ledger line already counts it
> (`todo/PLAN_dew_flow_mods.md:449`).

Done when (the parent's E2, `todo/PLAN_dew_flow_mods.md:436-440`): C1, G1–G10 green; O1–O7 observed and recorded; 1.6.0 and
1.6.1 tagged, `release` moved only by the workflow after the owner's approval; V4–V7, V9, V10 recorded with what was
not checked. Depends on: E1 (merged, `research/dew_flow_mods_probe_E1.md` § *Decision*: the relative path
`./plugins/agent-models`), 1.6.0 merged (PR #189, merge commit `69adc1e`), the owner's answers Q1–Q3
(`todo/PLAN_dew_flow_mods.md:393-401`).

## Facts this document rests on (read or run 2026-11-23, Claude Code `2.1.330`)

- `mods/agent-models` at `69adc1e` has 33 files (`git ls-tree -r 69adc1e mods/agent-models`); the nine installed
  files are the keys of the `"1.6.0"` row of `tools/agent-models-pins.json` (`:99` at `69adc1e`), equal to `MOD_FILES`
  (`settings/hooks/lib/agent-models-decide.mjs:17-27`). The tests are `tests/*.test.tsx` and fixtures;
  `tsconfig.json:16` includes `.claude-plugin/types`, which `.gitignore` excludes (the host writes it on load).
- **Local pre-check** (a copy of the folder, `env -i HOME=<empty> PATH=/usr/bin:/bin`, no login, NOT a CI runner):
  `claude plugin validate <dir>` exits 0 ("passed with warnings") and type-checks against the engine's own types: 149
  `error TS…` warnings, 1 in `hooks/tasks.tsx:173` (`PromptFilled`, refusal `"unanswered"`), 148 in 14 test files
  (mostly the band fixture without `isCollapsed`). `claude plugin test <dir>`: 391 pass, 0 fail, 16 files, 10.5 s.
  Neither writes `.claude-plugin/types/`; a no-login `claude --plugin-dir <dir> -p x` exits 1 and writes none either.
- The npm package `@anthropic-ai/claude-code@2.1.330` has `postinstall: node install.cjs`; its `bin/claude.exe` is a
  500-byte stub that prints "claude native binary not installed … postinstall did not run (--ignore-scripts…)". The
  binary is in the optional dependency `@anthropic-ai/claude-code-linux-x64` as `claude` (`install.cjs:41-58`).
- The family's `coderabbit-review.yml:6` and `pr-title.yml:8` run on `pull_request_target`; § B.6 of the parent forbids
  that here (`todo/PLAN_dew_flow_mods.md:188`). CodeQL is GitHub's default setup in conventions (`state: configured`,
  read by `gh api …/code-scanning/default-setup`). Sonar: org `remsoftdev`, `sonar.sources=tools`
  (`sonar-project.properties:1-6`).

## Story 2.1 — the copy, the layout, CI, the family mount

**Create the repository** (the owner's go, Q2; with the owner's `gh` login, before the agent identity of Q3 exists):

```bash
gh repo create oleksandrdubyna88/dew_flow_mods --public --disable-wiki \
  --description "Claude Code mods of the dew_flow family: a plugin marketplace (agent-models)"
gh repo edit oleksandrdubyna88/dew_flow_mods --enable-squash-merge --enable-merge-commit=false \
  --enable-rebase-merge=false --delete-branch-on-merge     # linear history on main (§ B.4)
gh api -X PUT repos/oleksandrdubyna88/dew_flow_mods/actions/permissions/workflow \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
gh api -X PUT repos/oleksandrdubyna88/dew_flow_mods/actions/permissions/fork-pr-contributor-approval \
  -f approval_policy=all_external_contributors                     # § B.6
gh api -X PATCH repos/oleksandrdubyna88/dew_flow_mods/code-scanning/default-setup -f state=configured
```

Each setting is read back with the matching `gh api` GET and the output goes into the PR description. **Pushed first**,
straight to `main` over HTTPS (no ruleset exists yet): one root commit with `LICENSE`, `.gitattributes` and a stub
`README.md` (name, one line, "the mod arrives in PR #1"). It holds no code, so it is the one commit on `main` that
no CI ran on; the PR description says so. Everything else is PR #1 from `feat/copy-agent-models-1.6.0`.

**The layout** (parent § C, `todo/PLAN_dew_flow_mods.md:216-224`; `tools/` of the gate is story 2.2's):

```
.claude-plugin/marketplace.json  {"name":"dew-flow-mods","owner":{"name":<owner>},"metadata":{"description":…},
                                  "plugins":[{"name":"agent-models","source":"./plugins/agent-models","description":…}]}
plugins/agent-models/            the 33 files of mods/agent-models at 69adc1e, byte for byte (git archive 69adc1e)
tools/copy-proof.mjs + test      C1;  tools/type-baseline.mjs + test + type-baseline.json;  tools/claude-bin.mjs + test
package.json, package-lock.json  private; devDependency @anthropic-ai/claude-code exactly 2.1.330; "test": "node --test tools/"
.github/workflows/               ci.yml (named `ci`), pr-title.yml (on pull_request), sonarcloud.yml
.gitattributes                   plugins/** text eol=lf          .gitignore  node_modules/, coverage/
LICENSE                          MIT, copyright line as /home/jinx/git/wsl_care/LICENSE:3 (the owner's name)
README.md  AGENTS.md  CLAUDE.md  .agents/PROJECT.md  .agents/conventions  .claude/  .coderabbit.yaml
sonar-project.properties  todo/README.md  todo/PLAN_from_conventions.md (this plan's side, cited by path)  research/
```

- **README**: what the repository is; the install line `claude plugin marketplace add
  https://github.com/oleksandrdubyna88/dew_flow_mods.git#release` and `claude plugin install agent-models@dew-flow-mods`;
  the source commit (`dew_flow_conventions` `69adc1e`); "Licence: MIT, see LICENSE." No other wording on use or cost.
- **Copy**: `git -C <conventions> archive 69adc1e mods/agent-models | tar -x --strip-components=2 -C plugins/agent-models`.
  The tests stay inside the plugin folder in E2 (parent `:232-233`: staying is the plan as written).
- **The family mount (tenth consumer)**: `.gitmodules` as `/home/jinx/git/wsl_care/.gitmodules:1-4`, the gitlink at the
  tip of conventions `release` (today `c598a11`); `AGENTS.md` as `wsl_care/AGENTS.md:1-9`; `CLAUDE.md` exactly
  `@AGENTS.md`; `.claude/settings.json` = `settings/settings.json` of the mount; `.claude/hooks/**/*.mjs` = byte copies
  of the mount's `settings/hooks/**` (nine files at `c598a11`, the four `agent-models-*` libs included: the old installer
  runs here as in the nine consumers until the E4 bump; `AGENT_MODELS_MOD=off` stops it); `.agents/PROJECT.md` with
  `requires: ["README.md"]`, the fresh-clone line of `wsl_care/.agents/PROJECT.md` and the commands below.

**CI** (`ci.yml`, `name: ci`, `pull_request` and `push` to `main`, `permissions: contents: read`, every `uses:` pinned to
the sha conventions uses, `persist-credentials: false`, `npm ci --ignore-scripts`). Jobs:

| Job | Steps |
|---|---|
| `mods · tools` | `node --test tools/`; `git -C .agents/conventions fetch --depth 1 origin 69adc1e`; `node tools/copy-proof.mjs` (C1) |
| `mods · plugin` | `CLAUDE=$(node tools/claude-bin.mjs)` (CI-2); `"$CLAUDE" plugin validate .`; `"$CLAUDE" plugin validate --json plugins/agent-models > v.json` then `node tools/type-baseline.mjs v.json` (CI-3); `"$CLAUDE" plugin test plugins/agent-models` (CI-1) |
| `family · plans · pins · adapter` | as `wsl_care/.github/workflows/family-checks.yml:39-54`: submodule shallow, `plan-lifecycle`, `adapter-check`, `pin-check` (no `build-flags-check`: no .NET here) |
| `workflows · actionlint` | a copy of conventions `.github/workflows/ci.yml:140-178` |

All jobs sit in the one `ci` workflow because the gate (2.2) reads the `ci` run of a sha. The three open questions of
§ C (`todo/PLAN_dew_flow_mods.md:236-240`), each settled by the first run on PR #1:

- **CI-1, the login.** Expected from the local pre-check: `validate` and `test` need none. Each step runs in an env with
  no `ANTHROPIC_*` variable and no `~/.claude` credential. **Stop rule:** if either prints "Not logged in" or a test
  fails for want of a login on the runner, story 2.1 stops before merge, no secret is added, and the owner decides
  (a credential in a public repository's CI is the owner's decision, `:238`). The PR waits; nothing is retried around it.
- **CI-2, the native binary.** `npm ci --ignore-scripts` leaves the stub. `tools/claude-bin.mjs` prints the path of
  `node_modules/@anthropic-ai/claude-code-linux-x64/claude` and exits 1 when that file is absent, is the stub, or its
  `--version` is not `2.1.330 (Claude Code)`; the lockfile's integrity hash pins the binary. **Stop rule:** if the
  binary is absent or does not run, no install script is allowed (§ B.6); ask the consultants one question (a pinned
  download checked by sha256, as actionlint at `ci.yml:149-178`, or the postinstall), then the owner.
- **CI-3, tsc with the engine types.** Plain `tsc` needs `.claude-plugin/types/`, which no command above writes, so the
  type check is the engine's own, in `validate --json`. `tools/type-baseline.json` holds the 149 findings of 2.1.330
  keyed by file and message with a count (not by line). The tool is red on a new finding and red when a baseline
  entry is no longer found ("shrink the baseline"): it can only shrink. A CLI version bump that adds findings is red;
  the fix is a mod change with a version raise. The shipped-code finding (`hooks/tasks.tsx:173`) is a follow-up todo.

The mod test R4 fails about once in eight runs (`todo/PLAN_agent_models_1_6_0.md:132-134` at `69adc1e`). A red R4 on PR #1
is re-run once and named in the PR; 1.6.1 (story 2.3) is its fix. Any other red is a red.

**Review tools.** `.coderabbit.yaml` as conventions (language `ru-RU`, gitleaks, actionlint, yamllint) with a
`plugins/**` instruction: "runs with the owner's permissions in every session; a changed file needs a higher
`plugin.json` version". No `coderabbit-review.yml` (it needs `pull_request_target`; `auto_review` covers non-draft PRs).
`pr-title.yml` on `pull_request` with `pull-requests: read`. `sonar-project.properties`: key `remsoftdev_dew_flow_mods`,
`sources=tools,plugins/agent-models/hooks`, `tests=tools`, `coverage.exclusions=plugins/**` (the engine's test runner
gives no lcov; recorded gap). Neither CodeRabbit nor Sonar is required (`:245-246`); if the apps or `SONAR_TOKEN` are
missing on the new repository, PR #1 says so and the owner adds them (Owner list, 2.3).

**Test scenarios** (`node --test tools/`, real git repositories in a temp folder; each RED first against a stub that
returns "no finding" or a fixed path, so it fails for the right reason, then the code):

| # | Case | Expected |
|---|---|---|
| C1a | the folder equals `mods/agent-models` at the named commit | exit 0; prints the commit, "9 sha256 = 1.6.0 row, N blobs equal" (N read from `git ls-tree`, never typed) |
| C1b | one byte changed in an installed file | red; the file and both sha256 named |
| C1c | a test file or `tsconfig.json` changed (not in the nine) | red by the blob compare; file named |
| C1d | a file extra; a file missing | red; each named |
| C1e | `plugin.json` version above 1.6.0 | the tree of tag `agent-models--v1.6.0` is compared instead; tag absent: red, named |
| C1f | the conventions commit cannot be fetched or has no 1.6.0 row | red, never a skip |
| T1–T4 | type baseline: equal; a planted new finding; a baseline finding gone; unparsable JSON | green; red (file, message); red "shrink the baseline"; red |
| B1–B3 | `claude-bin`: the 500-byte stub; a missing file; a fake binary that prints another version | red each, the reason named |
| F1 | `adapter-check` on the branch before `.claude/hooks` is copied, then after | red naming the missing hooks; green |
| P1 | on PR #1: `plugin validate .`, `plugin test`, `family`, `actionlint`, `git check-attr eol plugins/agent-models/hooks/pins.tsx` | green; `eol: lf` |

**Brief for the Sonnet coder (2.1).** Work in a clone of the new repository on `feat/copy-agent-models-1.6.0` (the
root commit is already on `main`). Read the parent § B.6 and § C, this story, and `research/dew_flow_mods_probe_E1.md`
§ *Decision*. (1) Copy the folder with the `git archive` line; do not edit any byte under `plugins/`. (2) Write the
tests above first (C1, T, B), see each fail for the stated reason, then `copy-proof.mjs`, `type-baseline.mjs`,
`claude-bin.mjs` (Node ESM, `node:` builtins only, exit 1 with a named finding). C1 reads the file list from the
row keys at the commit, never from a list in the tool. (3) Write the marketplace, package files, `ci.yml`,
`pr-title.yml`, `sonarcloud.yml` (from conventions, adapted as above), the family mount and adapter copies, `README.md`,
`AGENTS.md`, `CLAUDE.md`, `.agents/PROJECT.md`, `.coderabbit.yaml`, `todo/`. (4) Run locally: `npm ci --ignore-scripts`,
`npm test`, `node tools/copy-proof.mjs`, the `mods · plugin` steps, `node .agents/conventions/tools/plan-lifecycle.mjs`,
`adapter-check.mjs`, `pin-check.mjs`. (5) Push, open PR #1, and report CI-1, CI-2, CI-3 as observed on the runner,
with the run URL. Stop on the stop rules above; do not merge.

- **Depends on:** E1, `69adc1e`, the owner's Q2 go (given 2026-11-23). **Done when:** PR #1 merged after the code
  round (coai `review_code` + an Opus review at once) with C1, T, B green and seen red first, CI-1/2/3 recorded in the
  PR, every setting read back. **Models:** brief Opus (this document); code and tests Sonnet; review Opus; fixes Sonnet.

## Story 2.2 — the release gate (cornerstone, `model: fable`)

The cornerstone spec is `todo/PLAN_dew_flow_mods_E2_gate.md` (Fable): `promote-release` with the version and layout
gates, G1–G10, the deploy key and the `release` environment, the rulesets from data with read-back, O1–O7, and the
steps for the agent identity (Q3) prepared for the owner. Depends on 2.1 (the `ci` workflow must have reported once
before a ruleset names its checks). Models: spec Fable; code Sonnet; review Opus; the judgement of O1–O7 Fable.

## Story 2.3 — the first promotion, the README, then V4–V7, V9, V10 with 1.6.1

**Preconditions, each read back:** 2.1 and 2.2 merged; G1–G10 green; O1, O2, O4–O7 recorded (O3 may be this
promotion); the rulesets and the environment equal their data file; the agent identity exists with role `write`, no
administration, not a reviewer of `release`, and O7 under it says "refused". No promotion before that (Q1/Q3).

**Promotion 1 — 1.6.0.** Under the agent identity: record the `promote-release` run ids; `gh workflow run
promote-release.yml --repo oleksandrdubyna88/dew_flow_mods --ref main -f sha=<main sha> -f reason="agent-models 1.6.0, the
first release"`; accept only a new run id for that sha. The dry-run job prints the verdict and the compare URL; the
**owner clicks Approve**; the push job creates `release` and the tag. Expected: `git ls-remote
https://github.com/oleksandrdubyna88/dew_flow_mods.git refs/heads/release 'refs/tags/agent-models--v*'` shows `release` =
the sha and `agent-models--v1.6.0` peeling to it; `claude plugin tag --dry-run plugins/agent-models` in a checkout of the
sha names the same tag (the CLI's own `{name}--v{version}` form); C1e now compares that tag. Recorded as O3.

**Promotion 2 — the README (no version change, G8).** A PR adds: the Windows manual commands, the auto-update facts
(interactive sessions only, about ten minutes after the first message, the next launch runs it; `-p` never; the three
variables that turn it off), rollback (`claude plugin disable agent-models@dew-flow-mods`; a fix is a forward version),
the tag list, and the copy commit. Merged, promoted with the owner's click; expected: `release` moves, no new tag.
This move is V7's input.

**Observations** (scratch `CLAUDE_CONFIG_DIR`s under the scratchpad; every `claude` through an `env -i` wrapper as in
E1 (`PATH`, `HOME`, `CLAUDE_CONFIG_DIR` only, so `CLAUDE_CODE_PLUGIN_DIRS` is never inherited); settings = the two keys
of § A with the HTTPS URL and `ref: release`; `--debug-file` per start; `-p` runs read the `init` event of
`--output-format stream-json --verbose`; "SYNC" = `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1`):

| # | Setup | Command | Expected |
|---|---|---|---|
| V5 | fresh `cfg-v5`; `GIT_SSH_COMMAND=/bin/false` | `time` one SYNC `-p` start | log `git clone: url=https://github.com/oleksandrdubyna88/dew_flow_mods.git ref=release`; no ssh or `git@` line; cache `…/1.6.0` complete; the time recorded |
| V4 | `cfg-v5` after two more starts (record written, E1 V1) | `unshare -rn` (else `bwrap --dev-bind / / --unshare-net`) around one `-p` start | `init` lists `agent-models@dew-flow-mods` 1.6.0 from the cache path; the failed refresh is a log line, not a stop |
| V10 | five fresh `cfg-v10-<i>` | two SYNC `-p` starts in the same second, `wait`, then a third start | per folder: one clone (`git fsck` clean, HEAD = `release`); one cache folder whose blobs equal the tag tree; `installed_plugins.json` parses with one record; the third start loads it |
| V9 | a copy of `cfg-v5`; `"agent-models@dew-flow-mods": false` | two `-p` starts; `claude plugin list`; again after promotion 3 and `claude plugin marketplace update dew-flow-mods` | settings sha256 unchanged; `init` without the mod; list shows the id, its version, disabled |
| V7 | `cfg-v5` at 1.6.0, after promotion 2 | `claude plugin marketplace update dew-flow-mods`; `claude plugin update agent-models@dew-flow-mods`; one start | the clone HEAD = the new `release`; no new version; `cache/…/1.6.0` hashes unchanged, no `.orphaned_at`; whether `gitCommitSha` changed is recorded (E3's proof must not key on it). The manual path only; the timed path is V6's |
| V6 | `cfg-v6`, the owner's `/login` in it; steady at 1.6.0 (three interactive starts) before promotion 3 | (a) logged-in `claude -p "reply ok"`, wait 12 min, read the record; (b) the owner starts it interactive, sends one message at T0, keeps it open; poll `installed_plugins.json` and `cache/…/1.6.1` every 30 s to T0+20 min (Monitor until-loop); the owner restarts; `claude plugin list` | (a) still 1.6.0 (proves only that a short `-p` run did not update); (b) 1.6.1 cached within about ten minutes of T0, the running session keeps 1.6.0, the next launch lists and loads 1.6.1. No 1.6.1 by T0+20 min: goal 2's mechanism is not seen; stop, consultants, then the owner |

**Promotion 3 — 1.6.1, a small real change.** Opus picks it from the 1.6.0 follow-ups (`todo/PLAN_agent_models_1_6_0.md:124-137`
at `69adc1e`); first candidate: the R4 timer test. RED first: 40 runs of `claude plugin test plugins/agent-models` show
at least one R4 failure, recorded; the fix; 80 runs with none. If R4 never fails in 40 runs, take the next follow-up.
`plugin.json` goes to `1.6.1` (G5 refuses less); code round, merge, V6 (a) and the owner's steady session ready,
promotion with the owner's click; tag `agent-models--v1.6.1`; then V6 (b) and V9's second half.

**The record.** V4–V7, V9, V10 go into `research/dew_flow_mods_probe_E1.md` of conventions (the parent's Files list
calls it `RESULTS_dew_flow_mods_probe.md`; DoD `:405-406` says "the same file"), each with setup, command, result and
what was NOT checked; one docs PR there. The scratch folders are deleted at the end, the `cfg-v6` login first
(`/logout`, then the folder); about 2 MB each, nothing kept.

**What the owner does:** (1) the agent identity (Q3) before promotion 1, from 2.2's prepared steps; (2) Approve in the
`release` environment three times (promotions 1, 2, 3; about one minute each); (3) for V6: `/login` in `cfg-v6`, three
short interactive starts, then one interactive session with one message kept open about 15 minutes, a restart, then
`/logout` (about 30 minutes in all); (4) if PR #1 shows no CodeRabbit or Sonar: add `dew_flow_mods` to those apps and
the `SONAR_TOKEN` secret.

- **Depends on:** 2.1, 2.2, the agent identity. **Done when:** 1.6.0 and 1.6.1 tagged at the promoted shas;
  `release` moved three times, only by the workflow, each after the owner's approval (the run logs show the wait);
  V4–V7, V9, V10 recorded and the docs PR merged in conventions. **Models:** brief Opus (this document); the
  promotion runs and V runs Sonnet (scout: evidence only); the 1.6.1 change Sonnet, reviewed by Opus; the verdict on
  the record Opus.

## Open points for the caller

1. § C lists `coderabbit-review.yml`; the family copy needs `pull_request_target`, which § B.6 forbids. This document
   drops it and runs `pr-title.yml` on `pull_request`. B.6 is read as the rule that wins; if the caller reads it as a
   change to § C, it is a ledger entry in the parent.
2. The parent's E2 line should link this document, and `todo/README.md` needs its row in the same commit (planning-docs).
