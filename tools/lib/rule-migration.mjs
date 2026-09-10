import * as fs from "node:fs";
import * as path from "node:path";
import {git,gitOutput} from "./git.mjs";
import {bootstrap} from "./rule-cli.mjs";
import {TASKS,sha256} from "./rule-catalog.mjs";
import {within} from "./paths.mjs";

export const OLD_MOUNT=".claude/rules/shared";
export const NEW_MOUNT=".agents/conventions";
const operational=name=>["README.md","POST_DEPLOY.md"].includes(name)||name.startsWith(".github/workflows/");
export const rewriteMount=text=>text.replaceAll(OLD_MOUNT,NEW_MOUNT);
const movedPath=value=>rewriteMount(value).replace(/^\.claude\/rules\//,".agents/rules/");

export function rebaseLinks(text,from,to,validate=()=>{}) {
  return text.replace(/\]\(([^)]+)\)/g,(whole,inside)=>{
    if(/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(inside)) return whole;
    const match=/^(\S+?)(\s+["'][\s\S]*["'])?$/.exec(inside);
    if(!match) throw new Error(`Unsupported Markdown link in ${from}: ${inside}`);
    const [,target,suffix=""]=/^([^?#]*)([?#][\s\S]*)?$/.exec(match[1]);
    const rooted=path.posix.normalize(path.posix.join(path.posix.dirname(from),target));
    if(target.startsWith("/")||rooted===".."||rooted.startsWith("../")) throw new Error(`Link outside repository in ${from}: ${target}`);
    const moved=movedPath(rooted);
    validate(rooted,moved);
    const relative=path.posix.relative(path.posix.dirname(to),moved)||".";
    return `](${relative}${suffix}${match[2]??""})`;
  });
}

function blob(repo,base,file) {return gitOutput(repo,["show",`${base}:${file}`]).replaceAll("\r\n","\n");}
function existsAt(repo,base,file) {
  try {git(repo,"cat-file","-e",file?`${base}:${file}`:`${base}^{tree}`);return true;}
  catch{return false;}
}

function actualPolicies(repo,tracked) {
  const walk=directory=>{
    if(!fs.existsSync(directory))return;
    if(fs.lstatSync(directory).isSymbolicLink())throw new Error(`Policy symlink: ${directory}`);
    for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
      const full=path.join(directory,entry.name);
      const relative=path.relative(repo,full).replaceAll("\\","/");
      if(relative===OLD_MOUNT)continue;
      if(entry.isSymbolicLink())throw new Error(`Policy symlink: ${relative}`);
      if(entry.isDirectory())walk(full);
      else if(!tracked.includes(relative))throw new Error(`Untracked or ignored policy source: ${relative}`);
    }
  };
  walk(path.join(repo,".claude/rules"));
  for(const file of ["AGENTS.md","AGENTS.override.md",".agents/PROJECT.md",".agents/rules",NEW_MOUNT]) {
    if(fs.existsSync(path.join(repo,file)))throw new Error(`Existing instruction source needs reconciliation: ${file}`);
  }
}

function mountInfo(repo,base) {
  const lines=git(repo,"config","--blob",`${base}:.gitmodules`,"--get-regexp","^submodule\\..*\\.path$").split("\n");
  const found=lines.map(line=>{
    const split=line.indexOf(" ");
    return {name:line.slice(10,split-5),path:line.slice(split+1).replaceAll("\\","/")};
  });
  const mount=found.find(item=>item.path===OLD_MOUNT);
  if(!mount || found.some(item=>item.path===NEW_MOUNT)) throw new Error("Expected exactly one legacy conventions mount and no neutral mount");
  if(!/^[a-zA-Z0-9._/-]+$/.test(mount.name))throw new Error("Unsafe submodule section name");
  if(found.filter(item=>item.path===OLD_MOUNT).length!==1)throw new Error("Duplicate conventions mount");
  return {...mount,url:git(repo,"config","--blob",`${base}:.gitmodules`,"--get",`submodule.${mount.name}.url`),oldSha:git(repo,"rev-parse",`${base}:${OLD_MOUNT}`)};
}

export function migrationPlan({repo,conventions,sha,base="HEAD",output,branch,rewrite=[]}) {
  const root=path.resolve(git(path.resolve(repo),"rev-parse","--show-toplevel"));
  const source=path.resolve(git(path.resolve(conventions),"rev-parse","--show-toplevel"));
  const baseSha=git(root,"rev-parse","--verify","--end-of-options",`${base}^{commit}`);
  const newSha=git(source,"rev-parse","--verify","--end-of-options",`${sha}^{commit}`);
  const requested=path.resolve(output);
  let ancestor=requested;
  while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
  const destination=path.join(fs.realpathSync(ancestor),path.relative(ancestor,requested));
  const comparable=value=>process.platform==="win32"?value.toLowerCase():value;
  const realDestination=comparable(destination);
  for(const checkout of [root,source]) {
    const realRoot=comparable(fs.realpathSync(checkout));
    if(realDestination===realRoot||realDestination.startsWith(realRoot+path.sep))throw new Error("Disposable output must be outside both source checkouts");
  }
  if(fs.existsSync(destination))throw new Error(`Output already exists; inspect or recover it before retry: ${destination}`);
  if(!branch || branch.startsWith("-"))throw new Error("An explicit new branch is required");
  git(root,"check-ref-format","--branch",branch);
  const files=git(root,"ls-tree","-rz","--name-only",baseSha).split("\0").filter(Boolean);
  for(const file of rewrite) {
    within(root,file);
    if(!files.includes(file)||!/^(?:tools|scripts|deploy)\/.*\.(?:mjs|js|sh|ps1|cmd|bat|ya?ml)$/.test(file))throw new Error(`Explicit rewrite must name a tracked operational script under tools, scripts or deploy: ${file}`);
  }
  const rewritable=name=>operational(name)||rewrite.includes(name);
  if(files.some(file=>["AGENTS.md","AGENTS.override.md",".agents/PROJECT.md",NEW_MOUNT].includes(file)||file.startsWith(".agents/rules/")))throw new Error("Selected base already contains neutral instructions; reconcile instead of replacing them");
  const symlinks=git(root,"ls-tree","-rz",baseSha).split("\0").filter(line=>line.startsWith("120000 ")).map(line=>line.slice(line.indexOf("\t")+1));
  if(symlinks.some(file=>["CLAUDE.md",".claude",".agents"].includes(file)||file.startsWith(".claude/")||rewritable(file)))throw new Error("Selected base contains symlinked migration inputs");
  actualPolicies(root,files);
  const mount=mountInfo(root,baseSha);
  for(const file of ["ENTRY.md","tools/rules.mjs","package-lock.json"]) {
    if(!existsAt(source,newSha,file))throw new Error(`Selected conventions commit lacks ${file}`);
  }
  for(const file of files.filter(name=>/^\.(claude|codex|vscode)\//.test(name)&&!name.startsWith(".claude/rules/")&&/\.(json|toml)$/.test(name))) {
    if(blob(root,baseSha,file).includes(OLD_MOUNT))throw new Error(`Host configuration still references the legacy mount: ${file}; reconcile explicitly`);
  }
  const patches=[];
  const validate=(oldTarget,newTarget)=>{
    const shared=newTarget===NEW_MOUNT||newTarget.startsWith(NEW_MOUNT+"/");
    const exists=shared?existsAt(source,newSha,newTarget.slice(NEW_MOUNT.length+1)):existsAt(root,baseSha,oldTarget);
    if(!exists)throw new Error(`Unresolved instruction link: ${oldTarget} -> ${newTarget}`);
  };
  const projectText=rewriteMount(rebaseLinks(blob(root,baseSha,"CLAUDE.md"),"CLAUDE.md",".agents/PROJECT.md",validate));
  if(projectText.startsWith("---\n"))throw new Error("Existing CLAUDE frontmatter needs explicit migration");
  const requires=["README.md","research/architecture.md"].filter(file=>files.includes(file));
  patches.push({path:".agents/PROJECT.md",text:`---\nrequires: ${JSON.stringify(requires)}\n---\n${projectText}`});
  patches.push({path:"CLAUDE.md",text:"@AGENTS.md\n"},{path:"AGENTS.md",text:bootstrap()});
  for(const file of files.filter(name=>name.startsWith(".claude/rules/")&&name!==OLD_MOUNT)) {
    if(!file.endsWith(".md"))throw new Error(`Non-Markdown local rule requires reconciliation: ${file}`);
    const text=blob(root,baseSha,file);
    if(text.startsWith("---\n"))throw new Error(`Scoped local rule needs an explicit metadata mapping: ${file}`);
    const target=movedPath(file);
    const id="local."+file.slice(".claude/rules/".length,-3).replaceAll("/",".");
    // An unscoped source applied to inspection too. Preserve that scope for every supported task.
    const tasks=Object.keys(TASKS);
    patches.push({path:target,remove:file,text:`---\nid: ${JSON.stringify(id)}\nload: conditional\ntasks: ${JSON.stringify(tasks)}\n---\n${rewriteMount(rebaseLinks(text,file,target,validate))}`});
  }
  for(const file of files.filter(rewritable)) {
    const before=blob(root,baseSha,file), after=rewriteMount(before);
    if(before!==after)patches.push({path:file,text:after});
  }
  const protectedFiles=files.filter(name=>/^(?:\.claude\/.*\.json|\.codex\/|\.vscode\/|\.gitignore$)/.test(name));
  let references;
  try {references=gitOutput(root,["grep","-I","-l","-z","-F",OLD_MOUNT,baseSha,"--"]);}
  catch(error) {if(error.status!==1)throw error;references="";}
  const changed=new Set(patches.flatMap(patch=>[patch.path,patch.remove].filter(Boolean)));
  const remainingReferences=references.split("\0").filter(Boolean).map(name=>name.slice(baseSha.length+1))
    .filter(name=>!changed.has(name)).map(file=>({file,kind:/^(research|todo)\//.test(file)?"historical or planned: inspect":"requires review"}));
  const dirtyInputs=git(root,"diff","--name-only","-z","HEAD","--").split("\0").filter(name=>name&&
    (changed.has(name)||rewritable(name)||name==="CLAUDE.md"||name.startsWith(".claude/rules/")));
  const journal={status:"dry-run",base:baseSha,newSha,branch,output:destination,oldMount:OLD_MOUNT,newMount:NEW_MOUNT,
    remainingReferences,dirtyInputs,
    paths:patches.map(({path,remove,text})=>({path,remove,hash:sha256(text)}))};
  if(Buffer.byteLength(JSON.stringify(journal,null,2))>250*1024)throw new Error("Migration report exceeds 250 KiB; narrow the migration inputs");
  return {root,source,base:baseSha,newSha,output:destination,branch,mount,patches,protectedFiles,journal};
}

export function applyMigration(plan) {
  fs.mkdirSync(path.dirname(plan.output),{recursive:true});
  git(plan.root,"worktree","add","-b",plan.branch,plan.output,plan.base);
  const journalPath=git(plan.output,"rev-parse","--path-format=absolute","--git-path","rules-migration.json");
  const record=(status,error)=>fs.writeFileSync(journalPath,JSON.stringify({...plan.journal,status,error:error?.slice(0,1000)},null,2)+"\n");
  record("incomplete: preparing");
  try {
    git(plan.output,"-c","protocol.file.allow=always","-c",`submodule.${plan.mount.name}.url=${plan.source}`,"submodule","update","--init","--",OLD_MOUNT);
    git(path.join(plan.output,OLD_MOUNT),"checkout","--detach",plan.newSha);
    fs.mkdirSync(path.join(plan.output,".agents"),{recursive:true});
    git(plan.output,"mv",OLD_MOUNT,NEW_MOUNT);
    git(plan.output,"submodule","sync","--",NEW_MOUNT);
    for(const patch of plan.patches) {
      const target=within(plan.output,patch.path);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.writeFileSync(target,patch.text);
      if(patch.remove)fs.unlinkSync(within(plan.output,patch.remove));
    }
    // Only empty directories are removed; unexpected files remain visible to the resolver.
    const legacyRoot=path.join(plan.output,".claude/rules");
    const emptyDirectories=new Set([legacyRoot]);
    for(const patch of plan.patches.filter(patch=>patch.remove)) {
      let directory=path.dirname(within(plan.output,patch.remove));
      while(directory.startsWith(legacyRoot+path.sep)) {
        emptyDirectories.add(directory);
        directory=path.dirname(directory);
      }
    }
    for(const directory of [...emptyDirectories].sort((a,b)=>b.length-a.length)) {
      if(fs.existsSync(directory)&&fs.readdirSync(directory).length===0)fs.rmdirSync(directory);
    }
    // Only our named paths are staged. No commit or push occurs inside the migration tool.
    git(plan.output,"add","--",".gitmodules",NEW_MOUNT,...plan.patches.flatMap(patch=>[patch.path,...(patch.remove?[patch.remove]:[])]));
    for(const file of plan.protectedFiles) {
      if(blob(plan.output,plan.base,file)!==fs.readFileSync(path.join(plan.output,file),"utf8").replaceAll("\r\n","\n"))throw new Error(`Protected host file changed: ${file}`);
    }
    record("prepared: validation required");
    return {...plan.journal,status:"prepared: validation required",journal:journalPath};
  } catch(error) {
    record("incomplete",error.message);
    throw new Error(`Migration incomplete in disposable worktree ${plan.output}; source unchanged, base ${plan.base}. ${error.message}`);
  }
}
