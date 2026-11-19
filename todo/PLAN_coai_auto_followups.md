# coai policy `auto` — the four follow-ups of the gate-words release

> Status: **plan only, nothing implemented yet, 2026-11-19.** Scope: `tools/smoke-rules.mjs` and `tools/lib/rule-smoke.mjs`
> (a `--task` option), one new behaviour fixture `tools/fixtures/behaviour/auto-gate.json`, `common/coai-feature-gate.md`
> (one clause, `coai-feature` v4 → v5), `common/plan-change-control.md` and `tools/lib/plan-ledger.mjs` (what opens an
> epoch when every plan round ended `not_reviewed`), their tests, `research/rule-bodies.json`, `POST_DEPLOY.md` item 3,
> `research/module_tests.md`, this plan — and, after the merge, one `release` promotion, a pin bump in each of the nine
> consumers, and the coai repository's regenerated snippet (`FEATURE_VERSION` 5).
>
> Source: [research/PLAN_coai_gate_words_for_auto.md](../research/PLAN_coai_gate_words_for_auto.md) § *Open follow-ups*,
> four findings filed there on 2026-11-19 "until a plan of their own takes them". The owner took all four on 2026-11-19
> ("да делай", to "take them in the next pass?").

## Goal

The gate-words release (`5d2d5ec`) left four things open. When this plan is done:

1. **The post-deploy smoke can show every required rule read.** `tools/smoke-rules.mjs --task <task>` runs the native
   inspect smoke for a task other than `inspect`, so a consumer whose required rules are selected for `implement` (the four
   coai rules in the coai repository) shows them read by a native agent. `POST_DEPLOY.md` item 3 says when to pass it.
2. **The behaviour harness observes the new words.** A fixture `auto-gate` asks a Claude session, with the review-gate and
   question-consultant rules loaded, what it does next when it meets `not_reviewed`, `good_enough` and `consult_first`; its
   expected answers are the rules' (`resolve`, `resolve`, `ask_consultants`). One live run is recorded with its cost.
3. **The feature rule says a blocking `good_enough` finding may be false (P7).** The `auto`-at-the-cap clause tells an AI to
   verify that finding like any other: land a true one as a new pull request and name it, reject a false one with its
   reason. Marker `coai-feature` v5.
4. **The change-control rule says what opens an epoch when no plan round was reviewed (P2).** See § *P2 — the decision*.

## The change, file by file

| File | What changes |
|---|---|
| `tools/smoke-rules.mjs` | accepts `--task <task>`; default `inspect`, so every existing call is unchanged |
| `tools/lib/rule-smoke.mjs` | `smoke({…, task})`: the task is refused unless the resolver lists it (`explain` answers its task list); passed to the preflight `explain`, to `inspectPrompt` (its `explain` and `read --only` commands) and recorded in the report as `task`. The trace parser is task-agnostic (`lib/rule-trace.mjs` reads the rule body, not the argument), so it does not change |
| `tools/fixtures/behaviour/auto-gate.json` | new: `loadOnly` `common.coai-review-gate` and `common.coai-question-consultant`; three moments; the answer words `resolve`, `ask_consultants`, `ask_human`, `review_again`, `stop_and_wait`; expected `["resolve", "resolve", "ask_consultants"]`; caps copied from `held-gate` (2 USD, 300 s), `measured: false` until the live run measures them; not in `BEHAVIOUR_ORDER` (paid, run by name only) |
| `common/coai-feature-gate.md` | marker v4 → v5; the `good_enough` bullet's `auto`-at-the-cap clause: "land it as a NEW pull request like the rest and name it in your summary" becomes "verify it as any other finding: land a true one as a NEW pull request and name it in your summary, reject a false one with its reason" |
| `common/plan-change-control.md`, `tools/lib/plan-ledger.mjs` | § *How it is counted* and the epoch line, per § *P2 — the decision* |
| `research/rule-bodies.json` | `node tools/rule-bodies.mjs --update common.coai-feature-gate common.plan-change-control` |
| `POST_DEPLOY.md` | item 3: in a consumer whose required rules are selected for a task other than `inspect`, run the smoke once per such task with `--task`; the stamp |
| `research/module_tests.md` | rows for the new tests |

The three moments of `auto-gate` (policy `auto` stated in the prompt; no coai server, no tools after loading):

1. `review_code` returned `not_reviewed`: no reviewer answered. → `resolve` (then say the stage was not reviewed).
2. The plan rounds ran out and `review_plan` returned `good_enough`. → `resolve`.
3. Your own question to `ask_human` came back `consult_first`; you have no `consultId`. → `ask_consultants`.

## P2 — the decision

Asked through the question consultants first (coai `68babd70…`, 2026-11-19, options A "never opens", B "opens as an
approval", C "opens as a counting baseline, not an approval"). Both answering rows chose **C**, and the question is settled
without the owner. Their reasons: the ledger is a brake on drift during implementation, and that brake matters more when
nobody vetted the plan; under `auto` (the default) option A would turn the brake off whenever no reviewer answers; coai
itself already separates "the stage advances" from "it passed" (`AutoVerdicts.cs`: `NotReviewed` with
`AdvanceOnResolve`). One row added a corollary that this plan takes: the re-review after a full stop may end
`not_reviewed` too, and must then be able to open the next epoch the same way, or an unattended orchestrator deadlocks.

What the rule says after this plan (`common/plan-change-control.md` § *How it is counted* and § *The full stop* step 8):

- A resolved plan round that ended `not_reviewed` advances the stage, so it starts the count: under policy `auto`, when no
  passing verdict and no owner's go-ahead came first, it opens epoch 1 with the approver **`nobody`** —
  `> Epoch 1 · approved 2026-11-19 · by nobody · state: open`. That line is a counting baseline, never an approval: the
  summary still says the plan was not reviewed, as the review-gate rule asks.
- Changes count from that line exactly as from any other; the second is a full stop.
- The re-review of a full stop may end `not_reviewed` as well; its epoch line then says `by nobody`. A narrowed re-review
  (`Narrowed: yes`) still needs the owner, `by nobody` no more than `by reviewers`: the plan stays stopped and the summary
  names it.
- A later passing round on a plan whose open epoch is `by nobody` is a re-review without a stop: it writes a
  `### Re-review for epoch k+1` record (`Narrowed: no` unless the plan got smaller) and epoch k+1 `by reviewers` (or
  `by owner`), at 0 changes; the `nobody` epoch closes. That is optional — a session may go on under the baseline.

The checker: `APPROVERS` gains `nobody` (additive: no recorded plan changes); `checkRecords`' narrowed check refuses
`nobody` as it refuses `reviewers`; nothing else moves. The rule's example ledger and the "lists ARE the contract" note are
kept in step, and `plan-change-rule.test.mjs` pins the new sentence and its placement with a splice case.

## Markers

`coai-feature` v4 → **v5** only. The review, document and question rules do not change, so `coai-snippet` v6,
`coai-document` v4 and `coai-question` v2 stay. `plan-change-control` carries no marker. In the coai repository the bump
regenerates the snippet: `FEATURE_VERSION` 5, `ARTEFACT_VERSION` 20, `SNIPPET_BODY_SHA` recomputed, the menu title "(v20)",
and an extension release; that work belongs to the coai repository and is named here only as the consumer's bump.

## Test plan — RED first

Each test is written and seen red before the change it tests, then green after it; then the change is reverted once in a
scratch copy to see it red again (RED-GREEN-RED), and the reversion is not committed.

1. `tools/smoke-rules.test.mjs`: `inspectPrompt` with task `implement` carries `--task implement` in its `explain` and
   its `read --only` commands and no `--task inspect`; the default stays `inspect` (the existing prompt test unchanged);
   `smoke-rules.mjs --task nonsense` is refused before anything launches, naming the task list; a fake-CLI end-to-end run
   with `--task implement` records `task: "implement"` and counts the reads.
2. `tools/smoke-rules.test.mjs`: the `auto-gate` fixture validates, loads exactly its two rules, is not in
   `BEHAVIOUR_ORDER`, and `judgeBehaviour` passes a trace answering `["resolve","resolve","ask_consultants"]`, fails one
   answering `ask_human` at moment 3, and is `inconclusive` when either rule was not read.
3. A new `tools/coai-feature-rule.test.mjs` (pure, like `plan-change-rule.test.mjs`): the `good_enough` bullet names both
   outcomes — a true finding landed as a new pull request, a false one rejected with its reason — with a splice case.
4. `tools/plan-change-rule.test.mjs` and `tools/plan-ledger.test.mjs`: per § *P2*.
5. `tools/canonical-markers.test.mjs` and `tools/rule-bodies.test.mjs`: green with the new marker and records.
6. The whole suite (`npm test`) green before the pull request.

**The live run.** `node tools/smoke-rules.mjs --behaviour auto-gate` once, from a clean disposable worktree of the branch,
cost and duration recorded here. Claude only: the behaviour mode drives no other CLI (`behaviourSmoke` uses `claude`), so
Codex is named as not covered. A RED run against the v5 text (the rules before `5d2d5ec`) is attempted once with the same
fixture; if it is not red, that is recorded as it is — the fixture then shows that today's text is obeyed, not that the
change caused it — and the plan does not claim more.

## Release, and the nine bumps

As in [research/PLAN_coai_gate_words_for_auto.md](../research/PLAN_coai_gate_words_for_auto.md) § *Release, and the nine
bumps*: the three pre-checks (in-flight consumer releases, asked; open pull requests per repository against the cap of
three, the owner's agreement for a bump over it; what the release carries), then the promotion with read-back, then the
bumps in the F41 order with the coai repository's bump in parallel. Rollback is a forward release.

## Build order

1. The tests (RED), the changes (GREEN), the body records, this plan and its `todo/README.md` row — one branch.
2. The plan round on this plan; the code round over the diff; the live run; one pull request; CodeRabbit; merge.
3. The pre-checks; the promotion; the nine bumps; the coai extension release with the v20 snippet.
4. Post-deploy: `POST_DEPLOY.md` run from this repository against the coai checkout, item 3 with `--task implement` for
   both native CLIs; then this plan is promoted to `research/`, and the gate-words plan's DoD box (item 3, partly met)
   records where it was met.

## Definition of Done

- [ ] `--task` shipped, tested RED-GREEN-RED; `POST_DEPLOY.md` item 3 says when to use it.
- [ ] `auto-gate` shipped and tested; one live run recorded with its cost, and the RED attempt recorded as it came out.
- [ ] `coai-feature` v5 says a blocking `good_enough` finding is verified like any other; its rule test RED first.
- [ ] P2 written into the rule and its checker, per the decision, with tests.
- [ ] All tests green; the plan and code gates run, their verdicts recorded.
- [ ] Released, nine bumps merged, the coai snippet v20 released.
- [ ] Post-deploy item 3 shows the four coai rules read in the coai repository (both CLIs), or says exactly which did not.
