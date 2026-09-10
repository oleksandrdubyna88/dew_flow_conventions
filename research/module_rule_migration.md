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
Operational rewrites are restricted to README/POST_DEPLOY and workflows; product code adapters
are a separate reviewed consumer change. Markdown links are rebased and validated.

`tools/smoke-rules.mjs` runs an installed native CLI against a disposable worktree. It calls
the mounted resolver to establish expected sources, asks the agent to discover its own
instructions, and examines successful tool-result bodies. Assistant prose cannot substitute
for a canonical source read. CLI completion, complete bodies, and unchanged checkout state
are separate evidence; the final answer still needs behavioral review. The latest result
per agent is stored atomically in Git metadata, with two fixed 32 KiB slots. Full model traces
are captured only in memory, limited to 256 KiB. A lock prevents concurrent ownership of a slot.
A quota failure is recorded without a retry or changing accounts.

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
