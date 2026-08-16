# Git Workflow

## Commit your OWN work, and only after it is verified (MANDATORY)

Superseded 2026-08-16 the earlier rule that a commit should cover *everything* `git status` shows. That
rule was written for one session per checkout, and this family no longer works that way: several agents
and the operator edit one tree at the same time, so "commit the whole diff" means signing your name to
someone else's half-finished change and burying it in a message about yours.

**Two obligations, and they are not negotiable separately.**

### 1. Commit only what your task touched

- Stage **by path**, never `git add -A` / `git commit -a` in a tree you do not exclusively own. Name the
  files your task created or changed.
- Read `git status --short` before committing anyway — not to sweep it in, but to KNOW what else is
  there. If foreign changes sit in files you also touched, say so in your summary rather than resolving
  it silently.
- Leave everything else exactly as you found it: unstaged, untracked, unmentioned in your message.
  Someone is holding it.
- One task, one commit, describing that task. Unrelated work you happened to notice is a separate
  commit — or, more often, somebody else's.

### 2. Never commit work you have not seen working

Before the commit: the build is green, the tests for the behaviour you changed have run and passed, and
where what ships is an ARTEFACT rather than source, you looked inside the artefact
([development-workflow.md](development-workflow.md) — *Verify the artefact, not the source*). Report the
observations, not the intention.

### 3. In a shared tree, "it builds here" is not "this commit builds"

Your working tree contains other people's uncommitted files. A green build over it proves the TREE
compiles, never that your COMMIT does — and the two diverge the moment your change references a type
somebody else has written but not yet committed.

Measured here on 2026-08-16, twice in one morning. A commit named for round-robin subscriptions swept in
two DI registrations and a documentation section belonging to a reliability fix running in parallel; the
types those lines reference existed only in the other agent's uncommitted work, so **that commit does not
compile on its own** — it was repaired by the next one, and anyone bisecting through it meets a build
error that has nothing to do with either change. Separately, a `todo/README.md` row was committed
pointing at a plan file that stayed untracked, so `HEAD` carried a link to a document no clone contains.

So, before committing in a tree you share:

- **Stage by path, then look at what you staged** — `git diff --staged` — and ask of each hunk: is this
  mine, and does it stand up without anything still sitting unstaged beside it?
- **A file you did not write is not made yours by being in a file you did edit.** Two agents editing one
  file is the case the rule above is about; say so in your summary and leave their lines.
- **A reference and its target are one commit.** A README row and its plan, a registration and the type
  it registers, a call site and its method: committing one without the other publishes a broken tree even
  though yours is fine.
- When in doubt about whether the commit stands alone, the cheap check is to read the staged diff for
  names your commit does not itself introduce.

### When verification is BLOCKED — ask, do not guess

Blocked is a normal state on this hardware: a running host holds the DLLs, the GPU is taken by a pass,
a container is down, Smart App Control refuses a freshly built binary. When it happens, **do not commit
silently and do not report the work as done**. Instead:

1. **Write the finished commit message into the chat**, in full, so nothing is lost if the session ends.
2. **Name the blocker** and what specifically could not be checked — "the AppHost holds `v2.Mcp/bin`, so
   the test executable is stale" is useful; "could not verify" is not.
3. **Ask the operator, offering exactly these three**:
   - commit as it is, unverified and labelled so in the message;
   - wait ~30 minutes and try the run again;
   - run it now (the operator frees whatever holds it) and commit if it comes back green.

The choice is the operator's because only they know what else is running. Guessing at it is how an
unverified commit acquires a message that claims it was tested.

## Commit message format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci.

The body says what was **observed**, not what was intended: the suite's own numbers, the artefact check,
and any deviation from the plan the work followed. A message that reads as verified when it was not is
worse than no message, because the next reader stops looking.

Note: attribution is disabled globally via `~/.claude/settings.json` — no generated-with trailers.

## Pull request workflow

When creating PRs:

1. Analyze the full commit history of the branch, not just the latest commit.
2. Use `git diff [base-branch]...HEAD` to see all changes.
3. Draft a comprehensive PR summary with a test plan.
4. Push with `-u` for a new branch.

> For the process before git (planning, TDD, review), see
> [development-workflow.md](development-workflow.md).
