#!/usr/bin/env node
/**
 * `lib/leftovers-sweep.mjs` and `run-tests.mjs`'s `runWithSweep` (rule §4 of `common/test-leftovers.md`, E1 S3).
 *
 * Every scenario sweeps a PRIVATE temp root (`tmp`, an owned folder) with a disposable repository from a second
 * owned folder (`work`) — never this checkout and never the real temp root. The repositories live in `work`,
 * not in `tmp`, so the sweep under test cannot see them as candidates.
 *
 * Each fixture is made by the S2 helper (`ownedDir`, `ownedWorktree`); where a scenario needs a claim the helper
 * would never write (a dead pid, a foreign host, garbage, none) it rewrites the claim the helper made. Swept
 * worktrees are made with a scope that registers nothing and get one quiet teardown of this file's own, so the
 * helper's own teardown does not complain about a tree the sweep already took.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { git } from "./lib/git.mjs";
import { sweepLeftovers, MIN_AGE_MS } from "./lib/leftovers-sweep.mjs";
import { cleanupScope, formatOwner, gitdirOf, ownedDir, ownedName, ownedWorktree, removeQuietly, thisOwner } from "./lib/owned.mjs";
import { runWithSweep } from "./run-tests.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ownedUrl = pathToFileURL(path.join(here, "lib", "owned.mjs")).href;
const win32 = process.platform === "win32";
const COMMIT = ["-c", "user.name=Sweep test", "-c", "user.email=sweep@example.invalid", "-c", "commit.gpgsign=false",
  "commit", "--allow-empty", "-qm", "fixture"];
const HOUR = 3_600_000;
const NO_SCOPE = { after() {} }; // the helper registers nothing; this file tears the tree down itself, quietly

/** A cleanup scope tied to the test, last-registered-first (node:test's own `t.after` runs first-registered-first). */
function lifo(t) {
  const scope = cleanupScope();
  t.after(() => scope.close());
  return scope;
}

/** A pid that has exited. */
function deadPid() {
  const child = spawnSync(process.execPath, ["-e", ""], { timeout: 30_000 });
  assert.ok(child.pid > 0);
  return child.pid;
}

const ownerLine = (host, pid) => `${host}:${pid}\n`;
const deadOwnerLine = () => ownerLine(thisOwner().host, deadPid());

/** `work` (repositories, scripts) and `tmp` (what the sweep sweeps) — two owned folders, so neither holds the other. */
function arena(t) {
  const own = lifo(t);
  const work = ownedDir(own, "sweep-work");
  const tmp = ownedDir(own, "sweep-tmp");
  return { own, work, tmp };
}

function ownedRepo(own, work, what) {
  const repo = ownedDir(own, what, { parent: work });
  git(repo, "init", "-q");
  git(repo, ...COMMIT);
  return repo;
}

function setOld(target) {
  const when = new Date(Date.now() - HOUR);
  fs.utimesSync(target, when, when);
}

/** A prefixed folder in `tmp` made by the helper, with its claim rewritten to `claim` (`null` removes the claim), aged unless `young`. */
function folder(own, tmp, what, { claim, young = false } = {}) {
  const dir = ownedDir(own, what, { parent: tmp });
  if (claim === null) fs.rmSync(`${dir}.owner`);
  else if (claim !== undefined) fs.writeFileSync(`${dir}.owner`, claim);
  if (!young) setOld(dir);
  return dir;
}

/** Quietly take a worktree away whatever state it is in (a swept one is already gone). */
function quietTeardown(own, repo, worktree) {
  own.after(() => {
    for (const args of [["worktree", "unlock", worktree], ["worktree", "remove", "--force", "--force", worktree], ["worktree", "prune"]]) {
      try { git(repo, ...args); } catch { /* already gone */ }
    }
    removeQuietly(worktree);
  });
}

/** A worktree of `repo` in `tmp` made by the helper; `claim` rewrites its lock reason, `null` unlocks it. */
function worktree(own, repo, tmp, what, { claim, young = false } = {}) {
  const wt = ownedWorktree(NO_SCOPE, repo, what, { parent: tmp });
  quietTeardown(own, repo, wt.path);
  if (claim === null) git(repo, "worktree", "unlock", wt.path);
  else if (claim !== undefined) fs.writeFileSync(path.join(gitdirOf(wt.path), "locked"), claim);
  if (!young) setOld(wt.path);
  return wt.path;
}

const listed = (repo) => git(repo, "worktree", "list", "--porcelain").split(/\r?\n/)
  .filter((line) => line.startsWith("worktree ")).map((line) => path.resolve(line.slice(9)).toLowerCase());
const reasonsOf = (result) => Object.fromEntries(result.preserved.map((p) => [path.basename(p.path), p.reason]));
const namesOf = (paths) => paths.map((p) => path.basename(p)).sort();

/** What `process.stderr.write` received while `fn` ran. */
async function stderrOf(fn) {
  const chunks = [];
  const original = process.stderr.write;
  process.stderr.write = (chunk) => { chunks.push(String(chunk)); return true; };
  try { await fn(); } finally { process.stderr.write = original; }
  return chunks.join("").split("\n").filter(Boolean);
}

/** The first line the child prints, parsed. */
function firstLine(child) {
  return new Promise((resolve, reject) => {
    let text = "";
    child.stdout.on("data", (chunk) => {
      text += chunk;
      const end = text.indexOf("\n");
      if (end >= 0) resolve(JSON.parse(text.slice(0, end)));
    });
    child.once("exit", () => reject(new Error(`the child exited before it reported: ${text}`)));
  });
}

function exited(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) resolve();
    else child.once("exit", () => resolve());
  });
}

// 1 ---------------------------------------------------------------------------------------------------------

test("1. a killed run is collected: the folder, its claim and the worktree go, the junction's target stays", async (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "killed-repo");
  const sentinel = ownedDir(own, "killed-sentinel", { parent: work });
  const sentinelFile = path.join(sentinel, "keep.txt");
  fs.writeFileSync(sentinelFile, "still here");
  const childFile = path.join(work, "child.mjs");
  fs.writeFileSync(childFile, [
    `import * as fs from "node:fs";`,
    `import * as path from "node:path";`,
    `import { cleanupScope, ownedDir, ownedWorktree } from ${JSON.stringify(ownedUrl)};`,
    `const [parent, repo, sentinel] = process.argv.slice(2);`,
    `const s = cleanupScope(); // never closed: the process is killed first`,
    `const dir = ownedDir(s, "killed", { parent });`,
    `const wt = ownedWorktree(s, repo, "killed-wt", { parent });`,
    `fs.symlinkSync(sentinel, path.join(wt.path, "node_modules"), process.platform === "win32" ? "junction" : "dir");`,
    `process.stdout.write(JSON.stringify({ dir, worktree: wt.path }) + "\\n");`,
    `setInterval(() => {}, 1000);`,
  ].join("\n"));

  const child = spawn(process.execPath, [childFile, tmp, repo, sentinel], { stdio: ["ignore", "pipe", "inherit"] });
  t.after(() => { child.kill("SIGKILL"); });
  const made = await firstLine(child);
  quietTeardown(own, repo, made.worktree);
  child.kill("SIGKILL"); // by pid, never by image name
  await exited(child);

  assert.ok(fs.existsSync(made.dir) && fs.existsSync(`${made.dir}.owner`), "the folder and its claim are left behind");
  assert.ok(fs.existsSync(made.worktree) && listed(repo).includes(path.resolve(made.worktree).toLowerCase()), "the worktree is left behind and listed");
  assert.match(fs.readFileSync(path.join(gitdirOf(made.worktree), "locked"), "utf8"), new RegExp(`:${child.pid}\\b`), "locked by the dead pid");
  setOld(made.dir);
  setOld(made.worktree);

  const result = sweepLeftovers({ repo, tmp });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([made.dir, made.worktree]));
  assert.equal(fs.existsSync(made.dir), false);
  assert.equal(fs.existsSync(`${made.dir}.owner`), false, "the sibling claim goes with its folder");
  assert.equal(fs.existsSync(made.worktree), false);
  assert.equal(listed(repo).includes(path.resolve(made.worktree).toLowerCase()), false, "no longer listed");
  assert.equal(fs.readFileSync(sentinelFile, "utf8"), "still here", "the link was unlinked, never followed");
});

// 2 ---------------------------------------------------------------------------------------------------------

test("2. a resource that may belong to a running run survives, with its reason; the unmarked old one goes", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "survive-repo");
  const repo2 = ownedRepo(own, work, "survive-repo-2");
  const me = formatOwner(thisOwner()) + "\n";

  const live = folder(own, tmp, "live", { claim: me });
  const foreign = folder(own, tmp, "foreign", { claim: ownerLine("other@" + (win32 ? "linux" : "windows"), 1) });
  const unreadable = folder(own, tmp, "unreadable", { claim: "not an owner\n" });
  const young = folder(own, tmp, "young", { claim: deadOwnerLine(), young: true });
  const unmarked = folder(own, tmp, "unmarked", { claim: null });
  const dotGitDir = folder(own, tmp, "dot-git-dir", { claim: null });
  fs.mkdirSync(path.join(dotGitDir, ".git")); // a repository rooted there is a plain folder
  setOld(dotGitDir);
  const missingGitdir = folder(own, tmp, "missing-gitdir", { claim: deadOwnerLine() });
  fs.writeFileSync(path.join(missingGitdir, ".git"), `gitdir: ${path.join(work, "no-such-clone", ".git", "worktrees", "x")}\n`);
  setOld(missingGitdir);
  const mine = worktree(own, repo, tmp, "mine", { claim: me });
  const other = worktree(own, repo2, tmp, "other-clone", { claim: deadOwnerLine() });

  const result = sweepLeftovers({ repo, tmp });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([unmarked, dotGitDir]));
  assert.deepEqual(reasonsOf(result), {
    [path.basename(live)]: "live",
    [path.basename(foreign)]: "foreign host",
    [path.basename(unreadable)]: "unreadable",
    [path.basename(young)]: "young",
    [path.basename(missingGitdir)]: "other clone",
    [path.basename(mine)]: "live",
    [path.basename(other)]: "other clone",
  });
  for (const kept of [live, foreign, unreadable, young, missingGitdir, mine, other]) assert.ok(fs.existsSync(kept), kept);
  assert.equal(fs.existsSync(unmarked), false);
  assert.equal(fs.existsSync(`${unmarked}.owner`), false);
  assert.equal(fs.existsSync(dotGitDir), false);
  assert.ok(listed(repo2).includes(path.resolve(other).toLowerCase()), "the other clone still lists its own tree");
  assert.ok(listed(repo).includes(path.resolve(mine).toLowerCase()));
});

test("2b. an unmarked old worktree and a dead-owned one of this repository are removed; a bare `locked` is unreadable", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "wt-repo");
  const unmarked = worktree(own, repo, tmp, "unmarked", { claim: null });
  const dead = worktree(own, repo, tmp, "dead", { claim: deadOwnerLine() });
  const bare = worktree(own, repo, tmp, "bare-lock", { claim: "added with --lock\n" });

  const result = sweepLeftovers({ repo, tmp });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([unmarked, dead]));
  assert.deepEqual(reasonsOf(result), { [path.basename(bare)]: "unreadable" });
  assert.deepEqual(listed(repo).map((p) => path.basename(p)).filter((n) => /^teststodelete/i.test(n) && !/^teststodelete-conventions-wt-repo-/i.test(n)), [path.basename(bare).toLowerCase()]);
});

// 3 ---------------------------------------------------------------------------------------------------------

test("3. only this repository's token is matched, anchored and case-insensitive", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "anchor-repo");
  const dead = deadOwnerLine();
  const plant = (name) => {
    const dir = path.join(tmp, name);
    fs.mkdirSync(dir);
    fs.writeFileSync(`${dir}.owner`, dead);
    setOld(dir);
    return dir;
  };
  const untouched = ["x-testsToDelete-conventions-a", "testsToDelete-other-a-123456", "testsToDeleteconventions-a", "testsToDelete-conventionsx-a-123456"].map(plant);
  const upper = plant("TESTSTODELETE-CONVENTIONS-a-xyz123");
  const underscore = plant("teststodelete_conventions_a_xyz123");

  const result = sweepLeftovers({ repo, tmp });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([upper, underscore]));
  assert.deepEqual(result.preserved, [], "a name that is not ours is not even reported");
  for (const dir of untouched) assert.ok(fs.existsSync(dir) && fs.existsSync(`${dir}.owner`), dir);
  assert.equal(fs.existsSync(`${upper}.owner`), false);
});

// 3b --------------------------------------------------------------------------------------------------------

test("3b. an old claim whose folder is gone is removed; a young one and one beside a live folder stay", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "orphan-repo");
  const orphan = path.join(tmp, ownedName("orphan"));
  fs.writeFileSync(`${orphan}.owner`, deadOwnerLine());
  setOld(`${orphan}.owner`);
  const youngOrphan = path.join(tmp, ownedName("young-orphan"));
  fs.writeFileSync(`${youngOrphan}.owner`, deadOwnerLine());
  const live = folder(own, tmp, "has-folder", { claim: formatOwner(thisOwner()) + "\n" });
  setOld(`${live}.owner`);
  const foreignName = path.join(tmp, "testsToDelete-other-orphan-123456");
  fs.writeFileSync(`${foreignName}.owner`, deadOwnerLine());
  setOld(`${foreignName}.owner`);

  const result = sweepLeftovers({ repo, tmp });

  assert.equal(fs.existsSync(`${orphan}.owner`), false);
  assert.ok(fs.existsSync(`${youngOrphan}.owner`));
  assert.ok(fs.existsSync(`${live}.owner`));
  assert.ok(fs.existsSync(`${foreignName}.owner`));
  assert.deepEqual(result.removed.map((p) => path.basename(p)), [path.basename(`${orphan}.owner`)]);
});

// 4 ---------------------------------------------------------------------------------------------------------

test("4. liveness is asked once per pid; the age is a selector, and `minAgeMs` moves it", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "probe-repo");
  const pid = deadPid();
  const claim = ownerLine(thisOwner().host, pid);
  const a = folder(own, tmp, "a", { claim });
  const b = folder(own, tmp, "b", { claim });
  const fresh = folder(own, tmp, "fresh", { claim, young: true });
  const asked = [];
  const probe = (p) => { asked.push(p); return { alive: false }; };

  const first = sweepLeftovers({ repo, tmp, probe });
  assert.deepEqual(namesOf(first.removed), namesOf([a, b]));
  assert.deepEqual(asked, [pid], "one question for three folders of one owner");
  assert.equal(MIN_AGE_MS, 10 * 60_000);
  assert.deepEqual(reasonsOf(first), { [path.basename(fresh)]: "young" });

  const second = sweepLeftovers({ repo, tmp, probe, minAgeMs: 0 });
  assert.deepEqual(namesOf(second.removed), namesOf([fresh]));
});

// 5 ---------------------------------------------------------------------------------------------------------

test("5. a sweep that cannot list worktrees reports an error, never throws, and still collects folders", (t) => {
  const { own, work, tmp } = arena(t);
  const notARepo = ownedDir(own, "not-a-repo", { parent: work });
  const dead = folder(own, tmp, "dead", { claim: deadOwnerLine() });
  const wt = worktree(own, ownedRepo(own, work, "real-repo"), tmp, "stray", { claim: deadOwnerLine() });

  let result;
  assert.doesNotThrow(() => { result = sweepLeftovers({ repo: notARepo, tmp }); });

  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /worktree/);
  assert.deepEqual(namesOf(result.removed), namesOf([dead]));
  assert.equal(reasonsOf(result)[path.basename(wt)], "other clone", "a tree its repository did not list is another clone's");
  assert.doesNotThrow(() => sweepLeftovers({ repo: path.join(work, "does-not-exist"), tmp: path.join(work, "no-tmp") }));
});

// 6 ---------------------------------------------------------------------------------------------------------

test("6. runWithSweep: a sweep that throws never changes the exit code, and says so", async () => {
  for (const status of [0, 3]) {
    const spawned = [];
    let code;
    const lines = await stderrOf(() => {
      code = runWithSweep(["--x"], {
        sweep: () => { throw new Error("the sweep blew up"); },
        spawn: (file, args) => { spawned.push([file, args]); return { status, signal: null }; },
        repo: here,
      });
    });
    assert.equal(code, status);
    assert.equal(spawned.length, 1, "the suite still runs");
    assert.equal(lines.length, 1);
    assert.match(lines[0], /^run-tests: leftovers/);
    assert.match(lines[0], /the sweep blew up/);
  }
});

test("7. runWithSweep: one report line, one more per error, and the repository is passed through", async () => {
  const asked = [];
  const lines = await stderrOf(() => {
    runWithSweep([], {
      sweep: (options) => { asked.push(options); return { removed: ["a", "b"], preserved: [{ path: "c", reason: "live" }], errors: ["git said no"] }; },
      spawn: () => ({ status: 0, signal: null }),
      repo: "REPO",
    });
  });
  assert.deepEqual(asked, [{ repo: "REPO" }]);
  assert.deepEqual(lines, ["run-tests: leftovers — removed 2, preserved 1", "run-tests: leftovers error: git said no"]);
});

test("8. runWithSweep: nothing found, nothing written", async () => {
  let code;
  const lines = await stderrOf(() => {
    code = runWithSweep([], { sweep: () => ({ removed: [], preserved: [], errors: [] }), spawn: () => ({ status: 0, signal: null }), repo: here });
  });
  assert.deepEqual(lines, []);
  assert.equal(code, 0);
});

test("9. runWithSweep: the sweep runs before the suite", () => {
  const order = [];
  runWithSweep([], { sweep: () => { order.push("sweep"); return { removed: [], preserved: [], errors: [] }; }, spawn: () => { order.push("suite"); return { status: 0, signal: null }; }, repo: here });
  assert.deepEqual(order, ["sweep", "suite"]);
});

test("10. the real entry point sweeps the temp root it is given, reports once, and leaves with the suite's code", (t) => {
  const { own, work, tmp } = arena(t);
  const dead = folder(own, tmp, "entry-dead", { claim: deadOwnerLine() });
  const live = folder(own, tmp, "entry-live", { claim: formatOwner(thisOwner()) + "\n" });
  const suite = path.join(work, "trivial.test.mjs");
  fs.writeFileSync(suite, `import { test } from "node:test";\ntest("trivial", () => {});\n`);
  // The child's temp root is the private one: `os.tmpdir()` reads TMPDIR on POSIX and TEMP/TMP on Windows.
  const env = { ...process.env, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
  const run = spawnSync(process.execPath, [path.join(here, "run-tests.mjs"), suite], { env, encoding: "utf8", timeout: 120_000 });

  assert.equal(run.status, 0, run.stderr);
  assert.equal(fs.existsSync(dead), false);
  assert.ok(fs.existsSync(live));
  assert.match(run.stderr, /^run-tests: leftovers — removed 1, preserved 1$/m);
});
