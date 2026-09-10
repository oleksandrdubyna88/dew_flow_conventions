# Post-deploy checks — dew_flow_conventions

This repository is delivered through reviewed consumer gitlinks. The actual mounted version,
working loader and the rules each native agent reads must agree before a rollout is complete.

Target: a migrated consumer checkout, given as `$TARGET`
Last verified: 2026-09-03 · d:/rsd/dew_flow_mcp · legacy pin fd01c72; neutral-layout verification pending

| # | What a person loses if this is broken | Check | Auto |
|---|---|---|---|
| 1 | Required rules are unavailable or the mounted source differs from the approved gitlink | `node -e "const p=require('path'); require('child_process').execFileSync(process.execPath,[p.join(process.env.TARGET,'.agents/conventions/tools/rules.mjs'),'check','--repo',process.env.TARGET],{stdio:'inherit',timeout:15000})"` | auto |
| 2 | A second local gate copy overrides the policy the company reviewed | `node -e "const p=require('path'); require('child_process').execFileSync(process.execPath,[p.join(process.env.TARGET,'.agents/conventions/tools/gate-snippet-check.mjs')],{cwd:process.env.TARGET,stdio:'inherit',timeout:15000})"` | auto |
| 3 | One native agent starts but never reads the required policy | Run `tools/smoke-rules.mjs` for both native CLIs against a disposable worktree at the delivered consumer commit; inspect successful source reads and the final constraints | manual |

The Git/version check validates the selected commit, not automatic adoption of remote HEAD.
Old-layout consumers retain their previous verified runbook until their migration PR lands.
No item is marked verified from a build or from a model's self-report alone.
