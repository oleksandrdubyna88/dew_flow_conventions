import { expect, test } from 'claude-code/testing'

import type { ProcessRunResult } from 'claude-code'

import { ownClock } from './limits-fixtures'
import { accountWrites, band, base, identities, identityOf, IDENTITY_CEILING, isReading, never, ok, READ_CEILING, SEC, spin, start, statusJson, statusRuns, text, TURN } from './account-fixtures'

// The account read always ends (1.4.0): the identity answer has a 5 s ceiling, a whole read a 30 s one, and a retry does not wait
// for a draw or a turn (the 2 s tick reads an unread or an unknown account about once a minute).

test('B1 identity never settles, the status run answers an email: after 5 s the email is drawn', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [never])
  const runs = statusRuns(on, () => ok(statusJson('status@example.com')))
  await start($)
  const ui = await band($)
  await clock.advance(IDENTITY_CEILING - 1)
  expect(runs.n, 'nothing before the ceiling').toBe(0)
  await clock.advance(1)
  await spin()
  await ui.redraw()
  expect(asked.n).toBe(1)
  expect(runs.n).toBe(1)
  expect(await text(ui, 'status@example.com')).toBeDefined()
  expect(await isReading($, asked)).toBe(false)
  await ui.unmount()
})

test('B1b an identity that rejects after its ceiling is an unhandled rejection of nobody', async ($, on) => {
  const clock = base(on)
  let fail: (error: Error) => void = () => undefined
  identities(on, [() => new Promise((_, reject: (error: Error) => void) => { fail = reject })])
  statusRuns(on, () => ok(statusJson('status@example.com')))
  await start($)
  await clock.advance(IDENTITY_CEILING)
  await spin()
  fail(new Error('late failure'))
  await spin()
  const ui = await band($)
  expect(await text(ui, 'status@example.com')).toBeDefined()
  await ui.unmount()
})

test('B2 identity and the status run never settle: after 30 s the band says read timed out and no read is running', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [never])
  statusRuns(on, never)
  await start($)
  const ui = await band($)
  await clock.advance(READ_CEILING - 1)
  await spin()
  await ui.redraw()
  expect(await isReading($, asked), 'still reading a moment before the ceiling').toBe(true)
  expect(await text(ui, 'account ?')).toBeDefined()
  await clock.advance(1)
  await spin()
  await ui.redraw()
  expect(await text(ui, 'account ? (read timed out)')).toBeDefined()
  expect(await isReading($, asked), 'no read is running after the ceiling').toBe(false)
  await ui.unmount()
})

test('B3 the late answer of an abandoned read writes nothing, and a newer read keeps its result', async ($, on) => {
  const clock = base(on)
  let lateStatus: (r: ProcessRunResult) => void = () => undefined
  identities(on, [never, () => identityOf('new@example.com')])
  statusRuns(on, () => new Promise<ProcessRunResult>(resolve => { lateStatus = resolve }))
  const writes = accountWrites(on)
  await start($)
  await clock.advance(READ_CEILING)
  await spin()
  expect(writes.n, 'the ceiling wrote read timed out').toBe(1)
  await clock.advance(60 * SEC) // the tick starts a newer read, which the second identity answer settles
  await spin()
  expect(writes.n).toBe(2)
  lateStatus(ok(statusJson('late@example.com'))) // the abandoned read's status run ends now
  await spin()
  expect(writes.n, 'the abandoned read wrote nothing').toBe(2)
  const ui = await band($)
  expect(await text(ui, 'new@example.com')).toBeDefined()
  expect(await text(ui, 'late@example.com')).toBeUndefined()
  await ui.unmount()
})

test('B4 after a timed-out read, with no draw and no turn, the tick reads again within about a minute', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [never, () => identityOf('again@example.com')])
  statusRuns(on, never)
  await start($)
  await clock.advance(READ_CEILING)
  await spin()
  expect(asked.n).toBe(1)
  await clock.advance(62 * SEC) // the tick counts its own ticks: one retry in 30 ticks, wherever the count stands
  await spin()
  expect(asked.n, 'the tick read again').toBe(2)
  const ui = await band($)
  expect(await text(ui, 'again@example.com')).toBeDefined()
  await ui.unmount()
})

test('B5 a refused state write of the read, then idle: the tick reads again within a minute and the email is drawn', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [() => identityOf('dev@example.com')])
  accountWrites(on, n => (n === 1 ? 'deny' : undefined))
  await start($)
  expect(asked.n, 'the session start read; its write was refused').toBe(1)
  await clock.advance(62 * SEC) // nobody draws the band and no turn ends
  await spin()
  expect(asked.n).toBeGreaterThan(1)
  const ui = await band($)
  expect(await text(ui, 'dev@example.com')).toBeDefined()
  await ui.unmount()
})

test('B6 the state goes back to unread with no session.start (a resume): the tick reads and the email is drawn', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [() => identityOf('dev@example.com')])
  let isUnread = false
  // what a resume leaves: the state says unread (version 0 is the store's own); the first write of the read ends it
  on('state.get', { plugin: 'agent-models', key: 'account' }, (_, e, next) =>
    isUnread ? { value: { value: { kind: 'unread' }, version: 0 } } : next(e),
  )
  on('state.set', { plugin: 'agent-models', key: 'account' }, (_, e, next) => {
    isUnread = false
    return next(e)
  })
  await start($)
  expect(asked.n).toBe(1)
  isUnread = true
  await clock.advance(62 * SEC)
  await spin()
  expect(asked.n, 'the tick read the unread account').toBeGreaterThan(1)
  const ui = await band($)
  expect(await text(ui, 'dev@example.com')).toBeDefined()
  await ui.unmount()
})

test('B7 a read queued while the hung read hits its ceiling starts a new read at once', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [never, () => identityOf('queued@example.com')])
  statusRuns(on, never)
  await start($)
  await $.turn.complete(TURN) // the account is unread, so the turn end asks for a read: queued behind the hung one
  await spin()
  expect(asked.n).toBe(1)
  await clock.advance(READ_CEILING)
  await spin()
  expect(asked.n, 'the queued read started at the ceiling, not a minute later').toBe(2)
  const ui = await band($)
  expect(await text(ui, 'queued@example.com')).toBeDefined()
  await ui.unmount()
})

test('B8 no timer ever fires (clock.after refused): the read behaves as in 1.3.3 and nothing throws', async ($, on) => {
  const clk = ownClock(on, 0)
  const asked = identities(on, [() => identityOf('dev@example.com')])
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  await start($)
  for (let i = 0; i < 40; i += 1) await clk.tick(2 * SEC)
  expect(asked.n).toBe(1)
  const ui = await band($)
  expect(await text(ui, 'dev@example.com')).toBeDefined()
  await ui.unmount()
})

test('B8b no timer ever fires and identity never settles: the read hangs as in 1.3.3, no ceiling, nothing throws', async ($, on) => {
  const clk = ownClock(on, 0)
  const asked = identities(on, [never])
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  await start($)
  for (let i = 0; i < 40; i += 1) await clk.tick(2 * SEC)
  expect(await isReading($, asked)).toBe(true)
  const ui = await band($)
  expect(await text(ui, 'account ?')).toBeDefined()
  await ui.unmount()
})

test('B9 a signed-in account idle for three minutes: the tick starts no read', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [() => identityOf('dev@example.com')])
  const runs = statusRuns(on, () => ok(statusJson('dev@example.com')))
  await start($)
  expect(asked.n).toBe(1)
  await clock.advance(180 * SEC)
  await spin()
  expect(asked.n).toBe(1)
  expect(runs.n).toBe(0)
})

test('B9b a signed-out account idle for three minutes: the tick starts no read', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [() => ({ value: { deny: 'not a managed mod' } })])
  const runs = statusRuns(on, () => ok(JSON.stringify({ loggedIn: false })))
  await start($)
  expect(runs.n).toBe(1)
  await clock.advance(180 * SEC)
  await spin()
  expect(asked.n).toBe(1)
  expect(runs.n).toBe(1)
})

test('B11 a ceiling keeps a known account: a signed-in email stays drawn, and the flight still ends', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [() => identityOf('dev@example.com'), never])
  statusRuns(on, never)
  await start($)
  await clock.advance(60 * SEC) // the account is a minute old: a turn end reads it again, and that read hangs
  await $.turn.complete(TURN)
  await spin()
  expect(asked.n).toBe(2)
  await clock.advance(READ_CEILING)
  await spin()
  const ui = await band($)
  expect(await text(ui, 'dev@example.com'), 'a slow re-read never hides a known email').toBeDefined()
  expect(await text(ui, /read timed out/)).toBeUndefined()
  expect(await isReading($, asked), 'the flight ended: a new read can start').toBe(false)
  await ui.unmount()
})

test('B12 a queued read starts before the timed-out write, which may hang', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [never, () => identityOf('queued@example.com')])
  statusRuns(on, never)
  on('state.set', { plugin: 'agent-models', key: 'account' }, (_, e, next) =>
    JSON.stringify(e).includes('read timed out') ? never() : next(e),
  )
  await start($)
  await $.turn.complete(TURN) // queued behind the hung read
  await spin()
  await clock.advance(READ_CEILING)
  await spin()
  expect(asked.n, 'the queued read started although the timed-out write never settles').toBe(2)
  const ui = await band($)
  expect(await text(ui, 'queued@example.com')).toBeDefined()
  await ui.unmount()
})

test('B13 a result written just as the ceiling fires is not overwritten by read timed out', async ($, on) => {
  const clock = base(on)
  identities(on, [() => identityOf('dev@example.com')])
  let release: () => void = () => undefined
  const held = new Promise<void>(resolve => {
    release = resolve
  })
  const writes = { n: 0 }
  on('state.set', { plugin: 'agent-models', key: 'account' }, async (_, e, next) => {
    writes.n += 1
    if (writes.n === 1) await held // the read's own write lands late: the ceiling fires while it is under way
    return next(e)
  })
  await start($)
  expect(writes.n).toBe(1)
  await clock.advance(READ_CEILING)
  await spin()
  expect(writes.n, 'the ceiling wrote nothing over the result that was being written').toBe(1)
  release()
  await spin()
  const ui = await band($)
  expect(await text(ui, 'dev@example.com')).toBeDefined()
  await ui.unmount()
})
