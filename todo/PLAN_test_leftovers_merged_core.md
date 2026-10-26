# PLAN — Test leftovers, the merged core: the owner segment scopes, the kernel authorises, liveness decides

> Status: **in progress, 2026-10-23** — draft PR #82 carries S5a, S1, S2, S3, S5b, S6 and their review round; S4, S0
> and S7 are open (see [Progress and hand-off](#progress-and-hand-off-2026-10-23) at the end). Scope: `common/test-leftovers.md`, a new
> `common/test-leftovers-janitor.md`, `tools/lib/owned.mjs`, `tools/lib/leftovers-sweep.mjs`, `tools/janitor.sh`,
> `tools/leftovers-check.mjs`, `tools/fixtures/owner-vectors.json`, a new `tools/fixtures/owner-blind-allowlist.json`,
> `tools/owner-conformance.test.mjs`, a new `tools/sweeper-scan.mjs`, a new `research/security/` verdict file, their tests,
> `README.md`, `research/rule-bodies.json`. Plan-gate round 1 passed (good_enough); its findings are applied below.
>
> Related docs: [PLAN_test_leftovers_E1.md](PLAN_test_leftovers_E1.md) (the contract this one revises — promoted to
> `research/` by this plan's last story), [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md) (the consumer
> epics, which now wait for THIS release and split into two stages), [rule-ownership.md](../common/rule-ownership.md).
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
every owner-blind sweeper off a shared machine before the first owner-form producer lands — this repository being that
first producer. The tools of this repository are the reference every consumer ports by shape.

## Boundary with the plans around it (named on both sides)

| Item | Built by | The other plan's part |
|---|---|---|
| The rule text, the owned-resource helper, the sweep, the janitor and the guard (the contract itself) | [PLAN_test_leftovers_E1.md](PLAN_test_leftovers_E1.md) built the first version; **this plan revises it** | E1's stories keep their first form; this plan's S7 promotes that document to `research/` as IMPLEMENTED with this plan as its revision |
| Renaming each consumer's resources, ports of the helper, sweep and guard, consumer pin bumps | [PLAN_test_leftovers_rollout.md](PLAN_test_leftovers_rollout.md) epics E2–E7 | They wait for the ONE release this plan ends with; each epic splits into a sweep-only stage and a producer stage (pin bump + rename + helper/guard port in one commit), all sweep-only stages before any producer stage |
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
- The sweep: `tools/lib/leftovers-sweep.mjs:27` ten minutes, `:49-54` `decide` (missing owner ⇒ `remove: true`), `:89`
  `removeWorktree`, `:132` `sweepFolders`, `:156` `sweepOrphanClaims`, `:193` `sweepLeftovers`; wired by `tools/run-tests.mjs:33`.
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
- Measured on the proposed text (the spec's `merged-check.mjs`, after plan-gate round 1): core spans 26 524 + 1 872 B, body
  29 655 B (headroom 3 113 B); the janitor companion's span 8 526 B; no owner-blind line, no purity hit in either
  family's scan.
- A git worktree cannot be renamed into quarantine: its `.git` file and the clone's `worktrees/<n>/gitdir` point at the
  path (gate P0); `removeWorktree` at `:89` already removes through git.

## Decisions (from the cornerstone spec; each names what loses)

1. **Name** `testsToDelete-<owner>-<repo>-<what>-<id>`, owner first; the owner grammar `^[uw][0-9]{1,10}$` is reserved and
   no repo token may match it (the guard refuses both). *Loses:* owner after the token; a name version by counting hyphens.
2. **Windows owner** `w<digits>`: the account name without domain, ASCII `A–Z` lower-cased and nothing else changed, the
   UTF-8 bytes of the name alone (no line end — `printf '%s'`), SHA-256, first four digest bytes as a big-endian unsigned
   32-bit integer, decimal without leading zeros, 1–10 digits; a collision never authorises — the file owner (`-O`, the
   owner SID of the opened handle) does. *Loses:* `w<name>`.
3. **Record** `<owner>:<host>@<os>:<pid>[:<start>[:<ns>]]` — one grammar for claim, lock reason and label; `<ns>` only with
   `<start>`, Linux only; `TESTSTODELETE_RUN` hands it to children. *Loses:* a five-colon form with a raw host and clock ticks.
4. **Two keys per resource** — scope (name owner = record owner = caller token; kernel uid; own token for a repository's
   sweep) AND abandonment (`gone`, or a free store lock held through the drop). A stricter implementation may refuse its
   whole run while any own record is live. *Loses:* "unmarked and old is nobody's"; age as authority anywhere.
5. **Claim first** (exclusive claim write → register → exclusive create). An existing claim ⇒ a new id. A **squatted name**
   (`mkdir` finds a folder under the claimed name) ⇒ ONE warning naming the collision, the helper removes its own claim (only while
   it still holds exactly what it wrote, so a claim of a run that dies later never governs a folder this run did not
   create; the squatter's folder is judged by the normal rules), a new id is drawn; the squatter's folder is never adopted and never removed by the helper. An **orphan claim**
   (claim without a folder) is collected under the two keys when its owner is `gone`; two live runs never share a name,
   because the claim is exclusive. *Loses:* `mkdtemp` in the helper; "remove the claim and draw again" on a collision.
6. **Legacy names** (second segment not of the owner grammar): listed with the exact command; collected only with kernel
   uid = caller AND a `gone` old-grammar record; container, volume and network legacy objects are **report-only everywhere**;
   no end date. *Loses:* the old-prefix end-date mechanism.
7. **Removal by identity**: captured Docker id; volume re-inspected; a PLAIN folder by `(dev, ino)` + re-read claim after an
   atomic rename to the sibling `.<name>.teststodelete-quarantine-<pid>-<hex>` (same parent, never across a file system, a
   leading `.` so no prefix match reaches it); a **worktree is never renamed** — `(dev, ino)` + lock-reason re-check, then
   `git worktree remove --force --force`; a branch by captured tip; a quarantine orphan is restored only onto a free name
   (exclusive `mkdir` + rename) and reported otherwise, never over an existing folder. *Loses:* `rm -rf` of a path read at
   capture time; `git worktree move` into quarantine.
8. **One janitor**: `tools/janitor.sh` inventories every scope, sweeps only its caller's, prints `foreign:`/`legacy:`/
   `unmarked:` lines that never change the exit code, has no `--owner`; its detail lives in `common/test-leftovers-janitor.md`
   (one span, byte-identical in both repositories, `load: conditional`, read before running or copying it); on Windows the
   dependency is Git for Windows' bash and support is proven by an end-to-end check — until it passes on a machine the
   janitor there is `--dry-run` only. *Loses:* a second janitor in any language.
9. **The barrier** is core text: on a machine several OS users share, no owner-form producer until a scan lists no
   owner-blind sweeper; every repository moves in two stages — its SWEEP-ONLY stage (owner-aware or disabled sweeps, no
   owner-form producer) and its PRODUCER stage — and every sweep-only stage on a shared machine lands before any producer
   stage; the **allowed rollbacks** are exactly two: disable the sweeps and the janitor (they then delete nothing), or pin
   the sweeper stage without the producer stage; restoring owner-blind deletion is never a rollback. The public family's
   scan is the new `tools/sweeper-scan.mjs` with a user scope by default and `--system` for an administrator.
10. **Guard**: two classes, `legacy-name` (exemptible) and `owner-blind` (NOT exemptible by comment: the only pass is the
    allowlist `tools/fixtures/owner-blind-allowlist.json` keyed by file path + line number + sha256 of the line, holding
    exactly the janitor's inventory line; an annotated arbitrary `rm -rf`/docker sweep is still a finding).
11. **The helper and the guard serve consumers as shipped files** (owner decision 2026-10-26, from the private sibling's
    rollout: Node consumers wrap and run them, never port them). `owned.mjs` takes the repository token as a parameter;
    `leftovers-check.mjs` reads a consumer's tree; the private sibling copies both byte for byte and pins their sha256, like
    the janitor. *Loses:* "each consumer ports the helper and the guard"; this repository's token as the only one the
    helper knows. S8.

## Build order

0. **The pre-merge gate (this repository is the first owner-form producer):** on every machine that builds or tests this
   repository — each developer machine and each CI runner — run the barrier checklist below (the scan in user scope by the
   developer, `--system` by an administrator, plus the manual items) and record it in `research/security/barrier-<machine>.md`
   BEFORE the merged-core PR merges. S0 below.
1. Merge `fix/janitor-stranger-hangs` into `main` (RED tests + the janitor delta). No release.
2. S5a — `tools/lib/sweeper-scan.mjs` (`classifyLine`) lands FIRST inside the PR, so S1's scan checks have something to run
   (gate P7). 3. S1 — the two rule texts (cornerstone). 4. S2 — `owned.mjs`. 5. S3 — the sweep. 6. S4 — the janitor + its
   companion (cornerstone, security). 7. S5b — the guard, the allowlist, the scan CLI. 8. S6 — the shared vectors and the
   conformance test. 8b. S8 — the helper and the guard for consumers (decision 11). 9. S7 — docs, the promotion of the E1 plan, the one release (held until S1–S6 are merged, the pre-merge
   gate is recorded, and the private sibling's rebuild has its text).

One PR for S0–S6 (the spans and the tools must land together: the guard goes red on the old form the day the text changes);
S7 is the release step.

## Stories

### S0 — The pre-merge barrier gate for this repository (`model: sonnet` records; a person attests)

- For every machine that builds or tests this repository: `node tools/sweeper-scan.mjs --root <checkout parent>` as the
  developer; `--system` once by an administrator; the manual items of the checklist; the result in
  `research/security/barrier-<machine>.md`. **The scan ships in this PR (S5b), so each machine runs it from a checkout of
  the PR branch, before the merge** — never from `main`, which does not have it yet (plan gate 2026-10-26).
- Each record carries: the machine's identity (host name, OS, the OS users that build or test here), the date, the commit
  of the scan it ran, the scan's outcome, and each attestation by name for what the scan could not read. A person reviews
  the records; `research/security/machines.md` is the inventory, and adding a machine that builds or tests this repository
  adds its record in the same commit.
- **Out of scope:** a GitHub-hosted runner — one job's, discarded with it (rule §3), never shared by two OS users; this
  repository's CI runs only there. A persistent self-hosted runner is a machine like any other and is in the inventory.
- **Scenario:** the PR's merge is blocked (a required check reads the folder) until a file exists for every machine named in
  `research/security/machines.md`, each with the fields above; RED: one machine missing, or a record without the scan
  commit → the check names it.

### S1 — The two rule texts — **cornerstone (1 of 2), `model: fable`** (the spec is written; a Sonnet coder lands it, Opus reviews)

- **Files:** `common/test-leftovers.md` (body from the spec's companion, frontmatter unchanged), new
  `common/test-leftovers-janitor.md` (frontmatter `id: common.test-leftovers-janitor`, `load: conditional`,
  `tasks: ["audit","policy","release"]`), `research/rule-bodies.json` via `node tools/rule-bodies.mjs --update` for both ids.
- **Brief:** overwrite the body; `node tools/ownership-check.mjs` → OK (RED proof: insert a product word → one finding);
  `node tools/rule-bodies.mjs` → `DRIFT common.test-leftovers` and a new-id notice, then `--update` both; the five
  `explain` figures per task into the PR; `node tools/sweeper-scan.mjs --root .` (after S5a) → 0 lines on both files.
- **Scenarios:** (1) exactly two spans in the rule and one in the companion, non-empty, extracted by the same definition
  the sibling uses (`<!-- core:begin -->\n` … `<!-- core:end -->`, CRLF → LF); (2) body ≤ 32 768 B — RED on an INFLATED
  COPY: a scratch root holding the rule with 3 200 B appended, read with `node tools/rules.mjs read --repo <scratch> --only
  common.test-leftovers`, must refuse with the cap sentence; the real file is never swapped (gate P9); (3) no line of either
  file is owner-blind under S5a's `classifyLine` — RED: the current `main` text has three; (4) the core's stub names
  `common/test-leftovers-janitor.md` and the companion names the core; (5) every example name carries an owner of the
  grammar; no `testsToDelete-<token>-…` example survives.
- **Review checklist (Opus):** every slot S2–S6 cite resolves to ONE sentence (owner grammar §1, Windows derivation §1,
  budget §1, legacy §1, claim order and the squatted-name rule §2, record §3, scope evidence §3, liveness steps §3, two keys
  §4, identity with the worktree exception §4, legacy handling §4, classes §7, the two stages and the two rollbacks in the
  barrier); `sweep` = §4, `janitor` = the shipped script, `teardown` = the run's own; no link, no product, no family fact
  inside a span.

### S2 — `tools/lib/owned.mjs`: the owner token, the merged record, claim first (`model: sonnet`, Opus review)

- `ownerToken` (Windows: `createHash("sha256").update(Buffer.from(asciiLower(username), "utf8")).digest().readUInt32BE(0)`,
  `asciiLower` lower-casing `A–Z` only), `thisOwnerToken`, `OWNER_GRAMMAR`; `ownedPrefix`/`ownedPattern` built per owner
  (`OWNED`/`OWNED_PATTERN` constants at `:44-45` go); `checkWhat` budgets the owner; `OWNER_TEXT` = the merged grammar,
  `parseLegacyOwner` beside it; `thisOwner` carries `owner` and Linux `ns`; `runRecord` reads `TESTSTODELETE_RUN`;
  `classifyName`; `isMine`; `ownedDir` claim-first with `mkdirSync` and the squatted-name behaviour of decision 5;
  `ownerState` with `nameOwner`/`callerOwner`/`kernelMine` and the namespace step; `hidepid`.
- **Tests (RED first, `tools/owned.test.mjs`):** 15 the name carries the caller's owner before the token and refuses a
  `what` that leaves no room (`checkWhat` names the room); 16 `ownedDir` claims FIRST — an existing claim draws a new id;
  16b a squatted name: the helper warns once, removes its own claim at once (and its teardown never removes a claim it no longer holds), the squatter's folder
  is untouched, a new id is drawn (RED: today `mkdtemp` never collides, so the test first proves the seam); 16c an orphan
  claim with a `gone` owner is collected by the sweep and one with a live owner stays, and a second helper never obtains
  the same name while the first's claim exists; 17 `thisOwner` carries the owner token and, on Linux, the pid namespace;
  `TESTSTODELETE_RUN` replaces the process when valid and is refused when not; 18 `TESTSTODELETE_OWNER=u0` by a non-root
  user widens nothing — `ownerState` with `kernelMine: false` is unknown; 19 a record whose owner is not the name's or not
  the caller's is unknown; a Linux record without a namespace is unknown; 20 the Windows token: `Alice` and `alice` give
  one token, a name with a space and a multi-byte name hash their UTF-8 bytes with no line end, the result is 1–10 digits
  and equals the shared `windows-owner` vectors. Existing 1–14g updated (10: the claim stays invisible to the resource's user).

### S3 — `tools/lib/leftovers-sweep.mjs`: two keys, identity, legacy (`model: sonnet`, Opus review)

- `decide` never removes on a missing owner; reasons `unmarked`, `foreign-uid`, `legacy`, `replaced`,
  `quarantine-conflict`; a PLAIN folder: the quarantine rename + `(dev, ino)` + re-read claim; a WORKTREE: `(dev, ino)` +
  lock-reason re-check, then `git worktree remove --force --force` (never `git worktree move`, never a rename);
  `restoreQuarantineOrphans` restores onto a free name only (exclusive `mkdirSync` + `renameSync`) and reports the rest;
  branches by captured tip; report lines `foreign:`/`legacy:`/`unmarked:` with the exact command for a legacy item;
  `run-tests.mjs` prints them.
- **Tests (RED first, `tools/leftovers-sweep.test.mjs`):** 11 two users, one repository (a second uid through the `isMine`
  seam, and a real second user where CI runs one): the other uid's owner-form folders are listed as foreign and never
  touched, even dead; 12 a forged owner segment (my token in the name, another uid on the folder) is preserved `foreign-uid`;
  13 an unmarked owner-form folder older than the window is listed, never removed — RED: today `decide` removes it; 14 a
  legacy folder of my uid with a dead legacy record is collected, one of another uid is listed; 15 replacement between
  inspection and deletion: a folder swapped for a different inode after the verdict is kept and named; 16 a quarantine left
  by a killed sweep is restored under its name when free, and when the name is taken it is reported `quarantine-conflict`
  and nothing is overwritten; 17 a dead-owned WORKTREE is removed through git and its folder is never renamed — the clone's
  `worktrees/<n>/gitdir` still resolves until `remove` runs (RED: a rename-first implementation leaves a dangling gitdir).
  Existing 1–10b re-targeted.

### S4 — `tools/janitor.sh` and `common/test-leftovers-janitor.md` — **cornerstone (2 of 2), `model: fable` (the security pass)**; Sonnet codes, Opus reviews, Fable judges

- The capture keeps its breadth and gains `form`/`nameowner` columns; `ME_OWNER` (Linux/macOS `id -u`; Windows
  `printf '%s' "$(id -un | LC_ALL=C tr 'A-Z' 'a-z')" | sha256sum | cut -c1-8` → `$(( 16#… ))`); `scope_ok` with `-O` on folder,
  claim and the worktree's clone; `owner_ok` merged grammar + `legacy_owner_ok`; `ns_ok`; the identity re-check before every
  removal; a plain folder `mv`ed into the sibling quarantine, its device, inode and re-read claim checked AGAIN in the
  quarantine, then `rm -rf` — a mismatch is renamed back and skipped (plan gate 2026-10-26; the Node sweep does the same); a worktree NEVER `mv`ed — `git worktree remove
  --force --force` on the captured clone; a quarantine of the caller's uid with a dead renamer restored onto a free name
  only, else a notice — as the FIRST step of every run, before the capture (plan gate 2026-10-26); the captured clone dir carried through `DEL`; `timeout` on claim/`.git` reads and git calls;
  `foreign:`/`legacy:`/`unmarked:` lines; exit 3 only for the caller's scope; `TESTSTODELETE_OWNER` validated or exit 2;
  no `--owner`; the inventory line is the ONE entry of `tools/fixtures/owner-blind-allowlist.json`.
- **Tests (RED first, `tools/janitor.test.mjs` / `tools/janitor-liveness.test.mjs`):** 21 root (a `JANITOR_TEST_UID` seam
  announced like every seam, plus a real uid-0 run where CI is root) inventories every scope and deletes only `u0`'s; 22
  both name versions side by side: the owner-form row is judged, the legacy row prints its command, exit stays 0; 23 a
  forged owner prefix on a folder another user owns is foreign and kept; 24 inaccessible process evidence (`hidepid`,
  `EPERM`, a record without a namespace, a failing `tasklist`) keeps the resource; 25 the inode re-check: a folder replaced
  after the capture is skipped "changed after the capture" (20d generalised, junction case on Windows too); 26 Windows:
  `w<digits>` equals the Node derivation for every `windows-owner` vector and `-O` decides ownership; 27 a legacy container
  is a `legacy:` line and is never removed, whatever its label says; **28 the Windows end-to-end check** (runs only on a
  Windows machine with Git for Windows' bash, skipped elsewhere with a diagnostic): an owned dead leftover folder is
  deleted, a live one and a foreign-owner one are kept — the check gate C6 asks for before the sibling withdraws its
  listing-only path; 29 a dead-owned worktree goes through `git worktree remove`, never a rename, and a quarantine orphan
  is restored only onto a free name; **30** a folder swapped between the pre-rename check and the rename is caught by the re-check in the quarantine, renamed back and skipped, nothing removed; **31** a run killed after the rename (a quarantine left behind) has it restored by the NEXT run before that run's capture (plan gate 2026-10-26); 20a–20f from the hardening branch stay green; 1–19 and L1–S13 re-targeted (3: the
  "dead old unmarked" folder is now listed, not removed).
- **The security verdict is a file** (gate P8): `research/security/test-leftovers-merged-core.md` — the reviewed commit
  hash and one line per scenario of the spec's §6 (SHIP, or FIX + the fix commit); the Fable pass writes it, the DoD reads it.
- The companion document is named by the script's header; a `rules.test.mjs` entry pins that the core's stub names it.

### S5 — The scan's classifier (S5a), then the guard, the allowlist and the scan CLI (S5b) (`model: sonnet`, Opus review)

- **S5a** `tools/lib/sweeper-scan.mjs` exports `classifyLine(text)` and `scanSweepers({ root, system, allowlist })` — the ONE
  implementation the guard's `owner-blind` class and S1's scan check use. Lands first in the PR.
- **S5b** the guard: `tokenFindings` refuses an owner-grammar token; class `legacy-name` (exemptible); class `owner-blind`
  cleared ONLY by `tools/fixtures/owner-blind-allowlist.json` (entries `{ file, line, sha256 }`; the janitor's inventory line
  is its one entry; `node tools/leftovers-check.mjs --update-allowlist` regenerates it from the current file and a test pins
  that the entry matches the shipped script); `PREFIX_OK` requires the owner form; `CURES`.
  The scan CLI `tools/sweeper-scan.mjs [--root <dir>] [--system]`: user scope by default — the caller's checkouts and
  worktrees under `--root`, the caller's crontab (`crontab -l`), `~/.config/systemd/user`, the caller's scheduled tasks;
  `--system` adds `/etc/crontab`, `/etc/cron*`, `/var/spool/cron`, `/etc/systemd/system` and every home; on Windows the Task
  Scheduler is read directly (`schtasks /query /fo csv /v`, falling back to `Get-ScheduledTask` through PowerShell). Exit 0
  none, 1 found, **2 when anything in the requested scope could not be read** (an unqueryable Task Scheduler included) —
  the barrier stays closed until a recorded human attestation. For the sibling's files it still honours their
  `not-a-sweeper` marker during the transition.
- **Tests:** `leftovers-check.test.mjs` 3b a token of the owner grammar is a `token` finding; 2 `legacy-name` for a literal in
  all three spellings and for a `REPO_TOKEN`-built prefix without an owner; 2 `owner-blind` for a prefix-only regex, glob and
  `--filter`; **2 an annotated arbitrary `rm -rf`/docker sweep carrying `testsToDelete-exempt: owner-blind — …` is STILL a
  finding** (RED against a comment-based exemption); 2 the allowlist clears the janitor's line and not the same text in
  another file or at another line; break-it: one byte changed on `tools/janitor.sh:56` makes the guard red until
  `--update-allowlist`. `sweeper-scan.test.mjs`: the three lines of the current `main` rule are found (fixture); the
  proposed text yields none; an unreadable job file in the requested scope is exit 2; `--system` reads `/etc` and the user
  scope does not; a stubbed `schtasks` that fails is exit 2; the scan never deletes.

### S6 — The shared vectors and the conformance test (`model: sonnet`, Opus review)

- `tools/fixtures/owner-vectors.json`: grammar vectors on the merged record; the new `names` table; `verdicts` with
  `nameOwner`/`recordOwner`/`callerOwner`/`kernelMine`/`ns`; the `windows-owner` table (at least one name whose token is
  ≥ 2^31 — the digest's high bit set — asked of bash `$(( 16#… ))` and Node `readUInt32BE` alike, plan gate 2026-10-26; upper case, a space, multi-byte
  names, the canonical input stated in `about`); `hostnames` unchanged. The file is copied byte for byte by the private
  sibling, so every vector carries its reason and no family fact.
- `tools/owner-conformance.test.mjs`: the new tables asked of bash (`owner_ok`, `legacy_owner_ok`, `scope_ok`'s pure half,
  the Windows derivation through `sha256sum` with `printf '%s'`) and Node; the janitor verdict run gains `kernelMine`
  through the `-O` seam.

### S8 — The helper and the guard for consumers (decision 11; Opus brief, `model: sonnet`, Opus review)

- **`tools/lib/owned.mjs`:** `ownedFor({ token, row })` returns the same API bound to that token (`ownedPrefix`,
  `ownedPattern`, `ownedName`, `ownedDir`, `ownedWorktree`, `classifyName`, `runRecord`, `formatOwner`, `cleanupScope`,
  …); `token` is validated (`[a-z0-9]{2,12}`, not of the owner grammar) or it throws. The module's own exports stay bound
  to this repository's `REPO_TOKEN`, so nothing here changes behaviour. `tools/lib/git.mjs` (which it imports) ships with it.
- **`tools/leftovers-check.mjs`:** (a) `--profile node` adds a consumer's tracked `**/*.{test,spec}.{ts,tsx,mts,cts,js,mjs,cjs}`,
  `scripts/**`, `test/**`, `tests/**` files (`node_modules` and the mount paths `.claude/rules/shared/`,
  `.agents/conventions/` excluded) to today's set; without it the scan is today's. (b) A `docker-name` value that is
  wholly a shell expansion (`"${x}"`, `"$(f …)"`) is dynamic, as a JS array item already is: not a finding — a text scan
  cannot know it; the consumer's helper tests cover what it builds. (c) `yaml` is resolved from the scanned repository
  (`createRequire(path.join(<repo>, "noop.js"))`, which walks up from the repository root whether or not a
  `package.json` sits there) when the guard's own resolution fails; neither → exit 2 with the sentence to add
  `yaml@2` as a devDependency. (d) The token check reads the mounted rule's `## Tokens` table whatever families it lists
  and requires the `--token` row to name `--identity`; "this public copy lists only `dew_flow`" moves from the guard into
  `tools/rules.test.mjs`. **Not in S8:** a `module-load` class (rule §2) — it needs a JS/TS parser the guard does not
  have; consumers keep a local check with their own TypeScript until one is chosen (a tracked follow-up).
- **Tests (RED first):** `ownedFor({ token: "sso" })` names `testsToDelete-<owner>-sso-…` and its pattern refuses
  `conventions`; a bad token throws; this repository's exports unchanged (the existing suite is the proof). The guard over
  a scratch Node consumer (`git init`, a `*.test.ts` with `mkdtempSync`, a `scripts/x.sh` with `docker run --name
  "${name}" --rm`, a workflow): `--profile node` reports the `raw-temp` and nothing for the dynamic name; without the
  profile it does not see the `.ts`; no `yaml` anywhere → exit 2 with the sentence; a Tokens table with a second family's
  rows passes when the `--token` row names `--identity`.

### S7 — Docs, the E1 promotion, the release (`model: sonnet`)

- `README.md:259-260` + the mounted-tools table (`sweeper-scan`, the companion, the allowlist); `todo/PLAN_test_leftovers_E1.md`
  → `research/` as IMPLEMENTED with this plan recorded as its revision; `todo/PLAN_test_leftovers_rollout.md`: every
  consumer epic splits into a **sweep-only stage** (its owner-blind sweeps replaced or disabled, no owner-form producer) and
  a **producer stage** (pin bump + rename + helper/guard port in ONE commit), all sweep-only stages before any producer
  stage, the barrier checklist linked, the ledger line gaining this plan's two cornerstones; the release is promoted ONCE,
  after the private sibling confirms its rebuild carries the same spans and after the pre-merge gate files of S0 exist.

## Barrier checklist (run per machine BEFORE any owner-form producer — this repository's own PR included)

- `node tools/sweeper-scan.mjs --root <checkouts parent>` by each developer, `--system` by an administrator → 0 lines, or
  every line resolved below; exit 2 lines attested by a person in the machine's record.
- Scheduled janitors (cron, systemd timers, Task Scheduler) calling an old `janitor.sh`: bumped or disabled.
- Root jobs sweeping the temp root by prefix: disabled.
- Every consumer's own sweep is owner-blind today — the Node start-of-run temp sweep (this repository's `run-tests.mjs:33`
  shape and its ports), the C# temp-directory sweep, the JSON-driven test sweep, the product-side store sweep — each listed
  and replaced or disabled in that consumer's SWEEP-ONLY stage, as a committed, merged change (a local edit is never evidence).
- Old branches and agent worktrees pinned to an old rule copy: bumped, or their suites not run on a shared machine.
- Legacy resources: inventoried (`janitor.sh --dry-run`), not deleted — their removal is never a precondition; each
  consumer removes its own only after its producer stage merged and its runs are quiesced, re-running the dry run first.
- The scan's `unreadable` lines are resolved by hand; the barrier is never declared open on unread evidence.

## Test plan

`npm test` (every suite above); `node tools/leftovers-check.mjs` on this repository; `node tools/sweeper-scan.mjs --root .`;
`node tools/ownership-check.mjs`; `node tools/rule-bodies.mjs`; `npm run check`; the conformance test and S4 test 28 on
Windows (Git for Windows' bash) and the suite on Linux (CI, once as root for S4 scenario 21); the RED observations of every
numbered test quoted in the PR.

## Definition of Done

- [ ] The two rule texts are the spec's companions byte for byte; both bodies under the cap (the inflated-copy RED
      observed); no owner-blind line; the sibling's rebuild reports both spans byte-identical.
- [ ] `owned.mjs`, the sweep, the janitor, the guard, the allowlist, the scan and the vectors implement decisions 1–10;
      every new test was RED first with its real symptom, then green; the full suite green on Windows and Linux; the Windows
      end-to-end check (S4 test 28) green on at least one Windows machine, recorded.
- [ ] The hardening branch is merged first and its tests stay green.
- [ ] `research/security/test-leftovers-merged-core.md` exists for the merged commit with a SHIP line per scenario of the
      spec's §6 (forged owner, forged claim, root, replacement after capture, inaccessible evidence, hostile names, two
      users one daemon, the override's reach, the Windows token, the scan's blind spots).
- [ ] The pre-merge barrier gate (S0) is recorded for every machine in `research/security/machines.md` before the PR merged.
- [ ] `README.md`, `rule-bodies.json`, the E1 promotion and the rollout plan's two-stage rule are updated; the release was
      promoted once, after the sibling's confirmation.
- [ ] S8: a Node consumer runs the shipped guard with `--profile node` and wraps the shipped helper with its own token;
      the private sibling copies both byte for byte and pins their sha256.
- [ ] Cornerstones of this plan: **2 of 2 — S1 (the merged core text, model: fable), S4 (the one janitor and its companion,
      the security pass, model: fable)**.

## Plan-gate round 1 (2026-10-21) — findings and what changed

| Finding | Change in this plan |
|---|---|
| P0 quarantine never on worktrees; guarantees; restore never overwrites | decision 7; S3 (`git worktree remove`, `restoreQuarantineOrphans` onto a free name), S3 tests 16–17; S4 and test 29; the core §4 and the companion say the same |
| P1 scan scopes | decision 9; S5b (user scope default, `--system`, exit 2 on unreadable in the requested scope); the checklist's first line |
| P2 Windows parity | decision 2 (canonical input); S2 test 20; S6 `windows-owner` vectors with upper case, spaces, multi-byte names |
| P4 this repository is the first producer | build order step 0; S0; the DoD's pre-merge gate item; the checklist title |
| P5 Task Scheduler queried directly | S5b (`schtasks /query /fo csv /v`, `Get-ScheduledTask`; unqueryable = exit 2 until attested) |
| P6 rollback defined | decision 9 (two allowed rollbacks); the core's barrier bullet |
| P7 S1 depends on S5's classifier | build order: S5a first in the PR; S1's scan checks run after it |
| P8 security verdict artifact | S4 (`research/security/test-leftovers-merged-core.md`); the DoD item |
| P9 size-cap RED reads the inflated copy | S1 scenario 2 (a scratch root, `rules.mjs read --repo <scratch>`, no swap in place) |
| P10 sweep-only stage before any producer stage | decision 9; S7's rollout-plan edit; the checklist; the spec's migration order |
| C2/C8 (shared core) `owner-blind` not exemptible by comment | decision 10; S5b allowlist keyed by file + line + hash; the RED "annotated `rm -rf` still found" |
| C6 (shared core) the Windows dependency and the end-to-end check | decision 8; S4 test 28; the DoD |
| C9 (shared core) orphan claims | decision 5; S2 test 16c |
| C13 (shared core) a squatted name | decision 5; S2 test 16b |

## Progress and hand-off (2026-10-23)

State of the work, so a session on another machine can continue without this repository's history in its head.

| Story | State | Where |
|---|---|---|
| S5a classifier | done | `tools/lib/sweeper-scan.mjs` (`classifyLine`), commit 2fb413c |
| S1 rule texts | done | `common/test-leftovers.md` (29 655 B body, cap 32 768) + `common/test-leftovers-janitor.md`, a993bde |
| S2 owned helper | done | `tools/lib/owned.mjs`: owner grammar, Windows token, record, claim first, squatting and orphan claims, a7ad5ce |
| S3 sweep | done | `tools/lib/leftovers-sweep.mjs`: two keys, quarantine for plain folders only, worktrees via git, 5571756 |
| S5b guard + barrier scan | done | `tools/leftovers-check.mjs` classes `owner-blind`/`legacy-name`, `tools/fixtures/owner-blind-allowlist.json`, `tools/sweeper-scan.mjs`, a4fc637 |
| S6 conformance (Node half) | done | `tools/fixtures/owner-vectors.json` tables record/names/windows-owner/scope, 93cabc6 |
| Review round (Opus) | done | 540237b: a legacy record on a Linux reader is `unknown`; win32 scope is fail-closed outside the per-user profile; unanchored sweepers are broad; job scripts are followed and an unreadable one is exit 2; legacy claims are read through the safe reader; identity is captured before judging; a squatting helper removes its own claim |
| S4 janitor + companion | **open** | first `git merge origin/main` — it brings the hardened janitor of #80 (491aab9); build S4 ON TOP of it and keep every defence: the entry's owner by lstat at capture and before removal, a sticky or own temp root, the pinned clone with a clean git environment, bounded reads with a fail-closed fallback, `worktree unlock` only for a locked worktree, `rm -rf` only after every git step returned 0, `%q` output, no arithmetic or eval on captured text. No inline `owner-blind` marker on the inventory line — the allowlist entry is the only pass (re-run `--update-allowlist`). Then the janitor half of the conformance vectors and an empty `LEGACY_NAME_PENDING` list in `tools/leftovers-check.mjs`. |
| Gates after S4 | open | coai code gate on the whole PR, Opus review, a Fable security pass recorded in `research/security/test-leftovers-merged-core.md` |
| S0 barrier | open | run `node tools/sweeper-scan.mjs` (and `--system` by an admin) plus the manual checklist above on every machine that builds or tests this repository, before the PR merges |
| S8 consumer helper + guard | open — added 2026-10-26 (decision 11) | `tools/lib/owned.mjs` `ownedFor`, `tools/leftovers-check.mjs` `--profile node`, dynamic shell names, `yaml` from the scanned repository, any family's rows |
| S7 release | open | ONE promotion of `release`; warn the other sessions that own open consumer PRs first (a promotion turns `pin-check` red everywhere); then the two-stage consumer migration — sweep-only stages everywhere before any producer stage |

Test counts at 540237b's parent 93cabc6: WSL Linux 920 pass / 0 fail / 3 skipped; Windows Git Bash 917 pass, one
known slow test (`migrate-rules`, passes alone).
