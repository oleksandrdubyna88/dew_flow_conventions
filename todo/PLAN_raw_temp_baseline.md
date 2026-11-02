# PLAN — The `raw-temp` baseline: rule §7 authorises one ratcheting, membership-keyed baseline for sites proven to run inside an owned run folder

> Status: **S1–S3 built on branch `feat/raw-temp-baseline`, 2026-11-01; the release (S4), the C# reader and the pin bumps are NOT done** — see § *Build progress*. Scope: one sentence in the core
> `common/test-leftovers.md` §7, one paragraph in the detail `common/test-leftovers-detail.md` §7, the Node guard
> `tools/leftovers-check.mjs` (a `--baseline` pass, a `--baseline-shrinks` check, a `--print-baseline` listing, the
> class `baseline`) with its tests, the rule tests' caps, the research record, one release, and the pin bumps. It
> changes the family's PUBLIC test-leftovers contract; the C# side is a recommendation to the template's owner, not a
> change here. Written by Fable as a cornerstone spec; coded by Sonnet; reviewed by Opus. **Plan gate** (coai session
> `c42be871`, round 1, 2026-11-01, both reviewers answered): verdict **PROCEED**, five findings, all accepted and
> applied below, each marked *[gate finding n]*; the gate ruled the plan one unit, not split. B1 decided with the
> round: the hash is of the TRIMMED line.

## Plan changes

> Epoch 1 · approved 2026-11-01 · by reviewers · state: open

- 1.1 · 2026-11-01 · reviewer · contract — the baseline has one fixed path at the repository root and is never a symlink
  (Opus B1: a symlink turned a grown baseline into an allowed creation — the file at a link's target was "absent at base"
  and `--allow-create` passed it; Opus M3: with a path argument, any new path counted as a "first creation", so a second
  baseline file passed the creation rule. One path, a regular file, closes both: `--baseline`, `--baseline-shrinks` and
  `--print-baseline` take no path, and wherever this plan says `--baseline <path>` or `--baseline-shrinks <path>` it
  now means the flag that reads `raw-temp-baseline.json` at the repository root.)

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

## Goal

The shared rule authorises a **`raw-temp` baseline** under exactly these terms, and the shipped Node guard enforces
them, so that a consumer can land its guard with every other class at zero and drain the baseline to zero afterwards
(coai's S7), while a NEW raw temp call is red the day it is written.

1. **Only `raw-temp`.** A baseline that names another class, or an entry that would clear another class, is a
   finding. `owner-blind`, `legacy-name`, `raw-worktree`, `docker-*`, `shared-store`, `ryuk-off` keep their rules.
2. **Only sites proven to run inside an owned run folder.** The baseline file names, per scope (a tree root), the
   proof: a test file in that scope that carries `testsToDelete-baseline-proof: <scope root>`. The proof's substance
   is three things the rule names (the runner makes the folder first; a run that cannot make it fails before any
   test; a first-ordered test per assembly or package asserts `TEMP` names the run folder). The guard checks the
   declaration mechanically (the file exists in the scanned tree and carries the marker for that root); the reviewer
   of the baseline's creation checks the substance and says so in the PR. An entry outside every scope is a finding.
3. **Exact membership, as a multiset.** Keyed by file + sha256 of the trimmed line, one entry per occurrence; the
   scan passes a key's occurrences up to the number of entries and no further. The line number is a hint, never a
   key. A count ceiling alone is refused for the reason coai's own
   `src_vs_code/src/test/suppressionsOnlyShrink.test.ts:14-20` records: under a constant total one entry can be
   swapped for another.
4. **Only shrinks.** A new site is a `raw-temp` finding. A stale entry is a `baseline` finding until removed —
   reconciled GLOBALLY over the whole baseline, not per visited file, so an entry of a deleted file or of a file
   whose hits dropped to zero is stale too *[gate finding 0]*. A malformed or wrong-schema file is a `baseline`
   finding (exit 1, with its cure), as the rule text says; exit 2 is only an unreadable file or a usage error
   *[gate finding 1]*. A check against the base ref refuses a new key, a raised count, a new scope, a widened root
   or a changed proof *[gate finding 3]*, and any creation but the first: `--allow-create` passes only when the path
   has NO git history, so a re-creation after the file existed is refused *[gate finding 4]*. No command writes the
   file; `--print-baseline` prints to stdout only, for the one creation.
5. **Read only when named.** The guard reads a baseline only through `--baseline <path>` (or the `baseline` option
   of `scanRepository`). Nothing is discovered from the scanned tree; the default run is byte-for-byte the current
   behaviour. This is a deliberate difference from the `owner-blind` allowlist, which is read from beside the tool
   and never from the scanned tree (`tools/leftovers-check.mjs:835-847`): that one protects other users' data; this
   one records sites inside the run's own swept folder, and its ratchet is the shrink check plus the review of a
   file that can only lose lines.

## Boundary with the plans around it (named on both sides)

| Item | Built by | The other side's part |
|---|---|---|
| The rule text, the Node guard's baseline pass, shrink check and tests, the release, the pin bumps' order | this plan | — |
| The baseline FILES, the proof tests, the wrappers that pass the baseline, the drain | `dew_flow_connect_other_ais · todo/PLAN_test_leftovers_E5.md` D6, S3 sc. 2, S6, S7 | reads the released form; its producer PR waits for the pin bump to the release this plan ships (D8 condition 5) |
| A shared C# baseline reader beside the byte-identical scanner | `dew_flow_mcp` (the template every C# consumer copies) — recommended below, its own plan there | this plan fixes the file format and the six behaviours its tests must show |
| Which consumers use it | the rollout plan `todo/PLAN_test_leftovers_rollout.md` (E5 yes; E2 declined; E6, E7 may) | this plan changes no consumer |

Order: this plan's rule and guard, then its release, then coai's pin bump, then coai's producer PR. Disjoint: nothing
here edits a consumer, and nothing in coai edits the rule.

## Growth surface

The baseline file is a list that only shrinks. Projected at coai's volume: ~1,200 entries × ~120 B ≈ 150 KB over
two files, committed once, retired by coai's S7 (one PR per suite) to zero; a file at zero entries is deleted with
its last entry (the rule says so). No in-flight state: nothing to sweep when interrupted.

## The proposed rule text

### The core, `common/test-leftovers.md` §7 — one sentence, appended to the paragraph before `Detail: §7.`

> A `raw-temp` site that provably runs inside an owned, claimed run folder may instead be carried by the repository's
> **`raw-temp` baseline**: a multiset of sites (file and the content hash of the line; the line number a hint), read
> by the guard only when named, that only shrinks — an occurrence beyond it, a stale entry, a site outside a proven
> runner or any other class in it is a finding.

Bytes: the sentence is 392 B (+1 B separator). The core is 8,483 B at `105d53c`/`2d12d8f` (`wc -c`); after the
change **8,876 B**. The test cap `CORE_CAP = 8500` (`tools/test-leftovers-rule.test.mjs:39`) moves to **9000**. The
cap exists for a consumer's 90 KB reviewer-rules budget; 8.9 KB of 90 KB keeps that whole. `MUST_CARRY` for
`"## 7. "` (`tools/test-leftovers-rule.test.mjs:110`, `:117`) gains the phrase "`raw-temp` baseline" so the core can
never lose it.

### The detail, `common/test-leftovers-detail.md` §7 — one paragraph after the exemption grammar (line 270)

> **The `raw-temp` baseline — a second pass, for that one class only.** A repository whose test runner makes an
> owned, claimed run folder (§2) and points `TEMP`, `TMP` and `TMPDIR` at it before the first test may carry the
> `raw-temp` sites under that runner in a baseline file instead of exempting each line. *Proven* is three things in
> the tree, named by the file as a scope's proof: the runner makes the folder before the first test; a run that
> cannot make it fails before any test; a test per assembly or package, ordered first, asserts that `TEMP` names the
> run folder and carries `testsToDelete-baseline-proof: <scope root>`. The file — `{ "class": "raw-temp", "scopes":
> [{ "root", "proof" }], "entries": [{ "file", "sha256", "line" }] }` — is a **multiset**: one entry per occurrence,
> keyed by the file and the sha256 of the trimmed line; `line` is a hint, never a key. A guard reads it only when
> told to, passes a key's occurrences up to its entries and no further, and finds an occurrence beyond them
> (`raw-temp`) and, as `baseline`, an entry no line matches, an entry outside every scope, a scope whose proof is
> missing, a class other than `raw-temp` and a malformed file. It **only shrinks**: an entry goes when its site goes;
> after the file's first reviewed commit none is added or re-keyed, a check against the base ref refuses a new key,
> a raised count, a new or wider scope, a changed proof and any creation but the first, and nothing regenerates it.

Bytes: the paragraph is 1,471 B with its blank line (*[gate findings 3, 4]* added 37 B). The detail is 31,241 B;
after the change **32,712 B of the 32,768 B** per-read cap (`tools/test-leftovers-rule.test.mjs:68-80`, S1 2) — it
fits, with 56 B to spare. That
headroom is a risk this plan records (§ *Risks*, R1) rather than hides. Both bodies are re-recorded with
`node tools/rule-bodies.mjs --update common.test-leftovers common.test-leftovers-detail`
(`research/rule-bodies.json:445-470`). The text names no product and no path that moves; `ownership-check` stays
armed.

### What the rule deliberately does NOT say

- No inline exemption for `baseline` findings: the fix is to edit the file (remove the entry) or the code.
- No `count` field: a key's count IS its number of entries. One shape, `{ file, sha256, line }`, the same as the
  allowlist's, so one validator serves both (`tools/leftovers-check.mjs:839-847`).
- No `--update-baseline`. The only writer is a person, in a reviewed diff that removes lines.

## The file format (normative; the detail's one-line shape, written out)

```json
{
  "about": "raw-temp sites inside the owned run folder; only shrinks — common/test-leftovers-detail.md §7",
  "class": "raw-temp",
  "scopes": [
    { "root": "src/test/", "proof": "src/test/runFolder.test.mjs" }
  ],
  "entries": [
    { "file": "src/test/a.test.mjs", "sha256": "<64 hex of the trimmed line>", "line": 18 },
    { "file": "src/test/a.test.mjs", "sha256": "<the same key, a second occurrence>", "line": 40 }
  ]
}
```

- `class` must be exactly `raw-temp`; anything else → `baseline` finding, and no entry is applied.
- `scopes[].root` is a repository-relative folder with a trailing `/`; `proof` is a file under that root, present in
  the scanned tree, containing the marker `testsToDelete-baseline-proof: <root>` for that exact root.
- `entries[].file` is repository-relative with forward slashes and must start with some scope's `root`;
  `sha256` is `createHash("sha256")` of the line with leading and trailing whitespace and any `\r` removed (so a
  re-indent or an EOL change keeps the entry — unlike the allowlist's `lineSha256`,
  `tools/lib/sweeper-scan.mjs:156-158`, which pins exact bytes on purpose); `line` is a 1-based hint.
- Order is free; two entries with one key are two occurrences.

## The Node guard — `tools/leftovers-check.mjs`

Code by a Sonnet coder from this brief; `tools/leftovers-check.mjs` is 972 lines, so the baseline logic is a new
module `tools/lib/raw-temp-baseline.mjs` (load, validate, `siteSha256`, apply, shrink diff; ~200 lines) and the
guard gains the arguments and the wiring only (coding-style: 800 lines max).

1. **Arguments** (`parseArguments`, `:894-909`): `--baseline <path>` (a file; resolved like `--allowlist`),
   `--print-baseline` (a flag; prints the JSON above for the current scan's `raw-temp` findings — `scopes` empty, to
   be written by hand — to stdout, exit 0, writes nothing), `--baseline-shrinks <path>` with `--base <git-ref>` and
   the optional flag `--allow-create`. `USAGE` and the header comment (`:1-40`) name all of them, and `USAGE` says
   that a CI checkout fetches the base ref before `--baseline-shrinks` *[gate finding 2]*.
2. **`loadBaseline(path)`**: the shape above, or — for a file that is not JSON, not the schema, has a 63-hex sha, a
   backslash path or a `class` other than `raw-temp` — ONE `baseline` finding at the file's line 1 naming the field,
   after which no entry applies and the scan goes on (exit 1 with the cure); only a path that cannot be read is exit 2
   *[gate finding 1]*.
3. **Apply** — in two steps. Per file, in `lineFindings` (`:398-421`, after the `raw-temp` check): group the
   `raw-temp` hits by `siteSha256(line)`; for each key let `n` be the entries of the baseline with that file and key;
   the first `n` hits in line order pass, the rest are `raw-temp` findings as today; a hit on a line that also
   carries a valid inline exemption is exempt first (unchanged); each passed hit is recorded as a MATCHED entry. Then
   once, in `scanRepository` after every file (`:873-880`), the global reconcile *[gate finding 0]*: every baseline
   entry that no hit matched — an entry of a visited file with fewer hits than entries, of a file whose hits dropped
   to zero, of a deleted file, of a file discovery never read — is a `baseline` finding ("entry has no line", at the
   entry's hint line); an entry whose file is under no scope → `baseline`; per scope once: a proof file missing from
   the tree, or without the marker for that root → `baseline`.
4. **`CURES.baseline`**: "Remove the stale or out-of-scope entry from the baseline, or move the site into the helper;
   nothing adds to it — common/test-leftovers-detail.md §7 (the `raw-temp` baseline)." `EXEMPTIBLE` unchanged.
5. **`--baseline-shrinks`**: reads the file in the working tree and `git show <base>:<path>` through
   `tools/lib/git.mjs`; compares the two multisets by (file, sha256): a key new in the working copy, or with more
   entries than at base → exit 1 naming each; hints ignored. **Scopes are compared too** *[gate finding 3]*: a scope
   root not at base, a root that is a prefix of a base root (wider), or a scope whose `proof` changed → exit 1
   naming it, like a new entry; a scope removed or narrowed is a shrink. The file absent at base → exit 1 ("a
   creation; pass --allow-create in the one creation PR and record it") unless `--allow-create`; **`--allow-create`
   is honoured only when `git log --all --format=%H -- <path>` is empty** *[gate finding 4]* — a path with any
   history is a re-creation and is refused with that sentence; a shallow clone (`git rev-parse --is-shallow-repository`
   true) fails closed with the fetch to run (`git fetch --unshallow`). The file absent now and present at base →
   exit 0 (drained). **The CI contract** *[gate finding 2]*: the step fetches the base ref first
   (`git fetch origin <base-branch> --depth=1` or the repository's own fetch), and an unresolved base ref fails with
   one sentence naming that fetch — exit 2, never a silent pass. A consumer's CI runs it against the PR base for
   every baseline file, whatever language the baselined tree is in — one implementation.
6. **Nothing else moves**: the `owner-blind` path, the allowlist's loader and `--update-allowlist` are untouched; a
   test pins that a run without `--baseline` produces the same findings as before over the fixture tree.

### Tests — `tools/raw-temp-baseline.test.mjs` (RED first, each behaviour watched failing, then GREEN, then the break-it)

Fixtures are built with `ownedDir(t, …)` as `leftovers-check.test.mjs:40-56` does; the prefix word is spelled in two
pieces (`:573-574`). `B` is a baseline holding one entry for `src/test/a.test.mjs` line 3 (a `mkdtemp` line) with a
scope `src/test/` whose proof `src/test/runFolder.test.mjs` carries the marker.

| # | Behaviour | RED (before the code) | GREEN | RED again (break-it) |
|---|---|---|---|---|
| 1 | a baselined site passes | `--baseline B` still reports `a.test.mjs:3 — raw-temp` | exit 0 | one byte changed on line 3 → `raw-temp` at 3 AND `baseline` (stale) at hint 3 |
| 2 | a new site is a finding | — | a second, different `tmpdir()` line at 7 → exit 1, `a.test.mjs:7 — raw-temp` | remove line 7 → exit 0 |
| 3 | a stale entry is a finding — reconciled globally *[gate finding 0]* | without the code a removed site leaves exit 0 | line 3 deleted → `baseline — entry has no line` at hint 3; the whole FILE `a.test.mjs` deleted, B unchanged → the same finding; a file whose only hit is rewritten to a non-temp line (hits drop to zero) → the same finding; an entry for a file discovery never reads → the same | entry removed from B → exit 0 |
| 4 | duplicate line (the multiset) | — | an identical copy of line 3 pasted at line 9, B holds ONE → exit 1 naming line 9 as `raw-temp`; B holding TWO entries for the key → exit 0 | B with two, the file with one → `baseline` stale |
| 5 | a moved line keeps its entry | — | ten lines inserted above line 3 (hint stays 3) → exit 0 | re-indented line → still exit 0 (trimmed hash); a changed character → RED as in #1 |
| 6 | a site outside a proven runner | — | an entry for `scripts/x.mjs` (under no scope) → `baseline — outside every scope`; scope whose proof file is absent, or present without the marker for that root → `baseline — proof missing` | marker added to the proof → exit 0 |
| 7 | the class restriction | — | `"class": "owner-blind"` (or any other) → one `baseline` finding, and an owner-blind line in the tree is STILL `owner-blind`; a baseline entry whose hash matches a `legacy-name` line clears nothing | — |
| 8 | read only when named | — | the same tree with the file present but no `--baseline` → the findings of today, unchanged | — |
| 9 | a malformed file is a `baseline` finding *[gate finding 1]* | — | a missing `entries`, a 63-hex sha, a `file` with a backslash, not JSON → exit 1, ONE `baseline` finding at `<file>:1` naming the field, the cure printed, no entry applied (the `raw-temp` sites stay findings); a path that cannot be read → exit 2 | — |
| 10 | `--print-baseline` | — | prints valid JSON with every `raw-temp` finding of the scan, `scopes: []`, writes no file (the tree is hashed before and after) | — |
| 11 | `--baseline-shrinks` | — | same file → 0; one entry removed → 0; hint changed → 0; a key added → 1 naming it; a key's count 1→2 → 1; absent now → 0 | `--base` unresolved → 2 with the one sentence naming the fetch *[gate finding 2]* (an `ownedDir` clone with the base branch not fetched) |
| 12 | the real tree | — | `node tools/leftovers-check.mjs` over this repository stays clean with no baseline; this repository ships NO baseline file (a test pins its absence, the way `LEGACY_NAME_PENDING` is pinned empty, `:75-82`) | — |
| 13 | scope widening is refused *[gate finding 3]* | — | a scope added → 1 naming the root; `src/test/unit/` at base widened to `src/test/` → 1 ("wider"); `proof` changed → 1; a scope removed, or narrowed to a sub-root → 0 | — |
| 14 | re-creation is refused *[gate finding 4]* | — | in an `ownedDir` repository: file absent at base and NEVER committed → `--allow-create` → 0; file committed once, deleted and committed, then re-added → `--allow-create` → 1 with the re-creation sentence; without `--allow-create` a creation → 1 | a shallow clone (`git clone --depth=1` of the fixture) → 2 naming `git fetch --unshallow` |

Rule tests (`tools/test-leftovers-rule.test.mjs`): `CORE_CAP` 9000; the new `MUST_CARRY` phrase watched RED on the
old core text, GREEN on the new; S1 2 (the 32 KiB read) and S1 7 (nothing lost against the `7852de2` fixture) stay
green on the new detail.

## The C# side — recommendation (the template's owner decides; its own plan in `dew_flow_mcp`)

The C# scanner (`dew_flow_mcp · tests/Mcp.Tests/Leftovers/LeftoversGuard.cs:139`, `Scan(root, mountRoot, node) →
GuardReport`) returns findings and `LeftoversRepositoryGuardTests.cs:14-17` asserts the collection is empty. A
consumer could filter in its own wrapper, but ~80 lines of multiset-and-scope logic copied per consumer is the
duplicate `reuse-first` names as the whole defect, and a wrapper written by each consumer will apply the rule at
some of its sites. **Recommended: the template gains a shared reader, `RawTempBaseline.cs`, beside the byte-identical
scanner**, with `RawTempBaselineTests.cs` showing the same behaviours (#1–#9 and #12 apply, the global reconcile of #3 and the
`baseline` finding of #9 included; #10, #11, #13 and #14 are the Node tool's), and `LeftoversGuard.cs` untouched:

```csharp
// tests/Mcp.Tests/Leftovers/RawTempBaseline.cs — copied by every C# consumer, byte-identical
public static RawTempBaseline Load(string path);                       // the file format above, or a throw naming the field
public GuardReport Apply(GuardReport report, string repoRoot);         // raw-temp findings up to the count pass; every unmatched entry (global), out-of-scope, proof, class, malformed → "baseline" findings
```

The consumer's wrapper is then two lines: `RawTempBaseline.Load(path).Apply(LeftoversGuard.Scan(...), root)` and the
empty assertion. The shrink check is NOT ported: the consumer's CI runs the Node tool's `--baseline-shrinks` over the
C# tree's file (one implementation, as the C# guard already shells to the shipped `sweeper-scan.mjs` for scripts).
If the template lags coai's producer PR, coai's wrapper may carry the reader inline FIRST and the template adopts
that code unchanged — the plan says which it was. **Rust** (`dew_flow_sidecar_rust`): no guard reads `raw-temp`
there today (checked 2026-11-01: no `teststodelete` under its `src/`, `tests/`, scripts or workflows outside the
mount); when one exists it reads the same file and runs the same shrink check — nothing to build now.

## The release and the pins

The usual path, as R5 and R7 ran it (`todo/PLAN_test_leftovers_merged_core_release.md:118-133`, `:185-205`):

1. This plan's PR merges (plan gate, code gate, Opus review; `npm test`, `npm run check` green).
2. The warning to the sessions that own open consumer pull requests — a comment on each open consumer PR not opened
   by a bot, and a message to the open sessions — BEFORE the dispatch, with the recipients and date recorded here.
3. `node tools/promote-release.mjs <sha> --dry-run`, then `gh workflow run promote-release.yml --ref main -f sha=<sha>
   -f reason="test-leftovers: the raw-temp baseline (rule §7, the guard's --baseline pass)"`, then
   `node tools/release-distance.mjs` → 0.
4. Pin bumps, each alone (R6 owner decision 1): coai first (E5's producer PR waits on it); creds (E2) declined the
   baseline but takes the pin as every consumer does; benchmark (E6) and rag_qln (E7) decide in their own plans
   whether to use it. A pin bump creates no baseline.

## Build order

S1 the rule text and the rule tests (watched RED on the caps and the phrase) → S2 the Node module, the guard's
wiring, the fourteen tests, the header and `USAGE` → S3 `research/module_tests.md` (§ *Test leftovers*, `:1199`,
`:1247-1250`) and `research/rule-bodies.json` → one PR → S4 the release and the pins (above). The C# recommendation
is handed to the template's owner at S1 so that its plan can start in parallel.

## Test plan

```bash
npm ci --ignore-scripts
node --test tools/test-leftovers-rule.test.mjs tools/raw-temp-baseline.test.mjs tools/leftovers-check.test.mjs
npm test && npm run check
node tools/ownership-check.mjs && node tools/rule-bodies.mjs && node tools/plan-lifecycle.mjs
node tools/leftovers-check.mjs                      # this repository: clean, no baseline
node tools/release-distance.mjs                     # after S4 only
```

## Risks

- **R1 — the detail's headroom is 56 B.** The next sentence anybody needs in the detail forces a split. Mitigation
  recorded now: that change moves §7's baseline paragraph and the file format to a companion
  `common/test-leftovers-baseline.md` (the janitor precedent, `common/test-leftovers-janitor.md:1-5`), with the
  detail keeping a one-line pointer. Not done here: the instruction for this plan puts the full definition in the
  detail, and it fits.
- **R2 — a baseline hides a real leak.** A site under a scope whose proof is wrong (TEMP set after some test, or a
  runner that swallows the folder failure) leaks into the real temp root. The guard checks the declaration, not the
  substance; the substance is the reviewer's at creation and the end-of-run audit's (coai D9) every run.
- **R3 — deletion and re-creation across two PRs widens the baseline.** Closed by *[gate finding 4]*:
  `--allow-create` is honoured only for a path with no history at all (`git log --all`), so a re-creation is refused
  by the check, not only by the rule. What remains: a history rewritten to erase the path, which no check here sees,
  and a shallow clone, which fails closed with its fetch hint.
- **R4 — the trimmed hash is wider than the allowlist's exact hash.** Chosen so a re-indent does not strand an entry
  (a stale entry can never be re-added). The width is one line's whitespace; the content is still exact.
- **R5 — two guards, one file format.** The C# reader is recommended, not built here; until it lands coai carries the
  logic inline. The format is fixed by the rule, so the two cannot drift on the contract, only on bugs.

## Definition of Done

- [x] The core carries the sentence verbatim; the core is ≤ 9,000 B and ≥ its text at `2d12d8f` (nothing lost); the
      full paragraph is in the companion (N1) and the detail reads under 32 KiB with `--only`; `MUST_CARRY` holds the phrase.
- [x] `tools/lib/raw-temp-baseline.mjs` and the guard's `--baseline`, `--print-baseline`, `--baseline-shrinks`,
      `--base`, `--allow-create` exist and are in the header and `USAGE`; class `baseline` has its cure.
- [x] The fourteen behaviours were each watched RED, then GREEN, then RED again where the table says — the global
      reconcile (a deleted file, hits at zero), the malformed file as a `baseline` finding, the unresolved base ref's
      fetch sentence, scope widening and re-creation among them; the default run over the fixture tree and over this
      repository is unchanged; this repository ships no baseline file.
- [x] `rule-bodies.json` re-recorded; `research/module_tests.md` § *Test leftovers* names the three arguments and the
      class; `ownership-check` passes with no baseline file of its own.
- [ ] The C# recommendation was handed to the template's owner with the format and the behaviours; the
      boundary is written in `dew_flow_mcp`'s plan and in coai's E5 (both sides).
- [ ] The release: warning sent and recorded, `promote-release.yml` run, `release-distance` 0; coai's pin bump merged
      alone; the other consumers' pin bumps listed here.
- [ ] `node tools/plan-lifecycle.mjs` clean; this plan promoted to `research/` with its deviations when S4 is done,
      its `todo/README.md` row going with it.

## Build progress

Built on `feat/raw-temp-baseline` (local commits, nothing pushed, nothing released). Every behaviour of the test
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
      per-file tail, and the core (8,876 B) is unchanged.
- [x] [code gate 11, Opus m5] a proof is a file the guard DISCOVERED in this scan, a test file (`x.test.mjs`, `x.spec.ts`,
      `XTests.cs`, `x_test.go`, a file under `test/` or `tests/`), and not the baseline file. The companion says so. Test 18.
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
      command [ledger 1.1].
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
      its outcome: a `baseline` finding in the scan (symlink, outside), exit 2 in the shrink check. Test 23.
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
   because a deletion that merged is already in `<base>` and other refs make a local run and CI differ.
3. **The shallow-clone fail-closed applies when history is consulted** (a creation with `--allow-create`), not to
   every shrink check: a CI checkout is shallow by default and the plain check needs only the base ref's blob.
4. **An entry under no scope, or under a scope whose proof does not hold, clears nothing** (the site stays a
   `raw-temp` finding as well as the `baseline` finding): the plan says "a site outside a proven runner … is a finding".
5. Test 4's duplicate line sits at line 10 (not 9) because the fixture's source has four lines before the padding.

## Open questions

Blocking: none open.

- **B1 — DECIDED with the gate round (2026-11-01): the hash is of the TRIMMED line.** Nothing can re-add an entry,
  so an exact-bytes hash would strand an entry on a re-indent.

Non-blocking (the defaults below were kept by the gate round; a different answer is one edit):

- **N1 — DECIDED at build (2026-11-01, coordinator instruction): a COMPANION, not the detail.** The F16 branch
  (`fix/f16-windows-list-only`, merging first) adds 131 B to the detail's §4 (31,241 → 31,372 B); the plan's
  paragraph (+1,471 B) would make the detail 32,843 B, over the 32,768 B per-read cap. So the FULL definition lives in
  the new `common/test-leftovers-baseline.md` (id `common.test-leftovers-baseline`, `load: conditional`, tasks
  `audit`, `policy`, `release` — the janitor companion's frontmatter pattern; `test` and `pr` were added after the code gate), and the detail's §7 carries a 3-line
  pointer paragraph. Bytes: core 8,876 (unchanged, the sentence stays in the core); detail 31,546 (+305 on 31,241;
  with F16's +131 it is 31,677, 1,091 B under the cap); companion 7,113. The companion holds the plan's paragraph
  verbatim plus the file format and the guard behaviour; no other text of the detail was touched. R1's mitigation
  is thereby done, not deferred.
- **N2 — `count` field or repeated entries?** Default: repeated entries (one shape, one validator). coai's E5 text
  says `{ file, sha256, line, count }`; coai reads the released form, so its S6 follows this.
- **N3 — one `--baseline` per run or repeatable?** Default: one; a repository with several files runs the guard once
  per file's tree (coai: the Node profile has one file; the C# trees use the C# reader).
- **N4 — the C# reader in the template first, or coai inline first?** Default: the template, in parallel from S1;
  coai inline only if the template is not merged when coai's producer PR is ready, with the template adopting that
  code unchanged.
