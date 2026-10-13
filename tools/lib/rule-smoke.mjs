import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {git} from "./git.mjs";
import {normalizedText,sha256,targetPath} from "./rule-catalog.mjs";
import {within} from "./paths.mjs";
import {run} from "./proc.mjs";
import {bootstrap} from "./rule-cli.mjs";
import {traceEvidence,delegationEvidence} from "./rule-trace.mjs";
import {behaviourVerdict,loadFixture,DENY_MARKER} from "./rule-behaviour.mjs";
export {traceEvidence} from "./rule-trace.mjs";

export function smokeResolver(root) {
  const mounted=path.join(root,".agents/conventions/tools/rules.mjs");
  if(fs.existsSync(mounted))return mounted;
  const own=path.join(root,"tools/rules.mjs"),adapter=path.join(root,"AGENTS.md");
  if(fs.existsSync(own)&&fs.existsSync(adapter)&&normalizedText(adapter)===bootstrap("ENTRY.md"))return own;
  throw new Error("No mounted resolver or recognized conventions source bootstrap; instruction loading is incomplete");
}

export function installedCli(agent,explicit,platform=process.platform,env=process.env) {
  if(explicit) {
    const file=path.resolve(explicit);
    if(!fs.statSync(file).isFile())throw new Error("--cli must name an installed executable or JavaScript CLI entry");
    if(/\.[cm]?js$/i.test(file))return {command:process.execPath,prefix:[file]};
    if(platform==="win32"&&!/\.exe$/i.test(file))throw new Error("Windows --cli requires .exe or a JavaScript entry; shell wrappers are not executed");
    return {command:file,prefix:[]};
  }
  if(platform!=="win32")return {command:agent,prefix:[]};
  const native=(env.PATH??"").split(";").filter(Boolean).map(directory=>path.join(directory,`${agent}.exe`))
    .find(file=>fs.existsSync(file)&&fs.statSync(file).isFile());
  if(native)return {command:native,prefix:[]};
  const fallback=agent==="codex"?path.join(env.APPDATA??"","npm/node_modules/@openai/codex/bin/codex.js"):
    path.join(env.USERPROFILE??"",".local/bin/claude.exe");
  if(fs.existsSync(fallback))return installedCli(agent,fallback,platform,env);
  throw new Error(`Installed ${agent} CLI not found; pass --cli with its executable or JavaScript entry. No installation or login is performed`);
}

function nativeCli(agent,repo,prompt,resolver,explicit) {
  const executable=installedCli(agent,explicit);
  if(agent==="codex") {
    const args=["exec","--ephemeral","--sandbox","read-only","--json","-C",repo,prompt];
    return {command:executable.command,args:[...executable.prefix,...args]};
  }
  // Trusted repository inspection: narrow auto-approval is not an OS filesystem sandbox.
  const invocation=`node "${resolver.replaceAll("\\","/")}"`;
  return {command:executable.command,
    args:[...executable.prefix,"-p","--no-session-persistence","--output-format","stream-json","--verbose","--max-budget-usd","3",
      "--tools","Read,Bash,Glob,Grep","--allowedTools","Read",...["check","explain","read"].map(verb=>`Bash(${invocation} ${verb} *)`),
      "Bash(git rev-parse *)","Bash(pwd)","Glob","Grep","--",prompt]};
}

function codeUnitOrder(a,b) {
  if(a===b)return 0;
  return a<b?-1:1;
}

export function snapshot(repo,names) {
  // Git metadata plus bounded content of the inspected scope, not a whole-repository content audit.
  const files=new Set([...names,".claude/settings.local.json",".codex/config.toml"]);
  if(files.size>512)throw new Error("Smoke snapshot exceeds 512 paths");
  let bytes=0;
  const hashes=[...files].sort(codeUnitOrder).map(name=>{
    const file=within(repo,name);
    if(!fs.existsSync(file))return [name,"absent"];
    const stat=fs.lstatSync(file);
    if(stat.isSymbolicLink()||!stat.isFile())throw new Error(`Snapshot source must be a regular file: ${name}`);
    within(fs.realpathSync(repo),fs.realpathSync(file),"snapshot source");
    // A fixed read buffer also bounds a file that grows after stat. Reject before allocating the full file.
    if(stat.size>1048576)throw new Error(`Smoke snapshot source exceeds 1 MiB: ${name}`);
    const descriptor=fs.openSync(file,"r");
    try {
      const data=Buffer.alloc(stat.size+1);
      let count=0,read;
      do {read=fs.readSync(descriptor,data,count,data.length-count,null);count+=read;}while(read&&count<data.length);
      bytes+=count;
      if(count>stat.size)throw new Error(`Smoke snapshot source grew during read: ${name}`);
      if(count>1048576||bytes>8388608)throw new Error("Smoke snapshot exceeds 1 MiB per source or 8 MiB total");
      return [name,sha256(data.subarray(0,count))];
    } finally {fs.closeSync(descriptor);}
  });
  return sha256(JSON.stringify({head:git(repo,"rev-parse","HEAD"),index:git(repo,"ls-files","--stage"),
    status:git(repo,"status","--porcelain","--untracked-files=normal"),hashes}));
}

function assertAvailableLock(report,lock) {
  if(fs.existsSync(lock)) {
    if(fs.lstatSync(lock).isSymbolicLink())throw new Error("Smoke lock cannot be a symlink");
    const owner=JSON.parse(fs.readFileSync(lock,"utf8"));
    if(!Number.isSafeInteger(owner.pid)||owner.pid<1)throw new Error("Unknown smoke lock; inspect before recovery");
    let dead=false;
    try{process.kill(owner.pid,0);}catch(error){if(error.code==="ESRCH")dead=true;else throw error;}
    if(!dead)throw new Error(`Smoke already owned by process ${owner.pid}`);
    // Never reap a lock with read-then-delete: another recovery can acquire it in between.
    throw new Error(`Previous smoke owner ${owner.pid} is dead; run incomplete. Inspect ${report}, then recover its named .lock/.tmp files before retrying`);
  }
}

function smokeReports(root,agent,maxBytes=32768) {
  const directory=git(root,"rev-parse","--path-format=absolute","--git-path","rules-smoke");
  if(fs.existsSync(directory)&&fs.lstatSync(directory).isSymbolicLink())throw new Error("Smoke report directory cannot be a symlink");
  fs.mkdirSync(directory,{recursive:true});
  // Two fixed report slots; replacement is atomic, no growing trace/log directory or pruning job.
  const report=path.join(directory,`latest-${agent}.json`);
  const lock=report+".lock";
  assertAvailableLock(report,lock);
  if(fs.existsSync(report)&&fs.lstatSync(report).isSymbolicLink())throw new Error("Smoke report cannot be a symlink");
  fs.writeFileSync(lock,JSON.stringify({pid:process.pid}),{flag:"wx"});
  const save=value=>{
    const text=JSON.stringify(value,null,2)+"\n";
    if(Buffer.byteLength(text)>maxBytes)throw new Error(`Smoke evidence exceeds ${maxBytes} bytes`);
    fs.writeFileSync(report+".tmp",text,{flag:"wx"});
    fs.renameSync(report+".tmp",report);
  };
  return {report,lock,save};
}

export function disposableRoot(repo) {
  const root=path.resolve(git(repo,"rev-parse","--show-toplevel"));
  if(!fs.statSync(path.join(root,".git")).isFile())throw new Error("Smoke requires a disposable worktree, never the original checkout");
  return root;
}

export async function smoke({repo,agent,files,cwd=".",cli:explicitCli}) {
  if(!["claude","codex"].includes(agent))throw new Error("Agent must be claude or codex");
  const root=path.resolve(git(repo,"rev-parse","--show-toplevel"));
  if(!fs.statSync(path.join(root,".git")).isFile())throw new Error("Smoke requires a disposable worktree, never the original checkout");
  if(!files.length || files.length>12)throw new Error("Supply 1–12 planned --file paths");
  const scope=files.map(targetPath);
  const working=within(root,cwd);
  console.error(`smoke-rules: ${agent} preflight started`);
  const resolver=smokeResolver(root);
  const manifest=JSON.parse(execFileSync(process.execPath,[resolver,"explain","--repo",root,"--task","inspect",...scope.flatMap(file=>["--file",file])],{encoding:"utf8",timeout:10000,maxBuffer:262144}));
  const expected=manifest.rules.map(rule=>({...rule,text:normalizedText(within(root,rule.source))}));
  const prompt=`Read the repository instructions and explain the rules governing hypothetical new files ${scope.map(file=>JSON.stringify(file)).join(", ")}. This is read-only inspection, not implementation. Follow the repository loading procedure. Invoke node "${resolver.replaceAll("\\","/")}" as a single command per tool call, with --repo "${root.replaceAll("\\","/")}"; do not prefix cd or combine shell commands. Keep the final answer concise: selected rule ids/hashes and a concrete constraint from each applicable language. Do not delegate, call reviewers, edit files, inspect credentials, or read outside this repository.`;
  const cli=nativeCli(agent,working,prompt,resolver,explicitCli);
  const snapshotPaths=[...manifest.instructions.map(item=>item.path),...manifest.rules.map(item=>item.source),...scope];
  const {report,lock,save}=smokeReports(root,agent);
  const initial={status:"incomplete: running",agent,platform:process.platform,started:new Date().toISOString(),pid:process.pid,
    version:manifest.version,scope,cwd,report,promptHash:sha256(prompt),
    unchangedScope:"Git HEAD/index/status plus instruction, selected rule, requested file and host-setting content; other file content is not hashed"};
  const controller=new AbortController();
  const cancel=()=>controller.abort();
  process.once("SIGINT",cancel);process.once("SIGTERM",cancel);
  const heartbeat=setInterval(()=>console.error(`smoke-rules: ${agent} running; deadline 180s, report ${report}`),20000);
  try {
    const before=snapshot(root,snapshotPaths);
    save(initial);
    const result=await run(cli.command,cli.args,{cwd:working,timeoutMs:180000,maxOutputBytes:262144,containTree:true,signal:controller.signal});
    const unchanged=before===snapshot(root,snapshotPaths);
    const evidence=traceEvidence(agent,result.out,expected,{resolver,cwd:working,repo:root});
    const complete=result.code===0&&!evidence.parseFailed&&unchanged&&evidence.completed&&evidence.allSourcesRead;
    const outcome={...initial,status:complete?"source reads verified; behavior requires review":"incomplete",unchanged,
      exitCode:result.code,timedOut:result.timedOut,overflow:result.overflow,cancelled:result.cancelled,spawnFailed:result.spawnFailed,
      ...(result.spawnError?{spawnError:result.spawnError}:{}),
      ...evidence,traceBytes:Buffer.byteLength(result.out),traceHash:sha256(result.out)};
    save(outcome);
    return outcome;
  } finally {
    clearInterval(heartbeat);
    process.removeListener("SIGINT",cancel);process.removeListener("SIGTERM",cancel);
    fs.unlinkSync(lock);
  }
}

/**
 * Argument list of a behaviour run. Caps and the tool set come from the fixture, never from constants here.
 * Bash is narrowed to node and a rev-parse; every other offered tool is allowed outright (disposable worktree).
 */
export function behaviourCliArgs(fixture,prompt,prefix=[],resolver="") {
  const offered=fixture.tools.split(",").map(name=>name.trim()).filter(Boolean);
  const loading=fixture.loadRules?loadingTools(resolver):{tools:[],allowed:[]};
  const tools=[...new Set([...offered,...loading.tools])];
  const allowed=[...new Set([...offered.flatMap(name=>name==="Bash"?["Bash(node *)","Bash(git rev-parse *)","Bash(pwd)"]:[name]),...loading.allowed])];
  return [...prefix,"-p","--no-session-persistence","--output-format","stream-json","--verbose",
    "--max-budget-usd",String(fixture.caps.maxBudgetUsd),"--tools",tools.join(","),
    ...(allowed.length?["--allowedTools",...allowed]:[]),"--",prompt];
}

/** Tools the rule loading needs: Read, and Bash narrowed to the resolver's explain and read verbs. */
function loadingTools(resolver) {
  if(!resolver)throw new Error("A rule-loading fixture needs the resolver path");
  const invocation=`node "${forwardSlashes(resolver)}"`;
  return {tools:["Bash","Read"],allowed:["Read",...["explain","read"].map(verb=>`Bash(${invocation} ${verb} *)`)]};
}

function changedPaths(root) {
  return git(root,"status","--porcelain","--untracked-files=all").split(/\r?\n/).filter(Boolean)
    .map(line=>line.slice(3).replace(/^"|"$/g,"").replaceAll("\\","/")).sort(codeUnitOrder);
}

function changedSince(before,after) {
  return after.filter(file=>!before.includes(file));
}

/** Behaviour mode: one fixture in a disposable worktree, the verdict from `behaviourVerdict`. */
export async function behaviourSmoke({repo,fixture:fixtureName,cli:explicitCli}) {
  const root=disposableRoot(repo);
  const fixture=loadFixture(root,fixtureName);
  const scope=fixture.files.map(targetPath);
  const resolver=smokeResolver(root);
  const manifest=JSON.parse(execFileSync(process.execPath,[resolver,"explain","--repo",root,"--task","implement",...scope.flatMap(file=>["--file",file])],{encoding:"utf8",timeout:10000,maxBuffer:262144}));
  const expected=manifest.rules.map(rule=>({...rule,text:normalizedText(within(root,rule.source))}));
  const prompt=loadingPrompt(fixture,{resolver,root});
  const executable=installedCli("claude",explicitCli);
  const label=`behaviour-${fixture.name}`;
  const {report,lock,save}=smokeReports(root,label,fixture.caps.maxReportBytes);
  const initial={status:"incomplete: running",agent:"claude",mode:"behaviour",fixture:fixture.name,platform:process.platform,
    started:new Date().toISOString(),pid:process.pid,report,caps:fixture.caps,promptHash:sha256(prompt)};
  const controller=new AbortController();
  const cancel=()=>controller.abort();
  process.once("SIGINT",cancel);process.once("SIGTERM",cancel);
  const heartbeat=setInterval(()=>console.error(`smoke-rules: behaviour ${fixture.name} running; deadline ${fixture.caps.timeoutMs/1000}s, report ${report}`),20000);
  try {
    const before=changedPaths(root);
    save(initial);
    const result=await run(executable.command,behaviourCliArgs(fixture,prompt,executable.prefix,resolver),
      {cwd:root,timeoutMs:fixture.caps.timeoutMs,maxOutputBytes:fixture.caps.maxOutputBytes,containTree:true,signal:controller.signal});
    const outcome=await behaviourOutcome({fixture,root,result,before,initial,expected,origin:{resolver,cwd:root,repo:root}});
    save(outcome);
    return outcome;
  } finally {
    clearInterval(heartbeat);
    process.removeListener("SIGINT",cancel);process.removeListener("SIGTERM",cancel);
    fs.unlinkSync(lock);
  }
}

export const GATE_RULE="common.subagent-models";

/** Rule ids of `expected` whose complete canonical body a successful resolver read in the trace delivered. */
function rulesReadIn(out,expected,origin) {
  const found=traceEvidence("claude",out,expected,origin);
  return found.reads.filter(read=>read.complete).map(read=>read.id);
}

/**
 * Pure verdict of a behaviour trace. A fixture that loads rules is never judged on a rule the session did not
 * read completely: that is `inconclusive`, whatever the answers or launches were.
 */
export function judgeBehaviour({fixture,out,expected,origin}) {
  const {events,parseFailed}=parseEvents(out);
  const evidence=delegationEvidence(events,{marker:DENY_MARKER});
  const verdict=behaviourVerdict(evidence,fixture.expectation);
  const rulesRead=fixture.loadRules?rulesReadIn(out,expected,origin):[];
  if(fixture.loadRules&&!rulesRead.includes(GATE_RULE))
    return {evidence,verdict:{outcome:"inconclusive",reasons:[`rule ${GATE_RULE} was not loaded`]},parseFailed,rulesRead};
  return {evidence,verdict,parseFailed,rulesRead};
}

const forwardSlashes=value=>value.replaceAll("\\","/");

/** The loading instruction put before a rule-loading fixture's own prompt (style of the inspect smoke). */
export function loadingPrompt(fixture,{resolver,root}) {
  if(!fixture.loadRules)return fixture.prompt;
  const node=`node "${forwardSlashes(resolver)}"`,repo=`--repo "${forwardSlashes(root)}"`;
  const files=fixture.files.map(file=>`--file ${file}`).join(" ");
  return `First load this repository's rules for the task through the resolver. Run \`${node} explain ${repo} --task implement ${files}\`, `
    +`then run \`${node} read ${repo} --task implement ${files} --only <id>\` for each selected rule id (the whole payload is too large for one read). `
    +`One command per tool call; do not prefix cd, do not chain or combine shell commands. Only after every selected rule is read, do the task below.

${fixture.prompt}`;
}

function parseEvents(out) {
  try {return {events:out.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line)),parseFailed:false};}
  catch {return {events:[],parseFailed:true};}
}

async function postCheck(fixture,root) {
  const command=fixture.expectation.postCheck;
  if(!command)return {ran:false,ok:true};
  const done=await run(command[0]==="node"?process.execPath:command[0],command.slice(1),{cwd:root,timeoutMs:60000,maxOutputBytes:262144});
  return {ran:true,ok:done.code===0};
}

async function behaviourOutcome({fixture,root,result,before,initial,expected,origin}) {
  const {events,parseFailed}=parseEvents(result.out);
  const evidence=delegationEvidence(events,{marker:DENY_MARKER});
  const verdict=behaviourVerdict(evidence,fixture.expectation);
  const expectedChanged=[...(fixture.expectation.changedFiles??[])].sort(codeUnitOrder);
  const changed=changedSince(before,changedPaths(root));
  const reasons=[...verdict.reasons];
  if(parseFailed)reasons.push("the trace could not be decoded");
  if(JSON.stringify(changed)!==JSON.stringify(expectedChanged))reasons.push(`changed files ${JSON.stringify(changed)}, expected ${JSON.stringify(expectedChanged)}`);
  const post=verdict.outcome==="inconclusive"?{ran:false,ok:true}:await postCheck(fixture,root);
  if(!post.ok)reasons.push("the post-run check failed");
  const outcomeName=verdict.outcome==="pass"&&reasons.length?"fail":verdict.outcome;
  return {...initial,status:`behaviour ${outcomeName}`,outcome:outcomeName,reasons,changed,postCheck:post,
    exitCode:result.code,timedOut:result.timedOut,overflow:result.overflow,cancelled:result.cancelled,spawnFailed:result.spawnFailed,
    evidence:{...evidence,rulesRead,launches:evidence.launches.map(launch=>({...launch,prompt:launch.prompt.slice(0,300)}))},
    traceBytes:Buffer.byteLength(result.out),traceHash:sha256(result.out)};
}
