---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.mts"
  - "**/*.cts"
---

# TypeScript — the four traps that have actually cost us

> The family had a doctrine for C# and one for Rust and none for TypeScript, while the largest
> codebase in it is a TypeScript VS Code extension. Every rule below is here because it went
> wrong in that repository, most of them more than once and by different hands. None of them is a
> style preference; each one produced either a shipped defect or a test that passed for the wrong
> reason.

## 1. Never interpolate into a `<script>` element with `JSON.stringify` (MANDATORY)

`JSON.stringify` escapes what JSON needs escaped. It leaves `<` alone — correctly, because `<` is
a legal character in a JSON string. But an **HTML parser ends a script element at the first
`</script>` it sees**, inside a string literal included. So this:

```ts
const page = `<script>var rows = ${JSON.stringify(rows)};</script>`;
```

is a break-out the moment any value in `rows` contains `</script>`. The rest of the page's own
program is then parsed as markup, and whatever followed the closing tag runs.

**Use the repository's own escaper** — in `dew_flow_creds_for_devs` it is `jsonForScript` in
`webviewHtml.ts`, which also closes `<!--`. Never a hand-rolled `.replace()` at the call site:
that is how the second instance happened.

**Three instances, three different people, one of them shipped.** `webauthnPrf.ts` escaped by
hand; `entityFormScript.ts` did not; `depPickerScript.ts` reintroduced it in new code written
*beside* the fix for the previous one — and that build was cut, installed and running against a
real vault for an hour before it was found. The values were folder and entry names arriving from
a **synced** vault, so it was never bounded by what the local user types.

**The rule is enforced, not remembered.** `scriptInterpolation.test.ts` scans every shipped source
file and fails, naming file and line, on any `${JSON.stringify(…)}` inside a template literal. A
new repository that renders a webview copies that test before it renders anything.

This is the language-specific half of a family-wide rule: *why* `JSON.stringify` is not an escaper
here, and what to reach for instead. The general shape — a correct measure applied at only some of
its sites, and the enumeration that must precede the fix — is
[common/security.md](../common/security.md), which counts this defect among four of the same kind
in one repository.

## 2. A backtick inside a template literal ends it — including inside a comment

A CSS or JS comment inside a template literal is not a comment to the TypeScript parser; it is
text inside a string. One backtick in it terminates the literal, and the error surfaces dozens of
lines later as `';' expected` at a column that has nothing to do with the cause.

```ts
// This does not compile, and the message will not say why:
const css = `
  /* break-inside: avoid is what keeps a fieldset whole */   <-- written with backticks: fatal
`;
```

Write the identifier plainly, or use single quotes. **A test that parses the generated page for
every variant is the guard** — in the extension it is `webviewHtml.test.ts`, and it is what caught
this the second time it happened.

## 3. An `as` cast is a promise to maintain a shape by hand — and it comes due silently

A test fixture written as `{ … } as SomeOptions` tells the compiler to stop checking. That is
fine until a **required** field is added to `SomeOptions`: no compile error appears anywhere,
because the cast said not to look. What appears instead is a runtime failure in every test that
uses the fixture — eleven of them, in the instance that produced this rule, all reading
`TypeError: folders is not iterable` and none of them pointing at the interface that changed.

- Prefer a typed factory with real defaults over a cast: `function options(overrides: Partial<T> = {}): T`
  **without** the trailing `as T`.
- If a cast is genuinely needed, adding a required field to that interface is the moment to grep
  for it. The compiler will not.
- The same applies to `as never`, `as unknown as T`, and a `@ts-expect-error` left in a fixture.

## 4. `tsc` emits despite errors — so a green suite can be green against stale output

TypeScript writes its JavaScript even when the compile failed, unless `noEmitOnError` is set. Two
consequences, both of which have wasted an afternoon here:

- **A red file does not stop `out/` from being loaded.** A test run against `out/` can pass
  entirely, against the last version that compiled. Run a clean `tsc` and read its exit before
  trusting any suite number.
- **`npm test` is usually `compile && node --test`**, so somebody else's red file stops the runner
  for everybody in a shared checkout — and what they see is a compile error rather than a test
  result, which reads as "my change broke something". If you leave a file red, say so; if you find
  one, say whose it is rather than working around it. (See `common/git-workflow.md` §7: `git
  status` tells you WHAT and never WHO.)

**Never build with `--outDir` to "keep it separate".** Tests that resolve repository files
relative to the build output — manifest checks, contract tests, command registries — then fail in
numbers, realistically and for no real reason. Build in place.

## Definition of Done

- [ ] No `${JSON.stringify(…)}` inside a template literal that becomes a `<script>`; the shared
      escaper is used, and the scan test exists in this repository.
- [ ] No backticks inside template literals, comments included.
- [ ] No `as` cast in a test fixture standing in for a real type — and if one remains, the
      interface it casts to carries a note saying so.
- [ ] A clean `tsc` was read before any suite result was reported.
