#!/usr/bin/env node
/**
 * The freeze proves a body CHANGED. It cannot prove a body still SAYS what F27 put into `common/testing.md`, and a
 * recorded replacement passes everything: an editor could shorten the section that bounds what a test file may start,
 * record the new hash, and leave a repository whose runner has a bound nobody can read any more. A hash is evidence
 * about review, never about meaning (`plan-change-rule.test.mjs` made the same argument for the plan-change rule).
 *
 * So the section is pinned: it stands immediately before the RED-test section, it states three numbered obligations,
 * it says each pinned sentence (and each pin has a splice that removes its one occurrence and must be reported, so a
 * pin that cannot fail shows itself on every run), it makes no number into law, it keeps its limits, it names no
 * address, and the Definition of Done carries its line. Every case runs against the real file AND against in-memory
 * splices of it that must turn it red.
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
  { text: "with a message that names the bound", why: "a failure that does not name the bound reads as a crash" },
  { text: "the kernel limit (`RLIMIT_NPROC`", why: "the kernel limit the bound is built on" },
  { text: "counts every THREAD of the whole user", why: "the limit is not per process and not per run" },
  { text: "count at the start of the run plus a headroom", why: "the shape of the cap: a count taken at the start, plus room" },
  { text: "small enough that the machine survives reaching it", why: "a cap the machine cannot survive is the incident with a number on it" },
  { text: "nothing names the bound at it", why: "the kernel limit refuses the fork; what the program does then is its own (measured: one dies, another goes on), and nothing names the bound" },
  { text: "or the kernel limit comes first and nothing names the bound", why: "a watch that fires after the kernel limit gives a file that may die or go on, and no message either way" },
  { text: "a session of its own", why: "the watch is per file only if the file has a session to watch" },
  { text: "fires well below the headroom", why: "the watch must fire before the kernel limit does" },
  { text: "Only that session is ever signalled", why: "the watch must never signal anything outside the file's own session" },
  { text: "once, at its FIRST install", why: "the lookup happens once per shim, at its first install; a second install re-resolving is the walk that bakes two shims into each other" },
  { text: "with its own folder removed from the lookup", why: "the shim's first duty: it never finds itself" },
  { text: "refuses a result inside that folder", why: "the shim's second duty: a result inside its folder is an error" },
  { text: "comparing REAL paths", why: "a folder reached through a link is the same folder; a spelling compare lets it through" },
  { text: "bakes the result in", why: "the lookup is not repeated at run time" },
  { text: "A later install keeps what the first one baked", why: "setup runs twice; a re-install that re-resolves can find a shim installed since, and bake it" },
  { text: "never looks the program up at run time", why: "a run-time lookup reopens the walk a first-install bake closed" },
  { text: "two shims that re-resolve can bake each other", why: "the walk: A bakes the program, B bakes A, A re-installed bakes B; real-path compares pass throughout, only keeping the first bake closes it" },
  { text: "guarded fixture that forks without end", why: "the proof forks for real, behind a guard" },
  { text: "outside the folder the runner discovers", why: "a fixture the runner discovers runs with every suite" },
  { text: "refuses to start unless told to AND the cap in force is the runner's own", why: "a distribution's default is an enforced limit too, measured at about eleven times the count that killed a session; a guard that accepts it proves nothing" },
  { text: "a distribution's default is enforced too", why: "the reason 'enforced' was not enough" },
  { text: "`setsid`", why: "a descendant that leaves the session is named as a limit" },
  { text: "never counted or ended by the watch", why: "what the watch does not do for a descendant that leaves the session" },
  { text: "outlives the run", why: "such a descendant outlives the run" },
  { text: "root, and the capabilities that exempt a process from `RLIMIT_NPROC`, have the watch alone", why: "root and those capabilities are exempt from the limit; the short pin survived deleting them" },
  { text: "weaker, not equal", why: "a platform without the kernel limit is not equal" },
  { text: "not a number this rule's tests verify", why: "the formula is a shape, not a verified number" },
];
const LIMIT_PINS = PINS.slice(-6);

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
/** The pins missing from a text. */
const missingIn = (text, pins = PINS) => pins.filter((pin) => !phrase(pin.text).test(text));
const missingPins = (body, pins = PINS) => missingIn(section(body, HEADING), pins);
function lawProblems(body) {
  const text = section(body, HEADING).replaceAll("2026-11-02", "").replaceAll("15,900", "");
  const found = [];
  const digits = text.match(/\d{3,}/g);
  if (digits !== null) found.push(`a number of three digits or more: ${digits.join(", ")}`);
  if (/half\s+of\s+the\s+headroom/.test(text)) found.push("the headroom is a fraction of something");
  if (/\b(half|a third|a quarter)\b|\d+ ?%/.test(text)) found.push("a fraction as law");
  return found;
}
const hasParagraph = (body) => /^What this does not give/m.test(section(body, HEADING));
const ADDRESS = /\bdew_flow_|[\w./-]+\.(mjs|cjs|js|ts|cs|rs|sh|ps1|py|md)\b|\b[0-9a-f]{7,40}\b/;
const ADDRESS_CI = /\br9700/i;
const DOD_PINS = [
  "bounds each test file's processes",
  "and FAILS the file at the bound",
  "resolves the program it wraps outside its own folder",
  "by real path",
  ", at install",
  "proves the bound with a guarded fixture",
  "outside the folder it discovers",
];
/** The one `- [ ]` item that opens the way the line does, and the pins of the line it lacks; null without such an item. */
function dodLine(body) {
  const items = section(body, DOD).split(/\n(?=- \[)/);
  const line = items.find((item) => phrase(DOD_PINS[0]).test(item));
  if (line === undefined) return null;
  return { line, missing: DOD_PINS.filter((pin) => !phrase(pin).test(line)) };
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

test("the section says each pinned sentence, and each pin is reported when its one occurrence is removed", () => {
  const text = section(rule(), HEADING);
  const absent = missingIn(text);
  assert.deepEqual(absent.map((pin) => pin.text), [],
    `${SOURCE} § ${HEADING} no longer carries: ${absent.map((pin) => `${JSON.stringify(pin.text)} (${pin.why})`).join("; ")}. The hash freeze cannot see this.`);
  // the splice, per pin: removing the pin's text must report that pin, and only that pin
  for (const pin of PINS) {
    const found = phrase(pin.text).exec(text);
    const reported = missingIn(text.replace(found[0], "")).map((other) => other.text);
    assert.ok(reported.includes(pin.text), `removing ${pin.text} was not reported (it must occur once in the section: lengthen the pin)`);
    assert.deepEqual(reported, [pin.text], `removing ${pin.text} also reported ${reported.filter((t) => t !== pin.text).join(", ")}: two pins share their words`);
  }
});

test("no number becomes law", () => {
  const body = rule();
  assert.deepEqual(lawProblems(body), [], `${HEADING} states a number as if it were the rule`);
  const withDefault = replaceOnce(body, "plus a headroom", "plus a headroom (default 3000)");
  assert.notDeepEqual(lawProblems(withDefault), [], "an inserted default of 3000 is still accepted");
  // the anchor stops before the section's line break (the new text wraps after "the"), so it holds for either wrapping
  const withHalf = replaceOnce(body, "it fires well below the", "it fires at half of the");
  assert.notDeepEqual(lawProblems(withHalf), [], "an inserted fraction of the headroom is still accepted");
  const withPercent = replaceOnce(body, "plus a headroom", "plus a headroom of 20 %");
  assert.notDeepEqual(lawProblems(withPercent), [], "an inserted percentage is still accepted");
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
  const text = section(body, HEADING);
  assert.doesNotMatch(text, ADDRESS, `${HEADING} names an address — a shared rule keeps the story and loses the address`);
  assert.doesNotMatch(text, ADDRESS_CI, `${HEADING} names the example repository by its token`);
  // each splice must be seen by one of the two patterns
  for (const inserted of ["(tests/run.mjs)", "(see test.sh)", "R9700", "0123456789abcdef0123456789abcdef01234567"]) {
    const spliced = section(replaceOnce(body, "plus a headroom", `plus a headroom ${inserted}`), HEADING);
    assert.ok(ADDRESS.test(spliced) || ADDRESS_CI.test(spliced), `an inserted ${inserted} is still accepted`);
  }
  // the positive control: the words the section is entitled to are not addresses
  for (const word of ["CAP_SYS_ADMIN", "RLIMIT_NPROC", "EAGAIN", "setsid", "PATH"]) {
    assert.doesNotMatch(word, ADDRESS, `${word} is read as an address`);
    assert.doesNotMatch(word, ADDRESS_CI, `${word} is read as an address`);
  }
});

test("the Definition of Done carries its line", () => {
  const body = rule();
  const found = dodLine(body);
  assert.notEqual(found, null, `${DOD} has no "- [ ]" line that opens with "${DOD_PINS[0]}"`);
  assert.match(found.line, /^- \[ \] /);
  assert.deepEqual(found.missing, [], `the ${DOD} line no longer carries: ${found.missing.join(", ")}`);
  const removed = cut(body, "- [ ] A runner of the repository's own bounds", null);
  assert.equal(dodLine(removed), null, "a Definition of Done without the line is still accepted");
  const noRealPath = replaceOnce(body, ", by real path,", ",");
  assert.deepEqual(dodLine(noRealPath).missing, ["by real path"], "a line without `by real path` is not reported as lacking it");
});
