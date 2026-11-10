import path from "node:path";
import {sha256} from "./rule-catalog.mjs";

// Deliberately restricted command syntax, not a general shell parser. Unknown forms are
// incomplete evidence. The smoke prompt supplies one quoted, absolute resolver invocation.
function words(command) {
  const result=[];
  const token=/\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))/y;
  while(token.lastIndex<command.length) {
    const next=token.exec(command);
    if(!next)return [];
    result.push(next[1]??next[2]??next[3]);
  }
  return result;
}

const comparable=value=>process.platform==="win32"?value.toLowerCase():value;

function matchesRepo(args,{repo,cwd}) {
  const positions=args.flatMap((arg,index)=>arg==="--repo"?[index]:[]);
  if(!repo||positions.length!==1)return false;
  const value=args[positions[0]+1];
  return !!value&&!value.startsWith("--")&&comparable(path.resolve(cwd,value))===comparable(path.resolve(repo));
}

export function resolverRead(command,{resolver,cwd,repo},wrapped=false) {
  if(typeof command!=="string"||/[;&|<>`$\r\n]/.test(command))return false;
  const args=words(command.trim());
  if(args.length<3)return false;
  const executable=path.basename(args[0].replaceAll("\\","/")).toLowerCase();
  if(!wrapped&&["bash","sh"].includes(executable)&&args.length===3&&["-c","-lc"].includes(args[1])) {
    return resolverRead(args[2],{resolver,cwd,repo},true);
  }
  if(!wrapped&&["powershell","powershell.exe","pwsh","pwsh.exe"].includes(executable)) {
    const position=args.findIndex(arg=>arg.toLowerCase()==="-command");
    const flags=args.slice(1,position).every(arg=>["-nologo","-noprofile","-noninteractive"].includes(arg.toLowerCase()));
    return position>0&&position===args.length-2&&flags&&resolverRead(args.at(-1),{resolver,cwd,repo},true);
  }
  if(!["node","node.exe"].includes(executable)||args[2]!=="read")return false;
  if(!["node","node.exe"].includes(args[0])&&comparable(path.resolve(args[0]))!==comparable(process.execPath))return false;
  return comparable(path.resolve(cwd,args[1]))===comparable(path.resolve(resolver))&&matchesRepo(args.slice(3),{repo,cwd});
}

function sourceCollector(origin) {
  const outputs=[],sourceCalls=[];
  const capture=(command,text)=> {
    const accepted=!!origin&&resolverRead(command,origin);
    if(typeof command==="string"&&command.includes("rules.mjs")&&sourceCalls.length<8)sourceCalls.push({command:command.slice(0,512),accepted});
    if(accepted)outputs.push({text:text.replaceAll("\r\n","\n"),commandHash:sha256(command)});
  };
  return {outputs,sourceCalls,capture};
}

function codexEvents(events,capture) {
  let completed=false,final="";
  for(const event of events) {
    const item=event.item;
    if(event.type==="item.completed"&&item?.type==="command_execution"&&item.exit_code===0)capture(item.command,item.aggregated_output??"");
    if(event.type==="item.completed"&&item?.type==="agent_message")final=item.text??"";
    if(event.type==="turn.completed")completed=true;
  }
  return {completed,final,models:[]};
}

function rememberCommands(message,commands) {
  for(const block of message?.content??[]) {
    if(block.type==="tool_use"&&block.name==="Bash")commands.set(block.id,block.input?.command);
  }
}

function claudeResults(message,commands,capture) {
  for(const block of message?.content??[]) {
    if(block.type!=="tool_result"||block.is_error)continue;
    const output=typeof block.content==="string"?block.content:(block.content??[]).filter(item=>item.type==="text").map(item=>item.text).join("\n");
    capture(commands.get(block.tool_use_id),output);
  }
}

function claudeEvents(events,capture) {
  const commands=new Map(),models=new Set();
  let completed=false,final="";
  for(const event of events) {
    if(event.type==="assistant") {
      if(event.message?.model)models.add(event.message.model);
      rememberCommands(event.message,commands);
    }
    if(event.type==="user")claudeResults(event.message,commands,capture);
    if(event.type==="result") {completed=event.subtype==="success"&&!event.is_error;final=event.result??"";}
  }
  return {completed,final,models:[...models]};
}

/**
 * Every file-touching call of the trace, in order, each with its index and whether it failed: Claude's Read, Grep
 * and Bash tool uses (failed = its tool_result says is_error), Codex's shell commands (failed = a non-zero exit).
 * The resolver's own invocations are left out, since they ARE the first path.
 */
function toolCalls(agent,events) {
  const calls=[],failedIds=new Set();
  for(const event of events) {
    if(agent==="codex") {
      const item=event.item;
      if(event.type==="item.completed"&&item?.type==="command_execution")calls.push({via:"shell",command:String(item.command??""),error:item.exit_code!==0});
      continue;
    }
    if(event.type==="user") {
      for(const block of event.message?.content??[])if(block?.type==="tool_result"&&block.is_error)failedIds.add(block.tool_use_id);
      continue;
    }
    if(event.type!=="assistant")continue;
    for(const block of event.message?.content??[]) {
      if(block?.type!=="tool_use")continue;
      if(block.name==="Read")calls.push({via:"Read",id:block.id,path:String(block.input?.file_path??"")});
      else if(block.name==="Grep")calls.push({via:"Grep",id:block.id,path:String(block.input?.path??"")});
      else if(block.name==="Bash")calls.push({via:"shell",id:block.id,command:String(block.input?.command??"")});
    }
  }
  return calls.map((call,index)=>({...call,index,error:call.error??failedIds.has(call.id)}))
    .filter(call=>!isSingleResolverCall(call.command));
}

const SHELL_WRAPPER=/^\s*(?:\/(?:usr\/)?bin\/)?(?:ba)?sh\s+-l?c\s+(['"])([\s\S]*)\1\s*$/;

/** The command inside one `bash -lc '…'` layer, or the command itself. */
const innerCommand=command=>SHELL_WRAPPER.exec(command)?.[2]??command;

/**
 * True only for ONE resolver invocation (after unwrapping one `bash -lc '…'` layer): no chaining, substitution or
 * redirection. A command that also does something else is scanned like any other (the plan round on this change).
 */
function isSingleResolverCall(command) {
  if(command===undefined)return false;
  const inner=innerCommand(command);
  return inner.includes("rules.mjs")&&!/[;&|`$<>\r\n]/.test(inner);
}

const MOUNT=".agents/conventions";

/** Each word of a shell command, a quoted run kept whole with its quotes removed: the candidates for a path. */
const commandWords=command=>[...innerCommand(command).matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(match=>match[1]??match[2]??match[3]);

/** A shell command whose words a reader cannot resolve to fixed files: a variable, a glob or a substitution. */
const DYNAMIC=/[$*?[`]/;

/** The checkout file a word names, or undefined for a word no path can be made of (a NUL byte, say). */
function resolvedIn(repo,word) {
  try {return comparable(path.resolve(repo,word));}
  catch {return undefined;}
}

/** Every checkout path the call names: its path, or each word of its command. Resolved once per call. */
const targetsOf=(call,repo)=>(call.path!==undefined?[call.path]:commandWords(call.command)).map(word=>resolvedIn(repo,word)).filter(Boolean);

/**
 * § 7 part 2 for "Claude / Codex from root": ENTRY and PROJECT read, and no rule body loaded by a second path — a
 * Read or Grep of a selected rule's source file, or a shell command naming it (CodeRabbit on #152, 2026-11-10).
 * Part 1 (allSourcesRead) proves the resolver delivered every body; this proves that delivery was the only one.
 * Paths count only when they resolve to THIS checkout's files, and a read counts only when it did not fail. A body
 * reached by a second path counts even from a failed call: a chained command can print it and still exit non-zero.
 * A call that reaches a selected rule's folder, or a dynamic shell command that mentions the mount, without naming
 * one rule file cannot be classified: it is listed in `unclassified` with its index, and the observable is not
 * verified (the code round on this change).
 */
function observableEvidence(calls,expected,origin) {
  const repo=origin?.repo??process.cwd();
  const at=(...parts)=>resolvedIn(repo,path.join(...parts));
  const targeted=calls.map(call=>({call,targets:targetsOf(call,repo)}));
  const readOk=files=>targeted.some(({call,targets})=>!call.error&&targets.some(target=>files.has(target)));
  const entryRead=readOk(new Set([at(MOUNT,"ENTRY.md"),at("ENTRY.md")]));
  const projectRead=readOk(new Set([at(".agents","PROJECT.md")]));
  const sources=expected.map(rule=>({id:rule.id,source:String(rule.source??"")})).filter(rule=>rule.source);
  const secondPathReads=[];
  for(const rule of sources) {
    const file=at(rule.source);
    const hit=targeted.find(({targets})=>targets.includes(file));
    if(hit)secondPathReads.push({id:rule.id,via:hit.call.via});
  }
  const ruleFiles=new Set(sources.map(rule=>at(rule.source)));
  const ruleFolders=new Set(sources.map(rule=>path.posix.dirname(rule.source)).filter(folder=>folder!==".").map(folder=>at(folder)));
  const unclassified=targeted.filter(({call,targets})=>!targets.some(target=>ruleFiles.has(target))
    &&(targets.some(target=>ruleFolders.has(target))||(call.command!==undefined&&DYNAMIC.test(innerCommand(call.command))&&call.command.includes(MOUNT))))
    .map(({call})=>({index:call.index,command:call.command??call.path}));
  return {entryRead,projectRead,secondPathReads,unclassified,
    verified:entryRead&&projectRead&&secondPathReads.length===0&&unclassified.length===0};
}

function decodedEvidence(agent,trace,expected,origin) {
  const events=trace.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
  const {outputs,sourceCalls,capture}=sourceCollector(origin);
  const {completed,final,models}=agent==="codex"?codexEvents(events,capture):claudeEvents(events,capture);
  const reads=expected.map(rule=>{
    const evidence=outputs.find(output=>output.text.includes(`BEGIN RULE ${rule.id} sha256:${rule.hash}\n${rule.text}\nEND RULE ${rule.id}`));
    return {id:rule.id,hash:rule.hash,complete:!!evidence,...(evidence?{sourceCommandHash:evidence.commandHash}:{})};
  });
  return {completed,reads,sourceCalls,models,final:final.slice(0,12000),finalTruncated:final.length>12000,
    allSourcesRead:reads.length>0&&reads.every(rule=>rule.complete),
    observable:observableEvidence(toolCalls(agent,events),expected,origin)};
}

export function traceEvidence(agent,trace,expected,origin) {
  try {return {...decodedEvidence(agent,trace,expected,origin),parseFailed:false};}
  catch(error) {
    // Parser messages can embed raw trace content. Retain the error kind without persisting it.
    return {parseFailed:true,parseError:`${error.name}: native event stream could not be decoded`,
      completed:false,allSourcesRead:false,final:"",finalTruncated:false,sourceCalls:[],models:[],
      reads:expected.map(({id,hash})=>({id,hash,complete:false})),
      observable:{entryRead:false,projectRead:false,secondPathReads:[],unclassified:[],verified:false}};
  }
}

const LAUNCH_TOOLS=new Set(["Agent","Task"]);
const EDIT_TOOLS=new Set(["Edit","Write","MultiEdit","NotebookEdit"]);

/** Measurement limit of the Claude stream, recorded in every evidence object (recorded trace 2026-10-13). */
export const DELEGATION_LIMITS=["A child's own assistant events are not in the stream; resolution is aggregate (result.modelUsage), so an opus child cannot be separated from an opus parent."];

const toolUses=event=>(event.message?.content??[]).filter(block=>block?.type==="tool_use");
const toolResults=event=>(event.message?.content??[]).filter(block=>block?.type==="tool_result");

function resultText(block) {
  if(typeof block.content==="string")return block.content;
  return (block.content??[]).filter(item=>item?.type==="text").map(item=>item.text).join("\n");
}

/** `claude-sonnet-5-5` -> `sonnet`; keys that are not `claude-<family>-...` give no family. */
export function modelFamily(key) {
  return /^claude-([a-z]+)/.exec(String(key))?.[1]??"";
}

function usageTotal(entry) {
  return ["inputTokens","outputTokens","cacheReadInputTokens","cacheCreationInputTokens"].reduce((sum,name)=>sum+(Number(entry?.[name])||0),0);
}

function resultEvidence(event) {
  if(!event)return {present:false};
  const families={};
  for(const [key,entry] of Object.entries(event.modelUsage??{})) {
    const family=modelFamily(key);
    if(family)families[family]=(families[family]??0)+usageTotal(entry);
  }
  return {present:true,subtype:event.subtype??"",isError:event.is_error===true,costUsd:event.total_cost_usd??null,
    text:typeof event.result==="string"?event.result:"",families,subagentStats:event.subagent_stats??null,
    permissionDenials:Array.isArray(event.permission_denials)?event.permission_denials.length:0,
    terminalReason:event.terminal_reason??""};
}

/**
 * What a Claude stream-json trace shows about delegation: the parent's Agent/Task launches, how each one ended,
 * the marker denials, parent-level edits, nested launches and the final result. Unknown event types are ignored.
 */
export function delegationEvidence(events,{marker}={}) {
  const launches=new Map(),parentEdits=[],nestedLaunches=[];
  let result;
  for(const event of events) {
    const parent=event.parent_tool_use_id??null;
    if(event.type==="assistant")for(const block of toolUses(event)) {
      if(LAUNCH_TOOLS.has(block.name)&&parent===null) {
        const prompt=String(block.input?.prompt??"");
        launches.set(block.id,{id:block.id,model:block.input?.model??null,subagentType:block.input?.subagent_type??"",description:String(block.input?.description??""),prompt,
          promptHash:sha256(prompt),background:block.input?.run_in_background===true,started:false,childEvents:0,taskStatus:"",terminal:false,denials:0});
      } else if(LAUNCH_TOOLS.has(block.name))nestedLaunches.push(block.id);
      else if(EDIT_TOOLS.has(block.name)&&parent===null)parentEdits.push(String(block.input?.file_path??block.input?.notebook_path??""));
    }
    if(event.type==="user"&&parent!==null&&launches.has(parent))launches.get(parent).childEvents++;
    if(event.type==="user"&&parent===null)for(const block of toolResults(event)) {
      const launch=launches.get(block.tool_use_id);
      if(!launch)continue;
      launch.terminal=true;
      if(block.is_error===true&&marker&&resultText(block).includes(marker))launch.denials++;
    }
    if(event.type==="system"&&launches.has(event.tool_use_id)) {
      if(event.subtype==="task_started")launches.get(event.tool_use_id).started=true;
      if(event.subtype==="task_notification")launches.get(event.tool_use_id).taskStatus=String(event.status??"");
    }
    if(event.type==="result")result=event;
  }
  return {launches:[...launches.values()],parentEdits,nestedLaunches,result:resultEvidence(result),limits:DELEGATION_LIMITS};
}
