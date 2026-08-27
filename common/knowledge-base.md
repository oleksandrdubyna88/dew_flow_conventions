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

## Shortening a rule drops the caveat — and its absence reads as permission

Twice on 2026-08-27, condensing something correct produced something wrong, in the same way both
times: the qualifier was the part that made the original true, and the shortened form did not merely
lose it — it read as an endorsement of what the qualifier forbade.

- A memory note said *"a clear index is not sufficient; `git commit -- <path>` commits the WORKING
  TREE version"*. Condensed into a pointer, it became *"commit only your own work; `git commit --
  <paths>` and never a whole shared file"* — which recommends the very command the original warned
  about. The note was deleted as redundant with the rule; the caveat went with it.
- The same pointer stated the sha every consumer pinned. Accurate when written, stale within the
  hour, and a pointer that names a version becomes the thing it was written to prevent.

This is not a wording slip, it is a predictable direction of error: a caveat costs words, so it is
what a summary drops, and a rule stripped of its exception reads as unconditional. It applies to a
changelog line, a docblock, a summary paragraph, a `research/` update — anywhere a longer correct
thing is restated shorter.

So when you shorten:

- **Keep the qualifier over the example.** "Not the safe form" survives; the worked example can go.
- **Name no version, sha, count or path that moves.** Point at the command that produces the current
  value instead.
- **Read the short form as an instruction from someone who has not seen the long one** — which is
  its only reader. If it can be followed into the failure the original prevented, it is wrong.
- **Deleting a note as "redundant with the rule" is a claim to check, not to assume.** Confirm the
  rule carries every caveat the note did, or the deletion removes a protection rather than a copy.
