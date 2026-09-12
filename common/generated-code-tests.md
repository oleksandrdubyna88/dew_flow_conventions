---
id: "common.generated-code-tests"
load: "conditional"
tasks: ["implement","test","audit"]
---
# Code you GENERATE is executed by the test, never string-matched (MANDATORY)

> Extends [testing.md](testing.md) § *A test can only inspect what is PRESENT* — same subject from the
> other side: that one is an assertion with nothing to look at, this one is an assertion looking at the
> TEXT of a program instead of its behaviour. It is a separate file only because `testing.md` is frozen
> by the migration evidence in `research/shared-rules-migration-map.json` while the Claude/Codex
> migration is open; it belongs inside that rule when the inventory retires.

Measured 2026-09-12 in `dew_flow_creds_for_devs`. The extension's webviews are page scripts assembled as
template literals. Roughly four thousand tests asserted over the assembled string and every one was
green — while a user-visible bug had shipped: one of three worked examples was painted without the CSS
class every colour rule in the stylesheet is scoped under. No substring assertion can see that, because
the string contained everything it was supposed to contain. The artefact was correct as text and wrong
as a program.

## 1. If the artefact is executable, the test EXECUTES it

A page script, a generated SQL statement, a generated config the product parses: build it, run it, and
assert on the RESULT — what the page looks like after the script runs, what the statement returns, what
the parser produced. Roughly a hundred lines of `node:vm` sandbox with an explicit six-name context
converted this entire class of bug from structurally invisible to red.

### Bounded, because "execute the artefact" is not safe advice everywhere

"Hermetic" is an outcome, and an outcome with no mechanism behind it is a claim each author gets to
grade for themselves. The boundary is **deny by default**, and it is the harness that enforces it, not
the intention of whoever wrote the test:

- **A cleared environment and an allowlist of globals.** Not the ambient environment minus the things
  you remembered — an explicit list of the names the fragment may see. The harness this rule came from
  passes exactly six.
- **No reach out of the process:** no network, no child processes, no filesystem beyond an isolated
  temporary directory created for that test and removed after it.
- **A hard timeout, with cancellation, and a bound on memory and output.** A generated `while (true) {}`
  is not an exotic input — it is what a defective generator produces — and without a deadline it does
  not fail the test, it hangs the suite and takes the pull request with it. The harness behind this rule
  already passed `timeout: 5000`; the rule's first draft failed to say so, which is why this is written
  down.

**Where those limits cannot be enforced, do not execute** — and a generated shell command is exactly the
case where they cannot. Assert over the PARSED form instead: the argv array, the AST, the parsed config
object. Parsed is still behaviour; a substring is not.

## 2. A pattern matched against a WHOLE composite passes on the wrong occurrence

`assert.match(script, /refreshMix\(\)/)` was meant to prove that a selector's handler called a function.
It matched that function's own definition, three hundred lines further down the same composite, and
passed identically with the call deleted.

Match the smallest slice that can contain the thing — the handler's own body — and then prove the
assertion has teeth by deleting the thing and watching it go red. Over generated text this is not extra
diligence: an assertion against a large string is far likelier to be vacuous than one against a return
value, because everything is in there somewhere.

## 3. The harness is code under test, and a permissive fake turns a suite green

The DOM written to run these fragments shipped two defects of its own, and both made tests pass that
should have failed:

- `querySelector` returned `undefined` where a real DOM returns `null`, so every `!== null` guard in the
  product passed against code that was never routed.
- A bare tag name was read as a class, so `querySelector('fieldset')` answered nothing.

So the fake gets its OWN tests, written against the documented contract of the API it stands in for —
nullability included — and the standing constraint is that **a fake may be stricter than the real thing
and never more permissive.** Strict fails loudly on code that was fine; permissive passes silently on
code that is not, and there is nothing in the run to tell you which happened.

## Never

- Never assert a generated program's correctness with a substring of its source.
- Never match a pattern against a whole composite when a smaller slice can hold it.
- Never run a generated artefact anywhere that has secrets, network, or writable state that matters.
- Never execute one without a deadline — an unbounded run does not fail, it hangs.
- Never leave a fake untested, and never let one be more permissive than what it replaces.

## Definition of Done

- [ ] Any artefact this change generates is executed by its test behind a deny-by-default boundary —
      cleared environment, allowlisted globals, no network or child processes, an isolated temporary
      directory, and a hard timeout with memory and output bounds — or is asserted over its parsed form.
      Never matched as a substring.
- [ ] Every assertion over generated text was proven to have teeth by removing what it claims to check
      and watching it fail.
- [ ] Any fake or harness written for this has its own tests against the real API's contract, and is
      stricter than the real thing rather than more permissive.
