# PLAN — Test leftovers, the merged core: the owner segment scopes, the kernel authorises, liveness decides

> Status: **plan only, nothing implemented yet, 2026-10-21.** Scope: `common/test-leftovers.md`, a new
> `common/test-leftovers-janitor.md`, `tools/lib/owned.mjs`, `tools/lib/leftovers-sweep.mjs`, `tools/janitor.sh`,
> `tools/leftovers-check.mjs`, `tools/fixtures/owner-vectors.json`, `tools/owner-conformance.test.mjs`, a new
> `tools/sweeper-scan.mjs`, their tests, `README.md`, `research/rule-bodies.json`.
>
> Related docs: [PLAN_test_leftovers_E1.md](PLAN_test_leftovers_E1.md) (the contract this one revises — promoted to
> `research/` by this plan's last story), [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md) (the consumer
> epics, which now wait for THIS release), [rule-ownership.md](../common/rule-ownership.md).
>
> This rule text is shared byte for byte with a private sibling rule repository that serves a second family of
> repositories on machines several OS users share. The sibling is never named in this file; where it matters it is
> "the private sibling", and what it decided is quoted as a decision, not as a source.

## Symptom

`common/test-leftovers.md` (`2c96f83`) assumes a machine with one OS user. On a machine two accounts share — one
checkout tree, one container daemon, one temp root — its sweep (`tools/lib/leftovers-sweep.mjs:49-54`: a resource with no
owner record and old enough is removed) and its janitor (`tools/janitor.sh:56`: every prefixed name of every user is a
candidate; an unmarked old folder "is nobody's and goes") delete another user's live resources. The private sibling
solved that with an owner segment in the name, kernel ownership of temp folders and a machine-wide barrier — and in doing
so gave up the three-valued liveness, the hostile-name hardening and the one shipped janitor this repository has. The
owner decided (2026-10-21, consult `82943a86`) to **merge** the two into one core and to **hold the public release** until
the merged core passes its gates and a security pass, so every consumer migrates once. Five follow-up questions were settled
by two question consultants (consult `8764ac0f`): a hash-derived Windows owner token, per-developer database logins (the
sibling's stores), report-only legacy container objects, ONE janitor implementation, and the janitor's detail in a
companion document.

## Goal

One text, two spans, byte-identical in both rule repositories, in which: the **owner segment** of
`testsToDelete-<owner>-<repo>-<what>-<id>` selects what a caller may sweep; the **kernel owner and the owner record**
authorise it; the **three-valued liveness** decides whether the run is gone; deletion needs both keys per resource;
everything else — live, unknown, unreadable, missing, legacy, foreign — is preserved and named; and the **barrier** keeps
every owner-blind sweeper off a shared machine before the first owner-form producer lands. The tools of this repository
are the reference every consumer ports by shape.

## Boundary with the plans around it (named on both sides)

| Item | Built by | The other plan's part |
|---|---|---|
| The rule text, the owned-resource helper, the sweep, the janitor and the guard (the contract itself) | [PLAN_test_leftovers_E1.md](PLAN_test_leftovers_E1.md) built the first version; **this plan revises it** | E1's stories are done in their first form; this plan's S7 promotes that document to `research/` as IMPLEMENTED with this plan as its revision |
| Renaming each consumer's resources, ports of the helper, sweep and guard, consumer pin bumps | [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md) epics E2–E7 | They wait for the ONE release this plan ends with, and each epic's first story becomes "pin bump + rename to the owner form + helper/sweep/guard port, in one commit" |
| The machine barrier before the first owner-form producer | this plan (§ *Barrier checklist*) | Each consumer epic runs it per machine before its first owner-form producer |

Order: this plan first, then the consumer epics. Disjoint: nothing here edits a consumer repository.

## Boundary with the plans around it (named on both sides)

| Item | Built by | The other plan's part |
|---|---|---|
| The rule text, the owned-resource helper, the sweep, the janitor and the guard (the contract itself) | [PLAN_test_leftovers_E1.md](PLAN_test_leftovers_E1.md) built the first version; **this plan revises it** | E1's stories keep their first form; this plan's S7 promotes that document to `research/` as IMPLEMENTED with this plan as its revision |
| Renaming each consumer's resources, ports of the helper, sweep and guard, consumer pin bumps | [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md) epics E2–E7 | They wait for the ONE release this plan ends with, and each epic's first story becomes "pin bump + rename to the owner form + helper/sweep/guard port, in one commit" |
| The machine barrier before the first owner-form producer | this plan (§ *Barrier checklist*) | Each consumer epic runs it per machine before its first owner-form producer |

Order: this plan first, then the consumer epics. Disjoint: nothing here edits a consumer repository.

## Facts the plan rests on (read on `origin/main` `2c96f83`, 2026-10-21)

- Rule structure: `common/test-leftovers.md:8` and `:263` open the two core spans, `:242` and `:280` close them; `## Tokens`
  sits between (`:244`); the per-read cap is `tools/lib/rule-cli.mjs:112` (32 768 B; verified to refuse above it). Body today
  24 382 B.
- The owner record today: `tools/lib/owned.mjs:52` (`OWNER_TEXT`, `<host>@<os>:<pid>[:<start>]`), `:180` `thisOwner`, `:200`
  `parseOwner`, `:210` `writeOwner` (sibling claim, `wx`), `:257` `ownerState` (rule §3's order); the name: `:41-47`
  (`PREFIX`, `REPO_TOKEN`, `REPO_ROW`, `OWNED`, `OWNED_PATTERN`, `MAX_NAME`, `ID_LENGTH`), `:69` `checkWhat`, `:310-313`
  `ownedDir` creates with `mkdtempSync` BEFORE the claim.
- The sweep: `tools/lib/leftovers-sweep.mjs:27` ten minutes, `:49-54` `decide` (missing owner ⇒ `remove: true`), `:132`
  `sweepFolders`, `:156` `sweepOrphanClaims`, `:193` `sweepLeftovers`; wired by `tools/run-tests.mjs:33`.
- The janitor: `tools/janitor.sh:56` `RX`/`GLOB` (prefix only), `:64` `OS`, `:93` `me`, `:100-107` pid and claim readers,
  `:126` `liveness` (three-valued), `:196` `capture`, `:251-252` `skip`/`safe_id`, `:289-292` `act_rm`/`remove_worktree`,
  `:312` the passes. Its contract text is `common/test-leftovers.md:209-241`; `README.md:259` mounts it.
- The guard: `tools/leftovers-check.mjs:49-68` (`EXCLUDED_FILES`, `EXEMPTIBLE`, `CURES`, `PREFIX_OK`, `nameOk`, `TOKEN_SHAPE`),
  `:455` `parseTokenTable`, `:484` `tokenFindings`, `:534-545` `tokenConstants`/`constantFindings`; `README.md:260`.
- Conformance: `tools/owner-conformance.test.mjs:46` loads `tools/fixtures/owner-vectors.json`; `:107` cuts `owner_ok`
  out of the script by name; tests at `:150`, `:160`, `:199`, `:345`.
- The open branch `fix/janitor-stranger-hangs` (`a04bc6d`) carries RED tests 20a–20f (a foreign clone must be owned by the
  caller, no re-read of a stranger's `.git` after the capture, `timeout` on claim reads, `%q` progress lines).
- Purity: `tools/ownership-check.mjs` (no product, family-repository or MCP-tool name in a shared rule); the private
  sibling's rule-text check additionally refuses any line that spells the prefix anchored WITHOUT an owner segment after
  it — the current core has three such lines (`:20`, `:35`, `:129`), the proposed text none.
- Measured on the proposed text (the spec's `merged-check.mjs`): core spans 25 546 + 1 855 B, body 28 660 B (headroom
  4 108 B); the janitor companion's span 7 862 B; no owner-blind line, no purity hit in either family's scan.

## Decisions (from the cornerstone spec; each names what loses)

1. **Name** `testsToDelete-<owner>-<repo>-<what>-<id>`, owner first; the owner grammar `^[uw][0-9]{1,10}$` is reserved and
   no repo token may match it (the guard refuses both). *Loses:* owner after the token (an anchored per-user scan would
   have to parse past the token); a name version by counting hyphens.
2. **Windows owner** `w<digits>`: account name without domain, ASCII `A–Z` lower-cased, UTF-8, SHA-256, first four bytes
   big-endian unsigned, decimal, 1–10 digits; a collision never authorises — the file owner (`-O`) does. *Loses:* `w<name>`
   (would forbid every token starting with `w` for ever).
3. **Record** `<owner>:<host>@<os>:<pid>[:<start>[:<ns>]]` — one grammar for claim, lock reason and label; `<ns>` only with
   `<start>`, Linux only; `TESTSTODELETE_RUN` hands it to children. *Loses:* the sibling's five-colon form with a raw host
   and clock ticks.
4. **Two keys per resource** — scope (name owner = record owner = caller token; kernel uid; own token for a repository's
   sweep) AND abandonment (`gone`, or a free store lock held through the drop). A stricter implementation may refuse its
   whole run while any own record is live. *Loses:* "unmarked and old is nobody's"; age as authority anywhere.
5. **Claim first** (exclusive claim write → register → exclusive create); an existing claim ⇒ new id; an existing resource
   under the claimed name is never adopted. *Loses:* `mkdtemp` in the helper.
6. **Legacy names** (second segment not of the owner grammar): listed with the exact command; collected only with kernel
   uid = caller AND a `gone` old-grammar record; container, volume and network legacy objects are **report-only everywhere**;
   no end date. *Loses:* the old-prefix end-date mechanism.
7. **Removal by identity**: captured Docker id; volume re-inspected; folder/worktree `(dev, ino)` + re-read claim after an
   atomic rename to `.<name>.teststodelete-quarantine-<pid>-<hex>`; branch by captured tip. *Loses:* `rm -rf` of a path read
   at capture time.
8. **One janitor**: `tools/janitor.sh` inventories every scope, sweeps only its caller's, prints `foreign:`/`legacy:`/
   `unmarked:` lines that never change the exit code, has no `--owner`; its detail lives in `common/test-leftovers-janitor.md`
   (one span, byte-identical in both repositories, `load: conditional`, read before running or copying it). *Loses:* a
   second janitor in any language; the janitor section inside the core.
9. **The barrier** is core text: on a machine several OS users share, no owner-form producer until a scan lists no
   owner-blind sweeper; sweeper + producers in ONE commit on any machine; a rollback never restores an owner-blind one. The
   public family's scan is the new `tools/sweeper-scan.mjs`.
10. **Guard**: two classes, `legacy-name` and `owner-blind`; one exemption marker for an inventory line
    (`testsToDelete-exempt: owner-blind — <reason>`), honoured by the guard and by the scan.

## Build order

1. Merge `fix/janitor-stranger-hangs` into `main` (RED tests + the janitor delta). No release.
2. S1 — the two rule texts (cornerstone). 3. S2 — `owned.mjs`. 4. S3 — the sweep. 5. S4 — the janitor + its companion
(cornerstone, security). 6. S5 — the guard + the sweeper scan. 7. S6 — the shared vectors and the conformance test.
8. S7 — docs, the promotion of the E1 plan, the one release (held until S1–S6 are merged and the private sibling's rebuild
has its text).

One PR for S1–S6 (the spans and the tools must land together: the guard goes red on the old form the day the text changes);
S7 is the release step.

## Stories

### S1 — The two rule texts — **cornerstone (1 of 2), `model: fable`** (the spec is written; a Sonnet coder lands it, Opus reviews)

- **Files:** `common/test-leftovers.md` (body from the spec's companion, frontmatter unchanged), new
  `common/test-leftovers-janitor.md` (frontmatter `id: common.test-leftovers-janitor`, `load: conditional`,
  `tasks: ["audit","policy","release"]`), `research/rule-bodies.json` via `node tools/rule-bodies.mjs --update` for both ids.
- **Brief:** overwrite the body; `node tools/ownership-check.mjs` → OK (RED proof: insert a product word → one finding);
  `node tools/rule-bodies.mjs` → `DRIFT common.test-leftovers` and a new-id notice, then `--update` both; the five
  `explain` figures per task into the PR; `node tools/sweeper-scan.mjs --root .` (S5) → 0 lines on both files.
- **Scenarios:** (1) exactly two spans in the rule and one in the companion, non-empty, extracted by the same definition
  the sibling uses (`<!-- core:begin -->\n` … `<!-- core:end -->`, CRLF → LF); (2) body ≤ 32 768 B — RED: append 4 200 B to a
  scratch copy and `node tools/rules.mjs read --only common.test-leftovers` must refuse; (3) no line of either file is
  owner-blind under the shared classifier (S5's `classifyLine`) — RED: the current `main` text has three; (4) the core's
  stub names `common/test-leftovers-janitor.md` and the companion names the core; (5) every example name carries an owner
  of the grammar; no `testsToDelete-<token>-…` example survives.
- **Review checklist (Opus):** every slot S2–S6 cite resolves to ONE sentence (owner grammar §1, Windows derivation §1,
  budget §1, legacy §1, claim order §2, record §3, scope evidence §3, liveness steps §3, two keys §4, identity §4, legacy
  handling §4, classes §7, barrier); `sweep` = §4, `janitor` = the shipped script, `teardown` = the run's own; no link, no
  product, no family fact inside a span.

### S2 — `tools/lib/owned.mjs`: the owner token, the merged record, claim first (`model: sonnet`, Opus review)

- `ownerToken`, `thisOwnerToken`, `OWNER_GRAMMAR`; `ownedPrefix`/`ownedPattern` built per owner (no `OWNED`/`OWNED_PATTERN`
  constants — `:44-45` go); `checkWhat` budgets the owner; `OWNER_TEXT` = the merged grammar, `parseLegacyOwner` beside it;
  `thisOwner` carries `owner` and Linux `ns`; `runRecord` reads `TESTSTODELETE_RUN`; `classifyName`; `isMine`; `ownedDir`
  claim-first with `mkdirSync`; `ownerState` with `nameOwner`/`callerOwner`/`kernelMine` and the namespace step; `hidepid`.
- **Tests (RED first, `tools/owned.test.mjs`):** 15 the name carries the caller's owner before the token and refuses a
  `what` that leaves no room (`checkWhat` names the room); 16 `ownedDir` claims FIRST — an existing claim draws a new id, an
  existing folder under the claimed name is never adopted and the helper's own claim is removed; 17 `thisOwner` carries
  the owner token and, on Linux, the pid namespace; `TESTSTODELETE_RUN` replaces the process when valid and is refused when
  not; 18 `TESTSTODELETE_OWNER=u0` by a non-root user widens nothing — `ownerState` with `kernelMine: false` is unknown;
  19 a record whose owner is not the name's or not the caller's is unknown; a Linux record without a namespace is unknown;
  20 the Windows token: `Alice` and `alice` give one token, a non-ASCII letter is left as it is, the result is 1–10 digits.
  Existing 1–14g updated to the new record and order (10: the claim is still invisible to the resource's user).

### S3 — `tools/lib/leftovers-sweep.mjs`: two keys, identity, legacy (`model: sonnet`, Opus review)

- `decide` never removes on a missing owner; reasons `unmarked`, `foreign-uid`, `legacy`, `replaced`; the quarantine rename +
  `(dev, ino)` + re-read claim; `restoreQuarantineOrphans`; worktrees through `git worktree move`; branches by captured tip;
  report lines `foreign:`/`legacy:`/`unmarked:` with the exact command for a legacy item; `run-tests.mjs` prints them.
- **Tests (RED first, `tools/leftovers-sweep.test.mjs`):** 11 two users, one repository (a second uid is simulated through
  the `isMine` seam and a real second user where CI runs one): the other uid's owner-form folders are listed as foreign and
  never touched, even dead; 12 a forged owner segment (my token in the name, another uid on the folder) is preserved
  `foreign-uid`; 13 an unmarked owner-form folder older than the window is listed, never removed — RED: today `decide` removes
  it; 14 a legacy folder of my uid with a dead legacy record is collected, a legacy folder of another uid is listed; 15
  replacement between inspection and deletion: a folder swapped for a different inode after the verdict is kept and named;
  16 a quarantine left by a killed sweep is restored under its name when free. Existing 1–10b re-targeted.

### S4 — `tools/janitor.sh` and `common/test-leftovers-janitor.md` — **cornerstone (2 of 2), `model: fable` (the security pass)**; Sonnet codes, Opus reviews, Fable judges

- The capture keeps its breadth and gains `form`/`nameowner` columns; `ME_OWNER` (Linux/macOS `id -u`; Windows the
  `sha256sum` derivation); `scope_ok` with `-O` on folder, claim and the worktree's clone; `owner_ok` merged grammar +
  `legacy_owner_ok`; `ns_ok`; the identity re-check and quarantine `mv` before `rm -rf`; the captured clone dir carried
  through `DEL`; `timeout` on claim/`.git` reads and on git calls to a clone; `foreign:`/`legacy:`/`unmarked:` lines; exit 3
  only for the caller's scope; `TESTSTODELETE_OWNER` validated or exit 2; no `--owner`.
- **Tests (RED first, `tools/janitor.test.mjs` / `tools/janitor-liveness.test.mjs`):** 21 root (a `JANITOR_TEST_UID`
  seam announced like every seam, plus a real uid-0 run where CI is root) inventories every scope and deletes only `u0`'s;
  22 both name versions side by side: the owner-form row is judged, the legacy row prints its command, exit stays 0; 23 a
  forged owner prefix on a folder another user owns is foreign and kept; 24 inaccessible process evidence (`hidepid`,
  `EPERM`, a record without a namespace, a failing `tasklist`) keeps the resource; 25 the inode re-check: a folder replaced
  after the capture is skipped "changed after the capture" (20d generalised, junction case on Windows too); 26 Windows:
  `w<digits>` equals the Node derivation for every `windows-owner` vector and `-O` decides ownership; 27 a legacy container
  is a `legacy:` line and is never removed, whatever its label says; 20a–20f from the hardening branch stay green; 1–19 and
  L1–S13 re-targeted (3: the "dead old unmarked" folder is now listed, not removed).
- **The companion document** is read by the test that cuts `owner_ok` by name: the header of the script names it; a
  `rules.test.mjs` entry pins that the stub in the core names the companion.

### S5 — `tools/leftovers-check.mjs` and the new `tools/sweeper-scan.mjs` (`model: sonnet`, Opus review)

- The guard: `tokenFindings` refuses an owner-grammar token; classes `legacy-name` and `owner-blind`; `PREFIX_OK` requires
  the owner form; `CURES`; the exemption grammar unchanged.
- The scan: `tools/lib/sweeper-scan.mjs` exports `classifyLine(text)` (the ONE implementation the guard's `owner-blind`
  class uses) and `scanSweepers({ root })` over checkouts, worktrees, rule copies under `.claude`/`.agents`, cron and systemd
  job files, PowerShell scheduled-task exports where present; `tools/sweeper-scan.mjs --root <dir>`: exit 0 none, 1 found,
  2 unreadable evidence (the barrier stays closed). Honours `testsToDelete-exempt: owner-blind — …` and, for the transition,
  the sibling's `not-a-sweeper` marker.
- **Tests:** `leftovers-check.test.mjs` 3b a token of the owner grammar is a `token` finding; 2 `legacy-name` for a literal in
  all three spellings and for a `REPO_TOKEN`-built prefix without an owner; 2 `owner-blind` for a prefix-only regex, glob and
  `--filter`, cleared by the exemption; break-it: removing the janitor's exemption line makes `node tools/leftovers-check.mjs`
  red on `tools/janitor.sh:56`. `sweeper-scan.test.mjs`: the three lines of the current `main` rule are found (fixture); the
  proposed text yields none; an unreadable job file is exit 2; the scan never deletes.

### S6 — The shared vectors and the conformance test (`model: sonnet`, Opus review)

- `tools/fixtures/owner-vectors.json`: grammar vectors on the merged record; the new `names` table; `verdicts` with
  `nameOwner`/`recordOwner`/`callerOwner`/`kernelMine`/`ns`; the `windows-owner` table; `hostnames` unchanged. The file is
  copied byte for byte by the private sibling, so every vector carries its reason and no family fact.
- `tools/owner-conformance.test.mjs`: the new tables asked of bash (`owner_ok`, `legacy_owner_ok`, `scope_ok`'s pure half,
  the Windows derivation through `sha256sum`) and Node; the janitor verdict run gains `kernelMine` through the `-O` seam.

### S7 — Docs, the E1 promotion, the release (`model: sonnet`)

- `README.md:259-260` + the mounted-tools table (`sweeper-scan`, the companion); `todo/PLAN_test_leftovers_E1.md` →
  `research/` as IMPLEMENTED with this plan recorded as its revision; `todo/PLAN_test_leftovers_rollout.md`: every consumer
  epic's first story becomes "pin bump + rename to the owner form + helper/sweep/guard port, in ONE commit", the barrier
  checklist of this plan is linked, the ledger line gains this plan's two cornerstones; the release is promoted ONCE, after
  the private sibling confirms its rebuild carries the same spans (its test pins their sha256).

## Barrier checklist (run per machine BEFORE any consumer's first owner-form producer)

- `node tools/sweeper-scan.mjs --root <machine root>` → 0 lines, or every line resolved below.
- Scheduled janitors (cron, systemd timers, Task Scheduler) calling an old `janitor.sh`: bumped or disabled.
- Root jobs sweeping the temp root by prefix: disabled.
- Every consumer's own sweep is owner-blind today: the Node start-of-run temp sweep (this repository's `run-tests.mjs:33`
  shape and its ports), the C# temp-directory sweep, the JSON-driven test sweep, the product-side store sweep — each
  listed, each replaced in that consumer's first story.
- Old branches and agent worktrees pinned to an old rule copy: bumped, or their suites not run on a shared machine.
- The scan's `unreadable` lines are resolved by hand; the barrier is never declared open on unread evidence.

## Test plan

`npm test` (every suite above); `node tools/leftovers-check.mjs` on this repository; `node tools/sweeper-scan.mjs --root .`;
`node tools/ownership-check.mjs`; `node tools/rule-bodies.mjs`; `npm run check`; the conformance test on Windows (Git for
Windows' bash) and on Linux (CI, once as root for S4 scenario 21); the RED observations of every numbered test quoted in
the PR.

## Definition of Done

- [ ] The two rule texts are the spec's companions byte for byte; both bodies under the cap; no owner-blind line; the
      sibling's rebuild reports both spans byte-identical.
- [ ] `owned.mjs`, the sweep, the janitor, the guard, the scan and the vectors implement decisions 1–10; every new test was
      RED first with its real symptom, then green; the full suite green on Windows and Linux.
- [ ] The hardening branch is merged first and its tests stay green.
- [ ] A Fable security pass over S4 covered the ten scenarios of the spec's §6 (forged owner, forged claim, root, replacement
      after capture, inaccessible evidence, hostile names, two users one daemon, the override's reach, the Windows token,
      the scan's blind spots) with a SHIP verdict.
- [ ] `README.md`, `rule-bodies.json`, the E1 promotion and the rollout plan's first-story rule are updated; the release was
      promoted once, after the sibling's confirmation.
- [ ] Cornerstones of this plan: **2 of 2 — S1 (the merged core text, model: fable), S4 (the one janitor and its companion,
      the security pass, model: fable)**.
