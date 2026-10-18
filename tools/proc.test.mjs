import {test} from "node:test";
import assert from "node:assert/strict";
import {run,MAX_TIMER_MS} from "./lib/proc.mjs";
import {GUARD_MS,startupBudget} from "./lib/startup-ceilings.mjs";
import fs from "node:fs";
import {setTimeout as delay} from "node:timers/promises";

// A contained run's ceiling also covers the supervisor's and node's own start-up (pwsh, then node), and a loaded
// machine stretches those without limit: with every core busy, a 5 s or 15 s ceiling expired before the child had
// printed anything, and the test failed on that, not on the behaviour it names. See lib/startup-ceilings.mjs.
//
// Which calls have a start-up signal:
//  - launch failure, overflow, argv, exit code, signal: the child prints nothing before the behaviour under test and
//    ends on its own. No signal, no widening: ONE hang-guard ceiling (GUARD_MS).
//  - "exited parent" and "deadline": the child prints `<Date.now()> <pids>` once it is running. Only these two widen,
//    only while that line is absent, and both draw from this one file-wide budget.
const startup=startupBudget();

/** The first token of a readiness line, `<Date.now()> <pid>...`, when the line is complete: `fields` tokens. */
const readyLine=fields=>result=>{
  const tokens=result.out.trim().split(/\s+/).filter(Boolean);
  const stamp=Number(tokens[0]);
  return tokens.length===fields&&Number.isFinite(stamp)?stamp:undefined;
};

test("contained launch failure differs from a target returning supervisor exit 125",async()=>{
  const missing=await run("missing-conventions-executable-734981",[],{timeoutMs:GUARD_MS,containTree:true});
  assert.equal(missing.spawnFailed,true,missing.err);
  assert.ok(missing.spawnError);
  const target=await run(process.execPath,["-e","process.exitCode=125"],{timeoutMs:GUARD_MS,containTree:true});
  assert.equal(target.code,125,target.err);
  assert.equal(target.spawnFailed,false);
});

async function assertReaped(pid) {
  // kill(pid, 0) also sees a terminated zombie until its new parent reaps it. Keep requiring
  // ESRCH, but give the OS a bounded interval after pipe closure to remove the process entry.
  // Windows: kill(pid, 0) answers for a process OBJECT, which an open handle held by anyone keeps alive after the
  // process ended, and for a pid the OS has handed to a stranger. Either makes the poll see "alive": a false
  // failure, never a false pass. The only success is ESRCH. The poll has its own ceiling (below) and its own message.
  const deadline=performance.now()+2000;
  do {
    try { process.kill(pid,0); }
    catch(error) { if(error.code==="ESRCH")return; throw error; }
    await delay(20);
  } while(performance.now()<deadline);
  let state="unavailable";
  if(process.platform==="linux") {
    try { state=fs.readFileSync(`/proc/${pid}/status`,"utf8").split("\n").filter(line=>/^(State|PPid):/.test(line)).join("; "); }
    catch(error) { if(error.code!=="ENOENT")throw error; }
  }
  assert.fail(`process ${pid} remains after bounded reap interval (${state})`);
}

test("bounded process capture reports overflow instead of retaining unlimited output",async()=>{
  const result=await run(process.execPath,["-e","process.stdout.write('x'.repeat(200000))"],{maxOutputBytes:4096,timeoutMs:GUARD_MS,containTree:true});
  assert.equal(result.overflow,true);
  assert.ok(Buffer.byteLength(result.out)+Buffer.byteLength(result.err)<=4096);
});

test("process containment preserves argv and exit status",async()=>{
  const args=['two words','quote"here','trailing\\','', 'Unicode слова', '$HOME`x`'];
  const result=await run(process.execPath,["-e","console.log(JSON.stringify(process.argv.slice(1)));process.exitCode=7","--",...args],{timeoutMs:GUARD_MS,containTree:true});
  assert.equal(result.code,7,result.err);
  assert.deepEqual(JSON.parse(result.out),args);
});

test("a timeout past what a timer can hold is refused, the largest one is accepted",async()=>{
  // setTimeout clamps any delay above 2^31-1 ms to 1 ms, which would kill the child almost at once and call it a timeout.
  assert.equal(MAX_TIMER_MS,2_147_483_647);
  assert.throws(()=>run(process.execPath,["-e",""],{timeoutMs:MAX_TIMER_MS+1}),/timeout/i);
  const result=await run(process.execPath,["-e","process.exitCode=0"],{timeoutMs:MAX_TIMER_MS});
  assert.equal(result.timedOut,false);
  assert.equal(result.code,0,result.err);
});

test("a process that exits on its own reports signal null next to its exit code",async()=>{
  for(const containTree of [false,true]) {
    const result=await run(process.execPath,["-e","process.exitCode=3"],{timeoutMs:GUARD_MS,containTree});
    assert.equal(result.code,3,result.err);
    assert.equal(result.signal,null,`containTree=${containTree}: a normal exit must say signal: null, not leave it undefined`);
  }
});

test("a process ended by a signal reports it, and its code keeps the old -1 (POSIX)",async(t)=>{
  if(process.platform==="win32") { t.skip("Windows has no POSIX signals: a self-kill there is an ordinary exit code"); return; }
  const result=await run(process.execPath,["-e","process.kill(process.pid,'SIGTERM');setInterval(()=>{},1000)"],{timeoutMs:GUARD_MS});
  assert.equal(result.signal,"SIGTERM");
  assert.equal(result.code,-1);
  assert.equal(result.timedOut,false);
});

test("exited parent cannot strand a descendant holding inherited output pipes",async(t)=>{
  // Readiness line: `<Date.now()> <descendant pid>`, printed once the descendant is running; the parent exits at once.
  const script="const {spawn}=require('node:child_process');const p=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'});console.log(Date.now(),p.pid);p.unref();";
  // An attempt counts only if the parent was ready with at least RUNWAY_MS of its ceiling left; the exit itself must
  // then end the run. A conclusive run that still reached its ceiling is the defect (the descendant kept the pipes).
  const RUNWAY_MS=3000;
  const {result,budgetMs}=await startup.runWhenReady(t,process.execPath,["-e",script],{containTree:true,readyAt:readyLine(2),runwayMs:RUNWAY_MS});
  assert.equal(result.timedOut,false,`the run reached its ${budgetMs} ms ceiling with the parent ready at least ${RUNWAY_MS} ms before it: the exited parent's descendant kept the output pipes open. ${result.err}`);
  const descendant=Number(result.out.trim().split(/\s+/)[1]);
  assert.ok(descendant>0,result.err);
  await assertReaped(descendant);
});

// How long run() may take to return after its deadline fired (kill the tree, close the pipes). Measured on the
// reference machine (24 hardware threads), run() at its deadline with the tree running, six runs each:
// idle 120-293 ms, 24 busy loops 233-543 ms, 72 busy loops (3x cores) 294-963 ms. The slack is 4000 ms, about 4x the worst.
const RETURN_SLACK_MS=4000;

test("deadline terminates the running process and its descendant before returning",async(t)=>{
  // Readiness line: `<Date.now()> <own pid> <descendant pid>`. A run that printed it had its tree running when the
  // deadline hit, so only such a run says anything about the kill. Widening is for start-up only: it is applied
  // while the line is absent, and what is asserted (timedOut, how long run() took AFTER the deadline, both pids
  // gone) never depends on the ceiling that finally applied.
  const script="const {spawn}=require('node:child_process');const p=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});console.log(Date.now(),process.pid,p.pid);setInterval(()=>{},1000);";
  const {result,budgetMs,elapsedMs}=await startup.runWhenReady(t,process.execPath,["-e",script],{containTree:true,readyAt:readyLine(3)});
  assert.equal(result.timedOut,true);
  assert.ok(elapsedMs-budgetMs<RETURN_SLACK_MS,`the deadline must bound wall time as well as set a flag: run() returned ${Math.round(elapsedMs-budgetMs)} ms after its ${budgetMs} ms deadline (allowed ${RETURN_SLACK_MS} ms)`);
  const pids=result.out.trim().split(/\s+/).slice(1).map(Number);
  assert.equal(pids.length,2,result.err);
  for(const pid of pids) {
    assert.ok(pid>0);
    await assertReaped(pid);
  }
});
