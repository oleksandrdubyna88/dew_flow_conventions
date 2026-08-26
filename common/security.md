# Security Guidelines

## Mandatory checks before ANY commit

- [ ] No hardcoded secrets (API keys, passwords, tokens, connection strings)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] Authentication/authorization verified where the surface has any
- [ ] Error messages don't leak sensitive data

## Secret management

- NEVER hardcode secrets in source code — environment variables, `dotnet user-secrets`, or a secret
  manager.
- Validate that required secrets are present at startup.
- Rotate any secret that may have been exposed.

## External processes

Launch external processes as **exe + argv, never a shell string, always with a timeout — and the
timeout kills the entire process tree** (`Process.Kill(entireProcessTree: true)` on the
cancel/timeout path, before the launcher returns). This family clones and checks out repositories at
operator-supplied urls, so an unescaped shell string is an injection surface, not a style issue; and
a timeout that merely stops *waiting* leaves an orphan holding locks and handles — see
[reliability.md](reliability.md). Reference implementation:
`dew_flow_benchmark · src/Bench.Infrastructure/Process/ProcessRunner.cs`.

## A measure applied at SOME of its sites is the defect this family keeps writing (MANDATORY)

Not duplication — [reuse-first.md](reuse-first.md) covers that. This is one protective measure that
exists, is correct, and is applied to the places somebody thought of.

Counted in a single repository:

| the measure | applied at | missing at |
|---|---|---|
| escaping JSON interpolated into a `<script>` | one module, inline, by hand | a second module, then a THIRD written after the second was fixed |
| sanitising a path component built from stored data | one module | four others — two of which wrote an executable file and then ran it |
| the HTML escaper | three byte-identical private copies | hardening one left the other two behind |
| a surface-name check | three copies | adding a surface updated two of them |

Each was found by a person happening to look. None was found by a control.

Two of these are worth reading twice. The `<script>` escape was reintroduced **after** the fix, in a
fragment interpolated into the very file that had just been fixed and already imported the escaper —
so "the fix is right there" is not protection. And the path sanitiser was applied to four sites by
hand; enumerating them properly afterwards found **six**, so a careful sweep by a motivated person
missed a third of them.

### What to do instead

1. **Put the measure on the single road in, not at each call site.** If a value must be escaped before
   it becomes a key, a path, or markup, the function that BUILDS the key/path/markup escapes it — and
   is the only way to build one. A caller cannot then forget, because there is nothing to forget.
2. **Enumerate the sites mechanically before believing you have them all.** `grep` for the shape, not
   for the places you remember. If the pattern spans lines, match across lines: three of the six sites
   above were formatted over three lines and a line-scan found none of them.
3. **Leave the enumeration behind as a test.** A scan that fails naming file and line is the difference
   between a fix and a control. See [testing.md](testing.md) — *A structural test that matches nothing
   passes forever* — for the companion assertion such a scan needs.
4. **Write the scan BEFORE the fix.** Its first failure is the list you are about to work from, and it
   is the only version of that list you did not assemble from memory. The path sanitiser's guard, run
   before its fix, listed six sites when the fix in hand covered four.
5. **When you find one instance, sweep for the class in the same task** — the response protocol below
   already says this; the point here is that "I looked and it is fine" is only worth what the sweep's
   method is worth. Say which method you used.

### Safe by construction, not safe by content

The trap in step 1's absence: you arrive at a site, look at the VALUE it passes, see it is a constant
or a uuid, and move on. That answers the wrong question. Ask whether the SITE is safe whatever it is
handed — a value is one ordinary edit away from being different, made by someone with no reason to
look at how it reaches the sink.

Measured: a third interpolation site was cleared during a sweep on exactly that reasoning ("it is only
a constant icon"), and it was one "let the icon vary by kind" away from being the same defect.

## Security response protocol

If a security issue is found:

1. STOP immediately.
2. Run a full security review of the affected surface.
3. Fix CRITICAL issues before continuing.
4. Rotate any exposed secrets.
5. Review the codebase for the same pattern elsewhere — mechanically, by the rule above, and say which
   method you used. "I checked" is not a method.
