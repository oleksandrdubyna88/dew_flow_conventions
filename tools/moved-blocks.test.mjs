// The reusable move verifier (E1.S4): tools/moved-blocks.mjs records and tools/lib/moved-blocks.mjs checks
// research/moved-blocks.json — one JSON array, append-only, whole-line ranges, fences unsplit. The baseline of 25 ranges is
// recorded here as `planned` entries; the activation of an unchanged block and the superseding of a changed one are proven
// on fixtures. The checker reads no history: a copy of a fixture with no `.git` gives the same answers.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { ownedDir } from "./lib/owned.mjs";
import { gitWith } from "./lib/git.mjs";
import { GUARD_MS } from "./lib/startup-ceilings.mjs";
import { LANDED_EPICS } from "./lib/parity-epics.mjs";
import { fenceDepth } from "./lib/rule-body.mjs";
import { verifyManifest, recordBaseline, recordMove, MANIFEST } from "./lib/moved-blocks.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gitGuarded = gitWith({ timeoutMs: GUARD_MS });
const sha = text => createHash("sha256").update(text).digest("hex");

// ---- the fixture: an owned git repository ------------------------------------------------------------------------------

const SRC = ["# Source", "alpha one", "café two", "  indented three", "five", "six", "", "```js", "const x = 1;", "```", ""].join("\n");
const BLOCK = "alpha one\ncafé two\n  indented three\n"; // lines 2-4
const IDENTITY = ["-c", "user.name=Moved test", "-c", "user.email=moved@example.invalid", "-c", "commit.gpgsign=false"];

function world(t) {
  const root = ownedDir(t, "moved blocks");
  const git = (...args) => gitGuarded(root, ...args);
  const commit = message => { git(...IDENTITY, "add", "-A"); git(...IDENTITY, "commit", "-qm", message); return git("rev-parse", "HEAD"); };
  git("init", "-q");
  fs.mkdirSync(path.join(root, "research"));
  fs.mkdirSync(path.join(root, "common"));
  fs.writeFileSync(path.join(root, "src.md"), SRC);
  fs.writeFileSync(path.join(root, MANIFEST), "[\n]\n");
  const c = commit("sample");
  const file = name => path.join(root, name);
  const manifestText = () => fs.readFileSync(file(MANIFEST), "utf8");
  const entries = () => JSON.parse(manifestText());
  const verify = (landed = [], from = root) => verifyManifest(from, JSON.parse(fs.readFileSync(path.join(from, MANIFEST), "utf8")), landed);
  const baseline = (range, id = "b1", commitId = c, epic = "E4", source = "src.md") => recordBaseline(root, { source, range, commit: commitId, epic, id });
  const move = (range, id, extra = {}, commitId = c) => recordMove(root, { source: "src.md", range, commit: commitId, destination: "common/d.md", epic: "E4", id, ...extra });
  // Move lines 2-4 out of the source into the destination, in the working tree, as an owning epic does before recording.
  const placeBlock = (text = BLOCK) => {
    fs.writeFileSync(file("common/d.md"), `# Destination\n${text}tail\n`);
    fs.writeFileSync(file("src.md"), fs.readFileSync(file("src.md"), "utf8").replace(BLOCK, ""));
  };
  return { root, git, commit, c, file, manifestText, entries, verify, baseline, move, placeBlock };
}
const refusal = (fn, pattern) => assert.throws(fn, error => error.name === "Refusal" && pattern.test(error.message), String(pattern));

// ---- recording a baseline ----------------------------------------------------------------------------------------------

test("a baseline records the exact range: the commit as 40 hex, the byte length and the hash with é as two bytes", t => {
  const w = world(t);
  w.baseline("2-4");
  const [entry] = w.entries();
  assert.deepEqual(Object.keys(entry), ["id", "status", "epic", "source", "lines", "beforeCommit", "sha256", "length"]);
  assert.equal(entry.status, "planned");
  assert.equal(entry.lines, "2-4");
  assert.match(entry.beforeCommit, /^[0-9a-f]{40}$/);
  assert.equal(entry.beforeCommit, w.c);
  assert.equal(entry.length, Buffer.byteLength(BLOCK));
  assert.ok(entry.length > BLOCK.length, "é counts as two bytes");
  assert.equal(entry.sha256, sha(BLOCK));
});

test("a single line is a whole-line range and is recorded as N-N", t => {
  const w = world(t);
  w.baseline("5", "b5");
  const [entry] = w.entries();
  assert.equal(entry.lines, "5-5");
  assert.equal(entry.sha256, sha("five\n"));
});

test("the fence-balanced refusal: a range may not start or end inside a fence; a whole fence is recorded", t => {
  const w = world(t);
  refusal(() => w.baseline("7-9", "f1"), /split a fenced block.*E1\.S0b/);
  refusal(() => w.baseline("9-11", "f2"), /split a fenced block/);
  refusal(() => w.baseline("9-10", "f3"), /split a fenced block/);
  assert.equal(w.entries().length, 0, "a refusal writes nothing");
  w.baseline("8-10", "f4");
  assert.equal(w.entries()[0].sha256, sha("```js\nconst x = 1;\n```\n"));
});

test("fenceDepth: true where the line ends inside an open fence, per line", () => {
  assert.deepEqual(fenceDepth("a\n```js\nb\n```\nc\n"), [false, true, true, false, false, false]);
  assert.deepEqual(fenceDepth("````\n```\ninner\n```\n````\nz"), [true, true, true, true, false, false], "a longer fence is not closed by a shorter run");
  assert.deepEqual(fenceDepth("~~~\nx"), [true, true], "an unclosed fence runs to the end");
});

test("the mid-line refusal: a column range names E1.S0b and writes nothing", t => {
  const w = world(t);
  for (const range of ["2:1-4:5", "2-4:3", "0-3", "4-2", "a-b", "2-", "-3"]) refusal(() => w.baseline(range, "m1"), /whole lines.*E1\.S0b/);
  assert.equal(w.entries().length, 0);
});

test("lines past the end, an unknown commit, an existing id and a bad epic are refused, writing nothing", t => {
  const w = world(t);
  w.baseline("2-4");
  const before = w.manifestText();
  refusal(() => w.baseline("2-40", "b9"), /past the end/);
  refusal(() => w.baseline("2-4", "b9", "0".repeat(40)), /unknown commit|not a commit/i);
  refusal(() => w.baseline("2-4", "b1"), /already/);
  refusal(() => w.baseline("2-4", "b9", w.c, "E9"), /epic/);
  assert.equal(w.manifestText(), before);
});

// ---- activating an unchanged block, superseding a changed one ----------------------------------------------------------

test("an unchanged block is ACTIVATED: the destination lines are found in the working tree and the manifest verifies", t => {
  const w = world(t);
  w.baseline("2-4");
  w.placeBlock();
  w.move("2-4", "a1");
  const entry = w.entries()[1];
  assert.deepEqual(entry, { id: "a1", activates: "b1", destination: "common/d.md", destinationLines: "2-4", beforeCommit: w.c });
  w.commit("the move");
  assert.deepEqual(w.verify(), []);
});

test("a changed block is SUPERSEDED: the new entry carries justifiedBy and the old one gains supersededBy and nothing else", t => {
  const w = world(t);
  w.baseline("2-4");
  w.commit("record the baseline");
  const before = w.manifestText();
  const changed = BLOCK.replace("café two", "café three");
  fs.writeFileSync(w.file("src.md"), SRC.replace("café two", "café three"));
  const j = w.commit("fix a word in the block");
  fs.writeFileSync(w.file("common/d.md"), `# Destination\n${changed}tail\n`);
  fs.writeFileSync(w.file("src.md"), fs.readFileSync(w.file("src.md"), "utf8").replace(changed, ""));
  w.move("2-4", "s1", { supersedes: "b1", justifiedBy: j }, j);
  const entries = w.entries();
  assert.equal(entries[0].supersededBy, "s1");
  assert.deepEqual(entries[1], {
    id: "s1", supersedes: "b1", justifiedBy: j, justifiedFiles: ["src.md"], epic: "E4", source: "src.md", lines: "2-4",
    beforeCommit: j, sha256: sha(changed), length: Buffer.byteLength(changed), destination: "common/d.md", destinationLines: "2-4",
  });
  const after = w.manifestText();
  assert.ok(after.replace(',\n    "supersededBy": "s1"', "").startsWith(before.slice(0, -"\n]\n".length)), "the old entry gained only that field; every other earlier byte is unchanged");
  w.commit("the move");
  assert.deepEqual(w.verify(), []);
});

test("a supersession is refused when its justifying commit touches another file or is missing, and a destination with the old words is a finding", t => {
  const w = world(t);
  w.baseline("2-4");
  w.commit("record the baseline");
  const before = w.manifestText();
  fs.writeFileSync(w.file("src.md"), SRC.replace("café two", "café three"));
  fs.writeFileSync(w.file("other.md"), "unrelated\n");
  const j = w.commit("fix a word and touch another file");
  const changed = BLOCK.replace("café two", "café three");
  fs.writeFileSync(w.file("common/d.md"), `# Destination\n${changed}tail\n`);
  refusal(() => w.move("2-4", "s1", { supersedes: "b1", justifiedBy: j }, j), /touches .*other\.md|only the block's source/);
  refusal(() => w.move("2-4", "s1", { supersedes: "b1" }, j), /justified-by/);
  refusal(() => w.move("2-4", "s1", { justifiedBy: j }, j), /supersedes/);
  assert.equal(w.manifestText(), before, "a refusal writes nothing");
});

test("a supersession whose destination holds the baseline's OLD bytes fails the checker", t => {
  const w = world(t);
  w.baseline("2-4");
  w.commit("record the baseline");
  const changed = BLOCK.replace("café two", "café three");
  fs.writeFileSync(w.file("src.md"), SRC.replace("café two", "café three"));
  const j = w.commit("fix a word in the block");
  fs.writeFileSync(w.file("common/d.md"), `# Destination\n${changed}tail\n`);
  fs.writeFileSync(w.file("src.md"), fs.readFileSync(w.file("src.md"), "utf8").replace(changed, ""));
  w.move("2-4", "s1", { supersedes: "b1", justifiedBy: j }, j);
  assert.deepEqual(w.verify(), []);
  fs.writeFileSync(w.file("common/d.md"), `# Destination\n${BLOCK}tail\n`);
  const findings = w.verify();
  assert.equal(findings.length >= 1, true);
  assert.ok(findings.some(finding => /s1/.test(finding)), findings.join("\n"));
});

// ---- the checker -------------------------------------------------------------------------------------------------------

test("an unpaired baseline: unchanged source and a section added above are fine; one changed byte and a landed epic are findings", t => {
  const w = world(t);
  w.baseline("2-4");
  assert.deepEqual(w.verify(), []);
  fs.writeFileSync(w.file("src.md"), `inserted one\ninserted two\n${SRC}`);
  assert.deepEqual(w.verify(), [], "the run is found anywhere, so line numbers moving does not break the check");
  fs.writeFileSync(w.file("src.md"), SRC.replace("alpha one", "alpha 0ne"));
  const changed = w.verify();
  assert.equal(changed.length, 1, changed.join("\n"));
  assert.match(changed[0], /b1/);
  fs.writeFileSync(w.file("src.md"), SRC);
  const landed = w.verify(["E4"]);
  assert.equal(landed.length, 1, landed.join("\n"));
  assert.match(landed[0], /unpaired baseline whose epic has landed/);
});

test("an activation is one finding for each of: the block twice in the destination, mid-line, changed, absent, or still in the source", t => {
  const w = world(t);
  w.baseline("2-4");
  w.placeBlock();
  w.move("2-4", "a1");
  assert.deepEqual(w.verify(), []);
  const dest = text => fs.writeFileSync(w.file("common/d.md"), text);
  const one = (label, mutate, pattern) => {
    mutate();
    const findings = w.verify();
    assert.equal(findings.length, 1, `${label}: ${findings.join(" | ")}`);
    assert.match(findings[0], pattern, label);
    dest(`# Destination\n${BLOCK}tail\n`);
    fs.writeFileSync(w.file("src.md"), SRC.replace(BLOCK, ""));
  };
  one("twice", () => dest(`# Destination\n${BLOCK}${BLOCK}tail\n`), /a1.*(twice|more than once|exactly once)/);
  one("mid-line", () => dest("# Destination\nxx alpha one\ncafé two\n  indented three\ntail\n"), /a1/);
  one("changed", () => dest("# Destination\nalpha one\ncafé TWO\n  indented three\ntail\n"), /a1/);
  one("absent", () => fs.rmSync(w.file("common/d.md")), /a1.*(does not exist|absent|missing)/);
  one("left in the source", () => fs.writeFileSync(w.file("src.md"), SRC), /a1.*still holds/);
});

test("pairing: two activations of one baseline, an activation and a supersession, and a dangling reference are one finding each", t => {
  const w = world(t);
  w.baseline("2-4");
  w.placeBlock();
  w.move("2-4", "a1");
  const base = w.entries();
  const run = (entries, landed = []) => verifyManifest(w.root, entries, landed);
  const second = { ...base[1], id: "a2" };
  const two = run([...base, second]);
  assert.equal(two.length, 1, two.join("\n"));
  assert.match(two[0], /b1.*(twice|more than one|paired)/);
  const supersession = {
    id: "s1", supersedes: "b1", justifiedBy: "a".repeat(40), justifiedFiles: ["src.md"], epic: "E4", source: "src.md", lines: "2-4",
    beforeCommit: w.c, sha256: base[0].sha256, length: base[0].length, destination: "common/d.md", destinationLines: "2-4",
  };
  const both = run([{ ...base[0], supersededBy: "s1" }, base[1], supersession]);
  assert.equal(both.length, 1, both.join("\n"));
  assert.match(both[0], /b1/);
  fs.writeFileSync(w.file("src.md"), SRC); // b1 is then an unpaired baseline whose block is still in place
  const dangling = run([base[0], { ...base[1], activates: "nope" }]);
  assert.equal(dangling.length, 1, dangling.join("\n"));
  assert.match(dangling[0], /nope/);
});

test("the manifest is append-only: a fourth entry leaves the first three byte for byte and the array parses", t => {
  const w = world(t);
  w.baseline("2-4", "b1");
  w.baseline("5", "b2");
  w.baseline("8-10", "b3");
  // Hand-format the first entry the way no serialiser would: appending must not normalise it back.
  fs.writeFileSync(w.file(MANIFEST), w.manifestText().replace('"status": "planned"', '"status":   "planned"'));
  const three = w.manifestText();
  assert.ok(three.includes('"status":   "planned"'));
  w.baseline("6", "b4");
  const four = w.manifestText();
  assert.ok(four.startsWith(three.slice(0, -"\n]\n".length)), "everything before the closing bracket of the third is still there");
  assert.deepEqual(JSON.parse(four).map(entry => entry.id), ["b1", "b2", "b3", "b4"]);
  assert.ok(four.endsWith("\n]\n"));
});

test("the checker reads no history: a copy of the fixture with no .git gives the same findings", t => {
  const w = world(t);
  w.baseline("2-4");
  w.placeBlock();
  w.move("2-4", "a1");
  const copy = ownedDir(t, "moved blocks copy");
  for (const name of ["src.md", "common", "research"]) fs.cpSync(w.file(name), path.join(copy, name), { recursive: true });
  assert.equal(fs.existsSync(path.join(copy, ".git")), false);
  assert.deepEqual(w.verify([], copy), []);
  assert.deepEqual(w.verify(), []);
  for (const folder of [copy, w.root]) fs.writeFileSync(path.join(folder, "src.md"), SRC); // the block is left in the source of both
  const noHistory = w.verify([], copy);
  assert.ok(noHistory.length > 0, "the fixture must be red, or equal answers prove nothing");
  assert.deepEqual(noHistory, w.verify(), "the same findings with and without history");
});

// ---- the real manifest -------------------------------------------------------------------------------------------------

test("the real manifest holds exactly the 25 baseline entries, all planned, none with a destination, and verifies against the tree", () => {
  const entries = JSON.parse(fs.readFileSync(path.join(sourceRoot, MANIFEST), "utf8"));
  assert.equal(entries.length, 25);
  assert.ok(entries.every(entry => entry.status === "planned" && !Object.hasOwn(entry, "destination") && !Object.hasOwn(entry, "activates")));
  assert.deepEqual(verifyManifest(sourceRoot, entries, LANDED_EPICS), []);
  const byFile = Object.groupBy(entries, entry => entry.source);
  assert.deepEqual(Object.fromEntries(Object.entries(byFile).map(([source, list]) => [source, list.length])), {
    "common/testing.md": 3, "common/reliability.md": 6, "common/logging-serilog.md": 3, "common/utc-timestamps.md": 2,
    "typescript/doctrine.md": 6, "csharp/nuget-packages.md": 5,
  });
});

test("the real manifest's byte lengths are the ones the stories document measured after the whitespace splits", () => {
  const entries = JSON.parse(fs.readFileSync(path.join(sourceRoot, MANIFEST), "utf8"));
  const expected = {
    "testing-runner": 1113, "testing-runner-rust": 116, "testing-architecture": 252,
    "reliability-scope": 433, "reliability-fire-and-forget": 436, "reliability-sweep-at-start": 375, "reliability-token": 160, "reliability-signals": 322, "reliability-timeout": 1698,
    "logging-colour": 1640, "logging-shape": 497, "logging-rust": 875,
    "utc-csharp-fence": 311, "utc-rust": 219,
    "ts-script": 2016, "ts-backtick": 755, "ts-cast": 932, "ts-tsc": 1151, "ts-script-box": 166, "ts-boxes-testing": 278,
    "nuget-before": 824, "nuget-licence": 334, "nuget-bumping-heading": 11, "nuget-bumping-cadence": 187, "nuget-prefer": 286,
  };
  assert.deepEqual(Object.fromEntries(entries.map(entry => [entry.id, entry.length])), expected);
  assert.deepEqual(entries.map(entry => entry.id), Object.keys(expected), "in the stories document's order");
});

test("the tool with no argument verifies the real manifest, and refuses a bad argument with usage", () => {
  const tool = path.join(sourceRoot, "tools/moved-blocks.mjs");
  const run = (...args) => spawnSync(process.execPath, [tool, ...args], { cwd: sourceRoot, encoding: "utf8", timeout: GUARD_MS });
  const ok = run();
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(ok.stdout.trim(), "moved-blocks: OK — 25 baseline(s), 0 activated, 0 superseded");
  const usage = run("--nope");
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /usage/i);
});

test("the recorder through the command line: a baseline is written, a refusal exits 1 with the reason and writes nothing", t => {
  const w = world(t);
  fs.mkdirSync(w.file("tools"), { recursive: true });
  fs.copyFileSync(path.join(sourceRoot, "tools/moved-blocks.mjs"), w.file("tools/moved-blocks.mjs"));
  fs.cpSync(path.join(sourceRoot, "tools/lib"), w.file("tools/lib"), { recursive: true });
  const tool = (...args) => spawnSync(process.execPath, [w.file("tools/moved-blocks.mjs"), ...args], { cwd: w.root, encoding: "utf8", timeout: GUARD_MS });
  const done = tool("--baseline", "src.md", "2-4", w.c, "E4", "b1");
  assert.equal(done.status, 0, done.stderr);
  assert.equal(w.entries().length, 1);
  const before = w.manifestText();
  const refused = tool("--baseline", "src.md", "2:1-4:5", w.c, "E4", "b2");
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /E1\.S0b/);
  assert.equal(w.manifestText(), before);
  assert.equal(tool().status, 0);
});
