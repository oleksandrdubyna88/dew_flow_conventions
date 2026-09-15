---
id: "common.pull-requests"
load: "conditional"
tasks: ["git","pr","release"]
---
<!-- owns: coai — only the file name this rule links to; no product sentence belongs in here -->
# Pull requests — `main` is closed; the reviewer's comments are work (MANDATORY)

> Extends [git-workflow.md](git-workflow.md), which governs the COMMIT. This rule governs how a commit
> reaches `main`, and what an automated reviewer's comments oblige you to do. Adopted 2026-09-05 when
> CodeRabbit was connected to the public repositories of this family and `main` was protected on them.

## The rule

1. **Nothing is pushed to `main`.** Not by an agent, not by the operator, not by an admin — the branch
   protection enforces it for admins too. Every change is a branch and a pull request, merged by
   **rebase** (linear history; each commit keeps the message it was written with) or by **squash** when
   a branch is a trail of fix-ups nobody should read. Merge commits are off.
2. **The diff goes through the review gate BEFORE the pull request is opened.** Where the repository
   has a multi-vendor review gate ([coai-review-gate.md](coai-review-gate.md) is the one this family
   runs), the change is not ready for a pull request until its code round has run over the diff and
   every finding has been resolved — accepted and fixed, or rejected with a reason. A review gate is
   not a nicer code review; it is other vendors' models reading the change without your context, and
   it is the one reader that has not already agreed with you.

   **The order is: plan → review → implement → review → pull request.** Opening the pull request
   first and running that review "later" is the same mistake as writing the test after the fix: by then
   the diff is a thing you are defending rather than a thing you are checking. Measured here on
   2026-09-05, and it is why this clause exists: an agent landed more than twenty pull requests in
   one session, every one of them through CI and an automated reviewer, and not one of them through
   the review gate that repository ships.

   A change with no diff to review — a documentation-only edit, a version bump, a workflow a review
   gate cannot run against — says so in the pull request description instead. "Not applicable" written
   down is a decision; silence is an omission.

3. **A pull request is not done when it is opened.** After opening it, come back **about five minutes
   later** and read what arrived: the CI checks, and — where the repository has an automated reviewer
   configured — its summary and every inline comment. Whether one is configured is a fact about that
   repository's checks, visible on the pull request itself; a list of which repositories have one
   would be an inventory maintained here and stale the first time somebody enabled another.
4. **Verify a reviewer's comment before acting on it.** An automated reviewer is a colleague who has
   not run the code. For each comment, first establish whether it is **accurate** (does the code do
   what the comment says?) and **right** (does this repository's rule agree — `CLAUDE.md`,
   `.claude/rules/**`?). Then exactly one of:
   - it is accurate and right → fix it, in a commit on the same branch, and say so in the thread;
   - it is inaccurate or contradicts a rule → reply in the thread with the reason, citing the code or
     the rule, and resolve it. A comment answered with silence is a comment somebody will re-raise.
5. **Every thread is resolved before the merge.** The protection requires conversation resolution; the
   reply above is what resolves it honestly. Resolving a thread without a fix or a reason is the one
   forbidden move.
6. **The pull request description is the record.** What was asked, what shipped, what the tests
   showed (observed output, not "tests pass"), and what the automated reviewer said that was NOT acted
   on and why. The merge commit — rebase or squash — carries that text into `main`'s history.
7. **At most THREE open pull requests per repository, and never more without asking.** Past three, stop
   opening and start landing: the next thing you do is get an open one merged, not open a seventh.
   Opening beyond the cap needs the person's agreement, asked for in one sentence that says what is
   already queued and why this cannot wait behind it.

   **Why a number and not "be reasonable".** A queue of pull requests against one branch is not free
   to hold: every merge makes every other one BEHIND, each rebase re-runs every check, and a shared
   guard like the submodule pin turns one merge into a red build on all the rest. The cost grows with
   the SQUARE of the queue, and it is paid in wall-clock time by whoever is waiting for any single
   change in it. Measured here on 2026-09-05: eighteen open at once across two repositories, six of
   them held for hours by one stale line in a workflow on `main`, and the queue took longer to drain
   than the work in it had taken to write.

   **The number came down from six to three the same evening** (operator, 2026-09-05), and the
   evening is the argument: with six allowed, every merge left five branches behind main, each
   needing a rebase that re-ran every check, and a submodule pin bumped once turned all five red at
   a stroke. Three is small enough that landing one is always cheaper than opening another — which
   is the behaviour the cap exists to produce.

   Six is not a law of nature; it is the largest number that still drains in one pass while somebody
   watches. A repository that genuinely needs more — a migration landing in ordered slices — gets it
   by asking, and the reason goes in the description of the seventh.

8. **Releases still start from tags** (`mcp-v*`, `extension-v*`, `server-v*`), cut on `main` **after**
   the merge, never on a branch.

9. **When two branches block each other, the one that can move carries both changes.** Measured
   2026-09-06: a pin bump could not go green because it inherited a test that had expired overnight,
   and the branch fixing that test could not go green because the pin was stale. Two pull requests,
   each waiting for the other, each re-running its checks on every rebase of a moving `main`. The way
   out is not patience — it is to take the small change into the branch that can pass, say so in the
   message, and close the other as already applied. A deadlock between your own branches is a
   sequencing mistake, not a queue.

> What the reviewer and the scanners REPORT — and the obligation to bring it to zero, or to ask when a
> fix would break the product — is [automated-checks.md](automated-checks.md).

## For an agent working autonomously

The *Work autonomously* order of the review gate names this: open the pull request, wait, read,
verify, fix or answer, resolve, merge, tag. An agent that opens a pull request and moves on has done
half the work and left the other half to the person it was meant to spare.

```bash
gh pr create --fill --base main            # open
sleep 300                                   # let CI and the reviewer arrive
gh pr view --comments                       # read the summary and the threads
gh api repos/{owner}/{repo}/pulls/{n}/comments   # every inline comment, with its path and line
# fix or reply per thread, then:
gh pr merge --rebase --delete-branch        # or --squash for a fix-up trail
```

## Never

- Never push to `main`, and never disable the protection to do it "just this once".
- Never resolve a reviewer's thread without a fix or a written reason.
- Never act on a comment you have not checked against the code and the rules — an automated reviewer
  is confidently wrong at a steady rate, and "the bot said so" is not a reason to change working code.
- Never merge with a red check or an open thread.

## Definition of Done

- [ ] The diff went through the review gate before the pull request was opened, and every finding was
      resolved — or the description says why a review gate does not apply to this change.
- [ ] The change reached `main` through a pull request merged by rebase or squash.
- [ ] Opening it left no more than three pull requests open on that repository — or the person agreed to
      the seventh, and the description says why.
- [ ] About five minutes after opening, the CI checks and the reviewer's comments were read.
- [ ] Every reviewer comment was verified against the code and the rules, then fixed or answered in
      the thread, and the thread resolved.
- [ ] The pull request description records what shipped, what the tests showed, and what was not acted
      on and why.
- [ ] Any release tag was cut on `main` after the merge.

## Mirrors

A shared rule, mounted through the conventions submodule, and it applies **wherever the behaviour it
describes is true**: every clause about an automated reviewer applies in the repositories that have
one, and says nothing in the ones that do not. Which repositories mount this rule at all is listed in
one place, [README.md](../README.md). Enabling a reviewer somewhere new needs no edit here — which is
the point, because an edit here is a commit in six repositories.
