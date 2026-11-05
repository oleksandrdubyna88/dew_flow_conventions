// This repository's token and its `## Tokens` row (rule §1 of `common/test-leftovers.md`) — the ONE file of the helper that is not shipped as it is.
//
// `owned.mjs`, `git.mjs` and `leftovers-check.mjs` are copied byte for byte into every repository that uses them (a Node consumer vendors them
// and pins their sha256, like the janitor). They hold no token, so a copy never carries the token of the repository it was copied from. A repository
// that copies them therefore writes its OWN `owned-token.mjs` beside `owned.mjs`, with the same two exports:
//
//   REPO_TOKEN  its row of the rule's `## Tokens` table: `[a-z0-9]{2,12}`, not of the owner grammar `^[uw][0-9]{1,10}$`
//   REPO_ROW    the "repository" column of that row, which the guard takes as `--identity`
//
// and never copies THIS file: the token below is the shared-rules repository's, and the guard (`tokenConstants`) finds the constant here.
// The guard reports a copy of `owned.mjs` with no `owned-token.mjs` beside it, and a constant that is not a row of the table that names this
// repository. A consumer that does not copy the helper whole binds its token with `ownedFor({ token, row })` and needs no such file.

export const REPO_TOKEN = "conventions";               // rule §1 — the ONLY place this repository's token is written
export const REPO_ROW = "the shared-rules repository"; // rule §1 — the `## Tokens` row (its repository column) that names THIS repository: a token is only this repository's if its row says so
