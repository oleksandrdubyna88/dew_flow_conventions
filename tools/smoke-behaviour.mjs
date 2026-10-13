#!/usr/bin/env node
// npm run smoke:behaviour — negative -> classification -> behaviour, stops at the first non-pass.
try {
  const {behaviourSmoke}=await import("./lib/rule-smoke.mjs");
  const {runBehaviourSequence,BEHAVIOUR_ORDER}=await import("./lib/rule-behaviour.mjs");
  const cli=process.argv[2]==="--cli"?process.argv[3]:undefined;
  const {results,passed}=await runBehaviourSequence(BEHAVIOUR_ORDER,async name=>{
    const outcome=await behaviourSmoke({repo:process.cwd(),fixture:name,cli});
    console.error(`smoke-behaviour: ${name} -> ${outcome.outcome}${outcome.reasons.length?`: ${outcome.reasons.join("; ")}`:""}`);
    return outcome;
  });
  console.log(JSON.stringify({results,passed},null,2));
  process.exitCode=passed?0:(results.at(-1)?.outcome==="inconclusive"?2:1);
} catch(error) {console.error(`smoke-behaviour: INCOMPLETE — ${error.message}`);process.exitCode=1;}
