# PLAN — Model tiers, the rollout: one release, the pin cascade, the self-install observed

> Status: **plan only, nothing of the rollout done yet, 2026-10-13.** Its one precondition is already met (below).
> Extracted from [PLAN_subagent_model_tiers.md](../research/PLAN_subagent_model_tiers.md) when that plan was promoted:
> E1, E2 and E4 S1–S3 shipped in PR #65; this is its open tail — E4.S4's release and cascade, and E3's observation.
> The operator wants it done LAST, after PR #65 merges.

## 1. The goal, before any solution

The rewritten `common/subagent-models.md`, the guard `settings/hooks/subagent-model.mjs`, its self-install
`settings/hooks/ensure-user-guard.mjs` (+ `settings/hooks/lib/user-guard-install.mjs`) and both settings entries are on
the PR #65 branch, wired in `settings/settings.json` and this repository's own `.claude/` (`565cd48`). No consumer has
any of it: every consumer pins `release`, which still sits at `03428e2` (checked: `git log origin/release..origin/main`
2026-10-13 lists six commits, none of PR #65). Nothing reaches a session outside this repository until `release` moves
and each consumer bumps its pin — and the user-level guard (D8, D13) is not on this machine until the first session in a
consumer that carries the adapter installs it.

## 2. What is already met

- **The precondition of E4.S4** (no model-measuring harness is steered by the guard): `dew_flow_benchmark` #79 (the
  subject runtime's opt-out, merged `e49fafc`) and #81 (`ProbeChildEnvironment` — the scout runner, the alias check and
  the probes always carry `SUBAGENT_MODEL_GUARD=off`), and `dew_flow_connect_other_ais` #793 (the CoaiBench judge's
  opt-out) — all three merged. The release PR states this, as E4.S4 requires.
- **E3's D11 and the memory note** — done on the operator's machine 2026-10-13, recorded in
  [RESULTS_subagent_model_tiers.md](../research/RESULTS_subagent_model_tiers.md) § *`modelSettings` by alias (D11)*.

## 3. Build order

0. **PR #65 merged** to `main` — CI green, review threads answered and resolved.
1. **One `promote-release`**, to the 40-character merge sha of PR #65, with a `reason` (README § *Editing discipline*,
   *How `release` moves*):
   `gh workflow run promote-release.yml --ref main -f "sha=<40-char sha>" -f reason="subagent model tiers: rule, guard, self-install, behaviour smoke"`.
   The moment it lands every consumer's `pin-check` goes red — the bare bumps below follow within the hour.
2. **The pin bumps**, one PR each, in this order. Every bump carries the release's rule texts (the rewritten
   `common/subagent-models.md`, the epics-and-stories section of `common/planning-docs.md`) through the submodule;
   what else each carries:

   | # | Repository | Layout | Carries besides the pin |
   |---|---|---|---|
   | 1 | `dew_flow_creds_for_devs` | `.claude/rules/shared` | nothing |
   | 2 | `dew_flow_mcp` | `.claude/rules/shared` | nothing |
   | 3 | `dew_flow_benchmark` | `.claude/rules/shared` | repoints its three citations `dew_flow_conventions · todo/PLAN_subagent_model_tiers.md` (`todo/PLAN_scout_model_calibration.md:13`, `:414`, `:536` on its `origin/main` as fetched 2026-10-13) to `research/PLAN_subagent_model_tiers.md` |
   | 4 | `dew_flow_sidecar_rust` | `.claude/rules/shared` | nothing |
   | 5 | `dew_flow_connect_other_ais` | `.agents/conventions` (migrated) | the hook copies `.claude/hooks/subagent-model.mjs`, `.claude/hooks/ensure-user-guard.mjs`, `.claude/hooks/lib/user-guard-install.mjs`, and **both settings entries** — the `PreToolUse` `Agent\|Task` entry and the second `SessionStart` entry with `"timeout": 5` — which its CI's `adapter-check` demands byte for byte; repoints its three citations (`research/PLAN_the_model_order_follows_the_tiers.md:11`, `:16`; `research/module_server.md:4911`) |
   | 6 | `dew_flow_rag_qln` | `.claude/rules/shared` | **last** — it pins `external/dew_flow_mcp` and `external/dew_flow_benchmark`, bumped in the same PR with its build run (README, the rag_qln bullet) |

   connect_other_ais goes fifth, not first as in earlier cascades, so the self-install's mid-cascade window (§5) spans
   one bump instead of five.

3. **Found while writing this plan — two more repositories pin `release`; both ride this cascade** (decided by the
   caller, 2026-10-13: leaving them would turn a consumer's CI red, which is not a choice). The README's *Consumers* table names six, but the local checkouts of `wsl_care` and
   `dew_flow_vscode_kit` both carry `.agents/conventions` on `branch = release` (checked: their `.gitmodules` at local
   HEAD, 2026-10-13) — the migrated layout, the same as connect_other_ais. `wsl_care`'s CI runs `pin-check` and
   `adapter-check` (`.github/workflows/family-checks.yml:50,54`), so the promotion reddens it, and its bump must carry
   the same hook copies and settings entries as row 5. `dew_flow_vscode_kit`'s local HEAD (`34338f4`) showed no such
   workflow; NOT checked: its `origin/main`. Both are bumped between rows 4 and 5, carrying row 5's files; adding them
   to the README's *Consumers* table rides this PR.
4. **E3's observation** (§4), then the record, then this plan's promotion.

## 4. E3 — what is observed, and when it is done

Nothing here is run by hand into `~/.claude`; the point is that the self-install does it.

1. **The first session in a migrated consumer after its bump** — expected in connect_other_ais — prints the
   self-install's one `systemMessage` line (installed). Record the repository, the time, and whether rag_qln was bumped
   yet (it is the mid-cascade case of §5 when it was not).
2. **The install is whole:** `node .agents/conventions/tools/install-user-hook.mjs --check` in that consumer is clean and
   prints the provenance manifest (source path, sha256, `GUARD_VERSION` 1, `self-install`); `~/.claude/settings.json`
   has exactly one `PreToolUse` `Agent|Task` handler pointing at `~/.claude/hooks/subagent-model.mjs`, and its
   `modelSettings` still carries `opus: high` (D11).
3. **A second session in the same consumer is silent** — the equal version writes nothing.
4. **The plain-session refusal check:** in a directory with no adapter (a scratch `git init`, never a family checkout),
   one Agent call without `model` is refused with the `subagent-models.md:` reason carrying the role table, and one with
   `model: "sonnet"` runs and the parent receives the one-line role digest as context.
5. **Recorded** in `research/RESULTS_subagent_model_tiers.md` (a § *E3 — the self-install observed*), the promoted plan's
   E3 line updated, this plan promoted.

**Done when:** `release` moved once; every bumped repository's `pin-check` green, and `adapter-check` green in each
migrated one; steps 1–4 observed and recorded; `node tools/plan-lifecycle.mjs` clean after this plan's promotion.

## 5. Risks

| Risk | Answer |
|---|---|
| **Mid-cascade activation (accepted, not harmless — E4 consultation, second turn).** The first migrated consumer's session after its bump installs the user-level guard while rag_qln (and any repository not yet bumped) still loads the old rule, which demands an explicit model but not a bare alias; a session there naming `claude-opus-5-5` is refused | the refusal names the alias and the session relaunches; the window is from that first session to rag_qln's merge — one bump with the order above. Not starting a session in a migrated consumer until rag_qln is merged closes it entirely, at the cost of a delayed observation |
| The guard reaches repositories that carry no rule at all (outside the family, scratch folders) | by design (D8): the refusal carries the role table in ≤ 600 B, so a session learns it without the rule |
| A bump PR sits red while others wait on it | the bare-bump practice of the local-CPU-budget rollout: a pin-only PR merged within the hour, anything else in a second PR |
| The user-level and project copies disagree after a later release | `install-user-hook.mjs --check` in E3's done-when; re-running the installer is a step of every later release that raises `GUARD_VERSION` |

**Growth.** Nothing new. The installer writes one `settings.json.bak-subagent-model-<stamp>` per write of
`~/.claude/settings.json` and never prunes them (`settings/hooks/lib/user-guard-install.mjs:27,161`); at one write per
`GUARD_VERSION` raise that is a few kilobytes a year. Proposed: kept for forensics, deleted by hand; the operator
confirms.

## 6. Test plan

- Each consumer's own CI: `pin-check`, and `adapter-check` + `plan-lifecycle` where it runs them.
- rag_qln: its build run for the two code pins.
- The observations of §4, recorded with what was seen, never inferred.
- Here: `node tools/plan-lifecycle.mjs` clean after the promotion.

## 7. Definition of Done

- [ ] PR #65 merged; `release` promoted once to its sha, with a reason.
- [ ] The six bumps merged in the order of §3, rag_qln last with both code pins; each `pin-check` green.
- [ ] connect_other_ais carries the three hook files and both settings entries; its `adapter-check` green.
- [ ] `wsl_care` and `dew_flow_vscode_kit` bumped, each carrying the hook files and settings entries.
- [ ] The cross-repository citations in benchmark and connect_other_ais name `research/PLAN_subagent_model_tiers.md`.
- [ ] E3 observed: the self-install line, `--check` clean, a silent second session, the plain-session refusal and pass.
- [ ] RESULTS records E3; the promoted plan's E3 line updated; this plan promoted to `research/`.
