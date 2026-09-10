---
paths: ["__shared_entry_explicit_read_only__/**"]
---
# Shared instruction entry

This is the single loading procedure for Claude Code and Codex. It delivers advisory
instructions; runtime permissions enforce access separately. Do not claim that identical
source hashes prove identical model behavior or erase higher-priority instructions.

1. Determine the repository of the files you are about to work on using
   `git -C <target-directory> rev-parse --show-toplevel`. This supports nested starts
   and worktrees whose `.git` is a file. All arguments below are relative to that root,
   not to this entry or your session's original working directory.
2. Read `<root>/.agents/PROJECT.md` completely. Markdown links in PROJECT are relative
   to that file; shell commands and inline code paths are relative to repository root
   unless the project explicitly says otherwise. Read project-design documents it requires.
   PROJECT may declare `requires: ["research/architecture.md"]` in YAML frontmatter;
   these paths are root-relative, validated as required sources and included in the manifest.
3. Use `<root>/.agents/conventions/tools/rules.mjs` below. In the conventions source
   repository itself, use `<root>/tools/rules.mjs`. Node 20+ is required. If locked
   dependencies are missing, run `npm ci --ignore-scripts --prefix <conventions-root>`
   within the authorized task. No model calls occur in this tool.
4. Run `node <resolver> check --repo <root>` before affected edits. An absent entry,
   missing dependency, invalid metadata, different/dirty submodule, unresolved override,
   or failed command means **instruction loading is incomplete**. Do not replace the
   result with defaults or continue affected edits. Restore the gitlink's version within
   the authorized task; never update to remote HEAD as a missing-file fallback.
   Independent read-only investigation may continue.
5. Run `node <resolver> explain --repo <root> --task <task> --file <planned-path>`.
   Repeat `--task` and `--file` for every applicable action, task subject source, planned
   new file, and old/new name in a rename. An empty initial diff is normal: supply the
   proposed files before creating them. Run `explain --task inspect` to see the task
   vocabulary; choose every relevant task, not just the easiest one. Use `policy` for
   instruction changes and `docs` for documentation. Include `gpu` before GPU work.
   Required instructions and design references read solely for this preflight are not task
   subject files; include them in scope when the task itself inspects or changes them.
6. Read every selected rule completely with `node <resolver> read` and the **same scope**.
   If the payload exceeds 32 KiB, use `--only <id>` per rule from `explain`. Each response
   names the remaining ids; it is only that response's coverage, not durable session state.
   Check BEGIN/END boundaries and the hash. If your host truncates output, read that source
   in smaller consecutive ranges until complete. Never interpret truncation as full reading.
7. Dependencies are mandatory even when their own paths/tasks do not match. Selection is
   paths OR tasks, plus always rules and transitive dependencies, deduplicated by id.
   Metadata in each rule is the only selection source; todo, research, fixtures and tool
   comments are not policy catalogs. Local rules belong in `.agents/rules` with `local.*` ids.
8. Repeat selection and read newly needed sources **before** expanding to another language,
   file or task. After compaction, a new session, or a changed SHA/scope, re-read the entry,
   project and selected rules. No persistent read-cache is trusted. On another repository,
   run its own procedure. Scope local rules to their repository; already-loaded context
   cannot be unloaded. If previous or higher-priority instructions conflict, use a fresh
   session rooted in the target and explicitly report any remaining conflict.

The loader checks root adapters and scoped nested AGENTS/CLAUDE/override files. Unmanaged
instruction sources require explicit reconciliation before equivalence can be claimed;
it never rewrites them. User/global/managed instructions and custom filename fallbacks are
host inputs outside its visibility: inspect the actual host instruction chain in smoke tests.
Shared rules do not override that chain. A task can have no language-specific rule while
still receiving the always core; do not invent an unwritten language policy.

Claude's root adapter imports AGENTS. Codex follows AGENTS' imperative read instructions;
native expansion of Claude's `@file` syntax by Codex is not assumed. Review tools and
permissions remain in each host's adapter. A missing reviewer is an incomplete review,
never an implicit pass. Read the selected coai rule for the gate contract.
