import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { AgentInfo, AgentStatus, On, ProcessRunResult, SessionIdentity } from 'claude-code'

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

const agent = (id: string, status: AgentStatus = 'running', name?: string): AgentInfo => ({
  id,
  description: `task ${id}`,
  type: 'Explore',
  status,
  ...(name ? { name } : {}),
})

const SPAWN = {
  tool_use_id: 't',
  prompt: 'p',
  description: 'd',
  subagentType: 'Explore',
  provider: { plugin: 'engine', tier: 'core' },
  parentModel: 'claude-opus-5-5',
  background: true,
  fork: false,
} as const

const engineDraws = (on: On) =>
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

const SURFACES = ['terminal', 'desktop'] as const

// A spawn hook that hands out a1, a2 … with the models given, in order.
const spawnsWith = (on: On, models: readonly string[]) => {
  let n = 0
  on('agent.spawn', () => {
    const model = models[n] ?? ''
    n += 1
    return { agentId: `a${n}`, model }
  })
}

test("a spawned agent's row shows its model", async ($, on) => {
  let list: AgentInfo[] = []
  spawnsWith(on, ['claude-sonnet-4-6', 'claude-opus-4-1[1m]'])
  on('agent.list', () => ({ value: list }))
  await $.agent.spawn(SPAWN)
  await $.agent.spawn(SPAWN)
  list = [agent('a1', 'running', 'scout-1'), agent('a2', 'waiting')]
  await $.agent.spawn(SPAWN) // a spawn refreshes the rows

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    for (const text of ['sonnet-4-6', 'opus-4-1 1M', 'scout-1', 'task a2']) {
      expect((await ui.find({ type: 'Text', text }))?.text).toBe(text)
    }
    expect(await ui.findAll({ type: 'Text', text: '● ' })).toHaveLength(1)
    expect(await ui.findAll({ type: 'Text', text: '○ ' })).toHaveLength(1)
    await ui.unmount()
  }
})

test('an agent with no recorded model shows model ?', async ($, on) => {
  spawnsWith(on, [''])
  on('agent.list', () => ({ value: [agent('a1'), agent('a9')] }))
  await $.agent.spawn(SPAWN)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.findAll({ type: 'Text', text: 'model ?' })).toHaveLength(2)
    await ui.unmount()
  }
})

// The session start also reads the account: it gets answers here, so no band test hangs on an unanswered call.
const startSession = (on: On) => {
  const clock = mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.identity', () => ({ value: { deny: 'not a managed mod' } }))
  on('process.run', () => ({
    value: { exitCode: 0, stdout: '{"loggedIn":false}', stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  on('command.run', { command: 'login' }, () => ({ text: '' }))
  return clock
}

test('a finished agent leaves the band', async ($, on) => {
  const clock = startSession(on)
  engineDraws(on)
  let list: AgentInfo[] = [agent('a1')]
  spawnsWith(on, ['claude-sonnet-4-6'])
  on('agent.list', () => ({ value: list }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.agent.spawn(SPAWN)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: 'task a1' }))?.text).toBe('task a1')
    list = [agent('a1', 'completed')]
    await clock.advance(2000)
    await ui.redraw() // the mounted handle keeps its old tree until it is drawn again
    expect(await ui.find({ type: 'Text', text: /task a1/ })).toBeUndefined()
    // the band is never empty now: the my-messages Button stays where the rows were
    expect(await ui.find({ type: 'Button', key: 'my-messages' })).toBeDefined()
    await ui.unmount()
    list = [agent('a1')]
    await clock.advance(2000)
  }
})

// The test's `$` has no `state` noun, so the cap is read through the band:
// a0 was pushed out of the kept 200 and shows `model ?`, a200 shows its model.
test('a 201st spawn keeps the newest 200 models', { timeoutMs: 60000 }, async ($, on) => {
  let n = -1
  let list: AgentInfo[] = []
  on('agent.spawn', () => {
    n += 1
    return { agentId: `a${n}`, model: `claude-m${n}` }
  })
  on('agent.list', () => ({ value: list }))
  for (let i = 0; i < 200; i += 1) {
    await $.agent.spawn(SPAWN)
  }
  list = [agent('a0'), agent('a1'), agent('a200')]
  await $.agent.spawn(SPAWN) // the 201st

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.findAll({ type: 'Text', text: 'model ?' })).toHaveLength(1)
    expect((await ui.find({ type: 'Text', text: 'm1' }))?.text).toBe('m1')
    expect((await ui.find({ type: 'Text', text: 'm200' }))?.text).toBe('m200')
    await ui.unmount()
  }
})

test('one environment runs one refresh timer', async ($, on) => {
  const clock = startSession(on)
  let calls = 0
  on('agent.list', () => {
    calls += 1
    return { value: [] }
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  calls = 0
  await clock.advance(2000)
  expect(calls).toBe(1)
})

test('a list that throws is retried next tick', async ($, on) => {
  const clock = startSession(on)
  let calls = 0
  spawnsWith(on, ['claude-sonnet-4-6'])
  on('agent.list', () => {
    calls += 1
    if (calls === 1) throw new Error('not bound yet')
    return { value: [agent('a1')] }
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.agent.spawn(SPAWN) // its refresh is the first list call and throws
  await clock.advance(2000)
  await clock.advance(2000)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: 'task a1' }))?.text).toBe('task a1')
    await ui.unmount()
  }
})

test('the band yields to a survey', async ($, on) => {
  spawnsWith(on, ['claude-sonnet-4-6'])
  on('agent.list', () => ({ value: [agent('a1')] }))
  engineDraws(on)
  await $.agent.spawn(SPAWN)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface, props: { ...BAND.props, hasSurvey: true } })
    expect((await ui.find({ type: 'Text', text: 'engine' }))?.text).toBe('engine')
    expect(await ui.find({ type: 'Text', text: /task/ })).toBeUndefined()
    await ui.unmount()
  }
})

test('the band composes the rest of the chain below it', async ($, on) => {
  spawnsWith(on, ['claude-sonnet-4-6'])
  on('agent.list', () => ({ value: [agent('a1')] }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>other band</Text>
  })
  await $.agent.spawn(SPAWN)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Button', key: 'my-messages' }))?.props.label).toBe('messages')
    expect((await ui.find({ type: 'Text', text: 'task a1' }))?.text).toBe('task a1')
    expect((await ui.find({ type: 'Text', text: 'other band' }))?.text).toBe('other band')
    await ui.unmount()
  }
})

test('a rest of the chain that draws nothing leaves only our band', async ($, on) => {
  on('agent.list', () => ({ value: [] }))

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Button', key: 'my-messages' })).toBeDefined()
    await ui.unmount()
  }
})

test('a refresh that fails on every tick for a while recovers and leaks no rejection', async ($, on) => {
  const clock = startSession(on)
  let calls = 0
  on('agent.list', () => {
    calls += 1
    if (calls <= 3) throw new Error('not bound yet')
    return { value: [agent('a1')] }
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  for (let i = 0; i < 4; i += 1) await clock.advance(2000)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: 'task a1' }))?.text).toBe('task a1')
    await ui.unmount()
  }
})

// --- the account read started by the draw (1.3.2): an unread account is read when the band draws it ---

const IDENT = { kind: 'claude.ai', isVerified: true, email: 'dev@example.com' } as const
const spin = async () => {
  for (let i = 0; i < 1000; i += 1) await Promise.resolve()
}
const heldIdentity = () => {
  let release: () => void = () => undefined
  const held = new Promise<void>(resolve => {
    release = resolve
  })
  return { held, release }
}
// Every call of session.identity is counted; `held` (when given) holds each answer until it settles.
const identity = (on: On, answer: SessionIdentity | { deny: string } = IDENT, held?: Promise<void>) => {
  const count = { n: 0 }
  on('session.identity', async () => {
    count.n += 1
    await held
    return { value: answer } // a `{ deny }` value is an identity the engine refused to give
  })
  return count
}
const refuseAccountWrites = (on: On) => on('state.set', { plugin: 'agent-models', key: 'account' }, () => ({ deny: 'refused' }))
const mountTerminal = ($: Engine) => $.ui.mount({ ...BAND, surface: 'terminal' })
const rowText = async (ui: Awaited<ReturnType<typeof mountTerminal>>, t: string | RegExp) => (await ui.find({ type: 'Text', text: t }))?.text
const startOf = async ($: Engine) => {
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await spin()
}

test('C1 an unread account is read once by the first draw and shows the email on both surfaces', async ($, on) => {
  mock.clock(on)
  on('agent.list', () => ({ value: [] }))
  const count = identity(on)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await spin()
    await ui.redraw()
    expect((await ui.find({ type: 'Text', text: 'dev@example.com' }))?.props.color).toBe('#f97316')
    await ui.unmount()
  }
  expect(count.n).toBe(1)
})

test('C2 a draw never starts a read while one is in flight, and the stamp holds after it lands', async ($, on) => {
  const clock = mock.clock(on)
  on('agent.list', () => ({ value: [] }))
  const { held, release } = heldIdentity()
  const count = identity(on, IDENT, held)
  const ui = await mountTerminal($)
  await ui.redraw()
  await ui.redraw()
  await spin()
  expect(count.n).toBe(1)
  expect(await rowText(ui, /^account \?$/)).toBe('account ?')
  release()
  await spin()
  await ui.redraw()
  expect(await rowText(ui, 'dev@example.com')).toBe('dev@example.com')
  expect(count.n).toBe(1)
  await ui.redraw()
  await clock.advance(120_000)
  await ui.redraw()
  await spin()
  expect(count.n).toBe(1)
  await ui.unmount()
})

// The in-flight guard of the draw's read: the read is started by a turn end (so no draw stamp holds the draw back) from a stale unknown
// account, and its status run is held. A draw before the 30 s ceiling must start none: without the guard it would queue one more read,
// which runs when the held one ends (a second identity call and a second status run).
test('C2b a draw while a turn-started read is in flight asks identity and the status run once each', async ($, on) => {
  mock.clock(on, { now: 120_000 })
  on('agent.list', () => ({ value: [] }))
  on('turn.complete', (_, ev) => ({ text: ev.answer }))
  let isStale = true // the state says: unknown, read at 0, 120 s ago; the first write of a read ends it (version 0 is the store's own)
  on('state.get', { plugin: 'agent-models', key: 'account' }, (_, ev, next) =>
    isStale ? { value: { value: { kind: 'unknown', suffix: undefined, readAt: 0 }, version: 0 } } : next(ev),
  )
  on('state.set', { plugin: 'agent-models', key: 'account' }, (_, ev, next) => {
    isStale = false
    return next(ev)
  })
  const count = identity(on, { deny: 'not a managed mod' })
  let release: (r: ProcessRunResult) => void = () => undefined
  let runs = 0
  on('process.run', () => {
    runs += 1
    return new Promise<{ value: ProcessRunResult }>(resolve => {
      release = r => resolve({ value: r })
    })
  })
  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' }) // starts the read: stale
  await spin()
  expect([count.n, runs], 'the turn end started one read, held at its status run').toEqual([1, 1])
  const ui = await mountTerminal($) // the draw sees a stale unknown account and a read in flight
  await ui.redraw()
  await spin()
  release({ exitCode: 0, stdout: JSON.stringify({ loggedIn: true, email: 'dev@example.com' }), stderr: '', isStdoutTruncated: false, isStderrTruncated: false })
  await spin()
  await ui.redraw()
  expect(await rowText(ui, 'dev@example.com')).toBe('dev@example.com')
  expect([count.n, runs], 'the draw queued no second read').toEqual([1, 1])
  await ui.unmount()
})

test('C3 a draw during the session start read starts no second read', async ($, on) => {
  mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  const { held, release } = heldIdentity()
  const count = identity(on, IDENT, held)
  await startOf($)
  expect(count.n).toBe(1)
  const ui = await mountTerminal($)
  await ui.redraw()
  release()
  await spin()
  await ui.redraw()
  expect(await rowText(ui, 'dev@example.com')).toBe('dev@example.com')
  expect(count.n).toBe(1)
  await ui.unmount()
})

test('C4 a refused account write is retried at most once a minute, never once per frame', async ($, on) => {
  const clock = mock.clock(on)
  on('agent.list', () => ({ value: [] }))
  refuseAccountWrites(on)
  const count = identity(on)
  const ui = await mountTerminal($)
  await spin()
  await ui.redraw()
  await ui.redraw()
  await spin()
  expect(count.n).toBe(1)
  await clock.advance(59_999)
  await ui.redraw()
  await spin()
  expect(count.n).toBe(1)
  await clock.advance(1)
  await ui.redraw()
  await spin()
  // a minute in: the draw's throttle lets one read start, and (1.4.0) so does the tick's own minute retry, which the draw started
  expect(count.n).toBe(3)
  await ui.redraw()
  await ui.redraw()
  await spin()
  expect(count.n, 'frames after that start none').toBe(3)
  expect(await rowText(ui, /^account \?$/)).toBe('account ?')
  await ui.unmount()
})

test('C5 a known but stale account is not read by the draw', async ($, on) => {
  const clock = mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  const count = identity(on)
  await startOf($)
  expect(count.n).toBe(1)
  const ui = await mountTerminal($)
  await ui.redraw()
  await ui.redraw()
  await clock.advance(120_000)
  await ui.redraw()
  await spin()
  expect(count.n).toBe(1)
  await ui.unmount()
})

test('C5b an account that is read but unknown is not read again by the draw', async ($, on) => {
  mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  identity(on, { deny: 'not a managed mod' })
  let runs = 0
  on('process.run', () => {
    runs += 1
    return { value: { exitCode: 1, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  await startOf($)
  expect(runs).toBe(1)
  const ui = await mountTerminal($)
  await ui.redraw()
  await ui.redraw()
  await spin()
  expect(runs).toBe(1)
  expect(await rowText(ui, 'account ? (claude exited 1)')).toBe('account ? (claude exited 1)')
  await ui.unmount()
})

test('C6 with no clock the draw reads once and never once per frame', async ($, on) => {
  on('agent.list', () => ({ value: [] }))
  refuseAccountWrites(on)
  const count = identity(on)
  const ui = await mountTerminal($)
  await spin()
  await ui.redraw()
  await ui.redraw()
  await ui.redraw()
  await spin()
  expect(count.n).toBe(1)
  await ui.unmount()
})

test('C7 a session start while the draw-started read is in flight queues no second read', async ($, on) => {
  mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  const { held, release } = heldIdentity()
  const count = identity(on, IDENT, held)
  const ui = await mountTerminal($)
  await spin()
  expect(count.n).toBe(1) // the draw's read, held
  await startOf($)
  release()
  await spin()
  await ui.redraw()
  expect(await rowText(ui, 'dev@example.com')).toBe('dev@example.com')
  expect(count.n).toBe(1)
  await ui.unmount()
})
