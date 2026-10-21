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
 * Owners. A live owner is this process; a dead owner is a pid that no query can match (`lib/unmatchable-pid.mjs`: a
 * pid ≡ 2 mod 4 on Windows, `pid_max + 1` on Linux, 100000 on macOS) with that premise asserted before and after every
 * run — never the pid of a child that was started and killed, because the OS hands that number to the next process.
 * Ages are made with `fs.utimesSync` and, for Docker, with the fixture's `CreatedAt`. The two clones stay YOUNG on
 * purpose: they live in a folder the janitor never scans, and what the janitor does not judge it cannot touch.
 *
 * Scratch follows the rule under test: every folder and worktree is made by `ownedDir` / `ownedWorktree`. The
 * two shapes the helper never makes (a `--relative-paths` worktree, a `-b <branch>` worktree) are made by one
 * raw-git function (`rawWorktree`) that carries the inline exemption.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

import { git } from "./lib/git.mjs";
import { assertNoSuchProcess, unmatchablePid } from "./lib/unmatchable-pid.mjs";
import {
  cleanupScope, formatOwner, ownedDir, ownedName, ownedWorktree, processProbe, removeLink, removeQuietly, thisOwner,
} from "./lib/owned.mjs";

if (process.platform !== "win32") process.umask(0o022); // the janitor trusts a clone only when it is closed to group and world; the fixtures are made that way whatever the machine's umask

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
// Exactly what the script calls (a private PATH of symlinks proves it; `cut` and `xargs` joined with the one-inspect capture).
const LINUX_TOOLS = ["bash", "sed", "awk", "grep", "find", "head", "tr", "cut", "xargs", "git", "hostname", "uname", "date", "stat", "rm", "env", "sleep"];

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

/** A folder as the script's own bash spells it: `/c/Users/…` on Windows, never `C:/…`. The harness's habit; the script resolves every spelling of one folder alike (`janitor-paths.test.mjs` pins that). */
const posix = (p) => (win32 ? slash(p).replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`) : p);

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

function envFor(w, { tmp, docker, minAge, ahead, extra }) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^(path|git_.*|tmpdir|janitor_.*|dstub)$/i.test(key)) env[key] = value;
  }
  return {
    ...env, PATH: [...ahead, pathFor(w, { docker })].join(path.delimiter), TMPDIR: posix(tmp),
    JANITOR_MIN_AGE_MINUTES: String(minAge), DSTUB: slash(w.state), ...extra,
  };
}

const PROGRESS_LINE = /^janitor: (?:looking for testsToDelete resources|removed )/; // progress, not findings: a scenario asserts about them on purpose, in the tests that name them

function runJanitor(w, { cwd = w.clone, tmp, args = [], docker = true, minAge = 60, ahead = [], env: extra = {}, timeoutMs = 240_000 }) {
  const env = envFor(w, { tmp, docker, minAge, ahead, extra });
  if (!docker) { // the no-docker case must PROVE it has no docker, or it proves nothing
    const probe = spawnSync(BASH, ["-c", "command -v docker"], { env, encoding: "utf8", windowsHide: true });
    assert.notEqual(probe.status, 0, `this PATH holds a docker: ${probe.stdout}`);
  }
  for (let i = 0; i < 5; i += 1) assertNoSuchProcess(unmatchablePid(i)); // the premise, before the run
  const result = spawnSync(BASH, [slash(SCRIPT), ...args], { cwd, env, encoding: "utf8", timeout: timeoutMs, windowsHide: true });
  for (let i = 0; i < 5; i += 1) assertNoSuchProcess(unmatchablePid(i)); // and after it
  const lines = (result.stderr ?? "").split(/\r?\n/).filter(Boolean);
  const seams = lines.filter((line) => line.startsWith("janitor: test seam ")); // announced, not asserted about
  const progress = lines.filter((line) => PROGRESS_LINE.test(line)); // what the janitor is doing: its own tests, below
  const stderr = lines.filter((line) => !line.startsWith("janitor: test seam ") && !PROGRESS_LINE.test(line));
  const stdout = (result.stdout ?? "").split(/\r?\n/).filter(Boolean);
  return { status: result.status, stdout, stderr, seams, progress, text: stderr.join("\n"), error: result.error };
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
      inspect) if [ "$3" = "--format" ]; then fmt="$4"; shift 4; for n in "$@"; do c="$(created "$n")"; case "$fmt" in *Name*) printf '%s\\t%s\\n' "$n" "$c";; *) printf '%s\\n' "$c";; esac; done; else present "$last"; exit $?; fi;;
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

/**
 * An owner that is dead for the whole run: its pid is one no query can match (`lib/unmatchable-pid.mjs`), and `runJanitor`
 * asserts that premise before and after every run. NEVER the pid of a child that was started and killed — the OS hands
 * that number to the next process, and on Windows it did, mid-suite.
 */
const NOBODY = (i = 0) => ownerOf(unmatchablePid(i));

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

/** A worktree made with arguments the helper never makes; its removal is registered on the next statement. */
function rawWorktree(w, repo, leaf, addArgs) {
  // testsToDelete-exempt: raw-worktree — the --relative-paths and -b <branch> shapes ownedWorktree never makes; removal is registered below
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
  assert.equal(dockerLog(w).filter((line) => line.startsWith("ps -a")).length, 1, `the capture lists \`ps -a\` exactly once\n${run.text}`);
  assert.deepEqual(rmCalls(w), [], "nothing was removed");
  assert.deepEqual(run.stderr, [], "and nothing was reported: the late container was never seen");
});

// --- 2 ---------------------------------------------------------------------------------------------------------

test("2. Docker: age selects, the owner authorises, and the prefix is anchored", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = NOBODY();
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
    net: [["a1", "testsToDelete-n-old", dead, dockerTime(OLD)]],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.deepEqual(rmCalls(w), ["rm -f -v c1", "rm -f -v c4", "volume rm testsToDelete-v-old", "network rm a1"]);
  assert.equal(run.stderr.filter((line) => line.startsWith("skipped:")).length, 1, run.text);
  assert.ok(mentions(run, "skipped: container testsToDelete-conventions-live — owned by live process"), run.text);
  assert.equal(mentions(run, "young"), false, `a young resource is left alone silently\n${run.text}`);
  assert.equal(mentions(run, "prod-testsToDelete-b") || dockerLog(w).some((line) => line.includes("c5")), false, `an unanchored name is never named or touched\n${run.text}`);
});

// --- 3 ---------------------------------------------------------------------------------------------------------

test("3. Per resource: a live-owned folder beside a dead old one — the dead one, its claim and an orphan claim go", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const live = folder(w, tmp, "live", { owner: LIVE() });
  const dead = folder(w, tmp, "dead", { owner: NOBODY() });
  const nobody = folder(w, tmp, "nobody", { owner: null });
  const orphan = orphanMarker(w, tmp, NOBODY());

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(live) && exists(`${live}.owner`), `the live-owned folder and its claim stay\n${run.text}`);
  assert.ok(mentions(run, "skipped: folder ", named(live), "owned by live process"), run.text);
  assert.equal(exists(dead) || exists(`${dead}.owner`), false, `the dead-owned folder and its sibling are gone\n${run.text}`);
  assert.equal(exists(nobody), false, `an unclaimed old folder is nobody's and goes\n${run.text}`);
  assert.equal(exists(orphan), false, `an old claim with no folder is removed\n${run.text}`);
});

// --- 4 ---------------------------------------------------------------------------------------------------------

test("4. Fail closed, not wedged: a worktree of a deleted clone is kept and named while two dead folders beside it go", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const doomed = makeClone(w.roots, "doomed");
  const stranded = worktree(w, doomed, tmp, "stranded", { lock: LIVE() });
  fs.rmSync(doomed, { recursive: true, force: true }); // the clone is gone: the worktree's `.git` file points nowhere
  age(stranded.path, OLD);
  const first = folder(w, tmp, "dead1", { owner: NOBODY() });
  const second = folder(w, tmp, "dead2", { owner: NOBODY() });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.equal(exists(first) || exists(second), false, `both dead folders are removed\n${run.text}`);
  assert.ok(exists(stranded.path), `the worktree whose clone is gone is kept\n${run.text}`);
  assert.ok(mentions(run, `${named(stranded.path)} — owner '-' is unreadable`), run.text);
});

// --- 5 ---------------------------------------------------------------------------------------------------------

test("5. Another clone, relative paths (J9): live-owned is skipped and kept; dead-owned and old is removed and unregistered", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const liveLeaf = path.join(tmp, ownedName("rellive"));
  const deadLeaf = path.join(tmp, ownedName("reldead"));
  // testsToDelete-exempt: raw-worktree — a --relative-paths worktree the helper never makes, to prove the janitor resolves its gitdir
  const liveAdded = rawWorktree(w, w.other, liveLeaf, ["--detach", "--relative-paths", "--lock", "--reason", LIVE(), liveLeaf, "HEAD"]);
  if (liveAdded.status !== 0 && /relative-paths/.test(liveAdded.stderr)) {
    t.skip("this git has no `--relative-paths` for a worktree");
    return;
  }
  assert.equal(liveAdded.status, 0, liveAdded.stderr);
  // testsToDelete-exempt: raw-worktree — the same relative-path shape, dead-owned
  const deadAdded = rawWorktree(w, w.other, deadLeaf, ["--detach", "--relative-paths", "--lock", "--reason", NOBODY(), deadLeaf, "HEAD"]);
  assert.equal(deadAdded.status, 0, deadAdded.stderr);
  age(liveLeaf, OLD);
  age(deadLeaf, OLD);

  const run = runJanitor(w, { tmp }); // run from the FIRST clone: the worktrees belong to the second

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(liveLeaf) && listedIn(w.other).includes(named(liveLeaf)), `the live-owned one stays, registered\n${run.text}`);
  assert.ok(mentions(run, `${named(liveLeaf)} — owned by live process`), run.text);
  assert.equal(exists(deadLeaf), false, `the dead-owned one is gone\n${run.text}`);
  assert.equal(listedIn(w.other).includes(named(deadLeaf)), false, `and its clone no longer lists it\n${run.text}`);
});

// --- 6 ---------------------------------------------------------------------------------------------------------

test("6. Locks and junctions (J1, J2, J5): a reason-less lock is kept, links are unlinked, targets survive", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const nameless = worktree(w, w.clone, tmp, "nameless", { lock: true });
  const branch = `${ownedName("br")}`;
  git(w.clone, "branch", branch);
  w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", branch], { timeout: 30_000, windowsHide: true }));
  const dead = NOBODY();
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
  assert.ok(exists(nameless.path) && listedIn(w.clone).includes(named(nameless.path)), `the reason-less lock is kept and still registered\n${run.text}`);
  assert.ok(mentions(run, named(nameless.path)) && mentions(run, "unreadable"), run.text);
  assert.equal(branchesOf(w.clone).includes(branch), false, `the prefixed branch is deleted\n${run.text}`);
  assert.equal(exists(linkedA.path) || exists(linkedB.path), false, `both junction-holding worktrees are gone\n${run.text}`);
  assert.ok(exists(path.join(targetA, "keep.txt")) && exists(path.join(targetB, "keep.txt")), `the junction targets' files are intact\n${run.text}`);
  assert.equal(exists(unlocked.path), false, `an unlocked old worktree of the other clone is gone\n${run.text}`);
  assert.equal(listedIn(w.other).includes(named(unlocked.path)), false);
  assert.ok(exists(young.path) && listedIn(w.other).includes(named(young.path)), `a young dead-owned one is kept\n${run.text}`);
});

// --- 7 ---------------------------------------------------------------------------------------------------------

test("7. A foreign host is skipped (exit 3); a tree holding only a young worktree exits 0", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const foreign = folder(w, tmp, "foreign", { owner: "elsewhere@linux:4242" });

  const first = runJanitor(w, { tmp });

  assert.equal(first.status, 3, first.text);
  assert.ok(exists(foreign), `a foreign owner's folder is kept\n${first.text}`);
  assert.ok(mentions(first, `${named(foreign)} — belongs to elsewhere@linux, not this host`), first.text);

  const quiet = makeTmp(w, "jquiet");
  const fresh = worktree(w, w.clone, quiet, "fresh", { lock: NOBODY(), ageMs: 0 });
  const second = runJanitor(w, { tmp: quiet });

  assert.equal(second.status, 0, second.text);
  assert.deepEqual(second.stderr, []);
  assert.ok(exists(fresh.path), `a young worktree is untouched\n${second.text}`);
});

// --- 8 ---------------------------------------------------------------------------------------------------------

test("8. --dry-run removes nothing, in any pass, and leaves the exit code alone", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "dry", { owner: NOBODY() });
  const branch = ownedName("drybr");
  git(w.clone, "branch", branch);
  w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", branch], { timeout: 30_000, windowsHide: true }));
  setDocker(w, { ps: [["c1", "testsToDelete-conventions-dry", "", dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp, args: ["--dry-run"] });

  assert.equal(run.status, 0, run.text);
  assert.ok(exists(dead) && exists(`${dead}.owner`), `the folder and its sibling are still there\n${run.text}`);
  assert.ok(branchesOf(w.clone).includes(branch), `the branch is still there\n${run.text}`);
  assert.deepEqual(rmCalls(w), [], "docker was never asked to remove anything");
});

test("8b. --dry-run announces every removal as a `would run:` line on STDOUT and keeps stderr empty", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "dryb", { owner: NOBODY() });
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
  assert.ok(exists(dead) && exists(`${dead}.owner`), `the folder and its sibling are still there\n${run.text}`);
  assert.deepEqual(rmCalls(w), [], "docker was never asked to remove anything");
});

// --- 8c --------------------------------------------------------------------------------------------------------

const LOOKING = "janitor: looking for testsToDelete resources…";

test("8c. progress: one line when the capture starts and one per real removal, in removal order — a kept resource has none", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "progd", { owner: NOBODY() });
  const live = folder(w, tmp, "progl", { owner: LIVE() });
  const branch = ownedName("progb");
  git(w.clone, "branch", branch);
  w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", branch], { timeout: 30_000, windowsHide: true }));
  setDocker(w, { ps: [["c1", "testsToDelete-conventions-prog", "", dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, "the live folder is skipped: " + run.text);
  assert.equal(run.progress.length, 4, run.progress.join(" // "));
  assert.deepEqual(run.progress.slice(0, 3), [LOOKING, "janitor: removed container testsToDelete-conventions-prog", `janitor: removed branch ${branch}`]);
  assert.ok(run.progress[3].startsWith("janitor: removed folder ") && run.progress[3].includes(named(dead)), run.progress.join(" // "));
  assert.equal(run.progress.some((line) => line.includes(named(live))), false, "a skipped resource is not announced as removed");
  assert.equal(exists(dead), false, "and it really went: " + run.text);
});

test("8c. progress: a dry run prints the capture line and the would-run lines, never a removed line", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  folder(w, tmp, "progdry", { owner: NOBODY() });
  setDocker(w, { ps: [["c1", "testsToDelete-conventions-progdry", "", dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp, args: ["--dry-run"] });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(run.progress, [LOOKING]);
  assert.ok(run.stdout.includes("would run: docker rm -f -v c1"), run.stdout.join(" // "));
});

test("8c. progress: a name is printed through clean() — non-ASCII text never reaches the terminal as itself", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  setDocker(w, { ps: [["c1", "testsToDelete-conventions-café", "", dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(run.progress, [LOOKING, "janitor: removed container testsToDelete-conventions-caf\\?\\?"]); // printf %q: the two `?` that clean() made are glob characters, so they are escaped
  assert.equal(/[^ -~]/.test(run.progress[1]), false, "the removed line is printable ASCII only");
});

test("8c. progress: printable text inside a name cannot pass for a second message — the name is quoted", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  setDocker(w, { ps: [["c1", "testsToDelete-conventions-x janitor: removed container fake", "", dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(run.progress, [LOOKING, "janitor: removed container testsToDelete-conventions-x\\ janitor:\\ removed\\ container\\ fake"]); // every space is escaped: it is ONE word of one line
});

test("8c. progress: a removal that failed is not announced as removed", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  setDocker(w, { ps: [["c1", "testsToDelete-conventions-progfail", "", dockerTime(OLD)]], mode: ["fail-rm:c1:present"] });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.deepEqual(run.progress, [LOOKING]);
  assert.ok(run.stderr.some((line) => line.includes("could not be removed")), run.text);
});

// --- 8d --------------------------------------------------------------------------------------------------------

/** A FIFO named `locked` inside the admin folder of a worktree of `repo`; the teardown removes it first. */
function plantFifoLock(w, repo, tmp, what) {
  const wt = worktree(w, repo, tmp, what, { lock: undefined });
  const admin = git(wt.path, "rev-parse", "--absolute-git-dir");
  const fifo = path.join(admin, "locked");
  const made = spawnSync("mkfifo", [fifo], { timeout: 30_000 });
  assert.equal(made.status, 0, String(made.stderr));
  w.scope.after(() => fs.rmSync(fifo, { force: true }));
  return { wt, admin };
}

test("8d. A FIFO named `locked` in ANOTHER clone's worktree never hangs the janitor: its lock is unreadable, so the worktree is kept and named", { timeout: TIMEOUT }, (t) => {
  if (process.platform === "win32") {
    t.skip("mkfifo: a FIFO needs a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const { wt, admin } = plantFifoLock(w, w.other, tmp, "fifo");

  const run = runJanitor(w, { tmp, timeoutMs: 60_000 });

  assert.equal(run.error, undefined, "the run finished instead of blocking on the FIFO");
  assert.equal(run.status, 3, run.text);
  assert.ok(exists(wt.path) && exists(admin), `the worktree is kept, registered (its admin folder is still there; git itself would block listing it)
${run.text}`);
  assert.ok(mentions(run, named(wt.path), "is unreadable"), run.text);
});

test("8d. A FIFO named `locked` in the SWEPT clone's own admin folder (git itself would block on it): the run refuses in one line, removes nothing and does not hang", { timeout: TIMEOUT }, (t) => {
  if (process.platform === "win32") {
    t.skip("mkfifo: a FIFO needs a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const { wt } = plantFifoLock(w, w.clone, tmp, "fifoown");
  const dead = folder(w, tmp, "fifobeside", { owner: NOBODY() });

  const run = runJanitor(w, { tmp, timeoutMs: 60_000 });

  assert.equal(run.error, undefined, "the run finished instead of blocking on the FIFO");
  assert.equal(run.status, 1, run.text);
  assert.ok(run.stderr.some((line) => line.startsWith("janitor: ") && line.includes("locked") && line.includes("not a regular file") && line.includes("nothing was removed")), run.text);
  assert.ok(exists(wt.path) && exists(dead), `nothing was removed
${run.text}`);
});

// --- 9 ---------------------------------------------------------------------------------------------------------

test("9. A two-field owner <host>@<os>:<pid>: live is skipped, dead is removed", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const live = folder(w, tmp, "twolive", { owner: ownerOf(process.pid, { twoField: true }) });
  const dead = folder(w, tmp, "twodead", { owner: ownerOf(unmatchablePid(), { twoField: true }) });
  assert.doesNotMatch(fs.readFileSync(`${live}.owner`, "utf8").trim(), /:\d+:\d+$/, "the fixture is the two-field form");

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(live));
  assert.ok(mentions(run, `${named(live)} — owned by live process ${process.pid}`), run.text);
  assert.equal(exists(dead) || exists(`${dead}.owner`), false);
});

// --- 10 --------------------------------------------------------------------------------------------------------

test("10. Docker absent or failing (J7): one notice and the rest is swept; a failed listing removes nothing and exits 1", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "nodocker", { owner: NOBODY() });

  const absent = runJanitor(w, { tmp, docker: false });

  assert.equal(absent.status, 0, absent.text);
  assert.equal(absent.stderr.filter((line) => line.includes("janitor: no docker binary")).length, 1, absent.text);
  assert.equal(exists(dead), false, `the temp root is still swept\n${absent.text}`);

  const kept = folder(w, tmp, "failing", { owner: NOBODY() });
  setDocker(w, { mode: ["fail-ps"] });

  const failing = runJanitor(w, { tmp });

  assert.equal(failing.status, 1, failing.text);
  assert.ok(mentions(failing, "janitor: a listing failed — nothing was removed"), failing.text);
  assert.ok(exists(kept), `a failed listing is a failure, not a clean machine: nothing was removed\n${failing.text}`);
});

// --- 11 --------------------------------------------------------------------------------------------------------

test("11. A branch checked out in a kept worktree (J10) is skipped and named while a dead folder beside it goes", { timeout: TIMEOUT }, (t) => {
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
  const dead = folder(w, tmp, "beside", { owner: NOBODY() });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(leaf) && listedIn(w.clone).includes(named(leaf)), `the worktree is kept\n${run.text}`);
  assert.ok(branchesOf(w.clone).includes(branch), `and so is its branch\n${run.text}`);
  assert.ok(mentions(run, `skipped: branch ${branch} — checked out in a worktree that was kept`), run.text);
  assert.ok(mentions(run, `${named(leaf)} — owned by live process`), run.text);
  assert.equal(exists(dead) || exists(`${dead}.owner`), false, `the dead folder and its claim are gone\n${run.text}`);
  assert.equal(mentions(run, "cannot delete branch"), false);
});

// --- 12 --------------------------------------------------------------------------------------------------------

test("12. A vanished target is a notice, not an abort: a failed removal is judged by a re-check and later passes still run", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "after", { owner: NOBODY() });
  setDocker(w, {
    ps: [
      ["ce", "testsToDelete-conventions-vanish", "", dockerTime(OLD)],
      ["cb", "testsToDelete-conventions-stuck", "", dockerTime(OLD)],
    ],
    mode: ["fail-rm:ce:absent", "fail-rm:cb:present"],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(mentions(run, "notice: container testsToDelete-conventions-vanish — vanished after the capture"), run.text);
  assert.ok(mentions(run, "skipped: container testsToDelete-conventions-stuck — could not be removed"), run.text);
  assert.deepEqual(rmCalls(w), ["rm -f -v ce", "rm -f -v cb"], "both removals were attempted, by captured id");
  assert.equal(exists(dead) || exists(`${dead}.owner`), false, `a later pass still ran\n${run.text}`);
});

// --- 13 --------------------------------------------------------------------------------------------------------

test("13. Malformed owners (code gate 1): each is unreadable — kept and named, never judged by a pid", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const machine = HOST.split("@")[0];
  const malformed = [`${HOST}:abc`, `${HOST}:12:x`, `${HOST}:`, `${HOST}:1:2:3`, `${machine}@beos:1`];
  const folders = malformed.map((owner, i) => folder(w, tmp, `bad${i}`, { owner }));

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  for (const [i, dir] of folders.entries()) {
    assert.ok(exists(dir) && exists(`${dir}.owner`), `${named(dir)} (owner ${JSON.stringify(malformed[i])}) was deleted\n${run.text}`);
  }
  assert.equal(run.stderr.filter((line) => line.includes("is unreadable")).length, 5, `one named line per malformed owner\n${run.text}`);
});

// --- 14 --------------------------------------------------------------------------------------------------------

test("14. One row per worktree (code gate 2): the swept repository's own tree in the temp root is judged once", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = worktree(w, w.clone, tmp, "dup", { lock: NOBODY() });

  const first = runJanitor(w, { tmp });

  assert.equal(first.status, 0, first.text);
  assert.deepEqual(first.stderr, [], "removed once and silently: a second capture would announce a vanished target");
  assert.equal(first.progress.filter((line) => line.startsWith("janitor: removed worktree ") && line.includes(named(dead.path))).length, 1, `one progress line for the worktree\n${first.progress.join("\n")}`);
  assert.equal(exists(dead.path), false, `the dead-owned worktree is gone\n${first.text}`);
  assert.equal(listedIn(w.clone).includes(named(dead.path)), false, `and unregistered\n${first.text}`);

  const live = worktree(w, w.clone, tmp, "dup2", { lock: LIVE() });

  const second = runJanitor(w, { tmp });

  assert.equal(second.status, 3, second.text);
  assert.ok(exists(live.path), `the live-owned worktree stays\n${second.text}`);
  assert.equal(second.stderr.filter((line) => line.includes(named(live.path))).length, 1, `named exactly once\n${second.text}`);
});

// --- 15 --------------------------------------------------------------------------------------------------------

test("15. One volume inspect for N volumes (code gate 3/4)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const names = ["testsToDelete-v-a", "testsToDelete-v-b", "testsToDelete-v-c"];
  setDocker(w, { vol: names.map((name) => [name, ""]), volCreated: names.map((name) => [name, volumeTime(OLD)]) });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  const inspects = dockerLog(w).filter((line) => line.startsWith("volume inspect"));
  assert.equal(inspects.length, 1, `one inspect for three volumes, got [${inspects.join(" // ")}]\n${run.text}`);
  assert.deepEqual(rmCalls(w), names.map((name) => `volume rm ${name}`), run.text);
});

// --- 16 – 18: liveness ------------------------------------------------------------------------------------------

/** A directory holding a stub `tasklist` that logs its argv to the world's state folder and then answers as `kind` says. */
function taskStub(w, kind) {
  const body = {
    fail: `echo "tasklist: command not found" >&2; exit 127`,
    noPid: `printf '"node.exe","4242","Console","1","1 K"\\n'`,
    empty: "exit 0",
  }[kind];
  const dir = ownedDir(w.scope, "jlive");
  fs.writeFileSync(path.join(dir, "tasklist"), `#!/bin/sh\necho "tasklist $*" >> "$DSTUB/tasklistlog"\n${body}\n`, { mode: 0o755 });
  return dir;
}

/**
 * A `ps` that logs its argv and returns `rc`, handed over as an exported bash FUNCTION: on Windows the shell puts its
 * own `/usr/bin` ahead of any PATH entry we add, so a stub FILE named `ps` would never be reached; a function
 * outranks every file on every platform.
 */
const psStub = (rc) => ({ "BASH_FUNC_ps%%": `() {  echo "ps $*" >> "$DSTUB/pslog"; return ${rc}\n}` });
const callsOf = (w, name) => {
  try {
    return fs.readFileSync(path.join(w.state, `${name}log`), "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
};
const OWNER_AS = (os, pid) => `${HOST.split("@")[0]}@${os}:${pid}`;

test("16. One tasklist per run (code gate 5): N Windows-owned folders cost one snapshot", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dirs = [0, 1, 2].map((i) => folder(w, tmp, `win${i}`, { owner: OWNER_AS("windows", unmatchablePid(i)) }));
  const ahead = [taskStub(w, "noPid")];

  const run = runJanitor(w, { tmp, ahead, env: { JANITOR_OS: "windows" } });

  assert.equal(run.status, 0, run.text);
  assert.equal(callsOf(w, "tasklist").length, 1, `one snapshot for three owners, got [${callsOf(w, "tasklist").join(" // ")}]\n${run.text}`);
  assert.equal(dirs.some((dir) => exists(dir)), false, `all three are gone\n${run.text}`);
});

test("17. Windows liveness is three-valued (opus A): a failing or silent tasklist keeps; a snapshot without the pid is dead", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const unknownLines = (run, dir) => run.stderr.filter((line) => line.includes("liveness unknown") && line.includes(named(dir))).length;
  const judge = (what, kind) => {
    const dir = folder(w, tmp, what, { owner: OWNER_AS("windows", unmatchablePid()) });
    const run = runJanitor(w, { tmp, ahead: [taskStub(w, kind)], env: { JANITOR_OS: "windows" } });
    return { dir, run };
  };

  const failing = judge("lvfail", "fail");
  assert.equal(failing.run.status, 3, failing.run.text);
  assert.ok(exists(failing.dir) && exists(`${failing.dir}.owner`), `a tasklist that fails is not a dead process\n${failing.run.text}`);
  assert.equal(unknownLines(failing.run, failing.dir), 1, failing.run.text);

  const silent = judge("lvsilent", "empty"); // the folder above is still there and still unknown: count only this one's line
  assert.equal(silent.run.status, 3, silent.run.text);
  assert.ok(exists(silent.dir), `a tasklist that prints nothing is not an answer\n${silent.run.text}`);
  assert.equal(unknownLines(silent.run, silent.dir), 1, silent.run.text);

  const dead = judge("lvdead", "noPid");
  assert.equal(dead.run.status, 0, dead.run.text);
  assert.equal(exists(dead.dir) || exists(`${dead.dir}.owner`), false, `a real snapshot without the pid is the one answer that deletes\n${dead.run.text}`);
});

test("18. The non-Windows branch (opus A), through JANITOR_OS=macos and a ps stub: refused keeps, 'no such process' deletes, alive skips", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const judge = (what, rc) => {
    const dir = folder(w, tmp, what, { owner: OWNER_AS("macos", unmatchablePid()) });
    const run = runJanitor(w, { tmp, env: { JANITOR_OS: "macos", ...psStub(rc) } });
    return { dir, run };
  };

  const refused = judge("psrefused", 2);
  assert.equal(refused.run.status, 3, refused.run.text);
  assert.ok(exists(refused.dir), `a ps that is refused (exit 2) is not a dead process\n${refused.run.text}`);
  assert.equal(refused.run.stderr.filter((line) => line.includes("liveness unknown")).length, 1, refused.run.text);
  assert.deepEqual(callsOf(w, "ps"), [`ps -p ${unmatchablePid()} -o pid=`], "the stub was the one asked");

  const dead = judge("psdead", 1);
  assert.equal(dead.run.status, 0, dead.run.text);
  assert.equal(exists(dead.dir) || exists(`${dead.dir}.owner`), false, `ps exit 1 is "no such process"\n${dead.run.text}`);

  const live = judge("pslive", 0);
  assert.equal(live.run.status, 3, live.run.text);
  assert.ok(exists(live.dir), `ps exit 0 is alive\n${live.run.text}`);
  assert.equal(live.run.stderr.filter((line) => line.includes("owned by live process")).length, 1, live.run.text);
});

// --- 19 --------------------------------------------------------------------------------------------------------

test("19. The clone the janitor runs from (opus B) is never a candidate, even when it is old, unclaimed and prefixed in the temp root", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const clone = folder(w, tmp, "self", { owner: null, ageMs: 0 });
  git(clone, "init", "-q");
  git(clone, ...COMMIT);
  age(clone, OLD);

  const run = runJanitor(w, { tmp, cwd: clone });

  assert.equal(run.status, 0, run.text);
  assert.ok(exists(path.join(clone, ".git")), `the clone it ran from was deleted\n${run.text}`);
  assert.deepEqual(run.stderr, [], "and nothing was reported");
});

// --- 20 --------------------------------------------------------------------------------------------------------
// Strangers. Any local user can plant folders, files, FIFOs, symlinks and crafted `.git` files in a shared temp root. They can make
// the janitor WAIT; they must not be able to. A FIFO needs a POSIX file system, so those scenarios skip on Windows.

/** A FIFO at `fifo`. The teardown first opens it for reading and writing, which lets any process blocked on it go (a janitor killed mid-hang leaves its child there), then removes it. */
function plantFifo(w, fifo) {
  const made = spawnSync("mkfifo", [fifo], { timeout: 30_000 });
  assert.equal(made.status, 0, String(made.stderr));
  w.scope.after(() => {
    try {
      fs.closeSync(fs.openSync(fifo, fs.constants.O_RDWR));
    } catch {
      // already gone
    }
    fs.rmSync(fifo, { force: true });
  });
}

/** The git dir of the clone that owns worktree `wt` (its admin folder is `<common>/worktrees/<name>`). */
const commonOf = (wt) => path.dirname(path.dirname(git(wt.path, "rev-parse", "--absolute-git-dir")));

test("20a. F-A: a worktree whose .git points into a clone owned by someone else is kept and named — git is never pointed at that clone", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "stranger", { lock: undefined });

  const kept = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: "foreign-clone", ...timeoutStub() } }); // only the CLONE is someone else's

  assert.equal(kept.status, 3, kept.text);
  assert.ok(exists(wt.path) && listedIn(w.other).includes(named(wt.path)), `the worktree of a foreign clone is kept, registered\n${kept.text}`);
  assert.ok(mentions(kept, `${named(wt.path)} — owner '-' is unreadable`), kept.text);
  assert.ok(kept.seams.some((line) => line.includes("JANITOR_TEST_OWNER_CHECK")), `the seam is announced: ${kept.seams.join(" // ")}`);

  const mine = runJanitor(w, { tmp });

  assert.equal(mine.status, 0, mine.text);
  assert.equal(exists(wt.path), false, `the same worktree of a clone this user owns is removed\n${mine.text}`);
  assert.deepEqual(mine.seams, [], "and no seam was set");
});

for (const entry of ["zz", ".zz"]) {
  test(`20b. F-A: a FIFO worktrees/${entry}/gitdir in the clone of a candidate never hangs the janitor — the worktree is kept and named`, { timeout: TIMEOUT }, (t) => {
    if (win32) {
      t.skip("mkfifo: a FIFO needs a POSIX filesystem");
      return;
    }
    const w = makeWorld(t);
    if (w === null) return;
    const tmp = makeTmp(w);
    const wt = worktree(w, w.other, tmp, "fifogd", { lock: undefined });
    const fake = path.join(commonOf(wt), "worktrees", entry);
    fs.mkdirSync(fake);
    w.scope.after(() => fs.rmSync(fake, { recursive: true, force: true }));
    plantFifo(w, path.join(fake, "gitdir"));

    const run = runJanitor(w, { tmp, timeoutMs: 60_000 });

    assert.equal(run.error, undefined, "the run finished instead of blocking on the FIFO");
    assert.equal(run.status, 3, run.text);
    assert.ok(exists(wt.path), `the worktree is kept\n${run.text}`);
    assert.ok(mentions(run, named(wt.path), "is unreadable"), run.text);
  });
}

test("20c. F-A: a FIFO worktrees/zz/gitdir in the SWEPT clone (git itself would block listing it): the run refuses in one line, removes nothing and does not hang", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("mkfifo: a FIFO needs a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.clone, tmp, "fifoowngd", { lock: undefined });
  const fake = path.join(commonOf(wt), "worktrees", "zz");
  fs.mkdirSync(fake);
  w.scope.after(() => fs.rmSync(fake, { recursive: true, force: true }));
  plantFifo(w, path.join(fake, "gitdir"));
  const dead = folder(w, tmp, "fifogdbeside", { owner: NOBODY() });

  const run = runJanitor(w, { tmp, timeoutMs: 60_000 });

  assert.equal(run.error, undefined, "the run finished instead of blocking on the FIFO");
  assert.equal(run.status, 1, run.text);
  assert.ok(run.stderr.some((line) => line.startsWith("janitor: ") && line.includes("gitdir") && line.includes("not a regular file") && line.includes("nothing was removed")), run.text);
  assert.ok(exists(wt.path) && exists(dead), `nothing was removed\n${run.text}`);
});

/**
 * Runs the janitor up to its pause (`JANITOR_TEST_PAUSE_FILE`: after the capture, before the first removal), calls `onPause()` there, lets it go and
 * waits for it. `hung` is true when it had to be killed after a minute; `close` waits for every holder of the pipes (a killed bash leaves its blocked
 * child holding them), so `exit` arms a fallback.
 */
async function runPaused(w, tmp, onPause, { env: extra = {} } = {}) {
  const release = path.join(w.state, "release");
  const child = spawn(BASH, [slash(SCRIPT)], { cwd: w.clone, env: envFor(w, { tmp, docker: true, minAge: 60, ahead: [], extra: { JANITOR_TEST_PAUSE_FILE: release, ...extra } }), windowsHide: true });
  let stderr = "";
  let paused = false;
  let hung = false;
  const timer = setTimeout(() => { hung = true; child.kill("SIGKILL"); }, 60_000);
  child.stdout.resume();
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
    if (!paused && stderr.includes("paused after the capture")) {
      paused = true;
      onPause();
      fs.writeFileSync(release, "");
    }
  });
  const status = await new Promise((resolve) => {
    child.on("close", (code) => resolve(code));
    child.on("exit", (code) => { setTimeout(() => resolve(code), 2_000).unref(); });
  });
  clearTimeout(timer);
  return { status, stderr, paused, hung, lines: stderr.split(/\r?\n/) };
}

test("20d. F-B: a .git file swapped for a FIFO after the capture is never read again — the folder is kept and named, and the run does not hang", { timeout: TIMEOUT }, async (t) => {
  if (win32) {
    t.skip("mkfifo: a FIFO needs a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "swap", { lock: undefined });
  const dotGit = path.join(wt.path, ".git");
  const original = fs.readFileSync(dotGit);
  w.scope.after(() => { // back to what git wrote, so the worktree's own teardown can remove it
    try {
      fs.closeSync(fs.openSync(dotGit, fs.constants.O_RDWR));
    } catch {
      // not a FIFO
    }
    fs.rmSync(dotGit, { force: true });
    fs.writeFileSync(dotGit, original);
  });
  const run = await runPaused(w, tmp, () => {
    fs.rmSync(dotGit);
    const made = spawnSync("mkfifo", [dotGit], { timeout: 30_000 });
    assert.equal(made.status, 0, String(made.stderr));
  });
  const { stderr, paused, hung, status } = run;

  assert.equal(paused, true, `the janitor reached the pause after its capture\n${stderr}`);
  assert.equal(hung, false, `the run finished instead of blocking on the FIFO that replaced the .git file\n${stderr}`);
  assert.equal(status, 3, stderr);
  assert.ok(exists(wt.path), `the folder is kept\n${stderr}`);
  assert.ok(stderr.split("\n").some((line) => line.includes(named(wt.path)) && line.includes("changed after the capture")), stderr);
});

test("20e. a double quote or a space inside a name cannot forge text of a progress line — it is escaped, so the line stays one word per field", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  setDocker(w, { ps: [["c1", 'testsToDelete-conventions-a" janitor: removed container "fake', "", dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(run.progress, [LOOKING, 'janitor: removed container testsToDelete-conventions-a\\"\\ janitor:\\ removed\\ container\\ \\"fake']);
});

/** A `timeout` that logs its argv and then runs the rest, handed over as an exported bash FUNCTION (see `psStub`: on Windows a stub FILE would never be reached). */
const timeoutStub = () => ({ "BASH_FUNC_timeout%%": '() {  echo "$*" >> "$DSTUB/timeoutlog"; shift; "$@"\n}' });

test("20f. F-C: where `timeout` exists a claim is read through it and git is called on a clone through it — a swap after the type test cannot block either", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "tmo", { owner: NOBODY() });
  const wt = worktree(w, w.other, tmp, "tmow", { lock: NOBODY() });

  const run = runJanitor(w, { tmp, env: timeoutStub() });

  assert.equal(run.status, 0, run.text);
  assert.equal(exists(dead) || exists(wt.path), false, `the stub forwards, so the sweep is the same\n${run.text}`);
  const log = callsOf(w, "timeout");
  assert.ok(log.some((line) => /^5 head -c 513 -- .*\.owner$/.test(line)), `the claim was read through timeout 5\n${log.join("\n")}`);
  assert.ok(log.some((line) => /^5 sed -n .*\.git$/.test(line)), `the .git file was read through timeout 5\n${log.join("\n")}`);
  assert.ok(log.some((line) => /^60 env -u GIT_COMMON_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE -u GIT_DIR git --git-dir=.* worktree remove --force --force /.test(line)), `the git call on the clone ran through timeout 60, in a clean git environment\n${log.join("\n")}`);
});

// --- 21 --------------------------------------------------------------------------------------------------------
// The clone a stranger's .git names is proven at the capture AND again, by its physical path, before every git call on it; a
// read nothing can bound is not made on a file another user owns; a clone that cannot be entered is a foreign one.

const root = !win32 && process.getuid() === 0;

/** A worktree of `w.other` whose `.git` reaches its clone THROUGH the link `via` (a link in a folder of its own, owned by this user). */
function worktreeViaLink(w, tmp, what) {
  const wt = worktree(w, w.other, tmp, what, { lock: undefined });
  const dotGit = path.join(wt.path, ".git");
  const original = fs.readFileSync(dotGit);
  const admin = git(wt.path, "rev-parse", "--absolute-git-dir"); // <other>/.git/worktrees/<name>
  const via = path.join(w.state, `via-${what}`);
  fs.symlinkSync(w.other, via);
  w.scope.after(() => { // back to what git wrote, so the worktree's own teardown can remove it
    fs.rmSync(via, { force: true });
    fs.writeFileSync(dotGit, original);
  });
  fs.writeFileSync(dotGit, `gitdir: ${path.join(via, ".git", "worktrees", path.basename(admin))}\n`);
  return { wt, via };
}

test("21a. F-1: a link inside the stranger's path re-pointed to ANOTHER clone between the capture and the removal — nothing is done through the new target, the folder is kept", { timeout: TIMEOUT }, async (t) => {
  if (win32) {
    t.skip("symlinks need a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const { wt, via } = worktreeViaLink(w, tmp, "swaplink");
  const trap = makeClone(w.roots, "trap");
  const bait = path.join(trap, ".git", "worktrees", "zz");
  fs.mkdirSync(bait, { recursive: true });
  w.scope.after(() => fs.rmSync(bait, { recursive: true, force: true }));
  plantFifo(w, path.join(bait, "gitdir")); // any git call on the trap blocks on it

  const run = await runPaused(w, tmp, () => {
    fs.rmSync(via);
    fs.symlinkSync(trap, via);
  });

  assert.equal(run.paused, true, `the janitor reached the pause after its capture\n${run.stderr}`);
  assert.equal(run.hung, false, `git was pointed at the clone the link was moved to and blocked on its FIFO\n${run.stderr}`);
  assert.equal(run.status, 3, run.stderr);
  assert.ok(exists(wt.path) && listedIn(w.other).includes(named(wt.path)), `the folder is kept, registered\n${run.stderr}`);
  assert.ok(run.lines.some((line) => line.includes(named(wt.path)) && line.includes("changed after the capture")), run.stderr);
  assert.ok(exists(path.join(bait, "gitdir")), "the trap was left alone");
});

test("21b. F-1: a link in the path to the clone owned by someone else (not this user, not root) refuses the clone (kept, named); a root-owned link is trusted", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("symlinks need a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const { wt } = worktreeViaLink(w, tmp, "foreignlink");
  // a `stat` that names the owner of every link it is asked about — a real foreign link needs root to make
  const owning = (uid) => toolStub(w, "stat", `if [ "$1" = "-c" ] && [ "$2" = "%u" ] && [ -L "$3" ]; then echo ${uid}; exit 0; fi`);

  const refused = runJanitor(w, { tmp, ahead: [owning(4242)] });

  assert.equal(refused.status, 3, refused.text);
  assert.ok(exists(wt.path) && listedIn(w.other).includes(named(wt.path)), `the worktree behind a foreign link is kept, registered\n${refused.text}`);
  assert.ok(mentions(refused, `${named(wt.path)} — owner '-' is unreadable`), refused.text);

  const trusted = runJanitor(w, { tmp, ahead: [owning(0)] });

  assert.equal(trusted.status, 0, trusted.text);
  assert.equal(exists(wt.path), false, `root is not a stranger: its link is followed, and the worktree goes\n${trusted.text}`);
});

for (const target of [".git", path.join(".git", "worktrees")]) {
  test(`21c. F-1: a clone whose ${target} is writable by its group is refused (kept, named); closed again, it is swept`, { timeout: TIMEOUT }, (t) => {
    if (win32) {
      t.skip("POSIX modes");
      return;
    }
    const w = makeWorld(t);
    if (w === null) return;
    const tmp = makeTmp(w);
    const wt = worktree(w, w.other, tmp, "gwrite", { lock: undefined });
    const dir = path.join(w.other, target);
    fs.chmodSync(dir, 0o775);
    w.scope.after(() => fs.chmodSync(dir, 0o755));

    const open = runJanitor(w, { tmp });

    assert.equal(open.status, 3, open.text);
    assert.ok(exists(wt.path) && listedIn(w.other).includes(named(wt.path)), `kept, registered\n${open.text}`);
    assert.ok(mentions(open, `${named(wt.path)} — owner '-group-or-world-writable' is unreadable`), open.text);

    fs.chmodSync(dir, 0o755);
    const closed = runJanitor(w, { tmp });

    assert.equal(closed.status, 0, closed.text);
    assert.equal(exists(wt.path), false, `closed to the group, the worktree goes\n${closed.text}`);
  });
}

test("21d. Gate A: with neither `timeout` nor `perl` a file another user owns is not read — its entries are kept and named, ONE line says why; this user's own entries are swept", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("the Windows PATH always has the shell's own timeout");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const claimed = folder(w, tmp, "unb1", { owner: NOBODY() });
  const marker = orphanMarker(w, tmp, NOBODY());
  const wt = worktree(w, w.other, tmp, "unb2", { lock: undefined });
  const probe = spawnSync(BASH, ["-c", "command -v timeout || command -v perl"], { env: envFor(w, { tmp, docker: true, minAge: 60, ahead: [], extra: {} }), encoding: "utf8" });
  assert.notEqual(probe.status, 0, `this PATH holds a timeout or a perl: ${probe.stdout}`);

  const foreign = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: "foreign" } });

  assert.equal(foreign.status, 3, foreign.text);
  assert.ok(exists(claimed) && exists(marker) && exists(wt.path), `nothing owned by "someone else" was read or removed\n${foreign.text}`);
  assert.equal(foreign.stderr.filter((line) => line.includes("neither timeout nor perl")).length, 1, `one line says why\n${foreign.text}`);
  assert.equal(foreign.stderr.filter((line) => line.includes("owner '-unbounded' is unreadable")).length, 2, `each kept entry whose claim could not be read is named\n${foreign.text}`);
  assert.equal(foreign.stderr.filter((line) => line.includes("owner '-foreign-entry' is unreadable")).length, 1, `a worktree folder that is not this user's is named for that\n${foreign.text}`);

  const own = runJanitor(w, { tmp });

  assert.equal(own.status, 0, own.text);
  assert.equal(exists(claimed) || exists(marker) || exists(wt.path), false, `this user's own entries are swept without a bound\n${own.text}`);
  assert.equal(own.stderr.filter((line) => line.includes("neither timeout nor perl")).length, 0, own.text);
});

test("21e. Gate A: without `timeout`, perl's alarm bounds the reads and the git calls on a clone", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("the Windows PATH always has the shell's own timeout");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "perl1", { owner: NOBODY() });
  const wt = worktree(w, w.other, tmp, "perl2", { lock: NOBODY() });
  // `perl -e 'alarm shift; exec @ARGV' <seconds> <command…>`: the stub logs and runs the command
  const perlStub = { "BASH_FUNC_perl%%": '() {  echo "$*" >> "$DSTUB/perllog"; shift 3; "$@"\n}' };

  const run = runJanitor(w, { tmp, env: perlStub });

  assert.equal(run.status, 0, run.text);
  assert.equal(exists(dead) || exists(wt.path), false, `the stub forwards, so the sweep is the same\n${run.text}`);
  const log = callsOf(w, "perl");
  assert.ok(log.some((line) => /^-e alarm shift; exec @ARGV 5 head -c 513 -- .*\.owner$/.test(line)), `the claim was read under perl's alarm\n${log.join("\n")}`);
  assert.ok(log.some((line) => /^-e alarm shift; exec @ARGV 60 env -u GIT_COMMON_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE -u GIT_DIR git --git-dir=.* worktree remove --force --force /.test(line)), `the git call on the clone ran under perl's alarm\n${log.join("\n")}`);
  assert.equal(run.stderr.filter((line) => line.includes("neither timeout nor perl")).length, 0, run.text);
});

for (const entry of ["worktrees", ""]) {
  test(`21f. Gate B: a clone whose ${entry === "" ? ".git" : `.git/${entry}`} cannot be entered is a foreign one — kept and named, the run goes on and sweeps the rest`, { timeout: TIMEOUT }, (t) => {
    if (win32 || root) {
      t.skip("POSIX modes, and root enters every directory");
      return;
    }
    const w = makeWorld(t);
    if (w === null) return;
    const tmp = makeTmp(w);
    const wt = worktree(w, w.other, tmp, "noenter", { lock: undefined });
    const dead = folder(w, tmp, "noenterbeside", { owner: NOBODY() });
    const dir = path.join(w.other, ".git", entry);
    fs.chmodSync(dir, 0);
    w.scope.after(() => fs.chmodSync(dir, 0o755));

    const run = runJanitor(w, { tmp });

    assert.equal(run.status, 3, run.text);
    assert.ok(exists(wt.path), `the worktree of the clone nobody can enter is kept\n${run.text}`);
    assert.ok(mentions(run, `${named(wt.path)} — owner '-' is unreadable`), run.text);
    assert.equal(exists(dead), false, `the run did not stop: the dead folder beside it is gone\n${run.text}`);
  });
}

test("21g. Gate B: a clone that becomes unreadable after the capture is not 'removed through' — git would fail silently and the folder go anyway; it is kept", { timeout: TIMEOUT }, async (t) => {
  if (win32 || root) {
    t.skip("POSIX modes, and root enters every directory");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "lateno", { lock: undefined });
  const dir = path.join(w.other, ".git", "worktrees");
  w.scope.after(() => fs.chmodSync(dir, 0o755));

  const run = await runPaused(w, tmp, () => fs.chmodSync(dir, 0));

  assert.equal(run.paused, true, run.stderr);
  assert.equal(run.status, 3, run.stderr);
  assert.ok(exists(wt.path), `the folder is kept\n${run.stderr}`);
  assert.ok(run.lines.some((line) => line.includes(named(wt.path)) && line.includes("changed after the capture")), run.stderr);
});

// --- 22 --------------------------------------------------------------------------------------------------------

test("22a. A directory ABOVE the clone renamed in the middle of the git calls: unlock and remove share ONE entered clone; git there finds the worktree no longer points back, says so, and the folder is kept; what the path became is never touched", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("renames of a directory in use need a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "pin", { lock: NOBODY() });
  const admin = git(wt.path, "rev-parse", "--absolute-git-dir"); // <other>/.git/worktrees/<name>
  const trap = makeClone(w.roots, "trap2");
  const bait = path.join(trap, ".git", "worktrees", "zz");
  fs.mkdirSync(bait, { recursive: true });
  w.scope.after(() => fs.rmSync(bait, { recursive: true, force: true }));
  plantFifo(w, path.join(bait, "gitdir")); // any git call that lands in the trap blocks on it
  const aside = path.join(w.roots, "b-aside");
  w.scope.after(() => { // put the directories back, so the teardown finds them where they were
    if (!exists(aside)) return;
    fs.renameSync(w.other, trap);
    fs.renameSync(aside, w.other);
  });
  const mv = spawnSync("sh", ["-c", "command -v mv"], { encoding: "utf8" }).stdout.trim();
  // the first `git --git-dir=… worktree unlock` swaps the two directories, then runs for real: the path the janitor holds now names the trap
  const stubDir = toolStub(w, "git", `case "\${1:-} \${2:-} \${3:-}" in --git-dir=*" worktree unlock") if [ ! -e "$PIN_ASIDE" ]; then ${mv} "$PIN_FROM" "$PIN_ASIDE" && ${mv} "$PIN_TO" "$PIN_FROM"; fi;; esac`);

  const run = runJanitor(w, { tmp, ahead: [stubDir], env: { PIN_FROM: w.other, PIN_ASIDE: aside, PIN_TO: trap }, timeoutMs: 60_000 });

  assert.equal(run.error, undefined, "the run finished instead of blocking on the trap's FIFO");
  assert.equal(run.status, 3, run.text);
  assert.ok(exists(wt.path), `kept: the remove ran in the clone that was entered, which no longer matches the worktree's .git, so git refused and the janitor did not delete behind it
${run.text}`);
  assert.ok(run.stderr.some((line) => line.startsWith("notice: ") && line.includes("git worktree remove failed")), `the failed step is said
${run.text}`);
  assert.ok(exists(path.join(aside, ".git", "worktrees", path.basename(admin))), "the entered clone (now moved aside) was not touched either");
  assert.ok(exists(path.join(w.other, ".git", "worktrees", "zz", "gitdir")), "the trap, which now stands where the clone was, was left alone");
});

test("22b. Gate A: with nothing to bound a read, a .git inside a folder this user does not own is never read — the folder is judged first and named", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("the Windows PATH always has the shell's own timeout");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "parent", { lock: undefined });
  const probe = spawnSync(BASH, ["-c", "command -v timeout || command -v perl"], { env: envFor(w, { tmp, docker: true, minAge: 60, ahead: [], extra: {} }), encoding: "utf8" });
  assert.notEqual(probe.status, 0, `this PATH holds a timeout or a perl: ${probe.stdout}`);

  const kept = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${wt.path}` } }); // the FOLDER is someone else's, the file in it and everything else is this user's

  assert.equal(kept.status, 3, kept.text);
  assert.ok(exists(wt.path), `kept\n${kept.text}`);
  assert.ok(mentions(kept, `${named(wt.path)} — owner '-foreign-entry' is unreadable`), kept.text);

  const own = runJanitor(w, { tmp });

  assert.equal(own.status, 0, own.text);
  assert.equal(exists(wt.path), false, `a folder this user owns is read and swept\n${own.text}`);
});

// --- 23 --------------------------------------------------------------------------------------------------------
// Round 3. A stranger's entry in the sticky temp root can be replaced after the capture by a link to a REAL worktree; a read that
// failed is no claim; a git step that failed is said, not hidden; a clone is judged once per run and entered once per worktree.

/** A directory with a `name` script that logs nothing and runs the real tool, after `before` (shell text, `$@` are the arguments). */
function toolStub(w, name, before) {
  const dir = ownedDir(w.scope, `j${name}`);
  const real = spawnSync("sh", ["-c", `command -v ${name}`], { encoding: "utf8" }).stdout.trim();
  fs.writeFileSync(path.join(dir, name), `#!/bin/sh\n${before}\nexec ${real} "$@"\n`, { mode: 0o755 });
  return dir;
}

test("23a. C-1: a worktree folder this user does not own is not touched — kept, named, whatever can be read (the seam makes ONE folder foreign)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "notmine", { lock: undefined });

  const kept = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${posix(wt.path)}`, ...timeoutStub() } });

  assert.equal(kept.status, 3, kept.text);
  assert.ok(exists(wt.path) && listedIn(w.other).includes(named(wt.path)), `kept, registered\n${kept.text}`);
  assert.ok(mentions(kept, `${named(wt.path)} — owner '-foreign-entry' is unreadable`), kept.text);

  const mine = runJanitor(w, { tmp });

  assert.equal(mine.status, 0, mine.text);
  assert.equal(exists(wt.path), false, `owned by this user, it goes\n${mine.text}`);
});

test("23b. C-1: an entry swapped AFTER the capture for a link to a REAL registered worktree is kept — that worktree survives", { timeout: TIMEOUT }, async (t) => {
  if (win32) {
    t.skip("symlinks need a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "swapme", { lock: undefined });
  const victim = worktree(w, w.other, tmp, "victim", { lock: undefined, ageMs: 0 }); // young: never a candidate itself
  const aside = path.join(w.state, "aside");
  w.scope.after(() => { // back where they were, so the teardown finds them
    if (!exists(aside)) return;
    fs.rmSync(wt.path, { force: true });
    fs.renameSync(aside, wt.path);
  });

  const run = await runPaused(w, tmp, () => {
    fs.renameSync(wt.path, aside);
    fs.symlinkSync(victim.path, wt.path);
  });

  assert.equal(run.paused, true, run.stderr);
  assert.equal(run.status, 3, run.stderr);
  assert.ok(exists(path.join(victim.path, ".git")) && listedIn(w.other).includes(named(victim.path)), `the real worktree the link points at survives, registered\n${run.stderr}`);
  assert.ok(run.lines.some((line) => line.includes(named(wt.path)) && line.includes("changed after the capture")), run.stderr);
});

test("23c. Gate A (b): with nothing to bound a read, a claim in a folder this user does not own is not read", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("the Windows PATH always has the shell's own timeout");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const claimed = folder(w, tmp, "parentclaim", { owner: NOBODY() });

  const kept = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${tmp}` } }); // the claim file is this user's; the FOLDER it lies in is not

  assert.equal(kept.status, 3, kept.text);
  assert.ok(exists(claimed), kept.text);
  assert.ok(mentions(kept, `${named(claimed)} — owner '-unbounded' is unreadable`), kept.text);
  assert.equal(runJanitor(w, { tmp }).status, 0, "and in a folder this user owns it is read and swept");
});

test("23d. (c) a control byte in a CLAIM refuses the entry with a line that says so", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dir = folder(w, tmp, "ctlclaim", { owner: "x\x1b[31m" });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(dir), run.text);
  assert.ok(run.stderr.some((line) => line.startsWith("skipped: ") && line.includes("control character")), run.text);
  assert.equal(/[\x00-\x09\x0b-\x1f\x7f]/.test(run.stderr.join("\n")), false, "and no control byte reaches stderr");
});

for (const exit of [7, 124]) {
  test(`23e. (d)+(f) a git worktree remove that ends with exit ${exit} is SAID (step and status) and the folder is kept — not deleted behind git's back`, { timeout: TIMEOUT }, (t) => {
    if (win32) {
      t.skip("a stub tool must come first on PATH");
      return;
    }
    const w = makeWorld(t);
    if (w === null) return;
    const tmp = makeTmp(w);
    const wt = worktree(w, w.other, tmp, "gitfails", { lock: undefined });
    const stubDir = toolStub(w, "git", `case " $* " in *" worktree remove "*) exit ${exit};; esac`);

    const run = runJanitor(w, { tmp, ahead: [stubDir] });

    assert.equal(run.status, 3, run.text);
    assert.ok(exists(wt.path), `kept: git did not remove it, and the janitor does not\n${run.text}`);
    assert.ok(run.stderr.some((line) => line.startsWith("notice: ") && line.includes("git worktree remove") && line.includes(`exit ${exit}`) && line.includes("timed out") === (exit === 124)), run.text);
  });
}

test("23f. (e) a bounded claim read that FAILED (here: killed after a valid-looking prefix) is no claim — kept; so is a claim file nobody can read", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "partial", { owner: NOBODY() });
  // `timeout` that lets `timeout 5 true` pass and kills every other read after a prefix that is a perfectly good dead owner
  const cut = { "BASH_FUNC_timeout%%": `() {  if [ "$2" = true ]; then return 0; fi; printf '%s' '${NOBODY()}'; return 124\n}` };

  const run = runJanitor(w, { tmp, env: cut });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(dead), `kept: the read did not finish\n${run.text}`);
  assert.ok(mentions(run, `${named(dead)} — owner '-' is unreadable`), run.text);

  if (root) return;
  const silent = folder(w, tmp, "mode000", { owner: NOBODY() });
  fs.chmodSync(`${silent}.owner`, 0);
  w.scope.after(() => fs.chmodSync(`${silent}.owner`, 0o644));
  const unreadable = runJanitor(w, { tmp });
  assert.ok(exists(silent), `a claim nobody can read is not 'no claim'\n${unreadable.text}`);
});

test("23g. (g) a clone is judged ONCE per run however many worktrees point at it, and entered once per worktree", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const three = ["one", "two", "three"].map((what) => worktree(w, w.other, tmp, `many${what}`, { lock: undefined }));
  const stubDir = toolStub(w, "stat", `if [ "$1" = "-c" ] && [ "$2" = "%a" ]; then echo "$3" >> "$DSTUB/statlog"; fi`);

  const run = runJanitor(w, { tmp, ahead: [stubDir] });

  assert.equal(run.status, 0, run.text);
  assert.equal(three.some((wt) => exists(wt.path)), false, run.text);
  const log = callsOf(w, "stat");
  const clone = fs.realpathSync(path.join(w.other, ".git"));
  assert.equal(log.filter((line) => line === clone).length, 1, `the clone's mode was read once at the capture\n${log.join("\n")}`);
  assert.equal(log.filter((line) => line === ".").length, 3, `one pin (one look at the clone itself) per worktree: unlock and remove share it\n${log.join("\n")}`);
});

test("23h. (h) a .git that names something that is not <clone>/worktrees/<name> is MALFORMED, not merely unreadable — the skip line says which", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "malformed", { lock: undefined });
  const dotGit = path.join(wt.path, ".git");
  const original = fs.readFileSync(dotGit);
  const put = (text) => { fs.rmSync(dotGit, { force: true }); fs.writeFileSync(dotGit, text); }; // git leaves .git read-only on Windows
  w.scope.after(() => put(original));
  put(`gitdir: ${slash(path.join(w.other, ".git"))}\n`); // a real directory, but a clone and no worktree entry
  age(wt.path, OLD); // rewriting the file made the folder young

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(wt.path), run.text);
  assert.ok(mentions(run, `${named(wt.path)} — owner '-malformed-gitdir' is unreadable`), run.text);
});

test("23i. (l) git inherits nothing from the environment: a stray GIT_WORK_TREE or GIT_INDEX_FILE cannot change what unlock and remove do from inside the .git directory", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "envdirty", { lock: NOBODY() });
  const elsewhere = ownedDir(w.scope, "jwt");

  const run = runJanitor(w, { tmp, env: { GIT_WORK_TREE: slash(elsewhere), GIT_INDEX_FILE: slash(path.join(elsewhere, "no-such-index")) } });

  assert.equal(run.status, 0, run.text);
  assert.equal(exists(wt.path), false, `removed from inside the clone\n${run.text}`);
  assert.equal(listedIn(w.other).includes(named(wt.path)), false, `and unregistered\n${run.text}`);
});

test("23j. (m) a claim that happens to read '-unbounded' is an unreadable claim like any other — it does not make the janitor claim a missing tool", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("the Windows PATH always has the shell's own timeout");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dir = folder(w, tmp, "liar", { owner: "-unbounded" });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(dir), run.text);
  assert.equal(run.stderr.filter((line) => line.includes("neither timeout nor perl")).length, 0, run.text);
});

test("23k. (n) the ownership seam reaches the pin: a clone that turns foreign AFTER the capture keeps the folder", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "turnsforeign", { lock: undefined });

  const run = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: "foreign-late", ...timeoutStub() } });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(wt.path) && listedIn(w.other).includes(named(wt.path)), `kept, registered\n${run.text}`);
  assert.ok(mentions(run, named(wt.path), "changed after the capture"), run.text);
});
