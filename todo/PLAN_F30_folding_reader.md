# PLAN — F30: the shipped Node guard reads a prefix in the spellings it lists

> Status: **epoch 3 open, released 2026-11-06: #135 merged at `acb693c`, the consumer fix merged first (creds #294, `834c91b`), and `release` promoted to `37b9aa5`. Eight of nine consumers pin it; coai's pin bump (#956) waits for coai's own release, and with it coai's re-run of the guard. The plan closes after that record.**
>
> Was: **epoch 3 open, 2026-11-06: the owner approved the narrowed plan after the second full stop; the build is on `feat/f30-folding-reader`; the fixes from its code gate and Opus review are in progress, then the PR, the consumer fix and one release.** The item is F30 of `todo/PLAN_test_leftovers_merged_core_followups.md`. Owner: this repository. Deadline 2026-11-19, or before creds' E2.5 merges if that is earlier. Not a prerequisite of coai's E5 producer PR.

## Plan changes

> Epoch 1 · approved 2026-11-05 · by reviewers · state: closed

- 1.1 · 2026-11-05 · agent · approach — D4's bare word and its gate do not hold on real trees; the reader reads the classifier's verdict with extras, and on every line with a quote
- 1.2 · 2026-11-05 · agent · scope — D2's lists are too narrow; .tsx, .jsx, any yaml, and .join over any literal were added
  (Both found by the Opus review of f5b3b16. The second change stopped the plan. The same review measured a false finding on coai main, quadratic regular expressions, and spellings still missed.)

### Re-review for epoch 2

Narrowed: yes — epoch 1 promised that a zero means zero on any one-line spelling, with the bare word and the piece as `owner-blind` (no exemption) in any case; the revision promises zero only for D2's listed spellings, makes the bare word and the piece `legacy-name` (an inline comment clears them), and reads the piece only in the word's three forms with no letter at its sides

| Work | Where | Verdict | Action |
|---|---|---|---|
| reader, guard wiring, tables, 3849640 | pushed, unmerged | cut | fix forward: the regular-expression reader is replaced by D1's scanner; the helpers, allowance list and table rows stand |
| three false-finding cures, 2adbe82 | pushed, unmerged | fits | keep the verdictAfter export and the rows; move the three rules into the scanner, tightened to D4 |
| documents and real-tree record, f5b3b16 | pushed, unmerged | cut | fix forward: correct every text that says owner-blind or any case; keep the research record and add a dated section |

> Epoch 2 · approved 2026-11-05 · by owner · state: closed

- 2.1 · 2026-11-05 · reviewer · contract — D4's statements about what the release's raw and binding readings do were not measured; a RegExp over a bound name and a use on an assigning line are not followed, and the owner letter before a + only shortens a finding's text
  (Found by the coder's measure and the independent Opus review of f9c427a. The plan's text now says what the reading does; the reading is not extended, as "What this does not do" says. This epoch has no change left: the next accepted one is a full stop.)
- 2.2 · 2026-11-06 · reviewer · dod, contract — the Goal's never a hang and D5's raw readings stay as at the release cannot both hold: ten more raw paths are super-linear, one cubic, and the classifier and compose fixes already changed raw code, the compose cap a raw answer
  (The independent Opus review of 16943a7. The agent had called the classifier and compose fixes no change; the compose cap's 65th assignment is a different answer, so that was wrong. This second change stopped the plan.)
- 2.3 · 2026-11-06 · reviewer · contract — D4's row says a bare word's pattern tail stays owner-blind; no finding lost and one class for one cause make 'testsToDelete-u*' legacy-name alone, so the row and three documents do not hold
  (Same review. An independent cause, so its own entry. The same review found entry 2.1's text too wide: a RegExp over a bound name is followed on a line that assigns nothing and with a template hole, as at the release. D4's corrected paragraph holds as measured.)

### Re-review for epoch 3

Narrowed: yes — epoch 2 promised that any hostile line ends in linear time or as a named finding, never a hang or a crash; the revision promises linear time for the reader alone and no time for a raw reading (D8: one comment line of 4 KiB takes 19 s), makes `'testsToDelete-u*'` `legacy-name` so a comment clears it where epoch 2's row said `owner-blind`, and D9 limits which review findings become code

| Work | Where | Verdict | Action |
|---|---|---|---|
| forward-only scanner, bare word, piece, guard wiring, rows and mutant rows: b384271, 773d0d7, 378bdb1 | pushed, unmerged | fits | keep; the parts that go are in the next row; fix forward for D1's split and D2's new rows |
| from b384271: the changed shortcut and the entry.text gate in foldedReadings; noRegex per hole; a closer before + crosses a call in chain; the assertion that a template is no finding | pushed, unmerged | cut | fix forward: read the folded lines always; one no-regex flag per line; a call is not a parenthesis; the template assertion becomes unreadable |
| test fixes outside D1 to D9: 46eba3b, b357eb7, 0fea66e | pushed, unmerged | fits | keep; the green suite needs them, and an empty TMPDIR is the leftovers rule |
| f9c427a: research section 7 | pushed, unmerged | fits | keep; append-only |
| f9c427a: README row, the rule's detail, research and todo READMEs, F30's entry, the rule-bodies hash | pushed, unmerged | cut | fix forward: correct what says a pattern tail is owner-blind with no legacy-name case, or says one file, under D7 |
| 1eea11b: forward pass, removed spreads, differential test, by-hand rows, the 300000-findings test | pushed, unmerged | fits | keep; rename the 300000 test, which is about a crash and not about time |
| 1eea11b: the 2 MiB wall-clock test on a raw line | pushed, unmerged | cut | remove it: it is a time promise against D8 |
| eff7c77: the eight rows | pushed, unmerged | fits | keep |
| eff7c77: line-level legacyRead in lineFindings | pushed, unmerged | cut | fix forward: D4's occurrence rule |
| 98cf389: folded readings on a JS hash line in code state and on .ps1 code after its closer; clean rows; first three new rows | pushed, unmerged | fits | keep |
| 98cf389: folded readings on every other comment-like line and its two template rows | pushed, unmerged | cut | fix forward: those lines are empty in the folded input; both rows become empty answers |
| joins, comment in a hole, the bell, review rows: a2af7fd, 8dcaeaf, 324d8b0, dd53de7 | pushed, unmerged | fits | keep; 8dcaeaf's check widens to any open state |
| a35b179: guard and fold headers, the rule's detail sentence, F30's entry, plan boxes | pushed, unmerged | cut | fix forward: correct what says a template at the end is no finding or a raw classifier is linear, and the two items deferred in F30's entry that this plan now does |
| 284203b: research section 8 | pushed, unmerged | fits | keep unchanged; add a dated section 9 for what section 8 now reads differently |
| 16943a7: leftovers-shell.mjs including closersOf; its three tests and the imports only they use | pushed, unmerged | cut | fix forward: restore the file from 284203b, byte-equal to the release; remove the tests; no plain revert, because that deletes section 8.8 |
| 16943a7: research section 8.8 | pushed, unmerged | fits | keep; section 9 says the code left and why |

> Epoch 3 · approved 2026-11-06 · by owner · state: open

- 3.1 · 2026-11-06 · agent · dod — the box no file over 800 lines is wider than D7, which names the three source files; the guard's test file was over before this branch, so the box reads as D7 does
  (Found by the coder. This epoch has no change left: the next accepted one is a full stop.)

## Goal

`tools/leftovers-check.mjs` finds a legacy name or an owner-blind pattern when a file builds the prefix on one line by a spelling in the table of D2. **It is a spelling check over text a person wrote in their own repository. It does not defend against a hostile author.** A repository's zero then means zero for the supported spellings, within the limits D2 names, and each document that says so names them. The exemption grammar does not change. The classes keep their names; `legacy-name` now also covers the bare word and the half word (D4).

**Done when:** every row of D5's first table is a finding of its stated class on its exact line; no line of a consumer's default branch gets a finding it did not have, except the lines listed under *What changes in the consumers*, and no finding the guard gives today is lost; the reader is linear on any line, a line over 256 KiB goes to no folded reading and is one named finding, and a throw in the reader is one named finding, never a crash or a clean result; **the raw readings' answers stay exactly as at the release, and their time is not promised (D8)**; one release is cut; the pin bumps follow, each alone. **Pinning is not activation: this plan records for each consumer whether its CI runs the Node guard yet.** Today one does: `dew_flow_amd_r9700_tuning_ai` runs the full guard with `--profile node` (its workflow, line 42), so a new finding there is red at its pin bump. coai's default branch has no guard step; its E5 branch adds `--baseline-shrinks`, which reads no text. The others switch the guard on in their own epics.

## What was measured (2026-11-05)

A literal-level search over every tracked `.mjs .cjs .js .ts .mts .cts .sh .ps1 .yml .yaml` file at coai `b3bdd472`, creds `41aca25c`, this repository `6d67ca4` and the local heads of benchmark, rag_qln, sidecar_rust, vscode_kit and mcp, without the mounted rules. A literal that holds the whole word is left out.

| Piece rule | coai | creds | conventions | benchmark | rag_qln | sidecar | kit | mcp |
|---|---|---|---|---|---|---|---|---|
| `sto` or `tod`, any case (**F30's text**) | 2386 | 2454 | 352 | 1069 | 135 | 6 | 152 | 4 |
| crossing pieces of 5 or more, any case (the C# template's rule) | 22 | 3 | 34 | 0 | 0 | 0 | 0 | 0 |
| crossing pieces of 6 or more, any case | 0 | 1 | 34 | 0 | 0 | 0 | 0 | 0 |
| crossing pieces of 5 or more, case kept | 0 | 1 | 20 | 0 | 0 | 0 | 0 | 0 |

A crossing piece is a substring of the word that is not wholly inside `tests` and not wholly inside `Delete`.

**So F30's text does not hold, and this plan replaces its piece rule.** `sto` and `tod` are in `restore`, `history`, `stop` and `todo/`. The C# rule hits `hostStopped` and `chatModelEdits`. **The rule here is crossing pieces of 6 or more, any case.** The conventions hits are this repository's own tools and their tests. The one creds hit is real: `src_vs_code/src/test/leftoversSites.test.ts:74`.

This measure reads literals by a rough regular expression. It is evidence for the choice of rule, and not the acceptance check: the acceptance check is D5.

**A second measure, 2026-11-05, replaces the case-free rule above.** A piece keeps the word's own form (camel, all lower or all upper), and neither side of it touches a letter. Of 27 ordinary words none is flagged: `toDelete`, `testStatus`, `testString`, `testStep`, `testStart`, `testStop`, `testStore`, `testStub`, `latestStable`, `latestStatus`, `latestStore`, `filesToDelete`, `snapshotsToDelete`, `autoDelete`, `doDelete`, `repoDelete`, `codelet`, `modelEtag`, `histoDelta`, `hostStopped`, `chatModelEdits`, `restore`, `history`, `todo/PLAN_x.md`, `snapshotsToPrune`, `tellClientsToCatchUp`, `filesToDeleted`. Of 13 real pieces none is missed: `testsTo`, `ToDelete`, `testsT`, `sToDel`, `oDelete`, `teststo`, `todelete`, `TESTSTO`, `TODELETE`, `testsTo-`, `ToDelete-*`, `stsToD`, `sToDelete`. The judge's count at this rule, for this repository, coai and creds: 34, 0, 1 by the rough method; 13, 0, 0 on joined literals with comments removed. All 13 are in this repository's own files. So creds' one hit is not a piece at this rule's reading: it is a joined whole word that `legacy-name` finds. At 5 with the same form rule the three trees give the same counts, so 6 is kept only because the word lists were measured at it. `TestsTo`, with a capital first letter, is not a form and is not read.

## Decisions

**D1. The fold file and one new file, each under the style maximum of 800 lines: `tools/lib/leftovers-fold.mjs` (the file reader, JavaScript and the literal readings) and `tools/lib/leftovers-fold-shell.mjs` (`.sh`, yaml and `.ps1`), split in the build's first commit, moves only, with the tests green: a forward-only scanner per file kind, not a set of regular expressions over the line.** The shell file imports the shared operand and output helpers from the fold file, and the fold file imports the two scanners; each side uses the other only at call time. It walks each file once and answers, for each line, the code with comments removed and the string literals as token spans, decoded and joined. The only second reading is the operand of a join that fails, once, and a line tries a failed regex once, in code and in every hole of that line, so the bound holds and an unterminated quote cannot make it quadratic. No marker character is put in the text, so a control byte in a line turns nothing off. A file that ends inside a block comment or inside a template, at any depth, is one `unreadable` finding on the line where the outermost open state opened: a backtick the reader did not recognise then ends in a name, and not in a silent clean file. `CURES.unreadable` names the cure, because `unreadable` takes no exemption: write the backtick as `\x60`, or move the regex. A template that a later backtick closes cannot be told from a real one, and that stays a stated limit (D2). It is a SPELLING reader: a name built from a variable, across lines or at run time is not seen, and the guard's text says so. Joins are read within one line. Only comment and template state cross lines, and a template tracks its `${}` depth: without that, `url(x/*.png)` in a multi-line template opens a false block comment and hides the code after it (the judge's measure: 339 false block-comment lines in coai, 57 in creds).

**D2. What it reads, by file kind. This table is the promise, and any document that states the guard's reach names it.**

| Kind | Comments removed | Literals | Joins | Decoding |
|---|---|---|---|---|
| `.mjs .cjs .js .ts .tsx .jsx .mts .cts` | `//`, `/* */` across lines | `'…'`, `"…"`, `` `…` ` with `${'a'}` holes that hold only a quoted literal; a regex literal is recognised so its quotes do not shift the pairs after it (a `/` after `( , = : [ ! & | ? { ; =>`, after `return`, `typeof` or `case`, or at the line's start; a `/` inside `[…]` does not close it; with no closer on the line it is division, and the line gets no second try, in code or in any hole of that line) | `+`; `.concat('a', 'b')`; `['a', 'b'].join(<literal>)`; each with spaces around its operators, and a literal in its own parentheses | `\uXXXX`, `\u{…}`, `\xXX`, a one-character class `[T]` |
| `.sh` | `#` at the start of a word | `'…'`, `"…"`, `$'…'` | a word's touching pieces, quoted or not: `testsTo"Delete-"`, `'a''b'` | in `$'…'`: `\xXX`, `\uXXXX`, octal |
| `.ps1` | `#`, `<# #>` across lines | `'…'`, `"…"` | `+`; binary `-join` over a literal array, with or without spaces at the operator; a literal in its own parentheses | none |
| `.yml .yaml` | `#` at the start of a word | read as `.sh` | as `.sh` | as `.sh` |

**A call is not a parenthesis:** `f('a') + 'b'` joins nothing, because the value of `f(…)` is not the literal.

**Not joined, and said in the documents:** a template nested in a hole (`${`x`}`), a literal in an expression hole (`${f('a')}`), unary `-join`, a comment between operands. A literal in these forms that holds a whole name or a piece is still a finding, so only a split into three or more pieces gives no finding. **Not read:** an unquoted `.sh` or yaml word with no quote in it (`echo testsToDelete`, `name: testsTo`), extensionless scripts, and every other kind (`.py`, `.bash`, `.cmd`). **Not told from code:** a line of a `.ps1` here-string or a `.sh` heredoc reads as an ordinary line of its kind, so a text line there can draw a finding and an apostrophe stops that line. In a nested `"$(…)"` the inner quotes close the outer ones, and what touches reads as one word. **A regex at a position the table does not name is not recognised:** after `)`, `else`, `+`, `%`, `throw`, `await` or `...`, its quote or backtick is read as an opener. **JSX text is not told from code:** `<p>don't</p>` stops that line's reading, and `<p>src/*.ts</p>` hides every line up to the next `*/`. In these cases the joins up to the next closer are silently not read; that text reads as a template's text, so a whole name or a piece there is a finding. A backtick or block comment that never closes is D1's `unreadable`; a quote that never closes ends that line's reading and is no finding. Of 3856 tracked files of these kinds on the nine default branches (1902 in the guard's scan), none ends in that state, and none of the 12,599 tracked files is `.tsx` or `.jsx`.

**D3. Which classes read the result: `legacy-name` and `owner-blind` only.** `raw-temp` reads the API call, as F30 says.

**D4. How they read it.**

| Reading | Runs on | Class |
|---|---|---|
| `legacyNameHits` and `classifyLines`, **as today** | the raw lines, trailing comments and a block comment's inner lines included; a line `isComment` calls a comment is skipped, as at the release | as today. **Comment removal applies to the folded readings only, so no finding of today is lost** |
| `legacyNameHits` | the folded text | `legacy-name` |
| `classifyLines` (a pattern, glob or removal, with the file's prefix bindings) | **the file's folded lines**, so a prefix built in pieces binds as a whole one does | `owner-blind`, no exemption |
| one extra classifier reading of the code with one-character classes and `\x`, `\u` escapes decoded, on JS lines | so `/^tests[T]oDelete[-_]/` reads as its plain form; this does not lex a regex | `owner-blind`, no exemption |
| the bare word: a literal holding the whole word, with a boundary each side, followed by neither the owner form nor an allowed word. **A tail that holds `[`, `(`, `?`, `*`, `\` or `.*` is a pattern, and is `owner-blind`, unless `legacyNameHits` reads that same occurrence of the word: `'testsToDelete-u*'` is `legacy-name` alone, at the release too, and its exemption clears it** | the joined literals | **`legacy-name`** |
| the piece: a joined literal that holds no whole word and holds a crossing piece of 6 or more in the word's own form, where neither side touches a letter | the joined literals | **`legacy-name`** |

**The bare word and the piece read only a line that no classifier reading (raw, folded or decoded) called broad:** the classifier answers per line and cannot name an occurrence, so coai's N8, which asserts exactly `['owner-blind']` for `for (const f of fs.globSync('testsToDelete-*')) rmSync(f, …)`, stays green. **On any other line each occurrence of the word, and each piece, is its own cause:** `const a = 'testsTo'; const b = 'testsToDelete[-_]';` and `'testsToDelete-old testsToDelete[-_]'` draw both classes, in either order, and a `legacy-name` exemption clears the first and leaves `owner-blind`. **The folded readings add no second class for one cause beyond what the whole spelling draws. The raw readings keep what they draw at the release:** `rmSync('testsToDelete-u*')` draws both.

**The comment gate.** The raw readings keep `isComment` as at the release. A line that `isComment` calls a comment gets folded readings only in two cases the reader states: a JavaScript line that starts with `#` in code state, not in a template or a block comment (a private field), and a `.ps1` line where `#>` closes a block comment and code follows. Such a line reads every folded reading, a whole name as well as a split one. **Every other comment-like line is empty in the folded input, so it binds nothing and reads nothing:** `-- ` in `.sh` and yaml, and a template's text line that starts with `#`, `//` or `--`. That text is a stated limit, and the release does not report a finding on it either. **A folded reading's answer never depends on a line that binds nothing.** The raw binding reading stays as at the release: it binds from a JavaScript comment or a template's text line. On an indented `#` line the classifier's shell-comment cut hides a deletion word after the `#`, as at the release, so such a line can be `legacy-name` where the same line without `#` is `owner-blind`; a row pins it. A JavaScript line that starts with `#`, `//` or `--` where a template or block comment closes and code follows is not read, as at the release.

**Why `legacy-name` for the last two (consult `f18ab9ef`, the judge).** The rule defines `owner-blind` as a pattern, glob or filter that matches the prefix, and `legacy-name` as a literal that builds a prefixed name. A plain literal with the word or half of it is the second. It also has a cure: `legacy-name` takes the inline exemption, so a false finding in a consumer is not a forced rewrite. A manifest takes no exemption (`leftovers-package.mjs`), so there the cure is a rewrite. The C# template calls these `owner-blind`; the difference is written in F30's entry for the template's owner.

**What an exemption can and cannot clear.** A sweep the binding reading follows stays `owner-blind` whatever the comment says: `const P = 'testsTo' + 'Delete-';` then `fs.rmSync(P + x)`, the `.sh` and `.ps1` forms of it, `names.filter((n) => n.startsWith(P))` on a line that assigns nothing (as at the release), and a `RegExp` over a prefix joined on its own line. The guard follows only what that reading follows. **These are `legacy-name` on the line that builds the prefix, a comment clears them, and a reviewer reads them:** `const P = 'testsToDelete-'` then `const k = names.filter((n) => n.startsWith(P))` or `const k = fs.rmSync(P + x)`, because a use on a line that assigns a name is not followed; `const P = …` then `new RegExp('^' + P)`; `sweep('testsToDelete-')`; `const A = 'testsTo'`, `const B = 'Delete-'`, then `rmSync(A + B + x)`.

**Allowed after the bare word:** the owner form as the classifier reads it; `[uw]` only with a digit form after it (`[0-9]` or `\d`, with or without a quantifier); the exempt and quarantine marker words, `TESTSTODELETE_RUN` and the proof marker; `.owner`; the owner letter at the end of a literal that the next token continues with `+`, which keeps a second mention out of the finding's text and does not clear a line `legacyNameHits` reads (`'testsToDelete-u' + uid` is `legacy-name`, at the release too); and prose, meaning a space before the word and, after it, a space, or `,` `.` `:` `)` followed by a space or the literal's end. A second segment the classifier calls narrow is left to `legacyNameHits`. The other environment names stay narrow in the classifier; the extra for `TESTSTODELETE_U` and `_W` goes. An exemption works as it does today.

**D5. The acceptance check. RED first, in `tools/leftovers-check.test.mjs`.**

1. **The table of spellings:** each row a fixture with a neighbouring clean line, an exact line and an exact class, compared as a list of `line:class`, not a set. It holds at least F30's sixteen, D2's rows, `.sh` touching pieces, the classifier's own `execSync('rm -rf /tmp/testsTo' + 'Delete *')`, the split sweeps of D4 on two lines, `const a = /'/; const n = 'testsTo' + 'Delete-x';`, and **an `owner-blind` line with a `legacy-name` exemption, which stays `owner-blind`**.
2. **No false finding:** the 27 words above; comments of each kind, JSDoc and trailing, holding pieces only (a whole name in a trailing comment or a JSDoc line is a finding today and stays one; a line `isComment` calls a comment is skipped, as at the release); a multi-line template holding `/*`; longer words (`testsToDeleted`, `testsToDeleteCount`); prose; `echo don\'t`; an owner-form name split over `+`, with its digits in the literal; a `${LEGACY_WORD}x` hole.
3. **Each reading can go red:** each row of D4 and D2's one-character class has a row that only it finds. `legacyNameHits` on folded text is unique on `'testsTo' + 'Delete-${REPO_TOKEN}'`. A mutant list, by hand, recorded: class decoding off, the classifier on folded text off, comments read, regex recognition off, bare word off, piece off, each join off, the allowlist ignored, one line drawing two classes for one cause, the allowance applied under a consumer, and every mutant the last reviews left green that has a fixture. Each must go red. The reader-off check is a durable test through `foldingAllowances`.
4. **Time:** a step counter on the reader, not a wall clock, at 1, 2, 4 and 8 MB, must grow linearly for `\'`, `\"`, `'a',`, spaces after a literal, `` `" ``, `= /[ `, `testsToDelete ` and a template of `${/[}` holes. The counter counts every helper and a failed word. At most one 32 MB run, of the reader alone. **A folded line over 256 KiB does not go to the folded readings and becomes one `unreadable` finding: `line <n> is <size>: the folded reading stops at 256 KiB`. The longest real line measured is 80 KB.** Any throw in the reader becomes one `unreadable` finding naming the file, never a crash and never a clean result. `CURES.unreadable` and the header say this wider use. **This promises the reader only:** a folded line under the limit goes through `classifyLines`, whose time is D8's.
5. **The interactions, as an executable table, because each review round found its defects there.** One rule of the table: for every kept row, the answer is compared across whole against split spelling; alone against a line elsewhere that holds an unrelated comment; one against two occurrences on the line, in both orders; exempted against not. Expected answers: with an unrelated comment far away, the same list shifted, except a raw binding from a comment. Split equals whole on a code line. Two occurrences give the union of each alone, except a line the classifier calls broad, where the bare word and the piece read nothing and `legacyNameHits` still reads it, raw and folded. Exempted gives the list without `legacy-name`. A witness row, RED first, for each defect the review of `16943a7` measured: a `-- ` or template text line that draws a finding; an answer that depends on a far line; a whole name not read where its split form is; an exemption that clears another occurrence's pattern, in another literal or in the same one; `.ps1` parentheses at `-join` and `(…)-join''`; `f('testsTo') + 'Delete-*'`, which is `legacy-name`, with a keyword before `(` (`return`, `typeof`) not read as a call; the reader's `${/[}` shape.
6. **What the raw readings answer does not change.** A speed fix to a raw reading stays only with a durable differential test against the old code as its oracle, and a stated reason why the two agree.

**The real trees, recorded on the PR:** the guard at this branch against each consumer's DEFAULT branch, and coai's and creds' open branches too, compared with the guard at the current release, by class, file and line. The nine are coai, creds, benchmark, rag_qln, sidecar_rust, vscode_kit, mcp, amd_r9700 and wsl_care. The record names each commit and the command. The same command runs again immediately before the release, and the release waits until any difference is read. Each record says whether that consumer's CI runs the guard.

**D6. The guard's own files.** `FOLDING_ALLOWANCES` lists this repository's own files by name, with a test that every entry exists and still needs its place. **It applies only when `realpath(repo)` is the guard's own root; `scanText` defaults to none. So a consumer has no such list and inherits nothing by a matching path,** with a D5 row for a consumer that holds `tools/janitor.sh`. This repository's CI runs the guard through `npm test` with no profile, so a profile is not the test for this. A consumer's cure is the inline `legacy-name` exemption for the bare word and the piece, and a rewrite for a real `owner-blind` line.

**D7. The size and the texts.** `tools/leftovers-check.mjs` and both new files stay under 800 lines. The rule file `common/test-leftovers-detail.md` is at its read cap, so it gets a short statement and points at the guard's header for D2's table. The detail and the header both say that `legacy-name` now covers the bare word and the half word, and say the `legacy-name` case of a pattern tail. No text says that a raw reading is linear.

**D8. The raw readings' time is not promised here.** All of these are the same at the release, and all are measured through `scanText` or the named function: `exemptionProblem` (cubic on one comment line: 4 KiB 14 s, 8 KiB 109 s); `words` in `leftovers-docker.mjs` (`x,,,,…y`: 128 KiB 10 s); `/\s#.*$/` in `looseVerdicts` (128 KiB 4.1 s); `TYPE` in `prefix-bindings.mjs` (128 KiB 2.2 s); `MARKER` in the guard (256 KiB 1.5 s); the array, `build … push` and `trap` regular expressions in `leftovers-docker.mjs` (512 KiB 10 s or more); `composeEnvHits` on a repeated assignment (256 KiB 42 s); a chain of assignments in `classifyLines` (16000 lines 40 s). With a split first name the chain costs the same at this branch and nothing at the release, because the release does not bind it (the folded reading, which D5 item 4 leaves to D8). `maskExpansions` through `closingOf` on `docker run $( ` repeated: 128 KiB 6 s, 256 KiB 22 s. The longest line in the guard's scan is 2487 characters, so no real line holds these shapes. They go to one new row of `todo/PLAN_test_leftovers_merged_core_followups.md`, with these numbers. **What stays of the fixes already built:** `looseVerdicts`' forward pass and the removed spreads, because a differential of the whole `classifyLine` over 9,400,453 lines found no difference (one run, in the record), a durable test keeps the oracle over 52,621 lines, and at 2 MiB the classifier goes from 106.7 s to 0.35 s. **What goes:** the compose cap of 64 and the value cut, because they change a raw answer, and the rest of that commit's code with them, so `leftovers-shell.mjs` is byte-equal to the release. No test holds a wall-clock limit on a raw reading.

**D9. When a review round ends.** A reviewer's finding is a defect here when it breaks *Done when* or a row of D2 or D4, gives a false finding or loses a finding on a real tree, adds a defect, or finds a text the code does not make true. A spelling outside D2's table is a line for its limits, and not new code. This keeps the promise fixed while the rounds read it. A fix that changes a row or a promise is still a ledger entry.

## What changes in the consumers

- **creds:** `src_vs_code/src/test/leftoversSites.test.ts:91` (at `7e0a0480`; it was `:74`, and D5's record says where it is) builds `'testsTo' + 'Delete-agent-'`. It becomes a `legacy-name` finding. **It keeps its two pieces and adds the inline exemption, in a PR that merges before creds' pin bump.** A plain literal would make the file hold its own needle, and its own test fails on that.
- **coai:** at E5's head, 0 new and 0 lost, measured again at the release. On coai's `main`, `kimiLinuxInstall.test.ts:18` was a false finding of the first reader, and D1's comment removal cures it. N8 stays green (D4). D5's record decides.
- **amd_r9700:** its CI runs the guard, so its record is read first. The judge's model shows 0 new.
- **Any other new finding** from D5's record is listed here before the release, with its fix in that consumer.
- **The sentence "zero whole literals, F30 open"** in E5, E2 and their PRs stays true until each repository pins the release. After that it reads "zero for the guard's listed spellings", and each consumer that declared the old sentence runs the guard again at the new pin and records the result (F30's closure).

## Order

1. This revision: the consult, the Opus judge's table, the document gate, and the owner's approval, because the record says `Narrowed: yes`.
2. A Sonnet coder builds it on `feat/f30-folding-reader`, keeping what the judge marks `fits`, with RED first.
3. The code gate and an independent Opus review, because the gate's reviewers missed most of what the last Opus review found. The PR, CodeRabbit, the merge.
4. The consumer fixes D5 found, each in its repository.
5. One release. The pin bumps follow, each alone. **A new release needs a pin bump in nine repositories. The cap is per repository. The owner allowed, on 2026-11-05, for this release only, one pin bump PR over the cap in each of coai, rag_qln, sidecar_rust, mcp and vscode_kit.**

## What this does not do

- It does not read across lines or run anything. It follows a variable only as far as the binding reading already does (D4).
- It does not change `raw-temp`, the baseline, the exemption grammar or the C# template, or what a raw reading answers.
- It does not defend against a hostile author, and it does not switch the guard on in any consumer's CI.
- It does not promise the raw readings' time (D8).
- It does not close the two limits named in E5's PR: the inline `raw-temp` rows' proofs stay as they are.

## Definition of Done

- [x] D5's checks RED on the old guard and GREEN on the new one, with the mutants recorded, including items 5 and 6.
- [x] Every test of this repository green; `plan-lifecycle` clean. *(At `37b9aa5`, the released commit: 1600 tests, 1592 pass, 0 fail, 8 skipped.)*
- [x] The real-tree record on the PR: nine consumers, default branches, each new finding listed and read, each lost finding explained, CI activation stated. *(#135, from `dfc0083`.)*
- [x] The guard's header and `research/` say what the guard reads and what it does not, and name D2's table; `common/test-leftovers-detail.md` points at the header.
- [x] No file D7 names is over 800 lines; no text or test title says a raw reading is linear.
- [x] F30's entry says what shipped, with the piece rule and the class, for the template's owner; D8's row is in the follow-ups plan.
- [x] The real-tree comparison re-run immediately before the release, with its commits recorded. *(2026-11-06, the guard at `37b9aa5` against `bd795847`, each tree's default branch unless named: coai `ddf12da517` 327; coai E5 `b3bdd472a3` 229; creds `834c91b01d` 16; benchmark `e597c03e2c` 202; rag_qln `9852c1f091` 13; sidecar_rust `8efee6f74f` 0; vscode_kit `f0ec3641e9` 23; mcp `5ccfcfdeaa` 0; amd_r9700 `63a1be9a2d` 0; wsl_care `6e0cbcca44` 24. Every tree: 0 new, 0 lost. Creds' `leftoversSites.test.ts:91`, new on the E2.1 branch before its exemption, is not found on creds main.)*
- [ ] One release; the consumers' fixes merged first; the pin bumps, each alone; each consumer that declared "zero whole literals, F30 open" runs the guard again at the new pin and records the result. *(2026-11-07: the release and the fix are done. Pin bumps merged: creds #306, benchmark #174, sidecar_rust #71, vscode_kit #24, mcp #65, amd_r9700 #17, wsl_care #187; rag_qln #89 open. Coai #956 is the coai release session's: its rules-budget tests failed on the larger tier, mostly F27's `common/testing.md`, and the owner raised that budget. Creds recorded 0 `legacy-name` at the new pin (creds #309). Coai's re-run waits for #956.)*

## Plan gate

Round 1, session `73a0a295`, `proceed`, 1 of 2 reviewers (Antigravity out of quota). Finding 0 accepted: the real-tree comparison names its commits and runs again before the release. Finding 1 rejected, because its example reads an operand and the rule reads the joined literal.

The code gate on `f5b3b16` (4 of 8 reviewers): findings 0 and 2 accepted, one point: the eight-round cap. D1's scanner removes it. Findings 1, 3 and 4 rejected: finding 1 on the template's reading, findings 3 and 4 measured as found.

The code gate on `f9c427a` (4 of 8 reviewers): one finding accepted, the classifier's cost; on `16943a7` (4 of 8): no findings. The independent Opus reviews of both found what epoch 2's ledger records. The re-review for epoch 3: consult `997bd291`, solved; the Opus judge's table and corrections; the document gate at `7fc4ab1`, `proceed` with no findings, 2 of 4 reviewers (Antigravity out of quota).

The code gate on `ffdbb23` (4 of 8): finding 0 accepted, the detail's `legacy-name` case; findings 1 to 3 rejected, two measured false and one against D5 item 4. **D5 item 5's sentence, the owner's decision, 2026-11-06:** the words "except a line the classifier calls broad, which stays `owner-blind`, and the release's own raw hits" could not hold beside "split equals whole on a code line" and D4. They now read as the item says. The consultants split, the owner ruled it wording, so it is no ledger entry, and the PR quotes both texts.
