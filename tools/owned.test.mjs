#!/usr/bin/env node
/**
 * `lib/owned.mjs`'s own tests (rule §1–§3 of `common/test-leftovers.md`, E1 S2).
 *
 * The scratch of these tests follows the rule it tests: every folder is made by `ownedDir`/`ownedWorktree`,
 * is registered for removal on the next statement, and carries its claim. A scenario that must observe the
 * unwind itself (5, 6, 7) uses a scope of its own and checks the result by name.
 *
 * Where a scenario counts what a creation left behind it gives the helper a PRIVATE `parent`: the shared temp
 * root is written by other test files at the same moment, so a count there would flake.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import cryptoDefault from "node:crypto";
import fsDefault from "node:fs";
import * as fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import * as path from "node:path";
import { once } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { git, gitOutput } from "./lib/git.mjs";
import { assertNoSuchProcess, unmatchablePid } from "./lib/unmatchable-pid.mjs";
import {
  MAX_NAME, OWNER_GRAMMAR, PREFIX, REPO_TOKEN, START_TOLERANCE_S,
  asciiLower, classifyName, cleanupScope, formatLegacyOwner, formatOwner, gitdirOf, isMine, ownedDir, ownedName, ownedPattern,
  ownedWorktree, ownerState, ownerToken, parseLegacyOwner, parseOwner, processProbe, readOwner, removeLink, removeQuietly, runRecord,
  isInsideProfile, legacyOwnerState, startFromProcStat, tempRoot, thisOwner, thisOwnerToken, windowsOwnerToken,
} from "./lib/owned.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const moduleUrl = pathToFileURL(path.join(here, "lib", "owned.mjs")).href;
const win32 = process.platform === "win32";
const linux = process.platform === "linux";
const PLACEHOLDER_COMMIT = ["-c", "user.name=Owned test", "-c", "user.email=owned@example.invalid", "-c", "commit.gpgsign=false",
  "commit", "--allow-empty", "-qm", "fixture"];

const real = (p) => fs.realpathSync.native(p);
const same = (a, b) => real(a).toLowerCase() === real(b).toLowerCase();
const ownedEntriesOf = (dir) => fs.readdirSync(dir).filter((name) => ownedPattern().test(name));
const OWNER = thisOwnerToken();
const PREFIX_OF = `testsToDelete-${OWNER}-conventions-`;
const VECTORS = JSON.parse(fs.readFileSync(path.join(here, "fixtures", "owner-vectors.json"), "utf8"));
/** A record of the owner form for THIS machine and process: what a live claim of this run holds, with `extra` overriding fields. */
const record = (extra = {}) => ({ owner: OWNER, host: thisOwner().host, ...(thisOwner().ns === undefined ? {} : { ns: thisOwner().ns }), pid: 4242, ...extra });

/** A repository rooted at an owned folder, with one commit so worktrees have a ref. */
function ownedRepo(scope, what, options) {
  const repo = ownedDir(scope, what, options);
  git(repo, "init", "-q");
  git(repo, ...PLACEHOLDER_COMMIT);
  return repo;
}

/** What `process.stderr.write` received while `fn` ran. */
async function stderrOf(fn) {
  const chunks = [];
  const original = process.stderr.write;
  process.stderr.write = (chunk) => { chunks.push(String(chunk)); return true; };
  try { await fn(); } finally { process.stderr.write = original; }
  return chunks.join("").split("\n").filter(Boolean);
}

/** A cleanup scope tied to the test: its callbacks run last-registered-first (node:test's own `t.after` runs first-registered-first). */
function lifo(t) {
  const scope = cleanupScope();
  t.after(() => scope.close());
  return scope;
}

/** A child that holds `cwd` as its working directory — on Windows that keeps the folder from being removed. */
async function holdFolder(cwd) {
  const child = spawn(process.execPath, ["-e", "process.stdout.write('ready'); setTimeout(() => {}, 60000)"], { cwd, stdio: ["ignore", "pipe", "ignore"] });
  await once(child.stdout, "data");
  return child;
}

function killChild(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) { resolve(); return; }
    child.once("exit", () => resolve());
    child.kill();
  });
}

// 1 ---------------------------------------------------------------------------------------------------------

test("1. ownedName is the prefix, the caller's owner, the repo token, what and six random characters", () => {
  assert.equal(PREFIX, "testsToDelete-");
  assert.equal(REPO_TOKEN, "conventions");
  assert.match(OWNER, OWNER_GRAMMAR);
  const a = ownedName("pg");
  assert.ok(a.startsWith(`${PREFIX_OF}pg-`), a);
  assert.match(a, /^testsToDelete-[uw][0-9]{1,10}-conventions-pg-[A-Za-z0-9]{6}$/);
  assert.notEqual(a, ownedName("pg"));
  assert.ok(ownedName("a-b ").startsWith(`${PREFIX_OF}a-b -`));
});

// 2 ---------------------------------------------------------------------------------------------------------

test("2. ownedDir makes a prefixed folder in the temp root and a sibling claim that parses to this process", (t) => {
  const dir = ownedDir(t, "rules ü пробел");
  assert.ok(fs.statSync(dir).isDirectory());
  assert.equal(path.dirname(path.resolve(dir)).toLowerCase(), path.resolve(tempRoot()).toLowerCase());
  assert.ok(path.basename(dir).startsWith(`${PREFIX_OF}rules ü пробел-`));
  const sibling = `${dir}.owner`;
  assert.ok(fs.statSync(sibling).isFile());
  assert.deepEqual(parseOwner(fs.readFileSync(sibling, "utf8")), thisOwner());
  assert.deepEqual(fs.readdirSync(dir), [], "nothing is ever written inside the folder");
});

// 3 ---------------------------------------------------------------------------------------------------------

test("3. a bad `what` throws TypeError before anything is created", (t) => {
  const own = lifo(t);
  const parent = ownedDir(own, "bad-what-parent");
  const before = ownedEntriesOf(parent);
  const room = MAX_NAME - PREFIX_OF.length - 1 - 6; // the owner is budgeted before `what`
  for (const what of ["", "a/b", "a\\b", "-x", "a\u0001b", "a\u007fb", "x".repeat(room + 1), 7, undefined, "a\0b"]) {
    assert.throws(() => ownedDir(own, what, { parent }), TypeError, JSON.stringify(what));
    assert.throws(() => ownedName(what), TypeError, JSON.stringify(what));
  }
  assert.deepEqual(ownedEntriesOf(parent), before);
  assert.equal(ownedName("x".repeat(room)).length, MAX_NAME, `${room} is the longest \`what\` under ${OWNER}`);
});

// 4 ---------------------------------------------------------------------------------------------------------

test("4. a scope without `after` throws TypeError and creates nothing", (t) => {
  const own = lifo(t);
  const parent = ownedDir(own, "bad-scope-parent");
  for (const scope of [{}, null, undefined, { after: 1 }, "t"]) {
    assert.throws(() => ownedDir(scope, "x", { parent }), TypeError);
    assert.throws(() => ownedWorktree(scope, parent, "x", { parent }), TypeError);
  }
  assert.deepEqual(fs.readdirSync(parent), []);
});

// 5 ---------------------------------------------------------------------------------------------------------

test("5. unwind, in-process: a throw after creation still removes the folder and its claim", async (t) => {
  const own = lifo(t);
  const parent = ownedDir(own, "unwind-parent");
  const s = cleanupScope();
  let dir = "";
  try {
    dir = ownedDir(s, "unwind", { parent });
    assert.ok(fs.existsSync(dir), "created");
    throw new Error("x");
  } catch { /* the failing body */ } finally {
    await s.close();
  }
  assert.ok(dir !== "");
  assert.equal(fs.existsSync(dir), false);
  assert.equal(fs.existsSync(`${dir}.owner`), false);
  assert.deepEqual(fs.readdirSync(parent), []);
});

test("5b. a cleanup scope runs last-registered-first, awaits promises, and never rejects", async () => {
  const order = [];
  const s = cleanupScope();
  s.after(() => { order.push("first"); });
  s.after(async () => { await new Promise((r) => setTimeout(r, 20)); order.push("second"); });
  s.after(() => { throw new Error("a callback that throws"); });
  s.after(() => Promise.reject(new Error("a callback that rejects")));
  s.after(() => { order.push("last"); });
  const lines = await stderrOf(() => s.close());
  assert.deepEqual(order, ["last", "second", "first"]);
  assert.equal(lines.filter((line) => line.startsWith("owned: a cleanup callback failed")).length, 2, "each failure is named, once");
});

// 6 ---------------------------------------------------------------------------------------------------------

test("6. unwind through node:test: a child whose test throws leaves nothing behind", (t) => {
  const own = lifo(t);
  const work = ownedDir(own, "child-unwind-work");
  const childFile = path.join(work, "child.mjs");
  const report = path.join(work, "report.txt");
  fs.writeFileSync(childFile, [
    `import { test } from "node:test";`,
    `import * as fs from "node:fs";`,
    `import { ownedDir } from ${JSON.stringify(moduleUrl)};`,
    `test("child", (t) => {`,
    `  const dir = ownedDir(t, "child-unwind", { parent: process.env.OWNED_CHILD_PARENT });`,
    `  fs.writeFileSync(process.env.OWNED_CHILD_REPORT, dir);`,
    `  throw new Error("the child test fails on purpose");`,
    `});`,
    ``,
  ].join("\n"));
  const parent = ownedDir(own, "unwind-parent");
  // NODE_TEST_CONTEXT marks a process as a worker of the RUNNING node:test; a nested run must not inherit it.
  const { NODE_TEST_CONTEXT: _inherited, ...env } = process.env;
  const result = spawnSync(process.execPath, ["--test", childFile], {
    encoding: "utf8", timeout: 60_000,
    env: { ...env, OWNED_CHILD_PARENT: parent, OWNED_CHILD_REPORT: report },
  });
  assert.ifError(result.error);
  assert.notEqual(result.status, 0, "the child must fail");
  const childDir = fs.readFileSync(report, "utf8");
  assert.ok(path.basename(childDir).startsWith(`${PREFIX_OF}child-unwind-`));
  assert.equal(fs.existsSync(childDir), false);
  assert.equal(fs.existsSync(`${childDir}.owner`), false);
  assert.deepEqual(fs.readdirSync(parent), []);
});

// 7 ---------------------------------------------------------------------------------------------------------

test("7. teardown never throws, and what it cannot remove stays prefixed AND claimed", async (t) => {
  const own = lifo(t);
  if (!win32 && typeof process.getuid === "function" && process.getuid() === 0) {
    t.skip("root ignores a read-only parent");
    return;
  }
  const outer = ownedDir(own, "stuck-outer");
  const inner = cleanupScope();
  const dir = ownedDir(inner, "stuck", { parent: outer });
  let blocker;
  let restore = () => {};
  if (win32) {
    // A process whose working directory is inside the folder: the folder cannot be removed until it ends.
    blocker = await holdFolder(dir);
  } else {
    fs.chmodSync(outer, 0o555);
    restore = () => fs.chmodSync(outer, 0o755);
  }
  own.after(async () => { // registered after `outer`, so it runs before it
    if (blocker) await killChild(blocker);
    restore();
    removeQuietly(dir);
  });
  const lines = await stderrOf(() => inner.close());
  const warnings = lines.filter((line) => line.startsWith("owned: could not remove"));
  assert.equal(warnings.length, 1, `exactly one warning, got ${JSON.stringify(lines)}`);
  assert.match(warnings[0], /left for the start-of-run sweep/);
  assert.ok(fs.existsSync(dir), "the folder is still there");
  assert.ok(ownedPattern().test(path.basename(dir)), "and still prefixed");
  assert.ok(fs.existsSync(`${dir}.owner`), "and still claimed");
});

// 8 ---------------------------------------------------------------------------------------------------------

test("8. ownedWorktree: a prefixed leaf, locked with the owner as the reason, gone after teardown", async (t) => {
  const own = lifo(t);
  const repo = ownedRepo(own, "wt-repo");
  const s = cleanupScope();
  let wt;
  try {
    wt = ownedWorktree(s, repo, "wt");
    assert.ok(path.basename(wt.path).startsWith(`${PREFIX_OF}wt-`));
    assert.match(path.basename(wt.path), /^testsToDelete-[uw][0-9]{1,10}-conventions-wt-[A-Za-z0-9]{6}$/);
    assert.equal(path.dirname(path.resolve(wt.path)).toLowerCase(), path.resolve(tempRoot()).toLowerCase(), "a leaf of the temp root");
    const listing = gitOutput(repo, ["worktree", "list", "--porcelain"]);
    const block = listing.split(/\r?\n\r?\n/).find((b) => b.replaceAll("\\", "/").toLowerCase().includes(path.basename(wt.path).toLowerCase()));
    assert.ok(block, `listed: ${listing}`);
    assert.match(block, new RegExp(`^locked ${formatOwner(thisOwner()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m"));
    assert.deepEqual(readOwner(wt.path, "worktree"), thisOwner());
    assert.equal(fs.existsSync(path.join(wt.path, ".git")), true);
  } finally {
    await s.close();
  }
  assert.equal(fs.existsSync(wt.path), false);
  assert.equal(gitOutput(repo, ["worktree", "list", "--porcelain"]).toLowerCase().includes(path.basename(wt.path).toLowerCase()), false);
});

// 9 ---------------------------------------------------------------------------------------------------------

function sentinelIn(scope, what) {
  const sentinel = ownedDir(scope, what);
  fs.writeFileSync(path.join(sentinel, "keep.txt"), "must survive\n");
  return sentinel;
}
function linkInto(wtPath, sentinel) {
  const link = path.join(wtPath, "node_modules");
  fs.symlinkSync(sentinel, link, win32 ? "junction" : "dir");
  return link;
}

test("9. a junction survives teardown: the worktree goes, the link's target stays", async (t) => {
  const own = lifo(t);
  const repo = ownedRepo(own, "jn-repo");
  const sentinel = sentinelIn(own, "jn-sentinel");
  const parent = ownedDir(own, "jn-parent");
  const s = cleanupScope();
  let wt;
  try {
    wt = ownedWorktree(s, repo, "jn", { parent });
    const link = linkInto(wt.path, sentinel);
    wt.beforeRemove(() => removeLink(link));
    assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  } finally {
    await s.close();
  }
  assert.equal(fs.existsSync(wt.path), false, "the worktree is gone");
  assert.equal(fs.readFileSync(path.join(sentinel, "keep.txt"), "utf8"), "must survive\n");
});

test("9b. a beforeRemove that throws: teardown resolves, warns, and never reaches into the link", async (t) => {
  const own = lifo(t);
  const repo = ownedRepo(own, "jf-repo");
  const sentinel = sentinelIn(own, "jf-sentinel");
  const parent = ownedDir(own, "jf-parent");
  const s = cleanupScope();
  const wt = ownedWorktree(s, repo, "jf", { parent });
  const link = linkInto(wt.path, sentinel);
  own.after(() => { // registered after the repository and the sentinel, so it runs before their removal
    try { removeLink(link); } catch { /* already gone */ }
    removeQuietly(wt.path);
  });
  wt.beforeRemove(() => { throw new Error("the unlink failed"); });
  const lines = await stderrOf(() => s.close());
  assert.ok(lines.some((line) => line.startsWith("owned:")), `a warning line: ${JSON.stringify(lines)}`);
  assert.equal(fs.readFileSync(path.join(sentinel, "keep.txt"), "utf8"), "must survive\n");
  if (win32) {
    assert.equal(fs.existsSync(wt.path), true, "git leaves a directory holding a junction; teardown does not rmSync it");
    assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  }
});

// 10 --------------------------------------------------------------------------------------------------------

test("10. the claim is invisible to the resource's user: no untracked file in a folder or a worktree", async (t) => {
  const own = lifo(t);
  const repo = ownedRepo(own, "inv-repo");
  assert.equal(gitOutput(repo, ["status", "--porcelain", "--untracked-files=all"]), "");
  const parent = ownedDir(own, "inv-parent");
  const wt = ownedWorktree(own, repo, "inv", { parent });
  assert.equal(gitOutput(wt.path, ["status", "--porcelain", "--untracked-files=all"]), "");
  assert.ok(fs.existsSync(`${repo}.owner`), "the claim exists, beside the folder");
});

// 11 --------------------------------------------------------------------------------------------------------

test("11. owner text: format, parse, round trip, and what is unreadable", () => {
  const owner = thisOwner();
  assert.deepEqual(parseOwner(`${formatOwner(owner)}\r\n`), owner);
  assert.deepEqual(parseOwner(`${formatOwner(owner)}\n`), owner);
  assert.equal(owner.pid, process.pid);
  assert.match(owner.host, /^[^@:\s]+@(linux|macos|windows)$/);
  assert.equal(owner.owner, OWNER);
  assert.equal("start" in owner, linux && Number.isInteger(owner.start), "a start only where /proc gives it");
  assert.equal("ns" in owner, "start" in owner && Number.isInteger(owner.ns), "the pid namespace rides with the start, on Linux only");
  assert.equal(formatOwner({ owner: "u1000", host: "devbox@windows", pid: 37560 }), "u1000:devbox@windows:37560");
  assert.equal(formatOwner({ owner: "u1000", host: "devbox@linux", pid: 4711, start: 1792053744, ns: 4026531836 }), "u1000:devbox@linux:4711:1792053744:4026531836");
  assert.equal(formatOwner({ owner: "w42", host: "devbox@linux", pid: 4711, ns: 4026531836 }), "w42:devbox@linux:4711", "a namespace without a start is never written");
  const two = parseOwner("u1000:devbox@windows:37560");
  assert.deepEqual(two, { owner: "u1000", host: "devbox@windows", pid: 37560 });
  assert.equal("start" in two, false);
  assert.deepEqual(parseOwner("u1000:devbox@linux:4711:1792053744"), { owner: "u1000", host: "devbox@linux", pid: 4711, start: 1792053744 });
  assert.deepEqual(parseOwner("w42:devbox@linux:4711:1792053744:4026531836"), { owner: "w42", host: "devbox@linux", pid: 4711, start: 1792053744, ns: 4026531836 });
  for (const bad of ["", "added with --lock", "hands off", "devbox:1:2", "u1000:devbox@beos:1:2", "u1000:devbox@linux:x:2", "u1000:devbox@linux:1:2:3:4", "u1000:a b@linux:1",
    "devbox@windows:37560", "U1000:devbox@linux:1", "u:devbox@linux:1", "x1000:devbox@linux:1", "u12345678901:devbox@linux:1", "u1000:devbox@linux:1:2:x"]) {
    assert.deepEqual(parseOwner(bad), { unreadable: true }, JSON.stringify(bad));
  }
  assert.deepEqual(parseLegacyOwner("devbox@linux:4711:1792053744"), { host: "devbox@linux", pid: 4711, start: 1792053744 }, "the old grammar is read by the legacy path only");
  assert.deepEqual(parseLegacyOwner("u1000:devbox@linux:4711"), { unreadable: true });
  assert.equal(formatLegacyOwner({ host: "devbox@windows", pid: 37560 }), "devbox@windows:37560");
});

test("11b. a worktree locked with no reason reads unreadable; an unlocked one reads null", async (t) => {
  const own = lifo(t);
  const repo = ownedRepo(own, "lk-repo");
  const parent = ownedDir(own, "lk-parent");
  const wt = ownedWorktree(own, repo, "lk", { parent });
  git(repo, "worktree", "unlock", wt.path);
  assert.equal(readOwner(wt.path, "worktree"), null, "unlocked = unmarked");
  git(repo, "worktree", "lock", wt.path);
  assert.deepEqual(readOwner(wt.path, "worktree"), { unreadable: true }, "a lock that names nobody");
  git(repo, "worktree", "unlock", wt.path);
  git(repo, "worktree", "lock", "--reason", "hands off", wt.path);
  assert.deepEqual(readOwner(wt.path, "worktree"), { unreadable: true }, "a reason that is not an owner");
});

test("11c. readOwner of a folder: the sibling claim, absent, or unreadable", (t) => {
  const own = lifo(t);
  const parent = ownedDir(own, "ro-parent");
  const dir = ownedDir(own, "ro", { parent });
  assert.deepEqual(readOwner(dir, "folder"), thisOwner());
  fs.rmSync(`${dir}.owner`);
  assert.equal(readOwner(dir, "folder"), null);
  fs.writeFileSync(`${dir}.owner`, "hands off\n");
  assert.deepEqual(readOwner(dir, "folder"), { unreadable: true });
  fs.rmSync(`${dir}.owner`);
  fs.mkdirSync(`${dir}.owner`);
  assert.deepEqual(readOwner(dir, "folder"), { unreadable: true }, "a claim that cannot be read as a file");
  fs.rmdirSync(`${dir}.owner`);
});

// 12 --------------------------------------------------------------------------------------------------------

test("12. any clone, any path form: a worktree made with --relative-paths reads through its relative gitdir", async (t) => {
  const own = lifo(t);
  const repo = ownedRepo(own, "rel-repo");
  const parent = ownedDir(own, "rel-parent");
  const leaf = path.join(parent, ownedName("rel"));
  // testsToDelete-exempt: raw-worktree — a relative-path worktree the helper never makes, to prove readOwner resolves it
  const added = spawnSync("git", ["-C", repo, "worktree", "add", "--detach", "--relative-paths", "--lock", "--reason", formatOwner(thisOwner()), leaf, "HEAD"],
    { encoding: "utf8", timeout: 30_000 });
  if (added.status !== 0 && /relative-paths/.test(added.stderr)) {
    t.skip("this git has no `--relative-paths` for a new worktree; 12b covers the same read with a hand-made relative gitdir");
    return;
  }
  assert.equal(added.status, 0, added.stderr);
  own.after(() => {
    spawnSync("git", ["-C", repo, "worktree", "unlock", leaf], { timeout: 30_000 });
    spawnSync("git", ["-C", repo, "worktree", "remove", "--force", "--force", leaf], { timeout: 30_000 });
    removeQuietly(leaf);
  });
  const dotGit = fs.readFileSync(path.join(leaf, ".git"), "utf8");
  assert.match(dotGit, /^gitdir: ../, `the gitdir is relative: ${dotGit}`);
  const gitdir = gitdirOf(leaf);
  assert.ok(path.isAbsolute(gitdir), gitdir);
  assert.ok(fs.existsSync(gitdir), gitdir);
  assert.deepEqual(readOwner(leaf, "worktree"), thisOwner());
});

test("12b. a relative gitdir written by hand resolves against the worktree, whatever this git version writes", async (t) => {
  const own = lifo(t);
  const repo = ownedRepo(own, "rb-repo");
  const parent = ownedDir(own, "rb-parent");
  const wt = ownedWorktree(own, repo, "rb", { parent });
  const absolute = gitdirOf(wt.path);
  assert.ok(path.isAbsolute(absolute) && fs.existsSync(absolute), absolute);
  // A folder of its own whose .git file names the worktree's gitdir by a RELATIVE path, as `--relative-paths` writes it.
  const reader = ownedDir(own, "rb-reader", { parent });
  const relative = path.relative(reader, absolute).replaceAll("\\", "/");
  assert.ok(!path.isAbsolute(relative), relative);
  fs.writeFileSync(path.join(reader, ".git"), `gitdir: ${relative}\n`);
  assert.equal(gitdirOf(reader).toLowerCase(), absolute.toLowerCase());
  assert.deepEqual(readOwner(reader, "worktree"), thisOwner());
});

test("12c. reads fail closed: a deleted clone and an empty gitdir are unreadable, a repository or a plain folder is unmarked", (t) => {
  const own = lifo(t);
  const repo = ownedRepo(own, "fc-repo");
  const parent = ownedDir(own, "fc-parent");
  // A copy of a worktree's .git file pointing at a gitdir that does not exist: a deleted clone.
  const orphan = ownedDir(own, "orphan", { parent });
  fs.writeFileSync(path.join(orphan, ".git"), "gitdir: ../no-such-clone/.git/worktrees/gone\n");
  assert.deepEqual(readOwner(orphan, "worktree"), { unreadable: true });
  const empty = ownedDir(own, "emptygit", { parent });
  fs.writeFileSync(path.join(empty, ".git"), "gitdir:\n");
  assert.equal(gitdirOf(empty), "");
  assert.deepEqual(readOwner(empty, "worktree"), { unreadable: true });
  // A repository rooted at the folder is not a linked worktree.
  assert.equal(gitdirOf(repo), "");
  assert.equal(readOwner(repo, "worktree"), null);
  // Not a worktree at all.
  const plain = ownedDir(own, "plain", { parent });
  assert.equal(gitdirOf(plain), "");
  assert.equal(readOwner(plain, "worktree"), null);
});

// 13 --------------------------------------------------------------------------------------------------------

test("13. ownerState follows rule §3's order with an injected probe", () => {
  const me = thisOwner();
  const [name, tag] = me.host.split("@");
  const otherTag = ["linux", "macos", "windows"].find((candidate) => candidate !== tag);
  const alive = () => ({ state: "live" });
  assert.equal(ownerState(null, alive), "unknown");
  assert.equal(ownerState({ unreadable: true }, alive), "unknown");
  const known = { hidepid: false }; // the sandbox this test runs in may hide other users' processes; the hidepid answer has its own test
  assert.equal(ownerState(record({ host: `other@${tag}` }), alive), "unknown", "another host");
  assert.equal(ownerState(record({ host: `${name}@${otherTag}` }), alive), "unknown", "the same name in another pid space");
  assert.equal(ownerState(record({ host: me.host.toUpperCase() }), alive), "live", "the host name in another case is the same host");
  assert.equal(ownerState(record(), () => ({ state: "dead" }), known), "gone");
  assert.equal(ownerState(record(), () => ({ state: "unknown" }), known), "unknown", "a refused or failed query is not a dead process");
  assert.equal(ownerState(record(), () => ({}), known), "unknown", "a probe that says nothing");
  assert.equal(ownerState(record(), () => undefined, known), "unknown", "a probe that returns nothing");
  assert.equal(ownerState(record({ start: 100 }), () => ({ state: "live" })), "live", "the probe has no start");
  assert.equal(ownerState(record(), () => ({ state: "live", start: 100 })), "live", "a claim with no start");
  assert.equal(START_TOLERANCE_S, 2);
});

test("13b. two starts further apart than the tolerance are unknown, never gone (rule §3)", () => {
  const marker = record({ start: 1_000 });
  assert.equal(ownerState(marker, () => ({ state: "live", start: 1_002 })), "live", "2 s apart");
  assert.equal(ownerState(marker, () => ({ state: "live", start: 998 })), "live", "2 s apart, the other way");
  assert.equal(ownerState(marker, () => ({ state: "live", start: 1_003 })), "unknown", "3 s apart: a reused pid or a skewed clock");
  assert.equal(ownerState(marker, () => ({ state: "live", start: 997 })), "unknown", "3 s apart, the other way");
  assert.equal(ownerState(marker, () => ({ state: "live", start: 1_000_000 })), "unknown", "far apart is still unknown: only a missing pid is gone");
});

// 14 --------------------------------------------------------------------------------------------------------

test("14. the real probe: this process is live, a pid no process can have is gone", () => {
  assert.equal(ownerState(thisOwner()), "live");
  // Never an exited child's pid: the OS hands that number to the next process (Windows did, mid-suite), and `pid + 1`
  // reads ALIVE there. The premise is asserted around the call instead of hoped for.
  const pid = unmatchablePid();
  assertNoSuchProcess(pid);
  assert.equal(ownerState(record({ pid }), processProbe, { hidepid: false }), "gone");
  assert.deepEqual(processProbe(pid), { state: "dead" });
  assertNoSuchProcess(pid);
  const self = processProbe(process.pid);
  assert.equal(self.state, "live");
  assert.equal("refused" in self, false);
});

test("14a. the real probe is three-valued: a refused query is unknown, never dead", () => {
  const original = process.kill;
  const refusing = (code) => { process.kill = () => { throw Object.assign(new Error(code), { code }); }; };
  try {
    refusing("EPERM");
    assert.deepEqual(processProbe(4242), { state: "unknown" }, "EPERM: refused");
    refusing("EACCES");
    assert.deepEqual(processProbe(4242), { state: "unknown" }, "EACCES: refused");
    refusing("EIO");
    assert.deepEqual(processProbe(4242), { state: "unknown" }, "any other failure: failed");
    refusing("ESRCH");
    assert.deepEqual(processProbe(4242), { state: "dead" }, "ESRCH is the one answer that means no such process");
  } finally {
    process.kill = original;
  }
});

test("14g. a refused real query makes the owner unknown, not gone", () => {
  const original = process.kill;
  process.kill = () => { throw Object.assign(new Error("EPERM"), { code: "EPERM" }); };
  try {
    assert.equal(ownerState(record()), "unknown");
  } finally {
    process.kill = original;
  }
});

test("14b. a start only on Linux, read from /proc: within a few seconds of this process's real start", () => {
  const self = processProbe(process.pid);
  if (!linux) {
    assert.equal(self.start, undefined);
    assert.equal(thisOwner().start, undefined);
    return;
  }
  assert.ok(Number.isInteger(self.start), `an integer, got ${self.start}`);
  const wall = Math.floor(Date.now() / 1000) - Math.floor(process.uptime());
  assert.ok(Math.abs(self.start - wall) <= 5, `start ${self.start} against wall-clock ${wall}`);
  assert.equal(thisOwner().start, self.start, "the writer reads its own start through the reader's path");
});

test("14c. startFromProcStat reads field 22 after the LAST `)`, over btime", () => {
  const fields = (comm) => {
    const rest = Array.from({ length: 50 }, (_, i) => String(i + 3)); // fields 3..52
    rest[19] = "123456"; // field 22 is index 19 of the remainder
    return `4711 (${comm}) ${rest.join(" ")}\n`;
  };
  assert.equal(startFromProcStat(fields("node"), 1_000_000), 1_000_000 + Math.floor(123456 / 100));
  assert.equal(startFromProcStat(fields("we ird) na(me"), 1_000_000), 1_000_000 + 1234, "spaces and parentheses in the command name");
  assert.equal(startFromProcStat("", 1), undefined);
  assert.equal(startFromProcStat("4711 (x) S 1 2", 1), undefined, "too few fields");
  assert.equal(startFromProcStat(fields("node"), Number.NaN), undefined);
});

test("14d. no spawn: thisOwner and processProbe never start a process", (t) => {
  const own = lifo(t);
  const work = ownedDir(own, "nospawn");
  const script = path.join(work, "count.mjs");
  fs.writeFileSync(script, [
    `import cp from "node:child_process";`,
    `import { syncBuiltinESMExports } from "node:module";`,
    `let calls = 0;`,
    `for (const name of ["spawn", "spawnSync", "execFile", "execFileSync", "exec", "execSync", "fork"]) {`,
    `  const original = cp[name];`,
    `  cp[name] = (...args) => { calls += 1; return original(...args); };`,
    `}`,
    `syncBuiltinESMExports();`,
    `const owned = await import(${JSON.stringify(moduleUrl)});`,
    `const owner = owned.thisOwner();`,
    `const probe = owned.processProbe(process.pid);`,
    `process.stdout.write(JSON.stringify({ calls, owner, probe }));`,
    ``,
  ].join("\n"));
  const result = spawnSync(process.execPath, [script], { encoding: "utf8", timeout: 60_000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const seen = JSON.parse(result.stdout);
  assert.equal(seen.calls, 0, "no process was spawned");
  assert.equal(seen.owner.pid > 0, true);
  assert.equal(seen.probe.state, "live");
  assert.equal(Number.isInteger(seen.owner.start), linux);
});

test("14e. removeLink removes the link and never what it points at", (t) => {
  const own = lifo(t);
  const sentinel = sentinelIn(own, "rl-sentinel");
  const holder = ownedDir(own, "rl-holder");
  const link = path.join(holder, "link");
  fs.symlinkSync(sentinel, link, win32 ? "junction" : "dir");
  removeLink(link);
  assert.throws(() => fs.lstatSync(link), { code: "ENOENT" });
  assert.equal(fs.readFileSync(path.join(sentinel, "keep.txt"), "utf8"), "must survive\n");
});

test("14f. a claim that cannot be written removes the folder and throws", (t) => {
  const own = lifo(t);
  const parent = ownedDir(own, "noclaim-parent");
  const original = fsDefault.writeFileSync;
  fsDefault.writeFileSync = (file, ...rest) => {
    if (String(file).endsWith(".owner")) throw Object.assign(new Error("EACCES: the claim is refused"), { code: "EACCES" });
    return original(file, ...rest);
  };
  syncBuiltinESMExports();
  try {
    assert.throws(() => ownedDir(own, "noclaim", { parent }), /owned: could not claim .*EACCES/);
  } finally {
    fsDefault.writeFileSync = original;
    syncBuiltinESMExports();
  }
  assert.deepEqual(fs.readdirSync(parent), [], "no folder and no claim is left: a resource that cannot be claimed is not created");
});

// 15 --------------------------------------------------------------------------------------------------------

test("15. the name carries the caller's owner before the token, and a `what` that leaves no room is refused naming the room", (t) => {
  const own = lifo(t);
  const parent = ownedDir(own, "name-owner-parent");
  const dir = ownedDir(own, "n", { parent });
  assert.ok(path.basename(dir).startsWith(`testsToDelete-${OWNER}-conventions-n-`), path.basename(dir));
  const room = MAX_NAME - PREFIX_OF.length - 1 - 6;
  assert.throws(() => ownedName("x".repeat(room + 1)), (error) => error instanceof TypeError && error.message.includes(`the most is ${room}`) && error.message.includes(OWNER), "the refusal names the room under the owner");
  assert.throws(() => ownedDir(own, "x".repeat(room + 1), { parent }), TypeError);
  assert.equal(ownedName("x".repeat(room)).length, MAX_NAME, "the longest `what` fills the name exactly: nothing is ever truncated");
});

test("15b. classifyName reads the version of a name from its ONE second segment (the shared `names` vectors)", () => {
  for (const vector of VECTORS.names.vectors) {
    const got = classifyName(vector.name);
    const expected = { form: vector.form, ...(vector.owner === undefined ? {} : { owner: vector.owner }), ...(vector.token === undefined ? {} : { token: vector.token }) };
    assert.deepEqual(got, expected, `${vector.id} ${JSON.stringify(vector.name)}: ${vector.why}`);
  }
});

// 16 --------------------------------------------------------------------------------------------------------

/** Make the NEXT random id `aaaaaa` (all-zero bytes), then restore: a way to land two helpers on one name. */
function firstIdIsAAAAAA(t) {
  const original = cryptoDefault.randomBytes;
  let spent = false;
  cryptoDefault.randomBytes = (size, ...rest) => {
    if (spent) return original.call(cryptoDefault, size, ...rest);
    spent = true;
    return Buffer.alloc(size, 0);
  };
  syncBuiltinESMExports();
  t.after(() => { cryptoDefault.randomBytes = original; syncBuiltinESMExports(); });
}

test("16. ownedDir claims FIRST: the claim exists before the folder is made, and a claim already on the name draws a new id", async (t) => {
  const own = lifo(t);
  const parent = ownedDir(own, "claim-parent");
  const taken = path.join(parent, `${PREFIX_OF}first-aaaaaa`);
  fs.writeFileSync(`${taken}.owner`, "somebody else's claim\n"); // an orphan claim: a claim with no folder
  const originalMkdir = fsDefault.mkdirSync;
  const unclaimed = [];
  const made = [];
  fsDefault.mkdirSync = (target, ...rest) => {
    made.push(String(target));
    if (!fs.existsSync(`${target}.owner`)) unclaimed.push(String(target));
    return originalMkdir(target, ...rest);
  };
  syncBuiltinESMExports();
  firstIdIsAAAAAA(t);
  const scope = cleanupScope();
  let dir;
  try {
    dir = ownedDir(scope, "first", { parent });
  } finally {
    fsDefault.mkdirSync = originalMkdir;
    syncBuiltinESMExports();
  }
  try {
    assert.deepEqual(made.map((target) => path.resolve(target)), [path.resolve(dir)], "the folder is made with mkdir, exactly once");
    assert.deepEqual(unclaimed, [], "no folder was made before its claim was written");
    assert.notEqual(path.basename(dir), path.basename(taken), "a claim already on the name draws a new id");
    assert.equal(fs.readFileSync(`${taken}.owner`, "utf8"), "somebody else's claim\n", "the other claim is untouched");
    assert.equal(fs.existsSync(taken), false, "and no folder was made under the taken name");
  } finally {
    await scope.close();
  }
  assert.equal(fs.existsSync(dir), false);
  assert.equal(fs.existsSync(`${dir}.owner`), false);
});

test("16b. a squatted name: one warning, the helper removes its OWN claim at once, the squatter's folder is untouched, a new id is drawn", async (t) => {
  const own = lifo(t);
  const parent = ownedDir(own, "squat-parent");
  const squat = path.join(parent, `${PREFIX_OF}sq-aaaaaa`);
  fs.mkdirSync(squat);
  fs.writeFileSync(path.join(squat, "keep.txt"), "not yours\n");
  firstIdIsAAAAAA(t);
  const scope = cleanupScope();
  let dir = "";
  const lines = await stderrOf(() => { dir = ownedDir(scope, "sq", { parent }); });
  const warnings = lines.filter((line) => line.startsWith("owned:"));
  assert.equal(warnings.length, 1, `one warning, got ${JSON.stringify(lines)}`);
  assert.ok(warnings[0].includes(`${PREFIX_OF}sq-aaaaaa`), "the warning names the collision");
  assert.notEqual(path.basename(dir), path.basename(squat), "a new id was drawn");
  assert.equal(fs.existsSync(`${squat}.owner`), false, "the claim is removed before another id is chosen: a claim of a run that dies later can never govern a folder this run did not create");
  fs.writeFileSync(`${squat}.owner`, "another run claimed the name since\n"); // a later run took the freed name
  await scope.close();
  assert.equal(fs.readFileSync(`${squat}.owner`, "utf8"), "another run claimed the name since\n", "this run's teardown never removes a claim it no longer holds");
  fs.rmSync(`${squat}.owner`);
  assert.equal(fs.readFileSync(path.join(squat, "keep.txt"), "utf8"), "not yours\n", "the squatter's folder is never removed");
  assert.equal(fs.existsSync(dir), false, "and what the helper made is gone");
});

// 17 --------------------------------------------------------------------------------------------------------

test("17. thisOwner carries the owner token and, on Linux, the pid namespace; TESTSTODELETE_RUN replaces the process when valid and is refused when not", async () => {
  const me = thisOwner();
  assert.equal(me.owner, OWNER);
  if (linux && me.start !== undefined) assert.ok(Number.isInteger(me.ns), "Linux: the namespace rides with the start");
  else assert.equal(me.ns, undefined);
  const parentStart = processProbe(process.ppid).start; // the parent runs this test: a LIVE run, not this process
  const given = { owner: OWNER, host: me.host, pid: process.ppid, ...(me.start === undefined || parentStart === undefined ? {} : { start: parentStart, ...(me.ns === undefined ? {} : { ns: me.ns }) }) };
  assert.deepEqual(runRecord({ TESTSTODELETE_RUN: formatOwner(given) }), given, "a valid run record of a live process is the run's");
  assert.equal(runRecord({}), me);
  assert.equal(runRecord({ TESTSTODELETE_RUN: "" }), me);
  for (const bad of ["garbage", `${OWNER === "u1" ? "u2" : "u1"}:${me.host}:4711`, `${OWNER}:${me.host}:4711\nextra`, "a".repeat(600)]) {
    let used;
    const lines = await stderrOf(() => { used = runRecord({ TESTSTODELETE_RUN: bad }); });
    assert.equal(used, me, `a record that is not this user's is refused: ${JSON.stringify(bad.slice(0, 40))}`);
    assert.ok(lines.some((line) => line.startsWith("owned:")), "and one warning says so");
  }
});

test("17b. a child with TESTSTODELETE_RUN set makes a claim that names the RUN, not the child", (t) => {
  const own = lifo(t);
  const work = ownedDir(own, "run-child");
  const parent = ownedDir(own, "run-child-parent");
  const script = path.join(work, "child.mjs");
  fs.writeFileSync(script, [
    `import { ownedDir, cleanupScope } from ${JSON.stringify(moduleUrl)};`,
    `const scope = cleanupScope();`,
    `process.stdout.write(ownedDir(scope, "run-child-dir", { parent: process.env.OWNED_CHILD_PARENT }));`,
    ``,
  ].join("\n"));
  const runsRecord = formatOwner(thisOwner()); // this test process is the live run that spawns the child
  const { NODE_TEST_CONTEXT: _inherited, ...env } = process.env;
  const result = spawnSync(process.execPath, [script], { encoding: "utf8", timeout: 60_000, env: { ...env, OWNED_CHILD_PARENT: parent, TESTSTODELETE_RUN: runsRecord } });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(`${result.stdout}.owner`, "utf8"), `${runsRecord}\n`, "the claim holds the run's record");
  removeQuietly(result.stdout);
});

test("17c. a TESTSTODELETE_RUN naming a process that is gone, or one of another host or namespace, is refused with ONE warning and the process's own record is used", async () => {
  const me = thisOwner();
  const exited = spawnSync(process.execPath, ["-e", ""], { encoding: "utf8" });
  assert.ifError(exited.error);
  const withNs = (record) => (me.start === undefined || me.ns === undefined ? record : `${record}:${me.start}:${me.ns}`);
  const gone = `${me.owner}:${me.host}:${exited.pid}`;
  assert.equal(processProbe(exited.pid).state, "dead", "the fixture: that pid has no process");
  const cases = {
    "a pid with no process": withNs(gone),
    "a pid nothing can have": withNs(`${me.owner}:${me.host}:4194300`),
    "another host": withNs(`${me.owner}:some-other-host@${me.host.split("@")[1]}:${process.ppid}`),
    ...(me.ns === undefined ? {} : { "another pid namespace": `${me.owner}:${me.host}:${process.ppid}:${processProbe(process.ppid).start}:${me.ns + 1}` }),
  };
  for (const [what, record] of Object.entries(cases)) {
    let used;
    const lines = await stderrOf(() => { used = runRecord({ TESTSTODELETE_RUN: record }); });
    assert.equal(used, me, `${what}: refused, the process's own record is used`);
    assert.equal(lines.filter((line) => line.startsWith("owned:")).length, 1, `${what}: ONE warning`);
  }
});

// 18 --------------------------------------------------------------------------------------------------------

test("18. TESTSTODELETE_OWNER selects, never widens: u0 by a non-root user is unknown, and an invalid value refuses", () => {
  assert.equal(ownerToken({ platform: "linux", uid: 1000, env: { TESTSTODELETE_OWNER: "u0" } }), "u0", "the override names the scope");
  assert.equal(ownerToken({ platform: "linux", uid: 1000, env: {} }), "u1000");
  assert.equal(ownerToken({ platform: "linux", uid: 1000, env: { TESTSTODELETE_OWNER: "" } }), "u1000", "an empty value is no value");
  const rootsRecord = { owner: "u0", host: thisOwner().host, ...(thisOwner().ns === undefined ? {} : { ns: thisOwner().ns }), pid: 4242 };
  const dead = () => ({ state: "dead" });
  assert.equal(ownerState(rootsRecord, dead, { callerOwner: "u0", kernelMine: false, hidepid: false }), "unknown", "the kernel owner is not the caller: the override widened nothing");
  assert.equal(ownerState(rootsRecord, dead, { callerOwner: "u0", kernelMine: true, hidepid: false }), "gone", "with the kernel's agreement the same record is gone");
  for (const bad of ["u0;rm -rf /", "u1000 ", " u1000", "U1000", "u", "w", "w12345678901", "x1000", "u-1", "u1000\n"]) {
    assert.throws(() => ownerToken({ platform: "linux", uid: 1000, env: { TESTSTODELETE_OWNER: bad } }), /not an owner token/, JSON.stringify(bad));
  }
});

// 19 --------------------------------------------------------------------------------------------------------

test("19. a record whose owner is not the name's or not the caller's is unknown; a Linux record without a namespace, or in another one, is unknown", () => {
  const dead = () => ({ state: "dead" });
  const flags = { hidepid: false };
  assert.equal(ownerState(record(), dead, flags), "gone", "the control: the same record, all keys agree");
  assert.equal(ownerState(record({ owner: "u424242" }), dead, flags), "unknown", "the record's owner is not the caller's");
  assert.equal(ownerState(record(), dead, { ...flags, nameOwner: "u424242" }), "unknown", "the name's owner is not the record's");
  assert.equal(ownerState(record(), dead, { ...flags, callerOwner: "u424242" }), "unknown", "the caller is not the record's owner");
  assert.equal(ownerState(record(), dead, { ...flags, nameOwner: OWNER }), "gone", "name, record and caller are ONE");
  assert.equal(ownerState(record(), dead, { hidepid: true }), "unknown", "a process list that may hide other users' processes proves nothing");
  if (linux && thisOwner().ns !== undefined) {
    const { ns: _ns, ...withoutNamespace } = record();
    assert.equal(ownerState(withoutNamespace, dead, flags), "unknown", "a Linux record without a namespace");
    assert.equal(ownerState(record({ ns: thisOwner().ns + 1 }), dead, flags), "unknown", "the same pid in another namespace");
  }
});

test("19b. a claim another uid wrote, and a claim that is no regular file, are unreadable", (t) => {
  if (win32) { t.skip("no uid on Windows; the janitor's -O is the check there"); return; }
  const own = lifo(t);
  const parent = ownedDir(own, "claim-kinds");
  const dir = ownedDir(own, "k", { parent });
  assert.equal(isMine(dir), true);
  assert.equal(isMine(path.join(parent, "no-such-entry")), false);
  fs.rmSync(`${dir}.owner`);
  const fifo = spawnSync("mkfifo", [`${dir}.owner`]);
  if (fifo.status === 0) assert.deepEqual(readOwner(dir, "folder"), { unreadable: true }, "a FIFO is never opened: a read would block forever");
  fs.rmSync(`${dir}.owner`, { force: true });
  if (process.getuid() === 0) {
    fs.writeFileSync(`${dir}.owner`, `${formatOwner(thisOwner())}\n`);
    fs.chownSync(`${dir}.owner`, 54321, 54321);
    assert.deepEqual(readOwner(dir, "folder"), { unreadable: true, reason: "foreign-uid" }, "a claim a stranger wrote is no evidence");
    fs.chownSync(dir, 54321, 54321);
    assert.equal(isMine(dir), false);
  }
});

// 20 --------------------------------------------------------------------------------------------------------

test("20. the Windows owner token: ASCII-only lower-casing, the UTF-8 bytes of the name alone, 1 to 10 digits — the shared `windows-owner` vectors", () => {
  assert.ok(VECTORS["windows-owner"].vectors.length >= 10);
  for (const vector of VECTORS["windows-owner"].vectors) {
    assert.equal(windowsOwnerToken(vector.username), vector.token, `${vector.id} ${JSON.stringify(vector.username)}: ${vector.why}`);
    assert.equal(ownerToken({ platform: "win32", username: vector.username, env: {} }), vector.token);
    assert.match(vector.token, /^w[0-9]{1,10}$/);
    assert.match(vector.token, OWNER_GRAMMAR);
  }
  assert.equal(windowsOwnerToken("Alice"), windowsOwnerToken("alice"), "Alice and alice give one token");
  assert.notEqual(windowsOwnerToken("SØREN"), windowsOwnerToken("søren"), "only the ASCII letters are lower-cased");
  assert.equal(asciiLower("ÀBC-Ünal"), "Àbc-Ünal");
  assert.notEqual(windowsOwnerToken("alice\n"), windowsOwnerToken("alice"), "a line end is part of the bytes: the canonical input has none");
  assert.equal(ownerToken({ platform: "linux", uid: 1000, username: "Alice", env: {} }), "u1000", "POSIX never hashes");
});

// R1 / R2 / R5 — defects found by review ---------------------------------------------------------------------------

test("R1. a legacy record on a Linux reader is unknown (it has no pid namespace); on any other reader it is judged like a record", () => {
  const legacy = { host: thisOwner().host, pid: 4242 };
  const dead = () => ({ state: "dead" });
  assert.equal(legacyOwnerState(legacy, dead, { platform: "linux", hidepid: false }), "unknown", "a pid in a container we cannot see is not a dead pid");
  assert.equal(legacyOwnerState(legacy, dead, { platform: "darwin", hidepid: false }), "gone");
  assert.equal(legacyOwnerState(legacy, dead, { platform: "win32", hidepid: false }), "gone");
  assert.equal(legacyOwnerState(legacy, () => ({ state: "live" }), { platform: "darwin" }), "live");
  assert.equal(legacyOwnerState({ unreadable: true }, dead, { platform: "darwin" }), "unknown");
});

test("R2. the Windows scope key is the user's profile: a path counts as mine only inside it (pure, any OS)", () => {
  const w = path.win32;
  const home = "C:/Users/alice";
  assert.equal(isInsideProfile("C:/Users/alice/AppData/Local/Temp/x", home, w), true);
  assert.equal(isInsideProfile("c:/users/ALICE/appdata/local/temp/x", home, w), true, "case-insensitive");
  assert.equal(isInsideProfile("C:/Temp/x", home, w), false, "a shared temp root is no one's profile");
  assert.equal(isInsideProfile("C:/Users/alice2/x", home, w), false, "a longer name is not a child");
  assert.equal(isInsideProfile("C:/Users/bob/x", home, w), false);
  assert.equal(isInsideProfile("D:/Users/alice/x", home, w), false, "another drive");
  assert.equal(isInsideProfile(home, home, w), false, "the profile itself is not a resource");
  assert.equal(isInsideProfile("C:/Users/alice/../bob/x", home, w), false, "dot segments are resolved first");
});

test("R2b. on Windows isMine is true only inside the profile of the current user; elsewhere it fails closed", (t) => {
  if (!win32) { t.skip("the Windows branch"); return; }
  const own = lifo(t);
  const dir = ownedDir(own, "profile");
  assert.equal(isMine(dir), true, "the per-user temp root is inside the profile");
  assert.equal(isMine(dir, { home: path.parse(dir).root + "no-such-profile" }), false, "another profile");
  assert.equal(isMine(path.join(process.env.SystemRoot ?? "C:/Windows", "System32")), false, "outside the profile");
  assert.equal(isMine(path.join(dir, "missing")), false, "a path that is not there is not provably mine");
});

test("R2c. a claim the scope key does not own is unreadable foreign-uid on every OS (the seam is the same one the sweep uses)", (t) => {
  const own = lifo(t);
  const dir = ownedDir(own, "claim-scope");
  assert.deepEqual(readOwner(dir, "folder", { mine: () => false }), { unreadable: true, reason: "foreign-uid" });
  assert.deepEqual(readOwner(dir, "folder", { mine: () => true }), thisOwner());
});
