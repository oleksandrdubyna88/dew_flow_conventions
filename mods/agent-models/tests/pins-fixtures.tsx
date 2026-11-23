import type { Engine, Mounted } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { Pin } from '../types'
import { spin } from './account-fixtures'

// The helpers of the pin tests (pins.test.tsx, answer-list.test.tsx): Claude's answer rows to mount, a world that records every
// state write, scroll and toast, and a stored value the test seeds. Not a test file.

export const PINS_KEY = { plugin: 'agent-models', key: 'pins' } as const
export const LIST_KEY = { plugin: 'agent-models', key: 'answerListOpen' } as const
export const RASPBERRY = '#E3256B'
export const GREY = '#808080'
export const ICON_ON = '\u{1F4CC}'
export const ICON_OFF = '\u{1F4CC}︎'
export const FULLSCREEN = { columns: 80, rows: 24, isFullscreen: true } as const
export const MAIN_SCREEN = { columns: 80, rows: 24, isFullscreen: false } as const

export type RowUi = Mounted<'terminal' | 'desktop', 'AssistantMessage'>

/** A transcript block id as the engine gives it: a uuid whose last 12 hex digits are zero (the probe of 2026-11-23). */
export const idOf = (n: number): string => `${n.toString(16).padStart(8, '0')}-1111-4222-8333-000000000000`
export const A = idOf(1)
export const B = idOf(2)

export const pin = (id: string, text: string): Pin => ({ id, text })
export const manyPins = (n: number): Pin[] => Array.from({ length: n }, (_, i) => pin(idOf(i + 1), `answer ${i + 1}`))

/** What the engine's state answered, checked field by field: a list of pins, never cast. */
export const pinsOf = (v: unknown): Pin[] => {
  if (!Array.isArray(v)) return []
  const out: Pin[] = []
  for (const item of v) {
    if (typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string' && 'text' in item && typeof item.text === 'string') {
      out.push({ id: item.id, text: item.text })
    }
  }
  return out
}

export type Write = { key: string; value: unknown }
export type PinWorld = {
  writes: Write[] // every state write of the mod, in order
  toasts: string[]
  writesAtToast: number[] // how many state writes had been seen when each toast arrived
}

/**
 * The engine under the mod for the pin tests: the AssistantMessage row it draws (a Text with the block's text, which the mod must
 * keep), every state write and every toast; `isToasting: false` when the test already records toasts itself (the `session` of
 * answer-fixtures). The harness cannot see where the mod's own `$.ui.scroll` goes: with no engine under it a scroll rejects with
 * `no implementation for ui.scroll`, which the mod toasts (`SCROLL_REJECTED`), so a press that reached the scroll is seen by that toast.
 */
export const pinWorld = (on: On, isToasting = true): PinWorld => {
  const w: PinWorld = { writes: [], toasts: [], writesAtToast: [] }
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text key="engine-row">{e.props.text}</Text>
  })
  on('state.set', (_, e, next) => {
    w.writes.push({ key: e.key, value: e.value })
    return next(e)
  })
  if (isToasting) {
    on('ui.toast', (_, e) => {
      w.toasts.push(e.text)
      w.writesAtToast.push(w.writes.length)
      return { value: undefined }
    })
  }
  return w
}
export const SCROLL_REJECTED = 'no implementation for ui.scroll'

/** The newest stored `pins` the mod wrote; `undefined` while it wrote none. */
export const lastPins = (w: PinWorld): Pin[] | undefined => {
  const last = w.writes.filter(x => x.key === 'pins').at(-1)
  return last === undefined ? undefined : pinsOf(last.value)
}
export const lastListOpen = (w: PinWorld): unknown => w.writes.filter(x => x.key === 'answerListOpen').at(-1)?.value

/** Pins the stored state already holds (a session that kept them across a reload), read until the mod's first write of them. */
export const seededPins = (on: On, value: readonly Pin[]): void => {
  let isWritten = false
  on('state.set', PINS_KEY, (_, e, next) => {
    isWritten = true
    return next(e)
  })
  on('state.get', PINS_KEY, (_, e, next) => (isWritten ? next(e) : { value: { value, version: 0 } }))
}

/** The same for the list's flag. */
export const seededList = (on: On, value: boolean): void => {
  let isWritten = false
  on('state.set', LIST_KEY, (_, e, next) => {
    isWritten = true
    return next(e)
  })
  on('state.get', LIST_KEY, (_, e, next) => (isWritten ? next(e) : { value: { value, version: 0 } }))
}

type RowOptions = { text?: string; isSummary?: boolean; viewport?: typeof FULLSCREEN | typeof MAIN_SCREEN | undefined; surface?: 'terminal' | 'desktop' }

/** Draws one text block of Claude's reply through the mod. */
export const mountRow = ($: Engine, id: string, o: RowOptions = {}) =>
  $.ui.mount({
    plugin: 'agent-models',
    component: 'AssistantMessage',
    requestId: id,
    props: { text: o.text ?? 'Hello there', isFirstOfReply: true, ...(o.isSummary === true ? { isSummary: true as const } : {}) },
    surface: o.surface ?? 'terminal',
    viewport: 'viewport' in o ? o.viewport : FULLSCREEN,
  })

export const pinButton = (ui: RowUi, id: string) => ui.find({ type: 'Button', key: `pin-${id}` })
/** The icon's own Text: its colour tells pinned (raspberry) from not (grey); a mounted row holds one icon. */
export const iconOf = (ui: RowUi) => ui.find({ type: 'Text', text: /\u{1F4CC}/u })
export const pressPinIcon = async (ui: RowUi, id: string) => {
  await ui.press({ key: `pin-${id}` })
  await spin()
  await ui.redraw()
}
