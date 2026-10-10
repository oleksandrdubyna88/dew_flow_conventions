import {test} from "node:test";
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {setTimeout as delay} from "node:timers/promises";

// The wrapper is tested the only way that means anything: through real processes. Every case starts
// `node low-priority.mjs …` and reads what the child and its own child report about themselves.

const here = path.dirname(fileURLToPath(import.meta.url));
const tool = path.join(here, "low-priority.mjs");
const windows = process.platform === "win32";
const lowered = windows ? os.constants.priority.PRIORITY_BELOW_NORMAL : 19;

/** The environment the wrapper sees: this one, minus `CI`, so the lowering is exercised on a runner too. */
function env(extra = {}) {
  const copy = {...process.env, ...extra};
  if (!("CI" in extra)) delete copy.CI;
  return copy;
}

function wrap(args, options = {}) {
  return spawnSync(process.execPath, [tool, ...args], {encoding: "utf8", timeout: 30_000, env: env(options.env), cwd: options.cwd});
}

/** A child that prints its own priority, then starts a grandchild that prints its own. */
const tree = [
  "const os=require('node:os');const {spawnSync}=require('node:child_process');",
  "console.log('child',os.getPriority(0));",
  "spawnSync(process.execPath,['-e',\"console.log('grandchild',require('node:os').getPriority(0))\"],{stdio:'inherit'});",
].join("");

function priorities(stdout) {
  return Object.fromEntries(stdout.trim().split(/\r?\n/).map(line => line.trim().split(/\s+/)).map(([who, value]) => [who, Number(value)]));
}

test("the child's exit code is the wrapper's exit code", () => {
  const result = wrap(["node", "-e", "process.exitCode=37"]);
  assert.equal(result.status, 37, result.stderr);
});

test("stdout and stderr reach the caller separately and complete", () => {
  const result = wrap(["node", "-e", "process.stdout.write('out-'.repeat(5000));process.stderr.write('err-line\\n')"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "out-".repeat(5000));
  assert.equal(result.stderr, "err-line\n");
});

test("the child and the grandchild both run at the lowered priority", () => {
  const before = os.getPriority(0);
  const result = wrap(["node", "-e", tree]);
  assert.equal(result.status, 0, result.stderr);
  const seen = priorities(result.stdout);
  const expected = Math.max(before, lowered);
  assert.equal(seen.child, expected, result.stdout);
  assert.equal(seen.grandchild, expected, result.stdout);
});

test("under CI nothing is lowered — the child keeps the caller's priority", () => {
  const before = os.getPriority(0);
  const result = wrap(["node", "-e", tree], {env: {CI: "true"}});
  assert.equal(result.status, 0, result.stderr);
  const seen = priorities(result.stdout);
  assert.equal(seen.child, before, result.stdout);
  assert.equal(seen.grandchild, before, result.stdout);
});

test("a caller that is already lower than the target is never raised", (t) => {
  // Idle (Windows) / nice 19: there is nothing lower to start from on POSIX, so the case only has
  // teeth on Windows, where Idle is below the BelowNormal the wrapper would otherwise set.
  if (!windows) { t.skip("POSIX has no level below nice 19 to start from"); return; }
  const outer = `require('node:os').setPriority(0,${os.constants.priority.PRIORITY_LOW});`
    + `const r=require('node:child_process').spawnSync(process.execPath,${JSON.stringify([tool, "node", "-e", tree])},{stdio:'inherit'});process.exitCode=r.status;`;
  const result = spawnSync(process.execPath, ["-e", outer], {encoding: "utf8", timeout: 30_000, env: env()});
  assert.equal(result.status, 0, result.stderr);
  const seen = priorities(result.stdout);
  assert.equal(seen.child, os.constants.priority.PRIORITY_LOW, result.stdout);
  assert.equal(seen.grandchild, os.constants.priority.PRIORITY_LOW, result.stdout);
});

test("a command that does not exist exits 127 and says which", () => {
  const result = wrap(["no-such-command-low-priority-7731"]);
  assert.equal(result.status, 127);
  assert.match(result.stderr, /no-such-command-low-priority-7731/);
});

test("no command prints the usage and exits 2", () => {
  const result = wrap([]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage/i);
});

test("a .cmd shim found on PATH receives its arguments intact, spaces and quotes included", (t) => {
  if (!windows) { t.skip("command shims are a Windows concern"); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "low-priority-shim-"));
  try {
    const argsFile = path.join(dir, "argv.json");
    fs.writeFileSync(path.join(dir, "argv.js"), `require('node:fs').writeFileSync(${JSON.stringify(argsFile)},JSON.stringify(process.argv.slice(2)));process.exitCode=5;`);
    // The shape npm writes for its own shims: forward every argument to node.
    fs.writeFileSync(path.join(dir, "shimprobe.cmd"), `@"${process.execPath}" "%~dp0argv.js" %*\r\n`);
    // The matrix a consultant ran against npm.cmd, npx.cmd and a node_modules/.bin shim on
    // 2026-10-10, kept as the regression set: nothing here may be expanded, split or dropped.
    const args = ["two words", "plain", "with\"quote", "a&b", "100%", "%PATH%", "!PATH!", "", "trail\\", "a^b", "(x)", "x|y", "<in>"];
    const result = wrap(["shimprobe", ...args], {env: {PATH: `${dir}${path.delimiter}${process.env.PATH}`}});
    assert.equal(result.status, 5, result.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(argsFile, "utf8")), args);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});

test("terminating the wrapper ends the child AND its child — no orphan keeps the CPU", async (t) => {
  if (windows) { t.skip("a POSIX signal case; on Windows the tree is ended with taskkill /T"); return; }
  // wrapper → child → grandchild, the shape of `wrapper → npm → test workers`. The child does not
  // pass signals on, which is exactly the middle process the group kill exists for.
  const script = "const {spawn}=require('node:child_process');"
    + "const g=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});"
    + "console.log(process.pid+' '+g.pid);setInterval(()=>{},1000);";
  const wrapper = spawn(process.execPath, [tool, "node", "-e", script], {env: env(), stdio: ["ignore", "pipe", "pipe"]});
  const pids = await new Promise((resolve, reject) => {
    wrapper.stdout.once("data", chunk => resolve(String(chunk).trim().split(/\s+/).map(Number)));
    wrapper.once("exit", code => reject(new Error(`wrapper exited early with ${code}`)));
  });
  assert.equal(pids.length, 2, String(pids));
  const exited = new Promise(resolve => wrapper.once("exit", (code, signal) => resolve({code, signal})));
  wrapper.kill("SIGTERM");
  const outcome = await exited;
  assert.ok(outcome.signal === "SIGTERM" || outcome.code === 143, JSON.stringify(outcome));
  for (const pid of pids) {
    const deadline = performance.now() + 5000;
    for (;;) {
      try { process.kill(pid, 0); } catch (error) { if (error.code === "ESRCH") break; throw error; }
      if (performance.now() > deadline) assert.fail(`process ${pid} outlived its wrapper`);
      await delay(25);
    }
  }
});

test("the exported lowerOwnPriority lowers the calling process and reports the level", () => {
  const script = `import(${JSON.stringify(new URL("./low-priority.mjs", import.meta.url).href)}).then(m=>{const level=m.lowerOwnPriority();console.log(level, require('node:os').getPriority(0));});`;
  const result = spawnSync(process.execPath, ["-e", script], {encoding: "utf8", timeout: 30_000, env: env()});
  assert.equal(result.status, 0, result.stderr);
  const [reported, actual] = result.stdout.trim().split(/\s+/).map(Number);
  assert.equal(actual, Math.max(os.getPriority(0), lowered));
  assert.equal(reported, actual);
});

test("signals: on a terminal Ctrl+C is not delivered twice; off it the whole group is signalled", async () => {
  const {signalPlan} = await import(new URL("./low-priority.mjs", import.meta.url).href);
  // A terminal already sends SIGINT/SIGHUP to the whole foreground group, child included, so
  // forwarding them again would interrupt the child's own cleanup with a second signal.
  assert.deepEqual(signalPlan("linux", true), {ownGroup: false, forward: ["SIGTERM"], absorb: ["SIGINT", "SIGHUP"]});
  assert.deepEqual(signalPlan("linux", false), {ownGroup: true, forward: ["SIGINT", "SIGTERM", "SIGHUP"], absorb: []});
  assert.deepEqual(signalPlan("darwin", false), {ownGroup: true, forward: ["SIGINT", "SIGTERM", "SIGHUP"], absorb: []});
  assert.deepEqual(signalPlan("win32", true), {ownGroup: false, forward: [], absorb: ["SIGINT", "SIGBREAK"]});
  assert.deepEqual(signalPlan("win32", false), {ownGroup: false, forward: [], absorb: ["SIGINT", "SIGBREAK"]});
});
