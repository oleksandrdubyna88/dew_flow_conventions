# PLAN — Test leftovers, E1: the contract, its refinement, and this repository's own tools

> Status: **plan only, nothing implemented yet, 2026-10-15.** Stories of epic E1 of
> [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md) (§ *Epics*, E1). Scope: `common/test-leftovers.md`
> (+ its record in `research/rule-bodies.json`), a Node owned-resource helper and a start-of-run sweep under
> `tools/lib/`, the guard `tools/leftovers-check.mjs`, `tools/run-tests.mjs`, the shipped janitor `tools/janitor.sh`
> with its test, the 34 `mkdtemp` sites and the four worktree sites in `tools/*.test.mjs`, and one release.
>
> Split by Opus, 2026-10-15; S1's spec by Fable the same day; models per story below. One cornerstone: S1.
>
> Revised by [PLAN_test_leftovers_merged_core.md](PLAN_test_leftovers_merged_core.md) (2026-10-21): the contract this
> document builds gains an owner segment, kernel ownership and one companion janitor document before its release. That plan
> owns the revised text and tools and promotes this document when it ships; the stories here keep their first form.

**Committed together with this document** (one commit, [planning-docs.md](../common/planning-docs.md) § *A plan split
into epics and stories*): its row in [todo/README.md](README.md), and the parent's ledger line replaced by

```
Cornerstones: 1 of 3 — E1.S1 (the contract text in common/test-leftovers.md, model: fable); reserved, not yet marked: E5 (coai's temp sweep), E7 (rag_qln's shared store).
```

**Done when** (from the parent): the rule carries decision 2, the concurrency sentence, the container carve-out, the
start-of-run collection, the owner and the three spellings, in words a guard can check (S1); this repository's tests
create only owned, prefixed, claimed resources, removed in place and collected at the start of the next run when a
run was killed (S2–S4); the host-wide janitor ships as a tested script (S3b); the guard is red on every class, on an
unregistered token and on a scan of nothing (S4); one release carries it all (S5). Consumers bump their pin inside their own epics (E2–E7), never here.

## Facts the split rests on (read on `origin/main` 2be89ab, 2026-10-15)

The parent's E1 scope is right in its counts and wrong in four details; these corrections bind every story.

- **34 `mkdtemp` sites across 19 files**, confirmed. They are **not** all cleaned via `t.after`: 27 are (four of them the
  worktree homes in `smoke-rules.test.mjs`, whose `t.after` wraps a `try/finally`); six use a plain `try/finally`
  (`branch-protection-resolver.test.mjs:22`, `low-priority.test.mjs:98`, `ownership-check.test.mjs:140` and `:357`,
  `selftest.test.mjs:291` and `:371`); and **one removes only on the success path**: `smoke-rules.test.mjs:581`
  (`chg-`) calls `fs.rmSync` as its last statement (`:589`), so a failing assertion before it leaks the folder.
- **`selftest.test.mjs:371` creates its folder INSIDE the repository** (`path.join(here, "..", "tmp-gate-")`), where
  no sweep looks; `gate-snippet-check.mjs` reads only cwd-relative paths and `git config -f .gitmodules`, so nothing
  requires that placement. `selftest.test.mjs:291` reads `process.env.TEMP ?? "/tmp"` instead of `os.tmpdir()`.
- **Four e2e worktrees, not two**: `smoke-rules.test.mjs:457`, `:476`, `:522`, `:558`, each registered **in this
  checkout itself** (`top` = `git rev-parse --show-toplevel`), each with a `node_modules` junction the teardown removes
  BEFORE `worktree remove` (`:17-18`, `:461`); teardown is in `t.after`, which a kill skips. Three of the four run
  `behaviourSmoke`, which refuses a worktree with any untracked file (asserted at `smoke-rules.test.mjs:554-569`).
- **Branches** `migrate-test` (`migrate-rules.test.mjs:91`, `:111`) and `journal-failure` (`:195`) are created by
  `tools/lib/rule-migration.mjs:174` inside a source repository that lives in the test's temp folder — nested, so they
  stay as they are (S1 D3).
- **`run-tests.mjs` is a bare `node --test`** (`tools/run-tests.mjs:34-42`); `plan-lifecycle.mjs` is NOT wired there.
  The guard is wired as a test over the real repository (discovered by `node --test`); `run-tests.mjs` gains only the
  start-of-run sweep.
- **Node test discovery** runs `**/*.test.mjs`, `**/test-*.mjs`, `**/test/**`: guard and janitor fixtures are written
  at runtime into owned folders, never committed under a discoverable name.
- **Measured by the Judge, 2026-10-15** (Windows, git 2.55.0.windows.3): `git worktree remove --force --force` on a
  locked worktree containing a directory junction exits 0, does NOT follow the junction (the target's file survived),
  and **leaves the worktree directory behind holding the junction**; Node's `fs.rmSync(dir, { recursive: true })` then
  removes it without following the junction (`lstat().isSymbolicLink()` is `true` for a junction). From PowerShell, a
  bare `bash` resolved to WSL's bash, not Git for Windows'.
- **This repository is PUBLIC** (`gh repo view`: `oleksandrdubyna88/dew_flow_conventions`, visibility `PUBLIC`,
  checked 2026-10-15). Everything committed here — the rule body included — is published. See Judge's note J11.

## Order

| Story | Model (spec · code · review) | Depends on | Lands |
|---|---|---|---|
| S1 — the contract text | **Fable** (written) · main session or Sonnet · Opus | — | first |
| S2 — the Node owned-resource helper and owner liveness | Opus · Sonnet · Opus | S1 | second |
| S3 — the start-of-run sweep in `run-tests.mjs` | Opus · Sonnet · Opus | S1, S2 | after S2, parallel with S4 |
| S3b — `tools/janitor.sh` shipped and tested | Opus · Sonnet · Opus | S1 | after S3, before S5 (needs no S2 code) |
| S4 — the structural guard, and every site migrated | Opus · Sonnet · Opus | S1, S2 | after S2, parallel with S3 |
| S5 — docs and the one release | Opus · main session or Sonnet · Opus | S1–S4 and S3b merged | last |

Rule section numbers (*rule §n*) are those of the S1 proposed body; *D1–D10* are S1's decisions. Where S2–S5 and S1
seem to differ, S1 wins and the difference is a defect of this document — report it, do not resolve it in code.

## S1 — The contract text in `common/test-leftovers.md` — **cornerstone (1 of 3), `model: fable`**

> Spec by Fable, 2026-10-15, written against `origin/main` 2be89ab; revised the same day against the Opus judge's
> notes J1–J9 and the corporate judge's notes C-a…C-g and C7, then the E1 plan gate's per-resource janitor, then the gate's cadence
> consultation (one capture, the janitor as a shipped script, optional start time), then the twin judge's J10/J11
> (tolerant deletions, privacy of the public token table) — resolution tables at the end. The proposed body is beside this file as
> `test-leftovers.proposed.md` (frontmatter unchanged; two `<!-- core:begin/end -->` spans mark what the twin
> rule repository copies verbatim). Every figure below was measured on this machine on 2026-10-15 unless it
> carries another date.

- **Models.** Fable wrote this section; the text change is one file plus its rule-bodies record, taken from the
  proposed body verbatim (main session or Sonnet); Opus reviews the text against this section and S2–S4.
- **Goal.** One text that six repositories (and the twin rule repository, byte for byte in the two core spans)
  encode in their helpers, guards and sweeps without two readings.

### Decisions

Each decision names what wins, what loses, and the evidence. The section numbers are the proposed rule's.

**D1 — The name (rule §1).** `testsToDelete-<repo>-<what>-<id>`.

- `<repo>` is `[a-z0-9]{2,12}`, one constant per repository (`REPO_TOKEN = "conventions"` here — S2 §1 is
  right). **Registered, unique across both families (C7):** the rule carries, OUTSIDE the core, a `## Tokens`
  table; the two rule repositories keep ONE table (each copy lists the other's rows; a row is added to both in
  the same week), and a repository's guard refuses a helper constant that is not a row of the table it mounts.
  The table has three columns — `token | family | repository` — and, **in this public repository, only this
  family's seven rows** (`conventions`, `creds`, `mcp`, `sidecar`, `coai`, `bench`, `qln`; `coai` under an `owns:`
  marker, since the token IS the product's name). The private twin rule repository carries these seven beside
  its own and its test checks that our rows appear in it verbatim and that every token across both families is
  unique — so uniqueness is enforced from the private side, the row wording here is frozen (a line compare), and
  nothing of the other family is named in this repository (J11). The guard here checks `REPO_TOKEN` against our
  seven rows. *Loses:* a token derived from the repository name (two families' names
  can coincide, and nothing checks); a per-family table (the two families share machines and daemons). It has no separator inside it, so the anchored match `^testsToDelete-<repo>-` is the only parsing
  anyone ever does: **nothing parses past the repo token**, and `<what>` may therefore contain `-`.
- `<what>`: anything the namespace accepts — for folders and worktrees, any characters except `/`, `\`, NUL and
  control characters, not starting with `-`; spaces, a trailing space, and non-ASCII are allowed. *Loses:*
  ASCII-only `<what>` — three tests (`rules.test.mjs:13`, `migrate-rules.test.mjs:67`,
  `plan-lifecycle.test.mjs:19`) carry a space or Cyrillic in the path on purpose and would lose that coverage.
- `<id>`: random, 6–12 of `[A-Za-z0-9]`, lowercase where the namespace folds case; `mkdtemp`'s six qualify, so
  S2's `ownedDir` keeps `fs.mkdtempSync` (atomic, no `EEXIST` retry). *Loses:* a timestamp or counter (two
  runs in one second collide); a fixed 12-hex id (forbids `mkdtemp`, the one atomic primitive Node has).
- Whole name ≤ 63 characters — PostgreSQL's `NAMEDATALEN`, a DNS label (what Docker gives a container as
  hostname), and a Windows temp path all survive: `C:\Users\<u>\AppData\Local\Temp\` (35) + 63 + 1 + the deepest
  tracked path (74, `tools/fixtures/gate/pasted/.claude/rules/shared/common/coai-review-gate.md`, measured on
  origin/main) = 173 of 260. S4 still measures it on Windows (J4).
- The parent's `testsToDelete-wt-…` (no repo token) loses; the rule's example becomes
  `testsToDelete-api-pg-k3f9a1`.

**D2 — One name, three spellings (rule §1).** `testsToDelete-` / `teststodelete-` / `teststodelete_`; in the
`_` spelling every separator is `_` (`teststodelete_api_pg_k3f9a1`). The one regex everywhere is
`^teststodelete[-_]` case-insensitive — the janitor's old `grep -i '^testsToDelete-'` matched the lowercase
`-` spelling by `-i` but not `_`; the proposed block uses `grep -iE '^teststodelete[-_]'` and `find -iname
'teststodelete[-_]*'` throughout, so it is complete for all three. The repo token and `<what>` follow the
spelling of the prefix.

**D3 — The helper contract (rule §2).** Create → register cleanup as the NEXT statement → claim — or, where the
claim can precede the resource (a held lock, a registry row), **claim first, then create** (C-c): a lock taken
before `CREATE` closes the window in which a resource exists unclaimed. A claim that
cannot be written: remove what was created, throw (so "unmarked and older than the minimum age" can only mean
"nobody's" — D5 rests on this). Teardown: exact full name, never throws/panics, bounded retries (five × 100 ms
named as the family's figure, not a law), on giving up leaves the resource prefixed AND claimed plus ONE
warning line. **Nested resources are covered by their container**: a branch, clone or worktree inside a
repository that lives in an owned folder has no prefix and no owner (S4: leave `migrate-test` and
`journal-failure` as they are, one comment citing rule §1). *Loses:* prefixing nested names — the sweep
matches leaves in shared namespaces only, so a nested prefix is a name nothing ever reads.

**D4 — The owner: shape, place, comparison (rule §3).** This is the finding the brief asked to resolve.

- **Shape:** `<host>@<os>:<pid>[:<start>]`, one line, e.g. `devbox@linux:4711:1792053744` or `devbox@windows:37560`.
  **`<start>` is optional (cadence consultation):** a writer includes it only where the OS gives it WITHOUT
  spawning a process — a `/proc` read (Node on Linux), a native process API (C# `Process.StartTime`, Rust
  `sysinfo`, on every OS) — and omits it where learning it would cost a child process per test process (Node on
  Windows: a PowerShell spawn, 0.5–2 s each, J6; Node on macOS: `ps`; every shell writer). A reader that holds
  no start on either side treats an alive pid as `live` — pid reuse then PRESERVES, the safe direction. Nothing
  keeps start mandatory, so no cost threshold is needed. `<os>` is
  `linux|macos|windows` because **a Windows machine and its WSL answer to one host name** (`hostname` → `devbox`
  on both sides here, measured) **with two pid spaces** — a Windows sweep reading a WSL-owned Docker container's
  label (the daemon is shared) would probe the wrong pid space and reclaim a live run's container. `<start>` is
  **integer Unix seconds UTC** read from the OS's record of that pid: Linux `/proc/<pid>/stat` field 22 over
  `btime` from `/proc/stat`; macOS `ps -o lstart=`; Windows the process creation time (`Get-Process`
  `.StartTime`, `Process.StartTime`, `GetProcessTimes`). Measured in WSL: the `/proc` arithmetic and
  `ps -o lstart=` agree to the second; `etimes`-derived is one second off. The writer reads its OWN start
  through the same path a reader uses for any pid — never `performance.timeOrigin` / `Date.now() −
  process.uptime()` (Node's own clock after bootstrap, ~tens of ms late, more under load; a different question
  than the one the reader asks).
- **Comparison (when both sides have a start):** `live` iff the pid is alive on this host AND
  `|start_marker − start_live| ≤ 2 s`; **a larger mismatch is `unknown`, never `gone`** (Opus review, decision C):
  Linux's start = `btime` + ticks shifts when the wall clock is stepped (a time sync, a VM after host sleep), so
  a mismatch can be a LIVE owner; only "no process with that pid" is `gone`. A reused pid then only delays
  reclamation (as on Windows and macOS, where no start is written); it never deletes anything live. Two seconds
  = two independent one-second roundings (macOS `lstart` and `btime` are whole seconds; .NET derives Linux start
  from the same `btime` and can differ from procps by one). A wider window only produces false `live` (a pid
  reused within the window) — which PRESERVES, the safe direction. A reader that cannot read start times (a
  shell) treats alive as `live`.
- **Place, per kind** (never inside the resource — `smoke-rules.test.mjs:581-588` asserts `changedPaths(dir)`
  is exactly `["new name.txt"]` on a repository rooted at its temp folder; `behaviourSmoke` refuses a worktree
  with any untracked file): **folder** → sibling file `<folder>.owner` in the same parent; **worktree** → the
  lock reason, `git worktree add --detach --lock --reason "<owner>" <path> <ref>` (one command; `--reason` on
  `add` since git 2.33, confirmed on 2.55; a locked tree is skipped by `prune` and removed with
  `remove --force --force`, or `unlock` then `remove --force`). **A folder holding a `.git` FILE is a linked
  worktree of SOME clone** (J1): its owner is read through that file — `gitdir: <path>` → `<gitdir>/locked` —
  by any reader, never from `git worktree list` alone, and never judged as an unmarked folder; a lock that names
  nobody (a bare `locked`; git writes `added with --lock` for a reason-less `--lock`) is unreadable → preserve
  (J5); **branch** → none (D3); **container / volume /
  network** → `--label testsToDelete.owner=<owner>` (Testcontainers builders add the same label);
  **database / schema / queue / collection** → two shapes (C-d): **lock-owned** where the store has a
  session-held named lock (`GET_LOCK`, advisory locks) — the run takes the lock named after the resource BEFORE
  creating it and holds it for its lifetime; the lock is the whole owner, no marker, no age: held → `live`, free
  → `gone` regardless of age, because it was taken before the resource existed and dies with the session;
  **marker-owned** otherwise — `<owner>` plus the creation time written, before the resource, into a registry
  OUTSIDE it (a server-level table or key, a claim record) that no reset of the resource can wipe; age is the
  registry's time. *Loses:* an owner row inside the database (a truncate-all wipes it); a database comment (one
  common engine has none); age from the store (one common engine records no creation time).
- **Why the alternatives lose:** *marker inside the folder* — the finding above. *Owner in the name* — eats the
  63-character budget and a Docker label exists for exactly this. *Random token held by an OS lock / open
  handle* — Node core has no `flock` and cannot set Win32 share modes, macOS ships no `flock` binary, and a bash
  janitor can neither hold nor test one; correct in C# and Rust only, so it fails "implementable in Node, C#,
  Rust and bash". *Heartbeat mtime* — needs a timer in every Rust test binary and bash script, and a process
  paused in a debugger or a laptop asleep reads as dead → a wrong deletion. *Boot-relative ticks* — not
  comparable between tools and meaningless after a reboot. *Pid only* (the family's 2026-10 precedent) — safe
  but leaks for as long as a reused pid lives; the start time is what turns "alive" into "the same process".
  *Hostname alone* — the WSL measurement.
- **Liveness, one ordered procedure** (rule §3): lock-owned first (held → `live`, free → `gone`); then
  unparseable/absent → `unknown`; foreign `host@os` → `unknown`; **no process with that pid → `gone` (the only other
  `gone`)**; query refused or failed (`EPERM`, a missing tool) → `unknown`; alive and no start on either side (or
  the live one not readable without a spawn) → `live`; within 2 s → `live`; **else → `unknown`**. Liveness itself is
  three-valued in every reader — live / dead / unknown — and a failed or refused query is unknown, never dead.
  S2's `ownerState` order is this order.

**D5 — The start-of-run sweep (rule §4).** Own `^testsToDelete-<repo>-` only, and **only worktrees its own
`git worktree list` shows** — a prefixed folder holding a `.git` file it does not list is another clone's (this
machine holds several clones with one repo token) and is preserved for that clone's sweep or the janitor (J1); minimum age **10 minutes** (a
selector: it keeps the sweep off a resource between creation and claim; a lock-owned store has no age and needs
none, a marker-owned store's age is its registry's time — C-d, and it is the window one consumer's
existing sweep already uses — E5 keeps it); removal only on `gone`; **unmarked new-form resources are `gone`
once old enough** (D3 makes an unmarked new name provably nobody's); **old prefixes** from before a migration
are matched only while a written end date in the repository's configuration has not passed, age-only (E5's
case; this repository has none — its old names never carried the prefix, so they are not the sweep's business
and are deleted by hand once). Never fails the run, one report line. *Loses:* "preserve unmarked forever" (a
crash between create and claim would leak permanently); "age alone" (the measuring harness's run store,
2026-08-16: requeued a leg another worker was measuring); 60 minutes as the minimum (the age is not the
authority, so a long window buys nothing and delays collection by an hour).

**D6 — Decision 2 in guard-checkable words (rule §6).** (a) exempt only where the configuring file carries
`testsToDelete-exempt: shared-store — <endpoint> <name>; reuse intentional; lock: <mechanism>` — the guard
checks class, reason shape and the literal `lock:`; "serialized" means a session-held store lock (`GET_LOCK`,
`pg_advisory_lock`) or an OS file lock where every run is on one machine; a reset wider than the run's own
names — flushing a logical database or namespace the run does NOT own exclusively, dropping a shared-name
database — is never exempt; a per-run prefixed logical database or namespace is the run's own name and its
teardown drops it whole (C-e). (b) a database inside a
disposable Testcontainers container: prefixed container, reaper on, no reuse, disposed, and
`testsToDelete-exempt: container-scoped — <what> lives and dies with <fixture>` beside the fixture.

**D7 — The carve-out, closed (rule §5).** Without `--rm` only when ALL hold: exact prefixed `--name`; every
named volume prefixed and listed; remover on every path (workflow: later step, same job, `if: always()`;
shell: `trap … EXIT` on a line before the `docker run`); remover after every reader
(`docker logs|cp|inspect|wait|exec|diff`); exact commands `docker rm -f -v <name>`, then `docker volume rm
<volume>` per volume; never decides the verdict — **one form per host**: `continue-on-error: true` on the step,
`|| true` after each command in the trap. Anything less is the finding *permits dropping `--rm`*.

**D8 — Guard classes and the exemption grammar (rule §7).** Classes: `raw-temp`, `raw-worktree`, `docker-run`,
`docker-name` (image tags only where a TEST step builds the image — a job that builds and pushes the product
image is the product, out of scope, no exemption needed; J3), `shared-store`, `ryuk-off` (never exemptible), plus `exemption` for a malformed exemption, and
exit 2 on a scan of nothing. **Exemptions are inline only**: `testsToDelete-exempt: <class> — <reason>` on the
line or the line above; reason ≥ 10 characters, ≥ 3 words, no placeholder (the same shape as this repository's
`owns:` markers). *Loses:* a list file — a second grammar, far from the site it excuses, and one more file a
rename forgets.

**D9 — The janitor is a shipped script with one capture (rule § The janitor; `tools/janitor.sh`).** *Cadence
consultation (epics 1–3), 2026-10-15, three accepted points.*

- **Out of the rule, into `tools/janitor.sh`.** The rule keeps the guarantees and the invocation
  (`bash .agents/conventions/tools/janitor.sh` / `bash .claude/rules/shared/tools/janitor.sh`, `--dry-run`); the
  code lives in this repository and is tested as a file, exactly as README's mounted-tools table already
  prescribes for `node .agents/conventions/tools/adapter-check.mjs` — the precedent that answers my earlier
  rejection ("consumers read the rule, not the tools"). The twin copies the script verbatim and hash-pins it.
  S3's janitor test tests the file, not an extracted fence; the rule has no fence any more.
- **One capture, captured-only deletion (TOCTOU).** `capture()` lists every prefixed resource ONCE — containers
  (`docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Label "testsToDelete.owner"}}\t{{.CreatedAt}}'`), volumes
  (name + label; age from `docker volume inspect` of the captured name), networks (ID + name + label +
  CreatedAt), this repository's worktrees (`git worktree list --porcelain`, locked reason), prefixed branches,
  prefixed temp folders (owner from the `.git` file's lock or the `.owner` sibling, age = mtime) and orphan
  `.owner` markers — into one variable, each row `kind␟id␟name␟owner␟created` with a **unit separator**, never a
  tab (bash collapses consecutive tabs in `IFS`, so an EMPTY owner or age would shift columns — this was found
  by the harness and cost four scenarios before the separator changed). Decisions are taken in the main shell
  over that capture only; deletions go by captured **ID** (containers, networks) or captured path/name. A
  resource that appears after the capture is not touched in that run. Residual, accepted: a volume or folder
  deleted and RE-CREATED under the same name between capture and deletion would be judged by the stale owner —
  names end in a random `<id>`, so a same-name re-creation inside one run is not a real case.
- **Minimum age for Docker resources** as for folders: `{{.CreatedAt}}` (containers, networks) or
  `volume inspect` CreatedAt, parsed by `epoch_of()` (GNU `date -d`, else BSD `date -j -f`; zone names and
  fractions stripped); unparseable → unknown age → left alone silently. Window `JANITOR_MIN_AGE_MINUTES`
  (default 60).
- **Per resource, fail closed, honest exit** (from the plan gate, kept): skipped kinds are named and never
  deleted; `SKIPPED` ⇒ exit 3 at the end; a failing listing ⇒ `janitor: a listing failed — nothing was removed`,
  exit 1 (explicit `|| return 1` in `capture()` and `CAPTURED=$(capture) || exit 1`, because bash does NOT
  inherit `set -e` into `$(…)` — the harness caught a stub daemon failure exiting 0 before this).
- **Everything from J1–J9 and the gate stays**: `.git`-file worktrees of any clone via `gitdir_of` (relative
  gitdir resolved), reason-less lock = unreadable, unlink top-level links then `remove --force --force` then
  `rm -rf` if the directory stands, Git for Windows' bash with `tasklist`, no-docker notice.

**Measured 2026-10-15, `tools/janitor.sh` (150 lines, `bash -n` clean), stub docker + two clones + private temp
root, helper process killed by pid at the end:** (1) **TOCTOU** — stub returns nothing on the first `ps -a` and a
live-owned prefixed container on every later call → `ps -a` called exactly once, zero `rm`, exit 0; (2) docker
age + owner — old unlabelled container → `rm -f -v c1` (by ID), young unlabelled → kept silently, old
live-labelled → skipped, old dead-labelled → `rm -f -v c4`, `prod-testsToDelete-b` never named, old volume →
`volume rm testsToDelete-v-old`, young volume kept, old dead network → `network rm n1`, exit 3; (3) live-owner
folder beside a dead old one → dead one + sibling removed, live kept and named, orphan old marker removed, exit
3; (4) deleted-clone worktree beside two dead old folders → folders removed, worktree kept, exit 3; (5) another
clone's `--relative-paths` worktree live → skipped, kept; dead → removed and unregistered; (6) this repository's
reason-less lock → skipped and still registered, prefixed branch deleted, dead junction worktrees of both clones
→ gone with the junction target intact, unlocked old other-clone worktree → gone, young dead-owned → kept; (7)
foreign host → skipped, exit 3; tree holding only a young worktree → exit 0; (8) `--dry-run` → `would run:`
lines, folder and sibling still present, exit 0; (9) two-field owner `<host>@<os>:<pid>` live → skipped, dead
→ removed; (10) no docker binary → notice, exit 0; stub `docker ps` exit 1 → `a listing failed — nothing was
removed`, exit 1. **(11, J10)** a kept (live-owned) worktree holding a checked-out prefixed branch beside a dead old folder → the
folder removed, `skipped: branch testsToDelete-conv-br-live — checked out in a worktree that was kept`, exit 3;
once that worktree's owner is dead → worktree AND branch removed, exit 0; **(12)** a captured container whose
`docker rm` fails and whose `inspect` says it is gone → `notice: container … — vanished after the capture`, the
dead old folder beside it still removed, exit 0; the same with `inspect` saying it is still there →
`skipped: … could not be removed`, exit 3. **`--dry-run` printed nothing (S3b's coder, 2026-10-15):** the J10 edit had put `2>/dev/null` after every `act …`
call, which also swallowed the `would run:` line `act` wrote to stderr. RED first: scenario 8b on sha `5110061c…`
→ `would-run lines on stdout=0`, exit 0, folder kept; fix: the redirect moved INSIDE `act` (`"$@" 2>/dev/null`
for the real command only) and `would run:` goes to STDOUT so a person can pipe it, twelve call sites lost their
`2>/dev/null`; GREEN: four `would run:` lines on stdout, empty stderr, exit 0, folder kept. **Deletions are never fatal (J10):** every removal is `… || settle`,
where `settle` re-checks the target (`docker inspect`, `git show-ref`, `test -d`): still there → skipped (named,
exit 3), gone → a notice; a prefixed branch is checked against `git worktree list` at its own pass — after the
worktree pass, so a branch whose dead-owned worktree was just removed still goes — and skipped when a kept
worktree holds it; only a failed LISTING is exit 1. **CODE gate on E1 (branch feat/test-leftovers-e1 @ 601ca07), five accepted findings — each RED on sha `4c0e4f5b…` first, then GREEN:**
(1) **safety** — the owner check was the loose `*@*:*`, so `<this host>@windows:abc` reached `alive`, the pid
lookup failed and the resource was DELETED (RED: four of five malformed-owner folders gone); now `owner_ok()`
validates the complete marker grammar `^[^@:[:space:]]+@(linux|macos|windows):[0-9]+(:[0-9]+)?$` BEFORE any
liveness question and anything else is `unreadable` → skipped (GREEN: `h@linux:abc`, `h@linux:12:x`,
`h@linux:`, `h@linux:1:2:3`, `h@beos:1` on old folders → all five kept and named, exit 3);
(2) a prefixed worktree registered in the swept repository AND living under `TMPDIR` was captured twice
(`wt-git` + `wt-dir`; RED: two `skipped:` lines for one live tree); the temp-root scan now drops any folder
whose canonical path is one of this repository's worktrees — `canon()` folds git's `C:/x` to `/c/x` BEFORE the
`cd … && pwd -P`, because MSYS resolves the two spellings through different mounts (`/tmp` vs `/c/Users/…`)
— (GREEN: dead → removed once, empty stderr; live → exactly one `skipped:` line);
(3)+(4) volume age cost one `docker volume inspect` per volume (RED: 2 calls for 2 volumes); the capture now
inspects every captured volume name in ONE `docker volume inspect --format '{{.Name}}	{{.CreatedAt}}' <names…>`
and maps CreatedAt per name (GREEN: 1 call, both old volumes removed) — the stub docker answers a multi-name
inspect;
(5) Windows liveness spawned `tasklist` per resource (RED: 3 calls for 3 folders); now ONE
`tasklist //NH //FO CSV` snapshot per run, taken lazily on the first Windows owner question (GREEN: 1 call, all
three dead-owned folders removed; a stub `tasklist` on PATH). Rejected by the gate and not done: a progress
line on stderr (it would break test 8b's empty-stderr contract). Harness scenarios 13–16 added (`extra-13-16.sh`,
run by `mini-harness.sh` against any sha, which is how RED was observed). **Opus code review (ship after fixes), three findings — each RED on sha `3f4ca10b…` first:**
(A) **liveness was two-valued** — any failure read as dead: with `tasklist` missing from PATH a 3-hour-old folder
of a LIVE owner was deleted, exit 0 (RED: 17a kept=no; 17c, an empty `tasklist` output, kept=no); on Linux a
`kill -0` of another user's live process returns `EPERM` and read as dead. Fix: `liveness()` returns 0 live / 1
dead / 2 unknown — Windows: the snapshot's exit status AND content (a matching row → live; a real snapshot without
the pid → dead; a failed `tasklist` or an empty answer → unknown); Linux: `[ -d /proc/<pid> ]`, which answers for
every user (no `kill -0` anywhere — it cannot tell "no such process" from "not permitted" without parsing a
localised message); otherwise `ps -p <pid>` (exit 1 → dead, anything else → unknown); unknown ⇒
`skipped: … liveness unknown for process <pid>`, exit 3. GREEN: 17 (missing tasklist → kept+named exit 3; rows
without the pid → removed; empty output → kept) and 18 (via the `JANITOR_OS` test seam and a `ps` stub: exit 2 →
kept+named, exit 1 → removed, exit 0 → skipped live).
(B) **the MAIN worktree was a candidate** — run inside a prefixed, unlocked, 3-hour-old clone under `TMPDIR`,
`git worktree remove` refused and `rm -rf` deleted the clone it ran from (RED: 19 clone survives=no). Fix: the
first porcelain block is dropped (as the Node sweep's `listing.slice(1)`), and the temp-root scan never
considers the toplevel the janitor runs from or any folder containing it (`git rev-parse --show-toplevel`,
canonical). GREEN: 19 clone survives, exit 0.
(C) **a start-time mismatch is `unknown`, never `gone`** — the janitor compares no start (bash never did), so
this is a rule-text and S2 change (D4, §3). Cosmetic, unchanged: this repository's own skipped worktree is announced twice (git's `C:/`
and find's `/c/` spelling).

**D10 — Text constraints (rule-wide).**

- Body **17 437 B** (file 17 548 B), from 4 736 B — the janitor's code left the rule for `tools/janitor.sh`
  (150 lines), the `## Tokens` table gained the twin's eleven rows, §3 gained the optional start. The two core
  spans total 16 042 B. Over the stories document's *recommended* 12 KiB, under the
  32 KiB per-rule cap (`tools/lib/rule-cli.mjs:112`). The five tasks that select it are all split-read tasks
  (read one rule per `--only`), so the only bound is per rule; the per-scope 32 KiB test at
  `rules.test.mjs:213-216` covers the four single-read tasks, none of which selects this rule — verified by
  enumerating every task × scope on a scratch copy. Per-task selection bytes, origin → proposed: implement
  248 464 → 261323; test 241 032 → 253891; audit 151 035 → 163894; policy 198 338 → 211197; release
  210 488 → 223347 (+5.2 % on implement). A tightening pass removed 270 B; what remains is a guard-checkable
  clause or the dated evidence for one, and the janitor's code is no longer in it. My earlier rejection of moving the janitor out of the rule is
  withdrawn: README's mounted-tools table (`node .agents/conventions/tools/adapter-check.mjs`) is the precedent,
  and the rule now carries the guarantees and the invocation while `tools/janitor.sh` carries the code.
- `tools/ownership-check.mjs` → **OK** on the proposed body (precedents anonymised and dated: 2026-10-14 two
  processes on one database, 2026-08-16 run store, 2026-10-15 marker finding and WSL; the `coai` token row under
  an `owns:` marker). **Core purity for the twin (C-a, C-b, C-g), checked by script on the two spans:** no markdown
  link, none of the words npm/jest/Playwright/tsc/nice/uv, no "here", no "six repositories", no "this family";
  the audit figures and the token rows live in the `## Tokens` section BETWEEN the spans, which each family
  writes for itself.
- `node tools/rule-bodies.mjs --update common.test-leftovers` records 11 headings (sha moves from
  `34cb7bb4…`); the freeze test is then green.
- `tasks:` unchanged (`implement, test, audit, policy, release`): a `plan` task links to the rule and reads it
  deliberately; selecting 15 KB of mechanics into every plan scope costs more than the link.
- `## Tokens` is a non-core section between the spans (our seven rows, three columns; no other family named). Heading `## The sweep` is renamed **`## The janitor`** (the word *sweep* now means the start-of-run sweep of
  §4); it holds NO fence any more — the code is `tools/janitor.sh`, which S3b ships and tests as a file.
- *Never* gains: never tear down by the SHARED prefix (C-f — a run's own per-run namespace is its own name); never age-only, never fail the run; never drop `--rm` without
  the complete carve-out; never put the owner inside the resource. *DoD* has four items, one per promise.

### Scenarios — the guarantees the text makes, and how each is observed

Code-observable, RED first where the code can prove it:

1. **A changed body is a red suite until it is recorded.** Copy the proposed body over
   `common/test-leftovers.md`; `node tools/rule-bodies.mjs` → `DRIFT common.test-leftovers` (observed on the
   scratch copy); `node --test --test-name-pattern "live body" tools/rules.test.mjs` → red naming
   `bodySha256`. Then `--update common.test-leftovers` → `OK — 37 rule(s)`, the test green. Both observations
   go in the PR.
2. **No product is named.** `node tools/ownership-check.mjs` → `OK` (observed). RED proof of teeth: insert the
   phrase `the benchmark` into a scratch copy → one finding; remove it → OK.
3. **The janitor is a file, and the rule carries no code.** The body under `## The janitor` has zero fenced
   blocks (`sectionsOf` still lists the heading); `bash -n tools/janitor.sh` → 0 (S3b ships and tests the file).
4. **The janitor's verdicts** — S3b's scenarios (below); the ten harness runs in D9 are the RED/GREEN record.
5. **Core spans.** Exactly two `<!-- core:begin -->` and two `<!-- core:end -->`, in order; a script that
   concatenates the spans of this file and of the twin's byte-compares them — the twin's E1 runs it.
6. **Byte cap.** `bodyOf(...)` ≤ 32 768 (it is 17 437); the five selection figures of D10 re-measured with
   `node tools/rules.mjs explain --task <t> --repo .` and written into the PR.

Review checklist for the prose (Opus, against this section and S2–S4):

- [ ] Every slot S2–S4 name as *S1 §…* resolves to ONE sentence of the rule: id alphabet (§1), `what`
      validation (§1), 63 characters (§1), owner shape and place (§3), 2 s (§3), 10 minutes (§4), unmarked (§4),
      old prefix with end date (§4), carve-out shape (§5), 2a/2b (§6), classes and grammar (§7).
- [ ] No sentence reads two ways: *sweep* means §4, *janitor* means the bash block, *teardown* means the run's
      own; *claim*/*owner* are the same thing; `live`/`gone`/`unknown` appear with the same meaning everywhere.
- [ ] Both core spans are stack-neutral: no Redis, MySQL, Qdrant or Postgres-only sentence inside them beyond
      the named lock functions as examples; no link, none of npm/jest/Playwright/tsc/nice/uv, no family fact; the
      twin's own section and its `## Tokens` rows go between the spans.
- [ ] The `## Tokens` table has our seven rows in three columns (`token | family | repository`), wording frozen for the twin's line compare; no other family's name or token anywhere in the file (`grep` the file for the twin's family name and its tokens → nothing); `coai` carries its `owns:` marker.
- [ ] The example names in the rule carry the repo token; no `testsToDelete-pg-…` survives.

### The brief — for whoever edits the rule

- **Files.** `common/test-leftovers.md` (body from `test-leftovers.proposed.md`, frontmatter untouched);
  `research/rule-bodies.json` (via the tool only).
- **Order.** (1) overwrite the body; (2) `node tools/ownership-check.mjs`; (3) `node tools/rule-bodies.mjs`
  and record the DRIFT line; (4) `node tools/rule-bodies.mjs --update common.test-leftovers`; (5) `bash -n tools/janitor.sh` once S3b has landed
  it (nothing to extract — the rule has no fence); (6) `npm test`; (7) `npm run check`; (8) the five `explain` figures into the PR.
- **Commit.** One commit: `docs(rules): test-leftovers — owner liveness, start-of-run collection, three
  spellings, the container carve-out, the guard grammar` with the two observations of scenario 1 in the body.
- **Do not** touch `common/testing.md` or any coai tier rule; do not shorten the janitor block; do not rename
  the frontmatter id.

### What this spec changes in S2–S4 (binding on their coders)

- **S2.** `thisOwner()` returns `{ host: "<hostname>@<linux|macos|windows>", pid, start? }`; **`start` only on
  Linux** (read from `/proc/self/stat` + `btime`, no spawn) and absent elsewhere — the Windows PowerShell probe
  and the macOS `ps` probe disappear from the writer; `processProbe` reads a live start only on Linux and returns
  `start: undefined` elsewhere; `ownerState`: alive and no start on either side → `live`; **start times further than 2 s apart → `unknown`**
  (never `gone`; decision C); `processProbe` answers with a NAMED state — `state: "live"|"dead"|"unknown"` (a bare `alive` flag's third value, `undefined`, vanishes from JSON) — and `unknown`
  (refused or failed, or a pid that is not a positive safe integer) is `unknown`, never `gone`; the J6 DoD measurement is moot on Windows. The serialised form is `${host}:${pid}` plus `:${start}` when present; `readOwner` accepts
  only `^([^@:\s]+@(linux|macos|windows)):(\d+)(?::(\d+))?$`, everything else `{ unreadable: true }`. `writeOwner(dir,
  "folder")` writes the **sibling** `<dir>.owner` in `dir`'s parent (so `parent:` is honoured); `removeQuietly`
  removes the folder, then the sibling. **Worktrees carry no file**: `ownedWorktree` runs `git worktree add
  --detach --lock --reason "<owner>" <path> <ref>`; `readOwner(path, "worktree")` parses the `locked …` line of
  `git worktree list --porcelain` for that path; teardown is `beforeRemove` fns → `git worktree unlock` → `git
  worktree remove --force --force` → `removeQuietly` only if every `beforeRemove` succeeded → `prune`.
  `ownerState` order is D4's, tolerance 2 s where both sides have a start; no probe ever spawns a process (start
  is read only from `/proc` on Linux, and omitted elsewhere). `what`: may
  contain `-` and a trailing space; the length check is the WHOLE name ≤ 63 (`OWNED.length + what.length + 1 +
  6 ≤ 63`). Scenario 10 now proves: `git status --porcelain --untracked-files=all` is empty in a repository
  rooted at an `ownedDir` (sibling marker) and in an `ownedWorktree` (lock reason). Scenario 7 asserts the
  leftover is prefixed AND its `.owner` sibling still exists. `readOwner(path, "worktree")` reads the lock through
  the folder's `.git` file (`gitdir:` → `<gitdir>/locked`, a relative gitdir resolved against the folder — J9),
  not only from `git worktree list`, so S3 can judge any
  clone's tree; a bare `locked` / `added with --lock` is `{ unreadable: true }` (J5). There is no per-process start-time cost to measure: start is omitted off Linux (J6 superseded).
- **S3b (new step, after S3, before S5): `tools/janitor.sh` shipped and tested.** Files: `tools/janitor.sh`
  (copy `…\scratchpad\janitor.sh` verbatim — 150 lines, header comment included; executable bit set),
  new `tools/janitor.test.mjs` (replaces the "extract the fence" test planned for S3), README tool-table row
  (`tools/janitor.sh` · `common/test-leftovers.md` § The janitor · `bash .agents/conventions/tools/janitor.sh
  [--dry-run]`). The test is the harness as `node:test`: a stub `docker` first on `PATH` that logs argv and
  answers `ps -a`, `volume ls`, `volume inspect`, `network ls` from per-scenario fixtures (TOCTOU mode: empty on
  the first `ps -a`, a live container afterwards), two disposable clones and a private `TMPDIR` in owned folders,
  Git for Windows' bash resolved from `git --exec-path` on win32 (never `%SystemRoot%`'s), a helper child killed
  by pid. Scenarios = D9's nineteen (incl. 11: a kept worktree's checked-out prefixed branch is skipped and named while a
  dead folder beside it goes; 12: a vanished target is a notice and later passes still run; 13: malformed owners are unreadable, never
  deleted; 14: one row per worktree; 15: one volume inspect for N volumes; 16: one tasklist per run; 17–18: three-valued liveness on both branches;
  19: the clone the janitor runs from survives), each asserting
  stderr lines, exit code, what remains and the stub's recorded `rm`/`volume rm`/`network rm` argv (by ID). RED first: write the test against the file, run it before the file
  exists (fails on spawn), then with the file. DoD: green on Windows (Git Bash) and the Linux CI runner; the
  twin copies the file verbatim and hash-pins it (its S-step). The file as specified: 25 644 B, 308 lines,
  sha256 `bf9f0c64846f1d8d52405a9c4e713f893078f7d27a7d3a2044f73ad9c79ed8e1` (after the Opus review's A/B and the code-gate round 3; earlier shas `036785f5…` (before the security batch, 19 894 B, 231 lines), `0644a175…` (the round-2 file, 12 166 B, 150 lines), `3f4ca10b…`, `4c0e4f5b…`,
  `5110061c…`). **Dead pids in the tests are never a killed child's pid** — a pid the janitor's own query can
  never match, with the premise asserted first: Windows a pid ≡ 2 (mod 4) (Windows pids are multiples of 4),
  Linux `pid_max + 1` (read from `/proc/sys/kernel/pid_max`), macOS 100000; the harness's `999999` is ≡ 3 (mod 4)
  and serves on Windows only. The non-Windows liveness branch is exercised through the `JANITOR_OS` seam with a
  `ps` stub; the Windows branch with `tasklist` stubs that are missing, silent, or answer without the pid. Test 8b asserts the `would run:` lines on STDOUT (at least three for an old dead
  folder: `git worktree prune`, the `find … -type l -delete`, the `rm -rf`, the sibling's `rm -f`), exit 0, folder
  kept.
- **S3.** `minAgeMs` = 10 minutes. **J1 is the rule now**: the sweep removes only worktrees its own `repo` lists;
  a prefixed folder holding a `.git` file that `repo` does not list is preserved with reason `other clone`
  (scenario 2 gains that case: a worktree of a second disposable repository, old, dead-owned, survives this
  repository's sweep). Unmarked prefixed folders of the new form older than that are `gone`. Sweep
  order: worktrees (unlock → remove `--force --force` → prune once) then folders (+ siblings). The janitor is S3b's (a file, not a fence): S3 keeps only the start-of-run sweep and its own scenarios.
- **S4.** The guard also asserts `REPO_TOKEN` is a row of `common/test-leftovers.md`'s `## Tokens` table (C7;
  break-it: a token not in the table ⇒ exit 1). Classes are D8's: add `shared-store` and `exemption`; `docker-name` on image tags only where a test
  step builds the image, and a `docker build -t` whose tag is pushed by the same job/file is out of scope (J3; this
  repository has no image, so it is a pattern with a fixture, not a migration); `docker-run` readers include `exec|diff`;
  verdict forms are `continue-on-error: true` (workflow) and `|| true` (trap). Exemptions inline only. Branches
  `migrate-test` / `journal-failure` stay, one comment citing rule §1. `plan-lifecycle ` keeps its trailing
  space. The worktree helper's lock reason is outside the tree, so `behaviourSmoke` is unaffected — S2
  scenario 10 is the proof S4 relies on.
- **S5.** README gains the `tools/janitor.sh` row (S3b writes it; S5 checks it); the twin receives BOTH core
  spans, our seven `## Tokens` rows for its subset check, and `tools/janitor.sh` verbatim (hash-pinned there); `module_tests.md`
  names the janitor heading by its new name.

### Judge's notes — resolution

| Note | Resolution |
|---|---|
| J1 | Applied in the rule (§3 worktree row, §4 sweep bullet, the janitor). A linked worktree is judged by its lock read through its `.git` file by any reader; a repository's sweep removes only trees it lists; the janitor handles any clone's trees via `--git-dir`. A worktree whose lock cannot be read — gitdir unresolvable or its clone gone — is skipped and named, never `rm -rf`'d (fail closed, see J9); the earlier "removed by age" deviation is withdrawn. |
| J2 | Applied: unlink top-level links before `remove`, `rm -rf` a directory that survives; MSYS `rm -rf` and `find -type l -delete` measured safe against a junction. |
| J3 | Applied: `docker-name` covers image tags only where a test step builds the image; publishing is the product and out of scope. |
| J4 | Applied: 35 + 63 + 1 + 74 = 173 of 260. |
| J5 | Applied: a lock that names nobody is unreadable → skipped and named (the janitor prints `-` for it; git's own `added with --lock` text is skipped the same way). |
| J6 | Superseded by the cadence consultation: start is optional and never obtained by spawning, so there is no per-process cost to measure. |
| J7 | Applied: no `docker` binary → one notice, git and temp lines still run, exit 0; a failing daemon → non-zero. |
| J8 | Applied: "on Windows, Git for Windows' bash, never WSL's" in the rule. |
| J9 | Applied: `gitdir_of` resolves a relative `gitdir:` against the worktree; the deletion path fails CLOSED — a `.git`-file folder whose gitdir cannot be read is skipped in the owners pass and again in the age loop, never `rm -rf`'d. Measured: `--relative-paths` worktree live → skipped, exit 3; dead → removed. The earlier deviation (deleted clone ⇒ age) is withdrawn: the folder is skipped and named (one `rm -rf` by hand clears it) while everything else is still collected. |

### Binding on the twin's stories (`PLAN_test_leftovers_E1_corp.md`)

- Copy BOTH core spans byte for byte (19 296 B together, checked free of links, of npm/jest/Playwright/tsc/nice/uv,
  and of any family fact); place the twin's own section(s) between them: the Redis/MySQL isolation paragraph, the
  `GET_LOCK` example, and its `## Tokens` rows.
- **Stores (C-c, C-d):** a MySQL database is **lock-owned** — `GET_LOCK('teststodelete_<repo>_<what>_<id>', 0)`
  taken BEFORE `CREATE DATABASE`, held on a connection the run keeps open for its lifetime; the sweep's authority is
  `IS_USED_LOCK(name)` (held → live, free → gone, no age, no marker). A Redis key prefix or queue is
  **marker-owned**: the owner and the creation time go into a registry key OUTSIDE the prefix (a server-level key
  the run's own `DEL` of its prefix never touches), written before the first key.
- **C-e:** a per-run Redis logical DB or key prefix the run owns exclusively is cleared whole by its teardown; a
  shared logical DB is never flushed.
- **C-f:** "never tear down by the SHARED prefix" — a run's own namespace is its own name.
- **C7:** the twin's `## Tokens` rows (one per consumer, `[a-z0-9]{2,12}`, unique against this family's seven)
  are written in its E1 and sent back; its guard checks each consumer's constant against the mounted table.
- The janitor is `tools/janitor.sh`, copied verbatim and hash-pinned in the twin; its S-step runs the same ten
  harness scenarios against the file (its consumers have no Testcontainers, so the Docker lines are exercised by
  stubs only). The `## Tokens` table: the twin carries every token of both families and its test checks that our seven rows
  appear in it verbatim and that all tokens are unique; this public repository lists only its own (J11).

### Corporate judge's notes — resolution

| Note | Resolution |
|---|---|
| C-a | Applied: the audit figures left the core; they sit in the `## Tokens` section between the spans, which each family writes for itself. |
| C-b | Applied: "(found in one repository, 2026-10-15)". |
| C-c | Applied in §2: "or, where the claim can precede the resource (a held lock, a registry row), claim first, then create, so nothing ever exists unclaimed". |
| C-d | Applied in §3 (store row + liveness) and §4: lock-owned stores — lock taken before CREATE, held for the run's lifetime, held ⇒ live, free ⇒ gone regardless of age, no marker; marker-owned stores — owner + creation time in a registry OUTSIDE the resource that no reset can wipe, age = the registry's time. The twin names MySQL (`GET_LOCK`/`IS_USED_LOCK`) in its own section. |
| C-e | Applied in §6: "flushing a logical database or namespace the run does not own exclusively … is never exempt; a per-run, prefixed logical database or namespace is the run's own name, and its teardown drops it whole". |
| C-f | Applied in *Never*: "by the shared prefix — teardown is by the exact names the run generated". |
| C-g | Checked by script on the two spans: no markdown link; none of npm/jest/Playwright/tsc/nice/uv; the precedents inside the core are dated and anonymised. |
| C7 | Applied: §1 says a token is registered before use in the mounted rule's `## Tokens` table — a rule repository lists every token that can share a machine with its family; a public one lists only its own, the private one carries both — and a guard refuses an unregistered constant. This repository lists its seven rows; the twin carries all and checks uniqueness (J11). |

### E1 plan gate (coai), 2026-10-15 — resolution

| Finding | Resolution |
|---|---|
| Whole-run refusal wedges cleanup | Applied: per-resource skipping with one named notice each, every `gone` resource removed, exit 3 at the END if anything was skipped (0 otherwise, 1 on a Docker daemon failure). Fail-closed kept: a skipped kind is never `rm -rf`'d. Core lines changed: the janitor's prose paragraph and the bash block (56 lines; since moved to `tools/janitor.sh`, 150 lines). |
| One live parallel run blocks everything | Same change; measured: a live owner beside a dead one → the dead one removed, the live one kept and named, exit 3. |

### Cadence consultation (epics 1–3), 2026-10-15 — resolution

| Point | Resolution |
|---|---|
| (1) TOCTOU | Applied: one `capture()` with identity + owner + age per resource (containers by ID, networks by ID, volumes by name with `inspect` age), decisions over the capture only, deletions by captured id/path; a later resource is untouched. Minimum age applied to containers/volumes/networks. Harness scenario 1 (interleaving) → one `ps -a`, zero removals. Two bugs the harness found on the way are recorded in D9 (tab `IFS` collapsing empty fields; `set -e` not inherited by `$(…)`). |
| (2) Script, not fence | Applied: `tools/janitor.sh` (150 lines) in this repository, run from the mount; the rule keeps guarantees + invocation; new step S3b ships and tests it; README row; the twin copies and hash-pins it. My D10 rejection withdrawn on the README precedent. |
| (3) Optional start | Applied: `<host>@<os>:<pid>[:<start>]`; start only where obtained without a spawn (Linux `/proc`, native APIs); Windows and other spawn-only writers omit it; a reader with no start on either side treats alive as live. Nothing keeps start mandatory, so no cost threshold. Harness scenario 9 covers the two-field form. |
| Tokens (coordinator) | Applied, then narrowed by J11: three-column table `token | family | repository`, this repository's seven rows only (wording frozen for the twin's line compare), `conventions` row reworded, the "appended later" sentence dropped; the twin holds the full table. |

### Twin judge, second round — resolution

| Note | Resolution |
|---|---|
| J10 | Applied in `janitor.sh`: no deletion is fatal — each removal is `… \|\| settle` (target still there → skipped and named, exit 3; gone → notice); a prefixed branch is checked against `git worktree list` at its pass (after worktrees) and skipped with a named line when a kept worktree holds it; only a failed listing exits 1. Harness scenarios 11 and 12 added and green. |
| J11 | Applied: this public repository's `## Tokens` lists only its own seven rows (three columns, wording frozen); every other-family name and token removed from the rule and from this spec; core §1 carries the corporate sentence ("a rule repository lists every token that can share a machine with its family; a public one lists only its own, and the private one carries both"); uniqueness is enforced by the private twin's subset-and-uniqueness test; the guard here checks `REPO_TOKEN` against our seven rows. Stale S2 (PowerShell/J6), S3 (fence extraction) and brief step 5 (awk) paragraphs cleaned. |

### S3b coder's finding, 2026-10-15 — resolution

| Finding | Resolution |
|---|---|
| `--dry-run` prints nothing | Applied: `act()` now prints `would run: …` to stdout and silences only the real command (`"$@" 2>/dev/null`); the twelve `act … 2>/dev/null` call sites lost their redirect. RED observed on sha `5110061c…` (zero lines), GREEN after (four lines, folder kept). New file: 9 296 B, 150 lines, sha256 `4c0e4f5b187dc7787502095b09b360e1792d5561b21cdaad2ba10654ccfd2037`. Scenario 8 of the harness (= S3b test 8b) now asserts the lines. |

### CODE gate on E1 (coai), 2026-10-15 — resolution

| Finding | Resolution |
|---|---|
| (1) loose owner check deletes on a malformed pid | Applied: `owner_ok()` validates the full marker grammar before any liveness check; malformed → unreadable → skipped. RED (4 of 5 deleted) → GREEN (5 kept, 5 named). |
| (2) a worktree captured twice | Applied: temp-root scan skips this repository's own worktrees by canonical path (`canon()` folds the drive spelling before `pwd -P`). RED (2 lines) → GREEN (1 line; dead removed once, silent). |
| (3)+(4) N+1 volume inspects | Applied: one multi-name `docker volume inspect` in the capture; stub extended. RED (2 calls) → GREEN (1). |
| (5) tasklist per resource | Applied: one `tasklist //NH //FO CSV` snapshot per run, lazily. RED (3 calls) → GREEN (1). |
| progress line on stderr | Rejected by the gate; not done (8b's empty-stderr contract). |

New file: 10 769 B, 150 lines, sha256 `3f4ca10b32c906dface8769ad17a3e37684b85e7c749d1d7066e81a56fb6a6a1`.

### Opus code review on E1, 2026-10-15 — resolution

| Finding | Resolution |
|---|---|
| (A) two-valued liveness deletes on a failed query | Applied: `liveness()` is live/dead/unknown; Windows judges the snapshot's exit status and content, Linux reads `/proc/<pid>`, else `ps -p`; `kill -0` removed; unknown ⇒ skipped, exit 3. RED 17/18 → GREEN. |
| (B) the main worktree was a candidate | Applied: first porcelain block dropped; the toplevel the janitor runs from (and any folder containing it) is never a temp-root candidate. RED 19 → GREEN. |
| (C) start-time mismatch read as `gone` | Applied in the core §3 (a mismatch → `unknown`, only "no process with that pid" is `gone`), in D4 and in the S2 binding (`ownerState` returns unknown on mismatch; `processProbe` three-valued). The janitor never compared starts. |
| dead pids in tests | Noted for S3b: a pid the query can never match, premise asserted (Windows ≡ 2 mod 4, Linux pid_max + 1, macOS 100000). |

New file: 25 644 B, 308 lines, sha256 `bf9f0c64846f1d8d52405a9c4e713f893078f7d27a7d3a2044f73ad9c79ed8e1`. Rule body 17 437 B.

## S2 — The Node owned-resource helper and owner liveness

- **Models.** Brief by Opus (this section); code by a Sonnet coder; review by Opus against this section, rule §1–§3
  and D1–D4.
- **Goal.** One module through which every test here creates a temp folder or a worktree: the name from one constant
  (rule §1), cleanup registered on the next statement, the claim (rule §2–§3), exact teardown that never throws, and
  the liveness answer the S3 sweep trusts — for this clone's worktrees and any other clone's.
- **Files.** New `tools/lib/owned.mjs`; new `tools/owned.test.mjs`. Every git call goes through `tools/lib/git.mjs`
  (`git`, `gitOutput`) — no second git wrapper.

**The change.** `tools/lib/owned.mjs`, ES module, Node ≥ 20, imports only `node:*` and `./git.mjs`. A block comment in
the voice of the other `tools/lib` modules: what it owns, why cleanup is registered before the claim, why teardown
never throws, why the owner lives beside the folder and in the worktree's lock (rule §3) and never inside.

```js
export const PREFIX = "testsToDelete-";                        // rule §1
export const REPO_TOKEN = "conventions";                       // rule §1 — the ONLY place the token is written
export const OWNED = `${PREFIX}${REPO_TOKEN}-`;
export const OWNED_PATTERN = /^teststodelete[-_]conventions[-_]/i; // what this repository's sweep matches (rule §1, §4)
export const MAX_NAME = 63;                                    // rule §1
export const ID_LENGTH = 6;                                    // mkdtemp's six (D1)
export const START_TOLERANCE_S = 2;                            // rule §3

export function tempRoot()                        // os.tmpdir() — the one place a test learns the temp root (S4: raw-temp)
export function ownedPrefix(what)                 // `${OWNED}${what}-` after validating `what`
export function ownedName(what)                   // ownedPrefix(what) + ID_LENGTH chars of [A-Za-z0-9] (crypto.randomBytes)
export function cleanupScope()                    // { after(fn), close(): Promise<void> }
export function ownedDir(scope, what, { parent = tempRoot() } = {})        // → absolute path
export function ownedWorktree(scope, repo, what, { ref = "HEAD", parent = tempRoot() } = {}) // → { path, beforeRemove(fn) }
export function thisOwner()                       // { host: "<hostname>@<linux|macos|windows>", pid, start? } — cached; start on Linux only
export function formatOwner(owner)                // `${host}:${pid}` plus `:${start}` when start is present
export function parseOwner(text)                  // owner | { unreadable: true }
export function writeOwner(dir)                   // the sibling `${dir}.owner`
export function gitdirOf(dir)                     // absolute gitdir of a linked worktree at `dir`, or "" (not one)
export function readOwner(target, kind)           // kind "folder" | "worktree" → owner | null | { unreadable: true }
export function processProbe(pid)                 // { state: "dead" } | { state: "unknown" } (refused/failed/not a process id) | { state: "live", start? } — never spawns
export function ownerState(owner, probe = processProbe) // "live" | "gone" | "unknown"
export function removeLink(link)                  // win32: fs.rmdirSync; else fs.unlinkSync — never follows the link
export function removeQuietly(dir)                // folder, then its `.owner` sibling; never throws (the sweep reuses it)
```

- **`what`** (rule §1, D1): a non-empty string; no `/`, `\`, NUL or other control character (`< 0x20`, `0x7f`); not
  starting with `-`; MAY contain `-`, spaces, a trailing space and non-ASCII; and the WHOLE name fits —
  `OWNED.length + what.length + 1 + ID_LENGTH <= MAX_NAME` (here: `what` ≤ 30). Invalid ⇒ `TypeError` naming the
  value, before anything is created.
- **`scope`** is anything with a function `after` — `node:test`'s `t` or a `cleanupScope()`; anything else ⇒
  `TypeError` before creation. `cleanupScope().close()` runs the callbacks last-registered-first, each in its own
  `try/catch`, awaits promises, and never rejects.
- **`ownedDir`** (rule §2's order — create, register, claim): `const dir = fs.mkdtempSync(path.join(parent,
  ownedPrefix(what)))`; the NEXT statement is `scope.after(() => removeQuietly(dir))`; then `writeOwner(dir)` inside
  `try`; if the claim throws, `removeQuietly(dir)` and throw `Error("owned: could not claim <dir>: <cause>")` — a
  resource that cannot be claimed is a resource the run does not create.
- **`writeOwner(dir)`**: `fs.writeFileSync(`${dir}.owner`, formatOwner(thisOwner()) + "\n", { flag: "wx" })` — in
  `dir`'s own parent, so `parent:` is honoured. Nothing is ever written inside `dir`.
- **`removeQuietly(dir)`**: `fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })`, then
  `fs.rmSync(`${dir}.owner`, { force: true })`, each in its own `try/catch`; on any failure ONE stderr line
  `owned: could not remove <path> (<code>) — left for the start-of-run sweep` and return. The folder goes first: if
  it cannot be removed, its sibling stays, so the leftover stays claimed (rule §2).
- **`ownedWorktree`**: `path = path.join(parent, ownedName(what))` — its own leaf directly in `parent` (the temp root
  by default; S3/S3b pass a private temp root), never nested under another owned folder's tree; `git(repo, "worktree", "add", "--detach", "--lock", "--reason", formatOwner(thisOwner()),
  path, ref)` (create and claim are one command — D4); the NEXT statement registers `scope.after(teardown)`.
  `beforeRemove(fn)` appends to a list. **Teardown**, every step in its own `try/catch`, never throwing: run each
  `beforeRemove` fn → `git worktree unlock <path>` → `git worktree remove --force --force <path>` → if the path still
  exists (measured: git leaves the directory when it holds a junction) AND every `beforeRemove` fn succeeded,
  `removeQuietly(path)` → `git worktree prune`. A failed `beforeRemove` means the folder may still hold a junction into
  this checkout's `node_modules`; it is not `rmSync`'d, it stays prefixed (and, if `remove` failed, locked) for the
  sweep, with the warning line.
- **`thisOwner()`**: `host` = `${os.hostname()}@${tag}` with `tag` = `linux` | `macos` (darwin) | `windows` (win32) —
  any other platform throws (so the helper refuses to create: no claim, no resource); `pid` = `process.pid`; `start`
  **only on Linux** = `processProbe(process.pid).start` (a `/proc` read, no spawn — D4 *optional start*); on Windows
  and macOS the owner has no `start` at all — the writer never spawns PowerShell or `ps`, and never uses
  `performance.timeOrigin`. Computed lazily on first use and cached for the process. On Linux, a `/proc` read that
  fails leaves `start` absent (the two-field form), it does not throw.
- **`parseOwner(text)`**: strip one trailing `\r?\n`; match `^([^@:\s]+@(linux|macos|windows)):(\d+)(?::(\d+))?$` →
  `{ host, pid: Number, start?: Number }` (`start` absent when the third field is); anything else — the empty
  string, git's own `added with --lock`, `hands off` — ⇒ `{ unreadable: true }` (J5).
- **`gitdirOf(dir)`**: read `<dir>/.git`; if it is a FILE whose first line is `gitdir: <g>`, return `<g>` resolved
  against `dir` when relative (`git worktree add --relative-paths` and `worktree.useRelativePaths` write
  `gitdir: ../repo/.git/worktrees/<id>` — measured, git 2.55), else `""`. A directory `.git`, no `.git`, or an
  unreadable one ⇒ `""`. Never throws.
- **`readOwner(target, "folder")`**: the sibling `${target}.owner` — absent ⇒ `null`; unreadable file or bad content
  ⇒ `{ unreadable: true }`. **`readOwner(target, "worktree")`** reads the lock through the worktree's own `.git` file,
  whatever clone owns it (S1's binding change, J9): `<target>/.git` not a FILE ⇒ `null` (not a linked worktree);
  a `.git` file whose `gitdirOf` is `""` or names a directory that does not exist (a deleted clone) ⇒
  `{ unreadable: true }` — fail closed, never "unmarked"; `<g>/locked` absent ⇒ `null` (unlocked = unmarked);
  present ⇒ `parseOwner(<g>/locked contents)`. Never throws.
- **`processProbe(pid)`** has THREE NAMED states: a pid that is not a positive safe integer (0 and negatives address process groups) ⇒ `{ state: "unknown" }` without a signal; otherwise `process.kill(pid, 0)` — `ESRCH` ⇒ `{ state: "dead" }` (the only answer that
  means "no such process"); any other error (`EPERM`, `EACCES`, anything) ⇒ `{ state: "unknown" }` — the query was
  refused or failed, nothing is known; success ⇒ `{ state: "live" }`, and **only on Linux** a `start` (integer Unix seconds UTC, D4): `/proc/<pid>/stat`,
  parsed AFTER the last `)` (the command name may hold spaces and parentheses), field 22 = index 19 of the remainder
  split on spaces, divided by the clock-tick rate (`100`, the value every Linux the family runs on reports for
  `CLK_TCK` — no `getconf` spawn), plus `btime` from `/proc/stat`, floored. Any failure, and every other OS ⇒
  `{ state: "live" }` with no `start`. `ownerState` reads `state` only (a bare `alive` is `unknown`) and refuses a pid that is not a positive safe integer before asking. `processProbe` never spawns a process.
- **`ownerState(owner, probe)`** — rule §3's order exactly (D4): `null` or `{ unreadable }` ⇒ `"unknown"`;
  `owner.host` ≠ `thisOwner().host` compared case-insensitively ⇒ `"unknown"`; (no store locks in this repository)
  `probe(pid)`: `alive === false` ⇒ `"gone"` and ONLY that; `alive` anything but `true` (`undefined`, a probe that says
  nothing or throws) ⇒ `"unknown"`; alive and `owner.start` OR the probe's `start` absent ⇒ `"live"` (pid reuse then
  PRESERVES, the safe direction); both present and `|owner.start − start| <= START_TOLERANCE_S` ⇒ `"live"`; otherwise ⇒
  `"unknown"` — a start mismatch is a reused pid or a skewed clock, and neither is proof of death (rule §3; the Opus code
  review, 2026-10-15). (The sweep, not `ownerState`, decides what an unmarked `null` means — rule §4.)

**Scenarios** (`tools/owned.test.mjs`; RED first — write it against the exported names before the module exists, watch
it fail on the import, then on each assertion as the module grows). Every test learns the temp root from `tempRoot()`
only; no scenario touches this checkout's worktree list.

1. `ownedName("pg")` matches `^testsToDelete-conventions-pg-[A-Za-z0-9]{6}$`; two calls differ; `ownedName("a-b ")`
   (a separator and a trailing space) is accepted.
2. `ownedDir(t, "rules Unicode пробел")` creates a folder in `tempRoot()` whose name starts with
   `testsToDelete-conventions-rules Unicode пробел-`, and a sibling `<folder>.owner` whose content parses to
   `thisOwner()`.
3. `what` of `""`, `"a/b"`, `"a\\b"`, `"-x"`, `"a\u0001b"`, and one 31 characters long each throw `TypeError`, and the
   count of `OWNED_PATTERN` entries in `tempRoot()` is unchanged.
4. A `scope` without `after` throws `TypeError` and creates nothing.
5. **Unwind, in-process**: `const s = cleanupScope(); let dir; try { dir = ownedDir(s, "unwind"); throw new
   Error("x"); } catch {} finally { await s.close(); }` ⇒ neither `dir` nor `${dir}.owner` exists.
6. **Unwind through `node:test`**: write into an owned folder a child file `child.mjs` (NOT `*.test.mjs`) that imports
   `owned.mjs` by file URL, creates `ownedDir(t, "child-unwind")` in a test, prints the path, and throws; run
   `process.execPath --test <child>`; the child exits non-zero, and neither the printed path nor its `.owner` exists.
7. **Teardown never throws, and what it leaves stays claimed**: make removal fail (Windows: keep a file handle open
   inside the folder; POSIX: `parent:` an owned folder chmod `0o555` after creation) ⇒ `close()` resolves, stderr
   carries exactly one `owned: could not remove` line, the leftover is prefixed AND its `.owner` sibling still exists.
   Restore and remove afterwards.
8. `ownedWorktree(t, repo, "wt")` in a DISPOSABLE repository (`git init` + one commit inside an owned folder): the leaf
   matches `^testsToDelete-conventions-wt-`; `git worktree list --porcelain` shows it with `locked
   <formatOwner(thisOwner())>`; `readOwner(path, "worktree")` equals `thisOwner()`; after the teardown it is neither
   on disk nor listed.
9. **A junction survives teardown** (Windows: `mklink /J`; POSIX: `fs.symlinkSync(..., "dir")`; the target is a folder
   inside the test's own owned folder, never a checkout): a worktree holding a link to a sentinel folder with one
   file, with `beforeRemove(() => removeLink(link))` ⇒ after teardown the worktree is gone and the sentinel's file
   exists. A `beforeRemove` fn that throws ⇒ teardown resolves, the warning line is written, the worktree path is not
   `rmSync`'d, and the sentinel's file still exists.
10. **The owner is invisible to the resource's user** (D4): `git status --porcelain --untracked-files=all` is empty in a
    repository initialised AT an `ownedDir`, and in an `ownedWorktree`.
11. `parseOwner(formatOwner(thisOwner()) + "\r\n")` round-trips; on Linux `thisOwner()` has three fields, on Windows
    and macOS two; `parseOwner("devbox@windows:37560")` ⇒ `{ host: "devbox@windows", pid: 37560 }` with no `start`;
    `""`, `"added with --lock"`, `"hands off"`, `"devbox:1:2"`, `"devbox@beos:1:2"`, `"devbox@linux:x:2"` and
    `"devbox@linux:1:2:3"` are `{ unreadable: true }`; a worktree locked with
    `git worktree lock` and no reason reads `{ unreadable: true }` through `readOwner(path, "worktree")`; an unlocked
    one reads `null`.
12. **Any clone, any path form**: a worktree of a SECOND disposable repository, created with `--relative-paths --lock
    --reason <owner>` (the one raw `worktree add` in this file, under an inline
    `testsToDelete-exempt: raw-worktree — a relative-path worktree the helper never makes, to prove readOwner resolves it`),
    ⇒ `gitdirOf` returns an absolute path that exists, and `readOwner(path, "worktree")` returns the owner. Then a
    copy of a worktree's `.git` file pointing at a gitdir that does not exist, and one holding `gitdir:` with no path,
    each read `{ unreadable: true }` (fail closed); a folder whose `.git` is a DIRECTORY (a repository rooted there)
    reads `null`.
13. `ownerState` with an injected probe: `null` ⇒ `unknown`; unreadable ⇒ `unknown`; host `other@<tag>` ⇒ `unknown`;
    this host with the other OS tag ⇒ `unknown`; the host in other case ⇒ evaluated (not foreign); `alive:false` ⇒
    `gone`; `alive: undefined` (a refused or failed query), a probe that returns `{}` or nothing ⇒ `unknown`; alive with
    the probe's `start` absent ⇒ `live`; alive with the owner's `start` absent (two-field marker) ⇒ `live`; both
    present, Δ = 2 s ⇒ `live`; Δ = 3 s, either way, and Δ ≫ 3 s ⇒ `unknown` (13b) — never `gone`.
14. With the REAL probe: `ownerState(thisOwner())` ⇒ `live` (on Linux through the start comparison, elsewhere
    through "alive, no start"); **a pid no process can have** (`lib/unmatchable-pid.mjs`: Windows ≡ 2 mod 4, Linux
    `pid_max + 1`, macOS 100000, the premise asserted before and after) ⇒ `gone` — never the pid of a child that has
    exited, which the OS hands to the next process (Windows did, mid-suite). 14a: with `process.kill` replaced to throw
    `EPERM`/`EACCES`/`EIO` the real probe answers `{ alive: undefined }` and `ownerState` answers `unknown`; only
    `ESRCH` answers `{ alive: false }`. **No spawn**: with
    `child_process.spawn`/`execFile*` replaced by a counter for the duration of the test, `thisOwner()` and
    `processProbe(process.pid)` complete with the counter at 0.

- **Commands.** `npm ci --ignore-scripts`; `node tools/run-tests.mjs tools/owned.test.mjs`; `npm test`.
- **DoD.** Green on Windows locally and on the Linux CI runner, each scenario observed RED first; J6 is moot (no
  writer spawns any more) — the suite's Windows wall time before and after S4 adopts the helper was measured: the whole suite, run from temporary worktrees on a 24-thread Windows machine at `--test-concurrency=8`, took 260.0 s at `3f6acf1^` (the helper present, the tests still on raw `mkdtemp`) and 265.8 s at `3f6acf1` (every site on the helper), and 221.8 s on a second run of the latter — a difference well inside the run-to-run spread, so adopting the helper has no measurable cost (7 and 6 tests failed in those two trees, a worktree in the temp root being a place some tests do not expect — the guard's repository scan, two real-CLI tests, a real-Git test and sweep case 10, which the new repository seam fixes; the same kind of failures on both sides). `owned.test.mjs` alone: 12.6 s at its first commit (25 tests), 9.0 s now (28). The full `npm test` at the tip of this branch: 540 tests, 536 pass, 4 skipped, 0 fail, 798 s — 15 more tests than the trees above, 7 of them the janitor's, whose file alone takes about 8.5 minutes on Windows; the module has no caller yet (S3/S4 adopt it).

## S3 — The start-of-run sweep in `run-tests.mjs`

- **Models.** Brief by Opus; code by a Sonnet coder; review by Opus against rule §4 and D5.
- **Goal.** A killed run's leftovers are collected by this repository's NEXT run — only its own token's, only its own
  clone's worktrees, only when their owner is `gone` or they are unmarked and old (rule §4). The janitor is no longer
  this story's: it ships and is tested in S3b.
- **Files.** New `tools/lib/leftovers-sweep.mjs`; `tools/run-tests.mjs`; new `tools/leftovers-sweep.test.mjs`.

**The change.**

- `tools/lib/leftovers-sweep.mjs` exports `sweepLeftovers({ repo, tmp = tempRoot(), now = Date.now(), minAgeMs =
  10 * 60_000, probe = processProbe }) → { removed: string[], preserved: Array<{ path, reason }>, errors: string[] }`.
  It never throws; every failure is an `errors` entry. Liveness answers are cached per pid for the call. **The
  decision table** (rule §4), for any candidate: younger than `minAgeMs` ⇒ preserve (`young`); owner `null`
  (unmarked) ⇒ remove; `{ unreadable }` ⇒ preserve (`unreadable`); otherwise `ownerState` — `gone` ⇒ remove, `live` ⇒
  preserve (`live`), `unknown` ⇒ preserve (`foreign host` when the host differs, else `unknown`).
  1. **Worktrees first — only those its own `repo` lists** (J1). `git -C repo worktree list --porcelain`; blocks whose
     leaf matches `OWNED_PATTERN`. Age = the directory's `mtimeMs` (missing directory ⇒ old: prune handles it). Owner =
     `readOwner(path, "worktree")`. **Remove** = `removeLink` every TOP-LEVEL entry that `lstat` reports as a symbolic
     link (junctions included) → `git -C repo worktree unlock` → `git -C repo worktree remove --force --force` →
     `removeQuietly(path)` if the directory survived. One `git -C repo worktree prune` after the pass.
  2. **Folders.** Depth-1 directories of `tmp` matching `OWNED_PATTERN`, minus every path step 1 listed. A directory
     whose `.git` is a FILE and that step 1 did not list is **another clone's worktree** — whether its gitdir reads,
     points at a deleted clone, or does not parse: preserved with reason `other clone`, never judged as an unmarked
     folder, never removed by this sweep. A directory whose `.git` is a DIRECTORY (a repository rooted there) is a
     plain folder. Otherwise owner = `readOwner(dir, "folder")`, the same decision table; **remove** = `removeLink`
     every top-level symbolic link, then `removeQuietly(dir)` (folder, then sibling).
  3. **Orphaned siblings.** `*.owner` files of `tmp` matching `OWNED_PATTERN` whose folder no longer exists and that
     are older than `minAgeMs` ⇒ removed.
  It never touches a name `OWNED_PATTERN` does not match — not another repository's token, not the bare prefix.
- `tools/run-tests.mjs`: export `runWithSweep(extra, { spawn = spawnSync, sweep = sweepLeftovers, repo =
  REPO_ROOT } = {})`: `sweep({ repo })` inside `try/catch`; when `removed + preserved + errors > 0`, ONE stderr line
  `run-tests: leftovers — removed N, preserved M` plus one line per error; then `return runTests(extra, spawn)` — the
  sweep never changes the exit code (rule §4). `REPO_ROOT` = `path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "..")`. The `invokedDirectly` block calls `runWithSweep` after `lowerOwnPriority()`. `CAP`, `testConcurrency`,
  `testArgs`, `runTests` keep their signatures.

**Scenarios** (RED first: `leftovers-sweep.test.mjs` before the module, each observed failing). Every scenario passes
`tmp` = a private owned folder and `repo` = a disposable repository — never this checkout or the real temp root.

1. **A killed run is collected**: a child (`process.execPath <child.mjs>`, written into an owned folder) creates, under
   a `cleanupScope()` it never closes, `ownedDir(s, "killed", { parent: privateTmp })` and `ownedWorktree(s,
   disposableRepo, "killed-wt", { parent: privateTmp })` — the worktree holding a junction/symlink `node_modules` to a sentinel folder inside
   the test's own owned folder — prints both paths and waits; kill it by its pid (`child.kill("SIGKILL")`, never by
   image name). Both leftovers exist, prefixed, the folder with its `.owner`, the worktree locked by the dead pid. Age
   them past 10 minutes (`fs.utimesSync`; for the worktree also a `minAgeMs: 0` call); `sweepLeftovers` removes the
   folder, its sibling and the worktree (no longer listed), and **the sentinel's file still exists**.
2. **Concurrent-owner survival** (rule §4): an old prefixed folder claimed by THIS process survives (`live`); one
   claimed by `other@<tag>:1` survives (`foreign host`); one with an unreadable `.owner` survives (`unreadable`); a
   young one claimed by a dead pid survives (`young`); an old unmarked one is removed; a worktree locked by this process
   survives; **a worktree of a SECOND disposable repository in `privateTmp`, old and locked by a dead pid, survives
   with reason `other clone`** and is still listed by its own repository; so does an old prefixed folder whose `.git`
   file points at a gitdir that does not exist; an old prefixed folder holding a `.git` DIRECTORY and no owner is
   removed as a plain unmarked folder; each preserved entry carries its reason.
3. **Anchored and scoped**: old, dead-owned `x-testsToDelete-conventions-a`, `testsToDelete-other-a-123456` and
   `testsToDeleteconventions-a` all survive untouched; `TESTSTODELETE-CONVENTIONS-a-xyz123` with a dead owner is
   removed (case-insensitive).
4. **The run is never failed by the sweep**: `runWithSweep` with a `sweep` that throws and a fake `spawn` returning
   status 0 returns 0 and writes the error line; with `spawn` returning 3 it returns 3.
5. **Silence when there is nothing**: an empty result writes nothing to stderr.

- **Commands.** `node tools/run-tests.mjs tools/leftovers-sweep.test.mjs`; `npm test` twice in a row (the second run
  prints no `leftovers` line on a clean machine).
- **DoD.** Green on Windows and on the Linux CI runner; scenario 1 observed RED before the sweep existed; `npm test` on
  this checkout removes nothing it did not create.

## S3b — `tools/janitor.sh` shipped and tested

- **Models.** Brief by Opus (this section, from S1's binding change and D9); code by a Sonnet coder — the script is a
  verbatim copy, the work is the test; review by Opus against D9 and the rule's § The janitor.
- **Goal.** The host-wide janitor is a shipped, tested file in this repository, run from the mount by every consumer
  and copied verbatim (hash-pinned) by the twin — its nineteen measured verdicts held by a test, not by a record.
- **Files.** New `tools/janitor.sh` — the scratchpad draft `janitor.sh`, as hardened since: **25 644 B, 308 lines,
  sha256 `bf9f0c64846f1d8d52405a9c4e713f893078f7d27a7d3a2044f73ad9c79ed8e1`** (after the code gate, the Opus review and the code-gate round 3 — the file grew from the 150-line draft to 308 lines: three-valued `tasklist`/`ps`/`/proc` liveness, a canonical spelling per folder, `--token`, control-character hygiene, docker labels read through `%q`;
  earlier shas `036785f5…` (before the security batch, 19 894 B, 231 lines), `0644a175…` (the round-2 file, 12 166 B, 150 lines), `5110061c…`, `4c0e4f5b…`, `3f4ca10b…`; header comment included; LF line
  endings; the executable bit set with `git update-index --chmod=+x tools/janitor.sh`, since Windows checkouts do not
  carry it). Verify the hash after the copy; the file is never edited in the repository — a change starts in the spec
  and comes with a new hash. New `tools/janitor.test.mjs`; `README.md` tool table — one row: `tools/janitor.sh` ·
  `common/test-leftovers.md` § The janitor · `bash .agents/conventions/tools/janitor.sh [--dry-run]`.

**The test** (`tools/janitor.test.mjs`) is D9's harness as `node:test`:

- **Bash.** On win32: `git --exec-path` (e.g. `…/mingw64/libexec/git-core`) → up three → `bin/bash.exe`; refuse any
  path under `%SystemRoot%` (WSL's bash sees neither the Windows temp root nor Windows pids); if absent,
  `t.skip("Git for Windows bash not found")`. Elsewhere `/bin/bash`. The script is run as `bash <repo>/tools/janitor.sh
  [--dry-run]` with cwd = a disposable clone.
- **Isolation.** Two disposable clones (`git init` + one commit) and a private `TMPDIR`, all in owned folders; `TMPDIR`
  passed with FORWARD slashes (`C:/…` on Windows). `JANITOR_MIN_AGE_MINUTES` set per scenario; ages made with
  `fs.utimesSync` and, for Docker, with the stub's `CreatedAt`. Every junction/symlink target is a folder inside the
  test's own owned folder, never a checkout. Never this checkout, the real temp root, or a real Docker daemon.
- **The stub `docker`** (a `#!/bin/sh` script in a stub directory placed FIRST on `PATH`) logs every argv to a file and
  answers from a per-scenario fixture file: `ps -a --format '{{.ID}}\t{{.Names}}\t{{.Label "testsToDelete.owner"}}\t{{.CreatedAt}}'`,
  `volume ls --format '{{.Name}}\t{{.Label "testsToDelete.owner"}}'`, `volume inspect --format '{{.Name}}\t{{.CreatedAt}}' <name>…` (ONE call for all captured volumes; the stub also answers the single-name form),
  `network ls --format '{{.ID}}\t{{.Name}}\t{{.Label "testsToDelete.owner"}}\t{{.CreatedAt}}'`; `rm`, `volume rm`,
  `network rm` only log (exit 0), and `inspect --type container <id>`, `volume inspect <name>`, `network inspect <id>`
  answer "present" or "absent" (exit 0 / 1) from the fixture — the script's re-check after a failed removal. Modes:
  `fail-ps` (exit 1 on `ps`); `toctou` (empty on the FIRST `ps -a`, a live-owned prefixed container on every later
  call — the counter kept in a file); `fail-rm:<id>[:present|:absent]` (that `rm` exits 1 and the following
  `inspect` of it answers as named — scenario 12). For the no-docker scenario, a PATH that
  provably holds no `docker`: Linux/macOS — a private `bin` of symlinks to exactly the tools the script calls
  (`bash sed awk grep find head tr cut xargs git hostname uname date stat rm env`, resolved with `command -v` — the first Linux run failed on a list without `cut` and `xargs`); Windows — Git for Windows' `usr/bin`, `mingw64/bin`, `cmd` and `%SystemRoot%\System32` only; assert
  `command -v docker` fails under it first (on Windows, skip with the reason if it does not).
- **Owners.** A live owner is the test's own `process.pid` (a Windows pid on win32, so `tasklist` sees it); a dead
  owner is **a pid the janitor's own query can never match**, with the premise asserted before and after every run
  (`tools/lib/unmatchable-pid.mjs`: Windows a pid ≡ 2 mod 4, Linux `pid_max + 1`, macOS 100000) — never the pid of a
  child that was started and killed, because the OS hands that number to the next process. Owners are written in the
  three-field form on Linux and the two-field form elsewhere, plus explicit two-field cases (scenario 9). `TMPDIR` is
  handed over in the spelling the script's own bash uses (`/c/Users/…` on Windows). Known limit of the pinned script: its
  `canon` folds `C:/…` to `/c/…` but not MSYS's `/tmp/…` (the user temp root), so with `TMPDIR` unset or spelled `C:/…` on
  Windows this clone's own prefixed worktree in the temp root is captured twice (a duplicate `vanished` notice or a
  duplicate `skipped` line) and the clone the script runs from is not recognised as such; the next change to the script
  fixes it and comes with a new hash.
- **Fixtures through the helper.** Folders: `ownedDir(t, what, { parent: privateTmp })`, then the scenario's `.owner`
  content written over the sibling. Worktrees: `ownedWorktree(t, clone, what, { parent: privateTmp })`, then
  `git worktree unlock` + `git worktree lock --reason <the scenario's owner>` (or a bare `lock` for the reason-less
  case). The two shapes the helper never makes — a `--relative-paths` worktree (scenario 5) and a `-b <branch>`
  worktree (scenario 11) — are raw `git worktree add` calls, each under an inline
  `testsToDelete-exempt: raw-worktree — <reason>` that S4's guard accepts.

**Scenarios** (RED first: write the test against `tools/janitor.sh`, run it BEFORE the file exists — every case fails
on spawn — then copy the file and watch them pass). Each asserts the exit code, the stderr lines (`skipped: …`,
notices), what remains on disk / in `git worktree list` / in `git branch`, and the stub's recorded `rm` /
`volume rm` / `network rm` argv (by ID for containers and networks):

1. **TOCTOU**: stub in `toctou` mode ⇒ `ps -a` recorded exactly once, zero `rm`, exit 0.
2. **Docker age + owner**: old unlabelled container ⇒ `rm -f -v c1` (its ID); young unlabelled ⇒ kept, silent; old
   live-labelled ⇒ `skipped:` line; old dead-labelled ⇒ `rm -f -v c4`; `prod-testsToDelete-b` never named; old volume
   ⇒ `volume rm testsToDelete-v-old`; young volume kept; old dead-owned network ⇒ `network rm n1`; exit 3.
3. **Per resource**: a live-owner folder beside a dead old one ⇒ the dead one and its sibling removed, the live one
   kept and named, an orphan old `.owner` removed, exit 3.
4. **Fail closed, not wedged**: a deleted-clone worktree (its `.git` file's gitdir gone) beside two dead old folders ⇒
   both folders removed, the worktree kept and named, exit 3.
5. **Another clone, relative paths (J9)**: a `--relative-paths` worktree of the second clone, live-owned ⇒ skipped
   and kept; dead-owned and old ⇒ removed and no longer listed by that clone.
6. **Locks and junctions (J1, J2, J5)**: this clone's reason-less lock ⇒ skipped and still registered; a prefixed
   branch deleted; dead-owned junction-holding worktrees of BOTH clones ⇒ gone, the junction targets' files intact;
   an unlocked old worktree of the other clone ⇒ gone; a young dead-owned one ⇒ kept.
7. **Foreign host** ⇒ skipped, exit 3; a tree holding only a young worktree ⇒ exit 0.
8. **`--dry-run`** ⇒ `would run:` lines, the folder and its sibling still present, exit 0.
9. **Two-field owner** `<host>@<os>:<pid>`: live ⇒ skipped; dead ⇒ removed.
10. **Docker absent / failing (J7)**: no docker binary ⇒ one `janitor: no docker binary` notice, exit 0, and an old
    dead-owned folder still removed; stub `fail-ps` ⇒ `janitor: a listing failed — nothing was removed`, exit 1, and
    nothing removed.
11. **A branch checked out in a kept worktree (J10)**: this clone's prefixed worktree created with `-b
    testsToDelete-<repo>-br-<id>`, locked by the test's live pid, beside a dead-owned old folder ⇒ the worktree and
    the branch kept, each named (`skipped: branch … — checked out in a worktree that was kept`), the folder and its
    `.owner` removed, exit 3. (The earlier draft exited 1 here with `cannot delete branch … used by worktree` and left
    the folder; the shipped one was re-probed by the Judge, 2026-10-15: exit 3, folder gone, worktree and branch kept.)
12. **A vanished target is a notice, not an abort**: the stub's `rm` for one captured container fails and its
    `inspect` then reports it absent ⇒ `notice: container … — vanished after the capture`; a second captured
    container whose `rm` fails while `inspect` still finds it ⇒ `skipped: container … — could not be removed`; the
    later passes still run (a dead-owned old folder after them is removed); exit 3.
13. **Malformed owners are unreadable, never deleted** (code gate 1): old folders owned by `<host>@windows:abc`,
    `:12:x`, `:`, `:1:2:3` and `<host>@beos:1` ⇒ all five kept with their claims, five `is unreadable` lines, exit 3.
14. **One row per worktree** (code gate 2): this clone's own dead-owned worktree directly in the temp root ⇒ removed once,
    silently (stderr empty, exit 0); a live-owned one ⇒ named exactly once (exit 3).
15. **One volume inspect for N volumes** (code gates 3, 4): three old volumes ⇒ exactly ONE `volume inspect`, three `volume rm`.
16. **One tasklist per run** (code gate 5): three Windows-owned old folders (`JANITOR_OS=windows`, a `tasklist` stub that
    answers a snapshot without their pids) ⇒ ONE `tasklist` call, all three removed.
17. **Windows liveness is three-valued** (Opus A): a `tasklist` that fails (exit 127) ⇒ the folder kept, one `liveness
    unknown` line, exit 3; one that prints nothing ⇒ the same; a real snapshot without the pid ⇒ removed.
18. **The non-Windows branch** (Opus A), through `JANITOR_OS=macos` and a `ps` stub handed over as an exported bash
    FUNCTION (a stub file named `ps` never wins on Windows, where the shell puts its own `/usr/bin` first): exit 2 ⇒
    kept, `liveness unknown`; exit 1 ⇒ removed; exit 0 ⇒ skipped as live.
19. **The clone the janitor runs from is never a candidate** (Opus B): run INSIDE an old, unclaimed, prefixed clone that
    lives in the temp root ⇒ the clone survives, exit 0, nothing on stderr.

- **Commands.** `node tools/run-tests.mjs tools/janitor.test.mjs`; `bash -n tools/janitor.sh`; `npm test`.
- **DoD.** Every scenario observed RED (no file) and then GREEN, on Windows (Git Bash) and on the Linux CI runner,
  skipped nowhere in CI; `tools/janitor.sh` hashes to `bf9f0c64846f1d8d52405a9c4e713f893078f7d27a7d3a2044f73ad9c79ed8e1`
  (recorded in the PR, for the twin's pin); README row present.

## S4 — The structural guard, and every site migrated to the helper

- **Models.** Brief by Opus; code by a Sonnet coder; review by Opus against rule §5, §7 and D7, D8. One story because
  the guard's test over this repository is RED until the migration lands — two merges would leave `main` red between
  them.
- **Goal.** No test here creates a temp folder or a worktree except through `tools/lib/owned.mjs` (or under a valid
  inline exemption), and a check keeps it so — red on every class of rule §7, red on a scan of nothing.
- **Files.** New `tools/leftovers-check.mjs`; new `tools/leftovers-check.test.mjs`; the 19 test files below.

**The guard.** `node tools/leftovers-check.mjs [--repo <dir>]`, in the `plan-lifecycle.mjs` shape (pure exported
functions + an entry guarded by `invokedDirectly`; findings one per line, `file:line — <class> — <text>`, then one cure
sentence per class naming rule §7). Exit `0` clean, `1` findings, `2` scanned nothing or bad arguments.

- **Discovery**: `git -C <repo> ls-files -z --cached --others --exclude-standard`, filtered to `tools/**/*.test.mjs`,
  `tools/fixtures/**/*.{mjs,js,cjs}`, `.github/workflows/*.{yml,yaml}`, `.github/scripts/**/*.{mjs,js,sh}`, `**/*.sh`,
  `**/*.ps1`. One file excluded by name, a frozen list a test pins exactly: `tools/leftovers-check.test.mjs` (it
  carries the violations as fixture strings). `tools/lib/**` is product code and not scanned (`rule-migration.mjs:174`'s
  `worktree add -b` is the migration tool's deliverable). Zero files ⇒ exit 2 with `leftovers-check: scanned nothing
  under <repo> — discovery broke; the repository is not clean`.
- **Classes** (rule §7 / D8; this is their Node, YAML and shell mapping). Whole-line `//` or `#` comments are skipped
  for matching but read for exemptions.
  - `raw-temp`: `\bmkdtemp(Sync)?\s*\(`, `\btmpdir\s*\(`, `process\.env\.(TEMP|TMP|TMPDIR)\b`, `\btemp_dir\s*\(`,
    `GetTempPath`; in `.sh` also `\bmktemp\b`; in `.ps1` also `New-TemporaryFile|\$env:TE?MP\b`.
  - `raw-worktree`: `["']worktree["']\s*,\s*["']add["']` and `\bworktree\s+add\b`.
  - `docker-run`: a `docker run` without `--rm` and without the complete carve-out of rule §5 / D7. Workflows are
    parsed with the `yaml` dependency already in `package.json`: the step's `--name <n>` must exist and match
    `^teststodelete[-_]` (case-insensitive); every named volume (`-v <vol>:` where `<vol>` has no `/` and does not
    start with `.`, `$` or `~`) must match it too; a LATER step of the same job whose `if:` contains `always()` must run
    `docker rm -f -v <n>` and `docker volume rm <vol>` for each volume, must come after every step mentioning `<n>` in
    `docker (logs|cp|inspect|wait|exec|diff)`, and must carry `continue-on-error: true`. In `.sh`: a
    `trap '…' EXIT` on an EARLIER line whose body holds `docker rm -f -v <n> || true` and `docker volume rm <vol> ||
    true` per volume. Anything less is reported as `permits dropping --rm`.
  - `docker-name`: `--name <x>`, `docker (volume|network) create <x>`, `WithName("<x>")`, and — **only for an image a
    test builds** (J3, D8) — `docker build … -t|--tag <x>` where `<x>` does not match `^teststodelete[-_]`
    (case-insensitive). A `docker build -t <x>` whose tag `<x>` is pushed (`docker push <x>`) by the same workflow job
    or the same `.sh` file is the product's publish and out of scope: not a finding, no exemption needed.
  - `shared-store`: case-sensitive SQL/Redis shapes `\bDROP\s+(DATABASE|SCHEMA|TABLE)\b`, `\bTRUNCATE\s+(TABLE\s+)?`,
    `\bFLUSH(ALL|DB)\b`, or `deleteMany\(\s*\{\s*\}\s*\)` against a name not matching `^teststodelete[-_]`, without an
    exemption of class `shared-store` (prose like "truncated" never matches: the keywords are upper-case only).
  - `ryuk-off`: `TESTCONTAINERS_RYUK_DISABLED\s*[:=]\s*["']?true` — never exemptible.
- **Exemptions — inline only** (rule §7 / D8): a comment on the finding's line or the line directly above,
  `testsToDelete-exempt: <class> — <reason>` (em dash). Valid when `<class>` is one of the table's except `ryuk-off`
  and `<reason>` passes `isReason` — import it from `./ownership-check.mjs` (exported, and importing that module runs
  nothing — `:406`), never a second copy; for `shared-store` the reason must contain `lock:`. Any other
  `testsToDelete-exempt:` text is a finding of class `exemption` (class missing, unknown, `ryuk-off`, or reason-less).
  The real exemptions in this repository are all `raw-worktree` and all in tests of the leftovers tooling itself:
  `tools/owned.test.mjs` scenario 12 and `tools/janitor.test.mjs` scenarios 5 and 11. `tools/janitor.sh` is scanned
  like any `.sh` (it creates nothing; it must pass with no exemption).
- **The token is registered** (rule §1, C7): `--token <t>` (default: `REPO_TOKEN` imported from `./lib/owned.mjs`) and
  `--rule <path>` (default: `<repo>/common/test-leftovers.md`, else this tool's own `../common/test-leftovers.md`).
  Exported pure `tokenFindings(ruleText, token)`: the token must match `^[a-z0-9]{2,12}$`, and the rule must carry a
  `## Tokens` heading followed by a GFM table with the header `| token | family | repository |` (three columns, as
  S1 ships it: this repository's seven rows only — it is public, J11) whose FIRST column, backticks stripped,
  contains the token exactly. No `## Tokens` section, no
  table under it, a header that is not those three columns, a duplicated token, a row whose `family` is not
  `dew_flow` (this copy is public and lists only its own family — J11), or the token absent ⇒ a finding of
  class `token` naming the token and the rule path (fail closed: a rule with no table registers nothing). Exit 1 like
  any finding.

**The migration** (each site keeps its meaning; `what` is the old prefix without its trailing `-`; every replaced site
drops its `t.after(() => fs.rmSync(...))` or its `finally { fs.rmSync(...) }`; a test that had no `t` takes it):

| File | Sites | Becomes |
|---|---|---|
| `adapter-check.test.mjs` | `:21` (`repository(t, prefix)`), `:177`, `:233` | `ownedDir(t, prefix)` with the default `prefix` becoming `"adapter"`; `ownedDir(t, "adapter-ref")`; `ownedDir(t, "adapter-loose")` |
| `branch-protection-resolver.test.mjs` | `:22` | `ownedDir(t, "resolver")`; the `finally` keeps only the `PATH` restore |
| `build-flags-check.test.mjs`, `effort-converge.test.mjs`, `ensure-user-guard.test.mjs`, `install-user-hook.test.mjs`, `lower-priority-preload.test.mjs`, `pin-check.test.mjs`, `promote-release.test.mjs`, `release-distance.test.mjs`, `rule-bodies.test.mjs`, `subagent-model-hook.test.mjs` | one each | `ownedDir(t, <old prefix without "-">)` |
| `plan-lifecycle.test.mjs` | `:19` | `ownedDir(t, "plan-lifecycle ")` — the trailing space stays (D1) |
| `rules.test.mjs` | `:13` | `ownedDir(t, "rules Unicode пробел")` |
| `low-priority.test.mjs` | `:98` (after the Windows skip), `:182` | `ownedDir(t, "low-priority-shim")`, `ownedDir(t, "low-priority-plan")` |
| `migrate-rules.test.mjs` | `:32`, `:67` | `ownedDir(t, "neutral-gate")`, `ownedDir(t, "migration пробел")`; the branches `migrate-test` (`:91`, `:111`) and `journal-failure` (`:195`) STAY, with one comment above `:91`: nested in an owned folder, covered by it (`common/test-leftovers.md` §1) |
| `ownership-check.test.mjs` | `:47`, `:122`, `:140`, `:357` | `ownedDir(t, …)` |
| `selftest.test.mjs` | `:291`, `:371` | `ownedDir(t, "pdc")`; `ownedDir(t, "gate")` in the TEMP ROOT — if that test goes red, stop and report (never move it back into the repository silently) |
| `smoke-rules.test.mjs` | `:58`, `:74`, `:333`, `:581` | `ownedDir(t, "smoke-resolver")`, `"smoke-snapshot"`, `"smoke-behaviour"`, `"chg"` (`:581`'s test takes `t`; its last-statement `fs.rmSync` goes) |
| `smoke-rules.test.mjs` | worktrees `:454-462`, `:473-481`, `:519-527`, `:555-561` | one local `disposableWorktree(t, what)` → `{ home, worktree }`: `home = ownedDir(t, what)`; `wt = ownedWorktree(t, top, "wt")`; junction `node_modules` into `wt.path`; `wt.beforeRemove(() => removeLink(modules))` (the helper's `removeLink`; the file's own copy at `:17-18` goes); `worktree = wt.path`; files the tests wrote to `home` stay in `home` |

**Scenarios** (RED first: scenario 1 is written and run BEFORE any migration).

1. **This repository passes**: `leftovers-check` on the repository root exits 0. Before the migration it exits 1 naming
   all 34 `mkdtemp` sites, `selftest.test.mjs:291`'s `process.env.TEMP`, and the four `worktree","add` sites — the
   RED observation, counts recorded in the PR.
2. **Break-it per class**, each on a tree written at runtime into an owned folder (`git init`, files written): a raw
   `mkdtempSync` in `tools/x.test.mjs` ⇒ 1 naming the line; `os.tmpdir()` ⇒ 1; `process.env.TMPDIR` ⇒ 1;
   `git(r,"worktree","add",p)` ⇒ 1; in a workflow, `docker run -d --name testsToDelete-x-abc123 img` with no remover
   ⇒ 1 (`permits dropping --rm`); the same plus a later `if: always()` step with `continue-on-error: true` running
   `docker rm -f -v testsToDelete-x-abc123` AFTER the `docker logs` step ⇒ 0; that remover BEFORE the logs step ⇒ 1;
   without `if: always()` ⇒ 1; without `continue-on-error: true` ⇒ 1; a named volume `testsToDelete-x-data-abc123`
   not removed ⇒ 1; an `exec` reader after the remover ⇒ 1; a `.sh` with the trap on an earlier line ⇒ 0, with the
   trap after `docker run` ⇒ 1; `docker volume create cache` ⇒ 1 (`docker-name`); `docker build -t app .` alone ⇒ 1;
   `docker build -t app .` with `docker push app` in the same job ⇒ 0 (the publish, J3); `docker build -t
   teststodelete-x-img-abc123 .` ⇒ 0; `TRUNCATE TABLE users` ⇒ 1 (`shared-store`), with `-- testsToDelete-exempt:
   shared-store — pg:5432 users; reuse intentional; lock: pg_advisory_lock(42)` above ⇒ 0, with the same reason minus
   `lock:` ⇒ 1 (`exemption`); the word `truncated` in a comment ⇒ 0; `TESTCONTAINERS_RYUK_DISABLED: "true"` ⇒ 1 even
   with an exemption above it; a well-formed `raw-temp` exemption ⇒ 0; `testsToDelete-exempt: raw-temp — needed` ⇒ 1
   (`exemption`); `testsToDelete-exempt: nonsense — a perfectly fine reason here` ⇒ 1.
3. **Scan of nothing**: an empty repository ⇒ 2 with the "discovery broke" sentence; a `--repo` that does not exist ⇒ 2.
3a. **Token registry** (C7): on this repository, `--token conventions` ⇒ no `token` finding (the table's first row);
   the table parses to exactly 7 tokens — `conventions`, `creds`, `mcp`, `sidecar`, `coai`, `bench`, `qln` — all
   distinct, each `^[a-z0-9]{2,12}$`, every `family` cell `dew_flow` (a row of any other family in this public copy is
   a finding of class `token`); `--token qln` ⇒ no finding; break-it
   `--token nosuchtoken` ⇒ exit 1, class `token`; `--token Conventions` (capital) and `--token x` (one character) ⇒ 1;
   `tokenFindings` on a rule text with no `## Tokens` section ⇒ one finding; on a table where the token appears only in
   the `repository` column ⇒ one finding; on a two-column table ⇒ one finding; on a table listing one token twice ⇒
   one finding.
4. **The exclusion list is exactly one file** — pinned.
5. **Spaces and Unicode survive the migration**: `rules.test.mjs`, `migrate-rules.test.mjs` and `plan-lifecycle.test.mjs`
   still create paths containing a space, and the first two Cyrillic — one assertion in each.
6. **No leftover after a full run**: after `npm test`, `tempRoot()` holds no new `OWNED_PATTERN` entry and this
   checkout's `git worktree list` no prefixed entry (checked by hand and recorded in the PR; the `chg-` leak is closed
   by construction — its creation now registers its cleanup).

- **Commands.** `node tools/leftovers-check.mjs` (RED, then GREEN); `node tools/run-tests.mjs tools/leftovers-check.test.mjs`;
  `npm test`; `npm run check`; on Windows, the four worktree tests pass with the longer temp leaves.
- **DoD.** Scenario 1 observed red with the full list, then green; every break-it observed red; `npm test` green on
  Windows and on the Linux CI runner; scenario 6 recorded.

## S5 — Docs and the one release

- **Models.** Brief by Opus; the edits are small (main session or Sonnet); Opus reviews before the release dispatch.
- **Goal.** The shipped state documented, released once, and handed to the twin and the consumers.
- **Change.**
  - `README.md` tool table (`:245-255`): one row for `tools/leftovers-check.mjs` — rule `common/test-leftovers.md` §7,
    run `node tools/leftovers-check.mjs` (this repository only; whether a consumer's Node tree reuses it through the
    mount is E2's and E5's decision). **Check** the `tools/janitor.sh` row S3b wrote (`bash
    .agents/conventions/tools/janitor.sh [--dry-run]`) is present and names § The janitor.
  - `research/module_tests.md`: one paragraph — the helper, the start-of-run sweep in `run-tests.mjs`, the guard, and
    `tools/janitor.sh` with its harness test (named by the rule heading `## The janitor`), with the RED counts of S4
    scenario 1, S3 scenario 1 and S3b's twelve, and the Windows wall-time check of S2's DoD.
  - `research/module_rules.md` / `research/architecture.md`: only if they list tools or this rule's sections — check,
    then edit or say why not.
  - Status lines: this document `> Status: **E1 shipped, <YYYY-MM-DD> (release <sha>); promotes with its parent.**` —
    never the word *implemented* while it is in `todo/` (`tools/plan-lifecycle.mjs:50` would call it misfiled); the
    parent's E1 entry gets the same sentence. Parent and stories documents promote together, after E7.
  - Release: after the merge and the `ci` run for that main sha green,
    `gh workflow run promote-release.yml --ref main -f "sha=<40-hex>" -f reason="test-leftovers: owner liveness, start-of-run collection, three spellings, container carve-out, guard grammar, shipped janitor; this repository's tools adopt it"`.
  - **Handed to the twin rule repository** (that repository's plan does its edits): BOTH core spans
    (`<!-- core:begin/end -->`) byte for byte; OUR seven `## Tokens` rows, whose wording is frozen — the twin's test
    checks that each of them appears verbatim (line compare) in its own full table and that every token across both
    families is unique (the subset check); `tools/janitor.sh` verbatim with sha256
    `4c0e4f5b187dc7787502095b09b360e1792d5561b21cdaad2ba10654ccfd2037`, which the twin hash-pins; and the release
    sha. The twin places its own stack section and its own rows between the spans. Nothing of the twin's — no
    family name, repository name or token — is ever written into this public repository (J11).
  - **A later row of OURS** (a new repository of this family): a rule body edit here — `node tools/rule-bodies.mjs
    --update common.test-leftovers`, `node tools/ownership-check.mjs`, S4 scenario 3a green (its "7" becomes the new
    count in the same commit), a release of its own — and the same row, verbatim, sent to the twin the same week. The
    twin's own new rows never come here.
- **Commands.** `node tools/plan-lifecycle.mjs`; `npm test`; `npm run check`; `node tools/release-distance.mjs` after
  the promotion.
- **DoD.** `release` at the merged sha; `release-distance` reports distance 0; the twin has the spans, our seven rows
  (its subset check green) and the pinned script; nothing in any consumer changed here.

## Judge's notes — status

Opus, 2026-10-15, final pass over the fifth spec revision (42.1 KB), the proposed body (17 222 B, no code fence) and
`janitor.sh` (9 296 B, 113 lines, sha256 `4c0e4f5b…d2037`, `bash -n` clean, read line by line), against
`origin/main` 2be89ab and one re-probe of the shipped script.

| Note | Status |
|---|---|
| J1 — another clone's worktree taken for an unmarked folder | **Resolved** (rule §3/§4; the script judges any clone's tree by its lock; S2 `readOwner` through `.git`; S3 keeps `other clone`). |
| J2 — `remove --force --force` leaves the directory around a junction | **Resolved** (links unlinked first, `rm -rf` fallback; S2 sc. 9, S3 sc. 1, S3b sc. 6). |
| J3 — `docker-name` caught the publish job | **Resolved** (test-built images only; S4 break-its). |
| J4 — path figure | **Resolved** (173 of 260). |
| J5 — reason-less lock | **Resolved** (skipped and named; S3b sc. 6). |
| J6 — start-time cost | **Superseded**: start written only where no spawn is needed (Linux `/proc`); alive + no start ⇒ `live`. |
| J7 — janitor without Docker | **Resolved** (S3b sc. 10). |
| J8 — which bash | **Resolved** (rule and script header name Git for Windows' bash). |
| J9 — relative gitdir ⇒ `rm -rf` of a live worktree | **Resolved** (`gitdir_of` resolves it; an unreadable gitdir is skipped, never removed; S3b sc. 4, 5). |
| J10 — a kept worktree's branch aborted the janitor | **Resolved.** Every removal now settles through a re-check (vanished ⇒ notice; still there ⇒ skipped, exit 3); a branch checked out in a kept worktree is skipped by name; only a failed listing exits 1. Re-probed by the Judge on the shipped file (scratch folder only, Git for Windows bash): a live-locked worktree with a prefixed branch beside a dead-owned old folder ⇒ worktree and branch skipped and named, the folder and its `.owner` removed, exit 3. S3b sc. 11 and 12. |
| J11 — the token table would publish another family's names in a public repository | **Resolved.** The public `## Tokens` lists only this family's seven rows; the private twin carries both families and checks ours as a verbatim subset with unique tokens. This document was scrubbed for the other family's company name, repository names and tokens: zero occurrences. |

**Sign-off: yes** — on S1 (the rule text and the shipped janitor), on S2, S3, S3b, S4, S5, and on the document as a
whole. Nothing contradicts the spec's binding changes; the rule fails closed on every owner it cannot read; the
start-of-run sweep is narrower than the janitor in the safe direction; the janitor is per-resource, honest in its exit
code, and hash-pinned for the twin; and nothing of the other family is published here.
