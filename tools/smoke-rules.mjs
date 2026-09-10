#!/usr/bin/env node
try {
  const {smoke}=await import("./lib/rule-smoke.mjs");
  const options={repo:process.cwd(),files:[]};
  const argv=process.argv.slice(2);
  for(let i=0;i<argv.length;i+=2) {
    const key=argv[i],value=argv[i+1];
    if(!value||value.startsWith("--"))throw new Error(`Missing value: ${key}`);
    if(key==="--file")options.files.push(value);
    else if(["--repo","--agent","--cwd","--cli"].includes(key))options[key.slice(2)]=value;
    else throw new Error(`Unknown option: ${key}`);
  }
  const result=await smoke(options);
  console.log(JSON.stringify(result,null,2));
  if(result.status==="incomplete")process.exitCode=1;
} catch(error) {console.error(`smoke-rules: INCOMPLETE — ${error.message}`);process.exitCode=1;}
