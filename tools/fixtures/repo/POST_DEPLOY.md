# Post-deploy checks — fixture repository

A fixture for `post-deploy-check.mjs`, shaped exactly as `common/post-deploy-checks.md` requires. Its
one automated item reads `$TARGET`, so a run with `--target ok` passes and any other target fails —
which is how the test proves the target reaches the command as an environment variable rather than
being pasted into it.

Target: the fixture "deployment", addressed as `$TARGET`
Last verified: 2026-09-03 · ok · fixture

| # | What a person loses if this is broken | Check | Auto |
|---|---|---|---|
| 1 | Nothing reaches the deployment at all | `node -e "const ok=process.env.TARGET==='ok';if(ok)console.log('fixture target reached');process.exitCode=+(ok?0:1)"` | auto |
| 2 | The editor command opens no panel | Run the command from the palette and watch the panel appear | manual |
