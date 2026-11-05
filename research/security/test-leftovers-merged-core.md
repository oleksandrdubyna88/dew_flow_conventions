# Security verdict — the merged test-leftovers core (PR #82)

> Status: **reviewed 2026-10-26 at commit `8ee8b7d`, re-verified 2026-10-26 at commit `3548691` (branch
> `feat/test-leftovers-merged-core`), by Claude Fable 5.1 (the security judge of plan story S4).** The first pass found
> four medium and seven low findings; the fix commits `62d06ce`, `91e1b40`, `4d6925a`, `2390c7e`, `9acc3af`, `1694b94`
> and `3548691` were read and the three reproductions re-run against them (the results are beside each finding and in the
> *Re-verification* table at the end). Scope: `common/test-leftovers.md`, `common/test-leftovers-janitor.md`,
> `tools/janitor.sh`, `tools/lib/owned.mjs` (+ `owned-token.mjs`, `git.mjs`), `tools/lib/leftovers-sweep.mjs`,
> `tools/leftovers-check.mjs`, `tools/sweeper-scan.mjs` (+ `tools/lib/sweeper-scan.mjs`), `tools/fixtures/owner-vectors.json`,
> `tools/fixtures/owner-blind-allowlist.json`, judged against the spec's § 6 scenarios
> (the merged-core spec's § 6, kept with the private sibling rule repository's hand-off) and the hardened janitor of PR #80
> (`491aab9`). Every line below says what was READ (file:line at `8ee8b7d`) and what was RUN; what was not run is under
> *Not verified*.

**What was run.** `npm test` at `8ee8b7d`, lowered (`nice -n 19`), `TMPDIR=TEMP=TMP` a private 0700 folder, as a
non-root user, stub docker: 1085 tests, 1079 pass, 0 fail, 6 skipped (S4-21b real uid 0, S4-28 Windows end-to-end,
R2b win32 `isMine`, two Windows-only shim/priority tests, one opt-in). The bash functions `win_token`, `pid_ok`,
`name_form`, `claim_norm` were cut out of the script and asked directly; `classifyLine` was asked 25 sweeper shapes; a
scratch Node consumer was built and scanned with the guard (`--profile node`) and the machine scan. At `3548691` the same
suite was run again the same way: 1094 tests, 1087 pass, 1 fail, 6 skipped — the one failure being `S5b 1 … this
repository is clean`, caused by THIS untracked verdict file spelling the bare prefix in three sweep shapes, which the scan
reads; after those lines were reworded the test, the scan and the guard were re-run clean (the exact output is in the
*Re-verification* section). The scratch consumer was rebuilt — this time also with a planted `tools/janitor.sh` copy and
an allowlist entry for it — and the `runRecord` probe was re-run with a dead pid, another host and the process's own
live record.


> Note (2026-10-26): the reviewed commit was `c024aa7`; before the first push the last three local commits were rebuilt
> as `9233f22`, `800df64`, `3548691` to keep a machine path out of the follow-ups plan's history. The trees of `c024aa7` and
> `3548691` differ only in that one line of `todo/PLAN_test_leftovers_merged_core_followups.md`; no code changed.

## The § 6 scenarios, one line each

1. **Forged owner segment** — SHIP. A folder, worktree or claim whose own kernel owner (lstat, never through a link) is
   another uid is `foreign:` whatever the name or record says: `tools/janitor.sh:200-206` (`entry_mine`), `:255-260`
   (`claim_of` → `-foreign-claim`), `:533`, `:685`; Node `tools/lib/leftovers-sweep.mjs:74` (`foreign-uid`) and
   `tools/lib/owned.mjs:433`. Tests S4-23, sweep 12.
2. **Forged claim beside a claimless folder / pre-planted claim or folder** — SHIP. Claim first with `wx`
   (`owned.mjs:395`), `EEXIST` draws a new id (`:580`), `mkdirSync` exclusive (`:589`), a squatted folder is never adopted
   and the helper removes only its own claim while it still holds what it wrote (`:400-406`, `:592-595`). A stranger's claim
   is never read: the janitor checks the claim file's own uid before opening it (`janitor.sh:258-260`), the sweep's
   `readClaimText` likewise (`owned.mjs:428-433`). Tests owned 16/16b/16c.
3. **Root as a weapon** — SHIP (by the uid seam; a real uid-0 run is *not verified*, see below). `u0` is a scope like any
   other: `ME_OWNER=u$MY_UID` (`janitor.sh:150`), `scope_ok` needs name = record = caller AND the entry's uid = `MY_UID`
   (`:225-227`, `:641`); `TESTSTODELETE_OWNER` only changes the token, never `MY_UID` (`:144-147`), so `u1000` under root
   still needs uid-0 files and `u0` under uid 1000 reaches nothing root owns. Test S4-21, S4-32.
4. **Replacement between inspection and deletion** — SHIP. Device:inode and the re-read claim are checked before the
   rename, the folder is renamed ONTO its quarantine name (`mv -T` / perl `rename`, `:557-560`, `:756`), checked AGAIN in
   the quarantine (`:758`), renamed back on a mismatch (`:760`); a link is never followed (`:720`, `:763`, `:794`); a
   worktree is re-checked (`:726-733`, `:854-858`) and never renamed. Node: `leftovers-sweep.mjs:173-187`, `:189-205`.
   Tests S4-25/25b/25c/30/36, 23b, 25b; sweep 15/17.
5. **Inaccessible process evidence** — SHIP. `hidepid` (pid 1 invisible) → unknown (`:303-306`); a Linux record without
   `<ns>` or with another one → unknown (`:228-231`, `:644`); a legacy record on a Linux reader is never gone (`:635`;
   `owned.mjs:514`); a failed or empty `tasklist` → unknown (`:284-301`); pid 0, a leading zero, past 2^53 → unknown
   (`:248`, `:646`; `owned.mjs:347-363`, `:488`). Tests S4-24, L4, L10, f2f7aeb's L-zero.
6. **Hostile names, labels, claims, FIFOs, planted quarantine** — SHIP. A control byte in a name, id, owner or clone path
   makes an `unsafe` row (`:439-441`), docker text goes through Go's `%q` and ids must be lower-case hex (`:435-436`, `:451`),
   a claim is read only as a regular non-link file the caller owns, 513 bytes, bounded (`:255-267`), FIFOs in a clone's
   `worktrees/*` refuse before any git call (`:547-555`), a planted quarantine of another uid is skipped (`:584`) and never
   captured (the leading `.` is outside the glob, `:151`, `:498`). Tests S4-34, S4-37, L6*, S1, S2, S8, 8d, 20b/20c.
   One residual, low (L-3 below): a stranger's control-byte name forged with the caller's owner segment sets exit 3.
7. **Two users, one token, one daemon** — SHIP. A daemon object has no kernel owner; the label's owner segment is the
   evidence; another owner's object is `foreign:` and never removed, a label naming someone else under this user's name is
   `foreign:` too (`:641`, `:662`, `:690`). Test S4-38, S4-27 (legacy objects report-only).
8. **The override's reach** — SHIP. `TESTSTODELETE_OWNER` is validated against `^[uw][0-9]{1,10}$` before any listing or
   match (`janitor.sh:145-147`, exit 2; `owned.mjs:100-103`, throws); it never changes `MY_UID`. Tests S4-32, owned 18.
   Note L-5: for daemon objects (no kernel owner) a valid override DOES select another token's dead containers — by the
   contract's own design; one sentence in the companion would make that explicit.
9. **Windows token** — SHIP for the derivation (bash and Node agree on all 13 `windows-owner` vectors in the conformance
   test; `bob` → `w2176202712` ≥ 2^31 from `$(( 16#… ))` on this 64-bit bash, `Alice`/`alice` → `w735577801`, asked directly);
   "`-O` decides" is proven only through the uid seam here — the Windows half is *not verified*.
10. **Guard teeth and the scan's blind spots** — FIX at `8ee8b7d` (M-1, M-2 below), **SHIP at `3548691`**. A literal
    legacy name is `legacy-name`; a docker `--filter name=` on the bare prefix and a `find -iname` glob of the bare prefix,
    a separator and a star (no owner segment in either) are `owner-blind`; an unreadable job keeps the barrier closed;
    a comment never clears `owner-blind` (`leftovers-check.mjs:236`, `:404`) — all SHIP. At `8ee8b7d` the allowlist was
    not pinned to the shipped janitor: a consumer's own `tools/fixtures/owner-blind-allowlist.json` cleared its own sweeper
    in the guard, and a checkout's allowlist beside `--root` replaced the shipped one in the machine scan (reproduced).
    Fixed by `62d06ce`, re-verified below.

## Findings

### Critical

None found.

### High

None found.

### Medium

**M-1 — The guard's `owner-blind` pass can be widened by a JSON file in the scanned repository.** *(at `8ee8b7d`)*
`tools/leftovers-check.mjs:816-824` (`loadAllowlist`) reads `--allowlist`, else `<repo>/tools/fixtures/owner-blind-allowlist.json`,
else the one beside the tool; `:384` (`allowed`) accepts ANY entry whose file, line and hash match. Nothing requires the
entry to be the shipped janitor's line. *Reproduced 2026-10-26:* a scratch Node consumer whose `scripts/sweep.sh:2` is a
`find <temp root> -maxdepth 1 -name '<bare prefix>-*' -mmin +60 -exec rm -rf {} +` sweep is reported `owner-blind` by
`node tools/leftovers-check.mjs --repo <c> --profile node …`; after writing
`{"entries":[{"file":"scripts/sweep.sh","line":2,"sha256":"<sha of that line>"}]}` into the consumer's
`tools/fixtures/owner-blind-allowlist.json` the finding is gone (exit stays 1 only for the unrelated `raw-temp`). The
contract (§7 `owner-blind`: "the one line a guard or a scan passes is the shipped janitor's inventory, recognised by file,
line and content hash") is met in letter (a hash) and missed in substance (any hash). *Fix:* `allowed()` requires
`entry.file === JANITOR_FILE`; under `--profile node` (or whenever `repo` is not the rule repository — `token !== REPO_TOKEN`)
read NO allowlist from the scanned repository: only the one beside the tool, and only entries that equal the shipped
file's (the mount path is excluded from the scan anyway, so a consumer never needs an entry). A RED test: the scratch
consumer above with its own allowlist must still be found.
**Fix `62d06ce` — re-checked at `3548691`: FIXED.** `loadAllowlist(explicit)` reads `--allowlist` or the file beside the
tool and never the scanned repository's; `allowed()` passes only an entry whose `file` is `tools/janitor.sh` AND whose
file, line and hash match. Re-run: the scratch consumer with its own allowlist (entries for `scripts/sweep.sh:2` and for a
planted `tools/janitor.sh:2` copy of the same sweep) is reported `owner-blind` at both lines, exit 1; with the consumer's
file named explicitly by `--allowlist` the `scripts/sweep.sh:2` finding still stands (the entry's file is not the
janitor's). Residual, accepted: an operator who names a hand-written allowlist with `--allowlist` can clear a line of a
file called `tools/janitor.sh` — an explicit operator act on a file named after the janitor, visible in the command line.

**M-2 — The machine scan honours an allowlist beside `--root`, so a scanned checkout can silence its own sweeper.** *(at `8ee8b7d`)*
`tools/sweeper-scan.mjs:44-48` (`allowlistFor`) prefers `<root>/tools/fixtures/owner-blind-allowlist.json`; `tools/lib/sweeper-scan.mjs:192-193`
(`passes`) matches entries by the path RELATIVE to each checkout, so one entry clears that line in every checkout under the
root. *Reproduced:* `node tools/sweeper-scan.mjs --root <consumer>` with the consumer's hand-written allowlist reports
only `package.json:1` and no longer `scripts/sweep.sh:2`; with `--root <parent>` both are found. A developer who runs the
barrier scan from their own repository root — the natural mistake — gets a barrier that their own file opened. *Fix:*
the scan reads only the allowlist shipped beside the tool (drop the root lookup), and `passes()` additionally requires
`entry.file === "tools/janitor.sh"`. The barrier is a machine-wide control; no file inside the scanned evidence may
configure it.
**Fix `62d06ce` — re-checked at `3548691`: FIXED.** `tools/sweeper-scan.mjs` takes the allowlist shipped beside the tool
only (`allowlistFor()` has no root lookup); `tools/lib/sweeper-scan.mjs` `passes()` requires the relative path AND the
entry's file to be `tools/janitor.sh`. Re-run: `node tools/sweeper-scan.mjs --root <consumer>` with the consumer's own
allowlist in place reports `scripts/sweep.sh:2` and the planted `tools/janitor.sh:2`, exit 1, the barrier closed.

**M-3 — `runRecord` accepts a `TESTSTODELETE_RUN` whose process is already gone; every claim of the run is then dead at birth.** *(at `8ee8b7d`)*
`tools/lib/owned.mjs:381-390` checks grammar, canonical digits and that the owner is the caller's — not that the record
names a live process on this host. *Reproduced:* with `TESTSTODELETE_RUN=<my owner>:<my host>:4194300:1:<my ns>` (a pid
nothing has; `pid_max` 4194304) `runRecord()` returns that record and `ownerState()` of it is `gone`. A stale value left in
a shell profile, a CI job's `.env` or a container image (the attacker model's "wrong env value") makes the user's own
start-of-run sweep (`leftovers-sweep.mjs:72-78`) and janitor remove the folders and worktrees of a LIVE run once they are
older than the window (10 min / 60 min). Scope: the user's own resources only; no cross-user effect. *Fix:* `runRecord`
refuses (warns, uses the process's own record) when `ownerState(parsed, processProbe, { callerOwner })` is not `live`
— one probe, no spawn; a RED test with a dead pid and one with another host.
**Fix `91e1b40` (code) + `3548691` (rule §3: "valid and naming a LIVE run of the caller") — re-checked at `3548691`: FIXED.**
`owned.mjs` `runRecord` now refuses a record that is unreadable, of another owner, or whose `ownerState` is anything but
`live` (that covers a dead pid, another host, another namespace, a leading zero, a refused probe). Re-run: a record with
a pid nothing has → refused with the warning and the process's own record used; a record naming another host → refused;
the process's own live record → accepted.

**M-4 — The Node quarantine restore has no age gate, unlike the janitor; a renamer in another pid namespace is "dead" to it.** *(at `8ee8b7d`)*
`tools/lib/leftovers-sweep.mjs:375-386` restores a quarantine when `mine()` and `probe(pid).state === "dead"`; the
janitor adds "its ctime AND mtime past the window" (`janitor.sh:588-591`) precisely because a janitor in a container that
shares the temp root has a pid this process cannot see (`process.kill` → `ESRCH` → `dead`). Scenario: user A's janitor in a
container (or on the host, with the sweep in a container) is mid `rm -rf` of a quarantine; A's Node sweep in the other
namespace renames it back under its name at once (`restoreOnto`, `:154-166`); the janitor's `rm -rf` continues through its
open directory handle, then finds no `$q`, deletes the claim (`:771`) and announces `removed` — leaving a half-deleted,
now UNMARKED folder under the original name. Only a dead-owned resource is affected (no live resource is lost), but the
companion's "the Node sweep does the same" (plan S4) is not true here. *Fix:* require `now - max(ctimeMs, mtimeMs) ≥ minAgeMs`
(the same two stamps) before `restoreOnto`; pin it with a test like S4-31.
**Fix `4d6925a` — re-checked at `3548691`: FIXED (read; its tests ran green in the suite).** `restoreQuarantines` now
requires `pastWindow(quarantined)` — ctime AND mtime at least `minAgeMs` old, a stat that fails counts as not old — after
the dead-renamer probe and before `restoreOnto`: the same two stamps the janitor reads.

### Low

The low findings L-1 and L-3 to L-7 were parked in `todo/PLAN_test_leftovers_merged_core_followups.md` (F1–F6, commit
`1694b94`), each with a file:line anchor, the fix and the trigger; L-2 was fixed in `4d6925a`. None blocks the release.

**L-1 — The Node sweep does not refuse an untrusted temp root.** *(parked: F1 — still open, low)* The janitor keeps every folder and worktree folder when
`$T` is neither sticky nor the caller's (`janitor.sh:556`, `:517`, `:532`, `-unsafe-root`); `leftovers-sweep.mjs` has no
such check (grep for sticky/`0o1000`: none). In a world-writable non-sticky `TMPDIR` a stranger can swap an entry between
`identityOf(quarantine)` (`:179`) and `removeQuietly` (`:184`). Needs a misconfigured root; the fix is one `statSync(tmp).mode & 0o1000 || uid === getuid()` gate.

**L-2 — A failed `restoreOnto` leaves its placeholder behind in Node.** `leftovers-sweep.mjs:159-160`: `mkdirSync(original)`
succeeds, `renameSync` fails → `false`, and the empty `original` directory stays, claimed by the quarantined folder's
`.owner`; the next sweep removes that empty placeholder and the claim, orphaning the quarantine for good (never listed:
its name is dotted). The janitor removes its own empty mode-700 placeholder (`janitor.sh:565`). A leak of a dead
resource, not a deletion.
**Fix `4d6925a` — re-checked at `3548691`: FIXED.** `restoreOnto` reserves with `mkdirSync(original, { mode: 0o700 })`
and, ONLY in the failed-rename `catch`, calls `removeOwnEmptyPlaceholder` — `lstat` says directory, `mine()`, then
`rmdirSync`, which refuses a non-empty folder — so a name taken over in between is never touched and a successful restore
is never undone (read: the removal is inside the `catch`, not after the `renameSync`).

**L-3 — A stranger can set the caller's exit code with a control-byte name.** *(parked: F2 — still open, low)*
`janitor.sh:656-657` at `8ee8b7d` (`:661` at `3548691`): an `unsafe` row whose name carries the caller's owner segment is
`skipped:` (exit 3) without reading the entry's kernel owner. Plant, as any user, a folder in the temp root whose name is
the prefix, the victim's owner segment and one control byte, and the victim's janitor never exits 0 again. No deletion;
contradicts "never an exit code from a stranger's name". Fix: `link_uid` of the entry before `row folder …` — not the
caller's → `foreign:`.

**L-4 — The guard's `node` profile does not read `package.json` scripts.** *(parked: F3 — still open, low)*
`leftovers-check.mjs:177-189`: a consumer's `"pretest"` script that removes every folder of the bare prefix under the
temp root is invisible to the guard (reproduced: not reported), though the machine scan reads every tracked file and did
report it. The contract's guard is "over the repository's … scripts and CI"; a
`pre`/`post` test script is one. Fix: under the profile, scan the `scripts` values of `package.json` (one line per script).

**L-5 — The override reaches daemon objects by naming an owner.** *(parked: F4 — still open, low, one documentation
sentence)* `TESTSTODELETE_OWNER=<other token>` plus the docker group
(root-equivalent, out of the attacker model, in scope for mistakes) sweeps that token's dead-owned containers, volumes and
networks (`janitor.sh:147`, `:641`, no kernel owner to compare). This is what the core's "a daemon object has no kernel
owner" implies; the companion's "it never widens what the kernel owner allows" reads as if it could not. One sentence.

**L-6 — Known text-scan limits that are not all written down.** *(parked: F5 — still open, low)* `classifyLine`
(`tools/lib/sweeper-scan.mjs:101-107`) returns `null` for a prefix held in a constant on another line (`const PREFIX =
"<bare prefix>-"` on one line, `startsWith(PREFIX)` beside the removal on another), for a store sweep selecting by SQL
`LIKE '<bare prefix>\_%'`, and `owner-aware` for a hard-coded foreign owner (`^<bare prefix>-u1000-`) and for an
age-based but owner-aware sweep (`-name "<bare prefix>-u$(id -u)-*" -mmin +60 -delete`, which the barrier text forbids:
"or removes on age"). All are line-scan limits; the header documents the dynamic-name
one only. Write the four into the scan's header so a reader of a clean scan knows what it did not look at.

**L-7 — A registered worktree outside the temp root has no root-trust check.** *(parked: F6 — still open, low, a recorded
residual)* `wt-git` rows are judged wherever
`git worktree list` puts them (`janitor.sh:470-493`); `safe_id` and `ROOT_OK` apply to temp-root entries only. A worktree
the caller registered inside a directory another user can write to can be swapped between `entry_change` (`:854`) and the
git call. The caller chose the location; the old janitor had the same residual; recorded, not fixed.

## What was checked and holds (question 2 and 3 of the brief)

- **Nothing captured reaches eval, arithmetic or an unquoted expansion unchecked.** The six arithmetic sites
  (`janitor.sh:126-127`, `:140`, `:591`, `:670`, `:837`) take only digit-checked or hex-checked text (`:125`, `:138`, `:589-590`,
  `:669`); there is no `eval`; awk `-v` values are the validated `RX`, a validated pid, or the field separator; `printf '%q'`
  and `clean()` wrap every name on a terminal or `would run:` line; `git update-ref -d` takes a 40–64-hex tip (`:697`);
  docker ids are hex (`:436`); every removed path is absolute and `--`-separated.
- **The branch rule** (`:819-834`, `:859-863`): `git worktree list` read once after the capture and before the first removal;
  a branch goes only when its worktree is in `WT_GONE` (removed by THIS run because its owner was gone), by captured tip;
  everything else is `unmarked:`. Tests S4-35/35b, S9.
- **The swept clone's soundness and lock read** (`:461-465`, `:483-487`, `:856`): the caller's own, closed to group and
  world, locks read as claims (uid, regular file, 513 bytes, bounded), the `.git` file read once. Tests S4-40a-d, 21c.
- **Quarantine restore gates** (`:569-598`): own uid, dead renamer, ctime and mtime past the window, `mkdir -m 700` reservation,
  rename ONTO the empty directory, placeholder removed only when still own and empty; Windows is a notice only (`:562`).
  Tests S4-31, 41, 42, 43a.
- **The removed `prune` pass**: no `prune` in the janitor's passes (`:840`); a gone folder is a notice (`:676`). The Node
  sweep still prunes after a removal (`leftovers-sweep.mjs:299-305`); git's own `initializing` lock protects a worktree
  mid-`add`, and `--lock` the helper's, so a live run's registration is not pruned.
- **`LC_ALL=C`** (`:109`), **`unset CDPATH`** (`:108`), the Windows token (`:133-141`, unsigned, agrees with Node on w13),
  leading-zero pid/start/ns refused in bash (`:248`) and marked `nonCanonical` → unknown in Node (`owned.mjs:347-363`, `:488`).
- **Every #80 defence survives** (diffed against `491aab9`): lstat ownership at capture and before removal, the sticky-or-own
  root (now for plain folders too), the pinned clone entered and re-proven in one subshell with git's environment unset
  (`:411-419`, `:706-709`, `:780-798`), bounded reads with the fail-closed `-unbounded` fallback, `unlock` only when locked,
  `rm -rf` only after every git step returned 0, `%q` progress lines, `.git` read once, FIFO refusal. Tests 20a–25c green.
- **A worktree mid-`worktree add`** is kept: its lock says `initializing` (unreadable) and it is young.
- **A concurrent run of the same user** is safe on both sides: identity re-checks turn the loser's target into
  `vanished`/`replaced`; two helpers cannot share a name (`wx`, exclusive `mkdir`).

## Not verified

- **Windows** (S4-28 skipped here; no Windows machine). Before the janitor removes anything there, prove on a real Git for
  Windows bash, from the account that owns the resources: (1) `stat -c %u` of an entry equals bash's `$UID` for files this
  account made — an administrator account whose new files are owned by the Administrators group makes every entry
  `foreign:` and `%TEMP%` `-unsafe-root` (fail-closed, but then the janitor does nothing); (2) `[ -k ]` is never true on NTFS,
  so `ROOT_OK` depends entirely on `%TEMP%` being owned by the account; (3) `TMPDIR` is set by Git for Windows' bash (the
  companion asserts it) and `/tmp` maps to the user's temp; (4) `id -un` prints the bare account name for a domain account
  (Node's `os.userInfo().username` does) — a `DOMAIN+user` form would make every token disagree with Node (fail-closed);
  (5) the bash is 64-bit (a 32-bit bash makes `$(( 16#… ))` negative for w13-class names); (6) `tasklist //NH //FO CSV` under
  MSYS path conversion and a localised Windows; (7) `-L`, `find -type l -delete` and `rm -rf` on a junction; (8) `pwd -W`
  lower-casing in `canon`; (9) `-O` on a clone. At `8ee8b7d` the code did NOT fail closed to `--dry-run` on Windows by
  itself: the companion's "runs the janitor with `--dry-run` only" was policy, not a gate. **Fixed by `2390c7e` + `9acc3af`
  — re-checked at `3548691` (read):** `janitor.sh:133-135` forces `DRY=1` on Windows unless `JANITOR_WINDOWS_E2E_GREEN` is
  non-empty, with one stderr line saying so; the gate sits after argument parsing and before the quarantine restore
  (`:603`) and the capture (`:605`), so nothing is renamed or removed before it; the companion documents the switch
  (*Running it* and item 6); S4-28b pins the unarmed run, the asked-for dry run and the armed run, and the test harness
  arms only the Windows-branch runs it controls. Items (1)–(9) above remain what S4-28 must prove on a real machine
  before anyone sets the switch there.
- **Real uid 0** (S4-21b skipped): scenario 3 is proven by the `JANITOR_TEST_UID` seam only.
- **A real Docker daemon**: every docker test uses the stub; the `%q` templates and `volume inspect` batching were read, not
  run against a daemon.
- **macOS** (`stat -f`, BSD `date -j`, no GNU `timeout` → perl's alarm): read, not run.
- **A real second OS user, `hidepid=2` and a container sharing the temp root**: seams and fixtures only.

## Re-verification at `3548691` (2026-10-26)

| Finding | Fix commit | Re-check |
|---|---|---|
| M-1 guard allowlist widened by a scanned file | `62d06ce` | FIXED — reproduction re-run: the consumer's allowlist clears nothing; a planted `tools/janitor.sh` copy is found too |
| M-2 machine scan allowlist beside `--root` | `62d06ce` | FIXED — reproduction re-run: `--root <consumer>` reports both sweeper lines, exit 1 |
| M-3 `runRecord` accepts a dead run's record | `91e1b40`, `3548691` (rule §3) | FIXED — dead pid and other host refused with a warning; own live record accepted |
| M-4 Node restore without the age gate | `4d6925a` | FIXED — `pastWindow` on ctime and mtime (read; suite green) |
| L-2 Node restore leaves a placeholder | `4d6925a` | FIXED — removal only in the failed-rename branch, own and empty only |
| Windows not fail-closed in code | `2390c7e`, `9acc3af` | FIXED — `JANITOR_WINDOWS_E2E_GREEN` gate before any action; S4-28b |
| L-1, L-3, L-4, L-5, L-6, L-7 | parked in `1694b94` (F1–F6) | still open, low — anchor, fix and trigger in the follow-ups plan |

`npm test` at `3548691` (lowered, private 0700 `TMPDIR`, non-root, stub docker): 1094 tests, 1087 pass, 1 fail, 6 skipped.
The failure was `S5b 1 the proposed rule texts yield no owner-blind line, and this repository is clean` — the scan reads
untracked files, and the first version of this file spelled the bare prefix in three sweep shapes (a `--filter name=`,
a `find -name` glob and an `rm -rf` glob, all inside backticks). Those lines now say "the bare prefix" instead. Re-run
after the edit, with this file present: `node --test --test-name-pattern='S5b 1' …` → `ok … S5b 1 … this repository is
clean` (5 pass, 0 fail); `node tools/sweeper-scan.mjs --root .` → `sweeper-scan: none found (139 file(s) read) — the
barrier is open for this scope`, exit 0; `node tools/leftovers-check.mjs` → `leftovers-check: clean (51 files).`, exit 0.

Verdict at `8ee8b7d` was **SHIP WITH FIXES** (M-1 to M-4). The § 6 scenarios 1–9 held there; scenario 10 needed M-1/M-2.

## Verdict

**SHIP** at `3548691`. Every medium finding is fixed and re-verified by the reproduction that found it; the Windows path
is fail-closed in code until a person arms it after S4-28; the six remaining low findings are parked with anchors and
triggers and none is a reason to hold the release. What remains *not verified* is unchanged: a real Windows run (S4-28
on a real machine, before `JANITOR_WINDOWS_E2E_GREEN` is set anywhere), a real uid-0 run, a real Docker daemon, macOS, a
real second OS user, `hidepid=2` and a container sharing the temp root.
