# PLAN — three rules from the 1.7.0 release of `dew_flow_creds_for_devs`

> Status: **IMPLEMENTED, 2026-09-12.** Scope: three rules from one release, plus one paragraph on
> release tags. Shipped in pull request #24.
>
> Related docs: [common/reliability.md](../common/reliability.md),
> [common/testing.md](../common/testing.md), [common/task-lifecycle.md](../common/task-lifecycle.md).

> **Placement changed during implementation — see *Deviation* below.** The two big rules were planned as
> new SECTIONS inside `reliability.md` and `testing.md`. Both of those files are frozen by the migration
> evidence in `shared-rules-migration-map.json`, so they became two new rule files instead:
> [../common/platform-limits.md](../common/platform-limits.md) and
> [../common/generated-code-tests.md](../common/generated-code-tests.md).
>
> **What else shipped differently from this text.** Two coai rounds and CodeRabbit moved four things the
> plan had wrong or too loose, and each correction is worth more than the original wording:
>
> - The multibyte fixture example was arithmetically WRONG — 100 characters with four two-byte
>   characters is 104 bytes and is not refused at a 107-byte limit. The rule now carries the actual
>   probe, and DEFINES the refused fixture as the accepted character count carrying one multi-byte
>   character, the only shape that can distinguish the two readings.
> - `IsMacOS() ? 103 : 107` — the line this plan held up as the model — hands every future platform the
>   Linux number unprobed. It now appears as the WRONG spelling, against an explicit per-platform map
>   resolved where the adapter is constructed.
> - "Hermetic" was an outcome with no mechanism; it is deny-by-default with a hard timeout, and the
>   carve-out for shell commands was narrowed, because a shell command usually CAN be sandboxed and an
>   argv assertion cannot see quoting, expansion or exit status.
> - The tag rule's first draft could accept the wrong run, and its recovery could publish twice. A head
>   SHA does not identify a run; the criterion is an unseen run id from the release workflow on event
>   `push` for `refs/tags/<tag>`, and delete-and-re-push now requires the person's go-ahead plus an
>   idempotent publish step.

## Where this comes from

Nine issues were closed and four products released in `dew_flow_creds_for_devs` on 2026-09-11/12. Three
of the defects found along the way were not one-off mistakes — each one was reachable by a whole class
of change, and in each case the existing rules would not have stopped it. This plan writes those three
down. Everything cited below was observed in that run; nothing here is hypothetical.

**The code is already shipped.** Every fix named below merged into `dew_flow_creds_for_devs` on
2026-09-12 and released — `MaxSocketPathBytes` and its three boundary tests in
`src_cli/src/AgentRelay.cs` and `src_cli/tests/AgentRelayTests.cs` (PR #85), the DOM harness in
`src_vs_code/src/test/miniDom.ts` (PR #80), the macOS matrix in `.github/workflows/ci-clients.yml`
(PR #85). Each carried its own Definition of Done in its own pull request. This plan's deliverable is
RULE TEXT in this repository, so that the next occurrence of each class is caught by a rule rather than
by a failed release. A conventions plan cannot and does not assert the contents of a consumer checkout.

| # | What happened | Cost | Where the rule goes |
|---|---|---|---|
| 1 | `UnixDomainSocketEndPoint` refused a path on macOS and the exception escaped every guard | `creds` 0.1.6 failed both macOS legs of a four-product release | `common/platform-limits.md` §1 |
| 2 | A webview page-script was painted without the class its colours hang on; ~4000 string-matching tests could not see it | a user-visible bug shipped and had to be found by hand | `common/generated-code-tests.md` |
| 3 | macOS was built ONLY by the release workflow, never by a pull request | defect 1 was structurally unfindable before the tag | `common/platform-limits.md` §2 |
| 3b | Four tags pushed at once produced zero workflow runs | the release silently did not happen | `common/task-lifecycle.md` §3.1, one paragraph |

## The three rules

### 1. `common/reliability.md` — "A platform limit is the kernel's number, in the kernel's unit"

Placed after *Boundary numbers are clamped*, which it extends: that section governs numbers a CLIENT
sends, this one governs numbers the OPERATING SYSTEM imposes.

Four parts, each one a distinct failure observed in the same defect:

1. **The kernel counts bytes, and the documented number is the FIELD, not the limit.** Every write-up
   of `sun_path` says "104 on macOS, 108 on Linux" and .NET's own exception message names those
   numbers; a probe says the longest ACCEPTED ASCII path is **107** on Linux (the NUL terminator), and
   the same CHARACTER count carrying one two-byte character — 108 bytes — is refused. Read the limit off
   a probe you ran. **The guard counts encoded bytes** —
   `Encoding.UTF8.GetByteCount(path)` against the probed maximum, never `string.Length`, which passes a
   multibyte path the constructor then refuses. The probed maximum already accounts for the terminator,
   so it is not subtracted a second time.
2. **A predicate never leaks the argument validation of the library under it.** `bool IsStaleAsync` and
   a `ConnectOrNull` helper guarded six exception types; the constructor throws
   `ArgumentOutOfRangeException`, which is none of them, *before* any connection is attempted — so the
   one input the guard existed for took the process down. Whatever a signature promises an answer for,
   it answers for every input it accepts.
3. **The boundary is tested deliberately, and the fixture can tell the two readings apart.** Largest
   accepted, first refused, and the user-facing message — and the refused fixture is the ACCEPTED
   character count carrying one multi-byte character, asserted to differ in byte count from character
   count. An all-ASCII fixture passes identically under the byte reading and the character reading, so
   it cannot fail when the code holds the wrong one.
4. **One immutable constant is the source of truth** — in the adapter that owns the resource, reachable
   by every guard, with every user-facing message naming the limit derived from it and no literal left
   at a call site. Platforms are mapped EXPLICITLY and an unmeasured one fails closed:
   `IsMacOS() ? 103 : 107` silently hands Windows or a BSD the Linux number with no probe behind it.

Parts 1–3 restate, with the measurement attached, the three conclusions the operator drew from the
incident on 2026-09-12 (platform-limit isolation, strict exception contracts, deliberate boundary
tests). Part 4 is the placement that makes 1 checkable.

### 2. `common/testing.md` — "Code you GENERATE is executed by the test, never string-matched"

Placed after *A test can only inspect what is PRESENT*, whose subject is the same: an assertion that
cannot fail.

Three parts:

1. **A string assertion cannot see meaning.** The generated script contained everything it was supposed
   to contain and was still wrong as a program. If the artefact is executable — a page script, a
   generated statement, a shell command, a config the product parses — the test runs it. About a
   hundred lines of `node:vm` sandbox converted this class of bug from invisible to red. **Bounded, deny
   by default:** cleared environment, an allowlist of globals, no network or child processes, an
   isolated temporary directory, and a hard timeout with memory and output bounds — a generated
   `while (true) {}` must fail the test, not hang the suite. Where those limits cannot be enforced, and
   a generated shell command is the case that cannot, assert over the PARSED form — the argv array, the
   AST, the parsed config — rather than over a run.
2. **A pattern matched against a WHOLE composite passes on the wrong occurrence.**
   `assert.match(script, /refreshMix\(\)/)` matched the function's own definition, three hundred lines
   below the handler that was supposed to call it — green with the call deleted. Match the smallest
   slice that can contain the thing, then delete the thing and watch it go red.
3. **The harness is code under test.** This one shipped two defects of its own: `querySelector`
   returning `undefined` where a DOM returns `null` (so every `!== null` guard in the product passed
   against unrouted code), and a bare tag name read as a class. A fake that is wrong in the permissive
   direction turns a suite green. So the fake gets its OWN tests, against the documented contract of the
   API it stands in for — nullability included — and the standing constraint is that a fake may be
   STRICTER than the real thing and never more permissive.

### 3. `common/testing.md` — "A platform that is only BUILT during a release is an untested platform"

Placed immediately after *A check that only runs during a release has never run*, which it generalises
from a check to a whole leg.

The rule is the matrix, not the tag: every platform a repository ships a binary for runs its tests on a
pull request. Where a full matrix is genuinely too expensive, the split is by COMPONENT and is stated —
the sanctioned narrowing is a written MAPPING from every shipped binary-and-platform pair to the
components tested for it on a pull request — "too expensive" is not a reason, because nothing can check
it. Here the three client components gained `macos-latest` and the server and vault did not, because
they ship as Linux containers and no macOS binary of them exists to protect.

Two traps, both met while fixing it:

- **A path filter is a second thing to keep true.** Written from memory as `src/cli/**` against
  directories actually named `src_cli`, it matches nothing, the job never runs, and a job that never
  ran looks exactly like a job that passed. And a filter naming one component's directory skips a change
  to the SHARED code that component links, which is where a platform adapter lives. A filter must cover
  every path that can affect the binary, or the job runs unfiltered.
- **Read the price from the account you are actually on.** The 10× cost of a macOS minute is a fact
  about PRIVATE repositories. Public ones get the runners free, which turns careful path-filtering into
  complexity bought with nothing.

### 3b. `common/task-lifecycle.md` §3.1 — verify the tag STARTED something

One paragraph: pushing more than three tags in one `git push` creates no workflow events at all —
silent, exit code 0. Four products were tagged in one push on 2026-09-12 and nothing ran. Push tags one
at a time, and verify each before the next. The success criterion is a NEW run whose head SHA is that
tag's own commit — not a non-empty listing, because even `gh run list --branch <tag>` can show the run
from a previous push of the same tag. Poll within a bounded window and stop at the deadline with a
stated failure. Recovery only after that: re-run an existing failed run, and delete-and-re-push only
when no matching run exists at all, because deleting a tag whose event is merely delayed can publish
the same release twice from two different commits.

## Build order

1. `common/platform-limits.md` — new rule file: rules 1 and 3, with frontmatter and a DoD.
2. `common/generated-code-tests.md` — new rule file: rule 2, with frontmatter and a DoD.
3. `common/task-lifecycle.md` — the paragraph in §3.1; add one DoD line.
4. `npm test` and `npm run check` in the conventions checkout.
5. **Ask the operator the cascade question BEFORE opening the pull request**, and record the answer in
   the pull request description. A decision recorded after the merge is a decision that can be skipped.
6. Pull request.

The Definition-of-Done line added in step 3 is a bullet inside that file's existing
`## Definition of Done` section — prose, not a schema-indexed item. Steps 1 and 2 introduce two new
rule ids, which the resolver discovers from the folder; there is no central index of rule files to
update, and `research/shared-rules-migration-map.json` inventories the ORIGINAL 24 and is not extended
by new rules.

## Deviation — why two new files instead of two new sections

`tools/rules.test.mjs` asserts that every one of the 24 migrated rule bodies still hashes to the
SHA-256 recorded against baseline commit `5d6984eb`, and that its heading list is unchanged. That is
migration evidence: it exists to prove nothing was lost when the rules moved, and the Claude/Codex
migration is still open. `common/reliability.md` and `common/testing.md` are both in that inventory, so
adding a section to either turns the suite red.

Three ways out, and only one of them is honest:

- **Rewrite the inventory** with fresh hashes. This destroys the evidence the test exists to provide and
  makes it tautological from then on — the forbidden move in
  [automated-checks.md](../common/automated-checks.md): never weaken a check to make it green.
- **Change the assertion** from equality to containment, so bodies may grow but not shrink. Defensible,
  and arguably the right long-term shape — but it is a change to somebody else's evidence discipline
  made as a side effect of an unrelated task, and it belongs to the operator, not to this plan.
- **Put the new material in new rule files.** Which is also the house precedent: every rule change since
  the baseline — `common/task-lifecycle.md`, `common/subagent-models.md` — has been a new file, and none
  has edited one of the 24.

The third was taken. Each new file says in its header which frozen section it extends and where it
belongs once the inventory retires, so the eventual merge is a recorded move rather than a rediscovery.
`common/task-lifecycle.md` is NOT in the inventory, so rule 3b was added to it as planned.

## Test plan

The conventions repository's own suite is what governs here:

- `npm test` — the rules schema and catalog tests, including the per-file metadata and payload budgets
  (2 KiB metadata, 256 KiB per source). Three added sections must not push a file past a budget.
- `npm run check` — the resolver check over this repo.
- Both must be run from the worktree, not the primary checkout.

Two new `id`s are introduced; the resolver discovers them from the folder, so no central catalog
registration and no consumer-side resolver change is required.

**What this suite does NOT prove, stated so nobody reads green as more than it is:** it validates
structure, not prose. It cannot tell whether a number written in a rule is true. So the numbers in rule
1 were taken from a live .NET probe rather than from documentation or from an exception message —
`largest accepted ASCII length: 107`, and the same CHARACTER count carrying one two-byte character
(108 bytes) `accepted=False`. That probe is the evidence for 103/107; the suite is not.

## Definition of Done

- [ ] The three rules exist, each naming the measurement that produced it.
- [ ] Each file carries a matching Definition of Done — a rule with no DoD entry is a rule nobody checks.
- [ ] No file in `research/shared-rules-migration-map.json` was edited, and its test still passes
      against the original baseline hashes.
- [ ] `npm test` and `npm run check` pass in the worktree.
- [ ] The coai gate reached `proceed` on this plan and on the code.
- [ ] The pull request is merged and this plan is promoted to `research/`.
- [ ] The cascade question was put to the operator BEFORE the pull request opened, and their answer is
      in its description — either the six consumers are bumped, or it says which were not, and why.

## Open tail — the cascade

A conventions commit costs a pin bump in six consumers. The operator's standing instruction from
2026-09-12 was to bump `dew_flow_creds_for_devs` only and leave the rest. That decision belongs to the
operator each time, not to this plan; the plan's obligation is to ASK and to record the answer rather
than to cascade silently or to skip silently.

**The answer taken for this change, as a stated assumption.** The operator's standing instruction from
2026-09-12 was to bump `dew_flow_creds_for_devs` only and leave the other five. This change proceeds on
that same answer rather than blocking on a fresh one: creds_for_devs is bumped, the other five consumers
stay on their current pins and are listed as pending in the summary. If that is wrong, the fix is one
cascade run and nothing here depends on the order.

**Two candidate tools, deliberately not built here.** A reviewer asked for a checker that reads every
consumer's `.github/workflows` and asserts a pull-request job per platform each repository ships a
binary for — the same shape as `tools/pin-check.mjs` and `tools/scenario-check.mjs`. The code round
asked for a second one: a check tying each extension file to the frozen section it will merge into, so
the two cannot drift while the migration inventory stands. Both are tools and a plan of their own, not
rules, and building either inside a rules-text change would be the scope creep the gate is meant to
catch. Recorded here so they are declined on the record rather than dropped.
