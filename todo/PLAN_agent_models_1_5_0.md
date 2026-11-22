# PLAN — agent-models mod 1.5.0: a `last answer` button that scrolls to the answer to your last question

> Status: **DRAFT, 2026-11-22.** Plan round not run yet. Scope: `mods/agent-models/` (one new hooks file, the band row,
> version 1.5.0, the mod's own tests), the released-copy table in `settings/hooks/lib/agent-models-decide.mjs` (and its
> `.claude/hooks` mirror), the new row of `tools/agent-models-pins.json`, `research/module_tests.md`, then one
> `release` promotion and the pin bumps of the nine consumers. Parent: [PLAN_agent_models_mod.md](../research/PLAN_agent_models_mod.md).

## Goal (the owner's words, 2026-11-22, translated from Russian)

"I want to add a button — to the last answer. When pressed it scrolls to the answer to my question."

The owner's screenshot: the band `[ messages ] [ <account> ] [ login ] [ tasks (0) ]` under a long answer, the
question far above, out of view. The button brings the owner's last question to the top of the transcript window, so
the answer starts right under it.

Not in this plan: buttons for older questions, a key binding, the desktop or mobile surfaces beyond what the band
already draws there, and the open follow-ups of [1.4.0](../research/PLAN_agent_models_1_4_0.md) § *Follow-ups*.

## What the engine gives (Claude Code 2.1.330 types, read 2026-11-22)

- **`$.ui.scroll({ to: { requestId }, block })`** brings a render instance into view; `block: 'start'` puts its top at
  the top of the window. "A transcript row moves only while this call answers the person's own input" — a press is
  such input. It resolves `{}` or `{ deny }` (`not person-initiated`, `the window moved meanwhile`, `no-surface`, …).
  The docs do not say whether the press still counts after an `await`; the design below calls `scroll` before any
  `await`, so the question does not arise.
- **`ui.render` on `{ component: 'UserMessage' }`** runs for each user-message row drawn. `e.requestId` is the row's
  render id; `e.props.text` is the prompt as shown; `e.props.origin.kind` says who sent it (`composer` = typed here,
  `bridge` = sent from a remote client; others — `task-notification`, `sdk`, … — are not the person's question).
  A render hook must not write `$.state`, so what it records lives in a module variable, lost on a hot reload.
- **`prompt.submit`** gives `e.text` (pastes expanded) and `e.isMeta` (true on a prompt the person does not see as
  typed).

### Probe (2026-11-22, a throw-away dev mod in this session)

A `UserMessage` hook recorded each row's `requestId`, origin and text; a tool compared them with
`$.session.messages({ last: 40 })`:

| row `requestId` | transcript `uuid` | text |
|---|---|---|
| `58b036a6-4e49-4335-b709-000000000000` | (compacted away) | `[Image #1] у нас в конвешинс есть мод на…` |
| `c983645b-e851-4e16-b475-000000000000` | `c983645b-e851-4e16-b475-4e5a54afae23` | `готвов?` |

So the row id is **not** the transcript uuid (the last 12 hex digits are zeroed). That shape is not documented, so the
design does not rely on it: it matches by the shown text. The probe also showed that after a hot reload the earlier
rows are drawn again in transcript order, and that a compaction summary has no `composer` row.

## Design

### A. Remember the person's prompt rows (new file `hooks/answer.tsx`)

- `on('ui.render', { component: 'UserMessage' }, …)`: when `origin.kind` is `composer` or `bridge`, and the row's
  `requestId` is not recorded yet, append `{ id, text }` to a module list (a new array each time, never mutated in
  place), capped at the newest 200 entries. The hook always returns `next(e)`: the row is drawn as before.
- `on('prompt.submit', …)`: after `next(e)`, when the submit was not dropped, not `isMeta` and not a slash command,
  keep `e.text` as the *last question text* (a module variable).

### B. The press (`hooks/answer.tsx`, `register.tsx`)

- `lastQuestionRow(list, lastText)`: the newest recorded row whose text equals `lastText`; when there is none (no
  submit seen since the load, or the shown text differs from the submitted one), the newest recorded row; when the
  list is empty, none. Pure, synchronous.
- The button press calls `$.ui.scroll({ to: { requestId: row.id }, block: 'start' })` at once — no `await` before it.
  - `{}`: nothing more.
  - `{ deny }`: a toast `last answer: <deny>`.
  - no row: a toast `last answer: no question of yours in view yet — scroll up to it once`.
  - a thrown or rejected call: a toast with the message; the press never throws.
- The button is drawn in `accountRow` after `tasks (n)`: `[ last answer ]`, `key="last-answer"`, colour
  `BUTTON_COLOR`, in both band states (viewer open and closed), because `accountRow` is drawn in both.

### C. Version and release

- `plugin.json` version `1.5.0`. `tools/agent-models-pins.json` gets the `1.5.0` row (raw sha256 of the mod files,
  now one more: `hooks/answer.tsx`); `RELEASED_MOD` in `settings/hooks/lib/agent-models-decide.mjs` and its
  `.claude/hooks/lib` copy become that row.
- After the merge: one `release` promotion, then a pin bump in each of the nine consumers. Before the promotion the
  owner is asked about in-flight consumer releases and the open-PR counts.

## Files

New `mods/agent-models/hooks/answer.tsx` (the row list, the last question text, `lastQuestionRow`, the button, the
press), `hooks/register.tsx` (calls the hooks of `answer.tsx`, the button in `accountRow`), `.claude-plugin/plugin.json`,
new `tests/answer.test.tsx`, `settings/hooks/lib/agent-models-decide.mjs` + `.claude/hooks/lib/agent-models-decide.mjs`,
`tools/agent-models-pins.json`, `research/module_tests.md`.

## Build order

1. Plan round (coai `review_plan` + an Opus review at once) until the stage advances.
2. RED: the tests below, watched failing for the right reason.
3. GREEN: A, then B (Sonnet coder; the caller reviews).
4. Version, pin row, `RELEASED_MOD` + mirror; `node --test tools/` and `claude plugin test mods/agent-models` green;
   `claude plugin validate` passes; `tsc` shows no new error.
5. Code round (coai `review_code` + an Opus review), fixes, PR, checks, threads, merge.
6. Ask the owner, promote `release`, nine pin bumps, merge each.
7. Owner checks (below); promote this plan to `research/`.

## Test plan (`claude plugin test mods/agent-models`; installer tests by `node --test`)

| # | Case | Expected |
|---|---|---|
| T1 | band drawn, viewer closed and open | a `last-answer` button after `tasks (n)` in both |
| T2 | two `composer` rows drawn, then press | `ui.scroll` called once with the second row's `requestId`, `block: 'start'` |
| T3 | rows of origin `task-notification`, `sdk` | not recorded; press with only those → the "no question" toast, no scroll |
| T4 | a `bridge` row | recorded like `composer` |
| T5 | submit `B`, rows `A`, `B`, `A` (redrawn `A` seen last after a reload) | scroll to the `B` row |
| T6 | submitted text differs from every row | scroll to the newest recorded row |
| T7 | the same row drawn many times | recorded once |
| T8 | 250 rows | only the newest 200 kept; the press still finds the newest |
| T9 | `ui.scroll` answers `{ deny: 'not person-initiated' }` | toast `last answer: not person-initiated` |
| T10 | `ui.scroll` rejects | a toast; the press does not throw |
| T11 | `isMeta` submit, a slash command, a dropped submit | the last question text does not change |
| T12 | the UserMessage hook | returns `next(e)` unchanged (the row is drawn as before) |
| T13 | the existing 282 mod tests | pass |
| T14 | existing `tools/agent-models-pin.test.mjs` | newest row = HEAD files = `RELEASED_MOD` |

## Owner checks after the rollout (a session cannot do these for itself)

- Ask a question that gets a long answer, scroll to the end, press `last answer`: the question is at the top of the
  window and the answer under it.
- The same after `/resume` of an older session, and after a hot reload of the mod.

## Definition of Done

- [ ] Plan round and code round advanced; Opus reviews done, findings fixed or answered.
- [ ] Tests T1–T14 green; RED seen first for T1–T11.
- [ ] `claude plugin validate` passes; `tsc -p mods/agent-models` shows no new error; `node --test tools/` green.
- [ ] PR merged with green checks and no open thread.
- [ ] `release` promoted after the owner's word; nine consumer pin bumps merged.
- [ ] The installed mod on this WSL is 1.5.0 after a session start in a consumer.
- [ ] Owner checks reported; this plan promoted to `research/` with what shipped differently.
