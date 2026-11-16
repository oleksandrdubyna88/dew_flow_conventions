# PLAN — F41: `container-scoped` becomes an exemption kind of its own (the rule and the shipped Node guard)

> Status: **IMPLEMENTED, 2026-11-16.** #171 merged (`b1746499`), `release` promoted to it, the pin bump merged in all nine consumers (benchmark #216, mcp #82, sidecar_rust #81, vscode_kit #35, wsl_care #199, creds #372, amd_r9700 #37, rag_qln #121, coai #1004). Deviation: entry 1.1 (the provisions live in the companion rule `common/test-leftovers-exemptions.md`, loaded by the detail's `depends`; the detail's body is unchanged). The C# half, F42, merged as mcp #81.
>
> Was: Status: **epoch 1 open, 2026-11-16: built and through its gates — plan gate `a4ec9471` (proceed, five findings folded in), code gate two rounds (proceed; three findings accepted, one rejected as a false positive with a run), an independent Opus review (nine points applied); entry 1.1 (the companion rule). PR open; the release (a promotion with nine pin bumps) follows the merge.** Branch `fix/f41-container-scoped` from `main` `739affe`. Parent:
> `todo/PLAN_test_leftovers_rollout.md` § *Epoch 9* item 4.2 and row F41-a; the follow-up F41 in
> `todo/PLAN_test_leftovers_merged_core_followups.md`. One PR, docs and code. The release (a promotion with pin bumps in
> all nine consumers, allowed by the owner on 2026-11-16 after a fresh check for releases in flight) is a separate step
> after the merge. The C# template's half is F42, in mcp.

## Plan changes

> Epoch 1 · approved 2026-11-16 · by reviewers · state: open

- 1.1 · 2026-11-16 · agent · approach — the rule text goes into a companion rule, `common/test-leftovers-exemptions.md`, loaded by the detail's `depends`, because the detail is at its size cap (6 bytes of headroom) and its intro may not be trimmed
  (Found by the coder: the detail's body was 31962 of 31968 bytes, a cap from the read limit, and every pre-split line
  must stay verbatim, so the plan's "§6 (b) and §7 say so" in the detail itself did not fit; the coder had condensed the
  detail's 7-line intro, which drops rule text. Asked of the question consultants (`7f0817ef`): both against trimming;
  codex: a companion delivered through `depends` (frontmatter is outside the measured body, `tools/lib/rule-body.mjs`
  `bodyOf`, read). The detail stays byte for byte; the core's §6 sentence points to the companion. First change of
  epoch 1.)

## Goal

The marker rule §6 (b) prescribes is accepted by the shipped Node guard, and only for what §6 (b) exempts.

## The defect (measured at `8ae5eb6`, whose guard equals the release `4c9a684`)

Rule §6 (b) (`common/test-leftovers-detail.md:246-252`, `common/test-leftovers.md:83-84`) prescribes
`testsToDelete-exempt: container-scoped — <what> lives and dies with <fixture or job>`. §7's grammar accepts only a class
of its own table, so `scanText("tests/X.cs", <the marker>)` gives one `exemption` finding ("an exemption names an unknown
class `container-scoped`"); over a `DROP DATABASE bench_case` line it gives that finding and `shared-store`. Written as
`shared-store`, the same reason is refused for having no `lock:`. Benchmark (E6) needs the marker beside its fixture's
per-test databases, and writes it in the plural: "the per-test databases live and die with the PostgresFixture
container".

## Decisions (the parent's § *Epoch 9* item 4.2, approved by the plan gate `b6933e14` and an independent Opus review)

1. **The form does not change:** `testsToDelete-exempt: container-scoped — <reason>`.
2. **Valid** when the general reason rule holds (ten characters, three words, not a placeholder) AND the reason names an
   owner after `live and die with` or `lives and dies with`: after an optional article (`the`, `a`, `an`, `its`,
   `this`, `that`), a word of at least two characters that is not itself an article. "… lives and dies with the" names
   no owner and is one `exemption` finding whose sentence says what is missing (the plan gate, round 1).
3. **A declaration.** A valid marker with no finding beside it is clean.
4. **It clears one class, `shared-store`,** on its own line and the next (the reach `isExempt` already has), and only
   when the hit is the container database's own teardown: `DROP DATABASE`, `DROP SCHEMA`, `FLUSHDB`. A `DROP TABLE`,
   `TRUNCATE`, `FLUSHALL` or `deleteMany({})` stays `shared-store`: a reset that is not the container's own teardown
   needs (a)'s `lock:` or a per-run name. `sharedStoreHit` returns only the matched text today; the exemption test must
   also know which pattern hit (a kind returned with the hit, or a separate helper that keeps `sharedStoreHit`'s
   contract), so it can tell a teardown from a reset; every caller of `sharedStoreHit` is read first (decision 7).
   **What the guard cannot know:** that the dropped database is the container's. It reads a spelling, not data flow
   (its own header says so), so `DROP DATABASE production_db` under a valid marker is clean too. The marker is the
   author's declaration, read by the code review; the lifetime is proved by the consumer's fixture test (benchmark's
   E6-f2). The rule's §7 says this limit in words (the plan gate, round 1).
5. **It never clears** `ryuk-off` or `owner-blind` (they refuse every exemption), nor `docker-run`, `docker-name`,
   `raw-temp`, `raw-worktree` or `legacy-name`: a fixture's container is still named in the owner form (§5).
6. **"Exempt from the name" needs no guard change:** an unprefixed `CREATE DATABASE` and a workflow `services:` already
   give no finding (run by the independent review).
7. **The smaller code change wins** between adding the kind to `EXEMPTIBLE` and keeping a separate list of declaration
   kinds: the coder greps every importer of `EXEMPTIBLE` and `readExemptions` and every caller of `sharedStoreHit`
   first, and keeps each exported name's meaning for its current importers.

## Files

- `tools/leftovers-check.mjs`: the kind in the exemption reader (`EXEMPTIBLE` or a sibling list), `exemptionProblem`,
  the `shared-store` exemption test, the header comment that lists the classes and the grammar, the `shared-store` cure
  text (it names the new kind).
- `tools/leftovers-check.test.mjs`: the scenarios below.
- `common/test-leftovers-detail.md` §6 (b) and §7's grammar paragraph; `common/test-leftovers.md` §6's sentence if its
  words must match. `tools/test-leftovers-rule.test.mjs` stays green. Frozen fixtures of older rule versions
  (`tools/fixtures/*-<sha>.md`) are history and are not edited.
- Every other document that describes the guard's grammar (found by `git grep -n -e 'exemption grammar' -e 'unknown
  class' -e EXEMPTIBLE`), updated in the same commit.
- `todo/PLAN_test_leftovers_merged_core_followups.md` F41: a progress line; `todo/README.md`: this plan's row.

## Test scenarios

RED first: each new test of NEW behaviour runs and fails against `main`'s guard before the code changes; then GREEN;
then RED again with only the code change reverted. A scenario of UNCHANGED behaviour (N15, and the classes that stay
red under the marker where `main` is already red) passes before and after; it pins that the change does not widen the
exemption. Each scenario names its expected class.

Clean:
- P1 the marker alone, `lives and dies with the X fixture`. P2 the plural, `live and die with the PostgresFixture
  container`.
- P3 the marker over `DROP DATABASE bench_case`, in a `.sh`, an `.mjs` and a `.cs` path the `node` profile reads. P4
  over `DROP SCHEMA bench_case`. P5 over `FLUSHDB`. P6 on the same line as a `DROP DATABASE`.

Red:
- N1 a reason with `lives and dies with` and no word after it → `exemption`. N2 a placeholder reason (`todo`) →
  `exemption`. N3 no reason → `exemption`. N4 a reason with neither spelling → `exemption`.
- N5 over `TRUNCATE TABLE users` → `shared-store`. N6 over `FLUSHALL` → `shared-store`. N7 over `deleteMany({})` →
  `shared-store`. N8 over `DROP TABLE users` → `shared-store`.
- N9 two lines above `DROP DATABASE bench_case` → `shared-store`.
- N10 over `docker run alpine` (no `--rm`) → `docker-run`. N11 over `docker run --rm --name web alpine` → `docker-name`.
  N12 over `TESTCONTAINERS_RYUK_DISABLED=true` → `ryuk-off`. N13 over `rm -rf /tmp/testsToDelete-*` → `owner-blind`.
  N14 over `mkdtemp(` → `raw-temp`.
- N15 the `shared-store` exemption without `lock:` stays an `exemption` finding (unchanged).
- N16 a reason ending `… lives and dies with the` → `exemption`. N17 the marker over `git worktree add x HEAD` →
  `raw-worktree`. N18 the marker over a legacy prefixed name (`testsToDelete-agent-x-1`) → `legacy-name`.
- P7 `DROP DATABASE production_db` under a valid marker → clean: the stated limit of decision 4, pinned so that a later
  change to it is a decision, not an accident.

Whole repository: the guard over this repository gives the same result as on `main`; the repository's full test suite
passes.

## What this does not do

The C# template (F42, mcp); the release and the nine pin bumps; a shared reading of Testcontainers reuse or of Ryuk set
through `SetEnvironmentVariable` (F43, a pointer).

## Definition of Done

- [ ] The scenarios pass, RED-GREEN-RED recorded in the PR.
- [ ] The rule text and every document describing the grammar say the same thing.
- [ ] `node tools/plan-lifecycle.mjs` is clean.
- [ ] coai's plan and code gates resolved; an Opus review passed.
- [ ] CI green on the head; merged.
