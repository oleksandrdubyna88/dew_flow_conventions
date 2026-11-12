import { expect, test } from 'claude-code/testing'

import { accountWrites, band, base, identities, identityOf, SEC, spin, start, text } from './account-fixtures'
import { ownClock } from './limits-fixtures'

// The tick's account retry (1.4.0) counts its own ticks and asks no clock; the timer starts from the first draw too.

test('R1 the draw started the read and its write was refused: idle, the tick reads again within about a minute', async ($, on) => {
  const clock = base(on)
  const asked = identities(on, [() => identityOf('dev@example.com')])
  accountWrites(on, n => (n <= 2 ? 'deny' : undefined)) // the session start read's write, then the draw's: both refused
  await start($)
  const ui = await band($) // the draw reads the unread account and stamps its own throttle
  await spin()
  expect(asked.n).toBe(2)
  await ui.unmount()
  await clock.advance(62 * SEC) // no draw, no turn
  await spin()
  expect(asked.n, 'the tick read again').toBe(3)
  const again = await band($)
  expect(await text(again, 'dev@example.com')).toBeDefined()
  await again.unmount()
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
  for (let i = 0; i < 31; i += 1) await clk.tick(2 * SEC)
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
  await clock.advance(62 * SEC)
  await spin()
  expect(asked.n, 'the timer the draw started read again').toBe(2)
  await ui.redraw()
  expect(await text(ui, 'dev@example.com')).toBeDefined()
  await ui.unmount()
})
