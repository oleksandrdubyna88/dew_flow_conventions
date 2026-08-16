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

## Verify the ARTEFACT, not the source (MANDATORY)

A build step that does not run leaves the previous artefact in place, and every downstream signal keeps
saying "success". Measured here: a VS Code extension was packaged without a `vscode:prepublish` script, so
the `.vsix` carried JavaScript three versions old. It installed cleanly, reported success, and behaved
exactly as before — while the operator restarted the editor twice looking for a change that was never
shipped.

The type check made it worse rather than catching it: `tsc --noEmit` proves the SOURCE compiles while
emitting nothing, so it confirmed the correctness of code that was not in the package.

So, whenever what ships is a built artefact rather than the working tree:

- **Look inside it.** Unzip the package, grep the compiled output for a symbol only the new version has, read
  the DLL's timestamp. "Successfully installed" is the installer's opinion about a file, not about its
  contents.
- **Make the build unskippable** — a prepublish hook, a packaging step that compiles — so the next person
  cannot repeat it.
- The same trap has a sibling on this machine: a host holding DLLs makes `dotnet build` report
  `0 error(s)` for projects it silently could not copy. A clean build line is not proof that the binary you
  are about to run is fresh.
