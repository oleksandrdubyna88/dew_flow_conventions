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
