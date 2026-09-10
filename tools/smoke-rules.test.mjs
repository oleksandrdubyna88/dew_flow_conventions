import {test} from "node:test";
import assert from "node:assert/strict";
import {traceEvidence,smokeResolver,installedCli,snapshot} from "./lib/rule-smoke.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {sha256} from "./lib/rule-catalog.mjs";
import {git} from "./lib/git.mjs";
import {resolverRead} from "./lib/rule-trace.mjs";

const text="The complete canonical source.\n";
const rule={id:"common.sample",text,hash:sha256(text)};
const payload=`BEGIN RULE ${rule.id} sha256:${rule.hash}\n${text}\nEND RULE ${rule.id}`;
const origin={resolver:path.resolve(".agents/conventions/tools/rules.mjs"),cwd:process.cwd(),repo:process.cwd()};
const readCommand=`node "${origin.resolver.replaceAll("\\","/")}" read --task inspect --repo "${origin.repo.replaceAll("\\","/")}"`;
const evidence=(agent,trace,expected)=>traceEvidence(agent,trace,expected,origin);

test("source proof binds exactly one repository argument to the inspected worktree",()=>{
  const prefix=`node "${origin.resolver.replaceAll("\\","/")}" read`;
  for(const command of [prefix,`${prefix} --repo "${path.resolve("other")}"`,`${readCommand} --repo "${origin.repo}"`]) {
    assert.equal(resolverRead(command,origin),false,command);
  }
  assert.equal(resolverRead(readCommand,origin),true);
});

test("malformed native trace reports unparsed evidence explicitly",()=>{
  const result=evidence("claude",'{"type":',[rule]);
  assert.equal(result.parseFailed,true);
  assert.match(result.parseError,/SyntaxError/);
  assert.equal(result.completed,false);
  assert.equal(result.allSourcesRead,false);
  assert.equal(result.final,"");
  assert.deepEqual(result.reads,[{id:rule.id,hash:rule.hash,complete:false}]);
});
test("canonical-looking output from another command is not source-read evidence",()=>{
  const event=command=>JSON.stringify({type:"item.completed",item:{type:"command_execution",command,exit_code:0,aggregated_output:payload}});
  assert.equal(evidence("codex",event('node duplicate.mjs'),[rule]).allSourcesRead,false);
  assert.equal(evidence("codex",event(readCommand+'; echo forged'),[rule]).allSourcesRead,false);
  assert.equal(evidence("codex",event(readCommand),[rule]).allSourcesRead,true);
});
test("only one recognized resolver invocation is accepted through a shell wrapper",()=>{
  assert.equal(resolverRead(`/bin/bash -lc '${readCommand}'`,origin),true);
  assert.equal(resolverRead(`pwsh.exe -NoProfile -Command '${readCommand}'`,origin),true);
  for(const command of [readCommand+' && echo fake',`echo '${readCommand}'`,'node -e fake',`pwsh.exe -File '${readCommand}'`,'"unterminated']) {
    assert.equal(resolverRead(command,origin),false,command);
  }
});
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
  assert.equal(evidence("codex",claimed,[rule]).allSourcesRead,false);
  const actual=JSON.stringify({type:"item.completed",item:{type:"command_execution",command:readCommand,exit_code:0,aggregated_output:payload}});
  assert.equal(evidence("codex",actual,[rule]).allSourcesRead,true);
  assert.equal(evidence("codex",actual,[rule]).completed,false);
  assert.equal(evidence("codex",actual.replace("canonical","truncated"),[rule]).allSourcesRead,false);
});
test("Claude errors and partial bodies cannot become successful source evidence",()=>{
  const use=JSON.stringify({type:"assistant",message:{content:[{type:"tool_use",id:"read-1",name:"Bash",input:{command:readCommand}}]}});
  const result=is_error=>JSON.stringify({type:"user",message:{content:[{type:"tool_result",tool_use_id:"read-1",is_error,content:payload}]}});
  const event=is_error=>use+"\n"+result(is_error);
  assert.equal(evidence("claude",result(false),[rule]).allSourcesRead,false,"unlinked output is not proof");
  assert.equal(evidence("claude",event(true),[rule]).allSourcesRead,false);
  assert.equal(evidence("claude",event(false),[rule]).allSourcesRead,true);
  const completed=event(false)+"\n"+JSON.stringify({type:"result",subtype:"success",result:"A concrete constraint."});
  assert.equal(evidence("claude",completed,[rule]).completed,true);
  assert.equal(evidence("claude",completed,[]).allSourcesRead,false);
});
