---
id: "common.coai-document-gate"
load: "conditional"
tasks: ["plan","implement","docs","policy","test","git","pr","release","deploy","dependencies"]
---
<!-- coai-document v1 -->
## Reviewing a DOCUMENT rather than a change

> **This extends [coai-review-gate.md](coai-review-gate.md), and it is a separate file because that
> one is frozen.** `tools/rules.test.mjs` hashes all 24 migrated rule bodies against baseline
> `5d6984eb` as evidence that nothing was lost when the rules moved, so adding a section to the gate
> rule turns the suite red. The house precedent — `common/task-lifecycle.md`,
> `common/subagent-models.md` — is a new file that says where it belongs once the inventory retires.
> **Where this belongs then: as a final section of `coai-review-gate.md`, after step 6.**

`mcp__coai__review_document` is ConnectOtherAIs' other gate, and it is a different shape from the
one next door: no plan round before it and no code round after it, because the document IS the work.
Reach for it when what you are producing or checking is a document — a specification, a policy, a
proposal, a brief, a requirements list — rather than a diff.

Everything the review-gate rule says about this being ADDITIONAL to your own review, about the
`commands` a round may carry, and about `call_human` applies here unchanged.

1. `open` for the repository you are working in — `repoPath` is that checkout's own path, `branch`
   is its current branch. A document review still happens IN a repository.
2. `review_document` with the document ONE of two ways, never both:
   - `documentPath` — a file inside that repository, read as UTF-8 text. It is refused if it is
     outside the repository, if it is not text, or if it is larger than the bound; each refusal says
     what to do instead.
   - `documentText` — the document itself, and then `documentName` is REQUIRED. That name is what
     makes a second round be about the same document after you have edited it.

   Plus `purposeText`: what the document is FOR — who has to act on it, what they must be able to do
   after reading it, and what it deliberately does not cover. Required, for the same reason a code
   round requires a scope: a reviewer given only the document can say whether it is well written,
   never whether it does its job, and a specification can be clear, complete, internally consistent
   and about the wrong project.
3. `resolve` with a decision for EVERY finding — **and pass the same `document`**. A document review
   is its own session, keyed by the document rather than by the branch, so one branch holds as many
   of them as you like and `resolve` has to be told which. `status` takes it the same way.
4. Fix what you accepted and run `review_document` again. Editing the document between rounds keeps
   the session: identity is the path, or the name you gave raw text, never the content. A review
   that has FINISHED is re-opened only with `newReview: true`, which starts a fresh review and
   leaves the finished one on the record.

**The reply carries one thing the other gates do not: `notes`** — each reviewer's prose about the
whole document, one entry per reviewer. It gates nothing, and it is never merged: findings are
deduplicated because two vendors agreeing is stronger evidence of one defect, while three vendors'
separate accounts of one document is the whole reason to read them. That is where a summary comes
back, and it is what to pass on when somebody asked what a document says.

Which reviewers run is the operator's choice, in the panel's Document stage: the product ships two —
one that reads for whether the document does its job, one that writes the account — and a person can
add their own, in their own language, with their own prompt.
