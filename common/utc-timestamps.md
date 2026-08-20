# UTC in the database, local time only on the frontend (MANDATORY)

> **Paid for on 2026-08-19, in a retracted finding about model behaviour.** A benchmark stored the date each
> question was seeded from. Authors wrote it as a calendar day — `"at": "2026-08-17"` — and the deserialiser
> bound that bare date to *midnight in the reading machine's offset*, `+02:00`. The domain then dutifully
> normalised the instant to UTC: `2026-08-16T22:00Z`. One day early, on every row, silently.
>
> What it cost was not a day. Two different model families were written up as *"systematically dating a day
> early — an instruction was never going to fix this"*; a reviewer read the shifted values, correctly reported
> that they disagreed with git, and **three questions were thrown away over a defect of ours**. A correction
> report printed *"the author dated it 2026-08-17, the repository says 2026-08-17"* — the same date twice —
> and that was read as a display quirk for a day. When someone finally replayed it through the real types,
> **32 stored rows** turned out to be a day early, every one of them stamped `22:00`.
>
> The bug was two lines. Finding it took a retraction in three documents.
>
> This rule extends [logging-serilog.md](logging-serilog.md), which already fixes one clock for LOGS. This one
> fixes it for everything that is STORED.

## The rule

**Every instant that reaches storage is UTC. The only place a local time may exist is the surface a human
reads.** Not the domain, not the service layer, not the JSON on the way in, not a test fixture — the
presentation edge, and nowhere before it.

1. **Persisted columns are UTC.** In Postgres that is `timestamptz`, and the value handed to it is already
   UTC. In .NET, `DateTimeOffset` with a zero offset, or `DateTime` with `Kind.Utc` — never `Unspecified`,
   which is a value that will be interpreted by whoever reads it next.
2. **`Now` is banned in anything that persists.** `DateTime.Now`, `DateTime.Today`, `DateTimeOffset.Now`,
   `SystemTime.now()` rendered in local zone. Take the clock from `TimeProvider.GetUtcNow()` (injected, so a
   test can control it) — never from the ambient machine.
3. **A calendar DAY is a day, not an instant.** This is the half that actually bit, and the one nobody
   remembers: `"2026-05-14"` in JSON, a `<input type="date">`, a `--since` argument, a date column in a CSV.
   Binding it to a `DateTimeOffset` gives it the READING machine's offset, and converting that to UTC moves
   it. **Stamp the wall date as UTC at the boundary; never convert it.**
   ```csharp
   // wrong — the author's day becomes an instant in our zone, then a different day in UTC
   new QuestionSeed(kind, reference, file.At);

   // right — the day the author wrote, kept as that day
   new QuestionSeed(kind, reference, new DateTimeOffset(file.At.DateTime, TimeSpan.Zero));
   ```
4. **Convert once, at the edge, on the way OUT.** The frontend renders in the viewer's zone — Blazor with the
   browser's offset, a CLI with the operator's. Nothing else converts, in either direction.
5. **One place per comparison.** Two spellings of "is this the same day" is how one of them comes to be wrong
   while the other looks right. Put the day-reading in one named function and call it from both sides.

## Detecting the damage

The shift leaves a fingerprint, and it is worth knowing because nothing errors:

```sql
select to_char("SeedAt", 'HH24:MI') as t, count(*) from bank_questions group by 1 order by 2 desc;
```

A column meant to hold calendar days should be **all `00:00`**. Rows reading `22:00` or `21:00` are days that
were converted rather than stamped — the offset that did it is `24:00` minus that time. A whole column at one
odd time of day is not a coincidence; it is every row written on one machine in one season.

## Rust

`chrono::Utc::now()`, never `Local::now()`. A naive date parsed from input is `NaiveDate` and stays one until
something needs an instant — `date.and_time(midnight).and_utc()`, never `.and_local_timezone()`.

## Never

- Never store a local time "because that is what the user typed". Store UTC and render it back.
- Never convert a bare calendar date to UTC. Stamp it.
- Never use ambient `Now` in code a test will later need to pin, or in code that writes a row.
- Never compare an instant when the question is about a DAY.
- Never let a display concern reach into storage — "the grid shows it wrong" is fixed in the grid.
- Never back-fill a shifted column silently. Say how many rows and what the fingerprint was; a correction
  nobody sees is a second unrecorded shift.

## Definition of Done

- [ ] Every timestamp column is `timestamptz` and every write to it is UTC.
- [ ] No `DateTime.Now` / `DateTimeOffset.Now` / `Local::now()` outside presentation code.
- [ ] Dates arriving as calendar days are stamped UTC at the boundary, not converted.
- [ ] Local-time rendering happens on the frontend only, and is not reachable from the domain.
- [ ] Where a shift is found in existing rows, the count and the fingerprint are recorded before the fix.
