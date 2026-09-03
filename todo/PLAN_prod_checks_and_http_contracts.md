# PLAN — `.http` contracts and post-deploy checks, with the tools that enforce them

> Status: **shipped 2026-09-03 across all six repositories.** The open tail is small and named: the
> `rag_qln` backfill (five of thirteen groups written, coverage reporting rather than failing), the
> authentication decision for the vault's prod-side checks, and the ~20-site null-dereference class
> that phase 4 enumerated in `rag_qln` and did not fix. Scope: `common/http-contracts.md`,
> `common/post-deploy-checks.md`, three Node tools in `tools/`, and one `http/` tree plus one
> `POST_DEPLOY.md` in each of the six consumers.
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

### Phase 3 — pilot: `dew_flow_creds_for_devs` *(done 2026-09-03)*

**Shipped:** 59 requests across six groups (`platform`, `vault`, `team`, `shares`, `metrics`,
`org-recovery`), **26 of 26 routes covered**, 12 declared `@uncovered` gaps, a seven-item
`POST_DEPLOY.md`, and three CI steps. Verified by running: `http-run` exit 0, twice consecutively
(the suite leaves the store as it found it), and the `--tag prod` subset — 6 requests, 24 checks —
separately.

**The pilot's first run found a live defect**, which is the whole argument for the tier:
`POST /api/shares` answered **500** to any client omitting `entityKind`, a field the record documents
as optional. The source-generated deserializer does not apply the property initializer, so
`EntityKind` arrived null and `IsValid()` dereferenced it. Reachable by anyone who can authenticate,
and invisible to 164 green tests because every envelope they build happens to send the field. Fixed
behind two RED tests; suite 164/164 after.

**What the exercise found in the TOOLS**, all four fixed with a red test first: the JUnit reader
under-counted 92 cases as 26 (greedy attribute matching ate self-closing tags); the failure line named
neither the request nor the observed value; the checklist table split on escaped `\|`; and two
additions the pilot needed — `--require-env`, and carrying the suite's `httpyac.config.js` into a
tag-filtered tree.

**Deviations worth keeping:**

- **Three single-route prefixes share one `platform/` folder.** `/api/health`, `/api/client-config`
  and `/api/whoami` are what a person means by "the platform endpoints" and are always read together.
  The grouping table's last row is the escape hatch; it was used deliberately and said so in the file.
- **The suite signs its own tokens.** `httpyac.config.js` mints four `Local`-scheme identities from
  `VAULT_LOCAL_SIGNING_KEY`, which is what makes the authenticated half runnable headless at all. The
  key never enters the repository.
- **The environment contract was WRONG until it was run**: the roster needs three officers, not two,
  and a two-officer roster silently disables corporate recovery — so every officer request would have
  failed with a 403 that looks contractual. Written down in `http/README.md`.
- **The two `target-vault` routes are covered by their refusals**, not by their success paths. The
  refusal — *a session that does not exist must never expose a target's vault* — is the assertion that
  matters, and it is reachable; the ceremony's success path is not.
- **The authentication question is unresolved and was NOT worked around.** `POST_DEPLOY.md` runs five
  anonymous items; the authenticated round trip is named in the file as absent, with the reason.

### Phase 3 as planned (kept for the record)

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

### Phase 4 — rollout *(done 2026-09-03, one repository partially by design)*

| Repository | Suite | Coverage | `POST_DEPLOY.md` | Run against |
|---|---|---|---|---|
| `dew_flow_mcp` | 4 requests, 13 checks | **2/2**, armed | 5 items, 4 auto | a live host |
| `dew_flow_sidecar_rust` | 10 requests, 24 checks | **6/6**, armed | 5 items, 4 auto | the prebuilt binary |
| `dew_flow_benchmark` | 20 requests, 37 checks | **12/12**, armed | 4 items, 3 auto | both hosts + a real Postgres |
| `dew_flow_rag_qln` | 20 requests, 49 checks | **19/49**, `--warn` | 4 items, 3 auto | a live daemon + Postgres |
| `dew_flow_connect_other_ais` | none — no HTTP surface | n/a | 4 items, 2 auto | the real release + the marketplace |

Every suite was **run**, not merely written, and every automated checklist item was watched passing
against something live. Three were also watched FAILING on purpose — a wrong commit hash, a wrong exe
hash, and the benchmark's two store items with the database container stopped.

`rag_qln` is partial deliberately: 49 registrations, five groups written, coverage reporting rather
than failing until the backfill lands. That is the rule's own instruction, not a shortcut.

**What the rollout found, and where it went:**

- **A 500 in `rag_qln`** — `POST /api/companies` on an omitted `key`, a positional record binding null.
  A CLASS: ~20 unguarded dereferences across three endpoint files. NOT fixed — that is a decision for
  the tree's owner under `security.md`'s "a measure applied at SOME of its sites". Recorded in
  `http/README.md` there, and the pattern became **doctrine 4a**, which the vault's identical defect
  the same morning is the second instance of.
- **`/api/bench/health` answers `ok` with its database stopped** while `/api/bench/runs` answers 500.
  Observed directly. The checklist there uses no health route because of it; the endpoint itself is a
  live violation of `reliability.md` and is left for its owner.
- **A grouped route read as MISSING** — `http-coverage` compared a `MapGroup` tail against a full path.
  Fixed, with the fixture and the red test.
- **Two traps in the checklist commands** — `process.exit()` in an async callback crashing Node on
  Windows after printing the right answer, and an unescaped `|` splitting a table row. Both fixed in
  all six checklists; both recorded in the rule.
- The tools' own suite is **33 tests**. (The commit that landed the grouped-route fix says 35 in its
  message; the number was wrong when written and is corrected here rather than by rewriting `main`.)

### Phase 4 as planned (kept for the record)

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

- [x] Both rules exist in `common/` and are reachable from `development-workflow.md`.
- [x] Three tools in `tools/`, each with its fixtures, and rows in the README `tools/` table.
- [x] `dew_flow_creds_for_devs` has `http/` for all six groups, a `POST_DEPLOY.md` under twelve items,
      and both checks wired into its workflows.
- [x] The remaining five repositories have `POST_DEPLOY.md`; the four with HTTP have `http/`.
- [x] `http-coverage.mjs` is failing (not warning) in every repository whose groups are covered —
      armed in four, reporting in `rag_qln` while its backfill runs.
- [ ] The authentication question for prod-side checks is answered and recorded.
- [ ] `rag_qln`'s remaining eight groups are covered and its coverage check is armed.
- [ ] The null-dereference class in `rag_qln` is enumerated, fixed and left behind as a scan.
- [x] Pins bumped in all six consumers in the same task as each rules commit.
