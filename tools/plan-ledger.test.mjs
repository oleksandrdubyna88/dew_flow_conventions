#!/usr/bin/env node
/**
 * `lib/plan-ledger.mjs`'s own tests: which text is a change ledger, which is not, and how a ledger moves from open
 * to stopped to closed. The cases are the scenarios of `todo/PLAN_plan_change_control_E1.md` (E1.S1, which wins over
 * anything else), the rows of the parent plan's findings table (§3) and the clean cases of its test plan.
 *
 * PURE: strings in, strings out. Nothing here writes a file, makes a folder or spawns a process, so
 * `common/test-leftovers.md` asks nothing of this file — the spawned cases live in `plan-lifecycle.test.mjs`.
 *
 * Three habits, each from `common/testing.md`:
 *
 * - A clean result alone could come from a parser that saw nothing, so every red case sits beside its twin: the
 *   fixture that differs by one step and is clean, or the reverse. A test that goes red only for the twin, or only
 *   for the case, is a test of the fixture.
 * - The lists are the lib's own. `KINDS`, `SOURCES`, `STATES`, `APPROVERS`, `VERDICTS` and `STOP_PHRASE` are
 *   iterated, never retyped; ONE test pins them to the parent plan's §2 on purpose, because they are the contract
 *   and changing one is a migration of every recorded plan, not a refactor.
 * - `check` runs every fixture twice, with `\n` and with `\r\n` line ends, and refuses a difference. A Windows
 *   working copy is CRLF and the check runs on both; one helper means no case can forget it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  APPROVERS, clean as cleanValue, KINDS, ledgerFindings, parentPlanOf, QUOTE_LIMIT, RESERVED_PREFIX, SOURCES, STATES, STOP_PHRASE, VERDICTS,
} from "./lib/plan-ledger.mjs";
import { outsideFencedBlocks, sectionsOf } from "./lib/rule-body.mjs";

const TICKS = "`".repeat(3); // a fence inside a fence cannot be shown in a document, so the test builds its own
const FILE = "todo/PLAN_x.md";
const IN_PROGRESS = "> Status: **in progress, 2026-10-28.** Work is open.";
const STOPPED = "> Status: **stopped for re-review, 2026-10-28.** Two changes after approval.";

// ---- the fixtures: every case differs from its neighbour only in the lines that matter ----

const epoch = (k, { date = "2026-10-21", by = "reviewers", state = "open" } = {}) =>
  `> Epoch ${k} · approved ${date} · by ${by} · state: ${state}`;
const entry = (id, { date = "2026-10-26", source = "owner", kinds = "epics", cause = "consumers need the helper as a shipped file; S8 added" } = {}) =>
  `- ${id} · ${date} · ${source} · ${kinds} — ${cause}`;

const E11 = entry("1.1");
const E12 = entry("1.2", { source: "reviewer", kinds: "approach", cause: "restore before capture; S3 and S4 rewritten" });
const nextEntry = (k) => entry(`${k}.1`, { date: "2026-10-28", source: "agent", kinds: "build-order", cause: "E3 needs E2's helper first" });

/** A: epoch 1, one entry. A2: two. */
const A = (state = "open") => [epoch(1, { state }), "", E11];
const A2 = (state = "open") => [epoch(1, { state }), "", E11, E12];

const HEADER = ["| Work | Where | Verdict | Action |", "|---|---|---|---|"];
const FITS = "| S5a classifier, 2fb413c | main | fits | kept |";
const CUT = "| quarantine step, b2df09c | pushed, unmerged | cut | revert commit 1a2b3c4 |";

/** A re-review record. `null` leaves a part out; `tableFirst` swaps the two parts (their order is free). */
const record = (k, { narrowed = "Narrowed: no", table = [...HEADER, FITS, CUT], tableFirst = false } = {}) => {
  const parts = [narrowed === null ? null : [narrowed], table === null ? null : table].filter(Boolean);
  if (tableFirst) parts.reverse();
  return [`### Re-review for epoch ${k}`, "", ...parts.flatMap((part, i) => (i === 0 ? part : ["", ...part]))];
};

/** B: a closed epoch 1 with two changes, its re-review, and the reset to epoch 2 at one change. */
const B = ({ e1 = {}, e2 = {}, k = 2, rec = {}, custom } = {}) => [
  epoch(1, { state: "closed", ...e1 }), "", E11, E12, "",
  ...(custom ?? record(k, rec)), "",
  epoch(k, { date: "2026-10-28", ...e2 }), "", nextEntry(k),
];

/** R: the re-review in progress — epoch 1 stopped, the record written, no epoch 2 line yet. */
const R = ({ state = "stopped", k = 2 } = {}) => [...A2(state), "", ...record(k)];

/** P: the parent plan's own live shape — one entry whose cause continues on indented lines. */
const P = [
  epoch(1, { date: "2026-10-28" }), "",
  "- 1.1 · 2026-10-28 · reviewer · merge-conditions — S6a document round, finding 1: the server plan (S7) moves from a",
  "  condition of the merge to a condition of the release, so a blocked review in another repository cannot strand this",
  "  pull request",
  "  (Plan round 1's accepted findings and the split its operator command ordered are part of the approval itself.)",
  "  - an indented dash line is free text too",
];

const fence = (lines, { marker = TICKS, indent = "", info = "" } = {}) =>
  [`${indent}${marker}${info}`, ...lines, `${indent}${marker}`];

const planRaw = (lines, { status = IN_PROGRESS } = {}) =>
  ["# PLAN — x", "", status, "", ...lines, "", "## Goal", "", "Body.", ""].join("\n");
const plan = (ledger, { status = IN_PROGRESS, heading = "## Plan changes", next = "## Goal" } = {}) =>
  ["# PLAN — x", "", status, "", heading, "", ...ledger, "", next, "", "Body.", ""].join("\n");

/** Run the lib on one text with LF AND CRLF; the two must agree, and every message must name the file. */
function run(text, { file = FILE, status = "in progress", parent = null } = {}) {
  const found = ledgerFindings({ file, text, status, parent });
  assert.ok(Array.isArray(found), `ledgerFindings must return an array, not ${typeof found}`);
  const crlf = ledgerFindings({ file, text: text.replaceAll("\n", "\r\n"), status, parent });
  assert.deepEqual(crlf, found, "CRLF must read exactly like LF");
  for (const message of found) assert.ok(message.startsWith(`${file} — `), `a message starts with the file: ${message}`);
  return found;
}
const check = (ledger, { status = IN_PROGRESS, heading, next, file, parent } = {}) =>
  run(plan(ledger, { status, heading, next }), { status, file, parent });

/** The finding text must hold every needle; the failure prints what WAS found, which is the whole diagnosis. */
function said(found, ...needles) {
  const all = found.join("\n");
  for (const needle of needles) {
    const hit = needle instanceof RegExp ? needle.test(all) : all.includes(needle);
    assert.ok(hit, `expected ${needle} in the findings, got:\n${all === "" ? "(no findings)" : all}`);
  }
}
const clean = (found, why = "expected no findings") => assert.deepEqual(found, [], `${why}, got:\n${found.join("\n")}`);

// ---- the contract ----

test("the lists are the contract: pinned to the parent plan's §2, and frozen", () => {
  // The ONE deliberate retyping in this file (common/testing.md: a test that repeats a list the code holds goes
  // green while the code drifts). They are pinned because changing one is a migration of every plan in six
  // repositories that carries a ledger, not a refactor.
  assert.deepEqual([...SOURCES], ["owner", "agent", "reviewer"]);
  assert.deepEqual([...KINDS], ["scope", "goals", "dod", "merge-conditions", "epics", "stories", "build-order", "contract", "approach"]);
  assert.deepEqual([...STATES], ["open", "stopped", "closed"]);
  assert.deepEqual([...APPROVERS], ["reviewers", "owner"]);
  assert.deepEqual([...VERDICTS], ["fits", "cut", "—"]);
  assert.equal(STOP_PHRASE.source, "\\bstopped for re-review\\b");
  assert.equal(STOP_PHRASE.flags, "i");
  // parent § 2, the reserved prefixes (epoch 2, entries 1.2 and 2.1): an entry shape whose marker may also be an ordered-list
  // marker of at most nine digits, `>` or `#` — the constant IS the contract
  assert.equal(RESERVED_PREFIX.source, "^(?:[>#]|(?:(?:[-*+]|\\d{1,9}[.)])\\s+)*[1-9]\\d*\\.[1-9]\\d*(?=\\s|$))");
  assert.equal(RESERVED_PREFIX.flags, "");
  for (const list of [SOURCES, KINDS, STATES, APPROVERS, VERDICTS]) assert.ok(Object.isFrozen(list), "a list is frozen: nobody edits the contract at run time");
});

// ---- C1, C2, C3: opt-in by presence, and the twin that proves the parser looked ----

test("C1 a plan with no ledger heading is not read; prose and inline code that mention one do not opt in", () => {
  const prose = [
    "# PLAN — x", "", IN_PROGRESS, "",
    "Plan changes are recorded in a ledger. The heading is `## Plan changes` and the first line is",
    "`> Epoch 1 · approved 2026-10-21 · by reviewers · state: open`, and an entry reads `" + E11 + "`.", "",
    "## Goal", "", "Body.", "",
  ].join("\n");
  clean(run(prose));
  clean(run("# PLAN — x\n\n" + IN_PROGRESS + "\n\nNo ledger here.\n"));
  // the twin: the same prose with a real ledger beside it is read
  said(run(prose + ["## Plan changes", "", ...A2()].join("\n") + "\n"), "epoch 1 has 2 changes");
});

test("C2 an epoch with no entries is clean; C3 one entry is clean; the second is red", () => {
  said(check(A2()), "epoch 1 has 2 changes and is not stopped");
  clean(check([epoch(1)]));
  clean(check(A()));
});

// ---- row 1 ----

test("row 1 — a second change in an open epoch is red; a stopped epoch with two is not", () => {
  const red = check(A2());
  said(red, "epoch 1 has 2 changes and is not stopped; stop for a whole re-review", "1.2");
  clean(check(A2("stopped"), { status: STOPPED }));
});

// ---- row 2 and the stop phrase ----

test("row 2 — a stopped epoch whose status does not say so is red", () => {
  said(check(A2("stopped"), { status: IN_PROGRESS }), 'epoch 1 is stopped, but the status paragraph does not say "stopped for re-review"');
  clean(check(A2("stopped"), { status: STOPPED }));
});

test("C4/C5 the stop phrase is found bold, plain, capitalised and mid-paragraph; `re-reviewing` is not it", () => {
  const forms = [
    "> Status: **Stopped for re-review**",
    "> Status: stopped for re-review, 2026-10-28.",
    "> Status: **stopped for re-review, 2026-10-28.** Two changes after approval.",
    "> Status: **in progress.** After the second change the plan is stopped for re-review since 2026-10-28.",
  ];
  for (const status of forms) assert.ok(STOP_PHRASE.test(status), `the constant must match: ${status}`);
  said(check(A2("stopped"), { status: "> Status: **stopped for re-reviewing** until Friday." }), "stopped for re-review");
  for (const status of forms) clean(check(A2("stopped"), { status }), status);
});

// ---- row 3: a ledger the parser cannot orient in ----

test("row 3a/3b — an epoch line that does not parse is red; the clean twin is the same line spelled right", () => {
  said(check([epoch(1, { state: "paused" }), "", E11]), "unreadable epoch line");
  said(check(["> Epoch one · approved 2026-10-21 · by reviewers · state: open", "", E11]), "unreadable epoch line");
  said(check(["> Epoch 1 | approved 2026-10-21 | by reviewers | state: open", "", E11]), "unreadable epoch line", "U+00B7");
  said(check([epoch(1), "", E11, "> a note that starts like an epoch line"]), "unreadable epoch line");
  clean(check(A()));
});

test("row 3c — a heading with entries and no epoch line is red; G5 `Epoch 0` is not an epoch", () => {
  said(check([E11]), "no epoch line");
  said(check([epoch(0), "", E11]), "unreadable epoch line");
  said(check([epoch(1, { date: "2026-13-01" }), "", E11]), "unreadable epoch line", "calendar date");
  said(check([epoch(1, { date: "2026-01-00" }), "", E11]), "unreadable epoch line", "calendar date");
  clean(check(A()));
});

test("row 3d — two ledger headings are red, and the parse stops; one is clean", () => {
  const two = run(planRaw(["## Plan changes", "", ...A(), "", "## Plan changes", "", ...A()]));
  said(two, "two", "## Plan changes");
  assert.equal(two.length, 1, "the parse stops at the headings");
  clean(run(planRaw(["## Plan changes", "", ...A()])));
});

test("G2 the heading tolerates trailing spaces; `## Plan changes (epoch 1)` is no heading; `## Plan Changes` is a near miss", () => {
  clean(check(A(), { heading: "## Plan changes   " }));
  clean(check([epoch(1) + "  \t", "", E11]));
  clean(check(A2(), { heading: "## Plan changes (epoch 1)" })); // not a heading: no ledger seen, so nothing to judge
  said(check(A(), { heading: "## Plan Changes" }), "must read exactly");
  said(check(A(), { heading: "## plan changes" }), "must read exactly");
  said(check(A2(), { heading: "## Plan changes" }), "epoch 1 has 2 changes"); // the twin: the exact heading is read
});

test("G3 a heading with nothing under it, or only blank and indented lines, has no epoch line", () => {
  said(check([]), "no epoch line");
  said(check(["  an indented note", "\tand a tabbed one"]), "no epoch line");
  clean(check(A()));
});

test("G4 an entry above the first epoch line is red", () => {
  said(check([E11, "", epoch(1)]), "stands before the first epoch line");
  clean(check([epoch(1), "", E11]));
});

// ---- row 4: a line the parser would silently drop ----

test("row 4a/4b — an unknown source or kind is red and names the entry and the legal values", () => {
  const source = check([epoch(1), "", entry("1.1", { source: "bot" })]);
  said(source, 'unknown source "bot"', "1.1", SOURCES.join(", "));
  const kind = check([epoch(1), "", entry("1.1", { kinds: "wording" })]);
  said(kind, 'unknown kind "wording"', "1.1", KINDS.join(", "));
  clean(check(A()));
});

test("row 4c/4e — a column-0 line that is not an entry is red, quoted; `* ` and `1. ` are not `- `", () => {
  said(check([...A(), "- a note about the plan"]), "unreadable entry", "a note about the plan");
  said(check([epoch(1), "", E11.replace(/^- /, "* ")]), "unreadable entry", '"- "');
  said(check([epoch(1), "", E11.replace(/^- /, "1. ")]), "unreadable entry");
  clean(check(A()));
});

test("T1/T2 `|`, `--` and the en dash are refused by a message that names the expected characters", () => {
  const ascii = check([epoch(1), "", "- 1.1 | 2026-10-26 | owner | epics -- x"]);
  said(ascii, "unreadable entry", "·", "U+00B7", "—", "U+2014", "found 1");
  const en = check([epoch(1), "", "- 1.1 – 2026-10-26 – owner – epics — x"]);
  said(en, "found 1", "·", "U+00B7");
  clean(check(A()));
});

test("T3 a cause that does not follow ` — ` is red whatever dash was used", () => {
  for (const tail of ["epics - x", "epics -- x", "epics—x"]) {
    const found = check([epoch(1), "", `- 1.1 · 2026-10-26 · owner · ${tail}`]);
    said(found, 'no cause: the cause follows " — " (U+2014)');
  }
  said(check([epoch(1), "", "- 1.1 · 2026-10-26 · owner · epics — "]), "unreadable entry");
});

test("T4 runs of spaces and tabs count as one, and spaces around a comma are free", () => {
  clean(check([epoch(1), "", "-  1.1  ·  2026-10-26 ·\towner · epics  —  x"]));
  clean(check([epoch(1), "", "- 1.1 · 2026-10-26 · owner · scope,dod — x"]));
  clean(check([epoch(1), "", "- 1.1 · 2026-10-26 · owner · scope ,  dod — x"]));
  said(check([epoch(1), "", "- 1.1 · 2026-10-26 · owner · scope,wording — x"]), 'unknown kind "wording"');
});

test("T5 keywords are case-sensitive and the message lists the legal values", () => {
  const found = check([epoch(1), "", entry("1.1", { source: "Owner" })]);
  said(found, 'unknown source "Owner"', SOURCES.join(", "));
  said(check(["> epoch 1 · approved 2026-10-21 · by reviewers · state: open", "", E11]), "unreadable epoch line");
  said(check([epoch(1, { by: "Owner" }), "", E11]), "unreadable epoch line");
});

test("T6 a date must be a real calendar date", () => {
  said(check([epoch(1), "", entry("1.1", { date: "2026-02-30" })]), "not a calendar date");
  said(check([epoch(1), "", entry("1.1", { date: "2026-13-01" })]), "not a calendar date");
  said(check([epoch(1), "", entry("1.1", { date: "2026-01-00" })]), "not a calendar date");
  said(check([epoch(1), "", entry("1.1", { date: "26-10-26" })]), "unreadable entry");
  clean(check([epoch(1), "", entry("1.1", { date: "2026-02-28" })]));
});

test("G17 a column-0 paragraph, rule, stray table row or stray Narrowed line is red; indented, each is free text", () => {
  const lines = ["Consulted: 7bdf3086", "---", "| x | y | fits | z |", "Narrowed: no"];
  for (const line of lines) {
    said(check([...A2("stopped"), "", line], { status: STOPPED }), "unreadable line", line);
    clean(check([...A2("stopped"), "", `  ${line}`], { status: STOPPED }));
  }
});

test("C10 indented lines under an entry are free text unless they start like a ledger line; the same dash at column 0 is red", () => {
  // `> …` and `# …` are reserved since the stop (parent § 2, entry 1.2): they are red cases of the I-scenarios below.
  const withNotes = [...A(), "  continuation of the cause", "  (a parenthesis line)", "  - a dash line", "  | a | b |"];
  clean(check(withNotes));
  clean(check([...A(), "\ta tabbed line"]));
  said(check([...A(), "  continuation", "- a dash line"]), "unreadable entry");
  // the second twin: the dash line made entry-shaped and left indented is not free text any more
  said(check([...A(), "  continuation", " - 1.2 · 2026-10-26 · owner · epics — y"]), "a ledger line stands at column 0");
});

test("G19 a repeated kind is harmless; an unknown one is not", () => {
  clean(check([epoch(1), "", entry("1.1", { kinds: "epics, epics" })]));
  said(check([epoch(1), "", entry("1.1", { kinds: "epics, wording" })]), 'unknown kind "wording"');
});

test("C11 every kind and every source is accepted, iterated from the lib's own lists; two kinds are one entry", () => {
  for (const kinds of KINDS) clean(check([epoch(1), "", entry("1.1", { kinds })]), `kind ${kinds}`);
  for (const source of SOURCES) clean(check([epoch(1), "", entry("1.1", { source })]), `source ${source}`);
  clean(check([epoch(1), "", entry("1.1", { kinds: "scope, dod" })]));
  said(check([epoch(1), "", entry("1.1", { kinds: "" })]), "unreadable entry");
});

// ---- row 5: the numbers ----

test("row 5a — an entry numbered above the current epoch is red", () => {
  said(check([epoch(1), "", entry("2.1")]), "2.1", "above the current epoch");
  clean(check(A()));
});

test("row 5b — entries not numbered 1..n are red; in order they are clean", () => {
  said(check([epoch(1, { state: "stopped" }), "", E11, entry("1.3")], { status: STOPPED }), "1.3", "1..n");
  clean(check(A2("stopped"), { status: STOPPED }));
});

test("row 5c — two entries with one number are the merge of two branches and are red", () => {
  const found = check([epoch(1, { state: "stopped" }), "", E11, entry("1.1", { cause: "the other branch's change" })], { status: STOPPED });
  said(found, "two branches each recorded a change — renumber; the merge is the stop");
  clean(check(A2("stopped"), { status: STOPPED }));
});

test("G18 an entry under another epoch's line is red", () => {
  const moved = [epoch(1, { state: "closed" }), "", E11, "", ...record(2), "", epoch(2, { date: "2026-10-28" }), "", nextEntry(2), E12];
  said(check(moved), "entry 1.2 stands under epoch 2's line");
  clean(check(B()));
});

// ---- row 6: the sequence ----

test("row 6a — epochs not 1, 2, 3 … in order are red; a repeated number and a gap fall here", () => {
  said(check(B({ k: 3 })), "epochs not 1, 2, 3", "found 1, 3");
  said(check(B({ k: 1 })), "epochs not 1, 2, 3", "found 1, 1"); // G6
  clean(check(B()));
});

test("row 6b — a lower epoch that is not closed is red (G7)", () => {
  said(check(B({ e1: { state: "open" } })), "epoch 1 is not closed (state: open)");
  said(check(B({ e1: { state: "stopped" } })), "epoch 1 is not closed");
  clean(check(B()));
});

test("row 6c/G9 — a date that goes back is red; the same day is a same-day re-review and is clean", () => {
  said(check(B({ e2: { date: "2026-10-20" } })), "date goes back", "2026-10-20", "2026-10-21");
  clean(check(B({ e2: { date: "2026-10-21" } })));
  clean(check(B({ e2: { date: "2026-10-28" } })));
});

test("G8 a current epoch that reads closed is red", () => {
  said(check(A2("closed")), "is the current epoch and reads closed");
  said(check(A("closed")), "is the current epoch and reads closed");
});

test("G21 each state of the lib's list: open and stopped are a current epoch, closed is not (the one named exception)", () => {
  for (const state of STATES) {
    const found = check(A(state), { status: STOPPED });
    if (state === "closed") said(found, "is the current epoch and reads closed"); // a closed epoch is reached only by the NEXT epoch line
    else clean(found, state);
  }
});

test("G22 each approver of the lib's list is accepted", () => {
  for (const by of APPROVERS) clean(check([epoch(1, { by }), "", E11]), by);
  said(check([epoch(1, { by: "Owner" }), "", E11]), "unreadable epoch line"); // the twin: a value outside the list is refused
});

// ---- row 7: the re-review record ----

test("row 7a — epoch 2 with no re-review record is red (C6 is the clean reset)", () => {
  const found = check(B({ custom: [] }));
  said(found, "re-review for epoch 2", "must leave a record");
  clean(check(B()));
});

test("row 7b/7c — a record needs one `Narrowed: yes|no` line", () => {
  said(check(B({ rec: { narrowed: null } })), "re-review for epoch 2", "Narrowed");
  said(check(B({ rec: { narrowed: "Narrowed: maybe" } })), "Narrowed");
  said(check(B({ rec: { narrowed: "narrowed: no" } })), "Narrowed"); // G15: the keyword is case-sensitive
  clean(check(B({ rec: { narrowed: "Narrowed: no" } })));
});

test("G15 `Narrowed: no — a reason` and the bare line are both clean", () => {
  clean(check(B({ rec: { narrowed: "Narrowed: no — nothing left" } })));
  clean(check(B({ rec: { narrowed: "Narrowed: no" } })));
  said(check(B({ rec: { narrowed: "narrowed: no" } })), "Narrowed"); // the twin: only the spelling differs
});

test("row 7d/7e — a record needs a table with at least one row", () => {
  said(check(B({ rec: { table: null } })), "table");
  said(check(B({ rec: { table: HEADER } })), "at least one row");
  clean(check(B({ rec: { table: [...HEADER, FITS] } })));
});

test("row 7f/G16 — a verdict is fits, cut or —; every one of the lib's list is clean and `Fits` is not", () => {
  said(check(B({ rec: { table: [...HEADER, "| x | y | partly | z |"] } })), 'verdict "partly"');
  said(check(B({ rec: { table: [...HEADER, "| x | y | Fits | z |"] } })), 'verdict "Fits"');
  for (const verdict of VERDICTS) clean(check(B({ rec: { table: [...HEADER, `| x | y | ${verdict} | z |`] } })), verdict);
});

test("G13 the table's header is checked, and every row has four cells", () => {
  said(check(B({ rec: { table: ["| Item | Where | Verdict | Action |", "|---|---|---|---|", FITS] } })), "header must read");
  said(check(B({ rec: { table: [...HEADER, FITS, "| x | y | fits |"] } })), "has 3 cells");
  said(check(B({ rec: { table: [...HEADER, FITS, "| x | y | fits | z | w |"] } })), "has 5 cells");
  clean(check(B()));
});

test("G14 the order inside a record is free: the table may come before the Narrowed line", () => {
  clean(check(B({ rec: { tableFirst: true } })));
  said(check(B({ rec: { tableFirst: true, narrowed: null } })), "Narrowed"); // the twin: the same order with the line missing
});

test("row 7g — a record after epoch 2's line is red: it comes before the epoch line it opens", () => {
  const late = [...B({ custom: [] }), "", ...record(2)];
  said(check(late), "before", "epoch 2");
  clean(check(B()));
});

test("G11 a second record for one epoch is red", () => {
  const twice = B({ custom: [...record(2), "", ...record(2)] });
  said(check(twice), "two re-review records");
  clean(check(B()));
});

test("G12 epoch 1 is the first approval and has no re-review", () => {
  said(check([...record(1), "", ...A()]), "epoch 1 is the first approval");
  clean(check(A()));
});

test("G10 the re-review in progress is clean while epoch 1 is stopped, and only then", () => {
  clean(check(R(), { status: STOPPED }));
  said(check(R({ state: "open" })), "while epoch 1 is open; the stop comes first");
  // the record names the epoch that comes NEXT: with epoch 1 current that is 2, with epochs 1 and 2 it is 3.
  // (S1's table writes `the next epoch is 3` beside a record named epoch 3 over ONE epoch; its state-machine row and the
  // message it gives, `re-review for epoch 4, but the next epoch is 3`, say what the logic is, and the logic is tested.)
  said(check(R({ k: 3 }), { status: STOPPED }), "re-review for epoch 3, but the next epoch is 2");
  said(check([...B(), "", ...record(4)]), "re-review for epoch 4, but the next epoch is 3");
});

test("G1 the section ends at the next `## ` or `# ` heading; a `###` inside it is a record heading", () => {
  clean(check(A2("stopped"), { status: STOPPED, next: "## Goal" }));
  clean(check(A2("stopped"), { status: STOPPED, next: "# Part two" }));
  const notes = check([...A2("stopped"), "", "### Notes", "", "A paragraph at column 0."], { status: STOPPED });
  said(notes, "unreadable re-review heading", "unreadable line");
  // the paragraph is only red because the `###` kept it inside the section: the same paragraph after `## Goal` is outside
  clean(check(A2("stopped"), { status: STOPPED, next: "## Goal\n\nA paragraph at column 0." }));
});

// ---- row 8 ----

test("row 8 — a narrowed re-review approved by reviewers is red; by owner it is clean (C7)", () => {
  const narrowed = "Narrowed: yes — the Windows run left the merge conditions";
  said(check(B({ rec: { narrowed } })), "epoch 2 is narrowed (Narrowed: yes) and approved by reviewers", "a smaller plan needs the owner");
  clean(check(B({ rec: { narrowed }, e2: { by: "owner" } })));
  clean(check(B({ rec: { narrowed: "Narrowed: no" }, e2: { by: "owner" } }))); // not red by choice: a whole plan may still go to the owner
});

// ---- row 9 ----

test("row 9 — a stories document with a ledger, whose parent is in todo/, is red; without a parent it is clean", () => {
  const found = check(A(), { file: "todo/PLAN_x_E1.md", parent: "todo/PLAN_x.md" });
  said(found, "its changes count in the parent", "todo/PLAN_x.md");
  clean(check(A(), { file: "todo/PLAN_x_E1.md", parent: null }));
  clean(check(A(), { file: "todo/PLAN_x.md", parent: null }));
});

test("row 9b — the lib prints the parent it was GIVEN and never guesses one: `PLAN_a_E1_b_E2.md` resolved to `PLAN_a.md`", () => {
  const found = check(A(), { file: "todo/PLAN_a_E1_b_E2.md", parent: "todo/PLAN_a.md" });
  said(found, "its changes count in the parent, todo/PLAN_a.md");
  // (the file's own name holds `PLAN_a_E1_b`, so the guessed NAME — with its `.md` — is what must be absent)
  assert.ok(!found.join("\n").includes("PLAN_a_E1_b.md"), `the lib re-derived a name instead of printing the given one:\n${found.join("\n")}`);
  // the twin: no parent given, no row 9 — whatever the file is called
  clean(check(A(), { file: "todo/PLAN_a_E1_b_E2.md" }));
  // and the row is about a ledger: a stories document with no ledger heading is not read at all
  clean(run("# PLAN — x\n\n" + IN_PROGRESS + "\n\nNo ledger.\n", { file: "todo/PLAN_a_E1_b_E2.md", parent: "todo/PLAN_a.md" }));
});

// ---- C6, C9: the reset and the parent plan's own shape ----

test("C6 the reset to epoch 2 at one change is clean; a second change in epoch 2 is red and names epoch 2", () => {
  clean(check(B()));
  said(check([...B(), entry("2.2", { date: "2026-10-28", kinds: "scope", cause: "x" })]), "epoch 2 has 2 changes");
});

test("C9 the parent plan's live ledger is clean, and a fenced example ledger further down is not read", () => {
  const example = ["## Plan changes", "", ...B()];
  const fenced = plan(P, { next: "## Design" }) + [...fence(example, { info: "markdown" }), ""].join("\n");
  clean(run(fenced));
  const unfenced = plan(P, { next: "## Design" }) + [...example, ""].join("\n");
  said(run(unfenced), "two", "## Plan changes");
});

// ---- the fence rules (S1 decision 1) ----

test("F1 a ledger only inside a column-0 fence is not read; unfenced it is", () => {
  const body = ["## Plan changes", "", ...A2()];
  clean(run(planRaw(fence(body))));
  said(run(planRaw(body)), "epoch 1 has 2 changes");
});

test("F2 a ledger only inside a `~~~` fence is not read", () => {
  const body = ["## Plan changes", "", ...A2()];
  clean(run(planRaw(fence(body, { marker: "~~~" }))));
  said(run(planRaw(body)), "epoch 1 has 2 changes");
});

test("F3 a fence indented one, two or three spaces is a fence; four spaces is not", () => {
  const body = ["## Plan changes", "", ...A2()];
  for (const indent of [" ", "  ", "   "]) {
    clean(run(planRaw(fence(body, { indent }))), `indent ${indent.length}`);
    clean(run(planRaw(fence(body, { indent, marker: "~~~" }))), `indent ${indent.length}, tildes`);
  }
  // four spaces: the markers are free text, so A2's column-0 lines between them are live
  said(run(planRaw(fence(body, { indent: "    " }))), "epoch 1 has 2 changes");
});

test("F4/C9 a four-backtick fence holding ``` lines and a ledger is one block; three backticks would close early", () => {
  const inner = [`${TICKS}text`, "x", TICKS, "", "## Plan changes", "", ...B()];
  const four = plan(P, { next: "## Design" }) + [...fence(inner, { marker: "`".repeat(4), info: "markdown" }), ""].join("\n");
  clean(run(four));
  const three = plan(P, { next: "## Design" }) + [...fence(inner, { info: "markdown" }), ""].join("\n");
  said(run(three), "two", "## Plan changes");
});

test("F5 an unclosed fence runs to the end of the file: the ledger above it stays live, the heading inside it is not read", () => {
  const second = ["## Plan changes", "", ...B()];
  const open = plan(A2()) + [`${TICKS}markdown`, ...second, ""].join("\n");
  const found = run(open);
  said(found, "epoch 1 has 2 changes");
  assert.equal(found.length, 1, "row 1 only: the second heading is inside the fence, so there is no `two`");
  const closed = plan(A2()) + [`${TICKS}markdown`, "x", TICKS, ...second, ""].join("\n");
  said(run(closed), "two", "## Plan changes");
});

test("F6 `outsideFencedBlocks` knows `~~~`, and a ``` line does not close it; every fenced line becomes an empty line", () => {
  assert.equal(outsideFencedBlocks(["a", "~~~", "b", TICKS, "c", "~~~", "d"].join("\n")), "a\n\n\n\n\n\nd");
  assert.equal(outsideFencedBlocks(["a", TICKS, "b", TICKS, "c"].join("\n")), "a\n\n\n\nc");
});

test("F7 a longer fence closes only on a closer at least as long; a longer closer closes", () => {
  const four = "`".repeat(4);
  assert.equal(outsideFencedBlocks(["a", four, "x", TICKS, "y", four, "z"].join("\n")), "a\n\n\n\n\n\nz");
  assert.equal(outsideFencedBlocks(["a", TICKS, "x", "`".repeat(5), "z"].join("\n")), "a\n\n\n\nz");
  // a four-backtick fence "closed" by three is not closed: it runs to the end
  assert.equal(outsideFencedBlocks(["a", four, "x", TICKS, "y"].join("\n")), "a\n\n\n\n");
});

test("F8 `sectionsOf` reads the same fences: a heading inside `~~~` or an indented fence is not a heading", () => {
  assert.deepEqual(sectionsOf("~~~\n# not a heading\n~~~\n## real"), ["## real"]);
  assert.deepEqual(sectionsOf(`  ${TICKS}\n# not a heading\n  ${TICKS}\n## real`), ["## real"]);
  assert.deepEqual(sectionsOf("## a\n\n## b"), ["## a", "## b"]);
});

test("F9 the edges of the fence rules: info strings, closers with text, other characters, four-space indent", () => {
  // a backtick opener whose info string holds a backtick is inline code, not a fence — and a tilde opener may hold one
  assert.equal(outsideFencedBlocks(`${TICKS}x\`y\nz\n`), `${TICKS}x\`y\nz\n`);
  assert.equal(outsideFencedBlocks("~~~x`y\nz\n~~~\nw"), "\n\n\nw");
  // a closer carries nothing but whitespace: a line with text after the marker does not close
  assert.equal(outsideFencedBlocks([TICKS, "a", `${TICKS} text`, "b", `${TICKS}  \t`, "c"].join("\n")), "\n\n\n\n\nc");
  // four spaces is an indented code block, not a fence
  assert.equal(outsideFencedBlocks([`    ${TICKS}`, "a", `    ${TICKS}`].join("\n")), `    ${TICKS}\na\n    ${TICKS}`);
  // a `~~~` closer does not close a backtick fence
  assert.equal(outsideFencedBlocks([TICKS, "a", "~~~", "b"].join("\n")), "\n\n\n");
});

// ---- G11b, G15b, T7: the fixes the stop accepted (E1.S3, fix forward b, c, e) ----

test("G11b two records for an epoch that does not exist yet are red while the plan is stopped; one is the re-review in progress", () => {
  clean(check(R(), { status: STOPPED })); // G10: the twin with ONE record
  const found = check([...A2("stopped"), "", ...record(2), "", ...record(2)], { status: STOPPED });
  said(found, "two re-review records for epoch 2");
  assert.equal(found.length, 1, `uniqueness is checked once per epoch number, over all records:\n${found.join("\n")}`);
});

test("G15b a Narrowed line that is not `Narrowed: yes|no` with an optional ` — reason` names its line and the dash it wants", () => {
  const bad = ["Narrowed: no - nothing left", "Narrowed: no – x", "Narrowed: no —x", "Narrowed: maybe"];
  for (const narrowed of bad) {
    const text = plan(B({ rec: { narrowed } }));
    const at = text.split("\n").indexOf(narrowed) + 1;
    assert.ok(at > 0, `the fixture holds the line: ${narrowed}`);
    said(run(text), "Narrowed", `line ${at}`, "U+2014", `"${narrowed}"`);
  }
  // the twins are G15's: `Narrowed: no — nothing left` and the bare line stay clean
  clean(check(B({ rec: { narrowed: "Narrowed: no — nothing left" } })));
  clean(check(B({ rec: { narrowed: "Narrowed: no" } })));
});

test("T7 every value a message quotes is cleaned like the line is: control characters become a space, and a long one is cut with `…`", () => {
  const dirty = "own\u001b[31mer";
  const long = "v".repeat(400);
  const header = (cell) => B({ rec: { table: ["| Work | Where | " + cell + " | Action |", "|---|---|---|---|", FITS] } });
  const verdict = (cell) => B({ rec: { table: [...HEADER, `| x | y | ${cell} | z |`] } });
  const rows = [
    { field: "number", ledger: (v) => [epoch(1), "", `- ${v} · 2026-10-26 · owner · epics — x`], quoted: /number "([^"]*)" is not/ },
    { field: "date", ledger: (v) => [epoch(1), "", entry("1.1", { date: v })], quoted: /date "([^"]*)" is not a calendar date/ },
    { field: "source", ledger: (v) => [epoch(1), "", entry("1.1", { source: v })], quoted: /unknown source "([^"]*)"/ },
    { field: "kind", ledger: (v) => [epoch(1), "", entry("1.1", { kinds: v })], quoted: /unknown kind "([^"]*)"/ },
    { field: "table header cell", ledger: header, quoted: /not "\| (.*) \|"/ },
    { field: "verdict", ledger: verdict, quoted: /verdict "([^"]*)" in row/ },
  ];
  for (const { field, ledger, quoted } of rows) {
    const control = check(ledger(dirty));
    assert.ok(control.length > 0, `${field}: the dirty value is a finding`);
    for (const message of control) assert.ok(!message.includes("\u001b"), `${field}: a control character reached a message: ${JSON.stringify(message)}`);
    said(control, "own [31mer"); // a space stands where the escape was

    const cut = check(ledger(long)).map((message) => quoted.exec(message)?.[1]).find((value) => value !== undefined);
    assert.ok(cut !== undefined, `${field}: no message quotes the value`);
    assert.ok(cut.endsWith("…"), `${field}: a long value is cut with …, got ${cut.length} characters`);
    assert.ok(cut.length <= QUOTE_LIMIT + 1, `${field}: at most QUOTE_LIMIT + 1 characters, got ${cut.length}`);

    // (g) the C1 controls (NEL, CSI) and the bidi controls (RLO, LRI) are not made harmless by the ASCII range alone
    for (const hazard of ["\u0085", "\u009b", "\u202e", "\u2066", "\u200e", "\u200f", "\u061c", "\u00ad"]) {
      const found = check(ledger(`own${hazard}er`));
      assert.ok(found.length > 0, `${field}: the value is a finding`);
      for (const message of found) assert.ok(!message.includes(hazard), `${field}: U+${hazard.codePointAt(0).toString(16)} reached a message: ${JSON.stringify(message)}`);
      said(found, "own er"); // a space stands where the control was
    }
  }
});

// ---- the reserved prefixes (parent § 2, entry 1.2; E1.S1 I1-I17 and the matrix) ----

const RESERVED_MESSAGE = "a ledger line stands at column 0";
const ID = "1.2 · 2026-10-26 · owner · epics — y"; // an entry without its marker
/** A line as the lib quotes it: through the lib's own `clean`, never a retyped copy of its character range. */
const asQuoted = (line) => `"${cleanValue(line)}"`;
/** `line` right under entry 1.1 of A: line 10 of the `plan` helper's text. */
const under11 = (line, opts) => check([...A(), line], opts);

/** The one red shape: the reserved message, the line quoted as written, and NOTHING else — the line is neither parsed nor counted. */
function expectHidden(found, line, why, at = 10) {
  const all = found.join("\n");
  const needles = [RESERVED_MESSAGE, asQuoted(line), ...(at === null ? [] : [`line ${at}`])];
  for (const needle of needles) assert.ok(all.includes(needle), `${why}: expected ${needle} for ${JSON.stringify(line)}, got:\n${all === "" ? "(no findings)" : all}`);
  assert.equal(found.length, 1, `${why}: the indented line is the only finding for ${JSON.stringify(line)}, got:\n${all}`);
  assert.ok(!/\p{Cf}/u.test(all), `${why}: a format character reached the message for ${JSON.stringify(line)} (a space stands there): ${JSON.stringify(all)}`);
}
const hidden = (line, why) => expectHidden(under11(line), line, why);

test("I1 an entry indented one space is not free text: it renders as a sibling list item a reader counts", () => {
  hidden(` - ${ID}`, "I1");
  // the twin: at column 0 the same line IS an entry, and the second change of an open epoch is row 1 — never this message
  const col0 = under11(`- ${ID}`);
  said(col0, "entries 1.1, 1.2");
  assert.ok(!col0.join("\n").includes(RESERVED_MESSAGE));
});

test("I2 a bare id indented is hidden; at column 0 it is red as an unreadable line, and the dashed entry is the twin that parses", () => {
  hidden(`  ${ID}`, "I2");
  said(under11(ID), "unreadable line");
  said(under11(`- ${ID}`), "entries 1.1, 1.2");
});

test("I3 a tab is an indent, and a tab after the marker is whitespace", () => {
  for (const line of [`\t- ${ID}`, `\t\t${ID}`, `  -\t${ID}`]) hidden(line, "I3");
  said(under11(`- ${ID}`), "entries 1.1, 1.2");
});

test("I4 the marker is beside the point: ` * ` and ` + ` are bullets too", () => {
  for (const line of [` * ${ID}`, ` + ${ID}`]) hidden(line, "I4");
  said(under11(`* ${ID}`), "unreadable entry"); // 4e: red at column 0 as well
});

test("I5 multi-digit ids are entry numbers, and an id alone on its line is one", () => {
  for (const line of ["  10.1 · 2026-10-26 · owner · epics — y", "  1.20 · 2026-10-26 · owner · epics — y", "  1.2"]) hidden(line, "I5");
});

test("I6 what is not an entry shape stays free text: the id is followed by a dot, a colon, a dash, or is not first", () => {
  const free = [
    "  1.2.3 was the version", "  1.0 is not an entry number", "  0.1 neither", "  1.2: a colon", "  (1.2) in parentheses",
    "  version 1.2 shipped", "  1. a numbered list", "  - 1.2—x",
  ];
  for (const line of free) clean(under11(line), line);
});

test("I6 twin — the first of them with `1.2 ·` in place of `1.2.3` is an entry shape again", () => {
  hidden("  1.2 · was the version", "I6 twin");
});

test("I7 prose that begins with an entry-shaped number is red by design; reworded, it is free text", () => {
  for (const line of ["  1.2 was the version we shipped", "  - 1.2 is where it broke"]) hidden(line, "I7");
  clean(under11("  version 1.2 shipped"));
});

test("I8 an invisible character after the indent is stripped with it; at column 0 it is today's unreadable line", () => {
  for (const line of [" \u00a0- 1.2 · 2026-10-26 · owner · epics — y", " \u200b1.2 · 2026-10-26 · owner · epics — y", " \ufeff- 1.2 · 2026-10-26 · owner · epics — y"]) {
    hidden(line, "I8");
  }
  for (const line of ["\u00a0- 1.2 · 2026-10-26 · owner · epics — y", "\u200b- 1.2 · 2026-10-26 · owner · epics — y"]) {
    said(under11(line), "unreadable line"); // pinned: an invisible character never hides an entry on either side of column 0
  }
});

test("I9 the test runs before the record logic: a hidden entry under a record's table or its Narrowed line is the only finding", () => {
  const rec = record(2);
  const afterNarrowed = (line) => [...rec.slice(0, 3), line, ...rec.slice(3)]; // rec[2] is the Narrowed line
  const cases = [
    { line: " - 2.2 · 2026-10-28 · owner · scope — z", custom: [...rec, " - 2.2 · 2026-10-28 · owner · scope — z"] },
    { line: "  1.3 · 2026-10-26 · owner · scope — z", custom: afterNarrowed("  1.3 · 2026-10-26 · owner · scope — z") },
  ];
  for (const { line, custom } of cases) expectHidden(check(B({ custom })), line, "I9", null);
  // the twins at column 0: `- 1.3` is an entry of the closed epoch 1 and parses; `- 2.2` there stands under epoch 1's line
  clean(check(B({ custom: afterNarrowed("- 1.3 · 2026-10-26 · owner · scope — z") })));
  said(check(B({ custom: [...rec, "- 2.2 · 2026-10-28 · owner · scope — z"] })), "entry 2.2 stands under epoch 1's line");
});

test("I10 an example is not a record: the same lines inside any fence are nothing", () => {
  const lines = [` - ${ID}`, `  ${ID}`, `\t- ${ID}`, `\t\t${ID}`, `  -\t${ID}`];
  for (const options of [{}, { marker: "~~~" }, { indent: "  " }]) {
    clean(check([...A(), ...fence(lines, options)]), JSON.stringify(options));
  }
});

test("I10 twin — the same lines with the fence markers removed are red", () => {
  const lines = [` - ${ID}`, `  ${ID}`, `\t- ${ID}`, `\t\t${ID}`, `  -\t${ID}`];
  said(check([...A(), ...lines]), RESERVED_MESSAGE);
});

test("I11 ordinary continuation prose stays clean, the parent plan's own shape included", () => {
  const prose = ["  continues the cause of 1.1 in prose", "  and carries on with a second line"];
  clean(check([epoch(1, { state: "stopped" }), "", E11, ...prose, E12, ...prose], { status: STOPPED }));
  clean(check(P));
});

test("I12 the reserved message quotes through the one cleaning function: no escape, cut at QUOTE_LIMIT with …", () => {
  const line = ` - 1.2 · 2026-10-26 · owner · epics — \u001b[31m${"x".repeat(400)}`;
  const found = under11(line);
  assert.equal(found.length, 1);
  assert.ok(!found[0].includes("\u001b"), "no control character in the message");
  const quoted = /line 10 "([^"]*)"/.exec(found[0])?.[1];
  assert.ok(quoted !== undefined && quoted.endsWith("…"), `the quote ends in …: ${quoted}`);
  assert.equal(quoted.length, QUOTE_LIMIT + 1);
  said(found, RESERVED_MESSAGE);
});

test("I13 an epoch line indented is hidden; at column 0 it is an epoch line and never this message", () => {
  const epoch2 = "> Epoch 2 · approved 2026-10-28 · by reviewers · state: open";
  for (const line of [` ${epoch2}`, `\t${epoch2}`]) hidden(line, "I13");
  const col0 = under11(epoch2);
  said(col0, "epoch 1 is not closed", "no re-review for epoch 2");
  assert.ok(!col0.join("\n").includes(RESERVED_MESSAGE));
});

test("I14 a record heading indented opens nothing: its Narrowed line and table stand outside any record", () => {
  const indented = R().map((line) => (line === "### Re-review for epoch 2" ? ` ${line}` : line));
  assert.ok(indented.includes(" ### Re-review for epoch 2"), "the fixture holds the indented heading");
  const found = check(indented, { status: STOPPED });
  said(found, RESERVED_MESSAGE, "unreadable line", "Narrowed: no");
  clean(check(R(), { status: STOPPED })); // G10: at column 0 it parses as a record heading
});

test("I15 free text may not begin with `>` or `#`: red by design; reworded, or at column 0 as a heading, it is not", () => {
  for (const line of ["  > note: the reviewer asked for this", "  #1 priority", "  #hashtag", "  >", "  ># x"]) hidden(line, "I15");
  for (const line of ["  note: the reviewer asked for this", "  (quoted) the reviewer asked for this"]) clean(under11(line), line);
  clean(under11("# Part two")); // a heading at column 0 ends the section (G1)
});

test("I16 the same invisible characters are stripped for an epoch line and a heading; at column 0 it stays an unreadable line", () => {
  const epoch2 = "> Epoch 2 · approved 2026-10-28 · by reviewers · state: open";
  for (const line of [` \u00a0${epoch2}`, " \u200b### Re-review for epoch 2"]) hidden(line, "I16");
  said(under11(`\u00a0${epoch2}`), "unreadable line");
  said(under11("\u200b### Re-review for epoch 2"), "unreadable line");
});

test("I17 hidden lines inside a record are the only finding; at column 0 they are a second record and a repeated epoch", () => {
  const rec = record(2);
  const heading = " ### Re-review for epoch 2";
  const quote2 = "  > Epoch 2 · approved 2026-10-28 · by reviewers · state: open";
  expectHidden(check(B({ custom: [...rec.slice(0, 3), heading, ...rec.slice(3)] })), heading, "I17 heading", null);
  expectHidden(check(B({ custom: [...rec, quote2] })), quote2, "I17 epoch line", null);
  said(check(B({ custom: [...rec.slice(0, 3), heading.trim(), ...rec.slice(3)] })), "two re-review records for epoch 2");
  said(check(B({ custom: [...rec, quote2.trim()] })), "epochs not 1, 2, 3", "found 1, 2, 2");
});

// The matrix: one test per row, so the row's input is in every failure's name and a revert shows which rows went red.
const MATRIX_SHAPES = [
  `- ${ID}`, `* ${ID}`, `+ ${ID}`, `1. ${ID}`, `1) ${ID}`, `- - ${ID}`, ID, "> Epoch 2 · approved 2026-10-28 · by reviewers · state: open", "### Re-review for epoch 2", "> note", "# x",
];
const MATRIX = [
  ...[" ", "  ", "\t"].flatMap((indent) => MATRIX_SHAPES.map((shape) => ({ line: indent + shape, red: true }))),
  { line: "  continues the cause of 1.1 in prose", red: false },
  { line: ` - ${ID}`, red: false, fenced: true },
];
test("the matrix has thirty-three red rows (3 indents x 11 shapes) and two clean ones", () => {
  assert.equal(MATRIX.length, 35);
  assert.equal(MATRIX.filter((row) => row.red).length, 33);
});
for (const { line, red, fenced } of MATRIX) {
  test(`matrix ${red ? "red" : "clean"}: ${JSON.stringify(line)}${fenced ? " inside a fence" : ""}`, () => {
    const found = check([...A(), ...(fenced ? fence([line]) : [line])]);
    if (red) expectHidden(found, line, "matrix");
    else clean(found, "matrix");
  });
}

// ---- epoch 2, entry 2.1: three more shapes under which a change hides (E1.S1 L1-L4, H1-H5, O1-O3; C13, C14) ----

const SECOND = "- 1.2 · 2026-10-26 · owner · epics — y";
const FIRST = "- 1.1 · 2026-10-26 · owner · epics — x";
const EPOCH2 = "> Epoch 2 · approved 2026-10-28 · by reviewers · state: open";

test("L1/1b a lone CR is a line ending: two entries glued by one are two entries, as with LF and CRLF", () => {
  const glued = check([epoch(1), "", `${FIRST}\r${SECOND}`]);
  said(glued, "epoch 1 has 2 changes and is not stopped", "entries 1.1, 1.2");
  assert.deepEqual(glued, check([epoch(1), "", FIRST, SECOND]), "the same findings as with a line feed");
  assert.deepEqual(glued, check([epoch(1), "", `${FIRST}\r\n${SECOND}`]), "and as with a CRLF");
});

test("L2 an epoch line glued to an entry by a lone CR is an epoch line", () => {
  const glued = check([epoch(1), "", `${FIRST}\r${EPOCH2}`]);
  said(glued, "epoch 1 is not closed", "no re-review for epoch 2");
  assert.deepEqual(glued, check([epoch(1), "", FIRST, EPOCH2]));
});

test("L3 a record heading glued to an entry by a lone CR opens the record: the re-review in progress is clean", () => {
  const rec = record(2);
  const glued = [epoch(1, { state: "stopped" }), "", E11, `${E12}\r${rec[0]}`, ...rec.slice(1)];
  clean(check(glued, { status: STOPPED }));
  clean(check([epoch(1, { state: "stopped" }), "", E11, E12, ...rec], { status: STOPPED })); // the heading on its own line (G10)
});

test("L4 `\\r\\r` is a blank line, a CR-only file is a file, and a finding's line number counts CR-terminated lines", () => {
  clean(check([`${epoch(1)}\r\r${E11}`]));
  clean(run(plan(A()).replaceAll("\n", "\r")));
  const text = plan([...A(), ` - ${ID}`]);
  const crOnly = run(text.replaceAll("\n", "\r"));
  said(crOnly, RESERVED_MESSAGE, "line 10");
  assert.deepEqual(crOnly, run(text), "the same findings as with line feeds");
});

test("H1/3e a heading indented one to three spaces is the ledger's near-miss heading, not an invisible ledger", () => {
  for (const heading of [" ## Plan changes", "   ## Plan changes"]) {
    const found = check(A2(), { heading });
    said(found, "must read exactly", `"${heading}"`);
    assert.equal(found.length, 1, "the ledger under a near-miss heading is not read further");
  }
  said(check(A2(), { heading: "## Plan changes" }), "epoch 1 has 2 changes"); // the twin: the exact heading is read
});

test("H2 closing hashes, any count and spacing, are a near-miss heading too", () => {
  for (const heading of ["## Plan changes ##", "## Plan changes #", "## Plan changes   ##"]) said(check(A2(), { heading }), "must read exactly", heading);
});

test("H3/C13 four leading spaces are a code block: not a heading, no finding, no ledger", () => {
  clean(check(A2(), { heading: "    ## Plan changes" }));
});

test("H3 twin — three leading spaces are a near miss", () => {
  said(check(A2(), { heading: "   ## Plan changes" }), "must read exactly");
});

test("H4 the wrong level, no space after the hashes, or two spaces are near misses; other words are not", () => {
  for (const heading of ["# Plan changes", "### Plan changes", "##Plan changes", "##  plan changes"]) said(check(A2(), { heading }), "must read exactly", heading);
  clean(check(A2(), { heading: "## Plan changes (epoch 1)" })); // G2, still no heading
  // the exact heading takes any spacing between the words (it runs on the folded line), so the near miss must too (H6)
  said(check(A2(), { heading: "## plan   changes" }), "must read exactly");
});

test("H5 the exact heading and a near-miss one further down are two headings", () => {
  const found = run(planRaw(["## Plan changes", "", ...A(), "", " ## Plan changes", "", ...A()]));
  said(found, "two", "## Plan changes");
  assert.equal(found.length, 1, "the parse stops at the headings");
  said(check(A(), { heading: "## Plan Changes" }), "must read exactly"); // G2, unchanged
});

test("O1/4h an ordered-list marker before an entry shape is hidden: it renders as a numbered item a reader counts", () => {
  for (const line of [`  1. ${ID}`, ` 1) ${ID}`]) hidden(line, "O1");
  const col0 = under11(`1. ${ID}`);
  said(col0, "unreadable entry", 'entries start with "- "'); // red on both sides, as today
  said(under11(`- ${ID}`), "entries 1.1, 1.2"); // the twin that parses
});

test("O2 the marker takes up to nine digits and any whitespace after it; ten digits are no marker", () => {
  for (const line of [`  12. ${ID}`, `  123456789) ${ID}`, `  1.  ${ID}`, `\t1.\t${ID}`]) hidden(line, "O2");
  clean(under11(`  1234567890. ${ID}`));
});

test("O3 a marker alone reserves nothing: the entry number must follow it", () => {
  for (const line of ["  1. a numbered list", "  1. 1.2.3 is a version", "  1.1.2 · 2026-10-26 · owner · epics — y", "  2) see 1.2 above"]) clean(under11(line), line);
});

test("C14/h a GFM-escaped pipe inside a table cell is not a cell boundary; unescaped it is, and the row has five cells", () => {
  clean(check(B({ rec: { table: [...HEADER, "| a | b | fits | c \\| d |"] } })));
  said(check(B({ rec: { table: [...HEADER, "| a | b | fits | c | d |"] } })), "row 1 has 5 cells, not 4");
});

// ---- code round 3 (E1.S1 cases marked cr3): H6, I18, I19, K1, P1-P3, C15 ----

test("H6/3f the near miss takes any spacing between the words, as the exact heading does: it is never stricter", () => {
  for (const heading of ["## plan   changes", "## plan\tchanges", " ## Plan  changes", "### Plan  changes", "## Plan  changes ##"]) {
    const found = check(A2(), { heading });
    assert.ok(found.join("\n").includes("must read exactly"), `${JSON.stringify(heading)}: expected a near-miss finding, got:\n${found.join("\n") || "(no findings)"}`);
  }
});

test("H6 twin — extra spaces in an otherwise exact heading ARE the exact heading: row 1, never row 3", () => {
  for (const heading of ["##  Plan changes", "## Plan  changes"]) {
    const found = check(A2(), { heading });
    said(found, "epoch 1 has 2 changes");
    assert.ok(!found.join("\n").includes("must read exactly"), `${JSON.stringify(heading)} is the exact heading after folding`);
  }
});

test("I18 every format character is stripped with the indent: an LRM, an RLM or a soft hyphen hides no line", () => {
  for (const line of [`  \u200e- ${ID}`, `  \u200f${ID}`, `  \u00ad* ${ID}`]) hidden(line, "I18");
  said(under11(`\u200e- ${ID}`), "unreadable line"); // pinned: at column 0 the same line is red as well
});

test("I18b a format character BETWEEN two runs of spaces: the whole indent, format characters included, is stripped first", () => {
  for (const line of [` \u200e - ${ID}`, `  \u2066 ${ID}`]) hidden(line, "I18b");
});

test("I22 every Unicode space after the indent is stripped with it: an ideographic space, an em space or a narrow no-break space hides no line", () => {
  for (const space of ["\u3000", "\u2003", "\u202f"]) {
    for (const line of [`  ${space}${ID}`, `  ${space}- ${ID}`]) hidden(line, "I22");
    for (const line of [`${space}${ID}`, `${space}- ${ID}`]) said(under11(line), "unreadable line"); // pinned: red at column 0 as well
  }
});

test("I19 a bidi control, an Arabic letter mark or a Mongolian vowel separator before a reserved shape hides nothing", () => {
  const epoch2 = "> Epoch 2 · approved 2026-10-28 · by reviewers · state: open";
  const lines = [` \u2066${epoch2}`, " \u202e### Re-review for epoch 2", " \u061c# x", ` \u180e1) ${ID}`, ` \u2061+ ${ID}`];
  for (const line of lines) hidden(line, "I19");
  for (const line of lines) said(under11(line.slice(1)), "unreadable line"); // at column 0 (the space dropped): red as well
  // the two controls of the bidi class reach the message as a space (fix forward g)
  assert.ok(!under11(lines[0])[0].includes("\u2066") && !under11(lines[1])[0].includes("\u202e"));
});

test("K1 (epoch 3) a line behind TWO or more list markers is reserved too: a visibly nested bullet a reader counts", () => {
  for (const line of [`  - - ${ID}`, `  1. - ${ID}`, `  * + ${ID}`, `  - - - ${ID}`]) hidden(line, "K1");
  for (const line of ["  - - note", "  1. a list", "  1.2.3 was the version", "  - - 1.2.3"]) clean(under11(line), line); // markers alone reserve nothing
  said(under11(`- - ${ID}`), "unreadable entry", 'number "- 1.2"'); // column 0 is unchanged: red as an unreadable entry
});

test("4j a nested bullet behind the indent is reserved; one marker is, too (I1)", () => {
  hidden(`  - - ${ID}`, "4j");
  hidden(`  - ${ID}`, "4j twin");
});

test("P1 a run of ONE OR MORE backslashes before a pipe escapes it (measured with GitHub's renderer): 4 cells; with none it is a boundary", () => {
  const row = (n) => `| a | b | fits | c${"\\".repeat(n)}| d |`;
  for (const n of [1, 2, 3]) clean(check(B({ rec: { table: [...HEADER, row(n)] } })), `${n} backslash(es)`);
  said(check(B({ rec: { table: [...HEADER, row(0)] } })), "row 1 has 5 cells, not 4"); // the red twin
});

test("C15 two and three backslashes before a pipe: 4 cells each", () => {
  for (const n of [2, 3]) clean(check(B({ rec: { table: [...HEADER, `| a | b | fits | c${"\\".repeat(n)}| d |`] } })));
});

test("P4/7h the row that tells the measured rule from the odd-run rule: `b`, two backslashes, a pipe is ONE cell, so the row has three", () => {
  said(check(B({ rec: { table: [...HEADER, `| a | b${"\\".repeat(2)}| fits | x |`] } })), "row 1 has 3 cells, not 4");
  clean(check(B({ rec: { table: [...HEADER, "| a | b | fits | x |"] } }))); // zero backslashes: four cells, verdict fits
  // the cell keeps the run minus one backslash: `fits`, two backslashes, a pipe reads as `fits`, ONE backslash, `|`
  said(check(B({ rec: { table: [...HEADER, `| a | b | fits${"\\".repeat(2)}| | d |`] } })), 'verdict "fits\\|"');
});

test("P2 an escaped pipe in the header is shown to the reader unescaped: the header is wrong, with four cells", () => {
  const found = check(B({ rec: { table: ["| Work | Where | Verdict | Action\\| x |", "|---|---|---|---|", FITS] } }));
  said(found, "header must read", "Action| x");
  assert.ok(!found.join("\n").includes("cells, not"), "four cells, not five");
  clean(check(B())); // the header as written
});

test("P3 an escaped pipe glued to a verdict is part of the verdict: four cells, and the verdict is wrong", () => {
  const found = check(B({ rec: { table: [...HEADER, "| a | b | fits\\| | d |"] } }));
  said(found, 'verdict "fits|"');
  assert.ok(!found.join("\n").includes("cells, not"), "four cells, not five");
  clean(check(B({ rec: { table: [...HEADER, "| a | b | fits | d |"] } })));
});

// ---- code round 4 (E1.S1 cases marked cr4): H7/3g, I21/4i, K2 ----

test("H7/3g a format character in the heading is still the ledger's near-miss heading: GitHub shows the h2", () => {
  const marks = ["\u200b", "\u200e", "\u00ad", "\u2060", "\u2066"];
  const headings = [`## Plan changes${marks[0]}`, `## Plan${marks[1]} changes`, `## Plan${marks[2]} changes`, `## Plan changes${marks[3]}`, `## Plan${marks[4]} changes`];
  for (const heading of headings) {
    const found = check(A2(), { heading });
    assert.ok(found.join("\n").includes("must read exactly"), `${JSON.stringify(heading)}: expected a near-miss finding, got:\n${found.join("\n") || "(no findings)"}`);
    assert.ok(!/\p{Cf}/u.test(found.join("\n")), `${JSON.stringify(heading)}: the heading is quoted cleaned, a space where the character stood`);
  }
  said(check(A2(), { heading: "## Plan changes" }), "epoch 1 has 2 changes"); // the twin: the exact heading
});

test("I21/4i a format character after the marker or inside the number does not hide an entry shape", () => {
  const lines = [`  - \u200b${ID}`, `  - 1\u200b.2 · 2026-10-26 · owner · epics — y`, `  - \u200e${ID}`, `  - 1\u200e.2 · 2026-10-26 · owner · epics — y`];
  for (const line of lines) hidden(line, "I21");
  said(under11(`- \u200b${ID}`), "unreadable entry"); // pinned: at column 0 the same line is red as well
});

test("K3 a heading styled with inline markup or a character reference is a known limit, recorded and not fixed: no ledger is seen", () => {
  for (const heading of ["## **Plan changes**", "## *Plan changes*", "## `Plan changes`", "## Plan&nbsp;changes"]) clean(check(A2(), { heading }), heading);
  said(check(A2(), { heading: "## Plan changes" }), "epoch 1 has 2 changes"); // the twin: the exact heading
});

test("K2 a setext heading over `---` or `===` is a known limit, recorded and not fixed: no ledger is seen", () => {
  for (const underline of ["---", "==="]) clean(check(A2(), { heading: `Plan changes\n${underline}` }), underline);
  said(check(A2()), "epoch 1 has 2 changes"); // the twin: the ATX heading
});

// ---- C12 and robustness: never a throw, whatever the text ----

test("C12 the CRLF twin of a fixture really is CRLF (the helper would otherwise compare a text with itself)", () => {
  const text = plan(A2());
  assert.ok(!text.includes("\r"));
  assert.ok(text.replaceAll("\n", "\r\n").includes("\r\n"));
  said(run(text), "epoch 1 has 2 changes"); // run() compares the CRLF twin and refuses a difference
});

test("the lib never throws on any text, and reads a hostile corpus as findings", () => {
  const pool = [
    ...A2(), ...B(), ...R(), ...P, "## Plan changes", "## plan changes", "### Re-review for epoch 2", "### Re-review for epoch 0",
    "Narrowed: yes", "narrowed:", ...HEADER, "|", "||", "| | | | |", "> Epoch", ">", "> Epoch 9007199254740993 · approved 2026-13-01 · by owner · state: open",
    "- ", "-", "*", "1.", "  ", "\t- x", "", TICKS, "~~~", "`".repeat(4), "# H", "## Goal", "\0", "\ud800", "- 1.1 · · · ·  — ",
    " ## Plan changes", "1. 1.2 · 2026-10-26 · owner · epics — y", " 1) 1.2", "a\rb", "\r\r", "| a \\| b |", "\u0085", "\u202e",
    "- 9007199254740993.1 · 2026-01-00 · owner · scope — x", "- 1.1 · 2026-02-30 · owner · scope — x", "—", "·", "\r",
    "a".repeat(5000), "- " + "·".repeat(300),
  ];
  let seed = 20261028;
  const next = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  let withFindings = 0;
  for (let round = 0; round < 400; round += 1) {
    const lines = Array.from({ length: 1 + next(14) }, () => pool[next(pool.length)]);
    if (round % 3 === 0) lines.unshift("## Plan changes");
    const found = ledgerFindings({ file: FILE, text: lines.join("\n"), status: "stopped for re-review", parent: round % 2 === 0 ? "todo/PLAN_x.md" : null });
    assert.ok(Array.isArray(found) && found.every((m) => typeof m === "string"), `round ${round}`);
    if (found.length > 0) withFindings += 1;
  }
  for (const text of ["", "\n", "\r\n", "## Plan changes", "## Plan changes\n", TICKS, "\0\0\0", "𐀀"]) {
    assert.ok(Array.isArray(ledgerFindings({ file: FILE, text, status: "", parent: null })), JSON.stringify(text));
  }
  // the twin of "never throws": the corpus is not so tame that nothing was ever read
  assert.ok(withFindings > 50, `the corpus produced findings in only ${withFindings} of 400 rounds`);
});

// ---- parentPlanOf ----

test("parentPlanOf names the parent of a stories document, and nothing else", () => {
  assert.equal(parentPlanOf("PLAN_plan_change_control_E1.md"), "PLAN_plan_change_control.md");
  assert.equal(parentPlanOf("PLAN_x_E12.md"), "PLAN_x.md");
  assert.equal(parentPlanOf("PLAN_x_E1_remainder.md"), "PLAN_x.md");
  assert.equal(parentPlanOf("PLAN_x.md"), null);
  assert.equal(parentPlanOf("PLAN_x_Eval.md"), null);
  assert.equal(parentPlanOf("PLAN_x_E.md"), null);
  assert.equal(parentPlanOf("PLAN_E1.md"), null);
  assert.equal(parentPlanOf("notes_E1.md"), null);
  assert.equal(parentPlanOf(""), null);
});

test("parentPlanOf tries from the right, and prefers a parent that exists", () => {
  assert.equal(parentPlanOf("PLAN_E1_feature_E2.md"), "PLAN_E1_feature.md"); // the rightmost split
  assert.equal(parentPlanOf("PLAN_a_E1_b_E2.md"), "PLAN_a_E1_b.md");
  assert.equal(parentPlanOf("PLAN_a_E1_b_E2.md", (name) => name === "PLAN_a.md"), "PLAN_a.md");
  assert.equal(parentPlanOf("PLAN_a_E1_b_E2.md", (name) => name === "PLAN_a_E1_b.md"), "PLAN_a_E1_b.md");
  const asked = [];
  parentPlanOf("PLAN_a_E1_b_E2.md", (name) => { asked.push(name); return false; });
  assert.deepEqual(asked, ["PLAN_a_E1_b.md", "PLAN_a.md"], "longest topic first");
});
