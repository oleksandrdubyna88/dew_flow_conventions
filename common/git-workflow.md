# Git Workflow

## Commit your OWN work, and only after it is verified (MANDATORY)

Superseded 2026-08-16 the earlier rule that a commit should cover *everything* `git status` shows. That
rule was written for one session per checkout, and this family no longer works that way: several agents
and the operator edit one tree at the same time, so "commit the whole diff" means signing your name to
someone else's half-finished change and burying it in a message about yours.

**First, make sure you are holding this rule at all.** A session is governed by the rules of the
repository it was OPENED in, and commits are made to the repository the files live in — which in
this family is routinely a different one. If this file is not in your context, read it from the tree
you are about to commit to (`.claude/rules/shared/common/git-workflow.md`) before staging anything.
See [the README](../README.md) — *Which rules a session actually has*.

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

### 4. On a file someone else is also editing, committing it WHOLE is always wrong

Rule 1 says "stage by path". That protects every file you did NOT touch, and does **nothing** for a
file you DID touch that somebody else is editing — because `git add <path>` stages the whole
working-tree version of it, theirs included.

Measured 2026-08-26, three times in one day, in both directions:

- a one-line `package.json` change committed **102 insertions**, 101 of them a peer's uncommitted
  palette, under a message about a broker fix;
- a shared design document was committed by one session carrying ~41 lines of another's unsaved text,
  and then partly deleted by that other session committing from an index staged before the first
  landed — both commits looked clean;
- an agent that had used the blob dance correctly on one commit reached for `git add` on the very next
  one and swept four hunks of a peer's security fix into a commit about ssh options.

The last is the important one: **knowing the technique is not the safeguard; using it every time is.**
A file counts as hot the moment any other session has it open, which in these trees is the default and
not the exception.

So, for a hot file, stage by hunk (`git add -p`) or rebuild it as a blob:

```bash
git show HEAD:path/to/file > scratch          # take the snapshot NOW, not earlier
# re-apply ONLY your hunks to the scratch copy
blob=$(git hash-object -w scratch)
git update-index --cacheinfo 100644,$blob,path/to/file
```

The worktree is never touched, so after your commit the file's remaining diff is exactly the other
session's work, which they then commit themselves. Take the `git show HEAD:` snapshot in the same
breath as the hashing: a peer committing into that file in between makes your blob silently revert
their landed change.


**`git commit -- <path>` is the same trap, and it is the one that catches people who read this rule.**
Rule 1 says "stage by path", so `git commit -- <paths>` reads like the disciplined form of it — it is
not. It commits the **working-tree** version of those paths, theirs included, exactly as `git add`
would. Measured 2026-08-27: an agent who had checked `git diff --cached` and found the index clear
committed one line of `package.json` by path and took a peer's two command declarations with it; their
matching `register()` calls were not yet committed, and `main` was red for 119 seconds. A clear index
means only that nobody is mid-commit. It says nothing about who else has edited the file you are about
to commit.

**Which hunks are yours: match your own IDENTIFIERS, never your memory of what you wrote.** In a tree
with an unknown number of hands, "these are mine" is a guess (rule 7). What is checkable is whether a
hunk's added lines mention symbols you introduced:

```bash
git diff -- path/to/file > all.patch
# keep only hunks whose added lines match identifiers YOU added; drop every other hunk
git apply --cached --recount kept.patch
```

Keep-by-identifier, not drop-by-attribution: the remainder is then "everything I cannot prove is mine",
which is the correct thing to leave behind. On 2026-08-27 a session applied this filter correctly and
then described the dropped remainder as a named peer's in its summary — the filter was sound, the
sentence about it was a guess dressed as a fact.

**Typecheck the staged snapshot on its own** before committing (rule 6). A commit can be correct in
your working tree and broken in isolation, which is exactly what a swept declaration is: the manifest
entry lands, the code that registers it does not.

### 5. Check the staged diff's SIZE, not only its deletions

A deletions-only check catches a stale index and misses an unintended INSERTION entirely — which is how
101 foreign lines rode into a one-line change. Before committing:

```bash
git diff --staged --stat
```

and read the NUMBER against what you meant to change. A one-line edit showing `102 +++++` is the whole
signature. Deletions you did not intend mean a stale index; insertions you did not intend mean somebody
else is in that file.

### 6. Verify the STAGED tree, not the working tree

In a shared checkout the working tree is usually red from someone else's half-finished work, and a
suite run over it says nothing about your commit — in either direction. Build what you are actually
committing:

```bash
git archive $(git write-tree) | tar -x -C /tmp/staged
cp -r node_modules /tmp/staged/...        # or junction; whatever the build needs
cd /tmp/staged/... && <build> && <test>
```

This is the only way to say "this commit is green" while the tree around it is not, and it is what makes
rule 3 checkable rather than aspirational. Extract the **whole repository**, not the subdirectory you
work in: tests that resolve fixtures, manifests or generated contracts relative to the repository root
fail in a partial extract and look like real regressions. (Measured: a partial extract produced 7
convincing failures, a full one produced 0.)

### 7. `git status` answers WHAT and `git log` cannot answer WHO — never name an owner

Untracked files and foreign hunks carry no author. Inferring one from the count of sessions you happen
to know about is how, on 2026-08-26, an agent told a peer in writing that a third session's work was
theirs — and then offered to wait for that peer to "land" a change they had never started, which would
have been an indefinite wait for both.

`git worktree list` beside `git status --short`, because a session working in a worktree is invisible to
both `git status` and any session listing. Then one message asking "is this yours?" — it costs nothing,
and a wrong attribution sends someone hunting through work they never did.


**Stronger than "ask": never name an owner at all.** `git status` answers WHAT and `git log` cannot
answer WHO — every session commits under the one configured author, so a day of four agents reads as
54 commits by one person. There is no query that returns whose hunk this is, which means any sentence
naming an owner is a guess however confident it sounds.

This was stated as a caution and then violated three times on 2026-08-27 — twice *after* the session
had written that it had learnt the lesson. Two of the three were in messages that also contained
correct work: a hunk filter applied soundly, then its remainder described as a named peer's; a
correction about attribution, followed by a plan attributed to the session receiving it. A caution
does not survive being right about everything else in the paragraph.

The sound form needs no attribution at all. Filter by your OWN identifiers (rule 4), call the
remainder **"not mine"**, and stop:

- ✅ "these six hunks are not mine — I dropped them"
- ✅ "git cannot say whose this is, and neither can I"
- ❌ "your hunks are intact and unstaged" — even when meant as a courtesy
- ❌ "whoever owns X committed it in <sha>" — the sha is a fact, the owner is not

If you genuinely need to know, ask everyone rather than telling someone.

### 8. `git mv` stages the ORIGINAL content — your edit to the moved file is still unstaged

`git mv` is `mv` plus `git add`, and the `git add` runs **before** you edit the file at its new
path. So the rename goes into the index carrying the OLD bytes, and everything you then write into
the moved file sits unstaged beside it. `git status` shows this honestly and easily missed:

```
RM  todo/PLAN_x.md -> research/PLAN_x.md
^^
R = the rename, staged.  M = your edit, NOT staged.
```

Commit there and the file arrives at its destination with its original content. The shape this
takes in practice: a plan promoted to `research/` whose status line still reads *"nothing
implemented yet"* — the move landed, the rewrite did not, and the document now says the opposite of
why it was moved.

**After any `git mv`, `git add` the DESTINATION path explicitly**, and read the staged content
rather than the working tree:

```bash
git mv todo/PLAN_x.md research/PLAN_x.md
$EDITOR research/PLAN_x.md          # rewrite the status line
git add research/PLAN_x.md          # <- the step that is easy to skip
git show :research/PLAN_x.md | head # <- and the one that proves it
```

`R100` in `git diff --cached --name-status` means "renamed, byte-identical". After a move whose
whole point was to change the file, `R100` is the bug, not the summary.



**A staged `git mv` is exposed to every other session, and needs no hot working tree to be taken.**
Rule 4 is about a file two people are editing; a rename is worse, because the move has *already*
staged itself. A peer's plain `git commit` — not `git add <path>`, not a shared file, just a commit —
carries your rename away with it. Measured twice on 2026-08-27, in both directions between two
sessions.

**So commit a `git mv` immediately, in its own commit**, rather than leaving it staged while you keep
working:

```bash
git mv todo/PLAN_x.md research/PLAN_x.md
$EDITOR research/PLAN_x.md
git add research/PLAN_x.md
git commit -- research/PLAN_x.md todo/PLAN_x.md    # now, not at the end of the task
```

The window in which someone else can take it is then seconds rather than the length of your task. A
swept rename is not lost — the file is where it belongs — but it lands under a message that did not
intend it, and the commit that *did* intend it is left describing a move it no longer contains.


For a **plan promotion** this needs one more turn of the screw, because "commit it immediately" is
not available there: a promotion is a move plus a status rewrite plus link fixes in several files,
and committing the move alone lands a plan in `research/` still claiming it is unfinished. The order
inverts instead — every edit first, `git mv` last, committed in the same breath. See
[planning-docs.md](planning-docs.md), *The `git mv` goes LAST*.

### 9. "It is green" is a claim about a COMMIT, never about now

On a main that several sessions push to, a working-tree check cannot observe a window that has already
closed. Measured 2026-08-27: one session reported `main` red; two others checked and reported it green.
All three were right — of different commits. `main` had been red for 119 seconds and had healed two
minutes before either check ran, and no amount of care in reading the tree could have seen it.

So a claim about build state carries the sha it is about, and is settled by **that sha's CI run**:

```bash
gh run list --json headSha,workflowName,conclusion \
  --jq '.[] | select(.headSha|startswith("<sha>"))'
```

- "red as of `e383f59`, per its `ci · extension` run" — checkable, and still true tomorrow.
- "main is red right now" — unfalsifiable within a minute of saying it, and reliably wrong by the time
  anyone reads it.

The same applies to a green claim: `git log` proving your commit is on main says nothing about whether
CI passed on it. Two different questions, two different commands.

A corollary for the tooling used to answer such questions: when a grep says *absent*, be sure the
pattern could have matched a present instance. A search for `register('x'` finds nothing when the call
was wrapped across lines, and reports it as "not registered". Match the identifier anywhere in the
file, then confirm with the test that actually asserts the property.


### 10. When you HAVE swept someone's work: do not revert it

Rules 4 and 8 are about prevention. This is the one that matters after prevention failed, and the
instinct it corrects is strong: on finding that your commit carried a peer's uncommitted work, the
urge is to undo it. **In a tree several sessions are editing, undoing is the more expensive
mistake.**

A swept change is not lost — it is on main, doing its job. What is wrong is only its attribution.
Reverting turns a wrong commit message into a genuine regression: the peer's file returns to its old
state under them, their next commit conflicts or silently re-lands it, and the CI that was green goes
red for a reason nobody can trace to a decision. Two sessions reached this conclusion independently
on 2026-08-27 — one over swept command declarations, one over a swept `git mv` — and both were right.

So:

1. **Leave it.** A wrong commit message is cheaper than a revert, every time.
2. **Check whether you broke anything**, because a swept half is the dangerous shape: a manifest entry
   whose registration is still uncommitted, a rename whose content edit is not. Resolve the specific
   sha (rule 9), not the tree.
3. **Tell the peer**, and say plainly whether main is broken and what they will see — typically a
   `git diff` emptier than they left it, and hunks already applied.
4. **Speak only about your own commits.** Rule 7 still holds: you cannot say whose the swept work was,
   only that yours took it. "The staleness predates me, but two of the three commits that widened it
   are mine" is the available shape, and it is a better answer than either "not mine" or a guess.

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

## One version string, one build — even for a build only you installed

A version identifies bytes. The moment two different builds answer to the same string, every later
report about that version is ambiguous, and the ambiguity outlives everyone who could resolve it:
"fixed in 0.62.0" and "still broken in 0.62.0" are then both true.

The tempting exception is the local one — a build nobody but you installed, fixed within the hour,
rebuilt from the same version. Take the bump anyway. On 2026-08-26 an extension was cut at 0.62.0,
installed on the owner's machine, and found an hour later to carry a script break-out; the fix was
shipped as **0.62.1** rather than as a second 0.62.0, and the changelog says which build the first
string meant. That costs one line and removes a question nobody would otherwise be able to answer
six months later.

This applies to anything installed, packaged or handed over — not only to what reaches a registry.

## Pull request workflow

When creating PRs:

1. Analyze the full commit history of the branch, not just the latest commit.
2. Use `git diff [base-branch]...HEAD` to see all changes.
3. Draft a comprehensive PR summary with a test plan.
4. Push with `-u` for a new branch.

> For the process before git (planning, TDD, review), see
> [development-workflow.md](development-workflow.md).
