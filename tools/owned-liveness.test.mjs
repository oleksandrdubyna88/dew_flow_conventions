#!/usr/bin/env node
/**
 * The liveness answer of `lib/owned.mjs` (rule §3 of `common/test-leftovers.md`): `processProbe` and `ownerState`.
 *
 * Only "no process has that pid" may make an owner `gone`, and `gone` is what authorises a deletion. So:
 *   - a pid that is not a positive safe integer (0, a negative, a fraction, NaN, a number past 2^53, a string) is
 *     UNKNOWN, never dead — 0 and the negatives address process groups, the rest address nothing at all;
 *   - the answer is a named state (`live` | `dead` | `unknown`), not an `alive` flag whose third value is
 *     `undefined`: that value vanishes from JSON and is one `if (!probe.alive)` away from treating a refusal as death;
 *   - a probe that does not say `state: "dead"` in so many words is never read as dead.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sweepLeftovers, MIN_AGE_MS } from "./lib/leftovers-sweep.mjs";
import { cleanupScope, formatOwner, isAskablePid, ownedDir, ownerState, parseLegacyOwner, parseOwner, processProbe, runRecord, thisOwner } from "./lib/owned.mjs";

const HOUR = 3_600_000;
const BAD_PIDS = [0, -1, -4242, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 60, "4242", null, undefined];
const me = () => thisOwner().host;
/** A record of the owner form for this machine and process (with the pid namespace a Linux reader requires), `extra` overriding fields. */
const rec = (extra = {}) => ({ owner: thisOwner().owner, host: me(), ...(thisOwner().ns === undefined ? {} : { ns: thisOwner().ns }), pid: 4242, ...extra });
const NOT_HIDDEN = { hidepid: false }; // a sandbox may hide other users' processes; that answer has its own test

/** Run `fn` with `process.kill` replaced by one that throws `code`. */
function withKill(code, fn) {
  const original = process.kill;
  process.kill = () => { throw Object.assign(new Error(code), { code }); };
  try { return fn(); } finally { process.kill = original; }
}

function lifo(t) {
  const scope = cleanupScope();
  t.after(() => scope.close());
  return scope;
}

test("1. the real probe: a pid that is not a positive safe integer is unknown, never dead", () => {
  for (const pid of BAD_PIDS) {
    const probe = processProbe(pid);
    assert.equal(probe.state, "unknown", `pid ${String(pid)} → ${JSON.stringify(probe)}`);
  }
});

test("2. the real probe never signals a bad pid (0 and the negatives would reach a process GROUP)", () => {
  const original = process.kill;
  const signalled = [];
  process.kill = (pid) => { signalled.push(pid); throw Object.assign(new Error("ESRCH"), { code: "ESRCH" }); };
  try {
    for (const pid of BAD_PIDS) processProbe(pid);
  } finally {
    process.kill = original;
  }
  assert.deepEqual(signalled, []);
});

test("3. ownerState: an owner whose pid is not a positive safe integer is unknown, even when the probe says dead", () => {
  const asked = [];
  const sayingDead = (pid) => { asked.push(pid); return { state: "dead", alive: false }; };
  for (const pid of BAD_PIDS) {
    assert.equal(ownerState(rec({ pid }), sayingDead, NOT_HIDDEN), "unknown", `pid ${String(pid)}`);
  }
  assert.deepEqual(asked, [], "a bad pid is refused before the probe is asked");
});

test("4. a claim naming pid 0 or a pid past 2^53 parses, and its owner is unknown with the REAL probe", () => {
  for (const text of [`${thisOwner().owner}:${me()}:0\n`, `${thisOwner().owner}:${me()}:00\n`, `${thisOwner().owner}:${me()}:99999999999999999999\n`]) {
    const owner = parseOwner(text);
    assert.equal(owner.unreadable, undefined, `${text.trim()} is a well-formed claim`);
    assert.equal(ownerState(owner), "unknown", text.trim());
  }
});

test("5. the unknown state is visible in JSON: a refused query names 'unknown' (an `undefined` field would vanish)", () => {
  for (const code of ["EPERM", "EACCES", "EIO"]) {
    withKill(code, () => {
      const probe = processProbe(4242);
      assert.match(JSON.stringify(probe), /"state":"unknown"/, `${code}: ${JSON.stringify(probe)}`);
      assert.equal(ownerState(rec()), "unknown", code);
    });
  }
});

test("6. only ESRCH is dead, only success is live", () => {
  withKill("ESRCH", () => assert.equal(processProbe(4242).state, "dead"));
  assert.equal(processProbe(process.pid).state, "live");
  assert.equal(ownerState(thisOwner()), "live");
});

test("7. no field of a probe answer is `undefined` except the Linux-only start", () => {
  for (const probe of [withKill("EPERM", () => processProbe(4242)), withKill("ESRCH", () => processProbe(4242)), processProbe(0)]) {
    for (const [key, value] of Object.entries(probe)) assert.notEqual(value, undefined, `${key} in ${JSON.stringify(probe)}`);
  }
});

test("8. ownerState reads the NAMED state: dead → gone, live → live, unknown → unknown", () => {
  const owner = rec();
  assert.equal(ownerState(owner, () => ({ state: "dead" }), NOT_HIDDEN), "gone");
  assert.equal(ownerState(owner, () => ({ state: "live" })), "live");
  assert.equal(ownerState(owner, () => ({ state: "unknown" })), "unknown");
});

test("9. ownerState never reads a falsy `alive` (or a missing state) as dead", () => {
  const owner = rec();
  for (const answer of [{ alive: false }, { alive: undefined }, { alive: 0 }, {}, { state: undefined }, { state: "gone" }, { state: "DEAD" }, { state: false }, undefined, null]) {
    assert.equal(ownerState(owner, () => answer), "unknown", JSON.stringify(answer));
  }
  assert.equal(ownerState(owner, () => { throw new Error("probe broke"); }), "unknown");
});

test("10. a live answer with a start that disagrees is unknown, with the new shape", () => {
  const owner = rec({ start: 1_000 });
  assert.equal(ownerState(owner, () => ({ state: "live", start: 1_001 })), "live");
  assert.equal(ownerState(owner, () => ({ state: "live", start: 2_000 })), "unknown");
});

test("11. the sweep keeps a dead-looking folder when its probe answers in the old `alive: false` shape, and removes it on `state: dead`", (t) => {
  const own = lifo(t);
  const tmp = ownedDir(own, "liveness-tmp");
  const repo = ownedDir(own, "liveness-repo");
  const claim = (dir) => fs.writeFileSync(`${dir}.owner`, `${formatOwner(rec({ start: 1 }))}\n`);
  const old = (dir) => fs.utimesSync(dir, new Date(Date.now() - HOUR), new Date(Date.now() - HOUR));
  const make = (what) => { const dir = ownedDir(own, what, { parent: tmp }); claim(dir); old(dir); return dir; };

  const kept = make("liveness-kept");
  const result = sweepLeftovers({ repo, tmp, probe: () => ({ alive: false }) });
  assert.ok(fs.existsSync(kept), "a bare `alive: false` is not a death certificate");
  assert.deepEqual(result.removed, []);

  const unknown = sweepLeftovers({ repo, tmp, probe: () => ({ state: "unknown" }) });
  assert.ok(fs.existsSync(kept), "an unknown probe keeps it");
  assert.equal(unknown.preserved.find((entry) => entry.path === kept)?.reason, "unknown");

  const dead = sweepLeftovers({ repo, tmp, probe: () => ({ state: "dead" }) });
  assert.equal(fs.existsSync(kept), false, JSON.stringify(dead));
});

// --- F18: the quarantine pass asks the probe only about a pid that can be asked --------------------------------

/** A quarantine of an owned folder, named as a sweep that died would have left it: `-<pid text>-` is the renamer. Returns `{ original, quarantine }`. */
function quarantined(own, tmp, what, pidText) {
  const original = ownedDir(own, what, { parent: tmp });
  const quarantine = path.join(tmp, `.${path.basename(original)}.teststodelete-quarantine-${pidText}-0a1b2c3d`);
  fs.writeFileSync(path.join(original, "content.txt"), "an empty quarantine is a killed sweep's reservation: removed, not restored\n");
  fs.renameSync(original, quarantine);
  fs.rmSync(`${original}.owner`); // no claim: the orphan-claim pass would ask the probe about the claim's own pid, which is not what this scenario counts
  return { original, quarantine };
}

test("F18a. isAskablePid: canonical digits, 1 to 2^53-1, and on Windows never 1", () => {
  for (const text of ["1", "4242", "9007199254740991"]) assert.equal(isAskablePid(text, "linux"), true, text);
  for (const text of ["0", "007", "01", "-1", "+5", "1.5", "1e3", "", " 1", "1 ", "٣", "9007199254740992", "9007199254740993", "99999999999999999999", 4242, null, undefined]) {
    assert.equal(isAskablePid(text, "linux"), false, String(text));
  }
  assert.equal(isAskablePid("1", "win32"), false, "Windows has no pid 1");
  assert.equal(isAskablePid("2", "win32"), true);
  assert.equal(isAskablePid("1"), process.platform !== "win32", "the default platform is this process's");
});

test("F18. a quarantine named with a pid that cannot be asked (0, a leading zero, past 2^53, Windows pid 1) stays, and the probe is never called; a pid that can be asked is", (t) => {
  const own = lifo(t);
  const tmp = ownedDir(own, "f18-tmp");
  const repo = ownedDir(own, "f18-repo");
  const asked = [];
  const sayingDead = (pid) => { asked.push(pid); return { state: "dead" }; };
  const later = Date.now() + 2 * MIN_AGE_MS; // both stamps of the quarantines are past the window
  const unaskable = [["f18-zero", "0"], ["f18-leading", "007"], ["f18-huge", "9007199254740993"]].map(([what, pid]) => ({ ...quarantined(own, tmp, what, pid), pid }));
  sweepLeftovers({ repo, tmp, probe: sayingDead, now: later }); // `repo` is no repository: the worktree step errors, and the quarantine step is the first
  for (const { original, quarantine, pid } of unaskable) {
    assert.ok(fs.existsSync(quarantine), `-${pid}- stays in quarantine`);
    assert.equal(fs.existsSync(original), false, `-${pid}- is not restored`);
  }
  assert.deepEqual(asked, [], "no probe call for an unaskable pid");

  const windows = quarantined(own, tmp, "f18-win1", "1");
  sweepLeftovers({ repo, tmp, probe: sayingDead, now: later, platform: "win32" });
  assert.ok(fs.existsSync(windows.quarantine), "Windows has no pid 1");
  assert.equal(fs.existsSync(windows.original), false);
  assert.deepEqual(asked, []);
  fs.rmSync(windows.quarantine, { recursive: true }); // pid 1 is askable on a POSIX platform; the next sweep runs there

  const fine = quarantined(own, tmp, "f18-fine", "4242");
  sweepLeftovers({ repo, tmp, probe: sayingDead, now: later });
  assert.equal(fs.existsSync(fine.original), true, "an askable pid whose process is gone is restored as before");
  assert.deepEqual(asked, [4242]);
});

// --- the sweep seam must not change what REPO_ROOT means (finding 22) ----------------------------------------

const here = path.dirname(fileURLToPath(import.meta.url));
const runTestsUrl = pathToFileURL(path.join(here, "run-tests.mjs")).href;

/** What `run-tests.mjs` exports, read in a child whose `RUN_TESTS_REPO_ROOT` is `value` (a child: the constant is read at import). */
function exportsWith(value) {
  const code = `const m = await import(${JSON.stringify(runTestsUrl)}); process.stdout.write(JSON.stringify({ root: m.REPO_ROOT, sweep: m.sweepRepoRoot?.() }));`;
  const out = spawnSync(process.execPath, ["--input-type=module", "-e", code],
    { env: { ...process.env, RUN_TESTS_REPO_ROOT: value }, encoding: "utf8", timeout: 60_000, cwd: here });
  assert.equal(out.status, 0, out.stderr);
  return JSON.parse(out.stdout);
}

test("12. REPO_ROOT is always this checkout; the test seam changes only the sweep's repository", () => {
  const checkout = path.resolve(here, "..");
  const seam = path.join(here, "fixtures");
  assert.deepEqual(exportsWith(""), { root: checkout, sweep: checkout }, "unset: both are this checkout");
  assert.deepEqual(exportsWith(seam), { root: checkout, sweep: seam }, "REPO_ROOT does not follow the environment");
  assert.deepEqual(exportsWith("fixtures"), { root: checkout, sweep: seam }, "a relative seam is resolved against the working directory");
});

test("L-win1. Windows has no pid 1: an owner `<host>@windows:1` is unknown whatever a probe says, and the real probe never calls it dead", () => {
  const dead = () => ({ state: "dead" });
  assert.equal(ownerState(rec({ host: "devbox@windows", pid: 1 }), dead, NOT_HIDDEN), "unknown", "a bash started by a native process reports pid 1; it is no process id there");
  assert.equal(ownerState(rec({ host: "DEVBOX@WINDOWS", pid: 1 }), dead, NOT_HIDDEN), "unknown", "in any case");
  assert.equal(ownerState(rec(), dead, NOT_HIDDEN), "gone", "any other pid is still asked");
  if (process.platform === "win32") assert.equal(processProbe(1).state, "unknown", "process.kill(1, 0) says ESRCH on Windows, which proves nothing");
});

test("L-len. A claim longer than 512 bytes is unreadable, one of exactly 512 is not", () => {
  assert.equal(parseOwner(`u1:${"a".repeat(501)}@linux:1`).unreadable, undefined);
  assert.equal(parseOwner(`u1:${"a".repeat(502)}@linux:1`).unreadable, true);
  assert.equal(parseOwner(`u1:${"a".repeat(501)}@linux:1\n`).unreadable, true, "the line end counts: 513 bytes");
});

test("L-zero. A pid, a start or a namespace written with a leading zero is a record the grammar reads and liveness never trusts: unknown, never asked, never gone", () => {
  const asked = [];
  const dead = (pid) => { asked.push(pid); return { state: "dead" }; }; // a probe that would say "no such process" for anything it is asked
  const here = thisOwner();
  const ns = here.ns === undefined ? "" : `:${here.ns}`;
  const text = (pid, start = "1792053744", namespace = ns.slice(1)) => `${here.owner}:${here.host}:${pid}:${start}${namespace === "" ? "" : `:${namespace}`}\n`;
  for (const pid of ["007", "00", "0123"]) {
    const parsed = parseOwner(text(pid));
    assert.equal(parsed.unreadable, undefined, `${pid}: the grammar still reads it (vector r-g11)`);
    assert.equal(ownerState(parsed, dead, NOT_HIDDEN), "unknown", `pid ${pid}`);
  }
  assert.equal(ownerState(parseOwner(text("4242", "01792053744")), dead, NOT_HIDDEN), "unknown", "a start");
  if (here.ns !== undefined) assert.equal(ownerState(parseOwner(text("4242", "1792053744", `0${here.ns}`)), dead, NOT_HIDDEN), "unknown", "a namespace: 04242 is not 4242 (the janitor compares the text)");
  const canonical = parseOwner(text("4242", "1792053744"));
  assert.equal(ownerState(canonical, dead, NOT_HIDDEN), "gone", "the same record written canonically is still asked and still gone");
  assert.equal(parseOwner(`${here.owner}:${here.host}:0\n`).unreadable, undefined, "a lone 0 is canonical digit text (it is no process id, which is isProcessId's answer)");
  assert.equal(ownerState(parseOwner(`${here.owner}:${here.host}:0\n`), dead, NOT_HIDDEN), "unknown");
  assert.deepEqual(asked, [4242], "only the canonical record's pid was ever asked of the OS");
});

test("L-zero. A leading zero in a legacy record is non-canonical too, and the run record refuses it", () => {
  const legacy = parseLegacyOwner("h@linux:007");
  assert.equal(legacy.unreadable, undefined);
  assert.equal(legacy.nonCanonical, true);
  assert.equal(parseLegacyOwner("h@linux:7:01").nonCanonical, true);
  assert.equal(parseLegacyOwner("h@linux:7:1").nonCanonical, undefined);
  assert.equal(parseOwner("u1:h@linux:7:1:2").nonCanonical, undefined, "a canonical record carries no flag");
  const here = thisOwner();
  const stderr = [];
  const write = process.stderr.write;
  process.stderr.write = (chunk) => { stderr.push(String(chunk)); return true; };
  try {
    assert.deepEqual(runRecord({ TESTSTODELETE_RUN: `${here.owner}:${here.host}:007` }), here, "a run record with a leading zero is ignored, this process's own is used");
  } finally {
    process.stderr.write = write;
  }
  assert.match(stderr.join(""), /TESTSTODELETE_RUN/);
});
