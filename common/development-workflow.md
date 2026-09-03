# Development Workflow

> Extends [git-workflow.md](git-workflow.md) with the process that happens before git operations.

0. **Research & Reuse** *(mandatory before any new implementation)*
   - **This repository first** — per [reuse-first.md](reuse-first.md): the capability may already exist.
   - **GitHub code search second** (`gh search repos`, `gh search code`) for existing implementations,
     templates and patterns before writing anything new.
   - **Library docs** (primary vendor docs) to confirm API behaviour and version-specific details.
   - **Package registries** before writing utility code; prefer battle-tested libraries — for NuGet,
     follow the approval and licence policy in [../csharp/nuget-packages.md](../csharp/nuget-packages.md).
   - Prefer adopting or porting a proven approach over writing net-new code when it meets the
     requirement.

1. **Plan first** — non-trivial work starts as a plan in `todo/` per
   [planning-docs.md](planning-docs.md): symptom/goal before any solution, verified `file.cs:line`
   references, build order, test plan, Definition of Done.

2. **TDD** — tests first (RED), implement (GREEN), refactor; see [testing.md](testing.md).

3. **Review before commit** — re-read the full diff; fix correctness and security issues first, then
   conventions. CI green, conflicts resolved, branch up to date before requesting human review.

4. **Commit & push** — conventional commits per [git-workflow.md](git-workflow.md).

5. **Release & deploy** — the `.http` contract suite runs **before** the release
   ([http-contracts.md](http-contracts.md)); the thing that is now running is checked **after** it
   ([post-deploy-checks.md](post-deploy-checks.md)). Where nothing is deployed anywhere yet, your own
   installation is the target and the check still runs at every release — the three rules below are all
   about signals that stayed green while nothing shipped, and none of them looks at what is running.

## Verify the ARTEFACT, not the source (MANDATORY)

A build step that does not run leaves the previous artefact in place, and every downstream signal keeps
saying "success". Measured here: a VS Code extension was packaged without a `vscode:prepublish` script, so
the `.vsix` carried JavaScript three versions old. It installed cleanly, reported success, and behaved
exactly as before — while the operator restarted the editor twice looking for a change that was never
shipped.

The type check made it worse rather than catching it: `tsc --noEmit` proves the SOURCE compiles while
emitting nothing, so it confirmed the correctness of code that was not in the package.

So, whenever what ships is a built artefact rather than the working tree:

- **Look inside it.** Unzip the package, grep the compiled output for a symbol only the new version has, read
  the DLL's timestamp. "Successfully installed" is the installer's opinion about a file, not about its
  contents.
- **Make the build unskippable** — a prepublish hook, a packaging step that compiles — so the next person
  cannot repeat it.
- The same trap has a sibling on this machine: a host holding DLLs makes `dotnet build` report
  `0 error(s)` for projects it silently could not copy. A clean build line is not proof that the binary you
  are about to run is fresh.

## A release that shipped SOME of its platforms is worse than one that failed (MANDATORY)

The third sibling. The first rule above is an artefact that was not rebuilt; the second is one that
was built and never deployed. This one is built, published, marked **Latest** — and incomplete.

Measured 2026-09-03. A six-RID release matrix lost one job to a test failure. The other five
published, the release was created, GitHub marked it Latest, and the whole thing read as success in
every list. A linux-x64 user pressing Install then found **no asset for their platform**: not an
error anyone could act on, just an absence, on the newest version, with five siblings present to
prove the release "worked". The tag had to be burned and the fix shipped as a new one.

A partial publish is the worst of the three because every signal is green *and* the artefact exists.
There is nothing to notice.

So, wherever a release fans out across platforms, runtimes or packages:

- **The publish step depends on the WHOLE matrix.** `needs:` the fan-out job and let a single failed
  leg keep the release from being created at all. A tag that produced nothing is a tag you retry; a
  tag that produced five sixths is a trap with a version number.
- **Assert the count after publishing**, from the release itself rather than from the workflow's
  opinion of itself: the number of assets equals the number of targets, and each expected name is
  present. A matrix that silently shrinks — a runner image retired, a leg skipped by an `if:` —
  passes every job-level check.
- **Never move a tag to repair this.** Ship the next patch version; a moved tag makes every checkout
  that already fetched it wrong in a way nothing reports.

## The other side ships on its own clock (MANDATORY)

The rule above is about an artefact that was not rebuilt. This one is about an artefact that was
built, published, and **never deployed** — and about the half of the system that then keeps running
last week's code while your half assumes today's.

Measured 2026-08-26. A vault server gained three features; the extension gained the client half of
them. Source committed, CI green, the container image built and published from that very commit.
The running server was still on a build from the day before, because deployment is a separate
manual dispatch that nobody had triggered. Everything reported success. Nothing had shipped.

Worse than the delay was what the client did about it. Its "list what I have sent" call returned an
empty list on any non-`ok` response, so against the not-yet-deployed server a `404` — *this route
does not exist here* — became **"Nothing you sent is still waiting to be accepted."** The one
sentence that could not be more wrong: the reason a person opened that command was to take a secret
back, and they were told there was nothing to take.

### Two obligations, and the second is the one people skip

**1. A caller must be able to tell "the other side is older" from "there is nothing here", and must
say which.** They are opposite answers and they arrive as the same empty list. Whenever a call can
reach a peer that predates the feature — a server you deploy separately, an agent someone installs
themselves, a CLI on a colleague's machine — the not-implemented answer gets its own branch and its
own sentence, naming what to update. An empty result is reserved for the case where the peer
answered and had nothing.

This is why a version handshake earns its keep: with one, the peer says how old it is before you
guess. Without one, a `404` on a route that only new builds have is the closest thing to an answer,
and it must not be flattened into a value.

**2. Merging is not shipping, and "done" for a two-sided change includes the rollout.** Say plainly
in your summary which side is live and which is not:

- what is committed,
- what CI built (name the commit — an image from a *later* commit is not evidence about yours),
- what is actually **running**, with the date of the last deploy,
- and what a user sees in the window between them, because for a while that window IS the product.

A deploy is outward-facing: it changes a live host other people depend on. Do not trigger one
because the code looks ready — say it is ready, say what is running instead, and let the owner
decide. But never report the feature as delivered while the half that serves it is not there.

### Ask it as one question

> If the other side is a month old, what does my code do — and what does the person see?

If the honest answer is "an empty list", "a spinner", or "the same as success", that is the defect,
and it is in your half. Fix it before the rollout, because the rollout is exactly when nobody is
watching for it.

