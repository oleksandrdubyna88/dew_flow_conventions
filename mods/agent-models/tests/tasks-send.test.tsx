import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { On, ProcessRunResult } from 'claude-code'

import { ACCOUNT_COLOR } from '../hooks/prompts'
import { NOTE_EMPTY, SENDING } from '../hooks/tasks'
import { add, addField } from './tasks-fixtures'

// Apply and To prompt: what they send, what they remove, what they say. The list itself is tests/tasks.test.tsx.

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
const quiet = (on: On) => on('agent.list', () => ({ value: [] }))
const spin = async () => {
  for (let i = 0; i < 50; i += 1) await Promise.resolve()
}
const ok = (stdout: string): ProcessRunResult => ({ exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false })

type Sent = { text: string; origin: unknown }
const accepting = (on: On) => {
  const sent: Sent[] = []
  on('prompt.submit', (_, e) => {
    sent.push({ text: e.text, origin: e.origin })
    return { text: e.text }
  })
  return sent
}
const filling = (on: On, draft: string, result: { isFilled: boolean }) => {
  const fills: { text: string; mode: unknown }[] = []
  on('prompt.read', () => ({ value: { text: draft, cursor: draft.length } }))
  on('prompt.fill', (_, e) => {
    fills.push({ text: e.text, mode: e.mode })
    return result
  })
  return fills
}
const opened = async ($: Engine, surface: (typeof SURFACES)[number]) => {
  const ui = await $.ui.mount({ ...BAND, surface })
  await ui.press({ key: 'my-tasks' })
  return ui
}

for (const surface of SURFACES) {
  test(`T19 Apply submits the note as the person's own words and removes it (${surface})`, async ($, on) => {
    quiet(on)
    const sent = accepting(on)
    const ui = await opened($, surface)
    await add(ui, 'run the tests')
    await ui.press({ key: 'task-apply-1' })
    expect(sent).toHaveLength(1)
    expect(sent[0]?.text).toBe('run the tests')
    expect(sent[0]?.origin).toMatchObject({ kind: 'plugin', name: 'agent-models', asUser: true })
    expect(await text(ui, '1. run the tests')).toBeUndefined()
    expect((await button(ui, 'my-tasks'))?.props.label).toBe('tasks (0)')
    expect(await text(ui, SENDING)).toBeUndefined()
    expect(await text(ui, /^Not sent/)).toBeUndefined()
    await ui.unmount()
  })

  test(`T20 a dropped Apply keeps the note; the next action clears the line (${surface})`, async ($, on) => {
    quiet(on)
    on('prompt.submit', () => ({ drop: 'a hook said no' }))
    const ui = await opened($, surface)
    await add(ui, 'x')
    await ui.press({ key: 'task-apply-1' })
    expect(await text(ui, '1. x')).toBeDefined()
    expect((await text(ui, 'Not sent: a hook said no'))?.props.dimColor).toBe(true)
    expect((await button(ui, 'task-apply-1'))?.props.dimColor).toBeFalsy()
    await ui.press({ key: 'task-up-1' })
    expect(await text(ui, /^Not sent/)).toBeUndefined()
    expect(await text(ui, '1. x')).toBeDefined()
    await ui.unmount()
  })

  test(`T23 To prompt appends after a draft, fills once, removes the note, submits nothing (${surface})`, async ($, on) => {
    quiet(on)
    const sent = accepting(on)
    const fills = filling(on, 'draft', { isFilled: true })
    const ui = await opened($, surface)
    await add(ui, 'note')
    await ui.press({ key: 'task-prompt-1' })
    expect(fills).toEqual([{ text: '\nnote', mode: 'append' }])
    expect(await text(ui, '1. note')).toBeUndefined()
    expect(sent).toHaveLength(0)
    await ui.unmount()
  })
}

test('T23 To prompt adds no newline to an empty box', async ($, on) => {
  quiet(on)
  const fills = filling(on, '', { isFilled: true })
  const ui = await opened($, 'terminal')
  await add(ui, 'note')
  await ui.press({ key: 'task-prompt-1' })
  expect(fills[0]?.text).toBe('note')
  await ui.unmount()
})

test('T21 a rejected submit keeps the note and says why in one line', async ($, on) => {
  quiet(on) // no prompt.submit hook: the kit rejects with a HooksError
  const ui = await opened($, 'terminal')
  await add(ui, 'x')
  await ui.press({ key: 'task-apply-1' })
  expect(await text(ui, '1. x')).toBeDefined()
  expect(await text(ui, /^Not sent: no implementation for prompt\.submit/)).toBeDefined()
  await ui.unmount()
})

test('T22 while a submit is unsettled no Apply sends again; the notes are dim and the first one goes when it settles', async ($, on) => {
  quiet(on)
  let submits = 0
  let release: () => void = () => undefined
  const held = new Promise<void>(resolve => {
    release = resolve
  })
  on('prompt.submit', async (_, e) => {
    submits += 1
    await held
    return { text: e.text }
  })
  const ui = await opened($, 'terminal')
  await add(ui, 'a')
  await add(ui, 'b')
  const first = ui.press({ key: 'task-apply-1' })
  await spin()
  await ui.redraw()
  expect(await text(ui, SENDING)).toBeDefined()
  expect((await button(ui, 'task-apply-1'))?.props.dimColor).toBe(true)
  expect((await button(ui, 'task-apply-2'))?.props.dimColor).toBe(true)
  expect(submits).toBe(1)
  await ui.press({ key: 'task-apply-2' })
  await ui.press({ key: 'task-apply-1' })
  expect(submits).toBe(1)
  release()
  await first
  expect(submits).toBe(1)
  expect(await text(ui, '1. a')).toBeUndefined()
  expect(await text(ui, '1. b')).toBeDefined()
  expect(await text(ui, SENDING)).toBeUndefined()
  await ui.press({ key: 'task-apply-2' })
  expect(submits).toBe(2)
  await ui.unmount()
})

for (const surface of SURFACES) {
  test(`L-W1 an Apply that waits says so in the operator's words, and L-W2 the line goes when the submit settles (${surface})`, async ($, on) => {
    quiet(on)
    let release: () => void = () => undefined
    const held = new Promise<void>(resolve => {
      release = resolve
    })
    on('prompt.submit', async (_, e) => {
      await held
      return { text: e.text }
    })
    const ui = await opened($, surface)
    await add(ui, 'a')
    const first = ui.press({ key: 'task-apply-1' })
    await spin()
    await ui.redraw()
    const waiting = await text(ui, /^Waits until Claude finishes this turn$/)
    expect(waiting?.text).toBe('Waits until Claude finishes this turn') // a literal, never the constant
    expect(waiting?.props).toEqual({ dimColor: true })
    expect(await text(ui, /Sending/)).toBeUndefined()
    release()
    await first
    await ui.redraw()
    expect(await text(ui, /^Waits until/)).toBeUndefined()
    expect(await text(ui, '1. a')).toBeUndefined() // the note went with it
    expect(SENDING).toBe('Waits until Claude finishes this turn') // the constant the other tests use IS the drawn text
    await ui.unmount()
  })
}

test('T24 a refused fill keeps the note; the next action clears the line', async ($, on) => {
  quiet(on)
  filling(on, '', { isFilled: false })
  const ui = await opened($, 'terminal')
  await add(ui, 'note')
  await ui.press({ key: 'task-prompt-1' })
  expect(await text(ui, '1. note')).toBeDefined()
  expect((await text(ui, 'Not put in the prompt box: unknown reason'))?.props.dimColor).toBe(true)
  await ui.press({ key: 'task-down-1' })
  expect(await text(ui, /^Not put in/)).toBeUndefined()
  expect(await text(ui, '1. note')).toBeDefined()
  await ui.unmount()
})

test('T26 the buttons follow the note, not its place: Apply after a reorder sends the right text', async ($, on) => {
  quiet(on)
  const sent = accepting(on)
  const ui = await opened($, 'terminal')
  await add(ui, 'a')
  await add(ui, 'b')
  await ui.press({ key: 'task-down-1' })
  expect(await text(ui, '1. b')).toBeDefined()
  expect(await text(ui, '2. a')).toBeDefined()
  expect(await button(ui, 'task-apply-1')).toBeDefined()
  await ui.press({ key: 'task-apply-1' })
  expect(sent.map(s => s.text)).toEqual(['a'])
  expect(await text(ui, '1. b')).toBeDefined()
  expect(await button(ui, 'task-apply-2')).toBeDefined()
  await ui.unmount()
})

// --- the two views, and the account row ---

for (const surface of SURFACES) {
  test(`T28 the tasks view and the messages viewer are never open together (${surface})`, async ($, on) => {
    quiet(on)
    on('session.messages', () => ({ value: [{ role: 'user', text: 'hello', toolUses: [] }] }))
    const ui = await opened($, surface)
    expect(await addField(ui)).toBeDefined()
    await ui.press({ key: 'my-messages' })
    expect(await addField(ui)).toBeUndefined()
    expect(await text(ui, 'Tasks (0)')).toBeUndefined()
    expect(await text(ui, 'Message 1 / 1')).toBeDefined()
    expect(await button(ui, 'my-tasks')).toBeDefined()
    expect(await button(ui, 'login')).toBeDefined()
    await ui.press({ key: 'my-tasks' })
    expect(await text(ui, 'Message 1 / 1')).toBeUndefined()
    expect(await text(ui, 'Tasks (0)')).toBeDefined()
    expect(await button(ui, 'my-messages')).toBeDefined()
    await ui.unmount()
  })

  test(`T29 the account row stays while the tasks view is open (${surface})`, async ($: Engine, on) => {
    mock.clock(on)
    on('session.start', (_, e) => ({ cwd: e.cwd }))
    quiet(on)
    on('session.identity', () => ({ value: { deny: 'not a managed mod' } }))
    on('process.run', () => ({ value: ok(JSON.stringify({ loggedIn: true, email: 'dev@example.com' })) }))
    await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
    for (let i = 0; i < 1000; i += 1) await Promise.resolve()
    const ui = await opened($, surface)
    expect((await text(ui, 'dev@example.com'))?.props.color).toBe(ACCOUNT_COLOR)
    expect(await button(ui, 'login')).toBeDefined()
    expect(await button(ui, 'my-messages')).toBeDefined()
    expect(await text(ui, 'Tasks (0)')).toBeDefined()
    expect(await text(ui, NOTE_EMPTY)).toBeUndefined()
    await ui.unmount()
  })
}
