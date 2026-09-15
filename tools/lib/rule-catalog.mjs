import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { parseDocument } from "yaml";
import picomatch from "picomatch";

import { folded } from "./rule-body.mjs";

export const TASKS = Object.freeze({
  inspect: "Read or explain the product without changing it",
  audit: "Review correctness, security, or performance",
  plan: "Design a change or write a plan",
  implement: "Create, modify, refactor, or fix code",
  docs: "Edit documentation",
  policy: "Change instructions or their delivery",
  test: "Write or run tests",
  git: "Branch, stage, commit, rebase, or change submodules",
  pr: "Open or handle a pull request",
  release: "Package or publish a release",
  deploy: "Deploy or verify an installation",
  dependencies: "Add, update, or evaluate packages",
  http: "Change an HTTP interface",
  gpu: "Use GPU compute",
  benchmark: "Run or interpret measurements",
  logging: "Change hosts or logging",
  storage: "Change persistence, dates, or migrations",
  ui: "Change user interactions or status displays",
});
const DIRECTORIES = ["common", "csharp", "rust", "typescript"];
const KEYS = new Set(["id", "load", "paths", "tasks", "depends"]);
const LIMITS = Object.freeze({ metadata: 2048, file: 256 * 1024, files: 256, catalog: 4 * 1024 * 1024, core: 16 * 1024 });
export const sha256 = text => createHash("sha256").update(text).digest("hex");

export function projectRequirements(text) {
  const match=/^---\n([\s\S]*?)\n---\n/.exec(text);
  if(!match) return [];
  const document=parseDocument(match[1],{uniqueKeys:true});
  if(document.errors.length || document.warnings.length) throw new Error(`PROJECT metadata: ${[...document.errors,...document.warnings].join("; ")}`);
  const metadata=document.toJS({maxAliasCount:0});
  if(!metadata || Array.isArray(metadata) || typeof metadata!=="object" || Object.keys(metadata).some(key=>key!=="requires")) throw new Error("PROJECT metadata allows only requires");
  return stringList(metadata,"requires","PROJECT").map(targetPath);
}

export function normalizedText(file) {
  if (fs.lstatSync(file).isSymbolicLink()) throw new Error(`Symlink instruction source: ${file}`);
  if (fs.statSync(file).size > LIMITS.file) throw new Error(`Instruction exceeds ${LIMITS.file} bytes: ${file}`);
  return folded(fs.readFileSync(file, "utf8"));
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  if (fs.lstatSync(directory).isSymbolicLink()) throw new Error(`Symlink rule directory: ${directory}`);
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a,b)=>a.name < b.name ? -1 : 1).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink rule source: ${file}`);
    if (entry.isDirectory()) return walk(file);
    return entry.name.endsWith(".md") ? [file] : [];
  });
}

function stringList(metadata, key, file) {
  const value = metadata[key] ?? [];
  if (!Array.isArray(value) || value.some(item => typeof item !== "string" || !item.trim())) {
    throw new Error(`${file}: ${key} must be an array of nonempty strings`);
  }
  return value;
}

function patternMatcher(pattern) {
  if (pattern.startsWith("!") || pattern.includes("\\") || pattern.startsWith("/") || pattern.split("/").includes("..")) {
    throw new Error(`Invalid root-relative glob: ${pattern}`);
  }
  return picomatch(pattern, { dot: true, strictBrackets: true, nonegate: true });
}

function ruleFrom(file, base, namespace) {
  const text = normalizedText(file);
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${file}: missing or malformed rule metadata`);
  if (Buffer.byteLength(match[1]) > LIMITS.metadata) throw new Error(`${file}: metadata budget exceeded`);
  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length || document.warnings.length) throw new Error(`${file}: ${[...document.errors, ...document.warnings].join("; ")}`);
  const metadata = document.toJS({ maxAliasCount: 0 });
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") throw new Error(`${file}: metadata must be a mapping`);
  for (const key of Object.keys(metadata)) if (!KEYS.has(key)) throw new Error(`${file}: unknown metadata key ${key}`);
  if (typeof metadata.id !== "string" || !/^[a-z][a-z0-9.-]*$/.test(metadata.id)) throw new Error(`${file}: invalid rule id`);
  if (namespace && !metadata.id.startsWith(namespace)) throw new Error(`${file}: local id must start with ${namespace}`);
  if (!["always", "conditional"].includes(metadata.load)) throw new Error(`${file}: load must be always or conditional`);
  const paths = stringList(metadata,"paths",file);
  const tasks = stringList(metadata,"tasks",file);
  const depends = stringList(metadata,"depends",file);
  tasks.forEach(task => { if (!Object.hasOwn(TASKS,task)) throw new Error(`${file}: unknown task ${task}; legal: ${Object.keys(TASKS).join(", ")}`); });
  paths.forEach(patternMatcher);
  if (metadata.load === "conditional" && !paths.length && !tasks.length) throw new Error(`${file}: conditional rule needs paths or tasks`);
  if (!match[2].trim()) throw new Error(`${file}: empty rule body`);
  return { id: metadata.id, load: metadata.load, paths, tasks, depends,
    source: path.relative(base,file).replaceAll("\\","/"), file, text,
    hash: sha256(text), bytes: Buffer.byteLength(text) };
}

export function loadCatalog(root, localRoot) {
  const shared = DIRECTORIES.flatMap(dir => walk(path.join(root,dir))).map(file => ruleFrom(file,root));
  const local = localRoot ? walk(localRoot).map(file => ruleFrom(file,path.dirname(localRoot),"local.")) : [];
  const rules = [...shared,...local];
  if (rules.length > LIMITS.files || rules.reduce((n,r)=>n+r.bytes,0) > LIMITS.catalog) throw new Error("Rule catalog budget exceeded");
  const byId = new Map();
  for (const rule of rules) {
    if (byId.has(rule.id)) throw new Error(`Duplicate rule id ${rule.id}: ${byId.get(rule.id).file} and ${rule.file}`);
    byId.set(rule.id,rule);
  }
  const done=new Set();
  function visit(id,stack=[]) {
    if (stack.includes(id)) throw new Error(`Rule dependency cycle: ${[...stack,id].join(" -> ")}`);
    if (!byId.has(id)) throw new Error(`Missing rule dependency: ${id}`);
    if (done.has(id)) return;
    byId.get(id).depends.forEach(dep=>visit(dep,[...stack,id]));
    done.add(id);
  }
  rules.forEach(rule=>visit(rule.id));
  if (!rules.some(rule=>rule.load === "always")) throw new Error("Missing always-loaded core rules");
  const coreIds=new Set();
  function addCore(id) {
    if(coreIds.has(id)) return;
    coreIds.add(id);
    byId.get(id).depends.forEach(addCore);
  }
  rules.filter(rule=>rule.load === "always").forEach(rule=>addCore(rule.id));
  const core=rules.filter(rule=>coreIds.has(rule.id));
  if (core.reduce((n,r)=>n+r.bytes,0)>LIMITS.core) throw new Error("Always-loaded core exceeds 16 KiB budget");
  return rules;
}

export function targetPath(value) {
  const normalized=value.replaceAll("\\","/");
  if (!normalized || normalized.includes("\0") || normalized.length>4096 || normalized.endsWith("/") || normalized.endsWith("/.") || normalized === "." || normalized.startsWith("/") || /^[A-Za-z]:/.test(normalized) || normalized.split("/").includes("..")) {
    throw new Error(`Target must name a root-relative file inside the repository: ${value}`);
  }
  return path.posix.normalize(normalized);
}

export function selectRules(catalog,tasks,files) {
  if(tasks.length>64 || files.length>256) throw new Error("Scope exceeds limit: 64 tasks and 256 files per call");
  if (!tasks.length) throw new Error(`At least one --task is required; legal: ${Object.keys(TASKS).join(", ")}`);
  tasks.forEach(task=>{ if (!Object.hasOwn(TASKS,task)) throw new Error(`Unknown task ${task}; legal: ${Object.keys(TASKS).join(", ")}`); });
  const normalized=files.map(targetPath);
  const selected=new Map();
  const byId=new Map(catalog.map(rule=>[rule.id,rule]));
  function add(rule,reason) {
    if (selected.has(rule.id)) {
      const prior=selected.get(rule.id);
      selected.set(rule.id,{...prior,reasons:[...new Set([...prior.reasons,reason])]});
      return;
    }
    rule.depends.forEach(id=>add(byId.get(id),`dependency:${rule.id}`));
    selected.set(rule.id,{...rule,reasons:[reason]});
  }
  for (const rule of [...catalog].sort((a,b)=>a.id < b.id ? -1 : 1)) {
    if (rule.load === "always") add(rule,"always");
    tasks.filter(task=>rule.tasks.includes(task)).forEach(task=>add(rule,`task:${task}`));
    for (const pattern of rule.paths) {
      const match=patternMatcher(pattern);
      normalized.filter(file=>match(file)).forEach(file=>add(rule,`path:${file} (${pattern})`));
    }
  }
  return [...selected.values()];
}
