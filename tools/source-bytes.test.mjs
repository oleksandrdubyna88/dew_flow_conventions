import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {spawnSync} from "node:child_process";

// A source file never carries a raw control byte: a literal NUL typed into rule-smoke.mjs made a consumer's CI
// treat the file as binary. Write the escape ("\u0000"), never the byte. \t \n \r are the only allowed controls.
const BINARY=/\.(png|jpe?g|gif|ico|webp|woff2?|ttf|otf|eot|zip|gz|tgz|pdf|wasm|exe|dll)$/i;
const isControl=c=>(c<0x09)||c===0x0b||c===0x0c||(c>=0x0e&&c<=0x1f)||c===0x7f;

const trackedFiles=()=>{
  const ls=spawnSync("git",["ls-files","-z"],{encoding:"buffer",maxBuffer:64*1024*1024});
  assert.equal(ls.status,0,"git ls-files failed");
  return ls.stdout.toString("utf8").split("\0").filter(f=>f&&!BINARY.test(f));
};

const findings=file=>{
  let bytes;
  try { bytes=fs.readFileSync(file); } catch { return []; }
  const hits=[];
  bytes.forEach((c,i)=>{ if(isControl(c)) hits.push(`${file}: byte 0x${c.toString(16).padStart(2,"0")} at offset ${i}`); });
  return hits;
};

test("no tracked text source file carries a raw control byte",()=>{
  const hits=trackedFiles().flatMap(findings);
  assert.deepEqual(hits,[],`raw control bytes in source — write the escape instead:\n${hits.join("\n")}`);
});
