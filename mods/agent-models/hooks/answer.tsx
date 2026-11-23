// The `last answer` button (1.5.0) and its list (1.6.0): the button opens a list under the account row whose first row brings the
// owner's last question to the top of the transcript window, so the answer starts right under it, and whose other rows are the pins
// (hooks/pins.tsx). The target is the question's transcript uuid, kept in `$.state` at the person's submit: the press must call
// `$.ui.scroll` at once (an `await` before it makes the engine refuse the scroll, measured 2026-11-22), and after a hot reload the
// rows drawn earlier are not drawn again, so no list of drawn rows could be searched. Every function that takes `$` is a function
// declaration (an arrow taking `$` is refused across an import). Nothing here throws out of a hook.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, PromptSubmitInput, PromptSubmitResult, SessionMessage, UiScrollArgs, UiScrollResult } from 'claude-code'

import type { LastQuestion, Pin } from '../types'
import { BUTTON_COLOR, CLOSE_COLOR, cleanPrompts, ENTRY_CAP } from './prompts'
import type { ScrollPress } from './pins'
import { cutText, PIN_COLOR, PIN_ICON, pinPress, runPress, unpin } from './pins'

export const ANSWER_LABEL = 'last answer'
export const ANSWER_KEY = 'last-answer'
export const LIST_ROW_KEY = 'answer-last' // the list's first row
export const NO_QUESTION_ROW = '› no question yet'
export const OLD_QUESTION = 'last question' // the first row of a question stored by 1.5.0, which kept no text
export const LOOKUP_ROWS = 50 // a submit's lookup: the question is among the newest rows (it was just typed)
export const RESTORE_ROWS = 200 // a session start's lookup reads this many rows first, the engine cap only when none is a question
export const SUMMARY_PREFIX = 'This session is being continued from a previous conversation'
const PERSON_ORIGINS: ReadonlySet<string> = new Set(['composer', 'bridge'])
const BUTTON_FRAME = 4 // `[ ` and ` ]` around a Button's label
const GAP = 2
const PEER_WRAPPER = /^<(?:teammate-message|agent-message)[\s>]/ // another agent's words: `cleanPrompts` drops only the engine's own tags

// The engine's scan reads `read($, x)` only for an atom written in the same file: register.tsx reads this one through here.
const lastQuestion = atom({ plugin: 'agent-models', key: 'lastQuestion' } as const, null as LastQuestion)
const answerListOpen = atom({ plugin: 'agent-models', key: 'answerListOpen' } as const, false)

export async function currentLastQuestion($: EngineInterface): Promise<LastQuestion> {
  return (await read($, lastQuestion)) ?? null // a state stored before 1.5.0 has none
}

export async function currentAnswerListOpen($: EngineInterface): Promise<boolean> {
  return (await read($, answerListOpen)) === true // a state stored before 1.6.0 has none: closed
}

// --- pure ---

const isQuestionRow = (m: SessionMessage): m is SessionMessage & { uuid: string } =>
  m.role === 'user' && (m.toolResults?.length ?? 0) === 0 && typeof m.uuid === 'string'

/**
 * The uuid of the NEWEST user row whose clean text is `text`, among the rows newer than the row `notBefore` (that row and the older
 * ones are an earlier question: the same words asked again are not found until they are in the transcript). Rows are scanned newest
 * first and the scan stops at `notBefore`; with no boundary the whole window is scanned. Undefined while there is none.
 */
export function findQuestion(rows: readonly SessionMessage[], text: string, notBefore?: string): string | undefined {
  const wanted = cleanPrompts([text])[0] // both sides are compared clean; a text that is empty when clean matches nothing
  if (wanted === undefined) return undefined
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i]
    if (row === undefined) continue
    if (notBefore !== undefined && row.uuid === notBefore) return undefined
    if (isQuestionRow(row) && cleanPrompts([row.text])[0] === wanted) return row.uuid
  }
  return undefined
}

// The first row's text: the first line of the clean question, spaces collapsed, cut. The owner's own marks stay (it is no markdown block).
const firstLine = (clean: string): string => cutText((clean.split('\n').find(line => line.trim() !== '') ?? '').replace(/\s+/g, ' ').trim())

/** The text the list shows for a question the person typed; undefined when it is empty once clean. */
export function questionText(raw: string): string | undefined {
  const clean = cleanPrompts([raw])[0]
  return clean === undefined ? undefined : firstLine(clean)
}

const textPart = (text: string | undefined): { text?: string } => (text === undefined ? {} : { text })

/** The newest row the person typed (its uuid and clean first line): not a tool result, a compaction summary or a notification or peer wrapper (a tag the person typed is fine). */
export function newestQuestion(rows: readonly SessionMessage[]): { uuid: string; text: string } | undefined {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i]
    if (row === undefined || !isQuestionRow(row)) continue
    const clean = cleanPrompts([row.text])[0]
    if (clean !== undefined && !clean.startsWith(SUMMARY_PREFIX) && !PEER_WRAPPER.test(row.text.trimStart())) return { uuid: row.uuid, text: firstLine(clean) }
  }
  return undefined
}

/** Whether the button is drawn: not on the terminal's main screen, where the transcript is its own scrollback and no scroll works. */
export const isAnswerShown = (viewport: { isFullscreen?: boolean } | undefined): boolean => viewport?.isFullscreen !== false

/** The button's label: an arrow says the list is closed (down) or open (up). */
export const answerLabel = (isOpen: boolean): string => `${ANSWER_LABEL} ${isOpen ? '▴' : '▾'}`

/** The cells the account row takes when it is drawn without the messages button (the open viewer): what wraps at the band's width. */
export function accountRowCells(row: { account: string; isKnown: boolean; isLoginPending: boolean; tasks: string; isAnswerShown: boolean }): number {
  const framed = (label: string): number => label.length + BUTTON_FRAME
  return (
    (row.isKnown ? framed(row.account) : row.account.length) +
    GAP + framed('login') + (row.isLoginPending ? ' logging in…'.length : 0) +
    GAP + framed(row.tasks) +
    (row.isAnswerShown ? GAP + framed(answerLabel(false)) : 0)
  )
}

// --- the press ---

/**
 * The press on the list's first row. With a uuid (or the `previous` of a pending question) it calls `scroll` BEFORE it yields (no `await` ahead of the call), then tells a
 * refusal in a toast; the scroll and the toast are arguments so a test can hand fakes. Never throws.
 */
export async function pressLastAnswer(scroll: (args: UiScrollArgs) => Promise<UiScrollResult>, toast: (text: string) => void, question: LastQuestion): Promise<void> {
  if (question === null) return toast('last answer: no question yet')
  const press = firstRowPress(question)
  if (press === undefined) return toast('last answer: your question is not in the transcript yet')
  return runPress(scroll, toast, press)
}

/** The press on the list's first row: the question's uuid, or (a pending question is not in the transcript yet) the question before it; undefined when there is none. */
export function firstRowPress(question: Exclude<LastQuestion, null>): ScrollPress | undefined {
  const id = 'uuid' in question ? question.uuid : question.previous
  return id === undefined ? undefined : { label: 'last answer', id }
}

/** What the first row says: the settled question's text; a pending one's press goes to the question before it, so it says that one's text and that the new one is on its way. */
export function questionRowText(question: Exclude<LastQuestion, null>): string {
  if ('uuid' in question) return question.text ?? OLD_QUESTION
  const before = question.previous === undefined ? questionText(question.pending) : question.previousText
  return `${before ?? OLD_QUESTION} (sending…)`
}

// The button opens or closes the list. Opening closes the tasks view and the message viewer (`closeOthers`): the three are never open
// together, so the viewer's row count stays what it was.
export async function toggleAnswerList($: EngineInterface, closeOthers: () => Promise<unknown>): Promise<void> {
  try {
    const isOpen = await read($, answerListOpen)
    if (!isOpen) await closeOthers().catch(() => undefined)
    await update($, answerListOpen, cur => !cur)
  } catch {
    // a refused read or write: the list stays as it was; the next press tries again
  }
}

/** Another view is opening: the list closes (a write only when it is open). Never rejects. */
export async function closeAnswerList($: EngineInterface): Promise<void> {
  try {
    if (await read($, answerListOpen)) await update($, answerListOpen, () => false)
  } catch {
    // the next press of the button repairs it
  }
}

/** At a session end: the list is closed. Never rejects. */
export async function clearAnswerList($: EngineInterface): Promise<void> {
  try {
    await update($, answerListOpen, () => false)
  } catch {
    // a refused write: the list stays; the pins it showed are gone
  }
}

type RenderEvent = Parameters<EngineInterface['ui']['resolve']>[0]

export function answerButton($: EngineInterface, e: RenderEvent, isOpen: boolean, closeOthers: () => Promise<unknown>) {
  const { Button, Text } = $.ui.resolve(e)
  const label = answerLabel(isOpen)
  return (
    <Button key={ANSWER_KEY} label={label} onPress={() => void toggleAnswerList($, closeOthers)}>
      <Text color={BUTTON_COLOR}>{label}</Text>
    </Button>
  )
}

function pinRow($: EngineInterface, e: RenderEvent, pin: Pin) {
  const { Box, Button, Text } = $.ui.resolve(e)
  return (
    <Box key={`pin-row-${pin.id}`}>
      <Button key={`pin-go-${pin.id}`} label={`${PIN_ICON} ${pin.text}`} onPress={() => void runPress(args => $.ui.scroll(args), text => $.ui.toast(text), pinPress(pin))}>
        <Text color={PIN_COLOR}>{PIN_ICON}</Text>
        <Text color={BUTTON_COLOR}>{` ${pin.text}`}</Text>
      </Button>
      <Text>{'  '}</Text>
      <Button key={`pin-x-${pin.id}`} label="unpin" onPress={() => void unpin($, pin.id)}>
        <Text color={CLOSE_COLOR}>x</Text>
      </Button>
    </Box>
  )
}

/** The open list: the last question first, then the pins oldest first (the band scrolls a list taller than its room). */
export function answerList($: EngineInterface, e: RenderEvent, question: LastQuestion, pins: readonly Pin[]) {
  const { Box, Button, Text } = $.ui.resolve(e)
  return (
    <Box flexDirection="column">
      {question === null ? (
        <Text dimColor>{NO_QUESTION_ROW}</Text>
      ) : (
        <Button key={LIST_ROW_KEY} label={`› ${questionRowText(question)}`} onPress={() => void pressLastAnswer(args => $.ui.scroll(args), text => $.ui.toast(text), question)}>
          <Text color={BUTTON_COLOR}>{`› ${questionRowText(question)}`}</Text>
        </Button>
      )}
      {pins.map(pin => pinRow($, e, pin))}
    </Box>
  )
}

// --- knowing the question before any press ---

let generation = 0 // the newest person's submit (or session end) this module saw: older work stops being the value's writer

async function recentRows($: EngineInterface, last: number): Promise<readonly SessionMessage[]> {
  const rows = await $.session.messages({ last })
  return Array.isArray(rows) ? rows : [] // a deny is no rows
}

// What a new pending question keeps of the value before it: the uuid of the question it replaces (`previous`) and its text.
const previousOf = (cur: LastQuestion): { previous?: string; previousText?: string } => {
  if (cur === null) return {}
  if ('uuid' in cur) return { previous: cur.uuid, ...(cur.text === undefined ? {} : { previousText: cur.text }) }
  if (cur.previous === undefined) return {}
  return { previous: cur.previous, ...(cur.previousText === undefined ? {} : { previousText: cur.previousText }) }
}

type Pending = { pending: string; previous?: string }

// The pending question becomes its uuid, only while it is still that pending question (same text, same `previous`; a stored `queued`
// of a 1.5.0 candidate is ignored) and `mine` is still the newest generation (a session end or a newer submit owns the value).
async function settle($: EngineInterface, pending: Pending, uuid: string, mine: number): Promise<void> {
  await update($, lastQuestion, cur => (
    mine === generation && cur !== null && 'pending' in cur && cur.pending === pending.pending && cur.previous === pending.previous ? { uuid, ...textPart(questionText(pending.pending)) } : cur
  ))
}

/**
 * After `next(e)` of a `prompt.submit`: a prompt the person typed (here or through the bridge) becomes the last question. A
 * notification, a peer, a plugin, a meta prompt, a slash command and a dropped prompt leave the value as it is. The value is
 * `pending` (with the question before it as `previous`) while the text is not in the transcript (queued behind a running turn,
 * or typed into one). The pending write is the first thing here, with no `await` before it, so submits start in their order;
 * the writes may land out of order, and the value is still the newest submit's: the change function checks the generation, and
 * `update` runs it again on a version miss. Never rejects.
 */
export async function noteSubmit($: EngineInterface, e: PromptSubmitInput, result: PromptSubmitResult): Promise<void> {
  try {
    if (result.drop !== undefined || e.command !== undefined || e.isMeta === true || !PERSON_ORIGINS.has(e.origin.kind)) return
    const entered = result.text
    const mine = (generation += 1)
    const written = await update($, lastQuestion, cur => (mine === generation ? { pending: entered, ...previousOf(cur) } : cur))
    if (mine !== generation || written === null || !('pending' in written)) return // a newer submit (or a session end) owns the value
    const uuid = findQuestion(await recentRows($, LOOKUP_ROWS), entered, written.previous)
    if (uuid !== undefined && mine === generation) await settle($, written, uuid, mine)
  } catch {
    // a refused read or write: the value stays as it was; the next submit or turn tries again
  }
}

/**
 * At `turn.start` and `turn.complete`: a pending question (it was queued) is looked for again, never at or before its `previous`. A lookup
 * that began before a session end or a newer submit writes nothing (the module generation, as in `noteSubmit` and `restoreQuestion`).
 * `isDeep` (the turn's end): when the newest rows do not hold it and do not reach back to `previous` (a long answer is in between),
 * a longer read reaches the engine cap. Never rejects.
 */
export async function retryPending($: EngineInterface, isDeep: boolean): Promise<void> {
  const mine = generation // a session end (or a newer submit) during the reads below owns the value
  try {
    const cur = await read($, lastQuestion)
    if (cur === null || !('pending' in cur)) return
    const recent = await recentRows($, LOOKUP_ROWS)
    let uuid = findQuestion(recent, cur.pending, cur.previous)
    // a longer read only when the newest rows may hide the question: they do not reach back to `previous`
    const reachesPrevious = cur.previous !== undefined && recent.some(row => row.uuid === cur.previous)
    if (uuid === undefined && isDeep && recent.length >= LOOKUP_ROWS && !reachesPrevious) uuid = findQuestion(await recentRows($, ENTRY_CAP), cur.pending, cur.previous)
    if (uuid !== undefined && mine === generation) await settle($, cur, uuid, mine)
  } catch {
    // the next turn tries again
  }
}

/** At a session start with no value (a resume, or a session from before 1.5.0): the newest question of the transcript. Never rejects. */
export async function restoreQuestion($: EngineInterface): Promise<void> {
  const mine = generation // a session end (or a submit) during the reads below owns the value
  try {
    if ((await read($, lastQuestion)) !== null) return // a reload keeps the session: the value stays
    const recent = await recentRows($, RESTORE_ROWS)
    let found = newestQuestion(recent)
    if (found === undefined && recent.length >= RESTORE_ROWS) found = newestQuestion(await recentRows($, ENTRY_CAP))
    if (found !== undefined) {
      const restored = found
      await update($, lastQuestion, cur => (cur === null && mine === generation ? restored : cur))
    }
  } catch {
    // the transcript is not readable yet; the first submit sets the value
  }
}

/** At a session end (a `/clear` raises no `session.start`): the value is cleared, and work still in flight stops writing. Never rejects. */
export async function clearQuestion($: EngineInterface): Promise<void> {
  generation += 1
  try {
    await update($, lastQuestion, () => null)
  } catch {
    // a refused write: the next session's first submit replaces the value
  }
}
