# PLAN — A subagent's model follows its role: Sonnet gathers and writes, Opus judges, Fable holds the cornerstones

> Status: **plan only, nothing implemented yet, 2026-10-13.** Scope: `common/subagent-models.md` (rewritten),
> `common/planning-docs.md` (one new section), `settings/hooks/subagent-model.mjs` (new) and its wiring in
> `settings/settings.json`, `tools/install-user-hook.mjs` (new), `tools/lib/rule-smoke.mjs` + `tools/lib/rule-trace.mjs`
> (a behaviour mode), `research/rule-bodies.json`, `research/RESULTS_subagent_model_tiers.md` (new), the release and
> the pin bump in every consumer, and — outside this repository — the operator's `~/.claude/settings.json`.
>
> Supersedes the calibration-gated scout plan this file used to be (`git log --follow` keeps it): the operator decided on
> 2026-10-13 to switch without waiting for a verdict. Related: [subagent-models.md](../common/subagent-models.md),
> [planning-docs.md](../common/planning-docs.md), [measurement.md](../common/measurement.md),
> [rule-ownership.md](../common/rule-ownership.md). Across the boundary: `dew_flow_benchmark · todo/PLAN_scout_model_calibration.md`
> (its verdict stops gating anything — §3.7).

## 1. The goal, before any solution

**Today.** `common/subagent-models.md` says every subagent runs on Opus, Fable for new-project architecture, security,
cryptography and authentication, and the model is passed explicitly on every call. The most-used workflow here, the
`feature-dev` plugin, pins `model: sonnet` in all three of its agents (`agents/code-*.md:5`, the same in all 14 cached
versions on this machine, checked 2026-10-13), and its implementation phase is done by the main session itself.

**What the operator wants (2026-10-13).** Spend the strongest model where a mistake compounds and the cheaper one where a
mistake is caught by the next step. The decisions, as stated, with the follow-up answers the same day:

| # | Decision |
|---|---|
| D1 | **Search and research → Sonnet**, ⌈1.5·N⌉ scouts where N would have run on Opus (1→2, 2→3, 3→5), each with its own focus. |
| D2 | **Writing code → Sonnet**: code, fixes, review fixes, unit and integration tests. The main session writes code itself only for a change to **one file of at most 50 changed lines**; anything larger goes to a Sonnet subagent. |
| D3 | **Thinking and judging → Opus**: reviewers, architects, finding verifiers, **test scenarios**, the **brief** that says what to change and how, and **splitting an epic into stories**. |
| D4 | **Fable**: **splitting a plan into epics**; **security** (cryptography, authentication, authorisation) outside any quota; and **cornerstone stories**, at most ⌈2·E/5⌉ per plan of E epics (1–2 epics → 1, 3–5 → 2, 6–7 → 3). On a cornerstone story Fable writes the **spec** (scenarios + brief), **Opus reviews**, Sonnet writes the code. |
| D5 | **Who picks the cornerstones.** Fable names the cornerstone areas while splitting the plan into epics; **before that split is final, the question consultant is asked what and where is important**; Opus marks the concrete stories `model: fable` while splitting each epic, within the quota. |
| D6 | **Always the newest model**: aliases only (`sonnet`, `opus`, `fable`), never a versioned id, never a pin that freezes an alias. |
| D7 | **Switch now.** The benchmark calibration no longer gates the rule; it may finish as a check after the fact. |
| D8 | **Enforced, not hoped for**: a guard hook on the Agent tool, installed in the operator's user settings (every repository on this machine) as well as published by this repository. |
| D9 | **The epic/story layout is written down**: epics at the bottom of the plan file, stories in one document per epic. |
| D10 | **A behaviour smoke**: a real session, observed, proves the rule is followed — loading is not obedience. |
| D11 | **`modelSettings` by alias** on the operator's machine if the host accepts it, so a saved effort level survives the next model release. |
| D12 | Scope: **every subagent in every task**, not only `feature-dev` (operator, 2026-10-12, unchanged). |

Derived, not separately decided: **Haiku is not used** (no role above names it). When Fable refuses a launch on a spend
or session limit, the work continues on **Opus** and the summary says so (operator, 2026-10-10).

**What changes, step by step** — the `feature-dev` workflow as the plugin ships it, as the current rule runs it, and
after this plan:

| Step | Who acts | Plugin as shipped | Current rule | After this plan |
|---|---|---|---|---|
| 1 Discovery | main session | session model | Opus | Opus |
| 2 Exploration | 2–3 `code-explorer` | Sonnet (frontmatter) | Opus, passed | **Sonnet, 3–5** (⌈1.5·N⌉), distinct focuses |
| 3 Questions | main session | session model | Opus | Opus |
| 4 Architecture | 2–3 `code-architect` | Sonnet (frontmatter) | Opus, passed | **Opus**, passed |
| 5 Implementation | plugin: main session | session model | Opus | **Opus** writes scenarios + brief → **Sonnet** subagent writes code and tests (≤ 50 lines in one file: the main session may do it) |
| 6 Review | 3 `code-reviewer` | Sonnet (frontmatter) | Opus, passed | **Opus**, passed |
| 6b Review fixes | main session | session model | Opus | **Sonnet** (same 50-line exception) |
| 7 Summary | main session | session model | Opus | Opus |
| Plan → epics | — | — | Opus / Fable | **Fable** |
| Epic → stories | — | — | Opus / Fable | **Opus** |
| Cornerstone story | — | — | Opus / Fable | spec **Fable**, review **Opus**, code **Sonnet** |

## 2. Measured facts this plan rests on

**How the host resolves a subagent's model** (Claude Code docs, read 2026-10-13: `code.claude.com/docs/en/sub-agents.md`,
`…/model-config.md`, `…/settings-reference.md`):

- Precedence, highest first: the Agent call's `model` argument → the agent definition's frontmatter → the
  `CLAUDE_CODE_SUBAGENT_MODEL` environment variable → the session's model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` puts the
  variable back on top. So a `model` passed on the call beats the plugin's `sonnet` — documented now, not only observed.
- Built-in `Explore` and `general-purpose` inherit the session's model. A session that names nothing sends its scouts to
  Opus: the cost of a missing rule in a read-only session is money, not quality.
- Accepted values: `sonnet`, `opus`, `haiku`, `fable`, a full id, `inherit`. **Aliases move to the provider's
  recommended version as it changes** — on the Anthropic API; Bedrock, Vertex and Foundry lag behind. They are frozen by
  `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU,FABLE}_MODEL`. None of these is set in the operator's `~/.claude/settings.json`
  (checked 2026-10-13).
- `modelSettings` maps "a model name" to settings; the only documented example is an exact id; a top-level
  `effortLevel` is ignored by Opus 5.5 and later. The operator's file keys `claude-opus-5-5` and `claude-opus-5` — so
  when the next Opus ships, the saved `high` will not apply to it. Whether a key like `opus` is honoured is undocumented.

**The single-read budget.** A `read` refuses a payload over 32 768 B (`tools/lib/rule-cli.mjs:112`). Measured with
`node tools/rules.mjs explain --repo . --task inspect [--file …]` at `3df745a`:

| `inspect` scope | Selected bytes | Free |
|---|---|---|
| no file (session start) | 24 207 | 8 561 |
| `src/x.cs` | 28 820 | 3 948 |
| `ui/a.ts` | 30 116 | 2 652 |
| `src/x.csproj` | 31 901 | **867** |

A compact every-task rule was drafted for this plan (the role table and the alias rule, nothing else) and measured
**814 B with CRLF** — it would leave the `.csproj` scope 53 B. **Rejected**: the next rule anywhere would break that
scope, and §2's first bullet shows nothing is lost in quality by leaving `inspect` out. The guard (§3.2) covers `inspect`
instead, and costs no read budget at all. Every scope that selects `subagent-models.md` today (`plan`, `implement`,
`audit`, `test`, `docs`, `pr`, `release`, `policy`) is already 136–245 KB and read rule by rule with `--only`, so the
rewritten rule's only hard limit is its own 32 768 B.

**The precedent for a guard.** `settings/hooks/build-flags.mjs` is a `PreToolUse` hook wired in `settings/settings.json:24`:
it reads the payload with a 2 s deadline (`:43`), refuses with `permissionDecision: 'deny'` and a reason (`:185-197`),
and fails open on every error. `tools/adapter-check.mjs:36-44` derives the hook inventory from `settings/hooks/`, so a
new hook is demanded of the migrated consumer (connect_other_ais, mounted at `.agents/conventions`) without editing the
checker. `tools/build-flags-hook.test.mjs` is the test shape to copy.

**The smoke cannot see delegation today.** `tools/lib/rule-smoke.mjs:48` gives the session `Read,Bash,Glob,Grep` and no
Agent tool, and its prompt (`:128`) forbids delegation. `tools/lib/rule-trace.mjs:79-90` collects every `message.model`
into one set, without grouping by `parent_tool_use_id` — it cannot say which child ran on what.

**Change control.** `tools/rules.test.mjs:147-170` freezes every rule body against `research/rule-bodies.json`; a
deliberate edit is recorded with `node tools/rule-bodies.mjs --update <id>`.

**The epic/story layout is unwritten.** `common/planning-docs.md` (13 553 B) has no section on epics or stories, and the
family's files show it: `dew_flow_connect_other_ais · research/PLAN_epic_01_foundation.md`,
`dew_flow_creds_for_devs · research/PLAN_agent_consent_policy_stories.md`, `… · research/PLAN_payment_instruments_epics.md`
— three namings for one practice.

**Other Claude sessions on this machine.** A user-level hook fires in every `claude` process the operator's account
starts: the coai reviewers and consultants, the benchmark's arms, and this repository's own `smoke-rules`. A benchmark
arm that measures models must not be steered by the guard.

## 3. Design

### 3.1 The rule — `common/subagent-models.md`, rewritten

One canonical statement; nothing else restates it (two summaries of one rule drift). Sections:

1. **The table** — role → model, D1–D4 in one table, the 50-line exception beside D2.
2. **The pipeline** — plan (main session) → epics at the bottom of the plan (Fable, after the consultant was asked what
   is important) → one stories document per epic (Opus, marks cornerstones within ⌈2·E/5⌉) → per story: scenarios and
   brief (Opus; Fable on a cornerstone) → code and tests (Sonnet) → review (Opus) → fixes (Sonnet). The layout itself
   lives in `planning-docs.md` (§3.3); this rule says only who acts.
3. **Scout or judge — the assigned output decides.** Facts and file lists → scout. Anything that proposes, decides,
   verifies or reviews → judge, even read-only. A request to research AND propose → split it, or it is a judge. A scout
   in a security area stays a scout; the Fable or Opus caller decides. *In doubt, it is a judge.*
4. **Scouts** — ⌈1.5·N⌉ with distinct focuses written before launch; two scouts with one brief are one scout paid twice;
   the caller opens every file a conclusion rests on (`measurement.md`).
5. **Coders** — what the brief must carry so a Sonnet coder needs no re-discovery (files, the change, the scenarios to
   make pass, the commands to run); the coder obeys the testing rules (RED first for a bug).
6. **Name the model on every launch, as an alias.** Including `Workflow` scripts' `agent()` calls, which no hook sees.
   Never a versioned id; never `ANTHROPIC_DEFAULT_*_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL` or `…_FORCE`. A plugin's
   frontmatter is not a decision (the `feature-dev` example, dated).
7. **The guard** — what it enforces (a model is named, and is an allowed alias) and what it cannot (whether the role
   matches); its opt-out exists for harnesses that measure models, never for a working session.
8. **Fable unavailable** → Opus, said in the summary.
9. **Never** and **Definition of Done** — the summary names models AND counts ("5 scouts on Sonnet, 2 architects on
   Opus, 1 coder on Sonnet").

**Tasks.** Every task except `inspect` (covered by the guard, §2), each added only after E1 measures that it does not push
a scope that is single-read today over 32 768 B; a test pins the outcome.

**Size.** Target ≤ 9 000 B; E1 measures. A rule body may not name a family repository or product
(`tools/ownership-check.mjs`), so evidence is cited through this repository's `research/RESULTS_subagent_model_tiers.md`.

### 3.2 The guard — `settings/hooks/subagent-model.mjs`

- `PreToolUse`, matcher `Agent|Task` (E2's first story records a real payload to confirm the tool name and that
  `tool_input.model` carries the argument).
- **Allow** when `tool_input.model` is exactly `sonnet`, `opus` or `fable`.
- **Deny** when it is missing or empty, `haiku`, `inherit`, a versioned id, or anything else — the reason carries the
  role table in ≤ 600 B and names `subagent-models.md`, so a session in `inspect`, which never loaded the rule, still
  learns it from the refusal.
- **Warn, never deny,** when an alias-freezing variable (`ANTHROPIC_DEFAULT_*_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`)
  is set — through the hook's user-visible message; E2 confirms which output field shows.
- **Opt-out** `SUBAGENT_MODEL_GUARD=off` in the environment → allow everything. E2 inventories every harness on this
  machine that spawns `claude` and records which must set it (a model-measuring benchmark arm must; a coai reviewer is
  checked, not assumed).
- Fails open on a malformed payload, an internal error and a stdin that never closes — the `build-flags.mjs` contract.
- **Delivery, three ways:** `settings/settings.json` wires it (reference); connect_other_ais copies it, as
  `adapter-check` will demand; and `tools/install-user-hook.mjs` installs it into `~/.claude/hooks/` and merges the
  `PreToolUse` entry into `~/.claude/settings.json` idempotently, after a timestamped backup, with `--check` reporting
  drift from the copy in this repository. In connect_other_ais the hook then fires twice per call (user + project); both
  verdicts agree, so that is cost, not conflict.

### 3.3 The layout — a new section in `common/planning-docs.md`

*A plan split into epics and stories*: the epics are a `## Epics` section at the bottom of the plan file (goal, scope,
done-when, and the cornerstone areas); each epic's stories are one document, `todo/PLAN_<topic>_E<n>.md`, with its own
status line, a link to the parent plan, and the parent linking back (the both-sides rule already in that file). The
stories document is written when its epic starts, not all at once. Both promote together. Existing files under other
names are not renamed. E1 runs `node tools/plan-lifecycle.mjs` against a fixture pair to learn whether each stories
document needs its own `todo/README.md` row; if it does, the section says so — no change to the checker in this plan.
Who writes each part is `subagent-models.md`'s, by link, not restated.

### 3.4 The behaviour smoke

`rule-smoke.mjs` gains a behaviour mode (one launcher, one trace reader — reuse, not a second tool): the Agent tool is
offered and delegation allowed, in a disposable worktree, under a budget cap. The fixture is a frozen task whose text
fixes its own baseline — *an Opus team would be three scouts; the change touches two files and about 120 lines; it must
be reviewed* — so the expectation is known before launch:

- **five** Agent calls with `model: "sonnet"` and distinct prompts (scouts);
- **one** with `model: "sonnet"` that edits (the coder) — the change is over the 50-line exception by construction;
- **one** with `model: "opus"` that reviews;
- every child's resolved `message.model` in the matching family (`claude-sonnet-*`, `claude-opus-*`), read by grouping
  events on `parent_tool_use_id`;
- **zero** guard denials — a denial means the rule text did not carry, which is a defect in the text, fixed and re-run,
  never a loosened check.

It costs real money per run, so it is not in CI: `npm run smoke:behaviour`, run in E4 and on any later edit of the
rule, each run recorded in `research/RESULTS_subagent_model_tiers.md`.

### 3.5 `modelSettings` by alias — on the operator's machine

Back up `~/.claude/settings.json`; add `"opus": {"effortLevel": "low"}` beside the exact keys and remove `claude-opus-5-5`
for one probe; start a session on `opus` and read the effort it reports (`/status`, or `--debug` output); restore. If the
alias key is honoured, the file moves to alias keys (`opus`, `fable`, `sonnet`) with the operator's levels; if not, or if
it cannot be observed, the result is recorded and the exact keys stay, with a line in the rule's research record that
they need one edit per model release.

### 3.6 What leaves with the old plan

The calibration precondition, the weekly alias check and the suspension procedure: an alias that moves is now the
intended behaviour, not an event to suspend on. The `subagent-scouts.md` split: the guard does its job without spending
the read budget.

### 3.7 Across the boundary — the benchmark

`dew_flow_benchmark · todo/PLAN_scout_model_calibration.md` states that its verdict decides this rule. One status-line
change there (its own repository, its own PR): the verdict no longer gates; the calibration, if finished, is a check after
the fact, and a result worse than the operator's margin (3 recall points, +0.5 wrong claims per 10) reopens this decision
with the operator. Another session runs that plan's E1; the change is to its status text only, never to its work.

## 4. Test plan

- **Guard** (`tools/subagent-model-hook.test.mjs`, the `build-flags-hook.test.mjs` shape): the allow/deny matrix
  (each alias; missing, empty, `haiku`, `inherit`, `claude-opus-5-5`, `Opus` in another case, a non-string); the reason
  carries the table and fits 600 B; the opt-out; the freeze-variable warning; fail-open on garbage JSON, on a thrown
  error and on a stdin left open (spawned, as the existing test does). **Break-it:** make the hook allow everything →
  the deny cases go red → restore.
- **Installer** (`tools/install-user-hook.test.mjs`), against a temporary home: fresh install; idempotent second run
  (byte-identical settings); an existing unrelated `PreToolUse` entry and every other key preserved; backup written;
  `--check` reports drift after the hook copy is altered.
- **Adapter:** `adapter-check` against a fixture consumer without the new hook → fails naming it; with it → passes.
- **Rule:** `node tools/rule-bodies.mjs` and `node tools/ownership-check.mjs` clean; a `rules.test.mjs` case pins the
  task list and that every single-read `inspect` scope measured in §2 still fits.
- **Layout:** the fixture pair through `plan-lifecycle.mjs`, as §3.3.
- **Behaviour:** §3.4, recorded.
- Always: `npm test`, `npm run check`, `node tools/plan-lifecycle.mjs`.

## 5. Risks

| Risk | Answer |
|---|---|
| The guard blocks a harness that measures models | the opt-out, and E2's inventory of every `claude`-spawning harness before the user-level install |
| The guard hangs or crashes a tool call | the `build-flags.mjs` fail-open contract, tested by spawn |
| The Agent tool is renamed or its payload changes | E2 records a real payload; a payload without `tool_input` fails open; the behaviour smoke's zero-denial count would show the guard went silent only as missing denials, so its test matrix runs on every `npm test` |
| A Sonnet coder needs context the brief omitted | §3.1's brief contents; the 50-line exception for the smallest edits; the Opus review catches the rest |
| The alias moves to a model that is worse at a role | accepted by D6; the behaviour smoke and the calibration (§3.7) are where it would show |
| Rolling out reddens every open PR in the family | one release for all four epics (E1, E2, E4 merge to `main` first; one promotion; one cascade) |

## 6. Noted while planning, not in scope

- The `inspect` read budget has 867 B left in the `.csproj` scope; the next rule that must ride in every scope has
  nowhere to go. Trimming the always-loaded rules, or a loader that splits one read, is its own plan.
- `.rs` and `.http` scopes are already over the single-read limit and depend on the `--only` split.

## Epics

*To be written by Fable, after the consultant is asked what and where is important (D4, D5).*

## 7. Definition of Done

- [ ] `common/subagent-models.md` states D1–D6 and D12 once, with the pipeline, the scout/judge test, the brief contents,
      the alias rule (Workflow `agent()` included), the guard, Never and DoD; body recorded; ownership clean.
- [ ] `common/planning-docs.md` has the epic/story layout; the fixture pair passes `plan-lifecycle.mjs`.
- [ ] The guard and its installer exist with the tests in §4; the break-it went red and back; `adapter-check` demands it.
- [ ] The harness inventory is recorded and each harness that needs the opt-out sets it.
- [ ] The guard is installed in `~/.claude` on this machine, and a session's Agent call without a model is refused.
- [ ] The behaviour smoke ran and showed five Sonnet scouts, one Sonnet coder, one Opus reviewer, every resolved model
      matching and zero denials; recorded in `research/RESULTS_subagent_model_tiers.md`.
- [ ] The `modelSettings` probe ran; its outcome is applied or recorded.
- [ ] One release; every consumer's pin bumped and green; connect_other_ais carries the hook copy.
- [ ] The benchmark plan's status line no longer claims to gate this rule.
- [ ] The assistant's memory note on subagent models is rewritten to D1–D12.
- [ ] This plan and its stories documents promoted to `research/` with their deviations; `todo/README.md` updated.
