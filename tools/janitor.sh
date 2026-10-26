#!/usr/bin/env bash
# janitor.sh — the host-wide leftover janitor of common/test-leftovers.md (§ The janitor). Its contract — the invocation, the
# output lines, the exit codes and what every copy must keep — is common/test-leftovers-janitor.md; this header is a summary.
#
# Everything a test run creates outside its process is named `testsToDelete-<owner>-<repo>-<what>-<id>` (rule §1) and claimed by
# its run with the owner record `<owner>:<host>@<os>:<pid>[:<start>[:<ns>]]` (rule §3). This script inventories what those runs
# left behind on THIS machine — every user, every repository token, every kind: containers, volumes, networks, worktrees,
# branches, temp folders — and SWEEPS ONLY ITS CALLER'S SCOPE. It keeps five promises:
#
#   1. ONE capture. Every prefixed resource of every user is listed once, with its identity (device and inode), its owner record,
#      its age and its name form, before anything is decided; only captured, authorised items are deleted, by their captured id or
#      path. A resource that appears after the capture is not touched in this run (the next run judges it). Names are data a
#      stranger wrote: a name or id with a control character is refused with a line, a docker name or label is read through Go's
#      `%q` (one line, whatever it holds), a docker id must be lower-case hex, and a captured number is checked to be digits before
#      any arithmetic touches it. The script runs in the C locale, so every range and class below is bytewise.
#   2. Scope selects, liveness authorises, uncertainty preserves. A row is the CALLER's only when the name's owner segment, the
#      record's owner and the caller's token (`u<uid>`, or `w<digits>` on Windows; TESTSTODELETE_OWNER, when set, must be
#      `^[uw][0-9]{1,10}$` or the run exits 2) are ONE, and — for a folder, a worktree, a claim — the entry's OWN kernel owner (never
#      through a link) is the caller. Anything else is a `foreign:` line, a `legacy:` line (a name from before the owner segment) or an
#      `unmarked:` line (no record at all): listed, never touched, never an exit code; `u0` is root's own scope like any other. In
#      the caller's scope age selects (a resource younger than the window, or of unknown age, is left alone, silently) and the owner
#      record authorises: a live owner, a foreign host, a record that is not exactly the grammar (a claim longer than 512 bytes
#      included), a Linux record without a pid namespace or with another one, a lock that names nobody, a worktree whose lock cannot
#      be read, a pid no process can have, or — on Windows — process id 1 is SKIPPED with one line naming it — never deleted; only
#      "no process has that pid" removes. A worktree is judged by its lock, read through its `.git` file whatever clone owns it (a
#      relative gitdir is resolved against the worktree) and read like any claim: the caller's own regular file, at most 512 bytes. A
#      clone — the swept one too — must be the caller's and closed to group and world, else its worktrees are kept. A registration
#      whose folder is gone is a `notice:` and kept: nothing here prunes. The worktree the janitor runs from is never a candidate. A legacy row is
#      removed only when the caller owns it and its old-grammar record `<host>@<os>:<pid>[:<start>]` is gone (never on a Linux
#      reader: such a record has no namespace); a legacy container, volume or network is a line and nothing else.
#   3. Exact removal, by identity. A folder, worktree or claim goes only when its device and inode and its re-read claim equal the
#      captured ones and it is exactly one component below the temp root. A plain folder is first renamed to the sibling
#      `.<name>.teststodelete-quarantine-<pid>-<hex>` (same parent, so atomic; the leading dot keeps it out of every prefix match),
#      checked AGAIN there (device, inode, claim; a mismatch is renamed back and skipped), and only then removed; a quarantine an
#      earlier killed run left (a legacy name's too) is restored, as the first step of every run and before the capture, when its
#      renamer is dead and its ctime and mtime are past the window, onto a FREE name only (an exclusive mkdir of mode 700, then rename
#      onto that empty directory) and reported as a notice otherwise; the rename INTO quarantine is `mv -T`-style too, never into a
#      directory that appeared there. A worktree is NEVER renamed (a rename breaks
#      its gitdir pointers): top-level links (a junction into a checkout) are unlinked, then `git worktree remove --force --force`
#      runs on the captured clone. `rm -rf` never crosses a link. Worktrees go before branches, and before folders. A branch has no owner
#      record: it is removed ONLY together with the worktree it was checked out in when THIS run removed that worktree because its
#      owner was `gone` (rule §3's "removed with it"), and then by its captured tip; every other prefixed branch is an `unmarked:`
#      line, never removed. A deletion is never fatal: a target that vanished after the capture is a notice, one that survives a failed
#      removal is skipped.
#   4. Honest exit. 0 when nothing in the caller's scope was skipped; 3 when something was (it is named on stderr); any other code
#      is a docker/git failure — a stopped Docker daemon is a failure, not a clean machine. A machine with no `docker` binary says
#      so once and still sweeps git and the temp root. `foreign:`, `legacy:`, `unmarked:` and `notice:` lines never change the code.
#   5. No option names an owner and no mode sweeps every scope: an administrator sweeps another user's scope by running as that
#      user. `--token <t>` narrows to the caller's own names for that repository.
#
# Usage:  bash tools/janitor.sh [--dry-run] [--token <t>]   — from inside the repository whose worktrees and branches
#         are swept.  --token <t> restricts the sweep to names `testsToDelete-<owner>-<t>-…` of the caller's owner (all three
#         spellings, any case, anchored: `alpha` never matches `alphabet`); <t> is 2 to 12 lower-case letters and digits and not an
#         owner token, anything else — and any unknown argument — prints this usage line and exits 2 with nothing touched.  The
#         options combine in either order.  On Windows run it from Git for Windows' bash, never WSL's (which sees neither the
#         Windows temp root nor Windows pids).  JANITOR_MIN_AGE_MINUTES (default 60) is the window: whole minutes, digits only,
#         at least 1 — anything else is refused in one line (exit 1, nothing removed).  --dry-run prints `would run: …`
#         lines on STDOUT (skips, lists and notices stay on stderr) and removes nothing; its exit code is the real run's.
#         Progress goes to stderr: `janitor: looking for testsToDelete resources…` when the capture starts and one
#         `janitor: removed <kind> <name>` line per real removal (the name printed through clean() and then shell-quoted by
#         `printf %q`, so a quote or a space inside it cannot pass for text of the line; a dry run has none).
#         JANITOR_OS, JANITOR_PROC (the /proc root, default /proc), JANITOR_HOSTNAME (the machine name, default
#         `hostname`), JANITOR_TEST_UID (the user id this run believes it has: the owner token and every kernel-owner comparison),
#         JANITOR_TEST_OWNER_CHECK (`foreign`: nothing counts as this user's; `foreign:<path>`: that one path
#         does not; `foreign-clone`: only clones do; `foreign-late`: a clone turns foreign only when it is entered for the removal) and
#         JANITOR_TEST_PAUSE_FILE (wait, after the decisions and before the first removal, until that path exists) are
#         test seams only: honoured, and announced once each on stderr when set.
#
# Strangers. Any local user can create `testsToDelete-…` entries in a shared temp root: folders, files, FIFOs, symlinks and
# crafted `.git` files. Such an entry can make the janitor WAIT, never delete the wrong thing, and the waits are closed:
#   - an entry whose name carries another owner is never read or opened: it is a `foreign:` line.
#   - a folder or worktree FOLDER is judged and removed only when it is a real directory (no link) whose OWN owner is this user — read
#     from the entry itself (lstat first; `-O` follows a link and would answer for the target) at the capture and again right
#     before the removal, where a stranger who swapped it for a link to a real worktree would otherwise have made
#     `git worktree remove` delete THAT. (In a sticky temp root nobody but its owner can replace such a folder; a temp root
#     that is neither sticky nor this user's is not trusted at all: its folders and worktree folders are kept, `-unsafe-root`, one line.)
#     A claim file another user owns is no evidence (`foreign:`), and a claim is read only when it is a regular file.
#   - a worktree is judged and removed only through a clone the janitor's own user owns (`-O`); a `.git` file that points
#     into someone else's repository makes the owner unreadable — kept, named. A false negative only KEEPS a folder.
#     The owner text of a refusal says why: `-unsafe-root`, `-malformed-gitdir`, `-group-or-world-writable`, `-unbounded`;
#     "changed after the capture" names which check failed (a clone writable by its group is kept with exit 3 — a umask of 002
#     makes every new clone one).
#   - before git is pointed at a clone, that clone's `worktrees/*/gitdir` and `worktrees/*/locked` must be regular files
#     (git itself blocks on a FIFO there).
#   - the clone is resolved ONCE, at the capture, and carried through the row to the removal; a stranger's `.git` file is
#     read once, never again, and only when it is a regular file that is no link. At removal it is checked for its TYPE
#     only: one that is no longer a regular file means the folder changed after the capture, and it is kept.
#   - the clone is carried as its PHYSICAL path (every link resolved at the capture) and is refused when a component of the
#     path the stranger wrote is a link owned by neither this user nor root, or when the clone or its worktrees/ is writable
#     by its group or by everyone. A clone is judged ONCE per run. The git calls for one worktree (unlock, remove) run in ONE
#     subshell INSIDE the clone: it enters the clone by its physical path, proves what it entered is the clone that was
#     captured (same path, still mine, closed to others, no FIFO among its entries, same route from the stranger's .git, the lock
#     still the one that was judged) and runs `git --git-dir=.` there with git's own environment variables unset, so a directory
#     above it renamed a moment later cannot redirect the call. Any change keeps the folder. A clone that cannot be entered is a
#     foreign one: kept and named.
#   - `worktree unlock` runs only for a worktree that IS locked, so any failure of it is real. The lock file is looked at again
#     inside the entered clone, but only to decide whether to run unlock and whether its failure counts: what PROTECTS a lock is
#     the judgement at the capture (a live or unreadable owner is never a candidate). A clone's admin state is read once per run
#     at the capture (the cache above); the entered clone is read again for each worktree, which is the security check.
#   - a git step that failed or timed out is SAID (one notice with the step and the exit status) and the folder is kept, never
#     deleted behind git's back; a claim read that failed or timed out is an unreadable claim, never an empty one.
#   - a read of a stranger's file and every git call on a clone is bounded by `timeout`, else by `perl`'s alarm. With neither,
#     a file this user does not own, or one inside a folder this user does not own, is NOT read (its entry is kept and named,
#     `-unbounded`) and one line says so; files this user owns are read as before. Residual: a claim in the shared temp root
#     is checked for its owner right before it is read, and a root that is neither sticky nor this user's would let a
#     stranger swap it in that instant.
set -euo pipefail
unset CDPATH   # a `cd` below must never print a directory or resolve through the caller's search path
LC_ALL=C; export LC_ALL   # bytewise: under en_US.UTF-8 a bash range such as [0-9] matches other scripts' digits, and an owner record holding them would pass
usage() { echo "usage: bash tools/janitor.sh [--dry-run] [--token <t>]   (<t>: 2 to 12 lower-case letters and digits, not an owner token)" >&2; exit 2; }
DRY=0; TOKEN=""; HAVE_TOKEN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift;;
    --token) [ $# -ge 2 ] || usage; TOKEN="$2"; HAVE_TOKEN=1; shift 2;;
    *) usage;;
  esac
done
if [ "$HAVE_TOKEN" = 1 ]; then   # validated BEFORE it reaches a regex or a glob; the rule's token shape is [a-z0-9]{2,12} and no owner token
  case "$TOKEN" in ""|*[!a-z0-9]*) usage;; esac
  if [ "${#TOKEN}" -lt 2 ] || [ "${#TOKEN}" -gt 12 ]; then usage; fi
  if [[ "$TOKEN" =~ ^[uw][0-9]{1,10}$ ]]; then usage; fi
fi
AGE_MIN="${JANITOR_MIN_AGE_MINUTES:-60}"   # validated BEFORE use: bash evaluates an arithmetic operand such as `a[$(cmd)]`
case "$AGE_MIN" in *[!0-9]*|????????*) echo "janitor: JANITOR_MIN_AGE_MINUTES must be whole minutes, digits only (at most 7) — nothing was removed" >&2; exit 1;; esac
if [ $(( 10#$AGE_MIN )) -lt 1 ]; then echo "janitor: JANITOR_MIN_AGE_MINUTES must be at least 1 — nothing was removed" >&2; exit 1; fi
T="${TMPDIR:-/tmp}"; T="${T%/}"; MIN_AGE=$(( 10#$AGE_MIN * 60 )); NOW="$(date -u +%s)"   # 10#: a leading zero is decimal, never octal
TAB=$'\t'
U=$'\x1f'   # the field separator of the capture: never whitespace, so an EMPTY owner or age keeps its column
OS="${JANITOR_OS:-$(case "$(uname -s)" in Linux) echo linux;; Darwin) echo macos;; *) echo windows;; esac)}"   # JANITOR_OS: test seam only
lower() { tr '[:upper:]' '[:lower:]'; }
clean() { printf '%s' "$1" | LC_ALL=C tr -c '\040-\176' '?'; }   # text for a person's terminal: all but printable ASCII (escapes, CR, LF) becomes '?'
win_token() {   # $1 = an account name (no domain) → its owner token `w<digits>` (rule §1): the ASCII letters A-Z lower-cased and nothing else changed, the bytes of the name ALONE (printf '%s', no line end), SHA-256, the first four digest bytes as one unsigned 32-bit number in decimal. A collision confers no authority: the file's owner decides
  local n h
  if [ -z "$1" ]; then return 1; fi
  n="$(printf '%s' "$1" | LC_ALL=C tr 'A-Z' 'a-z')"
  h="$(printf '%s' "$n" | sha256sum | cut -c1-8)" || return 1
  case "$h" in *[!0-9a-f]*) return 1;; esac   # hex digits only reach the arithmetic below
  if [ "${#h}" != 8 ]; then return 1; fi
  printf 'w%s\n' "$(( 16#$h ))"
}
MY_UID="${JANITOR_TEST_UID:-${UID:-}}"   # the REAL user id (bash's own UID); JANITOR_TEST_UID is a test seam: it stands for the uid in the token AND in every kernel-owner comparison
case "$MY_UID" in ""|*[!0-9]*|???????????*) echo "janitor: the user id $(clean "$MY_UID") is not a number of at most 10 digits — nothing was touched" >&2; exit 2;; esac
OVERRIDE="${TESTSTODELETE_OWNER:-}"   # the one override of the caller's token (a run inside a container that talks to the host's daemon); an empty value is no value
if [ -n "$OVERRIDE" ]; then   # validated against the grammar before anything is matched: an invalid value refuses, never falls back — and it never widens what the kernel owner allows
  if ! [[ "$OVERRIDE" =~ ^[uw][0-9]{1,10}$ ]]; then echo "janitor: TESTSTODELETE_OWNER $(clean "$OVERRIDE") is not an owner token (^[uw][0-9]{1,10}\$) — nothing was touched" >&2; exit 2; fi
  ME_OWNER="$OVERRIDE"
elif [ "$OS" = windows ]; then
  ME_OWNER="$(win_token "$(id -un)")" || { echo "janitor: cannot derive this account's owner token (id, sha256sum) — nothing was touched" >&2; exit 2; }
else ME_OWNER="u$MY_UID"; fi
RX='teststodelete[-_]'; GLOB='teststodelete[-_]*'   # the INVENTORY: what a name starts with (rule §1: three spellings, case-insensitive), every owner; deletion is gated per row by scope. --token narrows both to the caller's own names
if [ "$HAVE_TOKEN" = 1 ]; then RX="teststodelete[-_]${ME_OWNER}[-_]${TOKEN}[-_]"; GLOB="teststodelete[-_]${ME_OWNER}[-_]${TOKEN}[-_]*"; fi
uspace_seqs() {   # the UTF-8 bytes of every Unicode space Node's \s names beyond ASCII, one per line: [[:space:]] is ASCII-only in a C/POSIX locale
  printf '%s\n' $'\xc2\xa0' $'\xe1\x9a\x80' $'\xe2\x80\x80' $'\xe2\x80\x81' $'\xe2\x80\x82' $'\xe2\x80\x83' $'\xe2\x80\x84' $'\xe2\x80\x85' $'\xe2\x80\x86' $'\xe2\x80\x87' $'\xe2\x80\x88' $'\xe2\x80\x89' $'\xe2\x80\x8a' $'\xe2\x80\xa8' $'\xe2\x80\xa9' $'\xe2\x80\xaf' $'\xe2\x81\x9f' $'\xe3\x80\x80' $'\xef\xbb\xbf'
}
uspace() {   # does $1 hold a Unicode space?
  local s; while IFS= read -r s; do
    case "$1" in *"$s"*) return 0;; esac
  done <<< "$(uspace_seqs)"
  return 1
}
host_norm() {   # the host as an owner writes it: each run of '@', ':' or whitespace (ASCII or Unicode) is ONE '-', nothing trimmed, case kept — owned.mjs hostName is the same rule
  local LC_ALL=C s="$1" out="" prev=0 hit=0 seq q seqs=()
  while IFS= read -r q; do seqs+=("$q"); done <<< "$(uspace_seqs)"
  while [ -n "$s" ]; do
    hit=0
    case "${s:0:1}" in '@'|':'|[[:space:]]) hit=1; s="${s:1}";; esac
    if [ "$hit" = 0 ]; then
      for seq in "${seqs[@]}"; do case "$s" in "$seq"*) hit=1; s="${s#"$seq"}"; break;; esac; done
    fi
    if [ "$hit" = 1 ]; then
      if [ "$prev" = 0 ]; then out="$out-"; fi
      prev=1
    else out="$out${s:0:1}"; s="${s:1}"; prev=0; fi
  done
  printf '%s\n' "$out"
}
host_id() {   # $1 = the DNS host name, $2 = the WSL distribution name or "": distributions share one host name and one Docker daemon but not pid spaces, so under WSL the host is <host>~<distro> (owned.mjs hostId is the same rule)
  if [ -n "${2//[[:space:]]/}" ]; then printf '%s~%s\n' "$(host_norm "$1")" "$(host_norm "$2")"; else host_norm "$1"; fi
}
me="$(host_id "${JANITOR_HOSTNAME:-$(hostname)}" "${WSL_DISTRO_NAME:-}")@$OS"
for seam in JANITOR_OS JANITOR_PROC JANITOR_HOSTNAME JANITOR_TEST_OWNER_CHECK JANITOR_TEST_PAUSE_FILE JANITOR_TEST_UID; do   # a seam changes what the janitor believes: say so, once, every time it is set
  if [ -n "${!seam:-}" ]; then echo "janitor: test seam $seam is set ($(clean "${!seam}")) — it exists for tests; a real run does not set it" >&2; fi
done
BOUND=none   # how a read or a git call that a stranger's file could block is ended: `timeout`, else perl's alarm, else not at all. Probed by RUNNING them: a `timeout` that is not GNU's (stock macOS has none) is not used
if timeout 5 true >/dev/null 2>&1; then BOUND=timeout; elif perl -e 'alarm shift; exec @ARGV' 5 true >/dev/null 2>&1; then BOUND=perl; fi
bounded() { case "$BOUND" in timeout) timeout "$@";; perl) perl -e 'alarm shift; exec @ARGV' "$@";; *) shift; "$@";; esac; }   # $1 = seconds, then the command. With BOUND=none nothing ends it, so callers do not point it at a file another user owns
seam_foreign() {   # test seam: does JANITOR_TEST_OWNER_CHECK call $1 someone else's?
  case "${JANITOR_TEST_OWNER_CHECK:-}" in
    foreign) return 0;;   # nothing is this user's
    "foreign:$1") return 0;;   # just this path
    foreign-late) if [ "${PINNED:-0}" = 1 ]; then return 0; fi;;   # everything turns foreign once a clone is entered for the removal
  esac
  return 1
}
owned_by_me() {   # is file or directory $1 owned by the user running the janitor? $2 = what the test seam is told it is (default $1). `-O` follows a link, so it must never be asked about an ENTRY of the temp root (use entry_mine). A false answer (an ownership mapping that cannot say, MSYS for one) only KEEPS a folder
  if seam_foreign "${2:-$1}"; then return 1; fi
  [ -O "$1" ]
}
entry_mine() {   # $1 = an entry of the temp root: a real directory (no link) whose OWN owner is this user. The owner is read with lstat FIRST: `-O` would answer for what a link points at
  local u
  if seam_foreign "$1"; then return 1; fi
  u="$(link_uid "$1")"
  case "$u" in ""|*[!0-9]*) return 1;; esac
  [ "$u" = "$MY_UID" ] && [ ! -L "$1" ] && [ -d "$1" ]
}
shared_dir_ok() {   # a directory in which a stranger cannot replace what this user owns: sticky, or this user's own (read from the directory itself, links resolved first)
  local p u
  p="$(physical "$1")"
  if [ -z "$p" ]; then return 1; fi
  if [ -k "$p" ]; then return 0; fi
  if seam_foreign "$1"; then return 1; fi
  u="$(link_uid "$p")"
  case "$u" in ""|*[!0-9]*) return 1;; esac
  [ "$u" = "$MY_UID" ]
}
# The record grammar (rule §3): `<owner>:<host>@<os>:<pid>[:<start>[:<ns>]]` with the owner of rule §1; the form from before the owner segment
# is `<host>@<os>:<pid>[:<start>]`, read only for a LEGACY name's record.
owner_ok() { local t="${1%$'\r'}"; if uspace "$t"; then return 1; fi; [[ "$t" =~ ^[uw][0-9]{1,10}:[^@:[:space:]]+@(linux|macos|windows):[0-9]+(:[0-9]+(:[0-9]+)?)?$ ]]; }   # the rule's record grammar, exactly
legacy_owner_ok() { local t="${1%$'\r'}"; if uspace "$t"; then return 1; fi; [[ "$t" =~ ^[^@:[:space:]]+@(linux|macos|windows):[0-9]+(:[0-9]+)?$ ]]; }   # the grammar before the owner segment, exactly
parse_record() {   # $1 = a text owner_ok accepted → R_OWNER R_HOST (host@os) R_PID R_NS ("" when absent): the host holds no ':', so ':' splits the fields
  local IFS=: t="${1%$'\r'}"
  read -r R_OWNER R_HOST R_PID _ R_NS <<< "$t"   # the start (4th field) is never compared here: rule §3 lets a reader that cannot read the live start answer live
}
scope_ok() {   # the pure half of the rule's scope key: $1 = the name's owner, $2 = the record's owner, $3 = the caller's token, $4 = 1 when the entry's own kernel owner is the caller (0 otherwise). All agree, or the row is not the caller's
  [ "$4" = 1 ] && [ "$1" = "$3" ] && [ "$2" = "$3" ]
}
ns_ok() {   # $1 = the reader's os, $2 = the record's pid namespace ("" when it has none), $3 = the reader's own ("" when it cannot be read). Only a Linux reader requires one: two namespaces can share a host name, never a pid space
  [ "$1" = linux ] || return 0
  [ -n "$2" ] && [ -n "$3" ] && [ "$2" = "$3" ]
}
NF_FORM=none; NF_OWNER=""; NF_PREFIX='teststo''delete'   # the prefix in two pieces: name_form READS names, it sweeps nothing, and the machine scan reads this file too (owned.mjs does the same)
name_form() {   # $1 = a leaf name → NF_FORM and NF_OWNER, read from the ONE segment after the prefix against the reserved owner grammar, never by counting separators: `owner` (NF_OWNER = that segment, lower-cased), `legacy` (any other segment), `none` (not prefixed, or nothing after the prefix)
  local seg had=0
  NF_FORM=none; NF_OWNER=""
  if shopt -q nocasematch; then had=1; fi
  shopt -s nocasematch   # the prefix is matched in every case, the owner letter too
  if [[ "$1" =~ ^${NF_PREFIX}[-_]([^-_]+) ]]; then
    seg="${BASH_REMATCH[1]}"
    NF_FORM=legacy
    if [[ "$seg" =~ ^[uw][0-9]{1,10}$ ]]; then
      NF_FORM=owner; NF_OWNER="$seg"
      case "${seg:0:1}" in U) NF_OWNER="u${seg:1}";; W) NF_OWNER="w${seg:1}";; esac
    fi
  fi
  if [ "$had" = 0 ]; then shopt -u nocasematch; fi
}
pid_ok() { [[ "$1" =~ ^[1-9][0-9]{0,15}$ ]] && [ "$1" -le 9007199254740991 ]; }   # a process id: positive, no leading zero, a safe integer. Grammar-valid is not enough: 0, 007 or 25 digits name no process, so "no such process" about them would be a lie
claim_norm() {   # $1 = the RAW text of a claim, line end intact → the claim as ONE line, or "-" when it is not exactly one line or is longer than 512 bytes
  local LC_ALL=C raw="$1"
  if [ "${#raw}" -gt 512 ]; then printf -- '-'; return 0; fi   # bytes, not characters; owned.mjs applies the same limit
  case "$raw" in *$'\r\n') raw="${raw%$'\r\n'}";; *$'\n') raw="${raw%$'\n'}";; esac   # ONE line end: CRLF or LF
  case "$raw" in *$'\n'*|*$'\r'*) printf -- '-';; *) printf '%s' "${raw:--}";; esac   # a second line, or a CR that is no part of a line end, is not exactly one line
}
claim_of() {   # the claim in file $1: 513 bytes are read, so one past the limit is seen. $(...) alone drops EVERY trailing newline, so a sentinel carries them to claim_norm. `-foreign-claim` when the file's OWN owner (lstat) is not this user: a stranger wrote it, it is no evidence and it is never opened. Exit 3 when nothing could end the read (BOUND=none and the file or its folder is another user's)
  local raw rc u
  if seam_foreign "$1"; then printf -- '-foreign-claim'; return 0; fi
  u="$(link_uid "$1")"
  case "$u" in ""|*[!0-9]*) printf -- '-'; return 0;; esac   # an owner nobody can name is not this user
  if [ "$u" != "$MY_UID" ]; then printf -- '-foreign-claim'; return 0; fi
  if [ ! -f "$1" ] || [ -L "$1" ]; then printf -- '-'; return 0; fi   # only a regular file is read: a FIFO (or a device) planted as a claim would block `head` forever; anything else is unreadable, so preserved
  if [ "$BOUND" = none ] && { ! owned_by_me "$1" || ! shared_dir_ok "${1%/*}"; }; then printf -- '-unbounded'; return 3; fi   # nothing can end a read of a file another user owns, or one in a folder where another user could swap it (a swap after the type test): the entry is kept, named, and one line says why
  raw="$(set +e; bounded 5 head -c 513 -- "$1" 2>/dev/null; printf 'x%s' "$?")"   # the sentinel carries head's (or timeout's) exit status, which `$(...)` would otherwise lose
  rc="${raw##*x}"; raw="${raw%x"$rc"}"
  if [ "$rc" != 0 ]; then printf -- '-'; return 0; fi   # a read that failed or was cut short is no claim, however good its prefix looks: unreadable, so kept
  claim_norm "$raw"
}
read_claim() {   # $1 = a claim file → the claim in O; one `unbounded` row on stdout (the capture's own stream) when nothing could end the read, so the one-line notice keys on THIS and never on claim text
  local rc=0; O="$(claim_of "$1")" || rc=$?
  if [ "$rc" = 3 ]; then note_unbounded; fi
}
note_unbounded() { printf '%s\n' "unbounded$U$U$U$U"; }
note_unsafe_root() { printf '%s\n' "unsafe-root$U$U$U$U"; }
# Liveness is THREE-valued — 0 live, 1 dead, 2 unknown — and only "no process with that pid" is dead. A refused or
# failed query (a missing `tasklist`, a `ps` that errors, no /proc) is unknown and preserves. `kill -0` is not used:
# it cannot tell "no such process" from "not permitted" without parsing a localised message.
TASKS=""; TASKS_RC=""   # one `tasklist` snapshot per run, taken on the first Windows liveness question
PROC="${JANITOR_PROC:-/proc}"   # test seam: the /proc root
MY_NS=""   # this process's pid namespace (the digits of /proc/self/ns/pid): on a Linux reader a record is judged only against it
if [ "$OS" = linux ]; then
  ns_link="$(readlink "$PROC/self/ns/pid" 2>/dev/null)" || ns_link=""
  if [[ "$ns_link" =~ ^pid:\[([0-9]+)\]$ ]]; then MY_NS="${BASH_REMATCH[1]}"; fi
fi
task_snapshot() {   # sets TASKS (the CSV rows) and TASKS_RC; ONE notice line when the snapshot is no answer, so the per-resource skip lines need no diagnosis
  local out first
  out="$(tasklist //NH //FO CSV 2>&1)" && TASKS_RC=0 || TASKS_RC=$?
  TASKS="$(printf '%s\n' "$out" | grep '^".*","' || true)"   # CSV rows only: a stderr line is never a row
  if [ "$TASKS_RC" != 0 ]; then
    first="$(printf '%s\n' "$out" | head -n 1)"
    echo "janitor: tasklist failed (exit $TASKS_RC: $(clean "${first:-no output}")) — Windows owners cannot be judged and are kept" >&2
  elif [ -z "$TASKS" ]; then echo "janitor: tasklist printed no process list — Windows owners cannot be judged and are kept" >&2; fi
}
liveness() {
  case "$OS" in
    windows)
      if [ -z "$TASKS_RC" ]; then task_snapshot; fi
      [ "$TASKS_RC" = 0 ] || return 2
      [ -n "$TASKS" ] || return 2   # exit 0 with nothing in it: not an answer
      # the PID is the SECOND quoted column: `","` splits the columns (no image name holds a quote), and only that field is compared
      if printf '%s\n' "$TASKS" | awk -F'","' -v p="$1" '$2 == p {f = 1} END {exit !f}'; then return 0; fi
      return 1;;   # a real snapshot that lacks the pid
    *)
      if [ "$OS" = linux ] && [ -d "$PROC" ]; then   # /proc answers for every user — unless it is mounted hidepid=1/2
        if [ -d "$PROC/$1" ]; then return 0; fi
        if [ -d "$PROC/1" ]; then return 1; fi   # pid 1 always exists: when even it is invisible, other users' processes are hidden too
        return 2   # hidepid: a missing /proc/<pid> proves nothing
      fi
      ps -p "$1" -o pid= >/dev/null 2>&1 && return 0
      case $? in 1) return 1;; *) return 2;; esac;;   # ps: 1 = no such process; anything else = refused or missing
  esac
}
if command -v docker >/dev/null; then dk() { docker "$@"; }; else dk() { :; }; echo "janitor: no docker binary — containers, volumes and networks not swept" >&2; fi
epoch_of() {   # docker's "2026-10-15 10:22:33 +0200 CEST" / "2026-10-15T08:22:33.123Z" → unix seconds; "" when unparseable
  local s="$1"; s="${s%% [A-Z]*}"; s="$(printf '%s' "$s" | sed -E 's/\.[0-9]+//; s/T/ /; s/Z$/ +0000/')"
  [ -n "$s" ] || return 0
  date -u -d "$s" +%s 2>/dev/null || date -u -j -f '%Y-%m-%d %H:%M:%S %z' "$s" +%s 2>/dev/null || true
}
mtime_of() { stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null || true; }
ident_of() {   # the device and inode of the ENTRY itself (a link is not followed), `<dev>:<ino>`; nothing when it cannot be read or is not that shape
  local s; s="$(stat -c '%d:%i' -- "$1" 2>/dev/null || stat -f '%d:%i' "$1" 2>/dev/null || true)"
  if [[ "$s" =~ ^[0-9]+:[0-9]+$ ]]; then printf '%s' "$s"; fi
}
# canon — ONE spelling for one folder, however it was reached: git prints a worktree `C:/x`, `find` prints the same folder `/c/x`
# or, under MSYS's default temp root, `/tmp/x`. Where bash can say the Windows form (`pwd -W`: Git for Windows) every spelling
# resolves to it, lower-cased because Windows paths are case-blind; elsewhere it is the physical path. The drive form is
# folded BEFORE the cd because MSYS resolves `C:/x` and `/c/x` as different entries. The answer is left in CANON (no command
# substitution at the call site) and remembered per path in CANON_CACHE, so a path is resolved once per shell.
CANON=""; CANON_CACHE=$'\n'; ALPHA=ABCDEFGHIJKLMNOPQRSTUVWXYZ; alpha=abcdefghijklmnopqrstuvwxyz
canon() {
  local p="$1" q="$1" hit pre dl w x
  case "$CANON_CACHE" in *$'\n'"$p$U"*) hit="${CANON_CACHE#*$'\n'"$p$U"}"; CANON="${hit%%$'\n'*}"; return 0;; esac
  case "$q" in [A-Za-z]:/*) dl="${q:0:1}"; case "$dl" in [A-Z]) pre="${ALPHA%%$dl*}"; dl="${alpha:${#pre}:1}";; esac; q="/$dl${q:2}";; esac
  w="$(cd "$q" 2>/dev/null && { x="$(pwd -W 2>/dev/null)" && printf '%s' "$x" | lower || pwd -P; })" || w=""
  CANON="${w:-$q}"; CANON_CACHE="$CANON_CACHE$p$U$CANON"$'\n'
}
gitdir_of() {   # a folder holding a .git FILE is a linked worktree of SOME clone; a relative gitdir is relative to the worktree
  local g d
  if [ ! -f "$1/.git" ] || [ -L "$1/.git" ]; then return 0; fi   # the ONE read of a stranger's .git: only a regular file, never a link, a FIFO or a device; nothing printed = unreadable
  if [ "$BOUND" = none ] && { ! owned_by_me "$1" || ! owned_by_me "$1/.git"; }; then return 0; fi   # nothing can end this read, so right before it: the folder AND the file are this user's (a stranger cannot rename or replace inside a folder it does not own)
  g="$(bounded 5 sed -n 's/^gitdir: //p' "$1/.git" 2>/dev/null || true)"
  case "$g" in ""|/*|[A-Za-z]:/*) ;; *)
    g="$1/$g"   # a relative gitdir (a worktree made with relative paths) climbs out through the worktree itself ("<wt>/../<clone>/.git/…"). Once the worktree is removed that path no longer resolves on Linux, and git leaves the registration behind, so the PARENT is resolved now, while the worktree still exists
    d="$(cd "${g%/*}" 2>/dev/null && { pwd -W 2>/dev/null || pwd -P; })" && g="$d/${g##*/}";;
  esac
  printf '%s' "$g"
}
clone_of() {   # $1 = a worktree's admin dir <clone>/worktrees/<name> → the clone's git dir; nothing when it is not that shape
  case "$1" in */worktrees/?*) ;; *) return 0;; esac
  case "${1##*/worktrees/}" in */*|.|..) return 0;; esac   # one component, and not '.' or '..': <clone>/worktrees/.. would be the clone itself
  printf '%s' "${1%/worktrees/*}"
}
clone_ok() {   # a clone carried through a row: an absolute path with no control byte
  if has_ctl "$1"; then return 1; fi
  case "$1" in /?*|[A-Za-z]:/?*) return 0;; esac
  return 1
}
enter_dir() {   # cd -P into $1, the drive form folded first as canon() does; the caller's shell moves, so a caller that must stay put runs this in a subshell
  local q="$1" dl pre
  case "$q" in [A-Za-z]:/*) dl="${q:0:1}"; case "$dl" in [A-Z]) pre="${ALPHA%%$dl*}"; dl="${alpha:${#pre}:1}";; esac; q="/$dl${q:2}";; esac
  cd -P -- "$q" 2>/dev/null
}
here() { pwd -W 2>/dev/null || pwd -P; }   # the current directory, physical, in the spelling physical() gives
physical() {   # $1 = a path → its PHYSICAL form (every link resolved), nothing when it cannot be entered. No cache: it is asked again at the removal
  ( enter_dir "$1" && here ) || true
}
link_uid() { stat -c %u "$1" 2>/dev/null || stat -f %u "$1" 2>/dev/null || true; }   # the owner of a link ITSELF (stat does not follow it); nothing when unknown
untrusted_link() {   # $1 = an absolute path: is some component of it a symbolic link that neither this user nor root owns? Its owner can re-point it between the capture and the removal
  local rest p="" c u
  case "$1" in [A-Za-z]:/*) p="${1:0:2}"; rest="${1:3}";; *) rest="${1#/}";; esac
  while [ -n "$rest" ]; do
    c="${rest%%/*}"; if [ "$c" = "$rest" ]; then rest=""; else rest="${rest#*/}"; fi
    if [ -z "$c" ]; then continue; fi
    p="$p/$c"
    if [ -L "$p" ]; then
      u="$(link_uid "$p")"
      case "$u" in ""|*[!0-9]*) return 0;; esac   # an owner nobody can name is not this user
      if [ "$u" != "$MY_UID" ] && [ "$u" != 0 ]; then return 0; fi   # this user's or root's; compared as text, so nothing a stranger wrote reaches arithmetic
    fi
  done
  return 1
}
writable_by_others() {   # $1 = a directory: can its group or everyone write to it? An unknown mode counts as writable
  local m; m="$(stat -c %a "$1" 2>/dev/null || stat -f %Lp "$1" 2>/dev/null || true)"
  case "$m" in [0-7][0-7][0-7]|[0-7][0-7][0-7][0-7]) ;; *) return 0;; esac
  case "${m: -2:1}" in 2|3|6|7) return 0;; esac
  case "${m: -1}" in 2|3|6|7) return 0;; esac
  return 1
}
clone_sound() {   # $1 = a PHYSICAL clone path (or `.` inside it), $2 = what the seam is told it is: a real directory, mine, closed to group and world, and git can read every worktree entry in it. Returns 3 when it is writable by others
  if [ ! -d "$1" ] || [ -L "$1" ]; then return 1; fi
  if [ "${JANITOR_TEST_OWNER_CHECK:-}" = foreign-clone ] || ! owned_by_me "$1" "${2:-$1}"; then return 1; fi   # seam foreign-clone: every clone, and nothing else, is someone else's
  if writable_by_others "$1" || writable_by_others "$1/worktrees"; then return 3; fi
  unreadable_locks "$1" 2>/dev/null
}
RC_CACHE=$'\n'; RC_CLONE=""; RC_WHY="-"
resolve_clone() {   # $1 = the admin dir a stranger's .git names. Sets RC_CLONE (the clone's PHYSICAL path, "" when it cannot be trusted) and RC_WHY (the owner text that says why not). Asked once per clone per run: the answer is remembered by the clone's path as the stranger wrote it. Called without $(...) so the memory survives
  local t p rc=0 hit
  t="$(clone_of "$1")"
  RC_CLONE=""; RC_WHY="-"
  if [ -z "$t" ] || has_ctl "$t"; then RC_WHY="-malformed-gitdir"; return 0; fi
  case "$RC_CACHE" in *$'\n'"$t$U"*) hit="${RC_CACHE#*$'\n'"$t$U"}"; hit="${hit%%$'\n'*}"; RC_CLONE="${hit%%$U*}"; RC_WHY="${hit#*$U}"; return 0;; esac
  if ! untrusted_link "$t"; then
    p="$(physical "$t")"
    if [ -n "$p" ] && clone_ok "$p"; then
      clone_sound "$p" || rc=$?
      if [ "$rc" = 0 ]; then RC_CLONE="$p"; RC_WHY=""; elif [ "$rc" = 3 ]; then RC_WHY="-group-or-world-writable"; fi
    fi
  fi
  RC_CACHE="$RC_CACHE$t$U$RC_CLONE$U$RC_WHY"$'\n'
}
pin_clone() {   # $1 = the captured physical clone, $2 = the admin dir as captured. Run in a SUBSHELL: it enters the clone and leaves the shell standing in it, so what the caller then runs works on THAT directory, whatever the path is renamed to
  PINNED=1
  enter_dir "$1" || return 1
  if [ "$(here)" != "$1" ]; then return 1; fi   # the path still names the directory just entered
  if ! clone_sound . "$1"; then return 1; fi   # mine, closed to group and world, every entry readable by git: judged on the directory itself, not on a path
  if [ "$(physical "$(clone_of "$2")")" != "$1" ]; then return 1; fi   # the stranger's route still ends where it ended
  if untrusted_link "$(clone_of "$2")"; then return 1; fi
  return 0
}
volume_created() {   # $1 = captured volume names, one per line → "name<TAB>CreatedAt" for each that still exists; 1 on a real docker failure
  local batch one n
  if batch="$(printf '%s\n' "$1" | xargs docker volume inspect --format '{{.Name}}\t{{.CreatedAt}}' 2>/dev/null)"; then printf '%s\n' "$batch"; return 0; fi
  # the batch failed — most likely ONE volume vanished between `ls` and here, and docker refuses the whole call. Ask per name:
  # a missing volume is simply absent from the answer (the caller reports it); any other failure is a failed listing.
  while IFS= read -r n; do
    [ -n "$n" ] || continue
    if one="$(docker volume inspect --format '{{.Name}}\t{{.CreatedAt}}' "$n" 2>&1)"; then printf '%s\n' "$one"
    elif ! printf '%s\n' "$one" | grep -qi 'no such volume'; then echo "janitor: docker volume inspect failed: $(clean "$(printf '%s\n' "$one" | head -n 1)")" >&2; return 1; fi
  done <<< "$1"
}
# A docker label or name is text a stranger wrote, and docker prints it raw: a newline in it would end the record, and the rest would
# read as a record of its own — a forged row naming any id. So every template asks for the text through Go's `%q`, which prints it as
# ONE quoted line with its control characters escaped; uq() takes the quotes off (a value that is not quoted is left as it is). A
# container or network id must then be lower-case hex — anything else is dropped with a notice, never acted on.
LBL='{{printf "%q" (.Label "testsToDelete.owner")}}'
UQ='function uq(s) { if (s ~ /^".*"$/) s = substr(s, 2, length(s) - 2); return s } function idok(k, i, n,   s) { if (i ~ /^[0-9a-f]+$/) return 1; s = i; gsub(/[^ -~]/, "?", s); print "notice: " k " " n " — id " s " is not a docker id, ignored" > "/dev/stderr"; return 0 } '
ctlclean() { printf '%s' "$1" | LC_ALL=C tr '\000-\037\177' '?'; }   # every control byte, the field separator included, becomes '?'
has_ctl() { case "$1" in *[[:cntrl:]]*) return 0;; esac; return 1; }
row() {   # kind id name owner created [clone [admin dir [identity or tip]]] → one captured row, with the name's form and owner: kind id name owner created clone adm form nameowner ident. An id, a name, an owner or a clone path is text a stranger wrote: a newline or \x1f in it would forge or shift a row. One with a control byte becomes an `unsafe` row (named, refused), never a candidate
  local leaf
  if has_ctl "$2$3$4${6:-}${7:-}${8:-}"; then set -- unsafe "$(ctlclean "$2")" "$(ctlclean "$3")" "" ""; fi
  case "$1" in branch|container|volume|network) leaf="$3";; *) leaf="${3##*/}";; esac   # a path's leaf; the other kinds are names as they are
  name_form "$leaf"
  printf '%s\n' "$1$U$2$U$3$U$(ctlclean "$4")$U$5$U${6:-}$U${7:-}$U$NF_FORM$U$NF_OWNER$U${8:-}"
}
tag() {   # stdin: rows `kind U id U name U owner U created [U ident]` from a lister → rows with every column (the lister could not know the form)
  local k i n o c d
  while IFS="$U" read -r k i n o c d; do row "$k" "$i" "$n" "$o" "$c" "" "" "$d"; done
}
capture() {   # ONE line per prefixed resource of EVERY owner ("-" = an owner nobody can read; another owner's name is never entered or read). A failing listing fails the run.
  dk ps -a --format '{{.ID}}\t{{printf "%q" .Names}}\t'"$LBL"'\t{{.CreatedAt}}' | awk -F'\t' -v OFS="$U" -v rx="^$RX" "$UQ"'{ n = uq($2); if (tolower(n) !~ rx) next; if (!idok("container", $1, n)) next; print "container", $1, n, uq($3), $4 }' | tag || return 1
  local vols created
  vols="$(dk volume ls --format '{{printf "%q" .Name}}\t'"$LBL" | awk -F'\t' -v rx="^$RX" "$UQ"'{ n = uq($1); if (tolower(n) ~ rx) print n "\t" $2 }')" || return 1
  if [ -n "$vols" ]; then   # one inspect for all captured volumes, not one per volume
    created="$(volume_created "$(printf '%s\n' "$vols" | cut -f1)")" || return 1
    # one linear pass: the name→CreatedAt map first (C lines), then every listed volume (V lines); one that is not in the map vanished
    { printf '%s\n' "$created" | sed -n "s/^/C$TAB/p"; printf '%s\n' "$vols" | sed -n "s/^/V$TAB/p"; } |
      awk -F'\t' -v OFS="$U" "$UQ"'$1=="C"{c[$2]=$3; next} $1=="V"{ $3 = uq($3); gsub(/[[:cntrl:]]/, "?", $3); if ($2 in c) print "volume",$2,$2,$3,c[$2]; else print "notice: volume " $2 " — vanished after the capture" > "/dev/stderr" }' | tag
  fi
  dk network ls --format '{{.ID}}\t{{printf "%q" .Name}}\t'"$LBL"'\t{{.CreatedAt}}' | awk -F'\t' -v OFS="$U" -v rx="^$RX" "$UQ"'{ n = uq($2); if (tolower(n) !~ rx) next; if (!idok("network", $1, n)) next; print "network", $1, n, uq($3), $4 }' | tag || return 1
  local wts top swept swept_rc=0; wts="$(git worktree list --porcelain)" || return 1
  canon "$(git rev-parse --show-toplevel)"; top="$CANON"   # the clone this runs from and the MAIN checkout are never candidates, nor is a folder holding either
  # the swept clone is judged like any clone, ONCE: the caller's own, closed to group and world, every worktree entry readable by git. A worktree registered in one that is not is kept
  swept="$(physical "$(git rev-parse --git-common-dir)")"
  if [ -n "$swept" ] && clone_ok "$swept"; then clone_sound "$swept" || swept_rc=$?; else swept_rc=1; fi
  # a registered worktree: the first block is the MAIN worktree (never a candidate); a path with a control byte becomes an `unsafe` row; the one the janitor runs from becomes a `self` row. Its lock is NOT read here: it is read below like any claim
  printf '%s\n' "$wts" | awk -v OFS="$U" '
    function emit(   q) { if (p != "" && n > 1) { q = p; if (q ~ /[[:cntrl:]]/) { gsub(/[[:cntrl:]]/, "?", q); print "unsafe", q, q, "", "" } else print "wt-git", p, p, "", "" } }
    /^worktree /{ emit(); p = substr($0, 10); n++ }
    END { emit() }' | awk -F"$U" -v rx="/${RX}[^/]*\$" 'tolower($3) ~ rx' | while IFS="$U" read -r k id name owner created; do
      ident=""; g=""; a=""; gc=""
      if [ "$k" = wt-git ]; then
        canon "$id"; if [ "$CANON" = "$top" ]; then row self "$id" "$id" "" ""; continue; fi
        name_form "${id##*/}"
        if [ "$NF_FORM" != owner ] || [ "$NF_OWNER" = "$ME_OWNER" ]; then   # another owner's registration is never entered or measured
          if [ -d "$id" ]; then
            ident="$(ident_of "$id")"
            if ! entry_mine "$id"; then owner="-foreign-entry"   # a folder another user owns under a name of this user's scope: foreign
            elif [ "$swept_rc" = 3 ]; then owner="-group-or-world-writable"
            elif [ "$swept_rc" != 0 ]; then owner="-"
            elif [ "$BOUND" = none ] && ! owned_by_me "$id/.git"; then owner="-unbounded"; note_unbounded
            else
              g="$(gitdir_of "$id")"; gc=""   # the lock is judged through the worktree's own .git file, as for any worktree, and must lie in the swept clone
              if [ -n "$g" ]; then gc="$(clone_of "$g")"; fi
              if [ -z "$g" ] || [ ! -d "$g" ]; then owner="-"
              elif [ -z "$gc" ] || [ "$(physical "$gc")" != "$swept" ]; then owner="-malformed-gitdir"
              else a="$g"; if [ -e "$g/locked" ]; then read_claim "$g/locked"; owner="$O"; fi; fi
            fi
          fi
        fi
      fi
      row "$k" "$id" "$name" "$owner" "$created" "" "$a" "$ident"
    done
  local mine=$'\n' main="" wp c   # this repo's trees, canonical, one per line: not captured twice from the temp root; the first is the MAIN checkout
  while IFS= read -r wp; do canon "$wp"; mine="$mine$CANON"$'\n'; if [ -z "$main" ]; then main="$CANON"; fi; done <<< "$(printf '%s\n' "$wts" | sed -n 's/^worktree //p')"
  git for-each-ref --format='%(refname:short)%09%(objectname)' refs/heads | awk -F'\t' -v OFS="$U" -v rx="^$RX" 'tolower($1) ~ rx {print "branch",$1,$1,"","",$2}' | tag || return 1   # a branch has no owner record: it goes by its name's owner and its captured tip
  # -H: a TMPDIR that is itself a symlink (macOS: /tmp) is followed; -print0: a name may hold a newline
  find -H "$T" -mindepth 1 -maxdepth 1 -type d -iname "$GLOB" -print0 | while IFS= read -r -d '' d; do
    if has_ctl "$d"; then row folder "$d" "$d" "" ""; continue; fi
    name_form "${d##*/}"
    if [ "$NF_FORM" = owner ] && [ "$NF_OWNER" != "$ME_OWNER" ]; then   # another owner's: listed, never entered or read — so before canon, which would cd into it. Its place is spelled from its PARENT, which is the temp root
      canon "$T"; c="$CANON/${d##*/}"; if [ "$OS" = windows ]; then c="$CANON/$(printf '%s' "${d##*/}" | lower)"; fi
      case "$top/" in "$c/"*) continue;; esac
      case "$main/" in "$c/"*) continue;; esac
      if [ -f "$d/.git" ]; then   # a stat of the entry, never a read
        case "$mine" in *$'\n'"$c"$'\n'*) continue;; esac
        row wt-dir "$d" "$d" "" ""
      else row folder "$d" "$d" "" ""; fi
      continue
    fi
    canon "$d"; c="$CANON"   # once per candidate
    case "$top/" in "$c/"*) continue;; esac
    case "$main/" in "$c/"*) continue;; esac
    if [ -f "$d/.git" ]; then
      case "$mine" in *$'\n'"$c"$'\n'*) continue;; esac
      g=""; o=""; k=""; a=""
      if [ "$ROOT_OK" = 0 ]; then o="-unsafe-root"; note_unsafe_root   # a temp root that is neither sticky nor this user's lets a stranger replace any folder in it: nothing in it is trusted
      elif ! entry_mine "$d"; then o="-foreign-entry"   # a worktree FOLDER whose own owner is another user can be swapped for a link to a real worktree after the capture, and `git worktree remove` would delete THAT: never touched, whatever else can be read
      elif [ "$BOUND" = none ] && ! owned_by_me "$d/.git"; then o="-unbounded"; note_unbounded   # nothing can end a read of a file another user owns: kept, named
      else
        g="$(gitdir_of "$d")"
        if [ -z "$g" ] || [ ! -d "$g" ]; then o="-"   # not readable, not a directory, or not enterable (permission denied): a foreign clone, kept
        else   # the clone is resolved ONCE, here, to its physical path, and carried to the removal. It must be a clone this user owns, closed to group and world, with entries git can read; otherwise the owner says why not: kept, named
          resolve_clone "$g"; k="$RC_CLONE"
          if [ -z "$k" ]; then o="$RC_WHY"
          else a="$g"; if [ -e "$g/locked" ]; then read_claim "$g/locked"; o="$O"; fi; fi
        fi
      fi
      row wt-dir "$d" "$d" "$o" "$(mtime_of "$d")" "$k" "$a" "$(ident_of "$d")"
    else
      o=""
      if [ "$ROOT_OK" = 0 ]; then o="-unsafe-root"; note_unsafe_root
      elif ! entry_mine "$d"; then o="-foreign-entry"   # a folder another user owns under a name of this user's scope (or a link, or no directory at all): foreign, whatever its claim says
      elif [ -e "$d.owner" ] || [ -L "$d.owner" ]; then read_claim "$d.owner"; o="$O"; fi
      row folder "$d" "$d" "$o" "$(mtime_of "$d")" "" "" "$(ident_of "$d")"
    fi
  done
  find -H "$T" -mindepth 1 -maxdepth 1 -type f -iname "$GLOB.owner" -print0 | while IFS= read -r -d '' f; do
    if has_ctl "$f"; then row marker "$f" "$f" "" ""; continue; fi
    if [ ! -d "${f%.owner}" ]; then
      name_form "${f##*/}"
      if [ "$NF_FORM" = owner ] && [ "$NF_OWNER" != "$ME_OWNER" ]; then row marker "$f" "$f" "" ""; continue; fi   # another owner's claim: listed, never opened
      read_claim "$f"; o="$O"; row marker "$f" "$f" "$o" "$(mtime_of "$f")" "" "" "$(ident_of "$f")"
    fi
  done
}
unreadable_locks() {   # $1 = a clone's git dir. git itself reads <clone>/worktrees/<name>/gitdir and /locked and blocks forever on a FIFO planted in either, so one that is not a regular file refuses BEFORE any git call on that clone
  local l bad=0 had=0; if shopt -q dotglob; then had=1; fi; shopt -s dotglob   # git reads every entry of worktrees/, a hidden one included
  for l in "$1"/worktrees/*/locked "$1"/worktrees/*/gitdir; do
    if { [ -e "$l" ] || [ -L "$l" ]; } && { [ ! -f "$l" ] || [ -L "$l" ]; }; then echo "janitor: $(clean "$l") is not a regular file — git would block reading it; nothing was removed" >&2; bad=1; break; fi
  done
  if [ "$had" = 0 ]; then shopt -u dotglob; fi
  return "$bad"
}
unreadable_locks "$(git rev-parse --git-common-dir)" || exit 1
ROOT_OK=1; if ! shared_dir_ok "$T"; then ROOT_OK=0; fi   # judged once: the temp root is sticky, or this user's own
rename_onto() {   # rename(2) of directory $1 onto $2: it replaces only an EMPTY directory (ENOTEMPTY otherwise), and in a sticky root never another user's entry. GNU mv -T is exactly that; perl's rename is the same call where mv has no -T
  if mv -T -- "$1" "$2" 2>/dev/null; then return 0; fi
  perl -e 'rename($ARGV[0], $ARGV[1]) or exit 1' -- "$1" "$2" 2>/dev/null
}
restore_dir() {   # $1 = a quarantine, $2 = the name it had. An exclusive mkdir (mode 700: only this user can enter the reservation) reserves the name, then the quarantine is renamed onto that EMPTY directory: a name another process populated in between fails, and nothing is ever overwritten. Windows refuses a rename onto an existing directory: there a restore is a notice, never a delete. 0 = restored
  if [ "$OS" = windows ]; then return 1; fi
  mkdir -m 700 -- "$2" 2>/dev/null || return 1
  if rename_onto "$1" "$2"; then return 0; fi
  if entry_mine "$2" && [ -z "$(shopt -s dotglob nullglob; for f in "$2"/*; do echo x; break; done)" ]; then rmdir -- "$2" 2>/dev/null || true; fi   # the placeholder this made, only while it is still a real directory of this user's AND empty: a name taken over in between is never touched
  return 1
}
ctime_of() { stat -c %Z -- "$1" 2>/dev/null || stat -f %c "$1" 2>/dev/null || true; }   # the inode change time (a rename sets it): when the quarantine was made, as far as the kernel says
restore_quarantines() {   # the FIRST step of every run, before the capture: a quarantine this user's killed run left is put back under its name when that is free, and listed (a notice) when it is not
  local q leaf orig qpid had=0 lv qc qm
  if [ "$ROOT_OK" = 0 ]; then return 0; fi   # in a root a stranger can write to, nothing is renamed
  if shopt -q nocasematch; then had=1; fi; shopt -s nocasematch
  while IFS= read -r -d '' q; do
    if has_ctl "$q"; then continue; fi
    leaf="${q##*/}"
    [[ "$leaf" =~ ^\.(.+)\.teststodelete-quarantine-([0-9]+)-([0-9a-f]+)$ ]] || continue
    orig="$T/${BASH_REMATCH[1]}"; qpid="${BASH_REMATCH[2]}"
    name_form "${orig##*/}"
    case "$NF_FORM" in
      owner) if [ "$NF_OWNER" != "$ME_OWNER" ]; then continue; fi;;   # another user's: not this janitor's to put back
      legacy) ;;   # a name from before the owner segment can have been quarantined too (a legacy row whose old-grammar record was gone): put back like any other, by the same checks
      *) continue;;
    esac
    if ! entry_mine "$q"; then continue; fi   # a real directory this user owns, never a link, never a stranger's
    if ! pid_ok "$qpid"; then continue; fi
    liveness "$qpid" && lv=0 || lv=$?
    if [ "$lv" != 1 ]; then continue; fi   # its renamer may still be working: only "no process" puts it back
    qc="$(ctime_of "$q")"; qm="$(mtime_of "$q")"   # ... and not YET: a janitor in another pid namespace (a container that shares this temp root) has a pid this one cannot see. Its quarantine is as young as its rename (ctime) or its last deletion (mtime): both must be past the window
    case "$qc" in ""|*[!0-9]*) continue;; esac
    case "$qm" in ""|*[!0-9]*) continue;; esac
    if [ $(( NOW - qc )) -lt "$MIN_AGE" ] || [ $(( NOW - qm )) -lt "$MIN_AGE" ]; then continue; fi
    if [ "$DRY" = 1 ]; then echo "would run: $(clean "mv -- $q $orig")"; continue; fi
    if restore_dir "$q" "$orig"; then echo "notice: $(clean "$leaf") — restored as $(clean "${orig##*/}"); a run that was killed after the rename left it" >&2
    else echo "notice: $(clean "$leaf") — kept: its name $(clean "${orig##*/}") is taken or the rename cannot be made here; nothing was overwritten" >&2; fi
  done < <(find -H "$T" -mindepth 1 -maxdepth 1 -type d -name '.*' -print0 2>/dev/null)
  if [ "$had" = 0 ]; then shopt -u nocasematch; fi
}
restore_quarantines
echo "janitor: looking for testsToDelete resources…" >&2   # progress: the capture can take a while on a busy machine
CAPTURED="$(capture)" || { echo "janitor: a listing failed — nothing was removed" >&2; exit 1; }
case "$CAPTURED" in "unbounded$U"*|*$'\n'"unbounded$U"*) echo "janitor: neither timeout nor perl is installed — a read of a file another user owns could block forever, so such entries are only reported (named, kept), never read" >&2;; esac
case "$CAPTURED" in "unsafe-root$U"*|*$'\n'"unsafe-root$U"*) echo "janitor: the temp root $(clean "$T") is neither sticky nor owned by this user — a stranger there could replace a folder after the capture, so folders and worktree folders in it are kept" >&2;; esac
SKIPPED=0; DEL=""
skip() { SKIPPED=1; echo "skipped: $(clean "$1") $(clean "$2") — $(clean "$3")" >&2; }   # names and owners come from places any local user can write. Only the caller's own scope is ever skipped: it sets the exit code
kw() { case "$1" in wt-dir|wt-git|self) printf 'worktree';; *) printf '%s' "$1";; esac; }   # the kind as a person reads it
say_foreign() { printf '%s\n' "foreign: $(clean "$(kw "$1")") $(clean "$2") — owner $(clean "$3")" >&2; }   # another owner's resource, or an entry this user does not own: listed, never touched, never an exit code
say_unmarked() { printf '%s\n' "unmarked: $(clean "$(kw "$1")") $(clean "$2")" >&2; }   # an owner-form resource with no record: nobody's the helper knows
legacy_cmd() {   # $1 = kind, $2 = id, $3 = name or path, $4 = the clone → the exact command a person would run, printable ASCII only (names went through clean())
  local p
  case "$1" in
    container) printf 'docker rm -f -v %s' "$2";;   # an id is lower-case hex by now
    network) printf 'docker network rm %s' "$2";;
    volume) printf 'docker volume rm %s' "$(printf '%q' "$(clean "$3")")";;
    branch) printf 'git branch -D %s' "$(printf '%q' "$(clean "$3")")";;
    folder) p="$(clean "$3")"; printf 'rm -rf -- %s %s' "$(printf '%q' "$p")" "$(printf '%q' "$p.owner")";;
    marker) printf 'rm -f -- %s' "$(printf '%q' "$(clean "$3")")";;
    wt-dir|wt-git) if [ -n "$4" ]; then printf 'git --git-dir=%s worktree remove --force --force %s' "$(printf '%q' "$(clean "$4")")" "$(printf '%q' "$(clean "$3")")"; else printf 'git worktree remove --force --force %s' "$(printf '%q' "$(clean "$3")")"; fi;;
    *) printf 'inspect it by hand';;
  esac
}
say_legacy() { printf '%s\n' "legacy: $(clean "$(kw "$1")") $(clean "$2") — remove with: $(legacy_cmd "$1" "$3" "$4" "$5")" >&2; }   # kind, leaf, id, path, clone: a name from before the owner segment, listed with its command
owner_why() { case "$1" in -unsafe-root) printf ' — the temp root is not trusted';; esac; }   # what an owner marker of ours means, for a person
safe_id() {   # a folder, worktree or claim is removed only when it is exactly ONE component below the temp root, and holds no control byte
  local rest
  case "$1" in "$T"/?*) rest="${1#"$T"/}";; *) return 1;; esac
  case "$rest" in */*) return 1;; esac
  if has_ctl "$1"; then return 1; fi
  return 0
}
RS=skip; RS_WHY=""; RS_OWNER=""; R_OWNER=""; R_HOST=""; R_PID=""; R_NS=""
judge_record() {   # $1 = the record text, $2 = merged | legacy (the grammar of the name's day), $3 = the name's owner. Sets RS: gone | skip | foreign | keep, RS_WHY (the words after "<kind> <name> — ") and RS_OWNER (the record's owner). Rule §3's order; only "no process with that pid" is gone
  local t="$1" p lv
  RS=skip; RS_WHY=""; RS_OWNER=""
  if [ "$2" = legacy ]; then
    if [ "$OS" = linux ]; then RS=keep; return 0; fi   # a legacy record has no pid namespace, and a Linux reader requires one: it is never `gone` there (owned.mjs legacyOwnerState)
    if ! legacy_owner_ok "$t"; then RS_WHY="owner '$t' is unreadable"; return 0; fi
    R_HOST="${t%%:*}"; R_PID="${t#*:}"; R_PID="${R_PID%%:*}"; R_NS=""
  else
    if ! owner_ok "$t"; then RS_WHY="owner '$t' is unreadable$(owner_why "$t")"; return 0; fi   # validated BEFORE any liveness question
    parse_record "$t"; RS_OWNER="$R_OWNER"
    if ! scope_ok "$3" "$R_OWNER" "$ME_OWNER" 1; then RS=foreign; return 0; fi   # the record's owner is not the name's, or not the caller's: another scope (a forged name or record keeps the resource and says whose it claims to be)
  fi
  if [ "$(printf '%s' "$R_HOST" | lower)" != "$(printf '%s' "$me" | lower)" ]; then RS_WHY="belongs to $R_HOST, not this host"; return 0; fi
  if [ "$2" = merged ] && ! ns_ok "$OS" "$R_NS" "$MY_NS"; then RS_WHY="liveness unknown for process $R_PID — the record names no pid namespace, or another one than this reader's"; return 0; fi
  p="$R_PID"
  if ! pid_ok "$p"; then RS_WHY="liveness unknown for process $p — not a process id"; return 0; fi   # grammar-valid, but no process can have it: never asked, never gone
  if [ "$OS" = windows ] && [ "$p" = 1 ]; then RS_WHY="liveness unknown for process 1 — Windows has no pid 1; a bash started by a native process reports it"; return 0; fi
  liveness "$p" && lv=0 || lv=$?
  if [ "$lv" = 0 ]; then RS_WHY="owned by live process $p — a run is in flight"; return 0; fi
  if [ "$lv" != 1 ]; then RS_WHY="liveness unknown for process $p — the query failed or was refused"; return 0; fi
  RS=gone
}
while IFS="$U" read -r kind id name owner created clone adm form nown ident; do
  [ -n "$id" ] || continue
  leaf="${name##*/}"; case "$kind" in branch|container|volume|network) leaf="$name";; esac
  if [ "$kind" = unsafe ]; then   # a control character in a name or a claim: refused. Another owner's name is only listed
    if [ "$form" = owner ] && [ "$nown" = "$ME_OWNER" ]; then skip folder "$name" "its name or its claim holds a control character — refused"   # this user's scope: refused, and it sets the exit code
    elif [ "$form" = owner ]; then say_foreign entry "$leaf" "$nown"
    else say_legacy entry "$leaf" "" "$name" ""; fi   # a name from before the owner segment (or no name form at all): listed, never an exit code
    continue
  fi
  if [ "$form" = owner ] && [ "$nown" != "$ME_OWNER" ]; then say_foreign "$kind" "$leaf" "$nown"; continue; fi   # another owner's: whatever its age, whatever its claim says, it is not this user's to judge
  case "$kind" in
    container|network|volume) e="$(epoch_of "$created")";;
    wt-git|self) e="$(mtime_of "$id")"; [ -n "$e" ] || e=0;;   # a registration whose folder is gone has no age: it is old, and then listed and kept below
    branch) e=0;;   # a branch has no age and no record: the branch pass decides, by the worktree it was checked out in
    *) e="$created";;
  esac
  case "$e" in ''|*[!0-9]*) continue;; esac   # an age that is not digits is no age: left alone, and never reaches arithmetic
  if [ $(( NOW - e )) -lt "$MIN_AGE" ]; then continue; fi   # young: left alone, silently
  if [ "$kind" = self ]; then   # old enough to be a candidate, and it is the tree this runs from: named, never removed
    if [ "$form" = owner ]; then skip worktree "$name" "the janitor runs from it"   # this user's scope: it sets the exit code
    else echo "notice: worktree $(clean "$leaf") — the janitor runs from it; kept (a name from before the owner segment is only listed)" >&2; fi   # a legacy name: a listed line, never an exit code
    continue
  fi
  if [ "$kind" = wt-git ] && [ ! -d "$id" ]; then echo "notice: worktree $(clean "$leaf") — its folder is gone; the registration is kept (nothing here prunes: git worktree prune is the caller's call)" >&2; continue; fi
  case "$kind" in folder|wt-dir|marker) if ! safe_id "$id"; then skip "$kind" "$name" "not exactly one component below the temp root"; continue; fi;; esac
  if [ "$form" != owner ]; then   # a LEGACY name (from before the owner segment): collected only where this user owns it and its old-grammar record is gone; a daemon's object is never collected
    case "$kind" in container|network|volume|branch) say_legacy "$kind" "$leaf" "$id" "$name" ""; continue;; esac
    case "$owner" in ""|-*) say_legacy "$kind" "$leaf" "$id" "$name" "$clone"; continue;; esac   # no record, an unreadable one, a stranger's, or an entry this user does not own
    judge_record "$owner" legacy ""
    if [ "$RS" != gone ]; then say_legacy "$kind" "$leaf" "$id" "$name" "$clone"; continue; fi
  elif [ "$kind" != branch ]; then
    case "$owner" in
      -foreign-entry|-foreign-claim) say_foreign "$kind" "$leaf" "$nown"; continue;;   # the entry, or its claim, is another user's under a name of this scope: forged, kept
      "") say_unmarked "$kind" "$leaf"; continue;;   # no record at all: never judged, never collected, however old
    esac
    judge_record "$owner" merged "$nown"
    case "$RS" in
      foreign) say_foreign "$kind" "$leaf" "$RS_OWNER"; continue;;
      skip) skip "$kind" "$name" "$RS_WHY"; continue;;
    esac
  fi
  if [ "$kind" = wt-dir ] && { ! clone_ok "$clone" || ! clone_ok "$adm"; }; then skip wt-dir "$name" "the clone path carried with it is malformed (not an absolute path, or it holds a control byte) — kept"; continue; fi   # the removal uses the captured clone and nothing else
  case "$kind" in
    folder|marker|wt-dir) if [ -z "$ident" ]; then skip "$kind" "$name" "its device and inode cannot be read — kept"; continue; fi;;   # nothing to re-check the removal against
    branch) if ! [[ "$ident" =~ ^[0-9a-f]{40,64}$ ]]; then skip branch "$name" "its tip cannot be read — kept"; continue; fi;;
    volume) ident="$created";;   # a volume has no id: what identifies it at the removal is its creation time and its label (re-inspected just before)
  esac
  lk=0; if [ -n "$owner" ]; then lk=1; fi   # locked when the capture found a lock (a valid owner here is a dead lock owner)
  DEL="$DEL$kind$U$id$U$name$U$clone$U$adm$U$lk$U$ident$U$owner"$'\n'
done <<< "$CAPTURED"
act() { if [ "$DRY" = 1 ]; then echo "would run: $(clean "$*")"; else "$@" 2>/dev/null; fi; }   # stdout, so a person can pipe it; only the REAL command is silenced
# A deletion is never fatal. A target that vanished after the capture is a notice; one that is still there after a
# failed removal is skipped like a live one (named, exit 3). Only a failed LISTING ends the run (above).
git_run() {   # $1 = the git dir (`.` inside a pinned clone), then the git arguments: bounded, in git's own clean environment (a stray GIT_DIR, GIT_WORK_TREE, GIT_INDEX_FILE or GIT_COMMON_DIR cannot change what it does)
  local gd="$1"; shift
  bounded 60 env -u GIT_COMMON_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE -u GIT_DIR git --git-dir="$gd" "$@" 2>/dev/null
}
timed_out() { [ "$1" = 124 ] || [ "$1" = 142 ]; }   # timeout's own status, and SIGALRM from perl's alarm (128 + 14)
step_note() { echo "notice: git $1 failed for $(clean "$2") (exit $3$(if timed_out "$3"; then echo ', timed out'; fi))" >&2; }   # git's own stderr stays suppressed; this line is ours
vanished() { echo "notice: $(clean "$1") $(clean "$2") — vanished after the capture" >&2; }
removed() { if [ "$DRY" = 0 ]; then printf 'janitor: removed %s %q\n' "$1" "$(clean "$2")" >&2; fi; return 0; }   # progress, one line per REAL removal; the name goes through clean() like every other captured text (no escape or line end reaches the terminal) and then through %q (a quote or a space inside it cannot pass for text of the line). A dry run says "would run:" instead
act_rm() { local k="$1" n="$2"; shift 2; act "$@" && removed "$k" "$n"; }   # act, and announce the removal only when the command succeeded
settle() { local k="$1" n="$2"; shift 2; if "$@" >/dev/null 2>&1; then skip "$k" "$n" "could not be removed"; else vanished "$k" "$n"; fi; }   # $3… = "still there?" test
WT_GONE=$'\n'   # the worktrees this run removed (a dry run: would remove) because their owner was gone, canonical, one per line
EXIT_CLONE_CHANGED=97; EXIT_GIT_STEP_FAILED=98
claim_text() { if [ -e "$1" ] || [ -L "$1" ]; then claim_of "$1" || true; fi; }   # the claim in file $1 as the capture read it ("" when there is none)
folder_change() {   # $1 = a folder (the captured one, or its quarantine), $2 = its captured device:inode, $3 = its captured claim text, $4 = the claim file → in words, what changed since the capture; nothing when nothing did
  if [ -L "$1" ]; then echo "it is now a link"; return 0; fi
  if [ ! -d "$1" ]; then echo "it is no longer a directory"; return 0; fi
  if ! entry_mine "$1"; then echo "its own owner is no longer this user"; return 0; fi
  if [ "$(ident_of "$1")" != "$2" ]; then echo "it is no longer the folder that was captured (device or inode changed)"; return 0; fi
  if [ "$(claim_text "$4")" != "$3" ]; then echo "its claim changed"; return 0; fi
}
entry_change() {   # $1 = a captured worktree folder, $2 = its captured device:inode ("" when it had no folder), $3 = wt-dir | wt-git → what changed about it since the capture, in words; nothing when nothing did
  if [ -z "$2" ]; then if [ -e "$1" ] || [ -L "$1" ]; then echo "it did not exist at the capture"; fi; return 0; fi   # a registration whose folder was already gone: nothing to re-check
  if [ -L "$1" ]; then echo "it is now a link"; return 0; fi
  if [ ! -d "$1" ]; then echo "it is no longer a directory"; return 0; fi
  if ! entry_mine "$1"; then echo "its own owner is no longer this user"; return 0; fi
  if [ "$(ident_of "$1")" != "$2" ]; then echo "it is no longer the folder that was captured (device or inode changed)"; return 0; fi
  if [ "$3" = wt-dir ] && { [ ! -f "$1/.git" ] || [ -L "$1/.git" ]; }; then echo "its .git is no longer a regular file"; return 0; fi
}
volume_state() {   # $1 = a volume's name, $2 = its captured CreatedAt, $3 = its captured label → 0 when the volume is still that one (same creation time, same label), 1 when it changed, 2 when it is gone or docker cannot say
  local out ct lb
  out="$(dk volume inspect --format '{{.CreatedAt}}'"$TAB"'{{printf "%q" (index .Labels "testsToDelete.owner")}}' "$1" 2>/dev/null)" || return 2
  ct="${out%%"$TAB"*}"; lb="${out#*"$TAB"}"
  if [[ "$lb" =~ ^\".*\"$ ]]; then lb="${lb#\"}"; lb="${lb%\"}"; fi   # the quotes Go's %q put around the label
  if [ "$ct" = "$2" ] && [ "$(ctlclean "$lb")" = "$3" ]; then return 0; fi
  return 1
}
quarantine_name() { printf '%s/.%s.teststodelete-quarantine-%s-%s' "${1%/*}" "${1##*/}" "$$" "$(printf '%04x%04x' "$RANDOM" "$RANDOM")"; }   # the sibling of $1: same parent (atomic, never across a file system), a leading '.' (no prefix match reaches it)
remove_folder() {   # $1 = the folder, $2 = its name, $3 = captured device:inode, $4 = captured claim text. Re-checked, renamed into quarantine, checked AGAIN there (a mismatch is renamed back and skipped), then removed; the claim goes last
  local d="$1" q why rc=0
  if [ "$DRY" = 1 ]; then
    q="$(quarantine_name "$d")"
    echo "would run: $(clean "mv -- $d $q")"; echo "would run: $(clean "rm -rf -- $q")"
    if [ -e "$d.owner" ]; then echo "would run: $(clean "rm -f -- $d.owner")"; fi
    return 0
  fi
  if [ ! -e "$d" ] && [ ! -L "$d" ]; then vanished folder "$d"; return 0; fi
  why="$(folder_change "$d" "$3" "$4" "$d.owner")"
  if [ -n "$why" ]; then skip folder "$2" "changed after the capture — $why"; return 0; fi
  q="$(quarantine_name "$d")"
  if [ -e "$q" ] || [ -L "$q" ]; then skip folder "$2" "its quarantine name is taken — kept"; return 0; fi
  rename_onto "$d" "$q" || rc=$?   # never `mv d q` alone: were q a directory by now, that would move d INTO it
  if [ "$rc" != 0 ]; then skip folder "$2" "could not be renamed into quarantine — kept"; return 0; fi
  why="$(folder_change "$q" "$3" "$4" "$d.owner")"   # the same folder, in the quarantine: a swap between the check above and the rename is caught HERE
  if [ -n "$why" ]; then
    if restore_dir "$q" "$d"; then skip folder "$2" "changed after the capture — $why (renamed back)"; else skip folder "$2" "changed after the capture — $why; it could not be renamed back and is kept as $(clean "$q")"; fi
    return 0
  fi
  find "$q" -mindepth 1 -maxdepth 1 -type l -delete 2>/dev/null || true   # a junction into a checkout: unlinked, never followed
  if [ ! -e "$q" ] && [ ! -L "$q" ]; then vanished folder "$q"; return 0; fi   # someone else took the quarantine away: this run removed nothing, so the claim stays and nothing is announced as removed
  rm -rf -- "$q" 2>/dev/null || true
  if [ -e "$q" ] || [ -L "$q" ]; then
    if [ "$OS" = windows ]; then skip folder "$2" "could not be removed — it stays as $(clean "$q"); nothing puts it back on Windows: remove it by hand"
    else skip folder "$2" "could not be removed — it stays as $(clean "$q"), which the next run puts back once it is older than the window"; fi
    return 0
  fi
  rm -f -- "$d.owner" 2>/dev/null || true   # the folder first, its claim last: a half-removed, unclaimed folder is the one outcome never produced
  removed folder "$d"
}
remove_marker() {   # $1 = an orphan claim, $2 = its name, $3 = captured device:inode, $4 = captured claim text
  if [ "$DRY" = 1 ]; then echo "would run: $(clean "rm -f -- $1")"; return 0; fi
  if [ ! -e "$1" ] && [ ! -L "$1" ]; then vanished marker "$1"; return 0; fi
  if [ "$(ident_of "$1")" != "$3" ] || [ "$(claim_text "$1")" != "$4" ]; then skip marker "$2" "changed after the capture — it is no longer the claim that was judged"; return 0; fi
  act_rm marker "$1" rm -f -- "$1" || true
}
remove_steps() {   # THE BODY OF A SUBSHELL. $1 = the clone's git dir, $2 = the worktree, $3 = the captured admin dir (a stranger's clone: the clone is entered and proven ONCE, here, for both git calls; empty for the swept repository's own), $4 = 1 when the capture found the worktree locked, $5 = the lock reason that was judged. Exits 0, EXIT_CLONE_CHANGED or EXIT_GIT_STEP_FAILED (the step was said)
  local gd="$1" rc=0 locked="${4:-0}" now=""
  if [ -n "$3" ]; then
    pin_clone "$1" "$3" || exit "$EXIT_CLONE_CHANGED"
    gd=.; locked=0; if [ -e "worktrees/${3##*/}/locked" ]; then locked=1; fi   # inside the entered clone: only decides whether unlock runs (the lock itself was judged at the capture)
    if [ "${4:-0}" = 1 ]; then   # the lock must still say what was judged
      now="$(claim_text "worktrees/${3##*/}/locked")"
      if [ "$now" != "${5:-}" ]; then exit "$EXIT_CLONE_CHANGED"; fi
    fi
  fi
  if [ "$locked" = 1 ]; then   # unlock only what is locked, so a failure of it is a real one
    git_run "$gd" worktree unlock "$2" || rc=$?
    if [ "$rc" != 0 ]; then step_note "worktree unlock" "$2" "$rc"; exit "$EXIT_GIT_STEP_FAILED"; fi
  fi
  if [ -d "$2" ]; then find "$2" -mindepth 1 -maxdepth 1 -type l -delete 2>/dev/null || true; fi
  rc=0; git_run "$gd" worktree remove --force --force "$2" || rc=$?
  if [ "$rc" != 0 ] && [ -d "$2" ]; then step_note "worktree remove" "$2" "$rc"; exit "$EXIT_GIT_STEP_FAILED"; fi
  exit 0
}
remove_worktree() {   # $1 = the clone's .git dir, $2 = the worktree path, $3 = the captured admin dir (a stranger's clone; empty for the swept repository's own, whose lock the caller re-read), $4 = 1 when it was locked at the capture, $5 = the lock reason that was judged: unlock (if locked), drop top-level links, remove by exact path. A worktree is NEVER renamed. rm -rf runs only when every git step returned 0. Every worktree this removes (a dry run: would remove) is remembered in WT_GONE, by its canonical path taken BEFORE the removal, for the branch pass
  local there=0 rc=0 cw; if [ -d "$2" ]; then there=1; fi
  canon "$2"; cw="$CANON"
  if [ "$DRY" = 1 ]; then
    if [ "${4:-0}" = 1 ]; then echo "would run: $(clean "git --git-dir=$1 worktree unlock $2")"; fi
    if [ -d "$2" ]; then echo "would run: $(clean "find $2 -mindepth 1 -maxdepth 1 -type l -delete")"; fi
    echo "would run: $(clean "git --git-dir=$1 worktree remove --force --force $2")"
    WT_GONE="$WT_GONE$cw"$'\n'; return 0
  fi
  ( remove_steps "$1" "$2" "${3:-}" "${4:-0}" "${5:-}" ) || rc=$?
  case "$rc" in
    0) ;;
    "$EXIT_CLONE_CHANGED") skip worktree "$2" "its clone or its lock changed after the capture — kept"; return 0;;
    *) skip worktree "$2" "a git step did not finish — kept"; return 0;;
  esac
  if [ -d "$2" ]; then rm -rf -- "$2" 2>/dev/null || true; fi
  if [ -d "$2" ]; then skip worktree "$2" "could not be removed"; fi
  if [ ! -d "$2" ]; then WT_GONE="$WT_GONE$cw"$'\n'; fi
  if [ "$there" = 1 ] && [ ! -d "$2" ]; then removed worktree "$2"; fi
}
BR_WT=$'\n'   # branch → the canonical path of the worktree that had it checked out, as `git worktree list` said ONCE, before the first removal: a worktree registered later (its creating command still running) is not in it, so its branch is never taken
branch_worktrees() { local line wp=""
  while IFS= read -r line; do
    case "$line" in
      "worktree "*) canon "${line#worktree }"; wp="$CANON";;
      "branch refs/heads/"*) BR_WT="$BR_WT${line#branch refs/heads/}$U$wp"$'\n';;
    esac
  done < <(git worktree list --porcelain 2>/dev/null)
}
removed_with_worktree() {   # $1 = a branch → 0 only when it was checked out in a worktree this run removed (a dry run: would remove) because its owner was gone
  local hit
  case "$BR_WT" in *$'\n'"$1$U"*) hit="${BR_WT#*$'\n'"$1$U"}"; hit="${hit%%$'\n'*}";; *) return 1;; esac
  [ -n "$hit" ] || return 1
  case "$WT_GONE" in *$'\n'"$hit"$'\n'*) return 0;; esac
  return 1
}
if [ -n "${JANITOR_TEST_PAUSE_FILE:-}" ]; then   # test seam: lets a test change the world between the decisions and the removals
  echo "janitor: test seam paused after the capture — waiting for $(clean "$JANITOR_TEST_PAUSE_FILE")" >&2
  i=0; while [ ! -e "$JANITOR_TEST_PAUSE_FILE" ] && [ "$i" -lt 600 ]; do sleep 0.1; i=$((i + 1)); done
fi
branch_worktrees
for pass in container volume network wt-git wt-dir branch folder marker; do
  while IFS="$U" read -r kind id name clone adm lk ident claim; do
    [ "$kind" = "$pass" ] || continue
    case "$kind" in
      container) act_rm container "$name" docker rm -f -v "$id" || settle container "$name" dk inspect --type container "$id";;
      volume)
        vs=0; if [ "$DRY" = 0 ]; then volume_state "$name" "$ident" "$claim" || vs=$?; fi
        case "$vs" in
          0) act_rm volume "$name" docker volume rm "$id" || settle volume "$name" dk volume inspect "$id";;
          1) skip volume "$name" "changed after the capture — its creation time or its label is not what was judged";;
          *) vanished volume "$name";;
        esac;;
      network) act_rm network "$name" docker network rm "$id" || settle network "$name" dk network inspect "$id";;
      wt-git)
        why="$(entry_change "$id" "$ident" wt-git)"
        if [ -n "$why" ]; then skip worktree "$name" "changed after the capture — $why"   # a path a stranger took over after the capture is not even offered to git
        elif [ "$DRY" = 0 ] && [ "$lk" = 1 ] && [ "$(claim_text "$adm/locked")" != "$claim" ]; then skip worktree "$name" "its lock changed after the capture — kept"   # the lock, read again like a claim, must still say what was judged
        else remove_worktree "$(git rev-parse --git-common-dir)" "$id" "" "$lk" "$claim"; fi;;
      wt-dir) why="$(entry_change "$id" "$ident" wt-dir)"; if [ -z "$why" ]; then remove_worktree "$clone" "$id" "$adm" "$lk" "$claim"; else skip wt-dir "$name" "changed after the capture — $why"; fi;;   # the captured clone; the stranger's .git is never read again, only its type is looked at
      branch)
        if ! removed_with_worktree "$id"; then say_unmarked branch "$id"   # no owner record: only the worktree it was checked out in, removed by THIS run, takes it along. A live run's branch, or one whose worktree stays, is listed
        elif [ "$DRY" = 0 ] && [ "$(git rev-parse -q --verify "refs/heads/$id" 2>/dev/null || true)" != "$ident" ]; then
          if git show-ref --verify -q "refs/heads/$id" 2>/dev/null; then skip branch "$id" "changed after the capture — its tip moved"; else vanished branch "$id"; fi
        else act_rm branch "$id" git update-ref -d "refs/heads/$id" "$ident" || settle branch "$id" git show-ref --verify -q "refs/heads/$id"; fi;;   # by its captured tip: a branch that moved since is kept
      folder) remove_folder "$id" "$name" "$ident" "$claim";;
      marker) remove_marker "$id" "$name" "$ident" "$claim";;
    esac
  done <<< "$DEL"
done
[ "$SKIPPED" = 0 ] || exit 3
