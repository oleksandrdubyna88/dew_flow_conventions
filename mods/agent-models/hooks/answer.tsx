// The `last answer` button (1.5.0): a press brings the owner's last question to the top of the transcript window, so the answer starts
// right under it. The target is the question's transcript uuid, kept in `$.state` at the person's submit: the press must call
// `$.ui.scroll` at once (an `await` before it makes the engine refuse the scroll, measured 2026-11-22), and after a hot reload the
// rows drawn earlier are not drawn again, so no list of drawn rows could be searched. Every function that takes `$` is a function
// declaration (an arrow taking `$` is refused across an import). Nothing here throws out of a hook.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, PromptSubmitInput, PromptSubmitResult, SessionMessage, UiScrollArgs, UiScrollResult } from 'claude-code'

import type { LastQuestion } from '../types'
import { BUTTON_COLOR, cleanPrompts, ENTRY_CAP, reasonLine } from './prompts'

export const ANSWER_LABEL = 'last answer'
export const ANSWER_KEY = 'last-answer'
export const LOOKUP_ROWS = 50 // a submit's lookup: the question is among the newest rows (it was just typed)
export const RESTORE_ROWS = 200 // a session start's lookup reads this many rows first, the engine cap only when none is a question
export const SUMMARY_PREFIX = 'This session is being continued from a previous conversation'
const PERSON_ORIGINS: ReadonlySet<string> = new Set(['composer', 'bridge'])
const BUTTON_FRAME = 4 // `[ ` and ` ]` around a Button's label
const GAP = 2
const PEER_WRAPPER = /^<(?:teammate-message|agent-message)[\s>]/ // another agent's words: `cleanPrompts` drops only the engine's own tags

// The engine's scan reads `read($, x)` only for an atom written in the same file: register.tsx reads this one through here.
const lastQuestion = atom({ plugin: 'agent-models', key: 'lastQuestion' } as const, null as LastQuestion)

export async function currentLastQuestion($: EngineInterface): Promise<LastQuestion> {
  return (await read($, lastQuestion)) ?? null // a state stored before 1.5.0 has none
}

// --- pure ---

const isQuestionRow = (m: SessionMessage): m is SessionMessage & { uuid: string } =>
  m.role === 'user' && (m.toolResults?.length ?? 0) === 0 && typeof m.uuid === 'string'

/**
 * The uuid of a user row whose clean text is `text`, among the rows newer than the row `notBefore` (that row and the older ones are
 * an earlier question: the same words asked again are not found until they are in the transcript). The matching rows are taken in
 * transcript order, oldest first, and the answer is the one at index `queued` (0: the first copy; a person who queued the same
 * words twice gets the second copy with 1); undefined while there are fewer.
 */
export function findQuestion(rows: readonly SessionMessage[], text: string, notBefore?: string, queued = 0): string | undefined {
  const wanted = cleanPrompts([text])[0] // both sides are compared clean; a text that is empty when clean matches nothing
  if (wanted === undefined) return undefined
  const found: string[] = [] // newest first
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i]
    if (row === undefined) continue
    if (notBefore !== undefined && row.uuid === notBefore) break
    if (isQuestionRow(row) && cleanPrompts([row.text])[0] === wanted) found.push(row.uuid)
  }
  // With a boundary every match is a copy submitted after it: the oldest is the first queued one. With none, older copies of the
  // same words can be in the window, so the newest is the question.
  return notBefore === undefined && queued === 0 ? found[0] : found[found.length - 1 - queued]
}

/** The uuid of the newest row the person typed: not a tool result, a compaction summary or a notification or peer wrapper (a tag the person typed is fine). */
export function newestQuestion(rows: readonly SessionMessage[]): string | undefined {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i]
    if (row === undefined || !isQuestionRow(row)) continue
    const clean = cleanPrompts([row.text])[0]
    if (clean !== undefined && !clean.startsWith(SUMMARY_PREFIX) && !PEER_WRAPPER.test(row.text.trimStart())) return row.uuid
  }
  return undefined
}

/** Whether the button is drawn: not on the terminal's main screen, where the transcript is its own scrollback and no scroll works. */
export const isAnswerShown = (viewport: { isFullscreen?: boolean } | undefined): boolean => viewport?.isFullscreen !== false

/** The cells the account row takes when it is drawn without the messages button (the open viewer): what wraps at the band's width. */
export function accountRowCells(row: { account: string; isKnown: boolean; isLoginPending: boolean; tasks: string; isAnswerShown: boolean }): number {
  const framed = (label: string): number => label.length + BUTTON_FRAME
  return (
    (row.isKnown ? framed(row.account) : row.account.length) +
    GAP + framed('login') + (row.isLoginPending ? ' logging in…'.length : 0) +
    GAP + framed(row.tasks) +
    (row.isAnswerShown ? GAP + framed(ANSWER_LABEL) : 0)
  )
}

// --- the press ---

/**
 * The press. With a uuid (or the `previous` of a pending question) it calls `scroll` BEFORE it yields (no `await` ahead of the call), then tells a refusal in a toast; the
 * scroll and the toast are arguments so a test can hand fakes. Never throws.
 */
export async function pressLastAnswer(scroll: (args: UiScrollArgs) => Promise<UiScrollResult>, toast: (text: string) => void, question: LastQuestion): Promise<void> {
  if (question === null) return toast('last answer: no question yet')
  // A pending question is not in the transcript yet: the question before it is the one being answered now.
  const target = 'uuid' in question ? question.uuid : question.previous
  if (target === undefined) return toast('last answer: your question is not in the transcript yet')
  try {
    const result = await scroll({ to: { requestId: target }, block: 'start' })
    if (result.deny !== undefined) {
      toast(result.deny.includes('none scrolls') ? 'last answer: works in fullscreen only' : `last answer: ${reasonLine(result.deny)}`)
    }
  } catch (error) {
    toast(`last answer: ${reasonLine(error)}`)
  }
}

type RenderEvent = Parameters<EngineInterface['ui']['resolve']>[0]

export function answerButton($: EngineInterface, e: RenderEvent, question: LastQuestion) {
  const { Button, Text } = $.ui.resolve(e)
  return (
    <Button key={ANSWER_KEY} label={ANSWER_LABEL} onPress={() => void pressLastAnswer(args => $.ui.scroll(args), text => $.ui.toast(text), question)}>
      <Text color={BUTTON_COLOR}>{ANSWER_LABEL}</Text>
    </Button>
  )
}

// --- knowing the question before any press ---

let generation = 0 // the newest person's submit (or session end) this module saw: older work stops being the value's writer

async function recentRows($: EngineInterface, last: number): Promise<readonly SessionMessage[]> {
  const rows = await $.session.messages({ last })
  return Array.isArray(rows) ? rows : [] // a deny is no rows
}

// What a new pending question keeps of the value before it: the uuid of the question it replaces (`previous`).
const previousOf = (cur: LastQuestion): { previous?: string } =>
  cur === null ? {} : 'uuid' in cur ? { previous: cur.uuid } : cur.previous === undefined ? {} : { previous: cur.previous }

// The same words typed again while they are still pending are the next copy: the lookup takes the row at index `queued`.
const queuedOf = (cur: LastQuestion, entered: string): { queued?: number } => {
  if (cur === null || !('pending' in cur)) return {}
  const [was, now] = cleanPrompts([cur.pending, entered])
  return was !== undefined && was === now ? { queued: (cur.queued ?? 0) + 1 } : {}
}

type Pending = { pending: string; previous?: string; queued?: number }

// The pending question becomes its uuid, only while it is still that pending question (same text, same `previous`, same `queued`).
async function settle($: EngineInterface, pending: Pending, uuid: string): Promise<void> {
  await update($, lastQuestion, cur => (
    cur !== null && 'pending' in cur && cur.pending === pending.pending && cur.previous === pending.previous && cur.queued === pending.queued ? { uuid } : cur
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
    const written = await update($, lastQuestion, cur => (mine === generation ? { pending: entered, ...previousOf(cur), ...queuedOf(cur, entered) } : cur))
    if (mine !== generation || written === null || !('pending' in written)) return // a newer submit (or a session end) owns the value
    const uuid = findQuestion(await recentRows($, LOOKUP_ROWS), entered, written.previous, written.queued)
    if (uuid !== undefined && mine === generation) await settle($, written, uuid)
  } catch {
    // a refused read or write: the value stays as it was; the next submit or turn tries again
  }
}

/**
 * At `turn.start` and `turn.complete`: a pending question (it was queued) is looked for again, never at or before its `previous`.
 * `isDeep` (the turn's end): when the newest rows do not hold it and do not reach back to `previous` (a long answer is in between),
 * a longer read reaches the engine cap. Never rejects.
 */
export async function retryPending($: EngineInterface, isDeep: boolean): Promise<void> {
  try {
    const cur = await read($, lastQuestion)
    if (cur === null || !('pending' in cur)) return
    const recent = await recentRows($, LOOKUP_ROWS)
    let uuid = findQuestion(recent, cur.pending, cur.previous, cur.queued)
    // a longer read only when the newest rows may hide the question: they do not reach back to `previous`
    const reachesPrevious = cur.previous !== undefined && recent.some(row => row.uuid === cur.previous)
    if (uuid === undefined && isDeep && recent.length >= LOOKUP_ROWS && !reachesPrevious) uuid = findQuestion(await recentRows($, ENTRY_CAP), cur.pending, cur.previous, cur.queued)
    if (uuid !== undefined) await settle($, cur, uuid)
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
    let uuid = newestQuestion(recent)
    if (uuid === undefined && recent.length >= RESTORE_ROWS) uuid = newestQuestion(await recentRows($, ENTRY_CAP))
    if (uuid !== undefined) await update($, lastQuestion, cur => (cur === null && mine === generation ? { uuid } : cur))
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
