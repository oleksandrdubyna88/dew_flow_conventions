# Tool scenario tests

Run `npm ci --ignore-scripts`, `npm test`, then `npm run check` at repository root.
The existing `tools/selftest.test.mjs` drives the established family checks. The new
`tools/rules.test.mjs` exercises real rule files in temporary directories, including Unicode
and spaces, and removes its own directory in test teardown.

Covered by the resolver suite: planned nonexistent files across two languages; task/path OR;
transitive dependencies; cycles; missing dependencies; duplicate/invalid metadata; empty
bodies; excluded docs; unknown tasks; escaping paths; changed canonical content; symlinks.
Windows without symlink privilege explicitly skips that case; WSL must exercise it.

The initial executable stub failed seven behavior assertions. On 2026-09-10 the combined
suite ran 53 cases: Windows passed 52 with the symlink privilege case explicitly skipped;
WSL passed all 53. The real CLI tests nested paths, missing PROJECT, scoped overrides and
bounded complete reads. A reproduced callback bug selected Rust for a second nonmatching
path; the regression failed before the fix and passed after it. The fixture reinstates
that bug and observes Rust returning, so removal of the fix remains detectable.
All 24 original bodies are checked against their baseline hashes, including section headings.
These are development observations, not acceptance of the full rollout.

Additional regressions: a root file target failed via a 10-second timeout before the fix;
now it fails immediately. An inspect-only dependency incorrectly consumed the core budget;
it now stays outside that budget while dependencies of always rules remain counted.
Missing PROJECT requirements and npm dependencies produce explicit failures.

A bounded real-agent inspection ran against 8c5a418 on Windows. Claude Code 2.1.258
(`claude-opus-5[1m]`) read ENTRY/PROJECT and all five selected inspect/C#/TypeScript rules,
with matching hashes and complete rule boundaries, and reported concrete language constraints.
Codex 0.153.4 read the same language/core sources after adapting its Git environment to the
Windows read-only sandbox, but the turn ended with the subscription usage-limit error.
Its run is incomplete, not a behavioral pass. Temporary JSONL traces were bounded to 256 KiB
per agent and 180 seconds by the probe. No installs or global configuration writes occurred.

WSL nested-start probe also completed: Claude Code 2.1.197 (`claude-opus-4-8[1m]`)
started in `tools/`, discovered the repository root and read the same five sources, 25,464
bytes. Its trace was 195,035 bytes without truncation. It correctly reported working-tree
mode and retained advisory/host-policy caveats. The external 180-second timeout owns cleanup.

The HTTP-only selection regression failed before the dependency was declared and passed
afterward. The complete suite now contains 55 cases (one Windows symlink privilege skip).

The S2 suite adds `tools/migrate-rules.test.mjs`, `tools/proc.test.mjs` and
`tools/smoke-rules.test.mjs`; all run through `npm test` and the coverage job. Scenarios use
real Git repositories/submodules, with spaces and Unicode: dry-run/no source edits, apply,
nested local rule relocation, dirty/wrong/missing mounted sources, committed gitlink, fresh
clone/init/read and rollback to the legacy layout. Invalid SHA, existing adapters and
untracked policy fail before worktree creation. The gate checker detects neutral mount
absence, PROJECT/local copies and duplicate mounts.

Process tests observe a real descendant's disappearance after parent exit and timeout,
assert wall-time bounds, output bounds, argv fidelity and nonzero exit status. Source-evidence
tests reject assistant claims, errored tools and partial canonical bodies. Real native-agent
smoke is an explicit local rollout action, never an ordinary CI model call.

Two new regressions failed before their fixes: a second declared mount was accepted, and
empty intermediate directories left the old automatic rule tree nonempty. Both now pass.
Windows job inheritance assumptions also failed a real timeout test; see the migration module.

Not yet covered: successful complete Codex behavior, compaction and the six-consumer rollout.
These remain open in the plan; deterministic migration tests are not behavioral acceptance.

S2 development run, 2026-09-10: 66 cases, Windows 65 passed plus the explicit symlink skip,
WSL 66 passed. The real coai canary smoke completed with Claude (`claude-opus-5`), read all
seven selected canonical sources, and left checkout state unchanged. Evidence is in
[shared-rules-smoke-s2.json](shared-rules-smoke-s2.json); its stored answer limitation is explicit.

S2 review fixes were verified with 71 cases: Windows 70 passed plus the same symlink skip;
WSL all 71 passed. Regression failures reproduced output nested in the conventions source,
an unrelated root ENTRY shadowing the mounted resolver, and an undeclared neutral directory
being reported as unadopted (the latter also fails when its production guard is removed).
Snapshot tests detect changed inspected content and reject large inspected files while leaving
unrelated large file bodies unread. The migration scenario checks explicit script rewrites,
remaining-reference reports and dirty input disclosure. A second real Claude run completed
with the narrower resolver-only Bash approvals, all seven sources, an untruncated final answer,
and unchanged measured state. Its scope and manual assessment are in the evidence file.

PR follow-up adds an in-process real-Git CLI protocol scenario, so coverage measures the
actual implementation rather than fixture copies. A dot-segment regression first omitted
`csharp.doctrine` for `src/./file.cs`; normalization restores the same selection as the
canonical path. Repeated leading `./` and separators are covered too.
The follow-up suite passed 56/57 on Windows (one symlink privilege skip) and 57/57
in an isolated WSL/Linux checkout on 2026-09-10. A Windows-created worktree cannot be
used directly by Linux Git because its `.git` file contains a Windows absolute path;
the Linux run used the same source over a native Linux clone, without rewriting that file.

Final S2 review regressions reject canonical-looking output from an unrelated command,
unlinked Claude results and shell chains. A partially migrated PROJECT/local tree without
its declared neutral mount also fails. These cases were observed failing before correction.
The 73-case suite passed 72 with one symlink privilege skip on Windows and all 73 on WSL;
the seven trace/snapshot cases also passed separately after adding bounded call diagnostics.
Earlier native evidence predates invocation correlation and does not prove that stronger
criterion. The combined-language strict run exceeded its 256-KiB trace cap and remains
incomplete; neither overflow nor an unsupported command shape is converted into a pass.
The following C#-only Claude run completed under the same bound (212,629 trace bytes):
all six sources were linked to the mounted resolver call, checkout measurements were
unchanged, and the full final answer correctly distinguished inspect from implement and
named concrete C# constraints. The evidence file retains that answer and manual assessment.
This is one scoped observation, not complete Codex or six-consumer compatibility acceptance.

PR #17 coverage exposed an immediate PID-probe failure after the parent exited, while the
same source passed the normal CI suite. The probe now allows up to two seconds for OS reaping
and still requires ESRCH (a zombie is not accepted as disappearance); failure reports Linux
State/PPid. This tests the same real process boundary without assuming synchronous PID removal.
See [kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html): PID existence includes a
terminated process awaiting wait. The CI outcome is recorded separately from that explanation.

The real Git migration scenario also drives the complete smoke/report/lock cycle for both
vendor event formats. Its explicitly labelled fixture CLI invokes the real mounted resolver
and emits transport events; it does not call a model and is never native-agent evidence.
It checks correlated reads, unchanged scope, persisted report identity, lock cleanup and
active-owner refusal. This covers orchestration in ordinary CI while paid native runs remain
separate. PR review refactoring split destination/source validation, patch construction,
report ownership and event decoding without changing their contracts.


PR #17 follow-up: 78 cases; Windows 77 passed plus the existing directory-link skip, WSL
78 passed. New regressions were observed failing before their fixes: missing Windows target
reported spawnFailed=false, missing/duplicate/wrong --repo accepted as source evidence,
reference definitions silently moved, malformed traces threw away the result, and a real
Git checkout hook made journal creation fail without recovery context. The tests now verify
explicit incomplete outcomes, target exit 125 remains distinct, and journal failure preserves
the disposable worktree. CLI error handling runs in selftest; the existing real-Git scenario
also invokes a successful migration dry-run through the public CLI.

## The build-flags policy (`csharp/dotnet-build.md`)

Four suites carry the rule, 34 cases, all through `npm test`; the suite is 122 cases with
one Windows symlink-privilege skip. Seventeen of the 34 were written during the two code rounds and
the pull request's automated review, one per finding, each observed red before its fix.

`tools/rules.test.mjs` gains one selection case: a `.slnx`, a `.sln` and `Directory.Build.rsp`
select `csharp.dotnet-build`; a `.cs`, a `.csproj`, a `.ts` and a `.rs` do not. It was observed
failing with the rule file moved aside — `AssertionError: src/Thing.cs`, the real symptom rather
than a setup error — and passing when it was restored. The rule carries no `tasks` deliberately:
selection is paths OR tasks, and the first draft did carry them, which delivered a rule about
MSBuild to every TypeScript scope. That is what the negative half of the case pins.

`tools/build-flags-check.test.mjs` (14 cases) drives the checker against real directories: no C#
at all, a C# repository with no response file, the passing case, a response file with the wrong
switch, one carrying an inert `-m:4`, a workflow that suppresses the file, comment and
`/nodeReuse:false` spellings, and build output plus a vendored submodule not making a repository
a C# one. Its teeth were checked by mutation rather than by reading: disabling the `-m` detection,
the `-noautorsp` detection and the missing-file branch in turn each turned exactly the matching
case red, and the unmutated tool 0. The multi-line companion the structural-scan rule demands
found a real hole rather than confirming one — a `--noAutoResponse` inside a `run: |` block was
missed, because the pattern only allowed a single leading dash.

`tools/build-flags-hook.test.mjs` (16 cases) covers the `PreToolUse` guard: bounded commands in
five spellings pass, unbounded ones in five verbs are refused, `git commit -m "…" && dotnet build`
is refused (the whole-command search for `-m` that a naive version would do is the trap), commands
that open no pool are ignored, the stdin/stdout protocol is exercised end to end — a deny carries
`hookEventName`, `permissionDecision` and a reason naming `-m:4`, and an allowed command produces
no output at all — and a malformed payload allows the command rather than blocking the session.
The protocol case exists because the pure predicate can be right while the wiring emits the wrong
shape, which denies nothing and says nothing.

`tools/adapter-check.test.mjs` grows one case for the second hook, and two existing cases change
count because a bare repository is now missing two hooks rather than one. The new case observes a
drifted guard copy and an unwired `PreToolUse` entry as separate findings. The three failure modes
were also run by hand against this repository — copy removed, copy edited, wiring deleted — each
reported with the file and the event named, and OK restored afterwards.

**What the tests do not cover, and why it is recorded here.** The measurements the rule cites
(worker counts, peak and retained RAM, response-file discovery, which delivery of `-m` works) are
not re-derived by any test: they are properties of MSBuild on a particular machine, and a test that
asserted them would be asserting the SDK. They were measured with a negative control and reproduced
run-to-run; the rule states its conditions. One of them corrected the implementation after it was
written: `dotnet restore` with no flags peaked at 11 workers and retained all 11 on the same
12-project solution a full build does, so the guard's exemption for it — on the true but irrelevant
ground that restore does not compile — was removed.

### What the code round changed, and the cases that hold it

Twelve reviewers over three vendors read the branch, and four defects in the two guards survived
verification. Each is now a case that was observed red first.

The guard matched build verbs as SUBSTRINGS of the raw command. Both halves of that were wrong:
`grep -n "dotnet build" README.md` was refused although it builds nothing, and
`dotnet build "src/My -m 4.sln"` was allowed because the path contained something shaped like the
switch. It now splits a command line quote-aware — on chains and on the openers of substitutions and
subshells — tokenises each segment with quotes removed, and asks whether the EXECUTABLE token is
`dotnet`/`msbuild` however it is spelled: `dotnet.exe`, an absolute path, a PowerShell `&` call. A
max-cpu switch counts only as a token of its own, so `-m:4foo` is not one.

The guard could HANG. `for await (… process.stdin)` ends at EOF, so a caller that writes the payload
and holds the pipe open left the tool call pending for ever — the one failure mode its own comment
promised it did not have. It now races the read against a 2-second deadline and answers anyway. The
case writes a payload without closing stdin and fails if the process has not exited in 15 seconds;
against the old code it took the full 15.

`adapter-check` compared command and arguments but not the `matcher`, so a consumer narrowing
`Bash|PowerShell` to `Bash` was certified clean while every PowerShell build ran unguarded. It also
hard-coded which hooks and events exist, so a third adapter would have been checked nowhere until
somebody edited the checker. Both inventories are now read from `settings/`, and a case adds a hook
to a COPY of the reference and asserts it is demanded of the consumer.

`build-flags-check` accepted only a single leading dash where the guard accepts one or two, so an
rsp carrying the inert `--maxcpucount:4` passed as clean and a correct `--nodeReuse:false` was
reported as unswitched — two halves of one rule disagreeing about the syntax they both police.

Round 2 found two more, and both were verified by running the predicate rather than by reading it.
`cmd /c dotnet build src/App.slnx` was ALLOWED: the wrapper branch judged each remaining token on
its own, and `dotnet` by itself is not a build — so was `sh -lc dotnet build x.slnx`, while the
quoted `bash -c "dotnet build x"` was caught, which is what made the gap look like it was not there.
The wrapper now skips only its own leading flags and rejoins the rest into one inner command line;
the companion case asserts that `cmd /c dotnet build x -m:4` is still allowed, because the obvious
fix — dropping every dashed token — would have thrown away the switch being looked for. And the
suppression scan read only `.github/workflows`, so a consumer could keep a correct response file and
discard it from `scripts/build.ps1` or an npm script; it now reads those too.

The WSL half of the run: `tools/build-flags-check.test.mjs` and `tools/build-flags-hook.test.mjs`
pass 24/24 under node 20 on Ubuntu, and the resolver's symlink case — the one Windows skips for lack
of privilege — passes there. One case fails under WSL and is not a defect: `adapterFindings` on this
checkout calls `git rev-parse --show-toplevel`, and a Windows-created worktree's `.git` file names
`D:/rsd/...`, which Linux git cannot resolve. An ordinary checkout of the same repository resolves
normally from WSL.

The pull request's automated reviewer found two more, and both reproduced against the code before
anything was changed. `CI=1 dotnet build App.slnx` was ALLOWED, because the first token was taken as
the executable and `CI=1` is not one — an environment assignment in front of a command is ordinary
shell, and this family's own CLAUDE.md documents builds written exactly that way
(`Agent__AiRuntime__Provider=Codex dotnet run ...`). And the suppression scan read `scripts/` one
level deep through an extension allowlist, so `scripts/ci/build.sh` and an extensionless
`scripts/release` both escaped it; it now walks both trees and skips binary shapes by extension
rather than admitting text by one, so a file type nobody thought of is read rather than ignored.
`referenceHookFiles` became recursive for the same class of reason: a hook in a subdirectory would
have been published and checked nowhere.

## The pin ref (`tools/pin-check.mjs`)

`tools/pin-check.test.mjs` is the first test this tool has ever had. Until 2026-09-14 the CI job's
own comment said it "tests itself against tools/fixtures", and it did not: every change to the one
file six repositories run in CI shipped on a green build that never executed it.

Ten cases, and no checked-in fixtures, deliberately. What the tool asserts is a statement about two
repositories — *is this pin the tip of the ref it tracks* — and no directory of files can express a
release branch that lags its own default branch, so each case builds real Git repositories in a temp
directory and runs the tool as a child process the way a consumer's CI step does. The gitlink is
written with `update-index --cacheinfo` rather than `git submodule add`: the tool never reads the
submodule's contents, so cloning one would test something it does not do, and Git ≥ 2.38 refuses
local-path submodule clones without `protocol.file.allow`.

The RED case is *a pin at the release tip passes while the default branch has moved on*. Against the
unchanged tool it failed with `pin-check: STALE .agents/conventions` — the real symptom, a correctly
published pin reported as drift, rather than a setup error. Seven of the ten failed before the change
and all ten pass after it.

Two of the ten guard things that were never checked. *The pin is read from the commit, not the index*
walks the documented three-step sequence — staged at the wrong sha, index corrected, commit made —
and asserts red, red, green; README states this and nothing tested it. *A `.gitmodules` path that is
not a gitlink is a finding, not a crash* pins the `rev-parse HEAD:<path>` guard: before it, a
half-added submodule threw a raw git stderr dump with a Node stack trace out of the script. `git mv`
of a mount leaves exactly that shape behind.

*A branch the remote does not have is NO SUCH REF, never a silent OK* is the subtlest. `ls-remote`
answers exit 0 and an EMPTY body for a pattern matching nothing; read as a tip, that empty string
would make every pin look stale against a blank sha, and read as a miss it is the one thing it can be.

Two setup errors were caught by reading the failures rather than the counts, and both would have been
false evidence. A Windows path written verbatim into `.gitmodules` is `fatal: bad config line` — a
backslash is a config escape — so the first red run was failing for the wrong reason entirely. And an
all-zero sha is refused by git as a gitlink (`cache entry has null sha1`), which failed the
unreachable-remote case for a reason that had nothing to do with reachability.

**What these tests do not cover.** Whether GitHub answers a fetch for a reachable sha that is not a
ref tip. That was measured separately against a `file://` remote on git 2.55 — a lagging pin fetched
with `--depth 1` succeeds, and the fetch line shows why: git asks for the gitlink sha itself, not the
branch tip. A local clone silently ignores `--depth` ("--depth is ignored in local clones"), so the
first run of that experiment was a false green until the remote was re-addressed as `file://`. The
GitHub half is confirmed on the first consumer to switch, which is what the canary is for.

### What the code round changed, and the cases that hold it

Twelve reviewers over three vendors read the branch; the gate returned `proceed` and 13 of 28
findings were accepted. Seven more cases now exist, each observed red first.

The sharpest was a defect the story had introduced while fixing another. `rev-parse HEAD:<path>`
does not throw for a path that is not a submodule — it SUCCEEDS for any committed object, handing
back a tree id for a directory and a blob id for a file. A submodule replaced by vendored files
therefore resolved to a tree sha, was compared against a remote COMMIT sha, and reported `STALE
vendored` with the advice `git submodule update --remote vendored`, which cannot work on a
directory. Only the tree entry's MODE separates the two, so the pin is now read from `ls-tree` and
used only at `160000`. Mutation-checked: removing the mode comparison turns that one case red and
nothing else.

`branch = .` is git's documented shorthand for "the branch this superproject is on", and
`branch = refs/heads/release` is a legal fully-qualified spelling. Prepending `refs/heads/` blindly
built `refs/heads/.` and `refs/heads/refs/heads/release`, so two configurations git supports were
reported as unresolvable. `resolveRef` now handles all three shapes, and a detached HEAD under
`branch = .` is named as the configuration error it is rather than matched against nothing.

A declared path that is not a gitlink used to be labelled `NO SUCH REF`, which sends the reader to
investigate a remote branch when the defect is entirely local, and the summary counted it among
"unresolvable refs". It is now `NOT COMMITTED`, with `git add <path> && commit` as the cure, and the
three failure kinds are counted separately. A missing ref on a CODE pin no longer advises the rules
repository's promote-release workflow — the wrong repository and the wrong cure; the message names
the submodule's own url.

Two smaller ones: a `[submodule]` section with no url threw an uncaught error out of the script, and
an empty `ls-remote` answer for an unborn remote HEAD produced a message about dropping a
`branch = ` key that was never there. Each remote is also named on stdout before it is probed, so a
call spending the 30-second launcher bound does not read as a hang.

Four `--get` subprocesses per submodule became one `--get-regexp` read of the whole file.

Two more setup errors were caught by reading failures rather than counts. A hierarchical branch
fixture used `release/stable` on a remote that already had `release`, and git refuses that push — a
ref cannot be both a file and a directory. And the unreachable-remote case pinned an all-zero sha,
which git rejects outright as a gitlink. Neither was the tool's opinion about anything.

Fifteen findings were rejected with reasons, four of them on premises the code disproves: the ref is
spelled `refs/heads/<branch>` in full precisely so a tag can never match it; `trackedBranch` and the
tree read both go through the bounded family launcher rather than an unbounded call; the submodule
section NAME is already derived from the config key rather than from the path; and printing a branch
name to stderr is not shell injection, because nothing here executes it.

## The promotion gate (`tools/promote-release.mjs`)

`tools/promote-release.test.mjs` — 30 cases. The gate decides which commit six repositories load as
their policy, so the tests are about its REFUSALS: a gate that has only ever been exercised on its
happy path is a gate nobody has watched close.

The judgement (`decide`) is exported separately from the side effect (`promote`), and both take
`git` and `gh` as functions, so every refusal is driven at process level against real Git
repositories in a temp directory with a stand-in answering as GitHub. The stand-in is not a
weakening: it still has to produce a completed, successful run for the exact sha.

Refusals covered: a sha that is not 40 hex characters (five spellings, and GitHub is never asked);
a commit `main` does not reach — settled locally before GitHub is asked; no `ci` run at all; a run
that is `in_progress`, `queued` or `waiting`; a run that completed `failure`, `cancelled`,
`timed_out` or `startup_failure`; a green run of a DIFFERENT workflow for the same sha; a green run
for a different sha; two runs where one failed — not outvoted, because two answers about one commit
is a question and the gate does not guess. An answer that cannot be parsed is `UNDECIDED`, never
"no runs": no answer is not an answer of no.

Movement: the happy path pushes exactly `refs/heads/release` and moves nothing else; an older sha is
refused as not a forward move, with the revert-on-main rollback named; a commit beside `release`
that neither reaches is refused; a sha already at `release` is a verified no-op, and is still
refused if its run is now red — a hand-pushed unverified ref does not become legitimate by being
there. `--dry-run` suppresses the push and never the judgement.

Exit vocabulary is `0` promoted, `1` refused (the sha's own standing), `2` usage, `3` undecided
(evidence could not be gathered, or the push did not land). Nothing is pushed on any non-zero exit.
The split follows `http-run.mjs`: a workflow log reader needs to know whether the COMMIT or the
RUNNER was the problem.

**Teeth checked by mutation, not by reading.** Making an absent `ci` run acceptable turns exactly
four cases red — the three process-level ones and the `judgeRuns` unit — and nothing else; the file
was restored byte-identically afterwards and re-run. Fable's own rounds also observed: the ancestry
check removed promoted an unmerged branch tip on its own green run; `--dry-run` made to push anyway
left `release` on the remote; and with the forward-only check removed, **git itself** rejected the
non-fast-forward push, so the ref still did not move — the second line of defence holds
independently of the first, which is the point of carrying no `--force`.

**Not covered, and why.** The 30-second `gh` ceiling and the real `gh` binary and auth path: a
30-second hang per case is not a test worth having, and the ceiling belongs to `lib/proc.mjs`, which
`proc.test.mjs` already covers. The server-side ruleset on `release` is repository settings rather
than a file — and as of 2026-09-14 it is not configured at all, which the README records as an
accepted gap rather than an oversight. `PUSH NOT CONFIRMED` (the remote reporting a different sha
immediately after a successful push) is a race that could not be staged deterministically against a
local bare remote.

### What the gate's code round changed

Fifteen findings across three vendors; seven accepted. Three of them — from three independent
reviewers — were the same one, and it was right.

**The `gh` executable is no longer nameable by the environment.** `ghLauncher` honoured a
`PROMOTE_RELEASE_GH` variable, which the process-level tests used to answer as GitHub. The argument
for keeping it was that it weakens nothing a PATH entry could not. Three reviewers answered the same
way: an inherited or injected variable on a self-hosted runner could point it at a shim that answers
"green" for any sha, after which the gate uses real credentials to move the ref — and a custom
variable is exactly the sort of thing a workflow context leaks where PATH is sanitised. The seam is
gone from production entirely. `main` now takes `gh` as a parameter, and each case spawns a small
entry script that imports `main` and hands it a double. That is still a real process with real argv
parsing, real git and the real judgement — and a function parameter is not something an environment
can set.

**A truncated listing is UNDECIDED, not a clean sha.** One page of 100 runs was asked for and judged
as if it were all of them. If GitHub reports more runs than it returned, the ones it did not return
could hold the failed twin the gate refuses on, and a page of successes would read as clean.
`ciRunsFor` now compares `total_count` against the list it was given and refuses to read a short
answer.

**`GITHUB_REPOSITORY` and origin must agree.** The variable decided whose `ci` runs vouched for a
sha while the push always went to origin, so in a local clone it could be set to a fork whose green
run then authorised a ref on this remote. A mismatch is now resolved in neither direction: it
returns nothing and the `WHICH REPOSITORY` branch stops the run.

**A push that errors is no longer assumed to have failed.** If the remote accepts the update and the
connection drops before the response arrives, the ref HAS moved and consumers can already see it;
reporting "nothing was pushed" sends an operator to repair a correct state. The catch path now asks
the remote where release is before concluding, and reports PROMOTED when it is already at the target.

That race itself **is not covered**, and it cannot be staged deterministically against a local bare
remote. What is covered is the half that can be: a `pre-receive` hook that rejects the push, after
which the refusal names where release actually is. Mutation-checked — removing that wording turns
exactly that case red. The first draft of this test was a false positive: it put the remote at the
target sha, which takes the "already there" early return and never reaches the push at all. It
passed without ever having been red, which is worth recording as the failure it was.

Eight findings were rejected on evidence the implementation already carries: the absent-`release`
bootstrap is an explicit branch (`tips.get(RELEASE_REF) ?? ""`, the fetch and forward-move check both
guarded); network and `gh` failures are already `UNDECIDED` rather than refusals; a tag cannot
participate because both the query and the push spell `refs/heads/` in full; ancestry is judged
against origin's freshly-read `main`, with a shallow checkout refused outright before that point; and
the "strict multi-run check deadlocks a sha forever" worry does not hold, because re-running a
workflow adds an ATTEMPT to the same run record and updates its conclusion rather than leaving a
failed twin — which the `CI NOT GREEN` message already names as the escape.

### The gate's second code round — and the hole it found in the workflow

Twelve reviewers, twenty-five findings, fifteen accepted. The most serious was not in the tool at all
but in the YAML written to drive it, and two vendors named it independently.

**The workflow interpolated the dispatch input straight into a shell command** — `node
tools/promote-release.mjs "${{ inputs.sha }}"`. Actions substitutes that text before the shell parses
the line, so a dispatcher submitting `$(…)` or `"; …; #` runs arbitrary commands on the runner with
the workflow token, long before the tool's 40-hex check ever sees the value. It now travels through
the environment (`SHA: ${{ inputs.sha }}` then `"$SHA"`), where no such expansion happens. Written
down because the gate was built precisely to stop unverified things reaching six repositories, and
the first serious way in was the door it walked through itself.

Two more in the same file. The checkout took whatever ref the dispatch selected, so a branch carrying
an edited `promote-release.mjs` could have judged — and promoted — a main commit under rules nobody
reviewed; the job now refuses to run from anything but `main` and checks out `refs/heads/main`
explicitly. And the job had no `timeout-minutes`, so a stalled checkout or `npm ci` held a runner with
no verdict and no failure, which reads like a gate still thinking rather than one that never answered.

**The run listing is now paged, and asked of the `ci` workflow rather than the repository.** The
first fix for truncation compared `total_count` with what came back — but the generic
`actions/runs?head_sha=` endpoint returns EVERY workflow's runs for a sha and counts across all of
them, so on a busy commit a complete page of ci successes sat beside a hundred unrelated runs and the
count said the answer was short when it was not. That made a valid commit permanently unpromotable,
which is a fail-closed bug rather than a safe one. `collectCiRuns` now asks
`actions/workflows/ci.yml/runs` and pages until it has seen the count, bounded at ten pages. A
`total_count` that is missing or not a non-negative integer is unreadable rather than "nothing more to
fetch" — otherwise one page of successes could stand in for a listing whose later pages hold the run
that disqualifies the sha. Mutation-checked: making the pager stop after page one turns the
second-page case red.

**A refusal no longer claims nothing was pushed when a push was attempted.** `report()` ended every
message with "Nothing was pushed; release is where it was" — true before the push, a claim the tool
cannot make after one, because the remote may have accepted the update and lost the response. It now
takes an `afterPush` flag and says instead that the state is what the lines above say and no more.
The push-error path also distinguishes a read-back that ANSWERED from one that itself failed: the
second says whether the update landed is unknown, rather than reporting the ref as absent.

Ten findings were rejected on evidence the code carries: the shallow-checkout refusal is the FIRST
statement in `standing()`, before any fetch or ancestry question; `remoteTips` is bounded by
lib/git.mjs's 30-second ceiling like every other call; a tag cannot reach the push because the input
must be 40 hex AND `cat-file -t` must answer `commit`; the empty-slug case is checked before GitHub is
asked; and re-verifying a sha already at `release` is the feature, not waste — it is the one case
where the ref may have arrived without ever passing the gate, and so the one case that must not be
skipped.

**What the automated reviewer added.** Four findings on the pull request, all taken.

The sharpest was a coercion: `Number(parsed.total_count)`. `Number(null)`, `Number(false)`,
`Number([])` and `Number("")` are all **0** — and a total of 0 tells the pager it has seen everything
after one page, so a malformed answer would have ended the listing while looking complete. That is
precisely the shape paging exists to refuse. The count is now type-checked (`typeof === "number"`,
safe integer, non-negative), and the case list includes the numeric STRING, which is the near miss
that looks right and is not. Observed red first: *total_count null coerces to 0 and must not be read
as a count*.

It also found the SAME injection class in the guard step added to fix the first one:
`echo "… ${{ github.ref }}" >&2`. A ref is far less controllable than a dispatch input and anyone who
can dispatch already has write access — but a step whose whole job is to refuse an unexpected ref is
a poor place to evaluate it. Through the environment now, like the sha. Recorded because it is the
instructive part: the fix for a template-expansion hole introduced another one three lines away.

## The distance watch (`tools/release-distance.mjs`)

Six cases. The check exists because the mechanism it watches creates the failure it looks for:
freezing `release` removed a loud problem and introduced a quiet one, where every pin equals its
tracked tip, every `pin-check` is green, and the rules the family reads get older every week.

Two of the cases are the ones that decide whether it is worth having. *An ordinary quiet week does
not fire* — a release a few commits behind, published recently, is a deliberate state, and a check
that fires on it is one people switch off. And *a release whose commit is old FAILS even when main
has barely moved*, which distance alone would call healthy: nothing written and nothing published is
the actual stall, and it is the only case where the repository looks calm and is not. That case needs
a commit with a backdated committer date, which is the one thing no fixture directory could express.

Mutation-checked: removing the age bound turns exactly that case red and nothing else.

*No release yet* is deliberately NOT a fault, and says so in those words — before the first promotion
there is nothing to be behind, and "not published yet" and "publishing has stopped" look identical
from a consumer's side while only one of them is fine. An unreachable remote is UNDECIDED rather than
a distance of zero, for the same reason it is everywhere else in these tools.

**What the plan round added.** Twelve findings, six accepted.

Two reviewers independently noticed that a `release` force-moved to an unrelated commit defeats both
metrics at once: `rev-list release..main` counts only main-side commits and answers a SMALL number,
and a recent force-move passes the age bound too — so the check reports health while what consumers
load is not on main's history at all. `promote-release` cannot produce that state, but the ref has no
server-side protection, so a hand-push can, and this is the only check that would ever look.
Divergence is now judged FIRST, before either metric, and reported as *release is not on main*. The
fixture needed an orphan branch; its first draft failed with `fatal: bad object`, because `publish`
pushes from a clone that had never seen that commit — a fixture fault that looks nothing like the
divergence under test.

The other accepted one changed `pin-check` rather than this file. The `.git/config` trap was
documented and nothing asserted it: `git submodule update --remote` reads `submodule.<name>.branch`
from the LOCAL config first, and `git submodule sync` copies the url but not the branch — so a clone
made before this rollout keeps following the default branch while CI, a fresh clone with only the
committed config, follows `release`. A bump made on that machine lands at the wrong tip and CI calls
it STALE, which reads like a bug in the rollout rather than one stale line on one developer's
machine. `pin-check` now reports `LOCAL OVERRIDE` naming both values and the `--unset` that ends it,
with a companion case proving a cached branch that AGREES does not fire.

Six were rejected on evidence the code carries: the absent-`release` branch is taken before any
metric and returns WITHIN by design (exit 3 would make a scheduled job red every week for a state the
plan calls correct); the bounds are already `--max-commits`/`--max-days`; every git call is bounded by
lib/git.mjs's 30-second ceiling and a failed fetch is already UNDECIDED; and `fetch-depth: 0` is not
what supplies the release object — `measure()` fetches both refs itself and then asks by SHA, which
is why a fresh clone reading a 90-day-old release commit works at all.

**What the code round added.** Twenty-four findings, nine accepted. Two are worth recording.

`--max-days soon` became `NaN`, and every comparison with NaN is false — so a typo in a flag switched
the alarm off while still exiting 0. A detector that reports health because its own argument was
misspelt is worse than one that is missing, because it looks like it ran. Bounds are now validated as
non-negative integers and a bad one is a usage error. Observed red first.

And the age bound's CLAIM was wrong, which two reviewers caught from opposite directions. It said
"publishing has stopped", but it measures the commit's date — so promoting a deliberately older
reviewed commit would have read as a stall the moment it landed, which is the false alarm that gets a
check disabled. The measurement is right and the sentence was not: it now says *what consumers load is
N days old*, which is the thing that actually matters and the thing the number actually is.

Fifteen were rejected, four of them on claims the repository disproves outright. The loudest was
Blocking: that `actions/checkout@v7` and `actions/setup-node@v7` do not exist and every scheduled run
would fail. Every workflow here already uses them and `gh run list` shows those runs concluding
`success` — it is a knowledge-cutoff artefact, and had it been true this repository's CI would have
been failing for months rather than gating a pull request. Three more asserted code that is already
there: `--warn` IS checked before the failing return, the fetch DOES precede `merge-base`, and the
ancestry comparison uses the SHAs read from the remote rather than local branch names, so a stale
local pointer cannot participate.

## Rule ownership (`tools/ownership-check.mjs`)

Fourteen cases behind the rule that says a shared rule names no product. Three of them are controls
rather than findings, and the controls are what decide whether this check survives contact with the
corpus.

`benchmark` is a legal value in the task vocabulary, so a detector matching the bare word would refuse
a perfectly legal frontmatter — and a check that goes red on a legal file is one somebody switches off
within the week. The fix is the determiner: measured over the corpus before the check existed, the
definite form ("the sidecar has no Serilog") appears 24 times and is nearly always a product
reference, while the indefinite form ("a sidecar process") appears 6 times and is always generic. So
*`the sidecar` fires and `a sidecar process` does not* is a case, with the negative half asserted.

The third is *a repository no list has heard of is still caught*. The detector is the PATTERN
`dew_flow_[a-z0-9_]+`, not the six names: a list would pass the seventh repository to join, which is
exactly the one nobody would remember to add.

**Two defects the tests found in the tool, both of which had hidden themselves.**

Importing the module ran the whole scan — there was no entry guard, so the first test run scanned the
real corpus and exited before asserting anything. It now returns an exit code from `main()` and the
guard runs it only as a command, the same shape `post-deploy-check.mjs` uses.

And `\bcoai\b` does **not** match inside `mcp__coai__open`, because `_` is a word character. So MCP
tool names — the densest product reference in this corpus — were invisible. That gap hid itself twice
over: the tool called the file clean, and a fixture written to prove the `owns:` marker worked passed
*because nothing had been detected to declare*. A green test for a mechanism that never ran. The
detector now has a shape-based `mcp__<product>__<tool>` pattern, and the marker fixture means what it
says.

**A marker inside a code fence or an inline span is documentation, not a declaration.** Also not
hypothetical: the rule that documents the `owns:` syntax was reported as carrying a malformed marker,
by the check it defines. Marker parsing skips fenced and inline code; findings do not, because a
product name in an example is still a product name.

Scanning zero rule files is a failure with its own sentence, not a pass — run from the wrong
directory, this check would otherwise report a clean bill of health for a corpus it never opened.

**The corpus on the day it landed: 129 product references across 26 of 32 shared rules.** That is the
worklist, and it is why the CI step carries `--warn`.

## The frozen bodies became a recorded freeze

`rules.test.mjs` compared every one of the 24 migrated bodies against `originalBodySha256` for ever,
which made them uneditable: every improvement had to become a NEW rule file, and the corpus grew
instead of being corrected. That is visible in the numbers — 24 migrated rules, 32 today.

The two records now live in two files, and the code round is the reason. Keying the live hash off
the migration map covered the 24 rules that were migrated — which left the other eight, including the
rule that defines this whole policy, protected by nothing at all, and getting quieter as the corpus
grows. So `research/shared-rules-migration-map.json` went back to being migration EVIDENCE only
(`originalBodySha256`/`sections`, asserted to be present and well formed, because what they protect is
somebody deleting the record), and `research/rule-bodies.json` carries `bodySha256` for **all 32**
rules, compared against the live body and moved in the SAME commit as any edit.

So the freeze changed from *no edit ever* to *no accidental edit*. Observed red before it was relied
on: appending one sentence to a rule without touching the map fails with
`common.durable-status: the body changed without its currentBodySha256 — update the map in the same
commit`.

**What the plan round added.** Ten findings across two reviewers (the third was at capacity); four
accepted, and two of them were holes in what this story promises rather than polish.

**The ratchet.** A bare `--warn` exits 0 whatever it finds, so a pull request adding a NEW product
reference would have merged unnoticed for as long as the backfill takes — which defeats the single
guarantee the rule makes, that the drift cannot recur. The backlog is allowed while it is worked off;
nothing may be added to it; deleting the baseline file is the armed state, at which point any finding
at all fails.

**The budget is PER FILE, and that is not a refinement.** The first version allowed a repo-wide total.
The code round named what that buys: one branch cleans ten references out of one rule and, without
ever touching a second rule, pays for two new ones somebody adds on a different branch — both branches
are under the total, both are green, and the reference that the rule exists to stop merges. So
`tools/ownership-baseline.json` records a count per file, a file over its own count fails, and the
case that proves it is *cleaning one file never buys room for another to get worse*. A file with
findings and no entry at all is new drift by definition. A baseline that cannot be READ stops the run
rather than allowing everything, because a manifest that does not parse would switch the ratchet off
and still look green.

A malformed marker and a downward dependency are never forgiven by a baseline, because those are
defects in the mechanism rather than a backlog of names — asserted by a case whose baseline allows
far more findings than the fixture has, and which still fails.

**The rule was loading in the wrong repository.** Its `paths` matched `.agents/rules/**`, so an agent
editing a CONSUMER's own local rules would have been handed a rule saying "name no product" — exactly
inverting what those files exist to hold. Scoped to the shared corpus only, with the reason written
into the rule so it is not re-added.

An explicitly named `--baseline` that is not there is a usage error rather than a silently disabled
ratchet — the missing DEFAULT means armed, but a path somebody typed and misspelled must not read as
"nothing to forgive". The scalar version had the same shape of trap for the same reason
`release-distance` did: `Number("soon")` is NaN and every comparison with it is false.

Marker reasons are now checked for shape as well as length — three words, and a placeholder list.
That fix was itself a lesson: the first attempt wrote a literal `0x08` byte where `\b` belonged, so
the placeholder list matched nothing and `"required for now"` passed as a justification. It took three
attempts to repair, because the mangling recurs every time a backslash goes through a heredoc. No
check can judge whether a justification is HONEST — the marker is visible in the diff for that — but
it can refuse the shapes that are not reasons at all.

Six were rejected on evidence: the 16 KiB core cap is already enforced with its own message (and is
the reason this rule is `conditional`); `load: conditional` is a selection mechanism and resolves no
repository at runtime; the unrecorded-edit case is exactly what the two-hash freeze detects and was
observed red; the fence/inline-span distinction is tested in both directions; the suite is green WITH
the new rule present, which disproves the claim that asserting the original hashes breaks newly
authored rules; and `downwardDependencies()` implements the `depends:` constraint the last finding
asked for, with a fixture and a case.

**What the code round added.** Seventeen findings across seven reviewers (codex was at capacity for
all four of its slots); seven accepted. Two were the structural ones above — the per-file budget and the
manifest split — and both were holes in the guarantee rather than polish. A third was quieter and worth
recording: this check and the resolver each carry their own hardcoded list of rule directories, so a
fifth directory would be distributed to consumers by `loadCatalog` and skipped entirely here. There is
now a case that builds a probe file in every directory the resolver declares and fails unless the scan
finds all of them. It read the directory back out of a path with `[\/]`, which matches only a forward
slash while the tool returns the platform separator — green on CI, red on the machine it was written on.

**What the automated reviewer added.** Six comments, four of them real, and three were the same kind of
defect as the per-file budget: a check that answers a slightly different question than the one it was
asked, and says nothing about the difference.

- **The baseline was a ceiling only.** A file recorded at 5 and carrying 3 passed with an advisory. That
  leaves two slots a reference can be added back into later, under the old number, with nothing to say
  a word — the hole the per-file split closed, one level down. The recorded count is now a floor as
  well: a file that got cleaner fails until its number comes down in the same commit, naming the number
  to write, and a file cleaned to zero has its entry removed rather than left standing.
- **`owns:` matched by substring.** `<!-- owns: e — … -->` is a perfectly well-formed marker, and `e`
  sits inside every `dew_flow_*` name there is — one character would have licensed the corpus. The token
  is compared exactly now, which also means `coai` no longer covers `mcp__coai__open`: a tool name is a
  different name and gets its own decision. Both fixtures that relied on the substring behaviour were
  passing for that reason and now declare the token they actually use.
- **`depends:` was read in one of three legal spellings.** The resolver parses frontmatter with a real
  YAML parser, so `["local.x"]`, `[local.x]` and a block sequence all mean the same thing; this tool has
  no YAML dependency on purpose, because that is what lets it run before `npm ci` and be the first check.
  It reads all three by hand now.
- **`--baseline` as the last argument** read as no flag at all and checked the default file instead — the
  same shape as `--max-days soon` becoming NaN. It is a usage error with its own sentence.

The two rejected were the automated reviewer's standing advice to bump consumer pins in the same pull
request (pins follow the `release` ref, which moves through `promote-release.mjs` once, after the
programme lands — a cascade per pull request is the churn this work exists to remove), and a re-report
of the empty-directory fixture, already fixed one commit earlier by building the repository in a temp
dir instead.

**What the static scanner added, and what it got wrong.** Five issues, all in this one file, and the
quality gate failed on the first of them.

- **Cognitive complexity 49 against a limit of 15** in `main()`, which was fair: it read the baseline,
  walked the corpus, printed every kind of finding and judged the ratchet in one function. It is four
  named ones now — `loadBaseline`, `scanCorpus`, `report`, `judgeBaseline` — and the tests did not change,
  which is the only evidence a refactor can offer.
- **Two regexes reported as super-linear.** The marker pattern spelled both halves of
  `<!-- owns: token — reason -->` as one expression, which put a lazy run of *anything but an em dash*
  immediately before an alternation that can match a hyphen, and needed a SECOND pattern beside it for
  the separator-less shape. One capture of the comment body, split in JavaScript, reads the same, cannot
  backtrack (`[^>]` never crosses the `>` that ends a comment) and collapses the two passes into one.
- **The `depends:` block sequence reported as exponential backtracking — measured, and it was not.**
  `(?:[ \t]+-[^\n]*\n?)+` can match one line many ways, but nothing follows the group, so the engine
  takes the first way and never retries: 22 `- item` runs on a single line matched in under a
  millisecond. The report was still worth acting on for the other reason — a reader cannot get that
  guarantee out of the pattern, and can get it out of a loop that takes each line once. The comment in
  the code says which of those two things is true, because a note claiming a denial of service was
  fixed here would be a claim the measurement does not support.

## Recording a body, and the bug that found itself (`tools/rule-bodies.mjs`)

The freeze had one half. `rules.test.mjs` fails when a rule's body changes and `research/rule-bodies.json`
does not, and the story that introduced it updated the manifest with an uncommitted scratch script — a
procedure executable by its author and by nobody else. A plan reviewer called that Blocking, and was
right: the alternative on offer was re-deriving sha256 over a body-after-frontmatter by hand, for 21
files.

`node tools/rule-bodies.mjs` verifies and names every drifted rule; `--update <id>…` records the ones you
NAME. Seven cases, and the one that matters is *`--update` records the ids it was given, and only those*:
two bodies are edited, one id is passed, and the other must still be drift afterwards. An `--all` flag
would make the command that records a deliberate edit identical to the command that blesses an accidental
one, which is the only property the freeze has. Proved red by breaking exactly that line — (`ids` taken
from the manifest instead of from argv) — three cases went red, including the two that assert a bad id
and a missing id write nothing.

It also cross-checks the pass: asked to verify after the anonymisation, it named **21 drifted rules**, which
is exactly the 21 files the pass was supposed to touch.

**And then the suite went red on a corpus nobody had edited.** `a shared rule depending on a local id is
refused` failed because `core.autocrlf` had rewritten the fixtures on checkout: the frontmatter pattern
anchors on `\n`, so on a CRLF working copy `downwardDependencies` matched nothing and the tool reported
`OK — no undeclared product references` for a rule that declares one. The same fixture passes on CI,
where the checkout is LF, which is how it stayed invisible — a green check that never ran, on the machine
somebody is actually editing on. All three parsers fold line endings now, the same way the resolver does,
and the case asserts all three on CRLF input.

### What the code round added

Twelve reviewers, 28 findings, ten accepted. Two of them were found independently by two vendors, which
is usually the signal worth reading first.

**Three implementations of “what a rule's body is”.** The resolver folded CRLF and stripped frontmatter;
the ownership check anchored on `\n` and folded nothing; the body freeze folded and stripped in its own
copy of the same two expressions. The consequence both reviewers named: if the resolver ever normalises
differently, the freeze hashes bytes that are not what six repositories load, and then it blesses or
refuses a policy change on the wrong evidence. `tools/lib/rule-body.mjs` now holds `folded`, `bodyOf`,
`outsideFences` and `sectionsOf`, and the resolver, the ownership check, the freeze tool and
`rules.test.mjs` all read through it. It is dependency-free because the ownership check runs before
`npm ci`, which is what lets it be the first step in the job.

**`# @name` inside a code fence was a heading.** Verified against the real manifest before accepting:
`common.http-contracts` recorded `# @name vault_get_returns_the_callers_blob` and `# @prod`, and
`common.git-workflow` recorded two shell comments. So editing a comment in an `.http` sample reported
that the rule's HEADINGS had changed. `sectionsOf` strips fences, and because both the tool and the
test use it, they cannot disagree about what a heading is. Twelve rules had their recorded outline
corrected; no body hash moved.

**`--update common.one --all`** dropped the flag, recorded one rule, exited 0 and said the manifest was
written. For a tool whose whole argument is that there is no `--all`, silently accepting the word and
doing something else is the worst available answer. Any `--` argument after `--update` is now refused by
name, and nothing is written.

**`drifted()` walked the manifest, not the disk.** A NEW rule file therefore entered policy distribution
with no freeze over it while the tool reported OK, and a deleted or renamed source came back as a bare
ENOENT. It walks both now: an unrecorded rule and a missing source are each reported as what they are,
and neither offers `--update` as the cure — a rule that joins or leaves policy is a manifest edit somebody
makes on purpose.

**The manifest was truncated before it was rewritten.** It is written to a temporary file beside itself
and renamed over, so a killed process, a full disk or a read-only checkout leaves the old record intact
and says which file could not be written. The case makes the write fail portably by putting a directory
where the temporary file has to go — the first attempt made the MANIFEST a directory, which broke the
read instead and proved nothing.

Eighteen were rejected. Six were one claim repeated: that “in one repository here” is an invented term —
it is the worked example in `common/rule-ownership.md`'s own anonymisation table, and “here” is the scope
that keeps the claim honest. Two asked for the product names to be restored. One asserted that
`markersIn` folds too late; it folds at `ownership-check.mjs:143`, before the fences are stripped. Two
asked for a `--dry-run` whose output is what `git diff research/rule-bodies.json` already shows, on a
tracked file, for a command that prints every id it touched with both hashes. One asked for a lock file
against two people running `--update` in the same directory in the same second.

**And the automated reviewer caught what the twelve reviewers did not.** Stripping fences from the
heading scan also stripped INLINE code, content and all, so the heading "### 7. `git status` answers WHAT" was
recorded as "### 7.  answers WHAT" — six headings across five rules lost the names they were about,
visible in the manifest diff and nowhere else. A fenced BLOCK is something being shown; an inline span
inside a heading is part of the heading, and those are two functions now.

It also found that `--all` on its own fell through to a verification run and printed OK on a clean
corpus, which a caller who believed in `--all` would read as "recorded", and that `--typo --update <id>`
updated the manifest with the typo ignored: `--update` must now be the FIRST argument, and anything else
is refused with the two shapes this CLI has. And the test helper that replaced a fixture's body anchored
on the OPENING `---`, so every edited fixture lost its frontmatter entirely and the freeze was being
exercised against a file shape that cannot exist. There is now a case asserting that metadata is not
part of what gets hashed.

## The audit ledger (`tools/audit-ledger.test.mjs`)

`common/reliability.md` was 29 of the 68 references left in the corpus, and the only rule BUILT out of
citations: written from a four-repository audit on 2026-08-16, with a header instructing the reader to
cite `repo · path:line` for every finding. Anonymising the body and leaving that header would have
produced a rule whose own instructions restore what the rewrite removed.

A plan reviewer raised the objection this whole policy has to answer, as Blocking: anonymise in place,
and a year later nobody can check the claim. `research/reliability-audit-2026-08-16.json` is the answer
— 23 findings, each with the address it had, the evidence, what it cost, the date, and the sentence
that replaced it — and it sits OUTSIDE the rule corpus on purpose: nothing loads it as policy, so nobody
edits it when a product is renamed, which is the property being protected.

Five cases keep it honest, and both directions were observed red before they were relied on: rewording
a finding without touching the ledger, and putting a repository name back into the rule. The second
half is checked with `findingsIn` — the same detector the whole corpus is checked with — so the two
cannot disagree about what a product reference is.

**What the code round added.** The linkage check required `now` to appear; it now requires it to appear
**exactly once**, because a sentence reused under a second requirement would otherwise let one
finding's address and cost describe a claim it was never about. It also accepted an empty `now`, which
matches every rule ever written. And the identity check tested for duplicate ids but not for absence,
so deleting an entry left the suite green while the evidence for one finding was gone — in the file
whose only job is that it survives. The id set is now asserted to be exactly R-01 to R-23, in order.

Both sides are whitespace-collapsed before comparison. The entries carry the line breaks they were
copied with, which matches today and would stop matching the first time somebody reflowed a paragraph
around a sentence that is still there. A reviewer predicted that failure was already happening; it was
not — the suite was green — but the fragility was real and is gone.

The test then caught three of this story's own edits: making three sentences imperative moved them out
from under their ledger entries, and the suite said so before the commit.
