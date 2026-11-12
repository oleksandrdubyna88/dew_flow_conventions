import { mock } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { On, ProcessRunResult } from 'claude-code'

// The fixtures of the limits tests (limits.test.tsx, limits-race.test.tsx, reset.test.tsx): the band, the shape the real endpoint
// answered on 2026-11-10, and a signed-in session whose usage answer the test chooses. The session clock starts 83 min 59 s
// before the fixture's `five_hour.resets_at`, so the line says `resets in 1h 23m` for its first 59 s (1.4.0).

export const BAND = {
  plugin: 'agent-models',
  component: 'AbovePrompt',
  requestId: 'band',
  props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 80, scroll: { offset: 0, bodyRows: 11 }, view: {} },
} as const
export const SURFACES = ['terminal', 'desktop'] as const
export type Ui = Mounted<'terminal' | 'desktop', 'AbovePrompt'>
export type Answer = { status: number; text: string }

// The shape the real endpoint answered on 2026-11-10 (33 top-level keys; every number is dummy but the three that are read).
export const scoped = (name: string, percent: unknown) => ({
  kind: 'weekly_scoped', group: 'weekly', percent, severity: 'ok', resets_at: '2026-11-14T00:00:00Z', is_active: true,
  scope: { model: { display_name: name }, surface: {} },
})
export const window = (utilization: unknown) => ({
  utilization, resets_at: '2026-11-10T22:00:00Z', limit_dollars: 5, used_dollars: 1, remaining_dollars: 4, locked_reason: null,
})
export const measured = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  five_hour: window(13),
  seven_day: window(26),
  seven_day_oauth_apps: null, seven_day_opus: null, seven_day_sonnet: null, seven_day_cowork: null, seven_day_omelette: null,
  limits: [
    { kind: 'session', group: 'session', percent: 13, severity: 'ok', resets_at: 'x', scope: null, is_active: true },
    { kind: 'weekly_all', group: 'weekly', percent: 26, severity: 'ok', resets_at: 'x', scope: null, is_active: true },
    scoped('Fable', 18),
  ],
  extra_usage: { is_enabled: true, monthly_limit: 100, used_credits: 7 },
  spend: { limit_dollars: 50, used: 3 },
  seven_day_breakdown: {}, weekly_scoped_shares: { Fable: 0.5 }, member_dashboard_available: true, pace: {}, indicator: 'ok', promo_credits: null,
  ...Object.fromEntries(Array.from({ length: 17 }, (_, i) => [`experiment_${i}`, { arm: 'x' }])),
  ...over,
})
export const MEASURED = JSON.stringify(measured())
export const RESETS_AT = Date.parse('2026-11-10T22:00:00Z') // the fixture window's `resets_at`
export const CLOCK_START = RESETS_AT - (83 * 60_000 + 59_000) // the shown minute is 83 until 59 s have passed
// The MEASURED line with the 5-hour reset time `reset` (`1h 23m`, `1h 22m`, `—` …).
export const l1At = (reset: string) => `5h 87% left · resets in ${reset} · week 74% left · Fable 82% left`
export const L1 = l1At('1h 23m')
export const NONE = '5h — · resets in — · week — · Fable —'
// 69 / 35 / 8 left: one number in each colour band (green over 60, orange 10-60, red under 10).
export const COLOURED = JSON.stringify(measured({ five_hour: window(31), seven_day: window(65), limits: [scoped('Fable', 92)] }))
export const LC = '5h 69% left · resets in 1h 23m · week 35% left · Fable 8% left'

export const ok = (stdout: string): ProcessRunResult => ({ exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false })
export const spin = async () => {
  for (let i = 0; i < 1000; i += 1) await Promise.resolve()
}
export const text = (ui: Ui, t: string | RegExp) => ui.find({ type: 'Text', text: t })
export const limitsButton = (ui: Ui) => ui.find({ type: 'Button', key: 'limits' })
export const pressLimits = async (ui: Ui) => {
  await ui.press({ key: 'limits' })
  await spin() // the fetch is not awaited by the press
  await ui.redraw()
}

export type Calls = { url: string; auth: string | undefined; headers: Record<string, string> | undefined }[]
export type Acct = { email: string | undefined }
export type Gate = { final?: () => Promise<'deny' | undefined> }
export type World = { acct: Acct; gate: Gate; calls: Calls; writes: { key?: string; value?: unknown }[]; logs: { n: number }; clock: ReturnType<typeof mock.clock> }
// A signed-in session whose usage answer is `answer()`; the world records the calls, the state writes of `limits`, and logs.
export const world = async ($: Engine, on: On, answer: () => Answer | Promise<Answer>, auth: () => unknown = () => ({ handle: 'h-1', kind: 'bearer' }), opts: { isStarted?: boolean; email?: string | undefined; now?: number; isClockOwn?: boolean } = {}): Promise<World> => {
  // `isClockOwn`: the test made its own clock with `ownClock` (mock.clock owns the clock hooks, so a test that counts or refuses
  // `clock.now` cannot use it); `World.clock` is then unusable.
  const clock = opts.isClockOwn ? (undefined as unknown as World['clock']) : mock.clock(on, { now: opts.now ?? CLOCK_START })
  const acct: Acct = { email: 'email' in opts ? opts.email : 'dev@example.com' } // the test changes it, then a turn end reads the account again
  const gate: Gate = {}
  const calls: Calls = []
  const writes: World['writes'] = []
  const logs = { n: 0 }
  const noise = () => {
    logs.n += 1
    return { value: undefined }
  }
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  on('session.identity', () => ({ value: acct.email === undefined ? { deny: 'not a managed mod' } : { kind: 'claude.ai', isVerified: true, email: acct.email } }))
  on('process.run', () => ({ value: ok(JSON.stringify({ loggedIn: false })) })) // only asked when the identity gives no email
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('session.authorize', async () => ({ value: (await auth()) as never }))
  on('http.fetch', async (_, e) => {
    calls.push({ url: e.url, auth: e.init?.auth, headers: e.init?.headers })
    const { status, text: body } = await answer()
    return { value: { status, ok: status === 200, headers: {}, text: body } }
  })
  on('state.set', async (_, e, next) => {
    const seen = JSON.parse(JSON.stringify(e)) as { key?: string; value?: unknown }
    if (seen.key === 'limits') writes.push(seen)
    // a fetch's own write (the one carrying `fetchedAt`) can be held or refused by the test
    if (seen.key === 'limits' && JSON.stringify(seen.value).includes('fetchedAt') && (await gate.final?.()) === 'deny') return { deny: 'refused' }
    return next(e)
  })
  on('ui.log', noise)
  on('ui.toast', noise)
  if (opts.isStarted !== false) await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await spin()
  return { acct, gate, calls, writes, logs, clock }
}
export const lastView = (w: World) => w.writes.at(-1)?.value as { value?: unknown; isFailed?: boolean; isOpen?: boolean } | undefined
export const answerWith = (status: number, body: string) => () => ({ status, text: body })
export const closeButton = (ui: Ui) => ui.find({ type: 'Button', key: 'limits-close' })
export const pressClose = async (ui: Ui) => {
  await ui.press({ key: 'limits-close' })
  await spin()
  await ui.redraw()
}
type Node = { type?: string; props?: Record<string, unknown>; children?: unknown[] }
const isNode = (x: unknown): x is Node => typeof x === 'object' && x !== null
/** The Box that holds the limits Close, found depth-first in a drawn tree: the row the height count must describe. */
export const rowOf = (tree: unknown): Node | undefined => {
  if (!isNode(tree)) return undefined
  const kids = tree.children ?? []
  if (kids.some(k => isNode(k) && k.type === 'Button' && k.props?.key === 'limits-close')) return tree
  for (const k of kids) {
    const found = rowOf(k)
    if (found !== undefined) return found
  }
  return undefined
}

// the tsconfig has no node types: the one timer the fixture needs, typed here
const timers = globalThis as unknown as { setTimeout: (fn: () => void, ms: number) => unknown }
export type OwnClock = { now: number; isRefused: boolean; nowCalls: number; everyRefusals: number; tick: (ms: number) => Promise<void> }
/**
 * A clock the test steers by hand, for a test that must count or refuse `$.clock.now`: the time is `now`, a refused clock denies it,
 * `tick(ms)` moves it on and fires one period of the 2 s timer. No `$.clock.after` ever fires (no ceiling runs). Register it BEFORE `world`.
 */
export const ownClock = (on: On, start: number): OwnClock => {
  const waits: (() => void)[] = []
  const clock: OwnClock = {
    now: start,
    isRefused: false,
    nowCalls: 0,
    everyRefusals: 0, // the next this many `$.clock.every` calls are refused: a Timer that never fires
    tick: async ms => {
      clock.now += ms
      waits.shift()?.()
      await spin()
      await new Promise<void>(resolve => timers.setTimeout(resolve, 0)) // the next period is asked after a macrotask
    },
  }
  on('clock.now', () => {
    clock.nowCalls += 1
    return clock.isRefused ? { deny: 'refused' } : { value: clock.now }
  })
  on('clock.after', () => new Promise<{ value: void }>(() => undefined))
  on('clock.every', () => {
    if (clock.everyRefusals > 0) {
      clock.everyRefusals -= 1
      return new Promise<{ value: void }>(() => undefined)
    }
    return new Promise<{ value: void }>(resolve => waits.push(() => resolve({ value: undefined })))
  })
  return clock
}
