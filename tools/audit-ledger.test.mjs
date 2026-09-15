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

test("every ledger entry points at a sentence that is actually in the rule", () => {
  // The half that rots first. An editor who rewords a finding without touching the ledger leaves a
  // record that describes a rule which no longer exists, and nothing would say so.
  for (const finding of ledger.findings) {
    assert.ok(rule.includes(finding.now),
      `${finding.id}: its "now" text is not in ${ledger.rule} — reword the ledger in the same commit`);
  }
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
      assert.match(address, /^dew_flow_[a-z_]+( · .+)?$/,
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
