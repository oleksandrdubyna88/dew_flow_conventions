import {test} from "node:test";
import assert from "node:assert/strict";
import {run,MAX_TIMER_MS} from "./lib/proc.mjs";
import fs from "node:fs";
import {setTimeout as delay} from "node:timers/promises";

test("contained launch failure differs from a target returning supervisor exit 125",async()=>{
  const missing=await run("missing-conventions-executable-734981",[],{timeoutMs:15000,containTree:true});
  assert.equal(missing.spawnFailed,true,missing.err);
  assert.ok(missing.spawnError);
  const target=await run(process.execPath,["-e","process.exitCode=125"],{timeoutMs:15000,containTree:true});
  assert.equal(target.code,125,target.err);
  assert.equal(target.spawnFailed,false);
});

async function assertReaped(pid) {
  // kill(pid, 0) also sees a terminated zombie until its new parent reaps it. Keep requiring
  // ESRCH, but give the OS a bounded interval after pipe closure to remove the process entry.
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
  const result=await run(process.execPath,["-e","process.stdout.write('x'.repeat(200000))"],{maxOutputBytes:4096,timeoutMs:15000,containTree:true});
  assert.equal(result.overflow,true);
  assert.ok(Buffer.byteLength(result.out)+Buffer.byteLength(result.err)<=4096);
});

test("process containment preserves argv and exit status",async()=>{
  const args=['two words','quote"here','trailing\\','', 'Unicode слова', '$HOME`x`'];
  const result=await run(process.execPath,["-e","console.log(JSON.stringify(process.argv.slice(1)));process.exitCode=7","--",...args],{timeoutMs:15000,containTree:true});
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
    const result=await run(process.execPath,["-e","process.exitCode=3"],{timeoutMs:15000,containTree});
    assert.equal(result.code,3,result.err);
    assert.equal(result.signal,null,`containTree=${containTree}: a normal exit must say signal: null, not leave it undefined`);
  }
});

test("a process ended by a signal reports it, and its code keeps the old -1 (POSIX)",async(t)=>{
  if(process.platform==="win32") { t.skip("Windows has no POSIX signals: a self-kill there is an ordinary exit code"); return; }
  const result=await run(process.execPath,["-e","process.kill(process.pid,'SIGTERM');setInterval(()=>{},1000)"],{timeoutMs:15000});
  assert.equal(result.signal,"SIGTERM");
  assert.equal(result.code,-1);
  assert.equal(result.timedOut,false);
});

test("exited parent cannot strand a descendant holding inherited output pipes",async()=>{
  const script="const {spawn}=require('node:child_process');const p=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'inherit'});console.log(p.pid);p.unref();";
  const result=await run(process.execPath,["-e",script],{timeoutMs:5000,containTree:true});
  const descendant=Number(result.out.trim());
  assert.ok(descendant>0,result.err);
  await assertReaped(descendant);
});

test("deadline terminates the running process and its descendant before returning",async()=>{
  const script="const {spawn}=require('node:child_process');const p=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});console.log(process.pid,p.pid);setInterval(()=>{},1000);";
  const start=performance.now();
  const result=await run(process.execPath,["-e",script],{timeoutMs:5000,containTree:true});
  assert.ok(performance.now()-start<12000,"the deadline must bound wall time as well as set a flag");
  assert.equal(result.timedOut,true);
  const pids=result.out.trim().split(/\s+/).map(Number);
  assert.equal(pids.length,2,result.err);
  for(const pid of pids) {
    assert.ok(pid>0);
    await assertReaped(pid);
  }
});
