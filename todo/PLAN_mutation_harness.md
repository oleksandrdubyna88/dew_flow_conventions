# PLAN — mutation checking becomes a harness, not a habit

> Status: **plan only, nothing implemented yet.** Scope: `tools/` in this repository — the checks the
> six consumers run, and the tests that are supposed to have teeth.
>
> Related docs: [common/testing.md](../common/testing.md),
> [research/module_tests.md](../research/module_tests.md).

## Where this came from

Raised by a reviewer during the code round on `release-distance` (2026-09-14) and **approved by the
operator as its own task**. The finding was precise and correct: `common/testing.md` says a check that
matches nothing passes for ever, and the evidence that these checks do not is *prose in
`research/module_tests.md`* — "removing the age bound turns exactly that case red" — rather than
anything a machine re-runs. Prose records that somebody did it once. It cannot notice when a later
edit makes a test toothless.

It was deferred rather than rejected because adopting a harness for one tool would leave one tool with
a harness and six with prose, which is the same inconsistency the action-pinning task avoids.

## The symptom, stated exactly

Every scanning tool here has been mutation-checked by hand: break one predicate, run the suite, see
which case goes red, restore, re-run. That is the right technique and it has already earned its keep —
it is how `build-flags-check`'s three detections were shown to be real, how the `160000` gitlink mode
check in `pin-check` was shown to be load-bearing, and how `promote-release`'s absent-run refusal was
shown to fail exactly four cases and no others.

But none of it is re-run. A test whose assertion is weakened next month — matching a fragment instead
of the whole condition, asserting a substring that survives the break — goes on passing, and the only
thing that would catch it is somebody doing the same manual dance again and remembering what the
answer used to be.

This repository has already been bitten by the general shape: *structural assertions must pin the
whole condition* is a rule here because five source-reading tests once survived their own break.

## What "done" looks like

`npm run mutate` applies a recorded list of single-token mutations to the tools, runs the suite for
each, and asserts that **exactly the recorded cases go red** — not merely that something did.

That last clause is the whole design. A harness that only checks "some test failed" is satisfied by a
suite that fails for an unrelated reason, which is how a mutation harness becomes decorative. The
recorded expectation is a set of test NAMES per mutation, and a mutation that reddens a different set
is a finding, in either direction:

- **fewer** cases red → the test that used to cover it has lost its teeth;
- **more** cases red → a mutation is reaching further than it was believed to, which is usually a
  missing abstraction rather than a bad test.

## Shape

`tools/mutants.json` — a list of `{ file, find, replace, expect: [test names] }`, seeded from the
mutations already performed and recorded in `research/module_tests.md`:

| file | mutation | expected red |
|---|---|---|
| `pin-check.mjs` | drop the `160000` mode comparison | *a path committed as a directory…* |
| `pin-check.mjs` | read `.gitmodules` from the worktree instead of HEAD | *an uncommitted .gitmodules edit…* |
| `promote-release.mjs` | accept an absent ci run | 3 process cases + `judgeRuns` unit |
| `promote-release.mjs` | stop the pager after page one | *a failed ci run on the SECOND page…* |
| `promote-release.mjs` | drop the read-back wording | *a refused push says where release actually is* |
| `release-distance.mjs` | drop the age bound | *a release whose commit is old FAILS…* |
| `build-flags-check.mjs` | disable `-m` detection / `-noautorsp` detection / the missing-file branch | one case each |

`tools/mutate.mjs` applies each to a COPY of the tree (never the working tree — a harness that edits
files in place and crashes leaves a broken repository), runs `node --test`, collects the failing test
names, and diffs against `expect`.

## Build order

1. `tools/mutate.mjs` + its own test, over a two-file fixture with a known-toothless test, so the
   harness is shown to catch the thing it exists for before it is pointed at the real tools.
2. Seed `tools/mutants.json` from the table above; run it and reconcile every disagreement — the
   disagreements are the interesting output of this task, not a formality.
3. Wire `npm run mutate` into CI as a **separate, non-blocking job** first. It runs the whole suite
   once per mutation, so it is minutes rather than seconds; a scheduled nightly job is the likely home,
   not the pull-request path.
4. Replace the prose claims in `research/module_tests.md` with a pointer to the recorded mutations,
   keeping the STORIES (why each mutation matters) and dropping the assertions a machine now makes.

## Risks

- **Runtime.** Each mutation is a full suite run; the suite is ~180 cases and about 40 seconds. Twelve
  mutations is ten minutes. That is why it is nightly and not a gate, at least to begin with.
- **A mutation that does not compile** is not a passing mutation — the harness must distinguish "the
  suite failed to load" from "the expected cases went red", or every syntax-breaking mutation reads as
  a success.
- **The expectation file becomes a second source of truth** that can drift from the tests. It is small
  and it is checked on every run, which is the mitigation, but it is a real cost and worth saying.

## Definition of Done

- [ ] `npm run mutate` exists, and fails when a recorded mutation reddens the wrong set of cases.
- [ ] Its own test proves it catches a deliberately toothless test.
- [ ] Every mutation already recorded in prose is in `tools/mutants.json`.
- [ ] A syntax-breaking mutation is reported as an error, never as a pass.
- [ ] `research/module_tests.md` keeps the reasoning and stops making claims a machine can make.
