# PLAN — `.http` contracts and post-deploy checks, with the tools that enforce them

> Status: **rules and tools shipped 2026-09-03; the per-repository rollout (phases 3–5) is the open
> work.** Scope: `common/http-contracts.md`, `common/post-deploy-checks.md`, three Node tools in
> `tools/`, and one `http/` tree plus one `POST_DEPLOY.md` in each of the six consumers.
>
> Related: [common/http-contracts.md](../common/http-contracts.md),
> [common/post-deploy-checks.md](../common/post-deploy-checks.md),
> [common/development-workflow.md](../common/development-workflow.md).

## The symptom

Two failures this family has already paid for, neither of which any existing rule catches:

1. **A route unreachable in every released build.** `/v1/use/exportEnv` — the route grammar rejected a
   capital letter. A generated contract file and a test on each side both stayed green, because each
   compared its own copy of the names against itself. Nobody had ever sent the request. Recorded in
   [common/testing.md](../common/testing.md).
2. **A deploy that never happened, reported as success everywhere.** Image built and published from the
   very commit, CI green, the running server a day old (2026-08-26); and a six-RID release that
   published five of its six assets and was marked **Latest** (2026-09-03). Both in
   [common/development-workflow.md](../common/development-workflow.md).

The first is a missing tier of test: nothing in the family sends a real request over the wire. The
second is a missing habit: nothing looks at the thing that is actually running, afterwards.

## Where the family stands (counted 2026-09-03)

Route registrations, by `grep -c` for `Map(Get|Post|Put|Delete|Patch)\(` in `src*`/`hosts` and for
`.route(` in the Rust sources. Registrations, not distinct paths — good enough to size the work, not a
contract:

| Repository | Registrations | `.http` today | What "prod" is |
|---|---|---|---|
| `dew_flow_rag_qln` | 61 | none | local install |
| `dew_flow_creds_for_devs` | 26 | none | **a deployed server** (`deploy/`, `rsd-server-deploy.yml`) |
| `dew_flow_benchmark` | 15 | none | local install |
| `dew_flow_sidecar_rust` | 6 (axum) | none | local install |
| `dew_flow_mcp` | 3 | none | published package; the real contract is the tool surface |
| `dew_flow_connect_other_ais` | 0 | n/a | published extension + AOT MCP binary |

There is no `.http` file anywhere in the family, and no `POST_DEPLOY.md` anywhere.

## What is being reused rather than invented

The frozen `ClaudeRag` repository carries a working prototype at `tools/http-smoke/`: httpyac pinned at
`6.16.7`, a runner with an exit-code contract (`0` pass · `1` contract regression · `3` environment ·
`4` configuration · `5` no valid report), report freshness validation, and a classifier that separates
*the stack did not start* from *the API changed*. Three of its measured findings carry over and must not
be rediscovered:

- `--all` is mandatory; without it httpyac can drop into an interactive region picker and hang a
  headless run.
- `--name` is **silently ignored** whenever `--all` is passed, so filtering is by FILE selection.
- The JUnit report must go straight to a file descriptor, not through a buffered pipe.

`ClaudeRag` is frozen and is not a source of rules any more — it is a source of code to port.

## Build order

### Phase 1 — the rules *(done 2026-09-03)*

`common/http-contracts.md`, `common/post-deploy-checks.md`, and a release step in
`common/development-workflow.md` pointing at both.

### Phase 2 — the tools, `tools/*.mjs`, Node *(done 2026-09-03)*

One implementation for the whole family, per the README's `tools/` section: these read markdown and
source text, so nothing about them needs writing twice, and a Rust repository pays no toolchain.

| Tool | Job |
|---|---|
| `http-run.mjs` | httpyac wrapper ported from `ClaudeRag`: fresh-report validation, environment-vs-contract classification, the five exit codes. Takes `--target`, `--tag`, a path. |
| `http-coverage.mjs` | Route inventory (from `--routes`, else a source scan) against paths present in `http/**`. A route with no request fails; `@uncovered` declarations are counted and printed. |
| `post-deploy-check.mjs` | Structural (CI, no network): cap of twelve, a command or an explicit `manual` on every item, the stamp present. Runner (`--target`): executes the auto items, PASS/FAIL per line, non-zero on any failure. |

Two constraints both tools inherit from [common/testing.md](../common/testing.md):

- **A scan that matches nothing passes forever.** Each parser ships with a companion test asserting it
  still finds a known instance on a fixture — otherwise one reformat makes both tools permanently green.
- **Enumerate, never retype.** A text scan for route registrations is a bootstrap, not the destination.
  The right shape is the application printing its own route table with the tool comparing against that;
  `http-coverage.mjs` accepts either, and a repository graduates when it can.

**What shipped differently from the plan above** — the part worth keeping:

- **Three shared modules, not three standalone scripts.** `lib/http-files.mjs` (the `.http` parser),
  `lib/junit.mjs` (the report reader and the environment-versus-contract verdict) and `lib/proc.mjs`
  (a child process with a ceiling and a tree kill). Two tools need the same three facts out of a `.http`
  file, and a second reading of that format is how they would come to disagree about which requests
  exist.
- **`--tag` materialises a filtered tree** rather than naming requests, because `--name` is silently
  ignored whenever `--all` is passed — and `--all` cannot be dropped. Each filtered file keeps its
  prelude, or the surviving requests lose the variables they use.
- **httpyac is not a dependency of THIS repository.** Each consumer installs it pinned; the runner
  resolves the package and runs its entry with `node`, which avoids the `.bin/*.cmd` that recent Node
  refuses to spawn without a shell — and a shell string is what `security.md` forbids.
- **The tests are one `tools/selftest.test.mjs`** on `node:test`, no dependency, 28 cases. They were
  green on the first run, which by `testing.md` is a reason for suspicion rather than confidence — so
  the scan was deliberately narrowed to a line-anchored form and the companion test was **observed
  failing** with the real symptom (`2 route registration(s) scanned` instead of 3, `1/2 covered`
  instead of `2/3`), then restored.
- **`http-run.mjs` has no end-to-end exit-code test here**, because that needs httpyac installed and
  this repository has no API to install it for. Its two decision points — the JUnit reader and the
  verdict — are unit-tested, and the exit codes are exercised in the first repository that adopts a
  suite. Said plainly rather than left as an assumed gap.

### Phase 3 — pilot: `dew_flow_creds_for_devs`

The only repository with a real deployed server. 26 registrations across `/api/vault`, `/api/shares`,
`/api/org-recovery`, `/api/team`, `/api/metrics`, plus the two anonymous routes
(`src_minimalapi_server/src/Program.cs:512` health, `:545` client-config; the three JWT schemes are wired
at `:222`–`:273`).

Deliver: `http/<group>/` for every group, `POST_DEPLOY.md`, `http-run.mjs` wired into `ci-server.yml`,
and `post-deploy-check.mjs --target` appended to `rsd-server-deploy.yml` after `update.sh`.

**Blocked at the boundary of authentication.** Only `/api/health` and `/api/client-config` are anonymous;
the other 24 need a bearer token, and there is no machine identity in the system:

- Microsoft and Google tokens are minted by an interactive user sign-in only.
- The `Local` scheme's `LOCAL_SIGNING_KEY` is symmetric, and `deploy/README.md` warns that its holder can
  mint a token for **any** email — putting it in CI secrets gives CI the right to impersonate anyone.
- Even with a token, a happy flow writes into the live vault, so it needs a canary identity whose domain
  passes `ALLOWED_DOMAINS`.

So Phase 3 ships the anonymous checks and the full local `.http` suite, and the authenticated prod subset
waits on a decision: **(a)** anonymous only, **(b)** a canary token on the `Local` scheme, **(c)** a
read-only machine identity added to the server. Recorded as an open question, not as a gap in the rule.

### Phase 4 — rollout

`rag_qln` (61, backfilled group by group), `benchmark` (15), `sidecar_rust` (6, axum), `mcp` (3 — plus a
note that its real contract is the tool surface), `connect_other_ais` (no HTTP; `POST_DEPLOY.md` only,
about the extension and the AOT binary). `http-coverage.mjs` starts as a warning in each repository and
becomes a failure when its groups are covered.

### Phase 5 — pin cascade

`git submodule update --remote .claude/rules/shared` + commit in all six consumers, in the same task as
the rules commit, `dew_flow_rag_qln` last because it is itself pinned by two others. Per
[README.md](../README.md) *Editing discipline*.

## Test plan

- `http-run.mjs`: a fixture suite with one passing request, one failing assertion, and one request at a
  dead port — asserting exit `0`, `1` and `3` respectively. The exit code is the product; a runner that
  cannot tell a dead stack from a broken contract is worse than no runner.
- `http-coverage.mjs`: a fixture with a route that has a request, a route that does not, and an
  `@uncovered` declaration. Plus the companion test that the scan still finds the known route after
  reformatting.
- `post-deploy-check.mjs`: fixtures for thirteen items, a missing stamp, and an item with neither a
  command nor `manual` — each expected to fail with its own message.
- The rules themselves: verified by the first repository that follows them (Phase 3), not by assertion.

## Definition of Done

- [ ] Both rules exist in `common/` and are reachable from `development-workflow.md`.
- [ ] Three tools in `tools/`, each with its fixtures, and rows in the README `tools/` table.
- [ ] `dew_flow_creds_for_devs` has `http/` for all six groups, a `POST_DEPLOY.md` under twelve items,
      and both checks wired into its workflows.
- [ ] The remaining five repositories have `POST_DEPLOY.md`; the four with HTTP have `http/`.
- [ ] `http-coverage.mjs` is failing (not warning) in every repository whose groups are covered.
- [ ] The authentication question for prod-side checks is answered and recorded.
- [ ] Pins bumped in all six consumers in the same task as each rules commit.
