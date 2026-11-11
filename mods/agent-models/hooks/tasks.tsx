// The session's tasks list: notes the person keeps in the band, sent as a prompt (Apply), put in the prompt box (To prompt),
// edited, moved or deleted. State is `$.state` (survives a hot reload); every action goes through `changeTasks`, so the next
// action clears the dim line (and never touches the sending state: `applyTask` owns it). Every function that takes `$` is a
// function declaration: `claude plugin validate` refuses an arrow taking `$` once it is imported from another file (measured
// 2026-11-10).
import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { Task, Tasks } from '../types'
import { CLOSE_COLOR, reasonLine, TASKS_COLOR } from './prompts'

export const TASK_LIMIT = 100
export const TASK_CHARS = 4000 // UTF-16 length, `text.length`
export const NO_TASKS: Tasks = { isOpen: false, items: [], nextId: 1, draft: '', isSending: false }
const tasks = atom({ plugin: 'agent-models', key: 'tasks' } as const, NO_TASKS)

// The engine's scan reads `read($, x)` only for an atom written in the same file: register.tsx reads this one through here.
export async function currentTasks($: EngineInterface): Promise<Tasks> {
  return read($, tasks)
}

const UNKNOWN = 'unknown reason'
export const NO_NOTES = 'No notes yet'
// $.prompt.submit from a plugin runs once the session is idle, so an Apply during a turn waits for its end
export const SENDING = 'Waits until Claude finishes this turn'
export const NOTE_EMPTY = 'A note needs some text.'
export const NOTE_FULL = `The list holds at most ${TASK_LIMIT} notes; apply or delete one first.`
export const noteTooLong = (n: number): string => `A note holds at most ${TASK_CHARS} characters; this one has ${n}.`
export const tasksLabel = (n: number): string => `tasks (${n})`
export const tasksHeader = (n: number): string => `Tasks (${n})`
const notSent = (reason: string): string => `Not sent: ${reason}`
const notFilled = (reason: string): string => `Not put in the prompt box: ${reason}`

// --- pure decisions ---

/** Why a note may not be stored (the first match wins); the note is stored AS TYPED, never trimmed. */
export const noteRefusal = (text: string, count: number, isAdd: boolean): string | undefined => {
  if (text.trim() === '') return NOTE_EMPTY
  if (text.length > TASK_CHARS) return noteTooLong(text.length)
  return isAdd && count >= TASK_LIMIT ? NOTE_FULL : undefined
}

/** A new array with the note one place up or down; an unknown id or an edge gives the same order (no wrap). */
export const moveTask = (items: readonly Task[], id: number, by: -1 | 1): Task[] => {
  const from = items.findIndex(x => x.id === id)
  const to = from + by
  if (from === -1 || to < 0 || to >= items.length) return [...items]
  const next = [...items]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

// `deny` is not in the plugin-facing PromptSubmitResult of 2.1.319, so the result is read defensively through unknown.
export const submitRefusal = (result: unknown): string | undefined => {
  if (typeof result !== 'object' || result === null) return notSent(UNKNOWN)
  const { text, drop, deny } = result as { text?: unknown; drop?: unknown; deny?: unknown }
  if (drop !== undefined) return notSent(reasonLine(drop, UNKNOWN))
  if (deny !== undefined) return notSent(reasonLine(deny, UNKNOWN))
  return typeof text === 'string' ? undefined : notSent(UNKNOWN)
}

const FILL_CAUSES = { no_composer: 'this session has no prompt box', dialog: 'a dialog is open' } as const
export const fillRefusal = (result: { isFilled: boolean; refusal?: 'no_composer' | 'dialog' }): string | undefined =>
  result.isFilled ? undefined : notFilled(result.refusal === undefined ? UNKNOWN : (FILL_CAUSES[result.refusal] ?? UNKNOWN))

/** The note to append: on a new line unless the box is empty or already ends in one. */
export const appendedText = (draft: string, note: string): string => (draft === '' || draft.endsWith('\n') ? note : `\n${note}`)

// --- flows: none rejects ---

let isApplying = false // the single flight of every Apply
let applyingId: number | undefined // the note being sent: all of its buttons are dim and do nothing until the submit settles
let isFilling = false // the single flight of every To prompt

// `isSending` and `sendingId` are written by `applyTask` and by nothing else.
async function changeTasks($: EngineInterface, change: (t: Tasks) => Tasks): Promise<void> {
  await update($, tasks, t => change({ ...t, note: undefined })).catch(() => undefined)
}

export async function openTasks($: EngineInterface, closeViewer: () => Promise<unknown>): Promise<void> {
  await closeViewer().catch(() => undefined) // the two views are never open together
  await changeTasks($, t => ({ ...t, isOpen: true }))
}

// What is typed in the add field, in memory only (1.3.2). A state write per key redraws the band, and a redraw for key k that lands
// after key k+1 would put the older text back into the field. So typing writes nothing; the text reaches `tasks.draft` only when
// something needs it later: a refusal (the refused text stays), Close (the draft is kept), a remount. `undefined`: nothing typed
// since the last add, Close or reload, and the stored draft stands. A module variable is lost by a hot reload; the draft is not.
let typed: string | undefined

function keepTyped(text: string): void {
  typed = text
}

export async function closeTasks($: EngineInterface): Promise<void> {
  const text = typed
  typed = undefined
  await changeTasks($, t => ({ ...t, isOpen: false, editing: undefined, ...(text === undefined ? {} : { draft: text }) })) // the add field's draft is kept
}

// The note leaves the list only while it still holds the text that was sent or put in the box.
const without = (items: readonly Task[], task: Task): Task[] => items.filter(x => !(x.id === task.id && x.text === task.text))

// The list after an add: the note appended and the draft emptied, or the refusal and the draft kept as typed.
function withAdded(t: Tasks, text: string): Tasks {
  const note = noteRefusal(text, t.items.length, true)
  if (note !== undefined) return { ...t, note, draft: text }
  return { ...t, draft: '', nextId: t.nextId + 1, items: [...t.items, { id: t.nextId, text }] }
}

// Enter hands the field's own text, which wins; the add button hands none and takes what was typed, else the stored draft INSIDE the
// update (no read-then-write gap). A refusal stores the refused text as the draft, so forgetting what was typed loses nothing.
async function addTask($: EngineInterface, text?: string): Promise<void> {
  const given = text ?? typed
  typed = undefined
  await changeTasks($, t => withAdded(t, given ?? t.draft))
}

async function saveEdit($: EngineInterface, id: number, text: string): Promise<void> {
  await changeTasks($, t => {
    const note = noteRefusal(text, t.items.length, false)
    if (note !== undefined) return { ...t, note, editing: { id, draft: text } }
    return { ...t, editing: undefined, items: t.items.map(x => (x.id === id ? { id, text } : x)) }
  })
}

// Sets the sending state first (before any read), clears the flight BEFORE the final write, and clears the state only while
// it is still this note's: a press that lands in between neither keeps it on nor is cleared by it.
async function applyTask($: EngineInterface, id: number): Promise<void> {
  if (isApplying) return
  isApplying = true
  applyingId = id
  try {
    await update($, tasks, t => ({ ...t, note: undefined, isSending: true, sendingId: id }))
    const task = (await read($, tasks)).items.find(x => x.id === id)
    let note: string | undefined
    if (task !== undefined) {
      try {
        // the note is the person's own words: submitted bare, as a typed prompt is (the transcript still names the plugin)
        note = submitRefusal(await $.prompt.submit({ text: task.text, asUser: true }))
      } catch (error) {
        note = notSent(reasonLine(error, UNKNOWN))
      }
    }
    isApplying = false
    applyingId = undefined
    await update($, tasks, t => ({
      ...t,
      ...(t.sendingId === id ? { isSending: false, sendingId: undefined } : {}),
      note,
      items: task === undefined || note !== undefined ? t.items : without(t.items, task),
    }))
  } catch {
    // a refused state read or write: the note stays; the sending state is taken off if it can be
    await update($, tasks, t => (t.sendingId === id ? { ...t, isSending: false, sendingId: undefined } : t)).catch(() => undefined)
  } finally {
    if (applyingId === id) {
      isApplying = false
      applyingId = undefined
    }
  }
}

async function toPrompt($: EngineInterface, id: number): Promise<void> {
  if (isFilling) return
  isFilling = true
  try {
    const task = (await read($, tasks)).items.find(x => x.id === id)
    if (task === undefined) return
    let note: string | undefined
    try {
      const box = await $.prompt.read()
      note = fillRefusal(await $.prompt.fill({ text: appendedText(box.text, task.text), mode: 'append' }))
    } catch (error) {
      note = notFilled(reasonLine(error, UNKNOWN))
    }
    await changeTasks($, t => ({ ...t, note, items: note === undefined ? without(t.items, task) : t.items }))
  } catch {
    // a refused state read: the note stays
  } finally {
    isFilling = false
  }
}

const ACTIONS = [['apply', 'apply'], ['prompt', 'to prompt'], ['edit', 'edit'], ['up', '↑'], ['down', '↓'], ['delete', 'delete']] as const
type Action = (typeof ACTIONS)[number][0]

async function act($: EngineInterface, action: Action, id: number): Promise<void> {
  if (id === applyingId) return // the note being sent
  if (action === 'apply') return applyTask($, id)
  if (action === 'prompt') return toPrompt($, id)
  await changeTasks($, t => {
    const task = t.items.find(x => x.id === id)
    if (action === 'edit') return task === undefined ? t : { ...t, editing: { id, draft: task.text } }
    if (action === 'delete') return { ...t, items: t.items.filter(x => x.id !== id), editing: t.editing?.id === id ? undefined : t.editing }
    return { ...t, items: moveTask(t.items, id, action === 'up' ? -1 : 1) }
  })
}

// --- drawing ---

type RenderEvent = Parameters<EngineInterface['ui']['resolve']>[0]

export function tasksButton($: EngineInterface, e: RenderEvent, t: Tasks, closeViewer: () => Promise<unknown>) {
  const { Button, Text } = $.ui.resolve(e)
  const label = tasksLabel(t.items.length)
  return (
    <Button key="my-tasks" label={label} onPress={() => void openTasks($, closeViewer)}>
      <Text color={TASKS_COLOR}>{label}</Text>
    </Button>
  )
}

function taskRow($: EngineInterface, e: RenderEvent, t: Tasks, task: Task, i: number) {
  const { Box, Button, Input, Text } = $.ui.resolve(e)
  if (t.editing?.id === task.id) {
    return (
      <Box key={`task-${task.id}`}>
        <Input key="task-editing" label={`${i}. `} value={t.editing.draft} submitLabel="save" onSubmit={v => void saveEdit($, task.id, v)} />
        <Button key="task-cancel" label="cancel" onPress={() => void changeTasks($, x => ({ ...x, editing: undefined }))} />
      </Box>
    )
  }
  return (
    <Box key={`task-${task.id}`} flexDirection="column">
      <Text wrap="wrap">{`${i}. ${task.text}`}</Text>
      <Box>
        {ACTIONS.map(([action, label]) => (
          <Button key={`task-${action}-${task.id}`} label={label} dimColor={t.sendingId === task.id || (action === 'apply' && t.isSending)} onPress={() => void act($, action, task.id)} />
        ))}
      </Box>
    </Box>
  )
}

export function tasksView($: EngineInterface, e: RenderEvent, t: Tasks) {
  const { Box, Button, Input, Text } = $.ui.resolve(e)
  return (
    <Box flexDirection="column">
      <Text bold color={TASKS_COLOR}>{tasksHeader(t.items.length)}</Text>
      {t.items.length === 0 && <Text dimColor>{NO_NOTES}</Text>}
      {t.items.map((task, i) => taskRow($, e, t, task, i + 1))}
      {t.isSending && <Text dimColor>{SENDING}</Text>}
      {t.note !== undefined && <Text dimColor>{t.note}</Text>}
      <Box>
        <Input key={`task-add-${t.nextId}`} placeholder="a new note" submitLabel="add" value={t.draft} onInput={keepTyped} onSubmit={v => void addTask($, v)} />
        <Button key="tasks-add" label="add" onPress={() => void addTask($)} />
        <Button key="tasks-close" label="Close" role="dismiss" onPress={() => void closeTasks($)}>
          <Text color={CLOSE_COLOR}>Close</Text>
        </Button>
      </Box>
    </Box>
  )
}
