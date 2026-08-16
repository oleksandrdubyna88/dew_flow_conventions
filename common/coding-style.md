# Coding Style

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate existing ones:

```
WRONG:   modify(original, field, value) → changes original in-place
CORRECT: update(original, field, value) → returns new copy with change
```

Immutable data prevents hidden side effects, makes debugging easier, and enables safe concurrency.

## File organization

MANY SMALL FILES > FEW LARGE FILES:

- High cohesion, low coupling
- 200–400 lines typical, 800 max
- Extract utilities from large modules; split by extracting a named unit with its own responsibility,
  never a `partial` (or its equivalent) to duck the limit
- Organize by feature/domain, not by type

## Error handling

- Handle errors explicitly at every level; never silently swallow one.
- User-friendly messages in UI-facing code; detailed context in server-side logs.
- Expected failures are values, not exceptions (the C#-specific shape is in
  [../csharp/doctrine.md](../csharp/doctrine.md)).
- `try/catch` **placement** is a rule of its own — per independent unit, setup included, catch-all
  at every detached edge, nowhere else: [reliability.md](reliability.md) § Where `try/catch` lives.

## Input validation

- Validate all user input at system boundaries, before processing.
- Fail fast with clear error messages; an unknown name fails **naming the legal values**, never a
  silent fallback.
- Never trust external data — API responses, user input, file content.

## User-facing text is English

Every string a user reads — CLI output, API messages, UI labels, commit messages, documentation — is
English. No mixed-language chrome.

## Absent is not zero, and asked-for is not reported

Two distinctions that cost this family real time when they were collapsed:

- **A measurement that could not be taken must not render as `0`.** A volume Docker could not read and a
  store that is genuinely empty are different facts; drawn on a chart, the first becomes a cliff someone
  investigates. Carry a "known" flag, render absence as `—`, and let a total skip what it could not measure
  rather than counting it as nothing.
- **A value a service REPORTED and a value someone CONFIGURED are not the same kind of fact.** A sidecar once
  answered `provider: "cuda"` for a binary that could not register CUDA — the field everyone read as active
  was the requested one. Anything rendered as fact must have been answered by the thing itself; anything read
  from the environment says so.

## Code quality checklist

Before marking work complete:

- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines), no deep nesting (>4 levels)
- [ ] Files are focused (<800 lines)
- [ ] Proper error handling; no silently swallowed failures
- [ ] No hardcoded values — constants or config
- [ ] No mutation — immutable patterns used
