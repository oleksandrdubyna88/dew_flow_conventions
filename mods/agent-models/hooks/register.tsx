import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Account, AgentRow, LimitsView, Login, Tasks, Viewer } from '../types'
import {
  accountLabel, ACTIVE, BUTTON_COLOR, capNote, clampIndex, CLOSE_COLOR, closeViewer, currentAccount, currentPrompts, currentViewer,
  isAccountFresh, isAccountReading, isLoginPending, LOG_NOTE, LOGIN_CEILING_MS, LOGIN_COLOR, movePage, nowOrZero, openViewer, readAccount,
  readAccountOnDraw, reasonLine, refusalNote, retryAccount, settledLogin, textRows, toRow, VIEWER_NOTE, viewerFixedRows,
} from './prompts'
import { accountButton, currentLimits, emailOf, isLimitsShown, limitsClock, limitsRow, limitsText, tickLimits, watchLimitsMinute } from './limits'
import { closeTasks, currentTasks, tasksButton, tasksView } from './tasks'

const models = atom({ plugin: 'agent-models', key: 'models' } as const, {} as Record<string, string>)
const rows = atom({ plugin: 'agent-models', key: 'rows' } as const, [] as AgentRow[])
const login = atom({ plugin: 'agent-models', key: 'login' } as const, {} as Login)
const REFRESH_MS = 2000
const MAX_MODELS = 200

// Never rejects: a failure anywhere in the body (the list, a state read, a state write) leaves the rows as they
// were and the next tick tries again. The timer and a spawn both call it without anyone to handle a rejection.
const refresh = async ($: EngineInterface): Promise<void> => {
  try {
    const agents = await $.agent.list()
    const known = await read($, models)
    const next = agents.filter(a => ACTIVE.has(a.status)).map(a => toRow(a, known))
    const before = await read($, rows)
    if (JSON.stringify(before) !== JSON.stringify(next)) {
      await update($, rows, () => next)
    }
  } catch {
    // the session is not bound yet, or a state call was refused; the next tick tries again
  }
}

// The 2 s timer's work: the agent rows, the limits line (its minute, a passed reset's fetch) and the account retry (an unread or
// stale unknown account is read again without a draw or a turn). Each never rejects.
const tick = async ($: EngineInterface): Promise<void> => {
  await Promise.all([refresh($), tickLimits($), retryAccount($)])
}

// Reads when the last read is 60 s old; also repairs a login left pending past its ceiling.
const refreshAccountIfStale = async ($: EngineInterface): Promise<void> => {
  try {
    const now = await nowOrZero($)
    const stuck = await read($, login)
    if (stuck.startedAt !== undefined && !isLoginPending(stuck, now)) {
      await update($, login, l => settledLogin(l))
    }
    if (!isAccountFresh(await currentAccount($), now)) {
      await readAccount($)
    }
  } catch {
    // the next turn tries again
  }
}

// This module's one live login attempt. A hot reload drops it while `login.startedAt` stays in state: a stale pending.
let live: { id: number; timer?: Timer } | undefined
const endLive = (id: number): void => {
  if (live?.id === id) {
    live.timer?.cancel()
    live = undefined
  }
}

// Ends attempt `id`; one read per settle. An attempt that is not the state's pending one (an older one, or already
// settled) changes no state; a command that RESOLVES late still reads once (the login may have finished), but the
// ceiling and a rejection never read late. Only the attempt's own live record and timer are ended, never a newer one's.
const settleLogin = async ($: EngineInterface, id: number, reason?: string, isCeiling = false): Promise<void> => {
  try {
    endLive(id)
    const current = await read($, login)
    if (current.attempt !== id || current.startedAt === undefined) {
      if (reason === undefined && !isCeiling) {
        await readAccount($)
      }
      return
    }
    await update($, login, l => settledLogin(l, reason))
    await readAccount($)
  } catch {
    // the state is refused; a later turn repairs a stuck login (refreshAccountIfStale)
  }
}

// The press: the built-in /login does everything; its result is discarded unread. Never awaits the login itself.
// `isStarting` (set before the first await) makes two presses that begin together run /login once. Pending in state
// with no live attempt here is a reload's leftover: it is replaced, never waited for.
let isStarting = false
const startLogin = async ($: EngineInterface): Promise<void> => {
  if (isStarting) {
    return
  }
  isStarting = true
  const mine: { id: number; timer?: Timer } = { id: 0 }
  try {
    const now = await $.clock.now()
    const current = await read($, login)
    if (live !== undefined && isLoginPending(current, now)) {
      return
    }
    live?.timer?.cancel() // a previous attempt's timer, if one is left
    mine.id = (current.attempt ?? 0) + 1
    live = mine
    await update($, login, () => ({ attempt: mine.id, startedAt: now })) // also clears the last refusal
    $.command.run({ command: 'login' }).then(
      () => settleLogin($, mine.id),
      (error: unknown) => settleLogin($, mine.id, reasonLine(error)),
    )
    mine.timer = $.clock.after(LOGIN_CEILING_MS, () => void settleLogin($, mine.id, undefined, true))
  } catch (error) {
    endLive(mine.id)
    await update($, login, l => settledLogin(l, reasonLine(error))).catch(() => undefined)
  } finally {
    isStarting = false
  }
}

type RenderEvent = Parameters<EngineInterface['ui']['resolve']>[0]

const agentRows = ($: EngineInterface, list: readonly AgentRow[], e: RenderEvent) => {
  const { Box, Text } = $.ui.resolve(e)
  return list.map(r => (
    <Box key={r.id}>
      <Text dimColor>{r.status === 'running' ? '● ' : '○ '}</Text>
      <Text wrap="truncate-end">{r.label}</Text>
      <Text dimColor> · {r.type} · </Text>
      <Text color="cyan">{r.model}</Text>
    </Box>
  ))
}

const openButton = ($: EngineInterface, e: RenderEvent, isLoading = false) => {
  const { Button, Text } = $.ui.resolve(e)
  return (
    <Button key="my-messages" label="messages" dimColor={isLoading} onPress={() => void openViewer($, () => closeTasks($))}>
      <Text color={BUTTON_COLOR}>messages</Text>
    </Button>
  )
}

// The viewer's line under the agent rows when there is nothing to page through.
const statusRow = ($: EngineInterface, e: RenderEvent, view: Viewer) => {
  const { Box, Text } = $.ui.resolve(e)
  return (
    <Box>
      {openButton($, e, view.isLoading)}
      {view.isLoading ? (
        <Text dimColor> Loading messages…</Text>
      ) : view.isFailed ? (
        <Text color="red"> Could not read this session&apos;s messages.</Text>
      ) : (
        <Text dimColor> No messages yet</Text>
      )}
    </Box>
  )
}

// First and Prev are dim on the first message, Next and Last on the last (all four when there is one).
const pageButtons = ($: EngineInterface, e: RenderEvent, index: number, n: number) => {
  const { Box, Button, Text } = $.ui.resolve(e)
  const atStart = index === 0
  const atEnd = index === n - 1
  return (
    <Box>
      <Button key="first" label="⏮ First" dimColor={atStart} onPress={() => void movePage($, () => 0)} />
      <Button key="prev" label="◀ Prev" dimColor={atStart} onPress={() => void movePage($, i => i - 1)} />
      <Button key="next" label="Next ▶" dimColor={atEnd} onPress={() => void movePage($, i => i + 1)} />
      <Button key="last" label="Last ⏭" dimColor={atEnd} onPress={() => void movePage($, (_, n) => n - 1)} />
      <Button key="close" label="Close" role="dismiss" onPress={() => void closeViewer($)}>
        <Text color={CLOSE_COLOR}>Close</Text>
      </Button>
    </Box>
  )
}

type Page = {
  view: Viewer
  texts: readonly string[]
  agentCount: number
  props: { maxRows: number; bodyColumns: number }
  account: Account
  login: Login
  isLoginPending: boolean
  tasks: Tasks
  limits: LimitsView
  limitsNow: number | null // the draw's clock read for the open limits line; null when none was asked or it was refused
}

// The prompt is drawn whole; the band scrolls a taller tree itself, so the header only says so.
const pageRows = ($: EngineInterface, e: RenderEvent, page: Page) => {
  const { Box, Text } = $.ui.resolve(e)
  const { view, texts, agentCount, props } = page
  const index = clampIndex(view.index, texts.length)
  const prompt = texts[index] ?? ''
  const note = view.isFromLog ? LOG_NOTE : VIEWER_NOTE
  const fixed = viewerFixedRows(props.bodyColumns, view.isCapped, page.login.reason, limitsText(page.limits, emailOf(page.account), page.limitsNow), note)
  const used = agentCount + fixed + textRows(prompt, props.bodyColumns)
  const more = used > props.maxRows ? ' (scroll for more)' : ''
  return (
    <Box flexDirection="column">
      <Text bold color={BUTTON_COLOR}>{`Message ${index + 1} / ${texts.length}${more}`}</Text>
      {pageButtons($, e, index, texts.length)}
      <Text dimColor>{note}</Text>
      {view.isCapped && <Text dimColor>{capNote}</Text>}
      <Text wrap="wrap">{prompt}</Text>
    </Box>
  )
}

// The account row: [ messages ]  <account>  [ login ]  [ tasks (n) ] while the viewer is closed (`lead` is the messages
// button), <account>  [ login ]  [ tasks (n) ] above an open viewer. The signed-in <account> is a button: a press opens the
// limits line under the row (its numbers coloured by what is left, with a red Close beside it). Then the last login refusal, and the tasks view (never drawn beside the viewer: each opener
// closes the other).
const accountRow = ($: EngineInterface, e: RenderEvent, page: Page, lead?: ReturnType<typeof openButton>) => {
  const { Box, Button, Text } = $.ui.resolve(e)
  const { text, isKnown } = accountLabel(page.account) // the whole email: the band wraps, it never cuts
  return (
    <Box flexDirection="column">
      <Box>
        {lead ?? null}
        {lead ? <Text>{'  '}</Text> : null}
        {isKnown ? accountButton($, e, text) : <Text dimColor>{text}</Text>}
        <Text>{'  '}</Text>
        <Button key="login" label="login" dimColor={page.isLoginPending} onPress={() => void startLogin($)}>
          <Text color={LOGIN_COLOR}>login</Text>
        </Button>
        {page.isLoginPending && <Text dimColor>{' logging in…'}</Text>}
        <Text>{'  '}</Text>
        {tasksButton($, e, page.tasks, () => closeViewer($))}
      </Box>
      {limitsRow($, e, page.limits, emailOf(page.account), page.limitsNow)}
      {page.login.reason !== undefined && <Text dimColor>{refusalNote(page.login.reason)}</Text>}
      {page.tasks.isOpen && !page.view.isOpen ? tasksView($, e, page.tasks) : null}
    </Box>
  )
}

const viewerRows = ($: EngineInterface, e: RenderEvent, page: Page) => {
  if (!page.view.isOpen) {
    return accountRow($, e, page, openButton($, e))
  }
  const { Box, Text } = $.ui.resolve(e)
  const isStatus = page.view.isLoading || page.view.isFailed || page.texts.length === 0
  return (
    <Box flexDirection="column">
      {accountRow($, e, page)}
      {isStatus ? statusRow($, e, page.view) : pageRows($, e, page)}
      {isStatus && page.view.isFromLog && !page.view.isLoading ? <Text dimColor>{LOG_NOTE}</Text> : null}
    </Box>
  )
}

export const register: Register = on => {
  let ticking: Timer | undefined // the refresh timer the session start made; a reload starts a fresh scope
  // The timer a draw made when no session start had (a resume). Only `$.state.set` is documented as refused while drawing, so a draw's
  // `clock.every` may be refused (a Timer that never fires): the session start then replaces it instead of trusting it.
  let drawTicking: Timer | undefined
  // The newest hook's refresh. The engine refuses a module that assigns `$` itself, and lets it be passed only to
  // a function declared at the top of the file, so the timer holds this thunk, which refreshes with the `$` of the
  // newest hook that ran, never the `$` of the hook that started the timer.
  let refreshNow: (() => Promise<void>) | undefined

  on('session.start', async ($, e, next) => {
    refreshNow = () => tick($)
    const result = await next(e)
    if (ticking === undefined) {
      drawTicking?.cancel()
      drawTicking = undefined
      ticking = $.clock.every(REFRESH_MS, () => {
        void refreshNow?.().catch(() => undefined)
      })
    }
    if (!isAccountReading()) {
      void readAccount($) // not awaited: the session starts as fast as before; a read already running (the draw's) is not queued twice
    }
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId === undefined) {
      void refreshAccountIfStale($) // a subagent's end never reads
    }
    return result
  })

  on('agent.spawn', async ($, e, next) => {
    refreshNow = () => tick($)
    const result = await next(e)
    if (!result.deny && result.agentId) {
      const id = result.agentId
      const model = result.model
      // Display only: a failure here must never fail the spawn itself.
      await update($, models, old => {
        const kept = Object.entries(old).slice(-(MAX_MODELS - 1))
        return { ...Object.fromEntries(kept), [id]: model }
      })
        .then(() => refresh($))
        .catch(() => undefined)
    }
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    refreshNow = () => tick($)
    if (ticking === undefined && drawTicking === undefined) {
      drawTicking = $.clock.every(REFRESH_MS, () => {
        void refreshNow?.().catch(() => undefined)
      }) // a session that draws without a session.start (a resume) still ticks
    }
    if (e.props.hasSurvey) {
      return next(e)
    }
    const below = await next(e) // the rest of the chain draws under our band, never instead of it
    const [list, view, acc, state, taskList, limitsView] = await Promise.all([
      read($, rows),
      currentViewer($),
      currentAccount($),
      read($, login),
      currentTasks($),
      currentLimits($),
    ])
    const texts = view.isOpen ? await currentPrompts($) : [] // the prompts of a whole session are read only while they are shown
    void readAccountOnDraw($, acc) // not awaited: a draw is never delayed; it reads only an unread or a stale unknown account
    // The open limits line draws a time that runs down: it reads `limitsMinute`, so the tick's write of a new minute draws the band
    // again. A closed line does not. One clock read serves both needs, a pending login and the shown line; an idle frame asks none.
    const isShown = isLimitsShown(limitsView, emailOf(acc))
    if (isShown) await watchLimitsMinute($)
    const clock = isShown || state.startedAt !== undefined ? await limitsClock($) : null // null: not asked, or refused
    const now = state.startedAt === undefined ? 0 : (clock ?? 0) // the login's check: a refused clock reads 0 (as `nowOrZero`)
    const limitsNow = isShown ? clock : null // the line's own rule: a refused clock is a dash, never a time from 0
    const page = {
      view,
      texts,
      agentCount: list.length,
      props: e.props,
      account: acc,
      login: state,
      isLoginPending: isLoginPending(state, now),
      tasks: taskList,
      limits: limitsView,
      limitsNow,
    }
    const { Box } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {agentRows($, list, e)}
        {viewerRows($, e, page)}
        {below ? below : null}
      </Box>
    )
  })
}
