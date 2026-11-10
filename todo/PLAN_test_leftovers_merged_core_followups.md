# PLAN — Test leftovers, merged core: follow-ups parked by the security pass

> Status: **plan only, nothing implemented yet, 2026-10-26; F7, F8 and F9 added 2026-10-27; F1 and F9 widened by PR #82's CodeRabbit review, 2026-10-27.; F10 and F11 added 2026-10-27 from the private sibling's review; F12 and F13 added 2026-10-27; F13's fix decided 2026-10-28; F14 added 2026-10-28; F15 added 2026-10-28; F16 added 2026-10-31; F17–F20 added 2026-11-01; F21 and F22 added 2026-11-02; F24 added 2026-11-03; F25 added 2026-11-03 (parked, not to be built now: the owner). F26 added 2026-11-04 (open, the owner's: the private sibling's mirror of the later spans). F27 and F28 added 2026-11-04 (F27 fixed 2026-11-05, not released: a process cap and shim rule for the next planned release; F28 open: release refs for product submodules, other repositories' work). F29 added 2026-11-04 (open: on Windows an exclusive rename has no single winner). F30 added 2026-11-05 (open, with an owner and a proposed deadline: the shipped Node guard has no folding reader). F32 added 2026-11-06 (open: the raw readings of the guard and the sweeper are super-linear on a hostile line, and their time is not promised). F33–F40 added 2026-11-10 from creds' E2 (its notes for the parent N20–N25 and its side findings): F33 and F36 open, conventions' tools; F34 open, creds first; F35 a documented limit for now; F37 open, the C# template's; F38–F40 pointers to creds' todos.** Scope: six low findings of the
> security pass of PR #82 (`research/security/test-leftovers-merged-core.md`, L-1 and L-3 to L-7; its L-2 and M-1 to M-4
> were fixed in the same PR), two test gaps the Opus review of the real-daemon volume fix (9b62ba3) found (F7, F8), and
> the Windows run the owner moved out of the PR's merge conditions on 2026-10-27 (F9), in `tools/lib/leftovers-sweep.mjs`, `tools/janitor.sh`, `tools/leftovers-check.mjs`, `tools/lib/sweeper-scan.mjs` and
> `common/test-leftovers-janitor.md`. Not one of them blocks the release of the merged core (the verdict: "none a reason to
> hold the release").
>
> *Note 2026-11-03: the status line above is the state of 2026-10-26 and was never rewritten. Since then items have been fixed on their own branches, and some released: F16's interim, F21 and F22 are released (`5863c60`, `cc24f9e`); F3 and F24 are fixed and not released (they ride one release); the rest are parked as written. Each item's Progress and Released lines, not this status line, are the current state.*
>
> *Note 2026-11-04: the sentence above covers the line's first claim, "plan only, nothing implemented yet": that is the state of 2026-10-26. The "F… added <date>" clauses after it are kept current, up to F27 and F28.*
>
> *Note 2026-11-03 (what this document is):* it is a register of findings parked by the security pass, not a plan approved as a whole. Each F-item is gated on its own: the recorded plan gates sit under single items — F12 (2026-10-28), F13, F16 (session `ba9ad4f1`, 2026-11-01) and F21 (session `ad098f3b`, 2026-11-02). No plan round and no owner go-ahead ever approved the document as a whole, so `common/plan-change-control.md`'s ledger, which starts at a plan's first approval, is not opened here. Adding an item is filing a finding, and each item's own plan gate approves its fix. If the document is ever approved as a whole, its ledger opens then.
>
> Related docs: [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md) (the plan these findings belong to; promoted 2026-10-27),
> [PLAN_test_leftovers_merged_core_release.md](../research/PLAN_test_leftovers_merged_core_release.md) (the remainder plan: S0, the merge, the sibling's side, the release; none of F1–F13 blocks it),
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
- **Progress 2026-11-03 — fixed on `fix/f3-node-profile-package-scripts`, not released.** Under `--profile node` the guard reads every `package.json` of the repository's own tree
  (`tools/lib/leftovers-package.mjs`): each `scripts` value is one shell line, the finding names the file and the script and takes the line of that key. A manifest it cannot read is one
  `unreadable` finding. A manifest takes no exemption (JSON has no comment). Other manifests (`deno.json`, `pnpm-workspace.yaml`, …) are not read; open an F23 if a consumer has one.

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
- **Also on the Windows run (F17).** `tools/leftovers-sweep.test.mjs` 16e and 16f (a name taken at the quarantine move) must pass on Windows: the plain rename there is unmeasured, and libuv answers EPERM for a rename onto an existing directory (the code treats an entry at the name as taken).
- **When.** Before anyone sets `JANITOR_WINDOWS_E2E_GREEN` on any machine, or when a consumer needs its leftovers swept on
  Windows rather than listed.

## F10 — The guard has no `module-load` class (a consumer's request, 2026-10-27)

- **What.** The rule says a helper never creates a resource at module load (`common/test-leftovers-detail.md:77`, the detail file since the split of 2026-11-01), and nothing checks it:
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
- **Round 8 (CI under V8 coverage):** PR #90's required check ("SonarCloud Scan") runs `npm run test:coverage`, and R6's unclosed-bracket case took 2094 ms there
  against its 1000 ms limit. Reproduced here with `node --test --experimental-test-coverage --test-name-pattern='^R6'`: three cases over the limit. Cause (measured):
  `assignments` read 1024 characters for EVERY match of an assignment shape (`const a = [` x9000, `;a=$(` x16000), although each match lies inside the unclosed
  right-hand side of the one before; 9000-16000 reads of 1024 characters, then `bindItems` re-asked `usesBoundName` of every item each pass. Per case, ms, three runs
  (plain / coverage) BEFORE: bracket 394-420 / 2222-2275, paren 421-442 / 2283-2357, `;a=$(` 631-672 / 2718-2796, `${P_:` 44-45 / 45-47, `${P_%x` 36-37 / 36-37.
  AFTER: bracket 21-26 / 27-33, paren 11-13 / 15-21, `;a=$(` 13-16 / 18-23, `${P_:` 47-60 / 50-53, `${P_%x` 37-47 / 37-38. The limit is still 1000 ms. Fix: (1) a match
  that starts inside a right-hand side that ran to its cut or the end of the line without a terminator makes no assignment, unless the prefix word comes after it inside
  that text (an assignment that holds the word is never lost); (2) the right-hand sides of one line are read to MAX_LINE_READ (16 x 1024) characters in all, past it an
  assignment is returned unread and its name overflows when the word comes after it (broad, the safe direction); (3) `usesBoundName` is cached per item while the set
  of bound names has the same size. R6 is one subtest per case, naming it. R20 and R21 hold the positives (`a=1; P='<p>-'; rm -rf "/tmp/$P"*`, two declarations after a
  closed bracket, an assignment that holds the word inside an unclosed bracket) and the budget. **Limit J8** (header): an alias of a bound name written inside an
  unclosed bracket on one line, with no prefix word after it, is not read. Whole suite, plain and with coverage: 1342 tests, 1336 pass, 0 fail, 6 skipped, both.
- **Fixed** 2026-10-28 on branch `fix/scan-age-sweep-through-variable`, in eight rounds. RED, round 1: the use lines of a same-file binding classified null
  (`actual null, expected 'broad'`) and the guard exited 0 on a file that removes through a bare-prefix variable. RED, round 2: the use of an
  owner-aware concatenation classified broad, `${P:?}` and its kin classified null, and a 100000-character line of the shape `x:` and spaces took 21 s.
  RED, round 3 (against `0dce2ca` → `f7926cd`): the seven literal-first shapes, the same-line alias, the repeated-text span, the 33rd value, and
  five adversarial 100000-character lines (29 s for the first) all failed or were null where `0dce2ca` said broad.
  RED, round 5 (against `5f49dcc`): the use line of each of the five (a) probes and the three (b) probes read null, the case conversions and
  pathlib joins bound nothing, and the unclosed-class line took 10.7 s.
  RED, round 6 (against `65d50c1`): the four B1 probes, the six B2 probes and the 1100-character right-hand side all read null on the use line.
  RED, round 7 (against `cfedbb0`): the 600- and 1000-character right-hand sides, shell and script, read null on the use line.
  RED, round 8 (against `48e4e0c`): R6's bracket, paren and `;a=$(` cases took 2.2-2.8 s under `--experimental-test-coverage`; R20 and R21 failed on the old reading.
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
  3. Rule §3 (`common/test-leftovers-detail.md:124-127`, the detail file since the split of 2026-11-01): the parenthesis names the bound — one child per script or run to learn a
     host constant is allowed (a shell's `getconf CLK_TCK`, read once when the helper is loaded), never a child per test
     process. `node tools/rule-bodies.mjs --update common.test-leftovers-detail` moves the record in the same commit.
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

- **What.** `tools/lib/prefix-bindings.mjs` (`evaluate`, `shellPieces`) binds a value only when ONE literal piece holds the prefix word as
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

## F16 — `owned.mjs` judges a Windows kernel owner by the profile path alone (found 2026-10-31)

- **What.** On Windows, `isMine` (`tools/lib/owned.mjs:209-228`) returns true for any resolved path inside the caller's profile and never reads the
  file's owner. Rule §3 says "on Windows the caller is the file's owner, bash `-O`", and the janitor reads the file owner. A folder or claim inside the
  profile that another account owns (an elevated run's `Administrators`, an account given access) counts as the caller's.
- **Why.** Scope evidence comes from the kernel, not from the name or the path. Path containment is stricter outside the profile and looser inside it.
- **Fix.** Both keys: inside the profile AND the owner SID is the caller's user SID; either one unreadable fails closed (listed, never touched). RED
  first: a fixture inside the profile whose owner is another SID, on the Windows run of F9.
- **Found by.** The question consultant (GPT, consult `0cf2d245`), verified against the code on 2026-10-31. The C# and Rust ports (E3, E4 of the
  rollout), not built yet, must check both keys: a criterion of their producer stage (owner decision 2026-10-31, R6 of the remainder plan).
- **When.** With F9, before a Windows machine's janitor switch.
- **Anchor.** `tools/lib/owned.mjs:209-228` (`isInsideProfile`, `isMine`); `tools/owned.test.mjs` (the path-boundary tests, no foreign-owner case).
- **Interim disposition, decided 2026-11-01: (b) — on Windows the sweep LISTS and changes nothing until the Fix above lands.** Asked
  through the question consultant (consult `3310f6ba`, two vendors, both (b)); recorded in the rollout plan's epoch 2 (§ *Epoch 2* item 4,
  approved by the owner 2026-11-01). Why: the Node consumers E2 and E5 wrap this reference on the elevated hosted Windows runner, where a
  folder inside the profile can belong to `Administrators`; (a) would remove it on the profile key alone, and the Fix needs F9's Windows
  run, which has not happened. The janitor already has this shape (`--dry-run` forced on Windows until `JANITOR_WINDOWS_E2E_GREEN`).
  - **Build.** `sweepLeftovers` (`tools/lib/leftovers-sweep.mjs`, its `platform` seam) on `win32` performs NO mutation in any phase: no
    quarantine restore and no reservation removal, no worktree unlock, remove or prune, no folder rename or removal, no orphan-claim
    deletion. Every resource a POSIX sweep would act on is reported in `result.listed` as `unverified: <path> — the owner SID is not read on
    Windows (F16)`; `removed` stays empty. A pre-existing unverified folder never fails a run: the callers (`tools/run-tests.mjs` and the
    consumers' wrappers) print the listing and go on, as they do with `foreign:` lines. `isMine` itself is unchanged (other callers ask it
    about their OWN fresh resources).
  - **Tests (RED → GREEN → RED each, through the `platform` seam on any OS):** one fixture per kind — a dead owner's folder, an orphan
    claim, a killed sweep's quarantine (and its placeholder), a worktree this repository lists with a gone owner — swept with `platform:
    "win32"`: every path is byte-for-byte unchanged (`(dev, ino)`, contents, the claim's text), each is in `listed` with `unverified:`, and
    `removed` is empty; the same fixtures with `platform: "linux"` are removed as today (the companion); the run-tests caller with a
    listed unverified folder exits 0.
  - **Docs.** Rule §4's detail (one sentence: the reference lists only on Windows until F16), the README tool row (which also drops its
    stale "unmarked and old": the sweep never removes an unmarked folder, the Opus judge's note of the rollout re-review), and this entry.
  - **Release.** Rides the same promotion as the `raw-temp` baseline rule (P2 of the rollout); E2 and E5 pin that release before their
    first producer merges. After the promotion every consumer bumps its pin alone, as in R7, each a PR with its CI as the check, and a revert of the bump is the rollback; only E2 and E5 must bump before their first producer merge.
  - **Plan gate 2026-11-01** (coai session `ba9ad4f1`, `proceed`; findings 0, 1, 3, 4 accepted, 2 rejected):
    - [gate finding 0] What is left on Windows is safe to leave: every kind carries a unique name (owner token, pid, random hex), so no
      later run reuses or depends on it. Test: a new run beside listed leftovers of every kind creates, uses and removes its own
      resources normally.
    - [gate findings 1, 3] The interim is not permanent. The Fix above stays scheduled with F9's Windows run, and the list-only gate may
      be removed only when all three pass there: a caller-owned folder in the profile is removed; a foreign-SID folder in the profile is
      listed untouched; an unreadable owner is listed untouched.
    - [gate finding 4] This repository's CI has no Windows leg. After creds and coai pin the release, their Windows CI legs assert that
      the wrapped sweep lists and removes nothing (a planted gone-owner folder survives): a criterion of E2.1 and of E5's producer.
    - Rejected, finding 2 (fail `isMine` closed on Windows): every caller that changes the disk is inside `sweepLeftovers`, which the
      gate covers; `readClaimText` and `readOwner` only read and also serve the disposal of a run's OWN fresh resource, which a closed
      `isMine` would refuse. A consumer's wrapper never removes anything on `isMine` alone (the docs say so).
- **Progress 2026-11-01 — the interim is BUILT (f885225, RED fc230b4); the Fix is STILL OPEN and rides with F9.** One `mutate` capability, decided once from `platform` in
  `sweepLeftovers`; a verdict that says remove (`withheld`) and the quarantine pass become `unverified: <path> — the owner SID is not read on Windows (F16)`, so no
  mutation runs in any phase and `removed` stays empty. RED observed: `tools/leftovers-sweep.test.mjs` `F16 (folder)`, `(claim)`, `(quarantine)`, `(worktree)` failed on the
  removal (`removed` not empty, the paths changed), `F16 (new run)` on the leftovers removed by the first sweep, `F16 (run-tests)` on `removed 1` and no `unverified:` line.
  Not done: the owner-SID read and both keys (the Fix above), the removal of the list-only gate (its three checks on F9's Windows run), the Windows CI legs of E2.1 and E5, the
  release (P2). The tests run through the `platform` seam on Linux; no Windows machine ran them.
  Second RED (the Opus review, then the legacy case): each gate removed on its own, the pinned tests failed — the quarantine gate: quarantine and new run; the claim gate: claim and new
  run; the judge gate (`withheld` in `judge`): folder, worktree, run-tests and new run. The review's minor point added `F16 (legacy)` (a legacy-name folder and a legacy orphan claim, both
  with a gone owner, read as a win32 reader): it fails with the judge gate off and with the claim gate off, one at a time (legacy and new run fail on the claim gate, legacy on the judge gate too).
  CodeRabbit's finding on PR #107 (accepted): on win32 a `foreign-uid` verdict is only the profile-path proxy (a shared TEMP outside the profile), so it is `unverified` too, never `foreign:`; `F16 (shared root, folder|claim|worktree)` — RED observed (the three failed on the foreign line), GREEN with the gate.
- **Released 2026-11-02** in `5863c60` (#107, `5e077ff9`); every consumer pinned it the same day. The Fix itself stays open with F9.

## F17 — The rename into quarantine can replace an existing empty directory (found 2026-10-31, the E3 and E4 ports)

- **What.** `removeFolderByIdentity` moves a folder into quarantine with `fs.renameSync(dir, quarantine)`
  (`tools/lib/leftovers-sweep.mjs:208`). POSIX `rename(2)` replaces an existing EMPTY directory at the destination, so a directory
  that appeared at the drawn quarantine name is destroyed. Rule §4 (R:179-187) and the janitor's rule say a rename never lands on
  something that appeared there. Both ports measured and fixed it (dew_flow_mcp `Native.RenameExclusively`; dew_flow_sidecar_rust
  `rename.rs`).
- **Fix.** One exclusive move for the quarantine and for the restore. POSIX (Node exposes no `renameat2`): reserve the name with an
  exclusive `fs.mkdirSync(to)` (EEXIST ⇒ draw a new suffix, at most five draws, then keep the folder with one error), capture the
  placeholder's identity, `fs.renameSync(from, to)` onto it (`rename(2)` replaces an EMPTY directory atomically — here our own), and on a
  failed rename remove the placeholder only while it is still our empty directory with the reserved identity (`rmdir`, never recursive).
  `restoreOnto` already reserves this way (S:169-191); the quarantine move reuses it. Windows: the same reservation cannot be used if
  `fs.renameSync` refuses an existing directory there; the move is then the plain rename, which is exclusive by itself — this is
  measured on the Windows run of F9, not assumed, and until then Windows keeps the current behaviour with a comment saying so.
- **RED first.** A hook between the draw and the move plants an empty directory at the quarantine name ⇒ today it is gone after the
  sweep (RED); after the fix it survives with its identity and the folder is quarantined under a fresh suffix.
- **Anchor.** `tools/lib/leftovers-sweep.mjs:159-218`.
- **Fixed** 2026-11-01, 556550c, RED observed: `tools/leftovers-sweep.test.mjs` 16e failed with `ENOENT … lstat '…quarantine-<pid>-aaaaaaaa'` (the empty directory planted at the drawn name was replaced and removed), 16f with `0 !== 1` errors (five taken names destroyed instead of one error); 16g and 16h (the placeholder filled or swapped before the rename) failed on `the quarantine move reserved its name` (the hook never fired: no reservation existed). One `moveExclusively` (reservation, identity re-check before the rename, ENOTEMPTY / EEXIST / EISDIR = taken, `rmdir` of the placeholder only while ours and empty) serves the quarantine move (five draws, then the folder is kept with one error) and `restoreOnto`. The window between the identity check and `rename(2)` is accepted and said in the code (no `renameat2` in Node; only the same user can use it). Windows keeps the plain rename, unmeasured, pointing at F9. Code-gate rounds 1 and 2 (beac06d and the commit after it): the error names the folder (`cannot move <dir> into quarantine: no free name in 5 draws`); POSIX taken = ENOTEMPTY / EEXIST / ENOTDIR, while EISDIR (the source became a file) is thrown, not a draw (16g3); a Windows rename refused with EPERM counts as taken when something is at the name; a `beforeRename` seam pins the ENOTEMPTY path (16g2); an EMPTY quarantine left by a killed renamer (killed between the reservation and the rename) is removed with `rmdir` past the window instead of restored as an empty unmarked folder — only while its original name EXISTS (otherwise it may be a moved empty folder and is restored, 16g5), after a re-lstat for the same `(dev, ino)` (16g6), with a `notice:` line (16g4). A failed Windows rename counts as taken only for EPERM / EACCES with an entry at the target (`isTakenRename`, 16g7). RED observed: 16g2, 16g3 and 16g4 failed on the code of beac06d.

## F18 — The quarantine pass asks the probe about any pid (found 2026-10-31, the E3 and E4 ports)

- **What.** `restoreQuarantines` calls `context.probe(Number(found[2]))` (`leftovers-sweep.mjs:413`) on the pid text of a quarantine
  name with no check: `0` (on POSIX `kill(0, …)` addresses the process group), a leading zero, a value past 2^53, and `windows:1` all
  reach the probe. `ownerState` refuses these as unaskable (`owned.mjs:531-552`, rule §3 R:147-148).
- **Fix.** One exported predicate `isAskablePid(text, platform)` in `owned.mjs`, used by `ownerState` and by the quarantine pass:
  canonical digits (no sign, no leading zero), 1 ≤ pid ≤ 2^53−1, and on Windows never 1. An unaskable pid ⇒ the quarantine stays,
  unlisted beyond its existing `kept` reason.
- **RED first.** Quarantines named with `-0-`, `-007-`, `-9007199254740993-` and (platform win32) `-1-` and an injected probe that
  answers `dead` for anything ⇒ today each is restored (RED); after the fix none is, and the probe is never called.
- **Anchor.** `tools/lib/leftovers-sweep.mjs:406-419`, `tools/lib/owned.mjs:531-552`.
- **Fixed** 2026-11-01, d7a2ec9, RED observed: `tools/owned-liveness.test.mjs` F18 failed with `-0- stays in quarantine` (each of `-0-`, `-007-`, `-9007199254740993-`, and `-1-` on win32 was restored on a probe that answers dead); after the fix the probe is never called. `isAskablePid(text, platform)` is exported from `owned.mjs` and used by `ownerState` and by the quarantine pass.

## F19 — The orphan-claim pass can delete the claim of a folder that sits in a quarantine (found 2026-10-31, the E3 and E4 ports)

- **What.** `sweepOrphanClaims` treats a claim whose folder path does not exist as an orphan (`leftovers-sweep.mjs:376-404`). A folder
  that a LIVE sweep (another process) has moved into its quarantine has no folder at its name for that moment, so its claim is judged
  and, with a gone record, removed — the quarantine, if it is later restored, is then unmarked forever.
- **Fix.** Before judging an orphan claim, skip it when a sibling `.<name>.teststodelete-quarantine-<pid>-<hex>` exists for its name
  (one directory snapshot per pass, not one listing per claim), or when this run's report holds a `quarantine-conflict` for it.
- **RED first.** A claim with a gone record whose folder is renamed into a quarantine with a live renamer ⇒ today the claim is removed
  (RED); after the fix it stays and nothing is listed for it.
- **Anchor.** `tools/lib/leftovers-sweep.mjs:376-404`.
- **Fixed** 2026-11-01, bf3bd4a, RED observed: `tools/leftovers-sweep.test.mjs` 16i failed with `the claim is still there for the restore or the removal that follows` (the claim of a folder held in a live renamer's quarantine was removed); 16k the same for a `quarantine-conflict`; 16j failed on `the claim was about to be removed` (the new `beforeClaimRemoval` seam never fired). The pass skips a claim with a quarantine sibling (one snapshot per pass plus this report's conflicts) and looks again, freshly, immediately before the deletion. Code-gate rounds 1 and 2: immediately before `rmSync(claim)` the folder must still be absent (lstat) AND no quarantine of the name may exist (16l); the root is stamped (mtime and ctime, bigint) BEFORE it is listed and listed again only when the stamp moved, once per removed claim (16m, 16n); RED observed: 16l failed on `its folder is there again: the claim is its claim`, 16o (a quarantine made right after the pass's own listing) on `the quarantine that appeared after the listing keeps the claim`. The window between that look and `rmSync` is accepted (same user only).

## F20 — `readClaimText` can block on a FIFO swapped in between the check and the open (found 2026-10-31, the E3 and E4 ports)

- **What.** `readClaimText` checks `lstat` (`isFile`) and then opens the path (`owned.mjs:470-492`). A FIFO swapped in between the two
  makes `openSync(file, "r")` block forever (no writer), hanging the sweep; a different file swapped in is read as if it were the
  judged one.
- **Fix.** POSIX: open with `fs.constants.O_RDONLY | O_NONBLOCK | O_NOFOLLOW`, then `fstatSync(fd)` must be a regular file with the
  lstat's `(dev, ino)`; anything else ⇒ `{ unreadable: true }`. Windows (no `O_NOFOLLOW`): open, then `fstatSync(fd).isFile()` and the
  same `ino`; a mismatch ⇒ unreadable. Read at most `MAX_CLAIM_BYTES + 1` bytes from that fd.
- **RED first.** A seam between the lstat and the open replaces the claim with a FIFO ⇒ today the call does not return within 5 s (RED,
  run in a child with a timeout so the suite cannot hang); after the fix it returns `{ unreadable: true }` at once. A regular file
  swapped in ⇒ unreadable.
- **Anchor.** `tools/lib/owned.mjs:465-492`.
- **Fixed** 2026-11-01, 733c781, RED observed: `tools/owned.test.mjs` F20b failed with `readClaimText did not return within 5 s: it blocked on the FIFO` (the read runs in a child with a 5 s timeout); F20a failed with `another file took the name between the look and the open` (the swapped-in file was read as the judged one). `readClaimText` opens with `O_RDONLY | O_NONBLOCK | O_NOFOLLOW` on POSIX and checks the descriptor (`fstat`: regular file, the lstat's `(dev, ino)`) before any read, on every platform.

F17–F20 land together, with their tests, as one change released once (R7 of the remainder plan); the consumers that wrap the
reference (coai E5, creds E2, the private sibling) take it with that pin. The ports E3 and E4 already behave this way.

## F21 — The identity and exclusive-move helpers are private, so a consumer's clean-up copies them (found 2026-11-02, coai E5.S2-A)

- **What.** `identityOf`, `isOwnEmptyPlaceholder`, `removeOwnEmptyPlaceholder`, `moveExclusively` and `moveToQuarantine` in
  `tools/lib/leftovers-sweep.mjs` (~:133-270) are not exported, and they read `fs` and `process.platform` directly. coai's one-off
  clean-up of old-prefix leftovers (E5.S2-A, `scripts/lib/old-coai-leftovers.mjs`) needs exactly this behaviour, with seams for its
  failure tests (an `io` that throws, a platform), so it carries a copy (~70 lines).
- **Why.** The reuse-first rule: a second implementation is a defect from the moment it compiles, because the two drift. coai's code
  gate (session f478a03b, round 5, findings 2, 8 and 9) accepted removing the copy. Decision 11 already makes the pinned mount the Node
  consumers' interface to the reference.
- **Fix — widen, behaviour unchanged.** Export the five helpers. Each takes an optional last argument `{ io = fs, platform =
  process.platform }`; every `fs.` call inside them goes through `io`, and the Windows branch reads `platform`. The sweep's own calls pass
  nothing, so its behaviour and its tests are unchanged. `isTakenRename` stays as it is (already exported, already takes `platform`).
- **Tests (RED → GREEN → RED):** a test imports the five names (RED: not exported); for each, an `io` seam proves the calls go through
  it (a throwing `renameSync` reaches `moveExclusively`'s failure path; a `rmdirSync` spy sees the placeholder removed only when it is
  our empty reservation); a `platform: "win32"` seam takes the Windows branch on Linux; the whole existing sweep suite stays green with
  no change (the default arguments keep today's behaviour).
- **Docs.** The README tool row of `tools/lib/leftovers-sweep.mjs` names the exported helpers; the header comment says they are the
  family's one implementation and consumers import them, never copy them.
- **Release.** Rides the same promotion as F16 (#107) and the `raw-temp` baseline (#108). coai then deletes its copy and imports these
  after its pin bump (E5.S2-A, before that PR merges).
- **Plan gate 2026-11-02** (coai session `ad098f3b`, `proceed`; 0 and 1 accepted, 2 rejected — RED → GREEN → RED is the family's check,
  the suite ends green): [gate finding 0] the options object is forwarded through every internal call between the five helpers, with a
  test that a mocked `io` given to `moveToQuarantine` is the one the inner helpers use; [gate finding 1] inside them `isTakenRename` is
  called with `options.platform` (a string), its own exported signature unchanged, tested through `moveExclusively`'s taken path on
  `platform: "win32"`.
- **Progress 2026-11-02 — the helpers are EXPORTED (feat 657b311, RED fa661ea; test tightened 42239d6).** `identityOf`, `isOwnEmptyPlaceholder`, `removeOwnEmptyPlaceholder`, `moveExclusively` and
  `moveToQuarantine` take a last `{ io = fs, platform = process.platform }`; the options object is forwarded through every call between them and `isTakenRename` is called with the platform
  string. The sweep's own calls pass nothing: `tools/leftovers-sweep.test.mjs` is unchanged and green (59 tests). The new tests are in `tools/leftovers-sweep-helpers.test.mjs` (a new file: the
  sweep's test file is already past the 800-line limit). RED observed: with the module as on main all 11 failed (not exported); GREEN with the change; RED again with the change stashed
  (0 of 11 pass, the sweep suite still 59). Each forwarding point was also dropped on purpose, one at a time (`moveToQuarantine`, the placeholder check inside `moveExclusively`, the
  failure-path remover, `isTakenRename` given the options object, the check inside `removeOwnEmptyPlaceholder`): each is caught by a test. The last one was NOT at first, so test `d` was
  tightened (42239d6). Docs: the README tool row and the module header say the helpers are the family's one implementation. Not done: the release (rides F16 and the `raw-temp`
  baseline), coai deleting its copy after its pin bump. The Windows branch ran only through the `platform` seam on Linux; no Windows machine ran it.
  [code gate 0] (accepted) The exported `platform` option let a consumer on POSIX force the Windows direct-rename branch with the REAL fs, where `rename(2)` replaces an empty
  directory and breaks the exclusive-move contract. `moveExclusively` now throws a clear error BEFORE any rename when `platform === "win32"`, the real `process.platform` is not
  `win32` and `io` is the real fs (the `fs` namespace or its default export); an `io` of the caller's own keeps working, so tests i to k are unchanged. `moveToQuarantine` reaches it
  through `moveExclusively`; no other code decides an fs operation on `platform`. Test `F21 l` (three forms: namespace, default export, no `io`): RED first (e2ab09e, 3 failed), GREEN
  with the guard (d02d6c5), RED again with it stashed (3 failed, the other 11 pass).
- **Released 2026-11-02** in `5863c60` (#109, `5863c60d`); every consumer pinned it the same day. coai's E5.S2-A imports these helpers and drops its copy.

## F22 — The reference sweep only sweeps its own token, so no wrapping consumer can collect its own folders (found 2026-11-02, creds E2.1)

- **What.** `relationOf` (`tools/lib/leftovers-sweep.mjs` ~:75-82) compares every name's token with the module's own `REPO_TOKEN`
  (`conventions`), and `sweepLeftovers` takes no token. `ownedFor({ token, row })` binds the token for naming, folders and worktrees,
  but not for the sweep. A consumer that wraps the reference (decision 11: creds E2, coai E5's Node runners) therefore sweeps
  nothing of its own: measured by the creds E2.1 coder — a dead-claimed `creds` folder beside a dead-claimed `conventions` folder in
  one private root; only the `conventions` one was removed.
- **Why.** Decision 11 makes the wrapped reference the Node consumers' only sweep; without this, a killed run's folders are never
  collected by a Node consumer, and copying the sweep to change one constant is the reuse-first defect F21 just removed.
- **Fix — widen, behaviour unchanged for this repository.** `sweepLeftovers({ ..., token = REPO_TOKEN })`: the given token
  replaces `REPO_TOKEN` in the name relation (owner-form and legacy names alike), validated by the same `checkToken` as
  `ownedFor`; an invalid token throws before anything is read. This repository's own call sites pass nothing. The F16 Windows
  list-only gate and every other check are unchanged.
- **Tests (RED → GREEN → RED):** a private root with a dead-claimed `creds` owner-form folder and a dead-claimed `conventions` one:
  `token: "creds"` removes only the `creds` one (RED today: it is kept), the default removes only the `conventions` one (the
  companion); a `creds` legacy name is `legacy:` under `token: "creds"` and `other` under the default; an invalid token throws and
  nothing is read; on `platform: "win32"` the `creds` folder is `unverified:`, untouched (F16).
- **Docs.** The README tool row and the module header say the sweep takes the consumer's token; the detail §4 needs no change (it
  already says each repository sweeps its own token).
- **Release.** A release of its own, then the pin bumps of the consumers that sweep through the reference (creds first, for E2.1);
  E2.1 merges only after creds pins it (rollout ledger 2.1).
- **Progress 2026-11-02 — the sweep takes the consumer's token (fix f4431a8, RED a9e3198).** `sweepLeftovers({ ..., token = REPO_TOKEN })`: `relationOf` compares owner-form and legacy names with the
  given token; `checkToken` (the check `ownedFor` uses) is exported from `tools/lib/owned.mjs` (and listed token-free in `ownedFor`'s bound API, which a test enumerates; 95ca8b5) and called first, so an invalid token throws a TypeError before the root, the repository, the probe or a hook is
  touched. This repository's own calls pass nothing; the F16 gate, the never-throw error handling and the order are unchanged. The tests are in `tools/leftovers-sweep-token.test.mjs` (a new file: the sweep's test
  file is past the 800-line limit). RED observed with the module as on main: 4 of 5 failed (a: the `creds` folder was kept; c: no `legacy:` line; d: an invalid token did not throw; e: the `conventions` folder was
  listed `unverified:` instead of the `creds` one); the companion b (the default removes only the `conventions` folder) passes on main by design. GREEN with the change (5 of 5; the sweep suite and the F21 helper tests
  unchanged, 73 pass). RED again with the lib stashed to main (4 of 5 failed, the sweep and helper suites still 73 pass). Docs: the README tool row and the module header say the sweep takes the consumer's token. Not done: the release and
  the consumers' pin bumps (creds first, for E2.1). Not tested: the token reaching the worktree, orphan-claim and quarantine relations (they call the same `relationOf` with the same `context.token`; only folders and
  legacy names have a test).
  [PR review, CodeRabbit] (accepted) The exported `checkToken` is documented to return the token but returned `undefined`, so `sweepLeftovers({ token: checkToken("creds") })` fell back to `conventions`. It now returns the
  validated token (`ownedFor` and the sweep ignore the value). Tests `F22 f` (returns the token, still throws) and `F22 g` (the passed-through token removes the creds folder): RED first (2 failed), GREEN with the change,
  RED again with `owned.mjs` back to the previous commit (2 failed, the other 5 pass).
- **Released 2026-11-02 — `cc24f9e`** (promote-release run 41523829952; merged as #112 `edfcdc2`, with #110 and #111). The owner
  agreed again to the seven over-cap pin bumps, for this release only (consult `4d631b36` first). Before the promotion the creds
  call site was checked locally: `sweepLeftovers({ ...args, token: "creds" })` through the creds wrapper removed a dead `creds`
  folder with no errors. The pin bumps, each alone: creds #293 (`bfc5348`), vscode_kit #22 (`e31394c`), mcp #63 (`b8a508e`),
  sidecar_rust #69 (`c00fd93`), rag_qln #81 (`b40c0ae`, with its two externals moved to their new tips), wsl_care #185
  (`edf764b`), coai #941 (`a3b7353`), dew_flow_amd_r9700_tuning_ai #4 (`255aeac`, with its vendored `owned.mjs` and
  `leftovers-sweep.mjs` refreshed, as its `check_static.sh --vendored` requires), dew_flow_benchmark #152 (`c466652`). creds E2.1
  is wired to it (draft PR creds #294).

## F24 — The raw-temp baseline's proof asks for a test "ordered first", which no parallel test framework can give (found 2026-11-03, the rollout's epoch 4 re-review)

- **What.** `common/test-leftovers-baseline.md` (the *The `raw-temp` baseline* paragraph) made a scope *proven* by three things; the third was
  "a test per assembly or package, **ordered first**, asserts that `TEMP` names the run folder and carries `testsToDelete-baseline-proof: <scope root>`".
  xUnit v3 runs collections in parallel (`maxParallelThreads`), and no test framework the family uses has a portable "first test of the assembly",
  so coai's four C# suites cannot meet the clause as written.
- **Why.** What the clause guards — no test runs outside the run folder — is better given by a PROCESS-WIDE gate that runs before discovery and
  refuses the run (coai E5's gated custom `Main`: exit 78, one line). A rule a consumer cannot meet is a rule it works around. The guard's code never
  encoded the order: `proofFailure` and `isTestFile` (`tools/lib/raw-temp-baseline.mjs`) only check that the proof is a test file this scan discovered
  and carries the marker for exactly its root (confirmed by reading; no behaviour change).
- **Fix — the rule text only; the marker, the three things and the guard are unchanged.** The second thing ("a run that cannot make it fails before any
  test") is met by a process-wide gate that runs before test discovery, refuses the run with one line and a non-zero exit when the folder cannot be made
  or claimed, and also when `TEMP`, `TMP` or `TMPDIR` do not name it. The third thing loses "ordered first": the test is NOT required to run first, and the
  text says why (parallel test collections have no first test). [plan gate, finding 0] The text says who verifies what: the guard checks only the marker;
  the first two things are proven by the consumer's own tests — a child run of the suite with a forced folder failure and a forced claim failure must exit
  non-zero before discovery — and by review; a repository with no such gate does not satisfy the proof and may not carry a baseline.
  [F24 Opus 1–3, 2026-11-03] The child runs are three (a forced folder failure, a forced claim failure and a forced `TEMP`/`TMP`/`TMPDIR` mismatch) and live IN the
  scope's proof file, so removing them changes the one file the baseline names; a Never bullet forbids weakening or removing the gate or those tests while a baseline names
  its scope. The child runs prove the SECOND thing only; the first (the runner makes the folder before the first test) is proven by the marked test's `TEMP` assertion and by
  review. "One line" belongs to the gate's description, not to the verification. "Ordered first"
  [F24 PR review, CodeRabbit, 2026-11-03] A gate could check one of `TEMP`, `TMP` and `TMPDIR` and miss another, so the rule now requires each of the three mismatched on its own
  (five child runs in all: a folder failure, a claim failure and the three single-variable mismatches), each exiting non-zero before discovery; `S1 10` pins that wording
  (RED first on the old text, 1 failed).
  appeared only in the baseline companion (grep over `common/`, `tools/` and the README).
- **Tests (RED where text is pinned → GREEN → RED):** `S1 10` of `tools/test-leftovers-rule.test.mjs` pins ten new phrases of the companion and that
  "ordered first" is gone. [plan gate, finding 2] Test 42 of `tools/raw-temp-baseline.test.mjs` is a companion, green before and after: a fixture with
  a proof that sorts last by name (`zz-proof.test.mjs` after `aa.test.mjs`) and one that sorts first, neither with any ordering attribute, are accepted;
  without the marker the same tree is `proof missing`. It pins that ordering never becomes a code check.
  [F24 Opus 4] `S1 10` also refuses `ordered`, `sorted` and `runs first` anywhere in the proof clause (the one allowed phrase is `NOT required to run first`), so "ordered before
  discovery" or "runs first" cannot come back: RED observed by planting each in the text (1 failed), GREEN with them removed.
- **Docs.** The companion; `research/rule-bodies.json` (the record of `common.test-leftovers-baseline`); the byte table of `research/module_rules.md`
  (re-measured: +1,214 B on the companion); the guard's two header comments and the guard paragraph of `research/module_tests.md` say the guard checks the
  marker only.
- **Release.** ONE release with F3, and coai pins that release before E5's S6 creates its baseline (rollout plan § Epoch 4, items 2 and 5). E5's S6 runs
  the acceptance check against the released guard.
- **Progress 2026-11-03 — the rule text is changed on `fix/f24-baseline-proof-gate`, not released.** RED observed with the tests only (62 of 63 pass: `S1 10`
  fails on the ten missing phrases; test 42 passes by design); GREEN with the text (63 of 63); RED again with the companion stashed (1 failed, the same
  test). `node tools/rule-bodies.mjs --update common.test-leftovers-baseline` recorded the body. Not done: the release, the pin bumps, E5's acceptance check.

## F25 — A consumers test leaves its scratch repository behind — possibly because its locked folder is restored only after the removal (found 2026-11-03, a benchmark session's leftover listing)

- **What.** Eight `/tmp/testsToDelete-u1000-conventions-consumers-<rand>` folders and their `.owner` files are in the temp root of the WSL host, made on
  2026-11-03 between 12:20 and 18:21; every owner pid is gone. Each is a scratch git repository of `tree()` in
  `tools/leftovers-check-consumers.test.mjs:21-29` (`ownedDir(t, "consumers")`) and holds `locked/package.json` and `src/a.test.ts` — the fixture of the
  test at `:509-513`, which sets `locked/` to mode `000` and registers `t.after(() => fs.chmodSync(locked, 0o755))`.
- **Why (a hypothesis, not yet confirmed by a RED run).** The folder's removal is registered when `ownedDir` makes it (`tools/lib/owned.mjs`,
  `scope.after` right after the claim), BEFORE the test registers its chmod. If `node:test` runs a test's `after` hooks in registration order, the
  removal meets `locked/` at mode `000` and fails, and the chmod then restores `0o755` — which is the state every leftover shows (`locked/` is
  `drwxr-xr-x` and still holds `package.json`). *Checked:* the eight folders, their owners and their contents, and the two source lines. *Not checked:*
  the hook order on this Node version. *Known from the code:* a failed removal is not silent — `removeQuietly`
  (`tools/lib/owned.mjs:606-615`) warns `could not remove <dir> … left for the start-of-run sweep` and keeps the claim; whether that warning is
  visible in the test output, and whether CI checks it, is NOT checked. Also not checked: why the start-of-run sweep did not retire the eight folders
  later, since their `locked/` is now `0o755` and every owner is gone.
- **Fix (to decide when it is built).** First check the `after` hook order of `node:test` on the supported Node version. Then either the test restores the mode in its
  own `try`/`finally` before the hooks run, or the owned folder's removal first gives every folder of the tree `u+rwx` (`0o700`: `u+w` alone cannot
  list or enter a folder at mode `000`) and names what it still could not remove. The second also covers any other test that locks a folder. With
  either fix the removal succeeds BEFORE the test's own `t.after(() => fs.chmodSync(locked, 0o755))` runs, so that hook would throw `ENOENT`: the
  fix also drops that hook or skips the chmod when `locked/` is gone.
- **Tests.** RED first: run the one test and list `testsToDelete-u<uid>-conventions-consumers-*` before and after (one more folder); GREEN with the
  fix; RED again with the fix taken out.
- **State.** Parked by the owner on 2026-11-03 ("open it as a todo, do not build it"): the owner's goal now is the C# and Node comparison. The eight
  folders stay as evidence until the fix is built; they carry the `testsToDelete-` prefix, so a sweep or a person may remove them at any time.

## F26 — The private sibling's mirror of the rule spans that changed after `2602416` is not recorded (found 2026-11-04, the remainder plan's re-review)

- **What.** R4 of the remainder plan (now `research/PLAN_test_leftovers_merged_core_release.md`) recorded the owner's written
  confirmation that the private sibling's copies and rule spans equal this repository at `2602416`. Two later releases and one
  unreleased change on `main` changed the spans the sibling mirrors: `105d53c` (#102) moved the two spans into `common/test-leftovers-detail.md` and added a new core
  span in `common/test-leftovers.md`; `5863c60` (#108) added the `raw-temp` baseline span (`common/test-leftovers-baseline.md`);
  and F24 (#119, on `main`, not released yet) changed that baseline span after `cc24f9e`. No confirmation is recorded for any of them. The rollout plan names the
  baseline's mirror "the owner's (R4)", but R4 is closed and covered `2602416` only.
- **Why it matters.** One text in two rule repositories is the point of the merged core (R4's own reason): a drift is found by a
  consumer, late.
- **Fix.** Not code. The owner confirms in writing, as R4 did, that the sibling's spans and copied tools equal this repository at
  the first release that carries F24 (or a later one), naming the sha256 of each span and file; the values are recomputed here and recorded under this item.
  The rollout plan's own DoD line for the baseline mirror is ticked from the same record.
- **State.** Open, the owner's. Found by the Opus judge of the remainder plan's re-review (2026-11-04); it was a gap before the
  hand-over, not one the hand-over made.
- **Due, 2026-11-05: the values at `bd79584`, awaiting the owner's confirmation.** `release` is at `bd79584`, which carries F24 and F3, so the
  confirmation is due now. These are computed here and NOT yet confirmed: nothing below says the private sibling holds them. Each value is
  `git show bd79584:<path> | sha256sum`; each span is the LF text between `<!-- core:begin -->` and `<!-- core:end -->`, computed the way R4's were
  (the 1872-byte span and the two files marked *same as R4* equal the values R4 recorded, which is the check on the method).
  - the core span of `common/test-leftovers.md`: 8560 bytes `16b5e6fe2b4b2dba62bc0bce69b9a6bb7395d6f8126788aa844f07666bb047ce`
  - the two spans of `common/test-leftovers-detail.md`: 27750 bytes `f9aca053d97465a73600af31ec66a146103aa0973c5500dd1432ff25bc1027fb` and 1872 bytes `f136caee10af20c47512c2feda2e749d2495fbd5d04081dee3b244c0d3e2522f` (*same as R4*)
  - the span of `common/test-leftovers-baseline.md`: 10114 bytes `e1f93f7af81bc0414bb3dfdbd37dd7d5263e68cd6ebd6954ae48921744fb36cb`
  - the janitor companion's span, `common/test-leftovers-janitor.md`: 14219 bytes `55a0bcc696842f9b2e91cdf5cf6206bf6abdd7f3fe3df3c3728d7cffc246eeef`
  - `tools/lib/owned.mjs` `a55298df718725d8cdc88f17a7fbd1392a28b7c5b1c63f9a0dae17ac26e3fd32`
  - `tools/leftovers-check.mjs` `4d5e2bbab5144f2e9137645220f4ba4d0639f3b252c3b863c3cce1ae3c8c2f7c`
  - `tools/lib/sweeper-scan.mjs` `7f93b14eeffb0642d860ebc2d62a2ba558157b05add0940f464c794fefc1c564` (*same as R4*)
  - `tools/lib/prefix-bindings.mjs` `34d2b01ab7f2c8fda627aef227909a1af86be1f6c8573860619b851681259e43` (*same as R4*)
  - `tools/lib/rule-body.mjs` `ca25fbfc2a6ef1beefe6b9323a62a25185db11e60407ef2500ea278afe848d5c`
  - the rest of what the guard, the scan and the janitor need, read as the import closure of `tools/leftovers-check.mjs` and `tools/sweeper-scan.mjs`: `tools/janitor.sh` `842386b8cd366d701d70e2e72e1cc65ceb003aa7c05388be2e0a858daa02f0c5`, `tools/sweeper-scan.mjs` `afa12ccaa8da4ac65ac0ba055752a44a2fdf47c817f7108659430497662828f8`, `tools/ownership-check.mjs` `7a3fe06089f9b9d27bc0029e064be8e6ee9ae17229752adaf061ecf98bf8a62d`, `tools/lib/git.mjs` `ed0c78156d864106f20694e41dedfb1419ff38e6f03685276bfae0613207c3b5`, `tools/lib/leftovers-cli.mjs` `164b3461f3b4d7e9bb0055fcf6d16933df3ed7da879692be0395702c1c63df9d`, `tools/lib/leftovers-docker.mjs` `524a20d27eed47eb4f6770e073d36fb804e78584bbd912711bf7623c393e09ae`, `tools/lib/leftovers-package.mjs` `e911e83de65253a089f8d5f4fc8d17c627f7f451a035dd80c71050f0781e636d`, `tools/lib/leftovers-shell.mjs` `0fb5348824e9158989cdb72f2ca04d5e62f81c7ea76ce069d525222a2eb6fa2d`, `tools/lib/owned-token.mjs` `a1d2e94e4e087d449069e71b4179d6f9b2c2499460bf1d8c918c1f0e9dc444bc`, `tools/lib/raw-temp-baseline.mjs` `5d7080c84022a6149e32dc2d8b19c85b78b59ffac6d7d7fb1da9fc37f9dbb06d`.
  - the data files those tools read at run time, which an import closure cannot see (CodeRabbit on #131; the swept method is every `readFileSync` and `.json` in the list above): `tools/fixtures/owner-blind-allowlist.json` `7d729c0a8ca9d1668e2e6187b8e8af33155af4bf5899585165d21193a8bbb3a3` (it decides which lines of `tools/janitor.sh` pass `owner-blind`), `tools/fixtures/owner-vectors.json` `dd47763e6957d3947f758fa92b0878be60670a3437da445eef6afe4ad4eff12c` (the merged-core plan's S6 says the sibling copies it byte for byte). Everything else they read is the consumer's own tree or `/proc`.
    *Checked:* this repository at `bd79584`. *Not checked:* which of these the private sibling copies (R4 named five and "the other seven" without names, and that list is not in this repository), and the sibling itself (another owner's repository, not on this machine). A later release that changes one of these moves the values; recompute at the release being confirmed.

## F27 — No family rule bounds the processes a test file may start, or stops a test shim from running itself (found 2026-11-02, the r9700 fork storm)

- **What.** On 2026-11-02 a test shim in the r9700 repository put a `python3` in front of `PATH`, then looked up the "real"
  `python3` through the same `PATH`, found itself, and ran itself without end: about 15,900 processes, and the session crashed.
  No rule of this family asks a test runner to bound process creation, or asks a shim to resolve the real program outside its
  own folder, so any repository with a custom runner or a `PATH` shim can do the same.
- **What exists.** The r9700 repository fixed it on its own side (read on its `main`, `2f8cd71`): `tests/run.mjs:14-18` runs each
  test file under `ulimit -u <cap>` (the user's thread count at the start plus a headroom), watches the file's session and fails
  the file with `process cap reached (<cap>): a test forks without end`; `tests/test_runner.sh:274-286` proves it with a guarded
  fork fixture; `tests/test_moe.sh:650-653` looks up `python3` with the shim folder removed from `PATH` and refuses a result
  inside it. Linux counts every THREAD of the user against `RLIMIT_NPROC`, so the kernel limit is not a per-file quota on its
  own; the session watch is what makes it one.
- **Fix (decided 2026-11-04, the question consultants, `867ea464`, both answers).** A short addition to the existing testing
  rule (`common/testing.md`), for repositories with a custom test runner or a `PATH` shim: (1) a runner bounds the processes of each test file and
  fails the file when the bound is reached; (2) a shim resolves the program it wraps outside its own folder and refuses to
  resolve to itself. It cites the r9700 implementation as the model and says the platform limit (`RLIMIT_NPROC` counts the
  user's threads). No new framework. It goes into the **next planned release** of this repository, not a release of its own,
  and it is **not** a prerequisite of the rollout (it does not block any epic of the rollout: no producer depends on it; when it was decided, adding it would also have been a plan change of the rollout).
- **Tests.** The rule's own checks: `node tools/rule-bodies.mjs` and `node tools/ownership-check.mjs` clean with the new text;
  a rule test that the new section is in the body (RED before the text is added). Adoption in other repositories is their own
  work, scheduled apart from this item.
- **Progress 2026-11-05 — the rule text is changed on `feat/f27-test-process-bound`, not released.** RED observed with the test
  only: `node --test tools/testing-rule.test.mjs` printed 8 failed of 8, seven with `common/testing.md has no section ## A runner
  bounds what a test file may start, and a shim never resolves to itself — the section F27 writes` and the Definition of Done case
  with its missing phrase. GREEN after `common/testing.md` gained the section and the Definition of Done line: 8 of 8. The record
  was moved with `node tools/rule-bodies.mjs --update common.testing` (`DRIFT common.testing` before, `OK — 41 rule(s)` after);
  `node tools/ownership-check.mjs` and `node tools/selection-matrix.mjs` are clean. Re-measured with
  `node tools/selection-matrix.mjs --bytes`: `common/testing.md` is 26,822 B (+2,123 B), the `implement`, `test`, `audit` and
  `policy` cells moved +2,123 B each, `release` 283,766 → 285,889 B; `research/module_rules.md` carries the table and
  `research/module_tests.md` the RED-GREEN-RED.
- **Progress 2026-11-05 — the review, on the same branch, not released.** The text now says that the kernel limit alone fails
  nothing (a fork past it gets `EAGAIN`) (corrected 2026-11-05: the fork is refused and what the program does then is its own;
  nothing names the bound) and that the session watch must fire well below the headroom; that a shim resolves the
  program it wraps once, at install, with its own folder removed, compares REAL paths and bakes the result in; that the fixture
  lives outside the folder the runner discovers and refuses to start without an enforced kernel limit; and that root and the
  capabilities that exempt a process from the limit have the watch alone. The suite is 7 cases: RED on the first commit's text
  was 3 failed of 7 (14 pins missing in the saying case, three limit pins, `by real path` in the Definition of Done line), GREEN
  after the text 7 of 7. The record moved again with `node tools/rule-bodies.mjs --update common.testing`
  (`12bc098b61be → a426215c3131`). Re-measured with `node tools/selection-matrix.mjs --bytes`: `common/testing.md` is 27,762 B
  (+3,063 B over the released text), the `implement`, `test`, `audit` and `policy` cells moved +3,063 B each, `release`
  283,766 → 286,829 B; the `api/a.http` row moved with it, so its four `OVER` values in `tools/selection-matrix.mjs` and the
  four `why` strings of `research/selection-matrix.json` were set to the new cells (63,188, 65,401, 66,661 and 68,387 B).
- **Deviation from the Fix bullet.** The Fix says the rule "cites the r9700 implementation as the model". `common/rule-ownership.md`
  forbids naming a repository in a shared rule, so the text says "one repository here, 2026-11-02" and this register keeps the
  address: `tests/run.mjs`, `tests/test_moe.sh` and `tests/test_runner.sh` on the r9700 `main`; the lookup and refusal are
  `tests/test_moe.sh:652-653` (function head 648, comment 650-651), identical at `2f8cd71` and today's `3b3d3eb`; the cap tests are
  `tests/test_runner.sh:274-304` (the guarded run 278-291 with the count-back at 289-290, 289 the loop and 290 the assertion, 291 the closing brace; the fixture's refusal test 293-304), not
  274-286.
- **Todo, the example repository's own (not built here).** its shim compares spellings, so a linked `PATH` entry pointing at the
  shim folder gets through (verified: realpath says it IS the shim); its fixture checks the switch and a finite hard limit but not
  that the limit is enforced, so under root or `CAP_SYS_ADMIN`/`CAP_SYS_RESOURCE` it runs unbounded; its watch fires at half the
  headroom and that fraction is its own choice; its fixture's guard allows any hard limit up to its own number (20000) and
  reads the limit (`ulimit -H -u`) but not who set it, so on a machine whose default hard limit is at or under that number it
  runs with no runner cap; where the default is above it (176,539 measured here) it refuses, by the number's accident, not by design.
- **Progress 2026-11-05 — the second review, on the same branch, not released.** The text now says that nothing NAMES the bound at
  the kernel limit (the fork is refused and what the program does then is its own; measured: one program dies, another goes on),
  that the cap must be small enough that the machine survives reaching it, that a shim resolves at its FIRST install, a later
  install keeps what the first one baked and nothing looks the program up at run time (baking alone left the two-shim walk open),
  and that the fixture refuses unless the cap in force is the runner's own, because a distribution's default is enforced too.
  The suite is 7 cases: RED on the previous commit's text was 1 failed of 7 (9 pins missing in the saying case; the full root
  clause was already in that text, so the limits case stayed green), GREEN after the text 7 of 7. The record moved with
  `node tools/rule-bodies.mjs --update common.testing` (`a426215c3131 → 76ee721ca9f9`). Re-measured with
  `node tools/selection-matrix.mjs --bytes`: `common/testing.md` is 27,953 B (+3,254 B over the released text), the `implement`,
  `test`, `audit` and `policy` cells moved +3,254 B each, `release` 283,766 → 287,020 B; the four `api/a.http` values of `OVER` and
  the four `why` strings of `research/selection-matrix.json` are now 63,379, 65,592, 66,852 and 68,578 B.
  A third review the same day restored "enforced": the fixture's cap must be the runner's own AND enforced (so not under root or
  the exempting capabilities), or its refusal there, which the limits paragraph promises, would be false (RED 1 failed of 7, GREEN
  7 of 7; `76ee721ca9f9 → 55fe34518846`); `common/testing.md` is then 28,016 B (+3,317 B over the released text), `release`
  283,766 → 287,083 B, and the four `api/a.http` values are 63,442, 65,655, 66,915 and 68,641 B.
- **State.** Fixed, not released; queued for the next planned release.

## F28 — A product's submodule pin follows another product's `main`, so every merge there makes the consumer's pin check red (found 2026-11-02, rag_qln)

- **What.** rag_qln pins `external/dew_flow_mcp` and `external/dew_flow_benchmark` with no `branch` setting in `.gitmodules`, so
  `tools/pin-check.mjs` compares each pin with the remote's default branch, `main`. Each merge in either repository makes every
  open rag_qln pull request red until a pin bump lands (seen on rag_qln #80 and #81). This is the failure `pin-check.mjs`'s own
  header records for the shared rules before 2026-09-14, which `branch = release` fixed for them.
- **What exists.** `pin-check.mjs` already reads `submodule.<name>.branch` (its header, lines 9-12). Neither dew_flow_mcp nor
  dew_flow_benchmark has a release branch today (`git ls-remote`, 2026-11-04: `main` only, plus one benchmark tag).
- **Fix (decided 2026-11-04, the question consultants, `867ea464`, both answers).** Not code in this repository: (1) each upstream
  product gets a release ref that a person moves deliberately to a tested commit; (2) rag_qln sets `branch = <that ref>` for
  both submodules, in a form `tools/pin-check.mjs:77-78` reads: a plain name is a BRANCH (`release` means
  `refs/heads/release`), and a tag must be written in full (`refs/tags/vX.Y`, since a plain `vX.Y` is read as a branch); (3) a rag_qln pull request bumps the gitlinks and builds and tests the whole solution, because rag_qln
  compiles those projects and a release label does not prove they still fit. A ref that follows `main` by itself solves
  nothing. Bumps are still needed at each promotion; this cuts the churn, it does not remove it. No release of this repository
  is needed.
- **State.** Open, the work of the rag_qln, dew_flow_mcp and dew_flow_benchmark sessions. Not a rollout prerequisite.

## F29 — On Windows an exclusive rename has no single winner, so two sweeps at once can report falsely and restore an unclaimed folder (found 2026-11-04, E5's S2-B race test)

- **What.** Measured on a hosted `windows-latest` runner (coai run 41873954643, a bare .NET console, no project code): two threads race
  `Directory.Move(src, a)` against `Directory.Move(src, b)`, 40000 times. **Both calls succeeded in 39951**, with one destination
  left and `src` gone; the loser, in the other 49, got `DirectoryNotFoundException`. `MoveFile` opens the source and renames by handle, and refusing
  an existing destination does not make the source single-owner.
- **Who assumes otherwise.** dew_flow_mcp's C# template (`Native.RenameExclusively`, used by `LeftoversSweep.MoveToQuarantine`) and its copies;
  dew_flow_sidecar_rust's sweep (`rename::move_without_replace`, `MoveFileExW` with no flags, `src/test_scratch/sweep.rs:147-148`): read only, not
  measured there. The Node reference's Windows sweep lists and changes nothing today (F16 interim), so **F16's Fix must read this item
  before it arms a Windows removal.**
- **What it does, read in the template's code.** With two sweeps at once on Windows: (1) the sweep whose quarantine name holds nothing
  finds it absent, `RemoveEntry` treats that as success, and it reports a removal it did not do; (2) when one sweep has deleted the claim and the other has not
  yet checked, the other's `ClaimUnchanged` fails and it restores the folder under its old name, without a claim and possibly half-deleted; later
  sweeps keep it as `unmarked`. No wrong deletion was found: what is removed is the judged folder. Exposure today is small: hosted runners run one suite at a
  time and are discarded, and the owner's Windows machine does not test E2's and E5's repositories.
- **Fix in coai (E5, the rollout's entry 5.1).** On Windows a sweep holds a per-root named mutex across its whole pass, so two sweeps never
  interleave; POSIX is unchanged (its `renameat2`/`renamex_np` has a single winner). An op in coai's template manifest.
- **Fix for the others.** The template's owner takes the same fix, or a better one, before E2.3, E6 and E7 copy it; the sidecar's owner measures its
  `MoveFileExW` the same way. **The Node reference:** F16's Fix may arm a Windows removal only if its sweep coordinates concurrent sweeps per root across
  processes (a lock held over the rename, the check, the removal and the claim's deletion) and a test of two independent sweep processes is green on Windows; until then the
  Windows sweep stays list-only, as it is today. The probe is 25 lines of C#; its source is in the workflow of coai's throwaway run above.
- **State.** Open. Not a prerequisite of E5 once its op lands; it IS to be read before E2.3, E6 and E7 copy the template, and before F16's Fix.

## F30 — The shipped Node guard reads only whole literals: a prefix split, joined, escaped or built from a template hole is not a finding (found 2026-11-05, E5's S6 brief; the rollout's entry 5.2)

- **What.** `tools/leftovers-check.mjs` (`scanText`) has no folding reader. Measured at release `bd79584` with fifteen spellings of
  the prefix in a `scripts/zz.mjs` line (the E5 S6 brief, Decision 1; the split and the `.join('')` spellings re-run at the epoch-6
  re-review, both `[]`): a whole legacy literal (`testsToDelete-coai-x-abc123`) is `legacy-name`, and a bare-word glob passed to a
  removal is `owner-blind` — 2 of 15. The word split over `+`, `.concat`, `['testsTo', 'Delete-'].join('')`, a template hole, a
  `\u` or `\x` escape, a one-character class, a regex over the word, the bare word and half of the word each answer `[]`. The
  consult `5d804d0c` reproduced the split literal.
- **Who assumes otherwise.** The C# template's guard folds (`LeftoversGuardLiterals.cs`; its `IsFolded` reads `.cs` only), and the
  consumers' documents assumed the Node guard does the same: E5's must-not-copy row 2 asks for "the same twelve in a `.mjs` under
  the `node` profile, RED when the folding reader is switched off"; E2's D9 row 2 says "the shipped Node guard reads the same way"
  and its S5 sc. 2 plants `"testsTo" + "Delete-"` in a `.cjs` and a `.sh` and expects a finding each. Neither can be met by the
  shipped tool today. Two coai fixtures were invisible to it (`scripts/lib/native-run.test.mjs:42`, `scripts/native/native.test.mjs:506`)
  and become plain literals with the inline `legacy-name` exemption (E5's S6).
- **What it does.** A test file that builds the prefix from pieces hides a legacy name or an owner-blind pattern from the Node guard,
  and a repository's "zero `legacy-name`" is then only "zero WHOLE literals". It does not hide a `raw-temp` site (that class reads
  the API call, not the name). The interim scan the consumers run by hand (`'testsTo'`, `"tests", "To"`, `.join('')`,
  `string.Concat` beside `Delete`) finds the spellings a person thought of; **it is not a proof that no other spelling exists.**
- **Fix.** A folding reader in the shipped guard, for the `node` profile's files (`.mjs`, `.cjs`, `.js`, `.ts`, `.sh`, `.ps1`,
  workflows): join string literals over `+`, `.concat(...)`, `[...].join('')` and `${'…'}` holes on one line, decode `\uXXXX`
  and `\xXX`, read a one-character class as its character, then run the existing classes over the folded line; a literal
  that holds `sto` or `tod`, the pieces that cross the word's join, and not the whole word is `owner-blind` (no longer piece: a shorter or wider rule gave false positives, as below),
  as the C# template does, with the template's folding allowances for the guard's own files. RED first: the spellings of the table above in a fixture, each with its exact line, because the count depends on the line (the judge's note); each one finding; the consumers' real trees must stay at their current counts (a false positive on a
  product word such as `chatModelEdits` is a defect of the reader; the S6 brief measured zero in coai with the `sto`/`tod`
  rule). One release, then pin bumps alone.
- **Not the fix.** A second detector of coai's own with different semantics, whose findings could not carry the rule's
  exemption and would leave creds behind (option A of the S6 brief, rejected at the epoch-6 re-review).
- **Owner and deadline.** The conventions repository (the guard's maintainer); **deadline 2026-11-19, accepted by the owner on 2026-11-05**, or before
  creds' E2.5 merges if that is earlier — the owner confirms or moves the date (the rollout's § *Epoch 6*, item 7, question 3).
  Until it ships, every consumer's Node compliance declaration says in its PR that `legacy-name` and `owner-blind` are
  "zero whole literals, F30 open", and runs the interim scan with its output recorded.
  *[2026-11-06: shipped in release `37b9aa5` (#135). After a pin bump a consumer's sentence reads "zero for the guard's listed spellings"; `todo/PLAN_F30_folding_reader.md` tracks the pin bumps and the re-runs.]*
- **Re-measured by the epoch-6 judge (2026-11-05, `scanText` at `bd795847`; the brief's exact lines are not recorded).** The brief's table holds 16 spellings, not 15
  (2 found, 14 not). The count depends on the line: `/testsToDelete[-_]/i` and `new RegExp('^testsToDelete[-_]')` answer `owner-blind` (the classifier's anchors), and the
  bare word, the bare prefix or a `?` glob on a line with `rmSync` answer `owner-blind` too (its deletion reading); with no removal on the line the `?` glob and
  `new RegExp('testsToDelete[-_]')` answer `[]`. What no line of this measure found: a split over `+`, `.concat`, `.join('')`, a template hole, `\u`, `\x`, a one-character
  class, half of the word, and `rmSync` over a joined prefix. So "2 of 15" is a count of one set of lines, and the fixture of the Fix and of the Definition of Done must name its
  lines. The Fix as written also leaves some of them at `[]`: folding changes nothing for a bare word or an unanchored regex string with no removal on the line; they need the C#
  template's `BareWordHits` reading as well. The piece rule of the Fix (`sto` or `tod`) is the S6 brief's, stricter than the C# template's `PrefixPieces`, which gives false
  positives on product words (the brief's measure); "as the C# template does" holds for the class, not for the pieces.
- **The piece rule above is replaced (measured 2026-11-05, `todo/PLAN_F30_folding_reader.md`).** `sto` or `tod` hits 2386 literals in coai and 2454 in creds (`restore`, `history`, `todo/`). The rule built is a crossing piece of 6 or more characters in the
  word's own form (camel `testsToDelete`, lower or upper case; `TestsTo` is no form), with no letter at either side. The plan is the current text for this item.
- **Rebuilt on its branch (2026-11-05 and 2026-11-06, epochs 2 and 3 of the plan, `feat/f30-folding-reader`; not merged, not released).** `tools/lib/leftovers-fold.mjs` (the file reader, JavaScript and the literal readings) and `tools/lib/leftovers-fold-shell.mjs` (`.sh`,
  yaml and `.ps1`) are ONE forward-only scanner per file kind, not a set of regular expressions: each walks a file once, removes the comments, and decodes and joins the string literals of a line (`+`, `.concat`, `.join(<literal>)`, `${'…'}` holes, `\u`, `\x`, `[T]` in
  `.mjs .cjs .js .ts .tsx .jsx .mts .cts`; touching quotes and `$'…'` in `.sh`, `.yml`, `.yaml`; `+` and `-join` in `.ps1`). A regex literal is recognised and a template tracks its `${}` depth. **A call is not a parenthesis:** `f('testsTo') + 'Delete-*'` joins nothing.
  A file that ends inside a block comment or a template, at any depth, is one `unreadable` finding on the line where the outermost state opened, and a folded line over 256 KiB is one `unreadable` finding. `legacy-name` reads the folded text; `owner-blind` reads the FILE's folded lines (so a
  prefix built in pieces binds as a whole one does) and the code with escapes and classes decoded. **The comment gate:** a comment-like line is empty in the folded input, so it binds nothing and reads nothing, except a JavaScript line that starts with `#` in code state and a `.ps1` line where `#>` closes a block comment and code follows.
  **The bare word and the half word are `legacy-name`, and they read only a line that no classifier reading called broad; each occurrence of the word is its own cause** (a pattern in the tail is `owner-blind` unless `legacyNameHits` reads that same occurrence, so `'testsToDelete-u*'` is `legacy-name` alone and its exemption clears it).
  The table of spellings is the promise and is in the guard's header (D2). **Not joined:** a template nested in a hole, a literal in an expression hole, unary `-join`, a comment between operands. **Not read:** an unquoted `.sh` or yaml word with no quote in it, extensionless scripts, every other kind. **Not told from code:** a `.ps1` here-string, a `.sh` heredoc, JSX text.
  A name built from a variable, across lines or at run time is not read. **For the C# template's owner:** the template calls the bare word and the half word `owner-blind`; this guard calls
  them `legacy-name`, because the rule defines `owner-blind` as a pattern, glob or filter and `legacy-name` as a literal that builds a prefixed name, and because `legacy-name` takes the inline exemption while `owner-blind` takes none (a false
  finding in a consumer is cured by a comment, not by a rewrite; a `package.json` takes no exemption, so there the cure is a rewrite). A bare word with a pattern after it (`[`, `(`, `?`, `*` or `\` in the tail) is `owner-blind` unless `legacyNameHits` reads that occurrence.
  The piece here is the word's own form with no letter at its sides, at 6 characters; the template's rule is any case at 5, which hits `hostStopped` and `chatModelEdits`. The reader is linear on any line (a step counter, not a clock); **the raw readings' time is not promised, and F32 lists the paths.** The record (the measure, the tables RED and GREEN, the mutants, the step
  counts, and the real trees of the nine consumers and two open branches against the release `bd795847`) is `research/2026-11-05_f30_folding_reader.md` §§ 7 to 9: one new finding, creds `src_vs_code/src/test/leftoversSites.test.ts:91`, real.
  What the reader does not read, and its stated limits, are in the guard's header (`tools/leftovers-check.mjs`); the rule's detail points there.
- **State.** Rebuilt on the branch, awaiting the code gate, an independent review, the PR and one release; then the pin bumps, each alone (the plan's Order). Not a prerequisite of E5's producer PR (the rollout's entry 5.2, option C);
  covers coai and creds; E6 and E7 read it before their first Node compliance declaration.

## F31 — On an elevated Windows run the audit's claim scan and the sweep's collection cannot read the run's own leftovers (found 2026-11-05, coai E5's S6; the rollout's entry 6.2)

- **What.** A new file and a new folder of an elevated Windows process are owned by `BUILTIN\Administrators`, not by the caller's SID (measured on the hosted runner: `dew_flow_mcp` #58, and coai run 42026897727's step 0). `Scope.WindowsIsMine` asks for the caller's SID, and the helper makes its claim with a plain create. So a real orphan claim, or an unregistered folder with its claim, is never named by the audit, and a folder a run left (killed, or not removable at its normal end) is kept as `foreign-uid` by every later sweep. The Node janitor and the Node sweep read the same keys or only list on Windows (F16).
- **Who assumed otherwise.** The rollout's goal ("collected later: by a C# sweep that checks both keys, by the janitor once F9 arms it there, or by a person"), and coai's S6 brief ("red through `Discover`"). The template's source and its plan did say it, for both halves (`Scope.cs:27-28`; `dew_flow_mcp · research/PLAN_test_leftovers_E3.md:672`), and no document of the rollout carried it. A test on Windows that asserts collection re-owns its fixture or hands in an owner seam, so green tests hid the sweep half. The copied comments at `Removal.cs:33` ("left for the start-of-run sweep") read as if it held there too.
- **What it does.** On a PR's Windows leg (`windows-latest`, measured; a release's `windows-11-arm` is not) the audit's claim scan sees nothing, so an unregistered claim or folder does not turn that leg red. No leftover stays there: a hosted runner's machine ends with its job, and the owner's Windows machine runs no E2 or E5 tests, for now. A person who runs a suite in an elevated Windows shell keeps what a killed run leaves, until that person removes it.
- **Shape to weigh.** The helper re-owns what it makes to the caller's own SID on Windows (WRITE_OWNER, no privilege; `WindowsOwnership.OwnedByCaller` is the test-side form). It changes the template, every adapted copy and the Node reference. Never widen the key so that `Administrators` counts as the caller: that key is what keeps a folder of another account safe.
- **The pin to read when this is fixed.** Coai's `AnUntouchedClaim_StaysUnseen_OnAnElevatedWindowsRun`: its assertion on a folder made by the helper goes red.
- **Owner and date.** This repository, for the template and the rule. Reviewed, and either fixed or accepted again by the owner, at the first of: E2.3 starts (the next copy of the helper), a suite is to run on a Windows machine that persists, or 2026-12-05. Not a prerequisite of any PR of the rollout (epoch 7, the owner's answer, 2026-11-05).
  *[2026-11-07, at E2.3's start: **accepted again by the owner** (after consult `ee34d365`: one consultant for accepting, one for fixing first unless that costs a plan change, which it does: E2.3 depends on the template at `197cc76`). E2.3 copies the helper as it is. The next review is at the first of: a suite to run on a Windows machine that persists, or 2026-12-05.]*
  *[2026-11-07, evidence for that review: creds' E2.3 measured the opposite on `windows-latest` (run 42389968156 and the merge head of creds #311): `elevated=True`, yet a Node-made folder of the test process and the folder of a live C# producer were owned by the CALLER, not `BUILTIN\Administrators`. Coai's run 42026897727 (2026-11-05), step 0, created a new folder and a new file and measured the owner of each as `BUILTIN\Administrators`; coai's helper creates its folders with `CreateDirectoryW` and no security descriptor, so the token's default owner. Creds measured folders only (one made by Node, one by the C# test executable). The runs disagree for folders; the cause (a runner image change, or a difference between the two processes) is not known. Creds' tests now read the owner and assert the branch it implies, and print which outcome the runner gave.]*

## F32 — The raw readings of the guard and the sweeper are super-linear on a hostile line, and their time is not promised (found 2026-11-06, the independent review of F30's `16943a7`; the plan's D8)

- **What.** These paths are the same at the release `bd795847` and at F30's branch, and each was measured through `scanText` or the named function: `exemptionProblem` in `tools/leftovers-check.mjs` is cubic on one comment line (4 KiB 14 s, 8 KiB 109 s); `words` in `tools/lib/leftovers-docker.mjs` on `x,,,,…y` (128 KiB 10 s);
  `/\s#.*$/` in `looseVerdicts` (128 KiB 4.1 s); `TYPE` in `tools/lib/prefix-bindings.mjs` (128 KiB 2.2 s); `MARKER` in the guard (256 KiB 1.5 s); the array, `build … push` and `trap` regular expressions in `leftovers-docker.mjs` (512 KiB 10 s or more); `composeEnvHits` in
  `tools/lib/leftovers-shell.mjs` on a repeated assignment (256 KiB 42 s); a chain of assignments in `classifyLines` (16000 lines 40 s; with a split first name the chain costs the same at F30's branch and nothing at the release, because the release does not bind it); `maskExpansions` through `closingOf`
  on `docker run $( ` repeated (128 KiB 6 s, 256 KiB 22 s). The longest line in the guard's scan is 2487 characters, so no real line holds these shapes.
- **Who assumed otherwise.** F30's Goal at epoch 2 ("never a hang") and D5's "the raw readings' answers stay as at the release" could not both hold: a speed fix that changes an answer is a different rule. Epoch 3 of F30 promises the folding reader's time only and leaves the raw readings as they are.
- **What it does.** Nothing on a real tree. The guard is a spelling check over text a person wrote in their own repository, and it does not defend against a hostile author. A hostile or generated line of 128 KiB or more can make a scan take seconds to minutes.
- **Shape to weigh.** Fix each path to a forward pass with a durable differential test against the old code as its oracle and a stated reason why the two agree (F30's D5 item 6, as `looseVerdicts` has), which changes time and no answer; or record that the raw readings' time stays a documented limit. F30 kept `looseVerdicts`' forward pass and the removed spreads (a differential of the whole `classifyLine` over 9,400,453 lines found no difference), and removed the compose cap, which changed an answer.
- **Owner and date.** This repository. No deadline; not a prerequisite of F30 or of any PR of the rollout.

## F33 — The shipped janitor does not parse under bash 3.2, macOS's `/bin/bash` (found 2026-11-10, creds E2.4; creds' note N20)

- **What.** `tools/janitor.sh:132` puts a `case … in Linux) …;; esac` inside `$( … )` inside `${JANITOR_OS:-…}`. Bash 3.2
  gives `command substitution: line 132: syntax error`. Measured by the first macOS run of creds PR #329 (its helper
  self-test, cases T13, T15 and T16, which ran the janitor with `"$BASH"`, that is `/bin/bash` 3.2). The line is the same at
  `37b9aa5`, `1341995` and `153e6b5` (read here with `git show <sha>:tools/janitor.sh`). The shebang is
  `#!/usr/bin/env bash`, so a caller that runs it with `bash` from `PATH` works where that bash is 4 or newer (the hosted
  macOS runner's Homebrew bash). A stock Mac does not.
- **Who is hit.** A consumer that runs the janitor on a Mac that has only the system bash. Creds works around it: its
  self-test runs the janitor with `bash` from `PATH` and skips T13, T15 and T16 visibly when that bash is older than 4
  (creds `1e4181d`), and creds' project instructions say bash 4 or newer on macOS.
- **Fix (to decide when it is built).** Either the janitor parses and runs under bash 3.2 (for example, `OS` is set by a
  plain `case` or `if` before the assignment, and the rest of the file is checked for other forms that need bash 4), with a
  test that runs the janitor's dry run under `/bin/bash` 3.2 on a macOS CI leg, RED first on the current line; or the
  janitor's contract (`common/test-leftovers-janitor.md`) names bash 4 as required, and the janitor refuses an older bash
  with one clear line.
- **Source.** `dew_flow_creds_for_devs · todo/PLAN_test_leftovers_E2.md` on creds `main` `b6cc6b3`: § *Notes for the
  parent*, N20; E2.4 build record part 2d, failure A.
- **Owner and date.** This repository (conventions): the janitor and its contract. No deadline; not a prerequisite of any
  PR of the rollout.

## F34 — A Windows dry run of the janitor in creds' helper self-test printed nothing once; the cause is not known (found 2026-11-10, creds E2.4; creds' note N21)

- **What.** On creds PR #329's head `5c74ffc` (run 42749082598, first attempt) the shipped janitor's dry run printed
  NOTHING in T13/T14 and T15 (`FAIL T13/T14 would run:`, `FAIL T15 would run:`). The same job, run again on the same head,
  printed its `would run:` lines and passed (26 of 26), as did the head before (`15e4218`). The self-test keeps only the
  janitor's stdout, so the reason for the first attempt is not known.
- **Why it matters here.** On Windows the janitor runs as a dry run until F9 arms it, and its `would run:` lines are the
  only evidence of what it would remove. A dry run that sometimes prints nothing makes a test flaky, and it could hide a
  fault of the janitor on Windows.
- **Next step.** Creds keeps the janitor's stderr and exit code in the self-test's failure text and reads them the next time
  it happens. This repository acts only if that text shows a fault of the janitor: then a RED test here first, and a fix.
- **Source.** Creds' E2 plan (as F33), N21. That attempt is not counted as a pass of those cases.
- **Owner and date.** Creds first (the self-test's failure text); this repository (conventions) if the evidence points
  to the janitor. No deadline.

## F35 — Neither guard reads a split legacy spelling in a consumer's nested `scripts/*.cjs` folders (found 2026-11-10, creds E2.5; creds' note N22)

- **What.** A split legacy spelling (`'a' + 'b'`) in creds' `src_vs_code/scripts/*.cjs` or
  `src_minimalapi_server/scripts/*.cjs` is read by NEITHER guard. The `node` profile does not discover those folders (it
  reads `*.test.*` and `*.spec.*` files anywhere, and every text file under the ROOT folders `scripts/`, `test/` and
  `tests/`; creds' old note N14 said the same). The C# copy folds `.cs` only. Measured by creds at `6e08071`: the C# guard
  reads a WHOLE legacy literal there, and the Node guard reads the split in a path it discovers
  (creds' `leftoversGuardFixtures.test.ts` pins this).
- **State.** Creds records it as a documented limit (its Q9 (A); creds `research/module_tests.md` § *Test leftovers*,
  part 6).
- **Shape to weigh.** A way for a consumer to add folders to the `node` profile's discovery (N14's "`--scan <glob>`"
  idea), RED first with a planted split spelling in such a folder; or this stays a documented limit of the `node`
  profile.
- **Source.** Creds' E2 plan (as F33), N22 and N14.
- **Owner and date.** This repository (conventions) for the `node` profile's discovery; creds for its C# copy's
  discovery, and creds has recorded the limit. No fix is asked now; no deadline.

## F36 — The shipped Node guard reads `mktemp` in `.sh` files only, not in a workflow's `run:` block (found 2026-11-10, creds E2.5; creds' note N23)

- **What.** `tools/leftovers-check.mjs:376`, `RAW_TEMP_BY_EXTENSION = { ".sh": [/\bmktemp\b/], ".ps1": [...] }`: a
  `mktemp` in a `run:` block of `.github/workflows/*.yml` is no `raw-temp` finding. The line is the same at `37b9aa5`,
  `1341995` and `153e6b5` (read here). Creds' C# copy of the guard does read it: `ci-server.yml:375` was a C# finding (creds'
  E2.5 build record, RED list item 6), and creds fixed it with `$RUNNER_TEMP` (its Q4 (A)).
- **Near it.** The N6 follow-up of the rollout (§ *Epoch 8* item 2, point 3: a `raw-temp` reading for `${TMPDIR…}` and
  `$TMPDIR` in `.sh`), another temp spelling the Node guard does not read.
- **Fix (to decide when it is built).** The guard reads the shell lines of a workflow's `run:` blocks with the `.sh`
  `raw-temp` patterns (the `node` profile already reads workflows for the Docker classes). RED first: a planted
  `run: d=$(mktemp -d)` in a workflow fixture is a finding. Then the consumers' trees are scanned at the new pin, and each
  records what it must migrate or mark. Or the owner records that it stays a documented limit.
- **Source.** Creds' E2 plan (as F33), N23.
- **Owner and date.** This repository (conventions). No deadline; not a prerequisite of any PR of the rollout.

## F37 — The C# template guard does not read a `/tmp` inside a raw string literal that also holds a quote (found 2026-11-07, creds E2.3; creds' note N24)

- **What.** In creds, `src_broker_client/tests/CallerIdentityTests.cs:196` holds `/tmp` inside a C# raw string literal
  (`"""…"""`) that also holds a `"`, as `"""{"a":"/tmp/p"}"""` does. The copied guard reads a one-line raw string, but it
  misses a `/tmp` inside a raw string that holds a quote (creds' E2.3 build record, part 3 difference 1 as corrected in part
  3b). So that line is no finding.
- **Who copies it.** Every adapted copy of the C# template guard (creds E2.3; E6 and E7 later).
- **Fix (to decide when it is built).** The template's literal reading handles a raw string with quotes inside it, RED
  first with that exact plant; or the limit is written beside the template's guard and in each copy's manifest.
- **Source.** Creds' E2 plan (as F33), N24 ("for E3 and the template … recorded; not an op here").
- **Owner and date.** The C# template's owner. The template lives in `dew_flow_mcp` (E3); this register tracks it, as it
  tracks F29 and F31. It is not creds': creds wants no op on its copy for it. No deadline.

## F38 — Pointer: two creds `consent` folders on the WSL machine have no claim (found 2026-11-10, creds E2.4; creds' note N25)

- **What, in short.** `/tmp/testsToDelete-u1000-creds-consent-DPZ0Sd` and `-NtKkk6` (2026-11-09 21:30:57, each with a
  `keys/` folder) stand with no claim beside them. They are made by `ownedDir(scope, 'consent')` in creds'
  `src_vs_code/src/test/consentContractVpn.test.ts:56`. A folder whose claim is gone while the folder stays is what the helper's order should
  never leave. The cause is not known. Until it is found, the janitor and the sweeps list them as unmarked and remove
  nothing.
- **Where it is tracked.** Creds' E2 plan (as F33), N25, and its D8 table, row E2.4, column (d). Creds' next step:
  reproduce with that test file alone, read the audit's output, and fix test first in E2.1's helper if the order is wrong.
- **Owner.** Creds. A pointer only: nothing is built here unless creds finds a fault of the shared reference.

## F39 — Pointer: creds' `release.yml` with `target=extension` publishes to the Marketplace from any branch (found 2026-11-10, creds E2.5)

- **What, in short.** A manual dispatch of creds' `release.yml` with `target=extension` from a branch runs the extension
  job (its `if:` accepts `inputs.target == 'extension'`), and its publish step has no tag guard. Run 42792112748 (head
  `d56f3378`) ran "Publish to the Marketplace"; only the Marketplace's refusal of an existing version (1.18.0) stopped it.
- **Where it is tracked.** Creds' E2 plan (as F33), E2.5 build record, *The hosted evidence*: "Side finding, a todo, not
  built". Never dispatch `target=extension` for evidence.
- **Owner.** Creds. A pointer only.

## F40 — Pointer: two creds product scripts keep a temp path when a step fails (found 2026-11-10, creds E2.5)

- **What, in short.** Creds' `install.sh:63` keeps its temp file when `fetch` fails, and `deploy/restore.sh:102` keeps its
  staging folder when a step fails (line numbers at `6e08071`; on `b6cc6b3` the `mktemp` lines are `install.sh:64` and
  `deploy/restore.sh:103`, under their markers). Both are product scripts, not tests; E2.5 marked their `mktemp` lines with an
  exemption whose reason claims no cleanup.
- **Where it is tracked.** Creds' E2 plan (as F33), E2.5 build record, *What is not done, and why* (its Q11: todos, not
  built).
- **Owner.** Creds. A pointer only.

## Definition of Done

- [ ] Each of F1 to F22, F24 and F25 (F23 is reserved by F3's note for other manifests) is fixed with a RED test observed first, or closed with a recorded decision that it stays a documented limit.
- [ ] F26, which is not code, is closed by the owner's written confirmation of the private sibling's mirror, with the sha256 of each span and copied
      file recomputed here and recorded under F26, and the rollout plan's DoD line for the baseline rule's mirror ticked from that record.
- [ ] F29 is closed when, for each of the template and the sidecar, ONE of these holds, recorded under F29: a fix is in, with a Windows test that runs two independent sweep
      PROCESSES and is green; or that side's Windows sweep only lists, by a recorded decision; or a measurement on Windows of that side's OWN call shows a single winner (the
      measurement above is of `Directory.Move`, not of `MoveFileExW`). And F16's Fix either keeps the Node sweep list-only on Windows or meets F29's Node requirement.
- [ ] F31 is closed when the helper makes what an elevated Windows run can read back, with a Windows test on a natural claim and a natural folder, or when the owner records under F31 that it stays a documented limit.
- [ ] F32 is closed when each path it lists is linear with a durable differential test against its old code (and a stated reason why the two agree), or when the owner records under F32 that the raw readings' time stays a documented limit.
- [ ] F33, F35, F36 and F37 are each fixed with a RED test observed first, or closed with a recorded decision that it stays a documented limit. F34 is closed when creds' self-test keeps the janitor's stderr and either the next empty dry run is explained (with a fix here, RED first, if the janitor is at fault) or the owner records that it stays an open observation. F38, F39 and F40 are pointers: each is closed when creds' own record says its todo is done.
- [ ] F30 is closed when the shipped Node guard's folding reader is released with its fixture of the table's spellings, by exact line, RED first and GREEN after,
      the consumers' real trees at their recorded counts, and the consumers that declared "zero whole literals, F30 open" have re-run the
      guard at the new pin and recorded the result; or when the owner records, under F30, that the reader stays a documented limit.
- [ ] F27 is in a released rule text: the rule test for the new section was RED before the text and is GREEN after, and
      `node tools/rule-bodies.mjs` and `node tools/ownership-check.mjs` are clean.
- [ ] F28, which is not code here, is closed when (1) dew_flow_mcp and dew_flow_benchmark each have a release ref that a person
      promoted to a commit whose CI was green (the promoting commit or pull request is linked), (2) rag_qln's `.gitmodules` names
      that ref for both submodules in the form F28 states (a plain name for a branch, `refs/tags/…` for a tag), and (3) a rag_qln pull request with that setting built and tested the whole solution; the
      three links are recorded under F28.
- [ ] The companion and the rule's body records match the code (`node tools/rule-bodies.mjs`).
- [ ] `node tools/leftovers-check.mjs` and `node tools/plan-lifecycle.mjs` are clean; this file is promoted or deleted when the
      last item is closed, and its row in `todo/README.md` goes with it.
