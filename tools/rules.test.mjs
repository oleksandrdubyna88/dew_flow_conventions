import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { loadCatalog, selectRules, sha256, TASKS } from "./lib/rule-catalog.mjs";
import { provenanceFindings, caseFindings } from "./lib/gates.mjs";
import { LANDED_EPICS } from "./lib/parity-epics.mjs";
import {run} from "./lib/rule-cli.mjs";
import {bodyOf, sectionsOf} from "./lib/rule-body.mjs";
import { ownedDir } from "./lib/owned.mjs";
import { parseTokenTable } from "./leftovers-check.mjs";
import {GUARD_MS} from "./lib/startup-ceilings.mjs";
import {gitWith} from "./lib/git.mjs";

const gitGuarded=gitWith({timeoutMs:GUARD_MS});

function fixture(t) {
  const root = ownedDir(t, "rules ü пробел");
  const put = (name, metadata, body = "A complete rule.\n") => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `---\n${metadata}\n---\n${body}`);
  };
  put("common/core.md", "id: common.core\nload: always");
  return { root, put };
}

test("planned files select both languages before any diff exists", t => {
  const {root,put} = fixture(t);
  put("csharp/code.md", 'id: csharp.code\nload: conditional\npaths: ["**/*.cs"]');
  put("typescript/code.md", 'id: typescript.code\nload: conditional\npaths: ["**/*.ts"]');
  const selected = selectRules(loadCatalog(root), ["implement"], ["src/New.cs", "ui\\новый.ts"]);
  assert.deepEqual(selected.map(r => r.id), ["common.core", "csharp.code", "typescript.code"]);
});

test("tasks OR paths select a rule and dependencies ignore their own conditions", t => {
  const {root,put} = fixture(t);
  put("common/a.md", 'id: common.a\nload: conditional\ntasks: ["release"]\npaths: ["**/*.http"]\ndepends: ["common.b"]');
  put("common/b.md", 'id: common.b\nload: conditional\ntasks: ["gpu"]');
  const catalog = loadCatalog(root);
  for (const [tasks,files] of [[["release"],[]], [["audit"],["api/a.http"]]]) {
    const ids = selectRules(catalog,tasks,files).map(r=>r.id);
    assert.ok(ids.includes("common.a") && ids.includes("common.b"));
    assert.ok(ids.indexOf("common.b") < ids.indexOf("common.a"));
    assert.equal(new Set(ids).size, ids.length);
  }
});

test("a nonmatching second path does not select an unrelated language", t => {
  const {root,put}=fixture(t);
  put("rust/code.md", 'id: rust.code\nload: conditional\npaths: ["**/*.rs"]');
  assert.deepEqual(selectRules(loadCatalog(root),["inspect"],["src/a.cs","ui/b.ts"]).map(r=>r.id),["common.core"]);
});

test("invalid catalog fails even when its broken rule would not be selected", t => {
  const {root,put} = fixture(t);
  put("common/b.md", 'id: common.b\nload: conditional\ntasks: ["gpu"]\ndepends: ["missing.rule"]');
  assert.throws(()=>loadCatalog(root), /missing.rule/);
  put("common/b.md", 'id: common.b\nload: conditional\ntasks: ["gpu"]\ndepends: ["common.b"]');
  assert.throws(()=>loadCatalog(root), /cycle/i);
});

test("duplicates, unknown keys, empty bodies and malformed metadata fail closed", t => {
  const {root,put} = fixture(t);
  for (const [meta,body,expected] of [
    ["id: common.core\nload: always","body",/duplicate/i],
    ["id: common.b\nload: always\nlaod: always","body",/laod/],
    ["id: common.b\nload: always","",/empty/i],
    ["id: common.b\nload: always\nload: conditional","body",/unique|duplicate/i],
    ["id: common.b\nload: conditional\ntasks: [imlpement]","body",/imlpement/],
  ]) {
    put("common/b.md",meta,body);
    assert.throws(()=>loadCatalog(root),expected);
  }
});

test("docs and fixtures never become instructions but a rule directory cannot silently lose metadata", t => {
  const {root,put} = fixture(t);
  put("todo/plan.md", "id: malicious.rule\nload: always");
  assert.equal(loadCatalog(root).length,1);
  fs.writeFileSync(path.join(root,"common/core.md"),"# Missing declaration\n");
  assert.throws(()=>loadCatalog(root), /metadata/i);
});

test("unknown tasks and escaped target paths fail instead of selecting only core", t => {
  const catalog=loadCatalog(fixture(t).root);
  assert.throws(()=>selectRules(catalog,["imlpement"],[]),/imlpement/);
  assert.throws(()=>selectRules(catalog,["audit"],["../outside.cs"]),/relative|outside/i);
  assert.throws(()=>selectRules(catalog,[],[]),/task/i);
  for(const file of [".","./","src/..","src/./","src/../."]) {
    assert.throws(()=>selectRules(catalog,["inspect"],[file]),/relative|file|outside/i);
  }
  assert.throws(()=>selectRules(catalog,["inspect"],Array(257).fill("a.cs")),/scope.*limit/i);
});

test("inspect-only dependency bytes are not charged against the always-core budget",t=>{
  const {root,put}=fixture(t);
  put("common/a.md",'id: common.a\nload: conditional\ntasks: ["inspect"]\ndepends: ["common.b"]');
  put("common/b.md",'id: common.b\nload: conditional\ntasks: ["gpu"]',"Reference ".repeat(2000));
  assert.doesNotThrow(()=>loadCatalog(root));
  put("common/a.md",'id: common.a\nload: always\ndepends: ["common.b"]');
  assert.throws(()=>loadCatalog(root),/core.*budget/i);
});

test("hashes change on canonical edits without a persistent cache", t => {
  const {root,put}=fixture(t);
  const before=loadCatalog(root)[0].hash;
  put("common/core.md","id: common.core\nload: always","Changed policy.\n");
  assert.notEqual(loadCatalog(root)[0].hash,before);
});

test("symlink rule sources are refused instead of following external files", t => {
  const {root}=fixture(t);
  const target=path.join(root,"common","linked.md");
  try { fs.symlinkSync(path.join(root,"common/core.md"),target); }
  catch (error) { if(error.code === "EPERM") { t.skip("Windows symlink privilege unavailable; Linux runs this case"); return; } throw error; }
  assert.throws(()=>loadCatalog(root),/symlink/i);
});

const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");

// TWO records per rule, in two files, answering two different questions.
//
//   shared-rules-migration-map.json: originalBodySha256 / sections — what the body was at migration.
//     Immutable evidence that nothing was lost in the move, and never compared against the live file
//     again: comparing it forever is what made those 24 rules uneditable, so that every improvement
//     had to become a NEW file and the corpus grew instead of being corrected.
//   rule-bodies.json: bodySha256 / sections — what the body is NOW, for ALL 32 rules rather than the
//     24 that happened to be migrated. Moved in the SAME commit as any edit.
//
// So the freeze changed from "no edit ever" to "no ACCIDENTAL edit": a body that changes without its
// hash changing is a red suite, and a deliberate change is a two-line diff beside the prose. The
// original record is still asserted to be PRESENT and well formed, because the thing it protects is
// somebody quietly deleting the evidence rather than somebody editing a rule.
test("the migration evidence for the original 24 is intact",()=>{
  // Provenance, and nothing else. These hashes are what the bodies were at migration; they are never
  // compared against a live file, because comparing them for ever is what made those 24 rules
  // uneditable — every improvement had to become a NEW rule file, and 24 migrated rules are 32 today.
  // What this protects is somebody deleting the record, not somebody editing a rule.
  const inventory=JSON.parse(fs.readFileSync(path.join(sourceRoot,"research/shared-rules-migration-map.json"),"utf8"));
  const catalog=loadCatalog(sourceRoot);
  assert.equal(inventory.rules.length,24);
  for(const original of inventory.rules) {
    assert.ok(catalog.find(rule=>rule.id===original.id),`${original.id}: a migrated rule may not vanish`);
    assert.match(original.originalBodySha256,/^[0-9a-f]{64}$/,`${original.id}: migration evidence must survive`);
    assert.ok(Array.isArray(original.sections)&&original.sections.length>0,`${original.id}: original sections must survive`);
    assert.equal(original.currentBodySha256,undefined,`${original.id}: change control belongs in rule-bodies.json, not in the migration record`);
  }
});

test("EVERY rule's live body matches research/rule-bodies.json",()=>{
  // Change control, covering the whole catalog rather than the 24 that happened to be migrated.
  // Keyed on the migration map, eight post-migration rules — including this story's own
  // common/rule-ownership.md — were protected by nothing, so an unreviewed edit to them passed clean.
  // That is the drift this mechanism exists to notice, in the files most likely to carry it.
  const manifest=JSON.parse(fs.readFileSync(path.join(sourceRoot,"research/rule-bodies.json"),"utf8"));
  const catalog=loadCatalog(sourceRoot);
  const recorded=new Map(manifest.rules.map(entry=>[entry.id,entry]));

  assert.equal(recorded.size,catalog.length,
    "a rule was added or removed without research/rule-bodies.json — add its entry in the same commit");

  for(const rule of catalog) {
    const entry=recorded.get(rule.id);
    assert.ok(entry,`${rule.id}: no entry in rule-bodies.json — a new rule records its body in the same commit`);
    // The same definition the resolver and tools/rule-bodies.mjs use, so this compares the FILE
    // against the record rather than two implementations of "what a body is" against each other.
    const body=bodyOf(rule.text);
    assert.equal(sha256(body),entry.bodySha256,
      `${rule.id}: the body changed without its bodySha256 — update research/rule-bodies.json in the same commit`);
    assert.deepEqual(sectionsOf(body),entry.sections,
      `${rule.id}: headings changed without their recorded sections`);
  }
});

test("central build props continue to select the NuGet policy",()=>{
  const rules=selectRules(loadCatalog(sourceRoot),["inspect"],["Directory.Build.props"]);
  assert.ok(rules.some(rule=>rule.id==="csharp.nuget-packages"));
});

// The build-flags policy is scoped to SOLUTION files and the response file itself, and carries no
// `tasks`. Both halves of that are budget decisions, measured rather than guessed:
//
//   * `tasks` would select it for every implement scope, TypeScript and Rust included — selection is
//     paths OR tasks.
//   * `**/*.cs` and `**/*.csproj` were in the first draft and pushed those scopes PAST the 32 KiB
//     read budget (a `.cs` scope is 27 800 B before this rule and a `.csproj` scope 31 173 B, so the
//     latter has 1 595 B of headroom for any new rule at all). The real-agent migration test caught
//     it: the spawned session got INCOMPLETE and read nothing.
//
// Nothing is lost by the narrowing, because neither half of this rule depends on the text being in
// context: `-m:N` is enforced by the PreToolUse guard whatever loaded, and the response file by
// build-flags-check in CI.
test("the build-flags policy selects on solutions and the response file, and nowhere else",()=>{
  const catalog=loadCatalog(sourceRoot);
  const selects=file=>selectRules(catalog,["implement"],[file]).some(rule=>rule.id==="csharp.dotnet-build");
  for(const file of ["src/App.slnx","App.sln","Directory.Build.rsp"])assert.ok(selects(file),file);
  for(const file of ["src/Thing.cs","src/Thing.csproj","src/thing.ts","src/main.rs"])assert.ok(!selects(file),file);
});

// The subagent-models rule is scoped by `tasks` alone. The split is measured, not chosen: the four tasks
// below are the ones whose scopes cannot afford its bytes inside one 32 KiB read. The lists are literal so
// that adding a task to TASKS forces a person to place it on one side.
const SPLIT_READ_TASKS=["audit","plan","implement","docs","policy","test","git","pr","release","deploy","dependencies","http","benchmark","logging"];
const SINGLE_READ_TASKS=["inspect","ui","gpu","storage"];

test("the subagent-models rule is selected for the fourteen split-read tasks and for none of the four single-read ones",()=>{
  const catalog=loadCatalog(sourceRoot);
  assert.deepEqual([...SPLIT_READ_TASKS,...SINGLE_READ_TASKS].sort(),Object.keys(TASKS).sort(),"a task was added to TASKS without being placed on one side of the split");
  const selects=task=>selectRules(catalog,[task],[]).some(rule=>rule.id==="common.subagent-models");
  for(const task of SPLIT_READ_TASKS)assert.ok(selects(task),`${task} must select common.subagent-models`);
  for(const task of SINGLE_READ_TASKS)assert.ok(!selects(task),`${task} must not select common.subagent-models`);
});

// The plan-change-control rule is scoped like subagent-models — tasks alone, the same fourteen — and has no `paths`:
// selection is paths OR tasks, so a `todo/**` glob would pull it into every `inspect --file todo/…` scope, and so would
// a `depends:` on it from planning-docs, which IS selected there.
const PLAN_CHANGE_RULE="common.plan-change-control";

test("the plan-change-control rule is selected for the fourteen split-read tasks and for none of the four single-read ones",()=>{
  const catalog=loadCatalog(sourceRoot);
  const selects=task=>selectRules(catalog,[task],[]).some(rule=>rule.id===PLAN_CHANGE_RULE);
  for(const task of SPLIT_READ_TASKS)assert.ok(selects(task),`${task} must select ${PLAN_CHANGE_RULE}`);
  for(const task of SINGLE_READ_TASKS)assert.ok(!selects(task),`${task} must not select ${PLAN_CHANGE_RULE}`);
});

test("a plan file does not pull the plan-change-control rule into a scope of the four single-read tasks",()=>{
  const catalog=loadCatalog(sourceRoot);
  const byId=id=>catalog.find(rule=>rule.id===id);
  assert.ok(byId(PLAN_CHANGE_RULE),"the rule exists in the catalog — otherwise every negative below is vacuous");
  for(const task of SINGLE_READ_TASKS)for(const file of ["todo/PLAN_x.md","todo/PLAN_x_E2.md","research/PLAN_x.md"]){
    const ids=selectRules(catalog,[task],[file]).map(rule=>rule.id);
    assert.ok(!ids.includes(PLAN_CHANGE_RULE),`${task} --file ${file} selects ${PLAN_CHANGE_RULE}: a paths glob on it, or a depends on it from a rule that path selects`);
    // the companion: the path really reaches planning-docs, so the negative above is about the dependency, not about a path that matches nothing
    assert.ok(ids.includes("common.planning-docs"),`${task} --file ${file} no longer selects common.planning-docs, so this case proves nothing`);
  }
  assert.deepEqual(byId(PLAN_CHANGE_RULE).paths,[],"the rule carries no paths");
  assert.deepEqual(byId(PLAN_CHANGE_RULE).depends,["common.planning-docs"],"the rule depends on planning-docs and on nothing else");
  assert.ok(!byId("common.planning-docs").depends.includes(PLAN_CHANGE_RULE),"planning-docs must not depend on the rule");
});

test("the rule brings planning-docs where planning-docs' own tasks do not reach",()=>{
  const catalog=loadCatalog(sourceRoot);
  for(const task of ["audit","http","benchmark","logging"]){
    const docs=selectRules(catalog,[task],[]).find(rule=>rule.id==="common.planning-docs");
    assert.ok(docs?.reasons.includes(`dependency:${PLAN_CHANGE_RULE}`),`${task}: common.planning-docs must arrive as the rule's dependency`);
  }
});

test("every single-read scope of the four excluded tasks still fits one read",()=>{
  // The pins are the single-read scopes recorded in research/selection-matrix.json (the 22 of plan section 5), not a list
  // kept here: the matrix test fails when the file and the selection disagree, so this reads one source of truth.
  const catalog=loadCatalog(sourceRoot);
  const matrix=JSON.parse(fs.readFileSync(path.join(sourceRoot,"research/selection-matrix.json"),"utf8"));
  const pins=matrix.scopes.filter(scope=>scope.oneRead===true);
  assert.ok(pins.length>0,"no pins recorded — the loop below would prove nothing");
  for(const scope of pins){
    const bytes=selectRules(catalog,scope.tasks,scope.files).reduce((sum,rule)=>sum+rule.bytes,0);
    assert.ok(bytes<=32768,`${scope.name} selects ${bytes} B, over the 32768 B read`);
  }
});

test("an HTTP-only scope still receives the testing contract it depends on",()=>{
  const rules=selectRules(loadCatalog(sourceRoot),["http"],["api/example.http"]);
  assert.ok(rules.some(rule=>rule.id==="common.testing"));
});

function cliFixture(t) {
  const {root}=fixture(t);
  for(const name of ["tools","node_modules","common","csharp","rust","typescript","AGENTS.md","CLAUDE.md","ENTRY.md",".agents","README.md","research"]) {
    fs.cpSync(path.join(sourceRoot,name),path.join(root,name),{recursive:true});
  }
  gitGuarded(root,"init","-q");
  gitGuarded(root,"-c","user.name=Rule test","-c","user.email=rules@example.invalid","-c","commit.gpgsign=false","commit","--allow-empty","-qm","fixture");
  const cli=(args,cwd=root)=>spawnSync(process.execPath,[path.join(root,"tools/rules.mjs"),...args],{cwd,encoding:"utf8",timeout:GUARD_MS,maxBuffer:1024*1024});
  return {root,cli};
}

test("CLI protocol validates scope, adapters and read boundaries in process",t=>{
  const {root}=cliFixture(t);
  const invoke=args=>run([...args,"--repo",root],root);
  assert.equal(JSON.parse(invoke(["check"])).status,"resolved");
  const scope=["--task","inspect","--file","src/два слова/New.ts"];
  assert.ok(JSON.parse(invoke(["explain",...scope])).rules.some(rule=>rule.id==="typescript.doctrine"));
  assert.match(invoke(["read",...scope,"--only","common.security"]),/END RULE common.security/);
  for(const [args,error] of [
    [["missing"],/Usage/], [["check","--only","common.security"],/only applies/],
    [["explain","--unknown","x"],/Unknown option/], [["explain","--task"],/Missing value/],
    [["read","--task","implement"],/32 KiB/], [["read","--task","inspect","--only","absent.rule"],/not selected/],
  ])assert.throws(()=>invoke(args),error);
  fs.mkdirSync(path.join(root,"src"));
  fs.writeFileSync(path.join(root,"src/AGENTS.override.md"),"An override");
  assert.throws(()=>invoke(["explain",...scope]),/additional instruction/);
  fs.unlinkSync(path.join(root,"src/AGENTS.override.md"));
  fs.writeFileSync(path.join(root,"CLAUDE.md"),"A second body");
  assert.throws(()=>invoke(["check"]),/only @AGENTS/);
  fs.writeFileSync(path.join(root,"CLAUDE.md"),"@AGENTS.md\n");
  fs.writeFileSync(path.join(root,"AGENTS.md"),"A divergent adapter");
  assert.throws(()=>invoke(["check"]),/bootstrap/);
});

test("equivalent dot-segment paths select the same policy",()=>{
  const catalog=loadCatalog(sourceRoot);
  const ids=file=>selectRules(catalog,["inspect"],[file]).map(rule=>rule.id);
  assert.deepEqual(ids("src/./file.cs"),ids("src/file.cs"));
  assert.deepEqual(ids("././Directory.Build.props"),ids("Directory.Build.props"));
  assert.deepEqual(ids("src//file.cs"),ids("src/file.cs"));
});

test("real CLI loads from nested directories, bounds reads and reports missing/override policy",t=>{
  const {root,cli}=cliFixture(t);
  fs.mkdirSync(path.join(root,"src/два слова"),{recursive:true});
  const args=["explain","--task","inspect","--file","src/New.cs","--file","ui/New.ts"];
  const rootTarget=cli(["explain","--task","inspect","--file","."]);
  assert.equal(rootTarget.error,undefined,"root target must fail immediately, not time out");
  assert.equal(rootTarget.status,1);
  const nested=cli(args,path.join(root,"src/два слова"));
  assert.equal(nested.status,0,nested.stderr);
  const manifest=JSON.parse(nested.stdout);
  assert.ok(manifest.rules.some(rule=>rule.id==="csharp.doctrine"));
  assert.ok(manifest.rules.some(rule=>rule.id==="typescript.doctrine"));
  assert.ok(!manifest.rules.some(rule=>rule.id==="rust.doctrine"));
  // Reintroduce the refuted callback in an isolated copy: this must change actual CLI behavior.
  const catalogFile=path.join(root,"tools/lib/rule-catalog.mjs");
  const correct=fs.readFileSync(catalogFile,"utf8");
  const mutated=correct.replace("normalized.filter(file=>match(file))","normalized.filter(match)");
  assert.notEqual(mutated,correct);
  fs.writeFileSync(catalogFile,mutated);
  assert.ok(JSON.parse(cli(args).stdout).rules.some(rule=>rule.id==="rust.doctrine"));
  fs.writeFileSync(catalogFile,correct);
  const large=cli(["read","--task","implement"]);
  assert.equal(large.status,1);
  assert.equal(large.stdout,"");
  assert.match(large.stderr,/32 KiB/);
  const single=cli(["read","--task","implement","--only","common.security"]);
  assert.equal(single.status,0,single.stderr);
  assert.match(single.stdout,/BEGIN RULE common.security/);
  assert.match(single.stdout,/END RULE common.security/);
  fs.writeFileSync(path.join(root,"src/AGENTS.override.md"),"Conflicting local rules\n");
  const conflict=cli(args);
  assert.equal(conflict.status,1);
  assert.match(conflict.stderr,/AGENTS.override/);
  fs.unlinkSync(path.join(root,"src/AGENTS.override.md"));
  fs.unlinkSync(path.join(root,"research/architecture.md"));
  const absentReference=cli(["check"]);
  assert.equal(absentReference.status,1);
  assert.match(absentReference.stderr,/Missing instruction source.*architecture/);
  fs.unlinkSync(path.join(root,".agents/PROJECT.md"));
  const missing=cli(["check"]);
  assert.equal(missing.status,1);
  assert.match(missing.stderr,/Missing instruction source.*PROJECT/);
  fs.renameSync(path.join(root,"node_modules"),path.join(root,"uninstalled-dependencies"));
  const noDependencies=cli(["check"]);
  assert.equal(noDependencies.status,1);
  assert.match(noDependencies.stderr,/rules check: INCOMPLETE.*npm ci --ignore-scripts/s);
});

test("the rule's `## Tokens` table in THIS public repository lists only the dew_flow family and at least one row",()=>{
  // The guard (tools/leftovers-check.mjs) reads whatever families a consumer's table lists; the promise that this copy holds one family is a fact about
  // this file, and it is kept here, beside the other facts about the shipped rules, not inside the shipped guard.
  const table=parseTokenTable(fs.readFileSync(path.join(sourceRoot,"common","test-leftovers.md"),"utf8"));
  assert.ok(table.rows.length>0,"the table has rows");
  assert.deepEqual([...new Set(table.rows.map(row=>row.family))],["dew_flow"]);
});

// ---- path_tasks (E1.S1): a rule's `paths` select only in a scope that also names one of its tasks ----------------
// Plain `tasks` and dependencies ignore the gate; a gate without `paths` is a metadata error; explain names it.

const GATED='id: csharp.mech\nload: conditional\npaths: ["**/*.cs"]\npath_tasks: ["implement","test"]';
const reasonsOf=(catalog,tasks,files,id)=>selectRules(catalog,tasks,files).find(rule=>rule.id===id)?.reasons;

function gatedFixture(t) {
  const f=fixture(t);
  f.put("csharp/mech.md",GATED);
  return {...f,catalog:loadCatalog(f.root)};
}

test("a path_tasks rule is selected by its paths only in a scope that also names one of its tasks",t=>{
  const {catalog}=gatedFixture(t);
  assert.deepEqual(reasonsOf(catalog,["implement"],["src/x.cs"],"csharp.mech"),["path:src/x.cs (**/*.cs) when task:implement"]);
  assert.equal(reasonsOf(catalog,["inspect"],["src/x.cs"],"csharp.mech"),undefined,"the task is outside the gate");
  assert.equal(reasonsOf(catalog,["implement"],[],"csharp.mech"),undefined,"no file");
  assert.equal(reasonsOf(catalog,["implement"],["ui/a.ts"],"csharp.mech"),undefined,"no matching file");
  assert.deepEqual(reasonsOf(catalog,["test","implement"],["src/x.cs"],"csharp.mech"),["path:src/x.cs (**/*.cs) when task:implement,test"]);
});

test("an ungated rule with the same paths is still selected by an inspect scope beside a gated one",t=>{
  const {root,put}=fixture(t);
  put("csharp/mech.md",GATED);
  put("csharp/plain.md",'id: csharp.plain\nload: conditional\npaths: ["**/*.cs"]');
  const ids=selectRules(loadCatalog(root),["inspect"],["src/x.cs"]).map(rule=>rule.id);
  assert.ok(ids.includes("csharp.plain"));
  assert.ok(!ids.includes("csharp.mech"));
});

test("plain tasks and dependencies ignore a rule's path_tasks gate",t=>{
  const {root,put}=fixture(t);
  put("csharp/mech.md",'id: csharp.mech\nload: conditional\ntasks: ["audit"]\npaths: ["**/*.cs"]\npath_tasks: ["implement"]');
  put("common/dep.md",'id: common.dep\nload: conditional\ntasks: ["gpu"]\ndepends: ["csharp.mech"]');
  const catalog=loadCatalog(root);
  assert.deepEqual(reasonsOf(catalog,["audit"],[],"csharp.mech"),["task:audit"],"a plain task selects the gated rule with no file");
  assert.deepEqual(reasonsOf(catalog,["gpu"],[],"csharp.mech"),["dependency:common.dep"],"a dependency arrives whatever its own gate says");
  assert.equal(reasonsOf(catalog,["inspect"],["src/x.cs"],"csharp.mech"),undefined);
});

test("path_tasks is refused when it cannot do its job: no paths, no tasks, an unknown task, a string, an always rule",t=>{
  const {root,put}=fixture(t);
  for(const [meta,expected] of [
    ['id: csharp.g\nload: conditional\ntasks: ["audit"]\npath_tasks: ["implement"]',/path_tasks needs paths/],
    ['id: csharp.g\nload: conditional\ntasks: ["audit"]\npaths: []\npath_tasks: ["implement"]',/path_tasks needs paths/],
    ['id: csharp.g\nload: conditional\npaths: ["**/*.cs"]\npath_tasks: []',/must name at least one task/],
    ['id: csharp.g\nload: conditional\npaths: ["**/*.cs"]\npath_tasks: ["imlpement"]',/imlpement.*legal: inspect/],
    ['id: csharp.g\nload: conditional\npaths: ["**/*.cs"]\npath_tasks: implement',/must be an array of nonempty strings/],
    ['id: csharp.g\nload: always\npaths: ["**/*.cs"]\npath_tasks: ["implement"]',/applies to a conditional rule only/],
  ]) {
    put("csharp/g.md",meta);
    assert.throws(()=>loadCatalog(root),expected,meta);
  }
});

test("explain names the gate: path_tasks and the gated reason, and an empty list for an ungated rule",t=>{
  const {root}=cliFixture(t);
  fs.writeFileSync(path.join(root,"csharp/zz-gated.md"),`---\nid: csharp.zz-gated\nload: conditional\npaths: ["**/*.cs"]\npath_tasks: ["implement"]\n---\nA complete rule.\n`);
  const explain=(...args)=>JSON.parse(run(["explain",...args,"--repo",root],root)).rules;
  const gated=explain("--task","implement","--file","src/x.cs").find(rule=>rule.id==="csharp.zz-gated");
  assert.deepEqual(gated.path_tasks,["implement"]);
  assert.deepEqual(gated.reasons,["path:src/x.cs (**/*.cs) when task:implement"]);
  const inspect=explain("--task","inspect","--file","src/x.cs");
  assert.ok(!inspect.some(rule=>rule.id==="csharp.zz-gated"));
  assert.deepEqual(inspect.find(rule=>rule.id==="csharp.doctrine").path_tasks,[]);
});

// ---- the gate record and its provenance (tools/lib/gates.mjs) ----------------------------------------------------

function provenanceFixture(t) {
  const f=fixture(t);
  f.put("csharp/mech.md",GATED);
  f.put("common/src.md",'id: common.src\nload: conditional\ntasks: ["implement","test"]');
  f.put("typescript/doc.md",'id: typescript.doc\nload: conditional\npaths: ["**/*.ts"]');
  f.put("csharp/plain.md",'id: csharp.plain\nload: conditional\npaths: ["**/*.cs"]');
  return {...f,catalog:()=>loadCatalog(f.root)};
}
const REASON="the plan changed the applicability on purpose";

test("provenance: a gate that mirrors the tasks line of its source is accepted",t=>{
  const {catalog}=provenanceFixture(t);
  assert.deepEqual(provenanceFindings(catalog(),{"csharp.mech":{mirrors:"common.src",epic:"E2"}},[]),[]);
});

test("provenance: a gated rule with no record, a source with other tasks, and a path-only source are each one finding",t=>{
  const {root,put,catalog}=provenanceFixture(t);
  const find=gates=>provenanceFindings(catalog(),gates,[]);
  const none=find({});
  assert.equal(none.length,1);
  assert.match(none[0],/csharp\.mech carries path_tasks but has no gate record/);
  put("common/src.md",'id: common.src\nload: conditional\ntasks: ["implement","audit"]');
  assert.equal(find({"csharp.mech":{mirrors:"common.src",epic:"E2"}}).length,1,"the set comparison");
  assert.equal(find({"csharp.mech":{mirrors:"typescript.doc",epic:"E2"}}).length,1);
  assert.match(find({"csharp.mech":{mirrors:"typescript.doc",epic:"E2"}})[0],/typescript\.doc has no tasks: line; declare the applicability change instead/);
  assert.equal(find({"csharp.mech":{mirrors:"common.missing",epic:"E2"}}).length,1,"the source must exist");
  assert.ok(root);
});

test("provenance: a declared gate needs the same path_tasks as the rule and a reason of at least 20 characters",t=>{
  const {catalog}=provenanceFixture(t);
  const declared=(path_tasks,reason)=>({"csharp.mech":{declared:{path_tasks,reason},epic:"E2"}});
  const find=gates=>provenanceFindings(catalog(),gates,[]);
  assert.deepEqual(find(declared(["test","implement"],REASON)),[]);
  assert.equal(find(declared(["test","implement"],"x")).length,1);
  assert.equal(find(declared(["implement"],REASON)).length,1);
  assert.equal(find({"csharp.mech":{mirrors:"common.src",declared:{path_tasks:["implement","test"],reason:REASON},epic:"E2"}}).length,1,"both keys");
  assert.equal(find({"csharp.mech":{epic:"E2"}}).length,1,"neither key");
  assert.equal(find({"csharp.plain":{declared:{path_tasks:["implement"],reason:REASON},epic:"E2"},"csharp.mech":{mirrors:"common.src",epic:"E2"}}).length,1,"declared on an ungated rule");
});

test("provenance: a record for an absent rule is allowed only while its epic has not landed",t=>{
  const {catalog}=provenanceFixture(t);
  const gates={"csharp.mech":{mirrors:"common.src",epic:"E2"},"csharp.later":{mirrors:"common.src",epic:"E6"}};
  assert.deepEqual(provenanceFindings(catalog(),gates,[]),[]);
  const landed=provenanceFindings(catalog(),gates,["E6"]);
  assert.equal(landed.length,1);
  assert.match(landed[0],/csharp\.later/);
});

test("provenance: a gate record names its owning epic, E2 to E6",t=>{
  const {catalog}=provenanceFixture(t);
  const withEpic=epic=>({"csharp.mech":{mirrors:"common.src",...(epic===undefined?{}:{epic})}});
  assert.deepEqual(provenanceFindings(catalog(),withEpic("E6"),[]),[]);
  for(const epic of [undefined,"E1","E9","e2"]){
    const findings=provenanceFindings(catalog(),withEpic(epic),[]);
    assert.equal(findings.length,1,String(epic));
    assert.match(findings[0],/csharp\.mech: .*owning epic/);
  }
});

test("provenance: a path-only source mirrors as no gate, and a tasks source cannot be mirrored by an ungated rule",t=>{
  const {catalog}=provenanceFixture(t);
  assert.deepEqual(provenanceFindings(catalog(),{"csharp.plain":{mirrors:"typescript.doc",epic:"E2"},"csharp.mech":{mirrors:"common.src",epic:"E2"}},[]),[]);
  assert.equal(provenanceFindings(catalog(),{"csharp.plain":{mirrors:"common.src",epic:"E2"},"csharp.mech":{mirrors:"common.src",epic:"E2"}},[]).length,1);
});

test("the real catalog carries no path_tasks gate and no gate record at E1",()=>{
  const catalog=loadCatalog(sourceRoot);
  assert.deepEqual(catalog.filter(rule=>rule.pathTasks.length).map(rule=>rule.id),[],"E1 gates no real rule");
  assert.deepEqual(provenanceFindings(catalog,{},[]),[]);
});

// ---- the byte caps (E1.S2): a ceiling per scope, rule or core, from plan section 5 -------------------------------------
// A rule cap applies whenever the rule exists; a cap with `from` applies once that epic is in LANDED_EPICS. The numbers are
// the plan's: the always core 15,055 B + 300; `gpu --file src/x.cs` 32,293 + 20 + 300; the single-sentence and
// three-sentence allowances of the dependency and compiler-strictness rules (O5: 3,300 B, not 3,500 B).
const CAPS=Object.freeze([
  {what:"the always core",core:true,max:15355},
  {what:"gpu --file src/x.cs",tasks:["gpu"],files:["src/x.cs"],max:32613},
  {what:"csharp.doctrine",rule:"csharp.doctrine",max:4633},
  {what:"typescript.npm-packages",rule:"typescript.npm-packages",max:3300},
  {what:"typescript.compiler-strictness",rule:"typescript.compiler-strictness",max:3300},
  {what:"common.dependencies",rule:"common.dependencies",max:4000},
  {what:"typescript.utc-timestamps",rule:"typescript.utc-timestamps",max:1200},
  {what:"csharp.boundaries",rule:"csharp.boundaries",max:1400},
  {what:"typescript.doctrine",rule:"typescript.doctrine",max:4700,from:"E4"},
]);

function capFindings(catalog,caps,landedEpics){
  const byId=new Map(catalog.map(rule=>[rule.id,rule]));
  const closure=new Set();
  const addCore=id=>{ if(closure.has(id))return; closure.add(id); byId.get(id).depends.forEach(addCore); };
  catalog.filter(rule=>rule.load==="always").forEach(rule=>addCore(rule.id));
  const findings=[];
  for(const cap of caps){
    if(cap.from&&!landedEpics.includes(cap.from))continue;
    let bytes;
    if(cap.core)bytes=[...closure].reduce((sum,id)=>sum+byId.get(id).bytes,0);
    else if(cap.rule){ if(!byId.has(cap.rule))continue; bytes=byId.get(cap.rule).bytes; }
    else bytes=selectRules(catalog,cap.tasks,cap.files).reduce((sum,rule)=>sum+rule.bytes,0);
    if(bytes>cap.max)findings.push(`${cap.what} is ${bytes} B, over its cap of ${cap.max} B`);
  }
  return findings;
}

// A rule file of EXACTLY `total` bytes (front matter included — the catalog's `bytes` is the whole folded file).
function sizedRule(put,file,metadata,total){
  const head=`---\n${metadata}\n---\n`;
  put(file,metadata,"x".repeat(total-Buffer.byteLength(head)));
}

test("every cap holds on the real catalog",()=>{
  assert.deepEqual(capFindings(loadCatalog(sourceRoot),CAPS,LANDED_EPICS),[]);
});

test("a cap is red one byte over: the core, a rule, and a rule whose cap starts at its epic",t=>{
  const over=(file,metadata,total,landed=[])=>{
    const {root,put}=fixture(t);
    sizedRule(put,file,metadata,total);
    return capFindings(loadCatalog(root),CAPS,landed);
  };
  assert.deepEqual(over("common/core.md","id: common.core\nload: always",15355),[],"the cap itself is allowed");
  assert.equal(over("common/core.md","id: common.core\nload: always",15356).length,1);
  assert.deepEqual(over("typescript/npm-packages.md",'id: typescript.npm-packages\nload: conditional\ntasks: ["dependencies"]',3300),[]);
  assert.equal(over("typescript/npm-packages.md",'id: typescript.npm-packages\nload: conditional\ntasks: ["dependencies"]',3301).length,1);
  const doctrine='id: typescript.doctrine\nload: conditional\ntasks: ["audit"]';
  assert.deepEqual(over("typescript/doctrine.md",doctrine,4701,[]),[],"typescript.doctrine is capped from E4");
  assert.equal(over("typescript/doctrine.md",doctrine,4701,["E4"]).length,1);
});

// ---- the selection cases of a gate record: a positive and the defined negatives (plan section 4.4) --------------------

const CASE_RULE="csharp.mech";
function caseFixture(t,record){
  const {root}=provenanceFixture(t);
  return caseFindings(loadCatalog(root),record);
}
const POSITIVE={tasks:["implement"],files:["src/x.cs"],selected:true};
const OUT_OF_GATE={tasks:["inspect"],files:["src/x.cs"],selected:false};
const NO_PATH={tasks:["implement"],files:["ui/a.ts"],selected:false};
const gatedRecord=cases=>({[CASE_RULE]:{mirrors:"common.src",epic:"E2",cases}});

test("a gated rule's record needs a positive, a negative outside the gate and a negative with no matching file",t=>{
  assert.deepEqual(caseFixture(t,gatedRecord([POSITIVE,OUT_OF_GATE,NO_PATH])),[],"the selection fixture: a positive and the defined negatives");
});

test("a gated rule's record is red without each negative, and when a case does not hold under the selector",t=>{
  const without=cases=>caseFixture(t,gatedRecord(cases));
  const noOut=without([POSITIVE,NO_PATH]);
  assert.equal(noOut.length,1);
  assert.match(noOut[0],/csharp\.mech/);
  assert.match(noOut[0],/outside the gate/);
  const noPath=without([POSITIVE,OUT_OF_GATE]);
  assert.equal(noPath.length,1);
  assert.match(noPath[0],/no matching file/);
  const wrong=without([POSITIVE,OUT_OF_GATE,NO_PATH,{tasks:["gpu"],files:["src/x.cs"],selected:true}]);
  assert.equal(wrong.length,1);
  assert.match(wrong[0],/gpu src\/x\.cs/);
  assert.match(without([OUT_OF_GATE,NO_PATH]).join("\n"),/positive/);
});

test("an ungated mirror needs a negative with no matching file",t=>{
  const record=cases=>({"typescript.doc":{mirrors:"csharp.plain",epic:"E2",cases}});
  const positive={tasks:["inspect"],files:["ui/a.ts"],selected:true};
  assert.deepEqual(caseFixture(t,record([positive,{tasks:["inspect"],files:["src/x.cs"],selected:false}])),[]);
  assert.equal(caseFixture(t,record([positive])).length,1);
});

test("a case with an unknown task or a path that is not root-relative is a finding",t=>{
  const bad=caseFixture(t,gatedRecord([POSITIVE,OUT_OF_GATE,NO_PATH,{tasks:["imlpement"],files:["src/x.cs"],selected:false},{tasks:["inspect"],files:["../x.cs"],selected:false}]));
  assert.ok(bad.some(finding=>/imlpement/.test(finding)));
  assert.ok(bad.some(finding=>/\.\.\/x\.cs/.test(finding)));
});

test("the allowances section of research/module_rules.md states every cap the tests enforce, with the epic that owns it",()=>{
  // The prose is where an epic reads its budget before it writes; a cap changed here and not there is a story that
  // plans against a number the suite no longer holds.
  const text=fs.readFileSync(path.join(sourceRoot,"research/module_rules.md"),"utf8");
  const start=text.indexOf("## Byte allowances per epic");
  assert.ok(start>=0,"research/module_rules.md has no `## Byte allowances per epic` section");
  const end=text.indexOf("\n## ",start+1);
  const section=text.slice(start,end<0?undefined:end);
  for(const cap of CAPS)assert.ok(section.includes(`${cap.max.toLocaleString("en-US")} B`),`the allowances section does not state ${cap.what} at ${cap.max.toLocaleString("en-US")} B`);
  for(const epic of ["E2","E3","E4","E5","E6"])assert.ok(section.includes(epic),`${epic} has no allowance row`);
});
