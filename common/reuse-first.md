# Reuse First — look before you build (MANDATORY)

> Before writing anything new — a service, a helper, a script, a test fixture, a prompt, a UI panel —
> first find out what the repository already has for that job. This rule is checked at the START of a
> change, not in review, because by review the duplicate already exists and deleting it costs more than
> never writing it. It extends [development-workflow.md](development-workflow.md) §0, which looks
> OUTWARD at GitHub and package registries; this one looks INWARD, and it comes first: a dependency you
> do not need beats a good one, and a call to code that already exists beats both.

## The three questions, in order

### 1. Can it be reused as it is?

Search before you type, with whatever search the session has. Look for the *capability*, not the name
you were about to give it — the thing you want is often already there under a word you did not think
of. If it exists and fits: **call it.** A second implementation of a capability is a defect from the
moment it compiles, because the two will drift and nothing will notice.

### 2. If it cannot be reused as it is — can it be MADE reusable?

The answer is usually yes, and usually cheap. Prefer, in this order:

1. **Widen the existing thing** — an extra optional parameter, a seam, an overload. Cheapest, keeps one
   implementation.
2. **Extract the shared half** — pull the common core into one unit both callers use. When a helper you
   need is private inside a large class, extracting it IS the work; copying it is not.
3. **Decompose the existing thing** — when it does two jobs and you need one, split it into two named
   units and take the one you need.
4. **Move it to a shared project** — when two projects need it and neither may reference the other, it
   belongs in the common ancestor.

Only after all four are genuinely wrong is a new, separate implementation the right answer — and then
say in your summary why reuse was rejected. (The predecessor programme measured this the hard way: a
process launcher nearly got a third copy before being moved to the shared project, and a duplicated
tool-set had already started to diverge in its defaults before being unified.)

### 3. What is the STYLE of the neighbouring code?

Find the closest existing thing and read it before writing yours.

| What you find | What you do |
|---|---|
| It is **well written** | Follow it. Same shape, same naming, same error handling, same test style. A change that reads like the code around it is a change a reviewer can check. |
| It is **badly written** | Write the NEW code well — never copy a bad pattern for consistency. Then, in your summary: describe the existing code **as it is**, say **how it should be**, and **ask whether to redo it**. Do not silently rewrite it as a side effect of your task, and do not silently imitate it either. |

The asking matters. Rewriting neighbouring code uninvited turns a small change into a large diff nobody
asked to review; imitating bad code spreads it. Naming it and asking is the only move that does neither.

## Never

- Do **not** copy a block of code "for now" intending to unify later. There is no later; the second
  copy is the whole defect.
- Do **not** write a new helper before searching for one — the search costs one tool call.
- Do **not** rewrite neighbouring code you were not asked to change. Name it, propose it, ask.
- Do **not** imitate a pattern you can see is wrong because "everything here does it that way". Write
  the new code well and say what you found.

## Definition of Done

- [ ] The capability was searched for before it was written.
- [ ] Reuse was taken where possible; where it was not, the summary says which of the four widening
      moves was tried and why it failed.
- [ ] New code follows the style of the closest well-written neighbour.
- [ ] Any badly-written neighbour the task touched is described as-is, with a proposal, and the question
      "should this be redone?" is asked rather than answered unilaterally.
