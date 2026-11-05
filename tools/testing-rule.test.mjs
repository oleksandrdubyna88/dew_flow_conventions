#!/usr/bin/env node
/**
 * The freeze proves a body CHANGED. It cannot prove a body still SAYS what F27 put into `common/testing.md`, and a
 * recorded replacement passes everything: an editor could shorten the section that bounds what a test file may start,
 * record the new hash, and leave a repository whose runner has a bound nobody can read any more. A hash is evidence
 * about review, never about meaning (`plan-change-rule.test.mjs` made the same argument for the plan-change rule).
 *
 * So the section is pinned: it stands immediately before the RED-test section, it states three numbered obligations,
 * it says each pinned sentence and none of them stands anywhere else in the file (without that second case the first
 * passes on a file where the words happen to occur elsewhere), it makes no number into law, it keeps its limits, it names
 * no address, and the Definition of Done carries its line. Every case runs against the real file AND against in-memory
 * splices of it that must turn it red, so a case that cannot fail shows itself on every run.
 *
 * PURE: strings in, strings out. Nothing here writes a file, makes a folder or spawns a process, so
 * `common/test-leftovers.md` asks nothing of this file.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { bodyOf, outsideFencedBlocks, sectionsOf } from "./lib/rule-body.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "common/testing.md";
const HEADING = "## A runner bounds what a test file may start, and a shim never resolves to itself";
const NEXT = "## Every bug fix starts with a RED test (MANDATORY)";
const DOD = "## Definition of Done";

/** A sentence, verbatim, as a pattern in which any space may be a line break — the prose is hard-wrapped. */
const phrase = (text) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"));

const PINS = [
  { text: "reaching the bound FAILS the file", why: "reaching the bound must fail the file, not warn" },
  { text: "names the bound", why: "a failure that does not name the bound reads as a crash" },
  { text: "`RLIMIT_NPROC`", why: "the kernel limit the bound is built on" },
  { text: "counts every THREAD of the whole user", why: "the limit is not per process and not per run" },
  { text: "count at the start of the run plus a headroom", why: "the shape of the cap: a count taken at the start, plus room" },
  { text: "only that session is ever signalled", why: "the watch must never signal anything outside the file's own session" },
  { text: "with its own folder removed from the lookup", why: "the shim's first duty: it never finds itself" },
  { text: "refuses a result inside that folder", why: "the shim's second duty: a result inside its folder is an error" },
  { text: "Setup that runs twice is the normal case", why: "the reason the second duty exists" },
  { text: "guarded fixture that forks", why: "the proof is a fixture that cannot take the machine with it" },
  { text: "forks without end", why: "the proof forks for real" },
  { text: "`setsid`", why: "a descendant that leaves the session is named as a limit" },
  { text: "weaker, not equal", why: "a platform without the kernel limit is not equal" },
  { text: "not a number this rule's tests verify", why: "the formula is a shape, not a verified number" },
];
const LIMIT_PINS = PINS.filter((pin) => ["`setsid`", "weaker, not equal", "not a number this rule's tests verify"].includes(pin.text));

function rule() {
  const file = path.join(root, SOURCE);
  assert.ok(fs.existsSync(file), `${SOURCE} does not exist`);
  return bodyOf(fs.readFileSync(file, "utf8"));
}

/** The section under `heading`, from the text OUTSIDE fences; the first assertion keeps a RED run honest. */
function section(body, heading) {
  const text = outsideFencedBlocks(body);
  const start = text.indexOf(`\n${heading}\n`);
  assert.notEqual(start, -1, `${SOURCE} has no section ${heading} — the section F27 writes`);
  const end = text.indexOf("\n## ", start + 1);
  return text.slice(start + 1, end === -1 ? undefined : end);
}

/** The body with that section spliced out. */
function without(body, heading) {
  const text = outsideFencedBlocks(body);
  const start = text.indexOf(`\n${heading}\n`);
  assert.notEqual(start, -1, `${SOURCE} has no section ${heading} — the section F27 writes`);
  const end = text.indexOf("\n## ", start + 1);
  return text.slice(0, start) + (end === -1 ? "" : text.slice(end));
}

// ---- in-memory splices: each must change the text, or it proves nothing ----

function replaceOnce(body, find, replacement) {
  const first = body.indexOf(find);
  assert.notEqual(first, -1, `the splice found nothing to change: ${JSON.stringify(find)}`);
  assert.equal(body.indexOf(find, first + 1), -1, `the splice found ${JSON.stringify(find)} twice`);
  return body.slice(0, first) + replacement + body.slice(first + find.length);
}

/** Remove the text from `from` up to (not including) `to`; `to` null runs to the end. */
function cut(body, from, to) {
  const first = body.indexOf(from);
  assert.notEqual(first, -1, `the splice found nothing to cut: ${JSON.stringify(from)}`);
  const last = to === null ? body.length : body.indexOf(to, first);
  assert.notEqual(last, -1, `the splice found no end for the cut: ${JSON.stringify(to)}`);
  return body.slice(0, first) + body.slice(last);
}

// ---- the checks, as functions: the real body must pass them and a splice must not ----

/** null when the section stands immediately before the RED-test section. */
function placementProblem(body) {
  const headings = sectionsOf(body);
  const next = headings.indexOf(NEXT);
  const at = headings.indexOf(HEADING);
  if (next === -1) return `${SOURCE} has no ${NEXT}`;
  if (at === -1) return `${SOURCE} has no ${HEADING}`;
  return at === next - 1 ? null : `${HEADING} stands at heading ${at}, not immediately before ${NEXT} (heading ${next})`;
}

const numberedItems = (body) => (section(body, HEADING).match(/^\d+\. \*\*/gm) ?? []).length;
const missingPins = (body, pins = PINS) => {
  const text = section(body, HEADING);
  return pins.filter((pin) => !phrase(pin.text).test(text));
};
const pinsElsewhere = (body) => {
  const rest = without(body, HEADING);
  return PINS.filter((pin) => phrase(pin.text).test(rest));
};
function lawProblems(body) {
  const text = section(body, HEADING).replaceAll("2026-11-02", "").replaceAll("15,900", "");
  const found = [];
  const digits = text.match(/\d{3,}/g);
  if (digits !== null) found.push(`a number of three digits or more: ${digits.join(", ")}`);
  if (/half of the headroom/.test(text)) found.push("the headroom is a fraction of something");
  return found;
}
const hasParagraph = (body) => /^What this does not give/m.test(section(body, HEADING));
const ADDRESS = /\bdew_flow_|\br9700\b|\w+\/\w+\.(mjs|sh|py)\b|\b[0-9a-f]{7,40}\b/;
const DOD_BOUNDS = "bounds each test file's processes";
const DOD_SHIM = "resolves the program it wraps outside its own folder";
function dodLine(body) {
  const items = section(body, DOD).split(/\n(?=- \[)/);
  return items.find((item) => phrase(DOD_BOUNDS).test(item) && phrase(DOD_SHIM).test(item)) ?? null;
}

// ---- cases ----

test("the section exists and stands immediately before the RED-test section", () => {
  const body = rule();
  section(body, HEADING); // fails first, and for the right reason, while the section is not written
  assert.equal(placementProblem(body), null);
  // the splice: the section moved to after the RED-test section is red
  const text = section(body, HEADING);
  const moved = replaceOnce(cut(body, text, NEXT), "\n## Name the guarantee", `\n${text}\n## Name the guarantee`);
  assert.notEqual(placementProblem(moved), null, "a section moved away from its place is still accepted");
});

test("the section states the three obligations as three numbered bold items", () => {
  const body = rule();
  assert.equal(numberedItems(body), 3, `${HEADING} must hold exactly three items of the form "N. **…**"`);
  const fourth = replaceOnce(body, "\nWhat this does not give", "\n4. **A fourth obligation.** Invented.\n\nWhat this does not give");
  assert.notEqual(numberedItems(fourth), 3, "a fourth item is still accepted");
  const two = cut(body, "2. **A shim", "3. **The repository");
  assert.notEqual(numberedItems(two), 3, "a missing second item is still accepted");
});

test("the section says each pinned sentence", () => {
  const body = rule();
  for (const pin of PINS) {
    assert.match(section(body, HEADING), phrase(pin.text),
      `${SOURCE} § ${HEADING} no longer carries ${JSON.stringify(pin.text)} — ${pin.why}. The hash freeze cannot see this.`);
  }
});

test("each pinned sentence comes from this section and nowhere else", () => {
  // The teeth: ask what case 3 would SEE if the section were deleted. If a pin also occurs elsewhere in the file, the
  // answer is "nothing", and the assertion is decoration.
  const body = rule();
  const elsewhere = pinsElsewhere(body);
  assert.deepEqual(elsewhere.map((pin) => pin.text), [],
    `these sentences also occur outside the section, so the case above would stay green without it: ${elsewhere.map((pin) => JSON.stringify(pin.text)).join(", ")}`);
  // the twin: a pin copied into `## Scope` keeps case 3 green and makes this case red
  const copied = replaceOnce(body, "## Scope\n", "## Scope\n\nonly that session is ever signalled.\n");
  assert.deepEqual(missingPins(copied).map((pin) => pin.text), [], "the copy must leave the section as it was");
  assert.deepEqual(pinsElsewhere(copied).map((pin) => pin.text), ["only that session is ever signalled"],
    "a pinned sentence copied into another section was not noticed");
});

test("no number becomes law", () => {
  const body = rule();
  assert.deepEqual(lawProblems(body), [], `${HEADING} states a number as if it were the rule`);
  const withDefault = replaceOnce(body, "plus a headroom, and", "plus a headroom (default 3000), and");
  assert.notDeepEqual(lawProblems(withDefault), [], "an inserted default of 3000 is still accepted");
  const withHalf = replaceOnce(body, "and the headroom has to cover", "and half of the headroom has to cover");
  assert.notDeepEqual(lawProblems(withHalf), [], "an inserted fraction of the headroom is still accepted");
  assert.doesNotMatch(section(body, HEADING), /half of the headroom/);
});

test("the section keeps the limits", () => {
  const body = rule();
  assert.deepEqual(missingPins(body, LIMIT_PINS).map((pin) => pin.text), [], "a limit is no longer stated");
  assert.ok(hasParagraph(body), `${HEADING} has no paragraph opening "What this does not give"`);
  const stripped = cut(body, "What this does not give", NEXT);
  assert.equal(hasParagraph(stripped), false, "a section without its limits paragraph is still accepted");
  assert.notDeepEqual(missingPins(stripped, LIMIT_PINS), [], "the limit pins survive the removal of their paragraph");
});

test("the section names no address", () => {
  // `ownership-check.mjs` does not know every address (a consumer's short token, a file path, a sha): this is the guard.
  const body = rule();
  assert.doesNotMatch(section(body, HEADING), ADDRESS, `${HEADING} names an address — a shared rule keeps the story and loses the address`);
  const withPath = replaceOnce(body, "plus a headroom, and", "plus a headroom (tests/run.mjs), and");
  assert.match(section(withPath, HEADING), ADDRESS, "an inserted file path is still accepted");
});

test("the Definition of Done carries its line", () => {
  const body = rule();
  assert.notEqual(dodLine(body), null, `${DOD} has no "- [ ]" line that ${DOD_BOUNDS} and ${DOD_SHIM}`);
  assert.match(dodLine(body), /^- \[ \] /);
  const removed = cut(body, "- [ ] A runner of the repository's own bounds", null);
  assert.equal(dodLine(removed), null, "a Definition of Done without the line is still accepted");
  // the phrases are the DoD's and the DoD's alone
  const rest = without(body, DOD);
  assert.doesNotMatch(rest, phrase(DOD_BOUNDS), `"${DOD_BOUNDS}" occurs outside ${DOD}, so the case above could stay green without the line`);
  assert.doesNotMatch(rest, phrase(DOD_SHIM), `"${DOD_SHIM}" occurs outside ${DOD}, so the case above could stay green without the line`);
});
