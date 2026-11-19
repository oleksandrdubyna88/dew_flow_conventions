# Post-deploy checks — dew_flow_conventions

This repository is delivered through reviewed consumer gitlinks. The actual mounted version,
working loader and the rules each native agent reads must agree before a rollout is complete.

Target: a migrated consumer checkout, given as `$TARGET`
Last verified: 2026-11-19 · dew_flow_connect_other_ais main 4ec6cf3d · pin 5d2d5ec (items 1–2 automated PASS; item 3 run: claude + codex inspect read the inspect-selected rules, held-gate behaviour pass on the gate rule; the other three coai rules are selected for implement/policy and were not shown read)

| # | What a person loses if this is broken | Check | Auto |
|---|---|---|---|
| 1 | Required rules are unavailable or the mounted source differs from the approved gitlink | `node -e "const p=require('path'); require('child_process').execFileSync(process.execPath,[p.join(process.env.TARGET,'.agents/conventions/tools/rules.mjs'),'check','--repo',process.env.TARGET],{stdio:'inherit',timeout:15000})"` | auto |
| 2 | A second local gate copy overrides the policy the company reviewed | `node -e "const p=require('path'); require('child_process').execFileSync(process.execPath,[p.join(process.env.TARGET,'.agents/conventions/tools/gate-snippet-check.mjs')],{cwd:process.env.TARGET,stdio:'inherit',timeout:15000})"` | auto |
| 3 | One native agent starts but never reads the required policy | Run `tools/smoke-rules.mjs` for both native CLIs against a disposable worktree at the delivered consumer commit; inspect successful source reads and the final constraints. It reads the rules selected for task `inspect`; in a consumer whose required rules are selected for another task, run it once per such task with `--task <task>`, and name the rules with `--only <id>` (repeatable) for the rules the item must show read; a run proves only the ids it names, so cover every required rule in one or more runs, and a selected rule larger than what the host keeps of one output (the coai repository's `common.test-leftovers-detail`, 32,126 B) cannot be shown read by any native run: say so in the record, and rely on its body record and tests for it. Example, in the coai repository, whose four coai rules are selected for `implement`: `--task implement --only common.coai-review-gate --only common.coai-document-gate --only common.coai-feature-gate --only common.coai-question-consultant` | manual |

The Git/version check validates the selected commit, not automatic adoption of remote HEAD.
Old-layout consumers retain their previous verified runbook until their migration PR lands.
No item is marked verified from a build or from a model's self-report alone.
