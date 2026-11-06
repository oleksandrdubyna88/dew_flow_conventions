# PLAN — F30: the shipped Node guard reads a prefix in the spellings it lists

> Status: **epoch 2 stopped for re-review, 2026-11-06: entries 2.2 and 2.3 are the epoch's second and third changes. No new code on this plan until the whole plan is reviewed again and the next epoch opens.** The rebuild and its review fixes are on `feat/f30-folding-reader` at `16943a7`, unmerged. The item is F30 of `todo/PLAN_test_leftovers_merged_core_followups.md`. Owner: this repository. Deadline 2026-11-19, or before creds' E2.5 merges if that is earlier. Not a prerequisite of coai's E5 producer PR.

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

> Epoch 2 · approved 2026-11-05 · by owner · state: stopped

- 2.1 · 2026-11-05 · reviewer · contract — D4's statements about what the release's raw and binding readings do were not measured; a RegExp over a bound name and a use on an assigning line are not followed, and the owner letter before a + only shortens a finding's text
  (Found by the coder's measure and the independent Opus review of f9c427a. The plan's text now says what the reading does; the reading is not extended, as "What this does not do" says. This epoch has no change left: the next accepted one is a full stop.)
- 2.2 · 2026-11-06 · reviewer · dod, contract — the Goal's never a hang and D5's raw readings stay as at the release cannot both hold: ten more raw paths are super-linear, one cubic, and the classifier and compose fixes already changed raw code, the compose cap a raw answer
  (The independent Opus review of 16943a7. The agent had called the classifier and compose fixes no change; the compose cap's 65th assignment is a different answer, so that was wrong. This second change stopped the plan.)
- 2.3 · 2026-11-06 · reviewer · contract — D4's row says a bare word's pattern tail stays owner-blind; no finding lost and one class for one cause make 'testsToDelete-u*' legacy-name alone, so the row and three documents do not hold
  (Same review. An independent cause, so its own entry. The same review found entry 2.1's text too wide: a RegExp over a bound name is followed on a line that assigns nothing and with a template hole, as at the release. D4's corrected paragraph holds as measured.)

## Goal

`tools/leftovers-check.mjs` finds a legacy name or an owner-blind pattern when a file builds the prefix on one line by a spelling in the table of D2. **It is a spelling check over text a person wrote in their own repository. It does not defend against a hostile author.** A repository's zero then means zero for the supported spellings, and each document that says so names them. The exemption grammar does not change. The classes keep their names; `legacy-name` now also covers the bare word and the half word (D4).

**Done when:** every row of D5's first table is a finding of its stated class on its exact line; no line of a consumer's default branch gets a finding it did not have, except the lines listed under *What changes in the consumers*, and no finding the guard gives today is lost; the reader is linear on any line, a line over 256 KiB goes to no folded reading and is one named finding, and a throw in the reader is one named finding, never a crash or a clean result; **the raw readings' answers stay exactly as at the release, and their time is not promised (D8)**; one release is cut; the pin bumps follow, each alone. **Pinning is not activation: this plan records for each consumer whether its CI runs the Node guard yet.** Today one does: `dew_flow_amd_r9700_tuning_ai` runs the full guard with `--profile node` (its workflow, line 42), so a new finding there is red at its pin bump. coai's step is `--baseline-shrinks`, which reads no text. The others switch the guard on in their own epics.

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

**D1. Two new files, each under the style maximum of 800 lines: `tools/lib/leftovers-fold.mjs` (the file reader, JavaScript and the literal readings) and `tools/lib/leftovers-fold-shell.mjs` (`.sh`, yaml and `.ps1`): a forward-only scanner per file kind, not a set of regular expressions over the line.** It walks each file once and answers, for each line, the code with comments removed and the string literals as token spans, decoded and joined. The only second reading is the operand of a join that fails, once, so the bound holds and an unterminated quote cannot make it quadratic. No marker character is put in the text, so a control byte in a line turns nothing off. A file that ends inside a block comment or inside a template, at any depth, is one `unreadable` finding on the line where that state opened: a backtick the reader did not recognise then ends in a name, and not in a silent clean file. A template that a later backtick closes cannot be told from a real one, and that stays a stated limit (D2). It is a SPELLING reader: a name built from a variable, across lines or at run time is not seen, and the guard's text says so. Joins are read within one line. Only comment and template state cross lines, and a template tracks its `${}` depth: without that, `url(x/*.png)` in a multi-line template opens a false block comment and hides the code after it (the judge's measure: 339 false block-comment lines in coai, 57 in creds).

**D2. What it reads, by file kind. This table is the promise, and any document that states the guard's reach names it.**

| Kind | Comments removed | Literals | Joins | Decoding |
|---|---|---|---|---|
| `.mjs .cjs .js .ts .tsx .jsx .mts .cts` | `//`, `/* */` across lines | `'…'`, `"…"`, `` `…` ` with `${'a'}` holes that hold only a quoted literal; a regex literal is recognised so its quotes do not shift the pairs after it (a `/` after `( , = : [ ! & | ? { ; =>`, after `return`, `typeof` or `case`, or at the line's start; a `/` inside `[…]` does not close it; with no closer on the line it is division, and the line gets no second try) | `+`; `.concat('a', 'b')`; `['a', 'b'].join(<literal>)`; each with spaces around its operators, and a literal in its own parentheses | `\uXXXX`, `\u{…}`, `\xXX`, a one-character class `[T]` |
| `.sh` | `#` at the start of a word | `'…'`, `"…"`, `$'…'` | a word's touching pieces, quoted or not: `testsTo"Delete-"`, `'a''b'` | in `$'…'`: `\xXX`, `\uXXXX`, octal |
| `.ps1` | `#`, `<# #>` across lines | `'…'`, `"…"` | `+`; binary `-join` over a literal array, with or without spaces at the operator; a literal in its own parentheses | none |
| `.yml .yaml` | `#` at the start of a word | read as `.sh` | as `.sh` | as `.sh` |

**A call is not a parenthesis:** `f('a') + 'b'` joins nothing, because the value of `f(…)` is not the literal.

**Not read, and said in the documents:** a template nested in a hole (`${`x`}`), a literal in an expression hole (`${f('a')}`), unary `-join`, a comment between operands, `.ps1` here-strings, `.sh` heredocs, a nested `"$(…)"`, extensionless scripts, and every other kind (`.py`, `.bash`, `.cmd`). **A regex at a position the table does not name is not recognised:** after `)`, `else`, `+`, `%`, `throw`, `await` or `...`, its quote or backtick is read as an opener. **JSX text is not told from code:** `<p>don't</p>` stops that line's reading, and `<p>src/*.ts</p>` hides every line up to the next `*/`. In these cases the supported spellings up to the next closer are silently not read, and an opener that never closes is D1's `unreadable`. Of 3753 real files, none ends in that state. The trees measured hold no `.tsx` or `.jsx`.

**D3. Which classes read the result: `legacy-name` and `owner-blind` only.** `raw-temp` reads the API call, as F30 says.

**D4. How they read it.**

| Reading | Runs on | Class |
|---|---|---|
| `legacyNameHits` and `classifyLines`, **as today** | the raw lines, comments included | as today. **Comment removal applies to the folded readings only, so no finding of today is lost** |
| `legacyNameHits` | the folded text | `legacy-name` |
| `classifyLines` (a pattern, glob or removal, with the file's prefix bindings) | **the file's folded lines**, so a prefix built in pieces binds as a whole one does | `owner-blind`, no exemption |
| one extra classifier reading of the code with one-character classes and `\x`, `\u` escapes decoded, on JS lines | so `/^tests[T]oDelete[-_]/` reads as its plain form; this does not lex a regex | `owner-blind`, no exemption |
| the bare word: a literal holding the whole word, with a boundary each side, followed by neither the owner form nor an allowed word. **A tail that holds `[`, `(`, `?`, `*`, `\` or `.*` is a pattern, and is `owner-blind`, unless `legacyNameHits` reads that same occurrence of the word: `'testsToDelete-u*'` is `legacy-name` alone, at the release too, and its exemption clears it** | the joined literals | **`legacy-name`** |
| the piece: a joined literal that holds no whole word and holds a crossing piece of 6 or more in the word's own form, where neither side touches a letter | the joined literals | **`legacy-name`** |

**The bare word and the piece read only a line that no `owner-blind` reading called broad.** A line draws one class for one cause, so coai's N8, which asserts exactly `['owner-blind']` for `for (const f of fs.globSync('testsToDelete-*')) rmSync(f, …)`, stays green. **The cause is the occurrence of the word, not the line or the literal:** `const a = 'testsTo'; const b = 'testsToDelete[-_]';` and `'testsToDelete-old testsToDelete[-_]'` each have two causes and draw both classes, and a `legacy-name` exemption on them clears the first and leaves `owner-blind`.

**The comment gate.** The raw readings keep `isComment` as at the release. A line that `isComment` calls a comment gets folded readings only in two cases the reader states: a JavaScript line that starts with `#` in code state, not in a template or a block comment (a private field), and a `.ps1` line where `#>` closes a block comment and code follows. Such a line reads every folded reading, a whole name as well as a split one. **Every other comment-like line is empty in the folded input, so it binds nothing and reads nothing:** `-- ` in `.sh` and yaml, and a template's text line that starts with `#`, `//` or `--`. That text is a stated limit, and the release does not read it either. **A line's answer never depends on an unrelated line,** such as a comment elsewhere in the file.

**Why `legacy-name` for the last two (consult `f18ab9ef`, the judge).** The rule defines `owner-blind` as a pattern, glob or filter that matches the prefix, and `legacy-name` as a literal that builds a prefixed name. A plain literal with the word or half of it is the second. It also has a cure: `legacy-name` takes the inline exemption, so a false finding in a consumer is not a forced rewrite. A manifest takes no exemption (`leftovers-package.mjs`), so there the cure is a rewrite. The C# template calls these `owner-blind`; the difference is written in F30's entry for the template's owner.

**What an exemption can and cannot clear.** A sweep the binding reading follows stays `owner-blind` whatever the comment says: `const P = 'testsTo' + 'Delete-';` then `fs.rmSync(P + x)`, the `.sh` and `.ps1` forms of it, `names.filter((n) => n.startsWith(P))` on a line that assigns nothing (as at the release), and a `RegExp` over a prefix joined on its own line. The guard follows only what that reading follows. **These are `legacy-name` on the line that builds the prefix, a comment clears them, and a reviewer reads them:** `const P = 'testsToDelete-'` then `const k = names.filter((n) => n.startsWith(P))` or `const k = fs.rmSync(P + x)`, because a use on a line that assigns a name is not followed; `const P = …` then `new RegExp('^' + P)`; `sweep('testsToDelete-')`; `const A = 'testsTo'`, `const B = 'Delete-'`, then `rmSync(A + B + x)`.

**Allowed after the bare word:** the owner form as the classifier reads it; `[uw]` only with a digit form after it (`[0-9]` or `\d`, with or without a quantifier); the exempt and quarantine marker words, `TESTSTODELETE_RUN` and the proof marker; `.owner`; the owner letter at the end of a literal that the next token continues with `+`, which keeps a second mention out of the finding's text and does not clear a line `legacyNameHits` reads (`'testsToDelete-u' + uid` is `legacy-name`, at the release too); and prose, meaning a space before the word and, after it, a space, or `,` `.` `:` `)` followed by a space or the literal's end. A second segment the classifier calls narrow is left to `legacyNameHits`. The other environment names stay narrow in the classifier; the extra for `TESTSTODELETE_U` and `_W` goes. An exemption works as it does today.

**D5. The acceptance check. RED first, in `tools/leftovers-check.test.mjs`.**

1. **The table of spellings:** each row a fixture with a neighbouring clean line, an exact line and an exact class, compared as a list of `line:class`, not a set. It holds at least F30's sixteen, D2's rows, `.sh` touching pieces, the classifier's own `execSync('rm -rf /tmp/testsTo' + 'Delete *')`, the split sweeps of D4 on two lines, `const a = /'/; const n = 'testsTo' + 'Delete-x';`, and **an `owner-blind` line with a `legacy-name` exemption, which stays `owner-blind`**.
2. **No false finding:** the 27 words above; comments of each kind, JSDoc and trailing, holding pieces only (a whole name in a comment is a finding today, and stays one); a multi-line template holding `/*`; longer words (`testsToDeleted`, `testsToDeleteCount`); prose; `echo don\'t`; an owner-form name split over `+`, with its digits in the literal; a `${LEGACY_WORD}x` hole.
3. **Each reading can go red:** each row of D4 and D2's one-character class has a row that only it finds. `legacyNameHits` on folded text is unique on `'testsTo' + 'Delete-${REPO_TOKEN}'`. A mutant list, by hand, recorded: class decoding off, the classifier on folded text off, comments read, regex recognition off, bare word off, piece off, each join off, the allowlist ignored, one line drawing two classes for one cause, the allowance applied under a consumer, and every mutant the last reviews left green that has a fixture. Each must go red. The reader-off check is a durable test through `foldingAllowances`.
4. **Time:** a step counter on the reader, not a wall clock, at 1, 2, 4 and 8 MB, must grow linearly for `\'`, `\"`, `'a',`, spaces after a literal, `` `" ``, `= /[ ` and `testsToDelete `. At most one 32 MB run, of the reader alone. **A folded line over 256 KiB does not go to the folded readings and becomes one `unreadable` finding: `line <n> is <size>: the folded reading stops at 256 KiB`. The longest real line measured is 80 KB.** Any throw in the reader becomes one `unreadable` finding naming the file, never a crash and never a clean result. `CURES.unreadable` and the header say this wider use. **This promises the reader only:** a folded line under the limit goes through `classifyLines`, whose time is D8's.
5. **The interactions, as an executable table, because each review round found its defects there.** One rule of the table: for every kept row, the answer is compared across whole against split spelling; alone against a line elsewhere that holds an unrelated comment; one against two occurrences on the line, in both orders; exempted against not. A witness row, RED first, for each defect the review of `16943a7` measured: a `-- ` or template text line that draws a finding; an answer that depends on a far line; a whole name not read where its split form is; an exemption that clears another occurrence's pattern, in another literal or in the same one; `.ps1` parentheses at `-join`; `f('testsTo') + 'Delete-*'`.
6. **What the raw readings answer does not change.** A speed fix to a raw reading stays only with a durable differential test against the old code as its oracle, and a stated reason why the two agree.

**The real trees, recorded on the PR:** the guard at this branch against each consumer's DEFAULT branch, and coai's and creds' open branches too, compared with the guard at the current release, by class, file and line. The nine are coai, creds, benchmark, rag_qln, sidecar_rust, vscode_kit, mcp, amd_r9700 and wsl_care. The record names each commit and the command. The same command runs again immediately before the release, and the release waits until any difference is read. Each record says whether that consumer's CI runs the guard.

**D6. The guard's own files.** `FOLDING_ALLOWANCES` lists this repository's own files by name, with a test that every entry exists and still needs its place. **It applies only when `realpath(repo)` is the guard's own root; `scanText` defaults to none. So a consumer has no such list and inherits nothing by a matching path,** with a D5 row for a consumer that holds `tools/janitor.sh`. This repository's CI runs the guard through `npm test` with no profile, so a profile is not the test for this. A consumer's cure is the inline `legacy-name` exemption for the bare word and the piece, and a rewrite for a real `owner-blind` line.

**D7. The size and the texts.** `tools/leftovers-check.mjs` and both new files stay under 800 lines. The rule file `common/test-leftovers-detail.md` is at its read cap, so it gets a short statement and points at the guard's header for D2's table. The detail and the header both say that `legacy-name` now covers the bare word and the half word, and say the `legacy-name` case of a pattern tail. No text says that a raw reading is linear.

**D8. The raw readings' time is not promised here.** All of these are the same at the release, and all are measured through `scanText` or the named function: `exemptionProblem` (cubic on one comment line: 4 KiB 14 s, 8 KiB 109 s); `words` in `leftovers-docker.mjs` (`x,,,,…y`: 128 KiB 10 s); `/\s#.*$/` in `looseVerdicts` (128 KiB 4.1 s); `TYPE` in `prefix-bindings.mjs` (128 KiB 2.2 s); `MARKER` in the guard (256 KiB 1.5 s); the array, `build … push` and `trap` regular expressions in `leftovers-docker.mjs` (512 KiB 10 s or more); `composeEnvHits` on a repeated assignment (256 KiB 42 s); a chain of assignments in `classifyLines` (16000 lines 40 s). No real line holds these shapes. They go to one new row of `todo/PLAN_test_leftovers_merged_core_followups.md`, with these numbers. **What stays of the fixes already built:** `looseVerdicts`' forward pass and the removed spreads, because a differential over 8.7 million lines found no difference and D5's item 6 keeps them proved. **What goes:** the compose cap of 64 and the value cut, because they change a raw answer, and the rest of that commit with them, because nothing here needs it.

**D9. When a review round ends.** A reviewer's finding is a defect here when it breaks a row of D2 or D4, gives a false finding or loses a finding on a real tree, adds a defect, or finds a text the code does not make true. A spelling outside D2's table is a line for its limits, and not new code. This keeps the promise fixed while the rounds read it.

## What changes in the consumers

- **creds:** `src_vs_code/src/test/leftoversSites.test.ts:91` (at `7e0a0480`; it was `:74`, and D5's record says where it is) builds `'testsTo' + 'Delete-agent-'`. It becomes a `legacy-name` finding. **It keeps its two pieces and adds the inline exemption, in a PR that merges before creds' pin bump.** A plain literal would make the file hold its own needle, and its own test fails on that.
- **coai:** at E5's head, nothing measured. On coai's `main`, `kimiLinuxInstall.test.ts:18` was a false finding of the first reader, and D1's comment removal cures it. N8 stays green (D4). D5's record decides.
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

- [ ] D5's checks RED on the old guard and GREEN on the new one, with the mutants recorded, including items 5 and 6.
- [ ] Every test of this repository green; `plan-lifecycle` clean.
- [ ] The real-tree record on the PR: nine consumers, default branches, each new finding listed and read, each lost finding explained, CI activation stated.
- [ ] The guard's header and `research/` say what the guard reads and what it does not, and name D2's table; `common/test-leftovers-detail.md` points at the header.
- [ ] F30's entry says what shipped, with the piece rule and the class, for the template's owner; D8's row is in the follow-ups plan.
- [ ] The real-tree comparison re-run immediately before the release, with its commits recorded.
- [ ] One release; the consumers' fixes merged first; the pin bumps, each alone; each consumer that declared "zero whole literals, F30 open" runs the guard again at the new pin and records the result.

## Plan gate

Round 1, session `73a0a295`, `proceed`, 1 of 2 reviewers (Antigravity out of quota). Finding 0 accepted: the real-tree comparison names its commits and runs again before the release. Finding 1 rejected, because its example reads an operand and the rule reads the joined literal.

The code gate on `f5b3b16` (4 of 8 reviewers): findings 0 and 2 accepted, one point: the eight-round cap. D1's scanner removes it. Findings 1, 3 and 4 rejected: finding 1 on the template's reading, findings 3 and 4 measured as found.
