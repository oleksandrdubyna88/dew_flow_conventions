import type { On, ProcessRunResult, SessionMessage } from 'claude-code'

// The fixtures of the session-log tests (viewer.test.tsx, tasks-race.test.tsx): a session id, the engine
// under the mod (the id, the node run with its argv recorded, the transcript, the classic bottoms), every failure of the
// node run, and one list of rows for the clean-up of both roads. Not a test file: it adds no test child.

const u = (text: string): SessionMessage => ({ role: 'user', text, toolUses: [] })
export const TRANSCRIPT = [u('first'), u('second'), u('third')]
export const SID = '0f0e0d0c-aaaa-4bbb-8ccc-123456789abc'
export const ok = (stdout: string): ProcessRunResult => ({ exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false })
export type Answer = ProcessRunResult | { deny: string }
export const SIGNED_OUT = ok(JSON.stringify({ loggedIn: false }))
// The engine under the mod: the session id, the node run (its argv recorded), the transcript, the classic bottoms.
export const logRoad = (
  on: On,
  answer: () => Answer | Promise<Answer>,
  id: () => string | { deny: string } = () => SID,
  transcript: () => SessionMessage[] = () => TRANSCRIPT,
) => {
  const seen = { argvs: [] as (readonly string[])[], timeouts: [] as (number | undefined)[], ids: 0, messages: 0 }
  on('agent.list', () => ({ value: [] }))
  on('session.id', () => {
    seen.ids += 1
    const value = id()
    return typeof value === 'string' ? { value } : value
  })
  on('process.run', async (_, e) => {
    if (e.argv[0] !== 'node') return { value: SIGNED_OUT } // the band's own account read (claude auth status), never recorded
    seen.argvs.push(e.argv)
    seen.timeouts.push(e.init?.timeoutMs)
    const a = await answer()
    return 'deny' in a ? a : { value: a }
  })
  on('session.messages', () => {
    seen.messages += 1
    return { value: transcript() }
  })
  on('classic.UserPromptSubmit', () => ({ additionalContext: ['from beneath'] }))
  on('classic.SessionStart', () => ({ additionalContext: ['from beneath'] }))
  return seen
}
export const two = () => ok(JSON.stringify(['typed first', 'typed second']))
const cut = { ...ok('["only the start"]'), isStdoutTruncated: true }
export const FAILURES: [string, Answer][] = [
  ['node cannot start', { deny: 'spawn node ENOENT' }],
  ['a timeout', { deny: 'timed out' }],
  ['exit 1', { ...ok('["a"]'), exitCode: 1 }],
  ['exit 2', { ...ok(''), exitCode: 2 }],
  ['cut output', cut],
  ['empty output', ok('')],
  ['not JSON', ok('[\"a\"')],
  ['an object', ok('{"0":"a"}')],
  ['a string', ok('"a"')],
  ['null', ok('null')],
  ['a number among the strings', ok('["a",1]')],
  ['a nested array', ok('[["a"]]')],
]

export const DIRTY = ['  keep me  ', 'a<system-reminder>r</system-reminder>b', '<ide_opened_file>f</ide_opened_file>\nwhy?',
  '<task-notification>x</task-notification>', '<system-reminder>only</system-reminder>', '   ', '', '<div>mine</div>']
export const CLEAN = ['keep me', 'ab', 'why?', '<div>mine</div>']
