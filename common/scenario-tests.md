---
id: "common.scenario-tests"
load: "conditional"
tasks: ["implement","test","audit","policy"]
---
# Scenario tests — every repository has a harness of its own, and every flow is in it (MANDATORY)

> [testing.md](testing.md) governs how a test is written, run and believed. This rule governs what must
> **exist**: one harness per repository that drives the product the way its users drive it, written in the
> product's own language, kept in git, and described in `research/module_tests.md` — including the flows it
> does *not* cover.
>
> It is a rule about an artefact rather than a habit, because the two failures below were both invisible to
> a habit. Each of them happened while every unit suite in the family was green.

## Why this is mandatory

Both cases are already recorded in [testing.md](testing.md); this rule is what follows from them.

- **A route unreachable in every released build.** `/v1/use/exportEnv` — the route grammar rejected a
  capital letter, so the `env` verb had never worked from any client. There was a generated contract file
  and a test on each side asserting its own tables matched that file. Both green. Nothing had ever sent the
  request, and the first end-to-end run found it in seconds.
- **A whole measurement series silently degraded.** The retrieval engine began emitting a new funnel stage;
  the benchmark's contract refused a funnel it did not know, so every white-box measurement fell back to
  black-box for days. The live check that would have caught it on the day **already existed** — nobody had
  run it against a live counterpart.

The first says a repository needs a tier of test that exercises the real thing. The second says owning one
is not enough: it has to be named, catalogued and run.

## The rule

1. **Every repository has a scenario harness.** Two legitimate homes, and the choice is about who is
   measured, not about size:
   - **Inside the repository** — a suite beside the unit tests (`tests/<Product>.Scenarios`, a `#[test]`
     module driving the binary, a `src/test/` suite launching the extension host) that starts the product
     and uses it.
   - **A repository of its own** — the shape to take when the harness measures the product from *outside*
     and must be able to measure other things too. `dew_flow_benchmark` is this family's example: it drives
     a retrieval engine over the engine's real surface, it is a git repository in its own right, and the
     product pins it as a submodule, so a product commit names the harness commit that exercised it. That
     pin is the point — a separate repository without one leaves two moving trees and no way to say which
     harness produced a given result.

2. **Written in the SAME language as the product it drives.** A C# product gets a C# harness, a Rust one a
   Rust harness, a TypeScript one a TypeScript harness. This is not taste:
   - a harness in the product's language can hold the product's **own types and entry points**, so a
     renamed field or a changed enum is a compile error rather than a scenario that quietly stops matching;
   - it uses the toolchain CI already has, so running it is a line in a workflow rather than a second
     ecosystem to install and keep alive;
   - it is edited by the people who edit the product, in the same review, in the same task.

   The shared Node tools in [`tools/`](../tools) are not a counter-example: they read markdown, not code,
   and they measure the *rules*, not any product.

3. **A scenario is a real flow, end to end.** What a user or a peer system actually does: a request over the
   wire to a running server, a CLI invocation with its real arguments, a tool call through the transport a
   client uses, an extension command from the command palette, an indexing pass over a real repository.
   Test doubles are for the collaborators a scenario genuinely cannot have — a paid API, hardware that is
   not on the machine, a third party's server. **Never for the subject.** A harness that substitutes the
   thing under test has become a second unit suite with a longer runtime.

4. **Every flow is covered, and the flow list is DERIVED, not typed.** Enumerate the flows from the source
   of truth the product already holds — the registered routes, the CLI verbs, the tool names, the
   contributed commands — the way [testing.md](testing.md) requires of any list a test repeats. A flow added
   without a scenario must be visible; a hand-written catalogue goes stale in exactly the direction that
   keeps it green.

   **A new flow ships with its scenario in the same task**, on the same terms as
   [testing.md](testing.md)'s *Every feature ships with tests*. A flow that cannot be covered yet is
   recorded as uncovered **with its reason** — an honest gap is a finding, a silent one is a lie the
   catalogue tells for months.

5. **All of it is under git** — the suite, its fixtures, its sample data, and the exact command that runs
   it. Nothing that decides whether the product works may live only on somebody's machine, in a shell
   history, or in a chat message. A separate-repository harness is under git by construction; the pin is
   what puts it under *this* repository's history.

6. **The harness RUNS, on a named cadence.** Where it can run in CI it runs in CI. Where it cannot — it
   needs a GPU, a paid model, a deployed target — `research/module_tests.md` says **when** it is run and
   **who** runs it, and a release is not cut without it. An existing, unrun check is what the second case
   above cost days to learn.

7. **`research/module_tests.md` is the record, in every repository.** Fixed name, so a reader looking for
   the tests of an unfamiliar repository has one place to look and a check has one thing to read. It
   carries:
   - **where the harness is** — a path in this repository, or the harness repository named and the pin it
     is fixed at (cross-repository citations are paths, not links: a relative link that resolves on one
     machine is worse than a citation that names its source);
   - **how it is run** — the exact command, identical to the one CI runs; if they can disagree, the
     workflow is the thing to fix;
   - **the flow catalogue** — every flow, each `covered` or `not covered` with a reason, and the test that
     covers it;
   - **what it does NOT prove** — the collaborators that are doubled, the environments never exercised, the
     scenarios out of scope. This section is the most valuable one and the first to be dropped;
   - **when it runs**, per point 6.

   `research/architecture.md` names the harness in its module map, and when the harness is a separate
   repository the relationship belongs there too — it is cross-repository interaction, which
   [knowledge-base.md](knowledge-base.md) already requires be written down.

## What this does not replace

Unit tests keep doing what they do; a scenario harness is slower, coarser and worse at localising a defect,
and a repository that answers this rule by deleting its unit suite has made itself harder to debug for no
gain. Nor does it replace the `.http` contract suites of [http-contracts.md](http-contracts.md) or the
post-deploy checks of [post-deploy-checks.md](post-deploy-checks.md) — those are narrower instruments with
their own tools, and where a repository has them they are part of how its flows are exercised, not a
substitute for having a harness at all.

## Adoption

A repository that has no harness today does **not** start by writing tests. It starts by writing
`research/module_tests.md` with the derived flow list and every entry marked honestly — most of them
`not covered` on day one. The catalogue is what makes the gap a countable number instead of a feeling, and
the tests then close it flow by flow, highest-traffic first.

Same reasoning as the `--warn` adoption of the shared tools in [the README](../README.md): a requirement
that goes red on the day it lands teaches people to switch it off.

## Never

- Never call a suite a scenario harness when it replaces the subject with a double. It tests the double.
- Never write the harness in a second language because it is quicker to script — that is the drift
  [logging-serilog.md](logging-serilog.md) already documents the cost of, in a place where a compile error
  is the only warning you get.
- Never keep a harness, a fixture or a run command outside git.
- Never let `research/module_tests.md` claim coverage the catalogue cannot point at — an entry marked
  covered names its test, or it is not covered.
- Never leave a separate-repository harness unpinned by the product it measures.

## Definition of Done

- [ ] The repository has a scenario harness — in-repo, or its own repository pinned by the product.
- [ ] The harness is written in the product's language and drives the real product, not a double.
- [ ] Its flow list is derived from the product's own source of truth, and any flow added in this task
      shipped with its scenario.
- [ ] The suite, its fixtures and its run command are committed.
- [ ] `research/module_tests.md` exists and names: where the harness is, the exact run command, every flow
      with `covered`/`not covered` and a reason, what the harness does not prove, and when it runs.
- [ ] `research/architecture.md` names the harness, and the cross-repository relationship where there is
      one.
