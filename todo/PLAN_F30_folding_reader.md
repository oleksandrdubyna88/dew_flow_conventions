# PLAN — F30: the shipped Node guard reads a prefix however it is spelled

> Status: **stopped for re-review, 2026-11-05.** The build at `f5b3b16` (pushed, unmerged) and an independent Opus review found two independent changes of this plan, and more defects of the same reader. The item is F30 of `todo/PLAN_test_leftovers_merged_core_followups.md`. Owner: this repository. Deadline 2026-11-19, or before creds' E2.5 merges if that is earlier. Not a prerequisite of coai's E5 producer PR.

## Plan changes

> Epoch 1 · approved 2026-11-05 · by reviewers · state: stopped

- 1.1 · 2026-11-05 · agent · approach — D4's bare word and its gate do not hold on real trees; the reader reads the classifier's verdict with extras, and on every line with a quote
- 1.2 · 2026-11-05 · agent · scope — D2's lists are too narrow; .tsx, .jsx, any yaml, and .join over any literal were added
  (Both found by the Opus review of f5b3b16. The second change stopped the plan. The same review measured a false finding on coai main, quadratic regular expressions, and spellings still missed.)

## Goal

`tools/leftovers-check.mjs` finds a legacy name or an owner-blind pattern when a file builds the prefix on one line by a spelling in the table of D2. **It is a spelling check over text a person wrote in their own repository. It does not defend against a hostile author.** A repository's zero then means zero for the supported spellings, and each document that says so names them. The classes and the exemption grammar do not change.

**Done when:** every row of D5's first table is a finding of its stated class on its exact line; no line of a consumer's default branch gets a finding it did not have, except the lines listed under *What changes in the consumers*; a hostile line ends in linear time or as a named finding, never a hang or a crash; one release is cut; the pin bumps follow, each alone. **Pinning is not activation: this plan records for each consumer whether its CI runs the Node guard yet.** Today none does but coai's baseline step, so a false finding bites when a consumer's own epic switches the guard on.

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

**A second measure, 2026-11-05, replaces the case-free rule above.** A piece keeps the word's own form (camel, all lower or all upper), and a side where the piece cuts the word must not touch a letter. Of 27 ordinary words (`toDelete`, `testStatus`, `latestStore`, `filesToDelete`, `snapshotsToDelete`, `modelEtag`, `hostStopped`, `chatModelEdits`, `restore`, `todo/PLAN_x.md` and others) none is flagged; of 13 real pieces (`testsTo`, `ToDelete`, `sToDel`, `teststo`, `TODELETE` and others) none is missed.

## Decisions

**D1. One new file, `tools/lib/leftovers-fold.mjs`: a forward-only scanner per file kind, not a set of regular expressions over the line.** It walks each file once and answers, for each line, the code with comments removed and the string literals as token spans, decoded and joined. Nothing is re-tried, so an unterminated quote cannot make it quadratic, and no marker character is put in the text, so a control byte in a line turns nothing off. It is a SPELLING reader: a name built from a variable, across lines or at run time is not seen, and the guard's text says so. Joins are read within one line. Only comment state crosses lines.

**D2. What it reads, by file kind. This table is the promise, and any document that states the guard's reach names it.**

| Kind | Comments removed | Literals | Joins | Decoding |
|---|---|---|---|---|
| `.mjs .cjs .js .ts .tsx .jsx .mts .cts` | `//`, `/* */` across lines | `'…'`, `"…"`, `` `…` ` with `${'a'}` holes that hold only a quoted literal; a regex literal is recognised so its quotes do not shift the pairs after it (a `/` after `( , = : [ ! & | ? { ;` or at the line's start) | `+`; `.concat('a', 'b')`; `['a', 'b'].join(<literal>)`; each with spaces around its operators, and a literal in parentheses | `\uXXXX`, `\u{…}`, `\xXX`, a one-character class `[T]` |
| `.sh` | `#` at the start of a word | `'…'`, `"…"`, `$'…'` | a word's touching pieces, quoted or not: `testsTo"Delete-"`, `'a''b'` | in `$'…'`: `\xXX`, `\uXXXX`, octal |
| `.ps1` | `#`, `<# #>` across lines | `'…'`, `"…"` | `+`; binary `-join` over a literal array; a literal in parentheses | none |
| `.yml .yaml` | `#` at the start of a word | read as `.sh` | as `.sh` | as `.sh` |

**Not read, and said in the documents:** a template nested in a hole (`${`x`}`), unary `-join`, a comment between operands, and extensionless scripts.

**D3. Which classes read the result: `legacy-name` and `owner-blind` only.** `raw-temp` reads the API call, as F30 says.

**D4. How they read it.**

| Reading | Runs on | Class |
|---|---|---|
| `legacyNameHits` | the folded text | `legacy-name` |
| `classifyLine` (a pattern, glob or removal) | the folded text | `owner-blind`, no exemption |
| one extra classifier reading of the code with one-character classes and `\x`, `\u` escapes decoded, on JS lines | so `/^tests[T]oDelete[-_]/` reads as its plain form; this does not lex a regex | `owner-blind`, no exemption |
| the bare word: a literal holding the whole word, with a boundary each side, followed by neither the owner form nor an allowed word | the joined literals | **`legacy-name`** |
| the piece: a joined literal that holds no whole word and holds a crossing piece of 6 or more in the word's own form, where a cut side touches no letter | the joined literals | **`legacy-name`** |

**Why `legacy-name` for the last two (consult `f18ab9ef`).** The rule defines `owner-blind` as a pattern, glob or filter that matches the prefix, and `legacy-name` as a literal that builds a prefixed name. A literal with half the word is the second. It also has a cure: `legacy-name` takes the inline exemption, so a false finding in a consumer is not a forced rewrite. A real sweep is still `owner-blind` through the classifier, with no exemption. The C# template calls these `owner-blind`; the difference is written in F30's entry for the template's owner.

**Allowed after the bare word:** the owner form as the classifier reads it; `[uw]` only with a digit form after it (`[uw][0-9]{1,10}`); the exempt and quarantine marker words; `.owner`; the owner letter at the end of a literal that the next token continues with `+`; and prose, meaning a space before the word and, after it, a space, or `,` `.` `:` `)` followed by a space or the literal's end. The other environment names stay narrow in the classifier; the extra for `TESTSTODELETE_U` and `_W` goes.

A finding is counted once per class on a line. An exemption works as it does today.

**D5. The acceptance check. RED first, in `tools/leftovers-check.test.mjs`.**

1. **The table of spellings:** each row a fixture with a neighbouring clean line, an exact line and an exact class, compared as a list of `line:class`, not a set. It holds at least F30's sixteen, D2's rows, `.sh` touching pieces, and the classifier's own `execSync('rm -rf /tmp/testsTo' + 'Delete *')`.
2. **No false finding:** the 27 words above; comments of each kind, JSDoc and trailing; an earlier quote on the line (`const a = /'/; const n = 'x';`); longer words (`testsToDeleted`, `testsToDeleteCount`); prose; `echo don\'t`; an owner-form name split over `+`; a `${LEGACY_WORD}x` hole.
3. **Each reading can go red:** each row of D4 and D2's one-character class has a row that only it finds. A mutant list, by hand, recorded: class decoding off, the classifier on folded text off, comments read, the allowlist ignored, one line drawing a class twice. Each must go red. The reader-off check is a durable test through `foldingAllowances`.
4. **Time:** doubling inputs (`\'`, `\"`, `'a',`, spaces after a literal, `` `" ``) must grow linearly. A 32 MB string is read. Any throw in the reader becomes one `unreadable` finding naming the file, never a crash and never a clean result.

**The real trees, recorded on the PR:** the guard at this branch against each consumer's DEFAULT branch, and coai's and creds' open branches too, compared with the guard at the current release, by class, file and line. The eight are coai, creds, benchmark, rag_qln, sidecar_rust, vscode_kit, mcp and amd_r9700. The record names each commit and the command. The same command runs again immediately before the release, and the release waits until any difference is read. Each record says whether that consumer's CI runs the guard.

**D6. The guard's own files.** `FOLDING_ALLOWANCES` lists this repository's own files by name, with a test that every entry exists and still needs its place. **It applies only when the guard reads this repository: under `--profile node` it is empty, so a consumer has no such list and inherits nothing by a matching path.** A consumer's cure is the inline `legacy-name` exemption for the bare word and the piece, and a rewrite for a real `owner-blind` line.

**D7. The size.** `tools/leftovers-check.mjs` stays under 800 lines. The rule file `common/test-leftovers-detail.md` is at its read cap, so it gets a short statement and points at the guard's header for D2's table.

## What changes in the consumers

- **creds:** `src_vs_code/src/test/leftoversSites.test.ts:74` (it may have moved, D5's record says where) builds `'testsTo' + 'Delete-agent-'`. It becomes a `legacy-name` finding. It is fixed in creds by a plain literal with the inline exemption, **in a PR that merges before creds' pin bump**.
- **Any other new finding** from D5's record is listed here before the release, with its fix in that consumer.
- **The sentence "zero whole literals, F30 open"** in E5, E2 and their PRs stays true until each repository pins the release. After that it reads "zero for the guard's listed spellings".

## Order

1. This revision: the consult, the Opus judge's table, the document gate, and the owner's approval, because the record says `Narrowed: yes`.
2. A Sonnet coder builds it on `feat/f30-folding-reader`, keeping what the judge marks `fits`, with RED first.
3. The code gate and an independent Opus review, because the gate's reviewers missed most of what the last Opus review found. The PR, CodeRabbit, the merge.
4. The consumer fixes D5 found, each in its repository.
5. One release. The pin bumps follow, each alone. **A new release needs the pin bumps in eight repositories, over the cap of three open PRs. The owner's agreement on 2026-11-05 covered release `bd79584` only, so it is asked for this release.**

## What this does not do

- It does not read across lines, follow a variable, or run anything.
- It does not change `raw-temp`, the baseline, the exemption grammar or the C# template.
- It does not defend against a hostile author, and it does not switch the guard on in any consumer's CI.

## Definition of Done

- [ ] D5's checks RED on the old guard and GREEN on the new one, with the mutants recorded.
- [ ] Every test of this repository green; `plan-lifecycle` clean.
- [ ] The real-tree record on the PR: eight consumers, default branches, each new finding listed and read, CI activation stated.
- [ ] `common/test-leftovers-detail.md`, the guard's header and `research/` say what the guard reads and what it does not, and name D2's table.
- [ ] F30's entry says what shipped, with the piece rule and the class, for the template's owner.
- [ ] The real-tree comparison re-run immediately before the release, with its commits recorded.
- [ ] One release; the consumers' fixes merged first; the pin bumps, each alone.

## Plan gate

Round 1, session `73a0a295`, `proceed`, 1 of 2 reviewers (Antigravity out of quota). Finding 0 accepted: the real-tree comparison names its commits and runs again before the release. Finding 1 rejected, because its example reads an operand and the rule reads the joined literal.

The code gate on `f5b3b16` (4 of 8 reviewers): findings 0 and 2 accepted, one point: the eight-round cap. D1's scanner removes it. Findings 1, 3 and 4 rejected: finding 1 on the template's reading, findings 3 and 4 measured as found.
