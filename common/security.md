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

The same shape for decisions that are NOT protective — a fallback, a normalisation, a list of known
names — is [reuse-first.md](reuse-first.md) § *A decision applied at SOME of its sites*. Read
whichever matches what you are holding; the method below is the same in both.

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

## A measure you have not OBSERVED working is a comment (MANDATORY)

The previous rule is about a measure applied at some of its sites. This one is about a measure that
was applied everywhere and did nothing — which is worse, because the sites are all present and the
comment beside each of them says what it protects against.

Measured 2026-08-26. The Remote-SSH bridge sent `ssh` two options and documented them as
protections: `StreamLocalBindMask=0177` "clears every bit but the owner's, which on a shared host is
the boundary", and `StreamLocalBindUnlink=yes` "a socket left by a dropped session would otherwise
make every later bind fail". A unit test asserted both were in the argv. Everything read as covered.

On a real host, both were **inert**. For a `-R` forward the socket is created by the SERVER, so
sshd's copies of those options govern and the client's are ignored:

- the client asked for `StreamLocalBindMask=0000` — deliberately world-writable — and the socket
  still came out `srw-------`;
- a socket left by an ended session was not removed and the next bind was refused, despite the client
  sending `StreamLocalBindUnlink=yes`.

The socket was owner-only the whole time, by sshd's default. So the protection was real, was not
ours, and could be turned off by an administrator we would never hear from — while the code, the
comment and the test all said we had it handled.

### The two mistakes, separately

1. **The test asserted PRESENCE, not EFFECT.** `argv.includes('StreamLocalBindMask=0177')` proves the
   flag was sent. Whether it does anything is a fact about the receiver. A test that can only see
   your side of a delegated decision cannot be evidence about the decision.
2. **The docstring stated the effect as fact.** It was written from the option's name and a man page
   sentence, and read for weeks as an observation. A reader arriving at that code stops there, which
   is exactly what a comment claiming a protection is for.

### What to do instead

- **Anything you delegate — an `ssh` flag, an `sshd`/DB/kernel setting, an HTTP header the peer must
  honour, a container option, a filesystem mode you request rather than set — is the receiver's
  decision.** Whether it took effect is observable only by looking at the result, on a real one.
- **Until you have looked, write what you asked for, not what it achieves.** "We pass
  `StreamLocalBindMask=0177`" is honest; "the socket is owner-only" is a claim.
- **Prefer observing to asserting.** Where the effect cannot be set from your side, check it at run
  time and say so when it is wrong: the bridge now reads the socket's real mode after connecting and
  warns, naming the host setting responsible, because that is the only true statement available.
- **Delete an inert measure rather than keeping it "just in case".** It costs nothing to send and
  everything to read: it is where the next person stops checking. Removing it, with the measurement
  recorded, leaves the code saying what is true.

The general form: **a security control at a boundary you do not own is a request until you have seen
the answer.** Ask what would look different if the option did nothing at all — and if the answer is
"nothing", that is the state you are in until you measure.

## Security response protocol

If a security issue is found:

1. STOP immediately.
2. Run a full security review of the affected surface.
3. Fix CRITICAL issues before continuing.
4. Rotate any exposed secrets.
5. Review the codebase for the same pattern elsewhere — mechanically, by the rule above, and say which
   method you used. "I checked" is not a method.
