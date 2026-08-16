---
paths:
  - "**/*.cs"
  - "**/*.razor"
  - "**/*.csproj"
---
# C# doctrine — the family's code rules

## 1. Language & runtime

.NET 10, latest C#, `TreatWarningsAsErrors`. Use the newest syntax: primary constructors for DI,
collection expressions (`[]`, `[.. a, .. b]`), `required`, `field`, `await cts.CancelAsync()` (never
`cts.Cancel()` in async contexts), `PeriodicTimer` over `System.Threading.Timer`.

## 2. Records for data, classes for services

`record` for every data container; `class` only for stateful services and types with identity.
Positional records for immutable values; `record class` with `init` for mutable config shapes.

## 3. No primitive obsession

A business concept does not travel as a `string` or an `int`. Wrap it in a typed value with parsing and
validation (`CommitSha`, `RepoUrl`, `Email`). Parsing lives in a static factory returning a result
value — never a throwing constructor, because a malformed input is an expected answer. Exception: IDs
in HTTP/JSON/JS-interop contexts may stay `string` for serialization, but do not leak untyped across
service boundaries.

## 4. No null in business logic

Return `[]`, `string.Empty`, or a typed empty value. **"Not captured" and "empty" are different facts
and must be different states** — carry a flag-and-reason record (the family's `Captured` pattern) rather
than rendering an unknown as a zero; that is how a gap in instrumentation becomes a claim about the
subject. Allowed nullables: JS-interop lifetimes (`IJSObjectReference?`), optional cancel tokens,
legitimate "not found" returns, optional `RenderFragment?` slots.

## 5. Expected failures are values, not exceptions

One shared outcome shape per repo (`Outcome<T>`: ok/fail); a closed record hierarchy (private
constructor, nested `sealed record`s) when a failure has several meaningful cases. Never `throw` for
control flow. Unexpected infrastructure failures still throw; catch with the exception as the **first**
log argument, rethrow unless this layer genuinely recovers. Do not invent a per-call-site
`(bool ok, T value, string reason)` tuple — that is the outcome type wearing a disguise, and three of
them in one file is how parallel schemas begin.

## 6. Pure functions, small methods

`private static` wherever a method reads no state (Blazor lifecycle methods exempt). Cyclomatic
complexity **≤ 4** — extract, or use a switch expression.

## 7. Immutability in contracts

Never mutate; return a new value. Public contracts expose `IReadOnlyList<T> { get; init; }` defaulting
to `[]`, never `List<T> { get; set; }`.
