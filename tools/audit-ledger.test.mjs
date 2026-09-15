#!/usr/bin/env node
/**
 * The audit ledger is checkable, or it is decoration.
 *
 * `common/reliability.md` was written from a four-repository audit and cited `repo · path:line` for
 * every finding. A shared rule names no product, so those addresses left the rule — and the objection
 * that move has to answer is the one a reviewer raised in the plan round: anonymise in place, and a
 * year later nobody can check the claim.
 *
 * `research/reliability-audit-2026-08-16.json` is the answer. It keeps the address, the evidence, the
 * cost and the date out of the corpus, beside the sentence that replaced them. These cases are what
 * stop it drifting away from the rule it documents: a ledger nobody checks becomes a file that says
 * something true about a rule as it used to be.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { folded } from "./lib/rule-body.mjs";
import { findingsIn } from "./ownership-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ledger = JSON.parse(fs.readFileSync(path.join(root, "research/reliability-audit-2026-08-16.json"), "utf8"));
const rule = folded(fs.readFileSync(path.join(root, ledger.rule), "utf8"));

/**
 * Whitespace collapsed, so a re-wrap of the prose is not a false report of drift.
 *
 * The entries carry the line breaks they were copied with, which matches today and would stop
 * matching the first time somebody reflowed a paragraph around a sentence that is still there.
 */
const flat = (text) => text.replace(/\s+/g, " ").trim();
const flatRule = flat(rule);

test("every ledger entry points at a sentence that is actually in the rule, exactly once", () => {
  // The half that rots first. An editor who rewords a finding without touching the ledger leaves a
  // record that describes a rule which no longer exists, and nothing would say so.
  //
  // Once, not at least once: a sentence that turns up under a second requirement would otherwise let
  // one finding's address and cost describe a claim it was never about.
  for (const finding of ledger.findings) {
    assert.ok(typeof finding.now === "string" && finding.now.trim().length > 0,
      `${finding.id}: an empty "now" matches every rule ever written`);
    const occurrences = flatRule.split(flat(finding.now)).length - 1;
    assert.equal(occurrences, 1,
      `${finding.id}: its "now" text appears ${occurrences} time(s) in ${ledger.rule} — it must appear exactly once`);
  }
});

test("the audit is whole: every finding it recorded is still in the ledger", () => {
  // Duplicate ids were checked and absence was not, so deleting an entry left the suite green while
  // the evidence for one finding was gone — in the file whose only job is that it survives.
  const expected = Array.from({ length: 23 }, (_, index) => `R-${String(index + 1).padStart(2, "0")}`);
  assert.deepEqual(ledger.findings.map((finding) => finding.id), expected,
    "the ledger holds R-01 to R-23, in order — a finding is not removed or renumbered");
});

test("every entry keeps what makes the evidence checkable", () => {
  const seen = new Set();
  for (const finding of ledger.findings) {
    assert.match(finding.id, /^R-\d\d$/, "a finding needs a stable id");
    assert.ok(!seen.has(finding.id), `${finding.id}: duplicated id`);
    seen.add(finding.id);

    assert.ok(Array.isArray(finding.was) && finding.was.length > 0,
      `${finding.id}: the address it had is the whole point of this file`);
    for (const address of finding.was) {
      assert.match(address, /^dew_flow_[a-z0-9_]+( · .+)?$/,
        `${finding.id}: an address names the repository it was in`);
    }
    assert.ok(finding.evidence.split(" ").length >= 8, `${finding.id}: evidence, not a label`);
    assert.ok(finding.cost.trim().length > 0, `${finding.id}: what it cost is why the rule is believed`);
    assert.match(finding.date, /^\d{4}-\d{2}-\d{2}$/, `${finding.id}: evidence is evidence AS OF a date`);
  }
});

test("the addresses live here and nowhere in the rule", () => {
  // The other direction, and the one that matters to the programme: the rule must not carry the
  // address back. Checked against the tool the whole corpus is checked with, so the two cannot
  // disagree about what counts as a product reference.
  assert.deepEqual(findingsIn(rule, ledger.rule), [],
    `${ledger.rule} carries a product reference again — the ledger is where an address goes`);

  for (const finding of ledger.findings) {
    for (const address of finding.was) {
      assert.ok(!rule.includes(address), `${finding.id}: ${address} is back in ${ledger.rule}`);
    }
  }
});

test("the rule points at the ledger, so a reader can find it", () => {
  // Evidence somebody cannot navigate to is evidence nobody checks.
  assert.match(rule, /research\/reliability-audit-2026-08-16\.json/,
    "the rule's header links the ledger that holds its addresses");
  assert.match(rule, new RegExp(ledger.auditDate), "and it still says when the audit was");
});
