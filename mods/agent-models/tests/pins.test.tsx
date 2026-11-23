import { expect, test } from 'claude-code/testing'
import type { UiScrollArgs, UiScrollResult } from 'claude-code'

import { cutText, droppedPin, headLine, nextPins, PIN_LIMIT, pinPress, pinText, PREFIX_MAX, runPress } from '../hooks/pins'
import { gate, macrotask } from './answer-fixtures'
import { SURFACES } from './limits-fixtures'
import {
  A, B, GREY, ICON_OFF, ICON_ON, iconOf, idOf, lastListOpen, lastPins, manyPins, MAIN_SCREEN, mountRow, pin, pinButton, pinWorld,
  PINS_KEY, pressPinIcon, RASPBERRY, seededPins,
} from './pins-fixtures'
import { spin } from './account-fixtures'

// Pins on Claude's text answers (1.6.0): the pin text, the list of pins, the icon under each answer block and its press. The harness
// cannot see where the mod's own scroll goes, so the press helpers take the scroll and the toast as arguments (fakes).

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

// --- the text of a pin ---

test('P12 the pin text is the first content line without markdown marks: heading, quote, list, fence', () => {
  expect(headLine('# A title\nbody')).toBe('A title')
  expect(headLine('### Deep\nbody')).toBe('Deep')
  expect(headLine('> quoted words\nmore')).toBe('quoted words')
  expect(headLine('- first item\n- second')).toBe('first item')
  expect(headLine('* star item')).toBe('star item')
  expect(headLine('12. numbered')).toBe('numbered')
  expect(headLine('3) numbered too')).toBe('numbered too')
  expect(headLine('> - a quoted item')).toBe('a quoted item')
  expect(headLine('```ts\nconst x = 1\n```')).toBe('const x = 1')
  expect(headLine('~~~\nplain code\n~~~')).toBe('plain code')
  expect(headLine('\n\n   \n#\nthe real line')).toBe('the real line')
  expect(headLine('plain   words\n  here')).toBe('plain words')
  expect(headLine('```\n```')).toBe('')
})

test('P4b the pin text is cut to 60 characters with an ellipsis, and a cut never splits a character', () => {
  expect(headLine('x'.repeat(60))).toBe('x'.repeat(60))
  const cut = headLine('x'.repeat(80))
  expect(cut).toBe(`${'x'.repeat(59)}…`)
  expect(cut).toHaveLength(60)
  const emoji = headLine('\u{1F600}'.repeat(70))
  expect([...emoji]).toHaveLength(60)
  expect(emoji.endsWith('…')).toBe(true)
  expect(emoji).not.toContain('�')
})

test('P11 an engine notice or a block that is empty when clean has no pin text', () => {
  expect(pinText('Hello')).toBe('Hello')
  expect(pinText('<system-reminder>noise</system-reminder>\n\nReal words')).toBe('Real words')
  expect(pinText('API Error: 529 overloaded')).toBeUndefined()
  expect(pinText('No response requested.')).toBeUndefined()
  expect(pinText('<system-reminder>only a reminder</system-reminder>')).toBeUndefined()
  expect(pinText('   \n  ')).toBeUndefined()
  expect(pinText('```\n```')).toBeUndefined()
})

// --- the list of pins ---

test('P4c nextPins adds a pin at the end, and removes it when it is there; the input is never changed', () => {
  const before = [pin(A, 'one')]
  const added = nextPins(before, pin(B, 'two'))
  expect(added).toEqual([pin(A, 'one'), pin(B, 'two')])
  expect(before).toEqual([pin(A, 'one')])
  expect(nextPins(added, pin(A, 'whatever'))).toEqual([pin(B, 'two')])
})

test('P5 the 51st pin drops the oldest', () => {
  const full = manyPins(PIN_LIMIT)
  expect(PIN_LIMIT).toBe(50)
  const next = nextPins(full, pin(idOf(999), 'newest'))
  expect(next).toHaveLength(50)
  expect(next[0]).toEqual(full[1])
  expect(next.at(-1)).toEqual(pin(idOf(999), 'newest'))
  expect(nextPins(full.slice(0, 49), pin(idOf(999), 'newest'))).toHaveLength(50) // 49 + 1: nothing dropped
  expect(nextPins(full.slice(0, 49), pin(idOf(999), 'newest'))[0]).toEqual(full[0])
})

test('P5f droppedPin names the oldest only when a new pin meets a full list', () => {
  const full = manyPins(PIN_LIMIT)
  expect(droppedPin(full, pin(idOf(999), 'new'))).toEqual(full[0])
  expect(droppedPin(full, full[7] ?? pin(idOf(999), 'x')), 'an unpin is no drop').toBeUndefined()
  expect(droppedPin(full.slice(0, 49), pin(idOf(999), 'new'))).toBeUndefined()
  expect(droppedPin([], pin(A, 'one'))).toBeUndefined()
})

// --- the press helper ---

test('L4a a press on a pin scrolls once, at once, to its id with block start', async () => {
  const f = fakes()
  const pressing = runPress(f.scroll, f.toast, pinPress(pin(A, 'words of the pin')))
  expect(f.scrolls, 'the scroll is called before the press yields').toEqual([{ to: { requestId: A }, block: 'start' }])
  await pressing
  expect(f.scrolls).toHaveLength(1)
  expect(f.toasts).toEqual([])
})

test('L4b a pin row presses by the pin\'s id, never its text, and with the label pin', async () => {
  const mine = pin(A, 'words of the pin')
  expect(pinPress(mine)).toEqual({ label: 'pin', id: A })
  expect(pinPress(pin(B, A)), 'a text that looks like an id is not the target').toEqual({ label: 'pin', id: B })
  const f = fakes()
  await runPress(f.scroll, f.toast, pinPress(mine))
  expect(f.scrolls).toEqual([{ to: { requestId: A }, block: 'start' }])
})

test('L12a a refused or failed scroll is told in a toast and never thrown', async () => {
  const none = fakes(async () => ({ deny: 'none scrolls' }))
  await runPress(none.scroll, none.toast, pinPress(pin(A, 'words of the pin')))
  expect(none.toasts).toEqual(['pin: works in fullscreen only'])
  const gone = fakes(async () => ({ deny: 'no such row' }))
  await runPress(gone.scroll, gone.toast, pinPress(pin(A, 'words of the pin')))
  expect(gone.toasts).toEqual(['pin: no such row'])
  const broken = fakes(async () => {
    throw new Error('boom')
  })
  await runPress(broken.scroll, broken.toast, pinPress(pin(A, 'words of the pin')))
  expect(broken.toasts).toEqual(['pin: boom'])
  const thrown = fakes(() => {
    throw new Error('sync boom')
  })
  await runPress(thrown.scroll, thrown.toast, pinPress(pin(A, 'words of the pin')))
  expect(thrown.toasts).toEqual(['pin: sync boom'])
})

// --- the icon under an answer ---

for (const surface of SURFACES) {
  test(`P1 a text block draws the engine's row and a grey frameless icon under it (${surface})`, async ($, on) => {
    pinWorld(on)
    const ui = await mountRow($, A, { surface })
    expect(await ui.find({ type: 'Text', text: 'Hello there' }), 'the row the engine drew is kept').toBeDefined()
    const button = await pinButton(ui, A)
    expect(button?.props.plain).toBe(true)
    const icon = await iconOf(ui)
    expect(icon?.text).toBe(ICON_OFF)
    expect(icon?.props.color).toBe(GREY)
    expect((await ui.findAll({ type: 'Button' })).map(b => b.key)).toEqual([`pin-${A}`])
    await ui.unmount()
  })

  test(`P2 a pinned block draws the raspberry icon (${surface})`, async ($, on) => {
    pinWorld(on)
    seededPins(on, [pin(A, 'Hello there')])
    const ui = await mountRow($, A, { surface })
    const icon = await iconOf(ui)
    expect(icon?.text).toBe(ICON_ON)
    expect(icon?.props.color).toBe(RASPBERRY)
    await ui.unmount()
  })
}

test('P3 a summary block, a block that is empty when clean and the terminal main screen draw the engine row alone', async ($, on) => {
  pinWorld(on)
  const summary = await mountRow($, A, { isSummary: true })
  expect(await summary.find({ type: 'Text', text: 'Hello there' })).toBeDefined()
  expect(await summary.findAll({ type: 'Button' })).toEqual([])
  await summary.unmount()
  const empty = await mountRow($, B, { text: '<system-reminder>x</system-reminder>' })
  expect(await empty.findAll({ type: 'Button' })).toEqual([])
  await empty.unmount()
  const main = await mountRow($, A, { viewport: MAIN_SCREEN })
  expect(await main.find({ type: 'Text', text: 'Hello there' })).toBeDefined()
  expect(await main.findAll({ type: 'Button' })).toEqual([])
  await main.unmount()
  const unmeasured = await mountRow($, A, { viewport: undefined }) // a surface that did not measure still draws it
  expect(await unmeasured.findAll({ type: 'Button' })).toHaveLength(1)
  await unmeasured.unmount()
})

test('P10 a block whose requestId is not uuid-shaped has no icon', async ($, on) => {
  pinWorld(on)
  const ui = await mountRow($, 'placeholder')
  expect(await ui.find({ type: 'Text', text: 'Hello there' })).toBeDefined()
  expect(await ui.findAll({ type: 'Button' })).toEqual([])
  await ui.unmount()
})

test('P11b engine notice blocks have no icon', async ($, on) => {
  pinWorld(on)
  for (const text of ['API Error: 529 {"type":"overloaded_error"}', 'No response requested.']) {
    const ui = await mountRow($, A, { text })
    expect(await ui.find({ type: 'Text', text }), `the row of "${text}" is kept`).toBeDefined()
    expect(await ui.findAll({ type: 'Button' })).toEqual([])
    await ui.unmount()
  }
})

test('P4 a press pins the block with its clean first line cut to 60, a second press unpins it, and the icon follows', async ($, on) => {
  const w = pinWorld(on)
  const ui = await mountRow($, A, { text: `## ${'x'.repeat(80)}\nmore` })
  await pressPinIcon(ui, A)
  expect(lastPins(w)).toEqual([pin(A, `${'x'.repeat(59)}…`)])
  expect((await iconOf(ui))?.props.color).toBe(RASPBERRY)
  await pressPinIcon(ui, A)
  expect(lastPins(w)).toEqual([])
  expect((await iconOf(ui))?.props.color).toBe(GREY)
  expect(w.toasts).toEqual([])
  await ui.unmount()
})

test('P5b the 51st press drops the oldest pin', async ($, on) => {
  const w = pinWorld(on)
  seededPins(on, manyPins(PIN_LIMIT))
  const ui = await mountRow($, idOf(999), { text: 'the fifty-first' })
  await pressPinIcon(ui, idOf(999))
  const pins = lastPins(w) ?? []
  expect(pins).toHaveLength(50)
  expect(pins[0]).toEqual(pin(idOf(2), 'answer 2'))
  expect(pins.at(-1)).toEqual(pin(idOf(999), 'the fifty-first'))
  await ui.unmount()
})

test('P5c the 51st press drops the oldest pin AND a toast names it, after the write has landed', async ($, on) => {
  const w = pinWorld(on)
  seededPins(on, manyPins(PIN_LIMIT))
  const ui = await mountRow($, idOf(999), { text: 'the fifty-first' })
  await pressPinIcon(ui, idOf(999))
  expect(lastPins(w)?.some(p => p.id === idOf(1)), 'the oldest is dropped').toBe(false)
  expect(w.toasts).toEqual(['pin: oldest pin removed — answer 1'])
  expect(w.writesAtToast, 'the toast follows the write').toEqual([1])
  await ui.unmount()
})

test('P5d no oldest-pin toast while the list has room, and none on an unpin', async ($, on) => {
  const w = pinWorld(on)
  seededPins(on, manyPins(PIN_LIMIT - 1))
  const ui = await mountRow($, idOf(999), { text: 'the fiftieth' })
  await pressPinIcon(ui, idOf(999)) // 50 pins: full, nothing dropped
  expect(lastPins(w)).toHaveLength(50)
  await pressPinIcon(ui, idOf(999)) // unpinned
  expect(lastPins(w)).toHaveLength(49)
  expect(w.toasts).toEqual([])
  await ui.unmount()
})

test('P5e a refused write of the 51st pin tells the refusal only, never an oldest-pin toast', async ($, on) => {
  const w = pinWorld(on)
  seededPins(on, manyPins(PIN_LIMIT))
  on('state.set', PINS_KEY, () => ({ deny: 'refused' }))
  const ui = await mountRow($, idOf(999), { text: 'the fifty-first' })
  await pressPinIcon(ui, idOf(999))
  expect(w.toasts).toHaveLength(1)
  expect(w.toasts[0]?.startsWith('pin: oldest pin removed')).toBe(false)
  await ui.unmount()
})

test('P6 drawing never writes state, on mount, on a redraw or when the value is read', async ($, on) => {
  const w = pinWorld(on)
  seededPins(on, [pin(A, 'Hello there')])
  const ui = await mountRow($, A)
  await ui.redraw()
  await ui.redraw()
  await spin()
  expect(w.writes).toEqual([])
  await ui.unmount()
})

test('P7 a refused read draws the grey icon, and a press then is a toast; nothing throws', async ($, on) => {
  const w = pinWorld(on)
  on('state.get', PINS_KEY, () => ({ deny: 'refused' }))
  const ui = await mountRow($, A)
  expect((await iconOf(ui))?.props.color, 'the read was refused: not pinned').toBe(GREY)
  await pressPinIcon(ui, A)
  expect(w.toasts).toHaveLength(1)
  expect(w.toasts[0]?.startsWith('pin: ')).toBe(true)
  expect((await iconOf(ui))?.props.color).toBe(GREY)
  await ui.unmount()
})

test('P7b a refused write is a toast; the icon stays grey and nothing throws', async ($, on) => {
  const w = pinWorld(on)
  on('state.set', PINS_KEY, () => ({ deny: 'refused' }))
  const ui = await mountRow($, A)
  await pressPinIcon(ui, A)
  expect(w.writes.some(x => x.key === 'pins'), 'the press did try to write').toBe(true)
  expect(w.toasts).toHaveLength(1)
  expect(w.toasts[0]?.startsWith('pin: ')).toBe(true)
  expect((await iconOf(ui))?.props.color).toBe(GREY)
  await ui.unmount()
})

test('P8 a session end clears the pins and closes the list', async ($, on) => {
  const w = pinWorld(on)
  on('session.end', (_, e) => ({ sessionId: e.sessionId }))
  seededPins(on, [pin(A, 'one'), pin(B, 'two')])
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  await spin()
  expect(lastPins(w)).toEqual([])
  expect(lastListOpen(w)).toBe(false)
})

test('P13 two text blocks of one reply draw two icons and make two pins, each with its own id and text', async ($, on) => {
  const w = pinWorld(on)
  const first = await mountRow($, A, { text: 'The plan is below.' })
  const second = await mountRow($, B, { text: 'And the result is above.' })
  await pressPinIcon(first, A)
  await pressPinIcon(second, B)
  expect(lastPins(w)).toEqual([pin(A, 'The plan is below.'), pin(B, 'And the result is above.')])
  expect((await iconOf(first))?.props.color).toBe(RASPBERRY)
  expect((await iconOf(second))?.props.color).toBe(RASPBERRY)
  await pressPinIcon(first, A)
  expect(lastPins(w)).toEqual([pin(B, 'And the result is above.')])
  await first.unmount()
  await second.unmount()
})

// --- late work and long answers (1.6.0 final fixes) ---

test('P14 a press whose write is held while the session ends cannot bring the old session\'s pin back', async ($, on) => {
  const w = pinWorld(on)
  on('session.end', (_, e) => ({ sessionId: e.sessionId }))
  const g = gate()
  let held = 0
  on('state.set', PINS_KEY, async (_, e, next) => {
    held += 1
    if (held === 1) await g.wait // the press's write only; the clear's write goes through
    return next(e)
  })
  const ui = await mountRow($, A, { text: 'the old session' })
  await ui.press({ key: `pin-${A}` }) // the handler is not awaited by the press: its write waits at the gate
  for (let i = 0; i < 100 && held === 0; i += 1) await macrotask(5) // until the press's write is issued (and held)
  expect(held, 'the press reached its write and waits there').toBe(1)
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  await spin()
  expect(lastPins(w)).toEqual([])
  g.release()
  await spin()
  await macrotask(20)
  expect(lastPins(w), 'the late press did not add its pin back').toEqual([])
})

// A string that records every method the code calls on it: only `slice` may be called (the code reads a bounded prefix first).
const watched = (text: string): { value: string; touched: string[]; slices: [number, number | undefined][] } => {
  const touched: string[] = []
  const slices: [number, number | undefined][] = []
  const guard = new String(text) as String & Record<string, unknown>
  for (const name of Object.getOwnPropertyNames(String.prototype)) {
    const original: unknown = Reflect.get(String.prototype, name)
    if (name === 'constructor' || name === 'length' || typeof original !== 'function') continue
    Object.defineProperty(guard, name, {
      value: (...args: unknown[]) => {
        if (name === 'slice') slices.push([Number(args[0]), args[1] === undefined ? undefined : Number(args[1])])
        else touched.push(name)
        return Reflect.apply(original, text, args)
      },
    })
  }
  Object.defineProperty(guard, Symbol.iterator, { value: () => { touched.push('iterator'); return text[Symbol.iterator]() } })
  return { value: guard as unknown as string, touched, slices }
}

test('P15 a 1 MB answer with a 200 KB first line gives the same label, and only a bounded prefix is read', () => {
  const text = `${'x'.repeat(200_000)}\n${'y'.repeat(800_000)}`
  expect(text.length).toBeGreaterThan(1_000_000)
  const w = watched(text)
  expect(pinText(w.value)).toBe(`${'x'.repeat(59)}…`)
  expect(w.touched, 'nothing but slice is called on the full text').toEqual([])
  expect(w.slices).toEqual([[0, PREFIX_MAX]])
  expect(pinText(text)).toBe(`${'x'.repeat(59)}…`)
  expect(PREFIX_MAX).toBeGreaterThanOrEqual(4096)
  const lazy = watched('z'.repeat(PREFIX_MAX * 2))
  expect(cutText(lazy.value)).toBe(`${'z'.repeat(59)}…`) // cutText never spreads a long string
  expect(lazy.touched, 'cutText reads the string through its iterator only').toEqual(['iterator'])
  expect(headLine(`\n\n${'a'.repeat(PREFIX_MAX + 10)}`)).toBe(`${'a'.repeat(59)}…`)
  expect(pinText(`${'\n'.repeat(PREFIX_MAX)}late line`), 'a first line past the prefix gets no pin').toBeUndefined()
})
