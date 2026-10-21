#!/usr/bin/env bash
# janitor.sh — the host-wide leftover janitor of common/test-leftovers.md (§ The janitor).
#
# Everything a test run creates outside its process is named `testsToDelete-<repo>-<what>-<id>` and claimed by
# its run. This script collects what those runs left behind on THIS machine — every repository token, every
# kind: containers, volumes, networks, worktrees, branches, temp folders — and it keeps four promises:
#
#   1. ONE capture. Every prefixed resource is listed once, with its identity, its owner and its age, before
#      anything is decided; only captured, authorised items are deleted, by their captured id or path. A resource
#      that appears after the capture is not touched in this run (the next run judges it). Names are data a
#      stranger wrote: a name or id with a control character is refused with a skip line, a docker name or label is
#      read through Go's `%q` (one line, whatever it holds), a docker id must be lower-case hex, and a captured
#      number is checked to be digits before any arithmetic touches it.
#   2. Owner-aware, per resource. Age selects (a resource younger than the window, or of unknown age, is left
#      alone, silently); the owner authorises: a live owner, a foreign host, an owner that is not exactly
#      `<host>@<linux|macos|windows>:<pid>[:<start>]` (a claim longer than 512 bytes included), a lock that names
#      nobody, a worktree whose lock cannot be read, or — on Windows — process id 1 (which a bash started by a native
#      process reports and Windows does not have) is SKIPPED with one line naming it — never deleted. Unmarked
#      resources older than the window are nobody's and go. A worktree is judged by its lock, read through its `.git`
#      file whatever clone owns it (a relative gitdir is resolved against the worktree). The worktree the janitor
#      runs from is never a candidate.
#   3. Exact removal. Top-level links (a junction into a checkout) are unlinked before a worktree or folder is
#      removed; `rm -rf` never crosses one; a folder, worktree or claim is removed only when it is exactly one
#      component below the temp root. Worktrees go before branches, and before folders. A deletion is never
#      fatal: a target that vanished after the capture is a notice, one that survives a failed removal is skipped.
#   4. Honest exit. 0 when nothing was skipped; 3 when something was (it is named on stderr); any other code is
#      a docker/git failure — a stopped Docker daemon is a failure, not a clean machine. A machine with no
#      `docker` binary says so once and still sweeps git and the temp root.
#
# Usage:  bash tools/janitor.sh [--dry-run] [--token <t>]   — from inside the repository whose worktrees and branches
#         are swept.  --token <t> restricts the sweep to names `testsToDelete-<t>-…` (all three spellings, any case,
#         anchored: `alpha` never matches `alphabet`); <t> is 2 to 12 lower-case letters and digits, anything else — and any
#         unknown argument — prints this usage line and exits 2 with nothing touched.  The options combine in either
#         order.  On Windows run it from Git for Windows' bash, never WSL's (which sees neither the Windows temp
#         root nor Windows pids).  JANITOR_MIN_AGE_MINUTES (default 60) is the window: whole minutes, digits only,
#         at least 1 — anything else is refused in one line (exit 1, nothing removed).  --dry-run prints `would run: …`
#         lines on STDOUT (skips and notices stay on stderr) and removes nothing; its exit code is the real run's.
#         Progress goes to stderr: `janitor: looking for testsToDelete resources…` when the capture starts and one
#         `janitor: removed <kind> "<name>"` line per real removal (the name printed through clean() and quoted; a dry run has none).
#         JANITOR_OS, JANITOR_PROC (the /proc root, default /proc) and JANITOR_HOSTNAME (the machine name, default
#         `hostname`) are test seams only: honoured, and announced once each on stderr when set.
set -euo pipefail
usage() { echo "usage: bash tools/janitor.sh [--dry-run] [--token <t>]   (<t>: 2 to 12 lower-case letters and digits)" >&2; exit 2; }
DRY=0; TOKEN=""; HAVE_TOKEN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift;;
    --token) [ $# -ge 2 ] || usage; TOKEN="$2"; HAVE_TOKEN=1; shift 2;;
    *) usage;;
  esac
done
if [ "$HAVE_TOKEN" = 1 ]; then   # validated BEFORE it reaches a regex or a glob; the rule's token shape is [a-z0-9]{2,12}
  case "$TOKEN" in ""|*[!a-z0-9]*) usage;; esac
  if [ "${#TOKEN}" -lt 2 ] || [ "${#TOKEN}" -gt 12 ]; then usage; fi
fi
RX='teststodelete[-_]'; GLOB='teststodelete[-_]*'   # what a name starts with (rule §1: three spellings, case-insensitive); --token narrows both
if [ "$HAVE_TOKEN" = 1 ]; then RX="teststodelete[-_]$TOKEN[-_]"; GLOB="teststodelete[-_]$TOKEN[-_]*"; fi
AGE_MIN="${JANITOR_MIN_AGE_MINUTES:-60}"   # validated BEFORE use: bash evaluates an arithmetic operand such as `a[$(cmd)]`
case "$AGE_MIN" in *[!0-9]*|????????*) echo "janitor: JANITOR_MIN_AGE_MINUTES must be whole minutes, digits only (at most 7) — nothing was removed" >&2; exit 1;; esac
if [ $(( 10#$AGE_MIN )) -lt 1 ]; then echo "janitor: JANITOR_MIN_AGE_MINUTES must be at least 1 — nothing was removed" >&2; exit 1; fi
T="${TMPDIR:-/tmp}"; T="${T%/}"; MIN_AGE=$(( 10#$AGE_MIN * 60 )); NOW="$(date -u +%s)"   # 10#: a leading zero is decimal, never octal
TAB=$'\t'
U=$'\x1f'   # the field separator of the capture: never whitespace, so an EMPTY owner or age keeps its column
OS="${JANITOR_OS:-$(case "$(uname -s)" in Linux) echo linux;; Darwin) echo macos;; *) echo windows;; esac)}"   # JANITOR_OS: test seam only
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
lower() { tr '[:upper:]' '[:lower:]'; }
clean() { printf '%s' "$1" | LC_ALL=C tr -c '\040-\176' '?'; }   # text for a person's terminal: all but printable ASCII (escapes, CR, LF) becomes '?'
for seam in JANITOR_OS JANITOR_PROC JANITOR_HOSTNAME; do   # a seam changes what the janitor believes: say so, once, every time it is set
  if [ -n "${!seam:-}" ]; then echo "janitor: test seam $seam is set ($(clean "${!seam}")) — it exists for tests; a real run does not set it" >&2; fi
done
owner_ok() { local t="${1%$'\r'}"; if uspace "$t"; then return 1; fi; [[ "$t" =~ ^[^@:[:space:]]+@(linux|macos|windows):[0-9]+(:[0-9]+)?$ ]]; }   # the rule's marker grammar, exactly
pid_ok() { [[ "$1" =~ ^[1-9][0-9]{0,15}$ ]] && [ "$1" -le 9007199254740991 ]; }   # a process id: positive, no leading zero, a safe integer. Grammar-valid is not enough: 0, 007 or 25 digits name no process, so "no such process" about them would be a lie
claim_norm() {   # $1 = the RAW text of a claim, line end intact → the claim as ONE line, or "-" when it is not exactly one line or is longer than 512 bytes
  local LC_ALL=C raw="$1"
  if [ "${#raw}" -gt 512 ]; then printf -- '-'; return 0; fi   # bytes, not characters; owned.mjs applies the same limit
  case "$raw" in *$'\r\n') raw="${raw%$'\r\n'}";; *$'\n') raw="${raw%$'\n'}";; esac   # ONE line end: CRLF or LF
  case "$raw" in *$'\n'*|*$'\r'*) printf -- '-';; *) printf '%s' "${raw:--}";; esac   # a second line, or a CR that is no part of a line end, is not exactly one line
}
claim_of() {   # the claim in file $1: 513 bytes are read, so one past the limit is seen. $(...) alone drops EVERY trailing newline, so a sentinel carries them to claim_norm
  local raw
  if [ ! -f "$1" ] || [ -L "$1" ]; then printf -- '-'; return 0; fi   # only a regular file is read: a FIFO (or a device) planted as a claim would block `head` forever; anything else is unreadable, so preserved
  raw="$(head -c 513 -- "$1" 2>/dev/null; printf x)"; claim_norm "${raw%x}"
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
  local g d; g="$(sed -n 's/^gitdir: //p' "$1/.git" 2>/dev/null || true)"
  case "$g" in ""|/*|[A-Za-z]:/*) ;; *)
    g="$1/$g"   # a relative gitdir (a worktree made with relative paths) climbs out through the worktree itself ("<wt>/../<clone>/.git/…"). Once the worktree is removed that path no longer resolves on Linux, and git leaves the registration behind, so the PARENT is resolved now, while the worktree still exists
    d="$(cd "${g%/*}" 2>/dev/null && { pwd -W 2>/dev/null || pwd -P; })" && g="$d/${g##*/}";;
  esac
  printf '%s' "$g"
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
row() {   # kind id name owner created — an id, a name or an owner is text a stranger wrote: a newline or \x1f in it would forge or shift a row. One with a control byte becomes an `unsafe` row (named, refused), never a candidate
  if has_ctl "$2$3"; then printf '%s\n' "unsafe$U$(ctlclean "$2")$U$(ctlclean "$3")$U$U"; return 0; fi
  printf '%s\n' "$1$U$2$U$3$U$(ctlclean "$4")$U$5"
}
capture() {   # ONE line per prefixed resource ("-" = an owner nobody can read). A failing listing fails the run.
  dk ps -a --format '{{.ID}}\t{{printf "%q" .Names}}\t'"$LBL"'\t{{.CreatedAt}}' | awk -F'\t' -v OFS="$U" -v rx="^$RX" "$UQ"'{ n = uq($2); if (tolower(n) !~ rx) next; if (!idok("container", $1, n)) next; print "container", $1, n, uq($3), $4 }' || return 1
  local vols created
  vols="$(dk volume ls --format '{{printf "%q" .Name}}\t'"$LBL" | awk -F'\t' -v rx="^$RX" "$UQ"'{ n = uq($1); if (tolower(n) ~ rx) print n "\t" $2 }')" || return 1
  if [ -n "$vols" ]; then   # one inspect for all captured volumes, not one per volume
    created="$(volume_created "$(printf '%s\n' "$vols" | cut -f1)")" || return 1
    # one linear pass: the name→CreatedAt map first (C lines), then every listed volume (V lines); one that is not in the map vanished
    { printf '%s\n' "$created" | sed -n "s/^/C$TAB/p"; printf '%s\n' "$vols" | sed -n "s/^/V$TAB/p"; } |
      awk -F'\t' -v OFS="$U" "$UQ"'$1=="C"{c[$2]=$3; next} $1=="V"{ $3 = uq($3); gsub(/[[:cntrl:]]/, "?", $3); if ($2 in c) print "volume",$2,$2,$3,c[$2]; else print "notice: volume " $2 " — vanished after the capture" > "/dev/stderr" }'
  fi
  dk network ls --format '{{.ID}}\t{{printf "%q" .Name}}\t'"$LBL"'\t{{.CreatedAt}}' | awk -F'\t' -v OFS="$U" -v rx="^$RX" "$UQ"'{ n = uq($2); if (tolower(n) !~ rx) next; if (!idok("network", $1, n)) next; print "network", $1, n, uq($3), $4 }' || return 1
  local wts top; wts="$(git worktree list --porcelain)" || return 1
  canon "$(git rev-parse --show-toplevel)"; top="$CANON"   # the clone this runs from and the MAIN checkout are never candidates, nor is a folder holding either
  # a registered worktree: the first block is the MAIN worktree (never a candidate); a path with a control byte becomes an `unsafe` row; the one the janitor runs from becomes a `self` row
  printf '%s\n' "$wts" | awk -v OFS="$U" '
    function emit(   q) { if (p != "" && n > 1) { q = p; if (q ~ /[[:cntrl:]]/) { gsub(/[[:cntrl:]]/, "?", q); print "unsafe", q, q, "", "" } else print "wt-git", p, p, o, "" } }
    /^worktree /{ emit(); p = substr($0, 10); o = ""; n++ }
    /^locked/{ o = substr($0, 8); if (o == "") o = "-"; gsub(/[[:cntrl:]]/, "?", o) }
    END { emit() }' | awk -F"$U" -v rx="/$RX[^/]*\$" 'tolower($3) ~ rx' | while IFS="$U" read -r k id name owner created; do
      if [ "$k" = wt-git ]; then canon "$id"; if [ "$CANON" = "$top" ]; then printf '%s\n' "self$U$id$U$id$U$U"; continue; fi; fi
      printf '%s\n' "$k$U$id$U$name$U$owner$U$created"
    done
  local mine=$'\n' main="" wp c   # this repo's trees, canonical, one per line: not captured twice from the temp root; the first is the MAIN checkout
  while IFS= read -r wp; do canon "$wp"; mine="$mine$CANON"$'\n'; if [ -z "$main" ]; then main="$CANON"; fi; done <<< "$(printf '%s\n' "$wts" | sed -n 's/^worktree //p')"
  git for-each-ref --format='%(refname:short)' refs/heads | awk -v OFS="$U" -v rx="^$RX" 'tolower($0) ~ rx {print "branch",$0,$0,"",""}' || return 1
  # -H: a TMPDIR that is itself a symlink (macOS: /tmp) is followed; -print0: a name may hold a newline
  find -H "$T" -mindepth 1 -maxdepth 1 -type d -iname "$GLOB" -print0 | while IFS= read -r -d '' d; do
    if has_ctl "$d"; then row folder "$d" "$d" "" ""; continue; fi
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
  find -H "$T" -mindepth 1 -maxdepth 1 -type f -iname "$GLOB.owner" -print0 | while IFS= read -r -d '' f; do
    if has_ctl "$f"; then row marker "$f" "$f" "" ""; continue; fi
    if [ ! -d "${f%.owner}" ]; then o="$(claim_of "$f")"; row marker "$f" "$f" "$o" "$(mtime_of "$f")"; fi
  done
}
unreadable_locks() {   # git itself reads <clone>/worktrees/<name>/locked and blocks forever on a FIFO planted there, so a lock that is not a regular file ends the run BEFORE any git listing
  local l
  for l in "$(git rev-parse --git-common-dir)"/worktrees/*/locked; do
    if { [ -e "$l" ] || [ -L "$l" ]; } && { [ ! -f "$l" ] || [ -L "$l" ]; }; then echo "janitor: $(clean "$l") is not a regular file — git would block reading it; nothing was removed" >&2; return 1; fi
  done
}
unreadable_locks || exit 1
echo "janitor: looking for testsToDelete resources…" >&2   # progress: the capture can take a while on a busy machine
CAPTURED="$(capture)" || { echo "janitor: a listing failed — nothing was removed" >&2; exit 1; }
SKIPPED=0; DEL=""
skip() { SKIPPED=1; echo "skipped: $(clean "$1") $(clean "$2") — $(clean "$3")" >&2; }   # names and owners come from places any local user can write
safe_id() {   # a folder, worktree or claim is removed only when it is exactly ONE component below the temp root, and holds no control byte
  local rest
  case "$1" in "$T"/?*) rest="${1#"$T"/}";; *) return 1;; esac
  case "$rest" in */*) return 1;; esac
  if has_ctl "$1"; then return 1; fi
  return 0
}
while IFS="$U" read -r kind id name owner created; do
  [ -n "$id" ] || continue
  case "$kind" in
    unsafe) skip folder "$name" "its name holds a control character — refused"; continue;;
    container|network|volume) e="$(epoch_of "$created")";;
    wt-git|self) e="$(mtime_of "$id")"; [ -n "$e" ] || e=0;;   # a registration whose folder is gone is old by definition; prune takes it
    branch) e=0;;
    *) e="$created";;
  esac
  case "$e" in ''|*[!0-9]*) continue;; esac   # an age that is not digits is no age: left alone, and never reaches arithmetic
  if [ $(( NOW - e )) -lt "$MIN_AGE" ]; then continue; fi   # young: left alone, silently
  if [ "$kind" = self ]; then skip worktree "$name" "the janitor runs from it"; continue; fi   # old enough to be a candidate, and it is the tree this runs from: named, never removed
  case "$kind" in folder|wt-dir|marker) if ! safe_id "$id"; then skip "$kind" "$name" "not exactly one component below the temp root"; continue; fi;; esac
  if [ -n "$owner" ]; then
    if ! owner_ok "$owner"; then skip "$kind" "$name" "owner '$owner' is unreadable"; continue; fi   # validated BEFORE any liveness question
    if [ "$(printf '%s' "${owner%%:*}" | lower)" != "$(printf '%s' "$me" | lower)" ]; then skip "$kind" "$name" "belongs to ${owner%%:*}, not this host"; continue; fi
    p="${owner#*:}"; p="${p%%:*}"
    if ! pid_ok "$p"; then skip "$kind" "$name" "liveness unknown for process $p — not a process id"; continue; fi   # grammar-valid, but no process can have it: never asked, never gone
    if [ "$OS" = windows ] && [ "$p" = 1 ]; then skip "$kind" "$name" "liveness unknown for process 1 — Windows has no pid 1; a bash started by a native process reports it"; continue; fi
    liveness "$p" && lv=0 || lv=$?
    if [ "$lv" = 0 ]; then skip "$kind" "$name" "owned by live process $p — a run is in flight"; continue; fi
    if [ "$lv" != 1 ]; then skip "$kind" "$name" "liveness unknown for process $p — the query failed or was refused"; continue; fi
  fi
  DEL="$DEL$kind$U$id$U$name"$'\n'
done <<< "$CAPTURED"
act() { if [ "$DRY" = 1 ]; then echo "would run: $(clean "$*")"; else "$@" 2>/dev/null; fi; }   # stdout, so a person can pipe it; only the REAL command is silenced
# A deletion is never fatal. A target that vanished after the capture is a notice; one that is still there after a
# failed removal is skipped like a live one (named, exit 3). Only a failed LISTING ends the run (above).
vanished() { echo "notice: $(clean "$1") $(clean "$2") — vanished after the capture" >&2; }
removed() { if [ "$DRY" = 0 ]; then echo "janitor: removed $1 \"$(clean "$2")\"" >&2; fi; return 0; }   # progress, one line per REAL removal; the name goes through clean() like every other captured text, so no escape or line end reaches the terminal. A dry run says "would run:" instead
act_rm() { local k="$1" n="$2"; shift 2; act "$@" && removed "$k" "$n"; }   # act, and announce the removal only when the command succeeded
settle() { local k="$1" n="$2"; shift 2; if "$@" >/dev/null 2>&1; then skip "$k" "$n" "could not be removed"; else vanished "$k" "$n"; fi; }   # $3… = "still there?" test
WT_GONE=$'\n'   # dry run only: the worktrees the real run would already have removed, canonical, one per line
remove_worktree() {   # $1 = the clone's .git dir, $2 = the worktree path: unlock, drop top-level links, remove by exact path
  local there=0; if [ -d "$2" ]; then there=1; fi   # a registration whose folder is already gone is pruned, not "removed"
  act git --git-dir="$1" worktree unlock "$2" || true
  if [ -d "$2" ]; then act find "$2" -mindepth 1 -maxdepth 1 -type l -delete || true; fi
  act git --git-dir="$1" worktree remove --force --force "$2" || true
  if [ -d "$2" ] && [ "$DRY" = 0 ]; then rm -rf -- "$2" 2>/dev/null || true; fi
  if [ -d "$2" ] && [ "$DRY" = 0 ]; then skip worktree "$2" "could not be removed"; fi
  if [ "$there" = 1 ] && [ ! -d "$2" ]; then removed worktree "$2"; fi
  if [ "$DRY" = 1 ]; then canon "$2"; WT_GONE="$WT_GONE$CANON"$'\n'; fi
}
checked_out() {   # is branch $1 checked out in a worktree that STAYS? A dry run counts the worktrees it announced as already gone, so its exit code is the real run's
  local line wp=""
  while IFS= read -r line; do
    case "$line" in
      "worktree "*) wp="${line#worktree }";;
      "branch refs/heads/$1") canon "$wp"; case "$WT_GONE" in *$'\n'"$CANON"$'\n'*) ;; *) return 0;; esac;;
    esac
  done < <(git worktree list --porcelain)
  return 1
}
for pass in container volume network wt-git wt-dir prune branch folder marker; do
  while IFS="$U" read -r kind id name; do
    [ "$kind" = "$pass" ] || continue
    case "$kind" in
      container) act_rm container "$name" docker rm -f -v "$id" || settle container "$name" dk inspect --type container "$id";;
      volume) act_rm volume "$name" docker volume rm "$id" || settle volume "$name" dk volume inspect "$id";;
      network) act_rm network "$name" docker network rm "$id" || settle network "$name" dk network inspect "$id";;
      wt-git) remove_worktree "$(git rev-parse --git-common-dir)" "$id";;
      wt-dir) remove_worktree "$(g="$(gitdir_of "$id")"; printf '%s' "${g%/worktrees/*}")" "$id";;
      branch) if checked_out "$id"; then skip branch "$id" "checked out in a worktree that was kept"; else act_rm branch "$id" git branch -D "$id" || settle branch "$id" git show-ref --verify -q "refs/heads/$id"; fi;;
      folder) if [ -d "$id" ]; then act find "$id" -mindepth 1 -maxdepth 1 -type l -delete || true; act_rm folder "$id" rm -rf -- "$id" || settle folder "$id" test -d "$id"; else vanished folder "$id"; fi; if [ -e "$id.owner" ]; then act rm -f -- "$id.owner" || true; fi;;
      marker) act_rm marker "$id" rm -f -- "$id" || true;;
    esac
  done <<< "$DEL"
  if [ "$pass" = prune ]; then act git worktree prune || true; fi
done
[ "$SKIPPED" = 0 ] || exit 3
