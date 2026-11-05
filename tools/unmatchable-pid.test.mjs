#!/usr/bin/env node
/**
 * `lib/unmatchable-pid.mjs` — the pid a test uses for a DEAD owner. A test that takes "dead" from a killed child's pid
 * relies on the OS not handing that number to the next process; this is the pid that needs no such luck, and these
 * tests are what make "no process can have it" something the suite checks rather than something it hopes.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { ownerState, processProbe, thisOwner } from "./lib/owned.mjs";
import { assertNoSuchProcess, pidMax, unmatchablePid } from "./lib/unmatchable-pid.mjs";

const win32 = process.platform === "win32";
const linux = process.platform === "linux";
const SAMPLE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

test("1. the premise holds for every pid the helper hands out, and they are all different", () => {
  const pids = SAMPLE.map((i) => unmatchablePid(i));
  for (const pid of pids) assertNoSuchProcess(pid);
  assert.equal(new Set(pids).size, pids.length);
  assert.equal(unmatchablePid(), unmatchablePid(0), "the default is the first");
});

test("2. each platform's shape: Windows ≡ 2 mod 4, Linux above pid_max, macOS 100000", () => {
  if (win32) for (const i of SAMPLE) assert.equal(unmatchablePid(i) % 4, 2, `pid ${unmatchablePid(i)}`);
  else if (linux) for (const i of SAMPLE) assert.ok(unmatchablePid(i) > pidMax(), `pid ${unmatchablePid(i)} against pid_max ${pidMax()}`);
  else assert.equal(unmatchablePid(), 100_000);
});

test("3. the real probe answers `gone` for such a pid, three-named: the state is `dead`, not an absent flag", () => {
  for (const i of SAMPLE) {
    const pid = unmatchablePid(i);
    assert.deepEqual(processProbe(pid), { state: "dead" }, `pid ${pid}`);
    assert.equal(ownerState({ owner: thisOwner().owner, host: thisOwner().host, ...(thisOwner().ns === undefined ? {} : { ns: thisOwner().ns }), pid }, processProbe, { hidepid: false }), "gone", `pid ${pid}`);
  }
});

test("4. the premise check has teeth: a live process is refused", () => {
  assert.throws(() => assertNoSuchProcess(process.pid), assert.AssertionError);
});

test("5. Windows: a pid ≡ 2 (mod 4) that OpenProcess would round down to a LIVE process is refused too", (t) => {
  if (!win32) {
    t.skip("OpenProcess rounds a pid down only on Windows");
    return;
  }
  const rounded = process.pid + 2; // this process's pid is a multiple of 4; +2 is ≡ 2 (mod 4) and answers like this process
  assert.equal(rounded % 4, 2);
  assert.throws(() => assertNoSuchProcess(rounded), assert.AssertionError, "the shape alone would have passed it");
});
