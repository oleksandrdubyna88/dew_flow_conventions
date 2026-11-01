---
id: "common.test-leftovers"
load: "conditional"
tasks: ["implement","test","audit","policy","release"]
depends: ["common.test-leftovers-detail"]
---
# Test leftovers are named `testsToDelete-<owner>-…`, owned by their run, scoped to their user, and collected (MANDATORY)

<!-- core:begin -->
The **core**: enough to judge a change without the rest. Every section's full statement — the text that
decides — is `common/test-leftovers-detail.md` (*the detail*), loaded with this rule as its dependency; the
former text moved there whole, and the two never disagree.

Whatever a test run, probe or measurement creates OUTSIDE its own process keeps four promises: **named** by
one helper, **owned** by the run that made it and scoped to the OS user who ran it, **removed** by that run,
**collected** by that user's next run when this one was killed.

## 1. The name

`testsToDelete-<owner>-<repo>-<what>-<id>`. `<owner>` is the OS user's token, `u<uid>` on POSIX or `w<digits>`
on Windows, of the reserved grammar `^[uw][0-9]{1,10}$`. `<repo>` is the repository's token, ONE constant per
helper, registered first as a row of the `## Tokens` table of the detail. A match is anchored,
case-insensitive, stops at the repo token and covers the spellings `testsToDelete-`, `teststodelete-` and
`teststodelete_`. `<id>` is random. A **legacy name** has a second segment outside the owner grammar: a guard
refuses producing one; a sweep lists it and never collects it by age. What lives INSIDE an owned folder,
container or store carries no prefix of its own.
Detail: §1.

## 2. The helper

One module per test language, holding the token once. In this order: **claim first** — the owner record of §3
under the generated name, by an exclusive create; a claim already there is somebody else's, draw a new id —
register the cleanup as the very next statement, inside a hook or test and **never at module load** — then
**create exclusively**; an existing resource under the claimed name is never adopted or removed.
A child process or library that makes temp paths is handed an owned folder as its `TMPDIR`. Teardown runs on
every exit path, removes **by the exact full name, never the prefix**, never throws, retries a few times, and
on giving up leaves the resource prefixed and claimed with ONE warning line.
Detail: §2.

## 3. The owner

Every prefixed resource carries its owner record `<owner>:<host>@<os>:<pid>[:<start>[:<ns>]]` — one grammar
for claim file, lock reason, label and registry row — written OUTSIDE the resource. **The name selects, the
kernel authorises:** the owner segment is text anyone can type; a file-system object must be owned by the
caller's REAL uid, a daemon object's label is its only evidence, and the owner in the name, in the record and
the caller's token must be ONE — a mismatch is `unknown`. **Liveness is three-valued:** a lock
held → `live`, free → `gone`; no record is *unmarked* (listed, never judged); a malformed, foreign or
impossible record → `unknown`; **no process with that pid → `gone`, the only `gone` there is**; a refused
query → `unknown`; alive with start times within 2 seconds → `live`, further apart → `unknown`. The probe
never signals. Uncertainty preserves.
Detail: §3.

## 4. The start-of-run sweep

Every repository that creates a resource kind sweeps that kind at the **start** of its test run, on its
caller's owner and its own token only, `^testsToDelete-<owner>-<repo>-`, and deletes on **two keys, both
required**: *scope* — the name's owner, the record's owner, the caller's token and the kernel owner are one —
and *abandonment* — the record is `gone`, or a lock-owned store's lock is free and the sweeper holds it.
Everything else is preserved with its reason: `live`, `unknown`, unmarked, a foreign scope, a legacy name. Age
only **selects**: younger than 10 minutes is left alone. It removes **by identity at the moment of removal** —
a daemon object by its captured id, a folder by device and inode through an atomic rename to a sibling
`.<name>.teststodelete-quarantine-<pid>-<hex>` — and keeps what changed in between. It **never fails the
run**: an error is one reported line.
Detail: §4.

## 5. Containers

`docker run --rm`, the prefixed `--name` and the owner label on every container, volume and network a script
starts by hand; a Testcontainers fixture keeps the reaper on. The carve-out — a container whose logs, exit
code or state are read after it exits — drops `--rm` only with ALL of: an exact prefixed `--name`, prefixed and
listed volumes, a remover on every path (`if: always()`, a `trap … EXIT` registered before the run) after every
line that reads the container, exact `docker rm -f -v` and `docker volume rm` commands, never deciding the verdict.
Detail: §5.

## 6. Stores

A run owns its store: a per-run database, schema, queue or key prefix `teststodelete_<owner>_<repo>_<what>_<id>`.
A test never "cleans up" a store it does not own; there it only reads. Clearing a shared store is exempt in two
shapes only: **(a)** a long-lived shared store whose configuration carries `testsToDelete-exempt: shared-store …`
naming the endpoint, the store and, after `lock:`, the enforced lock that serialises every reset; **(b)** a
database or namespace inside a disposable container the run or its job owns (`testsToDelete-exempt:
container-scoped — …`).
Detail: §6.

## 7. The guard

A test over the repository's own test trees, scripts and CI, red on each class outside the helper and red on a
scan of nothing (exit 2): `raw-temp` (any temp-path API), `raw-worktree` (any
`worktree add`), `docker-run` (no `--rm` and no complete carve-out), `docker-name` (a name without the owner
form), `legacy-name` (a name built without the owner segment), `owner-blind` (a prefix match with no owner
segment after it; the only pass is the janitor's inventory line, by file, line and hash), `shared-store` (a
`DROP`, `TRUNCATE`, `FLUSH` or delete-all on an unprefixed name without exemption (a)), `ryuk-off`
(`TESTCONTAINERS_RYUK_DISABLED` true). The one exemption form is a comment on the line or the line above,
`testsToDelete-exempt: <class> — <reason>` (`lock:` for `shared-store`); `owner-blind` and `ryuk-off` take
none; a malformed one is a finding of class `exemption`.
Detail: §7.

## The janitor

The host-wide sweep — every user, token and kind — is ONE shipped, tested script, `tools/janitor.sh`, never
re-implemented; it sweeps only its caller's scope under the two keys of §4 and lists everything else. Its
contract is `common/test-leftovers-janitor.md`, read before running or copying it.
Detail: § The janitor.

## The barrier

On a machine several OS users share, **no producer emits the owner form until no owner-blind sweeper remains
enabled anywhere on it**; a scan lists what is left, and unread evidence keeps it closed. A repository moves
in two stages — its sweeper first (owner-aware or disabled), its producers after — and every sweeper stage
lands before any producer stage. The only rollbacks disable the sweeps or pin the sweeper stage; restoring
owner-blind deletion is never one.
Detail: § The barrier.

## Never

- Never widen a match beyond the anchored prefix, owner and token; never sweep another owner's scope, root included.
- Never delete on a name alone, on age, on a missing record or by a name read earlier — only a `gone` record, re-identified now.
- Never sweep with a variable that can be empty; never prefix what must survive the run; never tear down by the prefix.
- Never let a sweep fail the run; never drop `--rm` without the carve-out; never put the owner inside the resource.
- Never emit the owner form while an owner-blind sweeper is enabled; never restore one as a rollback.
Detail: § Never.

## Definition of Done

- [ ] Everything the run created outside its process is named by the helper, claimed first, and removed by its exact name.
- [ ] Every hand-started container ran with `--rm` or under the carve-out; the Testcontainers reaper stayed on.
- [ ] The sweep collects the caller's own token on the two keys of §4; the guard is red on every class of §7 and on a scan of nothing.
- [ ] Every shared store a test clears is per run, or exempt under (a) with its lock or (b) container-scoped.
- [ ] On a shared machine, the barrier was open before the first owner-form producer landed.
Detail: § Definition of Done.
<!-- core:end -->
