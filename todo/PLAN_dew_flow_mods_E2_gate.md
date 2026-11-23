# PLAN — dew_flow_mods, E2 story 2.2: the release gate (cornerstone spec)

> Status: **plan only, nothing implemented yet, 2026-11-23.** Scope: in the new repository
> `oleksandrdubyna88/dew_flow_mods` — `promote-release` with the version and layout gates, its workflow, the rulesets,
> the `release` environment and the deploy key as data with a read-back, the agent identity (Q3), the observations
> O1–O7. Cornerstone spec (Fable) of story 2.2 of [PLAN_dew_flow_mods_E2.md](PLAN_dew_flow_mods_E2.md) (`:155-160`),
> epic E2 of [PLAN_dew_flow_mods.md](PLAN_dew_flow_mods.md) (§ B `:155-212`, § C `:214-246`, the gate rows `:335-350`).
> No change ledger here: a change is an entry in the parent's. Sonnet codes, Opus reviews, Fable judges the O records.
>
> **The owner's decisions after this spec (2026-11-23), which bind it:** the agent identity (§ the App) is DEFERRED —
> the owner keeps the shared `gh` login and accepts the click as a procedure in writing (parent § Owner answers, Q3
> revisited), so `tools/agent-token.mjs`, K1–K4 and O7b–e are not built now; O7a is recorded as accepted with today's
> login. O4 (a fork PR) is recorded as not observed live, the blocking settings read back (parent change 1.1). The
> rest stands: the deploy key in the `release` environment as the only bypass, the rulesets, G1–G10, D1–D6.

Done when: G1–G10, Y1–Y4, D1–D6, K1–K4 green, each seen red (or mutated red) as § 2 says; the PR merged after the code
round; the settings equal their data (read-back exit 0 with the owner's login); O1a, O2a, O4–O7 recorded in
`research/RESULTS_release_gate.md` of `dew_flow_mods`; O3, O1b, O2b added by story 2.3's first promotion.

## 1. Facts (read 2026-11-23; the model files are equal at `69adc1e` and on this branch)

- The tool refuses a sha that is not 40 hex (`tools/promote-release.mjs:347`), not on `main` (`:317-325`), with `ci`
  absent, unfinished or red (`:225-247`), or backwards (`:327-337`); it pushes one ref with no force (`:426`) and reads
  it back (`:455-468`). `gh` is a function parameter, with no environment seam (`:139-148`, `:489-496`). Exit codes
  0/1/2/3 (`:103`). Thirty cases (`tools/promote-release.test.mjs`); the fixture makes EMPTY commits (`:43-45`, `:57-81`).
- GitHub REST docs (repos/rules, deployments/environments, actions/workflow-runs, the PAT page): the bypass actor
  `DeployKey` (`actor_id` null) means EVERY deploy key; a bypass covers every rule of its ruleset; `bypass_actors` is
  shown only to a caller who can write the ruleset; a required check takes `integration_id`; reviewers are free on
  public repositories; the approval call is for "required reviewers"; a fine-grained PAT cannot write to another
  account's public repository. NOT in the docs: `can_admins_bypass`; `DeployKey` on a user-owned repository (S1).

## 2. Scenarios (Given / When / Then; ids G and O are the parent's, `:340-350`)

**The gate** (`node --test tools/`, real git repositories from `ownedDir`, `gh` injected as a function):

| # | Given, when the tool runs | Then |
|---|---|---|
| G1 | 39 characters; a branch name; `HEAD` | exit 1 `NOT A SHA`; `gh` never called; remote refs unchanged |
| G2 | a commit only on `topic`; a sha the clone never saw | exit 1 `NOT ON MAIN`; `gh` never called; nothing pushed |
| G3 | `ci` runs: none; `in_progress` or `queued`; `failure` or `cancelled`; a green and a red twin; a red run on page 2 | exit 1 `NO CI RUN`, `CI NOT FINISHED`, `CI NOT GREEN`; nothing pushed |
| G4 | `release` is ahead of the sha, or beside it | exit 1 `NOT A FORWARD MOVE`; nothing pushed |
| G5 | a file under `plugins/agent-models/` differs from `release` (a hook; in a second case only a test file) and `version` is equal; is lower; is `1.6` or `1.6.1-rc1` | exit 1 `VERSION NOT RAISED`: the plugin, both versions, the changed paths (first 5 and the count); the malformed one is `LAYOUT`; `gh` never called; nothing pushed |
| G6 | the same change with `1.6.0 → 1.6.1`; `1.9.0 → 1.10.0`; no `release` yet | exit 0; remote `refs/heads/release` = sha AND `refs/tags/agent-models--v<version>` = sha (lightweight); no other new ref. One test is named for the refuted approach: a string compare refuses 1.10.0 |
| G7 | (a) the tag exists at another sha; (b) the remote refuses tag refs (a `pre-receive` hook) | (a) exit 1 `TAG EXISTS`, both shas named, nothing pushed; (b) exit 3 `PUSH REFUSED`, `release` did NOT move (one atomic push), the read-back names both refs |
| G8 | only `README.md`, `.github/` or `tools/` differ from `release` | exit 0; `release` = sha; no tag ref; the line `plugins: none changed` |
| G9 | at the sha, one each: `package.json`; a lockfile or `node_modules/` (the exported list `FORBIDDEN_NAMES`, which the test iterates); a symlink or a gitlink under `plugins/`; an entry with a fourth key; entry name ≠ manifest name; `source` an object (also `git-subdir` with the right URL), `./plugins/other`, `plugins/agent-models`, `./plugins/agent-models/`, `./plugins/../plugins/agent-models`; `metadata.pluginRoot`; an unknown top-level key; marketplace name ≠ `dew-flow-mods`; a plugin folder with no entry; an entry with no folder; two entries of one name; a plugin that `release` has and the sha has not; unparsable JSON | exit 1 `LAYOUT`; EVERY finding of the commit as `path: reason` (three defects print three); nothing pushed. `node tools/mods-gate.mjs <rev>`: exit 1, the same lines; on this repository's `HEAD`: exit 0 and "1 plugin read" |
| G10 | a dispatch from a branch | Y1 (structure) and O6c (on GitHub) |
| dry | G6's scene with `--dry-run` | exit 0, nothing pushed, exactly the four lines of § 3 item 2c |

**The workflows** (`tools/workflows.test.mjs`; it parses EVERY workflow file, no typed list, and asserts it read `ci.yml`):

| # | Then |
|---|---|
| Y1 (G10) | `promote-release.yml` has the one trigger `workflow_dispatch`; job `verdict` starts with the failing `main` guard; job `push` has `needs: verdict` and `if: github.ref == 'refs/heads/main'`; both checkouts use `ref: ${{ github.sha }}` |
| Y2 | no workflow and no job grants a `write` permission; every `uses:` is pinned to a 40-hex sha |
| Y3 | one job in all files names an `environment`: `release`, in job `push`; `secrets.RELEASE_DEPLOY_KEY` is named in that job only; that job has no `npm` step, and its `uses:` are checkout and setup-node |
| Y4 | triggers are only `push` (branches `main`: a key push to `release` or a tag starts nothing), `pull_request`, `workflow_dispatch`, `schedule`; no `pull_request_target`, no `workflow_run`; no `${{ inputs.`, `${{ github.event.`, `${{ github.ref` or `head_ref` inside a `run:` text |

**Settings data and token tool** (`tools/repo-settings.test.mjs`, `tools/agent-token.test.mjs`; scripted `gh`, `fetch`):

| # | Given | Then |
|---|---|---|
| D1 | the data files | every `bypass_actors` is `[]` or exactly the one `DeployKey` actor; `enforcement` is `active`; for each plugin of the catalog (read from `marketplace.json`), `refs/tags/<name>--v*` is in both tag rulesets |
| D2 | live rulesets: equal; an extra bypass actor (`Integration`); `enforcement: evaluate`; a missing rule; a missing ruleset; an extra unknown ruleset | exit 0; exit 1 naming the ruleset and the field, for each of the four; listed, not drift |
| D3 | environment: a second reviewer; `prevent_self_review: true`; a second branch policy or `protected_branches: true`; no secret; a secret of another name; `RELEASE_DEPLOY_KEY` also as a repository secret | exit 1, each named |
| D4 | deploy keys: two; `read_only: true`; another public key | exit 1, each named |
| D5 | a part that answers 403 or 404 (the agent identity) | exit 3 "could not look", the part named; never 0 |
| D6 | `--apply` | sends the data without `$` keys, POST when absent and PUT by id when present, then exits by the READ-BACK |
| K1 | a mint | the JWT is RS256, `iss` = the client id, `exp − iat` ≤ 600 s, it verifies with the public half; the request names `repositories: ["dew_flow_mods"]` and exactly the data's permissions |
| K2 | the answer has a permission the data has not, `repository_selection: all`, or no `permissions` object | exit 1, no token printed |
| K3 | a cached token with more than 5 minutes left; one with less | no request; a new request; the cache file is mode 0600 |
| K4 | the key file is absent or wider than 0600; `--git-credential get` | exit 1 naming the path; `username=x-access-token` and `password=`; the key is in no output |

**RED first.** Tests come before code. G5, G6, G7, G9, `dry`, Y, D, K fail first for their stated reason against the
byte copy of the tool (no gate, no tag) or a stub that returns "no finding". G1–G4 and G8 are green on the copy; their
teeth are shown by mutation, each restored byte-equal: drop the ancestry check (G2 red), accept an absent run (G3),
drop the forward check (G4), tag every promotion (G8); also drop `--atomic` (G7b) and the Y1 guard. One test asserts
that the fixture's first commit has no layout finding. The coder reports each red message and each green run.

## 3. Brief for the coder (branch `feat/release-gate` in `dew_flow_mods`, with the owner's login; one PR)

1. **Copied byte for byte from conventions `69adc1e`**, as the first commit, so the later diff is the review:
   `tools/lib/git.mjs`, `tools/lib/proc.mjs` with `tools/lib/process-job.ps1` (`proc.mjs:51` loads it),
   `tools/promote-release.mjs`, `tools/promote-release.test.mjs`. The test then imports `ownedDir` from
   `../.agents/conventions/tools/lib/owned.mjs`, and its fixture commits carry a real tree (catalog, manifest, a hook).
2. **`tools/promote-release.mjs` differs** only here. (a) In `decide`, after `standing` (`:363-364`) and before the CI
   question (`:366`): the layout at the sha, the version verdict against `release`, then
   `git ls-remote origin refs/tags/<tag>` (G7a). All of it reads git objects, never the work tree: the checkout is the
   gate's commit, the judged commit can be older. (b) The push (`:426`) is
   `git push --atomic origin <sha>:refs/heads/release <sha>:refs/tags/<name>--v<version>` (the tag part only when a
   version rose); both read-backs (`:432-443`, `:455-468`) check every pushed ref. (c) `--dry-run` (`:419-422`) prints:
   `DRY RUN — would push … Nothing pushed.`; `compare https://github.com/<slug>/compare/<old release>...<sha>` (no
   release yet: `/commits/<sha>`); `plugins: agent-models 1.6.0 → 1.6.1, 3 file(s)` or `plugins: none changed`;
   `gate: runs at <HEAD>; tools/ and .github/ differ from <sha> in: <paths>` or `gate: runs at the promoted commit`.
   (d) The words about consumers and submodules (`:305`, `:441`, `:470`). Nothing else: no `--force`, no new option.
3. **`tools/mods-gate.mjs`** (`node:` builtins and `./lib/git.mjs`): `layoutFindings({git, rev})` returns
   `[{path, reason}]` from `git ls-tree -r -z --full-tree <rev>` and `git show <rev>:<path>`; `versionVerdict({git,
   release, sha})` returns `{ok, tags, changed}` or a refusal. A plugin "changed" when `git diff --quiet <release> <sha>
   -- plugins/<name>` says so (tests ship too, so they count). A version is `^\d+\.\d+\.\d+$`, compared as three
   numbers. The catalog: top-level keys `name`, `owner`, `metadata` (only `description`), `plugins`; an entry is
   exactly `name`, `source`, `description`; `source` is the STRING `./plugins/<name>` (conventions ·
   `research/dew_flow_mods_probe_E1.md:223-224`); folders and entries are one set. Every symlink and gitlink is
   refused, not only an escaping one (the mod has none: 33 files of mode 100644 at `69adc1e`). The CLI
   `node tools/mods-gate.mjs [rev=HEAD]` is a new step of the `mods · tools` job of `ci.yml`.
4. **`.github/workflows/promote-release.yml`** (line refs: the conventions file, whose token has `contents: write`,
   `:54-56`). Inputs `sha`, `reason`; `concurrency` as `:50-52`; top-level `permissions: contents: read, actions: read`.
   Job `verdict` (no environment, no secret): the guard of `:66-82`; checkout `ref: ${{ github.sha }}`,
   `fetch-depth: 0`, `persist-credentials: false`; setup-node; the tool with `--dry-run` (the input through `env`,
   `:104-113`), its output also in the step summary, the step's exit code the tool's own. Job `push`: `needs: verdict`,
   the `if` of Y1, `environment: release`; checkout `ref: ${{ github.sha }}`, `fetch-depth: 0`,
   `ssh-key: ${{ secrets.RELEASE_DEPLOY_KEY }}`; setup-node; `node tools/promote-release.mjs "$SHA"` (the whole
   judgement again: `main`, `ci` and `release` can change while the run waits); a summary. No `npm` step: the tool has
   no dependency, so nothing unreviewed runs beside the key. Action pins as `:90` and `:97`.
5. **`.github/scripts/repo-settings.mjs`** (the shape of `branch-protection.mjs`: check by default, `--apply`, `$` keys
   stripped as `:602-610`, exit 0 match, 1 drift, 3 could not look as `:694-704`, `gh` as a function) with the data
   of § 4; `tools/workflows.test.mjs` (devDependency `yaml` exactly `2.9.0`, as conventions `package.json`).
6. **`tools/agent-token.mjs`** (§ 5): key path `DEW_FLOW_AGENT_KEY` or `~/.config/dew-flow-agent/app.pem`; `fetch`
   with a 30 s abort; cache `~/.cache/dew-flow-agent/token.json` (one file under 1 KB, overwritten at each mint).
   Run: `npm ci --ignore-scripts`, `npm test`, `node tools/mods-gate.mjs`, `node .github/scripts/repo-settings.mjs`.

## 4. GitHub settings: the data, the apply, the read-back

`.github/rulesets/*.json`, each file the POST body, `"enforcement": "active"`. The check names and the
`integration_id` are READ from PR #1 (`gh api repos/$R/commits/<head>/check-runs`: `name`, `app.id`), never typed.

| File | `conditions.ref_name.include` | Rules | `bypass_actors` |
|---|---|---|---|
| `main.json` | `refs/heads/main` | `deletion`, `non_fast_forward`, `required_linear_history`, `pull_request` (`allowed_merge_methods: ["squash"]`, `required_approving_review_count: 0`, `required_review_thread_resolution: true`, the other three flags `false`), `required_status_checks` (strict; each `ci` job and the title check, each with the Actions app's `integration_id`, so a status posted by another identity does not count) | `[]` |
| `release-moves.json` | `refs/heads/release` | `creation`, `update` (`update_allows_fetch_and_merge: false`) | `[{"actor_id": null, "actor_type": "DeployKey", "bypass_mode": "always"}]` |
| `release-fixed.json` | `refs/heads/release` | `deletion`, `non_fast_forward` | `[]` |
| `tags-create.json` (`target: tag`) | `refs/tags/agent-models--v*` | `creation` | the same one `DeployKey` actor |
| `tags-fixed.json` (`target: tag`) | `refs/tags/agent-models--v*` | `update`, `deletion` | `[]` |

Two rulesets for each ref, because a bypass covers every rule of its ruleset: with one, the key could also force-push
and delete. So the key can create and move forward; nobody can rewind, delete or re-point. The Actions app, a
repository role and a user are in no bypass list (D1, D2). `.github/settings.json` holds four parts:

- `environment`: `release`; `wait_timer: 0`; `prevent_self_review: false` (so that the owner alone can still dispatch
  and approve); `can_admins_bypass: false`; `reviewers: [{"type": "User", "id": <gh api users/oleksandrdubyna88 --jq .id>}]`;
  `deployment_branch_policy: {"protected_branches": false, "custom_branch_policies": true}` with the one policy
  `{"name": "main", "type": "branch"}`; `secrets: ["RELEASE_DEPLOY_KEY"]` (names only; no repository secret of that name).
- `deployKey`: `title: release-promotion`, `read_only: false`, `key`: the line of the `.pub` file. One key, no other.
  `actions`: `default_workflow_permissions: read`, `can_approve_pull_request_reviews: false`, fork approval
  `all_external_contributors` (story 2.1 sets them, `PLAN_dew_flow_mods_E2.md:45-48`; this is their read-back).
- `agentIdentity`: `kind: github-app`, `slug`, `appId`, `clientId`, `installationId`, `repositories: ["dew_flow_mods"]`,
  `permissions: {actions: write, checks: read, contents: write, metadata: read, pull_requests: write, statuses: read}`.

The order, with the owner's login (the go: Q2, parent `:399-400`; a later change of this data needs the owner's word):

1. After the PR merges: `node .github/scripts/repo-settings.mjs --apply`, then its read-back of every part (the
   rulesets with their bypass lists, the environment with its branch policies and secret names, the keys, Actions).
2. The owner, in the owner's OWN terminal (a key that an agent session made is a key that session could keep):

   ```bash
   R=oleksandrdubyna88/dew_flow_mods; d=$(mktemp -d /dev/shm/rk.XXXXXX); ssh-keygen -q -t ed25519 -N '' -C release -f "$d/k"
   gh repo deploy-key add "$d/k.pub" --repo $R --allow-write --title release-promotion
   gh secret set RELEASE_DEPLOY_KEY --repo $R --env release < "$d/k"; cat "$d/k.pub"; rm -rf "$d"
   ```

3. A PR writes the printed public line and the App's numbers into `.github/settings.json`; the read-back then exits 0.
   What the API cannot set or show (`can_admins_bypass`) the owner sets by hand; the record says so, with the date.

## 5. The agent identity (before promotion 1 of story 2.3; not needed to create the repository)

**Recommended: a GitHub App.** It is the only one of the two that can hold exactly the asked permissions: a machine
user is a collaborator of another account's repository, so it needs a classic token (a fine-grained one cannot write
there), and a classic scope is all-or-nothing. An App cannot be a reviewer of an environment at all; its tokens live
one hour and reach one repository; there is no second account with a password and 2FA to keep. The cost: `gh` has no
App login, so `tools/agent-token.mjs` (about 80 lines, K1–K4) makes the tokens; and the O4 fork needs another owner.
The fallback: a machine user, a classic token of scope `public_repo` only, `gh auth login --with-token`; weaker.

**The owner's steps** (about 5 minutes): github.com → Settings → Developer settings → GitHub Apps → New GitHub App.
Name `dew-flow-mods-agent` (any free name); Homepage URL = the repository URL; Webhook: clear "Active". Repository
permissions: Actions read and write; Checks read; Commit statuses read; Contents read and write; Pull requests read
and write; Metadata read (GitHub sets it). ALL others "No access": Administration, Environments, Secrets, Variables,
Workflows, Deployments, Webhooks. No account permission, no event. "Only on this account". Create. Then "Generate a
private key" (a `.pem` downloads); Install App → Only select repositories → `dew_flow_mods`. Then
`install -m 600 -D <the downloaded .pem> ~/.config/dew-flow-agent/app.pem` and delete the download. Give the session
four public values: the slug, the App ID, the Client ID, the installation id (the last number of the install URL).
Never add the App or a second person as a reviewer of `release`; an unasked request for more permissions is an alarm.

**How an agent shell switches** (written into `.agents/PROJECT.md` of `dew_flow_mods`):

```bash
export GH_TOKEN="$(node tools/agent-token.mjs)"     # first line of every Bash call that runs gh for this repository
git config --local credential.helper ''             # once in each clone: drop the inherited helpers here
git config --local --add credential.helper '!node <clone>/tools/agent-token.mjs --git-credential'
gh api installation/repositories --jq '[.repositories[].full_name]'   # who am I: only this repository
```

**What the identity can still do:** merge a pull request to `main` after green checks (0 approvals), dispatch a
promotion, cancel, re-run or delete a run. It cannot change a workflow file, so the owner merges a pull request that
touches `.github/workflows/**`. The owner's click and the compare and gate lines of the verdict are what remain.

## 6. Observations on GitHub (each run once; recorded: date, identity, command, exit code, refusal text, `refs` before and after)

```bash
R=oleksandrdubyna88/dew_flow_mods; M=$(git rev-parse origin/main); refs() { git ls-remote origin 'refs/heads/*' 'refs/tags/*'; }
# Phase A — after the apply, the owner's login: an administrator is the strongest caller a ruleset meets.
git push origin $M:refs/heads/release                                    # O1a  ! [remote rejected] … rule violations
gh api -X POST repos/$R/git/refs -f ref=refs/heads/release -f sha=$M     # O1a  HTTP 422
git push origin $M:refs/tags/agent-models--v0.0.0                        # O2a  rejected; the POST git/refs form: 422
gh release create agent-models--v0.0.0 --repo $R --target $M --notes o2  # O2a  refused: a release is one more road to a tag
git push origin <a scratch commit>:refs/heads/main; git push --force origin $M~1:refs/heads/main; git push origin :refs/heads/main   # O5  all rejected
# Phase B — the agent identity. The controls come first: a refusal proves nothing when the token is simply broken.
gh api installation/repositories --jq '[.repositories[].full_name]'      # control: ["oleksandrdubyna88/dew_flow_mods"]
git push origin HEAD:refs/heads/probe/o7; gh pr create --head probe/o7 --title "test: probe" --body o7   # control: accepted; then closed
gh workflow run promote-release.yml --repo $R --ref main -f sha=$M -f reason="rehearsal, never approved"
gh api repos/$R/actions/runs/$RUN/pending_deployments --jq '.[0] | {env: .environment.id, can: .current_user_can_approve}'   # O7a  can: false
gh api -X POST repos/$R/actions/runs/$RUN/pending_deployments -F 'environment_ids[]=<env>' -f state=approved -f comment=o7a  # O7a  HTTP 4xx; the run still waits; then gh run cancel $RUN; refs unchanged
git push origin $M:refs/heads/release; git push origin $M:refs/tags/agent-models--v0.0.0   # O7b  rejected (and the two API forms)
gh api -X PUT repos/$R/rulesets/<id> --input .github/rulesets/release-moves.json            # O7c  403 or 404; the same data, harmless if accepted
gh api -X PUT repos/$R/environments/release --input <the environment body of the data>     # O7c  403 or 404; the same data
gh api repos/$R/keys; gh api repos/$R/environments/release/secrets       # O7c  403 or 404 (a key ADD is not probed: accepted, it adds a key)
git push origin <a commit that edits .github/workflows/ci.yml>:refs/heads/probe/o7d        # O7d  rejected: no workflows permission
env -u GH_TOKEN gh api repos/$R --jq .permissions.admin                  # O7e  recorded as it is; true = the owner's login is in reach
```

- **O6** (owner's login; branch `probe/o6`, deleted after). The branch adds a workflow on `push` to `probe/**` with
  `permissions: contents: write` and two jobs. (a) `git push origin HEAD:refs/heads/release` with its own token:
  rejected by the ruleset. (b) `environment: release` and a step that prints only `${#K}` of the secret: the job
  fails before any step (the branch may not deploy to `release`); no approval request reaches the owner. (c) The
  branch deletes the guard from `promote-release.yml` and the workflow is dispatched with `--ref probe/o6`: job `push`
  is refused by the environment. With the guard kept, `verdict` fails (G10).
- **O4** (a fork that is not the owner's own account: Owner decision 3). A fork PR edits `ci.yml` to print the length
  of `secrets.RELEASE_DEPLOY_KEY` and to push a branch with its token. Expected: the run waits for approval; after
  it, length 0 and the push answers 403. The PR is closed unmerged.
- **O3** (promotion 1, story 2.3): the summary of `verdict` shows the compare line BEFORE the approval; the run waits;
  the owner clicks; `release` and the tag are at the sha; `gh api repos/$R/actions/runs/$RUN/approvals` names the owner.
- **O1b, O2b** (after promotion 1, when `main` has a later commit `M2`; with each login that exists): a hand push of
  `M2` to `release`; `--force` of `M~1`; a deletion; `PATCH git/refs/heads/release` with `force`; `POST merges` and a
  merged pull request with base `release`; a forced tag push; a tag deletion by git and by API. All refused.
- **Not checked, said in the record:** that the deploy key itself cannot rewind or delete (it never leaves the
  environment; the evidence is the read-back of the two `-fixed` rulesets); a key add by the agent; the web editor.

## 7. Stop rules (the story stops and goes back to the parent plan; nothing is retried around a stop)

- **S1** The API refuses the `DeployKey` bypass actor here, or O3's push with the key is refused after the approval.
  No Actions-app bypass and no administrator bypass is put in its place (parent § B.3).
- **S2** Any of O1, O2, O5 is accepted. No promotion; the owner decides how a ref that a probe made is removed.
- **S3** O6 or O4: a job outside `main` got the secret or a deployment. The owner rotates the key at once; then stop.
- **S4** O7a, O7b or O7c is accepted under the agent identity. No promotion; the identity's permissions are wrong.
- **S5** A part of the settings can be neither applied nor seen by anybody (a hand setting the owner saw is recorded).
- **S6** A test cannot be seen red for its stated reason. The coder stops and reports; no test is "fixed" green.
- **S7** The work needs a rule the parent does not have (another refusal, ref, bypass or secret): the parent's ledger
  first. **S8** The first real mint has no `permissions` or `repository_selection`: a stop for the identity only.

## 8. For the owner, and open points for the caller

1. **Owner decision 1:** the App (recommended) or the machine user. **Decision 2:** where the owner's own `gh` login
   lives. While it stays on the OS user that agent sessions run as, a session that drops `GH_TOKEN` is the owner
   again, and the click is a procedure there (O7e records it: the written risk of parent `:350`). It is a barrier
   when agents get, in its place, a token of the owner that does not reach `dew_flow_mods`; that touches nine
   repositories, so it is a todo of its own. **Decision 3:** the O4 fork — an organisation of the owner
   (`gh repo fork --org`), a second account, or O4 recorded "not observed live".
2. The owner does: the key paste of § 4 step 2; the App of § 5; the hand setting of § 4 step 3; the merge of any
   pull request that touches a workflow file; the approval of each promotion.
3. The parent names O1–O7 (no O8); the lettered halves are parts of those rows. O1b and O2b need `release` to
   exist, so they follow promotion 1; `PLAN_dew_flow_mods_E2.md:164` should say O1a and O2a.
4. For the ledger, the caller's reading decides: the two rulesets for each ref are read here as "forward only, no
   force" (parent `:168`) and "deletions restricted" (`:180-181`) as written; `tools/agent-token.mjs` is not in the
   parent's § C list and follows from the answer to Q3 (`:395-398`). This file needs its `todo/README.md` row.
