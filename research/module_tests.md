# Tool scenario tests

Run `npm ci --ignore-scripts`, `npm test`, then `npm run check` at repository root.
The existing `tools/selftest.test.mjs` drives the established family checks. The new
`tools/rules.test.mjs` exercises real rule files in temporary directories, including Unicode
and spaces, and removes its own directory in test teardown.

Covered by the resolver suite: planned nonexistent files across two languages; task/path OR;
transitive dependencies; cycles; missing dependencies; duplicate/invalid metadata; empty
bodies; excluded docs; unknown tasks; escaping paths; changed canonical content; symlinks.
Windows without symlink privilege explicitly skips that case; WSL must exercise it.

The initial executable stub failed seven behavior assertions. On 2026-09-10 the combined
suite ran 53 cases: Windows passed 52 with the symlink privilege case explicitly skipped;
WSL passed all 53. The real CLI tests nested paths, missing PROJECT, scoped overrides and
bounded complete reads. A reproduced callback bug selected Rust for a second nonmatching
path; the regression failed before the fix and passed after it. The fixture reinstates
that bug and observes Rust returning, so removal of the fix remains detectable.
All 24 original bodies are checked against their baseline hashes, including section headings.
These are development observations, not acceptance of the full rollout.

Not yet covered: full CLI/consumer migration scenarios, real Codex/Claude source-read traces,
compaction, fresh clone/rollback, and the six-consumer rollout. These remain open in the plan.
