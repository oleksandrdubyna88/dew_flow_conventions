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
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

import { NOT_A_SWEEPER, broadLines, classifyLine, classifyLines } from "./lib/sweeper-scan.mjs";
import { assignments, prefixBindings } from "./lib/prefix-bindings.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const P = "teststo" + "delete"; // the prefix, lower case
const Q = "testsTo" + "Delete"; // the prefix, as the rule writes it

test("S5a 1 the three lines of the rule text on main at 2c96f83 are owner-blind", () => {
  // the fixture holds the prefix as @@PFX@@, so this repository's own scan does not read the old text as a sweeper
  const old = fs.readFileSync(path.join(here, "fixtures", "sweeper-scan", "rule-2c96f83.md"), "utf8").replaceAll("@@PFX@@", P);
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

// --- F12: a prefix held in a variable of the SAME file ------------------------------------------------------------------
//
// Every text below is a list of lines joined with newlines; the prefix is spelled through `Q`, and a line that assigns
// it sits in a template literal with an interpolation, so this file's own scan reads no binding of its own.

const rows = (...list) => list.join("\n");
const verdicts = (text, options) => classifyLines(text, options);
const SHELL_USE = [`find "\${TMPDIR:-/tmp}" -maxdepth 1 -name "\${P_}*" -mmin +60 -exec rm -rf {} +`, `rm -rf "$TMPDIR/$P_"*`];

test("F12 1 a shell variable holding the bare prefix makes the age-selected find and the rm of the same file broad, at their own lines", () => {
  const text = rows("#!/usr/bin/env bash", `P_='${Q}-'`, ...SHELL_USE);
  assert.deepEqual(verdicts(text), [null, null, "broad", "broad"]);
  assert.deepEqual(broadLines(text), [3, 4], "the line numbers are the original lines'");
});

test("F12 2 the same lines with no binding in the file are not traced: the name may come from anywhere", () => {
  assert.deepEqual(verdicts(rows(...SHELL_USE)), [null, null]);
});

test("F12 3 a JavaScript constant holding the bare prefix: startsWith, and a concatenation, are broad", () => {
  const constant = `const PREFIX = "${Q}-";`;
  assert.deepEqual(verdicts(rows(constant, "names.filter((n) => n.startsWith(PREFIX)).forEach((n) => fs.rmSync(n))")), [null, "broad"]);
  assert.deepEqual(verdicts(rows(constant, "fs.rmSync(PREFIX + id)")), [null, "broad"]);
  assert.deepEqual(verdicts(rows(`let PREFIX = '${Q}_'`, "names.filter((n) => n.startsWith(`${PREFIX}`)).forEach((n) => fs.rmSync(n))")), [null, "broad"], "a template's ${NAME} too");
});

test("F12 4 a Python name holding the bare prefix: startswith and rmtree are broad", () => {
  assert.deepEqual(verdicts(rows(`PREFIX = "${Q}-"`, "if n.startswith(PREFIX): shutil.rmtree(n)")), [null, "broad"]);
});

test("F12 5 a PowerShell variable holding the bare prefix: $name and $env:name are read", () => {
  assert.deepEqual(verdicts(rows(`$Pfx = '${Q}-'`, 'Get-ChildItem $env:TEMP | Where-Object Name -like "$Pfx*" | Remove-Item -Recurse')), [null, "broad"]);
  assert.deepEqual(verdicts(rows(`$env:Pfx = '${Q}-'`, 'Remove-Item "$env:TEMP/$env:Pfx"*')), [null, "broad"]);
});

test("F12 6 a variable holding an OWNER-AWARE value makes its use line owner-aware, not broad", () => {
  assert.deepEqual(verdicts(rows(`P_='${Q}-u1000-'`, ...SHELL_USE.slice(1))), [null, "owner-aware"]);
});

test("F12 7 a value with an owner interpolation is bound and its use line is owner-aware", () => {
  assert.deepEqual(verdicts(rows(`P_="${Q}-\${OWNER}-"`, ...SHELL_USE.slice(1))), [null, "owner-aware"]);
  assert.deepEqual(verdicts(rows(`P_="${Q}-$OWNER-"`, ...SHELL_USE.slice(1))), [null, "owner-aware"]);
  assert.deepEqual([...prefixBindings(`const PREFIX = \`${Q}-\${owner}-\`;`).keys()], ["PREFIX"]);
});

test("F12 8 a LEGACY literal value is narrow: its use lines are null", () => {
  assert.deepEqual(verdicts(rows(`P_='${Q}-myrepo-preflight-'`, ...SHELL_USE)), [null, null, null]);
});

test("F12 9 a log-retention line is nothing, with or without a binding elsewhere in the file", () => {
  const retention = `find "$LOG_DIR" -name '*.log' -mtime +14 -delete`;
  assert.deepEqual(verdicts(retention), [null]);
  assert.deepEqual(verdicts(rows(`P_='${Q}-'`, retention)), [null, null]);
});

test("F12 10 an alias of a bound name binds too, through a chain, and a cycle binds nothing", () => {
  assert.deepEqual(verdicts(rows(`BASE='${Q}-'`, `P_="$BASE"`, ...SHELL_USE.slice(1))), [null, null, "broad"]);
  assert.deepEqual(verdicts(rows(`BASE='${Q}-'`, "MID=${BASE}", "P_=$MID", ...SHELL_USE.slice(1))), [null, null, null, "broad"]);
  assert.deepEqual(verdicts(rows(`const BASE = "${Q}-";`, "const PREFIX = BASE;", "fs.rmSync(PREFIX + id)")), [null, null, "broad"]);
  assert.deepEqual(verdicts(rows(`A_="$B_"`, `B_="$A_"`, ...SHELL_USE.slice(1).map((l) => l.replace("$P_", "$A_")))), [null, null, null], "a cycle with no literal at its root");
});

test("F12 11 a bare identifier is expanded as a whole token only: not in a longer name, after a dot, or inside a string", () => {
  const bound = `PREFIX = "${Q}-"`;
  for (const use of [
    "shutil.rmtree(PREFIXES + n)",
    "shutil.rmtree(MY_PREFIX + n)",
    "shutil.rmtree(obj.PREFIX + n)",
    "shutil.rmtree('PREFIX' + n)",
    'shutil.rmtree("a PREFIX b")',
  ]) assert.deepEqual(verdicts(rows(bound, use)), [null, null], use);
  assert.deepEqual(verdicts(rows(bound, "shutil.rmtree(PREFIX + n)")), [null, "broad"], "the whole token is read");
});

test("F12 12 a shell binding does not expand a bare word: only $NAME, ${NAME} and $env:NAME are uses", () => {
  assert.deepEqual(verdicts(rows(`P_='${Q}-'`, "echo P_ | xargs rm -rf")), [null, null]);
});

test("F12 13 the binding's own line keeps its own verdict, and the marker clears a use line only for a caller that honours it", () => {
  assert.deepEqual(verdicts(`P_='${Q}-'`), [null]);
  const text = rows(`P_='${Q}-'`, `${SHELL_USE[1]} # ${NOT_A_SWEEPER}`);
  assert.deepEqual(verdicts(text), [null, "broad"]);
  assert.deepEqual(verdicts(text, { honourMarker: true }), [null, null]);
});

test("F12 14 a name assigned the prefix anywhere binds on every line, whatever the order or a later reassignment", () => {
  assert.deepEqual(verdicts(rows(...SHELL_USE.slice(1), `P_='${Q}-'`, "P_=other")), ["broad", null, null]);
});

const JANITOR_PASS = () => {
  const janitor = fs.readFileSync(path.join(here, "janitor.sh"), "utf8");
  const allowlist = JSON.parse(fs.readFileSync(path.join(here, "fixtures", "owner-blind-allowlist.json"), "utf8")).entries;
  return { janitor, allowlist, file: "tools/janitor.sh", lines: allowlist.map((entry) => entry.line) };
};

test("F12 15 a binding made on a line the allowlist passes propagates nowhere, and the sanction is per (file, line, hash)", () => {
  const assign = `RX_='${Q}[-_]'; GLOB_='${Q}[-_]*'`;
  const text = rows(assign, `P_='${Q}-'`, 'awk -v rx="^$RX_" x', 'rm -rf "$TMPDIR/$P_"*');
  const entry = { file: "tools/janitor.sh", line: 1, sha256: createHash("sha256").update(assign, "utf8").digest("hex") };
  assert.deepEqual(verdicts(text), ["broad", null, "broad", "broad"]);
  assert.deepEqual(verdicts(text, { allowlist: [entry], file: "tools/janitor.sh" }), [null, null, null, "broad"], "the passed line is null (one contract: a caller does not check the allowlist again); RX_ is no longer bound, P_ still is");
  assert.deepEqual(verdicts(text, { allowlist: [entry], file: "tools/other.sh" }), ["broad", null, "broad", "broad"], "another file: no sanction");
  assert.deepEqual(verdicts(text, { allowlist: [{ ...entry, sha256: "0".repeat(64) }], file: "tools/janitor.sh" }), ["broad", null, "broad", "broad"], "another hash: no sanction");
});

test("F12 16 the janitor read with the shipped allowlist has no broad line; broadLines without it shows the passed line and the uses", () => {
  const { janitor, allowlist, file, lines: passed } = JANITOR_PASS();
  assert.deepEqual(broadLines(janitor, { allowlist, file }), [], "the passed line is not reported, and none of the uses of its variables is");
  assert.ok(broadLines(janitor).length > passed.length, "without the sanction the variables' uses are broad: the test would be empty otherwise");
});

test("F12 17 a parameter operator on a bound name is a use: ${P:?} ${P:-x} ${P%-} ${P,,} — and ${#P}, a length, is not", () => {
  for (const use of ['"/tmp/${P_:?}"*', '"/tmp/${P_:-x}"*', '"/tmp/${P_%-}"*', '"/tmp/${P_,,}"*']) {
    assert.deepEqual(verdicts(rows(`P_='${Q}-'`, `rm -rf ${use}`)), [null, "broad"], use);
  }
  assert.deepEqual(verdicts(rows(`P_='${Q}-'`, 'echo "${#P_}" | xargs rm -rf')), [null, null]);
});

test("F12 18 a value built from the file's own bindings is bound, to a true fixed point: a default, a path, a call", () => {
  assert.deepEqual(verdicts(rows(`PFX="\${LEFTOVER_PREFIX:-${Q}-}"`, 'rm -rf "/tmp/$PFX"*')), [null, "broad"]);
  assert.deepEqual(verdicts(rows(`BASE='${Q}-'`, 'P_="$TMPDIR/$BASE"', 'rm -rf "$P_"*')), [null, null, "broad"]);
  assert.deepEqual(verdicts(rows(`const BASE = "${Q}-";`, "const P = path.join(dir, BASE);", "fs.rmSync(P);")), [null, null, "broad"]);
  const chain = ["L0='" + Q + "-'", ...Array.from({ length: 20 }, (_, i) => `L${i + 1}="$L${i}"`), 'rm -rf "/tmp/$L20"*'];
  assert.equal(verdicts(rows(...chain)).at(-1), "broad", "a chain longer than any pass cap still binds");
});

test("F12 19 a cycle of names ends at once: a name is not expanded into a value that depends on it, and the other bindings still read", () => {
  const text = rows(`BASE='${Q}-'`, 'A_="$B_$BASE"', 'B_="$A_$BASE"', 'rm -rf "/tmp/$BASE"*');
  assert.equal(prefixBindings(text).get("A_").overflow, false);
  assert.equal(verdicts(text).at(-1), "broad");
});

test("F12 20 an owner-aware concatenation binds the WHOLE value: its uses are owner-aware, never broad", () => {
  const sh = 'rm -rf "$TMPDIR/$P_"*';
  assert.deepEqual(verdicts(rows(`const PREFIX = '${Q}-' + owner + '-';`, "fs.rmSync(PREFIX + id)")), [null, "owner-aware"]);
  assert.deepEqual(verdicts(rows(`PREFIX = '${Q}-' + OWNER + '-'`, "if n.startswith(PREFIX): shutil.rmtree(n)")), [null, "owner-aware"]);
  assert.deepEqual(verdicts(rows(`P_='${Q}-'"$OWNER"'-'`, sh)), [null, "owner-aware"]);
  assert.deepEqual(verdicts(rows(`P_=${Q}-"$OWNER"-`, sh)), [null, "owner-aware"]);
  assert.deepEqual(verdicts(rows(`$P = '${Q}-' + $owner + '-'`, 'Remove-Item "$env:TEMP/$P"*')), [null, "owner-aware"]);
  assert.deepEqual(verdicts(rows(`PREFIX = f'${Q}-{owner}-'`, "if n.startswith(PREFIX): shutil.rmtree(n)")), [null, "owner-aware"], "a Python f-string prefix");
});

test("F12 21 a legacy concatenation binds a narrow value: its use is null", () => {
  assert.deepEqual(verdicts(rows(`const PREFIX = '${Q}-' + 'myrepo-';`, "fs.rmSync(PREFIX + id)")), [null, null]);
  assert.deepEqual(verdicts(rows(`P_='${Q}-'"myrepo"-`, 'rm -rf "$TMPDIR/$P_"*')), [null, null]);
});

test("F12 22 a binding line carrying the marker binds nothing for a caller that honours it", () => {
  const text = rows(`P_='${Q}-' # ${NOT_A_SWEEPER}`, ...SHELL_USE.slice(1));
  assert.deepEqual(verdicts(text, { honourMarker: true }), [null, null]);
  assert.deepEqual(verdicts(text), [null, "broad"]);
});

test("F12 23 only the names a line uses vary on it; above 256 readings the line is judged broad, the safe direction", () => {
  const many = (name, count) => Array.from({ length: count }, (_, i) => `${name}='${Q}-r${i}-'`);
  const irrelevant = Array.from({ length: 20 }, (_, i) => many(`N${i}_`, 2)).flat();
  assert.deepEqual(verdicts(rows(...irrelevant, ...many("A_", 2), 'rm -rf "/tmp/$A_"')).at(-1), null, "twenty other names do not multiply the readings of a line that does not use them");
  const text = rows(...many("A_", 17), ...many("B_", 17), 'rm -rf "/tmp/$A_$B_"');
  assert.equal(verdicts(text).at(-1), "broad", "17 x 17 = 289 readings: over the cap, broad (every reading alone is a narrow literal)");
  assert.equal(verdicts(rows(...many("A_", 16), ...many("B_", 16), 'rm -rf "/tmp/$A_$B_"')).at(-1), null, "16 x 16 = 256: all read");
});

test("F12 24 a very long line of the shape `x:` and spaces does not backtrack: under a second", () => {
  const long = `PREFIX:${" ".repeat(100000)}${Q}`;
  const started = performance.now();
  assert.deepEqual(verdicts(rows(long, `x:${" ".repeat(100000)}= '${Q}-'`, `${" ".repeat(100000)}x ${Q}`)).length, 3);
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 1000, `took ${elapsed} ms`);
});

test("F12 25 a text without the prefix word is read as lines, with no binding work", () => {
  assert.deepEqual(verdicts(rows("a=1", "rm -rf /tmp/x")), [null, null]);
});

// round 3: the shapes `0dce2ca` called broad must not become null

test("R1 a string literal with something after it still binds: a method chain, ||, a conditional, -replace", () => {
  const js = "names.filter((n) => n.startsWith(P)).forEach((n) => fs.rmSync(n))";
  const py = "if n.startswith(P): shutil.rmtree(n)";
  const ps = 'Get-ChildItem $env:TEMP | Where-Object Name -like "$P*" | Remove-Item -Recurse';
  for (const [binding, use] of [
    [`const P = '${Q}-'.toLowerCase();`, js],
    [`const P = "${Q}-".trim();`, js],
    [`const P = '${Q}-' || fallback;`, js],
    [`P = '${Q}-'.lower()`, py],
    [`P = '${Q}-' if a else '${Q}_'`, py],
    [`$P = '${Q}-' -replace 'x','y'`, ps],
    [`$P = '${Q}-'.ToLower()`, ps],
  ]) assert.deepEqual(verdicts(rows(binding, use)), [null, "broad"], binding);
  assert.deepEqual(verdicts(rows(`const P = 'TESTSTO${"DELETE"}_OWNER'.trim();`, "names.filter((n) => n.startsWith(P)).forEach((n) => fs.rmSync(n))")), [null, null], "a literal that holds the word but names no prefix reads narrow");
});

test("R2 an alias assigned and used on the same line is read: later uses on the line expand from the file's bindings", () => {
  assert.deepEqual(verdicts(rows(`B='${Q}-'`, 'P=$B; rm -rf /tmp/$P*')), [null, "broad"]);
  assert.deepEqual(verdicts(rows(`BASE='${Q}-'`, 'P="$BASE"; rm -rf "/tmp/$P"*')), [null, "broad"]);
  assert.deepEqual(verdicts(rows(`const B = '${Q}-';`, "const P = B; fs.readdirSync(d).filter((n) => n.startsWith(P)).forEach((n) => fs.rmSync(n));")), [null, "broad"]);
});

test("R3 exactly the assignment's own span is not a use: the same text elsewhere on the line is", () => {
  assert.deepEqual(verdicts(rows(`P='${Q}-'`, 'ls /tmp | grep "$P" ; V="$P"')), [null, "broad"]);
  assert.deepEqual(verdicts(rows(`P='${Q}-'`, 'rm -rf "$P"* ; V="$P"')), [null, "broad"]);
  assert.deepEqual(verdicts(rows(`P='${Q}-'`, `rm -rf /tmp/${Q}-* && P=""`)), [null, "broad"]);
  assert.deepEqual(verdicts(rows(`P='${Q}-'`, `P="/tmp" ; rm -rf "$P/${Q}-"*`)), [null, "broad"]);
  assert.deepEqual(verdicts(rows(`P='${Q}-'`, 'echo "$P" | xargs rm -rf; V="$P"')), [null, "broad"]);
});

test("R4 a name past its value bound is judged broad where it is used, not silently narrowed", () => {
  const owned = Array.from({ length: 32 }, (_, i) => `P_='${Q}-u${i + 1}-'`);
  assert.equal(verdicts(rows(...owned, 'rm -rf "/tmp/$P_"*')).at(-1), "owner-aware", "32 values read fully");
  assert.equal(verdicts(rows(...owned, `P_='${Q}-'`, 'rm -rf "/tmp/$P_"*')).at(-1), "broad", "the 33rd value, the bare prefix, cannot hide");
});

test("R6 an unclosed bracket, an unclosed ${ and a 100000-character line are read in well under a second, each case on its own", async (t) => {
  const cases = {
    "bracket `const a = [` x9000": `${"const a = [".repeat(9000)}${Q}`,
    "paren `const a = (` x9000": `${"const a = (".repeat(9000)}${Q}`,
    "substitution `;a=$(` x16000": `${";a=$(".repeat(16000)}${Q}`,
    "operator `${P_:` x25000": `${"${P_:".repeat(25000)}${Q}`,
    "operator `${P_%x` x20000": `${"${P_%x".repeat(20000)}${Q}`,
  };
  for (const [name, line] of Object.entries(cases)) {
    await t.test(name, () => {
      const started = performance.now();
      assert.equal(verdicts(rows(`P_='${Q}-'`, line)).length, 2);
      const elapsed = performance.now() - started;
      assert.ok(elapsed < 1000, `${name} took ${Math.round(elapsed)} ms`);
    });
  }
});

// round 8: the right-hand sides of one line are bounded; nothing that is a real, separate assignment is lost

test("R20 an assignment that is a separate statement after a closed right-hand side still binds, on one line", () => {
  assert.deepEqual(verdicts(rows(`a=1; P='${Q}-'; rm -rf "/tmp/$P"*`)), ["broad"], "shell: a=1; P=…; rm");
  assert.deepEqual(verdicts(rows(`const a = [1, 2]; const P = '${Q}-'; fs.rmSync(P);`)), ["broad"], "script: two declarations after a closed bracket");
  assert.deepEqual(verdicts(rows(`const a = [1, [2, 3]], b = (x), c = {}; const P = '${Q}-';`, "fs.rmSync(P);")), [null, "broad"]);
  assert.deepEqual(assignments(`const a = [ const P = '${Q}-'`).map((item) => item.name), ["a", "P"], "inside an unclosed bracket, an assignment that holds the word is still read");
  assert.deepEqual(assignments("const a = [ const b = 1").map((item) => item.name), ["a"], "inside an unclosed bracket, one that cannot hold the word is text of it");
  assert.deepEqual(assignments(`${";a=$(".repeat(300)}${Q}`).map((item) => item.name).length > 1, true, "the one that comes before the word, inside, is read when the word is inside the text");
});

test("R21 past the per-line reading budget an assignment is returned unread, and its name overflows only if the prefix word comes after it", () => {
  const filler = Array.from({ length: 200 }, () => `b=${"x".repeat(100)}`).join("; ");
  const after = prefixBindings(rows(`${filler}; P='${Q}-'`, 'rm -rf "$P"*')).get("P");
  assert.equal(after.overflow, true, "past the budget, the word after it: unknown, broad");
  assert.equal(verdicts(rows(`${filler}; P='${Q}-'`, 'rm -rf "$P"*')).at(-1), "broad");
  const under = prefixBindings(rows(`${filler.slice(0, 5000)}; P='${Q}-'`, 'rm -rf "$P"*')).get("P");
  assert.deepEqual([under.overflow, under.values], [false, [`${Q}-`]], "inside the budget it binds as before");
  const before = prefixBindings(rows(`echo ${Q}-x; ${filler}`, 'rm -rf "$b"*'));
  assert.equal(before.get("b")?.overflow ?? false, false, "the word comes BEFORE every assignment: nothing to overflow");
});

// round 4: a bound name given to a call, a member access or a subscript does not make the result a value (measured on compliant code)

const BOUND = (text) => [...prefixBindings(text).keys()].sort();

test("R7 owner-aware names built by a helper and the variables derived from them through calls and member access bind nothing, and sweep nothing", () => {
  const text = rows(
    `const P = '${Q}';`,
    "const base = `${P}-u${uid}-repo-mig-${what}-${id}`;",
    "const s = scenario(t, base);",
    "await up(s, s.from);",
    "const original = await volumeFiles(s.fromVolume);",
    "const plan = await run(s, base, original);",
    "const copied = plan.copy.length;",
    "const label = base.trim();",
    "const picked = lookup[base];",
    "const m = /^(.*)-(\\d+)$/.exec(base);",
    "for (const id of ids) { await check(id, original); }",
    "const { a } = derive(base);",
    "fs.rmSync(`${root}/${base}`, { recursive: true });",
    "assert.equal(await count(original, base), 0);",
  );
  assert.deepEqual(broadLines(text), []);
  assert.deepEqual(BOUND(text), ["P", "base"], "only the names whose value is a string built from the prefix");
});

test("R8 a listing query that names the prefix and deletes nothing is not a sweep — and a variable's name inside a regular-expression literal is not a use", () => {
  const listing = `const leftovers = "SELECT datname FROM pg_database WHERE datname LIKE '${Q}%' ORDER BY 1;";`;
  assert.deepEqual(verdicts(rows(listing, "assert.deepEqual(await query(leftovers), []);")), [null, null], "no deletion verb, no anchor or glob shape: the word sits inside a quoted LIKE");
  assert.deepEqual(verdicts(rows(listing, "assert.match(record.file, /^leftovers-provision-.+-\\d{4}\\.md$/);")), [null, null], "the variable's name in a regular-expression literal is text, not a use");
});

test("R9 a name's own placeholder is not expanded into its own value: a template cycle binds, reads as an owner, and never overflows", () => {
  const text = rows(`const P = '${Q}';`, "const base = `${P}-u${uid}-${id}`;", "const id = `${base}`;", "fs.rmSync(`${root}/${base}`);", "fs.rmSync(`${root}/${id}`);");
  const bindings = prefixBindings(text);
  assert.equal(bindings.get("base").overflow, false);
  assert.deepEqual(bindings.get("base").values, [`${Q}-u\${uid}-\${id}`]);
  assert.equal(bindings.get("id").overflow, false);
  assert.deepEqual(bindings.get("id").values, [`${Q}-u\${uid}-\${id}`], "round 6: `id` takes base's value, a value it was not built through; base then refuses id's (its provenance holds base)");
  assert.deepEqual(verdicts(text), [null, null, null, "owner-aware", "owner-aware"]);
});

test("R10 a shell command substitution is not a value, and a shell word of literals and names is", () => {
  assert.deepEqual(BOUND(rows(`BASE='${Q}-'`, 'P_="$(basename "$BASE")"', "Q_=`echo $BASE`", 'R_="$BASE/x"')), ["BASE", "R_"]);
});

test("R11 the path-join calls make a value from literals and names; any other call does not", () => {
  const base = `BASE = '${Q}-'`;
  assert.deepEqual(BOUND(rows(`const BASE = '${Q}-';`, "const a = path.resolve(dir, BASE);", "const b = path.posix.join(dir, 'x', BASE);", "const c = pathFor(dir, BASE);", "const d = path.join(dir, BASE).trim();")), ["BASE", "a", "b"]);
  assert.deepEqual(BOUND(rows(base, "A = os.path.join(d, BASE)", "B = other.join(d, BASE)")), ["A", "BASE"]);
  assert.deepEqual(BOUND(rows(`$Base = '${Q}-'`, "$a = Join-Path $d $Base", "$b = [IO.Path]::Combine($d, $Base)", "$c = Get-Item $Base")), ["Base", "a", "b"]);
  assert.deepEqual(verdicts(rows(`const BASE = '${Q}-';`, "const P = path.resolve(dir, BASE);", "fs.rmSync(P);")), [null, null, "broad"]);
});

test("R12 destructuring and loop variables never bind", () => {
  assert.deepEqual(BOUND(rows(`const { a } = { a: '${Q}-' };`, `const [b] = ['${Q}-'];`, `for (const c of ['${Q}-']) { use(c); }`)), []);
});

// round 5: the cycle guard reads real uses only and drops cyclic VALUES, not whole names (a missed sweep is the costly error)

const USE_JS = "names.filter((n) => n.startsWith(p)).forEach((n) => fs.rmSync(n))";

test("R13 a word inside a path literal is not a use: it makes no dependency, so the sweep through the variable is still broad", () => {
  const cases = [
    [rows(`BASE='/tmp/${Q}-'`, 'tmp="$BASE"', 'rm -rf "$tmp"*'), 2],
    [rows(`const BASE = '/tmp/${Q}-';`, "const tmp = BASE;", "execSync(`rm -rf ${tmp}*`);"), 2],
    [rows(`ROOT='/var/tmp/${Q}-'`, 'var="$ROOT"', 'rm -rf "$var"*'), 2],
    [rows(`PREFIX = '/tmp/${Q}-%d' % 0`, "d = os.path.join(tempfile.gettempdir(), PREFIX)", "os.system('rm -rf ' + d + '*')"), 2],
    [rows("fa() {", `  local base='${Q}-'`, '  local dir="$TMPDIR/$base"', '  rm -rf "$dir"*', "}", "fb() {", '  local base="$(mktemp -d)/dir"', "}"), 3],
  ];
  for (const [text, use] of cases) assert.equal(verdicts(text)[use], "broad", `the use line (${use + 1}) is broad: ${text}`);
});

test("R14 a name reused elsewhere keeps its other values: only a value built through the name itself is dropped", () => {
  const shell = rows("fa() {", `  p='${Q}-'`, '  dir="$TMPDIR/$p"', '  rm -rf "$dir"*', "}", "fb() {", "  dir=/tmp", '  p="$dir/x"', "}");
  assert.equal(verdicts(shell)[3], "broad", "shell");
  const js = rows(`const p = '${Q}-';`, "const dir = path.join(base, p);", "fs.rmSync(dir);", "const dir2 = '/tmp';", "const p2 = dir2 + '/x';");
  assert.equal(verdicts(js)[2], "broad", "script, names that never meet");
  const js2 = rows(`const p = '${Q}-';`, "const dir = path.join(base, p);", "fs.rmSync(dir);", "const dir = '/tmp';", "const p = dir + '/x';");
  assert.equal(verdicts(js2)[2], "broad", "script, the same names reused");
  const py = rows(`p = '${Q}-'`, "dir = os.path.join(TMP, p)", "shutil.rmtree(dir)", "dir = '/tmp'", "p = dir + '/x'");
  assert.equal(verdicts(py)[2], "broad", "python");
  assert.equal(verdicts(rows(`A='${Q}-'`, 'B="$A"', 'A="$B-x"', 'rm -rf /tmp/$B*')).at(-1), "broad", "a name built from another that was built from it");
  assert.equal(verdicts(rows("D=/tmp/", `P="$D${Q}-"`, 'rm -rf "$P"*')).at(-1), null, "limit J5, recorded: a placeholder glued directly before the prefix (a self-append too) is not read as a prefix");
});

test("R15 a case conversion, String(), str() and a pathlib join of a bound name are string-shaped: they bind", () => {
  const shellBase = `BASE='${Q}-'`;
  for (const conversion of ["BASE.toLowerCase()", "BASE.toUpperCase()", "String(BASE)", "path.join(dir, BASE.toLowerCase())"]) {
    assert.equal(verdicts(rows(`const BASE = '${Q}-';`, `const p = ${conversion};`, USE_JS)).at(-1), "broad", conversion);
  }
  for (const conversion of ["BASE.lower()", "BASE.upper()", "str(BASE)", "Path(tmp) / BASE", "pathlib.Path(tmp, 'x') / BASE", "Path(tmp) / 'x' / BASE"]) {
    assert.equal(verdicts(rows(`BASE = '${Q}-'`, `p = ${conversion}`, "if n.startswith(p): shutil.rmtree(n)")).at(-1), "broad", conversion);
  }
  assert.equal(verdicts(rows(shellBase, 'p="${BASE,,}"', 'rm -rf "/tmp/$p"*')).at(-1), "broad", "shell case operators already worked");
  assert.deepEqual(BOUND(rows(`BASE = '${Q}-'`, "a = other(BASE)", "b = BASE.strip()", "c = BASE.lower")), ["BASE"], "any other call or member access binds nothing");
});

test("R16 a line of 100000 characters that open an unclosed character class at every slash is read in well under a second", () => {
  const started = performance.now();
  assert.equal(verdicts(rows(`const PFX = '${Q}-';`, `f(PFX ${"=/[".repeat(33000)}`)).length, 2);
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 1000, `took ${elapsed} ms`);
});

// round 6: a substitution placeholder is no name; a name used without a value is no provenance; a prefix past the read limit overflows

test("R17 a command substitution's placeholder never reads as a name of the file: not in a provenance, not replaced by a value", () => {
  const cases = [
    [rows(`P="$(mktemp -d)/${Q}-"`, 'x="$P"', 'rm -rf "$x"*'), 2],
    [rows(`P="\`mktemp -d\`/${Q}-"`, 'x="$P"', 'rm -rf "$x"*'), 2],
    [rows(`P="$(date)/${Q}-"`, 'x="$P"', 'find /tmp -name "${x}*" -exec rm -rf {} +'), 2],
    [rows(`x='${Q}-'`, `P="$(mktemp -d)/${Q}-"`, 'rm -rf "$P"*'), 2],
  ];
  for (const [text, use] of cases) assert.equal(verdicts(text)[use], "broad", `the use line (${use + 1}) is broad: ${text}`);
});

test("R18 a name used WITHOUT a value adds nothing to a provenance: only the values actually taken do", () => {
  const cases = [
    [rows('d="$1"', `p="$d/${Q}-"`, 'd="$p"', 'rm -rf "$d"*'), 3, "an argument, then the name reused"],
    [rows('setup() { tmp="$(mktemp -d)"; ' + `base="$tmp/${Q}-"; }`, 'teardown() { tmp="$base"; rm -rf "$tmp"*; }'), 1, "two functions, one line"],
    [rows('dir="$(mktemp -d)"', `p="$dir/${Q}-"`, 'dir="$p"', 'rm -rf "$dir"*'), 3, "shell reuse"],
    [rows(`const base = root + '/${Q}-';`, "const root = base;", "execSync(`rm ${root}*`);"), 2, "javascript, a name used before it is bound"],
    [rows("let d = os.hostname();", `let p = d + '/${Q}-';`, "d = p;", "execSync(`rm ${d}*`);"), 3, "javascript, reassigned"],
    [rows("const d = os.hostname();", `const p = d + '/${Q}-';`, "function f() {", "  const d = p;", "  execSync(`rm ${d}*`);", "}"), 4, "javascript, reused in a function"],
  ];
  for (const [text, use, what] of cases) assert.equal(verdicts(text)[use], "broad", `${what}: the use line (${use + 1}) is broad: ${text}`);
});

test("C0 a prefix after the right-hand side's read limit makes the name overflow: its uses are broad", () => {
  const filler = "a".repeat(1100);
  assert.equal(verdicts(rows(`P='${filler}${Q}-'`, 'rm -rf "$P"*')).at(-1), "broad", "shell");
  assert.equal(verdicts(rows(`const P = '${filler}${Q}-';`, "fs.rmSync(P);")).at(-1), "broad", "script");
  assert.equal(verdicts(rows(`P='${filler}'`, 'rm -rf "$P"*')).at(-1), null, "no prefix anywhere: nothing to read");
  const started = performance.now();
  assert.equal(verdicts(rows(`${";a=".repeat(30000)}${Q}`, `P=${"x".repeat(2000)}`)).length, 2);
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 1000, `took ${elapsed} ms`);
});

// round 7: a right-hand side too long to bind that USES a bound name overflows: the name's uses read broad

test("R19 a long right-hand side that uses a bound name overflows, shell and script, at 600 and 1000 characters; one that uses none binds nothing", () => {
  for (const length of [600, 1000]) {
    const path = "/x".repeat(length / 2);
    assert.equal(verdicts(rows(`BASE='${Q}-'`, `P="${path}/$BASE"`, 'rm -rf "$P"*')).at(-1), "broad", `shell, ${length}`);
    assert.equal(verdicts(rows(`const BASE = '${Q}-';`, `const P = '${path}/' + BASE;`, "names.filter((n) => n.startsWith(P)).forEach((n) => fs.rmSync(n))")).at(-1), "broad", `script, ${length}`);
    assert.equal(verdicts(rows(`BASE='${Q}-'`, `P="${path}"`, 'rm -rf "$P"*')).at(-1), null, `shell, ${length}, no bound name used: nothing to read`);
    assert.equal(verdicts(rows(`const BASE = '${Q}-';`, `const P = '${path}/BASE';`, "names.filter((n) => n.startsWith(P)).forEach((n) => fs.rmSync(n))")).at(-1), null, `script, ${length}, the name only inside a literal`);
  }
});

// --- S5b: the scan ---------------------------------------------------------------------------------------------------

import { spawnSync } from "node:child_process";
import { ownedDir, cleanupScope } from "./lib/owned.mjs";
import { git } from "./lib/git.mjs";
import { scanSweepers, parseCsv } from "./lib/sweeper-scan.mjs";
import { main } from "./sweeper-scan.mjs";

function lifoScope(t) {
  const scope = cleanupScope();
  t.after(() => scope.close());
  return scope;
}

/** A checkout holding `files` (path → text) in an owned folder. */
function checkout(t, files) {
  const dir = ownedDir(lifoScope(t), "scan checkout");
  git(dir, "init", "-q");
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), text);
  }
  return dir;
}

const NO_CRONTAB = () => ({ status: 1, stdout: "", stderr: "no crontab for somebody", error: undefined });
const reply = (stdout) => ({ status: 0, stdout, stderr: "", error: undefined });
const failed = (stderr = "denied") => ({ status: 1, stdout: "", stderr, error: undefined });

function realRun(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error };
}

/** `answers(command, args)` for everything but git, which is real. */
const withGit = (answers) => (command, args) => (command === "git" ? realRun(command, args) : answers(command, args));

function runScan(argv, deps = {}) {
  const out = [];
  const err = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => err.push(line) }, { run: withGit(NO_CRONTAB), home: path.join(here, "no-such-home"), platform: "linux", ...deps });
  return { code, out: out.join("\n"), err: err.join("\n") };
}

const BLIND = `docker ps -a | grep -i '^${P}-' | xargs -r docker rm -f`;
const ALLOWLIST_TEXT = () => fs.readFileSync(path.join(here, "fixtures", "owner-blind-allowlist.json"), "utf8");

test("S5b 1 the proposed rule texts yield no owner-blind line, and this repository is clean", () => {
  const dir = path.join(here, "..");
  assert.deepEqual(broadLines(fs.readFileSync(path.join(dir, "common", "test-leftovers.md"), "utf8")), []);
  assert.deepEqual(broadLines(fs.readFileSync(path.join(dir, "common", "test-leftovers-detail.md"), "utf8")), []);
  assert.deepEqual(broadLines(fs.readFileSync(path.join(dir, "common", "test-leftovers-janitor.md"), "utf8")), []);
  const result = runScan(["--root", dir]);
  assert.equal(result.code, 0, `${result.out}\n${result.err}`);
});

test("S5b 2 an owner-blind sweeper in a checkout is exit 1 and named by file and line; a clean checkout is exit 0", (t) => {
  const found = runScan(["--root", checkout(t, { "ops/clean.sh": "echo hello\n", "ops/sweep.sh": `#!/bin/sh\n${BLIND}\n` })]);
  assert.equal(found.code, 1, found.err);
  assert.match(found.out, /sweep\.sh:2 — owner-blind/);
  const clean = runScan(["--root", checkout(t, { "ops/clean.sh": "echo hello\n" })]);
  assert.equal(clean.code, 0, clean.err);
});

test("S5b 3 prose is not a sweeper, a rule-text copy is", (t) => {
  assert.equal(runScan(["--root", checkout(t, { "docs/notes.md": `${BLIND}\n`, "x.sh": "echo\n" })]).code, 0, "a Markdown file of notes is prose");
  assert.equal(runScan(["--root", checkout(t, { "vendor/test-leftovers.md": `${BLIND}\n`, "x.sh": "echo\n" })]).code, 1, "a copy of the rule text is read");
});

test("S5b 4 the not-a-sweeper marker passes a line only with --honour-marker", (t) => {
  const dir = checkout(t, { "tools/detect.sh": `${BLIND} # not-a-sweeper\n` });
  assert.equal(runScan(["--root", dir]).code, 1, "no comment clears a line by default");
  assert.equal(runScan(["--root", dir, "--honour-marker"]).code, 0, "the transition for the sibling's own detector lines");
});

test("S5b 5 the allowlist passes the janitor's line by file, line and hash — and nothing else", (t) => {
  const script = fs.readFileSync(path.join(here, "janitor.sh"), "utf8");
  assert.equal(runScan(["--root", checkout(t, { "tools/janitor.sh": script, "tools/fixtures/owner-blind-allowlist.json": ALLOWLIST_TEXT() })]).code, 0);
  assert.equal(runScan(["--root", checkout(t, { "other/janitor.sh": script, "tools/fixtures/owner-blind-allowlist.json": ALLOWLIST_TEXT() })]).code, 1, "the same text in another file");
});

test("S5b 6 unreadable evidence in the requested scope is exit 2, and the findings are still printed", (t) => {
  const dirty = checkout(t, { "ops/sweep.sh": `${BLIND}\n` });
  const crontab = runScan(["--root", dirty], { run: withGit((command) => (command === "crontab" ? failed("permission denied") : failed())) });
  assert.equal(crontab.code, 2, crontab.err);
  assert.match(crontab.err, /unreadable: crontab -l/);
  assert.match(crontab.out, /sweep\.sh:1 — owner-blind/, "what was found is not hidden by what was not read");
  const noGit = runScan(["--root", dirty], { run: (command) => (command === "git" ? failed("fatal") : NO_CRONTAB()) });
  assert.equal(noGit.code, 2, "a checkout whose files cannot be listed");
  assert.equal(runScan(["--root", ownedDir(lifoScope(t), "scan nothing")]).code, 2, "no checkout under the root: scanned nothing is not a clean machine");
});

test("S5b 7 --system reads /etc-style job files and every home; the user scope does not", (t) => {
  const host = ownedDir(lifoScope(t), "scan host");
  fs.mkdirSync(path.join(host, "etc", "cron.d"), { recursive: true });
  fs.writeFileSync(path.join(host, "etc", "cron.d", "sweeps"), `*/5 * * * * root ${BLIND}\n`);
  fs.mkdirSync(path.join(host, "home", "alice", ".config", "systemd", "user"), { recursive: true });
  fs.writeFileSync(path.join(host, "home", "alice", ".config", "systemd", "user", "sweep.service"), `[Service]\nExecStart=/bin/sh -c "${BLIND}"\n`);
  const dir = checkout(t, { "x.sh": "echo\n" });
  const user = runScan(["--root", dir], { hostRoot: host, platform: "linux" });
  assert.equal(user.code, 0, `the user scope does not read /etc or other homes: ${user.out}\n${user.err}`);
  const system = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(system.code, 1);
  assert.match(system.out, /sweeps:1 — owner-blind/);
  assert.match(system.out, /sweep\.service:2 — owner-blind/);
});

test("S5b 8 a scheduled job that calls a janitor or a sweep by name is a finding; a comment is not a job", (t) => {
  const host = ownedDir(lifoScope(t), "scan jobs");
  fs.mkdirSync(path.join(host, "etc"), { recursive: true });
  const janitor = path.join(host, "opt", "rules", "tools", "janitor.sh");
  fs.mkdirSync(path.dirname(janitor), { recursive: true });
  fs.writeFileSync(janitor, "#!/bin/sh\necho a janitor\n");
  fs.writeFileSync(path.join(host, "etc", "crontab"), `# bash ${janitor} in a comment\n0 3 * * * u bash "${janitor}"\n`);
  const result = runScan(["--root", checkout(t, { "x.sh": "echo\n" }), "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(result.code, 1);
  assert.match(result.out, /crontab:2 — calls-a-sweep/);
  assert.doesNotMatch(result.out, /crontab:1/);
});

test("S5b 9 Windows: the Task Scheduler is read directly; a failing schtasks falls back to PowerShell; both failing is exit 2", (t) => {
  const dir = checkout(t, { "x.sh": "echo\n" });
  const janitor = path.join(ownedDir(lifoScope(t), "scan tasks"), "janitor.sh");
  fs.writeFileSync(janitor, "#!/bin/sh\necho a janitor\n");
  const csv = `"HostName","TaskName","Task To Run"\r\n"BOX","\\Nightly","bash.exe ""${janitor}"" --dry-run"\r\n"BOX","\\Other","cmd.exe /c echo"\r\n`;
  const found = runScan(["--root", dir], { run: withGit((command) => (command === "schtasks" ? reply(csv) : failed())), platform: "win32" });
  assert.equal(found.code, 1, found.err);
  assert.match(found.out, /scheduled task \\Nightly:1 — calls-a-sweep/);
  const fallback = runScan(["--root", dir], { run: withGit((command) => (command === "schtasks" ? failed("ERROR") : reply(`Nightly\tbash.exe "${janitor}"\n`))), platform: "win32" });
  assert.equal(fallback.code, 1, "the PowerShell fallback is read");
  const closed = runScan(["--root", dir], { run: withGit(() => failed()), platform: "win32" });
  assert.equal(closed.code, 2, "an unqueryable Task Scheduler is unreadable evidence");
  assert.match(closed.err, /Task Scheduler/);
  const missing = runScan(["--root", dir], { run: withGit(() => ({ status: null, stdout: "", stderr: "", error: Object.assign(new Error("spawn"), { code: "ENOENT" }) })), platform: "win32" });
  assert.equal(missing.code, 2, "no schtasks and no PowerShell");
});

test("S5b 10 parseCsv keeps a quoted comma and a doubled quote in its cell", () => {
  assert.deepEqual(parseCsv('"a","b,c","d ""q"""\r\n"x","y","z"\r\n'), [["a", "b,c", 'd "q"'], ["x", "y", "z"]]);
});

test("S5b 11 the scan never deletes: the checkout is the same afterwards", (t) => {
  const dir = checkout(t, { "ops/sweep.sh": `${BLIND}\n`, "ops/other.txt": "x\n" });
  const snapshot = () => fs.readdirSync(dir, { recursive: true }).sort().map((name) => [name, fs.statSync(path.join(dir, name)).isFile() ? fs.readFileSync(path.join(dir, name), "utf8") : ""]);
  const before = snapshot();
  runScan(["--root", dir]);
  assert.deepEqual(snapshot(), before);
});

test("S5b 12 a bad argument is exit 2 with the usage line, and scanSweepers is exported for the guard's tests", () => {
  const result = runScan(["--bogus"]);
  assert.equal(result.code, 2);
  assert.match(result.err, /usage: node tools\/sweeper-scan\.mjs/);
  assert.equal(typeof scanSweepers, "function");
});

// --- review round: unanchored sweepers, and the scripts a job runs ----------------------------------------------------

test("R3 unanchored sweepers: a prefix with no owner after it, beside a deletion verb or as the argument of a matcher, is broad", () => {
  const W = P; // the prefix in lower case; the upper-case spelling is Q
  const broad = [
    `ls /tmp | grep ${Q} | xargs rm -rf`,
    `docker ps -a --format '{{.Names}}' | grep ${Q} | xargs docker rm -f`,
    `/${Q}-/i.test(n)`,
    `if (n.includes("${Q}-")) fs.rmSync(n, { recursive: true })`,
    `n.includes("${Q}-")`,
    `if re.match(r"${Q}-", n): shutil.rmtree(n)`,
    `re.match(r"${Q}-", n)`,
    `Get-ChildItem $env:TEMP | Where-Object { $_.Name -match '${Q}' } | Remove-Item -Recurse -Force`,
    `$_.Name -match '${Q}'`,
    `if name.startswith("${Q}"): os.remove(name)`,
    `name.startswith("${Q}")`,
    `find /tmp -maxdepth 1 -name '*${W}*' -delete`,
    `rm -rf /tmp/${W}*`,
    `grep -i ${W} list.txt`,
  ];
  for (const line of broad) assert.equal(classifyLine(line), "broad", line);
  const fine = [
    `grep ${Q}-u1000- list.txt`,
    `ls /tmp | grep '${Q}-u1000-' | xargs rm -rf`,
    `n.includes("${Q}-u1000-")`,
    `rm -rf "/tmp/${Q}-u1000-api-x-abc123"`,
    `echo "the prefix ${Q} is a promise" # rm is not run`,
    `const PREFIX = "${Q}-";`,
    `docker rm -f ${Q}-u1000-api-pg-k3f9a1`,
    `grep ${Q}-conventions- legacy.txt`,
  ];
  for (const line of fine) assert.notEqual(classifyLine(line), "broad", line);
});

test("R4a a home folder that cannot be listed is unreadable evidence; only a missing one is nothing", (t) => {
  const host = ownedDir(lifoScope(t), "scan homes");
  const dir = checkout(t, { "x.sh": "echo\n" });
  const unreadableHome = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux", readDir: (target) => { if (target.endsWith("home")) throw Object.assign(new Error("denied"), { code: "EACCES" }); return fs.readdirSync(target, { withFileTypes: true }); } });
  assert.equal(unreadableHome.code, 2, unreadableHome.err);
  assert.match(unreadableHome.err, /unreadable: .*home — EACCES/);
  const noHomes = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(noHomes.code, 0, `no /home at all is nothing to read: ${noHomes.out}\n${noHomes.err}`);
});

test("R4b a cron line's script is READ and classified; a missing script is unreadable, never clean", (t) => {
  const host = ownedDir(lifoScope(t), "scan scripts");
  const home = path.join(host, "home", "alice");
  fs.mkdirSync(path.join(home, "bin"), { recursive: true });
  fs.writeFileSync(path.join(home, "bin", "clean-tmp.sh"), `#!/bin/sh\nrm -rf /tmp/${P}*\n`);
  const crontab = (text) => ({ run: withGit((command) => (command === "crontab" ? reply(text) : failed())), home, hostRoot: host, platform: "linux" });
  const dir = checkout(t, { "x.sh": "echo\n" });
  const found = runScan(["--root", dir], crontab("@hourly ~/bin/clean-tmp.sh\n"));
  assert.equal(found.code, 1, `${found.out}\n${found.err}`);
  assert.match(found.out, /clean-tmp\.sh:2 — owner-blind/);
  const missing = runScan(["--root", dir], crontab("@hourly ~/bin/gone.sh\n"));
  assert.equal(missing.code, 2, missing.err);
  assert.match(missing.err, /unreadable: crontab -l: .*gone\.sh — script not found/);
  const relative = runScan(["--root", dir], crontab("0 3 * * * cd /srv && ./sweep.sh\n"));
  assert.equal(relative.code, 2, "a relative script cannot be resolved: unreadable");
  const interpreter = runScan(["--root", dir], crontab(`30 2 * * * bash "${path.join(home, "bin", "clean-tmp.sh")}" --quiet\n`));
  assert.equal(interpreter.code, 1, "the script an interpreter runs");
  const harmless = runScan(["--root", dir], crontab("MAILTO=me\n0 3 * * * /usr/bin/env true\n# @hourly ~/bin/gone.sh\n"));
  assert.equal(harmless.code, 0, `${harmless.out}\n${harmless.err}`);
});

test("R4c systemd ExecStart= and drop-in *.conf files, and Windows task actions (quoted, with %VAR%), are followed to their script", (t) => {
  const host = ownedDir(lifoScope(t), "scan units");
  const sweep = path.join(host, "opt", "sweep.sh");
  fs.mkdirSync(path.dirname(sweep), { recursive: true });
  fs.writeFileSync(sweep, `#!/bin/sh\nfind /tmp -name '${Q}-*' -delete\n`);
  const unitDir = path.join(host, "etc", "systemd", "system");
  fs.mkdirSync(path.join(unitDir, "tidy.service.d"), { recursive: true });
  fs.writeFileSync(path.join(unitDir, "tidy.service"), "[Service]\nExecStart=/usr/bin/true\n");
  fs.writeFileSync(path.join(unitDir, "tidy.service.d", "override.conf"), `[Service]\nExecStartPre=-"${sweep}" now\n`);
  const dir = checkout(t, { "x.sh": "echo\n" });
  const system = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(system.code, 1, `${system.out}\n${system.err}`);
  assert.match(system.out, /sweep\.sh:2 — owner-blind/);
  fs.writeFileSync(path.join(unitDir, "tidy.service.d", "override.conf"), "[Service]\nExecStart=\nExecStart=/opt/missing/run.sh\n");
  const missing = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(missing.code, 2);
  assert.match(missing.err, /run\.sh — script not found/);
  const script = path.join(host, "scripts", "my sweep.ps1");
  fs.mkdirSync(path.dirname(script), { recursive: true });
  fs.writeFileSync(script, `Get-ChildItem $env:TEMP | Where-Object { $_.Name -match '${Q}' } | Remove-Item -Recurse -Force\n`);
  const csv = `"HostName","TaskName","Task To Run"\r\n"BOX","\\Tidy","powershell.exe -File ""%SWEEPHOME%\\my sweep.ps1"""\r\n`;
  const previous = process.env.SWEEPHOME;
  process.env.SWEEPHOME = path.dirname(script);
  t.after(() => { if (previous === undefined) delete process.env.SWEEPHOME; else process.env.SWEEPHOME = previous; });
  const task = runScan(["--root", dir], { run: withGit((command) => (command === "schtasks" ? reply(csv) : failed())), platform: "win32" });
  assert.equal(task.code, 1, `${task.out}\n${task.err}`);
  assert.match(task.out, /my sweep\.ps1:1 — owner-blind/);
});

// Security pass (PR #82, M-2): the machine scan reads only the allowlist shipped beside the tool, pinned to the janitor's file ---------

const SWEEP_LINE = `find "\${TMPDIR:-/tmp}" -maxdepth 1 -name '${Q}-*' -mmin +60 -exec rm -rf {} +`;
const ownAllowlist = () => JSON.stringify({ entries: [{ file: "scripts/sweep.sh", line: 2, sha256: createHash("sha256").update(SWEEP_LINE, "utf8").digest("hex") }] });

test("M-2. a checkout's own allowlist never silences its sweeper — with --root <checkout> and with --root <parent>", (t) => {
  const consumerFiles = { "scripts/sweep.sh": `#!/usr/bin/env bash\n${SWEEP_LINE}\n`, "tools/fixtures/owner-blind-allowlist.json": ownAllowlist() };
  const direct = runScan(["--root", checkout(t, consumerFiles)]);
  assert.equal(direct.code, 1, `${direct.out}\n${direct.err}`);
  assert.match(direct.out, /sweep\.sh:2 — owner-blind/, "--root <consumer>: the consumer's own entry did not clear its sweeper");
  const parent = ownedDir(lifoScope(t), "scan parent");
  const inner = path.join(parent, "consumer");
  fs.mkdirSync(inner);
  git(inner, "init", "-q");
  for (const [name, text] of Object.entries(consumerFiles)) {
    fs.mkdirSync(path.dirname(path.join(inner, name)), { recursive: true });
    fs.writeFileSync(path.join(inner, name), text);
  }
  const above = runScan(["--root", parent]);
  assert.equal(above.code, 1, `${above.out}\n${above.err}`);
  assert.match(above.out, /sweep\.sh:2 — owner-blind/, "--root <parent>: found too");
});

test("M-2. an entry is read only when it names tools/janitor.sh: the shipped file's entry does not clear the same text elsewhere or under another name", (t) => {
  const script = fs.readFileSync(path.join(here, "janitor.sh"), "utf8");
  assert.equal(runScan(["--root", checkout(t, { "tools/janitor.sh": script })]).code, 0, "the shipped janitor, with no allowlist of its own in the tree");
  assert.equal(runScan(["--root", checkout(t, { "tools/janitor.sh": script, "tools/fixtures/owner-blind-allowlist.json": JSON.stringify({ entries: [] }) })]).code, 0, "an empty allowlist in the tree removes nothing");
  assert.equal(runScan(["--root", checkout(t, { "scripts/janitor.sh": script })]).code, 1, "the janitor text under another path");
});
