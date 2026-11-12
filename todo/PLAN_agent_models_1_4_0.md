# PLAN — agent-models mod 1.4.0: the 5-hour reset time, and an account read that always ends

> Status: **plan only, nothing implemented yet, 2026-11-12.** Scope: `mods/agent-models/` (limits line, account read,
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
- **The account read has no ceiling.** `readOnce` (`prompts.ts:234`) awaits `$.session.identity()` (`:239`) with no
  time limit; only the `claude auth status` fallback has one (`STATUS_TIMEOUT_MS`, `:97`). `readAccount` is a single
  flight (`:260-279`): while `inFlight` is set no other read starts, and `readAccountOnDraw` (`:286`) returns at once
  when a read is in flight. So ONE call that never settles leaves `inFlight` set for the rest of the session, the
  state stays `{ kind: 'unread' }`, and the band says `account ?` with no suffix (`accountLabel`, `:191-199`) — what
  the owner saw in a resumed session, while a new session was fine.

## Design

### A. The reset time (limits.tsx, types/index.d.ts, register.tsx)

- `Limits` gains ONE field, `fiveHourResetsAt: number | null` — epoch milliseconds from `Date.parse` of
  `five_hour.resets_at`; `null` when the field is absent, not a string, or does not parse to a finite number. The
  type comment says four values now. Nothing else of the answer is kept.
- The line: `5h 2% left · resets in 1h 23m · week 42% left · Fable 55% left`. The reset part follows the 5h part,
  before `week`. Absent value: `resets in —` (the existing "a missing value is a dash" rule). A 5h dash and a reset
  time both drawn is allowed (they are read independently).
- The time is computed at DRAW time from `$.clock.now()` (epoch ms, per its API doc), not stored as text:
  `m = floor((resetsAt − now) / 60 000)`. `m ≥ 60` → `${h}h ${m % 60}m` (`1h 0m` kept, so the shape never jumps);
  `1 ≤ m < 60` → `${m}m`; `m < 1` (also a time already passed) → `<1m`.
- Colour of the time part only (the words `resets in` stay plain, as `left` does): `m < 10` green `LOGIN_COLOR`
  `#22c55e`; `10 ≤ m ≤ 30` orange `ACCOUNT_COLOR` `#f97316`; `m > 30` red `CLOSE_COLOR` `#ef4444` — the owner's three
  bands on the same whole minutes the text shows. A dash has no colour.
- **It counts down while open.** The draw asks the clock when the limits line is open with a value (an idle closed
  band still never asks). A new state key `limitsMinute: number` (the floor of `now / 60 000` at the last write) is
  read by the draw; the existing 2 s tick writes it only while the line is open and only when the minute changed —
  one write a minute at most, none while closed. The key is constant size (one number): no growth surface.
- The row-count of the open viewer (`viewerFixedRows`, via `limitsText`) gets the longer line, so a wrapped line is
  still counted.

### B. An account read that always ends (prompts.ts)

- `IDENTITY_TIMEOUT_MS = 5 000`: `$.session.identity()` races a `$.clock.after` ceiling (the pattern of
  `fetchLimits`, `limits.tsx:105-124`, timer cancelled in `finally`). On the ceiling the read goes on to the
  `claude auth status` road as on a deny, so a signed-in session still shows its email.
- `READ_CEILING_MS = 30 000` (≥ identity 5 s + status 10 s + margin): the whole `readOnce` races one more ceiling
  inside `readAccount`. On it, the single flight ends (`inFlight` cleared), the state gets
  `{ kind: 'unknown', suffix: 'timed out', readAt }` (an existing suffix, `types/index.d.ts` `AccountSuffix`), and a
  generation number makes a late result of the abandoned read write nothing. The next trigger (draw read once a
  minute, `turn.complete` when stale) reads again — so `account ?` with no reason can no longer last a session.
- If the clock itself is refused, `nowOrZero` already returns 0; if `$.clock.after` is refused, the ceiling cannot
  start: that case is caught and the read runs as today (no worse than 1.3.3), and a test names it.

### C. Version and release

- `plugin.json` version `1.4.0`. `tools/agent-models-pins.json` gets the `1.4.0` row (raw sha256 of the 7 files);
  `RELEASED_MOD` in `settings/hooks/lib/agent-models-decide.mjs` and its `.claude/hooks/lib` copy become that row (the
  existing tests fail when the two differ, or when the row is not the files at HEAD). The installed 1.3.3 upgrades by
  the existing swap on the next session start in a consumer that pins the new release.
- After the merge: one `release` promotion (`promote-release.yml`), then a pin bump in each of the nine consumers.
  Before the promotion the owner is asked about in-flight consumer releases and the open-PR counts (the PR cap).

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
| A1 | body with `five_hour.resets_at` ISO | `fiveHourResetsAt` = `Date.parse` value |
| A2 | `resets_at` null / absent / number / `"garbage"` | `null` |
| A3 | line, 83 min left | `5h 2% left · resets in 1h 23m · week 42% left · Fable 55% left` |
| A4 | 60 min, 59 min, 1 min, 59 s, −5 min | `1h 0m`, `59m`, `1m`, `<1m`, `<1m` |
| A5 | colours at 9, 10, 30, 31 min | green, orange, orange, red; only the time part coloured |
| A6 | `fiveHourResetsAt` null | `resets in —`, no colour |
| A7 | line open, clock moves 1 min | `limitsMinute` written once, the drawn time drops by one minute |
| A8 | line closed, clock moves | no `limitsMinute` write, no clock read by the draw |
| A9 | viewer row count | counts the longer limits line at a narrow width |
| B1 | `identity()` never settles, status answers an email | after 5 s the email is drawn |
| B2 | `identity()` and the status run never settle | after 30 s `account ? (timed out)`, `isAccountReading()` false |
| B3 | late answer of an abandoned read | writes nothing; a newer read's result stays |
| B4 | after B2, the next draw a minute later | starts a new read |
| B5 | `$.clock.after` refused | the read runs as in 1.3.3 and ends when its calls end |
| B6 | existing 233 mod tests | still pass (identity answering at once is unchanged) |
| C1 | existing `tools/agent-models-pin.test.mjs` | newest row = HEAD files = `RELEASED_MOD` |

## Owner checks after the rollout (a session cannot do these for itself)

- A new session: press the email, see `resets in …` with the right colour, and watch it count down one minute.
- A resumed session: the band shows the email (or `account ? (timed out)`), never a bare `account ?` past 30 s.

## Definition of Done

- [ ] Plan round `proceed`; code round `proceed`; Opus reviews done, findings fixed or answered.
- [ ] Tests A1–A9, B1–B6, C1 green; RED seen first for A1, A3, A5, A7, B1, B2, B3.
- [ ] `claude plugin validate` passes; `tsc -p mods/agent-models` clean; `node --test tools/` green.
- [ ] PR merged with green checks and no open thread.
- [ ] `release` promoted after the owner's word; nine consumer pin bumps merged.
- [ ] The installed mod on this WSL is 1.4.0 after a session start in a consumer.
- [ ] Owner checks reported; this plan promoted to `research/` with what shipped differently.
