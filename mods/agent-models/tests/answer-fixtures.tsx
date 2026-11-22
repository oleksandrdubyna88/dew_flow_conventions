import type { Engine } from 'claude-code/testing'
import type { On, PromptOrigin, PromptSubmitInput, SessionMessage } from 'claude-code'

import type { LastQuestion } from '../types'
import { BAND } from './limits-fixtures'
import { base, identities, identityOf, ok, spin, statusRuns } from './account-fixtures'

// The helpers of the last answer tests (answer.test.tsx): typed builders for transcript rows and submits, and a session whose
// transcript the test owns, with every `lastQuestion` write, toast and messages read recorded. Not a test file.

export { spin }

export const KEY = { plugin: 'agent-models', key: 'lastQuestion' } as const
export const COMPOSER: PromptOrigin = { kind: 'composer' }
export const SUMMARY = 'This session is being continued from a previous conversation that ran out of context.'

/** A row the person typed (no tool result). */
export const question = (text: string, uuid: string): SessionMessage => ({ role: 'user', text, toolUses: [], uuid })
export const answer = (uuid: string): SessionMessage => ({ role: 'assistant', text: 'an answer', toolUses: [], uuid })
/** A user row that carries a tool result: never a question. */
export const toolRow = (uuid: string): SessionMessage => ({
  role: 'user', text: '', toolUses: [], uuid, toolResults: [{ tool_use_id: 'tool-1', text: 'done', isError: false }],
})

export const submitOf = (text: string, origin: PromptOrigin = COMPOSER, extra: Partial<PromptSubmitInput> = {}): PromptSubmitInput => ({
  text, wait: false, origin, ...extra,
})

export type Reads = { last: number | undefined }[]
export type Session = {
  rows: SessionMessage[] // the transcript the stub answers with; the test changes it
  isBroken: boolean // the messages read throws
  drop: string | undefined // a prompt with this text is dropped by the engine's own bottom
  reads: Reads
  writes: LastQuestion[] // every write of `lastQuestion`, in order
  toasts: string[]
  seed: LastQuestion | undefined // a value the session already holds (a hot reload kept it): read until the first write
  read: LastQuestion // what the newest read of the state value answered (see `held`)
}

/** A session whose transcript, `lastQuestion` writes and toasts the test sees. `$.session.start` is called by the test. */
export const session = (on: On, rows: SessionMessage[] = []): Session => {
  const s: Session = { rows, isBroken: false, drop: undefined, reads: [], writes: [], toasts: [], seed: undefined, read: null }
  base(on)
  identities(on, [() => identityOf('dev@example.com')])
  statusRuns(on, () => ok(JSON.stringify({ loggedIn: false })))
  on('prompt.submit', (_, e) => (e.text === s.drop ? { drop: 'refused' } : { text: e.text }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('session.messages', (_, e) => {
    s.reads.push({ last: e.last })
    if (s.isBroken) throw new Error('no transcript')
    const all = s.rows
    return { value: e.last === undefined ? all : all.slice(-e.last) }
  })
  on('state.get', KEY, async (_, e, next) => {
    const result = s.seed !== undefined && s.writes.length === 0 ? { value: { value: s.seed, version: 0 } } : await next(e)
    s.read = result.value?.value ?? null
    return result
  })
  on('session.end', (_, e) => ({ sessionId: e.sessionId }))
  on('state.set', KEY, (_, e, next) => {
    s.writes.push(e.value)
    return next(e)
  })
  on('ui.toast', (_, e) => {
    s.toasts.push(e.text)
    return { value: undefined }
  })
  return s
}

// The value the mod holds: its last write (only the mod writes `lastQuestion`; the harness has no `$.state`); null before the first.
export const valueOf = (s: Session): LastQuestion => s.writes.at(-1) ?? null

/** The person's Enter, then time for the hook's lookup to end. */
export const typed = async ($: Engine, text: string, origin: PromptOrigin = COMPOSER, extra: Partial<PromptSubmitInput> = {}) => {
  await $.prompt.submit(submitOf(text, origin, extra))
  await spin()
}

/** What the engine's state holds for `lastQuestion` now: a draw of the band reads it, the state hook above sees what the engine answered. */
export const held = async ($: Engine, s: Session): Promise<LastQuestion> => {
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal', viewport: { columns: 80, rows: 24, isFullscreen: true } })
  await ui.unmount()
  return s.read
}
