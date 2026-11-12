# PLAN — agent-models mod 1.4.0: the 5-hour reset time, and an account read that always ends

> Status: **shipped 2026-11-12, owner checks pending.** #165 merged (`4c9a684`), `release` promoted to it, all nine
> consumer pin bumps merged; the installed copy on this WSL upgraded 1.3.3 → 1.4.0 by a consumer session start. The
> plan moves to `research/` once the owner reports the two checks below. Scope: `mods/agent-models/` (limits line, account read,
> version 1.4.0, the mod's own tests), the released-copy table in `settings/hooks/lib/agent-models-decide.mjs` (and its
> `.claude/hooks` mirror), the new row of `tools/agent-models-pins.json`, then one `release` promotion and the pin bumps
> of the nine consumers. Parent: [PLAN_agent_models_mod.md](../research/PLAN_agent_models_mod.md) § *Follow-ups*
> (the first bullet; only its first two items are in this plan).

## Goal (the owner's words, 2026-11-12)

1. "The 5-hour reset time is not built yet. Your line `5h 2% left · resets in 1h 23m` … build it." The text the owner
   approved on 2026-11-11: `5h 2% left · resets in 1h 23m · week 42% left · Fable 55% left`. The colour of the time,
   the owner's words: "under 10 minutes green, from 10 to 30 minutes orange, over 30 minutes red."
2. "`account ?` can still show in a resumed session. The account read has no time limit yet … fix it."

Not in this plan (the owner asked for these two only): the other four 1.4.0 items of the parent's follow-up list
(double submit of a task, the viewer's prompt cap, the A→B→A limits line, the viewer's refused writes), Windows, and
the guard and step follow-ups.

## What the code does today (read 2026-11-12 at `b321744`)

- **The limits line keeps three numbers and a label, nothing else**: `limitsFromBody` reads
  `five_hour.utilization`, `seven_day.utilization` and the Fable `weekly_scoped` entry
  (`mods/agent-models/hooks/limits.tsx:50-63`); the type says "NOTHING else" (`types/index.d.ts`, `Limits`). The
  usage answer also carries `five_hour.resets_at`, an ISO 8601 string or `null` (the Claude Code 2.1.322 binary's own
  schema: `resets_at: string().nullable()`, "ISO 8601 timestamp when the window resets").
- **The line is built from parts** (`limits.tsx:69-77`), each number coloured by `limitColor` (`:65-67`), drawn by
  `limitsRow` (`:180-195`). The draw asks the clock only while a login is pending (`register.tsx:307`), and nothing
  redraws the band on a timer: the 2 s `refresh` writes `rows` only when the agent rows change
  (`register.tsx:20-33`, `:257`).
- **The account read has no ceiling, and nothing retries an unread account while the band is idle.** `readOnce`
  (`prompts.ts:234`) awaits `$.session.identity()` (`:239`) with no time limit; only the `claude auth status`
  fallback has one (`STATUS_TIMEOUT_MS`, `:97`). `readAccount` is a single flight (`:260-279`): while `inFlight` is
  set no other read starts. The draw starts a read only for `{ kind: 'unread' }` (`register.tsx:306`) and at most once
  a minute, stamped BEFORE the read (`prompts.ts:286-292`); `turn.complete` reads only when a turn ends
  (`register.tsx:36-49`). An idle band is drawn again only when a state value it read is written.
- **The cause of the owner's bare `account ?` is NOT proven** (no log was kept). Each of these leaves
  `{ kind: 'unread' }` with no suffix (`accountLabel`, `prompts.ts:191-199`) until a turn ends, and the code allows each:
  (H1) `identity()` never settles, so `inFlight` stays set for the session — less likely, its doc says "No request is
  made" (claude-code.d.ts `identity`); (H2) the state write of the read is refused (the session not bound yet,
  `register.tsx:31`), the throttle stamp is already set, and an idle band is never drawn again; (H3) an in-process
  `/resume` raises no `session.start` while the module's `inFlight`/`drawReadAt` carry over. The fix below covers all
  three, so it does not depend on which one it was.

## Plan changes

> Epoch 1 · approved 2026-11-12 · by reviewers · state: open

  (The findings accepted at the approving round — 4 of 5 from the gate and 13 from the Opus review — are the baseline
  this epoch was approved on and are written into the text below, not counted as changes.)
- 1.1 · 2026-11-12 · reviewer · approach — the code round's Opus review: the 30 s ceiling wrote `read timed out` over a signed-in email; the ceiling now keeps a known account
  (The code round's other accepted findings only make the code do what this text already says — the queued read
  before any await, a tick retry that does not depend on the clock, the timer started by the draw too, one clock
  read per draw, a test that tested nothing — and are not changes. Three low findings were not taken; see
  § Follow-ups.)

## Design

### A. The reset time (limits.tsx, types/index.d.ts, register.tsx)

- `Limits` gains ONE field, `fiveHourResetsAt: number | null` — epoch milliseconds from `Date.parse` of
  `five_hour.resets_at`, accepted only when the string is ISO 8601 WITH an offset (`Z` or `±hh:mm`; a string without
  one would parse as local time) and parses to a finite number; else `null`. The type comment says four values now.
  Nothing else of the answer is kept.
- The line: `5h 2% left · resets in 1h 23m · week 42% left · Fable 55% left`. The part `resets in ` is plain text and
  the value is its own part, as `left` and the numbers are today. Not known (`null`, the clock refused, or a reset
  time already passed): `resets in —`, the existing "a missing value is a dash" rule, no colour.
- The time is computed at DRAW time, never stored as text: `m = floor((resetsAt − now) / 60 000)` with `now` from
  `$.clock.now()` (epoch ms) read by the draw in its OWN try/catch — a refused clock draws `—`, never a time from 0.
  `m ≥ 60` → `${h}h ${m % 60}m` (`1h 0m` kept, so the shape never jumps); `1 ≤ m < 60` → `${m}m`;
  `0 ≤ remaining < 60 s` → `<1m`; `now ≥ resetsAt` → `—`.
- Colour of the value only: `m < 10` green `LOGIN_COLOR` `#22c55e`; `10 ≤ m ≤ 30` orange `ACCOUNT_COLOR` `#f97316`;
  `m > 30` red `CLOSE_COLOR` `#ef4444`. **Interpretation, recorded:** the bands are taken on the whole minutes the
  text shows, so 30 m 59 s shows `30m` and is orange; 31 m 0 s is red. `<1m` is green.
- **It counts down while open.** A new state key `limitsMinute: number | null` holds the DRAWN minute (`m`, or `null`
  when the value is `—`). The draw reads it, which subscribes the band: the engine draws a state value's readers
  again when it is written (reference.md, `$.state`: "a later `$.state.set` draws exactly the readers again"). A
  function in `limits.tsx` (the atom is written in the file that defines it, `limits.tsx:22`), called by the existing
  2 s tick (`register.tsx:257`), computes `m` and writes it only while the line is open and only when it differs —
  at most one write a minute, none while closed. One number: no growth surface.
- **A passed reset fetches again.** When the line is open and `now ≥ resetsAt`, the same tick calls `fetchLimits`
  under its existing throttle (`lastEnd`, one fetch a minute, `limits.tsx:93-141`), so the stale `5h 2% left` is
  replaced by the new window's numbers; until then the time is `—`.
- `limitsText`/`limitsLine` take `now`; the viewer's row count (`viewerFixedRows`, `register.tsx:190`) uses the same
  `now` as the draw, so the longer line is counted when it wraps.
- The draw asks the clock only when the limits line is open with a value; an idle closed band still never asks.

### B. An account read that always ends, and a retry that does not wait for a turn (prompts.ts, register.tsx)

- `IDENTITY_TIMEOUT_MS = 5 000`: `$.session.identity()` races a `$.clock.after` ceiling (the pattern of
  `fetchLimits`, `limits.tsx:105-124`, timer cancelled in `finally`). On the ceiling the read goes on to the
  `claude auth status` road as on a deny, so a signed-in session still shows its email. The abandoned identity
  promise gets a `.catch` (no unhandled rejection) and its late answer is never used.
- `READ_CEILING_MS = 30 000` (≥ identity 5 s + status 10 s + margin): inside `readAccount` each `readOnce` races one
  more ceiling and carries a generation number. On the ceiling: `inFlight` is cleared FIRST (before any await, as
  that write can hang too); if a read was queued meanwhile (`again`, e.g. a login settled), a new read starts at
  once, before any await; then, only while the account is `unread` or `unknown` (change 1.1: a signed-in or
  signed-out account is KEPT, as in 1.3.3 — a slow re-read never hides a known email), the state gets
  `{ kind: 'unknown', suffix: 'read timed out', readAt }` — a NEW `AccountSuffix`, so it is told apart from the status
  run's own `timed out`. A late result of the abandoned read writes nothing (its generation is not the live one), and
  a result that was written just as the ceiling fired is not overwritten by it.
- **The retry no longer waits for a draw or a turn.** The 2 s tick (`register.tsx:257`) calls the throttled draw
  read (`readAccountOnDraw`, at most one start a minute) whenever the account is `unread`, or `unknown` and older than
  `READ_INTERVAL_MS`. The draw's own trigger widens the same way. So H1, H2 and H3 all end within about a minute,
  idle or not. A signed-in or signed-out account is not read by the tick (no process a minute while idle).
- **Known limits, written in the code comment:** a timer is a clock dispatch, and a refused `$.clock.after` does not
  throw — its callback never runs (claude-code.d.ts `TimerCall`: "never when a hook refuses it"). With timers refused
  the ceilings and the 2 s tick do not run, and the read behaves as in 1.3.3 (no worse). With `$.clock.now` refused,
  `nowOrZero` gives 0 and the draw-read throttle can block retries; the tick is then the only retry, so the tick's retry counts its own ticks (about one a minute) and does not use the clock. The tick timer is started by the first draw too, not only by `session.start`. A hot reload
  cancels the old environment's timers: an old read in flight then has no ceiling and its late answer (a real answer)
  can still be written; each abandoned read leaves at most one unsettled `identity()` promise, at most one a minute.

### C. Version and release

- `plugin.json` version `1.4.0`. `tools/agent-models-pins.json` gets the `1.4.0` row (raw sha256 of the 7 files);
  `RELEASED_MOD` in `settings/hooks/lib/agent-models-decide.mjs` and its `.claude/hooks/lib` copy become that row (the
  existing tests fail when the two differ, or when the row is not the files at HEAD). The installed 1.3.3 upgrades by
  the existing swap on the next session start in a consumer that pins the new release.
- After the merge: one `release` promotion (`promote-release.yml`), then a pin bump in each of the nine consumers.
  Before the promotion the owner is asked about in-flight consumer releases and the open-PR counts (the PR cap).

## Follow-ups (not built here; low findings of the code round, kept out so the plan does not change twice)

- An account that stays `unknown` for a reason that will not pass by itself (`claude not on PATH`, `claude exited N`)
  is read again once a minute while idle: one `claude auth status` process a minute. A back-off, or a retry only
  after a timeout.
- A refetch that the tick started after a passed reset and that fails turns the line into `limits unavailable`, and
  the tick does not try again until a press. Keep the old numbers on such a failure, or retry while open.
- The `resets_at` check accepts only `Z` and `±hh:mm`; a lowercase `z` or `+0530` becomes a dash. A reset time far in
  the future (more than about 6 h) is drawn as it is; it could be a dash.

## Files

`mods/agent-models/hooks/limits.tsx` (parser, parts, colour, the tick function, the passed-reset fetch),
`hooks/prompts.ts` (ceilings, generation, suffix, the widened retry), `hooks/register.tsx` (the tick calls, the
draw's clock and `limitsMinute` read, `viewerFixedRows` with `now`), `types/index.d.ts` (`Limits`, `AccountSuffix`,
`limitsMinute` in `PluginState`), `.claude-plugin/plugin.json`, the tests and fixtures under `tests/`
(`limits-fixtures.tsx`: the fixture clock set near the fixture's `resets_at`, `L1`/`NONE` updated),
`settings/hooks/lib/agent-models-decide.mjs` + `.claude/hooks/lib/agent-models-decide.mjs`,
`tools/agent-models-pins.json`.

## Build order

1. Plan round (coai `review_plan` + an Opus review at once) until `proceed`.
2. RED: the new tests below, watched failing for the right reason.
3. GREEN: A, then B (Sonnet coder per the role table; the caller reviews).
4. Version, pin row, `RELEASED_MOD` + mirror; `node --test tools/` and `claude plugin test mods/agent-models` green;
   `claude plugin validate` passes; `tsc` clean.
5. Code round (coai `review_code` + an Opus review), fixes, PR, checks, threads, merge.
6. Ask the owner, promote `release`, nine pin bumps, merge each.
7. Owner checks (below); promote this plan to `research/`.

## Test plan (mod tests run by `claude plugin test mods/agent-models`; installer tests by `node --test`)

| # | Case | Expected |
|---|---|---|
| A1 | body with `five_hour.resets_at` `…Z`, `…+00:00`, `….123456+00:00` | `fiveHourResetsAt` = the `Date.parse` value |
| A2 | `resets_at` null / absent / number / `"garbage"` / `"2026-11-12T10:00:00"` (no offset) | `null` |
| A3 | line, 83 min left | `5h 2% left · resets in 1h 23m · week 42% left · Fable 55% left` |
| A4 | 60 min, 59 min, 1 min, 59 s, 0 s, −5 min | `1h 0m`, `59m`, `1m`, `<1m`, `—`, `—` |
| A5 | colours at 9 m 59 s, 10 m, 30 m 0 s, 30 m 30 s, 31 m | green, orange, orange, orange, red; only the value coloured |
| A6 | `fiveHourResetsAt` null | `resets in —`, no colour |
| A7 | line open, clock moves 1 min; a `state.get` hook beneath the plugin | the draw reads `limitsMinute`; it is written once; after the redraw the time is one minute less |
| A8 | line closed, clock moves | no `limitsMinute` write, no clock read by the draw |
| A9 | viewer row count at a narrow width | counts the longer limits line with the draw's `now` |
| A10 | `clock.now` refused at draw, line open | `resets in —`, no colour |
| A11 | line open, `now ≥ resetsAt`, last fetch over a minute ago | the tick starts one fetch; a second tick within a minute starts none |
| B1 | `identity()` never settles, status answers an email | after 5 s the email is drawn |
| B2 | `identity()` and the status run never settle | after 30 s `account ? (read timed out)`, `isAccountReading()` false |
| B3 | late answer of an abandoned read | writes nothing; a newer read's result stays |
| B4 | after B2, idle (no draw, no turn), a minute later | the tick starts a new read |
| B5 | the read's state write refused once, then idle | the tick reads again within about a minute; the email is drawn |
| B6 | state back to `unread` with no `session.start` (resume) | the tick reads; the email is drawn |
| B7 | a read queued (`again`) while the hung read hits the ceiling | a new read starts at once |
| B8 | `$.clock.after` refused (callback never runs) | the read behaves as in 1.3.3; nothing throws |
| B9 | signed-in account, idle for 3 minutes | the tick starts no read |
| B10 | the existing 233 mod tests, after the fixture update of § Files | pass |
| C1 | existing `tools/agent-models-pin.test.mjs` | newest row = HEAD files = `RELEASED_MOD` |

## Owner checks after the rollout (a session cannot do these for itself)

- A new session: press the email, see `resets in …` with the right colour, and watch it count down one minute.
- A resumed session: the band shows the email (or `account ? (read timed out)`), never a bare `account ?` for more than about a minute.

## Definition of Done

- [x] Plan round `proceed`; code round `proceed`; Opus reviews done, findings fixed or answered.
- [x] Tests A1–A11, B1–B10, C1 green; RED seen first for A1, A3, A5, A7, A10, A11, B1–B7.
- [ ] `claude plugin validate` passes; `tsc -p mods/agent-models` clean; `node --test tools/` green.
  (validate passes and `node --test` is green; `tsc` was run with a local TypeScript 6.0.3 and the engine types: no new
  error in `hooks/` or `types/`, but the test files carry errors that were there before 1.4.0, so "clean" is not met.)
- [x] PR merged with green checks and no open thread.
- [x] `release` promoted after the owner's word; nine consumer pin bumps merged.
- [x] The installed mod on this WSL is 1.4.0 after a session start in a consumer.
- [ ] Owner checks reported; this plan promoted to `research/` with what shipped differently.
