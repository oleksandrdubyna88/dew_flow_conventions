import {test} from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

// The preload a consumer copies is executable policy: when may it fall back, and when must it fail?
// Each case builds a throwaway consumer — scripts/lower-priority.mjs from the template, and a mount
// that is present, absent, or broken — and runs `node --import` exactly as a package.json would.

const here = path.dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(path.join(here, "templates", "lower-priority-preload.mjs"), "utf8");
const tool = fs.readFileSync(path.join(here, "low-priority.mjs"), "utf8");
const lowered = process.platform === "win32" ? os.constants.priority.PRIORITY_BELOW_NORMAL : 19;
const MOUNT_LINE = /^const MOUNT = new URL\("[^"]+", import\.meta\.url\);$/m;

function consumer(t, mount) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "low-priority-preload-"));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  fs.mkdirSync(path.join(root, "scripts"));
  assert.match(template, MOUNT_LINE, "the template must keep exactly one MOUNT line for consumers to edit");
  fs.writeFileSync(path.join(root, "scripts", "lower-priority.mjs"),
    template.replace(MOUNT_LINE, 'const MOUNT = new URL("../mount/tools/low-priority.mjs", import.meta.url);'));
  if (mount !== undefined) {
    fs.mkdirSync(path.join(root, "mount", "tools"), {recursive: true});
    fs.writeFileSync(path.join(root, "mount", "tools", "low-priority.mjs"), mount);
  }
  return root;
}

/** Runs `node --import ./scripts/lower-priority.mjs` printing its priority and a child's. */
function run(root, extraEnv = {}) {
  const env = {...process.env, ...extraEnv};
  if (!("CI" in extraEnv)) delete env.CI;
  delete env.LOW_PRIORITY_PRELOAD_NOTICE;
  const child = "require('node:child_process').spawnSync(process.execPath,['--import','./scripts/lower-priority.mjs','-e',\"console.log('child',require('node:os').getPriority(0))\"],{stdio:'inherit'})";
  return spawnSync(process.execPath, ["--import", "./scripts/lower-priority.mjs", "-e",
    `console.log('self',require('node:os').getPriority(0));${child}`], {cwd: root, encoding: "utf8", env, timeout: 30_000});
}

const seen = stdout => Object.fromEntries(stdout.trim().split(/\r?\n/).map(line => line.trim().split(/\s+/)).map(([k, v]) => [k, Number(v)]));

test("mount present: the process and its child run lowered, silently", t => {
  const result = run(consumer(t, tool));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(seen(result.stdout), {self: Math.max(os.getPriority(0), lowered), child: Math.max(os.getPriority(0), lowered)});
  assert.equal(result.stderr, "");
});

test("mount absent under CI: nothing is lowered and nothing is said", t => {
  const result = run(consumer(t), {CI: "true"});
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(seen(result.stdout), {self: os.getPriority(0), child: os.getPriority(0)});
  assert.equal(result.stderr, "");
});

test("mount absent locally: the run goes on unlowered and says so ONCE, not once per worker", t => {
  const result = run(consumer(t));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(seen(result.stdout), {self: os.getPriority(0), child: os.getPriority(0)});
  assert.equal(result.stderr.match(/NOT lowered/g)?.length, 1, result.stderr);
  assert.match(result.stderr, /submodule update --init/);
});

test("mount present but broken: the run fails instead of quietly running unlowered", t => {
  const result = run(consumer(t, "export function lowerOwnPriority( {"));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SyntaxError/);
});

test("mount present without the export: the run fails", t => {
  const result = run(consumer(t, "export const somethingElse = 1;\n"));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /lowerOwnPriority is not a function/);
});
