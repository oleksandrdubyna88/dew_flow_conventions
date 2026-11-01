// The selection baseline (E1.S2): research/selection-matrix.json records the exact ids each of 165 representative scopes
// selects, the 22 single-read pins and the gate records. tools/selection-matrix.mjs generates it; these tests make a hand
// edit, or a selector change nobody regenerated for, a red suite. They are the control that `path_tasks` and the
// later epics' new rules cannot drop a rule from a scope silently (plan sections 4.1, 4.3, 5; D12).

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { loadCatalog } from "./lib/rule-catalog.mjs";
import { provenanceFindings, caseFindings } from "./lib/gates.mjs";
import { LANDED_EPICS } from "./lib/parity-epics.mjs";
import { ownedDir } from "./lib/owned.mjs";
import { GUARD_MS } from "./lib/startup-ceilings.mjs";
import { drifted } from "./rule-bodies.mjs";
import { render, idDrift, bytesTable, SCOPES, FILE_SETS, TASKS_PINNED, ONE_READ, GATES } from "./selection-matrix.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATRIX = path.join(sourceRoot, "research/selection-matrix.json");
const committed = () => fs.readFileSync(MATRIX, "utf8");
const committedLf = () => committed().replaceAll("\r\n", "\n");
const parsed = () => JSON.parse(committed());
const SINGLE_READ_TASKS = ["inspect", "ui", "gpu", "storage"];
const LANGUAGE_FILES = ["src/x.cs", "src/x.csproj", "ui/a.ts", "src/a.mjs", "src/webview/page.ts"];

// A copy of what the tool needs: its own file, the library, the dependencies, the four rule folders and the record.
function toolCopy(t) {
  const root = ownedDir(t, "selection matrix");
  fs.mkdirSync(path.join(root, "tools"), { recursive: true });
  fs.mkdirSync(path.join(root, "research"), { recursive: true });
  fs.copyFileSync(path.join(sourceRoot, "tools/selection-matrix.mjs"), path.join(root, "tools/selection-matrix.mjs"));
  for (const name of ["tools/lib", "node_modules", "common", "csharp", "rust", "typescript"]) {
    fs.cpSync(path.join(sourceRoot, name), path.join(root, name), { recursive: true });
  }
  fs.copyFileSync(MATRIX, path.join(root, "research/selection-matrix.json"));
  fs.copyFileSync(path.join(sourceRoot, "research/rule-bodies.json"), path.join(root, "research/rule-bodies.json"));
  const tool = (...args) => spawnSync(process.execPath, [path.join(root, "tools/selection-matrix.mjs"), ...args], { cwd: root, encoding: "utf8", timeout: GUARD_MS });
  return { root, tool };
}

test("the committed selection matrix is exactly what the tool renders from the real catalog", () => {
  assert.equal(committedLf(), render(loadCatalog(sourceRoot)), "run `node tools/selection-matrix.mjs --write` and read the diff");
});

test("the matrix holds 165 scopes once each, sorted unique ids, the 22 pins and a reason for every other single-read scope", () => {
  const file = parsed();
  assert.equal(SCOPES.length, FILE_SETS.length * TASKS_PINNED.length);
  assert.deepEqual(file.scopes.map(scope => scope.name), SCOPES.map(scope => scope.name), "every scope once, in the tool's order");
  assert.equal(new Set(file.scopes.map(scope => scope.name)).size, 165);
  for (const scope of file.scopes) {
    assert.deepEqual(scope.ids, [...new Set(scope.ids)].sort(), `${scope.name}: ids sorted and unique`);
    assert.ok(scope.ids.length > 0, `${scope.name}: a scope that selects nothing records nothing — the always core is always there`);
  }
  const single = file.scopes.filter(scope => SINGLE_READ_TASKS.includes(scope.tasks[0]));
  assert.equal(single.length, 60);
  assert.equal(Object.keys(ONE_READ).length, 60);
  const pins = single.filter(scope => scope.oneRead === true);
  assert.equal(pins.length, 22, "exactly the 22 pins of plan section 5");
  assert.deepEqual(SINGLE_READ_TASKS.map(task => pins.filter(scope => scope.tasks[0] === task).length), [9, 4, 5, 4]);
  for (const scope of single.filter(scope => scope.oneRead !== true)) {
    assert.equal(scope.oneRead, false, scope.name);
    assert.ok(typeof scope.why === "string" && scope.why.length >= 10, `${scope.name}: an off-list scope says why`);
  }
  for (const scope of file.scopes.filter(scope => !SINGLE_READ_TASKS.includes(scope.tasks[0]))) {
    assert.equal(Object.hasOwn(scope, "oneRead"), false, `${scope.name}: a split-read task has no single-read pin`);
  }
  // D5: ui with a language file is never on the single-read list, whatever it weighs.
  for (const scope of single.filter(scope => scope.tasks[0] === "ui" && scope.files.some(file => LANGUAGE_FILES.includes(file)))) {
    assert.equal(scope.oneRead, false, `${scope.name}: D5 — ui with a language file is off the single-read list`);
  }
});

// The 22 pins of plan section 5, named. A literal on purpose and independent of the tool's own PINNED table: counts and
// the D5 rule cannot tell one pin from another, so swapping a pinned scope for an unpinned one of the same task kept every
// count green. Adding or dropping a pin is a decision of the plan, and this list is where a reviewer sees it.
const PINS = [
  "inspect (no file)", "inspect src/x.cs", "inspect src/x.csproj", "inspect ui/a.ts", "inspect tsconfig.json", "inspect .npmrc",
  "inspect Directory.Build.props", "inspect src/a.mjs", "inspect src/webview/page.ts",
  "ui (no file)", "ui tsconfig.json", "ui .npmrc", "ui Directory.Build.props",
  "gpu (no file)", "gpu src/x.cs", "gpu tsconfig.json", "gpu .npmrc", "gpu Directory.Build.props",
  "storage (no file)", "storage tsconfig.json", "storage .npmrc", "storage Directory.Build.props",
];

test("every rule of the catalog appears in the id list of at least one recorded scope", () => {
  // A rule no scope selects is a rule a path_tasks or paths edit can change without the baseline noticing.
  const recorded = new Set(parsed().scopes.flatMap(scope => scope.ids));
  const unrecorded = loadCatalog(sourceRoot).map(rule => rule.id).filter(id => !recorded.has(id));
  assert.deepEqual(unrecorded, [], "add the file set or the task that selects each, then --write");
});

test("the 22 single-read pins are exactly the scopes the plan names", () => {
  assert.equal(new Set(PINS).size, 22);
  assert.deepEqual(parsed().scopes.filter(scope => scope.oneRead === true).map(scope => scope.name).sort(), [...PINS].sort());
});

test("a selector edit moves a recorded id list but passes the body freeze — the matrix is the control that notices it", t => {
  // D12's point. Removing `tasks: ["dependencies"]` from a rule changes what 'dependencies' selects and no body byte.
  const { root } = toolCopy(t);
  const file = path.join(root, "csharp/nuget-packages.md");
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace('tasks: ["dependencies"]\n', "");
  assert.notEqual(after, before, "the fixture edit must change the file, or this proves nothing");
  fs.writeFileSync(file, after);
  const moved = idDrift(loadCatalog(root), parsed());
  assert.ok(moved.some(finding => finding.includes("dependencies (no file)") && finding.includes("csharp.nuget-packages")), moved.join("\n"));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "research/rule-bodies.json"), "utf8"));
  assert.deepEqual(drifted(root, manifest), [], "the body freeze hashes after the front matter, so it passes");
});

test("the tool verifies in step, fails on a hand edit naming it, and --write restores the file", t => {
  const { root, tool } = toolCopy(t);
  const clean = tool();
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(clean.stdout, /in step/);
  const file = path.join(root, "research/selection-matrix.json");
  const edited = JSON.parse(fs.readFileSync(file, "utf8"));
  edited.scopes[0].ids = edited.scopes[0].ids.slice(1);
  fs.writeFileSync(file, `${JSON.stringify(edited, null, 2)}\n`);
  const red = tool();
  assert.equal(red.status, 1);
  assert.ok(red.stderr.includes(edited.scopes[0].name), red.stderr);
  const written = tool("--write");
  assert.equal(written.status, 0, written.stderr);
  assert.equal(fs.readFileSync(file, "utf8"), committed());
  assert.equal(fs.existsSync(`${file}.tmp`), false, "the temporary file is renamed away");
  assert.equal(tool().status, 0);
});

test("a CRLF checkout of the recorded file (core.autocrlf) is still in step", t => {
  const { root, tool } = toolCopy(t);
  const file = path.join(root, "research/selection-matrix.json");
  fs.writeFileSync(file, committed().replaceAll("\n", "\r\n"));
  const result = tool();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(committed().includes("\r"), false, "the committed file itself is LF");
});

test("the tool prints the bytes table and refuses an unknown argument with usage", t => {
  const { tool } = toolCopy(t);
  const bytes = tool("--bytes");
  assert.equal(bytes.status, 0, bytes.stderr);
  assert.equal(bytes.stdout, `${bytesTable(loadCatalog(sourceRoot))}\n`);
  assert.match(bytes.stdout, /^\| Files \| inspect \| ui \| gpu \| storage \| implement \| test \| audit \| logging \| dependencies \| pr \| policy \|$/m);
  assert.match(bytes.stdout, /^\| \(no file\) \| [\d,]+ \|/m);
  const usage = tool("--nope");
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /usage/i);
});

test("the selection matrix carries no gate declaration at E1", () => {
  assert.deepEqual(parsed().gates, {});
  assert.deepEqual(GATES, {});
});

test("every gate record of the tool passes the provenance and the case checks on the real catalog", () => {
  const catalog = loadCatalog(sourceRoot);
  assert.deepEqual(provenanceFindings(catalog, GATES, LANDED_EPICS), []);
  assert.deepEqual(caseFindings(catalog, GATES), []);
});
