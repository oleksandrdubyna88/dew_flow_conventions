import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { On, ProcessRunResult, SessionIdentity } from 'claude-code'

import { BAND, ownClock } from './limits-fixtures'

// The account read always ends (1.4.0): the identity answer has a 5 s ceiling, a whole read a 30 s one, and a retry does not wait
// for a draw or a turn (the 2 s tick reads an unread account, or an unknown one older than a minute).

const SEC = 1_000
const IDENTITY_CEILING = 5 * SEC
const READ_CEILING = 30 * SEC
const TURN = { answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as const
type Ui = Mounted<'terminal' | 'desktop', 'AbovePrompt'>

const ok = (stdout: string): ProcessRunResult => ({ exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false })
const statusJson = (email: string) => JSON.stringify({ loggedIn: true, email })
const identityOf = (email: string): { value: SessionIdentity } => ({ value: { kind: 'claude.ai', isVerified: true, email } })
const never = <T,>() => new Promise<T>(() => undefined)
const spin = async () => {
  for (let i = 0; i < 1000; i += 1) await Promise.resolve()
}
const text = (ui: Ui, t: string | RegExp) => ui.find({ type: 'Text', text: t })

// Every scenario answers what the session start and the agent timer ask, before its first call on `$`.
const base = (on: On) => {
  const clock = mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  return clock
}
const start = async ($: Engine) => {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await spin()
}
// Whether a read is running (the module's `isAccountReading`, which this file's own copy of the module cannot see): a second
// session start reads only when none is, so it asks identity once more exactly when none was running. It starts a read as a side effect.
const isReading = async ($: Engine, asked: { n: number }) => {
  const before = asked.n
  await start($)
  return asked.n === before
}
const band = async ($: Engine) => $.ui.mount({ ...BAND, surface: 'terminal' })

/** `session.identity` answers: `answers[n]` for the n-th call (a Promise to hold it), the last one for the calls after. */
const identities = (on: On, answers: (() => Promise<{ value: SessionIdentity }> | { value: SessionIdentity })[]) => {
  const calls = { n: 0 }
  on('session.identity', () => {
    const answer = answers[Math.min(calls.n, answers.length - 1)]
    calls.n += 1
    return answer?.() ?? never()
  })
  return calls
}
/** `process.run` answers: the status run's `argv` are kept. */
const statusRuns = (on: On, answer: () => Promise<ProcessRunResult> | ProcessRunResult) => {
  const runs = { n: 0 }
  on('process.run', async () => {
    runs.n += 1
    return { value: await answer() }
  })
  return runs
}
const accountWrites = (on: On, gate: (n: number) => 'deny' | undefined = () => undefined) => {
  const writes = { n: 0 }
  on('state.set', { plugin: 'agent-models', key: 'account' }, (_, e, next) => {
    writes.n += 1
    return gate(writes.n) === 'deny' ? { deny: 'refused' } : next(e)
  })
  return writes
}

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

test('B4 after a timed-out read, with no draw and no turn, the tick reads again a minute later', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [never, () => identityOf('again@example.com')])
  statusRuns(on, never)
  await start($)
  await clock.advance(READ_CEILING)
  await spin()
  expect(asked.n).toBe(1)
  await clock.advance(59 * SEC)
  expect(asked.n, 'not before the account is a minute old').toBe(1)
  await clock.advance(SEC)
  await spin()
  expect(asked.n, 'a minute after the read ended the tick reads again').toBe(2)
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
  await clock.advance(60 * SEC) // nobody draws the band and no turn ends
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
  await clock.advance(60 * SEC)
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
