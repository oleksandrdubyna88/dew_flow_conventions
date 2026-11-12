# Barrier records — one section per machine that builds or tests this repository

> Status: **three machines recorded. The Ubuntu dev VM's barrier is OPEN (2026-10-27). The operator's WSL machine's barrier is
> OPEN (2026-11-06): the administrator scan read its two root-only places and found nothing, so its merge condition (c) is met.
> The owner's Windows machine was not tested, so its barrier is closed; since 2026-11-04 it does
> not build or test E2's and E5's repositories, and since 2026-11-12 not E6's and E7's either, which meets condition (c)
> for it for those epics (P1 closed).** The checklist
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
`/var/spool/cron/crontabs`**. The root scan below read them.

**System scan as root** (2026-10-27, an administrator, from this repository's worktree at `e20561f`): `sweeper-scan: none found (288 file(s) read) — the barrier is open for this scope` — exit 0. The three places above were read and hold no owner-blind line.

**Scheduled jobs read by hand.** No crontab for the developer account; no `teststodelete` in `/etc/cron*`, the system and
user systemd unit folders or the tmpfiles configuration. The four site timers run scripts under `/usr/local/sbin` and
`/usr/local/lib/dev-vm`; their prefix lines only validate a fake-root name (`^/var/tmp/testsToDelete-u[0-9]+-dev-vm-…$`)
or create an owner-form name. No old `janitor.sh`: the only copy on the machine is this PR's, which the allowlist pins. No
consumer of this repository is checked out here.

**Legacy resources:** not inventoried — no consumer of this repository runs here, so nothing of this family was left.

**Attested** by the repository owner on 2026-10-27 on the evidence above, for every class in the table and the unreadable
files. With the root scan, **the barrier on this machine is open** (2026-10-27).

## The owner's Windows machine — 2026-10-27, not tested

**Owner statement, 2026-10-27:** this machine was not tested for the barrier — no scan, no checklist. Its barrier is therefore
**closed**. The suite of this repository ran there on 2026-10-23 (at `93cabc6`, Git for Windows' bash); nothing has been recorded
since. Until a section here records a scan of it, it builds or tests this repository only with `TMPDIR`, `TEMP` and `TMP` set to a
private folder under the user's own profile, and the janitor stays `--dry-run` there (follow-up F9 of
[the follow-ups plan](../../todo/PLAN_test_leftovers_merged_core_followups.md); `JANITOR_WINDOWS_E2E_GREEN` is not set).

**Owner statement, 2026-11-04 (temporary):** this machine does not build or test E2's and E5's repositories (the rollout's wave 2)
for now. P1 of the rollout plan ([PLAN_test_leftovers_rollout.md](../../todo/PLAN_test_leftovers_rollout.md), § 7, question 2)
offers two ways to meet merge condition (c) for this machine: the scan and the checklist, OR a written statement that the
machine no longer builds or tests those repositories. This is the second way, so **P1 is closed and condition (c) is met for
this machine for E2 and E5**: a machine that does not run their suites cannot be hit by their producers. The barrier itself is
not opened; it stays **closed**, and the other merge conditions of each PR still apply. Checked on 2026-11-04 from the WSL machine below, through its Windows side: `where node` finds no Node, and the user
profile holds no git checkout (only tool folders). **Before this machine builds or tests E2's or E5's repository again**, its
section here gets the scan and the checklist; until then the statement is void for any repository the machine runs.

**Owner statement, 2026-11-12:** this machine builds and tests neither E6's nor E7's repository (the rollout's wave 3),
asked in the operator's session before the first E6 or E7 producer. It is the same second way as the 2026-11-04
statement, so **condition (c) is met for this machine for E6 and E7**. The barrier itself stays **closed**, and the same
rule holds: before this machine builds or tests E6's or E7's repository, its section here gets the scan and the
checklist; until then the statement is void for any repository the machine runs.

## The operator's WSL machine (Ubuntu 26.04 under WSL 2, one developer account) — 2026-11-04, re-attest

The barrier on this machine first opened on 2026-10-31; that record is in the remainder plan
([PLAN_test_leftovers_merged_core_release.md](../PLAN_test_leftovers_merged_core_release.md), "The machine scan,
2026-10-31" and "The barrier opened, 2026-10-31"). This section scans it again on 2026-11-04, with `tools/sweeper-scan.mjs` at
`38fe4ec`, and walks the *Barrier checklist* item by item.

**Scan of the checkouts parent** (`--root <checkouts parent>`, as the developer account, not root): exit 2, **196 owner-blind
lines in 98 checkouts and worktrees** of other repositories, and 4 files it could not read. Each kind of line was read in its
file. None removes anything by the prefix; the classes, with their counts:

| Class | Lines | Why it is not an enabled sweeper |
|---|---|---|
| Test assertions: a stderr text check, an empty-listing check after a run, a name-shape match, a protection-list test case | 108 | they read and compare; nothing is removed |
| A listing that reports every prefixed name and removes none (a comment on the line says so) | 23 | it lists |
| A test that checks source files for folder creators without the prefix | 23 | it reads source text |
| A test helper that removes ONE folder it made, by its full path, at process exit; the prefix is in a comment | 23 | it removes the folder it just made, not by the prefix |
| A process probe in a test support file (`systemctl --user list-units` names and `/proc` command lines, filtered by text) | 6 | it reads |
| A doc comment that describes an owner-form sweep pattern | 6 | a comment |
| A protection list (`neverMatches`) in a product's settings contract: a glob a user may NOT allow | 4 | it refuses the prefix; it removes nothing |
| A wait loop in a test that waits until a name starts with the prefix | 3 | it waits |

**System scan** (`--system`, as the same developer account): exit 2. Its owner-blind lines are a subset of the lines above (194
of 196). It could not read 12 places:
- **Ten too-large or unlistable places:** five generated source files over 4 MiB in a pre-commit tool cache, one Python package
  cache that git cannot list, and one static HTML asset over 4 MiB in four checkouts of one other project.
  `grep -rIliF teststodelete` over each: **0 matches**.
- **Two root-only places:** root's user systemd folder and `/var/spool/cron/crontabs` (EACCES). They were **not read again**:
  the developer account has no password-less `sudo`, and the account did not go around that. What was checked instead:
  - no `systemd --user` manager runs as root, so units in root's user folder do not start;
  - the crontabs folder was last changed on 2025-11-05, almost a year before the prefix rule was written (2026-10-14). The
    `crontab` command replaces a file there, which changes the folder, so no crontab was added or edited THROUGH IT after that
    date. This is supporting evidence, not proof: a direct edit by root could leave the folder's date unchanged.
  An administrator can close this gap with one command: `sudo node tools/sweeper-scan.mjs --system`.

**Scheduled jobs read by hand.** The developer account has no crontab and no user timer that touches a sweep (its three user
timers are distribution timers). `grep -rliF teststodelete` over `/etc/cron*`, the system and user systemd unit folders and the
tmpfiles configuration: 0 matches. The system timers are distribution timers and one site timer that runs a product's own
maintenance command; in that product's source, the only prefix line is the protection list in the table. No old `janitor.sh` is scheduled.

**Consumer sweeps.** This scan finds no deleting copy in any checkout or worktree on this machine, including those of ended
sessions. That is a local fact only; the state of each consumer's sweep-only stage is the rollout plan's record, not this
one's (on 2026-11-04 it keeps E7's stage A — rag_qln's `qlntest_*` store collections, not a temp folder — open, which blocks
only E7's producer).

**Legacy resources** (inventory only, nothing removed): `/tmp` holds 10 legacy-form folders of one other repository's
benchmark tests (6 and 4, of two kinds), all made on 2026-11-04, so a suite that is not yet migrated still makes them. Their
epic removes them after its producer stage merges. `/var/tmp` holds none. `bash tools/janitor.sh --dry-run` from this
repository's worktree: no Docker binary, nothing to list.

**Attested** on 2026-11-04 by the operator's session, on the evidence above, at the owner's request ("re-attest this WSL
machine's barrier, do it yourself"), for every class in the table and the ten unreadable places — NOT for the two root-only
places, which were not read. With the 2026-10-31 record, **the barrier is open for every place the developer account can
read.** The checklist says the barrier is never declared open on unread evidence, so **merge condition (c) for this machine is
not complete**: the open item is the administrator's `sudo node tools/sweeper-scan.mjs --system`. When it exits 0, or each line
it prints is resolved here, this section records it and condition (c) is met for this machine.

**System scan as root** (2026-11-06, the owner as administrator, from this repository's main checkout at `abac5a8`, on the
owner's word in the session; the output is quoted as the owner pasted it):
`sweeper-scan: none found (266 file(s) read) — the barrier is open for this scope`. The tool prints that line only on its
path to exit 0; the paste does not show the exit code itself. It printed no `unreadable:` line, so the two root-only places
above were read: `/root/.config/systemd/user` and `/var/spool/cron/crontabs`. Neither holds an owner-blind line.

**What this scan covers, and what it does not.** With no `--root`, the root is the folder it starts in, so it read this
checkout, root's crontab, and the system scope (`/etc/crontab`, `/etc/cron*`, `/var/spool/cron`, `/etc/systemd/system`, every
home's systemd user folder). It did not read the other checkouts; the table above and its attestation cover them, for
2026-11-04. A checkout's lines are not scheduled sweeps; the scheduled places are what this scan closes. The same command as
the developer account, from the same checkout, on the same day: exit 2, no owner-blind line, and only those two places
unreadable (EACCES), so the root scan's answer is not a change of scope hiding a finding. The scanner at `abac5a8` is the one
before F30's forward-only pass, which F30 states gives the same answers.

**Attested** on 2026-11-06 by the operator's session, on the owner's scan above. **The barrier on this machine is open, and
merge condition (c) is met for it.** The other merge conditions of each PR still apply.
