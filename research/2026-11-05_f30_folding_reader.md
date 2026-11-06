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

## 8. The review round (2026-11-05, after `f9c427a`)

Append-only: sections 1 to 7 stand. This section records what the gate and an independent Opus review found in `f9c427a`, what each finding became, and the numbers again for the guard at `a35b179`.

### 8.1 The reviews

The code gate on `f9c427a` ran with 4 of 8 reviewers and one finding was accepted (as the coordinator reported it; the gate's own record is not in this repository). An independent Opus review then ran on the same commit, with 78 hand
mutants of its own (`N01` to `N78`, plus `R` re-runs), fixtures for the ones that stayed green, a fuzz of the readers, and a run on the real trees. It found seven faults in the code, a set of green mutants, and four texts to correct.

| # | Finding | What it became | RED seen first | Commit |
|---|---|---|---|---|
| 1 | test 22b matched the spec reporter's line; Node 22 prints tap to a pipe | the child gets `--test-reporter=spec`, a timeout, and no reporter from `NODE_OPTIONS` | `NODE_OPTIONS=--test-reporter=tap`: `not ok` (first with the flag alone: the reporters and destinations must match, so the variable is removed from the child's environment too) | `b357eb7`, `0fea66e` |
| 2 | `looseVerdicts` ran its matcher regular expression on everything before each occurrence of the word: quadratic (2 MiB took 100 s through `scanText`); `verdicts.push(...hits)` overflows the stack at about 4 MiB | the matcher tokens are found once and one forward pass keeps the last token and the last cut; the spread is a loop; the same for `findings.push(...)` in three places of the guard | the differential and the by-hand rows failed (the function was not exported); the time test cut each of its six slow lines at 60 s (346 s in all); 300000 findings in one file gave `RangeError: Maximum call stack size exceeded` | `1eea11b` |
| 3 | `'testsToDelete-u*'` drew `legacy-name` and `owner-blind` (the release: `legacy-name` alone) | a pattern in the tail of a bare word is `owner-blind` only when the line has no legacy-name reading, raw or folded, exempted or not | six rows answered both classes, or `owner-blind` after an exemption | `eff7c77` |
| 4 | the `isComment` gate dropped the folded readings of `#p = …` (JavaScript), the code after `#>` (PowerShell) and a template's text that starts with `#` or `//` | the gate stays for the raw checks and the raw `owner-blind` verdict; the folded readings go through (the reader has already removed the comments) | five rows answered `[]` | `98cf389` |
| 5 | D2's joins missed a backtick as the first array item, spaces before the `(` of `.concat` and `.join`, spaces around the dot, and a literal in parentheses as a `.concat` argument, an array item or the separator | one helper (`readOperand`) and one (`methodOpen`); still forward-only | eight rows answered `[]` | `a2af7fd` |
| 6 | a block comment opened in a hole and never closed was no finding (only the bottom of the stack was looked at) | any comment on the stack, on the line where it opened; a file that ends inside a template stays no finding | `const a = `${ /* never closes` gave `[]` | `8dcaeaf` |
| 7 | `'CORP\alice'` decoded `\a` as a bell | the bell is in the shell `$'…'` table only | the reader row failed (a bell in the value) | `324d8b0` |
| 8 | 47 mutants of the review stayed green | one row each where a fixture existed (below) | each row run against its mutant | `dd53de7` |
| 9, 10 | the guard's header and the fold header over-promised ("nothing is re-tried"; the regex positions; what is not read; a backtick in JSX text); the rule's detail did not say the header lists what is not read | texts corrected | | `a35b179` |

### 8.2 The mutants again

Two lists were run, each hand edit in its own copy of the worktree, `tools/leftovers-check.test.mjs` run with `timeout`: the review's 86 (`N01` to `N78`, `R01` to `R51`, re-aimed where the code had moved) and my 45 of section 7.2 (`M01` to `M51`). The `F30 time` tests are
skipped in the main run (they take wall time) and run for the two mutants that make the reader quadratic (`M35`, `M37`: the time test does not finish in 150 s). **No mutant stays green except four that no test can see, each stated:**
`N46` (`++` and `+=` as joins: the operand after them is no literal, so nothing joins), `N67` (the oversize line keeps its literals: `finish()` returns none either way, memory only), `N70` (the text of an oversize line goes to the bindings: the entry's text is `""`
already, so only the cost differs) and `N72` (the decoded-code reading on any kind: a non-JavaScript line keeps no `code`). `N71` (an allowlisted line read as folded text) is seen by a new assertion on the janitor: the uses of the variables its inventory line assigns stay clean.
Rows were added for the others; the results:

| # | Mutant | Result |
|---|---|---|
| M01 | class decoding off in a literal: a one-character class [T] is left as written | red (1) |
| M02 | escape decoding off in a literal: \u, \u{}, \x are left as written | red (2) |
| M03 | the decoded-code reading off (decodeCode returns its input) | red (2) |
| M04 | the classifier on the FILE's folded lines off (folded verdicts = the raw verdicts) | red (1) |
| M05 | the classifier on folded text, but per line (no file bindings) | red (1) |
| M06 | comments are read as code (JavaScript: // and /* */) | red (6) |
| M07 | comments are read as code (shell and workflow: #) | red (2) |
| M08 | comments are read as code (PowerShell: # and <# #>) | red (3) |
| M09 | regex recognition off | red (2) |
| M10 | the bare word off | red (2) |
| M11 | the piece off | red (3) |
| M12 | the + join off (JavaScript) | red (9) |
| M13 | the .concat join off | red (2) |
| M14 | the array .join join off | red (3) |
| M15 | the ${'…'} hole join off | red (3) |
| M16 | the shell touching-pieces join off (a word ends at its first quoted piece) | red (3) |
| M17 | the PowerShell + join off | red (2) |
| M18 | the PowerShell -join off | red (2) |
| M19 | the allowlist ignored by the folded readings | red (5) |
| M20 | one line draws two classes for one cause (the bare word and the piece also read a line the classifier called broad) | red (1) |
| M21 | the allowance applied under a consumer | red (1) |
| M22 | legacyNameHits on the folded text off | red (7) |
| M23 | no finding of today is lost: the raw legacy-name reading replaced by the folded text | red (7) |
| M24 | the owner letter that a + continues is a bare word again | red (1) |
| M25 | prose is a bare word again | red (2) |
| M26 | the [uw] class is an owner with no digit form after it | red (2) |
| M27 | the label key .owner is a bare word | red (5) |
| M28 | a piece may touch a letter | red (2) |
| M29 | the piece rule reads any case | red (1) |
| M30 | the piece minimum is 5 | red (1) |
| M31 | the folded line limit is not applied (the reader keeps everything) | red (3) |
| M32 | a throw of the reader is not caught | red (2) |
| M33 | template state does not cross lines (a template ends at the end of its line) | red (4) |
| M34 | the ${} depth of a hole is not counted | red (1) |
| M35 | a regex with no closer is retried on every later slash (no second try) | red: the time test did not finish in 150 s |
| M36 | a file that ends inside a block comment is not reported | red (1) |
| M37 | the unterminated quote does not stop the line | red: the time test did not finish in 150 s |
| M38 | the shell escape \' outside quotes opens a literal (echo don\'t) | red (1) |
| M39 | the shell word's code prefix (P=) is part of the literal | red (1) |
| M40 | the tail of the bare word is the whole rest of the literal | red (2) |
| M41 | a line the FOLDED classifier called broad also reads the bare word and the piece (two classes for one cause) | red (1) |
| M43 | the unquoted pieces of a shell word are not part of its literal | red (2) |
| M49 | a regex is not recognised at a line's start | red (1) |
| M50 | a regex is not recognised after return, typeof, case | red (1) |
| M51 | a regex is not recognised after => | red (1) |
| N01 | N01 tail: ( not a pattern | red (1) |
| N02 | N02 tail: ? not a pattern | red (1) |
| N03 | N03 tail: backslash not a pattern | red (1) |
| N04 | N04 tail: [ not a pattern | red (2) |
| N05 | N05 prose: comma out | red (2) |
| N06 | N06 prose: colon out | red (1) |
| N07 | N07 prose: ) out | red (2) |
| N08 | N08 prose: no space needed before | red (1) |
| N09 | N09 boundary: a digit is no boundary breaker | red (1) |
| N10 | N10 label key: no lookahead | red (1) |
| N11 | N11 digit form: \d out | red (2) |
| N12 | N12 digit form: [0-9] out | red (2) |
| N13 | N13 class owner: [-_] separator out | red (1) |
| N14 | N14 piece minimum 7 | red (2) |
| N15 | N15 piece: upper form out | red (2) |
| N16 | N16 piece: lower form out | red (2) |
| N17 | N17 piece: whole word not excluded | red (14) |
| N18 | N18 piece: side digit counts as a letter | red (1) |
| N19 | N19 tail: rest not lower-cased | red (2) |
| N20 | N20 word: case kept | red (4) |
| N21 | N21 rest: not cut at next occurrence | red (1) |
| N22 | N22 regex after: ! out | red (1) |
| N23 | N23 regex after: & out | red (1) |
| N24 | N24 regex after: | out | red (1) |
| N25 | N25 regex after: ? out | red (1) |
| N26 | N26 regex after: { out | red (1) |
| N27 | N27 regex after: ; out | red (1) |
| N28 | N28 regex after: : out | red (1) |
| N29 | N29 regex after: [ out | red (1) |
| N30 | N30 regex after: , out | red (1) |
| N31 | N31 regex after: ( out | red (1) |
| N32 | N32 keyword: typeof out | red (1) |
| N33 | N33 keyword: case out | red (1) |
| N34 | N34 regex body: backslash not skipped | red (1) |
| N35 | N35 quoted: backslash not skipped | red (1) |
| N36 | N36 template body: backslash not skipped | red (1) |
| N37 | N37 hole: a // comment does not end the line | red (1) |
| N38 | hole: a block comment is not skipped | red (2) |
| N39 | hole: a block comment that opens does not cross lines | red (2) |
| N40 | N40 hole: no regex in a hole | red (1) |
| N41 | N41 hole's multi-line tail not written out | red (1) |
| N42 | N42 hole literal: a hole's escape is not decoded | red (1) |
| N43 | N43 concat: carry dropped | red (1) |
| N44 | N44 closers dropped from the text | red (1) |
| N45 | N45 plus: a ) before the + is not skipped | red (1) |
| N46 | N46 + op: ++ and += are joins | no test sees it: no test can see it: the operand after `+=` or `++` is no literal, so nothing joins (equivalent) |
| N47 | concat: a trailing comma not read | red (1) |
| N48 | N48 array: a trailing comma not read | red (1) |
| N49 | array: spaces before .join not skipped | red (1) |
| N50 | array: only a single-quoted first item starts an array join | red (2) |
| N51 | N51 decoded newline not flattened | red (1) |
| N52 | N52 sh: no ; delimiter | red (1) |
| N53 | N53 sh: no ( ) delimiter | red (1) |
| N54 | N54 sh: no | & delimiter | red (1) |
| N55 | N55 sh: no tab delimiter | red (1) |
| N56 | sh: a dq escape not undone | red (1) |
| N57 | N57 sh: an unterminated quote keeps reading (word as code) | red (1) |
| N58 | N58 ps: boundary always true | red (1) |
| N59 | ps: doubled quote not read | red (1) |
| N60 | N60 ps: backtick escape not read | red (1) |
| N61 | N61 ps: open block comment is no finding | red (1) |
| N62 | N62 ps: -join case kept | red (1) |
| N63 | N63 ps: separator ignored | red (1) |
| N64 | N64 js: array separator ignored | red (2) |
| N65 | N65 limit 300 KiB | red (1) |
| N66 | N66 limit 200 KiB | red (1) |
| N67 | oversize keeps literals | no test sees it: memory only: `finish()` returns no literals for an oversize line either way (equivalent in output) |
| N68 | N68 decode: lone class with a dash is read | red (1) |
| N69 | N69 guard: thrown text not cleaned | red (1) |
| N70 | guard: oversize line's text goes to the bindings | no test sees it: cost only: the text of an oversize line is "" in the entry, so the guard's answer is the same; the raw line would only be classified twice |
| N71 | N71 guard: allowlisted line reads folded text | red (1) |
| N72 | N72 guard: decoded-code reading ignores file kind | no test sees it: equivalent: a line of a non-JavaScript kind keeps no `code`, so the decoded-code reading has nothing to decode |
| N73 | guard: fold findings not reported | red (5) |
| N74 | N74 guard: own root check says yes for any repo | red (1) |
| N75 | N75 guard: own root check says no | red (3) |
| N76 | guard: bare blind off | red (1) |
| N77 | N77 guard: bare legacy off when piece on | red (2) |
| N78 | N78 guard: manifests folded off | red (1) |
| R01 | R01 M01 again: class in a literal off | red (1) |
| R20 | R20 M20 again: a raw-broad line reads the bare word | red (1) |
| R24 | R24 M24 again: owner letter | red (1) |
| R34 | R34 M34 again: hole depth | red (1) |
| R40 | tail is the whole rest | red (2) |
| R41 | R41 M41 again: folded-broad line reads the bare word | red (1) |
| R50 | R50 plusFollows and letter off together | red (1) |
| R51 | unreadable: a template at EOF is a finding (control; must be red) | red (1) |

### 8.3 The classifier, before and after

Before (the release's regular expression, through `scanText`, one line of `x = ` and the word repeated): 32 KiB 0.04 s, 64 KiB 0.11 s, 128 KiB 0.41 s (four times per doubling; 2 MiB took about 100 s). After, at 1, 2, 4, 8 and 16 MiB (seconds, wall, lowered priority):

    word    1024K:0.19s  2048K:0.31s  4096K:0.63s  8192K:1.30s  16384K:2.28s
    rm      1024K:0.13s  2048K:0.24s  4096K:0.66s  8192K:1.20s  16384K:2.45s
    grep    1024K:0.16s  2048K:0.29s  4096K:0.67s  8192K:1.19s  16384K:2.93s
    pipe    1024K:0.11s  2048K:0.27s  4096K:0.59s  8192K:1.11s  16384K:2.18s
    glob    1024K:0.12s  2048K:0.19s  4096K:0.43s  8192K:1.00s  16384K:1.94s
    quoted  1024K:0.10s  2048K:0.23s  4096K:0.57s  8192K:0.93s  16384K:2.08s
    slash   1024K:0.11s  2048K:0.24s  4096K:0.55s  8192K:1.11s  16384K:2.31s
    esc1    1024K:0.13s  2048K:0.26s  4096K:0.53s  8192K:0.99s  16384K:1.72s
    esc2    1024K:0.10s  2048K:0.19s  4096K:0.39s  8192K:0.86s  16384K:1.98s
    lit     1024K:0.13s  2048K:0.25s  4096K:0.47s  8192K:1.13s  16384K:2.25s
    sp      1024K:0.09s  2048K:0.19s  4096K:0.38s  8192K:0.97s  16384K:1.85s
    tick    1024K:0.14s  2048K:0.23s  4096K:0.57s  8192K:1.20s  16384K:2.37s
    rx      1024K:0.14s  2048K:0.34s  4096K:0.67s  8192K:1.39s  16384K:3.10s

Every unit is linear. The differential test keeps the old regular expression as its oracle over every line of up to four pieces (12 pieces: the word, a longer word, `.owner`, `-`, `grep `, `-name `, `.test(`, a token that holds the word, `|`, `;`, a space, `a`) and 30000
random lines of up to 14 of 37 pieces: the same answers. I found while checking that the one forward-pass patch in the brief (cut each stretch at the last `|` or `;`, starting at the previous occurrence) misreads a token that holds the word (measured: `re.x<word>( <word>-` gives `[]` with the patch and `["broad"]` with the release) (`re.x<word>(`, whose `\w+` can contain it);
the form built keeps the token ends of the whole line, so no token straddles a start.

**Other super-linear paths of a raw line, found and not fixed:** `composeEnvHits` (`tools/lib/leftovers-shell.mjs`) is worse than quadratic on a line that repeats `COMPOSE_PROJECT_NAME=x `: 32 KiB 0.44 s, 64 KiB 1.7 s, 128 KiB 8.2 s, 256 KiB 42 s. It is the release's code, untouched by this branch. Every other raw
reading I tried was linear at 256 KiB (assignments of the word in `.sh` and `.mjs`, uses of a bound name, `.owner`, owner-form names, `mkdtemp(`, `docker run --name`, `-p`, `--project-name`, `volume create`, `docker build -t`, `DROP TABLE`, `WithName(`, quoted and double-quoted words, `$(…)`).

### 8.4 Step counts again

The reader's own step counter, as in section 7.3, with four new forms of D2's joins (the parentheses and spaces):

| kind | line | 1 MB | 2 MB | 4 MB | 8 MB | steps per byte at the last size |
|---|---|---|---|---|---|---|
| .mjs | `\'` | 1048577 | 2097153 | 4194305 | 8388609 | 1.00 |
| .mjs | `\"` | 1048577 | 2097153 | 4194305 | 8388609 | 1.00 |
| .mjs | `'a',` | 1310720 | 2621440 | 5242880 | 10485760 | 1.25 |
| .mjs | `x = 'a' + spaces` | 2097160 | 4194312 | 8388616 | 16777224 | 2.00 |
| .mjs | `'a' + 61 spaces, repeated` | 2064384 | 4128768 | 8257536 | 16515072 | 1.97 |
| .mjs | `'a' + , repeated` | 873816 | 1747634 | 3495256 | 6990514 | 0.83 |
| .mjs | ``" repeated` | 1398102 | 2796203 | 5592406 | 11184811 | 1.33 |
| .mjs | `= /[ repeated` | 2097149 | 4194301 | 8388605 | 16777213 | 2.00 |
| .mjs | `the word, repeated` | 1048576 | 2097152 | 4194304 | 8388608 | 1.00 |
| .mjs | `'a' + (( repeated (parentheses never close)` | 1966078 | 3932158 | 7864318 | 15728638 | 1.87 |
| .mjs | `[('a'), ( repeated` | 1747628 | 3495253 | 6990507 | 13981014 | 1.67 |
| .mjs | `'a' . concat ( ('a') repeated` | 449394 | 898786 | 1797571 | 3595126 | 0.43 |
| .mjs | `x = [ and many ( ` | 1048581 | 2097157 | 4194309 | 8388613 | 1.00 |
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
| .ps1 | `'a' + repeated` | 873816 | 1747634 | 3495256 | - | 0.83 |
32 MB, one run, "'a', = /[ \' " repeated: 69689967 steps (2.08 per byte), 1.8 s

### 8.5 The whole-file shape, a limit

`const P0 = 'testsTo' + 'Delete-';` and then `const P<i+1> = P<i>;` for `i` up to 16000 lines takes 70 s on the branch and 0.12 s at the release (the release does not bind the split name at all). The same chain written with the whole word (`P0 = 'testsToDelete-'`)
takes 40 s at the release (2000 lines 0.45 s, 4000 lines 1.6 s, 8000 lines 6.7 s, 16000 lines 40 s) and about the same on the branch: **the cost is `classifyLines` (`prefix-bindings.mjs`), super-linear in a chain of assignments, as it was at the release; the folded reading now binds a split
name the way it binds a whole one, so the same chain costs the same.** The Opus review measured 30.8 s on its machine. After fix 2 the cost is the same (the fix does not touch bindings). It is not a real shape, D5 speaks of a line, and it is stated as a limit; nothing in this
plan changes `prefix-bindings.mjs`.

### 8.6 The real trees again

The same command as section 7.4, each default branch fetched over HTTPS first (only coai's `origin/main` had moved since section 7.4, to `d21fd807`; the two open branches have not moved: `git fetch` of their branches gives the same commits), the release guard `git archive bd795847` and the final guard `git archive a35b179`.

| Tree | Commit | Release `bd795847` | Final guard | NEW | LOST | Does its CI run the Node guard? |
|---|---|---|---|---|---|---|
| coai, default branch | `d21fd80728d5e3ba22950840790f2c1de62a2a32` | 62 legacy-name, 2 owner-blind, 259 raw-temp | same | 0 | 0 | no |
| coai, `feat/test-leftovers-e5-producer` | `b3bdd472a3c64af19b14de5399ef39aa7525701e` | 229 raw-temp | same | 0 | 0 | only `--baseline-shrinks` |
| creds, default branch | `8db22098f8cc66e1aeb9ea44ffce11d6aa93f551` | 5 docker-name, 2 docker-run, 2 legacy-name, 53 raw-temp | same | 0 | 0 | no |
| creds, `feat/test-leftovers-e2.1` | `7e0a0480681fb56c39f33901f501cb8082284764` | 5 docker-name, 2 docker-run, 9 raw-temp | and **1 legacy-name** | 1 | 0 | no |
| benchmark | `e597c03e2cab4582a4a8905453608e4dc45f1ecf` | 46 legacy-name, 2 owner-blind, 131 raw-temp, 23 raw-worktree | same | 0 | 0 | no |
| rag_qln | `9852c1f09160490708d9bf6c51e629d6d8717c50` | 13 raw-temp | same | 0 | 0 | no |
| sidecar_rust | `8efee6f74fe2208a5f64959c1eb523ca87bc0540` | clean (23 files) | clean | 0 | 0 | no |
| vscode_kit | `f0ec3641e916a30f9abc2900ae828d89f6a91326` | 3 legacy-name, 20 raw-temp | same | 0 | 0 | no |
| mcp | `5ccfcfdeaa236c7baa629bf990380aff4267c7a0` | clean (87 files) | clean | 0 | 0 | no |
| amd_r9700 | `81051044aea8184075f0eb3916e2e6bc95c3c084` | clean (112 files) | clean | 0 | 0 | **yes**, `tests.yml:42` |
| wsl_care | `6e0cbcca448fceb6f40fb6c2eddfabed01705e0d` | 4 legacy-name, 20 raw-temp | same | 0 | 0 | no |

By class, file and line: the one NEW finding is the one of section 7.4 (creds `src_vs_code/src/test/leftoversSites.test.ts:91`, real, cured in creds by the inline exemption before its pin bump); LOST none. **Fix 4 (the comment gate) adds no finding on any tree.** The one shared line whose text changed is benchmark
`exec-probe-stop.test.mjs:86` (a second hit name inside the same `legacy-name`), as in section 7.4.

### 8.7 Tests, and what differs from the review's brief

The whole suite, as the repository runs it (`node tools/run-tests.mjs`, lowered priority, a private empty `TMPDIR`): **1595 tests, 1587 pass, 0 fail, 8 skipped**; `TMPDIR` is empty after the run. `plan-lifecycle`, `rule-bodies` and `npm run check` are clean.

Differences from the brief: (1) the one-pass patch for the classifier was not used as written (it cuts at the previous occurrence, which misreads a token that holds the word); the form built is in 8.3. (2) The review's whole-file shape took 70 s here and 0.12 s at the release only for a SPLIT first name; with the whole
word the release is as slow (8.5). (3) A crash the brief did not name was found and fixed with fix 2: 300000 findings in one file overflowed the stack in `scanTexts`. (4) `composeEnvHits` is super-linear and is reported, not fixed (8.3). (5) Fix 1 needed one more step than the brief says: the child must also lose
a reporter set in `NODE_OPTIONS`. (6) `tools/leftovers-check.mjs` is 761 lines (under D7's 800); `tools/lib/leftovers-fold.mjs` grew to 963 lines (it was 937); it is not split (the brief).

### 8.8 The compose reading (found by 8.3, fixed after the review round, 2026-11-06)

Section 8.3 reported `composeEnvHits` as super-linear and left it. The plan's Goal says a hostile line ends in linear time or as a named finding, so it is fixed, RED first. Before, each of six shapes of a repeated `COMPOSE_PROJECT_NAME=` at 2 MiB through `scanText` was cut at 60 s (the assignment, an open `$(`, an open `${`, an open quote, one long word, a bound name). There were two causes: `literalizeSingleQuoted` ran on the whole line once per assignment, and `maskExpansions` asked `closingOf` once per opener, which scans to the end when the opener never closes.

- `composeEnvHits` reads the line once. It reads the first 64 assignments of one line; **a line with more is one more `docker-name` hit that says so**, so it is never a silent clean line. A value in a hit's text is cut at 200 characters, in the text only; the test for the name still reads all of it.
- `closersOf` finds every opener's closer in one pass. A test compares it with `closingOf` over every line of up to 5 of 8 pieces and 5000 random longer ones.
- After: the shape with `$(` at 256 KiB, 512 KiB, 1 MiB and 2 MiB took 112, 255, 459 and 945 ms (at 256 KiB it took 2861 ms before `closersOf`). `docker run --name x`, `docker run $(`, `docker compose -p x`, `-p $(` and `docker run -v ${`, each at 1 MiB: 208 to 264 ms.

**The 65th assignment on a line is a difference from the release**: such a line gets a new hit or loses a later value's hit, on the line's existing class. No real tree holds it; the record of the real trees is the proof, and it is re-run before the release.

## 9. Epoch 3 — the build of the re-review's table (2026-11-06, `feat/f30-folding-reader`)

Append-only. Sections 1 to 8 stand as written; this section says what the build of the epoch 3 table did and what it changes in how they read. The coder was Sonnet 5.5. Epoch 3 used 0 of its accepted changes: no fix below made a sentence of the plan false. One reading is chosen where the plan has two (9.3, relation P).

### 9.1 What the build did, by row of the table

| Row | Commit | What |
|---|---|---|
| D1 split | `d5c440c` | moves only: `foldSh` and `foldPs` with their helpers to `tools/lib/leftovers-fold-shell.mjs`; `chain` takes its literal reader as an argument; tests green before and after (106 of 106). The cycle is safe: the two scanners are function declarations and nothing is read at load. |
| `leftovers-shell.mjs` back | `8ab8dd6` | checked out from `284203b`; `git diff bd795847 -- tools/lib/leftovers-shell.mjs` is empty. The compose time test, the compose cap test, the `closersOf` differential, `COMPOSE_UNITS`, `P_OWNER_FORM` and the import only they used are gone. Section 8.8 stays. |
| the reader | `c0c9cd1` | one no-regex flag per line (`ctx.noRegex`, reset at each line, shared by the code and every hole); every helper counts (`skipSpaces` takes the context) and a failed `.sh` word counts the line; a file that ends inside a template or a block comment, at any depth, is one `unreadable` finding on the line where the outermost state opened; `CURES.unreadable` names the template case and `\x60`. |
| a call is not a parenthesis | `08d5084` | `groupParens` counts the `(` right before the literal and takes the outermost off when a `)`, `]` or a non-keyword identifier stands before it (a keyword: `return`, `typeof`, `case`, `await`, and others); `chain` lets a closer between operands cross only these. |
| `.ps1` joins | `08d5084` | the list reads each item and the separator through `readOperand`, closes only its own groups, and takes `-join` with no space at either side. |
| comment gate, occurrence rule | `f6a42c1` | the reader answers `start` (`code`, `template`, `comment`) per line; the guard reads the folded lines always; a comment-like line is empty in the folded input unless it is a JavaScript `#` line in code state or a `.ps1` line after `#>` with code; the `changed` shortcut, the `entry.text !== lines[index]` gate and `legacyRead` are gone; `bareWordHits` takes `legacyAt` and drops a pattern tail only where `legacyNameHits` reads that occurrence. |
| tests the table names | `f6a42c1`, `167ecd7`, `a868c9d`, `2766c04` | the 2 MiB wall-clock test on a raw line removed; the 300000-findings test renamed (`F30 crash:`); `looseVerdicts`, its oracle and its count kept, the count now exact (52,621); D5 item 5's interaction table; item 6's reason as a comment; rows for the mutants that stayed green. |
| texts | `71fd7b8`, `a3b057a` | see 9.7. |

### 9.2 RED and GREEN, for each fix

RED is the new test against the code before the fix, in a scratch copy of the previous commit; GREEN is the worktree. Every number below was read from a run.

| Fix | RED (before) | GREEN (after) |
|---|---|---|
| one flag per line | the shape backtick + `${/[}` repeated: 8 KiB 6,716,621 steps, 16 KiB 26,855,015, 32 KiB 107,397,120, 64 KiB 429,542,607 (four times per doubling; 1 MiB would take about 1e11) | 8 KiB 14,743; 1 MiB 1,887,436; 8 MiB 15,099,492 (about 1.8 per byte) |
| a failed word counts | `echo '` + 64 KiB of `a` and the same at 128 KiB: 7 steps | 65,544 and 131,080 steps |
| a template at a file's end | `const b = `never closed` is clean (`[]`) | `["2:unreadable"]` on the line where the template opened; nested, in a hole, after a closed template on the same line: seven rows, each one finding on the outermost line |
| a call is not a parenthesis | 13 rows of the spellings table wrong: `f('testsTo') + 'Delete-*'`, `x.f(`, `x[0](`, `f(1, `, `f((`, `.concat` answered `owner-blind` (joined) where the answer is `legacy-name`; the `.ps1` forms `('tests','To','Delete-x') -join ('')`, `('tests',('To'),'Delete-x') -join ''`, `…)-join''`, `('tests'),('To'),('Delete-x') -join ''` (two rows) answered `[]` | all rows as the table states; the reader rows (`f('tests') + 'ToDelete-x'`, with the call's `tests` apart) |
| the comment gate | 19 rows wrong, among them: template text lines `# rm -rf W-*`, `// rm -rf W-*`, `-- drop W-*` drew `owner-blind`; `-- drop W-*` in `.sh` and in a workflow run block drew `owner-blind`; a `-- P=…` line bound a prefix; `  #p = 'W-agent-1'` and `#r = /^W[-_]/` in a class drew nothing without a comment elsewhere (and the finding came back with `const z = 1; // far`) | all as stated; the answer no longer depends on a far line |
| the occurrence rule | `const a = 'testsTo'; const b = 'W[-_]';` and `'W-old W[-_]'`, both orders, answered one class; with a `legacy-name` exemption they answered `[]` | both classes; the exemption clears the first and leaves `owner-blind`; `'W-u*'` is `legacy-name` alone and its exemption clears it; `rmSync('W-u*')` draws both, as at the release |
| the interaction table | 135 answers differed in its relations F, P and E (at `08d5084`); W held | all four relations hold over 7 causes in 3 languages and over the spelling rows |

### 9.3 The interaction table (D5 item 5) and the one reading chosen

The table is `F30 interactions (W)`, `(F)`, `(P)`, `(E)` in `tools/leftovers-check.test.mjs`: seven causes (a name, a pattern tail, an owner letter and a star, half of the word, the bare word, an owner-form name, a glob in a removal), each whole and split, in JavaScript, `.sh` and `.ps1`. Relation F also runs over every spelling row of the file (a comment line and a trailing comment elsewhere, the list shifted by one), with one exception named in the test: the raw binding from a comment. Relation E runs over every one-line JavaScript row. All four hold.

**One reading is chosen, and it is stated here and in the test.** D5 item 5 says two occurrences give "the union of each alone, except a line the classifier calls broad, which stays `owner-blind`, and the release's own raw hits". Read to the letter, a *split* name next to a glob in a removal (`'tests' + 'To' + 'Delete-x'; fs.rmSync('tests' + 'To' + 'Delete-*')`) should draw `owner-blind` only, but its whole spelling draws `legacy-name` from the release's raw reading, and the plan also says "split equals whole on a code line" and D4 gives `legacyNameHits` on the folded text no broad exception. The two cannot both hold for that row. The code keeps the second pair of sentences (W true): on a broad line the bare word and the piece read nothing, and a name that `legacyNameHits` reads stays, split or whole. The test's expected answer for a broad pair is `owner-blind` plus the `legacy-name` that the release's raw reading gives the whole spelling. If the plan means the first reading, the row is a ledger question for the plan's owner, and the change is one line (`legacy` dropped in `foldedReadings` where the raw verdict is `broad`).

### 9.4 The mutants

51 hand mutants of the epoch 3 code, each in its own copy of a commit, the whole `tools/leftovers-check.test.mjs` run with `timeout` and a private empty `TMPDIR` (the list is in `mutants.mjs` of the coder's scratch folder; its names are below). First run on `a868c9d`: 41 red, 10 green. Rows were added for three of the green ones (C05, C10, C12) and the three were run again on `2766c04`: red.

- Red by a test: R01 and R03 (flag per hole, flag never set) by timeout of the hostile-line test (240 s), R02 (flag not reset per line), R04 to R07, R09; C01 to C04, C06 to C09, C11 (= **P18**, a closer not required in `readOperand`), C14 to C20; C05, C10 and C12 only after their rows; G01, G02, G04, G05, G07 to G13 (G08 = **P31**, ungated verdicts passed to `foldedReadings`; G13 = **N71**, an allowlisted line read as folded text; G15 = **N78**, manifests folded off); O01, O02, O05, O06, O07.
- Green, and why no row can see them (7): **R08** `skipSpaces` not counting (the main loop counts the same characters); **C13** `.ps1` `groupParens` called as JavaScript (it would differ only for `cmd ('a') + 'b'`, where PowerShell command mode passes three arguments and the code joins, as the release did; no row pins a doubtful reading); **G03** a `.ps1` comment-like line read in any state (the scanner removes a `#` comment in code state, so its text is empty); **G06** an unread comment-like line keeps its folded text in the input (`classifyLines` binds from no `-- ` or template text line whose folded text differs from the raw one); **G14** = **N70**, the oversize line's raw text goes to the bindings (cost only: the line is not read either way); **O03** and **O04** the owner grammar and the marker words ignored in `legacyReadsOccurrence` (the cases return earlier in `bareWordHits`: `'W-exempt*'`, `'W-quarantine*'`, `'W-u1*'` draw nothing).
- **P13 and P14** (the compose default not cut, the compose value not restored) target the compose cap, which D8 removed with `leftovers-shell.mjs`. No code, no row.

### 9.5 Step counts (D5 item 4)

Through `foldFile` with a meter; one reader, no clock. Steps at 1, 2, 4 and 8 MB (`.sh` and `.ps1` at 1, 2 and 4); the largest steps per byte is the last column. The doubling never exceeds 2.0 times and the cap is 24 per byte.

| Line | 1 MB | 2 MB | 4 MB | 8 MB | max per byte |
|---|---|---|---|---|---|
| a template of `${/[}` holes (the review's shape) | 1,887,436 | 3,774,871 | 7,549,745 | 15,099,492 | 1.80 |
| holes of `${/[}`, each in a template of its own | 2,246,943 | 4,493,893 | 8,987,791 | 17,975,583 | 2.14 |
| a regex with no closer in code, then such holes | 2,246,964 | 4,493,914 | 8,987,812 | 17,975,604 | 2.14 |
| spaces after a literal | 4,194,314 | 8,388,618 | 16,777,226 | 33,554,442 | 4.00 |
| a literal, spaces, a literal | 5,078,979 | 10,158,019 | 20,316,099 | 40,632,259 | 4.84 |
| a plus and parentheses that never close | 3,014,650 | 6,029,306 | 12,058,618 | 24,117,242 | 2.87 |
| spaced opens and closers around a literal | 3,670,028 | 7,340,044 | 14,680,076 | 29,360,140 | 3.50 |
| a literal and a long run of closers before a plus | 3,145,749 | 6,291,477 | 12,582,933 | 25,165,845 | 3.00 |
| `.ps1` items in parentheses that never join | 2,446,675 | 4,893,352 | 9,786,707 | | 2.33 |
| `.sh` a quote that never closes | 1,660,244 | 3,320,488 | 6,640,980 | | 1.58 |

All 34 lines of the test's list are in the run (`stepsall.out` of the coder's scratch folder); the table shows the largest and the new ones. The one 32 MB run (`'a', = /[ \' ` repeated, the reader alone): 72,271,079 steps, 2.15 per byte.

### 9.6 The classifier differential, and the real trees

- **A differential of the whole `classifyLine`, the release `bd795847` against this head, run by the coder:** the judge's script with the same 51 pieces and the same seed, 6,900,453 lines of up to four pieces and 2,500,000 random lines of 5 to 20 pieces: **9,400,453 lines, 0 differ.** The judge's own run, recorded in the plan, found the same count and no difference. Together with the durable oracle over 52,621 lines this is why D8 keeps `looseVerdicts`' forward pass.
- **Real trees**, the guard at `2766c04` against the release `bd795847`, by class, file and line, each consumer's `--token` and `--identity` the repository column of its row in `common/test-leftovers-detail.md` (vscode_kit and wsl_care hold no row and are run as `conventions`, "the shared-rules repository"; no `token` finding appears): coai `main` 96282699c7 324 and 324, coai E5 `b3bdd472a3` 229 and 229, creds `main` 7d5e1800be 64 and 64, **creds `7e0a048068` 16 and 17**, benchmark `e597c03e2c` 202 and 202, rag_qln `9852c1f091` 13 and 13, sidecar_rust `8efee6f74f` 0 and 0, vscode_kit `f0ec3641e9` 23 and 23, mcp `5ccfcfdeaa` 0 and 0, amd_r9700 `63a1be9a2d` 0 and 0, wsl_care `6e0cbcca44` 24 and 24. **New: exactly one, `legacy-name` at creds `src_vs_code/src/test/leftoversSites.test.ts:91`. Lost: none.** No file of any tree ends inside a template or a comment (no `unreadable` finding). The run of all eleven rows takes 44 s; coai `main` alone takes 1.37 s at the release and 2.01 s here (the folded lines are always read now).

### 9.7 What section 8 now reads differently, and the texts

- **8.8 (the compose reading).** Its code is gone: `composeEnvHits` and `maskExpansions` are the release's, the 65th assignment on a line is no longer a difference, and `closersOf` does not exist. The reason is D8: a fix to a raw reading stays only if it changes no answer, and the compose cap did (a 65th assignment, a cut value). The two time paths it measured (256 KiB 42 s and `docker run $(` 256 KiB 22 s) are F32's rows. What stays of section 8.3 is `looseVerdicts`' forward pass and the removed spreads, which the differential of 9.6 and the durable test of 52,621 lines hold to the release's answers. The sentence of 8.3's brief that "the classifier is linear" is true of that pass only; no text says a raw reading is linear.
- **8.4 and 8.5.** The step counts of 8.4 are for the reader and stand; the whole-file shape of 8.5 is a limit of the raw reading (D8), not a promise.
- **Entry 2.1 of the ledger is too wide, as the ledger's own note says.** It says a `RegExp` over a bound name is not followed. The measured reading follows it on a line that assigns nothing and with a template hole, as at the release; D4's corrected paragraph is what holds. Nothing in the code changed for this.
- **Texts.** The guard's header (D2's table with the call rule, `-join` spacing, the one flag, the comment gate, the occurrence rule, what is not joined, not read and not told from code, a template at a file's end as `unreadable`), the fold header, `README.md`, `research/README.md`, `todo/README.md`, F30's entry (its "Left for after the release" is removed: the split and the template finding are done) and a new row F32 in `todo/PLAN_test_leftovers_merged_core_followups.md` with D8's list and numbers. The rule detail's paragraph is replaced inside the 800 B headroom test of `tools/test-leftovers-rule.test.mjs` (the body is 31,965 of 31,968 allowed): **the brief said 691 B were free; that is the file cap, and the test is stricter, so the replacement may grow by 9 B only.**

### 9.8 Counts, differences from the brief, and what was not run

Lines: `tools/lib/leftovers-fold.mjs` 784, `tools/lib/leftovers-fold-shell.mjs` 265, `tools/leftovers-check.mjs` 789 (all under 800); `tools/leftovers-check.test.mjs` 1,852 (it was over 800 before this branch and is not named by D7).

Differences from the brief: (1) the detail's room is 9 B, not 691 B (9.7). (2) The relation P reading in 9.3. (3) P13 and P14 have no row (9.4). (4) The interaction table is in the existing test file, not a new one, because the guard's own scan excludes only two test files by name. (5) `skipSpaces` and `plusFollows` take the context to count; a signature change of the exported helpers. Not run: the independent review, the coai gate, the PR, a release, and the real-tree comparison "immediately before the release" (the plan asks for it then).

## 10. Epoch 3, the review's fixes (2026-11-06, `feat/f30-folding-reader`)

Append-only. Section 9 is not edited; its corrections are in 10.5. The coder was Sonnet 5.5. The gate's and the Opus review's findings reached the coder as a brief; this section records each finding as that brief stated it and what it became. Entry 3.1 of the ledger (the size box reads as D7 does) is the one accepted change of epoch 3; no fix below made a sentence of the plan false.

### 10.1 The code fixes, RED and GREEN

RED is the new rows against `dcf4070`, in a scratch copy; GREEN is the worktree at `2dc7c81`.

| Finding | RED | GREEN |
|---|---|---|
| D2, a call is not a parenthesis: a name after `.` or `?.` is a call whatever it is called, `?.(` is a call, `default` and `new` are keywords | 11 rows wrong: `map.delete(`, `Symbol.for(`, `Array.of(`, `p.catch(`, `it.return(`, `f?.(`, `x.f?.(` answered `owner-blind` (joined) for `legacy-name`; `export default (` and `new (` answered `legacy-name` for `owner-blind` | all eleven right; `groupParens` takes the member test before the keyword test |
| D2, regex positions: a template nested in a hole closes with `prev` and `start` unchanged | ``const t = `${`a` / 2 + `/`}`;`` and ``const t = `${`a` / 2 + "/" + `b`}`;`` each answered `1:unreadable` where line 2 is `2:legacy-name` | both `2:legacy-name`; the hole sets `prev = VALUE`, `start = false` when the nested template closes |
| D1, "uses the other only at call time": `FOLDERS` read `foldSh` and `foldPs` at load | no behavioural RED: both are function declarations, hoisted, so either import order worked | `FOLDERS` holds functions that return them; a test imports either file first in a child process |

### 10.2 Rows for the review's mutants

All run at `286a5a3` (the table of 10.4). The fixtures are the review's: O04 (`notAName` off) `const a = 'TESTSTODELETE_U*';` is `1:owner-blind`; G03 (`.ps1` comment-like line read in any state) ``-- 'tests' + 'To' + 'Delete-x'`` is `[]`; G06 (an unread line keeps its folded text) a ``# const P = 'tests\x54oDelete-';`` line inside a template, then `fs.rmSync(P + x);`, is `[]`; Q30 (a block comment's start read as code) `/* a` then ``# b */ const n = 'tests' + 'To' + 'Delete-x';`` is `[]`; Q13 and Q14 (`if` and `throw` out of the keywords) `throw ('testsTo') + 'Delete-*';` and `if (…)` are `1:owner-blind`; Q16 (spaces counted before a `.ps1` call) `$x = foo ('testsTo') + 'Delete-*'` is `1:owner-blind`. The `.ps1` row states its reading as a limit: PowerShell command mode would pass three arguments and the code joins.

**Q29, the lookahead flag.** The mutant that resets the no-regex flag when a join reads a template ahead (``'a'+`${/[}` `` repeated) took 3,058,970, 48,834,747 and 781,052,094 steps at 8, 32 and 128 KiB, and the four time tests stayed green because their sizes began at 1 MB, which a quadratic line never finishes. The hostile-line test now measures every shape at 32 and 128 KiB first (at most 24 steps per byte, and at most 4.5 times from 32 to 128 KiB) and does not run a failing shape larger; the shape is in the table. The mutant is red in that test within seconds. The step counts of the shape at the head, which are linear: 8 KiB 16,385; 32 KiB 65,531; 128 KiB 262,145; 1 MiB 2,097,144; 2 MiB 4,194,305; 4 MiB 8,388,602; 8 MiB 16,777,211 (2.00 per byte throughout).

**Q34 and Q35** (`groupParens` and `plusFollows` not counted) cannot be seen by a row: their characters are passed again by the main loop, so any line that makes them cost also makes the main loop count it. The test's title is corrected to what it proves: that the step counter counts a failed word, whose scan no later loop repeats.

### 10.3 Texts

The rule detail states the `legacy-name` case of a pattern tail (a pattern after the bare word is `owner-blind` unless `legacyNameHits` reads that occurrence), in 3 bytes of room, by shortening its other sentences (body 31,962 of 31,968 allowed); the hash is updated. The fold header says `.ps1` here-strings, `.sh` heredocs and a nested `"$(…)"` are not told from code, as D2 and the guard's header do. The comment of `foldReading` names the template; the shell file's header no longer says its code is moved whole; the README row of the plan says what is true now. The guard's header has the limit lines of D9: `f<T>(` and `f!(` read as groups; a division at a position the list names reads as a regex, so text after it can open a template and end `unreadable`, as can a string continued onto the next line that holds a backtick; `f /* c */ (`, a tagged template call and `function () {}(` read as groups; `.ps1` command mode joins; `(['a','b']).join('')` is not read; `'TestsTo'` is no form; `'word-word-u*'` is `legacy-name` alone.

### 10.4 The mutants of the round

15 hand mutants of the review's list and of the new code, each in a copy of `286a5a3`, the whole guard test file run with `timeout`. **Red:** O04 (as `O04b`), G03 (`G03b`), G06 (`G06b`), Q30, Q13, Q14, Q16, Q29, and N1 (a member name is no call), N2 (`?.(` is no call), N3 (`default` is a call), N4 (`new` is a call), N5 (a closed nested template keeps the old `prev`). **Green, then red after one row each:** N6 (the spaces between a dot and a name not skipped; row `map . delete (…)`), N7 (a spread counted as a member; row `[...await (…)`), both run again at `dfc0083`: red.

### 10.5 Corrections to section 9, without editing it

- Section 9's first paragraph says epoch 3 used 0 of its accepted changes. Entry 3.1 is now in the ledger, so epoch 3 used one, and the next accepted change is a full stop.
- Section 9.4 says seven green mutants cannot be seen by a row. O04, G03 and G06 can, and now are (10.2). R08, C13, G14 (= N70), O03 stay green: R08 and C13 and G14 for the reasons given, O03 because its cases return earlier in `bareWordHits`.
- Section 9.3 says the reading of the broad line would be a one-line change. That is false: the review applied the edit, and the split line still answers both classes, because its raw verdict is `null` (the raw readings skip a split spelling) and the broad verdict is the folded one, so an edit that drops `legacy` where the raw verdict is `broad` does not reach it. The reading stays as the coordinator ruled it, and D5 item 5's text says so.

### 10.6 The review's sound results

The brief records, as sound results of the review: 88,871 fuzz cases on the gate; 44,263 units on the reader's steps; 1,425,765 literals on O03; and the reader against the TypeScript parser over 3,800 files. These are the reviewer's numbers, taken from the brief and not rerun here.

### 10.7 The real trees again

The guard at `dfc0083` against the release `bd795847`, by the same script (tokens and identities as in 9.6): coai `main` ff2016cc44 324 and 324, coai E5 `b3bdd472a3` 229 and 229, creds `main` 7d5e1800be 64 and 64, **creds `7e0a048068` 16 and 17**, benchmark `e597c03e2c` 202 and 202, rag_qln `9852c1f091` 13 and 13, sidecar_rust 0 and 0, vscode_kit `f0ec3641e9` 23 and 23, mcp 0 and 0, amd_r9700 0 and 0, wsl_care `6e0cbcca44` 24 and 24. New: exactly one, `legacy-name` at creds `src_vs_code/src/test/leftoversSites.test.ts:91`. Lost: none. No `unreadable` finding. The machine was under heavy load from other work during this round (load average 25 to 40), which lengthened every run; no result depends on a clock.
