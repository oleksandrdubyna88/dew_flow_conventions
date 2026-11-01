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
import cryptoDefault from "node:crypto";
import fsDefault from "node:fs";
import * as fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import * as path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { git } from "./lib/git.mjs";
import { sweepLeftovers, MIN_AGE_MS } from "./lib/leftovers-sweep.mjs";
import {
  cleanupScope, formatLegacyOwner, formatOwner, gitdirOf, ownedDir, ownedName, ownedWorktree, processProbe, removeQuietly, thisOwner, thisOwnerToken,
} from "./lib/owned.mjs";
import { assertNoSuchProcess, unmatchablePid } from "./lib/unmatchable-pid.mjs";
import { REPO_ROOT, runWithSweep } from "./run-tests.mjs";

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

/**
 * Dead is NEVER taken from the pid of a child that exited: the OS hands that number to the next process (Windows did,
 * mid-suite), and a test that is red once in fifteen runs is a test nobody trusts. A sweep that goes through the
 * `probe` seam is TOLD that `PRETEND_DEAD` is gone; the one scenario whose sweep runs in a child process (10) cannot
 * be told, so it uses a pid no process can have (`lib/unmatchable-pid.mjs`) with the premise asserted around the run.
 */
const PRETEND_DEAD = 4242;
const deadProbe = (pid) => (pid === PRETEND_DEAD ? { state: "dead" } : processProbe(pid));

const OWNER = thisOwnerToken();
const nsPart = thisOwner().ns === undefined ? "" : `:1:${thisOwner().ns}`; // a Linux record carries its start and pid namespace
const ownerLine = (host, pid) => `${OWNER}:${host}:${pid}${nsPart}\n`;
const deadOwnerLine = () => ownerLine(thisOwner().host, PRETEND_DEAD);

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

/** Run `fn` with `crypto.randomBytes(4)` drawing `hexes` in turn (every other call untouched): the quarantine names are known in advance. */
function withDrawnSuffixes(hexes, fn) {
  const original = cryptoDefault.randomBytes;
  const queue = [...hexes];
  cryptoDefault.randomBytes = (size, ...rest) => (size === 4 && queue.length > 0 ? Buffer.from(queue.shift(), "hex") : original(size, ...rest));
  syncBuiltinESMExports();
  try {
    return fn();
  } finally {
    cryptoDefault.randomBytes = original;
    syncBuiltinESMExports();
  }
}

const quarantineAs = (tmp, victim, hex) => path.join(tmp, `.${path.basename(victim)}.teststodelete-quarantine-${process.pid}-${hex}`);

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

  const killed = (pid) => (pid === child.pid ? { state: "dead" } : processProbe(pid)); // told, not asked: the pid may already be someone else's
  const result = sweepLeftovers({ repo, tmp, probe: killed });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([made.dir, made.worktree]));
  assert.equal(fs.existsSync(made.dir), false);
  assert.equal(fs.existsSync(`${made.dir}.owner`), false, "the sibling claim goes with its folder");
  assert.equal(fs.existsSync(made.worktree), false);
  assert.equal(listed(repo).includes(path.resolve(made.worktree).toLowerCase()), false, "no longer listed");
  assert.equal(fs.readFileSync(sentinelFile, "utf8"), "still here", "the link was unlinked, never followed");
});

// 2 ---------------------------------------------------------------------------------------------------------

test("2. a resource that may belong to a running run survives, with its reason; the unmarked old one is listed, never removed", (t) => {
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

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.removed, [], "nothing here is provably abandoned: an unmarked folder is nobody's the helper knows, so it is listed");
  assert.deepEqual(reasonsOf(result), {
    [path.basename(live)]: "live",
    [path.basename(foreign)]: "foreign host",
    [path.basename(unreadable)]: "unreadable",
    [path.basename(young)]: "young",
    [path.basename(unmarked)]: "unmarked",
    [path.basename(dotGitDir)]: "unmarked",
    [path.basename(missingGitdir)]: "other clone",
    [path.basename(mine)]: "live",
    [path.basename(other)]: "other clone",
  });
  assert.deepEqual(result.listed.filter((line) => line.startsWith("unmarked:")).sort(),
    [`unmarked: folder ${path.basename(dotGitDir)}`, `unmarked: folder ${path.basename(unmarked)}`].sort());
  for (const kept of [live, foreign, unreadable, young, unmarked, dotGitDir, missingGitdir, mine, other]) assert.ok(fs.existsSync(kept), kept);
  assert.ok(listed(repo2).includes(path.resolve(other).toLowerCase()), "the other clone still lists its own tree");
  assert.ok(listed(repo).includes(path.resolve(mine).toLowerCase()));
});

test("2b. a dead-owned worktree of this repository is removed; an unmarked old one is listed and stays; a bare `locked` is unreadable", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "wt-repo");
  const unmarked = worktree(own, repo, tmp, "unmarked", { claim: null });
  const dead = worktree(own, repo, tmp, "dead", { claim: deadOwnerLine() });
  const bare = worktree(own, repo, tmp, "bare-lock", { claim: "added with --lock\n" });

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([dead]));
  assert.deepEqual(reasonsOf(result), { [path.basename(bare)]: "unreadable", [path.basename(unmarked)]: "unmarked" });
  assert.deepEqual(listed(repo).map((p) => path.basename(p)).filter((n) => n.toLowerCase().startsWith("teststo" + "delete") && !n.toLowerCase().startsWith(`testsToDelete-${OWNER}-conventions-wt-repo-`.toLowerCase())).sort(),
    [path.basename(bare).toLowerCase(), path.basename(unmarked).toLowerCase()].sort());
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
  const untouched = [`x-testsToDelete-${OWNER}-conventions-a`, `testsToDelete-${OWNER}-other-a-123456`, `testsToDelete${OWNER}-conventions-a`, `testsToDelete-${OWNER}-conventionsx-a-123456`].map(plant);
  const upper = plant(`TESTSTODELETE-${OWNER.toUpperCase()}-CONVENTIONS-a-xyz123`);
  const underscore = plant(`teststodelete_${OWNER}_conventions_a_xyz123`);

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe });

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
  const foreignName = path.join(tmp, `testsToDelete-${OWNER}-other-orphan-123456`);
  fs.writeFileSync(`${foreignName}.owner`, deadOwnerLine());
  setOld(`${foreignName}.owner`);

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe });

  assert.equal(fs.existsSync(`${orphan}.owner`), false);
  assert.ok(fs.existsSync(`${youngOrphan}.owner`));
  assert.ok(fs.existsSync(`${live}.owner`));
  assert.ok(fs.existsSync(`${foreignName}.owner`));
  assert.deepEqual(result.removed.map((p) => path.basename(p)), [path.basename(`${orphan}.owner`)]);
});

test("3c. an orphan claim is judged by its owner like any claim: gone goes; live, foreign, unknown and unreadable stay (claim-first helpers)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "orphan-owner-repo");
  const claim = (what, text) => {
    const target = path.join(tmp, ownedName(what));
    fs.writeFileSync(`${target}.owner`, text);
    setOld(`${target}.owner`);
    return `${target}.owner`;
  };
  const gone = claim("o-gone", deadOwnerLine());
  const live = claim("o-live", formatOwner(thisOwner()) + "\n");
  const foreign = claim("o-foreign", ownerLine("elsewhere@linux", PRETEND_DEAD));
  const garbled = claim("o-garbled", "not an owner\n");
  const empty = claim("o-empty", "");

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.removed.map((p) => path.basename(p)), [path.basename(gone)], "only the claim whose process is gone is removed");
  for (const kept of [live, foreign, garbled, empty]) assert.ok(fs.existsSync(kept), `${path.basename(kept)} must stay`);
  assert.deepEqual(result.preserved.map((entry) => entry.reason).sort(), ["foreign host", "live", "unreadable", "unreadable"], JSON.stringify(result.preserved));
});

// 4 ---------------------------------------------------------------------------------------------------------

test("4. liveness is asked once per pid; the age is a selector, and `minAgeMs` moves it", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "probe-repo");
  const pid = PRETEND_DEAD;
  const claim = ownerLine(thisOwner().host, pid);
  const a = folder(own, tmp, "a", { claim });
  const b = folder(own, tmp, "b", { claim });
  const fresh = folder(own, tmp, "fresh", { claim, young: true });
  const asked = [];
  const probe = (p) => { asked.push(p); return { state: "dead" }; };

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
  assert.doesNotThrow(() => { result = sweepLeftovers({ repo: notARepo, tmp, probe: deadProbe }); });

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

test("10. the real entry point sweeps the temp root AND the repository it is given, reports once, and leaves with the suite's code", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "entry-repo");
  const unmatchable = ownerLine(thisOwner().host, unmatchablePid());
  const dead = folder(own, tmp, "entry-dead", { claim: unmatchable });
  const live = folder(own, tmp, "entry-live", { claim: formatOwner(thisOwner()) + "\n" });
  const listedDead = worktree(own, repo, tmp, "entry-wt", { claim: unmatchable }); // only the repository the runner is POINTED at lists it
  // What a concurrent test makes in THIS checkout: a young, prefixed worktree. It must not reach the report below.
  const bystander = ownedWorktree(t, REPO_ROOT, "entry-bystander");
  const suite = path.join(work, "trivial.test.mjs");
  fs.writeFileSync(suite, `import { test } from "node:test";\ntest("trivial", () => {});\n`);
  // The child's temp root is the private one: the OS temp-folder lookup reads TMPDIR on POSIX and TEMP/TMP on Windows.
  const env = { ...process.env, TMPDIR: tmp, TEMP: tmp, TMP: tmp, RUN_TESTS_REPO_ROOT: repo };
  assertNoSuchProcess(unmatchablePid());
  const run = spawnSync(process.execPath, [path.join(here, "run-tests.mjs"), suite], { env, encoding: "utf8", timeout: 120_000 });
  assertNoSuchProcess(unmatchablePid()); // the premise held for the whole run

  assert.equal(run.status, 0, run.stderr);
  assert.equal(fs.existsSync(dead), false, run.stderr);
  assert.equal(fs.existsSync(listedDead), false, `the worktree the pointed-at repository lists is removed\n${run.stderr}`);
  assert.ok(fs.existsSync(live), run.stderr);
  assert.ok(fs.existsSync(bystander.path), `a worktree of the checkout is not the sweep's business when it is pointed elsewhere\n${run.stderr}`);
  assert.match(run.stderr, /^run-tests: leftovers — removed 2, preserved 1$/m);
});

test("10b. sweepRepoRoot is this checkout unless RUN_TESTS_REPO_ROOT names another, and a relative one is resolved", () => {
  const out = (value) => spawnSync(process.execPath, ["--input-type=module", "-e",
    `const { sweepRepoRoot } = await import(${JSON.stringify(pathToFileURL(path.join(here, "run-tests.mjs")).href)}); process.stdout.write(sweepRepoRoot());`],
  { env: { ...process.env, RUN_TESTS_REPO_ROOT: value }, encoding: "utf8", timeout: 60_000, cwd: here }).stdout;
  assert.equal(out(""), path.resolve(here, ".."), "empty means unset");
  assert.equal(out(path.join(here, "fixtures")), path.join(here, "fixtures"));
  assert.equal(out("fixtures"), path.join(here, "fixtures"), "relative to the working directory");
});

// 11 --------------------------------------------------------------------------------------------------------

/** A prefixed folder of ANOTHER owner in `tmp`: the name and its claim say `owner`; `claim` overrides the record text. */
function folderOf(tmp, owner, what, { claim, old = true } = {}) {
  const dir = path.join(tmp, `testsToDelete-${owner}-conventions-${what}-abc123`);
  fs.mkdirSync(dir);
  fs.writeFileSync(`${dir}.owner`, claim ?? `${owner}:${thisOwner().host}:${PRETEND_DEAD}${nsPart}\n`);
  if (old) setOld(dir);
  return dir;
}

test("11. two users, one repository: the other owner's folders are listed as foreign and never touched, even dead", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "two-users-repo");
  const mine = folder(own, tmp, "mine", { claim: deadOwnerLine() });
  const theirs = folderOf(tmp, "u424242", "theirs");
  const theirsToo = folderOf(tmp, "w42", "theirs-too");

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([mine]));
  for (const kept of [theirs, theirsToo]) assert.ok(fs.existsSync(kept) && fs.existsSync(`${kept}.owner`), `${kept} must be untouched`);
  assert.deepEqual(result.listed.filter((line) => line.startsWith("foreign:")).sort(), [
    `foreign: folder ${path.basename(theirs)} — owner u424242`,
    `foreign: folder ${path.basename(theirsToo)} — owner w42`,
  ].sort());
  assert.deepEqual(result.preserved, [], "another owner's folder is listed, not judged");
});

// 12 --------------------------------------------------------------------------------------------------------

test("12. a forged owner segment (my token in the name, another uid on the folder) is preserved `foreign-uid`", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "forged-repo");
  const forged = folder(own, tmp, "forged", { claim: deadOwnerLine() }); // looks exactly like a dead claim of mine
  const real = folder(own, tmp, "real", { claim: deadOwnerLine() });
  const kernel = (target) => path.resolve(target).toLowerCase() !== path.resolve(forged).toLowerCase(); // the kernel says another uid owns `forged`

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, mine: kernel });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([real]), "only what the kernel agrees is mine");
  assert.deepEqual(reasonsOf(result), { [path.basename(forged)]: "foreign-uid" });
  assert.ok(fs.existsSync(forged) && fs.existsSync(`${forged}.owner`));
  assert.deepEqual(result.listed, [`foreign: folder ${path.basename(forged)} — owner ${OWNER}`]);
});

// 13 --------------------------------------------------------------------------------------------------------

test("13. an unmarked owner-form folder older than the window is listed, never removed — age is no authority", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "unmarked-repo");
  const old = folder(own, tmp, "unmarked-old", { claim: null });
  const young = folder(own, tmp, "unmarked-young", { claim: null, young: true });

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe });

  assert.deepEqual(result.removed, []);
  assert.ok(fs.existsSync(old) && fs.existsSync(young));
  assert.deepEqual(result.listed, [`unmarked: folder ${path.basename(old)}`], "a young one is silent: it may be a resource between creation and claim");
  assert.deepEqual(reasonsOf(result), { [path.basename(old)]: "unmarked", [path.basename(young)]: "young" });
  const everything = sweepLeftovers({ repo, tmp, probe: deadProbe, minAgeMs: 0 });
  assert.deepEqual(everything.removed, [], "even with no window at all");
});

// 14 --------------------------------------------------------------------------------------------------------

test("14. (macOS, Windows reader) a legacy folder of my uid with a dead legacy record is collected; one of another uid, a live one and an unreadable one are listed with the command", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "legacy-repo");
  const plant = (what, claim) => {
    const dir = path.join(tmp, `${"testsTo" + "Delete"}-conventions-${what}-abc123`); // the form before the owner segment, spelled in two pieces
    fs.mkdirSync(dir);
    if (claim !== null) fs.writeFileSync(`${dir}.owner`, claim);
    setOld(dir);
    return dir;
  };
  const dead = plant("lg-dead", `${thisOwner().host}:${PRETEND_DEAD}\n`);
  const strangers = plant("lg-stranger", `${thisOwner().host}:${PRETEND_DEAD}\n`);
  const live = plant("lg-live", `${formatLegacyOwner(thisOwner())}\n`);
  const garbled = plant("lg-garbled", "not an owner\n");
  const none = plant("lg-none", null);
  const kernel = (target) => path.resolve(target).toLowerCase() !== path.resolve(strangers).toLowerCase();

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, mine: kernel, platform: "darwin" }); // a reader whose records carry no pid namespace

  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([dead]), "kernel uid = me AND an old-grammar record that is gone");
  for (const kept of [strangers, live, garbled, none]) assert.ok(fs.existsSync(kept), kept);
  const lines = result.listed.filter((line) => line.startsWith("legacy:"));
  assert.equal(lines.length, 4);
  for (const kept of [strangers, live, garbled, none]) {
    const line = lines.find((entry) => entry.includes(path.basename(kept)));
    assert.ok(line !== undefined && line.includes(" — remove with: ") && line.includes(kept), `${path.basename(kept)}: ${JSON.stringify(lines)}`);
  }
});

test("14L. (Linux reader) a legacy record has no pid namespace, so it is unknown: a dead-looking legacy folder is LISTED, never removed", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "legacy-linux-repo");
  const dir = path.join(tmp, `${"testsTo" + "Delete"}-conventions-lg-linux-abc123`);
  fs.mkdirSync(dir);
  fs.writeFileSync(`${dir}.owner`, `${thisOwner().host}:${PRETEND_DEAD}
`); // a pid that may live in a container whose pid space we cannot see
  setOld(dir);
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, platform: "linux" });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.removed, []);
  assert.ok(fs.existsSync(dir) && fs.existsSync(`${dir}.owner`));
  assert.deepEqual(reasonsOf(result), { [path.basename(dir)]: "legacy" });
  assert.equal(result.listed.filter((line) => line.startsWith("legacy:")).length, 1);
});

test("14F. a legacy claim another uid wrote is no evidence: the folder is listed, never removed (Linux and macOS and Windows alike)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "legacy-fgn-repo");
  const dir = path.join(tmp, `${"testsTo" + "Delete"}-conventions-lg-forged-abc123`);
  fs.mkdirSync(dir);
  fs.writeFileSync(`${dir}.owner`, `${thisOwner().host}:${PRETEND_DEAD}
`);
  setOld(dir);
  const claimIsStrangers = (target) => !target.endsWith(".owner");
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, mine: claimIsStrangers, platform: "darwin" });
  assert.deepEqual(result.removed, []);
  assert.ok(fs.existsSync(dir));
  assert.deepEqual(reasonsOf(result), { [path.basename(dir)]: "legacy" });
});

test("14O. a legacy claim with no folder is listed with a command that removes that one file, not the claim's own claim", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "legacy-orphan-repo");
  const claim = path.join(tmp, `${"testsTo" + "Delete"}-conventions-lg-orphan-abc123.owner`);
  fs.writeFileSync(claim, `${thisOwner().host}:${PRETEND_DEAD}\n`);
  setOld(claim);
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, platform: "linux" }); // a Linux reader keeps every legacy record
  assert.deepEqual(result.removed, []);
  const lines = result.listed.filter((line) => line.startsWith("legacy: claim"));
  const quoted = win32 ? `'${claim.replaceAll("'", "''")}'` : `'${claim}'`;
  assert.deepEqual(lines.map((line) => line.split(" — remove with: ")[1]), [win32 ? `Remove-Item -Force ${quoted}` : `rm -f -- ${quoted}`], JSON.stringify(result.listed));
});

test("14G. a claim that is a FIFO is never opened: the sweep does not hang and the folder is kept", { timeout: 120_000, skip: win32 ? "no FIFO on Windows" : false }, (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "fifo-repo");
  const dir = path.join(tmp, `${"testsTo" + "Delete"}-conventions-lg-fifo-abc123`);
  fs.mkdirSync(dir);
  const made = spawnSync("mkfifo", [`${dir}.owner`]);
  if (made.status !== 0) { t.skip("mkfifo is not available"); return; }
  setOld(dir);
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, platform: "darwin" });
  assert.deepEqual(result.removed, []);
  assert.ok(fs.existsSync(dir));
  const ownerForm = path.join(tmp, ownedName("fifo-own"));
  fs.mkdirSync(ownerForm);
  spawnSync("mkfifo", [`${ownerForm}.owner`]);
  setOld(ownerForm);
  assert.deepEqual(sweepLeftovers({ repo, tmp, probe: deadProbe }).removed, [], "an owner-form claim that is a FIFO is unreadable too");
});

// 15 --------------------------------------------------------------------------------------------------------

test("15. replacement between the verdict and the removal: a folder swapped for another inode is kept and named", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "replace-repo");
  const victim = folder(own, tmp, "swapped", { claim: deadOwnerLine() });
  const moved = `${victim}-moved`;
  let swapped = false;
  const hooks = {
    afterVerdict: (target) => {
      if (swapped || path.resolve(target) !== path.resolve(victim)) return;
      swapped = true;
      fs.renameSync(victim, moved); // the original goes away…
      fs.mkdirSync(victim); // …and a different folder takes its name, under the same claim
      fs.writeFileSync(path.join(victim, "precious.txt"), "not abandoned\n");
    },
  };
  own.after(() => removeQuietly(moved));

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, hooks });

  assert.deepEqual(result.errors, []);
  assert.equal(swapped, true, "the seam fired");
  assert.deepEqual(result.removed, []);
  assert.deepEqual(reasonsOf(result), { [path.basename(victim)]: "replaced" });
  assert.equal(fs.readFileSync(path.join(victim, "precious.txt"), "utf8"), "not abandoned\n");
  assert.ok(fs.existsSync(`${victim}.owner`), "the claim stays with what it was claimed for");
});

test("15a. the identity is captured BEFORE the verdict: a folder swapped after the capture is kept even though the new one reads as abandoned too", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "capture-repo");
  const victim = folder(own, tmp, "captured", { claim: deadOwnerLine() });
  const moved = `${victim}-moved`;
  let swapped = false;
  const hooks = {
    afterCapture: (target) => {
      if (swapped || path.resolve(target) !== path.resolve(victim)) return;
      swapped = true;
      fs.renameSync(victim, moved);
      fs.mkdirSync(victim); // another folder under the same name and the same (dead) claim: the verdict reads the same text
      setOld(victim);
    },
  };
  own.after(() => removeQuietly(moved));
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, hooks });
  assert.equal(swapped, true);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(reasonsOf(result), { [path.basename(victim)]: "replaced" });
  assert.ok(fs.existsSync(victim));
});

test("15b. a folder that changes between the rename and the second look is put back", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "rename-repo");
  const victim = folder(own, tmp, "renamed", { claim: deadOwnerLine() });
  const hooks = { afterRename: () => fs.writeFileSync(`${victim}.owner`, `${formatOwner(thisOwner())}\n`) }; // the run came back to life and re-claimed
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, hooks });
  assert.deepEqual(result.removed, []);
  assert.deepEqual(reasonsOf(result), { [path.basename(victim)]: "replaced" });
  assert.ok(fs.existsSync(victim), "renamed back under its own name");
  assert.equal(fs.readdirSync(tmp).filter((name) => name.startsWith(".")).length, 0, "no quarantine is left behind");
});

// 16 --------------------------------------------------------------------------------------------------------

test("16. a quarantine left by a killed sweep is restored under its name when free, and reported `quarantine-conflict` when taken — nothing is overwritten", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "quarantine-repo");
  const quarantineOf = (name) => path.join(tmp, `.${name}.teststodelete-quarantine-${PRETEND_DEAD}-0a1b2c3d`);
  const freeName = path.basename(folder(own, tmp, "q-free", { claim: formatOwner(thisOwner()) + "\n" }));
  const free = path.join(tmp, freeName);
  fs.renameSync(free, quarantineOf(freeName)); // the sweep died after the rename
  fs.writeFileSync(path.join(quarantineOf(freeName), "kept.txt"), "was in the folder\n");
  const takenName = path.basename(folder(own, tmp, "q-taken", { claim: formatOwner(thisOwner()) + "\n" }));
  fs.renameSync(path.join(tmp, takenName), quarantineOf(takenName));
  fs.mkdirSync(path.join(tmp, takenName)); // somebody made a folder under the name since
  fs.writeFileSync(path.join(tmp, takenName, "theirs.txt"), "do not overwrite\n");
  fs.writeFileSync(path.join(quarantineOf(takenName), "mine.txt"), "stays in quarantine\n");

  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, now: Date.now() + 2 * MIN_AGE_MS }); // both stamps of the quarantine are past the window

  assert.deepEqual(result.errors, []);
  assert.equal(fs.readFileSync(path.join(free, "kept.txt"), "utf8"), "was in the folder\n", "restored under its own name");
  assert.equal(fs.existsSync(quarantineOf(freeName)), false);
  assert.equal(fs.readFileSync(path.join(tmp, takenName, "theirs.txt"), "utf8"), "do not overwrite\n", "never over an existing folder");
  assert.equal(fs.readFileSync(path.join(quarantineOf(takenName), "mine.txt"), "utf8"), "stays in quarantine\n");
  assert.ok(result.preserved.some((entry) => entry.path === quarantineOf(takenName) && entry.reason === "quarantine-conflict"), JSON.stringify(result.preserved));
});

test("16b. a quarantine whose renamer is still alive is left alone", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "q-alive-repo");
  const name = path.basename(folder(own, tmp, "q-alive", { claim: formatOwner(thisOwner()) + "\n" }));
  const quarantine = path.join(tmp, `.${name}.teststodelete-quarantine-${process.pid}-0a1b2c3d`);
  fs.renameSync(path.join(tmp, name), quarantine);
  const result = sweepLeftovers({ repo, tmp });
  assert.ok(fs.existsSync(quarantine), "a sweep in progress owns it");
  assert.equal(fs.existsSync(path.join(tmp, name)), false);
  assert.deepEqual(result.errors, []);
});

test("16c. a YOUNG quarantine is not restored although its renamer looks dead (a janitor in another pid namespace has a pid this process cannot see); an old one is", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "q-young-repo");
  const name = path.basename(folder(own, tmp, "q-young", { claim: formatOwner(thisOwner()) + "\n" }));
  const quarantine = path.join(tmp, `.${name}.teststodelete-quarantine-${PRETEND_DEAD}-0a1b2c3d`);
  fs.renameSync(path.join(tmp, name), quarantine); // renamed just now: ctime and mtime are now
  const young = sweepLeftovers({ repo, tmp, probe: deadProbe });
  assert.ok(fs.existsSync(quarantine), "a rename younger than the window may be another janitor's, still deleting");
  assert.equal(fs.existsSync(path.join(tmp, name)), false, "nothing was put back");
  assert.deepEqual(young.errors, []);
  const stale = sweepLeftovers({ repo, tmp, probe: deadProbe, now: Date.now() + 2 * MIN_AGE_MS });
  assert.equal(fs.existsSync(path.join(tmp, name)), true, "past the window the same quarantine is put back");
  assert.equal(fs.existsSync(quarantine), false);
  assert.deepEqual(stale.errors, []);
});

test("16d. a restore that fails after the name was reserved removes its own empty placeholder and keeps the quarantine listed; a placeholder somebody filled stays", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "q-placeholder-repo");
  const quarantineOf = (name) => path.join(tmp, `.${name}.teststodelete-quarantine-${PRETEND_DEAD}-0a1b2c3d`);
  const names = ["q-ph-empty", "q-ph-filled"].map((what) => path.basename(folder(own, tmp, what, { claim: formatOwner(thisOwner()) + "\n" })));
  for (const name of names) fs.renameSync(path.join(tmp, name), quarantineOf(name));
  const hooks = {
    afterReserve: (original, quarantined) => {
      if (original.endsWith(names[0])) { fs.rmSync(quarantined, { recursive: true }); fs.writeFileSync(quarantined, "not a folder\n"); } // the rename onto the placeholder now fails (ENOTDIR)
      else fs.writeFileSync(path.join(original, "theirs.txt"), "put there since\n"); // the placeholder is not empty any more (ENOTEMPTY)
    },
  };
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, now: Date.now() + 2 * MIN_AGE_MS, hooks });
  assert.deepEqual(result.errors, []);
  assert.equal(fs.existsSync(path.join(tmp, names[0])), false, "the placeholder this restore made is removed while it is its own and empty");
  assert.ok(fs.existsSync(quarantineOf(names[0])), "and the quarantine is still there");
  assert.equal(fs.readFileSync(path.join(tmp, names[1], "theirs.txt"), "utf8"), "put there since\n", "a placeholder with something in it is never touched");
  assert.ok(fs.existsSync(quarantineOf(names[1])));
  for (const name of names) assert.ok(result.preserved.some((entry) => entry.path === quarantineOf(name) && entry.reason === "quarantine-conflict"), `${name} stays listed: ${JSON.stringify(result.preserved)}`);
});

// 16e-16h (F17: the move into quarantine never lands on something that is already there) ---------------------------

test("16e. an empty directory at the drawn quarantine name survives the sweep, and the folder is quarantined under a fresh name (F17)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f17-taken-repo");
  const victim = folder(own, tmp, "f17-taken", { claim: deadOwnerLine() });
  const taken = quarantineAs(tmp, victim, "aaaaaaaa");
  fs.mkdirSync(taken); // appeared at the drawn name: rename(2) would replace an EMPTY directory
  const before = fs.lstatSync(taken, { bigint: true });
  const result = withDrawnSuffixes(["aaaaaaaa", "bbbbbbbb"], () => sweepLeftovers({ repo, tmp, probe: deadProbe }));
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.removed, [victim], "removed through the second draw");
  const after = fs.lstatSync(taken, { bigint: true });
  assert.equal(after.ino, before.ino, "the directory that was there is the same directory");
  assert.equal(fs.existsSync(quarantineAs(tmp, victim, "bbbbbbbb")), false);
  own.after(() => fs.rmSync(taken, { recursive: true, force: true }));
});

test("16f. five taken names in a row keep the folder where it is, with one error, and destroy nothing (F17)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f17-five-repo");
  const victim = folder(own, tmp, "f17-five", { claim: deadOwnerLine() });
  const hexes = ["a1a1a1a1", "a2a2a2a2", "a3a3a3a3", "a4a4a4a4", "a5a5a5a5"];
  const planted = hexes.map((hex) => quarantineAs(tmp, victim, hex));
  for (const taken of planted) { fs.mkdirSync(taken); own.after(() => fs.rmSync(taken, { recursive: true, force: true })); }
  const result = withDrawnSuffixes(hexes, () => sweepLeftovers({ repo, tmp, probe: deadProbe }));
  assert.equal(result.errors.length, 1, JSON.stringify(result.errors));
  assert.match(result.errors[0], new RegExp(`cannot move ${victim.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} into quarantine: no free name in 5 draws — the folder is kept`));
  assert.deepEqual(result.removed, []);
  assert.ok(fs.existsSync(victim), "the folder stays under its own name");
  assert.ok(fs.existsSync(`${victim}.owner`), "and keeps its claim");
  for (const taken of planted) assert.ok(fs.existsSync(taken), `${path.basename(taken)} was not replaced`);
});

test("16g. a placeholder somebody filled before the rename is left as theirs, and the folder is quarantined under a fresh name (F17, ENOTEMPTY)", (t) => {
  if (win32) { t.skip("the placeholder is a POSIX reservation"); return; }
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f17-filled-repo");
  const victim = folder(own, tmp, "f17-filled", { claim: deadOwnerLine() });
  const first = quarantineAs(tmp, victim, "c1c1c1c1");
  let fired = 0;
  const hooks = { afterReserve: (placeholder) => { if (placeholder === first) { fired += 1; fs.writeFileSync(path.join(placeholder, "theirs.txt"), "put there since\n"); } } };
  const result = withDrawnSuffixes(["c1c1c1c1", "c2c2c2c2"], () => sweepLeftovers({ repo, tmp, probe: deadProbe, hooks }));
  own.after(() => fs.rmSync(first, { recursive: true, force: true }));
  assert.equal(fired, 1, "the quarantine move reserved its name");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.removed, [victim]);
  assert.equal(fs.readFileSync(path.join(first, "theirs.txt"), "utf8"), "put there since\n", "a filled placeholder is never removed");
});

test("16h. a placeholder swapped for another empty directory is never renamed onto and never removed (F17: the identity is re-checked)", (t) => {
  if (win32) { t.skip("the placeholder is a POSIX reservation"); return; }
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f17-swapped-repo");
  const victim = folder(own, tmp, "f17-swapped", { claim: deadOwnerLine() });
  const first = quarantineAs(tmp, victim, "d1d1d1d1");
  const aside = path.join(work, "swapped-aside");
  let theirs;
  const hooks = {
    afterReserve: (placeholder) => {
      if (placeholder !== first) return;
      fs.renameSync(placeholder, aside); // our placeholder goes away (its inode lives on, so the next one differs)…
      fs.mkdirSync(placeholder); // …and an empty directory that is not ours takes the name
      theirs = fs.lstatSync(placeholder, { bigint: true });
    },
  };
  const result = withDrawnSuffixes(["d1d1d1d1", "d2d2d2d2"], () => sweepLeftovers({ repo, tmp, probe: deadProbe, hooks }));
  own.after(() => { fs.rmSync(first, { recursive: true, force: true }); fs.rmSync(aside, { recursive: true, force: true }); });
  assert.notEqual(theirs, undefined, "the quarantine move reserved its name");
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.removed, [victim], "removed through the second draw");
  assert.equal(fs.lstatSync(first, { bigint: true }).ino, theirs.ino, "the directory that took the name is still there, untouched");
});

// 16i-16k (F19: the claim of a folder that sits in a quarantine is not an orphan's) ----------------------------------

test("16i. the claim of a folder that a live renamer holds in a quarantine is kept, and nothing is listed for it (F19)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f19-live-repo");
  const victim = folder(own, tmp, "f19-live", { claim: deadOwnerLine() });
  setOld(`${victim}.owner`);
  const quarantine = quarantineAs(tmp, victim, "0a1b2c3d"); // this process is the renamer: alive, so the quarantine is not restored
  fs.renameSync(victim, quarantine); // no folder at the name for the moment the sweep looks at its claim
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe });
  assert.ok(fs.existsSync(`${victim}.owner`), "the claim is still there for the restore or the removal that follows");
  assert.ok(fs.existsSync(quarantine));
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.preserved, []);
  assert.deepEqual(result.listed, []);
  assert.deepEqual(result.errors, []);
});

test("16j. a quarantine that appears after the pass's snapshot, before the claim is removed, keeps the claim (F19: a fresh check before the deletion)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f19-fresh-repo");
  const victim = folder(own, tmp, "f19-fresh", { claim: deadOwnerLine() });
  setOld(`${victim}.owner`);
  const aside = path.join(work, "fresh-aside");
  fs.renameSync(victim, aside); // no folder, no quarantine yet: a real orphan at the snapshot
  const quarantine = quarantineAs(tmp, victim, "0a1b2c3d");
  let asked = 0;
  const hooks = { beforeClaimRemoval: () => { asked += 1; fs.renameSync(aside, quarantine); } }; // a live sweep moves the folder in after the snapshot
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, hooks });
  own.after(() => removeQuietly(quarantine));
  assert.equal(asked, 1, "the claim was about to be removed");
  assert.ok(fs.existsSync(`${victim}.owner`), "the fresh look found the quarantine");
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.errors, []);
});

test("16k. the claim of a quarantine that stays `quarantine-conflict` is kept (F19)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f19-conflict-repo");
  const victim = folder(own, tmp, "f19-conflict", { claim: deadOwnerLine() });
  setOld(`${victim}.owner`);
  const quarantine = path.join(tmp, `.${path.basename(victim)}.teststodelete-quarantine-${PRETEND_DEAD}-0a1b2c3d`);
  fs.renameSync(victim, quarantine); // a killed sweep's quarantine
  const hooks = { afterReserve: (original, quarantined) => { fs.rmSync(quarantined, { recursive: true }); fs.writeFileSync(quarantined, "not a folder\n"); } }; // the restore fails: the quarantine stays
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, now: Date.now() + 2 * MIN_AGE_MS, hooks });
  assert.ok(result.preserved.some((entry) => entry.path === quarantine && entry.reason === "quarantine-conflict"), JSON.stringify(result.preserved));
  assert.ok(fs.existsSync(`${victim}.owner`), "its claim is not an orphan's");
  assert.deepEqual(result.removed, []);
});

test("16l. a folder restored under its name between the verdict and the claim removal keeps the claim (F19 round 1: the folder is looked at again)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f19-back-repo");
  const victim = folder(own, tmp, "f19-back", { claim: deadOwnerLine() });
  setOld(`${victim}.owner`);
  const aside = path.join(work, "back-aside");
  fs.renameSync(victim, aside); // no folder at the name, no quarantine: a real orphan at the snapshot
  const hooks = { beforeClaimRemoval: () => fs.renameSync(aside, victim) }; // the folder comes back under its own name
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, hooks });
  assert.ok(fs.existsSync(`${victim}.owner`), "its folder is there again: the claim is its claim");
  assert.ok(fs.existsSync(victim));
  assert.deepEqual(result.removed, []);
  assert.deepEqual(result.listed, []);
  assert.deepEqual(result.errors, []);
});

/** How many times `fs.readdirSync(dir)` is called while `fn` runs. */
function countListings(dir, fn) {
  let calls = 0;
  const original = fsDefault.readdirSync;
  fsDefault.readdirSync = (target, ...rest) => { if (path.resolve(String(target)) === path.resolve(dir)) calls += 1; return original(target, ...rest); };
  syncBuiltinESMExports();
  try { fn(); } finally { fsDefault.readdirSync = original; syncBuiltinESMExports(); }
  return calls;
}

test("16m. orphan claims do not each re-list the temp root: the listing is read again only when the root's mtime or ctime moved (F19 round 1)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f19-count-repo");
  const base = countListings(tmp, () => sweepLeftovers({ repo, tmp, probe: deadProbe }));
  const names = ["a", "b", "c", "d", "e"].map((what) => path.join(tmp, ownedName(`f19-count-${what}`)));
  for (const name of names) { fs.writeFileSync(`${name}.owner`, deadOwnerLine()); setOld(`${name}.owner`); }
  let result;
  const calls = countListings(tmp, () => { result = sweepLeftovers({ repo, tmp, probe: deadProbe }); });
  assert.equal(result.removed.length, 5, "all five orphans went");
  assert.equal(calls, base, `${calls} listings for five orphan claims, ${base} for none`);
});

test("16n. a quarantine that appears between two claims makes the next claim re-read the root and keeps that claim (F19 round 1)", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "f19-between-repo");
  const names = ["a", "b"].map((what) => path.join(tmp, ownedName(`f19-between-${what}`)));
  for (const name of names) { fs.writeFileSync(`${name}.owner`, deadOwnerLine()); setOld(`${name}.owner`); }
  const [first, second] = fs.readdirSync(tmp).filter((n) => n.endsWith(".owner")).sort().map((n) => path.join(tmp, n.slice(0, -6)));
  const quarantine = quarantineAs(tmp, second, "0a1b2c3d");
  let fired = false;
  const hooks = { beforeClaimRemoval: (claim) => { // runs once per claim, before its own check: plant the quarantine of the SECOND claim while the FIRST is checked
    if (fired || claim !== `${first}.owner`) return;
    fired = true;
    fs.mkdirSync(quarantine);
  } };
  own.after(() => fs.rmSync(quarantine, { recursive: true, force: true }));
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, hooks });
  assert.equal(fired, true);
  assert.deepEqual(result.removed, [`${first}.owner`]);
  assert.ok(fs.existsSync(`${second}.owner`), "the second claim's folder sits in a quarantine that appeared after the snapshot");
  assert.deepEqual(result.errors, []);
});

// 17 --------------------------------------------------------------------------------------------------------

test("17. a dead-owned WORKTREE is removed through git and its folder is never renamed", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "wt-git-repo");
  const dead = worktree(own, repo, tmp, "wt-dead", { claim: deadOwnerLine() });
  const renames = [];
  const original = fsDefault.renameSync;
  fsDefault.renameSync = (from, ...rest) => { renames.push(path.resolve(String(from))); return original(from, ...rest); };
  syncBuiltinESMExports();
  let gitdirAtVerdict = "";
  const hooks = { afterVerdict: (target) => { gitdirAtVerdict = gitdirOf(target); } };
  let result;
  try {
    result = sweepLeftovers({ repo, tmp, probe: deadProbe, hooks });
  } finally {
    fsDefault.renameSync = original;
    syncBuiltinESMExports();
  }
  assert.deepEqual(result.errors, []);
  assert.deepEqual(namesOf(result.removed), namesOf([dead]));
  assert.equal(renames.includes(path.resolve(dead)), false, "a worktree is never renamed: a rename breaks its gitdir pointers");
  assert.ok(gitdirAtVerdict !== "", "its gitdir still resolved at the verdict");
  assert.equal(listed(repo).includes(path.resolve(dead).toLowerCase()), false);
  assert.equal(fs.existsSync(dead), false);
});

test("17b. a worktree swapped for another folder after the verdict is kept", (t) => {
  const { own, work, tmp } = arena(t);
  const repo = ownedRepo(own, work, "wt-swap-repo");
  const dead = worktree(own, repo, tmp, "wt-swap", { claim: deadOwnerLine() });
  const aside = `${dead}-aside`;
  let swapped = false;
  const hooks = {
    afterVerdict: (target) => {
      if (swapped) return;
      swapped = true;
      const dotGit = fs.readFileSync(path.join(target, ".git"));
      fs.renameSync(target, aside); // the judged tree goes away…
      fs.mkdirSync(target); // …and another folder takes its name, with the same .git words
      fs.writeFileSync(path.join(target, ".git"), dotGit);
    },
  };
  own.after(() => removeQuietly(aside));
  const result = sweepLeftovers({ repo, tmp, probe: deadProbe, hooks });
  assert.equal(swapped, true);
  assert.deepEqual(result.removed, []);
  assert.deepEqual(reasonsOf(result), { [path.basename(dead)]: "replaced", [path.basename(aside)]: "other clone" }, "the judged tree, moved aside, is another clone's worktree to this sweep");
  assert.ok(fs.existsSync(dead));
});

test("18. run-tests prints the listed lines after the report line", async () => {
  const lines = await stderrOf(() => {
    runWithSweep([], {
      sweep: () => ({ removed: [], preserved: [{ path: "c", reason: "unmarked" }], listed: ["unmarked: folder c", "foreign: folder d — owner u7"], errors: [] }),
      spawn: () => ({ status: 0, signal: null }),
      repo: "REPO",
    });
  });
  assert.deepEqual(lines, ["run-tests: leftovers — removed 0, preserved 1", "run-tests: unmarked: folder c", "run-tests: foreign: folder d — owner u7"]);
});
