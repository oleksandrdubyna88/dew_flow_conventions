import { expect, test } from 'claude-code/testing'
import type { Limits, LimitsView } from '../types'

import { limitsFromBody, limitsLine } from '../hooks/limits'
import { answerWith, BAND, CLOCK_START, lastView, measured, MEASURED, pressLimits, RESETS_AT, SURFACES, text, window, world } from './limits-fixtures'

// The weekly reset time of the limits line (1.5.0): the parser keeps `seven_day.resets_at`, and right after `week N% left` the line says
// the date when 24 hours or more are left, the time left under that, a dash when it is unknown, passed or the clock was refused.
// Dates are the engine's local ones; every fixture moment is 10:00 UTC, so its date is the same in any zone from UTC-10 to UTC+13.

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const WEEK_AT = Date.parse('2026-11-27T10:00:00Z')
const numbers = { fiveHour: 48, week: 83, model: { label: 'Fable', left: 97 } }
const weekLine = (weekResetsAt: number | null, now: number | null): string | undefined =>
  limitsLine({ ...numbers, fiveHourResetsAt: null, weekResetsAt }, now).split(' · ')[3]
const bodyWith = (resetsAt: unknown) => JSON.stringify(measured({ seven_day: window(26, resetsAt) }))

test('W1 seven_day.resets_at is kept as a moment, with Z or an offset', () => {
  for (const stamp of ['2026-11-14T10:00:00Z', '2026-11-14T10:00:00+00:00', '2026-11-14T12:00:00.500+02:00']) {
    expect(limitsFromBody(bodyWith(stamp))?.weekResetsAt, stamp).toBe(Date.parse(stamp))
  }
})

test('W2 a null, absent, garbage or offset-less seven_day.resets_at is null, and the line says a dash after week', () => {
  for (const odd of [null, 'soon', 12, '2026-11-14T10:00:00', '2026-11-14', '']) {
    expect(limitsFromBody(bodyWith(odd))?.weekResetsAt, String(odd)).toBeNull()
  }
  expect(limitsFromBody(JSON.stringify(measured({ seven_day: { utilization: 26 } })))?.weekResetsAt).toBeNull()
  expect(limitsFromBody(JSON.stringify(measured({ seven_day: null })))?.weekResetsAt).toBeNull()
  expect(weekLine(null, WEEK_AT - DAY)).toBe('resets —')
})

test('W3 four days left: the date', () => {
  expect(limitsLine({ ...numbers, fiveHourResetsAt: WEEK_AT - 4 * DAY + 2 * HOUR, weekResetsAt: WEEK_AT }, WEEK_AT - 4 * DAY)).toBe(
    '5h 48% left · resets in 2h 0m · week 83% left · resets Nov 27 · Fable 97% left',
  )
})

test('W4 exactly 24 h 0 m left is a date; a minute less is the time left, whole minutes', () => {
  expect(weekLine(WEEK_AT, WEEK_AT - DAY)).toBe('resets Nov 27')
  expect(weekLine(WEEK_AT, WEEK_AT - DAY + 1)).toBe('resets in 23h 59m') // a millisecond under 24 h
  expect(weekLine(WEEK_AT, WEEK_AT - DAY + MIN)).toBe('resets in 23h 59m')
  expect(weekLine(WEEK_AT, WEEK_AT - (23 * HOUR + 59 * MIN + 30_000))).toBe('resets in 23h 59m')
})

test('W5 under a day: 5h 0m, 59m, <1m', () => {
  expect(weekLine(WEEK_AT, WEEK_AT - 5 * HOUR)).toBe('resets in 5h 0m')
  expect(weekLine(WEEK_AT, WEEK_AT - 59 * MIN)).toBe('resets in 59m')
  expect(weekLine(WEEK_AT, WEEK_AT - 30_000)).toBe('resets in <1m')
})

test('W6 a reset that has passed, or a clock that was refused, is a dash', () => {
  expect(weekLine(WEEK_AT, WEEK_AT)).toBe('resets —')
  expect(weekLine(WEEK_AT, WEEK_AT + HOUR)).toBe('resets —')
  expect(weekLine(WEEK_AT, null)).toBe('resets —')
})

test('W8 the owner\'s example line', () => {
  expect(limitsLine({ ...numbers, fiveHourResetsAt: WEEK_AT - 4 * DAY + 2 * HOUR + 24 * MIN, weekResetsAt: WEEK_AT }, WEEK_AT - 4 * DAY)).toBe(
    '5h 48% left · resets in 2h 24m · week 83% left · resets Nov 27 · Fable 97% left',
  )
})

// What 1.4.0 left in a session's state: a limits value with no weekResetsAt.
type Stored1_4 = Omit<Limits, 'weekResetsAt'>
const old: Stored1_4 = { fiveHour: 87, week: 74, model: { label: 'Fable', left: 82 }, fiveHourResetsAt: RESETS_AT }
const view: Omit<LimitsView, 'value'> & { value: Stored1_4 } = { isOpen: true, email: 'dev@example.com', fetchedAt: CLOCK_START, isFailed: false, value: old }

for (const surface of SURFACES) {
  test(`W7 a value stored by 1.4.0 draws with a dash for the week, no throw, and is kept (${surface})`, async ($, on) => {
    on('state.get', { plugin: 'agent-models', key: 'limits' }, () => ({ value: { value: view, version: 0 } }))
    const w = await world($, on, answerWith(200, MEASURED))
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.redraw()
    expect(await text(ui, '5h 87% left · resets in 1h 23m · week 74% left · resets — · Fable 82% left')).toBeDefined()
    expect(w.writes, 'the stored value is not replaced').toHaveLength(0)
    expect(lastView(w)).toBeUndefined()
    await ui.unmount()
  })
}

test('W9 the drawn week reset is bare text: no colour and no Text of its own', async ($, on) => {
  await world($, on, answerWith(200, MEASURED))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await text(ui, /^resets Nov 14$/)).toBeUndefined()
  expect((await ui.find({ type: 'Text', text: /resets Nov 14/ }))?.props).toEqual({})
  await ui.unmount()
})

test('W10 an open line turns from the date into the time left at the 24-hour mark, with no new fetch', async ($, on) => {
  const start = Date.parse('2026-11-14T10:00:00Z') - (DAY + 90_000) // 24 h 1 m 30 s before the week resets
  const body = JSON.stringify(measured({ five_hour: window(13, '2026-11-14T08:00:00Z'), seven_day: window(26, '2026-11-14T10:00:00Z') }))
  const w = await world($, on, answerWith(200, body), undefined, { now: start })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await ui.find({ type: 'Text', text: /week 74% left · resets Nov 14 · Fable/ })).toBeDefined()
  await w.clock.advance(2 * MIN) // 23 h 59 m 30 s left
  await ui.redraw()
  expect(await ui.find({ type: 'Text', text: /week 74% left · resets in 23h 59m · Fable/ })).toBeDefined()
  expect(w.calls, 'no second fetch').toHaveLength(1)
  await ui.unmount()
})
