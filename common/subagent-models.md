---
id: "common.subagent-models"
load: "conditional"
tasks: ["audit","plan","implement","docs","policy","test","git","pr","release","deploy","dependencies","http","benchmark","logging"]
---
# A subagent's model follows its role (MANDATORY)

> Spend the strongest model where a mistake compounds, the cheaper one where the next step catches it.
> **Sonnet gathers and writes, Opus judges, Fable holds the cornerstones** — always the newest of each,
> by alias. The evidence behind every number here:
> [RESULTS_subagent_model_tiers.md](../research/RESULTS_subagent_model_tiers.md). The guard carries a
> copy of the table below, and a test fails the moment the two name different models for a role.

## The role table

| Role | Model | What it is |
|---|---|---|
| Scout | sonnet | search, research, evidence — logs, a reproduction, what a file says, a file list. ⌈1.5·N⌉ of them where N would have run on Opus (1→2, 2→3, 3→5), each with its own focus |
| Coder | sonnet | code, fixes, review fixes, unit and integration tests |
| Small edit | main session or sonnet | one file, at most 50 changed lines, bounded BEFORE the first edit (definition below). The exception permits; it never obliges |
| Judge | opus | reviewer, architect, any design or proposal, finding verifier, test scenarios, the brief that says what to change and how, splitting an epic into stories |
| Plan → epics | fable | splitting a plan into epics and naming the cornerstone areas, after the question consultant was asked what is important |
| Security judgement | fable | cryptography, authentication, authorisation — outside any quota |
| Cornerstone spec | fable | the scenarios and brief of a cornerstone story, at most ⌈2·E/5⌉ per plan of E epics (1–2 → 1, 3–5 → 2, 6–7 → 3). Fable writes the spec, Sonnet codes, Opus reviews as for every story |

Fable has exactly the three rows above. A design, an architecture or a proposal outside them is a judge's — Opus;
between Opus and Fable, in doubt, Opus.

## The pipeline — who acts at each step

Where epics and stories live is [planning-docs.md](planning-docs.md) § *A plan split into epics and
stories*; this rule says only who acts.

1. **Plan** — the main session.
2. **Plan → epics** (`## Epics`, the plan's last section) — **Fable**. Before the split is final, the
   question consultant is asked what and where is important; Fable names the cornerstone AREAS.
3. **Epic → stories** (one document per epic, written when the epic starts) — **Opus**, which marks the
   concrete cornerstone stories `model: fable` within the quota and updates the ledger in the same commit.
4. **Per story** — scenarios + brief: **Opus** (**Fable** on a cornerstone) → code + tests: **Sonnet** →
   review: **Opus** → fixes: **Sonnet**. The small-edit exception applies to code and fixes alike.

## Scout or judge — the assigned output decides

Facts and file lists → scout. Anything that proposes, decides, verifies or reviews → judge, even
read-only. A request to research AND propose is split into two launches, or it is a judge.
**Collecting evidence** — logs, a reproduction, what a file says — is scouting; **determining the cause**,
or validating a cause someone proposed, is judging: "investigate why X fails" is a judge unless it is
split into "collect the evidence" (a scout) and "decide the cause" (the caller, or an Opus judge). A coder
running the tests its brief prescribes is still a coder; a separate agent asked whether the change is
correct is a judge. Neither the agent type nor its being read-only changes the class. A scout in a
security area stays a scout; the security judgement itself is Fable's — the caller's, or a Fable judge.
**In doubt, it is a judge.**

## Scouts

⌈1.5·N⌉ scouts, each with its own focus **written before launch** — two scouts with one brief are one
scout paid twice. The caller opens every file a scout's conclusion
rests on before building on it ([measurement.md](measurement.md) § 5).

## Coders

A Sonnet coder re-discovers nothing. Its brief carries the files, the change (what and how), the
scenarios it must make pass, and the commands to run. The coder follows [testing.md](testing.md): a bug
fix starts with the RED test, watched failing for the right reason.

## Two definitions

**50 changed lines is an eligibility test, decided BEFORE the first edit — never a measurement after it.**
The main session may write a change itself only when it can bound the WHOLE patch in advance to one file
(a test file and a new file each count as a file) and at most 50 added-plus-removed lines against the
commit it started from; staging or committing midway does not reset the count. A replaced line counts
twice: 25 replaced lines are 50 and eligible, 26 are 52 and not. If the size is uncertain, delegate; if
the scope grows past the bound while writing, stop and hand the rest to a Sonnet coder with a brief. No
tool counts this; the conservative choice is the default. Eligible means MAY — a Sonnet coder is always
correct.

**The cornerstone ledger.** Stories documents are written one epic at a time, so the quota is tracked in
one place: the ledger line of the plan's `## Epics` section (its format is [planning-docs.md](planning-docs.md)'s),
with Q = ⌈2·E/5⌉. The stories document that marks a cornerstone updates that line in the same commit. A mark
that would make k exceed Q goes to the operator, not into the document.

## Name the model on every launch, as an alias

Every launch names its model: the Agent tool's `model` argument, and the `agent()` call of a Workflow
script, which no hook sees. Only `sonnet`, `opus` or `fable`: an alias follows the provider's
recommended version as it moves, which is the intent; a versioned id freezes what should move. Never
freeze an alias from outside either — `ANTHROPIC_DEFAULT_*_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL` and
`CLAUDE_CODE_SUBAGENT_MODEL_FORCE` stay unset.

Precedence (the host's documentation, read 2026-10-13), highest first: the call's `model` argument →
the agent definition's frontmatter → `CLAUDE_CODE_SUBAGENT_MODEL` → the session's model; `…_FORCE=1`
puts the variable on top. Built-in `Explore` and `general-purpose` inherit the session's model.

**A plugin's frontmatter is not a decision.** Measured 2026-09-12, re-checked 2026-10-13 across the 14
cached versions: the `feature-dev` plugin pins `model: sonnet` in all three of its agents
(`code-explorer`, `code-architect`, `code-reviewer`), so its architects and reviewers run on Sonnet
unless the call says `opus`. Dated on purpose: a release can change it; the argument you pass cannot.

## The guard

A `PreToolUse` hook on the Agent tool (`settings/hooks/subagent-model.mjs`, per repository and in the
operator's user settings) refuses a launch whose `model` is missing or is not exactly `sonnet`, `opus`
or `fable`; the refusal opens with `subagent-models.md:` and carries the role table. Every allowed
launch receives a one-line digest of the table as context — it teaches, it never approves. **What it
enforces:** a model is named and is an allowed alias. **What it cannot see:** whether the alias fits the
role — a facts-only scout on `opus` passes the guard and still breaks this rule. The four tasks this rule
is not selected for (`inspect`, `ui`, `gpu`, `storage` — no room in their single read, measured in the
results file above) learn the table from that digest alone, and a Workflow `agent()` call in those tasks
is covered by nothing. The hook has an opt-out for a harness that MEASURES models and must not be
steered, by a refusal or a hint; a working session never sets it.

## Fable unavailable → Opus; Haiku is not used

When Fable refuses a launch on a spend or session limit, the work continues on **Opus** and the summary
says so. **Haiku has no role** in the table and is not launched.

## Never

- Never launch without naming the model, or name it as anything but `sonnet`, `opus` or `fable`.
- Never let the main session write a change it could not bound to one file and 50 lines before starting.
- Never give one brief to two scouts, or launch a scout whose output is a decision.
- Never send a coder to work without the scenarios and the brief a judge wrote first.
- Never mark a cornerstone past the quota, or freeze an alias through an environment variable.
- Never set the guard's opt-out in a working session.

## Definition of Done

- [ ] Every launch — Agent tool and Workflow `agent()` alike — named `sonnet`, `opus` or `fable`.
- [ ] Every scout, coder and judge ran on the model its role prescribes; a cornerstone was in the ledger
      before Fable wrote its spec.
- [ ] Every edit the main session wrote itself was bounded to one file and ≤ 50 lines BEFORE it started.
- [ ] The summary names models AND counts — "5 scouts on Sonnet, 2 architects on Opus, 1 coder on
      Sonnet" — and says where Opus stood in for Fable.
