# PLAN — the agent-models mod moves to the public repository `dew_flow_mods` and updates itself

> Status: **DRAFT, 2026-11-23.** Plan only, nothing implemented yet; the plan round is not run. Scope: a new PUBLIC
> repository `oleksandrdubyna88/dew_flow_mods` (a Claude Code plugin marketplace with the mod, its tests, its CI and a
> gated `release` ref); in this repository the removal of `mods/agent-models`, of the installer
> (`settings/hooks/lib/agent-models-*.mjs`, their `.claude/hooks` copies, `tools/agent-models-*`) and a new small
> session-start step that registers the marketplace in `~/.claude/settings.json`; then ONE `release` promotion here and
> one pin bump in each of the nine consumers. Parents: [PLAN_agent_models_mod.md](../research/PLAN_agent_models_mod.md),
> [PLAN_agent_models_1_5_0.md](PLAN_agent_models_1_5_0.md) and `todo/PLAN_agent_models_1_6_0.md` (on branch
> `feat/agent-models-pins`, not on `main` yet, so it is a path here and not a link).

## Goal (the owner's words, 2026-11-23, translated from Russian)

1. "Move this mod's code into a separate repo, dew_flow_mods, and change the conventions so it is installed from
   there automatically on all projects." "The repo must be public."
2. "And if possible — it should check by itself and always install the latest version of the mods, so mods are
   updated without pin bumps."
3. The order: "First finish all the code. Roll it out to the separate repo, and then do the pin bumps to the new
   repo. Then I will test."

So: 1.6.0 merges here first with no promotion; then this move; then one round (one promotion here, nine bumps); after
that round a new mod version reaches every machine with no pin bump. Not in this plan: new mod features, Windows
(parked by the owner 2026-11-12), a second mod.

## The boundary with the two agent-models plans (named on both sides)

| Item | Which plan builds it | The other plan's part |
|---|---|---|
| Mod code and mod tests of 1.5.0 and 1.6.0 | the 1.5.0 plan (merged, #187) and the 1.6.0 plan | this plan copies the merged bytes; it changes no mod behaviour |
| `RELEASED_MOD`, the pins row, `MOD_FILES` for 1.6.0 | the 1.6.0 plan | this plan deletes them after the copy; the 1.6.0 pins row is the proof that the copy is exact |
| The `release` promotion and the consumer bumps | this plan (E4), one round | the 1.5.0 and 1.6.0 plans make none; their owner checks run after E4 |
| Promotion of the 1.5.0 and 1.6.0 plans to `research/` | their own plans | they wait for the owner checks of this plan |

Order: 1.6.0 merges first, because this plan copies from its merge commit. Nothing else is shared. The same table goes
into `todo/PLAN_agent_models_1_6_0.md` and the 1.5.0 plan in the commit that adds this plan's `todo/README.md` row.

## What the code and the engine do today (read 2026-11-23 at `53b0a33`, Claude Code 2.1.330)

- **The install step.** `ensureAgentModelsMod` (`settings/hooks/ensure-user-guard.mjs:193-202`) is the third step of
  the session start (`:240`). It skips for `AGENT_MODELS_MOD=off`, win32 and the conventions repository (`:194`), and
  for the marker `~/.claude/mods/agent-models.optout` or a missing mod folder (`:199`). The source is
  `<project>/.agents/conventions/mods/agent-models` (`:198`). The hook has 5 seconds (`settings/settings.json:22-25`).
- **The installer.** `ensureAgentModels` (`settings/hooks/lib/agent-models-install.mjs:259-268`) reads the source,
  refuses bytes that are not `RELEASED_MOD` (`agent-models-decide.mjs:43-55`, a version and one raw sha256 per file of
  `MOD_FILES`, `:17-26`), copies by a rename swap and appends the folder to `env.CLAUDE_CODE_PLUGIN_DIRS`
  (`decide.mjs:214-218`) through `commitSettings` (`install.mjs:82`). Four libs, 1 044 lines; eleven test files
  under `tools/`, 3 869 lines; `tools/agent-models-pins.json` and `tools/lib/agent-models-pin.mjs:51-63` (a changed
  file with the same version is red); `.gitattributes:4` keeps the folder LF.
- **The mod.** `mods/agent-models/`: 29 files, 331 KB: eight installed files, 19 test and fixture files,
  `tsconfig.json`, `.gitignore`. `main` holds 1.5.0; 1.6.0 (branch `feat/agent-models-pins`, `934e4e6`) adds
  `hooks/pins.tsx`, so nine installed files. CI does not run the mod's tests (`research/module_tests.md:296-298`);
  `tsc` has known errors in a test fixture (`todo/PLAN_agent_models_1_5_0.md:310`).
- **What is released.** `release` is `c598a11`; `RELEASED_MOD` there is 1.4.0. All nine consumers pin `c598a11` and all
  nine carry the four installer libs in `.claude/hooks/lib/` (GitHub read, 2026-11-23). The scout note "only coai has
  the installer" is not true now. This WSL machine has `~/.claude/mods/agent-models` 1.4.0 and
  `CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json`.
- **A release today** is one PR here, one `promote-release` dispatch (`.github/workflows/promote-release.yml:38-46`;
  the tool refuses a sha that is not 40 hex, not on `main`, without a green `ci` run, or backwards,
  `tools/promote-release.mjs:12-21`) and nine bump PRs. `adapter-check` demands a byte-equal copy of every reference
  hook file (`tools/adapter-check.mjs:143-156`); it does not see an extra file in a consumer.
- **The engine (Claude Code docs, read 2026-11-23: `plugins/loading`, `plugins/host-marketplace`,
  `plugins/marketplace-reference`, `plugins/org`, `plugins/mods/overview`; not observed yet, see E2).**
  A marketplace is a repository with `.claude-plugin/marketplace.json`. `extraKnownMarketplaces` in a settings file
  registers it; its `source` can be `{ "source": "git", "url": …, "ref": <branch> }`; `autoUpdate` on that entry is
  the first thing the engine reads. A plugin with an external source that USER settings enable is fetched by the
  engine (for a relative-path entry the docs do not say: V1); one enabled only in project settings is not. Plugins
  load from the cache with no network. Auto-update runs after the first message, after a random delay of up to ten
  minutes; the new version loads at the next launch, and only when the computed version changed (`plugin.json`
  `version` comes first). A plugin from `CLAUDE_CODE_PLUGIN_DIRS` replaces a marketplace plugin of the same name, in
  silence. The `owner/repo` GitHub form probes SSH first and its updates do not fall back to HTTPS. A mod runs with
  the person's permissions, not sandboxed. The cache is `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`;
  an old version folder goes 14 days after it is orphaned.

## Design

### A. The install mechanism — the engine's marketplace with auto-update

| | (a) engine marketplace, `ref: release`, `autoUpdate` — **chosen** | (b) our installer fetches the newest release | (c) marketplace pinned to a sha in each consumer |
|---|---|---|---|
| The 5 s hook | writes two keys, no network | a fetch and a check in 5 s, or a detached child nobody supervises | writes two keys |
| Offline | loads from the cache; a failed check keeps the copy | needs its own cache and rules | as (a) |
| Updates with no bump | yes | yes | **no** — a bump per version, against goal 2 |
| Code we keep | about 200 lines | the 1 044 lines and more (a fetcher, a verifier) | about 200 lines |
| Version shown | `claude plugin list`, `/plugin`, and a line at session start | our own line | as (a) |
| The weak point | the behaviour is the engine's, so it is observed first (E2) | a second updater is a second attack surface | — |

The step writes exactly this, and only what is absent:

```json
"extraKnownMarketplaces": { "dew-flow-mods": { "source": { "source": "git",
    "url": "https://github.com/oleksandrdubyna88/dew_flow_mods.git", "ref": "release" }, "autoUpdate": true } },
"enabledPlugins": { "agent-models@dew-flow-mods": true }
```

- **HTTPS URL, not `owner/repo`**: SSH to GitHub times out from this WSL, and the GitHub form's updates do not fall back.
- **`plugin.json` keeps its `version`** and every release raises it. The owner reads a version, not a commit id, and
  a `release` that moves with the same version reaches nobody; the gate refuses that (B, G5).
- **The plugin entry is a relative path** (`./plugins/agent-models`), so the catalog and the mod bytes are one commit.
  Pre-registered fallback, decided by observation V1: if user-settings keys do not install a relative-path plugin, the
  entry becomes `git-subdir` with `ref: release`; if that does not install either, the step says once the one command
  `claude plugin install agent-models@dew-flow-mods`. Neither fallback is a plan change.
- **The old copy and the name clash.** The old folder wins while it is listed in `CLAUDE_CODE_PLUGIN_DIRS`. The step
  retires it only when the marketplace copy is on disk (a `plugin.json` under the cache folder): it writes a tombstone
  into `~/.claude/mods/agent-models.optout`, removes the one entry from `env.CLAUDE_CODE_PLUGIN_DIRS` (the key goes
  when it is empty; other entries stay) and removes the folder, its manifest and its reported file. A working copy is
  never removed before its replacement exists, so an offline first start loses nothing. The tombstone is the marker
  the OLD installer already obeys (`ensure-user-guard.mjs:199` at `c598a11`), so a consumer or a worktree on an old pin
  cannot install the old copy again. A marker that is not our tombstone is the person's own opt-out: the step then
  writes nothing.
- **Never overwrite.** A `dew-flow-mods` entry that differs (another ref, `autoUpdate: false`) is the person's edit:
  left alone, said once. `enabledPlugins` `false` is the person's switch: left alone, silent. Two consumers on
  different pins can then never flip a value back and forth.
- **Trust prompts**: user-settings entries need no folder trust (docs); observed in V8. **Windows**: the step skips
  win32 as today; the new README gives the two manual commands. **How many session starts the switch takes** (three
  or four are expected: keys, clone, retire, load) is measured in E2 and written into the owner checks.

### B. Security judgement — what "always latest" changes, and the gate that answers it

Today a mod byte reaches `~/.claude` after: a reviewed PR here, a gated promotion, a reviewed bump PR in each
consumer, and the sha256 check against `RELEASED_MOD`. The hash is in the same commit as the mod, so it never
protected against a bad conventions commit; it stops an edited or stale submodule folder. The real second checkpoint
is the nine bump PRs. After this plan there is ONE checkpoint: the `release` ref of `dew_flow_mods`. Whatever it holds
runs, with the owner's permissions and outside any sandbox, in every session on every machine, about ten minutes plus
one restart after it moves. So the gate on that ref is the whole control:

1. **Two refs.** `main` is written by pull request only. `release` is what machines load; the step names it.
2. **`release` moves only by `promote-release`** (a copy of this repository's tool and workflow, with its tests):
   `workflow_dispatch` from `main` only, a 40-hex sha, reachable from `main`, the `ci` run of that exact sha completed
   green, forward only, no force. Added for mods: a **version gate** (a plugin file differs from `release` and the
   version is not higher: refused), a **layout gate** (every catalog entry is `name`, `source`, `description` only, the
   source is `./plugins/<name>`, the entry name equals the manifest name; no `package.json`, lockfile or link that
   leaves the folder inside a plugin, so the engine installs no dependency on a machine), and a tag
   `agent-models--v<version>` per promoted version.
3. **Rulesets, from data with a read-back** (the owner's go, as for the task repository on 2026-11-05). `main`: pull
   request, the required checks, linear history, no force push, no deletion, no bypass. `release`: updates,
   creations and deletions restricted, the only bypass actor the promotion's identity. `agent-models--v*` tags: no
   update, no deletion. Whether a personal repository accepts the Actions app as the bypass actor is NOT known
   (`promote-release.yml:14-18` names it as the fix and it was never applied). It is observed first; the
   pre-registered fallback is a write deploy key as the only bypass actor, its private half a secret of a `release`
   environment.
4. **The owner approves each promotion** (question Q1): the job runs in a `release` environment whose required
   reviewer is the owner. `release` here is production for every machine, and
   `common/task-lifecycle.md` § 3 sends a single environment to the person.
5. **CI on `pull_request`, never `pull_request_target`**; no secret in a job that runs fork code; outside
   contributors need approval before a run; every action pinned to a sha; `npm ci --ignore-scripts`.
6. **Every refusal is observed, not asserted** (`common/security.md`, "a measure you have not observed working is a
   comment"): tests G1–G10 close the tool every way, and O1–O5 are run once against GitHub and recorded.

| Who | What they can do | What stops or shows it |
|---|---|---|
| A stranger with a fork PR | propose code; run CI with a read-only token | cannot merge, dispatch or push; the review (coai gate, Opus, CodeRabbit) is the control on what the owner merges |
| A session with the owner's `gh` login (every agent) | merge a PR, dispatch a promotion | CI on the exact sha, the version and layout gates, the owner's click (item 4) |
| Whoever holds the owner's GitHub account or an admin token | edit a ruleset, then push `release` | **nothing in the repository**; it is a logged, deliberate act, and the session-start line names the new version |
| A changed dependency or action | run in CI | sha pins; no dependency ships in the plugin |

**Residual risk, plainly.** Whoever controls the owner's GitHub account, or a token with administration rights on
`dew_flow_mods` (the `gh` login on the owner's machines is one), can run code as the owner on every machine, within
minutes, with no second review. Today the same person needs nine merged bump PRs. The rulesets and the owner's click
make it deliberate and visible; they do not stop an administrator. This is the price of "no pin bumps".

**No hash or signature check is kept.** A hash table in conventions would need a conventions release and nine bumps
per mod version, which is what goal 2 removes. A signature adds no second root of trust: GitHub signs web merges for
whoever holds the account. What is kept is visibility: the step says one line when the installed version changes
(`agent-models updated 1.6.0 → 1.6.1 (dew_flow_mods release)`), and each promotion leaves a tag. Rollback is forward:
revert on `main`, raise the version, promote. On one machine: `claude plugin disable agent-models@dew-flow-mods`; the
step never turns it on again.

### C. The new repository

```
.claude-plugin/marketplace.json     name dew-flow-mods; one entry: agent-models → ./plugins/agent-models
plugins/agent-models/               the 1.6.0 folder as it is: manifest, hooks, types, tests, tsconfig, .gitignore
tools/                              promote-release.mjs + test, lib/git.mjs, lib/proc.mjs, mods-gate.mjs + test
                                    (version and layout gates), extract.test.mjs (today tools/agent-models-extract.test.mjs)
.github/workflows/                  ci.yml (named `ci`), promote-release.yml, pr-title.yml, coderabbit-review.yml,
                                    sonarcloud.yml; .github/rulesets/*.json + the apply/read-back script
.gitattributes                      plugins/** text eol=lf
README.md  AGENTS.md  CLAUDE.md  .agents/conventions (question Q4)  todo/  research/
```

- **History: a plain copy at a named commit**, the 1.6.0 merge commit of this repository, named in the first commit
  and the README. Not `git filter-repo`: the old commit messages say `#187` and GitHub would link that to the new
  repository's own numbers; the paths change; every commit on the new `main` should have passed the new CI; and the
  design record stays here in `research/PLAN_agent_models_*.md`. The copy is proved exact: the sha256 of the nine
  installed files equals the 1.6.0 row of `tools/agent-models-pins.json` (test C1), before that table is deleted.
- **CI job `ci`**: `claude plugin validate .` and `claude plugin validate plugins/agent-models`,
  `claude plugin test plugins/agent-models` on a pinned Claude Code version, `node --test tools/`, the layout gate,
  actionlint, CodeQL. First observation of story 1.1: do `claude plugin test` and `validate` run on a clean runner
  with no login? **If not, stop and ask the owner** (a credential in a public repository's CI is the owner's
  decision). `tsc` is a required check only if the engine types can be made on the runner; else it stays the recorded
  hand check it is today, and the fixture error of 1.5.0 is fixed or listed in a baseline that can only shrink.
- **LICENSE**: this repository has none (GitHub reports no licence), so "match" means none (question Q3).
  CodeRabbit and SonarCloud as here; neither is a required check.

### D. The conventions side

- **Removed**: `mods/agent-models/` (29 files at `53b0a33`, more at 1.6.0), `.gitattributes:4`, `tools/agent-models-pins.json`,
  `tools/lib/agent-models-pin.mjs`, `tools/lib/agent-models-fixtures.mjs`, the eleven `tools/agent-models-*.test.mjs`
  (ten deleted, the extractor test moves), the four `settings/hooks/lib/agent-models-*.mjs` and their
  `.claude/hooks/lib` copies, `ensureAgentModelsMod` with its loader and advice text
  (`ensure-user-guard.mjs:168-202`), `RELEASED_MOD`.
- **Added**: `settings/hooks/lib/mods-marketplace.mjs` (and its `.claude/hooks/lib` copy): pure decisions
  (`decideRegistration`, `decideRetirement`) and one sequencing function `ensureModsMarketplace`, called from
  `ensure-user-guard.mjs` inside `guardStep` by a dynamic `import()` as today. It imports only `node:` builtins and
  `./user-guard-install.mjs`; every settings write goes through `commitSettings`, the one road
  (`user-guard-install.mjs:494`). Skips: `AGENT_MODELS_MOD=off`, win32, the conventions repository, a person's opt-out
  marker. The plugins root is `CLAUDE_CODE_PLUGIN_CACHE_DIR` or `~/.claude/plugins`. The old folder is deleted only
  when its files equal its install record; a symlinked, foreign-owned or edited folder is unregistered and left,
  and the line names it.
- **`adapter-check`** gains one finding: a retired file (`agent-models-*.mjs`) in a consumer's `.claude/hooks/lib` is
  named, so no bump leaves dead installer code; `adapter-check.test.mjs:66-67` name the new lib.
- **Docs**: `research/module_rules.md:100-175` (rewritten: the marketplace step, the retirement, the trust model),
  `research/architecture.md:27`, `research/module_tests.md:240-298`, `README.md` (Consumers, the tenth row if Q4 is
  yes), `ROLLOUT.md`. A scan test fails when `mods/agent-models`, `RELEASED_MOD` or `agent-models-pins` is named
  outside `research/PLAN_*` and `todo/PLAN_*` (the enumeration stays behind as a test).

## What grows, and who retires it

| Surface | Size | Who retires it | Interrupted |
|---|---|---|---|
| `~/.claude/plugins/cache/dew-flow-mods/agent-models/<version>/` | 331 KB a version (tests ship too: the folder is copied whole); two versions at most as a rule, under 1 MB | the engine, 14 days after a version is orphaned | the engine's; a missing copy is fetched again |
| `~/.claude/plugins/marketplaces/dew-flow-mods/` | one clone, under 2 MB | replaced by the engine at an update | the old checkout stays |
| `~/.claude/mods/agent-models.optout` (tombstone), `dew-flow-mods.seen.json` | two files under 1 KB, overwritten | kept forever | each sub-step reads its own state, so the next start finishes it |
| `agent-models--v*` tags, one per promoted version | bytes | kept forever (the version history) | a tag that exists at another sha is a refusal (G7) |

The one waiting state, "registered, not on disk yet", has a timeout: after three days the step says once the manual
install command (`registeredAt` in the seen file).

## Files

New repository: section C, and `todo/PLAN_from_conventions.md` (its side of this plan, cited by path). Here: section
D, `tools/mods-marketplace.test.mjs`, `tools/mods-marketplace-step.test.mjs`, `research/RESULTS_dew_flow_mods_probe.md`,
the stories documents `todo/PLAN_dew_flow_mods_E1.md` … `_E4.md` (each written when its epic starts), `todo/README.md`.
Each consumer: the gitlink, the `.claude/hooks` copies, four deleted libs.

## Build order

1. 1.6.0 merges here (its own plan). No promotion.
2. This plan: the Opus review and the coai plan round, the question consultants on the split, the owner's answers
   Q1–Q5. The first approval opens `## Plan changes`.
3. E1: create the repository (the owner's go), the copy with test C1, CI, the gate with RED-first tests, the rulesets
   with read-back, observations O1–O5, the first promotion (1.6.0) and its tag.
4. E2: the probe V1–V10 on this WSL machine in a scratch `CLAUDE_CONFIG_DIR`, then the decision record. A second
   promotion (1.6.1, a small real change) proves the update path. No shipped code.
5. E3: the step (RED tests first, from the Fable spec), then the removal, `adapter-check`, the docs. `npm test`,
   `npm run check`. Code round (coai `review_code` and an Opus review), PR, checks, threads, merge. No promotion yet.
6. E4.1: one consumer branch, unmerged, on this machine with the real `~/.claude`: the whole switch, seen.
7. E4.2: the pre-checks (in-flight consumer releases, the open-PR counts, `git log c598a11..main` read), ONE
   promotion here, then the bumps: `dew_flow_benchmark` and `dew_flow_mcp` before `dew_flow_rag_qln`
   (`README.md:68-73`), then the others. Checks present and green on each head sha before a merge.
8. E4.3: `POST_DEPLOY.md`, the owner checks, then this plan and the 1.5.0 and 1.6.0 plans go to `research/`.

## Test plan (each case RED before its change)

**The step** (`node --test tools/mods-marketplace*.test.mjs`; homes from `ownedDir`, never the real `~/.claude`):

| # | Case | Expected |
|---|---|---|
| R1 | no `settings.json` | created with the two keys only; line `registered` |
| R2 | other marketplaces and plugins present | the two keys added, every other byte kept, one backup |
| R4 | a `dew-flow-mods` entry that differs | untouched, said once |
| R3, R5 | already registered; `enabledPlugins` says `false` | no write, silent; with `false` also no retirement |
| R6 | unparsable settings, a non-object `env`, a change during the write | refused, nothing written |
| R7 | `AGENT_MODELS_MOD=off`, win32, the reference repository, a person's opt-out marker | no write at all |
| M1 | the cache is absent, the old copy registered | the old copy and its entry untouched |
| M2 | the cache present, the old entry alone | key removed, tombstone written, folder, manifest and reported file removed, one line |
| M3 | other entries in `CLAUDE_CODE_PLUGIN_DIRS` | only ours removed, order kept |
| M4, M5 | the old folder edited, a symlink or foreign-owned | unregistered only, never deleted through; the line names it |
| M6 | stopped after the settings write | the next run finishes; no second line |
| M7 | the tombstone path | equals the marker path of the old step (the real old installer is run in E4.1) |
| M8 | the shell's own variable still lists the old folder | said once |
| U1, W1 | the installed version first seen, changed, same; registered three days with nothing on disk | silent, one line, silent; the manual command, said once |
| A1–A3 | `adapter-check`: a retired lib in a consumer; the missing-file names; the new lib's imports | named; updated; only `node:` and `./user-guard-install.mjs` |
| A4 | the scan for the retired names | zero hits outside the plan files, and the scan matches a planted hit |

**The gate** (`dew_flow_mods`, `node --test tools/`, real git repositories in a temp folder):

| # | Case | Expected |
|---|---|---|
| C1 | the nine copied files | sha256 equal to the 1.6.0 pins row of conventions |
| G1–G4 | not 40 hex; not on `main`; `ci` absent, running or red; backwards | refused, nothing pushed |
| G5 | a plugin file differs from `release`, version equal or lower | refused, the file named |
| G6, G7 | version higher; the tag already exists at another sha | promoted with tag `agent-models--v<version>` at that sha; refused |
| G8 | only README or CI changed | promoted, no tag |
| G9 | a `package.json`, a lockfile, an escaping link, an entry with extra keys or a remote source, names that differ | red, each named |
| G10 | a dispatch from a branch | refused by the workflow |
| O1–O5 | on GitHub, once: a hand push to `release`; a force push or deletion of `release` or a tag; the workflow's push; a fork PR; a push to `main` | refused; refused; accepted; no secret, no write; refused |

**The engine, observed** (E2, results in `research/RESULTS_dew_flow_mods_probe.md` with what was NOT checked):

| # | Question | Expected |
|---|---|---|
| V1 | the two keys alone in user settings | cloned at `release`, cached, no prompt, no command |
| V2 | keys written by a SessionStart hook | the session that picks them up is counted |
| V3 | old folder and marketplace copy together; the entry removed at a start | which copy loads, in which session |
| V4, V5 | a start with no network; no SSH to GitHub | the mod loads from the cache; the HTTPS URL clones, time measured |
| V6 | 1.6.1 promoted | arrives within about ten minutes of the first message; the next launch runs 1.6.1 |
| V7 | `release` moved, same version | no update (why G5 exists) |
| V8, V9 | prompts; `enabledPlugins` `false` | no trust dialog, a `-p` run loads the hooks; stays `false`, `claude plugin list` shows the version |
| V10 | two sessions start at the first clone | one whole cache |

## Owner checks (after the nine bumps; a session cannot do these for itself)

1. Start a session in any consumer, as many times as E2 measured: the band shows 1.6.0 features (the pin icon, the
   list); `claude plugin list` shows `agent-models@dew-flow-mods`; `~/.claude/mods/agent-models` is gone and
   `CLAUDE_CODE_PLUGIN_DIRS` no longer names it.
2. The owner checks of the 1.5.0 and 1.6.0 plans (their own lists).
3. The update with no bump: after a promotion of a later version, work in a session for ten minutes, restart: the
   line `agent-models updated …` shows and `claude plugin list` gives the new version. No consumer PR was opened.
4. `claude plugin disable agent-models@dew-flow-mods`, restart: no band, and the step does not turn it on again.

## Open questions for the owner (each with the recommendation)

- **Q1 — the risk and the click.** Accept the residual risk of section B? And each promotion of `dew_flow_mods`
  waits for the owner's approval in GitHub? *Recommended: yes to both.* A standing "agents may promote" would leave
  no person between a merged PR and every machine.
- **Q2 — the go for the repository and its rulesets**: create public `oleksandrdubyna88/dew_flow_mods`, apply the
  rulesets from data with read-back, enable CodeRabbit, SonarCloud and CodeQL on it. *Recommended: yes.*
- **Q3 — the licence.** Conventions has no LICENSE; without one the public code may be read, not reused.
  *Recommended: none now, as here; MIT later is one file if the owner wants reuse.*
- **Q4 — the tenth consumer.** `dew_flow_mods` mounts `.agents/conventions` (rules, hooks, the coai gate,
  `pin-check`)? *Recommended: yes*: it holds the code with the widest reach in the family. Cost: a tenth bump per
  conventions release.
- **Q5 — the PR cap.** The order of 2026-11-23 is the cap agreement for this plan's PRs here and for the bump PR in
  each consumer, the seven at or over the cap included? *Recommended: yes*, said once in words.

Settled without a question: Windows stays parked; the mod's Windows and macOS state does not change.

## Definition of Done

- [ ] `dew_flow_mods` is public; C1, G1–G10 green; O1–O5 observed and recorded; the rulesets match their data file.
- [ ] `release` there was moved only by the workflow; 1.6.0 and one later version are tagged.
- [ ] E2's results are in `research/` with the measured number of session starts and what was not checked.
- [ ] Here: R1–A4 green, each seen red first; `npm test`, `npm run check`; no mod, no pins table, no installer lib,
      no `RELEASED_MOD`; the code round and the Opus review resolved; the docs of section D rewritten.
- [ ] One promotion here; nine consumers (ten with Q4) pin it, each with `adapter-check` and `pin-check` green, the
      four retired libs deleted; `dew_flow_benchmark` and `dew_flow_mcp` went before `dew_flow_rag_qln`.
- [ ] On this WSL machine: the old copy is retired, the marketplace copy loads, an old-pin worktree did not bring the
      old copy back, and a later version arrived with no consumer PR.
- [ ] The owner checks are reported; this plan and the 1.5.0 and 1.6.0 plans are in `research/` with their deviations;
      `plan-lifecycle.mjs` clean; the summary names models and counts.

## Epics

Draft split by Fable. The question consultants are asked what is important before the split is final (at the plan
round). Each epic's stories are one document, written by Opus when the epic starts.

| Role | Model | In this plan |
|---|---|---|
| Plan → epics, security judgement | fable | this document, section B, the review of O1–O5 |
| Cornerstone spec (scenarios and brief) | fable | stories 1.2 and 3.1 |
| Stories documents, other briefs, reviews, the judge of a re-review | opus | E1–E4 |
| Code, tests, fixes, the bump PRs | sonnet | every story |
| Scouts (the probe's evidence, consumer state) | sonnet | E2, E4 |

- **E1 — the new repository and its gate.** Goal: `dew_flow_mods` holds 1.6.0 and nothing reaches `release` but
  through the gate. Stories: 1.1 the copy, the layout, CI (and the family mount if Q4); **1.2 the release gate —
  cornerstone** (the tool, the version and layout gates, the rulesets, O1–O5); 1.3 the first promotion, the tag, the
  README. Depends on: 1.6.0 merged, Q1–Q4. Done when: C1, G1–G10, O1–O5.
- **E2 — the engine, observed.** Goal: every engine behaviour section A relies on is seen on one machine. Stories:
  2.1 the probe V1–V10 in a scratch config folder; 2.2 the decision record (the entry's source form, the number of
  starts, the fallbacks). Depends on: E1. Done when: the results file is merged. No cornerstone.
- **E3 — conventions: the registration step replaces the installer.** Stories: **3.1 the step and the retirement —
  cornerstone** (it writes the trust anchor into user settings and deletes a folder in `~/.claude` on every
  machine); 3.2 the removal and `adapter-check`; 3.3 the docs. Depends on: E2. Done when: R1–A4, merged, not promoted.
- **E4 — the one round.** Stories: 4.1 one consumer branch on this machine, the real old installer included; 4.2 the
  pre-checks, the promotion, the bumps in order; 4.3 `POST_DEPLOY.md`, the owner checks, the three plans promoted.
  Depends on: E3, Q5. Done when: the Definition of Done. No cornerstone.

Cornerstones: 2 of 2 — 1.2 the release gate, 3.1 the registration step
