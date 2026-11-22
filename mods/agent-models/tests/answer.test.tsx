import { expect, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { UiScrollArgs, UiScrollResult } from 'claude-code'

import { accountRowCells, pressLastAnswer } from '../hooks/answer'
import { VIEWER_NOTE, viewerFixedRows } from '../hooks/prompts'
import { tasksLabel } from '../hooks/tasks'
import { TURN } from './account-fixtures'
import { BAND, SURFACES, answerWith, MEASURED, text as drawnText, world } from './limits-fixtures'
import { answer, COMPOSER, KEY, question, session, spin, SUMMARY, toolRow, typed, valueOf } from './answer-fixtures'

// The `last answer` button (1.5.0): the band row, the lookup of the owner's last question (a transcript message's uuid kept in
// state at the person's submit), the press. The harness cannot see where a transcript scroll goes, so the press is tested through
// `pressLastAnswer`, which takes the scroll and the toast as arguments.

type Ui = Mounted<'terminal' | 'desktop', 'AbovePrompt'>
const FULLSCREEN = { columns: 80, rows: 24, isFullscreen: true } as const
const MAIN_SCREEN = { columns: 80, rows: 24, isFullscreen: false } as const
const start = async ($: Engine) => {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await spin()
}
const keysOf = async (ui: Ui) => (await ui.findAll({ type: 'Button' })).map(b => b.key)

// --- the button ---

for (const surface of SURFACES) {
  test(`T1 the band draws a last-answer button after tasks (n), viewer closed and open (${surface})`, async ($, on) => {
    session(on, [question('hello', 'u1')])
    await start($)
    const ui = await $.ui.mount({ ...BAND, surface, viewport: FULLSCREEN })
    const closed = await keysOf(ui)
    expect(closed.indexOf('last-answer')).toBeGreaterThan(-1)
    expect(closed.indexOf('last-answer')).toBeGreaterThan(closed.indexOf('my-tasks'))
    expect((await ui.find({ type: 'Button', key: 'last-answer' }))?.props.label).toBe('last answer')
    await ui.press({ key: 'my-messages' })
    await ui.redraw()
    const open = await keysOf(ui)
    expect(open.indexOf('last-answer')).toBeGreaterThan(open.indexOf('my-tasks'))
    expect(open.indexOf('my-tasks')).toBeGreaterThan(-1)
    await ui.press({ key: 'close' })
    await ui.unmount()
  })

  test(`T2 no button on the main screen; a surface that did not measure still draws it (${surface})`, async ($, on) => {
    session(on)
    await start($)
    const main = await $.ui.mount({ ...BAND, surface, viewport: MAIN_SCREEN })
    expect(await keysOf(main)).not.toContain('last-answer')
    await main.unmount()
    const unknown = await $.ui.mount({ ...BAND, surface })
    expect(await keysOf(unknown)).toContain('last-answer')
    await unknown.unmount()
  })
}

// --- the lookup at the person's submit ---

test('T3 a submit of the person finds its transcript message: lastQuestion is its uuid', async ($, on) => {
  const s = session(on, [question('earlier', 'u0'), answer('a0')])
  await start($)
  s.rows = [...s.rows, question('Q', 'u1')] // typed after the session start
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  expect(s.writes).toEqual([{ uuid: 'u0' }, { pending: 'Q' }, { uuid: 'u1' }]) // the first is the session start's: the newest question then
  expect(s.reads.at(-1)).toEqual({ last: 50 })
})

test('T4 submits that are not the person\'s question change nothing', async ($, on) => {
  const s = session(on)
  await start($)
  s.rows = [question('base', 'ub')]
  await typed($, 'base')
  expect(valueOf(s)).toEqual({ uuid: 'ub' })
  const before = s.writes.length
  s.rows = [...s.rows, question('note', 'u2'), question('peer', 'u3'), question('plug', 'u4'), question('meta', 'u5'), question('/compact', 'u6'), question('dropme', 'u7')]
  s.drop = 'dropme'
  await typed($, 'note', { kind: 'task-notification' })
  await typed($, 'peer', { kind: 'peer' })
  await typed($, 'plug', { kind: 'plugin', name: 'tasks' })
  await typed($, 'meta', COMPOSER, { isMeta: true })
  await typed($, '/compact', COMPOSER, { command: { name: 'compact', args: '' } })
  await typed($, 'dropme')
  expect(s.writes).toHaveLength(before)
  expect(valueOf(s)).toEqual({ uuid: 'ub' })
})

test('T5 a bridge submit after a local one gives the bridge question', async ($, on) => {
  const s = session(on)
  await start($)
  s.rows = [question('local', 'u1')]
  await typed($, 'local')
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  s.rows = [...s.rows, answer('a1'), question('from the phone', 'u2')]
  await typed($, 'from the phone', { kind: 'bridge' })
  expect(valueOf(s)).toEqual({ uuid: 'u2' })
})

test('T6 the same text asked twice: the newer uuid', async ($, on) => {
  const s = session(on)
  await start($)
  s.rows = [question('Q', 'u1')]
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  s.rows = [...s.rows, answer('a1'), question('Q', 'u2')]
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ uuid: 'u2' })
})

test('T7 a queued submit is pending, then found at turn.start; another at turn.complete', async ($, on) => {
  const s = session(on, [question('first', 'u1')])
  await start($)
  await typed($, 'queued') // not in the transcript yet
  expect(valueOf(s)).toEqual({ pending: 'queued' })
  s.rows = [...s.rows, answer('a1'), question('queued', 'u2')]
  await $.turn.start({ text: 'queued', turnId: 't2' })
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u2' })
  await typed($, 'queued again')
  expect(valueOf(s)).toEqual({ pending: 'queued again' })
  s.rows = [...s.rows, answer('a2'), question('queued again', 'u3')]
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u3' })
})

test('T7b a subagent\'s turn.start never settles the pending question', async ($, on) => {
  const s = session(on)
  await start($)
  await typed($, 'queued')
  s.rows = [question('queued', 'u2')]
  await $.turn.start({ text: 'x', turnId: 't9', agentId: 'a1' })
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'queued' })
})

// --- the lookup at a session start ---

test('T8 a session start with no value takes the newest question, not a summary, a notification or a tool result', async ($, on) => {
  const s = session(on, [
    question('an older question', 'u0'),
    answer('a0'),
    question('the real question', 'u1'),
    answer('a1'),
    question(SUMMARY, 'u2'),
    question('<task-notification>done</task-notification>', 'u3'),
    toolRow('u4'),
  ])
  await start($)
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  expect(s.reads.some(r => r.last === undefined || r.last > 50)).toBe(true) // a resumed session may hold a long answer after the question
})

test('T9 a session start with a value set (a reload) keeps it', async ($, on) => {
  const s = session(on)
  await start($)
  s.rows = [question('Q', 'u1')]
  await typed($, 'Q')
  s.rows = [...s.rows, answer('a1'), question('a newer one', 'u9')]
  const before = s.writes.length
  await start($)
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  expect(s.writes).toHaveLength(before)
})

// --- the press ---

const fakes = (result: () => Promise<UiScrollResult> = async () => ({})) => {
  const scrolls: UiScrollArgs[] = []
  const toasts: string[] = []
  return {
    scrolls,
    toasts,
    scroll: (args: UiScrollArgs) => {
      scrolls.push(args)
      return result()
    },
    toast: (t: string) => {
      toasts.push(t)
    },
  }
}

test('T10 a press with a uuid scrolls once, at once, with the requestId and block start', async () => {
  const f = fakes()
  const pressing = pressLastAnswer(f.scroll, f.toast, { uuid: 'u1' })
  expect(f.scrolls, 'the scroll is called before the press yields').toEqual([{ to: { requestId: 'u1' }, block: 'start' }])
  await pressing
  expect(f.scrolls).toHaveLength(1)
  expect(f.toasts).toEqual([])
})

test('T11 a refused or failed scroll is told in a toast and never thrown', async () => {
  const none = fakes(async () => ({ deny: 'none scrolls' }))
  await pressLastAnswer(none.scroll, none.toast, { uuid: 'u1' })
  expect(none.toasts).toEqual(['last answer: works in fullscreen only'])
  const other = fakes(async () => ({ deny: 'not person-initiated' }))
  await pressLastAnswer(other.scroll, other.toast, { uuid: 'u1' })
  expect(other.toasts).toEqual(['last answer: not person-initiated'])
  const broken = fakes(async () => {
    throw new Error('boom')
  })
  await pressLastAnswer(broken.scroll, broken.toast, { uuid: 'u1' })
  expect(broken.toasts).toEqual(['last answer: boom'])
  const thrown = fakes(() => {
    throw new Error('sync boom')
  })
  await pressLastAnswer(thrown.scroll, thrown.toast, { uuid: 'u1' })
  expect(thrown.toasts).toEqual(['last answer: sync boom'])
})

test('T12 a press with a pending or no question toasts and never scrolls', async () => {
  const pending = fakes()
  await pressLastAnswer(pending.scroll, pending.toast, { pending: 'Q' })
  expect(pending.toasts).toEqual(['last answer: your question is still being sent'])
  const none = fakes()
  await pressLastAnswer(none.scroll, none.toast, null)
  expect(none.toasts).toEqual(['last answer: no question yet'])
  expect(pending.scrolls).toEqual([])
  expect(none.scrolls).toEqual([])
})

for (const surface of SURFACES) {
  test(`T12b the drawn button toasts when there is no question yet (${surface})`, async ($, on) => {
    const s = session(on)
    await start($)
    const ui = await $.ui.mount({ ...BAND, surface, viewport: FULLSCREEN })
    await ui.press({ key: 'last-answer' })
    await spin()
    expect(s.toasts).toEqual(['last answer: no question yet'])
    await ui.unmount()
  })
}

// --- a failing read ---

test('T13 a messages read that throws leaves the value and breaks nothing, in each hook', async ($, on) => {
  const s = session(on, [question('Q', 'u1')])
  s.isBroken = true
  await start($) // the session start's lookup throws: null stays
  expect(valueOf(s)).toBeNull()
  expect(s.writes).toEqual([])
  await typed($, 'Q') // the pending write was made, the lookup threw: it stays pending
  expect(valueOf(s)).toEqual({ pending: 'Q' })
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q' })
  s.isBroken = false
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u1' }) // and it recovers when the read works again
})

test('T13b a refused write of lastQuestion breaks nothing', async ($, on) => {
  session(on, [question('Q', 'u1')])
  on('state.set', KEY, () => ({ deny: 'refused' }))
  await start($)
  await typed($, 'Q') // the hooks end without throwing
  await $.turn.complete(TURN)
  await spin()
})

// --- the viewer counts a wrapped account row ---

const LONG = `${'long.name.'.repeat(10)}@example.com` // 110 characters

test('T14 the viewer counts the account row wrapped at its width, not as one row', () => {
  const short = accountRowCells({ account: 'dev@example.com', isKnown: true, isLoginPending: false, tasks: tasksLabel(0), isAnswerShown: true })
  // [ dev@example.com ]  [ login ]  [ tasks (0) ]  [ last answer ]
  expect(short).toBe(19 + 2 + 9 + 2 + 13 + 2 + 15)
  expect(viewerFixedRows(80, false, undefined, undefined, VIEWER_NOTE, short)).toBe(viewerFixedRows(80, false, undefined))
  const long = accountRowCells({ account: LONG, isKnown: true, isLoginPending: false, tasks: tasksLabel(0), isAnswerShown: true })
  expect(long).toBe(LONG.length + 4 + 2 + 9 + 2 + 13 + 2 + 15)
  expect(viewerFixedRows(80, false, undefined, undefined, VIEWER_NOTE, long)).toBe(viewerFixedRows(80, false, undefined) + 1)
  const hidden = accountRowCells({ account: LONG, isKnown: true, isLoginPending: false, tasks: tasksLabel(0), isAnswerShown: false })
  expect(hidden).toBe(long - 17) // no button, no gap
  expect(accountRowCells({ account: 'account ?', isKnown: false, isLoginPending: true, tasks: tasksLabel(3), isAnswerShown: false }))
    .toBe('account ?'.length + 2 + 9 + ' logging in…'.length + 2 + 13)
})

// agents 0 + fixed (2 + the account row 2) + the note (118 characters at 80: 2 rows) + `hello` 1 = 7; one row less would say 6
for (const [maxRows, header] of [[7, 'Message 1 / 1'], [6, 'Message 1 / 1 (scroll for more)']] as const) {
  test(`T14b a long email wraps the account row: at ${maxRows} rows the header says "${header}"`, async ($, on) => {
    on('session.messages', () => ({ value: [{ role: 'user', text: 'hello', toolUses: [] }] }))
    await world($, on, answerWith(200, MEASURED), undefined, { email: LONG })
    const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, bodyColumns: 80, maxRows }, surface: 'terminal', viewport: FULLSCREEN })
    await ui.press({ key: 'my-messages' })
    await ui.redraw()
    expect((await drawnText(ui, /^Message /))?.text).toBe(header)
    await ui.press({ key: 'close' })
    await ui.unmount()
  })
}
