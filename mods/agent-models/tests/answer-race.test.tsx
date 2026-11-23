import { expect, test } from 'claude-code/testing'

import { LOOKUP_ROWS, RESTORE_ROWS } from '../hooks/answer'
import { start, TURN } from './account-fixtures'
import { answer, gate, held, KEY, macrotask, question, session, spin, submitOf, typed, valueOf } from './answer-fixtures'

// The `last answer` lookup under races (1.5.0): writes that land out of order, a session end during a read, the same words queued
// twice, the deep read. The transcript and the engine's calls are the stubs of `answer-fixtures.tsx`.

test('T16 two submits where the first one\'s write is slow: the value ends at the second', async ($, on) => {
  const s = session(on, [question('earlier', 'u0')])
  let release: () => void = () => undefined
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  let isHeld = false
  on('state.set', KEY, async (_, e, next) => {
    if (!isHeld && JSON.stringify(e.value).includes('"A"')) {
      isHeld = true
      await gate // A's write waits
    }
    return next(e)
  })
  await start($)
  s.rows = [...s.rows, question('A', 'u1'), question('B', 'u2')]
  await $.prompt.submit(submitOf('A'))
  await $.prompt.submit(submitOf('B'))
  await spin()
  release()
  await spin()
  await spin()
  const value = await held($, s)
  expect(value, 'B is the last question').toEqual({ uuid: 'u2', text: 'B' })
})

test('T17 a question with a long answer after it is found at turn.complete, not at turn.start', async ($, on) => {
  const s = session(on, [question('earlier', 'u0')])
  await start($)
  s.rows = [...s.rows, question('Q', 'u1'), ...Array.from({ length: 60 }, (_, i) => answer(`a${i}`))]
  await typed($, 'Q') // the newest 50 rows are all answers
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0', previousText: 'earlier' })
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0', previousText: 'earlier' })
  expect(s.reads.every(r => r.last !== 4096), 'turn.start reads the newest 50 only').toBe(true)
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u1', text: 'Q' })
  expect(s.reads.at(-1)).toEqual({ last: 4096 })
})

test('T17b the deep read stops at previous: an older row with the same text is not taken', async ($, on) => {
  const s = session(on, [question('Q', 'u0')])
  await start($)
  s.rows = [...s.rows, ...Array.from({ length: 60 }, (_, i) => answer(`a${i}`))]
  await typed($, 'Q') // the new Q is not in the transcript; u0 is the question before it
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0', previousText: 'Q' })
})

test('T18 a session end while a submit\'s transcript read is in flight: the value stays cleared', async ($, on) => {
  const s = session(on)
  await start($)
  s.rows = [question('Q', 'u1')]
  const g = gate()
  s.hold = { last: LOOKUP_ROWS, wait: g.wait } // the submit's lookup read waits
  const submitting = $.prompt.submit(submitOf('Q'))
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q' })
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  await spin()
  expect(valueOf(s)).toBeNull()
  g.release()
  await submitting
  await spin()
  expect(valueOf(s), 'the lookup that lands after the end writes nothing').toBeNull()
  expect(await held($, s)).toBeNull()
})

test('T19 a session start whose restore read is slow, then a session end: the value stays null', async ($, on) => {
  const s = session(on, [question('Q', 'u1')])
  const g = gate()
  s.hold = { last: RESTORE_ROWS, wait: g.wait } // the restore's read waits; the session start itself does not
  const starting = $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  for (let i = 0; i < 100 && s.reads.length === 0; i += 1) await macrotask(5) // until the restore's read is issued (and held)
  expect(s.reads, 'the restore began before the end').toEqual([{ last: RESTORE_ROWS }])
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  await spin()
  g.release()
  await starting
  await spin()
  expect(valueOf(s), 'the restore that lands after the end writes nothing').toBeNull()
  expect(await held($, s)).toBeNull()
})

test('T20 the same text queued twice before either has a row: the first copy settles, a later second row does not move it', async ($, on) => {
  const s = session(on, [question('first', 'u0')])
  await start($)
  await typed($, 'Q')
  await typed($, 'Q  ') // the same clean text again: no copy count, the value keeps its shape
  expect(valueOf(s)).toEqual({ pending: 'Q  ', previous: 'u0', previousText: 'first' })
  s.rows = [...s.rows, question('Q', 'u1')] // the first copy is in the transcript, the second is not
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(valueOf(s), 'u1 is the first copy: it settles at once').toEqual({ uuid: 'u1', text: 'Q' })
  s.rows = [...s.rows, answer('a1'), question('Q', 'u2')]
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s), 'the second row appearing later does not move it').toEqual({ uuid: 'u1', text: 'Q' })
})

test('T20b a stored value that still carries a queued count (a 1.5.0 candidate) reads fine: the field is ignored', async ($, on) => {
  const s = session(on, [question('Q', 'u1'), answer('a1'), question('Q', 'u2')])
  s.seed = Object.assign({ pending: 'Q', previous: 'u1' }, { queued: 1 }) // a stored value, not a literal of the type
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(valueOf(s), 'one copy newer than previous settles: no wait for a second').toEqual({ uuid: 'u2', text: 'Q' })
})

test('T20d a retry still in flight when a newer submit lands writes nothing of its own', async ($, on) => {
  const s = session(on, [question('first', 'u1')])
  await start($)
  await typed($, 'Q')
  s.rows = [...s.rows, question('Q', 'u2')]
  const g = gate()
  s.hold = { last: LOOKUP_ROWS, wait: g.wait }
  const reads = s.reads.length
  await $.turn.complete(TURN)
  for (let i = 0; i < 100 && s.reads.length === reads; i += 1) await macrotask(5) // the retry's read is issued (and held)
  const written = s.writes.length
  await typed($, 'other') // a newer submit: the retry's answer is for the older one
  expect(valueOf(s)).toEqual({ pending: 'other', previous: 'u1', previousText: 'first' })
  g.release()
  await spin()
  expect(s.writes.slice(written).every(w => w !== null && 'pending' in w && w.pending === 'other'), 'only the newer submit wrote').toBe(true)
  expect(valueOf(s)).toEqual({ pending: 'other', previous: 'u1', previousText: 'first' })
})

test('T22 a question typed into a running turn never gets a row; sent again after the turn, its row settles it', async ($, on) => {
  const s = session(on)
  await start($)
  s.rows = [question('A', 'u1')]
  await typed($, 'A')
  expect(valueOf(s)).toEqual({ uuid: 'u1', text: 'A' })
  s.rows = [...s.rows, answer('a1')] // A's turn runs
  await typed($, 'Q') // typed into the running turn: it will never be a message of its own
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u1', previousText: 'A' })
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s), 'not found: still pending, the press goes to A').toEqual({ pending: 'Q', previous: 'u1', previousText: 'A' })
  s.rows = [...s.rows, answer('a2')]
  await typed($, 'Q') // sent again when the turn is over
  s.rows = [...s.rows, question('Q', 'u2')]
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(valueOf(s), 'the re-sent row settles it: no wait for a second copy').toEqual({ uuid: 'u2', text: 'Q' })
})

test('T22b T22 after a reload: a fresh module with the stored pending value settles on the re-sent row', async ($, on) => {
  const s = session(on, [question('A', 'u1'), answer('a1'), answer('a2')])
  s.seed = { pending: 'Q', previous: 'u1' } // what the first Q left in the stored state
  await typed($, 'Q') // sent again; this module has no memory of the first one
  s.rows = [...s.rows, question('Q', 'u2')]
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u2', text: 'Q' })
})

test('T23 no question settled in this session: an older row with the same text in the window and the new row give the newest', async ($, on) => {
  const s = session(on, [question('Q', 'u0'), answer('a0'), question('other', 'u1'), question('Q', 'u2')])
  await typed($, 'Q') // no session.start: nothing restored, the value was null
  expect(valueOf(s)).toEqual({ uuid: 'u2', text: 'Q' })
})

test('T24 a turn.start lookup held in flight, then a session end: the value stays null after the lookup lands', async ($, on) => {
  const s = session(on, [question('first', 'u1')])
  await start($)
  await typed($, 'Q')
  s.rows = [...s.rows, question('Q', 'u2')]
  const g = gate()
  s.hold = { last: LOOKUP_ROWS, wait: g.wait }
  const reads = s.reads.length
  await $.turn.start({ text: 'Q', turnId: 't2' })
  for (let i = 0; i < 100 && s.reads.length === reads; i += 1) await macrotask(5) // the retry's read is issued (and held)
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  await spin()
  expect(valueOf(s)).toBeNull()
  g.release()
  await spin()
  expect(valueOf(s), 'the lookup that lands after the end writes nothing').toBeNull()
  expect(await held($, s)).toBeNull()
})

test('T24b the same, and the same words typed in the new session: the old lookup does not settle them on an old row', async ($, on) => {
  const s = session(on)
  await start($)
  await typed($, 'Q') // no row yet, no question before it: pending with no previous
  expect(valueOf(s)).toEqual({ pending: 'Q' })
  s.rows = [question('Q', 'old-row')]
  const g = gate()
  s.hold = { last: LOOKUP_ROWS, wait: g.wait } // the retry reads (and holds) the old session's transcript
  const reads = s.reads.length
  await $.turn.start({ text: 'Q', turnId: 't2' })
  for (let i = 0; i < 100 && s.reads.length === reads; i += 1) await macrotask(5)
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  s.rows = [] // the new session's transcript is empty
  await typed($, 'Q') // the same words, nothing before them: the same shape as the old pending value
  expect(valueOf(s)).toEqual({ pending: 'Q' })
  g.release()
  await spin()
  expect(valueOf(s), 'the old session\'s row is never the new session\'s question').toEqual({ pending: 'Q' })
})

test('T21 the deep read is made only when the newest rows do not hold previous', async ($, on) => {
  const s = session(on, [...Array.from({ length: 20 }, (_, i) => answer(`b${i}`)), question('Q', 'u0')])
  await start($)
  s.rows = [...s.rows, ...Array.from({ length: 30 }, (_, i) => answer(`a${i}`))] // 51 rows: u0 is among the newest 50
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0', previousText: 'Q' })
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0', previousText: 'Q' })
  expect(s.reads.every(r => r.last !== 4096), 'previous is in the newest 50 and nothing is newer: no deep read').toBe(true)
})

test('T21b with no previous the deep read still runs', async ($, on) => {
  const s = session(on, Array.from({ length: 60 }, (_, i) => answer(`a${i}`)))
  await start($)
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ pending: 'Q' })
  await $.turn.complete(TURN)
  await spin()
  expect(s.reads.at(-1)).toEqual({ last: 4096 })
})
