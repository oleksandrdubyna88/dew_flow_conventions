# Testing

## Running tests — executables only, never `dotnet test` (MANDATORY)

Every .NET test project in this family is **xUnit v3 on native Microsoft Testing Platform**. There is no
`Microsoft.NET.Test.Sdk` and no VSTest `testhost`, so `dotnet test` aborts with a `testhost.deps.json`
error — a tooling mismatch, not a test failure. **Never** run it, and never report its output as a test
result. An MTP project builds into a self-contained runner executable; build, then run that. Each repo's
`CLAUDE.md` and CI workflow name the exact paths — CI runs exactly those commands, and if a change makes
them disagree, the workflow is the thing to fix.

Runner flags are xUnit v3 MTP syntax — **not** VSTest (`--filter "FullyQualifiedName~X"` does not exist):

| Need | Flag |
|------|------|
| One test method | `--filter-method "*MyTestName*"` |
| One class | `--filter-class "*MyTests"` |
| One namespace | `--filter-namespace "Some.Tests.Area"` |
| Exclude | `--filter-not-method` / `--filter-not-class` / `--filter-not-trait` |
| Enumerate without running | `--list-tests` |
| Global timeout | `--timeout 5m` |

The Rust sidecar runs `cargo test` — the executables-only rule is about the VSTest mismatch and is
.NET-specific. Everything below applies everywhere.

## Every feature ships with tests, in the same task

Happy path plus the failure and edge paths the feature introduces. A feature without tests is not done
and is not committed. Say in the summary what was added and what the runner printed.

## A green suite is not evidence about a CROSS-REPOSITORY contract (MANDATORY)

Two repositories that agree on a wire or file format each hold a copy of the names. Two suites can be green
while the contract is broken, because **each compares its own list against itself**.

This is not hypothetical. The retrieval engine began emitting a `collapse` stage; the benchmark's contract
defined seven names and refuses a funnel naming an eighth, so **every** white-box measurement silently
degraded to black-box — days after the two lists had been reconciled by hand. Both suites stayed green
throughout. The check on the emitting side compared a hand-typed array of seven names to seven literals; an
added constant could not fail it.

So, for every contract that crosses a repository:

1. **Enumerate, never retype.** The side that EMITS asserts its list by reading the type — reflection over
   constants, not a literal array a human keeps in step. A name added without a contract entry must break the
   build where the emitter lives.
2. **One live check compares the two sides for real**, against a running counterpart, and **fails on
   degradation** rather than accepting it. A consumer that falls back to a lesser mode "with a reason" is
   doing the right thing at run time and the wrong thing in a test.
3. **Run that check.** The benchmark's live test already asserted exactly this and would have caught the
   break on the day — nobody had run it against a live engine.
4. **Reconciling by hand is what failed.** Do not propose it as the fix.

## A test can only inspect what is PRESENT

A test that examines artefacts — assemblies in an output folder, files on disk, rows in a store — is only as
strong as what happens to be there. Removing two dead references disarmed a boundary guard here: the
assemblies it inspected were reaching the test output *through* those references, and deleting them left the
assertion with nothing to look at.

It caught itself, which is the good outcome. Make the subject arrive **deliberately** — a test-only reference
with a stated reason — so the guard depends on an intention rather than an accident. And say in the test what
it does NOT prove: a check that only asserts a negative passes vacuously when the thing it guards does not
exist yet.

## A test must leave a shared store as it found it

Never mint a per-run identity — a random project id, a fresh collection name, a new database — in a store
other runs share. Measured here: nineteen abandoned vector collections from test runs, plus three from a
rename, held **22 GB of 24 GB** in Qdrant. Each run had installed one more and nothing ever removed them.

Use a FIXED identity per scenario, so runs reuse one artefact instead of multiplying it. The side effect is
better than the fix: consecutive runs then exercise the incremental path, which is the one users meet daily.

Two assertions usually need rewriting when you do this — anything that says "this run created N" is about the
run's history rather than the guarantee under test. State the guarantee instead, or the test passes once and
fails forever after.

## Passes alone, fails in the suite — that is a SHARED-STATE defect, never a flake (MANDATORY)

The reflex is to re-run it, watch it go green, and move on. That reflex is how an architectural defect
ships. Measured here on 2026-08-16, the day of the reliability audit: a benchmark commit was verified
green — 415 tests, 0 failed — and the same binaries in the other configuration failed
`A_cell_stranded_by_a_dead_host_is_handed_back` with `Expected report.Requeued to be 1, but found 2`.
In isolation the test passed. It was not flaky, and it was not one bug but two:

- the test asserted a **global count** where the store's sweep has no run filter, so a sibling test's
  stranded cell was counted too — the "this run created N" mistake named two sections above; and
- the sweep it was testing decided purely on ELAPSED TIME, with no ownership check — which had been
  harmless while the sweep was dead code and became live that same morning, in a system whose design
  invites several workers. The interference in the suite was the only visible symptom of it.

So, when a test passes alone and fails in the suite:

1. **Do not re-run it hoping.** Read what the two runs share — a database, a directory, a port, a
   static, a clock, a GPU. The failure is a message about that shared thing.
2. **Suspect the code before the test.** A test that is only correct when it runs alone is often
   describing a subject that is only correct when it runs alone, and the production system will not.
3. **Fix the assertion to state the guarantee**, not the run's history — then the test stops depending
   on what else exists, and starts depending on what must be true.

## A green suite proves only the configuration you ran

The run above was green in Release and red in Debug on the same source. Whatever differs between your
configurations — optimizations, assertions, timing, test ordering, parallelism — differs for the code
under test too. Run the whole suite in the configuration the fix will actually ship in, and when a
change touches concurrency, ordering, or shared state, run both. Reporting one configuration's green
as "the suite passes" is the same overstatement as reporting a subset's.

## Every bug fix starts with a RED test (MANDATORY)

The order is fixed — never fix first and test after:

1. Write the test that reproduces the defect, named after the guarantee a user expects.
2. **Run it and watch it FAIL** — and confirm the failure message describes the real symptom, not a
   setup error. A test that errors for the wrong reason proves nothing.
3. Fix the code.
4. Run it again and watch it pass.
5. Run the whole suite.
6. **Report both observations** — the step-2 failure message and the step-4 pass. "Tests pass" alone is
   not evidence.

**If the fix already landed**, prove the test has teeth: revert the fix, watch the test go red with the
real symptom, restore it, confirm green.

## Name the guarantee, and give a refuted approach a shape

A test name states what must be true — `First_position_is_balanced_across_the_whole_matrix_at_an_odd_repeat_count`,
not `Bug123Test`.

Where a guard exists because a specific plausible approach was **measured and refuted**, reproduce that
approach inside the test so the defect is visible in the suite rather than only in a commit message
(`dew_flow_benchmark`'s `MatrixOrderTests.The_naive_per_repeat_rotation_would_deal_two_to_one_and_that_is_the_point`
is the reference shape). A future reader who thinks the guard is over-engineering meets the reason
immediately.

## Architecture is a test, not a review comment

Repos with layer rules assert them in an `ArchitectureTests` that reads assembly references. A violation
is a red build. Do not relax it to make a reference convenient — the reference is the problem.

## Scope

- No test is needed where there is no observable behaviour (a comment, formatting, a pure rename) — say
  so explicitly in the summary when skipping.
- If a defect seems untestable, prefer making it testable (extract the decision into a pure function)
  over skipping.

## Definition of Done

- [ ] The runner executable was used; `dotnet test` was not.
- [ ] New behaviour has tests; a fix has a test that was observed failing for the real symptom.
- [ ] Both observations are in the summary.
- [ ] Test names state guarantees.
- [ ] The WHOLE suite was run, in the configuration that ships — and in both when the change touches
      concurrency, ordering, or shared state.
- [ ] No failure was dismissed as flaky: a test that passes alone and fails in the suite was traced to
      the state the two runs share.
