# PLAN — Test leftovers, the merged core: what is left before PR #82 merges and the release is promoted

> Status: **IMPLEMENTED, 2026-11-04.** R1–R5, R7 and the Darwin path of the C# helper are done. R6, the consumer migration, is
> handed over to [the rollout plan](../todo/PLAN_test_leftovers_rollout.md), which is its open tail; R6's box here is ticked
> together with that plan's final completion record, once its other conditions hold (§ *Epoch 2*, item 3). Epoch 2 was
> approved by the owner on 2026-11-04, after the late-recorded stop and the re-review (narrowed).
>
> Deviations from the plan as written:
>
> - **Two releases, not ONE.** R5 promoted `release` to `115bbf8` (2026-10-30). The owner added R7 on 2026-11-01, and
>   `release` moved to `105d53c`, with every consumer's pin bump merged alone (entry 1.1). The later releases (`5863c60`,
>   `cc24f9e`) are the rollout plan's.
> - **Items added after approval.** R7, the core split riding it, and the Darwin item (entries 1.4–1.6).
> - **The change ledger was recorded late.** The rule reached this repository on 2026-10-29; this plan's ledger opened on
>   2026-11-04 with six entries, and the stop belonged at entry 1.2 (2026-10-31). Wave 1 (E3, E4), R7 and the Darwin item
>   were built after that unrecorded stop. The Opus judge found that all of it fits the revised plan: the breach is timing.
> - **R6 handed over, not done.** Its barrier order is read as the rollout plan's merge condition (b): a producer waits only
>   for the sweep-only stages that can reach its resources. That is narrower than "every sweep-only stage before any
>   producer stage": wave 1 merged before coai's age-only sweep was retired (coai #940, 2026-11-02), and E7's stage A is open.
> - **R4's guarantee holds at `2602416` only.** The private sibling's mirror of the spans changed later (the core split, the
>   baseline rule, F24) is not recorded: F26 of [the follow-ups plan](../todo/PLAN_test_leftovers_merged_core_followups.md),
>   the owner's. Checked: every sha and pull request of the judge's table (git log, gh). Not checked: the private sibling's
>   current copies (another owner's repository, not visible from here).
>
> Was: **stopped for re-review (2026-11-04).** The change-control rule (`common/plan-change-control.md`, #86) reached
> this repository on 2026-10-29. This plan had no ledger then, and six changes after that date were never recorded here
> (see Plan changes): the second of them, on 2026-10-31, is where the plan should have stopped. The stop is recorded now,
> found while preparing the plan's promotion. No new code on any item of this plan and no merge of a pull request that
> carries its work (R6: the consumer epics) until the full re-review is complete, the owner has approved epoch 2 (the
> re-review narrows the plan), and epoch 2 is opened with `state: open`. At the stop: R1–R5 and R7 are done; R6 is open.
>
> Was: **in progress, 2026-10-27 — R1, R2 and R3 done (PR #82 merged as 72ae2f3, its ci, CodeQL and sonarcloud runs green); R4 DONE 2026-10-30 (the owner's written confirmation: the private sibling's copies equal this repository's `2602416`, which carries F12 #90 and F13 #89); R5 DONE 2026-10-30 (`release` promoted to `115bbf8`, `release-distance` 0); R6's sweep-only stage scanned for the private sibling's consumers; R6 and the producer stages open (the barrier record: the Ubuntu dev VM open, the owner's Windows machine not tested).** Scope: the open part of
> [PLAN_test_leftovers_merged_core.md](PLAN_test_leftovers_merged_core.md) — the machine barrier on every machine that
> builds or tests this repository (`research/security/machines.md`), the merge of PR #82, the private sibling's side of the
> merged core's Definition of Done, the ONE promotion of `release`, and the consumer migration of
> [PLAN_test_leftovers_rollout.md](../todo/PLAN_test_leftovers_rollout.md). It edits no tool and no rule text.
>
> Related docs: [PLAN_test_leftovers_merged_core.md](PLAN_test_leftovers_merged_core.md) (the build, promoted 2026-10-27, with its
> deviations), [PLAN_test_leftovers_E1.md](PLAN_test_leftovers_E1.md) (the contract the build revised),
> [PLAN_test_leftovers_rollout.md](../todo/PLAN_test_leftovers_rollout.md) (the consumer epics, R6),
> [PLAN_test_leftovers_merged_core_followups.md](../todo/PLAN_test_leftovers_merged_core_followups.md) (F1–F13, none of which blocks this plan),
> [research/security/machines.md](security/machines.md) (the barrier record), [common/test-leftovers.md](../common/test-leftovers.md).
>
> The private sibling rule repository is never named here; it is "the private sibling".

## Plan changes

> Epoch 1 · approved 2026-10-27 · by reviewers · state: closed

- 1.1 · 2026-10-31 · owner · merge-conditions — a pin bump may merge alone in a consumer with no owner-blind sweeper and no owner form (R6, decision 1)
  (The same cause as the rollout plan's entry 1.2. Entries 1.1 to 1.6 are recorded late, on 2026-11-04: this plan
  was approved before the rule reached this repository, so its ledger should have opened at its first change after
  2026-10-29, which is entry 1.1. Each date is the day the change was accepted, as R6 and R7 record it.)
- 1.2 · 2026-10-31 · owner · contract — a Windows kernel owner in a ported helper needs the profile AND the owner SID, fail closed (R6, decision 2)
  (The same cause as the rollout plan's entry 1.3. The plan should have stopped here; it did not, and R7 was added
  and built after this point.)
- 1.3 · 2026-10-31 · owner · contract — the owner-blind class in C# and Rust flags any bare-prefix literal outside the helper's file (R6, decision 3)
  (The same cause as the rollout plan's entry 1.4.)
- 1.4 · 2026-11-01 · owner · epics, build-order, dod — R7 added: F17 to F20 fixed and released once before E5 and E2 wrap the Node reference
  (Question consultant 3ba92abb. No ledger recorded it as an entry; the rollout plan's epoch-2 re-review sorted its work.)
- 1.5 · 2026-11-01 · owner · scope — the core and detail split of common/test-leftovers.md rides R7's release
  (Question consultant e03cae48.)
- 1.6 · 2026-11-01 · owner · dod — the Darwin path of the C# helper is measured on a macOS leg and merged before E5 and E2 copy it
  (Not a change: the row of 2026-10-29 in the boundary table, the plan-change rule riding R5's promotion, which by its
  own words changed nothing in R5's what, when or done-when; and the R6 records of 2026-10-31, which apply the barrier
  as R6 already stated it.)

### Re-review for epoch 2

Narrowed: yes — R6 (the consumer migration) is handed over to the rollout plan, and its barrier order is read as that plan's merge condition (b), which blocks a producer only on the sweep-only stages that can reach its resources; the plan is promoted with R6 as an open tail

| Work | Where | Verdict | Action |
|---|---|---|---|
| #82 `72ae2f3`: the merged core; it created this plan (R3) | main, released in `115bbf8` | fits | kept |
| #87 `bae057f`: the boundary row "the plan-change rule rides R5" | main | fits | kept — not a change, by its own words |
| #88 `f9eca26`: the R3 record, F10–F13 parked | main | fits | kept |
| F13 #89 `6c3ebfc`, F12 #90 `2602416` (follow-ups work R4 and R5 cite) | main, released in `115bbf8` | fits | kept |
| #91 `115bbf8`: the R4 record (the judge recomputed two of its sha256 values at `2602416`: equal) | main, the R5 release sha | fits | kept |
| #92 `58e3f46`: the R5 record; promotion run 41089908585 (`e29883f` to `115bbf8`, success) | main and `release` | fits | kept |
| #93 `f46982f`: the owner's three decisions (entries 1.1–1.3) | main | fits | kept — the rollout plan's decisions 4 and 5 adopt them |
| #95 `c31f69d`: the sweep-only records of 2026-10-31 | main | fits | kept as a record; its "stage A empty" for coai and rag_qln is corrected in the rollout plan's epoch 3 (b) |
| #100 `7852de2`: the barrier opened, wave 1 merged | main | fits | kept |
| dew_flow_mcp #53 `6457540`, dew_flow_sidecar_rust #61 `17b18b3`: the E3 and E4 stories re-split | main of each | fits | kept |
| pins to `115bbf8`, each alone: mcp #57 `d2e62cf`, sidecar_rust #63 `1f55ebc`, benchmark #120 `44acabc`, creds #287 `5ea09e7` | main of each | fits | kept (entry 1.1) |
| dew_flow_benchmark #125 `6a963a4`: E6's stage A (lists, never removes) | main of dew_flow_benchmark | fits | kept |
| E3 dew_flow_mcp #58 `4feb245`, E4 dew_flow_sidecar_rust #64 `5478109` (merged 2026-10-31, after the unrecorded stop) | main of each | fits | kept — they meet (b), not R6 as written (§ Epoch 2, item 1); the Windows machine's part of (c) is the rollout plan's P1 |
| #101 `f996b68`: F17–F20 | main, released in `105d53c` | fits | kept |
| #102 `105d53c`: the core and detail split; promotion run 41302588544 (`115bbf8` to `105d53c`, success) | main and `release` | fits | kept — its span's sibling mirror is F26 |
| #103 `bec3df7`: the `r9700` token row (R7: rides the next promotion) | main, released in `5863c60` | fits | kept |
| pins to `105d53c`, each alone: creds #289 `47724fd`, rag_qln #78 `2936537`, vscode_kit #20 `7cab547`, benchmark #136 `0e0bdd8` | main of each | fits | kept |
| pins to `105d53c`, each alone: sidecar_rust #66 `e58be09`, mcp #60 `142d8d2`, wsl_care #182 `23859c4` (with its clock fix), coai #936 `df375eb` | main of each | fits | kept |
| dew_flow_mcp #59 `197cc76a`: the Darwin path of the C# helper (entry 1.6) | main of dew_flow_mcp | fits | kept |
| coai #938 `83f40529`: the root-down link walk (named in R7's record) | main of coai (merged 2026-11-01) | fits | kept — a security fix outside this plan |
| #104 `2d12d8f`: the R7 record, the Darwin item | main | fits | kept |
| coai #940 `d02ed40e`: E5's stage A, the age-only `coai-` sweep retired | main of coai (merged 2026-11-02) | fits | kept — the stage (b) relies on for E5 |
| coai #850 `ee7a7b70`, #942 `004c55fb`: the E5 stories (rollout work) | main of coai | cut | already corrected — #942 fixed #850, coai #943 `8dc0765c` fixed #942 (the rollout plan's epoch-3 and epoch-4 tables); no new PR |
| the stop commit `7e03915` (entries 1.1–1.6, state stopped) | pushed, branch `docs/promote-merged-core-release` | fits | kept — merges with epoch 2's line |
  (The Verdict and Action columns were filled by an Opus judge (step 5 of the full stop), 2026-11-04, against § Epoch 2.
  It checked each consumer pull request with gh (state, merge sha, merge time) and each sha here with git log. No merged
  work contradicts the revised plan; the breach is the timing that entry 1.2 names.)

> Epoch 2 · approved 2026-11-04 · by owner · state: open

## Symptom

PR #82 carries the whole merged core — the owner segment in the name, kernel ownership, three-valued liveness, one janitor, the
barrier scan, the shipped helper and guard — built, reviewed (coai code rounds `proceed`, 8 of 8 reviewers, twice; Opus review fixed;
Fable security pass SHIP at 3548691). What it could not do alone is the part that needs a machine, an administrator or another
repository:

- **The barrier is closed on one machine only, and three places of it are unread.** `research/security/machines.md` records the Ubuntu
  dev VM: every owner-blind line the user-scope scan found was read and none removes anything by the prefix, but `--system` needs
  root and three places (root's user systemd folder, another account's user systemd folder, `/var/spool/cron/crontabs`) are not read.
  The owner's Windows machine ran the suite on 2026-10-23 and has no record at all.
- **The private sibling has not rebuilt on the merged text.** The two spans must be byte-identical in both rule repositories, and the sibling
  must copy the two consumer files (`tools/lib/owned.mjs`, `tools/leftovers-check.mjs`) byte for byte and pin their sha256.
- **The release is not promoted, and a promotion reaches every consumer at once.** It turns `pin-check` red in every consumer.

What goes wrong if the order is not kept:

- **PR #82 merged before its barrier is closed** puts the first owner-form producer on a machine where an owner-blind sweeper may still be
  enabled. Such a sweeper matches the prefix with no owner segment after it, so it deletes ANOTHER user's live owner-form
  leftovers — a folder, a container, a volume of a run that is still going. The scan exists to find those sweepers first.
- **The release promoted before the sibling's confirmation** makes the two rule repositories disagree on the contract text for as long as
  the sibling takes, and every consumer that pins the release meets the disagreement.
- **The release promoted without a warning** turns `pin-check` red in every consumer with an open pull request, and each session that owns one
  finds out from a red check it did not cause.

## Goal

PR #82 merges with the barrier recorded for every machine that builds or tests this repository (or with the owner's written statement that a
machine no longer does); the private sibling's rebuild is byte-identical and confirmed; `release` is promoted ONCE; the consumer
migration starts with every sweep-only stage before any producer stage.

## Boundary with the plans around it (named on both sides)

| Item | Built by | The other plan's part |
|---|---|---|
| The tools, the rule texts, the scan, the vectors, the reviews and the security pass | [the merged-core plan](PLAN_test_leftovers_merged_core.md) (promoted) | Nothing here edits them; a defect found while running R1–R5 is a new commit on PR #82's branch or a follow-up, never a story here |
| The findings the security pass parked, the stub-docker gaps, the Windows run | [the follow-ups plan](../todo/PLAN_test_leftovers_merged_core_followups.md) F1–F13 | None blocks R1–R6. F9 (the Windows run) is the evidence for a Windows machine's janitor switch; R2 only records that machine's barrier |
| The consumers' resources, ports, pin bumps | [the rollout plan](../todo/PLAN_test_leftovers_rollout.md) epics E2–E7 | R6 is its two-stage rule; this plan carries the order, the rollout plan carries each epic's content — **superseded 2026-11-04 (§ *Epoch 2*): R6 is handed over; the order and the merge conditions are the rollout plan's** |
| The plan-change rule and its ledger check (#86, merged after #82) | [the plan-change-control plan](PLAN_plan_change_control.md) (promoted) | Rides in R5's one promotion — no change to R5's what, when or done-when; owner decision 2026-10-29 |

Order: R1 and R2 (parallel), R3, R4 (parallel with R1–R3 for its copy part), R5, R6. Disjoint: nothing here edits a consumer repository.

## Growth surface

None: a few lines in `research/security/machines.md` per machine, and documents. Nothing here creates a table, a directory of artefacts, a
cache or a process.

## Epoch 2 — the plan as revised at the re-review (2026-11-04)

The whole plan read again against what is known now, as step 4 of the full stop asks (`common/plan-change-control.md`), over the
six entries of epoch 1. This section is the baseline epoch 2 is approved on; the sections above and below keep the measured
facts, with what this section supersedes marked in place. The re-review consultant was `006298a8` (Codex); the question
consultants `e40c6313` and `5e6e52c5` were asked first whether to promote and how to count.

### 1. What this plan is now

- **Done:** R1–R5 (the barrier records, PR #82, the private sibling's confirmation, `release` at `115bbf8`), R7 (`release` at
  `105d53c`, every consumer's pin bump) and the Darwin path of the C# helper (dew_flow_mcp #59). Entries 1.4–1.6 are the
  owner's decisions of 2026-11-01 that added them; all three are built and recorded.
- **R6 is handed over** to [the rollout plan](../todo/PLAN_test_leftovers_rollout.md). Its content (E2–E7), its order and its
  merge conditions have lived there since that plan's epoch 2 (2026-11-01). This plan kept only a pointer and the owner's
  three decisions of 2026-10-31 (entries 1.1–1.3), which the rollout plan records as its entries 1.2–1.4 and took as its
  decisions 4 and 5. From epoch 2 this plan holds no open work.
- **Goal (revised).** R1–R5 and R7 as written. R6's part of the goal — "the consumer migration starts with every sweep-only
  stage before any producer stage" — is met as a START only when the order is read as the rollout plan's condition (b)
  (item 2): wave 1 (E3 dew_flow_mcp #58 and E4 dew_flow_sidecar_rust #64) merged on 2026-10-31, before coai's age-only
  `coai-` sweep was retired (coai #940, 2026-11-02) and while E7's stage A is still open. Neither of those sweeps can reach
  a `testsToDelete-` name of mcp or sidecar_rust, so wave 1 meets (b), not R6 as written. The migration's completion is
  the rollout plan's goal, not this plan's.

### 2. What the hand-over narrows (so `Narrowed: yes`)

- **R6's barrier order.** R6 says every consumer's sweep-only stage lands before ANY producer stage. The rollout plan's
  merge condition (b), as corrected in its epoch 3 (approved by the owner 2026-11-03), asks only for the sweep-only stage of
  every consumer whose sweep can REACH the resources this producer makes. E7's stage A (rag_qln's owner-blind `qlntest_*`
  drop) is still open, and under (b) it blocks E7's producer, not E2's or E5's. This plan adopts (b). The per-machine
  barrier checklist and the scan evidence stay (the rollout plan's condition (c) and P1).
- **The promotion condition.** "Promoted … when R6 is done" is superseded: the plan is promoted with R6 as an open tail,
  as `common/planning-docs.md` § *Partially implemented plans* asks.
- Nothing else gets smaller: R7's "every consumer's pin bump is listed" holds for `105d53c`, and the later releases'
  bumps are recorded in the rollout plan.
- **One gap found, not made, by the re-review.** R4's confirmation covers the private sibling's spans at `2602416` only;
  the spans changed by the core split (`105d53c`), the baseline rule (`5863c60`) and F24 have no recorded mirror, and the
  rollout plan points the baseline's mirror at "R4". It is parked as F26 of
  [the follow-ups plan](../todo/PLAN_test_leftovers_merged_core_followups.md), the owner's. Until F26 records a mirror, R4's
  guarantee ("one text in two repositories") holds at `2602416` only; for every span changed after it, this repository's
  text is the authoritative one, because the private sibling copies it byte for byte (plan gate finding 5).

### 3. How R6 is closed

R6's box is ticked in this plan's research record together with the rollout plan's final completion record, once that
plan's OTHER Definition of Done conditions hold. Neither plan waits for the other's box. A ticked box is not a change in
either plan, so the rollout plan's line "the remainder plan's R6 is ticked" stands as written.

### 4. Build order and merge conditions

The rollout plan's (§ *Epoch 4*, items 3 and 5). This plan's § *Build order* and R6 are kept as the record.

### 5. What the re-review consultant raised, and what was done with it

| Point (consult `006298a8`) | Verified | Taken |
|---|---|---|
| (a) "the barrier rule is kept" hides a narrowing: the rollout plan's (b) lets E2 and E5 producers merge while E7's stage A is open | yes — the rollout plan, § *Epoch 3*, item 3 (b) | yes — item 2, and the `Narrowed` line |
| (b) no obligation of the six entries is lost: the rollout plan's decisions 4–5 and its epoch-2 table hold the split, the Darwin helper and the eight R7 pin bumps; the 2026-10-31 rescan is done evidence, not open work | yes — the rollout plan's epoch-2 table and § *Epoch 2* item 1 | yes — item 1 |
| (c) no code cut is evident, but carry the rollout plan's epoch-3 and epoch-4 dispositions (coai #850, #942) into the judge's table rather than "all fits" | yes — those rows are in the rollout plan's re-review tables | yes — the judge read them |
| (d) avoid a circular completion: tick R6 with the rollout plan's final record, once its other conditions hold | yes — the rollout plan's last DoD line waits for R6's box | yes — item 3 |

Rejected: nothing.

### 6. The re-review plan gate (2026-11-04, coai session `8207413f`, 2 of 2 reviewers, `proceed`, 5 gating against 6)

| Finding | Verified | Taken |
|---|---|---|
| 0 — require the sibling's span confirmation for `105d53c` and `5863c60` before promoting or merging consumer epics | the gap, yes (F26); the fix would block nothing this repository can move | rejected — the rollout plan's DoD already blocks E5's producer on the baseline mirror; more blocks would change that plan; finding 5 states the guarantee |
| 1 — R6 and the rollout plan wait for each other's box | no — item 3 ticks R6 once the rollout plan's OTHER conditions hold | rejected — ticking R6 at hand-over would record an open migration as done |
| 2 — § Build order keeps the old order | yes | accepted — § Build order marked superseded |
| 3 — R2 and R3 let PR #82 merge while the Windows barrier was closed | yes, by the owner's decisions of 2026-10-27 (R2, F9), with the private-temp condition | rejected — done work, no contradiction; the rollout plan's P1 and condition (c) gate every further producer |
| 4 — R2's owner-named inventory cannot prove coverage | it is the owner's written statement, recorded | rejected — the rollout plan's condition (c) asks for every machine that builds or tests the producing repository |
| 5 — R4 is done while later spans have no recorded mirror; narrow the guarantee and name the authoritative text | yes | accepted — item 2 |

The gate's operator commands (split into two or three epics, Fable for the split, cadence consults) do not fit a re-review
with nothing left to build; none was applied, and this sentence is the record of that decision.

### 7. Question for the owner (blocking)

*Answered 2026-11-04:* 1 — approved by the owner, as narrowed; the plan is promoted with R6 as an open tail.

1. **Approve epoch 2 as narrowed?** R6 handed over to the rollout plan; its barrier order read as the rollout plan's (b);
   the plan promoted with R6 as an open tail. *Recommended:* yes — every obligation R6 carried is already in the rollout
   plan, which the owner approved on 2026-11-03.

## Items

### R1 — S0 on the recorded machine: the three root-only places

- **What.** An administrator runs `node tools/sweeper-scan.mjs --system` as root, from a checkout of PR #82's branch (the scan does not exist
  on `main` yet), and adds the outcome to the machine's section of `research/security/machines.md`: the commit, the exit code, and each line
  resolved or attested by name. Those three places are the only ones the unprivileged scan could not read.
- **Why.** An unread place is unread evidence. The barrier is never declared open on it (merged-core plan, § *Barrier checklist*, last line).
- **When.** Before R3. Needs an administrator on that machine.
- **Done when.** The section says the three places were read, with the scan commit and its exit code; or it names each one still unread and
  who attested for it. A record without the scan commit does not count.
- **Done, 2026-10-27.** Root scan at `e20561f`: none found, 288 files read, exit 0 — recorded in `research/security/machines.md`.

### R2 — S0 on every other machine

- **What.** For every other machine that builds or tests this repository — the owner's Windows machine of 2026-10-23, any persistent
  self-hosted runner, any other developer machine — either add a section to `research/security/machines.md` (host name, OS, the OS users
  that build or test here, the date, the commit of the scan, the scan's outcome, each attestation by name for what it could not read,
  the manual items of the checklist), or the owner states in the record that the machine no longer builds or tests this repository. Until a
  machine's barrier is open it runs this repository's tests only with `TMPDIR`, `TEMP` and `TMP` set to a private folder (mode 0700) under the
  user's own home, and its section says so.
- **Why.** "A machine with no section here is a machine whose barrier is closed" — only if somebody asked about it. A machine nobody lists
  is one whose old sweeper nobody has looked for.
- **When.** Before R3. The owner names the machines; a GitHub-hosted runner is out of scope (one job's, discarded with it, never shared by two OS users).
- **Done when.** Every machine the owner names has a section or a written statement.
- **Done, 2026-10-27.** The owner named one other machine, the Windows machine, and stated it was not tested; its section records the barrier there as closed and the private-temp-folder condition. No other machine was named.

### R3 — PR #82 merges

- **What.** Merge PR #82 once R1 and R2 are done and the Linux suite is green on the commit that merges.
- **Why.** The PR makes this repository the first owner-form producer.
- **When.** After R1 and R2. The Windows run is not a condition (owner decision 2026-10-27, F9).
- **Done when.** The merge commit's CI run is green (state the sha); `node tools/plan-lifecycle.mjs` is clean on `main`.
- **Done, 2026-10-27.** Merged as `72ae2f3` (merged 18:36 UTC); its `ci`, `CodeQL` and `sonarcloud` runs on that commit are green; `node tools/plan-lifecycle.mjs` on a clean copy of `main` is clean.

### R4 — The private sibling's side

- **What.** The private sibling's rebuild carries the two rule spans byte-identical to this repository's (its own check reports both
  spans equal); it copies `tools/lib/owned.mjs` and `tools/leftovers-check.mjs` byte for byte and pins their sha256, beside the janitor it
  already pins; and the sibling's owner confirms in writing that its rebuild is done, before R5.
- **Why.** One text in two repositories is the point of the merge. A silent drift here is found by a consumer, late.
- **When.** After PR #82 is reviewed; the copy part may run in parallel with R1–R3 from the PR's branch, the confirmation after R3.
- **Done when.** The sibling's confirmation exists, naming the sha256 of each copied file and of the two spans. This public repository
  names none of the sibling's own files or checks; the confirmation is quoted as a decision, not as a source.
- **State, 2026-10-27.** The private sibling's rebuild is built from this repository's `72ae2f3` and reviewed (its multi-model gate `proceed` twice, an Opus review and a security pass, both "ship with fixes", the fixes made); its pull request waits for its owner. Its pins record the sha256 of each copied file and of the three spans; the written confirmation this item asks for is still missing. Two findings of that review belong to this repository and are parked here as F10 and F11 of the follow-ups plan.
- **Done, 2026-10-30.** The first rebuild was merged in the private sibling; it then re-copied this repository's tools at `2602416` (after F13 #89 and F12 #90), so one text is released, not two. The owner's confirmation, quoted as a decision: *the private sibling's rebuild is done; its copies equal this repository at `2602416`* —
  - `tools/lib/owned.mjs` `2f83de3ffb8eca2d1d5c40ed95ed7414a377eacdb5375e68a3949441b2d6fbfb`
  - `tools/leftovers-check.mjs` `477443f30700c4a016d044c28ddfdca7753e75ef4f0c44fddc15c9bcd04e90f3`
  - `tools/lib/sweeper-scan.mjs` `7f93b14eeffb0642d860ebc2d62a2ba558157b05add0940f464c794fefc1c564`
  - `tools/lib/prefix-bindings.mjs` `34d2b01ab7f2c8fda627aef227909a1af86be1f6c8573860619b851681259e43`
  - `tools/lib/rule-body.mjs` `37c8c00b1dc4801f283913d1794bc7f4f81349f7f7f06c958b06c530f7df7d23`
  - the two rule spans of `common/test-leftovers.md`: 27314 bytes `35a8bf3d72b0bda46d08dd26a2836b4759f1f73c91e794358e3108bd6a41d00d` and 1872 bytes `f136caee10af20c47512c2feda2e749d2495fbd5d04081dee3b244c0d3e2522f`; the janitor companion's span: 14103 bytes `b31585f932ac860de6189cc65bbb95cfa6b681d34c5ec2c861eeb4612d233e29`.
  Each value was recomputed 2026-10-30 from this repository at `2602416` (`git show 2602416:<path> | sha256sum`; each span is the LF text between `<!-- core:begin -->` and `<!-- core:end -->`) and equals the confirmation. The other seven files the sibling copies are unchanged since `72ae2f3`. R5 may run.

### R5 — S7: ONE promotion of `release`

- **What.** After R3 and R4: warn the sessions that own open consumer pull requests (a promotion turns `pin-check` red in every consumer),
  then, once the `ci` run for the merged `main` sha is green,
  `gh workflow run promote-release.yml --ref main -f "sha=<40-hex>" -f reason="test-leftovers: the merged core — owner segment, kernel ownership, three-valued liveness, one janitor, the shipped helper and guard"`, and
  `node tools/release-distance.mjs` after it.
- **Why.** Every consumer migrates once, on one text.
- **When.** After R3 and R4; never before. The warning goes out before the dispatch, not after.
- **Done when.** `release` is at the merged sha, `release-distance` reports 0, and the warning's recipients and date are recorded here.
- **Done, 2026-10-30.** The warning went out before the dispatch: a comment on each of the 27 open consumer pull requests not opened
  by dependabot or release-please (dew_flow_rag_qln #67; dew_flow_mcp #53; dew_flow_sidecar_rust #61; dew_flow_benchmark #103, #111;
  dew_flow_creds_for_devs #253; dew_flow_vscode_kit #19; wsl_care #162, #174, #178, #179, #180, #181; dew_flow_connect_other_ais #850,
  #909, #911, #918, #919, #920, #922, #923, #924, #925, #926, #927, #928, #930), and a message to the four Claude sessions then open on the
  operator's WSL machine. `promote-release.mjs --dry-run` passed (`ci` green on `115bbf8`), and the dispatch
  ([run 41089908585](https://github.com/oleksandrdubyna88/dew_flow_conventions/actions/runs/41089908585)) moved `release` from `e29883f` to
  `115bbf8` (+16 commits, #78 to #91: among them E1 `2c96f83`, the merged core #82, F13 #89 and F12 #90). `release-distance`: OK, 0 commits behind main.

### R6 — The consumer migration

> **Handed over 2026-11-04 (§ *Epoch 2*).** The open tail of this plan lives in [the rollout plan](../todo/PLAN_test_leftovers_rollout.md);
> its barrier order is read as that plan's merge condition (b). The records below stay as written.

- **What.** The epics E2–E7 of [the rollout plan](../todo/PLAN_test_leftovers_rollout.md), in two stages: every consumer's SWEEP-ONLY stage (its
  owner-blind sweeps replaced or disabled as a committed, merged change; no owner-form producer) lands before ANY producer stage (pin bump,
  rename and helper/guard port in ONE commit). A sweep-only stage needs no release and may be prepared before R5.
- **Why.** An owner-form producer beside an owner-blind sweeper is the failure of the Symptom.
- **When.** Sweep-only stages: any time. Producer stages: after R5 and after every sweep-only stage.
- **Done when.** The rollout plan's own Definition of Done.
- **Sweep-only stage, 2026-10-27.** This repository's barrier scan (`tools/sweeper-scan.mjs` at `72ae2f3`) over the default branch of each of the private sibling's ten consumers found no enabled owner-blind sweeper: six had no line at all; in four, the lines it listed only count, match or validate names, and one removes one fixed file it has just made. Corrected later on 2026-10-27, after the private sibling's stories were rewritten: of its ten consumers, one had already merged its sweep-only stage, two need one (one removes a sweep that deletes by age with a name built from a variable — a shape this repository's scan missed, F12; one rewrites two listed text lines so the machine-wide scan lists nothing), and seven have an empty stage A. Each other listed line is a guard finding for that consumer's producer stage. This repository's own seven consumers are not checked out on the machine that ran the scan, so their sweep-only stage is not recorded yet.
- **Owner decisions, 2026-10-31** (wave 1 of R6: E3 in dew_flow_mcp, E4 in dew_flow_sidecar_rust; the question consultant `0cf2d245` first,
  then the owner):
  1. **A pin bump may merge alone** in a consumer that has no owner-blind sweeper and emits no owner form: a pin bump creates no owner-form
     name, so it does not cross the barrier, and a required `pin-check` stays red on every pull request of that consumer until the pin moves.
     The producer stage is then the rename plus the helper/guard port in one commit. Both consultants agreed. Applied: dew_flow_benchmark #120
     (2026-10-30, before this record), dew_flow_mcp #57, dew_flow_sidecar_rust #63.
  2. **The Windows kernel owner in a ported helper** is judged by both keys: the path is inside the caller's profile AND the file's owner SID is
     the caller's; either one unreadable fails closed. The reference helper checks the profile alone ([F16 of the follow-ups](../todo/PLAN_test_leftovers_merged_core_followups.md)).
  3. **The `owner-blind` class in C# and Rust source** is checked on literals, with no binding tracer: any literal of the bare prefix outside the
     helper's own file is a finding, so a constant cannot carry the prefix to a sweep (the shape of F12). Scripts keep the shipped tracer.
- **Sweep-only stage, 2026-10-31.** dew_flow_mcp (`b352881`) and dew_flow_sidecar_rust (`1c1282e`): `tools/sweeper-scan.mjs` at `115bbf8` found
  none (103 and 104 files read); their stage A is empty. Their stories documents (mcp #53, sidecar_rust #61) were written against E1 and are
  re-split against `115bbf8` before any producer code.
- **Sweep-only stage of this repository's six other consumers, 2026-10-31** (`tools/sweeper-scan.mjs` at `115bbf8` over each default branch,
  every listed line read by hand):
  - dew_flow_creds_for_devs `0fa2ee3`, dew_flow_rag_qln `9100184`, dew_flow_vscode_kit `1d2681c`: none found — stage A empty.
  - dew_flow_connect_other_ais `80b829ef`: two lines, both test assertions (`scripts/lib/transcript-sanitise.test.mjs:686` asserts stderr names no
    path; `src_vs_code/src/test/runTemp.test.mjs:149` asserts the temp root holds no prefixed entry) — no removal; stage A empty.
  - wsl_care `2bbd8d3`: two lines, the daemon's never-match protection list (`contracts/config-keys.json:778`) and its test inputs
    (`TempRulesTests.cs:97`) — the opposite of a sweeper; stage A empty.
  - dew_flow_benchmark `a504cfe`: ONE enabled owner-blind sweeper, `spikes/minigit-bench/lib/heldout-run.mjs` `sweepLeftovers` (every
    `<workRoot>/testsToDelete-*` older than a day; `--work-root` reaches it without `assertWorkRoot`). The question consultant (`b5e46ce4`, both
    rows) held that it closes the barrier and that report-only is the smallest fix. Stage A landed as dew_flow_benchmark #125 (`6a963a4`): the
    sweep LISTS every `testsToDelete*` entry and never removes it; the scan still lists the listing line (`heldout-run.mjs:95`), which deletes
    nothing, deliberately not hidden from the scan. The other three listed lines there are a comment, an assertion and a regex check.
- **The machine scan, 2026-10-31** (`tools/sweeper-scan.mjs --root ~/git` on the operator's WSL machine, every checkout and worktree; no crontab,
  no user timer touches a sweep): every listed line is one of the non-removing lines above, the doc comment of E3's owner-aware pattern
  (`Owned.cs:82`), or a copy of the OLD `sweepLeftovers`. The live copies took `main` (#123, #124, `r9700-night`, `ma-e4`, `ma-e4-build`; the main
  checkout fast-forwarded). Three places the scan could not read are one static HTML asset over 4 MiB in three vllm checkouts (not code).
  **Open:** 13 stale, clean worktrees of ended sessions under `~/git/dew_flow_benchmark-wt/` still hold the old copy (`lmc-part6`, `ma-e2`,
  `ma-e2s0`…`ma-e2s8`, `model-arms`, `plan-git-path`; every tip on origin, only `bin/`/`obj/` ignored). The consultant (`46fdf0a4`, both rows)
  held that an attestation does not open the barrier; removing the worktrees (branches kept) was refused by the permission system as another
  session's work, so it is the owner's. **No producer stage merges until a rescan finds no deleting copy and every place it cannot read is read or attested by name** (the three
  vllm assets above are attested).
- **The barrier opened, 2026-10-31.** The owner removed the 13 stale worktrees; the rescan (`tools/sweeper-scan.mjs --root ~/git`) finds no
  deleting copy — every listed line is one of the non-removing lines above (the experiment copies of coai list the same stderr assertion at
  `:629`), and the three unreadable places are the attested vllm asset. **Wave 1 merged:** E3 as dew_flow_mcp #58 (`4feb245`) and E4 as
  dew_flow_sidecar_rust #64 (`5478109`), each after its coai plan and code gates, an Opus review and green Linux and Windows legs. The
  one-time hand clean-up on this machine is recorded on each PR as retained: 682 old `mcp-*` folders and `outside.txt`, and old
  `bge-log-*`/`bge-seed-*` folders, all the owner's to remove by hand.

### R7 — The second release: the reference hardened before the Node consumers wrap it

- **What.** Owner decision of 2026-11-01 (the question consultant `3ba92abb` first, both rows): before coai (E5) and creds (E2) wrap
  the shipped Node reference, F17–F20 of the follow-ups plan are fixed here, merged, and released ONCE through the same promotion as R5
  (the warning to the sessions that own open consumer pull requests first, then `promote-release.yml`, then `release-distance`). The same release carries the split of `common/test-leftovers.md` into a core and a detail companion (owner decision 2026-11-01, consultant `e03cae48`), so coai's reviewers can see the core. Every
  consumer then bumps its pin to that release (a pin bump alone, as decided for R6). F16 (the Windows owner SID) stays open: Node cannot
  read a SID without a native addon or a child process.
- **Also decided 2026-11-01.** The C# helper of E3 gains a Darwin path (lstat with the symbol per CPU, a `kill(pid, 0)` probe, no start
  time — rule §3 allows it off Linux), measured on a macOS CI leg and back-ported to dew_flow_mcp, because coai and creds run C# suites on
  macOS; E5 and E2 copy it from there.
- **Why.** Decision 11 of the merged core: Node consumers wrap and run the reference, never port it. A defect in the reference is a
  defect in every Node consumer at once; the ports already fixed these.
- **When.** After F17–F20 merge on `main`; before the producer stage of E5 or E2.
- **Done when.** `release` is at the merged sha, `release-distance` reports 0, the warning's recipients and date are recorded here, and
  every consumer's pin bump is listed.
- **Done 2026-11-01.**
  - *Warning.* 11:35 UTC, before the promotion, to the sessions "vllm fix", "dew-flow-conventions-2f", "kimi" and "C# vs Node". Before benchmark
    #136 merged (11:47 UTC), "C# vs Node" and "kimi" were told again, as they asked.
  - *Promotion.* `release` moved from `115bbf8` to `105d53c` (F17–F20 in #101, the core split in #102); `promote-release.yml` run 41302588544,
    success. `release-distance` read 0 right after it. It reads 1 now: #103 (`bec3df7`, the `r9700` token row) merged on `main` later and rides the
    next promotion; the "vllm fix" session is told when `release` moves.
  - *Pin bumps to `105d53c`, each merged alone:* dew_flow_creds_for_devs #289 (`47724fd`), dew_flow_rag_qln #78 (`2936537`),
    dew_flow_vscode_kit #20 (`7cab547`), dew_flow_benchmark #136 (`0e0bdd8`), dew_flow_sidecar_rust #66 (`e58be09`), dew_flow_mcp #60
    (`142d8d2`), wsl_care #182 (`23859c4`), dew_flow_connect_other_ais #936 (`df375eb`).
  - *Found while pinning.* wsl_care #182 also carries a test fix: `ActWindowsTests` dated its folder from the real clock while the host reads
    `FixedTimeProvider.DefaultNow` (2026-10-02), so from 2026-11-01 the folder was no longer older than "now" and the Windows leg previewed
    0 objects. The folder is now dated from `DefaultNow`. coai #936 merged before two CodeRabbit review-body notes were read; both were checked
    afterward, and the one doc figure they found is fixed in coai #938. Lesson kept: read the review bodies, not only the inline comments,
    before a merge.

## Build order

*Superseded 2026-11-04 (§ Epoch 2, item 4; plan gate finding 2):* R1–R5, R7 and the Darwin path are done; what is left of
R6 runs in the rollout plan's order (its § *Epoch 4*, item 5), with its merge condition (b) in place of "every sweep-only
stage before any producer stage". The order below is kept as the record.

R1 ∥ R2 → R3 → R5 → R6 (sweep-only stages; producer stages except E5 and E2), then R7 (F17–F20 and the core split merged on `main`,
one promotion, the pin bumps) and the Darwin path in dew_flow_mcp → the producer stages of E5 and E2. R4 running beside R1–R3 and finishing before R5. Nothing is built: each item is a run, a record, a merge or a
dispatch.

## Test plan

On the checkout that carries PR #82's branch, then on `main` after R3:

```
node tools/plan-lifecycle.mjs
node tools/leftovers-check.mjs
nice -n 19 node tools/sweeper-scan.mjs --root .
nice -n 19 node tools/rules.mjs check --repo .
nice -n 19 npm test
node tools/release-distance.mjs          # after R5 only
```

On each machine of R1 and R2: `node tools/sweeper-scan.mjs --root <checkouts parent>` as the developer, `--system` as an administrator, from a
checkout of the PR's branch. Their outcome is recorded by hand; the scan itself is covered by `tools/sweeper-scan.test.mjs`.

## Definition of Done

- [x] R1: the three root-only places are read (or attested by name), the scan commit and exit code recorded.
- [x] R2: every machine the owner names has a section in `research/security/machines.md`, or a written statement that it no longer builds or tests here.
- [x] R3: PR #82 merged; the merge commit's `ci` run green (the sha stated).
- [x] R4: the private sibling's confirmation exists (both spans byte-identical; the two consumer files copied with their sha256 pinned).
- [x] R5: the warning went to the sessions with open consumer pull requests; `release` promoted once; `release-distance` 0.
- [ ] R6: every sweep-only stage merged before any producer stage; the rollout plan's Definition of Done met.
      *Handed over 2026-11-04 (§ Epoch 2):* the open tail of this plan. Ticked together with the rollout plan's final
      completion record, once that plan's other conditions hold; the barrier order is read as its merge condition (b).
- [x] R7: F17–F20 and the test-leftovers core split released once; every consumer pinned to that release (each pin bump merges alone, after the
      release and before that consumer's producer stage).
- [x] The Darwin path of the C# helper: measured on a macOS CI leg and merged in dew_flow_mcp before E5 and E2 copy the helper.
      Done 2026-11-01: dew_flow_mcp #59 (`197cc76a`), its macOS job green. The macOS runs also found that a request was walked through the
      root's spelling, so `/var` → `/private/var` spent one hop of the link budget; both readers (mcp, and coai #938) now walk from the
      resolved root. The follow-ups, and what was never measured (X64, Rosetta), are in that repository's `research/PLAN_test_leftovers_E3.md`.
- [x] This plan is promoted to `research/` with its deviations, or deleted with a recorded reason, when R6 is done; its row in `todo/README.md` goes with it.
      *Superseded 2026-11-04 (§ Epoch 2):* promoted with R6 as an open tail, once epoch 2 is approved. Done 2026-11-04.
