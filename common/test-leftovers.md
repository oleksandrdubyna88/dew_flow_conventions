---
id: "common.test-leftovers"
load: "conditional"
tasks: ["implement","test","audit","policy","release"]
---
# Test leftovers are named `testsToDelete-<owner>-…`, owned by their run, scoped to their user, and collected (MANDATORY)

<!-- core:begin -->
Whatever a test run, a probe or a measurement creates OUTSIDE its own process — a container, a Docker volume
or network, a git worktree, a branch, a temp folder, a database, a schema, a queue, a store collection — keeps
four promises: **named** by one helper, **owned** by the run that made it and scoped to the OS user who ran it,
**removed** by that run, **collected** by that user's next run when this one was killed. Every repository keeps
all four, in its own language, against this one text.

## 1. The name — one form, three spellings

`testsToDelete-<owner>-<repo>-<what>-<id>`, e.g. `testsToDelete-u1000-api-pg-k3f9a1`.

- **`<owner>`** is the token of the OS user whose process creates the resource: `u<uid>` on POSIX (`u0` is
  root's own scope, not every scope); on Windows, which has no uid and whose account names hold `-`, `.` and
  capitals, `w<digits>`: the account name without its domain (`%USERNAME%`, `id -un`, Node `os.userInfo().username`),
  its ASCII letters `A`–`Z` lower-cased and nothing else changed, encoded as UTF-8 — the bytes of the name alone, no
  line end — hashed with SHA-256; the first four bytes of the digest read as a big-endian unsigned 32-bit integer,
  written in decimal without leading zeros (1 to 10 digits). A hash collision confers NO authority — the file's
  owner decides (§3). The grammar
  **`^[uw][0-9]{1,10}$`** is reserved: no `<repo>` token matches it, so no name reads two ways. The one override,
  `TESTSTODELETE_OWNER` (a run inside a container that talks to the host's daemon), is validated against the
  grammar before anything is matched — an invalid value refuses, never falls back — and never widens what the
  caller may delete (§3). The segment SELECTS; §3 says what proves it.
- **`<repo>`** is the repository's token, `[a-z0-9]{2,12}` and not of the owner grammar, written in exactly ONE
  constant of its helper. A guard and a sweep match `^testsToDelete-<owner>-<repo>-` anchored and
  case-insensitively, and **nothing ever parses past the repo token** — `<what>` may contain the separator. **A
  token is registered before it is used**: the mounted rule repository carries, outside this shared text, a
  `## Tokens` table of every token that can share a machine with its family (a public one lists only its own, the
  private one carries both), so two repositories on one machine never sweep each other; a guard refuses a helper
  constant that is not a row of that table or that matches the owner grammar.
- **`<what>`** obeys only the namespace it lives in: for a folder or worktree, anything the file system accepts
  except path separators, NUL and control characters — spaces and non-ASCII are allowed on purpose, they are
  what a path test must cover — and never a leading `-`.
- **`<id>`** is random (a counter or a timestamp alone collides across two runs): 6 to 12 characters of
  `[A-Za-z0-9]`, lowercase where the namespace folds case.
- The whole name is at most **63 characters** — a SQL identifier, a DNS label and a Windows temp path survive.
  The owner is budgeted BEFORE `<what>`: the helper derives the room for `<what>` from the prefix, its owner,
  token, separators and id, and refuses a longer `<what>` before anything exists — it never truncates a finished
  name (17 characters remain under the longest owner and token with a six-character id).
- **Three spellings, one prefix.** `testsToDelete-` for containers, volumes, networks, worktrees, branches and
  folders; `teststodelete-` where a namespace refuses capitals (image names, Kubernetes objects);
  `teststodelete_` where it refuses `-` (SQL identifiers — then every separator is `_`:
  `teststodelete_u1000_api_pg_k3f9a1`). Every guard, sweep and janitor matches `^teststodelete[-_]<owner>[-_]`
  case-insensitively, in every spelling; an unanchored or single-case match is a bug.
- **A legacy name** is a prefixed name whose second segment is not of the owner grammar — the form from before
  the owner segment, `testsToDelete-<repo>-<what>-<id>`. A name's version is read from that ONE segment against
  the reserved grammar, never by counting separators. A guard refuses a helper or literal that still produces one
  (§7); a sweep or janitor lists one and removes it only as §4 says.
- **What dies with its container needs no name of its own.** A branch, clone or worktree INSIDE a repository
  that lives in an owned folder — and a row, key, queue, index, schema or account INSIDE a database, store
  container or claimed namespace the run owns — carries no prefix and no owner: it goes with what holds it.
  The prefix is on the OWN name of what lives in a shared namespace: the leaf of a folder or worktree, the
  database, never a parent and never a row.

## 2. The helper — one per language a repository tests in

Every test-created name comes from one module per test language — a repository that tests in bash, Node and C#
has three, each holding the token ONCE, and its guard checks that the constants are equal and are one row of the
mounted table — that does, in the order that leaves no window: **claim first** — write the owner record of §3
under the generated name with an exclusive create (`wx`, `FileMode.CreateNew`, a held lock, a registry row); a
claim already there is somebody else's name, draw a new id — · **register the cleanup as the very next
statement** (`using`/`DisposeAsync`, `Drop`, `t.after`, `finally`, `trap … EXIT`) — inside a hook or a test whose
teardown pair is registered first, never at module load: a runner that filters every test of a file away skips
the file's hooks, and a resource made at import time then has no remover — · then **create** the resource under
that name, exclusively too (`mkdir`, never a create that succeeds on an existing folder): a resource already
there under the claimed name is somebody else's and is never adopted, never removed — the helper writes ONE
warning naming the collision, removes its own claim — only while it still holds exactly what the helper wrote,
so a claim of a run that dies later can never govern a folder this run did not create; §4 judges the squatter's
folder by the normal rules — and draws a new id. So nothing the helper made ever
exists unclaimed: an **unmarked** resource of the owner form is nobody's the helper knows, and §4 lists it, never
collects it. A claim whose resource does not exist — an **orphan claim**, left by a run that died between the
two — is judged by its owner like any claim under §4's two keys (`gone` removes it; `live` and `unknown` keep it);
two live runs never share a name, because the claim is exclusive.

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

Every prefixed resource carries its owner record, **`<owner>:<host>@<os>:<pid>[:<start>[:<ns>]]`**, ONE grammar
for a claim file, a lock reason and a label: the owner token of §1 of the user whose process writes it (the
override included); the machine's DNS host name (`hostname`, Node `os.hostname()`, C# `Dns.GetHostName()`),
compared case-insensitively — never the NetBIOS name (C# `Environment.MachineName`, `%COMPUTERNAME%`:
upper-case, cut at 15 characters), with each run of `@`, `:` or whitespace in it written as ONE `-` (nothing is
trimmed, the case is kept — every reader applies this same rule before it compares) — and under WSL
(`$WSL_DISTRO_NAME` set) `~` and the distribution's name, normalised alike: `devbox~Ubuntu`, because
distributions share one host name and one Docker daemon but each has its own pid space; `linux`, `macos` or
`windows` (a Windows machine and its Linux subsystem answer to ONE name with TWO pid spaces, measured
2026-10-15); the id of the process whose lifetime bounds the resource — the runner's parent process for what a
global setup makes, the script for what one script makes and removes; in a CI job, ONLY for a resource that
outlives the step that made it (a container a later step reads), the runner worker process — an ancestor of the
step's shell (`$PPID` of the step's own shell; a script a step launches sees the step's shell as its `$PPID`),
because the step's shell is gone before the job is. A hosted runner is discarded with its job and needs no owner
rule beyond this; a persistent self-hosted runner is a machine like any other. On a Windows bash step `$PPID` is 1
and `$$` an MSYS pid, never used there: take the step shell's Windows pid from `/proc/$$/winpid` and follow
`ParentProcessId` (`Get-CimInstance Win32_Process`) past the `bash.exe` shims — Git's launcher is one — to the
first process that is not one (measured from a Git Bash started by `pwsh`: that `pwsh`). Windows has no pid 1, so
`…@windows:1` is `unknown`. The top of a run exports its record ONCE as `TESTSTODELETE_RUN=<record>`; a helper in
a child process uses it when set, valid and naming a LIVE run of the caller (a stale value would make every claim
dead at birth), so what it makes belongs to the run, not to a helper that exits. A
claim is ONE line (an LF or CRLF line end) of at most **512 bytes**: anything else — a second line, a lone CR, a
longer text — is unreadable. And, **only where the OS gives it without spawning a process** (a `/proc` read, a
native process API — never a shell or PowerShell child per test process), the process's start time as **integer
Unix seconds, UTC**, from the OS's record of that pid — never the writer's own clock at startup; a writer that
would have to spawn to learn its start omits it. On Linux, and only together with the start, the process's pid
namespace as the decimal inode of `/proc/self/ns/pid`: two namespaces can share one host name (`--uts=host`),
never a pid space. The owner never lives inside the resource where a test can see it:

| Kind | Owner |
|---|---|
| folder | a sibling file `<folder>.owner` (inside, a git repository rooted at the folder sees an untracked file — real tests assert their exact status) |
| worktree | the lock: `git worktree add --detach --lock --reason "<record>" <path> <ref>` (git ≥ 2.33, where `add` learned `--reason`); `prune` never touches a locked tree. A folder holding a `.git` FILE is a linked worktree of SOME clone, read through that file (`gitdir:` → `<gitdir>/locked`) — never judged as an unmarked folder; a lock that names nobody is unreadable |
| branch | none — it lives inside an owned folder (§1), or is made by that one `worktree add -b` for a prefixed worktree and removed with it |
| container, volume, network | `--label testsToDelete.owner=<record>` on `run` / `volume create` / `network create`; a Testcontainers builder adds the same label |
| database, schema, queue, collection | **lock-owned** where the run holds a session-held named lock (`GET_LOCK`, an advisory lock) — on the store itself, or, for a store that has none (an index, a queue), on ONE lock server every sweeper of that kind consults first, the lock named after the resource —: the run takes the lock named after the resource BEFORE creating it and holds it for its lifetime — the lock is the whole owner, no marker, no age. Otherwise **marker-owned**: `<record>` plus the creation time, written before the resource into a registry OUTSIDE it (a server-level table or key, a claim record) that no reset of the resource can wipe |

**Scope evidence — the name selects, the kernel authorises.** The owner segment of a name is text anyone can
type. What proves whose a resource is comes from outside the name: a folder, a worktree, a claim file — anything
the file system owns — must have the caller's REAL uid as its owner (the process's, whatever `TESTSTODELETE_OWNER`
says; on Windows the caller is the file's owner, bash `-O`), and a claim file owned by another uid is unreadable
(a stranger wrote it). An object of a container daemon has no kernel owner: its label's owner segment is the
evidence, and access to a shared daemon is root-equivalent — a per-user daemon where there is one. The owner in
the name, in the record and the caller's token must be ONE; a mismatch is `unknown`. An administrator sweeps
another user's scope by running as that user, never by naming it.

**Liveness, one procedure** → `live` / `gone` / `unknown`. A **lock-owned** resource first, since it carries no
owner string: lock held → `live`, lock free → `gone` (it was taken before the resource existed and dies with the
owner's session — no age is needed or read). Everything else, in this order: no record at all is *unmarked* —
listed by §4, never judged; a record that is not exactly the grammar above → `unknown`; its owner not the name's
or not the caller's → `unknown`; `<host>@<os>` not this machine's (case-insensitive) → `unknown`; on a Linux
reader, a record without `<ns>` or with another namespace's → `unknown`; a pid no process can have (0, a sign, a
leading zero, past 2^53) or `windows:1` → `unknown`; **no process with that pid → `gone` — the only `gone` there
is**; the query refused or failed (`EPERM`, access denied, a missing tool), or a process list that may hide other
users' processes (`hidepid`) → `unknown`; alive, and the owner carries no start or the reader cannot read the live
one without spawning → `live`; alive, start times within **2 seconds** → `live`; further apart → `unknown` — a
reused pid, or a wall clock stepped between the write and the read; a mismatch delays reclamation and never deletes
something live. Two seconds covers two one-second roundings; a wider window only preserves more.

**The probe must not signal.** On Windows Python's `os.kill(pid, 0)` does NOT probe: it calls `TerminateProcess`
and KILLS the process (signal 0 becomes the exit code). A Python reader uses a non-destructive probe — `OpenProcess`
through `ctypes`, `psutil.pid_exists`, or `tasklist /FI "PID eq <pid>"` as the janitor does — and the same
three-valued rule applies.

## 4. The start-of-run sweep — *scope selects, liveness authorises, uncertainty preserves*

`finally` and `trap` do not run on `SIGKILL`, so naming is half the promise. Every repository that creates a
resource kind wires a sweep of that kind into the **start** of its test run (the runner's first lines,
`globalSetup`, a fixture's constructor), and it:

- considers **only its caller's owner and its own token**, `^testsToDelete-<owner>-<repo>-` — another user's
  and another repository's leftovers are not its business: listed, never touched — and removes only worktrees its
  own `git worktree list` shows: a prefixed folder with a `.git` file it does not list is another clone's, preserved
  for that clone's sweep or the janitor;
- deletes on **two keys, both required, per resource**. *Scope:* the name's owner, the record's owner and the
  caller's token are one, the kernel owner is the caller (§3), the token is its own. *Abandonment:* the record's
  liveness is `gone` (§3) — or a lock-owned store's lock is free and the sweeper holds it through the drop.
  Everything else is preserved WITH its reason in the report: `live`, `unknown`, a missing or unreadable record (an
  unmarked resource included), a legacy name, a foreign scope. An implementation may preserve MORE — refuse its
  whole run while any record of its scope is `live` — never less;
- lets age **select**, never authorise: a resource younger than **10 minutes** (created or last written; for a
  marker-owned store, the time the registry recorded) is left alone silently, which keeps the sweep off a resource
  still being set up; a lock-owned store has no age and needs none;
- removes **by what identifies the resource at the moment of removal**, never by a name read earlier: a daemon's
  object by its captured id (a volume, which has none, re-inspected just before — same creation time and label); a
  plain folder by its device and inode and its re-read claim, after an atomic rename to the sibling
  `.<name>.teststodelete-quarantine-<pid>-<hex>` (same parent, so the rename is atomic and never crosses a file
  system; a leading `.` so no prefix match ever reaches it); a worktree under the same re-check with
  `git worktree remove --force --force` — **never renamed**, a rename breaks its gitdir pointers; a branch by its
  captured tip (`update-ref -d <ref> <sha>`). What changed in between is kept and named; a quarantine left by a
  killed sweep is restored under its name when that is free and listed when it is taken — never over an existing
  one;
- treats a **legacy name** (§1) as listed, with the exact command a person would run. It is collected only where
  the kernel owner is the caller AND its record, in the grammar of its day (`<host>@<os>:<pid>[:<start>]`), is
  `gone` under §3 — a daemon's legacy object has no kernel owner and stays listed; a lock-owned legacy store is
  judged by its old lock, its whole owner. Nothing collects a legacy name by age, so there is no end date: old
  branches run their old suites until they drain;
- **never fails the run**: a sweep error is one reported line; the exit code is the tests'.

Age alone is forbidden (a measuring harness's run store reclaimed by age until 2026-08-16 and requeued a leg
another worker was still measuring); so is a name alone — anyone can type any owner into a name in a shared temp
root.

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

Where a run can own its store it does: a per-run database or schema `teststodelete_<owner>_<repo>_<what>_<id>`,
a per-run queue name, a per-run key prefix the application under test honours. A test that would write rows into
a store it does not own — the developer's database, a shared test database, a deployed environment's — isolates
instead: the run starts what it tests against on a store of its own. It never "cleans up" there: a row it cannot
name it cannot sweep, and a sweep that guesses deletes a user's. What a test may do against a store it does not
own is read. Clearing a shared store is the last resort, exempt from the name only in two shapes, written where a
guard reads them (§7):

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
| `docker-name` | a `--name`, `volume create`, `network create`, `WithName`, `docker compose -p`/`--project-name` or `COMPOSE_PROJECT_NAME` (a compose project's containers carry the project's name) without one of the three spellings in the owner form; an image tag only where a test step builds it — a job that builds and pushes the product image is the product, not a leftover |
| `legacy-name` | a literal or a constant that builds a prefixed name whose second segment is not of the owner grammar (§1) |
| `owner-blind` | a pattern, glob or filter that matches the prefix with no owner segment right after it, written literally or through a variable the same file assigns a value holding the prefix (`$P`, `${P}` with or without an operator, a bare name in script code); a name from another file, the environment or an argument, and the forms listed as limits in the header of `tools/lib/prefix-bindings.mjs`, are not traced — the shape of a sweeper that cannot tell one user's leftovers from another's. No inline exemption clears it: the one line a guard or a scan passes is the shipped janitor's inventory, recognised by file, line and content hash, never by a comment; that pass also covers the uses of the variables that line assigns, and no other line |
| `shared-store` | a `DROP`, `TRUNCATE`, `FLUSH` or delete-all against an unprefixed name without exemption (a) |
| `ryuk-off` | `TESTCONTAINERS_RYUK_DISABLED` set to true — no exemption accepted |

**The exemption grammar — inline, one form:** a comment on the line or the line above,
`testsToDelete-exempt: <class> — <reason>`. The class is one of the table's (not `ryuk-off`, not `owner-blind`); the reason is at
least ten characters and three words and not a placeholder (*needed*, *see above*, *todo*); for
`shared-store` it carries `lock:`. A reason-less, class-less or unknown-class exemption is a finding of class
`exemption`.

## The janitor

The **host-wide** tool — every user, every token, every kind; neither a teardown nor the sweep of §4 — is ONE
shipped, tested script, `tools/janitor.sh` in the rule repository, never a block to paste and never a second
implementation: a repository's own tooling may START it, not re-implement it. It inventories every scope and
sweeps only its caller's under the two keys of §4 — another owner's resource, a legacy name and an unmarked one
are report lines, never removals, and `u0` is root's scope like any other; it captures once and removes only
what it captured, by identity; it skips with one named line whatever it cannot judge; it exits 0 only when
nothing in the caller's scope was skipped. Its invocation, options, output lines, exit codes and the full list of
what a copy must keep are the companion rule `common/test-leftovers-janitor.md`, read before running or copying
it. It sweeps no images and no stores: the repository that creates them keeps its own prefixed sweep (§4) beside
the fixture — for a per-run image tag, by the `testsToDelete.owner` label set on `docker build`, under the
lowercase spelling.

## The barrier — an owner-blind sweeper anywhere on a machine

A sweeper that matches the prefix without an owner segment, or removes on age, deletes every user's leftovers;
one left ANYWHERE on a machine several OS users share removes another user's live resources, and a change to one
repository protects that repository only. So, on such a machine:

- **No producer emits the owner form until no owner-blind sweeper remains enabled anywhere on it** — in every
  checkout, worktree, copy of this rule and its janitor, and scheduled job. A scan of the machine lists the ones
  left; the barrier is open only when it lists none, and evidence the scan cannot read keeps it closed.
- Until then no repository is used for two users' concurrent test runs.
- A repository moves in two stages: first its sweeper (owner-aware, or disabled) with no owner-form producer, then
  its producers — and every sweeper stage of every repository on a shared machine lands before any producer stage.
- **The only rollbacks are these:** disable the sweeps and the janitor (they then delete nothing, and the resources
  stay), or pin the sweeper stage without the producer stage. Restoring owner-blind deletion is never a rollback,
  and a rollback leaves the barrier as it was.
<!-- core:end -->

## Tokens

<!-- owns: coai — the registry must name the token a repository actually uses, and that one is its product's name -->

This family's tokens — the rows a guard here checks a helper's constant against. This repository is public and
lists only its own; the private twin rule repository carries these rows beside its own family's and checks that
every token across both is unique, so the wording of a row is frozen (its check is a line compare). No token
matches the owner grammar of §1. (This family, audited 2026-10-14: six repositories, 0 compliant sites,
containers up for weeks — the backlog this rule names.)

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

- Never widen a match beyond the anchored literal prefix, owner and token (no `test*`, no `tmp*`, no unanchored match).
- Never sweep another owner's scope — root included; `u0` is a scope, not a master key.
- Never delete on a name alone: the name selects, the kernel owner and the record authorise.
- Never remove on age, on a missing record, or by a name read earlier — only a `gone` record, re-identified now.
- Never sweep with a variable that can be empty (`rm -rf "$DIR/"*` with `$DIR` unset deletes from the root).
- Never give the prefix to something that must survive the run — the prefix is a promise that deleting it is safe.
- Never tear down by the shared prefix — teardown is by the exact names the run generated; never let a start-of-run sweep fail the run.
- Never drop `--rm` without the complete carve-out — a remover on every path, after the diagnostics, by exact name.
- Never put the owner inside the resource where the test under it can see it.
- Never emit the owner form on a shared machine while an owner-blind sweeper is enabled on it; never restore owner-blind deletion as a rollback.

## Definition of Done

- [ ] Everything the run created outside its process is named `testsToDelete-<owner>-<repo>-<what>-<id>` by the helper, claimed first, and removed by the run by its exact name.
- [ ] Every container started by hand ran with `--rm` or under the complete carve-out; Testcontainers' reaper stayed on.
- [ ] The repository's start-of-run sweep collects its caller's own token on the two keys of §4; its guard is red on every class of §7 and on a scan of nothing.
- [ ] Every shared store a test clears is per run or carries exemption (a) with its lock; every container-scoped database carries exemption (b).
- [ ] On a machine several OS users share, the barrier was open before the first owner-form producer landed.
<!-- core:end -->
