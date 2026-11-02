# PLAN — every consumer's tests name what they leave behind `testsToDelete-…`

> Status: **epoch 2 open (2026-11-01), approved by the owner after the re-review.** Epoch 1 stopped at its second change after
> approval (2026-10-31; see Plan changes); the stop was recorded on 2026-11-01 and the work done between the two is sorted in the
> re-review's table. The whole plan was revised on 2026-11-01 against what is known now (§ *Epoch 2 — the plan as revised at the
> re-review*); its plan gate passed (coai session `fd58afe4`, four findings accepted), and because the record says `Narrowed: yes`
> the owner approved it.
> Was: **plan only, nothing implemented yet (2026-10-14); split into seven epics 2026-10-15.** Scope (revised 2026-11-01):
> the test code, scripts and CI of the six consumers, migrated onto the RELEASED merged core (`release` at `105d53c`,
> every consumer pinned there) in two stages per repository — the sweep-only stage first, the producer stage after the
> machine barrier — plus two rule changes on this repository's side: the refinement E1 shipped, and a `raw-temp`
> baseline rule E5's producer waits for (not written yet as of this commit).
>
> Related: [common/test-leftovers.md](../common/test-leftovers.md) (the core),
> [common/test-leftovers-detail.md](../common/test-leftovers-detail.md) (the detail; where the two differ the detail
> decides), [common/testing.md](../common/testing.md),
> [PLAN_test_leftovers_merged_core_release.md](PLAN_test_leftovers_merged_core_release.md) (R1–R7, the owner decisions),
> [PLAN_test_leftovers_merged_core_followups.md](PLAN_test_leftovers_merged_core_followups.md) (F1–F20),
> [research/PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md) (the contract as built).

## Plan changes

> Epoch 1 · approved 2026-10-15 · by reviewers · state: closed

- 1.1 · 2026-10-31 · owner · build-order — the epics run two repositories at a time: E3 + E4, then E5 + E2, then E6 + E7
- 1.2 · 2026-10-31 · owner · merge-conditions — a pin bump may merge alone (R6 of the remainder plan)
  (The plan should have stopped here. The stop was not recorded until 2026-11-01; the work done after it, among it
  the E3 and E4 merges of 2026-10-31, the Darwin path and the R7 pin bumps, is sorted in the re-review's table.)
- 1.3 · 2026-10-31 · owner · contract — a Windows kernel owner needs the profile AND the owner SID, fail closed (R6)
- 1.4 · 2026-10-31 · owner · contract — the owner-blind class in C# and Rust flags any bare-prefix literal outside the helper's file (R6)
- 1.5 · 2026-10-31 · agent · build-order — E6 and E7.S3 wait for E3's merged producer stage, not for E3.S2
- 1.6 · 2026-11-01 · reviewer · build-order, merge-conditions — E2's producer stage lands as five per-epic PRs, not one commit
  (the creds plan gate's split order on the re-split stories, session 0b24304d; consult 9d8564bb; dew_flow_creds_for_devs
  docs/test-leftovers-e2-stories at f61358b. This plan says a producer stage is the rename and port in one commit.)
- 1.7 · 2026-11-01 · reviewer · contract, build-order — E5's producer waits for a released raw-temp baseline rule
  (coai's plan gate refused a coai-only allowlist as a waiver of rule section 7, session 55ddb13b round 1 findings 0
  and 7; consult abcaae48 recommended changing the shared rule first. The rule change is planned on branch
  feat/raw-temp-baseline (todo/PLAN_raw_temp_baseline.md). E5's producer merges only after this plan's re-review and
  its new approval, that rule's release and a pin bump alone.)
  (This ledger opened on 2026-11-01. The rule reached this repository on 2026-10-29 (#86), so the changes of
  2026-10-31 are entries, as CodeRabbit noted on #105; the ones before 2026-10-29 stay in the text where they were written.)

### Re-review for epoch 2

Narrowed: yes — E5's producer PR may merge with the structural guard green-by-baseline on `raw-temp` (sites proven to run inside an owned run folder, a shrinking multiset the released rule at 105d53c does not allow), which is a smaller merge condition for that PR than the approved "guard at zero on every class"; the goal and the Definition of Done are not smaller, because the drain of that baseline to zero stays inside E5's done-when, and the prerequisites got WIDER (a second rule release, the owner's Windows barrier record, the F16 disposition)

| Work | Where | Verdict | Action |
|---|---|---|---|
| E1 — the contract, the Node helper, the sweep, the guard, #77 `2c96f83` | main, released in `115bbf8` | fits | kept — superseded in place by #82 and released; one sentence it wrote is stale: `README.md:265` says the start-of-run sweep removes what is "unmarked and old" — corrected in a NEW PR (note 1) |
| the merged-core plan #81 `3c82772` (a plan, no code) | main | fits | kept |
| the merged core #82 `72ae2f3` — owner segment, kernel ownership, three-valued liveness, one janitor | main, released in `115bbf8` | fits | kept — the contract epoch 2 is built on |
| R3 record and F10–F13 parked, #88 `f9eca26` | main | fits | kept |
| F13 — the clock-tick rate from `AT_CLKTCK`, rule §3's one-child bound, #89 `6c3ebfc` | main, released in `115bbf8` | fits | kept |
| F12 — the scan and the guard trace a prefix held in a variable, #90 `2602416` | main, released in `115bbf8` | fits | kept |
| R4 record #91 `115bbf8` (the sha `release` was promoted to) | main, released | fits | kept |
| R5 record #92 `58e3f46`; R6 wave-1 record #93 `f46982f`; R6 sweep-only record #95 `c31f69d`; the barrier opened, wave 1 merged #100 `7852de2` | main | fits | kept — #93 records entries 1.1–1.4 and #100 the wave-1 merges; decision 4 adopts both |
| F17–F20 — the Node reference hardened, #101 `f996b68` | main, released in `105d53c` | fits | kept — decision 5 rests on it |
| the core/detail split of `common/test-leftovers.md`, #102 `105d53c` | main, released (the current `release`) | fits | kept |
| the `## Tokens` row `r9700`, #103 `bec3df7` | main, unreleased (`release-distance` 1) | fits | kept — rides the next promotion (P2's release, question 4) |
| R7 record and the Darwin helper merged, #104 `2d12d8f` | main | fits | kept |
| dew_flow_mcp — E3 stories #53 `6457540`; pin `115bbf8` #57 `d2e62cf`; E3 producer stage #58 `4feb245`; the Darwin path #59 `197cc76`; pin `105d53c` #60 `142d8d2` | main of dew_flow_mcp | fits | kept — the C# template (§ *Epoch 2* item 1); no unmarked or legacy folder is removed by age; #60 also carries the guard's fix for the moved `## Tokens` table; #58 checked (a)–(d) on one machine (note 2) |
| dew_flow_sidecar_rust — E4 stories #61 `17b18b3`; pin `115bbf8` #63 `1f55ebc`; E4 producer stage #64 `5478109`; pin `105d53c` #66 `e58be09` | main of dew_flow_sidecar_rust | fits | kept — the sweep keeps unmarked and legacy folders at any age; #66 also carries the guard's fix for the moved `## Tokens` table; #64 checked (a)–(d) on one machine (note 2) |
| dew_flow_benchmark — pin `115bbf8` #120 `44acabc`; E6 stage A (the held-out sweep lists, never removes) #125 `6a963a4`; pin `105d53c` #136 `0e0bdd8` | main of dew_flow_benchmark | fits | kept — #125 is E6's stage A (lists, never removes a prefixed entry); its age removal of un-prefixed `score-tmp/*` is a question for E6's stories |
| dew_flow_creds_for_devs — pin `115bbf8` #287 `5ea09e7`; pin `105d53c` #289 `47724fd` | main of dew_flow_creds_for_devs | fits | kept |
| dew_flow_rag_qln — pin `105d53c` #78 `2936537` (no `115bbf8` bump: it went from an older pin straight to `105d53c`) | main of dew_flow_rag_qln | fits | kept |
| dew_flow_connect_other_ais — pin `105d53c` #936 `df375eb` (no `115bbf8` bump) | main of dew_flow_connect_other_ais | fits | kept — its doc figure is corrected on #938 |
| dew_flow_vscode_kit — pin `105d53c` #20 `7cab547`; wsl_care — pin `105d53c` #182 `23859c4` with the `ActWindowsTests` clock fix (no `115bbf8` bump in either) | main of each | fits | kept — the `ActWindowsTests` clock fix is outside this plan |
| dew_flow_connect_other_ais #938 — the link target resolved root-down (the doc figure found while pinning #936; the resolved-root walk E5 cites) | pushed, unmerged (open PR) | fits | kept open — work outside this plan (a security fix, no owner-form producer); merges on its own gates, the stop does not hold it |
| dew_flow_connect_other_ais #850 — E5 stories re-split against `105d53c`, plan gate `proceed`, branch `docs/test-leftovers-e5-stories` at `2c64601a` | pushed, unmerged (open PR) | fits | kept open, unmerged until epoch 2 is approved; fix forward on its branch: cite the F16 disposition (§ *Epoch 2* item 4) (decided (b)) in place of its open Q6 |
| dew_flow_creds_for_devs #253 — E2 stories re-split against `105d53c`, plan gate `proceed`, branch `docs/test-leftovers-e2-stories` at `f61358b` | pushed, unmerged (open PR) | fits | kept open, unmerged until epoch 2 is approved; fix forward on its branch: its delta-table row still says stage B is "ONE squash-merged pull request", against its own D8 (five); cite the F16 disposition once chosen |
| the stop commit `b54adf6` and the ledger correction `6b74a19` (entries 1.1–1.7, state stopped) | pushed, branch `docs/rollout-stop-for-rereview` (PR #105), unmerged | fits | kept — merges before or with epoch 2's line; this branch builds on it |
  (This re-review covers ALL seven entries of epoch 1: the owner's four of 2026-10-31 (1.1–1.4), the agent's one (1.5) and
  the two reviewer entries of 2026-11-01 (1.6, 1.7). The stop belonged at 1.2 on 2026-10-31 and was recorded on 2026-11-01;
  every row above dated 2026-10-31 or later — E3 #58, E4 #64, the R7 release #101/#102 and its eight pin bumps, mcp #59, the
  coai #850 and creds #253 re-split branches — is work done after that unrecorded stop, and is sorted here, not excused.
  The Verdict and Action columns were filled by an Opus judge (step 5 of the full stop; the note below). Not rows: #86 and #87
  (the plan-change-control rule, outside this plan), #99 (rule parity, outside this plan), and the re-review commit
  itself, which is the baseline epoch 2 is approved on, never an entry. The raw-temp baseline plan is outside this plan, not a row.)
  (Judged 2026-11-01 by an Opus judge against § *Epoch 2*: 23 rows fit, none is cut. The E3 and E4 merges and mcp #59 came after the unrecorded
  stop of entry 1.2; the content fits the revised plan, the timing is the breach the stop record already names. Note 1: the code and the rule
  never remove an unmarked folder; only that README sentence, left by #77 and not updated by #82, still says so. Note 2: #58 and #64 checked
  (a)–(d) on the operator's WSL machine only; P1's record says whether the owner's Windows machine builds or tests mcp and sidecar_rust.)

> Epoch 2 · approved 2026-11-01 · by owner · state: open

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

The audit's figures were re-counted by each stories document as it was written; where a stories document counts
differently, its count binds that epic (E2: about 40 files hold a leak or a fragile site, not ~35, and the C# side is five
projects; E5: every `src_mcp` and extension run already makes ONE run folder since coai #897, so the ~650 sites are mostly
INSIDE it).

## Decisions (taken with the question consultant, consult `5911b78a`, verified against the files)

1. **Migrate, do not alias.** Test-created names become `testsToDelete-<repo>-<what>-<id>`. A repo prefix is
   never registered as an alias of the rule: in coai `coai-` also names live product state (`neverSwept`),
   so a host-wide janitor matching `coai-*` would delete running chats. Each repo keeps its own helper and
   startup sweep (coai's `TempDir.For` + `temp-sweep.json`) and only changes the prefix the TESTS use; the
   product's `coai-` dirs and their own sweep stay untouched. During the migration the old repo sweep keeps
   matching the old prefix so existing leftovers are still collected.
   *Revised by the merged core (2026-10-21) and the re-review (2026-11-01):* the name is
   `testsToDelete-<owner>-<repo>-<what>-<id>` (rule §1); the last sentence is **superseded** — the contract forbids
   collecting by age, so an old-prefix sweep is retired, not kept (E5's stage A), and old names that never carried the
   prefix are removed once, by hand, by the owner (recorded per machine, as E3 and E4 did).
2. **Rule refinement (one conventions change, both rule repos):** (a) a long-lived SHARED test database is
   exempt only when the place that creates or configures it names the exact database and endpoint, says the
   reuse is intentional, and resets it in a way serialized against concurrent runs; (b) databases created
   INSIDE a disposable Testcontainers container are exempt when their whole lifetime belongs to that
   container (no reuse, Ryuk on, explicit teardown). A startup sweep must not reclaim by age alone where a
   concurrent run can own the resource (precedent: benchmark's `PostgresRunStore` moved to owner-liveness).
   *Shipped* as rule §6 (a) and (b) and §4 at `115bbf8`; the private sibling's copy confirmed (R4).
3. **Order of value:** first what LEAKS (no cleanup, containers without `--rm`, success-path-only cleanup,
   worktrees a killed run leaves), then the rename.
   *Revised by the barrier (2026-10-27):* before either, every consumer's SWEEP-ONLY stage, because an owner-form
   producer beside an owner-blind or age-based sweeper is the failure the barrier exists for.
4. **A pin bump may merge alone** (owner decision 1 of R6, 2026-10-31; entry 1.2); **the Windows kernel owner in a PORTED helper
   is judged by both keys** — the profile AND the owner SID, either unreadable fails closed (decision 2; entry 1.3); **the
   `owner-blind` class in C# and Rust source is checked on literals, no tracer** (decision 3; entry 1.4); the epics run two
   repositories at a time, E3 + E4, E5 + E2, E6 + E7 (entry 1.1), and E6 and E7.S3 wait for E3's MERGED producer stage (entry 1.5).
5. **Node consumers WRAP and RUN the shipped reference, never port it** (decision 11 of the merged core; R7): F17–F20 were
   fixed in the reference once for every Node consumer. The C# consumers COPY E3's helper by file (with its Darwin path);
   the Rust consumer is E4's own.
6. **A producer stage's shape** (the re-review, 2026-11-01, accepted from the re-review consultant `681b5cfe` and checked
   against E2's D8 and E5's D8): a producer stage lands in ONE pull request or in STACKED, independently gated per-epic
   pull requests; **every merged prefix of the stack supplies ownership, teardown and start-of-run collection for every
   resource it introduces, and never restores unsafe sweeping.** The barrier evidence is on the FIRST producer PR before it
   merges; a pin bump merges alone; after each epic the shipped guard is RUN and its remaining findings are recorded on
   that epic's PR as migration evidence attributed to the untouched backlog — never turned into exemptions; the
   whole-repository enforcement switches on in the LAST epic. Wave 1's one-PR shape and E2's five-PR shape both satisfy it.

## Build order

Superseded on 2026-10-15 by the `## Epics` section at the end of this plan, and again on 2026-11-01 by § *Epoch 2 —
the plan as revised at the re-review* (kept here for the record). The first order put the rule
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

*Revised 2026-11-01.* The structural test is the contract's guard (rule §7): the shipped `tools/leftovers-check.mjs` under
its profile for Node trees, E3's C# guard copied for C# trees, E4's for Rust — red on every class outside the helper and
red on a scan of nothing. The break-it holds for a NEW raw site even where a `raw-temp` baseline exists (E5): the baseline
is a multiset of file + content hash that only shrinks, so a line that is not in it is red the day it is written. Each
producer stage adds the merged core's proofs: an unwind test, a concurrent-owner-survival test (a folder whose record is
`live` or `unknown` survives the sweep), the exclusive-move and quarantine cases wave 1 found (§ *Wave 1*), and the
end-of-run audit bounded to THIS process's record. The janitor (`tools/janitor.sh --token <repo>`) is run after a full
suite on the operator's WSL machine and on the owner's Windows machine (listing only there until F9 is green) and must
find nothing of the caller's scope with a `gone` record.

## Definition of Done

- [ ] Every consumer's tests, scripts and CI create only `testsToDelete-…` resources (or a documented exemption).
      *Read at `105d53c`:* the owner form `testsToDelete-<owner>-<repo>-…`, claimed first; what lives INSIDE an owned
      resource carries no prefix of its own (rule §1); the exemption is the inline form of rule §7, or — for E5 only, and
      only until its drain is done — an entry of the `raw-temp` baseline the released baseline rule authorises.
- [ ] No container started by a test or script lacks `--rm` or an always-run cleanup.
      *Read at `105d53c`:* rule §5 — `--rm`, the prefixed `--name` and the owner label; the carve-out drops `--rm` only with
      ALL of its conditions and never decides the verdict.
- [ ] A structural test per repo keeps it that way.
      *Read at `105d53c`:* the guard of rule §7, at ZERO on every class — `raw-temp` included once E5's baseline has
      drained (E5.S7) — in every consumer; E1's (this repository's) and wave 1's (E3, E4) are green on `main`.
- [x] The rule refinement (decision 2) is in both rule repos and released. *Done:* `115bbf8` (R5), the sibling confirmed (R4).
- [ ] **Added 2026-11-01:** the `raw-temp` baseline rule (entry 1.7) is released from this repository, mirrored by the
      private sibling byte for byte where it touches the two rule spans, and pinned by coai by a pin bump alone — before
      E5's producer PR merges. Any consumer other than coai that wants the baseline says so in its stories document first.
- [ ] **Added 2026-11-01:** every consumer's start-of-run sweep and guard behave on Windows as the F16 disposition below
      says (§ *Epoch 2*, item 4) — on Windows the Node sweep changes nothing, so a killed Node run there waits for a C# sweep,
      the armed janitor or a person [re-review gate finding 0] — and the owner's Windows machine has its barrier section before
      the first producer merge of E2 and of E5.
- [ ] Every producer stage merged under decision 6's shape; every pin bump merged alone; the one-time hand clean-up of
      old names recorded per machine on the PR of the epic whose names they are.
- [ ] The coai feature review (`mcp__coai__review_feature`, a plan of seven epics) ran once after the last epic, from a
      checkout that holds it, before this plan is promoted.
- [ ] This plan is promoted to `research/` with its deviations, together with the stories documents of E2–E7 in their
      repositories, and the remainder plan's R6 is ticked.

## The merged core revises E1 first (2026-10-21)

The plan [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md) (IMPLEMENTED 2026-10-27, promoted to `research/`) revises the contract E1 builds, so the consumer
epics now wait for ITS release, not for E1's. What it left open — S0 on every machine, the merge of PR #82, the private sibling's side and the ONE release —
is in [PLAN_test_leftovers_merged_core_release.md](PLAN_test_leftovers_merged_core_release.md); its R5 is the release and its R6 is the two-stage migration below. Named on both sides:

| Item | Built by | This plan's part |
|---|---|---|
| The contract text, helper, sweep, janitor and guard in their owner-scoped form | the merged-core plan | E2–E7 consume its one release (R5 of the remainder plan); E1's stories document was promoted by it as IMPLEMENTED on 2026-10-27 — **superseded 2026-11-01: there were two releases (R5 `115bbf8`, R7 `105d53c`) and E5 needs a third (the `raw-temp` baseline rule); every consumer is pinned at `105d53c`, and a pin bump merges alone, so a further release costs each consumer one standalone PR, not a re-port** |
| The machine barrier, the merge of PR #82, the private sibling's side and the ONE release | [the remainder plan](PLAN_test_leftovers_merged_core_release.md) R1–R5 | E2–E7 start no producer stage before R5; their sweep-only stages need no release |
| The per-consumer rename, port and pin bump | epics E2–E7 here | Each epic splits into a sweep-only stage (its owner-blind sweeps replaced or disabled, no owner-form producer) and a producer stage (pin bump + rename + helper/guard port in one commit — **superseded by decision 4 (the pin bump merges alone) and decision 6 (one PR or a gated stack)**); all sweep-only stages land before any producer stage; the barrier checklist of the merged-core plan runs per machine before the first producer |

Order: the merged core first, then R1–R5 of the remainder plan, then the epics below. Disjoint: neither edits a consumer repository.
*Done:* R1–R5 on 2026-10-30; R7 (F17–F20, the core split, the pin bumps, the Darwin helper) on 2026-11-01. R6 is this plan.

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

**After wave 1 (2026-11-01):** the same defects were fixed in the Node reference (F17–F20, #101) and released as `105d53c` (R7) so that the Node
consumers (E2, E5) wrap a hardened reference; the C# helper gained a Darwin path (dew_flow_mcp #59 `197cc76`, measured on a macOS leg) because
coai and creds run C# suites on macOS; every consumer bumped its pin to `105d53c` alone. The E2 and E5 stories were re-split against `105d53c`
and passed their plan gates (creds `0b24304d`, coai `55ddb13b`); each re-split moved this plan once more — entries 1.6 and 1.7. Counted
by the rule, the plan had already stopped at entry 1.2 on 2026-10-31 (the owner's four decisions and the wave order of that day are
entries 1.1–1.5); the stop was recorded on 2026-11-01, and everything built between the two is sorted in the re-review's table.

## Epoch 2 — the plan as revised at the re-review (2026-11-01)

The whole plan read against what is known now, as step 4 of the full stop asks (`common/plan-change-control.md`), over all seven entries
of epoch 1: the wave order (1.1), the pin bump alone (1.2), the two Windows keys (1.3), the owner-blind literal class (1.4), E6/E7.S3 after
E3's merged producer (1.5), E2's five PRs (1.6) and E5's baseline rule (1.7). Entries 1.1–1.5 are taken as decisions 4 and 5 below and in
the build order; 1.6 is decision 6; 1.7 is prerequisite P2. This section is the baseline epoch 2 is approved on; the sections above keep
the measured facts and decisions, with what they superseded marked in place.
The re-review consultant was `681b5cfe` (Codex); every point it raised was verified against the files and is either taken below or
rejected with its reason.

### 1. What this plan is now

The October plan described a RENAME project: one rule refinement, one release pinned once, seven epics each a rename and a port. What
exists on 2026-11-01 is different in kind:

- **The contract is the merged core at `105d53c`**, not E1's text: the owner segment, the claim written FIRST, three-valued liveness, a
  sweep on two keys through a quarantine rename, legacy names listed and never collected by age, a guard with `legacy-name` and
  `owner-blind` classes, one shipped janitor, and a machine BARRIER that orders every consumer's work into a sweep-only stage and a
  producer stage. The October form `testsToDelete-<repo>-…` is a legacy name the guard refuses.
- **Two releases happened** (R5 `115bbf8`, R7 `105d53c`) and every consumer pins the second; a third is needed before E5's producer
  (the `raw-temp` baseline rule, entry 1.7). "One release, pinned once" (§ *Why the contract is an epic of its own*, item 3) is
  superseded; what replaces it is decision 4 — a pin bump merges alone — so a further release costs each consumer one standalone PR.
- **Wave 1 is done** (E3, E4) and left a tested C# helper with a Darwin path that the remaining C# consumers COPY by file, and a list of
  defects not to copy back in. E5 and E2 are therefore NOT independent of the other consumer epics (the dependency table's old rows for
  E4 and E5 are superseded): both copy E3's helper; E6 and E7 do too.
- **The producers of coai and creds are the run folder and the wrapper**, not a bulk rename: coai already makes one owner-form run
  folder per run (coai #897) and everything a test makes lives inside it (rule §1: no prefix of its own); creds wraps the mounted Node
  reference and copies the C# helper. The October E5 bulk rename of ~650 sites is withdrawn by its stories document.

**Goal (revised).** Every consumer's test run, harness, script and CI step creates outside its own process only resources of the
owner form, claimed first, removed on every exit path, and collected by that user's next run under the two keys of rule §4 when the run
was killed — except a Node run killed on Windows, which under F16 (b) (§ 4) is collected later: by a C# sweep that checks both keys, by
the janitor once F9 arms it there, or by a person, until F16 is fixed [re-review gate finding 0]; every consumer's sweep is owner-aware or retired BEFORE its first producer; a structural guard per language keeps every
tree so; and nothing a sweep or a janitor removes can be a resource a live run still owns. Done when the Definition of Done above holds.

### 2. Prerequisites that are wider than the approved plan

1. **The `raw-temp` baseline rule** (entry 1.7). Rule §7 at `105d53c` allows only the inline exemption form; coai's four C# suites and
   the extension hold hundreds of raw temp-API lines that run INSIDE the owned run folder (`src_mcp/tests` 276 lines alone), so a guard
   at zero on `raw-temp` would need a bulk rewrite the contract does not require. The coai plan gate refused a coai-only allowlist as a
   waiver of the released rule (round 1 findings 0 and 7); consult `abcaae48` said change the shared rule first. The rule authorises a
   baseline under exact terms (E5's D6): only for sites proven to run inside an owned run folder, matched by file + content hash as a
   multiset, only shrinking, the line number a hint, a stale entry red. It is planned on branch `feat/raw-temp-baseline`
   (`todo/PLAN_raw_temp_baseline.md`): written 2026-11-01 (`9c3b62c`), its plan gate `proceed` (coai session `c42be871`, all five
   findings accepted, `f753618`). It must be built, released (a third promotion), mirrored by the private sibling (its rule spans are
   byte-identical, R4), and pinned by coai alone.
2. **The owner's Windows machine has no barrier record** (R2: "not tested"; its section in `research/security/machines.md` says closed
   and private-temp-only). Both E2's D8 (c) and E5's D8 (1) make it a condition of the FIRST producer merge in that repository, and they
   are right: the barrier is per machine, and a GitHub-hosted runner is one job's VM, discarded with it (R2), so green hosted Windows
   legs do not open it. Until the record exists, E2.1 and E5's producer PR may be written, gated, built and reviewed, and may not merge.
3. **F16 — the Node reference on Windows checks the profile only, not the owner SID.** Disposition in item 4.
4. **The coai feature review** at the end (a plan of seven epics; `common/coai-feature-gate.md`), added to the Definition of Done.

### 3. Merge conditions (revised, per producer PR)

A producer PR of any epic merges only when, in this order: (a) its repository's pin is at the release its stories document cites
(`105d53c` today; for E2 and E5, the release that carries the F16 (b) change, and for coai also the baseline rule [re-review gate finding 1]); (b) R6 records every consumer's sweep-only stage as landed or empty — done 2026-10-31
for this family's seven and the sibling's ten; the barrier is open on the operator's WSL machine; (c) the per-machine barrier checklist
is recorded for EVERY machine that builds or tests that repository — for E2 and E5 that includes the owner's Windows machine (item 2.2);
(d) the one-time hand clean-up of the old names is recorded per machine on the PR of the epic whose names they are; (e) the coai plan
gate on the stories (or the epic's section) and the code gate on the PR reached `proceed`, plus an Opus review; (f) every CI leg the
repository runs is green (Linux, Windows, macOS where the suite runs there); (g) decision 6's shape holds for the merged prefix — the PR
carries ownership, teardown and start-of-run collection for every resource it introduces, and restores no age-based or owner-blind
sweep; (h) for E5 only, the `raw-temp` baseline rule is released and pinned. A sweep-only PR (E5's S2-A, E6's #125) needs (e) and (f)
and merges alone; a pin bump needs (f) and merges alone; a drain PR (E5.S7) is not a producer and needs (e) and (f).

### 4. F16 — the disposition (decided 2026-11-01: (b), on the question consultant's two answers)

Owner decision 2 of R6 (both keys on Windows: the profile AND the owner SID, fail closed) is implemented by the PORTS — E3's C#
`Scope.IsMine` (`WindowsIsMine`: the profile's final path AND the owner SID equals `WindowsIdentity.GetCurrent().User`) and E4's Rust.
The Node REFERENCE, which E2 and E5 wrap and run, still judges by the profile path alone (F16, `tools/lib/owned.mjs` `isMine`), because
Node reads no SID without a native addon or a child process; R7 left it open. So on one Windows machine the C# sweep of a consumer
and its Node sweep judge scope differently — a contradiction of decision 2, recorded by E2 (its D-table) and by this plan here.
The options, and what each costs:

- **(a) Accept the difference until F16 is fixed** — the Node sweep removes on the profile key alone. Cost: inside the profile, a
  folder another account owns (an elevated run's `Administrators`, an account given access) with a `gone` record is removed; the
  hosted Windows runner IS elevated (wave 1's measurement), so this case exists in CI.
- **(b) The Node sweep LISTS and never removes on Windows until F16 is fixed** (the janitor's own shape: without
  `JANITOR_WINDOWS_E2E_GREEN` it forces `--dry-run`, F9). Cost: a killed Node run on Windows leaves its folder until a C# sweep, the
  janitor (once armed) or a person collects it; nothing live is ever removed. Needs one change in the reference (a platform gate in
  `leftovers-sweep.mjs`) and a release the Node consumers pin — it can ride the baseline release.
- **(c) Fix F16 in the reference first** — the caller's SID is a constant of the run (one child per run is allowed by rule §3,
  `whoami /user`), but each entry's owner SID is a read per resource, which the rule forbids as a child per test process; a native
  addon is a dependency decision. Cost: unmeasured; blocks E2.1 and E5's producer on a Windows run (F9) that has not happened.

**Decision (2026-11-01): (b)**, carried in the baseline release; (c) when the Windows run of F9 happens; never (a) in silence.
Asked through the question consultant first (consult `3310f6ba`): both answers chose (b), and the code fact was verified (`owned.mjs`
`isMine` returns on the profile path alone on `win32`). "Lists" means the sweep changes NOTHING on Windows — no folder or claim
removal, no quarantine restore or reservation removal, no orphan-claim deletion, no worktree unlock, remove or prune — and reports the
ownership as unverified; a pre-existing unverified folder never fails a test run. A Windows test of the reference keeps every kind
unchanged. E2's and E5's stories cite this decision (fix forward on #253 and #850).

### 5. Build order (revised)

```
DONE   E1 (the contract) → the merged core → R1–R5 (release 115bbf8) → wave 1: E3 ∥ E4 → R7 (release 105d53c, every pin bump alone,
       the Darwin helper) → the E2 and E5 re-splits (plan gates proceed) → the stop (this re-review).
NEXT   P1 the owner's Windows barrier record            — the owner; blocks the first producer MERGE of E2 and of E5, not their build
       P2 the raw-temp baseline rule                      — this repository (its own plan, gate, PR, release, sibling mirror); then coai's pin bump alone
       P3 the F16 disposition, decided (b) (§ 4)          — one reference change riding P2's release
       E5 stage A (S2-A, the age-only coai- sweep retired, one PR alone) ∥ E5 S5 (the bare-prefix literals leave the test trees) — may start now
       E2.1 → E2.2 → E2.3 → E2.4 → E2.5 (five stacked, gated PRs; E2.1 merges after P1 and creds' pin on P3's release; the guards switch on in E2.5)
       E5 producer PR (S3 → S2-B → S4 → S6, one squash-merged PR, after P1, P2, P3's release, stage A and S5 [re-review gate finding 2]) → E5.S7 the drain (one PR per suite, not a producer)
THEN   wave 3: E6 ∥ E7 — stories written against 105d53c (or the baseline release) and E3's merged helper, each with its own plan gate;
       E6's stage A is landed (#125); E7's stage A is REQUIRED — gate or retire InfrastructureSampler's owner-blind qlntest_* drop
       in a sweep-only PR before any E7 producer [re-review gate finding 3]; both merge under § 3.
LAST   the coai feature review; the promotion of this plan and its stories documents; R6 ticked in the remainder plan.
```

The wave order E3+E4, E5+E2, E6+E7 is the owner's (§ *Wave 1*) and stands. Inside wave 2 the two epics are independent of each other
and share P1 and P3's release (the Node sweep on Windows, F16 (b)) [re-review gate finding 1]; only E5 waits for P2 as well.

### 6. What the re-review consultant raised, and what was done with it

| Point | Verified | Taken |
|---|---|---|
| (a) the plan still describes the October rename; E5's owner-liveness paragraph keeps an AGE-ONLY rule for unmarked `coai-` folders during a "migration window" | yes — the paragraph below E5's *Shared pattern* says "a folder with no marker at all … keeps today's rule — age only"; rule §3/§4 at `105d53c` lists an unmarked resource and never judges it, and never collects by age | yes — the paragraph is marked superseded in place; E5's stage A is the retirement of the age-only sweep (D7 of its stories); no end date is needed because nothing collects legacy names by age |
| (b) "One release, pinned once" and "E2–E7 consume its one release" are stale | yes — R5 `115bbf8`, R7 `105d53c`, every consumer at `105d53c`, E5 needs a third | yes — marked superseded; decision 4 replaces the principle |
| (c) "E5 independent of the other consumer epics" is stale | yes — E5 and E2 copy E3's helper (dew_flow_mcp #58, #59) | yes — the dependency table is rewritten |
| (d) the shape rule for stacked producer PRs | checked against E2's D8 (each PR a complete lifecycle; guard findings recorded as evidence) and E5's D8 (the producer and the sweep in one PR, a revert reverts both) — both already satisfy it | yes — decision 6 |
| (e) F16 contradicts the two-key Windows decision and needs an explicit disposition | yes — `owned.mjs` `isMine` reads no SID; E3's `WindowsIsMine` reads both | yes — § 4, decided (b) through the question consultant (consult `3310f6ba`) |
| (f) the owner's Windows machine has no barrier record; hosted CI does not open it | yes — R2's record; a hosted runner is out of the barrier's scope by R2's own words | yes — prerequisite P1, merge condition (c) |
| (g) the scope is wider in prerequisites but the baseline weakens the blanket guard acceptance, so `Narrowed: yes` | partly — see the record: the merge condition of E5's producer PR is smaller; the goal and the DoD are not, because the drain stays inside E5 | yes, with the reason narrowed to what actually got smaller |

Rejected: nothing outright. One reading of (g) is rejected in part — that the Definition of Done got smaller. Under rule §1 a raw temp
call inside an owned run folder creates nothing outside an owned resource, so DoD item 1 holds at E5's producer merge; and the baseline
keeps the break-it for every new line. What is smaller is the merge condition of one PR, and that alone is enough for `Narrowed: yes`.

### 7. Questions for the owner (blocking; each with the recommended answer)

**Answered 2026-11-01:** 1 — approved (epoch 2 opens `by owner`); 2 — the owner runs the Windows barrier scan and the checklist and
hands the output over to be recorded in `research/security/machines.md`; until then the build goes on and only the first producer
merges of E2 and E5 wait.

1. **Approve epoch 2 as narrowed?** The record says `Narrowed: yes` for the reason given; the rule says a narrowed plan resumes only
   with the owner. *Recommended:* yes — the narrowing is one PR's merge condition, bounded by a shrinking baseline the released rule
   will define and a drain inside E5's done-when.
2. **The Windows barrier (P1).** Run `node tools/sweeper-scan.mjs --root <checkouts parent>` on the Windows machine as the developer
   account, walk the manual items of the merged-core plan's barrier checklist, and record the section in
   `research/security/machines.md` — or state in writing that the machine no longer builds or tests E2's and E5's repositories.
   *Recommended:* run it; it is one scan and a short record, and it is the only thing between E2.1 and its merge.
   (Settled without the owner, 2026-11-01: the F16 disposition — (b), § 4, consult `3310f6ba`; and P2's plan — written and through
   its plan gate, item 2.1. The `r9700` token row (#103) rides the same promotion as P2 and the F16 change.)

## Epics

Seven epics, E = 7, so the cornerstone quota is Q = ⌈2·7/5⌉ = 3 ([common/subagent-models.md](../common/subagent-models.md)).
One epic per repository, as the build order says — with one change to that order: the shared contract goes
**first**, in this repository, and carries this repository's own tools with it. Every consumer epic depends on
E1 — and E2's C# helper story also on E3, which writes the family's C# helper first (cadence consultation,
2026-10-15); otherwise E2–E7 are ordered by what leaks most, and may run in parallel once E1 is released.
*Revised 2026-11-01:* every consumer epic depends on the merged core's release and on E3's merged helper for its C# half (E2, E5, E6,
E7); the order is the owner's waves (§ *Epoch 2* item 5); each epic's current state is its first line below.

Each epic's stories are one document, written when that epic starts, in the repository the work lands in:
`todo/PLAN_test_leftovers_E<n>.md` there. E1's document was a sibling of this plan and is in `research/` since 2026-10-27; the six consumer
documents are cited as paths, not links ([common/planning-docs.md](../common/planning-docs.md) § *Across
repositories*), and each names this plan as its parent in return. A stories document keeps no ledger: its changes are entries here.

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
*Read at `105d53c`:* the name is `testsToDelete-<owner>-<repo>-<what>-<id>` and the claim is written FIRST (rule §2); the helper is the
shipped Node reference wrapped (Node), E3's copied by file (C#), E4's (Rust); the guard is rule §7's, with the inline exemption form
only (plus E5's baseline once released); the three proofs stand, with the wave-1 cases added (§ *Wave 1*).

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
   **Superseded 2026-11-01:** there were two releases (R5, R7) and E5 needs a third; consumers pinned twice already, each bump alone
   (decision 4). The reason to go first — one wording of the exemptions — still holds and did its job (rule §5, §6).

The refinement goes into `common/test-leftovers.md`, which is **not** a coai tier rule
(`dew_flow_connect_other_ais · src_mcp/runners/Context/RuleOrder.cs:153-163` lists the eight; the tier
spends 78 855 of coai's 80 000-byte budget, `src_mcp/tests/StageRulesTests.cs:148`). Nothing is added to
`common/testing.md` or any other tier file — not even a cross-reference sentence.
*Since `105d53c`:* the rule is a self-contained core (8.5 KB) with a detail companion, split so a 90 KB reviewer budget can carry the
core (coai's budget is 90 KB since `RuleFiles.cs:181`; the canaries were re-measured in coai #936).

### E1 — the contract, the refinement, and this repository's own tools

- **State (2026-11-01): DONE and released** — the stories IMPLEMENTED 2026-10-27, revised by the merged core (#82), released as
  `115bbf8` (R5) and, hardened (F17–F20) and split (core/detail), as `105d53c` (R7). Open on this repository's side, for the
  consumers: the `raw-temp` baseline rule (P2, a plan of its own), the F16 disposition (P3), F1–F15 as parked follow-ups (none blocks a
  consumer: F3 — the `node` profile does not read `package.json` scripts — is due at the first consumer declared compliant under that
  profile, E2.5), and the Windows run F9.
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
  *As built:* the owner record is `<owner>:<host>@<os>:<pid>[:<start>[:<ns>]]` (rule §3), the marker a sibling `<folder>.owner`
  file, a worktree's its lock reason, a daemon object's its label; the rest stands.
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

- **State (2026-11-01): stories re-split against `105d53c`** (dew_flow_creds_for_devs PR #253, branch `docs/test-leftovers-e2-stories` at
  `f61358b`; plan gate `0b24304d` round 2 `proceed`, 1 of 2 reviewers; consult `9d8564bb` before E2.1–E2.3). The pin is DONE (#287
  `115bbf8`, #289 `105d53c`, each alone). Stage A measured EMPTY twice (`0fa2ee3`, `47724fd`: 1495 files read). Stage B is FIVE stacked,
  gated PRs — E2.1 the Node unit-test lifecycle (the wrapper over the mounted reference, the runner's record, both-root sweep, parent-only
  audit — cornerstone E2.1.S2), E2.2 the Node harnesses, E2.3 the C# lifecycle across the five xUnit executables (E3's helper copied by file
  with its Darwin path; both Windows keys), E2.4 shell, the Docker smoke under the carve-out, acme (cornerstone E2.4.S1, the bash helper
  that claims FIRST), E2.5 repository-wide enforcement (both guards switch on). **Depends on** E3 merged (`4feb245`, `197cc76`) — done;
  **P1** (the owner's Windows barrier record) and creds' pin on the release carrying P3 (the F16 (b) change) before E2.1 MERGES: E2 wraps the same Node reference on elevated hosted Windows [re-review gate finding 1]. Not a cornerstone
  epic in this plan's ledger; the two cornerstones are counted in its own stories document (its quota of 2 of 2 for five sub-epics).
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
  *Re-counted by the stories (2026-11-01):* Node unit 46 sites in 30 files, harnesses 17 folders and 9 stubs, shell 7, C# 54 sites in five
  projects; six legacy-name producers (`testsToDelete-agent-`, `-ait-`, `-sshd-`) entered with the SSH windows work and are migrated by E2.1
  and E2.2; the shipped guard's RED on `47724fd` is 62 findings.
- **Shared pattern.** A Node helper (`src_vs_code`) and a C# helper (the server tests), both to the E1 contract;
  the C# one is copied by shape from E3's, so that story starts after E3 has landed; the guard scans
  `.github/workflows/*.yml` and `deploy/**/*.sh` as well as the test trees.
  *Superseded 2026-11-01:* the Node side is a WRAPPER over the mounted reference (decision 5), the C# helper a COPY by file of E3's;
  the guards are the shipped Node one under `--profile node` and E3's C# guard with this repository's discovery — neither written here.
- **Proven by.** A failure test of the workflow: the smoke steps run against a stub image that fails the health
  assertion on purpose; the job ends FAILED, the always-run cleanup step ran (and removed the prefixed containers
  and volumes by exact name in the same job, observed before the VM goes), and `Publish` (`docker.yml:136-137`) is
  reported SKIPPED — the cleanup never turns a failed smoke green; the guard's break-it on a `docker run` without
  `--rm` and without an always-run remover; RED-GREEN per no-cleanup temp file class; unwind test for the helper.
- **Risks.** The workflow publishes `:edge` to ghcr.io on main; a wrong cleanup step that masks a failed smoke
  (an `if: always()` step that exits 0 after `docker rm` of a container that never ran) would green a broken
  image. The cleanup step must never be the step that decides the verdict. *Added:* an end-of-run audit that matches by the
  shared run record deletes live siblings' folders (wave 1 defect A) — E2.1.S2 audits by EXACT record, parent only.
- **Cornerstone: no** — the expensive decision (the carve-out) is E1's; what remains is mechanical and CI is repairable.

### E3 — mcp: one helper, nineteen sites, no cleanup today

- **State (2026-11-01): DONE** — dew_flow_mcp #58 (`4feb245`, 2026-10-31, after its coai plan and code gates, an Opus review, green Linux
  and Windows legs) and the Darwin path #59 (`197cc76`, 2026-11-01, measured on a macOS leg; the resolved-root walk of the link budget);
  the stories promoted to `dew_flow_mcp · research/PLAN_test_leftovers_E3.md` with its Deviations, its *Darwin follow-ups* and § *What the
  other epics take from here*. The pin is at `105d53c` (#60). It is the C# TEMPLATE: E2, E5, E6 and E7 copy `tests/Mcp.Tests/Leftovers/*.cs`
  by file (byte-identical except the namespace line; `OwnedToken.cs` rewritten; the Windows SID path and the Darwin path included) and
  send every defect they find back as a note, never fixing it alone. The hand clean-up of 682 old `mcp-*` folders is the owner's, recorded.
- **Repository:** `dew_flow_mcp`. **Stories:** `dew_flow_mcp · research/PLAN_test_leftovers_E3.md` (was `todo/`; IMPLEMENTED). Depends on E1.
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
  *Superseded 2026-11-01:* copied BY FILE, not by shape (E3's § *What the other epics take*; E2's and E5's stories) — the code is still
  per repository, but a copy that is byte-identical except its token can be diffed against the template at every pin.
- **Proven by.** RED first: a test that creates a scratch folder through the old path and asserts it is gone
  after the test fails; GREEN after the helper; an unwind test; the structural guard with its break-it.
- **Risks.** Small. `SpoolUsageSinkTests.cs:157` appends `"\0x"` to a temp path to provoke a fault — the guard
  must still see the creation under the composed string.
- **Cornerstone: no.**

### E4 — sidecar_rust: a `Drop` guard for test scratch

- **State (2026-11-01): DONE** — dew_flow_sidecar_rust #64 (`5478109`, 2026-10-31, the same gates and reviews as E3); the stories promoted to
  `dew_flow_sidecar_rust · research/PLAN_test_leftovers_E4.md` with its Deviations (the exclusive rename on Windows, the elevated hosted
  runner, the default owner of a new file by how it is created). The pin is at `105d53c` (#66). The old `bge-log-*`/`bge-seed-*` folders
  are the owner's to remove by hand, recorded. Nothing copies from E4; its record is what the C# copies read for the Windows cases.
- **Repository:** `dew_flow_sidecar_rust`. **Stories:** `dew_flow_sidecar_rust · research/PLAN_test_leftovers_E4.md` (IMPLEMENTED). Depends on E1.
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

- **State (2026-11-01): stories re-split against `105d53c`** (dew_flow_connect_other_ais PR #850, branch `docs/test-leftovers-e5-stories`
  at `2c64601a`; plan gate `55ddb13b` round 1 `revise` — eight findings applied — round 2 `proceed`; the gate ruled the document a piece
  of a split already under way, not split again). The pin is DONE (#936 `105d53c`, alone). The producer is the RUN FOLDER both runners
  already make (coai #897) taking the owner form, plus the Node wrap of the reference for the runners and script tests that run outside
  a run folder; the October bulk rename of ~650 sites is withdrawn (rule §1). **Stage A is the retirement of the age-only `coai-` sweep
  in both runners** (S2-A, the cornerstone's first half, ONE PR alone, first) — R6 recorded coai's stage A as empty because
  `sweeper-scan.mjs` looks for the prefix; the age-only sweep matched `coai-` and escaped it, and the barrier names "removes on age" too.
  S5 (the bare-prefix literals leave the test trees) may start now. **Stage B is ONE squash-merged PR** (S3 the C# library copied from E3
  and the run folder on the owner form in all four C# suites → S2-B the owner-aware sweep, the cornerstone's second half → S4 the Node
  producers wrap the reference → S6 the two guards, the audit, the `raw-temp` baseline, the CI legs), with the invariant that no commit
  on `main` carries the producer without the sweep or the sweep without the producer (a revert reverts both). **Stage C** is the drain
  (S7, one PR per suite, not a producer) and is inside E5's done-when. **Depends on** E3 merged (`4feb245`, `197cc76`) — done; **P1**
  (the owner's Windows barrier record), **P2** (the baseline rule released and pinned), the release carrying **P3** (F16 (b)) and
  **S5** (the bare-prefix literals gone, which S6's guard would flag) before the producer PR MERGES [re-review gate findings 1, 2]. The E5.S2 spec is Fable's (`todo/PLAN_test_leftovers_E5_S2_spec.md` there).
- **Repository:** `dew_flow_connect_other_ais`. **Stories:** `dew_flow_connect_other_ais · todo/PLAN_test_leftovers_E5.md`. Depends on E1.
- **Goal.** Tests create only `testsToDelete-coai-…`; the startup sweep collects both the new prefix and, for
  the migration window, the old `coai-` test literals; the product's `coai-*` runtime directories and their
  own sweep are untouched; nothing the sweep removes can be a directory a live run still owns.
  *Superseded 2026-11-01 (the migration-window clause):* nothing collects the old `coai-` test literals — they carry no prefix, so neither
  sweep nor janitor touches them; they go once, by hand (D4 of the stories). The rest stands, in the owner form.
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
  *Re-read by the stories (2026-11-01):* the age-only sweep is still enabled in both runners (`sweepTemp.mjs:30-37`, `TempDirsAreSwept`
  `:76-85`); only two of the five suites have the run folder (`src_server/tests`, `src_bugs/tests`, `src_bench/CoaiBench.Tests` write
  `coai-*` into the real temp); the extension tests under other prefixes run INSIDE the run folder and need no rename; the raw temp-API
  lines are the `raw-temp` baseline's content (`src_mcp/tests` 276).
- **Shared pattern.** The existing helper and the existing shared rule file, widened: `temp-sweep.json` gains a
  `testPrefixes` list (new and old), the three pinning tests assert the list, and the guard is the existing
  `TheTestSweepLeavesAJobAloneTests` and `TempDirsAreSwept` extended to the new prefix and to the extension
  tree.
  *Superseded 2026-11-01:* one C# library copied from E3 shared by the four .NET suites; the Node wrap of the shipped reference; the two
  guards of rule §7 (E3's C# guard, the shipped Node guard under `--profile node`) with coai's `raw-temp` baseline filter in coai's OWN
  wrapper test; `temp-sweep.json` loses its age rule with stage A.
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
  **Superseded 2026-11-01 (the re-review, consultant point (a)) — the last two sentences contradict the contract.** Rule §3 at `105d53c`:
  a resource with no record is *unmarked* — listed, never judged; rule §4 and § *Never*: nothing is removed on age, on a missing record or
  by a name alone, and restoring age-based deletion is never a rollback. So there is no age-only branch and no window with an end date:
  stage A RETIRES the age-only sweep (both runners), the owner-aware sweep lands with the producer, and the old `coai-` names (no
  prefix at all) are removed once by hand. The first part of the paragraph (the marker outside the folder, liveness authorises, a
  foreign host or an unreadable marker preserves) is what the contract says, in the contract's grammar.
- **Proven by.** Concurrent-owner survival: a `testsToDelete-coai-…` directory OLDER than the window whose
  marker names a live process survives the sweep (the case age alone gets wrong), and so does one with a
  foreign-host or unreadable marker; a `testsToDelete-coai-…` directory touched within the window and a
  `coai-chat-…` directory of any age both survive the sweep, while an old `testsToDelete-coai-…` and an old
  `coai-panel-…` are removed (the product dirs' own sweep is a separate test and is not changed); the three
  pinning tests go RED on the config change and GREEN with the list; the guard's break-it on an extension
  test with a new un-prefixed `mkdtemp`; a `run-host` test that the profile directory it passed is gone after
  the run.
  *Corrected 2026-11-01:* "an old `coai-panel-…` is removed" is withdrawn — an unmarked folder of any age survives both test sweeps (the
  product's own sweep is unchanged and out of scope); the stories' S2-A scenario is the RED-first proof (an unmarked `coai-chat-live`,
  11 minutes old, with `coai-chat-` omitted from the exclusions, survives byte for byte in C# AND Node). The must-not-copy-back-in list
  of the stories adds a RED-GREEN-RED test per wave-1 defect.
- **Risks.** The sweep deletes from the machine's temp root by name; a prefix list that admits `coai-` without
  the `neverSwept` filter removes running chats, answers and server jobs — user data, unrecoverable. Two
  runners and three tests read one file; a change that reaches two of the three leaves a sweep nobody
  asserts. The old-prefix window needs an end date written into the config, or it never closes.
  *The last sentence is superseded* (no window). *Added:* a producer merged without its sweep leaves every killed run's folder for ever
  (the stories' D8 invariant); the four suites run one after another in one job, so an audit over the shared run record would delete
  siblings' folders (wave 1 defect A; the audit reads only THIS process's record).
- **Cornerstone area: yes** — see the ledger.

### E6 — benchmark: the Testcontainers fixture, per-test databases, worktrees and clones

- **State (2026-11-01): wave 3, not started.** The pin is DONE (#120 `115bbf8`, #136 `105d53c`, each alone). **Stage A LANDED** as
  dew_flow_benchmark #125 (`6a963a4`): the held-out runner's `sweepLeftovers` lists every `testsToDelete*` entry and never removes it
  (the one enabled owner-blind sweeper R6's scan found in this family; the listing line is deliberately left visible to the scan). The
  stories document is not written; it is written against `105d53c` (or the baseline release) and E3's merged helper when the epic starts,
  with its own plan gate. **Depends on** E3 merged — done; P1 only if the owner's Windows machine builds or tests benchmark (the owner
  says); the producer stage under decision 6 (one PR or a gated stack). The worktree seam is product code (`ScratchWorktree.cs`): the
  contract's worktree owner is the lock reason (`git worktree add --lock --reason`), which the stories must settle against the product's
  own `worktree add --detach --force`.
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
  *Read at `105d53c`:* E3's helper copied by file; the container name in the owner form with the `testsToDelete.owner` label (rule §5);
  the Testcontainers builder adds the same label; the guard's `docker-name` and `ryuk-off` classes apply.
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

- **State (2026-11-01): wave 3, not started.** The pin is DONE (#78 `105d53c`, alone, with the sibling pins). Stage A is REQUIRED, not
  empty: R6's scan of `9100184` looked only for `testsToDelete` and missed the product's owner-blind drop of every `qlntest_*` collection
  (`InfrastructureSampler.cs:104-109`); a sweep-only PR gates or retires it before any producer [re-review gate finding 3]. The stories document is not written; it is written against `105d53c` (or the baseline release) and E3's merged helper when
  the epic starts, with its own plan gate; E7.S2 (the corpus ownership and drop protocol) is a cornerstone with a Fable spec. **Depends on**
  E3 merged for its C# helper — done; rule §6 for the store: a per-run collection `teststodelete_<owner>_<repo>_<what>_<id>` is owned
  by a lock or a marker written before the resource into a registry OUTSIDE it (rule §3's store row), and a shared store is exempt only
  under §6 (a) with its enforced lock — which settles the October question (exempt or disposable) in the contract's words: the sampler's
  prefix-only drop is a `shared-store` sweep that must authorise by lock or record.
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
  *Note for the stories:* the sampler's prefix-only drop in PRODUCT code is a sweep the barrier names (owner-blind); whether it is
  rag_qln's stage A (disable or make owner-aware before any producer) is the first question the stories answer — R6's scan did not list
  it because it matches `qlntest_`, not the contract's prefix, the same gap E5 found in coai.
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
  *Read at `105d53c`:* "an unclaimed old one is dropped" is read as rule §3's store row — a record `gone`, or a lock free and held by
  the sweeper through the drop; never by age; an unmarked collection is listed.
- **Risks.** The sweep runs inside the product against a store shared with real projects: a prefix check that
  loses its anchor, or a rename that leaves one reader on the old constant, deletes an index a project owns
  or sweeps nothing forever — the 22 GB incident the sweep exists for. A collection is gigabytes; a wrong
  drop is hours of re-indexing, and a drop during a live test is a flaky suite nobody can reproduce.
- **Cornerstone area: yes** — see the ledger.

### Dependencies and order

Superseded 2026-11-01 (kept for the record):

| Epic | Repository | Depends on | Why this place |
|---|---|---|---|
| E1 | conventions | — | the contract everyone encodes; the carve-out creds needs; one release |
| E2 | creds_for_devs | E1; E2.S3 (its C# helper story) waits for E3 | ~35 temp files without cleanup, the acme-test state and the stub files leak locally; CI containers die with the hosted job's VM (`docker.yml:30`), so CI needs only the always-run exact-name cleanup and a test that a failed smoke never publishes |
| E3 | mcp | E1 | nineteen sites, zero cleanup, no Docker: the smallest full adoption and the C# template — runs before E2's C# helper story |
| E4 | sidecar_rust | E1 — independent of the other consumer epics | seven not-panic-safe removals, two pre-clean-only; the Rust shape of the helper |
| E5 | coai | E1 — independent of the other consumer epics | the largest site count and a live-data sweep; needs the contract's concurrency sentence |
| E6 | benchmark | the merged-core release (R5); E6 waits for E3's merged producer stage (its C# helper ports E3's merged helper — E6's amended order; the producer stage is one PR since 2026-10-31) | the Testcontainers fixture and decision 2b's first use |
| E7 | rag_qln | the merged-core release (R5); E7.S3 waits for E3's merged producer stage | the shared-store contradiction must be settled before any rename, and needs 2a's wording |

The table as of the re-review (2026-11-01):

| Epic | Repository | State | Depends on | Why this place |
|---|---|---|---|---|
| E1 | conventions | DONE, released `115bbf8` → `105d53c`; P2 (the baseline rule) and P3 (F16) open here | — | the contract everyone encodes; the carve-out creds needs |
| E3 | mcp | DONE #58, #59 (wave 1) | E1's release | the smallest full adoption and the C# template every other C# consumer copies by file |
| E4 | sidecar_rust | DONE #64 (wave 1) | E1's release | the Rust shape; its Deviations are the Windows cases the copies read |
| E5 | coai | wave 2: stories at `2c64601a` (PR #850), gate `proceed`; pin done; stage A and S5 may start | E3 merged (the C# copy); P1 and P2 before the producer MERGES; P3 for its Node wrap on Windows | the live-data sweep and the largest tree; the one consumer that needs the baseline rule |
| E2 | creds_for_devs | wave 2: stories at `f61358b` (PR #253), gate `proceed`; pin done; stage A empty | E3 merged (the C# copy); P1 and the pin on P3's release before E2.1 MERGES | five stacked PRs under decision 6; the carve-out's first use |
| E6 | benchmark | wave 3: stage A landed (#125); pin done; stories not written | E3 merged; P1 if the Windows machine tests it; its own plan gate | the Testcontainers fixture and decision 2b's first use; the worktree seam in product code |
| E7 | rag_qln | wave 3: stage A REQUIRED (the sampler's qlntest_* drop); pin done; stories not written | E3 merged; its own plan gate; the sampler's prefix-only drop settled first (stage A or owner-aware) | the shared-store contradiction must be settled before any rename; rule §6 (a) is its wording |

### Cornerstone areas

The Fable spec of each marked story settles what a later round cannot cheaply repair:

- **E1, the contract.** Six repositories encode its wording in a guard; a sentence that reads two ways here is
  six guards that disagree, and the repair is six PRs. The spec settles: the helper contract in every language
  (name generation, cleanup registration, exact teardown, never-throw dispose); what the structural guard must
  refuse and how an exemption is written; the inspected-container carve-out so it cannot become a loophole;
  decision 2's two exemptions in words a guard can check; the concurrency sentence (*age selects, owner
  liveness authorises, uncertainty preserves*) and what counts as an owner in a temp root, a Docker daemon and
  a vector store. *Done* (E1.S1, then the merged core).
- **E5, coai's sweep.** The sweep deletes from the machine's temp root; the product writes chats, answers and
  server jobs under the same root and the same first five characters; one file is read by two runners and
  pinned by three tests. A wrong prefix list removes user data that nothing can restore. The spec settles: the
  `temp-sweep.json` shape with new and old test prefixes and an end date for the old; how both runners and all
  three tests move in one change; how a directory a concurrent run owns is recognised (touched-within-window
  is the current answer; the spec says whether it stays sufficient); and that the product's own `coai-*`
  runtime sweep is out of scope and provably unchanged.
  *Revised 2026-11-01:* no old-prefix list and no end date (nothing collects by age); the spec is E5.S2's in two halves — S2-A retires
  the age-only sweep (stage A), S2-B is the owner-aware sweep on the contract's two keys at the start of every C# suite and the extension
  runner (stage B) — written by Fable as `todo/PLAN_test_leftovers_E5_S2_spec.md` in that repository before S2 is coded; the product's
  sweep provably unchanged stands.
- **E7, rag_qln's shared store.** The sweep lives in product code and runs against a store that holds real
  projects' indexes; the test prefix is pinned in three product places and eight test files; the live tests
  reuse what the sweep deletes. The spec settles: whether the fixed-id live corpora are exempt (un-prefixed,
  documented, reset serialized against concurrent runs) or disposable (prefixed, fresh per run); how the
  product sweep authorises a drop beyond the prefix (claim, liveness, or a touched-within-window on the
  collection) and what it does when the standing is unknown; the exact new prefix under Qdrant's naming; and
  the one-change migration of every reader and every pinning test so no reader is left on `qlntest_`.
  *Read at `105d53c`:* "touched-within-window" is not an authoriser any more (rule §4: age only selects); the choices are the lock or the
  marker registry of rule §3's store row, and §6 (a)'s enforced lock for an exempt shared store.

Cornerstones: 3 of 3 — E1.S1 (the contract text, model: fable), E5.S2 (coai's test sweep: temp-sweep.json, both sweeps, owner liveness, model: fable), E7.S2 (rag_qln's corpus ownership and drop protocol, model: fable).
