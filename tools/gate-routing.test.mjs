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
  // A BARE `mcp__coai__review_plan` was pinned here and is not any more, and the reason is worth
  // keeping: the file's `owns:` declarations name both tools, legitimately and by the ownership
  // check's own contract, so a bare name is no longer paragraph-local — delete the paragraph and a
  // bare-name case stays green on the declaration alone. Nothing is lost, because the directional
  // phrase below requires both names, their order AND the verb between them, which is strictly more
  // than either bare case asserted. The uniqueness case is what caught this.
  //
  // The prose is hard-wrapped at about a hundred columns, so any phrase long enough to be worth
  // pinning can straddle a line break. These two allow one — asserting the exact spacing INSIDE a
  // sentence would fail on a reflow that changed nothing, which is a test that cries about layout.
  [/`mcp__coai__review_plan`[^`]*unlocks\s[^`]*`mcp__coai__review_code`/,
    "the DIRECTION between the two gates — reverse it and all the names above still appear, which is "
    + "the one thing a list of names cannot see (raised on the code round)"],
  [/it belongs here, at\s+`mcp__coai__review_document`/,
    "this gate named in the paragraph rather than left as 'here' — a reader who lands on this "
    + "sentence alone has to be able to type it"],
];

/** The sentence the paragraph has to sit against. Placement is the fix, not only the words. */
const LIST_ENDS = "a requirements list — rather than a diff.";

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

  // Wherever it sits — this locates the paragraph, it does not require it at any position.
  assert.notEqual(opens, -1,
    `${SOURCE}: no paragraph beginning ${JSON.stringify(OPENS)} was found anywhere in the body`);

  const ends = body.indexOf("\n\n", opens);
  const without = body.slice(0, opens) + (ends === -1 ? "" : body.slice(ends));

  for (const [phrase, why] of ROUTING) {
    assert.doesNotMatch(without, phrase,
      `${phrase} survives the paragraph being removed, so the case above would stay green without it `
      + `— and ${why} would then be unguarded`);
  }
});

test("the counter-example sits against the list that causes the mistake, with nothing between", () => {
  // Placement IS the fix here: the reason a plan goes to the wrong gate is that it matches a list of
  // concrete nouns, and a correction three paragraphs down is read after the match has been made.
  // The words alone were pinned above; moving the paragraph while keeping them would leave those
  // cases green and the symptom exactly where it was. (Raised on the code round.)
  const body = documentGate();
  const before = body.slice(0, body.indexOf(OPENS)).trimEnd();

  assert.ok(before.endsWith(LIST_ENDS),
    `${SOURCE}: the paragraph must come directly after ${JSON.stringify(LIST_ENDS)} — nothing may sit `
    + `between the list and its correction. It currently follows: ${JSON.stringify(before.slice(-90))}`);
});
