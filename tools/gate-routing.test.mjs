#!/usr/bin/env node
/**
 * The freeze proves a body CHANGED. It cannot prove a body still SAYS the thing it exists to say.
 *
 * `rules.test.mjs` hashes every rule body against `research/rule-bodies.json`, which makes an
 * unrecorded edit a red suite — and makes a recorded one green whatever the text was replaced with.
 * A gate reviewer put it plainly on 2026-09-16: an editor could rewrite this paragraph, record the
 * new hash, pass everything here, and leave an agent holding a plan calling the document gate
 * exactly as often as before. A hash is evidence about review, never about meaning.
 *
 * So the one sentence this rule exists for is asserted rather than hashed. It is the same argument
 * `canonical-markers.test.mjs` makes about the marker line, one paragraph further down the file.
 *
 * What is asserted is deliberately small: three phrases, each load-bearing, and a companion case
 * that splices the paragraph out and requires every one of them to disappear with it. Without that
 * second case the first would pass on a file where the words happen to occur somewhere else — which
 * is how a content assertion survives its own break.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { bodyOf } from "./lib/rule-body.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SOURCE = "common/coai-document-gate.md";

/** Where the paragraph starts, and how it ends. A blank line is a paragraph break in markdown. */
const OPENS = "**A PLAN is not one of these";

/** What the rule has to still be saying, and why each phrase carries its weight. */
const ROUTING = [
  [/A PLAN is not one of these/,
    "the counter-example — the example list above it matches a plan twice, which is what sends plans to the wrong gate"],
  [/what exists when the task is FINISHED/,
    "the discriminator, which is the only form of this test a reader can apply without judgement"],
  [/mcp__coai__review_plan/,
    "the gate a plan actually goes to, spelled the way a session has to type it"],
  [/mcp__coai__review_code/,
    "what that gate unlocks — the cost of using the wrong one is that this stays shut"],
];

function documentGate() {
  return bodyOf(fs.readFileSync(path.join(root, SOURCE), "utf8"));
}

test("the document gate says that a plan is not one of its examples", () => {
  const body = documentGate();

  for (const [phrase, why] of ROUTING) {
    assert.match(body, phrase,
      `${SOURCE} no longer carries ${phrase} — ${why}. The hash freeze cannot see this: record a new `
      + "body and it goes green while an agent holding a plan still calls the document gate.");
  }
});

test("every one of those phrases comes from that paragraph and nowhere else", () => {
  // The teeth. Ask what the case above would SEE if the paragraph were deleted: if any phrase also
  // occurs elsewhere in the rule, the answer is "nothing", and the assertion is decoration.
  const body = documentGate();
  const opens = body.indexOf(OPENS);

  assert.notEqual(opens, -1, `${SOURCE}: the paragraph must open with ${JSON.stringify(OPENS)}`);

  const ends = body.indexOf("\n\n", opens);
  const without = body.slice(0, opens) + (ends === -1 ? "" : body.slice(ends));

  for (const [phrase, why] of ROUTING) {
    assert.doesNotMatch(without, phrase,
      `${phrase} survives the paragraph being removed, so the case above would stay green without it `
      + `— and ${why} would then be unguarded`);
  }
});
