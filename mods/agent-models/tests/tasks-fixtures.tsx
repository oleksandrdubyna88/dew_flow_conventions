import type { Mounted } from 'claude-code/testing'

// The add field of the tasks view, for tasks.test.tsx, tasks-race.test.tsx and tasks-send.test.tsx. Its key carries the id the
// next note takes (`task-add-<nextId>`, 1.3.2): a note that was added draws a NEW, empty field, so the key is looked up each
// time. Not a test file: it adds no test child.

type Ui = Mounted<'terminal' | 'desktop', 'AbovePrompt'>

export const addField = async (ui: Ui) => (await ui.findAll({ type: 'Input' })).find(x => x.key?.startsWith('task-add'))
const keyOf = async (ui: Ui) => (await addField(ui))?.key ?? 'task-add'
export const add = async (ui: Ui, t: string) => ui.input({ key: await keyOf(ui), text: t }) // Enter, with the field's own text
export const type = async (ui: Ui, t: string) => ui.input({ key: await keyOf(ui), text: t, kind: 'change' }) // one edit: onInput, not Enter
export const draw = async (ui: Ui) => (await addField(ui))?.props.value // what the add field draws
