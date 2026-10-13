import fs from "node:fs";
import path from "node:path";

/** The marker a denied Agent call carries (`common/subagent-models.md`, the guard's reason prefix). */
export const DENY_MARKER="subagent-models.md:";

const OUTCOMES=["pass","fail","inconclusive"];
const asArray=value=>Array.isArray(value)?value:[];

function inconclusiveReasons(evidence,expectation) {
  const reasons=[],{result,launches}=evidence;
  if(!result.present)return ["the trace has no result event"];
  if(/^error_max/.test(result.subtype)||/max_|budget|turns/i.test(result.terminalReason))
    reasons.push(`the run ran out of budget or turns (${result.subtype||result.terminalReason})`);
  for(const launch of launches) {
    if(!launch.terminal)reasons.push(`launch ${launch.id} has no terminal tool_result`);
    else if(launch.denials===0&&launch.taskStatus!=="completed")reasons.push(`launch ${launch.id} has no completed task_notification`);
  }
  const seen=new Set();
  for(const launch of launches) {
    if(seen.has(launch.promptHash))reasons.push(`launch ${launch.id} repeats an earlier prompt (a retry)`);
    seen.add(launch.promptHash);
  }
  if(evidence.nestedLaunches.length&&expectation.allowNested!==true)reasons.push(`${evidence.nestedLaunches.length} nested launch(es) the expectation did not ask for`);
  return reasons;
}

/** Launches matching a group; `focusTokens` demands exactly one token per prompt. */
function matches(group,launch) {
  if(launch.model!==(group.model??null))return false;
  const text=launch.prompt;
  if(!asArray(group.headings).every(heading=>text.includes(heading)))return false;
  if(!asArray(group.promptIncludes).every(part=>text.includes(part)))return false;
  return !group.focusTokens||group.focusTokens.filter(token=>text.includes(token)).length===1;
}

function takeGroup(group,pool) {
  const taken=pool.filter(launch=>matches(group,launch)).slice(0,group.count);
  return {taken,rest:pool.filter(launch=>!taken.includes(launch))};
}

function groupFailures(groups,launches) {
  const reasons=[];
  let pool=launches;
  for(const group of groups) {
    const {taken,rest}=takeGroup(group,pool);
    pool=rest;
    if(taken.length!==group.count)reasons.push(`group "${group.name}": ${taken.length} launch(es) matched, ${group.count} expected`);
    reasons.push(...focusFailures(group,taken));
  }
  if(pool.length)reasons.push(`${pool.length} launch(es) matched no expected group`);
  return reasons;
}

function focusFailures(group,taken) {
  if(!group.focusTokens)return [];
  const covered=new Set(taken.flatMap(launch=>group.focusTokens.filter(token=>launch.prompt.includes(token))));
  const missing=group.focusTokens.filter(token=>!covered.has(token));
  return missing.length?[`group "${group.name}": focus not covered: ${missing.join(", ")}`]:[];
}

function aggregateFailures(evidence,expectation) {
  const reasons=[],{result}=evidence;
  const requested=new Set(evidence.launches.map(launch=>launch.model).filter(Boolean));
  for(const family of requested) {
    if(!(result.families[family]>0))reasons.push(`family "${family}" was requested but has no usage in result.modelUsage`);
  }
  const children=expectation.children??0,stats=result.subagentStats??{};
  if((stats.spawned??0)!==children)reasons.push(`subagent_stats.spawned is ${stats.spawned??"absent"}, ${children} expected`);
  if((stats.completed??0)!==children)reasons.push(`subagent_stats.completed is ${stats.completed??"absent"}, ${children} expected`);
  if(children>0&&(stats.requested?.foreground??0)!==children)reasons.push(`subagent_stats.requested.foreground is ${stats.requested?.foreground??"absent"}, ${children} expected`);
  if((stats.requested?.background??0)!==0)reasons.push("a background launch was requested");
  const started=evidence.launches.filter(launch=>launch.started).length;
  if(started!==children)reasons.push(`${started} task_started event(s), ${children} expected`);
  return reasons;
}

function editFailures(evidence,expectation) {
  const forbidden=asArray(expectation.forbiddenParentEdits).map(name=>name.replaceAll("\\","/"));
  return evidence.parentEdits.map(file=>file.replaceAll("\\","/"))
    .filter(file=>forbidden.some(name=>file===name||file.endsWith(`/${name}`)))
    .map(file=>`the parent edited ${file}`);
}

/** The first JSON array in a text, or an empty list. */
export function firstJsonArray(text) {
  const start=text.indexOf("[");
  const end=text.lastIndexOf("]");
  if(start<0||end<start)return [];
  try {const value=JSON.parse(text.slice(start,end+1));return Array.isArray(value)?value:[];}
  catch {return [];}
}

function answerFailures(evidence,expectation) {
  if(!expectation.answers)return [];
  const given=firstJsonArray(evidence.result.text).map(item=>String(item).trim().toLowerCase());
  if(given.length!==expectation.answers.length)return [`${given.length} answer(s), ${expectation.answers.length} expected`];
  return expectation.answers.flatMap((accepted,index)=>
    [accepted].flat().includes(given[index])?[]:[`answer ${index+1} is "${given[index]}", expected ${[accepted].flat().join(" or ")}`]);
}

function denialFailures(evidence,expectation) {
  const denials=evidence.launches.reduce((sum,launch)=>sum+launch.denials,0);
  return denials===(expectation.denials??0)?[]:[`${denials} marker denial(s), ${expectation.denials??0} expected`];
}

function launchFailures(evidence,expectation) {
  const groups=asArray(expectation.groups),total=groups.reduce((sum,group)=>sum+group.count,0);
  if(total>0&&evidence.launches.length===0)return ["no launches although the expectation asks for some"];
  return groupFailures(groups,evidence.launches);
}

/**
 * The verdict of a behaviour run: `inconclusive` when the evidence cannot decide, else `fail` on any unmet
 * expectation, else `pass`. The expectation is data (see tools/fixtures/behaviour/*.json).
 */
export function behaviourVerdict(evidence,expectation) {
  const unsure=inconclusiveReasons(evidence,expectation);
  if(unsure.length)return {outcome:"inconclusive",reasons:unsure};
  const reasons=[...launchFailures(evidence,expectation),...editFailures(evidence,expectation),...denialFailures(evidence,expectation),
    ...aggregateFailures(evidence,expectation),...answerFailures(evidence,expectation)];
  return {outcome:reasons.length?"fail":"pass",reasons};
}

/** Validates a fixture's shape; throws a message naming the first defect, returns the fixture. */
export function validateFixture(fixture,label="fixture") {
  const bad=message=>{throw new Error(`${label}: ${message}`);};
  if(!fixture||typeof fixture!=="object")bad("not an object");
  for(const key of ["name","prompt"])if(typeof fixture[key]!=="string"||!fixture[key])bad(`"${key}" must be a non-empty string`);
  if(typeof fixture.loadRules!=="boolean")bad('"loadRules" must be true or false');
  if(typeof fixture.tools!=="string")bad('"tools" must be a string (comma-separated, "" for none)');
  if(fixture.loadOnly!==undefined) {
    if(!fixture.loadRules)bad('"loadOnly" needs "loadRules": true');
    if(!Array.isArray(fixture.loadOnly)||fixture.loadOnly.length<1||fixture.loadOnly.some(id=>typeof id!=="string"||!id))bad('"loadOnly" must be a non-empty array of non-empty rule ids');
  }
  const {caps}=fixture;
  for(const key of ["maxBudgetUsd","timeoutMs","maxOutputBytes","maxReportBytes"])
    if(!(Number(caps?.[key])>0))bad(`caps.${key} must be a positive number`);
  if(!Array.isArray(fixture.files)||fixture.files.length<1||fixture.files.length>12)bad('"files" must list 1-12 scope paths');
  const {expectation}=fixture;
  if(!expectation||typeof expectation!=="object")bad('"expectation" must be an object');
  for(const group of asArray(expectation.groups))
    if(typeof group.name!=="string"||!(group.count>=1))bad("every expectation group needs a name and a count >= 1");
  if(!Number.isInteger(expectation.children??0))bad("expectation.children must be an integer");
  if(expectation.changedFiles!==undefined&&!Array.isArray(expectation.changedFiles))bad("expectation.changedFiles must be an array");
  return fixture;
}

/** A fixture by name (`negative`) or by path; the name resolves under tools/fixtures/behaviour. */
export function loadFixture(root,nameOrPath) {
  const file=/[\\/]|\.json$/.test(nameOrPath)?path.resolve(nameOrPath):path.join(root,"tools/fixtures/behaviour",`${nameOrPath}.json`);
  return validateFixture(JSON.parse(fs.readFileSync(file,"utf8")),path.basename(file));
}

export const BEHAVIOUR_ORDER=["negative","classification","behaviour"];

/** Runs fixtures in order through `runOne(name)` -> {outcome}; stops at the first non-pass. */
export async function runBehaviourSequence(names,runOne) {
  const results=[];
  for(const name of names) {
    const {outcome}=await runOne(name);
    if(!OUTCOMES.includes(outcome))throw new Error(`Unknown outcome "${outcome}" for ${name}`);
    results.push({name,outcome});
    if(outcome!=="pass")break;
  }
  return {results,passed:results.length===names.length&&results.every(item=>item.outcome==="pass")};
}
