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

Additional regressions: a root file target failed via a 10-second timeout before the fix;
now it fails immediately. An inspect-only dependency incorrectly consumed the core budget;
it now stays outside that budget while dependencies of always rules remain counted.
Missing PROJECT requirements and npm dependencies produce explicit failures.

A bounded real-agent inspection ran against 8c5a418 on Windows. Claude Code 2.1.258
(`claude-opus-5[1m]`) read ENTRY/PROJECT and all five selected inspect/C#/TypeScript rules,
with matching hashes and complete rule boundaries, and reported concrete language constraints.
Codex 0.153.4 read the same language/core sources after adapting its Git environment to the
Windows read-only sandbox, but the turn ended with the subscription usage-limit error.
Its run is incomplete, not a behavioral pass. Temporary JSONL traces were bounded to 256 KiB
per agent and 180 seconds by the probe. No installs or global configuration writes occurred.

WSL nested-start probe also completed: Claude Code 2.1.197 (`claude-opus-4-8[1m]`)
started in `tools/`, discovered the repository root and read the same five sources, 25,464
bytes. Its trace was 195,035 bytes without truncation. It correctly reported working-tree
mode and retained advisory/host-policy caveats. The external 180-second timeout owns cleanup.

The HTTP-only selection regression failed before the dependency was declared and passed
afterward. The complete suite now contains 55 cases (one Windows symlink privilege skip).

PR follow-up adds an in-process real-Git CLI protocol scenario, so coverage measures the
actual implementation rather than fixture copies. A dot-segment regression first omitted
`csharp.doctrine` for `src/./file.cs`; normalization restores the same selection as the
canonical path. Repeated leading `./` and separators are covered too.
The follow-up suite passed 56/57 on Windows (one symlink privilege skip) and 57/57
in an isolated WSL/Linux checkout on 2026-09-10. A Windows-created worktree cannot be
used directly by Linux Git because its `.git` file contains a Windows absolute path;
the Linux run used the same source over a native Linux clone, without rewriting that file.

Not yet covered: consumer migration scenarios, successful complete Codex behavior, compaction,
fresh clone/rollback and the six-consumer rollout. These remain open in the plan.
