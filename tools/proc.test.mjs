import {test} from "node:test";
import assert from "node:assert/strict";
import {run,MAX_TIMER_MS} from "./lib/proc.mjs";
import fs from "node:fs";
import {setTimeout as delay} from "node:timers/promises";

// A contained run's ceiling also covers the supervisor's and node's own start-up (pwsh, then node), and a
// loaded machine stretches those without limit: with every core busy, a 5 s or 15 s ceiling expired before
// the child had printed anything, and the test failed on that, not on the behaviour it names.
// So a ceiling is tried small first and widened ONLY when start-up did not complete; a run that did start
// is judged on the ceiling it had. `started(result)` says whether the child got going (default: the ceiling
// was not reached). Each widening is logged with t.diagnostic, so a slow machine is visible, not silent.
const BUDGETS_MS=[5000,30000,120000];
// Runs that end on their own never need a short ceiling; theirs is only a guard against a hang.
const GUARD_BUDGETS_MS=[15000,60000,180000];

async function runPastStartup(t,command,args,options,{started=result=>!result.timedOut,budgets=GUARD_BUDGETS_MS}={}) {
  let attempt;
  for(const budgetMs of budgets) {
    const begin=performance.now();
    const result=await run(command,args,{...options,timeoutMs:budgetMs});
    attempt={result,budgetMs,elapsedMs:performance.now()-begin};
    if(started(result))break;
    const next=budgets[budgets.indexOf(budgetMs)+1];
    t.diagnostic(next===undefined
      ?`start-up did not complete within ${budgetMs} ms, the last ceiling`
      :`start-up did not complete within ${budgetMs} ms; widening the ceiling to ${next} ms`);
  }
  return attempt;
}

test("contained launch failure differs from a target returning supervisor exit 125",async(t)=>{
  const {result:missing}=await runPastStartup(t,"missing-conventions-executable-734981",[],{containTree:true});
  assert.equal(missing.spawnFailed,true,missing.err);
  assert.ok(missing.spawnError);
  const {result:target}=await runPastStartup(t,process.execPath,["-e","process.exitCode=125"],{containTree:true});
  assert.equal(target.code,125,target.err);
  assert.equal(target.spawnFailed,false);
});

async function assertReaped(pid) {
  // kill(pid, 0) also sees a terminated zombie until its new parent reaps it. Keep requiring
  // ESRCH, but give the OS a bounded interval after pipe closure to remove the process entry.
  // Known limit: the first ESRCH ends the wait. A pid the OS reused for a stranger before the first poll
  // would answer kill(pid, 0) and make the wait fail ("remains"), never pass: a false failure, not a false proof.
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

test("bounded process capture reports overflow instead of retaining unlimited output",async(t)=>{
  const {result}=await runPastStartup(t,process.execPath,["-e","process.stdout.write('x'.repeat(200000))"],{maxOutputBytes:4096,containTree:true},{started:result=>result.overflow||!result.timedOut});
  assert.equal(result.overflow,true);
  assert.ok(Buffer.byteLength(result.out)+Buffer.byteLength(result.err)<=4096);
});

test("process containment preserves argv and exit status",async(t)=>{
  const args=['two words','quote"here','trailing\\','', 'Unicode слова', '$HOME`x`'];
  const {result}=await runPastStartup(t,process.execPath,["-e","console.log(JSON.stringify(process.argv.slice(1)));process.exitCode=7","--",...args],{containTree:true});
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

test("a process that exits on its own reports signal null next to its exit code",async(t)=>{
  for(const containTree of [false,true]) {
    const {result}=await runPastStartup(t,process.execPath,["-e","process.exitCode=3"],{containTree});
    assert.equal(result.code,3,result.err);
    assert.equal(result.signal,null,`containTree=${containTree}: a normal exit must say signal: null, not leave it undefined`);
  }
});

test("a process ended by a signal reports it, and its code keeps the old -1 (POSIX)",async(t)=>{
  if(process.platform==="win32") { t.skip("Windows has no POSIX signals: a self-kill there is an ordinary exit code"); return; }
  const {result}=await runPastStartup(t,process.execPath,["-e","process.kill(process.pid,'SIGTERM');setInterval(()=>{},1000)"],{});
  assert.equal(result.signal,"SIGTERM");
  assert.equal(result.code,-1);
  assert.equal(result.timedOut,false);
});

test("exited parent cannot strand a descendant holding inherited output pipes",async(t)=>{
  const script="const {spawn}=require('node:child_process');const p=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'});console.log(p.pid);p.unref();";
  // The parent exits on its own right after printing, so a run that reached its ceiling did not end by itself:
  // either start-up was slow (the ceiling is widened) or the descendant kept the pipes open (every ceiling is
  // reached, and the assertion below fails at the last). The reap check runs only on a run the exit itself ended.
  const {result,budgetMs}=await runPastStartup(t,process.execPath,["-e",script],{containTree:true},{budgets:BUDGETS_MS});
  assert.equal(result.timedOut,false,`the run reached its last ceiling (${budgetMs} ms): the exited parent's descendant kept the output pipes open. ${result.err}`);
  const descendant=Number(result.out.trim());
  assert.ok(descendant>0,result.err);
  await assertReaped(descendant);
});

test("deadline terminates the running process and its descendant before returning",async(t)=>{
  const script="const {spawn}=require('node:child_process');const p=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});console.log(process.pid,p.pid);setInterval(()=>{},1000);";
  // Both processes print their pids once running, so a run that printed them is one whose start-up finished
  // inside the ceiling it had; only then are the deadline and how fast it returned judged.
  const printedBoth=result=>result.out.trim().split(/\s+/).filter(Boolean).length===2;
  const {result,budgetMs,elapsedMs}=await runPastStartup(t,process.execPath,["-e",script],{containTree:true},{started:printedBoth,budgets:BUDGETS_MS});
  assert.ok(elapsedMs<budgetMs+7000,`the deadline must bound wall time as well as set a flag: ${Math.round(elapsedMs)} ms for a ${budgetMs} ms ceiling`);
  assert.equal(result.timedOut,true);
  const pids=result.out.trim().split(/\s+/).map(Number);
  assert.equal(pids.length,2,`the process never printed its pids, even at ${budgetMs} ms: ${JSON.stringify(result.out)} ${result.err}`);
  for(const pid of pids) {
    assert.ok(pid>0);
    await assertReaped(pid);
  }
});
