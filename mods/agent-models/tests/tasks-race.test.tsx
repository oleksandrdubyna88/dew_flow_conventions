import { expect, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { On, ProcessRunResult } from 'claude-code'

import { ok, SID } from './transcript-fixtures'
import { add, addField, draw, type } from './tasks-fixtures'

import { NOTE_EMPTY, NOTE_FULL, noteTooLong, SENDING, TASK_CHARS, TASK_LIMIT } from '../hooks/tasks'

// Presses that overlap: To prompt's single flight, who writes the sending state, the dim note, the two views. Also the add
// button's limits and the draft kept on each edit (A5-A8, 1.3.2; A1-A4 are in tasks.test.tsx), which share its terminal-only band.

const BAND = {
  plugin: 'agent-models',
  component: 'AbovePrompt',
  requestId: 'band',
  surface: 'terminal',
  props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80, scroll: { offset: 0, bodyRows: 11 }, view: {} },
} as const
type Ui = Mounted<'terminal' | 'desktop', 'AbovePrompt'>

const text = (ui: Ui, t: string | RegExp) => ui.find({ type: 'Text', text: t })
const button = (ui: Ui, key: string) => ui.find({ type: 'Button', key })
const label = async (ui: Ui) => (await button(ui, 'my-tasks'))?.props.label
const quiet = (on: On) => on('agent.list', () => ({ value: [] }))
const spin = async () => {
  for (let i = 0; i < 100; i += 1) await Promise.resolve()
}
const hold = () => {
  let release: () => void = () => undefined
  const held = new Promise<void>(resolve => {
    release = resolve
  })
  return { held, release }
}
const opened = async ($: Engine) => {
  const ui = await $.ui.mount(BAND)
  await ui.press({ key: 'my-tasks' })
  return ui
}

test('R1 two fast presses of To prompt fill the box once', async ($, on) => {
  quiet(on)
  const { held, release } = hold()
  const fills: string[] = []
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', async (_, e) => {
    fills.push(e.text)
    await held
    return { isFilled: true }
  })
  const ui = await opened($)
  await add(ui, 'note')
  await ui.press({ key: 'task-prompt-1' })
  await ui.press({ key: 'task-prompt-1' }) // the first fill has not settled
  await spin()
  release()
  await spin()
  await ui.redraw()
  expect(fills).toEqual(['note'])
  expect(await text(ui, '1. note')).toBeUndefined()
  await ui.unmount()
})

test('R2 Apply writes the sending state before it reads the note', async ($, on) => {
  quiet(on)
  const { held, release } = hold()
  const writes: { isSending?: boolean }[] = []
  let armed = false
  let gets = 0
  on('state.set', (_, e, next) => {
    if ((e as { key?: string }).key === 'tasks' && armed) writes.push((e as { value: { isSending?: boolean } }).value)
    return next(e)
  })
  on('state.get', async (_, e, next) => {
    if ((e as { key?: string }).key === 'tasks' && armed && (gets += 1) === 2) await held // the second read of the Apply
    return next(e)
  })
  on('prompt.submit', (_, e) => ({ text: e.text }))
  const ui = await opened($)
  await add(ui, 'a')
  armed = true
  await ui.press({ key: 'task-apply-1' })
  await spin()
  expect(writes.some(w => w.isSending === true)).toBe(true) // while its next read is still pending
  release()
  await spin()
  await ui.unmount()
})

test('R3 an action that lands as an Apply ends never leaves the sending state on', async ($, on) => {
  quiet(on)
  const { held, release } = hold()
  on('prompt.submit', async (_, e) => {
    await held
    return { text: e.text }
  })
  const ui = await opened($)
  await add(ui, 'a')
  await add(ui, 'b')
  await add(ui, 'c')
  await ui.press({ key: 'task-apply-1' })
  await spin()
  await ui.press({ key: 'task-down-3' })
  release()
  for (const key of ['task-up-3', 'task-down-2', 'task-up-3', 'task-down-2']) await ui.press({ key }) // no waiting between them
  await spin()
  await ui.redraw()
  expect(await text(ui, SENDING)).toBeUndefined()
  for (const key of ['task-apply-2', 'task-apply-3']) expect((await button(ui, key))?.props.dimColor).toBeFalsy()
  await ui.unmount()
})

test('R4 while a note is sent every button of that note is dim and does nothing', async ($, on) => {
  quiet(on)
  const { held, release } = hold()
  const fills: string[] = []
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', (_, e) => {
    fills.push(e.text)
    return { isFilled: true }
  })
  on('prompt.submit', async (_, e) => {
    await held
    return { text: e.text }
  })
  const ui = await opened($)
  await add(ui, 'a')
  await add(ui, 'b')
  await ui.press({ key: 'task-apply-1' })
  await spin()
  await ui.redraw()
  for (const action of ['apply', 'prompt', 'edit', 'up', 'down', 'delete']) {
    expect((await button(ui, `task-${action}-1`))?.props.dimColor).toBe(true)
  }
  expect((await button(ui, 'task-delete-2'))?.props.dimColor).toBeFalsy() // the other note's buttons stay live
  for (const action of ['prompt', 'edit', 'down', 'delete']) await ui.press({ key: `task-${action}-1` })
  await spin()
  await ui.redraw()
  expect(fills).toHaveLength(0)
  expect(await ui.find({ type: 'Input', key: 'task-editing' })).toBeUndefined()
  expect(await text(ui, '1. a')).toBeDefined()
  expect(await text(ui, '2. b')).toBeDefined()
  release()
  await spin()
  await ui.redraw()
  expect(await text(ui, '1. b')).toBeDefined()
  expect(await text(ui, SENDING)).toBeUndefined()
  await ui.unmount()
})

test('R5 a tasks press while the messages load ends with exactly one view open', async ($, on) => {
  quiet(on)
  const { held, release } = hold()
  on('session.messages', async () => {
    await held
    return { value: [{ role: 'user', text: 'hello', toolUses: [] }] }
  })
  const ui = await $.ui.mount(BAND)
  await ui.press({ key: 'my-messages' })
  await ui.press({ key: 'my-tasks' })
  release()
  await spin()
  await ui.redraw()
  expect(await addField(ui)).toBeDefined()
  expect(await text(ui, /^Message /)).toBeUndefined()
  await ui.press({ key: 'my-messages' }) // the messages button is not stuck on Loading
  expect(await text(ui, 'Message 1 / 1')).toBeDefined()
  expect(await addField(ui)).toBeUndefined()
  await ui.unmount()
})

test('A5 the add button refuses 4001 characters and takes exactly 4000', async ($, on) => {
  quiet(on)
  const ui = await $.ui.mount(BAND)
  await ui.press({ key: 'my-tasks' })
  const long = 'x'.repeat(TASK_CHARS + 1)
  await type(ui, long)
  await ui.press({ key: 'tasks-add' })
  expect(await text(ui, noteTooLong(4001))).toBeDefined()
  expect(await text(ui, /^1\. /)).toBeUndefined()
  expect(await draw(ui)).toBe(long)
  const fits = 'x'.repeat(TASK_CHARS)
  await type(ui, fits)
  await ui.press({ key: 'tasks-add' })
  expect((await text(ui, `1. ${fits}`))?.props.wrap).toBe('wrap')
  await ui.unmount()
})

test('A6 the add button on a full list is refused and keeps the text', async ($, on) => {
  quiet(on)
  // The 100 notes are the stored state (T14's technique, tasks.test.tsx): the seed answers until the first write.
  let isSeeded = true
  const seed = { isOpen: true, items: Array.from({ length: TASK_LIMIT }, (_, i) => ({ id: i + 1, text: `n${i + 1}` })), nextId: TASK_LIMIT + 1, draft: '', isSending: false }
  on('state.get', { plugin: 'agent-models', key: 'tasks' }, async (_, e, next) => {
    const answer = await next(e)
    if (!isSeeded || answer.value === undefined) return answer
    return { value: { value: seed, version: answer.value.version } }
  })
  on('state.set', { plugin: 'agent-models', key: 'tasks' }, (_, e, next) => {
    isSeeded = false
    return next(e)
  })
  const ui = await $.ui.mount(BAND)
  expect(await label(ui)).toBe('tasks (100)')
  await type(ui, 'n101')
  await ui.press({ key: 'tasks-add' })
  expect(await text(ui, NOTE_FULL)).toBeDefined()
  expect(await text(ui, '101. n101')).toBeUndefined()
  expect(await draw(ui)).toBe('n101')
  expect(await label(ui)).toBe('tasks (100)')
  await ui.unmount()
})

test('A7 the draft survives Close, reopening and a remount; the button then adds it', async ($, on) => {
  quiet(on)
  const first = await $.ui.mount(BAND)
  await first.press({ key: 'my-tasks' })
  await type(first, 'keep')
  await first.press({ key: 'tasks-close' })
  await first.press({ key: 'my-tasks' })
  expect(await draw(first)).toBe('keep')
  await first.unmount()
  const again = await $.ui.mount(BAND)
  expect(await draw(again)).toBe('keep')
  await again.press({ key: 'tasks-add' })
  expect(await text(again, '1. keep')).toBeDefined()
  await again.unmount()
})

test('A8 typing the next note does not clear the refusal line', async ($, on) => {
  quiet(on)
  const ui = await $.ui.mount(BAND)
  await ui.press({ key: 'my-tasks' })
  await ui.press({ key: 'tasks-add' })
  expect(await text(ui, NOTE_EMPTY)).toBeDefined()
  await type(ui, 'abc')
  expect(await text(ui, NOTE_EMPTY)).toBeDefined()
  await ui.press({ key: 'tasks-add' })
  expect(await text(ui, '1. abc')).toBeDefined()
  expect(await text(ui, NOTE_EMPTY)).toBeUndefined()
  await ui.unmount()
})

// F5: typing writes no state. A write per key redraws the band, and a redraw for key k that lands after key k+1 resets
// the field to the older text; the text lives in memory until an add, a refusal or Close needs it.
test('F5 typing writes no state per key; an add by button and by Enter draws a new, empty field; a refusal keeps the field', async ($, on) => {
  quiet(on)
  let writes = 0
  on('state.set', { plugin: 'agent-models', key: 'tasks' }, (_, e, next) => {
    writes += 1
    return next(e)
  })
  const ui = await $.ui.mount(BAND)
  await ui.press({ key: 'my-tasks' })
  const first = (await addField(ui))?.key
  const before = writes
  for (const t of ['a', 'ab', 'abc', 'abcd']) await type(ui, t)
  expect(writes).toBe(before) // four edits, no state write
  await ui.press({ key: 'tasks-add' })
  expect(await text(ui, '1. abcd')).toBeDefined()
  const second = (await addField(ui))?.key
  expect(second).not.toBe(first) // a new field, so it draws empty whatever the old one held
  expect(await draw(ui)).toBe('')
  await type(ui, 'x') // Enter hands its own text and wins over what was typed before
  await add(ui, 'y')
  expect(await text(ui, '2. y')).toBeDefined()
  expect(await text(ui, '2. x')).toBeUndefined()
  const third = (await addField(ui))?.key
  expect(third).not.toBe(second)
  await ui.press({ key: 'tasks-add' }) // nothing typed since the last add: refused, the same field stays
  expect(await text(ui, NOTE_EMPTY)).toBeDefined()
  expect((await addField(ui))?.key).toBe(third)
  await ui.unmount()
})

// --- 1.3.2: the session log read (a node run) against the tasks button ---

const heldLog = (on: On, late: () => ProcessRunResult | { deny: string }) => {
  const { held, release } = hold()
  const seen = { runs: 0, messages: 0, release }
  quiet(on)
  on('session.id', () => ({ value: SID }))
  on('process.run', async (_, e) => {
    if (e.argv[0] !== 'node') return { value: ok(JSON.stringify({ loggedIn: false })) } // the band's own account read
    seen.runs += 1
    if (seen.runs === 1) await held
    const a = seen.runs === 1 ? late() : ok('["again"]')
    return 'deny' in a ? a : { value: a }
  })
  on('session.messages', () => {
    seen.messages += 1
    return { value: [{ role: 'user', text: 'from the transcript', toolUses: [] }] }
  })
  return seen
}

test('R6 a log read that lands after the tasks view opened changes nothing', async ($, on) => {
  const seen = heldLog(on, () => ok('["late"]'))
  const ui = await $.ui.mount(BAND)
  await ui.press({ key: 'my-messages' })
  await ui.press({ key: 'my-messages' }) // a press while the log is read is ignored
  await ui.press({ key: 'my-tasks' })
  seen.release()
  await spin()
  await ui.redraw()
  expect(seen.runs).toBe(1)
  expect(await addField(ui)).toBeDefined()
  expect(await text(ui, /^Message /)).toBeUndefined()
  expect(await text(ui, 'late')).toBeUndefined()
  expect(await text(ui, /Loading messages/)).toBeUndefined()
  expect(seen.messages).toBe(0)
  await ui.press({ key: 'my-messages' }) // not stuck on Loading: the next press reads again
  expect((await text(ui, 'Message 1 / 1'))?.text).toBe('Message 1 / 1')
  expect(await text(ui, 'again')).toBeDefined()
  expect(await addField(ui)).toBeUndefined()
  await ui.unmount()
})

test('R7 a log read that FAILS after the tasks view opened starts no transcript read', async ($, on) => {
  const seen = heldLog(on, () => ({ deny: 'timed out' }))
  const ui = await $.ui.mount(BAND)
  await ui.press({ key: 'my-messages' })
  await ui.press({ key: 'my-tasks' })
  seen.release()
  await spin()
  await ui.redraw()
  expect(seen.messages).toBe(0)
  expect(await addField(ui)).toBeDefined()
  expect(await text(ui, /^Message /)).toBeUndefined()
  expect(await text(ui, /Could not read/)).toBeUndefined()
  await ui.unmount()
})
