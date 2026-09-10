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

export function resolverRead(command,{resolver,cwd},wrapped=false) {
  if(typeof command!=="string"||/[;&|<>`$\r\n]/.test(command))return false;
  const args=words(command.trim());
  if(args.length<3)return false;
  const executable=path.basename(args[0].replaceAll("\\","/")).toLowerCase();
  if(!wrapped&&["bash","sh"].includes(executable)&&args.length===3&&["-c","-lc"].includes(args[1])) {
    return resolverRead(args[2],{resolver,cwd},true);
  }
  if(!wrapped&&["powershell","powershell.exe","pwsh","pwsh.exe"].includes(executable)) {
    const position=args.findIndex(arg=>arg.toLowerCase()==="-command");
    const flags=args.slice(1,position).every(arg=>["-nologo","-noprofile","-noninteractive"].includes(arg.toLowerCase()));
    return position>0&&position===args.length-2&&flags&&resolverRead(args.at(-1),{resolver,cwd},true);
  }
  if(!["node","node.exe"].includes(executable)||args[2]!=="read")return false;
  const comparable=value=>process.platform==="win32"?value.toLowerCase():value;
  if(!["node","node.exe"].includes(args[0])&&comparable(path.resolve(args[0]))!==comparable(process.execPath))return false;
  return comparable(path.resolve(cwd,args[1]))===comparable(path.resolve(resolver));
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

export function traceEvidence(agent,trace,expected,origin) {
  const events=trace.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));
  const {outputs,sourceCalls,capture}=sourceCollector(origin);
  const {completed,final,models}=agent==="codex"?codexEvents(events,capture):claudeEvents(events,capture);
  const reads=expected.map(rule=>{
    const evidence=outputs.find(output=>output.text.includes(`BEGIN RULE ${rule.id} sha256:${rule.hash}\n${rule.text}\nEND RULE ${rule.id}`));
    return {id:rule.id,hash:rule.hash,complete:!!evidence,...(evidence?{sourceCommandHash:evidence.commandHash}:{})};
  });
  return {completed,reads,sourceCalls,models,final:final.slice(0,12000),finalTruncated:final.length>12000,
    allSourcesRead:reads.length>0&&reads.every(rule=>rule.complete)};
}
