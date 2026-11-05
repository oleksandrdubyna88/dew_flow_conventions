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
