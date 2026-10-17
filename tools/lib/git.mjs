import {execFileSync} from "node:child_process";

// Developer-owned Git installation and identity; no privilege transfer. All repository/task
// values are arguments, never shell syntax. Keep raw output for blobs and NUL-delimited names.
// `timeoutMs` is the hang guard of ONE call; the default is for the tools, a caller whose git work ends on its
// own and may meet a loaded machine (a test building a fixture) passes a wider one.
export function gitOutput(repo,args,{timeoutMs=30000}={}) {
  return execFileSync("git",["-C",repo,...args],{encoding:"utf8",timeout:timeoutMs,maxBuffer:4*1024*1024,windowsHide:true,stdio:["ignore","pipe","pipe"]});
}
export function git(repo,...args) {return gitOutput(repo,args).trimEnd();}
