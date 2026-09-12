---
id: "common.platform-limits"
load: "conditional"
tasks: ["implement","audit","test","release","deploy"]
---
# Platforms — the limits they impose, and the proof you ship for them (MANDATORY)

> Extends [reliability.md](reliability.md) § *Boundary numbers are clamped* and
> [testing.md](testing.md) § *A check that only runs during a release has never run*. Those sections
> are frozen by the migration evidence in `research/shared-rules-migration-map.json` while the
> Claude/Codex migration is open, so this material is a rule of its own; when that inventory retires,
> part 1 belongs in `reliability.md` and part 2 in `testing.md`.
>
> Both halves come from one incident, measured 2026-09-12 in `dew_flow_creds_for_devs`: `creds` 0.1.6
> failed **both** macOS legs of a four-product release on a unix socket path, after the other three
> products had already published. Nothing here is hypothetical, and the existing rules would have
> stopped none of it.

## 1. A platform limit is the KERNEL's number, in the KERNEL's unit — and one adapter owns it

`reliability.md` governs numbers a CLIENT sends. These are different: a client's number arrives at your
validation, an operating-system limit is enforced inside a constructor you did not write, on a platform
your machine is not.

1. **The kernel counts BYTES, and the documented number is the size of the FIELD, not the length it
   accepts.** Every write-up of `sun_path` says "104 on macOS, 108 on Linux", and .NET's own exception
   message names those numbers — so a guard written from either reads one too high, because the NUL
   terminator lives in the field too. A probe on Linux says the longest ACCEPTED ASCII path is **107**;
   the same CHARACTER count carrying one two-byte character is 108 bytes and is refused. Take the number
   from a probe you ran: an error message frequently reports the capacity, not the limit.
2. **The guard counts ENCODED bytes.** `Encoding.UTF8.GetByteCount(path)` against the probed maximum,
   never `path.Length` — a path well inside the character limit with four two-byte characters in it
   passes a `Length` guard and is then refused by the constructor anyway, which is the same crash
   through a door you thought you had shut.
3. **A predicate never leaks the argument validation of the library beneath it.** `bool IsStaleAsync`
   and a `ConnectOrNull` helper each guarded six exception types. `UnixDomainSocketEndPoint`'s
   constructor throws `ArgumentOutOfRangeException` — none of the six — and throws it *before* any
   connection is attempted, so the one input the guard existed for took the process down instead of
   returning `false`. A signature that promises an answer (`bool`, `T?`, an `Outcome`) answers for
   **every** input it accepts. Validate at your own boundary, or widen the guard to the type the
   dependency actually throws and say in the `when` clause why that type is listed — to the next reader
   it will look like over-catching, and they are right to ask.
4. **One named thing owns the platform's answer, and every guard reads it.**
   `MaxSocketPathBytes => OperatingSystem.IsMacOS() ? 103 : 107`, in the adapter that owns the socket:
   one place a reviewer can check against a probe, one place the next platform is added. A constant no
   call site consults is decoration, and the call site that kept its own literal is the one that will be
   wrong.

### Testing it — an all-ASCII fixture cannot fail

Three tests at the boundary, with lengths chosen deliberately: the largest ACCEPTED length, the first
REFUSED one, and the message the user sees, asserted to name the real limit. Not "whatever length the
runner's temporary directory happens to produce" — that is precisely what made this defect
platform-specific, because macOS's temp path is fifty characters before your own name begins.

And the refused fixture carries at least one multi-byte character, with an assertion that its character
count differs from its byte count. **An all-ASCII fixture passes identically under the byte reading and
the character reading**, so it cannot go red when the code holds the wrong one: it is a test with the
one property the code needed it to have removed. Both the off-by-one in part 1 and the toothless ASCII
fixture were found by review, not by the suite.

## 2. A platform that is only BUILT during a release is an untested platform

`testing.md` has the case of one CHECK whose only execution is the release. This is the whole leg.

Pull-request CI for that repository ran on `ubuntu-latest`. macOS existed in exactly one place — the
release workflow, which runs after a tag. So the defect in part 1 could not be found by a pull request,
structurally rather than by bad luck, and it was not.

**Every platform a repository ships a binary for runs its tests on a pull request.** The rule is the
matrix, not the tag.

Where a full matrix is genuinely too expensive, the split is by COMPONENT and it is written down. There,
the three client components — the CLI, the MCP server, the broker client — gained `macos-latest`,
because they are what touches the local operating system; the server and the vault did not, because they
ship as Linux containers and a macOS run would assert nothing anybody installs.

Two traps, both met while fixing it:

- **A path filter is a second thing to keep true, and it fails silently.** Written from memory as
  `src/cli/**` against directories actually named `src_cli`, it matches nothing, the job never runs, and
  a job that never ran is indistinguishable at a glance from a job that passed — the same shape of
  failure as the one above and harder to notice. Filter only when the cost is real, and when you do,
  assert the filter matches a file that exists.
- **Read the price from the account you are actually on.** The often-quoted 10× cost of a macOS minute
  is a fact about PRIVATE repositories. A public one gets the runners free, which turns careful
  path-filtering into complexity bought with nothing. Check which you are in before designing around a
  bill you do not have.

## Never

- Never take an OS limit from documentation, from an exception message, or from memory — probe it.
- Never compare a character count against a byte limit.
- Never let a method that returns an answer throw the argument validation of the library under it.
- Never leave a platform you ship to unexercised until after the tag.
- Never add a path filter you have not checked against a real file in the tree.

## Definition of Done

- [ ] Any OS limit this change touches came from a probe that was run, is counted in the kernel's own
      unit, and lives in ONE named constant that every guard on it reads.
- [ ] No predicate or `…OrNull` helper can throw the argument validation of its dependency.
- [ ] The limit has boundary tests — largest accepted, first refused, and the user-facing message — and
      the refused fixture's byte count differs from its character count.
- [ ] Every platform this repository ships a binary for runs its tests on a pull request; or the
      component split is stated with its reason, and any path filter was asserted against a real file.
