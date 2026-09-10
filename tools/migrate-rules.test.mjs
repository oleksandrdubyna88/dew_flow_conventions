import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync,spawnSync} from "node:child_process";
import {rebaseLinks,migrationPlan,applyMigration,git} from "./lib/rule-migration.mjs";

test("moved project links resolve to the same repository targets",()=>{
  const original='Read [design](research/architecture.md) and [gate](.claude/rules/shared/common/coai-review-gate.md). Keep [web](https://example.org/a) and [local](#here).';
  const result=rebaseLinks(original,"CLAUDE.md",".agents/PROJECT.md");
  assert.equal(result,'Read [design](../research/architecture.md) and [gate](conventions/common/coai-review-gate.md). Keep [web](https://example.org/a) and [local](#here).');
  assert.equal(rebaseLinks('[design](research/architecture.md?view=1#section)',"CLAUDE.md",".agents/PROJECT.md"),'[design](../research/architecture.md?view=1#section)');
});

test("local rule links retain their meaning after changing directory depth",()=>{
  assert.equal(rebaseLinks('[shared](../shared/common/security.md)',".claude/rules/common/local.md",".agents/rules/common/local.md"),'[shared](../../conventions/common/security.md)');
});

test("links escaping the repository are rejected before migration",()=>{
  assert.throws(()=>rebaseLinks('[outside](../secret.md)',"CLAUDE.md",".agents/PROJECT.md"),/outside/);
});

test("the existing gate checker recognizes missing neutral mounts and relocated local copies",t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"neutral-gate-"));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const tool=path.join(path.dirname(fileURLToPath(import.meta.url)),"gate-snippet-check.mjs");
  fs.writeFileSync(path.join(root,".gitmodules"),'[submodule "conventions"]\n path = .agents/conventions\n url = https://example.invalid/conventions\n');
  const check=()=>{
    try{return {code:0,out:execFileSync(process.execPath,[tool],{cwd:root,encoding:"utf8",timeout:10000,stdio:["ignore","pipe","pipe"]})};}
    catch(error){return {code:error.status,out:error.stdout+error.stderr};}
  };
  const missing=check();
  assert.equal(missing.code,1);
  assert.match(missing.out,/mounted but carries no/);
  fs.mkdirSync(path.join(root,".agents/conventions/common"),{recursive:true});
  const rule='<!-- coai-snippet v5 -->\n## Multi-model review gate (ConnectOtherAIs)\n';
  fs.writeFileSync(path.join(root,".agents/conventions/common/coai-review-gate.md"),rule);
  assert.equal(check().code,0);
  fs.writeFileSync(path.join(root,".agents/PROJECT.md"),rule);
  assert.equal(check().code,1);
  assert.match(check().out,/OWN COPY .agents\/PROJECT.md/);
  fs.unlinkSync(path.join(root,".agents/PROJECT.md"));
  fs.mkdirSync(path.join(root,".agents/rules/nested"),{recursive:true});
  fs.writeFileSync(path.join(root,".agents/rules/nested/copied.md"),rule);
  assert.equal(check().code,1);
  fs.unlinkSync(path.join(root,".agents/rules/nested/copied.md"));
  fs.appendFileSync(path.join(root,".gitmodules"),'[submodule "old"]\n path = .claude/rules/shared\n url = https://example.invalid/conventions\n');
  assert.equal(check().code,1,"two declared rule mounts must not pass as one canonical source");
  assert.match(check().out,/multiple rule mounts/i);
});

test("real Git migration leaves source work intact and prepares exactly one relocated submodule",t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"migration пробел "));
  const repo=path.join(temp,"source"),output=path.join(temp,"prepared");
  const conventions=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  fs.mkdirSync(repo);
  git(repo,"init","-q");
  git(repo,"config","user.name","Migration test");
  git(repo,"config","user.email","test@example.invalid");
  git(repo,"config","commit.gpgsign","false");
  fs.mkdirSync(path.join(repo,"research"));
  fs.mkdirSync(path.join(repo,".claude/rules/common/deep"),{recursive:true});
  fs.writeFileSync(path.join(repo,"research/architecture.md"),"# Architecture\n");
  fs.writeFileSync(path.join(repo,"README.md"),"# Product\n");
  fs.writeFileSync(path.join(repo,"CLAUDE.md"),"Read [architecture](research/architecture.md).\n");
  fs.writeFileSync(path.join(repo,".claude/settings.json"),'{"permissions":{"defaultMode":"acceptEdits"}}\n');
  fs.writeFileSync(path.join(repo,".claude/rules/common/deep/local.md"),"# Project policy\nUse this project's error type.\n");
  git(repo,"-c","protocol.file.allow=always","submodule","add",conventions,".claude/rules/shared");
  git(repo,"add","--","CLAUDE.md","README.md","research/architecture.md",".claude/settings.json",".claude/rules/common/deep/local.md",".gitmodules",".claude/rules/shared");
  git(repo,"commit","-qm","fixture");
  const base=git(repo,"rev-parse","HEAD"),sha=git(conventions,"rev-parse","HEAD");
  fs.writeFileSync(path.join(repo,"README.md"),"User's unfinished work.\n");
  const options={repo,conventions,sha,output,branch:"migrate-test"};
  assert.throws(()=>migrationPlan({...options,sha:"0000000000000000000000000000000000000000"}));
  assert.throws(()=>migrationPlan({...options,output:repo}),/outside/);
  fs.writeFileSync(path.join(repo,".claude/rules/ignored.md"),"Unfinished policy");
  assert.throws(()=>migrationPlan(options),/Untracked or ignored policy/);
  fs.unlinkSync(path.join(repo,".claude/rules/ignored.md"));
  fs.writeFileSync(path.join(repo,"AGENTS.md"),"Another adapter");
  assert.throws(()=>migrationPlan(options),/Existing instruction/);
  fs.unlinkSync(path.join(repo,"AGENTS.md"));
  const plan=migrationPlan(options);
  assert.equal(plan.journal.status,"dry-run");
  assert.equal(fs.existsSync(output),false);
  assert.equal(git(repo,"rev-parse","HEAD"),base);
  const result=applyMigration(plan);
  assert.equal(result.status,"prepared: validation required");
  assert.equal(fs.readFileSync(path.join(repo,"README.md"),"utf8"),"User's unfinished work.\n");
  assert.equal(fs.existsSync(path.join(output,".claude/rules/shared")),false);
  assert.equal(git(output,"config","-f",".gitmodules","--get","submodule..claude/rules/shared.path"),".agents/conventions");
  assert.equal(git(path.join(output,".agents/conventions"),"rev-parse","HEAD"),sha);
  assert.match(fs.readFileSync(path.join(output,".agents/PROJECT.md"),"utf8"),/\.\.\/research\/architecture.md/);
  assert.equal(fs.readFileSync(path.join(output,"CLAUDE.md"),"utf8"),"@AGENTS.md\n");
  // Locked packages are JS only; copy the already-installed exact dependencies for this offline fixture.
  fs.cpSync(path.join(conventions,"node_modules"),path.join(output,".agents/conventions/node_modules"),{recursive:true});
  const check=JSON.parse(execFileSync(process.execPath,[path.join(output,".agents/conventions/tools/rules.mjs"),"check","--repo",output],{encoding:"utf8",timeout:10000}));
  assert.equal(check.version.actual,sha);
  assert.equal(check.version.staged,true);
  assert.ok(check.rules.some(rule=>rule.id==="local.common.deep.local"));
  const mounted=path.join(output,".agents/conventions");
  const cli=(args=["check"],cwd=output)=>spawnSync(process.execPath,[path.join(mounted,"tools/rules.mjs"),...args],{cwd,encoding:"utf8",timeout:10000});
  const scoped=cli(["explain","--task","inspect","--file","src/новый.cs"]);
  assert.equal(scoped.status,0,scoped.stderr);
  assert.ok(JSON.parse(scoped.stdout).rules.some(rule=>rule.id==="local.common.deep.local"));
  fs.appendFileSync(path.join(mounted,"common/security.md"),"Uncommitted change\n");
  assert.match(cli().stderr,/uncommitted changes/i);
  git(mounted,"restore","--","common/security.md");
  // A fresh checkout may be shallow; manufacture a distinct commit without requiring HEAD^.
  git(mounted,"-c","user.name=Migration test","-c","user.email=test@example.invalid","-c","commit.gpgsign=false","commit","--allow-empty","-qm","wrong pinned version");
  assert.match(cli().stderr,/gitlink|match/i);
  git(mounted,"checkout","--detach",sha);
  fs.renameSync(path.join(mounted,"ENTRY.md"),path.join(mounted,"ENTRY.absent"));
  assert.equal(cli().status,1);
  fs.renameSync(path.join(mounted,"ENTRY.absent"),path.join(mounted,"ENTRY.md"));
  git(output,"commit","-qm","migrate fixture");
  assert.equal(JSON.parse(cli().stdout).version.staged,false);
  const clone=path.join(temp,"fresh clone");
  git(temp,"clone","-q",output,clone);
  git(clone,"-c","protocol.file.allow=always","submodule","update","--init","--",".agents/conventions");
  fs.cpSync(path.join(conventions,"node_modules"),path.join(clone,".agents/conventions/node_modules"),{recursive:true});
  const fresh=spawnSync(process.execPath,[path.join(clone,".agents/conventions/tools/rules.mjs"),"read","--task","inspect","--file","src/новый.cs"],{cwd:clone,encoding:"utf8",timeout:10000});
  assert.equal(fresh.status,0,fresh.stderr);
  assert.match(fresh.stdout,/END RULE local.common.deep.local/);
  // Roll back only this disposable clone; the user's source and prepared worktree stay untouched.
  git(clone,"-c","protocol.file.allow=always","submodule","deinit","-f","--",".agents/conventions");
  git(clone,"checkout","--detach",base);
  git(clone,"-c","protocol.file.allow=always","submodule","update","--init","--", ".claude/rules/shared");
  assert.equal(fs.readFileSync(path.join(clone,"CLAUDE.md"),"utf8").replaceAll("\r\n","\n"),"Read [architecture](research/architecture.md).\n");
  assert.equal(fs.existsSync(path.join(clone,".agents/PROJECT.md")),false);
  assert.equal(git(path.join(clone,".claude/rules/shared"),"rev-parse","HEAD"),plan.mount.oldSha);
});
