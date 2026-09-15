#!/usr/bin/env node
/**
 * `rule-bodies.mjs`'s own tests.
 *
 * The property that matters is the one that is easy to lose: this tool records the rules you NAME.
 * A convenience flag that recorded everything would turn the freeze into a rubber stamp — the edit
 * you did not notice making would be blessed by the same command as the one you meant — so "an id
 * this run did not name keeps its old record" is asserted directly, not left to the reader.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { main, drifted, recordFor } from "./rule-bodies.mjs";

/** A repository with two rules and a manifest that matches both. */
function scene(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rule-bodies-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "common"), { recursive: true });
  fs.mkdirSync(path.join(root, "research"), { recursive: true });

  const rule = (name, body) => {
    const text = `---\nid: "common.${name}"\nload: "conditional"\ntasks: ["policy"]\n---\n${body}`;
    fs.writeFileSync(path.join(root, "common", `${name}.md`), text);
  };
  rule("one", "# One\n\nA sentence.\n");
  rule("two", "# Two\n\nAnother sentence.\n");

  const manifest = {
    note: "test",
    rules: [
      { id: "common.one", source: "common/one.md" },
      { id: "common.two", source: "common/two.md" },
    ],
  };
  for (const entry of manifest.rules) Object.assign(entry, recordFor(root, entry));
  fs.writeFileSync(path.join(root, "research", "rule-bodies.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return root;
}

const manifestOf = (root) => JSON.parse(fs.readFileSync(path.join(root, "research", "rule-bodies.json"), "utf8"));
const edit = (root, name, body) => {
  const file = path.join(root, "common", `${name}.md`);
  const text = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, text.replace(/(---\n)([\s\S]*)$/, (_, marker) => `${marker}${body}`));
};

test("a corpus in step reports OK and writes nothing", (t) => {
  const root = scene(t);
  const before = fs.readFileSync(path.join(root, "research", "rule-bodies.json"), "utf8");
  assert.equal(main([], root), 0);
  assert.equal(fs.readFileSync(path.join(root, "research", "rule-bodies.json"), "utf8"), before);
});

test("an edited body is named as drift, with the command that records it", (t) => {
  const root = scene(t);
  edit(root, "one", "# One\n\nA sentence, rewritten.\n");
  assert.deepEqual(drifted(root, manifestOf(root)).map((d) => d.id), ["common.one"]);
  assert.equal(main([], root), 1);
});

test("--update records the ids it was given, and only those", (t) => {
  // The property this tool exists to keep. Both bodies have changed; one id is named; the other must
  // still be drift afterwards, because a run that recorded it would have blessed an edit nobody named.
  const root = scene(t);
  edit(root, "one", "# One\n\nA sentence, rewritten.\n");
  edit(root, "two", "# Two\n\nAnother sentence, rewritten by accident.\n");

  assert.equal(main(["--update", "common.one"], root), 0);

  const after = manifestOf(root);
  assert.deepEqual(drifted(root, after).map((d) => d.id), ["common.two"],
    "the rule that was not named keeps its old record");
  assert.equal(main([], root), 1, "and the corpus is still drifted, so the suite stays red");
});

test("a heading change is drift even when the body hash is recorded", (t) => {
  const root = scene(t);
  edit(root, "one", "# One, renamed\n\nA sentence.\n");
  const drift = drifted(root, manifestOf(root));
  assert.equal(drift.length, 1);
  assert.ok(drift[0].hash && drift[0].sections, "both halves of the record moved");

  assert.equal(main(["--update", "common.one"], root), 0);
  assert.deepEqual(manifestOf(root).rules[0].sections, ["# One, renamed"]);
});

test("--update with no id is refused rather than treated as everything", (t) => {
  const root = scene(t);
  edit(root, "one", "# One\n\nA sentence, rewritten.\n");
  assert.equal(main(["--update"], root), 1);
  assert.deepEqual(drifted(root, manifestOf(root)).map((d) => d.id), ["common.one"], "nothing was recorded");
});

test("an id with no entry is a failure that writes nothing at all", (t) => {
  // A new rule records its body by hand, once. Creating the entry here would let a rule join the
  // corpus without anybody deciding that it should.
  const root = scene(t);
  edit(root, "one", "# One\n\nA sentence, rewritten.\n");
  const before = fs.readFileSync(path.join(root, "research", "rule-bodies.json"), "utf8");
  assert.equal(main(["--update", "common.one", "common.nowhere"], root), 1);
  assert.equal(fs.readFileSync(path.join(root, "research", "rule-bodies.json"), "utf8"), before,
    "one bad id leaves the whole manifest untouched, including the good id beside it");
});

test("a missing manifest stops the run rather than starting one", (t) => {
  const root = scene(t);
  fs.rmSync(path.join(root, "research", "rule-bodies.json"));
  assert.equal(main([], root), 1);
});
