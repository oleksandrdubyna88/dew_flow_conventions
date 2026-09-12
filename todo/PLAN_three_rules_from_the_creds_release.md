# PLAN — three rules from the 1.7.0 release of `dew_flow_creds_for_devs`

> Status: **plan only, nothing implemented yet.** Scope: three rules from one release, plus one
> paragraph on release tags.
>
> Related docs: [common/reliability.md](../common/reliability.md),
> [common/testing.md](../common/testing.md), [common/task-lifecycle.md](../common/task-lifecycle.md).

> **Placement changed during implementation — see *Deviation* below.** The two big rules were planned as
> new SECTIONS inside `reliability.md` and `testing.md`. Both of those files are frozen by the migration
> evidence in `research/shared-rules-migration-map.json`, so they became two new rule files instead.

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
   a 100-character path holding four two-byte characters is refused while a 107-character ASCII path is
   not. Read the limit off a probe you ran. **The guard counts encoded bytes** —
   `Encoding.UTF8.GetByteCount(path)` against the probed maximum, never `string.Length`, which passes a
   multibyte path the constructor then refuses. The probed maximum already accounts for the terminator,
   so it is not subtracted a second time.
2. **A predicate never leaks the argument validation of the library under it.** `bool IsStaleAsync` and
   a `ConnectOrNull` helper guarded six exception types; the constructor throws
   `ArgumentOutOfRangeException`, which is none of them, *before* any connection is attempted — so the
   one input the guard existed for took the process down. Whatever a signature promises an answer for,
   it answers for every input it accepts.
3. **The boundary is tested deliberately, and the fixture can tell the two readings apart.** Largest
   accepted, first refused, and the user-facing message. An ASCII fixture passes identically under the
   byte reading and the character reading, so it cannot fail when the code holds the wrong one.
4. **One named thing owns the platform's answer** — `MaxSocketPathBytes` in the adapter that owns the
   socket, not an `if` per call site. And every guard on that limit READS it: a constant no call site
   consults is decoration, and the call site that kept its own literal is the one that will be wrong.

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
   hundred lines of `node:vm` sandbox converted this class of bug from invisible to red. **Bounded:**
   the execution is hermetic — no secrets, no network, no destructive filesystem access. Where that
   cannot be arranged, and a generated shell command is the case that cannot, assert over the PARSED
   form — the argv array, the AST, the parsed config — rather than over a run.
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
here the three client components gained `macos-latest` and the server and vault did not, because they
ship as Linux containers.

Two traps, both met while fixing it:

- **A path filter is a second thing to keep true.** Written from memory as `src/cli/**` against
  directories actually named `src_cli`, it matches nothing, the job never runs, and a job that never
  ran looks exactly like a job that passed. Filter only when the cost is real; when you do, assert the
  filter matches a file that exists.
- **Read the price from the account you are actually on.** The 10× cost of a macOS minute is a fact
  about PRIVATE repositories. Public ones get the runners free, which turns careful path-filtering into
  complexity bought with nothing.

### 3b. `common/task-lifecycle.md` §3.1 — verify the tag STARTED something

One paragraph: pushing more than three tags in one `git push` creates no workflow events at all —
silent, exit code 0. Four products were tagged in one push on 2026-09-12 and nothing ran. Push tags one
at a time, and verify by the TAG's own ref — `gh run list --branch <tag>`, not a bare `gh run list`,
which shows runs from other refs and from the previous tag and reads as success. Poll it, because event
creation is not instant, and name the recovery: delete the tag and push it again, alone.

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

No new `id` is introduced, so no catalog registration and no consumer-side resolver change.

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

**A candidate tool, deliberately not built here.** A reviewer asked for a checker that reads every
consumer's `.github/workflows` and asserts a pull-request job per platform each repository ships a
binary for — the same shape as `tools/pin-check.mjs` and `tools/scenario-check.mjs`. That is a tool and
a plan of its own, not a rule, and building it inside a rules-text change would be the scope creep the
gate is meant to catch. Recorded here so it is declined on the record rather than dropped.
