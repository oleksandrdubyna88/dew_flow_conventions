import {test} from "node:test";
import assert from "node:assert/strict";
import {GUARD_MS,STARTUP_BUDGETS_MS,isConclusive,startupBudget} from "./lib/startup-ceilings.mjs";
import {GIT_TIMEOUT_MS,gitOutput} from "./lib/git.mjs";

const lastNumber=result=>{const n=Number(result.out.trim().split(/\s+/).at(-1));return Number.isFinite(n)&&n>0?n:undefined;};
const hold="setInterval(()=>{},1000)";

test("a ceiling is widened only while the readiness line is absent",async t=>{
  // The child says it is ready 700 ms in: the 300 ms ceiling ends before that, the wider one does not.
  const budget=startupBudget({budgets:[300,60000],totalMs:120000});
  const script="setTimeout(()=>{console.log(Date.now())},700)";
  const attempt=await budget.run(t,process.execPath,["-e",script],{},{readyAt:lastNumber});
  assert.equal(attempt.budgetMs,60000);
  assert.equal(attempt.result.timedOut,false);
  assert.equal(budget.spentMs(),60300);
});

test("a run that ended on its own with the line printed is never retried, whatever options say",async t=>{
  const budget=startupBudget({budgets:[60000,120000],totalMs:180000});
  const attempt=await budget.run(t,process.execPath,["-e","console.log(Date.now())"],{timeoutMs:1},{readyAt:lastNumber});
  assert.equal(attempt.budgetMs,60000,"timeoutMs in options must not override the ceiling under test");
  assert.equal(budget.spentMs(),60000);
});

test("an attempt is conclusive only with the line printed and, at the ceiling, enough runway after it",()=>{
  const at={startedAt:1000,budgetMs:5000,runwayMs:2000};
  assert.equal(isConclusive({...at,ready:undefined,timedOut:false}),false,"no line: start-up never completed");
  assert.equal(isConclusive({...at,ready:undefined,timedOut:true}),false);
  assert.equal(isConclusive({...at,ready:5900,timedOut:false}),true,"it ended on its own after printing");
  assert.equal(isConclusive({...at,ready:3999,timedOut:true}),true,"deadline 2001 ms after readiness");
  assert.equal(isConclusive({...at,ready:4000,timedOut:true}),true,"exactly the runway");
  assert.equal(isConclusive({...at,ready:4001,timedOut:true}),false,"1999 ms of runway is too little");
  assert.equal(isConclusive({...at,ready:5999,timedOut:true,runwayMs:0}),true,"no runway asked, a line before the deadline is enough");
});

test("when the readiness line never appears the failure says so and the total is capped",async t=>{
  const budget=startupBudget({budgets:[200,300,10000],totalMs:600});
  await assert.rejects(budget.run(t,process.execPath,["-e",hold],{},{readyAt:lastNumber}),
    /start-up never completed within 600 ms — the readiness line never appeared/);
  assert.equal(budget.spentMs(),600,"the last ceiling is cut to what remains of the total, and nothing more is spent");
});

test("the hang guard and the widening ceilings are wide enough to mean something",()=>{
  assert.ok(GUARD_MS>=120000);
  assert.deepEqual(STARTUP_BUDGETS_MS,[...STARTUP_BUDGETS_MS].sort((a,b)=>a-b));
});

test("gitOutput keeps its 30 s default when no timeout is passed",()=>{
  assert.equal(GIT_TIMEOUT_MS,30000);
  const source=gitOutput.toString();
  // The omitted case must resolve to the constant, and the call must hand the resolved value to execFileSync.
  assert.match(source,/timeoutMs\s*=\s*GIT_TIMEOUT_MS/);
  assert.match(source,/timeout\s*:\s*timeoutMs/);
  assert.match(gitOutput(".",["--version"]),/^git version/);
  assert.match(gitOutput(".",["--version"],{timeoutMs:GUARD_MS}),/^git version/);
});
