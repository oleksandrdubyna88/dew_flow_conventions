# PLAN — migrate consumers to one shared instruction source

> Status: **IN PROGRESS, 2026-09-10.** Scope: S2 of [shared rules](PLAN_shared_rules_claude_codex.md); S1 resolver is implemented, consumer rollout remains S3/S4.

Consumers currently keep their canonical project instructions in CLAUDE.md and mount the
entire conventions repository under Claude's automatic rule tree. Both agents need one
project body and one explicitly selected shared source. S1 provides the resolver; S2 must
make the transition reproducible and verify the actual mounted version rather than only
source-repository mode.

Baseline: `d66ab1e`. Relevant implementation: `tools/lib/rule-cli.mjs` (bootstrap and gitlink
verification), `tools/lib/rule-catalog.mjs` (metadata), `tools/gate-snippet-check.mjs`
(currently recognizes the old rule trees), `ROLLOUT.md` and `POST_DEPLOY.md` (old commands).

Plan review: session `3f126e89`, all 3 reviewers answered, `good_enough`; all 15 findings
resolved. Apply will create a fresh disposable worktree from the requested base commit,
leaving the source checkout untouched, including foreign changes. Dry-run reads committed
inputs and validates links/selected SHA before mutations. Partial failures report the output
worktree and base for recovery; no automatic hard reset is run against a caller checkout.
Operational rewrite allowlist: root README/POST_DEPLOY, .github/workflows and explicit script
paths. Host config references to the old mount and untracked/ignored policy copies are refused.
Smoke uses disposable checkouts, restricted tools/sandbox, tree checks and explicit timeout
outcomes; it neither retries quota errors nor claims completed behavior from reads alone.

Build order:

1. Add a migration tool with dry-run by default and explicit apply. Require a clean isolated
   checkout and a selected conventions commit. Move the one existing submodule with Git,
   preserve its URL and section name, move CLAUDE body to PROJECT, rebase Markdown links,
   move local rules and add applicability metadata. Rewrite tracked operational old-mount
   references with an explicit report; do not rewrite historical research citations.
   Preserve all host settings, ignore files, code dependencies and foreign work.
2. Extend the existing gate-copy checker to recognize the neutral mount, PROJECT and local
   rules; missing neutral mounts must fail and duplicates must be detected. Update applicable
   canonical operational command paths and record these path-only body migrations explicitly
   in the historical inventory check.
3. Provide a bounded smoke harness that invokes the installed native agent CLI in read-only
   inspection tasks, validates actual source-read outputs against expected hashes and records
   completion separately from source reads. Do not bypass permissions, install/login to Codex,
   or silently replace a failed/limited model. Keep model smoke outside ordinary CI.
4. Test a real Git consumer: old layout → dry-run unchanged → apply → matching gitlink →
   complete read; wrong/dirty/missing submodule failures; nested/Unicode paths; rollback and
   clone with submodule initialization. Update Node provisioning and commands in rollout docs.

Acceptance: one canonical project text, one conventions checkout, no legacy auto-loaded
copy, settings and code pins unchanged, old/new references in the migration report, actual
CLI consumer tests pass on Windows/WSL, existing suite stays green. Missing live-agent cells
are reported as incomplete and do not turn deterministic checks into behavioral claims.

S3/S4 will apply the reviewed tool to six consumers in isolated worktrees and publish migration
PRs. Consumer-specific product adapters (notably ConnectOtherAIs' review-context collector)
are verified in those stories; S2 does not claim those consumers migrated.

Budgets: migration is a one-shot Git operation with no background service/cache. Its path/hash
report is capped at 250 KiB, with room for status/error within 256 KiB. Model smoke has
180-second process-group/job deadlines and 256 KiB in-memory output per cell. Implementation
deviation: full transcripts are not persisted, so the proposed rolling trace retention is
unnecessary. Two fixed latest-result slots per worktree hold at most 32 KiB each, atomically
replaced; incomplete owner state remains visible. Archive reviewed evidence explicitly in
research. No automatic retries or account changes occur after quota errors.

Implementation observations: real Git clone/rollback and migration tests pass on Windows/WSL.
Empty nested legacy directories and duplicate mounts were reproduced as failing checks before
fixing. Windows Process.Start did not inherit the supervisor's job in this environment; the
launcher now assigns the child atomically through the Windows job-list creation attribute.
The process regression observes both process disappearance and elapsed time.

The coai canary worktree has been prepared at `D:/rsd/.worktrees/shared-rules/coai` from the
recorded migration journal base; product adapters and CI provisioning are still S3 work.
The final code-gate review and native CLI evidence are in progress. No consumer is published.
