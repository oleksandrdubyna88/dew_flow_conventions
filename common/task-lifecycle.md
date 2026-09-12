---
id: "common.task-lifecycle"
load: "conditional"
tasks: ["inspect","audit","plan","implement","docs","policy","test","git","pr","release","deploy","dependencies","http","gpu","benchmark","logging","storage","ui"]
---
# A task is a worktree, a branch, a pull request, and a release

> This governs the SHAPE of a unit of work from its first command to the deployed result. The commit
> itself is [git-workflow.md](git-workflow.md); the mechanics of a pull request and its reviewer are
> [pull-requests.md](pull-requests.md). This file says where the work happens, who owns it to the
> end, and what has to happen after the merge.
>
> It lists EVERY task rather than living in the always-core, which is capped at 16 KiB and rightly
> so. The effect is the same — the first decision it governs is taken before anything has been
> classified or any file named, and no task escapes it.

## 1. One task, one worktree, one branch (MANDATORY)

**Never work in the main checkout.** Before the first edit of a task, create a worktree of its own
with a branch of its own, and do every step of that task inside it.

```bash
git -C <main-checkout> fetch origin -q
git -C <main-checkout> worktree add <path> -b <type>/<short-name> origin/main
```

`<path>` is outside the repository. `<type>/<short-name>` is the branch, named for the change rather
than for the session.

### Why, and it is not tidiness

Several agents work in this family at once, and they used to share one checkout. Everything below
actually happened, most of it in a single day:

- **`git add -A` committed another session's file.** Two sessions, one working tree: the second one's
  half-finished edit went into the first one's commit. The fix was `reset --soft` and adding files by
  name — a rule that only exists because the tree was shared.
- **A pin bump was silently reverted** the same way, in a worktree whose submodule was behind. The
  next `pin-check` blamed the conventions cascade for something a stray `-A` had done.
- **A branch could not be checked out at all**, because a peer session's worktree was holding it. The
  work had to continue on a differently-named branch and be force-pushed to the original.
- **Three plan-promotion rebases hit the same two index files**, because two sessions were promoting
  plans in parallel and both edited `todo/README.md`. One of those conflicts, taken the obvious way,
  would have resurrected five rows that had just been deleted.

A worktree costs one command and removes every one of those. The checkout you started in stays clean,
which also means `git status` there answers a question about the repository rather than about you.

### Finishing

Remove the worktree when the branch has merged, in the same task:

```bash
git -C <main-checkout> worktree remove <path>
git -C <main-checkout> worktree prune
git -C <main-checkout> branch -D <type>/<short-name>
```

A worktree left behind holds its branch hostage: `gh pr merge --delete-branch` fails on it, and the
next session that wants the name cannot have it.

## 2. The pull request is yours until it is merged (MANDATORY)

Opening a pull request is not delivering the work. **The whole of it belongs to whoever opened it**:
the description, the red check, the reviewer's comments, the threads, the merge.

- **A red check is yours to read and fix**, including one that has nothing to do with your change. A
  stale submodule pin reddens every open pull request in a repository at once; the answer is to fix
  it, not to wait for somebody else to notice.
- **Every reviewer comment is verified against the code and the rules**, then fixed or answered in
  its thread, and the thread resolved. An automated reviewer is confidently wrong at a steady rate,
  and *the bot said so* is not a reason to change working code — but it is also right often enough
  that dismissing it unread is how a real defect ships.
- **You merge it.** A pull request that sits green and unmerged is work nobody has.

The commands and the timing are in [pull-requests.md](pull-requests.md); do not duplicate them here.

## 3. After the merge, ship it (MANDATORY)

A merge is not a delivery either. The moment `main` carries the change, one of these happens, in this
order of preference:

1. **The repository has a release line** — a tag shape, a workflow, a published artefact. Cut the
   release. A version bumped in a manifest is **not** a release: this family shipped 0.31.19, 0.31.20
   and 0.31.21 into a changelog and never tagged any of them, so nobody outside the repository ever
   received three versions' worth of work. Compare the newest tag and the newest published release
   against the manifest before deciding what the next release contains.

   **Then verify the tag actually STARTED something.** A push of several tags at once can create **no**
   workflow events at all — silently, with exit code 0, and with `git push` reporting every tag as
   written, because every tag WAS written. Measured 2026-09-12: four products tagged in one push, zero
   runs, and the repository looked exactly as it does after a successful release until somebody noticed
   nothing had published. GitHub documents the threshold as more than three tags in one push; what was
   measured here is the four-tag case and its silence.

   The threshold is about TAGS IN A PUSH, not about release tags, so a bulk push of any tags a workflow
   listens for is silent in the same way. So **push tags one at a time** — always where a workflow
   triggers on them — and for a release, verify each before pushing the next:

   - **The success criterion is a NEW run whose head SHA is the tag's own commit** — not a non-empty
     listing. A bare `gh run list` shows runs from other refs, and even `gh run list --branch <tag>` can
     show the run from a previous push of that same tag. Match the commit, or you are reading somebody
     else's evidence.
   - **Poll within a bounded window**, because event creation is not instant — and stop at the deadline
     with a stated failure rather than waiting forever, which is how a release procedure hangs.
   - **Recovery, only after the deadline passes with no matching run:** if a run for that tag exists but
     failed, re-run THAT run. Delete and re-push the tag only when no matching run exists at all —
     deleting a tag whose event is merely delayed can publish the same release twice, from two different
     commits, which is worse than the silence you were fixing.
2. **The repository deploys, and has a non-production environment** — dev, stage, test. Deploy there,
   verify the result against that environment, and read its logs before calling it done.
3. **The repository deploys and has exactly ONE environment.** Then that environment is
   **production**, whatever it is called. **Ask the person.** Do not deploy on your own judgement, do
   not treat a single environment as a staging area because it is convenient, and do not skip the
   deploy silently either — say what is waiting and let them decide.
4. **The repository has neither** — say so in your summary, so that "nothing shipped" is a recorded
   fact rather than something nobody noticed.

## Never

- Never start a task's edits in the main checkout because the change looks small. It is the small
  ones that collide, because nobody branches for them.
- Never leave a worktree behind after its branch merges.
- Never open a pull request and move on.
- Never merge with a red check or an open thread — see [pull-requests.md](pull-requests.md).
- Never deploy the only environment a repository has without asking.
- Never call a version bump a release.

## Definition of Done

- [ ] The task ran in its own worktree, on its own branch, created before the first edit.
- [ ] The worktree and the local branch were removed after the merge.
- [ ] Every check was green and every reviewer thread resolved by the person who opened the request.
- [ ] The pull request was merged by whoever opened it.
- [ ] After the merge: a release was cut, or a non-production environment was deployed and verified,
      or the single environment was put to the person as a question — and whichever it was is in the
      summary.
- [ ] Where the outcome above was a release: each tag was pushed alone, and a run whose head SHA is
      that tag's commit was observed to start — not assumed from a green `git push`.
