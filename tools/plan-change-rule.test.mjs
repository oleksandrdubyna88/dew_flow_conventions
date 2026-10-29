#!/usr/bin/env node
/**
 * The freeze proves a body CHANGED. It cannot prove a body still SAYS what it exists to say, and a recorded
 * replacement passes everything: an editor could rewrite the paragraph that stops a plan at its second change, record
 * the new hash, and leave an agent holding a plan that keeps building. A hash is evidence about review, never about
 * meaning (`gate-routing.test.mjs` made the same argument for the document gate, on 2026-09-16).
 *
 * So the three sentences `common/plan-change-control.md` exists for are asserted, each with a splice case that removes
 * its paragraph and requires the phrase to vanish with it (without that second case the first passes on a file where the
 * words happen to occur somewhere else), and a placement case: a sentence in the wrong section reads as something else.
 *
 * The second half is agreement. The rule SHOWS a ledger and `lib/plan-ledger.mjs` READS ledgers; two documents of one
 * format agree only while something compares them (`common/testing.md` § *A green suite is not evidence about a
 * contract with TWO IMPLEMENTATIONS*). So the rule's own example goes through `ledgerFindings`: clean as written, red
 * when its first epoch is left open with two changes, red when a second change lands in an open epoch (clean again once
 * the plan is stopped), and red for the two shapes the rule says hide a change — free text at column 0 and an entry
 * behind an indent.
 *
 * PURE: strings in, strings out. Nothing here writes a file, makes a folder or spawns a process, so
 * `common/test-leftovers.md` asks nothing of this file. The selection cases live in `rules.test.mjs`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { bodyOf, outsideFencedBlocks } from "./lib/rule-body.mjs";
import { APPROVERS, KINDS, ledgerFindings, SOURCES, STATES, STOP_PHRASE, VERDICTS } from "./lib/plan-ledger.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "common/plan-change-control.md";
const TICK = "`";
const TICKS = "`".repeat(3); // a fence inside a fence cannot be shown in a document

/** A sentence, verbatim, as a pattern in which any space may be a line break — the prose is hard-wrapped. */
const phrase = (text) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"));

const PINS = [
  { opens: "**After the first approval, ONE change is allowed", section: null,
    text: "After the first approval, ONE change is allowed — record it and go on. The SECOND is a full stop: no new code on any epic of the plan until the whole plan has been reviewed again.",
    why: "the rule itself: one change is allowed and the second stops all new code" },
  { opens: "**An owner's request counts", section: "## What counts as a change",
    text: "counts exactly like one you find",
    why: "an owner's change is counted, or the measured case's two owner changes would be free" },
  { opens: "**This is the only case where a plan goes to the document review", section: "## Reviewing the revised plan",
    text: "This is the only case where a plan goes to the document review, and only on a branch whose plan round has already passed.",
    why: "the narrow exception to coai-document-gate — without its second half every plan would go to the document review" },
];

function rule() {
  const file = path.join(root, SOURCE);
  assert.ok(fs.existsSync(file), `${SOURCE} does not exist — the rule E2 writes`);
  return bodyOf(fs.readFileSync(file, "utf8"));
}

// ---- meaning: the three sentences, their paragraphs and their sections ----

test("the rule says its three sentences", () => {
  const body = rule();
  for (const pin of PINS) {
    assert.match(body, phrase(pin.text),
      `${SOURCE} no longer carries ${JSON.stringify(pin.text)} — ${pin.why}. The hash freeze cannot see this: record a new `
      + "body and it goes green while an agent keeps building after a second change.");
  }
});

test("every one of those sentences comes from its paragraph and nowhere else", () => {
  // The teeth. Ask what the case above would SEE if the paragraph were deleted: if the phrase also occurs elsewhere in
  // the rule, the answer is "nothing", and the assertion is decoration.
  const body = rule();
  for (const pin of PINS) {
    const opens = body.indexOf(pin.opens);
    assert.notEqual(opens, -1, `${SOURCE}: no paragraph beginning ${JSON.stringify(pin.opens)} was found anywhere in the body`);
    const ends = body.indexOf("\n\n", opens);
    const without = body.slice(0, opens) + (ends === -1 ? "" : body.slice(ends));
    assert.doesNotMatch(without, phrase(pin.text),
      `${JSON.stringify(pin.text)} survives its paragraph being removed, so the case above would stay green without it `
      + `— and ${pin.why} would then be unguarded`);
  }
});

test("each sentence stands in its section", () => {
  // Cut from the text OUTSIDE fences: the rule's example opens with a column-0 `## Plan changes`, which would otherwise
  // end `## The ledger` at its own example. Fenced lines become empty lines there, so nothing else moves.
  const body = outsideFencedBlocks(rule());
  for (const pin of PINS) {
    let section;
    if (pin.section === null) {
      const end = body.indexOf("\n## ");
      section = end === -1 ? body : body.slice(0, end);
    } else {
      const start = body.indexOf(`\n${pin.section}\n`);
      assert.notEqual(start, -1, `${SOURCE}: the heading ${JSON.stringify(pin.section)} is missing, so ${JSON.stringify(pin.opens)} has no section to stand in`);
      const end = body.indexOf("\n## ", start + 1);
      section = body.slice(start, end === -1 ? undefined : end);
    }
    assert.match(section, phrase(pin.text),
      `${JSON.stringify(pin.text)} must stand in ${pin.section ?? "the lead, before the first section"} — a sentence in another section reads as something else`);
  }
});

// ---- agreement: the rule's example is what E1's check accepts ----

const STATUS = "> Status: **in progress, 2026-10-29.** The rule's example as a plan carries it.";
const STOPPED = "> Status: **stopped for re-review, 2026-10-29.** The rule's example, stopped.";
const plan = (ledger, status = STATUS) => ["# PLAN — the rule's example", "", status, "", ...ledger, "", "## Goal", "", "Text."].join("\n");
const findings = (ledger, status = STATUS) => ledgerFindings({ file: "todo/PLAN_x.md", text: plan(ledger, status), status, parent: null }); // the status line in the text and the status argument agree (E2 plan round, finding 1)
const list = (found) => found.map((line) => `\n  - ${line}`).join("");
const hasFinding = (found, pattern) => found.some((line) => pattern.test(line));

/** The ONE `markdown` fence of the rule whose first line is `## Plan changes`, as lines, fence lines excluded. */
function example() {
  const lines = rule().split("\n");
  const starts = lines.flatMap((line, i) => (line === `${TICKS}markdown` && lines[i + 1] === "## Plan changes" ? [i] : []));
  assert.equal(starts.length, 1, `${SOURCE} must carry exactly one ${TICKS}markdown fence that opens with "## Plan changes"`);
  const end = lines.indexOf(TICKS, starts[0] + 1);
  assert.notEqual(end, -1, "the example's fence is never closed");
  return lines.slice(starts[0] + 1, end);
}

const SECOND_CAUSE = "- 2.2 · 2026-10-29 · reviewer · approach — a second cause";
const HIDDEN = "2.2 · 2026-10-29 · reviewer · approach — hidden";

test("the rule's ledger example is a clean ledger to the check", () => {
  const found = findings(example());
  assert.deepEqual(found, [], `the rule's example is not a ledger the check accepts — ${found.length} finding(s):${list(found)}`);
});

test("the example's first epoch, still open with its two changes, is red", () => {
  const lines = example();
  const head = lines.slice(0, lines.indexOf("### Re-review for epoch 2")).map((line) => line.replace("state: closed", "state: open"));
  const found = findings(head);
  assert.ok(hasFinding(found, /epoch 1 has 2 changes and is not stopped/), `expected "epoch 1 has 2 changes and is not stopped", got:${list(found)}`);
});

test("a second change in the example's open epoch is red, and its stop is clean", () => {
  const lines = [...example(), SECOND_CAUSE];
  const red = findings(lines);
  assert.ok(hasFinding(red, /epoch 2 has 2 changes and is not stopped/), `expected "epoch 2 has 2 changes and is not stopped", got:${list(red)}`);
  // the twin: the same two entries, the epoch stopped and the status paragraph saying so
  const stopped = lines.map((line) => (line.startsWith("> Epoch 2 ") ? line.replace("state: open", "state: stopped") : line));
  assert.notDeepEqual(stopped, lines, "the twin did not change the epoch line, so it proves nothing");
  const clean = findings(stopped, STOPPED);
  assert.deepEqual(clean, [], `the stopped twin must be clean, got:${list(clean)}`);
});

test("free text at column 0, and an indented entry, are findings — as the rule says", () => {
  const lines = example();
  // (a) the example's free-text line with its indent removed reads like an entry that lost its `- `
  const at = lines.findIndex((line) => line.startsWith("  (Free text is indented"));
  assert.notEqual(at, -1, "the example no longer carries its indented free-text line");
  const outdented = lines.map((line, i) => (i === at ? line.trimStart() : line));
  const a = findings(outdented);
  assert.ok(hasFinding(a, /unreadable line/), `(a) expected "unreadable line", got:${list(a)}`);
  assert.ok(hasFinding(a, /put free text on an indented line/), `(a) expected "put free text on an indented line", got:${list(a)}`);
  // (b) one space before the marker: a renderer shows a sibling list item
  const b = findings([...lines, ` - ${HIDDEN}`]);
  assert.ok(hasFinding(b, /a ledger line stands at column 0/), `(b) expected "a ledger line stands at column 0", got:${list(b)}`);
  // (c) two markers: red only once E1's K1 fix has landed, which is why E2 starts after it
  const c = findings([...lines, `  - - ${HIDDEN}`]);
  assert.ok(hasFinding(c, /a ledger line stands at column 0/), `(c) expected "a ledger line stands at column 0", got:${list(c)}`);
});

test("the rule names every word the check accepts", () => {
  const ledger = (() => {
    const body = outsideFencedBlocks(rule());
    const start = body.indexOf("\n## The ledger\n");
    assert.notEqual(start, -1, `${SOURCE}: the heading "## The ledger" is missing`);
    const end = body.indexOf("\n## ", start + 1);
    return body.slice(start, end === -1 ? undefined : end);
  })();
  const lists = { KINDS, SOURCES, STATES, APPROVERS };
  for (const [name, words] of Object.entries(lists)) {
    for (const word of words) {
      const pattern = new RegExp(`(?<![\\w-])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`);
      assert.match(ledger, pattern, `"## The ledger" never names ${JSON.stringify(word)}, a word of ${name} in lib/plan-ledger.mjs — a writer would be refused for a word the rule did not teach`);
    }
  }
  // A verdict is named as a code span (`fits`, `cut`, `—`): the dash alone is everywhere in the prose, so a whole-word
  // match for it would stay green with the verdict removed.
  for (const word of VERDICTS) {
    assert.ok(ledger.includes(TICK + word + TICK), `"## The ledger" never names the verdict ${JSON.stringify(word)} as a code span, a word of VERDICTS in lib/plan-ledger.mjs`);
  }
  for (const separator of ["U+00B7", "U+2014"]) {
    assert.ok(ledger.includes(separator), `"## The ledger" never names ${separator}, a separator the check requires`);
  }
  assert.match(rule(), STOP_PHRASE, `${SOURCE} never says "stopped for re-review", the phrase the check looks for in the status paragraph`);
});
