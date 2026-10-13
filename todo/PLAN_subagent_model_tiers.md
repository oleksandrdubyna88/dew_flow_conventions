# PLAN — A subagent's model follows its role: Sonnet gathers and writes, Opus judges, Fable holds the cornerstones

> Status: **plan only, nothing implemented yet, 2026-10-13.** Scope: `common/subagent-models.md` (rewritten),
> `common/planning-docs.md` (one new section), `settings/hooks/subagent-model.mjs` (new) and its wiring in
> `settings/settings.json` and this repository's own `.claude/settings.json` + `.claude/hooks/` (it hosts the adapter on
> itself), `tools/adapter-check.test.mjs`, `tools/install-user-hook.mjs` (new), `tools/lib/rule-smoke.mjs` +
> `tools/lib/rule-trace.mjs` + `tools/smoke-rules.mjs` (a behaviour mode), `package.json`, `research/rule-bodies.json`,
> `research/RESULTS_subagent_model_tiers.md` (new) with its `research/README.md` row, `research/module_tests.md`, the
> release and the pin bump in every consumer, and — outside this repository — the operator's `~/.claude/settings.json`.
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
| D13 | **The user-level guard installs itself** (operator, 2026-10-13, chosen over a start-up reminder): a session started in a repository that carries the adapter puts the guard into `~/.claude` when it is missing or older, so a fresh machine needs no manual step. |

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
   verifies or reviews → judge, even read-only. A request to research AND propose → split it, or it is a judge.
   **Collecting evidence** — logs, a reproduction, what a file says — is scouting; **determining the cause**, or
   validating a cause someone proposed, is judging: "investigate why X fails" is a judge unless it is split into
   "collect the evidence" (scout) and "decide the cause" (caller). A coder running the tests its brief prescribes is
   still a coder; a separate agent asked whether the change is correct is a judge. Neither the agent's type nor its being
   read-only changes the class. A scout in a security area stays a scout; the Fable or Opus caller decides. *In doubt,
   it is a judge* (risk consultation on E1).
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

**Two definitions the text must carry, or two sessions will count differently:**

- *50 changed lines* — a decision made BEFORE the first edit, so it is an eligibility test, not a measurement: the main
  session may write the change itself only when it can bound the WHOLE patch in advance to one file (tests and new files
  count as files) and at most 50 added-plus-removed lines against the commit it started from — staging or committing
  midway does not reset the count. A replaced line counts twice (25 replaced lines are 50). If the size is uncertain,
  delegate; if the scope grows past the bound while writing, stop and hand the rest to a Sonnet coder with a brief
  (risk consultation on E1). No helper tool counts it; the rule makes the conservative choice the default.
- *The cornerstone ledger* — stories documents are written one epic at a time, so the quota is tracked in one place: the
  plan's `## Epics` section carries a line `Cornerstones: k of Q — <story>, <story>`, and the stories document that marks
  one updates it in the same commit. A mark that would make k exceed Q goes to the operator, not into the document.

**Tasks — measured, every task, at `750d811`** (`node tools/rules.mjs explain` for each task × no file, `src/x.cs`,
`src/x.csproj`, `ui/a.ts`, `src/main.rs`, `api/x.http`, `src/App.slnx`). Fourteen tasks are already over 32 768 B in
every one of those scopes and are read rule by rule with `--only`; adding ~9 KB changes nothing about how they load. Four
tasks still have single-read scopes, and the rule would push them over: `inspect` (867 B free at `.csproj`), `ui` (439 B
at `ui/a.ts`), `gpu` (475 B at `src/x.cs`) and `storage` (3 362 B, no file). So the rule is selected for the fourteen
and **explicitly not** for those four, where the guard's refusal and allowed-call context carry the digest (risk
consultation on E1, which measured `ui` and `gpu` first). A `rules.test.mjs` case enumerates the exported `TASKS` and
asserts exactly this split — a new task must be placed on one side by a person, never by default — and asserts that
every single-read scope of the four still fits.

**What no hook sees.** `Workflow` scripts' `agent()` calls bypass the Agent-tool guard. In the fourteen tasks the rule
text covers them; in the four excluded tasks nothing does. That gap is stated in the rule, not hidden; closing it (the
host's `agent.spawn` extension point, which can rewrite a spawn's model) is §6, out of scope.

**Size.** Target ≤ 9 000 B; E1 measures. A rule body may not name a family repository or product
(`tools/ownership-check.mjs`), so evidence is cited through this repository's `research/RESULTS_subagent_model_tiers.md`.

### 3.2 The guard — `settings/hooks/subagent-model.mjs`

- `PreToolUse`, matcher `Agent|Task`. The hooks reference documents the tool as `Agent` with an optional `model` input
  (`code.claude.com/docs/en/hooks.md`, *Agent* under PreToolUse input, read 2026-10-13); E2's first story still records
  real payloads — one with `model`, one without, and the observed denial — because a documented field is not yet an
  observed one.
- **Teach on every allowed call, never approve.** A denial teaches only the session that got it wrong; a session in
  `inspect` that launches a facts-only scout with `model: "opus"` is allowed and would never learn the table (consultant,
  cadence round). So every allowed Agent call returns `hookSpecificOutput.additionalContext` with a one-line role digest
  (≤ 300 B) and **no** `permissionDecision` — an `"allow"` would skip the operator's permission prompt, which is not the
  guard's to grant. Every call rather than the first per session: a per-session marker survives a `/compact` that drops
  the digest from the summary and would then suppress its replacement (consultant, second turn); stateless costs ~75
  tokens a launch and has nothing to invalidate. Hook context is read on the NEXT model request, so the residual is the
  first BATCH of launches a session emits together, not one launch. E2 records that the context reaches the parent.
- **Two kinds of bad input, two answers.** A payload that is not a well-formed Agent call — unparsable, no
  `tool_input` object, a `tool_name` the matcher should not have sent — is the hook's problem and **fails open**. A
  well-formed Agent call whose `model` is wrong is the session's problem and is **denied**. Conflating them either blocks
  work on a host change or lets a missing model through as "malformed".
- **Allow** when `tool_input.model` is exactly `sonnet`, `opus` or `fable`.
- **Deny** when it is missing or empty, `haiku`, `inherit`, a versioned id, or anything else — the reason opens with a
  fixed marker (`subagent-models.md:`), which is what the behaviour smoke counts, then carries the role table in ≤ 600 B,
  so a session in `inspect`, which never loaded the rule, still learns it from the refusal.
- **One digest, tested against the rule.** The ≤ 600 B digest in the refusal and its one-line form in the allowed-call
  context are the hook's only copy of the table; a test parses the role table out of `common/subagent-models.md` and fails when the two
  name different models for a role — so the second statement §3.1 forbids cannot drift silently.
- **Warn, never deny,** when an alias-freezing variable (`ANTHROPIC_DEFAULT_*_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`)
  is set — through the hook's user-visible message; E2 confirms which output field shows.
- **Opt-out** `SUBAGENT_MODEL_GUARD=off` in the environment → the hook emits nothing at all: no refusal, no context, no
  decision — a harness that measures models must not be steered by a hint either. E2 inventories every harness on this
  machine that spawns `claude` and records which must set it (a model-measuring benchmark arm must; a coai reviewer is
  checked, not assumed).
- Fails open on a malformed payload, an internal error and a stdin that never closes — the `build-flags.mjs` contract.
- **Self-install (D13).** A second `SessionStart` hook, `settings/hooks/ensure-user-guard.mjs`, runs the installer's
  logic against the operator's home from the project copy at `${CLAUDE_PROJECT_DIR}/.claude/hooks/subagent-model.mjs`:
  - only when the installed copy is **missing or older** — the hook carries a `GUARD_VERSION` integer, raised with every
    behaviour change, so two repositories on different releases never flip the installed copy back and forth;
  - never when `SUBAGENT_MODEL_GUARD=off` (a measuring harness installs nothing) or when
    `~/.claude/hooks/subagent-model.optout` exists — which `--uninstall` writes, or the next session would undo it;
  - with every safety of the installer below (refusal on unparsable or changed settings, atomic write, backup), and
    fail-open: any error leaves the session starting normally, with one `systemMessage` line saying what happened;
  - silent when nothing changes, one line when it installed or upgraded — and one line, never silence, when the installed
    copy is NEWER than the project's (a work-in-progress checkout with a raised version would otherwise make every later
    upgrade a silent no-op); the operator replaces it with `install-user-hook.mjs --force`, which the self-install never
    passes;
  - declining, with one line, when the project copy has uncommitted changes (`git status --porcelain` on that file) —
    the only check that stops an experimental guard leaking into user scope from a working tree;
  - recording provenance: `~/.claude/hooks/subagent-model.installed.json` (source path, sha256, version, time, CLI or
    self-install), which `--check` prints and verifies.
  - **The trust boundary, stated** (E1 code round; security judgement on Fable): the self-install is itself a project
    hook, so it runs only in a workspace the operator trusted — and such a workspace can already write `~/.claude`
    directly. D13 adds no capability; an integrity check inside the shipped hook would be circular (the same repository
    ships the checker). What it adds is reliability risk, answered by the three items above.
  It reaches only the repositories wired with the adapter (this one and connect_other_ais today); it is wired into
  `settings/settings.json` in E4, in the commit the release is cut from, so the first self-install happens no earlier
  than the cascade it rides on.
- **Delivery, three ways:** `settings/settings.json` wires it (reference), and this repository copies it onto itself
  (`tools/adapter-check.test.mjs:48-50` asserts the self-hosted adapter is whole); connect_other_ais copies it, as
  `adapter-check` will demand; and `tools/install-user-hook.mjs` installs it into the operator's home.
- **The installer edits the file that holds the operator's permissions, so it is held to more than "idempotent":**
  - an existing `settings.json` that does not parse is **refused**, never overwritten;
  - it re-reads and compares the file immediately before writing, and refuses if another writer changed it since it read;
  - the write is atomic (a temporary file in the same directory, then rename);
  - **the residual race, stated rather than hidden:** the host takes no lock a third party can share, so a write landing
    between that final comparison and the rename is lost, and it is **undetectable afterwards** — the lost key exists in
    neither the backup, the merge nor the live file (consultant, cadence round, correcting this plan's earlier claim). It
    is accepted as a window of milliseconds, opened only by an operator-run command once per release; the installer
    prints the exact keys it wrote, so the operator can see what the file should now contain;
  - its entry is identified by the hook's path, so a second run **upgrades** that entry in place and never adds a twin;
  - the hook is addressed by an absolute path passed as an `args` element, never a shell string — no quoting on Windows;
  - `--uninstall` removes exactly its own entry and its own hook file and nothing else. The timestamped backup is kept
    for forensics, never as the rollback: restoring it would also erase every unrelated change made since;
  - `--check` reports drift between the installed copy and this repository's, by bytes and by entry shape.
- **Two copies, one window of disagreement.** In connect_other_ais the hook fires twice per call (user + project).
  The two copies can differ between a release and the next install, and then they disagree exactly on a `model` value
  one version allows and the other refuses — the stricter one wins, because either refusal stops the call. The window is
  closed by `--check` in E3's done-when, and by re-running the installer as a step of every later release.

### 3.3 The layout — a new section in `common/planning-docs.md`

*A plan split into epics and stories*: the epics are a `## Epics` section at the bottom of the plan file (goal, scope,
done-when, and the cornerstone areas); each epic's stories are one document, `todo/PLAN_<topic>_E<n>.md`, with its own
status line, a link to the parent plan, and the parent linking back (the both-sides rule already in that file). The
stories document is written when its epic starts, not all at once. Both promote together. Existing files under other
names are not renamed. The checker already decides the index question: `tools/plan-lifecycle.mjs:233-236` demands a
`todo/README.md` row for every `todo/PLAN_*.md`, `_E<n>` documents included, and `:252-262` a `research/README.md`
mention for every promoted one — so the section says each stories document gets its own row. E1 keeps a fixture pair as
the check that this stays true; no change to the checker in this plan.
Who writes each part is `subagent-models.md`'s, by link, not restated.

### 3.4 The behaviour smoke

`rule-smoke.mjs` gains a behaviour mode (one launcher, one trace reader — reuse, not a second tool): the Agent tool is
offered and delegation allowed, in a disposable worktree, under a budget cap. Today's smoke is sized for a read-only
inspection, and the mode changes each limit deliberately, never by accident: `complete` requires an unchanged tree
(`rule-smoke.mjs:145`) → the mode expects exactly the fixture's files changed; output and time are capped at 256 KiB and
180 s (`:142`), spend at $3 (`:47`) and the report at 32 KiB (`:110`) → raised to measured values; the prompt asks for an
`inspect` (`:126-128`), a scope that never selects the rule → the mode resolves `--task implement`.

The fixture is a frozen task whose text fixes its own baseline — *an Opus team would be three scouts, one per area named
below; the change touches two files and about 120 lines; it must be reviewed* — and names FIVE focus areas, so the
expectation is known before launch:

- **five** Agent calls with `model: "sonnet"` (scouts), each prompt naming exactly one of the five areas and all five
  covered — distinct prompts alone would not show distinct focuses;
- **one** with `model: "sonnet"` that edits (the coder) — over the 50-line exception by construction — whose prompt
  carries the brief and the scenarios under the headings the fixture requires, so the Opus thinking demonstrably came
  BEFORE the code;
- **one** with `model: "opus"` that reviews;
- **no edit by the parent** to the fixture's files — the main session did not write the code itself;
- the models, from the evidence the host actually emits — **measured 2026-10-13: a child's own assistant events never
  appear in the parent's stream** (a child contributes one `user` event with its prompt; `system/task_started` and
  `task_notification` carry no model). So: each launch's REQUESTED model (`input.model`) is the exact per-child check;
  resolution is checked in aggregate — every family requested at least once has a `claude-<family>-*` key with nonzero
  usage in the final `result.modelUsage` (other families, such as the host's own small Haiku spend, are ignored); and
  `result.subagent_stats` shows spawned = completed = foreground = seven. An Opus child cannot be separated from an Opus
  parent in that aggregate — a stated limit of the measurement, not a check. Zero launches when seven are expected is a
  fail, never a pass;
- **zero** guard denials, counted by the deny marker (§3.2) — a denial means the rule text did not carry, which is a
  defect in the text, fixed and re-run, never a loosened check.

**Three outcomes, never two.** A trace that ends early, a spent budget, a child with no terminal event, a retried launch
or a nested child the fixture did not ask for makes the run **inconclusive** — recorded as such, never a pass.

**A negative control on the real host.** Zero denials cannot tell an obeyed rule from a guard that never ran. The same
mode has a second, tiny fixture that instructs the session to launch one Agent without a model: it passes only if the
guard's marker appears. It runs before every behaviour run, so a silent guard turns the run red, not green.

**A classification fixture for the boundaries.** The seven-child run never tests the hard lines of §3.1 item 3, so a
third, cheap fixture launches nothing: a fresh session is handed paired requests — collect a failure's logs / decide its
cause; research AND propose, unsplit; a coder's prescribed tests / an independent correctness check; a scout in a
security area / a security judgement; a one-file edit of 40 added-plus-removed lines / the same edit plus its test file;
a one-file edit of 25 replaced lines / of 26 replaced lines — and must answer a model for each before acting. Expected:
`sonnet`, `opus`, `opus`, `sonnet`, `opus`, `sonnet`, `fable`, main session OR `sonnet` (the exception permits, it does
not oblige), `sonnet`, main session OR `sonnet`, `sonnet` (risk consultation on E1, both turns). A wrong answer is a defect in the rule text.

**What costs money and what does not.** The trace grouping, the counting and the three outcomes are unit-tested on
recorded traces (the first real trace is recorded in E4, as E2 records a payload), so `npm test` guards the checker for
free. The paid run (`npm run smoke:behaviour`, a new script; not in CI) is repeated only when the rule's MEANING changes —
not for an editorial edit — and each run is recorded in `research/RESULTS_subagent_model_tiers.md`.

### 3.5 `modelSettings` by alias — on the operator's machine

Back up `~/.claude/settings.json`. **Control first**: set `low` under the exact key `claude-opus-5-5`, start a session on
`opus` and confirm the surface (`/status`, or `--debug` output) shows `low` — without that, "not observed" and "not
honoured" are one result (`common/measurement.md` §3). Then the probe: move `low` to an `"opus"` key with no exact key,
start again, read the same surface. **Restore by keys, not by file**: put back only the `modelSettings` entries the probe
touched, and refuse — showing the diff — if anything else in the file changed since the backup, because restoring the
whole backup would erase that change. If the alias key is honoured, the file moves to alias keys (`opus`, `fable`, `sonnet`) with the operator's levels; if not, or if
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
with the operator. The same PR repoints its three citations of this plan's old name (`PLAN_scout_model_calibration.md:11`,
`:389`, `:503`) to `todo/PLAN_subagent_model_tiers.md`, and — if E2's inventory says a benchmark arm must opt out of
the guard — sets `SUBAGENT_MODEL_GUARD=off` where that arm launches `claude`. Another session runs that plan's E1: the
PR touches its status text, its citations and that one launch environment, never its measurements. It is part of E2's
harness preparation and merges BEFORE E2 does — the first moment any copy of the guard is live is E2's merge (this
repository's own `.claude/`), not the user-level install (consultant, cadence round).

## 4. Test plan

- **Guard** (`tools/subagent-model-hook.test.mjs`, the `build-flags-hook.test.mjs` shape): the allow/deny matrix
  (each alias; missing, empty, `haiku`, `inherit`, `claude-opus-5-5`, `Opus` in another case, a non-string); a
  malformed envelope (no `tool_input`, garbage JSON) allowed while a well-formed call without `model` is denied; the
  reason opens with the marker, carries the table and fits 600 B; every allowed call gets the one-line digest (≤ 300 B)
  as `additionalContext` with no `permissionDecision`; with the opt-out set, an allowed alias and an otherwise-denied
  input both produce empty output; the digest names the same model per role as the rule's table (parsed from `common/subagent-models.md`);
  the opt-out; the freeze-variable warning; fail-open on a thrown error and on a stdin left open (spawned, as the
  existing test does). **Break-it:** make the hook allow everything → the deny cases go red → restore; change one role's
  model in a fixture copy of the rule → the digest test goes red → restore.
- **Installer** (`tools/install-user-hook.test.mjs`), against a temporary home: fresh install; idempotent second run
  (byte-identical settings); an upgrade replaces its entry in place, no twin; an existing unrelated `PreToolUse` entry
  and every other key preserved; an unparsable `settings.json` refused and left byte-identical; a change made between
  read and write refused; `--uninstall` leaves the file byte-identical to its pre-install state when nothing else
  changed, and keeps an unrelated change made after install; `--check` reports drift after the hook copy is altered.
- **Smoke checker** (`tools/smoke-rules.test.mjs`), on recorded traces: the seven-children pass; each inconclusive
  cause (truncated trace, spent budget, missing terminal event, retry, unasked nested child); a parent edit; a missing
  focus area; an empty child set; the negative control's marker present and absent.
- **Adapter:** `adapter-check` against a fixture consumer without the new hook → fails naming it; with it → passes.
- **Rule:** `node tools/rule-bodies.mjs` and `node tools/ownership-check.mjs` clean; a `rules.test.mjs` case pins the
  task list and that every single-read `inspect` scope measured in §2 still fits.
- **Layout:** the fixture pair through `plan-lifecycle.mjs`, as §3.3.
- **Behaviour:** §3.4, recorded.
- Always: `npm test`, `npm run check`, `node tools/plan-lifecycle.mjs`.

## 5. Risks

| Risk | Answer |
|---|---|
| The guard blocks a harness that measures models | the opt-out, set and proved through each real launcher by E2's harness preparation before any copy of the guard goes live |
| The guard hangs or crashes a tool call | the `build-flags.mjs` fail-open contract, tested by spawn |
| The Agent tool is renamed or its payload changes, and the guard goes silent | E2 records a real payload; the negative control (§3.4) runs before every behaviour run and turns it red when the marker does not appear; the matrix runs on every `npm test` |
| The installer damages the operator's settings | refuse on unparsable or concurrently changed input, atomic write, `--uninstall` that removes only its own entry (§3.2), all tested on a temporary home; the millisecond race between the last comparison and the rename is accepted as undetectable and named as such |
| A harness is refused before the user-level install — by the project copy in this repository (E2 merge) or in connect_other_ais (E4 cascade) | harness preparation is an E2 story, finished before E2 merges (§ E2) |
| A session in `inspect` launches scouts on Opus and never learns otherwise | the allowed-call context (§3.2); the residual is the first batch of launches such a session emits together |
| The user-level guard reaches a repository still on the old rule | E3 installs only after E4's cascade (§ Order) |
| A Sonnet coder needs context the brief omitted | §3.1's brief contents; the 50-line exception for the smallest edits; the Opus review catches the rest |
| The alias moves to a model that is worse at a role | accepted by D6; the behaviour smoke and the calibration (§3.7) are where it would show |
| Rolling out reddens every open PR in the family | one release for all four epics (E1, E2, E4 merge to `main` first; one promotion; one cascade) |

## 6. Noted while planning, not in scope

- The `inspect` read budget has 867 B left in the `.csproj` scope; the next rule that must ride in every scope has
  nowhere to go. Trimming the always-loaded rules, or a loader that splits one read, is its own plan.
- `.rs` and `.http` scopes are already over the single-read limit and depend on the `--only` split.
- `ui`, `gpu` and `storage` are three tasks a single shared rule away from losing their single read (§3.1, *Tasks*).
- `Workflow` `agent()` calls are invisible to the Agent-tool guard; the host's `agent.spawn` extension point could
  enforce the same verdict there — its own plan.

## 7. Definition of Done

- [ ] `common/subagent-models.md` states D1–D6 and D12 once, with the pipeline, the scout/judge test, the brief contents,
      the two definitions (50 changed lines, the cornerstone ledger), the alias rule (Workflow `agent()` included), the
      guard, Never and DoD; body recorded; ownership clean.
- [ ] `common/planning-docs.md` has the epic/story layout; the fixture pair passes `plan-lifecycle.mjs`.
- [ ] The guard and its installer exist with the tests in §4; the break-it went red and back; `adapter-check` demands it;
      this repository's own `.claude/` carries it.
- [ ] The harness inventory is recorded, with each variable's route (WSL included); each harness that needs the opt-out
      sets it, proved through its real launcher, all before E2 merges.
- [ ] Every allowed Agent call receives the one-line role digest as context without being approved, observed in
      a real session; the digest matches the rule's table by test.
- [ ] The guard is installed in `~/.claude` on this machine, `--check` is clean, and in a plain session in another
      repository an Agent call without a model is refused while one with `model: "sonnet"` goes through.
- [ ] The negative control showed the marker; then the behaviour smoke showed five Sonnet scouts covering the five areas,
      one Sonnet coder carrying the brief and scenarios, one Opus reviewer, no parent edit, seven launches with the
      requested models, every requested family present in `modelUsage`, `subagent_stats` at seven, and zero denials — recorded, as is any inconclusive run, in `research/RESULTS_subagent_model_tiers.md`
      (with its `research/README.md` row).
- [ ] The `modelSettings` probe ran after its control; its outcome is applied or recorded.
- [ ] One release; every consumer's pin bumped and green; connect_other_ais carries the hook copy.
- [ ] The benchmark plan's status line no longer claims to gate this rule, its citations name this file, and any arm
      that measures models sets the opt-out — merged before E2 merges.
- [ ] The assistant's memory note on subagent models is rewritten to D1–D12.
- [ ] This plan and its stories documents promoted to `research/` with their deviations; `todo/README.md` updated.

## Epics

Four epics; cornerstone quota ⌈2·4/5⌉ = 2 (D4). Stories live in `todo/PLAN_subagent_model_tiers_E<n>.md`, one
document per epic, written by Opus when the epic starts (§3.3). Fable named the areas below; the question consultant's
answer (D5) is recorded in the line under this paragraph before the split is final.

*Consultant (D5), 2026-10-13, one row answering (two earlier attempts failed: a 300 s timeout, then a path resolved
against the wrong root):* rank the guard **with** its installer first and the behaviour smoke second, the rule text
third. Its reasons were verified and are now requirements, whichever story owns them: the installer's refusal on
unparsable or concurrently changed settings, its atomic write, in-place upgrade and `--uninstall` (§3.2 — a backup is not
a rollback); the smoke's three outcomes, negative control, focus-area and parent-edit checks, and recorded-trace tests
(§3.4); the two definitions in §3.1.

**Decision (the caller, on Opus, D5):** the two areas below stand as Fable named them. The guard is in both lists. For
the second, the rule text keeps its place over the smoke: the guard cannot see a role, so a misdrawn scout/judge line is
invisible to every check except the smoke itself, which can only test the text it is given; the smoke's
false-assurance risk is answered by the requirements above rather than by a stronger model. The installer stays an
Opus-spec story, now carrying the consultant's requirements.

Cornerstones: 2 of 2 — E1.S1 (the rule text), E2.S1 (the hook contract with the host).

### E1 — The text: the rule rewritten, the layout written down

Stories: [PLAN_subagent_model_tiers_E1.md](PLAN_subagent_model_tiers_E1.md).

- **Goal.** `common/subagent-models.md` states D1–D6 and D12 once (§3.1); `common/planning-docs.md` gains the epic/story
  section (§3.3). Nothing executes yet; this is the text every other epic quotes.
- **Scope.** The two rules; `research/rule-bodies.json` (both ids re-recorded in the same commit — `tools/rules.test.mjs:147-169`
  freezes body AND headings); a `rules.test.mjs` case pinning the task list and the §2 scope sizes; a fixture pair for
  `tools/plan-lifecycle.mjs`; `research/RESULTS_subagent_model_tiers.md`, opened with the size measurements.
- **Depends on.** Nothing.
- **Done when.** `npm test`, `npm run check`, `node tools/ownership-check.mjs`, `node tools/rule-bodies.mjs` and
  `node tools/plan-lifecycle.mjs` are clean; the rule is ≤ 9 000 B and every scope single-read today stays under 32 768 B
  with the new task list, numbers in the research record; the fixture pair passes; merged to `main`.
- **Easy to get wrong.** (1) Measuring a scope with `explain --task <t>` and no `--file`: §2's tight scopes are the
  file-driven ones, so each single-read scope is measured with the files §2 used. (2) The body may not say `coai`,
  `dew_flow_*`, "the benchmark" or "the gate" (`tools/ownership-check.mjs:30,36,59`) — evidence lives in the research
  record, cited by path. (3) `tools/plan-lifecycle.mjs:233-236` demands a `todo/README.md` row for every `PLAN_*.md` in
  `todo/`, and `_E<n>.md` matches its pattern — the fixture run will say so; the new section should say it too.

### E2 — The guard: the hook, its tests, its installer, the harness inventory

Stories: [PLAN_subagent_model_tiers_E2.md](PLAN_subagent_model_tiers_E2.md).

- **Goal.** §3.2 as code in this repository: `settings/hooks/subagent-model.mjs` wired in `settings/settings.json`, copied
  onto this repository itself, demanded by `adapter-check`, with an installer that can put it into a user home.
- **Scope.** `settings/hooks/subagent-model.mjs`, `settings/settings.json`, `.claude/settings.json` +
  `.claude/hooks/subagent-model.mjs` (self-hosting — `tools/adapter-check.test.mjs:48-50` fails without them),
  `tools/subagent-model-hook.test.mjs`, `tools/install-user-hook.mjs` + test, `tools/adapter-check.test.mjs` (`whole()` at
  `:36` names the hooks; `:55` counts three findings — both change), the recorded payload and the harness inventory in
  `research/RESULTS_subagent_model_tiers.md`.
- **Depends on.** E1 merged before E2 merges: the deny reason is a ≤ 600 B digest of E1's table, and §3.1 forbids a second
  statement that can drift. The code can start in parallel.
- **Harness preparation — before this epic merges.** E2's merge is the first moment a copy of the guard is live (this
  repository's `.claude/`), and E4's cascade the second (connect_other_ais' project copy) — both before the user-level
  install. So the inventory is not a list but a change: every harness that spawns `claude` and must not be steered gets
  `SUBAGENT_MODEL_GUARD=off` in its launcher, the benchmark's included (§3.7, its own PR, merged first), and each
  exemption is proved through the ACTUAL launcher — WSL route included — by a call the guard would otherwise deny,
  observed as allowed at the hook. A launcher already running keeps its old environment: the inventory says which
  processes must be restarted, and they are.
- **Done when.** The §4 guard and installer tests pass, both break-its went red and back; `adapter-check` names the
  missing hook in a fixture consumer and reports nothing on this repository; the payloads (with and without `model`) and
  the allowed-call context are recorded from a real session; the harness preparation above is merged and proved; merged.
  `~/.claude` is E3, not here.
- **Easy to get wrong.** (1) `settings/settings.json:31` addresses a hook through `${CLAUDE_PROJECT_DIR}`; a user-level
  entry has no project, so the installer writes an absolute `~/.claude/hooks/…` path and `--check` compares hook bytes and
  entry shape, never the args verbatim. (2) A variable set on the Windows side reaches a `claude` started inside WSL only
  through `WSLENV`; the inventory records the route, not just the name. (3) The deny reason opens with a fixed marker
  (`subagent-models.md:`) — it is what E4 counts; without it "zero denials" cannot be measured.

### E3 — This machine and the boundary (nothing merges to `main` here)

- **Goal.** D8, D11 and D13 on the operator's machine, and the memory note (§7).
- **Scope.** `~/.claude/settings.json` and `~/.claude/hooks/subagent-model.mjs`, put there by the self-install (D13) on
  the first session after the cascade — observed, not run by hand; the §3.5 probe; the assistant's memory note rewritten to D1–D12. (The benchmark PR moved to E2's
  harness preparation — consultant, cadence round.)
- **Depends on.** E4's cascade complete — every consumer already pins the rewritten rule, so the user-level guard never
  refuses a session that is still reading the old text (gate round 1, accepted); E2's harness preparation is already
  merged and proved; and the scout calibration — the third measuring harness, on another session's branch — either
  carries `SUBAGENT_MODEL_GUARD=off` in its allow-list or is not running (benchmark gate round, accepted). Because the
  self-install fires at the first session after the cascade, the same condition gates E4.S4's wiring of
  `ensure-user-guard.mjs` into the release commit: it is checked, and stated in the release PR, before that commit.
- **Done when.** The self-install's one line appeared in the first session after the cascade; in a plain session in another repository an Agent call without `model` is refused with the role table
  and one with `model: "sonnet"` goes through; `node tools/install-user-hook.mjs --check` is clean; the probe's outcome
  (alias key honoured / not / not observable) is in the research record and `~/.claude/settings.json` matches it; the
  memory note is rewritten.
- **Easy to get wrong.** (1) Two edits to one file: the probe removes `claude-opus-5-5` and the installer merges an entry —
  one at a time, each with its own named backup, the probe restored before the install runs. (2) The probe needs a
  control: observe `low` from the exact-id key on the same surface first, or "not observed" and "not honoured" are one
  result (`common/measurement.md` §3).

### E4 — Prove, then ship: the behaviour smoke, one release, one cascade, the promotion

- **Goal.** §3.4 as a mode of the existing smoke, run once and recorded; then the single release, six bump PRs, and
  this plan promoted with its four stories documents.
- **Scope.** `tools/lib/rule-smoke.mjs`, `tools/lib/rule-trace.mjs`, `tools/smoke-rules.mjs` + its test, `package.json`
  (`smoke:behaviour` — no smoke script exists today), the frozen fixture task, the run in the research record; then
  `release`, the six pins — connect_other_ais' bump also copies the hook and the `PreToolUse` entry — `todo/README.md`,
  `research/README.md`, `research/module_tests.md`, and the `git mv` of this plan and `_E1`–`_E4`.
- **Depends on.** E1 and E2 merged: the smoke's worktree must carry the rewritten rule and `.claude/hooks/subagent-model.mjs`,
  or the zero-denial count counts nothing. E3 is not needed for the smoke; E3 waits for this epic's cascade, and the
  promotion waits for E3.
- **Done when.** The smoke checker's recorded-trace tests pass; the negative control showed the marker; then one recorded
  run met every expectation in §3.4 (five areas covered, the coder's brief and scenarios, no parent edit, seven children
  with the requested models, every requested family in `modelUsage`, `subagent_stats` at seven, zero denials) inside its budget cap — an inconclusive run is recorded and re-run, never
  counted; `release` moved once, to a `main` sha carrying E1, E2 and this epic's code; every consumer's `pin-check` green;
  `node tools/plan-lifecycle.mjs` clean after the promotion.
- **Easy to get wrong.** (1) The smoke is sized for a read-only inspection: `rule-smoke.mjs:145` makes `complete` require
  an UNCHANGED tree, `:142` caps output at 256 KiB and 180 s (`tools/lib/proc.mjs` kills the tree on overflow), `:47` caps
  spend at $3, `:110` caps the report at 32 KiB, and `:126-128` ask for an `inspect` of hypothetical files — a scope that
  never selects the rule (§2). Behaviour mode expects exactly the fixture's files changed, raises the four caps
  deliberately, and routes the prompt through `--task implement`. (2) `rule-trace.mjs:65-69` remembers `Bash` blocks
  only; Agent blocks (`input.model`, `input.prompt`) and `parent_tool_use_id` grouping are new — record one real trace
  first, as E2 records a payload, and assert the COUNT of children with a model (7), or the family check passes on an
  empty set. (3) The cascade: `promote-release` wants the 40-character sha and a `reason` (README § *Editing discipline*,
  the *How `release` moves* bullet); the pinned-by repository goes last (same section, the rag_qln bullet);
  `plan-lifecycle.mjs:252-262` wants a `research/README.md` mention for every promoted file — five plan rows, not one.

### Order, and why

E1 → E2 → E4's smoke → E4's release → E4's cascade → E3 (the user-level install and the probe) →
E4's promotion.

- E1 before E2 **merges**: the guard's reason quotes the table; one canonical text (§3.1), so the digest follows the text.
- **E1 and E2 reach `main` in ONE pull request** (E1 code round, accepted): the rule says a guard refuses a model-less
  launch, so `main` must never carry the rule without the guard. E1 is gated and committed on its own branch; E2's branch
  is built on it, and the pull request is E2's branch.
- E2 before E4: the smoke's zero-denial count needs the guard live in the worktree's `.claude/hooks/`; the smoke runs on
  the project-level hook and never needs `~/.claude`.
- E3 after the cascade (gate round 1): the user-level guard reaches every repository on the machine at once, so it goes
  in only when every consumer already carries the rule it enforces.
- Harness preparation (the benchmark PR included) inside E2, before E2 merges: E2's merge is the first live copy of the
  guard, not E3 (consultant, cadence round).
- **One release, after E1, E2 and the smoke are on `main`** (§5, last row — kept): a release is six bump pull requests
  (README § *Editing discipline*), so one per epic would be eighteen; a consumer holding the rule without the guard is
  exactly the state D8 rejects; and a release before the smoke publishes a text nothing has yet shown to carry.

### Cornerstone areas — two (⌈2·4/5⌉), named here, marked `model: fable` by Opus when the epic is split

1. **E1 — the canonical statement:** the role table with the 50-line exception, the scout/judge test and the brief
   contents (§3.1 items 1, 3, 5). Fourteen of the eighteen tasks, in six repositories, load it; the guard checks the
   alias, not the role, so a misdrawn scout/judge line is invisible to every check, and §3.4 makes the text the only thing a
   denial may change. A fix is a body re-record, a release, six bump PRs and a paid smoke run.
2. **E2 — the hook's contract with the host:** the payload shape recorded from a real session, the verdict matrix, the
   three fail-open paths, the opt-out, the warning channel, the deny marker and the allowed-call context that must teach
   without approving. Once E3 installs it, it runs before every
   Agent call in every `claude` process on this machine; a wrong field name makes it silent for good, and only the
   negative control (§3.4) tells silent from obeyed — and only if the marker and the payload shape are right. The installer is not in this area; it is an Opus-spec story under the requirements in §3.2.

**Security:** none of the four epics touches authentication, authorisation or cryptography. The installer edits the file
that holds the operator's permissions, but merges one hook entry and preserves the rest (§4) — reviewed, not security work.

