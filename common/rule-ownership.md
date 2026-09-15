---
id: "common.rule-ownership"
load: "conditional"
tasks: ["policy","docs"]
paths: ["common/*.md","csharp/*.md","rust/*.md","typescript/*.md"]
---
# A shared rule names no product (MANDATORY)

> This repository holds what several products share — how to test, how to write code, how to deploy,
> how to verify. It does not hold anything true of only one of them.
>
> The boundary had drifted quietly. Measured 2026-09-14: **53 references to a named repository across
> 19 of 27 rule files**, 27 of them in one rule. A rule about background workers read as a rule about
> one daemon; a citation went stale the first time somebody renamed the class it pointed at; and four
> hand-maintained copies of the same list of repositories sat in four different files.
>
> This extends [knowledge-base.md](knowledge-base.md) § *Shortening a rule drops the caveat*, whose
> last bullet already says it: **name no version, sha, count or path that moves**. A repository name
> moves exactly the way a sha does — repositories are renamed, split, archived and added — so a rule
> that names one is a rule somebody must edit when something it does not govern changes.

## The test, and it takes one second

**Would another repository still need this sentence if the named one did not exist?**

- **Yes** — the sentence is shared. Then write it without the name.
- **No** — it belongs to the repository that owns it, and it goes there.

Apply it to the SENTENCE, not to the file. A shared rule carrying one product-specific paragraph is a
shared rule with a paragraph in the wrong repository — and that paragraph is the one that will be
wrong first, because nobody who changes the product comes here to update it.

## Evidence keeps its story and loses its address

Nothing here asks you to delete the incident that made a rule. The evidence is why the rule is
believed; a rule stripped of it is a preference, and the next person argues it away. **Anonymise in
place, and keep the date.**

<!-- owns: dew_flow_rag_qln — the before column has to show the real shape this rule forbids -->
<!-- owns: dew_flow_creds_for_devs — the before column has to show the real shape this rule forbids -->
<!-- owns: the benchmark — the before column has to show the real shape this rule forbids -->

| instead of | write |
|---|---|
| `dew_flow_rag_qln · src/…/IndexPassWorker.cs:53` | a .NET indexing worker here, 2026-08-16 |
| "measured in `dew_flow_creds_for_devs`" | "measured in one repository here, 2026-09-03" |
| "the benchmark's contract refused a funnel" | "a measuring harness's contract refused a funnel it did not know" |

What survives: what happened, what it cost, when, and enough of the shape to recognise it in your own
code. What goes: the repository, the path, the line. The date is what keeps the claim checkable —
[reliability.md](reliability.md) says the same for its own citations: they are evidence **as of a
date**, never live pointers, and "correcting" one into today's code is not an improvement.

This is already the house style where it was got right. [task-lifecycle.md](task-lifecycle.md) lists
four incidents from a single day and names no repository; [reuse-first.md](reuse-first.md) records a
process launcher that nearly got a third copy without saying whose. Both read as instructions rather
than as somebody else's changelog.

## Where product-specific material goes instead

| The repository | Where its own rules live |
|---|---|
| Migrated to `.agents/` | `.agents/rules/**`, with an id starting `local.` — the loader requires that prefix and refuses anything else |
| Not migrated yet | its own committed `CLAUDE.md`, until its migration lands |

A local rule may name its own product freely: that is the entire point of the split. It may also
EXTEND a shared rule — say which one it narrows, and narrow it. It may never restate one: a consumer
carrying its own copy of a shared rule is what [`gate-snippet-check.mjs`](../tools/gate-snippet-check.mjs)
fails the build over, because a copy is a thing that drifts while looking identical.

**This rule governs the shared corpus only.** Its `paths` deliberately do not match
`.agents/rules/**`: a rule saying "name no product" has no business loading while somebody edits a
repository's own local rules, where naming the product is the whole job. It would be read as an
instruction to strip exactly the context those files exist to hold.

### The one hard constraint

**A shared rule may never `depends:` on a `local.*` id.** The dependency runs the wrong way: a shared
rule that needs a repository-local one resolves only in the repositories that happen to have it, and
fails everywhere else with `Missing rule dependency: local.x` — a whole-catalog error that stops rule
loading entirely, not a missing paragraph. If a shared rule genuinely needs something a local rule
holds, the thing it needs is shared, and it belongs in this file's own body.

Stated once, in the only direction that works: **local may depend on shared; shared never on local.**

## When the product name IS the instruction

Some names cannot be generalised, because removing them leaves a sentence nobody can act on. Those
are allowed, and they are **declared** — in the file that needs them, with the reason:

```
<!-- owns: coai — the MCP tool names a session must type; there is no generic form -->
```

One marker per token. **A marker without a reason is refused**, because the reason is the whole
difference between a decision and an allowlist somebody grew.

<!-- owns: coai — the containment example needs the real pair; an invented one would not show it -->
<!-- owns: mcp__coai__open — the other half of that pair, and a tool name has no generic spelling -->

The token is matched **exactly**. `coai` does not cover `mcp__coai__open`: a tool name is a different
name and gets its own decision, so a file using six tools carries six markers and every one of them is
visible in the diff. Substring matching was the first version of this, and it made a perfectly
well-formed `<!-- owns: e — … -->` a licence for every `dew_flow_*` name there is.

Three kinds qualify:

<!-- owns: mcp__coai__review_plan — the example has to be a real tool name to mean anything -->
1. **A tool surface every repository calls.** `mcp__coai__review_plan` is a name a session must type;
   there is no generic spelling of it.
2. **A shared service hosted by one repository.** The GPU lease has one server because the machine has
   one card. Every consumer takes the lease; the address is a fact about the family's hardware.
3. **The family's own brand.** `AddDewFlowLogging`, `<Repo>.ServiceDefaults`, `logs/{yyyy-MM-dd}/…` —
   these name a contract every repository implements, which is the opposite of product-specific.

A name that merely *would be inconvenient* to generalise is not one of these. Write the shape, and
leave the example in the repository that owns it.

<!-- owns: the sidecar — the sentence below has to show the definite form to explain the difference -->

**What the check actually looks for** is in one place, so nobody has to guess: the patterns at the top
of [`tools/ownership-check.mjs`](../tools/ownership-check.mjs) — a `dew_flow_*` repository name, an
`mcp__*__*` tool name, a handful of product words, and a short list of ambiguous nouns (`sidecar`,
`benchmark`, `daemon`, `extension`, `panel`, `broker`, `vault`, `crate`, `gate`) matched **only**
behind `the`, `its` or `our`. The determiner is the signal: measured over this corpus, the definite
form is nearly always a product reference and the indefinite form is always generic, which is why
*"a sidecar process"* is legal prose and *"the sidecar"* is a finding.

## Never

- Never name a repository, a repository path or a line number in a shared rule. Anonymise and date it.
- Never delete the evidence to satisfy this rule. A rule with no measurement behind it is the next
  thing somebody argues away.
- Never maintain a list of repositories inside a rule. The estate is listed in exactly one place
  ([README.md](../README.md) § *Consumers*); a rule points at it and states the BEHAVIOUR that applies
  wherever it is true.
- Never add a product-specific paragraph "because it is a good example".
- Never make a shared rule `depends:` on a `local.*` id.
- Never add an `owns:` marker to avoid a rewrite. It is for a name that cannot be generalised, not for
  one you did not feel like generalising.

## Definition of Done

- [ ] Every sentence added to a shared rule passed the one-second test.
- [ ] Every citation names a KIND of host and a DATE — never a repository, a path or a line.
- [ ] Anything that failed the test moved to the owning repository, in the same task.
- [ ] No shared rule `depends:` on a `local.*` id.
- [ ] Every surviving product name carries an `<!-- owns: … — why -->` marker in its own file.
- [ ] `node tools/ownership-check.mjs` passes.
