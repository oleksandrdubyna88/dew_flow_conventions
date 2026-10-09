---
id: "common.coai-feature-gate"
load: "conditional"
tasks: ["plan","implement","docs","policy","test","git","pr","release","deploy","dependencies"]
---
<!-- coai-feature v3 -->
## Reviewing the whole FEATURE before release (ConnectOtherAIs)

<!-- owns: coai — the MCP server this stage belongs to, named in its tool prefix -->
<!-- owns: ConnectOtherAIs — the product that serves the feature stage; a session reads its panel by that name -->
<!-- owns: mcp__coai__review_feature — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__review_code — the stage that covers a smaller plan, and the reason no feature review is owed for it -->
<!-- owns: mcp__coai__resolve — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__status — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__ask_human — a tool name a session types; there is no generic spelling of it -->

`mcp__coai__review_feature` is the review gate's fourth stage. The plan round reviews a plan before it
is built and each code round reviews one epic's diff; by the time the last epic lands, every reviewer
has only ever seen a slice. This round sends reviewers the WHOLE feature — the plan, the epics, what you
learned the hard way, the server's own history of this work and an outline of every file the plan
changed — so they can judge whether what shipped is what the plan asked for and whether the seams
between epics hold.

**When — once, at the very end, and only for a plan of THREE or more epics.** Call it after every epic
is built — their pull requests may already be merged — and before the release. Not per epic, and not
for a plan of one or two epics: that work is covered by `mcp__coai__review_code`, and the server
records a smaller plan as `skipped` rather than reviewing it.

**Where to call it from.** Run it from the checkout that holds the finished feature — the head reviewed
is that checkout's HEAD, and only committed work is read. When the epics are merged, that means a
checkout of the merged branch, pulled. No argument chooses another head: `head` is optional and only
checks you are where you think you are, so one naming any other commit is refused rather than reviewed.

**What to pass.** It needs no `open` — it keeps its own session, keyed by the plan.

- `repoPath` — this checkout's own top level (`git rev-parse --show-toplevel`).
- `planPath` — the plan document's path, relative to the repository. It is the session's identity:
  pass the same path every time for the same plan.
- `baseRef` — the commit BEFORE the first epic, so the range covers all of the work and nothing older.
- `epics` — a JSON list, one entry per epic: `title`, `summary`, and its `branch` and `pr` when you have
  them. The `branch` is what lets the server find the history of an epic that was squash-merged.
- `lessons` — a JSON object with `pitfalls`, `blockers` and `findings`, each non-empty: what went wrong
  or nearly wrong and where, what blocked and how it resolved (or that it is still open), and what a
  reviewer of the whole feature must know — a seam between epics, a workaround, something deliberately
  left undone, the rejected finding you are least sure of. When an array genuinely has nothing,
  write "none" with the reason, never `[]` — the server refuses an empty one. Never put a secret in
  it: it leaves this machine.
- `callerModel` — your own model id, as the caller rule asks of `open`.

**What the verdicts mean.** One round is the budget. A second runs only on one of three grounds — a
reviewer failure, a `blocking` finding, or the person asking for it — and no request of yours adds a
third.

- `skipped` does NOT block the release. Nobody could review it — no vendor ticked for features, the
  stage switched off, or a plan under three epics. Tell the person the feature review did not run, and
  the reason the reply gives, then carry on.
- `proceed` or `good_enough` — resolve every finding; the review closes on resolve, and no second round
  is owed — one runs later only if the person asks for it (below). On `good_enough` the findings gate
  but none is blocking: apply the ones that are true and useful as NEW pull requests, never by
  rewriting merged epics, and reject the rest with reasons. Your summary says what you took and what
  you declined.
- `revise` comes back only with a ground for the second round, and the reply names which:
  - **a `blocking` finding** — resolve every finding, land the accepted fixes as NEW pull requests, then
    call `mcp__coai__review_feature` again with `again: true` from the checkout once it holds them: its
    HEAD is what the second round reads;
  - **a reviewer failure** — resolve the findings of the reviewers that answered, then call again: it
    needs no new commits and asks only the reviewers that failed.
- **The person's request** is the third ground, and only theirs: after the first round, ask with
  `mcp__coai__ask_human` and `feature`. Your own `again: true` is refused over the same base until they
  answer; once they say to keep going, call `mcp__coai__review_feature` again with `again: true` — it
  needs no new commit.
- `call_human` stops the release. It is also what a second round that still carries a `blocking`
  finding, or fails again, comes back with. Surface the open findings and call `mcp__coai__ask_human`;
  only the person's answer moves it on.
- `again: true` with a DIFFERENT `baseRef` starts a fresh review of the same plan — a release branch, a
  backport — and the earlier rounds stay on the record.

**Resolving and re-orienting.** `mcp__coai__resolve` takes a decision for EVERY finding exactly as at
the other gates, and — because this session is keyed by the plan rather than the branch — it needs
`feature: <planPath>`; so do `mcp__coai__status` and `mcp__coai__ask_human`. Everything the review-gate
rule says about this being additional to your own review, about the `commands` a reply may carry and
about `call_human` applies here unchanged.

### Definition of Done

- [ ] A plan of three or more epics got one `mcp__coai__review_feature` call after its last epic and
      before its release, from the checkout that holds it.
- [ ] `baseRef` was the commit before the first epic; every epic was listed with its summary and its
      branch or pull request; the lessons were honest, and each empty category said why.
- [ ] Every finding got an accept or a reasoned reject through `mcp__coai__resolve`, with `feature` set
      to the plan path.
- [ ] A second round ran only for a reviewer failure, a `blocking` finding or the person's request.
- [ ] The summary names the verdict and the reviewer count — and, for `skipped`, why the review did not
      run.
