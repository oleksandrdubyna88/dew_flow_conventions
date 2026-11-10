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
 * Every file-touching call of the trace: Claude's Read, Grep and Bash tool uses, Codex's shell commands. The
 * resolver's own invocations are left out, since they ARE the first path.
 */
function toolCalls(agent,events) {
  const calls=[];
  for(const event of events) {
    if(agent==="codex") {
      const item=event.item;
      if(event.type==="item.completed"&&item?.type==="command_execution")calls.push({via:"shell",command:String(item.command??"")});
      continue;
    }
    if(event.type!=="assistant")continue;
    for(const block of event.message?.content??[]) {
      if(block?.type!=="tool_use")continue;
      if(block.name==="Read")calls.push({via:"Read",path:String(block.input?.file_path??"")});
      else if(block.name==="Grep")calls.push({via:"Grep",path:String(block.input?.path??"")});
      else if(block.name==="Bash")calls.push({via:"shell",command:String(block.input?.command??"")});
    }
  }
  return calls.filter(call=>!isSingleResolverCall(call.command));
}

/**
 * True only for ONE resolver invocation (after unwrapping one `bash -lc '…'` layer): no chaining, substitution or
 * redirection. A command that also does something else is scanned like any other (the plan round on this change).
 */
function isSingleResolverCall(command) {
  if(command===undefined)return false;
  const inner=/^\s*(?:\/bin\/)?(?:ba)?sh\s+-l?c\s+(['"])([\s\S]*)\1\s*$/.exec(command)?.[2]??command;
  return inner.includes("rules.mjs")&&!/[;&|`$<>\r\n]/.test(inner);
}

const MOUNT_PREFIX=".agents/conventions/";

/** Each word of a shell command, quotes removed: the candidates for a path the command names. */
const commandWords=command=>command.split(/[\s'"]+/).filter(Boolean);

/** True when the call's path, or one word of its command, resolves to one of `files` inside the checkout. */
function namesFile(call,files,repo) {
  const candidates=call.path!==undefined?[call.path]:commandWords(call.command);
  return candidates.some(word=>files.has(comparable(path.resolve(repo,word))));
}

/**
 * § 7 part 2 for "Claude / Codex from root": ENTRY and PROJECT read, and no rule body loaded by a second path — a
 * Read or Grep of a selected rule's source file, or a shell command naming it (CodeRabbit on #152, 2026-11-10).
 * Part 1 (allSourcesRead) proves the resolver delivered every body; this proves that delivery was the only one.
 * Paths count only when they resolve to THIS checkout's files. A shell command that reaches a selected rule's folder
 * without naming one file (a glob, a variable) cannot be classified: it is listed in `unclassified` and the
 * observable is not verified.
 */
function observableEvidence(calls,expected,origin) {
  const repo=origin?.repo??process.cwd();
  const at=(...parts)=>comparable(path.resolve(repo,...parts));
  const entryRead=calls.some(call=>namesFile(call,new Set([at(MOUNT_PREFIX,"ENTRY.md"),at("ENTRY.md")]),repo));
  const projectRead=calls.some(call=>namesFile(call,new Set([at(".agents","PROJECT.md")]),repo));
  const secondPathReads=[];
  for(const rule of expected) {
    const source=String(rule.source??"");
    if(!source)continue;
    const hit=calls.find(call=>namesFile(call,new Set([at(source)]),repo));
    if(hit)secondPathReads.push({id:rule.id,via:hit.via});
  }
  const ruleFolders=[...new Set(expected.map(rule=>path.posix.dirname(String(rule.source??""))).filter(folder=>folder&&folder!=="."))];
  const named=new Set(expected.map(rule=>at(String(rule.source??""))));
  const unclassified=calls.filter(call=>call.command!==undefined
    &&ruleFolders.some(folder=>call.command.includes(folder))
    &&!commandWords(call.command).some(word=>named.has(comparable(path.resolve(repo,word))))).map(call=>call.command);
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
