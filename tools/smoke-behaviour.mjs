#!/usr/bin/env node
// npm run smoke:behaviour — negative -> classification -> behaviour, stops at the first non-pass.
try {
  const {behaviourSmoke,parseArgs}=await import("./lib/rule-smoke.mjs");
  const {runBehaviourSequence,BEHAVIOUR_ORDER}=await import("./lib/rule-behaviour.mjs");
  let cli;
  try {({cli}=parseArgs(process.argv.slice(2)));}
  catch(error) {console.error(`smoke-behaviour: bad arguments: ${error.message}`);process.exit(1);}
  const {results,passed}=await runBehaviourSequence(BEHAVIOUR_ORDER,async name=>{
    const outcome=await behaviourSmoke({repo:process.cwd(),fixture:name,cli});
    const why=outcome.reasons.join("; ");
    console.error(outcome.outcome==="pass"?`smoke-behaviour: ${name} pass`:`smoke-behaviour: ${name} ${outcome.outcome} — ${why||"no reasons recorded"}`);
    return outcome;
  });
  console.log(JSON.stringify({results,passed},null,2));
  process.exitCode=passed?0:1;
} catch(error) {console.error(`smoke-behaviour: INCOMPLETE — ${error.message}`);process.exitCode=1;}
