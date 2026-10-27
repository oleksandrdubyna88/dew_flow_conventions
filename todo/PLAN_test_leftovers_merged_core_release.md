# PLAN — Test leftovers, the merged core: what is left before PR #82 merges and the release is promoted

> Status: **in progress, 2026-10-27 — R1 and R2 done (the barrier record: the Ubuntu dev VM open, the owner's Windows machine not tested); R3–R6 open.** Scope: the open part of
> [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md) — the machine barrier on every machine that
> builds or tests this repository (`research/security/machines.md`), the merge of PR #82, the private sibling's side of the
> merged core's Definition of Done, the ONE promotion of `release`, and the consumer migration of
> [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md). It edits no tool and no rule text.
>
> Related docs: [PLAN_test_leftovers_merged_core.md](../research/PLAN_test_leftovers_merged_core.md) (the build, promoted 2026-10-27, with its
> deviations), [PLAN_test_leftovers_E1.md](../research/PLAN_test_leftovers_E1.md) (the contract the build revised),
> [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md) (the consumer epics, R6),
> [PLAN_test_leftovers_merged_core_followups.md](PLAN_test_leftovers_merged_core_followups.md) (F1–F9, none of which blocks this plan),
> [research/security/machines.md](../research/security/machines.md) (the barrier record), [common/test-leftovers.md](../common/test-leftovers.md).
>
> The private sibling rule repository is never named here; it is "the private sibling".

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
| The tools, the rule texts, the scan, the vectors, the reviews and the security pass | [the merged-core plan](../research/PLAN_test_leftovers_merged_core.md) (promoted) | Nothing here edits them; a defect found while running R1–R5 is a new commit on PR #82's branch or a follow-up, never a story here |
| The findings the security pass parked, the stub-docker gaps, the Windows run | [the follow-ups plan](PLAN_test_leftovers_merged_core_followups.md) F1–F9 | None blocks R1–R6. F9 (the Windows run) is the evidence for a Windows machine's janitor switch; R2 only records that machine's barrier |
| The consumers' resources, ports, pin bumps | [the rollout plan](PLAN_test_leftovers_rollout.md) epics E2–E7 | R6 is its two-stage rule; this plan carries the order, the rollout plan carries each epic's content |

Order: R1 and R2 (parallel), R3, R4 (parallel with R1–R3 for its copy part), R5, R6. Disjoint: nothing here edits a consumer repository.

## Growth surface

None: a few lines in `research/security/machines.md` per machine, and documents. Nothing here creates a table, a directory of artefacts, a
cache or a process.

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

### R4 — The private sibling's side

- **What.** The private sibling's rebuild carries the two rule spans byte-identical to this repository's (its own check reports both
  spans equal); it copies `tools/lib/owned.mjs` and `tools/leftovers-check.mjs` byte for byte and pins their sha256, beside the janitor it
  already pins; and the sibling's owner confirms in writing that its rebuild is done, before R5.
- **Why.** One text in two repositories is the point of the merge. A silent drift here is found by a consumer, late.
- **When.** After PR #82 is reviewed; the copy part may run in parallel with R1–R3 from the PR's branch, the confirmation after R3.
- **Done when.** The sibling's confirmation exists, naming the sha256 of each copied file and of the two spans. This public repository
  names none of the sibling's own files or checks; the confirmation is quoted as a decision, not as a source.

### R5 — S7: ONE promotion of `release`

- **What.** After R3 and R4: warn the sessions that own open consumer pull requests (a promotion turns `pin-check` red in every consumer),
  then, once the `ci` run for the merged `main` sha is green,
  `gh workflow run promote-release.yml --ref main -f "sha=<40-hex>" -f reason="test-leftovers: the merged core — owner segment, kernel ownership, three-valued liveness, one janitor, the shipped helper and guard"`, and
  `node tools/release-distance.mjs` after it.
- **Why.** Every consumer migrates once, on one text.
- **When.** After R3 and R4; never before. The warning goes out before the dispatch, not after.
- **Done when.** `release` is at the merged sha, `release-distance` reports 0, and the warning's recipients and date are recorded here.

### R6 — The consumer migration

- **What.** The epics E2–E7 of [the rollout plan](PLAN_test_leftovers_rollout.md), in two stages: every consumer's SWEEP-ONLY stage (its
  owner-blind sweeps replaced or disabled as a committed, merged change; no owner-form producer) lands before ANY producer stage (pin bump,
  rename and helper/guard port in ONE commit). A sweep-only stage needs no release and may be prepared before R5.
- **Why.** An owner-form producer beside an owner-blind sweeper is the failure of the Symptom.
- **When.** Sweep-only stages: any time. Producer stages: after R5 and after every sweep-only stage.
- **Done when.** The rollout plan's own Definition of Done.

## Build order

R1 ∥ R2 → R3 → R5 → R6, with R4 running beside R1–R3 and finishing before R5. Nothing is built: each item is a run, a record, a merge or a
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
- [ ] R3: PR #82 merged; the merge commit's `ci` run green (the sha stated).
- [ ] R4: the private sibling's confirmation exists (both spans byte-identical; the two consumer files copied with their sha256 pinned).
- [ ] R5: the warning went to the sessions with open consumer pull requests; `release` promoted once; `release-distance` 0.
- [ ] R6: every sweep-only stage merged before any producer stage; the rollout plan's Definition of Done met.
- [ ] This plan is promoted to `research/` with its deviations, or deleted with a recorded reason, when R6 is done; its row in `todo/README.md` goes with it.
