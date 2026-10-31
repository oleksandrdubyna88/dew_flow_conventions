// The selection baseline (E1.S2): research/selection-matrix.json records the exact ids each of 108 representative scopes
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
import { ownedDir } from "./lib/owned.mjs";
import { GUARD_MS } from "./lib/startup-ceilings.mjs";
import { drifted } from "./rule-bodies.mjs";
import { render, idDrift, bytesTable, SCOPES, FILE_SETS, TASKS_PINNED, ONE_READ, GATES } from "./selection-matrix.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MATRIX = path.join(sourceRoot, "research/selection-matrix.json");
const committed = () => fs.readFileSync(MATRIX, "utf8");
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
  assert.equal(committed(), render(loadCatalog(sourceRoot)), "run `node tools/selection-matrix.mjs --write` and read the diff");
});

test("the matrix holds 108 scopes once each, sorted unique ids, the 22 pins and a reason for every other single-read scope", () => {
  const file = parsed();
  assert.equal(SCOPES.length, FILE_SETS.length * TASKS_PINNED.length);
  assert.deepEqual(file.scopes.map(scope => scope.name), SCOPES.map(scope => scope.name), "every scope once, in the tool's order");
  assert.equal(new Set(file.scopes.map(scope => scope.name)).size, 108);
  for (const scope of file.scopes) {
    assert.deepEqual(scope.ids, [...new Set(scope.ids)].sort(), `${scope.name}: ids sorted and unique`);
    assert.ok(scope.ids.length > 0, `${scope.name}: a scope that selects nothing records nothing — the always core is always there`);
  }
  const single = file.scopes.filter(scope => SINGLE_READ_TASKS.includes(scope.tasks[0]));
  assert.equal(single.length, 48);
  assert.equal(Object.keys(ONE_READ).length, 48);
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

test("the tool prints the bytes table and refuses an unknown argument with usage", t => {
  const { tool } = toolCopy(t);
  const bytes = tool("--bytes");
  assert.equal(bytes.status, 0, bytes.stderr);
  assert.equal(bytes.stdout, `${bytesTable(loadCatalog(sourceRoot))}\n`);
  assert.match(bytes.stdout, /^\| Files \| inspect \| ui \| gpu \| storage \| implement \| test \| audit \| logging \| dependencies \|$/m);
  assert.match(bytes.stdout, /^\| \(no file\) \| [\d,]+ \|/m);
  const usage = tool("--nope");
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /usage/i);
});

test("the matrix carries no gate declaration at E1", () => {
  // E1 ships the schema and the check, empty of entries. When the first epic writes a record this becomes "every gate
  // record belongs to a landed or unlanded owning epic": each record's epic is E2..E6, and an epic in LANDED_EPICS has
  // its rule in the catalog.
  assert.deepEqual(parsed().gates, {});
  assert.deepEqual(GATES, {});
});
