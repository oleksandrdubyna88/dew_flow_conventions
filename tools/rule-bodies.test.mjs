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
/**
 * Replace a rule's BODY, keeping its frontmatter.
 *
 * The first version anchored on the opening `---` and replaced everything after it, so every edited
 * fixture lost its frontmatter entirely — and the freeze was then exercised against a file shape that
 * cannot exist, which would not notice `id`, `load` or `tasks` leaking into the hash.
 */
const edit = (root, name, body) => {
  const file = path.join(root, "common", `${name}.md`);
  const text = fs.readFileSync(file, "utf8");
  const frontmatter = /^---\n[\s\S]*?\n---\n/.exec(text);
  assert.ok(frontmatter, `${name}.md has no frontmatter to keep`);
  fs.writeFileSync(file, `${frontmatter[0]}${body}`);
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

test("an unsupported flag after --update is refused, not quietly dropped", (t) => {
  // `--update common.one --all` used to drop the flag, record one rule, exit 0 and report that the
  // manifest was written — so a caller who believed --all existed would be told their edit was
  // recorded while another rule stayed drifted. A tool whose whole argument is that there is no
  // --all must not accept the word and do something else.
  const root = scene(t);
  edit(root, "one", "# One\n\nA sentence, rewritten.\n");
  edit(root, "two", "# Two\n\nAnother sentence, rewritten.\n");

  const code = main(["--update", "common.one", "--all"], root);
  assert.equal(code, 1);
  assert.deepEqual(drifted(root, manifestOf(root)).map((d) => d.id), ["common.one", "common.two"],
    "a refused run records nothing at all");
});

test("a rule file with no manifest entry is unrecorded drift, not a clean bill of health", (t) => {
  // drifted() walked the manifest, so a NEW rule entered policy distribution with no freeze over it
  // and this tool said OK. It walks the rule directories now.
  const root = scene(t);
  fs.writeFileSync(path.join(root, "common", "three.md"),
    '---\nid: "common.three"\nload: "conditional"\ntasks: ["policy"]\n---\n# Three\n\nNew.\n');
  const code = main([], root);
  assert.equal(code, 1);
  assert.deepEqual(drifted(root, manifestOf(root)).map((d) => d.id), ["common.three"]);
});

test("a recorded rule whose file is gone is reported, not an ENOENT stack trace", (t) => {
  const root = scene(t);
  fs.rmSync(path.join(root, "common", "two.md"));
  const drift = drifted(root, manifestOf(root));
  assert.deepEqual(drift.map((d) => d.id), ["common.two"]);
  assert.equal(drift[0].missing, true, "the reason is that its source is gone");
  assert.equal(main([], root), 1);
});

test("a `#` comment inside a code fence is not a heading", (t) => {
  // Measured in the real manifest before this was fixed: common.http-contracts recorded
  // `# @name vault_get_returns_the_callers_blob` and `# @prod` as headings, and common.git-workflow
  // recorded two shell comments. Editing a comment in a code sample then reported that the rule's
  // HEADINGS had changed, which couples the outline to the contents of an example.
  const root = scene(t);
  edit(root, "one", "# One\n\n```sh\n# not a heading, a comment\n```\n\n## Really a heading\n");
  assert.equal(main(["--update", "common.one"], root), 0);
  assert.deepEqual(manifestOf(root).rules[0].sections, ["# One", "## Really a heading"]);
});

test("a manifest that cannot be written says so, and leaves the old one intact", (t) => {
  // The manifest is the freeze's only record, so a truncate-then-write that is interrupted leaves
  // partial JSON that fails every rule at once and can be committed by accident. It writes a
  // temporary file beside the manifest and renames it over, so a failed write changes nothing.
  //
  // A DIRECTORY at the temporary path is the portable way to make that write fail on every platform
  // this runs on, while the manifest itself still reads normally — which is the case under test.
  const root = scene(t);
  edit(root, "one", "# One\n\nA sentence, rewritten.\n");
  const manifest = path.join(root, "research", "rule-bodies.json");
  const before = fs.readFileSync(manifest, "utf8");
  fs.mkdirSync(`${manifest}.tmp`);

  assert.equal(main(["--update", "common.one"], root), 1);
  assert.equal(fs.readFileSync(manifest, "utf8"), before, "the old record survived the failure");
  assert.deepEqual(drifted(root, manifestOf(root)).map((d) => d.id), ["common.one"],
    "and the corpus is still drifted, so nothing was quietly blessed");
});

test("a heading keeps the words inside its backticks", (t) => {
  // Stripping fences from the heading scan also stripped INLINE code, content and all, so
  // '### 7. `git status` answers WHAT' was recorded as '### 7.  answers WHAT'. Measured in the real
  // manifest: six headings across five rules lost the names they were about. A fence is a block that
  // is being shown; an inline span inside a heading is part of the heading.
  const root = scene(t);
  edit(root, "one", [
    "# One with `code` in it",
    "",
    "```sh",
    "# not a heading, a comment",
    "```",
    "",
    "## 7. `git status` answers WHAT",
    "",
  ].join("\n"));

  assert.equal(main(["--update", "common.one"], root), 0);
  assert.deepEqual(manifestOf(root).rules[0].sections,
    ["# One with `code` in it", "## 7. `git status` answers WHAT"]);
});

test("the frontmatter is not part of the body that is hashed", (t) => {
  // What consumers load is the body; the resolver strips frontmatter before handing it over. If the
  // hash covered `id` or `tasks`, a metadata change would read as a rule edit and a rule edit could
  // be hidden by a compensating metadata change.
  const root = scene(t);
  const file = path.join(root, "common", "one.md");
  const before = manifestOf(root).rules[0].bodySha256;
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace('tasks: ["policy"]', 'tasks: ["policy","docs"]'));
  assert.deepEqual(drifted(root, manifestOf(root)), [], "metadata moved, the body did not");
  assert.equal(manifestOf(root).rules[0].bodySha256, before);
});

test("an argument this CLI does not have is refused, whatever it looks like", (t) => {
  // `--all` alone found no `--update`, fell through to verification and printed OK on a clean corpus
  // — which a caller who believed in `--all` would read as "recorded". And `--typo --update <id>`
  // updated the manifest with the typo ignored.
  const root = scene(t);
  edit(root, "one", "# One\n\nA sentence, rewritten.\n");

  assert.equal(main(["--all"], root), 1, "a flag that does not exist is not a verification run");
  assert.equal(main(["--typo", "--update", "common.one"], root), 1, "and it is not ignored either");
  assert.deepEqual(drifted(root, manifestOf(root)).map((d) => d.id), ["common.one"], "nothing recorded");

  // The two supported shapes still work.
  assert.equal(main([], root), 1, "no arguments: verify, and this corpus is drifted");
  assert.equal(main(["--update", "common.one"], root), 0);
});
