# Git Workflow

## Commit message at task completion (MANDATORY)

Every time a task finishes, propose a commit message that covers the **entire diff currently in git** —
everything `git status` shows (staged, unstaged, untracked), not only the changes made during the task.
The working tree may also contain the operator's own edits or leftovers from earlier sessions; the
message must describe all of it.

1. Run `git status --short`, `git diff`, and `git diff --staged` to see the full working tree.
2. Cover **all** changed files; group unrelated changes into separate body bullets.
3. Follow the format below.

## Commit message format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci.

Note: attribution is disabled globally via `~/.claude/settings.json` — no generated-with trailers.

## Pull request workflow

When creating PRs:

1. Analyze the full commit history of the branch, not just the latest commit.
2. Use `git diff [base-branch]...HEAD` to see all changes.
3. Draft a comprehensive PR summary with a test plan.
4. Push with `-u` for a new branch.

> For the process before git (planning, TDD, review), see
> [development-workflow.md](development-workflow.md).
