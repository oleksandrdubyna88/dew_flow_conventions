import { mock } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { On, ProcessRunResult, SessionIdentity } from 'claude-code'

import { BAND } from './limits-fixtures'

// The helpers of the account read tests (account-ceiling.test.tsx, account-retry.test.tsx): identity and status answers the test
// chooses, the account's state writes, and a band to draw.

export const SEC = 1_000
export const IDENTITY_CEILING = 5 * SEC
export const READ_CEILING = 30 * SEC
export const TURN = { answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as const
export type Ui = Mounted<'terminal' | 'desktop', 'AbovePrompt'>

export const ok = (stdout: string): ProcessRunResult => ({ exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false })
export const statusJson = (email: string) => JSON.stringify({ loggedIn: true, email })
export const identityOf = (email: string): { value: SessionIdentity } => ({ value: { kind: 'claude.ai', isVerified: true, email } })
export const never = <T,>() => new Promise<T>(() => undefined)
export const spin = async () => {
  for (let i = 0; i < 1000; i += 1) await Promise.resolve()
}
export const text = (ui: Ui, t: string | RegExp) => ui.find({ type: 'Text', text: t })

// Every scenario answers what the session start and the agent timer ask, before its first call on `$`.
export const base = (on: On) => {
  const clock = mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  return clock
}
export const start = async ($: Engine) => {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await spin()
}
// Whether a read is running (the module's `isAccountReading`, which this file's own copy of the module cannot see): a second
// session start reads only when none is, so it asks identity once more exactly when none was running. It starts a read as a side effect.
export const isReading = async ($: Engine, asked: { n: number }) => {
  const before = asked.n
  await start($)
  return asked.n === before
}
export const band = async ($: Engine) => $.ui.mount({ ...BAND, surface: 'terminal' })

/** `session.identity` answers: `answers[n]` for the n-th call (a Promise to hold it), the last one for the calls after. */
export const identities = (on: On, answers: (() => Promise<{ value: SessionIdentity }> | { value: SessionIdentity })[]) => {
  const calls = { n: 0 }
  on('session.identity', () => {
    const answer = answers[Math.min(calls.n, answers.length - 1)]
    calls.n += 1
    return answer?.() ?? never()
  })
  return calls
}
/** `process.run` answers: the status run's `argv` are kept. */
export const statusRuns = (on: On, answer: () => Promise<ProcessRunResult> | ProcessRunResult) => {
  const runs = { n: 0 }
  on('process.run', async () => {
    runs.n += 1
    return { value: await answer() }
  })
  return runs
}
export const accountWrites = (on: On, gate: (n: number) => 'deny' | undefined = () => undefined) => {
  const writes = { n: 0 }
  on('state.set', { plugin: 'agent-models', key: 'account' }, (_, e, next) => {
    writes.n += 1
    return gate(writes.n) === 'deny' ? { deny: 'refused' } : next(e)
  })
  return writes
}

