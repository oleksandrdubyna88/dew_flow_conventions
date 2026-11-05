# F30 — the folding reader: the measure and the real-tree record (2026-11-05)

This is the record of `todo/PLAN_F30_folding_reader.md`. The plan is the decision. This file holds the numbers.

## 1. The piece rule — measured before the build

A literal-level search of every tracked `.mjs .cjs .js .ts .mts .cts .sh .ps1 .yml .yaml` file, without the mounted rules. A literal that holds the whole word is left out.
Trees: coai `b3bdd472`, creds `41aca25c`, this repository `6d67ca4`, and the local heads of benchmark, rag_qln, sidecar_rust, vscode_kit and mcp. The search reads literals by a rough regular
expression. It is evidence for the choice of rule and not the acceptance check.

| Piece rule | coai | creds | conventions | benchmark | rag_qln | sidecar | kit | mcp |
|---|---|---|---|---|---|---|---|---|
| `sto` or `tod`, any case (F30's first text) | 2386 | 2454 | 352 | 1069 | 135 | 6 | 152 | 4 |
| crossing pieces of 5 or more, any case (the C# template's rule) | 22 | 3 | 34 | 0 | 0 | 0 | 0 | 0 |
| crossing pieces of 6 or more, any case (**the rule built**) | 0 | 1 | 34 | 0 | 0 | 0 | 0 | 0 |
| crossing pieces of 5 or more, case kept | 0 | 1 | 20 | 0 | 0 | 0 | 0 | 0 |

A crossing piece is a substring of the word that is not wholly inside `tests` and not wholly inside `Delete`. `sto` and `tod` are in `restore`, `history`, `stop` and `todo/`. The 5-character rule hits
`hostStopped` and `chatModelEdits`.

## 2. The two tables (`tools/leftovers-check.test.mjs`, D5)

| Table | Rows | Release guard `bd795847` | This branch | Reader switched off by hand |
|---|---|---|---|---|
| 1. each spelling is a finding on its exact line, with its class | 31 | 26 wrong (5 rows already worked) | 0 wrong | 26 wrong |
| 2. product words and paths that stay `[]` | 26 | 0 wrong (it cannot go red on a guard that finds nothing) | 0 wrong | 0 wrong |

Table 2 went red only on the first version of the reader, three times, on real trees (section 4). Each of those is now a row.

## 3. The real-tree record

Command, for each tree (`--repo` is the tree, the guard is the file named in the column):

    node <guard> --repo <tree> --profile node --token <token> --identity "<row>"

The release guard is `tools/leftovers-check.mjs` of a throwaway `git worktree` of `bd795847`. The branch guard is this branch at the commit named in the plan's record. Trees were read, never changed.
None of the seven trees runs the Node guard in its CI yet, except coai's baseline step; so every tree still shows its pre-adoption `raw-temp` and other findings, the same under both guards. The comparison is by
file, line and class, and then by text on the lines both have.

| Tree | Commit | Token | Release guard | Branch guard | New findings |
|---|---|---|---|---|---|
| coai (`wt/coai-e5-producer`) | `b3bdd472a3c64af19b14de5399ef39aa7525701e` | coai | 229 `raw-temp` | 229 `raw-temp` | 0 |
| creds (`wt/creds-e21`) | `41aca25c642a2c2c9ea43d9ee92dd3dc44819e7c` | creds | 16 (9 `raw-temp`, 5 `docker-name`, 2 `docker-run`) | 17 | 1 `legacy-name` |
| benchmark | `246eedc9940b835eb0b22c9c4bfcf27f41fda532` | bench | 202 | 202 | 0 |
| rag_qln | `fa4b570c337aafbac4205b03f783ec2707b264da` | qln | 13 `raw-temp` | 13 | 0 |
| sidecar_rust | `1c1282e568bb4873449092a9336110bd6cf6f1a3` | sidecar | clean (6 files) | clean (6 files) | 0 |
| vscode_kit | `1d2681cc3d0c5f041408cf4990cc0da52a102d00` | conventions (the kit has no token row) | 23 (20 `raw-temp`, 3 `legacy-name`) | 23 | 0 |
| mcp | `b35288100f1d6b5e8ac6ccd19c2819041115bf1a` | mcp | 21 `raw-temp` | 21 | 0 |

No finding of the release guard went away, and no text of a shared line changed.

**The one new finding is real:** creds `src_vs_code/src/test/leftoversSites.test.ts:74` builds `'testsTo' + 'Delete-agent-'` so the file does not find itself. It is the line the plan names. Its cure is in
creds, by the exemption grammar, before creds pins the release.

## 4. False findings the first reader gave, and their cures

The first reader gave 10 more findings on three trees. Each was read; each was a defect of the reader; each is now a row of table 2 or table 1.

| Where | Line | Why it is no finding | Cure in the reader |
|---|---|---|---|
| coai `.github/workflows/ci.yml:70,72,364,366,491,493,495` | `grep -v "testsToDelete-[uw][0-9]"` and a `grep -Eq` of the same shape | the owner is a class `[uw]` before digits: the classifier's own `owner-aware` shape | the bare word asks `verdictAfter` of `sweeper-scan.mjs` (now exported), the one verdict of the classifier |
| benchmark `spikes/minigit-bench/test/heldout-run.test.mjs:155,156` | a sentence in an assertion message: `a testsToDelete entry is listed` | a space follows the word: no name of the form and no sweep reaches it | a space after the word is prose |
| benchmark `spikes/lang-bench/test/exec-probe-stop.test.mjs:86` | `'testsToDelete-u' + process.getuid() + '-bench-…'` | the owner form built at run time: the number is the next operand of a `+` | the owner letter at the end of a literal, with a `+` after it, is not a bare word (the line was already a `legacy-name`) |

Also in the reader, from this repository's own tools: the docker label key `testsToDelete.owner` is not a name and not a pattern (the classifier skips it too).

## 5. This repository

The reader found 23 new findings in 10 files of this repository's own tools and tests (28 before the label-key, sentence and owner-class rules of section 4). They build the word from pieces on purpose, to hold break-it fixtures. They are the frozen list `FOLDING_ALLOWANCES`
(D6), pinned by a test that each file exists and still draws a finding without its allowance. A whole legacy literal in a listed file is still a finding.

## 6. What the reader does not read

A name built from a variable, across lines, from the environment or at run time; a template hole that holds anything but a literal; a regex escape inside a string (`T` in a `RegExp` string); an
extensionless script; a file kind that is not listed. A zero for `legacy-name` and `owner-blind` is zero on the spellings the reader joins and decodes, and not zero on every spelling.

## 7. Epoch 2 — the rebuild (2026-11-05)

The plan's epoch 2 (approved by the owner, `todo/PLAN_F30_folding_reader.md`) replaced the regular-expression reader of sections 2 to 5 with a forward-only scanner (D1). **Nothing above is removed: sections 1 to 6 are the record of the first
build.** What this section supersedes: the third row of section 1 ("crossing pieces of 6 or more, any case", the rule built then) is now crossing pieces of 6 or more in the word's OWN form (camel, lower, upper) with no letter at either side;
the bare word and the half word are `legacy-name` and no longer `owner-blind` (a bare word with a pattern in its tail stays `owner-blind`); section 6 is replaced by D2's table, which is the header of `tools/leftovers-check.mjs`. The numbers below
are those of the guard code of commit `773d0d7` (the commits after it change tests, the comment of the guard's header and documents only; the diff of `tools/lib/` and `tools/leftovers-check.mjs` against it is that one comment line).

### 7.1 D5's four checks, RED first

The tests are `tools/leftovers-check.test.mjs`, the section "F30" (26 tests). They were written first and run against the reader they replace, `edc7174` (the branch tip before the rebuild: the regular-expression reader of `3849640`
and `2adbe82`), in a scratch copy of that tree, with this branch's test file:

| Check | RED on `edc7174` | GREEN on the rebuild |
|---|---|---|
| all F30 tests | 18 of 26 failed (8 passed: the reader-off check, the structure of the table, a whole name in a comment, the JSX limit, the allowance list, the repository's own scan, the janitor's allowlisted line, and a long comment: all met by the old reader already) | 26 of 26 |
| 1. table of spellings, as a list of `line:class` | 34 of 96 rows wrong (every bare word and half word answered `owner-blind`; the regex-literal class, the parenthesised operand, the multi-line template piece, the `.sh` word of unquoted and quoted pieces, the `.ps1` binding and the exemption rows answered `[]` or another class) | 0 of 96 |
| 1. the 13 real pieces of the measure | red at the first (`testsTo`) | 13 of 13 `legacy-name` |
| 2. no false finding | 39 of 73 rows wrong: 20 of the 27 ordinary words (`toDelete`, `testStatus`, `autoDelete`, `filesToDeleted` ...), `TestsTo`, a letter at a side, `testsToDeleted`, `testsToDeleteCount`, a comma after the word | 0 of 73 |
| 3. each reading can go red (the reader-off check through `foldingAllowances`) | the raw readings were unchanged, so this one passes on the old reader; it is red when a mutant changes them (7.2) | green |
| 4. time, 256 KiB, throw | red: the old reader has no step counter, no limit and no wrapper | green |

The old reader's own text on the first run: "F30 table 2 ... lines that must stay []: `const a = "toDelete";` (the product word toDelete): ["2:owner-blind"]" and 19 more of the same kind. The comment rows, the regex-with-a-quote rows and the multi-line template rows are
in the tables for the history the plan names (a regular-expression reader that shifted quote pairs and went quadratic).

The whole suite, the way the repository runs it (`node tools/run-tests.mjs`, lowered priority, `TMPDIR` a private empty folder): **1589 tests, 1581 pass, 0 fail, 8 skipped** (cases that need a Docker daemon, Windows or another account); `TMPDIR` is empty
after the run, which it was not before the fix of test 22 of the consumers file (the second commit after the rebuild: a `t.after` hook restored the locked folder's mode after its removal had failed, and left a `testsToDelete-u<uid>-conventions-consumers-<id>` folder and its `.owner`).
`node tools/plan-lifecycle.mjs`, `node tools/rule-bodies.mjs` and `npm run check` are clean.

### 7.2 The mutants, by hand, each recorded

One hand edit of the production code per row (`M01` to `M51`; 45 of them), then the whole of `tools/leftovers-check.test.mjs` was run (without the three `F30 time` tests, which take wall time; M31 and M35 were also run against `F30 limit` and `F30 time`
as the table says). The tests that went red are listed. A mutant that stays green is a missing row: **three stayed green on the first pass and each got a row** (M01: only the decoding of a class in a plain literal finds `"tests[T][o]Delete-agent-"`;
M20: a bare word on a line the RAW reading calls broad through its comment; M34: a hole that holds an object and a nested template), and **two edits did not apply** to the code as it had become (M31 and M36, aimed at text the output builder no longer had)
and were re-aimed. M02 was run again with the escape rows made stricter (two escapes in one word, so a piece cannot save the row). M01, M02, M20, M31, M34 and M36 are the runs against the final rows; the others ran against the rows of `773d0d7`
(rows were only added or made stricter after that, so a red stays red). M35 (a regex with no closer retried on every slash) and M37 (an unterminated quote read as a plain character) make the reader quadratic: the first is killed by the `F30 time` test not
finishing in 150 s, the second by the file's run not finishing in 400 s.

| # | Mutant (one hand edit of the production code) | Tests red | Which |
|---|---|---|---|
| M01 | class decoding off in a literal: a one-character class [T] is left as written | 1 | table 1 (spellings) |
| M02 | escape decoding off in a literal: \u, \u{}, \x are left as written | 2 | reader (fold rows); table 1 (spellings) |
| M03 | the decoded-code reading off (decodeCode returns its input) | 2 | reader (decodeCode); table 1 (spellings) |
| M04 | the classifier on the FILE's folded lines off (folded verdicts = the raw verdicts) | 1 | table 1 (spellings) |
| M05 | the classifier on folded text, but per line (no file bindings) | 1 | table 1 (spellings) |
| M06 | comments are read as code (JavaScript: // and /* */) | 5 | limit (comment); reader (block comment); reader (fold rows); reader (state); table 2 (no false finding) ... |
| M07 | comments are read as code (shell and workflow: #) | 2 | reader (fold rows); table 2 (no false finding) |
| M08 | comments are read as code (PowerShell: # and <# #>) | 3 | reader (block comment); table 1 (spellings); table 2 (no false finding) |
| M09 | regex recognition off | 2 | reader (fold rows); table 1 (spellings) |
| M10 | the bare word off | 2 | D6 (the list); table 1 (spellings) |
| M11 | the piece off | 3 | D6 (the list); table 1 (13 pieces); table 1 (spellings) |
| M12 | the + join off (JavaScript) | 8 | limit (comment); limit (raw readings); limits (JSX, nested template); reader (fold rows); reader (no marker) ... |
| M13 | the .concat join off | 2 | reader (fold rows); table 1 (spellings) |
| M14 | the array .join join off | 3 | reader (fold rows); table 1 (spellings); table 2 (no false finding) |
| M15 | the ${'…'} hole join off | 3 | reader (fold rows); table 1 (spellings); table 2 (no false finding) |
| M16 | the shell touching-pieces join off (a word ends at its first quoted piece) | 2 | reader (fold rows); table 1 (spellings) |
| M17 | the PowerShell + join off | 2 | reader (fold rows); table 1 (spellings) |
| M18 | the PowerShell -join off | 2 | reader (fold rows); table 1 (spellings) |
| M19 | the allowlist ignored by the folded readings | 5 | 2. break-it; 2. owner-blind; 2. the allowlist clears the janitor's inventory line and not the ...; D6 (janitor line); M-1. the shipped allowlist, read from beside the tool, still ... ... |
| M20 | one line draws two classes for one cause (the bare word and the piece also read a line the classifier called broad) | 1 | table 1 (spellings) |
| M21 | the allowance applied under a consumer | 1 | D6 (consumer) |
| M22 | legacyNameHits on the folded text off | 6 | D6 (consumer); D6 (default none); limit (comment); limit (raw readings); limits (JSX, nested template) ... |
| M23 | no finding of today is lost: the raw legacy-name reading replaced by the folded text | 7 | 2. legacy-name; 2. no file is exempt from the legacy-name class; 2. owner-blind; S8 (a). the classes that read text work the same on .ts, .tsx, ...; limit (raw readings) ... |
| M24 | the owner letter that a + continues is a bare word again | 1 | reader (bare word, piece) |
| M25 | prose is a bare word again | 2 | reader (bare word, piece); table 2 (no false finding) |
| M26 | the [uw] class is an owner with no digit form after it | 1 | reader (bare word, piece) |
| M27 | the label key .owner is a bare word | 5 | 1. this repository passes the guard; D6 (own scan); M-1. the shipped allowlist, read from beside the tool, still ...; reader (bare word, piece); table 2 (no false finding) ... |
| M28 | a piece may touch a letter | 2 | reader (bare word, piece); table 2 (no false finding) |
| M29 | the piece rule reads any case | 1 | table 2 (no false finding) |
| M30 | the piece minimum is 5 | 1 | reader (bare word, piece) |
| M31 | the folded line limit is not applied (the reader keeps everything) | 4 | limit (256 KiB); limit (raw readings) |
| M32 | a throw of the reader is not caught | 1 | limit (throw) |
| M33 | template state does not cross lines (a template ends at the end of its line) | 3 | reader (state); table 1 (spellings); table 2 (no false finding) |
| M34 | the ${} depth of a hole is not counted | 1 | table 1 (spellings) |
| M35 | a regex with no closer is retried on every later slash (no "no second try") | 1 | time (not finished) |
| M36 | a file that ends inside a block comment is not reported | 1 | reader (block comment) |
| M37 | the unterminated quote does not stop the line (it is read as a plain character) | 1 | (did not finish in 400 s) |
| M38 | the shell escape \' outside quotes opens a literal (echo don\'t) | 1 | table 1 (spellings) |
| M39 | the shell word's code prefix (P=) is part of the literal | 1 | table 1 (spellings) |
| M40 | the tail of the bare word is the whole rest of the literal (a call a space away makes a pattern) | 1 | table 1 (spellings) |
| M41 | a line the FOLDED classifier called broad also reads the bare word and the piece (two classes for one cause) | 1 | table 1 (spellings) |
| M43 | the unquoted pieces of a shell word are not part of its literal | 2 | reader (fold rows); table 1 (spellings) |
| M49 | a regex is not recognised at a line's start | 1 | table 1 (spellings) |
| M50 | a regex is not recognised after return, typeof, case | 1 | table 1 (spellings) |
| M51 | a regex is not recognised after => | 1 | table 1 (spellings) |

### 7.3 Step counts (D5 item 4)

A step counter on the reader (`foldFile(lines, extension, { meter })`), not a wall clock. Each line is one hostile line of the size named. The counts are exactly linear (a doubling doubles them); the test asserts a ratio of at most 2.3 per
doubling and at most 24 steps per byte.

| kind | line | 1 MB | 2 MB | 4 MB | 8 MB | steps per byte at the last size |
|---|---|---|---|---|---|---|
| .mjs | `\'` | 1048577 | 2097153 | 4194305 | 8388609 | 1.00 |
| .mjs | `\"` | 1048577 | 2097153 | 4194305 | 8388609 | 1.00 |
| .mjs | `'a',` | 1310720 | 2621440 | 5242880 | 10485760 | 1.25 |
| .mjs | `x = 'a' + spaces` | 2097160 | 4194312 | 8388616 | 16777224 | 2.00 |
| .mjs | `'a' + 61 spaces, repeated` | 2064384 | 4128768 | 8257536 | 16515072 | 1.97 |
| .mjs | `'a' + , repeated` | 699054 | 1398109 | 2796206 | 5592413 | 0.67 |
| .mjs | ``" repeated` | 1398102 | 2796203 | 5592406 | 11184811 | 1.33 |
| .mjs | `= /[ repeated` | 2097149 | 4194301 | 8388605 | 16777213 | 2.00 |
| .mjs | `the word, repeated` | 1048576 | 2097152 | 4194304 | 8388608 | 1.00 |
| .mjs | `[ 'a', ... never closes` | 1677728 | 3355450 | 6710892 | 13421779 | 1.60 |
| .mjs | `.concat( 'a', ... never closes` | 419441 | 838873 | 1677730 | 3355452 | 0.40 |
| .mjs | ``${' repeated` | 917504 | 1835008 | 3670016 | 7340032 | 0.88 |
| .mjs | `/* ' repeated (never closes)` | 1048577 | 2097153 | 4194305 | 8388609 | 1.00 |
| .sh | `\' repeated` | 1048577 | 2097153 | 4194305 | - | 1.00 |
| .sh | `"a" repeated (one word)` | 699052 | 1398103 | 2796204 | - | 0.67 |
| .sh | `x 'a' + spaces` | 1048585 | 2097161 | 4194313 | - | 1.00 |
| .sh | `echo ' repeated` | 1660244 | 3320485 | 6640980 | - | 1.58 |
| .ps1 | `'' repeated` | 1048577 | 2097153 | 4194305 | - | 1.00 |
| .ps1 | `'a', repeated` | 1835006 | 3670014 | 7340030 | - | 1.75 |
| .ps1 | `'a' + repeated` | 699054 | 1398109 | 2796206 | - | 0.67 |

32 MB, one run, "'a', = /[ \' " repeated: 69689967 steps (2.08 per byte), 1.6 s

The 32 MB run is the reader alone and keeps no memory for the line (the folded text stops being kept at 256 KiB). The classifier is not run on it. A folded line over 256 KiB is one `unreadable` finding:
`line <n> is <size> KiB: the folded reading stops at 256 KiB` (size rounded up; counted in UTF-16 code units). The raw readings are the release's, and a throw of the reader is one `unreadable` finding that names the file.

### 7.4 The real trees, against the guard at the release `bd795847`

Command, for each tree (`--repo` is a private copy of the commit, made with `git archive <commit>` and `git init`, so no checkout of any consumer was changed and no branch was switched; the default branches were fetched over HTTPS first):

    node <guard>/tools/leftovers-check.mjs --repo <tree> --profile node --token <token> --identity "<row>"

The release guard is `git archive bd795847` of this repository (a `git archive` rather than a worktree, so the shared repository's worktree list is untouched), with `node_modules` linked. The branch guard is `git archive` of `773d0d7`.
The comparison is by class, file and line, NEW and LOST. The two repositories without a token row (vscode_kit, wsl_care) were run with the token `conventions`; their token findings are the same under both guards and cancel.

| Tree | Commit | Release guard | Branch guard | NEW | LOST | Does its CI run the Node guard? |
|---|---|---|---|---|---|---|
| coai, default branch (`dew_flow_connect_other_ais`) | `09500f5f55a4fe9cde0849f6b5bc37713cbc5b53` | 62 legacy-name, 2 owner-blind, 259 raw-temp | same | 0 | 0 | no |
| coai, open branch `feat/test-leftovers-e5-producer` (`wt/coai-e5-producer`) | `b3bdd472a3c64af19b14de5399ef39aa7525701e` | 229 raw-temp | same | 0 | 0 | only `--baseline-shrinks` (`ci.yml:217`), which reads no text |
| creds, default branch | `8db22098f8cc66e1aeb9ea44ffce11d6aa93f551` | 5 docker-name, 2 docker-run, 2 legacy-name, 53 raw-temp | same | 0 | 0 | no |
| creds, open branch `feat/test-leftovers-e2.1` (`wt/creds-e21`) | `7e0a0480681fb56c39f33901f501cb8082284764` | 5 docker-name, 2 docker-run, 9 raw-temp | the same and **1 legacy-name** | 1 | 0 | no (`ci-extension.yml:221` runs its own TypeScript tests of the sites, not the guard) |
| benchmark | `e597c03e2cab4582a4a8905453608e4dc45f1ecf` | 46 legacy-name, 2 owner-blind, 131 raw-temp, 23 raw-worktree | same | 0 | 0 | no |
| rag_qln | `9852c1f09160490708d9bf6c51e629d6d8717c50` | 13 raw-temp | same | 0 | 0 | no |
| sidecar_rust | `8efee6f74fe2208a5f64959c1eb523ca87bc0540` | clean (23 files) | clean | 0 | 0 | no |
| vscode_kit | `f0ec3641e916a30f9abc2900ae828d89f6a91326` | 3 legacy-name, 20 raw-temp | same | 0 | 0 | no |
| mcp | `5ccfcfdeaa236c7baa629bf990380aff4267c7a0` | clean (87 files) | clean | 0 | 0 | no (its C# self-test runs; no Node guard) |
| amd_r9700 | `81051044aea8184075f0eb3916e2e6bc95c3c084` | clean (112 files) | clean | 0 | 0 | **yes**: `tests.yml:42`, `--profile node`; a new finding would be red at its pin bump: there is none |
| wsl_care | `6e0cbcca448fceb6f40fb6c2eddfabed01705e0d` | 4 legacy-name, 20 raw-temp | same | 0 | 0 | no |

**Every new finding, read.** One: creds `src_vs_code/src/test/leftoversSites.test.ts:91` (`const needle = 'testsTo' + 'Delete-agent-';`), class `legacy-name`. It is real: it is the line the plan names (`:74` in the older measure), it
builds the legacy name in two pieces so the file does not find itself, and it exists on creds' open branch only (the default branch has no such file). Its cure is in creds: it keeps the two pieces and adds the inline `legacy-name` exemption,
in a PR that merges before creds' pin bump (the plan's section *What changes in the consumers*, which already says this).

**Every lost finding, read.** None. No finding of the release guard is gone on any of the eleven trees.

**One shared line changed its text, not its class.** benchmark `spikes/lang-bench/test/exec-probe-stop.test.mjs:86` stays one `legacy-name`; the release names `testsToDelete-u`, the branch names that and `testsToDelete-u'` (the bare-word reading
of the same word inside a multi-line template that holds a child script). This line is the one that made the first build give an `owner-blind` finding on it: the tail of the word was the rest of the template line, which holds `process.getuid()`.
A reader defect, cured in the reader (the tail of the word is the run of characters that touch it, up to a space) and held by a row of table 1 (`a line of a child script in a multi-line template`).

**The two false findings of the first build on default branches stay gone.** coai's `kimiLinuxInstall.test.ts:18` (a quote in a comment) is not a finding: comments are removed by the scanner. benchmark `heldout-run.test.mjs:155,156` and coai's `ci.yml`
(an owner as `[uw]` before digits) are not findings either; each is a row of table 2.

### 7.5 What differs from the plan, stated as differences

1. D4 says of `const P = 'testsToDelete-'` then `names.filter(n => n.startsWith(P))` that it "stays `legacy-name`". The binding reading of the release already calls the second line `owner-blind`, and D4's first row keeps every raw reading, so the
   answer is line 1 `legacy-name` (the bare word) and line 2 `owner-blind` (as at the release). A row pins it.
2. D4 names "a `RegExp` over a joined prefix" among what the binding reading follows. The binding reading does not follow `new RegExp(\`^${P}\`)`, nor `new RegExp('^' + P)`, with a name bound on an earlier line (measured on the release's
   `classifyLines`); it follows `rmSync(P + x)`, `startsWith(P)`, and the `.sh` and `.ps1` sweeps over a bound name. A `RegExp` over a prefix joined on ONE line is `owner-blind` (the folded classifier). Rows pin both. The guard follows only what that reading follows.
3. D4 does not say how long "a tail" is. The tail of the word is the run of characters that touch it, up to a space (7.4, the one changed line).
4. D5 item 4 gives `line <n> is <size>: …` without a unit for `<size>`; it is written in KiB, rounded up.
5. `tools/lib/leftovers-fold.mjs` is one file, as D1 says, and is 937 lines, over the 800 of `common/coding-style.md`; `tools/leftovers-check.mjs` is 754 (D7: under 800).
6. Three existing tests judged a COPY of this repository's janitor in another tree and expected a clean result (`M-1`, `2. break-it`, and the header tests that read the first 6000 bytes of the guard). D6 gives a consumer no allowance, so a copy of
   the janitor now draws the folded readings' findings (lines 237 and 243); the two janitor tests now judge the allowlist on the inventory line only, and the new guard section sits after the header paragraphs those tests read.
7. `FOLDING_ALLOWANCES` is unchanged: the ten entries stand and each still needs its place (the test of D6 that a listed file draws a finding without its allowance is green for all ten).
8. The plan's D5 asks for the "release `bd795847`" in a throwaway worktree; a `git archive` of that commit was used (see 7.4).

### 7.6 What was not run

The comparison was not re-run immediately before a release (there is none yet); `npm run test:coverage`, the Windows leg and a macOS run were not run; no consumer's own CI was run; the PR, CodeRabbit and the independent review are the plan's next steps.
