import {test} from "node:test";
import assert from "node:assert/strict";
import {traceEvidence,smokeResolver,installedCli,snapshot} from "./lib/rule-smoke.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {sha256} from "./lib/rule-catalog.mjs";
import {git} from "./lib/rule-migration.mjs";

const text="The complete canonical source.\n";
const rule={id:"common.sample",text,hash:sha256(text)};
const payload=`BEGIN RULE ${rule.id} sha256:${rule.hash}\n${text}\nEND RULE ${rule.id}`;
test("a consumer's unrelated ENTRY cannot shadow its mounted resolver",t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"smoke-resolver-"));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,".agents/conventions/tools"),{recursive:true});
  fs.writeFileSync(path.join(root,"ENTRY.md"),"Unrelated entry");
  const mounted=path.join(root,".agents/conventions/tools/rules.mjs");
  fs.writeFileSync(mounted,"// mounted resolver");
  assert.equal(smokeResolver(root),mounted);
  fs.unlinkSync(mounted);
  assert.throws(()=>smokeResolver(root),/No mounted resolver/);
});
test("CLI entries outside default install directories run without shell wrappers",()=>{
  assert.deepEqual(installedCli("codex",process.execPath),{command:process.execPath,prefix:[]});
  assert.deepEqual(installedCli("claude",undefined,"linux"),{command:"claude",prefix:[]});
  assert.throws(()=>installedCli("codex",undefined,"win32",{PATH:"",APPDATA:"missing-smoke-cli",USERPROFILE:"missing-smoke-cli"}),/pass --cli/);
});
test("snapshot bounds inspected content and ignores unrelated large file bodies",t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"smoke-snapshot-"));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  git(root,"init","-q");
  git(root,"-c","user.name=Smoke test","-c","user.email=test@example.invalid","-c","commit.gpgsign=false","commit","--allow-empty","-qm","fixture");
  fs.writeFileSync(path.join(root,"inspected.md"),"first");
  const large=path.join(root,"unrelated.bin");
  const fd=fs.openSync(large,"w");fs.ftruncateSync(fd,16*1024*1024);fs.closeSync(fd);
  const before=snapshot(root,["inspected.md","future.md"]);
  fs.writeFileSync(path.join(root,"inspected.md"),"other");
  assert.notEqual(snapshot(root,["inspected.md","future.md"]),before);
  assert.throws(()=>snapshot(root,["unrelated.bin"]),/exceeds 1 MiB/);
  assert.throws(()=>snapshot(root,Array.from({length:513},(_,i)=>`file${i}`)),/512 paths/);
});
test("source evidence requires successful tool output, not the assistant's claim",()=>{
  const claimed=JSON.stringify({type:"item.completed",item:{type:"agent_message",text:payload}});
  assert.equal(traceEvidence("codex",claimed,[rule]).allSourcesRead,false);
  const actual=JSON.stringify({type:"item.completed",item:{type:"command_execution",exit_code:0,aggregated_output:payload}});
  assert.equal(traceEvidence("codex",actual,[rule]).allSourcesRead,true);
  assert.equal(traceEvidence("codex",actual,[rule]).completed,false);
  assert.equal(traceEvidence("codex",actual.replace("canonical","truncated"),[rule]).allSourcesRead,false);
});
test("Claude errors and partial bodies cannot become successful source evidence",()=>{
  const event=is_error=>JSON.stringify({type:"user",message:{content:[{type:"tool_result",is_error,content:payload}]}});
  assert.equal(traceEvidence("claude",event(true),[rule]).allSourcesRead,false);
  assert.equal(traceEvidence("claude",event(false),[rule]).allSourcesRead,true);
  const completed=event(false)+"\n"+JSON.stringify({type:"result",subtype:"success",result:"A concrete constraint."});
  assert.equal(traceEvidence("claude",completed,[rule]).completed,true);
  assert.equal(traceEvidence("claude",completed,[]).allSourcesRead,false);
});
