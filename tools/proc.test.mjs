import {test} from "node:test";
import assert from "node:assert/strict";
import {run} from "./lib/proc.mjs";

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
  // Probe the actual process, not merely a 'kill requested' flag.
  let alive=true;
  try{process.kill(descendant,0);}catch(error){if(error.code==="ESRCH")alive=false;else throw error;}
  assert.equal(alive,false,`descendant ${descendant} survived containment`);
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
    assert.throws(()=>process.kill(pid,0),error=>error.code==="ESRCH",`process ${pid} survived timeout`);
  }
});
