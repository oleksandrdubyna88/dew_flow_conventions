# PLAN — every consumer's tests name what they leave behind `testsToDelete-…`

> Status: **plan only, nothing implemented yet (2026-10-14).** Scope: the test code, scripts and CI of the six
> consumers, plus one refinement of [common/test-leftovers.md](../common/test-leftovers.md).
>
> Related: [common/test-leftovers.md](../common/test-leftovers.md), [common/testing.md](../common/testing.md).

## Symptom

The owner, 2026-10-14: containers started by tests stay up for weeks and hold memory, CPU, ports and disk;
temp folders, worktrees and branches pile up the same way. The rule `common/test-leftovers.md` (shipped
2026-10-14) now requires a `testsToDelete-` prefix on everything a run creates outside its process, `--rm` on
hand-started containers, and Testcontainers' reaper left on. A read-only audit of `origin/main` of all six
consumers the same day found **0 compliant sites** — the rule applies from now, and this plan is the named
backlog ([common/planning-docs.md](../common/planning-docs.md)).

## What the audit found (facts, 2026-10-14)

| Repository | Sites | Missing prefix | No cleanup at all | Containers without `--rm` | Notes |
|---|---|---|---|---|---|
| `dew_flow_mcp` | 19 temp folders | 19 | **19** — no `Directory.Delete` anywhere in `tests/` (e.g. `tests/Mcp.Tests/DailyRunFileSinkTests.cs:92` `CreateTempSubdirectory("mcp-daily-log")`) | 0 | no Docker |
| `dew_flow_rag_qln` | ~15 temp + live stores | 15 | 2 | 0 | live-store Qdrant collections `qlntest_*` kept on purpose (fixed ids) |
| `dew_flow_benchmark` | 1 Testcontainers fixture, ~30 per-test DBs, ~45 temp/worktree/clone sites | all | ~8 files | 0 | `tests/Bench.Tests/Infrastructure/PostgresFixture.cs:28` Ryuk ON, unnamed; AppHost Postgres is a documented persistent container |
| `dew_flow_connect_other_ais` | ~650 temp sites (src_mcp ~330, rest ~320) | all | ~49 | 0 (`src_server/smoke-image.sh:105` has `--rm`) | **already has a prefix + sweep**: `shared/temp-sweep.json` (`coai-`, 10 min, `neverSwept` = product runtime dirs) read by `src_vs_code/scripts/run-tests.mjs` and `src_mcp/tests/TempDirsAreSwept.cs`; ~23 extension sites use other prefixes and escape it; `run-host.mjs` passes no `--user-data-dir` so the editor profile outlives a run |
| `dew_flow_creds_for_devs` | ~110 temp, 2 containers, 2 volumes, 1 compose project | all | ~35 | **2** — `.github/workflows/docker.yml:78` `docker run -d --name cv`, `:101-103` `cv-refused` + two volumes, removed on the success path only | `deploy/acme-test/state/` cleaned at the START of the next run |
| `dew_flow_sidecar_rust` | 9 temp definitions + model cache | 11 | 3 (`src/log_segments.rs:204` `bge-log-`, `src/testing.rs:167` `bge-seed-` pre-clean only) | 0 | removal not panic-safe in 7 definitions |
| `dew_flow_conventions` (own tools) | 34 mkdtemp + 3 worktrees + 2 branches | 37 | 0 | 0 | `tools/smoke-rules.test.mjs` registers worktrees named `<home>/wt` — leaf name does not carry the prefix |

## Decisions (taken with the question consultant, consult `5911b78a`, verified against the files)

1. **Migrate, do not alias.** Test-created names become `testsToDelete-<repo>-<what>-<id>`. A repo prefix is
   never registered as an alias of the rule: in coai `coai-` also names live product state (`neverSwept`),
   so a host-wide janitor matching `coai-*` would delete running chats. Each repo keeps its own helper and
   startup sweep (coai's `TempDir.For` + `temp-sweep.json`) and only changes the prefix the TESTS use; the
   product's `coai-` dirs and their own sweep stay untouched. During the migration the old repo sweep keeps
   matching the old prefix so existing leftovers are still collected.
2. **Rule refinement (one conventions change, both rule repos):** (a) a long-lived SHARED test database is
   exempt only when the place that creates or configures it names the exact database and endpoint, says the
   reuse is intentional, and resets it in a way serialized against concurrent runs; (b) databases created
   INSIDE a disposable Testcontainers container are exempt when their whole lifetime belongs to that
   container (no reuse, Ryuk on, explicit teardown). A startup sweep must not reclaim by age alone where a
   concurrent run can own the resource (precedent: benchmark's `PostgresRunStore` moved to owner-liveness).
3. **Order of value:** first what LEAKS (no cleanup, containers without `--rm`, success-path-only cleanup,
   worktrees a killed run leaves), then the rename.

## Build order — one epic per repository, each in that repository's own `todo/` and PR

1. **creds** — `docker.yml` containers/volumes: `--rm`, prefixed names, cleanup in an `if: always()` step;
   the ~35 no-cleanup temp sites; `acme-test/state/` removed at the end.
2. **mcp** — one disposable temp helper for `tests/`, 19 sites onto it, prefix `testsToDelete-mcp-`.
3. **sidecar_rust** — a `Drop` guard for test scratch dirs, prefix `testsToDelete-sidecar-`, the two
   pre-clean-only helpers removed after use.
4. **coai** — `temp-sweep.json` gains the test prefix `testsToDelete-coai-` (old `coai-` test literals still
   swept during migration); `TempDir.For` and the raw literals move; the two tests that pin `coai-`
   (`src_vs_code/src/test/sweepTemp.test.mjs`, `src_server/tests/TheTestSweepLeavesAJobAloneTests.cs`) are
   updated in the same change; `run-host.mjs` gets a throwaway `--user-data-dir`.
5. **benchmark** — `PostgresFixture` container named with the prefix; temp/worktree/clone sites; the ~8 files
   with no cleanup.
6. **rag_qln** — temp sites; the live-store test names documented as exempt under decision 2.
7. **conventions** — own tools' temp dirs and the `smoke-rules` worktree leaf `wt` → `testsToDelete-wt-…`;
   the rule refinement (decision 2), released and cascaded once.

## Test plan

Each epic proves itself with a RED-GREEN test per leak it fixes: a test that runs the fixture, kills or fails
it, and asserts nothing with the old name remains — and a structural test that every temp/container creation
in the repo's tests goes through the prefixed helper (break-it: one raw `mkdtemp` makes it red). The janitor
sweep from the rule is run on a machine after a full suite and must find only prefixed names.

## Definition of Done

- [ ] Every consumer's tests, scripts and CI create only `testsToDelete-…` resources (or a documented exemption).
- [ ] No container started by a test or script lacks `--rm` or an always-run cleanup.
- [ ] A structural test per repo keeps it that way.
- [ ] The rule refinement (decision 2) is in both rule repos and released.
- [ ] This plan is promoted to `research/` with its deviations.
