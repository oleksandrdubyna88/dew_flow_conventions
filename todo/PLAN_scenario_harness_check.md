# PLAN — `tools/scenario-check.mjs`, so the scenario-harness rule checks itself

> Status: **plan only, nothing implemented yet.** Scope: one new Node tool in `tools/`, its fixtures and
> its self-test cases, plus one CI line per consumer — adopted with `--warn` first, exactly as
> `post-deploy-check.mjs`, `http-coverage.mjs` and `gate-snippet-check.mjs` were.
>
> Related: [common/scenario-tests.md](../common/scenario-tests.md),
> [common/knowledge-base.md](../common/knowledge-base.md), [common/testing.md](../common/testing.md),
> [README.md](../README.md) — *`tools/` — the rules that check themselves*.

## The symptom

[common/scenario-tests.md](../common/scenario-tests.md) requires two things a repository either has or
does not: a scenario harness, and `research/module_tests.md` describing it. Nothing reads either.

This repository already knows what that costs. `common/planning-docs.md` described plan promotion for as
long as it existed, and by the time anyone counted, twelve implemented plans sat in `todo/`, one of them
asking in writing to be moved. The fix was not a firmer sentence — it was
[`tools/plan-lifecycle.mjs`](../tools/plan-lifecycle.mjs). A catalogue is worse than a plan folder in one
respect: a stale `module_tests.md` still *reads* as coverage, so its rot is invisible even to a reader who
opens it.

## Goal

A check that fails while a repository's own record of its scenario tests is absent, hollow, or claiming
coverage it cannot point at. It reads markdown and a little of the filesystem — no product code, no
toolchain — so one implementation serves the .NET, Rust and TypeScript consumers alike, for the reason
[README.md](../README.md) already gives.

## What it checks

Against the numbered rule in [common/scenario-tests.md](../common/scenario-tests.md):

| # | Finding | Rule |
|---|---|---|
| 1 | `research/module_tests.md` is missing | rule 7 |
| 2 | It names no harness location, or the in-repo path it names does not exist | rules 1, 7 |
| 3 | A separate-repository harness is named with no pin (no matching entry in `.gitmodules`) | rule 1 |
| 4 | It carries no run command block | rules 6, 7 |
| 5 | Its flow table is missing, or an entry is neither `covered` nor `not covered` | rule 4 |
| 6 | A `covered` entry names no test | rule 4, and the *Never* it belongs to |
| 7 | A `not covered` entry gives no reason | rule 4 |
| 8 | There is no *what this does not prove* section | rule 7 |
| 9 | `research/architecture.md` exists and never mentions the harness | rule 7 |

Deliberately **not** checked, and the plan should say so where the tool prints its help: whether the flow
list is complete. The rule requires it be derived from the product's own source of truth, and deriving it
means reading routes, verbs, tool names and contributed commands in three languages — that is the
`http-coverage.mjs` job for HTTP and belongs to the product's own suite for everything else. A checker that
guessed at completeness would be wrong in both directions and would be switched off for the false ones.

## Build order

1. `tools/scenario-check.mjs` — `parseCatalog(text)` and `inspect(...)` exported as pure functions, the
   CLI wrapper at the bottom, mirroring [`tools/post-deploy-check.mjs`](../tools/post-deploy-check.mjs)
   (`--warn` at `:47`, findings-to-exit-code at `:203`, the `import.meta.url` guard at `:211`). Paths that
   a flag names go through [`tools/lib/paths.mjs`](../tools/lib/paths.mjs) `within()`.
2. Fixtures under `tools/fixtures/scenario/` — one repository whose catalogue is clean, one whose entries
   are hollow (covered with no test, uncovered with no reason), one with a separate-repository harness and
   a `.gitmodules` pin, one with the same harness and no pin.
3. Cases in [`tools/selftest.test.mjs`](../tools/selftest.test.mjs) (41 today), each named after the
   guarantee.
4. README table row, beside the other five tools.
5. One CI line per consumer, `--warn`, added in the same pin-bump pull request.
6. The flag comes off per repository once its catalogue is honest — which is a decision per repository,
   not a flag day.

## Test plan

Every case runs against a fixture whose right answer is known, and two of them exist because
[common/testing.md](../common/testing.md) demands them of any scanning check:

- the **positive companion** — the clean fixture produces zero findings, so a pattern that stops matching
  everything cannot pass silently;
- the **known instance** — the hollow fixture's *covered with no test* row is found, which is the row the
  check exists for.

Plus: a catalogue whose table is formatted with padded pipes and one without; a `not covered` reason
written after an em dash rather than in its own column; a harness named as a path that does not exist; a
`.gitmodules` with the pin and one without.

## Definition of Done

- [ ] `tools/scenario-check.mjs` exists, exits 0 clean / 1 with findings / 0 under `--warn`, and prints
      what it does not check.
- [ ] Fixtures and self-test cases are committed; `node tools/selftest.test.mjs` is green.
- [ ] The README tool table names it.
- [ ] Every consumer runs it in CI with `--warn`.
- [ ] This plan is promoted to `research/` in the task that finishes it, per
      [common/planning-docs.md](../common/planning-docs.md).
