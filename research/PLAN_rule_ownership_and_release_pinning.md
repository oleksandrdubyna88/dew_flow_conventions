# PLAN — a shared rule names no product, and a consumer follows a release

> Status: **IMPLEMENTED, 2026-09-15**, except section 5 — *The two product manuals go home* — which
> is extracted into [todo/PLAN_product_manuals_go_home.md](../todo/PLAN_product_manuals_go_home.md)
> because its precondition is not met yet. Scope as built: this repository's 32 rule bodies, four new
> tools, and one `.gitmodules` line plus one pin in each of the six consumers.
>
> Related docs: [README.md](../README.md), [ENTRY.md](../ENTRY.md), [ROLLOUT.md](../ROLLOUT.md),
> [module_rules.md](module_rules.md), [module_tests.md](module_tests.md).

## What shipped, and where it differed from this plan

Five stories, each through the review gate twice and merged on green:

| | shipped |
|---|---|
| `release` as a ref a person moves | `tools/promote-release.mjs` (fail-closed: on main, `ci` green, forward only, no rewind input), the `workflow_dispatch` promotion, `tools/release-distance.mjs` as the compensating watch |
| `pin-check` reads the ref its `.gitmodules` names | and reads the pin from `ls-tree`, because only the MODE distinguishes a gitlink; `rev-parse HEAD:<path>` resolved a directory to a tree sha and reported it as STALE with an impossible cure |
| `common/rule-ownership.md` + `tools/ownership-check.mjs` | with a per-file ratchet, then armed |
| the cleanup | 129 references, not the 53 this plan estimated |
| the audit ledger | NOT in this plan: `research/reliability-audit-2026-08-16.json`, with `tools/audit-ledger.test.mjs` |
| `tools/rule-bodies.mjs` | NOT in this plan: the freeze had no committed way to RECORD a body |
| `tools/lib/rule-body.mjs` | NOT in this plan: three implementations of "what a rule's body is" had grown |

**The count was wrong by a factor of two and a half.** This plan said 53 references in 19 files; the
detector found **129 across 26 of 32 rules**. The estimate came from a hand count of repository names
and missed two whole categories: `mcp__*__*` tool names (invisible to a word-bounded search, because
`_` is a word character) and definite product nouns behind `the`/`its`/`our`.

**The ratchet was not in this plan and became the mechanism the cleanup rode on.** A check that goes
red on the day it lands teaches people to switch it off, so it landed allowing the backlog per FILE
and refusing anything new. The budget being per file rather than repository-wide is what stops one
branch spending the headroom another won; that it is a floor as well as a ceiling is what stops the
ground won being quietly given back. Both came from review rounds.

**Anonymisation alone would have failed the objection this policy has to face** — *anonymise in place,
and a year later nobody can check the claim.* Hence the ledger: the story stays in the rule, the
address is kept outside the corpus where nothing loads it as policy, and a test asserts the two stay
in step in both directions.

## The open tail

Section 5 is the one part not built. It is not an oversight: its precondition is written into this
plan, and half of it has now shipped on the product's side — the gate's server instructions and its
`resolve` tool description now carry the COMMANDS block, reject-in-round-one and the enforced stop
after `call_human`. What remains is the live-session verification, which needs an INSTALLED build, and
then the reduction of the shared copies. It lives in
[todo/PLAN_product_manuals_go_home.md](../todo/PLAN_product_manuals_go_home.md).

## The symptom, in the operator's words

*"Every pull request, somebody changes the conventions. I do not understand why. And I have seen
project-specific rules being written into it — that should not happen."*

Both halves are real, both are measured, and they have different causes. They are in one plan because
the second cannot be fixed safely until the first is.

### Symptom 1 — a conventions commit reddens every open pull request in six repositories

[`tools/pin-check.mjs:44`](../tools/pin-check.mjs#L44) resolves the expected value with
`git ls-remote <url> HEAD` — this remote's **live default-branch tip, at CI run time** — and compares
it to the consumer's committed pin ([`:39`](../tools/pin-check.mjs#L39)), exiting 1 on any difference
([`:51`](../tools/pin-check.mjs#L51), [`:71`](../tools/pin-check.mjs#L71)). It runs as a hard step in
all six consumers' `pull_request` CI.

So the check is **not a function of the pull request's contents**. A pull request that passed at 14:00
fails at 14:05 with no new commit, because somebody merged a typo fix here in between. Clearing it
needs a pin-bump pull request, which the next commit here can redden again.

Measured on `origin/main`, 2026-08-16 → 2026-09-13:

| | |
|---|---|
| commits on this repository's main | **95 in 29 days** |
| the last two weeks | **33 and 31** — accelerating, not settling |
| pin-touching commits across the six consumers | **317** |
| `dew_flow_mcp` | **60 %** of every commit on main is a conventions pin bump |
| `dew_flow_sidecar_rust` | **54 %** |

In two of the six repositories, pin maintenance is the majority of the recorded history.

The repository also documents a policy the check cannot implement — [README.md](../README.md),
*Editing discipline*: *"During staged rollout, old consumers retain their approved pins; do not move
them to remote HEAD before verification."* `pin-check` has no concept of an approved pin. The check
wins, and the policy is decoration.

### Symptom 2 — the shared rules are written as a ledger of incidents found in the products

Measured over the 27 rule bodies: **53 references to a named consumer repository, across 19 of the 27
files.** [`common/reliability.md`](../common/reliability.md) alone holds 27, as `repo · path:line`
citations.

That is not untidiness, it is a mechanism: a rule that cites a product's file is a rule somebody edits
whenever that product is worked on. **Working in any consumer produces a conventions commit by
design** — which is the other half of "every pull request, somebody changes the conventions".

Two files have gone further and are single-product manuals mounted in six repositories:

- [`common/coai-review-gate.md`](../common/coai-review-gate.md) — 91 lines of one product's MCP API
  (`mcp__coai__open`, the verdict machine, the panel switches). Its `tasks` list is the broadest here,
  so it loads for nearly every task in all six repositories.
- [`common/gpu-lease.md`](../common/gpu-lease.md) — one repository's daemon, its script path, its
  `POST /api/gpu/lease` endpoint, its exit code 75.

And in three places the product name **is** the instruction, so deleting it leaves the rule unusable
rather than merely unillustrated: [`typescript/doctrine.md:28-30`](../typescript/doctrine.md#L28-L30)
(use another repository's `jsonForScript`) and
[`:38-40`](../typescript/doctrine.md#L38-L40) (copy another repository's test file);
[`common/logging-serilog.md:154-171`](../common/logging-serilog.md#L154-L171) and
[`:203`](../common/logging-serilog.md#L203) (a `.NET` API mandated in a `common/` rule whose Definition
of Done the Rust consumer cannot satisfy); [`rust/doctrine.md`](../rust/doctrine.md) throughout, which
says so in its own header at [`:8-10`](../rust/doctrine.md#L8-L10).

The repository already forbids this in its own words —
[`common/knowledge-base.md:54`](../common/knowledge-base.md#L54): **"Name no version, sha, count or
path that moves."** A repository name moves exactly the way a sha does. Two rules violate it with a
count as well: [`common/measurement.md:8`](../common/measurement.md#L8) and
[`common/planning-docs.md:149`](../common/planning-docs.md#L149) both say *"four repositories"*; there
are six consumers and this repository is a seventh user.

## The constraint that shapes the whole plan

[`tools/rules.test.mjs:117-130`](../tools/rules.test.mjs#L117-L130) SHA-pins the **body** of the 24
migrated rules against `research/shared-rules-migration-map.json`, and calls the result *"immutable
baseline evidence"*. Measured: since the map was written (`026b20e`, 2026-09-10) the only body edits to
those files were the `.claude/rules/shared` → `.agents/conventions` path rename — which
[`:128`](../tools/rules.test.mjs#L128) explicitly reverses before hashing. The bodies are genuinely
frozen, and the family has been working around it by only ever adding **new** files.

**17 of the 19 files carrying a product reference are in that frozen set.** So the cleanup cannot
happen without a deliberate decision about the test. Operator ruling, 2026-09-14: keep
`originalBodySha256` untouched as the migration record, add a `currentBodySha256` that must be updated
in the same commit as any body edit, and assert both. The freeze becomes *no accidental edit* instead
of *no edit ever*.

Two further constraints, verified in code:

- **A shared rule may never `depends:` on a `local.*` id.**
  [`rule-catalog.mjs:112`](../tools/lib/rule-catalog.mjs#L112) throws `Missing rule dependency` in
  every repository that lacks it — a whole-catalog error, not a missing paragraph. A split is therefore
  by **body**: the generic half keeps a shared id, the product half becomes `local.*` and depends
  upward.
- **The always-core has 1,377 bytes of headroom.** The three `load: always` rules total 15,007 B
  against the 16,384 B cap at [`rule-catalog.mjs:119-127`](../tools/lib/rule-catalog.mjs#L119-L127).
  The new governance rule must be `load: conditional`.

## What gets built

### 1. `release` — a ref that moves when a person decides

Consumers stop following this repository's live tip and follow a `release` branch, declared as
`branch = release` in each `.gitmodules`. That key is git's own
(`submodule.<name>.branch`), and its documented default for an unset key **is** the remote HEAD — so
the five consumers that declare nothing keep today's behaviour by running today's command, and
`dew_flow_rag_qln`'s two **code** pins go on following their own default branches untouched.

`tools/pin-check.mjs` learns to read that key and ask for `refs/heads/<branch>` instead of `HEAD`. A
named branch is asked for in full, because a bare `release` would also match a tag, and a tag is not
something `git submodule update --remote` can move a pin to. An empty `ls-remote` answer is a **missing
ref**, reported as a configuration error — not a tip, which would make every pin look stale against a
blank sha.

`release` moves only through a `workflow_dispatch` workflow. It is **fail-closed**: it refuses a sha
that is not an ancestor of `main`, refuses one whose `ci` run for that exact sha is not `completed`
with conclusion `success` (an absent run and an in-progress run are both refusals, not passes), and
pushes `refs/heads/release` explicitly so the ref can only ever be a branch.

**Rollback is a forward release, never a backwards move.** A bad release is corrected by reverting the
content on `main` and promoting the new commit. Moving `release` backwards would make every consumer's
committed pin differ from the tip at once, so all six repositories would go red *during* the incident
the rollback exists to end — and a non-fast-forward ref update also breaks every cached clone's
`git submodule update --remote`. The workflow therefore has no rewind input at all.

**`release` is protected server-side**, so the workflow is not merely the polite route. A ruleset on
the ref denies direct and force pushes and grants a bypass only to the Actions actor. That is
repository settings rather than a file, so nothing in the tree can prove it: the rollout verifies it by
attempting a hand push, being refused, and recording the refusal in the pull request body.

**This step alone ends symptom 1**, and it lands before anything else so the rest of the work costs
nothing downstream.

### 2. `common/rule-ownership.md` — the rule that says what belongs here

`load: conditional`, `tasks: ["policy","docs"]`, plus `paths` covering the rule directories and
`.agents/rules/**`. It gives a one-second test — *would another repository still need this sentence if
the named one did not exist?* — says that evidence is **anonymised and dated** rather than deleted,
says where product material goes instead, and states the `depends` direction once: local may depend on
shared, shared never on local.

### 3. `tools/ownership-check.mjs` — because a rule nothing enforces decays quietly

Scans the four rule directories for repository names (`dew_flow_*` as a **pattern**, so a seventh
repository is caught without editing a list), for product tokens, and for a shared rule depending on a
`local.*` id. A name that genuinely cannot be generalised declares itself in the file that needs it:

```
<!-- owns: coai — the MCP tool names a session must type; there is no generic form -->
```

A marker with no reason is refused — the reason is the difference between a decision and an allowlist
somebody grew. Rolled out `--warn` first, per this repository's own habit at
[README.md](../README.md): *a check that goes red on the day it lands teaches people to switch it off.*

### 4. The cleanup — 53 references in 19 files

Anonymised in place, keeping the date and the story: `dew_flow_rag_qln · IndexPassWorker.cs:53` becomes
*a .NET indexing worker here, 2026-08-16*. The house already does this correctly in
[`common/task-lifecycle.md`](../common/task-lifecycle.md) and
[`common/reuse-first.md`](../common/reuse-first.md); those are the style targets.

`common/reliability.md` is its own commit, because its header at
[`:8-14`](../common/reliability.md#L8-L14) is a written promise that the citations *are* the evidence —
strip the names without rewriting the header and the document contradicts itself.

The four hand-maintained repository inventories ([`pull-requests.md:38`](../common/pull-requests.md#L38),
[`:127-131`](../common/pull-requests.md#L127-L131),
[`automated-checks.md:71-76`](../common/automated-checks.md#L71-L76), README) collapse to one table in
README that the rules point at. The rule that stops the copies coming back is the ownership check
itself: an inventory inside a rule must name repositories, and the check refuses that.

### 5. The two product manuals go home

**`coai-review-gate.md` is split by body.** The obligation stays shared and vendor-neutral — run an
independent review in addition to your own, the order is a contract, reject in round one, never a bare
diff without scope, a request for a person stops the shipping. The protocol — tool names, arguments,
verdict words — goes to the product, which already ships it on two surfaces that reach a session
without any rule file: the MCP server's own instructions and its tool descriptions. **Three things are
missing from those surfaces today**, and all three must ship — and be verified in a live session, not
merely merged — **before** the shared copy is reduced:

1. **The COMMANDS block** — that a round's reply can carry operator orders which outrank the AI's own
   defaults. It appears on no shipping surface today, and it is the highest-consequence of the three:
   autonomy, epic/story splitting and model routing all ride on it.
2. **"Reject in round one"** — the convergence argument. On no surface today.
3. **The enforced stop after `call_human`** — that `review_plan` and `review_code` *refuse*, and that
   recording decisions no longer reopens the gate. The server instructions say the verdict stops the
   shipping; they do not say the tools refuse.

**No passage leaves a shared rule without a named destination.** Before any removal, a migration
inventory maps every non-generalisable passage to exactly one of: a consumer-local rule (named file and
`local.*` id), a product surface (named source file), or a deliberate deletion with its reason. Each
mapping is verified as *landed* — by pull request URL, not memory — before the shared passage goes. The
inventory is committed, so "we moved everything" is checkable rather than asserted. Rollback for any
single move is reverting that one consumer pull request: the previous release sha still exists, because
`release` only ever moves forward.

**`gpu-lease.md` is split the same way**: the obligation (take the lease, wait rather than poll,
release on every path, name the holder in a refusal) stays shared because three consumers do GPU work;
the wrapper's flags, the endpoint and the discovery file go to the repository that serves them.

## Build order

Each step is a branch and a pull request; `main` is closed everywhere.

**Wave 0 — make `release` possible** (this repository)
1. `docs/plan-rule-ownership` — this plan, and its row in [todo/README.md](README.md).
2. `feat/pin-check-tracks-a-ref` — the `branch`-key support, a new `tools/pin-check.test.mjs`
   (there is none today, and CI's comment claims otherwise), the README row. **Blast radius zero**: no
   consumer declares `branch`, so the argv is unchanged for all six.
3. `feat/promote-release-workflow` — the promotion workflow, a release-distance report that **fails**
   past its threshold rather than merely reporting, and the README/ROLLOUT rewrites that make the
   approved-pin policy and the check agree. Then run the workflow and verify with `ls-remote`.

**Two hard gates before Wave 1 may start.** Neither is an observation; each is a step that can fail and
stop the rollout.

- **G1 · the shallow fetch.** Every consumer fetches submodules with `--depth 1`. Today the pin is
  *always* the default-branch tip — `pin-check` guarantees it — so a depth-1 fetch has never had to
  reach any other commit. The first lagging pin is the first time it is tested, and the failure
  (`Fetched in submodule path '…', but it did not contain <sha>`) happens **during checkout, before
  `pin-check` runs**, so no check reports it and it reads like a runner flake.

  **Measured 2026-09-14, and it passes.** Two scratch repositories on git 2.55.0, a real shallow fetch
  (a local clone silently ignores `--depth`, printing *"--depth is ignored in local clones"* — the
  first run of this experiment was a false green until the remote was re-addressed as `file://`).
  Both cases succeed: a pin equal to a `release` that lags `main`, and a pin that lags the tracked
  `release` ref itself. The reason is visible in the fetch line — `* branch <the gitlink sha> ->
  FETCH_HEAD`. Modern git asks the server for **the exact commit the gitlink names**, not for the
  branch tip, so a lagging pin is not a shallow-fetch problem at all.

  **Confirmed against the real remote the same day, so no residual risk remains.** A scratch consumer
  pinned **12 commits behind** `origin/main`, with the real `https://github.com/…/dew_flow_conventions.git`
  url, fetched with `git submodule update --init --depth 1`: it succeeded, and the fetch line again
  names the sha rather than a branch — `* branch 103842e8… -> FETCH_HEAD`. GitHub serves a reachable
  sha to a shallow submodule fetch.

  **Consequence for Wave 1: none of the 14 shallow-fetch sites needs to change.** The switch is one
  `.gitmodules` line plus a committed pin bump per consumer, and nothing else.

  For the record, the sites that would have been touched had this failed —
  `creds_for_devs` `ci-server.yml:79`, `docs.yml:33`, `rsd-server-deploy.yml:103`;
  `connect_other_ais` `ci.yml:27,151`, `release.yml:378`, `sonarcloud.yml:35`;
  `mcp` `ci.yml:34,70`; `sidecar_rust` `ci.yml:72,112`; `benchmark` `ci.yml:53,94`;
  `rag_qln` `ci.yml:125` (plus `submodules: recursive` at `:16,53`).

  One scheduling fact found while mapping them: `connect_other_ais` runs `pin-check` as a **release
  gate** (`release.yml:392`), not only on pull requests. A stale pin there blocks a tag, so its
  switch must not be left half-finished.
- **G2 · `release` exists.** `git ls-remote <url> refs/heads/release` must return a sha before any
  consumer names the ref. A `.gitmodules` pointing at a branch the remote does not have is not a stale
  pin, it is a broken checkout.

**Wave 1 — the six consumers stop following main.** G1 is **CLOSED** (measured, above) and G2 is the
promotion run at the end of Wave 0, so each consumer's change is exactly one line in `.gitmodules`
plus a committed pin bump — no checkout step is touched. The canary is still a canary: it is the
first repository to prove the switch end to end in real CI, not the thing that closes G1.
Order: `creds_for_devs` (canary — docs-only CI),
`connect_other_ais` (the only migrated consumer, and the only one running `adapter-check`), `mcp`,
`sidecar_rust`, `benchmark`, **`rag_qln` last** — its two code pins go stale when mcp's and
benchmark's tips move, and a code-pin bump needs a build run.

> Between the `mcp` and `benchmark` merges and the `rag_qln` one, `rag_qln` is red for a reason that
> has nothing to do with rules. That window is why it is last: **open no other `rag_qln` pull request
> in it.**

**Every existing clone needs one command.** `git submodule update --remote` reads
`submodule.<name>.branch` from `.git/config` **first**, and `git submodule sync` copies the url but
*not* the branch — so a clone made before this rollout silently keeps following `main` while CI names
`release`, producing a stale pin that looks like a bug in the rollout. The migration note in README
gives the one line that fixes it (`git config submodule.<name>.branch release`, or a fresh
`--init`), and each consumer's CI sets the branch explicitly rather than trusting a cached config.

> **Checkpoint: symptom 1 is fixed here.** `release` is frozen; this repository's main may move freely
> and nothing anywhere goes red. Every wave below is cheap because of this.

**Wave 2 — the shared side** (this repository)
4. `feat/rule-ownership-governance` — the rule, the check with `--warn`, its tests and fixtures, the
   migration-map `currentBodySha256` change and the `rules.test.mjs` update. The field is seeded from
   the bodies **as they are at that commit**, so the suite is green the moment it lands.
5. `refactor/anonymise-rule-evidence` — the 26 references outside `reliability.md`.
6. `refactor/reliability-evidence` — `reliability.md` and its header, alone.

> **Each body-edit commit updates that file's `currentBodySha256` in the same commit.** The hash is not
> a thing to reconcile afterwards: steps 5 and 6 edit bodies that step 4 has just pinned, so a commit
> that changes a body and not its hash is a red suite. That is the point of the field — it makes an
> accidental edit loud and a deliberate one a two-line diff — and `reliability.md`'s header at
> [`:8-14`](../common/reliability.md#L8-L14) is rewritten in the **same** commit as its 27 citations,
> because a header promising that the citations are the evidence is false the instant they are gone.
7. `ci/arm-ownership-check-here` — drop `--warn` in this repository. The repo that owns a rule obeys it
   first.

**Wave 3 — every passage gets a home before it loses one.** Six consumer pull requests adding the
product-specific material as local rules (`.agents/rules/**` with `local.*` ids where migrated, the
repository's own `CLAUDE.md` where not). These merge while every consumer still pins the previous
release, so the shared copies are still live — **at no instant is the material in neither place.**

**Wave 4 — the removals and the second promotion**
8. The coai server change ships and its binary is verified live, before the shared gate rule is reduced.
9. `refactor/split-the-product-manuals` here; promote `release`; six pin-bump pull requests in the same
   order, each also adding the ownership check with `--warn`.

**Wave 5 — arm it.** Six one-line pull requests dropping `--warn`, once all six logs are clean. Then
promote this plan to `research/` with its deviations recorded.

## Test plan

- `tools/pin-check.test.mjs` — 18 cases over real git repositories in a temp directory, including the
  RED one (*a pin at the release tip passes while the default branch has moved on*, which fails against
  today's tool), the backward-compatibility case (*no branch key behaves exactly as before*), the
  `rag_qln` shape (*a rules pin on release and two code pins on their own defaults are judged
  separately*), and *a branch the remote does not have is NO SUCH REF, never a silent OK*.
- `tools/ownership-check.test.mjs` — fixtures per shape, including two controls that stop the check
  being switched off: a legal `tasks: ["benchmark"]` frontmatter value must not read as a product, and
  an indefinite *"a sidecar process"* must not fire where *"the sidecar"* does.
- **The promotion workflow's refusals are tested, not asserted in prose** — a sha that is not an
  ancestor of main, a sha whose `ci` run is absent, one whose run is still in progress, and one whose
  conclusion is `failure` must each be refused by name. A gate that has only ever been exercised on its
  happy path is a gate nobody has seen close.
- `npm test` and `npm run check` green at every step; every pull request records the red observation
  and the green one, per [common/testing.md](../common/testing.md).

## What the plan review changed

Reviewed 2026-09-14 through the gate — codex, gemini and a local model, all three answered; verdict
`good_enough` at 18 gating findings against a threshold of 6. **20 of 22 findings accepted**, and the
ones that changed the design rather than sharpening it are:

- **Rollback became a forward release.** Moving `release` backwards would redden all six repositories
  during the incident it is meant to end, and break every cached clone's `--remote`. The workflow lost
  its rewind input entirely.
- **The shallow fetch became a gate, not a risk.** It was in the risk list as something to measure;
  three reviewers independently called it Blocking, and they are right — it fails *before* `pin-check`
  runs, so nothing reports it.
- **The hash ordering was wrong.** The original build order added `currentBodySha256` in step 4 and
  edited bodies in 5 and 6, which would have gone red. Each body edit now carries its own hash update.
- **Server-side protection on `release`.** Without it the workflow is the polite route, not the only
  one, and a hand push ships an unverified commit to six repositories.
- **The three missing protocol requirements are named**, instead of being counted.
- **A migration inventory** now maps every moved passage to a verified destination.

Two findings were rejected with reasons: a request for a dry-run mode that `--warn` already is, and a
duplicate-rule-id concern that [`rule-catalog.mjs:85`](../tools/lib/rule-catalog.mjs#L85) makes
structurally impossible — a consumer rule cannot hold a shared id, because the loader requires the
`local.` prefix.

## Risks that no check would catch

- **The shallow fetch.** Every consumer fetches submodules with `--depth 1`. Today the pin is always
  the default-branch tip, so that has never had to reach an older commit. The first lagging pin is the
  first time it is tested, and if it fails, `pin-check` never runs to report it. **Measure this in a
  scratch clone before wave 1.**
- **`.git/config` shadows `.gitmodules`.** `git submodule update --remote` reads the branch from
  `.git/config` first; a clone made before this rollout has no cached branch and goes to main, while CI
  names `release`. `git submodule sync` copies the url and not the branch, so it does not fix it.
- **`release` rots and everything says OK.** A pin equal to a stale `release` is green everywhere —
  the 2026-08-19 audit state, re-created by design. The weekly distance report is the only thing that
  would notice; it is not optional.
- **The anonymisation deletes the warrant.** `reliability.md`'s header promises the citations are the
  evidence. Nothing validates that a header still tells the truth about its body.
- **The deliberate duplicate becomes permanent.** Between wave 3 and wave 4 the material is in both
  places on purpose. If wave 4 is abandoned, that is exactly the drift
  [`gate-snippet-check.mjs`](../tools/gate-snippet-check.mjs) was written about.

## Definition of Done

- [ ] `pin-check` compares each pin against the ref its `.gitmodules` names, and a missing `branch` key
      behaves exactly as before — asserted, not argued.
- [ ] All six consumers follow `release`; a commit on this repository's main reddens nothing.
- [ ] `release` moves only through the promotion workflow, and a hand push is refused.
- [ ] `common/rule-ownership.md` exists and `tools/ownership-check.mjs` passes here without `--warn`.
- [ ] Zero product references remain in the four rule directories except declared `owns:` markers, each
      carrying a reason.
- [ ] The stale counts are gone, and no rule lists repositories.
- [ ] Every product manual's obligation is shared and its protocol lives with the product that owns it;
      no shared rule `depends:` on a `local.*` id.
- [ ] `npm test` green, including the two new test files.
- [ ] This plan is promoted to `research/` with its deviations and its open tail recorded.
