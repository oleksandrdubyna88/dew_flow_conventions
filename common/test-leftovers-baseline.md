---
id: "common.test-leftovers-baseline"
load: "conditional"
tasks: ["audit","policy","release"]
---
# The `raw-temp` baseline — one ratcheting file for sites inside an owned run folder

<!-- core:begin -->
The companion of `common/test-leftovers.md` (the core, whose §7 carries the sentence that authorises it) and
`common/test-leftovers-detail.md` (§7, the class `raw-temp` and the exemption grammar this is the second pass of):
the definition of the baseline, in full. It is read before writing, changing or reviewing a baseline file, and
by a guard's author. It is for ONE class; every other class keeps its rule and takes no baseline.

**The `raw-temp` baseline — a second pass, for that one class only.** A repository whose test runner makes an
owned, claimed run folder (§2) and points `TEMP`, `TMP` and `TMPDIR` at it before the first test may carry the
`raw-temp` sites under that runner in a baseline file instead of exempting each line. *Proven* is three things in
the tree, named by the file as a scope's proof: the runner makes the folder before the first test; a run that
cannot make it fails before any test; a test per assembly or package, ordered first, asserts that `TEMP` names the
run folder and carries `testsToDelete-baseline-proof: <scope root>`. The file — `{ "class": "raw-temp", "scopes":
[{ "root", "proof" }], "entries": [{ "file", "sha256", "line" }] }` — is a **multiset**: one entry per occurrence,
keyed by the file and the sha256 of the trimmed line; `line` is a hint, never a key. A guard reads it only when
told to, passes a key's occurrences up to its entries and no further, and finds an occurrence beyond them
(`raw-temp`) and, as `baseline`, an entry no line matches, an entry outside every scope, a scope whose proof is
missing, a class other than `raw-temp` and a malformed file. It **only shrinks**: an entry goes when its site goes;
after the file's first reviewed commit none is added or re-keyed, a check against the base ref refuses a new key,
a raised count, a new or wider scope, a changed proof and any creation but the first, and nothing regenerates it.

## The file

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

- `class` is exactly `raw-temp`; anything else is a `baseline` finding, and no entry is applied.
- `scopes[].root` is a repository-relative folder with a trailing `/`; `proof` is a file under that root, present in
  the scanned tree, containing the marker `testsToDelete-baseline-proof: <root>` for that exact root. A guard checks
  that the declaration is there; the reviewer of the baseline's creation checks the substance — the three things the
  proof names — and says so in the pull request.
- `entries[].file` is repository-relative with forward slashes and starts with some scope's `root`; `sha256` is the
  sha256 of the line with leading and trailing whitespace and any `\r` removed, so a re-indent or a line-ending
  change keeps the entry; `line` is a 1-based hint. Order is free; two entries with one key are two occurrences.
- No `count` field: a key's count IS its number of entries. No inline exemption clears a `baseline` finding: the
  fix is to remove the entry or the site. No command regenerates the file; the one writer is a person, in a
  reviewed diff that removes lines.

## What a guard does with it

It reads the file only when told to — never from the scanned tree. Per `raw-temp` hit, in line order, an entry with
that file and key passes it (a line that carries a valid exemption is exempt first and uses none); a hit beyond the
entries is a `raw-temp` finding. Once, after every file, it reconciles the whole baseline: every entry no line matched
— a visited file with fewer hits, a file whose hits fell to zero, a deleted file, a file never read — is a `baseline`
finding, as is an entry under no scope, a scope whose proof is missing or lacks its marker, a class other than
`raw-temp`, and a malformed or wrong-schema file (one finding at the file's line 1 naming the field, nothing applied).
An entry outside every scope, or under a scope whose proof does not hold, clears nothing. A path that cannot be read
is a usage error, not a finding.

## The ratchet

A check against the base ref (`--baseline-shrinks <path> --base <git-ref>` in the shipped guard) compares the working
file with the base's, by (file, sha256): a key that is new, a key with more entries, a scope whose root is not at
the base, a root wider than a base root, a changed proof, and any creation but the first are refused; a removed or
narrowed scope and a removed entry are shrinks; hints are ignored. A creation passes only with `--allow-create`, only
while the path has no history behind the base or on any other ref — a re-creation after the file existed is refused. An
unresolved base ref, or a shallow clone asked about a creation, is not a pass: the check fails closed naming the fetch
to run (`git fetch origin <base-branch> --depth=1`, `git fetch --unshallow`). A repository's CI runs it against
the pull request's base for every baseline file, whatever language the baselined tree is in. A file at zero entries is
deleted with its last entry; a repository with none ships none.

## Never

- Never put another class in a baseline, or an entry that would clear another class.
- Never add, re-key or regenerate an entry after the file's first reviewed commit; never widen a scope or change a proof.
- Never read a baseline found in the scanned tree; a guard reads only the one it is told to.
<!-- core:end -->
