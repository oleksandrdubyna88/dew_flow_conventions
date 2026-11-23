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
  expect(value, 'B is the last question').toEqual({ uuid: 'u2' })
})

test('T17 a question with a long answer after it is found at turn.complete, not at turn.start', async ($, on) => {
  const s = session(on, [question('earlier', 'u0')])
  await start($)
  s.rows = [...s.rows, question('Q', 'u1'), ...Array.from({ length: 60 }, (_, i) => answer(`a${i}`))]
  await typed($, 'Q') // the newest 50 rows are all answers
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0' })
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0' })
  expect(s.reads.every(r => r.last !== 4096), 'turn.start reads the newest 50 only').toBe(true)
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  expect(s.reads.at(-1)).toEqual({ last: 4096 })
})

test('T17b the deep read stops at previous: an older row with the same text is not taken', async ($, on) => {
  const s = session(on, [question('Q', 'u0')])
  await start($)
  s.rows = [...s.rows, ...Array.from({ length: 60 }, (_, i) => answer(`a${i}`))]
  await typed($, 'Q') // the new Q is not in the transcript; u0 is the question before it
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0' })
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

test('T20 the same text queued twice: the second settles on its own row, not the first one\'s', async ($, on) => {
  const s = session(on)
  await start($)
  s.rows = [question('Q', 'u1')]
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ uuid: 'u1' })
  s.rows = [...s.rows, answer('a1')] // a turn runs: both copies below wait behind it
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u1' })
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u1', queued: 1 })
  s.rows = [...s.rows, question('Q', 'u2')] // the first copy is in the transcript, the second is not
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(valueOf(s), 'u2 is the first copy: the second one is still waiting').toEqual({ pending: 'Q', previous: 'u1', queued: 1 })
  s.rows = [...s.rows, answer('a2'), question('Q', 'u3')]
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u3' })
})

test('T20b after a reload the stored queued count is still the index (this module has no memory of it)', async ($, on) => {
  const s = session(on, [question('Q', 'u1'), answer('a1'), question('Q', 'u2')])
  s.seed = { pending: 'Q', previous: 'u1', queued: 1 }
  await $.turn.start({ text: 'Q', turnId: 't2' })
  await spin()
  expect(s.writes, 'one copy only: nothing settles').toEqual([])
  s.rows = [...s.rows, answer('a2'), question('Q', 'u3')]
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ uuid: 'u3' })
})

test('T20c a different text or a settled value starts the count again', async ($, on) => {
  const s = session(on, [question('first', 'u1')])
  await start($)
  await typed($, 'Q')
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u1', queued: 1 })
  await typed($, 'other')
  expect(valueOf(s), 'other words: no queued').toEqual({ pending: 'other', previous: 'u1' })
  await typed($, 'other  ')
  expect(valueOf(s), 'the same clean text counts').toEqual({ pending: 'other  ', previous: 'u1', queued: 1 })
})

test('T20d a copy queued while a lookup is in flight: the lookup\'s answer does not settle the newer count', async ($, on) => {
  const s = session(on, [question('first', 'u1')])
  await start($)
  await typed($, 'Q')
  s.rows = [...s.rows, question('Q', 'u2')]
  const g = gate()
  s.hold = { last: LOOKUP_ROWS, wait: g.wait }
  const reads = s.reads.length
  await $.turn.complete(TURN)
  for (let i = 0; i < 100 && s.reads.length === reads; i += 1) await macrotask(5) // the retry's read is issued (and held)
  await typed($, 'Q') // a second copy: the retry read the value before it
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u1', queued: 1 })
  g.release()
  await spin()
  expect(valueOf(s), 'u2 is the first copy; the value now waits for the second').toEqual({ pending: 'Q', previous: 'u1', queued: 1 })
})

test('T21 the deep read is made only when the newest rows do not hold previous', async ($, on) => {
  const s = session(on, [...Array.from({ length: 20 }, (_, i) => answer(`b${i}`)), question('Q', 'u0')])
  await start($)
  s.rows = [...s.rows, ...Array.from({ length: 30 }, (_, i) => answer(`a${i}`))] // 51 rows: u0 is among the newest 50
  await typed($, 'Q')
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0' })
  await $.turn.complete(TURN)
  await spin()
  expect(valueOf(s)).toEqual({ pending: 'Q', previous: 'u0' })
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
