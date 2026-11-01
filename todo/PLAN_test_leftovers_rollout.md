# PLAN — every consumer's tests name what they leave behind `testsToDelete-…`

> Status: **stopped for re-review (2026-11-01): a second change after approval (see Plan changes).** Was: **plan only, nothing implemented yet (2026-10-14); split into seven epics 2026-10-15.** Scope: the test
> code, scripts and CI of the six consumers, plus one refinement of [common/test-leftovers.md](../common/test-leftovers.md).
>
> Related: [common/test-leftovers.md](../common/test-leftovers.md), [common/testing.md](../common/testing.md).

## Plan changes

> Epoch 1 · approved 2026-10-15 · by reviewers · state: stopped

- 1.1 · 2026-11-01 · reviewer · build-order, merge-conditions — E2's producer stage lands as five per-epic PRs, not one commit
  (the creds plan gate's split order on the re-split stories, session 0b24304d; consult 9d8564bb; dew_flow_creds_for_devs
  docs/test-leftovers-e2-stories at f61358b. This plan says a producer stage is the rename and port in one commit.)
- 1.2 · 2026-11-01 · reviewer · contract, build-order — E5's producer waits for a released raw-temp baseline rule
  (coai's plan gate refused a coai-only allowlist as a waiver of rule section 7, session 55ddb13b round 1 findings 0
  and 7; consult abcaae48 recommended changing the shared rule first. The rule change is being planned on branch
  feat/raw-temp-baseline (todo/PLAN_raw_temp_baseline.md); E5's producer merges after its release and a pin bump alone.)
  (This ledger opens at this change, as the rule says for a plan approved before it arrived. Changes made after the
  rule arrived on 2026-10-28 and before this ledger, such as the wave 1 re-split notes and the R6 owner decisions of
  2026-10-31, stay in the text where they were written.)

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
| `dew_flow_rag_qln` | ~15 temp + live stores | 15 | 2 | 0 | **corrected 2026-10-15:** the live tests reuse fixed ids, but the PRODUCT drops every `qlntest_*` collection on each sampler tick (`src/Rag.Application/Runtime/InfrastructureSampler.cs:104-109`) — the reuse and the sweep contradict each other (epic E7) |
| `dew_flow_benchmark` | 1 Testcontainers fixture, ~30 per-test DBs, ~45 temp/worktree/clone sites | all | ~8 files | 0 | `tests/Bench.Tests/Infrastructure/PostgresFixture.cs:28` Ryuk ON, unnamed; AppHost Postgres is a documented persistent container |
| `dew_flow_connect_other_ais` | ~650 temp sites (src_mcp ~330, rest ~320) | all | ~49 | 0 (`src_server/smoke-image.sh:105` has `--rm`) | **already has a prefix + sweep**: `shared/temp-sweep.json` (`coai-`, 10 min, `neverSwept` = product runtime dirs) read by `src_vs_code/scripts/run-tests.mjs` and `src_mcp/tests/TempDirsAreSwept.cs`; ~23 extension sites use other prefixes and escape it; `run-host.mjs` passes no `--user-data-dir` so the editor profile outlives a run |
| `dew_flow_creds_for_devs` | ~110 temp, 2 containers, 2 volumes, 1 compose project | all | ~35 | **2** — `.github/workflows/docker.yml:78` `docker run -d --name cv`, `:101-105` `cv-refused` + two volumes, removed on the success path only; `cv-refused` is read with `docker cp` AFTER it exits (`:113`), so it cannot take `--rm` (epic E1's carve-out) | `deploy/acme-test/state/` cleaned at the START of the next run |
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

## Build order

Superseded on 2026-10-15 by the `## Epics` section at the end of this plan. The first order put the rule
refinement last; the epic split moved it FIRST (E1), because every consumer's guard encodes its exemptions, the
creds smoke needs a carve-out from the `--rm` sentence, and one release pins once. The split also found that
coai pins the `coai-` prefix in THREE tests, not two (`src_mcp/tests/TempDirsAreSwept.cs:38`, `:65`, `:91` beside
the two named before), and corrected two audit rows above (rag_qln's swept `qlntest_*`, creds' `cv-refused`).
Question consultant consults: `5911b78a` (decisions), `8d33f035` (what is important for the split).

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

## The merged core revises E1 first (2026-10-21)

The plan [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md) (IMPLEMENTED 2026-10-27, promoted to `research/`) revises the contract E1 builds, so the consumer
epics now wait for ITS release, not for E1's. What it left open — S0 on every machine, the merge of PR #82, the private sibling's side and the ONE release —
is in [PLAN_test_leftovers_merged_core_release.md](PLAN_test_leftovers_merged_core_release.md); its R5 is the release and its R6 is the two-stage migration below. Named on both sides:

| Item | Built by | This plan's part |
|---|---|---|
| The contract text, helper, sweep, janitor and guard in their owner-scoped form | the merged-core plan | E2–E7 consume its one release (R5 of the remainder plan); E1's stories document was promoted by it as IMPLEMENTED on 2026-10-27 |
| The machine barrier, the merge of PR #82, the private sibling's side and the ONE release | [the remainder plan](PLAN_test_leftovers_merged_core_release.md) R1–R5 | E2–E7 start no producer stage before R5; their sweep-only stages need no release |
| The per-consumer rename, port and pin bump | epics E2–E7 here | Each epic splits into a sweep-only stage (its owner-blind sweeps replaced or disabled, no owner-form producer) and a producer stage (pin bump + rename + helper/guard port in one commit); all sweep-only stages land before any producer stage; the barrier checklist of the merged-core plan runs per machine before the first producer |

Order: the merged core first, then R1–R5 of the remainder plan, then the epics below. Disjoint: neither edits a consumer repository.

## Wave 1 — the stories re-split against the release (2026-10-31)

The owner runs the epics two repositories at a time: E3 + E4, then E5 + E2, then E6 + E7. Before any of them, every consumer's sweep-only stage is
recorded or merged (the barrier). The stories documents of E3 (dew_flow_mcp #53) and E4 (dew_flow_sidecar_rust #61) were written on 2026-10-16
against E1; an Opus delta check against `115bbf8` found the name, the creation order, the claim record, liveness, the sweep and the guard changed, so
both are re-split before any producer code. The entries below still say E1 and `testsToDelete-<repo>-…`: read them through
`common/test-leftovers.md` at `115bbf8` (`testsToDelete-<owner>-<repo>-…`). Three owner decisions of 2026-10-31 apply to every port, recorded in
[R6 of the remainder plan](PLAN_test_leftovers_merged_core_release.md): a pin bump may merge alone; a Windows kernel owner needs the profile AND the
owner SID; the `owner-blind` class in C# and Rust flags any bare-prefix literal outside the helper's file. E6 and E7.S3 wait for E3's merged producer
stage, not for "E3.S2".

**Wave 1 done, 2026-10-31:** E3 merged as dew_flow_mcp #58 (`4feb245`; its stories promoted to `research/` there) and E4 as
dew_flow_sidecar_rust #64 (`5478109`; promoted there). The reviews found defects the next C# ports (E2, E6, E7) must not copy back in:
an end-of-run audit matching folders by the shared `TESTSTODELETE_RUN` record deletes live siblings' folders; a guard that reads only
whole literals is fooled by split, escaped or concatenated spellings; a rename that is not exclusive (Rust `std::fs::rename` on Windows, and
POSIX `rename(2)`) replaces an empty directory; a quarantine suffix must be hex; a FIFO swapped in at a claim path must not block the read;
the hosted Windows runner is elevated, and the default owner of a new file differs by how it is created (measured both ways). Each repository's
promoted plan lists them in its Deviations.

## Epics

Seven epics, E = 7, so the cornerstone quota is Q = ⌈2·7/5⌉ = 3 ([common/subagent-models.md](../common/subagent-models.md)).
One epic per repository, as the build order says — with one change to that order: the shared contract goes
**first**, in this repository, and carries this repository's own tools with it. Every consumer epic depends on
E1 — and E2's C# helper story also on E3, which writes the family's C# helper first (cadence consultation,
2026-10-15); otherwise E2–E7 are ordered by what leaks most, and may run in parallel once E1 is released.

Each epic's stories are one document, written when that epic starts, in the repository the work lands in:
`todo/PLAN_test_leftovers_E<n>.md` there. E1's document was a sibling of this plan and is in `research/` since 2026-10-27; the six consumer
documents are cited as paths, not links ([common/planning-docs.md](../common/planning-docs.md) § *Across
repositories*), and each names this plan as its parent in return.

Every epic adopts the same three things, which E1 defines: an **owned-resource helper** (one per repository,
in its language: every test-created name comes from it as `testsToDelete-<repo>-<what>-<id>`, cleanup is
registered the moment the resource exists, teardown is exact — `using`/`finally`/`Drop`/`t.after` by the full
name, never by the prefix — and never throws on the way out); a **structural guard** (a test over `tests/`,
scripts and CI that fails on a raw temp/container/worktree/volume creation outside the helper, on a
hand-started `docker run` with neither `--rm` nor an always-run step that removes it by name, and on a
discovery that scanned nothing; exemptions are a list that names the site and the reason); and **proof by
test** (a RED-GREEN test per leak class, a failure/unwind test that throws or panics inside the scope and
asserts the resource is gone, and — wherever a sweep exists — a concurrent-owner-survival test that a
resource a live run still owns is not reclaimed).

### Why the contract is an epic of its own, and first

The plan's build order put the rule refinement last. Three things in the audit say it has to go first:

1. **Every consumer's guard encodes the exemptions.** Benchmark's per-test databases (decision 2b), rag_qln's
   shared stores (decision 2a) and creds' inspected-after-exit container (below) are all exemptions the
   structural guard has to recognise. Six guards written against the unrefined rule would each invent their
   own wording of the exemption, and the refinement would then be six PRs instead of one.
2. **The rule's `--rm` sentence is wrong for one real site.** `common/test-leftovers.md` § *Containers* says
   `--rm` for every container a script starts by hand. creds' refused-start smoke starts `cv-refused`
   detached (`.github/workflows/docker.yml:105`), waits for it to exit (`:110`), and then reads its log
   volume out of the exited container with `docker cp` (`:113`). With `--rm` the container is gone the moment
   it exits and the check cannot read it; and `--rm` never removes a named volume (`:101-102`). The rule needs
   the carve-out — *a container whose exited state, exit code or logs are read after it exits or fails runs
   without `--rm`, and an always-run step that comes AFTER the diagnostics are collected removes it and its
   volumes by their exact names (`docker rm -f -v <name>`, `docker volume rm <name>`)* — before creds can be
   made compliant. That is a contract decision, not a creds decision. (Plan gate 2026-10-15: `--rm` on a
   container that crashes at start also destroys the logs a failure needs, so the carve-out covers every
   container whose failure is diagnosed from its logs, not only the inspected-after-exit one.)
3. **One release, pinned once.** The refinement is released and cascaded once; consumers bump their pin as
   part of their own epic. Done last, every consumer would pin twice.

The refinement goes into `common/test-leftovers.md`, which is **not** a coai tier rule
(`dew_flow_connect_other_ais · src_mcp/runners/Context/RuleOrder.cs:153-163` lists the eight; the tier
spends 78 855 of coai's 80 000-byte budget, `src_mcp/tests/StageRulesTests.cs:148`). Nothing is added to
`common/testing.md` or any other tier file — not even a cross-reference sentence.

### E1 — the contract, the refinement, and this repository's own tools

- **Repository:** `dew_flow_conventions`. **Stories:** [research/PLAN_test_leftovers_E1.md](../research/PLAN_test_leftovers_E1.md) (IMPLEMENTED).
- **Goal.** `common/test-leftovers.md` says what every consumer's helper, guard and tests must do; it carries
  decision 2 (shared stores exempt only when named where configured, reuse intentional, reset serialized;
  databases inside a disposable Testcontainers container exempt for the container's lifetime), the
  concurrency sentence (*age selects, owner liveness authorises, uncertainty preserves* — a startup sweep
  never reclaims by age alone where a concurrent run can own the resource), and the inspected-container
  carve-out above. A release carries it, and this repository's own tools are its first adopter.
  Two more paragraphs, settled by the twin repository's plan gate (2026-10-15) so the two texts stay one:
  *a killed run's leftovers are collected, not only named* — every repository that creates a resource kind
  wires its own prefixed sweep into the START of its test run, authorised by owner liveness (Docker resources
  carry the owner as labels `testsToDelete.owner=<host>:<pid>:<process start time>`, folders an `.owner`
  marker, databases and queues their run id checked against the run's lock); and *one name, three spellings*
  — `testsToDelete-` for containers, volumes, networks, worktrees, branches and folders, `teststodelete-`
  where a namespace refuses capitals (image names, Kubernetes objects), `teststodelete_` for SQL identifiers,
  every guard and sweep matching the prefix case-insensitively and anchored.
- **Scope** (corrected by the E1 stories document, verified on origin/main 2be89ab). The 34 `mkdtemp` sites
  across 19 `tools/*.test.mjs` files, none prefixed — 27 cleaned via `t.after`, six via `try/finally`, and one
  that leaks today: `tools/smoke-rules.test.mjs:581` (`chg-`) removes its folder only at `:589`, so a failed
  assertion before that leaves it; plus two `tools/selftest.test.mjs` sites — `:371` creates `tmp-gate-` INSIDE
  the repository, where no temp sweep looks, and `:291` uses `process.env.TEMP ?? "/tmp"` instead of
  `os.tmpdir()`. The FOUR e2e worktrees `tools/smoke-rules.test.mjs:457`, `:476`, `:522`, `:558`, registered in
  this repository itself, whose leaf is `wt` under a `smoke-e2e-*` temp home (the sweep matches the leaf, so a
  killed run leaves a worktree it cannot find; removal is in `t.after`, which a kill skips); the fixed branch
  names `migrate-test` (`tools/migrate-rules.test.mjs:91`, `:111`) and `journal-failure` (`:195`), created inside
  temp repositories that die with them. One Node helper under `tools/lib/`, one guard `tools/leftovers-check.mjs`
  run as a test over the real repository (found by `node --test`), and a start-of-run sweep in
  `tools/run-tests.mjs` (today a bare `node --test`).
- **Constraints the stories document records.** `ownership-check` forbids family repository and product names
  in rule text, so precedents are anonymised; every rule-body edit re-records its sha with
  `node tools/rule-bodies.mjs --update common.test-leftovers`; the per-rule read cap is 32 KiB
  (`tools/lib/rule-cli.mjs:112`), the rule aims at ~12 KiB; committed guard fixtures named `*.test.mjs` would be
  run by `node --test`, so fixtures are written at runtime. An owner marker INSIDE an owned folder breaks real
  tests (a git repo initialised at the temp folder asserts its exact changed paths; a worktree with an untracked
  file is refused), so where the owner lives per resource kind is settled by S1's Fable spec — and E5 follows it.
- **Proven by.** The guard's break-it (one injected raw `mkdtemp` in a fixture makes it red; a scan that
  finds zero files makes it red); an unwind test (a test body that throws inside the helper's scope leaves no
  folder); the worktree test killed between `worktree add` and its `finally` leaves a leaf named
  `testsToDelete-wt-…` that the rule's own sweep script, run afterwards, removes; the sweep script itself run
  on a clean machine finds nothing and exits 0 (`pipefail` proven by a stopped daemon making it exit non-zero).
- **Risks.** The refinement's wording is what six repositories will encode; a sentence that reads two ways
  here is six guards that disagree. The carve-out must not become a loophole: "inspected after exit" has to
  require the always-run step, not merely permit dropping `--rm`.
- **Cornerstone area: yes** — see the ledger.

### E2 — creds: CI containers and volumes, then the temp sites

- **Repository:** `dew_flow_creds_for_devs`. **Stories:** `dew_flow_creds_for_devs · todo/PLAN_test_leftovers_E2.md`. Depends on E1.
- **Goal.** Every temp site goes through the helper; the acme state and the stub files are removed by the run that
  made them; and the CI smoke follows the E1 carve-out. On the GitHub-hosted runner the workflow uses
  (`.github/workflows/docker.yml:30`, `runs-on: ubuntu-latest`) every container and volume dies with the job's VM,
  so CI leaks nothing across jobs today; the CI part is therefore only the always-run exact-name cleanup step
  (correct on any runner that is not ephemeral — self-hosted, `act`, the steps run by hand) and a failure test that
  a failed smoke stays failed and never publishes.
- **Scope.** `docker.yml:78` — `cv` started with `-d --name cv`, removed only on the success path (`:92`;
  the health-wait at `:82-88` exits without removing it); `:101-102` two named volumes, `:105` `cv-refused`,
  removed at `:116-117` only after every assertion passed (the timeout branch at `:111` removes the container
  and not the volumes; the assertion failures at `:112` and `:114-115` remove nothing). Both containers get
  the prefix and stay WITHOUT `--rm` — `cv`'s logs are what a failed health wait needs, and `--rm` would
  delete them the moment a crashing container exits; one `if: always()` step that runs after the
  `docker logs` / `docker cp` diagnostics removes both containers and both volumes by their exact prefixed
  names (`docker rm -f -v`, `docker volume rm`) and never decides the job's verdict (the E1 carve-out). `deploy/acme-test/run.sh:54` wipes `state/` at the START of
  the next run; it is removed at the end of its own run as well (the bind mounts are
  `docker-compose.acme-test.yml:47-48`). The ~110 temp sites across the audit's ~35 files without cleanup
  (68 files create temp paths on `origin/main`), and the fixed-name stub files the
  `src_vs_code/scripts/*-itest.cjs` scripts write.
- **Shared pattern.** A Node helper (`src_vs_code`) and a C# helper (the server tests), both to the E1 contract;
  the C# one is copied by shape from E3's, so that story starts after E3 has landed; the guard scans
  `.github/workflows/*.yml` and `deploy/**/*.sh` as well as the test trees.
- **Proven by.** A failure test of the workflow: the smoke steps run against a stub image that fails the health
  assertion on purpose; the job ends FAILED, the always-run cleanup step ran (and removed the prefixed containers
  and volumes by exact name in the same job, observed before the VM goes), and `Publish` (`docker.yml:136-137`) is
  reported SKIPPED — the cleanup never turns a failed smoke green; the guard's break-it on a `docker run` without
  `--rm` and without an always-run remover; RED-GREEN per no-cleanup temp file class; unwind test for the helper.
- **Risks.** The workflow publishes `:edge` to ghcr.io on main; a wrong cleanup step that masks a failed smoke
  (an `if: always()` step that exits 0 after `docker rm` of a container that never ran) would green a broken
  image. The cleanup step must never be the step that decides the verdict.
- **Cornerstone: no** — the expensive decision (the carve-out) is E1's; what remains is mechanical and CI is repairable.

### E3 — mcp: one helper, nineteen sites, no cleanup today

- **Repository:** `dew_flow_mcp`. **Stories:** `dew_flow_mcp · todo/PLAN_test_leftovers_E3.md`. Depends on E1.
- **Goal.** `tests/Mcp.Tests/` creates nothing it does not remove, and everything it creates is named
  `testsToDelete-mcp-…`.
- **Scope.** The 19 `Directory.CreateTempSubdirectory("mcp-…")` sites across 11 files — e.g.
  `tests/Mcp.Tests/DailyRunFileSinkTests.cs:92`, `HealthTests.cs:61` and `:67`, `LogRetentionTests.cs:68` and
  `:117`, `SpoolUsageSinkTests.cs:133`, `:157` and `:175`, `WorkspaceToolTests.cs:285`, `:301` and `:402` —
  with no `Directory.Delete` anywhere in `tests/` (the only mention is the comment at
  `LogRetentionTests.cs:79`, which records that POSIX unlinks a file another process is still reading — the
  helper's dispose must therefore tolerate an open handle rather than throw). No Docker in this repository.
- **Shared pattern.** The first C# helper to the E1 contract. It is written once here and copied by shape, not
  by file, into E2's server tests, E5, E6 and E7 — the contract is shared; the code is per repository, as decision
  1 says. So E3 runs BEFORE E2's C# helper story (cadence consultation, 2026-10-15).
- **Proven by.** RED first: a test that creates a scratch folder through the old path and asserts it is gone
  after the test fails; GREEN after the helper; an unwind test; the structural guard with its break-it.
- **Risks.** Small. `SpoolUsageSinkTests.cs:157` appends `"\0x"` to a temp path to provoke a fault — the guard
  must still see the creation under the composed string.
- **Cornerstone: no.**

### E4 — sidecar_rust: a `Drop` guard for test scratch

- **Repository:** `dew_flow_sidecar_rust`. **Stories:** `dew_flow_sidecar_rust · todo/PLAN_test_leftovers_E4.md`. Depends on E1.
- **Goal.** Every test scratch directory is a `Drop`-owned value named `testsToDelete-sidecar-…`, removed on
  the unwind of a panic as on success.
- **Scope.** The nine `std::env::temp_dir()` sites: `src/compile_cache.rs:372`, `:429`, `:498`;
  `src/log_segments.rs:204`; `src/provider.rs:792`; `src/testing.rs:167`, `:195`; `src/tokens.rs:248`, `:264`.
  Two are pre-clean only — `log_segments.rs:205` and `testing.rs:168` call `remove_dir_all` before use and
  never after — and the other seven remove as a last statement, which a panic skips. Plus the model cache the
  audit named.
- **Shared pattern.** One `TestScratch` type in `src/testing.rs` (`cfg(test)`), `Drop` = exact removal that
  swallows an already-gone path; the guard is a test that reads `src/**/*.rs` under `#[cfg(test)]` and refuses
  a `temp_dir()` outside that file.
- **Proven by.** A `#[should_panic]`-style unwind test that panics inside the scope and, in a second test,
  asserts the path no longer exists; RED-GREEN for the pre-clean-only class; the guard's break-it.
- **Risks.** A `Drop` that runs while another thread still holds a file open on Windows fails the removal —
  the type must not panic in `Drop` (a panic during unwinding aborts the process). So `Drop` retries the
  removal a bounded number of times with a short back-off, then gives up WITHOUT panicking and writes one
  warning line; what it leaves still carries the `testsToDelete-sidecar-` prefix, so the rule's janitor
  collects it. A test holds a file open inside the scope (on Windows CI) and asserts both outcomes: no
  panic, and either the folder is gone or a prefixed folder remains for the janitor.
- **Cornerstone: no.**

### E5 — coai: move the test prefix without touching what the product owns

- **Repository:** `dew_flow_connect_other_ais`. **Stories:** `dew_flow_connect_other_ais · todo/PLAN_test_leftovers_E5.md`. Depends on E1.
- **Goal.** Tests create only `testsToDelete-coai-…`; the startup sweep collects both the new prefix and, for
  the migration window, the old `coai-` test literals; the product's `coai-*` runtime directories and their
  own sweep are untouched; nothing the sweep removes can be a directory a live run still owns.
- **Scope.** `shared/temp-sweep.json` (`prefix` `coai-`, `keepMinutes` 10, eight `neverSwept` product
  prefixes) read by `src_vs_code/scripts/run-tests.mjs:102-113` (`sweepFirst`, via `sweepTemp.mjs:32-35`:
  prefix, `neverSwept`, age — **age only**) and by `src_mcp/tests/TempDirsAreSwept.cs`. Three tests pin the
  literal: `src_mcp/tests/TempDirsAreSwept.cs:38` (`Prefixes = ["coai-*"]`), `:65`
  (`Rule.Prefix.Should().Be("coai-")`), `:91` (the `CreateTempSubdirectory("coai-…")` regex);
  `src_vs_code/src/test/sweepTemp.test.mjs:45`; `src_server/tests/TheTestSweepLeavesAJobAloneTests.cs:27`.
  `src_mcp/tests/TempDir.cs` is already the helper (`TempDir.For(prefix)`, never throws on dispose, clears
  read-only git files) and accepts any prefix — it gains a fixed one. The ~23 extension tests under other
  prefixes that escape the sweep today (`src_vs_code/src/test/baselineOnlyGrows.test.ts:32`
  `baselinegrows-`, `changelogNamesTheRelease.test.ts:52` `changelogguard-`, …); the ~49 sites with no
  cleanup; `src_vs_code/scripts/run-host.mjs:89` (`launchArgs` without `--user-data-dir`, so the editor
  profile outlives the run). The pin bump to the E1 release re-runs `StageRulesTests`.
- **Shared pattern.** The existing helper and the existing shared rule file, widened: `temp-sweep.json` gains a
  `testPrefixes` list (new and old), the three pinning tests assert the list, and the guard is the existing
  `TheTestSweepLeavesAJobAloneTests` and `TempDirsAreSwept` extended to the new prefix and to the extension
  tree.
- **Owner liveness — the mechanism, decided here (plan gate 2026-10-15).** Age alone is not enough: a run that
  lasts longer than the 10-minute window would lose its own folder to a second run's startup sweep. Every
  `testsToDelete-coai-…` folder the helpers create carries an owner marker (host name, process id, process
  start time — the start time defeats pid reuse) in the place E1.S1's spec fixes for folders — NOT inside the
  folder, because coai tests initialise git repositories in temp folders and assert their exact contents. The sweep
  (`sweepTemp.mjs` and `TempDirsAreSwept`) deletes a folder only when it is older than the window AND its
  owner is provably gone: the marker names THIS host and no process with that id and that start time is
  alive. A marker naming another host, an unreadable marker, or a live owner PRESERVES the folder. A folder
  with no marker at all (the old `coai-` test literals during the migration window) keeps today's rule —
  age only — because no live run of the NEW code creates an unmarked folder; that branch disappears when the
  window's end date passes. Benchmark's `WorkerLiveness` (`ThisHost`, `ProcessIsAlive`) is the shape.
- **Proven by.** Concurrent-owner survival: a `testsToDelete-coai-…` directory OLDER than the window whose
  marker names a live process survives the sweep (the case age alone gets wrong), and so does one with a
  foreign-host or unreadable marker; a `testsToDelete-coai-…` directory touched within the window and a
  `coai-chat-…` directory of any age both survive the sweep, while an old `testsToDelete-coai-…` and an old
  `coai-panel-…` are removed (the product dirs' own sweep is a separate test and is not changed); the three
  pinning tests go RED on the config change and GREEN with the list; the guard's break-it on an extension
  test with a new un-prefixed `mkdtemp`; a `run-host` test that the profile directory it passed is gone after
  the run.
- **Risks.** The sweep deletes from the machine's temp root by name; a prefix list that admits `coai-` without
  the `neverSwept` filter removes running chats, answers and server jobs — user data, unrecoverable. Two
  runners and three tests read one file; a change that reaches two of the three leaves a sweep nobody
  asserts. The old-prefix window needs an end date written into the config, or it never closes.
- **Cornerstone area: yes** — see the ledger.

### E6 — benchmark: the Testcontainers fixture, per-test databases, worktrees and clones

- **Repository:** `dew_flow_benchmark`. **Stories:** `dew_flow_benchmark · todo/PLAN_test_leftovers_E6.md`. Depends on E1.
- **Goal.** The fixture's container carries the prefix with Ryuk on; the per-test databases are documented as
  exempt under decision 2b, with the sentence beside the fixture; every temp folder, scratch worktree and
  clone a test makes is prefixed and removed; the AppHost's Postgres stays what it is.
- **Scope.** `tests/Bench.Tests/Infrastructure/PostgresFixture.cs:27-33` — `PostgreSqlBuilder` with no
  `.WithName`, disposed at `:56`; `:96` `NewEmptyDatabaseAsync` creates `^[a-z0-9_]{1,60}$` databases (`:101`)
  never dropped — they die with the container, which is decision 2b exactly, and the exemption is written
  there. The audit's ~45 temp/worktree/clone sites and ~8 files without cleanup (a wider grep finds 73 temp
  mentions in 48 files under `tests/`, `tools/`, `scripts/`). Worktrees are made by product code —
  `src/Bench.Infrastructure/Git/ScratchWorktree.cs:28` (`worktree add --detach --force`, removed at `:43`) and
  `GitCheckoutProvider.cs:265` — so tests that use them need a seam for the leaf name, not a copy of the
  command. `hosts/AppHost/AppHost.cs` documents its persistent data volume in its header; it is a reuse, not
  a leftover, and gets no prefix.
- **Shared pattern.** The C# helper from E3's shape; the guard scans `tests/` and `tools/`; the fixture's
  name is `testsToDelete-bench-pg-<id>` within Docker's length limit.
- **Proven by.** A fixture test that starts the container, kills the test process (a child-process harness),
  and asserts Ryuk removed a container named `testsToDelete-bench-pg-*`; a per-test-database test that the
  database is gone once the fixture is disposed; a worktree test killed before its `finally` whose leaf the
  rule's sweep then removes; RED-GREEN per no-cleanup file; the guard's break-it. The liveness precedent —
  `src/Bench.Infrastructure/Persistence/PostgresRunStore.cs:126` `SweepAsync`, authorising at `:256` with
  `WorkerLiveness.ThisHost` and `ProcessIsAlive` (`Process/WorkerLiveness.cs:12`, `:25`) — is product code
  and is not changed; it is cited by E1 as the shape.
- **Risks.** The container name must stay unique per process on a shared daemon (two suites on one machine);
  the seam for worktree names must not change the product's own naming in a benchmark run.
- **Cornerstone: no** — the ownership question is already answered in this repository's product code.

### E7 — rag_qln: the shared store's ownership, then the rename

- **Repository:** `dew_flow_rag_qln`. **Stories:** `dew_flow_rag_qln · todo/PLAN_test_leftovers_E7.md`. Depends on E1.
- **Goal.** A test corpus in the shared Qdrant store is dropped only when nothing alive owns it; the live
  tests' deliberate reuse is either exempt under decision 2a (named where configured, reset serialized) or
  abandoned on purpose — never both at once, as today; the test prefix is renamed in every place that pins
  it; temp sites go through the helper.
- **Scope — the contradiction the audit table missed.** The audit row says the `qlntest_*` collections are
  "kept on purpose (fixed ids)". They are not kept: the PRODUCT drops every collection starting with
  `qlntest_` on every sampler tick — `src/Rag.Application/Runtime/InfrastructureSampler.cs:104-109`, no age,
  no owner, *"nothing outside a test run owns that prefix"* — and `TestCorpusSweep.cs:9-10` states that as
  the contract (*the prefix is the contract, not the claim*), with
  `tests/Rag.Tests/Runtime/TestCorpusSweepTests.cs:52-56` asserting that a corpus of a live project is still
  swept. At the same time `tests/Rag.Tests/Integration/FastLaneLiveTests.cs:34-45` fixes its project ids so
  that *"every run after the first is INCREMENTAL"* — and passes `CollectionPrefix: "qlntest"` at `:74` (and
  `:181`), asserting the result starts with `qlntest_` at `:89`. So whenever the product runs beside the
  tests, the sampler deletes the reused collection within a tick, the incremental promise is void, and a live
  test that is mid-embed when the tick lands loses its corpus. The prefix lives in three places —
  `src/Platform.Contracts/InfrastructureModels.cs:111-114` (`TestCorpusPrefix.Value`), the sweep
  (`TestCorpusSweep.cs:24`, matched `StartsWith … OrdinalIgnoreCase` at `:32-34`), and the console sentence
  (`src/Rag.Ui/Pages/Infrastructure.razor.cs:48`) — and is pinned by eight test files
  (`TestCorpusSweepTests.cs`, `FastLaneLiveTests.cs`, `SearchLiveTests.cs`, `CollectionNamespaceTests.cs:58`
  and `:76`, `CollectionClaimTests.cs`, `Ui/InfrastructurePageTests.cs`). Qdrant's namespace decides whether
  the new prefix is `testsToDelete_qln_` or the lowercase form the rule allows. The temp sites: ~15, two
  without cleanup (`tests/Rag.Tests/Reliability/DailyRunFileSinkTests.cs:135`,
  `tests/Rag.Tests/Tools/ToolDescriptionSetTests.cs:86`), and the audit's `dewflow-*` `mkdtemp` sites in the
  extension tests.
- **Shared pattern.** The C# helper from E3's shape for temp folders; for the store, the E1 concurrency
  sentence applied to a sweep that lives in product code: the prefix still selects, a claim or liveness
  check authorises (`CollectionStandingVm.Claimed` already exists in `InfrastructureModels.cs`), and an
  uncertain standing preserves.
- **Proven by.** Concurrent-owner survival at the store: a prefixed collection with a live claim survives a
  sampler tick, an unclaimed old one is dropped, an unreachable standing drops nothing; the eight pinning
  tests go RED on the constant change and GREEN when every reader moves; the fixed-id live tests either
  assert their collection survives a tick (exempt, un-prefixed, documented beside `FastLaneLiveTests.cs:34`)
  or assert a fresh corpus per run and no leftover after it (prefixed, disposable) — one of the two, chosen
  by the spec; RED-GREEN for the two no-cleanup temp sites; the guard's break-it.
- **Risks.** The sweep runs inside the product against a store shared with real projects: a prefix check that
  loses its anchor, or a rename that leaves one reader on the old constant, deletes an index a project owns
  or sweeps nothing forever — the 22 GB incident the sweep exists for. A collection is gigabytes; a wrong
  drop is hours of re-indexing, and a drop during a live test is a flaky suite nobody can reproduce.
- **Cornerstone area: yes** — see the ledger.

### Dependencies and order

| Epic | Repository | Depends on | Why this place |
|---|---|---|---|
| E1 | conventions | — | the contract everyone encodes; the carve-out creds needs; one release |
| E2 | creds_for_devs | E1; E2.S3 (its C# helper story) waits for E3 | ~35 temp files without cleanup, the acme-test state and the stub files leak locally; CI containers die with the hosted job's VM (`docker.yml:30`), so CI needs only the always-run exact-name cleanup and a test that a failed smoke never publishes |
| E3 | mcp | E1 | nineteen sites, zero cleanup, no Docker: the smallest full adoption and the C# template — runs before E2's C# helper story |
| E4 | sidecar_rust | E1 — independent of the other consumer epics | seven not-panic-safe removals, two pre-clean-only; the Rust shape of the helper |
| E5 | coai | E1 — independent of the other consumer epics | the largest site count and a live-data sweep; needs the contract's concurrency sentence |
| E6 | benchmark | the merged-core release (R5); E6 waits for E3's merged producer stage (its C# helper ports E3's merged helper — E6's amended order; the producer stage is one PR since 2026-10-31) | the Testcontainers fixture and decision 2b's first use |
| E7 | rag_qln | the merged-core release (R5); E7.S3 waits for E3's merged producer stage | the shared-store contradiction must be settled before any rename, and needs 2a's wording |

### Cornerstone areas

The Fable spec of each marked story settles what a later round cannot cheaply repair:

- **E1, the contract.** Six repositories encode its wording in a guard; a sentence that reads two ways here is
  six guards that disagree, and the repair is six PRs. The spec settles: the helper contract in every language
  (name generation, cleanup registration, exact teardown, never-throw dispose); what the structural guard must
  refuse and how an exemption is written; the inspected-container carve-out so it cannot become a loophole;
  decision 2's two exemptions in words a guard can check; the concurrency sentence (*age selects, owner
  liveness authorises, uncertainty preserves*) and what counts as an owner in a temp root, a Docker daemon and
  a vector store.
- **E5, coai's sweep.** The sweep deletes from the machine's temp root; the product writes chats, answers and
  server jobs under the same root and the same first five characters; one file is read by two runners and
  pinned by three tests. A wrong prefix list removes user data that nothing can restore. The spec settles: the
  `temp-sweep.json` shape with new and old test prefixes and an end date for the old; how both runners and all
  three tests move in one change; how a directory a concurrent run owns is recognised (touched-within-window
  is the current answer; the spec says whether it stays sufficient); and that the product's own `coai-*`
  runtime sweep is out of scope and provably unchanged.
- **E7, rag_qln's shared store.** The sweep lives in product code and runs against a store that holds real
  projects' indexes; the test prefix is pinned in three product places and eight test files; the live tests
  reuse what the sweep deletes. The spec settles: whether the fixed-id live corpora are exempt (un-prefixed,
  documented, reset serialized against concurrent runs) or disposable (prefixed, fresh per run); how the
  product sweep authorises a drop beyond the prefix (claim, liveness, or a touched-within-window on the
  collection) and what it does when the standing is unknown; the exact new prefix under Qdrant's naming; and
  the one-change migration of every reader and every pinning test so no reader is left on `qlntest_`.

Cornerstones: 3 of 3 — E1.S1 (the contract text, model: fable), E5.S2 (coai's test sweep: temp-sweep.json, both sweeps, owner liveness, model: fable), E7.S2 (rag_qln's corpus ownership and drop protocol, model: fable).
