# PLAN — every consumer's tests name what they leave behind `testsToDelete-…`

> Status: **epoch 8 open (2026-11-07), approved by the reviewers after the re-review (`Narrowed: no`); one change recorded, entry 8.1 (2026-11-10), so the next accepted change is the eighth full stop. E2 (creds) is COMPLETE, 2026-11-10.** Its five producer PRs are merged on creds `main`: E2.1 #294 (`834c91b`), E2.2 #310 (`bf59e4f`), E2.3 #311 (`0ae0211`), E2.4 #329 (`6e08071`, 2026-11-10) and E2.5 #330 (`b6cc6b3`, 2026-11-10 19:48 UTC). E2.5 switched on both repository guards: the shipped Node guard in creds' `docs.yml` is clean over 640 files, and the copied C# guard is green on all OS legs. Exemption markers are only on the inventoried lines. Creds' mount moved to `.agents/conventions` (#328) and is pinned at release `1341995` (#340). Epoch 8 used one change only, entry 8.1. E2's progress is not a change, so it has no ledger entry; creds' build records give the reasons why nothing else was counted. E2's rows and Definition of Done parts: § *Epoch 8* item 3.3. Still open in this plan: E5.S7, E6, E7, the feature reviews (E2's stories document's review is now due, § *Epoch 8* item 5, point 2) and the promotion. Creds' notes N20–N25 and its side findings (`release.yml`'s publish from any branch; two product scripts' temp leaks) are carried to the follow-ups as F33–F40.
>
> Was: Status: **epoch 8 open (2026-11-07), approved by the reviewers after the re-review (`Narrowed: no`); entry 8.1 recorded 2026-11-10 (E2.4.S3: D5's check and naming step and a failed command substitution), so the next accepted change is the eighth full stop.** Epoch 7 stopped at entries 7.1 and 7.2; the whole plan was revised (§ *Epoch 8*): D5 by option B, observed acceptance results for every remaining epic, the Windows exception restated by its true condition (a process whose new files are owned by Administrators); the Opus judge sorted epoch 7's work (fits, two cuts fixed forward, outside rows; coai #962 merged during the stop and is reported to the owner); the plan gate on an operative extract (sessions `39432dd3`, `6f58dbce`) and an independent Opus review passed. Epoch 8 starts at 0 changes.
>
> Was: Status: **stopped for re-review (2026-11-07): entry 7.2 (E2.4: D5's names cannot pass the released guard), the second accepted change of epoch 7, the seventh full stop.** No new code on any epic of this plan and no merge of a pull request carrying its work until the full re-review is complete; when its record says `Narrowed: yes`, the owner approves the revised plan; then epoch 8 opens. At the stop: E2.1, E2.2, E2.3 merged (creds #294, #310, #311); coai E5's producer merged (#945); E2.4 drafted, nothing built. The whole plan is revised for epoch 8 (2026-11-07, step 4 of the full stop): § *Epoch 8 — the plan as revised at the re-review*. Entry 7.2 is settled by option (B), and its record says `Narrowed: no`; the record's verdicts are the Opus judge's (step 5), and epoch 8 opens only after the re-review approves.
>
> Was: **epoch 7 open (2026-11-05), approved by the owner after the re-review; entry 7.1 recorded 2026-11-07 (E2.2's harness exit pattern), so the next accepted change is the seventh full stop.** Epoch 6 stopped at entries 6.1 and 6.2; the whole plan was revised (§ *Epoch 7*), the Opus judge sorted epoch 6's work (15 fit; 1 cut, unmerged and fixed forward; 3 outside; nothing merged contradicts), the plan gate on an operative extract, because the plan is over the gate's 256 KiB limit (the first read, session `05d66915`, no findings; the final text, session `a196b43c`, 3 findings rejected with reasons; each time 1 of 2 reviewers answered, the other out of quota) and the interim document gate on the E5 stories document (2 accepted) passed, a final Opus read's fixes were applied, and because the record says `Narrowed: yes` the owner approved it (2026-11-05). F31 is reviewed at the first of: E2.3 starts, a suite is to run on a Windows machine that persists, or 2026-12-05.
>
> Was: **stopped for re-review (2026-11-05)** — epoch 6's second change after approval (entry 6.2, found by S6's Windows run). No new code on any epic of this plan and no merge of a pull request
> carrying its work until the full re-review is complete; when its record says `Narrowed: yes`, the owner has approved the revised plan; and epoch 7 is opened with `state: open`. At the stop: E5's
> producer PR coai #945 (draft) holds S3, S2-B, S4, entry 5.1, S5 and most of S6; the plant of merge condition (o) is red on Windows and is not changed until epoch 7 opens.
>
> Was: **epoch 6 open (2026-11-05), approved by the owner after the re-review.** Epoch 5 stopped at entries 5.2 and 5.3; the whole plan was revised (§ *Epoch 6*), the Opus judge sorted epoch 5's work (16 fit; 2 cut, both fixed forward, nothing merged contradicts), the plan gate (session `ff8f7dd0`, 2 findings accepted, 1 rejected with reason) and the interim document gate on the E5 stories document (3 accepted, 1 rejected with reason) passed, a final Opus read's fixes were applied, and because the record says `Narrowed: yes` the owner approved it. F30's date of 2026-11-19 is accepted. All nine pin bumps to `bd795847` are merged. The owner's scan (merge condition (c)) is still open.
>
> Was: **stopped for re-review (2026-11-05)** — epoch 5's second and third changes after approval (entries 5.2 and 5.3, found writing E5's S6 brief). No new code on any epic of this
> plan and no merge of a pull request carrying its work until the full re-review is complete; when its record says `Narrowed: yes`, the owner has approved the revised plan; and epoch 6 is
> opened with `state: open`. At the stop: E5's producer PR coai #945 (draft) holds S3, S2-B, S4 and S5, pushed at `524df50e`; the S6 brief is local at `6b3f143e`. The ONE release carrying F3
> and F24 is promoted (`release` = `bd795847`, 2026-11-05, the owner agreed to the over-cap bumps), and its pin bumps are in flight: they are not epic code, they end the red pins the promotion
> caused, and they go on during the stop. Coai #948 (the SQLite WAL switch) is outside this plan.
> The whole plan is revised for epoch 6 (2026-11-05, step 4 of the full stop): § *Epoch 6 — the plan as revised at the
> re-review*, and the E5 stories document revised with it (coai branch `feat/test-leftovers-e5-producer`, local; a copy
> on `docs/e5-s6-brief-at-stop5`). The re-review record says `Narrowed: yes`; its table's verdicts are the Opus judge's
> (step 5), and the owner's approval comes after it; epoch 6 opens only with that approval. § *Epoch 6* item 3 is the
> one table the re-review consultant (`7f55e578`) asked for: every remaining merge condition of E5, E2, E6 and E7 mapped
> to its implementation, its invocations and its executable check, read against the real trees; its unmapped rows are
> the findings of this re-review.
>
> Was: **epoch 5 open (2026-11-04), approved by the owner after the re-review.** Epoch 4 stopped at entries 4.1 and 4.2;
> the whole plan was revised (§ *Epoch 5*), the Opus judge sorted epoch 4's work (14 fit; coai #943 cut, fixed forward on
> #945), the plan gate (session `5c89a4ce`, 2 findings accepted, 1 rejected with reason) and the interim document gate on
> the E5 stories document (5 findings accepted) passed, an Opus review's fixes were applied, and because the record says
> `Narrowed: yes` the owner approved it (2026-11-04).
>
> Was: **stopped for re-review (2026-11-04)** — epoch 4's second change after approval (entry 4.2, E5's native measurement
> series fits neither S4 option; found writing E5's S4 brief). No new code on any epic of this plan and no merge of a pull request
> carrying its work until the full re-review is complete; when its record says `Narrowed: yes`, the owner has approved the revised
> plan; and epoch 5 is opened with `state: open`. At the stop: E5's producer PR coai #945 (draft) holds S3 and S2-B, pushed at
> `6ec356a1`, plus one local docs commit; S4 is a brief only (no code). creds E2.1 is draft #294 at `3422500` (its by-hand records
> in progress on the throwaway branch `tmp/e21-byhand`; it could not merge anyway before the WSL administrator scan of
> `research/security/machines.md`).
> The whole plan is revised for epoch 5 (2026-11-04, step 4 of the full stop): § *Epoch 5 — the plan as revised at the
> re-review*, and the E5 stories document revised with it. The re-review record says `Narrowed: yes`; its table is the
> Opus judge's (step 5), and the owner's approval comes after it; epoch 5 opens only with that approval.
> Since the stop (2026-11-04, records only, no epic code): creds #294's by-hand records are complete — run 2 of
> `tmp/e21-byhand` green on macOS and Windows (`be47183`), the throwaway branch deleted — and its public-hygiene fix
> (`9a6e9fa`); coai `d3791c00` is pushed on #945 with the E5 document's revision.
>
> Was: **epoch 4 open (2026-11-03), approved by the owner after the re-review.** Epoch 3 stopped at entries 3.1 and 3.2;
> the whole plan was revised (§ *Epoch 4*), the Opus judge sorted epoch 3's work, the plan gate (session `7c66b50d`) and
> the interim document gate passed, and because the record says `Narrowed: yes` the owner approved it (question 1).
> Questions 3 and 4 were settled by the question consultants (`4e52fac6`, both agreeing), as the owner's standing
> instruction asks: the Windows whole-suite checks are decided after E5's producer PR with measured cost; F3 and F24
> ship in ONE release.
>
> Was: **stopped for re-review (2026-11-03)** — epoch 3's second change after approval (entries 3.1 and 3.2, found
> writing E5's S3 brief). No new code on any epic of this plan and no merge of a pull request carrying its work until
> the full re-review is complete; when its record says `Narrowed: yes`, the owner has approved the revised plan; and
> epoch 4 is opened with `state: open`. At the stop: F3 merged (#116, unreleased); E5's producer branch has no code
> (only S3's brief, in the session's scratchpad); creds E2.1 is draft #294 (waits for P1 anyway).
> The whole plan is revised for epoch 4 (2026-11-03, step 4 of the full stop): § *Epoch 4 — the plan as revised at the
> re-review*, and the E5 stories document revised with it. The re-review record says `Narrowed: yes`; its table is the
> Opus judge's; epoch 4 opens only with the owner's approval.
>
> Was: **epoch 3 open (2026-11-03), approved by the owner after the re-review.** Epoch 2 stopped at its second change
> (entry 2.2, 2026-11-03); the whole plan was revised (§ *Epoch 3*), the Opus judge sorted the done work, the plan gate
> (session `4a07e86f`) and the interim document gate passed, and because the record says `Narrowed: yes` the owner
> approved it, with § Epoch 3 item 7's questions 1, 3 and 4 answered as recommended.
>
> Was: **stopped for re-review (2026-11-03)** — epoch 2's second change after approval (entry 2.2, E5.S5's order
> against the producer PR). No new code on any epic of this plan and no merge of a pull request carrying its work until
> the full re-review is complete; when its record says `Narrowed: yes`, the owner has approved the revised plan; and epoch 3
> is opened with `state: open`. Unpushed local work at the stop: coai S5 branches (mcp: uncommitted; ext: 2 local
> commits; scripts: uncommitted); creds E2.1 is a draft PR (#294) and was not to merge before the owner's records anyway.
> The whole plan is revised for epoch 3 (2026-11-03, step 4 of the full stop): § *Epoch 3 — the plan as revised at the
> re-review*, and the E5 stories document revised with it. The re-review record says `Narrowed: yes`; its table is the
> Opus judge's; epoch 3 opens only with the owner's approval.
>
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
> [PLAN_test_leftovers_merged_core_release.md](../research/PLAN_test_leftovers_merged_core_release.md) (R1–R7, the owner decisions),
> [PLAN_test_leftovers_merged_core_followups.md](PLAN_test_leftovers_merged_core_followups.md) (F1–F22),
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

> Epoch 2 · approved 2026-11-01 · by owner · state: closed

- 2.1 · 2026-11-02 · agent · build-order — E2.1 and E5's Node runners wait for F22 (the reference sweep takes the consumer's token) and its release
  (the E2.1 coder measured it: `sweepLeftovers` compares every name with the reference's own `REPO_TOKEN`, so a wrapper cannot
  sweep `creds-` or `coai-` folders; decision 11 forbids a copy. F22 is in the follow-ups plan; E2.1 is built with a sweep seam
  that refuses loudly until the pin carries F22.)
- 2.2 · 2026-11-03 · agent · build-order, dod, merge-conditions — E5.S5 cannot finish before E5's producer PR: its sites outside any run folder lose the bare prefix only after S4/S3 give them an owned folder
  (found building S5, coai branches feat/test-leftovers-e5-s5-{mcp,ext,scripts}. CI runs `scripts/**/*.test.mjs` as plain
  `node --test` (coai ci.yml:197), so about 35 sites in scripts/lib, scripts/ and src_server/tests make top-level folders
  in the machine's real temp; two renamed extension sites also run in sonarcloud.yml:302 outside the run folder. Dropping
  the prefix there leaves an unnamed leftover (rule section 1 allows no prefix only inside an owned resource). E5's
  stages table puts S5 on main BEFORE the producer PR (S3 depends on "S2-A, S5 on main"), and S5's DoD is "zero
  bare-prefix lines outside the two helper files"; S5's own text says these sites "move under S4's owned folder". So
  the order, S5's DoD and the producer PR's merge condition must change. Consult c137f641: two answers, A (narrow S5,
  move the sites to S3/S4, record the change) and B (keep S5 open). Both depend on a merge condition changing, so this
  is a change. It is the second of epoch 2: the plan stops for re-review.)
  (Sources, dew_flow_connect_other_ais at a3b73534 [PR review, CodeRabbit]: `.github/workflows/ci.yml:197` is
  `run: node --test "scripts/**/*.test.mjs"`, and `.github/workflows/sonarcloud.yml:302` is
  `./node_modules/.bin/c8 --reporter=lcovonly --report-dir=../coverage/c8 --src=src node --test "out/test/"*.test.js`;
  neither starts the extension's runner (`src_vs_code/scripts/run-tests.mjs`), which makes the run folder. The two
  extension sites are `src_vs_code/src/test/kimiLinuxInstall.test.ts:60` and `runtimeSinceIsAhead.test.ts:147`, both among
  the "tests under other prefixes" that § E5's re-read of 2026-11-01 says run INSIDE the run folder. That sentence holds
  for `npm test` only, not for the SonarCloud job; the re-review corrects it.)

### Re-review for epoch 3

Narrowed: yes — nothing of E5.S5 must land before E5's producer PR any more (S5 has no stage-A part: its renames become a commit of the producer PR, after S3, S2-B and S4 give every site an owner-form, fail-closed run folder), so the producer PR's merge condition changed; E5's final Definition of Done and this plan's did not get smaller (S6 keeps the repository-wide zero for `owner-blind` and `legacy-name`), and the prerequisites got wider (the invocation inventory of § *Epoch 3* item 4, with its direct-run refusal, and F3 before the first Node compliance declaration)

| Work | Where | Verdict | Action |
|---|---|---|---|
| dew_flow_creds_for_devs #253 `22f52415` — E2 stories re-split against `105d53c`, five per-epic PRs (merged 2026-11-01 23:41:37Z, 4 s before #106 opened epoch 2) | main of dew_flow_creds_for_devs | fits | kept — E2 gives every site its own owned, claimed folder through the wrapper (owner form), so it drops no prefix that relies on containment, and its § *Where the collection guarantee holds* already lists the runners and the direct `node --test` road; the inventory rule is met for E2 as written |
| F16 interim — on Windows the reference sweep lists and changes nothing until the owner SID is read, #107 `5e077ff9` (P3) | main, released in `5863c60` | fits | kept — the prerequisite P3 that the revised plan keeps |
| the `raw-temp` baseline rule, #108 `eb2fdd55` (P2) | main, released in `5863c60` | fits | kept — the baseline covers only sites that "provably run inside an owned, claimed run folder" and calls a site outside a proven runner a finding, which is the same line option A draws (sites reached by `ci.yml:197` or `sonarcloud.yml:302` cannot be baselined and wait for S3/S4) |
| F21 — the identity and exclusive-move helpers exported, #109 `5863c60d` (the sha `release` was promoted to, run 41430127939) | main, released in `5863c60` | fits | kept |
| the pin bumps to `5863c60`, each alone: creds #292 `66056a6e`, benchmark #151 `0ea28fbe`, vscode_kit #21 `27f69034`, rag_qln #80 `ae9c7d6d` (with its two externals current), mcp #62 `76c9c5f5`, sidecar_rust #68 `6c57d526`, wsl_care #184 `72b89017`, coai #939 `2221559a` (with the `module_runners.md` canary bytes) | main of each | fits | kept — eight PRs; over the PR cap with the owner's agreement of 2026-11-02 |
| the consumers list in the README — dew_flow_amd_r9700_tuning_ai joins, #110 `abac5a8c` | main, released in `cc24f9e` | fits | kept — outside this plan's six consumers; a row only because it rides release `cc24f9e` |
| dew_flow_amd_r9700_tuning_ai #1 `017ed6d3` — the new consumer's first PR, which pins `5863c60` inside it | main of dew_flow_amd_r9700_tuning_ai | fits | kept — a first pin, not a bump, recorded so in § 5; the feature work in it is outside this plan |
| the first local draft of the `5863c60` release record, `b55b9a4` (worktree `conv-rel5863`) | local | fits | nothing to keep — its text is a subset of what #111 merged; the commit and its worktree may be dropped |
| dew_flow_connect_other_ais #850 `ee7a7b70` — the E5 stories re-split against `105d53c` (merged 2026-11-02) | main of dew_flow_connect_other_ais | cut | corrected in a NEW coai PR on `todo/PLAN_test_leftovers_E5.md` (the rest of the document is kept): S5's goal, change, DoD (`:855`, "zero bare-prefix lines outside the two helper files") and the stages table (`:425`, `:427` "S2-A, S5 on `main`") still put every bare-prefix site in S5 before the producer PR, and the document names no invocation of `sonarcloud.yml:302` |
| F22 — the reference sweep takes the consumer's token, #112 `edfcdc2e` | main, released in `cc24f9e` | fits | kept — ends ledger entry 2.1's wait |
| the release `5863c60` record, #111 `cc24f9e3` (the sha `release` was promoted to, run 41523829952) | main, released in `cc24f9e` | fits | kept — a record of what happened; the revised build order replaces its "E5 S5 may start now" line going forward without editing it |
| E5 stage A — the age-only `coai-` test sweep retired, a one-off clean-up by a person, coai #940 `d02ed40e` | main of dew_flow_connect_other_ais | fits | kept — stage A is unchanged by option A; the legacy `testsToDelete-coai-run-…` fixture literals it added are S5/S6 work, not a contradiction |
| the pin bumps to `cc24f9e`, each alone: creds #293 `bfc5348b`, vscode_kit #22 `e31394cf`, mcp #63 `b8a508e0`, sidecar_rust #69 `c00fd936`, amd_r9700_tuning_ai #4 `255aeac3` (refreshes its byte-identical vendored `owned.mjs`/`leftovers-sweep.mjs`), benchmark #152 `c4666527`, rag_qln #81 `b40c0aef`, wsl_care #185 `edf764b1`, coai #941 `a3b73534` | main of each | fits | kept — nine PRs; the vendored copy in amd_r9700 is that repository's own design, outside this plan (a question for the follow-ups plan's F21, not a cut here) |
| the release `cc24f9e` record — nine pin bumps, E5 stage A done, E2.1 draft PR, #113 `259fb69a` | main, unreleased | fits | kept |
| creds E2.1 — the Node unit suite owns, claims and removes its temp folders, wired to F22, draft #294 at `7571243d` (branch `feat/test-leftovers-e2.1`) | pushed, unmerged (draft PR) | fits | kept as a draft; no merge until epoch 3 is approved, P1 and its by-hand macOS and Windows records — every replaced site (e.g. the three `testsToDelete-agent-` sites) becomes `ownedDir(...)`, owner form under every invocation, so no prefix removal depends on a run folder |
| coai E5 S5 (extension), local `fcec8399` + `24aa789e` on `feat/test-leftovers-e5-s5-ext` — the contained renames: `chatTestsLeaveNoTemp.test.mjs:30` `chatleak-`, `runTemp.test.mjs` `runtemp-` and `RUN_PREFIX` exported from `run-tests.mjs`, `kimiWindowsInstallRuns.test.ts:62` `kimi install run `, the `startOfRun.test.mjs` io-stub fixtures | local | fits | kept — the `.mjs` sources run only through `run-tests.mjs` (which does NOT fail closed: `beginRun` catches a failed run folder and lets the tests share the machine's temp — corrected at the re-review; S4 removes that fallback, as S3 makes `RunTemp.Start` fail closed); `kimiWindowsInstallRuns` makes its folder only on Windows, where only `npm test` runs it (`sonarcloud.yml:302` runs on ubuntu, where `root` is `''`) |
| coai E5 S5 (extension), local `fcec8399` — `kimiLinuxInstall.test.ts:60` (and its header comment `:18`) and `runtimeSinceIsAhead.test.ts:147` lose the prefix, and the new `research/module_tests.md` sentence says they run inside the run folder | local | cut | revert these two sites to `testsToDelete-kimi linux install ` and `testsToDelete-runtimeSince-` and drop them from the research sentence before any push — both compile to `out/test/*.test.js`, which `sonarcloud.yml:302` runs on ubuntu through `c8 node --test` with no run folder, so they are not contained under every invocation and move to S4 |
| coai E5 S5 (extension), local `fcec8399` — `src_vs_code/src/test/legacyNames.mjs`, the bare prefix built from pieces (`['testsTo', 'Delete'].join('')`) "so … the guard reads no built name" | local | cut | replace it before any push: rule §7 at `cc24f9e` defines `legacy-name` as "a literal or a constant that builds a prefixed name" without the owner segment, so a constant split to hide from the scan makes S6's zero false; write the legacy name once as a literal with `testsToDelete-exempt: legacy-name — <reason>` on its line |
| coai E5 S5 (`src_mcp/tests`), uncommitted on `feat/test-leftovers-e5-s5-mcp` (120 test files, ~270 lines) — every `TempDir.For("testsToDelete-…")` / `CreateTempSubdirectory` / `Path.Combine(Path.GetTempPath(), "testsToDelete-…")` drops the prefix | local | fits | kept — every site makes its folder through `Path.GetTempPath()`, which `RunTemp`'s `[ModuleInitializer]` points at the run folder for every invocation of the assembly (ci.yml, the sonarcloud `dotnet-coverage` run, release); no site is in a WSL distro's `/tmp`, LocalAppData or the real `~/.kimi-code` (the homes, lock and junction roots are test `TempDir`s; `VibePathBudgetTests`'s drive-root `vh-budget` is a string nobody makes); before it is committed: name in the S5 PR that `RunTemp.Start` falls back to the machine's temp WITHOUT isolation when the folder cannot be made (S3 should fail closed), and leave the historical result rows in `research/module_tests.md` as written (append-only) |
| coai E5 S5 (`src_mcp/tests`), uncommitted — the new `LegacyNames.cs`, the bare prefix built by `string.Concat("tests", "To", "Delete", "-")` | local | cut | replace before commit with one literal carrying `testsToDelete-exempt: legacy-name — <reason>` (same reason as the extension's `legacyNames.mjs`) |
| coai E5 S5 (scripts), uncommitted on `feat/test-leftovers-e5-s5-scripts` — the vacuous `!missing.stderr.includes('testsToDelete')` dropped in `transcript-sanitise.test.mjs:686` | local | fits | kept — its `dir` is under `transcript-sanitise-test-…`, so the string could never be in the output; no site is renamed, the `scripts/lib` sites stay for S4 (no E5 plan note is in this worktree, only the three test files) |
| coai E5 S5 (scripts), uncommitted — the new `scripts/lib/legacyNames.mjs` (pieces) used by 13 legacy fixtures in `old-coai-leftovers.test.mjs` | local | cut | replace before commit with one literal carrying `testsToDelete-exempt: legacy-name — <reason>`; the fixtures themselves live inside each test's private root and may keep the legacy name |
| the stop record, entry 2.2 and `state: stopped`, `31d4131` (branch `docs/rollout-stop-2.2`, conventions PR #114) | pushed, unmerged (open PR) | fits | kept — merges before or with epoch 3's line; the re-review builds on it |
  (Written 2026-11-03 with the revision of § *Epoch 3*, over both entries of epoch 2: 2.1, the wait for F22, which
  ended with release `cc24f9e`; and 2.2, E5.S5's order against the producer PR. Option A of consult `c137f641`,
  confirmed by the re-review consult `3ebddd39`. A separate Opus judge sorts the work done since epoch 2 opened into the
  table, step 5 of the full stop. The epoch 3 line is written only when the owner approves.)
  (Revised 2026-11-03 after the re-review gate, findings 0–3, all accepted: the first text of the line above said S5
  is narrowed to the sites contained under every invocation. By § *Epoch 3* item 4's own rule a runner's fallback to
  the machine temp is uncontained, and both coai runners fall back today, so no S5 site is contained before S3 and S4.
  S5 therefore moved into the producer PR. The judge's rows stand as written: the local S5 work is the input of that
  commit.)

> Epoch 3 · approved 2026-11-03 · by owner · state: closed

- 3.1 · 2026-11-03 · agent · approach — E5's C# library cannot be a byte-identical copy of dew_flow_mcp's template (D2): the template hard-codes mcp's layout, mount path and identity
  (found writing S3's build brief on coai branch feat/test-leftovers-e5-producer, verified by a scratchpad build of the
  copy. dew_flow_mcp's `tests/Mcp.Tests/Leftovers/` at 197cc76 (51 files, not 54) hard-codes `.claude/rules/shared`
  (`LeftoversGuardScripts.cs:20`), its helper paths (`LeftoversGuard.cs:47-48`, `:60-66`) and an mcp type
  (`RepositoryIdentity.Row`); coai mounts the rules at `.agents/conventions` and cannot use `.claude/rules`. S3 needs
  edits in four copied files and S6 in about eight guard files, and two needed files sit outside the folder. One cause:
  the template is mcp-shaped. Question consultants be608fd9, both answers.)
- 3.2 · 2026-11-03 · agent · dod — E5's DoD asks for all four C# suites green on all three platforms with the same counts, and no coai workflow runs all four on all three
  (the same brief: coai's CI runs the bugs suite on Linux only, and the server and bench suites are not on the Windows
  job (`.github/workflows/ci.yml`). [PR review, CodeRabbit] Every workflow of coai at 004c55f, checked job by job:
  `ci.yml` build-test (ubuntu: all four) and macos (mcp, server, bench); `release.yml` server-binaries runs the server
  suite on ubuntu, arm Linux, windows-latest, windows-11-arm and macos, and bugs-binaries runs the bugs suite on Linux
  x64 and arm only; `sonarcloud.yml` (ubuntu). So the bugs suite never runs off Linux, bench never on Windows, and
  the server suite reaches Windows only in the release workflow, not in pull-request CI. Either the DoD changes or CI gains legs. Independent of 3.1 (consultants be608fd9,
  both answers: a second cause). It is the second change of epoch 3: the plan stops for re-review. Also found and
  NOT counted as changes (fixes that satisfy the plan as written, or already-approved constraints): the brief's items
  1, 3, 5-7, 10, 11, 13, 14 and 12 (P1). Item 8, the released baseline rule's "a test ordered first"
  (`common/test-leftovers-baseline.md`) against parallel collections, is reported for a conventions follow-up.)

### Re-review for epoch 4

Narrowed: yes — E5's Definition of Done no longer asks for all four C# suites green on three CI legs with the same test counts: it names the suite × OS matrix coai's CI actually runs (the ingest suite on Linux only, bench not on Windows), keeps the SHARED run-folder library's ownership and startup proofs on all three OSes and each suite's own proofs only on the OSes its CI step runs it on (the ingest suite's on Linux only, bench's on Linux and macOS), and replaces "the same counts" with a named reconciliation of additions, removals and platform skips; the C# copy rule is not smaller (an adapted copy with a pinned manifest, permitted transformations and a diff check, in place of a byte-identical copy that cannot be built), and the prerequisites got wider (F24, the baseline proof rule, released and pinned before E5's S6 creates its baseline)

| Work | Where | Verdict | Action |
|---|---|---|---|
| the epoch-3 record — the re-review after entry 2.2, the judge's table, approved by the owner, conventions #115 `be7eb092` (merged 2026-11-03 10:45Z; epoch 3 opens here) | main, unreleased | fits | kept — a record; the § *Epoch 3* text that entries 3.1 and 3.2 overtake (a byte-identical C# copy, "three legs, the same counts") is rewritten by this stop's own revision of the whole plan (step 4), not by a separate PR |
| E5 stories revised at the epoch-3 re-review — S5 is commit 4 of the producer PR, coai #942 `004c55fb` (branch `docs/e5-rereview-epoch3` at `d419703e`) | main of dew_flow_connect_other_ais | cut | corrected in a NEW coai PR on `todo/PLAN_test_leftovers_E5.md` (the rest is kept, and the epoch-3 cut of #850 is done by it): the merged text still says the C# library is a byte-identical copy (`:70`, `:264`, `:353`, `:364`, `:416`, `:580`, DoD `:1208`, Q `:1276-1277`), the DoD asks for "all four suites green on the three legs with the same test counts" (`:836`, `:982`, `:1123`), sc. 2 proves the run folder by "one test, ordered first in that assembly" (`:812`), and the fail-closed mechanism is open "for example … a startup hook or assembly fixture" (`:857-869`) — against entries 3.1, 3.2, the baseline-rule fix and S3's gated custom `Main` |
| F3 — the guard's `node` profile reads `package.json` scripts, fail closed, conventions #116 `605e3e6e` (branch head `8fcf9f01`) | main, unreleased (`release` is still `cc24f9e`) | fits | kept — it adds manifest scanning (`tools/lib/leftovers-package.mjs`, `scanManifests` in `tools/leftovers-check.mjs`) and keeps manifest findings out of the baseline (`printBaseline`, 2 lines of `tools/lib/raw-temp-baseline.mjs`); the baseline-rule fix changes what proves a scope (rule text in `common/test-leftovers-baseline.md` "a test … ordered first", and `proofFailure`/`isTestFile` in `raw-temp-baseline.mjs`), which F3 does not touch, so the two overlap in files, not in behaviour — build the fix on `605e3e6` and release both together, so coai pins once before S6 and before the first Node compliance declaration |
| coai `feat/test-leftovers-e5-producer` (worktree `coai-e5-producer`) — no commits over `004c55fb`, clean, never pushed; only a plan-gate session | local | fits | nothing to keep or drop; no code may start on it until epoch 4 is approved and the E5 correction above is merged (the S3 brief in the scratchpad is not repository work and is not a row, but it must be rewritten to the revision before use: an adapted copy with its diff to the template named, the suite × OS matrix, the gated custom `Main`, the process-wide gate) |
| creds E2.1, draft #294 at `7571243d` (last commit 2026-11-03 09:14Z, last update 09:31Z) | pushed, unmerged (draft PR) | fits | unchanged in epoch 3; kept as a draft — none of entries 3.1, 3.2, the baseline fix or the custom `Main` touches E2 (Node, owner form per site); no merge until epoch 4 is approved, P1 and its by-hand records |
| the stop record — entries 3.1 and 3.2, `state: stopped`, `c7f1ccb2` (branch `docs/rollout-stop-epoch3`, conventions PR #117) | pushed, unmerged (open PR) | fits | kept — merges before or with epoch 4's line; the re-review builds on it |
  (Written 2026-11-03 with the revision of § *Epoch 4*, over both entries of epoch 3: 3.1, the copy that cannot be
  byte-identical, and 3.2, the DoD's three legs and same counts. Re-review consult `8d309111`; the question consultants
  `be608fd9` before it. A separate Opus judge sorts the work done since epoch 3 opened into the table, step 5 of the
  full stop. The epoch 4 line is written only when the owner approves.)
  (Revised 2026-11-03 after the re-review plan gate, session `7c66b50d`, finding r3: the first text of the line above said
  every suite's proofs run on all three OSes; the ingest suite cannot run off Linux. The line now says which proofs run
  where; § *Epoch 4*, item 3 (f) names each CI step.)

> Epoch 4 · approved 2026-11-03 · by owner · state: closed

- 4.1 · 2026-11-03 · agent · contract — E5's promise that a killed old coai run (legacy `testsToDelete-coai-run-*`) is collected by the next extension run cannot hold at the pinned reference
  (found writing E5's S2-B spec (Fable), coai branch feat/test-leftovers-e5-producer, spec § B.10 item 1. At the
  pin, the reference's `legacyOwnerState` answers `unknown` on Linux (a legacy record has no `<ns>`), the Windows
  sweep only lists (F16 interim), and E2's `win32`/`darwin` os tags cannot be parsed by `parseLegacyOwner`; so the
  Node sweep never collects a legacy coai folder, and the C# sweep only lists one (its contract). [PR review,
  CodeRabbit] Scope of that claim: coai's E2 claim grammar allows only `win32`, `linux` and `darwin`
  (`src_mcp/tests/OwnerClaim.cs`, the `Shape()` pattern), so these three are every legacy coai record there is. The
  reference COULD collect a legacy record tagged `macos` whose pid is dead (`legacyOwnerState` defers to
  `ownerState` there), but coai never wrote that tag. The only removal of
  those folders is S2-A's one-off clean-up (coai #940). E5's D4, S2-B item 3 and Q3 are corrected in the producer
  PR. Question consultants 08beb732 and 76d09c26: of the spec's 12 findings, items 3 (a real Windows CI leg for the
  Node sweep) and 8 (row 12's C# half, red on the Windows leg, macOS assertions kept) are met AS WRITTEN by S2-B;
  if item 8's Windows mutation cannot be shown red there, it is entry 4.2 and the plan stops. The other items are
  repaired references and details.)
- 4.2 · 2026-11-04 · agent · approach — E5's native measurement series (`scripts/lib/native-run.mjs` `SERIES_SHAPE`, `scripts/native/*.sh`) outlives the script that makes it, so neither S4 option fits; it leaves the prefix family
  (Found writing E5's S4 brief, its decision D-a. S4 gives each deferred site an owned folder of the wrap or an owner-form
  name; a series is a root-run, multi-phase folder that make-series.sh creates and remove-series.sh removes later, so an
  owned folder dies too early and an owner-form claim of a gone pid is swept ten minutes later. The question consultants
  (b5c30429, both rows) call it a change. This second change of epoch 4 stops the plan.)

### Re-review for epoch 5

Narrowed: yes — E5's native measurement series (`native-(vibe|kimi)-<yyyymmdd>-<6 hex>`, made by `make-series.sh` and removed by `remove-series.sh`) leaves the prefix family and loses the guarantee the goal gave every resource a script creates outside its process (ownership, a claim, automatic collection after a kill): it is a bounded exception, made and removed only by its own scripts and never collected; and entry 4.1 withdrew a promised collection (a killed legacy `testsToDelete-coai-run-*` folder is removed only by S2-A's one-off clean-up, never by a sweep). E5's final Definition of Done and this plan's do not get smaller otherwise; the prerequisites got smaller in one place (P1 is closed by the owner's written statement) and wider in none
  (*[epoch 5, 2026-11-04, Opus review]* Two corrections, read with the line above, which is a record and is not edited.
  (1) WHO MAKES THE SERIES. It is not "made by `make-series.sh`" alone: the LEAD on Windows makes the bare folder over
  ssh (`scripts/lib/native-run.mjs:91` `mkdirArgv`: `/bin/mkdir -m 700 -- <series>`, no `-p`, so an existing folder
  fails), then `make-series.sh` refuses unless that folder exists with mode 700 and the uid of the user running it
  (`scripts/native/make-series.sh:43-45`) and FILLS it. "Made and removed only by its own scripts" is read as: the
  scripts that own it are `native-run.mjs` (`mkdirArgv`, `seriesOf`, `removeArgv`) and the four files
  `scripts/native/*.sh`. (2) THE REASON IS NOT COMPLETE, and "wider in none" is wrong. The series also leaves what the
  janitor lists (`tools/janitor.sh:156`, `RX='teststodelete[-_]'`) and what the barrier scan (`sweeper-scan.mjs`) lists,
  so a forgotten series is invisible to both; the documents say how a person finds it (`ls -d <root>/native-*`,
  § *Epoch 5* item 4). And the prerequisites got WIDER: merge condition (n), P12 and P13 of § *Epoch 5* items 3 and 6 are
  new obligations. Also, a reboot is not the only thing that clears `/tmp`: a tmp cleaner does too (systemd-tmpfiles'
  age clean-up; Fedora's default is 10 days), so "a reboot" in item 4 reads "a reboot or a tmp cleaner".)

| Work | Where | Verdict | Action |
|---|---|---|---|
| the epoch-4 record — the re-review after entries 3.1 and 3.2, the judge's table, approved by the owner, conventions #118 `650607f9` (merged 2026-11-03 16:49Z; epoch 4 opens here) | main, unreleased | fits | kept — a record; what § *Epoch 5* supersedes in § *Epoch 4* (item 1's "no code", item 5's NEXT block, item 2.1 and question 2) is named in § *Epoch 5*'s opening paragraph and read from there, not rewritten |
| coai #943 `8dc0765c` — the E5 stories revised for epoch 4 (the adapted copy, the merge-gate table, the gated `Main`; the correction the epoch-4 judge asked of #942), merged 2026-11-03 17:18Z | main of dew_flow_connect_other_ais | cut | corrected in a NEW PR, coai #945 (the rest of the document is kept): its merged text says the Node sweep collects a killed old run's legacy `testsToDelete-coai-run-*` folder (D4 `:428-430`, S2-B item 3 `:841`, Q3 `:1501-1502` at `8dc0765c`) against 4.1's correction, and puts the native series under S4's two options against § *Epoch 5* item 4; #945 corrects D4, S2-B item 3 and Q3 (`89494366`) and adds the exception (`ba526043`), landing with the producer PR's squash merge; still to add on #945 before it merges: a 4.1 note at the two lines that still say legacy names are "collected on `gone` only (Node)" — S2-B's DoD (B) `:915` and the DoD's S2-B box `:1551` (line numbers at `ba526043`). *[epoch 5, 2026-11-04, Opus review]* DONE: `a2c155b2` adds the 4.1 note at both lines |
| F24 — the baseline proof accepts a process-wide gate before discovery, conventions #119 `ff0ea790` | main, unreleased (`release` is still `cc24f9e`) | fits | kept — prerequisite 2 of § *Epoch 5*: one release with F3, coai's pin before S6, its acceptance check against the released guard before S6 |
| F25 parked — a consumers test leaves its scratch repository behind, conventions #120 `5adee574` (a register entry of the follow-ups plan, outside this plan's epics; a row so the judge sees every merge of the period) | main | fits | kept — outside this plan, not a prerequisite (§ *Epoch 5*, item 2.6) |
| the entry 4.1 record — E5's legacy-collection promise cannot hold at the pinned reference, conventions #121 `38fe4ec0` | main | fits | kept — a record; § *Epoch 5* item 1's clarification and item 4's last paragraph build on it, and the reference at the pin agrees (`LEGACY_OWNER_TEXT` reads only the `linux`, `macos` and `windows` tags, `tools/lib/owned.mjs:58`) |
| the merged-core remainder plan — its late stop, re-review and promotion to `research/`, R6 handed to this plan, conventions #122 `c631448b` (another plan's own record; a row because R6 is this plan's open tail) | main | fits | kept — merged 2026-11-04 09:40Z, before the stop commit; its four lines in this plan only repoint links to the promoted file (a repaired reference, not a change); R6 is ticked with this plan's promotion (§ *Epoch 5*, item 1) |
| coai #945 (draft), S3 — the adapted C# library with its manifest and diff check; the owner-form, fail-closed run folder in all four C# suites; the gated `Main` (exit 78, one line, before discovery); Step 0 and the server's run-folder proofs on Windows, the layout self-test on macOS; commits `cbce86a1` … `df681b93` (2026-11-03 17:08Z–19:51Z) | pushed, unmerged (draft PR) | fits | kept open, unmerged until epoch 5 is approved — § *Epoch 5* item 5 keeps S3 as built; it makes no native series and collects no legacy name (a legacy leaf is refused as a run folder, `src_mcp/tests/RunTempGateTests.cs`); the merge of `main` into the branch (`4bc90f52`) is a merge, not a history rewrite |
| coai #945 (draft), S2-B — the Fable spec and its gate note (`89494366`, `594a1d00`); the owner-aware sweep as the assembly fixture of every C# suite and the extension runner's sweep, behind ONE switch; `run-lib-tests.mjs` in front of the bare `node --test`; the order proof; the review fixes; commits `5ff1ffb5` … `6ec356a1` (the PR's head, 2026-11-04 08:53Z); CI green on Linux, macOS and Windows (run 41803072375; the order-proof margins 102–204 ms, the comment on #945); *[epoch 5, 2026-11-04, Opus review]* then the E5 document's revisions at this re-review, pushed on the same branch: `ba526043`, `a2c155b2` (the judge's fix forward of #943 and the remover's ownership check), `0c092b13` (the re-review gate: the root's ownership and sticky bit, a phase on a gone series) and `0d03740d` (the interim document gate, five findings) | pushed, unmerged (draft PR) | fits | kept open, unmerged until epoch 5 is approved — nothing relies on collecting a legacy coai-run folder: both languages LIST it and assert it is never collected (C# `LegacyNames…` "a legacy name is never collected"; Node N-S2 "a legacy name is listed and never collected"), which is 4.1's correction; nothing relies on the native series keeping the prefix: the sweeps touch only owner-form and legacy names of the `coai` token, so `testsToDelete-native-…` (a legacy name of the token `native`) is out of their scope today and `native-…` after S4; `run-lib-tests.mjs` makes no run folder, as item 5 leaves to S4 |
| coai throwaway branches `tmp/e5-s2b-red-windows` `05752307` (run 41717749312: row 12's Windows arm red for its reason, so no entry 4.2 came from it) and `tmp/e5-s2b-red-macos` `9fbd4e23` (run 41717755065: the macOS arms of rows 3 and 5 red) | pushed, never to merge | fits | kept, never merged — both runs failed as recorded (checked 2026-11-04); the mutations are the red half of S2-B's evidence and touch neither the native series nor a legacy collection; delete both once #945's review no longer needs them, as creds did with `tmp/e21-byhand` |
| coai local `d3791c00` on `feat/test-leftovers-e5-producer` — the order-proof margins per CI cell in `research/module_tests.md` | local (when the table was written); pushed with `ba526043`, now on draft PR #945 | fits | kept open, unmerged until epoch 5 is approved — one line of measured record, the margins § *Epoch 5* item 1 cites |
| creds #294 (draft) at `34225009` — the E2.1 by-hand records, part 7 (`70da168`); the Windows socket-length test fix, test-only (`22e16a7`, coai code round 9 `proceed`); the POSIX short root named (`3422500`); and, pushed after this table was written, the run-2 record [E2.1 byhand 10] (`be47183`, the PR's head now: run 2 green on both jobs, the by-hand records of items (b) and (c) complete) | pushed, unmerged (draft PR) | fits | kept as a draft, unmerged until epoch 5 is approved, condition (c) for the WSL machine and its gates — `be47183` is the record § *Epoch 5* item 5 asks for before E2.1 merges; `22e16a7` and `3422500` are test-only; E2 keeps owner form per site and promises no legacy collection (E2 document `:54`, `:104`: listed, never collected); fix forward on its branch: its `docs · plans` check (public hygiene) is red since `70da168` on three home paths — a real home path in the E2 document `:1453` (`70da168`), the hosted runner's Windows profile path at `:1459` (`3422500`) and in `src_vs_code/src/test/leftoversSites.test.ts:91` (`22e16a7`); replace them with placeholders. *[epoch 5, 2026-11-04, Opus review]* DONE: `9a6e9fa` ([E2.1 byhand 11]) replaces the three home paths with placeholders (`C:\Users\<you>`, `<checkout>`); it is the PR's head now, a docs fix forward only |
| creds throwaway branch `tmp/e21-byhand` — `b39a18e` (run 41809870657, failed: the one test bug of the first full Windows unit run), `3257bf5`, `cdc116b6` (run 41812168328, running when this record was written; it then FINISHED GREEN on both jobs: `macos-sockets` PASS, `windows-unit` 6024 tests, 0 failed, compared values 0 · 0, recorded by `be47183`); the branch was then DELETED on the remote and locally (its four files are quoted by name in the E2 document, [E2.1 byhand 6..8]) | pushed, never to merge; deleted on the remote and locally 2026-11-04 | fits | dropped — deleted after its record (`be47183`); nothing to revert, it never reached a pull request |
| conventions PR #124 (open) `39b3c9f3` — `research/security/machines.md`: P1 closed by the owner's written statement, the WSL machine re-attested with two root-only places open; and four dated notes in § *Epoch 4* of this plan | pushed, unmerged (open PR) | fits | kept open, unmerged until epoch 5 is approved (it carries this plan's P1 notes; it merges cleanly with this branch, `git merge-tree`) — § *Epoch 5* items 1–3 rest on it as written; fix forward on its branch: `research/security/machines.md:67` links `../../todo/PLAN_test_leftovers_merged_core_release.md`, which #122 moved to `research/` (the branch already carries #122), so the link must be `../PLAN_test_leftovers_merged_core_release.md`; `plan-lifecycle.mjs` reads only the top level of `todo/` and `research/`, so its check is green over the broken link. *[epoch 5, 2026-11-04, Opus review]* DONE: `60965620` repoints the link to `research/`; before it, `18449fbb` (a CodeRabbit fix: the consumer-sweeps line of `machines.md` states the local scan only; E7's stage A stays open in this plan) — both on the PR's branch, records only |
| conventions PR #125 (open) `78ef6867` — follow-ups F27 and F28 (outside this plan; not prerequisites) | pushed, unmerged (open PR) | fits | kept open — outside this plan (it edits only the follow-ups plan and `todo/README.md`), so the stop does not hold it; fix forward on its branch: F27's reason "the rollout's epoch 4 already holds one change" (`todo/PLAN_test_leftovers_merged_core_followups.md:753`) is stale since entry 4.2; § *Epoch 5* item 2.6 is the reason now |
| the stop record — entry 4.2, `state: stopped`, `9632f5a0` (branch `docs/rollout-stop-epoch4`; this revision builds on it) | pushed, unmerged (no PR yet) | fits | kept — merges before or with epoch 5's line; the revision (`279fa41`, `b4390a1`) and this judgement build on it |
  (Written 2026-11-04 with the revision of § *Epoch 5*, over both entries of epoch 4: 4.1, the legacy-collection
  promise that cannot hold at the pin; and 4.2, the native measurement series that fits neither S4 option. Re-review
  consult `d7ad1ace`; the question consultants before it: `b5c30429` (4.2), `08beb732` and `76d09c26` (4.1). The
  Verdict and Action cells are `—` until an Opus judge fills them (step 5 of the full stop). Not rows: the conventions
  PR 123 (the editor workspace, outside this plan); the branch `docs/only-a-person-releases-the-gate` (a coai gate
  rule, outside); coai PR 944 and creds PR 295 (Windows code signing, outside); the S4 brief (in the session's
  scratchpad, not repository work); and this revision commit itself, which is the baseline epoch 5 is approved on,
  never an entry.
  The epoch 5 line is written only when the owner approves.)
  (Added the same day, after the table was written: the E5 stories document's epoch-5 commit (coai `ba526043`) was
  pushed on the producer branch, and that push carried `d3791c00` with it, so the row "coai local `d3791c00`" now
  stands at "pushed, unmerged (draft PR)"; `ba526043` itself is a revision commit of this re-review, not a row.)
  (Judged 2026-11-04 by an Opus judge against § *Epoch 5* and the E5 stories document as revised (coai `ba526043`): 14
  rows fit, 1 is cut — coai #943, merged text that still promises the collection of a killed old run's legacy folder
  and puts the native series under S4's two options; its correction rides #945. Checked for 4.1 and the exception: no
  code of #945 relies on collecting a legacy `testsToDelete-coai-run-*` folder (both languages list it and assert it is
  never collected), and none relies on the native series keeping the prefix (the sweeps judge only names of the `coai`
  token). Fixes forward named in the rows: two E5 lines on #945 that still say "collected on `gone` only (Node)"; creds
  draft 294's public-hygiene check, red since `70da168` on three home paths; the broken link in conventions PR 124
  (`research/security/machines.md:67`, to the plan that #122 moved); the stale F27 reason in conventions PR 125. Timing:
  creds `22e16a7` and `3422500` (test-only) were committed minutes before the stop commit `9632f5a` (11:13 +01:00), and
  `be47183` after it is a record only, the one § *Epoch 5* item 5 asks for; coai `d3791c00` was committed before the stop
  and pushed after it with the revision. Added by the judge: `be47183` to the creds row, and run 2's green end and the
  branch's deletion to the `tmp/e21-byhand` row; no new row, as every merge and push of the period is in the table or
  named above as not a row. Also checked and not rows (outside this plan, under their own plans): benchmark PRs 153–157
  and amd_r9700_tuning_ai PRs 6–12. No wave-3 epic (E6, E7) has work in the period.)
  (*[epoch 5, 2026-11-04, Opus review]* The Opus review of this re-review added, in the rows above, the commits that
  existed when it was written — none of its own: conventions #124 `18449fbb` and `60965620` (its fix forward is done),
  creds #294 `9a6e9fa` (its fix forward is done), coai #945 `ba526043`, `a2c155b2`, `0c092b13`, `0d03740d` (the E5
  document's revisions at this re-review; `a2c155b2` is the fix forward the #943 row asked for). Every one of them is a
  docs commit on a branch already in the table; no verdict changes. What the review corrected in § *Epoch 5* and in the
  E5 stories document is marked `*[epoch 5, 2026-11-04, Opus review]*` in place; it is part of the baseline epoch 5 is
  approved on, not an entry.)

> Epoch 5 · approved 2026-11-04 · by owner · state: closed

- 5.1 · 2026-11-04 · agent · approach — on Windows a rename has no single winner, so E5's C# copy holds a per-root mutex around a whole sweep on Windows, an op on the template's text
  (Measured on a hosted windows-latest runner, run 41873954643, a bare .NET console: two threads race Directory.Move on one
  source, 40000 times; both calls succeeded in 39951, with one destination left. Found through S2-B's two-sweeps test, red on
  Windows in two ways (coai ci runs 41843872560, 41867523353); consult e9d7aec0. The template's RenameExclusively assumes a
  single winner. Consequences on Windows with two sweeps at once: a false report in Removed, and a schedule read in the code
  where the winner of the claim deletion leaves the other sweep to restore an unclaimed, possibly half-deleted folder that
  later sweeps keep as unmarked. No wrong deletion was found. Loosening the test would hide that. This departs from
  "the template wins" for a defect that blocks the PR, so it is a change and not a fix inside the plan; the same report goes
  to the template's owner as F29 of the follow-ups plan. E2.3, E6 and E7 copy the template later and read F29 first.)
- 5.2 · 2026-11-05 · agent · contract, approach — E5's must-not-copy row 2 asks for twelve planted spellings in a `.mjs`, RED when the folding reader is off, but the shipped Node guard has no folding reader (2 of 15 spellings found at `bd795847`), and D6 gives Node detection to the shipped tool
  Found writing E5's S6 brief; reproduced by the consultant (consult 5d804d0c: a split literal through `scanText` answers `[]`). A coai-own reader, a new conventions release or a narrowed row each changes a contract or a prerequisite. E2 has the same gap.
- 5.3 · 2026-11-05 · agent · merge-conditions — D8 (b) says only the authorised `raw-temp` baseline is left, but the guard must read `src_vs_code/scripts` (P13), which holds 54 `raw-temp` lines no baseline scope can carry, and `src_server/smoke-image.sh:73` is a raw temp outside every scope
  A scope needs a proof that is a test file under its root, and that folder has none. The brief's answer was inline exemptions; the consultant reads that as narrowing D8 (b), and I agree. The brief's premise for `smoke-image.sh` was also wrong: its trap is set after fallible work (`:73`, `:102`), so a failure can leave the folder without a kill.

### Re-review for epoch 6

Narrowed: yes — two things got smaller, both in E5's producer PR: (1) must-not-copy row 2's NODE half — the shipped Node guard has no folding reader (2 of 15 planted spellings found at `bd795847`), so S6 pins only what the shipped guard does detect in a `.mjs` (a whole legacy literal, a bare-word glob that is removed), says plainly what it does not, and the folding reader for Node is F30 of the follow-ups plan with an owner and a date (2026-11-19, accepted), not a condition of the PR (option C of entry 5.2); the C# half of row 2 stands; (2) E5's D8 (b) — "only the authorised `raw-temp` baseline is left" becomes "only the authorised `raw-temp` baseline and the inline `raw-temp` exemptions of the expected-exemption inventory are left", each exemption with a containment reason proved line by line in S6 (the `raw-temp` lines of `src_vs_code/scripts/` that the guard reads under P13, and `src_server/smoke-image.sh:73`). The runtime barrier does not get smaller. Also smaller, named because the judge found the first text under-named them (the coordinator's decisions of 2026-11-05): (3) the inventory's inline `raw-temp` rows are up to 77, not 55: the 54 lines and `smoke-image.sh:73`, plus 22 in `deploy/**` 9, the installers 2, `release.yml` 2, `scripts/probe-*` 5, `kimi.mjs`, `Serving.cs`, `TempDir.cs`, `Owned.cs` (the count binds when the inventory is made), each with its own traced kind of reason; (4) the Definition of Done's reading changes for every Node consumer, not only E5: a zero of whole literals until F30; (5) the goal gains a second bounded exception, `src_server/smoke-image.sh` (item 4.3); (6) E5's S7 ends with its baseline at zero and the inventory's inline rows still standing, not "red on ANY raw temp call". The prerequisites got WIDER in three places that narrow nothing by themselves (the audit runs before the run folder is removed; the baseline's FINAL content is validated at the PR's last head; the smoke script's trap moves before its `mktemp`).
  (Written 2026-11-05 with the revision of § *Epoch 6*, over the three entries of epoch 5: 5.1, the Windows sweep
  mutex (built on #945, not narrowed, kept); 5.2, row 2's Node half; 5.3, D8 (b) and the 54 lines no baseline scope can
  carry. Re-review consult `7f55e578`; the question consultants before it: `5d804d0c` (the split literal). The Verdict
  and Action cells are `—` until an Opus judge fills them (step 5 of the full stop). Not rows: coai #948 (the SQLite WAL
  switch, outside; the judge gave it a `—` row at the coordinator's request) and
  conventions #131 (F26's values, the owner's item); the shared-rules plan's ledger (#127, another plan); and this
  revision commit itself, which is the baseline epoch 6 is approved on, never an entry. The epoch 6 line is written
  only when the owner approves.)

| Work | Where | Verdict | Action |
|---|---|---|---|
| the epoch-5 record — the re-review after entry 4.2, the judge's table, approved by the owner, conventions #126 `02bf273` (merged 2026-11-04 13:05Z; epoch 5 opens here) | main | fits | kept — a record; what § *Epoch 6* supersedes in § *Epoch 5* is named in § *Epoch 6*'s opening paragraph and read from there |
| the E7 stage-A record and the `ResidentSet` must-settle, conventions #128 `0acd8c9`; entry 5.1 and F29, conventions #129 `e61e74a` | main | fits | kept — records; item 8.2 and the E7 table take the must-settle, item 4.6 keeps 5.1, and F29 is read before E2.3, E6 and E7 copy |
| the release `bd795847` — F3 (#116), F24 (#119) and the test-only #130, promoted 2026-11-05 with the owner's agreement to the over-cap bumps; the F24 FIRST acceptance run before it (the guard's proof check closes both ways under `--profile node`; the five forced runs exit 78 on the C# host, `RunTempTests` 21 of 21; both Node proof files 6 of 6) | `release` = `bd795847` | fits | kept — item 2.2; `tools/lib/leftovers-package.mjs` and the baseline rule are at this sha (read); the guard facts of this re-review were measured at it |
| the pin bumps to `bd795847`, each alone and OPEN when this was written: coai #947, creds #297, mcp #64, sidecar_rust #70, vscode_kit #23, wsl_care #186 (the seven over-cap bumps the owner agreed to on 2026-11-05; rag_qln's not opened yet), benchmark #166 and r9700 #14 under the cap | main of each repository, merged 2026-11-05 09:50Z (coai `b9dd7229`, creds `8db22098`, benchmark `a37f31c7`, mcp `5ccfcfde`, sidecar_rust `8efee6f7`, vscode_kit `f0ec3641`, r9700 `6d1a34e1`, wsl_care `6e0cbcca`) | fits | kept — each changes one path, the mount's gitlink (read with `gh pr view --json files`), a pin bump alone (entry 1.2); they carry no epic code. Merged 09:50Z, after the stop commit (09:31Z): the rule's Halt list does not name a pin bump, the status paragraph's reading is what let them go, so the owner sees that at the approval |
| dew_flow_rag_qln #88 at `5e4ca20f` — the rag_qln pin bump to `bd795847`, with its two externals at their tips (three gitlinks: `.agents/conventions`, `external/dew_flow_benchmark`, `external/dew_flow_mcp`); it opened after the row above was written | pushed, unmerged (open PR) | fits | kept open — its pin check compares the externals with their tips, so the three move together (its PR text); no epic code; it ends question 4 of item 7 |
| coai #945 (draft), S4 — the Node wrap, `beginRun` fails closed, the first-import refusal, the native series renamed `native-(vibe or kimi)-…` with the caller's `stat` check, SonarCloud and the Windows step through the runner, the Windows throwaway record (`test:host` 24/24 + 1/1); commits `93c3092a` … `bd03bb3e` (2026-11-04/05) | pushed, unmerged (draft PR) | fits | kept open, unmerged until epoch 6 is approved — the tests of condition (n) were read item by item (the record's judge note); `runnerScripts.test.mjs` E1, E2, E3 are what item 4.2's proof for the entries rests on. Fix forward before the merge: the PR description is stale (it still says "This draft holds S3 only"; D11's text and the seven items of (n) are not in it) |
| coai #945 (draft), S4's final fix round, the commits of this period: `d0642022` (docs), `53073514` (RED), `2d4de35b`, `2df2cae8`, `8ffc20fb`, `b0689d39`, `863d4a6a`, `5f56e489` (docs), `c8fd08cb`, `60b7b671` (the guard line in `windowsPackageIsSigned.test.ts`), `bd03bb3e` (docs) | pushed, unmerged (draft PR) | fits | kept open — scripts, tests and records of S4 (`native-run.mjs`, `lead.mjs`, `run-contract`, the runner's exit paths); no product code, nothing contradicts § *Epoch 6* |
| coai #945 (draft), the merge of `main`, `0fc32e04` — the signing work #944 and #946 (outside this plan) into the branch | pushed, unmerged (draft PR) | fits | kept — a merge, never a rewrite; the next one brings #947, as item 2.2 asks |
| coai #945 (draft), the two fixtures that build the old prefix from pieces: `scripts/lib/native-run.test.mjs:42`, `scripts/native/native.test.mjs:506` (from S4 `1edf7157`), with the sentence of `research/module_tests.md` § *the native measurement series*, item (3), that S6 lists them | pushed, unmerged (draft PR) | cut | fix forward in S6, never a rewrite — plain literals with the inline `legacy-name` exemption (item 4.1; the shape the epoch-3 judge called a defect, row (d) of § *Epoch 3* item 6), and the `module_tests.md` sentence corrected with them |
| coai #945 (draft), entry 5.1 — `SweepLock.cs` (a per-root named mutex across a whole Windows sweep), three manifest ops, the strict tests; RED runs 41875636356, 41878243091, 41893469970; Windows green twice on run 41881044878; commits `aaeb5e81`, `7d6048e1`, `68528ef5`, `e250a14d`, `ef8baeba`, `826b977f`, `ab789672` | pushed, unmerged (draft PR) | fits | kept open, unmerged until epoch 6 is approved — item 4.6. `SweepLock.cs` was read: a wait that times out or a mutex that cannot be opened means no sweep and one listed line, POSIX is unchanged, so it can only sweep less. Each commit named in the row is its RED, its op, its process test or its record |
| coai #945 (draft), S5 — the bare prefix leaves every eligible site, the legacy fixtures plain literals with the inline exemption, the fixture bug it exposed fixed; `d8dff1a6`, `cab9a172`, `524df50e` (the PR's head; every job green but the pin check — the promotion's known result — and the `continue-on-error` real-editor job, a transient VS Code version lookup before any editor started) | pushed, unmerged (draft PR) | fits | kept open, unmerged until epoch 6 is approved — `d8dff1a6` touches 121 test and record files and no product code; `cab9a172` and `524df50e` are test fixes. A correction to this row's words: on run 41997175100 the `build-test` job stops at the pin check, so the four steps after it (Adapter check, Gate snippet, Build flags, Workflows parse) were SKIPPED, not green; the first run with the pin at `bd795847` shows them. The real-editor job's reason holds (the first launch ended with an empty reason at `Resolving version...`; the second launch's scenario passed) |
| coai local `548f14a1` … `6b3f143e` on `feat/test-leftovers-e5-producer` — the S6 build brief (`todo/PLAN_test_leftovers_E5_S6_brief.md`), five docs commits; its Decisions 1 and 2 are entries 5.2 and 5.3 | local (a copy pushed to `docs/e5-s6-brief-at-stop5` with this revision) | fits | kept as the base of the revised brief (item 4.7), by an Opus author, after approval: the facts, the manifest ops, the 54 rows (reproduced by the judge), the CI legs stand. The index line of `todo/README.md` that `plan-lifecycle` asks for was added by the judge |
| the same brief's parts that § *Epoch 6* replaces: Decision 1's option A with § 7.4 `foldedPrefix.mjs`, its § 5 row, N8, R3 and § 21 items 2 and 8; Decision 5 and the § 10.4 reason `its EXIT trap removes this folder`; § 11's "the disposal order … must not matter" with its table; § 12.4 without the final check | local (a copy pushed to `docs/e5-s6-brief-at-stop5`) | cut | fix forward by item 4.7, in new commits, never a rewrite of the pushed copy; no coder starts from those parts |
| dew_flow_rag_qln #86 `47998e7` — E7 stage A: the daemon lists `qlntest_*` and drops none by name (merged 2026-11-04, after epoch 5 opened; not in epoch 5's table) and #87 `88577ff` — its plan promoted with the live check: 8 collections, 18867 points, 84 MB of vectors, 221 MB on disk, a second run adds none; the "about 8 GB per recipe change" refuted (about 0.2 GB) | main of dew_flow_rag_qln | fits | kept — E7's stage A and its record; the sampler lists and drops nothing by name, and the must-settles it found are rows of item 3's E7 table |
| creds #294 (draft) at `9a6e9fa` — no commit since epoch 5's table | pushed, unmerged (draft PR) | fits | kept open, draft — it waits for (c), for epoch 6 and for a merge of `main` with #297. No code of it relies on folding. Fix forward by E2's own revision (item 8.3), which also names `src_vs_code/src/test/leftoversSites.test.ts:74` (`'testsTo' + 'Delete-agent-'`, a self-scan's needle in two pieces, which F30's reader will read) |
| the stop record — entries 5.2 and 5.3, `state: stopped`, `b3658f67` (branch `docs/rollout-stop-epoch5`; this revision builds on it) | pushed, unmerged (no PR yet) | fits | kept — merges before or with epoch 6's line; the revision (`5eb41c1`) and this judgement build on it |
| conventions #130 `bd795847` — the test-only janitor fix that rode the release ("the other owner" is never the person running the tests) | main; `release` | fits | kept — `tools/janitor.test.mjs` only, outside this plan's epics |
| F30 of the follow-ups plan, `acf4785` — the shipped Node guard reads only whole literals; an owner and a proposed deadline (entry 5.2, option C) | pushed, unmerged (no PR yet; this branch) | fits | kept — merges with the record; the judge's re-measure is a dated note under it |
| coai #948 at `5e508444` — the SQLite WAL switch (`busy_timeout` before `journal_mode=WAL`) | pushed, unmerged (open PR), outside this plan | — | outside this plan, no verdict; four files, no temp API added (read), so it moves S6's counts by nothing |
  (Judged 2026-11-05 by an Opus judge against § *Epoch 6* and the E5 stories document as revised (coai `6a7c2124`, `37e4b6ca`): 16 rows fit, 2 are cut — both unmerged, both
  fixed forward: the two split fixtures on #945, and the parts of the S6 brief that § *Epoch 6* replaces; #948 is outside. Nothing merged contradicts the revised plan. The judge added the
  rows for S4's final round, the merge of `main`, the two cuts, rag_qln #88, #130, F30 and #948, and corrected the plain facts of item 1, item 3's states, items 4.2, 4.3, 4.5 and 4.7.
  Read and run: `leftovers-check.mjs` and `raw-temp-baseline.mjs` at `bd795847` (an extract, on the coai tree and in a private repository); xUnit 4.0.1's `FixtureMappingManager` and a
  throwaway two-fixture project built both ways; the 54 rows against a grep; the entries' first statement; every library's importers; `gh` for PR states, files and run 41997175100.
  Findings for the coordinator, NOT changed here (decisions):
  (q) cannot go green as written. `--print-baseline` reads no `.cs`: 252 entries on the coai tree, 0 of them `.cs`; it prints `scopes: []`, in locale order, pretty-printed, so a byte diff of a six-scope file is never zero; the C# printer the text
  asks for is a throwaway in the brief (§ 8.3). And an equal list would prove nothing new: `--baseline` already reconciles entries and sites both ways. The gap is growth AFTER the creation: measured in a private repository, a new site plus a new
  entry passes `--baseline` and equals the print as a multiset, while `--baseline-shrinks --base <the creation commit>` refuses it with `new key`. Proposed: "at the last head, `--baseline-shrinks --base <the creation commit>` exits 0, recorded; both wrappers green".
  (o) has no mechanism yet, and its obvious one costs the barrier something. xUnit 4.0.1 disposes assembly fixtures in CREATION order, and creates them in attribute order (source and a run, both ways). All four `RunTempStart.cs` list `RunTempFixture`
  first, so TODAY the run folder ends before the audit: the wrong order is the real one. The plant discriminates by reading (`Discover` answers `[]`, the registry lacks the claim, `Verdict` is null), if its child runs with no inherited `TESTSTODELETE_RUN`.
  Swapping the attributes makes the real-root sweep run BEFORE `RunTempFixture`'s constructor, the fail-closed fallback for a host that bypassed `Main`. Proposed: the audit and the end of the run folder become one ordered call in the sweep fixture's disposal
  (audit, then `EndOfRun` in `finally`), and `RunTempFixture.Dispose` no longer ends the run (the process-exit handler stays): no order to pin. The pin must exist per suite: the brief's self-test runs on `CoaiMcp.Tests` only.
  D8 (b) still lets a future allocation go unnoticed in one way: a NEW caller of an exempted library (`browserLayout.mjs`, the `seam-*.mjs`). No marker and no inventory row moves, and "every importer" is a one-time `git grep -l` on the PR. A new entry cannot (E1, E2, E3 are standing tests), and a new line
  in the folder cannot (the guard, then the inventory). The markers are not hash-bound either, unlike the baseline: a line can change under its marker. Proposed: a standing test beside E1 that each exempted library's importers are entries or tests. As written, "proved line by line" is executable for entries and reads; for libraries its end state (a list in the PR) expires at the next import.
  The narrowing is under-named. The record and D8 (b) name 54 lines and `smoke-image.sh:73`; the brief's inventory holds 77 inline `raw-temp` rows: 22 more (§ 10.4: `deploy/**` 9, installers 2, `release.yml` 2, `scripts/probe-*` 5, `kimi.mjs` 1, `Serving.cs`, `TempDir.cs`; and `Owned.cs`); most fit none of the three proof kinds of D8 (b). `smoke-image.sh:73` has no containment reason at all (its folder is in the machine temp when a person runs it, and a `kill -9` at any moment leaves it with no claim and no prefix: a second instance of the goal's exception, which item 1 says stands word for word). The record's "the Definition of Done … does not get smaller" sits beside item 1's reading of it for every Node consumer, not only E5, and E5's S7 no longer ends "red on ANY raw temp call". Item 4.1's "RED … is not possible" is not so: the positive test goes red against a patched copy of the guard, by hand, once.
  Condition (d): no WSL record exists; the E5 document's D8 (d) is another condition, and the brief's § 18 reads it as "no condition on this PR" while the parent's Definition of Done keeps the per-machine record: the two must agree.
  Could not check: the audit's order in a real suite run (the audit is not wired until S6); the private sibling; Windows behaviour of any of this.)

> Epoch 6 · approved 2026-11-05 · by owner · state: closed

- 6.1 · 2026-11-05 · agent · approach — tracing the S6 inventory's rows showed that the kinds of reason, written before the trace, fit 11 of them badly: the fourth kind's standing test keeps "names" and holds a pinned list of the test files that name a file without reaching the line, and a fifth kind covers a line a test reaches whose product caller is not a test run, pinned by an assertion in each test
  (Found by the Opus author revising the S6 brief. Seven rows: a test file names the file and reads its text, or runs or sources it without reaching the line. Four rows: `install-cli.sh:22`, `install-agy.sh:61`, `deploy/bugs/install-env.sh:101`, `deploy/systemd-release.sh:161`. The plan said of the first two that those tests pin the TMPDIR; none did, it was only inherited. The count, the ceiling of 77 and the runtime barrier are unchanged. The owner's approval named standing tests; this keeps them and adds the pinned list.)
- 6.2 · 2026-11-05 · agent · merge-conditions, approach — on the elevated hosted Windows runner a new file is owned by `BUILTIN\Administrators`, so `LeftoversAudit` reads a real orphan claim as a stranger's and never names it; merge condition (o) cannot hold there as written, and its plant proves the ordered call on Windows only for a claim re-owned to the caller
  (Found by S6's own run: coai run 42026897727, job 127243250229, 14631 tests, one red: `AnOrphanClaim_IsReportedByTheAudit_BeforeTheRunFolderEnds`, exit code 0. The limit is old and is written in the copied
  `LeftoversAudit.cs:10` and in the template's plan, `dew_flow_mcp · research/PLAN_test_leftovers_E3.md`; D9 copies the audit "as in the template", but no text of this plan or of E5's says it, and the S6 brief's § 11.3 row
  says "red through `Discover`" with no limit. Counted because the doubt is real: the one line added to the plant is a build line of the brief, and the condition now proves less on Windows than it reads.
  Consultants `ee497a76`: both answers take the owner fixture over a skip; one counts the change, the other counts it unless the approved baseline already states the limit, and it does not. The fixture is
  `WindowsOwnership.OwnedByCaller`, which needs no privilege; `RunTempGateTests.cs:261-262` already uses it. Not applied until epoch 7 opens.)

### Re-review for epoch 7

Narrowed: yes — E5's merge condition (o) and the goal: on an elevated Windows run, which `windows-latest` is (measured; a PR's only Windows leg; the release's `windows-11-arm` is not measured), a real orphan claim or unregistered folder stays unseen by the audit, and what a run leaves (killed, or not removable at its normal end) is kept by every sweep, so it waits for a person; the plant proves the order on Windows with a re-owned claim, and a test pins the limit (§ *Epoch 7*, items 1 and 4).
  (Written 2026-11-05 with the revision of § *Epoch 7*, over the two entries of epoch 6: 6.1, the kinds of reason; 6.2, the plant. Re-review consult `dd79d0aa`; the question consultants
  before it: `ee497a76`. The Verdict and Action cells are `—` until an Opus judge fills them (step 5 of the full stop). The epoch 7 line is written only when the owner approves.)

| Work | Where | Verdict | Action |
|---|---|---|---|
| the epoch-6 record, F30 and the owner's answers, conventions #132 `fd2d14f1` | main | fits | kept — a record; § *Epoch 7*'s opening names what it supersedes and § *Epoch 6* stands for the rest |
| coai #947 `b9dd7229` and the other pin bumps to `bd795847`, rag_qln #88 `9852c1f0` | main of each repository | fits | kept — each merge read through `gh`; the epoch-6 table read their files (one gitlink, three on rag_qln). They end question 4 of § *Epoch 6* item 7, and the E7 pin row is now done |
| coai #948 `ae52bd55`, the SQLite WAL switch | main of coai, outside this plan | — | outside this plan, no verdict. It reaches S6 through the merge of `main`: its patch to `SqliteMigratorTests.cs` holds no temp API and leaves that file's one baseline entry (`:21`) alone (read) |
| conventions #133 `e45ad11`, F27, the peer session's | main, outside this plan's epics | — | outside this plan's epics, no verdict. Rule text and the follow-ups plan only; not in `release`, so no pin moves (read its file list) |
| coai #945 (draft), the S6 brief's revision and the merge of `main`, `84b14a26`, `e8355d2b` and their neighbours up to `c17ef377` | pushed, unmerged (draft PR); a copy on `docs/e5-s6-brief-at-stop5` at `8b47dc20` | fits | kept — docs and one merge, never a rewrite; the parts § *Epoch 7* replaces are the next row |
| the same brief's parts that § *Epoch 7* item 4.4 replaces, as they stood at `c17ef377`: § 11.3's orphan-claim row ("red through `Discover`"), § 11.4's child with no re-owning, R16 without the Windows RED, § 19's rows on the ordered call and on the smoke stub and the pins | pushed, unmerged (draft PR) | cut | fixed forward at `6f0b0a58`, never a rewrite; what the revision still leaves wrong is corrections C4, C5 and C9 of the note below |
| coai #945 (draft), `6f0b0a58`, the E5 document and the S6 brief at the stop of epoch 6 (not in this table when it was written) | pushed, unmerged (draft PR) | fits | kept — docs only (`git diff --stat 3fcba8a0 6f0b0a58`: two files); it is the PR's head. Corrections C3, C4, C5, C8 and C9 go on top of it |
| coai #945 (draft), S6's smoke script, RED `f1d7e122`, fix `47c04724` | pushed, unmerged (draft PR) | fits | kept open — the diff is the move of § 9.4, the owner-form name and its marker, nothing else. Row (p)'s and § 19's words on Windows are correction C5 |
| coai #945 (draft), S6's ONE ordered call, RED `77db4917`, `26190d5c`, and the plant in four suites | pushed, unmerged (draft PR) | fits | kept open, fix forward by items 4.1 and 4.2 after approval. The op's text, `RegistryWithoutTheRunFolder` and `RunTempFixture` match § 11.1 and § 11.2. The plant stays with its assertions, and it is red on hosted Windows until the re-owning lines go in (`CoaiMcp.Tests` in job 127243250229; `CoaiServer.Tests` too, in the probe's log) |
| coai #945 (draft), S6's guards, wrappers and pinned tests, `91e440ec` | pushed, unmerged (draft PR) | fits | kept open — the manifest's ops match § 6.3 and § 6.4, and 52 entries as § 5 says. `PlantedLines` (the tilde) is no widening; the PR says so in one sentence (the note, question 1) |
| coai #945 (draft), S6's site work `d7dc67cf`, the inventory and markers `8391882a` (28 pairs, four more than the brief) | pushed, unmerged (draft PR) | fits | kept open — outside the test trees `8391882a` adds only comment lines (read). Item 4.5's reading done: the five kinds hold (33, 19, 6, 14, 4, and the one bounded exception = 77), each row's hash matches its site, and E10's search redone by hand finds the same 28 pairs |
| coai #945 (draft), S6's CI legs `db8f895d`, the baseline `14370fdd` (778 entries), the repository check `72707ef6`, the creation step `b29c00c7` and its removal `3fcba8a0` | pushed, unmerged (draft PR) | fits | kept open — the legs match § 12; the creation step is gone (`ci.yml` equals `72707ef6`'s), and F4 is green on `6f0b0a58`. A dry run of (q) at this head says "only shrinks", exit 0; (q) itself stays for the last head. `72707ef6` only reports more at once: a failure stays red |
| the coder's draft section, a copy on `docs/e5-s6-section-at-stop6` (`564c63c5`) | pushed, no PR, not for merge | fits | kept as the source of item 5 step 2; the branch goes once `module_tests.md` § E5 S6 is written. It says nothing yet of the epoch 7 limit, so the section adds it |
| coai `tmp/e5-s6-audit-red` `54966789`, a throwaway: the audit disabled, the self-test step on three legs, run 42026952168 (not in this table when it was written) | pushed, branch deleted, its run kept | fits | nothing to do — it never reaches `main`. It is R6's red on Linux, macOS and Windows: all three jobs failed in that step |
| coai `tmp/e5-s6-win-probe` `24d87dff`, a throwaway: run 42031613818, job 127259212955 (not in this table when it was written) | pushed, branch deleted, its run kept | fits | nothing to do — one workflow file only. The job's green is not the plant's: see the note, question 4 |
| dew_flow_benchmark #164, #165, #168, #169, #170, #171, merged in this epoch (not in this table when it was written) | main of benchmark, outside this plan | — | outside this plan, no verdict. The language comparison, model arms and a research note. #164, #169 and #170 edit `PLAN_bench_test_leftovers_followups.md`, but only its timing-test list; no E6 code, and the E6 boundary is still not written on that side (read) |
| the stop record, entry 6.2, `a280286` (this branch) | pushed, unmerged | fits | kept — merges before or with epoch 7's line |
| F31 and this revision (this branch) | pushed, unmerged | fits | kept — the baseline epoch 7 is approved on, never an entry; corrections C1, C2, C6 and C7 of the note below go in before the owner reads it |
| creds #294 (draft) at `9a6e9faf`, no commit since epoch 6's table | pushed, unmerged (draft PR) | fits | kept open, draft — read through `gh`: the same head, last updated 2026-11-04. E2's own revision takes item 8.3's sentence |
  (Judged 2026-11-05 by an Opus judge against § *Epoch 7*, § *Epoch 6*, the E5 document and the S6 brief at coai `6f0b0a58`: 15 rows fit; 1 is cut, unmerged and fixed forward; 3 are outside this plan. Nothing merged contradicts the revised plan.
  The judge added the rows for the brief's replaced parts, `6f0b0a58`, the two throwaways and benchmark's PRs, and corrected two plain facts in § *Epoch 7* item 1's State line on E5: #945's head, and why the baseline holds 778.
  Read: the diff `c17ef377..3fcba8a0`, commit by commit, against the brief's table (the copied guard files through the manifest's ops, not line by line); `Scope.cs`, `OwnedDir.cs`, `LeftoversAudit.cs`, `LeftoversSweep.cs`, `Removal.cs`, `RunTemp.cs`, `RunTempFolder.cs`, `WindowsOwnership.cs`, `Native.cs`'s Windows reads; `ci.yml`'s `windows` job, `release.yml`'s test lines; the logs of runs 42026897727, 42031613818, 42026952168, and 42033133576 on `6f0b0a58`, still running when this was written (extension and actionlint are green).
  Run, read-only: the Node guard with `--baseline --profile node` at the head, clean, 628 files; `--baseline-shrinks --base 14370fdd5`, "only shrinks", exit 0; the baseline's count per scope (458, 57, 26, 8, 219, 10); each inventory row's hash against its site, 0 differ; E10's search by hand, 1746 test files, 28 pairs, equal to `namedBy`.
  Question 1, the coder's three deviations: none is a quiet widening, and none counts as a change. The 778: both sites were already flagged at the brief's measure. Their `Path.GetTempPath()` did move to `TempDir.Root`, and the line stays flagged only for its fake path string (`"/tmp/schema.json"`), the same shape as the 18 entries beside it in `LocalRuntimeTests.cs`. So 776 was a forecast that counted two lines as leaving, not a number the tree outgrew; nothing new entered. § 8.1 asks for the difference by file in the PR, and the draft has it.
  The 28: `template-manifest.json` holds the frozen list as an op's `new` text, and the folder is one of E10's test roots. It is data and starts nothing. § 10.6 allows a pair found at creation when the line is not reached, so kind 4 did not grow. The tilde (`LeftoversBaselineTests.cs:256-260`): text written into private fixture trees, never a call, and the template's own device with another character (`§`, `LeftoversGuardTests.cs:30`). It is not the shape cut in epoch 6: that was a legacy NAME the guard could not see, fed to a refusal as real data, and the rule has an exemption for it. Still, nothing bounds this device, and `testLeftovers.test.mjs:31` does the same with `.join('')`, so the PR names both in one sentence beside the split-piece scan's output.
  Also seen, no change: the commits `91e440ec` to `14370fdd` share one timestamp, so they were cut after the work; R1's RED is a statement in a commit message, read from the draft, not from history. § 4 step 7 (F24's C# half recorded before the baseline) was not done in that order; item 5 step 5 now carries it. `(i)`'s pin order holds.
  Question 2, what a natural Administrators-owned file breaks. Among the rows (a) to (q), no other row claims natural collection or a natural read: the revision is right there. But the same fact reaches these promises outside the rows. C3: `PLAN_test_leftovers_E5.md:144`, the E5 goal, says a killed run is "collected by that user's next run"; and must-not-copy row 6 (`:795`) says "the helper's own claim is `mine`", which is false on the hosted runner (`ScopeTests.cs:22-31` asserts the measured false), while the Definition of Done needs every row. Item 4.4 names neither. C4: brief § 11.3 keeps "The run was killed … The next run's sweep collects it" and "The run folder cannot be removed … The next sweep judges it"; `RunTemp.cs:22` and `Removal.cs:33` say the same. Plain comment and text fixes, no behaviour.
  C2, the one that reaches the owner: the goal's exception names only a KILLED run. A run folder that could not be removed at a normal end also stays Administrators-owned and waits for a person. And the audit's blindness is wider than item 1's "a real orphan claim": an unregistered FOLDER with its claim is unseen as well (`LeftoversAudit.cs:58`, through `Captured.Read`). Question 7 should say both before the owner approves, as the epoch-6 judge said of a narrowing under-named.
  C6: "The audit, now on, found no leak in any suite" is wider than measured. On Windows only the registry half looked, and of `CoaiServer.Tests` only `*RunFolderTests` ran there. Item 3's new column, which item 8.1 asks of "each row", is filled only for (o) and (p). Row (k) needs its sentence: Windows `Test` proves collection only on fixtures; B4 and B5 survive there by the owner key, not by liveness (`StartOfRunSweepTests.cs:79`, `:138`, logged `foreign-uid` in job 127243250229), though `AKilledRun_IsCollected_ByTheSweep` does reach `live` on a re-owned folder; and R4 (`LeftoversCoaiLayoutTests.cs:79`) cannot go red on Windows by reading, because `Discover` reads nothing there, so Linux and macOS carry must-not-copy row 1.
  C5: "Not proved on Windows" in row (p) and § 19 is true of a PR gate only. `TheImageSmokeUsesTheServerTests` went 5 of 5 on hosted Windows under Git Bash in the probe (R20's name check is POSIX only), and `release.yml:860` runs the whole server suite on two Windows runners at release; row (p)'s invocations omit that. C4 also: § 19's new row says "the pins in `CoaiMcp.Tests`"; there are none. All four are in `CoaiServer.Tests` (three) and `src_bugs/tests/ShellScript.cs:85`, so no pin runs on Windows in a PR. Two of the three server classes went green there in the probe.
  Question 3, the planned re-owning and the pin: both work as written, by reading. `RunTemp.Folder` lies under the profile on the runner (log: `C:\Users\runneradmin\AppData\Local\Temp\…`), and the child's is nested inside it. `Scope.IsMine` checks the claim itself, not its folder, so the Administrators-owned run folder above it does not matter. The owner changes before `OfOrphan` captures anything, and `SameIdentity` and the verified read compare device and file id only, so neither `IsRegular` nor the identity moves. `RemoveCapturedClaim` re-reads through the same predicate, sees the same text and deletes. `WindowsOwnership` is internal, with `InternalsVisibleTo` for all four suites, and its `Dispose` undoes no owner. `RunTempGateTests.cs:258-263` and `ScopeTests.cs` already prove the same steps, green on that job.
  The pin's child: `Discover` finds nothing, the verdict is null, and the end of the run deletes the folder with the unreadable claim in it, because `Removal` never asks who owns (`Removal.cs:6`). So exit 0, nothing left, and the parent's empty-root line holds; R5 shows that path on Windows. C9, in the brief: it does not say where its "new file" goes. It must not be in `root`, or the empty-root line fails. And § 11.4's gate (a new file reads `IsMine` false) is not item 4.2's (an elevated process): with a temp outside the profile, a shell that is not elevated would run the pin, which passes for another reason. Ask for both. In that same place the plant's child throws, loudly, as intended.
  Question 4: true, with one wrong citation. The sweep asks the owner before liveness (`LeftoversSweep.cs:276-277`). `RunTempGateTests.cs:258-263` and `LeftoversSweepTests.cs:590-597` do re-own. C1: `Collection_is_proven_…` (`:585`) does NOT keep the Administrators owner as `foreign-uid`: it re-owns and asserts removal. The keeper is `On_windows_a_folder_that_is_not_the_callers_by_the_kernel_owner_is_listed_and_kept` (`:609`), on a fixture; the natural evidence is B4's logged `foreign-uid`. Also "every collection test re-owns": most hand a seam instead (`Options`, `:822`, `mine ?? (_ => true)`). And step 0 measures in `RUNNER_TEMP` on `D:`, outside the profile; a natural owner inside the profile rests on B4.
  The PowerShell step and its run id are right: `never disposed` and `disposed but not removed` both named, nothing left. But job 127259212955's green says nothing of its plant step: two plants are red in that log, and the step passes because pwsh ends on its last command's exit code. And the real `ci.yml` steps after `Test` have never run on Windows (skipped in job 127243250229); the head of item 5 step 4 is their first run.
  C7, a plain fact in F31: "The template's source and its plan did say it, for the audit only" is wrong. `Scope.cs:27-28` (the template's bytes) says an elevated run's files "are kept for a person to look at", and `dew_flow_mcp · research/PLAN_test_leftovers_E3.md:672` says the sweep lists them as `foreign-uid` and never removes them. So the sweep half was written down too, and epoch 7's lesson is stronger than "green tests hid it". C8: the brief's status line (`:3`) still says "plan only, nothing implemented yet".
  Could not check: any of items 4.1 and 4.2 on Windows (nothing is built, and there is no Windows here; reading and the logs only); `windows-11-arm` at release; a Windows shell that is not elevated; head `6f0b0a58`'s Linux, macOS and Windows jobs, still running; the janitor's key on Windows once F9 arms it, so "no janitor removes them" is read from the rule, not its code; R1's RED, as above; the copied guard tests line by line.)

> Epoch 7 · approved 2026-11-05 · by owner · state: closed

- 7.1 · 2026-11-07 · agent · approach, stories — E2.2's brief found that S2's harness exit pattern (the module-level scope "closed in `finally` AND `.catch`") cannot remove what a harness made: seven harnesses call `process.exit` inside `main`, so no `finally` runs; an un-awaited `close()` removes one folder; and no harness handles a signal. E2.2.S2 and S3 now use one shared exit module, `src_vs_code/scripts/lib/harnessScope.cjs` (a file outside S2's list): `main` returns its code, `finish` awaits the scope's close and then exits, and SIGINT, SIGTERM and SIGHUP close the scope and exit `128 + n`
  (creds `todo/PLAN_test_leftovers_E2.2_brief.md` § 3.1 and § 6, Q2 and Q3; named a change by the independent Opus review of the brief, its point 6. Not counted as changes, with the reason in the brief: Q8, because the Done-when's count stays and the record shows the measured count beside it; Q1, because the plan's "the same group / job" holds and only the runner's own header about streamed output changes on Windows. One change used in epoch 7: the next accepted change is the seventh full stop.)
- 7.2 · 2026-11-07 · agent · approach, dod — E2.4's brief measured that D5's container and volume names (`testsToDelete-${OWNER}-creds-…`) cannot pass the released guard (`37b9aa5`): its `docker-name` class needs a literal owner segment, and it matches the remover and `-v` names only unquoted (6 findings over D5's steps; clean only with a literal `u1001` owner and unquoted names). § S4's sentence that the guard accepts `${OWNER}` is false. Every way through changes the plan: a literal owner checked against `id -u` replaces D5's computed owner and fails on any other uid (approach); a guard that reads `${OWNER}` is a conventions release E2.4 would depend on; merging with the findings breaks E2.4's Done-when ("the guard evidence run shows only `commandParse.test.ts:40` and the product scripts"). The stories' own rule for this case is to stop and report (D8, § Order)
  (creds `todo/PLAN_test_leftovers_E2.4_brief.md` § 6 Q1 and integration findings I2, I3, on `feat/test-leftovers-e2.4` at `dee6220`; the question consultants, consult `78b3ed74`, both counted it a change. Not counted, with the reason: the bash helper writing `:<start>:<ns>` on Linux, because the stories say the released contract wins where they differ (§ Order) and both readers need it. **The second accepted change of epoch 7: the seventh full stop.** No new code on any epic of this plan until the re-review is complete; the E2.4 drafts (the S1 spec by Fable, the S2–S4 brief) are the starting material.)

### Re-review for epoch 8

Narrowed: no — entry 7.2 is settled by option (B), which keeps D5's names in the owner form, its owner label, its record and its complete cleanup and E2.4's Done-when. Every row of § *Epoch 6* item 3's E2, E6 and E7 tables is DONE or has a successor in § *Epoch 8* item 3 (the map is written there; the first text of this revision had dropped E2 (d), the E2.4 row's claim-first and trap halves, S2's scripts, E6's per-test databases and guard, and E7's size, and they are back). The goal's Windows exception is restated by its true condition (new files owned by `Administrators`, not elevation; coai #962): that makes the exception apply in FEWER runs, so more leftovers are collected and none of the plan's guarantees gets smaller. The Node reading of the Definition of Done got stricter (F30 released), and the merge conditions got wider (§ *Epoch 8* item 3: the remover's `shell: bash` and `|| true` test, the post-cleanup check that fails while a named container or volume exists (E2.4-k), the uid-check position test, acme's project-name test, S7's two checks and its last commit, E6's worktree collector, three container proofs and the `score-tmp` row, E7's serialization and four ownership states). Acme's state after a kill stays "gone": § *Epoch 8* item 4.3.2 puts it in labelled named volumes the janitor removes, which keeps D6's one owned project, labels, state and teardown.
  (Written 2026-11-07 with the revision of § *Epoch 8*, over the two entries of epoch 7: 7.1, E2.2's harness exit
  module (built, merged as creds #310); 7.2, E2.4's names against the released guard (drafts only). Re-review consult
  `ba518e5d`; the question consultants before it: `78b3ed74`. The Verdict and Action cells are `—` until an Opus judge
  fills them (step 5 of the full stop); the judge adds what this list missed. The epoch 8 line is written only after the
  re-review approves; with `Narrowed: no` the plan gate approves, not the owner.)

| Work | Where | Verdict | Action |
|---|---|---|---|
| the epoch-7 record, F31 and the owner's answer, conventions #134 `df8eb54` | main | fits | kept — a record; § *Epoch 8* names what it supersedes, and § *Epoch 7* stands for the rest |
| creds #294 `834c91b`, E2.1 — the Node unit-test lifecycle | main of creds | fits | kept — Node records with start and namespace, no `docker.yml`, no bash helper, no `${OWNER}` name (its diff read for them); its § *Revision* rows are what row E2.5-a reads |
| F30, conventions `acb693c` (#135), and the release `37b9aa5` (= #136's merge, the WSL administrator scan); the nine pin bumps to it: creds #306, coai #956, benchmark #174, rag_qln #89 `93ffdb9`, mcp #65 `45a8db2`, sidecar_rust #71, vscode_kit #24, amd_r9700 #17, wsl_care #187 | main; `release` = `37b9aa5`; main of each consumer | fits | kept — every gitlink reads `37b9aa5` through the GitHub API, sidecar_rust included. Item 1's stricter reading rests on it. coai #956 also re-pins coai's rule budget and snippet (F27 and #83 ride the release): coai's own, outside the epics, needed by the pin |
| the records #137 `e444c1b`, #138 `a3a02fa` (entry 7.1), #139 `7d8ad89`, #140 `eb8c141` | main | fits | kept — plan and follow-ups text only (file lists read) |
| creds #309 `ccf2e9f3`, E2's note that F30 shipped and is pinned, condition (c) met (not in this table when it was written) | main of creds | fits | kept — four lines in `PLAN_test_leftovers_E2.md`; "zero for the guard's listed spellings" is item 1's reading |
| creds #310 `bf59e4f`, E2.2 — the harnesses and the shared exit module of entry 7.1 | main of creds | fits | kept — item 4.1. No `.sh`, no Docker, no `${OWNER}` in its diff; its records are Node's |
| creds #311 `0ae0211`, E2.3 — the C# helper as an adapted copy in five executables | main of creds | fits | kept — its only `${OWNER}` is the template's copied `rm -rf` owner-blind case (`LeftoversGuardTests.cs:190`, the same line at mcp), not a Docker name; its `docker.yml` exclusion is the C# guard's, and E2.4-a is the Node guard's |
| coai #945 `825504e`, E5's producer — S3, S2-B, S4, S5, S6 | main of coai | fits | kept — S7-a's clause (`ci.yml:211`) is the one creation bypass S7's first PR removes, and the standing step already fetches the base at depth 1 (S7-c) |
| creds `dee6220` on `feat/test-leftovers-e2.4` — the E2.4 S1 spec (Fable) and the S2–S4 brief (Opus), docs only | pushed, unmerged (no PR) | fits | kept as the starting material (§ *Epoch 8* item 5); the brief's § 3.2 is already (B) with the uid check and `"$PROJECT"` for acme (0 findings **[M]**). The parts item 4 replaces are the next row |
| the same drafts' parts § *Epoch 8* replaces (not in this table when it was written): the brief's § 3.2 item 2 and Q1 (B), "the `-v` sources unquoted" (I3); the brief's Q4 recommendation (A), a person's command for acme's state; the S1 spec § 3 (`:86`), "No start, no namespace" | pushed, unmerged (no PR) | cut | fixed forward on the branch by new commits (Fable for S1, Opus for the brief, item 5), never a rewrite — rows E2.4-a, E2.4-e and item 4.3.2 |
| creds `todo/PLAN_test_leftovers_E2.md` on main, the lines § *Epoch 8* supersedes: D5's `${OWNER}` names (`:470-473`), § S4's quoted remover (`:1003-1006`) and its sentence (`:1014-1015`), S5 sc. 2's two "`${OWNER}` ⇒ 0" (`:1132` acme's `-p`, `:1136` the remover), D3's "bash never" (`:393`) (merged by creds #253 on 2026-11-02; not in this table when it was written) | main of creds | cut | corrected in a NEW creds PR, E2's document revision of item 8.3, before E2.4's plan gate; #253 is not reverted. Acme's `-p teststodelete-${OWNER}-creds-acme-$id` is a `docker-name` finding at `37b9aa5` **[M]** |
| creds `tmp/e22-macos` `7088d960`, a throwaway: one workflow file, a macOS run of E2.2's harnesses (not in this table when it was written) | pushed, no PR, not for merge | fits | nothing to do — it never reaches `main`; the branch goes |
| benchmark `a94775a6` on `docs/e6-boundary-mirror` — the E6 boundary row on the benchmark side | main of benchmark: merged as #177 `562cb4bd` (2026-11-07) | fits | kept — one row and one sentence in `PLAN_bench_test_leftovers_followups.md`; row E6-a is met |
| the stop record, entry 7.2, conventions #141 `a887924` | main | fits | kept — the stop |
| this revision, § *Epoch 8* and this record (branch `docs/rollout-epoch-8`) | pushed, unmerged (no PR): `5710328`, the judge's table `ac54e7c`; the corrections of the independent Opus review on top, uncommitted | fits | kept — the baseline epoch 8 is approved on, never an entry; the judge's corrections below go in with it |
| conventions #83 `6d67ca4d`, a held gate released only by the person's Proceed (not in this table when it was written) | main, in `release` `37b9aa5`; outside this plan | — | outside this plan, no verdict. Rule text and smoke fixtures; it rides the release and coai #956 adapts to it |
| coai #962 `72adc50c`, "the elevated-Windows pin reads who owns a new file, not whether the process is elevated": `RunTempTests.cs`, `ci.yml` (a Git Bash step for the pin), `module_tests.md`; merged 2026-11-07 20:05:15Z, AFTER the stop record #141 (19:41:23Z), by another session, to unblock coai's release after `mcp-v0.65.0`'s Windows legs failed the pin (run 42388147284) (added after the judge, by the independent Opus review) | main of coai | fits | kept — on its content: a test and CI fix of E5's own pin, no product code, no helper, F31's limit unchanged; it is the fact § *Epoch 8*'s goal now states. On the stop: the rule's Halt allows "an incident fix the owner orders". This record does not know whether the owner ordered it, and says so; it is REPORTED to the owner with this revision |
| the other merges of the epoch: coai #638 (release bugs 0.5.0), #930 (research notes), #950, #952–#955, #957, #960, #961 and the dependency bumps; creds #298–#305, #308; benchmark #172, #173, #175, #176, #178; amd_r9700 #15, #16; ai_language_comparison #3 (not in this table when it was written) | main of each repository, outside this plan | — | outside this plan, no verdict. Titles and file lists read: no test-leftovers site work. Correction (the independent Opus review): coai's releases after #945 did NOT all ship it unchanged — `mcp-v0.65.0` went red on its Windows legs on this pin (run 42388147284, `failure` **[M]**) until #962, the row above |
  (Judged 2026-11-07 by an Opus judge against § *Epoch 8*, § *Epoch 7*, § *Epoch 6*, creds' E2 document at `0ae0211` and the E2.4 drafts at `dee6220`: 13 rows fit; 2 are cut, both by a fix forward (the drafts' replaced parts, unmerged; the E2 document's superseded lines, merged earlier by #253); 2 rows are outside this plan. Nothing merged in epoch 7 contradicts the revised plan.
  Read: `gh pr list --state merged --search "merged:>=2026-11-05"` in twelve repositories, each plan PR's file list, the diffs of #294, #310, #311 and #309 searched for `${OWNER}`, `docker.yml`, `owned.sh` and the record's start and namespace; the E2.4 brief § 3.2, § 3.3, Q1–Q4 and I2–I4; the S1 spec § 3; coai `ci.yml:205-215` at `f07a9601`; benchmark #177's diff; each pin's gitlink through the GitHub API; the remote branches of the five plan repositories.
  Run, read-only, with `scanText` of the guard at `37b9aa5`: `docker compose -p teststodelete-${OWNER}-creds-acme-$id …` in `deploy/acme-test/run.sh` is one `docker-name`; `-p teststodelete-u1001-…` and the brief's `-p "$PROJECT"` are clean.
  The questions. Nothing merged under E2.2 or E2.3 assumes D5's `${OWNER}` names or a bash record without start and namespace: neither PR has a shell helper or a Docker step, and their records are Node's and C#'s. What does assume them is older text: creds' E2 document (the cut row), and the S1 spec's § 3 on the branch. The brief's I3 was partly wrong: the remover's names must be unquoted, the `-v` sources need not be (row E2.4-a); its Q4 (A) left acme's state to a person, which item 4.3.2 rules out. The brief already carries (B), the uid check and the host's `sed`.
  Corrections made to § *Epoch 8*, plain facts: K1, item 1's E6 row, row E6-a, item 5 and item 8.3: the boundary row is merged (benchmark #177 `562cb4bd`), not "pushed, unmerged". K2, item 1's E7 row: an old E7 stories draft exists on rag_qln `docs/test-leftovers-e7-stories` (`bff8478a`, 2026-10-17), as E6's does; item 5 now says both are read as material. K3, item 1's F30 row: sidecar_rust is pinned at `37b9aa5` (#71). K4, item 5's DONE line in merge order: F30 and the release came before E2.1, and #945 before E2.3. K5, item 8.3's creds line names the E2 document's lines of the cut row, acme's `-p` among them. K6, this record's last plan row: the revision is pushed.
  Could not check: anything with Docker (the acme line is a text scan); the E2.4 drafts' other open questions, which item 4.3.3 settles as recommended.)
  (After the judge, 2026-11-07. An independent Opus review raised seven points, all accepted and applied in
  `4672977`: coai #962 merged during the stop (its row above; reported to the owner); the goal's Windows exception
  restated by its true condition; the rows of § *Epoch 6* item 3 that the first text dropped, restored with a map; the
  exact `-v` quoting and its eighth counterexample; acme's project-name test; the uid check's position test; the
  16 → 5 findings of the guard on creds. The plan gate read the operative extract twice: session `39432dd3`, `proceed`,
  no findings; session `6f58dbce` on the corrected extract, `proceed`, four findings accepted and one rejected with
  its reason. The four accepted findings, applied after `4672977` as three changes: (1) `|| true` lets a failed removal pass while its resource stays, and
  E2.4-d checked only that the remover ran: a post-cleanup check step, red while a named container or volume exists,
  with a stub counterexample (row E2.4-k, measured); (2) acme's state decided now as labelled named volumes, not a
  bind mount, the throwaway observing that shape (item 4.3.2, row E2.4-f); (3) `shell: bash` on the remover and a test
  that runs its body and sees every removal called after a failed one (row E2.4-b, measured). Rejected: deriving the
  uid at run time, because the guard refuses a name whose owner segment is an expansion (row E2.4-a, measured),
  `docker.yml` is hosted-only by creds' D4, and the check stops the job before any resource exists. None of the
  four makes a condition smaller, so the Narrowed line stands.)

> Epoch 8 · approved 2026-11-07 · by reviewers · state: open

- 8.1 · 2026-11-10 · reviewer · contract — E2.4.S3: `bash -e` does not stop on a failed command substitution inside another command, so D5's check passes when `docker` fails and its naming step can write an empty `SMOKE_ID`; both are corrected
  (Found by the Opus review of E2.4.S3, findings 2 and 4, measured with a stub `docker` that exits 1 and a failed
  `openssl`. One cause, one entry. The fix: each check line assigns the listing first (`out=$(docker …)`, which fails
  the step under `-e`) and then tests it; the naming step checks the id against `^[0-9a-f]{8}$` before it writes it.
  Every D5 decision stands: the literal owner `u1001`, the uid check first, the unquoted remover names with `|| true`,
  and a check with `docker ps` and `docker volume ls`, never `inspect`. Not counted, with reasons in creds' E2.4 build
  record: the anchors observed by a throwaway run where the check goes red (the brief says G2 observes them), the
  helper made to keep the S1 spec's "a function that calls owned_cleanup itself is fine", and the mount install
  in CI taken back out of E2.4 (an E2.5 item). Each story's own `module_tests.md` paragraphs stay in E2.4, as in
  E2.1–E2.3: E2.5 adds only the section *Test leftovers*.)

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
*Corrected 2026-11-03 (§ Epoch 3):* "INSIDE it" holds per invocation, not per file. In coai, only the `src_mcp/tests`
executable and the extension's tests under `scripts/run-tests.mjs` get the run folder; `sonarcloud.yml:302` runs the
compiled extension tests with none, `ci.yml:197` runs `scripts/**/*.test.mjs` with none, and three C# suites have none
until E5.S3.

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
   *Read since 2026-11-03 (§ Epoch 3, item 3 (b)):* not every consumer's sweep-only stage is done — E7's (rag_qln's
   `qlntest_*` drop) is open. A producer waits for every sweep-only stage that can reach the resources IT makes.
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
      *Epoch 3 (2026-11-03):* the rule is released (`5863c60`, #108) and pinned by coai alone (#939); the F16 interim (b)
      is released in the same promotion (#107). Not ticked: the private sibling's mirror is not recorded here (R4), the
      owner's Windows barrier section (P1) is not written, and F16's Fix is open with F9.
- [ ] **Added 2026-11-03 (epoch 3):** every prep or rename story of E2.2–E2.5, E5's producer PR (S3, S4, S5), E6 and E7
      recorded its invocation inventory before it dropped a prefix, and every dropped prefix is backed by it
      (§ Epoch 3, item 4).
- [ ] **Added 2026-11-03 (epoch 3):** F3 (the `node` profile reads `package.json` scripts) is released and pinned before
      the family's first compliance declaration under the shipped Node guard (E2.5 or E5's producer PR, whichever first).
- [ ] **Added 2026-11-03 (epoch 4):** E5's suites are green as § *Epoch 4* item 3's per-suite, per-OS merge-gate table names
      them (the shared run-folder library's proofs on all three OSes; each suite's wiring where CI runs it; the bugs suite
      on Linux only), with counts reconciled by name — not "all four suites on three platforms" [interim gate, finding 1].
- [ ] **Added 2026-11-03 (epoch 4):** F24 (the baseline proof rule accepts a process-wide gate before discovery) is
      released and pinned by coai before E5's S6 creates its baseline; every C# copy of the template is an adapted copy
      with a pinned manifest and a green diff check (§ Epoch 4, items 2 and 4).
- [ ] Every producer stage merged under decision 6's shape; every pin bump merged alone; the one-time hand clean-up of
      old names recorded per machine on the PR of the epic whose names they are.
- [ ] The coai feature review (`mcp__coai__review_feature`, a plan of seven epics) ran once after the last epic, from a
      checkout that holds it, before this plan is promoted.
- [ ] This plan is promoted to `research/` with its deviations, together with the stories documents of E2–E7 in their
      repositories, and the remainder plan's R6 is ticked.

*2026-11-10, E2's part (no box above is E2's alone, so none is ticked).* Creds holds the first three boxes: its tests,
scripts and CI make only owner-form resources or carry an inventoried exemption, and both guards run in its CI with no
finding (E2.5 #330: the Node guard clean over 640 files, the C# guard green on all OS legs). Its producer stage merged as
five gated PRs (entry 1.6), and each pin bump merged as a PR of its own (#287, #289, #292, #293, #297, #306, #340). The hand
clean-up of E2's old names is recorded per machine for each of the five PRs (creds' E2.5 build record, the D8 table,
column (d)). E2.2 to E2.5 each recorded the invocation inventory in their brief (E2.2, E2.3 and E2.4 § 2; E2.5 § 3). F3
was pinned in creds (#297, release `bd79584`) before E2.5's declaration; the box also names E5's producer PR, which is
not read again here. The details: § *Epoch 8* item 3.3.

## The merged core revises E1 first (2026-10-21)

The plan [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md) (IMPLEMENTED 2026-10-27, promoted to `research/`) revises the contract E1 builds, so the consumer
epics now wait for ITS release, not for E1's. What it left open — S0 on every machine, the merge of PR #82, the private sibling's side and the ONE release —
is in [PLAN_test_leftovers_merged_core_release.md](../research/PLAN_test_leftovers_merged_core_release.md); its R5 is the release and its R6 is the two-stage migration below. Named on both sides:

| Item | Built by | This plan's part |
|---|---|---|
| The contract text, helper, sweep, janitor and guard in their owner-scoped form | the merged-core plan | E2–E7 consume its one release (R5 of the remainder plan); E1's stories document was promoted by it as IMPLEMENTED on 2026-10-27 — **superseded 2026-11-01: there were two releases (R5 `115bbf8`, R7 `105d53c`) and E5 needs a third (the `raw-temp` baseline rule); every consumer is pinned at `105d53c`, and a pin bump merges alone, so a further release costs each consumer one standalone PR, not a re-port** |
| The machine barrier, the merge of PR #82, the private sibling's side and the ONE release | [the remainder plan](../research/PLAN_test_leftovers_merged_core_release.md) R1–R5 | E2–E7 start no producer stage before R5; their sweep-only stages need no release |
| The per-consumer rename, port and pin bump | epics E2–E7 here | Each epic splits into a sweep-only stage (its owner-blind sweeps replaced or disabled, no owner-form producer) and a producer stage (pin bump + rename + helper/guard port in one commit — **superseded by decision 4 (the pin bump merges alone) and decision 6 (one PR or a gated stack)**); all sweep-only stages land before any producer stage; the barrier checklist of the merged-core plan runs per machine before the first producer |

Order: the merged core first, then R1–R5 of the remainder plan, then the epics below. Disjoint: neither edits a consumer repository.
*Done:* R1–R5 on 2026-10-30; R7 (F17–F20, the core split, the pin bumps, the Darwin helper) on 2026-11-01. R6 is this plan.

## Wave 1 — the stories re-split against the release (2026-10-31)

The owner runs the epics two repositories at a time: E3 + E4, then E5 + E2, then E6 + E7. Before any of them, every consumer's sweep-only stage is
recorded or merged (the barrier). The stories documents of E3 (dew_flow_mcp #53) and E4 (dew_flow_sidecar_rust #61) were written on 2026-10-16
against E1; an Opus delta check against `115bbf8` found the name, the creation order, the claim record, liveness, the sweep and the guard changed, so
both are re-split before any producer code. The entries below still say E1 and `testsToDelete-<repo>-…`: read them through
`common/test-leftovers.md` at `115bbf8` (`testsToDelete-<owner>-<repo>-…`). Three owner decisions of 2026-10-31 apply to every port, recorded in
[R6 of the remainder plan](../research/PLAN_test_leftovers_merged_core_release.md): a pin bump may merge alone; a Windows kernel owner needs the profile AND the
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
  *Corrected 2026-11-03 (§ Epoch 3, item 1):* coai's #897 run folder is a LEGACY name (`testsToDelete-coai-run-…`), not
  the owner form — E5.S3 moves it to the owner form; and not everything coai's tests make lives inside it: only the
  invocations that run through a runner with a run folder do.

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
   *Done 2026-11-02 (§ Epoch 3):* built as #108, released in `5863c60`, pinned by coai #939 alone. The private sibling's
   mirror is the owner's (R4) and is not recorded in this plan. Also corrected: the "four C# suites" are not all inside
   a run folder today — three get it in E5.S3.
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
*Superseded 2026-11-03 by § Epoch 3, item 3:* (b)'s "done 2026-10-31" is wrong — R6's scan missed coai's age-only sweep
(landed since as #940) and rag_qln's `qlntest_*` drop (E7's stage A, open); (h) is met (`5863c60`, coai #939); and a new
condition (i), the invocation inventory, is added.

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
       P2 the raw-temp baseline rule                      — DONE 2026-11-02: #108 (`eb2fdd55`), released; the sibling mirror is the owner's (R4)
       P3 the F16 disposition, decided (b) (§ 4)          — DONE 2026-11-02: #107 (`5e077ff9`), released with P2
          (Release `5863c60`, promote-release run 41430127939, 2026-11-02: #107 F16 interim, #108 the baseline rule, #109 F21 the
          reference's move helpers exported, #103 the r9700 token row, #62 an actions bump. Warned first: "vllm fix", "kimi", "C# vs Node".
          The pin bumps, each alone, the seven over the PR cap with the owner's agreement of 2026-11-02: creds #292 (`66056a6e`), rag_qln #80 (`ae9c7d6d`, with its two externals current), vscode_kit #21 (`27f69034`), benchmark #151 (`0ea28fbe`), mcp #62 (`76c9c5f5`), sidecar_rust #68 (`6c57d526`), wsl_care #184 (`72b89017`), coai #939 (`2221559a`); the new consumer dew_flow_amd_r9700_tuning_ai pins it inside its own PR #1.)
          (Release `cc24f9e`, promote-release run 41523829952, 2026-11-02: #112 F22 — the reference sweep takes the consumer's token
          (ledger 2.1's wait ends), #110, #111. Warned first: "vllm fix", "kimi", "C# vs Node". Nine pin bumps, each alone, the seven
          over the cap with the owner's agreement for this release: creds #293, vscode_kit #22, mcp #63, sidecar_rust #69, rag_qln #81,
          wsl_care #185, coai #941, amd_r9700_tuning_ai #4, benchmark #152 — the list and merge commits are in the follow-ups plan, F22.)
       E5 stage A (S2-A, the age-only coai- sweep retired, one PR alone) ∥ E5 S5 (the bare-prefix literals leave the test trees) — may start now
          (E5 stage A DONE 2026-11-02: coai #940 (`d02ed40`), ten code rounds and the CodeRabbit round. E5 S5 not started.)
       E2.1 → E2.2 → E2.3 → E2.4 → E2.5 (five stacked, gated PRs; E2.1 merges after P1 and creds' pin on P3's release; the guards switch on in E2.5)
          (E2.1 built, six code rounds, wired to F22 on release `cc24f9e`: draft PR creds #294 (2026-11-02). It merges after P1 and the
          by-hand macOS and Windows records its plan names.)
       E5 producer PR (S3 → S2-B → S4 → S6, one squash-merged PR, after P1, P2, P3's release, stage A and S5 [re-review gate finding 2]) → E5.S7 the drain (one PR per suite, not a producer)
THEN   wave 3: E6 ∥ E7 — stories written against 105d53c (or the baseline release) and E3's merged helper, each with its own plan gate;
       E6's stage A is landed (#125); E7's stage A is REQUIRED — gate or retire InfrastructureSampler's owner-blind qlntest_* drop
       in a sweep-only PR before any E7 producer [re-review gate finding 3]; both merge under § 3.
LAST   the coai feature review; the promotion of this plan and its stories documents; R6 ticked in the remainder plan.
```

The wave order E3+E4, E5+E2, E6+E7 is the owner's (§ *Wave 1*) and stands. Inside wave 2 the two epics are independent of each other
and share P1 and P3's release (the Node sweep on Windows, F16 (b)) [re-review gate finding 1]; only E5 waits for P2 as well.
*Superseded 2026-11-03 by § Epoch 3, item 5:* "E5 S5 not started" is out of date (S5 started 2026-11-03 and stopped
with the plan, entry 2.2); S5 is narrowed, and the E5 producer PR line now carries S5's deferred sites. P2 and P3 are
done (the release lines above).

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
   (Correction, 2026-11-02 [PR review, CodeRabbit]: P1 is not the only condition. E2.1's own plan (creds
   `todo/PLAN_test_leftovers_E2.md`, "Open before E2.1 may merge") also names the by-hand macOS record, the Windows by-hand
   `npm test` count and the Windows CI leg's first green, sc. 12 by hand, and D8's barrier conditions (c) and (d) for the owner's
   Windows machine. That list is the canonical one; P1 is its item (e).)
   (Settled without the owner, 2026-11-01: the F16 disposition — (b), § 4, consult `3310f6ba`; and P2's plan — written and through
   its plan gate, item 2.1. The `r9700` token row (#103) rides the same promotion as P2 and the F16 change.)

## Epoch 3 — the plan as revised at the re-review (2026-11-03)

The whole plan read again against what is known now, as step 4 of the full stop asks (`common/plan-change-control.md`),
over both entries of epoch 2: the wait for F22 (2.1) and E5.S5's order against E5's producer PR (2.2). Entry 2.1 has
ended: F22 is released (`cc24f9e`). Entry 2.2 is settled as option A of consult `c137f641`, confirmed by the re-review
consult `3ebddd39`: S5 is narrowed, its deferred sites move into the producer PR, and the PR's merge condition says so.
This section is the baseline epoch 3 is approved on. Epoch 2's section above stays as the record; where this one
supersedes it, a dated note there points here. The E5 stories document (`dew_flow_connect_other_ais ·
todo/PLAN_test_leftovers_E5.md`) is revised the same day; a stories document keeps no ledger, so its changes are this
plan's.

*Revised the same day after the re-review gate (2026-11-03; findings 0–3 of both reviewers, all accepted).* By item
4's own rule no S5 site is contained today, so **S5 has no stage-A part any more**: its renames become a commit of E5's
producer PR, after S3, S2-B and S4. The items below carry a dated note where this changes them; the first text stays
as the record of the revision.

*Superseded in part 2026-11-03 by § Epoch 4* (entries 3.1 and 3.2): the C# copy is an ADAPTED copy, not byte-identical;
E5's DoD names a suite × OS matrix; F24 (the baseline proof rule) is a new prerequisite of E5's S6. The rest of this
section stands as the baseline that epoch 4 revises.

### 1. What this plan is now

Epoch 2's picture (§ *Epoch 2*, item 1) stands, with these facts brought up to date:

- **Two more releases, every consumer pinned.** `5863c60` (promote-release run 41430127939, 2026-11-02) carries P2, the
  `raw-temp` baseline rule (#108), P3, the F16 interim (b) (#107), F21, the reference's identity and exclusive-move
  helpers exported (#109), and the `r9700` token row (#103). `cc24f9e` (run 41523829952, 2026-11-02) carries F22, the
  reference sweep takes the consumer's token (#112). Every consumer is pinned at `cc24f9e`, each bump alone: creds #293,
  vscode_kit #22, mcp #63, sidecar_rust #69, rag_qln #81, wsl_care #185, coai #941, amd_r9700_tuning_ai #4, benchmark
  #152 (the commits are in the follow-ups plan, F22).
- **F16 is only half done.** The interim (b) shipped: on Windows the reference sweep lists and changes nothing. The Fix
  (the owner SID read, both keys) is still open and waits for F9's Windows run.
- **Wave 2.** E5's stage A is DONE: coai #940 (`d02ed40e`, 2026-11-02) retired the age-only `coai-` test sweep. E5's
  stories merged as coai #850. E5.S5 started on 2026-11-03 and stopped with the plan (entry 2.2). E2.1 is built and
  CI-green as DRAFT creds #294 (every check green, read 2026-11-03), wired to F22; it waits for P1 and the owner's
  by-hand macOS and Windows records (creds' D8 and its "Open before E2.1 may merge").
- **Not every sweep-only stage is done.** E7's stage A — retiring or gating `InfrastructureSampler`'s prefix-only drop of
  `qlntest_*` collections — is NOT done (`src/Rag.Application/Runtime/InfrastructureSampler.cs:104` on rag_qln
  `ae9c7d6`; remote `main` `b40c0ae` is only the pin bump #81). R6's record of 2026-10-31 called every stage landed or
  empty; the barrier scan missed both coai's age-only sweep (landed since as #940) and this one. Any sentence that says
  every consumer's sweep-only stage is done is corrected in place.
- **Not everything coai's tests make lives in a run folder.** coai's #897 run folder is a legacy name
  (`testsToDelete-coai-run-…`), not the owner form, and only some invocations run inside it: the `src_mcp/tests`
  executable and the extension's tests under `scripts/run-tests.mjs`. `sonarcloud.yml:302` runs the compiled extension
  tests with no run folder; `ci.yml:197` runs `scripts/**/*.test.mjs` as a bare `node --test`; `src_server/tests`,
  `src_bugs/tests` and bench have no run folder until E5.S3. Epoch 2's sentence (item 1, the last bullet) is corrected
  in place.
- **The lesson of entry 2.2: containment is a property of each INVOCATION, not of the file.** A file run by two commands
  is inside an owned folder only when both give it one. Item 4 makes this a requirement of every remaining story.
- **No S5 site is contained today** *(added after the re-review gate, findings 0 and 3)*. Both coai runners fall back to
  the machine temp when they cannot make their folder — `RunTemp.Start` (`src_mcp/tests/RunTemp.cs:33-47`, a warning,
  then the run goes on) and `run-tests.mjs` `beginRun` (`:221-230`, "the tests share the machine's temp as before") —
  and item 4 counts a fallback as an uncontained invocation. The run folder is also still the legacy-named
  `testsToDelete-coai-run-…` until S3 moves it to the owner form. A person can also start one test file directly
  (`node --test out/test/x.test.js`), with no run folder at all (gate finding 2). So S5's renames wait for S3 (an
  owner-form run folder that fails closed), S2-B and S4 (`beginRun` fails closed; the scripts and the SonarCloud job go
  through a runner; a direct run refuses), and land as a commit of the producer PR. S5's classification work is that
  commit's input.

**Goal (unchanged from epoch 2).** The goal of § *Epoch 2*, item 1, stands word for word. One reading is added: "what
lives inside an owned resource carries no prefix" (rule §1) applies to a site only when EVERY invocation that runs it
gives it the owned resource.

### 2. Prerequisites

1. **P1 — the owner's Windows barrier record.** OPEN. It blocks the first producer MERGE of E2 (E2.1) and of E5, not
   their build (§ *Epoch 2*, item 2.2 and question 2, with the correction of 2026-11-02 under it).
2. **P2 — the `raw-temp` baseline rule.** DONE: #108 (`eb2fdd55`), released in `5863c60`, pinned by coai #939 alone. The
   released form is ONE file, `raw-temp-baseline.json` at the repository root, with one scope per tree, each with its
   proof and its guard (`common/test-leftovers-baseline.md`). The private sibling's mirror is the owner's (R4); it is not
   recorded in this plan.
3. **P3 — the F16 disposition (b).** DONE as the interim: #107 (`5e077ff9`), released in `5863c60`. The Fix stays open
   with F9.
4. **F22.** DONE: #112, released in `cc24f9e`; entry 2.1's wait ended.
5. **NEW — the invocation inventory** of every remaining prep or rename story (item 4), and **F3 before the first Node
   compliance declaration** (item 4).
6. **The coai feature review** at the end, unchanged.

### 3. Merge conditions (revised, per producer PR)

The conditions (a)–(h) of § *Epoch 2*, item 3, stand, with these changes:

- **(a)** "the release its stories document cites" is `cc24f9e` for every consumer today (it carries P2, P3's interim,
  F21 and F22). `cc24f9e` is the BASELINE: the family's first Node compliance PR cites and pins the LATER release that
  carries F3 (condition (j)), never `cc24f9e` [interim gate, finding 5].
- **(b) corrected.** The sweep-only stage of every consumer whose sweep can reach the resources THIS producer makes is
  landed or recorded empty by a scan that also looks for age-based and non-prefix sweepers. For E2 and E5 that holds
  (creds: empty twice; coai: #940). E7's open stage A reaches only rag_qln's `qlntest_*` collections in rag_qln's store,
  so it blocks E7's producer, not E2's or E5's — which is what epoch 2's build order already did (E7's stage A before
  any E7 producer); it is now written as a condition.
- **(h)** is met: the baseline rule is released and coai pinned it alone (#939).
- **(i) NEW.** Every prep or rename story in the PR carries its invocation inventory (item 4), and every prefix the PR
  drops is backed by it: each invocation that runs the site gives it an owned folder.
- **(j) NEW.** If the PR is the family's first compliance declaration under the shipped Node guard (`--profile node`),
  F3 is released and the repository's pin carries it (item 4).

**E5's producer PR** merges only when: S2-A (#940, done) and the REVISED S5 are on `main`; S3, S2-B, S4 and S6
squash-merge together in that one PR, INCLUDING every site S5 deferred, with S6's repository-wide checks green
(`owner-blind` and `legacy-name` at zero outside the helpers' own files and S6's named exemptions; only the authorised
`raw-temp` baseline left); and every other condition above — the barrier (P1), the release, the gates, the CI legs,
decision 6's shape — is still met. The E5 stories document, D8, carries the same text.

*Revised after the re-review gate (2026-11-03, findings 0 and 3).* "the REVISED S5 are on `main`" no longer holds: S5
has no stage-A part. **E5's producer PR** merges only when: S2-A (#940, done) is on `main`; ONE squash-merged PR carries,
in this commit order, S3 → S2-B → S4 → **S5** → S6. S3 and S4 build only the CONTAINMENT S5's deferred sites need (an
owner-form, fail-closed run folder; the scripts and the SonarCloud job through a runner; the refusal of a direct start);
S5 then renames EVERY site, the eligible ones and the deferred ones, once that containment exists [interim gate,
finding 0]; S6's repository-wide checks are green (`owner-blind` and `legacy-name` at zero, unexempted, outside
the helpers' own files; the expected-exemption inventory equal to the guard's list; only the authorised `raw-temp`
baseline left); and every other condition above is still met — P1, the release (with F3 if this PR is the family's
first Node compliance declaration), the gates, the CI legs, decision 6's shape. Condition (i) is read with item 4's
direct-run rule: the inventory lists a person's direct start of each tree too.

### 4. The invocation inventory, and F3

**Requirement.** Every remaining epic's prep or rename story — E2.2, E2.3, E2.4, E2.5; E5's producer PR (S3, S4 and S5
inside it; the inventory is also cited from coai's D10); E6; E7 — records an **invocation inventory** before it
approves dropping a prefix. It lists every resource-creation site in scope and, for each site, every invocation that
reaches it; its completeness is checked against every workflow job, `package.json` script, runner script and documented
command of the tree, and that listing is attached to the PR [interim gate, findings 2 and 4]:

| Invocation (the command or job that runs the files, with `file:line`) | The temp root it actually gets | Who provides the owner, the cleanup and the sweep | What must exist first |
|---|---|---|---|

An invocation is a command or a job the repository defines: a job of ANY CI workflow (coverage and analysis jobs
included, not only the main CI file), a `package.json` script, a runner script, or a command a document tells a person
to run. **Containment is a property of each invocation, not of the file**: a site may drop its prefix only when every
invocation that runs it gives it an owned folder. A runner's fallback to the machine temp when it cannot make its folder
counts as an uncontained invocation until the story that removes it. A site with one uncontained invocation keeps its
prefix, and the deferral names that invocation, the missing containment and the story that adds it. The inventory goes
into the story's PR and, for a stories document written from now on, into the document. E5's inventory on coai
`a3b73534` is in its stories document (§ *Facts*, D10).

*Why:* the S5 build (entry 2.2) found that `sonarcloud.yml:302` runs coai's compiled extension tests with no run folder
and `ci.yml:197` runs `scripts/**/*.test.mjs` with none. Two sites the extension PR had renamed were reached by that
coverage job, and about 35 sites in `scripts/` and `src_server/tests` were in the machine's real temp. A file-level
reading ("these tests run inside the run folder") was wrong for one invocation in each case.

**F3 is tied to the first real Node compliance declaration.** F3 of the follow-ups plan: the guard's `node` profile does
not read `package.json` scripts, so a `pre`/`post` script that makes or removes a temp folder is invisible to it. The
follow-ups plan already schedules F3 "at the first consumer migration to the guard's `--profile node` (E2 onward of the
rollout), before the consumer is declared compliant". The first such declaration is whichever comes first of creds'
E2.5 (both guards switch on) and E5's producer PR (S6, the shipped Node guard at zero on the whole repository); epoch 2
named only E2.5. F3 is fixed in the reference, released, and pinned by that repository before that PR merges (item 3
(j)). F3 is the guard's half of the same lesson: a `package.json` script is an invocation, and the inventory names it
by hand until the guard reads it.

**Added after the re-review gate (2026-11-03, finding 2) — a direct start is an invocation too.** For each tree, the
inventory also lists how a person starts one test file or one suite outside the runner: `node --test <compiled test>`
or `node --test <source test>` for a Node tree; `dotnet test`, an IDE, or the test executable for a C# tree. A story
that drops a prefix because "the runner gives a run folder" must do one of two things for each such start:

- **make it refuse** — a test that needs the run folder checks the runner's marker (a variable the runner sets, or for
  C# that `TEMP` names the run folder the assembly's own initializer made) and, when it is absent, fails with one line
  that names the command to use, before it creates anything; or
- **name it as uncontained** in the inventory, and the site keeps its prefix.

In C# the run folder is made by the test assembly's own module initializer, so every start of the assembly runs it;
there the refusal guards against a start that skips or loses it. In Node the runner is a separate process, so a direct
`node --test` has no run folder unless the test refuses.

**Where F3 sits** *(added after the re-review gate, finding 1)*: item 5's build order names it as a conventions task
with an owner (the main session): the fix in the reference, its release, and each consumer's pin bump, all before the
first Node compliance declaration.

### 5. Build order (revised)

```
DONE   everything DONE in § Epoch 2, item 5 → release 5863c60 (P2, P3's interim, F21; every pin bump alone)
       → release cc24f9e (F22; nine pin bumps alone; entry 2.1 ends) → E5 stage A, coai #940
       → the stop of epoch 2 (entry 2.2) and this re-review.
NEXT   P1 the owner's Windows barrier record            — the owner; blocks the first producer MERGE of E2 and of E5
       F3 in the reference, released, pinned            — before the first Node compliance declaration (E2.5 or E5's producer PR)
       E5 S5 (revised) — the enumerated eligible sites only, one PR per tree, no sweep, no producer; resumes when epoch 3 opens
       E2.1 (draft creds #294) merges after P1 and its by-hand records → E2.2 → E2.3 → E2.4 → E2.5, each with its
          invocation inventory; E2.5 needs F3 if it is the first Node compliance declaration
       E5 producer PR (S3 → S2-B → S4 → S6, one squash merge, carrying every site S5 deferred, S6 repository-wide)
          after P1, the revised S5, and F3 if first → E5.S7 the drain (one PR per suite, not a producer)
THEN   wave 3: E6 ∥ E7 — stories against cc24f9e and E3's merged helper, each with its own plan gate and its invocation
       inventory; E7's stage A (InfrastructureSampler's qlntest_* drop gated or retired) is a sweep-only PR before any E7
       producer; both merge under § 3.
LAST   the coai feature review; the promotion of this plan and its stories documents; R6 ticked in the remainder plan.
```

The owner's wave order (E3 + E4, E5 + E2, E6 + E7) stands. Inside wave 2, E2 and E5 are independent of each other; they
share P1 and, if either is first, F3.

**The build order as revised after the re-review gate (2026-11-03, findings 0–3).** It replaces the block above, which
is kept as the record: its "E5 S5 (revised) … resumes when epoch 3 opens" line is withdrawn (S5 has no stage-A part),
and F3 gets its own place.

```
DONE   as above.
NEXT   P1 the owner's Windows barrier record            — the owner; blocks the first producer MERGE of E2 and of E5
       F3, a conventions task (owner: the main session) — the fix in the reference (follow-ups plan F3: the node profile
          reads package.json scripts), its own PR and gates → a release (promote-release) → the DECLARING repository's
          pin bump, before its first Node compliance PR merges (E2.5, or E5's producer PR carrying S6, whichever comes
          first); the other consumers' bumps follow, each alone, those over the PR cap with the owner's agreement
          [interim gate, finding 1]
       E2.1 (draft creds #294) merges after P1 and its by-hand records → E2.2 → E2.3 → E2.4 → E2.5, each with its
          invocation inventory (direct starts included); E2.5 waits for F3's pin if it is the first declaration
       E5 producer PR — one squash merge, commits S3 → S2-B → S4 → S5 → S6 (owner: the main session, through its
          coders; S3's and S4's runner changes and refusals included [interim gate, finding 6]):
          S3   the C# library; the run folder of all four C# suites in the owner form; fails closed; a test started
               without its initializer's run folder refuses; the containment for S5's deferred C# sites
          S2-B the owner-aware sweep
          S4   the Node wrap; beginRun fails closed; a direct node --test refuses; scripts/** and the SonarCloud
               extension job (sonarcloud.yml:302) go through a runner; the containment for S5's deferred Node sites
          S5   the renames of EVERY site — the eligible ones (the classification of 2026-11-03 is the input) and the
               deferred ones S3 and S4 made contained; the legacy
               fixtures as plain literals with the inline legacy-name exemption
          S6   the two guards at the repository-wide zero; the expected-exemption inventory; one raw-temp baseline
          after P1, and after F3's pin if this is the first declaration → E5.S7 the drain (one PR per suite)
THEN   wave 3: E6 ∥ E7 — as above, each stories document with its invocation inventory, direct starts included.
LAST   as above.
```

S5 sits after S4 and before S6. Its renames need what S3 and S4 build: an owner-form, fail-closed run folder under
every invocation, and a refusal for a direct start. S6's guard asserts the repository-wide zero, so it must read the
tree after the renames. The squash merge makes the five commits one commit on `main`; the order is for the review and
for a bisect on the branch.

### 6. What the re-review consultant raised, and what was done with it

| Point | Verified | Taken |
|---|---|---|
| (a) two answers to entry 2.2 (consult `c137f641`): A — narrow S5 to the contained sites, move the rest into S3 and S4, record the change; B — keep S5 open until the producer PR | both need a merge condition to change (entry 2.2); A keeps S5's no-producer, no-sweep shape and lets the eligible renames land now; B would leave a story open across the producer PR with no smaller unit to merge | A — § 3 and the E5 stories document (S5 as revised, S3, S4, S6, D8) |
| (b) `sonarcloud.yml:302` runs the extension's compiled tests directly, with no run folder, so the sites it reaches are not contained under every invocation (re-review consult `3ebddd39`) | yes — `c8 … node --test "out/test/"*.test.js` on `ubuntu-latest`, coai `a3b73534`; it reaches `kimiLinuxInstall.test.ts:60` and `runtimeSinceIsAhead.test.ts:147` | yes — the two sites are deferred to S4, and S4 routes that job through the runner; the requirement of item 4 |
| (c) the record says `Narrowed: yes` (S5's required completion before the producer got smaller; E5's final DoD did not) | yes — S6 keeps the repository-wide zero; the producer PR's merge condition changed | yes — the record above; the owner approves before epoch 3 opens |
| (d) a test whose meaning is a legacy or bare name must not build the prefix from pieces to hide it from the guard (the Opus judge of this re-review; a reviewer of the S5 plan round of 2026-11-03 had said the same, and that finding was REJECTED) | yes — rule §7 at `cc24f9e` defines `legacy-name` as "a name built without the owner segment", and its one exemption form is a comment on the line or the line above, `testsToDelete-exempt: legacy-name — <reason>`; a split constant only makes the guard's zero false | yes — **the rejection in the S5 plan round was wrong**; the E5 stories document (S5 as revised, S6, DoD) now says: such a fixture writes the name as a plain literal with that exemption, and each one is listed. The three local `legacyNames` modules of the S5 branches are rewritten before anything is pushed (the judge's cuts 3–5) |
| (e) the two extension renames that `sonarcloud.yml:302` reaches go back to their prefixed names and move to S4 (the judge's cut 2) | yes — row (b) | yes — the E5 stories document, S5 as revised and S4 |
| (f) the judge's inventory adds `release.yml:544` (`npm test` through the runner) and the release workflow's C# suites | yes — `release.yml:264`, `:353` (`CoaiMcp.Tests`), `:694` (`CoaiServer.Tests`), `:1110` (`CoaiBugs.Tests`) on coai `a3b73534` | yes — the E5 inventory (its § *Facts*); `run-tests.mjs` is contained there except its fallback |
| (g) the judge's advice: `RunTemp.Start` does not fail closed (it writes a warning and goes on in the machine's temp) | yes — `RunTemp.cs:33-47`; and `run-tests.mjs` `beginRun` (`:221-230`) does the same, which the judge's row read as fail-closed | yes — E5.S3 sc. 3a and S4 make both fail closed; until then the fallback is named as the one uncontained path of an eligible site |

The consultants' full answers are in their consult records (`c137f641`, `3ebddd39`); rows (a)–(c) record the points
this revision takes from them, and rows (d)–(g) the Opus judge's points. Nothing they raised was rejected. One earlier
rejection is reversed: row (d).

**The re-review gate on this revision (2026-11-03).** Both reviewers agreed; every finding was accepted:

| Finding | Verified | Taken |
|---|---|---|
| 0 and 3 — by item 4's own rule (a runner's fallback is uncontained), NO S5 site is contained today: `RunTemp.Start` and `run-tests.mjs` `beginRun` fall back to the machine temp, and the run folder is still the legacy name until S3, so S5's renames cannot merge before the producer PR | yes — `src_mcp/tests/RunTemp.cs:33-47` and `src_vs_code/scripts/run-tests.mjs:221-230` on coai `a3b73534`; the legacy run prefix at `RunTempFolder.cs:44` and `run-tests.mjs:125` | yes — S5 has no stage-A part; its renames are a commit of the producer PR after S3, S2-B and S4 (items 1, 3, 5; the `Narrowed` line; the E5 stories document). Row (a)'s "lets the eligible renames land now" is withdrawn; option A stands in its other parts (the named deferrals, the one producer PR) |
| 1 — F3 needs a place in the build order | yes — item 4 tied it to a condition but named no task | yes — item 5: a conventions task, owner the main session: the fix, the release, the pin bumps, before the first Node compliance declaration |
| 2 — the inventory must list a person's direct start of each tree, and a test that needs the run folder must refuse outside its runner, or the site keeps its prefix | yes — a direct `node --test out/test/x.test.js` gets no run folder (the S5 extension classification named it, 2026-11-03) | yes — item 4; E5's S3 and S4 |

### 7. Questions for the owner (blocking; each with the recommended answer)

1. **Approve epoch 3 as narrowed?** The record says `Narrowed: yes`: what S5 must finish before E5's producer PR got
   smaller. *Recommended:* yes — nothing leaves E5's done-when; the deferred sites are named, each with its story, and
   the producer PR cannot merge without them.
   *After the re-review gate (2026-11-03):* the narrowing is now that NOTHING of S5 lands before the producer PR; S5's
   renames are a commit inside it. *Recommended:* still yes, for the same reason.
2. **P1, the Windows barrier record** — unchanged from epoch 2's question 2, still open.
3. **Merge condition (b) per resource kind** (§ 3): E7's open stage A blocks only E7's producer. *Recommended:* yes —
   the sampler drops collections in rag_qln's own store, which no producer of E2 or E5 makes; it is what epoch 2's
   build order already did.
4. **F3 before the first Node compliance declaration** (§ 4): one more conventions release before E2.5 or E5's producer
   PR, whichever is first. *Recommended:* yes — the follow-ups plan already schedules F3 there; the change is only that
   E5 may be first.

*Answered by the owner, 2026-11-03 (after the question consultants, `e000e85a`, both "yes"):* 1 — approved as narrowed;
3 — yes, per resource (the test is whether a sweeper can reach this producer's resources; a shared endpoint later needs a
new check); 4 — yes, F3 first. Not approved by that answer: the over-cap pin bumps of F3's release, asked when it comes.
The consultants added, for S3 and S4: "fail closed" covers a failed CLAIM write too, not only a failed folder (the
reference's `ownedDir` writes the claim exclusively first and throws when it cannot). Question 2 (P1) stays open.

## Epoch 4 — the plan as revised at the re-review (2026-11-03)

The whole plan read again against what is known now, as step 4 of the full stop asks (`common/plan-change-control.md`),
over both entries of epoch 3. Both were found writing E5's S3 build brief (2026-11-03): 3.1, the C# copy cannot be
byte-identical to dew_flow_mcp's template; 3.2, the DoD asks for all four C# suites green on three legs with the same
counts, and coai's CI does not run them so. Both are settled by the re-review consult `8d309111` (after the question
consultants `be608fd9`), and each point was checked against the files. This section is the baseline epoch 4 is approved
on. § *Epoch 3* stays as the record; where this section supersedes it, a dated note there points here. The E5 stories
document (`dew_flow_connect_other_ais · todo/PLAN_test_leftovers_E5.md`) is revised the same day; its changes are this
plan's.

### 1. What this plan is now

§ *Epoch 3*'s picture stands, with these facts brought up to date:

- **Epoch 3 was approved by the owner** (2026-11-03, #115, `be7eb09`), and the E5 stories document was revised for it
  (coai #942, `004c55fb`).
- **F3 is merged, not released**: the guard's `node` profile reads `package.json` scripts and fails closed (#116,
  `605e3e6`). The `release` branch is still at `cc24f9e`, and every consumer is pinned there.
- **E5's producer branch has no code.** S3's build brief exists (in the coordinating session's scratchpad). It measured,
  on a scratch build: the adapted copy compiles and its copied tests pass on WSL Linux (171 tests: 157 passed, 14
  skipped, the Windows-only and macOS-only arms); an owned run folder made in a `[ModuleInitializer]` works; and a gated
  custom `Main` refuses a run with exit 78 and one line, before discovery.
- **The template is mcp-shaped** (entry 3.1). `dew_flow_mcp · tests/Mcp.Tests/Leftovers/` has 51 files at `197cc76`,
  not 54; the copy also needs `tests/Mcp.Tests/DirectoryLinks.cs` and `tests/Mcp.Tests/RepositoryRoot.cs`, which sit
  outside that folder. The template hard-codes mcp's mount path (`LeftoversGuardScripts.cs:20`:
  `.claude/rules/shared/tools/lib/sweeper-scan.mjs`), its helper paths and an mcp type (`RepositoryIdentity.Row`).
  coai mounts the rules at `.agents/conventions` and cannot use `.claude/rules`.
- **coai's CI runs the C# suites on this matrix** (entry 3.2; coai `004c55f`, `.github/workflows/ci.yml`):

  | Suite | Linux (`build-test`) | macOS | Windows |
  |---|---|---|---|
  | `CoaiMcp.Tests` | `:58` | `:282` | `:317` |
  | `CoaiBench.Tests` | `:64` | `:288` | — |
  | `CoaiServer.Tests` | `:77` | `:285` | — |
  | `CoaiBugs.Tests` (the ingest server) | `:88` | — (`:258-259`: it ships for Linux only, and one of its tests runs the previous linux-x64 release) | — |

  The copy also changes the counts: about 171 copied tests come in, and E2's two-valued tests are replaced.
- **The released baseline rule asks for "a test per assembly or package, ordered first"**
  (`common/test-leftovers-baseline.md:19`). The four xUnit v3 suites run collections in parallel (`maxParallelThreads: 8`
  in each `xunit.runner.json`), so there is no first test. The guarantee is the process-wide gate in `Main`, which runs
  before discovery. The rule must accept it (F24, item 2).

**Goal (unchanged from epoch 2).** The goal of § *Epoch 2*, item 1, stands word for word, with § *Epoch 3*'s reading.

### 2. Prerequisites

1. **P1 — the owner's Windows barrier record.** OPEN. It blocks the first producer MERGE of E2 and of E5. Until it is
   recorded, Windows evidence for E5 comes from the `windows-latest` CI leg only; no E5 branch runs its C# suites on the
   Windows side of an unrecorded machine.
   *[2026-11-04: CLOSED by the owner's written statement, P1's second option (§ *Epoch 2*, question 2): the owner's Windows machine does not build or test E2's and E5's repositories for now, so merge condition (c) is met for that machine; its barrier stays closed. Recorded in [research/security/machines.md](../research/security/machines.md). The same record re-attests the operator's WSL machine: open for every place the developer account can read; its condition (c) waits for one administrator scan of two root-only places.]*
2. **F3** — merged (#116), not released. Released and pinned before the first Node compliance declaration (§ *Epoch 3*,
   item 4). It is NOT released alone: it rides the ONE release that carries F24 (item 5) [interim gate, finding 3].
3. **NEW — F24, the baseline proof rule** (a conventions follow-up; the next free number of the follow-ups plan; owner:
   the main session). `common/test-leftovers-baseline.md` (and the guard's proof check, where it encodes the old wording)
   changes so that a PROCESS-WIDE gate that enforces containment before discovery — E5's gated custom `Main`: exit 78,
   one line — satisfies "a run that cannot make it fails before any test". The marked assertion test stays; it no longer
   needs to be "ordered first". F24 is released and coai's pin carries it BEFORE E5's S6 creates its baseline.
   *After the re-review plan gate (2026-11-03, session `7c66b50d`; all findings accepted)*, finding r2: **F24's completion evidence** is an acceptance check against the RELEASED guard and the REAL
   E5 test host, run before S6 creates the baseline: a run under the gate passes the released guard's proof check; and a
   forced folder failure and a forced claim failure each exit 78 before discovery, with the brief's `MemberData`
   sentinel untouched. The check's output is recorded on the PR that creates the baseline.
   *[F24 review, 2026-11-03]* The check has a THIRD forced case: a run whose `TEMP`, `TMP` or `TMPDIR` does not name the run folder also exits 78 before
   discovery (the rule's gate refuses on a mismatch as well as on a folder or claim failure). The three child runs live in the scope's proof file, so removing
   them changes the one file the baseline names; the marked test's `TEMP` assertion and the review prove that the runner makes the folder before the first test.
   *[PR review, CodeRabbit, 2026-11-03]* The third case is three: `TEMP`, `TMP` and `TMPDIR` are each mismatched ON THEIR OWN (only that one variable names another folder), because a gate
   could check one variable and miss another. The acceptance check therefore has five forced runs — a folder failure, a claim failure and the three single-variable mismatches — each exiting 78 before discovery.
4. P2, P3 (the interim) and F22: done, as § *Epoch 3*, item 2. P2's proof clause is changed by F24.
5. The coai feature review at the end, unchanged.
6. **E5's rollback procedure (coai D11), written and reviewed before E5's producer PR opens** — it is merge condition (m)
   [interim gate, finding 2].

### 3. Merge conditions (revised, per producer PR)

§ *Epoch 3*, item 3 (with its gate revision) stands, with these changes:

- **(a)** For E5 the release its stories cite is the one that carries F24 (and F3, if E5 is the first Node compliance
  declaration); `cc24f9e` is the baseline.
- **(f) read for E5** as the suite × OS matrix of item 1: every suite green on every leg CI runs it on, AND the ownership
  and startup proofs (the run folder in the owner form, fail closed, the refusal) green for EVERY suite on ALL THREE
  OSes — through filtered steps on the legs that do not run the whole suite, or a small cross-OS job if a suite cannot
  run there. "The same counts" becomes a NAMED reconciliation: each test added, removed or skipped by platform, by name.
- **(k) NEW.** F24 is released and pinned (a pin bump alone) before S6 creates the baseline.
- **(l) NEW.** The adapted copy's diff check is green: no change against the template outside the manifest's permitted
  transformations (item 4).

**E5's producer PR** merges only when: S2-A (#940) is on `main`; ONE squash-merged PR carries S3 → S2-B → S4 → S5 → S6
as in § *Epoch 3*; S6's repository-wide checks are green; (k) and (l) hold; the matrix of (f) is green; and every other
condition — P1, the release, the gates, decision 6's shape — is still met. The E5 stories document, D8, carries the same.

*After the re-review plan gate (2026-11-03, session `7c66b50d`; all findings accepted)*, findings r0 and r3. **(f) is replaced by named merge gates.** The run-folder LIBRARY is shared code, so its
ownership and startup proofs (the owner-form run folder, claim first, fail closed with exit 78, the refusal) run on all
three OSes through the suites that run there. Each suite's OWN wiring (its `RunTempStart.cs`, `TestEntryPoint.cs` and
`RunFolderTests`) is proven on the OSes where a CI step runs that suite. Every cell with a step is a merge gate: the step
is green on the PR's head (coai `ci.yml` line numbers at `004c55f`; S3 adds the steps marked NEW):

| What is proven | Linux | macOS | Windows |
|---|---|---|---|
| the library (via `CoaiMcp.Tests`) and the mcp suite's wiring | job `build-test`, step `Test` (`ci.yml:58`) | job `macos`: NEW steps `The stat layout self-test` and `Leftovers` (the template's order), then `Test` (`:282`) | job `windows`: NEW `Step 0` first, then `Test` (`:317`) |
| the server suite's wiring | `build-test`, `:77` | `macos`, `:285` | NEW filtered step in job `windows` after `Test`: `CoaiServer.Tests.exe --filter-class "*RunFolderTests"` (the job's `Build` step builds the whole solution, `:313-314`) |
| the bench suite's wiring | `build-test`, `:64` | `macos`, `:288` | — bench never runs on Windows |
| the bugs (ingest) suite's wiring | `build-test`, `:88` | — | — the suite runs on Linux only (`:258-259`; release time too) |

The server suite also runs at release time on Windows (x64, arm64) and macOS arm64 (`release.yml` job `server-binaries`,
`:619`, its test line `:694`; osx-x64 is cross-built and not tested there). That is release evidence, NOT a merge gate.
"The same counts" stays a named reconciliation.

**(m) NEW (finding r1).** E5's producer PR has a written ROLLBACK procedure (E5's D11), and this plan points to it:
first switch off the destructive start-of-run sweep (S2-B) with a one-line, reviewed change, keeping owner-form creation
and teardown; then list the resources already created (`janitor.sh --token coai --dry-run`); then revert or repair. A
plain revert of the squash merge would bring back the old producers while owner-form folders already exist.

### 4. The adapted copy (3.1) and the suite × OS matrix (3.2)

**The adapted copy.** A C# consumer copies `dew_flow_mcp · tests/Mcp.Tests/Leftovers/` at `197cc76` as an ADAPTED copy:

- a **pinned file manifest**: the 51 files of the folder, plus `DirectoryLinks.cs` and `RepositoryRoot.cs`, each with
  where it goes (the library, or the test project when it holds `[Fact]`s);
- per file, the **permitted transformations**: the namespace; `OwnedToken.cs` rewritten; the mount path
  `.claude/rules/shared` → `.agents/conventions`; the helper paths and folders; the mcp type `RepositoryIdentity.Row`;
  and the edits the consumer's stories list for each story (for E5: S3's and S6's);
- a **diff check** (a test or a script) that rejects any change against the template that the manifest does not explain;
- the **ownership, liveness and deletion algorithms unchanged**, unless a change is separately reviewed.

*After the re-review plan gate (2026-11-03, session `7c66b50d`; all findings accepted)*, finding r5: **the diff check's golden source is inside coai and needs no network.** It is a committed
manifest of the template at `197cc76` that holds, per file, the upstream path, the upstream git blob SHA and the
expected list of transformations; the check reads the copy, undoes the listed transformations, and compares the
result's blob SHA with the manifest's. No vendored copy of the upstream files is kept (the blob SHA identifies the
upstream bytes; a reviewer fetches them from dew_flow_mcp when the check is red). Finding r4: **defence in depth**
for the gate: besides the gated `Main`, a fallback check at the first point any test can reach (the assembly fixture)
fails the run with the same one line when the gate did not run (a host that bypassed `Main`); the module initializer
still makes the folder, and the fallback refuses when `RunTemp.IsActive` is false. Both are written in E5's S3.

**The manifest's format, the same for every consumer [PR review, CodeRabbit].** One committed manifest per consumer,
one entry per copied file: the upstream path, the target path, the upstream git blob SHA, and an ORDERED list of
exact-replace operations, each with its expected number of matches. The check works on the raw bytes with no text
normalisation (no line-ending, encoding or whitespace change): it reads the target, undoes the operations in reverse
order (each must match exactly its expected number of times), and computes the git blob SHA of those bytes
(`blob <size>\0` + content). Any other difference fails. Each epic writes its manifest entries before its producer PR
opens.

E5's D2 is the first such copy. E2, E6 and E7 follow the same form. Making the template itself parameterised (upstream,
in dew_flow_mcp) is NOT done now; it is a possible later follow-up if the same adaptations recur.

**The suite × OS matrix.** E5's DoD names what CI runs (item 1), not "all four suites on three legs". It is narrower,
so the record says `Narrowed: yes`. Correction after the stop's PR review (2026-11-03, every coai workflow checked job by
job at 004c55f): the server suite DOES run on Windows (x64, arm) and macOS — in `release.yml` server-binaries, at
release time, not in pull-request CI; the bugs (ingest) suite runs on Linux only, also in release; bench never runs on
Windows. So adding the server suite to pull-request CI on Windows is cheap and proven; a Windows check of bench (run
its executable after the existing Windows build) MAY widen the matrix later; both are named here and not required
(question 3).

**The rest of S3's brief** is settled in the E5 stories document, not here (its § 14 items 3–7, 10–13): `TempDir` keeps
re-throwing `LinkTargetLostException` and keeps its read-only clearing; the restore is registered after
`OwnedDir.Create`; `RunTemp.cs` moves into the library and each test project gets `RunTempStart.cs` and
`TestEntryPoint.cs`; S2-B registers the sweep fixture in each test assembly and its tests land when wired; the audit
source lands unwired in S3; Sonar excludes `src_mcp/tests_leftovers/**`; a coai-owned cross-reader vectors file; S4
puts every direct script and coverage invocation in containment or makes it refuse; S6 seeds violations in every actual
test root, with missing-proof and stale-baseline cases.

### 5. Build order (revised)

```
DONE   as § Epoch 3, item 5 → epoch 3 approved (#115) → coai #942 (E5 revised for epoch 3) → F3 merged (#116, not
       released) → S3's build brief → the stop of epoch 3 (entries 3.1, 3.2) and this re-review.
NEXT   P1 the owner's Windows barrier record            — the owner; blocks the first producer MERGE of E2 and of E5
          (P1 closed 2026-11-04 by the owner's statement — § 2, item 1; the WSL machine's administrator scan is open)
       F24, a conventions task (owner: the main session) — the baseline proof rule (and the guard's proof check): its own
          PR and gates; then ONE release carrying F3 and F24 (promote-release) → coai's pin bump alone before S6 creates
          its baseline, and the declaring repository's bump before its first Node compliance PR; the other consumers'
          bumps follow, each alone, those over the PR cap with the owner's agreement
       E2.1 (draft creds #294) after P1 and its by-hand records → E2.2 → … → E2.5, as § Epoch 3, item 5
       E5 producer PR — one squash merge, commits S3 → S2-B → S4 → S5 → S6:
          S3   the ADAPTED copy (manifest, permitted transformations, diff check); RunTemp in the library; RunTempStart.cs
               and TestEntryPoint.cs in each of the four test projects; the gated custom Main (exit 78, one line);
               the audit source unwired; Sonar excludes src_mcp/tests_leftovers/**; Windows evidence from CI only until P1
          S2-B the sweep fixture registered in each test assembly; the sweep tests land here
          S4   every direct script and coverage invocation in containment or refusing
          S5   the renames, as § Epoch 3
          S6   after F24's pin: the guards, one baseline, seeded violations in every test root, missing-proof and
               stale-baseline cases
          after P1, F24's pin, and F3's pin if this is the first declaration → E5.S7 the drain
THEN   wave 3: E6 ∥ E7, as § Epoch 3; each C# copy is an adapted copy (item 4).
LAST   as § Epoch 3.
```

S3, S2-B, S4 and S5 do not wait for F24; only S6 does, because S6 creates the baseline whose proof F24 defines.

### 6. What the re-review consultant raised, and what was done with it

| Point (consult `8d309111`) | Verified | Taken |
|---|---|---|
| (a) 3.1: make D2 an adapted copy — a pinned manifest, permitted transformations per file, a diff check; algorithms unchanged unless reviewed; upstream parameterisation later, only if the adaptations recur | yes — 51 files at `197cc76` (`git ls-tree`), `DirectoryLinks.cs` and `RepositoryRoot.cs` outside the folder, `.claude/rules/shared` at `LeftoversGuardScripts.cs:20` | yes — item 4; the E3 State line corrected; E5's D2 |
| (b) 3.2: an explicit suite × OS matrix of what CI runs; the ownership and startup proofs on all three OSes; a named reconciliation of counts; `Narrowed: yes` | yes — coai `ci.yml:58`, `:64`, `:77`, `:88`, `:258-259`, `:282`, `:285`, `:288`, `:317` | yes — items 1, 3 (f), 4; the record; question 1 |
| (c) the released baseline rule's "ordered first" cannot hold with parallel collections (S3 brief item 8) | yes — `common/test-leftovers-baseline.md:19`; `maxParallelThreads: 8` in all four `xunit.runner.json` | yes — F24, a prerequisite of S6 (items 2, 3 (k), 5) |
| (d) S2-B registers the sweep fixture in EACH test assembly, and the sweep tests land when wired (S3 brief item 4) | yes — the copied sweep tests take the fixture as a constructor parameter (the brief) | yes — E5's S2-B |
| (e) the fail-closed mechanism: a gated custom `Main` (`XunitAutoGeneratedEntryPoint=false`, xUnit's generated body behind `RunTemp.Gate`, exit 78, one line) | the brief's scratch measurement (xunit.v3 4.0.1, MTP 2.4.0): refused run exit 78, no discovery; a throw from a pipeline startup or a module initializer aborts the host (exit 134). Not re-run by this revision | yes — E5's S3 |
| (f) the other S3-brief items (3, 5–7, 10–13) are fixes that satisfy the plan as written; write them into E5 explicitly | yes — each against the coai and mcp files the brief cites | yes — E5's S3, S4, S6 |

Nothing was rejected.

**The re-review plan gate on this revision (2026-11-03, session `7c66b50d`).** Every finding was accepted:

| Finding | Verified | Taken |
|---|---|---|
| r0 — name the exact CI step or job, per suite and per OS, that carries the proofs, and make each a merge gate | yes — coai `ci.yml` at `004c55f` | item 3 (f), the gate table |
| r1 — a rollback procedure for the squash-merged producer PR: switch off the S2-B sweep first, keep creation and teardown, list what exists, then revert or repair | yes — a revert of a squash merge brings back the old producers while owner-form folders exist | item 3 (m); E5's D11 |
| r2 — F24's completion evidence: an acceptance check against the RELEASED guard and the REAL E5 host | yes — the guard's proof check and the gate are in two repositories; only a run of both proves them together | item 2; E5's D8 |
| r3 (blocking) — the bugs suite cannot run off Linux, so "every suite on all three OSes" is wrong | yes — `ci.yml:258-259`; `release.yml` `bugs-binaries` runs on linux-x64 and linux-arm64 only | item 3 (f): the library on three OSes, each suite where it runs; the `Narrowed` line |
| r4 — a fallback check if the gate did not run | yes — a host could load the assembly without the project's `Main` | item 4; E5's S3 |
| r5 — the diff check's golden source inside coai, with no network | yes — the template lives in another repository | item 4: a committed manifest with upstream path, blob SHA and transformation list |

### 7. Questions for the owner (blocking; each with the recommended answer)

1. **Approve epoch 4 as narrowed?** The record says `Narrowed: yes`: E5's DoD names the suites CI actually runs on each
   OS, keeps the ownership and startup proofs on all three, and reconciles counts by name. *Recommended:* yes — CI never
   ran the ingest suite off Linux (it ships for Linux only) or bench on Windows, and the server suite reaches Windows only
   in the release workflow; the proofs that
   matter for this plan (ownership, fail closed, refusal) stay on all three OSes.
   *After the re-review plan gate (2026-11-03, finding r3):* the proofs on all three OSes are the shared library's
   (through the mcp suite) and the server suite's wiring (a filtered Windows step); bench's wiring is proven on Linux and
   macOS, the ingest suite's on Linux only. *Recommended:* still yes.
2. **P1, the Windows barrier record** — unchanged, still open.
   *[2026-11-04: closed — see § 2, item 1.]*
3. **A Windows check of the server and bench suites — later, or not at all?** It may widen the matrix. The server suite
   already passes on Windows in `release.yml`, so moving it into pull-request CI is cheap; bench is unmeasured there.
   *Recommended:* not now; ask again after E5's producer PR, with the measured cost of the step.
   *After the re-review plan gate (2026-11-03, finding r0):* the server suite's run-folder tests now run on Windows in
   pull-request CI as a filtered step (item 3 (f)); this question is about the server's WHOLE suite and about bench.
4. **One release for F3 and F24?** *Recommended:* yes — both are guard and rule changes the first Node compliance PRs
   need; one release costs each consumer one pin bump. The over-cap bumps are asked when the release comes (as for
   epoch 3).

*Answered 2026-11-03:* 1 — approved by the owner, as narrowed. 3 and 4 — settled by the question consultants (`4e52fac6`,
both agreeing), under the owner's standing instruction to ask them first: 3 — later, not never; the server's whole suite
and bench are judged separately after E5's producer PR, with the measured cost of each step (server has a proven Windows
path in `release.yml`, bench has none); 4 — yes, one release, cut after F24 is built and its acceptance check passes;
the over-cap pin bumps of that release are asked when it comes. Question 2 (P1) stays open.
*[2026-11-04: question 2 (P1) is answered — closed by the owner's statement; see § 2, item 1.]*

## Epoch 5 — the plan as revised at the re-review (2026-11-04)

The whole plan read again against what is known now, as step 4 of the full stop asks (`common/plan-change-control.md`),
over both entries of epoch 4. Both were found on E5's producer branch: 4.1 (2026-11-03, the S2-B spec), E5's promise
that a killed OLD coai run (a legacy `testsToDelete-coai-run-*` folder) is collected by the next extension run cannot
hold at the pinned reference; 4.2 (2026-11-04, the S4 brief), E5's native measurement series is a root-run, multi-phase
folder that outlives the script that makes it, so neither S4 option (an owned folder of the wrap; an owner-form name)
fits. The re-review consult is `d7ad1ace` (the question consultants before it: `b5c30429` for 4.2, `08beb732` and
`76d09c26` for 4.1); each point was checked against the files. This section is the baseline epoch 5 is approved on.
§ *Epoch 4* stays as the record. **This section adds no notes to the older sections** (conventions PR #124, open,
already carries four dated notes in § *Epoch 4* about P1, and this revision must not edit the same lines); where it
supersedes earlier text, it says so HERE. Superseded by this section: the goal sentence of § *Epoch 2*, item 1
("creates outside its own process only resources of the owner form …") — read with item 1's exception and
clarification; merge condition (i) of § *Epoch 3*, item 3 — read with item 3; § *Epoch 4*, item 1's "E5's producer
branch has no code" and item 5's NEXT block — replaced by items 1 and 5; § *Epoch 4*, item 2.1 and question 2 ("P1 …
OPEN / still open") — closed, item 2; the E5 entry of § *Epics* where it speaks of a sweep that collects old coai names
— read with item 4's last paragraph (its own superseded notes of 2026-11-01 already say nothing collects them by age;
this adds that nothing collects a legacy `testsToDelete-coai-run-*` folder at all). The E5 stories document
(`dew_flow_connect_other_ais · todo/PLAN_test_leftovers_E5.md`) is revised the same day; its changes are this plan's.

### 1. What this plan is now

§ *Epoch 4*'s picture stands, with these facts brought up to date (each read in git or GitHub on 2026-11-04):

- **Epoch 4 was approved by the owner** (2026-11-03, #118, `650607f9`), and the E5 stories document was revised for it
  (coai #943, `8dc0765c`).
- **P1 is CLOSED.** The owner stated in writing on 2026-11-04 that the Windows machine does not build or test E2's and
  E5's repositories for now — the second option of § *Epoch 2*, question 2. The record is in
  `research/security/machines.md` on conventions PR #124 (open, not merged when this was written). The same record
  re-attests the operator's WSL machine: open for every place the developer account can read; **two root-only places
  are not read**, so merge condition (c) for that machine waits for ONE administrator scan
  (`sudo node tools/sweeper-scan.mjs --system`). Condition (c) stays a merge condition for every machine that builds or
  tests the repository; today that is the WSL machine (E2 and E5) and the hosted runners (out of the barrier's scope, R2).
- **F3 and F24 are merged, not released.** F3 (#116, `605e3e6e`) and F24 (#119, `ff0ea790`) are on `main`; `release`
  is still `cc24f9e` and every consumer is pinned there. The owner's answer of 2026-11-03 (§ *Epoch 4*, question 4)
  stands: ONE release for both, then pin bumps alone. F25 is parked (#120); F26 is the owner's mirror; F27 and F28 are
  proposed in PR #125 (open) — none of the three is a prerequisite of this plan.
  *[epoch 5, 2026-11-04, Opus review]* "Stands" is read with the order of item 2.2 and the build order of item 5, said
  once there: F24's acceptance check runs FIRST at the F24 sha (`ff0ea790`, pre-release — the owner's answer of
  § *Epoch 4* question 4: cut after F24 is built and its check passes), THEN the release, THEN the check again against
  the RELEASED guard and the real E5 host before S6.
- **The remainder plan is closed.** Conventions #122 (`c631448b`) recorded its late stop and re-review and promoted it
  to `research/PLAN_test_leftovers_merged_core_release.md` as IMPLEMENTED; its R6 is this plan's open tail, ticked when
  this plan is promoted (the last line of the Definition of Done).
- **E5 (wave 2).** coai #945 (draft) holds S3 and S2-B at `6ec356a1`: the adapted C# library with its manifest and
  diff check; the owner-form, fail-closed run folder in all four C# suites with the gated `Main` (exit 78, one line,
  before discovery); the owner-aware sweep as the assembly fixture of every C# suite and the extension runner's sweep,
  behind ONE rollback switch (D11); `run-lib-tests.mjs` in front of the bare `node --test`. CI is green on Linux,
  macOS and Windows (run 41803072375); the order proof's margins are 102–204 ms per C# cell (the comment on #945,
  and the docs commit `d3791c00` — *[epoch 5, 2026-11-04, Opus review]* pushed, not local: it went up with `ba526043`
  and is on #945, as the judge's table says). Row 12 of the must-not-copy list was settled on the Windows throwaway branch
  (run 41717749312) and produced no entry; entry 4.2 came from the S4 brief instead. **S4 is a brief only; S5, S6 and
  S7 are not started.**
- **E2 (wave 2).** creds #294 (draft) at `3422500`: E2.1 is built; its by-hand records are part 7 of its plan
  (`70da168`, `3422500`). The first full Windows unit run on the throwaway branch `tmp/e21-byhand` found one test bug,
  fixed test-only (`22e16a7`; coai code round 9 `proceed`); run 2 of that branch (`cdc116b6`, run 41812168328) was
  running when this was written. *[later the same day]* Run 2 finished GREEN on both jobs (macOS: the five socket files,
  32 binds, longest 63 bytes; Windows: 6024 tests, 0 failed, 0 · 0 compared), recorded as `[E2.1 byhand 10]`
  (`be47183`); the branch is deleted. The by-hand items (b) and (c) of E2.1 are complete; what is left for its merge is
  (c) for the WSL machine, the PR's gates and this plan's epoch 5. E2.2 is cut from E2.1's MERGE commit, not from the
  draft branch. *[epoch 5, 2026-11-04, Opus review]* The PR's head is `9a6e9fa` ([E2.1 byhand 11]): the three home paths
  its public-hygiene check was red on became placeholders — the fix forward the judge's table asked for is done.
- **The waves.** Wave 1 (E3, E4) is merged. Wave 2 (E5, E2) is in progress as above. Wave 3 (E6, E7) is not started.
- **The two lessons of epoch 4.** (4.1) Two different things were written as one: the one-off clean-up of LEGACY
  folders (names without the owner segment, made before E5; a person's tool, S2-A) and the automatic collection of
  NEW owner-form folders by the next run (rule §4, the two keys). The reference never collects a legacy coai folder at
  the pin, so only the first removes them. (4.2) One resource of E5 is DURABLE on purpose: the native measurement
  series is made by one root-run script, filled over several phases and removed by another script later; no run owns
  it, and "collected by the next run" would destroy a measurement in progress. The goal's sentence "every … script …
  creates outside its own process only resources of the owner form" cannot hold for it, and merge condition (i)
  (every dropped prefix backed by an owned folder) cannot back it. It needs an explicit, bounded exception — item 4.

**Goal (revised for epoch 5).** The goal of § *Epoch 2*, item 1, stands with § *Epoch 3*'s reading, with ONE bounded
exception and one clarification:

- *The exception.* **E5's native measurement series** — the folder `native-(vibe|kimi)-<yyyymmdd>-<6 hex>` under the
  series root (`/tmp` on a Linux box unless `COAI_NATIVE_SERIES_ROOT` names another) — is NOT a resource of the owner
  form. It is created only by `scripts/native/make-series.sh` (*[epoch 5, 2026-11-04, Opus review]* corrected in
  item 4, *The real creator*: the lead's `mkdirArgv` makes the bare folder, `make-series.sh` checks and fills it),
  read by its phases and `abort.sh`, and removed only by
  `scripts/native/remove-series.sh`; no sweep, janitor or next run collects it; it carries no `testsToDelete-` prefix
  and no claim; its name and lifetime are the grammar and the evidence of item 4. The exception is bounded to that one
  shape in those scripts and the tests and documents that name it; nothing else of any consumer may use it as a
  precedent without a new plan change.
- *The clarification (4.1).* "collected by that user's next run under the two keys of rule §4 when the run was killed"
  applies to OWNER-FORM resources. A legacy folder of a run killed before E5 (`testsToDelete-coai-run-*`) is listed by
  both sweeps and removed only by S2-A's one-off clean-up (coai #940, `scripts/old-coai-leftovers.mjs`, a person's
  tool, recorded per machine under merge condition (d)); nothing collects it automatically.

The rest of the goal stands word for word: every other resource of the owner form, claimed first, removed on every
exit path, collected after a kill under the two keys (with F16 (b)'s Windows exception); every sweep owner-aware or
retired before its first producer; a structural guard per language; nothing a sweep removes can be live.

### 2. Prerequisites

1. **P1 — CLOSED** by the owner's written statement of 2026-11-04 (PR #124, § *Epoch 2* question 2's second option).
   What is left of it is not P1 but merge condition (c) for the operator's WSL machine: one administrator scan of the
   two root-only places (item 3). E2.1 and E5's producer PR may not merge before it is recorded.
2. **F3 and F24** — merged, not released: ONE release carrying both (promote-release), then the pin bumps alone; coai's
   pin before S6 creates its baseline; the declaring repository's pin before its first Node compliance PR (E2.5 or E5's
   producer PR, whichever is first); the other consumers' bumps follow, those over the PR cap with the owner's
   agreement, asked when the release comes. F24's acceptance check (§ *Epoch 4*, item 2.3: the five forced runs) is
   run against the RELEASED guard and the real E5 host before S6, and recorded on the PR that creates the baseline.
   *[epoch 5, 2026-11-04, Opus review]* **The release order, said once here** (item 1's "stands" and item 5's build
   order read with it): (1) F24's acceptance check runs FIRST, at the F24 sha (`ff0ea790` on `main`, pre-release) — the
   owner's answer of § *Epoch 4* question 4 is "cut after F24 is built and its check passes"; (2) THEN the ONE release
   carrying F3 and F24 (promote-release) and the pin bumps; (3) THEN the check runs AGAIN against the RELEASED guard
   (coai's pin) and the real E5 host, before S6 creates its baseline, and that second run is the one recorded on the PR.
   The first run gates the release; the second gates S6.
3. **P2, P3 (the interim) and F22** — done (§ *Epoch 3*, item 2).
4. **E5's rollback procedure (D11)** — written in the E5 stories document and BUILT in S2-B as the one switch
   (coai #945); it is merge condition (m) and is checked on the producer PR before it merges.
5. **The coai feature review** at the end, unchanged.
6. **Not prerequisites:** F25 (parked), F26 (the owner's mirror), F27 and F28 (PR #125); coai #944 and creds #295
   (Windows code signing); the private sibling's mirror of F24 (the owner's, R4).

### 3. Merge conditions (revised, per producer PR)

§ *Epoch 4*, item 3 (with its gate revision and the merge-gate table) stands, with these changes:

- **(c) read for 2026-11-04.** For E2 and E5 the owner's Windows machine is met by the statement (it does not build or
  test them; its barrier stays closed). The operator's WSL machine is met only when the administrator scan of its two
  root-only places is recorded in `research/security/machines.md` (one command; the record names what it found). A
  hosted runner needs no record (R2). (c) stays a merge condition; it is not waived by P1's closure.
- **(d) read with 4.1.** The one-time hand clean-up recorded per machine is the removal of LEGACY names (for coai:
  `testsToDelete-coai-run-*` and the old `coai-` test literals, S2-A's tool). It is the ONLY removal of those names.
- **(g) read with 4.1.** "start-of-run collection for every resource it introduces" means the owner-form resources the
  PR introduces. The PR promises no collection of legacy folders; a document of the PR that says a sweep collects them
  is a defect (E5's D4 is corrected so on #945). *[epoch 5, 2026-11-04, Opus review]* (g) is ALSO read with the
  exception: the native measurement series is a resource the PR renames and nothing collects — "start-of-run
  collection for every resource it introduces" does not reach it, by item 4's decision.
- **(i) read with the exception.** The invocation inventory lists the native measurement series as a KEPT line of the
  prefix family with its own lifecycle: created by `make-series.sh`, removed by `remove-series.sh`, never collected;
  not backed by an owned folder, and no prefix is "dropped" there — the name leaves the `testsToDelete-` family by a
  rename that the inventory records. Every OTHER dropped prefix is backed by an owned folder as before.
  *[epoch 5, 2026-11-04, Opus review]* "a KEPT line of the prefix family" contradicts "leaves the prefix family": read
  it as "a kept line of the INVENTORY" — the inventory keeps a line for the series; the name is outside the family.
- **(n) NEW — the exception's evidence** (item 4) is in the producer PR: the survival test and the shape tests of
  `remove-series.sh`, green on the Linux leg (the series exists only on a Linux box), and the native documents say
  what the series is and who removes it.
  *[epoch 5, 2026-11-04, Opus review]* (n) lists ALL the evidence items of item 4, each green on the Linux leg and
  each named in the PR record: (1) the survival test between phases; (2) the remover's grammar (the NEW tests of item 4
  evidence 2); (3) the guard's reading of the series lines, or the inline exemption and its inventory line in S6;
  (4) the ownership refusals, through the owner-uid seam, in the CALLER (the lead's argv builder, item 4 evidence 7)
  AND in the copy (`remove-series.sh`, evidence 4); (5) a phase on a series that is gone stops with its one line;
  (6) the size figure measured BEFORE the rename, with its assumptions; (7) the documents — the native documents, the
  E5 stories document and coai's native plan and its E1 stories (item 4, *The documents the rename revises*).

**E5's producer PR** merges only when: S2-A (#940) is on `main`; ONE squash-merged PR carries S3 → S2-B → S4 → S5 →
S6 as in § *Epoch 3* (S3 and S2-B are on #945 already); S4 carries the exception's evidence (n) and the implementation
notes of item 6; S6's repository-wide checks are green; (k), (l) and (m) hold; the matrix of § *Epoch 4* (f) is green;
and every other condition — (c) for the WSL machine, the release with F24 (and F3 if first), the gates, decision 6's
shape — is still met. The E5 stories document, D8, carries the same.

### 4. The native measurement series — the bounded exception (4.2)

**What it is.** coai measures the native Kimi and Vibe CLIs on a Linux box over a SERIES: `make-series.sh` creates one
folder under the series root; the probes run inside it in phases (each phase a root-run script that must be able to
find the folder again); `abort.sh` stops a running phase; `remove-series.sh` removes the folder when the person is
done. The folder outlives every script that writes it, on purpose. Today its name is
`/tmp/testsToDelete-native-(vibe|kimi)-<yyyymmdd>-<6 hex>` (`scripts/lib/native-run.mjs:18` `SERIES_SHAPE`, the same
literal in `scripts/native/abort.sh:31`, `make-series.sh:30`, `remove-series.sh:22`; the tests
`scripts/lib/native-run.test.mjs:9`, `:31-33`, `:68-69` and `scripts/native/native.test.mjs:26`, `:112`, `:420`).

**Why neither S4 option fits.** An owned folder of the wrap dies with the script that made it (rule §2: the scope's
`after`), so phase 2 would find nothing. An owner-form name claims a pid; the pid is gone when the script exits, and the
next run's sweep removes a `gone` folder after ten minutes (rule §4) — a measurement in progress would be destroyed.
The question consultants (`b5c30429`) and the re-review consultant (`d7ad1ace`) agree: this is a change of approach,
and the fix is an explicit exception, not a third mechanism.

**Decision.** The series LEAVES the prefix family. Its name becomes **`native-(vibe|kimi)-[0-9]{8}-[0-9a-f]{6}`** under
the series root (`/tmp`, or `COAI_NATIVE_SERIES_ROOT`): no `testsToDelete-` prefix, no owner segment, no claim. It is
still made ONLY by `make-series.sh` (*[epoch 5, 2026-11-04, Opus review]* read with *The real creator* below: the
lead's `mkdirArgv` makes the bare folder, `make-series.sh` checks and fills it) and removed ONLY by `remove-series.sh`;
`remove-series.sh` keeps validating the
whole shape and refuses anything else (exit 78, one line); `abort.sh` keeps the same shape. Nothing collects it
automatically — not the test sweeps, not the janitor (it matches `^teststodelete[-_]`), not a next run. Its durable
purpose, its two scripts and its grammar are written in the native documents and in E5's inventory (D10), where it
stays as a line of its own. `SERIES_SHAPE` is still the ONE literal the four files share, and `native.test.mjs` still
fails unless all of them hold exactly that text.

**Evidence (S4, on the Linux leg):**

1. *Survival between phases:* a test makes a series with `make-series.sh` under a private root, runs one phase script
   to completion, then starts a second phase — the folder and its phase-1 contents are still there, unchanged, and no
   sweep of S2-B and no `run-lib-tests.mjs` start touched it (the private root is swept in between, on purpose, and
   the series survives it).
2. *The remover's grammar:* `remove-series.sh` accepts a valid NEW name (`native-kimi-20261104-0a1b2c`) and removes
   it; it refuses, with one line and exit 78, a malformed one — the OLD prefixed name
   (`testsToDelete-native-vibe-…`), a wrong kind (`native-other-…`), a wrong date width, upper-case hex, a path outside
   the series root, and a path with a separator in the leaf. These are the existing refusal tests of
   `native-run.test.mjs:31-33` and `native.test.mjs:420`, moved to the new shape, plus the old-prefix case.
   *[epoch 5, 2026-11-04, Opus review]* That last sentence mislabels the tests, and is corrected here: the tests are
   NEW, not existing. `native-run.test.mjs:31-33` tests `renderRunScript` (through `seriesOf`), the JS side, not the
   remover; `native.test.mjs:420` is inside the `make-series.sh` refusal test (`:418-439`); and the remover's ONLY
   refusal test today is the SERIES_PATH one near `:445`. So: the wrong kind, the date width, the upper-case hex, the
   separator in the leaf and the old prefix are NEW `remove-series.sh` tests in `native.test.mjs`, and the JS
   `seriesOf` cases of `native-run.test.mjs:31-33` move to the new shape beside them. One more line of evidence: the
   native scripts set `LC_ALL=C` before the `=~` shape test (`make-series.sh:42`, `remove-series.sh:38`,
   `abort.sh:43` today) — the bracket range `[0-9a-f]` is locale-dependent, and the `export PATH=/usr/bin:/bin` line
   of each script sets no locale.
3. *The guard:* the series name carries no `testsToDelete-` prefix, so rule §7's `legacy-name` class does not see it,
   and it is outside every run folder, so it can never be a `raw-temp` baseline entry. If the shipped guard classes
   `make-series.sh`'s `mkdir` under another class, S6 names the line with the inline exemption of rule §7 and the reason
   `the native measurement series — § Epoch 5 item 4`, and the expected-exemption inventory lists it.

4. *The remover's ownership check (added at the judge's question, 2026-11-04).* `remove-series.sh` already refuses a
   symlinked or missing folder, a `SERIES_PATH` that is not the folder given or its real path, and a name off the shape,
   and it removes one checked variable, never a glob. The rename adds no new path to it. Because the series root is a
   shared `/tmp` and the remover runs as root, S4 also makes it refuse (exit 78, one line) a folder whose owner is not
   uid 0 or that is group- or world-writable — a test for each refusal. A Fable security read of the four scripts is
   part of S4's Opus review. *[re-review gate, 2026-11-04, finding 0]* The race between the checks and `rm` is closed
   by the series ROOT, not by timing: the remover also refuses a root that is not owned by uid 0, or that is
   world-writable without the sticky bit (`/tmp` is `1777`). Under a sticky, root-owned root, no other user can
   rename, replace or remove a uid-0 folder, and inside a folder that is not group- or world-writable no other user
   can replace an entry; so what was checked is what `rm -rf` removes. Tests: a non-sticky world-writable root and a
   root owned by another uid are each refused before any `rm`. *[PR review, CodeRabbit, 2026-11-04]* The same holds for
   a GROUP: a root that is group-writable without the sticky bit is refused too (a group member could rename the
   checked folder and plant its own `run/` script for root to run). So the root is uid 0, and when it is group- or
   world-writable it must be sticky; this rule applies to the caller's `stat` check (evidence 7) and to the copy. Tests
   add modes `0775` and `0770`; accepted are `1777`, `0755` and `0700`.
5. *A phase whose series is gone (re-review gate, finding 1).* A reboot that clears `/tmp`, or a `remove-series.sh`,
   between two phases leaves the next phase without its series. That phase stops with one line — the series
   `<path>` is gone (removed, or cleared by a reboot); start a new series with `make-series.sh` — and a non-zero exit,
   before it writes anything; the measurement's partial results are what the earlier phases already printed. Test: a
   phase started on a removed series gives that line and that exit.
6. *The rest, in the E5 stories document* (its interim document gate, 2026-11-04, five findings accepted): the size is
   measured BEFORE the rename lands (a real series, `du -sh`, with its assumptions); the ownership tests run as the CI
   user through an owner-uid seam beside `COAI_NATIVE_SERIES_ROOT` (default 0); the S4 DoD lists all seven evidence
   items, each named in the PR record.
7. *The ownership check moves to the CALLER (Opus review, 2026-11-04) — SAFETY.* The lead runs the series' COPY of the
   remover as root: `removeArgv` is `ssh <host> -- /bin/bash -- <series>/run/remove-series.sh <series>`
   (`scripts/lib/native-run.mjs:85-88`); `abortArgv` and `launcherArgv` run `<series>/run/abort.sh` and
   `<series>/run/<phase>.sh` the same way (`:73-82`). A folder planted in a shared `/tmp` under a valid name can carry
   its OWN `run/remove-series.sh`, so a check inside the copy protects nothing — root would run the planted file. So,
   BEFORE the lead runs anything from a series folder (remove, abort, any phase), it checks over ssh with `stat`, never
   with a shell expansion of the folder's content: the series folder and its `run/` are directories, not symlinks,
   owned by uid 0, mode 700; `run/remove-series.sh` (and the phase script it is about to run) is a regular file owned
   by uid 0 and not group- or world-writable; the series ROOT is owned by uid 0 and, when world-writable, sticky. Any
   mismatch: the lead refuses with one line and runs nothing. The copy's own checks (evidence 4) stay as defence in
   depth — "the remover also refuses …" above is read that way. Tests: the lead's argv builder refuses each mismatch
   (unit tests with a stubbed `stat` result, so they run on every platform like the rest of `native-run.test.mjs`),
   and the owner-uid seam (`COAI_NATIVE_SERIES_OWNER_UID`, default 0) lets the CI user run the bash side.

**The real creator (Opus review, 2026-11-04).** The series is made by TWO parties, and every "created only by
`make-series.sh`" in this section is read so: the LEAD makes the bare folder over ssh — `mkdirArgv` is
`ssh <host> -- /bin/mkdir -m 700 -- <series>` (`scripts/lib/native-run.mjs:91-93`, no `-p`, so an existing folder
fails) — then `make-series.sh` refuses unless its own folder matches the shape, is not a symlink, is mode 700 and is
owned by the user running it (`scripts/native/make-series.sh:37-46`, exit 78), and FILLS it (`checkout/ tmp/ run/
logs/ bin/`, `SERIES_PATH`, `run/path.txt`, `run/node.txt`). The bound of this exception names `native-run.mjs`
(`mkdirArgv`, `seriesOf`, `removeArgv`) and the four files `scripts/native/*.sh` (`make-series.sh`, `abort.sh`,
`remove-series.sh`, `run-template.sh`) as "the scripts that own it".

**The documents the rename revises (Opus review, 2026-11-04).** Besides the native documents and E5's S4 and D10, the
shape is a CONTRACT line of coai's own native plan, `dew_flow_connect_other_ais · todo/PLAN_kimi_and_vibe_on_native_linux.md`
(live, in `todo/`; `:310`, `:330`, `:336`, `:407`, `:412`, `:609` carry `^/tmp/testsToDelete-native-…$` or the
`ls -d /tmp/testsToDelete-native-*` line) and of its E1 stories document (`…_E1.md:97`). That plan was approved
before the change-control rule reached coai (its plan gate `942810c1` and E1 plan round `b54f22f5`, 2026-10-21), so
the rename opens its ledger: epoch 1 dated at that approval, the rename as its entry 1.1 (`contract`), and a dated
note at each shape line; the E1 stories document gets dated notes only (a stories document keeps no ledger). Its size
projection (`:606-607`: about 80 MB of Kimi cache plus under 50 MB of Vibe homes, exports and logs — "total under
150 MB, in `/tmp`") is the figure the size paragraph below starts from.

**A series in progress at the merge (Opus review, 2026-11-04).** A series started under the OLD name before the
producer PR merges is finished with the OLD checkout: the new `seriesOf` refuses the old shape, so the new lead cannot
run its phases, abort it or remove it. The person finishes and removes it with the checkout that made it (or removes
it by hand with the old `remove-series.sh` copy in its `run/`), then starts the next series under the new name.

**The old-prefix refusal fixture.** The old-prefix case of evidence 2 (`testsToDelete-native-vibe-…`) is a
`legacy-name` literal in `native.test.mjs`, so S6's expected-exemption inventory lists it with the inline exemption
(the parent's S6 line of item 5: "the series' line and the old-prefix fixture").

**Size and the forgotten series.** A series holds the run folders of its phases (probe outputs, transcripts, small
binaries); its size is measured at its first use after S4 and written in the native documents with the command that
measures it (`du -sh`). A series a person forgets is found with `ls -d <root>/native-*` (the native documents say so)
and removed with `remove-series.sh`; nothing else removes it, by design. On a box whose `/tmp` is cleared at boot, a
reboot also clears it — the documents say that a measurement in progress does not survive one.
*[epoch 5, 2026-11-04, Opus review]* The projected figure before the measurement is the native plan's own (`:606-607`,
"total under 150 MB, in `/tmp`"; the measured `du -sh` of evidence 6 replaces it). And a reboot is not the only
cleaner: a tmp cleaner (systemd-tmpfiles' age clean-up; Fedora's default is 10 days) clears `/tmp` too, so this
paragraph and evidence 5 read "a reboot or a tmp cleaner". A forgotten series is invisible to the janitor
(`tools/janitor.sh:156`, `RX='teststodelete[-_]'`) and to the barrier scan (`sweeper-scan.mjs`): only `ls -d
<root>/native-*` finds it, and the documents say so.

**Bound.** The exception is one shape in one family of scripts. A second durable resource anywhere in the family is a
new plan change, not a second use of this item.

**The legacy folders (4.1), for the record.** `testsToDelete-coai-run-*` folders of runs killed before E5 are legacy
names under rule §1. At the pin the Node reference answers `unknown` for them on Linux (`legacyOwnerState`: a legacy
record has no `<ns>`), lists and changes nothing on Windows (F16 (b)), and cannot parse E2's `win32`/`darwin` tags; the
C# copy lists a legacy name and never reads its claim. So nothing collects them: S2-A's one-off clean-up is the only
removal, and both sweeps print the `legacy:` line per folder. E5's D4, S2-B item 3 and Q3 say so since coai #945
(`89494366`); this plan's E5 entry (§ *Epics*) is read with this paragraph. *[PR review, CodeRabbit, 2026-11-04]* "Both
sweeps" are the Node and the C# start-of-run sweeps. The janitor is another tool: with `--token coai` it narrows to
`teststodelete[-_]<owner>[-_]coai[-_]` (`tools/janitor.sh:157`) and does NOT list a legacy name, so S2-B's
`--token coai --dry-run` proves nothing about legacy folders; a person lists them with `janitor.sh --dry-run` (no
`--token`) or with S2-A's tool.

### 5. Build order (revised)

```
DONE   as § Epoch 4, item 5 → epoch 4 approved (#118) → coai #943 (E5 revised for epoch 4) → F24 merged (#119, not
       released) → entry 4.1 recorded (#121) → F25 parked (#120) → the remainder plan closed (#122; R6 is this plan's)
       → coai #945: S3, then S2-B, CI green on three legs (6ec356a1) → creds #294: E2.1's by-hand records, part 7
       → P1 closed by the owner's statement (PR #124, open) → S4's brief → the stop of epoch 4 (entry 4.2) and this
       re-review.
NEXT   the owner approves epoch 5 (question 1)               — nothing of this plan merges before it
          (DONE: the owner approved on 2026-11-04; the first step still waiting is the administrator scan below.)
       the WSL administrator scan (condition (c))             — the administrator; one command; blocks the first producer MERGE
                                                                of E2 (E2.1) and of E5, not their build
       F24's acceptance check at the F24 sha (ff0ea790)       — FIRST, pre-release (item 2.2; Opus review 2026-11-04)
       ONE release carrying F3 and F24 (promote-release)      — the main session; then the pin bumps alone (coai's before
                                                                S6; the declaring repository's before its first Node
                                                                compliance PR); F24's acceptance check AGAIN, against
                                                                the released guard and the real E5 host, before S6
       E2.1 (draft creds #294) merges after (c) and its by-hand records (run 2 of tmp/e21-byhand recorded in part 7)
          → E2.2, cut from E2.1's merge commit → E2.3 → E2.4 → E2.5, each with its invocation inventory
       E5 producer PR (coai #945) — one squash merge, commits S3 ✓ → S2-B ✓ → S4 → S5 → S6:
          S4   the Node wrap; beginRun fails closed; a direct node --test refuses (the first import, item 6 P1);
               scripts/** and the SonarCloud extension job through a runner; the native measurement series as item 4
               (the rename, the two scripts, the survival and grammar tests, the documents); the probes' default
               scratch in an owned folder of the wrap, --scratch kept (item 6 D-b); run-host's three owned folders
               inside the runner's run folder (D-c); TESTSTODELETE_RUN exported by the Node runners (P8); a targeted
               macOS Node step (P12); test:host once on a hosted Windows runner, recorded (P4)
          S5   the renames, as § Epoch 3
          S6   after F24's pin: the guards, one baseline, the expected-exemption inventory (the series' line and the
               old-prefix fixture; Opus review 2026-11-04), seeded violations in every test root; the guard also reads
               src_vs_code/scripts/*.mjs (item 6 P13)
          after (c), F24's pin, and F3's pin if this is the first declaration → E5.S7 the drain
THEN   wave 3: E6 ∥ E7, as § Epoch 3; each C# copy an adapted copy (§ Epoch 4, item 4).
          Before E6's stories are written: the boundary with dew_flow_benchmark's
          todo/PLAN_bench_test_leftovers_followups.md (its stories own the spikes/lang-bench, spikes/minigit-bench/test
          and spikes/lang-explore/test leftovers it lists; E6 lists those sites in its inventory and does not redo
          them) is written in BOTH plans — here now, there by a docs PR in that repository before E6 starts.
LAST   the coai feature review; the promotion of this plan and its stories documents; R6 ticked in the remainder plan.
```

S3 and S2-B are built and reviewed (coai #945); they are not rebuilt by this revision. S4 is the next commit of the
producer PR and carries everything of items 4 and 6. S5 and S6 follow as § *Epoch 3* and § *Epoch 4* say. The suite × OS
matrix (§ *Epoch 4*, item 3 (f)), the rollback switch (D11, (m)), S6's release dependency on F24, S7's zero-baseline
end, E7's sweep-only prerequisite and the feature review all stand.
*[epoch 5, 2026-11-04, Opus review]* The E6 boundary in the THEN block: E6's done-when checks the `spikes/lang-bench`,
`spikes/minigit-bench/test` and `spikes/lang-explore/test` sites ITSELF (its inventory lists them and its guard reads
them); it does not take the benchmark follow-ups plan's word that they are handled. "Does not redo them" means E6 does
not build their cleanup twice, not that it skips the check.

### 6. What the re-review consultant raised, and what was done with it

| Point | Verified | Taken |
|---|---|---|
| (a) 4.2 conflicts with the Goal (revised) ("every consumer's … script … creates outside its own process only resources of the owner form") and with merge condition (i) (every dropped prefix backed by an owned folder); the revision must write ONE explicit, bounded exception into the goal, the DoD, condition (i) / the inventory and E5's S4 — its durable purpose, its creating and removing scripts, its exact grammar, that nothing collects it, that it stays in the inventory — with its evidence: the series survives between phases; `remove-series.sh` accepts a valid new name and refuses malformed ones (consult `d7ad1ace`) | yes — `SERIES_SHAPE` at `native-run.mjs:18`; the three scripts; `remove-series.sh` validates the shape and refuses (exit 78); the tests at `native-run.test.mjs:9`, `:31-33`, `:68-69`, `native.test.mjs:26`, `:112`, `:420`. *[epoch 5, 2026-11-04, Opus review]* Those tests pin the LITERAL, they are not remover refusal tests: `native-run.test.mjs:31-33` tests `renderRunScript`/`seriesOf`, `native.test.mjs:420` is in the `make-series.sh` test, and the remover's only refusal test is near `:445`; the remover's shape tests of item 4 evidence 2 are NEW | yes — item 1 (the goal), item 3 ((i), (n)), item 4, the DoD line below, E5's S4, D10 row and DoD |
| (b) 4.1: the text must distinguish the legacy folders' one-off clean-up from the collection of new owner-form folders (`d7ad1ace`; the question consultants `08beb732`, `76d09c26`) | yes — `owned.mjs` `legacyOwnerState` answers `unknown` on Linux for a record without `<ns>`; the Windows sweep lists only (F16 interim); `parseLegacyOwner` reads `linux|macos|windows` only; coai #945 `89494366` corrects D4, S2-B item 3 and Q3 | yes — item 1 (the clarification), item 3 ((d), (g)), item 4's last paragraph |
| (c) the record says `Narrowed: yes` — the series loses the ownership and automatic-collection guarantee, and 4.1 withdrew a promised collection; the owner approves epoch 5 | yes — both are smaller promises than the approved goal made | yes — the record; question 1 |
| (d) P1's closure is not a plan change: the plan already offered the written statement as P1's second option (§ *Epoch 2*, question 2) | yes — PR #124's body and its four notes say so; `plan-lifecycle` is clean there | yes — items 1 and 2; condition (c) is kept, not waived |

**Classified as NOT changes — implementation notes of S4 (and one of S6), written into E5's stories document on
2026-11-04 so the coder and the reviewers see them.** Each is a fix that satisfies the plan as written, or an
already-approved constraint read more exactly:

| # | Note | Why it is not a change |
|---|---|---|
| P1 | Every test file gets a FIRST import that refuses a direct `node --test`; the import refuses BEFORE any resource-creating dependency runs | § *Epoch 4* text (via § *Epoch 3*, item 4) already says every direct invocation enters containment or refuses; the order of the import is how it is done |
| D-b | The four person-run probes (`probe-kimi-confinement.mjs:132`, `probe-kimi-tree-hold.mjs:99`, `probe-vibe-confinement.mjs:92`, `vibe-home-manifest.mjs:71`) already take `--scratch <dir>`; their DEFAULT scratch moves into an owned folder of the wrap, removed at exit, with one line saying so (S4's first option); a person who keeps a run for `--reparse`/`--from` names a folder with `--scratch`, outside the machine temp's automatic lifecycle | S4 as written: "an owned folder of the wrap, or the owner form through the wrap; the PR says which, per site" |
| D-c | `run-host.mjs` keeps its three owned folders (`host-ws`, `host-data`, `host-profile`) but makes them INSIDE the runner's own run folder, with `TEMP`/`TMP`/`TMPDIR` moved there. *[epoch 5, 2026-11-04, Opus review]* Both texts win: the three are owned folders of the wrap INSIDE the run folder, each with its own claim (the rule: an owned folder always has its claim). And S4 checks VS Code's IPC socket path length under the deeper `--user-data-dir` (creds E2.1 met macOS's 103-byte socket cap, its E2 document `:284`); if it is too long, the profile folder stays short | the generic runner rule (one owned folder per runner, the variables handed to every child) and the specific `run-host` paragraph of S4, both as written |
| P4 | "`test:host` once on Windows" is a deliberately started, recorded run on a hosted `windows-latest` runner, with the before/after counts in the record, taken before the runner is discarded | the owner's Windows machine does not test E5 (P1's statement); a hosted run is the only Windows run there is, and S4's commands line already asks for the counts |
| P8 | The Node runners EXPORT `TESTSTODELETE_RUN` (the detail, `common/test-leftovers-detail.md:120`: the top of a run exports its record once) and withhold an inherited one only around their own claim | the contract as released; coai #945 `6695ab36` already made the run folder's claim name ITS process |
| P12 | A targeted macOS Node CI step, so must-not-copy #12 (the `/var` → `/private/var` compare) runs on macOS for the wrap too | row 12 already names S4; the step is how its macOS arm is reached |
| P2, P9, P10, P11 | Counts and references: the "31 runner scripts" of S4 are 25 entry scripts plus 13 library modules that get no folder of their own (*[epoch 5, 2026-11-04, Opus review]* that is 38 files, not 31; 25 of them own a folder); stale line numbers; two unnamed script sites (`scripts/live-consult-all.mjs:25` `coai-live-…`, `scripts/measure-idle-server.mjs:32` `coai-idle-arm-`) added to S4's list | repaired references and counts (the rule's "not a change") |
| P13 (S6) | No guard scans `src_vs_code/scripts/*.mjs` today; S6's guard (and F3's manifest scan) must include that folder, or S6's zero is false for the runners | S6's goal already says "every tree of the repository"; the folder list is a repaired reference |
| P4 for S2-B *[epoch 5, 2026-11-04, Opus review]* | S2-B's commands line asks for `janitor.sh --token coai --dry-run` after a full run "on Windows (Git for Windows' bash) and in WSL" (E5 `:912`), and `research/module_tests.md:6129` records only the WSL run. It gets P4's treatment: a deliberately started, recorded dry-run on a hosted `windows-latest` runner (Git for Windows' bash), before the producer PR merges — an OPEN ITEM of the producer PR, named in E5's S2-B and in the S4 implementation notes | the same reason as P4: the owner's Windows machine does not test E5, so a hosted run is the only Windows run there is; the commands line already asks for the run — this names where it happens; not a narrowing |

Nothing the consultant raised was rejected.

**Definition of Done, read for epoch 5** (the list above is not edited; this line is read with it): item 1 ("Every
consumer's tests, scripts and CI create only `testsToDelete-…` resources (or a documented exemption)") has ONE further
documented exemption — the native measurement series of item 4, with its evidence (n) on E5's producer PR; the
epoch-3 line on the invocation inventory is read with (i) as revised; nothing else of the list changes.

### 7. Questions for the owner (blocking; each with the recommended answer)

**Answered 2026-11-04:** 1 — approved (epoch 5 opens `by owner`). 2 — not answered yet: the administrator scan stays open
and still blocks the first producer merge of E2 and of E5.

1. **Approve epoch 5 as narrowed?** The record says `Narrowed: yes`: the native measurement series leaves the prefix
   family and loses the ownership and automatic-collection guarantee (it is made and removed only by its own scripts,
   with the evidence of item 4), and the collection of killed legacy coai runs that E5 promised is withdrawn (only the
   one-off clean-up removes them). *Recommended:* yes — the series is one durable resource with a written lifecycle
   and a remover that refuses every other name; the legacy promise never held at the pin, and the one-off clean-up
   (#940) already does the removal with a re-check and an exclusive rename.
2. **The WSL administrator scan** (merge condition (c) for the operator's machine): run
   `sudo node tools/sweeper-scan.mjs --system` once as the administrator and hand the output over for
   `research/security/machines.md`. *Recommended:* run it; it is one command, and it is the last barrier item between
   E2.1 and its merge (with its by-hand records).
3. **The over-cap pin bumps of the F3 + F24 release** — asked when the release comes, as the owner answered in
   epoch 4 (question 4). No answer is needed now.

## Epoch 6 — the plan as revised at the re-review (2026-11-05)

The whole plan read again against what is known now, as step 4 of the full stop asks (`common/plan-change-control.md`),
over the three entries of epoch 5. All three were found on E5's producer branch: 5.1 (2026-11-04, S2-B's two-sweeps test
on Windows), a rename has no single winner there, so the C# copy holds a per-root mutex around a whole sweep — built on
#945, an op on the template's text, F29 for the template's owner; 5.2 (2026-11-05, the S6 brief), must-not-copy row 2
asks for twelve planted spellings in a `.mjs`, RED when the folding reader is off, and the shipped Node guard has no
folding reader; 5.3 (2026-11-05, the same brief), D8 (b) says only the authorised `raw-temp` baseline is left, but the
guard must read `src_vs_code/scripts/` (P13), which holds 54 `raw-temp` lines no baseline scope can carry, and
`src_server/smoke-image.sh:73` is a raw temp outside every scope. The re-review consult is `7f55e578` (the question
consultants before it: `5d804d0c`); it is advice, and each point was checked against the files (item 6). This section
is the baseline epoch 6 is approved on. § *Epoch 5* stays as the record. Superseded by this section, read from here:
E5's must-not-copy row 2, its Node half (item 4.1); E5's D8 (b) and the S6 line of § *Epoch 5* item 5 ("the guards, one
baseline, the expected-exemption inventory") — read with item 4.2; the S6 brief's Decision 5 (an exemption for
`smoke-image.sh:73` with the reason "its EXIT trap removes this folder") — item 4.3; the S6 brief's § 11 ("the disposal
order of the two assembly fixtures must not matter") — item 4.4; the S6 brief's § 12.4 (the standing shrink step skipped
on the creation PR) — item 4.5. The E5 stories document (`dew_flow_connect_other_ais · todo/PLAN_test_leftovers_E5.md`)
is revised the same day on the producer branch; its changes are this plan's. The S6 brief is NOT rewritten here; what
must change in it is listed in item 4.7, and an Opus author revises it after this epoch is approved.

### 1. What this plan is now

§ *Epoch 5*'s picture stands, with these facts brought up to date (each read in git or GitHub on 2026-11-05):

- **Epoch 5 was approved by the owner** (2026-11-04, #126, `02bf273`). It then took THREE changes in one day. The
  pattern of the four stops is the same: a story's build brief found that a mechanism the plan named does not fit the
  tool, the tree or the CI as they are. The plan specified the mechanism before anyone checked the fit. Item 8 changes
  the way of working so the check comes first.
- **The ONE release carrying F3 and F24 is promoted:** `release` = `bd795847` (F3 #116, F24 #119, and the test-only
  #130), 2026-11-05. The F24 FIRST acceptance run passed before it (the guard's proof check closes both ways under
  `--profile node`; the five forced runs exit 78 on the C# host, `RunTempTests` 21 of 21; both Node proof files 6 of 6).
  The pin bumps are in flight, each alone, over the cap with the owner's agreement of 2026-11-05: coai #947, creds #297,
  mcp #64, sidecar_rust #70, vscode_kit #23, wsl_care #186 (rag_qln's not opened yet), and benchmark #166, r9700 #14 under
  the cap. **coai's `main` and the producer branch still pin `cc24f9e`** (read in the gitlink): S6 cannot create its
  baseline, and the SECOND F24 acceptance run cannot run, before #947 merges and the branch takes it.
  *[the judge, 2026-11-05]* Since this was written: the eight bumps merged at 09:50Z; rag_qln's is open as #88; coai's
  `main` pins `bd79584` (read through the API); the producer branch still pins `cc24f9e`, so the step still to come is
  the merge of `main` into the branch. "In flight", "pending" and "not opened yet" below are read with this.
- **E5 (wave 2).** coai #945 (draft) at `524df50e` holds S3, S2-B, S4 (`93c3092a` … `bd03bb3e`), entry 5.1
  (`SweepLock.cs`, three ops, strict tests, RED runs 41875636356, 41878243091, 41893469970, Windows green twice on run
  41881044878) and S5 (`d8dff1a6`, `cab9a172`, `524df50e`; the fixture bug it exposed is fixed). Every job is green on
  that head except the pin check (the promotion's known result, ended by #947) and the `continue-on-error` real-editor
  job (a transient VS Code version lookup, before any editor started). **S6 is a brief only** (local `6b3f143e`; a copy
  on `docs/e5-s6-brief-at-stop5`); S7 is not started.
- **E2 (wave 2).** creds #294 (draft) is unchanged at `9a6e9fa` since epoch 5's table. Its merge waits for (c), the WSL
  administrator scan, and this epoch's approval. E2.2–E2.5 are not started. E2's own document has the same two gaps as
  E5 (item 8.3), and its revision is its own plan-gate work, not this section's.
- **E7 (wave 3).** Stage A is DONE and its plan promoted: dew_flow_rag_qln #86 (`47998e7`) and #87 (`88577ff`,
  `research/PLAN_test_leftovers_E7_stage_a.md`). The live check ran on the WSL machine with native stores: 8 `qlntest`
  collections, 18867 points, 84 MB of vectors, 221 MB on disk; a second run adds none. The plan's "about 8 GB per recipe
  change" is REFUTED (about 0.2 GB). `SearchLiveTests.AQuestionInWords_FindsTheMemberThatAnswersIt` failed in both runs,
  not caused by stage A (recorded in `research/module_search.md` there). **rag_qln has no `research/module_tests.md`**,
  which `common.knowledge-base` requires of every repository; E7's stories must create it (item 8.3).
- **E6 (wave 3).** Not started; no stories document. The boundary with dew_flow_benchmark's
  `todo/PLAN_bench_test_leftovers_followups.md` is written on THIS side (§ *Epoch 5* item 5) and NOT yet on the
  benchmark side (its plan mentions a boundary once, `:97`, without a table).
- **The owner's open item is unchanged:** one administrator scan of the two root-only places of the WSL machine
  (merge condition (c)); it blocks the first producer MERGE of E2 (E2.1) and of E5, not their build.
- **The owner's standing wish:** no heavy bureaucracy, but control is kept. This revision removes a check only where it
  proves nothing (item 8.1 names each one) and trades no part of the barrier for fewer steps.

**Goal.** The goal of § *Epoch 5*, item 1, stands word for word, with its exception and its clarification, and with **one more bounded exception** (the coordinator, 2026-11-05, on the judge's finding; the owner approves it with item 7's question 1): a `kill -9` of `src_server/smoke-image.sh`, run by a person outside a run folder, leaves one folder with an owner-form name and no claim (item 4.3). It is a named test-support script, and every other way out of the script removes the folder.

**Definition of Done, read for epoch 6** (the list of § *Definition of Done* is not edited; this paragraph is read with
it and with § *Epoch 5*'s reading): the "structural guard per language" line is read with F30's limit — until the
shipped Node guard folds, a Node consumer's zero for `legacy-name` and `owner-blind` is a zero of WHOLE literals, said
so in the PR; and item 1's "documented exemption" includes the inline `raw-temp` exemptions of E5's expected-exemption
inventory, each with a reason proved as item 4.2 says. The first of those readings reaches every Node consumer, not only E5. E5's S7 therefore ends with its baseline at zero and the inventory's inline rows still standing. Nothing else of the list changes.

### 2. Prerequisites

1. **Merge condition (c) for the WSL machine** — OPEN: the administrator scan (`sudo node tools/sweeper-scan.mjs
   --system`), recorded in `research/security/machines.md`. Blocks E2.1's and E5's producer MERGE.
2. **The release `bd795847`** — DONE. Still to come, in this order: coai #947 merges (a pin bump alone) → the producer
   branch merges `main` (a merge, not a rewrite) → the SECOND F24 acceptance check against the released guard and the real
   E5 host (the brief's § 16), recorded on #945 and in coai's `research/module_tests.md` → S6 creates the baseline.
3. **F30** (the shipped Node guard's folding reader) — NOT a prerequisite of any PR of this plan. A follow-up with an
   owner (the conventions repository) and a deadline (2026-11-19, accepted, question 3), covering coai and creds.
4. **E5's rollback procedure (D11)** — built (the one switch, S2-B); merge condition (m) checks it is in the PR text.
5. **The S6 brief's revision** by an Opus author (item 4.7) — a prerequisite of S6's CODE, not of this epoch's approval.
6. **The coai feature review** at the end, unchanged.
7. **Not prerequisites:** F25–F29 (parked or other owners); coai #948; the Windows code-signing PRs; the private
   sibling's mirror (F26, the owner's).

### 3. Merge conditions — ONE table: each remaining condition, its implementation, its invocations, its check

The re-review consultant's root cause for the four stops: approval precedes integration discovery. Its check, taken: a
table that maps every REMAINING merge condition to its ACTUAL implementation, the invocations it covers and an executable
acceptance check. **A row with "—" in the implementation or the check column is an unmapped condition: still a design
decision, and a finding of this re-review.** Each row was read against the real tree on 2026-11-05 (the producer branch
at `524df50e`; coai `main`; creds `9a6e9fa`; rag_qln `88577ff`; benchmark `main`), not against the plan text; a row that
says "not re-verified here" is one the revision took from the PR's record without running it.

**E5 — the producer PR (coai #945), conditions (a)–(n) of D8 as read for epoch 5, plus (o)–(q) added here:**

| # | Condition | Implementation (file) | Invocations covered | Executable acceptance check | State 2026-11-05 |
|---|---|---|---|---|---|
| (a) | S2-A on `main` | coai #940 `d02ed40e` | both runners | the characterization test of S2-A, green on `main` | DONE |
| (b) | one squash PR S3 → S2-B → S4 → S5 → S6, with S6's repository-wide checks | S3, S2-B, S4, S5 on #945; S6: `LeftoversRepositoryGuardTests.cs` (C#, the copied `Scan` + the baseline) and `src_vs_code/src/test/testLeftovers.test.mjs` (Node) — **not written yet, specified in the brief §§ 7.1, 7.4** | the four C# executables; `npm test` through `run-tests.mjs`; `run-lib-tests.mjs` | the two wrappers green on the three legs; the planted violation per root red then reverted (brief § 13) | S3–S5 built; **S6 unmapped until built** |
| (c) | the barrier per machine | `research/security/machines.md`; the Windows machine met by the owner's statement (#124) | the WSL machine; hosted runners need no record | `sudo node tools/sweeper-scan.mjs --system` once, its output in the record | **OPEN — the owner's item** |
| (d) | the legacy clean-up per machine | `scripts/old-coai-leftovers.mjs` (S2-A's tool) | a person, per machine | the record per machine on the PR | **OPEN, no record found** (the judge, 2026-11-05): `module_tests.md` describes the tool (`:439`) and holds no run of it on any machine, and `machines.md` lists an inventory with nothing removed; `/tmp` holds 0 `testsToDelete-coai-run-*` and 17 `coai-*` entries. **WSL, 2026-11-05: `old-coai-leftovers.mjs list` answers `0 entries in /tmp`, nothing to remove**; this goes on the PR as that machine's record. The condition stands (the coordinator, 2026-11-05): E5's D8 (d) and the brief § 18 follow this row. The owner's Windows machine is not tested on for now, per the owner's statement of § *Epoch 5* |
| (e) | the gates and the three legs | coai plan and code sessions; `ci.yml` `build-test`, `macos`, `windows` | every job of `ci.yml` | `proceed` on both gates; every job green on the head | green at `524df50e` but the pin check and the four `build-test` steps after it, which it skipped (Adapter check, Gate snippet, Build flags, Workflows parse) |
| (f) | the baseline rule released and pinned | `common/test-leftovers-baseline.md` at `5863c60`; coai's pin `cc24f9e` | the guard with `--baseline` | the pin check | DONE |
| (g) | F3 released and pinned before the first Node compliance declaration | `tools/lib/leftovers-package.mjs` in `bd795847`; coai #947 | `package.json` scripts | `leftovers-check.mjs --profile node` reads the manifests at the new pin (F3's own tests) | released; #947 merged; **the branch still pins `cc24f9e`** |
| (h) | every other condition of the parent | none beyond this table: rows (a) to (q) ARE the parent's conditions for this PR (the plan gate's finding: a row of `—` is unmapped, so this one is now said) | the PR's description | the description has one evidence line per row; a reviewer reads it, and a row with no evidence blocks the merge | mapped |
| (i) | F24 released and pinned before S6 creates the baseline | `common/test-leftovers-baseline.md` at `bd795847`; coai #947 | the proof marker, no order | the pin check; (l) | released; #947 merged; **the branch still pins `cc24f9e`** |
| (j) | the adapted copy's diff check | `src_mcp/tests/Leftovers/TheAdaptedCopyTests.cs`, `template-manifest.json` | the `Leftovers` filter on three legs | green on the head; one unexplained byte ⇒ red | green at `524df50e` |
| (k) | the suite × OS merge gates | `ci.yml` steps per § *Epoch 4* (f) and D8's table | each cell with a step | every cell green on the head | green at `524df50e` |
| (l) | F24's SECOND acceptance check against the released guard and the real host | the brief § 16: `--baseline --profile node` for the Node scopes; `LeftoversBaselineTests` `TheProofCheck_ClosesForEachScope` for the C# scopes; the five forced runs (`DiscoverySentinel`, `COAI_RUNTEMP_SELFTEST` = `fail-claim`, `mismatch-temp`, `mismatch-tmp`, `mismatch-tmpdir`, present in `src_vs_code/scripts/owned.mjs:61` and the C# gate) | the four C# executables, both Node runners | exit 78, one line, the sentinel untouched, five times; the proof check 2 → 0 (Node), 4 → 0 (C#) | **after #947; the C# test of the proof check is not written yet** |
| (m) | the rollback procedure in the PR text | D11's one switch (S2-B); the PR description | — | a reviewer reads the description | **OPEN** (the judge, 2026-11-05): the description lists it as still to do and says "This draft holds S3 only" |
| (n) | the native series' evidence, Linux leg | S4 on #945 (`1edf7157`, `49e75da2`, `f3f74b57`, `8ffc20fb`): the survival test, the remover's grammar tests, the caller's `stat` check, the phase on a gone series, the size figure, the documents | the Linux leg | the S4 tests green; the PR record names each of the seven items | built; read item by item by the judge: in `scripts/native/native.test.mjs` (1) `:609`, (2) the table at `:531` and the `LC_ALL` test `:189`, (4) `:561`–`:603`, (5) `:650`, (7) `:712`–`:742`, with `scripts/lib/native-run.test.mjs:172`–`:250`; (3) and (6) in `module_tests.md:6194`; **the PR record does not name them yet** |
| (o) NEW | the end-of-run audit reads the run folder BEFORE it is removed | `src_mcp/tests_leftovers/LeftoversAudit.cs:41`: `Discover` returns `[]` when `!Directory.Exists(tmp)`, so a CLAIM-ONLY leftover (an orphan claim of a folder the test removed itself, absent from the registry) is invisible once the run folder is gone. **xUnit 4.0.1 disposes assembly fixtures in creation order and all four `RunTempStart.cs` list `RunTempFixture` first, so the wrong order is today's order** (the judge: source and a two-fixture probe). Swapping the attributes is NOT the fix: it runs the real-root sweep before `RunTempFixture`'s constructor, the fail-closed fallback. The mechanism: the audit and the end of the run folder become ONE ordered call in the sweep fixture's disposal (the audit, then `RunTemp.EndOfRun` in `finally`), and `RunTempFixture.Dispose` no longer ends the run; the process-exit handler stays. It lands in `LeftoversSweepFixture.cs`'s manifest op (the fourth op's `new` text; `RunTemp.cs` and `RunTempFixture.cs` are coai's own, `LeftoversAudit.cs` is unchanged). Ending the run is a seam only the assembly fixture's own constructor sets, because the copied `LeftoversAuditTests` call that disposal directly and must not end the real run mid-suite. `RunTemp.Start` registers the process-exit handler from the module initializer, before any fixture, so a run whose sweep fixture threw in its constructor, or that was aborted before disposal, still ends its folder there; `Restore` is safe to run twice, and that is pinned. A run like that has no audit, and it has already failed or been killed. | the four C# suites' assembly fixtures | one test PER SUITE: a child run plants an orphan claim inside the run folder, absent from the registry, with no inherited `TESTSTODELETE_RUN`; the audit reports it. RED before the ordered call, shown once | **unmapped: no test today** |
| (p) NEW | `src_server/smoke-image.sh` leaves nothing on a failure before its trap | `src_server/smoke-image.sh`: `work=$(mktemp -d)` at `:73`, `trap finish EXIT` at `:102`; `mkdir`, `chmod 0777`, `seed`, `new_key`, the mask line run in between under `set -e` | `TheImageSmokeUsesTheServerTests` (a `docker` stub on PATH); the pull-request image job | move `finish` and its `trap` to right after the globals (`:70`), before `mktemp`; RED first with a failing `chmod` (or `openssl`) stub on PATH: the folder stays today, is gone after; unsolved and said so: a `kill -9` at any moment from `mktemp` to the end of the script, which no trap sees (after the move the trap stands before `mktemp`, so the window is the whole run, not a line) — the folder is a raw temp without a claim, and only the inline exemption's reason names that window | **unmapped: no test today** |
| (q) NEW | the baseline's FINAL content is validated, not only its creation | the brief § 12.4 skips the standing shrink step on PR 945 by number, so a later edit of the committed baseline on the same PR is checked by nothing. `--baseline` already reconciles entries and sites both ways, so what is open is growth AFTER the creation. `--print-baseline` cannot check this: it reads no `.cs` and prints `scopes: []` (the judge, at `bd795847`) | the creation PR | at the PR's LAST head, before the squash merge: `leftovers-check.mjs --baseline-shrinks --base <the creation commit>` exits 0, recorded on the PR, and both wrappers are green. A new site plus a new entry after the creation is refused with `new key` (measured by the judge in a private repository). It runs in a FULL clone: at depth 1 `git log --diff-filter=A` answers HEAD and a grown baseline passes (measured). S7's first PR removes the `number != 945` clause | **unmapped: no step today** |

**E2 — creds, its remaining PRs (E2.1 merge; E2.2–E2.5), from its D8 and S5:**

| # | Condition | Implementation (file) | Invocations covered | Executable acceptance check | State 2026-11-05 |
|---|---|---|---|---|---|
| E2 (c) | the barrier per machine | as E5 (c) | the WSL machine | the same scan | **OPEN** |
| E2 (d) | the legacy clean-up recorded | the six legacy-name sites migrated by E2.1/E2.2; a person's record | per machine | the record on the PR | E2.1's by-hand records are in its part 7 |
| E2.1 | the Node unit-test lifecycle, by-hand macOS and Windows records | #294 at `9a6e9fa` | `npm test`, the runner | run 2 of `tmp/e21-byhand` green (`be47183`); CI green | built; waits for (c) and this epoch |
| E2.5 sc. 2 | planted `"testsTo" + "Delete-"` in a `.cs`, a `.cjs` and a `.sh` ⇒ one finding each | the C# guard folds `.cs` only (`IsFolded`); the shipped Node guard folds nothing (F30) | the `.cjs` and `.sh` plants | — | **unmapped: cannot be met for `.cjs`/`.sh` as written; E2's revision narrows it as E5 did (item 8.3)** |
| E2.5 N6 | `${TMPDIR:-/tmp}` in `.sh` is unseen by the shipped guard (E2's own measurement) | no detector | `mcp-listen-smoke.sh:35`, `version-smoke.sh:30` | E2.4 migrates the two scripts regardless | mapped by migration, not by detection; a conventions follow-up is still open (E2's N6) |
| E2.3 | the C# copy | an ADAPTED copy with a manifest (entry 3.1; E5's D2 is the form); F29 read first | five xUnit executables | the diff check green | not started; E2's document still says "a byte copy save the five named files" (DoD) |
| E2.4 | `owned.sh` claim-first; the smoke scripts' traps | E2's S4 | bash on three OSes | the kill-between test; the trap before any fallible step (the same class as E5 (p)) | not started |

**E6 — benchmark (no stories document yet):**

| # | Condition | Implementation (file) | Invocations covered | Executable acceptance check | State 2026-11-05 |
|---|---|---|---|---|---|
| E6 stage A | the held-out sweep lists, never removes | #125 `6a963a4` | the held-out runner | its test | DONE |
| E6 pin | `bd795847` | #166 (merged 2026-11-05) | — | the pin check | DONE |
| E6 boundary | written on both sides | this plan (§ *Epoch 5* item 5); benchmark's follow-ups plan: **one mention, no table** | — | the table present in both files | **unmapped on the benchmark side** |
| E6 producer | the Testcontainers label, the per-test databases' exemption, the worktree seam, the C# adapted copy, the guard over `tests/` and `tools/` | — (no stories) | — | — | **unmapped: the stories document opens with this table filled** |

**E7 — rag_qln:**

| # | Condition | Implementation (file) | Invocations covered | Executable acceptance check | State 2026-11-05 |
|---|---|---|---|---|---|
| E7 stage A | the sampler drops nothing by name | #86 `47998e7`; promoted #87 | the daemon tick | the live check: the same count after a second run; the listing line in the log | DONE, measured |
| E7 pin | `bd795847` | #88 (open) | — | the pin check | **open, not merged** |
| E7 must-settle | `ResidentSet.MakeRoomAsync` with a budget evicts the coldest collection of the WHOLE store, owner-blind | `EvictionPolicy.cs:90-91`, `ResidentSet.cs` (read 2026-11-04) | a capped store that tests also use | a test: a test collection is protected, or tests never share a capped store | **unmapped: the stories decide** |
| E7 docs | `research/module_tests.md` exists, as `common.knowledge-base` requires | **absent in rag_qln** (checked `origin/main` `88577ff`) | — | the file exists with the harness, the command and the flow catalogue | **unmapped: a finding; E7's stories create it** |
| E7 live suite | `SearchLiveTests.AQuestionInWords_FindsTheMemberThatAnswersIt` fails in both runs | `research/module_search.md` records it | the live tests | fixed or recorded as a known failure BEFORE E7's producer makes the live tests its proof | **open; not E7's cause, E7's blocker** |
| E7 size | the growth figure | 0.2 GB measured, not 8 GB | — | the stories carry the measured figure and the `du` command | the stories carry it |

**E5's producer PR merges only when:** every E5 row above is DONE or green on the head, including (o), (p) and (q) built
with their RED first; (c) is recorded; coai's pin carries `bd795847` and the second F24 check is recorded; the rest as
§ *Epoch 5* item 3. The E5 stories document, D8, carries the same (its dated note of 2026-11-05).

### 4. The dispositions of entries 5.2 and 5.3, and the three checks the consultant added

**4.1 Row 2 — option C, now; F30 as the follow-up.** The shipped Node guard finds 2 of 15 planted spellings in a `.mjs`
(re-measured here: a split literal and a `.join('')` both answer `[]`; a whole legacy literal is `legacy-name`). So:
S6's Node test pins what the shipped guard DOES detect (a whole legacy literal ⇒ `legacy-name`; a bare-word glob that is
removed ⇒ `owner-blind`). Its RED is by hand, once: the positive test goes red against a patched copy of the guard, and the
PR records that. The PR says in one sentence what the guard does not see (the other spellings; the count depends on the line, F30's note).
The two split fixtures become plain literals with the inline `legacy-name` exemption (`scripts/lib/native-run.test.mjs:42`,
`scripts/native/native.test.mjs:506`). The by-hand split-piece scan is kept and its output recorded, labelled as what it
is: a search for the spellings a person thought of, **not a proof that no such spelling exists**. The folding reader for
Node is F30 of the follow-ups plan (an owner, an accepted date, coai and creds covered). **Rejected:** option A (a
coai-own folding check with different semantics: its findings could not carry the rule's exemption, and creds would be
left behind); option B as a PREREQUISITE (one more release before S6 for a detector the C# half already has).

**4.2 D8 (b) — inline exemptions plus the inventory, with verified reasons; the folder stays in the guard.** The 54
`raw-temp` lines of `src_vs_code/scripts/` (the brief's § 10.5, the C# guard's count; this revision counted 87 lines
with `mkdtemp` or `tmpdir()` by grep, imports included — the guard's class count is the one that binds) each take the
rule's inline form `testsToDelete-exempt: raw-temp — <reason>` and a row of the expected-exemption inventory.
**Rejected:** taking `src_vs_code/scripts/` out of the guard — that would hide every future allocation there. **The
reason must be proved, line by line, with a test or a read record in the PR**, because "contained" is a claim about the
CALLERS, not about the line:

| Line (read 2026-11-05) | What it is | What proves the reason |
|---|---|---|
| `live-agent.mjs:78-80` — three `mkdtempSync(join(tmpdir(), 'coai-agent-…'))` | a verification harness; `startOwnedRun({ what: 'live-agent' })` at `:24` moves `TEMP`/`TMP`/`TMPDIR` into its run folder first | a test (or the S4 record) that `startOwnedRun` is the first effect of every such entry script and that `tmpdir()` answers the run folder after it; the 17 other entry scripts with the same reason are proved the same way, once, by the list of entries whose first statement after the imports is the wrap (their first import is `node:fs` or the like); `src_vs_code/src/test/runnerScripts.test.mjs` E1, E2, E3 pin that today, as a standing test |
| `browserLayout.mjs:51`, `:79`; `seam-catalog.mjs:69`; the other `seam-*.mjs` lines | libraries: they allocate under whatever `tmpdir()` is when called | the reason "the entry or the test that imports it runs inside a run folder" holds only if EVERY caller does: the PR lists every importer of each library (`git grep -l`) and shows each is an entry script with the wrap or a test under the runner; one caller outside a run folder makes the line a finding, not an exemption. **So the proof does not expire at the next import, a standing test beside `runnerScripts.test.mjs` E1 fails when an importer of an exempted library is neither an entry with the wrap nor a test under the runner** (the judge's finding) |
| `run-tests.mjs:103` `REAL_TEMP_ROOT = tmpdir()`; `ownedRun.mjs:34`, `:36` | the runner reads the real root before it makes its run folder — a READ, not an allocation | a read record: the line creates nothing; the rule's "a `tmpdir` import used only to read the root is migrated, not baselined" applies — these two files are helper-own, and the reason says "reads the root; allocates nothing" |
| `src_server/smoke-image.sh:73` | a raw `mktemp -d` in the machine temp, in a test script | item 4.3: the trap moves before it, proved RED first; the folder takes an owner-form name; the exemption's reason names what stays open (a `kill -9` at any moment of the run) |
| the other inline rows, up to 22 (`deploy/**`, the installers, `release.yml`, `scripts/probe-*`, `kimi.mjs`, `Serving.cs`, `TempDir.cs`, `Owned.cs`) | not one kind: the final Opus review read them | **The brief traces each row and gives it ONE of these kinds, and the PR shows the trace.** A READ that allocates nothing, the third kind: `Serving.cs:140`, `Owned.cs:120`, `kimi.mjs:176`. `TempDir.cs:35`, which allocates on every test, is the helper inside the gated test assemblies: its proof is the gate and the forced runs of the proof files. A FOURTH kind, only for a line no test run reaches: `scripts/probe-*`, `release.yml:317`, `:1319` and the `deploy/**` lines that hold up. **It is not a read record alone: a standing test fails when a test file names a fourth-kind file, except for a pinned list of the (test file, file) pairs that exist at creation, each with one line saying why the line itself is not reached** (entry 6.1: the text is read; or the file is run and refused before the line; or it is sourced and only `canary` is called). A new pair is red, so a person reads it. Its limit, said plainly: a new spawn inside a listed test file is not seen. A line a test reaches is never this kind. **A FIFTH kind, entry 6.1: a line a test under the gate reaches, whose product caller is not a test run:** `install-cli.sh:22`, `install-agy.sh:61`, `deploy/bugs/install-env.sh:101`, `deploy/systemd-release.sh:161`. Each of those four test classes asserts, where it starts the script, that the child's `TMPDIR` is inside `RunTemp.Folder` (new code of S6; RED by hand, once, for one class). A person's run of those scripts through the product caller is not covered: it is not a test run. The C# guard's frozen exclusion list binds the C# guard only: the released Node guard reports `raw-temp` on all 11 lines it lists (measured, exit 1), so those lines keep the marker for the Node guard |

D8 (b) reads, from this epoch: "zero unexempted `owner-blind` and `legacy-name`; only the authorised `raw-temp` baseline
and the inline `raw-temp` exemptions of the expected-exemption inventory are left, each exemption with a reason proved
as above; the inventory equals the guard's exemption list exactly, and each row holds the sha256 of its site's trimmed line, not the marker's, as the baseline does, so a line cannot change under its marker". **Narrowed: yes** covers this and 4.1.

**4.3 `src_server/smoke-image.sh` — the trap before `mktemp`.** `finish()` and `trap finish EXIT` move to right after
the globals line (`work='' id='' logs_pid='' ok=false`, `:70`), before `work=$(mktemp -d)` (`:73`); `finish` already
tolerates empty globals. RED first: `TheImageSmokeUsesTheServerTests` gains a case with a failing `chmod` (or `openssl`)
stub on PATH — today the folder stays (the script exits under `set -e` before `:102`), after the move it is gone. What
stays unsolved and is written in the exemption's reason: a `kill -9`, or the hard kill that ends a CI cancel, at any
moment from `mktemp` to the end of the script; the folder then carries no claim. **So the folder takes an owner-form name** (`owner="u$(id -u)"`, then `mktemp -d "${TMPDIR:-/tmp}/testsToDelete-$owner-coai-smoke-XXXXXX"`, two lines (a literal `testsToDelete-u` is a `legacy-name` as well as a `raw-temp`, measured at `bd795847`; with the variable the guard reports `raw-temp` only); the coordinator's decision on the judge's finding): the janitor then lists a killed run's folder as `unmarked`, for a person to read, and never removes it. This is the goal's second bounded exception. No trap sees that signal, and after the move the trap stands before `mktemp`, so this window is the whole run,
not one line (*[the judge, 2026-11-05]*: the text said "one shell line wide"; a person's run is the case, as a test's
run has `TMPDIR` in its run folder and a hosted runner is discarded). A shell port of the helper is not asked for.

**4.4 The audit runs BEFORE the run folder is removed.** `LeftoversAudit.Discover` returns `[]` once the run folder is
gone (`LeftoversAudit.cs:41`). The registry still reports a leaked `OwnedDir`, but a CLAIM-ONLY leftover — an orphan
claim whose folder a test removed by hand, never registered — is seen only by `Discover`. The brief's § 11 claim that
the fixture order does not matter is therefore not established. S6 plants exactly that orphan claim inside the run folder,
absent from the registry. Today's order misses it (the judge, by xUnit's source and a probe; row (o) of item 3). The fix is the ordered call of row (o), not swapped attributes, and one test per suite pins it. **Deferred: detector
expansion. Not deferred: containment and the audit's proof.** S7 drains contained debt; it does not discover whether
containment works. Before merge, as before: owner survival, fail-closed start, discovery coverage (a scan of nothing is
red), baseline reconciliation, and REAL audit failures. **Disposition of a leak the audit exposes: it is fixed in the
test that made it before the PR merges; the audit is never weakened and no entry is added to skip it; each one found is
recorded in `module_tests.md`.**

**4.5 The baseline's final content.** The brief's § 12.4 makes the creation PR skip the standing shrink step by PR
number; after the temporary creation step is removed, nothing on that PR compares the committed file with the tree.
S6 adds, at the PR's LAST head before the squash merge: `leftovers-check.mjs --baseline-shrinks --base <the creation commit>` exits 0, recorded on the PR, with both wrappers green (row (q) of item 3: `--print-baseline` reads no `.cs` and prints `scopes: []`, so it cannot do this; `--baseline` already reconciles entries and sites, and what is open is growth after the creation, which the shrink check refuses with `new key`). The standing
`--baseline` runs (N1, the C# wrapper) stay as they are. This narrows nothing; it is a check the plan lacked.

**4.6 Entry 5.1, for the record.** The Windows mutex is built and kept (`SweepLock.cs`, three manifest ops, strict
tests, RED first). It changes the template's text by an op, so F29 carries the report to the template's owner; E2.3, E6
and E7 read F29 before they copy. Nothing of 5.1 is narrowed.

**4.7 What must change in the S6 brief** (`todo/PLAN_test_leftovers_E5_S6_brief.md`, `6b3f143e`; an Opus author
revises it after approval; this revision does not edit it):

1. § *Decisions* — the five answers are written: 1 = C (strike § 7.4's `foldedPrefix.mjs` and rows R3/N8; N8 becomes the
   positive test of 4.1 and the one sentence of what is not detected); 2 = inline exemptions with the proof per line of
   4.2 (not "the smallest option" alone); 3 = kept, with 4.5 added; 4 = kept; 5 = REPLACED by 4.3 (the trap moves, RED
   first; the exemption's reason names the kill window, not "its EXIT trap removes this folder").
2. § 10.5 — the reason column gets a fourth column, "proved by", per 4.2's table; the libraries' rows name their callers.
3. § 11 — "the disposal order of the two assembly fixtures must not matter either" and the table row "`RunTempFixture`
   disposes first … a leak is still red" are corrected: a claim-only leftover is NOT red in that order; the orphan-claim
   plant of 4.4 is added, per suite, and the order is the ONE ordered call of row (o): the audit, then `RunTemp.EndOfRun` in `finally`, in the sweep fixture's disposal; `RunTempFixture.Dispose` no longer ends the run. Its self-test runs on all four suites, not on `CoaiMcp.Tests` only.
4. § 12.4 — the final-content check of 4.5 at the last head, recorded: `--baseline-shrinks --base <the creation commit>`, not a print and a diff.
   Also: every inline row is traced to one of the kinds of 4.2 and holds the sha256 of its SITE's trimmed line (not the marker's; § 7.3's `line` is the marker's today), the standing importer test of 4.2 is added, `smoke-image.sh` takes the owner-form name of 4.3, and § 18's row (d) follows the parent: the per-machine record is a condition.
5. § 9.2 — unchanged in substance; it says the two fixtures were invisible to the shipped guard (F30), not only "a
   prefix built from pieces is a defect".
6. § 16 — runs after coai #947, not "after the pin carries `bd79584`" in the abstract; the C# proof-check test it names
   is new code of S6 and is listed in § 5 *Files*.
7. § 18 (the DoD) — the rows for (o), (p), (q) of item 3; the Node half of row 2 as narrowed; the S7 note that "the two
   baseline files" is one file with scopes.
8. § 21 *Assumptions* — items 2 and 8 (Decision 1's option A) are removed; F30 is cited; § 5's `foldedPrefix.mjs` row
   and § 18's N8 and R3 cells go with item 1. (*[the judge, 2026-11-05]*: this item quoted a sentence § 21 does not hold.)

### 5. Build order (revised)

```
DONE   as § Epoch 5, item 5 → epoch 5 approved (#126) → entry 5.1 on #945 (the Windows mutex; F29 #129) → S4 on #945
       → E7 stage A (rag_qln #86) and its live check (#87) → F24's first acceptance run → the release bd795847
       (F3 + F24 + #130) → S5 on #945 (524df50e) → the S6 brief (local) → the stop of epoch 5 (entries 5.2, 5.3) and
       this re-review.
NEXT   the owner approves epoch 6 (question 1)               — nothing of this plan merges before it
       the pin bumps to bd795847 merge, each alone            — in flight; coai #947 before S6; rag_qln's is still to open
       the WSL administrator scan (condition (c))             — the owner; one command; blocks E2.1's and E5's MERGE
       the S6 brief revised by an Opus author (item 4.7)      — before S6's code
       E2.1 (creds #294) merges after (c)                     — then E2.2 → E2.3 → E2.4 → E2.5, each with ITS table
                                                                (item 8.2) in its brief before its plan gate
       E5 producer PR (coai #945) — one squash merge, S3 ✓ → S2-B ✓ → S4 ✓ → S5 ✓ → S6:
          S6   after #947 and the merge of main: F24's second check (brief § 16) → the trap move (4.3, RED first)
               → the orphan-claim plant and the ONE ordered call (4.4) → the guards' wrappers, the one baseline file
               with its scopes, the expected-exemption inventory with the proof per line (4.2), the positive Node
               detection test and its one sentence (4.1), the planted violation per root → the one creation → the
               the shrink check against the creation commit at the last head (4.5) → the squash merge
          after (c) and the gates → E5.S7 the drain (contained debt only)
THEN   wave 3: E6 ∥ E7, as § Epoch 3; each stories document OPENS with item 3's table filled for its epic (item 8.2);
       E6's boundary written on the benchmark side first; E7's stories create research/module_tests.md, settle the
       ResidentSet eviction and the failing live test, and carry the measured 0.2 GB.
LAST   the coai feature review; the promotion of this plan and its stories documents; R6 ticked in the remainder plan.
```

### 6. What the re-review consultant raised, and what was done with it

| Point (consult `7f55e578`) | Verified | Taken |
|---|---|---|
| (a) Root cause: approval precedes integration discovery; before reopening, ONE table mapping each remaining merge condition to its implementation, paths and executable check; an unmapped row is a design decision | yes — each of the four stops came from a build brief (S3, S4, S6 twice) that found the named mechanism does not fit the tree | yes — item 3 (E5, E2, E6, E7); item 8 makes the table a step of every story's brief |
| (b) 5.2: option C now; positive tests for what the shipped guard detects; say what it does not; fix the two split fixtures; option B as F-number with an owner and a date, coai and creds; reject A | yes — `scanText` answers `[]` for a split literal and a `.join('')`, `legacy-name` for a whole literal; the fixtures at `native-run.test.mjs:42`, `native.test.mjs:506` | yes — item 4.1; F30 in the follow-ups plan (this branch); E5's row 2, D6 and S6 revised |
| (c) 5.3: inline exemptions plus the inventory, verified reasons; reject removing the folder from the guard; "contained" must be proved through every allocating library's callers; D8 (b) reworded; Narrowed: yes | yes — `live-agent.mjs:78-80` under `startOwnedRun` (`:24`); `browserLayout.mjs:51`, `:79` and `seam-catalog.mjs:69` are libraries; `run-tests.mjs:103` and `ownedRun.mjs:34`, `:36` only read the root | yes — item 4.2, the record's line |
| (d) `smoke-image.sh`: `finish` and its trap before `mktemp`; RED with a failing `seed`/`chmod` stub; say what stays unsolved (a kill) | yes — `mktemp` at `:73`, `trap` at `:102`, `mkdir`/`chmod`/`seed`/`new_key` between, under `set -e`; the test drives the script with a stub on PATH | yes — item 4.3; condition (p) |
| (e) keep S6's runtime barrier; defer detector expansion, not containment or audit proof; S7 drains contained debt; a leak the audit exposes is fixed before merge | yes — the brief's § 11 already says "never weaken the audit" | yes — item 4.4's disposition, written |
| (f) § 11's "order does not matter" is not established for claim-only leftovers: `Discover` returns `[]` once the run folder is gone; plant an orphan claim, run both orders, order the audit first if needed | yes — `LeftoversAudit.cs:41` | yes — item 4.4; condition (o) |
| (g) § 12.4 must validate the FINAL baseline content; the standing check is skipped on PR 945 after the temporary step goes | yes — the brief's `if: … number != 945` on the standing step | yes — item 4.5; condition (q) |
| (h) Narrowed: yes applies to C and the inline exceptions; the trap order, the audit order, the final-content check and the repaired references narrow nothing | agreed | the record's line says exactly that |

Nothing the consultant raised was rejected. Not taken from it: nothing. Added by this revision beyond it: the E2, E6
and E7 tables of item 3; the rag_qln `module_tests.md` finding; item 8.

### 7. Questions for the owner (blocking; each with the recommended answer; they go to the question consultants first)

1. **Approve epoch 6 as narrowed?** The record says `Narrowed: yes`: row 2's Node half pins what the shipped guard
   detects (2 of 15 spellings) and the rest is F30, which reaches every Node consumer's reading of the Definition of Done; D8 (b) admits up to 77 inline `raw-temp` exemptions of the inventory,
   each with a proved reason (a fourth kind for lines no test run reaches, kept true by a standing test); the goal gains a second bounded exception (a killed `smoke-image.sh` leaves one owner-named folder); E5's S7 ends with those rows still standing. *Recommended:* yes — the barrier is intact (owner survival, fail closed, discovery
   coverage, the audit with teeth, the baseline reconciliation), the Node detection gap is the C# template's E4 defect
   in the shipped tool and has an owner and a date, and the alternative (a coai-own detector) would make a finding
   nobody can exempt and leave creds behind.
2. **The WSL administrator scan** (merge condition (c)) — unchanged: `sudo node tools/sweeper-scan.mjs --system`
   once, the output into `research/security/machines.md`. *Recommended:* run it; it is the last barrier item between
   E2.1 and its merge, and between E5's producer PR and its merge.
3. **F30's owner and deadline.** The conventions repository as the owner; the proposed deadline **2026-11-19**, or
   before creds' E2.5 merges if earlier. Until then every Node compliance declaration says "zero whole literals, F30
   open". *Recommended:* accept the date; a release of the guard alone is one PR here and pin bumps alone.
4. **E7's pin bump** — the seventh over-cap bump (rag_qln) is agreed but not opened. *Recommended:* open it with the
   others; E7's stories start after it. *[the judge, 2026-11-05]* Opened since: #88.

**The owner's answers (2026-11-05, asked once, after the question consultants, consult `a96c990f`).**

1. Epoch 6 is APPROVED as narrowed. What the owner was shown: Node files get no split-spelling detector for now, so the Node zero means "zero whole literals" for every Node consumer until F30 ships; "only the baseline is left" becomes "the baseline plus inline exemptions", at most 77 lines, each with a proved reason and kept true by standing tests; those inline rows stay after S7 ends, permanently; a `kill -9` of `smoke-image.sh` leaves one owner-named folder per killed run, which cleanup lists and never removes. **77 is a ceiling, not an allowance**: the inventory's count at creation binds, and a row only goes away after that.
2. The WSL administrator scan is still the owner's to run.
3. F30's date of **2026-11-19** is ACCEPTED, or before creds' E2.5 merges if that comes first. Nothing enforces it automatically; this plan records it, and the session that runs this plan tracks it. It is no longer "proposed" in the text above.
4. Rag_qln's bump is merged (#88). **The nine pin bumps merged during the stop: the owner agrees with the reading**, that pin bumps a release caused may merge during a stop because they are not epic code and only end the red pin checks. The owner was told that the stop rule does not name them and that one consultant read its silence as no authorization. This holds for this case; it does not edit the rule.

### 8. The way of working — so a fifth stop becomes less likely

**8.1 What changes, and what is dropped because it proves nothing.** The four stops share one shape: the plan named a
mechanism (a byte-identical copy; three CI legs with the same counts; an owned folder for a durable series; a folding
reader in the Node guard; a baseline scope for a folder with no test file) and a build brief found it does not fit the
tool, the tree or the CI. Each was approved first and checked after. From epoch 6:

- **A story's build brief opens with item 3's table for that story** — each merge condition and each promised test of
  the story mapped to the file that implements it, the invocations it covers and the command that checks it, read
  against the tree at the pin, BEFORE the brief's plan gate. A row the author cannot fill is a question to the
  coordinator in the brief's Decisions section (as the S6 brief did), raised before the gate — a change found there is
  still an entry, but it is found before approval, not after.
- **A test that cannot go RED is not written as a RED-GREEN-RED row.** Dropped: the twelve `.mjs` spellings "RED when
  the folding reader is off" (there is no reader to switch off); kept as a positive test plus one sentence of what is
  not detected. Dropped: the two baseline FILES' only-shrinks tests (the released rule has one file with scopes); kept
  as the one file's tests. Nothing of the barrier is dropped.
- **A by-hand scan is recorded as a search, never as a proof.** The split-piece scan says which spellings it looked for.
- **"Contained" is proved through the callers**, as 4.2 says, not asserted per line.
- **The owner's wish is met so:** no new gate, no new document; the table is one section of a brief that is written
  anyway, and the plan-gate reviewers read it instead of guessing the fit.

**8.2 Which remaining stories are likely to hit the same class of surprise.** In order of likelihood:

| Story | The surprise it is likely to meet | Why |
|---|---|---|
| E2.5 (creds, the two guards) | S5 sc. 2's `.cjs` and `.sh` plants cannot be findings (F30); N6's `${TMPDIR:-/tmp}` is unseen; the C# guard's folding allowance for the Node wrapper file | the same tool gap as entry 5.2, written into E2's D9 row 2 as "the shipped Node guard reads the same way" |
| E2.3 (creds, the C# copy) | the DoD still says "a byte copy save the five named files" — entry 3.1 made every copy an ADAPTED copy with a manifest; F29's Windows mutex op is on the template's text | the same class as entry 3.1 |
| E2.4 (creds, bash, the smoke scripts) | the trap after fallible work (`mcp-listen-smoke.test.sh:19` and `version-smoke.test.sh:14` have `rm -rf` and no trap; E5's `smoke-image.sh` had the trap after `mktemp`); bash 3.2 on macOS | the same class as condition (p) |
| E2.2 (creds, the harnesses) | harnesses that keep run folders away from the temp root on purpose (the two WSL harnesses) need an invocation inventory line each, as E5's series did | the same class as entry 4.2 (a durable resource outside the family) |
| E7 (rag_qln) | no `research/module_tests.md`; the `ResidentSet` eviction; the failing live test; Qdrant's naming for the prefix; the C# adapted copy and F29 | the stories are not written; the store sweep lives in product code |
| E6 (benchmark) | the boundary missing on the benchmark side; the Testcontainers label and Ryuk; `ScratchWorktree`'s seam in product code; stage A's age removal of un-prefixed `score-tmp/*` (an open question since epoch 2); the C# adapted copy and F29 | the stories are not written |

**8.3 What the other documents' own revisions must say** (read, not edited here; each is its own plan-gate work):

- **E2** (`dew_flow_creds_for_devs · todo/PLAN_test_leftovers_E2.md` at `9a6e9fa`): D9 row 2 — the shipped Node guard
  does NOT read split spellings (F30); S5 sc. 2's `.cjs` and `.sh` plants become the positive test of what the guard
  detects plus one sentence, as E5's 4.1; the DoD's "byte copy save the five named files" becomes the adapted copy with
  a manifest and a diff check (entry 3.1), and E2.3 reads F29 before it copies; S4's bash scripts set their trap before
  any fallible step, with a RED test (E5's 4.3); E2.5's `docs.yml` guard step says "zero whole literals, F30 open" until
  F30 ships; every E2.2–E2.5 brief opens with item 3's table. E2's audit runs in the PARENT after `node --test` returns
  (its D9 row 1), so E5's 4.4 order question does not arise there in the same form; its revision says so.
- **E6** (no document yet): the stories document opens with item 3's table filled; the boundary with
  `todo/PLAN_bench_test_leftovers_followups.md` is written there FIRST (a docs PR in benchmark); the C# copy is an adapted
  copy with a manifest, reading F29 and entry 5.1; the Node guard's F30 limit is cited; the `score-tmp/*` age removal is
  settled (retire or make owner-aware) before any producer.
- **E7** (no stories document; stage A promoted): `research/module_tests.md` is created in E7's first PR (the rule
  requires it of every repository); the `ResidentSet` eviction is settled with a test; the failing
  `SearchLiveTests.AQuestionInWords_FindsTheMemberThatAnswersIt` is fixed or recorded as known before the live tests
  become E7's proof; the growth paragraph carries 0.2 GB measured (`du`), not 8 GB; the C# copy as E6's; F30 cited.

## Epoch 7 — the plan as revised at the re-review (2026-11-05)

The whole plan read again against what is known now, as step 4 of the full stop asks (`common/plan-change-control.md`),
over the two entries of epoch 6: 6.1, the kinds of reason for the inline `raw-temp` exemptions; 6.2, the orphan-claim
plant on the elevated hosted Windows runner. The re-review consult is `dd79d0aa` (the question consultants before it:
`ee497a76`). It is advice, and each point was checked against the files (item 6). This section is the baseline epoch 7
is approved on. § *Epoch 6* stays as the plan for everything this section does not name. § *Epoch 7* is short because
one fact changed: it supersedes § *Epoch 6* item 3's rows (o) and (p), the goal's killed-run sentence for an elevated
Windows run, and the S6 brief's § 11.3, § 11.4 and § 19 rows named in item 4.

### 1. What this plan is now

**The one fact (measured).** On the elevated hosted Windows runner a new file AND a new folder are owned by
`BUILTIN\Administrators` (`S-1-5-32-544`), not by the caller's SID (`…-500`): `ci.yml` step 0, run 42026897727, job
127243250229. `Scope.WindowsIsMine` asks for the caller's SID (`Scope.cs:73`). The helper makes its claim with a plain
`FileStream` (`OwnedDir.cs:87`), so a real claim and a real folder of that run read as a stranger's. Two things follow:

1. **The audit.** Its claim scan cannot name a real orphan claim there, or an unregistered folder with its claim (`LeftoversAudit.cs:58`). The copied source says so (`LeftoversAudit.cs:10`),
   and the template's plan says so (`dew_flow_mcp · research/PLAN_test_leftovers_E3.md`). The registry check still sees a
   registered folder: the PowerShell audit step is green on hosted Windows for both of its values (throwaway run
   42031613818, job 127259212955).
2. **The sweep.** A real folder of a killed run on that runner is kept as `foreign-uid`: the sweep asks the owner before
   liveness (`LeftoversSweep.cs:276-277`), and `Scope.cs:27-28` says so. B4 logs that answer for a real run folder
   (`StartOfRunSweepTests.cs:79`), and `On_windows_a_folder_that_is_not_the_callers_…` (`LeftoversSweepTests.cs:609`) keeps a
   prepared one. No test contradicts this, because a test on Windows that asserts collection either re-owns its fixture
   (`RunTempGateTests.cs:258-263`, `LeftoversSweepTests.cs:585-597`) or hands in an owner seam. So those green tests prove
   collection of a prepared fixture, not of a real run's leftovers.

**What this costs in practice.** Two things. (1) On a PR's Windows leg (`windows-latest`, the only one) the audit's claim scan sees nothing; only its
registry half works there (`ci.yml` step 0 is red if the runner is not elevated). So an unregistered claim or folder does
not turn a Windows leg red; Linux and macOS still catch one a test makes on every OS. (2) What a run leaves in an elevated
process, killed or not removable at its end, waits for a person. On a hosted runner nothing stays, because the machine ends
with its job. The owner's Windows machine runs no E2 or E5 tests, by the owner's statement (#124, "temporarily we do not
test on Windows"), until those repositories run there again; a person who runs a suite in an elevated Windows shell gets the
limit. The exception also reaches E6 and E7 when they copy the helper. By reading, not measured: a shell that is not
elevated, with its temp folder inside the profile, is not affected. Step 0 shows `windows-latest` is elevated; the arm
runner of a release (`windows-11-arm`) is not measured.

**State at the stop (read 2026-11-05).**

- **E5.** Coai #945 (draft) at `bde2e16c`, its code at `3fcba8a0`: S3, S2-B, S4, entry 5.1, S5 and S6 except what item 5 lists. Local counts and
  the run on `b29c00c7` are in the coder's draft section (`docs/e5-s6-section-at-stop6`, a copy). Linux, macOS and
  actionlint are green; Windows has one red, the plant; the only other red was F4, by design, and the temporary step that
  caused it is removed at `3fcba8a0`. The audit, now on, found no leak in any suite; on Windows only its registry half looked. The baseline holds 778 entries (the
  brief's 776 counted two lines as leaving that keep a `/tmp/…` literal, `ApiRuntimeTests.cs:28` and `LocalRuntimeTests.cs:131`; the count at creation binds), the inventory 112 rows (77 `raw-temp`), `namedBy` 28
  pairs (24 in the brief; E10 found four more, by the brief's own § 10.6 rule). The creation commit for (q) is `14370fdd`.
- **Release and pins.** `release` = `bd795847`; every consumer's bump is merged, rag_qln's as #88 (`9852c1f0`). Coai
  `main` = `ae52bd55`; #945 needs one more merge of `main` before its last head.
- **E2.** Creds #294 (draft) unchanged at `9a6e9faf`. **E6, E7.** Not started past their stage A. Benchmark holds an old
  draft of E6 stories, #103; E6 reads it before it writes its own (item 8.3).
  *[2026-11-06: E2.1 merged as creds #294 at `834c91b`, after condition (c) and CodeRabbit's second review ([E2.1 review 8-10]: a zombie survivor has ended; six tests no longer depend on the real scan on macOS). E2.2 is next. F30 released in `37b9aa5`.]*
  *[2026-11-07: E2.2 merged as creds #310 at `bf59e4f` (entry 7.1's shared harness exit module; four code rounds, two Opus reviews, a hosted macOS run). E2.3 started on `feat/test-leftovers-e2.3`: F31 raised with the owner and accepted again; F29 read (the template's mutex fix did not happen; creds' copy records the limit). Coai E5 (#945) merged main after the coai release; main's new sites were migrated in E5.]*
  *[2026-11-07: E2.3 merged as creds #311 at `0ae0211` (the C# helper as an adapted copy, 52 files and 76 ops; every C# test site owned; every test executable leaves 0 entries in a private TMPDIR, against 26 top-level and 956 below on main; one plan gate, a risk consult, an Opus review and fix round per story, the code gate; no plan change). Coai E5's producer PR merged as #945 at `825504e`. E2.4 is next.]*
- **The conventions tree.** F27 merged as #133 (`e45ad11`), by the peer session, outside this plan's epics.
- **The owner's open item is unchanged:** merge condition (c), the WSL administrator scan.
  *[2026-11-06: DONE. The owner ran it: none found, 266 files read, nothing unreadable. Recorded in
  [research/security/machines.md](../research/security/machines.md). Condition (c) is met for the WSL machine, and row (c) of
  § *Epoch 6* item 3 is read as met. This is the condition coming true as written, not a plan change; epoch 7's count stays 0.]*

**Goal.** The goal of § *Epoch 6* stands word for word, with **one more bounded exception** (the owner approves it with
item 7): a run on Windows in an ELEVATED process makes folders and claims owned by `Administrators`. What such a run
leaves, because it was killed or because a folder could not be removed at its normal end, is removed by no sweep and no
janitor, because it reads as a stranger's under rule §4's two keys. The audit's claim scan does not name it either, unless
the folder is in the registry. It waits for a person. The goal's "collected later: by a C# sweep that checks both keys, by the janitor
once F9 arms it there, or by a person" is read with this: for an elevated run only the person remains. No rule key is
weakened to change this; rule §4 is what keeps a folder of another account safe.

**Definition of Done, read for epoch 7** (the list is not edited): the line on Windows sweeps is read with the exception
above. Nothing else of the list changes.

### 2. Prerequisites

As § *Epoch 6* item 2, with these states: item 2's release and pin steps are DONE, and the second F24 check's Node half
is DONE (issuecomment-6656216417), its C# half to be posted from S6's record. (c) stays OPEN. F30 stays not a
prerequisite, deadline 2026-11-19.
*[2026-11-06: (c) is DONE, item 1's note and [research/security/machines.md](../research/security/machines.md). The sentence above is the state at approval.]*

### 3. Merge conditions

§ *Epoch 6* item 3's table stands, with the three rows below replaced. **Where a check prepares or substitutes something,
its row now also says what real-run behaviour it does not prove** (item 8.1); that column is filled for these three. The
other rows state their condition as before, and the table's "State" cells are read with item 1 of this section.

| # | Condition | Implementation (file) | Invocations covered | Executable acceptance check | What the check prepares, and what it does not prove |
|---|---|---|---|---|---|
| (o) | The audit runs BEFORE the run folder ends, on every leg of each suite. A claim the caller's SID owns, absent from the registry, turns the run red | The ONE ordered call (`LeftoversSweepFixture.cs`, the fourth manifest op); `LeftoversAudit.Discover`; the plant `OrphanClaimChild` in four suites; `WindowsOwnership.OwnedByCaller` on the plant on Windows | `CoaiMcp.Tests` and `CoaiServer.Tests` on three legs; `CoaiBench.Tests` on Linux and macOS; `CoaiBugs.Tests` on Linux (D8's table) | Each suite's `--filter-method "*AnOrphanClaim_IsReportedByTheAudit*"` green on the head; R16's RED shown on Linux, and once on hosted Windows with the old order (a throwaway run). The pin shows as PASSED, not skipped, in the Windows log | On Windows the plant re-owns its claim, and asserts `Scope.IsMine` of it, so the child fails loudly if the profile key does not hold. It does NOT prove that a real claim of an elevated run is seen: it is not. `AnUntouchedClaim_StaysUnseen_OnAnElevatedWindowsRun` (`CoaiMcp.Tests`) pins that limit. It does not prove WHO removes the claim: the final empty-root assertion cannot tell the audit from the end of the run. `A_run_that_left_a_folder_…` proves the removal, with the owner seam |
| (p) | `src_server/smoke-image.sh` leaves nothing on a failure before its trap | As § *Epoch 6*: built, `47c04724`, RED `f1d7e122` | `TheImageSmokeUsesTheServerTests` where `CoaiServer.Tests` runs whole: Linux and macOS in a PR; both Windows runners at a release (`release.yml:860`). The PR's `windows` job runs only `*RunFolderTests` of that executable (`ci.yml`) | The test green on the two PR legs | A `chmod` or `openssl` stub stands in for the failure. No PR gate proves it on Windows: one throwaway probe did (5 of 5), and a release will. The script's real use is the Linux image job |
| (k) | The suite × OS merge gates, as § *Epoch 6* | `ci.yml` | each cell with a step | every cell green on the head, including the steps after `Test` in the `windows` job, which have never run in that job (they were skipped in 127243250229) | On Windows B4 and B5 keep a run folder by the owner key, not by liveness, and by reading R4 (`LeftoversCoaiLayoutTests.cs:79`) cannot go red there for the same reason. So the liveness half of those proofs comes from Linux and macOS |

### 4. The disposition of entry 6.2

1. **The plant.** It stays in all four suites, with the brief's assertions. No skip. On Windows the child sets the planted
   claim's owner to the caller (`WindowsOwnership.OwnedByCaller`: WRITE_OWNER, no privilege), BEFORE discovery, and asserts
   `Scope.IsMine(claim)`. Reversing the order must still make it red: one throwaway Windows run shows that. No product
   file and no copied template file changes for this.
2. **The pin of the limit.** One new test in `CoaiMcp.Tests`, `AnUntouchedClaim_StaysUnseen_OnAnElevatedWindowsRun`: the
   same child with no re-owning, on a Windows process that is elevated (skipped elsewhere, saying why). The child exits 0.
   It also makes one `_owned.Dir` the natural way and asserts that neither the folder nor its claim is `Scope.IsMine`. So the
   limit is a fact a run checks. When F31 changes the helper, that assertion goes red and the text is read again.
3. **F31**, a new follow-up in `todo/PLAN_test_leftovers_merged_core_followups.md`: on an elevated Windows run the audit's
   claim scan and the sweep's collection share one blind spot. Owner: this repository, for the template and the rule.
   Reviewed at item 7's trigger; not a prerequisite of any PR here. It lists the shape to weigh (the helper re-owns what it makes) and what
   must not change (a folder of another account stays safe).
4. **The brief.** § 11.3's row, § 11.4's child, the new test, R16's RED, § 19's rows on the plant and on the smoke stub
   are revised with this section, on the producer branch. The E5 document's goal, D8 (o), must-not-copy row 6 and its S6
   box say the same. S6's remainder corrects the comment at `RunTemp.cs:22`; `Removal.cs:33` is a copied file, so F31 names it.
5. **Entry 6.1 stays as built.** The judge reads the five kinds and the 28 pairs against the tree.

### 5. Build order

Unchanged in its order (§ *Epoch 6* item 5). What is left of S6 once epoch 7 opens, on `feat/test-leftovers-e5-producer`,
in this order: (1) item 4.1 and 4.2, with the throwaway Windows RED; (2) `research/module_tests.md` § E5 S6 from the draft
copy, and `todo/README.md`; (3) a merge of `main`; (4) every job green on the head, Windows included; (5) the F24 C# comment,
(q) at the last head, the PR description's evidence lines for (a) to (q) and D11's rollback; (6) the code gate and an Opus
review of the delta; (7) merge when (c) is recorded. Then E5.S7, E2.1, and wave 3.

### 6. What the re-review consultant raised, and what was done with it

| The point | Checked | Done |
|---|---|---|
| Narrowing only (o) is not enough: the same fact limits killed-run recovery | True: step 0's printed owners; `Scope.cs:73`; every Windows collection test re-owns first | The goal's exception in item 1; F31 names both |
| The table connected promises to files and commands, but not fixture preparation to real behaviour | True: step 0 measured the owner, `LeftoversAudit.cs:10` said the limit, and a test already compensated, all before this stop | Item 8.1, one sentence and one trace |
| No second direct contradiction among (a) to (q) comparable to (o) | Read for (e), (j), (k), (l): none claims natural collection. The judge reads again | Recorded |
| The brief's § 19 says the smoke stub runs in the `windows` job; `ci.yml` runs only `*RunFolderTests` there | True (`ci.yml`, step `Run folder — Team server`) | Row (p), item 4.4 |
| Re-own before discovery; ownership alone does not meet the profile key | True: `Scope.cs:73-79` asks both. `RemoveCapturedClaim` re-reads through the same predicate | Item 4.1's assertion |
| Prove the order red, the untouched claim unseen, a registered leak still red, and say who removes | Registered leak: the PowerShell audit step. Removal: the template's test | Row (o), items 4.1 and 4.2 |
| The follow-up should cover audit visibility and sweep recovery | True: one predicate | F31 |
| Carry the limit into E2.3, E6 and E7 | Their tables do not claim more, but their documents do not state it | Item 8.3 |
| The judge's C1 to C9: a wrong citation, the exception too narrow (a normal end that could not remove; an unregistered folder), the E5 document's goal and row 6, the § 19 pin row, row (p) and row (k), F31's "for the audit only", the brief's status, the pin's gates | Each read against the file | Applied to this section, the E5 documents and F31 (2026-11-05) |
| The final Opus read: item 7 understated the cost (every Windows CI leg audits less), the pin would not have gone red under F31 (the child's claim is not the helper's), an unmeasured sentence on shells that are not elevated, the row count, two comments | Each read against the file; the child built in all four suites with warnings as errors, 0 errors | Applied to this section, F31 and the brief (2026-11-05). Row (p)'s Windows filter stays as it is: the script's real use is Linux |

### 7. Question for the owner (answered below)

Approve the narrowing: on an elevated Windows run, what a run leaves (killed, or not removable at its normal end) waits for
a person; the audit's claim scan sees nothing on a PR's Windows leg (`windows-latest`), so an unregistered claim or folder
does not turn that leg red; and condition (o)'s plant proves the audit's order on Windows with a re-owned claim, the limit pinned by a test and
F31 written. Recommended: yes.
Its cost is item 1's paragraph *What this costs in practice*. F31 is reviewed, and either fixed or accepted again by the owner, at the first of: E2.3 starts (the next copy of the helper), a suite is to run on a Windows machine that persists, or 2026-12-05 (consultants `30fab21d`: a follow-up with no trigger is where a gap stays; the strongest reason against accepting is the lost signal on Windows CI, not the leftovers). Nothing enforces it; this session tracks it. The other answer is to fix the helper first (F31 as a prerequisite). That changes the
template, the Node reference and coai's unmerged copy (E2.3, E6 and E7 have not started theirs), before E5 can merge. No CI
leg leaves anything behind in this state, but that Windows leg audits less because of it.

**The owner's answer (2026-11-05, after the question consultants `30fab21d`):** approved as recommended, with F31's review
trigger. Epoch 7 opens `by owner`.

### 8. The way of working

**8.1 One addition to § *Epoch 6* item 8.1, and nothing more.** The table caught what files and commands implement a
condition, and missed this because a row could say "green on Windows" while the test had prepared what the real run does
not make. So: **each row says what its check prepares or substitutes, and what real-run behaviour it therefore does not
prove. For a row that reads ownership, one resource made the natural way is traced through the reader before the row is
approved.** No new document and no new gate. The same words apply to entry 6.1's lesson: naming a file, reaching a line
and containing what it allocates are three kinds of evidence.

**8.2 The surprises still likely.** § *Epoch 6* item 8.2's table stands. Add one row: any C# copy in E2.3, E6 or E7 inherits
this limit, and any test in it that says "collected" on Windows re-owns first.

**8.3 What the other documents' own revisions must say**, in addition to § *Epoch 6* item 8.3: E2.3, E6 and E7 state this
goal exception where they copy the C# helper, and each brief's table carries the new sentence. E6 reads benchmark's draft
#103 before it writes its stories; that draft predates the owner form.

## Epoch 8 — the plan as revised at the re-review (2026-11-07)

The whole plan read again against what is known now, as step 4 of the full stop asks (`common/plan-change-control.md`),
over the two entries of epoch 7: 7.1, E2.2's harness exit pattern (built and merged); 7.2, E2.4's container and volume
names against the released guard. The re-review consult is `ba518e5d` (codex); the question consultants before it:
`78b3ed74`. It is advice, and each point was checked against the files or by a run (item 6). This section is the
baseline epoch 8 is approved on. § *Epoch 7* and § *Epoch 6* stay as the plan for everything this section does not name.
Superseded by this section, read from here: § *Epoch 6* item 3's E2, E6 and E7 tables (item 3 below replaces them; the
rows (o), (p), (k) of § *Epoch 7* item 3 are met and stay as the record); the example spelling of creds' D5
(`testsToDelete-${OWNER}-creds-…`) and § S4's sentence that the shipped guard accepts it (item 4.2); "F30 open" in every
Node compliance reading (item 1).

**How to read the evidence.** **[M]** marks a statement measured for this revision, read-only, with the command in item 3.2.
**[D]** marks a statement taken from a document, with the document named. A statement with neither mark is a decision of
this revision.

### 1. What this plan is now

**The root cause, the consultant's, checked.** Seven stops share one shape: the plan approved a mechanism, and a later
brief found that the mechanism does not fit the tool, the tree or the CI at the pin. Epoch 6 added the table (each
condition mapped to a file, its invocations and a check). Epoch 7 added a column (what the check prepares and does not
prove). Entry 7.2 shows the gap that is still open: the table held a claim about the released guard that nobody had run.
E2.4's brief ran it and found 6 findings. So from epoch 8, **a row is approved only with an OBSERVED result at the
consumer's actual pin, and with at least one counterexample that must be red** (item 8.1). Item 3 carries that for every
remaining row that can be observed read-only. The rows that need a hosted run say so, and they are observed before their
story's plan gate, not after it.

**State at the stop (read 2026-11-07).**

| Epic | State | Commits |
|---|---|---|
| E1, E3, E4 | DONE (wave 1) | conventions #77 `2c96f83`; mcp #58 `4feb245`, #59 `197cc76`; sidecar_rust #64 `5478109` |
| E2 (creds) | E2.1, E2.2, E2.3 MERGED. E2.4 DRAFTED only: the S1 spec by Fable (`todo/PLAN_test_leftovers_E2.4_S1_spec.md`) and the S2–S4 brief by Opus (`todo/PLAN_test_leftovers_E2.4_brief.md`), on `feat/test-leftovers-e2.4` at `dee6220` (pushed, no PR), no code. E2.5 not started | #294 `834c91b`, #310 `bf59e4f` (entry 7.1), #311 `0ae0211` |
| E5 (coai) | the producer PR MERGED (S3, S2-B, S4, S5, S6). S7 (the drain) not started. The baseline holds 778 entries in six scopes **[M]**; the inline `raw-temp` markers number 78 **[M]**. **During the stop, coai #962 (`72adc50c`, merged 2026-11-07 20:05:15Z, after the stop record at 19:41:23Z) changed E5's pin of the Windows limit** (`RunTempTests.cs`, `ci.yml`, `module_tests.md`): `mcp-v0.65.0`'s Windows legs failed `AnUntouchedClaim_StaysUnseen_OnAnElevatedWindowsRun` (run 42388147284, `failure` **[M]**), because a process started from Git Bash owns the files it makes; the test now skips, saying why, when the helper's own new folder is the caller's **[M]** (the PR's text and file list, `gh pr view 962`) | #945 `825504e`; `main` at `72adc50c` (`git ls-remote` **[M]**) |
| E6 (benchmark) | stage A DONE. The stories are an old draft (`docs/test-leftovers-e6-stories`, `08a87430`, 2026-10-17, before the owner form) **[D]**. The boundary row is written on the benchmark side and MERGED: benchmark #177 `562cb4bd` (2026-11-07, from `docs/e6-boundary-mirror` at `a94775a6`) **[M]** (corrected by the judge) | #125 `6a963a4` |
| E7 (rag_qln) | stage A DONE and promoted. No stories document on `main`; an old draft on `docs/test-leftovers-e7-stories` (`bff8478a`, 2026-10-17, before the owner form) **[M]** (added by the judge). `research/module_tests.md` is still absent **[M]** | #86 `47998e7`, #87 `88577ff`; pin #89 `93ffdb9` |
| F30 | DONE: released in `37b9aa5` **[D]**; every consumer pinned there (the coordinator's record; read for mcp, creds, benchmark, coai and rag_qln **[M]**; sidecar_rust #71, vscode_kit #24, amd_r9700 #17 and wsl_care #187 read through the GitHub API by the judge **[M]**) | `acb693c`, release `37b9aa5` |
| F31 | ACCEPTED AGAIN by the owner on 2026-11-07, at E2.3's start, with the `windows-latest` ownership measurement (#139, #140) **[D]**. Next review: a Windows machine that persists, or 2026-12-05. Its condition is now stated by what decides it (the goal below): a process whose NEW files are owned by `Administrators`, not "an elevated process" | — |
| Merge condition (c) | DONE for the WSL machine (#136) **[D]** | `37b9aa5` |
| The coai feature review | not started (item 3, row F; item 5) | — |

**Goal.** The goal of § *Epoch 6* stands word for word. § *Epoch 7*'s exception stands with ONE correction of its
condition: it is not "a run on Windows in an ELEVATED process", it is **a run on Windows in a process whose NEW files and
folders are owned by `BUILTIN\Administrators`**. What decides it is who owns a new file, not whether the token is elevated
(coai #962, `72adc50c`: "elevation is not the condition; who owns a new file is"). Measured cases:

- pwsh on `windows-latest`: new files are owned by `Administrators` **[D]** (coai run 42026897727, `ci.yml` step 0, as
  § *Epoch 7* item 1). The exception applies.
- Git Bash on `windows-latest`, elevated: new files are the caller's **[D]** (coai #962's RED, run 42391235904, and the
  release run 42388147284). Creds' E2.3 run 42389968156, `windows-latest`: "token is elevated (Administrators) = True",
  "new file owner SID" = the token user's SID, "Scope.IsMine of the new file = True" **[M]** (`gh run view --log`; the
  shell of that step was not read here). The exception does not apply: such leftovers are collected like any other.

This makes the exception apply in fewer places. Every guarantee of the goal stays, and it now holds in more runs. No
exception is added.

**Definition of Done, read for epoch 8** (the list is not edited). F30 is released, so § *Epoch 6*'s reading "a Node
consumer's zero for `legacy-name` and `owner-blind` is a zero of WHOLE literals, F30 open" ends: from `37b9aa5` the zero is
the folding reader's zero, for the spellings its table lists. **[M]** at `37b9aa5`: `"testsTo" + "Delete-"` in a `.cjs` and in
a `.sh`, `"testsTo""Delete-"` in a `.sh`, an array `.join("")` and a template in a `.mjs` are each `legacy-name`. What it
still does not read **[M]**: a prefix joined through a shell variable (`p=testsTo; q=${p}Delete-agent-x`), and in a `.sh`
any temp path that is not `mktemp` (`${TMPDIR:-/tmp}`, `/tmp/x` with `mkdir`). A PR that declared "F30 open" re-runs the
guard at `37b9aa5` and records the result (F30's own Definition of Done). This reading is stricter, not smaller.

### 2. Prerequisites

1. Merge condition (c), the release `37b9aa5` and its pins, F30: DONE.
2. F31: accepted, with its triggers above. Not a prerequisite of any PR here. E6 and E7 state its limit where they copy the
   C# helper (§ *Epoch 7* item 8.3).
3. The N6 follow-up (a `raw-temp` reading for `${TMPDIR…}` and `$TMPDIR` in `.sh`): still open, still not a prerequisite.
   Each epic migrates its own sites and its PR names the lines the guard cannot see.
4. **No conventions release is a prerequisite of E2.4** (item 4.2 rejects option A).
5. Not prerequisites: F25–F29, F32; the private sibling's mirror (F26, the owner's).

### 3. Merge conditions — ONE table

Each remaining condition, its implementation, its invocations, its check, what the check prepares and does not prove, and
what was OBSERVED for this revision. A row whose last cell says "to observe" names the run that must exist before that
story's plan gate.

**This table replaces § *Epoch 6* item 3's E2, E6 and E7 tables row for row; nothing of them is dropped.** E2 (c), E2.1,
E2.3, E6 stage A, E6 pin, E7 stage A and E7 pin are DONE. The others map so: E2 (d) → E2-d; E2.5 sc. 2 → E2.5-a; E2.5 N6 →
E2.5-b; E2.4 → E2.4-i (claim first, the kill-between test) and E2.4-j (the trap before any fallible step, S2's scripts,
sc. 4); E6 boundary → E6-a; E6 producer → E6-b to E6-h (the label and Ryuk E6-d, the per-test databases E6-f, the
worktree seam E6-b and E6-c, the C# copy E6-e, the guard over `tests/` and `tools/` E6-g, the `score-tmp` age removal of
§ *Epoch 6* item 8.3, E6-h); E7 must-settle → E7-b; E7 docs → E7-a; E7 live suite → E7-e; E7 size → E7-f.

| # | Condition | Implementation (file) | Invocations | Executable check | Prepares / does not prove | Observed for this revision |
|---|---|---|---|---|---|---|
| E2.4-a | `docker.yml`'s names are owner-form and the carve-out is complete, in the guard's reading | creds `docker.yml`: a first step *Name the smoke's resources*, the names `testsToDelete-u1001-creds-{cv,refused,refused-data,refused-logs}-${SMOKE_ID}`, one remover step (item 4.2) | the guard under `--profile node`; `docker.yml` runs only on `ubuntu-latest` (creds' D4) | the shipped guard on the head: 0 findings for `docker.yml` (S3.0) | A text scan. It proves the spelling and the step order, not that a command ran | **[M]** whole workflow, main `0ae0211` with option B: 0 findings. Seven counterexamples, each red: D5 as written 6 (4 `docker-name`, 2 `docker-run`); B with the remover's names quoted 2; B without `if: always()` 2; B without `continue-on-error` 2; a `docker logs` reader step after the remover 1; the remover before *Smoke-test a refused start* 1; one volume left out of the remover 1; the `-v` SOURCE alone in quotes (`-v "testsToDelete-u1001-creds-refused-data-${SMOKE_ID}":/data`) 1 `docker-run`. Correction to the brief's I3: the `-v` argument is written either unquoted or quoted WHOLE (`-v "testsToDelete-u1001-creds-refused-data-${SMOKE_ID}:/data"`, 0 findings); never the source alone in quotes; the remover's names are unquoted |
| E2.4-b | every remover command runs on every path | the remover: `shell: bash` written on the step (GitHub runs it as `bash --noprofile --norc -eo pipefail {0}`, **[D]** its documentation), each of the four removals ends in `\|\| true`, the step is `if: always()` and `continue-on-error: true` | the same | a creds test (in S3, beside the guard fixtures of `leftoversGuardFixtures.test.ts`) that reads the step from `docker.yml`, asserts `shell: bash`, and RUNS its body under that shell with a stub `docker` on `PATH` whose first removal fails: all four removals are called. RED: one line without `\|\| true` | The guard does NOT check it. `continue-on-error` keeps only the job's verdict; under `-e` the first failed command ends the step. `\|\| true` lets a failed removal pass while its resource stays: E2.4-k sees that | **[M]** B with no `\|\| true` in the remover: 0 findings, so the guard accepts it. **[M]** the step's body under `bash --noprofile --norc -eo pipefail` with a stub `docker` whose `rm -f` fails: 4 removals called, exit 0; the same body without `\|\| true`: 1 removal called, exit 1. B with `shell: bash` on the step: 0 findings |
| E2.4-k | nothing of the smoke is left after the remover, or the job is red | a step after the remover, `if: always()`, `shell: bash`, NO `continue-on-error`: `docker ps -a -q --filter "name=^<name>$"` for the two containers and `docker volume ls -q --filter "name=^<name>$"` for the two volumes; any answer → one line naming it, exit 1. It can only turn the job red, never green: `Publish` (`success()`) is then skipped | the same | the same creds test runs this body with the stub: a removal that failed and left its container (the stub still lists it) → exit 1, RED; nothing listed → exit 0 | A stub stands in for Docker; the hosted runs of E2.4-d observe the real answer | **[M]** with a stub listing `…-creds-cv-…` after the removal: "left after removal: …", exit 1; nothing listed: exit 0. The guard: this step with `docker ps`/`docker volume ls` filters, 0 findings; the same check written as `docker inspect <name>` is a reader AFTER the remover, 1 `docker-run` finding, so the check never uses a reader verb |
| E2.4-c | the owner segment is the runner's uid, checked before any resource exists | the naming step, before *Build*: `[ "$(id -u)" = 1001 ] \|\| exit 1`, then `SMOKE_ID` and `SMOKE_OWNER` (`$PPID` of the step's shell, D5) | `ubuntu-latest` | the step fails at once on any other uid; the first dispatch prints the uid and the worker. And a creds test over `docker.yml` (as E2.4-b's): the naming step's FIRST command is the `id -u` check, and the step comes before *Build*. RED: the check removed, or the step moved after *Build* | Proves the name matches the runner. A move to another runner fails loudly before Docker starts, never with a wrong name | **[M]** option B with the uid check removed: 0 findings, so only the creds test can see it. **To observe** in S3.1's premise run: uid `1001` is **[D]** (the brief: "to be measured by the first dispatch") |
| E2.4-d | sc. 1 and sc. 2: a failed smoke stays failed, the remover ran, NOTHING is left (E2.4-k's step green), `Publish` skipped; the happy path is green with E2.4-k green | as E2.4-a, b and k | two hosted dispatches on a throwaway branch, one on the PR branch | the brief's S3.1 (P, R, G1, G2) and S3.2, run URLs on the PR; in each, E2.4-k's step result quoted, not only "the remover ran" | The throwaway rewrites `Publish`'s `if:`, so it proves `success()`, not the real `if:`. "The remover ran" alone proves no removal | **to observe** before E2.4's code gate (hosted only; no `docker` binary here **[D]** the brief's I14) |
| E2.4-e | a bash record is judged on Linux | `owned.sh`'s `owned_owner` writes `:<start>:<ns>` on Linux (the start from `/proc/$$/stat` and ONE `getconf CLK_TCK`, the namespace from ONE `readlink /proc/self/ns/pid`); macOS writes neither | every Linux caller of `owned.sh` | the S1 spec's T13, T15, T16 on Linux: the janitor and the Node sweep collect a dead record | Without `<ns>` both readers answer `unknown` and collect nothing | **[D]** the brief's I4, read from `janitor.sh:649` and `owned.mjs:564`. Not counted: the stories say the released contract wins (§ *Order*). The S1 spec is revised before its gate |
| E2.4-f | sc. 6: acme killed mid-issuance leaves nothing after the next run | the containers' state in NAMED volumes of the owned compose project, each with the owner label (item 4.3.2), no bind mount; `run.sh`'s janitor call (D6) | the hosted `ubuntu-latest` throwaway job (the brief's Q2), on E2.4's branch | S4.2 on this shape: `kill -9` mid-issuance, wait 11 minutes, run again (its janitor call); then `docker volume ls`, `docker ps -a` and `docker network ls`, each filtered by the compose PROJECT (`--filter label=com.docker.compose.project=<project>`, never by the owner label, which an unlabelled volume would not carry), are empty, and the owned folder and its claim are gone. Before the kill, the run lists the project's volumes and asserts that each carries the `testsToDelete.owner` label: an unlabelled one would be kept by the janitor as `unmarked` | The janitor runs as the job's user; it removes a volume by its owner-form name and label with `docker volume rm` (`janitor.sh:458`, `:618` at `37b9aa5` **[M]**), so the owners of the files inside do not matter, as they would in a bind mount (I6) | **to observe before E2.4's plan gate** (a throwaway, never merged), of this shape. "A person removes it" is not an outcome of this plan |
| E2.4-g | sc. 3 on Windows | S1's T14 | `windows-latest` | the `unverified:` line and the runner's `[ -O ]` outcome quoted | The Node sweep only lists on Windows (F16); F31 where the runner's new files are `Administrators`' | **[D]** the S1 spec § 10 point 4 |
| E2.4-h | acme's compose project is the owned folder's name, never a fixed one | `run.sh`: `PROJECT` from the folder `owned_dir STATE acme` made, lower-cased (`teststodelete-<owner>-creds-acme-<id>`) | `run.sh` | a creds test over `run.sh`: `PROJECT` is assigned from `$STATE`'s basename and from nothing else. RED: `PROJECT=acme` | The guard cannot see it: the value is wholly an expansion | **[M]** `PROJECT=acme; docker compose -p "$PROJECT" …` in `deploy/acme-test/run.sh`: no finding; `docker compose -p acme …`: `docker-name` |
| E2.4-i | `owned.sh` claims first; a kill between claim and folder leaves only a claim that a sweep judges | `.github/scripts/lib/owned.sh` (S1 spec § 3, § 4) | bash on three OSes | the S1 spec's T1–T18, among them the kill-between cases T4/T13 and the squatter T8, RED by hand where the spec says | A child bash per case; a `kill -9` by the test | **[M]** `owned.sh` does not exist at `0ae0211` (`.github/scripts/lib/` absent) |
| E2.4-j | S2's scripts (sc. 4): each sets its trap before its first fallible step and leaves nothing on a failure, an interrupt or a person's run | `mcp-listen-smoke.test.sh`, `version-smoke.test.sh`, `mcp-listen-smoke.sh`, `version-smoke.sh`, `start-server-and-wait.sh`, `start-server-and-wait.test.sh`, `restore-archive-itest.sh` through `owned_dir` (brief § 3.1) | `ci-clients.yml:87`, `:91`; `ci-server.yml:170`, `:314`; `release.yml`; a person | the brief's S2.1–S2.7 (a stubbed failing `chmod`, RED first; SIGINT to the group; nine worlds), and each CI step's "the root is empty" check | A stub stands in for a real failure; a `kill -9` is not covered (row 8 of the brief) | **[M]** at `0ae0211` the guard finds `raw-temp` at the five `mktemp` sites (`mcp-listen-smoke.test.sh:19`, `version-smoke.test.sh:14`, `start-server-and-wait.sh:107`, `start-server-and-wait.test.sh:28`, `restore-archive-itest.sh:45`); the two smoke self-tests have no `trap` at all (`git grep -n 'trap '` → nothing) |
| E2-d | the hand clean-up of E2's old names is recorded per machine | a person's record on each E2 PR (`creds-*`, `cred-vault-*`, `cvbk-*`, `arrival-lease-*`, `wsl-mcp-check-*`, the six legacy `testsToDelete-agent-`/`-ait-`/`-sshd-` names, `start-server-*.log`, acme's `state/`); `tmp.*` is listed, never removed by name | the WSL machine; hosted runners end with the job; the owner's Windows machine does not test creds | `find <root> -mindepth 1 -maxdepth 1 -name <pattern>` over `/tmp`, `/var/tmp`, `/dev/shm`, `$XDG_RUNTIME_DIR`, before and after, on the PR | A search by name at one moment | **[M]** WSL, 2026-11-07 20:20Z: 0 of every name in all four roots; no `deploy/acme-test/state/` in the main checkout or the E2.4 worktree. This is the WSL record at the stop; each PR still records its own |
| E2.5-a | the Node guard over creds at `37b9aa5`: only the inventory's exemptions are left | the shipped guard, `--profile node --token creds` | the files the `node` profile reads | exactly the list in the PR (the E2.4 brief's row 20 expects 5 after E2.4), every other line a finding | A spelling check | **[M]** the plant spellings of item 1 are `legacy-name` at `37b9aa5`. So S5 sc. 2's `.cjs` and `.sh` plants are findings again: the PR pins each as a positive test, RED by hand once against a copy of the guard with the plant's line removed. Creds' revision row 2 ("cannot be findings") is read with this. **[M]** the guard on creds `0ae0211` at `37b9aa5` (`--profile node --token creds --identity "the developer-credentials server and extension"`): 16 findings, exit 1 — 6 in `docker.yml` (4 `docker-name`, 2 `docker-run`), 9 `raw-temp` in shell, `commandParse.test.ts:40` (`docker-name`); no `legacy-name`. After E2.4, 5 remain: `commandParse.test.ts:40`, `install.sh:63`, `:76`, `restore-archive.sh:61`, `restore.sh:102` |
| E2.5-b | the `.sh` temp paths the guard cannot see | migration by E2.4 (`mcp-listen-smoke.sh:35`, `version-smoke.sh:30`) | — | `git grep` for the old leaf names → 0 | No detector (N6) | **[M]** in a `.sh`: `x=${TMPDIR:-/tmp}`, `work="${TMPDIR:-/tmp}/creds-smoke-$$"; mkdir -p "$work"` and `d=/tmp/creds-x; mkdir -p "$d"` give no finding; `work=$(mktemp -d)` is `raw-temp` |
| E2.5-c | the C# guard over `.cs` | creds' adapted copy (E2.3) | the five xUnit executables | the copied folded reading: a planted split literal in a `.cs` is a finding | The Node guard does not fold `.cs` | **[M]** the Node guard on `var p = "testsTo" + "Delete-agent-x";` in a `.cs`: no finding. So `.cs` rests on the C# guard alone |
| S7-a | the creation bypass goes | coai `ci.yml`, step *The raw-temp baseline only shrinks*, its `number != 945` clause | every later PR | S7's first PR removes the clause | — | **[M]** the clause is on `main` `f07a9601` (`ci.yml:211`) |
| S7-b | an entry is removed only with its allocation | `raw-temp-baseline.json`; the Node wrapper (`testLeftovers.test.mjs:63`, `--baseline`) and the C# wrapper | each drain PR | BOTH `--baseline` (reconciliation) and `--baseline-shrinks --base <base>` green | The shrink check alone passes a deleted entry whose site stays | **[M]** one Node entry deleted, its site kept: `--baseline` exit 1 (`raw-temp` at the site); `--baseline-shrinks --base HEAD` exit 0 ("only shrinks"). The C# half was not run here |
| S7-c | history only where it is needed | the standing step fetches the base at depth 1 | every PR | a non-creation shrink needs no history; a creation is refused in a shallow clone (exit 2) | — | **[D]** read in `tools/lib/raw-temp-baseline.mjs` at `37b9aa5` (`creationVerdict`): the full-clone need of § *Epoch 6* row (q) was the creation's only |
| S7-d | the last drain PR deletes the file AND drops `--baseline` from every invocation, in one commit | the file; both wrappers | the last PR | the guard without `--baseline` green on the head | — | **[M]** with the file deleted: `--baseline` exit 2 ("cannot read the baseline"); `--baseline-shrinks` exit 0 ("absent now — drained"). So a deleted file with `--baseline` kept is a red wrapper |
| S7-e | "baseline zero" is not "no inline exemptions" | the expected-exemption inventory (`shared/leftovers-exemptions.json`, `LeftoversInventoryTests.cs`) | — | S7 ends at 0 entries with the inventory unchanged | The inline rows are contained lines with a proved reason (§ *Epoch 6* item 4.2) and stay | **[M]** 78 markers `testsToDelete-exempt: raw-temp` outside the mount (`git grep -c`); the inventory's count binds, not this grep |
| E6-a | the boundary on both sides | benchmark's `todo/PLAN_bench_test_leftovers_followups.md`, the row of `a94775a6` | — | the row is on benchmark's `main` | — | **[M]** merged: benchmark #177 `562cb4bd` (corrected by the judge). Met |
| E6-b | a worktree a test makes is owned, and the guard's boundary is stated | the old draft's D4: the product's `ScratchWorktree.AddAsync(…, scratchRoot)` gets a ROOT inside an owned folder; product code is the `Source` kind, which the C# guard does not read for `raw-worktree`. A `worktree add` in a TEST file takes one inline `raw-worktree` exemption with the reason "inside the owned folder `<x>`" | `Bench.Tests` | the C# guard on the head; one planted test-file `worktree add` without the marker is red | The guard reads the spelling, never the lock or the folder | **[M]** a compliant `git worktree add --detach --lock --reason "$RECORD" testsToDelete-u1001-bench-x HEAD` is `raw-worktree` in a `.sh`, a `.cs` and a `.mjs` under the released Node guard, and only the inline marker clears it. The C# template matches any `worktree add` the same way (mcp `45a8db2`, `LeftoversGuard.cs:91`, `:197-203`) **[M]** |
| E6-c | a killed child's worktree is collected by a NAMED implementation | the copied C# sweep's folder pass, on the owned folder that holds the clone and its worktree (the old draft's sweep case 15) | the next run's start | sweep case 15, rewritten in the owner form: a dead-claimed owned folder with `repo/` and a linked `scratch/<id>/` is removed whole | The C# template has NO worktree pass (mcp `LeftoversSweep.cs:3`) and keeps a linked worktree it does not list as `other clone` (`:173`) **[M]**; so a worktree at the temp root is never this sweep's, only the janitor's | **to observe** in E6's brief, at benchmark's pin `37b9aa5`: that `:173` does not keep the owned folder (the draft says the `.git` file is at depth two) |
| E6-d | the fixture's container: three separate proofs | `PostgresFixture.cs` | `Bench.Tests` | (1) Ryuk on: a killed child's container is gone; (2) the owner label `testsToDelete.owner` on the builder, read by the sweep's container pass; (3) no `.WithReuse(` (the draft's guard class `testcontainers`) | Ryuk collects by its session, not by owner; one test cannot stand for the other two | **[D]** the old draft's S3 and its decision table; each is a separate row of E6's brief |
| E6-e | the copy and its limits | the adapted copy with a manifest (§ *Epoch 4*), F29 read, F31 stated by its true condition (the goal) | — | the diff check | — | **[D]** |
| E6-f | the per-test databases are exempt under decision 2b, said beside the fixture | `PostgresFixture.cs`: `NewEmptyDatabaseAsync` (`:96`) makes them in the fixture's container, which dies with it; the rule §6 (b) sentence and its marker beside it | `Bench.Tests` | a test: after the fixture is disposed, its container and so every per-test database is gone; the guard reads the marker | The databases are never dropped one by one; the proof is the container's end | **[M]** at benchmark `0214a3eb`: `NewEmptyDatabaseAsync` at `:96`, no `testsToDelete-exempt` marker, no `.WithName`, no label in the file (`git show … \| grep`) |
| E6-g | the guard reads `tests/` and `tools/` | the adapted C# guard with benchmark's discovery (and the Node guard if a Node file is in scope) | `Bench.Tests`; CI | the guard green on the head; a scan of nothing is red; one planted raw temp in `tools/` is red | A spelling check | **[M]** no leftovers guard on benchmark `0214a3eb` (`git grep -l 'LeftoversGuard\|leftovers-check'` in `tests`, `tools`, `.github` → nothing) |
| E6-h | the held-out runner's age removal of `score-tmp/*` is retired or made owner-aware before any producer (§ *Epoch 6* item 8.3) | `spikes/minigit-bench/lib/heldout-run.mjs` | the held-out runner | its test: an old unclaimed folder under `score-tmp` is listed, not removed by age; or the removal is gone | — | **[M]** still there at `0214a3eb`: `heldout-run.mjs:86` "Remove leftover clear directories … older than `olderThanMs`, from score-tmp/<anything>" |
| E7-a | `research/module_tests.md` exists | rag_qln | — | the file with the harness, the command, the flow catalogue | — | **[M]** absent on `origin/main` `93ffdb9` (`git ls-tree`) |
| E7-b | a capped store never evicts a test collection, or tests never share a capped store | `EvictionPolicy.Choose` (orders by `LastServedUtc`, skips `Protected`), `ResidentSet.MakeRoomAsync` | a store with a budget that tests use | a test either way, BEFORE any rename test | — | **[M]** read at `93ffdb9`: the order is unchanged since § *Epoch 6* |
| E7-c | the live tests' reset is serialized before any rename test runs against the store | `FastLaneLiveTests` (fixed project ids) | the live tests | two live runs at once on one store: the second waits or refuses, by test | — | **[M]** no `lock`, `Semaphore`, `Mutex` or `serializ` in `FastLaneLiveTests.cs` at `93ffdb9` (`git grep -n -i`) |
| E7-d | the ownership states are proved separately | the store sweep (rule §3's store row) | the sampler tick, the sweep | one test each: LIVE kept; UNKNOWN (store unreachable or record unreadable) kept, nothing dropped; UNMARKED listed, never dropped; ABANDONED (record gone, lock free) dropped | One mixed test can pass while one state is wrong | **[D]** rule §3, §4 |
| E7-e | the failing live test | `SearchLiveTests.AQuestionInWords_FindsTheMemberThatAnswersIt` | the live tests | fixed or recorded as known before the live tests are E7's proof | — | **[D]** still recorded in `research/module_search.md:153` there |
| E7-f | the growth figure is the measured one, with its command | E7's stories, § Growth | — | the stories carry the figure and the exact `du` command and path, and the second-run check (no growth) | A figure of one machine at one date | **[D]** `research/PLAN_test_leftovers_E7_stage_a.md:169-170` at `93ffdb9`: 84 MB of vectors, 221 MB on disk, "`du` of Qdrant's collections folder". The exact command and path are NOT written there: E7's stories write them. Not re-measured (the store's folder is not read from here) |
| F | the feature reviews | `mcp__coai__review_feature` | — | ONE call per plan of three or more epics (item 5) | The reviewers get ONE checkout: the outline and hunks of every file changed between `baseRef` and that checkout's HEAD, the plan, the epics (1 to 20) and the lessons. Work in another repository reaches them as text only | **[M]** the tool's own contract, read in this session. Ranges in item 5 |

#### 3.2 The measurements, and how to repeat them

All read-only, 2026-11-07, in a scratch folder. The guard is `37b9aa5`'s, from `git archive 37b9aa5 tools`.

1. **`docker.yml`.** The whole workflow of creds `main` (`0ae0211`), and variants built from it by a script (the naming
   step, the names, the remover of item 4.2, then one change each), each scanned whole with
   `scanText('.github/workflows/docker.yml', text)` of `tools/leftovers-check.mjs`. Results: rows E2.4-a and E2.4-b.
2. **Single lines.** `scanText(<path>, <line>)` for each line quoted in item 1 and in rows E2.5 and E6-b. For example
   `scanText('tools/probe.sh', 'x=${TMPDIR:-/tmp}')` → `[]`.
3. **coai.** A local clone of coai at `f07a9601` with the mount at `37b9aa5`:
   `node .agents/conventions/tools/leftovers-check.mjs --repo . --baseline --profile node --token coai --identity "the multi-model review extension and server"`
   → `clean (645 files)`, exit 0. Then the two edits of rows S7-b and S7-d, each run with `--baseline` and with
   `--baseline-shrinks --base HEAD`, and restored.
4. **Reads.** `git show`, `git grep` and `git ls-tree` on each repository's `origin/main`; the C# template at mcp `45a8db2`;
   `git rev-list --count` and `git diff --shortstat` for item 5's ranges.

Not measured here, and why: anything with Docker (no `docker` binary on this machine), the C# wrappers (no .NET run),
Windows, macOS.

#### 3.3 E2's rows at E2's end (2026-11-10; a progress record, not a change)

E2 is complete: E2.4 #329 (`6e08071`) and E2.5 #330 (`b6cc6b3`) merged on 2026-11-10, after E2.1 #294, E2.2 #310 and
E2.3 #311. The table above stays as it was observed for this revision. This table records each E2 row's result, read
from creds' `todo/PLAN_test_leftovers_E2.md` (its build records) and `todo/PLAN_test_leftovers_E2.4_brief.md`, both on
creds `main` at `b6cc6b3` **[D]**. "Part" means a part of creds' E2.4 build record.

| Row | Result | Evidence (creds) |
|---|---|---|
| E2.4-a | done | part 3, S3.0: the shipped guard gives 0 findings in `docker.yml` (6 before). Merged in #329 |
| E2.4-b | done | part 3, item 3 (b): `dockerSmokeLeftovers.test.ts` runs the remover's body under `bash -eo pipefail` with a stub `docker`; RED with the first `\|\| true` taken out (1 removal call, exit 1) |
| E2.4-k | done | part 3, item 3 (k): the check fails and names what is left; RED with the check's last line made `true`, and with one volume left out of the remover. Hosted: G3, run 42738357610: the check failed with `left after removal: refused refused-data refused-logs`, and `Publish` was skipped |
| E2.4-c | done | the E2.4 brief, § *Observations before the plan gate* (2026-11-08, runs 42415388093 and 42416565709): `uid=1001(runner)`. Part 3, item 3 (c): RED with the uid check deleted. Part 2d: the real `docker.yml` dispatch on PR #329's head, run 42744213082, printed `runner uid: 1001` |
| E2.4-d | done | part 3, *Hosted evidence of S3*: R 42735252947 (the old shape: failure, `cv` left); G1 42735352830 and G2 42735473885 (the smoke failed, the remover and the check `success`, `Publish` skipped); S3.2 42735590128 (the PR branch green, the check `success`). The record says "Row E2.4-d is met" |
| E2.4-e | done | part 1: T2, T13, T15 and T16 on Linux (bash 5.3.9); the shipped janitor and the mounted Node sweep collect the dead record. RED by hand with `owned_owner` without `:<start>:<ns>` (the janitor: "liveness unknown … the record names no pid namespace") |
| E2.4-f | done | the E2.4 brief, § *Observations before the plan gate* (2026-11-08): the kill on the named-volume shape; the next run's janitor removed each resource; the three listings filtered by the compose project were empty. Again on the built code, part 2c, run 42738732851: `project volumes: 4 (expected 4), a wrong label: 0`, `KILLED run 1; wait status 137`, run 2's janitor `removed volume …`, `ALL ISSUANCE CHECKS PASSED` |
| E2.4-g | done (quoted 2026-11-10 by the coordinator) | From the Windows leg of `ci-clients.yml` on #329's final head `fe27bea` (run 42776745568, job 129696911480), step *Self-test the shell helper*: `ok   T13/T14 the Node sweep lists unverified: (F16)`, `ok   T13/T14 the Node sweep removed nothing`, and the janitor's dry run `would run: rm -f -- /tmp/testsToDelete-w1833818394-creds-selftest-66e02999/t13/testsToDelete-w1833818394-creds-x-4ff4417e.owner` with `ok   T13/T14 the janitor says it is a dry run`. The janitor names a removal only for an entry its `[ -O ]` test says is the caller's, so this line IS the runner's `[ -O ]` outcome: true (the runner's new files are its own, not `Administrators`', so F31's case did not arise there). Was: not marked done (the quotes were missing from creds' record). |
| E2.4-h | done | part 4: the `acmeRunLeftovers` rules of E2.4-h; RED with `PROJECT=acme` (`E2.4-h: PROJECT is assigned once, from the owned folder's name…`) |
| E2.4-i | done | part 1: `owned.sh` and `owned.test.sh`, cases T1 to T21; the kill-between cases RED by hand (T4, T13), and the squatter (T8) |
| E2.4-j | done | part 2: S2.1 to S2.7, RED then GREEN (a stubbed failing `chmod`; INT, TERM and HUP give 130, 143 and 129 with the root empty; the nine worlds `after: 9` then `after: 0`). The guard went from 16 to 11 findings; the five shell `raw-temp` lines are gone |
| E2-d | done | the E2.5 build record, *The merge conditions (a)–(d) of D8, collected from the five pull requests*, column (d): one record for each of the five PRs (the WSL machine; the owner's Windows machine does not test creds) |
| E2.5-a | done | the E2.5 build record, RED list item 7: `leftovers-check: 5 finding(s)`, then `clean (622 files)` with five markers on the five inventoried lines; on the merged head `clean (640 files)`. Item 11 and `leftoversGuardFixtures.test.ts`: the F30 plants are positive tests, each RED by hand against a copy of the guard |
| E2.5-b | done | the E2.5 build record, RED list item 12 (S2.8): `git grep -n -E 'creds-mcp-listen-smoke-\|creds-version-smoke-' -- . ':!todo' ':!research'` gives no output, because E2.5 renamed the two given-root leaves (Q5 (C)). The check holds as written |
| E2.5-c | done | the E2.5 build record, RED list item 5 and review fix 2: the split `.cs` case is red when the folded reading is taken out. *The hosted evidence*, E2.5-R1 (run 42790950851): the tests with `LeftoversRepositoryGuardTests`, 626 total and 0 failed, on all six `cli-binaries` legs |

Two E2 items stay open in this plan: ~~row E2.4-g's quote (above)~~ (quoted 2026-11-10), and E2's feature review (item 5, point 2), which is
due now.

### 4. The dispositions of entries 7.1 and 7.2

**4.1 Entry 7.1 — kept as built.** The shared harness exit module is merged in E2.2 (#310). Nothing of it is narrowed.

**4.2 Entry 7.2 — option (B), decided.** The names spell a literal owner segment, `u1001`, and the first step after
checkout fails when `id -u` is not `1001`, before any image, container or volume exists. The remover's names are written
unquoted. The owner label, the record and the complete cleanup of D5 stay as they are. Reasons:

1. It carries out D5's own decision: an owner segment from the runner's uid, in a text the guard reads. Only the example
   spelling and its claim were wrong. Measured clean on the whole workflow, with seven counterexamples red (row E2.4-a).
2. `docker.yml` runs only on the hosted `ubuntu-latest` (creds' D4). A move to another runner already needs a `docker.yml`
   change. Under (B) it fails at the first step, with one line, and makes nothing.
3. It narrows nothing: the names, the labels, the carve-out and E2.4's Done-when stay. It adds a check (E2.4-c) and a
   test (E2.4-b) that the plan did not have.
4. **(A) rejected.** A guard that takes `${OWNER}` as an owner because the same file assigns `OWNER=u$(id -u)` reads data
   flow. The released guard says of itself that it is "a SPELLING check, not data flow" (`tools/leftovers-check.mjs:21`
   at `37b9aa5`). It would also make a conventions release a prerequisite of E2.4. If the guard ever reads an assignment,
   that is a follow-up of its own, not this plan's.
5. **(C) rejected.** Merging with six findings makes E2.4's Done-when smaller: `Narrowed: yes`, the owner's, and E2.5 would
   inherit findings it cannot exempt with a reason that holds.

The consultant recommended (B) and said (B) is not a narrowing (item 6). Corrections to the brief that come with it: the
`-v` sources need no change of quoting (row E2.4-a); the host is normalised with `sed -E 's/[@:[:space:]]+/-/g'` (the
brief's I19); each removal carries `|| true`, and a test pins that (E2.4-b).

**4.3 What 7.2 also found, settled here so that E2.4's gate meets no open design question.**

1. **The Linux record (I4).** `owned_owner` writes `:<start>:<ns>` on Linux (row E2.4-e). The released contract wins
   (the stories' § *Order*). Not a change.
2. **Acme's state after a kill (I6, the brief's Q4) — decided: labelled NAMED volumes, not a bind mount.** After a kill
   the containers have written root- and uid-10001-owned files, and a janitor that runs as the user cannot remove them
   from a bind mount (I6). A named volume is removed whole by `docker volume rm`, whatever its files' owners. So
   `docker-compose.acme-test.yml` declares the state (`certs`, `data`, `logs`) as named volumes with
   `labels: { testsToDelete.owner: "${TESTS_TO_DELETE_OWNER:?}" }`; compose names them `<project>_<name>`, so they carry
   the owned project's owner-form name. `run.sh` reads the few files it needs through a one-shot container
   (`docker run --rm -v <volume>:/s:ro …`) into its owned folder. **How this fits D6:** D6 asks that the owned project,
   its labels, its state and its teardown are one. They still are, and more tightly: the state now lives INSIDE the
   project (the same name, the same label), `compose -p "$PROJECT" down -v` removes it with the containers and the network
   on every exit, and the janitor collects all of it after a kill by the same label. The owned folder holds only what
   `run.sh` copied out and is removed by `owned_cleanup`. The container-side wipe of D6 is no longer needed. The hosted
   throwaway observation stays, now of this shape (row E2.4-f). This is the baseline epoch 8 is approved on.
3. **The other open questions of the drafts:** `owned_trap` (brief Q5, spec Q1), `OWNED_TEST_IDS` (spec Q2), the run
   record not read (spec Q3), the kill cases on the three CI legs (spec Q6), `$RANDOM` ids (spec Q7), acme on the hosted
   job (brief Q2), the self-tests' RED by hand (brief Q6), the owned `TMPDIR` for the itest's child (brief Q7), the kept
   server log's limit (brief Q8), the premise run (brief Q9), one PR (brief Q10). Each as recommended in the drafts;
   none is a change.
4. **If bash 3.2 does not show the parent's trap inside `$( )` (spec Q4):** the coder stops and reports. Recommended shape:
   the trap text written to a file beside the claim and read back. The callers' one-line contract does not change.

### 5. Build order

```
DONE   epoch 7 approved (#134) → F30 (#135) → (c) recorded (#136), whose merge is the release 37b9aa5 → E2.1 (#294)
       → the nine pins → benchmark's boundary row (#177) → E2.2 (#310, entry 7.1) → E5's producer (#945) → F31 accepted
       again (#139, at E2.3's start) → E2.3 (#311) → the E2.4 drafts (dee6220) → the stop (entry 7.2, #141) → this
       revision. (Merge order, corrected by the judge.)
NEXT   the Opus judge sorts epoch 7's work (step 5) → the plan gate on an operative extract (the file is over the gate's
       limit) → epoch 8 opens `by reviewers` (Narrowed: no).
THEN, two repositories at once (entry 1.1):
  creds  E2.4: the S1 spec and the brief revised by item 4 (Fable for S1, Opus for the brief) → the hosted throwaway
         observations of rows E2.4-c and E2.4-f → the plan gate → S1 → S2 → S3 → S4, one PR, each RED then GREEN → the
         code gate and an Opus review per story → merge.
         E2.5: its brief opens with rows E2.5-a to c observed at the pin → the two guards on, the inventory, the F30
         re-run recorded → merge.
  coai   E5.S7: one PR per suite; the first removes the creation bypass (S7-a); each keeps both checks (S7-b); the last
         deletes the file and drops `--baseline` in the same commit (S7-d); the inline rows stay (S7-e).
THEN   wave 3: E6 ∥ E7. Benchmark's boundary row is merged (#177). Each stories document is written new against `37b9aa5`
       (E6 and E7 read their old drafts as material, not as approved text) and opens with item 3's rows, observed at its pin.
LAST   the feature reviews (below); the promotion of this plan and its stories documents; R6 ticked in the remainder plan.
```

*Progress, 2026-11-10 (not a change):* the creds line of THEN is done. E2.4 merged as #329 (`6e08071`) and E2.5 as #330
(`b6cc6b3`); E2's rows are in item 3.3. Next for E2: its feature review (point 2 below).

**The feature reviews.** The tool reviews ONE checkout (item 3, row F). So:

1. **This plan**, from a pulled conventions `main`: `planPath` `todo/PLAN_test_leftovers_rollout.md`, `baseRef` `d52bcaf`
   (the parent of E1's `2c96f83`), seven epics, each with its repository and PRs in its summary. **[M]** at `a887924` that
   range holds 65 commits and 128 files (+41,176 −320), and much of it is other plans' work; one `baseRef` cannot leave
   it out, so the lessons name it. The consumer epics reach the reviewers as text only, and the lessons say so.
2. **E2's stories document** (five sub-epics), from creds after E2.5: `baseRef` `a52fde1` (the parent of `834c91b`).
   **[M]** at `0ae0211`: 6 commits, 193 files.
3. **E5**, from coai after S7: `planPath` `todo/PLAN_test_leftovers_E5.md`, `baseRef` `ee7a7b70` (the parent of stage A,
   `d02ed40e`). **[M]** at `f07a9601`: 31 commits, 1,102 files, with coai's own releases in between. If the server
   answers `skipped` (the document holds stages and stories, not three epics), that is said, and it does not block.
4. E3, E4, E6 and E7 are one epic each in their repositories; their code gates cover them. Their `baseRef`s, for the
   lessons of item 1: mcp `6457540`, sidecar_rust `17b18b3`, benchmark `a504cfec`, rag_qln `75b7673`.

### 6. What the re-review consultant raised, and what was done with it

| Point (consult `ba518e5d`) | Checked | Done |
|---|---|---|
| Recommend (B); Narrowed: no for B; no for A if A keeps detection; yes for C | (B) measured clean on the whole workflow; (C) leaves 6 findings against the Done-when; (A) reads data flow, against the guard's own header | Item 4.2: (B). Narrowed: no |
| The root cause: epoch 8 needs OBSERVED results before approval, at each consumer's pin, counterexamples included | True: 7.2 was a table cell nobody had run | Item 1, item 3's last column, item 8.1 |
| (a) the complete `docker.yml` against the pinned guard; cleanup after the last reader; `continue-on-error` alone does not run later commands | True, both. The guard checks the order (a reader after the remover is red) but not `\|\| true` (0 findings without it) | Rows E2.4-a, E2.4-b; a creds test pins `\|\| true` |
| (b) E2.5: class-specific expectations instead of "F30 open"; `scanText('tools/probe.sh', 'x=${TMPDIR:-/tmp}')` has no findings | True, `[]`. And the F30 reader now finds the `.cjs` and `.sh` plants | Rows E2.5-a to c; item 1's reading of the DoD |
| (c) S7: the first PR removes the bypass; reconciliation and the shrink check with full history; an entry deleted with its allocation left fails; "baseline zero" is not "no inline exemptions" | True, each measured, except "full history": only a creation needs it (S7-c). One more found: a deleted file with `--baseline` kept is exit 2 | Rows S7-a to e |
| (d) E6: a compliant locked worktree still triggers `raw-worktree`; the helper/exemption boundary; the named collector of a killed child's worktree; Ryuk, owner labels and no reuse separately | True in both guards. The C# template has no worktree pass | Rows E6-b to d |
| (e) E7: capped-store eviction and reset serialization before rename tests; live / unknown / unmarked / abandoned separately | True: no serialization today; the eviction order is unchanged | Rows E7-b to d |
| (f) the feature review: exact cross-repository ranges and the tool's input limits | True: one checkout per call | Item 5, row F |

Nothing the consultant raised was rejected. Added by this revision beyond it: S7-d (the file's deletion and `--baseline`),
the `-v` quoting correction, E2.4-c's uid check before any resource, item 4.3.2's volumes for acme.

### 7. Questions for the owner

None. The record says `Narrowed: no`, so the plan gate approves epoch 8 (§ *The full stop*, step 8). What the owner may
want to know, with no decision asked: under (B), a change of `docker.yml`'s runner fails the image job at its first step
until the names are changed; F31's next review is at a persistent Windows machine or on 2026-12-05. **Reported to the
owner:** coai #962 merged during the stop (20:05:15Z, after the stop record at 19:41:23Z). It fixed E5's own Windows pin to
unblock coai's release; the rule's Halt allows it only as "an incident fix the owner orders", and this record does not
know whether the owner ordered it. Its content fits the revised plan (the re-review record's row).

### 8. The way of working — so an eighth stop is less likely

**8.1 What changes.** One rule, added to § *Epoch 7* item 8.1:

- **A row is approved only with an observed result at the consumer's pin, and a counterexample that must be red.** Where
  a guard decides, the result is the guard run on the whole file the story will change, not on a fragment, and the
  counterexample is the same file with one line wrong. Where only a hosted run can observe it, the run is a throwaway
  BEFORE the story's plan gate, and the row says "to observe" until then.
- **A guard's acceptance is never the mechanism's proof.** Row E2.4-b is the example: the guard accepts a remover that
  stops at its first failure. Each row names what the guard does not read.
- **An example spelling in a stories document is run through the released guard when it is written.** D5's was not.
- **A design that a measurement could refute is decided before the gate, on what the files and tools say** (item 4.3.2:
  the bind mount is replaced, not measured first), and the measurement then observes the chosen shape. It does not stop
  the plan.

No new document and no new gate. The column is one cell per row of a table the briefs already write.

**8.2 The surprises still likely.**

| Story | What it is likely to meet | Why |
|---|---|---|
| E2.4 S4 (acme) | a volume still in use when the janitor reaches it; compose's volume naming | the volumes replace the bind mount (4.3.2); the throwaway of E2.4-f observes both |
| E2.4 S1 | bash 3.2's `trap -p` inside `$( )`; MSYS's exclusive create | unmeasured premises; the spec's T7a and T5 run first |
| E2.5 | new `legacy-name` findings from the F30 reader on creds' tree | F30's real-tree re-run is recorded for creds (#137 **[D]**); E2.4 adds files after it |
| E5.S7 | the last PR's order (S7-d); a site that moves and changes its hash | measured: the file's absence is exit 2 under `--baseline` |
| E6 | the old draft predates the owner form, the merged core, F29 and F31; the `other clone` rule | the stories are written new |
| E7 | eviction and serialization; Qdrant's naming for the prefix; the failing live test | none is settled in code yet |

**8.3 What the other documents' own revisions must say** (each its own gate work): creds' E2 document — D5's spelling as
item 4.2, the `|| true` test, the uid check, its revision row 2 read with E2.5-a, and the lines of the judge's cut row
(D5 `:470-473`, § S4 `:1003-1006` and `:1014-1015`, S5 sc. 2 `:1132` and `:1136`, D3 `:393`; acme's `-p` with `${OWNER}`
is a `docker-name` finding **[M]**); the S1 spec — the Linux record and
`owned_trap`; the E2.4 brief — item 4, and rows E2.4-h to j and E2-d; coai's E5 document — S7-a to e in S7's DoD, and
its goal's Windows exception by the true condition (#962 changed the pin, not the document); benchmark — the boundary row
is merged (#177), write E6 new, with E6-a to h as its first table; rag_qln — E7's stories with E7-a to f as their first
table. **E6 and E7, where they copy the C# helper, state the goal's exception by its true condition**: a Windows process
whose new files and folders are owned by `Administrators` (pwsh on `windows-latest`, measured), not "an elevated
process" (elevated Git Bash makes the caller's files, measured). A pin of the limit in their suites reads who owns a new
file, as coai #962's test does, and skips with its reason where the caller owns it.

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
  *Epoch 3 (2026-11-03):* P2 and P3 DONE (`5863c60`); F21 and F22 released (`5863c60`, `cc24f9e`); F16's Fix (the owner
  SID) still open with F9 — only the interim (b) shipped. F3 is due at the FIRST real Node compliance declaration,
  whichever epic reaches it first — E2.5 or E5's producer PR (§ Epoch 3, item 4).
  *Epoch 4 (2026-11-03):* F3 is merged (#116, `605e3e6`) and not yet released. F24 is new: the baseline proof rule
  accepts a process-wide gate that enforces containment before discovery; it is released and pinned before E5's S6
  (§ Epoch 4, items 2 and 5).
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
  *Epoch 3 (2026-11-03):* the pin is at `cc24f9e` (#292 `5863c60`, #293 `cc24f9e`, each alone). E2.1 is built and
  CI-green as DRAFT creds #294 (every check green, read 2026-11-03), wired to F22; it waits for P1 and the by-hand macOS
  and Windows records its plan names (D8). E2.2–E2.5 each record the invocation inventory before they drop a prefix
  (§ Epoch 3, item 4), and E2.5 needs F3 if it is the family's first Node compliance declaration.
  *Epoch 6 (2026-11-05):* #294 unchanged at `9a6e9fa`; F3 is released (`bd795847`), creds' pin bump #297 is open. E2's
  document has the same two gaps as E5's (its D9 row 2 assumes the shipped Node guard folds — it does not, F30; its DoD
  still says "a byte copy"), and its S4 bash scripts have the trap-order class of § Epoch 6 condition (p). What its
  revision must say is § Epoch 6, item 8.3; each E2.2–E2.5 brief opens with the table of § Epoch 6, item 3.
  *Epoch 8 (2026-11-10): COMPLETE.* The five producer PRs are merged: E2.1 #294 (`834c91b`), E2.2 #310 (`bf59e4f`), E2.3
  #311 (`0ae0211`), E2.4 #329 (`6e08071`) and E2.5 #330 (`b6cc6b3`). Both guards run in creds' CI; creds' mount is
  `.agents/conventions` (#328), pinned at release `1341995` (#340). The rows: § *Epoch 8* item 3.3 (E2.4-g's quote added
  2026-11-10, run 42776745568). Still to do: E2's feature review (§ *Epoch 8* item 5) and the promotion with this plan. Creds' notes for the
  parent N20–N25 are carried to the follow-ups as F33–F38, and its side findings as F39 (`release.yml`) and F40 (two
  product scripts).
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
  *Corrected 2026-11-03 (§ Epoch 4, item 4; entry 3.1):* the byte identity cannot hold. The template hard-codes mcp's
  layout, its mount path `.claude/rules/shared` and an mcp type (`RepositoryIdentity.Row`), and needs two files outside
  its folder (`DirectoryLinks.cs`, `RepositoryRoot.cs`); its folder has 51 files at `197cc76`, not 54. A consumer copy is
  an ADAPTED copy: a pinned file manifest, the permitted transformations per file, and a diff check that rejects any
  unexplained change; the ownership, liveness and deletion algorithms stay unchanged unless separately reviewed. E5's D2
  is the first such copy; E2, E6 and E7 follow the same form when they copy (each stories document writes its own
  manifest). Making the template itself parameterised is NOT done now; it is a possible later follow-up if the same
  adaptations recur.
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
  *Corrected 2026-11-03:* an adapted copy with a manifest and a diff check (the note in the State line above).
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
  *Epoch 3 (2026-11-03):* the stories merged as coai #850; stage A DONE as #940 (`d02ed40e`); the pin at `cc24f9e` (#939,
  #941), so P2 and the F16 (b) release are met. S5 is NARROWED to the sites contained under every invocation that runs
  them; its deferred sites move to S3 (C#) and S4 (Node, and `sonarcloud.yml:302` through the runner); the producer PR
  carries them all, with S6's repository-wide zero (§ Epoch 3, items 1 and 3; the E5 stories document, revised the same day).
  *After the re-review gate (2026-11-03):* S5 has no stage-A part; its renames are a commit of the producer PR
  (S3 → S2-B → S4 → S5 → S6), and S3 and S4 make their runners fail closed and a direct start refuse (§ Epoch 3, items 1,
  3, 4, 5).
  *Epoch 4 (2026-11-03):* the E5 stories were merged for epoch 3 as coai #942 (`004c55fb`). S3's build brief found
  entries 3.1 and 3.2. D2 becomes an adapted copy; the DoD names the suite × OS matrix; S3's fail-closed mechanism is a
  gated custom `Main` (exit 78); S6 waits for F24's pin (§ Epoch 4; the E5 stories document, revised the same day).
  *Epoch 5 (2026-11-04) and epoch 6 (2026-11-05):* #945 at `524df50e` holds S3, S2-B, S4, entry 5.1 (the Windows sweep
  mutex, `SweepLock.cs`) and S5; S6 is a brief only. Entries 5.2 and 5.3 (the S6 brief) stopped the plan: row 2's Node
  half is narrowed to what the shipped guard detects (F30 for the rest), D8 (b) admits the inline `raw-temp` exemptions
  of the inventory with proved reasons, and three checks are added — the audit before the run folder goes, the smoke
  script's trap before `mktemp`, the baseline's final content at the last head (§ Epoch 6, items 3 and 4; the E5
  stories document revised the same day on the producer branch).
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
  *Epoch 3 (2026-11-03):* the pin is at `cc24f9e` (#151, #152). The stories record the invocation inventory before any
  site drops a prefix (§ Epoch 3, item 4); a Node compliance declaration here before E2.5 and E5 would need F3 first.
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
  *Epoch 3 (2026-11-03):* stage A is still NOT done — `src/Rag.Application/Runtime/InfrastructureSampler.cs:104` still
  drops `TestCorpusSweep.Sweepable(...)` collections (read on rag_qln `ae9c7d6`; remote `main` `b40c0ae` is only the
  `cc24f9e` pin bump #81). The pin is at `cc24f9e` (#80, #81).
  *[epoch 5, 2026-11-04]* **Stage A LANDED 2026-11-04, dew_flow_rag_qln #86** (`47998e7`): `InfrastructureSampler` lists `qlntest_*` and
  never drops them; the listing is its own step of the tick. Its plan (`todo/PLAN_test_leftovers_E7_stage_a.md` there, a stories document, no
  ledger) stays open for the live check and measurement: not run, because the build machine has no Qdrant, daemon or Docker.
  **A must-settle for E7's stories** (found by the stage-A session, checked in the code): `ResidentSet.MakeRoomAsync` with a budget set
  (off by default: with no cap it does not even list the store) evicts by DELETE the coldest unprotected collection of the WHOLE store
  (`EvictionPolicy.cs:90-91`, ordered by last served; `ResidentSet.cs` gives a never-served collection `DateTimeOffset.MinValue`, so a
  `qlntest_*` goes first). It deletes on no name, but it is owner-blind and ordered by age, so the barrier's "no owner-blind or age-based
  sweeper remains enabled" (rule § The barrier) reaches it wherever a cap is set on a store that tests also use. Not a plan change: the goal
  already asks that every sweep be owner-aware or retired before the first producer, and this epic must already settle the shared store
  before any rename. E7's stories decide it before E7's first producer: a test collection is protected from eviction, or tests never share
  a capped store, with a test either way.
  *[epoch 6, 2026-11-05]* **Stage A's plan is PROMOTED** (dew_flow_rag_qln #87 `88577ff`, `research/PLAN_test_leftovers_E7_stage_a.md`):
  the live check ran on the WSL machine with native stores (no Docker): 8 `qlntest` collections, 18867 points, 84 MB of vectors,
  221 MB on disk; a second run adds none and the daemon's log shows the listing line and no drop. The "about 8 GB per recipe change"
  of the stage-A plan is REFUTED — about 0.2 GB; E7's stories carry the measured figure and the `du` command, not the projection.
  Carried to E7's stories as well: `SearchLiveTests.AQuestionInWords_FindsTheMemberThatAnswersIt` failed in both runs (not caused by
  stage A; recorded in `research/module_search.md` there) and is fixed or recorded as known before the live tests become E7's proof;
  rag_qln has NO `research/module_tests.md`, which `common.knowledge-base` requires of every repository — E7's first PR creates it;
  the `ResidentSet` must-settle above; the pin bump to `bd795847` is agreed (the owner, 2026-11-05) and not yet opened.
- **Repository:** `dew_flow_rag_qln`. **Stories:** `dew_flow_rag_qln · todo/PLAN_test_leftovers_E7.md`. Depends on E1.
- **Goal.** A test corpus in the shared Qdrant store is dropped only when nothing alive owns it; the live
  tests' deliberate reuse is either exempt under decision 2a (named where configured, reset serialized) or
  abandoned on purpose — never both at once, as today; the test prefix is renamed in every place that pins
  it; temp sites go through the helper.
- *[epoch 5, 2026-11-04, PR review, CodeRabbit]* The Scope paragraph below describes `InfrastructureSampler` as it was BEFORE stage A. Since
  dew_flow_rag_qln #86 (`47998e7`) the daemon lists `qlntest_*` and drops none by name; the paragraph stays as the record of why stage A
  was required, and its other facts (the fixed ids, the prefix's three places) are for E7's stories to read again.
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

*Note 2026-11-03 (epoch 4):* where this section or the E3 entry speaks of a byte-identical copy of the C# template, read
§ *Epoch 4* item 4: every C# consumer (E2, E5, E6, E7) makes an ADAPTED copy, with a pinned manifest of upstream blob
SHAs, permitted transformations and an offline diff check [interim gate, finding 0].

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
