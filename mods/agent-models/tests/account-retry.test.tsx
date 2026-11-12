import { expect, mock, test } from 'claude-code/testing'

import { accountWrites, band, base, identities, identityOf, SEC, spin, start, text, TURN } from './account-fixtures'
import { ownClock } from './limits-fixtures'

// The tick's account retry (1.4.0) counts its own ticks and asks no clock; the timer starts from the first draw too.

test('R1 the clock stands still after the draw stamped its throttle: the tick still reads again by its own count', async ($, on) => {
  const clk = ownClock(on, 0)
  const asked = identities(on, [() => identityOf('dev@example.com')])
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  accountWrites(on, n => (n <= 2 ? 'deny' : undefined)) // the session start read's write, then the draw's: both refused
  await start($)
  const ui = await band($) // the draw reads the unread account and stamps its throttle at time 0
  await spin()
  expect(asked.n).toBe(2)
  for (let i = 0; i < 33; i += 1) await clk.tick(0) // timer periods pass, the clock does not: the draw's throttle can never pass
  expect(asked.n, 'the tick read again').toBe(3)
  await ui.redraw()
  expect(await text(ui, 'dev@example.com')).toBeDefined()
  await ui.unmount()
})

test('R2 a clock that is refused for every call: the tick still reads again within about a minute', async ($, on) => {
  const clk = ownClock(on, 0)
  const asked = identities(on, [() => identityOf('dev@example.com')])
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: [] }))
  accountWrites(on, n => (n <= 2 ? 'deny' : undefined))
  clk.isRefused = true // the draw's throttle reads 0 for every call, so it can never pass again
  await start($)
  const ui = await band($)
  await spin()
  expect(asked.n).toBe(2)
  for (let i = 0; i < 33; i += 1) await clk.tick(2 * SEC)
  expect(asked.n, 'the tick read again without the clock').toBe(3)
  await ui.unmount()
})

test('R3 no session start: the first draw starts the timer, so a refused write of the draw read is retried', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [() => identityOf('dev@example.com')])
  accountWrites(on, n => (n === 1 ? 'deny' : undefined))
  const ui = await band($) // no session.start at all: the band draws, reads once, the write is refused
  await spin()
  expect(asked.n).toBe(1)
  await clock.advance(64 * SEC)
  await spin()
  expect(asked.n, 'the timer the draw started read again').toBe(2)
  await ui.redraw()
  expect(await text(ui, 'dev@example.com')).toBeDefined()
  await ui.unmount()
})

test('R4 a timer a draw started was refused: the session start that follows starts a working one', async ($, on) => {
  const clk = ownClock(on, 0)
  clk.everyRefusals = 1 // the draw's `clock.every` never fires
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  let lists = 0
  on('agent.list', () => {
    lists += 1
    return { value: [] }
  })
  identities(on, [() => identityOf('dev@example.com')])
  const ui = await band($) // the first draw makes the refused timer
  await start($) // the session start must not trust it
  for (let i = 0; i < 3; i += 1) await clk.tick(2 * SEC)
  expect(lists, 'the session start made a timer that fires').toBe(3)
  await ui.unmount()
})

test('R5 a draw first, then the session start: one timer remains, one refresh per period', async ($, on) => {
  const clock = mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  let lists = 0
  on('agent.list', () => {
    lists += 1
    return { value: [] }
  })
  identities(on, [() => identityOf('dev@example.com')])
  const ui = await band($)
  await start($)
  await spin()
  lists = 0
  await clock.advance(10 * SEC)
  expect(lists, 'five periods, one timer').toBe(5)
  await ui.unmount()
})

test('R6 a read of any kind restarts the tick count: a turn-started read at 40 s defers the tick retry to a minute after it', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [() => identityOf('dev@example.com')])
  accountWrites(on, () => 'deny') // no write ever lands: the account stays unread
  await start($)
  expect(asked.n).toBe(1)
  await clock.advance(40 * SEC)
  await $.turn.complete(TURN) // an unread account is read again
  await spin()
  expect(asked.n).toBe(2)
  await clock.advance(24 * SEC) // 64 s in: a tick count kept since the session start would have retried at 62 s
  await spin()
  expect(asked.n, 'the turn-started read restarted the count').toBe(2)
  await clock.advance(40 * SEC) // 104 s in: 31 ticks after the turn-started read
  await spin()
  expect(asked.n).toBe(3)
})
