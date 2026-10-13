import {test} from "node:test";
import assert from "node:assert/strict";
import {traceEvidence,smokeResolver,installedCli,snapshot,behaviourCliArgs,behaviourSmoke,judgeBehaviour,loadingPrompt} from "./lib/rule-smoke.mjs";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {delegationEvidence} from "./lib/rule-trace.mjs";
import {behaviourVerdict,validateFixture,loadFixture,runBehaviourSequence,BEHAVIOUR_ORDER,DENY_MARKER} from "./lib/rule-behaviour.mjs";
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
test("the behaviour fixture asks for five scouts, a coder, a reviewer and seven children",()=>{
  const {expectation}=loadNamed("behaviour");
  assert.deepEqual(expectation.groups.map(group=>[group.name,group.model,group.count]),[["coder","sonnet",1],["scouts","sonnet",5],["reviewer","opus",1]]);
  assert.equal(expectation.children,7);
  assert.equal(expectation.denials,0);
});
test("the behaviour mode refuses to run outside a disposable worktree",async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"smoke-behaviour-"));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
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
  const prompt=loadingPrompt(loadNamed("classification"),{resolver:"C:/r/tools/rules.mjs",root:"C:/r"});
  assert.match(prompt,/--task implement/);
  assert.match(prompt,/tools\/fixtures\/behaviour\/toy\/format\.mjs/);
  assert.match(prompt,/--only <id>/);
  assert.ok(prompt.endsWith(loadNamed("classification").prompt));
});

// ---- the real code path: behaviourSmoke end to end with a fake claude, no paid run ----
test("behaviourSmoke runs end to end against a fake claude in a disposable worktree and records the rules read",async t=>{
  const home=fs.mkdtempSync(path.join(os.tmpdir(),"smoke-e2e-"));
  const worktree=path.join(home,"wt");
  const top=git(process.cwd(),"rev-parse","--show-toplevel");
  git(top,"worktree","add","--detach",worktree,"HEAD");
  const modules=path.join(worktree,"node_modules");
  fs.symlinkSync(path.join(top,"node_modules"),modules,"junction");
  t.after(()=>{
    try {fs.rmdirSync(modules);git(top,"worktree","remove","--force",worktree);} finally {fs.rmSync(home,{recursive:true,force:true});git(top,"worktree","prune");}
  });
  const fake=path.join(home,"fake-claude.mjs");
  const canned=fileURLToPath(new URL("./fixtures/traces/two-children.jsonl",import.meta.url));
  fs.writeFileSync(fake,`import fs from "node:fs";process.stdout.write(fs.readFileSync(${JSON.stringify(canned)},"utf8"));`);
  const outcome=await behaviourSmoke({repo:worktree,fixture:"negative",cli:fake});
  assert.match(outcome.status,/^behaviour (pass|fail|inconclusive)$/);
  assert.equal(outcome.exitCode,0);
  assert.deepEqual(outcome.evidence.rulesRead,[]);
});
