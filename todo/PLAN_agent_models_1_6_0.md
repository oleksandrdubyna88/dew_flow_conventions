# PLAN — agent-models mod 1.6.0: pins on Claude's answers, and a list under the `last answer` button

> Status: **DRAFT, 2026-11-23.** Plan round not run yet. Scope: `mods/agent-models/` (a pin icon under each of
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

A `📌` button under every `UserMessage`, `AssistantMessage` and `ToolUse` row, pins listed in the band, a press on a
listed pin scrolling to its row (`block: 'start'`), a red `x` removing it. Then, by the owner's words above: no word,
an icon only — grey `📌︎` (`#808080`) unpinned, raspberry `📌` (`#E3256B`) pinned, a press toggling; only under
`AssistantMessage` rows that are not `isSummary` and not empty; pins in `$.state`. The owner: "everything works fast".
The engine draws a Button's label inside `[ ]`.

## Design

### A. Pins (`hooks/pins.tsx`, new; `types/index.d.ts`)

- A state value `pins: readonly Pin[]` in `PluginState['agent-models']`, `Pin = { id: string; text: string }`: `id` the
  row's `requestId`, `text` the block's first line after the mod's `cleanPrompts`, cut to 60 characters (with `…`).
  Absent (a state from before 1.6.0) reads as `[]`. At most 50 pins: a 51st press drops the oldest. Written only by
  press handlers and `session.end` (which writes `[]`, as the `lastQuestion` value is cleared there).
- `on('ui.render', { component: 'AssistantMessage' })`: when `e.props.isSummary !== true`, the clean text is not empty
  and `e.viewport?.isFullscreen !== false`, the hook returns `[await next(e), pin icon]` in a column; otherwise
  `next(e)` as it is. The icon reads `pins` (a read, never a write): pinned → `📌` in `#E3256B`; not pinned →
  `📌︎` in `#808080`. A press toggles the row's pin (`update`, no await before it). A failed read draws the grey
  icon; a failed write is a toast; nothing throws.

### B. The list under the `last answer` button (`hooks/answer.tsx`, `register.tsx`)

- A state value `answerListOpen: boolean` (absent → `false`), written only by the button's press.
- The button `[ last answer ▾ ]` (closed) / `[ last answer ▴ ]` (open): a press toggles the list; it no longer scrolls
  by itself.
- The open list, under the account row, one row each:
  1. Always first: `› <the last question's text>`, a press is today's `pressLastAnswer` (the same targets, toasts and
     synchronous scroll). With no question: `› no question yet` (dim, no press).
  2. Then the pins, oldest first: `📌 <text>` (raspberry icon, the text in `BUTTON_COLOR`), a press scrolls to the
     pin's row (`block: 'start'`, no `await` before the scroll; a deny or rejection is a toast), then a red `x` that
     unpins it.
  The list stays open after a scroll (the owner can jump between pins); the button closes it. It is drawn only when
  the button is (fullscreen).
- The last question's text for the first row: `lastQuestion` keeps the question's text from 1.6.0 on (`{ uuid, text }`
  when settled; the pending value already has it); a stored 1.5.0 `{ uuid }` without text shows `› last question`.
- The viewer's fixed row count adds the open list's rows (1 + the number of pins), each counted at its width.

### C. Version and installer

- `plugin.json` `1.6.0`, its description names the pins and the list. `MOD_FILES` gains `hooks/pins.tsx` with
  `INTRODUCED['hooks/pins.tsx'] = [1, 6, 0]` (both `decide.mjs` copies); the `1.6.0` pins row (nine files) and
  `RELEASED_MOD` become that row; the installer tests that name the list are updated; a 1.5.0 copy upgrades.
- No promotion and no bump (the owner's order above).

## Files

New `mods/agent-models/hooks/pins.tsx`, `tests/pins.test.tsx` (and fixtures as needed); `hooks/answer.tsx`,
`hooks/register.tsx`, `hooks/prompts.ts` (row count), `types/index.d.ts`, `.claude-plugin/plugin.json`, the answer
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
| L8 | the viewer row count with the list open (two pins, a long question) | the list rows counted at their width |
| L9 | `isFullscreen: false` | no button, no list |
| I1 | installer: `MOD_FILES` has nine files; a 1.5.0 copy upgrades to 1.6.0 | `hooks/pins.tsx` copied; the pins row = HEAD files = `RELEASED_MOD` |
| R1 | the existing 341 mod tests (the button's press now opens the list: the 1.5.0 press tests move to the first list row) and `node --test tools/` | pass |

## Owner checks (after the move and the pin bumps, by the owner's order)

- Pin two answers (grey → raspberry), open the `last answer` list: the last question first, then the two pins; each
  scrolls to its row; `x` unpins (the icon turns grey at once).
- Tool rows, service rows and the owner's own messages have no icon.

## Definition of Done

- [ ] Plan round advanced; Opus plan review folded.
- [ ] Tests P1–P9, L1–L9, I1, R1 green; RED seen first for each new case.
- [ ] All checks of build order 4 green.
- [ ] Code round advanced; Opus code review done; findings fixed or answered.
- [ ] PR merged with green checks and no open thread. No promotion (the owner's order).
- [ ] Owner checks reported after the move; this plan promoted to `research/` with what shipped differently.
