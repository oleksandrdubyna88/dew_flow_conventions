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

## A decision applied at SOME of its sites — and it is usually not a security measure (MANDATORY)

[security.md](security.md) carries this shape for PROTECTIVE measures, with the measured table of
escapes and sanitisers applied to the places somebody thought of. It is the same defect for any
decision at all, and the non-protective version is the one that keeps landing, because nothing about
it feels like a security question while you are making it.

Measured 2026-09-02/03 in one repository, in one day, by that product's own review gate:

| the decision | right at | wrong at |
|---|---|---|
| refuse a request with no finding schema instead of sending `{}` | the callee, where it had just been fixed | the CALLER, which kept its own copy of the fallback |
| normalise an endpoint to `/v1` | the panel's probe | the review launch — so the model list looked healthy and every round 404'd |
| the list of runtime names this build knows | the type, and the parser | a third place, the auth arm, which answered `0 reviewer(s)` while `providers` said healthy |

Three of the nine defects that campaign found, and the pattern held for the two before it: a
duplicate-reviewer-key crash from one runtime list in two places, and a surface-name check in three
copies where adding a surface updated two.

**Why it survives review.** The fix is correct. The commit is correct. The file you are looking at is
correct — and the second site is somewhere you have no reason to open, often written by the same
person on the same day. "I remember removing that" is the sentence, and it is worth nothing
([measurement.md](measurement.md) — *a claim about code is settled by opening the file*).

### What to do instead

1. **One road in.** A decision that must hold everywhere belongs in the function everyone calls, not
   in each caller. `LocalRuntime.OpenAiBaseOf` exists because two places were normalising by hand and
   one of them was not.
2. **When you fix a decision, grep for its SHAPE in the same task** — the literal it produces, the
   flag it reads, the fallback value it substitutes — before you call it fixed. Not for the places
   you remember; for the pattern. The enumeration is the deliverable, not the fix.
3. **If the shape spans lines, match across lines.** A line-scan found none of the three-line sites in
   the security audit.
4. **Leave the enumeration behind as a test** where the sites can be named structurally, per
   [testing.md](testing.md) — *a structural test that matches nothing passes forever*.
5. **Say which method you used.** "I looked and it is fine" is worth exactly what the sweep was worth.

## Never

- Do **not** copy a block of code "for now" intending to unify later. There is no later; the second
  copy is the whole defect.
- Do **not** write a new helper before searching for one — the search costs one tool call.
- Do **not** rewrite neighbouring code you were not asked to change. Name it, propose it, ask.
- Do **not** imitate a pattern you can see is wrong because "everything here does it that way". Write
  the new code well and say what you found.
- Do **not** report a decision as fixed before sweeping for its other sites — mechanically, by shape.

## Definition of Done

- [ ] The capability was searched for before it was written.
- [ ] Reuse was taken where possible; where it was not, the summary says which of the four widening
      moves was tried and why it failed.
- [ ] New code follows the style of the closest well-written neighbour.
- [ ] Any badly-written neighbour the task touched is described as-is, with a proposal, and the question
      "should this be redone?" is asked rather than answered unilaterally.
