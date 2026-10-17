import {test} from "node:test";
import assert from "node:assert/strict";
import {setTimeout as delay} from "node:timers/promises";
import {chainFailure, runChain} from "./lib/idle-chain.mjs";

// The helper behind the opt-in real-process case in low-priority.test.mjs. Neither test here starts an Idle process.

test("starvation is reported for the ceiling being reached — and only for it", () => {
  const starved = chainFailure({status: null, signal: null, error: {code: "ETIMEDOUT"}, stdout: "", stderr: ""}, 180000);
  assert.match(starved, /starved of CPU/);
  assert.match(starved, /180000 ms/);
  assert.match(starved, /ETIMEDOUT/);
});

test("a spawn error, a signal and a plain exit are never called starvation", () => {
  // The shape runChain really emits: a spawn failure carries a code, nothing else.
  const enoent = chainFailure({status: null, signal: null, error: {code: "ENOENT"}, stdout: "", stderr: ""}, 1000);
  assert.match(enoent, /ENOENT/);
  const emfile = chainFailure({status: null, signal: null, error: {code: "EMFILE"}, stdout: "", stderr: ""}, 1000);
  assert.match(emfile, /EMFILE/);
  const signalled = chainFailure({status: null, signal: "SIGKILL", error: undefined, stdout: "", stderr: ""}, 1000);
  assert.match(signalled, /signal SIGKILL/);
  const failed = chainFailure({status: 3, signal: null, error: undefined, stdout: "", stderr: "boom"}, 1000);
  assert.match(failed, /status 3/);
  assert.match(failed, /boom/);
  for (const text of [enoent, emfile, signalled, failed]) assert.doesNotMatch(text, /starv/i);
});

// Known limit: this returns at the FIRST ESRCH. A pid the OS reused before the first poll would make
// `process.kill(pid, 0)` succeed on a stranger and could keep the exit from being seen at all; the window
// is a few milliseconds after the kill and the failure mode is a false "outlived", never a false pass.
async function assertGone(pid) {
  const deadline = performance.now() + 5000;
  do {
    try { process.kill(pid, 0); } catch (error) { if (error.code === "ESRCH") return; throw error; }
    await delay(25);
  } while (performance.now() < deadline);
  assert.fail(`process ${pid} outlived the chain's ceiling`);
}

// The ceiling includes the supervisor's and node's own start-up, which a loaded machine stretches without
// limit (the full suite took 11 s to print two pids once). So the ceiling is tried small first and widened
// only when the stub never got to print: the kill is then checked on a run that really was in flight.
const BUDGETS_MS = [8000, 30000, 120000];

function pidsOf(result) {
  return result.stdout.split(/\s+/).filter(Boolean).map(Number);
}

async function runStubChain(t) {
  // chain → child → grandchild, the child sleeping like the Idle chain would while starved.
  const script = "const {spawn}=require('node:child_process');"
    + "const g=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});"
    + "console.log(process.pid+' '+g.pid);setInterval(()=>{},1000);";
  let result;
  for (const budgetMs of BUDGETS_MS) {
    result = await runChain(process.execPath, ["-e", script], {budgetMs});
    assert.equal(result.error?.code, "ETIMEDOUT", chainFailure(result, budgetMs));
    if (pidsOf(result).length === 2) break;
    const next = BUDGETS_MS[BUDGETS_MS.indexOf(budgetMs) + 1];
    t.diagnostic(next === undefined
      ? `the stub chain printed no pids within ${budgetMs} ms, the last ceiling`
      : `the stub chain printed no pids within ${budgetMs} ms; widening the ceiling to ${next} ms`);
  }
  return result;
}

test("at the ceiling the WHOLE tree is killed: a sleeping child and grandchild do not survive", async (t) => {
  const result = await runStubChain(t);
  const pids = pidsOf(result);
  assert.equal(pids.length, 2, `the stub chain never printed its pids, even at ${BUDGETS_MS.at(-1)} ms: ${JSON.stringify(result.stdout)}`);
  for (const pid of pids) await assertGone(pid);
});

test("a chain that ends in time reports its own status, output and no error", async () => {
  const result = await runChain(process.execPath, ["-e", "console.log('c 19');process.exitCode=0"], {budgetMs: 30000});
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "c 19");
});

test("a child that kills itself with SIGTERM reports the signal, a null status and no error (POSIX)", async (t) => {
  if (process.platform === "win32") { t.skip("Windows has no POSIX signals: a self-kill there is an ordinary exit code"); return; }
  const result = await runChain(process.execPath, ["-e", "process.kill(process.pid,'SIGTERM');setInterval(()=>{},1000)"], {budgetMs: 30000});
  assert.equal(result.error, undefined);
  assert.equal(result.signal, "SIGTERM");
  assert.equal(result.status, null);
  assert.match(chainFailure(result, 30000), /signal SIGTERM/);
  assert.doesNotMatch(chainFailure(result, 30000), /starv/i);
});

test("output past the capture limit is EOVERFLOW, not starvation, and the tree is killed", async () => {
  const result = await runChain(process.execPath, ["-e", "process.stdout.write('x'.repeat(200000));setInterval(()=>{},1000)"], {budgetMs: 60000, maxOutputBytes: 4096});
  assert.equal(result.error?.code, "EOVERFLOW", JSON.stringify(result.error));
  assert.equal(result.status, null);
  const message = chainFailure(result, 60000);
  assert.match(message, /output exceeded the capture limit; the tree was killed/);
  assert.doesNotMatch(message, /starv/i);
});

test("a budget that is not a positive safe integer is refused, never replaced by a default", async () => {
  for (const budgetMs of [undefined, 0, -1, 1.5, "1000", Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(runChain(process.execPath, ["-e", ""], budgetMs === undefined ? {} : {budgetMs}), TypeError, `budgetMs=${String(budgetMs)}`);
  }
});

test("a budget past what a timer can hold is refused, the largest one is accepted", async () => {
  // setTimeout clamps a delay above 2^31-1 ms to 1 ms: the chain would be killed at once and reported as starved.
  await assert.rejects(runChain(process.execPath, ["-e", ""], {budgetMs: 2_147_483_648}), TypeError);
  const result = await runChain(process.execPath, ["-e", "process.exitCode=0"], {budgetMs: 2_147_483_647});
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0);
});

test("a command that cannot start is an error that is not ETIMEDOUT", async () => {
  const result = await runChain("no-such-executable-idle-chain-5521", [], {budgetMs: 30000});
  assert.ok(result.error, "expected a spawn error");
  assert.notEqual(result.error.code, "ETIMEDOUT");
  assert.doesNotMatch(chainFailure(result, 30000), /starv/i);
});
