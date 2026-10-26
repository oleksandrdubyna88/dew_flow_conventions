#!/usr/bin/env node
/**
 * `tools/janitor.sh` and the SPELLING of a path — code-gate round 3 (findings 0, 1, 9, 17, 18, 20, 25, 30, 31).
 *
 * Under a default Git Bash run on Windows the same folder has three spellings: `find` over the default temp root
 * prints `/tmp/…`, git lists a worktree as `C:/…`, and a `TMPDIR` set by hand may read `C:/…` or `/c/…`. The
 * janitor must see ONE folder in all of them, or (a) a registered worktree is captured twice (once as `wt-git`, once
 * as `wt-dir`) and (b) the clone the janitor runs from is not recognised in the temp-root scan and is deleted.
 *
 * Every scenario therefore runs once per spelling the platform has: on Windows `/tmp/<leaf>` (the very form a
 * default, `TMPDIR`-unset run produces — `/tmp` is the user's temp root, so a private folder below it keeps the scan
 * private), `C:/<…>` and `/c/<…>`; elsewhere the plain path. A truly UNSET `TMPDIR` is not a scenario of its own: it makes the
 * script scan the REAL temp root (minutes, and other sessions' folders), and `find /tmp` there prints exactly the
 * `/tmp/<leaf>` spelling the first form already hands it.
 *
 * The harness is the one `janitor.test.mjs` uses in miniature (a real bash, a private `PATH`, a do-nothing `docker`),
 * kept apart because four coders extend the janitor's tests in parallel. A dead owner is a pid no query can match
 * (`lib/unmatchable-pid.mjs`), asserted before and after each run; scratch follows the rule under test.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { git } from "./lib/git.mjs";
import { assertNoSuchProcess, unmatchablePid } from "./lib/unmatchable-pid.mjs";
import {
  cleanupScope, formatOwner, ownedDir, ownedWorktree, processProbe, tempRoot, thisOwner, thisOwnerToken,
} from "./lib/owned.mjs";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "janitor.sh");
const win32 = process.platform === "win32";
const linux = process.platform === "linux";
const HOUR = 3_600_000;
const OLD = 3 * HOUR;
const TIMEOUT = 1_500_000; // a janitor run is slow on Windows (tens of seconds, minutes under load)
const COMMIT = ["-c", "user.name=Janitor test", "-c", "user.email=janitor@example.invalid", "-c", "commit.gpgsign=false",
  "commit", "--allow-empty", "-qm", "fixture"];
const LINUX_TOOLS = ["bash", "sed", "awk", "grep", "find", "head", "tr", "cut", "xargs", "git", "hostname", "uname", "date", "stat", "rm", "env", "readlink", "mv", "mkdir", "rmdir", "id", "sha256sum"];
const ME = thisOwnerToken(); // the caller's owner token: the janitor under test derives the same one from its own uid

// --- bash and PATH ---------------------------------------------------------------------------------------------

/** Git for Windows' bash on win32 (never WSL's under %SystemRoot%), `/bin/bash` elsewhere; `bash: ""` when absent. */
function locateBash() {
  if (!win32) return { bash: fs.existsSync("/bin/bash") ? "/bin/bash" : "", gitRoot: "" };
  const found = spawnSync("git", ["--exec-path"], { encoding: "utf8", windowsHide: true });
  if (found.status !== 0) return { bash: "", gitRoot: "" };
  const gitRoot = path.resolve(found.stdout.trim(), "..", "..", "..");
  const bash = path.join(gitRoot, "bin", "bash.exe");
  const systemRoot = (process.env.SystemRoot ?? process.env.WINDIR ?? "").toLowerCase();
  if (systemRoot !== "" && bash.toLowerCase().startsWith(systemRoot)) return { bash: "", gitRoot };
  return { bash: fs.existsSync(bash) ? bash : "", gitRoot };
}

const { bash: BASH, gitRoot: GIT_ROOT } = locateBash();
const slash = (p) => p.replaceAll("\\", "/");
const msys = (p) => slash(p).replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`);

/** The spellings of the private temp folder `tmp` that one platform can hand the script as `TMPDIR`. */
const SPELLINGS = win32 ? ["/tmp form", "C:/ form", "/c/ form"] : ["plain"];

function spell(tmp, spelling) {
  switch (spelling) {
    case "/tmp form": return `/tmp/${slash(path.relative(tempRoot(), tmp))}`; // what `find /tmp` prints under a default run
    case "C:/ form": return slash(tmp);
    case "/c/ form": return msys(tmp);
    default: return tmp;
  }
}

function pathFor(w) {
  const parts = [w.stubDir];
  if (win32) {
    parts.push(path.join(GIT_ROOT, "usr", "bin"), path.join(GIT_ROOT, "mingw64", "bin"), path.join(GIT_ROOT, "cmd"),
      path.join(process.env.SystemRoot ?? "C:\\Windows", "System32"));
  } else {
    parts.push(w.binDir);
  }
  return parts.join(path.delimiter);
}

const PROGRESS_LINE = /^janitor: (?:looking for testsToDelete resources|removed )/;

/** `tmpdir`: the TMPDIR text, or `null` to leave it UNSET. */
function runJanitor(w, { cwd, tmpdir, args = [] }) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^(path|git_.*|tmpdir|janitor_.*)$/i.test(key)) env[key] = value;
  }
  env.PATH = pathFor(w);
  env.JANITOR_MIN_AGE_MINUTES = "60";
  if (tmpdir !== null) env.TMPDIR = tmpdir;
  for (let i = 0; i < 5; i += 1) assertNoSuchProcess(unmatchablePid(i));
  const result = spawnSync(BASH, [slash(SCRIPT), ...args], { cwd, env, encoding: "utf8", timeout: 600_000, windowsHide: true });
  for (let i = 0; i < 5; i += 1) assertNoSuchProcess(unmatchablePid(i));
  const lines = (result.stderr ?? "").split(/\r?\n/).filter(Boolean);
  const progress = lines.filter((line) => PROGRESS_LINE.test(line)); // the capture-start line and one line per removal: not findings
  const stderr = lines.filter((line) => !PROGRESS_LINE.test(line));
  const stdout = (result.stdout ?? "").split(/\r?\n/).filter(Boolean);
  return { status: result.status, stdout, stderr, progress, text: [...stderr, ...stdout].join("\n"), error: result.error };
}

// --- the world -------------------------------------------------------------------------------------------------

function makeClone(dir) {
  fs.mkdirSync(dir, { recursive: true });
  git(dir, "init", "-q");
  git(dir, ...COMMIT);
  return dir;
}

function linkTools(binDir) {
  for (const tool of LINUX_TOOLS) {
    const found = spawnSync("sh", ["-c", `command -v ${tool}`], { encoding: "utf8" });
    assert.equal(found.status, 0, `the janitor needs \`${tool}\` and this machine has none`);
    fs.symlinkSync(found.stdout.trim(), path.join(binDir, tool));
  }
}

/** A world: a YOUNG clone the janitor sweeps, a do-nothing `docker`, a private PATH. `null` without a usable bash. */
function makeWorld(t) {
  if (BASH === "") {
    t.skip("Git for Windows bash not found");
    return null;
  }
  const scope = cleanupScope();
  t.after(() => scope.close());
  const roots = ownedDir(scope, "pclones");
  const w = { scope, clone: makeClone(path.join(roots, "a")), stubDir: ownedDir(scope, "pstub"), binDir: ownedDir(scope, "pbin") };
  fs.writeFileSync(path.join(w.stubDir, "docker"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  if (!win32) linkTools(w.binDir);
  return w;
}

const HOST = thisOwner().host;

function ownerOf(pid) {
  const owner = { owner: ME, host: HOST, pid };
  if (linux) {
    owner.start = pid === process.pid ? (processProbe(pid).start ?? 1) : 1;
    owner.ns = thisOwner().ns;
  }
  return formatOwner(owner);
}

const LIVE = () => ownerOf(process.pid);
const NOBODY = () => ownerOf(unmatchablePid(0));

function age(target, msAgo) {
  const when = new Date(Date.now() - msAgo);
  fs.utimesSync(target, when, when);
}

/** A prefixed, claimed folder in `parent` that is a git clone; `owner: null` removes the claim. The scenarios below give it a DEAD owner: a folder the janitor would remove were it not protected. */
function oldClone(w, parent, what, { owner = null } = {}) {
  const dir = ownedDir(w.scope, what, { parent });
  if (owner === null) fs.rmSync(`${dir}.owner`);
  else fs.writeFileSync(`${dir}.owner`, `${owner}\n`);
  git(dir, "init", "-q");
  git(dir, ...COMMIT);
  age(dir, OLD);
  return dir;
}

/** A helper worktree of the clone in `tmp`, re-locked with `lock`, aged. */
function worktree(w, tmp, what, lock) {
  const made = ownedWorktree(w.scope, w.clone, what, { parent: tmp });
  git(w.clone, "worktree", "unlock", made.path);
  git(w.clone, "worktree", "lock", "--reason", lock, made.path);
  age(made.path, OLD);
  return made;
}

const listedIn = (repo) => git(repo, "worktree", "list", "--porcelain").split(/\r?\n/)
  .filter((line) => line.startsWith("worktree ")).map((line) => path.basename(line.slice(9)));

// --- 1: a registered worktree in the temp root is ONE resource, in every spelling -------------------------------

for (const spelling of SPELLINGS) {
  test(`A [${spelling}]. A prefixed worktree registered in the swept repository is judged once: dead owner → removed silently, live owner → named once`, { timeout: TIMEOUT }, (t) => {
    const w = makeWorld(t);
    if (w === null) return;
    const tmp = ownedDir(w.scope, "ptmp");
    const dead = worktree(w, tmp, "dup", NOBODY());

    const first = runJanitor(w, { cwd: w.clone, tmpdir: spell(tmp, spelling) });

    assert.equal(first.status, 0, first.text);
    assert.deepEqual(first.stderr, [], "removed ONCE: a second capture would announce a vanished or skipped target");
    assert.equal(fs.existsSync(dead.path), false, `the dead-owned worktree is gone\n${first.text}`);
    assert.equal(listedIn(w.clone).includes(path.basename(dead.path)), false, `and unregistered\n${first.text}`);

    const live = worktree(w, tmp, "dup2", LIVE());

    const second = runJanitor(w, { cwd: w.clone, tmpdir: spell(tmp, spelling) });

    assert.equal(second.status, 3, second.text);
    assert.ok(fs.existsSync(live.path), `the live-owned worktree stays\n${second.text}`);
    assert.equal(second.stderr.filter((line) => line.includes(path.basename(live.path))).length, 1, `named exactly once\n${second.text}`);
  });
}

// --- 2: the clone the janitor runs from is never deleted, in every spelling -------------------------------------

for (const spelling of SPELLINGS) {
  test(`B [${spelling}]. The clone the janitor runs from is never a candidate, though it is old, dead-owned and prefixed under the temp root`, { timeout: TIMEOUT }, (t) => {
    const w = makeWorld(t);
    if (w === null) return;
    const tmp = ownedDir(w.scope, "ptmp");
    const self = oldClone(w, tmp, "self", { owner: NOBODY() });

    const run = runJanitor(w, { cwd: self, tmpdir: spell(tmp, spelling) });

    assert.equal(run.status, 0, run.text);
    assert.ok(fs.existsSync(path.join(self, ".git")), `the clone it ran from was deleted\n${run.text}`);
    assert.deepEqual(run.stderr, [], "and nothing was reported");
  });
}

// --- 3: finding 20 — run from a LINKED worktree, the MAIN checkout is protected too -------------------------------

for (const spelling of SPELLINGS) {
  test(`D [${spelling}]. Run from a linked worktree: the repository's MAIN checkout (old, dead-owned, prefixed under the temp root) is never deleted`, { timeout: TIMEOUT }, (t) => {
    const w = makeWorld(t);
    if (w === null) return;
    const tmp = ownedDir(w.scope, "ptmp");
    const elsewhere = ownedDir(w.scope, "pelse");
    const main = oldClone(w, tmp, "main", { owner: NOBODY() });
    const linked = ownedWorktree(w.scope, main, "linked", { parent: elsewhere });
    age(main, OLD);

    const run = runJanitor(w, { cwd: linked.path, tmpdir: spell(tmp, spelling) });

    assert.ok(fs.existsSync(path.join(main, ".git")), `the main checkout was deleted\n${run.text}`);
    assert.equal(run.status, 0, run.text);
    assert.deepEqual(run.stderr, []);
  });

  test(`E [${spelling}]. Run from a linked worktree: a prefixed folder that CONTAINS the main checkout is never deleted either`, { timeout: TIMEOUT }, (t) => {
    const w = makeWorld(t);
    if (w === null) return;
    const tmp = ownedDir(w.scope, "ptmp");
    const elsewhere = ownedDir(w.scope, "pelse");
    const box = ownedDir(w.scope, "box", { parent: tmp });
    fs.writeFileSync(`${box}.owner`, `${NOBODY()}\n`); // a dead owner: the folder would go were it not protected
    const main = makeClone(path.join(box, "repo"));
    const linked = ownedWorktree(w.scope, main, "linked", { parent: elsewhere });
    age(box, OLD);

    const run = runJanitor(w, { cwd: linked.path, tmpdir: spell(tmp, spelling) });

    assert.ok(fs.existsSync(path.join(main, ".git")), `the folder holding the main checkout was deleted\n${run.text}`);
    assert.equal(run.status, 0, run.text);
    assert.deepEqual(run.stderr, []);
  });
}
