#!/usr/bin/env node
/**
 * The two rule texts of the merged core (`common/test-leftovers.md` and its janitor companion) — S1 of the merged-core
 * plan: what the text is made of, that a read of it stays under the per-read cap, and that no line of it is a sweeper
 * that cannot tell one user's leftovers from another's.
 *
 * The cap is proven on an INFLATED COPY in a scratch root, never by swapping the real file in place (the real file is
 * shared with every test running beside this one).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { gitWith } from "./lib/git.mjs";
import { ownedDir } from "./lib/owned.mjs";
import { run } from "./lib/rule-cli.mjs";
import { bodyOf } from "./lib/rule-body.mjs";
import { GUARD_MS } from "./lib/startup-ceilings.mjs";
import { broadLines } from "./lib/sweeper-scan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(here, "..");
const RULE = "common/test-leftovers.md";
const COMPANION = "common/test-leftovers-janitor.md";
const CAP = 32768;
const BEGIN = "<!-- core:begin -->\n";
const END = "<!-- core:end -->";
const gitGuarded = gitWith({ timeoutMs: GUARD_MS });

const read = (file) => fs.readFileSync(path.join(sourceRoot, file), "utf8").replaceAll("\r\n", "\n");

/** The text between each `<!-- core:begin -->\n` and the next `<!-- core:end -->` — the definition the private sibling extracts with. */
function spansOf(text) {
  const spans = [];
  for (let from = 0; ;) {
    const begin = text.indexOf(BEGIN, from);
    if (begin < 0) return spans;
    const end = text.indexOf(END, begin + BEGIN.length);
    assert.ok(end > begin, "a core span opened and never closed");
    spans.push(text.slice(begin + BEGIN.length, end));
    from = end + END.length;
  }
}

test("S1 1 the rule has two core spans and its companion one, each non-empty", () => {
  const rule = spansOf(read(RULE));
  assert.equal(rule.length, 2, "common/test-leftovers.md carries two spans");
  assert.equal(spansOf(read(COMPANION)).length, 1, "the companion carries one span");
  for (const span of [...rule, ...spansOf(read(COMPANION))]) assert.ok(span.trim().length > 1000, "a span is the text, not a marker");
});

test("S1 2 a read of the rule refuses above the cap, proven on an inflated copy in a scratch root", (t) => {
  assert.ok(Buffer.byteLength(bodyOf(read(RULE))) <= CAP, "the real body is under the per-read cap");
  const root = ownedDir(t, "rule cap copy");
  for (const name of ["common", "csharp", "rust", "typescript", "AGENTS.md", "CLAUDE.md", "ENTRY.md", ".agents", "README.md", "research"]) {
    fs.cpSync(path.join(sourceRoot, name), path.join(root, name), { recursive: true });
  }
  gitGuarded(root, "init", "-q");
  gitGuarded(root, "-c", "user.name=Rule test", "-c", "user.email=rules@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-qm", "fixture");
  const invoke = (args) => run([...args, "--repo", root], root);
  assert.match(invoke(["read", "--task", "implement", "--only", "common.test-leftovers"]), /END RULE common\.test-leftovers/, "the unchanged copy reads");
  fs.appendFileSync(path.join(root, RULE), `\n${"A line that only makes the rule longer.\n".repeat(80)}`); // 3 200 B
  assert.throws(() => invoke(["read", "--task", "implement", "--only", "common.test-leftovers"]), /exceeds 32 KiB per read/);
});

test("S1 3 no line of either file is an owner-blind sweep pattern", () => {
  assert.deepEqual(broadLines(read(RULE)), [], `${RULE} holds a sweep that names no owner`);
  assert.deepEqual(broadLines(read(COMPANION)), [], `${COMPANION} holds a sweep that names no owner`);
});

test("S1 4 the core's stub names the companion and the companion names the core", () => {
  const rule = spansOf(read(RULE)).join("\n");
  const companion = spansOf(read(COMPANION)).join("\n");
  assert.ok(rule.includes("`" + COMPANION + "`"), "the core's janitor section points at the companion by path");
  assert.ok(companion.includes("`" + RULE + "`"), "the companion points back at the core");
  assert.doesNotMatch(rule + companion, /\]\([^)]+\)/, "no markdown link inside a span");
});

test("S1 5 every example name carries an owner of the grammar; the old form appears only as the legacy name's own description", () => {
  const text = [...spansOf(read(RULE)), ...spansOf(read(COMPANION))].join("\n");
  const found = [...text.matchAll(/(teststodelete)[-_](<[a-z]+>|[A-Za-z0-9]+)/gi)].filter((match) => match[1] !== "TESTSTODELETE"); // the upper-case spelling is an environment variable, not a name
  assert.ok(found.length > 5, "the texts do carry examples");
  for (const { 2: segment, index } of found) {
    const legacySentence = segment === "<repo>" && text.slice(Math.max(0, index - 400), index).includes("legacy name");
    assert.ok(legacySentence || /^(?:<owner>|[uw][0-9]{1,10}|exempt|quarantine)$/.test(segment), "`" + segment + "` follows the prefix and is no owner");
  }
  assert.equal(found.filter((match) => match[2] === "<repo>").length, 1, "the old form is spelled once, where the legacy name is defined");
});

test("S1 6 the companion is its own rule with a conditional load and three tasks", () => {
  const head = read(COMPANION).split("\n---\n")[0];
  assert.match(head, /^---\nid: "common\.test-leftovers-janitor"\nload: "conditional"\ntasks: \["audit","policy","release"\]$/);
});
