#!/usr/bin/env node
/**
 * The feature rule's `good_enough` bullet under policy `auto` at the cap (P7 of the gate-words release,
 * `research/PLAN_coai_gate_words_for_auto.md` § *Open follow-ups*). `coai-feature` v4 told an AI to land a blocking
 * finding that the capped second round did not clear as a new pull request, and did not say the finding may be false; an
 * AI reading it literally lands a false finding. The bullet must name both outcomes: a true one landed as a NEW pull
 * request, a false one rejected with its reason.
 *
 * A hash freeze proves the body changed, never what it says (`plan-change-rule.test.mjs` makes the same argument), so
 * the clause is asserted, with a splice case: the bullet removed, the phrase must vanish with it.
 *
 * PURE: strings in, strings out. Nothing here writes a file, makes a folder or spawns a process.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { bodyOf } from "./lib/rule-body.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "common/coai-feature-gate.md";

/** A sentence, verbatim, as a pattern in which any space may be a line break — the prose is hard-wrapped. */
const phrase = (text) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"));

const BULLET_OPENS = "- `proceed` or `good_enough`";
const CLAUSE = "verify it as any other finding: land a true one as a NEW pull request and name it in your summary, reject a false one with its reason";

const rule = () => bodyOf(fs.readFileSync(path.join(root, SOURCE), "utf8"));

/** The bullet that opens with BULLET_OPENS, up to the next bullet at column 0 or a blank line. */
function bullet(body) {
  const opens = body.indexOf(BULLET_OPENS);
  assert.notEqual(opens, -1, `${SOURCE}: no bullet beginning ${JSON.stringify(BULLET_OPENS)}`);
  const rest = body.slice(opens + 1);
  const next = rest.search(/\n(?:- |\n)/);
  return { opens, ends: next === -1 ? body.length : opens + 1 + next };
}

test("the capped good_enough clause says a blocking finding is verified: a true one landed, a false one rejected", () => {
  const body = rule();
  const { opens, ends } = bullet(body);
  assert.match(body.slice(opens, ends), phrase(CLAUSE),
    `${SOURCE}: the good_enough bullet no longer says ${JSON.stringify(CLAUSE)} — under policy auto at the cap an AI `
    + "would land a false blocking finding as a pull request");
});

test("the clause comes from the good_enough bullet and nowhere else", () => {
  const body = rule();
  const { opens, ends } = bullet(body);
  assert.doesNotMatch(body.slice(0, opens) + body.slice(ends), phrase(CLAUSE),
    "the clause survives its bullet being removed, so the case above would stay green without it");
});

test("the marker is coai-feature v5", () => {
  assert.match(fs.readFileSync(path.join(root, SOURCE), "utf8"), /^<!-- coai-feature v5 -->$/m);
});
