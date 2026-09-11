# Rollout — one shared source for Claude Code and Codex

A consumer pins one checkout at `.agents/conventions`, keeps project-specific instructions
in `.agents/PROJECT.md` and `.agents/rules`, and uses the root adapters described in
[ENTRY.md](ENTRY.md). Host permissions and personal settings remain separate.

## Migrate an existing consumer

Choose a reviewed conventions commit reachable from the remote before publishing a consumer
pin. Run from a conventions checkout with `npm ci --ignore-scripts` completed:

```text
node tools/migrate-rules.mjs --repo <consumer> --conventions <source> --sha <approved-sha> --base origin/main --output <new-worktree> --branch feat/shared-rules
```

Default mode is read-only: it validates committed inputs, the selected SHA and instruction
links, then prints the exact path/hash plan. Repeat with `--apply` to create a new worktree.
The source checkout stays untouched, including unfinished changes. Existing outputs, extra
policy sources and host settings referencing the old mount require reconciliation.
The tool preserves the submodule URL/section, settings and unrelated code pins.

In the prepared worktree:

```text
npm ci --ignore-scripts --prefix .agents/conventions
node .agents/conventions/tools/rules.mjs check --repo .
node .agents/conventions/tools/rules.mjs explain --repo . --task inspect --file <planned-file>
node .agents/conventions/tools/rules.mjs read --repo . --task inspect --file <planned-file>
node .agents/conventions/tools/gate-snippet-check.mjs
```

Large reads require one `--only <id>` at a time, with the same scope. Check complete BEGIN/END
bodies and hashes. Actual SHA is compared with the staged gitlink; HEAD is reported separately.
Commit only the reported paths after reviewing the diff and running the consumer's checks.

The default rewrite allowlist is root README/POST_DEPLOY and `.github/workflows`. Add repeated
`--rewrite scripts/check.ps1` for specific tracked operational scripts under tools/scripts/deploy.
The report names remaining legacy references and dirty inputs; inspect those before approval.
Output must be outside both source checkouts. Review product
adapters separately; the tool does not rewrite product source code or historical research. Unscoped
local rules receive every supported task, including inspection. Scoped frontmatter is refused
until its applicability has an explicit mapping.

## Native agent smoke

Run against a disposable worktree, with Node 20+ and the installed vendor CLI:

```text
node tools/smoke-rules.mjs --repo <worktree> --agent claude --file src/Example.cs --file ui/Example.ts
node tools/smoke-rules.mjs --repo <worktree> --agent codex --cwd src --file src/Example.cs
```

Use `--cli <installed-executable-or-js-entry>` for a nondefault CLI installation. Windows shell
wrappers are refused; native executables and installed npm JavaScript entries are supported.
Use native Git worktrees for each OS: Windows absolute paths in a worktree's `.git` file are
not Linux paths. Create a separate Linux checkout/worktree for WSL; do not rewrite shared metadata.

Windows containment requires PowerShell 7 with local scripts permitted by existing policy;
the tool never changes execution policy. Linux uses a process group. Each cell has a
180-second deadline and a 256 KiB output cap. The Windows supervisor owns a kill-on-close
Job Object, so an exited direct child cannot strand its descendants.

The harness checks full canonical bodies in successful tool outputs, CLI completion and
unchanged Git HEAD/index/status plus instruction, selected rule, requested file and known host
setting content. Other file bodies are not hashed. Snapshots refuse more than 512 files,
1 MiB per source or 8 MiB total. A final model claim alone is insufficient. Successful source reads
still require review of the recorded final answer for behavioral compliance. Quota, denied
permissions, absent CLI and incomplete output are failures. No installs, login, account
switching or automatic retries occur.

Claude smoke is for trusted repositories: its auto-approved Bash commands are limited to
the chosen resolver's check/explain/read operations, alongside read/search tools. This is not
an OS sandbox and does not override inherited host permissions. Progress goes to stderr;
stdout remains the final JSON evidence.

Two fixed evidence slots per worktree live under Git metadata (`rules-smoke/latest-*.json`),
at most 32 KiB each plus atomic-write temporary files. A new run replaces that agent's previous
evidence. Full transcripts are not retained. Export reviewed evidence into `research/` when
it belongs in the durable rollout record. Global/managed instructions remain host inputs;
the harness cannot prove absence of all external policy or external effects.

## CI and fresh clone

```yaml
- uses: actions/checkout@v4
  with:
    submodules: true
- uses: actions/setup-node@v4
  with:
    node-version: 22
- run: git submodule update --init .agents/conventions
- run: npm ci --ignore-scripts --prefix .agents/conventions
- run: node .agents/conventions/tools/rules.mjs check --repo .
- run: node .agents/conventions/tools/plan-lifecycle.mjs
- run: node .agents/conventions/tools/gate-snippet-check.mjs
- run: node .agents/conventions/tools/build-flags-check.mjs
```

`build-flags-check` is safe to add everywhere: a repository with no C# in it passes without an
opinion, so the Rust and TypeScript consumers need no exception. In a .NET consumer it goes in with
that repository's root `Directory.Build.rsp` in the SAME commit, so the step is green the day it
lands rather than red until somebody follows up — see
[csharp/dotnet-build.md](csharp/dotnet-build.md).

Keep existing HTTP/post-deploy and pin-freshness checks. Pin freshness compares committed
pins with remote tips; during rollout an approved older pin is intentional and recorded
explicitly. Do not silently update code dependencies to make a rules migration pass.
A fresh clone needs the same initialization/install before either agent loads rules.
The public conventions URL must remain accessible to consumers.

## Recovery and later updates

An interrupted migration leaves the disposable output and an incomplete journal in Git
metadata (`rules-migration.json`), naming the original base. Inspect before retrying; the
tool never resets a caller checkout. Create a fresh output/branch from that recorded base,
retaining the incomplete output until its changes are accounted for.
If journal creation itself fails, the error still names the output, branch and original base;
preserve that output and use a fresh output/branch after inspection. Recovery never depends
on an unreadable or absent journal.

A published migration rolls back through a revert PR restoring the previous gitlink,
adapters and paths together. In a disposable clone, deinitialize the neutral submodule,
check out the recorded base, then initialize `.claude/rules/shared`; the integration test
performs this with a real Git submodule. Never use destructive recovery in a shared checkout.

For later updates fetch the reviewed commit into the mount, check out that exact SHA, run
checks, stage the gitlink and open a bump PR. Never use remote HEAD as a missing-instruction
fallback. Migrate the canary first; update pinned repositories before their consumers,
and build whenever a code pin changes.
