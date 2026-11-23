# PLAN — dew_flow_mods, E4: the one round

> Status: **4.1 DONE on this machine, 2026-11-23** — the install start, `retired` at start 2, `@dew-flow-mods` 1.6.0
> loading from start 3, an old-pin checkout writing nothing; the record is
> [research/dew_flow_mods_probe_E1.md § E4.1](../research/dew_flow_mods_probe_E1.md). State S1 below is the state
> before the switch, kept as the rollback baseline. Next: 4.2. Scope: the switch on this WSL machine with the real
> `~/.claude`, seen through one unmerged consumer branch (4.1); the pre-checks, ONE `release` promotion of this
> repository and ten bump PRs (4.2); `POST_DEPLOY.md`, the owner checks and the promotion of three plans (4.3). Stories
> of epic E4 of [PLAN_dew_flow_mods.md](PLAN_dew_flow_mods.md) (§ *Build order* steps 6–8, § *Epics* E4). No change
> ledger here: a change to E4's work is an entry in the parent's `## Plan changes`. No cornerstone in E4.

Done when: the parent's DoD (`todo/PLAN_dew_flow_mods.md:412-427`, E4 at `:454-456`). Depends on: E3 merged (`4405544`,
#190, not promoted). Nothing here changes the parent; epoch 1 already holds change 1.1 (`:27-29`), so one more stops it.

## Facts this document rests on (read 2026-11-23 at `4405544`)

- **What a bump carries.** `git diff --stat c598a11 4405544 -- settings/`: `hooks/ensure-user-guard.mjs` and
  `hooks/lib/user-guard-install.mjs` changed, `hooks/lib/mods-marketplace.mjs` new, the four `agent-models-*.mjs` libs
  deleted; `settings.json` and the other hooks unchanged. So a bump is the gitlink, three hook copies and four
  deletions (`ROLLOUT.md:143-149`). The same diff over `common/`, `csharp/`, `rust/`, `typescript/`, `ENTRY.md` is empty.
- **`adapter-check`** takes its reference from the consumer's own submodule (`tools/adapter-check.mjs:27-28`), wants
  each hook byte for byte (`:147-160`) and names each retired lib (`:32-34`, `:172-178`). **`pin-check`** compares the
  COMMITTED gitlink with the tip of `release` (`tools/pin-check.mjs:139-176`, STALE `:210-215`, `README.md:64-67`).
- **A promotion** is a `workflow_dispatch` of `.github/workflows/promote-release.yml` from `main` with a 40-hex `sha`
  and a `reason` (`:38-46`, `:66-82`); the tool refuses a sha off `main`, without a green `ci` run of that exact sha,
  or backwards, and has `--dry-run` (`tools/promote-release.mjs:12-21`, `:34-41`). No approval click on this side.
- **All ten consumers pin `c598a11`** and carry the four retired libs (GitHub contents API, 2026-11-23). Open PRs, same
  read: rag_qln 15, mcp 6, sidecar_rust 8, benchmark 5, creds_for_devs 6, connect_other_ais 18, wsl_care 10,
  vscode_kit 3, amd_r9700_tuning_ai 0, mods 0. `dew_flow_mods` has no `release` ref yet (HTTP 404).
- **This machine** (read only, 2026-11-23). Claude Code 2.1.330. `~/.claude/mods/agent-models` is 1.4.0 (its
  `agent-models.installed.json`); `env.CLAUDE_CODE_PLUGIN_DIRS` is `/home/jinx/.claude/mods/agent-models`; no jq.
  **The new step already ran here once:** `~/.claude/settings.json` holds the anchor entry and
  `"agent-models@dew-flow-mods": true`, `~/.claude/mods/dew-flow-mods.seen.json` says `registeredAt
  2026-11-23T14:04:34.409Z`, and `settings.json.bak-subagent-model-20261123T140434Z` holds the bytes before it. Which
  checkout ran it is not known. The engine has no `dew-flow-mods` in `known_marketplaces.json`, `marketplaces/` or
  `cache/` (the `release` ref is missing). So the machine is in state **S1** of the E3 state machine
  (`todo/PLAN_dew_flow_mods_E3.md:131-140`), and the registration start is behind us.
- **The engine** (`research/dew_flow_mods_probe_E1.md`): the install starts at the first interactive start that sees
  the keys and can clone, after folder trust (`:87`, `:175-178`); the record comes one start late (`:119-120`); the
  folder copy named by the variable wins in silence (`:156`); `agent-models@inline: false` frees the marketplace copy
  for every new start (`:157`); a running session keeps what it loaded until `/reload-plugins` (`:161`).

## Story 4.1 — the switch on this machine, through one consumer branch

**The consumer: `dew_flow_amd_r9700_tuning_ai`.** The switch is machine-wide (user settings); the consumer only
decides where the new hook runs. This one has 0 open PRs, one `tests.yml` and no workflow that publishes, no server or
extension, and is outside the rag_qln pin chain (`README.md:68-76`). Not chosen: `dew_flow_mods` (its first promotion
is open), coai and creds (most PRs, releases in flight), `wsl_care` and `dew_flow_vscode_kit` (release automation).

**The branch pins an unpromoted commit by hand, and stays local.** It is never pushed: no PR, no CI, nothing that can
merge an unpromoted pin. `git submodule update --remote` would go to `release` (`c598a11`, `ROLLOUT.md:139-141`), so:

```bash
git -C /home/jinx/git/dew_flow_amd_r9700_tuning_ai fetch origin -q
git -C /home/jinx/git/dew_flow_amd_r9700_tuning_ai worktree add /home/jinx/git/wt-r9700-e4-canary -b chore/e4-canary-4405544 origin/main
cd /home/jinx/git/wt-r9700-e4-canary && git submodule update --init .agents/conventions
git -C .agents/conventions fetch origin main && git -C .agents/conventions checkout --detach 440554404e9111125c5db603c4e2057a1ce5624e
npm ci --ignore-scripts --prefix .agents/conventions
```

**The consultant's boundary check, red first.** (1) Stage only the gitlink and run
`node .agents/conventions/tools/adapter-check.mjs`: red with exactly seven findings — `ensure-user-guard.mjs` and
`lib/user-guard-install.mjs` drifted, `lib/mods-marketplace.mjs` missing, four libs retired. Another count is a stop.
(2) Copy the three files from `.agents/conventions/settings/hooks/` to `.claude/hooks/` (same relative paths),
`git rm` the four `agent-models-*.mjs`, run it again: `OK`. Then one local commit, and: `rules.mjs check --repo .`
resolves; `pin-check.mjs` is red `STALE` (pinned `4405544`, `release c598a11`). That red is expected on this branch
only: no other branch moves. Both outputs go into the record.

**Each interactive start is seen.** The owner starts each one in the canary worktree as
`claude --debug-file ~/dew_flow_e4/start-<n>.log`, reads the start lines, and exits. After each start a Sonnet scout
reads (with `node -e`, read only) and records: (a) the **user install record** — `plugins["agent-models@dew-flow-mods"]`
of `~/.claude/plugins/installed_plugins.json` (scope, `version`, `installPath`) and the `dew-flow-mods` entry of
`known_marketplaces.json`; (b) **its cache manifest** — `name` and `version` of `<installPath>/.claude-plugin/plugin.json`
and whether `.orphaned_at` exists; (c) **the inline switch** — `enabledPlugins["agent-models@inline"]`, the tombstone
`~/.claude/mods/agent-models.optout` (ours or not), `env.CLAUDE_CODE_PLUGIN_DIRS`, the `seen.json` fields; (d) **the
plugin actually loaded** — the `hooks module agent-models@… loaded` lines of the debug log, and what the band shows (the
1.4.0 row, or the 1.6.0 pin icon and list). Plus the step's own line, if any. Expected, from the facts above:

| Start | The step says | Install record | Loaded |
|---|---|---|---|
| I, the install start: the first interactive start after the owner's click, in any folder | nothing (S1) | empty — it comes one start late | `@inline` 1.4.0 (it shadows, so the probe's gap start does not show here) |
| I+1 | `retired` if the record was written before the hook read it, else nothing | whole, 1.6.0 | `@inline` 1.4.0 |
| I+2 | `retired` if not said at I+1, else nothing | whole | `@dew-flow-mods` 1.6.0 if `retired` came at I+1 |
| next | nothing | whole | `@dew-flow-mods` 1.6.0 — **steady state**: the first start that loads it and says nothing |

If the install start happens in another folder first (any interactive start on this machine installs), the scout dates
it from the cache folder and `known_marketplaces.json` and records "install start: elsewhere, <time>". After `retired`,
one interactive start in a checkout that still pins `c598a11` (e.g. `/home/jinx/git/dew_flow_mods` on `main`): the old
step writes nothing (the tombstone), the inline switch stays `false`, the marketplace copy loads (the parent's DoD,
"an old-pin worktree did not bring it back").

**The stop.** If the record is not whole (proof items 3–5, `todo/PLAN_dew_flow_mods_E3.md:117-125`) at any of the
three interactive starts after the install start, stop: write down the install path (the record, the cache folder
listing, the `known_marketplaces.json` entry, the debug-log lines), change nothing (the old copy still loads; nothing
was retired), do not start 4.2; consultants first, then the owner.

**What the owner does.** (1) The approval click of `dew_flow_mods` promotion 1 (story 2.3): nothing installs before
it. (2) The starts above, the first one after the click in the canary worktree; "Yes, I trust this folder" there (a
new path; the install waits for it). (3) `/reload-plugins` only in a start with no band at all (a gap start), and says
so. (4) If the manual install command is said before the click (72 h after `registeredAt`: from 2026-11-26 14:04 UTC,
`settings/hooks/lib/mods-marketplace.mjs:596`), not to run it. (5) The go for a rollback, if one is needed.

**The record: a new section `## E4.1 — the switch on the real ~/.claude` appended to
`research/dew_flow_mods_probe_E1.md`**, not a new RESULTS file: the parent sends every engine observation there
(`todo/PLAN_dew_flow_mods.md:356`, `:414-415`), and the probe lists the real `~/.claude` as not observed (`:193`). One
row per start, fields (a)–(d), the boundary check output, what was NOT checked; no settings file, no debug log, no
account text (a public repository). One docs PR, before 4.2.

**Baseline, before the click** (a scout, read only, into `~/dew_flow_e4/`, mode 700): a copy of `~/.claude/settings.json`
(mode 600), `cp -a` of `~/.claude/mods/agent-models` and `agent-models.installed.json`, fields (a)–(c). The rollback
source.

**Rollback** — on a `refused` or `could not run` line, a start after `retired` that loads no agent-models, or a
settings member outside the step's four keys changed against the baseline. The owner's go; then restart sessions:

1. `claude plugin disable agent-models@dew-flow-mods`, then read that `enabledPlugins["agent-models@dew-flow-mods"]`
   is `false`. The step reads it as the person's switch and writes nothing more (E3 R5, `decideRegistration` `off`).
   For an emergency before that: `AGENT_MODELS_MOD=off` in the environment skips the step (`settings/hooks/ensure-user-guard.mjs:170`, `:199`).
2. Delete the key `enabledPlugins["agent-models@inline"]` (absent, as in the baseline; not `true`). If step 2 already
   ran: copy `~/dew_flow_e4/agent-models` and its `.installed.json` back into `~/.claude/mods/`, and set
   `env.CLAUDE_CODE_PLUGIN_DIRS` back to `/home/jinx/.claude/mods/agent-models`.
3. Delete `~/.claude/mods/agent-models.optout` only when it parses to `"tombstone": "dew-flow-mods"`. The anchor entry
   and the engine's cache stay (the plugin is off). Proof of the rollback: the next start's debug log loads
   `agent-models@inline` 1.4.0. The rollback is a row of the record.

**Depends on:** E3 merged; `dew_flow_mods` `release` at 1.6.0 (the click); the owner at the keyboard.
**Done when:** the boundary check red then green; steady state recorded; the old-pin start recorded; the record merged.
Step 2 (24 h later) is owner check 1 in 4.3. **Models:** canary branch and boundary check — Sonnet coder; per-start
evidence — Sonnet scout; go, stop or rollback at each start — Opus (the main session); the record — Sonnet writes, Opus reviews.

## Story 4.2 — the pre-checks, one promotion, ten bumps

**Pre-checks, in this order; each result goes into the summary to the owner.**

0. **The feature review** (the rule `common/coai-feature-gate.md`, not a plan change): `review_feature` from a pulled
   `main`, `planPath todo/PLAN_dew_flow_mods.md`, `baseRef 69adc1e` (before #188), epics E1 (#188), E2 (`dew_flow_mods`
   #1–#3), E3 (#190). Opus judges the findings; a true one is a NEW PR.
1. **In-flight consumer releases**: per consumer, open release PRs (release-please, a held release), running release
   or deploy workflows, drafts waiting for a tag. Known to re-read: a held creds release PR (#383, 2026-11-18). Any
   found: consultants first, then the owner (a release is always the owner's).
2. **Open-PR counts per consumer**, read again (the table in *Facts* is the 2026-11-23 read). The promotion reddens
   `pin-check` on every open PR of every consumer until that consumer's bump merges and the PR takes `main`.
3. **`git log c598a11..<sha>`, read and summarised.** For `4405544`, five commits: 42119f6 (docs, a plan promoted),
   53b0a33 (mod 1.5.0), 69adc1e (mod 1.6.0), ceda8b5 (docs: this plan, the probe, E2), 4405544 (E3: the step, the libs
   and `mods/agent-models` out, the `adapter-check` finding). A consumer gets a new session step, three hook files, no
   rule text. If `main` moved past it, read the new commits; one in `settings/hooks/` repeats the 4.1 boundary check.

**The promotion, once.** `ci` green for the sha (`gh run list --workflow ci` for that head sha); a local
`node tools/promote-release.mjs <sha> --dry-run`; record the run ids of `promote-release`; then
`gh workflow run promote-release.yml --ref main -f sha=<40 hex> -f reason="dew_flow_mods: the marketplace step replaces
the agent-models installer"`; watch the new run only; `git ls-remote … refs/heads/release` equals the sha. The owner's
order covers it (goal 3, `todo/PLAN_dew_flow_mods.md:37-38`), unless pre-check 1 found something.

**One bump** (`ROLLOUT.md:139-154`): a worktree from `origin/main`; `git submodule update --remote .agents/conventions`
(first the `.git/config` branch trap, `:151-154`); `adapter-check` red with the seven findings; the three copies and
four `git rm`; `adapter-check` OK; commit; `pin-check` OK; the repository's own checks; push; PR titled
`chore(rules): bump the shared rules to release <short> — the marketplace step replaces the agent-models installer`.
Merge only when the checks of the head sha exist and are green, threads answered, as that repository's last bump PR
was merged. The PR cap does not stop these: the owner's word (`todo/PLAN_dew_flow_mods.md:394`).

| # | Consumer | Note |
|---|---|---|
| 1 | `dew_flow_benchmark` | pinned BY rag_qln (`README.md:68-76`) |
| 2 | `dew_flow_mcp` | pinned BY rag_qln |
| 3 | `dew_flow_rag_qln` | the rules pin AND its code pins `external/dew_flow_benchmark`, `external/dew_flow_mcp` at the two merged bumps (as #135 did for `c598a11`); its build runs (a code-pin bump, `README.md:72-76`) |
| 4 | `dew_flow_amd_r9700_tuning_ai` | a new branch, not the canary (that pin was set by hand); then the canary worktree is removed |
| 5–9 | `dew_flow_vscode_kit`, `wsl_care`, `dew_flow_sidecar_rust`, `dew_flow_creds_for_devs`, `dew_flow_connect_other_ais` | quiet repositories first; the plan allows any order after rag_qln |
| 10 | `dew_flow_mods` | the tenth; no `dew_flow_mods` promotion follows (nothing under `plugins/` changes) |

**Depends on:** 4.1 done. **Done when:** pre-checks reported; `release` at the sha; ten bumps merged, each `main` head
with `adapter-check` and `pin-check` green (by hand where CI has no such step, e.g. r9700); the open PRs left red named.
**Models:** pre-check facts — two Sonnet scouts (releases and PRs of the ten; the log and diff by area); the go and the
feature findings — Opus; each bump — a Sonnet coder, one at a time; each bump diff — an Opus review before the merge
(one gitlink, three changed, four deleted; for rag_qln also the code pins and its build).

## Story 4.3 — post-deploy, the owner checks, three plans to `research/`

- **`POST_DEPLOY.md`** (three items, `:9-13`; cap twelve). The trigger question is yes: the mod's source on the
  owner's installation is not visible to any build. New item 4: "the agent-models mod does not load from dew-flow-mods
  on the owner's machine" — a read-only `node -e` over `~/.claude` (the record whole, the cache `plugin.json` version
  equal to the record, `agent-models@inline` `false`, and `agent-models@dew-flow-mods` `true` — a disabled plugin is
  not loaded); `auto`. Then run items 1–4 with `post-deploy-check.mjs --target`
  against r9700 `main` at its bump, and write the stamp (date, target, pin). Sonnet writes, Opus reviews.
- **The owner checks** (the parent's `:369-380` and the two mod plans'), after the bumps, on this machine:
  1. A start in any bumped consumer: the band has the `last answer` button (1.5.0) and the pin icon and list (1.6.0);
     `claude plugin list` shows `agent-models@dew-flow-mods`; `agent-models@inline` is `false`. 24 hours after
     `retired`: the `removed` line; `~/.claude/mods/agent-models` gone; `CLAUDE_CODE_PLUGIN_DIRS` without it.
  2. The 1.5.0 checks (`todo/PLAN_agent_models_1_5_0.md:299-306`): the button after a scroll, a hot reload and
     `/resume`; a long pasted question; the weekly reset on the limits line (`resets <date>` after `week`).
  3. The 1.6.0 checks (`todo/PLAN_agent_models_1_6_0.md:188-195`): pin, list, scroll, `x`, no icon on tool rows, two
     presses acceptable, `/clear`.
  4. Auto-update (V6 on this machine): after the first version promoted after this machine's steady state (1.6.1 when
     story 2.3's promotion 3 comes after 4.1), ten minutes in an interactive session, restart: the line
     `agent-models updated 1.6.0 → 1.6.1 (dew_flow_mods release)`, `claude plugin list` shows it, no consumer PR.
  5. `claude plugin disable agent-models@dew-flow-mods`, restart: no band, the step does not turn it on; then `enable`.
  6. A promotion shows the compare URL and waits for the click (seen at story 2.3).
- **Promote the plans** after the checks (the parent's boundary table, `:51`): `todo/PLAN_agent_models_1_5_0.md`,
  `todo/PLAN_agent_models_1_6_0.md`, and `PLAN_dew_flow_mods.md` with `_E2.md`, `_E2_gate.md`, `_E3.md` and this file.
  Edits first, `git mv` last, then `git add` the destination (`common/planning-docs.md`, `common/git-workflow.md`
  rule 8); IMPLEMENTED with deviations (one already: the step registered this machine before the `release` ref
  existed); the three link cases; both READMEs; `plan-lifecycle.mjs` clean. Sonnet writes, Opus reviews.
- **Clean up:** `~/dew_flow_e4/` (baseline and logs) after check 1 passed; the canary worktree in 4.2.

**Depends on:** 4.2. **Done when:** item 4 in and the file run with its stamp; the checks reported with dates; the
plans in `research/`; the parent's DoD ticked; the summary names models and counts.

## What grows, and who retires it

| Surface | Size | Who retires it | Interrupted |
|---|---|---|---|
| `~/dew_flow_e4/` (settings copy, 1.4.0 copy, debug logs) | about 0.35 MB plus the logs (size measured and recorded per start) | 4.3, after owner check 1 | stays; it is outside `~/.claude` and read by nobody |
| the canary worktree `/home/jinx/git/wt-r9700-e4-canary` | the r9700 checkout (2.2 MB on GitHub) and the conventions `node_modules` | 4.2, when the r9700 bump merges | `git worktree prune` |
| `settings.json.bak-subagent-model-*` | one each for step 1 and step 2 (the registration's exists) | nobody, as today (E3 table) | `backupOnce` adds none on a retry |

## Open points for the caller

1. **Not taken, because it would be change 1.2 and stop the plan:** to hold story 2.3's promotion 3 (1.6.1) until 4.1
   reaches steady state. As written, if 1.6.1 is promoted first, this machine installs 1.6.1 at once, 4.1 expects
   1.6.1 in the table, and owner check 4 waits for the next version.
2. **The registration of 14:04 UTC** came from a checkout nobody named. Before the click, a scout lists every checkout
   with `.claude/hooks/lib/mods-marketplace.mjs`: a start in any of them does step 1 once the record is whole, maybe
   before the canary start (the same result, but the row moves).
3. This file needs its `todo/README.md` row and the link from the parent's E4 line in the commit that adds it.

## Definition of Done (E4)

- [ ] 4.1: the boundary check red (seven findings) then green; `pin-check` red on the canary only; one row per start
      with the record, the manifest, the inline switch and the loaded plugin; steady state; the old-pin start; merged.
- [ ] 4.2: pre-checks 0–3 reported; one promotion; ten bumps merged in order with checks present and green on each head.
- [ ] 4.3: `POST_DEPLOY.md` item 4 and its run; owner checks 1–6 reported; the plans promoted; `plan-lifecycle` clean.
