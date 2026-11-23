# PLAN — agent-models mod 1.5.0: a `last answer` button, and the weekly reset time on the limits line

> Status: **APPROVED 2026-11-22 (epoch 1, by reviewers); stopped for re-review 2026-11-23** — the second change (1.2)
> should have stopped the plan; it did not, and the build, two code rounds and a third change (1.3) followed. The
> plan-lifecycle check of PR #187 found it. Re-review written (below), narrowed and chosen by the owner; waits for its
> document round and the epoch 2 line. No merge of #187 until epoch 2 is approved. Scope: `mods/agent-models/` (one new hooks file, the band row, the limits line, version 1.5.0, the mod's own
> tests), the installer's file list and released-copy table in `settings/hooks/lib/agent-models-decide.mjs` (and its
> `.claude/hooks` mirror), the new row of `tools/agent-models-pins.json`, the installer tests under `tools/`,
> `research/module_tests.md`, then one `release` promotion and the pin bumps of the nine consumers. Parent:
> [PLAN_agent_models_mod.md](../research/PLAN_agent_models_mod.md).

## Goal (the owner's words, 2026-11-22, translated from Russian)

1. "I want to add a button — to the last answer. When pressed it scrolls to the answer to my question."
   The owner's screenshot: the band `[ messages ] [ <account> ] [ login ] [ tasks (0) ]` under a long answer, the
   question far above, out of view. The button brings the owner's last question to the top of the transcript window,
   so the answer starts right under it.
2. Added the same day, after the plan round: "and also add here [the limits line
   `5h 48% left · resets in 2h 24m · week 83% left · Fable 97% left`] when the weekly limit resets: if more than a
   day — just the date; if less — how many hours are left."

Not in this plan: buttons for older questions, a key binding, a reset time for the Fable weekly entry, and the open
follow-ups of [1.4.0](../research/PLAN_agent_models_1_4_0.md) § *Follow-ups*.

## Plan changes

> Epoch 1 · approved 2026-11-22 · by reviewers · state: stopped

  (The plan round's five accepted findings — no fallback to an unrelated row, repeated text, a bridge question after
  a local one, a check of a candidate build before the rollout, the npm checks — are the baseline this epoch was
  approved on.)
- 1.1 · 2026-11-22 · owner · scope — the weekly reset time on the limits line (§ Design D, tests W1–W8)
- 1.2 · 2026-11-22 · agent · approach — the target is the transcript message's uuid kept in `$.state` at the person's
  submit, not a list of drawn rows: after a hot reload the older rows are not drawn again, so a row list is empty
  (§ *Probe*, run 2); with it the Opus review's findings are folded in (§ Design A–C)
  (This second change should have stopped the plan. It was written with the source word `probe`, which the check
  cannot read, so the count stayed at one; the source is the agent's probe. Entry 1.3 came during the missed stop.)
- 1.3 · 2026-11-23 · reviewer · approach — the code round (coai + Opus): a pending question keeps the question before
  it (`previous`) in `$.state`; a press while pending goes to `previous` (the question being answered now), not a
  toast — a message typed into a running turn never becomes a user message of its own, so the button lost the turn's
  question; `previous` is also the persisted lookup boundary (a reload kept only the text); `session.end` clears the
  value; the limits line ticks on the clock minute, not on the 5-hour time (§ Design A–C)
  (The second code round's accepted findings — a restore that lands after `session.end`, and the same text queued
  twice, told apart by a `queued` count on the pending value — only make the code do what this text already says: no
  older question, the newest submit wins. They are not changes.)

### Re-review for epoch 2

Narrowed: yes — the resume guess, the press to the question before a pending one, a one-minute lag; the owner chose the first

  (What is narrowed against epoch 1's approved text: (1) the restore after `/resume` guesses the newest user message by
  text — the engine gives no origin on a transcript message — so "never an unrelated row" is weaker for that case; the
  owner answered "Guess the newest" on 2026-11-23 after the question consultants split, consult `59018e5b`; (2) while
  a question is pending the press goes to the question before it, where the approved text toasted and never went to
  an older question (change 1.3: a text typed into a running turn never gets a row, and the toast left the turn's
  question unreachable); (3) the weekly time turns at the 24-hour mark up to one minute late (the clock-minute tick of
  change 1.3). Items 2 and 3 go to the owner with the epoch 2 approval.)

  The re-review: coai consults `5afcb566` (every change quoted) and `90c1d068` (the lookup design); the whole plan
  revised (§ Design A rewritten to the code, then simplified: `queued` dropped; the test plan and Definition of Done to
  the 336 cases; Files and Build order completed); an Opus judge sorted the done work; the coai document round
  (proceed, two findings taken) and an Opus plan review (its findings folded).

| Work | Where | Verdict | Action |
|---|---|---|---|
| b81073f build (answer.tsx, band row, weekly reset, 1.5.0, installer, pins) | pushed, unmerged | fits | kept; its three parts that 1.3 changed were fixed forward by d07bd3c |
| d07bd3c code round 1 (`previous`, ordered submits, deep read, `session.end`, clock-minute tick) | pushed, unmerged | fits | kept |
| b2e48bc code round 2 (restore guard, `queued`, newest copy with no boundary, typed test helpers) | pushed, unmerged | fits | kept, but its `queued` count is cut: fixed forward in epoch 2 (no history rewrite) |
| plan-only commits 91cc7f5, 1c6f3e3, ba5c04d, 13eb0e5, 9bd7d8e | pushed, unmerged | fits | kept (plan text; this record supersedes their design text) |

## What the code and the engine do today (read 2026-11-22 at `42119f6`, Claude Code 2.1.330)

- The band row is `accountRow` (`mods/agent-models/hooks/register.tsx:215-237`), drawn with the viewer open and
  closed (`:241`, `:247`). The viewer counts the account row as one row (`FIXED_ROWS`, `hooks/prompts.ts:213`).
- The installer copies exactly the files of `MOD_FILES` (`settings/hooks/lib/agent-models-decide.mjs:16-25`, seven
  files, frozen; `INTRODUCED` at `:27-30`). Its tests name that list: `tools/agent-models-decide.test.mjs:18,24,35-40`,
  `tools/agent-models-install.test.mjs:93`, `tools/agent-models-pin.test.mjs:111-116`.
- **`$.ui.scroll({ to: { requestId }, block })`**: `requestId` may be "a transcript message's" id (types `UiScrollTarget`).
  A transcript row moves only "while this call answers the person's own input, where one scrolls"; on the terminal's
  main screen the transcript is the terminal's own scrollback (deny `none scrolls`), so it works in fullscreen only
  (`e.viewport.isFullscreen`). The test harness cannot observe the target or the `block` of a scroll (the `ui.scroll`
  event fires for the plugin's own sites only).
- **`prompt.submit`** gives `e.origin` (`PromptOrigin`: the person's Enter, a notification, a peer, a plugin) and
  `e.isMeta`; `next(e)` resolves "once the prompt entered the session and its turn started, or it was queued behind
  the running one". `$.session.messages({ last })` gives `uuid` but no origin.

### Probe (2026-11-22, a throw-away dev mod in this session, fullscreen terminal)

Run 1 — a `UserMessage` hook recorded each row; a tool compared them with `$.session.messages({ last: 40 })`. A row's
`requestId` was the message uuid with its last 12 hex digits zeroed (`c983645b-e851-4e16-b475-000000000000` for
`c983645b-e851-4e16-b475-4e5a54afae23`); a row of a task notification had the whole uuid; a fresh submit was first
drawn with the id `placeholder`.

Run 2 — after a hot reload the hook saw only the rows drawn since (the older questions were not drawn again), and a
button that scrolled to the newest recorded row toasted `no question row recorded`. A message typed during a running
turn got a row id of its own that `ui.scroll` refused (`nothing drawn under that requestId`) and no user message of its
own in the transcript read.

Run 3 — four buttons, each `block: 'start'`, the question scrolled out of view first. The owner: A, B, C move; D does
not.

| Button | Target | Result |
|---|---|---|
| A | the newest recorded row id, no await | moved |
| B | the transcript uuid, read before the press, no await | moved (also to an older question far off screen) |
| C | that uuid with the last 12 digits zeroed, no await | moved |
| D | as C, but the transcript read after the press (an `await` before the scroll) | did not move |

So: the transcript uuid is a working target, a far-off row is reached, and the target must be known before the press.

## Design

### A. Know the last question before any press (new file `hooks/answer.tsx`, `types/index.d.ts`)

- A state value `lastQuestion` in `PluginState['agent-models']` (`types/index.d.ts`), written by non-render hooks only;
  it survives a hot reload, as `$.state` does; absent (a state from before 1.5.0) reads as `null`:
  - `{ uuid }` — the question is found in the transcript;
  - `{ pending, previous? }` — the person's text, not found yet. `previous` is the uuid of the question before it: the
    press target while pending, and the lookup boundary (a row at or before it is never this question);
  - `null` — no question seen.
  (Epoch 2 drops b2e48bc's `queued` count: it waited for a second row when the first copy was typed into a running
  turn, which never gets a row of its own, so a re-send after the turn was never found — the re-review consult's
  defect. A `missed` flag was weighed and dropped as racy; re-settling a found question on a newer same-text row was
  weighed and dropped, as it could jump to a row a plugin sent — consult `90c1d068`.)
- `on('prompt.submit')`, after `next(e)`: only when `e.origin.kind` is `composer` or `bridge`, not `isMeta`, not a slash
  command and not dropped. First, with no `await` before it, ONE `update` writes `{ pending, previous }` and bumps a
  module `generation`: `previous` is the current uuid, or the current pending's `previous`. The change function writes
  only while its generation is the newest, and `update` retries on a version miss, so an older submit never overwrites
  a newer one whatever order the writes land in. Then the lookup on `$.session.messages({ last: LOOKUP_ROWS = 50 })`;
  found → `{ uuid }` (`settle` writes only while the value is still that pending text with that `previous`).
- The lookup (`findQuestion`): user rows with no `toolResults`, compared after `cleanPrompts` on both sides (an empty
  clean text matches nothing); the NEWEST match newer than `previous` (scanning newest first, stopping at `previous`);
  with no boundary, the newest match. A found `{ uuid }` never moves. Known limit: the same words queued twice before
  either has a row settle on the first copy (the same question, its earlier answer).
- `on('turn.start')` and `on('turn.complete')`: a pending value is looked up again, under the generation check (a
  lookup started before a `session.end` writes nothing). At `turn.complete`, when the 50 rows found nothing, came back
  full and do not hold `previous`, it reads up to the engine cap (`ENTRY_CAP`), bounded by `previous`. A text typed into
  a running turn is never found and stays pending until the next submit; meanwhile the press goes to `previous`.
- `on('session.end')` writes `null` and bumps the generation (a `/clear` raises no `session.start`, so an old uuid must
  not carry over; a lookup or restore still in flight then writes nothing).
- `on('session.start')` with `null` (a resume, or a session from before 1.5.0) — **narrowed, the owner's choice**: the
  newest transcript user message with no `toolResults`, not a compaction summary (`This session is being continued
  from a previous conversation`), not a peer wrapper (`<teammate-message`, `<agent-message`), and not empty after
  `cleanPrompts` (which drops the engine's reminder and notification wrappers). It reads `RESTORE_ROWS = 200` first and
  the engine cap only when those came back full and held none. It writes only when the value is still `null` and its
  generation is still the newest. A value already set is kept: a reload keeps the session.
- A failed or refused read or write leaves the value as it was; nothing throws out of a hook.

### B. The press (`hooks/answer.tsx`, `register.tsx`)

- `pressLastAnswer(scroll, toast, question)`: no engine access but through its `scroll` and `toast` arguments, so the tests pass fakes (the harness
  cannot see a scroll target). With `{ uuid }` it calls `scroll({ to: { requestId: uuid }, block: 'start' })` at once —
  no `await` before it (run 3, D). `{}`: nothing more. `{ deny }`: a toast in plain words (`none scrolls` → "works in
  fullscreen only"; else `last answer: <deny>`). A rejection: a toast; the press never throws. With `pending` and a
  `previous`: scroll to `previous`, the same way. With `pending` and no `previous`: a toast `last answer: your question
  is not in the transcript yet`. With `null`: a toast `last answer: no question yet`. No scroll in those two.
- The draw reads `lastQuestion` (a read, never a write) and passes the value to the press.
- The button `[ last answer ]`, `key="last-answer"`, colour `BUTTON_COLOR`, after `tasks (n)` in `accountRow`, in both
  viewer states. It is drawn only when `e.viewport?.isFullscreen !== false` (on the main screen it cannot work).
- The viewer's row count counts the account row by its width at `bodyColumns` (it can wrap with a long email), not as a
  fixed one row.

### C. The weekly reset time (`limits.tsx`, `types/index.d.ts`) — plan change 1.1

- Today the line keeps only `five_hour.resets_at` (`mods/agent-models/hooks/limits.tsx:81`); `Limits` has no weekly
  time (`types/index.d.ts:69-74`). Add `weekResetsAt: number | null`, read by the same `parseResetsAt`
  (`limits.tsx:62`) from `seven_day.resets_at`.
- The text goes right after `week N% left`:
  `5h 48% left · resets in 2h 24m · week 83% left · resets Nov 27 · Fable 97% left`.
  - 24 hours or more left: `resets <Mon> <day>` — the date in the engine's local time zone, English month
    abbreviation, no time, no year.
  - Under 24 hours: `resets in <time>` with the existing `resetText` (`limits.tsx:92`): `23h 59m`, `5h 0m`, `59m`,
    `<1m`.
  - Unknown, clock refused or passed: `resets —`.
  - No colour (the owner asked for none).
- A stored `Limits` value from 1.4.0 has no `weekResetsAt`: read as `null` (a dash) until the next fetch; the guard of
  the stored value must not reject it.
- The line redraws each minute while open (the 1.4.0 `limitsMinute` tick, keyed from 1.5.0 on the clock minute, not on
  the 5-hour time, which can be unknown; a passed weekly reset starts a refetch as a passed 5-hour reset does), so it
  turns from a date into hours at the
  24-hour mark without a new fetch.

### D. Version, installer and release

- `plugin.json` version `1.5.0`, its `description` names the button and the weekly time.
- `MOD_FILES` gains `hooks/answer.tsx` and `INTRODUCED['hooks/answer.tsx'] = [1, 5, 0]` in
  `settings/hooks/lib/agent-models-decide.mjs` and its mirror; the installer tests that name the list are updated, and
  a new one shows a 1.4.0 copy upgrading to 1.5.0 with the new file copied.
- `tools/agent-models-pins.json` gets the `1.5.0` row (eight files); `RELEASED_MOD` and its mirror become that row.
- **Before the promotion**: the owner runs the owner checks (below) on the branch build, loaded in a session with
  `claude --plugin-dir <worktree>/mods/agent-models` (or the installed copy swapped by hand and put back); a failed
  check blocks the rollout. Then the owner is asked about in-flight consumer releases and the open-PR counts, one
  `release` promotion, a pin bump in each of the nine consumers.

## Follow-ups (not built here; findings of the code rounds that were not taken)

- The restore after a resume (value `null`) picks the newest user message by text alone: `SessionMessage` carries no
  origin (types `SessionMessage`), so a plain-text plugin or meta message after the owner's last question could be
  taken (the owner accepted this, 2026-11-23). Revisit when the engine gives the origin on a transcript message.
- The minute tick follows the clock minute, while each shown value turns at its own second offset: the text can lag up
  to one minute. A timer per value's own turn would remove it.
- The viewer's account-row height is an estimate (a flex row with a non-shrinking email button); it only affects the
  "(scroll for more)" header.

## Files

New `mods/agent-models/hooks/answer.tsx`; `hooks/register.tsx`, `hooks/prompts.ts` (row count), `hooks/limits.tsx`,
`types/index.d.ts`, `.claude-plugin/plugin.json`; new `tests/answer.test.tsx`, `tests/answer-race.test.tsx`,
`tests/answer-fixtures.tsx`, `tests/week-reset.test.tsx`; the limits tests and fixtures (`limits-fixtures.tsx`,
`limits.test.tsx`, `limits-race.test.tsx`, `reset.test.tsx`);
`settings/hooks/lib/agent-models-decide.mjs` + `.claude/hooks/lib/agent-models-decide.mjs`;
`tools/agent-models-pins.json`, `tools/agent-models-decide.test.mjs`, `tools/agent-models-install.test.mjs`,
`tools/agent-models-pin.test.mjs`, `tools/agent-models-read.test.mjs`, `tools/agent-models-swap.test.mjs`,
`tools/lib/agent-models-fixtures.mjs`; `research/module_tests.md`.

## Build order

1. Plan round — done (proceed, 2026-11-22); changes 1.1–1.3; stopped and re-reviewed for epoch 2 (this record).
2. Build, two code rounds — done (b81073f, d07bd3c, b2e48bc; all `fits`).
3. The re-review's own rounds (the coai document round, an Opus plan review), then the owner approves epoch 2
   (narrowed) and its line is written. Nothing below starts before that.
4. Epoch 2: § Design A as revised — `queued` dropped, the newest-match lookup, the generation check in the retry (T20, T22–T24), RED first; the pins row and
   `RELEASED_MOD` follow the new hash.
5. All checks: `npm ci --ignore-scripts`, `npm test`, `npm run check`, `node --test tools/`,
   `claude plugin test mods/agent-models`, `claude plugin validate`, `tsc` no new error.
6. A final code round over the whole branch (coai `review_code` with `again: true` and the revised plan + an Opus
   review), fixes, PR #187 checks and threads, merge.
7. Owner checks on the branch build; then ask the owner, promote `release`, nine pin bumps, merge each.
8. Promote this plan to `research/`.

## Test plan (`claude plugin test mods/agent-models`; installer tests by `node --test`)

| # | Case | Expected |
|---|---|---|
| T1 | band drawn fullscreen, viewer closed and open | a `last-answer` button after `tasks (n)` in both |
| T2 | band drawn with `isFullscreen: false` | no `last-answer` button; absent `viewport` → drawn |
| T3 | person submit `Q`, the transcript stub has `Q` as the newest user message | `lastQuestion` = `{ uuid }` of it |
| T4 | submits of a notification, a peer, a plugin; an `isMeta` submit; a slash command; a dropped submit | value unchanged |
| T5 | a bridge submit after a local one | the bridge question's uuid |
| T6 | `Q` asked twice (two user messages with that text) | the newer uuid |
| T7 | submit queued: not in the transcript at submit, present at `turn.start` (another one at `turn.complete`) | `pending`, then `{ uuid }` |
| T8 | `session.start` with `null`: transcript ends with a summary, a `<task-notification…>`, a tool result, before them a question | the question's uuid |
| T9 | `session.start` with a value set (reload) | the value is kept |
| T10 | press with `{ uuid }` (fake scroll) | scroll called once, synchronously in the press, with `{ requestId: uuid }`, `block: 'start'` |
| T11 | press: scroll answers `{ deny: 'none scrolls' }`; another deny; a rejection | the fullscreen toast; `last answer: <deny>`; a toast, no throw |
| T12 | press with `pending` + `previous`; `pending` alone; `null` | scroll to `previous`; a toast, no scroll; a toast, no scroll |
| T12b | the drawn button pressed (not only `pressLastAnswer`) | the toast reaches the engine |
| T15 | Q settled as u1; Q typed again, not yet in the transcript; then u2 appears and `turn.start` runs; also after a simulated reload (module state fresh) | `{ pending: Q, previous: u1 }`, never u1; then u2 |
| T7b | a subagent's turn events | the main question is not touched |
| T8b | a question 200 rows back, value `null` at `session.start` | found with a read of the engine cap |
| T8c | the restore: a question that starts with a tag; a notification; a peer wrapper | the question is taken; the other two are not |
| T13 | the messages read throws in each hook | value unchanged, no throw |
| T13b | a refused write of `lastQuestion` | nothing throws; the value as it was |
| T14 | the viewer row count with a long email at 80 columns | the wrapped account row counted |
| T14b | `accountRowCells` with and without the button, a pending login | the cells the row draws |
| T15b | T15 after a reload: fresh module, stored value seeded | the stored `previous` is still the boundary |
| T15c | a second submit while pending | it keeps the question before the first one as `previous` |
| T16 | submits A then B with A's state work delayed | the value ends at B |
| T17 | the question's turn has more than 50 rows before `turn.complete` | found at `turn.complete` |
| T17b | the deep read; an older row with the same text before `previous` | not taken |
| T18 | `session.end` while a submit's lookup is in flight | value `null` after the lookup lands |
| T19 | `session.start`'s restore read is slow; `session.end` before it lands | value `null` |
| T21 | `turn.complete`; the newest 50 rows hold `previous` | no read of the engine cap |
| T21b | `turn.complete` with no `previous` | the deep read still runs |
| T20 | the same text queued twice before either has a row | the first copy settles; the second does not move it (known limit) |
| T22 | A settled; Q typed into A's running turn (never its own row); `turn.complete`; then Q sent again and its row appears | settles on the re-sent row; no wait for a second copy |
| T22b | T22 after a reload (stored value seeded) | the same |
| T23 | no question settled in this session; an older row with the same text in the window | the newest match |
| T24 | a `turn.start` lookup in flight; `session.end`; the lookup lands | value `null` |
| F1 | (test names `findQuestion …`) `findQuestion`: clean text on both sides; an empty clean text; no boundary with two copies | matches; none; the newest copy |
| F2 | (test name `newestQuestion …`) `newestQuestion`: a summary, wrappers, tool results, a tag the person typed | only the person's row |
| W9 | the line open, the 5-hour reset unknown, 24 h 1 m to the weekly reset, the clock moves 2 min (no manual redraw) | the date, then `resets in 23h 59m` |
| W9b | the drawn week reset | bare text, no colour |
| W10 | an open line at the 24-hour mark | the date turns into the time left with no new fetch and no manual redraw |
| W11 | an open line whose weekly reset has passed, the 5-hour reset unknown | fetches again, once a minute |
| W1 | body with `seven_day.resets_at` `…Z` / `…+00:00` | `weekResetsAt` = the `Date.parse` value |
| W2 | `seven_day.resets_at` null / absent / garbage / no offset | `weekResetsAt` null; `resets —` after `week` |
| W3 | 4 days left (fixed fixture clock and time zone) | `week 83% left · resets Nov 27` (the date the fixture names) |
| W4 | exactly 24 h 0 m left; 23 h 59 m left | the date; `resets in 23h 59m` |
| W5 | 5 h 0 m, 59 m, 30 s left | `resets in 5h 0m`, `resets in 59m`, `resets in <1m` |
| W6 | reset passed; clock refused | `resets —` |
| W7 | a stored 1.4.0 value with no `weekResetsAt` | drawn with `resets —`, no throw, the value kept |
| W8 | the owner's example line | `5h 48% left · resets in 2h 24m · week 83% left · resets Nov 27 · Fable 97% left` |
| I1 | installer: `MOD_FILES` has eight files; a 1.4.0 copy upgrades to 1.5.0 | `hooks/answer.tsx` copied; pins row = HEAD files = `RELEASED_MOD` |
| R1 | the existing mod tests (fixtures updated for the new field and the longer line) and `node --test tools/` | pass |

## Owner checks (on the branch build before the promotion, again after the rollout)

- Ask a question that gets a long answer, scroll away, press `last answer`: the question is at the top of the window
  and the answer under it.
- The same after a hot reload of the mod, and after `/resume` of an older session.
- Paste a long text (and, once, an image) as a question, then press: the button reaches it (the lookup matches the
  transcript text against the submitted text; write down what happens).
- The limits line shows `resets <date>` after `week`, or `resets in …h …m` when the week resets within a day.

## Definition of Done

- [x] Plan round advanced (proceed, 2026-11-22); Opus plan review folded.
- [x] Tests T1–T21b, F1–F2, W1–W11, I1, R1 green (336 mod cases); RED seen first for each new case.
- [ ] Epoch 2: T20, T22, T22b, T23, T24 RED, then green with `queued` dropped, the newest-match lookup and the generation check in the retry; all checks again.
- [x] `npm test`, `npm run check`, `node --test tools/` green; `claude plugin validate` passes; `tsc` no new error (TypeScript 6.0.3 with the 2.1.330 engine types, run on a scratch copy: no new error; the base's own test-fixture errors — the shared band fixture lacks `isCollapsed` — remain).
- [x] Code round advanced; Opus code review done; findings fixed or answered.
- [ ] The re-review for epoch 2: consult, whole-plan revision, the Opus judge's sort, the document round and an Opus
      plan review; epoch 2 approved by the owner (narrowed).
- [ ] A final code round over the whole branch after the `missed` fix.
- [ ] PR merged with green checks and no open thread.
- [ ] Owner checks passed on the branch build; `release` promoted after the owner's word; nine pin bumps merged.
- [ ] The installed mod on this WSL is 1.5.0 after a session start in a consumer.
- [ ] This plan promoted to `research/` with what shipped differently.
