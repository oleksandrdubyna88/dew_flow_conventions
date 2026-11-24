# PLAN — every consumer's tests name what they leave behind `testsToDelete-…`

> Status: **IMPLEMENTED in part, and CLOSED by the owner 2026-11-24 — what is done and what is not: § *Closure*.** E1–E5 are done; E6 is done but for S7; E7 is done but for S2; the feature reviews were not run.
>
> Was: **epoch 12 open (2026-11-17), approved by the owner (`Narrowed: yes`); 1 change (12.1, 2026-11-18: S6 merges with every whole suite green, the runs without an own `TMPDIR`, the host's dotnet packs back to 10.0.14), so the next accepted change is the twelfth full stop.** Next: E6's stories and S6's brief take 12.1, the owner downgrades the packs, then S6's plan gate. *Was:* "0 changes, so the next accepted change counts as 12.1. Next: the E6 stories amendment PR, the E7 amendment, S6's brief rework and base runs." (The owner answered item 7 the same day: question 1 approved as written, question (a) yes; question (b) stays for S6's merge.)
>
> Was: **epoch 11 STOPPED for re-review (2026-11-17); the re-review is written (§ *Epoch 12*, 2026-11-17, `Narrowed: yes`); no new code on any epic until epoch 12 opens by the owner.** Entry 11.2 (E6.S6's two runner lines go to the language-comparison plan) was the eleventh full stop. The revision: S6 merges with those two C# `raw-temp` findings on an approved standing list of exactly two and with policy-ab-quick's three named pre-existing failures, and S7 now also waits for the language-comparison plan's disposition of the two lines with the repository guard clean (items 4.1, 4.6; the record for epoch 3 is the precedent); every remaining story's *Files* become bounded folders plus the docs a grep at its base finds, its line lists and counts are observations at a SHA, and its *Done when* reads "zero unexplained findings of both guards in scope; each remaining one an individually approved, listed exception", with what still counts as a change listed (item 8.1); the `minigit-bench` and `lang-explore` whole suites start the system interpreter, which no allowance covers (item 7, question (a)). Re-review consult `59b325a3`. The Opus judge sorted epoch 11's work (`82c5a4b`: 11 fit, 3 cut by a fix forward, 2 outside, nothing reverted); after it, row E6-m was widened to the pre-existing failures S6's base runs record (benchmark #222's body: lang-explore 10 of 991, lang-bench 1 of 2394 on `main`), and every whole run takes an owned `TMPDIR`. The plan gate read the operative extract of `7254d77` and `06225b48` (session `10853099`, `proceed`): G1 and G3 accepted and folded into row E6-m (both runs complete, executed and skipped tests reconciled by name; a timing-list test that passed at base and fails at head goes by the S5 list's rule), G2 rejected (alias-safe `BENCH_PILOT_OUT` is built, #221). An independent Opus review (of `7c22aa1` and benchmark `7dcdffd9`) said "do not approve as written", and "approve with fixes" once B1 and B2 are fixed: both are folded, with S-1 to S-9 and N-1 to N-4 (the record's review note): row E6-m's standing failures are EXACTLY policy-ab-quick's three and the base lists the owner confirms within benchmark #222's counts (lang-explore ≤ 10, lang-bench ≤ 1, minigit-bench 0), the S5 timing list approves nothing, and the owned `TMPDIR` may keep only F2's named makers' entries. A second plan-gate round (`a0abb03e`, `proceed`, one reviewer answered) found that S6's claimed folders under `~` and `/var/tmp` are never swept after a kill; declared as one bounded exception (the Narrowed line, item 1's *Goal*, item 4.6 (3)). Next: the owner's approval and answers (item 7); epoch 12 opens `by owner`, at 0 changes. *Was:* "Next: the owner's approval and answers (item 7)"; before it, "Next: an independent Opus review, then the owner's approval and answers (item 7)"; before it, "Next: the plan gate on the operative extract, then the owner's approval and answers (item 7)"; before it, "Next: the Opus judge's verdicts (the record's table), the plan gate on the operative extract, the owner's approval and answer".
>
> Was: **epoch 11 STOPPED for re-review (2026-11-17): its second change, entry 11.2 (E6.S6's two runner lines go to the language-comparison plan), is the eleventh full stop; no new code on any epic until the re-review.** Done in epoch 11 before the stop: E6.S4 (#221), E6.S5 (#223), the E6/E7 stories (#220, #128), follow-ups F45/F46 (#178), rag_qln's pins (#129–#131).
>
> Was: **epoch 11 open (2026-11-17, by the owner, `Narrowed: yes`); entry 11.1 recorded the same day (E6.S4's *Files* gains four doc lines), so the next accepted change is the eleventh full stop.** Next: S4's plan gate on its reworked brief, then S4.
>
> Was: **epoch 11 open (2026-11-17), approved by the owner after the tenth re-review (`Narrowed: yes`: the Definition of Done's first item admits the M2/M3 pilot scaffolds' operator-retained output, row E6-l, item 4.3); 0 changes, so the next accepted change counts as 11.1.** Next: the E6 stories amendment PR, then the E7 stories amendment (item 4.4), the S4 brief's rework and its gate, then S4.
>
> Was: **epoch 10 STOPPED for re-review (2026-11-17): its second change, entry 10.2 (E6.S4's pilot scaffolds need a disposition the story does not have), is the tenth full stop; no new code on any epic until the re-review.** Done in epoch 10 before the stop: E6 and E7 stories amended (#217, #122), F42-c (#218), E6.S3 (#219), E7.S3–S5 (#125), rag_qln's pins (#123, #127). The re-review is written (§ *Epoch 11*, 2026-11-17; `Narrowed: yes`, the Definition of Done's first item read with ONE further documented exemption, the two pilot scaffolds' operator-retained output; re-review consult `a6cfcc53`, `120652b8`): E6.S4's sites take a disposition by lifetime, and what must outlive the run (the M2 and M3 pilot scaffolds) goes to an operator-named folder from the required `BENCH_PILOT_OUT`, unprefixed, never the temp root (row E6-l); row E6-i reads both guards with counts; S5–S7 and E7.S2 are re-read and twelve texts that would stop a later brief are folded (E11-1 to E11-12); the feasibility claims the remaining stories rely on were observed during the re-review (§ *Epoch 11* item 3.3); the Opus judge sorted epoch 10's work (11 fit, 3 cut by a fix forward, 1 outside); the plan gate passed (`d8e14338`, `proceed`, three findings accepted); an independent Opus review said "do not approve as written", and its findings B1, B2, S1–S7 and N1–N5 are folded, each fix observed first (§ *Epoch 11* items 3.3, 3.4; no counted change); the second plan-gate round passed (`a209b8e4`, `proceed`, G1–G3 accepted, with the reviewer's re-check folded, text only); next: the owner's approval and the owner's 9p question (item 7); epoch 11 opens by the owner at 0 changes.
>
> Was: **epoch 10 open (2026-11-16), approved by the reviewers after the ninth re-review (`Narrowed: no`; the Opus judge: 11 fit, 5 cut by a fix forward or a local rewrite; plan gate `c6131b05`, `proceed`; an independent Opus review), with ONE change, entry 10.1 (2026-11-16: E6-f2's configuration counterexample has no instance at Testcontainers 4.16.0); the next accepted change is the tenth full stop.** § *Epoch 10* is the plan now: a claim about a copied tool is observed before the gate of the story or brief that relies on it (item 8.1); E6's and E7's stories are amended in new PRs first; then F42-c, E6.S3 and E7.S3–S5 (the `external/` exclusion root-scoped, in S3); E7.S2 waits for the owner's live observations.
>
> Was: **epoch 9 STOPPED for re-review (2026-11-16): its second change, entry 9.2 (E7's stories model the copied C# guard's walk over `external/` wrongly), is the ninth full stop; no new code on any epic until the re-review.** Was: **epoch 9 open (2026-11-16), approved by the reviewers after the re-review (`Narrowed: no`; plan gate `b6933e14`, `proceed`; an independent Opus review), with ONE change, entry 9.1 (2026-11-16: F42-c needs benchmark-own touches its § 6 excluded); the next accepted change is the ninth full stop.** The revision is § *Epoch 9*: `container-scoped` becomes an exemption kind of its own in both guards (F41 in conventions, F42 in mcp, where N1–N5 were each tried first: N1, N4 and N5 reproduced and fixed, N2 did not reproduce, N3 is a Windows pin), row E6-f is split into E6-f1 (the marker, file-scoped) and E6-f2 (the container ends with the fixture; reuse proved at run time), E7's rows that need the live stores are blocked with the owner (item 7), and E6's and E7's stories are revised in new PRs before their next stories (item 8.3). E2 (creds) and E5 (coai, S7 included) are COMPLETE. Progress 2026-11-16 (§ *Epoch 9*, *Progress, 2026-11-16*, not a change): F41 merged (#171) and released (`b1746499`, all nine pins), F42 merged (mcp #81), E6 and E7 stories revised (benchmark #215, rag_qln #119). Still open: benchmark's copy re-synced to F42 (F42-c), E6.S3–S7, E7.S2–S5, the feature reviews and the promotion. The re-review is written (§ *Epoch 10*, 2026-11-16) and judged (11 fit; 5 cut, each by a fix forward or a local rewrite: E6's and E7's stories by NEW amendment PRs, F42-c's brief by new commits; nothing merged needs a revert; coai #1006 merged during the stop, outside the plan, reported); passed by the plan gate (`c6131b05`, proceed) and an independent Opus review; epoch 10 opens by the reviewers.
>
> Was: Status: **epoch 8 STOPPED for re-review (2026-11-12): its second change, entry 8.2 (E6-f: the rule's own `container-scoped` marker is refused by the released guard), is the eighth full stop; no new code on any epic until the re-review. The re-review is written (§ *Epoch 9*, 2026-11-16; Narrowed: no) , judged (13 fit, 3 cut by a fix forward), passed by the plan gate (`b6933e14`, proceed) and an independent Opus review; epoch 9 opens by the reviewers.** Epoch 8 opened 2026-11-07 (`Narrowed: no`) with entry 8.1 (2026-11-10). E2 (creds) is COMPLETE, 2026-11-10. E5.S7 (coai's drain) is COMPLETE, 2026-11-12.** Its five producer PRs are merged on creds `main`: E2.1 #294 (`834c91b`), E2.2 #310 (`bf59e4f`), E2.3 #311 (`0ae0211`), E2.4 #329 (`6e08071`, 2026-11-10) and E2.5 #330 (`b6cc6b3`, 2026-11-10 19:48 UTC). E2.5 switched on both repository guards: the shipped Node guard in creds' `docs.yml` is clean over 640 files, and the copied C# guard is green on all OS legs. Exemption markers are only on the inventoried lines. Creds' mount moved to `.agents/conventions` (#328) and is pinned at release `1341995` (#340). Epoch 8 used two changes: entry 8.1, and entry 8.2, which stopped it. E2's progress is not a change, so it has no ledger entry; creds' build records give the reasons why nothing else was counted. E2's rows and Definition of Done parts: § *Epoch 8* item 3.3. Still open in this plan: E6, E7, the feature reviews (E2's stories document's review is now due, § *Epoch 8* item 5, point 2; E2's round is held by `call_human` since 2026-11-10 — a reviewer failed, and the owner left it held on 2026-11-11) and the promotion. E5.S7 drained coai's `raw-temp` baseline from 778 entries to zero in six pull requests, one per suite, and deleted the file with its last entries (S7-d): § *Epoch 8* item 3.4. E5's progress is not a change, so it has no ledger entry. Creds' notes N20–N25 and its side findings (`release.yml`'s publish from any branch; two product scripts' temp leaks) are carried to the follow-ups as F33–F40.
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
> [PLAN_test_leftovers_merged_core_release.md](PLAN_test_leftovers_merged_core_release.md) (R1–R7, the owner decisions),
> [PLAN_test_leftovers_merged_core_followups.md](../todo/PLAN_test_leftovers_merged_core_followups.md) (F1–F22),
> [research/PLAN_test_leftovers_merged_core.md](PLAN_test_leftovers_merged_core.md) (the contract as built).

## Closure (2026-11-24)

The owner closed this plan on 2026-11-24 ("закрывай план, что сделано, что нет и доставляй в мейн"). No more work is
done under it. An item under *Not done* that is taken up later gets a plan of its own; it does not reopen this one. The
ledger stays as it is (epoch 12, one entry): closing adds no entry, as with the coai auto follow-ups plan closed the same
day. The stories documents in `dew_flow_benchmark` (E6) and `dew_flow_rag_qln` (E7) are promoted with this plan, each in
its own pull request. Delivered to `main` by three pull requests: this closure (dew_flow_conventions #195, the one carrying
this text), benchmark #246 (E6's stories document and S6's brief) and rag_qln #138 (E7's stories document); each is
merged only after its checks pass.

**Done**

- **E1 (this repository):** the contract and its refinement (`common/test-leftovers.md` and its detail companion), the
  merged core (#82) and its release plan (R1–R5, R7; `release` at `115bbf8` for R5 and `105d53c` for R7, each with
  every consumer's pin bump); the shipped Node helper `tools/lib/owned.mjs`, the guard
  `tools/leftovers-check.mjs` and the start-of-run sweep `tools/lib/leftovers-sweep.mjs`, released and pinned in all
  nine consumers.
- **E2 (`dew_flow_creds_for_devs`):** complete 2026-11-10 — creds #294, #310, #311, #329, #330.
- **E3 (`dew_flow_mcp`):** #58 (`4feb245`, 2026-10-31).
- **E4 (`dew_flow_sidecar_rust`):** #64 (`5478109`, 2026-10-31).
- **E5 (`dew_flow_connect_other_ais`):** complete 2026-11-12 — coai #945 (the producer) and the S7 drain #977, #979,
  #980, #981, #984, #985.
- **F41, F41-b, F42, F42-c, F45, F46:** done (their pull requests are in § *Epoch 11* item 1's table and § *Epoch 12*
  item 2 point 1).
- **E6 (`dew_flow_benchmark`), S1–S6:** S1 #205, S2 #207 (`84d4953e`), S3 #219, S4 #221, S5 #223, S6 #234 (`17224bf3`,
  2026-11-19). At S6's head both guards are clean in `spikes/` (Node 87 → 2, default profile 3 → 2, the C# copy 16 → 4)
  and the four spike suites ran whole with no failure (policy-ab-quick 159, minigit-bench 1316, lang-explore 1042,
  lang-bench 2604 tests), as entry 12.1 asked. On S6's way, #232 (`4e30c5b9`) made every box on the distribution's
  dotnet show only the pinned SDK, on a host that now holds SDK 11.0.100 beside 10.0.114 (benchmark's
  `PLAN_minigit_stack_bench_E2.md` amendment D-9). The stories were amended by #220 and #225.
- **E7 (`dew_flow_rag_qln`), S1 and S3–S5:** S1 built (its record is rag_qln's `research/module_tests.md`; no pull
  request of its own is named in this plan); S3–S5 #125 (`3ca58f43`); the stories amended by #128, #132 and
  #133; the benchmark pin by #129–#131 and #136.
- **This repository's record:** twelve epochs with their re-reviews (#180 opened epoch 12) and entry 12.1 (#181).

**Not done**

- **E6.S7** (benchmark: both guards on in CI and the docs; row E6-g; the Definition of Done's item 3 for benchmark).
  It never started, because its prerequisites are not met. Checked 2026-11-24 on benchmark `main` `ed472384`:
  - `todo/PLAN_bench_test_leftovers_followups.md`'s status line says "plan only, nothing implemented yet" (read
    whole); its S1 and S2, D7's prerequisites, were not looked for in code;
  - `todo/PLAN_lang_comparison_v2.md` holds no disposition of `spikes/lang-bench/runner/run_samples.py:35` and `:306`:
    `git grep run_samples` over it and its `_E*` stories documents finds five lines (`:669`, `:1146`, `:1149`, `:1319`,
    `:1433`), each about the runner as a workspace tool, none about its two `mkdtemp` sites or entry 11.2.

  Benchmark's C# copy of the guard therefore stays at 4 on `main`: the two § 3a `research/` lines and those two runner
  lines. `http/README.md:32-33`, S7's site, stays as it is.
- **E7.S2** (rag_qln: the shared store's ownership and its live stores; the Definition of Done's items 1 and 2 for those
  stores). It never started: its plan gate waits for the owner's live-store observations (§ *Epoch 9* item 7). Checked
  on rag_qln `main` `3160a668`: E7's status line says "S2 is not" and that rows E7-b, E7-c and E7-f are "blocked on the
  owner's observations"; no other place where the owner might have given them was searched.
- **The feature reviews** (§ *Epoch 8* item 5, the LAST step of the build order). None is recorded in this plan as
  run. E2's was held by coai's `call_human` from 2026-11-10; neither its state nor any other epic's review was looked up
  in coai on 2026-11-24, so a review run outside this plan's record is not excluded.
- **R6** of [PLAN_test_leftovers_merged_core_release.md](PLAN_test_leftovers_merged_core_release.md), handed to this plan
  as its open tail, stays unticked.
- **The Definition of Done** keeps four items open for exactly the two stories above; its other rows stand as § *Epoch 12*
  item 1's table writes them:
  - item 1, tests, scripts and CI create only owner-form resources or a documented exemption (E6.S7, E7.S2);
  - item 2, no container without `--rm` or an always-run cleanup (`http/README.md:32-33`, S7's; E7's live stores, S2's);
  - item 3, a structural test per repository at zero (benchmark's switch-on, S7's);
  - item 7, every prep or rename story recorded its invocation inventory (S7, S2).
- **Question (b)** of § *Epoch 12* item 7: if the language-comparison plan has not recorded the hand-off of the two
  runner lines (`run_samples.py:35`, `:306`) by S6's merge, the owner decides — wait, or a coordinated re-pin of
  `runner/` carrying a rule §7 marker on the two lines. Not answered; S6 merged without it, and the two lines stand.
- **Found by E6.S6, not fixed** (in benchmark: the umask in the S6 brief, the pin in its module document):
  - minigit-bench's `test/heldout-archive.test.mjs:30` assumes umask 0022;
  - lang-bench's exec layer rightly refuses a group-writable run parent;
  - so a whole run under umask 0002 (a `systemd-run --user` unit's default) shows 52 reds;
  - the scoring pin's two known limits (benchmark `research/module_minigit_bench.md`).
- **Not this plan's:** F32 and every other open item of
  [PLAN_test_leftovers_merged_core_followups.md](../todo/PLAN_test_leftovers_merged_core_followups.md) stay open there.

**Deviations**

- **Twelve epochs and eleven full stops** in the 41 days from 2026-10-14 to 2026-11-24. The re-review found the root
  cause, recorded in § *Epoch 12* item 1.
- **E6.S6's merge condition** moved from approved standing-failure lists to no standing failure (entry 12.1). S6's head
  runs differed from its brief's § 7 in two ways:
  - lang-explore ran at 4 workers, not 8: the kernel's OOM killer stopped two runs at 8 while the host's swap was full;
  - the umask was set to 0022 explicitly, as the base runs had it.
- **SDK 11 on the host** (the owner, 2026-11-18/19) was met by a change to another plan's instrument (#232, benchmark's
  E2 amendment D-9), not to this plan.
- **The promotion came before the feature reviews**, by the owner's word, although the build order put them first.

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

> Epoch 8 · approved 2026-11-07 · by reviewers · state: closed

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
- 8.2 · 2026-11-12 · agent · contract, merge-conditions, build-order — E6.S3's brief measured that rule §6 (b)'s own marker, `testsToDelete-exempt: container-scoped — …`, is a finding of class `exemption` ("an exemption names an unknown class `container-scoped`") in the released Node guard (`4c9a684`) and in the copied C# guard, because §7's grammar accepts only its own class table. Row E6-f ("the guard reads the marker") cannot be met at the pin: meeting it needs a shared-rules fix, a release and a pin bump first, a new prerequisite of E6; narrowing it would also count.
  (Measured: `scanText("tests/X.cs", "// testsToDelete-exempt: container-scoped — the per-test databases live and die with the
  PostgresFixture container")` gives one `exemption` finding; the Node guard over benchmark rose 209 → 210 with the marker
  planted in a copy. The row was approved with "[M] no marker", the guard never run on the marker; E6's stories repeated
  that the guard knew the class from a grep. Counted after the question consultants (consult `144d10b2`, two of two:
  option A, a change; the precedents are entries 5.2 and 7.2). This is the second change of epoch 8: the plan stops for
  re-review. Merged before the stop and fitting so far: E6 stories #103, E6.S1 #205, E6.S2 #207 (benchmark); E7
  stories #106, E7.S1 #109, pin #108 (rag_qln); conventions #166.)

### Re-review for epoch 9

Narrowed: no — entry 8.2 is settled by making `container-scoped` an exemption kind of its own in both guards (F41, F42), so row E6-f is kept whole and split into two stricter rows (E6-f1, E6-f2); E6-d (3) gets a check that exists; E7's rows that need the live stores are named blocked, not approved; N1–N5 are reproduced before E7 copies the template. Nothing of the goal, the Definition of Done, the merge conditions or the release is removed (§ *Epoch 9* item 4.2).
  (Written 2026-11-16 with § *Epoch 9*, over the two entries of epoch 8: 8.1, E2.4.S3's failed command substitution
  (built, merged as creds #329); 8.2, the `container-scoped` marker refused by both guards (no code). Re-review consult
  `70aadaf7`; the question consultants before it: `144d10b2`. The Verdict and Action cells are `—` until an Opus judge
  fills them (step 5 of the full stop); the judge adds what this list missed. The epoch 9 line is written only after
  the re-review approves; with `Narrowed: no` the plan gate approves, not the owner.)

| Work | Where | Verdict | Action |
|---|---|---|---|
| the epoch-8 revision, conventions #142 `fab7c13`, and the records #146 (entry 8.1), #153, #162 | main | fits | kept — records: #142, #146 (`d89a32f`) and #162 (`2f8dae2`) change this plan only, #153 (`df562ef`) this plan and the follow-ups (F33–F40) (file lists read). § *Epoch 9* names what it supersedes of § *Epoch 8*; the rest stands |
| creds #329 `6e08071`, E2.4 (entry 8.1), and #330 `b6cc6b3`, E2.5 | main of creds | fits | kept — item 4.1 keeps entry 8.1 as built; E2's rows are done (§ *Epoch 8* item 3.3). Entry 8.2 does not reach creds: no Testcontainers fixture there (only the copied guard's `ryuk-off` class) and no `container-scoped` marker (`git grep` at creds `96994b1`) |
| coai #977, #979, #980, #981, #984, #985, E5.S7 | main of coai | fits | kept — § *Epoch 8* item 3.4; they add no exemption marker and leave the inventory as it was, so neither the new kind nor F42 touches them |
| benchmark #103 `239e078e`, E6's stories | main of benchmark | fits | kept, except the lines of the next row — rows E6-a to E6-k, D1–D11 and the stories stand where § *Epoch 9* does not restate them (item 3) |
| the lines of #103 that § *Epoch 9* supersedes, at benchmark `46e27108`: E6-d (3) "no `.WithReuse(`" (`todo/PLAN_test_leftovers_E6.md:29`); E6-f's "**[M]** the Node guard knows the `container-scoped` class" (`:31`); E6-g by `tests/` and `tools/` only (`:32`); S3's dependency on S2 alone (`:194`); S3 scenario (3), "the C# guard is red on a planted `.WithReuse(true)`", and (4), "the guard reads the marker" (`:253-255`); S7's "a planted `.WithReuse(true)`" red for each guard (`:318`) (not in this table when it was written) | main of benchmark | cut | corrected in a NEW benchmark PR, E6's stories revision, before E6.S3's plan gate: rows E6-d, E6-f1, E6-f2, E6-g as item 3 restates them, S3 after F41-b and F42-c (item 5). #103 is not reverted. Measured at `8ae5eb6` (whose guard equals the release `4c9a684`'s): the marker is one `exemption` finding and `.WithReuse(true)` in a `.cs` is `[]` **[M]** |
| benchmark #205 `2af2f0f1`, E6.S1 | main of benchmark | fits | kept — E6-h met; the held-out runner only, nothing of entry 8.2 in its files (file list read) |
| benchmark #207 `84d4953e`, E6.S2 (the copy of mcp `21553ce`, whose guard refuses the marker) | main of benchmark | fits | kept — question (a): the copy is the template's bytes at `21553ce` (its manifest's `commit`, `TheAdaptedCopyTests`), which is row E6-e; the refusal is the template's, unchanged to mcp `07a0f5b` (`git diff --stat 21553ce 07a0f5b -- tests/Mcp.Tests/Leftovers` empty **[M]**). It writes no marker and no reuse check (its diff searched), and is brought forward by F42-a in mcp and F42-c's re-sync in a NEW benchmark PR, which the revision plans; nothing is reverted |
| rag_qln #106 `36843c0`, E7's stories; #108 `815e7a6`, the benchmark pin; #109 `3cca951`, E7.S1 | main of rag_qln | fits | kept, except the lines of the next row — question (c): #106 never calls E7-b, E7-c or E7-f observed (E7-b and E7-c "to observe before S2's plan gate", E7-f "not re-measured"), and S2's plan gate waits for them, which is what "blocked" asks; #109 says E7-c is "still to observe"; #108 moves one gitlink to `84d4953e` |
| the lines of #106 that § *Epoch 9* supersedes, at rag_qln `3cca951`: D2's "pinned at mcp `9bf9f5b` or later" (`todo/PLAN_test_leftovers_E7.md:114`) and S3's "the mcp commit S3's brief names (`9bf9f5b` or later)" (`:290`), which admit a copy from `21553ce`; the build order with S3 after S1 alone (`:223-232`); no row E7-l (not in this table when it was written) | main of rag_qln | cut | corrected in a NEW rag_qln PR, E7's stories revision, before E7.S3's plan gate: the copy from F42's commit (item 2 point 2), S3 after F42 (item 5), rows E7-b (its shared-store branch), E7-c and E7-f blocked with the owner (item 7), row E7-l added. #106 is not reverted |
| conventions #166 `113e9c2`, the owner's Windows statement | main | fits | kept — `research/security/machines.md` only; merge condition (c) for E6 and E7 (item 1). Merged 14:56Z, before the stop |
| creds #313 `f8a42f93`, E2's document revised for epoch 8 (the NEW PR epoch 8's cut row asked for), and #342 `14ea9e7b`, E2's status lines (not in this table when it was written) | main of creds | fits | kept — `todo/PLAN_test_leftovers_E2.md` (and #342 the E2.5 brief's and `todo/README.md`'s status) only; #313 merged 2026-11-07 21:14Z, after epoch 8's approval (#142, 20:42Z) |
| coai #994 `8b1a0086` (the macOS limit), #996 `5e25da77` (`native.test.mjs`'s folders owned through E5's `wrap.ownedDir`) and #998 `4cb32a76` (its research plan), merged 2026-11-13 to 2026-11-15, DURING the stop (not in this table when it was written) | main of coai, outside this plan | — | outside this plan, no verdict: item 2 point 4 makes S7's findings coai's own follow-ups. REPORTED, because they merged during the stop and #996 edits E5's inventory: one `legacy-name` row moved with its line (`:507` → `:523`, the same sha256), no new marker. On content they fit |
| the stop record, entry 8.2, conventions #167 | main: PR #167 merged 2026-11-16 as `ebb8a75` (squash of `56fe6ac`, `8245b7c` and two merges of `main`); this revision's branch is built on its head `8ae5eb6` | fits | kept — the stop |
| E6.S3's brief, uncommitted (`wt/bench-e6-s3`) | local: `todo/PLAN_test_leftovers_E6_S3_brief.md`, untracked, on `feat/e6-s3-fixture` at `84d4953e` (never pushed) | fits | kept as the starting material of the revised brief (item 5): its measurements C5 (no guard reads `.WithReuse(`) and C10 (the marker refused) are this revision's evidence. The parts item 3 replaces are the next row |
| the same brief's parts § *Epoch 9* replaces (not in this table when it was written): C10's marker written now, beside an `exemption` finding taken as expected ("210 and 3", `:93-100`, `:433-442`) | local, never pushed | cut | rewritten in the brief before E6.S3's plan gate (local work, it may be dropped): E6-f1 is blocked on F41-b and F42-c, and its check is clean, never one finding |
| rag_qln `feat/e7-s3-s5-helpers`, local (not in this table when it was written) | local, at `3cca951`, no commit of its own | — | nothing built; the S3–S5 draft brief of item 1 was not found on disk |
| this revision, § *Epoch 9* and this record (branch `docs/rollout-epoch-9`) | pushed, unmerged: `c12612e`, the judge's table `185e927`, the corrections after the plan gate and the independent review on top | fits | kept — the baseline epoch 9 is approved on, never an entry; the judge's corrections below go in with it |
| the other merges since epoch 8's approval: conventions #145, #147–#152, #154–#161, #163–#165, #168, #169; creds #307, #312, #314–#319, #323–#328, #331–#338, #340, #341, #343, #344, #346–#360, #362–#364, #366–#369; coai #963, #964, #968–#976, #978, #982, #983, #986, #987, #989–#993, #995, #997, #999, #1000; benchmark #179–#204, #206, #208, #209; rag_qln #94–#103, #107; mcp #68–#75; sidecar_rust #73–#80; vscode_kit #27–#34; amd_r9700 #18–#36; wsl_care #191–#198; ai_language_comparison #4, #5 (not in this table when it was written) | main of each repository, outside this plan | — | outside this plan, no verdict. Titles read, and the file lists where a title could touch it: the shared-rules rollout and its pins, agent-models, product work. No release since `37b9aa5` changes the leftovers guard or the test-leftovers rules (`git diff --stat 37b9aa5 4c9a684` on `tools/leftovers-check.mjs` and `common/test-leftovers*.md`: empty **[M]**). #163 edits two closed test-leftovers plans in `research/` to remove names (privacy). coai #995 moves two `raw-temp` inventory rows with their lines (`:73` → `:74`, `:86` → `:87`, the same sha256) |
  (Judged 2026-11-16 by an Opus judge against § *Epoch 9*, § *Epoch 8* (its item 3 table, item 3.3, item 3.4 and item 5), E6's stories at benchmark `46e27108`, E7's stories at rag_qln `3cca951`, and the local E6.S3 brief: 13 rows fit; 3 are cut (E6's and E7's stories' superseded lines, both merged, each by a NEW PR's revision; the local E6.S3 brief's marker plan, rewritten); 3 rows have no verdict (coai's S7 follow-ups merged during the stop, reported; a local branch with nothing built; the outside merges). Nothing merged in epoch 8 needs a revert.
  Read: `gh pr list --state merged --search "merged:>=2026-11-07"` in eleven repositories, and the file lists of every conventions PR since #142, of creds #307, #309, #312, #313, #323, #331, #335, #337, #342, #344, #359, #366, of coai #950–#999 except its `chore(rules)` pin bumps and the release PRs #963, #978, #992, #993, #997, and of the plan PRs; `gh api repos/…/branches` for conventions, creds, coai, benchmark, rag_qln and mcp; `git ls-remote` of each `main`; `git worktree list` and the local branches of benchmark and rag_qln; `git grep` for `exempt: container-scoped`, `WithReuse` and a `testcontainers` class on the mains of benchmark, rag_qln, mcp, coai and creds; #207's diff and manifest; `git show` of the E6 and E7 stories, rag_qln's `research/module_tests.md`, mcp `07a0f5b`'s `LeftoversGuard.cs:93` and `LeftoversGuardExemptions.cs:11`, `:53`.
  Run, read-only, with `scanText` of the guard at `8ae5eb6`: the marker alone gives one `exemption` ("an exemption names an unknown class `container-scoped`"); over a `DROP DATABASE` line, that and `shared-store`; the same reason under `shared-store` is refused for having no `lock:`; `.WithReuse(true)` and `SetEnvironmentVariable("TESTCONTAINERS_RYUK_DISABLED", "true")` in a `.cs` give `[]`; the workflow spelling is `ryuk-off`. Each matches § *Epoch 9* items 1, 3 and 4.2.
  The questions. (a) Benchmark #207 does not contradict the revision: it is the template's bytes, which row E6-e asks for, and it writes no marker; the refusal it carries is F42's to fix in mcp, and F42-c's re-sync brings the copy forward in a new PR. Fits, no cut. (b) No merged PR writes a `container-scoped` marker in code. What relies on a guard reading it, or claims a reuse check by a guard class, is text: E6's stories (#103), the cut row, and the local E6.S3 brief, which already measured both claims false (C5, C10). (c) Nothing merged in rag_qln treats E7-b, E7-c or E7-f as observed; what #106 must still change is the copy's commit and the order (the cut row) and row E7-l. (d) Nothing merged into the plan's epics after the stop record (`56fe6ac`, committed 17:36:01Z on 2026-11-12, PR #167 opened 17:36:17Z): after it, benchmark merged only lang-comparison work (#208, #209), rag_qln and mcp nothing, conventions agent-models plans (#168, #169), creds product work. Of coai's merges during the stop, four touch its CI, tests or leftovers files: #994, #995, #996 and #998; #996 is an S7 finding's fix with E5's helper and moves an E5 inventory row, so it is reported (its row), though item 2 point 4 puts it outside the plan.
  Corrections made to § *Epoch 9*, plain facts: K1, item 1's E6 row: S2 added the audit's CI step, not a guard step; the copied repository guard test is `Explicit` until S7 and no Node guard step runs in benchmark's CI. K2, row E6-g: the Node guard step is S7's, and S2 planted no directory. K3, item 5's DONE line in merge order: the owner's statement (#166, 14:56Z) came after E6's stories (#103, 14:52Z) and before E7's (#106, 16:48Z); the stop is `56fe6ac`, pushed, with PR #167 open and unmerged (it merged after the judge, as `ebb8a75`). K4, item 7: coai #994 and #996 have since merged (the macOS limit and the collision). In this record: the stop record's and this revision's Where cells (pushed, not local).
  Could not check: whether rag_qln #108 (17:22Z) and #109 (17:27Z) merged after entry 8.2's finding but before its record (17:36Z): the E6.S3 brief starts from #207's merge, so #207 came first, and the consult's time was not read; both fit on content. E2's feature review held by `call_human` (a coai session, not read). The E7 S3–S5 draft brief of item 1: not on disk, and `feat/e7-s3-s5-helpers` has no commit of its own. The consults `70aadaf7`, `144d10b2` and the five of item 7. Anything with Docker or .NET (no run), and Windows (N1).)
  (After the judge, 2026-11-16. The plan gate read the operative extract (status line, epoch 8's entries, this record,
  § *Epoch 9*, F41–F43): session `b6933e14`, `proceed`, two findings, both accepted: E6-f2 (3) proves reuse at run time
  by (2), with reuse turned on by the builder and by configuration alone as counterexamples; E7-l's names come from one
  builder tested at its bounds, and the shortest and longest are created live. An independent Opus review, run at the
  same time, raised ten points, all accepted and applied: E6 writes the marker in the plural, so both spellings are
  valid (item 4.2 points 1 and 2; measured: E6's stories `:49`, `:248`, the S3 brief `:183`); E6-f1's check is
  file-scoped, as benchmark's tree is not clean before S7; F41's release is a promotion that reddens nine pin checks,
  planned so (item 5); restated rows had dropped earlier checks (E6-g, E7-c, E7-h, the R6 tick), restored; E6-g named
  plain `.mjs` files the Node guard does not read (`isScanned` measured), now per directory by what reads it; E7-l's
  live half and E7-b's no-sharing branch need no owner, and E6-c's Windows half does not arise (no Windows leg); the
  exemption is limited to the container database's own teardown, so no writer skips (a)'s lock; the stories
  revisions and F42-a's order are in item 5; three stale cells; no re-split, said in item 4.2. None of them makes a
  condition smaller, so the Narrowed line stands.)

> Epoch 9 · approved 2026-11-16 · by reviewers · state: closed

- 9.1 · 2026-11-16 · agent · scope, approach — F42-c, benchmark's copy re-synced to mcp's F42, cannot keep E6's § 6 boundary "No benchmark-own file changes": the re-sync itself needs the copy check's commit pin, one CI step installing the mount's node dependencies, two `.gitattributes` lines, a stale Windows skip reason and the docs
  (Found by F42-c's brief, 2026-11-16: `TheAdaptedCopyTests.cs:79` names `21553ce` literally; the copied differential test runs
  the mounted Node guard, which needs `yaml` (mcp needed the same CI step, mcp #81); the repository marks each copied file
  `-text`; case 15's Windows skip says the removal does not clear the read-only flag, untrue once N1's fix is copied.
  One cause, one entry. Counted after the question consultants (`57ac1bd6`, two of two: a change — the boundary was an
  explicit scope line, not a prediction). F42-c's checks are unchanged. This is the first change of epoch 9; the
  next accepted change is the ninth full stop. E6's § 6 sentence is amended in F42-c's own PR.)
- 9.2 · 2026-11-16 · agent · stories, merge-conditions — E7's stories model the copied C# guard's walk over `external/` wrongly: S5's approved break-it plant (a `.cs` under `external/x/tests/`) is never read in either configuration, so it can never be red, and the `external/` skip that S3's own tests need on CI's recursive checkout is placed in S5
  (Found by E7.S3–S5's brief, 2026-11-16, read from the template's discovery code at mcp `53f65130`: `LeftoversGuardFiles.cs:63`
  reads C# files only under root `tests/` or `src/`, while shell scripts are read anywhere and the identity table through the
  whole walk; on a recursive checkout the walk reads benchmark's scripts and two foreign identity declarations under
  `external/`, red for S3's copied tests until the skip lands. One cause, one entry. Counted after the question consultants:
  the plant (`50be6245`, two of two: a change); the skip's story (`6a830a2c`, split one to one, so in doubt a change). This is
  the second change of epoch 9: the plan stops for re-review. No E7 code was written; F42-c's brief and E7.S3–S5's brief
  are local and pushed, unmerged.)

### Re-review for epoch 10

Narrowed: no — entry 9.1 is settled by bounding F42-c by named paths, its manifest's hashes and transformations and a completeness run from a clean checkout, which WIDENS its scope and adds checks; entry 9.2 by moving the `external/` exclusion into E7.S3 with separate probes and an in-scope violation that stays red, and S5 keeping them as its regression, which replaces a plant that could never be red by probes that can; every stories claim of item 3.2 gets a state and an observation before its gate. Nothing of the goal, the Definition of Done, the merge conditions or the release is removed (§ *Epoch 10* item 4.3).
  (Written 2026-11-16 with § *Epoch 10*, over the two entries of epoch 9: 9.1, F42-c's scope against E6's § 6 boundary
  (a brief only, pushed on benchmark `feat/e6-copy-f42`); 9.2, E7's stories against the copied C# guard's walk over
  `external/` (a brief only, on rag_qln `feat/e7-s3-s5`, local). Re-review consult `a84fb14e` (codex); the question
  consultants before it: `57ac1bd6` (9.1), `50be6245` and `6a830a2c` (9.2). The Verdict and Action cells are `—` until an
  Opus judge fills them (step 5 of the full stop); the judge adds what this list missed, classifies each merge against
  the revised plan by its diff and its checks, and writes "unverified" in the Action cell where the evidence cannot be
  read, never `fits` (the consultant's point 4). The epoch 10 line is written only after the re-review approves; with
  `Narrowed: no` the plan gate approves, not the owner.)

| Work | Where | Verdict | Action |
|---|---|---|---|
| conventions #170 `739affe3`, the epoch-9 revision: § *Epoch 9*, its record and the judge's table, the plan gate's and the independent review's corrections | main | fits | kept — three files, this plan, the follow-ups (F41–F43) and `todo/README.md` (file list read); checks 10 success, CodeRabbit neutral. § *Epoch 10* names what it supersedes of § *Epoch 9* (rows F42-c and E7-h, the THEN lines of item 5, entry 9.1's last sentence); the rest stands |
| benchmark #215 `275f8fd7`, E6's stories revised to § *Epoch 9* (item 8.3) | main of benchmark | fits | kept, except the lines of the next row — two files (`todo/PLAN_test_leftovers_E6.md`, `todo/README.md`), checks 15 success. It did what § *Epoch 9* item 8.3 asked (E6-d restated, E6-f1, E6-f2, E6-g by directory, S3 after F41-b and F42-c, S7's reuse plant replaced by E6-f2's test). Its stories file is the one item 3.2 cites: `git diff --stat 275f8fd7 83f166d6 -- todo/PLAN_test_leftovers_E6.md` prints nothing |
| the lines of #215 that § *Epoch 10* supersedes, at benchmark `83f166d6` (= `275f8fd7` for that file), each line number re-read: C1, § 6 *Before S3* "No benchmark-own file changes" and its Files line (`:315-316`, `:319`); C2, S3's Files without `TheAdaptedCopyTests.cs` (`:352-353`); C4, the `GetTempPath()` plants in `src/` and `tools/model-arms/` `.cs` that can never be red (`:78`, `:413-414`); and C3, C5–C10 written without a state (`:48`, `:50`, `:52`, `:65-90`, `:211-212`, `:345-351`, `:403-406`) (not in this table when it was written) | main of benchmark | cut | corrected in a NEW benchmark PR, E6's stories amendment (item 5, item 8.3), merged before F42-c's plan gate. #215 is not reverted: nothing built rests on these lines (F42-c and E6.S3 are briefs only), and its other text stands |
| rag_qln #119 `e6c8d8cc`, E7's stories revised to § *Epoch 9* (item 8.3); #120 `e9d34e06`, the benchmark pin to `275f8fd7` | main of rag_qln | fits | kept, #119 except the lines of the next row — #119: two files (`todo/PLAN_test_leftovers_E7.md`, `todo/README.md`), checks 6 success; it did what § *Epoch 9* item 8.3 asked (F42's commit or later, F42 before S3, row E7-l, E7-b, E7-c and E7-f blocked); `git diff --stat e6c8d8cc 1e524b66 -- todo/PLAN_test_leftovers_E7.md` prints nothing. #120: the one gitlink, checks 6 success, moved on by #121 |
| the lines of #119 that § *Epoch 10* supersedes, at rag_qln `1e524b66`, each line number re-read: D-1, S5 (2)'s plant `external/x/tests/A.cs` (`:378-379`); D-2, the `external` exclusion with S5 (D2 `:140-142`, the build order `:260`, S5 `:371-372`); D-3, S5's discovery sentence (`:371-372`); D-4, D5's widening (`:150-155`); D-5, "red on each break-it" in both guards (`:381`, `:462-463`); D-6 and D-7, S3's and S4's Files (`:329-330`, `:351-353`); D-8, row E7-h's **[M]** for a reading of code (`:49`) (not in this table when it was written) | main of rag_qln | cut | corrected in a NEW rag_qln PR, E7's stories amendment (item 5, item 8.3), merged before E7.S3's plan gate: rows E7-h1–E7-h3, the read matrix with states, the Files lines by path. #119 is not reverted: no E7.S3–S5 code exists |
| conventions #171 `b1746499`, F41 (row F41-a), and `release` promoted to it | main; `release` = `b1746499` | fits | kept — row F41-a is **observed**: 13 files (the rule, the companion rule `common/test-leftovers-exemptions.md`, the guard, `tools/lib/leftovers-exemptions.mjs`, their tests, the F41 plan, the follow-ups), checks 13 success; `git ls-remote` reads `release` = `b17464996903…`; the judge re-ran the Node half at this branch (whose `tools/` and `common/` equal `b1746499`): the marker over the `CREATE DATABASE` line of `PostgresFixture.cs` → `[]`, the reason without `live and die with` → one `exemption` **[M]**. F41's own entry 1.1 (the companion rule) is F41's plan's, not this plan's |
| the nine pin bumps to `b1746499` (row F41-b): benchmark #216 `83f166d6`, mcp #82 `7898a933`, sidecar_rust #81 `66524933`, vscode_kit #35 `ba8d4e0c`, wsl_care #199 `713fc091`, creds #372 `8fab781c`, amd_r9700 #37 `e3f9a9c2`, rag_qln #121 `1e524b66` (with its mcp pin at `53f65130` and its benchmark pin at `83f166d6`), coai #1004 `5ac82de1` | main of each consumer | fits | kept — row F41-b: each file list is the one gitlink `.agents/conventions` (rag_qln #121 also its two code pins), and every check of each is success (10, 11, 10, 7, 10, 22, 2, 7, 18 in the order listed; #216 11). Rag_qln #121's code pins were built by its own CI (`1e524b66`: 5 check runs, all success); its gitlinks through the GitHub API: `b1746499`, mcp `53f65130`, benchmark `83f166d6` **[M]** |
| mcp #81 `53f65130`, F42 (rows F42-a, F42-b) | main of mcp | fits | kept — question (b): #81 leaves the discovery as it was (`git diff 07a0f5b 53f65130 -- tests/Mcp.Tests/Leftovers/LeftoversGuardFiles.cs` empty); `NeverEntered` by folder name at any depth (`:28`, `:52-53`), `.cs` only under the root's `tests/` and `src/` (`:63-64`) and the token check over the same walk (`LeftoversGuardTokens.cs:131-133`) are the inputs rows E7-h1–E7-h3 and item 4.2 are written against, so nothing in it contradicts them; its differential test needs the mount's `npm ci` (its `ci.yml` change), which item 4.1 and claim D-6 carry. 16 files; the merge sha's 10 check runs all success, `build-test`, `build-test-windows`, `build-test-macos` among them. Not re-run here (no .NET). Its own plan, `todo/PLAN_F42_template_container_scoped.md`, is still in mcp's `todo/` with the status "built on the branch, before its code gate": a records fix in mcp (promotion), not a cut |
| conventions #172 `745d7204`, the progress record of § *Epoch 9*, entries 9.1 and 9.2 (the stop), F41's plan promoted (a squash of `docs/rollout-epoch-9-progress` at `5c0fada`) | main | fits | kept — the stop: five files (this plan, the follow-ups, F41's plan moved to `research/`, both READMEs); checks 10 success, CodeRabbit neutral. Entry 9.2's commit `8f3ea71c` is 19:47:18Z; the PR merged 19:58:20Z |
| benchmark `6b335fd1` and `07527ee5` on `feat/e6-copy-f42`, F42-c's brief (Opus), docs only: `todo/PLAN_test_leftovers_E6_F42c_brief.md` and one `todo/README.md` line (corrected by the judge) | pushed, unmerged (no PR) | fits | kept as F42-c's starting material: `git diff --stat origin/main origin/feat/e6-copy-f42` is those two files (+481); committed 19:32:59Z and 19:38:11Z, before the stop's commit. Its measurements are row F42-c's inputs, which the revision re-read and the judge re-checked (the nine blob pairs and two new blobs; 44 entries unchanged; `mcp tests:` 6 and 7 lines; `TheAdaptedCopyTests.cs:79`; case 15's reason `:14-21`) **[M]**. The parts item 4.1 replaces are the next row |
| the same brief's parts § *Epoch 10* replaces (not in this table when it was written): § 0.1 "exactly five touches" (`:29`) and § 12's consequence naming T1–T5 (`:358`); § 14's amendment of the stories' § 6 by this PR (`:432`); no clean-checkout run and no printed Node version among its checks | pushed, unmerged | cut | fixed forward by NEW commits on `feat/e6-copy-f42` before F42-c's plan gate (item 4.1, item 8.3): the scope as item 4.1's paths, row F42-c's checks (1)–(4), § 14 without the § 6 amendment. Never a rewrite of the pushed commits |
| rag_qln `a7189a5` on `feat/e7-s3-s5`, E7.S3–S5's brief (Opus), docs only: the brief and one `todo/README.md` line | local, never pushed (`git ls-remote` of rag_qln lists no such branch; entry 9.2's note says "pushed") | fits | kept as E7.S3–S5's starting material: two files (+548), parent `1e524b6`, committed 19:43:36Z, before the stop's commit; no remote branch (GitHub API branch list). It already puts the `external` operation in S3 (its commit 3, `:476`) and copies 55 entries from `53f65130` (§ 5.1), as item 4.2 and row E7-h1 ask. The parts it must change are the next row |
| the same brief's parts § *Epoch 10* replaces (not in this table when it was written): L1, one probe holding the `.sh` and the token plants together, with no in-scope and no root-scope probe (`:201`, `:206`, `:264`, `:423`); the by-name operation (`:476`) without P4's alternative test; its § 10 corrections, which belong in the amendment | local, never pushed | cut | rewritten in the brief before E7.S3's plan gate (local work, it may be dropped): L1 split into P1–P4 (row E7-h2), the operation scoped to the root or kept by name with the below-root test (item 4.2 point 2), § 10 carried into the stories amendment |
| benchmark E6.S3's brief, untracked, on `feat/e6-s3-fixture` at `84d4953e` (`wt/bench-e6-s3`), with one modified `todo/README.md`; unchanged since 2026-11-12 (both files' modification time) | local, never pushed | fits | kept as starting material only: its Testcontainers 4.16.0 reading and C5 stand. Re-read: modification time 2026-11-12 18:32:40 +0100, `git diff --stat` one `todo/README.md` line, so the rewrite § *Epoch 9* item 8.3 asked for has not happened. The parts to rewrite are the next row |
| the same brief's parts § *Epoch 9* cut and § *Epoch 10* restates (not in this table when it was written): the mount at `4c9a684` (`:7`); C10, the marker written now beside an `exemption` finding taken as expected (`:93-100`, "209 → 210"); no row E6-f1 file-scoped check, no E6-f2 run-time reuse proof, no C7 C# half | local, never pushed | cut | rewritten before E6.S3's plan gate, after F42-c merges (local work, it may be dropped): rows E6-f1, E6-f2, E6-d and claim C7 at the pins `b1746499` and F42-c's copy (item 5, item 8.3). Epoch 9's cut row of this brief is still owed and is carried here |
| rag_qln `feat/e7-s3-s5-helpers`, at `3cca951`, no commit of its own | local | — | nothing built: `3cca951`, three commits behind `main`, no commit of its own (`git branch -v`); it may be deleted |
| this revision, § *Epoch 10* and this record (branch `docs/rollout-epoch-10`, from `745d7204`) | pushed, unmerged: `0583362` (`git ls-remote`; corrected by the judge, it said "local commit"), the judge's table on top, local | fits | kept — the baseline epoch 10 is approved on, never an entry; the judge's corrections below go in with it |
| dew_flow_connect_other_ais (coai) #1006 `2c84a462`, the agy read-only hook allows a reader only inside its folders, merged 2026-11-16 20:10:46Z, DURING the stop (after #172, 19:58:20Z) (not in this table when it was written) | main of coai, outside this plan | — | outside this plan, no verdict; REPORTED because it merged during the stop. Product work: 17 files (`AntigravityReadOnly.cs`, three test files, research, its own plans). Its new fixture makes its folders through E5's helper `TempDir.For` (`src_mcp/tests_leftovers/TempDir.cs:34`); its diff adds no `testsToDelete` marker and no raw temp spelling (searched); checks 14 success, one macOS bench leg cancelled, CodeRabbit neutral. On content it fits E5's contract. No other merge in the eleven repositories since #170 is outside this table |
  (Read for this list: `gh pr list --state merged --search "merged:>=2026-11-16"` in conventions, benchmark, rag_qln, mcp,
  creds, coai, sidecar_rust, vscode_kit, amd_r9700, wsl_care and ai_language_comparison: the rows above are every merge
  after epoch 9's approval (#170, 10:28:44Z); conventions #167 (10:04Z) and #169 (09:57Z) merged before it and are in
  epoch 9's table. `git ls-remote` of conventions, benchmark, rag_qln and mcp; `git worktree list` and the local branches
  of conventions, benchmark, rag_qln and mcp: every other local branch of the epoch equals a merged PR head (#170
  `0dbd259`, #171 `84337c3`, mcp #81 `ae15012`). Each consumer's gitlink of `.agents/conventions` through the GitHub
  API: `b1746499` in all nine; rag_qln's `external/dew_flow_mcp` `53f65130`, `external/dew_flow_benchmark` `83f166d6`.
  The check runs of benchmark `83f166d6`, rag_qln `1e524b66`, mcp `53f65130` and conventions `745d7204`: all success.)
  (Judged 2026-11-16 by an Opus judge against § *Epoch 10* and what it keeps of § *Epoch 9* and § *Epoch 8*, E6's stories
  at benchmark `83f166d6`, E7's stories at rag_qln `1e524b66`, the pushed F42-c brief at `07527ee5`, the local E7.S3–S5
  brief at `a7189a5` and the local E6.S3 brief: 11 rows fit; 5 are cut (the superseded lines of E6's and E7's stories,
  both merged, each by a NEW amendment PR; the F42-c brief's scope by new commits on its pushed branch; the two local
  briefs' parts, rewritten); 2 rows have no verdict (a local branch with nothing built; coai #1006, outside, merged
  during the stop, reported). Nothing merged in epoch 9 needs a revert, and no row is "unverified": every merge's file
  list and checks were read, and what could not be run (the C# verdicts) is the merged CI's, said in each row.
  Read: `gh pr list --state merged --search "merged:>=2026-11-16"` in conventions, benchmark, rag_qln, mcp, creds, coai,
  sidecar_rust, vscode_kit, amd_r9700, wsl_care and ai_language_comparison; `gh pr view` file lists and check rollups of
  every row's PR and of coai #1006, and its diff; the check runs of the four main SHAs; `gh pr list --state open` in
  ten repositories (none carries this plan's work); `git ls-remote` of conventions (`main`, `release`,
  `docs/rollout-epoch-10`) and benchmark; the GitHub API branch list of rag_qln and its three gitlinks at `1e524b66`;
  the local branches of conventions, benchmark, mcp and rag_qln with their dates (each equals a merged PR head: #215
  `d156d17c`, #216 `c42dff28`, mcp #82 `07c68d2e`, mcp #81 `ae15012e`, rag_qln #119 `3959bcbf`, and those the list names);
  every file:line of item 1, item 3 and item 4 in E6's and E7's stories, mcp `53f65130`'s `LeftoversGuardFiles.cs`,
  `LeftoversGuardTokens.cs`, `LeftoversGuard.cs` and `LeftoversGuardTests.cs:486-490`, benchmark's
  `TheAdaptedCopyTests.cs`, `LeftoversSweepCase15Tests.cs`, `ci.yml`, `.gitmodules` and manifest, rag_qln's `ci.yml:18-21`.
  Run, read-only: the nine blob pairs, the two new blobs and the 44 unchanged entries of benchmark's manifest against mcp
  `53f65130` (all as item 4.1 says); `mcp tests:` 6 and 7 lines; mcp's folder 51 and 53 files, the manifest's 53 entries
  (51 from the folder plus `DirectoryLinks.cs` and `RepositoryRoot.cs`); the Node guard at this branch: the marker in
  `PostgresFixture.cs` `[]`, without `live and die with` one `exemption`; a workflow `run: d=$(mktemp -d)` `[]`;
  `isScanned` of `src/X.cs` and `tools/model-arms/X.cs` false; `scanText` over benchmark's 203 scripts at
  `external/dew_flow_benchmark/<path>`: 16 findings, 10 `raw-temp`, 2 `raw-worktree`, 3 `legacy-name`, 1 `owner-blind`;
  `git diff --stat b1746499 745d7204 -- tools/ common/` empty. Each matches § *Epoch 10*.
  The questions. (a) No merged PR contradicts § *Epoch 10* in what it built. Benchmark #215 and rag_qln #119 merged
  stories text that item 3.2 corrects: C1 (the § 6 boundary) and D-1 (a plant that can never be red) contradict it, C4
  is a plant of D-1's kind, and the rest are claims without a state. As epoch 9 did with #103 and #106, they are cut by
  a fix forward, a NEW amendment PR in each repository before the next plan gate there, not reverted: no code rests on
  them. The pin bumps, F41 and F42 are rows the revision marks observed, and their file lists and checks agree.
  (b) Mcp #81 does not touch the walk: `NeverEntered` excludes by folder NAME at any depth and the walk takes no root
  parameter, which is what item 4.2 point 2 already writes against (P4, or a test red on a nested `external`); a `.cs`
  is read only under the root's `tests/` or `src/`, so `external/x/tests/A.cs` can never be red, which is D-1. The
  copied scripts of `external/dew_flow_mcp` are none and its `.github/` paths are not at the root, so benchmark's 203
  scripts and the two `RepoToken` declarations are the whole foreign reading, as row E7-h2 says. Nothing else of #81
  (the differential test, the N1–N5 fixes) reaches E7-h1–E7-h3 beyond the `npm ci` that D-6 names. (c) The pushed F42-c
  brief and the two local briefs fit as material; cut: F42-c's "exactly five touches" and its § 14 (new commits), the
  E7 brief's single L1 probe and the bare by-name operation (rewritten), and the E6.S3 brief's marker plan at the old
  pin, which epoch 9 already cut and which has not been rewritten. (d) Nothing merged into the plan's epics after the
  stop's commit (`8f3ea71c`, 19:47:18Z) or after #172's merge (19:58:20Z): the only merge since #172 in the eleven
  repositories is coai #1006 (20:10:46Z), product work outside the plan, reported in its row. No brief commit came after
  the stop's commit: F42-c's brief 19:32:59Z and 19:38:11Z, E7's 19:43:36Z.
  On the Narrowed line: agreed, `no`. Claim D-5's reading of E7's DoD ("red in every guard that reads its file kind, and
  in at least one") is the one place a reader could see a smaller condition; it is not, because "both guards red on
  every break-it" was never meetable for a TypeScript token plant (the C# token check reads no `.ts`,
  `LeftoversGuardTokens.cs:19`) and S5 (2)
  already wrote "red only in the C# guard" for `test/support`. The plan gate should read that sentence.
  Corrections made to § *Epoch 10*, plain facts: K1, this record's F42-c brief row: its commits change two files, the
  brief and one `todo/README.md` line. K2, claim C4: for a `Source` file the template reports no raw temp SPELLING
  (`HitsOutsideSource` returns nothing), but it does report `raw-temp` for an `Owned.TempRoot` reference outside the
  helper's folder (`LeftoversGuard.cs:218`, `:300-301`); "no `raw-temp` at all" was wrong, the conclusion (a
  `GetTempPath()` plant there can never be red) stands. K3, item 6 point 3: `ci.yml` has four jobs, and `contract`,
  `plans` and `workflows` run no `Bench.Tests`. K4, this record's revision row: the branch is pushed at `0583362`, not
  a local commit. The status paragraph says the judge has sorted the work.
  Could not check: the consult texts (`a84fb14e`, `57ac1bd6`, `50be6245`, `6a830a2c`); every C# verdict (no .NET; the
  merged CI is the evidence); anything with Docker; E2's held feature review; whether `TheAdaptedCopyTests` would accept
  55 entries from a clean checkout (row F42-c (1), F42-c's own run); `npm test` at this branch (not re-run by the judge:
  the guard's tests ran green in #171's CI and on `745d7204`'s checks).)
  (After the judge, 2026-11-16. The re-review consult `a84fb14e` (codex): the request quoted entries 9.1 and 9.2 in
  full, as the ledger writes them, and the root-cause pattern (evidence that a mechanism exists taken for evidence that
  the condition holds), and asked four questions: the way of working; E7's `external/` skip and its plant; F42-c's
  touches; cuts. Its answer, in gist: (1) the approval evidence covers the acceptance-table rows and misses executable
  claims elsewhere in the stories documents; one stories-gate requirement in the existing criteria, no new review
  layer; (2) the exclusion into S3, on CI's recursive checkout, scoped to the root's `external/`; the `.sh` violation
  and the foreign identity declaration separate probes, each with its diagnostic without the exclusion and gone with
  it; one in-scope violation red with it; S5 keeps the regression; (3) F42-c's five touches are plausible, not proved
  complete: the manifest's hashes and transformations explicit, completeness by the copy check and the differential
  test from a clean recursive checkout, Node and the mount's `npm ci` before every job that runs that test, the scope
  bound by dependencies and named paths, not a count; (4) no cut is justified by the evidence; a wrong stories claim
  does not make its PR wrong; each merge is classified by its diff and checks; unavailable evidence is "unverified",
  not "fits". The consultant read a stale checkout (conventions `61732bb`, `main` before #170; it said so), so each
  point was checked against the files here (§ *Epoch 10* item 6).
  The plan gate read the operative extract (the status line, epoch 9's entries, this record, § *Epoch 10*): session
  `c6131b05`, `proceed`, three findings. Accepted: G1, E7.S3 uses the root-scoped exclusion only, the by-name
  `NeverEntered` fallback is dropped, so "still reads everything else" holds (item 4.2 point 2, row E7-h2); G2, claim
  D-5 is one condition per guard that both reads the plant's path and checks the planted behaviour, with the expected
  result per guard written for each plant. Rejected: G3, that E7.S3 run the shared-rules repository's WSL `npm test`
  and `npm run check`: those are this repository's suites, not E7.S3's; E7.S3's suites are rag_qln's own (`Rag.Tests`
  as CI runs it, the copied template tests among them, the extension's vitest, `contract` and `plans`).
  An independent Opus review, run at the same time, raised five points, all accepted and applied: R1 (high), item 8.1
  could not be met as written and contradicted items 2 and 3.2: a claim is now observed before the gate of the story or
  brief that relies on it, its "without" half against mcp `53f65130` in a scratch test (.NET is installed here), its
  "with" half by the PR's RED → GREEN, and every not-yet-observed claim is written open-ended (item 3.2's **[R]** cells
  rewritten so); R2, the token check walks the tree itself (`ConstantFindings` → `GuardFiles.Walk`, `IsScannable`),
  bypassing `Discover` and `Read`: P3b added, P4 run on both paths, P4's folder named exactly; R3, D-5 merged with G2,
  and item 4.3 weighs D-5 and C4 against the epoch-2 precedent; R4, row F42-c's per-path diff check (4b) and the
  promoted briefs' `research/` paths (item 4.1); the manifest's `about` is also rewritten, as F42-c's brief § 4 writes
  it, and (4b) allows that; R5, this note, and item 7's source for the owner's E6 permission (the owner's own answer,
  not a document). Also added: a later bump of rag_qln's benchmark or mcp pin re-runs E7-h2's probes (row E7-h2,
  item 8.1). None of them makes a condition smaller, so the Narrowed line stands.)

> Epoch 10 · approved 2026-11-16 · by reviewers · state: closed

- 10.1 · 2026-11-16 · agent · merge-conditions — row E6-f2's counterexample "reuse enabled through configuration alone" has no instance at the pinned Testcontainers 4.16.0, so it cannot be red; it becomes a green pin (both configuration spellings set, the built container's Reuse stays False and the container still ends with the fixture), while the builder counterexample and the run-time disposal proof stay red-first
  (Observed by E6.S3's brief, 2026-11-16, by a run at benchmark `5070beda`: the fixture's builder reads Reuse=False under
  `TESTCONTAINERS_REUSE_ENABLE=true` and under `testcontainers.reuse.enable=true` in the properties file; only `.WithReuse(true)` sets
  it; no member of the assembly reads reuse from configuration. The parent had anticipated it (§ *Epoch 9*, *Progress*, carried
  (1)). Counted after the question consultants (`c3d71347`, two of two: a change — the row said "RED, each"). First change of
  epoch 10; the next accepted change is the tenth full stop.)
- 10.2 · 2026-11-17 · agent · stories, approach — E6.S4's two pilot scaffolds (`M2PilotScaffold.cs`, `M3PilotScaffold.cs`) make output that must outlive the test for the owner's manual pilot, and neither of the story's two dispositions for its 15 legacy literals fits them: the helper's claimed folder is collected by a later run's sweep once its owner is gone and old enough, and the `~` spelling is only for tests about the old name itself; a third disposition (an operator artifact outside the testsToDelete family) is needed
  (Found by E6.S4's brief, 2026-11-17, read in `M2PilotScaffold.cs:11-16` ("meant to outlive the test — the owner removes it after the
  pilot") and `M3PilotScaffold.cs:9-11`, against the stories' S4 text ("Each of the 15 legacy literals moves to the helper or, where the
  test is about the old name itself, is spelled with the `~` precedent") and the rule's "never prefix something that must survive
  the run". Counted after the question consultants (`33aa7f43`, two of two: a change to the story's approach). This is the second
  change of epoch 10: the plan stops for re-review. No S4 code was written; S4's brief is local.)

### Re-review for epoch 11

Narrowed: yes — the DoD's first item accepts operator-retained pilot output (row E6-l); consults 120652b8, a6cfcc53
  (Why yes, § *Epoch 11* item 4.3: the Definition of Done's first item, read at `105d53c`, allows only the owner form or a
  rule §7 inline exemption (and, for E5 only, the baseline); the output of the two pilot scaffolds is neither, so the
  revision adds ONE further documented exemption, bounded as epoch 5's was. Everything else widens: entry 10.1 stands as
  built (E6.S3, #219); row E6-l is added and S4's files widen by named docs; row E6-i reads both guards with counts; S5,
  S6 and S7 gain named files, both guards and counts, and S6's scope widens by the C# guard's 14 spike findings. The
  epoch 11 line, when it is written, says `by owner`: the owner approves the revised plan before epoch 11 opens.)
  (Written 2026-11-17 with § *Epoch 11*, over the two entries of epoch 10: 10.1, E6-f2's configuration counterexample
  (built, merged as benchmark #219); 10.2, E6.S4's pilot scaffolds (a brief only, benchmark `feat/e6-s4-modelarms`
  `4dc04820`, local). The question consultants: `c3d71347` (10.1), `33aa7f43` (10.2); the disposition: `1f60c647` (two
  of two). The re-review consult (step 3): `a6cfcc53` (codex), every change of the epoch quoted; its third point settled
  by the question consult `120652b8` (two of two). The Verdict and Action cells were `—` until the Opus judge filled them
  (step 5 of the full stop; done, `a637c87`, its note below the table); the judge added what this list missed (the merges outside the plan's four repositories
  among them), classifies each merge against the revised plan by its diff and its checks, and writes "unverified" where
  the evidence cannot be read. The epoch 11 line is written only after the re-review approves, with `state: open` and
  `by owner` (the record says `Narrowed: yes`: the plan gate passes it, then the owner approves); epoch 11 starts at 0
  changes. A retained store corpus for E7 is NOT allowed by this revision: E7's amendment brings it to the owner
  (§ *Epoch 11* items 4.3 and 4.4).)

| Work | Where | Verdict | Action |
|---|---|---|---|
| conventions #173 `af607536`, the epoch-10 revision (§ *Epoch 10*, its record, the judge's table) | main | fits | kept — two files (this plan, `todo/README.md`); checks 13 success; the merge sha's `ci`, CodeQL and sonarcloud runs success. § *Epoch 11* keeps § *Epoch 10* for everything it does not name and replaces no line of it: what it supersedes is E6's stories text (the cut row below), and § *Epoch 10* item 8.1 "stands as written" (item 8.1) |
| conventions #174 `87f065b0`, entry 10.1 and epoch 10's progress record; F44 in the follow-ups plan | main | fits | kept — two files (this plan +28-1, the follow-ups plan +13-1: F44); checks 12 success, push runs success. Entry 10.1 is kept as built (item 4.1); F44 is not a prerequisite (item 2 point 4), and item 8.2's *Found on the way* goes beside it |
| conventions #175 `62f9ae5d`, entry 10.2 and the stop | main | fits | kept — one file (+10-2); checks 14 success, push runs success. The stop's commit `61186e22` is 00:40:47Z; S4's brief `4dc04820` (00:37:50Z) came before it; the PR merged 08:34:18Z |
| benchmark #217 `191ef77f`, E6's stories amended to § *Epoch 10* | main of benchmark | fits | kept, except the lines of the next row — two files (`todo/PLAN_test_leftovers_E6.md`, `todo/README.md`); checks 11 success, the merge sha's `ci` and CodeQL success. What was built on it stands: S3 (#219) rests on its S3 text (`:425-469`) and F42-c on § 6 *Before S3*, neither superseded |
| the lines of #217's file that § *Epoch 11* supersedes, at `b348bb33`: S4 *What* `:472-474` (two dispositions), *Files* `:482`, *Done when* `:483`; D6 `:254-256` (the probe path); S5 `:489` (shape G unbounded), `:500-501`; S6 `:503-512` ("Node", no *Files*); S7 `:514-542` (no *Files*); § 11 `:609` (who lists the exemptions) | main of benchmark | cut | corrected in a NEW benchmark PR, E6's stories amendment (item 2 point 2, item 8.3), prepared on `docs/e6-stories-epoch-11` (`4340becb`, `37be8735`, local), merged before S4's plan gate. Each line re-read at `b348bb33`, and each is rewritten in the amendment's diff (S4 as item 4.2, rows E6-i and E6-l; D6 three-way; S5 shape G bounded, both guards 73 → 0 and 75 → 0; S6 both guards with *Files*; S7 *Files*; § 6's plan-records and exemption-list line; § 11). #217 is not reverted: nothing built rests on these lines (S4 is a brief only; S5–S7 not started) |
| benchmark #218 `5070beda`, F42-c | main of benchmark | fits | kept — 22 files; checks 11 success, the merge sha's `ci` and CodeQL success. Not re-opened (item 2 point 1). § *Epoch 11* builds on it: E11-9 relies on its `build-test` step (Node and the mount's `npm ci`), and item 3.3 observed through its copy (mcp `53f65130`, 55 entries); its W1 finding is item 4.5's `/tmp/.git` todo, not a defect of #218. Its C# verdicts are its CI's (not re-run) |
| benchmark #219 `b348bb33`, E6.S3 (entry 10.1 as a green pin) | main of benchmark | fits | kept — 10 files (`PostgresFixture.cs` +45-5, `ContainerPass.cs`, its tests, `ContainerRulesTests.cs`, `FixtureContainerTests.cs`, `TheAdaptedCopyTests.cs` +5-1, the brief promoted to `research/PLAN_test_leftovers_E6_S3_brief.md`, both READMEs and `module_tests.md`, the stories' progress line); checks 12 success, the merge sha's `ci` and CodeQL success. Item 4.1 keeps entry 10.1 as built. D6 and E11-3 concern the fake CLI's home and E11-4 S5's lines: #219 touches no fake, probe or `FakeCli` file. Item 8.1's "both guards, a count per class": neither guard's list at `b348bb33` (Node 209, C# 173, item 8.4) has a line in any of its files, so 0 in every class in each; its one exemption, `container-scoped` over `NewEmptyDatabaseAsync` (`PostgresFixture.cs:135`), is the stories' own (S3 `:429-430`, DoD `:608`), as item 4.3 asks; its plan records are in the PR, as E11-10 asks |
| rag_qln #122 `6e447156`, E7's stories amended to § *Epoch 10*; #123 `0be37687` and #127 `48cbf896`, the benchmark pin | main of rag_qln | fits | kept, #122 except the lines of the next row — #122: two files (`todo/PLAN_test_leftovers_E7.md`, `todo/README.md`), checks 6 success; its push run on `6e447156` was red in `plans` → `Pin check` only (benchmark #217 merged 5 s later, so the pin `83f166d6` was stale against `191ef77f`), ended by #123. #123 and #127: the one gitlink `external/dew_flow_benchmark` each (to `5070beda`, `b348bb33`), checks 6 success, push runs success |
| the lines of #122's file that § *Epoch 11* item 4.4 amends, at `48cbf896`: § *The cornerstone* items 1 and 6, row E7-l, S2's *Files* and *Done when*, the status line | main of rag_qln | cut | corrected in a NEW rag_qln PR, E7's stories amendment (item 2 point 3, item 4.4; not yet written), by Opus, merged before E7.S2's plan gate. Re-read at `48cbf896`: status `:3`, row E7-l `:76`, § *The cornerstone* `:231`, S2 `:369-389`. #122 is not reverted: no S2 code exists. The status line is #125's text (the file's last commit is `3ca58f43`), a records fix in the same amendment, not a cut of #125 |
| rag_qln #125 `3ca58f43`, E7.S3–S5 | main of rag_qln | fits | kept — 84 files, a squash of 16 commits; checks 6 success; push runs on `3ca58f43` and `48cbf896` success (`plans` → `Test leftovers guard` success, `build-test` success). Stands (item 2 point 1); § *Epoch 11* builds on it: E11-12 and O-d read the word rule of the copy it merged (`tests/Rag.Tests/Leftovers/LeftoversGuard.cs`). The one inline exemption its diff adds is the template's own (`Owned.TempRoot`, `raw-temp`, copied from mcp `53f65130`), not a story's. Not re-run (C#, vitest): the merged CI is the evidence. It left its brief in `todo/` with S3–S5 merged: a records fix for E7's amendment (E11-10), not a cut |
| benchmark `4dc04820` on `feat/e6-s4-modelarms`, S4's brief (Opus), docs only | local, never pushed (no such branch in the GitHub branch list) | fits | kept as S4's starting material: two files (+354: the brief and one `todo/README.md` line), parent `b348bb33`, committed 00:37:50Z, before the stop's commit; `git ls-remote` of benchmark lists no such branch. Read whole against item 4.2's lifetime table, rows E6-i and E6-l: its observations O1–O9 stand (row E6-i's counts 209 → 160 and 173 → 91 are its O3, O4 and § 6), and so do K1, K2's run-lifetime and never-made sites, K3's 17 literals (Q2 as decided), K4 (its `TempDir.Root` lines are the table's "a path only read" class, within E11-4), K6, K7, K8 and § 12. The parts to change are the next row |
| the same brief's parts § *Epoch 11* replaces (not in this table when it was written): K5 (`:127-135`) and K2's scaffold row (`:101`), unprefixed output "built on `TempDir.Root`", "invisible to both guards", which row E6-l forbids (the required `BENCH_PILOT_OUT`, its refusals, never the temp root or `TempDir.Root`), and its `bench-<pilot>-probe-<id>` name against its own "becomes a `TempFolder`"; § 13 N4's second sentence; O6's scaffold plants on `TempDir.Root` (replaced by item 3.3 O-b); § 0 (`:14-24`) with no scaffold disposition; § 0.1 (`:26-53`) without `research/module_model_arms.md`, `research/PLAN_model_arms_E6.md` and `research/PLAN_model_arms_E3.md`; "the TENTH FULL STOP" (`:3`, `:52-53`), where epoch 11 starts at 0 changes; § 5, § 7 and § 9 (`:179-243`) with no row E6-l run; § 10 (`:248`) "read, not run", where row E6-l (1)–(2) runs each scaffold once; § 8 with no docs commit; § 14's Q1–Q8, now decided by item 4.2; the header's parent (`87f065b`, § *Epoch 10*, "entry 10.1 only, state open") | local, never pushed | cut | fixed forward by NEW commits on `feat/e6-s4-modelarms`, after E6's stories amendment merges and before S4's plan gate (item 5, item 8.3): K5 as row E6-l; § 0.1 as item 4.2's *Files*; § 5 and § 9 as its *Done when* (row E6-l (1)–(3) RED first); § 14 answered; item 3.3's O-b quoted in § 11. Never a rewrite of the commit (local work, it may be dropped) |
| this revision: § *Epoch 11* and this record (conventions `docs/rollout-epoch-11`), and E6's stories amendment (benchmark `docs/e6-stories-epoch-11`, from `b348bb33`) | local commits | fits | kept — the baseline epoch 11 is approved on, never an entry: conventions `3359d1f`, `0baed62` and the judge's commit on top; benchmark `4340becb`, `37be8735`; none pushed (`git ls-remote` of both). Since the judge (not in this row when it was judged): conventions `634905b` (the plan gate's record) and the independent review's fold on top; benchmark `f8b58678` (row E6-l refuses the temp root, the plan gate's G1 and G3), `c5be052f` (the independent review's fold), `176308d7` (the second gate round) and its successor (the third); conventions `dce2a5f` and the second gate round's fold on top; all local. The benchmark half is the NEW PR of #217's cut row |
| rag_qln `tmp/e7-s4-red` at `da6f0e21`, with its closed PR #124 ("E7.S4 RED observation … throwaway, not for merge", open 23:01:28Z–23:04:48Z) (not in this table when it was written) | pushed, unmerged | fits | kept as the record of E7.S4's RED: its 10 commits are the first 10 of #125's 16, the same SHAs (`fe2d076f` … `da6f0e21`), so nothing on it is outside #125; its `ci` run failed in `extension` → `Test`, the RED it was pushed to show, and `pr · title` succeeded. No revert; the branch may be deleted |
| dew_flow_connect_other_ais (coai) #1010 `6b8acea0` (21:27:25Z) and #1011 `92f1fa8f` (07:11:49Z, after the stop's commit); #1007 (a plan), #1008, #1009 and #1012 (releases, #1012 at 08:05:47Z) (not in this table when it was written) | main of coai, outside this plan | — | outside this plan, no verdict; REPORTED because they merged during epoch 10, two after the stop's commit. Product work: #1010 one test file (+8-2), a fixture link's target spelled as E5's `TempDir` spells it (macOS teardown); #1011 92 files, the auto policy, whose new tests make their folders through `TempDir.For` and whose added lines spell no raw temp API and no `testsToDelete` literal (searched; one rule sentence names `Path.GetTempPath()` as refused). Checks: #1010 16 success, 1 neutral; #1011 15 success, 1 neutral. On content they fit E5's contract and carry none of this plan's work |

  (After the judge, 2026-11-17. Judged by an Opus judge against § *Epoch 11* and what it keeps of § *Epoch 10* and the
  sections under it, E6's stories at benchmark `b348bb33`, E7's at rag_qln `48cbf896`, the local S4 brief `4dc04820` and
  the local stories amendment `37be8735`: 11 rows fit; 3 are cut (the superseded lines of E6's and E7's stories, both
  merged, each by a NEW amendment PR; the S4 brief's parts, by new commits on its local branch); 1 row has no verdict
  (coai's merges, outside the plan, reported). Nothing merged in epoch 10 needs a revert, and no row is "unverified": every
  merge's file list and checks were read, and what could not be run (the C# and vitest verdicts) is the merged CI's, said
  in each row.
  Read for this list: `gh pr list --state merged --search "merged:>=2026-11-16T20:00:00Z"` in conventions, benchmark,
  rag_qln, mcp, coai, creds, sidecar_rust, vscode_kit, amd_r9700, wsl_care and ai_language_comparison, and in the owner's
  one other repository pushed since then (no merge): the rows above are every merge after epoch 10's approval (#173,
  20:41:32Z), and coai #1006 (20:10:46Z) is in epoch 10's table; mcp and the other consumers have none. `gh pr view` file
  lists and check rollups of every row's PR and of coai #1007–#1012; the push runs of every merge sha (all success but
  rag_qln `6e447156`, its row); the open pull requests of the eleven repositories (none carries this plan's work: they are
  dependency bumps, releases and product work); the GitHub branch lists of conventions, benchmark, rag_qln and mcp (the
  one unmerged branch of this plan's work is rag_qln `tmp/e7-s4-red`, its row); `git worktree list` and the local branches
  of the four since 2026-11-16: every other local branch of epoch 10 equals a merged PR head (#173 `6301b7ad`, #174
  `0ca0825d`, #175 `61186e22`, #217 `493ef744`, #218 `7dd7c44b`, #219 `70eb6fc2`, #122 `ca722fee`, #123 `41dddaa7`, #125
  `06d80935`, #127 `68c21187`). Local, never pushed, superseded during the epoch, and they may be dropped: benchmark
  `feat/e6-s3-fixture` `84d4953e` (the old S3 brief; S3 merged as #219), rag_qln `feat/e7-s3-s5` `a7189a5c` (the old
  brief; #125), conventions `local/e10-gate-extract` `29b0fc22` (epoch 9's gate extract). Read in the files: E6's stories
  at `b348bb33` at every line the cut row names, and the amendment's diff (each rewritten); E7's stories at `48cbf896`;
  the S4 brief whole; #219's diff of `PostgresFixture.cs`; #125's added exemption lines; both guards' finding lists of
  item 8.4 at `b348bb33`, searched by S3's file paths (no line).
  The questions. (a) No merged PR contradicts § *Epoch 11* in what it built. Benchmark #217 and rag_qln #122 merged
  stories text that § *Epoch 11* replaces; as epochs 9 and 10 did with #215 and #119, they are cut by a fix forward, a NEW
  amendment PR in each repository before the next plan gate there, not reverted: no code rests on those lines.
  (b) E6.S3's merged code against what § *Epoch 11* changed: D6 and E11-3 are about the fake CLI's home, E11-4 about S5's
  lines, and #219 touches neither; item 8.1's both guards with a count per class holds on its lines (0 and 0); its one
  exemption is listed by the stories, as item 4.3 asks. Item 8.1's lifetime classification, both-guard counts and *Files*
  with docs are criteria of the gates still to come; they reach neither #219 nor #125 back. (c) The S4 brief against row
  E6-l and S4's new *Files* and *Done when*: K5 is the one disposition item 4.2 rejects (unprefixed output on
  `TempDir.Root`, invisible to both guards); § 0.1 lacks the three model-arms documents; § 5, § 9 and § 10 run no
  scaffold; § 14 is answered by item 4.2. Everything else stands; the cut row names each part, and the rework is new
  commits after E6's amendment merges and before S4's plan gate. (d) Nothing merged into the plan's epics after the stop's
  commit (`61186e22`, 00:40:47Z): the last epic merge is rag_qln #127 (00:20:09Z); after it came conventions #175 (the
  stop) and coai #1011 and #1012 (outside). No brief commit came after the stop's commit: S4's brief 00:37:50Z; the
  amendment's commits (08:57:46Z, 09:17:05Z) are the re-review's.
  On the Narrowed line: agreed, `yes`; nothing in the done work changes it.
  For the amendment PRs, plain facts, not changes: E7's amendment, with its status line (item 4.4 point 5), can promote
  `todo/PLAN_test_leftovers_E7_S3_S5_brief.md` to `research/` with its `research/README.md` row (E11-10's rule; #125
  left it in `todo/`); E6's amendment's § 11 names S3's `container-scoped` marker in the DoD item above its new list, so
  the list is whole.
  Could not check: the consult texts; every C# and vitest verdict (not re-run; the merged CI is the evidence); anything
  with Docker; Python; E2's held feature review.)
  (After the plan gate, 2026-11-17. The plan gate read the operative extract (the status line, the epoch lines, epoch
  10's entries, this record judged, § *Epoch 11*, E6's row E6-i, D6, S4–S7 and § 11 at `b348bb33`, E7's row E7-l, § *The
  cornerstone* and S2 at `48cbf896`): session `d8e14338`, `proceed`, three findings, all accepted. G1 and G3 (one fault,
  two reviewers): row E6-l's refusal list let `BENCH_PILOT_OUT` name the temp root or a folder below it, against its own
  "never the temp root"; the list now refuses a value that, resolved, is or lies under the temp root, RED first (item 4.2's
  row E6-l; E6's stories `f8b58678`). G2: item 4.4 point 2 let S2's builder and sweep RECEIVE the prefix without
  validating it; a received prefix must now equal the one test namespace and every selected name parse as the owner
  form, and an empty, broader or unrelated prefix refuses with nothing dropped, RED first.)
  (After the second plan-gate round, 2026-11-17. The gate read the operative extract of `dce2a5f` and `c5be052f` (213 KB):
  session `a209b8e4`, `proceed`, one of two reviewers answered (the other could not take the extract's size); three
  findings, all accepted. G1 (Major): item 4.4 point 2's shape check accepted an unrelated namespace
  (`orders_u1000_prod_`), and ownership checked only in tests did not protect a misconfigured product; settled by the
  question consultants `b4556ae1` (two of two) as option B: the configured prefix confers no deletion authority, the
  selector only lists, a drop needs the record and established abandonment, registration precedes creation, the shape
  check fixes the token `qln` and the owner segment, option A (the word in `appsettings.json`) rejected, five zero-drop
  runtime tests RED first (item 4.4 points 2 and 6; O-m). G2 (Major): O-l let S4 merge without proving killed-run
  collection on the real 9p mount; S4's merge condition is now that check passing on the real mount OR the owner's
  explicit exception, an owner question (item 7). G3 (Minor): interrupted pilot output had no recovery; row E6-l records
  every intended exact output path durably before creating it (M2 writes `bench-m2-manifest-<id>.json` first, as M3
  does), with a test that a scaffold killed after its first child leaves a record naming every child. Folded with them,
  text only, the independent reviewer's re-check of `dce2a5f`/`c5be052f` ("approve with fixes"): B2 (a) the segment
  parse dropped, (b) the `qlntest_` legacy selector kept list-only until the inventory, (c) "refuses" restated as "no drop
  without a record"; E6's D6 earlier versions marked *Was* and the N2 citation dropped there; the 9p row says the record
  is the only real evidence on drvfs. None narrows anything; the Narrowed line stands.)
  (After the third plan-gate round, 2026-11-17. The gate read the operative extract of `0d35b80` and `176308d7` (193 KB):
  session `a2e015fd`, `proceed`, one of two reviewers answered; two findings, both accepted. Finding 1: the 9p row and
  the owner question disagreed (O-l said the test runs only when `MODEL_ARMS_DRVFS_SCRATCH` IS the mount point `/mnt/c`,
  item 7 asked for a folder under it); S4 now widens the test to a validated scratch folder below a 9p mount, every write
  confined to it (`PosixFolderIsolationTests.cs:317-319`, a tests file under `ModelArms/**`, beyond the S4 brief's `:321`
  bound, said in item 4.2's Files), and item 7 asks for one run in a new empty folder under
  `/mnt/c/Users/<owner>/AppData/Local/Temp/`, removed by exact path after. Finding 2: the killed-after-first-child check
  named "a scaffold"; it is now required for EACH scaffold, M2 and M3, each manifest naming every intended child (row
  E6-l; E6's stories S4 and § 11). Text only; nothing narrows; the Narrowed line stands.)
  (The owner, 2026-11-17, in this session: approved the revised plan with its `Narrowed: yes` reading of the Definition
  of Done (item 4.3) — epoch 11 opens by the owner; answered item 7's 9p question with (1): run it once, with
  `MODEL_ARMS_DRVFS_SCRATCH` = a new empty folder under `/mnt/c/Users/<owner>/AppData/Local/Temp/`, removed by exact path
  after; and allowed deleting rag_qln's pushed throwaway branch `tmp/e7-s4-red` (this record's row).)

> Epoch 11 · approved 2026-11-17 · by owner · state: closed
- 11.1 · 2026-11-17 · owner · stories — E6.S4's *Files* (§ *Epoch 11* item 4.2) gains four lines of files already on it: `research/module_model_arms.md:2314` (a real edit: the living doc's M3 names, which item 7 promises to cover) and dated notes at `research/PLAN_model_arms_E3.md:1127` and `research/PLAN_model_arms_E6.md:344`, `:346`, `:818` (IMPLEMENTED plans: M2's and M3's names, and "a killed test run leaves one temp folder", which S4 makes false)
  (Found by S4's reworked brief, 2026-11-17, § 15 (benchmark `feat/e6-s4-modelarms` `43d6cacd`): item 4.2's line lists missed four lines
  its own grep finds, though item 8.1 says *Files* include the docs found by grep. The question consultants could not be
  asked (the day's cap of ten questions was spent); the owner counted it as a change, in this session. First change of
  epoch 11; the next accepted change is the eleventh full stop.)
- 11.2 · 2026-11-17 · owner · stories, merge-conditions — E6.S6 cannot change the lang-bench runner's two `mkdtemp(` lines (`spikes/lang-bench/runner/run_samples.py:35`, `:306`; row E11-6's C# list): any byte of `runner/` moves the runner pin (`test/runner-pin.test.mjs:103` red), and re-pinning it (`inputs/specs.d/runner.json`, `specs.json`, `runner-versions.json`, `rs_report.py`'s version, a CP2 addendum) belongs to the language-comparison plan; the two lines leave S6 for that plan, so S6's *Done when* reads C# 14 → 2 in `spikes/`, not 14 → 0
  (Found by S6's brief, 2026-11-17, § 13 S-1 (benchmark `feat/e6-s6-spikes` `d836de52`). The question consultants could not be
  asked (the day's cap was spent); the owner chose to count it and hand the lines to the language-comparison plan, in this
  session. Second change of epoch 11: the plan stops for re-review. No S6 code was written; S6's brief is local. The same
  day the owner allowed `/usr/bin/python3` for S6's two whole-suite runs of lang-bench only (the exec layer calls it by a
  fixed path, `lib/exec-layer/run.mjs:79`); the `.py` units run in wslc and an owned venv.)

### Re-review for epoch 12

Narrowed: yes — E6.S6 merges with the two runner findings entry 11.2 leaves (C# raw-temp, run_samples.py:35, :306) and with exactly these standing suite failures: policy-ab-quick's three named, and the base lists the owner confirms within benchmark #222's counts (lang-explore ≤ 10, lang-bench ≤ 1, minigit-bench 0); a killed run's claimed fake homes under `~` (and `/var/tmp` decoys) are listed, not collected, until F1/S1's home sweep; S7's zero stays, and S7 waits for the language-comparison plan's disposition; consult 59b325a3
  (Revised 2026-11-17 after the second plan-gate round (`a0abb03e`): the line before it ended "… minigit-bench 0); S7's
  zero stays, and S7 waits for the language-comparison plan's disposition", with no word on the roots outside the temp
  root; the bounded exception is § *Epoch 12* item 1's *Goal* and item 4.6 (3).)
  (Revised 2026-11-17 after the independent Opus review, B1: the line after the judge said "…E6.S6 merges with the two runner findings entry 11.2 leaves (C# raw-temp, run_samples.py:35, :306) and with the pre-existing suite failures its base runs record, named test by test before its gate and failing the same way at its head"
  — unbounded (no count) and, through the followups plan's S5 list, a way past a red run that the list's own rule
  forbids (`todo/PLAN_bench_test_leftovers_followups.md:126`). Now capped, owner-confirmed, the S5 list approving nothing.)
  (Revised 2026-11-17 after the judge (`82c5a4b`, its note's fact for S6's plan gate): the first text of the line above
  said "and policy-ab-quick's three pre-existing failures". Benchmark #222's PR body records, on `main` without its
  change, `spikes/lang-explore/test` 991 tests with 10 failing and `spikes/lang-bench/test` 2394 tests with 1 failing,
  all 11 "the host's sandbox and box tests, the rehearsal runs, one priority test" **[D]**; a row approving only
  policy-ab-quick's three would stop S6 at its first base run. Row E6-m now approves the failures S6's base runs
  record, named test by test in S6's brief before its plan gate, each in a named class and failing the same way at base
  and head; a head failure not on the base list is S6's to fix; a base failure outside the classes stops S6's brief.
  Still smaller than "green", so still part of this narrowing; nothing else of the line changes.)
  (Why yes, § *Epoch 12* item 4.6: by § *Epoch 11* E11-6 and E11-7 and the stories' S6 *Done when* (benchmark
  `todo/PLAN_test_leftovers_E6.md:706-709` at `a8106448`), S6 merged only with the C# guard at 14 → 0 in `spikes/` and
  "the suites … green". It now merges with 14 → 2, the two runner lines standing as findings the owner approves one by
  one, and with policy-ab-quick's FAILED list equal to its base's (three named Windows-path cases): a smaller merge
  condition for that PR. (After the judge: and with the other suites' pre-existing failures as row E6-m now bounds them,
  the revision note under the Narrowed line.) As in the record for epoch 3 (E5.S5's merge condition changed, and "E5's final Definition of
  Done and this plan's did not get smaller"), the final Definition of Done does not get smaller: S7 still switches the
  C# copy on at zero, and it now waits, as an explicit prerequisite beside D7, for the language-comparison plan's
  disposition of the two lines on benchmark `main` with the repository guard clean on them; the three failures are the
  minigit stack bench's own ("its four pre-existing Linux failures (§2) are not this epic's unless a story touches
  the module under test", `todo/PLAN_minigit_stack_bench_E2.md:86-88`; S6 touches the test files, not the `lib/`
  modules under test), handed to it by name. The prerequisites got wider (that disposition;
  the owner's answer on the system interpreter for two more suites, § *Epoch 12* item 7). The epoch 12 line, when it is
  written, says `by owner`.)
  (Written 2026-11-17 with § *Epoch 12*, over the two entries of epoch 11: 11.1, E6.S4's *Files* gained four doc lines
  (built, merged as benchmark #221); 11.2, E6.S6's two runner lines go to the language-comparison plan (a brief only,
  benchmark `feat/e6-s6-spikes` `d836de52`, local). Both were counted by the owner in this session, the question
  consultants' daily cap being spent. The re-review consult (step 3) is `59b325a3` (codex), every change of the epoch
  quoted; its points (a) to (c) are checked against the files in § *Epoch 12* item 6. The Verdict and Action cells were
  `—` until the Opus judge filled them (step 5; done, `82c5a4b`, its note below the table): the judge adds what this list missed, classifies each row against
  § *Epoch 12* by its diff and its checks, and writes "unverified" where the evidence cannot be read. The epoch 12
  line is written only after the judge (done), the plan gate (next) and the owner's approval, with `state: open` and
  `by owner`; epoch 12 starts at 0 changes. No epic changes, so there is no Fable re-split (step 7).)

| Work | Where | Verdict | Action |
|---|---|---|---|
| conventions #176 `eccf2d2f`, the epoch-11 revision (§ *Epoch 11*, its record and the judge's table; one file, +676-2; checks 10 success, 1 neutral) | main | fits | kept — the merge sha's `ci`, CodeQL and sonarcloud push runs success. § *Epoch 12* keeps § *Epoch 11* for everything it does not name; what it supersedes of it is E11-9's counts (item 3.2, E12-3; row E6-g), read from the later section in this same file, append only: no line of #176 is rewritten and no separate PR is owed |
| conventions #177 `488bdce2`, entry 11.1 (one file, +8-1; checks 13 success) | main | fits | kept — push runs success. Item 4.4 keeps entry 11.1 as built; it merged 13:19:47Z, before the S4 merge that carries its four lines (#221, 14:52:24Z) |
| conventions #178 `22351c2f`, follow-ups F45 (six S5 doc lines left as history, the owner's decision) and F46 (one file, +30-1; checks 13 success) | main | fits | kept — one file, the follow-ups plan (F45, F46; no line of this plan); push runs success. F45 is the owner's decision § *Epoch 12* cites, not re-decided; F46 is not a prerequisite (item 2 point 6) |
| conventions #179 `cb5a33a1`, entry 11.2 and the stop (one file, +10-2; checks 13 success); this revision is built on it | pushed, open PR at this writing (`docs/rollout-stop-11-2`) | fits | kept — merge it (a stop record, allowed during the stop, step 2) before or with this revision's PR, whose base it is. Its one thread (CodeRabbit, Minor, `:907`: E11-9's expected C# counts against 11.2) is answered on the PR (19:33:01Z) and settled by § *Epoch 12*, which takes both of the bot's options: S7's new prerequisite (row E6-g, item 4.1, E12-4) and the counts corrected (E12-3); resolve it naming them. Unmerged, so no push run |
| benchmark #220 `c17903c1`, E6's stories amended to § *Epoch 11* (two files, +280-30; checks 10 success) | main of benchmark | fits | kept, except the lines of the next row — the merge sha's `ci` and CodeQL push runs success. What was built on it stands: S4 (#221) and S5 (#223) rest on its S4 and S5 text, which § *Epoch 12* does not supersede |
| the lines of #220's file that § *Epoch 12* supersedes, read at `a8106448`: D7 `:337-343` (S7's prerequisites); § 6's first paragraph `:412-416` (the form of every story's *Files* and *Done when*); S6 *Files* `:697-705` and *Done when* `:706-709`; S7 *Files* `:739-744` (its form) and *Done when* `:745-747` (its counts); § 11's exemption item `:814-826`; § 12 item 1 `:848-849` | main of benchmark | cut | — (a NEW benchmark PR, E6's stories amendment for epoch 12, prepared on `docs/e6-stories-epoch-12`, local); the judge: corrected by that NEW PR, `405dd714` (two files, the stories +85-2 and `todo/README.md` +1-1), merged after the owner opens epoch 12 and before S6's plan gate (item 2 point 2, item 8.3). Each line re-read at `a8106448`, and each is answered in the amendment's diff by a dated *Epoch 12* reading beside the old text, which stays: D7 gains the language-comparison prerequisite; § 6 gains item 8.1's form after its first paragraph; S6 *Files* and *Done when* as item 4.2 with row E6-m (the old list kept as observations, a *Was* line); S7 as item 4.5 and row E6-g (C# 4 at its start, *Was* "the C# guard 2"); § 11's DoD item widened to E6-m and the exemption item given E12-10's reading (S5's list `:825-826`, from #223, stands); § 12 item 1 widened; the status line; rows E6-m (new), E6-i (S6's half) and E6-g restated. D7, § 11's item and § 12 item 1 are older text (`239e078e`, 2026-11-12) that #220's file carries. #220 is not reverted: nothing built rests on these lines (S6 is a brief only, S7 not started) |
| benchmark #221 `e967df53`, E6.S4 (39 files, +1837-251; checks 11 success), with entry 11.1's four doc lines and the owner's one 9p run | main of benchmark | fits | kept — 39 files: 33 under `tests/Bench.Tests/ModelArms/`, entry 11.1's three model-arms docs (`research/module_model_arms.md` +5-5; dated notes in the IMPLEMENTED `PLAN_model_arms_E3.md` +9 and `PLAN_model_arms_E6.md` +13), the plan records (the stories +9-1, the S4 brief, `todo/README.md`); the merge sha's `ci` and CodeQL push runs success. No file under `spikes/` or `runner/`, so neither the narrowing nor row E6-m reaches it. Item 8.1's form is for the remaining stories and does not reach back; on S4's lines it holds anyway: the Node guard at `405dd714` (tree `a8106448` plus docs; re-run by this judge) has no finding outside `spikes/` and the two D8 lines, the C# copy none there (S6's brief O1 **[D]**); its one documented exemption is epoch 11's row E6-l reading (the pilot output), untouched by epoch 12; its grep-found docs are entry 11.1's, kept (item 4.4). Its brief stays in `todo/` with status "built", not promoted as S3's was: a records fix (E11-10) for the next E6 PR, not a cut. Not re-run (C#): the merged CI is the evidence |
| benchmark #223 `a8106448`, E6.S5 (66 files, +1276-216; checks 10 success; one listed `raw-temp` exemption, the stories' § 11) | main of benchmark | fits | kept — 66 files: 59 under `tests/` (`Bench.Tests/**`, `FakeCli`, `FakeCoai`), three seams in `src/Bench.Infrastructure/Git/` (`HarvestGates.cs`, `ScratchWorktree.cs`, `SolutionSignals.cs`), `research/module_tests.md` +9-1 and the plan records; the merge sha's `ci` and CodeQL push runs success. No file under `spikes/`. Both guards read no finding in its area at `a8106448` (Node re-run here; C# **[D]**); its one inline exemption (`tests/FakeCli/Program.cs:675`, `raw-temp`) is listed in the stories' § 11, item 8.1's meaning (i); none for `owner-blind`. Its six stale doc lines are F45, history by the owner's decision before item 8.1 existed; item 8.1 is not read back onto them. Its brief stays in `todo/` with status "built": a records fix, as #221's |
| rag_qln #128 `24b6ce88`, E7's stories amended to § *Epoch 11* (four files, +252-29: the stories, `todo/README.md`, the E7.S3–S5 brief promoted with its `research/README.md` row; checks 6 success) | main of rag_qln | fits | kept, except the lines of the next row — its push run on `24b6ce88` was red in `plans` → `Pin check` only (benchmark #220 merged 6 s later, 11:09:31Z, so the gitlink was stale against `c17903c1`), ended by #129 (push run success): #122's pattern in epoch 10 |
| the lines of #128's file that § *Epoch 12* item 4.5 supersedes, at `cdc78d4c` (the file's last commit is #128's): S2's *Files* `:505-547` (a list of named paths, "a path outside this list … goes to the parent first") and *Done when* `:565-577` (its guard sentence as counts), and § 6's standing line as E6's (item 8.3) (not in this table when it was written) | main of rag_qln | cut | corrected in a NEW rag_qln PR, E7's stories amendment for epoch 12 (item 2 point 5, item 4.5, item 8.3; not yet written), by Opus, before E7.S2's plan gate; the folders confirmed against S2's Fable spec if it exists by then. Re-read at `cdc78d4c`. #128 is not reverted: no S2 code exists (O12-g: since `48cbf896` only records and the gitlink changed) |
| rag_qln #129 `02475e3d`, #130 `4dfcadba`, #131 `cdc78d4c`: the benchmark gitlink to `c17903c1`, `e967df53`, `a8106448` (one file each, +1-1; checks 6 success each) | main of rag_qln | fits | kept — the one gitlink `external/dew_flow_benchmark` each; push runs on `02475e3d`, `4dfcadba`, `cdc78d4c` success. Pin bumps, not epic code; the last merged 18:39:24Z, before the stop's commit |
| benchmark `d836de52` on `feat/e6-s6-spikes`, S6's brief (Opus), docs only (two files, +412: the brief and one `todo/README.md` line; committed 19:06:28Z, before the stop's commit `cb5a33a1`, 19:25:15Z) | local, never pushed (`git ls-remote` of benchmark lists no such branch) | fits | kept as S6's starting material: parent `a8106448`; no such branch in the GitHub branch list either. Read whole against § *Epoch 12*: these stand — § 0's build (the shipped helper per test file, K1–K11, K13 (a) and (b)), § 3a's two listed exemptions (item 4.2 names them), § 4's site table and § 6's counts as observations, § 5's scenarios, § 8's commit series, § 11 O1–O12 (O1, O4, O10 and O11 are the revision's **[D]**), § 12 N1–N6, § 14 Q4–Q6 (brief-level, item 4.2). The parts to change are the next row |
| the same brief's parts § *Epoch 12* replaces (not in this table when it was written): the header `:3`, `:5-13` (STOPPED; "the next accepted change is the parent's ELEVENTH FULL STOP"; parent `22351c2` and § *Epoch 11*'s lines), where epoch 12 opens at 0 changes; § 0.1 `:29-55`, the *Files* form (named paths; `run_samples.py`'s row "not touched — § 13 S-1"; "every `research/` and `todo/` document but those in the table"; "a file … outside the table … is … the ELEVENTH FULL STOP", `:53-55`, where item 8.1 says what still counts); K12 `:154-156` ("carried to S7") and K14's last sentence `:171` ("No other `research/` file"); § 2 point 2 `:76-77` (Q1, Q2 open); § 6 `:251` ("unless Q1 (a), then 0"); § 7 `:272-273`, the `minigit-bench` and `lang-explore` whole runs with no word on the system interpreter (E12-5, the new owner question (a)), and `:286-287`, the whole lang-bench run, blocked and with no owned `TMPDIR` (row E6-m asks one per run); § 9 `:313-318`, "C# 14 → 2 … 0 if Q1 (a)" and "each FAILED list equal to its base run's (Q3)" for all three suites, wider than row E6-m, which approves ONLY policy-ab-quick's three named failures and wants `minigit-bench`, `lang-explore` and `lang-bench` green; § 10 `:327` ("The two runner lines (S-1)"); § 13 S-1 `:379-392` and S-2 `:394-400`, whose recommendation "not on S6's line" item 4.3 point 2 reverses (ONE dated line beside `PLAN_minigit_stack_bench_E2.md:89`, on S6's docs scope); § 14 Q1–Q3 `:406-408` | local, never pushed | cut | fixed forward by NEW commits on `feat/e6-s6-spikes` after E6's amendment for epoch 12 merges and the owner answers item 7's question (a), before S6's plan gate (item 2 points 3 and 4, item 8.3): the narrowing as item 4.1 and item 4.6 (the standing list of exactly two, S7's prerequisite, Q1 (b) decided); § 0.1 as item 4.2's bounded folders plus the grep's docs and item 4.3 point 2's note; § 7 and K13 with question (a)'s answer and an owned `TMPDIR` for every whole run; § 9 as item 4.2's *Done when* and row E6-m; Q3 as item 4.3 point 1; S-2 as item 4.3 point 2; the header's parent (§ *Epoch 12*). Never a rewrite of the commit (local work, it may be dropped) |
| this revision: § *Epoch 12* and this record (conventions `docs/rollout-epoch-12`), and E6's stories amendment for epoch 12 (benchmark `docs/e6-stories-epoch-12` `405dd714`, from `a8106448`) | local commits | fits | kept — the baseline epoch 12 is approved on, never an entry: conventions `b6aecc6` (19:44:40Z), `536b6a1` (19:45:11Z, item 4.5: E7.S2's folders proposed) and the judge's commit on top; benchmark `405dd714` (19:43:27Z); none pushed (neither branch in the GitHub branch lists of conventions and benchmark; `git ls-remote` empty for both). The benchmark half is the NEW PR of #220's cut row |
| benchmark #222 `bf173aa4` (16:35:27Z: the language comparison's gated specs of tasks 04, 06, 07, 08, 10; eight files, seven under `spikes/*/inputs/` and `research/module_lang_explore.md`, +406-7; checks 10 success); dew_flow_ai_language_comparison #6 to #10 (15:53–15:54Z, the five task specs); coai #1014, #1017; creds #374, #375 | main of each, outside this plan | — | — (reported: merged during epoch 11; #222's files are the inputs the S6 brief's O1 read, no test or script); the judge: outside this plan, no verdict, reported. #222 (head `335415a7`, the language comparison's F2.S1 P1 and P6): seven files under `spikes/*/inputs/` and `research/module_lang_explore.md`, data and documents; no test, script, helper or guard site; none of S6's folders (`spikes/*/test/**`, `run-tests.mjs`) and not `runner/`; the merge sha's `ci` and CodeQL push runs success. It carries none of this plan's work; its gate records read the runner pin (`inputs/gates/spec-*.md`), one more reason a re-pin of `runner/` is the language-comparison plan's (S6's brief S-1). The task-repository PRs #6 to #10: specs and samples, nine files each, no temp-site spelling in their added lines; that repository runs no checks. Coai #1014 (a changelog line) and #1017 (a coai plan's promotion); creds #374 (a release) and #375 (N16 promoted): product records |
| coai #1015 `b3abb791` (09:45:04Z) and creds #373 `4020515e` (10:28:47Z), merged before epoch 11 opened (#176, 11:09:19Z) and after the epoch-11 judge's search, in neither table; coai #1019 `b7173359` (19:44:23Z, after the stop's commit) (not in this table when it was written) | main of coai and of creds, outside this plan | — | outside this plan, no verdict; REPORTED. Product work: #1015 53 files, +4149-174 (E3 of the terminal door), checks 17 success, 1 neutral; #373 17 files (N16, the bridge deletes the key file it wrote), checks 19 success, 1 neutral; #1019 9 files (`remoteRead.ts`, `remoteSessionHost.ts`, its test, docs), whose rollup as read after the merge shows `extension · a real editor` failed and `macOS · mcp · server · bench`, `Windows · mcp` in progress. Their added lines searched (`testsToDelete`, `GetTempPath`, `mkdtemp`, `os.tmpdir`, `tmpdir(`, `TempDir.`, `tempfile`, `mktemp`, `GetTempFileName`, `TMPDIR`, `/tmp/`): #1015 and #1019 none; #373 two `/tmp/s.sock` strings in a fake ssh manager's argv (nothing created) and one doc line naming E2's `scripts/lib/leftovers.cjs`. On content they fit E5's and E2's contracts and carry none of this plan's work |

  (After the judge, 2026-11-17. Judged by an Opus judge against § *Epoch 12* and what it keeps of § *Epoch 11* and the
  sections under it, E6's stories at benchmark `a8106448` and the amendment `405dd714`, E7's at rag_qln `cdc78d4c`, and
  the local S6 brief `d836de52`: 11 rows fit; 3 are cut (the superseded lines of E6's and E7's stories, both merged,
  each by a NEW amendment PR; the S6 brief's parts, by new commits on its local branch); 2 rows have no verdict (the
  merges outside the plan, reported). Nothing merged in epoch 11 needs a revert, and no row is "unverified": every
  merge's file list and checks were read, and what could not be run (the C# verdicts) is the merged CI's, said in each row.
  Read for this list: `gh pr list --state merged --search "merged:>=2026-11-17"` in every repository of the owner pushed
  since 2026-11-16 (conventions, benchmark, rag_qln, coai, creds, ai_language_comparison, mcp, sidecar_rust, vscode_kit,
  amd_r9700, wsl_care, jinx_studio and the owner's profile repository; the last six have no merge that day): the rows
  above are every merge since epoch 10's judge, with coai #1015 and creds #373 added; `gh pr view` file lists and check
  rollups of every row's PR; the push runs of every merge sha (all success but rag_qln `24b6ce88`, its row); the open
  pull requests of conventions, benchmark, rag_qln, mcp, coai, creds and ai_language_comparison (only #179 carries this
  plan's work); the GitHub branch lists of conventions, benchmark and rag_qln (the one unmerged pushed branch of this
  plan's work is #179's); #179's review threads; `git worktree list` and the local branches of the three committed on
  2026-11-17: every other local branch of epoch 11 equals a merged PR head (#220 `47cab130`, #221 `1c198bf6`, #223
  `ad43346e`, #222 `335415a7`, #128 `312a4ed9`, #129 `ef53106a`, #130 `13dfbbc3`, #131 `bbee0dd0`, #176 `43527cf0`, the
  PR #177 `bbc72c06`, the PR #178 `14d0abd2`). Local, never pushed, and they may be dropped: conventions `local/e11-gate-extract`,
  `-2`, `-3` (epoch 11's gate extracts); outside the plan, benchmark `docs/f2s1-five-gates` `5c55e72c` (the earlier
  branch #222's body names). Read in the files: E6's stories at `a8106448` at every line the cut row names, with
  `git blame`, and the amendment's whole diff; E7's S2 at `cdc78d4c`; the S6 brief whole; the diffs' file lists of #221
  and #223; #222's body. Run: the Node guard (`--profile node --token bench --identity "the measuring harness"`) at
  `405dd714` with the mount `b1746499`: 87 findings, 85 in `spikes/`, the two D8 lines, none in `tests/`, `src/`,
  `hosts/` or `tools/`.
  The questions. (a) No merged PR contradicts § *Epoch 12* in what it built. Benchmark #220 and rag_qln #128 merged
  stories text that § *Epoch 12* replaces; as epochs 10 and 11 did, they are cut by a fix forward, a NEW amendment PR in
  each repository before the next plan gate there, not reverted: no code rests on those lines.
  (b) E6.S4's and E6.S5's merged code against § *Epoch 12*. Item 8.1's structural change (bounded folders plus the
  grep's docs; counts as observations; "zero unexplained findings") is the form of the REMAINING stories and reaches
  neither PR back; on their lines it holds anyway: zero findings of both guards in their folders, S5's one exemption
  listed (meaning (i)), S4's pilot output under epoch 11's row E6-l reading, their grep-found docs either entry 11.1's
  (kept, item 4.4) or F45's (history by the owner). The narrowing (row E6-m, the two runner lines) is S6's merge
  condition; neither PR has a file under `spikes/` and neither touches `runner/`. Their briefs stay in `todo/` as
  "built", a records fix, not a cut.
  (c) The S6 brief against § *Epoch 12*: the narrowing (S-1, Q1 as (b), the standing list of exactly two, S7's
  prerequisite), the new owner question (a) (the minigit-bench and lang-explore whole runs start `/usr/bin/python3`,
  its § 7 has no word on it), Q3 (its "FAILED list equal to the base's" for every suite is wider than row E6-m), S-2
  (reversed: a dated note on S6's docs scope) and the *Files* form (§ 0.1's named paths and its stop sentence) are the
  parts to rework; the cut row names each with its lines. Everything else stands.
  (d) Nothing merged into the plan's epics after the stop's commit (`cb5a33a1`, 19:25:15Z): the last code merge is the
  PR #223 (18:35:39Z), the last epic merge rag_qln #131 (18:39:24Z); after it only coai #1019 (outside). S6's brief
  (19:06:28Z) came before the stop's commit, and no code was written for S6; the amendment's and this revision's commits
  (19:43:27Z to 19:45:11Z) are the re-review's. Entry 11.1 was recorded (#177) before the S4 merge it describes.
  On the Narrowed line: agreed, `yes`; nothing in the done work changes it.
  For S6's plan gate, a fact, not a change: #222's body records, on benchmark `main` without its change, 10 failures of
  991 in `spikes/lang-explore/test` and 1 of 2394 in `spikes/lang-bench/test` ("the host's sandbox and box tests, the
  rehearsal runs, one priority test") **[D]**. Row E6-m wants both suites green, with only policy-ab-quick's three
  approved. So S6's base runs are read against row E6-m before S6's plan gate: a base failure there outside the
  followups plan's S5 timing list would be item 8.1's sixth kind, a counted change of epoch 12, and is better found
  before the gate than at the merge.
  Could not check: the consult text (`59b325a3`); every C# verdict (no build; the merged CI is the evidence); anything
  with Docker; Python; the suites' runs (S6's); E2's held feature review; the final state of #1019's two legs.)
  (After the plan gate, 2026-11-17. The plan gate read the operative extract of `7254d77` and `06225b48` (the status
  line, the epoch lines, epoch 11's entries, this record judged, the Definition of Done with its readings, § *Epoch 12*
  whole, E6's rows E6-m, E6-i and E6-g, D7, § 6, S6, S7, § 11 and § 12, S6's brief § 13 and § 14, E7's S2): session
  `10853099`, `proceed`; three findings, G1 and G3 accepted, G2 rejected with its reason. G1: row E6-m compared only the
  FAILED lists, so a run that stopped early, or a test that vanished or was newly skipped at the head, would pass it;
  the row now asks that both runs complete and that executed and skipped tests be reconciled by name, an unexplained
  missing test or a test newly skipped at the head stopping S6. G3: "a head failure not on the base list is S6's to
  fix" contradicted the S5 timing list's rule for a test that passed at the base and fails at the head; the row now
  sends that case to the list's rule (`/proc/loadavg`, the one file re-run alone when that starts no
  `/usr/bin/python3`, else a repeat allowance from the owner), and to S6 only if it fails again. Both in E6's
  amendment too (benchmark `7dcdffd9`). G2 (alias-safe checks for `BENCH_PILOT_OUT`): rejected, it is built: `PilotOut` resolves both the
  value and the temp root through real paths (`tests/Bench.Tests/ModelArms/PilotOut.cs:64`,
  `ExecutableResolution.RealPathClimbing`) and a fact pins a link into the temp root as refused
  (`PilotOutTests.cs:46`, `A_folder_at_or_under_the_temp_root_is_refused_even_through_a_link`), merged in #221 **[R]**
  at benchmark `a8106448`. Neither accepted finding narrows anything: both make row E6-m stricter; the Narrowed line
  stands. Next: an independent Opus review, then the owner.)
  (After the independent Opus review, 2026-11-17, of conventions `7c22aa1` and benchmark `7dcdffd9`: "do not approve
  as written"; with B1 and B2 fixed, "approve with fixes". Folded in ONE round of new commits, each citation read
  first; baseline edits, not counted. B1: row E6-m was unbounded, and its S5-list route contradicted that list's own
  rule (`todo/PLAN_bench_test_leftovers_followups.md:126`, "no re-run of a test or a file replaces it … The list is
  a record now, never a way past a red run", read at `a8106448`): the row's standing failures are now EXACTLY
  policy-ab-quick's three and the base lists the owner confirms in one line, within benchmark #222's counts
  (lang-explore ≤ 10, lang-bench ≤ 1, minigit-bench 0); a timing failure at the head is red, recorded on the list,
  and the owner decides on one repeat run. This withdraws the plan gate's G3 fold (its single-file re-run) and the words
  "Not a narrowing" of item 4.3 point 4; item 4.6 and the Narrowed line now say the same. B2: "the owned `TMPDIR` empty
  after the run" cannot hold where F2's makers write (`spikes/minigit-bench/test/helpers.mjs:42`, `test/fake-home.mjs:15`,
  both into `os.tmpdir()`, both excluded from S6 by name): the row now allows exactly their entries, listed by name
  at base and head, equal in kind, removed by exact path after; K9's start sweep only lists them (no claim, so
  `legacy`: the mount's `tools/lib/leftovers-sweep.mjs:357-360` at `b1746499` **[R]**). S-1 to S-9 and N-1 to N-4:
  row E6-m (the owned `TMPDIR` under `/tmp`, an approved failure's position against S6's changed line), items 4.1
  (the hand-off's decision point), 4.3 (per-commit runs; the wording of the layer's interpreter), 4.5 (E7.S2's
  folders), 7 (the questions, the consultants' cap, E2's held review), 8.1 (the grep and the kinds that count),
  E12-5, E12-7, O12-e; E6's amendment (the S4 and S5 briefs promoted, rows E6-i, E6-k, E6-l observed). Two facts for
  this table, not new verdicts: the S6-brief cut row above quotes row E6-m as it stood before the judge ("approves
  ONLY policy-ab-quick's three named failures and wants … green"); the brief's rework follows row E6-m as it stands
  now. The row "this revision" names the commits up to the judge's; the later ones — conventions `7254d77`,
  `7c22aa1` and this round's, benchmark `06225b48`, `7dcdffd9` and this round's `bd3ce7ba` — are baseline too (step 4: never an
  entry), written after the judge and not judged by it. The Narrowed line is revised as its note says.)
  (After the second plan-gate round, 2026-11-17. The gate read the operative extract of `2dc04da` and `bd3ce7ba`
  (215 KB, with the independent review's additions): session `a0abb03e`, `proceed`; one of two reviewers answered (the
  other could not take the extract's size); one finding, accepted. S6's brief makes claimed test folders outside the
  temp root, which its planned start sweep never reads, while the plan still promised that the next run collects what
  a killed run leaves, and no exception was declared (its Q6 accepted the home case as a limit only). The roots, read
  in the brief at `d836de52` **[R]**: (1) the operator's home, `os.homedir()` — the fake homes
  `owned.ownedDir(t, 'ahome', { parent: os.homedir() })` (`spikes/minigit-bench/test/agent-box-fs.test.mjs:15`) and
  `('home', …)` (`test/bwrap.test.mjs:116`) (K6, § 4 rows 11 and 14); (2) `/var/tmp` — the decoys
  `owned.ownedDir(t, 'vadecoy', { parent: '/var/tmp' })` (`test/agent-box.test.mjs:229`) and `('vdecoy', …)`
  (`test/bwrap.test.mjs:184`) (K6, Q4); (3) `/run/user/<uid>` — two sockets named by `owned.ownedName`
  (`agent-box.test.mjs:200`, `bwrap.test.mjs:159`), names only, closed and unlinked by the test, not claimed folders.
  Option (ii) fits none: the fake home must lie outside the temp root, over which the box mounts a tmpfs (K6; the box
  hides the operator's home and `/tmp`, `spikes/minigit-bench/lib/bwrap.mjs:24-25`), and each decoy must BE in
  `/var/tmp`, since the test proves the box hides it. Option (i) builds the followups plan's S1 (F1: "check whether a
  second call with the home as the root is safe") a second time, which D7 forbids. So option (iii), declared: the
  Narrowed line, § *Epoch 12* item 1's *Goal* (one bounded exception) and item 4.6 (3); row E6-m (7) lists those
  roots by name at base and head; the `/var/tmp` and `/run/user` roots go to the followups plan's S1 as a dated note
  (item 8.3). E6's amendment carries it (benchmark `743e3392`). The owner approves it with the Narrowed line.)
  (The owner, 2026-11-17, in this session: approved the revised plan with its `Narrowed: yes` reading, worded as the
  Narrowed line above (the two runner findings on a list of exactly two; exactly policy-ab-quick's three and the base
  lists the owner confirms within benchmark #222's counts; the goal's bounded exception for S6's claimed folders under
  `~` and `/var/tmp`; S7 waiting for the language-comparison plan's disposition) — epoch 12 opens by the owner;
  answered item 7's question 1 (approve as written) and question (a) with (1), yes: S6 may call `/usr/bin/python3` in
  the `minigit-bench` and `lang-explore` whole-suite runs, two runs each (base, head), on lang-bench's terms, with an
  owned `TMPDIR` under `/tmp`. Question (b) stays for S6's merge.)

> Epoch 12 · approved 2026-11-17 · by owner · state: open
- 12.1 · 2026-11-18 · owner · merge-conditions, approach — row E6-m: E6.S6 merges with NO standing test failure in the four suites it runs whole (policy-ab-quick, `minigit-bench`, `lang-explore`, `lang-bench`); the owner-confirmed base lists and policy-ab-quick's three named failures are replaced by fixes. The whole runs go without a `TMPDIR` of their own (S6 brief § 16 option (b)): each run's new entries of this user under `/tmp` are listed by name before and after and the run's are removed by exact path (row E6-m (7)'s outside roots unchanged). The host's dotnet packs go back to the SDK's own version (10.0.14, Ubuntu's debs from Launchpad, installed by the owner) and are held. The two runner lines (11.2) stay the approved standing list of the guards, not test failures
  (Found by S6's base runs at benchmark `a8106448`, brief § 15 and § 16 S-3 (benchmark `feat/e6-s6-spikes` `d971cf9d`):
  the claimed `TMPDIR` itself broke nine tests (green without it); thirteen more failures had four measured causes:
  policy-ab-quick's three test drive-letter paths (`D:/`) that are relative on Linux; eight C# builds and restores
  (`lang-explore` six, `minigit-bench`'s two egress restores) fail with NU1101 because on 2026-11-14 apt moved
  `dotnet-apphost-pack-10.0`, `dotnet-targeting-pack-10.0` and `aspnetcore-targeting-pack-10.0` to 10.0.15 while
  `dotnet-sdk-10.0` 10.0.114 (whose `BundledNETCoreAppPackageVersion` is 10.0.14, and which the frozen template's
  `global.json` pins with `rollForward: disable`) stayed: the template builds offline with the 10.0.14 packs and fails
  without them, and `apt-get -s` shows exactly three downgrades; `minigit-bench`'s preflight test takes `claude` from
  `PATH` (2.1.326) instead of the pinned toolchain `~/rsd/minigit/toolchains/claude-2.1.310` the pilot uses
  (`lib/bare-config.mjs:143`); `lang-bench`'s `test_rs_session_net.py:179` gives its group a 100 ms deadline that a
  loaded host spends before the writer threads start. Consult `1aaccdae` (codex): option 1, the packs downgraded and
  held, keeps the frozen comparison; the pin moving to 10.0.115 would change it. The owner, 2026-11-18, in this session:
  "чинить как хочешь, но все должно быть зеленым". Every fix is in S6's folders' tests or on the host; no `lib/`,
  `runner/`, `inputs/` or template byte. First change of epoch 12; the next accepted change is the twelfth full stop.)

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

The plan [PLAN_test_leftovers_merged_core.md](PLAN_test_leftovers_merged_core.md) (IMPLEMENTED 2026-10-27, promoted to `research/`) revises the contract E1 builds, so the consumer
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
   *[2026-11-04: CLOSED by the owner's written statement, P1's second option (§ *Epoch 2*, question 2): the owner's Windows machine does not build or test E2's and E5's repositories for now, so merge condition (c) is met for that machine; its barrier stays closed. Recorded in [research/security/machines.md](security/machines.md). The same record re-attests the operator's WSL machine: open for every place the developer account can read; its condition (c) waits for one administrator scan of two root-only places.]*
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
  [research/security/machines.md](security/machines.md). Condition (c) is met for the WSL machine, and row (c) of
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
*[2026-11-06: (c) is DONE, item 1's note and [research/security/machines.md](security/machines.md). The sentence above is the state at approval.]*

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

#### 3.4 E5.S7's rows at S7's end (2026-11-12; a progress record, not a change)

S7 is complete: coai's `raw-temp-baseline.json` went from 778 entries to zero in six pull requests, one per suite, each
through coai's plan and code gates and green on all CI legs, and the last one deleted the file. Read from coai `main` at
`8a036eac` **[D]**: the briefs `todo/PLAN_test_leftovers_E5_S7_{bench,scripts,bugs,server,extension,mcp}_brief.md`, and
`research/module_tests.md`, *S7, the drain*.

| Suite (scope) | Entries | Pull request | The file after |
|---|---|---|---|
| bench (`src_bench/CoaiBench.Tests/`) | 8 | #977 `e1b63958` | 770 |
| scripts (`scripts/`) | 10 | #979 `0107883e` | 760 |
| ingest (`src_bugs/tests/`) | 26 | #980 `395332cf` | 734 |
| Team server (`src_server/tests/`) | 57 | #981 `9c9f0929` | 677 |
| extension (`src_vs_code/src/test/`) | 219 | #984 `9a429757` | 458 |
| coai-mcp (`src_mcp/tests/`) | 458 | #985 `8a036eac` | deleted (S7-d) |

| Row | Result | Evidence (coai) |
|---|---|---|
| S7-a | done | #977: the standing step *The raw-temp baseline only shrinks* lost its `number != 945` clause and has run on every later pull request |
| S7-b | done | every drain PR removed a suite's entries together with their sites, RED first: the guard named exactly that suite's sites with the entries removed and the sites kept (8, 10, 26, 57, 219, 458), then GREEN, then RED again with one site put back; `--baseline-shrinks --base origin/main` "only shrinks" on each |
| S7-c | done | the standing step fetches the base at depth 1; no drain PR was a creation, and each shrink passed in CI |
| S7-d | done | #985, in one commit: the file deleted with its last 458 entries; `--baseline` dropped from the Node guard's run over the tree (`testLeftovers.test.mjs` N1) and from the C# repository guard (no baseline applied — the guard is red on ANY raw temp call outside the helpers); `The_baseline_file_exists…` became `The_drained_baseline_file_stays_gone`, RED with an empty file re-created; the two tests that only found the file retired; the shrink step stays and answers `absent now — drained` |
| S7-e | done | `shared/leftovers-exemptions.json` unchanged by all six PRs (its rows are line-keyed: no line moved above a row); no new `testsToDelete-exempt` marker |

What the drain found on the way, none of it a change to this plan: `LocalRuntimeTests` wrote into the machine's real
`/tmp/out` (now under the run folder, #985); a resolved temp-root parent broke a macOS-only premise in the extension suite
on its first CI run (fixed in #984 before merge: the replaced code used the unresolved root); `scripts/native/native.test.mjs`
names scratch folders with two random bytes and collided once on CI (recorded in coai's scripts brief as found, not fixed —
folding it in would have been a scope change); the coai macOS CI job sits at its 30-minute limit; one coai-mcp test read
an empty `/proc/locks` once in the SonarCloud job. Each is with the owner as a question.

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

## Epoch 9 — the plan as revised at the re-review (2026-11-16)

The whole plan read again, as step 4 of the full stop asks (`common/plan-change-control.md`), over the two entries of
epoch 8: 8.1, E2.4.S3's `bash -e` and a failed command substitution (built and merged in creds #329); 8.2, the rule's
own `container-scoped` marker refused by both guards. The re-review consult is `70aadaf7` (codex, two turns); the
question consultants before it: `144d10b2` (whether 8.2 counts: two of two, yes), and five single-question consults of
2026-11-12 on E7's open points (item 7). Advice, each point checked against the files or by a run (item 6). This
section is the baseline epoch 9 is approved on. § *Epoch 8* stays as the plan for everything this section does not name.
Superseded by this section, read from here: row E6-f of § *Epoch 8* item 3 (split into E6-f1 and E6-f2, item 3); proof
(3) of row E6-d ("no `.WithReuse(`", which named a guard class that does not exist, item 3); the THEN line of wave 3 in
§ *Epoch 8* item 5 (item 5 below).

**How to read the evidence.** **[M]** and **[D]** as in § *Epoch 8*. New in this section, each remaining row carries ONE
state: **observed** (the row's own check was run on a candidate that must pass AND on a counterexample that must fail,
both at the consumer's pin), **proposed** (the check is written, not yet run; never approved as measured), or
**blocked** (the check needs something this plan does not have; the row names what).

### 1. What this plan is now

**The root cause, the consultant's, checked.** Epoch 8 required an observed result for every row (§ *Epoch 8* item 8.1).
Row E6-f had one: "**[M]** no `testsToDelete-exempt` marker … in the file". That observed the TREE, not the CONDITION: the
condition was "the guard reads the marker", and nobody ran the guard on a marker. The rule was met in its letter. So from
epoch 9 an observation counts only when it runs the row's own executable check, on a candidate and on a counterexample
(item 8.1); a reading of the current tree is the starting point, written as such. The same slip is found twice more by
this revision, both measured: proof (3) of E6-d named "the draft's guard class `testcontainers`", and no guard has it
(`scanText('tests/X.cs', 'var c = new PostgreSqlBuilder("postgres:17").WithReuse(true).Build();')` → `[]` **[M]**);
and neither guard reads `Environment.SetEnvironmentVariable("TESTCONTAINERS_RYUK_DISABLED", "true")` in a `.cs` (Node
`[]` **[M]**; the C# template's `RyukOff` wants `[:=]` after the name, mcp `07a0f5b` `LeftoversGuard.cs:93`, read, not
run), while the same setting in a workflow or a `.sh` is `ryuk-off` **[M]**.

**State at the stop (read 2026-11-16).**

| Epic | State | Commits |
|---|---|---|
| E1, E3, E4 | DONE (wave 1) | as § *Epoch 8* |
| E2 (creds) | COMPLETE 2026-11-10. Its feature review is held by `call_human` since 2026-11-10 | #294, #310, #311, #329, #330 |
| E5 (coai) | COMPLETE 2026-11-12, S7's drain included (§ *Epoch 8* item 3.4) | #945; #977, #979, #980, #981, #984, #985 |
| E6 (benchmark) | stories MERGED; S1 MERGED (E6-h met); S2 MERGED (the adapted copy of mcp `21553ce`, the start-of-run sweep, case 15, the audit and its CI step *The audit fails a run that leaves a claimed folder*; the copied repository guard test is `Explicit` until S7, and no Node guard step runs in CI yet: that is S7's (corrected by the judge)); S3's brief drafted, uncommitted; S4–S7 not started. `main` `46e27108` **[M]** | #103 `239e078e`, #205 `2af2f0f1`, #207 `84d4953e` |
| E7 (rag_qln) | stories MERGED; S1 MERGED (E7-a met, E7-e recorded as known); the benchmark pin bumped; S2–S5 not started (a draft brief for S3–S5 in a worktree, unfinished). `main` `3cca951` **[M]** | #106 `36843c0`, #108 `815e7a6`, #109 `3cca951` |
| Merge condition (c) | DONE for the WSL machine (#136); for E6 and E7 also by the owner's statement that their Windows machine builds and tests neither repository (conventions #166) | `37b9aa5`; #166 `113e9c2` |
| F30, F31 | as § *Epoch 8* | — |
| The feature reviews | not started | — |

**Goal and Definition of Done.** Both stand word for word, with § *Epoch 8*'s reading. The Definition of Done's "every
container-scoped database carries exemption (b)" (`common/test-leftovers-detail.md:352`) is now meetable only after F41
and F42 (item 2): today no guard accepts the marker it names.

### 2. Prerequisites

1. **F41 (conventions): `container-scoped` is an exemption kind of its own** (item 4.2), in the rule (§6 (b), §7's
   grammar) and in the shipped Node guard with its tests; one release; benchmark's rules pin bumped to it. Before the E6
   story that writes the marker. A follow-up of `todo/PLAN_test_leftovers_merged_core_followups.md`, as F30 was.
2. **F42 (mcp): the C# template takes the same kind, and N1–N5 are reproduced** (row F42-b): each one that reproduces and
   applies is fixed in the template, RED first. Then benchmark's adapted copy is re-synced to that mcp commit (its
   manifest re-pinned, `TheAdaptedCopyTests` green), and E7.S3 copies from that commit, never from `21553ce`.
3. **E7.S2 waits for observations of the live stores** (rows E7-b's shared-store branch, E7-c, E7-f): the owner's, item 7; E7-l's live half runs on a throwaway Qdrant. Its Fable spec
   may be written; its plan gate waits. E7.S3–S5 do not wait for it (the owner's answer of 2026-11-12).
4. Not prerequisites: F32; F43 (item 3); the coai findings of S7 (`native.test.mjs`'s collision, the macOS limit,
   `L_N1a`'s empty `/proc/locks`), which are coai's own follow-ups; rag_qln's search ranking, a todo of its own (item 6).

### 3. Merge conditions — the rows this revision adds or restates

Every other row of § *Epoch 8* item 3 and of E6's and E7's stories documents stands, word for word; a row restated here
keeps every check its earlier text had and adds to it. State as defined above. The rows not restated here (E6-a, b, e,
h; E7-a, e, g, i, j, k) carry the evidence their documents give; the stories revisions of item 8.3 write a state on each.

| # | Condition | Implementation | Executable check | Does not prove | State |
|---|---|---|---|---|---|
| F41-a | the marker of §6 (b) is accepted, and only as item 4.2 says | conventions: `tools/leftovers-check.mjs` (`EXEMPTIBLE`, `exemptionProblem`, `isExempt`), the rule §6 (b) and §7 | fixtures in the guard's test: the marker alone → `[]`, in both spellings (`lives and dies with`, `live and die with`); over a `DROP DATABASE bench_case`, a `DROP SCHEMA bench_case` or a `FLUSHDB` line → `[]`. Counterexamples, each red: neither spelling followed by a word (`exemption`); a placeholder reason (`exemption`); the marker over a `TRUNCATE TABLE users`, a `FLUSHALL` or a delete-all (`shared-store` stays: a reset that is not the container database's own teardown needs (a)'s lock or a per-run name); the marker two lines above a `DROP DATABASE` (`shared-store` stays); the marker over a `docker run` without `--rm` (`docker-run` stays), over a `--name` not in the owner form (`docker-name` stays), over a `TESTCONTAINERS_RYUK_DISABLED=true` (`ryuk-off` stays), over an owner-blind glob (`owner-blind` stays), over `mkdtemp(` (`raw-temp` stays) | that the container really dies with the fixture: E6-f2 | **proposed**. Observed today, the RED half: the marker alone → one `exemption` finding ("an exemption names an unknown class `container-scoped`"); over the `DROP` line → that finding and `shared-store` **[M]** at `8ae5eb6` |
| F41-b | consumers read F41 | the release; benchmark's `.agents/conventions` pin | the gitlink reads the release (GitHub API) | — | **proposed** |
| F42-a | the C# template agrees with F41-a, case for case | mcp `tests/Mcp.Tests/Leftovers/LeftoversGuardExemptions.cs` (`Exemptible`, `ReasonProblem`), `LeftoversGuardTests.cs` | the same fixtures as F41-a in the template's tests | — | **proposed**. Observed today: `Exemptible` lacks the class, so the marker is "an unknown class" (mcp `07a0f5b`, `:11`, `:53`; read, not run: no .NET run here). F42 also corrects the class's doc comment, which says "a marker that exempts nothing is a finding" while `Read` passes such a marker (the independent review) |
| F42-b | N1–N5: each reproduced, then fixed or bounded | mcp's template | N1: a claimed folder holding a git clone, removed on `windows-latest` (read-only object files); N2: a child writing more stderr than a pipe holds; N3: a link path with a space and a shell metacharacter; N4: a deliberately hanging child under `MountedSelectorPick`; N5: an existing temp root the user cannot read (`chmod 000`, not root) must not read as empty. RED first for each that reproduces | a reproduction on one OS for N2–N5 | **proposed**; N1 is hosted only (Windows). One that does not reproduce is recorded with its run, not fixed |
| F42-c | benchmark's copy is the template's bytes again | benchmark's manifest, re-pinned to F42's commit | `TheAdaptedCopyTests` green; one byte changed in a copied file → red | — | **proposed** |
| E6-f1 | the per-test databases carry the §6 (b) marker, and both guards accept it at benchmark's pins | `tests/Bench.Tests/Infrastructure/PostgresFixture.cs`, beside `NewEmptyDatabaseAsync` | FILE-scoped, because benchmark's tree is not clean before S7 (the Node guard: 209 findings at `46e27108`, entry 8.2; the copied C# repository test is `Explicit` until S7): no finding in `PostgresFixture.cs` from either guard (the copied C# guard's scan of that file; `scanText` of the Node guard), and the Node guard's count over the repository unchanged against the base; the same file with the reason's `live and die with` removed: one `exemption` in each. "Both guards clean on the head" stays S7's | the lifetime | **blocked** on F41-b and F42-c |
| E6-f2 | the fixture's container ends with the fixture, and reuse is never set | benchmark's fixture tests (E6.S3) | (1) the container exists, by its captured id, BEFORE disposal, and the Docker query that says so succeeded; (2) after disposal the same query succeeds and finds nothing — a failed query is never "absent"; (3) reuse, proved at RUN time by (2): a reused container is not stopped by disposal, so (2) is red whenever reuse is in effect, whatever turned it on. RED, each: reuse enabled through the builder the fixture uses, and through configuration alone (`TESTCONTAINERS_REUSE_ENABLE=true`, or `testcontainers.reuse.enable=true` in the properties file the pinned version reads), with the fixture's source unchanged. A read of the built container's reuse setting (if the pinned API exposes it) or a source test may be added, never instead of (2) (the plan gate, round 1) | other consumers' fixtures; a shared `testcontainers-reuse` class is a follow-up only when a second consumer needs one (item 4.2) | **proposed**; Docker runs only in hosted CI (`BENCH_REQUIRE_DOCKER=1`; no `docker` here **[D]**) |
| E6-d | restated: three separate proofs | `PostgresFixture.cs` | (1) Ryuk: the container exists (query succeeded) before the child is killed, and is gone after; (2) the owner label `testsToDelete.owner` on the builder, read by the container pass; (3) = E6-f2 (3). And no `TESTCONTAINERS_RYUK_DISABLED` in any spelling: a benchmark test over its `.cs`, because neither guard reads the `SetEnvironmentVariable` form (item 1, F43) | Ryuk collects by session, not by owner | **proposed**; hosted |
| E6-c | a killed child's worktree is collected | the copied sweep, case 15 (S2) | case 15 | Windows: N1, which does not arise here: benchmark's workflows have no Windows leg (`git grep -i windows origin/main -- .github/workflows`: nothing, the independent review) and the owner's Windows machine builds neither repository (#166) | **observed** by S2 on Linux (#207, RED then GREEN, **[D]** its brief; not re-run by this revision). Windows: not applicable while benchmark has no Windows leg; N1 is F42's for the template |
| E6-g | the guards read every directory E6 promises | the copied C# guard (copied in S2, its repository test `Explicit` until S7) and the Node guard step in CI (S7; S2 added none) (corrected by the judge) | both guards green on the head (S7, as E6's stories say); and per directory, a planted raw temp in a file of a kind that directory's guard READS is red: the C# copy reads `.cs` under `tests/` and `src/`; the Node guard under `--profile node` reads `*.test.mjs` and `.sh` but NOT a plain `.mjs` (`isScanned('node')`: `spikes/minigit-bench/lib/heldout-run.mjs`, `tools/x.mjs`, `spikes/policy-ab-quick/test/x.mjs` false; `spikes/policy-ab-quick/test/x.test.mjs`, `tools/x.sh` true **[M]**). A promised directory whose files no guard reads is named in the stories revision as a limit, with its file kinds; a scan of nothing is red | which plain `.mjs` files make temp paths: no guard reads them | **proposed**: S2 planted no directory for this row |
| E7-b | a capped store never evicts a test collection, or tests never share a capped store | as E7's stories | as E7's stories | — | two branches. "Tests never share a capped store" can be enforced in code (the tests' store refuses a budget, or the suite refuses a store with one): **proposed**, S2's spec. "Never evicts a test collection" with a shared capped store: **blocked**, whether a running daemon with a budget shares the live tests' Qdrant is not known here; a read-only probe on the owner's machine observes it (item 7) |
| E7-c | the live tests' writes are serialized across processes before any rename test runs against the store | as E7's stories | two live runs at once on one store, controlled: the second waits or refuses, by test | — | **blocked**: a live run with the stores, on the owner's machine (item 7), or on a throwaway store set if S2's spec shows the live suite can run against one (then **proposed**) |
| E7-d | the four ownership states, one test each | S2's spec | as E7's stories | — | **proposed** (S2's spec) |
| E7-f | the growth figure, measured with its command | E7's § Growth | `du -s -B1` of Qdrant's collections folder before and after one live run, and after a second run (no growth) | one machine, one date | **blocked**: the stores' folder is on the owner's machine (item 7) |
| E7-h | the C# copy reads rag_qln's layout | E7.S3 | S3's manifest check, and the copied guard run on a recursive checkout | — | **proposed**; copies from F42's commit (item 2) |
| E7-l | Qdrant accepts the owner-form collection name `teststodelete_<owner>_rag_<what>_<id>` and every name S2 makes | S2's spec: ONE name builder whose segments' characters and the whole name's longest length are written against Qdrant's documented collection-name rules | a unit test of the builder at its bounds (the longest owner, `<what>` and id it allows is within the limit; a segment with a refused character or one over the length is refused by the builder, never sent); then a live create and delete of the SHORTEST and the LONGEST name it builds (the plan gate, round 1) | — | the unit half **proposed**; the live half **proposed** on a throwaway Qdrant (a user process unpacked into an owned folder, as this machine runs stores; no owner's store needed), not blocked (corrected by the independent review). Added by this revision, from the consultant |
| F43 | a pointer: neither guard reads Ryuk disabled through `SetEnvironmentVariable` in a `.cs` | the follow-ups plan | — | — | recorded; E6-d (1) proves Ryuk by a test, so it is not a prerequisite |

### 4. The dispositions of entries 8.1 and 8.2

**4.1 Entry 8.1 — kept as built** (creds #329; § *Epoch 8* item 3.3).

**4.2 Entry 8.2 — `container-scoped` becomes an exemption kind of its own.** Decided:

1. **The form does not change:** `testsToDelete-exempt: container-scoped — <what> lives and dies with <fixture or job>`,
   as §6 (b) writes it. E6's text writes the plural, "the per-test databases **live and die** with the PostgresFixture
   container" (E6's stories `:49`, `:248` at `46e27108`; the S3 brief `:183`), so both spellings are accepted (point 2)
   and no consumer's text changes.
2. **Valid** when the general reason rule holds (ten characters, three words, not a placeholder) AND the reason matches
   `\blives? and dies? with\s+\S+`: the owning fixture or job is named.
3. **It is a declaration.** A valid marker with no finding beside it is clean (both guards pass a valid marker that
   exempts nothing: `[]` in Node, run by the independent review; C# `GuardExemptions.Read`, read, not run). "Exempt from
   the name" needs no guard exemption: an unprefixed `CREATE DATABASE` and a workflow `services:` give `[]` (run by the
   independent review). "Exempt from its own teardown" is the one finding it clears: `shared-store` on its line and the
   next, and only for the teardown of the container's database, schema or namespace itself — `DROP DATABASE`,
   `DROP SCHEMA`, `FLUSHDB`. A `TRUNCATE`, a `FLUSHALL` or a delete-all stays `shared-store`, so no writer avoids (a)'s
   `lock:` by choosing this kind. Both guards key exemptions on the finding class (`isExempt`, `IsExempt`), so the
   implementation must also see which statement hit. It never clears `ryuk-off` or `owner-blind` (they refuse every
   exemption), nor `docker-run`, `docker-name`, `raw-temp`, `raw-worktree` or `legacy-name`: a fixture's container is
   still named in the owner form (§5), and that stays checked. §7 says all of this.
4. **Why not the `shared-store` class with a different reason:** its `lock:` is mandatory (the marker written as
   `shared-store` is refused for having no lock **[M]**), and (a) means a long-lived shared store, the opposite of (b).
5. **Why not narrow E6-f** (drop "the guard reads the marker"): it would make a merge condition smaller (`Narrowed: yes`)
   and leave the Definition of Done's sentence unmeetable.
6. **Reuse stays a consumer's fixture test** (E6-f2 (3)), not a shared class: a pattern for `.WithReuse(true)` misses
   variables, wrappers and configuration, and the fixture test reads what was built. A shared class without an exemption,
   like `ryuk-off`, is a follow-up only when a second consumer needs it.

**Narrowed: no.** Two prerequisites are added (F41, F42), E6-f is split into two rows that each check more, E6-d (3)
gets a check that exists, and E7's live rows are named blocked instead of being approved; nothing is removed. Every
restated row keeps its earlier checks (E6-g's "both green on the head", E7-c's "before any rename test" and "by test",
E7-h's recursive checkout, the LAST line's R6: restored after the independent review found them dropped). The
exemption itself is narrower than a plain class exemption (point 3): that makes the guard stricter, not the plan
smaller. **The epics do not change**: no Fable re-split; F41–F43 are follow-ups, as F30 was, and E6's and E7's stories
are revised by Opus (item 8.3).

### 5. Build order

```
DONE   epoch 8 approved (#142) → E2.4 (#329, entry 8.1) → E2.5 (#330) → E5.S7 (#977…#985) → E6 stories (#103)
       → the owner's statement (#166) → E7 stories (#106) → E6.S1 (#205) → E6.S2 (#207) → the rag_qln pin (#108)
       → E7.S1 (#109) → the stop (entry 8.2, PR #167, merged `ebb8a75`) → this revision.
       (Merge order, corrected by the judge.)
NEXT   the Opus judge sorts epoch 8's work (step 5) → the plan gate on an operative extract and an independent Opus
       review → epoch 9 opens `by reviewers` (Narrowed: no).
THEN, at once:
  conventions  F41, its fixtures (F41-a) settled first → a release. A release is a promotion of `release`, and every
               consumer's pin check wants its pin at that tip, so all nine consumers' pin checks turn red at once:
               the promotion check runs first (the consumers' releases in flight, the open PRs against each cap), a
               pin bump PR is planned in each of the nine (the owner's over-cap word where a repository is at its
               cap), or F41 rides a promotion already planned. Benchmark's bump is F41-b.
  benchmark    E6's stories revised (item 8.3), a NEW PR, by Opus.
  rag_qln      E7's stories revised (item 8.3), a NEW PR, by Opus.
THEN   mcp: F42 (F42-a after F41-a's fixtures are settled, so the two guards agree; N1–N5 reproduced, the applicable
       ones fixed), one PR, RED first. It needs no F41 pin: the template reads only the rule's Tokens table.
THEN, at once:
  rag_qln      E7.S3 → S4 → S5 as E7's stories (one PR), copying from F42's commit. E7.S2's spec may be written; its
               gate waits for item 7's observations.
  benchmark    the copy re-synced to F42 (F42-c) → E6.S3 (its brief revised for E6-f1, E6-f2, E6-d; F41-b first)
               → S4 … S7 as E6's stories.
LAST   the feature reviews (§ *Epoch 8* item 5); the promotion of this plan and its stories documents; R6 ticked in
       the remainder plan.
```

### 6. What the re-review consultant raised, and what was done with it

| Point (consult `70aadaf7`) | Checked | Done |
|---|---|---|
| The failure is evidence that a mechanism exists taken as evidence that the condition holds | True: E6-f's "[M] no marker" (item 1) | Item 1; the three states; item 8.1 |
| `container-scoped` a kind of its own, not `shared-store` (its `lock:` is mandatory), grammar with resource and owner, say what it suppresses; both guards, then manifests and pins | `lock:` measured; both guards read | Item 4.2; F41, F42, F42-c |
| `.WithReuse(true)` is `[]` in the guard | `[]` **[M]** | E6-d, E6-f2 (3) |
| Reuse: a benchmark fixture test, reading the built container if the API allows; a shared class later | — | E6-f2 (3); item 4.2 point 6 |
| Split E6-f into the marker grammar and the fixture proof | — | E6-f1, E6-f2 |
| E6-c, d, f, g: worktree collection, existence before the kill, a successful query before "absent", plants in every promised directory | True: no row asked for a successful query or for each directory | Rows E6-c, E6-d, E6-f2, E6-g |
| E7: eviction, two processes, each state, Qdrant's acceptance of the name, the exact `du`; without the live store E7's dependent work stays blocked | True: none can be observed from here | Rows E7-b, c, d, f, l; item 2 point 3 |
| N1–N5 under the template's owner; N1 and N5 threaten cleanup and the audit; reproduce before another copy relies on them | The notes are by reading or by a gate | F42-b, before E7.S3 |
| Nothing merged needs a cut without evidence | The judge checks it (step 5) | The record's table |

Added by this revision beyond the consultant: the Ryuk spelling neither guard reads (F43, E6-d), and the sweep's
directory list of E6-g. Rejected: nothing.

### 7. Questions for the owner

None for the approval (`Narrowed: no`). Asked of the question consultants first, one question each (2026-11-12), and
their answers taken: E7's failing live test is a ranking regression (it passed at `caf9f0b`), a rag_qln todo of its
own, not built now; E7.S2's observations are a short read-only probe of the budget keys on a real daemon, one controlled
run of two live processes, and `du -s -B1` before and after; the costly native store setup is not repeated by default;
coai's `native.test.mjs` collision waits for coai's PR capacity; the macOS limit waits for ten runs' step timings;
`L_N1a` is tracked now with the raw `/proc/locks` kept. (Since then, outside this plan, during the stop: coai #994
`8b1a0086`, 2026-11-13, raised the macOS leg's limit to 45 minutes to release mcp 0.65.2, not on ten runs' timings; coai
#996 `5e25da77`, 2026-11-15, made `native.test.mjs`'s PATH folders owned folders through E5's `wrap.ownedDir`, the
owner allowing it over the PR cap. Added by the judge.) **What only the owner can give:** whether a running daemon
shares the live tests' Qdrant, and whether they run the probe and the live run of rows E7-b, E7-c and E7-f on the
machine that has the stores. Until then those rows stay blocked and E7.S2 does not go to its plan gate.

### 8. The way of working — so a ninth stop is less likely

**8.1 What changes.** Added to § *Epoch 8* item 8.1:

- **An observation runs the row's own check.** "Observed" means the executable check of the row ran on a candidate that
  must pass and a counterexample that must fail, at the pin. A reading of today's tree is the starting point and says so.
- **A marker or an example spelling is run through BOTH guards** (the shipped Node guard and the consumer's C# copy) when
  a document writes it.
- **A row names its state** (observed, proposed, blocked); a blocked row names what unblocks it and who has it.

**8.2 The surprises still likely.**

| Story | What it is likely to meet | Why |
|---|---|---|
| F41 | a consumer's tree whose count changes with the new class; nine pin checks red at once | the kind is new; each pinned consumer re-runs the guard at the bump; the release is a promotion (item 5) |
| F42 | N1 needs a flag change that follows no link; N4 on Windows | by reading only |
| E6.S3 | whether the pinned Testcontainers API exposes the reuse setting | not read yet (E6-f2 (3)) |
| E7.S3 | the copy taken before F42 ships | the order of item 5 |
| E7.S2 | no machine with the stores | item 7 |

**8.3 What the other documents' own revisions must say** (each its own gate work; added after the judge, who found the
gap): benchmark's E6 stories, in a NEW PR before E6.S3's plan gate — rows E6-d (3), E6-f, E6-g and S3's dependency and
scenarios as item 3 (E6-f1, E6-f2, the restated E6-d and E6-g; S3 after F41-b and F42-c), and S7's planted
`.WithReuse(true)` replaced by E6-f2's fixture test (the judge's cut row lists the lines); the E6.S3 brief rewritten
locally to the same rows (its plan to write the marker now and accept the `exemption` finding is cut). rag_qln's E7
stories, in a NEW PR before E7.S3's plan gate — D2's and S3's "mcp `9bf9f5b` or later" becomes "F42's commit or later",
the build order gets F42 before S3, row E7-l is added, and rows E7-b, E7-c and E7-f say **blocked** with item 7's
observations. The follow-ups plan carries F41–F43 (this revision).

#### Progress, 2026-11-16 (a progress record, not a change)

The first two THEN steps of item 5 are done.

| Step | Result | Where |
|---|---|---|
| E6's stories revised (item 8.3) | merged; plan gate `215fc3a2` (one finding accepted: the container pass runs inside `PostgresFixture.InitializeAsync`, before its container, as D9's "before the fixture starts" says; three rejected with reasons), an independent Opus review (eight points) | benchmark #215 `275f8fd7` |
| E7's stories revised (item 8.3) | merged; plan gate `98d4b974` (three findings rejected with reasons), an independent Opus review | rag_qln #119 `e6c8d8cc` |
| F41 (row F41-a) | merged: its own plan `research/PLAN_F41_container_scoped.md` (promoted 2026-11-16) (plan gate `a4ec9471`, code gate two rounds, an Opus review; one entry, 1.1: the rule text is a companion rule, `common/test-leftovers-exemptions.md`, loaded by the detail's `depends`, because the detail is at its size cap and is never trimmed — the question consultants `7f0817ef`) | conventions #171 `b1746499` |
| F41-b | `release` promoted to `b1746499` (2026-11-16, after the other sessions said no consumer release was in flight; coai's bump went first, at a peer's request); the pin bump in all nine consumers, over the cap where needed (the owner, 2026-11-16) | benchmark #216, mcp #82, sidecar_rust #81, vscode_kit #35, wsl_care #199, creds #372, amd_r9700 #37, rag_qln #121 (with its benchmark and mcp pins), coai #1004 |
| F42 (rows F42-a, F42-b) | merged: its own plan in mcp (plan gate `53616e7e`, code gate four rounds, an Opus review). The marker reads case for case with the Node guard, and ONE live differential check runs both guards over one scenario table (line and class for every row; the text for `shared-store` and `exemption`, whose text is the contract). Its first run against the F41 release found one real difference — under the marker C# read the first match only — and C# now reads a marked line whole, as Node does. N1 reproduced on `windows-latest` (run 43928795620, the folder of a git repository kept) and fixed (read-only cleared below the folder, no reparse point entered, a file with a second hard link never changed); N2 did not reproduce (kept as a pin); N3 pins `cmd`'s own behaviour; N4 and N5 reproduced and fixed | mcp #81 `53f65130` |

**Corrections to this section, plain facts** (found by the stories revisions and their reviews):

- Row E7-l: the collection name is `teststodelete_<owner>_qln_<what>_<id>` — rag_qln's registered token is `qln`
  (`common/test-leftovers-detail.md`, the Tokens table), not `rag`.
- Item 3's sentence before the table names "E7-k": there is no row E7-k; the rows not restated are E7-a, e, g, i, j.
- Rows E6-f2 and E6-d: benchmark has no `BENCH_REQUIRE_DOCKER`; its fixture fails loudly without Docker
  (`PostgresFixture.cs:45-47` at `46e27108`), and only hosted CI has Docker.
- Row E6-g: the guards read more than the row lists. The Node guard under `--profile node` also reads `.ps1` anywhere,
  workflows, `*.spec.*`, and every non-binary file under the root `tests/`, `test/` and `scripts/` folders; the C#
  copy also reads `.sh`, `.ps1` and `.py` everywhere, workflows, and `.mjs`/`.js` under `http/` and `.github/scripts/`.
  E6's revised stories carry the measured table per directory.

**Carried, not decided here:** (1) whether Testcontainers 4.16.0 has any configuration path that turns reuse on — its
DLL's strings show none; E6.S3's brief settles it by a run, and if there is none, row E6-f2's "through configuration
alone" counterexample has no instance and the record says so (counted by the rule if it changes the row). (2) E6.S3's
brief checks the EFFECTIVE Ryuk setting at the fixture's start (the plan gate `215fc3a2`). (3) E7.S2's Fable spec gets
a claim-first case where run A holds a live claim AND an existing collection while B sweeps (the plan gate `98d4b974`).

Next (item 5): benchmark's copy re-synced to F42 (F42-c), then E6.S3; rag_qln's E7.S3 → S5 from F42's commit.

## Epoch 10 — the plan as revised at the re-review (2026-11-16)

The whole plan read again, as step 4 of the full stop asks (`common/plan-change-control.md`), over the two entries of
epoch 9: 9.1, F42-c (benchmark's copy re-synced to mcp's F42) cannot keep E6's § 6 boundary "No benchmark-own file
changes" (found by F42-c's brief, benchmark `feat/e6-copy-f42` `07527ee5`, pushed, no PR); 9.2, E7's stories model the
copied C# guard's walk over `external/` wrongly (found by E7.S3–S5's brief, rag_qln `feat/e7-s3-s5` `a7189a5`, local).
The re-review consult is `a84fb14e` (codex); the question consultants before it: `57ac1bd6` (9.1, two of two: a change),
`50be6245` and `6a830a2c` (9.2). Advice, each point checked against the files or by a run (item 6). This section is the
baseline epoch 10 is approved on. § *Epoch 9* stays as the plan for everything this section does not name, and § *Epoch 8*
under it. Superseded by this section, read from here: row F42-c and row E7-h of § *Epoch 9* item 3 (restated, item 3);
the THEN lines of § *Epoch 9* item 5 (item 5 below); entry 9.1's last sentence, "E6's § 6 sentence is amended in F42-c's
own PR" (it is amended in E6's stories amendment, item 5); F42-c's brief § 0.1, "exactly five touches" (a bound by
paths, item 4.1).

**How to read the evidence.** **[M]**, **[D]** and the three states (**observed**, **proposed**, **blocked**) as in
§ *Epoch 9*. New in this section: **[R]** marks a statement read from code and NOT run, as E7's brief marks it; a row
resting on **[R]** is never observed. Every **[M]** here was run for this revision on 2026-11-16, read-only, at
conventions `745d7204` (its `tools/` and `common/` equal the release `b1746499`: `git diff --stat b1746499 HEAD --
tools/ common/` prints nothing), benchmark `83f166d6`, rag_qln `1e524b66` and mcp `53f65130`. No .NET build and no Docker ran
for this revision (.NET is installed here, item 8.1), so every statement about the C# guard's verdict is **[R]** or **[D]**.

### 1. What this plan is now

**The root cause, the consultant's, checked.** Epoch 9 required that an observation run the row's own check, and gave
every row of the acceptance tables a state (§ *Epoch 9* item 8.1). Both entries of epoch 9 came from text OUTSIDE those
tables. Entry 9.1 came from a scope line of a prerequisite PR: E6's § 6 *Before S3*, "No benchmark-own file changes"
and "Files. … (manifest targets and `template-manifest.json` only)" (benchmark `todo/PLAN_test_leftovers_E6.md:315-316`,
`:319` at `83f166d6`). Entry 9.2 came from a story's break-it list and the place of one copy operation: S5's plant "a raw
temp call in `external/x/tests/A.cs` NOT read" and S5's "never `external/`" (rag_qln `todo/PLAN_test_leftovers_E7.md:378-379`,
`:371-372` at `1e524b6`), and D2's list of adaptations (`:140-142`). Neither line had a state, and neither was run: the
scope line was never tried against a re-sync from a clean checkout, and the plant was never put through the copied guard,
whose walk reads a `.cs` only under the root `tests/` or `src/` (mcp `53f65130`
`tests/Mcp.Tests/Leftovers/LeftoversGuardFiles.cs:63-64` **[R]**), so the plant could never be red. The approval evidence
covered the rows; it missed the executable claims written elsewhere in the stories documents. So from epoch 10 (item
8.1): every copied-tool discovery boundary and every break-it plant that a stories document or a brief states names its
consumer SHA, its upstream pin, the exact invocation, the fixture path, the expected diagnostic and the OBSERVED result,
run before that document's plan gate and again when one of those inputs changes; and a file-scope line is a list of
named paths with the dependency that needs each, proved complete by a run (item 4.1), never a count or a bare "no other
file". This revision applies it at once: item 3.2 lists every such claim it found in E6's and E7's stories, each with a
state.

**State at the stop (read 2026-11-16).**

| Epic | State | Commits |
|---|---|---|
| E1, E3, E4 | DONE (wave 1) | as § *Epoch 8* |
| E2 (creds) | COMPLETE 2026-11-10. Its feature review is held by `call_human` since 2026-11-10 (not re-read) | #294, #310, #311, #329, #330 |
| E5 (coai) | COMPLETE 2026-11-12, S7's drain included | #945; #977, #979, #980, #981, #984, #985 |
| F41 (conventions) | MERGED and RELEASED: `release` = `b1746499` (`git ls-remote` **[M]**); its plan promoted (`research/PLAN_F41_container_scoped.md`, #172) | #171 `b1746499` |
| F41-b | DONE in all nine consumers: each `.agents/conventions` gitlink reads `b1746499` through the GitHub API **[M]** | benchmark #216, mcp #82, sidecar_rust #81, vscode_kit #35, wsl_care #199, creds #372, amd_r9700 #37, rag_qln #121, coai #1004 |
| F42 (mcp) | MERGED; check runs on `53f65130` all success on Linux, Windows and macOS **[M]** (read through the GitHub API, not re-run) | #81 `53f65130` |
| E6 (benchmark) | stories revised (#215); S1 and S2 merged; the rules pin at `b1746499` (#216); F42-c's brief pushed, no PR (entry 9.1); E6.S3's brief local and untracked, unchanged since 2026-11-12 (so not yet rewritten as § *Epoch 9* item 8.3 asks); S4–S7 not started. `main` `83f166d6`, its checks all success **[M]** | #103, #205, #207, #215 `275f8fd7`, #216 `83f166d6` |
| E7 (rag_qln) | stories revised (#119); S1 merged; pins: rules `b1746499`, mcp `53f65130`, benchmark `83f166d6` (#120, #121) **[M]**; E7.S3–S5's brief local, never pushed (entry 9.2); S2–S5 not started. `main` `1e524b66`, its checks all success **[M]** | #106, #109, #119 `e6c8d8cc`, #120 `e9d34e06`, #121 `1e524b66` |
| Merge condition (c) | as § *Epoch 9* (the WSL machine, #136; the owner's statement, #166) | `37b9aa5`; #166 `113e9c2` |
| The stop | entries 9.1 and 9.2, recorded by #172 | `745d7204` |
| The feature reviews | not started | — |

**Goal and Definition of Done.** Both stand word for word, with § *Epoch 8*'s reading. The Definition of Done's "every
container-scoped database carries exemption (b)" is meetable now in the Node guard (F41) and in the C# template (F42);
in benchmark's copy only after F42-c.

**Corrections, plain facts** (not changes): entry 9.2's note says E7.S3–S5's brief is "pushed": it is local only, at
`a7189a5` (`git ls-remote` of rag_qln lists no `feat/e7-s3-s5` **[M]**). § *Epoch 9* item 8.3's "the E6.S3 brief
rewritten locally" has not happened: the file's modification time is 2026-11-12 18:32 and it still plans the marker at
the old pin **[M]**; it moves to item 5's build order.

### 2. Prerequisites

1. **F41, F41-b and F42 are done** (item 1). Nothing of them is re-opened.
2. **The stories amendments come first** (item 5): E6's in benchmark, E7's in rag_qln, each a NEW PR by Opus, each
   merged before the next plan gate in its repository (F42-c's in benchmark, E7.S3–S5's in rag_qln). No brief goes to
   its plan gate while its stories state a claim of item 3.2 without a state.
3. **E7.S3 copies from mcp `53f65130`**, the commit rag_qln's `external/dew_flow_mcp` is pinned at (#121; GitHub API
   **[M]**). Never `21553ce`.
4. **E7.S2 waits for the owner's observations** (rows E7-b's shared-store branch, E7-c, E7-f), as § *Epoch 9* item 7.
   E7.S3–S5 do not wait for them.
5. Not prerequisites: F32, F43; coai's S7 findings; rag_qln's ranking todo; two notes of E7's brief (§ 11 there): the
   Node guard reads no `mktemp` in a workflow (`[]` **[M]** here: `scanText('.github/workflows/ci.yml', …)` of a
   `run: d=$(mktemp -d)` step), and the C# token check reads no TypeScript constant (**[R]**,
   `LeftoversGuardTokens.cs:19`, `:23`). Both are written as limits in the stories (item 3.2), not built.

### 3. Merge conditions — the rows this revision adds or restates

Every other row of § *Epoch 9* item 3, § *Epoch 8* item 3 and of E6's and E7's stories documents stands, word for word; a
row restated here keeps every check its earlier text had and adds to it.

#### 3.1 The rows

| # | Condition | Implementation | Executable check | Does not prove | State |
|---|---|---|---|---|---|
| F41-a | as § *Epoch 9* | conventions #171 | as § *Epoch 9* | — | **observed**: the guard's own tests (both spellings `[]`; each counterexample red) pass in `npm test` at `745d7204` (this revision's run, item 8.4), and #171's CI **[D]**. Re-run here through `scanText('tests/Bench.Tests/Infrastructure/PostgresFixture.cs', …)`: the marker over `NewEmptyDatabaseAsync` → `[]`; the same marker without `live and die with` → one `exemption` **[M]** |
| F41-b | as § *Epoch 9* | the nine pin bumps | the gitlink reads the release | — | **observed** for the candidate: all nine read `b1746499` **[M]**; the counterexample (a pin off `release` is red in that consumer's pin check) is the pin check's own test, not re-run here |
| F42-a, F42-b | as § *Epoch 9* | mcp #81 | as § *Epoch 9* | — | **observed [D]**, mcp #81's record (§ *Epoch 9*, *Progress*): the differential check's first run against F41 red on one difference, then green; N1 red on `windows-latest` (run 43928795620) and fixed; N4 and N5 reproduced and fixed; N2 did not reproduce (a pin); N3 pins `cmd`. Its check runs green on three OSes **[M]**; nothing re-run here (no .NET) |
| F42-c | restated (the consultant's point 3): benchmark's copy is the template's bytes at mcp `53f651309a271e7388c703e1ec73799ff6f1c76e`, and the re-sync is COMPLETE within the paths item 4.1 names | benchmark's manifest `tests/Bench.Tests/Leftovers/template-manifest.json`: `commit` → `53f65130…`; 55 entries; the nine changed blobs and the two new entries of item 4.1; the transformations of item 4.1 and no others | (1) from a CLEAN checkout of the PR head (a fresh clone; `git submodule update --init`, which is the mount only; then `npm ci --ignore-scripts` in `.agents/conventions`): `TheAdaptedCopyTests` green with 55 entries; one copied byte changed → its row red; the `mcp tests:` count set back to 6 → red at that op. (2) `LeftoversGuardDifferentialTests` 3 of 3 green, its marker rows RUN, not skipped; and red with the mount's `node_modules` absent (`YamlMissingError`). (3) CI `build-test` green on the head, where Node 20 or later (its version printed) and the mount's `npm ci` come before the *Test* step; `build-test` is the only job that runs `Bench.Tests`. (4) `git diff --name-only <base>..HEAD` lies within item 4.1's paths. (4b) `git diff -U0 <base>..HEAD` per path stays within item 4.1's bound for that path: the manifest changes only its `commit`, the nine blob SHAs, the `mcp tests:` count 6 → 7 and the two new entries (its `about` as the brief writes it); `TheAdaptedCopyTests.cs` only `:79`; case 15 only the reason's text; `ci.yml` only `build-test`, one step; no new kind of operation; E6's stories only their progress lines (the independent review) | Windows: benchmark has no Windows leg | **proposed**. Its inputs re-read here **[M]**: the nine blob pairs and two new blobs (`git rev-parse 21553ce:…`, `53f65130:…` in mcp), 53 files in mcp's folder, `mcp tests:` on 6 lines at `21553ce` and 7 at `53f65130`, benchmark's manifest at `21553ce` with 53 entries, `TheAdaptedCopyTests.cs:79` pinning `21553ce`, no `npm ci` in benchmark's `build-test`, case 15's Windows reason (`LeftoversSweepCase15Tests.cs:14-21`). The `YamlMissingError` without `node_modules` is the brief's **[M]**, not re-run here |
| E6-f1 | as § *Epoch 9* | as § *Epoch 9* | as § *Epoch 9* | the lifetime: E6-f2 | **proposed** (S3; it is no longer blocked once F42-c merges: F41-b is done). The Node half is **observed** at `b1746499` **[M]**: the marker in `PostgresFixture.cs` → `[]`, without `live and die with` → one `exemption` (row F41-a's run). The C# half waits for F42-c's copy |
| E7-h1 | restated row E7-h: the C# copy reads THIS repository's layout | E7.S3: the adapted copy of mcp `53f65130`, 55 entries | S3's manifest diff check (commit 1 red: targets missing; green with the copy; one byte → red; one count lowered → refused), and the copied guard (`LeftoversRepositoryGuardTests`, and `LeftoversGuardTests`' token test, mcp `LeftoversGuardTests.cs:486-490` **[R]**) green on CI's recursive checkout (`build-test`, `submodules: recursive`, rag_qln `ci.yml:21` **[M]**) | — | **proposed** |
| E7-h2 | new, from entry 9.2: the copied walk never reads the repository root's `external/`, and it still reads everything else | E7.S3 (not S5): the ROOT-scoped exclusion, by the manifest operations it needs, in S3's copy, before S3's sites. Both paths of the walk take it: `Discover`/`Read` (the scan) and `ConstantFindings`, which calls `GuardFiles.Walk` itself and filters by `IsScannable`, not by `Read` (`LeftoversGuardTokens.cs:134-135`, `:142-143` **[R]**). Never the by-name `NeverEntered` entry (the plan gate `c6131b05`) | Each probe a private tree through `LeftoversGuard.Scan` or `LeftoversGuard.ConstantFindings(tree, "qln")`, named with consumer SHA, upstream pin `53f65130`, invocation, fixture path, expected diagnostic and observed result (item 8.1). P1: `external/x/plant.sh` with a `mktemp -d` line → one `raw-temp` WITHOUT the operation, none with it. P2, separate from P1: `external/x/Token.cs` declaring a foreign `RepoToken` → its `token` findings without, none with. P3, in scope on the scan path: the same `.sh` line at `tools/wsl/plant.sh` → `raw-temp` WITH the operation, so a scan the operation emptied cannot pass. P3b, in scope on the token path: a second `RepoToken` declaration outside the token file and outside `external/` → its `token` finding WITH the operation. P4, the root scope, on BOTH paths: a `.sh` line and a `RepoToken` declaration in a folder named `external` other than `<root>/external`, at any depth, outside the never-entered folders → each stays red WITH the operation | other repositories' trees under `external/` (they are theirs) | **proposed**. A later bump of rag_qln's benchmark or mcp pin changes these inputs: the probes and the counts are run again (item 8.1). Inputs **[M]**: the only folders named `external` at `1e524b6` are the root's (`git ls-tree -r -d`); benchmark `83f166d6` has 203 `.sh`/`.ps1`/`.py` files, whose Node `scanText` at `external/dew_flow_benchmark/<path>` gives 16 findings (10 `raw-temp`, 2 `raw-worktree`, 3 `legacy-name`, 1 `owner-blind`); one `RepoToken` declaration each at mcp `53f65130` and benchmark `83f166d6`. **[R]**: the walk enters `external` (`LeftoversGuardFiles.cs:28`, `:52-53`), reads `.sh`, `.ps1`, `.py` anywhere (`:29`, `:68-69`), and the token check walks the same tree (`LeftoversGuardTokens.cs:131-135`) |
| E7-h3 | new, from entry 9.2: S5 keeps E7-h2 as its regression | E7.S5, after its two `.ts` operations on `LeftoversGuardFiles.cs` | P1–P4 (P3b included) run again, same expectations. S5's break-it list carries no `external/x/tests/A.cs` plant (it cannot fail in either configuration, **[R]** `:63-64`); if the stories keep that line, it is a NOT-read statement with its observation. Each S5 break-it as claim D-5 defines it: the expected result written per guard, red in every guard whose observed read matrix includes the plant's path and which checks the planted behaviour | — | **proposed** |

#### 3.2 The stories claims that state a tool's reach or a plant without an observation

Found by reading both stories documents whole and searching them for "No ", "never", "only", "not read", "plant" and
"red" where the sentence is about a guard, a copied tool or a PR's files (`grep -n -i -E` over each file at the commits
above), then checking each against the code. Each gets a state; each is observed (item 8.1) before the plan gate named,
which is the gate of the story or brief that RELIES on it. Every **[R]** below is an expectation, written open-ended:
the observation fills in the result ("red or not, the plant says which"), and a result unlike the expectation changes
the plant or the limit in that brief, not a claim this plan rests on (the independent review, R1).

| # | The claim, where | Checked here | State, and before which gate it is observed |
|---|---|---|---|
| C1 | E6 § 6 *Before S3* `:315-316`, `:319`: "No benchmark-own file changes"; Files: manifest targets and the manifest only | false: entry 9.1. `TheAdaptedCopyTests.cs:79` pins `21553ce`; `build-test` installs nothing in the mount; case 15's reason names the old removal **[M]** | replaced by row F42-c and item 4.1's paths: **proposed**, before F42-c's plan gate |
| C2 | E6 S3 Files `:352-353`: `PostgresFixture.cs`, `ContainerPass.cs` "on the copy check's own list", its tests, `module_tests.md` | incomplete: the own list is `BenchOwn` in `TheAdaptedCopyTests.cs` (`:32-46`), which S3 edits (F42-c's brief, K1, `:316-318`); the check refuses a file on neither list | the amendment names `TheAdaptedCopyTests.cs`; **proposed**, observed by S3's copy check red without the entry, before S3's plan gate |
| C3 | E6 § 1 *E6-g by directory* `:65-85`, the C# copy's column ("by reading `GuardFiles` … not run", `:66-67`), and D7 `:211-212` (spikes read by kind) | **[R]**; the Node column is **[M]** there | **proposed**: each C# cell observed by a plant through the copy at `53f65130` (after F42-c), before S7's plan gate |
| C4 | E6 `:78` (`src/`) and S7 `:413-414` (`tools/model-arms/` `.cs` after S7's operation): "a `GetTempPath()` in the forms the product kind judges" | **[R]** expected to be a plant that can never be red, the kind of entry 9.2 (the observation says which): for a `Source` file the template reports no raw temp spelling (`HitsOutsideSource` returns nothing for `SourceKind.Source`, mcp `LeftoversGuard.cs:204-207`); it reads there only `owner-blind` (the bare prefix word, `Owned.Prefix`) and, as `raw-temp`, an `Owned.TempRoot` reference outside the helper's folder (`:216-219`, `:297-301`) (corrected by the judge: it said "no `raw-temp` at all"). The Node guard reads neither path (`isScanned('src/X.cs', 'node')`, `isScanned('tools/model-arms/X.cs', 'node')` → false **[M]**) | the amendment replaces the plant with one the `Source` kind reads, and writes `GetTempPath()` in `src/` and `tools/` `.cs` as a limit of both guards: **proposed**, observed before S7's plan gate |
| C5 | E6 `:84`: the C# copy's reading of `mktemp -d` in a workflow `run:` "is to be run by S7" | **[R]** expected red, red or not to be observed: `.yml` is in `RawTempByExtension` (`LeftoversGuard.cs:84`, `:89`). Node `[]` **[M]** | **proposed**, before S7's plan gate |
| C6 | E6 `:87-90`: nine `.py` `tempfile.mkdtemp(` lines, "whether the copy's `mkdtemp(` pattern reports them … was not run" | **[R]** expected red, red or not to be observed: `\bmkdtemp(?:Sync)?\s*\(` (`:78`) | **proposed**, before S7's plan gate (D7 says whose they are) |
| C7 | E6-d `:50` and S3 (7) `:349-351`: "neither guard reads" `SetEnvironmentVariable("TESTCONTAINERS_RYUK_DISABLED", "true")` | Node `[]` **[M]** (§ *Epoch 9*); C# **[R]**, expected not read: `RyukOff` wants `[:=]` after the name (`:93`); read or not to be observed | **proposed**: the C# half through the copy at `53f65130`, before S3's plan gate, so S3's own test is known to be the only reader, or the second |
| C8 | E6-b `:48`: the C# guard reads `worktree add` "only outside `src/`" | **[R]** (`:91`, `:204-209`) | **proposed**, observed by S4's and S5's plants through the copy, before S4's plan gate |
| C9 | E6-f1 `:52` and S3 (5) `:345-347`: the marker clean and, without `live and die with`, one `exemption` "in each" guard | Node **observed** **[M]** (row F41-a's run); C# after F42-c | **proposed** (the C# half), before S3's plan gate |
| C10 | E6 S7 `:403-406`: one manifest operation on `LeftoversGuardFiles.cs` makes `.cs` under `tools/` a `Source` file | a discovery boundary changed by an operation, not run | **proposed**: S7's brief names the operation and observes it with C4's plant, before S7's plan gate |
| D-1 | E7 S5 (2) `:378-379`: "a raw temp call in `external/x/tests/A.cs` NOT read" as a break-it | it cannot be red with or without the exclusion (**[R]** `:63-64`; entry 9.2) | replaced by rows E7-h2 and E7-h3: **proposed**, before E7.S3's plan gate |
| D-2 | E7 D2 `:140-142` and the build order `:260`: the `external` exclusion beside S5's discovery; S5's "never `external/`" `:371-372` | on CI's recursive checkout S3's own copied tests read `external/` (the inputs of row E7-h2, **[M]** and **[R]**) | moved to S3 (row E7-h2): **proposed**, before E7.S3's plan gate |
| D-3 | E7 S5 `:371-372`: the copied C# guard "reads `tests/`, `.github/`, the extension's `test/**/*.ts`" | incomplete, **[R]**: it also reads `.sh`, `.ps1` and `.py` anywhere and `.mjs`, `.js`, `.cjs` under `.github/scripts/` and `http/` (`LeftoversGuardFiles.cs:29-31`, `:68-69`); E7's brief lists twelve such scripts outside `tests/` (its M5 **[M]** there) | the amendment writes the read matrix (the brief's § 7.3), each cell with its state: **proposed**, before E7.S5's plan gate |
| D-4 | E7 D5 `:150-155`: S5 "widens" the C# discovery to `tools/vscode-extension/test/**/*.ts` | two operations (`JavaScriptExtensions`, `ScriptFolders`, `:30-31`), **[R]** | **proposed**: the brief's L2 is its probe, observed before E7.S5's plan gate |
| D-5 | E7 S5 Done-when `:381` and DoD `:462-463`: both guards "red on every break-it" | the TypeScript token plant is red in the Node guard only (E7's brief § 7.3, two `token` findings **[M]** there) and the C# token check reads no `.ts` (**[R]**); the `test/support` plant is red in the C# guard only, which S5 (2) `:379` already says ("red only in the C# guard") | restated as ONE condition (the plan gate `c6131b05` and the independent review): each break-it is red in every guard whose observed read matrix (D-3), fixed before S5's plan gate, includes the plant's path AND which checks the planted behaviour; for each plant the stories write the expected result per guard (red; read and not checked; not read), and every plant is red in at least one guard (item 4.3): **proposed**, before E7.S5's plan gate |
| D-6 | E7 S3 Files `:329-330`: the copy, its manifest and five site files | incomplete: E7's brief adds `tests/Rag.Tests/Rag.Tests.csproj` (`AllowUnsafeBlocks`), a new `.gitattributes`, `ci.yml`'s `build-test` (the mount's `npm ci`) and `research/module_tests.md` (§ 5.3, § 5.6 there) | the amendment names each path and what needs it (item 4.1's rule): **proposed**, before E7.S3's plan gate |
| D-7 | E7 S4 Files `:351-353` | incomplete: the brief adds `test/support/sweep.ts`, `test/owned.test.ts` and `research/module_tests.md` (§ 6.2, § 6.5 there) | named by the amendment: **proposed**, before E7.S3's plan gate (S4 rides that PR) |
| D-8 | E7 row E7-h `:49`: "`external/` is entered: its `.sh`, `.ps1` and `.py` files are scripts to the walk", marked **[M]** | read from code, not run (**[R]**); "to observe in S3's brief" was not observed there either (no .NET) | re-marked **[R]**; observed by row E7-h2's P1 and P2, before E7.S3's plan gate |

### 4. The dispositions of entries 9.1 and 9.2

**4.1 Entry 9.1 — kept, and its bound restated** (the consultant's point 3). F42-c's five touches were plausible, not
proved complete. From now its scope is a list of named paths, each with the dependency that needs it:

- the manifest and its targets under `tests/Bench.Tests/Leftovers/`: the commit `53f651309a271e7388c703e1ec73799ff6f1c76e`;
  nine changed blobs (`LeftoversAudit.cs` `f1a93747` → `3f32fc52`, `LeftoversAuditException.cs` `6d703ecf` → `dd5860bb`,
  `LeftoversAuditTests.cs` `fcc8484b` → `2e258e84`, `LeftoversGuard.cs` `8a92a79b` → `529646e3`,
  `LeftoversGuardExemptions.cs` `156fe549` → `a240a05a`, `LeftoversGuardTests.cs` `f6a8e035` → `951b43af`, `Native.cs`
  `dd6c8680` → `f9a277f6`, `OwnedTests.cs` `20a0a213` → `b97e3eff`, `Removal.cs` `05e58fb5` → `d6ec896f`); two new
  entries (`LeftoversGuardScenarios.cs` `8da3abb6`, `LeftoversGuardDifferentialTests.cs` `2d308cd3`); the other 44
  entries unchanged (**[M]**, `git rev-parse` at both commits; the brief's full SHAs are the manifest's);
- the permitted transformations: D2's operations as the manifest holds them today, applied unchanged; ONE count
  corrected (`mcp tests:` 6 → 7 in `LeftoversAuditTests.cs`, **[M]** 6 and 7 lines); the namespace operation only on the
  two new entries; no new kind of operation;
- `TheAdaptedCopyTests.cs:79` (it pins the manifest's commit) and nothing else of that file;
- `.gitattributes`: one `-text` line per new copied file (S2's decision: one line per copied file);
- `.github/workflows/ci.yml`, job `build-test` only: Node 20 or later on `PATH` with its version printed, then
  `npm ci --ignore-scripts` in `.agents/conventions`, both before the *Test* step (the differential test runs the mounted
  Node guard, which reads workflow rows through the mount's `yaml`). Today the job runs the runner's Node: the copied
  guard's Node rows ran there in S2 (#207, **[D]** F42-c's brief § 5); its version is not printed in any log read here;
- `LeftoversSweepCase15Tests.cs`: the Windows reason's text only (the skip stays);
- the docs: `research/module_tests.md`, `research/README.md`, `todo/README.md`, E6's stories (progress only: the § 6
  boundary is amended by the stories amendment, item 5), F42-c's brief and S2's brief (their promotion:
  `todo/PLAN_test_leftovers_E6_F42c_brief.md` → `research/PLAN_test_leftovers_E6_F42c_brief.md` and
  `todo/PLAN_test_leftovers_E6_S2_brief.md` → `research/PLAN_test_leftovers_E6_S2_brief.md`).

Completeness is proved, not counted: row F42-c's checks (1)–(4b). A file the clean-checkout run needs outside these paths
is found BEFORE the PR, by that run; adding it is then a change of epoch 10 and counts. The F42-c brief is revised by new
commits on its pushed branch, never a rewrite (item 8.3).

**4.2 Entry 9.2 — the exclusion moves into S3, scoped to the root, proved by separate probes** (the consultant's point 2).
Decided:

1. **S3 carries the operation**, because S3's own copied tests walk the recursive checkout in `build-test` (row E7-h1):
   without it, the copied repository guard reads benchmark's 203 scripts and the token test reads two foreign
   declarations (row E7-h2's inputs).
2. **Scoped to the repository root's `external/`, and only that** (the plan gate `c6131b05`). The template excludes
   folders by NAME at any depth (`NeverEntered`, `LeftoversGuardFiles.cs:28`, `:52-53` **[R]**), and E7's brief adds
   `"external"` to that list, which is wider than the root and would stop a nested `external` folder being read: row
   E7-h2's "still reads everything else" would not hold. So the by-name entry is not used. The operation excludes the
   root's `external/` on both paths of the walk: the scan (`Discover`, `Read`) and the token check, which walks the tree
   itself (`ConstantFindings` → `GuardFiles.Walk`, filtered by `IsScannable`, `LeftoversGuardTokens.cs:134-135`, `:142-143`
   **[R]**). Probe P4 proves the scope on both paths. Today only the root's `external` exists (**[M]**). The walk takes no
   root parameter (`Walk(string dir)`, `:49-50` **[R]**), so the exclusion may need more than one operation; the brief
   names each.
3. **Separate probes, and in-scope ones that stay red** (row E7-h2): the `.sh` violation and the foreign identity
   declaration each produce their own diagnostic without the operation and none with it; an in-scope violation stays red
   with it on each path (P3 on the scan, P3b on the token check).
4. **S5 keeps the regression** (row E7-h3): the probes run again after S5's `.ts` operations. The `external/x/tests/A.cs`
   plant leaves the break-it list.
5. **The DoD's "red on every break-it"** is the one condition of claim D-5: red in every guard whose observed read matrix
   includes the plant's path and which checks the planted behaviour, with the expected result per guard written for each
   plant.

**4.3 Narrowed: no.** F42-c's scope gets WIDER and its checks more (a clean-checkout completeness run, a RED without the
mount's packages, the diff bounded by paths and per path); E7's one plant that could never be red is replaced by probes
that can (P1, P2, P3, P3b, P4 on both paths); the `external/` exclusion moves earlier, inside the same producer PR;
eighteen stories claims get a state and an observation before a gate.

Two sentences could read as smaller, and the precedent says how to weigh them. At epoch 2 a smaller merge condition of
ONE PR (E5's producer merging with the guard green-by-baseline instead of "at zero on every class") was enough for
`Narrowed: yes` (the record for epoch 2). That test does not catch these two. Claim D-5: the old text contradicted
itself — S5 (2) wrote "red only in the C# guard" for the `test/support` plant (rag_qln `todo/PLAN_test_leftovers_E7.md:379`),
while S5's Done-when and the DoD wrote both guards "red on each break-it" (`:381`, `:462-463`); no reading of it could
require a guard to be red on a path it does not read or a behaviour it does not check (the C# token check reads no
`.ts`, **[R]**). The restatement removes no check that could ever have been met, and every plant must still be red in
at least one guard. Claim C4: the `GetTempPath()` plants in `src/` and `tools/model-arms/` `.cs` are expected never to
be red (**[R]**, the `Source` kind reads no raw temp spelling), so writing that spelling there as a limit of both guards
removes no meetable check; and S7 keeps a plant there that the `Source` kind does read, so its check count stays.
Nothing of the goal, the Definition of Done, the merge conditions or the release is removed. **The epics do not
change**: no Fable re-split; E6's and E7's stories are amended by Opus (item 5).

### 5. Build order

```
DONE   epoch 9 approved (#170) → E6's stories revised (#215) → rag_qln's benchmark pin (#120) → E7's stories revised
       (#119) → F41 (#171, `b1746499`) and the release → F41-b: benchmark #216, mcp #82, sidecar_rust #81,
       vscode_kit #35, wsl_care #199 → F42 (mcp #81, `53f65130`) → creds #372, amd_r9700 #37, rag_qln #121,
       coai #1004 → F42-c's brief (pushed, entry 9.1) → E7.S3–S5's brief (local, entry 9.2) → the stop
       (#172, `745d7204`) → this revision. (Merge order, read from each PR's `mergedAt`.)
NEXT   the Opus judge sorts epoch 9's work (step 5) → the plan gate on an operative extract and an independent Opus
       review → epoch 10 opens `by reviewers` (Narrowed: no).
THEN, at once (each a NEW PR, by Opus, merged before the next plan gate in its repository):
  benchmark    E6's stories amended (item 8.3): § 6 *Before S3* restated by row F42-c and item 4.1; claims C1–C10.
  rag_qln      E7's stories amended (item 8.3): rows E7-h1–E7-h3 (the exclusion in S3); claims D-1–D-8.
THEN, at once:
  benchmark    F42-c (its brief revised by new commits on `feat/e6-copy-f42`) → E6.S3 (its local brief rewritten to
               E6-f1, E6-f2, E6-d and C7) → S4 … S7 as E6's stories.
  rag_qln      E7.S3 → S4 → S5 (one PR; its local brief revised to rows E7-h1–E7-h3 and claims D-1–D-8 before its plan
               gate). E7.S2's Fable spec may be written; its gate waits for item 7's observations.
LAST   the feature reviews (§ *Epoch 8* item 5); the promotion of this plan and its stories documents; R6 ticked in
       the remainder plan.
```

### 6. What the re-review consultant raised, and what was done with it

| Point (consult `a84fb14e`) | Checked | Done |
|---|---|---|
| 1. The approval evidence covers the acceptance tables and misses executable claims elsewhere in the stories; one stories-gate requirement, in the existing criteria, no new review layer | True: 9.1 came from a scope line, 9.2 from a break-it list and an operation's place (item 1); neither had a state. The same search found fifteen more claims of the kind (item 3.2, beside C1, D-1 and D-2), one of them a plant that can never be red (C4) | Item 8.1 (added to § *Epoch 9* item 8.1); item 3.2 |
| 2. E7: the exclusion into S3, on CI's recursive checkout, scoped to the root's `external/`; the `.sh` violation and the foreign declaration separate probes; one in-scope violation red with the exclusion; S5 keeps the regression | True for the place and the probes: `ci.yml:21` (**[M]**), the inputs of row E7-h2. The root scope is NOT what the brief's operation does (by name at any depth, **[R]**) | Rows E7-h1–E7-h3; item 4.2 |
| 3. F42-c: plausible, not proved complete; hashes and transformations explicit; completeness by the copy check and the differential test from a clean recursive checkout; Node and the mount's `npm ci` before every job that runs that test; a bound by dependencies and paths, not a count | True: blobs, counts and pins re-read (**[M]**); `build-test` is the only job that runs `Bench.Tests` (`ci.yml` read: `contract`, `plans` and `workflows` run none; corrected by the judge, it named two); benchmark's only submodule is the mount (`.gitmodules` **[M]**), so "recursive" is the mount | Row F42-c; item 4.1 |
| 4. Cuts: none justified from the evidence; a wrong stories claim does not make its PR wrong; classify each merge against the revised contract by its diff and checks; unavailable evidence is "unverified", not "fits" | Agreed: #215 and #119 merged text that item 3.2 corrects; as § *Epoch 9* did with #103 and #106, that is a NEW amendment PR, not a revert | The record's note (the judge's rule); item 5 |

Added by this revision beyond the consultant: claim C4 (the `Source` kind reads no raw temp, so two planned plants could
never be red); claims C2, D-6 and D-7 (Files lines a brief already widens); the two plain-fact corrections of item 1.
Rejected: nothing.

### 7. Questions for the owner

None for the approval (`Narrowed: no`). Still open, as § *Epoch 9* item 7: whether a running daemon shares the live
tests' Qdrant, and whether the owner runs the read-only probe and the live runs of rows E7-b (branch 2), E7-c and E7-f on
the machine that has the stores. Until then those rows stay **blocked** and E7.S2 does not go to its plan gate. The PR
cap is settled for both amendments. E6: the owner's own answer of 2026-11-16, in the coordinating session, "Yes, every E6
PR", which also allowed one mcp PR for F42 and the F41 release with its nine pin bumps over the cap. E7: every E7 PR
over the cap, allowed by the owner on 2026-11-12 in this rollout's session (their own answer: "Yes, for all E7 PRs").

### 8. The way of working — so a tenth stop is less likely

**8.1 What changes.** Added to § *Epoch 9* item 8.1, as gate criteria of the existing stories and brief gates (no new
review):

- **Every copied-tool discovery boundary and every break-it plant** that a stories document or a brief states names
  six things: the consumer SHA, the upstream pin, the exact invocation, the fixture path, the expected diagnostic, and
  the OBSERVED result. It is observed before the plan gate of the story or brief that RELIES on it (item 3.2 names that
  gate for each claim), and again when any of the first five changes (a pin bump included). The "without" half (the
  tool as copied, before the consumer's operation or site) is observed before that gate against mcp `53f65130` in a
  scratch test: .NET is installed on this machine (`/usr/bin/dotnet`), built as the repositories build it, `nice -n 19`,
  `-m:4`, `-p:AppHostRuntimeIdentifier=linux-x64`. The "with" half is the PR's own RED → GREEN. Until it is observed the
  claim is **proposed**, a claim read from code says **[R]**, and it is written open-ended ("red or not, the plant says
  which"), so the observation fills it in and never contradicts it: a proposed claim found false would otherwise be a
  counted change (the independent review, R1).
- **A plant must be able to fail.** Each break-it names the configuration in which it is red; one that is red in no
  configuration is a NOT-read statement, never a break-it.
- **An exclusion is proved from both sides**: each excluded diagnostic appears without it and is gone with it, by its own
  probe, and one in-scope violation stays red with it.
- **A file-scope line is a list of named paths**, each with the dependency that needs it, proved complete by the PR's own
  checks from a clean checkout; never a count and never a bare "no other file".

**8.2 The surprises still likely.**

| Story | What it is likely to meet | Why |
|---|---|---|
| E6's amendment | more claims of C4's kind once each C# cell of *E6-g by directory* is run | that column is **[R]** |
| F42-c | the clean-checkout run needs a file outside item 4.1's paths; the runner's Node below 20 | not run from a clean checkout yet; the version is in no log read |
| E6.S3 | Testcontainers 4.16.0's reuse configuration; claim C7's C# half | carried from § *Epoch 9*; not run |
| E7.S3 | the root-scoped exclusion needs more than one operation (the walk has no root parameter) | `LeftoversGuardFiles.cs:49-53` **[R]** |
| E7.S3 | `build-test` red on the recursive checkout for a reason no probe models | the first run holding `external/dew_flow_benchmark` is the PR's |
| E7.S2 | no machine with the stores | item 7 |

**8.3 What the other documents' own revisions must say.**

- **Benchmark's E6 stories, a NEW PR, before F42-c's plan gate:** § 6 *Before S3* restated by row F42-c and item 4.1's
  paths, citing entry 9.1 (it replaces `:315-316` and `:319`); S3's Files names `TheAdaptedCopyTests.cs` (C2); claims
  C3–C10 each with its state and its gate; C4's plants replaced by ones the `Source` kind reads, and `GetTempPath()` in
  `src/` and `tools/` `.cs` written as a limit; E6-f1's Node half observed.
- **F42-c's brief, new commits on `feat/e6-copy-f42`:** § 0.1's "exactly five touches" becomes item 4.1's paths; the
  clean-checkout run (row F42-c (1)) and Node's printed version join its checks; its § 14 no longer amends the stories'
  § 6 (the amendment did).
- **E6.S3's brief (local):** rewritten to rows E6-f1, E6-f2, E6-d and claim C7 before S3's plan gate.
- **Rag_qln's E7 stories, a NEW PR, before E7.S3's plan gate:** D2 and the build order put the `external/` exclusion in
  S3, scoped to the root on both paths of the walk, never the by-name entry (row E7-h2); S5 keeps the probes as its
  regression and drops the `external/x/tests/A.cs` plant (row E7-h3); S5's discovery sentence becomes the read matrix
  with states (D-3, D-4); the DoD's break-it sentence as D-5, with the expected result per guard for each plant; S3's
  and S4's Files lines name D-6 and D-7; row E7-h's **[M]** at `:49` becomes **[R]** (D-8).
- **E7.S3–S5's brief (local):** its L1 split into P1, P2, P3, P3b and P4 (both paths); its by-name operation replaced
  by the root-scoped one; its § 10 corrections carried into the amendment.
- The follow-ups plan: nothing new.

**8.4 Run for this revision.** `node tools/plan-lifecycle.mjs` and `npm test` at this branch (item 3.1, row F41-a); the
reads and `scanText` runs named in each row; `gh pr list`, `gh api` and `git ls-remote` as the record's note says.
Not checked: the consult texts (`a84fb14e`, `57ac1bd6`, `50be6245`, `6a830a2c`; the points are taken as the
coordinator quoted them); every C# verdict (no .NET build run for this revision); anything with Docker; E2's held feature review.

#### Progress, 2026-11-16 (epoch 10; a progress record, not a change)

| Step | Result | Where |
|---|---|---|
| E6's stories amended (item 8.3) | merged; plan gate `3c0b375b` (three findings on unchanged text rejected with reasons), an independent Opus review (fact repairs applied) | benchmark #217 `191ef77f` |
| E7's stories amended (item 8.3) | merged; plan gate `b8a3e4b9` (three rejected with reasons; two S2 design points carried to S2's Fable spec brief), an independent Opus review | rag_qln #122 `6e447156` |
| F42-c (row F42-c) | merged: the copy at mcp `53f65130` (55 entries), the CI step installing the mount's dependencies, case 15's reason; checks (1)–(4b) on its final head, results on its PR; all 55 targets byte-checked by the Opus review; CI `build-test` 5775 tests, 0 failed | benchmark #218 `5070beda` |
| rag_qln's benchmark pin | bumped to `5070beda` (the input E7-h2's probes were observed at) | rag_qln #123 |
| E6.S3's brief, E7.S3–S5's brief | written with their item 8.1 observations (E7: the root-scoped exclusion observed on both walk paths, P1–P4 and P3b, D-8; E6: C2, C7, C9, the effective Ryuk setting, reuse by configuration — none, entry 10.1) | local, before their plan gates |

Found on the way, carried as todos, not built here (each recorded where its owner reads it):

- benchmark: during whole-suite runs `/tmp` was briefly a git work tree, so ModelArms and Scouts tests refused ("…is inside the
  git checkout /tmp"), on base and head alike; what creates `/tmp/.git` is not known. A todo of benchmark's.
- benchmark: the `ASPIRE010` warning of the AppHost on `main`; `score-steps.mjs:57-73` removes the scorer's own folders by marker age.
- mcp's template (F44, the follow-ups plan): `Removal.ClearReadOnlyBelow` checks a reparse point and then walks by path (a junction
  swapped in between would be followed); `RunNode` writes the differential test's stdin synchronously before its timeout starts.
- E7.S2's Fable spec inputs: a collection created under a live claim survives every drop path; the `gpu_waiters` reset is scoped
  or joins the lock, and a live daemon waiter survives it.

## Epoch 11 — the plan as revised at the re-review (2026-11-17)

The whole plan read again, as step 4 of the full stop asks (`common/plan-change-control.md`), over the two entries of
epoch 10: 10.1, row E6-f2's configuration counterexample has no instance at Testcontainers 4.16.0 (found and settled by
E6.S3's brief; built as a green pin in benchmark #219); 10.2, E6.S4's pilot scaffolds make output that must outlive the
test, and the story's two dispositions for its legacy literals do not cover it (found by E6.S4's brief, benchmark
`feat/e6-s4-modelarms` `4dc04820`, local, never pushed). The question consultants: `c3d71347` (10.1, two of two: a
change), `33aa7f43` (10.2, two of two: a change to the story's approach). The disposition of 10.2 was settled by the
consult `1f60c647` (two of two) and checked against the files by the coordinator and here (item 6). The re-review
consult (step 3) is `a6cfcc53` (codex): its three points (observe every feasibility claim now; E7's retained corpus
under exemption (a); the Definition of Done's first item) are folded in items 3.3, 4.3, 4.4 and 8.1; the third was
settled by the question consult `120652b8` (two of two). This section is the
baseline epoch 11 is approved on. § *Epoch 10* stays as the plan for everything this section does not name, and the
earlier sections under it. Superseded by this section, read from here: E6's S4 *What* sentence that names two
dispositions for the 15 legacy literals, its *Files* line and its *Done when* (benchmark `todo/PLAN_test_leftovers_E6.md:470-483`
at `b348bb33`; item 4.2, row E6-i, row E6-l); D6's "with the variable unset, the fake refuses to start" for the
probe runner's launch path (`:254-256`; item 3.2, E11-3); S5's "the path-only lines read `TempDir.Root`" without a
bound (`:489`; E11-4); S6's "(Node)" scope and its missing *Files* line (`:503-512`; E11-6 to E11-8); S7's missing
*Files* line (`:514-542`; E11-9); and the two places that say who lists the inline exemptions (S5 `:500-501`, "the
brief lists"; the DoD `:609`, "the stories list"; item 4.3).

**How to read the evidence.** **[M]**, **[D]**, **[R]** and the three states (**observed**, **proposed**, **blocked**)
as in § *Epoch 9* and § *Epoch 10*. Every **[M]** here was run for this revision on 2026-11-17, read-only, at conventions
`62f9ae5d` (its `tools/` and `common/` equal the release `b1746499`: `git diff --stat b1746499 62f9ae5 -- tools/ common/`
prints nothing), benchmark `b348bb33` with its mount at `b1746499`, and rag_qln `48cbf896`. ONE C# run was made: the
copied repository guard test, `LeftoversRepositoryGuardTests` with `--explicit only`, from the existing Release build of
benchmark `70eb6fc2` in the worktree `wt/bench-e6s3` (its tree equals `b348bb33`: `git diff --stat 70eb6fc2 b348bb33`
prints nothing; the copy's guard files are F42-c's, unchanged since `5070beda`); no build ran for this revision, and no
Docker. Its 173 findings equal F42-c's O10 and S4's O3 class for class (115 `raw-temp`, 22 `raw-worktree`, 18
`legacy-name`, 18 `owner-blind`), so the build reads the tree as main's does.

### 1. What this plan is now

**The root cause, checked.** Item 8.1 of § *Epoch 10* made every copied-tool boundary and every break-it plant an
observation before its gate, and it worked where it reached: entry 10.1 was found BY such an observation (E6.S3's brief
ran the configuration counterexample and it could not be red), before any code. Entry 10.2 came from a place item 8.1
does not reach: a story's closed list of DISPOSITIONS for the sites it names. S4's *What* said each legacy literal
"moves to the helper or, where the test is about the old name itself, is spelled with the `~` precedent"; two of the 15
sites make output that must outlive the test (`M2PilotScaffold.cs:11-16`, `M3PilotScaffold.cs:9-11` at `b348bb33`
**[M]**), and the rule forbids the prefix on such output ("Never give the prefix to something that must survive the
run", the detail's § *Never*). Nobody had classified the sites by LIFETIME before the story was approved. The same
search, done now over every remaining story (item 3.2), finds four more texts of this kind or of item 8.1's kind that a
brief would otherwise have met: D6's refusal on a launch path where no variable can arrive (E11-3), shape G offered
without a bound (E11-4), S6's scope written as Node-only while the copied C# guard reads its `.py` and `.sh` files
(E11-6), and two stories with no *Files* line (E11-8, E11-9). So from epoch 11 (item 8.1): every site a story disposes
of is classified by lifetime before that story's plan gate, expected guard results name BOTH guards with a count per
class, and every story's *Files* line names its plan records and the docs that describe what it changes.

**State at the stop (read 2026-11-17).**

| Epic | State | Commits |
|---|---|---|
| E1, E3, E4 | DONE (wave 1) | as § *Epoch 8* |
| E2 (creds) | COMPLETE 2026-11-10. Its feature review is held by `call_human` since 2026-11-10 (not re-read) | as § *Epoch 10* |
| E5 (coai) | COMPLETE 2026-11-12 | as § *Epoch 10* |
| F41, F41-b, F42 | DONE (§ *Epoch 10* item 1) | conventions #171; nine pin bumps; mcp #81 |
| E6 (benchmark) | stories amended to epoch 10 (#217); F42-c merged (#218, the copy at mcp `53f65130`, 55 entries); S3 merged (#219: rows E6-d, E6-f1, E6-f2, entry 10.1 as a green pin; brief promoted to `research/PLAN_test_leftovers_E6_S3_brief.md`); S4's brief local, never pushed (`feat/e6-s4-modelarms` `4dc04820`; the GitHub branch list has no such branch **[M]**), entry 10.2; S5–S7 not started. `main` `b348bb33` | #217 `191ef77f`, #218 `5070beda`, #219 `b348bb33` |
| E7 (rag_qln) | stories amended to epoch 10 (#122); S3–S5 merged as ONE PR (#125: the adapted C# helper, the extension's wrap, both guards in CI); the benchmark pin at `b348bb33` (#127); S2 not started, its gate waits for the owner's observations (§ *Epoch 9* item 7). `main` `48cbf896` | #122 `6e447156`, #123 `0be37687`, #125 `3ca58f43`, #127 `48cbf896` |
| The stop | entries 10.1 and 10.2, the stop recorded by #175 | `62f9ae5d` |
| The feature reviews | not started | — |

**Goal.** The goal as § *Epoch 8* reads it (with § *Epoch 7*'s exception and its correction) stands word for word, with
**one more bounded exception**, as epochs 5, 7 and 8 wrote theirs (the owner approves it with item 7; the independent
Opus review, S6): **the output of E6's two attended-pilot scaffolds** (`tests/Bench.Tests/ModelArms/M2PilotScaffold.cs`,
`M3PilotScaffold.cs`, each `[Fact(Explicit = true)]`, never run by the suite) is NOT a resource of the owner form. It is
made only under the folder the REQUIRED variable `BENCH_PILOT_OUT` names, resolved by ONE function (`PilotOut`, row E6-l),
which refuses a value that is unset, empty, relative, not an existing folder, at or under the temp root, or inside a git
checkout; it is the unprefixed `bench-m2-<what>-<id>`, `bench-m2-manifest-<id>.json`, `bench-m3-<what>-<id>` and
`bench-m3-manifest-<id>.json`, each manifest written first and naming every exact path before it exists; it is never
claimed and never collected by a sweep, a janitor or a next run; it is removed only by the pilot's own named operator
step (M2: its manifest's paths; M3: its manifest, T1–T5). The goal's promise for what a run creates outside its
process (owned, claimed, removed on every exit path, collected after a kill) does not reach it. The exception is bounded
to that output of those two files, their resolver and the documents that name it; nothing else of any consumer may use
it as a precedent without a new plan change.

**Definition of Done.** Stands word for word, with § *Epoch 8*'s reading and item 4.3's *Definition of Done, read for
epoch 11*. Its "the inline exemptions" are read with item 4.3: listed by the story's brief, copied into the stories by
the PR that adds them.

**Corrections, plain facts** (not changes): E7's stories' status line still says S3–S5 are "built … on
`feat/e7-s3-s5-e10`"; they are merged as #125 (`3ca58f43`) **[M]**, a records fix for E7's amendment (item 4.4). E6's
stories say `TempFolder` is constructed by "112 `new TempFolder()` in 26 files" (`:79`); at `b348bb33` there are 108
`new TempFolder()` in 25 files and 4 `TempFolder _temp = new()` fields, 112 sites in all (S4's brief N2 **[M]** there);
the count of sites stands.

**What is still open, read 2026-11-17** (the independent Opus review, S7): every unticked item of the Definition of Done
(§ *Definition of Done*, the list at `105d53c` and the items added since) and every open merge-condition row, each with
its state, owner and blocker.

| Item | State | Owner | Blocker |
|---|---|---|---|
| DoD 1: tests, scripts and CI create only owner-form resources or a documented exemption | open: E2 and E5 complete; E6 S4–S7 and E7.S2 remain; read with item 4.3's exemption for the pilot output | agent (E6 S4–S7, E7.S2); the owner approves item 4.3's reading | E6's stories amendment and S4–S7; E7.S2's gate (the owner's observations) |
| DoD 2: no container without `--rm` or an always-run cleanup | open: E6's fixture done (#219); `http/README.md:32-33` is S7's; E7's live stores are S2's | agent | E6.S7; E7.S2 |
| DoD 3: a structural test per repository at zero | open: rag_qln's both guards in CI (#125, E7.S5); benchmark's switch-on is S7's | agent | E6 S4–S7 |
| DoD 5 (added 2026-11-01): the baseline rule released, mirrored by the private sibling, pinned by coai | open only for the private sibling's mirror (R4); released `5863c60`, pinned by coai #939 | the owner | F26 (the sibling's mirror) PARKED by the owner 2026-11-05; not re-opened here |
| DoD 6 (added 2026-11-01): start-of-run sweeps and guards on Windows as the F16 disposition says; the owner's Windows barrier section | open: P1 is CLOSED by the owner's written statements (E2 and E5: conventions #124, 2026-11-04; E6 and E7: #166, merge condition (c)) **[D]**; R4 not recorded; F16's Fix open with F9 | conventions (F9, F16's Fix, the follow-ups plan); the owner (R4) | F9 and F16's Fix have no scheduled story; F26 parked |
| DoD 7 (added 2026-11-03): every prep or rename story recorded its invocation inventory | open for E6 S4–S7 and E7.S2 (E2, E5 recorded) | agent | those stories |
| DoD 8 (added 2026-11-03): F3 released and pinned before the first compliance declaration | met in substance (F3 released with F24, `bd795847`, all pins bumped, § *Epoch 6*) **[D]**; not ticked | agent | a records tick, at promotion |
| DoD 9 (added 2026-11-03): E5's suites green per suite and OS | met in substance (E5 COMPLETE 2026-11-12, § *Epoch 8* item 3.4) **[D]**; not ticked; the by-name reconciliation not re-read here | agent | a records tick, at promotion |
| DoD 10 (added 2026-11-03): F24 released and pinned; every C# copy adapted with a manifest and a green diff check | met in substance: F24 in `bd795847`; creds, coai, benchmark (#207, #218) and rag_qln (#125) each carry a manifest and `TheAdaptedCopyTests` **[D]**; not ticked | agent | a records tick, at promotion |
| DoD 11: producer stages by decision 6's shape; pin bumps alone; the hand clean-up recorded per machine | open: E6's D11 listing is S7's; E7's `qlntest_*` inventory is S2's | agent | E6.S7; E7.S2 |
| DoD 12: the coai feature review of the whole plan, once, after the last epic | open | agent | LAST in the build order |
| E2's feature review | HELD by `call_human` since 2026-11-10 (a reviewer failed; the owner left it held 2026-11-11); not re-read | the owner | the owner's answer on the notice card |
| Rows E6-b, E6-g, E6-i, E6-k, E6-l | **proposed** (S4–S7) | agent | E6's amendment, then each story |
| Rows E6-d, E6-f1, E6-f2, E6-j | built by S3 (#219, CI green) and S2; the stories' state cells still read **proposed** at `b348bb33`: a records update on the next stories progress line, not a new check | agent | — |
| Rows E7-b (branch 2), E7-c, E7-f | **blocked** on the owner's observations on the machine with the stores (§ *Epoch 9* item 7) | the owner | the owner's probe, two-run and `du` runs |
| Rows E7-b (branch 1), E7-d, E7-j, E7-l | **proposed** (S2's Fable spec) | agent | E7's amendment (item 4.4), then S2 |
| The F16 Fix | open with F9 in the follow-ups plan | conventions | not scheduled |
| R4, the private sibling's mirror (F26) | PARKED by the owner 2026-11-05 | the owner | the owner reopens it |

### 2. Prerequisites

1. **Nothing of F41, F41-b, F42 or F42-c is re-opened**, and E6.S3 (#219) and E7.S3–S5 (#125) stand (item 4.1).
2. **E6's stories amendment comes first**: a NEW benchmark PR by Opus (prepared, local: `docs/e6-stories-epoch-11`),
   merged before S4's brief goes to its plan gate. It writes item 4.2 into S4 and items E11-1 to E11-10 into the rows and
   stories they name.
3. **E7's stories amendment** (item 4.4), a NEW rag_qln PR by Opus, merged before E7.S2's plan gate. S2's gate also waits
   for the owner's observations (§ *Epoch 9* item 7), so this adds no wait of its own.
4. Not prerequisites: the `/tmp/.git` todo (item 4.5); the copied C# guard's reading of a piece of the prefix word inside
   an unrelated identifier (item 8.2, *Found on the way*); F43, F44.

### 3. Merge conditions — the rows this revision adds or restates

Every other row of § *Epoch 10* item 3, of the earlier sections and of E6's and E7's stories stands, word for word; a
row restated here keeps every check its earlier text had and adds to it.

#### 3.1 The rows

| # | Condition | Implementation | Executable check | Does not prove | State |
|---|---|---|---|---|---|
| E6-i | restated: no test helper makes a LEGACY name, read by BOTH guards (S4 for `ModelArms/`, S6 for `spikes/`) | S4: `TempFolder` through the copied `OwnedDir`, the K2 sites to the helper, the scaffolds by row E6-l; S6: the shipped Node helper, and the `.py` sites by item E11-6 | S4, against the base `b348bb33`: under `ModelArms/` no `legacy-name`, `raw-temp` or `owner-blind` finding and no `raw-worktree` but the 10 marked lines, in each guard. The Node guard (`--profile node --token bench --identity "the measuring harness"`) 209 → **160** (its 49 there: 15 `legacy-name`, 14 `raw-temp`, 20 `raw-worktree`); its default profile 3 → 3. The copied C# guard (`LeftoversRepositoryGuardTests`, `--explicit only`, information until S7) 173 → **91** (its 82 there: 15 `legacy-name`, 16 `owner-blind`, 31 `raw-temp` of which 17 are `"/tmp"` literals, 20 `raw-worktree`). No finding added elsewhere. On a later base: that base's count less these | that a marker's named folder holds the clone (the code review reads it) | **proposed**. Inputs **[M]**: both lists at `b348bb33` (the Node guard in `wt/bench-e6s3`; the C# run above); the S4 brief's O3/O4 give the same counts **[D]** |
| E6-l | new, from entry 10.2: output a test makes ON PURPOSE to outlive the run (the M2 and M3 pilot scaffolds) goes to an operator-named folder outside the testsToDelete family, never to the temp root | `M2PilotScaffold.cs`, `M3PilotScaffold.cs`: the folder from the REQUIRED variable `BENCH_PILOT_OUT`; unprefixed children `bench-m2-<what>-<id>`, `bench-m2-manifest-<id>.json`, `bench-m3-<what>-<id>`, `bench-m3-manifest-<id>.json`; each scaffold records every intended exact output path DURABLY before creating any (the second gate round, G3): M3 already writes its manifest first (exclusive create, every path in it before it exists, `M3PilotScaffold.cs:41-47`), and M2 now does the same, `bench-m2-manifest-<id>.json` written first under `BENCH_PILOT_OUT` naming its target and root; for EACH scaffold, M2 and M3, a test kills it after its first child exists and finds its manifest naming every intended child; M2's throwaway validation probe (`:72-78`, test lifetime) a `TempFolder`; the folder resolved by ONE function, `tests/Bench.Tests/ModelArms/PilotOut.cs` (`PilotOut.Resolve(value, tempRoot, gitTopOf)`, pure; `PilotOut.Required()` reads the variable, `TempDir.Root` and `RootFacts.GitTopOf`; the at-or-under comparison reads `TempDir.Root`, a path only read), each refusal an ordinary `[Fact]` of `PilotOutTests` (the independent review, S2, S5) | (1) Each scaffold, run once with `--explicit only` and `BENCH_PILOT_OUT` unset → it fails before it makes anything, its message names `BENCH_PILOT_OUT` (RED first: today each writes under the temp root). The same for a value that is empty, relative, not an existing folder, or inside a git checkout (`init` refuses a root there, `tools/model-arms/ModelArms.Core/Experiment/ExperimentFile.cs:70` **[M]**). The same for a value that, resolved (symbolic links followed), IS the temp root or lies under it (plan gate `d8e14338`, G1 and G3: an operator could name `/tmp` or a folder below it, which a WSL restart empties and no sweep reads); RED first by a case naming an existing folder below the temp root. (2) Run once each with the variable set to a scratch folder outside every git checkout → every printed path is under it and named as above; the temp root holds no entry of theirs after the run (the probe's `TempFolder` gone with its claim); then the outputs removed by exact path (M3: its manifest's T4–T5 steps). (3) Both guards on the scaffolds' lines: no `raw-temp`, `legacy-name` or `owner-blind`, and no exemption marker in either file | that the owner's pilot itself runs (the pilot is the owner's, by hand) | **proposed**. The Node half of (3) **observed [M]**: `scanText('tests/Bench.Tests/ModelArms/M2PilotScaffold.cs', …)` of the planned lines (the variable's read, the refusal's message, `Path.Combine(output, $"bench-m2-target-{id}")`, `$"bench-m2-root-{id}"`, `$"bench-m3-{name}-{id}"`, `$"bench-m3-manifest-{id}.json"`, `new TempFolder()`) → `[]` each; controls: `Path.Combine(Path.GetTempPath(), $"bench-m2-target-{id}")` → one `raw-temp` (a rename alone under the temp root stays red); today's line → `raw-temp` and `legacy-name`. The C# half **[R]**, expected clean: no spelling of `RawTemp` (`GetTemp`+`Path2?`, `LeftoversGuard.cs:75` at `b348bb33`), no `"/tmp"` literal (`TempFolderLiteral`, `:137`), no piece of the prefix word (`PrefixPieces`: five characters or more across `sT` or `To`, `LeftoversGuardLiterals.cs:19`, `:104-109`); observed through the copy before S4's plan gate, red or not. *The C# half* **observed** 2026-11-17 (item 3.3, O-b): each planned line `[]`; the controls red as expected. *After the independent review:* the resolver and its seven facts **observed** (item 3.3, O-i), both scaffolds end to end with their output removed by exact path **observed** (O-j) *After the second gate round (G3):* M2's manifest and the killed-after-first-child test of EACH scaffold, M2 and M3, are **proposed** (S4), M3's manifest-first shape the precedent (observed in O-j: its manifest named all eleven paths) |

#### 3.2 The stories texts that would stop the next briefs — read now, each with a state

Found by reading E6's S4–S7, D5–D11, § 3 and § 11 (benchmark `b348bb33`) and E7's S2 and § *The cornerstone*
(rag_qln `48cbf896`) whole, against both guards' finding lists at `b348bb33` (item 8.4), S3's and S4's briefs, and the
code each sentence names. Each is fixed in the stories amendment named; each claim is observed before the gate named.

| # | The text, where | Checked here | What changes, and its state |
|---|---|---|---|
| E11-1 | E6 S4 *What* `:472-474`: two dispositions for the 15 legacy literals | entry 10.2 | item 4.2: three dispositions by lifetime; row E6-l. **proposed**, before S4's plan gate |
| E11-2 | E6 S4 *Files* `:482` (`tests/Bench.Tests/ModelArms/**`) and *Done when* `:483` (no guard named, no `owner-blind`) | the docs that print the scaffolds' paths, the kept reader's name and `TempFolder`'s form lie outside it (**[M]** `git grep -n -E "testsToDelete-(m2\|m3)\|modelarms-reader\|testsToDelete-modelarms"` over `*.md`); the C# guard adds 16 `owner-blind` and 17 `"/tmp"` findings there (S4's brief N1, **[M]** here) | item 4.2's *Files* (named paths) and row E6-i's counts. **proposed**, before S4's plan gate |
| E11-3 | E6 D6 `:254-256`: "with the variable unset, the fake refuses to start", for both fakes | the probe runner launches the fake CLI under a minimal REPLACED environment in which only `TEMP`, `TMP` and `TMPDIR` pass (`src/Bench.Domain/Probes/ProbeChildEnvironment.cs:29`; `tests/FakeCli/Program.cs:658-661` **[R]**); the probe tests name the home `<temp>/bench-fake-cli/<model>` (`tests/Bench.Tests/Probes/Driver/FakeCli.cs:15`). The fake coai's only setter of `COAI_DATA_DIR` is the gate driver (`src/Bench.Domain/Gate/CoaiEnvironment.cs:229`; `CellPaths.cs:83-84` is a doc comment); `ProductPinReader.cs:88` (`--version`, the inherited environment), `CoaiApiProbeRunner.cs:56` (`CoaiEnvironment.Bare` drops every `COAI_*`) and the test driver `FakeCoai.Environment` (drops every `COAI_*`, `tests/Bench.Tests/Gate/Driver/FakeCoai.cs:46-55`; used by `McpStdioClientTests` and `GateProtocolTests`) set none, and the fake falls back to `<temp>/fake-coai-data` (`tests/FakeCoai/Program.cs:417`) **[R]** | D6 restated, **observed** (item 3.3, O-a, O-g, O-h). *The fake CLI:* its home is three-way — `FAKE_CLI_HOME` when passed; an id whose segments are the owner form, recognised WITHOUT the prefix word (`^[A-Za-z]+-[uw][0-9]{1,10}-bench-`), → `<TEMP>/<id>`; any other id → `<TEMP>/bench-fake-cli/<model>` — and the fake NEVER makes its home: the first write into a home nobody made (the call log, `Events.Record`) is refused with exit 3, while `--version`, which writes nothing, still answers. The fake's one temp-root line (`Path.GetTempPath()`, the `TEMP` its launcher passed) takes ONE `raw-temp` exemption, listed by S5's brief: `testsToDelete-exempt: raw-temp — the fake's TEMP is the one its launcher passed, and the home under it is a folder the test made first`. The probe driver mints the owner-form id from an owned folder; the scouts' out-of-process test keeps `<its test-given TEMP>/bench-fake-cli/opus`, a folder it makes inside what it owns (`ScoutsOutOfProcessTests.cs:19-20`, `:31-32` **[R]**); the model-arms launches use `FAKE_CLI_HOME`. *The fake coai:* refuses only where it first needs its data folder (`tests/FakeCoai/Program.cs:247`, `:359`, `:378`; the fallback of `:417` goes), never at start; `FakeCoai.Environment` sets `COAI_DATA_DIR` under its owned `Root` (`tests/Bench.Tests/Gate/Driver/FakeCoai.cs`, on S5's *Files*); `--version` and `--probe-api` never touch the data folder. No product file changes. *Was:* "an id that names no existing folder makes the fake refuse; `<temp>/bench-fake-cli` is never made" (refuted by the scouts' launch, O-a) and the fake coai "refuses with `COAI_DATA_DIR` unset", premised on the gate driver "always" setting it (refuted by three launchers, the independent review's B1). The former `[D]` citation of `research/PLAN_question_consultant_probes.md:317-318` is dropped: it describes the probe path's id, not a refusal (N2) |
| E11-4 | E6 S5 *What* `:489`: "the path-only lines read `TempDir.Root` (… coai's shape G)" | `TempDir.Root` is clean in both guards only because neither traces what a path is used for (consult `1f60c647`; S4's brief O6 **[D]**): it is a blind spot, not a proof | bounded: shape G only for a path that NOTHING creates or keeps — neither the test nor the product it calls (an `--artifact-root` the product writes into is created). The brief reads each such line's callee; a path that is created goes into an owned folder (`TempDir.For`, `OwnedDir`). Never for retained output (row E6-l). **proposed**, before S5's plan gate. *Classified during the re-review (item 3.3, O-c), 2026-11-17:* every one of the 75 C# lines read: 41 create a folder or file (an owned folder), 29 create nothing (shape G allowed), 2 are not provable here (an owned folder), 3 are not paths: **observed by reading [R]**; S5's brief takes the list as its input |
| E11-5 | E6 S5 *Done when* `:500-501`: no guard named, no count | both lists **[M]**: under `tests/` outside `ModelArms/` and `Leftovers/`, the Node guard 73 (70 `raw-temp`, 1 `raw-worktree` — the `.ndjson` line — in `Bench.Tests`; 2 `raw-temp` in the fakes), the C# guard 75 (72 `raw-temp`, 1 `owner-blind` in `Bench.Tests`; 2 in the fakes). C#-only: `Gate/Driver/GateReplyParserTests.cs:125`, `:132` (`"/tmp"` in sample text) and `Probes/ProbeContractsGuardTests.cs:19` (`owner-blind`: the literal `ProbeCellReportDto.LatestState` holds `testSt`, a piece of the prefix word, case-insensitive). Node-only: the `.ndjson` line (the C# copy does not read `.ndjson`) | both guards, 73 → 0 and 75 → 0 there, except the inline exemptions the brief lists (item 4.3); the two `"/tmp"` literals rewritten as S4's K3, never exempted; `:19`'s literal rewritten so no literal spells the piece (for example through `nameof`), the product's member names unchanged (`owner-blind` takes no exemption). **observed** (the lists); the rewrites **proposed**, before S5's plan gate |
| E11-6 | E6 S6's title "(Node)" `:503` and *What* `:505-509`; claim C6 | the copied C# guard reads `.py` and `.sh` anywhere: 14 findings in `spikes/lang-bench` **[M]**: 10 `raw-temp` (9 `mkdtemp(` in `runner/run_samples.py:35`, `:306`, `test/py/test_rs_kill.py:152`, `test_rs_launch.py:478`, `test_run_samples.py:174`, `:192`, `:241`, `:434`, `:449`; `mktemp` in `test/hello/prove.sh:7`, which the Node guard also reports), 3 `legacy-name` (`test/py/box_support.py:187`, `:192`, an owner segment built at run time from `os.getuid()`; `test/py/test_rs_abort.py:98`, a name never made), 1 `owner-blind` (`test/py/test_burner.py:39`, `startswith("testsToDelete-")`). None is a line the followups plan's F1 or F2 names (read: F1 names `lib/exec-probe/lines.mjs:38`, `probe.mjs:51`, `test/exec-layer-isolation.test.mjs:58`; F2 names `minigit-bench/test/helpers.mjs:30-37`, `fake-home.mjs:26`, `lib/cache-snapshot.mjs:42-45`, `lang-explore/test/commands.test.mjs:64-65`), so by D7 they are S6's | S6 reads both guards: its scope is every finding of either guard in `spikes/` at its base that is not on a line F1 or F2 names, listed by its brief by file, line and class. Claim C6 **observed [M]**: the copy reports all nine `.py` `mkdtemp(` lines as `raw-temp` (consumer `b348bb33`, upstream mcp `53f65130`, invocation the repository test above, fixture the repository itself, expected reported, observed reported). The `.py` sites are changed and run within this machine's rule for Python (a sandbox; S6's brief names how). **proposed**, before S6's plan gate. Running them: **blocked** (item 3.3, O-e), S6's stop condition named there |
| E11-7 | E6 S6 *Done when* `:512` | the Node guard's 85 findings in `spikes/` **[M]**: `policy-ab-quick` 30 (25 `raw-temp`, 5 `legacy-name`), `lang-bench` 8 (5 `legacy-name`, 3 `raw-temp`), `lang-explore` 6 (`owner-blind`), `minigit-bench` 41 (21 `legacy-name`, 18 `raw-temp`, 2 `owner-blind`); none on an F1/F2 line | both guards, Node 85 → 0 and C# 14 → 0 in `spikes/`, except the inline exemptions the brief lists (none for `owner-blind`); a name built with a run-time owner segment (`testsToDelete-u${uid}`, `f"testsToDelete-u{…}"`) is red in both guards and goes through the shipped helper or takes a listed `legacy-name` exemption naming the run-time owner. **proposed**, before S6's plan gate |
| E11-8 | E6 S6 has no *Files* line; "the suite gets a start sweep if it has none" | `spikes/minigit-bench/run-tests.mjs`, the runner the `policy-ab-quick` tests run through (`research/module_tests.md:183-185`), has no start sweep (`git grep -n -i sweepLeftovers -- spikes` finds `lang-bench/run-tests.mjs:22-23`, `lang-bench/make-snapshots.mjs:30`, `:183`, four `lang-bench` tests, and minigit-bench's OWN `lib/heldout-run.mjs:95` and `heldout-tool.mjs:26`, `:109` — the held-out tool's listing sweep of `score-tmp` (E6-h), not a start-of-run sweep; corrected after the independent review, N1) **[M]** | *Files*: `spikes/policy-ab-quick/test/**`; the 39 files of both guards' spike findings by path (item 4.2 of the stories amendment lists them); `spikes/minigit-bench/run-tests.mjs` (its start sweep, lang-bench's shape `run-tests.mjs:19-26`, reuse-first); `research/module_tests.md`; the plan records. **proposed**, before S6's plan gate |
| E11-9 | E6 S7 has no *Files* line | S7 deletes the `Explicit` operation of `LeftoversRepositoryGuardTests.cs` (the manifest's operation says "S7 deletes this operation" **[M]**) and adds one on `LeftoversGuardFiles.cs` (C10) | *Files*: `tests/Bench.Tests/Leftovers/template-manifest.json` and those two targets; `.github/workflows/ci.yml` (`build-test`: the Node guard step; Node and the mount's `npm ci` are there since F42-c **[D]**); `research/local-model-coding/harness/t-lib.sh`, `part6/t-lib.sh` (D8); `http/README.md`; `research/module_tests.md`; the plan records. Its counts: after S4–S6, Node 2 and C# 2 (the two D8 lines, `raw-worktree`, in both) and the default profile 2 → 0 each. **proposed**, before S7's plan gate |
| E11-10 | E6 S5 *Files* `:498` and every story's *Files* | the plan records (brief, `todo/README.md` row, its promotion with `research/README.md`, the stories' progress line) are on no *Files* line; S3's brief needed them (its Q2) and S4's asks (Q5) | one standing line in § 6 of the stories: each story's PR carries its plan records; they count as in its *Files*. **proposed** |
| E11-11 | E6 claims C8 and C10 | C8: S4's brief O1 observed the C# copy reading `worktree add` in a `tests/` `.cs` and not in a `src/` `.cs` (both guards alike for (a), (b)) **[D]**, local brief; C10's "without" half: a `.cs` under `tools/model-arms/` is not discovered (scanned 0, O1 (d)) **[D]** | C8 **observed** for S4's half (S5's half stays **proposed**, before S5's plan gate); C10's "without" half **observed**, its "with" half **proposed**, before S7's plan gate |
| E11-12 | E7 § *The cornerstone* items 1, 6, 9–10 and row E7-l: the frame offers run-owned stores (the owner form) or exemption (a); item 6 asks whether the fixed ids are REUSED across runs | a reused corpus outlives the run: it is entry 10.2's kind, and the owner form would promise that its deletion is safe (the detail's § *Never*). And in rag_qln's copy the bare prefix word in any spelling, in a `.cs` of the `Tests` or `Source` kind outside `tests/Rag.Tests/Leftovers/`, is `owner-blind`, which takes no exemption (rag_qln `tests/Rag.Tests/Leftovers/LeftoversGuard.cs:28-31`, `:48`, `:216-218`, `:230-231` at `48cbf896` **[R]**), so a name builder or a sweep matcher in `src/` cannot spell `teststodelete_` | E7's amendment (item 4.4). **proposed**, before E7.S2's plan gate. *The word rule* **observed** 2026-11-17 (item 3.3, O-d) |

#### 3.3 The feasibility claims, observed during the re-review (before epoch 11 opens)

Added after the re-review consult `a6cfcc53` (its point 1; item 8.1): every feasibility claim a remaining story relies on
is observed NOW, not by that story's brief; what cannot be observed here is **blocked**, with the story's stop condition.
**Common to O-a, O-b, O-d and O-g to O-j** (O-g to O-j added after the independent review, with more scratch edits each row names; O-k ran in a second scratch clone, of rag_qln): a scratch clone of benchmark at `b348bb33` (`git clone --no-hardlinks` of the local
repository, checked out at that SHA, the mount `b1746499` copied in as files with its `node_modules`), outside every
worktree, never committed and never pushed; the copied C# helper and guard are the template's at mcp `53f65130` (F42-c's
manifest). Two scratch test files were added there (`tests/Bench.Tests/Infrastructure/E11ScratchObservations.cs`,
`tests/Bench.Tests/Probes/Driver/E11ProbeObservations.cs`), and for O-a ONE scratch edit of the fake's home rule
(`tests/FakeCli/Program.cs` `FakeHome.For`: an id of the owner form resolves to `<TEMP>/<id>`, exit 3 when that folder is
missing; every other id as today), which is the rule S5 would write, test code, no product file. Built once per change,
`nice -n 19 dotnet build tests/Bench.Tests/Bench.Tests.csproj -c Release -m:4 -p:AppHostRuntimeIdentifier=linux-x64
--disable-build-servers` (0 warnings, 0 errors), run as `nice -n 19 ./tests/Bench.Tests/bin/Release/net10.0/Bench.Tests
--filter-class "*E11…"` (every scratch test passed). WSL Ubuntu, uid 1000, `TMPDIR` unset (the temp root `/tmp/`), .NET SDK
10.0.114, Node v26.12.1, no Docker. Afterwards `ls -d /tmp/testsToDelete-u1000-bench-fakecli-*` → 0 (everything the
scratch tests made was removed by the helper).

| # | Claim (where) | Consumer SHA · upstream pin | Invocation | Fixture path, plant | Expected | Observed | State |
|---|---|---|---|---|---|---|---|
| O-a | E11-3: the probe runner's path accepts a model id that names an owned folder, the fake's home resolves inside it, and an id that names no folder is refused | benchmark `b348bb33` · mcp `53f65130` | the PROBE RUNNER as `CliProbeRunnerTests`' rig builds it (`CliProbeRunner` over `CliAgentRuntime`, `ProbeChildEnvironment.Of(parent)`, `ProbeKind.ReadInside`, a `claude` subject, deny list); `ProbeSubject.Parse` and `ModelRef.Parse` on the id; then the same through `CliSubjectRuntime` | an `OwnedDir.Create("fakecli")` folder in `/tmp/` holding `script.json` (`{"readInside":true}`); the id = its leaf, `testsToDelete-u1000-bench-fakecli-<6>` (40 characters); the negative id = `Owned.NameFor("fakecli")`, never created | the id parses; the attempt is answered; the call log is inside the owned folder; nothing under `<temp>/bench-fake-cli`; the missing id refused, nothing made | `ProbeSubject.Parse` ok, `ModelRef.Parse` ok; the probe attempt settled `Answered`, exit 0, canary `Yes`; one call file in `<owned>/events`; `<temp>/bench-fake-cli/<id>` absent. Missing id: settled `Failed`, exit 3 ("names no owned folder in /tmp/"), canary not captured; neither `<temp>/<id>` nor `<temp>/bench-fake-cli/<id>` exists. `TMPDIR`, `TEMP`, `TMP` pass the probe child's allow list (`src/Bench.Domain/Probes/ProbeChildEnvironment.cs:29` **[R]**), so the child's temp root is the harness's | **observed**. E11-3's rule revised to three ways (the scouts' out-of-process launch has no variable and a test-given `TEMP`, item 3.2) |
| O-b | row E6-l (3), the C# half: the planned scaffold lines are clean in the copy, a rename under the temp root is not | benchmark `b348bb33` · mcp `53f65130` | `LeftoversGuard.Scan(tree, tree)` over one private tree per plant | `tests/Bench.Tests/ModelArms/M2PilotScaffold.cs` in each tree, the plant inside a method body: the variable's read; the refusal's message naming `BENCH_PILOT_OUT`; `Path.Combine(output, $"bench-m2-target-{id}")`; `…bench-m2-root-{id}`; `…bench-m3-{name}-{id}` (M3's dictionary line); `…bench-m3-manifest-{id}.json`; `new TempFolder()`. Controls: the target under `Path.GetTempPath()`; today's `testsToDelete-m2-target` line; the target under `TempDir.Root` | each planned line `[]`; the temp-root rename `raw-temp`; today's line `legacy-name`, `owner-blind`, `raw-temp` | each of the seven planned lines: scanned 1, `[]`. Controls: rename under `GetTempPath()` → `raw-temp` (`GetTempPath`); today's line → `legacy-name`, `owner-blind` (`testsToDelete-m2`) and `raw-temp`; under `TempDir.Root` → `[]` (the blind spot of consult `1f60c647`, observed: shape G hides a retained path from both guards, which is why row E6-l forbids it) | **observed** (both halves of (3); (1) and (2) are S4's PR's RED → GREEN) |
| O-c | E11-4: the callee of every S5 line that could take shape G, classified created or not | benchmark `b348bb33` | read **[R]**: each of the C# guard's 75 findings under `tests/` outside `ModelArms/` and `Leftovers/`, its line and the code it calls | — | each line created / not created | 41 CREATE a folder or file → an owned folder (`CreateTempSubdirectory`, `CreateDirectory`, the private temp classes, the fakes' homes). 29 create NOTHING → shape G allowed: `AuthoringPassTests.cs:280`, `:292` (an in-process `EchoingAgent`; `Worktree` only passed), `GateAaCommandTests.cs:214` (the test itself asserts the root is never made, `:223`), `GateAssessCommandTests.cs:48`, `GateDriverCommandTests.cs:32` (missing suite files), `FilesystemEngineTests.cs:184`, `QlnEngineTests.cs:301`, `QlnEngineLiveTests.cs:174` (`FilesystemEngine` only reads: no write call in `src/Bench.Infrastructure/Engines/FilesystemEngine.cs`), `ProductPinReaderTests.cs:72`, `FileSystemGateArtifactStoreTests.cs:237`, `:238`, `:246`, `GitCheckoutLocalSourceTests.cs:93`, `AnchorCheckTests.cs:103`, `:110` (pure), `ProcessRunnerCancellationTests.cs:28`, `ProcessRunnerStderrSinkTests.cs:22`, `ProcessRunnerTests.cs:15`, `:26`, `:39`, `:56`, `:75`, `:92`, `:107`, `:138` (a working directory; git and the fake write nothing there), `AssessorArgvTests.cs:78`, `ScoutLaunchProcessTests.cs:100`, `:107`, `TracePortTests.cs:257` (`FixtureTrace` only reads). 2 NOT PROVABLE here → an owned folder: `GateDriverCommandTests.cs:33` (`--artifact-root` = the temp root; the refusal's order against a write is not traced) and `CliAgentLiveTests.cs:83` (a real CLI's working directory, not run here). 3 are not paths (E11-5) | **observed by reading** (no S5 line needs shape G for a path something creates). Noted, not a leftover: `FilesystemEngine(Path.GetTempPath())` would enumerate the whole temp root if a tool were invoked over it |
| O-d | E11-12 (E7.S2): the copy's word rule refuses a store-name builder or matcher that spells the prefix outside the helper's own spelling | benchmark `b348bb33` · mcp `53f65130` (rag_qln's copy is of the same commit, with its own operations; observed here through benchmark's) | `LeftoversGuard.Scan(tree, tree)` over one private tree per plant | `src/Bench.Infrastructure/E11Plant.cs`: `"teststodelete_" + owner + "_qln_" + what`; the interpolated `$"teststodelete_{owner}_qln_{what}_{id}"`; `collection.StartsWith("teststodelete_" + owner + "_qln_", …)`; a split `"tests" + "todelete_"`; a literal owner `"teststodelete_u1000_qln_x_ab12cd"`; a received `options.CorpusPrefix`. The builder line also at `tests/Bench.Tests/Infrastructure/E11Plant.cs` and at `tests/Bench.Tests/Leftovers/E11Plant.cs` | the four spellings red `owner-blind`; the literal owner and the received value clean | builder, interpolated, matcher, split: each one `owner-blind`, in `src/`, in a test folder AND in a new file of the helper's folder; literal owner `[]`; received value `[]` | **observed**. So E7.S2's builder and matcher cannot spell the prefix in code: the prefix is received (configuration), or the guard changes (a template change in mcp and a re-sync, a counted change of the parent) — item 4.4 point 2 |
| O-e | E11-6, widened (the independent review, S3): S6's `spikes/lang-bench` suite run, which is how the `.py` changes are proved | — | not run: `spikes/lang-bench/run-tests.mjs:6-8` has Node test files start the system `python3 -I -m unittest`, and `research/module_tests.md` runs the suite with `BENCH_REQUIRE_SANDBOX=1` and `LANG_V2_TASK_REPO=<the task repository>`; this machine's rule allows Python only in a sandbox (a `wslc` image or an owned venv) | — | — | — | **blocked**: S6's brief names the sandbox its whole `lang-bench` suite runs in, with both variables, before its plan gate; without one, S6 STOPS before its gate and the owner is asked |
| O-f | E6 S7: the followups plan's S1 and S2 merge before S7 (D7) | — | not observable: that plan has no date | — | — | — | **blocked** on the followups plan: S7's stop condition is D7's own (wait, or the owner moves those sites to E6), unchanged |
| O-g | B1: no launcher of the fake coai reaches a data-folder fallback once the fallback is gone | benchmark `b348bb33` · mcp `53f65130` | scratch edit of `tests/FakeCoai/Program.cs` `DataDir()`: no fallback, exit 4 with one line naming `COAI_DATA_DIR` when unset; then `--filter-class` `*.McpStdioClientTests`, `*.ProductPinReaderTests`, `*.CoaiApiProbeRunnerTests`, and a scratch `E11CoaiObservations` that replays `GateProtocolTests`' Docker-free shape (`new FakeCoai()`, `OpenAsync()`, one `review_code` and one `review_plan`); RED with `FakeCoai.cs` unchanged, GREEN with `FakeCoai.Environment` setting `COAI_DATA_DIR` = `<Root>/data` | the driver's `Root` (`<temp>/bench-gate-fake/<guid>` at the base; S5 makes it owned) | RED: a review through `FakeCoai.Environment` reaches the data folder and is refused; GREEN: it writes under `<Root>/data`; the three classes pass either way; `/tmp/fake-coai-data` never made | RED: `review_plan` failed, "the product exited … before it answered", stderr `fake-coai: COAI_DATA_DIR is unset`; `review_code` answered (it refuses before any write). GREEN: both answered, `<Root>/data` holds `sessions`, `usage.jsonl`. `McpStdioClientTests` 5/5, `ProductPinReaderTests` 4/4 (`--version`), `CoaiApiProbeRunnerTests` 7/7 (`--probe-api`), in both runs; `/tmp/fake-coai-data` absent before and after. `GateProtocolTests` (12), `GateCampaignTests` (7) and `GateDriverCommandTests` need Docker (the `postgres` collection) and were not run: their fake launches are the gate driver's (`CoaiEnvironment.cs:229` sets the variable) or `FakeCoai.Environment` (fixed above), `GateCampaignTests.cs:182` runs `--version` **[R]** | **observed**; the Docker-bound classes **blocked** here, run by S5's PR on `build-test` (Docker on `ubuntu-latest`), where any red is S5's own fix in `tests/` |
| O-h | S1 and S4 (a): the fake CLI's lines are clean, and no launch needs the fake to make its home | benchmark `b348bb33` · mcp `53f65130` | scratch edit of `tests/FakeCli/Program.cs`: the owner form by segments (`^[A-Za-z]+-[uw][0-9]{1,10}-bench-`), the temp-root line under the `raw-temp` marker of E11-3, the refusal moved to `Events.Record`; the repository guard over the clone (`--explicit only --filter-class "*LeftoversRepositoryGuardTests"`) and the Node guard (`--profile node`); then `--filter-class` over every Docker-free launcher: `ProcessRunnerStderrSinkTests`, `CliSubjectRuntimeTests`, `CliProbeRunnerTests`, `FakeCliByCallTests`, `FileGateLockTests`, `ScoutLaunchProcessTests`, `ScoutPinReaderTests`, O-a's probe test, and `--filter-namespace "Bench.Tests.ModelArms"` | the clone | no finding on the fake's lines in either guard; every launcher green; `/tmp/bench-fake-cli` gains nothing | both guards: no finding in `tests/FakeCli/Program.cs` (the marker valid, no `exemption` finding; the old `"^tests" + "ToDelete-…"` spelling of O-a's first scratch edit was `owner-blind` per the review, and is gone). First run with the refusal in `FakeHome.For`: `ScoutPinReaderTests` 1 of 4 RED (`--version` exited 3: no home); with the refusal at the first write: 9/9, 6/6, 14/14, 9/9, 36/36, 5/5, 4/4, 1/1, and ModelArms 2100 tests, 0 failed, 6 skipped (1 m 54 s); `/tmp/bench-fake-cli` entries 0 before and after. Docker-bound launchers (`ScoutsOutOfProcessTests`, the probes' and scouts' CLI tests) not run: their homes are made by `ScoutFake` and the probe driver before launch **[R]** | **observed**; the Docker-bound launchers **blocked** here, run by S5's PR on `build-test` |
| O-i | S2 and S5: one resolver for `BENCH_PILOT_OUT`, its refusals pinned by ordinary facts, its lines clean | benchmark `b348bb33` · mcp `53f65130` | scratch `tests/Bench.Tests/ModelArms/PilotOut.cs` (`Resolve(value, tempRoot, gitTopOf)`, pure; both paths resolved through `ExecutableResolution.RealPathClimbing`; `Required()` reads the variable, `TempDir.Root` and `RootFacts.GitTopOf`) and `PilotOutTests.cs` (seven ordinary facts); `--filter-class "*.PilotOutTests"`; both guards over the clone | the clone; private folders under a `TempFolder`, with an injected temp root for the at-or-under case and a real `.git` folder for the checkout case | each refusal names `BENCH_PILOT_OUT` or its reason; an existing folder outside both is accepted; no finding on either file in either guard | 7 of 7 green (unset, empty, relative, missing, at and under an injected temp root and at the real `TempDir.Root`, inside a checkout naming it, accepted); no finding in `PilotOut.cs`, `PilotOutTests.cs` in either guard. The comparison reads `TempDir.Root` (a path only read, within E11-4's bound; the output never goes there) | **observed** |
| O-j | S3: each pilot scaffold runs end to end on this host with the resolver, and its output is removed by exact path | benchmark `b348bb33` · mcp `53f65130` | the two scaffolds edited in scratch as row E6-l writes them (`PilotOut.Required()`; `bench-m2-…`, `bench-m3-…`; M2's probe a `TempFolder`); `Bench.Tests --explicit only --filter-method "*Writes_the_scratch_target_and_root_for_the_pilot"` and `"*Writes_the_scratch_target_root_home_and_claude_for_the_pilot"`, with `BENCH_PILOT_OUT` unset, `=/tmp`, and a new folder `/home/jinx/.cache/e11-pilot-out-<8 hex>` (outside the temp root and every checkout) | that folder | unset and `/tmp` refused before anything is made; with the folder: M2 passes (its `validate` over the probe root → 0, the target a git repository with the rules submodule), M3 passes; every printed path under the folder; nothing of theirs in the temp root | unset: both fail with "`BENCH_PILOT_OUT` is unset: …"; `/tmp`: "… is at or under the temp root /tmp". With the folder: M2 1/1 passed, target `…/bench-m2-target-3ce67163` (`.agents/conventions` submodule present; `.git/m2-pilot/` holds `experiment.json`, `scenarios.json`, `coai-settings.json`), root a name only; M3 1/1 passed, manifest `…/bench-m3-manifest-56deb39d.json` (uid 1000, 11 paths), ten `bench-m3-*-56deb39d` entries. `/tmp/bench-m*` and `/tmp/testsToDelete-m[23]-*` 0. Removed by exact path: M2's two printed paths; M3's manifest paths one by one, each checked to be `<folder>/bench-m3-…-56deb39d`, the manifest last; the folder then empty and removed | **observed** |
| O-k | B2 (E7.S2): a received prefix checked for SHAPE in `src/`, ownership checked in tests through the helper, item 9's rename with no `src` line spelling the word | rag_qln `48cbf896` · mcp `53f65130` (its copy) | a scratch clone of rag_qln at `48cbf896` (the mount `b1746499` and `external/dew_flow_mcp` at `53f65130` copied in), one scratch test `tests/Rag.Tests/E11WordObservations.cs`; `LeftoversGuard.Scan(tree, tree)` per plant in rag_qln's copy; `scanText` and `isScanned(…, 'node')` of the mounted Node guard; build `nice -n 19 dotnet build tests/Rag.Tests/Rag.Tests.csproj -c Release -m:4 -p:AppHostRuntimeIdentifier=linux-x64 --disable-build-servers` (0 warnings) | `src/Rag.Application/Runtime/E11Plant.cs`: the shape check (non-empty, ends with `_`, no `*`, `?`, `%`, `[`, a fixed class); the regexes `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*_\z`, the owner-scoped `^[a-z]+_[uw][0-9]{1,10}_[a-z0-9]+_\z` and the name segments `^(?<word>[a-z]+)_(?<owner>[uw][0-9]{1,10})_(?<token>[a-z0-9]+)_(?<what>[a-z0-9]+)_(?<id>[A-Za-z0-9]{6,12})\z`; `options.Value.TestCorpusPrefix`; `public string TestCorpusPrefix { get; init; } = string.Empty;`; a `StartsWith(prefix, …)` selection. `tests/Rag.Tests/Integration/E11Plant.cs`: `Owned.NameBase.ToLowerInvariant().Replace('-', '_')`; `Owned.Classify(name) is NameForm.Owner { Token: "qln" }`; `Owned.Pattern().IsMatch(name)`; `Owned.FullName().IsMatch(name)`. Controls: `public const string Value = "teststodelete_";` and `prefix != "teststodelete_"` in `src/`; `Owned.Prefix…` and `Be("teststodelete_")` in a test | every planned line clean in the copy; the controls `owner-blind` | every planned line `[]` in rag_qln's copy; controls: each one `owner-blind` (`teststodelete_"`, `Owned.Prefix`). Node: `src/` is not scanned (`isScanned` false); the test lines `[]` (the bare literal `"teststodelete_"` in a test is `[]` in Node too: only the copy refuses it) | **observed**: no counted template change is needed (item 4.4 point 2) |
| O-l | S4 (b): the 9p scratch folder of `PosixFolderIsolationTests` is collected after a kill, by that test sweeping its own parent at start | — | not run: today the test runs only when `MODEL_ARMS_DRVFS_SCRATCH` names the 9p mount point itself (`/mnt/c`, the Windows drive's root, `PosixFolderIsolationTests.cs:317-319`: its `/proc/mounts` check compares the mount point with the variable), "no test writes the operator's Windows drive on its own". S4 widens that check (the third gate round, finding 1): the test accepts a VALIDATED scratch folder BELOW a 9p mount — the folder exists, holds nothing at the start but owner-form entries of this repository and their claim files (what a killed run of this test leaves, which the start sweep then judges by rule §3/§4; anything else refuses, so nothing foreign is ever touched; CodeRabbit on #176), and the longest mount point above it in `/proc/mounts` is of type `9p` (drvfs) — and confines every write (its start-of-test sweep, the owned folder and its claim) to that folder, never the mount's root; the mount gives every file to uid 1000 (`/proc/mounts`: `uid=1000,gid=1000` **[M]**), so the kernel-owner key is always true there and the record is the only real evidence **[R]**; the sweep over an arbitrary parent is the copied sweep's own tested behaviour (`LeftoversSweepTests` over private roots **[D]**) | — | — | — | **blocked** on the operator's variable. S4 writes the start-of-test sweep (`LeftoversSweep.Run` over that parent, the caller's scope, the two keys of rule §4). **S4's merge condition** (the second gate round, G2): a child making the folder there is killed and the next run's sweep removes it, on the real 9p mount, OR the owner approves an explicit exception; item 7 asks the owner whether it may be run once with `MODEL_ARMS_DRVFS_SCRATCH` = a new empty folder under `/mnt/c/Users/<owner>/AppData/Local/Temp/`. *Was:* "else S4 records it as not proved on 9p and STOPS before its merge only if the sweep's own unit test (over a non-9p parent) is red" |
| O-m | G1 and B2 (a)–(c): the product's fixed-token shape, its list-only selector, the record-gated drop and the legacy selector, spelled clean | rag_qln `48cbf896` · mcp `53f65130` | as O-k, the same scratch clone and test, two more builds | `src/Rag.Application/Runtime/E11Plant.cs`: `GeneratedRegex("^[a-z]+_[uw][0-9]{1,10}_qln\\z")` (the configured value) and `"^[a-z]+_[uw][0-9]{1,10}_qln_\\z"`; `collections.Where(name => name.StartsWith(prefix + "_", StringComparison.Ordinal))`; `if (claims.Read(name) is not ClaimRecord.Abandoned abandoned || !abandoned.RegisteredBeforeCreate) return Keep(…)`; `public const string Legacy = "qlntest_";` | each clean | each `[]` in rag_qln's copy; the Node guard does not scan `src/` (`isScanned` false) and gives `[]` for each by `scanText`; the four controls of O-k stay `owner-blind` | **observed** |

What O-a changed: E11-3's disposition (item 3.2): the fake keeps today's per-model home for an id NOT in the owner form,
because one launch through the production services has no variable and finds its home under a test-given `TEMP`; the
refusal is for an owner-form id whose folder is missing. After the independent Opus review (item 3.4): O-g changed the
fake coai's disposition (the refusal moves to the point of need, the fallback goes, and `FakeCoai.Environment` sets the
variable); O-h changed the fake CLI's (the owner form recognised by its segments, the fake never makes its home, the
refusal at its first write, so `--version` still answers; one listed `raw-temp` exemption); O-k changed item 4.4 point 2
(the product checks the received prefix's SHAPE, the tests check ownership through the helper). Nothing else observed
contradicts a proposed disposition.

#### 3.4 The independent Opus review (2026-11-17): "do not approve as written", and what was done

Every finding was checked against the code by the coordinator (B1, B2) or here, and every fix was observed in the
scratch clones of item 3.3 before it was written (rows O-g to O-l).

| # | Finding | Checked | Done |
|---|---|---|---|
| B1 | D6 kept "the fake coai refuses with `COAI_DATA_DIR` unset", on the premise that the gate driver always sets it; three launchers never do | true: `CoaiEnvironment.cs:229` is the only setter; `ProductPinReader.cs:88`, `CoaiApiProbeRunner.cs:56` and `FakeCoai.Environment` set none; the fallback `Program.cs:417` | E11-3 restated (refusal at the point of need, the fallback gone, `FakeCoai.Environment` sets the variable under its `Root`); O-g |
| B2 | G2 as written forces a counted template change: no clean `src` line can compare to `teststodelete_` | true: `AllowedAfterWord` (`:122`), `Owned.Prefix` outside the folder (`:131`); the product holds the prefix as `TestCorpusPrefix.Value` | item 4.4 point 2: SHAPE in the product, ownership in the tests, item 9's rename by configuration; O-k: every chosen line clean; no counted change. *Revised by the second gate round (G1, option B) and the reviewer's re-check (B2 (a)–(c)):* the prefix confers no deletion authority, the product lists only, no parse past the token, `qlntest_` kept list-only until the inventory; O-m |
| S1 | O-a's `FakeHome.For` spelling is `owner-blind`; the fake's `GetTempPath()` is `raw-temp` in both guards | true (the review); the fake's project cannot reference the helper | the owner form by segments without the word; one listed `raw-temp` exemption; O-h: both guards clean |
| S2 | "at or under the temp root" has no clean spelling except reading `TempDir.Root` | true | the comparison reads `TempDir.Root` (a path only read); O-i |
| S3 | item 8.1 says every feasibility claim is observed before opening: the scaffolds were not run; O-e too narrow | true | O-j: both scaffolds run end to end and removed by exact path; O-e widened to the `lang-bench` suite run |
| S4 (a) | the fake CLI's fallback for a non-owner id was an undeclared narrowing | true | a refusal kept: the fake never makes its home (refusal at its first write); O-h: every Docker-free launcher and ModelArms green. Not smaller |
| S4 (b) | Q7: the 9p claimed folder is never collected after a kill | true | the test sweeps its own parent at start (Q7); O-l **blocked** on the operator's variable, with its stop condition. Not smaller by design; its 9p observation is the owner's |
| S5 | the resolver's refusals were only Explicit-scaffold checks | true | `PilotOut` with ordinary facts (O-i); the DoD reading says the bound is checked every suite run, and "no other use" is a review item |
| S6 | item 1 said the goal stands word for word while item 4.3 withholds its promise from the pilot output | true | item 1's *Goal* writes the exception, as epochs 5, 7 and 8 did |
| S7 | no table of every unticked DoD item and open row | true | item 1's *What is still open* table |
| N1 | E11-8's `git grep` result was incomplete | true: minigit-bench's own `lib/heldout-run.mjs:95` and `heldout-tool.mjs:26`, `:109` (the held-out tool's listing sweep, not a start-of-run sweep) and four `lang-bench` tests also match | E11-8 and the stories reworded; the conclusion stands |
| N2 | E11-3's `[D]` citation contradicts the claim | true | dropped |
| N3 | stale text: the status line, NEXT, the record's note, the judge's "this revision" row | true | refreshed |
| N4 | E6 D5: "an unclaimed prefixed folder is collectable once ten minutes old" | true: an unclaimed owner-form folder is UNMARKED, listed and never collected (rule §2, §4) | the stories' D5 corrected |
| N5 | `LeftoversGuard.cs:72` | the review said `:73`; read here: `:72` is `RawTemp =`, the `GetTemp`+`Path2?` pattern is `:75` (benchmark `b348bb33` and mcp `53f65130` alike) **[M]** | corrected to `:75` |

None of the fixes makes a condition smaller than item 4.3 already declares: the Narrowed line stands.

### 4. The dispositions of entries 10.1 and 10.2

**4.1 Entry 10.1 — kept as built.** E6.S3 (#219) carries row E6-f2's configuration half as the green pin entry 10.1
describes, with the builder counterexample and the run-time disposal proof red-first (S3's brief, promoted; #219's CI
**[D]**). Nothing in this revision changes it.

**4.2 Entry 10.2 — a third disposition, by lifetime (disposition B; consult `1f60c647`, two of two).** S4's *What* is
restated in E6's stories: each site S4 disposes of is classified by its lifetime, and each class has ONE disposition:

| Lifetime | Disposition | S4's sites |
|---|---|---|
| the run (the test makes it and removes it) | the copied helper: `OwnedDir`, `TempFolder`, `TempDir.For`; owner form, claimed, removed by exact path | `TempFolder.cs:10`; `BriefFillerTests.cs:156`, `:184`, `:231`; `ModelArmsProgramTests.cs:83`; `PosixFolderIsolationTests.cs:321` (on the operator's 9p mount, `OwnedDir.Create("drvfs", scratch)`); `KernelFactsTests.cs:135`; M2's validation probe `M2PilotScaffold.cs:72-78` (also used by M3, `pilot = "m3"`) |
| inside an owned folder, removed with it | a plain name inside, no prefix (rule §1, last item) | `PinnedConsumer.cs:126-137`, the kept scratch (the stories' S4 *What*, as written) |
| a name never made, a path only read, sample text | a name from the helper (`Owned.NameFor`) where the name matters; otherwise a neutral literal; shape G only within E11-4's bound | `InitVerbTests.cs:138`; `TimingLineTests.cs:311-312`; the 17 `"/tmp"` literals; `KernelFactsTests.cs:27`; `ValidateVerbTests.cs:752`, `:755` |
| must OUTLIVE the run (the owner's attended pilot) | an operator-named folder from the REQUIRED variable `BENCH_PILOT_OUT`, outside the testsToDelete family, resolved by ONE function under `ModelArms/` (`PilotOut.Resolve(value, tempRoot, gitTopOf)`, pure, and `PilotOut.Required()`), refused, with a message naming the variable, when it is unset, empty, relative, not an existing folder, at or under the temp root (resolved; the comparison reads `TempDir.Root`, a path only read) or inside a git checkout; each refusal pinned by an ordinary `[Fact]` (`PilotOutTests`) the suite runs every time; unprefixed children `bench-m2-<what>-<id>`, `bench-m2-manifest-<id>.json`, `bench-m3-<what>-<id>`, `bench-m3-manifest-<id>.json`, each scaffold's manifest written first and naming every exact path before it exists (G3); never `Path.GetTempPath()` or `TempDir.Root` for this output, no exemption marker; retired by the pilot's own teardown (M2: its manifest's paths, the manifest last; M3: its manifest, T1–T5, T4 reading `bench-m3-*-<id>`). Observed end to end (item 3.3, O-i, O-j) | `M2PilotScaffold.cs:39`, `:40`; `M3PilotScaffold.cs:34`, `:37`, `:105`; new `PilotOut.cs`, `PilotOutTests.cs` (under `ModelArms/**`) |
| a test about the old name itself | the `~` spelling, in its form that is clean in BOTH guards: `"tests~To~Delete-…".Replace("~", …)` (S4's brief O5: `"tests~ToDelete-…"` leaves the piece `ToDelete`, `owner-blind` in the C# copy) | none in S4 (the stories' `~` precedent stays for the 10 `worktree add` assertion strings: `"work~tree add"`, clean in both, O2) |

Why `BENCH_PILOT_OUT` and not a folder the test picks: the output is the owner's, kept for a manual pilot; the repository's
precedent for an operator's output root is `BENCH_ARTIFACT_ROOT` (`hosts/Cli/ProbesInputs.cs:75-78`, refused with a sentence
naming it, `:97`), and a required variable makes the operator choose, so nothing lands in the temp root by default. Why
not the owner form: a claimed folder whose process has ended is `gone`, and the next run's sweep collects it ten minutes
later, during an attended pilot (rule §4). Why not a rename under the temp root: it stays `raw-temp` in both guards (row
E6-l's controls). Why not shape G: `TempDir.Root` is clean only because no guard traces callers.

S4's *Files*, as named paths (the S4 brief's § 0.1 gives each `ModelArms/` file its sites):

- `tests/Bench.Tests/ModelArms/**` (the code and its tests);
- `research/module_model_arms.md`: the lines that describe today's behaviour — `:1462` (`TempFolder`'s folder form),
  `:2114` (a timed-out reader's scratch, now kept inside the owned folder), `:2250-2256` (M2's procedure: step 1's printed
  paths, `BENCH_PILOT_OUT`, the log's removal sentence); the logs of the runs (`:2262`, `:2322`, `:2370`) keep their
  observed paths as history;
- `research/PLAN_model_arms_E6.md` (IMPLEMENTED): one dated note each beside `:338-341` (the names), `:381` (T4's name
  check), `:746` and `:819`, `:821` (the kept reader's name; the growth rows), the old text kept;
- `research/PLAN_model_arms_E3.md` (IMPLEMENTED): one dated note each beside `:810-811`, `:876`, `:885`, `:1146`, the old
  text kept;
- within `tests/Bench.Tests/ModelArms/**`, `PosixFolderIsolationTests.cs` is touched beyond the S4 brief's bound (its § 0.1
  names only the `:321` block): its 9p check `:317-319` (a validated scratch folder below a 9p mount), the start-of-test
  sweep, and every write confined to that folder (the third gate round, finding 1); the brief's § 0.1 row widens to match;
- the plan records (E11-10): S4's brief, its `todo/README.md` row, its promotion (`research/PLAN_test_leftovers_E6_S4_brief.md`,
  `research/README.md`), the stories' progress line.

Read and NOT on the line: `research/module_tests.md` and `research/PLAN_model_arms.md` print no pilot path, no kept
reader's name and no `TempFolder` form (**[M]**, the `git grep` of E11-2); `research/module_model_arms.md:1308` and the
other IMPLEMENTED model-arms plans that name `testsToDelete-modelarms-…` (E1 `:1166`, `:1187`; E3 `:80`, `:152`; E4 `:1139`)
record what was built then, and stay.

S4's *Done when* (restated): rows E6-i and E6-l met by their checks; the S4 brief's scenarios (1)–(5) each RED first and
RED again quoted; the ModelArms namespace green with its time beside the base's (2 m 10.7 s, S4's brief O8 **[D]**); the
whole suite's FAILED list equal to the base's; no growth of `/tmp/testsToDelete-*modelarms*` across a namespace run;
`TheAdaptedCopyTests` green; `git diff --name-only <base>..HEAD` within the *Files* above; `plan-lifecycle.mjs` clean.

**S4's brief questions** (brief `4dc04820` § 14), each decided:

| Q | Decided | Plan text or brief-level | Source |
|---|---|---|---|
| Q1 | disposition B, as the last row of the lifetime table; M2's probe a `TempFolder` | plan text: S4 *What*, *Files*, *Done when*; row E6-l | consult `1f60c647` (two of two); `33aa7f43` counted it |
| Q2 | the C# guard's 33 extra findings under `ModelArms/` (16 `owner-blind` on the legacy lines and `M2:78`, 17 `"/tmp"` literals) are S4's; the literals are rewritten, never exempted; `owner-blind` takes no exemption anyway | plan text: row E6-i names both guards and the counts (it is the baseline here; under § *Epoch 10* it was already S4's by § 11's "in either guard") | this revision; the stories' DoD `:609` |
| Q3 | `TimingLineTests.cs:311-312` becomes a neutral sample (`"/srv/x_1/arm.d ~y"`), the slug rule kept character for character | brief-level: the line makes nothing, it is within the *Files* and it only satisfies the *Done when* | S4's brief K2 |
| Q4 | `PinnedConsumer`'s kept scratch moves INSIDE the owned folder under a plain name, as the stories already write; the failure message is the record; the docs that name the old kept name are on S4's *Files* | brief-level for the code (the stories decided it); plan text only for the *Files* | the stories' S4 *What*; E11-2 |
| Q5 | the plan records are within every story's PR (E11-10); `research/module_tests.md` is not on S4's line (S7 closes those docs); the model-arms docs above are | plan text (*Files*) | this revision |
| Q6 | `TempFolder.Dispose` no longer throws on a failed removal; the end-of-run audit names the folder | brief-level: rule §2 ("never throws") decides it | the detail § 2 |
| Q7 | `PosixFolderIsolationTests.cs:321`: `OwnedDir.Create("drvfs", scratch)` in a validated scratch folder BELOW the operator's 9p mount (its check at `:317-319` widened from "the variable IS the mount point" to "the folder exists, holds nothing at the start but owner-form entries of this repository and their claim files (what a killed run of this test leaves, which the start sweep then judges by rule §3/§4; anything else refuses, so nothing foreign is ever touched; CodeRabbit on #176), and the longest mount point above it in `/proc/mounts` is `9p`"; every write confined to that folder: the third gate round, finding 1), and the test first runs `LeftoversSweep.Run` over that same parent (the caller's scope, the two keys of rule §4), so a folder a killed run left there is collected by the next run of the test. On drvfs every file reads as uid 1000 (`/proc/mounts`: `uid=1000,gid=1000`), so the "kernel owner is the caller" key is always true there: the record (its owner, host, pid and start) is the only real evidence. **S4's merge condition** (the second gate round, G2): the killed-run → next-sweep check passes on the real 9p mount, OR the owner approves an explicit exception (item 7). Not run here or in CI (the variable is unset): item 3.3, O-l. *Was:* a limit stated in the summary (never collected after a kill), which the independent review named an undeclared narrowing (S4 (b)); and, before the second gate round, "S4 records it as not proved on 9p" | plan text (the disposition and the merge condition), brief-level (the code) | S4's brief K2, Q7; the independent review, S4 (b); the second gate round, G2 |
| Q8 | the killed-child test sweeps the real temp root through the `Mine` seam restricted to its own folder and claim, and asserts that `Removed` holds exactly those two | brief-level | S4's brief K7, Q8 |

**4.3 Narrowed: yes** (the re-review consult `a6cfcc53`, its point 3; the question consult `120652b8`, two of two).
The Definition of Done's first item ("Every consumer's tests, scripts and CI create only `testsToDelete-…` resources (or a
documented exemption)"), read at `105d53c` (§ *Definition of Done*), allows the owner form, or an exemption that is the
inline form of rule §7, or, for E5 only and until its drain, an entry of the `raw-temp` baseline. Row E6-l's retained
pilot output is none of these: it is unprefixed by design and no inline marker carries it. So, in the form epoch 5 used
for E5's native measurement series (§ *Epoch 5* item 6, "ONE further documented exemption"; recorded `Narrowed: yes` in
the record for epoch 5), the list is read with this line, and the list itself is not edited:

**Definition of Done, read for epoch 11** (2026-11-17; the list above is not edited; this line is read with it): item 1
("Every consumer's tests, scripts and CI create only `testsToDelete-…` resources (or a documented exemption)") has ONE
further documented exemption, for E6 only: the output of the two attended-pilot scaffolds
`tests/Bench.Tests/ModelArms/M2PilotScaffold.cs` and `tests/Bench.Tests/ModelArms/M3PilotScaffold.cs`, each
`[Fact(Explicit = true)]` and never run by the suite. That output is made ONLY under the folder the REQUIRED variable
`BENCH_PILOT_OUT` names, resolved by ONE function, `tests/Bench.Tests/ModelArms/PilotOut.cs`, which refuses a value that
is unset, empty, relative, not an existing folder, at or under the temp root, or inside a git checkout; it is never in the
temp root; it is the unprefixed children `bench-m2-<what>-<id>`, `bench-m2-manifest-<id>.json`, `bench-m3-<what>-<id>` and
`bench-m3-manifest-<id>.json`, each scaffold writing its manifest first, naming every exact path before it exists, so an
interrupted pilot's output is always named by a record; no sweep collects it; it is removed only by the pilot's own named
operator step (M2: its manifest's paths, by exact path, the manifest last; M3: its manifest's teardown, T1–T5). Its bound is CHECKED on every suite run: each refusal is an ordinary `[Fact]` of
`PilotOutTests`, and the two scaffolds take their folder only from `PilotOut.Required()`. It is LISTED in E6's stories'
§ 11, which names the two files, the resolver and their output. That no other test, script or CI step of any consumer
uses it is a review item of each PR, not a check. A retained store corpus for E7 is NOT covered by it (item 4.4 point 1).
Nothing else of the list changes.

Why `yes` and the owner: the line accepts resources outside the owner form that no sweep will ever collect, which the
goal's promise for every resource a run creates (owned, claimed, collected after a kill) does not give them; that is
smaller, however bounded. The epoch 11 line, when written, says `by owner`: the owner approves the revised plan, with
this line, before epoch 11 opens (`common/plan-change-control.md`, step 8).

**E7's retained corpus: not allowed by this revision** (chosen from rag_qln's E7 text at `48cbf896`). § *The cornerstone*
item 6 leaves "reused or fresh per run" to S2's Fable spec, which is not written; S2's plan gate already waits for the
owner's observations, and the kept corpus's size and growth are row E7-f's, which is **blocked**; so its bound (which
stores, which names, its number, its retirement) cannot be written now without guessing. The plan's E7 goal (§ *E7 —
rag_qln*, *Goal*) already frames the live tests' deliberate reuse only as "exempt under decision 2a (named where
configured, reset serialized)", which covers its RESETS, not resources created outside the family. So if S2's spec keeps a
corpus across runs, E7's amendment brings that as a SECOND documented exemption to the owner, bounded the same way, before
S2's plan gate; until then none exists.

The rest of this revision widens: S4 gains a disposition and a row (E6-l); row E6-i reads both guards with counts; S5,
S6 and S7 gain named *Files* lines, both guards and counts (S6's scope widens by 14 C# findings); D6 and shape G are
bounded so that nothing lands outside an owned folder by a path no guard reads (E11-3 was revised after O-a to keep the
working launches, item 3.3). The one sentence that could read as smaller is who lists the inline exemptions: the DoD said "the stories list" (`:609`), S5 said "the brief lists" (`:500-501`). One rule now:
the story's brief lists each exemption by file, line, class and reason before its plan gate, and the PR that adds it
copies the list into the stories' § 11, so at merge the stories list every one, as the DoD says; no exemption is allowed
that was not listed. Apart from the line above, nothing of the goal, the Definition of Done, the merge conditions or the
release is removed. **The epics do not change**: no Fable re-split; E6's and E7's stories are amended by Opus (item 5).

**4.4 E7.S2 — the amendment it needs** (a NEW rag_qln PR, by Opus, before S2's plan gate; not written by this revision):

1. § *The cornerstone* item 1 (the frame) and item 6 (the fixed ids): every store resource the live suite makes is one of
   THREE: run-owned (the owner form `teststodelete_<owner>_qln_<what>_<id>`, dropped by the run, collected when abandoned);
   a shared store under exemption (a); or, when the spec keeps a corpus across runs for the incremental path, a RETAINED,
   operator-named resource outside the testsToDelete family (named from a required variable, never the prefix, never
   collected by the test sweep, retired by a named operator step, with its number in § Growth). Entry 10.2's lesson, for
   collections. Such a retained corpus stays subject to exemption (a) wherever a test clears or resets it: the shared
   store is named where it is configured, the reuse is said to be intentional, and every reset is serialized by the
   enforced lock after `lock:` (rule §6 (a)) — the plan's E7 goal, "exempt under decision 2a (named where configured,
   reset serialized)", read with it (the re-review consult `a6cfcc53`, point 2). Its creation outside the family is a
   documented exemption of the Definition of Done's first item that this revision does NOT grant (item 4.3): the
   amendment brings it to the owner, bounded as row E6-l's is, before S2's plan gate.
2. A new item: the copied C# guard's word rule (E11-12), **observed** (item 3.3, O-d, and in rag_qln's own copy, O-k): a
   builder or a matcher that spells the prefix with no literal owner after it — concatenated, interpolated, in a
   `StartsWith`, split, or a bare `"teststodelete_"` (`AllowedAfterWord` wants `_<u|w><digits>_` after the word, rag_qln
   `tests/Rag.Tests/Leftovers/LeftoversGuard.cs:122` at `48cbf896`) — is one `owner-blind` in `src/`, in a test folder and
   in a new file of the helper's folder alike, and so is `Owned.Prefix` outside the helper's folder (`:28-31`, `:131`);
   `owner-blind` takes no exemption. So the product cannot spell, and cannot recognise, the prefix word. **Decided** (the
   independent Opus review, B2; the second plan-gate round `a209b8e4`, G1, settled by the question consultants `b4556ae1`,
   two of two, as option B; the reviewer's re-check, B2 (a)–(c)); every product line below **observed** clean in rag_qln's
   copy and not scanned by the Node guard (item 3.3, O-k, O-m):
   - **The configured prefix confers NO deletion authority.** The product never drops a collection by its prefix or by any
     match of its name. Its selector only LISTS. A drop needs the collection's claim record and abandonment positively
     established under rule §3/§4's two keys: the four ownership states and claim-before-create of § *The cornerstone*
     item 4. A missing, unreadable, foreign or live record — or one the sweep cannot judge — means NO drop. S2's criterion
     already says so ("No code path drops a collection on its name or age alone", E7 `:384` at `48cbf896`; the selector's
     own contract, `src/Rag.Application/Runtime/TestCorpusSweep.cs:7`, "a SELECTION, never an authorisation").
   - **Registration precedes creation**: the record is written before the collection exists, by the run that will create
     it, so an existing collection — an unrelated one included — can never be adopted by writing its name into a record;
     the record names only what its run then creates.
   - **The product's shape check** fixes the repository token and the owner segment: the configured value matches
     `^[a-z]+_[uw][0-9]{1,10}_qln\z` (letters, the owner grammar, the token `qln`; refused when empty or of any other
     shape). It carries NO trailing `_`: `CollectionNamespace.For` (`src/Rag.Domain/Corpus/CollectionNamespace.cs:31-32`)
     already composes `<prefix>_<32 hex>_<8 hex>` (plus `_<12 hex>` for a variant), so a configured `_` would make a double
     one. The product LISTS by `name.StartsWith(prefix + "_", StringComparison.Ordinal)` and parses NOTHING past the token
     (the detail's §1 forbids reading past the repository token); the tail and its separator stay the spec's naming
     decision, § *The cornerstone* item 5 (78 > 63 characters with the decided configured value, 84 for the longest Windows owner;
     *was:* 87, computed with `<what>_<id>` in the prefix). The shape check cannot tell the word from any other letters
     (`foo_u1000_qln` passes it): only the tests and the record check the word. The product's guarantee is therefore NOT
     "an unrelated prefix refuses" but "**no drop without a record**": `orders_u1000_prod`, `orders_u1000_qln`, an arbitrary
     submitted name, a record aimed at a pre-existing unrelated collection, and a collection replaced during clean-up each
     give ZERO drops, by runtime tests, RED first.
   - **The tests check ownership** through the helper: `Owned.NameBase` lowercased with `_` (and its trailing `_` trimmed)
     gives the run's configured prefix; `Owned.Classify(name) is NameForm.Owner { Token: "qln" }`, `Owned.Pattern()`,
     `Owned.FullName()`; all clean outside the helper's folder (O-k).
   - **Item 9's rename and the legacy listing.** The owner-scoped prefix is configuration (an options property, empty by
     default and refused while empty), set by the live suite from the helper; no `src` line spells the word. The
     `qlntest_` selector STAYS in `src/`, list-only, until item 9's reviewed inventory of the existing `qlntest_*`
     collections is done: today `TestCorpusPrefix.Value` (`src/Platform.Contracts/InfrastructureModels.cs:115`) is read for
     selection only by the sampler (`InfrastructureSampler`, through `TestCorpusSweep.cs:25`, `:33-37`, which only logs,
     case-insensitively); `Infrastructure.razor.cs:48` only prints it in one sentence of the page; the console lists every
     collection and tallies them by the prefix decoded from each name (`CollectionListing.cs:23-56`, `:67-81`), not by
     the constant (corrected 2026-11-17 from the code at `48cbf896` by E7's amendment; *was:* "is the only thing that lists
     them … and tallies them (`Rag.Ui`, …)"; the decision stands). It is guard-clean: `"qlntest_"` is not the prefix word (O-m).
   - Option A — the word written into `appsettings.json`, which the guard does not read — is REJECTED as guard evasion.
   - No template change and no re-sync: nothing here is a counted change. A design that must still spell the word in code
     stops S2's brief before its gate (a template change in mcp and a re-sync would be a counted change).
   Both guards are observed on S2's real lines before its plan gate (§ *Epoch 10* item 8.1). *Was (the independent
   review's fold, `dce2a5f`):* the product "checks only the SHAPE … owner-scoped by a fixed character class
   (`^[a-z]+_[uw][0-9]{1,10}_[a-z0-9]+_\z`) — and selects only names whose segments parse as
   `<word>_<owner>_<token>_<what>_<id>` …, so an empty, broader or unrelated prefix refuses with nothing dropped" — the
   class accepted an unrelated namespace (`orders_u1000_prod_`, G1), the segment parse read past the token and matched no
   name `For` composes (B2 (a)), the "refuses" overstated what a shape can decide (B2 (c)), and "`TestCorpusPrefix.Value`
   leaves `src/`" would have removed the only listing of the existing `qlntest_*` (B2 (b)). *Was (the plan gate
   `d8e14338`, G2):* "it must equal the one permitted test namespace exactly (`teststodelete_`) …".
3. Row E7-l and S2's *Done when*: the guards' results on S2's own lines named per guard, with counts (item 8.1 below).
4. S2's *Files*: named paths with the dependency that needs each, the plan records included (E11-10's rule).
5. The status line: S3–S5 merged as #125.
6. **Against § *The cornerstone* items 4, 7, 9, 10 and 11** (rag_qln `48cbf896`, read): item 4 (the four states, a record
   written BEFORE the collection, a two-run test) is where point 2's authority lives, unchanged; item 7 (one corpus, three
   stores) extends the record to the Postgres state and the graph the drop would touch, so a drop of one collection never
   removes what another live record names; item 9's mechanical scan keeps the `qlntest_` selector as a listed keep until
   its inventory, and the new prefix enters as configuration (point 2); item 10's start-of-run collection sweep is the
   record-driven drop of point 2, never a prefix sweep; item 11's other drop paths (the console delete, the eviction) take
   the same rule: no drop of a test collection without a record and established abandonment. E7's amendment carries
   point 2 whole (no deletion authority from the prefix; the selector lists; registration before creation; the fixed-token
   and owner shape without a trailing `_`; no parse past the token; the legacy `qlntest_` selector until the inventory; the
   five zero-drop runtime tests, RED first; option A rejected) into items 1, 4, 9, 10 and 11 and row E7-l.

**4.5 The `/tmp/.git` finding — a benchmark todo, not built in S4.** `RootFacts.GitTopOf`
(`tools/model-arms/ModelArms/Adapters/RootFacts.cs:19-23`) takes the nearest ancestor-or-self holding a `.git` file or
folder, so ONE `/tmp/.git` makes every experiment root and scout root under `/tmp` refuse as "inside the git checkout
/tmp" (`ExperimentFile.cs:70`, `ScoutRoots.cs:67`, `ProbeRoots.cs:41`, `FileSystemGateArtifactStore.cs:45`), as F42-c's two
whole-suite runs met (`research/PLAN_test_leftovers_E6_F42c_brief.md:749-750` **[D]**). Checked by S4's brief § 12, read at
`b348bb33`: every `git init` argv (40 sites), every `.git` written by hand (15), the temp root as a working directory,
the spikes' Node tests: no cause in benchmark. Not checked: other repositories' tests and other processes on this shared
machine; when the entry appeared. S4 does not change the exposure (its owned folders are in the same `/tmp`). The todo,
for benchmark (recorded in E6's stories § 12 by the amendment, outside S4–S7): name a `<temp root>/.git` loudly at the
start-of-run sweep instead of letting each test refuse, or run the suite under a run-scoped temp root outside `/tmp`;
and find the creator on the machine. Not a prerequisite of any story.

### 5. Build order

```
DONE   epoch 10 approved (#173) → E6's stories amended (#217) and E7's (#122) → F42-c (#218, `5070beda`) → rag_qln's
       benchmark pin (#123) → entry 10.1 and the progress record (#174) → E7.S3–S5 (#125) → E6.S3 (#219, `b348bb33`)
       → rag_qln's benchmark pin (#127) → S4's brief (local, entry 10.2) → the stop (#175, `62f9ae5d`) → this revision.
       (Merge order, read from each PR's `mergedAt`.)
DONE   … → the Opus judge sorted epoch 10's work (`a637c87`) → the plan gate on the operative extract (`d8e14338`,
       `proceed`, three findings accepted, `634905b`) → an independent Opus review, its findings folded (item 3.4).
       → the second plan-gate round (`a209b8e4`, `proceed`, G1–G3 accepted).
DONE   the owner approved (Narrowed: yes, item 4.3) and answered item 7's 9p question ((1), once), 2026-11-17 → epoch 11
       opened `by owner`, at 0 changes.
THEN   benchmark   E6's stories amendment (prepared on `docs/e6-stories-epoch-11`, a NEW PR) → S4's brief revised by new
                   commits on `feat/e6-s4-modelarms` (K5 as row E6-l; § 0.1 as item 4.2's *Files*; § 9 as its *Done
                   when*; § 14 answered; item 3.3's O-b quoted) → S4's plan gate → S4.
                   S5 and S6 briefs, with item 3.3's O-a and O-c as inputs, and S6's sandbox for Python named (O-e) (at most three open PRs, the
                   owner's allowance for E6 PRs over the cap); S7 after S4–S6 and the followups plan's S1 and S2 (D7).
       rag_qln     E7's stories amendment (item 4.4) → S2's Fable spec → the owner's observations → S2's plan gate.
LAST   the feature reviews (§ *Epoch 8* item 5); the promotion of this plan and its stories documents; R6 ticked in
       the remainder plan.
```

### 6. What the consultants raised, and what was done with it

| Point | Checked | Done |
|---|---|---|
| `33aa7f43`: a third disposition for the pilot scaffolds is a change of the story's approach | true: S4's *What* names two and neither fits (item 1) | entry 10.2, the stop |
| `1f60c647` (1): the retained output goes to an operator-named folder from a REQUIRED variable, refused without it with a message naming the variable, never the temp root | the precedent `BENCH_ARTIFACT_ROOT` (`ProbesInputs.cs:75-78`, `:97`) refuses the same way | row E6-l; item 4.2 |
| (2): children unprefixed `bench-m2-<what>-<id>`, `bench-m3-<what>-<id>` | no sweep matches an unprefixed name (D11; rule §1) | row E6-l |
| (3): M2's probe (`:72-78`) has test lifetime → the helper | it is removed in `finally` today (`M2PilotScaffold.cs:118-124`), and M3 calls it too (`M3PilotScaffold.cs:54`) | item 4.2's first row |
| (4): expected zero `raw-temp`, `legacy-name`, `owner-blind` in both guards on those lines, no marker | the Node half run (row E6-l, **[M]**); the C# half read (**[R]**) | row E6-l (3), observed before S4's gate |
| (5): a rename under `Path.GetTempPath()` is still `raw-temp` in both guards | the Node control run (**[M]**); C# `LeftoversGuard.cs:75` | row E6-l's controls |
| (6): `TempDir.Root` is clean only because the guards do not trace callers; never for retained output | S4's brief O6 **[D]** | E11-4; item 4.2 |
| (7): the docs that print the old paths and the teardown steps are updated, historical observed paths kept; that puts named `research/*.md` files on S4's *Files* | the `git grep` of E11-2 **[M]**: three files print them; `module_tests.md` and `PLAN_model_arms.md` do not | item 4.2's *Files* |
| `a6cfcc53` (re-review, step 3) (1): the repeated stops come from feasibility claims left to the next brief; observe each one already identified BEFORE the epoch opens, and write what cannot be observed as blocked with the story's stop condition | true for epochs 9 and 10: each stop was found by the brief that first ran its claim (entries 9.1, 9.2, 10.1, 10.2) | item 3.3 (O-a to O-f, run 2026-11-17); item 8.1; item 8.2. O-a changed E11-3 (item 3.3) |
| (2): E7's retained corpus stays under exemption (a) wherever a test clears or resets it | the plan's E7 goal says the same of "deliberate reuse" ("named where configured, reset serialized") | item 4.4 point 1 |
| (3): the Definition of Done's first item does not admit row E6-l's output; a bounded, dated reading as epoch 5's; `Narrowed: yes` | true: the read-at note allows only the owner form, a rule §7 inline exemption or E5's baseline; settled by the question consult `120652b8` (two of two) | item 4.3; the record's Narrowed line; the epoch 11 line `by owner` |

Added by this revision beyond the consultants: E11-3 to E11-12 (item 3.2), the lifetime table (item 4.2), the
exemption-list rule (item 4.3) and E7's amendment (item 4.4). Rejected: nothing.

### 7. Questions for the owner

**For the approval (the record says `Narrowed: yes`):** the owner approves the revised plan with item 4.3's *Definition of
Done, read for epoch 11* — ONE further documented exemption, for E6's two pilot scaffolds' operator-retained output, and
none for an E7 corpus (recommended: approve as written). Still open, as § *Epoch 9* item 7: the live-store observations of rows E7-b
(branch 2), E7-c and E7-f; until then E7.S2 does not go to its plan gate. The PR cap is settled for both amendments and
for E6's stories (§ *Epoch 10* item 7: the owner's "Yes, every E6 PR" and "Yes, for all E7 PRs"). For the owner's next
attended pilot (not a question): M2 and M3 now need `BENCH_PILOT_OUT` set to a folder outside every git checkout (and
outside `/tmp`, which a WSL restart empties); `research/module_model_arms.md` says so after S4.

**Owner questions (the second gate round, G2; worded to agree with O-l after the third gate round):** (1) may I run it once
with `MODEL_ARMS_DRVFS_SCRATCH` = a new empty folder under `/mnt/c/Users/<owner>/AppData/Local/Temp/`, removed by exact
path after? ("It" is S4's killed-run → next-sweep check of `PosixFolderIsolationTests`' 9p site, which writes only inside
that folder.)
(2) If not, does the owner approve an explicit exception: S4 merges with the 9p collection unproved, the start-of-test
sweep in place and its limit stated? S4 does not merge until one of the two is answered (recommended: (1), once).
**Answered** by the owner, 2026-11-17: (1), once.

### 8. The way of working — so an eleventh stop is less likely

**8.1 What changes.** § *Epoch 10* item 8.1 stands as written (a claim about a copied tool is observed before the gate of
the story or brief that relies on it, its six things named). Added, as criteria of the existing stories and brief gates:

- **Every site a story disposes of is classified by LIFETIME before its plan gate** (item 4.2's table: the run; inside an
  owned folder; a name never made or a path only read; must outlive the run; a test about the old name). A site that
  fits no class STOPS before the gate, and the stories name the class's ONE disposition. Output that must outlive the run
  never takes the prefix and never defaults to the temp root.
- **Expected guard results name BOTH guards and give a count per class**, before and after, at a named base; a guard
  that does not read a file kind is named as such (the read matrix), never assumed.
- **Shape G (`TempDir.Root`, or any path built on it) only for a path nothing creates or keeps** (E11-4).
- **Every story's *Files* line names its plan records and the docs that describe what it changes**, found by a `git
  grep` of the old spellings over `*.md` at the brief's base, each doc line with what it says now; an IMPLEMENTED plan
  gets a dated note beside the old text, never a rewrite of it.
- **The inline exemptions are listed by the brief** (file, line, class, reason) and copied into the stories by the PR
  (item 4.3).
- **From this epoch on, every feasibility claim a remaining story relies on is observed DURING the re-review, before the
  epoch opens** (the re-review consult `a6cfcc53`), in § *Epoch 10* item 8.1's six things (consumer SHA, upstream pin,
  invocation, fixture path, expected, observed), in a scratch copy, never by product edits; what cannot be observed there
  is written **blocked**, with the story's stop condition named. A story brief still re-runs a claim when one of its
  inputs changed, but it no longer makes the first observation of one the plan relies on. Item 3.3 is this rule's first
  run.

**8.2 The surprises still likely.**

| Story | What it is likely to meet | Why |
|---|---|---|
| S4 | the killed-child test on a loaded host; the 9p site (item 3.3, O-l, **blocked** on the owner's variable; S4's merge condition: the check on the real mount or the owner's exception, item 7); M2's new manifest and the killed-after-first-child test of each scaffold, M2 and M3 (G3 and the third gate round, **proposed**). (The C# half of row E6-l (3), O-b, the resolver and its facts, O-i, and both scaffolds end to end, O-j, are **observed**) | a SIGKILL timing; the variable is the operator's |
| S5 | more C#-only literals once the 72 sites are rewritten; the Docker-bound launchers of both fakes (O-g, O-h: **blocked** here, run by S5's PR on `build-test`). (The probe path and the model id, O-a, the fake coai's data folder, O-g, the fake CLI's never-made home and its lines, O-h, and every shape-G callee, O-c, are **observed**) | the lists are of today's lines; Docker is CI's |
| S6 | the `lang-bench` suite run against this machine's rule for Python (O-e, widened, **blocked**: S6 stops before its gate unless its brief names the sandbox, with `BENCH_REQUIRE_SANDBOX=1` and `LANG_V2_TASK_REPO`); run-time owner segments red in both guards (E11-7); its size (99 findings, 39 files) may need a commit series per folder | the machine's rule; F30's limits; counted here |
| S7 | the followups plan's S1 and S2 not merged (D7; O-f, **blocked**, D7's own stop); claims C3–C5 and C10's "with" half | that plan has no date; those claims are plants of S7's own operation (the "with" half is its PR's RED → GREEN), observed by S7's brief as § *Epoch 10* item 8.1 allows |
| E7.S2 | a spec that must spell the prefix in code (O-d, O-k: **observed** red, no exemption; S2 stops before its gate if it needs one; the decided spelling, item 4.4 point 2, is clean); a reused corpus (item 4.4 point 1: not allowed until the owner approves it) | the spec's choice |

*Found on the way* (2026-11-17, carried, not built): the copied C# guard reads a piece of the prefix word inside an
unrelated identifier in a literal (`ProbeCellReportDto.LatestState` holds `testSt`, `owner-blind`, which takes no
exemption; `Probes/ProbeContractsGuardTests.cs:19`): a limit of the template's `PrefixPieces` (five characters or more,
case-insensitive), for the follow-ups plan's next record, beside F44; S5 rewrites its one line (E11-5).

**8.3 What the other documents' own revisions must say.**

- **Benchmark's E6 stories, a NEW PR, before S4's plan gate** (prepared, local, `docs/e6-stories-epoch-11` from
  `b348bb33`): S4 as item 4.2 (*What*, *Files*, *Done when*); rows E6-i (restated) and E6-l (new); D6 as E11-3; S5 as
  E11-4, E11-5; S6 as E11-6 to E11-8; S7 as E11-9; the plan-records line (E11-10); claims C6, C8 and C10 as E11-6 and
  E11-11; the exemption-list rule in S5 and § 11 (item 4.3); the `/tmp/.git` todo in § 12 (item 4.5); the status line. And,
  after the re-review consult: item 3.3's observations where they fall (D6 three-way after O-a; row E6-l's C# half, O-b;
  S5's shape-G list, O-c; S6's Python stop, O-e) and § 11's list of the ONE documented exemption of item 4.3 (prepared,
  local, a second commit on the same branch).
- **S4's brief (local, `feat/e6-s4-modelarms`), new commits, never a rewrite:** K5 as row E6-l; § 0.1's `PosixFolderIsolationTests.cs` row widened to `:317-321` and the start-of-test sweep (Q7); § 0.1 as item 4.2's
  *Files*; § 9 as its *Done when*; § 14's answers as item 4.2's table; the C# half of row E6-l (3) observed (§ 11).
- **Rag_qln's E7 stories, a NEW PR, before E7.S2's plan gate:** item 4.4.
- The follow-ups plan: the *Found on the way* note above, at its next record.

**8.4 Run for this revision.** `node tools/plan-lifecycle.mjs` at this branch; the copied C# repository guard test
(`--explicit only --filter-class "*LeftoversRepositoryGuardTests"`, the existing build in `wt/bench-e6s3`, tree =
`b348bb33`): 173 findings over the tree, listed by file, line and class; the Node guard (`--profile node --token bench
--identity "the measuring harness"`) in the same worktree: 209; `comm` of the two lists under `tests/` (the C#-only and
Node-only lines of E11-5); `scanText` of the planned scaffold lines and controls (row E6-l); `git grep` of the old pilot
and kept-reader spellings over `*.md` (E11-2), of `sweepLeftovers` over `spikes/` (E11-8), of `FakeHome`/`bench-fake-cli`
(E11-3); `gh pr list --state merged` in conventions, benchmark, rag_qln and mcp since 2026-11-16 and the GitHub branch
list of benchmark (item 1). After the re-review consult: item 3.3's scratch clone, four `nice`d builds of
`tests/Bench.Tests/Bench.Tests.csproj` one at a time and the scratch tests O-a, O-b, O-d; the reading of O-c. Not checked:
the consult texts (`1f60c647`, `33aa7f43`, `c3d71347`, `a6cfcc53`, `120652b8`; the points are taken as the coordinator
quoted them and checked against the files); C# verdicts on lines other than item 3.3's plants; anything with Docker;
Python (O-e); E2's held feature review; the merges outside the plan's repositories (the judge's).

## Epoch 12 — the plan as revised at the re-review (2026-11-17)

The whole plan read again, as step 4 of the full stop asks (`common/plan-change-control.md`), over the two entries of
epoch 11: 11.1, E6.S4's *Files* missed four doc lines its own grep finds (built with them, benchmark #221); 11.2, E6.S6
cannot change the lang-bench runner's two `mkdtemp(` lines (`spikes/lang-bench/runner/run_samples.py:35`, `:306`)
without re-pinning a tree the language-comparison plan owns (found by S6's brief, benchmark `feat/e6-s6-spikes`
`d836de52`, local, never pushed). The question consultants could not be asked for either (the day's cap was spent).
**The owner's decisions of 2026-11-17, in this session, cited and not re-decided:** 11.1 was counted; 11.2 was counted,
and its two lines go to the language-comparison plan; F45: six S5 doc lines stay as history (conventions #178);
`/usr/bin/python3` is allowed for S6's two whole-suite `spikes/lang-bench` runs only (base and head); the 9p run of
`PosixFolderIsolationTests` was allowed once, and it is done (#221). The re-review consult (step 3) is `59b325a3`
(codex), every change of the epoch quoted: (a) 11.2 is a narrowing, kept honest only by an explicit prerequisite on
S7; (b) a structural change against the recurring stop kind; (c) the known next blockers settled now. Each point was
checked against the files (item 6) and folded in items 1, 3, 4 and 8. This section is the baseline epoch 12 is approved
on. § *Epoch 11* stays as the plan for everything this section does not name, and the earlier sections under it.
Superseded by this section, read from here: § *Epoch 11* item 3.2's E11-9 counts (item 3.2, E12-3); and in E6's stories
(benchmark `todo/PLAN_test_leftovers_E6.md` at `a8106448`) D7 `:337-343` (S7's prerequisites), § 6's first paragraph
`:412-416` (the form of every story's *Files* and *Done when*), S6's *Files* `:697-705` and *Done when* `:706-709`,
S7's *Files* `:739-744` (its form) and *Done when* `:745-747` (its counts), § 11's exemption item `:814-826` (a reading
added under it) and § 12 item 1 `:848-849`; in E7's stories (rag_qln `todo/PLAN_test_leftovers_E7.md` at `cdc78d4c`)
the form of S2's *Files* `:505-547` and *Done when* `:565-578` (item 4.5).

**How to read the evidence.** **[M]**, **[D]**, **[R]** and the three states (**observed**, **proposed**, **blocked**)
as in § *Epoch 9* to § *Epoch 11*. Every **[M]** here was run for this revision on 2026-11-17, read-only: benchmark at
`a8106448` (its `main`, `git rev-parse origin/main` after a fetch; the base of S6's brief) with its mount `b1746499` in a
new worktree (`wt/bench-e6-amend12`), rag_qln at `cdc78d4c` (its `main`), conventions at `cb5a33a1` (#179's head), and
this machine's folders. No build, no C# run, no Docker, no Python ran for this revision. The C# counts are the S6 brief's
**[M]** (its § 11 O1, from the existing Release build of `wt/bench-e6s5`, tree equal to `a8106448`), cited **[D]**.

### 1. What this plan is now

**The root cause, checked (the re-review consult, point (b)).** The consult says the eleven stops came nearly all from
*Files* lines or *Done when* counts written as exact lines that the next brief found incomplete. Read here entry by entry
(§ *Plan changes*, 28 entries): NINE are a closed text the next brief found incomplete or unattainable — an exact matrix
or count (3.2; 11.2's "C# 14 → 0"), an exact scope or line set (5.3; 9.1's "no benchmark-own file changes"; 11.1; 11.2's
runner lines on S6's *Files*), a file outside a story's list (7.1), a closed list of dispositions or reasons (4.2, 6.1,
10.2); SIX are a claim about a copied tool's reach that a brief ran first (3.1, 5.2, 7.2, 8.2, 9.2, 10.1: the kind
§ *Epoch 10* item 8.1 now observes before the gate); the other thirteen are owner decisions, an order, a measured
environment or a code fact (1.1–1.7, 2.1, 2.2, 4.1, 5.1, 6.2, 8.1). In epochs 9 to 11, four of the six entries (9.1, 10.2,
11.1, 11.2) are of the closed-text kind. So the consult's "nearly all" holds for the last three epochs, not for the whole
ledger: the kind is real and recurring, and it is the one item 8.1 changes. **What the change can and cannot prevent,
said now so it is not overclaimed:** of the 28 entries, the new form would have kept ONE from counting (11.1: a doc line
that a grep at the story's base finds is in scope by definition). 9.1 and 11.2 still count (files outside the bounded
folders; a finding left standing), 4.2 and 10.2 still count (a disposition outside the decided classes), 3.2 still
counts (a merge condition made smaller). Its effect is forward: a line list, a line number or a count that moves at a
later base, and a site a list missed inside the story's folders, stop being causes of a stop; nothing that changes
scope, approach, a contract, the build order or a merge condition stops counting (item 8.1).

**State at the stop (read 2026-11-17).**

| Epic | State | Commits |
|---|---|---|
| E1, E3, E4 | DONE (wave 1) | as § *Epoch 8* |
| E2 (creds) | COMPLETE 2026-11-10. Its feature review is held by `call_human` since 2026-11-10 (not re-read) | as § *Epoch 10* |
| E5 (coai) | COMPLETE 2026-11-12 | as § *Epoch 10* |
| F41, F41-b, F42 | DONE | as § *Epoch 11* |
| E6 (benchmark) | stories amended to epoch 11 (#220); S4 merged (#221: `ModelArms/` on the owned folder, row E6-l, the pilots' output under `BENCH_PILOT_OUT`; entry 11.1's four doc lines; the owner's one 9p run); S5 merged (#223: the rest of `Bench.Tests`, the fakes, the seams; the stories' status says both guards clean in S5's area, Node 160 → 87, C# 91 → 16, one listed exemption **[D]**); S6 a brief only (`feat/e6-s6-spikes` `d836de52`, local, never pushed **[M]**), entry 11.2; S7 not started. `main` `a8106448` | #220 `c17903c1`, #221 `e967df53`, #223 `a8106448` |
| E7 (rag_qln) | stories amended to epoch 11 (#128); the benchmark pin at `a8106448` (#129–#131); S2 not started, its gate waits for the owner's observations (§ *Epoch 9* item 7). `main` `cdc78d4c`; since `48cbf896` only the stories, two READMEs, the S3–S5 brief's promotion and the gitlink changed (`git diff --stat 48cbf896 cdc78d4c`: five files **[M]**) | #128 `24b6ce88`, #129 `02475e3d`, #130 `4dfcadba`, #131 `cdc78d4c` |
| The stop | entries 11.1 (#177) and 11.2 (#179, `cb5a33a1`, open at this writing) | `488bdce2`, `cb5a33a1` |
| The feature reviews | not started | — |

**Goal.** Stands as § *Epoch 11* item 1 writes it, with its exceptions, word for word, with **one more bounded exception**
(the second plan-gate round, `a0abb03e`; the owner approves it with the Narrowed line): **a killed run's claimed fake homes under `~` (and `/var/tmp` decoys) are listed, not collected, until F1/S1's home sweep**. Exactly: the
folders E6.S6's tests claim outside the temp root — the fake operator homes under `os.homedir()`
(`spikes/minigit-bench/test/agent-box-fs.test.mjs:15`, `test/bwrap.test.mjs:116`) and the decoys under `/var/tmp`
(`test/agent-box.test.mjs:229`, `test/bwrap.test.mjs:184`) — are owner-form, claimed and removed on every exit path but
a kill; after a kill, no sweep and no janitor reads those roots (both read the temp root only: the start sweep's `tmp`,
`janitor.sh:129`), so they stay until the followups plan's S1 adds the home sweep (and, by the note of item 8.3, the
`/var/tmp` root) or a person removes them. "Listed" means: S6's runs list them by name before and after (row E6-m
(7)), and `research/module_tests.md`'s limits name them. Also so, and smaller: the two sockets under `/run/user/<uid>`
(`agent-box.test.mjs:200`, `bwrap.test.mjs:159`), names only, which a killed run leaves until the user's runtime folder
is cleared. Nothing else of any consumer may use this as a precedent without a new plan change. *Was:* "Nothing is
added to it."

**Definition of Done.** Stands word for word, with § *Epoch 8*'s reading and § *Epoch 11* item 4.3's. No further reading
of the list is added: what got smaller is ONE merge condition, S6's (item 4.6), and E6's own Definition of Done gets a
reading under its exemption item for the time between S6 and S7 (item 4.2, E12-10), which ends at S7.

**What is still open, read 2026-11-17** (the form of § *Epoch 11* item 1; rows not named here stand as written there).

| Item | State | Owner | Blocker |
|---|---|---|---|
| DoD 1: tests, scripts and CI create only owner-form resources or a documented exemption | open: E2, E5 complete; E6's S4 and S5 merged; E6's S6, S7 and E7.S2 remain | agent | E6's amendment for epoch 12, then S6, S7; E7.S2's gate (the owner's observations) |
| DoD 2: no container without `--rm` or an always-run cleanup | open: `http/README.md:32-33` is S7's; E7's live stores are S2's | agent | E6.S7; E7.S2 |
| DoD 3: a structural test per repository at zero | open: benchmark's switch-on is S7's, which waits for D7's S1 and S2 AND for the language-comparison plan's disposition of the two runner lines (item 4.1) | agent; that plan's owner for the disposition | O12-c, O12-d |
| DoD 7: every prep or rename story recorded its invocation inventory | open for E6 S6, S7 and E7.S2 (S4's and S5's briefs are merged with their PRs; not re-read here) | agent | those stories |
| Rows E6-i (S6's spike half), E6-g, E6-m (new) | **proposed** (S6, S7) | agent | E6's amendment, then each story |
| Rows E6-i (S4's and S5's halves), E6-k, E6-l | built by S4 (#221) and S5 (#223), CI green; the stories' state cells still read **proposed** at `a8106448`: a records update on the next stories progress line, from those PRs' bodies, not a new check | agent | — |
| Every other row of § *Epoch 11* item 1's table | as written there | as there | as there |

### 2. Prerequisites

1. **Nothing built is re-opened:** F41, F41-b, F42, F42-c; E6.S3 (#219), S4 (#221), S5 (#223); E7.S3–S5 (#125).
2. **E6's stories amendment for epoch 12 comes first**: a NEW benchmark PR by Opus (prepared, local:
   `docs/e6-stories-epoch-12` `405dd714`, `06225b48`, `7dcdffd9`, `bd3ce7ba`, `743e3392` in `wt/bench-e6-amend12`, from `a8106448`), merged before S6's brief goes to its plan
   gate. It writes items 4.1 to 4.3 and 8.1 into D7, § 6's first paragraph, S6, S7, § 11 and § 12.
3. **S6's brief is revised by NEW commits on `feat/e6-s6-spikes`**, never a rewrite: § 0.1 and § 9 as item 4.2; § 13
   S-1 and S-2 and § 14 Q1 to Q3 answered by items 4.1 to 4.3; § 7 and K13 extended by the owner's answer to item 7's
   question (a).
4. **The owner's answer to item 7's question (a)** (the system interpreter for the minigit-bench and lang-explore
   whole-suite runs), before S6's plan gate.
5. **E7's stories amendment for epoch 12** (item 4.5), a NEW rag_qln PR by Opus, before E7.S2's plan gate; not written by
   this revision. S2's gate waits for the owner's observations anyway, so this adds no wait.
6. Not prerequisites: F43, F44, F46; the `/tmp/.git` todo (§ *Epoch 11* item 4.5); the notes of item 8.3.

### 3. Merge conditions — the rows this revision adds or restates

Every other row of § *Epoch 11* item 3, of the earlier sections and of E6's and E7's stories stands, word for word; a
row restated here keeps every check its earlier text had and adds to it, except the one narrowing item 4.6 names.

#### 3.1 The rows

| # | Condition | Implementation | Executable check | Does not prove | State |
|---|---|---|---|---|---|
| E6-i | restated, S6's half (`spikes/`): no test helper makes a LEGACY name, and no raw temp or bare-prefix reader stands unexplained, read by BOTH guards | the shipped Node helper (`ownedFor({ token: 'bench' })`) per test file; the `.py` sites inside the owned `TMPDIR` their launcher gives (S6's brief K10); S6's brief § 3a's two listed inline exemptions | both guards over S6's head, every finding in `spikes/` listed by file, line and class; ZERO unexplained: each finding is absent, cleared by a listed rule §7 marker, or on the approved standing list, which holds exactly `spikes/lang-bench/runner/run_samples.py:35` and `:306` (C# `raw-temp`, entry 11.2). *Observations, not scope* (item 8.1): at `a8106448` the Node guard reads 87, of them 85 in `spikes/` (46 `raw-temp`, 31 `legacy-name`, 8 `owner-blind`) **[M]**, and its default profile 3 **[M]**; the C# copy 16, of them 14 in `spikes/` (10 `raw-temp`, 3 `legacy-name`, 1 `owner-blind`) **[D]** S6's brief O1; expected at the head: Node 2 (the two D8 lines), default 2, C# 4 (D8's two and the runner's two) | that a path read through `tempRoot()` is never created (guards read spellings, not data flow) | **proposed** |
| E6-m | new: S6's suite evidence, bounded by the independent review (B1). **The approved standing failures are exactly: (1) policy-ab-quick's three named; (2) the base lists confirmed by the owner, within the caps** | the four spike suites as `research/module_tests.md` runs them, WHOLE, at S6's base and head (two runs each; item 7 question (a)); per commit of S6's series only the files that start no interpreter (S-3); every whole run under its own owned, empty `TMPDIR`: a folder the shipped helper claims under the temp root `/tmp`, never under `$HOME`, because the boxes hide the operator's home and `/tmp` (`spikes/minigit-bench/lib/bwrap.mjs:24-25`) and `test/agent-box.test.mjs:226-240` compares against `os.tmpdir()` — or S6's brief shows at its base that one such box test file gives the same result with and without that folder (S-1) | (1) policy-ab-quick: the three by name (`review2.test.mjs` "a runs root must be at least two folders deep" and "shedding a real directory still works, and refuses a shallow root outright", `review4.test.mjs` "a report whose every cell is void never overwrites the results file; it goes to the runs root"; S6's brief O10 **[D]**), each failing at the same assertion. (2) `lang-explore`, `lang-bench`, `minigit-bench`: before S6's plan gate its brief names the base run's failures test by test (file, test, assertion, `/proc/loadavg`); the owner confirms that list in one line, which is inside this approved bound and not a change; S6's PR copies it into the stories' § 11. Caps, from benchmark #222's PR body, which records on `main` before this work `spikes/lang-explore/test` 10 of 991 and `spikes/lang-bench/test` 1 of 2394 failing, "the host's sandbox and box tests, the rehearsal runs, one priority test" **[D]**: `lang-explore` ≤ 10, `lang-bench` ≤ 1, `minigit-bench` 0 (#222 records no minigit run; a failure its base run names is listed and confirmed the same way, or the brief stops). A base list over its cap, or a failure outside those classes, stops S6's brief before its plan gate: approving it would be a counted change (item 8.1, kind 6). Each listed failure fails the same way at the head. For an approved failure in a file S6 changes (`agent-box*.test.mjs`, `bwrap.test.mjs`, the exec-layer and probe tests), the brief states whether the failing assertion runs before or after S6's changed line (S-1). (3) Both runs complete (the plan gate's G1): each runs to its end and prints its totals; a cut or hung run is no evidence. (4) Executed and skipped tests reconciled BY NAME (G1): a test missing at the head without a reason S6's diff gives (a test S6 renames or removes, named in the PR), or a test skipped at the head that ran at the base, stops S6 before its merge. (5) A failure at the head not on the confirmed list is RED, S6's to fix before its merge — a test of the followups plan's S5 timing list included: the list approves nothing; the failure is recorded on that list by a dated line with `/proc/loadavg`, as its rule says (`todo/PLAN_bench_test_leftovers_followups.md:126`: "no re-run of a test or a file replaces it … never a way past a red run"), and the owner decides on ONE repeat run; S6 re-runs nothing on its own. (6) The owned `TMPDIR` is empty after each run EXCEPT the entries F2's named makers write (`spikes/minigit-bench/test/helpers.mjs:42` `tmpDir`, `test/fake-home.mjs:15`, both into `os.tmpdir()`, both excluded from S6 by name; B2): listed by name at base and head, equal in kind, removed by exact path afterwards; K9's start sweep only lists them (they carry no claim, so the shipped sweep keeps them as `legacy`: the mount's `tools/lib/leftovers-sweep.mjs:357-360` at `b1746499` **[R]**). (7) The roots outside the temp root (the second plan-gate round, `a0abb03e`): before and after each whole run, `ls -d` by name of `~/testsToDelete-*-bench-*`, `/var/tmp/testsToDelete-*-bench-*` and `/run/user/<uid>/testsToDelete-*`; equal at base and head, and any entry a run adds is named on the PR and removed by exact path (the goal's bounded exception: listed, not collected, until F1/S1's home sweep). Not run for this revision (the owner's allowance covers S6's own runs only) | that the approved failures pass anywhere (the three are Windows-path cases on Linux, the minigit stack bench's; the others are the host's); for an approved failure in a file S6 changes, anything past its failing assertion when that assertion runs before S6's changed line (the brief says which) | **approved** by the owner, 2026-11-17 (item 7 question 1); the system interpreter for two of the suites: question (a), answered yes the same day. *Was:* "**proposed**; … item 7's question (a)." *Was (after the judge, `7254d77`, and the plan gate, `7c22aa1`):* the base failures "in the classes … or on the followups plan's S5 timing list", no cap and no owner confirmation; a timing-list test failing at the head "goes by the S5 list's rule — … that ONE file re-run alone …" (the gate's G3 fold, withdrawn by B1); "every whole run … under its own owned, empty `TMPDIR`, empty after the run" (B2). *Was (before the judge):* "`minigit-bench`, `lang-explore` and `lang-bench` green … any other failure stops S6 before its merge" |
| E6-g | restated, S7's starting counts and its merge (corrects E11-9) | as the stories' S7 | S7 starts from (expected, projected from S6's brief § 6 at `a8106448`): the Node guard 2 (`--profile node`) and 2 (default profile), the two D8 lines, `raw-worktree`; the C# copy **4**: the same two, and `run_samples.py:35`, `:306` (`raw-temp`). After S7: Node 0, default 0; the C# copy 2 until the language-comparison plan's disposition of the two lines is on benchmark `main`, then 0. S7 switches the C# repository test on (`FilesScanned > 0`, no finding), so **S7 merges only after that disposition, with the repository guard clean on those lines**, and after D7's S1 and S2 | — | **proposed**; **blocked** on that plan (O12-c) and on D7 (O12-d) |

#### 3.2 The stories texts that would stop the next briefs — read now, each with a state

Found by reading E6's D7, § 6, S6, S7, § 11 and § 12 at `a8106448`, S6's brief `d836de52` whole (§ 13 and § 14 among
it), E7's S2 at `cdc78d4c`, and the code each sentence names.

| # | The text, where | Checked here | What changes, and its state |
|---|---|---|---|
| E12-1 | E6 S6 *Files* `:697-705` names `spikes/lang-bench/runner/run_samples.py` | entry 11.2: any byte of `runner/` reds `test/runner-pin.test.mjs:103` (S6's brief O4 **[D]**; the test read **[R]**) | item 4.2: S6's *Files* are bounded folders that exclude `runner/`, every `lib/` and `inputs/` by name. **proposed** (E6's amendment) |
| E12-2 | E6 S6 *Done when* `:706-709`: "the C# guard 14 → 0" and "the suites … green" | entry 11.2; S6's brief O10 and Q3 (three base failures in policy-ab-quick) | item 4.1, item 4.3 (Q3), row E6-m; the narrowing of item 4.6. **proposed** |
| E12-3 | § *Epoch 11* E11-9 (`:3760` before this revision) and E6 S7 *Done when* `:745-747`: "the C# guard 2 … the two D8 lines" | after S6 the C# copy also holds the two runner lines (S6's brief § 6: head 4 **[D]**) | row E6-g restated: C# 4 at S7's start; 0 only after the language-comparison plan's disposition. **proposed** |
| E12-4 | E6 D7 `:337-343`: S7 waits only for the followups plan's S1 and S2 | entry 11.2 | D7 gains the second prerequisite (item 4.1). **proposed** |
| E12-5 | S6's brief § 7 and § 9: the `minigit-bench` and `lang-explore` suites run with no word on Python | both run `/usr/bin/python3` **[R]**: minigit's held-out runner (`spikes/minigit-bench/lib/heldout-run.mjs:19`, `:121`), reached by `test/heldout-run.test.mjs:199`, `:262` and `test/heldout-hostile.test.mjs:28`, `:148`; lang-explore's judge and parser (`spikes/lang-explore/lib/score.mjs:71`, `:75`; `lib/heldout-quick.mjs:173-174`) and its tests (`test/judge.test.mjs:91`, `:101`, `:146`, `:156`, `:165`; `test/olympiad-calibrate.test.mjs:290`, `:302`); the owner's allowance names lang-bench's two runs only. *Wording corrected after the independent review (N-1):* `test/judge.test.mjs:91` and `:101` give `/usr/bin/python3` by its absolute path inside a judged command, `:146`, `:156`, `:165` spawn `python3` through `PATH`; minigit's `heldout-run.mjs:19` and lang-explore's `score.mjs:71`, `heldout-quick.mjs:173` name `/usr/bin/python3` | item 7's question (a), before S6's plan gate. **answered** by the owner, 2026-11-17 (item 7 (a): yes, two runs each). *Was:* "**blocked** on the owner (O12-e)" |
| E12-6 | S6's brief § 13 S-2: `todo/PLAN_minigit_stack_bench_E2.md:89` ("Leftovers a test creates on disk keep E1's `testsToDelete-mgb-…` names (the pinned rule's form — §2: the release has no owner segment)") | read at `a8106448` **[M]**: that plan is open ("in progress — E2.S3 and E2.S4 open"), has no ledger (no `## Plan changes` in it or in `PLAN_minigit_stack_bench.md`); S6 makes the sentence false for the tests it converts | item 4.3: on S6's docs scope, a dated note beside the line, the old text kept. **proposed** |
| E12-7 | S6's brief § 14 Q3: "suites green" read as "the same FAILED list" | the three cases test functions of `spikes/policy-ab-quick/lib/` (`safe-rm.mjs:7`, `:11`; `shed.mjs:7`; `reportTarget`) with Windows drive paths (`D:/…`) **[R]**: outside S6's folders, and named "its four pre-existing Linux failures (§2) are not this epic's unless a story touches the module under test" by the minigit stack bench (`PLAN_minigit_stack_bench_E2.md:86-88`; S6 touches the test files, not the `lib/` modules under test) | item 4.3: not fixed in S6; part of the narrowing (item 4.6), bounded to the three named cases; row E6-m. **proposed** |
| E12-8 | every remaining story's *Files* as an exact line list and its *Done when* as exact counts | item 1's root cause | item 8.1's form, written into E6's S6, S7 (E6's amendment) and E7's S2 (E7's amendment). **proposed** |
| E12-9 | E7 S2 *Files* `:505-547`: "a path outside this list that S2's checks need … goes to the parent first (in doubt, a change of the parent)" | the closed-list kind, before a Fable spec that has not decided its files | item 4.5. **proposed** (E7's amendment) |
| E12-10 | E6 § 11's item "No `raw-temp` … finding in either guard except the inline exemptions the stories list" (`:814`) | between S6 and S7 two findings stand that are not exemptions | a reading under the item (item 4.2): the approved standing list, its two lines, ending at S7. **proposed** |

#### 3.3 The feasibility claims, observed during the re-review (before epoch 12 opens)

As § *Epoch 11* item 3.3 and item 8.1: each claim S6, S7 and E7.S2 rely on that was not yet observed, in the six things
where a run applies; what cannot be observed here is **blocked**, with the story's stop condition.

| # | Claim (where) | Consumer SHA · upstream pin | Invocation | Fixture path, plant | Expected | Observed | State |
|---|---|---|---|---|---|---|---|
| O12-a | S6's base and the stories' spike counts hold on `main` | benchmark `a8106448` · mount `b1746499` | `git fetch`; `git rev-parse origin/main`; `node .agents/conventions/tools/leftovers-check.mjs --repo . --profile node --token bench --identity "the measuring harness"`, and the same without `--profile` | the new worktree `wt/bench-e6-amend12` | `main` = S6's base; Node 87 (85 in `spikes/`), default 3 | `origin/main` = `a8106448`; Node 87: `research/local-model-coding/harness/part6/t-lib.sh:12`, `t-lib.sh:20` (`raw-worktree`) and 85 in `spikes/` (46 `raw-temp`, 31 `legacy-name`, 8 `owner-blind`); default profile 3 (the two D8 lines, `prove.sh:7`). The C# 16 / 14 is S6's brief O1 **[D]** (not re-run: no build) | **observed** |
| O12-b | entry 11.2: the runner is pinned, so S6 cannot touch it | benchmark `a8106448` | read `spikes/lang-bench/test/runner-pin.test.mjs:103-106` **[R]**; S6's brief O4 **[D]** (`pin-runner.mjs --check` exit 0, the pin hashes every file of `runner/`) | — | any byte of `runner/` reds the test | the test compares `inputs/specs.d/runner.json` with the runner tree **[R]**; O4 as quoted | **observed** (by reading, and by S6's brief's run) |
| O12-c | S7's new prerequisite: the language-comparison plan disposes of `run_samples.py:35`, `:306` | benchmark `a8106448` | read `todo/PLAN_lang_comparison_v2.md` (`git show origin/main:…`; `grep -n` for `run_samples.py:35`, `mkdtemp`, `test-leftovers`, `E6.S6`) **[M]** | — | — | not yet written there: no line names the two lines or 11.2 (its test-leftovers lines are D75's C# wall-clock test and the followups plan's boundary). Its ledger is at `> Epoch 10 · approved 2026-11-08 · by owner · state: open` with ONE entry, 10.1 (2026-11-10) **[M]**: if that plan counts the hand-off as a change, it is its own second change and its own full stop — that plan's count, not this one's | **blocked** on that plan: S7's stop condition is its prerequisite (row E6-g): S7 does not go to its plan gate until the disposition is on `main` and the C# copy reads no finding on those lines |
| O12-d | D7: the followups plan's S1 (F1) and S2 (F2) merge before S7 | benchmark `a8106448` | read `todo/PLAN_bench_test_leftovers_followups.md` whole; `gh pr list --state all --search` (sentinel, followups, read-only); the branch list; this host's folders: `ls -d ~/testsToDelete-u1000-bench-sentinel-*`, `~/.cache/minigit-bench/test-work/testsToDelete-*`, `/tmp/testsToDelete-mgb-*` **[M]** | — | — | OPEN and UNDATED: status "plan only, nothing implemented yet, 2026-11-03; S5 added … 2026-11-04; S5's list widened 2026-11-05" (`:3`); its build order (`:67-77`) has no date; no branch or PR for S1 or S2. On this host: 18 sentinel folders in the home (2026-11-02 18:33 to 2026-11-04 12:26; F1 named seven), 51 `testsToDelete-*` folders under `~/.cache/minigit-bench/test-work/` (F2's shape), one `/tmp/testsToDelete-mgb-home-K7exly` (2026-11-17 16:56). Nothing was removed (the owner's word is needed) | **blocked** on that plan: D7's own stop condition, unchanged (wait, or the owner moves those sites to E6; E6's § 12 item 1) |
| O12-e | E12-5: S6's `minigit-bench` and `lang-explore` whole runs within this machine's rule for Python | benchmark `a8106448` | read **[R]** the lines of E12-5; `grep` of `python3` spawns over the two spikes' `lib/` and `test/` | — | — | both suites start the system interpreter: by the absolute path `/usr/bin/python3` (their libraries) or as `python3` through `PATH` (three judge tests); lang-bench's layer instead finds `python3` with `findOnPath` on the fixed search path `SBIN_PATH` (`lib/exec-layer/run.mjs:79`, `:84-91`); neither suite is covered by the owner's allowance (wording corrected after the independent review, N-1) | **answered** by the owner, 2026-11-17 (item 7 (a): yes). *Was:* "**blocked** on the owner: item 7 question (a); without an answer S6 STOPS before its plan gate" |
| O12-f | S6's whole `spikes/lang-bench` run with `BENCH_REQUIRE_SANDBOX=1` and `LANG_V2_TASK_REPO` | — | not run here: the owner's allowance is S6's two runs (base, head), not a third | — | — | — | **blocked** by design; S6's base run is its first observation, under the allowance and row E6-m's rule for a failure |
| O12-g | E7.S2: its guard bases and its blocked rows | rag_qln `cdc78d4c` | `git diff --stat 48cbf896 cdc78d4c` **[M]** | — | no `src/` or `tests/` change since S2's stated base | five files: `todo/PLAN_test_leftovers_E7.md`, `todo/README.md`, the S3–S5 brief's promotion, `research/README.md`, the benchmark gitlink. So S2's base readings at `48cbf896` (Node clean over 213 files, the C# copy 0) stand for its code. Rows E7-b (branch 2), E7-c, E7-f stay **blocked** on the owner's observations | **observed** (the diff); the rows **blocked**, unchanged |

### 4. The dispositions of entries 11.1 and 11.2, and the next blockers settled now

**4.1 Entry 11.2 — a narrowing, bounded by an explicit prerequisite (the re-review consult, point (a)).** Checked: S6's
*Done when* (`:706-709` at `a8106448`) asked for the C# guard 14 → 0 in `spikes/`; the two runner lines are two of the
14 (E11-6's list; S6's brief O1); no form of S6 can change them without a re-pin of `runner/` (O12-b), which the owner
gave to the language-comparison plan. So S6 merges with two findings that epoch 11 forbade: a smaller merge condition,
`Narrowed: yes`, the owner approves (`common/plan-change-control.md`, step 8). The precedent is the record for epoch 3
(its Narrowed line: "the producer PR's merge condition changed; E5's final Definition of Done and this plan's did not
get smaller … and the prerequisites got wider"). The final promise is kept ONLY because completion stays an explicit
prerequisite: **S7 also waits for the language-comparison plan's disposition of `runner/run_samples.py:35`, `:306`,
with the repository guard clean on them** (row E6-g) — removed, made inside an owned folder, or carrying a rule §7
marker that plan writes in its own re-pin; this plan does not choose which. Until then S7 does not go to its plan gate,
and E6's switch-on (DoD 3) does not happen. The consult's count check holds: E11-9 (`:3760`) expected only the two D8
`raw-worktree` findings after S6, and 11.2 leaves the two runner `raw-temp` findings as well; row E6-g corrects S7's
counts to C# 4 at its start. The hand-off is NOT yet in the language-comparison plan (O12-c); E6's amendment and S6's PR
name it on the benchmark side (item 8.3), and that plan's owner writes it there and counts it by that plan's own ledger.
**The decision point** (the independent review, S-2): if that plan has not recorded the hand-off by the time S6 merges,
the owner decides then: wait, or a coordinated re-pin of `runner/` carrying a rule §7 marker on the two lines. A marker
that plan writes is listed in S7's brief and copied into E6's § 11, as every inline exemption is (§ *Epoch 11* item 4.3).

**4.2 E6.S6 restated in the form of item 8.1** (E6's amendment writes it; S6's brief's new commits follow).

- *Files* (bounded folders, the observations below them): `spikes/policy-ab-quick/test/**`; `spikes/minigit-bench/test/**`
  and `spikes/minigit-bench/run-tests.mjs`; `spikes/lang-bench/test/**`; `spikes/lang-explore/test/**` — never the files
  the followups plan's F1 and F2 name (`spikes/lang-bench/lib/exec-probe/lines.mjs`, `probe.mjs`,
  `test/exec-layer-isolation.test.mjs`; `spikes/minigit-bench/test/helpers.mjs`, `test/fake-home.mjs`,
  `lib/cache-snapshot.mjs`; `spikes/lang-explore/test/commands.test.mjs`), and never any spike's `lib/`, `runner/`,
  `inputs/`, `hooks/` or product file; plus **the docs a `git grep` at S6's base finds that describe what S6 changes**
  (the old spellings S6 removes, over `*.md`: S6's brief O11's pattern; AND the names of the files and commands S6 changes, as item 8.1 asks — e.g. `research/module_minigit_bench.md:785` on `run-tests.mjs`; CodeRabbit on #180), each with what it says now (an IMPLEMENTED or a
  ledgered plan gets a dated note beside the old text, never a rewrite); plus the plan records (E11-10). *Observations at
  `a8106448`, not scope:* the 39 files of the findings (S6's brief § 0.1, § 4), `research/module_tests.md` (§ *The
  minigit stack bench scenarios*, § *The language-comparison runner scenarios*, § *Test leftovers*), and the grep's
  hits: `todo/PLAN_bench_test_leftovers_followups.md:32`, `:102-103`, `:151`, `:156` (still true after S6: no edit),
  `todo/PLAN_minigit_stack_bench_E2.md:89` (made false by S6: the dated note of item 4.3) and `:500` (still true).
- *Done when* (the new form): both guards over S6's head show ZERO unexplained findings in `spikes/`: each finding there is
  gone, cleared by a rule §7 marker the brief listed before its plan gate (§ 3a: `box_support.py`'s unit name,
  `legacy-name`; `prove.sh`'s `mktemp`, `raw-temp`; copied into § 11 by the PR), or on the approved standing list, which
  is exactly `runner/run_samples.py:35`, `:306` (C# `raw-temp`, this revision, the owner approving); none for
  `owner-blind`; no finding added outside `spikes/`; row E6-m for the suites; `pin-runner.mjs --check` and
  `pin-exec-layer.mjs --check` exit 0; `git diff --name-only <base>..HEAD` within the folders and docs above;
  `plan-lifecycle.mjs` clean. The counts of row E6-i are what S6's PR quotes, as observations against its base.
- S6's brief § 14 Q1 is decided as its option (b) with the prerequisite above; Q2 is the owner's answer of 2026-11-17
  (allowed, lang-bench's two runs); Q3 is item 4.3; Q4 to Q6 stay brief-level, as the brief recommends.

**4.3 The next blockers, settled now (the re-review consult, point (c)).**

1. **Q3, policy-ab-quick's three failures — not fixed in S6; declared in the narrowing.** Checked: the three tests assert
   Windows-drive behaviour (`depthOf('D:/')`, `shedCell('D:/', …)`, `reportTarget({ out: 'D:/x/y.json', … })`) of
   functions in `spikes/policy-ab-quick/lib/` (`safe-rm.mjs:7`, `:11`; `shed.mjs:7`), which S6's folders exclude, and on
   Linux `path.resolve` reads `D:/` as relative **[R]**; their own plan names them pre-existing and not its epic's
   (`todo/PLAN_minigit_stack_bench_E2.md:86-88`, "four" there, three at `a8106448`, S6's brief O10). Fixing them means a
   `lib/` change or a rewrite of what the tests assert, both that plan's. So S6's evidence for policy-ab-quick is row
   E6-m: the same three by name, failing at the same assertions, and nothing else. A smaller merge condition for S6
   only; item 4.6 declares it; the three are handed to the minigit stack bench by name (item 8.3).
2. **S-2, `todo/PLAN_minigit_stack_bench_E2.md:89` — on S6's docs scope.** A grep at S6's base finds it, and S6 makes it
   false for the tests it converts, so by item 8.1's *Files* form it is S6's: S6's PR adds ONE dated line beside it, the
   old text kept: "*2026-11-xx (E6.S6, the test-leftovers rollout):* the tests of `spikes/policy-ab-quick/test/`,
   `spikes/minigit-bench/test/`, `spikes/lang-bench/test/` and `spikes/lang-explore/test/` that E6.S6 changed make
   owner-form names through the mount's shipped helper (`ownedFor({ token: 'bench' })`); `test/helpers.mjs` and
   `test/fake-home.mjs` still make `testsToDelete-mgb-…` names until the followups plan's S2; the reason above (the
   release has no owner segment) no longer holds at the mount `b1746499`." Not a change of that plan (a fact repaired,
   no step of it changes); its owner decides any rewrite.
3. **Python for S6's suites.** The `.py` units run in `wslc` and an owned venv (S6's brief K13 (a), (b), observed O5 to
   O7). The whole `lang-bench` suite runs `/usr/bin/python3` under the owner's allowance (two runs). The `minigit-bench`
   and `lang-explore` whole suites run `/usr/bin/python3` too (E12-5, O12-e), which no allowance covered: item 7
   question (a), answered yes by the owner, 2026-11-17: the same allowance for their two runs each (base, head), with the same terms. (*Was:* "which no allowance covers: item 7 question (a). Recommended: …") Every whole
   run, the `lang-bench` one included, runs under its own owned, empty `TMPDIR` (the judge's note: S6's brief § 7 runs
   the whole lang-bench suite with none), listed after the run.
   *After the independent review:* that `TMPDIR` is a folder the shipped helper claims under `/tmp`, not under
   `$HOME/.cache` as S6's brief § 7 writes (S-1, row E6-m); and the brief's commit series (`d836de52:301-302`, the whole
   minigit and lang-explore suites at commits 3 and 4) runs per commit only the files that start no interpreter, so the
   whole suites run at base and head only and question (a) stays at two runs each (S-3). The layer finds `python3` by
   `findOnPath` on the fixed search path `SBIN_PATH` (`lib/exec-layer/run.mjs:79`, `:84-91`); the two other suites name
   `/usr/bin/python3` or call `python3` through `PATH` (E12-5, N-1).
4. **A flaky timing test at base or head** (the followups plan's S5 list): recorded with `/proc/loadavg`, never re-run in
   a whole run that starts the system interpreter without the owner's word; a file that does not start it may be re-run
   alone. *Withdrawn by the independent review (B1):* that re-run, and the sentence that called this point no narrowing.
   Now, as the list's own rule says (`todo/PLAN_bench_test_leftovers_followups.md:126`): a timing failure at the head is
   RED; it is recorded on the list by a dated line with `/proc/loadavg`; no re-run replaces it; the owner decides on ONE
   repeat run. The list approves no failure (row E6-m (5)).
   *After the judge:* **the pre-existing failures of the base runs.** Benchmark #222's PR body records 10 failures of
   991 in `spikes/lang-explore/test` and 1 of 2394 in `spikes/lang-bench/test` on `main` before its change ("the host's
   sandbox and box tests, the rehearsal runs, one priority test") **[D]**. S6's base runs name every failure test by
   test before its plan gate; row E6-m approves those in that body's classes or on the S5 list, each failing the same
   way at the head. Part of the narrowing (item 4.6); bounded as row E6-m says.
   *Bounded by the independent review (B1):* the owner confirms each base list in one line; the caps are #222's counts
   (lang-explore ≤ 10, lang-bench ≤ 1, minigit-bench 0); the S5 list is no route; S6's PR copies the lists into § 11.
5. **E7.S2 stays blocked on the owner's observations** (§ *Epoch 9* item 7; O12-g).

**4.4 Entry 11.1 — kept as built.** #221 carries the four doc lines (the stories' S4 *Files* as amended). Under item 8.1's
form, a doc line that a grep at the story's base finds is on the story's *Files* by definition, so a later find of the
same kind is no longer a change.

**4.5 E6.S7 and E7.S2 in the form of item 8.1.**

- *E6.S7 Files*: `tests/Bench.Tests/Leftovers/**` (the manifest, `LeftoversRepositoryGuardTests.cs`,
  `LeftoversGuardFiles.cs`); `.github/workflows/ci.yml`; `research/local-model-coding/harness/**` (D8's two lines);
  `http/README.md`; the docs a grep at S7's base finds that describe what it changes (the guards' reach and limits, the
  CI step, D8's lines, the container line); the plan records. Never `spikes/**` (S6's and the followups plan's) nor
  `spikes/lang-bench/runner/**` (the language-comparison plan's). *Done when*: E6's Definition of Done (§ 11) holds; both
  guards on with `FilesScanned > 0` and ZERO findings at S7's head (every remaining one a listed rule §7 marker); row
  E6-g's prerequisites met. Counts as observations (row E6-g).
- *E7.S2 Files* (E7's amendment; S2's Fable spec names the files inside them): `src/Rag.Application/Runtime/**`,
  `src/Rag.Application/Corpus/**`, `src/Rag.Domain/Corpus/**`, `src/Rag.Infrastructure/Indexing/**` (the record's store,
  if the spec puts it there), `src/Platform/` (a registry's migration and its context), `src/Platform.Contracts/InfrastructureModels.cs`,
  `src/Rag.Api/InfrastructureEndpoints.cs`, `src/Rag.Ui/Pages/Infrastructure.razor*`, `tests/Rag.Tests/**`; the docs a
  grep at S2's base finds that describe what it changes (S2's own pattern: `qlntest`, `TestCorpusPrefix`,
  `TestCorpusSweep`, over `*.md` outside `external/` and `.agents/`); the plan records. The named paths of `:505-547`
  stay as observations at `48cbf896`. These folders are proposed here: E7's amendment confirms them against S2's Fable
  spec if it is written by then, and a folder outside them that S2 needs goes to the parent first (in doubt, a change),
  as S2's text already says. *Replaced after the independent review (S-6):* the list above misses known paths, so E7's
  amendment sets S2's folders from the Fable spec, within `src/**` and `tests/Rag.Tests/**`, before S2's plan gate and
  without a count; it names as known, read at `cdc78d4c` **[M]**: `src/Rag.Infrastructure/RagInfrastructureExtensions.cs:227`
  (`ResidentSet`), `:285` (`InfrastructureSampler`), `src/Rag.Infrastructure/Vectors/QdrantVectorIndex.cs:396`
  (`DropCollectionAsync`), `src/Rag.Application/Ports/IVectorCatalog.cs:40` (its port), `src/Rag.Ui/Services/RagConsoleApi.cs:123`
  (`DeleteCollectionAsync`), and the options classes `RagIndexingOptions` (`src/Rag.Infrastructure/Indexing/OptionsFilterSource.cs:9`)
  and `OllamaProbeOptions` (`src/Rag.Infrastructure/Runtime/RuntimeInspector.cs:13`); `Graph/` holds `Neo4jOptions`
  (`src/Rag.Infrastructure/Graph/Neo4jGraphStore.cs:12`), and `src/Rag.Tools/SearchAnswer.cs:10` the record `RetrievalToolOptions`
  (fact fix 2026-11-17 by E7's epoch-12 amendment, E12-F3; *was:* "`Graph/` has no class named `*Options` (`git grep`)", a grep that
  missed a name holding a digit). After S2's gate, a folder outside those its brief names counts (item 8.1, kind 1 or 12;
  *was:* "kind 13"). *Done when*: as written (`:565-578`), with its guard sentence in the new form:
  ZERO unexplained findings of both guards on S2's lines, each remaining one a listed rule §7 marker (none for
  `owner-blind`). Its two stop conditions (a retained corpus; a design that must spell the prefix word in code) stand.

**4.6 Narrowed: yes — what got smaller, and why the Definition of Done does not.** Smaller: S6's merge condition, in two
places — (1) the C# copy may read two findings in `spikes/` at S6's merge (`run_samples.py:35`, `:306`, `raw-temp`),
approved one by one, on a list of exactly those two; (2) policy-ab-quick's evidence is "the same three named failures",
not "green", and (after the judge) the other three suites' evidence is "the same named pre-existing failures" as row
E6-m bounds them (the classes benchmark #222's body records, or the S5 timing list), not "green". *As bounded by the
independent review (B1), and as the Narrowed line says:* the standing failures are EXACTLY policy-ab-quick's three and
the base lists the owner confirms in one line within #222's counts (lang-explore ≤ 10, lang-bench ≤ 1, minigit-bench 0);
the S5 timing list approves none; a timing failure at the head is red. *(3), after the second plan-gate round
(`a0abb03e`):* the goal's promise of collection after a kill does not reach S6's claimed folders outside the temp root —
a killed run's claimed fake homes under `~` (and `/var/tmp` decoys) are listed, not collected, until F1/S1's home sweep (item 1's *Goal*, the bounded exception; the sockets under `/run/user/<uid>` with them). So "Not smaller: the goal" below holds except for that exception. Not smaller: the goal; the Definition of Done (§ *Definition of Done* with its readings), because S7 still
ends with both guards at zero and switched on, and now ALSO waits for the language-comparison plan's disposition (row
E6-g); E6's own Definition of Done (§ 11), which gets one reading under its exemption item for the time between S6 and
S7 (E12-10: "*Epoch 12:* between S6's and S7's merges two findings stand that are not exemptions, `runner/run_samples.py:35`
and `:306` (C# `raw-temp`), approved by the owner with the parent's epoch 12; they are gone or carry a rule §7 marker
before S7 merges"); every other merge condition. Wider: the prerequisites (O12-c; item 7 question (a)). Item 8.1's
structural change is NOT a narrowing: no condition gets smaller by it (a finding stays a finding; an exception still
needs its listing or the owner), and it removes no kind from the count (item 8.1, *What still counts*).

### 5. Build order

```
DONE   epoch 11 approved (#176) → E6's stories amended (#220) and E7's (#128) → entry 11.1 (#177) → E6.S4 (#221)
       → the language comparison's gated specs (#222, outside) → follow-ups F45, F46 (#178) → E6.S5 (#223, `a8106448`)
       → rag_qln's benchmark pins (#129, #130, #131) → S6's brief (local, `d836de52`, entry 11.2) → the stop (#179,
       `cb5a33a1`) → this revision. (Merge order, read from each PR's `mergedAt`.)
DONE   the Opus judge sorted epoch 11's work (`82c5a4b`: 11 fit, 3 cut by a fix forward, 2 outside) → row E6-m widened
       after its note (benchmark #222's pre-existing failures), and every whole run given an owned `TMPDIR`.
DONE   the plan gate on the operative extract (session `10853099`, `proceed`; G1 and G3 accepted into row E6-m, G2
       rejected: the record's gate note).
DONE   an independent Opus review ("do not approve as written"; approve with fixes once B1 and B2 are fixed): B1, B2,
       S-1 to S-9 and N-1 to N-4 folded in one round (the record's review note) → the second plan-gate round
       (`a0abb03e`, `proceed`; one finding accepted: the goal's bounded exception for S6's roots outside the temp root).
DONE   the owner approved (Narrowed: yes) and answered item 7's question 1 and (a) with yes, 2026-11-17 → epoch 12
       opened `by owner`, at 0 changes. (Question (b) stays for S6's merge.)
THEN   benchmark   E6's stories amendment for epoch 12 (prepared on `docs/e6-stories-epoch-12`, a NEW PR) → S6's brief
                   revised by new commits (item 4.2, item 4.3, the owner's answer) → S6's plan gate → S6.
                   S7 after S4–S6, D7's S1 and S2, AND the language-comparison plan's disposition of the two runner
                   lines on `main` (row E6-g).
       rag_qln     E7's stories amendment for epoch 12 (item 4.5; rag_qln #132: it sets only the BOUNDS, `src/**` and
                   `tests/Rag.Tests/**`, so it needs no spec first) → S2's Fable spec, which names the folders inside those
                   bounds in S2's brief (no second amendment) → the owner's observations → S2's plan gate (CodeRabbit on #180).
LAST   the feature reviews (§ *Epoch 8* item 5); the promotion of this plan and its stories documents; R6 ticked in
       the remainder plan.
```

### 6. What the consultant raised, and what was done with it

| Point (`59b325a3`) | Checked | Done |
|---|---|---|
| (a) 11.2 is a NARROWING: S6 may merge with two findings that were forbidden; `Narrowed: yes`, `by owner`; the epoch-3 narrowing record is the precedent | true: S6's *Done when* `:706-709` and E11-7 said C# 14 → 0; the record for epoch 3 says "the producer PR's merge condition changed; E5's final Definition of Done and this plan's did not get smaller" | the record's Narrowed line; item 4.1; item 4.6 |
| (a) the runner lines' final promise is kept only if completion stays an explicit prerequisite: S7 waits for the language-comparison plan's disposition, the repository guard clean | true: S7 switches the C# repository test on, which is red on any finding (S7 *What*) | row E6-g; D7 widened (E12-4); item 4.1; DoD 3's blocker |
| (a) E11-9 (`:3760`) expects only two `raw-worktree` findings after S6; 11.2 leaves two `raw-temp` more | true: S6's brief § 6 gives the C# copy 4 at its head | row E6-g; E12-3 |
| (b) *Files* as bounded folders plus the docs a grep at the story's base finds | true as a cause (item 1: nine of 28 entries are closed texts; four of the last six) | item 8.1; items 4.2, 4.5 |
| (b) line lists and counts as OBSERVATIONS at a SHA | true | item 8.1; rows E6-i, E6-g carry "observations, not scope" |
| (b) *Done when* as "zero unexplained findings of both guards in scope; each remaining one an individually approved, listed exception" | adopted with what "approved" means (item 8.1), so the form does not hollow a condition | items 4.2, 4.5, 8.1 |
| (b) do NOT adopt "only scope/DoD changes count" | true: the shared rule counts approach, contracts, build order and merge conditions too | kept; item 8.1 lists what still counts |
| (c) S6 brief § 14 Q3: fix inside S6 or declare as narrowing | the failures are in `lib/` functions with Windows paths, outside S6's folders, and the minigit stack bench's own (E12-7) | declared, bounded to three named cases (item 4.3 point 1, row E6-m, item 4.6) |
| (c) S6 brief § 13 S-2: a disposition for `PLAN_minigit_stack_bench_E2.md:89` | that plan is open, unledgered, and S6 makes the line false for its tests (E12-6) | a dated note on S6's docs scope, its text in item 4.3 point 2 |
| (c) E7.S2 stays blocked on the owner's observations | true (§ *Epoch 9* item 7; O12-g) | unchanged |

Added by this revision beyond the consultant: E12-5 and O12-e (the minigit-bench and lang-explore whole suites start the
system interpreter, which no allowance covers: item 7 question (a)); O12-c's reading of the language-comparison plan's
ledger; O12-d's host listing of F1's and F2's leftovers; row E6-m's rule for a timing failure. Rejected: nothing; "only
scope/DoD changes count" is not adopted, as the consult itself says.

### 7. Questions for the owner

**For the approval (the record says `Narrowed: yes`):** the owner approves the revised plan with item 4.6's two smaller
places in S6's merge condition — the two runner findings on an approved standing list of exactly those two, and
the pre-existing suite failures of row E6-m, which are EXACTLY policy-ab-quick's three named and the base lists you
confirm in one line each before S6's plan gate, within benchmark #222's counts (lang-explore ≤ 10, lang-bench ≤ 1,
minigit-bench 0), each failing the same way at the head; a timing failure at the head is red and goes on the followups
plan's S5 list, and you decide on one repeat run (*was:* "in the classes … or on the S5 timing list", B1); and one bounded
exception to the goal (the second gate round): a killed run's claimed fake homes under `~` (and `/var/tmp` decoys) are listed, not collected, until F1/S1's home sweep (with two sockets under `/run/user/<uid>`), as item 1's *Goal*
writes it — with S7 waiting for the language-comparison plan's disposition (row E6-g), and
item 8.1's form for the remaining stories (recommended: approve as written).
**Answered** by the owner, 2026-11-17: approved as written (`Narrowed: yes`); epoch 12 opened `by owner`.

**(a) The system interpreter for two more suites** (E12-5, O12-e). May S6 run `/usr/bin/python3` through the
`minigit-bench` and `lang-explore` whole-suite runs, two runs each (base, head), on the same terms as lang-bench's (the
suites' own interpreter as they call it — `/usr/bin/python3`, or `python3` through `PATH` in three judge tests — standard
library, `-I` where the suite passes it, nothing installed, lowered priority, an owned `TMPDIR` under `/tmp`)? Per commit
of S6's series only the files that start no interpreter run, so two runs each is all S6 asks (S-3). Whatever the
answer, the whole `lang-bench` run (already allowed) also runs under an owned, empty `TMPDIR`, listed after. (1) yes; (2)
no: then S6's evidence for those two suites is narrowed further (the files S6 changes run alone where they start no
interpreter; `heldout-run.test.mjs`, which S6 changes, starts it), which would be one more smaller condition to approve.
Recommended: (1), yes. S6 does not go to its plan gate until this is answered. The question consultants could not be
asked first: the day's cap of ten questions was spent (N-2); the rule for Python is the owner's anyway.
**Answered** by the owner, 2026-11-17: (1), yes — two runs each (base, head) of the `minigit-bench` and `lang-explore`
whole suites with `/usr/bin/python3`, on lang-bench's terms, with an owned `TMPDIR` under `/tmp`.

**(b) Later, at S6's merge (not now; the independent review, S-2):** if the language-comparison plan has not recorded
the hand-off of the two runner lines by then, the owner decides: wait, or a coordinated re-pin of `runner/` carrying a
rule §7 marker (item 4.1).

**For the owner's information (not a question to this plan):** the two runner lines' hand-off is not yet written in the
language-comparison plan, whose epoch 10 has one entry (O12-c); how that plan records and counts it is that plan's.
Unchanged, as § *Epoch 9* item 7 and E6's § 12 item 1 say: E7.S2's live-store observations; D7's "wait, or move F1/F2's
sites to E6" if the followups plan is still open when S1 to S6 are merged. The PR cap is settled for E6's and E7's PRs
(the owner's "Yes, every E6 PR" and "Yes, for all E7 PRs").
**E2's held feature review** (N-3): coai's `call_human` has held it since 2026-11-10 (a reviewer failed; the owner left
it held on 2026-11-11). Only the owner's answer on its notice card releases it; no argument and no `resolve` does. It
is one of "the feature reviews" of the LAST step (§ *Epoch 8* item 5, point 2), so it gates this plan's promotion, not
any story of E6 or E7.

### 8. The way of working — so a twelfth stop is less likely

**8.1 What changes: the form of a remaining story's *Files* and *Done when*** (the re-review consult, point (b); E6.S6,
E6.S7, E7.S2, and any story written after them). § *Epoch 10* item 8.1 and § *Epoch 11* item 8.1 stand.

- ***Files*** are BOUNDED FOLDERS — the folders the story changes, with the folders and files it must not touch named —
  plus **the docs a `git grep` at the story's base finds that describe what it changes** (the old spellings the story
  removes, over `*.md`; each hit with what it says now; an IMPLEMENTED or a ledgered plan gets a dated note beside the
  old text, never a rewrite), plus the plan records (E11-10). *After the independent review (S-4):* the grep also looks
  for the NAMES of the files and commands the story changes (for S6, `run-tests.mjs`: `research/module_minigit_bench.md:785`
  describes it **[M]** at `a8106448`), and an edit to a grep-found plan that this plan does not own is a dated note
  beside its text, never more; its owner decides any rewrite.
- **Line lists and counts are OBSERVATIONS at a named SHA**, labelled so, never binding scope: a line number that moves,
  a count that differs at a later base, or a site the list missed INSIDE the bounded folders is the brief's to read, not
  a change.
- ***Done when*** says: **zero unexplained findings of both guards in scope; each remaining one is an individually
  approved, listed exception.** "Approved" has exactly two meanings: (i) a rule §7 inline marker in a class that takes
  one, listed by the brief (file, line, class, reason) before its plan gate and copied into the stories by the PR
  (§ *Epoch 11* item 4.3) — passing that gate approves it, as before; (ii) a finding left STANDING without a marker,
  approved only by the owner and recorded in this plan, as a counted change or in a re-review record that says
  `Narrowed: yes` — never by a brief or a gate alone. `owner-blind` and `ryuk-off` take neither. At the epic's last story
  (S7 for E6), only (i) remains: the guard is switched on at zero.
- **Kept, not adopted:** "only scope or Definition-of-Done changes count". The shared rule counts a change to scope,
  goals, the Definition of Done, the merge conditions, epics or stories, the build order, a contract or the approach,
  and this plan keeps it.

**What still counts as a change under the new wording** (so the form is honest, not a hollowing of the rule):

1. a file outside the story's bounded folders that is not a doc the grep finds (9.1's and 11.2's kind) — scope;
2. a finding left standing without a marker, or a new entry on a standing list (11.2's kind) — merge conditions, and a
   narrowing: the owner approves it;
3. a site whose lifetime fits no class of § *Epoch 11* item 4.2's table, or a new disposition (4.2's and 10.2's kind) —
   approach;
4. a change to a helper's or a guard's contract or reach (a walk that skips a folder, a template change, a new exemption
   kind) — contract;
5. a story that must wait for, or go before, something its text does not name (2.2's kind; S7's new prerequisite) —
   build order;
6. a suite failure accepted at merge that is not on the approved list (row E6-m: policy-ab-quick's three, and the base
   lists the owner confirmed within #222's counts; *was:* "… in the classes benchmark #222's body records or on the S5
   list") — merge conditions;
7. a whole-run interpreter, sandbox or host action outside the owner's allowances — the owner's, and, if it makes the
   evidence smaller, merge conditions;
8. *(added after the independent review, S-5)* work moved between stories, epics or plans, or a story added or
   removed — stories, epics, scope;
9. a change to the goal or the Definition of Done, or a new reading of either — goals, dod;
10. an inline exemption not listed by the brief before its plan gate — merge conditions;
11. touching a file the story must not touch even inside a bounded glob (the F1/F2 files, `runner/`, `lib/`) — scope;
12. widening a story's folders or its grep pattern after its plan gate — scope;
13. in doubt, a change. (*Was:* "8. in doubt, a change.")

**What no longer stops:** a missed line inside the bounded folders, a moved line number or count, and a doc line the grep
finds (11.1's kind). It would have kept ONE of the 28 entries from counting (item 1).

**8.2 The surprises still likely.**

| Story | What it is likely to meet | Why |
|---|---|---|
| S6 | the owner's answer to question (a) (O12-e, **blocked**); a timing failure in a whole run with only two runs allowed (row E6-m's rule); 99 findings in 39 files as a commit series per folder; `wslc`'s slow 9p mount (464 s for the units, S6's brief N6) | the machine's rule; F30's limits; the host's load |
| S7 | the language-comparison plan's disposition (O12-c, **blocked**); D7's S1 and S2 (O12-d, **blocked**, undated); claims C3–C5 and C10's "with" half (observed by S7's brief as § *Epoch 10* item 8.1 allows: plants of its own operation) | two other plans' timing |
| E7.S2 | as § *Epoch 11* item 8.2; the new *Files* form gives the Fable spec its folders | the spec's choice |

**8.3 What the other documents' own revisions must say.**

- **Benchmark's E6 stories, a NEW PR, before S6's plan gate** (prepared, local, `docs/e6-stories-epoch-12` `405dd714`, `06225b48`, `7dcdffd9`, `bd3ce7ba`, `743e3392` from
  `a8106448`): the status line; § 6's first paragraph in item 8.1's form; D7 with the second prerequisite (E12-4); S6 as
  item 4.2 (with item 4.3); S7 as item 4.5 and row E6-g; rows E6-i (S6's half), E6-g and E6-m; § 11's reading
  (E12-10); § 12 item 1 widened to the language-comparison plan's disposition.
- **S6's brief (local, `feat/e6-s6-spikes`), new commits, never a rewrite:** § 0.1 as item 4.2's folders and the grep's
  docs (with item 4.3 point 2's note); § 9 as item 4.2's *Done when* and row E6-m; § 13 and § 14 answered (items 4.1 to
  4.3); § 7 with the owner's answer to question (a); the header's parent (§ *Epoch 12*).
- **Rag_qln's E7 stories, a NEW PR, before E7.S2's plan gate:** item 4.5's *Files* and *Done when* form; § 6's standing
  line as E6's.
- **The language-comparison plan** (benchmark `todo/PLAN_lang_comparison_v2.md`): the hand-off of the two runner lines,
  by its owner, counted by its own ledger; S6's PR names it in its body.
- **The minigit stack bench** (`todo/PLAN_minigit_stack_bench_E2.md`): item 4.3 point 2's dated note (S6's PR), and the
  three named policy-ab-quick failures (S6's PR body cites `:86-88`).
- **The follow-ups plan** (conventions): nothing new; F46 stands.
- **Benchmark's followups plan** (`todo/PLAN_bench_test_leftovers_followups.md`, a plan this one does not own; the second
  gate round): S6's PR adds ONE dated note beside S1, the old text kept — "E6.S6 claims fake homes under `~` and decoys
  under `/var/tmp`, which no sweep reads after a kill (the rollout's goal exception, epoch 12); S1's home sweep, and a
  `/var/tmp` root if its safety check allows one, would collect them". Its owner decides; it is no step of that plan.

**8.4 Run for this revision.** `node tools/plan-lifecycle.mjs` at this branch; `git fetch` and `git rev-parse` of
benchmark and rag_qln; the Node guard (`--profile node --token bench --identity "the measuring harness"`, and the default
profile) at benchmark `a8106448` in a new worktree with its mount (O12-a); `git diff --stat 48cbf896 cdc78d4c` in rag_qln
(O12-g); reads of the language-comparison plan and its ledger (O12-c), the benchmark followups plan whole (O12-d), the
minigit stack bench E2 plan (E12-6, E12-7), the spikes' Python call sites (E12-5) and the policy-ab-quick tests and
`lib/` functions (E12-7); `gh pr view` of every PR in the record's table, `gh pr list --state merged` since 11:00Z in
conventions, benchmark, rag_qln, mcp, coai, creds, sidecar_rust, vscode_kit, amd_r9700, wsl_care and
ai_language_comparison; `git ls-remote` of benchmark for S6's branch; the host listings of O12-d. Not checked: the
consult text (`59b325a3`: its points are taken as the coordinator quoted them and checked against the files); any C#
verdict (no build); anything with Docker; Python; the suites' runs (S6's); E2's held feature review.

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
- **Repository:** `dew_flow_conventions`. **Stories:** [research/PLAN_test_leftovers_E1.md](PLAN_test_leftovers_E1.md) (IMPLEMENTED).
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
