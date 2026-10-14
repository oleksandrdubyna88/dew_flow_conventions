---
id: "common.test-leftovers"
load: "conditional"
tasks: ["implement","test","audit","policy","release"]
---
# Test leftovers are named `testsToDelete-…` (MANDATORY)

Whatever a test run, a probe or a measurement creates OUTSIDE its own process — a container, a Docker
volume or network, a git worktree, a branch, a temp or scratch folder, a database, a queue — carries
the prefix **`testsToDelete-`** in its name: `testsToDelete-<what>-<short id>`
(`testsToDelete-pg-3f9a1c`, `testsToDelete-wt-gate-e2e-1a2b`). For a worktree or a folder, the prefix is on its OWN name — the last path component — not on a parent folder. The run still removes what it created
(`finally`, `DisposeAsync`, `afterAll`); the prefix is the safety net for the run that crashed, was
killed, or timed out before its cleanup ran — so one sweep finds every leftover and nothing else.

## Containers

Containers are the leftover that costs most: they stay up for weeks, holding memory, CPU and ports.
So, in addition to the name:

- **`docker run --rm`** for every container a test or script starts by hand — Docker removes it the
  moment it stops, whatever stopped it.
- **A Testcontainers fixture keeps the reaper (Ryuk) on** — it removes the run's containers when the
  test process dies. Never set `TESTCONTAINERS_RYUK_DISABLED=true` in a test environment, and name the
  container with the prefix too (`.WithName($"testsToDelete-pg-{Guid.NewGuid():N}"[..24])` or the
  language's equivalent).
- A long-lived container a test REUSES on purpose is not a leftover: it carries no prefix, and its
  reuse is written down where it is started.

## The sweep

Where a namespace refuses capitals — Docker image names, unquoted SQL identifiers, Kubernetes
objects — use the lowercase `teststodelete-` (or `teststodelete_`). The sweep therefore matches the
prefix **case-insensitively and anchored at the start of the name** — `docker ps --filter name=…` is a
substring match and would also hit `prod-testsToDelete-cache`, so it is not used.

**The sweep is a janitor, not a teardown.** It matches every prefixed resource on the host, including
those of a run still in progress in another repository or CI job on the same Docker daemon — so run it
only when no test run is in flight on that machine. A run's own teardown removes exactly what that run
created, by the full name it generated (`testsToDelete-pg-3f9a1c`), never by the prefix.

Containers, volumes, networks, worktrees, branches and temp folders. Run it as a bash script, not
line by line: `pipefail` makes a stopped Docker daemon fail the sweep instead of reporting success.
The git lines run inside the repository being swept; worktrees go before branches, because a branch
checked out in a worktree refuses deletion:

```bash
set -euo pipefail
docker ps -a --format '{{.Names}}' | { grep -i '^testsToDelete-' || true; } | xargs -r docker rm -f
docker volume ls -q | { grep -i '^testsToDelete-' || true; } | xargs -r docker volume rm
docker network ls --format '{{.Name}}' | { grep -i '^testsToDelete-' || true; } | xargs -r docker network rm
git worktree list --porcelain | sed -n 's/^worktree //p' | { grep -i '/testsToDelete-[^/]*$' || true; } |
  while IFS= read -r path; do git worktree remove --force "$path"; done
git for-each-ref --format='%(refname:short)' refs/heads | { grep -i '^testsToDelete-' || true; } | xargs -r git branch -D
find "${TMPDIR:-/tmp}" -mindepth 1 -maxdepth 1 -type d -iname 'testsToDelete-*' -mmin +60 -exec rm -rf -- {} +
```

(`grep` exits 1 when nothing matches; `|| true` keeps "no leftovers" a success while a failing
`docker` still fails the pipe.)

On Windows the temp line is
`Get-ChildItem $env:TEMP -Directory -Filter 'testsToDelete-*' | Where-Object LastWriteTime -lt (Get-Date).AddHours(-1) | Remove-Item -Recurse -Force`.
The one-hour age leaves alone a folder a run is still using.

Databases, schemas and queues have no command common to every stack, so this sweep does not claim
them: the repository that creates them keeps its own sweep beside the fixture (a script or a
test-setup step that drops what matches the anchored prefix) and names it in its testing docs.

## Never

- Never widen the sweep beyond the anchored literal prefix (no `test*`, no `tmp*`, no unanchored match).
- Never sweep with a variable that can be empty (`rm -rf "$DIR/"*` with `$DIR` unset deletes from the root).
- Never give the prefix to something that must survive the run — the prefix is a promise that deleting it is safe.

## Definition of Done

- [ ] Everything the run created outside its process is named `testsToDelete-…` and removed by the run.
- [ ] Every container started by hand ran with `--rm`; Testcontainers' reaper stayed on.
