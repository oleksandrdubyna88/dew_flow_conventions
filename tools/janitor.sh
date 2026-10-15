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
#      alone, silently); the owner authorises: a live owner, a foreign host, an owner that cannot be read, a lock
#      that names nobody, or a worktree whose lock cannot be read is SKIPPED with one line naming it — never
#      deleted. Unmarked resources older than the window are nobody's and go. A worktree is judged by its lock,
#      read through its `.git` file whatever clone owns it (a relative gitdir is resolved against the worktree).
#   3. Exact removal. Top-level links (a junction into a checkout) are unlinked before a worktree or folder is
#      removed; `rm -rf` never crosses one. Worktrees go before branches, and before folders.
#   4. Honest exit. 0 when nothing was skipped; 3 when something was (it is named on stderr); any other code is
#      a docker/git failure — a stopped Docker daemon is a failure, not a clean machine. A machine with no
#      `docker` binary says so once and still sweeps git and the temp root.
#
# Usage:  bash tools/janitor.sh [--dry-run]       — from inside the repository whose worktrees and branches
#         are swept; on Windows from Git for Windows' bash, never WSL's (which sees neither the Windows temp
#         root nor Windows pids).  JANITOR_MIN_AGE_MINUTES (default 60) is the window.  --dry-run announces
#         what would be removed and removes nothing (exit codes unchanged).
set -euo pipefail
DRY=0; if [ "${1:-}" = "--dry-run" ]; then DRY=1; fi
T="${TMPDIR:-/tmp}"; MIN_AGE=$(( ${JANITOR_MIN_AGE_MINUTES:-60} * 60 )); NOW="$(date -u +%s)"
U=$'\x1f'   # the field separator of the capture: never whitespace, so an EMPTY owner or age keeps its column
me="$(hostname)@$(case "$(uname -s)" in Linux) echo linux;; Darwin) echo macos;; *) echo windows;; esac)"
lower() { tr '[:upper:]' '[:lower:]'; }
alive() { case "$me" in *@windows) tasklist //FI "PID eq $1" //NH //FO CSV | grep -q ",\"$1\",";; *) kill -0 "$1" 2>/dev/null;; esac; }
if command -v docker >/dev/null; then dk() { docker "$@"; }; else dk() { :; }; echo "janitor: no docker binary — containers, volumes and networks not swept" >&2; fi
epoch_of() {   # docker's "2026-10-15 10:22:33 +0200 CEST" / "2026-10-15T08:22:33.123Z" → unix seconds; "" when unparseable
  local s="$1"; s="${s%% [A-Z]*}"; s="$(printf '%s' "$s" | sed -E 's/\.[0-9]+//; s/T/ /; s/Z$/ +0000/')"
  [ -n "$s" ] || return 0
  date -u -d "$s" +%s 2>/dev/null || date -u -j -f '%Y-%m-%d %H:%M:%S %z' "$s" +%s 2>/dev/null || true
}
mtime_of() { stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null || true; }
gitdir_of() {   # a folder holding a .git FILE is a linked worktree of SOME clone; a relative gitdir is relative to the worktree
  local g; g="$(sed -n 's/^gitdir: //p' "$1/.git" 2>/dev/null || true)"
  case "$g" in ""|/*|[A-Za-z]:/*) ;; *) g="$1/$g";; esac; printf '%s' "$g"
}
row() { printf '%s\n' "$1$U$2$U$3$U$4$U$5"; }   # kind id name owner created
capture() {   # ONE line per prefixed resource ("-" = an owner nobody can read). A failing listing fails the run.
  dk ps -a --format '{{.ID}}\t{{.Names}}\t{{.Label "testsToDelete.owner"}}\t{{.CreatedAt}}' | awk -F'\t' -v OFS="$U" 'tolower($2) ~ /^teststodelete[-_]/ {print "container",$1,$2,$3,$4}' || return 1
  dk volume ls --format '{{.Name}}\t{{.Label "testsToDelete.owner"}}' | awk -F'\t' -v OFS="$U" 'tolower($1) ~ /^teststodelete[-_]/ {print "volume",$1,$1,$2,""}' || return 1
  dk network ls --format '{{.ID}}\t{{.Name}}\t{{.Label "testsToDelete.owner"}}\t{{.CreatedAt}}' | awk -F'\t' -v OFS="$U" 'tolower($2) ~ /^teststodelete[-_]/ {print "network",$1,$2,$3,$4}' || return 1
  git worktree list --porcelain | awk -v OFS="$U" '/^worktree /{if(p!="")print "wt-git",p,p,o,""; p=substr($0,10); o=""} /^locked/{o=substr($0,8); if(o=="")o="-"} END{if(p!="")print "wt-git",p,p,o,""}' | awk -F"$U" 'tolower($3) ~ /\/teststodelete[-_][^\/]*$/' || return 1
  git for-each-ref --format='%(refname:short)' refs/heads | awk -v OFS="$U" 'tolower($0) ~ /^teststodelete[-_]/ {print "branch",$0,$0,"",""}' || return 1
  find "$T" -mindepth 1 -maxdepth 1 -type d -iname 'teststodelete[-_]*' | while IFS= read -r d; do
    if [ -f "$d/.git" ]; then g="$(gitdir_of "$d")"; o=""
      if [ -z "$g" ] || [ ! -d "$g" ]; then o="-"; elif [ -e "$g/locked" ]; then o="$(head -c 200 "$g/locked")"; o="${o:--}"; fi
      row wt-dir "$d" "$d" "$o" "$(mtime_of "$d")"
    else o=""; if [ -e "$d.owner" ]; then o="$(head -c 200 "$d.owner")"; o="${o:--}"; fi
      row folder "$d" "$d" "$o" "$(mtime_of "$d")"
    fi
  done
  find "$T" -mindepth 1 -maxdepth 1 -type f -iname 'teststodelete[-_]*.owner' | while IFS= read -r f; do
    if [ ! -d "${f%.owner}" ]; then o="$(head -c 200 "$f")"; row marker "$f" "$f" "${o:--}" "$(mtime_of "$f")"; fi
  done
}
CAPTURED="$(capture)" || { echo "janitor: a listing failed — nothing was removed" >&2; exit 1; }
SKIPPED=0; DEL=""
skip() { SKIPPED=1; echo "skipped: $1 $2 — $3" >&2; }
while IFS="$U" read -r kind id name owner created; do
  [ -n "$id" ] || continue
  case "$kind" in
    container|network) e="$(epoch_of "$created")";;
    volume) e="$(epoch_of "$(dk volume inspect --format '{{.CreatedAt}}' "$id" 2>/dev/null || true)")";;
    wt-git) e="$(mtime_of "$id")"; [ -n "$e" ] || e=0;;   # a registration whose folder is gone is old by definition; prune takes it
    branch) e=0;;
    *) e="$created";;
  esac
  if [ -z "$e" ] || [ $(( NOW - e )) -lt "$MIN_AGE" ]; then continue; fi   # unknown or young: left alone, silently
  if [ -n "$owner" ]; then
    case "$owner" in *@*:*) ;; *) skip "$kind" "$name" "owner '$owner' is unreadable"; continue;; esac
    if [ "$(printf '%s' "${owner%%:*}" | lower)" != "$(printf '%s' "$me" | lower)" ]; then skip "$kind" "$name" "belongs to ${owner%%:*}, not this host"; continue; fi
    p="${owner#*:}"; p="${p%%:*}"
    if alive "$p"; then skip "$kind" "$name" "owned by live process $p — a run is in flight"; continue; fi
  fi
  DEL="$DEL$kind$U$id$U$name"$'\n'
done <<< "$CAPTURED"
act() { if [ "$DRY" = 1 ]; then echo "would run: $*"; else "$@" 2>/dev/null; fi; }   # stdout, so a person can pipe it; only the REAL command is silenced
# A deletion is never fatal. A target that vanished after the capture is a notice; one that is still there after a
# failed removal is skipped like a live one (named, exit 3). Only a failed LISTING ends the run (above).
vanished() { echo "notice: $1 $2 — vanished after the capture" >&2; }
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
