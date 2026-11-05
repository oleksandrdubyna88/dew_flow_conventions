# PLAN — F30: the shipped Node guard reads a prefix however it is spelled

> Status: **plan only, 2026-11-05.** The item is F30 of `todo/PLAN_test_leftovers_merged_core_followups.md`. Owner: this repository. Deadline 2026-11-19, or before creds' E2.5 merges if that is earlier. Not a prerequisite of coai's E5 producer PR.

## Goal

`tools/leftovers-check.mjs` finds a legacy name or an owner-blind pattern when a file builds the prefix from pieces on one line, so a repository's zero for `legacy-name` and `owner-blind` means zero, and not "zero whole literals". The classes, the exemption grammar and the rule text do not change.

**Done when:** every spelling of the table below is a finding on its exact line; no line of a consumer's real tree gets a finding it did not have, except the lines listed under *What changes in the consumers*; one release is cut; the pin bumps follow, each alone.

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

## Decisions

**D1. One new file, `tools/lib/leftovers-fold.mjs`.** It exports `foldLine(line, extension)`, which answers `{ text, literals }`. `text` is the line with each literal decoded and joined; `literals` are the joined contents. It is a SPELLING reader of one line, as the C# template's `GuardLiterals`. It is not data flow: a name built from a variable, across lines or at run time is not seen, and the guard's text says so.

**D2. What it folds, by file kind.**

| Kind | Literals | Joins | Decoding |
|---|---|---|---|
| `.mjs .cjs .js .ts .mts .cts` | `'…'`, `"…"`, `` `…` `` | `+`; `.concat('a', 'b')` on a literal; `['a', 'b'].join('')`; `${'a'}` holes that hold only a literal | `\uXXXX`, `\u{…}`, `\xXX`; a one-character class `[T]` |
| `.sh` | `'…'`, `"…"`, `$'…'` | adjacent quoted strings with no space between them | in `$'…'`: `\xXX`, `\uXXXX` |
| `.ps1` | `'…'`, `"…"` | `+`; `-join` over a literal array | none |
| workflows `.yml .yaml` | read as `.sh`, for lines that hold a quote | as `.sh` | as `.sh` |

A template hole that holds anything but a literal stays as it is, so `${LEGACY_WORD}x` is not a word, and folding never invents one.

**D3. Which classes read the folded line: `legacy-name` and `owner-blind` only.** `raw-temp` reads the API call, as F30 says, and a fold there would turn a test's planted fixture pieces into sites. The other classes do not read names built this way.

**D4. How they read it.** On a line that holds a quote, and only when `text` differs from the raw line:

- `legacyNameHits(text)` runs on the folded text.
- `classifyLine` runs on the folded text; `broad` is `owner-blind`.
- The bare word (the template's `BareWordHits`): a literal that holds the whole word and is followed by neither the owner form nor an allowed word is `owner-blind`, even with no removal on the line. This covers the unanchored regex string and the bare word, which folding alone leaves at `[]` (the epoch-6 judge's note).
- The piece rule: a JOINED literal of `literals` that holds a crossing piece of 6 or more, any case, and not the whole word, is `owner-blind`. It reads what D1 joined, and never an operand: `'testsTo' + 'Delete-u1000-coai-x-'` is one literal holding the whole word in the owner form, so it is no piece and no finding.

A finding on a line is counted once per class, whichever reading found it. An exemption works exactly as it does today: `legacy-name` takes an inline exemption, and `owner-blind` takes only the allowlist.

**D5. The acceptance check.** Two checks, both in `tools/leftovers-check.test.mjs`, both RED first.

1. **The table of spellings:** each row an exact line in a fixture, an expected class, because the count depends on the line (the judge's note). It holds at least the sixteen spellings of F30: `+`, `.concat`, `.join('')`, a template hole, `\u`, `\x`, a one-character class, half of the word, the bare word, an unanchored regex string, `rmSync` over a joined prefix, and the whole-literal and glob rows that already work. Plus `.sh` adjacency and `$'…'`, and `.ps1` `+` and `-join`.
2. **No false finding:** a table of real product words and paths that must stay `[]`: `restore`, `history`, `todo/PLAN_x.md`, `hostStopped`, `chatModelEdits`, `snapshotsToPrune`, `tellClientsToCatchUp`, a `${LEGACY_WORD}x` hole, and an owner-form name split over `+`.

**The real trees, by hand, recorded on the PR:** the guard at this branch against each consumer's current head, with the finding list compared by class and file to the same guard at the current release. Each new finding is listed and read. The record names each consumer's exact commit and the command. **The same command runs again immediately before the release, against each consumer's head at that moment, and the release waits until any difference is read** (plan gate, finding 0).

**D6. The guard's own files.** `EXCLUDED_FILES` already excludes the guard's two test files. Each other file of this repository that holds the pieces on purpose (for example the sweep's quarantine word in `janitor.sh` and `tools/lib/*`) is listed in one new frozen list, `FOLDING_ALLOWANCES`, with a test that every listed file exists and still needs its place, as the template's `FoldingAllowances`. Nothing else is allowed by name. A consumer has no such list: it uses the exemption grammar.

**D7. The size.** `tools/leftovers-check.mjs` is 643 lines and stays under 800. The reader goes in its own file.

## What changes in the consumers

- **creds:** `src_vs_code/src/test/leftoversSites.test.ts:74` builds `'testsTo' + 'Delete-agent-'` so the file does not find itself. It becomes a finding. It is fixed in creds by the rule's way, a plain literal with the inline `legacy-name` exemption, **in a PR that merges before creds' pin bump**. Otherwise the bump goes red.
- **coai:** none measured at the piece rule. The folded reading may add lines the rough search cannot see; D5's real-tree record decides. coai's `testLeftovers.test.mjs` N8 pins only what is detected, so it stays green.
- **Any other new finding** from D5's record is listed in this plan before the release, with its fix in that consumer.
- **The sentence "zero whole literals, F30 open"** in E5, E2 and their PRs stays true until each repository pins the release. E2.5 then reads "zero".

## Order

1. This plan through the plan gate. The F30 entry's piece rule is corrected with the measure, in the same PR as the code.
2. RED: D5's two tables, seen failing on the current guard. A Sonnet coder builds it, on `feat/f30-folding-reader`. Then the reader, then D5's real-tree record.
3. The code gate and an independent Opus review. The PR, CodeRabbit, the merge.
4. The consumer fixes D5 found, each in its repository.
5. One release. The pin bumps follow, each alone. **A new release needs the pin bumps in seven repositories, and that is over the cap of three open PRs: the owner's agreement on 2026-11-05 covered release `bd79584` only, so it is asked for this release.**

## What this does not do

- It does not read across lines, follow a variable, or run anything.
- It does not change `raw-temp`, the baseline, the exemption grammar or the C# template.
- It does not close the two limits named in E5's PR: the inline `raw-temp` rows' proofs stay as they are.

## Definition of Done

- [ ] D5's two tables RED on the old guard and GREEN on the new one; a check that the first table goes RED with the reader switched off.
- [ ] Every test of this repository green; `plan-lifecycle` clean.
- [ ] The real-tree record on the PR: seven consumers, each new finding listed and read.
- [ ] `common/test-leftovers-detail.md` says what the guard reads and what it does not, and `research/` records the measure.
- [ ] F30's entry says what shipped, with the corrected piece rule.
- [ ] The real-tree comparison re-run immediately before the release, with its commits recorded.
- [ ] One release; the consumers' fixes merged first; the pin bumps, each alone.

## Plan gate

Round 1, session `73a0a295`, `proceed`, 1 of 2 reviewers (Antigravity out of quota). Finding 0 accepted: the real-tree comparison names its commits and runs again before the release. Finding 1 rejected, because its example reads an operand and the rule reads the joined literal; the plan now says so, and an owner-form split is a row of D5's second table.
