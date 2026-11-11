import { mock } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { On, ProcessRunResult } from 'claude-code'

// The fixtures of the limits tests (limits.test.tsx, limits-race.test.tsx): the band, the shape the real endpoint answered
// on 2026-11-10, and a signed-in session whose usage answer the test chooses.

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
export const L1 = '5h 87% left · week 74% left · Fable 82% left'
export const NONE = '5h — · week — · Fable —'
// 69 / 35 / 8 left: one number in each colour band (green over 60, orange 10-60, red under 10).
export const COLOURED = JSON.stringify(measured({ five_hour: window(31), seven_day: window(65), limits: [scoped('Fable', 92)] }))
export const LC = '5h 69% left · week 35% left · Fable 8% left'

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
export const world = async ($: Engine, on: On, answer: () => Answer | Promise<Answer>, auth: () => unknown = () => ({ handle: 'h-1', kind: 'bearer' }), opts: { isStarted?: boolean; email?: string | undefined } = {}): Promise<World> => {
  const clock = mock.clock(on)
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
