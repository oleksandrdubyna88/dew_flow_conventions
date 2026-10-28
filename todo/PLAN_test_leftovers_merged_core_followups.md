# PLAN — Test leftovers, merged core: follow-ups parked by the security pass

> Status: **plan only, nothing implemented yet, 2026-10-26; F7, F8 and F9 added 2026-10-27; F1 and F9 widened by PR #82's CodeRabbit review, 2026-10-27.; F10 and F11 added 2026-10-27 from the private sibling's review; F12 and F13 added 2026-10-27; F13's fix decided 2026-10-28.** Scope: six low findings of the
> security pass of PR #82 (`research/security/test-leftovers-merged-core.md`, L-1 and L-3 to L-7; its L-2 and M-1 to M-4
> were fixed in the same PR), two test gaps the Opus review of the real-daemon volume fix (9b62ba3) found (F7, F8), and
> the Windows run the owner moved out of the PR's merge conditions on 2026-10-27 (F9), in `tools/lib/leftovers-sweep.mjs`, `tools/janitor.sh`, `tools/leftovers-check.mjs`, `tools/lib/sweeper-scan.mjs` and
> `common/test-leftovers-janitor.md`. Not one of them blocks the release of the merged core (the verdict: "none a reason to
> hold the release").
>
> Related docs: [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md) (the plan these findings belong to; promoted 2026-10-27),
> [PLAN_test_leftovers_merged_core_release.md](PLAN_test_leftovers_merged_core_release.md) (the remainder plan: S0, the merge, the sibling's side, the release; none of F1–F13 blocks it),
> `common/recheck-followups.md` of the consumers' rule set (the format of this file; this repository does not carry that rule).

## Goal

Each item below was raised by the security pass and deliberately not fixed in the PR that carried it. Losing one costs a
future re-discovery by the same method. Anchors are `file:line` at the commit that parked them (the PR's last commit on
`feat/test-leftovers-merged-core`); re-read the line before acting, the files move.

## F1 — The Node sweep does not refuse an untrusted temp root (L-1)

- **What.** `sweepLeftovers` takes `tmp` and removes in it with no check that it is sticky or the caller's own
  (`tools/lib/leftovers-sweep.mjs:436`). The janitor keeps every folder and worktree folder when the root is neither
  (`tools/janitor.sh:212` `shared_dir_ok`, used at `:522` and `:537`, `-unsafe-root`).
- **Why.** In a world-writable, non-sticky `TMPDIR` a stranger can swap an entry between the identity capture and the removal.
  Needs a misconfigured root; no deletion of a live resource of the caller's, but a stranger's folder could be removed in its place.
  The janitor's own gate has the same gap one step narrower (CodeRabbit on PR #82, 2026-10-27): `shared_dir_ok` trusts a root
  that is the caller's own even when its group or others can write to it, so a caller-owned `0777` root passes.
- **Fix when re-opened.** One gate, the same on both sides: the root is sticky (`mode & 0o1000`), or it is the caller's own AND
  neither its group nor others can write to it (`writable_by_others` in the janitor); else keep, list `-unsafe-root` and say it
  once. Node: at the top of the folder and quarantine passes. RED tests first: a non-sticky, other-owned root (a seam for the
  uid, like `mine`), and a non-sticky, caller-owned, group- or world-writable root, in both the Node sweep and the janitor.
- **When.** Before a consumer runs the Node sweep against a shared temp root it does not own (shared dev VM), or with the first
  report of a swapped entry.

## F2 — A stranger's control-byte name with the caller's owner segment sets exit 3 (L-3)

- **What.** An `unsafe` row whose name carries the caller's owner segment is `skipped:` (exit 3) without reading the entry's
  kernel owner (`tools/janitor.sh:661`; the row is built at `:446`).
- **Why.** Any user can plant `<temp root>/<prefix>-u1000-x<control byte>` and the caller's janitor never exits 0 again. No
  deletion; it contradicts "never an exit code from a stranger's name".
- **Fix when re-opened.** Read the entry's own kernel owner (`link_uid`) before the `skipped:` line; an entry that is not the
  caller's is `foreign:` (listed, exit 0). A RED test with the uid seam.
- **When.** Before the janitor is scheduled on a machine other users can write the temp root of, or with the first spurious exit 3.

## F3 — The guard's `node` profile does not read `package.json` scripts (L-4)

- **What.** `isScanned` (`tools/leftovers-check.mjs:177`) selects test and script files by shape; a consumer's
  `"pretest": "rm -rf /tmp/<prefix>-*"` in `package.json` is not a file it reads, although the machine scan (every tracked
  file) does report it. Reproduced by the security pass.
- **Why.** The contract's guard is "over the repository's tests, scripts and CI"; a `pre`/`post` script is one.
- **Fix when re-opened.** Under the profile, read `package.json` and scan the `scripts` values, one line per script, as a
  pseudo-file with the script's name in the finding. A RED test: the consumer above, plus one that stays clean.
- **When.** At the first consumer migration to the guard's `--profile node` (E2 onward of the rollout), before the consumer is
  declared compliant.

## F4 — One companion sentence on the owner override and daemon objects (L-5)

- **What.** With a valid `TESTSTODELETE_OWNER` naming another token, the janitor sweeps THAT token's dead-owned containers,
  volumes and networks: a daemon object has no kernel owner to compare (`tools/janitor.sh:150`, the override; the gate per row
  at the daemon passes). The comment and the companion's "no option names an owner" (`common/test-leftovers-janitor.md`,
  *Running it*) read as if the override could not reach them.
- **Why.** The behaviour is the core's design; the sentence that hides it makes a reader trust a protection that is not there
  (`common/security.md` § *A measure you have not OBSERVED working is a comment*). The reach needs the docker group, which is
  root-equivalent, so it is a mistake guard, not an attack.
- **Fix when re-opened.** One sentence in the companion (and the comment): the override selects another token's dead-owned
  DAEMON objects; for files the kernel owner still decides. Update `research/rule-bodies.json` for the companion.
- **When.** With the next edit of the companion, or the first question about what the override reaches.

## F5 — The scan's text-line limits are not all written down (L-6)

- **What.** `classifyLine` (`tools/lib/sweeper-scan.mjs:101`, docblock `:95-100`) returns `null` for a prefix held in a constant
  on another line, for a store sweep selecting by SQL `LIKE`, and `owner-aware` for a hard-coded foreign owner and for an
  owner-aware sweep that removes on age. Its header documents only the dynamic-name limit.
- **Why.** A reader of a clean scan should know what it did not look at; the barrier text forbids removing on age.
- **Fix when re-opened.** Write the four limits into the header of `tools/lib/sweeper-scan.mjs` and one sentence in the guard's
  header; decide whether the age-based owner-aware sweep should become a finding (a decision for the owner, not a default).
- **When.** With the next change to the classifier, or before the barrier is declared open on a machine by a clean scan.

## F6 — A registered worktree outside the temp root has no root-trust check (L-7)

- **What.** `wt-git` rows are judged wherever `git worktree list` puts them (capture at `tools/janitor.sh:471-473`, re-check
  `entry_change` at `:731`); `safe_id` and `ROOT_OK` apply to temp-root entries only.
- **Why.** A worktree the caller registered in a directory another user can write can be swapped between the re-check and the git
  call. The caller chose the location; the old janitor had the same residual. Recorded, not fixed.
- **Fix when re-opened.** Either require the worktree's parent to be trusted (`shared_dir_ok`) for a `wt-git` removal, or state the
  residual in the companion as a limit and keep it. Decide first which one; both need a test with the parent-trust seam.
- **When.** Before worktrees are registered under a shared parent folder on a machine several OS users share, or with a
  report of a swapped worktree.

## F7 — The stub docker never answers "no such volume" (Opus review of 9b62ba3, L2)

- **What.** The stub's `volume inspect --format` (`tools/janitor.test.mjs:161`) prints `name<TAB>` and exits 0 for a volume it
  does not know. Real docker exits 1 with `Error response from daemon: get <n>: no such volume` (measured 2026-10-27, Docker
  29.9.1). So no stub scenario reaches the per-name fallback of `volume_created` (`tools/janitor.sh:428-434`), the capture's
  `notice: volume … vanished after the capture` (`:463`), or `volume_state` answering 2 at the removal (`:855`).
- **Why.** Before 9b62ba3 no volume reached these paths on a real daemon; now they run on every host with a volume that
  disappears during a run. The reviewer checked the fallback by hand against the real daemon and it works; nothing keeps it
  working.
- **Fix when re-opened.** A stub mode that marks named volumes "gone at inspect" (exit 1, docker's message on stderr), one
  scenario for the batch-fails-then-per-name path and one for a volume that vanishes between the capture and the removal.
- **When.** With the next change to `volume_created` or `volume_state`, or to the stub docker.

## F8 — The live check covers only the two capture templates (Opus review of 9b62ba3, L3)

- **What.** `tools/janitor-docker-live.test.mjs` asks the real daemon about the two `volume_created` templates only. It does not
  run `volume_state`'s re-check template (`tools/janitor.sh:741`), the `ps -a`, `volume ls` and `network ls` templates
  (`:456`, `:458`, `:465`), nor check that `epoch_of` (`:318`) parses the real `CreatedAt`.
- **Why.** Each of these is the same stub-against-real contract that let the volume defect stay green. All of them were checked
  by hand on Docker 29.9.1 on 2026-10-27 and work; a later Docker could change any one of them.
- **Fix when re-opened.** Extend the live test: create a labelled volume, container and network, run each template the script
  sends (read by content, count asserted), and assert the field count, a real tab, and that `epoch_of` gives digits for each
  `CreatedAt`.
- **When.** With a Docker major-version upgrade on any machine that runs the janitor, or the next change to a docker template
  in the script.

## F9 — The Windows run of the merged core (owner decision 2026-10-27)

- **What.** No Windows machine has run the suite since S4 landed (the last Windows count is at 93cabc6, before the janitor
  work), and the Windows end-to-end check `S4-28` in `tools/janitor.test.mjs:2090` has never run green. The owner decided on
  2026-10-27 that PR #82 merges without it.
- **Why it is safe to wait.** The janitor fails closed on Windows: without `JANITOR_WINDOWS_E2E_GREEN` it forces `--dry-run`
  (`common/test-leftovers-janitor.md` item 6; tested by `S4-28b`), so an unverified machine lists and removes nothing. What is
  missing is the evidence that the Windows branch (the `w<digits>` token, `tasklist` liveness, `stat %u` ownership, the temp
  root) removes the right things on a real machine. S4-28 as written proves only the NAME key: its foreign folder carries
  another owner segment (`w1`) but is made by the caller, so the janitor refuses it on the token and never consults `stat %u`
  (CodeRabbit on PR #82, 2026-10-27). Whether Git for Windows' bash reports a stranger's file as a stranger's depends on its
  mount options, so the kernel-owner key on Windows is unmeasured.
- **Fix when re-opened.** First extend S4-28: a folder with the CALLER's owner segment and a dead record, created by ANOTHER
  Windows account (or given to it with `icacls /setowner` by an administrator), must be kept and listed as `foreign:` on its
  file owner. RED first; arming needs this case green too. Then, on a Windows machine with Git for Windows and Node 20+, from a checkout of `main`: a private
  `TEMP`/`TMP`/`TMPDIR` under the user's home, `npm ci`, `npm test` (fail 0), then
  `node --test --test-name-pattern="S4-28" tools/janitor.test.mjs` — the line must read `ok`, not `# SKIP` (a skip saying
  "Git for Windows bash not found" is not a pass). Record the machine, the date, the commit and both outputs; only then may
  that account set `JANITOR_WINDOWS_E2E_GREEN`. A GitHub-hosted `windows-latest` job running the same two commands proves the
  code on Windows, but it does not arm any other machine: the switch is per machine.
- **When.** Before anyone sets `JANITOR_WINDOWS_E2E_GREEN` on any machine, or when a consumer needs its leftovers swept on
  Windows rather than listed.

## F10 — The guard has no `module-load` class (a consumer's request, 2026-10-27)

- **What.** The rule says a helper never creates a resource at module load (`common/test-leftovers.md:69`), and nothing checks it:
  `tools/leftovers-check.mjs:51` lists "a `module-load` class (needs a parser)" as not built.
- **Why.** A consumer keeps its own local check for this until the shared guard has the class. That is a second implementation
  of one rule, and the two can drift.
- **Fix when re-opened.** A parser-based detection of a resource created at a module's top level (outside a function), RED first
  on a fixture that does it; then the consumer drops its local check.
- **When.** Before the second consumer asks for it, or at the next change to the guard.

## F11 — The barrier scan passes the allowlisted janitor line by its line hash alone (the private sibling's security pass, 2026-10-27)

- **What.** `tools/lib/sweeper-scan.mjs:195-196` passes a line of `tools/janitor.sh` when its file, line number and line sha256
  match the allowlist. A changed janitor that keeps that one line byte-identical passes it. The scan's other classes still see
  the rest of the file, but the pass itself no longer proves that the janitor is the shipped one.
- **Why.** The allowlist is meant to pass the shipped janitor, not any file at that path.
- **Fix when re-opened.** Pass the line only when the scanned file's WHOLE sha256 equals the janitor shipped beside the scan (the
  private sibling made this change on 2026-10-27). RED first: a janitor with one extra destructive line elsewhere and the
  allowlisted line unchanged must lose the pass.
- **When.** Before the next release that changes `tools/janitor.sh`, or with F1.

## F12 — The barrier scan and the guard's owner-blind class miss an age-selected removal whose name is a variable (found 2026-10-27)

- **What.** `classifyLine` (`tools/lib/sweeper-scan.mjs:101`; the shapes are at `:33-49`) calls a line broad only when it sees the literal
  prefix beside a deletion. A line such as `find … -name "${VAR}*" -mmin +N … rm -rf` carries no literal prefix, so the scan lists
  nothing for it. A deploy runner's script of that shape was found by reading, not by the scan.
- **Why.** The barrier is only as good as the scan: a deleter it cannot see keeps running after the barrier is declared closed. The rule
  forbids removal by age, whatever the source of the name.
- **Fix when re-opened.** Flag an age-selected removal (`-mmin`, `-mtime`, `-newermt` with `rm`, `-delete` or `xargs rm` after it)
  whatever its name source. RED first: the exact line above must be listed.
- **When.** Before the barrier is declared closed on a machine that runs a deploy runner, or at the next change to the scan.

## F13 — `owned.mjs` assumes 100 clock ticks per second (found 2026-10-27)

- **What.** `tools/lib/owned.mjs:60` sets `CLOCK_TICKS_PER_SECOND = 100`; `startFromProcStat` (`:255`) uses it to turn field 22 of
  `/proc/<pid>/stat` into seconds. On a host whose rate is not 100, a correct record written by a helper in another language reads as
  `unknown` and is kept. That is the safe direction, but the leftover is then never swept.
- **Why.** The comment beside the constant says reading the rate would spawn a process; it can be read without one.
- **Decided 2026-10-28 by the owner: read the real rate, and say what §3's "without spawning" allows.** Two changes, one PR,
  RED first:
  1. `owned.mjs` reads `AT_CLKTCK` (type 17) from `/proc/self/auxv` — a `/proc` read, no child process. Measured 2026-10-28 on
     an Ubuntu VM (Linux 7.0, x86-64): Node read `AT_CLKTCK=100`, the value `getconf CLK_TCK` printed. When the entry cannot be
     read, the start is treated as one that cannot be read without spawning (rule §3 already says what then happens, for a
     writer and for a reader), never as a guessed 100.
  2. Rule §3's sentence names the bound it means: a helper may start ONE child per script or run to learn a constant of the
     host (a shell has no built-in for the rate, so `getconf CLK_TCK` once, when the helper is loaded); never a child per
     test process. Neither the companion (`common/test-leftovers-janitor.md`) nor the owner vectors state the rate or the
     no-spawn bound (checked 2026-10-28 with `git grep -n "spawn\|CLK_TCK" common/ tools/fixtures/owner-vectors.json`), so only the
     rule body and its record (`research/rule-bodies.json`) move.
- **When.** At the next change to `owned.mjs` or rule §3, and before a consumer writes a helper in another language.
- **Build order** (branch `fix/owned-clock-tick-rate`):
  1. RED: in `tools/owned.test.mjs`, (a) `startFromProcStat` takes the rate as a third argument and uses it — field 22 =
     250 000 at 250 ticks a second is 1000 s after `btime`, where today's constant gives 2500 s; (b) a pure
     `clockTicksFromAuxv(buffer)` reads type 17 from a little-endian 64-bit auxiliary vector built by the test, returns
     `undefined` for an empty, truncated or zero-valued vector and for one that ends (type 0) before type 17 — and the same
     vectors in 4-byte words and in big-endian order, since `clockTicksFromAuxv(buffer, wordBytes, endianness)` takes both
     (plan gate finding 0); a value above `Number.MAX_SAFE_INTEGER` is `undefined` (finding 3); (c) on a Linux
     test host, `clockTicksPerSecond()` equals `getconf CLK_TCK` — the TEST may spawn, the helper may not; skipped elsewhere.
  2. GREEN: `tools/lib/owned.mjs` — remove `CLOCK_TICKS_PER_SECOND` (`:60`); add `clockTicksFromAuxv` and a memoised
     `clockTicksPerSecond()` that reads `/proc/self/auxv` once (`undefined` on any failure, never a guessed 100);
     `startFromProcStat(statText, btimeSeconds, ticksPerSecond = clockTicksPerSecond())` (`:249`) returns `undefined` when the
     rate is not a positive integer. The reader (`:258-262`) then has no start, which rule §3 already handles: a writer omits
     the start, a reader with no live start judges `live`. The word size comes from an explicit table of `process.arch`
     values, because `process.arch` names an architecture, not a width (plan gate finding 1): 8 bytes for `arm64`,
     `loong64`, `mips64el`, `ppc64`, `riscv64`, `s390x`, `x64`; 4 for `arm`, `ia32`, `mips`, `mipsel`, `ppc`; any other
     value → `undefined` (no start), never a guess. The endianness is `os.endianness()`. The value is a `BigInt`
     converted to a `Number` only when it is a positive safe integer (finding 3).
  3. Rule §3 (`common/test-leftovers.md:116-119`): the parenthesis names the bound — one child per script or run to learn a
     host constant is allowed (a shell's `getconf CLK_TCK`, read once when the helper is loaded), never a child per test
     process. `node tools/rule-bodies.mjs --update common.test-leftovers` moves the record in the same commit.
  4. The whole suite, lowered (`npm test`), `npm run check` (plan gate finding 2), `node tools/plan-lifecycle.mjs`, `node tools/rule-bodies.mjs`.
  Plan gate (coai, 2026-10-28): `proceed`, 2 of 2 reviewers, 4 findings, all accepted and written into the steps above.
- **Not in this change.** The private sibling's byte copy of `owned.mjs` and its pinned rule spans: they follow at its next copy,
  and its own follow-ups track that. No other file in this repository converts clock ticks (`git grep -n "CLK_TCK\|clock tick"`).
- **Done when.** The three RED tests were observed failing for the right reason, then pass; the suite is green; the rule body
  record matches; this section says F13 is fixed, with the commit.
- **Fixed** 2026-10-28 on branch `fix/owned-clock-tick-rate`, in this commit. RED: `tools/owned.test.mjs` failed to load (`does not provide an export named 'auxvWordBytes'`),
  and the old `startFromProcStat(stat, btime, 250)` returned `+2500` where `+1000` was expected. GREEN: all of the file's tests pass; with `/ 100` put back, only 14c2 fails.

## Definition of Done

- [ ] Each of F1 to F13 is fixed with a RED test observed first, or closed with a recorded decision that it stays a documented limit.
- [ ] The companion and the rule's body records match the code (`node tools/rule-bodies.mjs`).
- [ ] `node tools/leftovers-check.mjs` and `node tools/plan-lifecycle.mjs` are clean; this file is promoted or deleted when the
      last item is closed, and its row in `todo/README.md` goes with it.
