import fs from "node:fs";
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
 * Every file-touching call of the trace, in order, each with its index, whether it failed and what it printed:
 * Claude's Read, Grep and Bash tool uses (failed = its tool_result says is_error; output = that result's text),
 * Codex's shell commands (failed = a non-zero exit, or started and never completed; output = aggregated_output).
 * The resolver's own single invocations are left out, since they ARE the first path.
 */
function toolCalls(agent,events,origin) {
  const calls=[],failedIds=new Set(),codexById=new Map(),outputs=new Map();
  for(const event of events) {
    if(agent==="codex") {
      const item=event.item;
      if(item?.type!=="command_execution"||!["item.started","item.completed"].includes(event.type))continue;
      const completed=event.type==="item.completed";
      const call={via:"shell",command:String(item.command??""),error:!completed||item.exit_code!==0,output:String(item.aggregated_output??"")};
      const known=item.id!==undefined?codexById.get(item.id):undefined;
      if(known!==undefined)calls[known]=call;
      else {
        if(item.id!==undefined)codexById.set(item.id,calls.length);
        calls.push(call);
      }
      continue;
    }
    if(event.type==="user") {
      for(const block of event.message?.content??[]) {
        if(block?.type!=="tool_result")continue;
        if(block.is_error)failedIds.add(block.tool_use_id);
        outputs.set(block.tool_use_id,resultText(block));
      }
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
  return calls.map((call,index)=>({...call,index,error:call.error??failedIds.has(call.id),output:call.output??outputs.get(call.id)??""}))
    .filter(call=>!isSingleResolverCall(call.command,origin));
}

/** A line-number prefix: Claude Code's Read (a number and a tab, or an arrow), `cat -n` (spaces), or `nl -s:`. */
const READ_PREFIX=/^\s*\d+(?:\t|→|:\s?|\s{2,})/;

/** Text as a reader compares it: CRLF folded, each line trimmed, blank lines dropped. */
const contentLines=(text,stripPrefix=false)=>String(text).replaceAll("\r\n","\n").split("\n")
  .map(line=>(stripPrefix?line.replace(READ_PREFIX,""):line).trim()).filter(Boolean);

/** A window of a file that proves a read: this many consecutive non-blank lines, one of them at least this long. */
const READ_WINDOW=3,DISTINCT_LINE=20;

/**
 * True when `shown` (an output's comparable lines) holds some READ_WINDOW consecutive non-blank lines of the file
 * (fewer only when the file has fewer), consecutive in the output too, one of them DISTINCT_LINE characters or longer.
 * A line like `#` or `---` alone proves nothing, three lines scattered between others prove nothing, and a read from
 * the middle of the file still counts (the plan and code rounds on #156, 2026-11-11).
 */
function showsFile(shown,fileLines) {
  if(fileLines.length===0)return false;
  const size=Math.min(READ_WINDOW,fileLines.length);
  for(let start=0;start+size<=fileLines.length;start+=1) {
    const window=fileLines.slice(start,start+size);
    if(!window.some(line=>line.length>=DISTINCT_LINE))continue;
    for(let at=shown.indexOf(window[0]);at!==-1;at=shown.indexOf(window[0],at+1)) {
      if(window.every((line,offset)=>shown[at+offset]===line))return true;
    }
  }
  return false;
}

/**
 * The comparable lines of a checkout file, or none when it cannot be read (missing, a folder, no permission): a file
 * the harness cannot read cannot be shown to have been read, so the answer is "not read", never a crash (the code round).
 */
function fileLinesOf(file) {
  try {
    return contentLines(fs.readFileSync(file,"utf8"));
  } catch {
    return [];
  }
}

const SHELL_WRAPPER=/^\s*(?:\/(?:usr\/)?bin\/)?(?:ba)?sh\s+-l?c\s+(['"])([\s\S]*)\1\s*$/;

/** The command inside one `bash -lc '…'` layer, or the command itself. */
const innerCommand=command=>SHELL_WRAPPER.exec(command)?.[2]??command;

/**
 * True only for ONE run of THIS run's resolver by node (after unwrapping one `bash -lc '…'` layer): no chaining,
 * substitution or redirection. Anything else, a command that only mentions rules.mjs included, is scanned like any
 * other (the plan round and the second code round on this change). Without an origin nothing is left out.
 */
function isSingleResolverCall(command,origin) {
  if(command===undefined||!origin?.resolver)return false;
  const inner=innerCommand(command);
  if(/[;&|`$<>()\r\n]/.test(inner))return false;
  const args=words(inner.trim());
  if(args.length<2||!["node","node.exe"].includes(path.basename(args[0].replaceAll("\\","/")).toLowerCase()))return false;
  return resolvedIn(origin.cwd??origin.repo??process.cwd(),args[1])===comparable(path.resolve(origin.resolver));
}

const MOUNT=".agents/conventions";

/** Each word of a shell command, a quoted run kept whole with its quotes removed: the candidates for a path. */
const commandWords=command=>[...innerCommand(command).matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(match=>match[1]??match[2]??match[3]);

/** A shell command whose words a reader cannot resolve to fixed files: a variable, a glob or a substitution. */
const DYNAMIC=/[$%*?[`]/;

/** The checkout file a word names, or undefined for a word no path can be made of. */
function resolvedIn(repo,word) {
  if(typeof word!=="string"||word.includes("\0"))return undefined;
  return comparable(path.resolve(repo,word));
}

/** Every checkout path the call names: its path, or each word of its command. Resolved once per call, as a set. */
const targetsOf=(call,repo)=>new Set((call.path!==undefined?[call.path]:commandWords(call.command)).map(word=>resolvedIn(repo,word)).filter(Boolean));

const escaped=text=>text.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

/**
 * True when a dynamic command could reach a selected rule: with `/` for every separator, it mentions the mount, a
 * rule's file name, or a rule folder's last segment next to a slash. Fails closed for the source repository too,
 * which has no mount (the second code round on this change).
 */
function mentionsRules(command,sources) {
  const flat=innerCommand(command).replaceAll("\\","/");
  if(flat.includes(MOUNT))return true;
  const edge="(?:^|$|[^\\w.-])";
  return sources.some(({source})=>{
    const name=escaped(path.posix.basename(source));
    const folder=path.posix.dirname(source);
    const segment=folder!=="."&&escaped(path.posix.basename(folder));
    return new RegExp(`(?:^|[^\\w.-])${name}(?:$|[^\\w.-])`).test(flat)
      ||(!!segment&&new RegExp(`${edge}${segment}/|/${segment}${edge}`).test(flat));
  });
}

/**
 * § 7 part 2 for "Claude / Codex from root": ENTRY and PROJECT read, and no rule body loaded by a second path — a
 * Read or Grep of a selected rule's source file, or a shell command naming it (CodeRabbit on #152, 2026-11-10).
 * Part 1 (allSourcesRead) proves the resolver delivered every body; this proves that delivery was the only one.
 * Paths count only when they resolve to THIS checkout's files, and a read counts only when it did not fail. A body
 * reached by a second path counts even from a failed call: a chained command can print it and still exit non-zero.
 * A call that reaches a selected rule's folder, or a dynamic shell command that could reach a selected rule (see
 * mentionsRules), without naming one rule file cannot be classified: it is listed in `unclassified` with its index,
 * tool and target, and the observable is not verified (the two code rounds on this change).
 */
function observableEvidence(calls,expected,origin) {
  const repo=origin?.repo??process.cwd();
  const at=(...parts)=>resolvedIn(repo,path.join(...parts));
  const targeted=calls.map(call=>({call,targets:targetsOf(call,repo),shown:contentLines(call.output??"",true)}));
  // A read of ENTRY or PROJECT names the file, did not fail, AND printed its text (CodeRabbit on #156: `test -e` named it).
  const readOk=files=>{
    const present=files.filter(Boolean).map(file=>({file,lines:fileLinesOf(file)}));
    return targeted.some(({call,targets,shown})=>!call.error&&present.some(({file,lines})=>targets.has(file)&&showsFile(shown,lines)));
  };
  const entryRead=readOk([at(MOUNT,"ENTRY.md"),at("ENTRY.md")]);
  const projectRead=readOk([at(".agents","PROJECT.md")]);
  const sources=expected.map(rule=>({id:rule.id,source:String(rule.source??"").replaceAll("\\","/")})).filter(rule=>rule.source);
  const secondPathReads=[];
  for(const rule of sources) {
    const file=at(rule.source);
    const hit=targeted.find(({targets})=>targets.has(file));
    if(hit)secondPathReads.push({id:rule.id,via:hit.call.via});
  }
  const ruleFiles=sources.map(rule=>at(rule.source));
  const ruleFolders=sources.map(rule=>path.posix.dirname(rule.source)).filter(folder=>folder!==".").map(folder=>at(folder));
  const unclassified=targeted.filter(({call,targets})=>!ruleFiles.some(file=>targets.has(file))
    &&(ruleFolders.some(folder=>targets.has(folder))||(call.command!==undefined&&DYNAMIC.test(innerCommand(call.command))&&mentionsRules(call.command,sources))))
    .map(({call})=>({index:call.index,via:call.via,target:call.command??call.path}));
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
    observable:observableEvidence(toolCalls(agent,events,origin),expected,origin)};
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
