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

test("3. the real probe answers `gone` for such a pid, three-valued: alive is false, not undefined", () => {
  for (const i of SAMPLE) {
    const pid = unmatchablePid(i);
    assert.deepEqual(processProbe(pid), { alive: false }, `pid ${pid}`);
    assert.equal(ownerState({ host: thisOwner().host, pid }), "gone", `pid ${pid}`);
  }
});

test("4. the premise check has teeth: a live process is refused", () => {
  assert.throws(() => assertNoSuchProcess(process.pid), assert.AssertionError);
});
