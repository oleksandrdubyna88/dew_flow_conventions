// The pins (1.6.0): a small icon under each of Claude's text answers; a press pins the block, and the pins are the rows of the `last
// answer` list (hooks/answer.tsx). The pins live in `$.state`: a press writes, every drawing that reads them is drawn again at once.
// A render hook only reads: a press handler and the session end are the only writers. This file owns the `pins` atom (the engine's
// scan reads `read($, x)` only for an atom written in the same file), and every function that takes `$` is a function declaration
// (an arrow taking `$` is refused across an import). Nothing here throws out of a hook.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderInput, RenderResultOf, UiScrollArgs, UiScrollResult } from 'claude-code'

import type { Pin } from '../types'
import { cleanPrompts, reasonLine } from './prompts'

export const PIN_LIMIT = 50
export const TEXT_MAX = 60 // the cut of a pin's text and of the question's text, the ellipsis included
export const PREFIX_MAX = 4096 // a block's text is read this far and no further: a streamed answer is drawn again on every chunk
export const PIN_ICON = '\u{1F4CC}' // pinned: the picture
export const PIN_ICON_OFF = '\u{1F4CC}︎' // not pinned: the text form, drawn in the grey of its Text where the terminal honours it
export const PIN_COLOR = '#E3256B' // raspberry
export const PIN_OFF_COLOR = '#808080'

const BLOCK_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i // a transcript block's id; a `placeholder` draw has no row to scroll to
const NOTICE = /^(?:API Error|No response requested\.)/ // the engine's own notices are no answer of Claude's
const FENCE = /^(?:`{3,}|~{3,})/
const LINE_MARKS = /^(?:#{1,6}(?:\s+|$)|>\s*|[-*+]\s+|\d{1,9}[.)]\s+)+/ // heading, quote, list item and number marks, in any run

const pins = atom({ plugin: 'agent-models', key: 'pins' } as const, [] as readonly Pin[])

const listOf = (value: unknown): readonly Pin[] => (Array.isArray(value) ? value : []) // a state stored before 1.6.0 has none

/** The pins now, oldest first; none when the read is refused (the draw then shows the not-pinned icon). */
export async function currentPins($: EngineInterface): Promise<readonly Pin[]> {
  try {
    return listOf(await read($, pins))
  } catch {
    return []
  }
}

// --- pure ---

/** `text` as it is, or cut to `TEXT_MAX` characters (an ellipsis is the last one); a cut never splits a character. Reads at most `TEXT_MAX + 1` characters. */
export function cutText(text: string): string {
  let head = ''
  let count = 0
  for (const char of text) {
    if (count === TEXT_MAX) return `${head}…` // a 61st character: the text is cut after the first 59
    if (count < TEXT_MAX - 1) head += char
    count += 1
  }
  return text
}

/**
 * The first content line of a markdown block: blank lines and fence lines skipped, the line's marks dropped, spaces collapsed, cut. ''
 * when none. Only the first `PREFIX_MAX` characters are read (a streamed answer is drawn again on every chunk): a first content line
 * that starts past them gives ''.
 */
export function headLine(text: string): string {
  for (const raw of text.slice(0, PREFIX_MAX).split('\n')) {
    const line = raw.trim()
    if (line === '' || FENCE.test(line)) continue
    const bare = line.replace(LINE_MARKS, '').replace(/\s+/g, ' ').trim()
    if (bare !== '') return cutText(bare)
  }
  return ''
}

/** What a pin of a block shows, or undefined when the block gets no pin: empty when clean, or an engine notice. Reads the first `PREFIX_MAX` characters only (a reminder block that is not closed inside them is kept as text). */
export function pinText(raw: string): string | undefined {
  const clean = cleanPrompts([raw.slice(0, PREFIX_MAX)])[0] // the prefix first: the clean-up and the split never meet the whole answer
  if (clean === undefined || NOTICE.test(clean)) return undefined
  const head = headLine(clean)
  return head === '' ? undefined : head
}

/** The list after a press on `pin`: removed when it is there, else added at the end; past `PIN_LIMIT` the oldest is dropped. */
export function nextPins(cur: readonly Pin[], pin: Pin): readonly Pin[] {
  if (cur.some(p => p.id === pin.id)) return cur.filter(p => p.id !== pin.id)
  return [...cur, pin].slice(-PIN_LIMIT)
}

// --- the presses ---

/**
 * Brings the row `id` to the top of the transcript window and tells a refusal in a toast headed `label`. It calls `scroll` BEFORE it
 * yields (no `await` ahead of the call: the engine refuses a scroll that follows an await, measured 2026-11-22); the scroll and the
 * toast are arguments so a test can hand fakes. Never throws.
 */
export async function scrollToRow(scroll: (args: UiScrollArgs) => Promise<UiScrollResult>, toast: (text: string) => void, label: string, id: string): Promise<void> {
  try {
    const result = await scroll({ to: { requestId: id }, block: 'start' })
    if (result.deny !== undefined) {
      toast(result.deny.includes('none scrolls') ? `${label}: works in fullscreen only` : `${label}: ${reasonLine(result.deny)}`)
    }
  } catch (error) {
    toast(`${label}: ${reasonLine(error)}`)
  }
}

/** What a drawn press scrolls to: the row `id`, told in a toast headed `label` when the scroll is refused. */
export type ScrollPress = { readonly label: string; readonly id: string }

/** The press on a pin's row of the list: the pin's block (its id, never its text); the pin stays whatever the engine says. */
export const pinPress = (pin: Pin): ScrollPress => ({ label: 'pin', id: pin.id })

/** Runs a drawn press: `scrollToRow` with the press's target. The scroll is called before this yields. */
export function runPress(scroll: (args: UiScrollArgs) => Promise<UiScrollResult>, toast: (text: string) => void, press: ScrollPress): Promise<void> {
  return scrollToRow(scroll, toast, press.label, press.id)
}

/** The pin a press on `pin` drops: the oldest, when `pin` is new to a full list; undefined otherwise. */
export function droppedPin(cur: readonly Pin[], pin: Pin): Pin | undefined {
  return cur.length >= PIN_LIMIT && !cur.some(p => p.id === pin.id) ? cur[0] : undefined
}

/** What a press tells in a toast; the toast is a no-op when it is refused too (nothing is left to tell). */
async function tell($: EngineInterface, text: string): Promise<void> {
  try {
    await $.ui.toast(text)
  } catch {
    // the toast is refused: nothing is left to tell
  }
}

let generation = 0 // bumped by a session end: a press that began before it is no writer of the pins any more (as answer.tsx's `generation`)

// `update` is the first call (no `await` before it; `mine` is read before it). `dropped` is set by every run of the change function
// (`update` may run it again on a version miss), so it is what the write that landed dropped; the toast comes after the write. A run
// after a session end (a press whose write was late, then retried) returns the value as it is and drops nothing.
async function change($: EngineInterface, next: (cur: readonly Pin[]) => { list: readonly Pin[]; dropped?: Pin }): Promise<void> {
  const run: { dropped?: Pin } = {}
  const mine = generation
  try {
    await update($, pins, cur => {
      if (mine !== generation) {
        run.dropped = undefined
        return cur
      }
      const step = next(listOf(cur))
      run.dropped = step.dropped
      return step.list
    })
  } catch (error) {
    return tell($, `pin: ${reasonLine(error)}`)
  }
  if (run.dropped !== undefined) await tell($, `pin: oldest pin removed — ${run.dropped.text}`)
}

/** A press on the icon under a block: pins it, or unpins it; a 51st pin drops the oldest and a toast names it. A refused write is a toast. */
export async function togglePin($: EngineInterface, pin: Pin): Promise<void> {
  await change($, cur => ({ list: nextPins(cur, pin), dropped: droppedPin(cur, pin) }))
}

/** A press on the `x` of a pin's row. */
export async function unpin($: EngineInterface, id: string): Promise<void> {
  await change($, cur => ({ list: cur.filter(p => p.id !== id) }))
}

/** At a session end (a `/clear` raises no `session.start`): no pins. Never rejects. */
export async function clearPins($: EngineInterface): Promise<void> {
  generation += 1 // before the write: a press still in flight stops writing
  try {
    await update($, pins, () => [])
  } catch {
    // a refused write: the next session's presses replace the list
  }
}

// --- the icon under a block ---

type AnswerEvent = RenderInput<'AssistantMessage'>

/**
 * The `AssistantMessage` hook's tree: the engine's row (`row`, what `next(e)` drew) with the pin icon under it, or the row as it is for
 * a summary block, a block with no pin text (empty, an engine notice), an id that is no transcript block's and the terminal's main
 * screen (no scroll works there). Only reads the pins.
 */
export async function pinnedRow($: EngineInterface, e: AnswerEvent, row: RenderResultOf['AssistantMessage']) {
  const id = e.requestId
  const text = e.props.isSummary === true || !BLOCK_ID.test(id) || e.viewport?.isFullscreen === false ? undefined : pinText(e.props.text)
  if (text === undefined) return row
  const isPinned = (await currentPins($)).some(p => p.id === id)
  const { Box, Button, Text } = $.ui.resolve(e)
  return (
    <Box flexDirection="column">
      {row}
      <Button key={`pin-${id}`} plain label={isPinned ? 'unpin' : 'pin'} onPress={() => void togglePin($, { id, text })}>
        {isPinned ? <Text color={PIN_COLOR}>{PIN_ICON}</Text> : <Text color={PIN_OFF_COLOR}>{PIN_ICON_OFF}</Text>}
      </Button>
    </Box>
  )
}
