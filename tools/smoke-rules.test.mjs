import {test} from "node:test";
import assert from "node:assert/strict";
import {traceEvidence} from "./lib/rule-smoke.mjs";
import {sha256} from "./lib/rule-catalog.mjs";

const text="The complete canonical source.\n";
const rule={id:"common.sample",text,hash:sha256(text)};
const payload=`BEGIN RULE ${rule.id} sha256:${rule.hash}\n${text}\nEND RULE ${rule.id}`;
test("source evidence requires successful tool output, not the assistant's claim",()=>{
  const claimed=JSON.stringify({type:"item.completed",item:{type:"agent_message",text:payload}});
  assert.equal(traceEvidence("codex",claimed,[rule]).allSourcesRead,false);
  const actual=JSON.stringify({type:"item.completed",item:{type:"command_execution",exit_code:0,aggregated_output:payload}});
  assert.equal(traceEvidence("codex",actual,[rule]).allSourcesRead,true);
  assert.equal(traceEvidence("codex",actual,[rule]).completed,false);
  assert.equal(traceEvidence("codex",actual.replace("canonical","truncated"),[rule]).allSourcesRead,false);
});
test("Claude errors and partial bodies cannot become successful source evidence",()=>{
  const event=is_error=>JSON.stringify({type:"user",message:{content:[{type:"tool_result",is_error,content:payload}]}});
  assert.equal(traceEvidence("claude",event(true),[rule]).allSourcesRead,false);
  assert.equal(traceEvidence("claude",event(false),[rule]).allSourcesRead,true);
  const completed=event(false)+"\n"+JSON.stringify({type:"result",subtype:"success",result:"A concrete constraint."});
  assert.equal(traceEvidence("claude",completed,[rule]).completed,true);
  assert.equal(traceEvidence("claude",completed,[]).allSourcesRead,false);
});
