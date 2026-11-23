# PLAN — the agent-models mod moves to the public repository `dew_flow_mods` and updates itself

> Status: **APPROVED 2026-11-23 (epoch 1, by reviewers); the owner answered Q1–Q3 the same day (below).** Nothing is implemented yet. Scope: a
> new PUBLIC repository `oleksandrdubyna88/dew_flow_mods` (a Claude Code plugin marketplace with the mod, its tests, its
> CI and a gated `release` ref); in this repository the removal of `mods/agent-models`, of the installer
> (`settings/hooks/lib/agent-models-*.mjs`, their `.claude/hooks` copies, `tools/agent-models-*`) and a new small
> session-start step that registers the marketplace in `~/.claude/settings.json`; then ONE `release` promotion here and
> one pin bump in each consumer. Parents: [PLAN_agent_models_mod.md](../research/PLAN_agent_models_mod.md),
> [PLAN_agent_models_1_5_0.md](PLAN_agent_models_1_5_0.md) and `todo/PLAN_agent_models_1_6_0.md` (on branch
> `feat/agent-models-pins`, not on `main` yet, so it is a path here and not a link).

## Plan changes

> Epoch 1 · approved 2026-11-23 · by reviewers · state: open

  (The plan round's accepted findings are the baseline this epoch was approved on. The coai round, verdict proceed:
  retire the old copy only on the engine's own install record of the intended version, never on a guessed cache path;
  only under the exact trust anchor; the tombstone first, and verified; no bound of two cached versions. The Opus
  review: the install record and a pinned `git-subdir` form; a deploy key in a reviewed environment as the only
  bypass, not the Actions app; the owner's approval is not a second person, said in § B with a new owner question;
  retirement by `agent-models@inline` `false` and a folder deleted a day later; a short probe before the repository
  is built; auto-update in interactive sessions only; the CLI's native binary in CI; tag creation restricted; the
  owner's two answers cited; option (d) shown. The question consultants: the owner's click per promotion, yes
  (consult 8cf29f8f); no LICENSE now (consult d35086f4); the tenth consumer, yes (consult 32fe914d). Nothing was
  rejected.)

## Goal (the owner's words, 2026-11-23, translated from Russian)

1. "Move this mod's code into a separate repo, dew_flow_mods, and change the conventions so it is installed from
   there automatically on all projects." "The repo must be public."
2. "And if possible — it should check by itself and always install the latest version of the mods, so mods are
   updated without pin bumps."
3. The order: "First finish all the code. Roll it out to the separate repo, and then do the pin bumps to the new
   repo. Then I will test."

So: 1.6.0 merges here first with no promotion; then this move; then one round (one promotion here, the bumps); after
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
into `todo/PLAN_agent_models_1_6_0.md` and the 1.5.0 plan before E2 starts.

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
  nine carry the four installer libs in `.claude/hooks/lib/` (GitHub read, 2026-11-23; the Opus review read the same).
  This WSL machine has `~/.claude/mods/agent-models` 1.4.0 and `CLAUDE_CODE_PLUGIN_DIRS` in `~/.claude/settings.json`;
  every running session and every child `claude -p` run inherits that variable.
- **A release today** is one PR here, one `promote-release` dispatch (`.github/workflows/promote-release.yml:38-46`;
  the tool refuses a sha that is not 40 hex, not on `main`, without a green `ci` run, or backwards,
  `tools/promote-release.mjs:12-21`) and nine bump PRs. `adapter-check` demands a byte-equal copy of every reference
  hook file (`tools/adapter-check.mjs:143-156`); it does not see an extra file in a consumer.
- **The engine (Claude Code docs, read 2026-11-23: `plugins/loading`, `plugins/host-marketplace`,
  `plugins/marketplace-reference`, `plugins/org`, `plugins/mods/overview`; not observed yet).** A marketplace is a
  repository with `.claude-plugin/marketplace.json`. `extraKnownMarketplaces` in a settings file registers it; its
  `source` can be `{ "source": "git", "url": …, "ref": <branch> }`; `autoUpdate` on that entry is read first. A plugin
  with an external source that USER settings enable is fetched by the engine; for a relative-path entry of a git
  marketplace the docs name `/reload-plugins` or an install, so this is NOT known (V1). The engine records an install
  in `~/.claude/plugins/installed_plugins.json` (id, `installPath`, `version`; format `version: 2` on this machine) and
  keeps the files in `cache/<marketplace>/<plugin>/<version>/`; an old version folder gets `.orphaned_at` and goes
  14 days later. Plugins load from the cache with no network. Auto-update runs only in an interactive session, after
  the first message and a random delay of up to ten minutes; a `-p` session never updates; `DISABLE_AUTOUPDATER`,
  `DISABLE_UPDATES` and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` turn it off (none is set here). The new version
  loads at the next launch, and only when the computed version changed (`plugin.json` `version` comes first). A plugin
  from `CLAUDE_CODE_PLUGIN_DIRS` (`agent-models@inline`) replaces a marketplace plugin of the same name, in silence;
  set to `false` in `enabledPlugins` it does not shadow. The `owner/repo` GitHub form probes SSH first and its updates
  do not fall back to HTTPS. A mod runs with the person's permissions, not sandboxed.

## Design

### A. The install mechanism — the engine's marketplace with auto-update

| | (a) engine marketplace, `ref: release`, `autoUpdate`, written by the hook — **chosen** | (b) our installer fetches the newest release | (c) marketplace pinned to a sha in each consumer | (d) the same marketplace, added by hand on each machine |
|---|---|---|---|---|
| The 5 s hook | writes keys, no network | a fetch and a check in 5 s, or a detached child nobody supervises | writes keys | no registration code |
| Offline | loads from the cache; a failed check keeps the copy | needs its own cache and rules | as (a) | as (a) |
| Updates with no bump | yes | yes | **no** — a bump per version | yes, after the person turns auto-update on |
| A new machine | the first session start does it | the first session start does it | as (a) | two commands and a toggle by hand |
| Code we keep | about 250 lines | the 1 044 lines and more | about 250 lines | the retirement of the old copy only |
| The weak point | the behaviour is the engine's, so it is observed first (E1) | a second updater is a second attack surface | against goal 2 | against goal 1 |

(d) is `claude plugin marketplace add https://github.com/oleksandrdubyna88/dew_flow_mods.git#release`, then
`claude plugin install agent-models@dew-flow-mods`, then the removal of the old copy. On the owner's one machine today
it gives "latest without bumps" with no hook code. (a) is kept: the owner asked that the conventions install it
automatically on all projects; auto-update is off for a marketplace added by hand until a person turns it on; and the
old installer must leave nine consumers and the old copy must be retired on every machine in both options.

The step writes exactly this, and only what is absent:

```json
"extraKnownMarketplaces": { "dew-flow-mods": { "source": { "source": "git",
    "url": "https://github.com/oleksandrdubyna88/dew_flow_mods.git", "ref": "release" }, "autoUpdate": true } },
"enabledPlugins": { "agent-models@dew-flow-mods": true }
```

- **HTTPS URL, not `owner/repo`**: SSH to GitHub times out from this WSL, and the GitHub form's updates do not fall back.
- **`plugin.json` keeps its `version`** and every release raises it. The owner reads a version, not a commit id, and
  a `release` that moves with the same version reaches nobody; the gate refuses that (B, G5).
- **The source form of the plugin entry is decided by the probe (E1), before the repository is built.** First choice:
  the relative path `./plugins/agent-models`, so the catalog and the mod bytes are one commit. If user-settings keys
  alone do not install it, the entry is `git-subdir` with exactly the HTTPS URL above, `ref: release` and
  `path: plugins/agent-models`, and the layout gate pins all three (a merged PR could else point the source at
  `main`). If neither installs with no command, the step says once the one command
  `claude plugin install agent-models@dew-flow-mods`. Each of the three is the plan as written.
- **The old copy is retired in two steps, and only on proof.** The proof, all of it: the `dew-flow-mods` entry in
  settings equals the trust anchor above (the `git` source, that URL, `ref: release`), and so does the engine's own
  record of the marketplace where it can be read; `installed_plugins.json` records `agent-models@dew-flow-mods`; the
  recorded `installPath` exists, holds a `plugin.json` of the recorded version and no `.orphaned_at`; and
  `enabledPlugins` says `true`. A cache folder with no record, a record with no folder, an orphaned folder, a file
  format the step does not know, or an entry that names another URL or ref: no retirement, said once. A working copy
  is never retired before its replacement is installed, so an offline first start loses nothing.
  - *Step 1, in this order:* write the tombstone `~/.claude/mods/agent-models.optout` and read it back; then set
    `"agent-models@inline": false` in `enabledPlugins`. The tombstone is the marker the OLD installer obeys
    (`ensure-user-guard.mjs:199` at `c598a11`), so a consumer or a worktree on an old pin installs nothing again; a
    disabled session-only plugin does not shadow the marketplace copy, so such a worktree is harmless even if it did.
    The folder and the variable stay: running sessions and child `claude -p` runs that inherited the variable keep a
    folder that exists.
  - *Step 2, at a start 24 hours or more after step 1:* the entry leaves `env.CLAUDE_CODE_PLUGIN_DIRS` (the key goes
    when it is empty; other entries stay) and the folder, its manifest and its reported file are deleted, when the
    folder's files equal its install record. A symlinked, foreign-owned or edited folder is left with its entry and
    named once.
  - A marker that is not our tombstone is the person's own opt-out: the step writes nothing at all.
    `agent-models@inline` stays `false`; work on the mod turns it on for one session with
    `--settings '{"enabledPlugins":{"agent-models@inline":true}}'` (the new README says so).
- **Never overwrite.** A `dew-flow-mods` entry that differs is the person's edit: left alone, said once, and no
  retirement. `enabledPlugins` `false` for the plugin, or an explicit `true` for `agent-models@inline`, is the person's
  switch: left alone. Two consumers on different pins can then never flip a value back and forth.
- **Trust prompts**: no prompt of its own for a user-settings marketplace entry; the ordinary folder-trust dialog of the working folder comes first, and an interactive install waits for it (observed in V8). **Windows**: the step skips
  win32 as today; the new README gives the manual commands. **How many session starts the switch takes** is measured
  in E1 and written into the owner checks.

### B. Security judgement — what "always latest" changes, and the gate that answers it

Today a mod byte reaches `~/.claude` after a reviewed PR here, a gated promotion, a bump PR in each consumer and the
sha256 check against `RELEASED_MOD`. The hash is in the same commit as the mod, so it never protected against a bad
conventions commit; it stops an edited or stale submodule folder. The nine bump PRs are not a second person either:
every agent session holds the owner's `gh` login and merges them with it. What they give is time, nine more steps and
nine public traces. After this plan there is ONE ref, `release` of `dew_flow_mods`. Whatever it holds runs, with the
owner's permissions and outside any sandbox, in every interactive session on every machine, about ten minutes plus one
restart after it moves. The difference from today is speed and visibility. The gate on that ref is the whole control:

1. **Two refs.** `main` is written by pull request only. `release` is what machines load; the step names it.
2. **`release` moves only by `promote-release`** (a copy of this repository's tool and workflow, with its tests):
   `workflow_dispatch` from `main` only, a 40-hex sha, reachable from `main`, the `ci` run of that exact sha completed
   green, forward only, no force. Added for mods: a **version gate** (a plugin file differs from `release` and the
   version is not higher: refused), a **layout gate** (every catalog entry is `name`, `source`, `description` only;
   the source is exactly the form E1 decided, `./plugins/<name>` or the pinned `git-subdir`; the entry name equals the
   manifest name; no `package.json`, lockfile or link that leaves the folder inside a plugin, so the engine installs
   no dependency on a machine), and a tag `agent-models--v<version>` per promoted version.
3. **The push identity is a deploy key, not the Actions app.** A ruleset whose bypass actor is the Actions app lets
   any workflow on any pushed branch push as it. So: the only bypass actor of the `release` ruleset and of the tag
   ruleset is one write deploy key. Its private half is a secret of a `release` environment with a required reviewer
   (the owner) and the deployment-branch policy "`main` only". Every workflow's own token has `contents: read`. A
   first job with no secret prints the verdict of a dry run and the compare URL `release...<sha>`; the push job waits
   in the environment. "Prevent self-review" is off, because the dispatch and the approval are the same account.
4. **Rulesets, from data with a read-back** (the owner's go, as for the task repository on 2026-11-05). `main`: pull
   request, the required checks, linear history, no force push, no deletion, no bypass. `release`: updates, creations
   and deletions restricted. `agent-models--v*` tags: creation, update and deletion restricted.
5. **The owner approves each promotion** in that environment (consult 8cf29f8f: both consultants yes; question Q1).
   `release` here is production for every machine, and `common/task-lifecycle.md` § 3 sends a single environment to
   the person. **This approval is not a second person today.** The owner's `gh` login, which every agent session
   holds, can call the approval API for a pending deployment, can merge a PR that removes a gate, and can edit a
   ruleset or the environment. The click is a real barrier only when agents work with an identity that cannot do
   these (question Q3). Until then it is a procedure that agents follow, and a logged act when they do not.
6. **CI on `pull_request`, never `pull_request_target`**; no secret in a job that runs fork code; outside
   contributors need approval before a run; every action pinned to a sha; `npm ci --ignore-scripts`.
7. **Every refusal is observed, not asserted** (`common/security.md`, "a measure you have not observed working is a
   comment"): tests G1–G10 close the tool every way, and O1–O7 are run once against GitHub and recorded.

| Who | What they can do | What stops or shows it |
|---|---|---|
| A stranger with a fork PR | propose code; run CI with a read-only token | cannot merge, dispatch or push; the review (coai gate, Opus, CodeRabbit) is the control on what is merged |
| A workflow on a pushed branch | run with the repository's own token | the token is read-only; the ruleset refuses its push; the environment gives the key to `main` only (O6) |
| A session with the owner's `gh` login (every agent) | merge a PR, dispatch a promotion, approve it by API, change a gate | CI on the exact sha and the two gates stop a mistake, not intent; with today's login nothing technical stops intent (Q3); each act is logged |
| Whoever holds the owner's GitHub account or an admin token | edit a ruleset, then push `release` | **nothing in the repository**; it is a logged, deliberate act, and the session-start line names the new version |
| A changed dependency or action | run in CI | sha pins; no dependency ships in the plugin |

**Residual risk, plainly.** Whoever controls the owner's GitHub account, or a token with administration rights on
`dew_flow_mods` (the `gh` login on the owner's machines is one, and every agent session uses it), can run code as the
owner on every machine, within minutes, with no second review. Today the same token needs a promotion and nine merged
bump PRs: slower and more visible, not safer in kind. The rulesets and the owner's click make the act deliberate and
visible; they do not stop an administrator. This is the price of "no pin bumps".

**No hash or signature check is kept.** A hash table in conventions would need a conventions release and the bumps
per mod version, which is what goal 2 removes. A signature adds no second root of trust: GitHub signs web merges for
whoever holds the account. What is kept is visibility: the step says one line when the installed version changes
(`agent-models updated 1.6.0 → 1.6.1 (dew_flow_mods release)`), and each promotion leaves a tag. Rollback is forward:
revert on `main`, raise the version, promote. On one machine: `claude plugin disable agent-models@dew-flow-mods`; the
step never turns it on again.

### C. The new repository

```
.claude-plugin/marketplace.json     name dew-flow-mods; one entry: agent-models, the source form E1 decided
plugins/agent-models/               the 1.6.0 folder as it is: manifest, hooks, types, tests, tsconfig, .gitignore
tools/                              promote-release.mjs + test, lib/git.mjs, lib/proc.mjs, mods-gate.mjs + test
                                    (version and layout gates), extract.test.mjs (today tools/agent-models-extract.test.mjs)
.github/workflows/                  ci.yml (named `ci`), promote-release.yml, pr-title.yml, coderabbit-review.yml,
                                    sonarcloud.yml; .github/rulesets/*.json + the apply/read-back script
.gitattributes                      plugins/** text eol=lf
README.md  AGENTS.md  CLAUDE.md  .agents/conventions  todo/  research/
```

- **History: a plain copy at a named commit**, the 1.6.0 merge commit of this repository, named in the first commit
  and the README. Not `git filter-repo`: the old commit messages say `#187` and GitHub would link that to the new
  repository's own numbers; the paths change; every commit on the new `main` should have passed the new CI; and the
  design record stays here in `research/PLAN_agent_models_*.md`. The copy is proved exact: the sha256 of the nine
  installed files equals the 1.6.0 row of `tools/agent-models-pins.json` (test C1), before that table is deleted.
  The tests ship to every machine with the folder. After C1 is green and recorded, story 2.1 may move them out of
  `plugins/agent-models/` if `claude plugin test` still runs them there; staying is also the plan as written.
- **CI job `ci`**: `claude plugin validate .` and `claude plugin validate plugins/agent-models`,
  `claude plugin test plugins/agent-models` on a pinned Claude Code version, `node --test tools/`, the layout gate,
  actionlint, CodeQL. First observation of story 2.1, two questions: do `claude plugin test` and `validate` run on a
  clean runner with no login, and does an install with `--ignore-scripts` leave the CLI's native binary usable?
  **If the tests need a login, stop and ask the owner** (a credential in a public repository's CI is the owner's
  decision). `tsc` is a required check only if the engine types can be made on the runner; else it stays the recorded
  hand check it is today, and the fixture error of 1.5.0 is fixed or listed in a baseline that can only shrink.
- **The tenth consumer (decided, consult 32fe914d: both consultants yes).** `dew_flow_mods` mounts
  `.agents/conventions` on `release` with the adapter, `pin-check`, `adapter-check` and the coai gate: it holds the
  code with the widest reach in the family. Cost: a tenth bump per conventions release.
- **MIT — the owner's explicit choice, 2026-11-23** (the consultants had advised none for now, consult d35086f4, and
  MIT only by the owner's explicit choice). A root `LICENSE` with the MIT text, the copyright line in the owner's name. CodeRabbit and SonarCloud as
  here; neither is a required check.

### D. The conventions side

- **Removed**: `mods/agent-models/` (29 files at `53b0a33`, more at 1.6.0), `.gitattributes:4`, `tools/agent-models-pins.json`,
  `tools/lib/agent-models-pin.mjs`, `tools/lib/agent-models-fixtures.mjs`, the eleven `tools/agent-models-*.test.mjs`
  (ten deleted, the extractor test moves), the four `settings/hooks/lib/agent-models-*.mjs` and their
  `.claude/hooks/lib` copies, `ensureAgentModelsMod` with its loader and advice text
  (`ensure-user-guard.mjs:168-202`), `RELEASED_MOD`.
- **Added**: `settings/hooks/lib/mods-marketplace.mjs` (and its `.claude/hooks/lib` copy): pure decisions
  (`decideRegistration`, `decideRetirement`, `decideRemoval`) and one sequencing function `ensureModsMarketplace`,
  called from `ensure-user-guard.mjs` inside `guardStep` by a dynamic `import()` as today. It imports only `node:`
  builtins and `./user-guard-install.mjs`; every settings write goes through `commitSettings`, the one road
  (`user-guard-install.mjs:494`). Skips: `AGENT_MODELS_MOD=off`, win32, the conventions repository, a person's opt-out
  marker. The plugins root is `CLAUDE_CODE_PLUGIN_CACHE_DIR` or `~/.claude/plugins`. The engine's two record files are
  read, never written; they are the engine's, so a shape the step does not know is "no proof", never a guess.
- **A frozen copy of the old step** (`tools/fixtures/retired-installer/`, the six files as of `c598a11`, the last
  release that ships it) is run by the tests: it is the second implementation of the marker contract. It is never
  wired and never copied to a consumer.
- **`adapter-check`** gains one finding: a retired file (`agent-models-*.mjs`) in a consumer's `.claude/hooks/lib` is
  named, so no bump leaves dead installer code; `adapter-check.test.mjs:66-67` name the new lib.
- **Docs**: `research/module_rules.md:100-175` (rewritten: the marketplace step, the retirement, the trust model),
  `research/architecture.md:27`, `research/module_tests.md:240-298`, `README.md` (Consumers, the tenth row),
  `ROLLOUT.md`. A scan test fails when `mods/agent-models`, `RELEASED_MOD` or `agent-models-pins` is named outside
  `research/PLAN_*`, `todo/PLAN_*` and the frozen fixture (the enumeration stays behind as a test).

## What grows, and who retires it

| Surface | Size | Who retires it | Interrupted |
|---|---|---|---|
| `~/.claude/plugins/cache/dew-flow-mods/agent-models/<version>/` | 331 KB a version (tests ship too). No bound of two: every promoted version of the last 14 days stays, so ten promotions in two weeks are about 3.6 MB | the engine, 14 days after a version is orphaned | the engine's; a missing copy is fetched again |
| `~/.claude/plugins/marketplaces/dew-flow-mods/` | one clone, under 2 MB | replaced by the engine at an update | the old checkout stays |
| `~/.claude/mods/agent-models.optout` (tombstone), `dew-flow-mods.seen.json` (`registeredAt`, `retiredAt`, the last version) | two files under 1 KB, overwritten | kept forever | each sub-step reads its own state, so the next start finishes it |
| `~/.claude/mods/agent-models/` after step 1 | 331 KB at most | step 2, 24 hours later; an edited copy is kept and named | step 2 runs again at the next start |
| `agent-models--v*` tags, one per promoted version | bytes | kept forever (the version history) | a tag that exists at another sha is a refusal (G7) |

The waiting state "registered, not installed yet" has a timeout: after three days the step says once the manual
install command.

## Files

New repository: section C, and `todo/PLAN_from_conventions.md` (its side of this plan, cited by path). Here: section
D, `tools/mods-marketplace.test.mjs`, `tools/mods-marketplace-step.test.mjs`, `research/dew_flow_mods_probe_E1.md`,
the stories documents `todo/PLAN_dew_flow_mods_E1.md` … `_E4.md` (each written when its epic starts), `todo/README.md`.
Each consumer: the gitlink, the `.claude/hooks` copies, four deleted libs.

## Build order

1. 1.6.0 merges here (its own plan). No promotion.
2. The owner's answers Q1–Q3. E1 needs none of them and may start at once.
3. E1: the short probe V1–V3 and V8 on this WSL machine: a scratch `CLAUDE_CONFIG_DIR` and a throwaway git repository
   (a local bare one through a `file://` URL; a throwaway GitHub repository only if the engine refuses that, with the
   owner's go). Then the decision record: the source form, the number of starts. No shipped code.
4. E2: create the repository (the owner's go), the copy with test C1, CI, the gate with RED-first tests, the deploy
   key, the environment and the rulesets with read-back, observations O1–O7, the first promotion (1.6.0) and its tag;
   then V4–V7, V9 and V10 against the real repository, with a second promotion (1.6.1, a small real change).
5. E3: the step (RED tests first, from the Fable spec), then the removal, `adapter-check`, the docs. `npm test`,
   `npm run check`. Code round (coai `review_code` and an Opus review), PR, checks, threads, merge. No promotion yet.
6. E4.1: one consumer branch, unmerged, on this machine with the real `~/.claude`: the whole switch, seen — including the first install of `agent-models@dew-flow-mods` while `CLAUDE_CODE_PLUGIN_DIRS` still names the old copy (this machine's state): the `installed_plugins.json` record, the cache folder, then the marketplace copy loading after step 1; a missing record or folder stops the story with the install path written down.
7. E4.2: the pre-checks (in-flight consumer releases, the open-PR counts, `git log c598a11..main` read), ONE
   promotion here, then the bumps: `dew_flow_benchmark` and `dew_flow_mcp` before `dew_flow_rag_qln`
   (`README.md:68-73`), then the others and `dew_flow_mods`. Checks present and green on each head sha before a merge.
8. E4.3: `POST_DEPLOY.md`, the owner checks, then this plan and the 1.5.0 and 1.6.0 plans go to `research/`.

## Test plan (each case RED before its change)

**The step** (`node --test tools/mods-marketplace*.test.mjs`; homes from `ownedDir`, never the real `~/.claude`):

| # | Case | Expected |
|---|---|---|
| R1 | no `settings.json` | created with the two keys only; line `registered` |
| R2 | other marketplaces and plugins present | the two keys added, every other byte kept, one backup |
| R3, R5 | already registered; `enabledPlugins` says `false` | no write, silent; with `false` also no retirement |
| R4 | a `dew-flow-mods` entry that differs, no install record | untouched, said once |
| R6 | unparsable settings, a non-object `env`, a change during the write | refused, nothing written |
| R7 | `AGENT_MODELS_MOD=off`, win32, the reference repository, a person's opt-out marker | no write at all |
| M1 | the keys are there, the engine has no install record | the old copy, its entry and `agent-models@inline` untouched |
| M2 | an incomplete install: a cache folder with no record; a record with no folder, no `plugin.json` or another version; an orphaned folder; a record file of an unknown format | no retirement; the unknown format said once |
| M3 | a whole install record, but the settings entry or the engine's marketplace record names another URL or ref | no retirement, said once |
| M4 | the whole proof | the tombstone written and read back, THEN `agent-models@inline` `false`; the folder and the variable untouched; one line |
| M5 | stopped after the tombstone; stopped after the settings write; the frozen old step run after each stop | the old step installs and registers nothing; the next run finishes; no second line |
| M6 | a start before and after 24 hours from step 1 | before: nothing; after: only our entry leaves the variable, order kept; folder, manifest and reported file deleted |
| M7 | the old folder edited, a symlink or foreign-owned | never deleted through; left with its entry; the line names it |
| M8 | `agent-models@inline` is `true` by the person | no retirement, said once |
| M9 | the shell's own variable still lists the folder after step 2 | said once |
| U1, W1 | the installed version first seen, changed, same; registered three days with no install record | silent, one line, silent; the manual command, said once |
| A1–A3 | `adapter-check`: a retired lib in a consumer; the missing-file names; the new lib's imports | named; updated; only `node:` and `./user-guard-install.mjs` |
| A4 | the scan for the retired names | zero hits outside the plan files and the frozen fixture, and the scan matches a planted hit |

**The gate** (`dew_flow_mods`, `node --test tools/`, real git repositories in a temp folder):

| # | Case | Expected |
|---|---|---|
| C1 | the nine copied files | sha256 equal to the 1.6.0 pins row of conventions |
| G1–G4 | not 40 hex; not on `main`; `ci` absent, running or red; backwards | refused, nothing pushed |
| G5 | a plugin file differs from `release`, version equal or lower | refused, the file named |
| G6, G7 | version higher; the tag already exists at another sha | promoted with tag `agent-models--v<version>` at that sha; refused |
| G8 | only README or CI changed | promoted, no tag |
| G9 | a `package.json`, a lockfile, an escaping link, an entry with extra keys, names that differ, a source that is not exactly the decided form (another URL, ref or path) | red, each named |
| G10 | a dispatch from a branch | refused by the workflow |
| O1, O2 | on GitHub, once: a hand push to `release` with the owner's login; a force push or deletion of `release`; a hand creation, update or deletion of a version tag | all refused |
| O3 | the promotion's push with the deploy key, after the approval | accepted; the compare URL was printed before the approval |
| O4, O5 | a fork PR; a push to `main` | no secret and no write; refused |
| O6 | a workflow on a pushed branch pushes `release` with its own token, then asks for the `release` environment | both refused |
| O7 | the approval API called with the login agent sessions hold | recorded as it is: refused under the identity of Q3; accepted with today's login, which is then the written risk |

**The engine, observed** (results in `research/dew_flow_mods_probe_E1.md` with what was NOT checked):

| # | When | Question | Expected |
|---|---|---|---|
| V1 | E1 | the two keys alone in user settings, a relative-path entry; then `git-subdir` | whether it installs with no command or needs `/reload-plugins` or an install; what `installed_plugins.json` records |
| V2 | E1 | keys written by a SessionStart hook | the session that picks them up is counted |
| V3 | E1 | the old folder and the marketplace copy together; then `agent-models@inline` `false`; then `--settings` with `true`; a running session and a `-p` child that inherited the variable | the old copy wins; the marketplace copy loads, in which session; the folder copy loads again; both keep working while the folder exists |
| V8 | E1 | prompts | no prompt of its own for the marketplace; the ordinary folder-trust dialog is allowed (the install waits for it); a `-p` run loads the hooks |
| V4, V5 | E2 | a start with no network; no SSH to GitHub | the mod loads from the cache; the HTTPS URL clones, time measured |
| V6 | E2 | 1.6.1 promoted | an interactive session gets it within about ten minutes of the first message, the next launch runs it; a `-p` session does not update |
| V7 | E2 | `release` moved, same version | no update (why G5 exists) |
| V9, V10 | E2 | `enabledPlugins` `false`; two sessions start at the first clone | stays `false`, `claude plugin list` shows the version; one whole install |

## Owner checks (after the bumps; a session cannot do these for itself)

1. Start a session in any consumer, as many times as E1 measured: the band shows 1.6.0 features (the pin icon, the
   list); `claude plugin list` shows `agent-models@dew-flow-mods`; settings hold `"agent-models@inline": false`. A day
   later `~/.claude/mods/agent-models` is gone and `CLAUDE_CODE_PLUGIN_DIRS` no longer names it.
2. The owner checks of the 1.5.0 and 1.6.0 plans (their own lists).
3. The update with no bump: after a promotion of a later version, work in an INTERACTIVE session for ten minutes,
   restart: the line `agent-models updated …` shows and `claude plugin list` gives the new version. No consumer PR was
   opened. Agents' `-p` sessions never fetch an update; a machine with `DISABLE_AUTOUPDATER`, `DISABLE_UPDATES` or
   `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` set never updates (none is set on this machine).
4. `claude plugin disable agent-models@dew-flow-mods`, restart: no band, and the step does not turn it on again.
5. A promotion: the run shows the compare URL, waits for the owner's approval, and moves `release` only after it.

## Open questions for the owner (each with the recommendation)

- **Q1 — the risk and the click.** Accept the residual risk of section B, and approve each promotion of
  `dew_flow_mods` in GitHub? *Recommended: yes to both* (consult 8cf29f8f: both consultants yes).
- **Q2 — the go to create the repository and apply the rulesets.** That it is public is already the owner's word
  (2026-11-23). The go covers: the repository, the rulesets from data with read-back, the deploy key and the
  `release` environment, CodeRabbit, SonarCloud and CodeQL on it. *Recommended: yes.*
- **Q3 — the identity of agent sessions.** Agents work on `dew_flow_mods` with a separate GitHub identity (write
  role, no administration, not a reviewer of the environment), or with a fine-grained token that has no
  administration and no deployment-approval right there? *Recommended: yes, one of the two, before the first
  promotion.* If not, the owner accepts in writing that the approval of Q1 is a procedure and not a barrier.

Settled without a question: the PR cap (the owner, 2026-11-23: "yes, all nine bumps may go over the cap"; the tenth
repository is new and under it); the tenth consumer (consult 32fe914d); the licence, MIT by the owner's choice (2026-11-23); Windows stays parked.

**The owner's answers (2026-11-23):**

- **Q1 and Q3:** "Click + agent identity" — each promotion of `dew_flow_mods` waits for the owner's approval in
  GitHub, and agent sessions get a separate GitHub identity (a machine user or a GitHub App: write, no
  administration, not a reviewer of the `release` environment) before the first promotion; the owner creates it, the
  steps are prepared for the owner (consult 7738583e: both consultants for a separate identity).
- **Q2:** "Yes, apply them" — create the public repository and apply the rulesets, the deploy key and the `release`
  environment from data with read-back.
- **Licence:** "MIT" (see § C).

## Definition of Done

- [ ] E1's results are in `research/` with the source form decided, the measured number of session starts and what
      was not checked; the later observations V4–V7, V9, V10 are added to the same file.
- [ ] `dew_flow_mods` is public; C1, G1–G10 green; O1–O7 observed and recorded; the rulesets and the environment
      match their data file; no workflow token can write.
- [ ] `release` there was moved only by the workflow, after the owner's approval; 1.6.0 and one later version are tagged.
- [ ] Here: R1–A4 green, each seen red first; `npm test`, `npm run check`; no mod, no pins table, no installer lib,
      no `RELEASED_MOD`; the code round and the Opus review resolved; the docs of section D rewritten.
- [ ] One promotion here; the nine consumers and `dew_flow_mods` pin it, each with `adapter-check` and `pin-check`
      green, the four retired libs deleted; `dew_flow_benchmark` and `dew_flow_mcp` went before `dew_flow_rag_qln`.
- [ ] On this WSL machine: the marketplace copy loads, the old copy is retired and later deleted, an old-pin worktree
      did not bring it back, and a later version arrived with no consumer PR.
- [ ] Q3 is answered: the agents' identity cannot approve or administer, or the owner's written acceptance is cited.
- [ ] The owner checks are reported; this plan and the 1.5.0 and 1.6.0 plans are in `research/` with their deviations;
      `plan-lifecycle.mjs` clean; the summary names models and counts.

## Epics

Split by Fable; the question consultants were asked (consults 8cf29f8f, d35086f4, 32fe914d). Each epic's stories are
one document, written by Opus when the epic starts.

| Role | Model | In this plan |
|---|---|---|
| Plan → epics, security judgement | fable | this document, section B, the review of O1–O7 |
| Cornerstone spec (scenarios and brief) | fable | stories 2.2 and 3.1 |
| Stories documents, other briefs, reviews, the judge of a re-review | opus | E1–E4 |
| Code, tests, fixes, the bump PRs | sonnet | every story |
| Scouts (the probe's evidence, consumer state) | sonnet | E1, E2, E4 |

- **E1 — the short probe.** Goal: the engine behaviour that decides the source form and the retirement is seen on one
  machine before anything is built on it. Stories: 1.1 V1–V3 and V8 in a scratch config folder with a throwaway
  repository; 1.2 the decision record. Depends on: nothing. Done when: the results file is merged. No cornerstone.
- **E2 — the new repository and its gate.** Goal: `dew_flow_mods` holds 1.6.0 and nothing reaches `release` but
  through the gate. Stories: 2.1 the copy, the layout, CI, the family mount; **2.2 the release gate — cornerstone**
  (the tool, the version and layout gates, the deploy key and the environment, the rulesets, O1–O7); 2.3 the first
  promotion, the tag, the README, then V4–V7, V9, V10 with 1.6.1. Depends on: E1, 1.6.0 merged, Q1–Q3. Done when: C1,
  G1–G10, O1–O7, the observations recorded.
- **E3 — conventions: the registration step replaces the installer.** Stories: **3.1 the step and the retirement —
  cornerstone** (it writes the trust anchor into user settings and retires a folder in `~/.claude` on every
  machine); 3.2 the removal, the frozen fixture and `adapter-check`; 3.3 the docs. Depends on: E1, E2. Done when:
  R1–A4, merged, not promoted.
- **E4 — the one round.** Stories: 4.1 one consumer branch on this machine, the real old installer included; 4.2 the
  pre-checks, the promotion, the bumps in order; 4.3 `POST_DEPLOY.md`, the owner checks, the three plans promoted.
  Depends on: E3. Done when: the Definition of Done. No cornerstone.

Cornerstones: 2 of 2 — 2.2 the release gate, 3.1 the registration step
