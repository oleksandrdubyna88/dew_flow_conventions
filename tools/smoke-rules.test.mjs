import {test} from "node:test";
import assert from "node:assert/strict";
import {traceEvidence,smokeResolver,installedCli,snapshot,behaviourCliArgs,behaviourSmoke,recordedLaunches,judgeBehaviour,loadingPrompt,changedPaths,parseArgs} from "./lib/rule-smoke.mjs";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {delegationEvidence} from "./lib/rule-trace.mjs";
import {behaviourVerdict,validateFixture,loadFixture,changedFilesReasons,runBehaviourSequence,BEHAVIOUR_ORDER,DENY_MARKER} from "./lib/rule-behaviour.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {sha256} from "./lib/rule-catalog.mjs";
import {git} from "./lib/git.mjs";
import {resolverRead} from "./lib/rule-trace.mjs";
import {roleRowsOf,declaredRole} from "./lib/rule-roles.mjs";

import {ownedDir,ownedWorktree,removeLink} from "./lib/owned.mjs";

// A disposable worktree of this checkout for the end-to-end behaviour runs. `home` (an owned folder) holds what a test
// writes beside the worktree; `worktree` stays free of untracked files (behaviourSmoke refuses any). The node_modules
// junction is unlinked by the helper's removeLink before the worktree goes, never following it into the checkout.
function disposableWorktree(t,what){
  const home=ownedDir(t,what);
  const top=git(process.cwd(),"rev-parse","--show-toplevel");
  const wt=ownedWorktree(t,top,"wt");
  const modules=path.join(wt.path,"node_modules");
  fs.symlinkSync(path.join(top,"node_modules"),modules,"junction");
  wt.beforeRemove(()=>removeLink(modules));
  return {home,worktree:wt.path};
}

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
  const root=ownedDir(t,"smoke-resolver");
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
  const root=ownedDir(t,"smoke-snapshot");
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

// ---- E4.S1: delegation evidence on the recorded trace (tools/fixtures/traces/two-children.jsonl) ----
const recorded=fs.readFileSync(new URL("./fixtures/traces/two-children.jsonl",import.meta.url),"utf8").split("\n").filter(Boolean).map(line=>JSON.parse(line));
const twoChildren={groups:[{name:"sonnet child",model:"sonnet",count:1,promptIncludes:["OK1"]},{name:"opus child",model:"opus",count:1,promptIncludes:["OK2"]}],
  denials:0,children:2,forbiddenParentEdits:["format.mjs"]};
const derive=change=>change(structuredClone(recorded));
const verdictOf=(events,expectation=twoChildren)=>behaviourVerdict(delegationEvidence(events,{marker:DENY_MARKER}),expectation);
const launchEvent=(events,index)=>events.filter(event=>event.type==="assistant"&&event.message.content.some(block=>block.name==="Agent"))[index];
const parentTool=(id,name,input)=>({type:"assistant",parent_tool_use_id:null,message:{model:"claude-opus-5-5",content:[{type:"tool_use",id,name,input}]}});
const withoutLaunches=events=>events.filter(event=>event.type!=="assistant"||!event.message.content.some(block=>block.name==="Agent"));

test("the recorded trace yields two launches with their requested models and the aggregate families",()=>{
  const evidence=delegationEvidence(recorded,{marker:DENY_MARKER});
  assert.deepEqual(evidence.launches.map(launch=>[launch.model,launch.subagentType,launch.prompt,launch.background,launch.started,launch.taskStatus,launch.terminal,launch.denials]),
    [["sonnet","general-purpose","Reply OK1",false,true,"completed",true,0],["opus","general-purpose","Reply OK2",false,true,"completed",true,0]]);
  assert.equal(evidence.launches.every(launch=>launch.childEvents===1),true,"each child shows only its prompt event");
  assert.equal(evidence.result.families.sonnet>0&&evidence.result.families.opus>0,true);
  assert.deepEqual([evidence.result.subtype,evidence.result.isError,evidence.result.terminalReason],["success",false,"completed"]);
  assert.equal(evidence.result.costUsd>0,true);
  assert.match(evidence.limits[0],/opus child cannot be separated/);
  assert.deepEqual([evidence.parentEdits,evidence.nestedLaunches],[[],[]]);
});
test("the recorded trace passes the expectation written for it",()=>{
  assert.deepEqual(verdictOf(recorded),{outcome:"pass",reasons:[]});
});
test("a trace without a result event is inconclusive, never a pass or a fail",()=>{
  const verdict=verdictOf(recorded.filter(event=>event.type!=="result"));
  assert.equal(verdict.outcome,"inconclusive");
  assert.match(verdict.reasons[0],/no result event/);
});
test("a spent budget or turn limit is inconclusive",()=>{
  const verdict=verdictOf(derive(events=>{events.at(-1).subtype="error_max_budget_usd";return events;}));
  assert.equal(verdict.outcome,"inconclusive");
  assert.match(verdict.reasons[0],/budget or turns/);
});
test("a launch whose tool_result never arrived is inconclusive",()=>{
  const id=launchEvent(recorded,0).message.content[0].id;
  const verdict=verdictOf(recorded.filter(event=>!(event.type==="user"&&event.parent_tool_use_id===null&&event.message.content.some(block=>block.tool_use_id===id))));
  assert.equal(verdict.outcome,"inconclusive");
  assert.match(verdict.reasons.join(),/no terminal tool_result/);
});
test("a launch with no completed task_notification is inconclusive",()=>{
  const verdict=verdictOf(derive(events=>{events.find(event=>event.subtype==="task_notification").status="failed";return events;}));
  assert.equal(verdict.outcome,"inconclusive");
});
test("a retried launch (the same prompt twice) is inconclusive",()=>{
  const verdict=verdictOf(derive(events=>{launchEvent(events,1).message.content[0].input.prompt="Reply OK1";return events;}));
  assert.equal(verdict.outcome,"inconclusive");
  assert.match(verdict.reasons.join(),/retry/);
});
test("a nested launch the expectation did not ask for is inconclusive, and allowed when asked for",()=>{
  const nested=derive(events=>{events.splice(2,0,{...parentTool("toolu_nested","Agent",{prompt:"deeper",model:"sonnet"}),parent_tool_use_id:launchEvent(events,0).message.content[0].id});return events;});
  assert.deepEqual(delegationEvidence(nested,{marker:DENY_MARKER}).nestedLaunches,["toolu_nested"]);
  assert.equal(verdictOf(nested).outcome,"inconclusive");
  assert.equal(verdictOf(nested,{...twoChildren,allowNested:true}).outcome,"pass");
});
test("a parent edit of a forbidden file fails; an edit elsewhere does not",()=>{
  const edit=file=>derive(events=>{events.splice(2,0,parentTool("toolu_edit","Edit",{file_path:file}));return events;});
  const failed=verdictOf(edit("C:\\work\\toy\\format.mjs"));
  assert.equal(failed.outcome,"fail");
  assert.match(failed.reasons[0],/parent edited/);
  assert.equal(verdictOf(edit("notes.txt")).outcome,"pass");
});
test("a missing focus token fails: distinct prompts alone do not show distinct focuses",()=>{
  const expectation=tokens=>({groups:[{name:"scout",model:"sonnet",count:1,focusTokens:tokens},{name:"opus",model:"opus",count:1}],denials:0,children:2});
  assert.equal(verdictOf(recorded,expectation(["OK1"])).outcome,"pass","the prompt names exactly one token");
  assert.equal(verdictOf(recorded,expectation(["OK","OK1"])).outcome,"fail","a prompt naming two areas is not one focus");
  assert.match(verdictOf(recorded,expectation(["OK1","OK9"])).reasons.join(),/focus not covered: OK9/);
});
test("an empty child set never passes when launches were expected",()=>{
  const verdict=verdictOf(withoutLaunches(recorded));
  assert.equal(verdict.outcome,"fail");
  assert.match(verdict.reasons.join(),/no launches/);
});
test("the deny marker is counted per launch, only on a parent-level error result",()=>{
  const id=launchEvent(recorded,0).message.content[0].id;
  const denied=(marker,isError)=>derive(events=>{
    const result=events.find(event=>event.type==="user"&&event.parent_tool_use_id===null&&event.message.content.some(block=>block.tool_use_id===id));
    Object.assign(result.message.content[0],{is_error:isError,content:[{type:"text",text:`PreToolUse:Agent hook error: ${marker} pass a model`}]});
    return events;
  });
  const count=events=>delegationEvidence(events,{marker:DENY_MARKER}).launches.map(launch=>launch.denials);
  assert.deepEqual(count(denied("subagent-models.md:",true)),[1,0]);
  assert.deepEqual(count(denied("something else:",true)),[0,0]);
  assert.deepEqual(count(denied("subagent-models.md:",false)),[0,0]);
  assert.match(verdictOf(denied("subagent-models.md:",true)).reasons.join(),/1 marker denial/);
});
test("an unknown event type is ignored, not fatal",()=>{
  const noisy=[{type:"future_event",payload:{}},{type:"system"},...recorded,{type:"rate_limit_event"}];
  assert.deepEqual(verdictOf(noisy),{outcome:"pass",reasons:[]});
});
test("a requested family absent from modelUsage fails; other families present are ignored",()=>{
  const without=family=>derive(events=>{const usage=events.at(-1).modelUsage;for(const key of Object.keys(usage))if(key.startsWith(`claude-${family}`))delete usage[key];return events;});
  assert.match(verdictOf(without("sonnet")).reasons.join(),/family "sonnet"/);
  assert.equal(verdictOf(without("haiku")).outcome,"pass");
});
test("subagent_stats must equal the launches the expectation asks for",()=>{
  const stats=change=>derive(events=>{Object.assign(events.at(-1).subagent_stats,change);return events;});
  assert.match(verdictOf(stats({spawned:3})).reasons.join(),/spawned is 3/);
  assert.match(verdictOf(stats({completed:1})).reasons.join(),/completed is 1/);
  assert.match(verdictOf(stats({requested:{background:1,foreground:1}})).reasons.join(),/foreground is 1|background/);
});

// ---- E4.S2: the behaviour mode and its fixtures ----
const fixtureDir=new URL("./fixtures/behaviour/",import.meta.url);
const fixtureNames=["negative","classification","behaviour"];
const loadNamed=name=>JSON.parse(fs.readFileSync(new URL(`${name}.json`,fixtureDir),"utf8"));

test("the three fixtures validate against the shape, in the documented order",()=>{
  assert.deepEqual(BEHAVIOUR_ORDER,fixtureNames);
  for(const name of fixtureNames)assert.equal(validateFixture(loadNamed(name),name).name,name);
  assert.equal(loadFixture(path.resolve("."),"negative").name,"negative");
});
test("a fixture without caps, tools or an expectation is refused with the defect named",()=>{
  const good=loadNamed("negative");
  assert.throws(()=>validateFixture({...good,caps:{maxBudgetUsd:1}}),/caps\.timeoutMs/);
  assert.throws(()=>validateFixture({...good,tools:undefined}),/tools/);
  assert.throws(()=>validateFixture({...good,expectation:undefined}),/expectation/);
  assert.throws(()=>validateFixture({...good,files:[]}),/files/);
});
test("the caps and the tool set of a run come from the fixture",()=>{
  const fixture=loadNamed("behaviour");
  const args=behaviourCliArgs(fixture,"PROMPT",["entry.js"],"C:/r/tools/rules.mjs");
  assert.equal(args[0],"entry.js");
  assert.equal(args[args.indexOf("--max-budget-usd")+1],String(fixture.caps.maxBudgetUsd));
  assert.equal(args[args.indexOf("--tools")+1],fixture.tools);
  assert.equal(args.at(-1),"PROMPT");
  assert.equal(args.includes("Agent"),true,"the Agent tool is offered");
  assert.equal(args.includes("Bash"),false,"Bash is narrowed, never allowed outright");
  const none=behaviourCliArgs({...loadNamed("classification"),loadRules:false},"P");
  assert.equal(none.includes("--allowedTools"),false,"a toolless fixture that loads nothing allows nothing");
  assert.equal(none[none.indexOf("--tools")+1],"");
});
test("the negative fixture expects one unmodelled launch, one denial and no child",()=>{
  const {expectation}=loadNamed("negative");
  assert.deepEqual([expectation.groups[0].model,expectation.groups[0].count,expectation.denials,expectation.children],[null,1,1,0]);
});
test("the behaviour fixture is role-based: the table, five scouts, a coder, a judge after it, and the role-declaring prompt",()=>{
  const {expectation,prompt}=loadNamed("behaviour");
  assert.equal(expectation.groups,undefined);
  assert.deepEqual([expectation.roles.table,expectation.roles.scouts.min,expectation.roles.coders.min,expectation.roles.judges.min,expectation.roles.judges.afterCoder],["common/subagent-models.md",5,1,1,true]);
  assert.deepEqual(expectation.roles.scouts.focus,FILES);
  assert.match(prompt,/Start every Agent call's `description` with the role it plays, exactly as the first column of the rule's role table names it, then a colon/);
  assert.equal(expectation.denials,0);
});

// ---- the 2026-10-13 run 6 shape, judged by DECLARED role: the table is read from the rule, not from constants ----
const FILES=["args.mjs","format.mjs","config.mjs","toy-checks.mjs","README.md"];
const RULE_TEXT=fs.readFileSync("common/subagent-models.md","utf8");
const rows=roleRowsOf(RULE_TEXT);
const scout=(file,model="sonnet")=>({model,description:`Scout: ${file}`,prompt:`Learn ${file} only`});
const coder=(model="sonnet")=>({model,description:"Coder: --json flag",prompt:"Implement exactly this brief"});
const judgeLaunch=(model="opus",description="Judge: brief and scenarios")=>({model,description,prompt:`${description} - write it`});
const fixer=(model="sonnet")=>({model,description:"Coder: review fix",prompt:"Fix the review findings"});
function pipelineTrace(launches) {
  const template=recorded.filter(event=>event.type!=="result");
  const one=template.filter(event=>JSON.stringify(event).includes("toolu_01AZZYqn2JzSMNhi7jedkgB8"));
  const events=launches.flatMap(({model,prompt,description},index)=>{
    const id=`toolu_pipeline_${index}`,text=JSON.stringify(structuredClone(one)).replaceAll("toolu_01AZZYqn2JzSMNhi7jedkgB8",id).replaceAll("Reply OK1",prompt.replaceAll('"','\\"'));
    const copy=JSON.parse(text);
    Object.assign(copy.find(event=>event.type==="assistant").message.content[0].input,{model,description});
    return copy;
  });
  const result=structuredClone(recorded.at(-1));
  result.subagent_stats={...result.subagent_stats,spawned:launches.length,completed:launches.length,requested:{background:0,foreground:launches.length,unset:0}};
  return [...events,result];
}
const behaviour=()=>loadNamed("behaviour").expectation;
const base=[...FILES.map(file=>scout(file)),judgeLaunch(),coder(),judgeLaunch("opus","Judge: review")];
const pipelineVerdict=(launches,tableRows=rows)=>behaviourVerdict(delegationEvidence(pipelineTrace(launches),{marker:DENY_MARKER}),behaviour(),tableRows);
const failedWith=(launches,pattern,tableRows)=>{
  const verdict=pipelineVerdict(launches,tableRows);
  assert.equal(verdict.outcome,"fail",verdict.reasons.join());
  assert.match(verdict.reasons.join(),pattern);
};

test("run 6's shape passes by declared role: five scouts, an opus brief judge, a coder, an opus reviewer",()=>{
  assert.deepEqual(pipelineVerdict(base),{outcome:"pass",reasons:[]});
});
test("an extra sonnet review-fix coder passes",()=>{
  assert.deepEqual(pipelineVerdict([...base,fixer()]),{outcome:"pass",reasons:[]});
});
test("the table parsed from the rule maps scout, coder and judge to sonnet, sonnet and opus",()=>{
  assert.deepEqual(["scout","coder","judge"].map(role=>rows.find(row=>row.role===role)?.model),["sonnet","sonnet","opus"]);
});
test("a scout on opus fails, naming the launch and the role",()=>{failedWith([scout(FILES[0],"opus"),...base.slice(1)],/launch 1 \(role "scout"\) ran on opus/);});
test("a coder on opus fails",()=>{failedWith([...base.slice(0,6),coder("opus"),base[7]],/launch 7 \(role "coder"\) ran on opus/);});
test("a judge on sonnet fails",()=>{failedWith([...base.slice(0,5),judgeLaunch("sonnet"),...base.slice(6)],/launch 6 \(role "judge"\) ran on sonnet/);});
test("a launch with no role in its description fails",()=>{
  failedWith([...base.slice(0,4),{...scout(FILES[4]),description:"learn the README"},...base.slice(5)],/launch 5 declared no role from the table/);
  failedWith([...base.slice(0,4),{...scout(FILES[4]),description:"Wizard: the README"},...base.slice(5)],/launch 5 declared no role/);
});
test("four scouts fail the minimum of five",()=>{failedWith([...FILES.slice(0,4).map(file=>scout(file)),...base.slice(5)],/4 scout launch\(es\), at least 5/);});
test("scouts that together miss a focus file fail; one prompt naming two files does not",()=>{
  const missing=[...FILES.slice(0,4).map(file=>scout(file)),{...scout("args.mjs"),prompt:"Learn args.mjs again"},...base.slice(5)];
  failedWith(missing,/scouts together do not cover: README\.md/);
  const two=[{...scout(FILES[0]),prompt:"Learn args.mjs and format.mjs"},...FILES.slice(2).map(file=>scout(file)),scout("x"),...base.slice(5)];
  assert.deepEqual(pipelineVerdict(two),{outcome:"pass",reasons:[]});
});
test("no judge after the first coder fails",()=>{
  failedWith([...FILES.map(file=>scout(file)),judgeLaunch(),coder()],/no judge launched after the first coder/);
});
test("no coder fails",()=>{failedWith([...FILES.map(file=>scout(file)),judgeLaunch(),judgeLaunch("opus","Judge: review")],/0 coder launch\(es\), at least 1/);});
test("a Cornerstone spec launch fails as an unexpected role even on its table model",()=>{
  failedWith([...base,judgeLaunch("fable","Cornerstone spec: the scenarios")],/launch 9 \(role "cornerstone spec"\): unexpected role for this task/);
});
test("a Small edit launch is held to sonnet and is still an unexpected role",()=>{
  failedWith([...base,judgeLaunch("opus","Small edit: typo")],/launch 9 \(role "small edit"\) ran on opus/);
  failedWith([...base,{...coder(),description:"Small edit: typo",prompt:"Make the typo edit"}],/unexpected role for this task/);
});
test("the check reads the rule's table: a copy with Judge on sonnet fails the opus judge and passes a sonnet one",()=>{
  const edited=roleRowsOf(RULE_TEXT.replace(/^\| Judge \| opus \|/m,"| Judge | sonnet |"));
  assert.equal(edited.find(row=>row.role==="judge").model,"sonnet");
  failedWith(base,/\(role "judge"\) ran on opus, the table says sonnet/,edited);
  const sonnetJudges=base.map(launch=>launch.description.startsWith("Judge")?{...launch,model:"sonnet"}:launch);
  assert.deepEqual(pipelineVerdict(sonnetJudges,edited),{outcome:"pass",reasons:[]});
});
test("the declared role is the description before the first colon, cleaned like a table cell",()=>{
  assert.deepEqual(["Scout: a","  **Judge** : b","Coder","","scout"].map(declaredRole),["scout","judge","","",""]);
});
test("judgeBehaviour reads the table from the worktree root named by the expectation",()=>{
  const fixture=loadNamed("behaviour");
  const out=pipelineTrace(base).map(event=>JSON.stringify(event)).join("\n");
  const judged=judgeBehaviour({fixture:{...fixture,loadRules:false},out,expected:[],origin,root:path.resolve(".")});
  assert.deepEqual(judged.verdict,{outcome:"pass",reasons:[]});
});
test("the behaviour mode refuses to run outside a disposable worktree",async t=>{
  const root=ownedDir(t,"smoke-behaviour");
  git(root,"init","-q");
  await assert.rejects(behaviourSmoke({repo:root,fixture:"negative"}),/disposable worktree/);
});
test("the sequence stops at the first non-pass",async()=>{
  const seen=[];
  const outcomes={negative:"pass",classification:"inconclusive",behaviour:"pass"};
  const result=await runBehaviourSequence(BEHAVIOUR_ORDER,async name=>{seen.push(name);return {outcome:outcomes[name]};});
  assert.deepEqual(seen,["negative","classification"]);
  assert.deepEqual(result,{results:[{name:"negative",outcome:"pass"},{name:"classification",outcome:"inconclusive"}],passed:false});
  assert.equal((await runBehaviourSequence(BEHAVIOUR_ORDER,async()=>({outcome:"pass"}))).passed,true);
});
test("the classification verdict reads the answer array and accepts either of the two permitted answers",()=>{
  const {expectation}=loadNamed("classification");
  const answered=answers=>{
    const events=withoutLaunches(derive(trace=>{trace.at(-1).result=`\`\`\`json\n${JSON.stringify(answers)}\n\`\`\``;return trace;}));
    events.at(-1).subagent_stats={spawned:0,completed:0,requested:{background:0,foreground:0}};
    return behaviourVerdict(delegationEvidence(events,{marker:DENY_MARKER}),expectation);
  };
  const right=["sonnet","opus","opus","sonnet","opus","sonnet","fable","main","sonnet","sonnet","sonnet"];
  assert.equal(answered(right).outcome,"pass");
  assert.equal(answered(right.with(7,"sonnet")).outcome,"pass");
  assert.match(answered(right.with(6,"opus")).reasons.join(),/answer 7/);
  assert.match(answered(right.slice(1)).reasons.join(),/10 answer/);
});
test("the toy passes its own checks before any change and stays out of npm test's default globs",()=>{
  const toy=fileURLToPath(new URL("toy/toy-checks.mjs",fixtureDir));
  const done=spawnSync(process.execPath,["--test",toy],{encoding:"utf8"});
  assert.equal(done.status,0,done.stdout+done.stderr);
  assert.doesNotMatch(path.basename(toy),/\.test\.|-test\.|^test-|^test\.mjs$/);
  assert.equal(fs.readdirSync(new URL("toy/",fixtureDir)).sort().join(),"README.md,args.mjs,config.mjs,format.mjs,toy-checks.mjs");
});

// ---- defect: a behaviour verdict must never pass or fail a rule the session did not load ----
const SUBAGENT_RULE_TEXT="Subagent models: the sonnet/opus table.\n";
const subagentRule={id:"common.subagent-models",text:SUBAGENT_RULE_TEXT,hash:sha256(SUBAGENT_RULE_TEXT)};
const subagentPayload=`BEGIN RULE ${subagentRule.id} sha256:${subagentRule.hash}\n${SUBAGENT_RULE_TEXT}\nEND RULE ${subagentRule.id}`;
const classificationRight=["sonnet","opus","opus","sonnet","opus","sonnet","fable","main","sonnet","sonnet","sonnet"];
const loadReadCommand=`node "${origin.resolver.replaceAll("\\","/")}" read --repo "${origin.repo.replaceAll("\\","/")}" --task implement --only ${subagentRule.id}`;
function classificationTrace({read}) {
  const events=withoutLaunches(derive(trace=>{trace.at(-1).result=JSON.stringify(classificationRight);return trace;}));
  events.at(-1).subagent_stats={spawned:0,completed:0,requested:{background:0,foreground:0}};
  if(read) {
    events.splice(0,0,
      {type:"assistant",parent_tool_use_id:null,message:{content:[{type:"tool_use",id:"load-1",name:"Bash",input:{command:loadReadCommand}}]}},
      {type:"user",parent_tool_use_id:null,message:{content:[{type:"tool_result",tool_use_id:"load-1",is_error:false,content:read===true?subagentPayload:read}]}});
  }
  return events.map(event=>JSON.stringify(event)).join("\n");
}
const judge=(read,fixture=loadNamed("classification"))=>judgeBehaviour({fixture,out:classificationTrace({read}),expected:[subagentRule],origin});

test("correct answers without a read of the rule are inconclusive, never a pass",()=>{
  const judged=judge(false);
  assert.equal(judged.verdict.outcome,"inconclusive");
  assert.match(judged.verdict.reasons.join(),/rule common\.subagent-models was not loaded/);
  assert.deepEqual(judged.rulesRead,[]);
});
test("correct answers after a complete read of the rule pass and record the rule as read",()=>{
  const judged=judge(true);
  assert.deepEqual(judged.verdict,{outcome:"pass",reasons:[]});
  assert.deepEqual(judged.rulesRead,["common.subagent-models"]);
});
test("a partial body of the rule is inconclusive",()=>{
  const judged=judge(subagentPayload.replace("sonnet/opus table","sonnet/opus"));
  assert.equal(judged.verdict.outcome,"inconclusive");
  assert.deepEqual(judged.rulesRead,[]);
});
test("a fixture that loads no rules is judged without the gate",()=>{
  const judged=judgeBehaviour({fixture:{...loadNamed("classification"),loadRules:false},out:classificationTrace({read:false}),expected:[subagentRule],origin});
  assert.equal(judged.verdict.outcome,"pass");
});
test("every fixture states whether it loads rules, and validation requires the key",()=>{
  assert.deepEqual(fixtureNames.map(name=>loadNamed(name).loadRules),[false,true,true]);
  assert.throws(()=>validateFixture({...loadNamed("negative"),loadRules:undefined}),/loadRules/);
});
test("a rule-loading classification run offers only Read and the two resolver patterns, never Agent",()=>{
  const resolver="C:/r/tools/rules.mjs";
  const args=behaviourCliArgs(loadNamed("classification"),"P",[],resolver);
  const tools=args[args.indexOf("--tools")+1].split(",");
  assert.deepEqual(tools.sort(),["Bash","Read"]);
  const allowed=args.slice(args.indexOf("--allowedTools")+1,args.indexOf("--"));
  assert.deepEqual(allowed,["Read",'Bash(node "C:/r/tools/rules.mjs" explain *)','Bash(node "C:/r/tools/rules.mjs" read *)']);
  assert.equal(args.includes("Agent"),false);
});
test("the loading prompt names the explain and read commands for the fixture's files",()=>{
  const fixture={...loadNamed("classification"),loadOnly:undefined};
  const prompt=loadingPrompt(fixture,{resolver:"C:/r/tools/rules.mjs",root:"C:/r"});
  assert.match(prompt,/--task implement/);
  assert.match(prompt,/tools\/fixtures\/behaviour\/toy\/format\.mjs/);
  assert.match(prompt,/--only <id>/);
  assert.match(prompt,/for each selected rule id/);
  assert.ok(prompt.endsWith(fixture.prompt));
});
test("loadOnly narrows the loading prompt to the named rule ids",()=>{
  const fixture={...loadNamed("classification"),loadOnly:["common.subagent-models"]};
  const prompt=loadingPrompt(fixture,{resolver:"C:/r/tools/rules.mjs",root:"C:/r"});
  assert.match(prompt,/--only <id>` ONLY for `common\.subagent-models` and for no other rule/);
  assert.doesNotMatch(prompt,/for each selected rule id/);
  assert.ok(prompt.endsWith(fixture.prompt));
});
test("validateFixture accepts loadOnly as non-empty id strings and refuses it without loadRules",()=>{
  const good=loadNamed("classification");
  assert.equal(validateFixture({...good,loadOnly:["a.b"]}).loadOnly[0],"a.b");
  assert.throws(()=>validateFixture({...good,loadOnly:[]}),/loadOnly/);
  assert.throws(()=>validateFixture({...good,loadOnly:[""]}),/loadOnly/);
  assert.throws(()=>validateFixture({...good,loadOnly:"a.b"}),/loadOnly/);
  assert.throws(()=>validateFixture({...good,loadRules:false}),/loadOnly/);
});
test("the classification fixture loads only the rule under test, with the measured caps",()=>{
  const fixture=loadNamed("classification");
  assert.deepEqual(fixture.loadOnly,["common.subagent-models"]);
  assert.deepEqual([fixture.caps.maxBudgetUsd,fixture.caps.timeoutMs,fixture.caps.maxOutputBytes,fixture.caps.maxReportBytes,fixture.caps.measured],[2,300000,1048576,32768,true]);
  assert.match(fixture.caps.capsNote,/overflowed 262144 B/);
  const full=loadNamed("behaviour");
  assert.equal(full.loadOnly,undefined);
  assert.deepEqual([full.caps.maxOutputBytes,full.caps.maxBudgetUsd,full.caps.timeoutMs,full.caps.maxReportBytes,full.caps.measured],[8388608,10,1800000,262144,true]);
});

// ---- the real code path: behaviourSmoke end to end with a fake claude, no paid run ----
test("behaviourSmoke runs end to end against a fake claude in a disposable worktree and records the rules read",async t=>{
  const {home,worktree}=disposableWorktree(t,"smoke-e2e");
  const fake=path.join(home,"fake-claude.mjs");
  const canned=fileURLToPath(new URL("./fixtures/traces/two-children.jsonl",import.meta.url));
  fs.writeFileSync(fake,`import fs from "node:fs";process.stdout.write(fs.readFileSync(${JSON.stringify(canned)},"utf8"));`);
  const outcome=await behaviourSmoke({repo:worktree,fixture:"negative",cli:fake});
  assert.match(outcome.status,/^behaviour (pass|fail|inconclusive)$/);
  assert.equal(outcome.exitCode,0);
  assert.deepEqual(outcome.evidence.rulesRead,[]);
});

test("a claude that exits non-zero never passes, even when its trace reads as a pass",async t=>{
  const {home,worktree}=disposableWorktree(t,"smoke-e2e-exit");
  const canned=fileURLToPath(new URL("./fixtures/traces/two-children.jsonl",import.meta.url));
  const fakeWith=code=>{
    const fake=path.join(home,`fake-claude-${code}.mjs`);
    fs.writeFileSync(fake,`import fs from "node:fs";process.stdout.write(fs.readFileSync(${JSON.stringify(canned)},"utf8"));process.exitCode=${code};`);
    return fake;
  };
  const negative=loadNamed("negative");
  const fixtureFile=path.join(home,"passing.json");
  fs.writeFileSync(fixtureFile,JSON.stringify({...negative,name:"passing",expectation:{...negative.expectation,groups:[{name:"sonnet",model:"sonnet",count:1},{name:"opus",model:"opus",count:1}],denials:0,children:2}}));
  const clean=await behaviourSmoke({repo:worktree,fixture:fixtureFile,cli:fakeWith(0)});
  assert.equal(clean.outcome+JSON.stringify(clean.reasons),"pass[]","control: the same trace with exit 0 is a pass");
  const crashed=await behaviourSmoke({repo:worktree,fixture:fixtureFile,cli:fakeWith(3)});
  assert.equal(crashed.exitCode,3);
  assert.equal(crashed.outcome,"inconclusive");
  assert.match(crashed.reasons.join(),/exited with code 3/);
});

const TOY="tools/fixtures/behaviour/toy/";
const toyScope=()=>loadNamed("behaviour").expectation.changedFiles;
test("the behaviour fixture accepts run 7's changed set: parser, config, format, checks and README",()=>{
  const changed=["README.md","args.mjs","config.mjs","format.mjs","toy-checks.mjs"].map(name=>TOY+name);
  assert.deepEqual(changedFilesReasons(toyScope(),changed),[]);
});
test("a change outside the toy directory fails the changed-files check",()=>{
  const changed=[TOY+"format.mjs",TOY+"toy-checks.mjs","tools/lib/rule-smoke.mjs"];
  assert.match(changedFilesReasons(toyScope(),changed).join(),/outside .*tools\/lib\/rule-smoke\.mjs/);
});
test("leaving format.mjs untouched fails the changed-files check",()=>{
  assert.match(changedFilesReasons(toyScope(),[TOY+"args.mjs",TOY+"toy-checks.mjs"]).join(),/unchanged.*format\.mjs/);
});
test("the exact-array form of changedFiles still means exactly that set",()=>{
  assert.deepEqual(changedFilesReasons([],[]),[]);
  assert.deepEqual(changedFilesReasons(["b","a"],["a","b"]),[]);
  assert.match(changedFilesReasons(["a"],["a","b"])[0],/expected/);
});

test("behaviourSmoke handles an object-shaped changedFiles end to end (the caller path, not just the helper)",async t=>{
  const {home,worktree}=disposableWorktree(t,"smoke-e2e-obj");
  const negative=loadNamed("negative");
  const fixtureFile=path.join(home,"object-shaped.json");
  fs.writeFileSync(fixtureFile,JSON.stringify({...negative,name:"object-shaped",expectation:{...negative.expectation,changedFiles:{within:"tools/fixtures/behaviour/toy/",mustInclude:[]}}}));
  const fake=path.join(home,"fake-claude.mjs");
  const canned=fileURLToPath(new URL("./fixtures/traces/two-children.jsonl",import.meta.url));
  fs.writeFileSync(fake,`import fs from "node:fs";process.stdout.write(fs.readFileSync(${JSON.stringify(canned)},"utf8"));`);
  const outcome=await behaviourSmoke({repo:worktree,fixture:fixtureFile,cli:fake});
  assert.match(outcome.status,/^behaviour (pass|fail|inconclusive)$/);
  assert.deepEqual(outcome.changed,[]);
});
test("evidence keeps the full prompt and description when the fixture asks, and 300 characters otherwise",()=>{
  const launch={description:"Scout: "+"d".repeat(400),prompt:"p".repeat(1000)};
  const full=recordedLaunches({recordFullPrompts:true},[launch])[0];
  assert.equal(full.prompt.length,1000);
  assert.equal(full.description.length,407);
  const cut=recordedLaunches({},[launch])[0];
  assert.equal(cut.prompt.length,300);
});

// ---- hardening from the accepted code-review round ----
test("the behaviour args never allow arbitrary node, only the resolver verbs and the toy checks",()=>{
  const args=behaviourCliArgs(loadNamed("behaviour"),"P",[],"C:/r/tools/rules.mjs");
  assert.equal(args.includes("Bash(node *)"),false,"Bash(node *) runs arbitrary code");
  assert.equal(args.includes("Bash(node --test tools/fixtures/behaviour/toy/*)"),true);
  assert.equal(args.includes('Bash(node "C:/r/tools/rules.mjs" explain *)'),true);
});
test("behaviourSmoke refuses a worktree that already carries an uncommitted change, before launching",async t=>{
  const {home,worktree}=disposableWorktree(t,"smoke-dirty");
  const tracked=path.join(worktree,"tools/fixtures/behaviour/toy/format.mjs");
  fs.appendFileSync(tracked,"\n// dirty\n");
  const marker=path.join(home,"launched");
  const fake=path.join(home,"fake-claude.mjs");
  fs.writeFileSync(fake,`import fs from "node:fs";fs.writeFileSync(${JSON.stringify(marker)},"x");`);
  await assert.rejects(behaviourSmoke({repo:worktree,fixture:"negative",cli:fake}),/uncommitted|clean/);
  assert.equal(fs.existsSync(marker),false,"nothing was launched");
});
test("a postCheck that is not node --test <path inside the behaviour fixtures> is an invalid fixture",()=>{
  const good=loadNamed("behaviour");
  const withPost=postCheck=>validateFixture({...good,expectation:{...good.expectation,postCheck}});
  assert.doesNotThrow(()=>withPost(["node","--test","tools/fixtures/behaviour/toy/toy-checks.mjs"]));
  assert.throws(()=>withPost(["cmd","/c","calc"]),/postCheck/);
  assert.throws(()=>withPost(["node","--test","tools/fixtures/behaviour/../../rule-smoke.mjs"]),/postCheck/);
  assert.throws(()=>withPost(["node","--test","/etc/x.mjs"]),/postCheck/);
  assert.throws(()=>withPost(["node","-e","1"]),/postCheck/);
});

test("changedPaths reports the new path of a renamed file",t=>{
  const dir=ownedDir(t,"chg");
  const run=(...a)=>spawnSync("git",a,{cwd:dir,encoding:"utf8"});
  run("init","-q");
  fs.writeFileSync(path.join(dir,"old.txt"),"some content more");
  run("add","old.txt");
  run("-c","user.name=t","-c","user.email=t@t","commit","-qm","x");
  run("mv","old.txt","new name.txt");
  assert.deepEqual(changedPaths(dir),["new name.txt"]);
});

test("parseArgs: --cli needs a value, unknown arguments are refused",()=>{
  assert.throws(()=>parseArgs(["--cli"]),/--cli/);
  assert.throws(()=>parseArgs(["--bogus"]),/--bogus/);
  assert.equal(parseArgs(["--cli","some/path"]).cli,"some/path");
  assert.equal(parseArgs([]).cli,undefined);
});
