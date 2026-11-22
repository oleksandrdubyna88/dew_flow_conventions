import { expect, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { UiScrollArgs, UiScrollResult } from 'claude-code'

import { accountRowCells, findQuestion, newestQuestion, pressLastAnswer } from '../hooks/answer'
import { VIEWER_NOTE, viewerFixedRows } from '../hooks/prompts'
import { tasksLabel } from '../hooks/tasks'
import { TURN } from './account-fixtures'
import { BAND, SURFACES, answerWith, MEASURED, text as drawnText, world } from './limits-fixtures'
import { answer, COMPOSER, held, KEY, question, session, spin, submitOf, SUMMARY, toolRow, typed, valueOf } from './answer-fixtures'

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
  expect(s.writes).toEqual([{ uuid: 'u0' }, { pending: 'Q', previous: 'u0' }, { uuid: 'u1' }]) // the first is the session start's: the newest question then
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
  expect(valueOf(s)).toEqual({ pending: 'queued', previous: 'u1' })
  s.rows = [...s.rows, answer('a1'), question('queued', 'u2')]
  await $.turn.start({ text: 'queued', turnId: 't2' })
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u2' })
  await typed($, 'queued again')
  expect(valueOf(s)).toEqual({ pending: 'queued again', previous: 'u2' })
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
  expect(s.reads, 'the newest 200 rows first; the engine cap only when none is a question').toEqual([{ last: 200 }])
})

test('T8b a question typed 200 rows back is found with a read of the engine cap', async ($, on) => {
  const s = session(on, [question('the real question', 'u1'), ...Array.from({ length: 250 }, (_, i) => answer(`a${i}`))])
  await start($)
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  expect(s.reads).toEqual([{ last: 200 }, { last: 4096 }])
})

test('T8c a question that starts with a tag is a question; a notification and a peer wrapper are not', async ($, on) => {
  const s = session(on, [
    question('<b>bold</b> why is this red?', 'u1'),
    answer('a1'),
    question('<task-notification>done</task-notification>', 'u2'),
    question('<teammate-message from="x">hi</teammate-message>', 'u3'),
    question('<agent-message from="x">hi</agent-message>', 'u4'),
  ])
  await start($)
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
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

// --- the pending question keeps the question before it ---

test('T15 the same text typed again is never the old row: pending with previous, then the new row', async ($, on) => {
  const s = session(on)
  await start($)
  s.rows = [question('Q', 'u1')]
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  s.rows = [...s.rows, answer('a1')]
  await typed($, 'Q') // the second Q is not in the transcript yet; the first one is
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u1' })
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s), 'a retry does not settle on the old row').toEqual({ pending: 'Q', previous: 'u1' })
  s.rows = [...s.rows, question('Q', 'u2')]
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u2' })
})

test('T15b after a reload the stored previous is still the boundary (this module has no memory of it)', async ($, on) => {
  const s = session(on, [question('Q', 'u1'), answer('a1')])
  s.seed = { pending: 'Q', previous: 'u1' }
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await $.turn.complete(TURN)
  await spin()
  expect(s.writes, 'u1 is the question before it: nothing settles').toEqual([])
  s.rows = [...s.rows, question('Q', 'u2')]
  await $.turn.start({ text: 'Q', turnId: 't3' })
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u2' })
})

test('T15c a second submit while pending keeps the question before the first one', async ($, on) => {
  const s = session(on, [question('first', 'u1')])
  await start($)
  await typed($, 'second')
  expect(valueOf(s)).toEqual({ pending: 'second', previous: 'u1' })
  await typed($, 'third')
  expect(valueOf(s), 'previous is still the settled question').toEqual({ pending: 'third', previous: 'u1' })
})

test('T16 two submits where the first one\'s write is slow: the value ends at the second', async ($, on) => {
  const s = session(on, [question('earlier', 'u0')])
  let release: () => void = () => undefined
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  let isHeld = false
  on('state.set', KEY, async (_, e, next) => {
    if (!isHeld && JSON.stringify(e.value).includes('"A"')) {
      isHeld = true
      await gate // A's write waits
    }
    return next(e)
  })
  await start($)
  s.rows = [...s.rows, question('A', 'u1'), question('B', 'u2')]
  await $.prompt.submit(submitOf('A'))
  await $.prompt.submit(submitOf('B'))
  await spin()
  release()
  await spin()
  await spin()
  const value = await held($, s)
  expect(value, 'B is the last question').toEqual({ uuid: 'u2' })
})

test('T17 a question with a long answer after it is found at turn.complete, not at turn.start', async ($, on) => {
  const s = session(on, [question('earlier', 'u0')])
  await start($)
  s.rows = [...s.rows, question('Q', 'u1'), ...Array.from({ length: 60 }, (_, i) => answer(`a${i}`))]
  await typed($, 'Q') // the newest 50 rows are all answers
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0' })
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0' })
  expect(s.reads.every(r => r.last !== 4096), 'turn.start reads the newest 50 only').toBe(true)
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  expect(s.reads.at(-1)).toEqual({ last: 4096 })
})

test('T17b the deep read stops at previous: an older row with the same text is not taken', async ($, on) => {
  const s = session(on, [question('Q', 'u0')])
  await start($)
  s.rows = [...s.rows, ...Array.from({ length: 60 }, (_, i) => answer(`a${i}`))]
  await typed($, 'Q') // the new Q is not in the transcript; u0 is the question before it
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0' })
})

test('T18 a session end clears the value; a lookup that lands after it writes nothing', async ($, on) => {
  const s = session(on)
  await start($)
  s.rows = [question('Q', 'u1')]
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  await spin()
  expect(valueOf(s)).toBeNull()
  expect(await held($, s)).toBeNull()
})

// --- the lookup compares what the person typed ---

test('findQuestion compares the clean text on both sides, and never matches an empty one', () => {
  const rows = [question('Q  <system-reminder>noise</system-reminder>', 'u1'), question('plain', 'u2')]
  expect(findQuestion(rows, 'Q')).toBe('u1')
  expect(findQuestion(rows, '<system-reminder>noise</system-reminder>Q ')).toBe('u1')
  expect(findQuestion(rows, '<system-reminder>only a reminder</system-reminder>')).toBeUndefined()
  expect(findQuestion([question('<system-reminder>x</system-reminder>', 'u3')], '<system-reminder>y</system-reminder>')).toBeUndefined()
  expect(findQuestion(rows, '   ')).toBeUndefined()
})

test('newestQuestion drops a compaction summary, wrappers and tool results, not a tag the person typed', () => {
  expect(newestQuestion([question('<b>hi</b>', 'u1'), question(SUMMARY, 'u2'), toolRow('u3')])).toBe('u1')
  expect(newestQuestion([question('<agent-message from="x">y</agent-message>', 'u1')])).toBeUndefined()
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

test('T12 a press while pending goes to the question before it; with none before it, or with no question, it toasts', async () => {
  const before = fakes()
  const pressing = pressLastAnswer(before.scroll, before.toast, { pending: 'Q', previous: 'u1' })
  expect(before.scrolls, 'the scroll is called before the press yields').toEqual([{ to: { requestId: 'u1' }, block: 'start' }])
  await pressing
  expect(before.toasts).toEqual([])
  const denied = fakes(async () => ({ deny: 'none scrolls' }))
  await pressLastAnswer(denied.scroll, denied.toast, { pending: 'Q', previous: 'u1' })
  expect(denied.toasts).toEqual(['last answer: works in fullscreen only'])
  const broken = fakes(async () => {
    throw new Error('boom')
  })
  await pressLastAnswer(broken.scroll, broken.toast, { pending: 'Q', previous: 'u1' })
  expect(broken.toasts).toEqual(['last answer: boom'])
  const alone = fakes()
  await pressLastAnswer(alone.scroll, alone.toast, { pending: 'Q' })
  expect(alone.toasts).toEqual(['last answer: your question is not in the transcript yet'])
  const none = fakes()
  await pressLastAnswer(none.scroll, none.toast, null)
  expect(none.toasts).toEqual(['last answer: no question yet'])
  expect(alone.scrolls).toEqual([])
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

test('T13b a refused write of lastQuestion breaks nothing and leaves the value as it was', async ($, on) => {
  const s = session(on, [question('Q', 'u1')])
  on('state.set', KEY, () => ({ deny: 'refused' }))
  await start($)
  await typed($, 'Q') // the hooks end without throwing
  await $.turn.complete(TURN)
  await spin()
  expect(s.writes.length, 'the hooks did try to write').toBeGreaterThan(0)
  expect(await held($, s), 'every write was refused: the value is still null').toBeNull()
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
