#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { loadCatalog, normalizedText, selectRules, sha256, TASKS, targetPath, projectRequirements } from "./rule-catalog.mjs";
import { within } from "./paths.mjs";

const sharedRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..","..");
export function bootstrap(entry=".agents/conventions/ENTRY.md") {
  return `# Project instructions\n\nBefore working in this repository, read and apply \`${entry}\` and\n\`.agents/PROJECT.md\`. Follow the shared entry's rule-selection procedure for\nthe task and the files you will inspect or change.\nResolve these paths from this repository's root (git rev-parse --show-toplevel),\nincluding when started in a subdirectory or working on another repository.\nIf any required source or resolver is unavailable, report instruction loading as\nincomplete and do not change affected files until it is restored.\n`;
}

function git(repo,...args) {
  return execFileSync("git",["-C",repo,...args],{encoding:"utf8",timeout:10000,maxBuffer:1024*1024,windowsHide:true}).trim();
}

function parseArgs(argv) {
  const [command,...rest]=argv;
  if (!["check","explain","read"].includes(command)) throw new Error("Usage: rules.mjs check|explain|read --repo PATH [--task NAME ...] [--file ROOT_RELATIVE_PATH ...] [--only RULE_ID]");
  const options={command,repo:process.cwd(),tasks:[],files:[],only:[]};
  for(let i=0;i<rest.length;i+=2) {
    const key=rest[i], value=rest[i+1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    if(key === "--repo") options.repo=value;
    else if(key === "--task") options.tasks.push(value);
    else if(key === "--file") options.files.push(targetPath(value));
    else if(key === "--only") options.only.push(value);
    else throw new Error(`Unknown option ${key}`);
  }
  if(options.command === "check" && options.only.length) throw new Error("--only applies to read/explain");
  return options;
}

function source(repo,name) {
  const file=within(repo,name,"instruction source");
  if(!fs.existsSync(file)) throw new Error(`Missing instruction source: ${file}`);
  within(fs.realpathSync(repo),fs.realpathSync(file),"real instruction source");
  const text=normalizedText(file);
  return {path:name,hash:sha256(text),bytes:Buffer.byteLength(text),text};
}

function instructionDirectories(repo,files) {
  const directories=new Set([repo]);
  for(const file of files) {
    let dir=path.dirname(within(repo,file));
    while(dir !== repo) {
      if(dir===path.dirname(dir)) throw new Error(`Target ancestry left repository: ${file}`);
      directories.add(dir);
      dir=path.dirname(dir);
    }
  }
  return directories;
}

function rejectOverrides(repo,files) {
  for(const dir of instructionDirectories(repo,files)) {
    for(const name of ["AGENTS.override.md","AGENTS.md","CLAUDE.md","GEMINI.md"]) {
      if(dir===repo && ["AGENTS.md","CLAUDE.md"].includes(name)) continue;
      if(fs.existsSync(path.join(dir,name))) throw new Error(`Unresolved additional instruction source: ${path.join(dir,name)}; equivalence incomplete`);
    }
  }
}

function validateInstructions(repo,files,selfHosted) {
  const agents=source(repo,"AGENTS.md");
  const claude=source(repo,"CLAUDE.md");
  if(agents.text !== bootstrap(selfHosted?"ENTRY.md":undefined)) throw new Error("AGENTS.md differs from the shared bootstrap; review the local instruction chain before changes");
  if(claude.text.trim() !== "@AGENTS.md") throw new Error("CLAUDE.md must contain only @AGENTS.md");
  if(agents.bytes>4096) throw new Error("AGENTS.md exceeds 4 KiB");
  rejectOverrides(repo,files);
  if(fs.existsSync(path.join(repo,".claude/rules")) && fs.readdirSync(path.join(repo,".claude/rules")).length) {
    throw new Error("Legacy .claude/rules is nonempty; move policy to .agents/rules before claiming one source");
  }
  const project=source(repo,".agents/PROJECT.md");
  const required=projectRequirements(project.text).map(name=>source(repo,name));
  return [agents,claude,source(repo,selfHosted?"ENTRY.md":".agents/conventions/ENTRY.md"),project,...required];
}

function revision(repo,selfHosted,installedRoot) {
  const actual=git(installedRoot,"rev-parse","HEAD");
  if(selfHosted) return {mode:"self-host working tree",actual,dirty:!!git(repo,"status","--porcelain","--untracked-files=normal")};
  const mounted=path.join(repo,".agents/conventions");
  if(fs.realpathSync(mounted) !== fs.realpathSync(installedRoot)) throw new Error("Run this repository's own mounted resolver");
  const pinned=git(repo,"ls-files","--stage","--",".agents/conventions").match(/^160000 ([a-f0-9]{40,64}) 0\t/);
  if(!pinned || pinned[1] !== actual) throw new Error(`Conventions checkout ${actual} differs from the index gitlink ${pinned?.[1] ?? "missing"}`);
  if(git(mounted,"status","--porcelain","--untracked-files=normal")) throw new Error("Mounted conventions has uncommitted changes; instruction version incomplete");
  const headPin=git(repo,"ls-tree","HEAD","--",".agents/conventions").match(/^160000 commit ([a-f0-9]{40,64})\t/);
  return {mode:"pinned submodule",actual,indexPin:pinned[1],headPin:headPin?.[1]??null,staged:headPin?.[1]!==pinned[1]};
}

// The installed root is injected by in-process integration tests; the CLI never accepts it.
export function run(argv,installedRoot=sharedRoot) {
  const options=parseArgs(argv);
  const repo=path.resolve(git(path.resolve(options.repo),"rev-parse","--show-toplevel"));
  const selfHosted=fs.realpathSync(repo) === fs.realpathSync(installedRoot);
  const instructions=validateInstructions(repo,options.files,selfHosted);
  const version=revision(repo,selfHosted,installedRoot);
  const catalog=loadCatalog(installedRoot,path.join(repo,".agents/rules"));
  const selected=options.command === "check" ? catalog : selectRules(catalog,options.tasks,options.files);
  for(const id of options.only) if(!selected.some(rule=>rule.id===id)) throw new Error(`--only ${id} is not selected for this scope`);
  const emitted=options.only.length?selected.filter(rule=>options.only.includes(rule.id)):selected;
  const rules=selected.map(({id,file,hash,bytes,load,paths,tasks,depends,reasons})=>({id,source:path.relative(repo,file).replaceAll("\\","/"),hash,bytes,load,paths,tasks,depends,reasons}));
  const manifest={status:"resolved",advisory:true,repo,version,tasks:options.tasks,files:options.files,
    instructions:instructions.map(({text,...item})=>item),rules,
    bytes:selected.reduce((sum,rule)=>sum+rule.bytes,0),
    remaining: selected.filter(rule=>!emitted.includes(rule)).map(rule=>rule.id),
    taskVocabulary:TASKS};
  const json=JSON.stringify(manifest,null,2);
  if(Buffer.byteLength(json)>256*1024) throw new Error("Manifest exceeds 256 KiB");
  if(options.command !== "read") return json;
  if(emitted.reduce((n,r)=>n+r.bytes,0)>32768) throw new Error("Selected payload exceeds 32 KiB per read. Run explain, then read each selected --only ID with the same scope; no text was emitted");
  const readHeader=JSON.stringify({status:"sources emitted",repo,version,tasks:options.tasks,files:options.files,
    emitted:emitted.map(({id,hash,bytes})=>({id,hash,bytes})),remaining:manifest.remaining},null,2);
  return [readHeader,...emitted.map(rule=>`\nBEGIN RULE ${rule.id} sha256:${rule.hash}\n${rule.text}\nEND RULE ${rule.id}`)].join("\n");
}
