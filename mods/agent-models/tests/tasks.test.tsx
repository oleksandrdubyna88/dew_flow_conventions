import { expect, test } from 'claude-code/testing'
import type { Mounted } from 'claude-code/testing'
import type { On } from 'claude-code'

import { ACCOUNT_COLOR, BUTTON_COLOR, CLOSE_COLOR, LOGIN_COLOR, reasonLine, TASKS_COLOR } from '../hooks/prompts'
import {
  appendedText, fillRefusal, moveTask, noteRefusal, NO_NOTES, NOTE_EMPTY, NOTE_FULL, noteTooLong, submitRefusal, TASK_CHARS,
  TASK_LIMIT, tasksHeader, tasksLabel,
} from '../hooks/tasks'
import { add, addField, draw, type } from './tasks-fixtures'

const BAND = {
  plugin: 'agent-models',
  component: 'AbovePrompt',
  requestId: 'band',
  props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80, scroll: { offset: 0, bodyRows: 11 }, view: {} },
} as const
const SURFACES = ['terminal', 'desktop'] as const
type Ui = Mounted<'terminal' | 'desktop', 'AbovePrompt'>

const text = (ui: Ui, t: string | RegExp) => ui.find({ type: 'Text', text: t })
const button = (ui: Ui, key: string) => ui.find({ type: 'Button', key })
const field = (ui: Ui, key: string) => ui.find({ type: 'Input', key })
const label = async (ui: Ui) => (await button(ui, 'my-tasks'))?.props.label
const quiet = (on: On) => on('agent.list', () => ({ value: [] }))

// --- pure ---

test('P1 noteRefusal: empty, too long, full; the first match wins', () => {
  expect(TASK_LIMIT).toBe(100)
  expect(TASK_CHARS).toBe(4000)
  expect(noteRefusal('', 0, true)).toBe(NOTE_EMPTY)
  expect(noteRefusal(' \t ', 0, false)).toBe(NOTE_EMPTY)
  expect(noteRefusal('x'.repeat(4000), 99, true)).toBeUndefined()
  const tooLong = 'A note holds at most 4000 characters; this one has 4001.'
  expect(noteRefusal('x'.repeat(4001), 0, true)).toBe(tooLong)
  expect(noteRefusal('x'.repeat(4001), 0, false)).toBe(tooLong)
  expect(noteRefusal('ok', 100, true)).toBe(NOTE_FULL)
  expect(noteRefusal('ok', 100, false)).toBeUndefined()
})

test('P2 moveTask moves one place, never wraps, never mutates', () => {
  const items = [1, 2, 3].map(id => ({ id, text: `n${id}` }))
  const before = structuredClone(items)
  const ids = (list: readonly { id: number }[]) => list.map(x => x.id)
  expect(ids(moveTask(items, 1, -1))).toEqual([1, 2, 3])
  expect(ids(moveTask(items, 3, 1))).toEqual([1, 2, 3])
  expect(ids(moveTask(items, 9, 1))).toEqual([1, 2, 3])
  expect(ids(moveTask(items, 2, -1))).toEqual([2, 1, 3])
  expect(ids(moveTask(items, 2, 1))).toEqual([1, 3, 2])
  expect(items).toEqual(before)
})

test('P3 submitRefusal accepts only a result with text and no drop or deny', () => {
  expect(submitRefusal({ text: 'a' })).toBeUndefined()
  expect(submitRefusal({ drop: 'a hook said no' })).toBe('Not sent: a hook said no')
  expect(submitRefusal({ deny: 'no' })).toBe('Not sent: no')
  for (const odd of [{ drop: '' }, undefined, null, 'x', {}]) expect(submitRefusal(odd)).toBe('Not sent: unknown reason')
  expect(submitRefusal({ drop: '\u001b[31mred\u001b[0m\nsecond' })).toBe('Not sent: red')
})

test('P4 fillRefusal names its cause', () => {
  expect(fillRefusal({ isFilled: true })).toBeUndefined()
  expect(fillRefusal({ isFilled: false, refusal: 'no_composer' })).toBe('Not put in the prompt box: this session has no prompt box')
  expect(fillRefusal({ isFilled: false, refusal: 'dialog' })).toBe('Not put in the prompt box: a dialog is open')
  expect(fillRefusal({ isFilled: false })).toBe('Not put in the prompt box: unknown reason')
})

test('P5 appendedText starts a new line only after text that does not end in one', () => {
  expect(appendedText('', 'n')).toBe('n')
  expect(appendedText('d', 'n')).toBe('\nn')
  expect(appendedText('d\n', 'n')).toBe('n')
})

test('P6 the five colours are distinct and the tasks one is blue', () => {
  const colours = [BUTTON_COLOR, CLOSE_COLOR, ACCOUNT_COLOR, LOGIN_COLOR, TASKS_COLOR]
  expect(new Set(colours).size).toBe(5)
  expect(TASKS_COLOR).toBe('#3b82f6')
})

test('P7 reasonLine takes a fallback; without one the login text stays', () => {
  expect(reasonLine('')).toBe('unknown reason — run /login directly')
  expect(reasonLine('', 'unknown reason')).toBe('unknown reason')
})

// --- the band ---

for (const surface of SURFACES) {
  test(`T10 the button counts the notes, the header too (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    const mine = await button(ui, 'my-tasks')
    expect(mine?.props.label).toBe(tasksLabel(0))
    expect(mine?.props.label).toBe('tasks (0)')
    expect(mine?.children).toMatchObject([{ type: 'Text', props: { color: '#3b82f6' }, children: ['tasks (0)'] }])
    await ui.press({ key: 'my-tasks' })
    await add(ui, 'a')
    await add(ui, 'b')
    expect((await button(ui, 'my-tasks'))?.props.label).toBe('tasks (2)')
    const header = await text(ui, tasksHeader(2))
    expect(header?.text).toBe('Tasks (2)')
    expect(header?.props).toMatchObject({ bold: true, color: '#3b82f6' })
    await ui.press({ key: 'task-delete-1' })
    expect((await button(ui, 'my-tasks'))?.props.label).toBe('tasks (1)')
    expect(await text(ui, 'Tasks (1)')).toBeDefined()
    await ui.unmount()
  })

  test(`T11 the button opens the view, Close shuts it (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    expect(await text(ui, 'Tasks (0)')).toBeDefined()
    expect((await text(ui, NO_NOTES))?.props.dimColor).toBe(true)
    const field0 = await addField(ui)
    expect(field0?.props).toMatchObject({ placeholder: 'a new note', value: '' })
    const close = await button(ui, 'tasks-close')
    expect(close?.props.role).toBe('dismiss')
    expect(close?.children).toMatchObject([{ type: 'Text', props: { color: '#ef4444' }, children: ['Close'] }])
    expect(await button(ui, 'login')).toBeDefined()
    expect(await button(ui, 'my-messages')).toBeDefined()
    await ui.press({ key: 'tasks-close' })
    expect(await addField(ui)).toBeUndefined()
    expect(await text(ui, 'Tasks (0)')).toBeUndefined()
    expect(await button(ui, 'my-tasks')).toBeDefined()
    await ui.unmount()
  })

  test(`T12 Enter adds a note with its six buttons (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    await add(ui, 'buy milk')
    expect(await text(ui, '1. buy milk')).toBeDefined()
    const labels = { apply: 'apply', prompt: 'to prompt', edit: 'edit', up: '↑', down: '↓', delete: 'delete' }
    for (const [action, label] of Object.entries(labels)) {
      expect((await button(ui, `task-${action}-1`))?.props.label).toBe(label)
    }
    expect((await addField(ui))?.props.value).toBe('')
    expect(await text(ui, NO_NOTES)).toBeUndefined()
    await ui.unmount()
  })

  test(`T13 an empty note is refused and the typed text stays (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    await add(ui, '')
    await add(ui, '   ')
    expect(await text(ui, /^1\. /)).toBeUndefined()
    expect((await text(ui, NOTE_EMPTY))?.props.dimColor).toBe(true)
    expect((await addField(ui))?.props.value).toBe('   ')
    expect((await button(ui, 'my-tasks'))?.props.label).toBe('tasks (0)')
    await ui.unmount()
  })

  test(`T17 an edit saves on Enter and keeps the id (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    await add(ui, 'old')
    await ui.press({ key: 'task-edit-1' })
    await ui.input({ key: 'task-editing', text: 'new' })
    expect(await text(ui, '1. new')).toBeDefined()
    expect(await text(ui, '1. old')).toBeUndefined()
    expect(await field(ui, 'task-editing')).toBeUndefined()
    expect(await button(ui, 'task-apply-1')).toBeDefined()
    await ui.unmount()
  })

  test(`T25 the up and down buttons move a note one place, never wrapping (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    for (const n of ['a', 'b', 'c']) await add(ui, n)
    await ui.press({ key: 'task-up-1' })
    await ui.press({ key: 'task-down-3' })
    for (const [i, n] of ['a', 'b', 'c'].entries()) expect(await text(ui, `${i + 1}. ${n}`)).toBeDefined()
    await ui.press({ key: 'task-down-1' })
    for (const [i, n] of ['b', 'a', 'c'].entries()) expect(await text(ui, `${i + 1}. ${n}`)).toBeDefined()
    await ui.press({ key: 'task-up-3' })
    for (const [i, n] of ['b', 'c', 'a'].entries()) expect(await text(ui, `${i + 1}. ${n}`)).toBeDefined()
    await ui.unmount()
  })

  test(`T27 delete removes a note and sends and fills nothing (${surface})`, async ($, on) => {
    quiet(on)
    let calls = 0
    on('prompt.submit', (_, e) => { calls += 1; return { text: e.text } })
    on('prompt.fill', () => { calls += 1; return { isFilled: true } })
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    await add(ui, 'a')
    await add(ui, 'b')
    await ui.press({ key: 'task-delete-1' })
    expect(await text(ui, '1. b')).toBeDefined()
    expect(await text(ui, /\. a$/)).toBeUndefined()
    expect(calls).toBe(0)
    expect((await button(ui, 'my-tasks'))?.props.label).toBe('tasks (1)')
    await ui.unmount()
  })
}

test('T14 the 101st note is refused and the text stays in the field', async ($, on) => {
  quiet(on)
  // The 100 notes are the stored state; only the 101st add goes through the UI (a hundred UI adds redraw the growing list each time).
  // Until the first write the `tasks` key answers with the seed at the engine's own version (the engine still takes the read, so
  // the band is drawn again when the write lands); from then on the engine's value answers. Every other key goes to the engine.
  let isSeeded = true
  const seed = { isOpen: true, items: Array.from({ length: TASK_LIMIT }, (_, i) => ({ id: i + 1, text: `n${i + 1}` })), nextId: TASK_LIMIT + 1, draft: '', isSending: false }
  on('state.get', { plugin: 'agent-models', key: 'tasks' }, async (_, e, next) => {
    const answer = await next(e)
    return isSeeded ? { value: { value: seed, version: answer.value.version } } : answer
  })
  on('state.set', { plugin: 'agent-models', key: 'tasks' }, (_, e, next) => {
    isSeeded = false
    return next(e)
  })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await button(ui, 'my-tasks'))?.props.label).toBe('tasks (100)')
  await add(ui, 'n101')
  expect(await text(ui, NOTE_FULL)).toBeDefined()
  expect(NOTE_FULL).toBe('The list holds at most 100 notes; apply or delete one first.')
  expect(await text(ui, '101. n101')).toBeUndefined()
  expect((await addField(ui))?.props.value).toBe('n101')
  expect((await button(ui, 'my-tasks'))?.props.label).toBe('tasks (100)')
  await ui.unmount()
})

test('T15 a note over 4000 characters is refused; one of exactly 4000 is drawn whole', async ($, on) => {
  quiet(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'my-tasks' })
  const long = 'x'.repeat(TASK_CHARS + 1)
  await add(ui, long)
  expect(await text(ui, noteTooLong(4001))).toBeDefined()
  expect(await text(ui, /^1\. /)).toBeUndefined()
  expect((await addField(ui))?.props.value).toBe(long)
  const fits = 'x'.repeat(TASK_CHARS)
  await add(ui, fits)
  expect((await text(ui, `1. ${fits}`))?.props.wrap).toBe('wrap')
  await ui.unmount()
})

test('T16 a refused edit keeps the note and the edit field; cancel leaves the note', async ($, on) => {
  quiet(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'my-tasks' })
  await add(ui, 'orig')
  await ui.press({ key: 'task-edit-1' })
  expect((await field(ui, 'task-editing'))?.props.value).toBe('orig')
  expect(await button(ui, 'task-cancel')).toBeDefined()
  const long = 'y'.repeat(TASK_CHARS + 1)
  await ui.input({ key: 'task-editing', text: long })
  expect(await text(ui, noteTooLong(long.length))).toBeDefined()
  expect((await field(ui, 'task-editing'))?.props.value).toBe(long)
  expect(await text(ui, /^1\. yyy/)).toBeUndefined()
  await ui.input({ key: 'task-editing', text: '' })
  expect(await text(ui, NOTE_EMPTY)).toBeDefined()
  expect(await field(ui, 'task-editing')).toBeDefined()
  await ui.press({ key: 'task-cancel' })
  expect(await text(ui, '1. orig')).toBeDefined()
  expect(await field(ui, 'task-editing')).toBeUndefined()
  await ui.unmount()
})

test('T18 cancelling an edit sends nothing and keeps the old text', async ($, on) => {
  quiet(on)
  let submits = 0
  on('prompt.submit', (_, e) => { submits += 1; return { text: e.text } })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'my-tasks' })
  await add(ui, 'old')
  await ui.press({ key: 'task-edit-1' })
  await ui.press({ key: 'task-cancel' })
  expect(await text(ui, '1. old')).toBeDefined()
  expect(await field(ui, 'task-editing')).toBeUndefined()
  expect(submits).toBe(0)
  await ui.unmount()
})

test('T30 the list lives in the plugin state: a remount draws it without a press', async ($, on) => {
  quiet(on)
  const first = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await first.press({ key: 'my-tasks' })
  await add(first, 'keep me')
  await first.unmount()
  const again = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await text(again, '1. keep me')).toBeDefined()
  expect((await button(again, 'my-tasks'))?.props.label).toBe('tasks (1)')
  await again.unmount()
})

test('T31 Close clears the dim line and the edit; the next open shows neither', async ($, on) => {
  quiet(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'my-tasks' })
  await add(ui, 'x')
  await ui.press({ key: 'task-edit-1' })
  await ui.input({ key: 'task-editing', text: '' })
  expect(await text(ui, NOTE_EMPTY)).toBeDefined()
  await ui.press({ key: 'tasks-close' })
  await ui.press({ key: 'my-tasks' })
  expect(await text(ui, NOTE_EMPTY)).toBeUndefined()
  expect(await field(ui, 'task-editing')).toBeUndefined()
  expect(await text(ui, '1. x')).toBeDefined()
  await ui.unmount()
})

test('T32 a long note is drawn whole in one wrapping Text', async ($, on) => {
  quiet(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'my-tasks' })
  const long = 'word '.repeat(61).trim()
  await add(ui, long)
  const row = await text(ui, `1. ${long}`)
  expect(row?.props.wrap).toBe('wrap')
  expect(long.length).toBeGreaterThanOrEqual(300)
  await ui.unmount()
})

// --- the add button and the draft kept on each edit (1.3.2) ---

for (const surface of SURFACES) {
  test(`A1 typing adds nothing; the add button then takes the last text typed (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    await type(ui, 'b')
    await type(ui, 'buy milk')
    expect(await text(ui, /^1\. /)).toBeUndefined()
    expect(await label(ui)).toBe('tasks (0)')
    expect(await draw(ui)).toBe('') // typing is the field's own business: the stored draft does not follow it (F5)
    await ui.press({ key: 'tasks-add' })
    expect((await text(ui, /^1\. buy milk$/))?.text).toBe('1. buy milk')
    await ui.unmount()
  })

  test(`A2 the add button adds the typed note and empties the field (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    await type(ui, 'buy milk')
    await ui.press({ key: 'tasks-add' })
    expect((await text(ui, /^1\. buy milk$/))?.text).toBe('1. buy milk')
    expect(await draw(ui)).toBe('')
    expect(await label(ui)).toBe('tasks (1)')
    expect((await button(ui, 'tasks-add'))?.props.label).toBe('add')
    expect((await addField(ui))?.props.submitLabel).toBe('add')
    await ui.unmount()
  })

  test(`A3 Enter after typing adds one note and empties the field (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    await type(ui, 'x')
    await add(ui, 'x')
    expect(await text(ui, '1. x')).toBeDefined()
    expect(await draw(ui)).toBe('')
    expect(await label(ui)).toBe('tasks (1)')
    await ui.unmount()
  })

  test(`A4 the add button on an empty or blank draft refuses and keeps the text (${surface})`, async ($, on) => {
    quiet(on)
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-tasks' })
    await ui.press({ key: 'tasks-add' })
    expect((await text(ui, NOTE_EMPTY))?.props.dimColor).toBe(true)
    expect(await text(ui, /^1\. /)).toBeUndefined()
    expect(await label(ui)).toBe('tasks (0)')
    await type(ui, '   ')
    await ui.press({ key: 'tasks-add' })
    expect((await text(ui, NOTE_EMPTY))?.props.dimColor).toBe(true)
    expect(await text(ui, /^1\. /)).toBeUndefined()
    expect(await label(ui)).toBe('tasks (0)')
    expect(await draw(ui)).toBe('   ')
    await ui.unmount()
  })
}
