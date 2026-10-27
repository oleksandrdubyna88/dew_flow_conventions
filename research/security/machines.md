# Barrier records — one section per machine that builds or tests this repository

> Status: **one machine recorded, 2026-10-27; its barrier is open except three places only root can read.** The checklist
> each section answers is the merged-core plan's *Barrier checklist* ([PLAN_test_leftovers_merged_core.md](../PLAN_test_leftovers_merged_core.md)).
> A machine with no section here is a machine whose barrier is closed. Names of other repositories are not written here.

## The Ubuntu dev VM (Linux, several OS accounts, one Docker daemon) — 2026-10-27, scan at `8948ff7`

**Scan of the checkouts parent** (`node tools/sweeper-scan.mjs --root <checkouts parent>`, lowered, as a developer account,
not root): exit 2, **486 owner-blind lines in 38 checkouts and worktrees** of four other repositories, and 23 files it could
not read. Each line was read in its file. None removes anything by the prefix; the classes, with their counts:

| Class | Lines | Why it is not an enabled sweeper |
|---|---|---|
| The private sibling's sweeper fixtures and tests, each marked `not-a-sweeper` | 259 | strings its own classifier is tested on; the one systemd unit among them is a file under a test fixture folder, not installed |
| Test assertions that count or match a name (`find … \| wc -l`, `assert`, `expect`, `.filter`) | 184 | they read and count; nothing is removed |
| A test stub that prints a folder's mode (`stat -c %a "$TMPDIR"/testsToDelete-*`) | 3 | reads a mode |
| A regex constant in a test that recognises the owner form | 10 | matches text in source files |
| Name checks and comments in shell scripts (a `[[ … == */testsToDelete-* ]]` path test, a `die` message, a stub's argument test) | 10 | they validate or describe a name |
| A CI step that creates and removes ONE fixed file name in a container | 10 | removes the file it just made, by its full name |
| A `git grep` of the prefix in a scan test | 10 | reads |

**The 23 unreadable files** are data samples larger than 4 MiB (bank statement fixtures, sample API responses, one SQL dump).
`grep -iF teststodelete` over each: 0 matches. **The developer account's home** (`--root ~`): exit 2 for one folder git cannot
list, a package manager's cache; `grep -rIliF teststodelete` over it: 0 matches.

**System scan** (`--system`, as the same developer account): no owner-blind line in any place it could read; exit 2 for
three places only root can read — **root's user systemd folder, another developer account's user systemd folder, and
`/var/spool/cron/crontabs`**. These three are the open part of this record.

**Scheduled jobs read by hand.** No crontab for the developer account; no `teststodelete` in `/etc/cron*`, the system and
user systemd unit folders or the tmpfiles configuration. The four site timers run scripts under `/usr/local/sbin` and
`/usr/local/lib/dev-vm`; their prefix lines only validate a fake-root name (`^/var/tmp/testsToDelete-u[0-9]+-dev-vm-…$`)
or create an owner-form name. No old `janitor.sh`: the only copy on the machine is this PR's, which the allowlist pins. No
consumer of this repository is checked out here.

**Legacy resources:** not inventoried — no consumer of this repository runs here, so nothing of this family was left.

**Attested** by the repository owner on 2026-10-27 on the evidence above, for every class in the table and the unreadable
files. **Still open:** an administrator runs `node tools/sweeper-scan.mjs --system` as root (or reads the three places) and
adds the result here.
