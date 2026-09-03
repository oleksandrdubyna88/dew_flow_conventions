# Post-deploy checks — the short list a green build cannot answer (MANDATORY)

> Extends [development-workflow.md](development-workflow.md), which already records three ways a change
> reports success without shipping: the artefact that was never rebuilt, the artefact that was built and
> never deployed, and the release that shipped five of its six platforms. This rule is what happens
> **after** the deploy, and it asks a different question from all three: not *did it ship*, but *is the
> thing now running actually doing its job*.

Every repository has a `POST_DEPLOY.md`. It is at most twelve items long, and it is run every time
something ships.

## Why a test cannot answer this

A green local run and a green CI run are statements about **the build**. Everything the environment
adds afterwards takes part in neither:

configuration, secrets and environment variables · TLS certificates and their renewal · DNS · the
reverse proxy in front · database migrations and the state of live data · which image tag actually got
pulled · volume ownership and file permissions · the version a marketplace is serving · the identity
provider's own settings.

None of that exists on the machine that ran the tests. So a suite is not evidence here — and the
familiar move, *"that is covered by a test, drop it from the list"*, is precisely backwards in this file.

Measured in this family, three weeks apart:

- **2026-08-26** — an image built and published from the very commit, CI green, and the **running**
  server was still the previous day's, because deployment is a separate manual dispatch nobody had
  triggered. The client turned the resulting `404` into *"Nothing you sent is still waiting to be
  accepted"*: the one sentence that could not have been more wrong.
- **2026-09-03** — a six-RID release matrix lost one leg. Five published, GitHub marked the release
  **Latest**, and a linux-x64 user pressing Install found no asset for their platform: not an error,
  an absence, on the newest version, with five siblings to prove the release "worked".

Both were green everywhere. Neither was reachable by anything that runs before a deploy.

## What "prod" is, per repository — and nobody is exempt

| The repository ships | "Prod" is | Run the file |
|---|---|---|
| to a server you deploy to | that server | after every deploy |
| **nothing yet — development is local** | **your own installation** | **on every release, against your own installation** |
| a VS Code extension | the version the marketplace serves, and the contents of the installed `.vsix` | after every publish |
| a package (NuGet, ghcr, crates.io) | the published artefact as a consumer receives it | after every publish |

The second row is the one that gets skipped, and it is why the file exists in every repository rather
than only in the one with a server. While it is the only thing running, local **is** production; the day
a server appears the target changes and the list does not.

The third row already has its evidence: a `.vsix` was packaged without its prepublish step and carried
JavaScript three versions old. It installed cleanly and reported success, and the operator restarted the
editor twice looking for a change that had never shipped ([development-workflow.md](development-workflow.md),
*Verify the ARTEFACT*).

## The file

`POST_DEPLOY.md` at the repository root — an operator reads it mid-deploy, and `research/` is where the
system is described, not where a runbook is looked up.

```markdown
# Post-deploy checks — <repository>

Target: <the deployed thing, and how to reach it>
Last verified: 2026-09-03 · https://vault.example.com · 0.2.4

| # | What a person loses if this is broken | Check | Auto |
|---|---|---|---|
| 1 | Nobody can sign in — the extension shows an empty Team with no error | `curl -fsS $TARGET/api/health` | auto |
| 2 | Everyone is on last week's build without knowing | `curl -fsS $TARGET/api/health \| jq -e '.version=="0.2.4"'` | auto |
| 3 | … | … | manual |
```

**The stamp is deliberately a moving value.** [knowledge-base.md](knowledge-base.md) warns against
naming a version, sha or count that moves, because a *pointer* holding one goes stale and becomes wrong.
This is not a pointer: it is the **record of an observation** — a date, a target and a version somebody
watched work. A stale stamp is information, and on the day something is broken it is the most useful
line in the file.

## Two conditions, and an item needs both (MANDATORY)

1. **If it breaks, a person loses something they came for.** Not "a metric is missing", not "a log line
   is absent" — the thing they opened the product to do.
2. **It can differ between the machine that built it and the machine that runs it**: config, a secret,
   an environment variable, TLS, DNS, the proxy, a migration, the image tag, permissions, the published
   version, the identity provider.

A defect that **cannot survive a green local run** fails the second condition. That is a test, not an
item here. This is what keeps the file short without anyone having to be strict about it: the class of
things visible only in production is genuinely small.

## Twelve items, and how the thirteenth gets in

**The cap is twelve.** A hard number rather than "keep it short", because "keep it short" is not
something anyone can check, and every individual addition looks reasonable at the moment it is made.

A thirteenth enters only together with the removal of a named weaker one, in the same edit, and the
commit says which one left and why it is now the weakest.

**Never remove an item because a test now covers it.** A test is evidence about the build, and this file
exists precisely because the build is not the thing that runs. The only reasons to remove an item are
that the feature is gone, or that the failure it names can no longer happen for a stated structural
reason.

## The trigger — after every task and every bug

Before reporting anything as done, one question:

> Does this change what must be true on the deployed thing — and would a green build hide it?

**Yes** → the item goes in (and something goes out, if the file is full). **No** → nothing to do, and
that is the normal answer. A bug that was only ever possible in production almost always earns an item;
a refactor almost never does.

The same discipline as [planning-docs.md](planning-docs.md)'s promotion check, and here for the same
measured reason: a step that is described but never triggered decays quietly. Twelve implemented plans
accumulated in `todo/` under a rule that described exactly how to move them.

## Automation is the point, not a bonus

Every item that **can** be a command **is** one, runnable against the live target: `curl`, a
`# @prod`-tagged request from [http-contracts.md](http-contracts.md), a CLI invocation, a marketplace
version query, an `unzip -p … | grep` for a symbol only the new build has. Items that genuinely need a
person — open the editor, run the command, look at the panel — are marked `manual` and stay a handful.

Where the repository already has HTTP requests, **the check reuses them** instead of restating them in
curl: the prod-safe subset is exactly the `# @prod` tag, and the runner sends those. One artefact, two
audiences.

[`post-deploy-check.mjs`](../tools/post-deploy-check.mjs) is both halves, and the difference between
them is this rule in one command:

```bash
node .claude/rules/shared/tools/post-deploy-check.mjs                    # CI: shape only, nothing is run
node .claude/rules/shared/tools/post-deploy-check.mjs --target <value>   # after a deploy: the items, for real
```

Structural mode executes nothing and touches no network — it asks whether the file is there, still
under its cap, still says when it was last verified and against what, and whether every item carries a
command or admits to being manual. Only `--target` produces evidence, because only `--target` talks to
the machine that is running.

The target arrives at each command as **`$TARGET`**, exported rather than pasted into the text: the
command line is the repository's own content, the one value from outside is never concatenated into it,
and every command runs under a timeout that kills its process tree
([security.md](security.md), [reliability.md](reliability.md)).

## Never

- Never mark an item verified that you did not watch run.
- Never let the list grow past its cap "just this once".
- Never delete an item because a suite covers it.
- Never send a mutating request at a live target because it is "probably fine".
- Never report a deploy as done with the file unrun. An unrun list is the same as no list.

## Definition of Done

- [ ] The completion question was asked: does this change what must be true on the deployed thing?
- [ ] Any new item satisfies both conditions, and the file is still at twelve or fewer.
- [ ] Every automatable item is a command; the rest are marked `manual`.
- [ ] The file was run against the target after the deploy — or, where there is no server, against your
      own installation at release time.
- [ ] The stamp names the date, the target and the version that was observed.
