#!/usr/bin/env node
/**
 * `lib/sweeper-scan.mjs`'s classifier (`classifyLine`) — S5a of the merged-core plan — and, in later stories, the
 * scan itself (`scanSweepers`) and its command line.
 *
 * Every line below that spells a sweeping pattern is BUILT from two pieces (`P` and `Q`), so this file holds no
 * line that the classifier it tests would call broad: the repository's own scan reads this file too.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { broadLines, classifyLine } from "./lib/sweeper-scan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const P = "teststo" + "delete"; // the prefix, lower case
const Q = "testsTo" + "Delete"; // the prefix, as the rule writes it

test("S5a 1 the three lines of the rule text on main at 2c96f83 are owner-blind", () => {
  const old = fs.readFileSync(path.join(here, "fixtures", "sweeper-scan", "rule-2c96f83.md"), "utf8");
  const lines = broadLines(old);
  assert.equal(lines.length, 3, `the old text has three broad lines, got ${JSON.stringify(lines)}`);
  assert.deepEqual(lines, [20, 35, 129]);
});

test("S5a 2 a prefix with nothing after it is broad, in a regex, a glob, a path and a filter", () => {
  const broad = [
    `grep -i '^${P}-'`,
    `grep -i '^${P}[-_]'`,
    `grep -iE "^(${P})[-_]x"`,
    `find "$T" -iname '${Q}-*'`,
    `Get-ChildItem $env:TEMP -Filter '${Q}-*'`,
    `Where-Object Name -like '${Q}*'`,
    `ls /tmp/${Q}-*`,
    `docker ps --filter name=${P}-`,
    `docker ps -a --filter "name=${Q}" --format '{{.Names}}'`,
    `docker volume ls --filter=name=${P}_`,
    `git for-each-ref refs/heads | grep -i '/${Q}-[^/]*$'`,
    `name.startsWith("${Q}-")`,
    `GLOB='${P}[-_]*'`,
    `find /tmp -regex '.*${P}-.*'`,
  ];
  for (const line of broad) assert.equal(classifyLine(line), "broad", line);
});

test("S5a 3 a prefix followed by an owner segment is owner-aware, not broad", () => {
  const aware = [
    `grep -i '^${P}[-_]u1000[-_]'`,
    `grep -iE "^${P}[-_]\${OWNER}[-_]"`,
    `grep -i '^${P}[-_]<owner>[-_]x'`,
    `grep -iE '^${P}[-_]u[0-9]+[-_]'`,
    `grep -iE '^${P}[-_](u|w)[0-9]{1,10}[-_]'`,
    `docker ps --filter "name=^${Q}-w42-api-"`,
    `new RegExp(\`^${P}[-_]\${owner}[-_]\`, "i")`,
  ];
  for (const line of aware) assert.equal(classifyLine(line), "owner-aware", line);
});

test("S5a 4 a literal first segment that cannot be an owner is narrow: it reaches only legacy names", () => {
  for (const line of [`grep -i '^${P}-conventions-'`, `grep -i '^${P}[-_]conventions[-_]'`, `grep -i '/${Q}-wt-gate'`]) {
    assert.equal(classifyLine(line), null, line);
  }
});

test("S5a 5 a bare u or w after the prefix reaches every owner: broad", () => {
  for (const line of [`grep -i '^${P}-w.*'`, `grep -i '^${P}-u'`, `grep -i '^${P}-u.*'`]) {
    assert.equal(classifyLine(line), "broad", line);
  }
});

test("S5a 6 a line holding one owner-aware and one broad pattern is broad", () => {
  assert.equal(classifyLine(`a=^${P}-u1000-; b=^${P}-`), "broad");
});

test("S5a 7 a line that is not a pattern is nothing: a name, a sentence, a folder named like the prefix", () => {
  for (const line of [
    `created ${Q}-u1000-api-pg-k3f9a1 for the run`,
    `the prefix ${Q} is a promise`,
    `cd /srv/${Q}`,
    `const MARKER = /(?:\/\*|\*|<!--)\s*${Q}-exempt:(.*)$/;`,
    "no prefix here at all",
    "",
  ]) assert.equal(classifyLine(line), null, line);
});

test("S5a 8 the not-a-sweeper marker never clears a line unless the caller says it honours one", () => {
  const line = `xargs rm -rf '^${P}-' # not-a-sweeper`;
  assert.equal(classifyLine(line), "broad", "the guard's reading has no comment exemption");
  assert.equal(classifyLine(line, { honourMarker: true }), null, "the scan of a sibling's files during the transition");
});

test("S5a 9 upper and lower case are read alike", () => {
  assert.equal(classifyLine(`grep -i '^${Q.toUpperCase()}-'`), "broad");
  assert.equal(classifyLine(`grep -i '^${P}-U1000-'`), "owner-aware");
});

test("S5a 10 the classifier's own module and this test spell no broad line", () => {
  for (const file of ["lib/sweeper-scan.mjs", "sweeper-scan.test.mjs"]) {
    const text = fs.readFileSync(path.join(here, file), "utf8");
    assert.deepEqual(broadLines(text), [], `${file} must not hold a line its own classifier calls broad`);
  }
});
