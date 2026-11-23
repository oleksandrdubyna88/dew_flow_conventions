# PLAN — agent-models mod 1.6.0: pins on Claude's answers, and a list under the `last answer` button

> Status: **APPROVED 2026-11-23 (epoch 1, by reviewers); build next.** Scope: `mods/agent-models/` (a pin icon under each of
> Claude's text answers, the `last answer` button opening a list, version 1.6.0, the mod's own tests), the installer's
> released-copy table in `settings/hooks/lib/agent-models-decide.mjs` (and its `.claude/hooks` mirror) and the new row
> of `tools/agent-models-pins.json`, `research/module_tests.md`. **No `release` promotion and no consumer bump here**:
> the owner ordered (2026-11-23) all the code first, then the move of the mod into its own public repository
> `dew_flow_mods`, then one round of pin bumps to that repository, then the owner's tests. Parent:
> [PLAN_agent_models_1_5_0.md](PLAN_agent_models_1_5_0.md) (merged as #187, `53b0a33`; its release is held by the owner).

## Goal (the owner's words, 2026-11-23, translated from Russian)

"Also add the ability to put a pin on any row. And this button that goes back to the last message must open and show
a list — first always my last message, then the pinned rows. A press scrolls to them. And a way to remove from the
list (unpin)."

Then, after a live probe in this session (§ *Probe*):

- "A pin on every row is fine. Just remove the word pin/pinned, and use two colours: an unpinned grey icon, a pinned
  one as now — bright raspberry."
- "Can you filter? Pins are not needed on scripts and service info. Only on the normal text you output."
- With the pins in `$.state`: "Great. Now everything works fast."

Not in this plan: pins on the owner's own messages or on tool rows (the owner excluded them), pins that outlive the
session, reordering pins, the move to `dew_flow_mods` (its own plan, next).

## Plan changes

> Epoch 1 · approved 2026-11-23 · by reviewers · state: open

  (The plan round's accepted findings — coai: verify one id per block, keep a long list reachable; the Opus
  review: probe the ids first, the atom in pins.tsx, the first list row's text, the 1.5.0 test changes, the openers
  closing each other, a frameless icon, the notice blocks, the markdown first line — and the probe's second run are
  the baseline this epoch was approved on. Rejected with reasons in the round: service blocks as AssistantMessage,
  pins surviving into another session.)

## What the code and the engine do today (read 2026-11-23 at `53b0a33`, Claude Code 2.1.330)

- The `last answer` button is `answerButton` (`mods/agent-models/hooks/answer.tsx`), drawn by `accountRow`
  (`hooks/register.tsx`) after `tasks (n)` when `isAnswerShown(e.viewport)`; its press is `pressLastAnswer(scroll,
  toast, question)`, which scrolls to `lastQuestion` (`$.state`) with `block: 'start'`, no `await` before the scroll.
- The viewer counts the account row by `accountRowCells` (`answer.tsx`) at `bodyColumns` (`hooks/prompts.ts`,
  `viewerFixedRows`).
- **`ui.render` on `{ component: 'AssistantMessage' }`**: one block of Claude's reply; `e.props.text` (markdown as
  drawn), `e.props.isSummary` (true on a summary block), `e.requestId`; a hook that keeps the row puts `await next(e)`
  in its tree. Render events carry `e.viewport` (`isFullscreen`).
- **A press handler may write `$.state`** (`update`); a render hook may only `read`. A write redraws every reader at
  once: the probe's first version kept pins in a module variable and the list lagged 5–10 s; with `$.state` the owner
  saw no lag.

### Probe (2026-11-23, the throw-away dev mod `id-probe` in this session, fullscreen)

Run 1 — a `📌` button under every `UserMessage`, `AssistantMessage` and `ToolUse` row, pins listed in the band, a press
on a listed pin scrolling to its row (`block: 'start'`), a red `x` removing it. Then, by the owner's words above: no
word, an icon only — grey `📌︎` (`#808080`) unpinned, raspberry `📌` (`#E3256B`) pinned, a press toggling; only under
`AssistantMessage` rows that are not `isSummary` and not empty; pins in `$.state`. The owner: "everything works fast".

Run 2 — every `AssistantMessage` draw recorded (`requestId`, `isSummary`, text head, draw count) against
`$.session.messages({ last: 30 })`: each text block has its own `requestId`, also two blocks of one reply around a tool
row (`9124a10e-…-000000000000`, `b3080f52-…-000000000000`); the id is the block's transcript uuid with its last 12
hex digits zeroed, and it stays the same through the streaming draws (2–9 draws each, no `placeholder` id, unlike a
fresh `UserMessage`); summary blocks have ids of their own and `isSummary: true`. The pin button with `plain` draws
the icon alone, with no `[ ]` frame (types: "a one-glyph label is then a control by itself").

## Design

### A. Pins (`hooks/pins.tsx`, new; `types/index.d.ts`)

- A state value `pins: readonly Pin[]` in `PluginState['agent-models']`, `Pin = { id: string; text: string }`: `id` the
  row's `requestId` (§ Probe run 2: one per block, stable while streaming); an id that is not uuid-shaped (e.g.
  `placeholder`) gets no icon. `text`: the block's first content line after `cleanPrompts`, with markdown marks
  (`#`, `>`, list markers, a fence line) dropped, cut to 60 characters (with `…`). Absent (a state from before
  1.6.0) reads as `[]`. At most 50 pins: a 51st press drops the oldest. Written only by press handlers and
  `session.end` (which writes `[]`).
- The atom is declared in `pins.tsx`, the only file that writes or reads it (the engine reads `read($, x)` only for an
  atom written in the same file); `pins.tsx` exports function declarations — `currentPins($)`, `togglePin($, pin)`,
  `unpin($, id)`, `clearPins($)`, the render hook body — and `register.tsx` registers the hook (`hooks.json` names
  only `register.tsx`).
- `on('ui.render', { component: 'AssistantMessage' })`: when `e.props.isSummary !== true`, the clean text is not empty,
  it is not an engine notice (`API Error`, `No response requested.`) and `e.viewport?.isFullscreen !== false`, the hook
  returns `[await next(e), pin icon]` in a column; otherwise `next(e)` as it is. The icon is a `plain` Button (no
  frame): pinned → `📌` in `#E3256B`; not pinned → `📌︎` in `#808080`. A press toggles the row's pin (`update`, no
  await before it). The draw only reads `pins`; a failed read draws the grey icon; a failed write is a toast; nothing
  throws.
- Known limit: after a hot reload the rows drawn before it are not drawn again until they scroll into view or change
  (1.5.0 § Probe run 2), so their icon can lag; a toggle in the list redraws every row that reads `pins`.

### B. The list under the `last answer` button (`hooks/answer.tsx`, `register.tsx`)

- A state value `answerListOpen: boolean` (absent → `false`), written only by the button's press and by the openers of
  the other views; `session.end` writes `false`.
- The list, the tasks view and the message viewer close each other, as the tasks view and the viewer do today
  (`register.tsx`, "each opener closes the other"): the list never sits beside the viewer, so `viewerFixedRows` does not
  change. The band scrolls a tree taller than `maxRows` itself (`n more` row), so a long list stays reachable.
- The button `[ last answer ▾ ]` (closed) / `[ last answer ▴ ]` (open): a press toggles the list; it no longer scrolls
  by itself (the owner: "must open and show a list"; one press became two — an owner check).
- The open list, under the account row, one row each:
  1. Always first: `› <text>` — the text of the row the press really goes to: the settled question's text, or while a
     question is pending, the text of `previous` with ` (sending…)` after it; a press is `pressLastAnswer` (the same
     targets, toasts and synchronous scroll). With no question: `› no question yet` (dim, no press). A stored 1.5.0
     value without text shows `› last question`.
  2. Then the pins, oldest first: a raspberry `📌` and the pin's text (`BUTTON_COLOR`); a press scrolls to the pin's row
     (`block: 'start'`, no `await` before the scroll; a deny or rejection is a toast; the pin stays); then a red `x`
     that unpins it.
  The list stays open after a scroll (the owner can jump between pins); the button closes it. It is drawn only when
  the button is (fullscreen).
- The text for the first row: `lastQuestion` gains the clean question text (first line, cut to 60) — settled
  `{ uuid, text }`, pending `{ pending, previous?, previousText? }`; `newestQuestion` (the restore) returns the text too.
  `settle` keeps comparing the pending fields only.

### C. Version and installer

- `plugin.json` `1.6.0`, its description names the pins and the list. `MOD_FILES` gains `hooks/pins.tsx` with
  `INTRODUCED['hooks/pins.tsx'] = [1, 6, 0]` (both `decide.mjs` copies, and the "eight files" wording there and in
  `tools/agent-models-decide.test.mjs` becomes nine); the `1.6.0` pins row (nine files) and `RELEASED_MOD` become that
  row; the installer tests that name the list are updated, with the upgrade of an 8-file 1.5.0 copy and a stray
  `hooks/pins.tsx` in the target; `research/module_tests.md` ("eight files").
- The 1.5.0 tests that change: the exact `toEqual({ uuid })` asserts (now `{ uuid, text }`), T1's exact label (now with
  `▾`), `accountRowCells` (the label's drawn width with the arrow), the press tests move to the first list row.
- No promotion and no bump (the owner's order above).

## Files

New `mods/agent-models/hooks/pins.tsx`, `tests/pins.test.tsx` (and fixtures as needed); `hooks/answer.tsx`,
`hooks/register.tsx` (the AssistantMessage hook, the openers closing each other), `types/index.d.ts`, `.claude-plugin/plugin.json`, the answer
tests; `settings/hooks/lib/agent-models-decide.mjs` + `.claude/hooks/lib/agent-models-decide.mjs`;
`tools/agent-models-pins.json` and the installer tests that name the file list; `research/module_tests.md`.

## Build order

1. Plan round (coai `review_plan` + an Opus review at once) until the stage advances.
2. RED: the tests below, watched failing for the right reason.
3. GREEN: A, then B, then C (Sonnet coder; Opus brief and review).
4. All checks: `npm ci --ignore-scripts`, `npm test`, `npm run check`, `node --test tools/`,
   `claude plugin test mods/agent-models`, `claude plugin validate`, `tsc` no new error, `node tools/plan-lifecycle.mjs`.
5. Code round (coai `review_code` + an Opus review), fixes, PR, checks, threads, merge. No promotion.
6. The move plan (`dew_flow_mods`) follows; the owner tests after its pin bumps.

## Test plan (`claude plugin test mods/agent-models`; installer tests by `node --test`)

| # | Case | Expected |
|---|---|---|
| P1 | an `AssistantMessage` row, fullscreen, not pinned | the row kept (`next(e)` in the tree) and a grey `📌︎` button under it |
| P2 | the same row pinned | a raspberry `📌` |
| P3 | `isSummary` block; a block empty after `cleanPrompts`; `isFullscreen: false` | `next(e)` unchanged, no icon |
| P4 | a press on the icon, then again | `pins` gains `{ id, text }`, then loses it; the text is the first clean line, cut to 60 with `…` |
| P5 | 51 pins | the oldest dropped |
| P6 | the render hook | never writes `$.state` |
| P7 | a refused read; a refused write | the grey icon; a toast; no throw |
| P8 | `session.end` | `pins` `[]` |
| P9 | a stored state from before 1.6.0 | `pins` `[]`, `answerListOpen` `false`, a 1.5.0 `{ uuid }` shows `› last question` |
| L1 | the button closed; pressed | `last answer ▾`; then `▴` and the list drawn under the account row |
| L2 | the open list with a question and two pins | `› <question>` first, then the two pins oldest first, each with an `x` |
| L3 | a press on the first row (fake scroll) | `pressLastAnswer`'s behaviour: one synchronous scroll to the question, `block: 'start'` |
| L4 | a press on a pin row (fake scroll) | one synchronous scroll to the pin's `id`, `block: 'start'`; a deny → toast |
| L5 | a press on `x` | the pin removed; the list redraws without it; the icon under its row turns grey |
| L6 | no question yet | `› no question yet`, dim, no press |
| L7 | the list stays open after a scroll; the button closes it | as stated |
| L8 | the list open, then the tasks view or the message viewer opened; and the reverse | each opener closes the other |
| L9 | `isFullscreen: false` | no button, no list |
| L10 | the first row while a question is pending (with `previous`) | the text of `previous` with ` (sending…)`; the press goes to `previous` |
| L11 | 50 pins, the list open | every pin row drawn; the band scrolls it (no throw, nothing cut by the mod) |
| L12 | a pin whose row is gone (the scroll is denied) | a toast; the pin stays |
| P10 | a block whose `requestId` is not uuid-shaped (`placeholder`) | no icon |
| P11 | an engine notice block (`API Error…`, `No response requested.`) | no icon |
| P12 | a block starting with a heading, a quote, a list or a fence | the pin text is the first content line without the marks |
| P13 | two text blocks of one reply | two icons, two pins, each scrolls to its own block |
| I1 | installer: `MOD_FILES` has nine files; a 1.5.0 copy upgrades to 1.6.0 | `hooks/pins.tsx` copied; the pins row = HEAD files = `RELEASED_MOD` |
| R1 | the existing 341 mod tests, with the changes named in § C, and `node --test tools/` | pass |

## Owner checks (after the move and the pin bumps, by the owner's order)

- Pin two answers (grey → raspberry), open the `last answer` list: the last question first, then the two pins; each
  scrolls to its row; `x` unpins (the icon turns grey at once).
- Tool rows, service rows and the owner's own messages have no icon; the icon has no `[ ]` frame.
- The button now needs two presses to reach the last question (open, then the first row): acceptable?
- `/clear` empties the list; a long resumed session shows no lag when a pin is toggled.
- After a hot reload, older answers get their icon when they scroll into view (known limit).

## Definition of Done

- [ ] Plan round advanced; Opus plan review folded.
- [ ] Tests P1–P13, L1–L12, I1, R1 green; RED seen first for each new case.
- [ ] All checks of build order 4 green.
- [ ] Code round advanced; Opus code review done; findings fixed or answered.
- [ ] PR merged with green checks and no open thread. No promotion (the owner's order).
- [ ] Owner checks reported after the move; this plan promoted to `research/` with what shipped differently.
