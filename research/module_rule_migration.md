# Rule migration and native-agent smoke

`tools/migrate-rules.mjs` prepares a disposable consumer worktree from a named committed
base. `tools/lib/rule-migration.mjs` validates the legacy mount, selected conventions SHA,
local sources and Markdown links before any mutation. The source checkout's working files
are untouched. Git still updates its normal shared worktree/submodule bookkeeping.

Apply moves the existing submodule through Git, synchronizes its recorded URL and moves
project/local policy into the neutral tree. Settings, ignore files and code gitlinks remain
unchanged. Only named migration paths are staged. A journal in the worktree's Git metadata
records the base, selected version and changed path hashes; dry-run reports are capped at
250 KiB, leaving space for final status/error within a 256 KiB budget. A partial worktree
is retained with an incomplete report rather than reset or deleted.

Unscoped local rules map to every known task, including inspect. Existing scoped frontmatter,
untracked policy, old-mount host settings and conflicting neutral sources fail preflight.
Operational rewrites default to README/POST_DEPLOY and workflows. Repeated `--rewrite` can
name tracked scripts under tools/scripts/deploy; host configuration remains protected.
The bounded journal lists remaining legacy references and dirty source inputs relative to HEAD;
the selected committed base is still the source of migrated content. Output must be outside
both the consumer checkout and conventions checkout, including resolved ancestor aliases.
Product code adapters are a separate reviewed consumer change. Markdown links are rebased
and validated. A neutral mount directory, PROJECT or local rule tree without a declared
neutral mount fails the gate-snippet check. The conventions source itself is distinguished
by the installed tool's root. Migration and smoke share the bounded runner in `tools/lib/git.mjs`.
Preflight separates destination validation, source/version validation and patch construction.
Smoke report/lock ownership and vendor trace decoding are separate functions so failure
handling can be reviewed independently. Both Git callers retain the same operator-owned
PATH trust boundary documented for the resolver; the scoped S4036 decision covers this helper too.
Reference-style Markdown definitions are refused in preflight with the source named; callers
must convert them to inline links before migration. A journal-creation failure reports the
output, branch and base even when writing the failure journal also fails. A real checkout
hook test creates a directory at the expected journal path to exercise this failure.

`tools/smoke-rules.mjs` runs an installed native CLI against a disposable worktree. It calls
the mounted resolver to establish expected sources, asks the agent to discover its own
instructions, and examines successful tool-result bodies. Assistant prose cannot substitute
for a canonical source read. `tools/lib/rule-trace.mjs` also correlates successful output
with the selected resolver's `read` invocation (Claude tool-use id or Codex command event).
A duplicate script, unlinked output, shell chain or unsupported command shape is incomplete
evidence. The prompt requests one absolute resolver command per call. A restricted parser
accepts direct Node invocations and one recognized shell wrapper; it is not a shell interpreter.
Reports include source-command hashes and at most eight 512-character resolver-call diagnostics.
Each accepted invocation must also name exactly one `--repo` matching the inspected worktree.
Malformed native streams return explicit incomplete evidence and the parser error kind, without
persisting raw trace excerpts in the error. Windows supervisor failures carry a per-launch
marker distinct from a target's own exit 125; the bounded smoke report keeps that spawn error.
CLI completion, complete bodies, and unchanged checkout state
are separate evidence; the final answer still needs behavioral review. The latest result
per agent is stored atomically in Git metadata, with two fixed 32 KiB slots. Full model traces
are captured only in memory, limited to 256 KiB. A lock prevents concurrent ownership of a slot.
A quota failure is recorded without a retry or changing accounts.

The installed mounted resolver takes precedence over an unrelated root ENTRY. Self-host
fallback requires the exact source bootstrap. Native CLIs use PATH/default installed locations
or explicit `--cli` executables/JavaScript entries, never shell wrappers. Claude auto-approval
allows only this resolver's check/explain/read commands, not arbitrary Node programs. This is
trusted-repository inspection, not a hostile-repository OS sandbox; inherited host permissions
remain effective. Start/progress diagnostics go to stderr every 20 seconds during execution.

The unchanged check hashes Git HEAD/index/status and instruction, selected rule, requested file
and known host-setting content. It does not hash unrelated file bodies. Content is capped at
512 paths, 1 MiB per file and 8 MiB total; symlink escapes, directories and excess sizes fail.
Git commands have 30-second/4 MiB output bounds. The report names the measured scope explicitly.

`tools/lib/proc.mjs` supplies bounded capture and cancellation. Smoke opts into containment:
Linux uses a process group and Windows uses PowerShell 7 plus `process-job.ps1`, which creates
the child directly in a kill-on-close Job Object through `PROC_THREAD_ATTRIBUTE_JOB_LIST`.
Only duplicated standard handles are inherited; the job handle remains with the supervisor.
The supervisor is hidden, uses exe/argv and never changes execution policy. Timeout closes
that supervisor and therefore terminates the job. The common helper's other callers retain
their existing shell/taskkill behavior, with a 4 MiB capture cap; this change does not claim
that their Windows process-tree backlog is closed.

Observed during development: merely assigning the packaged PowerShell supervisor to a job
did not make its Process.Start child a member. The timeout test exposed surviving processes.
Explicit assignment during native process creation fixed the tested boundary; the regression
now checks actual process disappearance and wall time, not just a timeout flag.

References: [Windows jobs](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects),
[atomic job assignment](https://devblogs.microsoft.com/oldnewthing/20230209-00/?p=107812).
See [ROLLOUT](../ROLLOUT.md) for commands and recovery, and [module_tests](module_tests.md)
for the scenario catalog. Windows 10+/PowerShell 7 and Linux/WSL are the supported smoke hosts.
