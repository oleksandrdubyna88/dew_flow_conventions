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
