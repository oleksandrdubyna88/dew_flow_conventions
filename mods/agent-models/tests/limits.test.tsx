import { expect, mock, test } from 'claude-code/testing'

import { limitColor, limitsFromBody, limitsLine, LIMITS_LOADING, LIMITS_TIMEOUT_MS, LIMITS_UNAVAILABLE, LIMITS_URL, percentLeft } from '../hooks/limits'
import { textRows, viewerFixedRows } from '../hooks/prompts'
import {
  answerWith, BAND, closeButton, COLOURED, L1, l1At, LC, lastView, limitsButton, measured, MEASURED, NONE, ok, pressLimits, RESETS_AT, scoped, spin, SURFACES, text, window, world,
} from './limits-fixtures'
import type { Answer } from './limits-fixtures'

// --- pure ---

test('P1 percentLeft is 100 minus the percent used, rounded', () => {
  expect([13, 33.4, 100, 0].map(percentLeft)).toEqual([87, 67, 0, 100])
})

test('P2 percentLeft clamps to 0..100 and refuses a non-finite number', () => {
  expect([130, -5, Infinity].map(percentLeft)).toEqual([0, 100, null])
})

test('P3 percentLeft refuses what is not a number', () => {
  for (const odd of [null, '13', undefined, NaN]) expect(percentLeft(odd)).toBeNull()
})

test('B1 the measured body gives three numbers and the label, and nothing else', () => {
  const value = limitsFromBody(MEASURED)
  expect(value).toEqual({ fiveHour: 87, week: 74, model: { label: 'Fable', left: 82 }, fiveHourResetsAt: RESETS_AT })
  expect(Object.keys(value ?? {})).toEqual(['fiveHour', 'week', 'model', 'fiveHourResetsAt'])
  expect(Object.keys(value?.model ?? {}).sort()).toEqual(['label', 'left'])
})

test('B2 the model name matches in any case and the label keeps the server spelling', () => {
  const entry = limitsFromBody(JSON.stringify(measured({ limits: [scoped('FABLE', 18)] })))
  expect(entry?.model).toEqual({ label: 'FABLE', left: 82 })
})

test('B3 no Fable entry, or no limits at all: model null, the two windows still read', () => {
  const none = { fiveHour: 87, week: 74, model: null, fiveHourResetsAt: RESETS_AT }
  expect(limitsFromBody(JSON.stringify(measured({ limits: [] })))).toEqual(none)
  const noKey = measured()
  delete noKey.limits
  expect(limitsFromBody(JSON.stringify(noKey))).toEqual(none)
})

test('B4 another model is never shown under the name Fable', () => {
  expect(limitsFromBody(JSON.stringify(measured({ limits: [scoped('Opus', 40)] })))?.model).toBeNull()
})

test('B5 a Fable entry with no number is no row', () => {
  expect(limitsFromBody(JSON.stringify(measured({ limits: [scoped('Fable', null)] })))?.model).toBeNull()
})

test('B6 the projection shape model_scoped is not read (it is absent from the raw body)', () => {
  const body = measured({ model_scoped: [{ display_name: 'Fable', utilization: 18 }] })
  delete body.limits
  expect(limitsFromBody(JSON.stringify(body))?.model).toBeNull()
})

test('B7 only ONE JSON object is an answer', () => {
  for (const bad of ['[]', '"x"', 'null', '{', '']) expect(limitsFromBody(bad)).toBeNull()
})

test('B8 an empty object is an answer with nothing in it', () => {
  expect(limitsFromBody('{}')).toEqual({ fiveHour: null, week: null, model: null, fiveHourResetsAt: null })
})

test('B9 a number sent as a string is no number', () => {
  expect(limitsFromBody(JSON.stringify({ five_hour: { utilization: '13' } }))?.fiveHour).toBeNull()
})

test('L1 the line names the three numbers', () => {
  expect(limitsLine({ fiveHour: 87, week: 74, model: { label: 'Fable', left: 82 }, fiveHourResetsAt: RESETS_AT }, RESETS_AT - 83 * 60_000)).toBe(L1)
})

test('L2 an absent number is a dash with no percent', () => {
  expect(limitsLine({ fiveHour: null, week: 74, model: null, fiveHourResetsAt: null }, RESETS_AT)).toBe('5h — · resets in — · week 74% left · Fable —')
})

test('L3 all three absent', () => {
  expect(limitsLine({ fiveHour: null, week: null, model: null, fiveHourResetsAt: null }, RESETS_AT)).toBe(NONE)
})

test('S16 the open line counts as rows for the viewer, wrapped beside the Close button', () => {
  const before = viewerFixedRows(80, false, undefined)
  expect(viewerFixedRows(80, false, undefined, L1)).toBe(before + 1)
  // 63 characters wrapped at 20 - 11 (the Close button, 9 cells, never shrinks; the row's gap 2)
  expect(viewerFixedRows(20, false, undefined, L1)).toBe(viewerFixedRows(20, false, undefined) + 7)
  expect(viewerFixedRows(30, false, undefined, L1)).toBe(viewerFixedRows(30, false, undefined) + 4)
  expect(viewerFixedRows(11, false, undefined, LIMITS_LOADING)).toBe(viewerFixedRows(11, false, undefined) + 15) // textRows floors the width at 1; this case pins the count at 11 columns, not the Math.max in viewerFixedRows
})

// The nested Texts of a drawn line: its element children (the rest are bare strings), and what each one says.
type Drawn = { props?: { color?: string }; children?: unknown[] }
const elementsOf = (children: unknown[] | undefined): Drawn[] => (children ?? []).filter((c): c is Drawn => typeof c === 'object' && c !== null)
const innerTexts = (children: unknown[] | undefined): unknown[] => elementsOf(children).map(c => c.children?.[0])

test('L-C1 the colour of a percent left: over 60 green, 10 to 60 orange, under 10 red', () => {
  expect([100, 61, 60, 59, 11, 10, 9, 0].map(limitColor)).toEqual([
    '#22c55e', '#22c55e', '#f97316', '#f97316', '#f97316', '#f97316', '#ef4444', '#ef4444',
  ])
})

test('L-C2 a number that is not finite has no colour', () => {
  for (const odd of [NaN, Infinity, -Infinity]) expect(limitColor(odd)).toBeUndefined()
})

for (const surface of SURFACES) {
  test(`L-C3 each number is drawn in the colour of what is left, and the line stays one text (${surface})`, async ($, on) => {
    await world($, on, answerWith(200, COLOURED))
    const ui = await $.ui.mount({ ...BAND, surface })
    await pressLimits(ui)
    expect((await text(ui, /^69%$/))?.props.color).toBe('#22c55e')
    expect((await text(ui, /^35%$/))?.props.color).toBe('#f97316')
    expect((await text(ui, /^8%$/))?.props.color).toBe('#ef4444')
    // L-C4 only the three numbers are Texts of their own; labels, `left` and the dots are bare strings of the plain line
    const outer = await ui.find({ type: 'Text', text: LC })
    expect(outer?.props).toEqual({})
    expect(innerTexts(outer?.children)).toEqual(['69%', '1h 23m', '35%', '8%']) // the reset time is a Text of its own too (1.4.0)
    expect((await text(ui, /^1h 23m$/))?.props.color).toBe('#ef4444')
    for (const part of [/^5h $/, /^ left$/, /^ · $/, /^week $/, /^resets in $/]) expect(await text(ui, part)).toBeUndefined()
    // L-C5 the joined text is what limitsLine says
    expect(outer?.text).toBe(LC)
    expect(outer?.text).toBe(limitsLine({ fiveHour: 69, week: 35, model: { label: 'Fable', left: 8 }, fiveHourResetsAt: RESETS_AT }, RESETS_AT - 83 * 60_000))
    await ui.unmount()
  })
}

test('L-C6 an absent number is a bare dash: no colour, no Text of its own', async ($, on) => {
  await world($, on, answerWith(200, JSON.stringify(measured({ five_hour: window(null), limits: [] }))))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  const outer = await ui.find({ type: 'Text', text: '5h — · resets in 1h 23m · week 74% left · Fable —' })
  expect(outer?.text).toBe('5h — · resets in 1h 23m · week 74% left · Fable —')
  expect(outer?.props).toEqual({})
  const inner = elementsOf(outer?.children)
  expect(inner).toHaveLength(2) // the reset time and the week number
  expect(innerTexts(outer?.children)).toEqual(['1h 23m', '74%'])
  expect(inner[1]?.props?.color).toBe('#22c55e')
  expect(await ui.findAll({ type: 'Text', text: '—' })).toHaveLength(1)
  await ui.unmount()
})

for (const surface of SURFACES) {
  test(`L-C7 while loading the line is dim and has no number Text, and Close is drawn red (${surface})`, async ($, on) => {
    await world($, on, () => new Promise<Answer>(() => undefined))
    const ui = await $.ui.mount({ ...BAND, surface })
    await pressLimits(ui)
    const t = await text(ui, LIMITS_LOADING)
    expect(t?.props).toEqual({ dimColor: true })
    expect(t?.children).toEqual([LIMITS_LOADING])
    const close = await closeButton(ui)
    expect(close?.props.label).toBe('Close')
    expect(close?.children[0]).toEqual({ type: 'Text', props: { color: '#ef4444' }, children: ['Close'] })
    await ui.unmount()
  })
}

test('L-C8 an unavailable line is dim and has its Close', async ($, on) => {
  await world($, on, answerWith(500, '{}'))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect((await text(ui, LIMITS_UNAVAILABLE))?.props).toEqual({ dimColor: true })
  expect(await closeButton(ui)).toBeDefined()
  await ui.unmount()
})

for (const surface of SURFACES) {
  test(`S1 the email is a button; one fetch with the handle only; the three numbers are drawn (${surface})`, async ($, on) => {
    const w = await world($, on, answerWith(200, MEASURED))
    const ui = await $.ui.mount({ ...BAND, surface })
    await pressLimits(ui)
    expect(w.calls).toEqual([{ url: LIMITS_URL, auth: 'h-1', headers: { Accept: 'application/json' } }])
    expect(await text(ui, L1)).toBeDefined()
    expect((await text(ui, 'dev@example.com'))?.props.color).toBe('#f97316')
    expect((await limitsButton(ui))?.props.label).toBe('dev@example.com')
    await ui.unmount()
  })

  test(`S4 no first-party credential: no fetch, the line says unavailable (${surface})`, async ($, on) => {
    const w = await world($, on, answerWith(200, MEASURED), () => null)
    const ui = await $.ui.mount({ ...BAND, surface })
    await pressLimits(ui)
    expect(w.calls).toHaveLength(0)
    expect((await text(ui, LIMITS_UNAVAILABLE))?.props.dimColor).toBe(true)
    await ui.unmount()
  })

  test(`S11 a reopen within a minute draws the stored line and fetches nothing (${surface})`, async ($, on) => {
    const w = await world($, on, answerWith(200, MEASURED))
    const ui = await $.ui.mount({ ...BAND, surface })
    await pressLimits(ui)
    expect(w.calls).toHaveLength(1)
    await pressLimits(ui)
    expect(await text(ui, /^5h /)).toBeUndefined()
    expect(w.calls).toHaveLength(1)
    await pressLimits(ui)
    expect(await text(ui, L1)).toBeDefined()
    expect(w.calls).toHaveLength(1)
    await ui.unmount()
  })
}

test('S2 only the three numbers and the label reach state', async ($, on) => {
  const w = await world($, on, answerWith(200, MEASURED))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  const view = lastView(w)
  expect(view?.value).toEqual({ fiveHour: 87, week: 74, model: { label: 'Fable', left: 82 }, fiveHourResetsAt: RESETS_AT })
  const all = JSON.stringify(w.writes)
  for (const leak of ['spend', 'extra_usage', 'limit_dollars', 'resets_at', '2026-11-10T22:00:00Z', 'h-1', 'limits_dollars', 'weekly_scoped_shares', 'experiment_']) {
    expect(all).not.toContain(leak)
  }
  await ui.unmount()
})

test('S3 a body without a Fable entry draws a dash for it', async ($, on) => {
  await world($, on, answerWith(200, JSON.stringify(measured({ limits: [] }))))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await text(ui, '5h 87% left · resets in 1h 23m · week 74% left · Fable —')).toBeDefined()
  await ui.unmount()
})

test('S5 a refused authorize draws unavailable and fetches nothing', async ($, on) => {
  const w = await world($, on, answerWith(200, MEASURED), () => {
    throw new Error('refused SECRET-detail')
  })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(w.calls).toHaveLength(0)
  expect(await text(ui, LIMITS_UNAVAILABLE)).toBeDefined()
  expect(JSON.stringify(await ui.drawn())).not.toContain('SECRET')
  await ui.unmount()
})

// What a person can read in a drawn tree: the tree as JSON without the engine's `press` objects. A press handle is a
// random engine number (e.g. 1040156202 holds "401"), so the whole tree would fail S6 now and then (about 1 run in 100).
const readable = (tree: unknown): string => JSON.stringify(tree, (key, value: unknown) => (key === 'press' ? undefined : value))

test('S6a the readable text leaves out a press handle but keeps every drawn text', () => {
  const tree = { type: 'Button', press: { plugin: 'agent-models', handle: 1040156202 }, children: [{ type: 'Text', children: ['limits 401'] }] }
  expect(JSON.stringify(tree)).toContain('401') // the handle alone would match, so the whole tree is not the subject
  expect(readable({ ...tree, children: [{ type: 'Text', children: ['limits unavailable'] }] })).not.toContain('401')
  expect(readable(tree)).toContain('limits 401') // a status that IS drawn is still found
})

for (const status of [401, 404, 500]) {
  test(`S6 a ${status} answer draws unavailable and keeps no value, and never its body or code`, async ($, on) => {
    const w = await world($, on, answerWith(status, '{"error":"x-body-SECRET"}'))
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    await pressLimits(ui)
    expect(await text(ui, LIMITS_UNAVAILABLE)).toBeDefined()
    expect(lastView(w)?.value).toBeUndefined()
    expect(lastView(w)?.isFailed).toBe(true)
    const drawn = readable(await ui.drawn())
    expect(drawn).not.toContain('SECRET')
    expect(drawn).not.toContain(String(status))
    await ui.unmount()
  })
}

test('S7 a fetch that never settles ends at the timeout; a late answer changes nothing', async ($, on) => {
  let late: (a: Answer) => void = () => undefined
  const held = new Promise<Answer>(resolve => {
    late = resolve
  })
  const w = await world($, on, () => held)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await text(ui, LIMITS_LOADING)).toBeDefined()
  await w.clock.advance(LIMITS_TIMEOUT_MS)
  await ui.redraw()
  expect(await text(ui, LIMITS_UNAVAILABLE)).toBeDefined()
  const writes = w.writes.length
  late({ status: 200, text: MEASURED })
  await spin()
  await ui.redraw()
  expect(w.writes).toHaveLength(writes)
  expect(await text(ui, /^5h /)).toBeUndefined()
  await ui.unmount()
})

for (const body of ['not json', '[]']) {
  test(`S8 an answer that is not one JSON object (${body}) draws unavailable`, async ($, on) => {
    const w = await world($, on, answerWith(200, body))
    const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
    await pressLimits(ui)
    expect(await text(ui, LIMITS_UNAVAILABLE)).toBeDefined()
    expect(w.logs.n).toBe(0)
    await ui.unmount()
  })
}

test('S9 an empty object draws dashes, never zeros', async ($, on) => {
  await world($, on, answerWith(200, '{}'))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await text(ui, NONE)).toBeDefined()
  await ui.unmount()
})

test('S10 an out-of-range percent is clamped', async ($, on) => {
  await world($, on, answerWith(200, JSON.stringify(measured({ five_hour: window(130), seven_day: window(-5) }))))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  expect(await text(ui, '5h 0% left · resets in 1h 23m · week 100% left · Fable 82% left')).toBeDefined()
  await ui.unmount()
})

test('S12 a reopen after a minute fetches again and keeps the old line until the answer lands', async ($, on) => {
  let second: (a: Answer) => void = () => undefined
  let n = 0
  const w = await world($, on, () => {
    n += 1
    return n === 1 ? { status: 200, text: MEASURED } : new Promise<Answer>(resolve => { second = resolve })
  })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui)
  await pressLimits(ui)
  await w.clock.advance(60_000)
  await pressLimits(ui) // closed -> open, stale
  expect(w.calls).toHaveLength(2)
  expect(await text(ui, l1At('1h 22m'))).toBeDefined() // the old line, a minute later: its time ran down (1.4.0)
  expect(await text(ui, LIMITS_LOADING)).toBeUndefined()
  second({ status: 200, text: JSON.stringify(measured({ five_hour: window(50) })) })
  await spin()
  await ui.redraw()
  expect(await text(ui, '5h 50% left · resets in 1h 22m · week 74% left · Fable 82% left')).toBeDefined()
  await ui.unmount()
})

test('S13 a press while a fetch runs never starts a second; with no value the line says loading', async ($, on) => {
  let release: (a: Answer) => void = () => undefined
  const w = await world($, on, () => new Promise<Answer>(resolve => { release = resolve }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui) // open, fetch starts
  expect((await text(ui, LIMITS_LOADING))?.props.dimColor).toBe(true)
  await pressLimits(ui) // close
  await pressLimits(ui) // open
  expect(w.calls).toHaveLength(1)
  expect(await text(ui, LIMITS_LOADING)).toBeDefined()
  release({ status: 200, text: MEASURED })
  await spin()
  await ui.redraw()
  expect(await text(ui, L1)).toBeDefined()
  await ui.unmount()
})

test('S14b a signed-out account has no limits button', async ($, on) => {
  mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  on('session.identity', () => ({ value: { deny: 'not a managed mod' } }))
  on('process.run', () => ({ value: ok(JSON.stringify({ loggedIn: false })) }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await spin()
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await limitsButton(ui)).toBeUndefined()
  expect(await ui.find({ type: 'Button', key: 'limits-close' })).toBeUndefined()
  expect((await text(ui, 'not signed in'))?.props.dimColor).toBe(true)
  await ui.unmount()
})

test('S17 an answer that lands after the line was closed is kept and drawn by the next open without a fetch', async ($, on) => {
  let release: (a: Answer) => void = () => undefined
  const w = await world($, on, () => new Promise<Answer>(resolve => { release = resolve }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await pressLimits(ui) // open, fetch pending
  await pressLimits(ui) // close
  release({ status: 200, text: MEASURED })
  await spin()
  expect(lastView(w)?.value).toEqual({ fiveHour: 87, week: 74, model: { label: 'Fable', left: 82 }, fiveHourResetsAt: RESETS_AT })
  await pressLimits(ui)
  expect(await text(ui, L1)).toBeDefined()
  expect(w.calls).toHaveLength(1)
  await ui.unmount()
})
