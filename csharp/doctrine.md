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

### 4a. A DTO field the client omitted is NULL, whatever its initializer says (MANDATORY)

The nullable-reference compiler is silent here and the type reads as non-null, so this is a trap
rather than a lapse. **A deserializer does not run your defaults**, and the two ways it happens are
both ordinary:

- **A positional record.** `record CompanyInput(string Name, string Key)` — an omitted `key` binds to
  `null`. There is no initializer to skip; the parameter is simply not supplied.
- **A record with property initializers, under the source generator.** `public string EntityKind
  { get; init; } = "credential";` — measured on 2026-09-03: an omitted field arrived **null**, not
  `"credential"`.

Then `input.Key.Trim()` or `EntityKind.Length` dereferences it, and an unhandled
`NullReferenceException` becomes **500** for a request that is well formed by the contract's own
documentation. Both instances were found on the same day, in two different repositories, by an
`.http` suite's first run — and were invisible to green test suites in both, because every fixture
those suites build happens to send the field.

So:

1. **Normalise where the value is READ, not at one call site.** A guard at the endpoint moves the
   dereference rather than removing it — `dew_flow_creds_for_devs` had the same field read by
   `IsValid()`, by `PayloadBytes()` and by the stored entity. One property (`Kind =>
   string.IsNullOrWhiteSpace(EntityKind) ? "credential" : EntityKind`) fixes all three.
2. **Treat it as a CLASS, not an instance.** `common/security.md` — *a measure applied at SOME of its
   sites* — governs: enumerate every unguarded dereference of a client-controlled field first, and
   leave the scan behind as a test. One repository here has ~20 such sites; fixing the one that
   happened to be found would have left nineteen.
3. **The suite that finds it must not enshrine it.** Assert the refusal or the default that OUGHT to
   happen; never write a request asserting the 500.

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
