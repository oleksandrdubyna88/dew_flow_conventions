# Knowledge base sync — `research/` tracks the system as it is (MANDATORY)

The `research/` knowledge base uses the **`architecture.md` + `module_[name].md`** convention:
`architecture.md` is the high-level entry point (system overview, container diagram, cross-cutting
concerns, module map); each `module_[name].md` deep-dives one logical module (purpose, Mermaid diagram,
core entities, entry points, external dependencies). Where a sentence describes something that does not
run, it is a bug in the file.

**Session start:** read `research/architecture.md` and the relevant `module_[name].md` before any
changes.

**After every code change:**

1. Update the relevant `research/module_[name].md` (purpose, logic flows, entities, endpoints,
   dependencies).
2. If cross-module or cross-repository interaction changed — update `research/architecture.md` too.
3. Re-render Mermaid diagrams (C4 / flowchart / sequence / ER); the syntax must render flawlessly.
4. **Run the plan completion check** from [planning-docs.md](planning-docs.md): does this work finish a
   plan, or has a plan's status line stopped matching reality? Promote in the same task.

**Self-audit before responding:** does the current code match the diagrams? Are new dependencies
listed? Fix mismatches first.
