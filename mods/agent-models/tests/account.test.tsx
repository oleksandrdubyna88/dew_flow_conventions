import { expect, mock, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { CommandRunResult, On, ProcessRunResult } from 'claude-code'

import {
  accountFromFailure,
  settledLogin,
  accountFromStatus,
  identityEmail,
  isAccountFresh,
  isLoginPending,
  parseStatus,
  reasonLine,
} from '../hooks/prompts'

const BAND = {
  plugin: 'agent-models',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 12,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 11 },
    view: {},
  },
} as const

const SURFACES = ['terminal', 'desktop'] as const
type Ui = Mounted<'terminal' | 'desktop', 'AbovePrompt'>

const ok = (stdout: string): ProcessRunResult => ({
  exitCode: 0,
  stdout,
  stderr: '',
  isStdoutTruncated: false,
  isStderrTruncated: false,
})
const statusJson = (fields: Record<string, unknown>) =>
  JSON.stringify({ loggedIn: true, email: 'dev@example.com', ...fields })
const noIdentity = (on: On) => on('session.identity', () => ({ value: { deny: 'not a managed mod' } }))
const status = (on: On, answer: () => ProcessRunResult | Promise<ProcessRunResult> | { deny: string }) => {
  const argvs: (readonly string[])[] = []
  const timeouts: (number | undefined)[] = []
  on('process.run', async (_, e) => {
    argvs.push(e.argv)
    timeouts.push(e.init?.timeoutMs)
    const a = await answer()
    return 'deny' in a ? a : { value: a }
  })
  return { argvs, timeouts }
}
const loginRuns = (on: On, answer: () => CommandRunResult | Promise<CommandRunResult>) => {
  let calls = 0
  const origins: string[] = []
  on('command.run', { command: 'login' }, (_, e) => {
    calls += 1
    origins.push(e.origin.kind)
    return answer()
  })
  return { calls: () => calls, origins }
}
const turnEnds = (on: On) => on('turn.complete', (_, e) => ({ text: e.answer }))
const TURN = { answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as const
const spin = async () => {
  for (let i = 0; i < 1000; i += 1) await Promise.resolve()
}
// The session start does not wait for the account read, so the read is given its microtasks here.
const start = async ($: Engine) => {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await spin()
}
const text = (ui: Ui, t: string | RegExp) => ui.find({ type: 'Text', text: t })
const loginButton = (ui: Ui) => ui.find({ type: 'Button', key: 'login' })

// Every scenario answers what the session start and the agent timer ask, before its first call on `$`.
const base = (on: On) => {
  const clock = mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  return clock
}

// --- pure ---

test('P1 parseStatus keeps exactly two fields', () => {
  const parsed = parseStatus(statusJson({ accessToken: 'sk-ant-SECRET', orgId: 'org-SECRET' }))
  expect(parsed).toEqual({ loggedIn: true, email: 'dev@example.com' })
  expect(Object.keys(parsed ?? {}).sort()).toEqual(['email', 'loggedIn'])
})

test('P2 parseStatus refuses what is not one status object', () => {
  for (const bad of ['[]', 'null', '{"loggedIn":"yes"}', 'not json', '']) expect(parseStatus(bad)).toBeNull()
  expect(parseStatus('{"loggedIn":true,"email":"  "}')).toEqual({ loggedIn: true, email: undefined })
})

test('P3 accountFromStatus follows the decision order', () => {
  expect(accountFromStatus(ok(statusJson({ loggedIn: false })), 5)).toEqual({ kind: 'signed-out', readAt: 5 })
  expect(accountFromStatus({ ...ok(statusJson({})), exitCode: 1 }, 5)).toEqual({
    kind: 'unknown',
    suffix: 'claude exited 1',
    readAt: 5,
  })
  expect(accountFromStatus({ ...ok(statusJson({})), isStdoutTruncated: true }, 5)).toMatchObject({
    suffix: 'unreadable status',
  })
  expect(accountFromStatus(ok('{"loggedIn":true}'), 5)).toEqual({ kind: 'unknown', suffix: 'no email reported', readAt: 5 })
  expect(accountFromStatus(ok('{"loggedIn":true,"email":7}'), 5)).toMatchObject({ suffix: 'no email reported' })
  expect(accountFromStatus(ok('{"loggedIn":"yes"}'), 5)).toMatchObject({ suffix: 'unreadable status' }) // not a status at all
  expect(accountFromStatus(ok(statusJson({})), 5)).toEqual({ kind: 'signed-in', email: 'dev@example.com', readAt: 5 })
})

test('P4 accountFromFailure names the three causes', () => {
  const enoent = Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' })
  expect(accountFromFailure(enoent, 5)).toEqual({ kind: 'unknown', suffix: 'claude not on PATH', readAt: 5 })
  for (const code of ['ETIMEDOUT', 'ERR_CHILD_PROCESS_TIMEOUT']) {
    expect(accountFromFailure(Object.assign(new Error('x'), { code }), 5)).toMatchObject({ suffix: 'timed out' })
  }
  // a message alone is not a timeout signal (the engine types no timeout flag; a proxy error can say "timeout" too)
  expect(accountFromFailure(new Error('timed out after 10000 ms'), 5)).toMatchObject({ suffix: 'unreadable status' })
  expect(accountFromFailure(new Error('connection timeout to the proxy'), 5)).toMatchObject({ suffix: 'unreadable status' })
  expect(accountFromFailure(new Error('denied by a plugin'), 5)).toMatchObject({ suffix: 'unreadable status' })
  expect(accountFromFailure('boom', 5)).toMatchObject({ suffix: 'unreadable status' })
})

test('P5 the small pure helpers', () => {
  expect(identityEmail({ deny: 'x' })).toBeUndefined()
  expect(identityEmail({ kind: 'claude.ai', isVerified: false, email: ' a@b ' })).toBe('a@b')
  expect(isLoginPending({ startedAt: 0 }, 599_999)).toBe(true)
  expect(isLoginPending({ startedAt: 0 }, 600_000)).toBe(false)
  expect(isAccountFresh({ kind: 'unread' }, 0)).toBe(false)
  expect(reasonLine(new Error(' first\nsecond '))).toBe('first')
  expect(reasonLine(new Error('x'.repeat(300)))).toHaveLength(160)
  expect(reasonLine('')).toBe('unknown reason — run /login directly')
})

test('P6 reasonLine strips escape sequences and control characters before it cuts', () => {
  expect(reasonLine(new Error('\u001b[31mdenied\u001b[0m by \u001b]0;title\u0007policy'))).toBe('denied by policy')
  expect(reasonLine(new Error('bell\u0007 and\ttab\u0000 \u009bX'))).toBe('bell and tab X')
  // the cut comes after the strip: 150 printable characters wrapped in escapes keep all 150
  const wrapped = `\u001b[1m${'y'.repeat(150)}\u001b[0m`
  expect(reasonLine(new Error(wrapped))).toBe('y'.repeat(150))
  expect(reasonLine(new Error('\u001b[31m\u001b[0m\n  \u0007 '))).toBe('unknown reason — run /login directly')
  expect(reasonLine('   ')).toBe('unknown reason — run /login directly')
})

// --- the band ---

test('B1 the status email is drawn in orange and the login button in green', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  await start($)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await text(ui, 'dev@example.com'))?.props.color).toBe('#f97316')
    expect((await loginButton(ui))?.children).toMatchObject([
      { type: 'Text', props: { color: '#22c55e' }, children: ['login'] },
    ])
    expect((await ui.find({ type: 'Button', key: 'my-messages' }))?.children).toMatchObject([
      { type: 'Text', props: { color: '#a855f7' } },
    ])
    await ui.unmount()
  }
})

test('B2 the identity email wins and no process runs', async ($, on) => {
  base(on)
  on('session.identity', () => ({ value: { kind: 'claude.ai', email: 'managed@example.com', isVerified: true } }))
  const { argvs } = status(on, () => ok(statusJson({ email: 'other@example.com' })))
  await start($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await text(ui, 'managed@example.com')).toBeDefined()
  expect(await text(ui, 'other@example.com')).toBeUndefined()
  expect(argvs.length).toBe(0)
  await ui.unmount()
})

test('B3 secret-looking fields never reach state, the tree or a log', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () =>
    ok(
      statusJson({
        accessToken: 'sk-ant-SECRET-1',
        refreshToken: 'rt-SECRET-2',
        orgId: 'org-SECRET-3',
        loginExpiresAt: '2027-01-01T00:00:00Z',
      }),
    ),
  )
  const writes: string[] = []
  let logs = 0
  on('state.set', (_, e, next) => {
    writes.push(JSON.stringify(e))
    return next(e)
  })
  on('ui.log', () => {
    logs += 1
    return { value: undefined }
  })
  await start($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const drawn = JSON.stringify(await ui.drawn())
  expect(drawn).not.toContain('SECRET')
  expect(drawn).not.toContain('2027-01-01')
  expect(writes.some(w => w.includes('dev@example.com'))).toBe(true) // the email was written: the scan saw real writes
  for (const w of writes) {
    expect(w).not.toContain('SECRET')
    expect(w).not.toContain('2027-01-01')
  }
  expect(logs).toBe(0)
  expect(await text(ui, 'dev@example.com')).toBeDefined() // the positive control
  await ui.unmount()
})

test('B4 loggedIn false draws not signed in, dim', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({ loggedIn: false })))
  await start($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await text(ui, 'not signed in'))?.props.dimColor).toBe(true)
  expect((await ui.findAll({ type: 'Text' })).some(t => t.props.color === '#f97316')).toBe(false)
  await ui.unmount()
})

test('B5 a non-zero exit with valid JSON is account ?', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ({ ...ok(statusJson({})), exitCode: 1 }))
  await start($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await text(ui, 'account ? (claude exited 1)'))?.props.dimColor).toBe(true)
  expect(await text(ui, 'dev@example.com')).toBeUndefined()
  await ui.unmount()
})

test('B6 a missing claude is (claude not on PATH)', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ({ deny: 'spawn claude ENOENT' }))
  await start($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await text(ui, 'account ? (claude not on PATH)')).toBeDefined()
  await ui.unmount()
})

test('B7 non-JSON stdout is (unreadable status)', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok('Not logged in'))
  await start($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await text(ui, 'account ? (unreadable status)')).toBeDefined()
  await ui.unmount()
})

test('B8 before the first read ends the band says account ?', async ($, on) => {
  base(on)
  noIdentity(on)
  let release: (r: ProcessRunResult) => void = () => undefined
  const held = new Promise<ProcessRunResult>(resolve => {
    release = resolve
  })
  status(on, () => held)
  await start($) // the session start does not wait for the held read
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await text(ui, 'account ?')).toBeDefined()
  release(ok(statusJson({})))
  await spin()
  await ui.redraw()
  expect(await text(ui, 'dev@example.com')).toBeDefined()
  await ui.unmount()
})

test('B9 the argv and the timeout are constant', async ($, on) => {
  base(on)
  noIdentity(on)
  const { argvs, timeouts } = status(on, () => ok(statusJson({})))
  await start($)
  expect(argvs).toEqual([['claude', 'auth', 'status', '--json']])
  expect(timeouts).toEqual([10000])
})

// --- login ---

test('L1 a press runs /login once', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  const login = loginRuns(on, () => ({ text: '' }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'login' })
  expect(login.calls()).toBe(1)
  expect(login.origins).toEqual(['plugin'])
  await ui.unmount()
})

test('L2 two presses while pending run /login once and the button is dim', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  let release: (r: CommandRunResult) => void = () => undefined
  const held = new Promise<CommandRunResult>(resolve => {
    release = resolve
  })
  const login = loginRuns(on, () => held)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const pressing = ui.press({ key: 'login' })
  await spin()
  await ui.redraw()
  expect((await loginButton(ui))?.props.dimColor).toBe(true)
  await ui.press({ key: 'login' })
  expect(login.calls()).toBe(1)
  release({ text: '' })
  await pressing
  await spin()
  await ui.redraw()
  expect((await loginButton(ui))?.props.dimColor).toBeFalsy()
  await ui.unmount()
})

test('L3 a settle reads the account once more', async ($, on) => {
  base(on)
  noIdentity(on)
  const calls = { n: 0 }
  const { argvs } = status(on, () => {
    calls.n += 1
    return ok(statusJson({ email: calls.n < 2 ? 'old@example.com' : 'new@example.com' }))
  })
  loginRuns(on, () => ({ text: '' }))
  await start($)
  expect(argvs.length).toBe(1)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await text(ui, 'old@example.com')).toBeDefined()
  await ui.press({ key: 'login' })
  await spin()
  expect(argvs.length).toBe(2)
  await ui.redraw()
  expect(await text(ui, 'new@example.com')).toBeDefined()
  await ui.unmount()
})

test('L4 a rejection draws the reason, dim, and the next press clears it', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  let fail = true
  let release: (r: CommandRunResult) => void = () => undefined
  const held = new Promise<CommandRunResult>(resolve => {
    release = resolve
  })
  loginRuns(on, () => {
    if (fail) throw new Error('unknown command') // the kit skips this hook and rejects with its own text: 'no implementation for command.run'
    return held
  })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'login' })
  await spin()
  await ui.redraw()
  expect((await text(ui, 'login could not start: no implementation for command.run'))?.props.dimColor).toBe(true)
  expect((await loginButton(ui))?.props.dimColor).toBeFalsy()
  fail = false
  const pressing = ui.press({ key: 'login' })
  await spin()
  await ui.redraw()
  expect(await text(ui, /login could not start/)).toBeUndefined()
  release({ text: '' })
  await pressing
  await ui.unmount()
})

test('L5 the 10-minute ceiling settles a login that never answered', async ($, on) => {
  const clock = base(on)
  noIdentity(on)
  const { argvs } = status(on, () => ok(statusJson({})))
  let release: (r: CommandRunResult) => void = () => undefined
  const held = new Promise<CommandRunResult>(resolve => {
    release = resolve
  })
  loginRuns(on, () => held)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const pressing = ui.press({ key: 'login' })
  await spin()
  expect(argvs.length).toBe(1) // the draw's own read of an unread account (1.3.2)
  await clock.advance(600_000)
  await spin()
  await ui.redraw()
  expect((await loginButton(ui))?.props.dimColor).toBeFalsy()
  expect(argvs.length).toBe(2)
  await clock.advance(120_000) // (was 600 000: since 1.4.0 the draw starts the 2 s timer, and the mock clock settles after every period)
  await spin()
  expect(argvs.length).toBe(2)
  release({ text: '' })
  await pressing
  await spin()
  expect(argvs.length).toBe(3) // a late settle that resolved still reads once (single flight keeps it cheap)
  await ui.redraw()
  expect((await loginButton(ui))?.props.dimColor).toBeFalsy()
  await ui.unmount()
})

test('L7 two presses started together run /login once', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  let release: (r: CommandRunResult) => void = () => undefined
  const held = new Promise<CommandRunResult>(resolve => {
    release = resolve
  })
  const login = loginRuns(on, () => held)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const first = ui.press({ key: 'login' })
  const second = ui.press({ key: 'login' }) // no await between: both handlers start before either wrote state
  await spin()
  expect(login.calls()).toBe(1)
  release({ text: '' })
  await Promise.all([first, second])
  await spin()
  expect(login.calls()).toBe(1)
  await ui.unmount()
})

test('L8 a settle cancels the 10-minute ceiling timer', async ($, on) => {
  on('clock.now', () => ({ value: 0 })) // an own clock: mock.clock owns the clock.after hook
  on('agent.list', () => ({ value: [] }))
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  const ceilings: { ms: number; cancelled: boolean }[] = []
  on('clock.after', (_, e, next) => {
    const entry = { ms: e.ms, cancelled: false }
    if (e.ms === 600_000) ceilings.push(entry) // the login ceiling; the account read's own ceilings (5 s, 30 s, 1.4.0) are not this test's subject
    next.signal.addEventListener('abort', () => {
      entry.cancelled = true
    })
    return new Promise<{ value: void }>(() => undefined) // the dispatch stays open until a cancel aborts it
  })
  loginRuns(on, () => ({ text: '' }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'login' })
  await spin()
  expect(ceilings.map(c => c.ms)).toEqual([600_000])
  expect(ceilings[0]?.cancelled).toBe(true)
  await ui.unmount()
})

test('L9 a late settle after the ceiling reads once and changes no state', async ($, on) => {
  const clock = base(on)
  noIdentity(on)
  const { argvs } = status(on, () => ok(statusJson({})))
  let reject: (e: Error) => void = () => undefined
  const held = new Promise<CommandRunResult>((_, no) => {
    reject = no
  })
  loginRuns(on, () => held)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const pressing = ui.press({ key: 'login' })
  await spin()
  await clock.advance(600_000)
  await spin()
  expect(argvs.length).toBe(2) // the draw's read, then the ceiling's (the ceiling settled the attempt)
  reject(new Error('too late to count'))
  await pressing
  await spin()
  await ui.redraw()
  expect(argvs.length).toBe(2) // a late REJECTION is not attributed: no state, no read
  expect(await text(ui, /login could not start/)).toBeUndefined()
  await ui.unmount()
})

test('L10 the account row stays while the messages viewer is open', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  on('session.messages', () => ({ value: [{ role: 'user', text: 'hello there', toolUses: [] }] }))
  await start($)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    await ui.redraw()
    expect(await text(ui, /^Message 1 \/ 1/)).toBeDefined() // the viewer is open
    expect((await text(ui, 'dev@example.com'))?.props.color).toBe('#f97316')
    expect(await loginButton(ui)).toBeDefined()
    await ui.press({ key: 'close' }) // the viewer's state belongs to the plugin: leave it closed for the next surface
    await ui.unmount()
  }
})

test('L11 a login left pending past its ceiling is cleared by the next main-loop turn', async ($, on) => {
  let nowMs = 0
  on('clock.now', () => ({ value: nowMs })) // an own clock: mock.clock owns the clock.after hook
  on('agent.list', () => ({ value: [] }))
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  turnEnds(on)
  // A hot reload drops the ceiling timer: a timer whose dispatch never resolves stands for it.
  on('clock.after', () => new Promise<{ value: void }>(() => undefined))
  const loginWrites: string[] = []
  on('state.set', (_, e, next) => {
    if (JSON.stringify(e).includes('"login"')) loginWrites.push(JSON.stringify(e))
    return next(e)
  })
  let release: (r: CommandRunResult) => void = () => undefined
  const held = new Promise<CommandRunResult>(resolve => {
    release = resolve
  })
  loginRuns(on, () => held)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const pressing = ui.press({ key: 'login' })
  await spin()
  expect(loginWrites).toHaveLength(1) // { startedAt }
  nowMs = 600_000
  await $.turn.complete(TURN)
  await spin()
  expect(loginWrites).toHaveLength(2) // the repair wrote {}
  expect(JSON.parse(loginWrites[1] ?? '{}').value).toEqual({ attempt: 1 }) // the attempt counter survives a clear
  release({ text: '' })
  await pressing
  await ui.unmount()
})

test('L6 the result text is never drawn', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  loginRuns(on, () => ({ text: 'Logged in as somebody@example.com' }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'login' })
  await spin()
  await ui.redraw()
  expect(await text(ui, /somebody@example\.com/)).toBeUndefined()
  await ui.unmount()
})

// --- throttle ---

test('T1 a main-loop turn 60 s after the last read reads again, 59 s after does not', async ($, on) => {
  const clock = base(on)
  noIdentity(on)
  const { argvs } = status(on, () => ok(statusJson({})))
  turnEnds(on)
  await start($)
  expect(argvs.length).toBe(1)
  await clock.advance(59_000)
  await $.turn.complete(TURN)
  await spin()
  expect(argvs.length).toBe(1)
  await clock.advance(1_000)
  await $.turn.complete(TURN)
  await spin()
  expect(argvs.length).toBe(2)
})

test('T2 a subagent turn never reads', async ($, on) => {
  const clock = base(on)
  noIdentity(on)
  const { argvs } = status(on, () => ok(statusJson({})))
  turnEnds(on)
  await start($)
  await clock.advance(120_000)
  await $.turn.complete({ ...TURN, agentId: 'a1' })
  await spin()
  expect(argvs.length).toBe(1)
  await $.turn.complete(TURN)
  await spin()
  expect(argvs.length).toBe(2)
})

test('T3 a turn during a read queues one more read, not two', async ($, on) => {
  base(on)
  noIdentity(on)
  const gates: ((r: ProcessRunResult) => void)[] = []
  const { argvs } = status(on, () => new Promise<ProcessRunResult>(resolve => gates.push(resolve)))
  turnEnds(on)
  await start($)
  expect(argvs.length).toBe(1)
  await $.turn.complete(TURN)
  await $.turn.complete(TURN)
  await spin()
  expect(argvs.length).toBe(1)
  gates[0]?.(ok(statusJson({})))
  await spin()
  expect(argvs.length).toBe(2)
  gates[1]?.(ok(statusJson({})))
  await spin()
  expect(argvs.length).toBe(2)
})

test('T4 the turn hook passes the engine result through', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  on('turn.complete', () => ({ text: 'done' }))
  await start($)
  expect(await $.turn.complete(TURN)).toEqual({ text: 'done' })
})

// --- review fixes ---

test('P7 a settled login keeps the attempt counter and drops startedAt', () => {
  expect(settledLogin({ attempt: 3, startedAt: 9 })).toEqual({ attempt: 3 })
  expect(settledLogin({ attempt: 3, startedAt: 9 }, 'no')).toEqual({ attempt: 3, reason: 'no' })
  expect(settledLogin({})).toEqual({})
})

test('B10 a logged-in status with no email is `account ? (no email reported)`', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok('{"loggedIn":true}'))
  await start($)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await text(ui, 'account ? (no email reported)')).toBeDefined()
  await ui.unmount()
})

test('L12 an old attempt settling late never clears a new attempt that started in the same millisecond', async ($, on) => {
  on('clock.now', () => ({ value: 0 })) // one fixed millisecond for both attempts
  on('agent.list', () => ({ value: [] }))
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  const fires: (() => void)[] = []
  // only the login ceiling fires here (600 000 ms); the account read's own ceilings (5 s, 30 s, 1.4.0) never do
  on('clock.after', (_, e) => new Promise<{ value: void }>(resolve => { if (e.ms === 600_000) fires.push(() => resolve({ value: undefined })) }))
  const releases: ((r: CommandRunResult) => void)[] = []
  let calls = 0
  on('command.run', { command: 'login' }, () => {
    calls += 1
    return new Promise<CommandRunResult>(resolve => releases.push(resolve))
  })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const first = ui.press({ key: 'login' })
  await spin()
  fires[0]?.() // attempt 1's ceiling settles it; its command is still in flight
  await spin()
  await ui.redraw()
  expect((await loginButton(ui))?.props.dimColor).toBeFalsy()
  const second = ui.press({ key: 'login' })
  await spin()
  await ui.redraw()
  expect(calls).toBe(2)
  expect((await loginButton(ui))?.props.dimColor).toBe(true)
  releases[0]?.({ text: '' }) // attempt 1's command ends late
  await spin()
  await ui.redraw()
  expect((await loginButton(ui))?.props.dimColor).toBe(true) // attempt 2 is still pending
  releases[1]?.({ text: '' })
  await Promise.all([first, second])
  await spin()
  await ui.redraw()
  expect((await loginButton(ui))?.props.dimColor).toBeFalsy()
  await ui.unmount()
})

test('L13 a pending login this module has no live attempt for is stale: a press clears it and starts a new one', async ($, on) => {
  on('clock.now', () => ({ value: 0 }))
  on('agent.list', () => ({ value: [] }))
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  const ceilings: number[] = []
  on('clock.after', (_, e) => {
    if (e.ms === 600_000) ceilings.push(e.ms) // the login ceiling; the account read's own ceilings (1.4.0) are not this test's subject
    return new Promise<{ value: void }>(() => undefined)
  })
  // What a hot reload leaves: the state says pending, this module's attempt and timer are gone.
  // (version 0 is the store's own: the press's write must land, and from then on the real value answers)
  let isStale = true
  on('state.get', { plugin: 'agent-models', key: 'login' }, (_, e, next) =>
    isStale ? { value: { value: { attempt: 7, startedAt: 0 }, version: 0 } } : next(e),
  )
  const writes: string[] = []
  on('state.set', async (_, e, next) => {
    if (JSON.stringify(e).includes('"login"')) {
      writes.push(JSON.stringify(e))
      isStale = false
    }
    return next(e)
  })
  const login = loginRuns(on, () => ({ text: '' }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await text(ui, /logging in…/)).toBeDefined() // the state says pending, so the band says so
  await ui.press({ key: 'login' })
  await spin()
  expect(login.calls()).toBe(1)
  expect(JSON.parse(writes[0] ?? '{}').value).toEqual({ attempt: 8, startedAt: 0 }) // the counter goes on from the stale one
  expect(ceilings).toEqual([600_000])
  await ui.unmount()
})

test('L14 `logging in…` is drawn beside the button while pending and gone after the settle', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  let release: (r: CommandRunResult) => void = () => undefined
  const held = new Promise<CommandRunResult>(resolve => {
    release = resolve
  })
  loginRuns(on, () => held)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await text(ui, /logging in…/)).toBeUndefined()
  const pressing = ui.press({ key: 'login' })
  await spin()
  await ui.redraw()
  expect((await text(ui, /logging in…/))?.props.dimColor).toBe(true)
  release({ text: '' })
  await pressing
  await spin()
  await ui.redraw()
  expect(await text(ui, /logging in…/)).toBeUndefined()
  await ui.unmount()
})

test('L15 an idle render of a known account never asks the clock', async ($, on) => {
  // a known account: the draw reads (and asks the clock) only while it is unread, which band.test.tsx's C1-C6 cover
  on('state.get', { plugin: 'agent-models', key: 'account' }, () => ({ value: { value: { kind: 'signed-in', email: 'dev@example.com', readAt: 0 }, version: 0 } }))
  let nows = 0
  on('clock.now', () => {
    nows += 1
    return { value: 0 }
  })
  on('agent.list', () => ({ value: [] }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.redraw()
  await ui.redraw()
  expect(nows).toBe(0)
  await ui.unmount()
})

test('V1 the viewer counts its fixed rows as drawn: content that exactly fills maxRows has no scroll note', async ($, on) => {
  base(on)
  noIdentity(on)
  status(on, () => ok(statusJson({})))
  on('session.messages', () => ({ value: [{ role: 'user', text: 'hello', toolUses: [] }] }))
  await start($)
  // drawn: account row 1 + header 1 + buttons 1 + the note (118 characters, 2 rows at 80 columns) + the prompt 1 = 6
  const at = (maxRows: number) => ({ ...BAND, props: { ...BAND.props, maxRows }, surface: 'terminal' as const })
  const fits = await $.ui.mount(at(6))
  await fits.press({ key: 'my-messages' })
  await fits.redraw()
  expect(await text(fits, /^Message 1 \/ 1$/)).toBeDefined()
  await fits.press({ key: 'close' })
  await fits.unmount()
  const over = await $.ui.mount(at(5)) // one row short: the band scrolls, so the header says so
  await over.press({ key: 'my-messages' })
  await over.redraw()
  expect(await text(over, 'Message 1 / 1 (scroll for more)')).toBeDefined()
  await over.press({ key: 'close' })
  await over.unmount()
})
