# PLAN — Test leftovers, merged core: follow-ups parked by the security pass

> Status: **plan only, nothing implemented yet, 2026-10-26.** Scope: six low findings of the security pass of PR #82
> (`research/security/test-leftovers-merged-core.md`, L-1 and L-3 to L-7; its L-2 and M-1 to M-4 were fixed in the same
> PR) in `tools/lib/leftovers-sweep.mjs`, `tools/janitor.sh`, `tools/leftovers-check.mjs`, `tools/lib/sweeper-scan.mjs` and
> `common/test-leftovers-janitor.md`. Not one of them blocks the release of the merged core (the verdict: "none a reason to
> hold the release").
>
> Related docs: [PLAN_test_leftovers_merged_core.md](PLAN_test_leftovers_merged_core.md) (the plan these findings belong to),
> `common/recheck-followups.md` of the consumers' rule set (the format of this file; this repository does not carry that rule).

## Goal

Each item below was raised by the security pass and deliberately not fixed in the PR that carried it. Losing one costs a
future re-discovery by the same method. Anchors are `file:line` at the commit that parked them (the PR's last commit on
`feat/test-leftovers-merged-core`); re-read the line before acting, the files move.

## F1 — The Node sweep does not refuse an untrusted temp root (L-1)

- **What.** `sweepLeftovers` takes `tmp` and removes in it with no check that it is sticky or the caller's own
  (`tools/lib/leftovers-sweep.mjs:436`). The janitor keeps every folder and worktree folder when the root is neither
  (`tools/janitor.sh:212` `shared_dir_ok`, used at `:522` and `:537`, `-unsafe-root`).
- **Why.** In a world-writable, non-sticky `TMPDIR` a stranger can swap an entry between the identity capture and the removal.
  Needs a misconfigured root; no deletion of a live resource of the caller's, but a stranger's folder could be removed in its place.
- **Fix when re-opened.** One gate at the top of the folder and quarantine passes: `statSync(tmp)` is sticky (`mode & 0o1000`)
  or its uid is the caller's, else keep, list `-unsafe-root` and say it once. A RED test with a non-sticky, other-owned root
  (a seam for the uid, like `mine`).
- **When.** Before a consumer runs the Node sweep against a shared temp root it does not own (shared dev VM), or with the first
  report of a swapped entry.

## F2 — A stranger's control-byte name with the caller's owner segment sets exit 3 (L-3)

- **What.** An `unsafe` row whose name carries the caller's owner segment is `skipped:` (exit 3) without reading the entry's
  kernel owner (`tools/janitor.sh:661`; the row is built at `:446`).
- **Why.** Any user can plant `<temp root>/<prefix>-u1000-x<control byte>` and the caller's janitor never exits 0 again. No
  deletion; it contradicts "never an exit code from a stranger's name".
- **Fix when re-opened.** Read the entry's own kernel owner (`link_uid`) before the `skipped:` line; an entry that is not the
  caller's is `foreign:` (listed, exit 0). A RED test with the uid seam.
- **When.** Before the janitor is scheduled on a machine other users can write the temp root of, or with the first spurious exit 3.

## F3 — The guard's `node` profile does not read `package.json` scripts (L-4)

- **What.** `isScanned` (`tools/leftovers-check.mjs:177`) selects test and script files by shape; a consumer's
  `"pretest": "rm -rf /tmp/<prefix>-*"` in `package.json` is not a file it reads, although the machine scan (every tracked
  file) does report it. Reproduced by the security pass.
- **Why.** The contract's guard is "over the repository's tests, scripts and CI"; a `pre`/`post` script is one.
- **Fix when re-opened.** Under the profile, read `package.json` and scan the `scripts` values, one line per script, as a
  pseudo-file with the script's name in the finding. A RED test: the consumer above, plus one that stays clean.
- **When.** At the first consumer migration to the guard's `--profile node` (E2 onward of the rollout), before the consumer is
  declared compliant.

## F4 — One companion sentence on the owner override and daemon objects (L-5)

- **What.** With a valid `TESTSTODELETE_OWNER` naming another token, the janitor sweeps THAT token's dead-owned containers,
  volumes and networks: a daemon object has no kernel owner to compare (`tools/janitor.sh:150`, the override; the gate per row
  at the daemon passes). The comment and the companion's "no option names an owner" (`common/test-leftovers-janitor.md`,
  *Running it*) read as if the override could not reach them.
- **Why.** The behaviour is the core's design; the sentence that hides it makes a reader trust a protection that is not there
  (`common/security.md` § *A measure you have not OBSERVED working is a comment*). The reach needs the docker group, which is
  root-equivalent, so it is a mistake guard, not an attack.
- **Fix when re-opened.** One sentence in the companion (and the comment): the override selects another token's dead-owned
  DAEMON objects; for files the kernel owner still decides. Update `research/rule-bodies.json` for the companion.
- **When.** With the next edit of the companion, or the first question about what the override reaches.

## F5 — The scan's text-line limits are not all written down (L-6)

- **What.** `classifyLine` (`tools/lib/sweeper-scan.mjs:101`, docblock `:95-100`) returns `null` for a prefix held in a constant
  on another line, for a store sweep selecting by SQL `LIKE`, and `owner-aware` for a hard-coded foreign owner and for an
  owner-aware sweep that removes on age. Its header documents only the dynamic-name limit.
- **Why.** A reader of a clean scan should know what it did not look at; the barrier text forbids removing on age.
- **Fix when re-opened.** Write the four limits into the header of `tools/lib/sweeper-scan.mjs` and one sentence in the guard's
  header; decide whether the age-based owner-aware sweep should become a finding (a decision for the owner, not a default).
- **When.** With the next change to the classifier, or before the barrier is declared open on a machine by a clean scan.

## F6 — A registered worktree outside the temp root has no root-trust check (L-7)

- **What.** `wt-git` rows are judged wherever `git worktree list` puts them (capture at `tools/janitor.sh:471-473`, re-check
  `entry_change` at `:731`); `safe_id` and `ROOT_OK` apply to temp-root entries only.
- **Why.** A worktree the caller registered in a directory another user can write can be swapped between the re-check and the git
  call. The caller chose the location; the old janitor had the same residual. Recorded, not fixed.
- **Fix when re-opened.** Either require the worktree's parent to be trusted (`shared_dir_ok`) for a `wt-git` removal, or state the
  residual in the companion as a limit and keep it. Decide first which one; both need a test with the parent-trust seam.
- **When.** Before worktrees are registered under a shared parent folder on a machine several OS users share, or with a
  report of a swapped worktree.

## Definition of Done

- [ ] Each of F1 to F6 is fixed with a RED test observed first, or closed with a recorded decision that it stays a documented limit.
- [ ] The companion and the rule's body records match the code (`node tools/rule-bodies.mjs`).
- [ ] `node tools/leftovers-check.mjs` and `node tools/plan-lifecycle.mjs` are clean; this file is promoted or deleted when the
      last item is closed, and its row in `todo/README.md` goes with it.
