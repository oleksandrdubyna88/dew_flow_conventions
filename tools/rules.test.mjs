import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";
import { loadCatalog, selectRules, sha256 } from "./lib/rule-catalog.mjs";
import {run} from "./lib/rule-cli.mjs";
import {bodyOf, sectionsOf} from "./lib/rule-body.mjs";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rules Unicode пробел "));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
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

test("an HTTP-only scope still receives the testing contract it depends on",()=>{
  const rules=selectRules(loadCatalog(sourceRoot),["http"],["api/example.http"]);
  assert.ok(rules.some(rule=>rule.id==="common.testing"));
});

function cliFixture(t) {
  const {root}=fixture(t);
  for(const name of ["tools","node_modules","common","csharp","rust","typescript","AGENTS.md","CLAUDE.md","ENTRY.md",".agents","README.md","research"]) {
    fs.cpSync(path.join(sourceRoot,name),path.join(root,name),{recursive:true});
  }
  execFileSync("git",["init","-q",root],{timeout:10000});
  execFileSync("git",["-C",root,"-c","user.name=Rule test","-c","user.email=rules@example.invalid","-c","commit.gpgsign=false","commit","--allow-empty","-qm","fixture"],{timeout:10000});
  const cli=(args,cwd=root)=>spawnSync(process.execPath,[path.join(root,"tools/rules.mjs"),...args],{cwd,encoding:"utf8",timeout:10000,maxBuffer:1024*1024});
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
