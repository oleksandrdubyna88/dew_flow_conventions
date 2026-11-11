import { expect, test } from 'claude-code/testing'

import { LIMITS_INTERVAL_MS, LIMITS_LOADING, LIMITS_TIMEOUT_MS, LIMITS_UNAVAILABLE } from '../hooks/limits'
import { textRows, viewerFixedRows } from '../hooks/prompts'
import {
  BAND, closeButton, L1, lastView, limitsButton, measured, MEASURED, pressClose, pressLimits, rowOf, spin, SURFACES, text, window, world,
} from './limits-fixtures'
import type { Answer } from './limits-fixtures'

// The limits line and the account it was fetched for; the ceiling of the fetch; what the flight and the failure remember.

const TURN = { answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as const
const OTHER_LINE = '5h 50% left · week 74% left · Fable 82% left'
const OTHER_BODY = JSON.stringify(measured({ five_hour: window(50) }))

test('A1 an account change clears the old numbers; a reopen under the new email within a minute fetches again', async ($, on) => {
  let n = 0
  const w = await world($, on, () => ({ status: 200, text: n++ === 0 ? MEASURED : OTHER_BODY }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await w.clock.advance(30_000)
  await pressLimits(ui)
  expect(await text(ui, L1)).toBeDefined()
  expect(w.calls).toHaveLength(1)
  await w.clock.advance(30_000) // 30 s after the fetch, 60 s after the account read
  w.acct.email = 'other@example.com'
  await $.turn.complete(TURN)
  await spin()
  await ui.redraw()
  expect((await limitsButton(ui))?.props.label).toBe('other@example.com')
  expect(await text(ui, /^5h /)).toBeUndefined() // the old account's numbers are gone
  await pressLimits(ui)
  expect(w.calls).toHaveLength(2)
  expect(await text(ui, OTHER_LINE)).toBeDefined()
  await ui.unmount()
})

test('A2 a sign-out draws no line and no button, and a press of the button is refused', async ($, on) => {
  const w = await world($, on, () => ({ status: 200, text: MEASURED }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await text(ui, L1)).toBeDefined()
  await w.clock.advance(LIMITS_INTERVAL_MS)
  w.acct.email = undefined
  await $.turn.complete(TURN)
  await spin()
  await ui.redraw()
  expect(await text(ui, 'not signed in')).toBeDefined()
  expect(await text(ui, /^5h /)).toBeUndefined()
  expect(await limitsButton(ui)).toBeUndefined()
  await expect(ui.press({ key: 'limits' })).rejects.toThrow()
  expect(w.calls).toHaveLength(1)
  await ui.unmount()
})

test('S14 an unread account has no limits button, and a press of it is refused', async ($, on) => {
  on('state.set', { plugin: 'agent-models', key: 'account' }, () => ({ deny: 'held unread' })) // the draw's read cannot land
  const w = await world($, on, () => ({ status: 200, text: MEASURED }), undefined, { isStarted: false })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await limitsButton(ui)).toBeUndefined()
  await expect(ui.press({ key: 'limits' })).rejects.toThrow()
  expect(w.calls).toHaveLength(0)
  await ui.unmount()
})

test('A3 an authorize that never answers ends at the ceiling with limits unavailable', async ($, on) => {
  const never = new Promise<never>(() => undefined)
  const w = await world($, on, () => ({ status: 200, text: MEASURED }), () => never)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(w.calls).toHaveLength(0)
  await w.clock.advance(LIMITS_TIMEOUT_MS)
  await spin()
  await ui.redraw()
  expect(await text(ui, LIMITS_UNAVAILABLE)).toBeDefined()
  await ui.unmount()
})

test('A4 while the final state write is pending, the fetch still counts as running: a reopen starts no second one', async ($, on) => {
  const w = await world($, on, () => ({ status: 200, text: MEASURED }))
  let release: () => void = () => undefined
  const held = new Promise<void>(resolve => {
    release = resolve
  })
  w.gate.final = async () => {
    await held
    return undefined
  }
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui) // open; the fetch answers, its state write waits
  await pressLimits(ui) // close
  await pressLimits(ui) // open
  expect(w.calls).toHaveLength(1)
  release()
  await spin()
  await ui.redraw()
  expect(await text(ui, L1)).toBeDefined()
  expect(w.calls).toHaveLength(1)
  await ui.unmount()
})

test('A5 after a failure a reopen within a minute fetches nothing, even when the failure could not be written', async ($, on) => {
  const w = await world($, on, () => ({ status: 500, text: 'x' }))
  w.gate.final = async () => 'deny'
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(w.calls).toHaveLength(1)
  await pressLimits(ui) // close
  await pressLimits(ui) // open, 0 s later
  expect(w.calls).toHaveLength(1)
  await w.clock.advance(LIMITS_INTERVAL_MS)
  await pressLimits(ui) // close
  await pressLimits(ui) // open, a minute later
  expect(w.calls).toHaveLength(2)
  await ui.unmount()
})

test('A6 after a failure that was written, a reopen within a minute fetches nothing; after a minute it does', async ($, on) => {
  const w = await world($, on, () => ({ status: 500, text: 'x' }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(lastView(w)?.isFailed).toBe(true)
  await pressLimits(ui)
  await pressLimits(ui)
  expect(w.calls).toHaveLength(1)
  await w.clock.advance(LIMITS_INTERVAL_MS)
  await pressLimits(ui)
  await pressLimits(ui)
  expect(w.calls).toHaveLength(2)
  await ui.unmount()
})

// No log and no toast, on a success and on each way to fail: the line says what happened, nothing else does.
const WAYS: [string, () => Answer, () => unknown, string][] = [
  ['success', () => ({ status: 200, text: MEASURED }), () => ({ handle: 'h-1', kind: 'bearer' }), L1],
  ['a 500 answer', () => ({ status: 500, text: 'x' }), () => ({ handle: 'h-1', kind: 'bearer' }), LIMITS_UNAVAILABLE],
  ['no credential', () => ({ status: 200, text: MEASURED }), () => null, LIMITS_UNAVAILABLE],
  ['a refused authorize', () => ({ status: 200, text: MEASURED }), () => { throw new Error('refused') }, LIMITS_UNAVAILABLE],
]
for (const [name, answer, auth, line] of WAYS) {
  test(`S15 ${name}: the line is drawn, and no log and no toast was made`, async ($, on) => {
    const w = await world($, on, answer, auth)
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    await pressLimits(ui)
    expect(await text(ui, line)).toBeDefined()
    expect(w.writes.length).toBeGreaterThan(0)
    expect(w.logs.n).toBe(0)
    await ui.unmount()
  })
}

// --- the Close on the limits line ---

for (const surface of SURFACES) {
  test(`L-C9 Close shuts the line, fetches nothing, keeps the email a button; L-C10 a reopen within a minute draws it again; L-C11 a stale reopen fetches (${surface})`, async ($, on) => {
    const w = await world($, on, () => ({ status: 200, text: MEASURED }))
    const ui = await $.ui.mount({ ...BAND, surface })
    await pressLimits(ui)
    await pressClose(ui)
    expect(await text(ui, /^5h /)).toBeUndefined()
    expect(await closeButton(ui)).toBeUndefined()
    expect(lastView(w)?.isOpen).toBe(false)
    expect(w.calls).toHaveLength(1)
    expect((await limitsButton(ui))?.props.label).toBe('dev@example.com')
    await pressLimits(ui) // the email again, within a minute
    expect((await text(ui, L1))?.text).toBe(L1)
    expect(w.calls).toHaveLength(1)
    expect(await closeButton(ui)).toBeDefined()
    await w.clock.advance(LIMITS_INTERVAL_MS)
    await pressClose(ui)
    expect(w.calls).toHaveLength(1) // Close alone fetches nothing, however stale
    await pressLimits(ui)
    expect(w.calls).toHaveLength(2) // a stale reopen fetches, as before
    await ui.unmount()
  })
}

test('L-C12 Close while loading: the answer that lands later is kept, and does not reopen the line', async ($, on) => {
  let release: (a: Answer) => void = () => undefined
  const w = await world($, on, () => new Promise<Answer>(resolve => { release = resolve }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await text(ui, LIMITS_LOADING)).toBeDefined()
  await pressClose(ui)
  release({ status: 200, text: MEASURED })
  await spin()
  await ui.redraw()
  expect(await text(ui, /^5h /)).toBeUndefined()
  expect(await text(ui, LIMITS_LOADING)).toBeUndefined()
  expect(lastView(w)?.value).toEqual({ fiveHour: 87, week: 74, model: { label: 'Fable', left: 82 } })
  await pressLimits(ui)
  expect(await text(ui, L1)).toBeDefined()
  expect(w.calls).toHaveLength(1)
  await ui.unmount()
})

test('L-C13 signed in with the line closed, there is no Close', async ($, on) => {
  await world($, on, () => ({ status: 200, text: MEASURED }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await closeButton(ui)).toBeUndefined()
  await ui.unmount()
})

const NARROW = { ...BAND, props: { ...BAND.props, bodyColumns: 30 }, surface: 'terminal' } as const

test('L-C14 the height count describes the drawn row: the line wraps beside the Close button and the gap', async ($, on) => {
  await world($, on, () => ({ status: 200, text: MEASURED }))
  const ui = await $.ui.mount(NARROW)
  await pressLimits(ui)
  const row = rowOf(await ui.drawn())
  expect(row).toBeDefined() // a walker that finds nothing must fail here, not compare two undefined
  const gap = row?.props?.columnGap
  const button = (row?.children ?? []).find(k => typeof k === 'object' && k !== null && (k as { type?: string }).type === 'Button') as { props: { label: string } } | undefined
  expect(gap).toBe(2)
  expect(button?.props.label).toBe('Close')
  const line = (await text(ui, L1))?.text ?? ''
  const expected = textRows(line, Math.max(1, 30 - `[ ${button?.props.label} ]`.length - Number(gap)))
  const counted = viewerFixedRows(30, false, undefined, line) - viewerFixedRows(30, false, undefined)
  expect(counted).toBe(expected)
  expect(counted).toBe(3)
  await ui.unmount()
})

// the open viewer's rows at 30 columns: agents 0 + fixed 3 + limits 3 + the note (118 characters, 4 rows) + `hello` 1 = 11
for (const [maxRows, header] of [[11, 'Message 1 / 1'], [10, 'Message 1 / 1 (scroll for more)']] as const) {
  test(`L-C15 the viewer counts the limits line beside Close: at ${maxRows} rows the header says "${header}"`, async ($, on) => {
    on('session.messages', () => ({ value: [{ role: 'user', text: 'hello', toolUses: [] }] }))
    await world($, on, () => ({ status: 200, text: MEASURED }))
    const ui = await $.ui.mount({ ...NARROW, props: { ...NARROW.props, maxRows } })
    await pressLimits(ui)
    await ui.press({ key: 'my-messages' })
    await ui.redraw()
    expect((await text(ui, /^Message /))?.text).toBe(header)
    expect(await text(ui, L1)).toBeDefined() // the line is still drawn above the open viewer
    await ui.press({ key: 'close' })
    await ui.unmount()
  })
}
