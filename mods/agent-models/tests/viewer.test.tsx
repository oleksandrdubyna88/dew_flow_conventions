import { expect, test } from 'claude-code/testing'
import type { Engine, Mounted } from 'claude-code/testing'
import type { AgentInfo, AgentStatus, On, SessionMessage } from 'claude-code'

import {
  cleanPrompts, clampIndex, EXTRACT, HISTORY_TIMEOUT_MS, LOG_NOTE, parseExtract, personPrompts, SESSION_ID, textRows,
  VIEWER_NOTE, viewerFixedRows, WRAPPER_TAGS,
} from '../hooks/prompts'
import { CLEAN, DIRTY, FAILURES, logRoad, ok, SID, two } from './transcript-fixtures'
import type { Answer } from './transcript-fixtures'

const u = (text: string): SessionMessage => ({ role: 'user', text, toolUses: [] })

test('a tool-result row is not a prompt', () => {
  const results = [{ tool_use_id: 'x', text: 'out', isError: false }]
  expect(personPrompts([{ ...u(''), toolResults: results }])).toEqual([])
  expect(personPrompts([{ ...u('hi'), toolResults: results }])).toEqual([])
})

test('each engine wrapper row is dropped', () => {
  for (const tag of WRAPPER_TAGS) {
    expect(personPrompts([u(`<${tag}>x</${tag}>`)])).toEqual([])
  }
})

test('a reminder-only row is dropped', () => {
  expect(personPrompts([u('<system-reminder>r</system-reminder>\n  ')])).toEqual([])
})

test("a prompt that starts with the person's markup is kept", () => {
  expect(personPrompts([u('<div>hi</div>')])).toEqual(['<div>hi</div>'])
})

test('a reminder inside a prompt is removed, the prompt kept', () => {
  const row = u('fix this\n<system-reminder>r</system-reminder>\nplease')
  expect(personPrompts([row])).toEqual(['fix this\n\nplease'])
})

test('an IDE block is removed, the prompt after it kept', () => {
  expect(personPrompts([u('<ide_opened_file>opened a.ts</ide_opened_file>\nwhy?')])).toEqual(['why?'])
  expect(personPrompts([u('<ide_opened_file>x</ide_opened_file>')])).toEqual([])
})

test('assistant rows are not prompts and the order is kept', () => {
  const rows: SessionMessage[] = [u('one'), { role: 'assistant', text: 'a', toolUses: [] }, u('two')]
  expect(personPrompts(rows)).toEqual(['one', 'two'])
})

test('textRows counts wrapped lines', () => {
  expect(textRows('ab\n\nabcde', 2)).toBe(1 + 1 + 3)
})

// --- the viewer, drawn through the band on both surfaces ---

const BAND = {
  plugin: 'agent-models',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 12,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 11 },
    view: {},
  },
} as const

const SPAWN = {
  tool_use_id: 't',
  prompt: 'p',
  description: 'd',
  subagentType: 'Explore',
  provider: { plugin: 'engine', tier: 'core' },
  parentModel: 'claude-opus-5-5',
  background: true,
  fork: false,
} as const

const SURFACES = ['terminal', 'desktop'] as const
const agent = (id: string, status: AgentStatus = 'running'): AgentInfo =>
  ({ id, description: `task ${id}`, type: 'Explore', status })

// The transcript the viewer reads is `rows`, read again on every press.
const withSession = (on: On, read: () => SessionMessage[] | Error, agents: AgentInfo[] = []) => {
  on('session.messages', () => {
    const rows = read()
    if (rows instanceof Error) throw rows
    return { value: rows }
  })
  on('agent.list', () => ({ value: agents }))
}
const three = [u('first'), u('second'), u('third')]
const text = (ui: Mounted<'terminal' | 'desktop', 'AbovePrompt'>, t: string | RegExp) => ui.find({ type: 'Text', text: t })

// The viewer's state belongs to the plugin, not to a drawing: leave it closed for the next surface.
const leave = async (ui: Mounted<'terminal' | 'desktop', 'AbovePrompt'>) => {
  if (await ui.find({ type: 'Button', key: 'close' })) await ui.press({ key: 'close' })
  await ui.unmount()
}

test('the band always offers messages, in purple', async ($, on) => {
  withSession(on, () => three)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const button = await ui.find({ type: 'Button', key: 'my-messages' })
    expect(button?.props.label).toBe('messages')
    expect(button?.children).toMatchObject([{ type: 'Text', props: { color: '#a855f7' }, children: ['messages'] }])
    expect(await ui.find({ type: 'Button', key: 'next' })).toBeUndefined()
    await ui.unmount()
  }
})

test('the viewer header is bold and the same purple as the messages button', async ($, on) => {
  withSession(on, () => three)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    const header = await text(ui, 'Message 1 / 3')
    expect(header?.props.color).toBe('#a855f7')
    expect(header?.props.bold).toBe(true)
    await leave(ui)
  }
})

test('the Close button is red', async ($, on) => {
  withSession(on, () => three)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    const close = await ui.find({ type: 'Button', key: 'close' })
    expect(close?.props.label).toBe('Close')
    expect(close?.children).toMatchObject([{ type: 'Text', props: { color: '#ef4444' }, children: ['Close'] }])
    await leave(ui)
  }
})

test('the viewer opens at the first message', async ($, on) => {
  withSession(on, () => three)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect((await text(ui, 'Message 1 / 3'))?.text).toBe('Message 1 / 3')
    expect((await text(ui, 'first'))?.text).toBe('first')
    await leave(ui)
  }
})

test('Prev at the first message stays', async ($, on) => {
  withSession(on, () => three)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    await ui.press({ key: 'prev' })
    expect((await text(ui, 'Message 1 / 3'))?.text).toBe('Message 1 / 3')
    await leave(ui)
  }
})

test('Next at the last message stays', async ($, on) => {
  withSession(on, () => three)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    for (let i = 0; i < 3; i += 1) await ui.press({ key: 'next' })
    expect((await text(ui, 'Message 3 / 3'))?.text).toBe('Message 3 / 3')
    expect((await text(ui, 'third'))?.text).toBe('third')
    await leave(ui)
  }
})

test('First and Last jump', async ($, on) => {
  withSession(on, () => three)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    await ui.press({ key: 'last' })
    expect((await text(ui, 'Message 3 / 3'))?.text).toBe('Message 3 / 3')
    await ui.press({ key: 'first' })
    expect((await text(ui, 'Message 1 / 3'))?.text).toBe('Message 1 / 3')
    await leave(ui)
  }
})

test('Close returns to the one-row band', async ($, on) => {
  withSession(on, () => three)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    await ui.press({ key: 'close' })
    expect(await ui.find({ type: 'Button', key: 'my-messages' })).toBeDefined()
    expect(await text(ui, /^Message /)).toBeUndefined()
    await leave(ui)
  }
})

test('with no prompts the viewer says so', async ($, on) => {
  withSession(on, () => [])
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect((await text(ui, 'No messages yet'))?.text).toBe(' No messages yet')
    expect(await ui.find({ type: 'Button', key: 'my-messages' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'next' })).toBeUndefined()
    await leave(ui)
  }
})

test('a transcript of only engine rows says No messages yet', async ($, on) => {
  withSession(on, () => [u('<task-notification>done</task-notification>')])
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect(await text(ui, /No messages yet/)).toBeDefined()
    await leave(ui)
  }
})

const longPrompt = Array.from({ length: 40 }, (_, i) => `line ${i + 1}`).join('\n')

test('a long prompt is drawn whole and says it scrolls', async ($, on) => {
  withSession(on, () => [u(longPrompt)])
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect((await text(ui, 'Message 1 / 1 (scroll for more)'))?.text).toBe('Message 1 / 1 (scroll for more)')
    expect(await text(ui, /line 40/)).toBeDefined()
    await leave(ui)
  }
})

test('a short prompt has no scroll note', async ($, on) => {
  withSession(on, () => [u('short')])
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect((await text(ui, 'Message 1 / 1'))?.text).toBe('Message 1 / 1')
    await leave(ui)
  }
})

test('a new prompt appears on the next press', async ($, on) => {
  let rows = [u('a'), u('b')]
  withSession(on, () => rows)
  for (const surface of SURFACES) {
    rows = [u('a'), u('b')]
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect((await text(ui, 'Message 1 / 2'))?.text).toBe('Message 1 / 2')
    await ui.press({ key: 'close' })
    rows = [u('a'), u('b'), u('c')]
    await ui.press({ key: 'my-messages' })
    expect((await text(ui, 'Message 1 / 3'))?.text).toBe('Message 1 / 3')
    await leave(ui)
  }
})

test('a transcript that cannot be read says so', async ($, on) => {
  withSession(on, () => new Error('no session'))
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect(await text(ui, /Could not read this session's messages\./)).toBeDefined()
    await leave(ui)
  }
})

test('the cap is named', async ($, on) => {
  const rows = Array.from({ length: 4096 }, (_, i) => u(`p${i}`))
  withSession(on, () => rows)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect(await text(ui, /Only the newest 4096/)).toBeDefined()
    await leave(ui)
  }
})

test('agent rows and the viewer share the band', async ($, on) => {
  on('agent.spawn', () => ({ agentId: 'a1', model: 'claude-sonnet-4-6' }))
  withSession(on, () => [u('only')], [agent('a1')])
  await $.agent.spawn(SPAWN)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect((await text(ui, 'task a1'))?.text).toBe('task a1')
    expect((await text(ui, 'Message 1 / 1'))?.text).toBe('Message 1 / 1')
    await leave(ui)
  }
})

// --- B3: the loading state, the clamp, the dim edges ---

test('clampIndex keeps an index inside the list', () => {
  expect(clampIndex(5, 0)).toBe(0)
  expect(clampIndex(-1, 3)).toBe(0)
  expect(clampIndex(7, 3)).toBe(2)
  expect(clampIndex(1, 3)).toBe(1)
})

test('a press while the messages load is ignored and the band says Loading', async ($, on) => {
  let calls = 0
  let release: (rows: SessionMessage[]) => void = () => undefined
  let held = Promise.resolve<SessionMessage[]>([])
  on('session.messages', async () => {
    calls += 1
    return { value: await held }
  })
  on('agent.list', () => ({ value: [] }))
  for (const surface of SURFACES) {
    calls = 0
    held = new Promise<SessionMessage[]>(resolve => {
      release = resolve
    })
    const ui = await $.ui.mount({ ...BAND, surface })
    const pressing = ui.press({ key: 'my-messages' })
    for (let i = 0; i < 50; i += 1) await Promise.resolve() // let the press reach the held read
    await ui.redraw() // the mounted handle keeps its old tree until it is drawn again
    expect(await text(ui, /Loading messages/)).toBeDefined()
    expect((await ui.find({ type: 'Button', key: 'my-messages' }))?.props.dimColor).toBe(true)
    await ui.press({ key: 'my-messages' })
    expect(calls).toBe(1)
    release(three)
    await pressing
    expect((await text(ui, 'Message 1 / 3'))?.text).toBe('Message 1 / 3')
    expect(await text(ui, /Loading messages/)).toBeUndefined()
    await leave(ui)
  }
})

test('a failed read ends the loading state and a later press reads again', async ($, on) => {
  let calls = 0
  let fail = true
  on('session.messages', () => {
    calls += 1
    if (fail) throw new Error('no session')
    return { value: three }
  })
  on('agent.list', () => ({ value: [] }))
  for (const surface of SURFACES) {
    calls = 0
    fail = true
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect(await text(ui, /Could not read this session's messages\./)).toBeDefined()
    expect(await text(ui, /Loading messages/)).toBeUndefined()
    fail = false
    await ui.press({ key: 'my-messages' })
    expect(calls).toBe(2)
    expect((await text(ui, 'Message 1 / 3'))?.text).toBe('Message 1 / 3')
    await leave(ui)
  }
})

test('the page buttons dim at the edges', async ($, on) => {
  const dim = async (ui: Mounted<'terminal' | 'desktop', 'AbovePrompt'>) => {
    const out: Record<string, unknown> = {}
    for (const key of ['first', 'prev', 'next', 'last']) {
      out[key] = Boolean((await ui.find({ type: 'Button', key }))?.props.dimColor)
    }
    return out
  }
  let rows = three
  withSession(on, () => rows)
  for (const surface of SURFACES) {
    rows = three
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    await ui.press({ key: 'next' })
    expect(await dim(ui)).toEqual({ first: false, prev: false, next: false, last: false })
    await ui.press({ key: 'first' })
    expect(await dim(ui)).toEqual({ first: true, prev: true, next: false, last: false })
    await ui.press({ key: 'last' })
    expect(await dim(ui)).toEqual({ first: false, prev: false, next: true, last: true })
    await ui.press({ key: 'close' })
    rows = [u('only')]
    await ui.press({ key: 'my-messages' })
    expect(await dim(ui)).toEqual({ first: true, prev: true, next: true, last: true })
    await leave(ui)
  }
})

// --- B4: the reminder stripper is a linear scanner ---

test('reminder and IDE blocks are both removed from one row', () => {
  const row = 'a<system-reminder>x</system-reminder>b<ide_opened_file>y</ide_opened_file>c'
  expect(personPrompts([u(row)])).toEqual(['abc'])
})

test('an unclosed reminder stays as text', () => {
  expect(personPrompts([u('hi <system-reminder>never closed')])).toEqual(['hi <system-reminder>never closed'])
})

test('a nested opener ends at the first closer after the first opener', () => {
  const row = '<system-reminder>a<system-reminder>b</system-reminder>c</system-reminder>'
  expect(personPrompts([u(row)])).toEqual(['c</system-reminder>'])
})

test('many unclosed openers are scanned in linear time', { timeoutMs: 2000 }, () => {
  const row = `${'<system-reminder>'.repeat(50000)}x`
  expect(personPrompts([u(row)])).toEqual([row])
})

// --- 1.3.2: every typed prompt from the session log (H = the mod; the script itself runs in tools/agent-models-extract.test.mjs) ---

test('H0 after a compaction the viewer still opens at the first prompt the person typed', async ($, on) => {
  let runs = 0
  const out = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
  on('agent.list', () => ({ value: [] }))
  on('session.id', () => ({ value: '0f0e0d0c-aaaa-4bbb-8ccc-123456789abc' }))
  on('process.run', (_, e) => {
    if (e.argv[0] !== 'node') return out('{"loggedIn":false}') // the band's own account read
    runs += 1
    return out(JSON.stringify(['typed before the compaction', 'typed after it']))
  })
  // what $.session.messages() holds after a compaction: the summary first, then what followed
  on('session.messages', () => ({ value: [u('This session is being continued from a previous conversation.'), u('typed after it')] }))
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'my-messages' })
    expect((await text(ui, /^Message /))?.text).toBe('Message 1 / 2')
    expect((await ui.findAll({ type: 'Text' })).at(-1)?.text).toBe('typed before the compaction')
    expect((await text(ui, /^From the /))?.text).toBe('From the session log: every prompt you typed, from the first.')
    await leave(ui)
  }
  expect(runs).toBe(2) // one node run per press
})

const open = async ($: Engine, surface: 'terminal' | 'desktop' = 'terminal') => {
  const ui = await $.ui.mount({ ...BAND, surface })
  await ui.press({ key: 'my-messages' })
  return ui
}

test('H6 the viewer runs node once with the script and the session id, and shows the log with its note', async ($, on) => {
  const seen = logRoad(on, two)
  for (const surface of SURFACES) {
    seen.argvs.length = 0
    seen.timeouts.length = 0
    const ui = await open($, surface)
    expect(seen.argvs).toEqual([['node', '-e', EXTRACT, '--', SID]])
    expect(seen.timeouts).toEqual([10_000])
    expect(HISTORY_TIMEOUT_MS).toBe(10_000)
    expect((await text(ui, 'Message 1 / 2'))?.text).toBe('Message 1 / 2')
    expect((await text(ui, 'typed first'))?.text).toBe('typed first')
    expect((await text(ui, LOG_NOTE))?.text).toBe('From the session log: every prompt you typed, from the first.')
    expect((await text(ui, LOG_NOTE))?.props.dimColor).toBe(true)
    expect(await text(ui, VIEWER_NOTE)).toBeUndefined()
    await ui.press({ key: 'next' })
    expect((await text(ui, 'typed second'))?.text).toBe('typed second')
    await leave(ui)
  }
  expect(seen.messages).toBe(0)
})

test('H7 the viewer passes the session id', async ($, on) => {
  const seen = logRoad(on, two)
  const ui = await open($)
  expect(seen.argvs).toEqual([['node', '-e', EXTRACT, '--', SID]])
  expect(seen.ids).toBe(1)
  expect((await text(ui, 'Message 1 / 2'))?.text).toBe('Message 1 / 2')
  expect(await text(ui, LOG_NOTE)).toBeDefined()
  expect(seen.messages).toBe(0)
  await leave(ui)
})

test('H8 an id outside [A-Za-z0-9-]{8,64} starts no process and the transcript road answers', async ($, on) => {
  let id: string | { deny: string } = SID
  const seen = logRoad(on, two, () => id)
  const refused = ['short7x', 'a'.repeat(65), 'has_under_score', 'dot.dot.dot', '../../etc/passwd', 'abc def ghi', '', `${SID}.jsonl`, `${SID}\n`, { deny: 'no session' }]
  for (const bad of refused) {
    id = bad
    const ui = await open($)
    expect(seen.argvs).toEqual([])
    expect((await text(ui, 'Message 1 / 3'))?.text).toBe('Message 1 / 3')
    expect(await text(ui, VIEWER_NOTE)).toBeDefined()
    expect(await text(ui, LOG_NOTE)).toBeUndefined()
    await leave(ui)
  }
  expect(seen.messages).toBe(refused.length)
  for (const good of ['abcd1234', 'a'.repeat(64), SID, '-leading-dash']) {
    id = good
    const ui = await open($)
    expect(seen.argvs.at(-1)).toEqual(['node', '-e', EXTRACT, '--', good])
    await leave(ui)
  }
  expect(SESSION_ID.source).toBe('^[A-Za-z0-9-]{8,64}$')
})

test('H9 every failure of the log road shows the transcript list with the transcript note', async ($, on) => {
  let answer: Answer = two()
  const seen = logRoad(on, () => answer)
  for (const [name, failure] of FAILURES) {
    answer = failure
    seen.messages = 0
    const ui = await open($)
    expect({ name, header: (await text(ui, /^Message /))?.text }).toEqual({ name, header: 'Message 1 / 3' })
    expect((await text(ui, 'first'))?.text).toBe('first')
    expect(await text(ui, VIEWER_NOTE)).toBeDefined()
    expect(await text(ui, LOG_NOTE)).toBeUndefined()
    expect(await text(ui, 'only the start')).toBeUndefined()
    expect({ name, messages: seen.messages }).toEqual({ name, messages: 1 })
    await leave(ui)
  }
  expect(seen.argvs).toHaveLength(FAILURES.length) // each one did run node first
  answer = two() // the positive: the same fixture on the log road
  const ui = await open($)
  expect((await text(ui, 'Message 1 / 2'))?.text).toBe('Message 1 / 2')
  await leave(ui)
})

test('H10 parseExtract accepts only exit 0, whole output, one JSON array of strings', () => {
  for (const [name, failure] of FAILURES) if (!('deny' in failure)) expect({ name, value: parseExtract(failure) }).toEqual({ name, value: undefined })
  expect(parseExtract(ok('[]'))).toEqual([])
  expect(parseExtract(ok('["a","b"]\n'))).toEqual(['a', 'b'])
})

test('H11 a log with no prompt and a transcript with none is a result: the empty state with the log note', async ($, on) => {
  let stdout = '[]'
  const seen = logRoad(on, () => ok(stdout), () => SID, () => []) // an empty transcript too: F4 covers one that holds prompts
  for (const surface of SURFACES) {
    for (stdout of ['[]', JSON.stringify(['<task-notification>x</task-notification>', '   ', '<system-reminder>r</system-reminder>'])]) {
      const ui = await open($, surface)
      expect((await text(ui, /No messages yet/))?.text).toBe(' No messages yet')
      expect((await text(ui, LOG_NOTE))?.props.dimColor).toBe(true)
      expect(await text(ui, VIEWER_NOTE)).toBeUndefined()
      expect(await text(ui, /Could not read/)).toBeUndefined()
      expect(await text(ui, /^Message /)).toBeUndefined()
      await ui.press({ key: 'my-messages' }) // the empty state can be read again
      await ui.unmount()
    }
  }
  expect(seen.messages).toBe(8) // an empty log asks the transcript once (F4), and nothing in it changes the list
  expect(seen.argvs).toHaveLength(8)
})

test('H12 the cap note never shows on the log road', async ($, on) => {
  const many = JSON.stringify(Array.from({ length: 4096 }, (_, i) => `p${i}`))
  logRoad(on, () => ok(many))
  const ui = await open($)
  expect((await text(ui, 'Message 1 / 4096'))?.text).toBe('Message 1 / 4096')
  expect(await text(ui, /Only the newest 4096/)).toBeUndefined()
  await leave(ui)
})

const pages = async (ui: Mounted<'terminal' | 'desktop', 'AbovePrompt'>, n: number) => {
  const out: (string | undefined)[] = []
  for (let i = 0; i < n; i += 1) {
    expect((await text(ui, /^Message /))?.text).toBe(`Message ${i + 1} / ${n}`)
    out.push((await ui.findAll({ type: 'Text' })).at(-1)?.text)
    await ui.press({ key: 'next' })
  }
  return out
}

test('H13 one clean-up for both roads: the same rows give the same list from the log and from the transcript', async ($, on) => {
  expect(cleanPrompts(DIRTY)).toEqual(CLEAN)
  expect(personPrompts(DIRTY.map(u))).toEqual(CLEAN)
  let answer: Answer = ok(JSON.stringify(DIRTY))
  logRoad(on, () => answer, () => SID, () => DIRTY.map(u))
  let ui = await open($)
  expect(await text(ui, LOG_NOTE)).toBeDefined()
  expect(await pages(ui, 4)).toEqual(CLEAN)
  await leave(ui)
  answer = { deny: 'spawn node ENOENT' }
  ui = await open($)
  expect(await text(ui, VIEWER_NOTE)).toBeDefined()
  expect(await pages(ui, 4)).toEqual(CLEAN)
  await leave(ui)
})

test('H14 the log is read again on every press', async ($, on) => {
  let list = ['a', 'b']
  const seen = logRoad(on, () => ok(JSON.stringify(list)))
  const ui = await open($)
  expect((await text(ui, 'Message 1 / 2'))?.text).toBe('Message 1 / 2')
  await ui.press({ key: 'close' })
  list = ['a', 'b', 'c']
  await ui.press({ key: 'my-messages' })
  expect((await text(ui, 'Message 1 / 3'))?.text).toBe('Message 1 / 3')
  expect(seen.argvs).toHaveLength(2)
  await leave(ui)
})

test('H15 the open viewer counts the note it draws', () => {
  expect(viewerFixedRows(20, false, undefined, undefined, LOG_NOTE)).toBe(3 + textRows(LOG_NOTE, 20))
  expect(viewerFixedRows(20, false, undefined)).toBe(3 + textRows(VIEWER_NOTE, 20))
  expect(textRows(LOG_NOTE, 20)).not.toBe(textRows(VIEWER_NOTE, 20))
})

test('H16 a classic event with a session log path of its own changes nothing: the id goes, the answer is the one beneath', async ($, on) => {
  const seen = logRoad(on, two)
  const other = '/home/dev/.claude/projects/-work/11111111-2222-4333-8444-555555555555.jsonl'
  expect(await $.classic.UserPromptSubmit({ prompt: 'p', transcript_path: other })).toEqual({ additionalContext: ['from beneath'] })
  expect(await $.classic.SessionStart({ source: 'resume', transcript_path: other })).toEqual({ additionalContext: ['from beneath'] })
  const ui = await open($)
  expect(seen.argvs).toEqual([['node', '-e', EXTRACT, '--', SID]]) // the mod registers no classic hook (tools/agent-models-extract.test.mjs X17)
  await leave(ui)
})

// --- 1.3.2 review fixes: a persisted Loading, the prompts atom read only while shown, an empty log beside a host without origin ---

// A viewer state left in `$.state` by a read that died with the module (a hot reload): seeded until the first write.
const seedViewer = (on: On, seed: object) => {
  let isSeeded = true
  on('state.get', { plugin: 'agent-models', key: 'viewer' }, async (_, e, next) => {
    const answer = await next(e)
    if (!isSeeded || answer.value === undefined) return answer
    return { value: { value: seed, version: answer.value.version } }
  })
  on('state.set', { plugin: 'agent-models', key: 'viewer' }, (_, e, next) => {
    isSeeded = false
    return next(e)
  })
}

const mountBand = ($: Engine, surface: 'terminal' | 'desktop' = 'terminal') => $.ui.mount({ ...BAND, surface })

test('F1 a persisted Loading with no read in progress does not block the next press', async ($, on) => {
  seedViewer(on, { isOpen: true, index: 0, isCapped: false, isFailed: false, isLoading: true, isFromLog: false })
  const seen = logRoad(on, two)
  const ui = await mountBand($)
  expect(await text(ui, /Loading messages/)).toBeDefined()
  await ui.press({ key: 'my-messages' })
  expect(seen.argvs).toHaveLength(1)
  expect((await text(ui, 'Message 1 / 2'))?.text).toBe('Message 1 / 2')
  expect(await text(ui, /Loading messages/)).toBeUndefined()
  await leave(ui)
})

test('F2 the prompts atom is read only while the viewer is open', async ($, on) => {
  let reads = 0
  on('state.get', { plugin: 'agent-models', key: 'prompts' }, (_, e, next) => {
    reads += 1
    return next(e)
  })
  logRoad(on, two)
  const ui = await mountBand($)
  await ui.redraw()
  await ui.redraw()
  expect(reads).toBe(0)
  await ui.press({ key: 'my-messages' })
  expect(reads).toBeGreaterThan(0)
  expect((await text(ui, 'Message 1 / 2'))?.text).toBe('Message 1 / 2')
  await leave(ui)
})

test('F4 an empty log beside a transcript that holds prompts (a host without origin) shows the transcript list', async ($, on) => {
  const seen = logRoad(on, () => ok('[]'))
  const ui = await open($)
  expect(seen.messages).toBe(1)
  expect((await text(ui, 'Message 1 / 3'))?.text).toBe('Message 1 / 3')
  expect((await text(ui, /^From the /))?.text).toBe(VIEWER_NOTE)
  expect(await text(ui, LOG_NOTE)).toBeUndefined()
  await leave(ui)
})

// The rows the mod's own /login leaves in the log carry the mod's origin, so EXTRACT lists them; the clean-up drops them.
const LOGIN_ROWS = [
  '<local-command-caveat>Caveat: the messages below were generated by the user while running local commands.</local-command-caveat>',
  '<command-name>/login</command-name>\n<command-message>login</command-message>\n<command-args></command-args>',
  '<local-command-stdout>Login successful</local-command-stdout>',
]

test('F3 the rows of the mod\'s own /login are dropped, a note sent with Apply is kept (guard: WRAPPER_TAGS already held them)', async ($, on) => {
  expect(cleanPrompts(LOGIN_ROWS)).toEqual([])
  expect(cleanPrompts([...LOGIN_ROWS, 'a note sent with Apply'])).toEqual(['a note sent with Apply'])
  logRoad(on, () => ok(JSON.stringify([LOGIN_ROWS[0], 'a note sent with Apply', LOGIN_ROWS[1], LOGIN_ROWS[2]])))
  const ui = await open($)
  expect((await text(ui, /^Message /))?.text).toBe('Message 1 / 1')
  expect((await ui.findAll({ type: 'Text' })).at(-1)?.text).toBe('a note sent with Apply')
  await leave(ui)
})
