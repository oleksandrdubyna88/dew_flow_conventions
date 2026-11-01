// The two lock fixtures (E1.S4b): a lock that does not satisfy its manifest must FAIL the install, not heal itself.
//
//   npm    package.json asks picomatch 4.0.6, package-lock.json says 4.0.7:  `npm ci --offline`  -> EUSAGE.
//          The 4.0.6 is a local stub (`file:./picomatch`), not a registry version: resolving a registry spec needs its
//          packument, which an offline run with an empty cache does not have (ENOTCACHED, measured), while a local
//          directory resolves from disk and the refusal text is the same.
//   NuGet  an app restored with a lock file, then a project reference added:  a locked restore   -> NU1004,
//          and after `--force-evaluate` a locked restore passes.
//
// Both refusals are offline: npm reads the lock and refuses before any fetch, and the NuGet fixture has a project reference
// and no package, so no package source is contacted. Every command runs in a copy under an owned folder with a cleared
// environment, its own HOME and its own package caches; nothing is written to the checkout or to the user's real caches.
//
// The NuGet case needs the SDK the fixture's global.json asks for, and "usable" is judged INSIDE the copied fixture, where
// that file applies: an image that carries only other SDK bands has no compatible SDK for this fixture. Under CI that is a
// FAILURE, not a skip: the point of the case is that it runs there. The jobs that do not pin the SDK (`tools · selftest`, the
// SonarCloud scan) name the dedicated job in `LOCK_FIXTURES_JOB`, where the case defers by name; it runs, never skipped, in
// `tools · lock fixtures`. Locally, with no compatible SDK, it is a named skip.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";

import { ownedDir } from "./lib/owned.mjs";
import { GUARD_MS } from "./lib/startup-ceilings.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = path.join(sourceRoot, "tools/fixtures/locks");
const JOB = "tools · lock fixtures";

/** What the NuGet case does: run, skip with a name, or fail. A pure function so the table can be asserted. */
function nugetPlan({ dotnetUsable, env }) {
  if (env.LOCK_FIXTURES_JOB) return { skip: `runs in the required ${JOB} job` };
  if (dotnetUsable) return { run: true };
  if (env.CI) return { fail: "dotnet SDK missing under CI — the NU1004 fixture must run here" };
  return { skip: `no compatible dotnet SDK for the fixture's global.json — NU1004 not exercised locally; CI's ${JOB} job runs it` };
}

// A cleared environment plus PATH: nothing of the developer's configuration (registries, proxies, caches) leaks in.
function cleanEnv(t) {
  const home = ownedDir(t, "lock fixture home");
  const cache = ownedDir(t, "lock fixture cache");
  const packages = ownedDir(t, "lock fixture nuget");
  const tmp = ownedDir(t, "lock fixture tmp");
  return {
    PATH: process.env.PATH, HOME: home, npm_config_cache: cache, NUGET_PACKAGES: packages,
    // Scratch files npm, dotnet and the MSBuild children write land in an owned folder, not in the shared temp root
    // (common/test-leftovers.md section 2: a child that makes temp paths of its own is handed an owned folder).
    TMPDIR: tmp, TEMP: tmp, TMP: tmp,
    DOTNET_CLI_TELEMETRY_OPTOUT: "1", DOTNET_NOLOGO: "1", DOTNET_SKIP_FIRST_TIME_EXPERIENCE: "1",
  };
}
const run = (command, args, cwd, env) => spawnSync(command, args, { cwd, env, encoding: "utf8", timeout: GUARD_MS, maxBuffer: 4 * 1024 * 1024 });

function copyOf(t, name) {
  const from = path.join(FIXTURES, name);
  assert.ok(fs.existsSync(from), `tools/fixtures/locks/${name} is missing — E1.S4b writes it`);
  const root = ownedDir(t, "lock fixture");
  fs.cpSync(from, root, { recursive: true });
  return root;
}

test("an npm lock that does not satisfy package.json fails `npm ci --offline` with EUSAGE", t => {
  const root = copyOf(t, "npm-unsatisfied");
  const result = run("npm", ["ci", "--ignore-scripts", "--offline"], root, cleanEnv(t));
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /EUSAGE/);
  assert.match(result.stderr, /does not satisfy picomatch@4\.0\.6/);
  assert.equal(fs.existsSync(path.join(root, "node_modules")), false, "a refused install writes nothing");
});

test("the npm fixture is a real mismatch, not an unrelated failure: the same project with an honest lock installs", t => {
  const root = copyOf(t, "npm-unsatisfied");
  const honest = {
    name: "probe", version: "1.0.0", lockfileVersion: 3, requires: true,
    packages: {
      "": { name: "probe", version: "1.0.0", devDependencies: { picomatch: "file:./picomatch" } },
      "node_modules/picomatch": { resolved: "picomatch", link: true },
      picomatch: { version: "4.0.6", dev: true },
    },
  };
  fs.writeFileSync(path.join(root, "package-lock.json"), `${JSON.stringify(honest, null, 2)}\n`);
  const result = run("npm", ["ci", "--ignore-scripts", "--offline"], root, cleanEnv(t));
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.doesNotMatch(result.stderr, /EUSAGE/);
});

test("a NuGet lock made stale by a project reference fails a locked restore with NU1004 and passes after --force-evaluate", t => {
  const env = cleanEnv(t);
  const root = copyOf(t, "nuget-stale");
  // Probed where global.json applies: "an SDK exists" is not "a compatible SDK exists".
  const version = run("dotnet", ["--version"], root, env);
  const plan = nugetPlan({ dotnetUsable: version.status === 0 && !version.error, env: process.env });
  if (plan.skip) { t.skip(plan.skip); return; }
  if (plan.fail) assert.fail(plan.fail);

  const app = path.join(root, "app");
  const restore = (...extra) => run("dotnet", ["restore", "-m:4", "--disable-build-servers", ...extra], app, env);
  const shown = result => `${result.stdout}\n${result.stderr}`;

  const first = restore();
  assert.equal(first.status, 0, shown(first));
  assert.ok(fs.existsSync(path.join(app, "packages.lock.json")), "the first restore writes the lock file");

  const project = path.join(app, "app.csproj");
  fs.writeFileSync(project, fs.readFileSync(project, "utf8").replace("</Project>", '  <ItemGroup>\n    <ProjectReference Include="../lib/lib.csproj" />\n  </ItemGroup>\n</Project>'));
  const stale = restore("--locked-mode");
  assert.equal(stale.status, 1, shown(stale));
  assert.match(shown(stale), /NU1004/);

  const forced = restore("--force-evaluate");
  assert.equal(forced.status, 0, shown(forced));
  const locked = restore("--locked-mode");
  assert.equal(locked.status, 0, shown(locked));
  assert.notEqual(env.TMPDIR, env.HOME);
  assert.equal(path.dirname(env.TMPDIR), path.dirname(env.HOME), "TMPDIR is a sibling of the owned HOME, not the shared temp root itself");
  assert.deepEqual([env.TEMP, env.TMP], [env.TMPDIR, env.TMPDIR]);
  assert.ok(fs.readdirSync(env.TMPDIR).length > 0, "the SDK's scratch files went to the owned TMPDIR, not the shared temp root");
});

test("the NuGet case runs, skips by name or fails by the environment — never silently", () => {
  const cases = [
    [{ dotnetUsable: true, env: {} }, { run: true }],
    [{ dotnetUsable: false, env: {} }, { skip: `no compatible dotnet SDK for the fixture's global.json — NU1004 not exercised locally; CI's ${JOB} job runs it` }],
    [{ dotnetUsable: false, env: { CI: "true" } }, { fail: "dotnet SDK missing under CI — the NU1004 fixture must run here" }],
    [{ dotnetUsable: false, env: { CI: "true", LOCK_FIXTURES_JOB: JOB } }, { skip: `runs in the required ${JOB} job` }],
    [{ dotnetUsable: true, env: { CI: "true", LOCK_FIXTURES_JOB: JOB } }, { skip: `runs in the required ${JOB} job` }],
  ];
  for (const [input, expected] of cases) assert.deepEqual(nugetPlan(input), expected, JSON.stringify(input));
});

test("the lock fixtures run in a required job on release: sha-pinned setup-dotnet, the selftest names the job, main is untouched", () => {
  const workflow = parse(fs.readFileSync(path.join(sourceRoot, ".github/workflows/ci.yml"), "utf8"));
  const locks = workflow.jobs.locks;
  assert.ok(locks, "ci.yml has a `locks` job");
  assert.equal(locks.name, JOB);
  const dotnet = locks.steps.find(step => String(step.uses ?? "").startsWith("actions/setup-dotnet@"));
  assert.ok(dotnet, "the job installs the SDK with actions/setup-dotnet");
  assert.match(dotnet.uses, /^actions\/setup-dotnet@[0-9a-f]{40}$/, "pinned by a 40-hex sha");
  assert.equal(dotnet.with["global-json-file"], "tools/fixtures/locks/nuget-stale/global.json");
  const text = fs.readFileSync(path.join(sourceRoot, ".github/workflows/ci.yml"), "utf8");
  assert.match(text, /actions\/setup-dotnet@a98b56852c35b8e3190ac28c8c2271da59106c68 # v6\.0\.0/);
  for (const [name, job] of Object.entries(workflow.jobs)) {
    for (const step of job.steps ?? []) if (step.uses) assert.match(step.uses, /@[0-9a-f]{40}$/, `${name}: ${step.uses} is pinned by a 40-hex sha`);
  }
  assert.ok(JSON.stringify(locks.steps).includes("node --test tools/lock-fixtures.test.mjs"));
  const selftest = workflow.jobs.tools.steps.find(step => step.name === "Selftest");
  assert.equal(selftest.env.LOCK_FIXTURES_JOB, JOB, "the selftest job names the dedicated job so the NuGet case defers by name");

  const protection = JSON.parse(fs.readFileSync(path.join(sourceRoot, ".github/branch-protection.json"), "utf8"));
  assert.deepEqual(protection.branches.release.required_status_checks.contexts, ["tools · selftest", "workflows · actionlint", JOB]);
  assert.ok(!protection.branches.main.required_status_checks.contexts.includes(JOB), "main is untouched: adding it there would be a plan change");
});

test("the required job never skips the NuGet case: LOCK_FIXTURES_JOB is in no env that reaches the locks job", () => {
  const workflow = parse(fs.readFileSync(path.join(sourceRoot, ".github/workflows/ci.yml"), "utf8"));
  assert.ok(!Object.hasOwn(workflow.env ?? {}, "LOCK_FIXTURES_JOB"), "not at workflow level: it would reach the locks job and skip its own case");
  const locks = workflow.jobs.locks;
  assert.ok(!Object.hasOwn(locks.env ?? {}, "LOCK_FIXTURES_JOB"), "not in the locks job env");
  for (const step of locks.steps) assert.ok(!Object.hasOwn(step.env ?? {}, "LOCK_FIXTURES_JOB"), `not in the env of the step ${step.name ?? step.uses}`);
  // The jobs that run the whole suite without the pinned SDK name the dedicated job, so the case defers by name there.
  for (const file of ["ci.yml", "sonarcloud.yml"]) {
    const other = parse(fs.readFileSync(path.join(sourceRoot, ".github/workflows", file), "utf8"));
    const steps = Object.entries(other.jobs).filter(([name]) => name !== "locks").flatMap(([, job]) => job.steps ?? []);
    const runsSuite = steps.filter(step => /npm (run )?test/.test(step.run ?? ""));
    assert.ok(runsSuite.length > 0, `${file} runs the suite somewhere — otherwise this check proves nothing`);
    for (const step of runsSuite) assert.equal(step.env?.LOCK_FIXTURES_JOB, JOB, `${file}: the step ${step.name} runs the suite and must name ${JOB}`);
  }
});
