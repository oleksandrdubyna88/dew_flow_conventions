// The prompt filter and the messages viewer's state with its two roads (the session log read by EXTRACT, and the
// transcript), the account decisions and the account read (what the band says about the signed-in account), and the
// band's colours. The tasks list is hooks/tasks.tsx and the limits line hooks/limits.tsx. A
// file the installer copies is a row of MOD_FILES (settings/hooks/lib/agent-models-decide.mjs); a file added after the
// first release also needs its INTRODUCED entry there.
import { atom, read, update } from 'claude-code'
import type { AgentInfo, EngineInterface, ProcessRunResult, SessionIdentity, SessionMessage, Timer } from 'claude-code'

import type { Account, AgentRow, Login, Viewer } from '../types'

// The engine's scan reads `read($, x)` only for an atom written in the same file, so another file reads this one through
// `currentAccount` (measured 2026-11-10: an imported atom in `read` fails at load).
const account = atom({ plugin: 'agent-models', key: 'account' } as const, { kind: 'unread' } as Account)

export async function currentAccount($: EngineInterface): Promise<Account> {
  return read($, account)
}

/** A user row that STARTS with one of these (after stripping) is the engine's, not the person's. Measured 2026-11-10. */
export const WRAPPER_TAGS = ['task-notification', 'command-name', 'command-message', 'command-args',
  'local-command-stdout', 'local-command-caveat'] as const
/** Blocks removed from a row like reminders; what is left is kept (an IDE block rides on the person's prompt). */
export const STRIPPED_TAGS = ['system-reminder', 'ide_opened_file'] as const
export const ENTRY_CAP = 4096 // $.session.messages() returns the newest 4096 entries

const LEADING_TAG = /^<([a-z][a-z0-9_-]*)>/

// Removes each <tag>…</tag> span: the first closer after an opener ends it. An opener with no later closer stays
// as text and ends that tag's scan. Two indexOf calls per span keep it linear (a backreference regex did not).
const stripTag = (text: string, tag: string): string => {
  const open = `<${tag}>`
  const close = `</${tag}>`
  let out = ''
  let from = 0
  for (;;) {
    const start = text.indexOf(open, from)
    const end = start === -1 ? -1 : text.indexOf(close, start + open.length)
    if (end === -1) {
      return out + text.slice(from)
    }
    out += text.slice(from, start)
    from = end + close.length
  }
}

const stripBlocks = (text: string): string => STRIPPED_TAGS.reduce(stripTag, text)

const isWrapper = (text: string): boolean => {
  const tag = LEADING_TAG.exec(text)?.[1]
  return tag !== undefined && (WRAPPER_TAGS as readonly string[]).includes(tag)
}

const isPersonRow = (m: SessionMessage): boolean =>
  m.role === 'user' && (m.toolResults?.length ?? 0) === 0

/** The one clean-up of both roads: reminders and IDE blocks out, trimmed, empty rows and engine wrappers dropped. */
export function cleanPrompts(texts: readonly string[]): string[] {
  return texts.map(text => stripBlocks(text).trim()).filter(text => text !== '' && !isWrapper(text))
}

/** What the person typed, oldest first: the user rows without tool results, engine wrappers and reminders. */
export function personPrompts(messages: readonly SessionMessage[]): string[] {
  return cleanPrompts(messages.filter(isPersonRow).map(m => m.text))
}

/** The rows a text takes when each line wraps at `columns`. */
export function textRows(text: string, columns: number): number {
  const width = Math.max(1, columns)
  return text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / width)), 0)
}

/** An index kept inside a list of `n` entries; 0 when the list is empty. */
export const clampIndex = (i: number, n: number): number => (n === 0 ? 0 : Math.max(0, Math.min(i, n - 1)))

export const ACTIVE = new Set(['pending', 'running', 'waiting'])

const shortModel = (model: string | undefined): string =>
  model ? model.replace(/^claude-/, '').replace(/\[1m\]$/, ' 1M') : 'model ?'

/** One band row for a running agent; `known` maps agent ids to the model the spawn hook saw. */
export const toRow = (agent: AgentInfo, known: Record<string, string>): AgentRow => ({
  id: agent.id,
  label: agent.name ?? agent.description,
  type: agent.type,
  status: agent.status,
  model: shortModel(known[agent.id]),
})

// --- the account label: pure, so a test calls them directly ---

export const ACCOUNT_COLOR = '#f97316' // the email
export const LOGIN_COLOR = '#22c55e' // the login button's text
export const BUTTON_COLOR = '#a855f7' // the messages button's text
export const CLOSE_COLOR = '#ef4444' // the Close button's text
export const TASKS_COLOR = '#3b82f6' // the tasks button's text and the tasks header (blue)
export const STATUS_ARGV = ['claude', 'auth', 'status', '--json'] as const
export const STATUS_TIMEOUT_MS = 10_000 // measured 0.19 s; 10 s covers a cold, loaded VM
export const IDENTITY_TIMEOUT_MS = 5_000 // `$.session.identity()` makes no request and answers at once; past this the read goes on to the status run (1.4.0)
export const READ_CEILING_MS = 30_000 // identity 5 s + status 10 s + margin: a whole read ends by then, whatever hangs (1.4.0)
export const READ_INTERVAL_MS = 60_000 // a turn.complete reads again only past this
export const LOGIN_CEILING_MS = 10 * 60_000
const REASON_MAX = 160
// Exactly two fields of the status output, or null unless stdout is ONE JSON object with a boolean loggedIn. The
// parsed value is a local that dies here: nothing else of it (tokens, org ids, paths) is read or returned.
export function parseStatus(stdout: string): { loggedIn: boolean; email: string | undefined } | null {
  let value: unknown
  try {
    value = JSON.parse(stdout)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const fields = value as { loggedIn?: unknown; email?: unknown }
  if (typeof fields.loggedIn !== 'boolean') {
    return null
  }
  const email = typeof fields.email === 'string' && fields.email.trim() !== '' ? fields.email.trim() : undefined
  return { loggedIn: fields.loggedIn, email }
}

// The label a FINISHED status run gives; the first match wins. A non-zero exit is never parsed.
export function accountFromStatus(result: ProcessRunResult, readAt: number): Account {
  if (result.exitCode !== 0) {
    return { kind: 'unknown', suffix: `claude exited ${result.exitCode}`, readAt }
  }
  const parsed = result.isStdoutTruncated ? null : parseStatus(result.stdout)
  if (parsed === null) {
    return { kind: 'unknown', suffix: 'unreadable status', readAt }
  }
  if (!parsed.loggedIn) {
    return { kind: 'signed-out', readAt }
  }
  return parsed.email === undefined
    ? { kind: 'unknown', suffix: 'no email reported', readAt }
    : { kind: 'signed-in', email: parsed.email, readAt }
}

// The label a status run that REJECTED gives. ProcessRunResult carries no timeout flag (a timeout is a rejection the
// engine types no further), so only the codes Node gives a timed-out child count; a message that merely says
// "timeout" (a proxy, a plugin) is not a signal.
export function accountFromFailure(error: unknown, readAt: number): Account {
  const code = typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined
  const message = error instanceof Error ? error.message : ''
  if (code === 'ENOENT' || message.includes('ENOENT')) {
    return { kind: 'unknown', suffix: 'claude not on PATH', readAt }
  }
  if (code === 'ETIMEDOUT' || code === 'ERR_CHILD_PROCESS_TIMEOUT') {
    return { kind: 'unknown', suffix: 'timed out', readAt }
  }
  return { kind: 'unknown', suffix: 'unreadable status', readAt }
}

// The email an identity answer carries; undefined on `{ deny }` or an empty field.
export function identityEmail(identity: SessionIdentity): string | undefined {
  const email = identity.email?.trim()
  return email ? email : undefined
}

export const isLoginPending = (state: Login, now: number): boolean =>
  state.startedAt !== undefined && now - state.startedAt < LOGIN_CEILING_MS

export const isAccountFresh = (acc: Account, now: number): boolean =>
  acc.kind !== 'unread' && now - acc.readAt < READ_INTERVAL_MS

/** The login state once an attempt ends: the counter stays, `startedAt` goes, `reason` is set only on a refusal. */
export const settledLogin = (state: Login, reason?: string): Login => ({
  ...(state.attempt === undefined ? {} : { attempt: state.attempt }),
  ...(reason === undefined ? {} : { reason }),
})

const UNKNOWN_REASON = 'unknown reason \u2014 run /login directly'
// Escape sequences first (CSI, then OSC ended by BEL or ESC \, then any other two-byte escape), then every control
// character: what is left is printable text. Done before the cut, so the cut never lands inside a sequence.
const ESCAPES = /\u001b\[[0-?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?|\u001b[@-_]/g
const CONTROLS = /[\u0000-\u001f\u007f-\u009f]/g

// One line for the band: the first line of the message with any text left once the escapes and control characters
// are gone (a tab becomes a space), trimmed, cut at REASON_MAX.
export function reasonLine(error: unknown, fallback: string = UNKNOWN_REASON): string {
  const raw = (error instanceof Error ? error.message : String(error)).replace(ESCAPES, '')
  for (const part of raw.split('\n')) {
    const line = part.replace(/\t/g, ' ').replace(CONTROLS, '').trim()
    if (line !== '') {
      return line.slice(0, REASON_MAX)
    }
  }
  return fallback
}

/** What the band says of the account; `isKnown` only for a signed-in email (the one orange text). */
export function accountLabel(acc: Account): { text: string; isKnown: boolean } {
  if (acc.kind === 'signed-in') {
    return { text: acc.email, isKnown: true }
  }
  if (acc.kind === 'signed-out') {
    return { text: 'not signed in', isKnown: false }
  }
  return { text: acc.kind === 'unknown' && acc.suffix ? `account ? (${acc.suffix})` : 'account ?', isKnown: false }
}

// --- the rows the open viewer draws besides the agent rows and the prompt (measured from its tree, 2026-11-10) ---

export const VIEWER_NOTE =
  'From the transcript: after a compaction early prompts may be a summary; prompts typed while a turn ran are not listed.'
export const capNote = `Only the newest ${ENTRY_CAP} transcript entries are read; older messages are not shown.`
export const refusalNote = (reason: string): string => `login could not start: ${reason}`
export const LIMITS_CLOSE_LABEL = 'Close'
export const LIMITS_GAP = 2 // the limits row's columnGap
// The limits line wraps BESIDE its Close button: the terminal Button is a Box that never shrinks (`[ Close ]`, 9 cells).
const LIMITS_CLOSE_CELLS = `[ ${LIMITS_CLOSE_LABEL} ]`.length + LIMITS_GAP
const FIXED_ROWS = 3 // the account row, the header and the page buttons; every note below is counted at its wrapped height

/** Rows of the open viewer beside the agent rows and the prompt: the three fixed rows and each note, wrapped at `columns`; the open limits line is counted beside its Close button, which never shrinks. */
export function viewerFixedRows(columns: number, isCapped: boolean, reason: string | undefined, limitsText?: string, note: string = VIEWER_NOTE): number {
  return (
    FIXED_ROWS +
    (limitsText === undefined ? 0 : textRows(limitsText, Math.max(1, columns - LIMITS_CLOSE_CELLS))) +
    textRows(note, columns) +
    (isCapped ? textRows(capNote, columns) : 0) +
    (reason === undefined ? 0 : textRows(refusalNote(reason), columns))
  )
}

// A refused clock reads as 0: the throttle then reads sooner (the safe direction).
export async function nowOrZero($: EngineInterface): Promise<number> {
  try {
    return await $.clock.now()
  } catch {
    return 0
  }
}

// The email of `$.session.identity()`; undefined on a deny, a failure or the ceiling (IDENTITY_TIMEOUT_MS: the read then goes on to
// the status run, so a signed-in session still shows its email). The abandoned call's late answer or failure is never used, and a
// `.catch` keeps its failure from being an unhandled rejection. A refused `$.clock.after` never runs its callback (it does not throw):
// the call then has no ceiling, as in 1.3.3.
async function identityOrCeiling($: EngineInterface): Promise<string | undefined> {
  const asked = (async () => identityEmail(await $.session.identity()))()
  asked.catch(() => undefined)
  let timer: Timer | undefined
  const ceiling = new Promise<undefined>(resolve => {
    try {
      timer = $.clock.after(IDENTITY_TIMEOUT_MS, () => resolve(undefined))
    } catch {
      // no ceiling: the identity answer decides
    }
  })
  try {
    return await Promise.race([asked, ceiling])
  } catch {
    return undefined
  } finally {
    timer?.cancel()
  }
}

// One read; keeps two fields of the answer (parseStatus), no stdout, log or toast. Never rejects. `gen` is the read's number: when it is
// no longer the live one (the ceiling abandoned this read) nothing more is asked and nothing is written. `pass` numbers one pass of the
// flight's loop: once its state write has BEGUN the ceiling no longer abandons it (its result is landing, see readAccount).
export async function readOnce($: EngineInterface, gen: number, pass: number): Promise<void> {
  let next: Account
  try {
    const email = await identityOrCeiling($)
    if (gen !== generation) return
    if (email !== undefined) {
      next = { kind: 'signed-in', email, readAt: await nowOrZero($) }
    } else {
      try {
        const result = await $.process.run(STATUS_ARGV, { timeoutMs: STATUS_TIMEOUT_MS })
        next = accountFromStatus(result, await nowOrZero($))
      } catch (error) {
        next = accountFromFailure(error, await nowOrZero($))
      }
    }
    if (gen !== generation) return
    writeBegun = pass
    await update($, account, cur => (gen === generation ? next : cur)) // the check again: a newer read may have started during the write
  } catch {
    // a refused state write: the next trigger writes again
  }
}

// Single flight: a call during a read asks for exactly one more read, started after the call. Never rejects.
// 1.4.0: a read has a ceiling (READ_CEILING_MS), so a hung call never holds the flight for the session. On the ceiling `generation`
// moves on (the abandoned read's late result writes nothing) — except for a pass whose state write has already BEGUN: that pass is
// landing, keeps its generation, and its late write is accepted (the write is `update`, which on a version miss reads the state again and
// runs the updater again, so a write held past a newer read's result is dropped by its own generation check and never replaces it).
// `inFlight` is cleared FIRST (before any await: the state write below can
// hang too), the account says `read timed out`, and a read queued meanwhile starts at once. Known limits: a timer is a clock dispatch, so
// with `$.clock.after` refused the ceilings never fire and the read is as in 1.3.3; a hot reload cancels the old environment's timers, so
// an old read in flight then has no ceiling and its late answer (a real answer) can still be written; each abandoned read leaves at most
// one unsettled `identity()` promise, and the retry starts at most one a minute.
let generation = 0 // the live read's number
let passes = 0 // the number of the last pass of any flight
let writeBegun = 0 // the pass whose state write began last
let inFlight: Promise<void> | undefined
let again = false
export const isAccountReading = (): boolean => inFlight !== undefined

// A read that ends, or false when the ceiling came first. `readOnce` never rejects.
async function readWithCeiling($: EngineInterface, gen: number, pass: number): Promise<boolean> {
  let timer: Timer | undefined
  const ceiling = new Promise<false>(resolve => {
    try {
      timer = $.clock.after(READ_CEILING_MS, () => resolve(false))
    } catch {
      // no ceiling, as in 1.3.3
    }
  })
  try {
    return await Promise.race([readOnce($, gen, pass).then(() => true as const), ceiling])
  } finally {
    timer?.cancel()
  }
}

export function readAccount($: EngineInterface): Promise<void> {
  if (inFlight) {
    again = true
    return inFlight
  }
  const gen = ++generation
  retryTicks = 0 // the tick retries a full minute after the last read, whoever started it
  inFlight = (async () => {
    try {
      do {
        again = false
        const pass = ++passes
        if (!(await readWithCeiling($, gen, pass))) {
          inFlight = undefined // FIRST: nothing below may keep the flight, and the writes below can hang
          const queued = again
          again = false
          const isLanding = writeBegun === pass // this pass's own state write has begun: its result is landing
          // A landing result keeps its generation, so its updater still accepts it (a state read held across the ceiling does not lose
          // it) unless a newer read starts, whose own result then replaces it; the ceiling writes nothing over it. Otherwise the hung read is abandoned.
          const mine = isLanding ? generation : ++generation
          if (queued) void readAccount($) // before any await; its own generation makes the write below skip
          if (isLanding) return
          const timedOut: Account = { kind: 'unknown', suffix: 'read timed out', readAt: await nowOrZero($) }
          if (generation === mine) {
            // only an account that is not known (change 1.1: a signed-in or signed-out one is KEPT) and not replaced by a newer read
            await update($, account, cur => (generation === mine && (cur.kind === 'unread' || cur.kind === 'unknown') ? timedOut : cur))
          }
          return
        }
      } while (again)
    } catch {
      // a refused state write: the next trigger writes again
    } finally {
      if (generation === gen) inFlight = undefined // not after the ceiling: a newer flight may be the one in `inFlight`
    }
  })()
  return inFlight
}

// The draw's own read (1.3.2): an unread account is read when the band draws it, so a resumed or hot-loaded session shows
// the email before its first turn ends. 1.4.0: an unknown account older than READ_INTERVAL_MS is read the same way. The 2 s tick
// does not call this (retryAccount has its own count): an idle band is not left on `account ?`. A signed-in or signed-out account is never read here.
// Never while a read is in flight (readAccount would QUEUE one more), and at most one read started here per READ_INTERVAL_MS: the
// stamp is set before the read starts, so a refused state write costs one read a minute, never one per frame. With `$.clock.now`
// refused, `nowOrZero` gives 0 and this throttle can block for ever; the tick's own retry does not depend on it. Never rejects; the
// caller does not await it.
let drawReadAt: number | undefined
export async function readAccountOnDraw($: EngineInterface, acc: Account): Promise<void> {
  if (inFlight !== undefined || (acc.kind !== 'unread' && acc.kind !== 'unknown')) return
  const now = await nowOrZero($)
  if (isAccountFresh(acc, now)) return // an unknown account within a minute of its read (an unread one is never fresh)
  if (inFlight !== undefined || (drawReadAt !== undefined && now - drawReadAt < READ_INTERVAL_MS)) return
  drawReadAt = now // no await between this check and the start: two draws cannot both start a read
  void readAccount($)
}

// The 2 s tick's account retry. It counts its own ticks and asks no clock (the draw's throttle reads `nowOrZero`, which is 0 for every
// call while `$.clock.now` is refused, so it could block for ever): past RETRY_EVERY_TICKS calls since the last read of any kind started
// (about a minute and one tick, so it does not meet the draw's own throttle at the minute) it starts a read when none is running and
// the account is unread or unknown. A signed-in or signed-out account is never read here (no process a minute while idle). Never rejects.
export const RETRY_EVERY_TICKS = 30
let retryTicks = 0 // calls since the last flight started (readAccount sets it to 0)
export async function retryAccount($: EngineInterface): Promise<void> {
  retryTicks += 1
  if (retryTicks <= RETRY_EVERY_TICKS) return
  retryTicks = 0
  if (inFlight !== undefined) return
  try {
    const acc = await currentAccount($)
    if (inFlight === undefined && (acc.kind === 'unread' || acc.kind === 'unknown')) void readAccount($)
  } catch {
    // the next minute tries again
  }
}

// --- the messages viewer: its state, the session log road and the transcript road (1.3.2) ---

export const HISTORY_TIMEOUT_MS = 10_000 // measured 0.22 s on an 8.7 MB log; 10 s covers a cold, loaded VM
export const LOG_NOTE = 'From the session log: every prompt you typed, from the first.'
export const SESSION_ID = /^[A-Za-z0-9-]{8,64}$/

// EXTRACT:BEGIN
export const EXTRACT = String.raw`
// agent-models EXTRACT: prints every prompt the person typed in one session log, oldest first, as ONE JSON array.
// Run as: node -e EXTRACT -- <absolute path ending .jsonl | session id>. After the --, the argument is process.argv[1].
// The mod always passes the session id (1.3.2): the script finds <id>.jsonl under the projects folder. A path is for the tests.
// Exit 0: the array is on stdout (an empty log gives []). Exit 2: no single file for the argument. Exit 1: anything
// else. Nothing is written to stdout unless the whole file was read. No require: it runs as CommonJS or as a module.
const main = async () => {
  const fs = await import('node:fs')
  const os = await import('node:os')
  const path = await import('node:path')
  const readline = await import('node:readline')
  const NL = String.fromCharCode(10)
  const HUMAN = '"human"'
  const OWN = '"agent-models"'
  const SESSION_ID = /^[A-Za-z0-9-]{8,64}$/

  const isFile = file => {
    try {
      return fs.statSync(file).isFile()
    } catch {
      return false
    }
  }

  // The one file to read, or undefined: the path as given, or <id>.jsonl in exactly one folder of <config>/projects.
  const locate = arg => {
    if (arg.endsWith('.jsonl') && path.isAbsolute(arg)) {
      return isFile(arg) ? arg : undefined
    }
    if (!SESSION_ID.test(arg)) {
      return undefined
    }
    const config = process.env.CLAUDE_CONFIG_DIR
    const root = path.join(config ? config : path.join(os.homedir(), '.claude'), 'projects')
    let names = []
    try {
      names = fs.readdirSync(root)
    } catch {
      return undefined
    }
    const found = names.map(name => path.join(root, name, arg + '.jsonl')).filter(isFile)
    return found.length === 1 ? found[0] : undefined
  }

  // A string, or the text blocks of an array joined by a line break; undefined for a tool result or another shape.
  const textOf = content => {
    if (typeof content === 'string') {
      return content
    }
    if (!Array.isArray(content) || content.some(block => block && block.type === 'tool_result')) {
      return undefined
    }
    return content.filter(block => block && block.type === 'text' && typeof block.text === 'string').map(block => block.text).join(NL)
  }

  // The origin of a row the person typed: the human one, or this mod's own (a note sent with Apply is the person's own
  // words, logged with the plugin as its origin). Another plugin's row, a command's, a notification's are not.
  const isTyped = origin => Boolean(origin) && (origin.kind === 'human' || (origin.kind === 'plugin' && origin.name === 'agent-models'))

  // The prompt one line holds, or undefined. A line with neither the text "human" nor the text "agent-models" is never parsed.
  const promptOf = line => {
    if (!line.includes(HUMAN) && !line.includes(OWN)) {
      return undefined
    }
    let row
    try {
      row = JSON.parse(line)
    } catch {
      return undefined
    }
    if (row === null || typeof row !== 'object' || row.isSidechain === true) {
      return undefined
    }
    if (row.type === 'user') {
      return isTyped(row.origin) && row.isMeta !== true && row.isCompactSummary !== true ? textOf(row.message && row.message.content) : undefined
    }
    const queued = row.type === 'attachment' ? row.attachment : undefined
    const isPrompt = queued && queued.type === 'queued_command' && queued.commandMode === 'prompt' && queued.origin && queued.origin.kind === 'human'
    return isPrompt ? textOf(queued.prompt) : undefined
  }

  // Streams the file line by line. A read error rejects, so nothing partial is printed; node 22 raises it on the
  // line reader as well as on the file stream, older releases on the stream only, so both are heard.
  const readPrompts = file => new Promise((resolve, reject) => {
    const out = []
    const input = fs.createReadStream(file)
    const lines = readline.createInterface({ input, crlfDelay: Infinity })
    input.on('error', reject)
    lines.on('error', reject)
    lines.on('line', line => {
      const text = promptOf(line)
      if (text !== undefined) {
        out.push(text)
      }
    })
    lines.on('close', () => resolve(out))
  })

  const file = locate(process.argv[1] === undefined ? '' : String(process.argv[1]))
  if (file === undefined) {
    process.exitCode = 2
    return
  }
  process.stdout.write(JSON.stringify(await readPrompts(file)))
}
main().catch(() => {
  process.exitCode = 1
})`
// EXTRACT:END

export const CLOSED: Viewer = { isOpen: false, index: 0, isCapped: false, isFailed: false, isLoading: false, isFromLog: false }
const viewer = atom({ plugin: 'agent-models', key: 'viewer' } as const, CLOSED)
const prompts = atom({ plugin: 'agent-models', key: 'prompts' } as const, [] as string[])

export async function currentViewer($: EngineInterface): Promise<Viewer> {
  return read($, viewer)
}
export async function currentPrompts($: EngineInterface): Promise<string[]> {
  return read($, prompts)
}

/** The prompts a finished EXTRACT run printed, or undefined unless it is exit 0, whole, and ONE JSON array of strings. */
export function parseExtract(result: ProcessRunResult): string[] | undefined {
  if (result.exitCode !== 0 || result.isStdoutTruncated) {
    return undefined
  }
  let value: unknown
  try {
    value = JSON.parse(result.stdout)
  } catch {
    return undefined
  }
  return Array.isArray(value) && value.every(item => typeof item === 'string') ? (value as string[]) : undefined
}

// The session's id when the engine gives one of the accepted shape; undefined otherwise. Never rejects.
async function sessionId($: EngineInterface): Promise<string | undefined> {
  try {
    const id: unknown = await $.session.id()
    return typeof id === 'string' && SESSION_ID.test(id) ? id : undefined
  } catch {
    return undefined
  }
}

// Known limit: `node` (here) and `claude` (the account read) are found through the session's PATH, and the run changes no directory.
// Written for Linux and macOS VMs; Windows is not tested. A `node` that is not found is a failure of this road: the transcript answers.
// The session log road. The session id goes to EXTRACT, which finds <id>.jsonl itself. There is no stored path: the classic hooks
// that would have carried one were skipped whenever another plugin answered the event first (measured 2026-11-11, claude 2.1.322).
// Undefined on ANY failure, an id of the wrong shape included (no process starts): the caller then reads the transcript as before.
async function logPrompts($: EngineInterface): Promise<string[] | undefined> {
  try {
    const id = await sessionId($)
    if (id === undefined) {
      return undefined
    }
    const texts = parseExtract(await $.process.run(['node', '-e', EXTRACT, '--', id], { timeoutMs: HISTORY_TIMEOUT_MS }))
    return texts === undefined ? undefined : cleanPrompts(texts)
  } catch {
    return undefined
  }
}

// Reads again on every press, so a new prompt appears. The band shows "Loading" until the read ends, and a press
// while it runs is ignored: two reads would race and the later answer would win by luck. `viewerRun` names the read
// that may still write: a close (the tasks button, or Close) ends it, so a read that lands after the person opened
// the tasks view changes nothing and the two views are never open together. `readRun` is the read running in THIS
// module, in memory: the persisted `isLoading` survives a hot reload that killed the read, so it never blocks a press.
let viewerRun = 0
let readRun: number | undefined
const isViewerReading = (): boolean => readRun !== undefined && readRun === viewerRun
export async function closeViewer($: EngineInterface): Promise<void> {
  viewerRun += 1
  await update($, viewer, v => ({ ...v, isOpen: false, isLoading: false }))
}

export async function openViewer($: EngineInterface, closeOther: () => Promise<void>): Promise<void> {
  if (isViewerReading()) {
    return
  }
  const run = ++viewerRun
  readRun = run // no await between the check and this line: two presses that begin together start one read
  try {
    await closeOther() // the two views are never open together
    await update($, viewer, v => (run === viewerRun ? { ...CLOSED, isOpen: true, isLoading: true } : v))
    await readViewer($, run)
  } finally {
    if (readRun === run) {
      readRun = undefined
    }
  }
}

// A log with no prompt beside a transcript that holds some is a host that does not stamp the origin `human`: the
// transcript road answers then, with its own note. A log and a transcript that are both empty stay the log's empty state.
async function readViewer($: EngineInterface, run: number): Promise<void> {
  try {
    let fromLog = await logPrompts($)
    if (run !== viewerRun) {
      return
    }
    let messages: SessionMessage[] = []
    if (fromLog === undefined) {
      messages = await $.session.messages()
    } else if (fromLog.length === 0) {
      messages = await $.session.messages().catch((): SessionMessage[] => [])
      fromLog = personPrompts(messages).length === 0 ? fromLog : undefined
    }
    if (run !== viewerRun) {
      return
    }
    await update($, prompts, () => fromLog ?? personPrompts(messages))
    const shown = { ...CLOSED, isOpen: true, isFromLog: fromLog !== undefined, isCapped: fromLog === undefined && messages.length >= ENTRY_CAP }
    await update($, viewer, v => (run === viewerRun && v.isOpen ? shown : v))
  } catch {
    if (run === viewerRun) {
      await update($, prompts, () => [])
      await update($, viewer, v => (run === viewerRun && v.isOpen ? { ...CLOSED, isOpen: true, isFailed: true } : v))
    }
  }
}

export async function movePage($: EngineInterface, to: (i: number, n: number) => number): Promise<void> {
  const n = (await read($, prompts)).length
  if (n === 0) {
    return
  }
  await update($, viewer, v => ({ ...v, index: clampIndex(to(v.index, n), n) }))
}
