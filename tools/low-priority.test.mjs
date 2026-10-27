import {test} from "node:test";
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {setTimeout as delay} from "node:timers/promises";
import {ownedDir} from "./lib/owned.mjs";
import {chainFailure, runChain} from "./lib/idle-chain.mjs";

// OPT-IN: one case below starts a chain of processes at the IDLE class, which gets no CPU while anything at a
// higher class wants the core — on a busy machine it can take as long as the machine stays busy, and `npm test`
// must not wait on that. It runs only when LOW_PRIORITY_E2E=1 is set:
//   LOW_PRIORITY_E2E=1 node --test --test-concurrency=1 tools/low-priority.test.mjs
// The decision it checks ("an Idle caller is never raised") is also tested without any Idle process, in the
// default suite, through the fake host below.

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

/** A stand-in for `os` that remembers every setPriority call, so the decision can be read without a process. */
function fakeHost(start) {
  const host = {level: start, sets: [], getPriority: () => host.level, setPriority: (pid, level) => { host.sets.push([pid, level]); host.level = level; }};
  return host;
}

// The "never raised" decision, checked on every platform and with no process started at Idle. The
// real-process case below cannot be the only guard: a process at Idle gets no CPU while anything at
// a higher class wants the core, so on a busy machine its start-up alone outlasts any timeout.
test("lowerOwnPriority: a caller already lower than the target is never raised (decision, no process)", async () => {
  const {lowerOwnPriority} = await import(new URL("./low-priority.mjs", import.meta.url).href);
  const idle = fakeHost(19);
  assert.equal(lowerOwnPriority({}, idle, 10), 19);
  assert.deepEqual(idle.sets, [], "an Idle caller must not be moved up to the target");
  const equal = fakeHost(10);
  assert.equal(lowerOwnPriority({}, equal, 10), 10);
  assert.deepEqual(equal.sets, [], "a caller already at the target is left alone");
});

test("lowerOwnPriority: a caller above the target is lowered, once, to the target; under CI it is left alone", async () => {
  const {lowerOwnPriority} = await import(new URL("./low-priority.mjs", import.meta.url).href);
  const normal = fakeHost(0);
  assert.equal(lowerOwnPriority({}, normal, 10), 10);
  assert.deepEqual(normal.sets, [[0, 10]]);
  const ci = fakeHost(0);
  assert.equal(lowerOwnPriority({CI: "true"}, ci, 10), 0);
  assert.deepEqual(ci.sets, []);
});

// How long the opt-in real-process case may take. It measures a PRIORITY, not a speed: starvation delays
// the answer but never changes it, so the bound only stops a hung run. 30 s was measured too short: with one
// Normal-priority busy loop on the same core the Idle chain got no CPU for as long as the loop ran. At the
// bound the whole tree is killed by pid (tools/lib/idle-chain.mjs), and only ETIMEDOUT is called starvation.
const IDLE_CHAIN_BUDGET_MS = 180_000;

test("a caller that is already lower than the target is never raised (real processes, Windows, opt-in LOW_PRIORITY_E2E=1)", async (t) => {
  // Idle (Windows) / nice 19: there is nothing lower to start from on POSIX, so the case only has
  // teeth on Windows, where Idle is below the BelowNormal the wrapper would otherwise set.
  if (process.env.LOW_PRIORITY_E2E !== "1") { t.skip("opt-in: set LOW_PRIORITY_E2E=1 (an Idle-class chain starves on a busy machine)"); return; }
  if (!windows) { t.skip("POSIX has no level below nice 19 to start from"); return; }
  const outer = `require('node:os').setPriority(0,${os.constants.priority.PRIORITY_LOW});`
    + `const r=require('node:child_process').spawnSync(process.execPath,${JSON.stringify([tool, "node", "-e", tree])},{stdio:'inherit'});process.exitCode=r.status;`;
  t.diagnostic(`starting the Idle-class chain with a ${IDLE_CHAIN_BUDGET_MS} ms ceiling; a busy machine may starve it of CPU until then`);
  const result = await runChain(process.execPath, ["-e", outer], {budgetMs: IDLE_CHAIN_BUDGET_MS, env: env()});
  assert.equal(result.status, 0, chainFailure(result, IDLE_CHAIN_BUDGET_MS));
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
  const dir = ownedDir(t, "low-priority-shim");
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

test("a child ended by a signal that cannot be re-raised still reads as a signal, never as exit 1", async () => {
  const {exitCodeFor} = await import(new URL("./low-priority.mjs", import.meta.url).href);
  assert.equal(exitCodeFor(37, null), 37);
  assert.equal(exitCodeFor(0, null), 0);
  // The shell convention, 128 + the signal number, so a caller can tell `kill` from `exit(1)`.
  assert.equal(exitCodeFor(null, "SIGTERM"), 128 + os.constants.signals.SIGTERM);
  assert.equal(exitCodeFor(null, "SIGKILL"), 128 + os.constants.signals.SIGKILL);
  assert.equal(exitCodeFor(null, null), 1);
});

// The Windows launch decisions are pure, so they are checked on every platform — CI runs Linux, and
// the real-process shim case above only runs where cmd.exe exists.
test("launch plan: node is this node, a POSIX command runs as given", async () => {
  const {launchPlan} = await import(new URL("./low-priority.mjs", import.meta.url).href);
  assert.deepEqual(launchPlan("node", ["-v"]), [process.execPath, ["-v"], {}]);
  assert.deepEqual(launchPlan("npm", ["test"], {}, "/", "linux"), ["npm", ["test"], {}]);
});

test("launch plan on Windows: PATHEXT finds the shim, cmd.exe runs it, an .exe runs directly", async (t) => {
  const {launchPlan, resolveWindowsCommand} = await import(new URL("./low-priority.mjs", import.meta.url).href);
  const dir = ownedDir(t, "low-priority-plan");
  fs.writeFileSync(path.join(dir, "probe.cmd"), "");
  fs.writeFileSync(path.join(dir, "tool.exe"), "");
  const env = {PATH: dir, PATHEXT: ".EXE;.CMD", ComSpec: "C:\\Windows\\System32\\cmd.exe"};

  assert.equal(resolveWindowsCommand("probe", env, dir), path.join(dir, "probe.cmd"));
  assert.equal(resolveWindowsCommand("tool", env, dir), path.join(dir, "tool.exe"));
  assert.equal(resolveWindowsCommand("./probe", {PATHEXT: ".CMD"}, dir), path.join(dir, "probe.cmd"));
  assert.equal(resolveWindowsCommand("absent", env, dir), "");

  assert.deepEqual(launchPlan("tool", ["x"], env, dir, "win32"), [path.join(dir, "tool.exe"), ["x"], {}]);
  assert.deepEqual(launchPlan("absent", [], env, dir, "win32"), ["", [], {}]);
  const [file, args, extra] = launchPlan("probe", ["a b", "x&y"], env, dir, "win32");
  assert.equal(file, env.ComSpec);
  assert.deepEqual(args.slice(0, 3), ["/d", "/s", "/c"]);
  assert.deepEqual(extra, {windowsVerbatimArguments: true});
  // The batch path is escaped once, every argument twice (a shim re-parses %*).
  assert.ok(args[3].includes('^^^"a^^^ b^^^"'), args[3]);
  assert.ok(args[3].includes('^^^"x^^^&y^^^"'), args[3]);
});

test("quoting for cmd: CRT rules first, then every metacharacter caret-escaped", async () => {
  const {quoteForCmd} = await import(new URL("./low-priority.mjs", import.meta.url).href);
  assert.equal(quoteForCmd("plain"), '^"plain^"');
  assert.equal(quoteForCmd('a"b'), '^"a\\^"b^"');
  assert.equal(quoteForCmd("trail\\"), '^"trail\\\\^"');
  assert.equal(quoteForCmd("100%"), '^"100^%^"');
  assert.equal(quoteForCmd("x", true), '^^^"x^^^"');
});

test("CI is any value but an explicit false", async () => {
  const {isCi} = await import(new URL("./low-priority.mjs", import.meta.url).href);
  for (const value of ["true", "1", "yes", "TRUE"]) assert.equal(isCi({CI: value}), true, value);
  for (const value of [undefined, "", "false", "0", " FALSE "]) assert.equal(isCi({CI: value}), false, String(value));
});

test("this repository's own runner caps node --test at min(8, CPUs - 1) — never a raise on a small machine", async () => {
  const {testConcurrency, CAP} = await import(new URL("./run-tests.mjs", import.meta.url).href);
  assert.equal(CAP, 8);
  // A 4-vCPU CI runner keeps node's own default of 3; a 24-thread workstation is capped at 8; one thread still gets 1.
  assert.equal(testConcurrency(4), 3);
  assert.equal(testConcurrency(24), 8);
  assert.equal(testConcurrency(9), 8);
  assert.equal(testConcurrency(1), 1);
});

test("npm test and test:coverage go through the runner, so the cap and the lowering cannot be skipped", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(here, "..", "package.json"), "utf8"));
  assert.equal(pkg.scripts.test, "node tools/run-tests.mjs");
  assert.match(pkg.scripts["test:coverage"], /^node tools\/run-tests\.mjs --experimental-test-coverage /);
});

test("the runner leaves with the suite's exit code, and a signal never reads as a plain 1", async () => {
  const {runTests, testArgs} = await import(new URL("./run-tests.mjs", import.meta.url).href);
  const calls = [];
  const fake = result => (file, args) => { calls.push([file, args]); return result; };
  assert.equal(runTests(["--x"], fake({status: 0, signal: null})), 0);
  assert.equal(runTests([], fake({status: 3, signal: null})), 3);
  assert.equal(runTests([], fake({status: null, signal: "SIGTERM"})), 128 + os.constants.signals.SIGTERM);
  assert.equal(runTests([], fake({error: new Error("spawn failed")})), 1);
  assert.equal(calls[0][0], process.execPath);
  assert.deepEqual(calls[0][1], testArgs(["--x"]));
  assert.deepEqual(testArgs(["--x"], 4), ["--test", "--test-concurrency=3", "--x"]);
});

/** The `[key, value]` pairs of git's environment config list (`GIT_CONFIG_COUNT`, `GIT_CONFIG_KEY_<n>`, `GIT_CONFIG_VALUE_<n>`), read back by count. */
function gitConfigPairs(env) {
  const count = Number.parseInt(env.GIT_CONFIG_COUNT ?? "0", 10);
  const pairs = [];
  for (let n = 0; n < (Number.isInteger(count) && count > 0 ? count : 0); n++) pairs.push([env[`GIT_CONFIG_KEY_${n}`], env[`GIT_CONFIG_VALUE_${n}`]]);
  return pairs;
}

test("the suite's child process gets an environment in which git's automatic maintenance is off", async () => {
  const {runTests} = await import(new URL("./run-tests.mjs", import.meta.url).href);
  const calls = [];
  runTests([], (file, args, options) => { calls.push(options); return {status: 0, signal: null}; });
  assert.equal(calls[0].stdio, "inherit");
  assert.ok(calls[0].env, "runTests hands the child an explicit env");
  assert.ok(gitConfigPairs(calls[0].env).some(([key, value]) => key === "maintenance.auto" && value === "false"));
});

test("testEnv appends to git's config list, keeps what is there, and never mutates its input", async () => {
  const {testEnv} = await import(new URL("./run-tests.mjs", import.meta.url).href);
  const input = {PATH: "/x", GIT_CONFIG_COUNT: "2", GIT_CONFIG_KEY_0: "a.b", GIT_CONFIG_VALUE_0: "1", GIT_CONFIG_KEY_1: "c.d", GIT_CONFIG_VALUE_1: "2"};
  const snapshot = {...input};
  const out = testEnv(input);
  assert.deepEqual(input, snapshot);
  assert.notEqual(out, input);
  assert.equal(out.PATH, "/x");
  assert.deepEqual(gitConfigPairs(out), [["a.b", "1"], ["c.d", "2"], ["maintenance.auto", "false"]]);
  for (const bad of [undefined, "", "abc", "-3", "1.5"]) {
    const env = bad === undefined ? {} : {GIT_CONFIG_COUNT: bad};
    assert.deepEqual(gitConfigPairs(testEnv(env)), [["maintenance.auto", "false"]], `count ${JSON.stringify(bad)} reads as 0`);
  }
});

test("EFFECT: with testEnv, a commit in a real repository starts no automatic git maintenance", async (t) => {
  const {testEnv} = await import(new URL("./run-tests.mjs", import.meta.url).href);
  const dir = ownedDir(t, "git-maintenance");
  const base = {...process.env};
  for (const key of Object.keys(base)) if (key.startsWith("GIT_")) delete base[key];
  const git = (args, env) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "-c", "commit.gpgsign=false", ...args], {cwd: dir, env, encoding: "utf8"});
  assert.equal(git(["init", "-q"], base).status, 0);
  const trace = env => {
    const run = git(["commit", "--allow-empty", "-q", "-m", "x"], {...env, GIT_TRACE: "1"});
    assert.equal(run.status, 0, run.stderr);
    return run.stderr;
  };
  const plain = trace(base);
  if (!/maintenance run/.test(plain)) { t.skip("this git starts no auto maintenance after a commit"); return; }
  assert.doesNotMatch(trace(testEnv(base)), /maintenance run/);
});
