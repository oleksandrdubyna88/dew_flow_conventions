# PLAN — the four coai gate rules say what a server running policy `auto` does

> Status: **plan only, nothing implemented yet, 2026-11-18.** Scope: `common/coai-review-gate.md`, `common/coai-document-gate.md`, `common/coai-feature-gate.md`, `common/coai-question-consultant.md`, their records in `research/rule-bodies.json`, this plan, and — after the merge — one `release` promotion and a pin bump in each of the nine consumers. No tool changes. The rule text is drafted on branch `docs/coai-gate-words-for-auto` (from `origin/main` `4ab5207`) and is not merged.
>
> Source (a cross-repository citation is a path, so it is carried over here rather than linked): `dew_flow_connect_other_ais · todo/PLAN_auto_never_asks_a_person.md` § *E3* and its stories document `todo/PLAN_auto_never_asks_a_person_E3.md` (§ 4 is this plan's text, § 5 its release and pins). The change is named in both repositories' plans, as [common/planning-docs.md](../common/planning-docs.md) § *Across repositories* asks. The change ledger below opened at this plan's first approval: the plan round's first passing verdict, `proceed` (coai session `d9977293`, 2026-11-18).

## Plan changes

> Epoch 1 · approved 2026-11-18 · by reviewers · state: open

  No entries. Finding 2 of the approving round (the promotion waits for a release in flight) was accepted in that round, before the approval. The judge's findings of the same day are folded into this plan and its rule text in the commit that records the approval; each is wording, a repaired accuracy, or a fix that only satisfies the plan as written ([common/plan-change-control.md](../common/plan-change-control.md) § *What counts as a change*, "not a change"). The one added sentence, in the feature rule, exists because that file would otherwise contradict itself under `auto`.

## Goal

The coai review server has a default policy, `auto`, under which the review gate never asks a person: a round nobody
answered ends `not_reviewed`, spent rounds end `good_enough`, no hold is raised, and an AI's own question to
`ask_human` is answered `consult_first` until it has been put to the consultants. Four shared rules still promise a person
that `auto` never calls, or know only the verdicts of the older policy. When this plan is done, the shared gate text is true
under `auto`: an AI that meets `not_reviewed` says in its summary that the stage was not reviewed and why, resolves, and goes
on; an AI that meets `consult_first` asks the consultants and comes back with the `consultId`. No sentence promises more than
the released server does (coai-mcp 0.66.0), and every sentence about `auto` is conditional on `auto`, so it stays true beside
an older server.

The cut: this plan is the rule text and its delivery. It changes no code in this repository; the coai bump's constant and test changes belong to the coai plan's E3.S2.

## The change, file by file

The wording is fixed in the source's § 4.1–4.4 and is carried by the branch's diff; this table says where and what.

| File | Marker | Where | What changes |
|---|---|---|---|
| `common/coai-review-gate.md` | `coai-snippet` v5 → **v6** | the order sentence before step 1 (`:42-43`) | `review_code` REFUSES until a plan round reached a verdict that advances the stage (`proceed`, `continue_anyway`, `good_enough` or `not_reviewed`) and was resolved |
| | | step 4 (`:61-62`) | `continue_anyway`, `good_enough`, `not_reviewed` advance the stage too; step 6 says what each asks |
| | | step 6 (`:84-88`) | `not_reviewed` (resolve, say the stage was NOT reviewed and why, go on); `good_enough` and `continue_anyway`; `call_human` only under a policy other than `auto` (`human`, and a spent `escalate` ladder, when the rounds run out; any other value when nobody answered or a feature review reached its cap), and a server too old to know `auto` still asks |
| | | step 6, a new paragraph after `:96` | under `auto` `ask_human` never waits and writes no card; a hold the person owns is answered `no_answer_yet` at once; any other hold from an older build is released by the next call that reads it (`ask_human`'s reply says nothing about a release that went through, and answers `no_answer_yet` with the reason for one it could not write yet), then one `resolve` |
| | | a new paragraph before `:108` ("Report the verdicts") | an AI's OWN question to `ask_human` is answered `consult_first` under `auto` without an accepted `consultId`, unless no consultant can be had or it is a production risk |
| `common/coai-document-gate.md` | `coai-document` v3 → **v4** | the "applies here unchanged" sentence (`:39-40`), step 4 (`:59-64`), the DoD (`:86-87`) | `not_reviewed` joins `call_human` there; step 4 gains the `not_reviewed` arm (resolve with the same `document`; the summary says the document was NOT reviewed) and marks `call_human` "never under policy `auto`"; the DoD line gains it |
| `common/coai-feature-gate.md` | `coai-feature` v3 → **v4** | the verdicts paragraph (`:50-52`), the `good_enough` bullet (`:57-61`), a new `not_reviewed` bullet after `:61`, the person's request (`:68-71`), the `call_human` bullet (`:72-74`), the "unchanged" sentence (`:80-82`), the DoD (`:93-94`) | under `auto` only two grounds remain for a second round; `good_enough` at the cap can carry a `blocking` finding the second round did not clear, landed as a NEW pull request and named in the summary; `not_reviewed` is the closing round nobody answered, resolved with `feature`, never a pass; the person's request is answered at once that no second round runs; `call_human` stops the release under any policy but `auto`, which ends `good_enough` or `not_reviewed` |
| `common/coai-question-consultant.md` | `coai-question` v1 → **v2** | the floor paragraph (`:20-23`), step 6 (`:53-56`), "What it does not change" (the bullets at `:60-62`, `:63-65`, `:66-68`), the DoD (`:94-96`) | under `auto` the floor rises to the rule's bar: `consult_first` in every phase; the gate's own question writes no card (`no_answer_yet`); a production risk keeps its own path, spelled out by phase; a workflow step's questions get `consult_first` too, then one consultation for the batch |

`coai-caller` (v2) and `coai-consultant` (v4) are unchanged. Not touched, with the reason: the document gate's and the
caller rule's "it is separate because the gate rule is frozen" blockquotes — false since 2026-09-15 (`747887d`,
`rule-bodies.json` with `--update`) and owned by [PLAN_product_manuals_go_home.md](PLAN_product_manuals_go_home.md) step 4
(see its boundary section); `common/plan-change-control.md`'s "approval is the first passing plan-round verdict" line, true
as written, which leaves open what opens a plan's epoch 1 when every plan round says `not_reviewed` (a finding for the
parent coai plan, not this one).

## A boundary with PLAN_product_manuals_go_home.md

[PLAN_product_manuals_go_home.md](PLAN_product_manuals_go_home.md) has `common/coai-review-gate.md` and
`common/coai-document-gate.md` in its scope, so the two plans meet on those files. This section is the same table that plan
carries, seen from this side: a boundary, not a change to either plan's scope.

| Item | Built by | The other plan's part |
|---|---|---|
| The verdict and status words for `auto` (`not_reviewed`, `consult_first`) in the four coai rules | this plan (E3 of the coai plan) | for `coai-review-gate.md` and `coai-document-gate.md`, the two that plan names: when it runs, moves them with the rest of the protocol. The feature and question rules are outside that plan. |
| Merging `coai-caller-model.md` and `coai-document-gate.md` back (which removes the blockquotes), and their "frozen" blockquotes | PLAN_product_manuals_go_home.md, step 4 | none — this plan leaves both blockquotes as they are |

Order: this plan first (it edits in place); the manuals plan later moves whatever is there. Disjoint otherwise.

## Markers

The gate half's marker may move: the migration map that once froze it is read by one provenance test that never compares a
live body, and what a body is checked against is `research/rule-bodies.json`. `tools/canonical-markers.test.mjs` pins only
that each half's marker is `v\d+`. After this plan: v6, v4, v4, v2. A repository whose pasted copy or mounted rule is still at
`coai-snippet v5` (or the other halves' old numbers) is reported `older` by a coai extension whose artefact version is v19 (the menu title) — until that
repository's pin bump lands. That is the panel saying the truth during the cascade, not a defect.

## Test plan — RED first

1. After the four edits, before recording them: `node tools/rule-bodies.mjs` exits 1 and names exactly the four ids.
2. `node tools/rule-bodies.mjs --update common.coai-review-gate common.coai-document-gate common.coai-feature-gate common.coai-question-consultant`;
   verify mode exits 0 and `node --test tools/rules.test.mjs` passes. Break it: revert one marker without `--update`;
   verify mode names that id alone.
3. `node --test tools/canonical-markers.test.mjs`.
4. `node tools/ownership-check.mjs` exit 0; a grep of the added lines for `\b(the|its|our)\s+(gate|panel|extension)\b` finds nothing.
5. `node tools/plan-lifecycle.mjs` clean.
6. `npm test` and `npm run check` (what `ci.yml`'s selftest runs).
7. `node tools/rules.mjs read --repo . --task implement --only <id>` shows each new body between BEGIN and END.
8. **A dry run of the consumer's build before this branch merges.** In a throwaway local branch of the coai checkout (never
   pushed), the new snippet test is written and goes RED at the old pin; the pin is moved to this branch's head; the
   extension's compile (`prepare-gate`) and snippet tests run. Expected: `prepare-gate` green, the new test green, red only
   where a test compares a constant with a marker; a red in a phrase or content assertion is a defect in this text, fixed
   here before the merge.
9. **The held-gate moments, by reading.** After the new step 6, `tools/fixtures/behaviour/held-gate.json`'s four moments
   still prescribe `ask_human`; `point_to_notice_card` or `ask_human`; `resolve`; `ask_human`. (That fixture is not in
   `BEHAVIOUR_ORDER`, so no CI runs it; the review reads it.)

## The two-way reading (the window between the release and the last bump)

**Old text against a server that knows `auto` (coai-mcp ≥ 0.66.0), running `auto`.** Nothing in it tells an AI to do the
opposite of what the server does. Narrower, not opposite: "REFUSES until a plan round has reached `proceed`" (a round may
end `good_enough` or `not_reviewed`; the call is accepted after `resolve`, and the reply's own instruction says to go on).
Silent, not contradicted: the verdict lists that omit `not_reviewed`. Never fires: `call_human` at the gate, and at the
feature cap. **The one stale promise:** the feature gate's "the person's request" ground and the question rule's "on a card
directly" — under `auto` the AI asks, is told at once that no second round runs, and resolves. Nothing waits and nothing
passes that should not. Recorded in the pull request as the window's residual.

**New text against a server that predates `auto` (coai-mcp < 0.66.0; an absent key means `human`).** The fourth advancing
word never comes; `not_reviewed` and `consult_first` are never emitted; a sentence that says "under `auto`" never fires; the
`call_human` step after the `not_reviewed` one is still there and true; the sentence "a server too old to know `auto`
still asks a person by default" names that server. Nothing is false.

## Release, and the nine bumps

Not started; it follows the merge. Before the promotion, asked and counted (MANDATORY), because a promotion reddens
`pin-check` at once in all nine consumers and on every open pull request there:

1. **In-flight consumer releases:** for each of the nine, an open release pull request or a release workflow running; ask the
   consultants, then the owner, whether any consumer is mid-release. The promotion waits until no consumer is mid-release: its release finishes first, because a promotion reddens its `pin-check` while the release still needs green checks (plan round 1, finding 2).
2. **Open pull requests per repository**, counted that day against the cap of three
   ([common/pull-requests.md](../common/pull-requests.md) rule 7). A bump that would put a repository over three needs the
   owner's agreement, asked in one sentence that names what is queued there.
3. **What the release carries:** `git log --oneline origin/release..<this plan's merge sha>`. Anything beyond this plan and
   plan documents — a tier rule above all — is said, and the consumer that pins a rule-size budget re-baselines in its bump.

Then `gh workflow run promote-release.yml --ref main -f "sha=<merge sha, 40 hex>" -f reason="the coai gate's words for policy auto"`,
verified by `git ls-remote <the repository> refs/heads/release` answering that sha (the workflow refuses a sha whose `ci` run
is absent, unfinished or red). Then one pull request per consumer, `chore(rules): bump the shared rules to release <sha8> — the
coai gate's words for policy auto`, in the F41 order: benchmark, mcp, sidecar_rust, vscode_kit, wsl_care, creds, amd_r9700,
then rag_qln after benchmark and mcp have merged (its bump also moves its two code pins to their `main` tips, build run in its
CI), and the coai repository's own bump, which carries the regenerated snippet (`SNIPPET_VERSION` 6, `DOCUMENT_VERSION` 4,
`FEATURE_VERSION` 4, `QUESTION_VERSION` 2, `ARTEFACT_VERSION` 19) and goes in parallel. Each pull request body records the
validation and the rollback; a CI check present and green on the head sha before each merge, never "no failure found".
Rollback is a forward release (revert here, promote), then bump again — never a pin moved back by hand.

## Build order

1. The four rule edits, the body record, this plan, its `todo/README.md` row and the boundary section in
   [PLAN_product_manuals_go_home.md](PLAN_product_manuals_go_home.md) — one branch, two commits.
2. The dry run (test plan 8) beside it; the plan round on this plan; the code round over the diff; one pull request.
3. Merge; the pre-checks above; the promotion; the nine bumps.
4. The post-deploy check below, then the promotion of this plan to `research/` with its deviations.

## Definition of Done

- [ ] The four files carry the planned text; the markers are v6, v4, v4, v2; `research/rule-bodies.json` moved in the same
      commit; test plan 1–7 green, each RED seen first; 8 run and its result in the pull request; 9 read.
- [ ] The two-way reading is in the pull request description, with the stale promise named as the window's residual.
- [ ] The pre-checks of the release were made and their answers written here before the dispatch; `release` points at the merge sha.
- [ ] Nine bump pull requests merged with their checks present and green; rag_qln's code pins moved after benchmark and mcp.
- [ ] **The post-deploy run:** after the coai repository's bump merged, from a pulled checkout of its `main`,
      `node .agents/conventions/tools/post-deploy-check.mjs --target <that checkout>` — items 1–2 automatic (`rules check` on the
      target; `gate-snippet-check`, which prints `(v6)`); item 3, the native-agent smoke, run or recorded as not run, with the
      reason. Its result, its date and the delivered sha are written here.
- [ ] This plan is promoted to `research/` with its deviations once the release and the nine bumps are merged.
