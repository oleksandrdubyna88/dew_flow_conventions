#!/usr/bin/env node
/**
 * `ownership-check.mjs`'s own tests.
 *
 * Two of these cases matter more than the rest, and they are the controls rather than the findings.
 * `benchmark` is a legal value in the task vocabulary, so a detector that matched the bare word would
 * fire on frontmatter — and a check that goes red on a legal file is a check somebody switches off
 * within the week. And "a sidecar process" must stay legal while "the sidecar" does not: the
 * determiner is the whole signal, because generic usage in these files is indefinite and specific
 * usage is definite.
 *
 * The `unknown` fixture is the one that decides whether the detector was worth writing: it names a
 * repository no list has ever heard of. A check built from the six names would pass it, and the
 * seventh repository to join the family would arrive unnoticed.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { findingsIn, markersIn } from "./ownership-check.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const tool = path.join(here, "ownership-check.mjs");
const fixture = (name) => path.join(here, "fixtures", "ownership", name);

function run(cwd, ...args) {
  const result = spawnSync(process.execPath, [tool, ...args], { cwd, encoding: "utf8", timeout: 30000 });
  return { code: result.status, out: `${result.stdout}${result.stderr}` };
}

test("an anonymised, dated rule passes", () => {
  const { code, out } = run(fixture("clean"));
  assert.equal(code, 0, out);
  assert.match(out, /OK — 1 shared rule\(s\), no undeclared product references/);
});

test("a rule naming a repository is refused, and the line is named", () => {
  const { code, out } = run(fixture("leaky"));
  assert.equal(code, 1, out);
  assert.match(out, /REPOSITORY common[\\/]x\.md:\d+ — "dew_flow_rag_qln"/);
  assert.match(out, /would another repository still[\s\S]*need that sentence/i);
});

test("a repository no list has heard of is still caught, because the detector is a pattern", () => {
  // The case that decides whether this check was worth writing. Built from the six known names, it
  // would pass — and the seventh repository to join the family would arrive unnoticed.
  const { code, out } = run(fixture("unknown"));
  assert.equal(code, 1, out);
  assert.match(out, /dew_flow_some_new_repo/);
});

test("`the sidecar` fires and `a sidecar process` does not", () => {
  // The determiner is the signal. Generic usage in these files is indefinite and rare; specific usage
  // is definite and common. A detector matching the bare noun would fire on ordinary prose.
  const { code, out } = run(fixture("definite"));
  assert.equal(code, 1, out);
  assert.match(out, /"the sidecar"/i);
  assert.doesNotMatch(out, /"a sidecar/i, "the indefinite control must not fire");
});

test("a declared name with a reason is allowed", () => {
  const { code, out } = run(fixture("marked"));
  assert.equal(code, 0, out);
});

test("a marker with no reason is refused — that is the difference from an allowlist", () => {
  const { code, out } = run(fixture("marked-bare"));
  assert.equal(code, 1, out);
  assert.match(out, /MARKER/);
  assert.match(out, /carries no reason/);
});

test("`benchmark` in the task vocabulary is not a product reference", () => {
  // The regression that stops this check being switched off: `benchmark` is a legal task name, so a
  // bare word match would refuse a perfectly legal frontmatter.
  const { code, out } = run(fixture("frontmatter"));
  assert.equal(code, 0, out);
});

test("a shared rule depending on a local id is refused", () => {
  const { code, out } = run(fixture("depends"));
  assert.equal(code, 1, out);
  assert.match(out, /DEPENDS/);
  assert.match(out, /local\.thing/);
  assert.match(out, /never depends on a repo-local one/);
});

test("scanning no rule files at all is a failure, not a pass", () => {
  // Zero findings because nothing was read looks identical to zero findings because everything was
  // clean. Run from the wrong directory, this check must say so rather than congratulate itself.
  const { code, out } = run(fixture("empty"));
  assert.equal(code, 1, out);
  assert.match(out, /scanned no rule files/);
});

test("--warn reports every finding in full and still exits 0", () => {
  const { code, out } = run(fixture("leaky"), "--warn");
  assert.equal(code, 0, out);
  assert.match(out, /dew_flow_rag_qln/, "the finding is still printed in full");
  assert.match(out, /--warn — reported, not failed/);
});

test("a marker grants its token only in the file that carries it", () => {
  // Otherwise one declaration anywhere would licence the name everywhere, which is an allowlist with
  // extra steps.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ownership-"));
  try {
    fs.mkdirSync(path.join(root, "common"), { recursive: true });
    fs.writeFileSync(path.join(root, "common", "declared.md"),
      "<!-- owns: coai — the MCP tool names a session must type -->\n# One\n\nCall `mcp__coai__open`.\n");
    fs.writeFileSync(path.join(root, "common", "undeclared.md"), "# Two\n\nCall `mcp__coai__open`.\n");
    const { code, out } = run(root);
    assert.equal(code, 1, out);
    assert.match(out, /undeclared\.md/);
    assert.doesNotMatch(out, /PRODUCT common[\\/]declared\.md/, "the declaring file is not a finding");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("markersIn refuses a reason that is only punctuation or a shrug", () => {
  assert.deepEqual(markersIn("<!-- owns: coai — the tool names a session must type -->").tokens, ["coai"]);
  assert.equal(markersIn("<!-- owns: coai -->").malformed.length, 1);
  assert.equal(markersIn("<!-- owns: coai — -->").malformed.length, 1);
  assert.equal(markersIn("<!-- owns: coai — ok -->").malformed.length, 1, "a reason must say something");
});

test("findingsIn reports the line number a reader can go to", () => {
  const text = "# Title\n\nordinary prose\n\nMeasured in dew_flow_mcp today.\n";
  const found = findingsIn(text, "common/x.md");
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 5);
  assert.equal(found[0].token, "dew_flow_mcp");
});

test("a marker shown inside a code fence is documentation, not a declaration", () => {
  // Not hypothetical: the rule that DOCUMENTS this syntax was reported as carrying a malformed
  // marker, by the check it defines. A marker is an instruction to this tool, and one inside a fence
  // is being shown rather than given. A product NAME in a fence is still a name, so findings keep
  // reading fenced text — only marker parsing skips it.
  const shown = "# Rule\n\n```\n<!-- owns: <token> — <reason> -->\n```\n";
  assert.deepEqual(markersIn(shown), { tokens: [], malformed: [] });

  const given = "<!-- owns: coai — the MCP tool names a session must type -->\n# Rule\n";
  assert.deepEqual(markersIn(given).tokens, ["coai"]);

  // The other half: a product name inside a fence is still found.
  const fenced = "# Rule\n\n```\nMeasured in dew_flow_mcp.\n```\n";
  assert.equal(findingsIn(fenced, "common/x.md").length, 1, "a name in an example is still a name");
});
