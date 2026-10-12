# PLAN — Scouts run on Sonnet, half as many again — once the measurement says so

> Status: **plan only, nothing implemented yet, 2026-10-12.** Scope: `common/subagent-scouts.md` (new),
> `common/subagent-models.md`, `research/rule-bodies.json`, `tools/rules.test.mjs`, `research/RESULTS_scout_models.md`
> (a summary record), the release promotion and the pin bump in every consumer.
>
> Blocked on: `dew_flow_benchmark · todo/PLAN_scout_model_calibration.md`, whose verdict decides which half of §4 runs.
> Related: [subagent-models.md](../common/subagent-models.md), [measurement.md](../common/measurement.md),
> [rule-ownership.md](../common/rule-ownership.md).

## 1. The goal, before any solution

**Where the rule lives today.** `common/subagent-models.md` says every subagent runs on Opus, Fable for the
architecture of something new, security, cryptography and authentication, and that the model is passed EXPLICITLY on
every call because a plugin agent's frontmatter wins over the session default. It loads for `plan, implement, audit,
policy, test, docs, pr, release` (`common/subagent-models.md:4`) — **not** for `inspect`, so it is not in the
session-start payload, and not for `benchmark`.

**What the operator wants (2026-10-12).** Scouts — subagents whose assigned output is facts and file lists — run on the
newest Sonnet, ⌈1.5·N⌉ of them where N would have run on Opus (1→2, 2→3, 3→5), in every task. Judges — reviewers,
architects, planners, implementers, finding-verifiers — stay on Opus; Fable keeps its cases. The switch happens only if
a calibration shows the Sonnet team is not worse than the Opus team by more than the operator's margin (3 points of
key-file recall, +0.5 wrong claims per 10), at every team size; time and cost are measured and reported beside it. The
measurement, its decisions D1–D6 and its pre-registered test live in the benchmark plan named above.

## 2. Measured facts this plan rests on

**The plugin's agents pin Sonnet.** In both cached versions of the feature-dev plugin, `code-explorer`, `code-architect`
and `code-reviewer` carry `model: sonnet` (line 5 of each agent file). Its workflow launches 2–3 explorers (Phase 2),
2–3 architects (Phase 4) and 3 reviewers (Phase 6). After this change the risk flips: explorers want Sonnet anyway, and
architects and reviewers must be passed `model: "opus"` or they silently run on Sonnet.

**The read budget** (`node tools/rules.mjs explain --repo . --task inspect [--file …]`, at `5a91da2`; the limit is
32 768 B per read, `tools/lib/rule-cli.mjs:112`):

| `inspect` scope | Selected bytes | Free |
|---|---|---|
| session start (no file) — what `settings/hooks/load-instructions.mjs:80-82` reads | 24 207 | 8 561 |
| `src/x.cs`, `src/x.razor` | 28 820 | 3 948 |
| `ui/a.ts` | 30 116 | 2 652 |
| `src/x.csproj` | 31 901 | **867** |
| `src/main.rs` | 40 743 | over already |
| `api/x.http` | 60 125 | over already |

- `tools/migrate-rules.test.mjs:136` and `:180` read `inspect` + one `.cs` file in ONE call and must keep passing; the
  comment at `tools/rules.test.mjs:181-186` records the time a scope went over and a real spawned session read nothing.
- Rules with `load: "always"` share a 16 KiB core limit (`tools/lib/rule-catalog.mjs:31`) with ~1.3 KB left, so a new
  every-task rule is `conditional` on all eighteen tasks, as `common/task-lifecycle.md:4` is.
- Adding `inspect` to `subagent-models.md` (4 092 B now, ~6 KB with the scout text) would put the `.cs` scope over the
  limit. **Rejected.**
- A rule body may not name a family repository or product (`tools/ownership-check.mjs:30-59`), so the rule cites its
  evidence through this repository's own `research/`, never the benchmark's path.

## 3. Design

**One canonical decision, in a rule small enough to ride in every scope.** `common/subagent-scouts.md` states the
decision and nothing else; `common/subagent-models.md` keeps the judges' side and the detail, declares
`depends: ["common.subagent-scouts"]`, and never restates the decision — two summaries of one rule drift.

The size target is **≤ 850 B for the whole file**, frontmatter included, so the tightest single-read scope measured
(`.csproj`, 867 B free) still fits. The draft below measures **634 B** as a whole file (2026-10-12), leaving ~230 B
in that scope. E1 measures the final text again; if the text cannot say what it must in 850 B, stop and bring the
numbers to the operator rather than letting one scope fall over the limit.

### 3.1 Draft — `common/subagent-scouts.md`

```markdown
---
id: "common.subagent-scouts"
load: "conditional"
tasks: ["inspect","audit","plan","implement","docs","policy","test","git","pr","release","deploy","dependencies","http","gpu","benchmark","logging","storage","ui"]
---
# Scouts run on Sonnet, half as many again (MANDATORY)

A scout is a subagent whose assigned output is facts and file lists — an explorer, Explore, a lookup. Where N would run
on Opus, launch ⌈1.5·N⌉ (1→2, 2→3, 3→5) with `model: "sonnet"`, each on its own focus written before launch. Anything
that judges, designs, plans, verifies or writes is not a scout — see subagent-models.md.
```

The final file links `subagent-models.md` from its last sentence; the draft names it as text.

### 3.2 Changes to `common/subagent-models.md`

- Frontmatter: add `"benchmark"` to `tasks`; add `depends: ["common.subagent-scouts"]`.
- Opening: *"Every subagent that decides runs on Opus"*; "exploration" leaves the Opus list.
- A section **Scout or judge — the assigned output decides**, as a table: explorer / Explore / lookup → scout; a
  reviewer, even a read-only one → judge; "verify this finding" → judge; a general-purpose agent asked to research AND
  propose → judge, or split it (a Sonnet scout gathers, the caller proposes); a scout in a security, cryptography or
  authentication area → still a scout: it gathers, and the Opus or Fable caller decides and opens the key files itself.
  *In doubt, it is a judge.*
- **How to split the extra scouts**: focus areas are written down before launch, distinct, never copies — two scouts
  with one brief are one scout paid twice.
- **Name the model on both sides**: `model: "sonnet"` for a scout even where its frontmatter already says so (a release
  can change it); `model: "opus"` for every judge — in the feature-dev workflow that means Phase 4 architects and Phase 6
  reviewers, whose frontmatter says `sonnet`. The alias resolves to the newest model; what actually ran is the child's
  `resolvedModel`, not the argument.
- **The caller reads what the scouts name**: a scout's list is a lead; a conclusion rests on a file only once the caller
  opened it (`common/measurement.md` § 5). "Nothing found" means nothing was found by that search.
- **Measured** — one dated paragraph: the conditions, the per-team-size verdicts, time and cost in one line each, and a
  link to `research/RESULTS_scout_models.md`. It says the Explore clause is measured or
  extrapolated, as the calibration found.
- **Never**: never put a judge on Sonnet because it happens to be read-only; never fan out copies of one brief to reach
  the count; never let a scout's summary stand in for the file it names; never use Fable for a scout.
- **DoD**: scouts on Sonnet at ⌈1.5·N⌉ with distinct focus areas; judges on Opus or Fable, named explicitly; the caller
  opened every file a conclusion rests on; the summary names models AND counts ("5 scouts on Sonnet, 2 architects on
  Opus").

### 3.3 If the calibration does not say "switch"

No new rule. `subagent-models.md` gets one dated sentence — *Sonnet scouts at ⌈1.5·N⌉ were measured on <date> and not
adopted* — with the link to `research/RESULTS_scout_models.md`, so the proposal is not re-made blind. The draft above
stays in this plan as the record of what was proposed.

## 4. Build order — two epics; the gate once per epic

**E0 — wait for the verdict.** Nothing here starts before the benchmark plan's RESULTS is merged.

**E1 — the rule (one PR).**

1. `research/RESULTS_scout_models.md` here: a short record of the verdict, its conditions and its limits, citing the
   benchmark's results by path; its `research/README.md` row.
2. On SWITCH: write `common/subagent-scouts.md`, measure it (≤ 850 B), edit `subagent-models.md` per §3.2. On no switch:
   §3.3 only.
3. `node tools/rule-bodies.mjs --update common.subagent-models` (and the new rule's entry, added by hand per
   `tools/rule-bodies.mjs:133`).
4. Tests in `tools/rules.test.mjs`:
   - *the scout rule is selected for every task* — a loop over `TASKS`;
   - *every single-file inspect scope that fits today still fits* — no file, `.cs`, `.razor`, `.ts`, `.csproj` each
     ≤ 32 768 B, so the next rule that breaks a scope fails by name instead of inside the migration test;
   - **break-it**: pad the scout rule by 1 KB in a fixture catalog and watch the `.csproj` case go red; restore.
5. `npm test`, `npm run check`, `node tools/rule-bodies.mjs`, `node tools/ownership-check.mjs`,
   `node tools/plan-lifecycle.mjs` — all green; then one real `smoke-rules` run on a `.cs` scope showing
   `allSourcesRead: true` with `common.subagent-scouts` selected.

**E2 — rollout.** PR → CI green → automatic review comments read and acted on → merge →
`promote-release` dispatched against `main` with the merged sha → the pin bumped in every consumer in the README's
order, the one whose own pins depend on the others LAST, each consumer's `pin-check` green → in one consumer, the
session-start hook's output shows `common.subagent-scouts`. Then promote this plan with its deviations.

Outside the repository, the same day: the assistant's own memory note about subagent models is rewritten to match
(it currently says Sonnet is never intended for investigation work).

## 5. Test plan

The four checks in E1 step 4, the full `npm test`, and the real smoke run in step 5. No test asserts on this rule's text
today (`smoke-rules.test.mjs` uses invented rules); the body-hash freeze in `tools/rules.test.mjs:147-170` moves only
through `rule-bodies.mjs --update`.

## 6. Noted while planning, not in scope

- The session-start payload is 24 KB of 32 and the `.csproj` scope has 867 B left: the next shared rule that must ride
  in every scope has nowhere to go. A separate decision — trimming the always-loaded rules, or a loader that splits one
  read into several — belongs to its own plan.
- `.rs` and `.http` scopes are already over the single-read limit and depend on the `--only` split; nothing tests that a
  session actually performs it.

## 7. Definition of Done

- [ ] The benchmark's verdict is merged, and this plan followed the half of §4 it chose.
- [ ] On SWITCH: `common/subagent-scouts.md` ≤ 850 B, the only statement of the decision; `subagent-models.md` depends
      on it, carries the scout/judge table, the split rule, the explicit-model rule for both sides, the measured
      paragraph, Never and DoD.
- [ ] `research/RESULTS_scout_models.md` and its README row exist in either case.
- [ ] The new tests exist, the break-it went red and back, and every check in E1 step 5 is green.
- [ ] Released, every consumer's pin bumped and green, the session-start hook verified in one consumer.
- [ ] This plan promoted to `research/` with its deviations; `todo/README.md` updated.
