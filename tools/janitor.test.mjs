#!/usr/bin/env node
/**
 * `tools/janitor.sh`'s own tests — the twelve verdicts of the host-wide janitor (`common/test-leftovers.md`
 * § The janitor; E1 S3b, decision D9), held by a test and not by a record.
 *
 * The harness: the real script, run by a real bash, over a PRIVATE `TMPDIR`, two disposable clones and a stub
 * `docker` that is first on `PATH`. The stub logs every argv to a file and answers `ps`, `volume ls`,
 * `volume inspect`, `network ls` and the re-check `inspect` calls from per-scenario fixture files; `rm`,
 * `volume rm` and `network rm` only log. Nothing here touches this checkout, the real temp root's contents or a
 * Docker daemon.
 *
 * Bash. On Windows it is Git for Windows' bash, located from `git --exec-path` — NEVER the `bash.exe` under
 * `%SystemRoot%` (WSL's: it sees neither the Windows temp root nor Windows pids). If it is not there the
 * tests skip with the reason. Elsewhere it is `/bin/bash`.
 *
 * Owners. A live owner is this process; a dead owner is the pid of a child that was started, killed by pid and
 * awaited — never found by image name. Ages are made with `fs.utimesSync` and, for Docker, with the fixture's
 * `CreatedAt`. The two clones stay YOUNG on purpose: they live in a folder the janitor never scans, and what
 * the janitor does not judge it cannot touch.
 *
 * Scratch follows the rule under test: every folder and worktree is made by `ownedDir` / `ownedWorktree`. The
 * two shapes the helper never makes (a `--relative-paths` worktree, a `-b <branch>` worktree) are raw
 * `git worktree add` calls under an inline exemption.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

import { git } from "./lib/git.mjs";
import {
  cleanupScope, formatOwner, ownedDir, ownedName, ownedWorktree, processProbe, removeLink, removeQuietly, thisOwner,
} from "./lib/owned.mjs";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "janitor.sh");
const win32 = process.platform === "win32";
const linux = process.platform === "linux";
const HOUR = 3_600_000;
const OLD = 3 * HOUR; // the window is 60 minutes
const YOUNG = 60_000;
const TIMEOUT = 300_000;
const TAB = "\t";
const COMMIT = ["-c", "user.name=Janitor test", "-c", "user.email=janitor@example.invalid", "-c", "commit.gpgsign=false",
  "commit", "--allow-empty", "-qm", "fixture"];
const LINUX_TOOLS = ["bash", "sed", "awk", "grep", "find", "head", "tr", "git", "hostname", "uname", "date", "stat", "rm", "env"];

// --- bash and PATH ---------------------------------------------------------------------------------------------

/** `{ bash, gitRoot }` — Git for Windows' bash on win32 (never under %SystemRoot%), `/bin/bash` elsewhere; `bash: ""` when absent. */
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

/** The PATH of a run: the stub dir first (when the scenario has docker), then ONLY the tools the script calls. */
function pathFor(w, { docker }) {
  const parts = docker ? [w.stubDir] : [];
  if (win32) {
    parts.push(path.join(GIT_ROOT, "usr", "bin"), path.join(GIT_ROOT, "mingw64", "bin"), path.join(GIT_ROOT, "cmd"),
      path.join(process.env.SystemRoot ?? "C:\\Windows", "System32"));
  } else {
    parts.push(w.binDir);
  }
  return parts.join(path.delimiter);
}

function envFor(w, { tmp, docker, minAge }) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^(path|git_.*|tmpdir|janitor_.*|dstub)$/i.test(key)) env[key] = value;
  }
  return { ...env, PATH: pathFor(w, { docker }), TMPDIR: slash(tmp), JANITOR_MIN_AGE_MINUTES: String(minAge), DSTUB: slash(w.state) };
}

function runJanitor(w, { cwd = w.clone, tmp, args = [], docker = true, minAge = 60 }) {
  const env = envFor(w, { tmp, docker, minAge });
  if (!docker) { // the no-docker case must PROVE it has no docker, or it proves nothing
    const probe = spawnSync(BASH, ["-c", "command -v docker"], { env, encoding: "utf8", windowsHide: true });
    assert.notEqual(probe.status, 0, `this PATH holds a docker: ${probe.stdout}`);
  }
  const result = spawnSync(BASH, [slash(SCRIPT), ...args], { cwd, env, encoding: "utf8", timeout: 240_000, windowsHide: true });
  const stderr = (result.stderr ?? "").split(/\r?\n/).filter(Boolean);
  const stdout = (result.stdout ?? "").split(/\r?\n/).filter(Boolean);
  return { status: result.status, stdout, stderr, text: stderr.join("\n"), error: result.error };
}

// --- the stub docker -------------------------------------------------------------------------------------------

const STUB = `#!/bin/sh
# stub docker for tools/janitor.test.mjs: logs argv, answers from the fixture files in $DSTUB
S="$DSTUB"
printf '%s\\n' "$*" >> "$S/log"
last=""; for a in "$@"; do last="$a"; done
emit() { [ -f "$1" ] || return 0; while IFS= read -r l || [ -n "$l" ]; do printf '%s\\n' "$l"; done < "$1"; }
has() { [ -f "$S/mode" ] || return 1; while IFS= read -r l || [ -n "$l" ]; do [ "$l" = "$1" ] && return 0; done < "$S/mode"; return 1; }
failrm() { has "fail-rm:$1" || has "fail-rm:$1:present" || has "fail-rm:$1:absent"; }
present() { has "fail-rm:$1:present"; }
TAB=$(printf '\\t')
created() { [ -f "$S/volcreated.tsv" ] || return 0; while IFS= read -r l || [ -n "$l" ]; do case "$l" in "$1$TAB"*) printf '%s\\n' "\${l#*"$TAB"}";; esac; done < "$S/volcreated.tsv"; }
case "$1" in
  ps)
    if has fail-ps; then echo "stub: docker ps failed" >&2; exit 1; fi
    n=0; [ -f "$S/psn" ] && read -r n < "$S/psn"; n=$((n + 1)); printf '%s' "$n" > "$S/psn"
    if has toctou && [ "$n" -eq 1 ]; then exit 0; fi
    emit "$S/ps.tsv";;
  volume)
    case "$2" in
      ls) emit "$S/vol.tsv";;
      inspect) if [ "$3" = "--format" ]; then created "$last"; else present "$last"; exit $?; fi;;
      rm) if failrm "$last"; then exit 1; fi;;
    esac;;
  network)
    case "$2" in
      ls) emit "$S/net.tsv";;
      inspect) present "$last"; exit $?;;
      rm) if failrm "$last"; then exit 1; fi;;
    esac;;
  rm) if failrm "$last"; then exit 1; fi;;
  inspect) present "$last"; exit $?;;
esac
exit 0
`;

const dockerTime = (msAgo) => `${new Date(Date.now() - msAgo).toISOString().replace("T", " ").replace(/\.\d+Z$/, "")} +0000 UTC`;
const volumeTime = (msAgo) => new Date(Date.now() - msAgo).toISOString().replace(/\.\d+Z$/, "Z");
const rows = (list) => list.map((cells) => cells.join(TAB)).join("\n") + (list.length > 0 ? "\n" : "");

/** Replace the stub's fixtures and clear its log and its `ps` counter. `ps`/`net` rows: id, name, owner, created; `vol`: name, owner. */
function setDocker(w, { ps = [], vol = [], volCreated = [], net = [], mode = [] } = {}) {
  fs.writeFileSync(path.join(w.state, "ps.tsv"), rows(ps));
  fs.writeFileSync(path.join(w.state, "vol.tsv"), rows(vol));
  fs.writeFileSync(path.join(w.state, "volcreated.tsv"), rows(volCreated));
  fs.writeFileSync(path.join(w.state, "net.tsv"), rows(net));
  fs.writeFileSync(path.join(w.state, "mode"), mode.map((line) => `${line}\n`).join(""));
  fs.rmSync(path.join(w.state, "log"), { force: true });
  fs.rmSync(path.join(w.state, "psn"), { force: true });
}

/** What the stub was called with, one entry per call. */
function dockerLog(w) {
  try {
    return fs.readFileSync(path.join(w.state, "log"), "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// --- the world -------------------------------------------------------------------------------------------------

/** A cleanup scope tied to the test: last-registered-first, never rejects (node:test's own `t.after` is first-first). */
function lifo(t) {
  const scope = cleanupScope();
  t.after(() => scope.close());
  return scope;
}

function makeClone(parent, name) {
  const dir = path.join(parent, name);
  fs.mkdirSync(dir);
  git(dir, "init", "-q");
  git(dir, ...COMMIT);
  return dir;
}

/** Everything a scenario shares: two young clones, the stub, a tool dir for the no-bash-PATH case. `null` when there is no usable bash. */
function makeWorld(t) {
  if (BASH === "") {
    t.skip("Git for Windows bash not found");
    return null;
  }
  const scope = lifo(t);
  const roots = ownedDir(scope, "jclones");
  const w = {
    scope,
    roots,
    clone: makeClone(roots, "a"),
    other: makeClone(roots, "b"),
    stubDir: ownedDir(scope, "jstub"),
    state: ownedDir(scope, "jstate"),
    binDir: ownedDir(scope, "jbin"),
    targets: ownedDir(scope, "jtargets"),
  };
  fs.writeFileSync(path.join(w.stubDir, "docker"), STUB, { mode: 0o755 });
  if (!win32) linkTools(w.binDir);
  setDocker(w);
  return w;
}

function linkTools(binDir) {
  for (const tool of LINUX_TOOLS) {
    const found = spawnSync("sh", ["-c", `command -v ${tool}`], { encoding: "utf8" });
    assert.equal(found.status, 0, `the janitor needs \`${tool}\` and this machine has none`);
    fs.symlinkSync(found.stdout.trim(), path.join(binDir, tool));
  }
}

/** A private TMPDIR for one run: the janitor scans only this. */
const makeTmp = (w, what = "jtmp") => ownedDir(w.scope, what);

// --- owners and ages -------------------------------------------------------------------------------------------

const HOST = thisOwner().host;

/** The owner text of `pid`: three fields on Linux, two elsewhere — or two everywhere when `twoField`. */
function ownerOf(pid, { twoField = false } = {}) {
  const owner = { host: HOST, pid };
  if (linux && !twoField) owner.start = pid === process.pid ? (processProbe(pid).start ?? 1) : 1;
  return formatOwner(owner);
}

const LIVE = () => ownerOf(process.pid);

/** A pid that was alive, was killed by pid and has exited. */
async function deadPid() {
  const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 60000)"], { stdio: "ignore", windowsHide: true });
  await once(child, "spawn");
  const { pid } = child;
  const exited = once(child, "exit");
  try {
    process.kill(pid);
  } finally {
    await exited;
  }
  return pid;
}

const DEAD = async () => ownerOf(await deadPid());

function age(target, msAgo) {
  const when = new Date(Date.now() - msAgo);
  fs.utimesSync(target, when, when);
}

/** A claimed folder in `tmp` (`owner`: text, or `null` for none), aged. */
function folder(w, tmp, what, { owner, ageMs = OLD }) {
  const dir = ownedDir(w.scope, what, { parent: tmp });
  if (owner === null) fs.rmSync(`${dir}.owner`);
  else fs.writeFileSync(`${dir}.owner`, `${owner}\n`);
  if (ageMs > 0) age(dir, ageMs);
  return dir;
}

/** An `.owner` file with no folder beside it. */
function orphanMarker(w, tmp, owner) {
  const marker = path.join(tmp, `${ownedName("orphan")}.owner`);
  fs.writeFileSync(marker, `${owner}\n`);
  w.scope.after(() => fs.rmSync(marker, { force: true }));
  age(marker, OLD);
  return marker;
}

/** A helper worktree of `repo` in `tmp`, re-locked with `lock`: a reason, `true` (no reason) or `undefined` (unlocked). */
function worktree(w, repo, tmp, what, { lock, ageMs = OLD }) {
  const made = ownedWorktree(w.scope, repo, what, { parent: tmp });
  git(repo, "worktree", "unlock", made.path);
  if (typeof lock === "string") git(repo, "worktree", "lock", "--reason", lock, made.path);
  else if (lock === true) git(repo, "worktree", "lock", made.path);
  if (ageMs > 0) age(made.path, ageMs);
  return made;
}

/** `git worktree add` with arguments the helper never makes; its removal is registered on the next statement. */
function rawWorktree(w, repo, leaf, addArgs) {
  const added = spawnSync("git", ["-C", repo, "worktree", "add", ...addArgs], { encoding: "utf8", timeout: 30_000, windowsHide: true });
  w.scope.after(() => {
    spawnSync("git", ["-C", repo, "worktree", "unlock", leaf], { timeout: 30_000, windowsHide: true });
    spawnSync("git", ["-C", repo, "worktree", "remove", "--force", "--force", leaf], { timeout: 30_000, windowsHide: true });
    spawnSync("git", ["-C", repo, "worktree", "prune"], { timeout: 30_000, windowsHide: true });
    removeQuietly(leaf);
  });
  return added;
}

/** A directory link (a junction on Windows) from the top level of `wt` to a folder holding one file; removed by the worktree's teardown. */
function junctionInto(w, wt, what) {
  const target = path.join(w.targets, what);
  fs.mkdirSync(target);
  fs.writeFileSync(path.join(target, "keep.txt"), "kept\n");
  const link = path.join(wt.path, "link");
  fs.symlinkSync(target, link, "junction");
  wt.beforeRemove(() => {
    try {
      fs.lstatSync(link);
    } catch {
      return; // already gone
    }
    removeLink(link);
  });
  return target;
}

const listedIn = (repo) => git(repo, "worktree", "list", "--porcelain").split(/\r?\n/)
  .filter((line) => line.startsWith("worktree ")).map((line) => path.basename(line.slice(9)));
const branchesOf = (repo) => git(repo, "branch", "--format=%(refname:short)").split(/\r?\n/).filter(Boolean);
const named = (dir) => path.basename(dir);
/** Some stderr line holds every fragment (the script prints full paths; a test names a resource by its leaf). */
const mentions = (run, ...parts) => run.stderr.some((line) => parts.every((part) => line.includes(part)));
const rmCalls = (w) => dockerLog(w).filter((line) => /^(rm|volume rm|network rm) /.test(line));

function exists(p) {
  return fs.existsSync(p);
}

// --- 1 ---------------------------------------------------------------------------------------------------------

test("1. TOCTOU: a container that shows up after the capture is never listed again, so nothing is removed", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  setDocker(w, {
    ps: [["c9", "testsToDelete-conventions-late", LIVE(), dockerTime(OLD)]],
    mode: ["toctou"],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.equal(dockerLog(w).filter((line) => line.startsWith("ps -a")).length, 1, "the capture lists `ps -a` exactly once");
  assert.deepEqual(rmCalls(w), [], "nothing was removed");
  assert.deepEqual(run.stderr, [], "and nothing was reported: the late container was never seen");
});

// --- 2 ---------------------------------------------------------------------------------------------------------

test("2. Docker: age selects, the owner authorises, and the prefix is anchored", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = await DEAD();
  setDocker(w, {
    ps: [
      ["c1", "testsToDelete-conventions-old", "", dockerTime(OLD)],
      ["c2", "testsToDelete-conventions-young", "", dockerTime(YOUNG)],
      ["c3", "testsToDelete-conventions-live", LIVE(), dockerTime(OLD)],
      ["c4", "testsToDelete-conventions-dead", dead, dockerTime(OLD)],
      ["c5", "prod-testsToDelete-b", "", dockerTime(OLD)],
    ],
    vol: [["testsToDelete-v-old", ""], ["testsToDelete-v-young", ""]],
    volCreated: [["testsToDelete-v-old", volumeTime(OLD)], ["testsToDelete-v-young", volumeTime(YOUNG)]],
    net: [["n1", "testsToDelete-n-old", dead, dockerTime(OLD)]],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.deepEqual(rmCalls(w), ["rm -f -v c1", "rm -f -v c4", "volume rm testsToDelete-v-old", "network rm n1"]);
  assert.equal(run.stderr.filter((line) => line.startsWith("skipped:")).length, 1, run.text);
  assert.ok(mentions(run, "skipped: container testsToDelete-conventions-live — owned by live process"), run.text);
  assert.equal(mentions(run, "young"), false, "a young resource is left alone silently");
  assert.equal(mentions(run, "prod-testsToDelete-b") || dockerLog(w).some((line) => line.includes("c5")), false, "an unanchored name is never named or touched");
});

// --- 3 ---------------------------------------------------------------------------------------------------------

test("3. Per resource: a live-owned folder beside a dead old one — the dead one, its claim and an orphan claim go", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const live = folder(w, tmp, "live", { owner: LIVE() });
  const dead = folder(w, tmp, "dead", { owner: await DEAD() });
  const nobody = folder(w, tmp, "nobody", { owner: null });
  const orphan = orphanMarker(w, tmp, await DEAD());

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(live) && exists(`${live}.owner`), "the live-owned folder and its claim stay");
  assert.ok(mentions(run, "skipped: folder ", named(live), "owned by live process"), run.text);
  assert.equal(exists(dead) || exists(`${dead}.owner`), false, "the dead-owned folder and its sibling are gone");
  assert.equal(exists(nobody), false, "an unclaimed old folder is nobody's and goes");
  assert.equal(exists(orphan), false, "an old claim with no folder is removed");
});

// --- 4 ---------------------------------------------------------------------------------------------------------

test("4. Fail closed, not wedged: a worktree of a deleted clone is kept and named while two dead folders beside it go", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const doomed = makeClone(w.roots, "doomed");
  const stranded = worktree(w, doomed, tmp, "stranded", { lock: LIVE() });
  fs.rmSync(doomed, { recursive: true, force: true }); // the clone is gone: the worktree's `.git` file points nowhere
  age(stranded.path, OLD);
  const first = folder(w, tmp, "dead1", { owner: await DEAD() });
  const second = folder(w, tmp, "dead2", { owner: await DEAD() });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.equal(exists(first) || exists(second), false, "both dead folders are removed");
  assert.ok(exists(stranded.path), "the worktree whose clone is gone is kept");
  assert.ok(mentions(run, `${named(stranded.path)} — owner '-' is unreadable`), run.text);
});

// --- 5 ---------------------------------------------------------------------------------------------------------

test("5. Another clone, relative paths (J9): live-owned is skipped and kept; dead-owned and old is removed and unregistered", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const liveLeaf = path.join(tmp, ownedName("rellive"));
  const deadLeaf = path.join(tmp, ownedName("reldead"));
  // testsToDelete-exempt: raw-worktree — a --relative-paths worktree the helper never makes, to prove the janitor resolves its gitdir
  const liveAdded = rawWorktree(w, w.other, liveLeaf, ["--detach", "--relative-paths", "--lock", "--reason", LIVE(), liveLeaf, "HEAD"]);
  if (liveAdded.status !== 0 && /relative-paths/.test(liveAdded.stderr)) {
    t.skip("this git has no `worktree add --relative-paths`");
    return;
  }
  assert.equal(liveAdded.status, 0, liveAdded.stderr);
  // testsToDelete-exempt: raw-worktree — the same relative-path shape, dead-owned
  const deadAdded = rawWorktree(w, w.other, deadLeaf, ["--detach", "--relative-paths", "--lock", "--reason", await DEAD(), deadLeaf, "HEAD"]);
  assert.equal(deadAdded.status, 0, deadAdded.stderr);
  age(liveLeaf, OLD);
  age(deadLeaf, OLD);

  const run = runJanitor(w, { tmp }); // run from the FIRST clone: the worktrees belong to the second

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(liveLeaf) && listedIn(w.other).includes(named(liveLeaf)), "the live-owned one stays, registered");
  assert.ok(mentions(run, `${named(liveLeaf)} — owned by live process`), run.text);
  assert.equal(exists(deadLeaf), false, "the dead-owned one is gone");
  assert.equal(listedIn(w.other).includes(named(deadLeaf)), false, "and its clone no longer lists it");
});

// --- 6 ---------------------------------------------------------------------------------------------------------

test("6. Locks and junctions (J1, J2, J5): a reason-less lock is kept, links are unlinked, targets survive", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const nameless = worktree(w, w.clone, tmp, "nameless", { lock: true });
  const branch = `${ownedName("br")}`;
  git(w.clone, "branch", branch);
  w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", branch], { timeout: 30_000, windowsHide: true }));
  const dead = await DEAD();
  const linkedA = worktree(w, w.clone, tmp, "linka", { lock: dead, ageMs: 0 });
  const targetA = junctionInto(w, linkedA, "ta");
  age(linkedA.path, OLD);
  const linkedB = worktree(w, w.other, tmp, "linkb", { lock: dead, ageMs: 0 });
  const targetB = junctionInto(w, linkedB, "tb");
  age(linkedB.path, OLD);
  const unlocked = worktree(w, w.other, tmp, "unlocked", { lock: undefined });
  const young = worktree(w, w.other, tmp, "young", { lock: dead, ageMs: 0 });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(nameless.path) && listedIn(w.clone).includes(named(nameless.path)), "the reason-less lock is kept and still registered");
  assert.ok(mentions(run, named(nameless.path)) && mentions(run, "unreadable"), run.text);
  assert.equal(branchesOf(w.clone).includes(branch), false, "the prefixed branch is deleted");
  assert.equal(exists(linkedA.path) || exists(linkedB.path), false, "both junction-holding worktrees are gone");
  assert.ok(exists(path.join(targetA, "keep.txt")) && exists(path.join(targetB, "keep.txt")), "the junction targets' files are intact");
  assert.equal(exists(unlocked.path), false, "an unlocked old worktree of the other clone is gone");
  assert.equal(listedIn(w.other).includes(named(unlocked.path)), false);
  assert.ok(exists(young.path) && listedIn(w.other).includes(named(young.path)), "a young dead-owned one is kept");
});

// --- 7 ---------------------------------------------------------------------------------------------------------

test("7. A foreign host is skipped (exit 3); a tree holding only a young worktree exits 0", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const foreign = folder(w, tmp, "foreign", { owner: "elsewhere@linux:4242" });

  const first = runJanitor(w, { tmp });

  assert.equal(first.status, 3, first.text);
  assert.ok(exists(foreign), "a foreign owner's folder is kept");
  assert.ok(mentions(first, `${named(foreign)} — belongs to elsewhere@linux, not this host`), first.text);

  const quiet = makeTmp(w, "jquiet");
  const fresh = worktree(w, w.clone, quiet, "fresh", { lock: await DEAD(), ageMs: 0 });
  const second = runJanitor(w, { tmp: quiet });

  assert.equal(second.status, 0, second.text);
  assert.deepEqual(second.stderr, []);
  assert.ok(exists(fresh.path), "a young worktree is untouched");
});

// --- 8 ---------------------------------------------------------------------------------------------------------

test("8. --dry-run removes nothing, in any pass, and leaves the exit code alone", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "dry", { owner: await DEAD() });
  const branch = ownedName("drybr");
  git(w.clone, "branch", branch);
  w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", branch], { timeout: 30_000, windowsHide: true }));
  setDocker(w, { ps: [["c1", "testsToDelete-conventions-dry", "", dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp, args: ["--dry-run"] });

  assert.equal(run.status, 0, run.text);
  assert.ok(exists(dead) && exists(`${dead}.owner`), "the folder and its sibling are still there");
  assert.ok(branchesOf(w.clone).includes(branch), "the branch is still there");
  assert.deepEqual(rmCalls(w), [], "docker was never asked to remove anything");
});

test("8b. --dry-run announces every removal as a `would run:` line on STDOUT and keeps stderr empty", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "dryb", { owner: await DEAD() });
  const branch = ownedName("drybb");
  git(w.clone, "branch", branch);
  w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", branch], { timeout: 30_000, windowsHide: true }));
  setDocker(w, { ps: [["c1", "testsToDelete-conventions-dry", "", dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp, args: ["--dry-run"] });

  assert.equal(run.status, 0, run.text);
  const wouldRun = run.stdout.filter((line) => line.startsWith("would run: "));
  assert.ok(wouldRun.length >= 3, `expected at least three would-run lines on stdout, got [${run.stdout.join(" // ")}]`);
  assert.ok(wouldRun.includes("would run: docker rm -f -v c1"), run.stdout.join("\n"));
  assert.ok(wouldRun.some((line) => line.startsWith("would run: rm -rf -- ") && line.includes(named(dead))), run.stdout.join("\n"));
  assert.ok(wouldRun.includes(`would run: git branch -D ${branch}`), run.stdout.join("\n"));
  assert.deepEqual(run.stderr, [], "a dry run says nothing on stderr");
  assert.ok(exists(dead) && exists(`${dead}.owner`), "the folder and its sibling are still there");
  assert.deepEqual(rmCalls(w), [], "docker was never asked to remove anything");
});

// --- 9 ---------------------------------------------------------------------------------------------------------

test("9. A two-field owner <host>@<os>:<pid>: live is skipped, dead is removed", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const live = folder(w, tmp, "twolive", { owner: ownerOf(process.pid, { twoField: true }) });
  const dead = folder(w, tmp, "twodead", { owner: ownerOf(await deadPid(), { twoField: true }) });
  assert.doesNotMatch(fs.readFileSync(`${live}.owner`, "utf8").trim(), /:\d+:\d+$/, "the fixture is the two-field form");

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(live));
  assert.ok(mentions(run, `${named(live)} — owned by live process ${process.pid}`), run.text);
  assert.equal(exists(dead) || exists(`${dead}.owner`), false);
});

// --- 10 --------------------------------------------------------------------------------------------------------

test("10. Docker absent or failing (J7): one notice and the rest is swept; a failed listing removes nothing and exits 1", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "nodocker", { owner: await DEAD() });

  const absent = runJanitor(w, { tmp, docker: false });

  assert.equal(absent.status, 0, absent.text);
  assert.equal(absent.stderr.filter((line) => line.includes("janitor: no docker binary")).length, 1, absent.text);
  assert.equal(exists(dead), false, "the temp root is still swept");

  const kept = folder(w, tmp, "failing", { owner: await DEAD() });
  setDocker(w, { mode: ["fail-ps"] });

  const failing = runJanitor(w, { tmp });

  assert.equal(failing.status, 1, failing.text);
  assert.ok(mentions(failing, "janitor: a listing failed — nothing was removed"), failing.text);
  assert.ok(exists(kept), "a failed listing is a failure, not a clean machine: nothing was removed");
});

// --- 11 --------------------------------------------------------------------------------------------------------

test("11. A branch checked out in a kept worktree (J10) is skipped and named while a dead folder beside it goes", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const branch = ownedName("br");
  const leaf = path.join(tmp, ownedName("brwt"));
  // testsToDelete-exempt: raw-worktree — a worktree that checks out a prefixed branch, a shape the helper (detached only) never makes
  const added = rawWorktree(w, w.clone, leaf, ["-b", branch, "--lock", "--reason", LIVE(), leaf, "HEAD"]);
  assert.equal(added.status, 0, added.stderr);
  w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", branch], { timeout: 30_000, windowsHide: true }));
  age(leaf, OLD);
  const dead = folder(w, tmp, "beside", { owner: await DEAD() });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(leaf) && listedIn(w.clone).includes(named(leaf)), "the worktree is kept");
  assert.ok(branchesOf(w.clone).includes(branch), "and so is its branch");
  assert.ok(mentions(run, `skipped: branch ${branch} — checked out in a worktree that was kept`), run.text);
  assert.ok(mentions(run, `${named(leaf)} — owned by live process`), run.text);
  assert.equal(exists(dead) || exists(`${dead}.owner`), false, "the dead folder and its claim are gone");
  assert.equal(mentions(run, "cannot delete branch"), false);
});

// --- 12 --------------------------------------------------------------------------------------------------------

test("12. A vanished target is a notice, not an abort: a failed removal is judged by a re-check and later passes still run", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "after", { owner: await DEAD() });
  setDocker(w, {
    ps: [
      ["cv", "testsToDelete-conventions-vanish", "", dockerTime(OLD)],
      ["cs", "testsToDelete-conventions-stuck", "", dockerTime(OLD)],
    ],
    mode: ["fail-rm:cv:absent", "fail-rm:cs:present"],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(mentions(run, "notice: container testsToDelete-conventions-vanish — vanished after the capture"), run.text);
  assert.ok(mentions(run, "skipped: container testsToDelete-conventions-stuck — could not be removed"), run.text);
  assert.deepEqual(rmCalls(w), ["rm -f -v cv", "rm -f -v cs"], "both removals were attempted, by captured id");
  assert.equal(exists(dead) || exists(`${dead}.owner`), false, "a later pass still ran");
});
