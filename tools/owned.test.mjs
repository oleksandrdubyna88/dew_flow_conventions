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
  OWNED, OWNED_PATTERN, PREFIX, REPO_TOKEN, START_TOLERANCE_S,
  cleanupScope, formatOwner, gitdirOf, ownedDir, ownedName, ownedWorktree, ownerState, parseOwner, processProbe,
  readOwner, removeLink, removeQuietly, startFromProcStat, tempRoot, thisOwner,
} from "./lib/owned.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const moduleUrl = pathToFileURL(path.join(here, "lib", "owned.mjs")).href;
const win32 = process.platform === "win32";
const linux = process.platform === "linux";
const PLACEHOLDER_COMMIT = ["-c", "user.name=Owned test", "-c", "user.email=owned@example.invalid", "-c", "commit.gpgsign=false",
  "commit", "--allow-empty", "-qm", "fixture"];

const real = (p) => fs.realpathSync.native(p);
const same = (a, b) => real(a).toLowerCase() === real(b).toLowerCase();
const ownedEntriesOf = (dir) => fs.readdirSync(dir).filter((name) => OWNED_PATTERN.test(name));

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

test("1. ownedName is the prefix, the repo token, what and six random characters", () => {
  assert.equal(PREFIX, "testsToDelete-");
  assert.equal(REPO_TOKEN, "conventions");
  assert.equal(OWNED, "testsToDelete-conventions-");
  const a = ownedName("pg");
  assert.match(a, /^testsToDelete-conventions-pg-[A-Za-z0-9]{6}$/);
  assert.notEqual(a, ownedName("pg"));
  assert.match(ownedName("a-b "), /^testsToDelete-conventions-a-b -[A-Za-z0-9]{6}$/);
});

// 2 ---------------------------------------------------------------------------------------------------------

test("2. ownedDir makes a prefixed folder in the temp root and a sibling claim that parses to this process", (t) => {
  const dir = ownedDir(t, "rules Unicode пробел");
  assert.ok(fs.statSync(dir).isDirectory());
  assert.equal(path.dirname(path.resolve(dir)).toLowerCase(), path.resolve(tempRoot()).toLowerCase());
  assert.ok(path.basename(dir).startsWith("testsToDelete-conventions-rules Unicode пробел-"));
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
  for (const what of ["", "a/b", "a\\b", "-x", "a\u0001b", "a\u007fb", "x".repeat(31), 7, undefined, "a\0b"]) {
    assert.throws(() => ownedDir(own, what, { parent }), TypeError, JSON.stringify(what));
    assert.throws(() => ownedName(what), TypeError, JSON.stringify(what));
  }
  assert.deepEqual(ownedEntriesOf(parent), before);
  assert.match(ownedName("x".repeat(30)), /^testsToDelete-conventions-x{30}-[A-Za-z0-9]{6}$/, "30 is the longest `what`");
  assert.ok(ownedName("x".repeat(30)).length <= 63);
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
  const parent = ownedDir(own, "child-unwind-parent");
  // NODE_TEST_CONTEXT marks a process as a worker of the RUNNING node:test; a nested run must not inherit it.
  const { NODE_TEST_CONTEXT: _inherited, ...env } = process.env;
  const result = spawnSync(process.execPath, ["--test", childFile], {
    encoding: "utf8", timeout: 60_000,
    env: { ...env, OWNED_CHILD_PARENT: parent, OWNED_CHILD_REPORT: report },
  });
  assert.ifError(result.error);
  assert.notEqual(result.status, 0, "the child must fail");
  const childDir = fs.readFileSync(report, "utf8");
  assert.ok(path.basename(childDir).startsWith("testsToDelete-conventions-child-unwind-"));
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
  assert.ok(OWNED_PATTERN.test(path.basename(dir)), "and still prefixed");
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
    assert.match(path.basename(wt.path), /^testsToDelete-conventions-wt-[A-Za-z0-9]{6}$/);
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
  assert.equal("start" in owner, linux && Number.isInteger(owner.start), "a start only where /proc gives it");
  assert.equal(formatOwner({ host: "devbox@windows", pid: 37560 }), "devbox@windows:37560");
  assert.equal(formatOwner({ host: "devbox@linux", pid: 4711, start: 1792053744 }), "devbox@linux:4711:1792053744");
  const two = parseOwner("devbox@windows:37560");
  assert.deepEqual(two, { host: "devbox@windows", pid: 37560 });
  assert.equal("start" in two, false);
  assert.deepEqual(parseOwner("devbox@linux:4711:1792053744"), { host: "devbox@linux", pid: 4711, start: 1792053744 });
  for (const bad of ["", "added with --lock", "hands off", "devbox:1:2", "devbox@beos:1:2", "devbox@linux:x:2", "devbox@linux:1:2:3", "a b@linux:1"]) {
    assert.deepEqual(parseOwner(bad), { unreadable: true }, JSON.stringify(bad));
  }
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
  const alive = () => ({ alive: true });
  assert.equal(ownerState(null, alive), "unknown");
  assert.equal(ownerState({ unreadable: true }, alive), "unknown");
  assert.equal(ownerState({ host: `other@${tag}`, pid: 1 }, alive), "unknown", "another host");
  assert.equal(ownerState({ host: `${name}@${otherTag}`, pid: 1 }, alive), "unknown", "the same name in another pid space");
  assert.equal(ownerState({ host: me.host.toUpperCase(), pid: 1 }, alive), "live", "the host name in another case is the same host");
  assert.equal(ownerState({ host: me.host, pid: 1 }, () => ({ alive: false })), "gone");
  assert.equal(ownerState({ host: me.host, pid: 1 }, () => ({ alive: undefined })), "unknown", "a refused or failed query is not a dead process");
  assert.equal(ownerState({ host: me.host, pid: 1 }, () => ({})), "unknown", "a probe that says nothing");
  assert.equal(ownerState({ host: me.host, pid: 1 }, () => undefined), "unknown", "a probe that returns nothing");
  assert.equal(ownerState({ host: me.host, pid: 1, start: 100 }, () => ({ alive: true })), "live", "the probe has no start");
  assert.equal(ownerState({ host: me.host, pid: 1 }, () => ({ alive: true, start: 100 })), "live", "a two-field claim");
  assert.equal(START_TOLERANCE_S, 2);
});

test("13b. two starts further apart than the tolerance are unknown, never gone (rule §3)", () => {
  const marker = { host: thisOwner().host, pid: 1, start: 1_000 };
  assert.equal(ownerState(marker, () => ({ alive: true, start: 1_002 })), "live", "2 s apart");
  assert.equal(ownerState(marker, () => ({ alive: true, start: 998 })), "live", "2 s apart, the other way");
  assert.equal(ownerState(marker, () => ({ alive: true, start: 1_003 })), "unknown", "3 s apart: a reused pid or a skewed clock");
  assert.equal(ownerState(marker, () => ({ alive: true, start: 997 })), "unknown", "3 s apart, the other way");
  assert.equal(ownerState(marker, () => ({ alive: true, start: 1_000_000 })), "unknown", "far apart is still unknown: only a missing pid is gone");
});

// 14 --------------------------------------------------------------------------------------------------------

test("14. the real probe: this process is live, a pid no process can have is gone", () => {
  assert.equal(ownerState(thisOwner()), "live");
  // Never an exited child's pid: the OS hands that number to the next process (Windows did, mid-suite), and `pid + 1`
  // reads ALIVE there. The premise is asserted around the call instead of hoped for.
  const pid = unmatchablePid();
  assertNoSuchProcess(pid);
  assert.equal(ownerState({ host: thisOwner().host, pid }), "gone");
  assert.deepEqual(processProbe(pid), { alive: false });
  assertNoSuchProcess(pid);
  const self = processProbe(process.pid);
  assert.equal(self.alive, true);
  assert.equal("refused" in self, false);
});

test("14a. the real probe is three-valued: a refused query is undefined, never dead", () => {
  const original = process.kill;
  const refusing = (code) => { process.kill = () => { throw Object.assign(new Error(code), { code }); }; };
  try {
    refusing("EPERM");
    assert.deepEqual(processProbe(4242), { alive: undefined }, "EPERM: refused");
    refusing("EACCES");
    assert.deepEqual(processProbe(4242), { alive: undefined }, "EACCES: refused");
    refusing("EIO");
    assert.deepEqual(processProbe(4242), { alive: undefined }, "any other failure: failed");
    refusing("ESRCH");
    assert.deepEqual(processProbe(4242), { alive: false }, "ESRCH is the one answer that means no such process");
  } finally {
    process.kill = original;
  }
});

test("14a2. a refused real query makes the owner unknown, not gone", () => {
  const original = process.kill;
  process.kill = () => { throw Object.assign(new Error("EPERM"), { code: "EPERM" }); };
  try {
    assert.equal(ownerState({ host: thisOwner().host, pid: 4242 }), "unknown");
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
  assert.equal(seen.probe.alive, true);
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
