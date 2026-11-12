// The limits behind the email: a press on the signed-in email opens one line,
// `5h 87% left · resets in 1h 23m · week 74% left · Fable 82% left`, read from the usage endpoint the built-in /usage reads.
// The parser is the ONE road in: of the answer only three numbers, the model's label and the 5-hour window's reset time are
// kept; nothing else of the body, no header and not the credential handle is stored, drawn or logged. The endpoint is
// internal and its shape can change without notice: a missing value is a dash, never a zero.
// Each number is drawn in the colour of what is left, and a red Close beside the line shuts it (1.3.3).
// 1.4.0: the reset time is kept as a moment and the text is made at DRAW time, so it counts down while the line is open: the
// 2 s tick writes the drawn minute to `limitsMinute` (at most once a minute), which draws the band again. A passed reset
// makes the tick fetch again (under the one-a-minute throttle), so the old window's numbers do not stay.
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
// The minute the open line drew (null: a dash). The draw reads it only to be drawn again when it changes; the tick writes it.
const limitsMinute = atom({ plugin: 'agent-models', key: 'limitsMinute' } as const, null as number | null)
export const MINUTE_MS = 60_000
export const RESET_GREEN_UNDER = 10 // minutes: under this green, up to RESET_ORANGE_UP_TO orange, over it red
export const RESET_ORANGE_UP_TO = 30

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

// An ISO 8601 moment WITH an offset (`Z` or `±hh:mm`): a string without one would be read as local time.
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/

/** Epoch milliseconds of an ISO 8601 string with an offset; null for anything else. */
export function parseResetsAt(value: unknown): number | null {
  if (typeof value !== 'string' || !ISO_WITH_OFFSET.test(value)) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

/** The three numbers, the label and the reset time from the response text; null unless it is ONE JSON object. The parsed value dies here. */
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
    fiveHourResetsAt: parseResetsAt(field(field(value, 'five_hour'), 'resets_at')),
  }
}

/** Whole minutes from `now` to `resetsAt`; null while either is unknown or the reset has come (`now >= resetsAt`). */
export function minutesLeft(resetsAt: number | null, now: number | null): number | null {
  if (resetsAt === null || now === null || !Number.isFinite(now) || now >= resetsAt) return null
  return Math.floor((resetsAt - now) / MINUTE_MS)
}

/** `1h 23m` from 60 minutes on (`1h 0m`, so the shape never jumps), `59m`, `<1m` under a minute; a dash when unknown. */
export const resetText = (minutes: number | null): string =>
  minutes === null ? '—' : minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : minutes < 1 ? '<1m' : `${minutes}m`

/** The colour of the minutes left, taken on the whole minutes the text shows: under 10 green, 10-30 orange, over 30 red. */
export const resetColor = (minutes: number): string =>
  minutes < RESET_GREEN_UNDER ? LOGIN_COLOR : minutes <= RESET_ORANGE_UP_TO ? ACCOUNT_COLOR : CLOSE_COLOR

/** The colour of a percent LEFT: over 60 green, 10–60 orange, under 10 red; none for a non-finite number. */
export const limitColor = (left: number): string | undefined =>
  !Number.isFinite(left) ? undefined : left > 60 ? LOGIN_COLOR : left < 10 ? CLOSE_COLOR : ACCOUNT_COLOR

// `isValue` only on a value's own part (`69%`, `1h 23m`): it is drawn as a Text of its own, in `color` (none for a non-finite number).
type Part = { text: string; isValue?: true; color?: string }
const segmentParts = (label: string, left: number | null): Part[] =>
  left === null ? [{ text: `${label} —` }] : [{ text: `${label} ` }, { text: `${left}%`, isValue: true, color: limitColor(left) }, { text: ' left' }]
// `resets in 1h 23m`; a dash (bare text, no colour) when the time is unknown, the clock was refused or the reset has come.
const resetParts = (resetsAt: number | null, now: number | null): Part[] => {
  const minutes = minutesLeft(resetsAt, now)
  return minutes === null ? [{ text: 'resets in —' }] : [{ text: 'resets in ' }, { text: resetText(minutes), isValue: true, color: resetColor(minutes) }]
}
// `now` is epoch ms from the draw's own clock read, or null when that was refused.
const limitsParts = (v: Limits, now: number | null): Part[] =>
  [segmentParts('5h', v.fiveHour), resetParts(v.fiveHourResetsAt, now), segmentParts('week', v.week), segmentParts(v.model?.label ?? 'Fable', v.model?.left ?? null)]
    .flatMap((parts, i) => (i === 0 ? parts : [{ text: ' · ' }, ...parts]))

/** The one line: `5h 87% left · resets in 1h 23m · week 74% left · Fable 82% left`; an absent value is a dash with no `% left`. */
export const limitsLine = (v: Limits, now: number | null): string => limitsParts(v, now).map(p => p.text).join('')

/** Whether an open needs a fetch: never fetched, or the last fetch ended LIMITS_INTERVAL_MS or more ago. */
export const isLimitsStale = (view: LimitsView, now: number): boolean =>
  view.fetchedAt === undefined || now - view.fetchedAt >= LIMITS_INTERVAL_MS

/** The email of a signed-in account; undefined while the account is unknown, signed out or unread. */
export const emailOf = (acc: Account): string | undefined => (acc.kind === 'signed-in' ? acc.email : undefined)

/** Whether the line is open for `email` and holds a value: then its text has a time that runs down. */
export const isLimitsShown = (view: LimitsView, email: string | undefined): boolean =>
  view.isOpen && email !== undefined && view.email === email && view.value !== undefined

/** What the open line says at `now`, or undefined while it is closed or the account is not the one the line was opened for. */
export const limitsText = (view: LimitsView, email: string | undefined, now: number | null): string | undefined => {
  if (!view.isOpen || email === undefined || view.email !== email) return undefined
  if (view.value !== undefined) return limitsLine(view.value, now)
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

// The draw's own clock read for the open line: null when the clock is refused or gives no finite number (the line then says a dash).
export async function limitsClock($: EngineInterface): Promise<number | null> {
  try {
    const now = await $.clock.now()
    return Number.isFinite(now) ? now : null
  } catch {
    return null
  }
}

// The draw of an open line reads the minute: that subscribes the band, so a write of it (the tick, below) draws the band again.
export async function watchLimitsMinute($: EngineInterface): Promise<void> {
  await read($, limitsMinute)
}

// The 2 s tick for the limits line. While the line is open with a value (never otherwise: a closed line asks no clock and
// writes nothing): writes the minute the draw would show when it changed, so the time counts down; and when the reset has come
// fetches again, which `needsFetch` holds to one a minute. Never rejects.
export async function tickLimits($: EngineInterface): Promise<void> {
  try {
    const view = await read($, limits)
    const email = emailOf(await currentAccount($))
    if (email === undefined || !isLimitsShown(view, email)) return
    const now = await limitsClock($)
    const resetsAt = view.value?.fiveHourResetsAt ?? null
    const minutes = minutesLeft(resetsAt, now)
    if (now !== null && resetsAt !== null && now >= resetsAt && needsFetch(view, now, email)) void fetchLimits($, email)
    if ((await read($, limitsMinute)) !== minutes) await update($, limitsMinute, () => minutes)
  } catch {
    // a refused state call or clock: the next tick tries again
  }
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

// The open line, its numbers and its reset time coloured (labels, `left`, `resets in` and `·` stay plain), then a red Close. A nested
// Text, so the terminal wraps the line as ONE text; Close beside it in a row (a Button cannot sit inside a Text).
export function limitsRow($: EngineInterface, e: RenderEvent, view: LimitsView, email: string | undefined, now: number | null) {
  const line = limitsText(view, email, now)
  if (line === undefined) return null
  const { Box, Button, Text } = $.ui.resolve(e)
  const body = view.value === undefined // `limitsText` returns `limitsLine(view.value)` whenever there is a value
    ? <Text dimColor>{line}</Text>
    : <Text>{limitsParts(view.value, now).map(p => (p.isValue === undefined ? p.text : <Text color={p.color}>{p.text}</Text>))}</Text>
  return (
    <Box columnGap={LIMITS_GAP}>
      {body}
      <Button key="limits-close" label={LIMITS_CLOSE_LABEL} onPress={() => void closeLimits($)}>
        <Text color={CLOSE_COLOR}>{LIMITS_CLOSE_LABEL}</Text>
      </Button>
    </Box>
  )
}
