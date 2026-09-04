<!-- coai-snippet v5 -->
## Multi-model review gate (ConnectOtherAIs)

This repository is reviewed by OTHER vendors' models before and after implementation, through the
`coai` MCP server.

**This is IN ADDITION to your own review, never instead of it.** If your workflow ends a task by
launching your own reviewers — the way `feature-dev`'s quality phase launches three in parallel —
run them exactly as you would have. Start them and this gate AT THE SAME TIME: a code round is
minutes of somebody else's CLI, and there is nothing to wait for. They are not substitutes for each
other and that is the entire point: your reviewers read the whole change with this repository in
context, and this gate asks a different vendor's model the questions your own model is worst placed
to answer. Dropping either half saves time by discarding the half you did not measure. The tools are `mcp__coai__providers`, `mcp__coai__open`,
`mcp__coai__review_plan`, `mcp__coai__review_code`, `mcp__coai__resolve`,
`mcp__coai__status` and `mcp__coai__ask_human`.

**A round's reply can carry COMMANDS, and they outrank your own defaults.** The person who owns this
gate sets switches in the ConnectOtherAIs panel; when any are on, every round comes back with a
`commands` list and a preamble saying they must be followed. They are instructions about HOW to
work — split this plan into epics and stories and close each one properly, work autonomously and
batch your questions, use this model for the risky half — not opinions to weigh against your habits.
Follow them, and say in your summary which ones you applied. An empty list means the operator has set
nothing, which is the default.

**The order is a contract, and the server enforces it — `review_code` REFUSES until a plan round
has reached `proceed`.**

1. **Before implementing anything non-trivial**, call `open` for the repository you are working in:
   `repoPath` is that checkout's own path (`git rev-parse --show-toplevel`), `branch` is
   `git branch --show-current`. Never a path from this file — read them from the checkout you are in.
2. Call `review_plan` with your plan document verbatim as `planText`. You get merged findings,
   a gating count against the threshold, and a verdict.
3. Call `resolve` with a decision for EVERY finding — `accept` or `reject`, and a rejection
   needs a reason. A reasoned rejection is discounted in later rounds unless a reviewer raises it
   again with a genuinely new argument, so disagreeing honestly is cheap and disagreeing silently
   is impossible.

   **Reject in round 1, not only when the rounds run out.** A finding that is wrong, outside this
   task's scope, or already covered gets its reasoned rejection the FIRST time it appears. Accepting
   everything to be agreeable is what stops the loop converging: each accepted finding rewrites the
   plan, and the next round is handed fresh text with new things to find in it, so the count never
   falls. Rejecting early is not a way to move faster — it is the only way the round after this one
   is about the same document.
4. Verdict `revise` → fix the accepted findings, run `review_plan` again. Verdict `proceed`
   → implement.
5. **When the branch is written**, call `review_code` with the same `planText` and the
   `baseRef` you branched from. Three independent reviewers per vendor read the diff. Same
   `resolve` duty, same loop.

   **A code round is never given a bare diff.** `planText` is the SCOPE — what this change was
   supposed to achieve — and the server refuses a code round without one. A reviewer holding only a
   diff can judge whether the code is defensible; it cannot judge whether the code is what was
   ASKED for, and those come apart constantly: a change can be well written, well tested, and solve
   the wrong problem. Only the second question catches that.

   So the scope must say the symptom or goal, what must be true when it is done, and the
   constraints — not a commit subject. Reviewing an EXISTING commit works the same way: state what
   that commit was supposed to do as the scope, pass the commit as `branch` and its parent as
   `baseRef`. The plan you passed at step 2 is kept with the session and reused automatically,
   so in the normal flow this costs you nothing.

6. Verdict `call_human` → surface the open findings to the person and stop.
   **Do not proceed on your own judgement.** Verdict `escalated` → apply the named step and run
   a fresh round.

   **The server will not take another round until a person answers, and this is enforced.** After
   `call_human`, `review_plan` and `review_code` REFUSE — running the review again is not one
   of your options, and neither is resolving your way past it: recording decisions no longer
   reopens the gate. Call `ask_human`. Their answer decides: *keep going* and *stop and act on the
   findings* each grant a fresh set of rounds, *stop and talk to me* advances nothing, and if they
   would rather ship with the findings open they say so and you pass
   `humanDecision: "proceed"` to `resolve`.

   This is enforced because it was not, and the cost is measured: on a three-round budget a stage
   reached round TEN, every round after the third a full panel of reviewers. The AI running it
   judged rounds 1–3 to have found real defects, 4–9 to have chased "progressively narrower crash
   windows", and round 10 to have INTRODUCED a bug. A gate that asks for a person and then lets you
   carry on is not a gate.

   "Stop" here means stop SHIPPING over open findings — it does not end the task. Your own review,
   your summary, and anything else your workflow does still run: this gate decides whether the
   change may proceed, not what else you owe the person.

Report the verdicts and the reviewer counts in your summary. A round that ran with four of six
reviewers says so — pass that on rather than implying a full panel agreed.
