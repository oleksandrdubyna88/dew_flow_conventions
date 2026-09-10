import {execFileSync} from "node:child_process";

// Developer-owned Git installation and identity; no privilege transfer. All repository/task
// values are arguments, never shell syntax. Keep raw output for blobs and NUL-delimited names.
export function gitOutput(repo,args) {
  return execFileSync("git",["-C",repo,...args],{encoding:"utf8",timeout:30000,maxBuffer:4*1024*1024,windowsHide:true,stdio:["ignore","pipe","pipe"]});
}
export function git(repo,...args) {return gitOutput(repo,args).trimEnd();}
