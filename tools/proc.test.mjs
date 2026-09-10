import {test} from "node:test";
import assert from "node:assert/strict";
import {run} from "./lib/proc.mjs";
import fs from "node:fs";
import {setTimeout as delay} from "node:timers/promises";

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
