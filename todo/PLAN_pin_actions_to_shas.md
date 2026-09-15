# PLAN — every workflow action pinned to a reviewed commit sha

> Status: **plan only, nothing implemented yet.** Scope: every `uses:` in `.github/workflows/` here
> and in the six consumers, plus the policy that says how a pin is reviewed and bumped.
>
> Related docs: [README.md](../README.md), [common/automated-checks.md](../common/automated-checks.md),
> [common/pull-requests.md](../common/pull-requests.md).

## Where this came from

Raised by a reviewer during the code round on `promote-release` (2026-09-14) and **approved by the
operator as its own task rather than folded into that change**. The reasoning for keeping it separate
is worth recording, because it is the same reasoning that will apply to the next such finding: pinning
one new workflow while four existing ones use tags leaves the repository inconsistent and changes
nothing about its actual exposure — the other workflows run on the same triggers with the same token.
A partial fix here is not a smaller version of the fix; it is a different, worse thing.

## The symptom

Every workflow in this repository, and in all six consumers, references actions by MUTABLE tag:

```yaml
- uses: actions/checkout@v7
- uses: actions/setup-node@v7
```

A tag is a pointer its owner can move. If an action repository is compromised, or a maintainer
force-moves `v7`, the next scheduled or triggered run executes whatever it now points at — with the
workflow's `GITHUB_TOKEN` and a checkout of the repository. In this family that matters more than
usual in two places:

- **`promote-release`** has `contents: write` and exists to move the ref six repositories load their
  policy from. An action that runs inside it can push whatever it likes to `refs/heads/release`.
- **The consumers' CI** runs the shared tools from the mounted submodule, so a compromised action has
  the same reach in six repositories at once.

## What "done" looks like

1. Every `uses:` in every workflow names a **commit sha**, with the human-readable version in a
   trailing comment: `uses: actions/checkout@<sha>  # v7.0.1`.
2. A written policy in [common/automated-checks.md](../common/automated-checks.md) saying how a pin is
   chosen (read the tag, record the sha it resolved to, on the day), and what a bump requires.
3. Dependabot is configured to raise those bumps — it understands sha pins with version comments and
   will open a pull request naming the new version, which is what makes this maintainable rather than
   a thing that rots. Check `.github/dependabot.yml` here and in each consumer.
4. A check, because a rule nothing enforces decays quietly: a small `tools/action-pins-check.mjs` that
   fails on any `uses:` with a non-sha ref. `--warn` first, per this repository's habit.

   **Only a LOCAL `./` reference is excluded**, because it resolves inside the repository being
   checked out and has no upstream to move. A **remote reusable workflow is not excluded**:
   `owner/repo/.github/workflows/x.yml@main` is exactly the mutable pointer this task exists to
   remove, and it runs with the calling workflow's permissions. It is pinned like anything else —
   `owner/repo/.github/workflows/x.yml@<sha>  # v2.1.0`.

   **`docker://` is pinned to a digest, not excluded**: `docker://alpine:3.19` is a mutable tag with
   the same failure mode, so the check requires `docker://<image>@sha256:<digest>`. If a case appears
   where that is genuinely impractical, it is an explicit allowlist entry with a reason, never a
   silent hole in the pattern.

## Build order

1. `tools/action-pins-check.mjs` + `tools/action-pins-check.test.mjs`, with a fixture per shape and
   its expected verdict stated: a tag (REFUSED), a sha (passes), a sha with a version comment
   (passes), a local `./` reference (skipped), a remote reusable workflow on a branch (REFUSED), the
   same pinned to a sha (passes), `docker://image:tag` (REFUSED) and `docker://image@sha256:...`
   (passes). Land with `--warn`.
2. Pin this repository's five workflows; drop `--warn` here.
3. Dependabot configuration, verified by watching it open one bump.
4. Roll the check into the consumers' CI, `--warn` first, in the usual order with `rag_qln` last.

## Test plan

The check's teeth are the point: a fixture with a tagged action must go red, and mutation-checking it
(accepting any ref) must turn exactly that fixture red and nothing else. Cover the shapes that must
NOT fire — `./.github/actions/thing`, a reusable workflow already pinned as
`owner/repo/.github/workflows/x.yml@<sha>`, and a sha that already carries a version comment — and,
just as important, the near misses that MUST fire: the same reusable workflow on `@main`, and a
`docker://` image on a tag. A check whose exclusions are wider than its rule is a check that passes
the things it was written for.

## Risks

- **A wrong sha is a broken workflow, everywhere at once.** Pin from `gh api
  repos/actions/checkout/git/ref/tags/v7` rather than by hand, and land one repository at a time.
- **Dependabot noise.** Six repositories × several actions is a lot of pull requests; group them per
  repository with `groups:` in the Dependabot config before turning it on.
- This is the kind of change that looks mechanical and is not: `actions/checkout@v7` appears in
  `promote-release.yml`, `release-distance.yml`, `ci.yml`, `sonarcloud.yml` and every consumer's CI,
  and each of those runs on different triggers.

## Definition of Done

- [ ] No `uses:` anywhere in the family names a tag or a branch — including remote reusable workflows
      and `docker://` images, which are pinned by sha and digest respectively.
- [ ] Every pin carries its version as a trailing comment.
- [ ] `tools/action-pins-check.mjs` runs without `--warn` here and in all six consumers.
- [ ] The policy for choosing and bumping a pin is written in `common/automated-checks.md`.
- [ ] Dependabot raises the bumps, observed at least once.
