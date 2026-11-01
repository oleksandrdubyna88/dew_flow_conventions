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
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { git } from "./lib/git.mjs";
import { ownedDir } from "./lib/owned.mjs";
import { createApplier, locateBaseline, printBaseline } from "./lib/raw-temp-baseline.mjs";
import { main, scanRepository } from "./leftovers-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MK = "mk" + "dtempSync";
const TD = "tmp" + "dir";
const MARK = "testsTo" + "Delete-baseline-proof: ";
const FILE = "raw-temp-baseline.json"; // the ONE path of a baseline: the repository root, never a symlink
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
  const file = path.join(repo, FILE);
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

const withBaseline = (repo, extra = []) => guard(repo, ["--baseline", ...extra]);
const found = (text) => [...text.matchAll(/^\s+(\S+:\d+) — (\S+)/gm)].map((match) => `${match[1]} — ${match[2]}`);
const write = (repo, name, text) => fs.writeFileSync(path.join(repo, name), text);
const writeBaseline = (file, baseline) => fs.writeFileSync(file, JSON.stringify(baseline, null, 2));

// 1 ---------------------------------------------------------------------------------------------------------------------------

test("1. a baselined site passes — and one byte changed on its line is a raw-temp finding AND a stale entry", (t) => {
  const { repo, file } = fixture(t);
  assert.deepEqual(found(guard(repo).text), [`${A}:3 — raw-temp`], "control: without --baseline the site is a finding, as today");
  const clean = withBaseline(repo);
  assert.equal(clean.code, 0, clean.text);
  write(repo, A, lines(SOURCE.map((line) => line.replace('"x-"', '"y-"'))));
  const changed = withBaseline(repo);
  assert.equal(changed.code, 1);
  assert.deepEqual(found(changed.text), [`${A}:3 — baseline`, `${A}:3 — raw-temp`]);
});

// 2 ---------------------------------------------------------------------------------------------------------------------------

test("2. a new site is a finding; remove it and the run is clean", (t) => {
  const { repo, file } = fixture(t, { source: [...SOURCE, "", "", L7] });
  const result = withBaseline(repo);
  assert.equal(result.code, 1);
  assert.deepEqual(found(result.text), [`${A}:7 — raw-temp`]);
  write(repo, A, lines(SOURCE));
  assert.equal(withBaseline(repo).code, 0);
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
  const first = withBaseline(removed.repo);
  stale(first, `${A}:3 — baseline`);
  assert.ok(found(first.text).includes(`${A}:6 — raw-temp`), "the new site is its own finding");
  // the whole file deleted, the baseline unchanged
  const deleted = fixture(t, { source: null });
  stale(withBaseline(deleted.repo), `${A}:3 — baseline`);
  // the file's only hit rewritten to a non-temp line: hits drop to zero
  const zero = fixture(t, { source: ["import fs from 'node:fs';", "console.log(fs);", "console.log(2);"] });
  stale(withBaseline(zero.repo), `${A}:3 — baseline`);
  // an entry for a file discovery never reads
  const unread = fixture(t, { baseline: baselineOf({ entries: [entry(A, L3, 3), entry("src/test/notes.txt", L3, 9)] }), extra: { "src/test/notes.txt": `${L3}\n` } });
  stale(withBaseline(unread.repo), "src/test/notes.txt:9 — baseline");
  // break-it: the entry removed from the baseline
  const gone = fixture(t, { source: ["console.log(3);"], baseline: baselineOf({ entries: [] }) });
  assert.equal(withBaseline(gone.repo).code, 0);
});

// 4 ---------------------------------------------------------------------------------------------------------------------------

test("4. the baseline is a multiset: a copy of a baselined line is a finding; two entries pass two lines; two entries for one line are stale", (t) => {
  const twice = [...SOURCE, "", "", "", "", "", L3];
  const { repo, file } = fixture(t, { source: twice });
  const result = withBaseline(repo);
  assert.equal(result.code, 1);
  assert.deepEqual(found(result.text), [`${A}:10 — raw-temp`], "one entry covers the first occurrence only");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 3), entry(A, L3, 10)] }));
  assert.equal(withBaseline(repo).code, 0, "two entries, two lines");
  write(repo, A, lines(SOURCE));
  const surplus = withBaseline(repo);
  assert.equal(surplus.code, 1);
  assert.deepEqual(found(surplus.text), [`${A}:10 — baseline`], "two entries, one line: the second is stale");
});

// 5 ---------------------------------------------------------------------------------------------------------------------------

test("5. a moved line keeps its entry: lines inserted above, a re-indent and CRLF endings; a changed character does not", (t) => {
  const { repo, file } = fixture(t);
  write(repo, A, lines([...Array.from({ length: 10 }, (_, index) => `// filler ${index}`), ...SOURCE]));
  assert.equal(withBaseline(repo).code, 0, "ten lines above: the hint is only a hint");
  write(repo, A, lines(SOURCE.map((line) => (line === L3 ? `      ${L3}   ` : line))));
  assert.equal(withBaseline(repo).code, 0, "re-indented: the hash is of the trimmed line");
  write(repo, A, SOURCE.join("\r\n") + "\r\n");
  assert.equal(withBaseline(repo).code, 0, "another line ending");
  write(repo, A, lines(SOURCE.map((line) => line.replace("x-", "x_"))));
  assert.equal(withBaseline(repo).code, 1, "a changed character is a different site");
});

// 6 ---------------------------------------------------------------------------------------------------------------------------

test("6. a site outside a proven runner: an entry under no scope, a proof file absent, a proof without the marker for that root", (t) => {
  const outside = fixture(t, { baseline: baselineOf({ entries: [entry(A, L3, 3), entry("scripts/x.mjs", L3, 1)] }), extra: { "scripts/x.mjs": `${L3}\n` } });
  const first = withBaseline(outside.repo);
  assert.equal(first.code, 1);
  assert.deepEqual(found(first.text), ["scripts/x.mjs:1 — baseline", "scripts/x.mjs:1 — raw-temp"], "outside every scope: the entry clears nothing");
  assert.match(first.text, /outside every scope/);
  const absent = fixture(t, { proof: null });
  const second = withBaseline(absent.repo);
  assert.equal(second.code, 1);
  assert.match(second.text, /proof missing/);
  const bare = fixture(t, { proof: "export {};\n" });
  assert.match(withBaseline(bare.repo).text, /proof missing/, "a proof without the marker");
  const other = fixture(t, { proof: `// ${MARK}src/other/\n` });
  assert.match(withBaseline(other.repo).text, /proof missing/, "the marker names another root");
  write(bare.repo, PROOF, PROOF_TEXT);
  assert.equal(withBaseline(bare.repo).code, 0, "the marker added: clean");
});

// 7 ---------------------------------------------------------------------------------------------------------------------------

test("7. only raw-temp: another class in the file is one finding and applies nothing; a hash that matches a legacy-name line clears nothing", (t) => {
  const blind = `grep -i '^${"teststo" + "delete"}[-_]' list`;
  const legacy = `const name = "${"testsTo" + "Delete"}-myrepo-x";`;
  const { repo, file } = fixture(t, { baseline: baselineOf({ class: "owner-blind" }), extra: { "src/test/b.sh": `${blind}\n` } });
  const result = withBaseline(repo);
  assert.equal(result.code, 1);
  assert.equal(found(result.text).filter((line) => line.endsWith(" — baseline")).length, 1, "ONE baseline finding");
  assert.ok(found(result.text).includes(`${A}:3 — raw-temp`), "nothing was applied");
  assert.ok(found(result.text).includes("src/test/b.sh:1 — owner-blind"), "an owner-blind line is still owner-blind");
  const kept = fixture(t, { source: ["import fs from 'node:fs';", legacy], baseline: baselineOf({ entries: [entry(A, legacy, 2)] }) });
  const other = withBaseline(kept.repo);
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
    const result = withBaseline(repo);
    assert.equal(result.code, 1, result.text);
    const list = found(result.text);
    assert.equal(list.filter((line) => line.endsWith(" — baseline")).length, 1, result.text);
    assert.ok(list.includes("raw-temp-baseline.json:1 — baseline"), result.text);
    assert.match(result.text, new RegExp(`raw-temp-baseline\\.json:1 — baseline — .*${field.source}`));
    assert.ok(list.includes(`${A}:3 — raw-temp`), "no entry applied: the site stays a finding");
    assert.match(result.text, /\n {2}baseline: Remove the stale/, "the cure is printed");
  }
  const { repo } = fixture(t);
  fs.rmSync(path.join(repo, FILE));
  const unreadable = withBaseline(repo);
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
  return { repo, file: path.join(repo, FILE) };
}

const shrinks = (repo, extra = [], base = "HEAD") => {
  const all = [];
  const code = main(["--repo", repo, "--baseline-shrinks", "--base", base, ...extra], { out: (line) => all.push(line), err: (line) => all.push(line) });
  return { code, text: all.join("\n") };
};

test("11. --baseline-shrinks: the same file, a removed entry, a changed hint and an absent file pass; a new key and a raised count fail naming it", (t) => {
  const { repo, file } = committed(t, baselineOf({ entries: [entry(A, L3, 3), entry(A, L7, 7)] }));
  assert.equal(shrinks(repo).code, 0, "the same file");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 3)] }));
  assert.equal(shrinks(repo).code, 0, "one entry removed");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 30), entry(A, L7, 70)] }));
  assert.equal(shrinks(repo).code, 0, "hints changed");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 3), entry(A, L7, 7), entry(A, "const third = 1;", 9)] }));
  const key = shrinks(repo);
  assert.equal(key.code, 1);
  assert.match(key.text, /new key/);
  assert.ok(key.text.includes(sha("const third = 1;")), "it names the key");
  writeBaseline(file, baselineOf({ entries: [entry(A, L3, 3), entry(A, L3, 4), entry(A, L7, 7)] }));
  const count = shrinks(repo);
  assert.equal(count.code, 1);
  assert.match(count.text, /raised count/);
  fs.rmSync(file);
  assert.equal(shrinks(repo).code, 0, "absent now: drained");
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
  const result = shrinks(clone, [], "origin/main");
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
    return shrinks(repo);
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
  const sibling = run([{ root: "src/testing/", proof: "src/testing/run.test.mjs" }]);
  assert.equal(sibling.code, 1, "`src/testing/` is not inside `src/test/`: segments, not characters");
  assert.match(sibling.text, /new scope/);
  assert.equal(run([{ root: "src/test/unit/deep/", proof: unit.proof }]).code, 1, "narrowed, but the kept proof lies outside the new root");
});

test("13b. a narrowed scope keeps the proof of the base scope that holds it, and that proof lies under the new root [Opus M1, code gate 12]", (t) => {
  const deep = { root: "src/test/", proof: "src/test/a/run.test.mjs" };
  const { repo, file } = committed(t, baselineOf({ scopes: [deep] }));
  const run = (scopes) => {
    writeBaseline(file, baselineOf({ scopes }));
    return shrinks(repo);
  };
  assert.equal(run([{ root: "src/test/a/", proof: deep.proof }]).code, 0, "narrowed, the base proof kept and under the new root");
  const fake = run([{ root: "src/test/a/", proof: "src/test/a/fake.test.mjs" }]);
  assert.equal(fake.code, 1, fake.text);
  assert.match(fake.text, /narrowed/);
  assert.equal(run([{ root: "src/test/b/", proof: deep.proof }]).code, 1, "a sub-root the kept proof is not under");
  for (const root of ["src//test/", "./src/test/", "src/./test/"]) {
    const bad = run([{ root, proof: `${root}run.test.mjs` }]);
    assert.equal(bad.code, 1, `${root}: ${bad.text}`);
    assert.match(bad.text, /not a baseline/, "an unnormalised root is malformed [code gate 0]");
  }
});

// 14 --------------------------------------------------------------------------------------------------------------------------

test("14. creation: only the first, only with --allow-create, never after the path had history; a shallow clone fails closed", (t) => {
  const never = tree(t, { x: "1\n" });
  commit(never, "base");
  const file = path.join(never, "raw-temp-baseline.json");
  writeBaseline(file, baselineOf());
  const plain = shrinks(never);
  assert.equal(plain.code, 1, "a creation without --allow-create");
  assert.match(plain.text, /creation.*--allow-create/);
  assert.equal(shrinks(never, ["--allow-create"]).code, 0, "never committed: the one creation");
  commit(never, "the creation PR");
  const above = shrinks(never, ["--allow-create"], "HEAD~1");
  assert.equal(above.code, 0, `the creation committed above the base is still the creation: ${above.text}`);
  const again = committed(t, baselineOf());
  git(again.repo, "rm", "-q", "raw-temp-baseline.json");
  commit(again.repo, "drained");
  writeBaseline(again.file, baselineOf());
  const recreated = shrinks(again.repo, ["--allow-create"]);
  assert.equal(recreated.code, 1, recreated.text);
  assert.match(recreated.text, /re-creation/);
  const other = tree(t, { x: "1\n" });
  commit(other, "base");
  git(other, "checkout", "-q", "-b", "elsewhere");
  writeBaseline(path.join(other, FILE), baselineOf());
  commit(other, "a branch that holds the path");
  git(other, "checkout", "-q", "main");
  writeBaseline(path.join(other, FILE), baselineOf());
  const elsewhere = shrinks(other, ["--allow-create"]);
  assert.equal(elsewhere.code, 0, `history on another ref changes nothing — local and CI must agree [Opus m1]: ${elsewhere.text}`);
  const origin = tree(t, { x: "1\n" });
  commit(origin, "base");
  commit(origin, "second");
  const clone = ownedDir(t, "baseline shallow");
  git(clone, "clone", "-q", "--depth=1", `file://${origin}`, clone);
  const shallow = path.join(clone, "raw-temp-baseline.json");
  writeBaseline(shallow, baselineOf());
  const closed = shrinks(clone, ["--allow-create"]);
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

// 15b — the proof marker is exact (Opus m3) --------------------------------------------------------------------------------------

test("15b. the marker is matched in its exact case and needs a folder path after it: an image tag spelled like it stays a legacy-name finding", (t) => {
  const lower = "teststo" + "delete-baseline-proof:latest";
  const bare = MARK + "latest";
  for (const [text, why] of [[lower, "lower case, no space, no folder"], [bare, "exact case but no folder path"], [`${lower.replace(":latest", ":")} ${ROOT}`, "a folder path but the wrong case"]]) {
    const { repo } = fixture(t, { baseline: null, proof: `export const tag = "${text}";\n` });
    const result = guard(repo);
    assert.ok(found(result.text).includes(`${PROOF}:1 — legacy-name`), `${why}: ${result.text}`);
  }
});

// 16 — one fixed path, never a symlink (Opus B1, M3) ---------------------------------------------------------------------------

test("16. the baseline is the file `raw-temp-baseline.json` at the repository root: a symlink is a baseline finding in the scan and exit 2 in the shrink check; a folder is exit 2", (t) => {
  const { repo } = fixture(t, { baseline: null });
  fs.writeFileSync(path.join(repo, "elsewhere.json"), JSON.stringify(baselineOf(), null, 2));
  fs.symlinkSync("elsewhere.json", path.join(repo, FILE));
  const scan = withBaseline(repo);
  assert.equal(scan.code, 1, scan.text);
  assert.ok(found(scan.text).includes(`${FILE}:1 — baseline`), scan.text);
  assert.match(scan.text, /symlink/);
  assert.ok(found(scan.text).includes(`${A}:3 — raw-temp`), "nothing applied through the link");
  const shrink = shrinks(repo);
  assert.equal(shrink.code, 2, shrink.text);
  assert.match(shrink.text, /symlink/);
  const grown = committed(t, baselineOf());
  const real = path.join(grown.repo, "grown.json");
  fs.writeFileSync(real, JSON.stringify(baselineOf({ entries: [entry(A, L3, 3), entry(A, L7, 7)] })));
  fs.rmSync(grown.file);
  fs.symlinkSync("grown.json", grown.file);
  assert.equal(shrinks(grown.repo).code, 2, "a link that grew the baseline is refused, not a creation");
  const dangling = fixture(t, { baseline: null });
  fs.symlinkSync("absent.json", path.join(dangling.repo, FILE));
  assert.equal(shrinks(dangling.repo).code, 2, "a dangling link is a refusal, not 'absent now'");
  const folder = fixture(t, { baseline: null });
  fs.mkdirSync(path.join(folder.repo, FILE));
  assert.equal(withBaseline(folder.repo).code, 2, "a folder where the file belongs: exit 2, no stack");
  assert.equal(shrinks(folder.repo).code, 2);
});

test("16b. the shrink check judges only the root of the git repository; a folder inside it, or a path outside it, is exit 2 [Opus m2]", (t) => {
  const { repo } = committed(t, baselineOf());
  fs.mkdirSync(path.join(repo, "sub"));
  writeBaseline(path.join(repo, "sub", FILE), baselineOf());
  const inner = shrinks(path.join(repo, "sub"));
  assert.equal(inner.code, 2, inner.text);
  assert.match(inner.text, /root of the git repository/);
});

// 17 — the proof marker, strictly (code gate 2, 3) ------------------------------------------------------------------------------

test("17. the proof marker is the marker, exactly the scope root, then only whitespace or a comment closer to the end of the line", (t) => {
  const accepted = [`// ${MARK}${ROOT}`, `// ${MARK}${ROOT}   `, `/* ${MARK}${ROOT} */`, `/* ${MARK}${ROOT}*/`, `<!-- ${MARK}${ROOT} -->`, `# ${MARK}${ROOT}`];
  for (const line of accepted) {
    const { repo } = fixture(t, { proof: `${line}\nexport {};\n` });
    assert.equal(withBaseline(repo).code, 0, `accepted: ${line}`);
  }
  const refused = [`// ${MARK}${ROOT} -- verified`, `// ${MARK}${ROOT} # x`, `// ${MARK}src/other/`, `// ${MARK}${ROOT}x/`, `// ${MARK}`, `// ${MARK}${ROOT} */ trailing`];
  for (const line of refused) {
    const { repo } = fixture(t, { proof: `${line}\nexport {};\n` });
    const result = withBaseline(repo);
    assert.equal(result.code, 1, `refused: ${line}`);
    assert.match(result.text, /proof missing/, line);
  }
});

// 18 — the proof is a test file this scan discovered, not the baseline (code gate 11, Opus m5) -----------------------------------

test("18. the proof must be a test file the guard discovered in this scan: an undiscovered file or a script that is no test is `proof missing`", (t) => {
  const marked = `// ${MARK}${ROOT}\n`;
  const hidden = fixture(t, { baseline: baselineOf({ scopes: [{ root: ROOT, proof: "src/test/run-folder.mjs" }] }), proof: null, extra: { "src/test/run-folder.mjs": marked } });
  const first = withBaseline(hidden.repo);
  assert.equal(first.code, 1, "present in the tree but never discovered by the scan");
  assert.match(first.text, /proof missing/);
  const script = fixture(t, { baseline: baselineOf({ entries: [entry("scripts/x.mjs", L3, 1)], scopes: [{ root: "scripts/", proof: "scripts/setup.mjs" }] }), proof: null, source: null, extra: { "scripts/x.mjs": `${L3}\n`, "scripts/setup.mjs": `// ${MARK}scripts/\n` } });
  const second = withBaseline(script.repo);
  assert.equal(second.code, 1, "discovered under a `scripts/` root, but no test file");
  assert.match(second.text, /proof missing/);
  const tests = fixture(t, { baseline: baselineOf({ entries: [entry("test/x.mjs", L3, 1)], scopes: [{ root: "test/", proof: "test/setup.mjs" }] }), proof: null, source: null, extra: { "test/x.mjs": `${L3}\n`, "test/setup.mjs": `// ${MARK}test/\n` } });
  assert.equal(withBaseline(tests.repo).code, 0, "a file under `test/` is a test file");
});

// 19 — print-baseline reports a missing line (code gate 5) ---------------------------------------------------------------------

test("19. --print-baseline does not crash on a finding whose line is gone: it reports it and exits 2", (t) => {
  const { repo } = fixture(t, { baseline: null });
  const listed = printBaseline([{ file: A, line: 3, cls: "raw-temp" }, { file: A, line: 99, cls: "raw-temp" }], repo);
  assert.deepEqual(listed.baseline.entries, [entry(A, L3, 3)]);
  assert.deepEqual(listed.missing, [`${A}:99`]);
});

// 20 — a git failure is never an absence (code gate 6) -------------------------------------------------------------------------

/** A `git` ahead on PATH that fails every call naming `word`, else is the real one. */
function failingGit(t, word) {
  const dir = ownedDir(t, "baseline fake git");
  const real = execFileSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).trim();
  const script = `#!/bin/sh\nfor a in "$@"; do if [ "$a" = "${word}" ]; then echo "boom: ${word} failed" >&2; exit 3; fi; done\nexec ${real} "$@"\n`;
  fs.writeFileSync(path.join(dir, "git"), script, { mode: 0o755 });
  const before = process.env.PATH;
  process.env.PATH = `${dir}${path.delimiter}${before}`;
  t.after(() => { process.env.PATH = before; });
}

test("20. a git failure is exit 2 with its sentence, never 'absent at base' and never 'no history'", (t) => {
  const { repo } = committed(t, baselineOf());
  failingGit(t, "ls-tree");
  const absent = shrinks(repo);
  assert.equal(absent.code, 2, absent.text);
  assert.match(absent.text, /boom/);
  assert.doesNotMatch(absent.text, /a creation/);
});

test("20b. a git failure while asking for the path's history is exit 2, not a creation that never had history", (t) => {
  const never = tree(t, { x: "1\n" });
  commit(never, "base");
  writeBaseline(path.join(never, FILE), baselineOf());
  failingGit(t, "log");
  const result = shrinks(never, ["--allow-create"]);
  assert.equal(result.code, 2, result.text);
  assert.match(result.text, /boom/);
});

// 21 — the untested edges (Opus) -----------------------------------------------------------------------------------------------

test("21. a base ref that starts with a dash is exit 2; a malformed base copy is 2; a malformed working copy is 1", (t) => {
  const { repo, file } = committed(t, baselineOf());
  assert.equal(shrinks(repo, [], "-x").code, 2, "an option-looking base ref");
  fs.writeFileSync(file, "{ not json");
  const working = shrinks(repo);
  assert.equal(working.code, 1, working.text);
  assert.match(working.text, /not a baseline/);
  const broken = committed(t, "{ also not json");
  writeBaseline(broken.file, baselineOf());
  const base = shrinks(broken.repo);
  assert.equal(base.code, 2, base.text);
  assert.match(base.text, /the copy at HEAD is not a baseline/);
});

test("21b. a line with a valid exemption uses no entry", (t) => {
  const exempt = `// ${"testsTo" + "Delete"}-exempt: raw-temp — the run folder owns this one`;
  const source = ["import fs from 'node:fs';", exempt, L3, "console.log(1);", L3];
  const { repo } = fixture(t, { source, baseline: baselineOf({ entries: [entry(A, L3, 5)] }) });
  const result = withBaseline(repo);
  assert.equal(result.code, 0, `the exempt copy passes by its comment and the plain copy by the entry: ${result.text}`);
});

test("21c. overlapping scopes: an entry belongs to the most specific root whatever the order of the list", (t) => {
  const wide = { root: "src/", proof: "src/wide.test.mjs" };
  const narrow = { root: ROOT, proof: PROOF };
  for (const scopes of [[wide, narrow], [narrow, wide]]) {
    const { repo } = fixture(t, { baseline: baselineOf({ scopes }), extra: { "src/wide.test.mjs": "export {};\n" } });
    const result = withBaseline(repo);
    assert.ok(found(result.text).includes(`${FILE}:1 — baseline`), "the wide scope's proof is missing, in either order");
    assert.ok(!found(result.text).includes(`${A}:3 — raw-temp`), "the entry under the proven narrow scope still passes");
    assert.ok(!found(result.text).includes(`${A}:3 — baseline`));
  }
});

test("21d. the argument errors: --baseline-shrinks needs --base; --base and --allow-create belong to it; --print-baseline excludes --baseline; --baseline takes no value", (t) => {
  const { repo } = fixture(t);
  for (const args of [["--baseline-shrinks"], ["--base", "HEAD"], ["--allow-create"], ["--print-baseline", "--baseline"], ["--baseline", "x.json"]]) {
    const result = guard(repo, args);
    assert.equal(result.code, 2, `${args.join(" ")}: ${result.text}`);
    assert.match(result.text, /usage:/);
  }
});

// 22 — the unused entries are indexed once (code gate 7, 13) -------------------------------------------------------------------

test("22. matching is linear: 40,000 entries are taken in well under a few seconds", (t) => {
  const { repo } = fixture(t);
  const entries = Array.from({ length: 40000 }, (_, index) => entry(A, `line ${index}`, index + 1));
  const applier = createApplier({ scopes: [{ root: ROOT, proof: PROOF }], entries }, repo, FILE, new Set([PROOF]));
  const started = performance.now();
  for (let index = 39999; index >= 0; index -= 1) assert.equal(applier.take(A, sha(`line ${index}`)), true);
  assert.equal(applier.finalFindings().length, 0);
  assert.ok(performance.now() - started < 3000, "a scan of every entry for every hit would take far longer");
});

// 22b — many entries under ONE key (code round 2 8, 9, 13) ----------------------------------------------------------------------

test("22b. matching is linear under ONE key too: 60,000 entries of one site are taken in well under a few seconds", (t) => {
  const { repo } = fixture(t);
  const entries = Array.from({ length: 60000 }, (_, index) => entry(A, L3, index + 1));
  const applier = createApplier({ scopes: [{ root: ROOT, proof: PROOF }], entries }, repo, FILE, new Set([PROOF]));
  const started = performance.now();
  for (let index = 0; index < 60000; index += 1) assert.equal(applier.take(A, sha(L3)), true);
  assert.equal(applier.take(A, sha(L3)), false, "one more hit than entries is not passed");
  assert.equal(applier.finalFindings().length, 0);
  assert.ok(performance.now() - started < 3000, "copying or shifting the list of one key for every hit would take far longer");
});

// 19b — a vanished file is reported, never a crash (code round 2 5) ----------------------------------------------------------------

test("19b. --print-baseline: a file that vanished or cannot be read is listed in `missing`, never a crash", (t) => {
  const { repo } = fixture(t, { baseline: null });
  fs.mkdirSync(path.join(repo, "src", "test", "dir.test.mjs"));
  const listed = printBaseline([{ file: "src/test/gone.test.mjs", line: 1, cls: "raw-temp" }, { file: "src/test/dir.test.mjs", line: 1, cls: "raw-temp" }, { file: A, line: 3, cls: "raw-temp" }], repo);
  assert.deepEqual(listed.baseline.entries, [entry(A, L3, 3)]);
  assert.deepEqual(listed.missing, ["src/test/gone.test.mjs:1", "src/test/dir.test.mjs:1"]);
});

// 23 — ONE loader of the working-tree file (code round 2 1) ------------------------------------------------------------------------

test("23. one loader finds the baseline file for the scan and the shrink check: absent, a file, a symlink, a folder, a folder that is not the git root", (t) => {
  const absent = fixture(t, { baseline: null });
  assert.deepEqual(locateBaseline(absent.repo), { file: path.join(absent.repo, FILE), absent: true });
  const plain = fixture(t);
  assert.deepEqual(locateBaseline(plain.repo), { file: path.join(plain.repo, FILE), absent: false });
  const link = fixture(t, { baseline: null });
  fs.writeFileSync(path.join(link.repo, "elsewhere.json"), "{}");
  fs.symlinkSync("elsewhere.json", path.join(link.repo, FILE));
  assert.equal(locateBaseline(link.repo).refusal?.kind, "symlink");
  const folder = fixture(t, { baseline: null });
  fs.mkdirSync(path.join(folder.repo, FILE));
  assert.equal(locateBaseline(folder.repo).refusal?.kind, "not-file");
  assert.equal(locateBaseline(plain.repo, { gitRoot: true }).refusal, undefined, "the git root passes");
  fs.mkdirSync(path.join(plain.repo, "sub"));
  assert.equal(locateBaseline(path.join(plain.repo, "sub"), { gitRoot: true }).refusal?.kind, "not-git-root");
  // each caller keeps its own outcome for the same refusal
  assert.equal(withBaseline(link.repo).code, 1, "the scan: a baseline finding");
  assert.equal(shrinks(link.repo).code, 2, "the shrink check: exit 2");
  assert.equal(withBaseline(folder.repo).code, 2);
  assert.equal(shrinks(folder.repo).code, 2);
});

// 21e — a value option followed by another option (code round 2 11) ---------------------------------------------------------------------

test("21e. a value option followed by another `--` option is a usage error that names the option", (t) => {
  const { repo } = fixture(t);
  for (const [args, name, next] of [[["--baseline-shrinks", "--base", "--allow-create"], "--base", "--allow-create"], [["--repo", "--baseline"], "--repo", "--baseline"], [["--token", "--profile", "node"], "--token", "--profile"]]) {
    const result = guard(repo, args);
    assert.equal(result.code, 2, `${args.join(" ")}: ${result.text}`);
    assert.match(result.text, new RegExp(`\`${name}\` needs a value.*\`${next}\``), args.join(" "));
  }
});
