---
id: "common.test-leftovers-janitor"
load: "conditional"
tasks: ["audit","policy","release"]
---
# The leftover janitor — `tools/janitor.sh`, the one host-wide sweep (MANDATORY where it runs)

<!-- core:begin -->
The companion of `common/test-leftovers.md`: that rule's §1–§4 (the name, the owner record, the two keys, the
three-valued liveness) and its *barrier* are the contract; this text is the janitor's — its invocation, its
output, its exit codes and what every copy of it must keep. There is ONE implementation, shipped and tested in the
rule repository; a wrapper may start it, nothing re-implements it.

## Running it

`bash tools/janitor.sh [--dry-run] [--token <t>]`, from the mount (`bash .agents/conventions/tools/janitor.sh` or
`bash .claude/rules/shared/tools/janitor.sh`), from inside the repository whose worktrees and branches are swept;
`--dry-run` to look first. On Windows from **Git for Windows' bash, never WSL's** (which sees neither the Windows
temp root nor Windows pids), and from the side that owns the resources — never a Git-for-Windows bash launched
through WSL interop, which inherits `WSL_DISTRO_NAME` and reads every Windows claim as foreign. Run it as the user
whose leftovers are meant: an administrator sweeps another user's scope by running as that user (`sudo -u`,
`runas`), never by naming it — **no option names an owner**.

- `--token <t>` narrows the sweep to `testsToDelete-<owner>-<t>-…` (all three spellings, any case, anchored:
  `alpha` never matches `alphabet`); it combines with `--dry-run` in either order; `<t>` is 2 to 12 characters of
  `[a-z0-9]` and not of the owner grammar — anything else, and any unknown argument, prints the usage line and
  exits 2 with nothing touched.
- `JANITOR_MIN_AGE_MINUTES` (default 60) is the window: whole minutes, digits only, at least 1 — anything else is
  refused in one line, exit 1, nothing removed. Age selects, never authorises.
- `TESTSTODELETE_OWNER`, when set, must match `^[uw][0-9]{1,10}$` or the run exits 2 before any listing; it never
  widens what the kernel owner allows.
- `JANITOR_OS`, `JANITOR_PROC` (the `/proc` root) and `JANITOR_HOSTNAME` are test seams: honoured, and each one that
  is set is announced once on stderr — a real run sets none.

## What it prints

Everything a person reads goes to stderr, through one cleaner that turns every byte outside printable ASCII into
`?`, so no escape sequence or line end inside a name reaches the terminal:

- `janitor: looking for testsToDelete resources…` when the capture starts; `janitor: removed <kind> <name>` per
  REAL removal, the name quoted (`%q`) so text inside it cannot pass for a second message;
- `skipped: <kind> <name> — <reason>` for a resource of the caller's own scope it would not remove (live owner, a
  foreign host, an owner it cannot read, a lock that names nobody, a worktree whose lock it cannot read, a clone that
  is not the caller's, a pid it cannot judge, an identity — its owner included — that changed after the capture, a
  failed removal) — these set the exit code;
- `foreign: <kind> <name> — owner <o>` for another owner's name, record or label, AND for an entry or claim another
  user owns whatever its name says (a forged owner segment), `legacy: <kind> <name> — remove with: <exact command>`,
  `unmarked: <kind> <name>` for what is not the caller's to remove — listed, never touched, never an exit code;
- `notice: …` for a target that vanished after the capture, a docker id that is not lower-case hex, a label that
  could not be read, a quarantine left by an earlier killed run;
- `--dry-run` prints `would run: <command>` lines on STDOUT (so a person can pipe them), removes nothing, and exits
  with the code the real run would.

## Exit codes

**0** nothing in the caller's scope was skipped; **3** something was (named on stderr); **1** a listing failed, a
refused `JANITOR_MIN_AGE_MINUTES`, or a lock that is not a regular file in the swept clone (git itself would block on
it) — nothing was removed; **2** usage, or a `TESTSTODELETE_OWNER` that is not of the owner grammar — nothing listed. A stopped Docker daemon is a failure (`pipefail`; a failed listing removes
nothing), not a clean machine; a machine with no `docker` binary says so once and still sweeps git and the temp root.

## What a copy must keep

1. **One capture.** Every prefixed resource of every user is listed ONCE — identity, name, owner record, age, name
   form (owner / legacy) — before anything is decided; only captured, authorised items are deleted, by their
   captured id or path. A resource that appears after the capture is not touched in that run. Names, ids and
   labels are text a stranger wrote: a control byte in a name or id refuses the row; a docker name or label is read
   through Go's `%q` (one line, whatever it holds); a docker id must be lower-case hex; a captured number is
   checked to be digits before any arithmetic touches it; a claim is read as a regular file only (a FIFO or a
   device is unreadable, never opened), 513 bytes to see one past the limit, through `timeout` where it exists;
   a clone's lock that is not a regular file ends the run before any git listing.
2. **Every scope inventoried, one scope swept.** A row is the caller's only when the name's owner, the record's
   owner and the caller's token are one AND — for a folder, a worktree, a claim and the clone a worktree belongs
   to — the caller owns it (the entry's own owner, never through a link: item 4). Everything else is a `foreign:`, `legacy:` or `unmarked:` line. In the caller's
   scope: age selects (younger than the window, or of unknown age: left alone silently); then the liveness
   procedure of the rule's §3 — three answers, only "no process with that pid" removes; a Linux record without a
   pid namespace, a `hidepid` process list, a failed `tasklist`, a pid no process can have, `windows:1`, a start
   mismatch: all skipped. An orphan claim is judged like any claim. A worktree is judged by its lock, read through
   its `.git` file (a relative gitdir resolved against the worktree), and the captured clone path is what every
   later step uses — the `.git` file is never read twice. A legacy row is removed only when the caller owns it and
   its old-grammar record (`<host>@<os>:<pid>[:<start>]`) is `gone`; a legacy container, volume or network is a
   `legacy:` line and nothing else.
3. **Exact removal, by identity.** Before a folder, worktree or claim goes, its device and inode and its re-read
   claim must equal the captured ones — a mismatch is `skipped … changed after the capture`. A plain folder is then
   renamed to the sibling `.<name>.teststodelete-quarantine-<pid>-<hex>` (same parent: atomic, never across a file
   system; the leading `.` keeps it out of every prefix match), checked AGAIN there — the same device, inode and
   claim, else it is renamed back and skipped — and only then removed; a quarantine an earlier killed run left is
   restored, as the first step of every run and before its capture, under its name when that is free and reported
   as a notice when it is taken — never over an existing folder. A worktree is **never renamed** (a rename breaks its gitdir pointers): it goes with
   `git worktree remove --force --force`, called on the captured clone through `timeout`, after its top-level links
   (a junction into a checkout) are unlinked; `rm -rf` never crosses a link; a folder, worktree or claim is removed
   only when it is exactly one component below the temp root; worktrees go before branches (a branch checked out in
   a kept worktree is skipped), and before folders; a branch goes by its captured tip; a container or network by its
   captured id; a volume after a re-inspect; `docker ps --filter name=` (a substring match) is never used. A deletion
   is never fatal: a target that vanished is a notice, one that survives a failed removal is skipped.
4. **A stranger's entry can make it keep, never wait.** Any local user can plant folders, FIFOs, links and crafted
   `.git` files in a shared temp root. A folder or worktree is judged and removed only when it is a real directory
   (no link) whose OWN owner — read from the entry itself, never from what a link points at (`-O` follows links) —
   is the caller, checked at the capture and again right before the removal, and only in a temp root that is
   sticky or the caller's own. A worktree's clone must be the caller's too, closed to group and world, with every
   `worktrees/*/gitdir` and every existing `worktrees/*/locked` a regular file; a `.git` that points anywhere else,
   through a link neither the caller nor root owns, or into a clone that cannot be entered is an unreadable owner:
   kept, named, with the reason. The clone is judged once per run, resolved to its physical path at the capture and
   carried to the removal, where the git calls for one worktree enter it, prove it again and run inside it, so a
   directory renamed a moment later cannot redirect them. A lock is released only on a worktree that is locked; a
   git step that failed or timed out is said and the folder kept, and `rm -rf` runs only after every git step
   succeeded. A stranger's file is read once, only when it is a regular file, and a failed read is an unreadable
   claim, not an empty one. Reads and git calls on a clone are bounded by `timeout`, else by `perl`; with neither, a
   file another user owns, or one inside a folder another user owns, is not read (kept, named, one line says so).
5. **Honest exit**, as above; `--dry-run` reports the same code; the clone the janitor runs from and the main
   checkout are never candidates, nor is any folder holding either.
6. **Windows.** The dependency is Git for Windows' bash with its `sha256sum`, `tasklist`, `stat` and `find`; nothing
   else is supported. `w<digits>` is the caller's token as the rule's §1 derives it (`printf '%s'` of the lower-cased
   account name into `sha256sum`); liveness is one `tasklist` snapshot per run, the PID column only; the file owner
   test is `-O`; the temp root is `TMPDIR`, which Git for Windows sets. Support is proven by the rule repository's
   Windows end-to-end check — an owned dead leftover deleted, a live one and a foreign one kept — and a machine
   where that check does not pass runs the janitor with `--dry-run` only.

## Never

- Never add an option that names an owner, or a mode that sweeps every scope.
- Never delete on a name alone, on age alone, or by a path or id read before the capture's re-check.
- Never re-implement the janitor in another language: a wrapper starts this file.
- Never run it through WSL interop against Windows resources, or WSL's bash against the Windows temp root.
<!-- core:end -->
