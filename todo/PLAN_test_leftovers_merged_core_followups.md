# PLAN — Test leftovers, merged core: follow-ups parked by the security pass

> Status: **plan only, nothing implemented yet, 2026-10-26; F7, F8 and F9 added 2026-10-27; F1 and F9 widened by PR #82's CodeRabbit review, 2026-10-27.; F10 and F11 added 2026-10-27 from the private sibling's review; F12 and F13 added 2026-10-27; F13's fix decided 2026-10-28; F14 added 2026-10-28; F15 added 2026-10-28.** Scope: six low findings of the
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
- **Re-assessed 2026-10-28, before the build — the gap is the VARIABLE, not the age.** Measured with `node tools/leftovers-check.mjs
  --repo <fixture>` on this branch's base:
  - the deploy script that triggered F12 holds `PREFIX='testsToDelete-<repo>-preflight-'` — a LEGACY literal. The guard already
    reports that line (`legacy-name`), and the pattern cannot reach an owner-form name (no owner starts with a letter-continued
    segment), so it is no barrier threat;
  - a file holding `P='testsToDelete-'` and then `find "${TMPDIR:-/tmp}" -maxdepth 1 -name "${P}*" -mmin +60 -exec rm -rf {} +` and
    `rm -rf "$TMPDIR/$P"*` is reported **clean** — it removes every user's leftovers, and neither the guard nor the barrier scan
    sees it. That is the defect.
  Flagging every age test is the wrong fix: rule §4 lets age SELECT (the janitor keeps what is younger than 10 minutes), and a log
  retention line (`find "$LOG_DIR" -name '*.log' -mtime +14 -delete`) is no sweep at all; one line cannot tell selecting from
  authorising.
- **Fix.** In `tools/lib/sweeper-scan.mjs`, ONE file-level entry point, used by every reader (`broadLines`, the scan's
  `classifyText` `:198-208`, the guard's per-line loop `tools/leftovers-check.mjs:404`):
  1. `prefixBindings(text)` — the names assigned a LITERAL value that holds the prefix word (case-insensitive), in the same file:
     shell (`NAME=`, with `export`/`local`/`readonly`/`declare` before it), JavaScript/TypeScript (`const|let|var NAME =`), Python
     (`NAME =`), PowerShell (`$NAME =`); quoted with `'`, `"` or a backtick, or bare. A value with an interpolation (`$`, `${`, `{`)
     binds nothing: its owner segment cannot be read, and the line that uses it stays as today. **Conservative binding** (plan
     gate finding 1): a name assigned a prefix value ANYWHERE in the file is bound on every line, whatever the scope, order or a
     later reassignment — the error is then a false `broad`, which keeps the barrier closed (the safe direction), never a
     missed sweep. **Aliases** (finding 5): an assignment whose whole value is a reference to a bound name (`P="$BASE"`,
     `P = BASE`) binds too, to a fixed point (at most a few passes; a cycle binds nothing more).
  2. `expandLine(line, bindings)` — `${NAME}`, `$NAME` (and `$env:NAME`) become the value; a bare identifier `NAME` becomes the
     value in quotes for a binding made in JavaScript, TypeScript or Python syntax — only as a whole token (finding 3): not part
     of a longer identifier, not after a `.` (a property), and not inside a string literal. The binding's own line is not
     expanded. A concatenation needs nothing more: measured 2026-10-28, `fs.rmSync("testsToDelete-" + id)`,
     `startsWith("testsToDelete-")` with a removal, and Python's `startswith(…)` with `shutil.rmtree` already classify broad.
  3. `classifyLine` runs on the expanded line; the reported line number, the allowlist's hash and the message stay the ORIGINAL
     line's. A line the expansion changes is broad only if its expanded form is broad, so nothing that is clean today becomes red
     unless a prefix-bound variable reaches a sweep shape.
  Rule §7's `owner-blind` row gains "written literally or through a variable the same file assigns the prefix — a name from
  another file, the environment or an argument is not traced" (finding 0: the guarantee is narrowed in writing, where a reader of
  the barrier's verdict sees it); the header of `sweeper-scan.mjs` says the same; `research/rule-bodies.json` moves.
- **Tests, RED first** (`tools/sweeper-scan.test.mjs`, and one guard test in `tools/leftovers-check.test.mjs`): the two lines above
  are broad, for a shell binding; `const PREFIX = "testsToDelete-"` with `names.filter((n) => n.startsWith(PREFIX))` and an
  `rmSync` → broad; the same in Python with `startswith(PREFIX)` and `shutil.rmtree` → broad; an owner-aware value
  (`'testsToDelete-u1000-'`) → owner-aware; an interpolated value → no binding, unchanged verdict; a legacy literal value → null,
  and the guard still reports its `legacy-name`; a log-retention line → null; an alias chain → broad; a bare identifier that is
  only part of a longer name or a property → no expansion; the REAL guard (`main`/the CLI of `tools/leftovers-check.mjs`, as
  the file's existing fixture-repository tests call it) over a git repository the test builds with the binding and the removal
  in ONE file and a second file using the same name unbound, lists the bare-prefix lines as `owner-blind` with that file's path
  and their original line numbers and nothing for the second file (finding 2); the scan's allowlist still passes the janitor's line by
  its original hash. The repository's own self-scan (`tools/sweeper-scan.test.mjs:105`, every tracked file holds no broad line)
  stays green — a binding in this repository's own tools that the expansion turns red is judged, not exempted.
- **Not in this change, recorded as limits:** a binding made in ANOTHER file, an environment variable, a value built over several
  lines, or a name passed as an argument — the scan reads one file at a time. Age as the authoriser of an owner-aware removal is
  not detected by a line scan; the janitor is the one remover (rule *The janitor*), and review owns the rest.
- **Done when.** The RED tests were observed failing for the stated reason, then pass; the whole suite, `npm run check`,
  `node tools/rule-bodies.mjs` and `node tools/plan-lifecycle.mjs` are green; this section says F12 is fixed.
- **Plan gate** (coai, 2026-10-28): `proceed`, 2 of 2 reviewers, 6 findings; 0, 1, 2, 3 and 5 accepted and written in above;
  4 (a quoted concatenation would not classify) rejected by the measurement in step 2.
- **Deviation (2026-10-28, judged at build):** the plan's conservative binding made this repository's own janitor red on 7 lines (456, 458, 465,
  475, 501, 503, 543) through `RX`/`GLOB`, assigned on its allowlisted inventory line 156. A binding made on a line the allowlist passes
  (same file, line number and line hash) does not propagate: `classifyLines` derives those lines itself from the allowlist and the file
  (`classifyLines(text, { allowlist, file, honourMarker })`, with the one `passes` function), and `--update-allowlist` writes only lines
  broad on their own, so a binding never widens the file it writes. The risk — a changed janitor that keeps line 156 byte-identical could
  hide a new use of `$RX` — is no wider than before F12 (such a use was invisible then too) and is closed by F11 (the whole janitor's hash).
  Two widenings of the pass are known and are closed by F11 as well: (a) an alias `X="$RX"` added anywhere in the janitor stays unbound,
  so its uses are hidden; (b) `--update-allowlist` admits every janitor line that is broad on its own, and one that also assigns sanctions
  its variables' uses, while the diff a reviewer reads shows only that line. Until F11, a change to the janitor is reviewed by a person.
- **Review round (2026-10-28, coai code gate 8 of 8 and a judge):** the binding code moved to `tools/lib/prefix-bindings.mjs`. What changed:
  `${NAME<operator>…}` is a use (not the length `${#NAME}`); the value of a name is its WHOLE right-hand side with the known bindings
  written into it, bound when ONE literal piece holds the prefix word, to a true fixed point (the cycle guard is a value-length and a
  values-per-name bound, not a pass cap), so a default, a path and an owner interpolation bind, and `'<prefix>-' + owner + '-'` is
  owner-aware, not broad; the two-piece spelling this family uses (`"teststo" + "delete"`) binds nothing; a line carrying the transition
  marker binds nothing for a caller that honours it; every combination of the values of the names a line uses is read (above 256 readings
  the line is judged broad); an assignment's own right-hand side is not read as a use; the Python string prefix class includes `f`.
- **Limits, recorded 2026-10-28 (not fixed in this change):** Python f-strings at the USE (`f'/tmp/{PREFIX}*'`, `Path(...).glob(f'{PREFIX}*')`);
  a concatenated glob with the removal on another line (`glob.glob('/tmp/' + PREFIX + '*')` then `shutil.rmtree(p)`; JS `rimraf('/tmp/' + P + '*')`);
  quoted globs (`[[ "$n" == "$P"* ]]`, a `"$P"*)` case arm — the glob shape does not accept a quote before `*`, which also missed literals before
  F12); Python written without PEP 8 spacing (read as shell); a second assignment on one shell line (`local a=0 P='…'`), a second JS
  declarator (`const A = 1, P = '…'`), shell arrays, PowerShell `[string]$P`, `$script:P`/`$global:P` and PowerShell's case-insensitive names;
  Fixed in this change from that list: the Python `f` string prefix at the binding (a test). Added after round 3:
  - **J1** — a value whose prefix word is split over two literal pieces (`'teststo''delete-'`, `"teststo" + "delete-"`) binds nothing: this
    family's own spelling of "not the prefix" for detector and test code. A real sweeper written that way is missed (F14).
  - **J2** — what binds from a script operand that is not string-shaped: each ORIGINAL string literal holding the word (`'W-' || x`, a
    conditional expression, PowerShell `-replace`); a regex literal, an arrow, an object, a command substitution and an environment name that
    merely holds the word bind nothing; a path-join call (`PATH_JOIN_CALLS`) binds only with literals or names as arguments. Added in round 5: a
    bound name passed to a call other than a path join or a case conversion, or reached through a member access, binds nothing (`'{}-'.format(BASE)`,
    `'%s-' % BASE`, `[a, BASE].join('/')`, `BASE.concat('-')`, `BASE.trim()`, shell `$(echo "$BASE" | tr …)` and `$(printf '%s-' "$BASE")`); a real
    sweeper written so is missed. A right-hand side is read
    to 1024 characters: past that only its literals and word-runs bind.
  - **J3** — `'W-' + STAR`: any non-literal operand after the prefix reads as an owner segment, so the use is owner-aware (missed).
- **Expected fleet work:** measured by the judge with a machine scan over one host's checkouts, the change reports 143 MORE owner-blind lines than
  before, all in test or detector code that spells sweep text through a variable (a consumer's dev-VM shell test that builds `find … '${p}-*' -delete`
  strings from `local p=<prefix>`; the private sibling's dev-env tests and its leftover and sweeper libraries) — none a real sweeper. They are false
  positives in the safe direction: they keep the barrier closed until those files spell the prefix in two pieces (this repository's own practice,
  which the binding reader honours), or carry the transition marker.
- **Round 3 (2026-10-28):** a string literal with something after it binds (`'W-'.toLowerCase()`, `||`, a conditional, `-replace`, `.ToLower()`) — these were
  broad at `0dce2ca` and null at `f7926cd`; an alias assigned and used on one line is read (`P=$B; rm -rf /tmp/$P*`); the span an assignment
  occupies is removed by offset, not by its first textual match; a name past its value bounds is marked `overflow` and a line that uses it is
  judged broad; `classifyLines` returns null for a line the allowlist passes, so no caller checks it again; the prefix word is tested on the
  whole text before any line is classified; a right-hand side is read to 1024 characters and an operator tail of a `${NAME…}` use to 512, so an
  unclosed bracket or `${P:` on a 100000-character line takes tens of milliseconds, not seconds.
- **Round 4 (measured on real compliant code):** a machine scan over the private sibling's main checkout reported 53 owner-blind lines at round 3 (51 in one
  test file that builds owner-aware names, one in each of two provisioning tests), none a sweeper, against none at the base release. The binding reader
  had bound 22 names there by taint: a name given to a call or a member access (`volumeFiles(s.from)`) "held the word in a literal" once expansion had
  written the value in, and a template cycle grew until the name overflowed. Now only a string-shaped value binds (a literal, a template or word of
  literals and names, a bound name, a call of `PATH_JOIN_CALLS` with such arguments); the word comes from an original literal or a bound name's value;
  a name's own placeholder and that of a name built from it stays a placeholder; a regular-expression literal is not a place where a name is a use. The
  other two lines were a bound name (a listing query) written inside a regular-expression literal. After the fix the same scan reports none (462 files).
  A machine scan over one host's checkouts (`--honour-marker`, lowered), base release against round 4: 390 → 542 owner-blind lines (+152, against +143 measured
  at the first commit), all in one consumer's dev-VM shell tests that write sweep text through `local p=<prefix>` (8 files, 22 checkouts of the same
  tree; the main checkout of it +5 in one file), none a sweeper; nothing else on the host changed.
- **Round 5 (judge re-check of round 4):** round 4's cycle guard (`dependencyGuard`) took a dependency edge from every identifier of a right-hand
  side, string contents included, and then refused a name every value that came through the cycle. Two defects, both a MISSED SWEEP (the costly
  error; the file header's contract is "a false broad, never a missed sweep"):
  (a) a word inside a path literal made a false edge with no cycle at all: `BASE='/tmp/<p>-'`, `tmp="$BASE"`, `rm -rf "$tmp"*` read null, because `tmp`
  sits in BASE's literal; the same in JavaScript (`` `rm -rf ${tmp}*` ``), with `ROOT='/var/tmp/<p>-'`/`var="$ROOT"`, in Python (`PREFIX='<p>-%d' % 0`:
  the `d` of `%d`, then `d = os.path.join(tempfile.gettempdir(), PREFIX)`) and across two shell functions (`local base='<p>-'; local dir="$TMPDIR/$base"`
  and elsewhere `local base="$(mktemp -d)/dir"`);
  (b) it excluded whole NAMES, not the values that came through the cycle: function a `p='<p>-'; dir="$TMPDIR/$p"; rm -rf "$dir"*` and function b
  `dir=/tmp; p="$dir/x"` read null (the same in JavaScript and Python), and `A='<p>-'; B="$A"; A="$B-x"` then `rm -rf /tmp/$B*` read null.
  Round 4's review had rejected this exact concern on a wrong argument: "the graph is static, so it is complete". It is static, and it is built from
  words inside literals, so it is complete only for edges nobody wrote. Verdicts of the use line: `fe05417` broad (every one, by taint: it bound names the value never reached),
  `5f49dcc` null, now broad.
  **Fix (the judge's option 2, value provenance).** Dependency edges are gone. Every bound value carries the names it was built through; a build of X
  takes no value whose provenance holds X, and takes the others (cycles still end; R9's template case is unchanged: not overflowing, not broad, `id`
  unbound). A use is only what `makeUses` reads: `$NAME`, `${NAME…}`, a template's `${NAME}`, a bare code name outside a string literal. Where the
  provenance is wrong only through round 6's correction below. Also: a case conversion of a bound name (`.toLowerCase()`, `.toUpperCase()`,
  Python `.lower()`/`.upper()`, `String(X)`, `str(X)`) is string-shaped and binds (the classifier lower-cases, so the case is no matter), and a pathlib
  join (`Path(a) / X`, `pathlib.Path(a, 'b') / X`) is a path join. R7 keeps its measured shape; its `base.toLowerCase()` line, which now binds (a
  string-shaped value, no taint), became `base.trim()`, a call that still binds nothing. Performance (judge F3): `regexLiteralEnd` rescanned to the
  end of the line from every `/` that opens an unclosed character class; a scan that reaches the end without closing is not started again on that
  line. A line of 100000 characters, `f(PFX ` and `=/[` repeated, took 10.7 s and takes 22 ms (R16).
  **Limits** (J-list): **J2** now says, in plain words, that a bound name passed to a call other than a path join or a case conversion, or reached
  through a member access, binds nothing (`'{}-'.format(BASE)`, `'%s-' % BASE`, `[a, BASE].join('/')`, `BASE.concat('-')`, shell `$(echo "$BASE" | tr …)`,
  `$(printf '%s-' "$BASE")`): a real sweeper written so is missed. New: **J4** — a line that holds the prefix word thousands of
  times once the names are expanded costs the classifier (`looseVerdicts`) time quadratic in that count (14000 occurrences: 2 s); not fixed here.
  **J5** — a placeholder glued directly BEFORE the prefix (`P="$D<p>-"`, a self-append `P=/tmp/; P="$P<p>-"`) is not read as a prefix: null in
  every version.
- **Round 6 (an Opus judge, "do not ship", and the coai gate, proceed with one finding):** three fixes on round 5.
  **B1** — `maskSubstitutions` wrote `${x}` for a `$(…)` or a backtick, and round 5's generic use pattern read it as a use of the file's own variable
  `x`: `P="$(mktemp -d)/<p>-"; x="$P"; rm -rf "$x"*` (also backticks; also `P="$(date)/<p>-"` with `find … -name "${x}*" -exec rm -rf {} +`) was broad at
  `fe05417` and `5f49dcc`, null at `65d50c1`, broad now. Chosen: the placeholder is `${-}` (not an identifier, so no use pattern matches it; the
  classifier reads `<p>-${-}` as an owner segment, as it did `${x}`); every other unreadable operand uses the same constant. The other option (collect
  names from the unmasked right-hand side) is moot after B2.
  **B2** — round 5's provenance held every name a right-hand side MENTIONED, bound or not: a name used without a value (an argument, a command
  substitution, a name not yet bound) blocked the later build of that very name — the same class as (b). Probes, all broad at `fe05417`, null at `65d50c1`,
  broad now: `d="$1"; p="$d/<p>-"; d="$p"; rm -rf "$d"*`; `setup(){ tmp="$(mktemp -d)"; base="$tmp/<p>-"; }` with `teardown(){ tmp="$base"; rm -rf "$tmp"*; }`;
  `dir="$(mktemp -d)"; p="$dir/<p>-"; dir="$p"`; JavaScript `const base = root + '/<p>-'; const root = base;`, `let d = …; let p = d + '/<p>-'; d = p;`, and
  `const d = …; const p = d + '/<p>-';` then `const d = p;` in a function. Now a value's provenance is its own NAME and the provenance of the values it actually
  TOOK; a use that stays a placeholder adds nothing. Termination holds: every taken value carries its own name, so a cycle back to X is refused. The
  generic use pattern is gone. R9 changes: `id = \`${base}\`` now takes base's value (base's provenance does not hold `id`), so `id` binds the owner-aware
  template and its use line reads owner-aware, not null; base then refuses id's value. R7 (the measured owner-aware shape) is unchanged: no broad line,
  `BOUND` still `["P","base"]`. What an error in provenance can do, exactly: it is exact by construction, so it can only REFUSE a value whose
  derivation ran through the name that builds it; that loses a variant of a value the name already holds (text the cycle added around it), and reads as
  a missed reading when that text changes what follows the prefix or sits before it (see J6). This corrects round 5's sentence that a wrong
  provenance is "too small" and so errs to overflow: that was never true (it did not overflow, it read null).
  **C0** (gate finding, accepted) — a right-hand side cut at 1024 characters whose unread tail holds the prefix word (or whose word straddles the cut)
  marks the name `overflow`: its uses read broad. The check costs one `lastIndexOf` per line, found once. A 1100-character right-hand side with the
  prefix at its end and `rm -rf "$P"*` was null, is broad.
  **Limit J6** — see B2: a refusal can drop a variant of a value around a cycle. It matters for text added AFTER the prefix (a stripping operator) and for
  text added BEFORE it, which is what makes the path anchor. Input, null at `fe05417`, `65d50c1` and `532846f` alike (so not a regression): `P='<p>-'` /
  `P="$TMPDIR/$P"` / `for d in "$P"*; do` / `rm -rf "$d"` / `done`. The self-reference drops the `$TMPDIR/<p>-` variant; what is left is the quoted glob
  `"<p>-"*`, which the classifier does not read (a base classifier limit), and the line has no deletion.
  **Limit J7** — a parameter operator that can strip the owner segment (`${P%%-u*}`, `${P%-*}`, `${P#…}`) is expanded to the bound value as if the
  operator were absent, so the use reads with the owner segment the operator may have removed (owner-aware). Tracer limitation, found 2026-10-28 by
  an outside consultation; not a regression of the pre-F12 classifier. Verified on this branch's HEAD: `P="<p>-u1000-repo-"; find /tmp -name "${P%%-u*}-*"
  -exec rm -rf {} +` reads owner-aware. The wider family of this limit, an unresolved owner position, is F15.
  **Follow-up candidates, not done here:** (1) the fixed point is super-linear on long shell chains (1000 names: 29 s on this machine, 12.8 s at
  `fe05417`; adversarial, the use pattern is rebuilt once per pass); (2) R6's timing: each of its five lines takes 36–300 ms against a 1 s budget
  (the 0.84 s measured earlier was the sum of the five), so the margin on a loaded machine is about 3x — left as is; (3) `${NAME}` inside a
  single-quoted shell string or a JavaScript non-template string is still replaced as a use at the USE site (a false broad, the safe direction); the part
  that fed provenance went with B2; (4) C0's `tailHolds` takes the last prefix word anywhere on the line, so a cut right-hand side followed by the word in a
  COMMENT or a later statement marks the name `overflow` (a false broad, the safe direction), e.g. `DATA='<1100 a>' # <p>-u1000-` then `echo "$DATA"`; (5) a
  base-classifier false broad, not F12: ``P="/tmp/<p>-u`id -u`-"`` reads broad, because a backtick after `u` is not an owner start in `OWNER_START_RE`.
- **Round 7 (coai round 6, finding 2, confirmed):** `bindItems` skipped an assignment whose right-hand side is longer than MAX_VALUE (512) and does not hold
  the word, even when it USES a bound name: `BASE='<p>-'`, `P="<600 chars of /x>/$BASE"`, `rm -rf "$P"*` read null (the JavaScript form, `const P = '<600 chars>/' +
  BASE;` with `startsWith(P)` and `rmSync`, too), while the short form read broad. Measured at `532846f` and `cfedbb0`; the same at `65d50c1`. Now such a right-hand
  side marks the assigned name `overflow` when it makes a real use of a bound name, by the use grammar (a name inside a string literal or a longer word is no
  use): its uses read broad. One that uses no bound name still binds nothing (no false broad), and the 1024-character cut (C0) is unchanged. J6 was
  rewritten (above). Reviews of `532846f`: an Opus judge, SHIP (90 probes, no regression, no new false positive); the coai gate, proceed.
- **Fixed** 2026-10-28 on branch `fix/scan-age-sweep-through-variable`, in seven rounds. RED, round 1: the use lines of a same-file binding classified null
  (`actual null, expected 'broad'`) and the guard exited 0 on a file that removes through a bare-prefix variable. RED, round 2: the use of an
  owner-aware concatenation classified broad, `${P:?}` and its kin classified null, and a 100000-character line of the shape `x:` and spaces took 21 s.
  RED, round 3 (against `0dce2ca` → `f7926cd`): the seven literal-first shapes, the same-line alias, the repeated-text span, the 33rd value, and
  five adversarial 100000-character lines (29 s for the first) all failed or were null where `0dce2ca` said broad.
  RED, round 5 (against `5f49dcc`): the use line of each of the five (a) probes and the three (b) probes read null, the case conversions and
  pathlib joins bound nothing, and the unclosed-class line took 10.7 s.
  RED, round 6 (against `65d50c1`): the four B1 probes, the six B2 probes and the 1100-character right-hand side all read null on the use line.
  RED, round 7 (against `cfedbb0`): the 600- and 1000-character right-hand sides, shell and script, read null on the use line.
  GREEN: all new tests, and the janitor's 7 uses clean through the sanction.

## F13 — `owned.mjs` assumes 100 clock ticks per second (found 2026-10-27)

- **What.** `tools/lib/owned.mjs:60` sets `CLOCK_TICKS_PER_SECOND = 100`; `startFromProcStat` (`:255`) uses it to turn field 22 of
  `/proc/<pid>/stat` into seconds. On a host whose rate is not 100, a correct record written by a helper in another language reads as
  `unknown` and is kept. That is the safe direction, but the leftover is then never swept.
- **Why.** The comment beside the constant says reading the rate would spawn a process; it can be read without one.
- **Decided 2026-10-28 by the owner: read the real rate, and say what §3's "without spawning" allows.** Two changes, one PR,
  RED first:
  1. `owned.mjs` reads `AT_CLKTCK` (type 17) from `/proc/self/auxv` — a `/proc` read, no child process. Measured 2026-10-28 on
     an Ubuntu VM (Linux 7.0, x86-64): Node read `AT_CLKTCK=100`, the value `getconf CLK_TCK` printed. When the entry cannot be
     read, the start is treated as one that cannot be read without a child per test process (rule §3 already says what then
     happens: the writer omits the start and, with it, the namespace; a Linux reader judges a record without `<ns>`
     `unknown`, `owned.mjs` `ownerState`), never as a guessed 100.
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
     the start and the namespace, and a Linux reader judges a record without `<ns>` `unknown`, so nothing is swept (the safe direction; a
     reader that has no live start but a record with one judges `live`). The word size comes from an explicit table of `process.arch`
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
- **Limit, recorded:** a Linux host whose rate cannot be read (an arch not in the table, no readable `/proc/self/auxv`) writes records without start and namespace, which every Linux reader judges `unknown`: nothing of that host is swept until the table names its arch.
- **Fixed** 2026-10-28 on branch `fix/owned-clock-tick-rate`, in this commit and the review-fixes commit after it. RED: `tools/owned.test.mjs` failed to load (`does not provide an export named 'auxvWordBytes'`),
  and the old `startFromProcStat(stat, btime, 250)` returned `+2500` where `+1000` was expected. GREEN: all of the file's tests pass; with `/ 100` put back, only 14c2 fails.
  A host whose rate cannot be read writes no start and no namespace, so its records read `unknown` and are kept (see the limit above). Review: coai code gate `proceed` (8 of 8;
  findings 1 and 2 accepted and applied in the review-fixes commit, 0 and 3 rejected with reasons) and the Opus review (SHIP WITH FIXES; 1, 2, 3, 4, 5 and the `s390` half of 6 applied;
  the once-read counting half of 6 and 7 not applied — the merge commit is named at promotion).

## F14 — a prefix split over two literal pieces binds nothing (found 2026-10-28)

- **What.** `tools/lib/prefix-bindings.mjs` (`candidates`, `shellPieces`) binds a value only when ONE literal piece holds the prefix word as
  written, so `P='teststo''delete-'` followed by `rm -rf "/tmp/$P"*` reads as null: the sweeper is missed. The scan's own rule for
  detector and test code — "spell the prefix in two pieces" — is what a person could apply, mechanically, to a REAL sweeper to hide it.
- **Why.** The fleet's expected work after F12 tells files to spell the prefix in two pieces. The two-piece spelling is the one thing the
  binding reader honours without a marker, so it is also the one way to write a sweeper the barrier scan cannot see.
- **Fix when re-opened.** Fold adjacent quoted pieces of ONE shell word (`'a''b'`, `a"b"`), and measure how many of the family's own detector
  and test lines that turns red; keep the JavaScript and Python `"a" + "b"` exception, which is a statement of intent in code. RED first:
  the line above must be broad.
- **When.** Before the barrier is declared closed on a machine whose sweepers were changed after this release.

## F15 — an unknown right after the prefix separator reads as an owner (found 2026-10-28)

- **What.** Rule §7 and `OWNER_START_RE` (`tools/lib/sweeper-scan.mjs:43`) count a variable or a placeholder right after the prefix's separator as an
  owner segment: on literal lines, and (through F12) on traced values. When that variable is empty or holds no owner (`suffix = ""`, `$S` empty), a
  bare-prefix sweep reads owner-aware: a false negative for the barrier. Verified 2026-10-28 on this branch's HEAD (`<p>` is the prefix word):
  - JavaScript `const suffix = ""; const P = "<p>-" + suffix;` with `startsWith(P)` and `rmSync` — owner-aware at HEAD (the base release's classifier,
    `72ae2f3`, reads no binding, so it said nothing about the use line);
  - shell `S=""; P="<p>-$S"; rm -rf "/tmp/$P"*` — owner-aware at HEAD (nothing at the base release, same reason);
  - shell `P="<p>-u1000-repo-"; find /tmp -name "${P%%-u*}-*" -exec rm -rf {} +` — owner-aware at HEAD (J7);
  - the plain literal line `rm -rf "/tmp/<p>-$S"*` — owner-aware at the BASE release as well: the classifier has always read `$` after the separator as
    an owner. So F12 did not introduce this; it carries it onto traced values.
- **Why.** The barrier's guarantee is "no owner-blind sweeper left". An unresolved owner position is not evidence of an owner; a sweeper whose owner
  variable is empty removes every user's leftovers.
- **Decision needed (the owner's, not this follow-up's).** Whether an unresolved owner position becomes an explicit "unresolved" finding that keeps the
  barrier closed. Cost: every legitimate `<p>-${OWNER}-…` or `<p>-$owner-…` line in every consumer becomes a finding, unless the owner variable is itself
  traced to the owner grammar (`u<digits>`, `w<name>`, the helper). Measure the fleet count first (the machine scan, `--honour-marker`) before deciding.
- **When.** Before the barrier is declared closed on a shared machine, or at the next change to `OWNER_START_RE`.
- **Anchor.** `tools/lib/sweeper-scan.mjs:43` (`OWNER_START_RE`); the traced half is `tools/lib/prefix-bindings.mjs` (`PLACEHOLDER`, `expandReadings`).

## Definition of Done

- [ ] Each of F1 to F15 is fixed with a RED test observed first, or closed with a recorded decision that it stays a documented limit.
- [ ] The companion and the rule's body records match the code (`node tools/rule-bodies.mjs`).
- [ ] `node tools/leftovers-check.mjs` and `node tools/plan-lifecycle.mjs` are clean; this file is promoted or deleted when the
      last item is closed, and its row in `todo/README.md` goes with it.
