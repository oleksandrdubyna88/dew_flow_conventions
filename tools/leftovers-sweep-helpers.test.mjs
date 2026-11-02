#!/usr/bin/env node
/**
 * The identity and exclusive-move helpers of `lib/leftovers-sweep.mjs` as a CONSUMER uses them (F21): exported, and
 * widened with a last `{ io, platform }` argument so a consumer's failure tests need no copy of them.
 *
 * Every scenario works inside one owned folder. `io` is the real `fs` with the one call a test watches replaced, so a
 * call that does NOT go through `io` is a call the test can see happen on the real disk, or not be counted.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fsDefault from "node:fs";
import * as fs from "node:fs";
import * as path from "node:path";

import * as sweep from "./lib/leftovers-sweep.mjs";
import { cleanupScope, ownedDir } from "./lib/owned.mjs";

const HELPERS = ["identityOf", "isOwnEmptyPlaceholder", "removeOwnEmptyPlaceholder", "moveExclusively", "moveToQuarantine"];

/** An owned folder for the test, removed when it ends. */
function arena(t) {
  const scope = cleanupScope();
  t.after(() => scope.close());
  return ownedDir(scope, "sweep-helpers");
}

/** `fs` with `overrides` on top, and the name of every call to a replaced or watched method, in order. */
function ioWith(overrides = {}, watched = []) {
  const calls = [];
  const io = { ...fs };
  for (const name of watched) io[name] = (...args) => { calls.push(name); return fs[name](...args); };
  for (const [name, replacement] of Object.entries(overrides)) io[name] = (...args) => { calls.push(name); return replacement(...args); };
  return { io, calls };
}

const failing = (code) => () => { throw Object.assign(new Error(code), { code }); };

test("F21 a. the five helpers are exported", () => {
  for (const name of HELPERS) assert.equal(typeof sweep[name], "function", `${name} is exported`);
});

test("F21 b. identityOf reads through io: a folder, a missing name, a throwing lstat", (t) => {
  const dir = arena(t);
  const { io, calls } = ioWith({}, ["lstatSync"]);

  assert.equal(sweep.identityOf(dir, { io })?.directory, true);
  assert.deepEqual(calls, ["lstatSync"], "the one lstat went through io");
  assert.equal(sweep.identityOf(path.join(dir, "missing"), { io }), undefined);
  assert.equal(sweep.identityOf(dir, { io: ioWith({ lstatSync: failing("EIO") }).io }), undefined, "a throwing io.lstatSync is `not there`");
  assert.equal(sweep.identityOf(dir)?.directory, true, "no options: the real fs");
});

test("F21 c. isOwnEmptyPlaceholder: ours and empty only, and the listing goes through io", (t) => {
  const dir = arena(t);
  const placeholder = path.join(dir, "placeholder");
  fs.mkdirSync(placeholder);
  const reserved = sweep.identityOf(placeholder);
  const { io, calls } = ioWith({}, ["readdirSync"]);

  assert.equal(sweep.isOwnEmptyPlaceholder(placeholder, reserved, { io }), true);
  assert.deepEqual(calls, ["readdirSync"]);
  fs.writeFileSync(path.join(placeholder, "theirs.txt"), "put there since\n");
  assert.equal(sweep.isOwnEmptyPlaceholder(placeholder, reserved, { io }), false, "a placeholder with content is not ours to remove");
  assert.equal(sweep.isOwnEmptyPlaceholder(placeholder, { ...reserved, ino: reserved.ino + 1n }, { io }), false, "another inode is not the reservation");
  assert.equal(sweep.isOwnEmptyPlaceholder(placeholder, reserved, { io: ioWith({ readdirSync: failing("EACCES") }).io }), false, "an unreadable one is not empty");
});

test("F21 d. removeOwnEmptyPlaceholder calls io.rmdirSync only for our empty reservation", (t) => {
  const dir = arena(t);
  const placeholder = path.join(dir, "placeholder");
  fs.mkdirSync(placeholder);
  const reserved = sweep.identityOf(placeholder);
  const { io, calls } = ioWith({}, ["rmdirSync"]);

  fs.writeFileSync(path.join(placeholder, "theirs.txt"), "put there since\n");
  sweep.removeOwnEmptyPlaceholder(placeholder, reserved, { io });
  assert.deepEqual(calls, [], "content: rmdir is never asked");
  fs.rmSync(path.join(placeholder, "theirs.txt"));
  sweep.removeOwnEmptyPlaceholder(placeholder, { ...reserved, ino: reserved.ino + 1n }, { io });
  assert.deepEqual(calls, [], "another identity: rmdir is never asked");
  assert.ok(fs.existsSync(placeholder));

  const blind = ioWith({ lstatSync: failing("EIO") }, ["rmdirSync"]);
  sweep.removeOwnEmptyPlaceholder(placeholder, reserved, { io: blind.io });
  assert.deepEqual(blind.calls, ["lstatSync"], "an io that cannot read the identity is the one the check uses: rmdir is never asked");
  assert.ok(fs.existsSync(placeholder));

  sweep.removeOwnEmptyPlaceholder(placeholder, reserved, { io });
  assert.deepEqual(calls, ["rmdirSync"], "ours and empty: rmdir asked once");
  assert.equal(fs.existsSync(placeholder), false);
  assert.doesNotThrow(() => sweep.removeOwnEmptyPlaceholder(placeholder, reserved, { io: ioWith({ rmdirSync: failing("EBUSY") }).io }), "a failing rmdir never throws");
});

test("F21 e. a throwing io.renameSync reaches moveExclusively's failure path: thrown, and the placeholder removed through io", (t) => {
  const dir = arena(t);
  const from = path.join(dir, "from");
  const to = path.join(dir, "to");
  fs.mkdirSync(from);
  const { io, calls } = ioWith({ renameSync: failing("EIO") }, ["rmdirSync"]);

  assert.throws(() => sweep.moveExclusively(from, to, {}, { io }), { code: "EIO" });
  assert.deepEqual(calls, ["renameSync", "rmdirSync"], "the rename was asked through io, then our empty reservation removed through io");
  assert.equal(fs.existsSync(to), false, "the reservation is gone");
  assert.ok(fs.existsSync(from), "and the source stays");
});

test("F21 f. a taken name answers false through io and the hooks keep their place before the options", (t) => {
  const dir = arena(t);
  const from = path.join(dir, "from");
  const to = path.join(dir, "to");
  fs.mkdirSync(from);
  const seen = [];
  const hooks = { afterReserve: () => seen.push("afterReserve"), beforeRename: () => seen.push("beforeRename") };

  assert.equal(sweep.moveExclusively(from, to, hooks, { io: ioWith({ renameSync: failing("ENOTEMPTY") }).io }), false);
  assert.deepEqual(seen, ["afterReserve", "beforeRename"]);
  assert.equal(sweep.moveExclusively(from, from, {}, { io: ioWith({ mkdirSync: failing("EEXIST") }).io }), false, "an occupied name refuses the reservation");
  assert.equal(sweep.moveExclusively(from, to), true, "no options: the real fs moves it");
  assert.ok(fs.existsSync(to));
});

test("F21 g. moveToQuarantine hands its io to the inner helpers (gate finding 0)", (t) => {
  const dir = arena(t);
  const target = path.join(dir, "folder");
  fs.mkdirSync(target);
  const moves = [];
  const { io, calls } = ioWith({ renameSync: (from, to) => { moves.push([from, to]); } }, ["mkdirSync", "lstatSync", "readdirSync", "rmdirSync"]);

  const quarantine = sweep.moveToQuarantine(target, {}, { io });

  assert.deepEqual(moves, [[target, quarantine]], "the rename it asked of io is the one it reports");
  assert.ok(calls.includes("mkdirSync"), "moveExclusively reserved through io");
  assert.ok(calls.includes("lstatSync"), "identityOf, two calls down, read through io");
  assert.ok(calls.includes("readdirSync"), "isOwnEmptyPlaceholder checked through io");
  assert.ok(fs.existsSync(target), "the mocked rename moved nothing");
  assert.ok(fs.existsSync(quarantine), "and the reservation is still there: io.renameSync did not move onto it");
});

test("F21 h. moveToQuarantine with every draw taken: the placeholders are removed through io, then it throws", (t) => {
  const dir = arena(t);
  const target = path.join(dir, "folder");
  fs.mkdirSync(target);
  const { io, calls } = ioWith({ renameSync: failing("ENOTEMPTY") }, ["rmdirSync"]);

  assert.throws(() => sweep.moveToQuarantine(target, {}, { io }), /no free name/);
  assert.equal(calls.filter((name) => name === "rmdirSync").length, 5, "one removed placeholder per draw, each through io");
  assert.deepEqual(fs.readdirSync(dir), ["folder"], "nothing else is left");
});

test("F21 i. platform win32 takes the Windows branch on Linux: no reservation, one rename through io", (t) => {
  const dir = arena(t);
  const from = path.join(dir, "from");
  const to = path.join(dir, "to");
  fs.mkdirSync(from);
  const { io, calls } = ioWith({}, ["mkdirSync", "renameSync"]);

  assert.equal(sweep.moveExclusively(from, to, {}, { io, platform: "win32" }), true);
  assert.deepEqual(calls, ["renameSync"], "no placeholder was made");
  assert.ok(fs.existsSync(to));
});

test("F21 j. the taken path on win32 goes through isTakenRename with the platform string (gate finding 1)", (t) => {
  const dir = arena(t);
  const from = path.join(dir, "from");
  const occupied = path.join(dir, "occupied");
  fs.mkdirSync(from);
  fs.mkdirSync(occupied);
  const win32 = (code) => ({ io: ioWith({ renameSync: failing(code) }).io, platform: "win32" });

  for (const code of ["EPERM", "EACCES"]) {
    assert.equal(sweep.moveExclusively(from, occupied, {}, win32(code)), false, `${code} with something at the target is a taken name on win32`);
    assert.throws(() => sweep.moveExclusively(from, path.join(dir, "absent"), {}, win32(code)), { code }, `${code} with nothing at the target is thrown`);
  }
  assert.throws(() => sweep.moveExclusively(from, path.join(dir, "absent"), {}, { io: ioWith({ renameSync: failing("EPERM") }).io, platform: "linux" }), { code: "EPERM" },
    "the same failure on linux is a permission, not a taken name");
  assert.equal(sweep.moveExclusively(from, occupied, {}, win32("ENOTEMPTY")), false);
  assert.ok(fs.existsSync(from), "the source was never touched");
});

test("F21 k. moveToQuarantine on win32 forwards the platform: a taken draw there is a new name, not a throw", (t) => {
  const dir = arena(t);
  const target = path.join(dir, "folder");
  fs.mkdirSync(target);
  const attempts = [];
  const { io } = ioWith({ renameSync: (from, to) => { attempts.push(to); if (attempts.length === 1) { fs.mkdirSync(to); throw Object.assign(new Error("EPERM"), { code: "EPERM" }); } } });

  const quarantine = sweep.moveToQuarantine(target, {}, { io, platform: "win32" });

  assert.equal(attempts.length, 2, "EPERM with the name occupied was taken, so a second name was drawn");
  assert.equal(quarantine, attempts[1]);
});

for (const [label, realIo] of [["the fs namespace", fs], ["fs's default export", fsDefault], ["no io at all", undefined]]) {
  test(`F21 l (code gate 0). platform win32 with the REAL fs (${label}) on POSIX throws before any rename: the empty destination and the source survive`, (t) => {
    if (process.platform === "win32") return t.skip("the real platform is win32: the Windows branch is the real one");
    const dir = arena(t);
    const from = path.join(dir, "from");
    const to = path.join(dir, "to");
    fs.mkdirSync(from);
    fs.writeFileSync(path.join(from, "keep.txt"), "kept\n");
    fs.mkdirSync(to); // rename(2) would replace this empty directory
    const options = realIo === undefined ? { platform: "win32" } : { io: realIo, platform: "win32" };

    assert.throws(() => sweep.moveExclusively(from, to, {}, options), /win32.*real fs|real fs.*win32/s);
    assert.throws(() => sweep.moveToQuarantine(from, {}, options), /win32.*real fs|real fs.*win32/s, "and through moveToQuarantine");
    assert.deepEqual(fs.readdirSync(from), ["keep.txt"], "the source was not moved");
    assert.deepEqual(fs.readdirSync(to), [], "the empty destination was not replaced");
    assert.deepEqual(fs.readdirSync(dir).sort(), ["from", "to"], "nothing else was made");
  });
}
