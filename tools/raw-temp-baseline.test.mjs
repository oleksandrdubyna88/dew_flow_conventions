#!/usr/bin/env node
/**
 * The tests of the `raw-temp` baseline (`common/test-leftovers-detail.md` §7): the guard's `--baseline` pass, its `--print-baseline`
 * listing and its `--baseline-shrinks` check (`todo/PLAN_raw_temp_baseline.md`, the test table; the number before each title is the
 * table's). Every behaviour was watched RED before the code, GREEN with it, and RED again with the code taken out.
 *
 * Fixtures are written at run time into owned folders. The strings that would make THIS file a finding of the guard it tests — a temp
 * API, the prefix word — are spelled in two pieces.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { git } from "./lib/git.mjs";
import { ownedDir } from "./lib/owned.mjs";
import { main, scanRepository } from "./leftovers-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MK = "mk" + "dtempSync";
const TD = "tmp" + "dir";
const MARK = "testsTo" + "Delete-baseline-proof: ";
const ROOT = "src/test/";
const PROOF = "src/test/runFolder.test.mjs";
const A = "src/test/a.test.mjs";
const L3 = `const dir = fs.${MK}("x-");`;
const L7 = `const other = os.${TD}();`;
const SOURCE = ["import fs from 'node:fs';", "import os from 'node:os';", L3, "console.log(dir);"];
const PROOF_TEXT = `// ${MARK}${ROOT}\nexport {};\n`;

/** The hash of a line as the rule says: trimmed, `\r` removed. Written here independently of the module under test. */
const sha = (line) => createHash("sha256").update(line.replaceAll("\r", "").trim()).digest("hex");
const entry = (file, line, hint) => ({ file, sha256: sha(line), line: hint });
const baselineOf = (over = {}) => ({ about: "fixture", class: "raw-temp", scopes: [{ root: ROOT, proof: PROOF }], entries: [entry(A, L3, 3)], ...over });
const lines = (list) => `${list.join("\n")}\n`;

/** A git repository in an owned folder holding `files` (path → text). */
function tree(t, files = {}) {
  const repo = ownedDir(t, "baseline");
  git(repo, "init", "-q", "-b", "main");
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(repo, name)), { recursive: true });
    fs.writeFileSync(path.join(repo, name), text);
  }
  return repo;
}

const commit = (repo, message) => {
  git(repo, "add", "-A");
  git(repo, "-c", "user.name=Baseline test", "-c", "user.email=baseline@example.invalid", "-c", "commit.gpgsign=false", "commit", "-q", "--allow-empty", "-m", message);
};

/** The scanned tree with `a.test.mjs`, the proof and a baseline file; `null` leaves a part out. */
function fixture(t, { source = SOURCE, proof = PROOF_TEXT, baseline = baselineOf(), extra = {} } = {}) {
  const repo = tree(t, { ...(source === null ? {} : { [A]: lines(source) }), ...(proof === null ? {} : { [PROOF]: proof }), ...extra });
  const file = path.join(repo, "baseline.json");
  if (baseline !== null) fs.writeFileSync(file, typeof baseline === "string" ? baseline : JSON.stringify(baseline, null, 2));
  return { repo, file };
}

/** Run the guard and capture `{ code, text, out }` (`text` is both streams, `out` stdout only). */
function guard(repo, extra = []) {
  const all = [];
  const out = [];
  const code = main(["--repo", repo, "--profile", "node", ...extra], { out: (line) => { all.push(line); out.push(line); }, err: (line) => all.push(line) });
  return { code, text: all.join("\n"), out: out.join("\n") };
}

const withBaseline = (repo, file, extra = []) => guard(repo, ["--baseline", file, ...extra]);
const found = (text) => [...text.matchAll(/^\s+(\S+:\d+) — (\S+)/gm)].map((match) => `${match[1]} — ${match[2]}`);
const write = (repo, name, text) => fs.writeFileSync(path.join(repo, name), text);
const writeBaseline = (file, baseline) => fs.writeFileSync(file, JSON.stringify(baseline, null, 2));

// 1 ---------------------------------------------------------------------------------------------------------------------------

test("1. a baselined site passes — and one byte changed on its line is a raw-temp finding AND a stale entry", (t) => {
  const { repo, file } = fixture(t);
  assert.deepEqual(found(guard(repo).text), [`${A}:3 — raw-temp`], "control: without --baseline the site is a finding, as today");
  const clean = withBaseline(repo, file);
  assert.equal(clean.code, 0, clean.text);
  write(repo, A, lines(SOURCE.map((line) => line.replace('"x-"', '"y-"'))));
  const changed = withBaseline(repo, file);
  assert.equal(changed.code, 1);
  assert.deepEqual(found(changed.text), [`${A}:3 — baseline`, `${A}:3 — raw-temp`]);
});

// 2 ---------------------------------------------------------------------------------------------------------------------------

test("2. a new site is a finding; remove it and the run is clean", (t) => {
  const { repo, file } = fixture(t, { source: [...SOURCE, "", "", L7] });
  const result = withBaseline(repo, file);
  assert.equal(result.code, 1);
  assert.deepEqual(found(result.text), [`${A}:7 — raw-temp`]);
  write(repo, A, lines(SOURCE));
  assert.equal(withBaseline(repo, file).code, 0);
});

// 3 ---------------------------------------------------------------------------------------------------------------------------

test("3. a stale entry is a finding, reconciled over the whole baseline: a removed line, a deleted file, hits dropped to zero, a file never read", (t) => {
  const stale = (result, at) => {
    assert.equal(result.code, 1, result.text);
    assert.ok(found(result.text).includes(at), result.text);
    assert.match(result.text, /entry has no line/);
  };
  // line 3 removed while another, different site stays in the visited file
  const removed = fixture(t, { source: ["import fs from 'node:fs';", "import os from 'node:os';", "console.log(1);", "", "", L7] });
  const first = withBaseline(removed.repo, removed.file);
  stale(first, `${A}:3 — baseline`);
  assert.ok(found(first.text).includes(`${A}:6 — raw-temp`), "the new site is its own finding");
  // the whole file deleted, the baseline unchanged
  const deleted = fixture(t, { source: null });
  stale(withBaseline(deleted.repo, deleted.file), `${A}:3 — baseline`);
  // the file's only hit rewritten to a non-temp line: hits drop to zero
  const zero = fixture(t, { source: ["import fs from 'node:fs';", "console.log(fs);", "console.log(2);"] });
  stale(withBaseline(zero.repo, zero.file), `${A}:3 — baseline`);
  // an entry for a file discovery never reads
  const unread = fixture(t, { baseline: baselineOf({ entries: [entry(A, L3, 3), entry("src/test/notes.txt", L3, 9)] }), extra: { "src/test/notes.txt": `${L3}\n` } });
  stale(withBaseline(unread.repo, unread.file), "src/test/notes.txt:9 — baseline");
  // break-it: the entry removed from the baseline
  const gone = fixture(t, { source: ["console.log(3);"], baseline: baselineOf({ entries: [] }) });
  assert.equal(withBaseline(gone.repo, gone.file).code, 0);
});

// 4 ---------------------------------------------------------------------------------------------------------------------------

test("4. the baseline is a multiset: a copy of a baselined line is a finding; two entries pass two lines; two entries for one line are stale", (t) => {
  const twice = [...SOURCE, "", "", "", "", "", L3];
  const { repo, file } = fixture(t, { source: twice });
  const result = withBaseline(repo, file);
  assert.equal(result.code, 1);
  assert.deepEqual(found(result.text), [`${A}:10 — raw-temp`], "one entry covers the first occurrence only");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 3), entry(A, L3, 10)] }));
  assert.equal(withBaseline(repo, file).code, 0, "two entries, two lines");
  write(repo, A, lines(SOURCE));
  const surplus = withBaseline(repo, file);
  assert.equal(surplus.code, 1);
  assert.deepEqual(found(surplus.text), [`${A}:10 — baseline`], "two entries, one line: the second is stale");
});

// 5 ---------------------------------------------------------------------------------------------------------------------------

test("5. a moved line keeps its entry: lines inserted above, a re-indent and CRLF endings; a changed character does not", (t) => {
  const { repo, file } = fixture(t);
  write(repo, A, lines([...Array.from({ length: 10 }, (_, index) => `// filler ${index}`), ...SOURCE]));
  assert.equal(withBaseline(repo, file).code, 0, "ten lines above: the hint is only a hint");
  write(repo, A, lines(SOURCE.map((line) => (line === L3 ? `      ${L3}   ` : line))));
  assert.equal(withBaseline(repo, file).code, 0, "re-indented: the hash is of the trimmed line");
  write(repo, A, SOURCE.join("\r\n") + "\r\n");
  assert.equal(withBaseline(repo, file).code, 0, "another line ending");
  write(repo, A, lines(SOURCE.map((line) => line.replace("x-", "x_"))));
  assert.equal(withBaseline(repo, file).code, 1, "a changed character is a different site");
});

// 6 ---------------------------------------------------------------------------------------------------------------------------

test("6. a site outside a proven runner: an entry under no scope, a proof file absent, a proof without the marker for that root", (t) => {
  const outside = fixture(t, { baseline: baselineOf({ entries: [entry(A, L3, 3), entry("scripts/x.mjs", L3, 1)] }), extra: { "scripts/x.mjs": `${L3}\n` } });
  const first = withBaseline(outside.repo, outside.file);
  assert.equal(first.code, 1);
  assert.deepEqual(found(first.text), ["scripts/x.mjs:1 — baseline", "scripts/x.mjs:1 — raw-temp"], "outside every scope: the entry clears nothing");
  assert.match(first.text, /outside every scope/);
  const absent = fixture(t, { proof: null });
  const second = withBaseline(absent.repo, absent.file);
  assert.equal(second.code, 1);
  assert.match(second.text, /proof missing/);
  const bare = fixture(t, { proof: "export {};\n" });
  assert.match(withBaseline(bare.repo, bare.file).text, /proof missing/, "a proof without the marker");
  const other = fixture(t, { proof: `// ${MARK}src/other/\n` });
  assert.match(withBaseline(other.repo, other.file).text, /proof missing/, "the marker names another root");
  write(bare.repo, PROOF, PROOF_TEXT);
  assert.equal(withBaseline(bare.repo, bare.file).code, 0, "the marker added: clean");
});

// 7 ---------------------------------------------------------------------------------------------------------------------------

test("7. only raw-temp: another class in the file is one finding and applies nothing; a hash that matches a legacy-name line clears nothing", (t) => {
  const blind = `grep -i '^${"teststo" + "delete"}[-_]' list`;
  const legacy = `const name = "${"testsTo" + "Delete"}-myrepo-x";`;
  const { repo, file } = fixture(t, { baseline: baselineOf({ class: "owner-blind" }), extra: { "src/test/b.sh": `${blind}\n` } });
  const result = withBaseline(repo, file);
  assert.equal(result.code, 1);
  assert.equal(found(result.text).filter((line) => line.endsWith(" — baseline")).length, 1, "ONE baseline finding");
  assert.ok(found(result.text).includes(`${A}:3 — raw-temp`), "nothing was applied");
  assert.ok(found(result.text).includes("src/test/b.sh:1 — owner-blind"), "an owner-blind line is still owner-blind");
  const kept = fixture(t, { source: ["import fs from 'node:fs';", legacy], baseline: baselineOf({ entries: [entry(A, legacy, 2)] }) });
  const other = withBaseline(kept.repo, kept.file);
  assert.ok(found(other.text).includes(`${A}:2 — legacy-name`), other.text);
});

// 8 ---------------------------------------------------------------------------------------------------------------------------

test("8. read only when named: the file in the tree, no --baseline, is today's run", (t) => {
  const { repo } = fixture(t);
  const bare = fixture(t, { baseline: null });
  const before = guard(repo);
  const today = guard(bare.repo);
  assert.equal(before.code, 1);
  assert.deepEqual(found(before.text), found(today.text), "the same findings with and without the file beside the tree");
  assert.equal(scanRepository({ repo, profile: "node" }).findings.length, 1);
});

// 9 ---------------------------------------------------------------------------------------------------------------------------

test("9. a malformed baseline is ONE baseline finding at its line 1 naming the field, with the cure; nothing applies; only an unreadable path is exit 2", (t) => {
  const good = baselineOf();
  const cases = [
    [JSON.stringify({ ...good, entries: undefined }), /entries/],
    [JSON.stringify(baselineOf({ entries: [{ ...entry(A, L3, 3), sha256: sha(L3).slice(1) }] })), /sha256/],
    [JSON.stringify(baselineOf({ entries: [entry("src\\test\\a.test.mjs", L3, 3)] })), /file/],
    [JSON.stringify(baselineOf({ scopes: [{ root: "src/test", proof: PROOF }] })), /root/],
    [JSON.stringify(baselineOf({ scopes: [{ root: ROOT, proof: "other/proof.mjs" }] })), /proof/],
    ["{ not json", /not JSON/],
  ];
  for (const [text, field] of cases) {
    const { repo, file } = fixture(t, { baseline: text });
    const result = withBaseline(repo, file);
    assert.equal(result.code, 1, result.text);
    const list = found(result.text);
    assert.equal(list.filter((line) => line.endsWith(" — baseline")).length, 1, result.text);
    assert.ok(list.includes("baseline.json:1 — baseline"), result.text);
    assert.match(result.text, new RegExp(`baseline\\.json:1 — baseline — .*${field.source}`));
    assert.ok(list.includes(`${A}:3 — raw-temp`), "no entry applied: the site stays a finding");
    assert.match(result.text, /\n {2}baseline: Remove the stale/, "the cure is printed");
  }
  const { repo } = fixture(t);
  const unreadable = withBaseline(repo, path.join(repo, "absent.json"));
  assert.equal(unreadable.code, 2, unreadable.text);
});

// 10 --------------------------------------------------------------------------------------------------------------------------

test("10. --print-baseline prints valid JSON for every raw-temp finding, empty scopes, and writes nothing", (t) => {
  const { repo } = fixture(t, { source: [...SOURCE, "", "", L7, L3], baseline: null });
  const snapshot = () => git(repo, "ls-files", "--cached", "--others").split("\n").sort().map((name) => `${name}:${fs.readFileSync(path.join(repo, name), "utf8")}`);
  const before = snapshot();
  const result = guard(repo, ["--print-baseline"]);
  assert.equal(result.code, 0, result.text);
  assert.deepEqual(snapshot(), before, "no file written or changed");
  assert.deepEqual(git(repo, "ls-files", "--cached", "--others").split("\n").sort(), [A, PROOF], "no new file");
  const printed = JSON.parse(result.out);
  assert.equal(printed.class, "raw-temp");
  assert.deepEqual(printed.scopes, []);
  assert.deepEqual(printed.entries, [entry(A, L3, 3), entry(A, L7, 7), entry(A, L3, 8)]);
});

// 11 --------------------------------------------------------------------------------------------------------------------------

/** A repository with `baseline` committed as `raw-temp-baseline.json`; the working copy is changed per case. */
function committed(t, baseline = baselineOf()) {
  const repo = tree(t, { "raw-temp-baseline.json": JSON.stringify(baseline, null, 2) });
  commit(repo, "base");
  return { repo, file: path.join(repo, "raw-temp-baseline.json") };
}

const shrinks = (repo, file, extra = [], base = "HEAD") => {
  const all = [];
  const code = main(["--repo", repo, "--baseline-shrinks", file, "--base", base, ...extra], { out: (line) => all.push(line), err: (line) => all.push(line) });
  return { code, text: all.join("\n") };
};

test("11. --baseline-shrinks: the same file, a removed entry, a changed hint and an absent file pass; a new key and a raised count fail naming it", (t) => {
  const { repo, file } = committed(t, baselineOf({ entries: [entry(A, L3, 3), entry(A, L7, 7)] }));
  assert.equal(shrinks(repo, file).code, 0, "the same file");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 3)] }));
  assert.equal(shrinks(repo, file).code, 0, "one entry removed");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 30), entry(A, L7, 70)] }));
  assert.equal(shrinks(repo, file).code, 0, "hints changed");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 3), entry(A, L7, 7), entry(A, "const third = 1;", 9)] }));
  const key = shrinks(repo, file);
  assert.equal(key.code, 1);
  assert.match(key.text, /new key/);
  assert.ok(key.text.includes(sha("const third = 1;")), "it names the key");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 3), entry(A, L3, 4), entry(A, L7, 7)] }));
  const count = shrinks(repo, file);
  assert.equal(count.code, 1);
  assert.match(count.text, /raised count/);
  fs.rmSync(file);
  assert.equal(shrinks(repo, file).code, 0, "absent now: drained");
});

test("11. --baseline-shrinks: a base ref that is not fetched is exit 2 with the sentence that names the fetch", (t) => {
  const origin = tree(t, { x: "1\n" });
  commit(origin, "one");
  git(origin, "checkout", "-q", "-b", "work");
  commit(origin, "two");
  const clone = ownedDir(t, "baseline clone");
  git(clone, "clone", "-q", "--branch", "work", "--single-branch", `file://${origin}`, clone);
  const file = path.join(clone, "raw-temp-baseline.json");
  writeBaseline(file, baselineOf());
  const result = shrinks(clone, file, [], "origin/main");
  assert.equal(result.code, 2, result.text);
  assert.match(result.text, /git fetch origin <base-branch> --depth=1/);
});

// 12 --------------------------------------------------------------------------------------------------------------------------

test("12. this repository is clean with no baseline, and ships none", () => {
  assert.equal(guard(root).code, 0, "the default run over this repository is clean");
  const shipped = git(root, "ls-files").split("\n").filter((name) => /baseline/i.test(path.basename(name)) && name.endsWith(".json"));
  assert.deepEqual(shipped, [], "no baseline file is committed here");
});

// 13 --------------------------------------------------------------------------------------------------------------------------

test("13. scope widening is refused: a new scope, a wider root, a changed proof; a removed or narrowed scope passes", (t) => {
  const unit = { root: "src/test/unit/", proof: "src/test/unit/run.test.mjs" };
  const { repo, file } = committed(t, baselineOf({ scopes: [unit] }));
  const run = (scopes) => {
    writeBaseline(file, baselineOf({ scopes }));
    return shrinks(repo, file);
  };
  assert.equal(run([unit]).code, 0, "the same scope");
  const added = run([unit, { root: "scripts/", proof: "scripts/run.test.mjs" }]);
  assert.equal(added.code, 1);
  assert.match(added.text, /new scope.*scripts\//);
  const wider = run([{ root: ROOT, proof: unit.proof }]);
  assert.equal(wider.code, 1);
  assert.match(wider.text, /wider/);
  const proof = run([{ root: unit.root, proof: "src/test/unit/other.test.mjs" }]);
  assert.equal(proof.code, 1);
  assert.match(proof.text, /changed proof/);
  assert.equal(run([]).code, 0, "a scope removed");
  assert.equal(run([{ root: "src/test/unit/deep/", proof: "src/test/unit/deep/run.test.mjs" }]).code, 0, "narrowed to a sub-root");
});

// 14 --------------------------------------------------------------------------------------------------------------------------

test("14. creation: only the first, only with --allow-create, never after the path had history; a shallow clone fails closed", (t) => {
  const never = tree(t, { x: "1\n" });
  commit(never, "base");
  const file = path.join(never, "raw-temp-baseline.json");
  writeBaseline(file, baselineOf());
  const plain = shrinks(never, file);
  assert.equal(plain.code, 1, "a creation without --allow-create");
  assert.match(plain.text, /creation.*--allow-create/);
  assert.equal(shrinks(never, file, ["--allow-create"]).code, 0, "never committed: the one creation");
  commit(never, "the creation PR");
  const above = shrinks(never, file, ["--allow-create"], "HEAD~1");
  assert.equal(above.code, 0, `the creation committed above the base is still the creation: ${above.text}`);
  const again = committed(t, baselineOf());
  git(again.repo, "rm", "-q", "raw-temp-baseline.json");
  commit(again.repo, "drained");
  writeBaseline(again.file, baselineOf());
  const recreated = shrinks(again.repo, again.file, ["--allow-create"]);
  assert.equal(recreated.code, 1, recreated.text);
  assert.match(recreated.text, /re-creation/);
  const origin = tree(t, { x: "1\n" });
  commit(origin, "base");
  commit(origin, "second");
  const clone = ownedDir(t, "baseline shallow");
  git(clone, "clone", "-q", "--depth=1", `file://${origin}`, clone);
  const shallow = path.join(clone, "raw-temp-baseline.json");
  writeBaseline(shallow, baselineOf());
  const closed = shrinks(clone, shallow, ["--allow-create"]);
  assert.equal(closed.code, 2, closed.text);
  assert.match(closed.text, /git fetch --unshallow/);
});

// 15 — the proof marker is no legacy name ------------------------------------------------------------------------------------

test("15. the proof marker in a consumer's test is not a legacy-name finding", (t) => {
  const { repo } = fixture(t, { baseline: null, proof: `export {}; /* ${MARK}${ROOT} */\n` });
  const result = guard(repo);
  assert.equal(result.code, 1, "the raw-temp site of a.test.mjs is still a finding");
  assert.deepEqual(found(result.text), [`${A}:3 — raw-temp`], result.text);
});
