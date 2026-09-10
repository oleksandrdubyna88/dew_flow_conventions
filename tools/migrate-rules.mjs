#!/usr/bin/env node
try {
  const {migrationPlan,applyMigration}=await import("./lib/rule-migration.mjs");
  const options={apply:false,rewrite:[]};
  const argv=process.argv.slice(2);
  for(let i=0;i<argv.length;i++) {
    if(argv[i]==="--apply") {options.apply=true;continue;}
    const key=argv[i].slice(2);
    if(!["repo","conventions","sha","base","output","branch","rewrite"].includes(key)||!argv[i+1]||argv[i+1].startsWith("--"))throw new Error(`Unknown or incomplete argument: ${argv[i]}`);
    const value=argv[++i];
    if(key==="rewrite")options.rewrite.push(value);else options[key]=value;
  }
  for(const key of ["repo","conventions","sha","output","branch"])if(!options[key])throw new Error(`Missing --${key}; default is dry-run, --apply prepares a disposable worktree`);
  const plan=migrationPlan(options);
  console.log(JSON.stringify(options.apply?applyMigration(plan):plan.journal,null,2));
} catch(error) {console.error(`migrate-rules: INCOMPLETE — ${error.message}`);process.exitCode=1;}
