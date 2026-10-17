// A pid that no process can have — what a test uses when it needs a DEAD owner.
//
// Never the pid of a child that was started, killed and awaited. The operating system hands that number to the next
// process: Windows reuses pids within seconds (measured 2026-10-15: `conhost.exe` took one mid-suite and a janitor
// test read its dead owner as live, 1 run in 15 under churn), and a test that goes red once in fifteen runs is a test
// nobody trusts. A pid the query can never match is dead for the whole run, so the premise is checkable instead of
// hoped for: `assertNoSuchProcess` is called before and after the code under test runs.
//
//   Windows  a pid ≡ 2 (mod 4) — Windows pids are multiples of 4, so none of these is ever in a process list
//   Linux    `pid_max + 1`, read from /proc/sys/kernel/pid_max — the kernel never hands out a larger one
//   macOS    100000 — its pids stop below that
//
// For a test that goes through a seam rather than through the OS (`ownerState(owner, probe)`), no pid is needed at
// all: inject `() => ({ state: "dead" })`.

import * as fs from "node:fs";
import assert from "node:assert/strict";

const win32 = process.platform === "win32";
const linux = process.platform === "linux";
const LARGEST_PID_MAX = 4_194_304; // the most any Linux allows, when /proc says nothing

/** `/proc/sys/kernel/pid_max`, or the largest value any Linux allows when it cannot be read. */
export function pidMax() {
  try {
    return Number(fs.readFileSync("/proc/sys/kernel/pid_max", "utf8").trim());
  } catch {
    return LARGEST_PID_MAX;
  }
}

const BASE = win32 ? 777_770 : linux ? pidMax() + 1 : 100_000; // 777770 mod 4 = 2

/** The `i`-th pid that cannot exist: consecutive ones stay unmatchable (Windows steps by 4 to keep ≡ 2 mod 4). */
export function unmatchablePid(i = 0) {
  return BASE + (win32 ? 4 * i : i);
}

/** Assert the premise: nothing on this machine has `pid`, and nothing could be given it. */
export function assertNoSuchProcess(pid) {
  if (win32) {
    assert.equal(pid % 4, 2, `pid ${pid} is not ≡ 2 (mod 4): Windows could hand it out`);
  } else if (linux) {
    assert.ok(pid > pidMax() && !fs.existsSync(`/proc/${pid}`), `pid ${pid} is within pid_max or alive`);
  } else {
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" }, `pid ${pid} is alive`);
  }
}
