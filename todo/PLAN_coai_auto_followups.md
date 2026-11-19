# coai policy `auto` — the four follow-ups of the gate-words release

> Status: **approved 2026-11-19 (plan round `proceed`, coai session `3f86ba81`); implementation in progress on
> `docs/coai-auto-followups`.** Scope: `tools/smoke-rules.mjs` and `tools/lib/rule-smoke.mjs` (`--task` and `--only`),
> one new behaviour fixture `tools/fixtures/behaviour/auto-gate.json`, `common/coai-feature-gate.md` (one clause,
> `coai-feature` v4 → v5), `common/plan-change-control.md` and `tools/lib/plan-ledger.mjs` (what opens an epoch when a
> plan round ended `not_reviewed`), their tests, `research/rule-bodies.json`, `POST_DEPLOY.md` item 3,
> `research/module_tests.md`, this plan and its `todo/README.md` row — and, after the merge, one `release` promotion, a
> pin bump in each of the nine consumers, and the coai repository's regenerated snippet (`FEATURE_VERSION` 5).
>
> Source: [research/PLAN_coai_gate_words_for_auto.md](../research/PLAN_coai_gate_words_for_auto.md) § *Open follow-ups*,
> four findings filed there on 2026-11-19 "until a plan of their own takes them". The owner took all four on 2026-11-19
> ("да делай", to "take them in the next pass?"). The coai side of the change (the snippet v20 bump and its extension
> release) is named in the coai repository's bump pull request and its `src_vs_code/CHANGELOG.md` section, as
> [common/planning-docs.md](../common/planning-docs.md) § *Across repositories* asks; that repository carries no plan of
> its own for a pin bump, as for the gate-words release.

## Plan changes

> Epoch 1 · approved 2026-11-19 · by reviewers · state: open

- 1.1 · 2026-11-19 · reviewer · scope — behaviour runs load no MCP server (`--strict-mcp-config`); the auto-gate RED attempt answered from the coai server's own instructions

  Before 1.1, no entries. Plan round 1 (`3f86ba81`) answered `proceed` with four findings, all accepted in that round, before the
  approval: `npm run check` beside `npm test`; the P2 ledger cases named; the plan round before the code (the build
  order below); both native CLIs smoked against the candidate before the promotion. The Opus judge's findings of the same
  day are folded in the commit that records the approval; each is a repaired accuracy or a fix that only satisfies the
  plan as written: `--only` (without it Goal 1 cannot be met — the coai repository selects 33 rules for `implement`, one
  of 32,126 B, beyond what a Claude trace keeps of one output); a fourth `auto-gate` moment (the source finding asks
  that the AI "comes back with the `consultId`"); the P2 sentences that called an epoch an approval, listed below; and
  the optional re-baseline by a later passing round, dropped because no such round exists once the plan stage has
  advanced (`review_plan` takes no `again` after `proceed`, the rule's own § *Reviewing the revised plan*), so the
  sentence was false.

## Goal

The gate-words release (`5d2d5ec`) left four things open. When this plan is done:

1. **The post-deploy smoke can show every required rule read.** `tools/smoke-rules.mjs --task <task> [--only <id>]…`
   runs the native inspect smoke for a task other than `inspect`, restricted to the named rule ids, so a consumer whose
   required rules are selected for `implement` (the four coai gate rules in the coai repository) shows each of them read
   by a native agent: the report's `reads[].complete` is true for every named id. `POST_DEPLOY.md` item 3 says when to
   pass them.
2. **The behaviour harness observes the new words.** A fixture `auto-gate` asks a Claude session, with the review-gate and
   question-consultant rules loaded, what it does next at four moments under policy `auto`; its expected answers are the
   rules' (`resolve`, `resolve`, `ask_consultants`, `ask_human`). One live run is recorded with its cost.
3. **The feature rule says a blocking `good_enough` finding may be false (P7).** The `auto`-at-the-cap clause tells an AI to
   verify that finding like any other: land a true one as a new pull request and name it, reject a false one with its
   reason. Marker `coai-feature` v5.
4. **The change-control rule says what opens an epoch when no plan round was reviewed (P2).** See § *P2 — the decision*.

## The change, file by file

| File | What changes |
|---|---|
| `tools/smoke-rules.mjs` | accepts `--task <task>` (default `inspect`, so every existing call is unchanged) and `--only <id>`, repeatable |
| `tools/lib/rule-smoke.mjs` (also, by entry 1.1: `behaviourCliArgs` passes `--strict-mcp-config`) | `smoke({…, task, only})`: the task goes to the preflight `explain` (the resolver refuses an unknown task there, naming its task list, before anything launches), to `inspectPrompt` (its `explain` and `read --only` commands) and into the report as `task`. With `only`, the expected rules are those ids alone, an id the manifest did not select is refused before launch, the prompt reads exactly those ids, and the report records `only`. The trace parser is task-agnostic (`lib/rule-trace.mjs` checks the resolver, the `read` verb and `--repo`), so it does not change |
| `tools/fixtures/behaviour/auto-gate.json` | new: `loadOnly` `common.coai-review-gate` and `common.coai-question-consultant`; four moments; the answer words `resolve`, `ask_consultants`, `ask_human`, `review_again`, `stop_and_wait`; expected `["resolve", "resolve", "ask_consultants", "ask_human"]`; caps copied from `held-gate` (2 USD, 300 s), `measured: false` until the live run measures them; not in `BEHAVIOUR_ORDER` (paid, run by name only) |
| `common/coai-feature-gate.md` | marker v4 → v5; the `good_enough` bullet's `auto`-at-the-cap clause: "land it as a NEW pull request like the rest and name it in your summary" becomes "verify it as any other finding: land a true one as a NEW pull request and name it in your summary, reject a false one with its reason" |
| `common/plan-change-control.md` | § *How it is counted*: a new bullet (below); § *The ledger*: the line shape names `nobody`; § *The full stop* step 8: a re-review whose round ended `not_reviewed`; § *The check*: "reviewers approved a narrowed epoch" becomes "a narrowed epoch is approved by anyone but the owner". The lead sentence and § *Never* stay: the new bullet says a `by nobody` epoch stands where the rule says "approval" |
| `tools/lib/plan-ledger.mjs` | `APPROVERS` gains `nobody`; the narrowed check refuses every approver but `owner`; the missing-epoch hint is built from `APPROVERS` |
| `research/rule-bodies.json` | `node tools/rule-bodies.mjs --update common.coai-feature-gate common.plan-change-control` |
| `POST_DEPLOY.md` | item 3: in a consumer whose required rules are selected for a task other than `inspect`, run the smoke once per such task with `--task` and `--only` (the coai repository: `--task implement` and the four gate rules); the "Last verified" stamp |
| `research/module_tests.md` | rows for the new tests |

The four moments of `auto-gate` (policy `auto` stated in the prompt; no coai server, no tools after loading):

1. `review_code` returned `not_reviewed`: no reviewer answered. → `resolve` (then say the stage was not reviewed).
2. The plan rounds ran out and `review_plan` returned `good_enough`. → `resolve`.
3. Your own question to `ask_human` came back `consult_first`; you have no `consultId`. → `ask_consultants`.
4. `ask_consultants` answered, the answers did not settle the question, and you hold its `consultId`. → `ask_human`.

## P2 — the decision

Asked through the question consultants first (coai `68babd70…`, 2026-11-19, options A "never opens", B "opens as an
approval", C "opens as a counting baseline, not an approval"). Both answering rows chose **C**, and the question is settled
without the owner. Their reasons: the ledger is a brake on drift during implementation, and that brake matters more when
nobody vetted the plan; under `auto` (the default) option A would turn the brake off whenever no reviewer answers; coai
itself already separates "the stage advances" from "it passed" (`AutoVerdicts.cs`: `NotReviewed` with
`AdvanceOnResolve`). One row added a corollary that this plan takes: the re-review after a full stop may end
`not_reviewed` too, and must then be able to open the next epoch the same way, or an unattended orchestrator deadlocks.

What the rule says after this plan:

- A resolved plan round that ended `not_reviewed` under policy `auto` advances the stage without passing; when no approval
  came first, it opens epoch 1 **`by nobody`** — `> Epoch 1 · approved 2026-11-19 · by nobody · state: open`. A `by nobody`
  epoch is opened, not approved, yet it stands where the rule says "approval": the ONE change and the full stop count
  from it as from any epoch, and the summary still says the plan was not reviewed, as the review-gate rule asks.
- The re-review of a full stop may end its plan round `not_reviewed`; the whole plan was still reviewed again by the stop's
  steps 3–7 (the consultation, the whole revision, the Opus judge), so epoch k+1 opens `by nobody`. A narrowed re-review
  (`Narrowed: yes`) still needs the owner, `by nobody` no more than `by reviewers`: the plan stays stopped and the summary
  names it.
- `nobody` is consumer-visible: `plan-lifecycle.mjs` runs in each consumer's CI from the mounted rules, so a consumer may
  write `by nobody` only after its pin bump.

## Markers

`coai-feature` v4 → **v5** only. The review, document and question rules do not change, so `coai-snippet` v6,
`coai-document` v4 and `coai-question` v2 stay. `plan-change-control` carries no marker. `canonical-markers.test.mjs`
leaves the version free, so the forcing test for v5 is this repository's `coai-feature-rule.test.mjs` and, in the coai
repository, its snippet-version test. There the bump regenerates the snippet: `FEATURE_VERSION` 5, `ARTEFACT_VERSION`
20, `SNIPPET_BODY_SHA` recomputed (it hashes the whole snippet, the feature half included), the menu title "(v20)", and an
extension release.

## Test plan — RED first

Each test is written and seen red before the change it tests, then green after it; then the change is reverted once in
place to see it red again (RED-GREEN-RED), and the reversion is not kept.

1. `tools/smoke-rules.test.mjs`, `--task`: `inspectPrompt` with task `implement` carries `--task implement` in its
   `explain` and its `read --only` commands and no `--task inspect`; the default stays `inspect` (the existing prompt test
   unchanged); an unknown task is refused before launch with the resolver's task-list message reaching the caller (today
   the CLI refuses `--task` itself as an unknown option, so the assertion is on the task-list message); a fake-CLI
   end-to-end run with `--task implement` records `task: "implement"` and counts the reads.
2. `tools/smoke-rules.test.mjs`, `--only`: the prompt names only those ids; an id the manifest did not select is refused
   before launch, naming the selected ones; the fake end-to-end run with `--only` verifies just those ids.
3. `tools/smoke-rules.test.mjs`, `auto-gate`: the fixture validates, loads exactly its two rules, is not in
   `BEHAVIOUR_ORDER`; `judgeBehaviour` passes a trace answering the four expected words, fails one answering `ask_human`
   at moment 3, and is `inconclusive` when either rule was not read.
4. A new `tools/coai-feature-rule.test.mjs` (pure, like `plan-change-rule.test.mjs`): the `good_enough` bullet names both
   outcomes — a true finding landed as a new pull request, a false one rejected with its reason — with a splice case, and
   the marker is v5.
5. P2, in `tools/plan-ledger.test.mjs`: the `APPROVERS` pin is `["reviewers", "owner", "nobody"]`; an epoch 1
   `by nobody` with one entry is clean (today "unreadable epoch line"); a second change, stopped or not, gives exactly the
   findings its `by reviewers` twin gives; a re-review `by nobody` after a stop is clean; `Narrowed: yes` with `by nobody`
   gives "epoch 2 is narrowed (Narrowed: yes) and approved by nobody … a smaller plan needs the owner" (today red only as an
   unreadable line); the missing-epoch hint names `reviewers|owner|nobody`. In `tools/plan-change-rule.test.mjs`: the
   new sentence ("it opens epoch 1 `by nobody`: a counting baseline, never an approval") is pinned to § *How it is
   counted* with its splice case, and "the rule names every word the check accepts" goes red on `nobody` until § *The
   ledger* names it.
6. `tools/canonical-markers.test.mjs` and `tools/rule-bodies.test.mjs`: green with the new marker and records.
7. The whole suite: `npm test` and `npm run check`, in WSL (this machine), before the pull request.

**The live run.** `node tools/smoke-rules.mjs --behaviour auto-gate` once, from a clean disposable worktree of the branch,
cost and duration recorded here. Claude only: the behaviour mode drives no other CLI (`behaviourSmoke` uses `claude`), so
Codex is named as not covered — narrower than the source finding's "a live run per native CLI". A RED run against the
text before the gate words (`25d551b^`: `coai-snippet` v5, `coai-question` v1) is attempted once with the same fixture;
moment 2 was right under the old text too and cannot go red; if the others are not red either, that is recorded as it
is — the fixture then shows that today's text is obeyed, not that the change caused it.

**The runs, 2026-11-19** (Claude, model family opus, from a clean worktree of the branch at `7d421d5`):

| Run | Rules | Outcome | Cost |
|---|---|---|---|
| live 1 | both read completely | `fail` — "0 answer(s), 4 expected": the reply held two JSON arrays, the first with a slip at moment 2 and then "Correction — …" with the expected four; the judge reads one array, so it read none | 0.94 USD |
| live 2 | both read completely | `pass` — `["resolve","resolve","ask_consultants","ask_human"]` | 0.93 USD |
| RED attempt, `25d551b^` (`coai-snippet` v5, `coai-question` v1) | both read completely | `pass` — the same four answers; **not red** | 0.32 USD |
| live 3, at `3a10914` (the loading sentence made plural, after the code judge) | both read completely | `pass` — the expected four | 0.33 USD |

The RED attempt is not red, and the session said why: "The `common.coai-review-gate` rule I loaded names only `proceed`
as the verdict that moves the stage forward … My answers to 1 and 2 come from two other sources … The coai server's own
instructions say that under `auto` those two verdicts advance the stage". The behaviour session inherits the operator's
MCP configuration, so the coai server's own instructions reach it beside the loaded rule; the fixture cannot tell the
rule's words from the server's. So `auto-gate` shows that an agent with today's rules and today's server answers right,
not that the rules alone make it answer right. Filed as an open follow-up below (*Open follow-ups*).

## Taken in by entry 1.1 (code round 2, `3f86ba81`)

Filed here first as an open follow-up; code round 2 raised it as a gating finding ("a later rule regression can also
produce a passing result"), accepted, so it is this plan's one change after approval (ledger 1.1).

- **The behaviour harness did not isolate the MCP server instructions.** `behaviourCliArgs` passes no
  `--strict-mcp-config`/empty MCP config, so a `claude -p` run carries the operator's servers (coai among them) and their
  instructions; a fixture about a server's words cannot then go red on the rule alone. Fix: run behaviour sessions with no
  MCP servers (`--strict-mcp-config` and an empty `--mcp-config`), RED first with the `auto-gate` RED attempt above, and
  re-run `held-gate` and `auto-gate` with their costs. Done: `behaviourCliArgs` passes `--strict-mcp-config` and no
  `--mcp-config` for every fixture, its test red before the flag; the runs below.

## Release, and the nine bumps

As in [research/PLAN_coai_gate_words_for_auto.md](../research/PLAN_coai_gate_words_for_auto.md) § *Release, and the nine
bumps*: the three pre-checks (in-flight consumer releases, asked; open pull requests per repository against the cap of
three, the owner's agreement for a bump over it; what the release carries), then the promotion with read-back, then the
bumps in the F41 order with the coai repository's bump in parallel. **Before the promotion**, the candidate is smoked in
the coai repository: a disposable coai worktree whose `.agents/conventions` points at the merge sha, item 3 with
`--task implement` and the four `--only` ids, for both native CLIs. A failure there stops the promotion; one found only
after it is fixed by a forward release and re-verified. Rollback is a forward release.

## Build order

1. The plan round on this plan, resolved (done: `proceed`); the Opus judge's findings folded.
2. The tests (RED), the changes (GREEN), the body records, this plan's `todo/README.md` row — one branch.
3. The code round over the diff; the live run; one pull request; CodeRabbit; merge.
4. The pre-checks; the candidate smoke; the promotion; the nine bumps; the coai extension release with the v20 snippet.
5. Post-deploy: `POST_DEPLOY.md` run from this repository against the coai checkout; then this plan is promoted to
   `research/`, and the gate-words plan's DoD box (item 3, partly met) records where it was met.

## Definition of Done

- [ ] This plan's `## Plan changes` opened at its approval; its `todo/README.md` row.
- [ ] `--task` and `--only` shipped, tested RED-GREEN-RED; `POST_DEPLOY.md` item 3 says when to use them; its stamp.
- [ ] `auto-gate` shipped and tested; one live run recorded with its cost, and the RED attempt recorded as it came out.
- [ ] `coai-feature` v5 says a blocking `good_enough` finding is verified like any other; its rule test RED first.
- [ ] P2 written into the rule and its checker, with the tests of test plan 5.
- [ ] `npm test` and `npm run check` green; the plan and code gates run, their verdicts recorded.
- [ ] The candidate smoke passed; released; nine bumps merged; the coai snippet v20 released.
- [ ] Post-deploy item 3 shows the four coai gate rules read (`reads[].complete`) in the coai repository with both
      native CLIs. A CLI that does not is a red item, fixed forward, not recorded as met.
- [ ] This plan promoted to `research/`, and the gate-words plan's partly-met DoD box points at the run that met it.
