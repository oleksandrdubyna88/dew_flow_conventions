import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {git} from "./rule-migration.mjs";
import {normalizedText,sha256,targetPath} from "./rule-catalog.mjs";
import {within} from "./paths.mjs";
import {run} from "./proc.mjs";

export function traceEvidence(agent,trace,expected) {
  const events=trace.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
  const outputs=[];
  let completed=false, final="";
  const models=new Set();
  for(const event of events) {
    if(agent==="codex") {
      const item=event.item;
      if(event.type==="item.completed" && item?.type==="command_execution" && item.exit_code===0) outputs.push(item.aggregated_output??"");
      if(event.type==="item.completed" && item?.type==="agent_message") final=item.text??"";
      if(event.type==="turn.completed") completed=true;
    } else {
      if(event.type==="user") for(const block of event.message?.content??[]) {
        if(block.type==="tool_result" && !block.is_error) outputs.push(typeof block.content==="string"?block.content:(block.content??[]).filter(item=>item.type==="text").map(item=>item.text).join("\n"));
      }
      if(event.type==="assistant" && event.message?.model) models.add(event.message.model);
      if(event.type==="result") {completed=event.subtype==="success" && !event.is_error;final=event.result??"";}
    }
  }
  const normalized=outputs.map(output=>output.replaceAll("\r\n","\n"));
  const reads=expected.map(rule=>({id:rule.id,hash:rule.hash,complete:normalized.some(output=>
    output.includes(`BEGIN RULE ${rule.id} sha256:${rule.hash}\n${rule.text}\nEND RULE ${rule.id}`))}));
  return {completed,reads,models:[...models],final:final.slice(0,12000),finalTruncated:final.length>12000,
    allSourcesRead:reads.length>0&&reads.every(rule=>rule.complete)};
}

function nativeCli(agent,repo,prompt) {
  if(agent==="codex") {
    const args=["exec","--ephemeral","--sandbox","read-only","--json","-C",repo,prompt];
    if(process.platform!=="win32")return {command:"codex",args};
    const entry=path.join(process.env.APPDATA??"","npm/node_modules/@openai/codex/bin/codex.js");
    if(!fs.existsSync(entry))throw new Error("Installed native Codex npm entry not found; no installation or login is performed");
    return {command:process.execPath,args:[entry,...args]};
  }
  return {command:process.platform==="win32"?path.join(process.env.USERPROFILE??"",".local/bin/claude.exe"):"claude",
    args:["-p","--no-session-persistence","--output-format","stream-json","--verbose","--max-budget-usd","3",
      "--tools","Read,Bash,Glob,Grep","--allowedTools","Read","Bash(node *)","Bash(git rev-parse *)","Bash(pwd)","Glob","Grep","--",prompt]};
}

function snapshot(repo) {
  // Detect index/HEAD changes and actual content changes, including normally ignored host settings.
  const files=new Set(git(repo,"ls-files","-z","--cached","--others","--exclude-standard").split("\0").filter(Boolean));
  for(const name of [".claude/settings.local.json",".codex/config.toml"])if(fs.existsSync(path.join(repo,name)))files.add(name);
  const hashes=[...files].sort().map(name=>{
    const file=within(repo,name);
    if(!fs.existsSync(file))return [name,"absent"];
    const stat=fs.lstatSync(file);
    if(stat.isSymbolicLink())return [name,fs.readlinkSync(file)];
    return [name,stat.isDirectory()?git(file,"status","--porcelain"):sha256(fs.readFileSync(file))];
  });
  return sha256(JSON.stringify({head:git(repo,"rev-parse","HEAD"),index:git(repo,"ls-files","--stage"),hashes}));
}

export async function smoke({repo,agent,files,cwd="."}) {
  if(!["claude","codex"].includes(agent))throw new Error("Agent must be claude or codex");
  const root=path.resolve(git(repo,"rev-parse","--show-toplevel"));
  if(!fs.statSync(path.join(root,".git")).isFile())throw new Error("Smoke requires a disposable worktree, never the original checkout");
  if(!files.length || files.length>12)throw new Error("Supply 1–12 planned --file paths");
  const scope=files.map(targetPath);
  const working=within(root,cwd);
  const resolver=path.join(root,fs.existsSync(path.join(root,"ENTRY.md"))?"tools/rules.mjs":".agents/conventions/tools/rules.mjs");
  const manifest=JSON.parse(execFileSync(process.execPath,[resolver,"explain","--repo",root,"--task","inspect",...scope.flatMap(file=>["--file",file])],{encoding:"utf8",timeout:10000,maxBuffer:262144}));
  const expected=manifest.rules.map(rule=>({...rule,text:normalizedText(within(root,rule.source))}));
  const prompt=`Read the repository instructions and explain the rules governing hypothetical new files ${scope.map(file=>JSON.stringify(file)).join(", ")}. This is read-only inspection, not implementation. Follow the repository loading procedure. Report the selected rule ids and hashes and a concrete constraint from each applicable language. Do not delegate, call reviewers, edit files, inspect credentials, or read outside this repository.`;
  const cli=nativeCli(agent,working,prompt);
  const directory=git(root,"rev-parse","--path-format=absolute","--git-path","rules-smoke");
  if(fs.existsSync(directory)&&fs.lstatSync(directory).isSymbolicLink())throw new Error("Smoke report directory cannot be a symlink");
  fs.mkdirSync(directory,{recursive:true});
  // Two fixed report slots; replacement is atomic, no growing trace/log directory or pruning job.
  const report=path.join(directory,`latest-${agent}.json`);
  const lock=report+".lock";
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
  if(fs.existsSync(report)&&fs.lstatSync(report).isSymbolicLink())throw new Error("Smoke report cannot be a symlink");
  fs.writeFileSync(lock,JSON.stringify({pid:process.pid}),{flag:"wx"});
  const save=value=>{
    const text=JSON.stringify(value,null,2)+"\n";
    if(Buffer.byteLength(text)>32768)throw new Error("Smoke evidence exceeds 32 KiB");
    fs.writeFileSync(report+".tmp",text,{flag:"wx"});
    fs.renameSync(report+".tmp",report);
  };
  const initial={status:"incomplete: running",agent,platform:process.platform,started:new Date().toISOString(),pid:process.pid,
    version:manifest.version,scope,cwd,report,promptHash:sha256(prompt)};
  const controller=new AbortController();
  const cancel=()=>controller.abort();
  process.once("SIGINT",cancel);process.once("SIGTERM",cancel);
  try {
    const before=snapshot(root);
    save(initial);
    const result=await run(cli.command,cli.args,{cwd:working,timeoutMs:180000,maxOutputBytes:262144,containTree:true,signal:controller.signal});
    const unchanged=before===snapshot(root);
    let evidence,parseFailed=false;
    try{evidence=traceEvidence(agent,result.out,expected);}catch{parseFailed=true;}
    const complete=result.code===0&&!parseFailed&&unchanged&&evidence.completed&&evidence.allSourcesRead;
    const outcome={...initial,status:complete?"source reads verified; behavior requires review":"incomplete",unchanged,
      exitCode:result.code,timedOut:result.timedOut,overflow:result.overflow,cancelled:result.cancelled,spawnFailed:result.spawnFailed,parseFailed,
      ...evidence,traceBytes:Buffer.byteLength(result.out),traceHash:sha256(result.out)};
    save(outcome);
    return outcome;
  } finally {
    process.removeListener("SIGINT",cancel);process.removeListener("SIGTERM",cancel);
    fs.unlinkSync(lock);
  }
}
