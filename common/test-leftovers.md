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
  that lives in an owned folder — and a row, key, queue, index, schema or account INSIDE a database, store
  container or claimed namespace the run owns — carries no prefix and no owner: it goes with what holds it.
  The prefix is on the OWN name of what lives in a shared namespace: the leaf of a folder or worktree, the
  database, never a parent and never a row.

## 2. The helper — one per language a repository tests in

Every test-created name comes from one module per test language — a repository that tests in bash, Node and C#
has three, each holding the token ONCE, and its guard checks that the constants are equal and are one row of the
mounted table — that does, in the order that leaves no window: **create** the
resource under a name it generated · **register the cleanup as the very next statement** (`using`/`DisposeAsync`,
`Drop`, `t.after`, `finally`, `trap … EXIT`) — inside a hook or a test whose teardown pair is registered first,
never at module load: a runner that filters every test of a file away skips the file's hooks, and a resource
made at import time then has no remover — · **claim** it with the owner of §3 — or, where the claim can precede
the resource (a held lock, a registry row), **claim first, then create**, so nothing ever exists unclaimed. A
claim that cannot be written is a resource the run does not create: the helper removes what it made and throws.

A folder is created, then registered, then claimed. Where the platform has no exclusive folder create (C#:
`Directory.CreateDirectory` succeeds on an existing folder), the helper MAY claim first with an exclusive write
(`FileMode.CreateNew`, like Node's `wx`) and then create the folder: the exclusive claim is what detects a name
collision there. So a claim whose folder does not exist — an **orphan claim**, left by a run that died between the
two — is collectable like any claim: its owner judges it (`gone` removes the claim; `live` and `unknown` keep it).

A library or child process that makes temp paths of its own (an in-memory database's data path, a script's
`mktemp`) is handed an owned folder to make them in — its data-path option, or `TMPDIR`, `TEMP` and `TMP` in the
child's environment — so what it makes dies with the folder; the guard cannot see such paths, the helper's seam
is what covers them.

Teardown **removes by the exact full name, never by the prefix**; **never throws** (in Rust never panics — a
panic in `Drop` during unwinding aborts the process); retries a bounded number of times with a short back-off
(five tries 100 ms apart is the family's figure); and on giving up leaves the resource **prefixed and
claimed**, writes ONE warning line naming it, and returns. An `rm` as a test's last statement is a leak with a
cleanup's shape — a failed assertion skips it (found in one repository, 2026-10-15).

## 3. The owner — who may delete what

Every prefixed resource carries its owner, **`<host>@<os>:<pid>[:<start>]`**: the machine's DNS host name
(`hostname`, Node `os.hostname()`, C# `Dns.GetHostName()`), compared case-insensitively — never the NetBIOS name
(C# `Environment.MachineName`, `%COMPUTERNAME%`: upper-case, cut at 15 characters), with each run of `@`, `:` or
whitespace in it written as ONE `-` (nothing is trimmed, the case is kept — every reader applies this same rule
before it compares) — and under WSL (`$WSL_DISTRO_NAME` set) `~` and the distribution's name, normalised alike:
`devbox~Ubuntu`, because distributions share one host name and one Docker daemon but each has its own pid space;
`linux`, `macos` or `windows` (a Windows machine and its Linux subsystem answer to ONE name with TWO pid spaces,
measured 2026-10-15); the id of the process whose lifetime bounds the resource — the runner's parent process for
what a global setup makes, the script for what one script makes and removes; in a CI job, ONLY for a resource that
outlives the step that made it (a container a later step reads), the runner worker process — an ancestor of the
step's shell (`$PPID` of the step's own shell; a script a step launches sees the step's shell as its `$PPID`),
because the step's shell is gone before the job is. A hosted runner is discarded with its job and needs no owner
rule beyond this; a persistent self-hosted runner is a machine like any other. On a Windows bash step `$PPID` is 1
and `$$` an MSYS pid, never used there: take the step shell's Windows pid from `/proc/$$/winpid`, follow
`ParentProcessId` (`Get-CimInstance Win32_Process`) past the `bash.exe` shims — Git's launcher is one too — to the
first process that is not a `bash.exe` (measured from a Git Bash started by `pwsh`: that `pwsh`). Windows has no
pid 1, so `<host>@windows:1` is `unknown`. A
claim is ONE line (an LF or CRLF line end) of at most **512 bytes**: anything else — a second line, a lone CR, a
longer text — is unreadable. And, **only where the OS gives it without spawning a
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
| database, schema, queue, collection | **lock-owned** where the run holds a session-held named lock (`GET_LOCK`, an advisory lock) — on the store itself, or, for a store that has none (an index, a queue), on ONE lock server every sweeper of that kind consults first, the lock named after the resource —: the run takes the lock named after the resource BEFORE creating it and holds it for its lifetime — the lock is the whole owner, no marker, no age. Otherwise **marker-owned**: `<owner>` plus the creation time, written before the resource into a registry OUTSIDE it (a server-level table or key, a claim record) that no reset of the resource can wipe |

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

**The probe must not signal.** On Windows Python's `os.kill(pid, 0)` does NOT probe: it calls `TerminateProcess`
and KILLS the process (signal 0 becomes the exit code). A Python reader uses a non-destructive probe — `OpenProcess`
through `ctypes`, `psutil.pid_exists`, or `tasklist /FI "PID eq <pid>"` as the janitor does — and the same
three-valued rule applies.

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
  end date in its configuration — age-only for kinds that carried no owner, **by its OLD lock name for a kind that
  was lock-owned** (an old branch's run still holds it; age proves nothing about a lock). The end date counts
  from the day old branches and agent worktrees stop running the old suites, not from the merge;
- **never fails the run**: a sweep error is one reported line; the exit code is the tests'.

Age alone where a concurrent run can own the resource is forbidden: a measuring harness's run store did that
until 2026-08-16 and requeued a leg another worker was still measuring.

## 5. Containers

The costliest leftover. Beyond the name and the label:

- **`docker run --rm`** for every container a script starts by hand — removed when it stops, whatever stopped it,
  anonymous volumes included. `--rm` acts when the CONTAINER stops: a detached container whose starter was killed
  runs on, and is collected by the repository's start-of-run sweep through its label, then by the janitor. The
  run's own teardown is `docker rm -f -v <name>` by exact name.
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
per-run queue name, a per-run key prefix the application under test honours. A test that would write rows into a
store it does not own — the developer's database, a shared test database, a deployed environment's — isolates
instead: the run starts what it tests against on a store of its own. It never "cleans up" there: a row it cannot
name it cannot sweep, and a sweep that guesses deletes a user's. What a test may do against a store it does not
own is read. Clearing a shared store is the last resort, exempt from the name only in two shapes, written where a guard reads them (§7):

- **(a) A long-lived SHARED store**, only where the place that creates or configures it carries
  `testsToDelete-exempt: shared-store …` naming the exact endpoint and store name, saying the reuse is
  intentional, and naming after `lock:` the **enforced lock that serializes every reset against concurrent
  runs** — a session-held store lock (`GET_LOCK`, `pg_advisory_lock`), or an OS file lock where every run is on
  one machine. "Documented + truncate per test" without the lock is not exempt (two processes on one database
  erased each other's fixtures, 2026-10-14). A reset wider than the run's own names — flushing a logical
  database or namespace the run does not own exclusively, dropping a shared-name database — is never exempt; a
  per-run, prefixed logical database or namespace is the run's own name, and its teardown drops it whole.
- **(b) A database, schema or namespace inside a disposable container the run or its job owns** — a Testcontainers
  container, or a workflow `services:` container, which the runner removes with the job — exempt from the name and
  from its own teardown when its whole lifetime is the container's: a fixture names its container with the prefix,
  keeps the reaper on, never sets reuse and disposes it; a job names the service in the workflow; either carries
  `testsToDelete-exempt: container-scoped — <what> lives and dies with <fixture or job>`. The per-run path is still
  the better one where it exists (one code path for CI and a developer machine).

## 7. The guard — what every repository's structural check refuses

A test over the repository's own test trees, scripts and CI, red on each class below outside the helper, and
red when it **scanned nothing** (exit 2, with a sentence — discovery broke; the repository is not clean):

| class | finding |
|---|---|
| `raw-temp` | any API that makes a temp path (`mkdtemp`, `tmpdir()`, `TEMP`/`TMP`/`TMPDIR`, `GetTempPath`, `Directory.CreateTempSubdirectory`, `Path.GetTempFileName`, `temp_dir()`, `mktemp`). Not `RUNNER_TEMP`: the Actions runner empties it at the start and end of every job, hosted or self-hosted, so a path under it is job-scoped — no finding; a helper takes it as its temp root under Actions |
| `raw-worktree` | any `worktree add` |
| `docker-run` | a `docker run` with neither `--rm` nor the complete carve-out of §5 |
| `docker-name` | a `--name`, `volume create`, `network create`, `WithName`, `docker compose -p`/`--project-name` or `COMPOSE_PROJECT_NAME` (a compose project's containers carry the project's name) without one of the three spellings; an image tag only where a test step builds it — a job that builds and pushes the product image is the product, not a leftover |
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
Windows' bash, never WSL's** (which sees neither the Windows temp root nor Windows pids). `--token <t>` narrows
the sweep to `testsToDelete-<t>-…` (all three spellings, any case, anchored: `alpha` never matches `alphabet`);
it combines with `--dry-run`, and an invalid token or an unknown argument prints the usage line and exits 2 with
nothing touched. `JANITOR_MIN_AGE_MINUTES` (default 60) is whole minutes, digits only, at least 1; `--token` is 2 to 12 characters of
`[a-z0-9]`. A name or id holding a control character is refused with a skip line, `--dry-run` prints the same exit
code the real run would, and every test seam that is set is announced once on stderr. What it guarantees,
and what a copy of it must keep:

- **One capture.** Every prefixed resource is listed ONCE with its identity, owner and age before anything is
  decided; only captured, authorised items are deleted, by their captured id or path. A resource that appears
  after the capture is not touched in that run.
- **Age selects, the owner authorises, per resource.** A resource younger than the window (one hour) or of
  unknown age is left alone silently; a live owner, a foreign host, an owner it cannot read, a lock that names
  nobody, or a worktree whose lock it cannot read is **skipped** with one line naming it — never deleted;
  unmarked resources older than the window are nobody's and go. An orphan claim (§2) is judged like any other. A worktree is judged by its lock, read through
  its `.git` file whatever clone owns it (a relative gitdir resolved against the worktree).
- **Exact removal.** Top-level links (a junction into a checkout) are unlinked before a worktree or folder is
  removed and `rm -rf` never crosses one; a locked worktree is removed with `git worktree remove --force --force`;
  worktrees go before branches and folders; `docker ps --filter name=`
  (a substring match) is never used.
- **Honest exit.** 0 when nothing was skipped; 3 when something was; any other code is a docker or git failure
  — a stopped Docker daemon is a failure, not a clean machine (`pipefail`, and a failed listing removes
  nothing); a machine with no `docker` binary says so once and still sweeps git and the temp root.

Databases, schemas and queues have no command common to every stack, and **this janitor sweeps no images**: the
repository that creates them keeps its own prefixed sweep (§4) beside the fixture — for a per-run image tag, by
the `testsToDelete.owner` label set on `docker build`, under the lowercase spelling.
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
