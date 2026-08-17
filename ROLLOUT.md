---
paths:
  - "__rollout-doc-only__/**"
---
# Rollout — mounting this repository into a consumer

> The `paths` frontmatter above never matches a real file, so this document is not loaded into Claude
> sessions as a rule. It is the checklist for a human or agent performing a mount.

## First mount (per repository, one commit)

```bash
git -C <repo> submodule add https://github.com/oleksandrdubyna88/dew_flow_conventions.git .claude/rules/shared
```

Then delete the superseded local copies (state as of 2026-08-16):

- **all four repos**: `.claude/rules/common/logging-serilog.md`
- **`dew_flow_benchmark`** additionally: `.claude/rules/common/testing.md`,
  `.claude/rules/common/planning-docs.md`, `.claude/rules/csharp/nuget-packages.md` — and repoint the
  three links in `CLAUDE.md` to `.claude/rules/shared/common/...` / `shared/csharp/...`.

Commit `.gitmodules` + the mount + the deletions together.

## Notes

- **CI DOES need the submodule, since 2026-08-17.** This note used to read "CI does not need the
  submodule — builds and tests never read `.claude/`. Do not add `submodules: recursive` to workflows
  for this." That was true of its premise and the premise moved: `tools/plan-lifecycle.mjs` lives here
  and every consumer's CI runs it, so the file has to be on disk. Each workflow's checkout therefore
  carries `submodules: true` (`recursive` where another submodule already needs it, as in
  `dew_flow_rag_qln`). This repository must stay reachable to CI — public, or the workflow token needs
  access.
- **`dew_flow_mcp` is public**: after mounting, this repository's URL is part of a public tree. Keep
  this repository public, or the public clone experience breaks at `submodule update`.
- A fresh clone of a consumer needs `git submodule update --init .claude/rules/shared` before Claude
  sessions see the shared rules.

## Updating a pin later

```bash
git -C <repo> submodule update --remote .claude/rules/shared
git -C <repo> add .claude/rules/shared && git -C <repo> commit -m "chore: bump conventions"
```

Run in every consumer in the **same task** as the rule edit — see README, Editing discipline.
