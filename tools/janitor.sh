#!/usr/bin/env bash
# janitor.sh — the host-wide leftover janitor of common/test-leftovers.md (§ The janitor).
#
# Everything a test run creates outside its process is named `testsToDelete-<repo>-<what>-<id>` and claimed by
# its run. This script collects what those runs left behind on THIS machine — every repository token, every
# kind: containers, volumes, networks, worktrees, branches, temp folders — and it keeps four promises:
#
#   1. ONE capture. Every prefixed resource is listed once, with its identity, its owner and its age, before
#      anything is decided; only captured, authorised items are deleted, by their captured id or path. A resource
#      that appears after the capture is not touched in this run (the next run judges it).
#   2. Owner-aware, per resource. Age selects (a resource younger than the window, or of unknown age, is left
#      alone, silently); the owner authorises: a live owner, a foreign host, an owner that is not exactly
#      `<host>@<linux|macos|windows>:<pid>[:<start>]`, a lock that names nobody, or a worktree whose lock cannot be
#      read is SKIPPED with one line naming it — never deleted. Unmarked resources older than the window are
#      nobody's and go. A worktree is judged by its lock, read through its `.git` file whatever clone owns it (a
#      relative gitdir is resolved against the worktree).
#   3. Exact removal. Top-level links (a junction into a checkout) are unlinked before a worktree or folder is
#      removed; `rm -rf` never crosses one. Worktrees go before branches, and before folders. A deletion is never
#      fatal: a target that vanished after the capture is a notice, one that survives a failed removal is skipped.
#   4. Honest exit. 0 when nothing was skipped; 3 when something was (it is named on stderr); any other code is
#      a docker/git failure — a stopped Docker daemon is a failure, not a clean machine. A machine with no
#      `docker` binary says so once and still sweeps git and the temp root.
#
# Usage:  bash tools/janitor.sh [--dry-run] [--token <t>]   — from inside the repository whose worktrees and branches
#         are swept.  --token <t> restricts the sweep to names `testsToDelete-<t>-…` (all three spellings, any case,
#         anchored: `alpha` never matches `alphabet`); <t> is lower-case letters and digits, anything else — and any
#         unknown argument — prints this usage line and exits 2 with nothing touched.  The options combine in either
#         order.  On Windows run it from Git for Windows' bash, never WSL's (which sees neither the Windows temp
#         root nor Windows pids).  JANITOR_MIN_AGE_MINUTES (default 60) is the window: whole minutes, digits only —
#         anything else is refused in one line (exit 1, nothing removed).  --dry-run prints `would run: …` lines on
#         STDOUT (skips and notices stay on stderr) and removes nothing (exit codes unchanged).
#         JANITOR_OS, JANITOR_PROC (the /proc root, default /proc) and JANITOR_HOSTNAME (the machine name, default `hostname`) are test seams only.
set -euo pipefail
usage() { echo "usage: bash tools/janitor.sh [--dry-run] [--token <t>]   (<t>: lower-case letters and digits)" >&2; exit 2; }
DRY=0; TOKEN=""; HAVE_TOKEN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift;;
    --token) [ $# -ge 2 ] || usage; TOKEN="$2"; HAVE_TOKEN=1; shift 2;;
    *) usage;;
  esac
done
if [ "$HAVE_TOKEN" = 1 ]; then case "$TOKEN" in ""|*[!a-z0-9]*) usage;; esac; fi   # validated BEFORE it reaches a regex or a glob
RX='teststodelete[-_]'; GLOB='teststodelete[-_]*'   # what a name starts with (rule §1: three spellings, case-insensitive); --token narrows both
if [ "$HAVE_TOKEN" = 1 ]; then RX="teststodelete[-_]$TOKEN[-_]"; GLOB="teststodelete[-_]$TOKEN[-_]*"; fi
AGE_MIN="${JANITOR_MIN_AGE_MINUTES:-60}"   # validated BEFORE use: bash evaluates an arithmetic operand such as `a[$(cmd)]`
case "$AGE_MIN" in *[!0-9]*|????????*) echo "janitor: JANITOR_MIN_AGE_MINUTES must be whole minutes, digits only (at most 7) — nothing was removed" >&2; exit 1;; esac
T="${TMPDIR:-/tmp}"; MIN_AGE=$(( 10#$AGE_MIN * 60 )); NOW="$(date -u +%s)"   # 10#: a leading zero is decimal, never octal
TAB=$'\t'
U=$'\x1f'   # the field separator of the capture: never whitespace, so an EMPTY owner or age keeps its column
OS="${JANITOR_OS:-$(case "$(uname -s)" in Linux) echo linux;; Darwin) echo macos;; *) echo windows;; esac)}"   # JANITOR_OS: test seam only
host_norm() { printf '%s\n' "$1" | sed -E 's/[@:[:space:]]+/-/g'; }   # the host as an owner writes it: each run of '@', ':' or whitespace is ONE '-', nothing trimmed, case kept (owned.mjs hostName, the same rule)
me="$(host_norm "${JANITOR_HOSTNAME:-$(hostname)}")@$OS"
lower() { tr '[:upper:]' '[:lower:]'; }
clean() { printf '%s' "$1" | LC_ALL=C tr -c '\040-\176' '?'; }   # text for a person's terminal: all but printable ASCII (escapes, CR, LF) becomes '?'
uspace() {   # does $1 hold a Unicode space (what Node's \s names beyond ASCII)? [[:space:]] knows only the ASCII ones in a C/POSIX locale, so the UTF-8 bytes are listed
  local s; for s in $'\xc2\xa0' $'\xe1\x9a\x80' $'\xe2\x80\x80' $'\xe2\x80\x81' $'\xe2\x80\x82' $'\xe2\x80\x83' $'\xe2\x80\x84' $'\xe2\x80\x85' $'\xe2\x80\x86' $'\xe2\x80\x87' $'\xe2\x80\x88' $'\xe2\x80\x89' $'\xe2\x80\x8a' $'\xe2\x80\xa8' $'\xe2\x80\xa9' $'\xe2\x80\xaf' $'\xe2\x81\x9f' $'\xe3\x80\x80' $'\xef\xbb\xbf'; do
    case "$1" in *"$s"*) return 0;; esac
  done
  return 1
}
owner_ok() { local t="${1%$'\r'}"; if uspace "$t"; then return 1; fi; [[ "$t" =~ ^[^@:[:space:]]+@(linux|macos|windows):[0-9]+(:[0-9]+)?$ ]]; }   # the rule's marker grammar, exactly; ONE trailing CR (a CRLF line end that lost its LF) is no part of it
pid_ok() { [[ "$1" =~ ^[1-9][0-9]{0,15}$ ]] && [ "$1" -le 9007199254740991 ]; }   # a process id: positive, no leading zero, a safe integer. Grammar-valid is not enough: 0, 007 or 25 digits name no process, so "no such process" about them would be a lie
claim_norm() {   # $1 = the RAW text of a claim, trailing newlines intact → the claim as ONE line, or "-" when it is not exactly one line
  local raw="$1"; raw="${raw%$'\n'}"; raw="${raw%$'\r'}"   # one line end: LF or CRLF
  case "$raw" in *$'\n'*|*$'\r'*) printf -- '-';; *) printf '%s' "${raw:--}";; esac   # a second line (or a stray CR) is not exactly one line
}
claim_of() {   # the claim in file $1. $(...) alone drops EVERY trailing newline, so a sentinel carries them to claim_norm
  local raw; raw="$(head -c 200 -- "$1" 2>/dev/null; printf x)"; claim_norm "${raw%x}"
}
# Liveness is THREE-valued — 0 live, 1 dead, 2 unknown — and only "no process with that pid" is dead. A refused or
# failed query (a missing `tasklist`, a `ps` that errors, no /proc) is unknown and preserves. `kill -0` is not used:
# it cannot tell "no such process" from "not permitted" without parsing a localised message.
TASKS=""; TASKS_RC=""   # one `tasklist` snapshot per run, taken on the first Windows liveness question
PROC="${JANITOR_PROC:-/proc}"   # test seam: the /proc root
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
  local g; g="$(sed -n 's/^gitdir: //p' "$1/.git" 2>/dev/null || true)"
  case "$g" in ""|/*|[A-Za-z]:/*) ;; *) g="$1/$g";; esac; printf '%s' "$g"
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
# A docker label is text a stranger wrote, and docker prints it raw: a newline in it would end the record, and the rest of the label would
# read as a record of its own — a forged row naming any id. So every template asks for the label through Go's `%q`, which prints it as ONE
# quoted line with its control characters escaped; uq() takes the quotes off. A value that is not quoted is left as it is.
LBL='{{printf "%q" (.Label "testsToDelete.owner")}}'
UQ='function uq(s) { if (s ~ /^".*"$/) s = substr(s, 2, length(s) - 2); return s } '
row() { printf '%s\n' "$1$U$2$U$3$U$(printf '%s' "$4" | LC_ALL=C tr '\000-\037\177' '?')$U$5"; }   # kind id name owner created — an owner is text a stranger wrote: a newline or \x1f in it would forge a row
capture() {   # ONE line per prefixed resource ("-" = an owner nobody can read). A failing listing fails the run.
  dk ps -a --format '{{.ID}}\t{{.Names}}\t'"$LBL"'\t{{.CreatedAt}}' | awk -F'\t' -v OFS="$U" -v rx="^$RX" "$UQ"'tolower($2) ~ rx {print "container",$1,$2,uq($3),$4}' || return 1
  local vols created
  vols="$(dk volume ls --format '{{.Name}}\t'"$LBL" | awk -F'\t' -v rx="^$RX" 'tolower($1) ~ rx')" || return 1
  if [ -n "$vols" ]; then   # one inspect for all captured volumes, not one per volume
    created="$(volume_created "$(printf '%s\n' "$vols" | cut -f1)")" || return 1
    # one linear pass: the name→CreatedAt map first (C lines), then every listed volume (V lines); one that is not in the map vanished
    { printf '%s\n' "$created" | sed -n "s/^/C$TAB/p"; printf '%s\n' "$vols" | sed -n "s/^/V$TAB/p"; } |
      awk -F'\t' -v OFS="$U" "$UQ"'$1=="C"{c[$2]=$3; next} $1=="V"{ $3 = uq($3); gsub(/[[:cntrl:]]/, "?", $3); if ($2 in c) print "volume",$2,$2,$3,c[$2]; else print "notice: volume " $2 " — vanished after the capture" > "/dev/stderr" }'
  fi
  dk network ls --format '{{.ID}}\t{{.Name}}\t'"$LBL"'\t{{.CreatedAt}}' | awk -F'\t' -v OFS="$U" -v rx="^$RX" "$UQ"'tolower($2) ~ rx {print "network",$1,$2,uq($3),$4}' || return 1
  local wts; wts="$(git worktree list --porcelain)" || return 1
  printf '%s\n' "$wts" | awk -v OFS="$U" '/^worktree /{if(p!="" && n>1)print "wt-git",p,p,o,""; p=substr($0,10); o=""; n++} /^locked/{o=substr($0,8); if(o=="")o="-"} END{if(p!="" && n>1)print "wt-git",p,p,o,""}' | awk -F"$U" -v rx="/$RX[^/]*\$" 'tolower($3) ~ rx'   # the first block is the MAIN worktree: never a candidate
  local mine=$'\n' main="" wp c   # this repo's trees, canonical, one per line: not captured twice from the temp root; the first is the MAIN checkout
  while IFS= read -r wp; do canon "$wp"; mine="$mine$CANON"$'\n'; if [ -z "$main" ]; then main="$CANON"; fi; done <<< "$(printf '%s\n' "$wts" | sed -n 's/^worktree //p')"
  git for-each-ref --format='%(refname:short)' refs/heads | awk -v OFS="$U" -v rx="^$RX" 'tolower($0) ~ rx {print "branch",$0,$0,"",""}' || return 1
  local top; canon "$(git rev-parse --show-toplevel)"; top="$CANON"   # the clone this runs from and the MAIN checkout are never candidates, nor is a folder holding either
  find "$T" -mindepth 1 -maxdepth 1 -type d -iname "$GLOB" | while IFS= read -r d; do
    canon "$d"; c="$CANON"   # once per candidate
    case "$top/" in "$c/"*) continue;; esac
    case "$main/" in "$c/"*) continue;; esac
    if [ -f "$d/.git" ]; then
      case "$mine" in *$'\n'"$c"$'\n'*) continue;; esac
      g="$(gitdir_of "$d")"; o=""
      if [ -z "$g" ] || [ ! -d "$g" ]; then o="-"; elif [ -e "$g/locked" ]; then o="$(claim_of "$g/locked")"; fi
      row wt-dir "$d" "$d" "$o" "$(mtime_of "$d")"
    else o=""; if [ -e "$d.owner" ]; then o="$(claim_of "$d.owner")"; fi
      row folder "$d" "$d" "$o" "$(mtime_of "$d")"
    fi
  done
  find "$T" -mindepth 1 -maxdepth 1 -type f -iname "$GLOB.owner" | while IFS= read -r f; do
    if [ ! -d "${f%.owner}" ]; then o="$(claim_of "$f")"; row marker "$f" "$f" "$o" "$(mtime_of "$f")"; fi
  done
}
CAPTURED="$(capture)" || { echo "janitor: a listing failed — nothing was removed" >&2; exit 1; }
SKIPPED=0; DEL=""
skip() { SKIPPED=1; echo "skipped: $(clean "$1") $(clean "$2") — $(clean "$3")" >&2; }   # names and owners come from places any local user can write
while IFS="$U" read -r kind id name owner created; do
  [ -n "$id" ] || continue
  case "$kind" in
    container|network|volume) e="$(epoch_of "$created")";;
    wt-git) e="$(mtime_of "$id")"; [ -n "$e" ] || e=0;;   # a registration whose folder is gone is old by definition; prune takes it
    branch) e=0;;
    *) e="$created";;
  esac
  if [ -z "$e" ] || [ $(( NOW - e )) -lt "$MIN_AGE" ]; then continue; fi   # unknown or young: left alone, silently
  if [ -n "$owner" ]; then
    if ! owner_ok "$owner"; then skip "$kind" "$name" "owner '$owner' is unreadable"; continue; fi   # validated BEFORE any liveness question
    if [ "$(printf '%s' "${owner%%:*}" | lower)" != "$(printf '%s' "$me" | lower)" ]; then skip "$kind" "$name" "belongs to ${owner%%:*}, not this host"; continue; fi
    p="${owner#*:}"; p="${p%%:*}"
    if ! pid_ok "$p"; then skip "$kind" "$name" "liveness unknown for process $p — not a process id"; continue; fi   # grammar-valid, but no process can have it: never asked, never gone
    liveness "$p" && lv=0 || lv=$?
    if [ "$lv" = 0 ]; then skip "$kind" "$name" "owned by live process $p — a run is in flight"; continue; fi
    if [ "$lv" != 1 ]; then skip "$kind" "$name" "liveness unknown for process $p — the query failed or was refused"; continue; fi
  fi
  DEL="$DEL$kind$U$id$U$name"$'\n'
done <<< "$CAPTURED"
act() { if [ "$DRY" = 1 ]; then echo "would run: $*"; else "$@" 2>/dev/null; fi; }   # stdout, so a person can pipe it; only the REAL command is silenced
# A deletion is never fatal. A target that vanished after the capture is a notice; one that is still there after a
# failed removal is skipped like a live one (named, exit 3). Only a failed LISTING ends the run (above).
vanished() { echo "notice: $(clean "$1") $(clean "$2") — vanished after the capture" >&2; }
settle() { local k="$1" n="$2"; shift 2; if "$@" >/dev/null 2>&1; then skip "$k" "$n" "could not be removed"; else vanished "$k" "$n"; fi; }   # $3… = "still there?" test
remove_worktree() {   # $1 = the clone's .git dir, $2 = the worktree path: unlock, drop top-level links, remove by exact path
  act git --git-dir="$1" worktree unlock "$2" || true
  if [ -d "$2" ]; then act find "$2" -mindepth 1 -maxdepth 1 -type l -delete || true; fi
  act git --git-dir="$1" worktree remove --force --force "$2" || true
  if [ -d "$2" ] && [ "$DRY" = 0 ]; then rm -rf -- "$2" 2>/dev/null || true; fi
  if [ -d "$2" ] && [ "$DRY" = 0 ]; then skip worktree "$2" "could not be removed"; fi
}
checked_out() { git worktree list --porcelain | grep -qxF "branch refs/heads/$1"; }
for pass in container volume network wt-git wt-dir prune branch folder marker; do
  while IFS="$U" read -r kind id name; do
    [ "$kind" = "$pass" ] || continue
    case "$kind" in
      container) act docker rm -f -v "$id" || settle container "$name" dk inspect --type container "$id";;
      volume) act docker volume rm "$id" || settle volume "$name" dk volume inspect "$id";;
      network) act docker network rm "$id" || settle network "$name" dk network inspect "$id";;
      wt-git) remove_worktree "$(git rev-parse --git-common-dir)" "$id";;
      wt-dir) remove_worktree "$(g="$(gitdir_of "$id")"; printf '%s' "${g%/worktrees/*}")" "$id";;
      branch) if checked_out "$id"; then skip branch "$id" "checked out in a worktree that was kept"; else act git branch -D "$id" || settle branch "$id" git show-ref --verify -q "refs/heads/$id"; fi;;
      folder) if [ -d "$id" ]; then act find "$id" -mindepth 1 -maxdepth 1 -type l -delete || true; act rm -rf -- "$id" || settle folder "$id" test -d "$id"; else vanished folder "$id"; fi; if [ -e "$id.owner" ]; then act rm -f -- "$id.owner" || true; fi;;
      marker) act rm -f -- "$id" || true;;
    esac
  done <<< "$DEL"
  if [ "$pass" = prune ]; then act git worktree prune || true; fi
done
[ "$SKIPPED" = 0 ] || exit 3
