# PLAN — agent-models mod 1.5.0: a `last answer` button, and the weekly reset time on the limits line

> Status: **APPROVED, 2026-11-22 (epoch 1, by reviewers); three changes since (1.1 owner scope, 1.2 probe, 1.3 code round). Code rounds done** (coai proceed twice, two Opus reviews, all findings fixed or answered); PR
> next. Scope: `mods/agent-models/` (one new hooks file, the band row, the limits line, version 1.5.0, the mod's own
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

> Epoch 1 · approved 2026-11-22 · by reviewers · state: open

  (The plan round's five accepted findings — no fallback to an unrelated row, repeated text, a bridge question after
  a local one, a check of a candidate build before the rollout, the npm checks — are the baseline this epoch was
  approved on.)
- 1.1 · 2026-11-22 · owner · scope — the weekly reset time on the limits line (§ Design D, tests W1–W8)
- 1.2 · 2026-11-22 · probe · approach — the target is the transcript message's uuid kept in `$.state` at the person's
  submit, not a list of drawn rows: after a hot reload the older rows are not drawn again, so a row list is empty
  (§ *Probe*, run 2); with it the Opus review's findings are folded in (§ Design A–C)
- 1.3 · 2026-11-23 · reviewer · approach — the code round (coai + Opus): a pending question keeps the question before
  it (`previous`) in `$.state`; a press while pending goes to `previous` (the question being answered now), not a
  toast — a message typed into a running turn never becomes a user message of its own, so the button lost the turn's
  question; `previous` is also the persisted lookup boundary (a reload kept only the text); `session.end` clears the
  value; the limits line ticks on the clock minute, not on the 5-hour time (§ Design A–C)
  (The second code round's accepted findings — a restore that lands after `session.end`, and the same text queued
  twice, told apart by a `queued` count on the pending value — only make the code do what this text already says: no
  older question, the newest submit wins. They are not changes.)

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

- A new state value `lastQuestion: { uuid: string } | { pending: string; previous?: string } | null` in
  `PluginState['agent-models']` (non-render hooks write it; it survives a hot reload, as `$.state` does). `previous`
  is the uuid of the question before the pending one (change 1.3); it is the lookup boundary: a row at or before it is
  never the pending question. The pending write is one `update` with no `await` before it, so submits are written in
  their order and an older submit never overwrites a newer one.
- `on('prompt.submit')`: when `e.origin` is the person's own (the Enter in this terminal or a bridge client — the
  coder reads `PromptOrigin` and names the members), not `isMeta`, not a slash command, and `next(e)` did not drop it:
  write `{ pending: <the entered text> }`, then read `$.session.messages({ last: 50 })` and find the newest user message
  with no `toolResults` whose text equals it; found → `{ uuid }`. A submit of a notification, a peer or a plugin leaves
  the value as it is. Two questions with the same text are told apart because the lookup runs at each submit and takes
  the newest such message.
- `on('turn.start')` and `on('turn.complete')`: while the value is `pending` (the prompt was queued behind a running
  turn), try the lookup again; at `turn.complete` the lookup reads back past the newest 50 rows (up to the engine cap)
  so a long answer does not hide the question. A message typed into a running turn that never becomes a user message
  of its own (run 2) stays pending until the next submit; while pending, the press goes to `previous` (B).
- `on('session.end')` writes `null` (a `/clear` raises no `session.start`, so an old uuid must not carry over).
- `on('session.start')` (new session, `/resume`, reload): when the value is `null` — a resumed session or a session
  from before 1.5.0 — take the newest transcript user message that has no `toolResults`, is not a compaction summary
  (`This session is being continued from a previous conversation`) and is not empty after the mod's `cleanPrompts`
  (which drops the engine's notification and peer wrappers); it reads the newest 200 rows first and the engine cap only
  when none is found. A value already set is kept: a reload keeps the session. Text is compared after `cleanPrompts` on
  both sides.
- A failed or refused read or write leaves the value as it was; nothing throws out of a hook.

### B. The press (`hooks/answer.tsx`, `register.tsx`)

- `pressLastAnswer(scroll, toast, question)`: pure apart from its two arguments, so the tests pass fakes (the harness
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
  taken. Revisit when the engine gives the origin on a transcript message.
- The minute tick follows the clock minute, while each shown value turns at its own second offset: the text can lag up
  to one minute. A timer per value's own turn would remove it.
- The viewer's account-row height is an estimate (a flex row with a non-shrinking email button); it only affects the
  "(scroll for more)" header.

## Files

New `mods/agent-models/hooks/answer.tsx`; `hooks/register.tsx`, `hooks/prompts.ts` (row count), `hooks/limits.tsx`,
`types/index.d.ts`, `.claude-plugin/plugin.json`; new `tests/answer.test.tsx`, the limits tests and fixtures;
`settings/hooks/lib/agent-models-decide.mjs` + `.claude/hooks/lib/agent-models-decide.mjs`;
`tools/agent-models-pins.json`, `tools/agent-models-decide.test.mjs`, `tools/agent-models-install.test.mjs`,
`tools/agent-models-pin.test.mjs`; `research/module_tests.md`.

## Build order

1. Plan round — done (proceed); changes 1.1 and 1.2 recorded.
2. RED: the tests below, watched failing for the right reason.
3. GREEN: A–B, then C, then D's installer part (Sonnet coder; Opus brief and review).
4. Version, pin row, `RELEASED_MOD` + mirror. `npm ci --ignore-scripts`, `npm test`, `npm run check`,
   `node --test tools/`, `claude plugin test mods/agent-models` green; `claude plugin validate` passes; `tsc` no new
   error.
5. Code round (coai `review_code` + an Opus review), fixes, PR, checks, threads, merge.
6. Owner checks on the branch build; then ask the owner, promote `release`, nine pin bumps, merge each.
7. Promote this plan to `research/`.

## Test plan (`claude plugin test mods/agent-models`; installer tests by `node --test`)

| # | Case | Expected |
|---|---|---|
| T1 | band drawn fullscreen, viewer closed and open | a `last-answer` button after `tasks (n)` in both |
| T2 | band drawn with `isFullscreen: false` | no `last-answer` button; absent `viewport` → drawn |
| T3 | person submit `Q`, the transcript stub has `Q` as the newest user message | `lastQuestion` = `{ uuid }` of it |
| T4 | submits of a notification, a peer, a plugin; an `isMeta` submit; a slash command; a dropped submit | value unchanged |
| T5 | a bridge submit after a local one | the bridge question's uuid |
| T6 | `Q` asked twice (two user messages with that text) | the newer uuid |
| T7 | submit queued: not in the transcript at submit, present at `turn.start` | `pending`, then `{ uuid }` |
| T8 | `session.start` with `null`: transcript ends with a summary, a `<task-notification…>`, a tool result, before them a question | the question's uuid |
| T9 | `session.start` with a value set (reload) | the value is kept |
| T10 | press with `{ uuid }` (fake scroll) | scroll called once, synchronously in the press, with `{ requestId: uuid }`, `block: 'start'` |
| T11 | press: scroll answers `{ deny: 'none scrolls' }`; another deny; a rejection | the fullscreen toast; `last answer: <deny>`; a toast, no throw |
| T12 | press with `pending` + `previous`; `pending` alone; `null` | scroll to `previous`; a toast, no scroll; a toast, no scroll |
| T15 | Q settled as u1; Q typed again, not yet in the transcript; then u2 appears and `turn.start` runs; also after a simulated reload (module state fresh) | `{ pending: Q, previous: u1 }`, never u1; then u2 |
| T16 | submits A then B with A's state work delayed | the value ends at B |
| T17 | the question's turn has more than 50 rows before `turn.complete` | found at `turn.complete` |
| T18 | `session.end` | value `null` |
| W9 | the line open, the 5-hour reset unknown, 24 h 1 m to the weekly reset, the clock moves 2 min (no manual redraw) | the date, then `resets in 23h 59m` |
| T13 | the messages read throws in each hook | value unchanged, no throw |
| T14 | the viewer row count with a long email at 80 columns | the wrapped account row counted |
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
- The limits line shows `resets <date>` after `week`, or `resets in …h …m` when the week resets within a day.

## Definition of Done

- [x] Plan round advanced (proceed, 2026-11-22); Opus plan review folded.
- [x] Tests T1–T21, W1–W11, I1, R1 green (336 mod cases); RED seen first for each new case.
- [x] `npm test`, `npm run check`, `node --test tools/` green; `claude plugin validate` passes; `tsc` no new error (TypeScript 6.0.3 with the 2.1.330 engine types, run on a scratch copy: no new error; the base's own test-fixture errors — the shared band fixture lacks `isCollapsed` — remain).
- [x] Code round advanced; Opus code review done; findings fixed or answered.
- [ ] PR merged with green checks and no open thread.
- [ ] Owner checks passed on the branch build; `release` promoted after the owner's word; nine pin bumps merged.
- [ ] The installed mod on this WSL is 1.5.0 after a session start in a consumer.
- [ ] This plan promoted to `research/` with what shipped differently.
