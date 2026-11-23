export type AgentRow = {
  id: string
  label: string
  type: string
  status: string
  model: string
}

export type Viewer = {
  isOpen: boolean
  index: number
  isCapped: boolean
  isFailed: boolean
  isLoading: boolean
  /** True when the list came from the session log (the whole history), false when it came from the transcript. */
  isFromLog: boolean
}

/**
 * A suffix that says why the account is unknown; drawn as `account ? (<suffix>)`. `read timed out` (1.4.0): the whole read hit its
 * 30 s ceiling; `timed out` is the status run's own timeout.
 */
export type AccountSuffix =
  | 'claude not on PATH'
  | 'timed out'
  | 'read timed out'
  | 'unreadable status'
  | 'no email reported'
  | `claude exited ${number}`

/** What the band knows of the signed-in account. `readAt`: `$.clock.now()` when that read ENDED. */
export type Account =
  | { kind: 'unread' }
  | { kind: 'unknown'; suffix: AccountSuffix | undefined; readAt: number }
  | { kind: 'signed-out'; readAt: number }
  | { kind: 'signed-in'; email: string; readAt: number }

/**
 * The login button. `attempt` counts the attempts and is never cleared (an attempt's identity); `startedAt` is set while the
 * attempt has not settled and serves only for elapsed time; `reason` is the last refusal.
 */
export type Login = { attempt?: number; startedAt?: number; reason?: string }

/** One note of the tasks list; `id` is unique in the session and never reused: the key of its row's buttons. */
export type Task = { id: number; text: string }

/**
 * The session's tasks list (one per session: `$.state`, survives a hot reload, not a new session). `nextId` is the id the
 * next note gets; `draft` what the add field draws (the refused text, the text kept when the view closes; '' after an add;
 * typing alone writes nothing, the text typed so far lives in memory); `editing` the note whose row is an edit field and
 * the text that field draws; `note` the one dim line (a refusal), cleared by the next action (typing does not clear it);
 * `isSending` while an Apply's submit has not settled, `sendingId` the note it is sending (only Apply writes either).
 */
export type Tasks = {
  isOpen: boolean
  items: Task[]
  nextId: number
  draft: string
  editing?: { id: number; draft: string }
  note?: string
  isSending: boolean
  sendingId?: number
}

/**
 * What the mod keeps of the usage answer: three "% left" numbers (0-100, whole), the server's label, the moment the 5-hour window
 * resets (1.4.0) and the moment the weekly window resets (1.5.0). NOTHING else.
 */
export type Limits = {
  fiveHour: number | null
  week: number | null
  model: { label: string; left: number } | null // the `weekly_scoped` entry named Fable; null when the answer has none
  fiveHourResetsAt: number | null // epoch ms of `five_hour.resets_at` (ISO 8601 with an offset); null when absent or not that. The text is made at draw time
  /** Epoch ms of `seven_day.resets_at`, read like `fiveHourResetsAt`. A value stored by 1.4.0 has none: read it as null (a dash). */
  weekResetsAt: number | null
}

/**
 * The owner's last question (1.5.0), what the `last answer` button scrolls to: `uuid` is the transcript message's id (known before any
 * press, so the press scrolls without waiting); `pending` is the text of a question submitted but not yet found in the transcript
 * (queued behind a running turn, or typed into a running turn), and `previous` is the uuid of the question before it: the press goes
 * there (it is the question being answered now) and the lookup never goes back past it. `queued`: how many copies of the same words are already pending before this one (absent: none), so the lookup takes the row at that index among the matching rows newer than `previous`; null: no question seen yet. Absent in a state
 * stored before 1.5.0: read it as null.
 */
export type LastQuestion = { uuid: string } | { pending: string; previous?: string; queued?: number } | null

/**
 * The limits line under the account row. `email`: the account the line was opened for (a line is drawn only while the signed-in
 * email is the same). `fetchedAt`: `$.clock.now()` when the last fetch ENDED (answer or failure). `isOpen` is written by a press
 * on the email (toggle) and by the line's Close button (only to false); neither changes `value` or `fetchedAt`.
 */
export type LimitsView = { isOpen: boolean; email?: string; fetchedAt?: number; value?: Limits; isFailed: boolean }

declare module 'claude-code' {
  interface PluginState {
    'agent-models': {
      models: Record<string, string>
      rows: AgentRow[]
      viewer: Viewer
      prompts: string[]
      account: Account
      login: Login
      tasks: Tasks
      limits: LimitsView
      /** The clock minute (epoch ms / 60000, floored) of the open limits line's tick; null: the clock was refused. Only its change matters: it draws the band again as the times run down. */
      limitsMinute: number | null
      lastQuestion: LastQuestion
    }
  }
}
