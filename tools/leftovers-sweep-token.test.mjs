#!/usr/bin/env node
/**
 * The reference sweep takes the consumer's token (F22): `sweepLeftovers({ token })` replaces this repository's own token in
 * the name relation — owner-form and legacy names alike — so a consumer that wraps the reference sweeps its OWN folders.
 *
 * One private root holds a dead-claimed `creds` folder and a dead-claimed `conventions` folder (the two repositories' tokens).
 * Every sweep here runs through the `probe` seam, which is told that `PRETEND_DEAD` is gone.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

import { git } from "./lib/git.mjs";
import { sweepLeftovers } from "./lib/leftovers-sweep.mjs";
import { cleanupScope, ownedDir, ownedFor, processProbe, thisOwner, thisOwnerToken } from "./lib/owned.mjs";

const HOUR = 3_600_000;
const PRETEND_DEAD = 4242;
const deadProbe = (pid) => (pid === PRETEND_DEAD ? { state: "dead" } : processProbe(pid));
const nsPart = thisOwner().ns === undefined ? "" : `:1:${thisOwner().ns}`; // a Linux record carries its start and pid namespace
const deadOwnerLine = () => `${thisOwnerToken()}:${thisOwner().host}:${PRETEND_DEAD}${nsPart}\n`;
const creds = ownedFor({ token: "creds", row: "dew_flow_creds_for_devs" });
const namesOf = (paths) => paths.map((p) => path.basename(p)).sort();

/** A private temp root (`tmp`) and a repository (`repo`) for the sweep, both removed when the test ends. */
function arena(t) {
  const scope = cleanupScope();
  t.after(() => scope.close());
  const work = ownedDir(scope, "token-work");
  const tmp = ownedDir(scope, "token-tmp");
  const repo = ownedDir(scope, "token-repo", { parent: work });
  git(repo, "init", "-q");
  git(repo, "-c", "user.name=Token test", "-c", "user.email=token@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-qm", "fixture");
  return { scope, tmp, repo };
}

function setOld(target) {
  const when = new Date(Date.now() - HOUR);
  fs.utimesSync(target, when, when);
}

/** An owner-form folder of `helper`'s token in `tmp`, claimed by a process that is gone, and old enough. */
function deadFolder(scope, helper, tmp, what) {
  const dir = helper.ownedDir(scope, what, { parent: tmp });
  fs.writeFileSync(`${dir}.owner`, deadOwnerLine());
  setOld(dir);
  return dir;
}

/** A legacy-form folder (before the owner segment) of `token`, spelled in two pieces so the guard does not read it as a built name. */
function legacyFolder(tmp, token, what) {
  const dir = path.join(tmp, `${"testsTo" + "Delete"}-${token}-${what}-abc123`);
  fs.mkdirSync(dir);
  fs.writeFileSync(`${dir}.owner`, `${thisOwner().host}:${PRETEND_DEAD}\n`);
  setOld(dir);
  return dir;
}

const conventions = { ownedDir };

test("F22 a. token: \"creds\" removes the dead creds folder and keeps the dead conventions one", (t) => {
  const { scope, tmp, repo } = arena(t);
  const ours = deadFolder(scope, creds, tmp, "f22a-creds");
  const other = deadFolder(scope, conventions, tmp, "f22a-conventions");

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, token: "creds" });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([ours]), "only the consumer's folder is collected");
  assert.equal(fs.existsSync(ours), false);
  assert.ok(fs.existsSync(other) && fs.existsSync(`${other}.owner`), "this repository's folder is not the consumer's business");
  assert.deepEqual(result.preserved, [], "the other token's folder is not judged at all");
});

test("F22 b. companion: with no token the sweep removes only the conventions folder, as before", (t) => {
  const { scope, tmp, repo } = arena(t);
  const foreign = deadFolder(scope, creds, tmp, "f22b-creds");
  const mine = deadFolder(scope, conventions, tmp, "f22b-conventions");

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([mine]));
  assert.ok(fs.existsSync(foreign) && fs.existsSync(`${foreign}.owner`));
  assert.deepEqual(result.preserved, []);
});

test("F22 c. a creds legacy name is `legacy:` under token \"creds\" and not ours under the default", (t) => {
  const { tmp, repo } = arena(t);
  const dir = legacyFolder(tmp, "creds", "f22c");
  const legacyLines = (result) => result.listed.filter((line) => line.startsWith("legacy:"));

  const asCreds = sweepLeftovers({ repo, tmp, probe: deadProbe, token: "creds", platform: "linux" }); // a Linux reader keeps every legacy record
  assert.deepEqual(asCreds.errors, []);
  assert.equal(legacyLines(asCreds).length, 1);
  assert.ok(legacyLines(asCreds)[0].includes(path.basename(dir)) && legacyLines(asCreds)[0].includes(" — remove with: "), JSON.stringify(asCreds.listed));
  assert.deepEqual(asCreds.preserved.map((p) => [path.basename(p.path), p.reason]), [[path.basename(dir), "legacy"]]);

  const asDefault = sweepLeftovers({ repo, tmp, probe: deadProbe, platform: "linux" });
  assert.deepEqual(asDefault.errors, []);
  assert.deepEqual(legacyLines(asDefault), [], "another repository's legacy name is not listed");
  assert.deepEqual(asDefault.preserved, []);
  assert.ok(fs.existsSync(dir) && fs.existsSync(`${dir}.owner`), "and never touched");
});

test("F22 d. an invalid token throws before anything is read", (t) => {
  const { scope, tmp, repo } = arena(t);
  const dead = deadFolder(scope, creds, tmp, "f22d-creds");
  const asked = [];
  const spy = (name, fn) => (...args) => { asked.push(name); return fn(...args); };
  const seams = { probe: spy("probe", deadProbe), mine: spy("mine", () => true), hooks: { afterCapture: () => asked.push("hook") } };

  for (const token of ["", "C", "Creds", "u1000", "w42", "has space", "x", "waytoolongtokenvalue", 42, null]) {
    assert.throws(() => sweepLeftovers({ repo, tmp, ...seams, token }), TypeError, `token ${JSON.stringify(token)}`);
  }
  assert.throws(() => sweepLeftovers({ repo: path.join(tmp, "no-such-repo"), tmp: path.join(tmp, "no-such-root"), ...seams, token: "UPPER" }), /token/, "a missing root and repo: the token is judged first");
  assert.deepEqual(asked, [], "no probe, no kernel-owner question, no hook");
  assert.ok(fs.existsSync(dead) && fs.existsSync(`${dead}.owner`), "nothing was changed");
});

test("F22 e. on win32, token \"creds\" lists the creds folder as `unverified:` and leaves it untouched (F16)", (t) => {
  const { scope, tmp, repo } = arena(t);
  const ours = deadFolder(scope, creds, tmp, "f22e-creds");
  const other = deadFolder(scope, conventions, tmp, "f22e-conventions");

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, token: "creds", platform: "win32" });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.listed.filter((line) => line.startsWith("unverified: ")), [`unverified: ${ours} — the owner SID is not read on Windows (F16)`]);
  for (const kept of [ours, other]) assert.ok(fs.existsSync(kept) && fs.existsSync(`${kept}.owner`), `${kept} must be untouched`);
});
