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

/**
 * A repository with one leaky rule and, optionally, a baseline recording what it already carries.
 * `undefined` writes no baseline at all, which is the armed state.
 */
function baselineScene(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ownership-baseline-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "common"), { recursive: true });
  fs.mkdirSync(path.join(root, "tools"), { recursive: true });
  fs.writeFileSync(path.join(root, "common", "x.md"), ["# One", "", "Measured in dew_flow_rag_qln today.", ""].join("\n"));
  if (files !== undefined) {
    fs.writeFileSync(path.join(root, "tools", "ownership-baseline.json"), JSON.stringify({ files }, null, 2));
  }
  return root;
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

test("a file over its recorded count fails, naming the file and both numbers", (t) => {
  const root = baselineScene(t, { "common/x.md": 0 });
  const { code, out } = run(root);
  assert.equal(code, 1, out);
  assert.match(out, /OVER BASELINE common.x\.md — 1 finding\(s\), 0 recorded/);
  assert.match(out, /Nothing may be ADDED to it/);
});

test("a file at its recorded count passes, and the finding is still printed", (t) => {
  const root = baselineScene(t, { "common/x.md": 1 });
  const { code, out } = run(root);
  assert.equal(code, 0, out);
  assert.match(out, /dew_flow_rag_qln/, "reported, not hidden");
  assert.match(out, /within the baseline/);
});

test("cleaning one file never buys room for another to get worse", (t) => {
  // The defect a single repository-wide number has, and the reason the baseline is per FILE: one
  // author removes ten references from one rule while another adds two to a different rule, the
  // total still falls, and the additions merge unseen.
  const root = baselineScene(t, { "common/x.md": 5, "common/y.md": 0 });
  fs.writeFileSync(path.join(root, "common", "y.md"), "# Two\n\nMeasured in dew_flow_mcp today.\n");
  const { code, out } = run(root);
  assert.equal(code, 1, out);
  assert.match(out, /OVER BASELINE common.y\.md/);
  assert.doesNotMatch(out, /OVER BASELINE common.x\.md/, "the file that got cleaner is not the problem");
});

test("a file with findings and no entry at all is new drift", (t) => {
  const root = baselineScene(t, { "common/other.md": 3 });
  const { code, out } = run(root);
  assert.equal(code, 1, out);
  assert.match(out, /OVER BASELINE common.x\.md — 1 finding\(s\), 0 recorded/);
});

test("with no baseline file at all, any finding fails — that is the armed state", (t) => {
  const root = baselineScene(t, undefined);
  const { code, out } = run(root);
  assert.equal(code, 1, out);
  assert.match(out, /dew_flow_rag_qln/);
});

test("a baseline that cannot be read stops the run rather than allowing everything", (t) => {
  // A ratchet that failed to load must not look like a ratchet that found nothing.
  const root = baselineScene(t, { "common/x.md": 1 });
  fs.writeFileSync(path.join(root, "tools", "ownership-baseline.json"), "{ this is not json");
  const { code, out } = run(root);
  assert.equal(code, 1, out);
  assert.match(out, /could not be read as a baseline/);
  assert.match(out, /switch the ratchet off and still look green/);
});

test("a baseline still fails on a malformed marker, whatever the counts say", (t) => {
  // The ratchet is about the BACKLOG of names. A marker with no reason is a defect in the mechanism,
  // and no baseline forgives it.
  const root = baselineScene(t, { "common/x.md": 99 });
  fs.writeFileSync(path.join(root, "common", "x.md"), "<!-- owns: coai -->\n# One\n\nCall `mcp__coai__open`.\n");
  const { code, out } = run(root);
  assert.equal(code, 1, out);
  assert.match(out, /MARKER/);
});

test("a reason that is the shape of a reason rather than one is refused", () => {
  // No check can judge whether a justification is honest — that is what review is for, and the marker
  // is deliberately visible in the diff. What this refuses is the shapes that are not reasons at all.
  const declared = (reason) => markersIn(`<!-- owns: coai — ${reason} -->`);
  assert.equal(declared("the MCP tool names a session must type").tokens.length, 1);
  for (const placeholder of ["needed", "see above", "required for now", "TBD", "because", "it is needed here"]) {
    assert.equal(declared(placeholder).malformed.length, 1, `"${placeholder}" is not a reason`);
  }
});

test("the directories this scans are the directories the resolver loads", async () => {
  // Two hardcoded lists that must agree: if a fifth rule directory is ever added, loadCatalog would
  // distribute those rules to consumers while this check skipped them entirely.
  const { rulesIn: scanned } = await import("./ownership-check.mjs");
  const catalogSource = fs.readFileSync(path.join(here, "lib", "rule-catalog.mjs"), "utf8");
  const declared = /const DIRECTORIES = \[([^\]]*)\]/.exec(catalogSource)[1]
    .split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ownership-dirs-"));
  try {
    for (const dir of declared) {
      fs.mkdirSync(path.join(root, dir), { recursive: true });
      fs.writeFileSync(path.join(root, dir, "probe.md"), "# probe\n");
    }
    const seen = scanned(root).map((f) => path.dirname(f)).sort();
    assert.deepEqual(seen, [...declared].sort(),
      "ownership-check and rule-catalog must walk the same directories");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
