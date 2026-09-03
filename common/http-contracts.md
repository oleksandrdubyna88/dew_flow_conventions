# HTTP contracts — an `.http` file per route group, run before every release (MANDATORY)

> Extends [testing.md](testing.md), which governs what a test may claim. This rule covers the one tier
> nothing else covers: the request as a client actually sends it. Routing, path grammar, the verb,
> model binding, the auth scheme, the status code, the serialized shape — everything between the caller
> and the handler, none of which a test inside the process can see.

The evidence is already written down here. `/v1/use/exportEnv` was **unreachable in every released
build** — the route grammar rejected a capital letter — while a generated contract file and a test on
each side agreed with themselves and stayed green throughout. The first real request anybody sent found
it in seconds ([testing.md](testing.md), *a contract with TWO IMPLEMENTATIONS*). An `.http` file is that
request, written down once, instead of typed by hand on the day something is already broken.

## Where the files live

`http/<group>/` at the repository root. One folder per group, always — a group with a single route
still gets its own folder, because the second route in it needs somewhere obvious to go.

**A "group" is whatever the framework already groups by. It is the controller where controllers exist,
and it is not only a controller:**

| What the repository has | The group, and therefore the folder |
|---|---|
| Controllers (ASP.NET Core MVC / Web API) | one controller = one folder, named after it |
| Minimal API with `MapGroup` | one `MapGroup` = one folder |
| Minimal API mapped flat | the shared path prefix — every `/api/shares/**` route → `http/shares/` |
| axum or another Rust router | the `Router` nested under a prefix; failing that, the prefix itself |
| Anything else | the smallest unit a person names when asked *which part of the API is this* |

Inside a folder, split by purpose rather than one file per route — `happy.http`, `errors.http`, or
per-endpoint files once a group is large. One `# @name <snake_case>` per request, unique across the
whole tree: that name is how a failure gets re-run and how a coverage report points at something.

## What every endpoint gets

1. **The happy flow, asserting the status AND the shape.** Not the status alone — a `200` carrying
   `null` where a list belongs passes a status check and breaks every caller.
2. **One request per error status the endpoint returns by its OWN decision** — unauthenticated,
   forbidden, not found, malformed, conflicting, over the limit. Those are branches in the handler, and
   they are exactly the ones nobody exercises by hand.
3. **A line naming what you deliberately did not cover.**

### Only what can reasonably be provoked over the wire

This rule asks for requests, not for machinery. A branch reachable only with the database stopped, the
network unplugged, the disk full or a peer wedged is **out of scope**: do not build a harness to reach
it, and do not fake it with a mock, which proves the mock works.

Say so in one line, where the requests are:

```
# @uncovered 503 — reached only when the store is down; not provokable from a request
```

One comment line is the whole cost. What it buys is the difference between *"the wire cannot reach
this"* and *"nobody thought about it"* — indistinguishable in a file that simply says nothing.

**When a whole ROUTE is out of reach, the declaration names it**, and the reason may wrap onto plain
`#` lines beneath:

```
# @uncovered GET /api/rag/projects/{id}/index-state — it resolves a collection through the vector
#            store, and the daemon deliberately refuses to guess one.
```

`http-coverage.mjs` then counts that route as **declared** rather than missing. This is what makes an
armed coverage check possible at all: some routes cannot be reached from a request by construction —
they need a vector store, a card, a second account — and without a way to record that decision the
check would stay red forever, which is a check somebody switches off. A declaration is a decision on
the record; silence is the gap.

### `# @prod` — the tag that means "safe against something live"

A request is prod-safe only when it **reads and changes nothing**: no writes, no deletes, no
invitations sent, no quota consumed, no rows left behind.

```
# @name vault_get_returns_the_callers_blob
# @prod
GET {{baseUrl}}/api/vault
Authorization: Bearer {{token}}

?? status == 200
```

Untagged is the default, and the default is **not** safe. Consent is recorded per request; no rule of
thumb makes a `POST` safe, and *"it only creates a test row"* is how a live store fills with test rows.

The prod-tagged subset is what [post-deploy-checks.md](post-deploy-checks.md) sends at the deployed
thing. Everything else runs against a stack you started yourself, where breaking data costs nothing.

## The trigger — forward first, backfill second

- **A new endpoint ships with its `.http` in the same commit as the endpoint.** Not the next task. An
  endpoint that exists without one is the state this rule exists to prevent, and it is cheapest to
  write while you still remember which statuses you made it return.
- **A change updates it in the same task** when it touches any of five things: the route, the verb, the
  auth requirement, the set of statuses, the shape of what is accepted or returned. A change that
  touches none of them — a faster query, a better log line — changes nothing here.
- **Backfill is per group**, never "the whole repository, first". A repository with sixty routes does
  not stop to write three hundred requests; it covers the group it is touching, and its coverage check
  moves from warning to failing once its groups are done.

## Not every API is an HTTP API

A tool surface served over stdio — an MCP server — has no requests to send, and gets no `.http` files.
Its contract is the tool schema; it already has a detector (`--print-surface`) and its own rules for
what counts as a breaking change, in `dew_flow_mcp`'s `VERSIONING.md`. Forcing this rule onto it would
produce an empty folder and a checkbox nobody can ever tick.

One repository can be both. HTTP routes get `http/`; the tool surface gets its fingerprint.

## Running them

The files are plain `.http`: they open in VS Code and send one request at a time, which is what makes
them worth writing while the endpoint is still under your hands. Headless — in CI and before a release
— they run through [httpyac](https://httpyac.github.io), the same files, with assertions:

```
?? status == 404
?? header content-type matches ^application\/problem\+json
```

and a script block for anything a matcher cannot state:

```
{{
  const assert = require('node:assert');
  test('an empty vault answers with [] rather than null', () => {
    assert.ok(Array.isArray(response.parsedBody.entries));
  });
}}
```

**Before every release the whole suite runs against a stack started for the purpose**, and the verdict
is the exit code, never the log tail:

```bash
npm install --save-dev httpyac@6.16.7          # once, in the repository that has an API
node .claude/rules/shared/tools/http-run.mjs   # 0 pass · 1 CONTRACT · 3 environment · 4 config · 5 no report
node .claude/rules/shared/tools/http-run.mjs --tag prod --target https://live.example.com
```

| Exit | Meaning | What you do |
|---|---|---|
| `0` | pass | done |
| `1` | **contract regression** | the API answered, and answered differently than the suite requires |
| `3` | environment | the stack did not start, or nothing answered — the contract was NOT exercised |
| `4` | configuration | the message names the missing piece; fix and re-run |
| `5` | no valid report | the run proved nothing. There is no "probably fine" |

`--all` is passed for you and is not optional: without it httpyac can drop into an interactive region
picker and hang a headless run forever. `--name` is silently ignored whenever `--all` is present, which
is why `--tag` materialises a filtered tree rather than naming requests (both measured in the
`ClaudeRag` spike).

The other half of the rule is checked by
[`http-coverage.mjs`](../tools/http-coverage.mjs) — every route the repository serves has at least one
request. It reads the application's own route table when given one (`--routes`), and falls back to a
text scan of the sources, which is a bootstrap rather than the destination: *enumerate, never retype*
([testing.md](testing.md)). Adopt it with `--warn`, drop the flag when the backfill is done.

**A stack that would not start is an ENVIRONMENT failure, never a contract regression.** Report which
one you have: *"the suite could not run"* and *"the API changed"* are opposite statements, and only one
of them is about the code. A run that produced no valid report proved nothing — there is no
"probably fine".

## Never

- Never assert only a status code where the response has a shape.
- Never tag a mutating request `# @prod`.
- Never build infrastructure to provoke an error the wire cannot reach — declare it `@uncovered`.
- Never report an environment failure as an API regression, or the reverse.
- Never weaken an assertion, or change production code, to make a suite green.
- Never invent `.http` files for a surface that takes no HTTP requests.

## Definition of Done

- [ ] Every endpoint added or changed in this task has its requests under `http/<group>/`, in this commit.
- [ ] Each has a happy flow asserting status **and** shape, plus one request per error status the
      endpoint decides itself.
- [ ] Branches the wire cannot provoke carry an `# @uncovered` line saying why.
- [ ] Read-only, side-effect-free requests are tagged `# @prod`; nothing else is.
- [ ] The suite ran against a started stack before the release, and the summary says whether a failure
      was environmental or contractual.
- [ ] For a stdio tool surface: no `.http` was invented — the surface fingerprint is what moved.
