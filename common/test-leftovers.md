---
id: "common.test-leftovers"
load: "conditional"
tasks: ["implement","test","audit","policy","release"]
---
# Test leftovers are named `testsToDelete-…`, owned by their run, and collected (MANDATORY)

<!-- core:begin -->
Whatever a test run, a probe or a measurement creates OUTSIDE its own process — a container, a Docker volume
or network, a git worktree, a branch, a temp folder, a database, a schema, a queue, a store collection — keeps
four promises: **named** by one helper, **owned** by the run that made it, **removed** by that run, **collected**
by the next run when this one was killed. Every repository keeps all four, in its own language, against this
one text.

## 1. The name — one form, three spellings

`testsToDelete-<repo>-<what>-<id>`, e.g. `testsToDelete-api-pg-k3f9a1`.

- **`<repo>`** is the repository's token, `[a-z0-9]{2,12}`, written in exactly ONE constant of its helper. A
  guard and a sweep match `^testsToDelete-<repo>-` anchored and case-insensitively, and **nothing ever parses
  past the repo token** — `<what>` may contain the separator. **A token is registered before it is used**: the
  rule repository a repository mounts carries, outside this shared text, a `## Tokens` table — a rule repository
  lists every token that can share a machine with its family; a public one lists only its own, and the private
  one carries both — so two repositories on one machine never sweep each other; a guard refuses a helper
  constant that is not a row of the mounted table.
- **`<what>`** obeys only the namespace it lives in: for a folder or worktree, anything the file system accepts
  except path separators, NUL and control characters — spaces and non-ASCII are allowed on purpose, they are
  what a path test must cover — and never a leading `-`.
- **`<id>`** is random (a counter or a timestamp alone collides across two runs): 6 to 12 characters of
  `[A-Za-z0-9]`, lowercase where the namespace folds case. A `mkdtemp`'s six qualify.
- The whole name is at most **63 characters** — a SQL identifier, a DNS label and a Windows temp path survive.
- **Three spellings, one prefix.** `testsToDelete-` for containers, volumes, networks, worktrees, branches and
  folders; `teststodelete-` where a namespace refuses capitals (image names, Kubernetes objects);
  `teststodelete_` where it refuses `-` (SQL identifiers — then every separator is `_`:
  `teststodelete_api_pg_k3f9a1`). Every guard, sweep and janitor matches `^teststodelete[-_]`
  case-insensitively; an unanchored or single-case match is a bug.
- **What dies with its container needs no name of its own.** A branch, clone or worktree INSIDE a repository
  that lives in an owned folder carries no prefix and no owner — it goes with the folder. The prefix is on the
  OWN name of what lives in a shared namespace: the leaf of a folder or worktree, never a parent.

## 2. The helper — one per repository, in its language

Every test-created name comes from one module that does, in the order that leaves no window: **create** the
resource under a name it generated · **register the cleanup as the very next statement** (`using`/`DisposeAsync`,
`Drop`, `t.after`, `finally`, `trap … EXIT`) · **claim** it with the owner of §3 — or, where the claim can precede
the resource (a held lock, a registry row), **claim first, then create**, so nothing ever exists unclaimed. A
claim that cannot be written is a resource the run does not create: the helper removes what it made and throws.

Teardown **removes by the exact full name, never by the prefix**; **never throws** (in Rust never panics — a
panic in `Drop` during unwinding aborts the process); retries a bounded number of times with a short back-off
(five tries 100 ms apart is the family's figure); and on giving up leaves the resource **prefixed and
claimed**, writes ONE warning line naming it, and returns. An `rm` as a test's last statement is a leak with a
cleanup's shape — a failed assertion skips it (found in one repository, 2026-10-15).

## 3. The owner — who may delete what

Every prefixed resource carries its owner, **`<host>@<os>:<pid>[:<start>]`**: the machine name as the OS
reports it; `linux`, `macos` or `windows` (a Windows machine and its Linux subsystem answer to ONE name with TWO
pid spaces, measured 2026-10-15); the process id; and, **only where the OS gives it without spawning a
process** (a `/proc` read, a native process API — never a shell or PowerShell child per test process), the
process's start time as **integer Unix seconds, UTC**, from the OS's record of that pid — never the writer's
own clock at startup. A writer that would have to spawn to learn its start omits it. The owner never lives
inside the resource where a test can see it:

| Kind | Owner |
|---|---|
| folder | a sibling file `<folder>.owner` (inside, a git repository rooted at the folder sees an untracked file — real tests assert their exact status) |
| worktree | the lock: `git worktree add --detach --lock --reason "<owner>" <path> <ref>` (git ≥ 2.30); `prune` never touches a locked tree. A folder holding a `.git` FILE is a linked worktree of SOME clone, read through that file (`gitdir:` → `<gitdir>/locked`) — never judged as an unmarked folder; a lock that names nobody is unreadable |
| branch | none — it lives inside an owned folder (§1), or is made by that one `worktree add -b` for a prefixed worktree and removed with it |
| container, volume, network | `--label testsToDelete.owner=<owner>` on `run` / `volume create` / `network create`; a Testcontainers builder adds the same label |
| database, schema, queue, collection | **lock-owned** where the store has a session-held named lock (`GET_LOCK`, an advisory lock): the run takes the lock named after the resource BEFORE creating it and holds it for its lifetime — the lock is the whole owner, no marker, no age. Otherwise **marker-owned**: `<owner>` plus the creation time, written before the resource into a registry OUTSIDE it (a server-level table or key, a claim record) that no reset of the resource can wipe |

**Liveness, one procedure** → `live` / `gone` / `unknown`. A **lock-owned** resource first, since it carries no
owner string: lock held → `live`, lock free → `gone` (it was taken before the resource existed and dies with the
owner's session — no age is needed or read). Everything else: no owner, or one that is not exactly the form above
→ `unknown`; `<host>@<os>` not this machine's (case-insensitive) → `unknown`; **no process with that pid → `gone`
— the only other `gone` there is**; the liveness query refused or failed (`EPERM`, access denied, a missing tool)
→ `unknown`; alive, and the owner carries no start or the reader cannot read the live one without spawning →
`live`; alive, start times within **2 seconds** → `live`; further apart → `unknown` — a reused pid, or a wall
clock stepped between the write and the read (a time sync, a virtual machine after host sleep); a mismatch delays
reclamation and never deletes something live. Two seconds covers two one-second roundings; a wider window only
preserves more.

## 4. The start-of-run sweep — *age selects, owner liveness authorises, uncertainty preserves*

`finally` and `trap` do not run on `SIGKILL`, so naming is half the promise. Every repository that creates a
resource kind wires a sweep of that kind into the **start** of its test run (the runner's first lines,
`globalSetup`, a fixture's constructor), and it:

- matches **only its own `^testsToDelete-<repo>-`** — another repository's leftovers are not its business — and
  removes only worktrees its own `git worktree list` shows: a prefixed folder with a `.git` file it does not list
  is another clone's, preserved for that clone's sweep or the janitor;
- considers a resource only when it is at least **10 minutes** old (created or last written; for a marker-owned
  store, the time the registry recorded) — age is a selector that keeps the sweep off a resource still being set
  up, never the authority; a lock-owned store has no age and needs none;
- removes only on `gone`; **`live` and `unknown` preserve**, each with its reason in the report;
- treats an **unmarked** prefixed resource of the new form as `gone` once old enough (the helper claims within
  milliseconds or does not create), and matches an OLD prefix from before the migration only until a written
  end date in its configuration — age-only, because nothing live makes such a name any more;
- **never fails the run**: a sweep error is one reported line; the exit code is the tests'.

Age alone where a concurrent run can own the resource is forbidden: a measuring harness's run store did that
until 2026-08-16 and requeued a leg another worker was still measuring.

## 5. Containers

The costliest leftover. Beyond the name and the label:

- **`docker run --rm`** for every container a script starts by hand — removed whatever stopped it.
- **A Testcontainers fixture keeps the reaper on** (`TESTCONTAINERS_RYUK_DISABLED=true` is never set in a test
  environment, no exemption) and names its container with the prefix.
- **The carve-out: a container whose logs, exit code or state are read after it exits or fails** runs WITHOUT
  `--rm` (which destroys a crashing container's logs as it exits) — and then ALL of this holds, or a guard
  names it *permits dropping `--rm`*: an exact prefixed `--name`; every named volume prefixed and listed; a
  remover **on every path** — a later step of the same workflow job with `if: always()`, or in a shell a
  `trap … EXIT` registered on a line BEFORE the `docker run`; the remover **after every line that reads the
  container** (`docker logs|cp|inspect|wait|exec|diff`); exact commands — `docker rm -f -v <name>`, then
  `docker volume rm <volume>` per volume; and it **never decides the verdict** — `continue-on-error: true` on
  the step, `|| true` after each command in the trap.

## 6. Stores — isolate first, share only under the exact exception

Where a run can own its store it does: a per-run database or schema `teststodelete_<repo>_<what>_<id>`, a
per-run queue name, a per-run key prefix the application under test honours. Clearing a shared store is the
last resort, exempt from the name only in two shapes, written where a guard reads them (§7):

- **(a) A long-lived SHARED store**, only where the place that creates or configures it carries
  `testsToDelete-exempt: shared-store …` naming the exact endpoint and store name, saying the reuse is
  intentional, and naming after `lock:` the **enforced lock that serializes every reset against concurrent
  runs** — a session-held store lock (`GET_LOCK`, `pg_advisory_lock`), or an OS file lock where every run is on
  one machine. "Documented + truncate per test" without the lock is not exempt (two processes on one database
  erased each other's fixtures, 2026-10-14). A reset wider than the run's own names — flushing a logical
  database or namespace the run does not own exclusively, dropping a shared-name database — is never exempt; a
  per-run, prefixed logical database or namespace is the run's own name, and its teardown drops it whole.
- **(b) A database or schema inside a disposable Testcontainers container**, exempt from the name and from its
  own teardown when its whole lifetime is the container's: the fixture names the container with the prefix,
  keeps the reaper on, never sets reuse, disposes the container, and carries
  `testsToDelete-exempt: container-scoped — <what> lives and dies with <fixture>`.

## 7. The guard — what every repository's structural check refuses

A test over the repository's own test trees, scripts and CI, red on each class below outside the helper, and
red when it **scanned nothing** (exit 2, with a sentence — discovery broke; the repository is not clean):

| class | finding |
|---|---|
| `raw-temp` | any API that makes a temp path (`mkdtemp`, `tmpdir()`, `TEMP`/`TMP`/`TMPDIR`, `GetTempPath`, `temp_dir()`, `mktemp`) |
| `raw-worktree` | any `worktree add` |
| `docker-run` | a `docker run` with neither `--rm` nor the complete carve-out of §5 |
| `docker-name` | a `--name`, `volume create`, `network create` or `WithName` without one of the three spellings; an image tag only where a test step builds it — a job that builds and pushes the product image is the product, not a leftover |
| `shared-store` | a `DROP`, `TRUNCATE`, `FLUSH` or delete-all against an unprefixed name without exemption (a) |
| `ryuk-off` | `TESTCONTAINERS_RYUK_DISABLED` set to true — no exemption accepted |

**The exemption grammar — inline, one form:** a comment on the line or the line above,
`testsToDelete-exempt: <class> — <reason>`. The class is one of the table's (not `ryuk-off`); the reason is at
least ten characters and three words and not a placeholder (*needed*, *see above*, *todo*); for
`shared-store` it carries `lock:`. A reason-less, class-less or unknown-class exemption is a finding of class
`exemption`.

## The janitor

The **host-wide** tool — every token, every kind; neither a teardown nor the sweep of §4. It is a shipped,
tested script, not a block to paste: `tools/janitor.sh` in the rule repository, run from the mount
(`bash .agents/conventions/tools/janitor.sh` or `bash .claude/rules/shared/tools/janitor.sh`, `--dry-run` to
look first) from inside the repository whose worktrees and branches are swept; on Windows from **Git for
Windows' bash, never WSL's** (which sees neither the Windows temp root nor Windows pids). What it guarantees,
and what a copy of it must keep:

- **One capture.** Every prefixed resource is listed ONCE with its identity, owner and age before anything is
  decided; only captured, authorised items are deleted, by their captured id or path. A resource that appears
  after the capture is not touched in that run.
- **Age selects, the owner authorises, per resource.** A resource younger than the window (one hour) or of
  unknown age is left alone silently; a live owner, a foreign host, an owner it cannot read, a lock that names
  nobody, or a worktree whose lock it cannot read is **skipped** with one line naming it — never deleted;
  unmarked resources older than the window are nobody's and go. A worktree is judged by its lock, read through
  its `.git` file whatever clone owns it (a relative gitdir resolved against the worktree).
- **Exact removal.** Top-level links (a junction into a checkout) are unlinked before a worktree or folder is
  removed and `rm -rf` never crosses one; worktrees go before branches and folders; `docker ps --filter name=`
  (a substring match) is never used.
- **Honest exit.** 0 when nothing was skipped; 3 when something was; any other code is a docker or git failure
  — a stopped Docker daemon is a failure, not a clean machine (`pipefail`, and a failed listing removes
  nothing); a machine with no `docker` binary says so once and still sweeps git and the temp root.

Databases, schemas and queues have no command common to every stack: the repository that creates them keeps its
own prefixed sweep (§4) beside the fixture.
<!-- core:end -->

## Tokens

<!-- owns: coai — the registry must name the token a repository actually uses, and that one is its product's name -->

This family's tokens — the rows a guard here checks a helper's constant against. This repository is public and
lists only its own; the private twin rule repository carries these rows beside its own family's and checks that
every token across both is unique, so the wording of a row is frozen (its check is a line compare). (This family,
audited 2026-10-14: six repositories, 0 compliant sites, containers up for weeks — the backlog this rule names.)

| token | family | repository |
|---|---|---|
| `conventions` | dew_flow | the shared-rules repository |
| `creds` | dew_flow | the developer-credentials server and extension |
| `mcp` | dew_flow | the MCP server |
| `sidecar` | dew_flow | the embedding sidecar |
| `coai` | dew_flow | the multi-model review extension and server |
| `bench` | dew_flow | the measuring harness |
| `qln` | dew_flow | the code-search product |

<!-- core:begin -->
## Never

- Never widen a match beyond the anchored literal prefix (no `test*`, no `tmp*`, no unanchored match).
- Never sweep with a variable that can be empty (`rm -rf "$DIR/"*` with `$DIR` unset deletes from the root).
- Never give the prefix to something that must survive the run — the prefix is a promise that deleting it is safe.
- Never tear down by the shared prefix — teardown is by the exact names the run generated.
- Never let a start-of-run sweep reclaim by age alone, and never let it fail the run.
- Never drop `--rm` without the complete carve-out — a remover on every path, after the diagnostics, by exact name.
- Never put the owner inside the resource where the test under it can see it.

## Definition of Done

- [ ] Everything the run created outside its process is named `testsToDelete-<repo>-<what>-<id>` by the helper, claimed, and removed by the run by its exact name.
- [ ] Every container started by hand ran with `--rm` or under the complete carve-out; Testcontainers' reaper stayed on.
- [ ] The repository's start-of-run sweep collects its own token's leftovers on owner liveness; its guard is red on every class of §7 and on a scan of nothing.
- [ ] Every shared store a test clears is per run or carries exemption (a) with its lock; every container-scoped database carries exemption (b).
<!-- core:end -->
