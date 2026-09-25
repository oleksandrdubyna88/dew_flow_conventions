#!/usr/bin/env node
/**
 * Four rules are consumed by a build, not only read by a session.
 *
 * `prepare-gate.mjs` in the product that serves the review gate generates its shipped prompt text
 * from these files, and it requires each body to START with a canonical marker line immediately
 * followed by that rule's own heading. A file that does not is refused with
 * `missing canonical marker`, and the refusal lands in that repository's CI rather than in this one.
 *
 * Which is exactly what happened: the story that declared the product names inserted its `owns:`
 * markers at the top of the body, displacing the canonical line in all three files. It passed
 * everything here, was promoted to `release`, and was caught by a consumer's pin-bump pull request —
 * after the ref had moved. The check that would have caught it before belongs HERE, where the files
 * are edited.
 *
 * The patterns are copied deliberately rather than imported: this repository cannot depend on a
 * consumer, and a contract asserted on one side only is a contract that breaks on the other. They are
 * quoted from `src_vs_code/scripts/prepare-gate.mjs`, and the marker's VERSION is left free because
 * the product bumps it on its own schedule.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { bodyOf } from "./lib/rule-body.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** rule file -> the line the consumer's generator requires it to begin with. */
const CANONICAL = {
  "common/coai-review-gate.md": /^<!-- coai-snippet v\d+ -->\n## Multi-model review gate \(ConnectOtherAIs\)/,
  "common/coai-document-gate.md": /^<!-- coai-document v\d+ -->\n## Reviewing a DOCUMENT/,
  "common/coai-caller-model.md": /^<!-- coai-caller v\d+ -->\n## Say which model you are/,
  // The consultant half of the same snippet, since it moved here from the product (2026-09-25).
  "common/coai-consultant.md": /^<!-- coai-consultant v\d+ -->\n## When you are stuck, ask another vendor/,
};

test("every generated rule still begins with the line its consumer generates from", () => {
  for (const [source, marker] of Object.entries(CANONICAL)) {
    const body = bodyOf(fs.readFileSync(path.join(root, source), "utf8"));

    assert.match(body, marker,
      `${source}: its body must START with the canonical marker and heading — a comment, a declaration `
      + "or a blank line above it refuses the consumer's build with 'missing canonical marker'");
  }
});

test("a declaration above the canonical line is what this catches", () => {
  // The shape of the defect that shipped, so the case is about the failure rather than about the
  // happy path: an `owns:` marker is legal anywhere in the file as far as the ownership check is
  // concerned, and illegal here specifically.
  const body = bodyOf(fs.readFileSync(path.join(root, "common/coai-review-gate.md"), "utf8"));
  const displaced = `<!-- owns: coai — a reason that is long enough to pass -->\n${body}`;

  assert.doesNotMatch(displaced, CANONICAL["common/coai-review-gate.md"],
    "if this ever matches, the regex has stopped pinning the START of the body and the check is asleep");
});
