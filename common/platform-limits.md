---
id: "common.platform-limits"
load: "conditional"
tasks: ["implement","audit","test","release","deploy"]
---
# Platforms — the limits they impose, and the proof you ship for them (MANDATORY)

> Extends [reliability.md](reliability.md) § *Boundary numbers are clamped* and
> [testing.md](testing.md) § *A check that only runs during a release has never run*. Those files are
> frozen by the migration evidence in `research/shared-rules-migration-map.json` while the Claude/Codex
> migration is open, so this material is a rule of its own; when that inventory retires, part 1 belongs
> in `reliability.md` and part 2 in `testing.md`.
>
> Both halves come from one incident, measured 2026-09-12 in `dew_flow_creds_for_devs`: `creds` 0.1.6
> failed **both** macOS legs of a four-product release on a unix socket path, after the other three
> products had already published. Nothing here is hypothetical, and the existing rules would have
> stopped none of it.
>
> The examples are C#, because that is where it happened. The requirements are language-neutral — read
> "constant" as whatever your language calls one value defined once, and apply the same shape in Rust or
> TypeScript.

## 1. A platform limit is the KERNEL's number, in the KERNEL's unit — and one adapter owns it

`reliability.md` governs numbers a CLIENT sends. These are different: a client's number arrives at your
validation, an operating-system limit is enforced inside a constructor you did not write, on a platform
your machine is not.

1. **The kernel counts BYTES, and the documented number is the size of the FIELD, not the length it
   accepts.** Every write-up of `sun_path` says "104 on macOS, 108 on Linux", and .NET's own exception
   message names those numbers — so a guard written from either reads one too high, because the NUL
   terminator lives in the field too.

   The probe, run on Linux rather than quoted from anywhere: **the longest accepted ASCII path is 107**,
   and the same CHARACTER count carrying one two-byte character — 108 bytes — is refused. Take the
   number from a probe you ran; an error message frequently reports the capacity, not the limit.
2. **The guard counts ENCODED bytes.** `Encoding.UTF8.GetByteCount(path)` against the probed maximum,
   never `path.Length`. Those 107 characters with one two-byte character among them pass a `Length`
   guard and are refused by the kernel anyway — the same crash through a door you thought you had shut.
3. **A predicate never leaks the argument validation of the library beneath it.** `bool IsStaleAsync`
   and a `ConnectOrNull` helper each guarded six exception types. `UnixDomainSocketEndPoint`'s
   constructor throws `ArgumentOutOfRangeException` — none of the six — and throws it *before* any
   connection is attempted, so the one input the guard existed for took the process down instead of
   returning `false`. A signature that promises an answer (`bool`, `T?`, an `Outcome`) answers for
   **every** input it accepts. Validate at your own boundary, or widen the guard to the type the
   dependency actually throws and say in the `when` clause why that type is listed — to the next reader
   it will look like over-catching, and they are right to ask.
4. **One constant is the source of truth, and everything derives from it.** In the adapter that owns the
   resource: one immutable, named value, reachable by every guard that needs it. Every check on that
   limit reads it, every user-facing message naming the limit derives from it, and **no call site keeps
   its own literal** — a guard and a message that disagree is a support ticket, and the call site that
   kept the number inline is the one that will still be wrong after the constant is corrected.

   **Map the platforms explicitly, and fail closed on one you have not measured.** The obvious spelling
   is a ternary:

   ```csharp
   // WRONG: every future platform silently inherits Linux's number, unprobed.
   internal static int MaxSocketPathBytes => OperatingSystem.IsMacOS() ? 103 : 107;
   ```

   Windows, a BSD or anything added later takes the Linux value without anyone having run a probe there,
   and the boundary tests go green against a limit nobody measured. Name each supported platform and
   refuse an unmeasured one with a diagnosable error instead of guessing.

### Testing it — an all-ASCII fixture cannot fail

Three tests at the boundary, with lengths chosen deliberately: the largest ACCEPTED length, the first
REFUSED one, and the message the user sees, asserted to name the real limit. Not "whatever length the
runner's temporary directory happens to produce" — that is precisely what made this defect
platform-specific, because macOS's temp path is fifty characters before your own name begins.

**The refused fixture is the accepted CHARACTER count carrying one multi-byte character**, with an
assertion in the test that its byte count and its character count differ. That single fixture is the
whole point: it is inside the character limit and outside the byte limit, so it is refused only if the
code is counting the right unit.

An all-ASCII fixture passes identically under the byte reading and the character reading, so it cannot
go red when the code holds the wrong one — it is a test with the one property the code needed it to have
removed. Both the off-by-one in part 1 and the toothless ASCII fixture were found by review, not by the
suite.

## 2. A platform that is only BUILT during a release is an untested platform

`testing.md` has the case of one CHECK whose only execution is the release. This is the whole leg.

Pull-request CI for that repository ran on `ubuntu-latest`. macOS existed in exactly one place — the
release workflow, which runs after a tag. So the defect in part 1 could not be found by a pull request,
structurally rather than by bad luck, and it was not.

**Every platform a repository ships a binary for runs its tests on a pull request.** The rule is the
matrix, not the tag.

### The only sanctioned narrowing is a written mapping

"A full matrix is too expensive" is not a reason, because nothing can check it and any missing platform
can be excused by asserting it. What is sanctioned is a **mapping, written down, from every shipped
binary-and-platform pair to the components tested for it on a pull request** — and a component may be
left out of that mapping only if it cannot affect that binary, which is a claim about the dependency
graph and is therefore checkable.

In the repository this came from, the mapping is: the three client components — the CLI, the MCP server,
the broker client — run on `macos-latest` as well as Linux, because they are what touches the local
operating system; the server and the vault run on Linux alone, because they ship as Linux containers and
no macOS binary of them exists to protect.

Two traps, both met while fixing it:

- **A path filter is a second thing to keep true, it fails silently, and it does not see shared code.**
  Written from memory as `src/cli/**` against directories actually named `src_cli`, it matches nothing,
  the job never runs, and a job that never ran is indistinguishable at a glance from a job that passed —
  the same shape of failure as the one above and harder to notice. Worse, a filter naming one
  component's directory skips a change to the SHARED code that component links, which is exactly where
  a platform adapter lives. So: a filter must cover every path that can affect the binary, shared
  dependencies included, or the job runs **unfiltered**. Unfiltered is what that repository chose, and
  the reasoning is in the workflow's own header.
- **Read the price from the account you are actually on.** The often-quoted 10× cost of a macOS minute
  is a fact about PRIVATE repositories. A public one gets the runners free, which turns careful
  path-filtering into complexity bought with nothing. Check which you are in before designing around a
  bill you do not have.

## Never

- Never take an OS limit from documentation, from an exception message, or from memory — probe it.
- Never compare a character count against a byte limit.
- Never let a method that returns an answer throw the argument validation of the library under it.
- Never let an unmeasured platform inherit another platform's number through an `else` branch.
- Never leave a platform you ship to unexercised until after the tag.
- Never add a path filter that does not cover the shared code the filtered component depends on.

## Definition of Done

- [ ] Any OS limit this change touches came from a probe that was run on that platform, is counted in
      the kernel's own unit, and lives in ONE immutable named constant that every guard and every
      message derives from, with no literal left at a call site.
- [ ] Platforms are mapped explicitly and an unmeasured one fails closed rather than inheriting a value.
- [ ] No predicate or `…OrNull` helper can throw the argument validation of its dependency.
- [ ] The limit has boundary tests — largest accepted, first refused, and the user-facing message — and
      the refused fixture is the accepted character count carrying a multi-byte character, asserted to
      differ in byte count from character count.
- [ ] Every shipped binary-and-platform pair maps to components tested for it on a pull request, and any
      path filter covers the shared code those components depend on — or there is no filter.
