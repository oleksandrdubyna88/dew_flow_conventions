---
id: "common.coai-feature-gate"
load: "conditional"
tasks: ["plan","implement","docs","policy","test","git","pr","release","deploy","dependencies"]
---
<!-- coai-feature v1 -->
## Reviewing a WHOLE feature before it ships

<!-- owns: coai — the MCP server this stage belongs to, named in its tool prefix -->
<!-- owns: mcp__coai__review_feature — a tool name a session types; there is no generic spelling of it -->
<!-- owns: mcp__coai__consult — where a finding you cannot judge goes, and a tool name has no generic spelling -->

> **This extends [coai-review-gate.md](coai-review-gate.md)**, whose rounds each see one slice of a
> plan. The parameters, their limits and what the reviewers are sent are in the tool's own
> description; this rule says when to call it, what to pass, and what each verdict asks of you.

`mcp__coai__review_feature` is the fourth `coai` stage: other vendors' models read EVERY epic of a
plan at once — whether what shipped is what the plan asked for, whether the seams between epics hold,
and what you learned the hard way.

### When

**Once, when a plan of three or more epics is fully implemented, and before its release.** The epics'
pull requests may already be merged. It is not a per-epic step: each epic still goes through its own
plan and code rounds as the review-gate rule says, and this call adds to them rather than replacing
any. A plan of fewer epics (a server setting, three by default) is covered by those code rounds; a call
for it is recorded as `skipped` and blocks nothing, so do not make one.

No `open` first: the review is its own session, keyed by the plan's repository-relative path. Run it
from the checkout that holds the finished feature — the head reviewed is that checkout's HEAD, and
only committed work is read.

### What to pass

- `planPath` — the plan file, repository-relative. It is the review's identity: pass the same value as
  `feature` to `resolve`, `status` and `ask_human`, or they act on another session.
- `baseRef` — the commit the FIRST epic branched from; not the last epic's base, not today's `main`.
  A later base hides the earlier epics from the reviewers.
- `epics` — every epic, each with a summary of what it actually did and its branch or pull request.
  The branch is what lets the stage find the history of a squash-merged epic.
- `lessons` — written by you, and the one part a reviewer cannot get anywhere else: the pitfalls, the
  blockers and how each resolved, and the findings a reviewer of the whole must know — a seam between
  epics, a workaround, something left undone, the rejected finding you are least sure of. All three
  are required. A category with genuinely nothing in it says so AND why, in at least twenty
  characters — never an empty list. Honest beats tidy: a list with no trouble in it hands the
  reviewers nothing to aim at. Never put a secret in it; it leaves this machine.
- `callerModel` — your own model id, exactly as [coai-caller-model.md](coai-caller-model.md) says for
  `open`.

Which reviewers read it is the person's choice — preferably models other than those that wrote,
reviewed and were consulted on the code. Credential-shaped files are never sent to them.

### What each verdict means

- `proceed` → the feature may ship.
- `revise` → `resolve` every finding as at the other stages: accept, or reject with a reason, in THIS
  round. Fix what you accepted and commit it — as new pull requests when the epics are merged. Then:
  - **a second round runs ONLY when round 1 had a reviewer failure, a `blocking` finding came back, or
    the person asks for one** — call again with `again: true` over the new commits;
  - otherwise there is no second round: the resolved findings and their fixes close the review.

  At most two rounds, ever.
- `call_human` → stop the SHIPPING, not the task: surface the open findings and call `ask_human` with
  `feature`. It is also what comes back when every ticked reviewer failed, because an outage must not
  wave a feature through.
- `skipped` → nobody is ticked for features, the stage is switched off, or the plan is too small. It
  never blocks; tell the person the feature review did not run, and why.

`again: true` is also how a fresh review of the same plan starts against a new base or new commits; it
is refused when nothing moved.

A finding you cannot judge — whether it is true here, whether it costs a step or only a sentence — is
what `mcp__coai__consult` is for, before `resolve`, as trigger 5 of the consultant rule describes.

### Nothing checks that you ran it

This rule says how to work, and only that. No check, CI step or count records whether a feature review
happened, and none belongs here: shared rules carry guidance, never enforcement. Not running it is a
decision you report to the person, not a failure some build will catch for you.

### Definition of Done

- [ ] A plan of three or more epics got one `review_feature` call after its last epic and before its
      release.
- [ ] `baseRef` was the first epic's base; every epic was listed with its summary and its branch or
      pull request; the lessons were honest, and each empty category said why.
- [ ] Every finding got an `accept` or a reasoned `reject` through `resolve`, with `feature` set to the
      plan path.
- [ ] A second round ran only for a reviewer failure, a `blocking` finding or the person's request.
- [ ] The summary names the verdict and the reviewer count — and, for `skipped`, why the review did not
      run.
