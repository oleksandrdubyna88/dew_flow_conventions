# PLAN — The `raw-temp` baseline: rule §7 authorises one ratcheting, membership-keyed baseline for sites proven to run inside an owned run folder

> Status: **epoch 2 OPEN (re-review document gate passed, proceed, 4 reviewers, 2026-11-02; approved by reviewers, not
> narrowed) — the epoch-2 items are built on the branch (local commits `f567bf3`…, see § *Build progress*; not yet pushed or gated); #108 may take new code again.** The stop of 2026-11-02 (a second
> change after approval; CodeRabbit on #108) is closed: this document is the WHOLE plan revised for epoch 2 (step 4 of
> the full stop, against re-review consult `b6ce1182` and the coordinator's verifications), sorted by an Opus judge
> (18 fits, 0 cut) and passed by the document gate, whose four findings are applied and marked *[re-review finding n]*.
> Before the stop: **S1–S3 built on branch `feat/raw-temp-baseline` (PR #108, unmerged); the release (S4), the C#
> reader and the pin bumps are NOT done** — see § *Build progress*. Scope: one sentence in the core
> `common/test-leftovers.md` §7, a pointer paragraph in the detail `common/test-leftovers-detail.md` §7, the full
> definition in the companion `common/test-leftovers-baseline.md`, the Node guard `tools/leftovers-check.mjs` with
> `tools/lib/raw-temp-baseline.mjs` (the `--baseline` pass, the `--baseline-shrinks` check, the `--print-baseline`
> listing, the class `baseline`) and its tests, the rule tests' caps, the selection baseline, the research record, one
> release, and the pin bumps. It changes the family's PUBLIC test-leftovers contract; the C# side is a recommendation
> to the template's owner, not a change here. Written by Fable as a cornerstone spec; coded by Sonnet; reviewed by
> Opus. **Plan gate** (coai session `c42be871`, round 1, 2026-11-01, both reviewers answered): verdict **PROCEED**,
> five findings, all accepted and applied, each marked *[gate finding n]*; the gate ruled the plan one unit, not
> split. B1 decided with the round: the hash is of the TRIMMED line.

## Plan changes

> Epoch 1 · approved 2026-11-01 · by reviewers · state: closed

- 1.1 · 2026-11-01 · reviewer · contract — the baseline has one fixed path at the repository root and is never a symlink
  (Opus B1: a symlink turned a grown baseline into an allowed creation — the file at a link's target was "absent at base"
  and `--allow-create` passed it; Opus M3: with a path argument, any new path counted as a "first creation", so a second
  baseline file passed the creation rule. One path, a regular file, closes both: `--baseline`, `--baseline-shrinks` and
  `--print-baseline` take no path, and wherever this plan says `--baseline <path>` or `--baseline-shrinks <path>` it
  now means the flag that reads `raw-temp-baseline.json` at the repository root.)
- 1.2 · 2026-11-01 · agent · approach — the full definition lives in a companion `common/test-leftovers-baseline.md`, not the detail
  (N1's default was the detail; with F16's sentence beside it the detail would exceed its 32,768 B per-read cap. The core keeps
  its one sentence; the detail's §7 points to the companion.)
- 1.3 · 2026-11-01 · agent · contract — a creation is judged by `git log <base>` only, and a shallow clone fails closed only for a creation
  (the planned `git log --all` would see the creating PR's own commit, so the one creation could never pass in CI, and a shallow
  check on every shrink run would fail every CI job; later the Opus review removed the interim `--all --not HEAD` part.)
  (Both were accepted on 2026-11-01 and not recorded then; CodeRabbit named them on #108 on 2026-11-02, and they are recorded
  now. This second change stops the plan: no new code and no merge of #108 until the whole plan is reviewed again.)

### Re-review for epoch 2

Narrowed: no — every entry is reconciled by exactly one guard, the one its scope names (`guard: "node"` or `"csharp"`), and the companion requires a repository whose baseline names a guard to run that guard in CI on every pull request, so the global reconcile of epoch 1's Goal 4 and Definition of Done [gate finding 0] holds entry for entry; scope, the merge conditions (grown by the re-review gate and CodeRabbit's threads) and the release are not smaller; the re-review ADDS (the companion selected for `implement`, the named-guard reconciliation, the git-root check on the scan path, the scope precedence written into the format) and RELOCATES (the full definition from the detail to the companion); ledger 1.3's base-only history check replaces a check that could never pass

| Work | Where | Verdict | Action |
|---|---|---|---|
| 9c3b62c docs(plans): the plan, first version | pushed, unmerged (#108) | fits | kept — the plan's first text; the revision replaces it in this file |
| f753618 docs(plans): plan gate round 1 applied, epoch 1 opened | pushed, unmerged (#108) | fits | kept — the gate's five findings stand in the revision |
| 55e44a5 merge of main (no work of this plan) | pushed, unmerged (#108) | fits | kept — main's text only, no work of this plan |
| f1ae481 test(rules): the core phrase, the detail paragraph, CORE_CAP 9000 — RED | pushed, unmerged (#108) | fits | kept — its detail-paragraph check already replaced by cb511e4 (ledger 1.2) |
| 13e8fbb feat(rules): §7's core sentence and the detail paragraph; bodies re-recorded | pushed, unmerged (#108) | fits | kept — the core sentence stands verbatim; its detail paragraph already replaced by 5d915f2's pointer |
| 23f115b test(leftovers): fifteen behaviours — RED | pushed, unmerged (#108) | fits | kept; fix forward CodeRabbit 28 (test 11's `file://` URL) |
| cb511e4 test(rules): the definition is a companion rule — RED | pushed, unmerged (#108) | fits | kept; fix forward E2-b (the module's global reconcile) and CodeRabbit 30 (`problemOf`) |
| 92c1145 feat(leftovers): the guard's baseline pass, print, shrinks, class `baseline` | pushed, unmerged (#108) | fits | kept; fix forward E2-b (the guard wires the global reconcile); its path argument already replaced by af634a3 (ledger 1.1) |
| 5d915f2 feat(rules): the definition moves to the companion (N1); selection baseline | pushed, unmerged (#108) | fits | kept; fix forward E2-a (`implement` not in the companion's tasks) and E2-b (§ *What a guard does with it*) |
| ecd47ef test(leftovers): the fixed path and the review findings — RED | pushed, unmerged (#108) | fits | kept; fix forward CodeRabbit 28 (test 14's `file://`, tests 16, 20, 20b on Windows) and E2-b, which must also rewrite test 18's first case (see the note) |
| af634a3 fix(leftovers): one fixed path, no symlink, strict proof, git failures exit 2, indexed matching | pushed, unmerged (#108) | fits | kept; fix forward E2-b (`proofHolds`: an undiscovered proof is `proof missing`), E2-c (the `--allow-create` reason), E2-a (tasks), CodeRabbit 27 (the regex marker parse) |
| 5979588 refactor(leftovers): the guard under 800 lines — cli, docker and shell helpers to tools/lib | pushed, unmerged (#108) | fits | kept; fix forward CodeRabbit 30 (`optionsProblem` out of `parseArguments`) |
| 70b4613 test(leftovers): code round 2 — RED | pushed, unmerged (#108) | fits | kept; fix forward CodeRabbit 28 (test 23's symlink on Windows) |
| b23c70a fix(leftovers): code round 2 — one loader, guarded print read, cursor matching, option values | pushed, unmerged (#108) | fits | kept; fix forward E2-e (`loadBaselineAt` calls `locateBaseline(repo)` without `gitRoot`) |
| bc0e044 docs(plans): the rollout plan's epoch 2 (another plan's work, merged through main) | main | fits | kept — another plan's merged work; nothing here contradicts it |
| 5e077ff fix(leftovers): F16 interim (another plan's work, merged through main) | main | fits | kept — another plan's merged work; its 131 B in the detail are in the revision's 31,677 B |
| 217e6db merge of main (no work of this plan) | pushed, unmerged (#108) | fits | kept — main's work only (bc0e044, 5e077ff), no work of this plan |
| e015cf4 docs(plans): the stop — ledger 1.2 and 1.3 recorded | pushed, unmerged (#108) | fits | kept — the stop commit, step 1 |
  (Judged 2026-11-02 by an Opus judge, step 5 of the full stop: each of the 18 rows read with `git show --stat` and its diff
  where the revised plan names the code, against the REVISED plan — Goal 1-6, the file format, E2-a to E2-e, the Node
  guard, the C# surface, the Definition of Done. Confirmed after `git fetch`: the 16 branch rows are ancestors of
  `origin/feat/raw-temp-baseline` (e015cf4), #108 is OPEN and unmerged; bc0e044 and 5e077ff are on `origin/main`.
  `fits` here means compatible with the revised plan; a row that is only partly right is `fits` with the fix forward
  the revised plan already lists. No row contradicts the revised plan as a whole: 18 fits, 0 cut, nothing to revert.)
  (Not a row: 7252683, local, is step 4's revision itself — the baseline epoch 2 is approved on, not sorted work.)
  (A gap the revision does not list: test 18's first case, from ecd47ef, asserts that a proof present in the tree but
  not discovered by the scan is `proof missing`. Under Goal 6 that scope is another guard's and is silent (`unread`),
  so E2-b must rewrite that case too; it belongs in E2-b's test list beside tests 25 and 26.)
  (Hygiene, not a cut: cb511e4, a test commit "RED before the file", also adds the 194-line module
  `tools/lib/raw-temp-baseline.mjs`. Pushed history is not rewritten; it is recorded here.)
  (SUPERSEDED — kept as history; the record's one verdict is the `Narrowed: no` line above *[re-review finding 1]*. The
  judge's objection of 2026-11-02, before the named-guard design: the judge disagreed with `Narrowed: no`. Epoch 1's Goal 4 and Definition of Done named a GLOBAL reconcile over the
  whole baseline [gate finding 0]; Goal 6 reconciles only the scopes a guard judges, and R6 admits a scope no guard
  judges keeps dead entries nobody reports. That is a smaller guarantee in the contract and in the Definition of Done,
  so the record should have read `Narrowed: yes` with the owner's approval. Scope, the merge conditions and the release
  were not smaller: the merge conditions grew (the re-review gate, CodeRabbit's threads), the release was unchanged, and
  ledger 1.3's base-only history check replaced a check that could never pass. The objection no longer applies: the
  design below removed the narrowing, and epoch 2 is approved by reviewers.)
  (The narrowing the judge named was REMOVED on 2026-11-02 by a revision of the design, chosen over asking the owner:
  each scope names the guard that judges it (`guard`, a closed list in the companion), a guard judges exactly the scopes
  that name it and reconciles every one of their entries globally, an unknown guard name is a malformed file for every
  guard, a changed `guard` is refused by the ratchet, and the companion requires the named guard to run in CI on every
  pull request — so no scope is without a guard and no entry goes unreported. `Narrowed: no` therefore holds with the
  reason on the record line; the judge's cells above are untouched, and its fix-forward notes on E2-b now mean the
  named-guard form of Goal 6. The re-review document gate passed this revision on 2026-11-02 — proceed, 4 reviewers,
  four findings accepted and applied as *[re-review finding 0–3]* — so epoch 2 is approved by reviewers.)

> Epoch 2 · approved 2026-11-02 · by reviewers · state: open

- 2.1 · 2026-11-02 · reviewer · contract — two guards never read or judge the same files: overlapping scopes name one guard, and a csharp scope inside the Node guard's walk is a finding
  (epoch-2 code gate finding 5: a csharp scope nested in a node scope took entries the Node guard reads but may not judge;
  Opus review 1: the Node guard's walk reads `tests/`, `test/` and `scripts/` whole, .cs included, so the companion's own
  csharp example failed there. One cause, one entry: "every entry is reconciled by exactly one guard" needs both rules.)

## Symptom

Rule §7 at release `105d53c` allows ONE pass for a `raw-temp` finding: an inline comment on the line or the line
above (`common/test-leftovers.md:96-98`; `common/test-leftovers-detail.md:266-270`). A consumer whose tests already
run inside an owned, claimed, swept per-run folder — the runner points `TEMP`, `TMP` and `TMPDIR` at it before the
first test, so every temp path a test makes lands inside the folder the run removes — has about 1,200 such sites
(`dew_flow_connect_other_ais · todo/PLAN_test_leftovers_E5.md:142-146`, worktree `/home/jinx/git/wt/coai-e5`). Under
the released rule the only compliant moves are 1,200 comments or 1,200 rewrites before the guard can land, so the
guard — which is what keeps the OTHER seven classes at zero — waits on the slowest class.

That consumer's plan gate (coai session `55ddb13b`, round 1, 2026-11-01) refused the obvious shortcut: a
consumer-only allowlist is a waiver of the released rule, not an implementation of it (round-1 finding 7, applied as
D6 of that plan, `todo/PLAN_test_leftovers_E5.md:343-365`); and the C# scanner a consumer copies must stay
byte-identical, so any filtering lives in the consumer's own wrapper test (round-1 finding 0, same lines). The
question consultant (consult `abcaae48`, two vendors, both answers) said: change the shared rule FIRST, then use it
(`todo/PLAN_test_leftovers_E5.md:344`, `:865`, `:929`, `:1029`). Round 2 of the same gate added the multiset (round-2
finding 1, `todo/PLAN_test_leftovers_E5.md:369-372`).

The decision is taken; this plan is HOW. What it must not become: a second exemption grammar, a count ceiling, a file
a script regenerates, or a pass for any class but `raw-temp`.

**What the stop found (2026-11-02, consult `b6ce1182`, verified in the code before it was written here):**

- the companion is NOT selected for `implement` — `node tools/rules.mjs explain --repo . --task implement --file
  raw-temp-baseline.json` selects only `common.test-leftovers` and `common.test-leftovers-detail`; its tasks are `test`,
  `audit`, `policy`, `release`, `pr` (`common/test-leftovers-baseline.md:4`, pinned by `tools/test-leftovers-rule.test.mjs:197`).
  A coder writing the baseline file reads the sentence and the pointer, not the definition: delivery is narrowed;
- ONE repository-wide file, TWO scanners: the Node guard and a C# consumer's guard each reconcile every entry globally
  (`tools/lib/raw-temp-baseline.mjs:169-173`), so a Node-only scan reports a C# file's entries as stale, and the C# scan the
  Node file's — the epoch-1 design never said which scanner judges which entry;
- the scan path's `loadBaselineAt` calls `locateBaseline(repo)` without `{ gitRoot: true }`
  (`tools/lib/raw-temp-baseline.mjs:117`); the shrink path has it (`:251`). A scan started in a subfolder that holds a
  `raw-temp-baseline.json` reads it as if that folder were the repository root;
- most-specific-scope precedence (test 21c, `tools/raw-temp-baseline.test.mjs:556`; `tools/lib/raw-temp-baseline.mjs:152`)
  is a contract decision the approved format never stated;
- the companion says a standing `--allow-create` "would pass a creation again after a deletion merged"
  (`common/test-leftovers-baseline.md:80-82`); it would not — `git log <base> -- <path>` sees the deleted file's history and
  refuses the re-creation (`tools/lib/raw-temp-baseline.mjs:237-240`). The sentence gives the wrong reason for a right rule.

## Goal

The shared rule authorises a **`raw-temp` baseline** under exactly these terms, and the shipped Node guard enforces
them, so that a consumer can land its guard with every other class at zero and drain the baseline to zero afterwards
(coai's S7), while a NEW raw temp call is red the day it is written.

1. **Only `raw-temp`.** A baseline that names another class, or an entry that would clear another class, is a
   finding. `owner-blind`, `legacy-name`, `raw-worktree`, `docker-*`, `shared-store`, `ryuk-off` keep their rules.
2. **Only sites proven to run inside an owned run folder.** The baseline file names, per scope (a tree root), the
   proof: a test file under that root that carries `testsToDelete-baseline-proof: <scope root>`. The proof's substance
   is three things the rule names (the runner makes the folder first; a run that cannot make it fails before any
   test; a first-ordered test per assembly or package asserts `TEMP` names the run folder). A guard checks the
   declaration mechanically; the reviewer of the baseline's creation checks the substance and says so in the PR. An
   entry outside every scope, or under a scope whose proof does not hold, clears nothing.
3. **Exact membership, as a multiset.** Keyed by file + sha256 of the trimmed line, one entry per occurrence; the
   scan passes a key's occurrences up to the number of entries and no further. The line number is a hint, never a
   key. A count ceiling alone is refused for the reason coai's own
   `src_vs_code/src/test/suppressionsOnlyShrink.test.ts:14-20` records: under a constant total one entry can be
   swapped for another.
4. **Only shrinks.** A new site is a `raw-temp` finding. A stale entry is a `baseline` finding until removed —
   reconciled over the whole of what a scanner JUDGES (point 6), so an entry of a deleted file or of a file whose
   hits dropped to zero is stale too *[gate finding 0]*. A malformed or wrong-schema file is a `baseline` finding
   (exit 1, with its cure); exit 2 is only an unreadable file or a usage error *[gate finding 1]*. A check against the
   base ref refuses a new key, a raised count, a new scope, a widened root or a changed proof *[gate finding 3]*, and
   any creation but the first: `--allow-create` passes only while the path has no history behind the base ref, so a
   re-creation after the file existed is refused *[gate finding 4; ledger 1.3]*. No command writes the file;
   `--print-baseline` prints to stdout only, for the one creation.
5. **One path, read only when told to.** The baseline is `raw-temp-baseline.json` at the repository's git root, a
   regular file, never a symlink *[ledger 1.1]*. A guard reads it only through the flag `--baseline` (the Node guard)
   or the consumer wrapper's explicit call (C#); nothing is discovered from the scanned tree, and the default run is
   byte-for-byte the current behaviour. The scan and the shrink check locate it through ONE loader, and both check
   that the scanned folder IS the git root *[epoch 2]*. This is a deliberate difference from the `owner-blind`
   allowlist, which is read from beside the tool and never from the scanned tree
   (`tools/leftovers-check.mjs` § `loadAllowlist`): that one protects other users' data; this one records sites inside
   the run's own swept folder, and its ratchet is the shrink check plus the review of a file that can only lose lines.
6. **One file, several guards — each scope NAMES the guard that judges it** *[epoch 2, consult `b6ce1182` 1b; the
   judge's narrowing objection removed 2026-11-02]*. A repository may hold trees of more than one language, each read
   by its own guard (the Node guard under `--profile node`; a C# consumer's copied guard). Each guard reads the same
   file. A scope carries `guard: "node"` or `guard: "csharp"` — a closed list the companion fixes, extended only by a
   rule change. A guard judges EXACTLY the scopes that name it: it applies their entries and reconciles every one of
   them globally — an entry whose file it did not read, or that no hit matched, is stale *[gate finding 0]*; a scope
   that names another guard applies nothing here (a `raw-temp` site this guard reads under it stays a finding) and
   reports nothing here — **a guard never checks another guard's scopes** *[re-review findings 0, 2]*. Within its own
   scopes the guard also reports an entry whose file is ABSENT from the tree and a proof absent from the tree, and it
   checks these by a direct `lstat` of that one relative path under the repository root, not by its discovery (a `.cs`
   path is checked by the C# guard, never by the Node guard's file walk). A scope that names a guard not in the list is
   a malformed file: one `baseline` finding, nothing applies (the whole file is parsed by whichever guard reads it). A
   proof the judging guard did not discover, or discovered without its marker, is `proof missing`; a proof absent from
   the tree is `proof missing` from its own guard. **Why the global reconcile holds entry for entry:** every scope names exactly
   one guard, and the companion requires a repository whose baseline names a guard to run that guard in CI on every
   pull request — so every entry has exactly one guard that reconciles it, and that guard runs. The creation PR shows
   each named guard's run. The ratchet treats a changed `guard` of an existing scope like a changed proof (refused).

## Boundary with the plans around it (named on both sides)

| Item | Built by | The other side's part |
|---|---|---|
| The rule text, the Node guard's baseline pass, shrink check and tests, the release, the pin bumps' order | this plan | — |
| The baseline FILE, the proof tests, the wrappers that pass the baseline, the drain | `dew_flow_connect_other_ais · todo/PLAN_test_leftovers_E5.md` D6, S3 sc. 2, S6, S7 | reads the released form — ONE file at the root, each scope naming its guard (`node` for `src_vs_code/src/test/`, `csharp` for the C# suites); its producer PR waits for the pin bump to the release this plan ships (D8 condition 5) |
| A shared C# baseline reader beside the byte-identical scanner | `dew_flow_mcp` (the template every C# consumer copies) — recommended below, its own plan there | this plan fixes the file format, the named-guard rule and the behaviours its tests must show |
| Which consumers use it | the rollout plan `todo/PLAN_test_leftovers_rollout.md` (E5 yes; E2 declined; E6, E7 may) | this plan changes no consumer |

Order: this plan's rule and guard, then its release, then coai's pin bump, then coai's producer PR. Disjoint: nothing
here edits a consumer, and nothing in coai edits the rule.

## Growth surface

The baseline is ONE file per repository, `raw-temp-baseline.json` at the root, a list that only shrinks. Projected at
coai's volume: ~1,200 entries × ~120 B ≈ 150 KB in that one file (its C# and Node scopes side by side, each naming
its guard), committed once, retired by coai's S7 (one PR per suite) to zero; a file at zero entries is deleted with
its last entry (the rule says so). No in-flight state: nothing to sweep when interrupted. *(Epoch 1 budgeted two files;
ledger 1.1 made it one.)*

## The rule text (as built, with the epoch-2 amendments marked)

### The core, `common/test-leftovers.md` §7 — one sentence, built in `13e8fbb`

> A `raw-temp` site that provably runs inside an owned, claimed run folder may instead be carried by the repository's
> **`raw-temp` baseline**: a multiset of sites (file and the content hash of the line; the line number a hint), read
> by the guard only when named, that only shrinks — an occurrence beyond it, a stale entry, a site outside a proven
> runner or any other class in it is a finding.

Bytes: the sentence is 392 B (+1 B separator); the core is **8,876 B** (`wc -c`, from 8,483 B at `105d53c`).
`CORE_CAP = 9000` (`tools/test-leftovers-rule.test.mjs:39`); `MUST_CARRY["## 7. "]` (`:117`) holds "`raw-temp`
baseline". Unchanged by epoch 2.

### The detail, `common/test-leftovers-detail.md` §7 — a pointer paragraph, built in `5d915f2` *[ledger 1.2]*

> **The `raw-temp` baseline — a second pass, for that one class only:** one ratcheting file may carry the `raw-temp`
> sites of a runner that makes an owned, claimed run folder (§2). Its full definition is the companion
> `common/test-leftovers-baseline.md`, read before writing, changing or reviewing one.

Bytes: the detail is **31,677 B** (`wc -c`, 2026-11-02, F16's sentence included) — 1,091 B under the 32,768 B
per-read cap (`tools/test-leftovers-rule.test.mjs:68-80`, S1 2). Unchanged by epoch 2.

### The companion, `common/test-leftovers-baseline.md` — the full definition, built in `5d915f2`, 7,113 B

Frontmatter today: `id: "common.test-leftovers-baseline"`, `load: "conditional"`, `tasks: ["test","audit","policy",
"release","pr"]` (`:1-5`). Its body: the definition paragraph (`:15-27`), § *The file* (`:29-58`, with the most-specific
scope precedence at `:52`), § *What a guard does with it* (`:60-70`), § *The ratchet* (`:72-86`), § *Never* (`:88-93`).

**Epoch 2 amends it in four places** (built after the re-review gate; each a test first):

- **E2-a — `implement` joins its tasks** (consult 1b verified as 1a): `tasks: ["implement","test","audit","policy",
  "release","pr"]`. `tools/test-leftovers-rule.test.mjs:197` pins the new string (watched RED on the old frontmatter);
  `node tools/selection-matrix.mjs --write` regenerates `research/selection-matrix.json` (the `implement` scopes grow by
  the companion's bytes; `--bytes` re-prints the table for `research/module_rules.md`); the selection test's fixture rows
  that name the companion's scopes (`tools/selection-matrix.test.mjs`) gain `implement`. After it, `explain --task
  implement --file raw-temp-baseline.json` lists the companion — the RED/GREEN of E2-a.
- **E2-b — the named-guard rule** (Goal 6). § *The file* gains the field: *"`scopes[].guard` names the guard that judges
  the scope — one of `node` (the shipped Node guard) or `csharp` (the C# guard a consumer copies from the template); the
  list is closed and grows only by a change to this rule. A scope naming any other value is a malformed file."* § *What
  a guard does with it* replaces its two sentences that say "a file never read" and "a scope whose proof is missing"
  without saying whose scan: *"A guard judges exactly the scopes that name it: it applies their entries and reconciles
  every one of them — an entry of a file it did not read, or that no hit matched, is stale, and an entry whose file is
  absent from the tree, or a proof absent from the tree, is reported by that guard after a direct look at the one path,
  not by its discovery. A scope that names another guard applies nothing here and is not reported here: a guard never
  checks another guard's scopes *[re-review findings 0, 2]*. A proof the judging guard did not discover, or discovered
  without its marker, is `proof missing`. A repository whose baseline names a guard runs that guard in
  CI on every pull request, so every entry has exactly one guard that reconciles it, and that guard runs."* § *The
  ratchet* adds: *"a changed `guard` of a scope is refused like a changed proof."* § *Never* adds: *"Never name a guard
  the list does not have; never leave a named guard out of CI."*
- **E2-c — the `--allow-create` sentence** (consult 1e): `:80-82` becomes *"`--allow-create` belongs only in the creation
  PR's own run, never in the standing CI command: a re-creation is refused by the path's history behind the base, but a
  standing flag would let the ONE creation pass without the reviewed run that records it."*
- **E2-d — the format states the precedence** (consult 1d): already at `:52` ("An entry belongs to the most specific
  scope that holds its file, whatever the order of the list"); this plan's § *The file format* now carries it too, and
  the C# reader's tests show it (test 21c's twin).

Bytes after E2-a to E2-c: 7,300 B planned, **8,485 B built** (one rule file, under the per-read cap; no test pins a figure). Bodies are
re-recorded with `node tools/rule-bodies.mjs --update common.test-leftovers-baseline`. The text names no product and
no path that moves; `ownership-check` stays armed.

### What the rule deliberately does NOT say

- No inline exemption for `baseline` findings: the fix is to edit the file (remove the entry) or the code.
- No `count` field: a key's count IS its number of entries. One shape, `{ file, sha256, line }`, the same as the
  allowlist's.
- No guard field on an ENTRY: the scope names the guard (Goal 6), and an entry belongs to its most specific scope.
- No `--update-baseline`. The only writer is a person, in a reviewed diff that removes lines.

## The file format (normative; the companion's § *The file*, written out)

```json
{
  "about": "raw-temp sites inside the owned run folder; only shrinks — common/test-leftovers-detail.md §7",
  "class": "raw-temp",
  "scopes": [
    { "root": "src/test/", "proof": "src/test/runFolder.test.mjs", "guard": "node" },
    { "root": "src/Tests/", "proof": "src/Tests/RunFolderTests.cs", "guard": "csharp" }
  ],
  "entries": [
    { "file": "src/test/a.test.mjs", "sha256": "<64 hex of the trimmed line>", "line": 18 },
    { "file": "src/test/a.test.mjs", "sha256": "<the same key, a second occurrence>", "line": 40 },
    { "file": "src/Tests/A.cs", "sha256": "<64 hex>", "line": 12 }
  ]
}
```

- **The path** is `raw-temp-baseline.json` at the repository's git root, a regular file, never a symlink *[ledger 1.1]*.
- `class` is exactly `raw-temp`; anything else is a `baseline` finding, and no entry is applied.
- `scopes[].root` is a repository-relative folder with a trailing `/`, in normal form (no `.`, `..` or empty segment);
  `proof` is a test file under that root (`x.test.mjs`, `x.spec.ts`, `XTests.cs`, `x_test.go`, or under `test/` or
  `tests/`), never the baseline file, carrying a line with `testsToDelete-baseline-proof: <root>` — the root exactly,
  then only whitespace or a comment closer (`*/`, `-->`). **An entry belongs to the most specific scope that holds its
  file, whatever the order of the list** *[epoch 2, from test 21c]*: with `src/test/` and `src/test/unit/` both listed,
  `src/test/unit/a.test.mjs` is under the second, and only that scope's proof clears it.
- **`scopes[].guard` names the guard that judges the scope** (Goal 6): `node` (the shipped Node guard) or `csharp`
  (the C# guard copied from the template) — a closed list in the companion, grown only by a rule change; any other
  value is a malformed file, whichever guard parses it. The Node scope above is judged by the Node guard, the C# scope by the C#
  guard; one file, two guards, every entry reconciled by exactly one of them, and the named guard runs in CI on every
  pull request. The ratchet refuses a changed `guard` like a changed proof.
- **Epoch-2 rules of the format after the code gate and the Opus review** *[epoch-2 code 0, 5; Opus 1, 4, 5]*: a root contains no
  whitespace, `*/` or `-->` (a marker line could not carry it); no root is listed twice; scopes that overlap (one root a
  path-segment prefix of the other) name the SAME guard, else the file is malformed for every guard; and a scope's files are not read
  by another guard's walk — the Node guard reads every file under `scripts/`, `test/` and `tests/`, so a `csharp` scope with a root
  there is a `baseline` finding in the Node guard (the example's C# root is `src/Tests/` for that reason).
- `entries[].file` is repository-relative with forward slashes and starts with some scope's `root`; `sha256` is
  `createHash("sha256")` of the line with leading and trailing whitespace and any `\r` removed (B1; unlike the
  allowlist's `lineSha256`, `tools/lib/sweeper-scan.mjs:156-158`, which pins exact bytes on purpose); `line` is a 1-based
  hint. Order is free; two entries with one key are two occurrences.

## The Node guard — `tools/leftovers-check.mjs` and `tools/lib/raw-temp-baseline.mjs` (as built; epoch 2 marked)

The guard is 593 lines; the command line is `tools/lib/leftovers-cli.mjs`, the docker pass `tools/lib/leftovers-docker.mjs`,
the shell helpers `tools/lib/leftovers-shell.mjs` (code round 2 finding 0); the baseline module is 336 lines.

1. **Arguments** (`tools/lib/leftovers-cli.mjs` § `parseArguments`, `:22`): the flags `--baseline` and
   `--print-baseline` (no value; `--print-baseline` excludes `--baseline`), `--baseline-shrinks` with `--base <git-ref>`
   (a value; a value followed by another `--` option is a usage error naming it) and the flag `--allow-create`. `USAGE`
   and the guard's header name them and say that a CI checkout fetches the base ref before `--baseline-shrinks`
   *[gate finding 2]*.
2. **One loader, `locateBaseline(repo, { gitRoot })`** (`tools/lib/raw-temp-baseline.mjs:92-110`): the fixed path; a
   symlink (lstat, dangling too), a folder, an unreadable path, a real folder outside the repository and, with `gitRoot`,
   a git failure or a `repo` that is not the git root are refusals the caller keeps its outcome for. **Epoch 2 (E2-e,
   consult 1c): the scan path calls it with `{ gitRoot: true }` too** — `loadBaselineAt` (`:116-121`) today calls
   `locateBaseline(repo)`; it becomes `locateBaseline(repo, { gitRoot: true })`, and a `not-git-root` or `git` refusal is
   exit 2 in the scan as in the shrink check (a usage error: `--baseline` is run at the git root), while `symlink` and
   `outside` stay `baseline` findings. Regression test: a baseline in a SUBFOLDER of a git repository, the guard run with
   `--repo <that subfolder> --baseline`, is exit 2 naming the git root — RED today (the file is read), GREEN after.
3. **`parseBaseline` / `loadBaseline`** (`:62-76`): the shape above, or ONE `baseline` finding at the file's line 1 naming
   the field (not JSON, not an object, wrong class, a non-list, an unnormalised root, a proof outside its root or equal to
   the baseline file, **a `guard` missing or outside the closed list `node`, `csharp` — epoch 2, E2-b**, a backslash path,
   a 63-hex sha, a hint below 1); nothing applies from a malformed file; only a path
   that cannot be read throws (exit 2) *[gate finding 1]*. **Epoch 2 (CodeRabbit on #108): `problemOf` (`:42-59`,
   cognitive complexity 22) splits into `scopeProblem(scope, index)` and `entryProblem(item, index)`, behaviour unchanged
   (test 9's cases pin every message).**
4. **Apply** — `createApplier(loaded, repo, label, discovered)` (`:149-175`): the scopes resolved with their proof, the
   entries indexed by (file, sha256) once with a cursor per key (code round 2 findings 8, 9, 13); `take(file, sha)` per
   `raw-temp` hit in line order (an exempted line uses no entry); `finalFindings()` once after every file: the proof
   findings, the out-of-scope entries, every entry no hit matched *[gate finding 0]*. **Epoch 2 (E2-b, Goal 6):
   `createApplier` takes the guard's own name (`"node"` for the shipped guard, a constant `GUARD_NAME`) and judges
   exactly the scopes whose `guard` equals it**: their entries are indexed and reconciled globally (an entry no hit
   matched — a file not read included — is stale); a scope naming another guard is skipped whole (no entries applied,
   no findings, no look at its files or its proof — a guard never checks another guard's scopes *[re-review findings
   0, 2]*); within a judged scope, an entry whose file is absent from the tree is reported as "file absent" after a
   direct `fs.lstatSync` of `path.join(repo, entry.file)` (not `discovered`), distinct from "no line"; `proofHolds`
   is unchanged for a judged scope (not discovered, or discovered without the marker → `proof missing`; absent from the
   tree, by the same direct `lstat`, → `proof missing` naming the absence) and is not asked for another guard's scope.
   Tests: a two-scope baseline (a `node` scope with a discovered proof, a `csharp` scope whose `.cs` proof the `node`
   profile never reads): the Node scope's stale entry is a finding, the C# scope's entries are silent — a C# entry whose
   file is absent from the tree included — and a `raw-temp` line under the C# scope in a file the Node guard DOES read
   (a `.mjs` under the `csharp` scope's root) stays a `raw-temp` finding; a `node` entry whose file is absent is "file absent" —
   RED today (the C# scope is `proof missing`, its entries stale), GREEN after. **Test 18's first case** (a proof present in the tree but not
   discovered, from `ecd47ef`): for a scope naming THIS guard it stays `proof missing` (unchanged); the case is joined by
   its twin, the same undiscovered proof under a scope naming ANOTHER guard, which is silent.
5. **The proof marker** (`proofHolds`, `:132-137`): the marker, exactly the root, then only whitespace or a comment
   closer. **Epoch 2 (CodeRabbit on #108): the parse is linear, no regular expression with backtracking** — after the
   marker: skip ASCII spaces and tabs only, take the root candidate up to the next space, tab, `*/`, `-->` or end, then
   skip spaces and tabs, accept one closer, skip spaces and tabs, require end of line; a candidate not equal to the root
   is no marker. Test 17's cases pin it; a 100,000-character line is parsed in constant passes (a new case).
6. **`CURES.baseline`**: "Remove the stale or out-of-scope entry from the baseline, or move the site into the helper;
   nothing adds to it — common/test-leftovers-baseline.md." `EXEMPTIBLE` unchanged; the proof marker is a marker word for
   the `legacy-name` class, matched in its exact case with `:` then whitespace then a folder path (tests 15, 15b).
7. **`--print-baseline`** (`printBaseline`, `:181-198`): every `raw-temp` finding of the scan as entries, `scopes: []`,
   stdout only; a line that vanished is listed in `missing` and the run is exit 2, never a crash and never a guessed
   entry (tests 10, 19, 19b).
8. **`--baseline-shrinks --base <ref> [--allow-create]`** (`baselineShrinks`, `:250-281`): the one path at the git root;
   `rev-parse --verify` of the base (a dash-led ref refused); absent now → 0 (drained); the working copy parsed (malformed
   → 1); `ls-tree` at the base decides absence (not `cat-file -e`); a creation → 1 without `--allow-create`; with it,
   `creationVerdict` (`:231-241`): a shallow clone → 2 naming `git fetch --unshallow`, `git log <base> -- <path>` non-empty
   → 1 ("a re-creation"), empty → 0 *[gate finding 4; ledger 1.3]*; otherwise the multiset diff (new key, raised count
   → 1) and `scopeGrowth` (`:219-228`: a changed proof, a wider root by whole segments, a new scope → 1; a removed scope
   → 0; a narrowed scope → 0 only when it keeps the holding base scope's proof and that proof lies under the new root)
   *[gate finding 3]*; every git failure → 2 with git's sentence; an unresolved base → 2 with the fetch sentence
   *[gate finding 2]*. **Epoch 2 (E2-b): `scopeGrowth` also refuses a changed `guard` of an existing scope, like a
   changed proof; a narrowed scope keeps the holding scope's `guard` too.** Otherwise unchanged.
9. **Nothing else moves**: the `owner-blind` path, the allowlist's loader and `--update-allowlist` are untouched; a
   test pins that a run without `--baseline` produces the same findings as before over the fixture tree (test 8).

### Tests — `tools/raw-temp-baseline.test.mjs` (816 lines, 41 tests as built after epoch 2; RED first, then GREEN, then the break-it)

Fixtures are built with `ownedDir(t, …)`; the prefix word is spelled in two pieces. The table of epoch 1 (behaviours
1–14) is built as tests 1–14 plus 13b, 15, 15b, 16, 16b, 17, 18, 19, 19b, 20, 20b, 21, 21b–21e, 22, 22b, 23 (§ *Build
progress* says which finding each came from). **Epoch 2 adds, each RED first:**

| # | Behaviour | RED (before the code) | GREEN | RED again (break-it) |
|---|---|---|---|---|
| 24 | the scan judges only at the git root *[E2-e]* | `--repo <subfolder> --baseline` reads the subfolder's file | exit 2 naming the git root; at the root, unchanged | `gitRoot` dropped again from `loadBaselineAt` → the subfolder file is read |
| 25 | one file, two guards: a scope is judged by the guard it NAMES, and only by it *[E2-b; re-review findings 0, 2]* | the `csharp` scope is `proof missing` and its entries stale under `--profile node` | the `node` scope's stale entry is a finding; the `csharp` scope's entries are silent — one whose file is absent from the tree included; a `raw-temp` `.mjs` line under the `csharp` scope stays a finding; a `node` entry whose file is absent from the tree is "file absent" (by `lstat`, not discovery: a `node` scope file that exists but the `node` profile does not walk is "no line", not "file absent"); test 18's first case keeps `proof missing` for a `node` scope and its twin under a `csharp` scope is silent | the `guard` comparison dropped → the `csharp` scope is `proof missing` again |
| 26 | a proof absent from the tree is `proof missing` from its OWN guard only; a changed `guard` is refused by the ratchet *[E2-b; re-review findings 0, 2]* | — | the `node` scope's proof deleted → `proof missing` under the `node` profile; the `csharp` scope's proof deleted → nothing under the `node` profile; `--baseline-shrinks` with a scope's `guard` changed `csharp` → `node` → exit 1 naming it; a narrowed scope that changes the guard → 1 | — |
| 31 | an unknown guard name is a malformed file (whichever guard parses it) *[E2-b]* | — | `"guard": "rust"` (or a missing `guard`) → ONE `baseline` finding at line 1 naming `scopes[i].guard` and the closed list; nothing applies, under the `node` profile and in the shrink check (exit 1) | `"guard": "node"` → the scope is judged |
| 27 | the marker parse is linear *[CodeRabbit]* | — | test 17's cases unchanged; a 100,000-character line after the marker parses in under 50 ms; a root followed by two closers is no marker | the regex restored → the long line is slow or the two-closer case passes |
| 28 | cross-platform tests *[CodeRabbit]* | the `git clone` URL is `file://${origin}` (tests 11, 14) | `pathToFileURL(origin).href`; tests 16 and 23 (symlinks) `skip` on `win32` with the reason "symlinks need a privilege on Windows"; tests 20 and 20b (a `#!/bin/sh` fake git on `PATH`) `skip` on `win32` with the reason "the fake git is a POSIX script" | — |
| 29 | the companion is selected for `implement` *[E2-a]* | `explain --task implement --file raw-temp-baseline.json` lacks the companion; `tools/test-leftovers-rule.test.mjs:197` pins the old tasks | the new tasks string; the regenerated selection baseline; the explain lists `common.test-leftovers-baseline` | — |
| 30 | the complexity splits *[CodeRabbit]* | — | `scopeProblem`/`entryProblem` and `optionsProblem` exist; test 9 and test 21d/21e pass unchanged; SonarCloud reports no function over 15 | — |

Rule tests (`tools/test-leftovers-rule.test.mjs`): `CORE_CAP` 9000; `MUST_CARRY` holds the phrase; S1 2 and S1 7 green;
S1 5 allows the segment `baseline`; `:197` pins the companion's tasks (E2-a changes the pinned string).

## The C# side — recommendation (the template's owner decides; its own plan in `dew_flow_mcp`)

The C# scanner (`dew_flow_mcp · tests/Mcp.Tests/Leftovers/LeftoversGuard.cs:139`, `Scan(root, mountRoot, node) →
GuardReport`) returns findings and `LeftoversRepositoryGuardTests.cs:14-17` asserts the collection is empty. A
consumer could filter in its own wrapper, but ~100 lines of multiset-scope-and-proof logic copied per consumer is the
duplicate `reuse-first` names as the whole defect. **Recommended: the template gains a shared reader,
`RawTempBaseline.cs`, beside the byte-identical scanner**, with `RawTempBaselineTests.cs`, and `LeftoversGuard.cs`
untouched. **Epoch 2 changes the recommended surface** *[ledger 1.1; consult 1b]*: no `Load(path)` — the path is fixed;
the reader takes the repository root and the scan's discovered files, because the judged-scope rule needs them:

```csharp
// tests/Mcp.Tests/Leftovers/RawTempBaseline.cs — copied by every C# consumer, byte-identical
public static RawTempBaseline LoadAt(string repoRoot);                 // raw-temp-baseline.json at the git root; a symlink or a non-root folder is refused the way the Node loader refuses it; an unknown or missing `guard` is malformed
public GuardReport Apply(GuardReport report, IReadOnlySet<string> discovered);  // judges exactly the scopes with guard: "csharp" and no other: their entries pass up to the count and every unmatched one is stale, an entry whose file is absent (File.Exists on that one path, not `discovered`) is "file absent", a proof not in `discovered` or without its marker or absent is "proof missing"; scopes naming another guard are never looked at; class, malformed, unknown guard → "baseline"
```

The consumer's wrapper is then `RawTempBaseline.LoadAt(root).Apply(LeftoversGuard.Scan(root, mount), scan.FilesRead)` and
the empty assertion — `GuardReport` today carries `FilesScanned` (a count); the template adds the set of relative paths it
read (`FilesRead`), which is the one change to the report type and none to the scanner. The guard's name is the constant
`"csharp"` of the closed list. The tests show behaviours 1–9, 12, 21b, 21c, 25, 26 and 31 (the Node tool's 10, 11, 13,
14, 24, 27–30 are not ported). **A repository with no baseline file passes no baseline flag and calls no reader:
the wrapper is the plain empty assertion, as today** *[re-review finding 3]*. The shrink check is NOT ported — **it is
the Node tool, so a consumer's CI that carries a baseline needs Node (the mounted conventions' `npm ci`) for that one
step, `node .agents/conventions/tools/leftovers-check.mjs --baseline-shrinks --base <target>`, whatever language the
baselined trees are in** *[re-review finding 3]*: the
consumer's CI runs the Node tool's `--baseline-shrinks --base <target>` once per PR over the one file (one implementation,
as the C# guard already shells to the shipped `sweeper-scan.mjs` for scripts). If the template lags coai's producer PR,
coai's wrapper may carry the reader inline FIRST and the template adopts that code unchanged — the plan says which it was.
**Rust** (`dew_flow_sidecar_rust`): no guard reads `raw-temp` there today (checked 2026-11-01); when one exists it reads
the same file under a guard name the companion must first add to its closed list (`rust`) — nothing to build now.

## The release and the pins

The usual path, as R5 and R7 ran it (`todo/PLAN_test_leftovers_merged_core_release.md:118-133`, `:185-205`):

1. #108 merges after the re-review gate approves epoch 2, the epoch-2 items are built and reviewed (code gate, Opus),
   CodeRabbit's open threads are answered, and `npm test`, `npm run check` are green.
2. The warning to the sessions that own open consumer pull requests — a comment on each open consumer PR not opened
   by a bot, and a message to the open sessions — BEFORE the dispatch, with the recipients and date recorded here.
3. `node tools/promote-release.mjs <sha> --dry-run`, then `gh workflow run promote-release.yml --ref main -f sha=<sha>
   -f reason="test-leftovers: the raw-temp baseline (rule §7, the companion, the guard's --baseline pass)"`, then
   `node tools/release-distance.mjs` → 0.
4. Pin bumps, each alone (R6 owner decision 1): coai first (E5's producer PR waits on it); creds (E2) declined the
   baseline but takes the pin as every consumer does; benchmark (E6) and rag_qln (E7) decide in their own plans
   whether to use it. A pin bump creates no baseline.

## Build order

Done: S1 the rule (core, detail pointer, companion) → S2 the module, the guard, the tests → S3 the research record.
**Epoch 2, after the re-review gate, in this order:** E2-a the companion's `implement` task with the rule test, the
selection baseline and the matrix fixture → E2-b the named-guard rule (the companion's `guard` field, closed list, CI
requirement and ratchet refusal; `GUARD_NAME` in the module, `createApplier` judging the scopes that name it,
`scopeGrowth` refusing a changed guard; tests 25, 26, 31, test 18's twin) → E2-c the `--allow-create` sentence → E2-d the precedence in this plan's format (text only; built here) →
E2-e the git-root check on the scan path (test 24) → the CodeRabbit items (the linear marker parse, test 27; the
cross-platform tests, 28; the complexity splits, 30) → `rule-bodies.json` and `research/module_tests.md` → the code gate
and the Opus review on #108 → S4 the release and the pins. The C# recommendation is handed to the template's owner
when epoch 2 is approved, with Goal 6 and the `LoadAt`/`Apply(discovered)` surface.

## Test plan

```bash
npm ci --ignore-scripts
node --test tools/test-leftovers-rule.test.mjs tools/raw-temp-baseline.test.mjs tools/leftovers-check.test.mjs tools/selection-matrix.test.mjs
npm test && npm run check
node tools/rules.mjs explain --repo . --task implement --file raw-temp-baseline.json   # lists common.test-leftovers-baseline after E2-a
node tools/ownership-check.mjs && node tools/rule-bodies.mjs && node tools/selection-matrix.mjs && node tools/plan-lifecycle.mjs
node tools/leftovers-check.mjs                      # this repository: clean, no baseline
node tools/release-distance.mjs                     # after S4 only
```

## Risks

- **R1 — the detail's headroom.** Closed by ledger 1.2: the definition is the companion; the detail is 31,677 B, 1,091 B
  under its cap. What remains: the companion itself has no cap test; at ~7,300 B it is a quarter of the per-read cap.
- **R2 — a baseline hides a real leak.** A site under a scope whose proof is wrong (TEMP set after some test, or a
  runner that swallows the folder failure) leaks into the real temp root. The guard checks the declaration, not the
  substance; the substance is the reviewer's at creation and the end-of-run audit's (coai D9) every run.
- **R3 — deletion and re-creation across two PRs widens the baseline.** Closed by gate finding 4 as built (ledger 1.3):
  `--allow-create` passes only while `git log <base> -- raw-temp-baseline.json` is empty, so a merged deletion refuses
  the re-creation. What remains: a history rewritten to erase the path, which no check here sees; a shallow clone asked
  about a creation fails closed with its fetch hint; a standing `--allow-create` in CI would let the one creation land
  without its reviewed run (E2-c says so).
- **R4 — the trimmed hash is wider than the allowlist's exact hash.** Chosen so a re-indent does not strand an entry
  (a stale entry can never be re-added). The width is one line's whitespace; the content is still exact.
- **R5 — two guards, one file format.** The C# reader is recommended, not built here; until it lands coai carries the
  logic inline. The format and the judged-scope rule are fixed by the companion, so the two cannot drift on the
  contract, only on bugs.
- **R6 — a scope no guard judges is silent about its entries.** CLOSED 2026-11-02 by the named-guard design (Goal 6):
  every scope names its guard, an unknown name is malformed whichever guard parses it, and the companion requires the named guard
  to run in CI on every pull request — so no entry is without a guard that reconciles it. What remains: a repository
  that names a guard and does not run it in CI breaks the companion's rule, which a reviewer of the creation PR sees in
  the workflow file; the shipped guard cannot see another guard's absence.
- **R7 — the git-root check needs `git` on the scan path** *[epoch 2]*. A guard run where `git` is absent exits 2 with
  git's sentence when `--baseline` is passed; without `--baseline` nothing changes. The consumers' CI already has git.

## Definition of Done

- [x] The core carries the sentence verbatim; the core is ≤ 9,000 B and ≥ its text at `2d12d8f` (nothing lost); the
      full definition is in the companion and the detail reads under 32 KiB with `--only`; `MUST_CARRY` holds the phrase.
- [x] `tools/lib/raw-temp-baseline.mjs` and the guard's `--baseline`, `--print-baseline`, `--baseline-shrinks`,
      `--base`, `--allow-create` exist and are in the header and `USAGE`; class `baseline` has its cure.
- [x] The fourteen behaviours of epoch 1 and the review additions were each watched RED, then GREEN, then RED again;
      the default run over the fixture tree and over this repository is unchanged; this repository ships no baseline file.
- [x] `rule-bodies.json` re-recorded; `research/module_tests.md` § *Test leftovers* names the arguments and the class;
      `ownership-check` passes with no baseline file of its own.
- [ ] **Epoch 2:** the companion is selected for `implement` (E2-a, with the rule test, the selection baseline and the
      fixture); the named-guard rule is in the companion (the `guard` field, the closed list, the CI requirement, the
      ratchet's refusal) and in the module (E2-b, tests 25, 26, 31, test 18's twin); the `--allow-create`
      sentence gives the right reason (E2-c); the scan path checks the git root (E2-e, test 24); the marker parse is
      linear (27); the tests run on Windows with named skips (28); no function over SonarCloud's complexity limit (30);
      bodies re-recorded; the code gate and the Opus review passed on #108; every open CodeRabbit thread answered.
- [ ] The C# recommendation was handed to the template's owner with the format, Goal 6 and the `LoadAt`/`Apply(discovered)`
      surface; the boundary is written in `dew_flow_mcp`'s plan and in coai's E5 (both sides).
- [ ] The release: warning sent and recorded, `promote-release.yml` run, `release-distance` 0; coai's pin bump merged
      alone; the other consumers' pin bumps listed here.
- [ ] `node tools/plan-lifecycle.mjs` clean; this plan promoted to `research/` with its deviations when S4 is done,
      its `todo/README.md` row going with it.

## Build progress

Built on `feat/raw-temp-baseline` (PR #108, unmerged, nothing released). Every behaviour of the test
table was written as a failing test first (`test(...)` commit), then the code, then watched RED again with the code
stashed and with a targeted break (14 mutations of the module, each failing exactly the test that names it).

- [x] S1 the rule: core sentence (8,876 B, cap 9,000), companion `common/test-leftovers-baseline.md` (7,113 B) with the
      detail's pointer (31,546 B) — see N1; `CORE_CAP` 9000; `MUST_CARRY` holds "`raw-temp` baseline"; bodies re-recorded;
      the selection baseline `research/selection-matrix.json` regenerated (the new id joins the scopes that select the janitor).
- [x] S2 `tools/lib/raw-temp-baseline.mjs`; the guard's `--baseline`, `--print-baseline`, `--baseline-shrinks`, `--base`,
      `--allow-create`; class `baseline` and its cure; header and `USAGE`; `tools/raw-temp-baseline.test.mjs` (the
      fourteen behaviours and a fifteenth, below).
- [x] S3 `research/module_tests.md` § *Test leftovers*, `research/rule-bodies.json`, the README tool row.
- [ ] S4 the release, the warning, the pin bumps (not started — a later step).
- [ ] The C# reader in the template (the template owner's plan; nothing here).

**Epoch 2 build (2026-11-02, local commits on `feat/raw-temp-baseline`, not pushed).** Each item a test commit first (RED observed on the
unchanged code), then the code, then RED again with the code stashed and with targeted breaks:

- [x] E2-a — `implement` joins the companion's tasks. `f567bf3` test (S1 6 pins the string, S1 11 asks `explain` for the companion under
      every task: 2 fail), `06f92e1` code (frontmatter, `selection-matrix.mjs --write`, the `--bytes` table in `research/module_rules.md`;
      81 pass; stashed: 2 fail again). The selection test holds no fixture row naming the companion, so there was none to change.
- [x] E2-b — the named guard (tests 25, 26, 31, test 18's twin, test 3's `file absent`). Test commit `56eeaac`; code `80776db`:
      `GUARDS`, `GUARD_NAME`, `scopeProblem` rejects a missing or unknown `guard`, `createApplier(…, guard)` judges only the scopes that
      name it (entries indexed by the most specific scope of ALL scopes, judged only if that scope names this guard), `proofFailure` and
      the stale text check absence by a direct `lstat`, `scopeGrowth` refuses a changed guard (and a narrowed scope keeps the holder's).
      Targeted breaks, each failing the named tests: the guard filter (18, 25, 26), the guard compare (26), the validation (30, 31), the
      proof `lstat` (26). Companion text: the `guard` field, § What a guard does with it, the ratchet, § Never.
- [x] E2-c — the companion's `--allow-create` reason; S1 10 forbids the old sentence and requires the new one.
- [x] E2-d — the precedence is in this plan's format and in the companion's § The file (`:52` of the first build); no code. The C# twin
      of test 21c belongs to the template's tests.
- [x] E2-e — `loadBaselineAt` passes `{ gitRoot: true }`; test 24 (a baseline in a subfolder, with or without a file there, is exit 2
      naming the git root; the root is unchanged). Break-it: `gitRoot` dropped fails test 24.
- [x] CodeRabbit — `declaredRoot` is a linear parse without trim (test 27); `pathToFileURL` for both clones and `skip` on `win32` with a
      reason for tests 16, 23 (symlinks) and 20, 20b (the sh fake git), pinned by test 28; `scopeProblem`/`entryProblem` out of
      `problemOf` and `optionsProblem` out of `parseArguments` (test 30).
- [x] The epoch-2 code gate (proceed) and Opus review (no blocking) were applied, test first (`9fd4f2e`, `4131032` tests; `9f451fa` code):
  - [x] [epoch-2 code 0] `scopeProblem` refuses an ASCII space or tab in a root (test 17; break-it: the check dropped).
  - [x] [epoch-2 code 1] only ENOENT and ENOTDIR mean absent; any other lstat error is a `baseline` finding naming path and error, for an
        entry and for a proof (test 35, ENAMETOOLONG; break-it: any error is absent).
  - [x] [epoch-2 code 2] one look per path per run (test 36 counts the lstat calls: 50 against 1; break-it: no memo).
  - [x] [epoch-2 code 3] `firstProblem` stops at the first problem; `problemOf` is exported for test 32 (a Proxy counts later reads: 0).
  - [x] [epoch-2 code 4] the guard message says `node` for the Node guard's suites and `csharp` for the C# guard's (test 31).
  - [x] [epoch-2 code 5] overlapping scopes name one guard; a root twice is malformed (test 33, shrink check included; `overlapProblem`
        walks each root's ancestors; break-its: the compare, the duplicate check).
  - [x] [epoch-2 code 6] scopes are attributed to entries by an ancestor lookup in a root map, not a filter and a sort per entry (test 22c:
        20,000 scopes and 20,000 entries, 5.2 s before, milliseconds after). This is faster than the sort-once the gate named.
  - [x] [epoch-2 Opus 1] a `csharp` scope inside the Node guard's walk is a `baseline` finding of the Node guard (`createApplier`'s `walks`,
        fed by `NODE_TREE`; test 34 reproduces `tests/Unit/`; the examples move to `src/Tests/`; break-it: the finding dropped).
  - [x] [epoch-2 Opus 2] `locateBaseline` checks the git root before the symlink (test 38; break-it: `gitRoot` dropped).
  - [x] [epoch-2 Opus 3] test 39: `--baseline` with a failing `git rev-parse` is exit 2 (GREEN on the code as it stood; break-it: `gitRoot` dropped).
  - [x] [epoch-2 Opus 4] a duplicate root is malformed, one guard or two (test 33).
  - [x] [epoch-2 Opus 5] a root holds no `*/` or `-->` either; test 17 gains the root cases and the CRLF case (GREEN before; break-it: a
        split on LF only).
- [ ] Every open CodeRabbit thread on #108 answered (the Definition of Done's epoch-2 line stays open until then; the code gate and
      the Opus review have passed).

Deviations of the epoch-2 build, each with its reason:

7. **Test 27 asserts 1,500 characters first, then 100,000.** The old pattern is cubic: 1,500 spaces take 645 ms (the RED), 20,000 take
   over 250 s. The 100,000-character assertion follows the 1,500 one, so it is reached only by a linear parse.
8. **Test 28 reads its own source** (no `file://${` join, `pathToFileURL(origin).href` twice, the four test lines carry `NO_SYMLINKS` or
   `NO_POSIX_SH`): a Windows-only defect cannot be RED on Linux. The edits it pins are in the same commit, so its RED is a targeted
   break (the join restored; `NO_POSIX_SH` dropped from test 20), not an unchanged-code run.
9. **The marker parse follows the plan's algorithm literally**: the root candidate ends at the next space or tab, so a scope root that
   contains a space can never be proven. *Closed by [epoch-2 code 0]: such a root is now a malformed file, so no scope can be
   unprovable for that reason.*
10. **Test 29 is `S1 11` in `tools/test-leftovers-rule.test.mjs`**, beside S1 6, not in `raw-temp-baseline.test.mjs`.
11. **Not run here: SonarCloud.** The complexity splits are tested for existence and behaviour (test 30); whether no function is over 15
    is for SonarCloud on the pushed branch.

Changes after the code gate and the Opus review (2026-11-01; ledger 1.1 is the design change). Each is built test first,
watched RED before the fix and RED again with the fix taken out or broken; the source is in brackets.

- [x] [ledger 1.1, Opus B1, Opus M3] ONE fixed path, `raw-temp-baseline.json` at the repository root; `--baseline` and
      `--baseline-shrinks` are flags; a symlink (lstat, a dangling one too) or a folder in its place is a `baseline`
      finding in a scan and exit 2 in the shrink check; a repository folder that is not the git root, or a path that
      leaves it (`path.isAbsolute(rel)`, a Windows drive), is exit 2 [Opus m2]. A folder where the file belongs exits 2
      cleanly in both commands [Opus m6]. Tests 16, 16b.
- [x] [code gate 0] scope growth compares whole path segments; an unnormalised root (`src//test/`, `./src/test/`) is a
      malformed file. `src/testing/` against `src/test/` is a new scope. Test 13, 13b. (The sibling pin is GREEN on the old
      code too — the trailing `/` already protected it; the unnormalised roots are the RED.)
- [x] [code gate 2, 3] the proof marker is parsed strictly: the marker, exactly the scope root, then only whitespace or a
      comment closer (`*/`, `-->`). Test 17.
- [x] [code gate 5] `--print-baseline` reports a finding whose line is gone (exit 2) instead of crashing. Test 19.
- [x] [code gate 6, Opus M2] a git failure is exit 2 with git's own sentence, never "absent at base" and never "no
      history"; every call uses `--literal-pathspecs`. Absence at the base is read with `git ls-tree --name-only <base>
      -- <path>` (empty output is absence, a non-zero exit is a failure), not `git cat-file -e`: `cat-file -e` exits 128 for
      a missing path and for a bad ref alike, and only its English message tells them apart. Tests 20, 20b.
- [x] [code gate 7, 13] the entries that can still pass are indexed by (file, sha256) once in `createApplier`; a take is
      not a scan. Test 22 (40,000 entries).
- [x] [code gate 10] the companion's tasks are `test`, `audit`, `policy`, `release`, `pr`. The selection baseline was
      regenerated: the `test` and `pr` scopes grow by the companion's 7,113 B (for example no file: `test` 289,359 →
      296,472 B, `pr` 171,726 → 178,839 B), `audit` and `policy` by the 1,203 B the companion grew since its first version. No test pins a 90 KB
      figure; the companion is one rule file of 7,113 B, under the per-read cap and under a reviewer's ~10,000-unit
      per-file tail, and the core (8,876 B) is unchanged. *(Epoch 2's E2-a adds `implement`: the re-review found a coder
      writing a baseline is not selected for the definition.)*
- [x] [code gate 11, Opus m5] a proof is a file the guard DISCOVERED in this scan, a test file (`x.test.mjs`, `x.spec.ts`,
      `XTests.cs`, `x_test.go`, a file under `test/` or `tests/`), and not the baseline file. The companion says so. Test 18.
      *(Epoch 2's E2-b: a scope names its guard; for a scope naming THIS guard an undiscovered proof stays `proof
      missing`; a scope naming another guard is not judged here.)*
- [x] [code gate 12, Opus M1] a narrowed scope keeps the proof of the base scope that holds it, and that proof lies under
      the new root; a changed proof is refused. The companion says so. Test 13b.
- [x] [Opus m1] `git log --all --not HEAD` is gone: a deletion that merged is already in `<base>`, and other refs made a
      local run and CI disagree. The creation check is `git log <base> -- <path>` plus the shallow fail-closed. Test 14
      (history on another ref changes nothing).
- [x] [Opus m3] the proof-marker exemption in the guard matches the exact case and needs `:` then whitespace then a folder
      path; an image tag spelled `<prefix>-baseline-proof:latest` stays a `legacy-name` finding. Test 15b.
- [x] [Opus] tests for what had none: an exempted line uses no entry (21b), `--base -x` and a malformed base copy (2) and
      a malformed working copy (1) (21), the order of overlapping scopes — an entry belongs to the most specific root (21c),
      the argument errors (21d).
- [x] The companion says `--allow-create` belongs only in the creation PR's own run and never in the standing CI
      command [ledger 1.1]. *(Its reason is corrected by epoch 2's E2-c.)*
- Rejected at the gate, unchanged: greedy line-order matching; a `printBaseline` cache change; generic shrink hints.

Code round 2 (2026-11-01; proceed, 14 findings, accepted 0, 1, 5, 8, 9, 11, 12, 13; rejected 2, 3, 4, 6, 7, 10). Test first, RED before,
RED again with the fix broken:

- [x] [code round 2 0] `tools/leftovers-check.mjs` was about 1,040 lines against the 800 maximum. The command line
      (`parseArguments`, the run functions, `USAGE`, `PROFILES`) is now `tools/lib/leftovers-cli.mjs`, the docker pass is
      `tools/lib/leftovers-docker.mjs` and the shell-value helpers both share are `tools/lib/leftovers-shell.mjs`; moved
      whole, behaviour unchanged (the 253 tests of the guard, the consumers, the baseline, the sweeper scan and the rules
      passed before and after). The guard is 592 lines. The earlier "size follow-up" is done and removed.
- [x] [code round 2 1] ONE working-tree loader, `locateBaseline`, for the scan and the shrink check: the fixed path, the
      symlink refusal (lstat), a folder in its place, containment, and with `gitRoot` the git-root check. Each caller keeps
      its outcome: a `baseline` finding in the scan (symlink, outside), exit 2 in the shrink check. Test 23. *(The scan path
      does not pass `gitRoot`: epoch 2's E2-e.)*
- [x] [code round 2 5] `printBaseline`'s file read is guarded: a vanished or unreadable file is listed in `missing` (exit 2
      with its sentence). Test 19b.
- [x] [code round 2 8, 9, 13] `createApplier` pushes into a key's list and walks it with a cursor, no copy and no
      `shift()`. Test 22b (150,000 entries under one key; 122 s with a copying build, under a second now).
- [x] [code round 2 11] a value option followed by another `--` option is a usage error naming the option
      (`--base --allow-create`). Test 21e.
- [x] [code round 2 12] the companion says a repository carrying a baseline runs `--baseline-shrinks --base <the PR's
      target branch>` in CI on every pull request, without `--allow-create`, the creation PR's own run being the one
      exception; the companion is 7,113 B.

Deviations from the plan as written, each with its reason:

1. **A fifteenth behaviour.** The proof marker `<prefix>-baseline-proof:` would be a `legacy-name` finding in the very
   test file that carries it (second segment `baseline`). The guard now treats that exact marker as a marker word, as
   it treats `exempt` (test 15). The rule-test S1 5 allows the segment `baseline` for the same reason.
2. **`--allow-create` and `git log --all`.** Read literally, `git log --all -- <path>` would also see the creation PR's
   own commit, so the one creation could never pass in CI. The check uses only the history behind the base ref
   (`git log <base> -- <path>`): a path that ever existed behind the base is a re-creation; the creation commits above
   the base are the creation. A first build also looked at other refs (`git log --all --not HEAD`); Opus m1 removed it,
   because a deletion that merged is already in `<base>` and other refs make a local run and CI differ. *(Ledger 1.3.)*
3. **The shallow-clone fail-closed applies when history is consulted** (a creation with `--allow-create`), not to
   every shrink check: a CI checkout is shallow by default and the plain check needs only the base ref's blob. *(Ledger 1.3.)*
4. **An entry under no scope, or under a scope whose proof does not hold, clears nothing** (the site stays a
   `raw-temp` finding as well as the `baseline` finding): the plan says "a site outside a proven runner … is a finding".
5. Test 4's duplicate line sits at line 10 (not 9) because the fixture's source has four lines before the padding.
6. **`cb511e4`, a `test(rules)` commit ("RED before the file"), also added the 194-line module
   `tools/lib/raw-temp-baseline.mjs`** (the Opus judge's note, 2026-11-02). A fact of the pushed history, recorded here;
   the history is not rewritten.

## Open questions

Blocking: none open.

- **B1 — DECIDED with the gate round (2026-11-01): the hash is of the TRIMMED line.** Nothing can re-add an entry,
  so an exact-bytes hash would strand an entry on a re-indent.

Non-blocking (the defaults below were kept by the gate round; a different answer is one edit):

- **N1 — DECIDED at build (2026-11-01, coordinator instruction; ledger 1.2): a COMPANION, not the detail.** The F16 branch
  (`fix/f16-windows-list-only`, merged first) adds 131 B to the detail's §4 (31,241 → 31,372 B); the plan's
  paragraph (+1,471 B) would make the detail 32,843 B, over the 32,768 B per-read cap. So the FULL definition lives in
  the new `common/test-leftovers-baseline.md` (id `common.test-leftovers-baseline`, `load: conditional`, tasks
  `audit`, `policy`, `release` — the janitor companion's frontmatter pattern; `test` and `pr` were added after the code gate;
  `implement` is epoch 2's E2-a), and the detail's §7 carries a 3-line
  pointer paragraph. Bytes: core 8,876 (unchanged, the sentence stays in the core); detail 31,546 (+305 on 31,241;
  with F16's +131 it is 31,677, 1,091 B under the cap); companion 7,113. The companion holds the plan's paragraph
  verbatim plus the file format and the guard behaviour; no other text of the detail was touched. R1's mitigation
  is thereby done, not deferred.
- **N2 — `count` field or repeated entries?** Default: repeated entries (one shape, one validator). coai's E5 text
  says `{ file, sha256, line, count }`; coai reads the released form, so its S6 follows this.
- **N3 — RESOLVED by ledger 1.1 and Goal 6 (epoch 2).** The epoch-1 question was "one `--baseline` per run or
  repeatable" with a file per tree; the answer is now structural: ONE file at the git root, no path argument, one
  `--baseline` flag, and each of the repository's guards judges the scopes that name it (coai: the scope
  `src_vs_code/src/test/` names `node` and is judged by the Node guard under `--profile node`; the C# scopes name
  `csharp` and are judged by the C# reader; one file, both runs in CI on every pull request; one `--baseline-shrinks`
  over it).
- **N4 — the C# reader in the template first, or coai inline first?** Default: the template, in parallel from the
  epoch-2 approval; coai inline only if the template is not merged when coai's producer PR is ready, with the template
  adopting that code unchanged. The surface is `LoadAt(root)` and `Apply(report, discovered)` — no `Load(path)`.
