import { expect, test } from 'claude-code/testing'

import { limitsFromBody, limitsLine, limitsText } from '../hooks/limits'
import { viewerFixedRows } from '../hooks/prompts'
import { answerWith, BAND, CLOCK_START, l1At, L1, measured, MEASURED, ownClock, pressLimits, RESETS_AT, spin, SURFACES, text, window, world } from './limits-fixtures'

// The 5-hour reset time of the limits line (1.4.0): the parser keeps one more value, the line says `resets in 1h 23m`, the value is
// coloured by the whole minutes left, it counts down while the line is open and a passed reset fetches again.

const MIN = 60_000
const GREEN = '#22c55e'
const ORANGE = '#f97316'
const RED = '#ef4444'
const bodyWith = (resetsAt: unknown) => JSON.stringify(measured({ five_hour: { ...window(13), resets_at: resetsAt } }))
const numbers = { fiveHour: 87, week: 74, model: { label: 'Fable', left: 82 } }
/** The measured line when `left` ms remain until the fixture's reset. */
const lineLeft = (left: number) => limitsLine({ ...numbers, fiveHourResetsAt: RESETS_AT }, RESETS_AT - left)
type Drawn = { children?: unknown[] }
/** The Texts of their own inside a drawn line: what each one says. */
const ownTexts = (line: Drawn | undefined) =>
  (line?.children ?? []).filter((c): c is Drawn => typeof c === 'object' && c !== null).map(c => c.children?.[0])

// --- pure ---

test('A1 resets_at with Z, +00:00, a microsecond fraction and +01:30 is read as the Date.parse value', () => {
  for (const stamp of ['2026-11-10T22:00:00Z', '2026-11-10T22:00:00+00:00', '2026-11-10T22:00:00.123456+00:00', '2026-11-10T23:30:00+01:30']) {
    expect(limitsFromBody(bodyWith(stamp))?.fiveHourResetsAt, stamp).toBe(Date.parse(stamp))
  }
})

test('A2 a resets_at that is null, absent, a number, garbage or has no offset is null', () => {
  for (const odd of [null, 1_762_812_000_000, 'garbage', '2026-11-12T10:00:00', '2026-11-12', '']) {
    expect(limitsFromBody(bodyWith(odd))?.fiveHourResetsAt, String(odd)).toBeNull()
  }
  expect(limitsFromBody(JSON.stringify(measured({ five_hour: { utilization: 13 } })))?.fiveHourResetsAt).toBeNull()
  expect(limitsFromBody('{}')?.fiveHourResetsAt).toBeNull()
})

test('A2b the parser keeps four values and nothing else', () => {
  expect(Object.keys(limitsFromBody(MEASURED) ?? {})).toEqual(['fiveHour', 'week', 'model', 'fiveHourResetsAt'])
})

test('A3 83 minutes left: the line says resets in 1h 23m between the 5h and the week part', () => {
  expect(lineLeft(83 * MIN)).toBe('5h 87% left · resets in 1h 23m · week 74% left · Fable 82% left')
  expect(lineLeft(83 * MIN + 59_999)).toBe(L1) // whole minutes: 83 min 59.999 s still shows 1h 23m
})

test('A4 the text of the time: 1h 0m, 59m, 1m, <1m, then a dash from the reset on', () => {
  const said = [60 * MIN, 59 * MIN, MIN, 59_000, 0, -5 * MIN].map(left => lineLeft(left).split(' · ')[1])
  expect(said).toEqual(['resets in 1h 0m', 'resets in 59m', 'resets in 1m', 'resets in <1m', 'resets in —', 'resets in —'])
})

test('A6 no reset time known: resets in a dash', () => {
  expect(limitsLine({ ...numbers, fiveHourResetsAt: null }, RESETS_AT)).toBe(l1At('—'))
})

test('A6b a clock that was refused (now null) says a dash, never a time from 0', () => {
  expect(limitsLine({ ...numbers, fiveHourResetsAt: RESETS_AT }, null)).toBe(l1At('—'))
})

test('A9a the open line is counted with the same now: a time is longer than a dash', () => {
  const view = { isOpen: true, email: 'a@b', fetchedAt: 0, isFailed: false, value: { ...numbers, fiveHourResetsAt: RESETS_AT } }
  const shown = limitsText(view, 'a@b', RESETS_AT - 83 * MIN)
  const dashed = limitsText(view, 'a@b', null)
  expect(shown).toBe(L1)
  expect(dashed).toBe(l1At('—'))
  // at 41 columns the line wraps in 41 - 11 = 30: 63 characters take 3 rows, 58 take 2
  expect(viewerFixedRows(41, false, undefined, shown)).toBe(viewerFixedRows(41, false, undefined, dashed) + 1)
})

// --- drawn ---

// The value is its own Text, coloured by the whole minutes left; the words `resets in ` stay a bare string.
const COLOURS: [number, string, string][] = [
  [9 * MIN + 59_000, '9m', GREEN],
  [10 * MIN, '10m', ORANGE],
  [30 * MIN, '30m', ORANGE],
  [30 * MIN + 30_000, '30m', ORANGE],
  [31 * MIN, '31m', RED],
  [59_000, '<1m', GREEN],
]
for (const [left, shown, colour] of COLOURS) {
  test(`A5 ${left} ms left: the value ${shown} is ${colour}, and only the value is coloured`, async ($, on) => {
    await world($, on, answerWith(200, MEASURED), undefined, { now: RESETS_AT - left })
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    await pressLimits(ui)
    const line = await ui.find({ type: 'Text', text: l1At(shown) })
    expect(line).toBeDefined()
    expect(ownTexts(line)).toEqual(['87%', shown, '74%', '82%'])
    expect((await text(ui, new RegExp(`^${shown}$`)))?.props.color).toBe(colour)
    expect(await text(ui, /^resets in $/)).toBeUndefined()
    await ui.unmount()
  })
}

for (const surface of SURFACES) {
  test(`A6c no reset time: the dash is bare text, no colour and no Text of its own (${surface})`, async ($, on) => {
    await world($, on, answerWith(200, bodyWith(null)))
    const ui = await $.ui.mount({ ...BAND, surface })
    await pressLimits(ui)
    const line = await ui.find({ type: 'Text', text: l1At('—') })
    expect(line).toBeDefined()
    expect(ownTexts(line)).toEqual(['87%', '74%', '82%'])
    await ui.unmount()
  })
}

test('A7 the open line counts down: the draw reads limitsMinute, a minute is written once, the redraw says one minute less', async ($, on) => {
  let reads = 0
  const writes: unknown[] = []
  on('state.get', { plugin: 'agent-models', key: 'limitsMinute' }, (_, e, next) => {
    reads += 1
    return next(e)
  })
  on('state.set', { plugin: 'agent-models', key: 'limitsMinute' }, (_, e, next) => {
    writes.push((JSON.parse(JSON.stringify(e)) as { value?: unknown }).value)
    return next(e)
  })
  const w = await world($, on, answerWith(200, MEASURED))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await text(ui, L1)).toBeDefined()
  expect(reads, 'the draw of the open line subscribes to the minute').toBeGreaterThan(0)
  const before = reads
  await w.clock.advance(MIN) // 83 min 59 s left at the press, 82 min 59 s a minute later
  expect(writes, 'one write a minute, none for the 28 ticks between').toEqual([83, 82])
  expect(reads, 'the write drew the reader again').toBeGreaterThan(before)
  await ui.redraw()
  expect(await text(ui, l1At('1h 22m'))).toBeDefined()
  await ui.unmount()
})

test('A8 a closed line writes no minute and neither its draw nor the tick asks the clock', async ($, on) => {
  const writes: unknown[] = []
  on('state.set', { plugin: 'agent-models', key: 'limitsMinute' }, (_, e, next) => {
    writes.push(e)
    return next(e)
  })
  const clk = ownClock(on, CLOCK_START)
  await world($, on, answerWith(200, MEASURED), undefined, { isClockOwn: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui) // open
  await pressLimits(ui) // closed
  await spin()
  writes.length = 0
  clk.nowCalls = 0
  await ui.redraw()
  for (let i = 0; i < 5; i += 1) await clk.tick(2_000)
  await ui.redraw()
  expect(writes, 'no minute is written while the line is closed').toHaveLength(0)
  expect(clk.nowCalls, 'the clock is asked by nobody while the line is closed').toBe(0)
  await ui.unmount()
})

// agents 0 + fixed 3 + the limits line 3 rows (63 characters in 41 - 11 = 30) + the note (118 characters in 41: 3 rows) + `hello` 1 = 10;
// a dash instead of the time (58 characters) is 2 rows, which would make 9
for (const [maxRows, header] of [[10, 'Message 1 / 1'], [9, 'Message 1 / 1 (scroll for more)']] as const) {
  test(`A9 the viewer counts the longer limits line with the draw now: at ${maxRows} rows the header says "${header}"`, async ($, on) => {
    on('session.messages', () => ({ value: [{ role: 'user', text: 'hello', toolUses: [] }] }))
    await world($, on, answerWith(200, MEASURED))
    const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, bodyColumns: 41, maxRows }, surface: 'terminal' })
    await pressLimits(ui)
    await ui.press({ key: 'my-messages' })
    await ui.redraw()
    expect((await text(ui, /^Message /))?.text).toBe(header)
    expect(await text(ui, L1)).toBeDefined()
    await ui.press({ key: 'close' })
    await ui.unmount()
  })
}

test('A10 a refused clock at the draw says a dash and no colour, never a time from 0', async ($, on) => {
  const clk = ownClock(on, CLOCK_START)
  await world($, on, answerWith(200, MEASURED), undefined, { isClockOwn: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await text(ui, L1)).toBeDefined()
  clk.isRefused = true
  await ui.redraw()
  const line = await ui.find({ type: 'Text', text: l1At('—') })
  expect(line, 'the line is drawn with a dash').toBeDefined()
  expect(ownTexts(line)).toEqual(['87%', '74%', '82%'])
  await ui.unmount()
})

test('A11 an open line whose reset has passed fetches once; a second tick within a minute fetches nothing', async ($, on) => {
  const w = await world($, on, answerWith(200, MEASURED), undefined, { now: RESETS_AT - MIN })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui) // fetch 1, a minute before the reset
  expect(w.calls).toHaveLength(1)
  await w.clock.advance(MIN - 2_000)
  expect(w.calls, 'the reset has not come yet').toHaveLength(1)
  await w.clock.advance(2_000) // the reset has passed and the last fetch ended a minute ago
  expect(w.calls, 'the passed reset fetched').toHaveLength(2)
  await w.clock.advance(MIN - 2_000) // the answer names the same passed time; a tick within a minute of the fetch's end
  expect(w.calls, 'a second tick within a minute fetches nothing').toHaveLength(2)
  await w.clock.advance(2_000)
  expect(w.calls, 'a minute after the last fetch it fetches again').toHaveLength(3)
  await ui.unmount()
})

test('A11b a closed line never fetches for a passed reset', async ($, on) => {
  const w = await world($, on, answerWith(200, MEASURED), undefined, { now: RESETS_AT - MIN })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  await pressLimits(ui) // closed
  await w.clock.advance(10 * MIN)
  expect(w.calls).toHaveLength(1)
  await ui.unmount()
})

// One clock read per draw: a pending login and the shown limits line both need the time, and share the one value.
test('A13 a pending login and an open limits line ask the clock once per draw; a refused clock still says a dash', async ($, on) => {
  on('command.run', { command: 'login' }, () => new Promise<{ text: string }>(() => undefined)) // the login never ends: pending
  const clk = ownClock(on, CLOCK_START)
  await world($, on, answerWith(200, MEASURED), undefined, { isClockOwn: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  await ui.press({ key: 'login' })
  await spin()
  await ui.redraw()
  expect((await ui.find({ type: 'Button', key: 'login' }))?.props.dimColor, 'the login is pending').toBe(true)
  clk.nowCalls = 0
  await ui.redraw()
  expect(clk.nowCalls, 'one clock read for both').toBe(1)
  expect(await text(ui, L1)).toBeDefined()
  clk.isRefused = true
  clk.nowCalls = 0
  await ui.redraw()
  expect(clk.nowCalls).toBe(1)
  expect(await text(ui, l1At('—'))).toBeDefined()
  expect((await ui.find({ type: 'Button', key: 'login' }))?.props.dimColor, 'a refused clock reads 0: the login stays pending').toBe(true)
  await ui.unmount()
})

test('A14 a closed limits line costs the tick no account read', async ($, on) => {
  let accountReads = 0
  on('state.get', { plugin: 'agent-models', key: 'account' }, (_, e, next) => {
    accountReads += 1
    return next(e)
  })
  const w = await world($, on, answerWith(200, MEASURED))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui) // open
  await pressLimits(ui) // closed
  await spin()
  accountReads = 0
  await ui.unmount() // no draw reads the account below
  await w.clock.advance(10_000) // 10 s: five ticks, too few for the account retry (30)
  expect(accountReads).toBe(0)
})
