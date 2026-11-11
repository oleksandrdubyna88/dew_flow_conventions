// The limits behind the email: a press on the signed-in email opens one line, `5h 87% left · week 74% left · Fable 82% left`,
// read from the usage endpoint the built-in /usage reads. The parser is the ONE road in: of the answer only three numbers
// and the model's label are kept; nothing else of the body, no header and not the credential handle is stored, drawn or
// logged. The endpoint is internal and its shape can change without notice: a missing value is a dash, never a zero.
// Each number is drawn in the colour of what is left, and a red Close beside the line shuts it (1.3.3).
// Every function that takes `$` is a function declaration (an arrow taking `$` is refused across an import).
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Timer } from 'claude-code'

import type { Account, Limits, LimitsView } from '../types'
import { ACCOUNT_COLOR, CLOSE_COLOR, currentAccount, LIMITS_CLOSE_LABEL, LIMITS_GAP, LOGIN_COLOR, nowOrZero } from './prompts'

export const LIMITS_URL = 'https://api.anthropic.com/api/oauth/usage'
export const LIMITS_TIMEOUT_MS = 10_000 // `$.http.fetch` has no timeout option; measured 306 ms
export const LIMITS_INTERVAL_MS = 60_000 // a reopen fetches again only past this
export const MODEL_LIMIT_NAME = 'fable' // compared lower-cased
export const LIMITS_UNAVAILABLE = 'limits unavailable'
export const LIMITS_LOADING = 'loading limits…'

const limits = atom({ plugin: 'agent-models', key: 'limits' } as const, { isOpen: false, isFailed: false } as LimitsView)

// The engine's scan reads `read($, x)` only for an atom written in the same file: register.tsx reads this one through here.
export async function currentLimits($: EngineInterface): Promise<LimitsView> {
  return read($, limits)
}

/** 100 minus the percent used, rounded, clamped 0-100; null for anything that is not a finite number. */
export function percentLeft(utilization: unknown): number | null {
  if (typeof utilization !== 'number' || !Number.isFinite(utilization)) return null
  return Math.max(0, Math.min(100, Math.round(100 - utilization)))
}

const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined

// The first `weekly_scoped` entry named for the model; `model_scoped` is Claude Code's own projection, absent from the raw body.
const modelOf = (entries: unknown): Limits['model'] => {
  if (!Array.isArray(entries)) return null
  for (const entry of entries) {
    const name = field(field(field(entry, 'scope'), 'model'), 'display_name')
    if (field(entry, 'kind') === 'weekly_scoped' && typeof name === 'string' && name.toLowerCase() === MODEL_LIMIT_NAME) {
      const left = percentLeft(field(entry, 'percent'))
      return left === null ? null : { label: name, left }
    }
  }
  return null
}

/** The three numbers and the label from the response text; null unless it is ONE JSON object. The parsed value dies here. */
export function limitsFromBody(text: string): Limits | null {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return {
    fiveHour: percentLeft(field(field(value, 'five_hour'), 'utilization')),
    week: percentLeft(field(field(value, 'seven_day'), 'utilization')),
    model: modelOf(field(value, 'limits')),
  }
}

/** The colour of a percent LEFT: over 60 green, 10–60 orange, under 10 red; none for a non-finite number. */
export const limitColor = (left: number): string | undefined =>
  !Number.isFinite(left) ? undefined : left > 60 ? LOGIN_COLOR : left < 10 ? CLOSE_COLOR : ACCOUNT_COLOR

type Part = { text: string; left?: number } // `left` only on a number's own part, `69%`
const segmentParts = (label: string, left: number | null): Part[] =>
  left === null ? [{ text: `${label} —` }] : [{ text: `${label} ` }, { text: `${left}%`, left }, { text: ' left' }]
const limitsParts = (v: Limits): Part[] =>
  [segmentParts('5h', v.fiveHour), segmentParts('week', v.week), segmentParts(v.model?.label ?? 'Fable', v.model?.left ?? null)]
    .flatMap((parts, i) => (i === 0 ? parts : [{ text: ' · ' }, ...parts]))

/** The one line: `5h 87% left · week 74% left · Fable 82% left`; an absent number is a dash with no `% left`. */
export const limitsLine = (v: Limits): string => limitsParts(v).map(p => p.text).join('')

/** Whether an open needs a fetch: never fetched, or the last fetch ended LIMITS_INTERVAL_MS or more ago. */
export const isLimitsStale = (view: LimitsView, now: number): boolean =>
  view.fetchedAt === undefined || now - view.fetchedAt >= LIMITS_INTERVAL_MS

/** The email of a signed-in account; undefined while the account is unknown, signed out or unread. */
export const emailOf = (acc: Account): string | undefined => (acc.kind === 'signed-in' ? acc.email : undefined)

/** What the open line says, or undefined while it is closed or the account is not the one the line was opened for. */
export const limitsText = (view: LimitsView, email: string | undefined): string | undefined => {
  if (!view.isOpen || email === undefined || view.email !== email) return undefined
  if (view.value !== undefined) return limitsLine(view.value)
  return view.isFailed ? LIMITS_UNAVAILABLE : LIMITS_LOADING // a refetch keeps the old line until the answer lands
}

let limitsFlight: { id: number; email: string } | undefined // the fetch in flight; a hot reload drops it (then nothing is loading)
let limitsGeneration = 0
let lastEnd: { email: string; at: number } | undefined // when the last fetch for an account ended, kept even if its state write failed

// One fetch for `email`; never rejects. The handle is a local here: never in state, a render or a log. The ceiling starts
// BEFORE `authorize()`, so a stalled authorize ends too. A result is written only if this generation is still the live one
// and the line is still for `email`; the flight ends AFTER that write, so a press during it starts no second fetch. A
// failure draws `limits unavailable`, never its text or the status.
export async function fetchLimits($: EngineInterface, email: string): Promise<void> {
  if (limitsFlight?.email === email) return
  const id = ++limitsGeneration
  limitsFlight = { id, email }
  let timer: Timer | undefined
  try {
    let next: Partial<LimitsView>
    try {
      const ceiling = new Promise<never>((_, reject) => {
        timer = $.clock.after(LIMITS_TIMEOUT_MS, () => reject(new Error('timeout')))
      })
      const answer = (async () => {
        const auth = await $.session.authorize()
        if (auth === null) throw new Error('no first-party credential')
        return $.http.fetch(LIMITS_URL, { auth: auth.handle, headers: { Accept: 'application/json' } })
      })()
      const res = await Promise.race([answer, ceiling])
      const value = res.status === 200 ? limitsFromBody(res.text) : null
      next = value === null ? { isFailed: true } : { value, isFailed: false }
    } catch {
      next = { isFailed: true }
    } finally {
      timer?.cancel()
    }
    if (id !== limitsGeneration) return
    const fetchedAt = await nowOrZero($)
    lastEnd = { email, at: fetchedAt }
    await update($, limits, v => (v.email !== email ? v : { ...v, ...next, ...(next.isFailed ? { value: undefined } : {}), fetchedAt }))
  } catch {
    // a refused state write: the failure time is kept in `lastEnd`, so the next open within a minute fetches nothing
  } finally {
    if (limitsFlight?.id === id) limitsFlight = undefined
  }
}

// Whether an open of the line for `email` needs a fetch: not within a minute of the last one's end (failure included), and
// either stale or holding neither a value nor a failure (a reload dropped a fetch mid-flight).
const needsFetch = (view: LimitsView, now: number, email: string): boolean => {
  if (lastEnd?.email === email && now >= lastEnd.at && now - lastEnd.at < LIMITS_INTERVAL_MS) return false // a clock that went back fetches
  return isLimitsStale(view, now) || (view.value === undefined && !view.isFailed)
}

// The press on the email: toggles the line. An open of the line for an account it was not open for starts clean (the old
// account's numbers are never kept) and fetches; a stale open fetches; a close never does. Not signed in: nothing.
export async function toggleLimits($: EngineInterface): Promise<void> {
  try {
    const email = emailOf(await currentAccount($))
    if (email === undefined) return
    const now = await nowOrZero($)
    const held = await read($, limits)
    const isOpen = !(held.isOpen && held.email === email)
    const view: LimitsView = held.email === email ? { ...held, isOpen } : { isOpen, email, isFailed: false }
    await update($, limits, v => (v.email === email ? { ...v, isOpen } : view))
    if (isOpen && needsFetch(view, now, email)) void fetchLimits($, email)
  } catch {
    // a refused state call: the next press tries again
  }
}

// The Close on the limits line: closes it as a second press on the email does, never opens it and never fetches. The
// value and `fetchedAt` stay, so a reopen within a minute draws them without a fetch.
export async function closeLimits($: EngineInterface): Promise<void> {
  await update($, limits, v => ({ ...v, isOpen: false })).catch(() => undefined) // a refused write: the next press tries again
}

type RenderEvent = Parameters<EngineInterface['ui']['resolve']>[0]

// The signed-in email as a button; its key is fixed so the address does not change with the email.
export function accountButton($: EngineInterface, e: RenderEvent, text: string) {
  const { Button, Text } = $.ui.resolve(e)
  return (
    <Button key="limits" label={text} onPress={() => void toggleLimits($)}>
      <Text color={ACCOUNT_COLOR}>{text}</Text>
    </Button>
  )
}

// The open line, its numbers coloured by what is left (labels, `left` and `·` stay plain), then a red Close. A nested
// Text, so the terminal wraps the line as ONE text; Close beside it in a row (a Button cannot sit inside a Text).
export function limitsRow($: EngineInterface, e: RenderEvent, view: LimitsView, email: string | undefined) {
  const line = limitsText(view, email)
  if (line === undefined) return null
  const { Box, Button, Text } = $.ui.resolve(e)
  const body = view.value === undefined // `limitsText` returns `limitsLine(view.value)` whenever there is a value
    ? <Text dimColor>{line}</Text>
    : <Text>{limitsParts(view.value).map(p => (p.left === undefined ? p.text : <Text color={limitColor(p.left)}>{p.text}</Text>))}</Text>
  return (
    <Box columnGap={LIMITS_GAP}>
      {body}
      <Button key="limits-close" label={LIMITS_CLOSE_LABEL} onPress={() => void closeLimits($)}>
        <Text color={CLOSE_COLOR}>{LIMITS_CLOSE_LABEL}</Text>
      </Button>
    </Box>
  )
}
