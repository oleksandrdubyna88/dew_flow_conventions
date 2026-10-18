import {test} from "node:test";
import assert from "node:assert/strict";
import {setTimeout as delay} from "node:timers/promises";
import {GUARD_MS,STARTUP_BUDGETS_MS,isConclusive,startupBudget} from "./lib/startup-ceilings.mjs";
import {GIT_TIMEOUT_MS,git,gitOutput,gitWith} from "./lib/git.mjs";

// The helper is policy, not process handling, so these tests drive it with a stub runner and no real child.
// `ready` is the readiness timestamp a stub reports; a stub result is `{timedOut, ready}`.
const readyAt=result=>result.ready;
const stub=(script,calls=[])=>async(command,args,options)=>{
  calls.push({command,args,options});
  return await script(options.timeoutMs,calls.length);
};

test("a ceiling is widened only while the readiness line is absent",async()=>{
  const calls=[];
  const budget=startupBudget({budgets:[100,200,300],totalMs:10000});
  const run=stub(timeoutMs=>({timedOut:timeoutMs<300,ready:timeoutMs<300?undefined:Date.now()}),calls);
  const attempt=await budget.runWhenReady(undefined,"cmd",["a"],{readyAt,run});
  assert.deepEqual(calls.map(call=>call.options.timeoutMs),[100,200,300]);
  assert.equal(attempt.budgetMs,300);
});

test("a run that ended on its own with the line printed is never retried",async()=>{
  const calls=[];
  const budget=startupBudget({budgets:[100,200],totalMs:10000});
  const attempt=await budget.runWhenReady(undefined,"cmd",[],{readyAt,run:stub(()=>({timedOut:false,ready:Date.now()}),calls)});
  assert.equal(calls.length,1);
  assert.equal(attempt.budgetMs,100);
});

test("one options object: other options reach the runner, the ceiling is the helper's",async()=>{
  const calls=[];
  const budget=startupBudget({budgets:[100,200],totalMs:10000});
  await budget.runWhenReady(undefined,"cmd",["x"],{readyAt,containTree:true,maxOutputBytes:5,run:stub(()=>({timedOut:false,ready:1}),calls)});
  assert.deepEqual(calls[0],{command:"cmd",args:["x"],options:{containTree:true,maxOutputBytes:5,timeoutMs:100}});
});

test("timeoutMs is the first ceiling and the wider ones still follow it",async()=>{
  const calls=[];
  const budget=startupBudget({budgets:[100,200,300],totalMs:10000});
  await budget.runWhenReady(undefined,"cmd",[],{readyAt,timeoutMs:150,run:stub(timeoutMs=>({timedOut:timeoutMs<300,ready:timeoutMs<300?undefined:1}),calls)});
  assert.deepEqual(calls.map(call=>call.options.timeoutMs),[150,200,300]);
});

test("readyAt must be a function, and the run does not start without it",async()=>{
  const calls=[];
  const budget=startupBudget({budgets:[100],totalMs:1000});
  for(const bad of [undefined,null,"ready",42,{}]) {
    await assert.rejects(budget.runWhenReady(undefined,"cmd",[],{readyAt:bad,run:stub(()=>({}),calls)}),TypeError);
  }
  assert.equal(calls.length,0);
});

test("an attempt is conclusive only with a numeric line and, at the ceiling, enough runway after it",()=>{
  const at={startedAt:1000,budgetMs:5000,runwayMs:2000};
  for(const absent of [undefined,null,"5900",Number.NaN,Infinity,{},[]]) {
    assert.equal(isConclusive({...at,ready:absent,timedOut:false}),false,`ready=${String(absent)} is no readiness line`);
  }
  assert.equal(isConclusive({...at,ready:5900,timedOut:false}),true,"it ended on its own after printing");
  assert.equal(isConclusive({...at,ready:3999,timedOut:true}),true,"deadline 2001 ms after readiness");
  assert.equal(isConclusive({...at,ready:4000,timedOut:true}),true,"exactly the runway");
  assert.equal(isConclusive({...at,ready:4001,timedOut:true}),false,"1999 ms of runway is too little");
  assert.equal(isConclusive({...at,ready:5999,timedOut:true,runwayMs:0}),true,"no runway asked, a line before the deadline is enough");
});

test("when no attempt produced a readiness line the failure says so, with ceilings and wall time",async()=>{
  const budget=startupBudget({budgets:[20,30],totalMs:1000});
  await assert.rejects(budget.runWhenReady(undefined,"cmd",[],{readyAt,run:stub(async timeoutMs=>{await delay(timeoutMs);return {timedOut:true};})}),error=>{
    assert.match(error.message,/start-up never completed — the readiness line never appeared/);
    assert.match(error.message,/ceilings tried: 50 ms in total/);
    assert.match(error.message,/elapsed wall time: \d+ ms/);
    return true;
  });
});

test("when start-up did complete but never with runway the failure says that instead",async()=>{
  const budget=startupBudget({budgets:[20,30],totalMs:1000});
  const late=stub(async timeoutMs=>{await delay(timeoutMs);return {timedOut:true,ready:Date.now()};});
  await assert.rejects(budget.runWhenReady(undefined,"cmd",[],{readyAt,runwayMs:60000,run:late}),error=>{
    assert.match(error.message,/start-up completed but left less than 60000 ms before the ceiling in every attempt/);
    assert.doesNotMatch(error.message,/never appeared/);
    return true;
  });
});

test("an attempt is billed the lesser of its ceiling and its elapsed time",async()=>{
  const budget=startupBudget({budgets:[60000],totalMs:120000});
  await budget.runWhenReady(undefined,"cmd",[],{readyAt,run:stub(()=>({timedOut:false,ready:1}))});
  assert.ok(budget.spentMs()<1000,`an instant run was billed ${budget.spentMs()} ms of a 60000 ms ceiling`);
});

test("nothing is started once the total is spent, and spent never exceeds it",async()=>{
  const calls=[];
  const budget=startupBudget({budgets:[200,300,10000],totalMs:600});
  await assert.rejects(budget.runWhenReady(undefined,"cmd",[],{readyAt,run:stub(async timeoutMs=>{await delay(timeoutMs);return {timedOut:true};},calls)}),/never appeared/);
  assert.ok(budget.spentMs()<=600,`spent ${budget.spentMs()} of 600`);
  assert.ok(calls.at(-1).options.timeoutMs<=600-200,"the last ceiling is cut to what remained of the total");
  const before=calls.length;
  await assert.rejects(budget.runWhenReady(undefined,"cmd",[],{readyAt,run:stub(()=>({timedOut:true}),calls)}),/never appeared/);
  assert.ok(calls.length-before<=1,"a spent total starts at most the remainder, never a whole ceiling");
});

test("every ceiling handed to the runner is a positive safe integer, whatever the elapsed times were",async()=>{
  // proc.mjs run() refuses a fractional or sub-millisecond timeoutMs; elapsed times are fractional, so the
  // remainder of the total must be whole before it becomes a ceiling.
  const calls=[];
  const budget=startupBudget({budgets:[60,60,60,60],totalMs:100});
  await assert.rejects(budget.runWhenReady(undefined,"cmd",[],{readyAt,run:stub(async timeoutMs=>{await delay(Math.min(timeoutMs,30));return {timedOut:true};},calls)}),/never appeared/);
  assert.ok(calls.length>=2);
  for(const call of calls) assert.ok(Number.isSafeInteger(call.options.timeoutMs)&&call.options.timeoutMs>=1,`ceiling ${call.options.timeoutMs}`);
  assert.ok(Number.isInteger(budget.spentMs()),`spent ${budget.spentMs()}`);
});

test("a missing t, or one without diagnostic, is tolerated",async()=>{
  const budget=startupBudget({budgets:[10,20],totalMs:1000});
  const run=stub(timeoutMs=>({timedOut:timeoutMs<20,ready:timeoutMs<20?undefined:1}));
  assert.equal((await budget.runWhenReady(undefined,"cmd",[],{readyAt,run})).budgetMs,20);
  assert.equal((await startupBudget({budgets:[10,20],totalMs:1000}).runWhenReady({},"cmd",[],{readyAt,run})).budgetMs,20);
});

test("the default runner is proc.mjs's run: a real child that prints its clock and exits",async t=>{
  const budget=startupBudget({budgets:[60000],totalMs:120000});
  const attempt=await budget.runWhenReady(t,process.execPath,["-e","console.log(Date.now())"],{readyAt:result=>Number(result.out.trim())});
  assert.equal(attempt.result.timedOut,false);
  assert.ok(attempt.readyAt>0);
});

test("the hang guard and the widening ceilings are wide enough to mean something",()=>{
  assert.ok(GUARD_MS>=120000);
  assert.deepEqual(STARTUP_BUDGETS_MS,[...STARTUP_BUDGETS_MS].sort((a,b)=>a-b));
});

test("gitOutput and git keep their 30 s default when no timeout is passed",()=>{
  assert.equal(GIT_TIMEOUT_MS,30000);
  const source=gitOutput.toString();
  // The omitted case must resolve to the constant, and the call must hand the resolved value to execFileSync.
  assert.match(source,/timeoutMs\s*=\s*GIT_TIMEOUT_MS/);
  assert.match(source,/timeout\s*:\s*timeoutMs/);
  assert.match(git(".","--version"),/^git version/);
});

test("gitWith gives a git() of the same shape with its own hang guard, and no argument keeps the default",()=>{
  assert.match(gitWith({timeoutMs:GUARD_MS})(".","--version"),/^git version/);
  assert.match(gitWith()(".","--version"),/^git version/);
  assert.match(gitWith({})(".","--version"),/^git version/);
  // The guard is really the one passed: a git alias that sleeps is killed at it.
  const sleeper=gitWith({timeoutMs:300});
  assert.throws(()=>sleeper(".","-c","alias.hang=!sleep 30","hang"),error=>error.code==="ETIMEDOUT");
});
