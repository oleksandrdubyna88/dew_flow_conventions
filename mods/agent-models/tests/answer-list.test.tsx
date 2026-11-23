import { expect, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'

import { BAND, SURFACES, text as drawnText } from './limits-fixtures'
import { answer, question, session, spin } from './answer-fixtures'
import {
  A, B, FULLSCREEN, GREY, ICON_ON, iconOf, idOf, lastListOpen, lastPins, MAIN_SCREEN, manyPins, mountRow, pin, pinWorld, RASPBERRY,
  SCROLL_REJECTED, seededList, seededPins,
} from './pins-fixtures'

// The list under the `last answer` button (1.6.0): the button's two states, the first row (the last question), the pin rows and their
// `x`, and the views closing each other. The harness cannot see where the mod's own scroll goes: a press that scrolls is seen by the toast of the engine's rejection.

type Ui = Mounted<'terminal' | 'desktop', 'AbovePrompt'>
const QUESTION = 'Why is this red?'
const start = async ($: Engine) => {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await spin()
}
const keysOf = async (ui: Ui) => (await ui.findAll({ type: 'Button' })).flatMap(b => (b.key === undefined ? [] : [b.key]))
const listKeys = async (ui: Ui) => (await keysOf(ui)).filter(k => k === 'answer-last' || k.startsWith('pin-'))
const labelOf = async (ui: Ui, key: string) => (await ui.find({ type: 'Button', key }))?.props.label
const press = async (ui: Ui, key: string) => {
  await ui.press({ key })
  await spin()
  await ui.redraw()
}
// A session whose transcript holds the owner's question, the pin world, and a started session.
const setup = async ($: Engine, on: Parameters<typeof session>[0], rows = [question(QUESTION, 'u1'), answer('a1')]) => {
  const s = session(on, rows)
  const w = pinWorld(on, false)
  return { s, w }
}
const band = ($: Engine, surface: 'terminal' | 'desktop' = 'terminal', viewport: typeof FULLSCREEN | typeof MAIN_SCREEN = FULLSCREEN) =>
  $.ui.mount({ ...BAND, surface, viewport })

// --- the button ---

for (const surface of SURFACES) {
  test(`L1 the button reads last answer ▾ closed and ▴ open; a press toggles the list under the account row (${surface})`, async ($, on) => {
    await setup($, on)
    await start($)
    const ui = await band($, surface)
    expect(await labelOf(ui, 'last-answer')).toBe('last answer ▾')
    expect(await listKeys(ui)).toEqual([])
    await press(ui, 'last-answer')
    expect(await labelOf(ui, 'last-answer')).toBe('last answer ▴')
    const keys = await keysOf(ui)
    expect(keys.indexOf('answer-last')).toBeGreaterThan(keys.indexOf('last-answer'))
    await press(ui, 'last-answer')
    expect(await labelOf(ui, 'last-answer')).toBe('last answer ▾')
    expect(await listKeys(ui)).toEqual([])
    await ui.unmount()
  })
}

test('L2 the open list: the question first, then the pins oldest first, each with an x', async ($, on) => {
  await setup($, on)
  seededPins(on, [pin(A, 'first pinned answer'), pin(B, 'second pinned answer')])
  await start($)
  const ui = await band($)
  await press(ui, 'last-answer')
  expect(await listKeys(ui)).toEqual(['answer-last', `pin-go-${A}`, `pin-x-${A}`, `pin-go-${B}`, `pin-x-${B}`])
  expect(await labelOf(ui, 'answer-last')).toBe(`› ${QUESTION}`)
  expect(await labelOf(ui, `pin-go-${A}`)).toBe(`${ICON_ON} first pinned answer`)
  expect(await labelOf(ui, `pin-go-${B}`)).toBe(`${ICON_ON} second pinned answer`)
  expect((await ui.find({ type: 'Text', text: ICON_ON }))?.props.color).toBe(RASPBERRY)
  expect((await ui.findAll({ type: 'Text', text: /^x$/ })).map(x => x.props.color)).toEqual(['#ef4444', '#ef4444'])
  await ui.unmount()
})

// The harness cannot see where the mod's scroll goes (see `pinWorld`): a press is seen by the toast of the engine's rejection, under the
// row's own heading. The target and the order of the call are tested on `pressLastAnswer` and `pressPin` with fakes (T10, T12, L4a).
test('L3 a press on the first row scrolls (the toast of the rejected scroll names the last answer) and does not close the list', async ($, on) => {
  const { s } = await setup($, on)
  await start($)
  const ui = await band($)
  await press(ui, 'last-answer')
  await press(ui, 'answer-last')
  expect(s.toasts).toEqual([`last answer: ${SCROLL_REJECTED}`])
  expect(await labelOf(ui, 'last-answer')).toBe('last answer ▴')
  await ui.unmount()
})

test('L4 a press on a pin row scrolls (a pin toast); L12 the scroll is refused: a toast, the pins stay, nothing is written, nothing throws', async ($, on) => {
  const { s, w } = await setup($, on)
  seededPins(on, [pin(A, 'one'), pin(B, 'two')])
  await start($)
  const ui = await band($)
  await press(ui, 'last-answer')
  await press(ui, `pin-go-${B}`)
  await press(ui, `pin-go-${A}`)
  expect(s.toasts, 'the engine here rejects every scroll').toEqual([`pin: ${SCROLL_REJECTED}`, `pin: ${SCROLL_REJECTED}`])
  expect(await listKeys(ui), 'the pins stay').toEqual(['answer-last', `pin-go-${A}`, `pin-x-${A}`, `pin-go-${B}`, `pin-x-${B}`])
  expect(lastPins(w), 'a scroll never writes the pins').toBeUndefined()
  await ui.unmount()
})

test('L5 a press on x removes the pin: the list redraws without it and the icon under its row turns grey', async ($, on) => {
  const { w } = await setup($, on)
  seededPins(on, [pin(A, 'one'), pin(B, 'two')])
  await start($)
  const ui = await band($)
  const row = await mountRow($, A, { text: 'one' })
  expect((await iconOf(row))?.props.color).toBe(RASPBERRY)
  await press(ui, 'last-answer')
  await press(ui, `pin-x-${A}`)
  expect(lastPins(w)).toEqual([pin(B, 'two')])
  expect(await listKeys(ui)).toEqual(['answer-last', `pin-go-${B}`, `pin-x-${B}`])
  await row.redraw()
  expect((await iconOf(row))?.props.color).toBe(GREY)
  await row.unmount()
  await ui.unmount()
})

test('L6 with no question yet the first row is dim text with no press', async ($, on) => {
  await setup($, on, [])
  await start($)
  const ui = await band($)
  await press(ui, 'last-answer')
  expect((await ui.find({ type: 'Text', text: '› no question yet' }))?.props.dimColor).toBe(true)
  expect(await listKeys(ui)).toEqual([])
  await ui.unmount()
})

test('L7 the list stays open after a scroll; only the button closes it', async ($, on) => {
  const { s, w } = await setup($, on)
  seededPins(on, [pin(A, 'one')])
  await start($)
  const ui = await band($)
  await press(ui, 'last-answer')
  await press(ui, 'answer-last')
  await press(ui, `pin-go-${A}`)
  expect(s.toasts).toHaveLength(2) // both rows scrolled (the engine here rejects the scroll)
  expect(await labelOf(ui, 'last-answer')).toBe('last answer ▴')
  expect(await listKeys(ui)).toEqual(['answer-last', `pin-go-${A}`, `pin-x-${A}`])
  await press(ui, 'last-answer')
  expect(await listKeys(ui)).toEqual([])
  expect(lastListOpen(w)).toBe(false)
  await ui.unmount()
})

test('L8 the list, the tasks view and the message viewer close each other', async ($, on) => {
  await setup($, on)
  await start($)
  const ui = await band($)
  const isViewer = async () => (await drawnText(ui, /^Message /)) !== undefined
  const isTasks = async () => (await ui.find({ type: 'Button', key: 'tasks-close' })) !== undefined
  const isList = async () => (await labelOf(ui, 'last-answer')) === 'last answer ▴'
  await press(ui, 'last-answer')
  expect([await isList(), await isTasks(), await isViewer()]).toEqual([true, false, false])
  await press(ui, 'my-tasks')
  expect([await isList(), await isTasks(), await isViewer()], 'the tasks view closes the list').toEqual([false, true, false])
  await press(ui, 'last-answer')
  expect([await isList(), await isTasks(), await isViewer()], 'the list closes the tasks view').toEqual([true, false, false])
  await press(ui, 'my-messages')
  await press(ui, 'close') // the viewer is drawn in a moment: the first redraw may still show it loading
  expect(await isList(), 'the viewer closed the list').toBe(false)
  await press(ui, 'my-messages')
  expect(await isViewer()).toBe(true)
  expect(await isList()).toBe(false)
  await press(ui, 'last-answer')
  expect([await isList(), await isTasks(), await isViewer()], 'the list closes the viewer').toEqual([true, false, false])
  await ui.unmount()
})

// A refused write of one view's state must not leave another view open: each opener runs ALL its closes, whatever one of them does.
for (const [name, denied, steps] of [
  ['the list opening, the viewer\'s write refused: the tasks view still closes', 'viewer', ['my-tasks', 'last-answer']],
  ['the tasks view opening, the viewer\'s write refused: the list still closes', 'viewer', ['last-answer', 'my-tasks']],
  ['the viewer opening, the tasks view\'s write refused: the list still closes', 'tasks', ['last-answer', 'my-messages']],
] as const) {
  test(`L8b ${name}`, async ($, on) => {
    await setup($, on)
    on('state.set', { plugin: 'agent-models', key: denied }, () => ({ deny: 'refused' }))
    await start($)
    const ui = await band($)
    const isTasks = async () => (await ui.find({ type: 'Button', key: 'tasks-close' })) !== undefined
    const isList = async () => (await labelOf(ui, 'last-answer')) === 'last answer ▴'
    for (const key of steps) await press(ui, key)
    const last = steps.at(-1)
    const open = [await isList(), await isTasks()]
    if (last === 'last-answer') expect(open, 'only the list is open').toEqual([true, false])
    else if (last === 'my-tasks') expect(open, 'only the tasks view is open').toEqual([false, true])
    else expect(await isList(), 'the list is closed by the viewer\'s opener').toBe(false)
    await ui.unmount()
  })
}

test('L9 on the terminal main screen no button and no list, even when the list is stored open', async ($, on) => {
  await setup($, on)
  seededList(on, true)
  seededPins(on, [pin(A, 'one')])
  await start($)
  const ui = await band($, 'terminal', MAIN_SCREEN)
  expect(await keysOf(ui)).not.toContain('last-answer')
  expect(await listKeys(ui)).toEqual([])
  await ui.unmount()
})

test('L10 while a question is pending the first row shows the text before it with (sending…), and the press goes there', async ($, on) => {
  const { s } = await setup($, on)
  s.seed = { pending: 'a second question', previous: 'u1', previousText: QUESTION }
  await start($)
  const ui = await band($)
  await press(ui, 'last-answer')
  expect(await labelOf(ui, 'answer-last')).toBe(`› ${QUESTION} (sending…)`)
  await press(ui, 'answer-last')
  expect(s.toasts, 'the press scrolls (to u1: see T12 for the target); it does not say the question is missing').toEqual([`last answer: ${SCROLL_REJECTED}`])
  await ui.unmount()
})

test('L10b a pending question with no text before it still shows a row; with no question before it the press toasts', async ($, on) => {
  const { s } = await setup($, on)
  s.seed = { pending: 'a second question', previous: 'u1' } // stored by 1.5.0: no previousText
  await start($)
  const ui = await band($)
  await press(ui, 'last-answer')
  expect(await labelOf(ui, 'answer-last')).toBe('› last question (sending…)')
  await ui.unmount()
  s.seed = { pending: 'only question' }
  const alone = await band($) // the list is still stored open
  expect(await labelOf(alone, 'answer-last')).toBe('› only question (sending…)')
  await press(alone, 'answer-last')
  expect(s.toasts).toEqual(['last answer: your question is not in the transcript yet'])
  await alone.unmount()
})

test('L11 fifty pins: every row is drawn, nothing is cut by the mod', async ($, on) => {
  await setup($, on)
  seededPins(on, manyPins(50))
  seededList(on, true)
  await start($)
  const ui = await band($)
  const keys = await listKeys(ui)
  expect(keys.filter(k => k.startsWith('pin-go-'))).toHaveLength(50)
  expect(keys.filter(k => k.startsWith('pin-x-'))).toHaveLength(50)
  expect(keys[0]).toBe('answer-last')
  expect(keys[1]).toBe(`pin-go-${idOf(1)}`)
  expect(keys.at(-1)).toBe(`pin-x-${idOf(50)}`)
  await ui.unmount()
})

// --- the text of the first row ---

test('Q1 the question text is cut to 60 characters with an ellipsis, at its first line', async ($, on) => {
  await setup($, on, [question(`${'q'.repeat(80)}\nsecond line`, 'u1')])
  await start($)
  const ui = await band($)
  await press(ui, 'last-answer')
  expect(await labelOf(ui, 'answer-last')).toBe(`› ${'q'.repeat(59)}…`)
  await ui.unmount()
})

for (const [name, raw, shown] of [
  ['a reminder block is dropped', '<system-reminder>noise</system-reminder>\nthe real ask\nand more', 'the real ask'],
  ['blanks are collapsed', '  \n  spaced   out  ', 'spaced out'],
  ['a quote mark is kept: the question is the owner\'s words', '> not a quote mark here', '> not a quote mark here'],
] as const) {
  test(`Q2 the question text: ${name}`, async ($, on) => {
    await setup($, on, [question(raw, 'u1')])
    await start($)
    const ui = await band($)
    await press(ui, 'last-answer')
    expect(await labelOf(ui, 'answer-last')).toBe(`› ${shown}`)
    await ui.unmount()
  })
}

// --- a value stored by an older version ---

test('P9 a state stored before 1.6.0 (no pins, no list flag, a 1.5.0 question with no text) reads fine', async ($, on) => {
  const { s } = await setup($, on)
  s.seed = { uuid: 'u1' }
  await start($)
  const ui = await band($)
  expect(await labelOf(ui, 'last-answer')).toBe('last answer ▾')
  await press(ui, 'last-answer')
  expect(await labelOf(ui, 'answer-last')).toBe('› last question')
  expect(await listKeys(ui)).toEqual(['answer-last'])
  const row = await mountRow($, A)
  expect((await iconOf(row))?.props.color, 'no pins: grey').toBe(GREY)
  await row.unmount()
  await ui.unmount()
})
