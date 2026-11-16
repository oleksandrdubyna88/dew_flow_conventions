---
id: "common.test-leftovers-exemptions"
load: "conditional"
tasks: ["implement","test","audit","policy","release"]
---
# The `container-scoped` exemption — a kind of its own, for a container's own teardown

<!-- core:begin -->
The companion of `common/test-leftovers-detail.md`, loaded with it: provisions that extend §6 (b) and the exemption
grammar of §7 there. Where this text and the detail's §6 (b) or §7 differ about `container-scoped`, this text
decides. The marker is the one §6 (b) prescribes:

`testsToDelete-exempt: container-scoped — <what> lives and dies with <fixture or job>`

**It is a kind, not a class.** `container-scoped` is not a class of §7's table and no finding is ever of that class: it
is a declaration that a database, schema or namespace has the lifetime of a disposable container the run or its job
owns (§6 (b)). Valid and with no finding beside it, the marker is clean. A malformed one is a finding of class
`exemption`.

**When it is valid.** The general reason rule of §7 holds (at least ten characters and three words, not a
placeholder), AND the reason names an owner: after `lives and dies with` or, in the plural, `live and die with`,
an optional article (*the*, *a*, *an*, *its*, *this*, *that*) and then a word of at least two characters that is not
itself an article. `… lives and dies with the` names no owner and is a finding of class `exemption`; so is a reason with
neither spelling. It needs no `lock:`: that belongs to (a).

The refusal says: the exemption of `container-scoped` must name what it lives and dies with: `lives and dies with` or
`live and die with`, then an optional article and an owner of two characters or more that is not an article and does
not start with an article followed by punctuation (`the PostgresFixture container`, not `the-fixture`). The spelling is
read in any ASCII case and at a word edge (`xlives and dies with …` has none). Accepted owners: `the PostgresFixture
container`, `its fixture`, `PostgresFixture`, `_x`, `its_x`, and `x.` (the period counts as a character of the word). Refused:
`the`, `the the`, `a b`, `the X` (one character), `a. foo`, `a.b`, `the-fixture` (an article ends at punctuation, so it is
no owner). The C# template reads the same text, case for case.

**What it clears.** One class, `shared-store`, on the marker's own line and the next, and only a hit that is the
container's own teardown: `DROP DATABASE`, `DROP SCHEMA` or `FLUSHDB`. Every `shared-store` hit on that line must be
one of these: a line that also holds a `DROP TABLE`, `TRUNCATE`, `FLUSHALL` or delete-all is not cleared, because that
is a reset, not a teardown, and a reset needs (a)'s `lock:` or a per-run name.
A name in the owner form (§1) is the run's own and is no hit. Where the marker is valid and the line also holds a reset, the finding names the first hit that is not a teardown, never the teardown.

**What it never clears.** `ryuk-off` and `owner-blind` refuse every exemption. Nor does it clear `docker-run`,
`docker-name`, `raw-temp`, `raw-worktree` or `legacy-name`: the container itself is still named in the owner form and
kept under the reaper (§5), and a path or worktree it makes is still owned (§2).

**What the guard cannot know.** That the dropped database is the container's. A guard reads a spelling, not data flow,
so `DROP DATABASE production_db` under a valid marker is clean too. The marker is the author's declaration, read by the
code review; the lifetime is proved by the consumer's own fixture test (the container is named, kept under the reaper,
never reused, and disposed).

## Never

- Never use the marker to clear a reset: `DROP TABLE`, `TRUNCATE`, `FLUSHALL` and delete-all stay `shared-store`.
- Never use it for a store the run does not own, or for a container that is reused or outlives the job.
- Never rely on the guard to prove the database is the container's.
<!-- core:end -->
