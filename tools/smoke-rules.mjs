#!/usr/bin/env node
try {
  const {smoke,behaviourSmoke}=await import("./lib/rule-smoke.mjs");
  const options={repo:process.cwd(),files:[]};
  const argv=process.argv.slice(2);
  for(let i=0;i<argv.length;i+=2) {
    const key=argv[i],value=argv[i+1];
    if(!value||value.startsWith("--"))throw new Error(`Missing value: ${key}`);
    if(key==="--file")options.files.push(value);
    else if(["--repo","--agent","--cwd","--cli"].includes(key))options[key.slice(2)]=value;
    else if(key==="--behaviour")options.fixture=value;
    else throw new Error(`Unknown option: ${key}`);
  }
  if(options.fixture) {
    // pass 0 · fail 1 · inconclusive 1 (named in the printed finding; the outcome stays distinct in the report)
    const result=await behaviourSmoke(options);
    console.log(JSON.stringify(result,null,2));
    if(result.outcome!=="pass")console.error(`smoke-behaviour: ${options.fixture} ${result.outcome} — ${result.reasons.join("; ")||"no reasons recorded"}`);
    process.exitCode=result.outcome==="pass"?0:1;
  } else {
    const result=await smoke(options);
    console.log(JSON.stringify(result,null,2));
    if(result.status==="incomplete")process.exitCode=1;
  }
} catch(error) {console.error(`smoke-rules: INCOMPLETE — ${error.message}`);process.exitCode=1;}
