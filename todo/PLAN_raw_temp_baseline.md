# PLAN — The `raw-temp` baseline: rule §7 authorises one ratcheting, membership-keyed baseline for sites proven to run inside an owned run folder

> Status: **stopped for re-review (2026-11-02): a second change after approval (see Plan changes; CodeRabbit on #108).**
> This document is the WHOLE plan revised for epoch 2 (step 4 of the full stop, 2026-11-02, against re-review consult
> `b6ce1182` and the coordinator's verifications); the epoch-2 line is written after the re-review gate, not here.
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

> Epoch 1 · approved 2026-11-01 · by reviewers · state: stopped

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

Narrowed: no — nothing got smaller: the scope, the Definition of Done, the merge conditions (plan gate, code gate, Opus review, green suite) and the release are what epoch 1 approved; the re-review ADDS (the companion selected for `implement`, the two-scanner reconciliation, the git-root check on the scan path, the scope precedence written into the format) and RELOCATES (the full definition from the detail to the companion); the shallow fail-closed was always the history question, which only a creation asks

| Work | Where | Verdict | Action |
|---|---|---|---|
| 9c3b62c docs(plans): the plan, first version | pushed, unmerged (#108) | — | — |
| f753618 docs(plans): plan gate round 1 applied, epoch 1 opened | pushed, unmerged (#108) | — | — |
| 55e44a5 merge of main (no work of this plan) | pushed, unmerged (#108) | — | — |
| f1ae481 test(rules): the core phrase, the detail paragraph, CORE_CAP 9000 — RED | pushed, unmerged (#108) | — | — |
| 13e8fbb feat(rules): §7's core sentence and the detail paragraph; bodies re-recorded | pushed, unmerged (#108) | — | — |
| 23f115b test(leftovers): fifteen behaviours — RED | pushed, unmerged (#108) | — | — |
| cb511e4 test(rules): the definition is a companion rule — RED | pushed, unmerged (#108) | — | — |
| 92c1145 feat(leftovers): the guard's baseline pass, print, shrinks, class `baseline` | pushed, unmerged (#108) | — | — |
| 5d915f2 feat(rules): the definition moves to the companion (N1); selection baseline | pushed, unmerged (#108) | — | — |
| ecd47ef test(leftovers): the fixed path and the review findings — RED | pushed, unmerged (#108) | — | — |
| af634a3 fix(leftovers): one fixed path, no symlink, strict proof, git failures exit 2, indexed matching | pushed, unmerged (#108) | — | — |
| 5979588 refactor(leftovers): the guard under 800 lines — cli, docker and shell helpers to tools/lib | pushed, unmerged (#108) | — | — |
| 70b4613 test(leftovers): code round 2 — RED | pushed, unmerged (#108) | — | — |
| b23c70a fix(leftovers): code round 2 — one loader, guarded print read, cursor matching, option values | pushed, unmerged (#108) | — | — |
| bc0e044 docs(plans): the rollout plan's epoch 2 (another plan's work, merged through main) | main | — | — |
| 5e077ff fix(leftovers): F16 interim (another plan's work, merged through main) | main | — | — |
| 217e6db merge of main (no work of this plan) | pushed, unmerged (#108) | — | — |
| e015cf4 docs(plans): the stop — ledger 1.2 and 1.3 recorded | pushed, unmerged (#108) | — | — |
  (Verdict and Action are left `—` for an Opus judge, step 5 of the full stop; this revision sorts nothing. `git branch -r
  --contains` in this worktree lists no remote ref for these commits — its fetch is stale — so "pushed" is taken from #108's
  existence, and the judge confirms it. Rows 15 and 16 are not this plan's work: they are on `main` and ride the merge commit.)

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
6. **One file, several scanners — a scope is judged by the scanner that discovered its proof** *[epoch 2, consult
   `b6ce1182` 1b]*. A repository may hold trees of more than one language, each read by its own guard (the Node guard
   under `--profile node`; a C# consumer's copied guard). Each guard reads the same file. A guard JUDGES a scope when
   its own discovery read the scope's proof file: it then applies the scope's entries and reconciles every one of
   them — an entry whose file it did not read is stale ("a file never read"). A scope whose proof file is in the tree
   but which this guard's discovery did not read is NOT this guard's: it applies none of its entries (a `raw-temp`
   site it reads under that scope stays a finding) and reports nothing about them — except an entry whose file is
   ABSENT from the tree, which is stale for every guard. A proof file absent from the tree, or present and read but
   without its marker, is `proof missing` for every guard that reads the file. **Why the stale-entry guarantee still
   holds over all language scans together:** every scope has exactly one proof, so for each scope either (a) some
   guard discovered the proof and reconciled every entry of that scope, or (b) no guard discovered it, in which case no
   entry of the scope ever passed anywhere and every site under it is red in whichever guard reads it — a scope no
   guard judges hides nothing. A deleted file is stale in every guard. The union of the repository's guards therefore
   reports every stale entry *[gate finding 0]*, and the creation PR shows each scope judged by the guard it is for
   (the Node guard's run and the C# wrapper's run both in the PR). The entries carry no scanner field: the proof's
   discovery IS the assignment, so the format of epoch 1 stands.

## Boundary with the plans around it (named on both sides)

| Item | Built by | The other side's part |
|---|---|---|
| The rule text, the Node guard's baseline pass, shrink check and tests, the release, the pin bumps' order | this plan | — |
| The baseline FILE, the proof tests, the wrappers that pass the baseline, the drain | `dew_flow_connect_other_ais · todo/PLAN_test_leftovers_E5.md` D6, S3 sc. 2, S6, S7 | reads the released form — ONE file at the root, judged by both of its guards; its producer PR waits for the pin bump to the release this plan ships (D8 condition 5) |
| A shared C# baseline reader beside the byte-identical scanner | `dew_flow_mcp` (the template every C# consumer copies) — recommended below, its own plan there | this plan fixes the file format, the judged-scope rule and the behaviours its tests must show |
| Which consumers use it | the rollout plan `todo/PLAN_test_leftovers_rollout.md` (E5 yes; E2 declined; E6, E7 may) | this plan changes no consumer |

Order: this plan's rule and guard, then its release, then coai's pin bump, then coai's producer PR. Disjoint: nothing
here edits a consumer, and nothing in coai edits the rule.

## Growth surface

The baseline is ONE file per repository, `raw-temp-baseline.json` at the root, a list that only shrinks. Projected at
coai's volume: ~1,200 entries × ~120 B ≈ 150 KB in that one file (its C# and Node scopes side by side, each judged by
its own guard), committed once, retired by coai's S7 (one PR per suite) to zero; a file at zero entries is deleted with
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
- **E2-b — the judged-scope rule** (Goal 6) replaces the two sentences of § *What a guard does with it* that say
  "a file never read" and "a scope whose proof is missing" without saying whose scan: *"A guard judges a scope when its
  own discovery read the scope's proof; it applies and reconciles that scope's entries only — an entry of a file it did not
  read is stale. A scope whose proof is in the tree but not in this guard's discovery is another guard's: nothing under it
  applies here and nothing is reported, except an entry whose file is absent from the tree, stale for every guard. A proof
  absent from the tree, or read without its marker, is `proof missing` for every guard. Every stale entry is reported by
  the union of the repository's guards: a scope no guard judges lets nothing pass."*
- **E2-c — the `--allow-create` sentence** (consult 1e): `:80-82` becomes *"`--allow-create` belongs only in the creation
  PR's own run, never in the standing CI command: a re-creation is refused by the path's history behind the base, but a
  standing flag would let the ONE creation pass without the reviewed run that records it."*
- **E2-d — the format states the precedence** (consult 1d): already at `:52` ("An entry belongs to the most specific
  scope that holds its file, whatever the order of the list"); this plan's § *The file format* now carries it too, and
  the C# reader's tests show it (test 21c's twin).

Bytes after E2-a to E2-c: about 7,300 B (one rule file, under the per-read cap; no test pins a figure). Bodies are
re-recorded with `node tools/rule-bodies.mjs --update common.test-leftovers-baseline`. The text names no product and
no path that moves; `ownership-check` stays armed.

### What the rule deliberately does NOT say

- No inline exemption for `baseline` findings: the fix is to edit the file (remove the entry) or the code.
- No `count` field: a key's count IS its number of entries. One shape, `{ file, sha256, line }`, the same as the
  allowlist's.
- No scanner field on an entry or a scope: the proof's discovery assigns the scope (Goal 6).
- No `--update-baseline`. The only writer is a person, in a reviewed diff that removes lines.

## The file format (normative; the companion's § *The file*, written out)

```json
{
  "about": "raw-temp sites inside the owned run folder; only shrinks — common/test-leftovers-detail.md §7",
  "class": "raw-temp",
  "scopes": [
    { "root": "src/test/", "proof": "src/test/runFolder.test.mjs" },
    { "root": "tests/Unit/", "proof": "tests/Unit/RunFolderTests.cs" }
  ],
  "entries": [
    { "file": "src/test/a.test.mjs", "sha256": "<64 hex of the trimmed line>", "line": 18 },
    { "file": "src/test/a.test.mjs", "sha256": "<the same key, a second occurrence>", "line": 40 },
    { "file": "tests/Unit/A.cs", "sha256": "<64 hex>", "line": 12 }
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
- **A scope is judged by the guard whose discovery read its proof** (Goal 6): the Node scope above by the Node guard,
  the C# scope by the C# guard; one file, two guards, every entry judged once.
- `entries[].file` is repository-relative with forward slashes and starts with some scope's `root`; `sha256` is
  `createHash("sha256")` of the line with leading and trailing whitespace and any `\r` removed (B1; unlike the
  allowlist's `lineSha256`, `tools/lib/sweeper-scan.mjs:156-158`, which pins exact bytes on purpose); `line` is a 1-based
  hint. Order is free; two entries with one key are two occurrences.

## The Node guard — `tools/leftovers-check.mjs` and `tools/lib/raw-temp-baseline.mjs` (as built; epoch 2 marked)

The guard is 592 lines; the command line is `tools/lib/leftovers-cli.mjs`, the docker pass `tools/lib/leftovers-docker.mjs`,
the shell helpers `tools/lib/leftovers-shell.mjs` (code round 2 finding 0); the baseline module is 281 lines.

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
   the baseline file, a backslash path, a 63-hex sha, a hint below 1); nothing applies from a malformed file; only a path
   that cannot be read throws (exit 2) *[gate finding 1]*. **Epoch 2 (CodeRabbit on #108): `problemOf` (`:42-59`,
   cognitive complexity 22) splits into `scopeProblem(scope, index)` and `entryProblem(item, index)`, behaviour unchanged
   (test 9's cases pin every message).**
4. **Apply** — `createApplier(loaded, repo, label, discovered)` (`:149-175`): the scopes resolved with their proof, the
   entries indexed by (file, sha256) once with a cursor per key (code round 2 findings 8, 9, 13); `take(file, sha)` per
   `raw-temp` hit in line order (an exempted line uses no entry); `finalFindings()` once after every file: the proof
   findings, the out-of-scope entries, every entry no hit matched *[gate finding 0]*. **Epoch 2 (E2-b, Goal 6):
   `proofHolds` splits its three answers** — `absent` (the proof file is not in the tree: `proof missing` for every
   guard), `unread` (in the tree, not in `discovered`: not this guard's scope — no entries applied, no findings, except
   an entry whose file is absent from the tree), `held` / `unmarked` (read, with or without the marker). The stale
   reconcile runs over judged scopes only. Tests: a two-scope baseline (a Node scope with a discovered proof, a C# scope
   whose `.cs` proof the `node` profile never reads): the Node scope's stale entry is a finding, the C# scope's entries
   are silent, a C# entry whose file is absent from the tree is a finding, and a `raw-temp` line under the C# scope in a
   file the Node guard DOES read (a `.mjs` under `tests/Unit/`) stays a `raw-temp` finding — RED today (the C# scope is
   `proof missing`, its entries stale), GREEN after.
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
   *[gate finding 2]*. Unchanged by epoch 2.
9. **Nothing else moves**: the `owner-blind` path, the allowlist's loader and `--update-allowlist` are untouched; a
   test pins that a run without `--baseline` produces the same findings as before over the fixture tree (test 8).

### Tests — `tools/raw-temp-baseline.test.mjs` (645 lines, 37 tests as built; RED first, then GREEN, then the break-it)

Fixtures are built with `ownedDir(t, …)`; the prefix word is spelled in two pieces. The table of epoch 1 (behaviours
1–14) is built as tests 1–14 plus 13b, 15, 15b, 16, 16b, 17, 18, 19, 19b, 20, 20b, 21, 21b–21e, 22, 22b, 23 (§ *Build
progress* says which finding each came from). **Epoch 2 adds, each RED first:**

| # | Behaviour | RED (before the code) | GREEN | RED again (break-it) |
|---|---|---|---|---|
| 24 | the scan judges only at the git root *[E2-e]* | `--repo <subfolder> --baseline` reads the subfolder's file | exit 2 naming the git root; at the root, unchanged | `gitRoot` dropped again from `loadBaselineAt` → the subfolder file is read |
| 25 | one file, two guards: a scope is judged by the guard that discovered its proof *[E2-b]* | the `.cs` scope is `proof missing` and its entries stale under `--profile node` | the Node scope's stale entry is a finding; the C# scope's entries are silent; a C# entry whose file is absent from the tree is a finding; a `raw-temp` `.mjs` line under the C# scope stays a finding | `unread` folded back into `absent` → the C# scope is `proof missing` again |
| 26 | a proof file absent from the tree is `proof missing` for every guard *[E2-b]* | — | the C# scope's proof deleted → `proof missing` under the `node` profile too | — |
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
public static RawTempBaseline LoadAt(string repoRoot);                 // raw-temp-baseline.json at the git root; a symlink or a non-root folder is refused the way the Node loader refuses it
public GuardReport Apply(GuardReport report, IReadOnlySet<string> discovered);  // the scopes whose proof is in `discovered` are judged: their entries pass up to the count, the rest of them are stale; other scopes apply nothing and report only an absent file; proof absent / class / malformed → "baseline"
```

The consumer's wrapper is then `RawTempBaseline.LoadAt(root).Apply(LeftoversGuard.Scan(root, mount), scan.FilesRead)` and
the empty assertion — `GuardReport` today carries `FilesScanned` (a count); the template adds the set of relative paths it
read (`FilesRead`), which is the one change to the report type and none to the scanner. The tests show behaviours 1–9, 12,
21b, 21c, 25 and 26 (the Node tool's 10, 11, 13, 14, 24, 27–30 are not ported). The shrink check is NOT ported: the
consumer's CI runs the Node tool's `--baseline-shrinks --base <target>` once per PR over the one file (one implementation,
as the C# guard already shells to the shipped `sweeper-scan.mjs` for scripts). If the template lags coai's producer PR,
coai's wrapper may carry the reader inline FIRST and the template adopts that code unchanged — the plan says which it was.
**Rust** (`dew_flow_sidecar_rust`): no guard reads `raw-temp` there today (checked 2026-11-01); when one exists it reads
the same file under the same judged-scope rule — nothing to build now.

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
selection baseline and the matrix fixture → E2-b the judged-scope rule (companion text, `proofHolds`'s three answers,
tests 25, 26) → E2-c the `--allow-create` sentence → E2-d the precedence in this plan's format (text only; built here) →
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
- **R6 — a scope no guard judges is silent about its entries** *[epoch 2]*. By Goal 6 it lets nothing pass, so a leak
  cannot hide behind it; what can happen is a baseline that keeps dead entries nobody reports. The creation PR's review
  shows each scope judged by its guard (both runs in the PR), and S7's drain removes entries by diff, not by report.
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
      fixture); the judged-scope rule is in the companion and in `proofHolds` (E2-b, tests 25, 26); the `--allow-create`
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
      *(Epoch 2's E2-b refines "discovered": in the tree but not discovered by THIS guard is another guard's scope.)*
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
  `--baseline` flag, and each of the repository's guards judges the scopes whose proof it discovered (coai: the Node
  guard under `--profile node` judges `src_vs_code/src/test/`, the C# reader judges the C# scopes; one file, both runs
  in CI; one `--baseline-shrinks` over it).
- **N4 — the C# reader in the template first, or coai inline first?** Default: the template, in parallel from the
  epoch-2 approval; coai inline only if the template is not merged when coai's producer PR is ready, with the template
  adopting that code unchanged. The surface is `LoadAt(root)` and `Apply(report, discovered)` — no `Load(path)`.
