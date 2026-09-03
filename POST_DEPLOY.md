# Post-deploy checks — dew_flow_conventions

This repository deploys by being **pinned**. A rule is live in a consumer when that consumer's commit
points at a commit of this one that contains it — so "what is running" here is a submodule pin, and the
failure mode is the one the README already records: the 2026-08-19 audit found three consumers two
commits behind, one of them missing `gpu-lease.md` entirely, while everything reported success.

Target: a consumer checkout, given as `$TARGET` (e.g. `--target d:/rsd/dew_flow_mcp`)
Last verified: 2026-09-03 · d:/rsd/dew_flow_mcp · pin fd01c72 (both items PASS)

| # | What a person loses if this is broken | Check | Auto |
|---|---|---|---|
| 1 | A session in that repository silently works under rules that do not include the newest one — the exact failure the file names, invisible from inside | `node -e "process.exitCode=+(require('fs').existsSync(process.env.TARGET + '/.claude/rules/shared/common/http-contracts.md') ? 0 : 1)"` | auto |
| 2 | The pin lags this repository's tip, so the rule exists here and nowhere that reads it | `node -e "process.chdir(process.env.TARGET); require('child_process').execFileSync(process.execPath, ['.claude/rules/shared/tools/pin-check.mjs'], { stdio: 'inherit' })"` | auto |

Both commands are written as `node -e` rather than shell one-liners on purpose: this family develops on
Windows and runs CI on Linux, and `test -f` / `%TARGET%` each work in only one of those. A checklist
command that runs in one shell is a checklist item that is skipped on the other.
