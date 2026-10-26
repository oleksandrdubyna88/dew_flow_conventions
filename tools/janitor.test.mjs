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
  cleanupScope, formatOwner, ownedDir, ownedName, ownedWorktree, processProbe, removeLink, removeQuietly, thisOwner, thisOwnerToken, windowsOwnerToken,
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
const LINUX_TOOLS = ["bash", "sed", "awk", "grep", "find", "head", "tr", "cut", "xargs", "git", "hostname", "uname", "date", "stat", "rm", "env", "sleep", "readlink", "mv", "mkdir", "rmdir", "id", "sha256sum"];
const ME = thisOwnerToken(); // the caller's owner token: the janitor under test derives the same one from its own uid
const PREFIX = ["tests", "ToDelete"].join(""); // a name of the form before the owner segment is built from pieces: this file never spells one

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
  const asWindows = extra.JANITOR_OS === "windows" && extra.TESTSTODELETE_OWNER === undefined ? { TESTSTODELETE_OWNER: ME } : {}; // the Windows branch derives `w<digits>` from the account name; the fixtures are named for this user's own token
  const armed = (extra.JANITOR_OS === "windows" || win32) && extra.JANITOR_WINDOWS_E2E_GREEN === undefined ? { JANITOR_WINDOWS_E2E_GREEN: "1" } : {}; // a Windows run is --dry-run until the person arms it: the scenarios test the sweep, S4-28b the gate
  return {
    ...env, PATH: [...ahead, pathFor(w, { docker })].join(path.delimiter), TMPDIR: posix(tmp),
    JANITOR_MIN_AGE_MINUTES: String(minAge), DSTUB: slash(w.state), ...asWindows, ...armed, ...extra,
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
emitq() { [ -f "$1" ] || return 0; while IFS= read -r l || [ -n "$l" ]; do n="\${l%%"$TAB"*}"; r="\${l#*"$TAB"}"; printf '"%s"\\t"%s"\\n' "$n" "$r"; done < "$1"; }
has() { [ -f "$S/mode" ] || return 1; while IFS= read -r l || [ -n "$l" ]; do [ "$l" = "$1" ] && return 0; done < "$S/mode"; return 1; }
failrm() { has "fail-rm:$1" || has "fail-rm:$1:present" || has "fail-rm:$1:absent"; }
present() { has "fail-rm:$1:present"; }
TAB=$(printf '\\t')
vlabel() { [ -f "$S/vol.tsv" ] || return 0; while IFS= read -r l || [ -n "$l" ]; do case "$l" in "$1$TAB"*) printf '%s' "\${l#*"$TAB"}";; esac; done < "$S/vol.tsv"; }
created() { [ -f "$S/volcreated.tsv" ] || return 0; while IFS= read -r l || [ -n "$l" ]; do case "$l" in "$1$TAB"*) printf '%s\\n' "\${l#*"$TAB"}";; esac; done < "$S/volcreated.tsv"; }
case "$1" in
  ps)
    if has fail-ps; then echo "stub: docker ps failed" >&2; exit 1; fi
    n=0; [ -f "$S/psn" ] && read -r n < "$S/psn"; n=$((n + 1)); printf '%s' "$n" > "$S/psn"
    if has toctou && [ "$n" -eq 1 ]; then exit 0; fi
    emit "$S/ps.tsv";;
  volume)
    case "$2" in
      ls) if has quote-ls; then emitq "$S/vol.tsv"; else emit "$S/vol.tsv"; fi;;
      inspect) if [ "$3" = "--format" ]; then fmt="$4"; shift 4; for n in "$@"; do c="$(created "$n")"; case "$fmt" in *Name*) printf '%s\\t%s\\n' "$n" "$c";; *Labels*) printf '%s\\t"%s"\\n' "$c" "$(vlabel "$n")";; *) printf '%s\\n' "$c";; esac; done; else present "$last"; exit $?; fi;;
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

/** The record of `pid`: owner, host, pid, and on Linux the start and the pid namespace — or the smallest form (no start, no namespace) when `twoField`. */
function ownerOf(pid, { twoField = false, owner = ME } = {}) {
  const record = { owner, host: HOST, pid };
  if (linux && !twoField) {
    record.start = pid === process.pid ? (processProbe(pid).start ?? 1) : 1;
    record.ns = thisOwner().ns;
  }
  return formatOwner(record);
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
    ps: [["c9", owned("conventions-late"), LIVE(), dockerTime(OLD)]],
    mode: ["toctou"],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.equal(dockerLog(w).filter((line) => line.startsWith("ps -a")).length, 1, `the capture lists \`ps -a\` exactly once\n${run.text}`);
  assert.deepEqual(rmCalls(w), [], "nothing was removed");
  assert.deepEqual(run.stderr, [], "and nothing was reported: the late container was never seen");
});

// --- 2 ---------------------------------------------------------------------------------------------------------

test("2. Docker: age selects, the owner record authorises, a resource without one is only listed, and the prefix is anchored", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = NOBODY();
  setDocker(w, {
    ps: [
      ["c1", owned("conventions-old"), dead, dockerTime(OLD)],
      ["c2", owned("conventions-young"), dead, dockerTime(YOUNG)],
      ["c3", owned("conventions-live"), LIVE(), dockerTime(OLD)],
      ["c4", owned("conventions-dead"), dead, dockerTime(OLD)],
      ["c5", `prod-${owned("b")}`, "", dockerTime(OLD)],
      ["c6", owned("conventions-nolabel"), "", dockerTime(OLD)],
    ],
    vol: [[owned("v-old"), dead], [owned("v-young"), dead]],
    volCreated: [[owned("v-old"), volumeTime(OLD)], [owned("v-young"), volumeTime(YOUNG)]],
    net: [["a1", owned("n-old"), dead, dockerTime(OLD)]],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.deepEqual(rmCalls(w), ["rm -f -v c1", "rm -f -v c4", `volume rm ${owned("v-old")}`, "network rm a1"]);
  assert.equal(run.stderr.filter((line) => line.startsWith("skipped:")).length, 1, run.text);
  assert.ok(mentions(run, `skipped: container ${owned("conventions-live")} — owned by live process`), run.text);
  assert.equal(mentions(run, "young"), false, `a young resource is left alone silently\n${run.text}`);
  assert.ok(mentions(run, `unmarked: container ${owned("conventions-nolabel")}`), `an old container of this scope with no owner label is listed, never judged\n${run.text}`);
  assert.equal(dockerLog(w).some((line) => line.includes("c6")), false, "and never touched");
  assert.equal(mentions(run, `prod-${owned("b")}`) || dockerLog(w).some((line) => line.includes("c5")), false, `an unanchored name is never named or touched\n${run.text}`);
});

// --- 3 ---------------------------------------------------------------------------------------------------------

test("3. Per resource: a live-owned folder beside a dead old one — the dead one, its claim and an orphan claim go; an unmarked one is listed and kept", { timeout: TIMEOUT }, (t) => {
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
  assert.ok(exists(nobody), `an unclaimed old folder is nobody's the helper knows: it is listed and kept, however old\n${run.text}`);
  assert.ok(mentions(run, `unmarked: folder ${named(nobody)}`), run.text);
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
  assert.ok(branchesOf(w.clone).includes(branch) && mentions(run, `unmarked: branch ${branch}`), `a standalone prefixed branch has no worktree this run removed: listed, kept\n${run.text}`);
  assert.equal(exists(linkedA.path) || exists(linkedB.path), false, `both junction-holding worktrees are gone\n${run.text}`);
  assert.ok(exists(path.join(targetA, "keep.txt")) && exists(path.join(targetB, "keep.txt")), `the junction targets' files are intact\n${run.text}`);
  assert.ok(exists(unlocked.path) && listedIn(w.other).includes(named(unlocked.path)), `an unlocked old worktree has no owner record: listed, never judged, kept\n${run.text}`);
  assert.ok(mentions(run, `unmarked: worktree ${named(unlocked.path)}`), run.text);
  assert.ok(exists(young.path) && listedIn(w.other).includes(named(young.path)), `a young dead-owned one is kept\n${run.text}`);
});

// --- 7 ---------------------------------------------------------------------------------------------------------

test("7. A foreign host is skipped (exit 3); a tree holding only a young worktree exits 0", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const foreign = folder(w, tmp, "foreign", { owner: `${ME}:elsewhere@linux:4242:1:5` });

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
  setDocker(w, { ps: [["c1", owned("conventions-dry"), NOBODY(), dockerTime(OLD)]] });

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
  setDocker(w, { ps: [["c1", owned("conventions-dry"), NOBODY(), dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp, args: ["--dry-run"] });

  assert.equal(run.status, 0, run.text);
  const wouldRun = run.stdout.filter((line) => line.startsWith("would run: "));
  assert.ok(wouldRun.length >= 3, `expected at least three would-run lines on stdout, got [${run.stdout.join(" // ")}]`);
  assert.ok(wouldRun.includes("would run: docker rm -f -v c1"), run.stdout.join("\n"));
  assert.ok(wouldRun.some((line) => line.startsWith("would run: rm -rf -- ") && line.includes(named(dead))), run.stdout.join("\n"));
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
  setDocker(w, { ps: [["c1", owned("conventions-prog"), NOBODY(), dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, "the live folder is skipped: " + run.text);
  assert.equal(run.progress.length, 3, run.progress.join(" // "));
  assert.deepEqual(run.progress.slice(0, 2), [LOOKING, `janitor: removed container ${owned("conventions-prog")}`]);
  assert.ok(run.progress[2].startsWith("janitor: removed folder ") && run.progress[2].includes(named(dead)), run.progress.join(" // "));
  assert.equal(run.progress.some((line) => line.includes(named(live))), false, "a skipped resource is not announced as removed");
  assert.equal(exists(dead), false, "and it really went: " + run.text);
});

test("8c. progress: a dry run prints the capture line and the would-run lines, never a removed line", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  folder(w, tmp, "progdry", { owner: NOBODY() });
  setDocker(w, { ps: [["c1", owned("conventions-progdry"), NOBODY(), dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp, args: ["--dry-run"] });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(run.progress, [LOOKING]);
  assert.ok(run.stdout.includes("would run: docker rm -f -v c1"), run.stdout.join(" // "));
});

test("8c. progress: a name is printed through clean() — non-ASCII text never reaches the terminal as itself", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  setDocker(w, { ps: [["c1", owned("conventions-café"), NOBODY(), dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(run.progress, [LOOKING, `janitor: removed container ${owned("conventions-caf")}\\?\\?`]); // printf %q: the two `?` that clean() made are glob characters, so they are escaped
  assert.equal(/[^ -~]/.test(run.progress[1]), false, "the removed line is printable ASCII only");
});

test("8c. progress: printable text inside a name cannot pass for a second message — the name is quoted", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  setDocker(w, { ps: [["c1", owned("conventions-x janitor: removed container fake"), NOBODY(), dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(run.progress, [LOOKING, `janitor: removed container ${owned("conventions-x")}\\ janitor:\\ removed\\ container\\ fake`]); // every space is escaped: it is ONE word of one line
});

test("8c. progress: a removal that failed is not announced as removed", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  setDocker(w, { ps: [["c1", owned("conventions-progfail"), NOBODY(), dockerTime(OLD)]], mode: ["fail-rm:c1:present"] });

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

test("9. The smallest record <owner>:<host>@<os>:<pid> (no start, no namespace): a reader that needs no namespace judges it — live is skipped, dead is removed; a Linux reader keeps it, named", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const judge = (what, pid, rc) => {
    const dir = folder(w, tmp, what, { owner: OWNER_AS("macos", pid) });
    assert.doesNotMatch(fs.readFileSync(`${dir}.owner`, "utf8").trim(), /:\d+:\d+$/, "the fixture is the two-field form");
    return { dir, run: runJanitor(w, { tmp, env: { JANITOR_OS: "macos", ...psStub(rc) } }) };
  };

  const live = judge("twolive", process.pid, 0);
  assert.equal(live.run.status, 3, live.run.text);
  assert.ok(exists(live.dir));
  assert.ok(mentions(live.run, `${named(live.dir)} — owned by live process ${process.pid}`), live.run.text);

  const dead = judge("twodead", unmatchablePid(), 1);
  assert.equal(exists(dead.dir) || exists(`${dead.dir}.owner`), false, dead.run.text);

  if (!linux) return;
  const linuxKept = folder(w, tmp, "twolinux", { owner: ownerOf(unmatchablePid(), { twoField: true }) });
  const kept = runJanitor(w, { tmp });
  assert.equal(kept.status, 3, kept.text);
  assert.ok(exists(linuxKept) && exists(`${linuxKept}.owner`), `a Linux reader does not judge a record without a pid namespace\n${kept.text}`);
  assert.ok(mentions(kept, `${named(linuxKept)} — liveness unknown for process ${unmatchablePid()}`, "pid namespace"), kept.text);
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
  assert.ok(mentions(run, `unmarked: branch ${branch}`), `a branch is removed only with a worktree this run removed: here it is only listed\n${run.text}`);
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
      ["ce", owned("conventions-vanish"), NOBODY(), dockerTime(OLD)],
      ["cb", owned("conventions-stuck"), NOBODY(), dockerTime(OLD)],
    ],
    mode: ["fail-rm:ce:absent", "fail-rm:cb:present"],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(mentions(run, `notice: container ${owned("conventions-vanish")} — vanished after the capture`), run.text);
  assert.ok(mentions(run, `skipped: container ${owned("conventions-stuck")} — could not be removed`), run.text);
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
  const names = [owned("v-a"), owned("v-b"), owned("v-c")];
  setDocker(w, { vol: names.map((name) => [name, NOBODY()]), volCreated: names.map((name) => [name, volumeTime(OLD)]) });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  const inspects = dockerLog(w).filter((line) => line.startsWith("volume inspect") && line.includes(".Name"));
  assert.equal(inspects.length, 1, `one capture inspect for three volumes, got [${inspects.join(" // ")}]\n${run.text}`);
  assert.equal(dockerLog(w).filter((line) => line.startsWith("volume inspect") && line.includes(".Labels")).length, 3, "and one re-inspect of each, just before it is removed (same creation time, same label)");
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
const OWNER_AS = (os, pid) => `${ME}:${HOST.split("@")[0]}@${os}:${pid}`;
const owned = (rest) => `${PREFIX}-${ME}-${rest}`; // a name of the CALLER's scope, as docker prints it

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

test("19. The clone the janitor runs from (opus B) is never a candidate, even when it is old, dead-owned and prefixed in the temp root", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const clone = folder(w, tmp, "self", { owner: NOBODY(), ageMs: 0 }); // dead-owned: it would go were it not the clone the janitor runs from
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
  const wt = worktree(w, w.other, tmp, "stranger", { lock: NOBODY() });

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
    const wt = worktree(w, w.other, tmp, "fifogd", { lock: NOBODY() });
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
  const wt = worktree(w, w.clone, tmp, "fifoowngd", { lock: NOBODY() });
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
async function runPaused(w, tmp, onPause, { env: extra = {}, ahead = [] } = {}) {
  const release = path.join(w.state, "release");
  fs.rmSync(release, { force: true }); // a second paused run in one world starts from an unreleased pause
  const child = spawn(BASH, [slash(SCRIPT)], { cwd: w.clone, env: envFor(w, { tmp, docker: true, minAge: 60, ahead, extra: { JANITOR_TEST_PAUSE_FILE: release, ...extra } }), windowsHide: true });
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
  const wt = worktree(w, w.other, tmp, "swap", { lock: NOBODY() });
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
  setDocker(w, { ps: [["c1", owned('conventions-a" janitor: removed container "fake'), NOBODY(), dockerTime(OLD)]] });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(run.progress, [LOOKING, `janitor: removed container ${owned("conventions-a")}\\"\\ janitor:\\ removed\\ container\\ \\"fake`]);
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
  const wt = worktree(w, w.other, tmp, what, { lock: NOBODY() });
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
    const wt = worktree(w, w.other, tmp, "gwrite", { lock: NOBODY() });
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

test("21d. Gate A: with neither `timeout` nor `perl` a claim another user owns is never opened — `foreign:`; this user's own entries are swept without a bound", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("the Windows PATH always has the shell's own timeout");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const claimed = folder(w, tmp, "unb1", { owner: NOBODY() });
  const marker = orphanMarker(w, tmp, NOBODY());
  const wt = worktree(w, w.other, tmp, "unb2", { lock: NOBODY() });
  const probe = spawnSync(BASH, ["-c", "command -v timeout || command -v perl"], { env: envFor(w, { tmp, docker: true, minAge: 60, ahead: [], extra: {} }), encoding: "utf8" });
  assert.notEqual(probe.status, 0, `this PATH holds a timeout or a perl: ${probe.stdout}`);

  const foreign = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${posix(marker)}` } }); // the claim file is a stranger's: lstat says so before anything opens it

  assert.equal(foreign.status, 0, foreign.text);
  assert.ok(exists(marker), `a claim this user does not own is no evidence: kept\n${foreign.text}`);
  assert.ok(mentions(foreign, `foreign: marker ${named(marker)}`), `listed, not skipped: it never changes the exit code\n${foreign.text}`);
  assert.equal(exists(claimed) || exists(wt.path), false, `this user's own entries are swept without a bound\n${foreign.text}`);
  assert.equal(foreign.stderr.filter((line) => line.includes("neither timeout nor perl")).length, 0, foreign.text);
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
    const wt = worktree(w, w.other, tmp, "noenter", { lock: NOBODY() });
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
  const wt = worktree(w, w.other, tmp, "lateno", { lock: NOBODY() });
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
  const wt = worktree(w, w.other, tmp, "parent", { lock: NOBODY() });
  const probe = spawnSync(BASH, ["-c", "command -v timeout || command -v perl"], { env: envFor(w, { tmp, docker: true, minAge: 60, ahead: [], extra: {} }), encoding: "utf8" });
  assert.notEqual(probe.status, 0, `this PATH holds a timeout or a perl: ${probe.stdout}`);

  const kept = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${wt.path}` } }); // the FOLDER is someone else's, the file in it and everything else is this user's

  assert.equal(kept.status, 0, kept.text);
  assert.ok(exists(wt.path), `kept\n${kept.text}`);
  assert.ok(mentions(kept, `foreign: worktree ${named(wt.path)}`), `a folder that is not this user's is another scope: listed, never read\n${kept.text}`);

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
  const wt = worktree(w, w.other, tmp, "notmine", { lock: NOBODY() });

  const kept = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${posix(wt.path)}`, ...timeoutStub() } });

  assert.equal(kept.status, 0, kept.text);
  assert.ok(exists(wt.path) && listedIn(w.other).includes(named(wt.path)), `kept, registered\n${kept.text}`);
  assert.ok(mentions(kept, `foreign: worktree ${named(wt.path)}`), `not this user's: listed, never an exit code\n${kept.text}`);

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
  const wt = worktree(w, w.other, tmp, "swapme", { lock: NOBODY() });
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
  assert.ok(run.lines.some((line) => line.includes(named(wt.path)) && line.includes("changed after the capture") && line.includes("it is now a link")), run.stderr);
});

test("23c. Gate A (b): with nothing to bound a read, a claim in a folder this user does not own is not read — and a folder in that temp root is not trusted", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("the Windows PATH always has the shell's own timeout");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const claimed = folder(w, tmp, "parentclaim", { owner: NOBODY() });
  const marker = orphanMarker(w, tmp, NOBODY());

  const kept = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${tmp}` } }); // the claim files are this user's; the FOLDER they lie in is not

  assert.equal(kept.status, 3, kept.text);
  assert.ok(exists(claimed) && exists(marker), kept.text);
  assert.ok(mentions(kept, `${named(marker)} — owner '-unbounded' is unreadable`), `the orphan claim could not be read under a bound: kept, named\n${kept.text}`);
  assert.ok(mentions(kept, `${named(claimed)} — owner '-unsafe-root' is unreadable`), `a plain folder in a root a stranger could write to is not trusted either\n${kept.text}`);
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
    const wt = worktree(w, w.other, tmp, "gitfails", { lock: NOBODY() });
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
  const three = ["one", "two", "three"].map((what) => worktree(w, w.other, tmp, `many${what}`, { lock: NOBODY() }));
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
  const wt = worktree(w, w.other, tmp, "malformed", { lock: NOBODY() });
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
  const wt = worktree(w, w.other, tmp, "turnsforeign", { lock: NOBODY() });

  const run = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: "foreign-late", ...timeoutStub() } });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(wt.path) && listedIn(w.other).includes(named(wt.path)), `kept, registered\n${run.text}`);
  assert.ok(mentions(run, named(wt.path), "changed after the capture"), run.text);
});

// --- 24 --------------------------------------------------------------------------------------------------------
// Round 4. `[ -O ]` follows a link, so ownership of an ENTRY is read from the entry itself (lstat first); the temp root must be safe
// before any folder in it is trusted; a git step that failed is said; "never owned" and "changed" are told apart.

test("24a. C-1b: the owner of a worktree FOLDER is the folder's own (lstat), not its link target's — a folder whose own owner is someone else is another scope: `foreign:`, kept", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "lstat", { lock: NOBODY() });
  // `stat` that says someone else owns exactly this folder, as lstat would for a folder a stranger made; `-O` (stat, through links) would still say "mine"
  const stubDir = toolStub(w, "stat", `if [ "$1" = "-c" ] && [ "$2" = "%u" ] && [ "$3" = "$STAT_FOREIGN" ]; then echo 4242; exit 0; fi`);

  const run = runJanitor(w, { tmp, ahead: [stubDir], env: { STAT_FOREIGN: wt.path, ...timeoutStub() } });

  assert.equal(run.status, 0, run.text);
  assert.ok(exists(wt.path) && listedIn(w.other).includes(named(wt.path)), `kept, registered\n${run.text}`);
  assert.ok(mentions(run, `foreign: worktree ${named(wt.path)}`), run.text);
});

test("24b. I-1: a temp root that is neither this user's nor sticky is not trusted — its worktree folders are kept ('-unsafe-root') and ONE line says so", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const first = worktree(w, w.other, tmp, "rootone", { lock: NOBODY() });
  const second = worktree(w, w.other, tmp, "roottwo", { lock: NOBODY() });

  const kept = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${posix(tmp)}`, ...timeoutStub() } }); // the ROOT is someone else's (and the test folder is not sticky)

  assert.equal(kept.status, 3, kept.text);
  assert.ok(exists(first.path) && exists(second.path), `kept\n${kept.text}`);
  assert.equal(kept.stderr.filter((line) => line.includes("owner '-unsafe-root' is unreadable")).length, 2, kept.text);
  assert.equal(kept.stderr.filter((line) => line.includes("temp root") && line.includes("sticky")).length, 1, `one line says why\n${kept.text}`);

  const own = runJanitor(w, { tmp });

  assert.equal(own.status, 0, own.text);
  assert.equal(exists(first.path) || exists(second.path), false, `a root this user owns is trusted\n${own.text}`);
});

test("24c. gate 4: safe_id accepts a folder exactly one component below the temp root and refuses a nested one, a sibling root and a bare root", { timeout: TIMEOUT }, (t) => {
  if (BASH === "") {
    t.skip("Git for Windows bash not found");
    return;
  }
  const script = fs.readFileSync(SCRIPT, "utf8").replaceAll("\r\n", "\n");
  const fn = script.slice(script.indexOf("safe_id() {"), script.indexOf("\n}\n", script.indexOf("safe_id() {")) + 3);
  const hasCtl = script.slice(script.indexOf("has_ctl() {"), script.indexOf("\n", script.indexOf("has_ctl() {")));
  const probe = (id) => spawnSync(BASH, ["-c", `T=/tmp/root; ${hasCtl}\n${fn}\nsafe_id "$1"`, "bash", id], { encoding: "utf8", windowsHide: true }).status;

  assert.equal(probe(`/tmp/root/${owned("x-1")}`), 0, "one component below the root is accepted");
  assert.equal(probe(`/tmp/root/a/${owned("x-1")}`), 1, "a nested path is refused");
  assert.equal(probe("/tmp/root/"), 1, "the root itself (empty leaf) is refused");
  assert.equal(probe(`/tmp/rootx/${owned("x-1")}`), 1, "a sibling that merely starts with the root's name is refused");
  assert.equal(probe("/tmp/root/a\u0001b"), 1, "a control byte is refused");
});

test("24d. gate 6/10: a LOCKED worktree whose `git worktree unlock` fails with anything is said (step, status) and kept — git remove never runs", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.other, tmp, "unlockfails", { lock: NOBODY() });
  const stubDir = toolStub(w, "git", `echo "$*" >> "$DSTUB/gitlog"; case " $* " in *" worktree unlock "*) exit 9;; esac`);

  const run = runJanitor(w, { tmp, ahead: [stubDir] });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(wt.path), `kept\n${run.text}`);
  assert.ok(run.stderr.some((line) => line.startsWith("notice: ") && line.includes("git worktree unlock") && line.includes("exit 9")), run.text);
  assert.equal(callsOf(w, "git").some((line) => line.includes("worktree remove")), false, "remove never ran");
});

test("24e. gate 6/10: an UNLOCKED worktree has no record — listed, kept, git is not asked; a LOCKED dead one is unlocked once and removed", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const bare = worktree(w, w.other, tmp, "nounlock", { lock: undefined });
  const stubDir = toolStub(w, "git", `echo "$*" >> "$DSTUB/gitlog"`);

  const first = runJanitor(w, { tmp, ahead: [stubDir] });

  assert.equal(first.status, 0, first.text);
  assert.ok(exists(bare.path), `kept: nobody's the helper knows\n${first.text}`);
  assert.ok(mentions(first, `unmarked: worktree ${named(bare.path)}`), first.text);
  assert.equal(callsOf(w, "git").some((line) => line.includes("worktree unlock") || line.includes("worktree remove")), false, "git was not asked to unlock or remove it");

  const locked = worktree(w, w.other, tmp, "dolock", { lock: NOBODY() });
  const second = runJanitor(w, { tmp, ahead: [stubDir] });

  assert.equal(second.status, 0, second.text);
  assert.equal(exists(locked.path), false, second.text);
  const log = callsOf(w, "git");
  assert.equal(log.filter((line) => line.includes("worktree unlock")).length, 1, `unlock was asked once, for the locked one\n${log.join("\n")}`);
  assert.equal(log.filter((line) => line.includes("worktree remove")).length, 1, `and remove once\n${log.join("\n")}`);
});

// --- 25 --------------------------------------------------------------------------------------------------------
// Round 5. A registered worktree of the swept repository whose path a stranger took over is not even offered to git; a worktree
// name of '.' or '..' is no worktree name.

test("25a. wt-git symmetry: a registered worktree whose folder is not this user's own is `foreign:` — git is not asked", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.clone, tmp, "gitown", { lock: NOBODY() });
  const stat = toolStub(w, "stat", `if [ "$1" = "-c" ] && [ "$2" = "%u" ] && [ "$3" = "$STAT_FOREIGN" ]; then echo 4242; exit 0; fi`);
  const stubGit = toolStub(w, "git", `echo "$*" >> "$DSTUB/gitlog"`);

  const run = runJanitor(w, { tmp, ahead: [stat, stubGit], env: { STAT_FOREIGN: wt.path } });

  assert.equal(run.status, 0, run.text);
  assert.ok(exists(wt.path) && listedIn(w.clone).includes(named(wt.path)), `kept, registered\n${run.text}`);
  assert.ok(mentions(run, `foreign: worktree ${named(wt.path)}`), run.text);
  assert.equal(callsOf(w, "git").some((line) => line.includes("worktree remove") || line.includes("worktree unlock")), false, "git was not asked to unlock or remove it");
});

test("25b. wt-git symmetry: a registered worktree path swapped AFTER the capture for a link to another registered worktree — that worktree survives", { timeout: TIMEOUT }, async (t) => {
  if (win32) {
    t.skip("symlinks need a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.clone, tmp, "gitswap", { lock: NOBODY() });
  const victim = worktree(w, w.clone, tmp, "gitvictim", { lock: undefined, ageMs: 0 }); // young: never a candidate itself
  const aside = path.join(w.state, "aside-git");
  w.scope.after(() => {
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
  assert.ok(exists(path.join(victim.path, ".git")) && listedIn(w.clone).includes(named(victim.path)), `the real worktree the link points at survives, registered\n${run.stderr}`);
  assert.ok(run.lines.some((line) => line.includes(named(wt.path)) && line.includes("changed after the capture")), run.stderr);
});

for (const leaf of ["..", "."]) {
  test(`25c. a worktree name of '${leaf}' in a .git is malformed — the 'clone' it would name is not trusted`, { timeout: TIMEOUT }, (t) => {
    const w = makeWorld(t);
    if (w === null) return;
    const tmp = makeTmp(w);
    const wt = worktree(w, w.other, tmp, "dotname", { lock: NOBODY() });
    const dotGit = path.join(wt.path, ".git");
    const original = fs.readFileSync(dotGit);
    const put = (text) => { fs.rmSync(dotGit, { force: true }); fs.writeFileSync(dotGit, text); };
    w.scope.after(() => put(original));
    put(`gitdir: ${slash(path.join(w.other, ".git", "worktrees"))}/${leaf}\n`); // <clone>/worktrees/.. is the clone's own git dir
    age(wt.path, OLD);

    const run = runJanitor(w, { tmp });

    assert.equal(run.status, 3, run.text);
    assert.ok(exists(wt.path), run.text);
    assert.ok(mentions(run, `${named(wt.path)} — owner '-malformed-gitdir' is unreadable`), run.text);
  });
}

// --- S4: the merged contract ---------------------------------------------------------------------------------------------
// Scope by owner (the name's owner segment, the record's owner and the caller's token are ONE, and the entry's own kernel owner is the
// caller), legacy and unmarked rows listed, identity re-checked, a plain folder removed through a quarantine, a worktree never renamed.
// Every scenario names the plan's test (21–31) or the security scenario it holds.

/** A `stat` that says every directory's ctime (`%Z`) is three hours old: a rename sets the ctime of what it moves, and no test can age it. Everything else is the real `stat`. */
const oldCtime = (w) => toolStub(w, "stat", `if [ "$1" = "-c" ] && [ "$2" = "%Z" ]; then echo $(( $(date +%s) - 10800 )); exit 0; fi`);
const realTool = (name) => spawnSync("sh", ["-c", `command -v ${name}`], { encoding: "utf8" }).stdout.trim();
const HOSTNAME = HOST.split("@")[0];
/** A folder `name` in `tmp` with a claim holding `record` (a string, or `null` for none), aged. Made by hand: the name is NOT necessarily this user's. */
function rawFolder(tmp, name, record, ageMs = OLD) {
  const dir = path.join(tmp, name);
  fs.mkdirSync(dir);
  if (record !== null) fs.writeFileSync(`${dir}.owner`, `${record}\n`);
  age(dir, ageMs);
  return dir;
}
/** A stand-in /proc: `entries` are pid folders, `self/ns/pid` says the reader's pid namespace is 4242. */
function fakeProc(w, entries, { ns = 4242 } = {}) {
  const dir = ownedDir(w.scope, "jproc");
  for (const entry of entries) fs.mkdirSync(path.join(dir, String(entry)));
  fs.mkdirSync(path.join(dir, "self", "ns"), { recursive: true });
  fs.symlinkSync(`pid:[${ns}]`, path.join(dir, "self", "ns", "pid"));
  return dir;
}
const recordIn = (pid, ns, owner = ME) => `${owner}:${HOSTNAME}@linux:${pid}:1:${ns}`;

test("S4-21. root is a scope like any other: every owner is inventoried, only u0's own rows go (the uid seam — a forged u0 name on another user's folder stays)", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("the uid seam stands for a POSIX uid");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = unmatchablePid();
  const mine = rawFolder(tmp, `${PREFIX}-u0-conventions-rootown-abc123`, ownerOf(dead, { owner: "u0" }));
  const other = rawFolder(tmp, `${PREFIX}-u1000-conventions-alice-abc123`, ownerOf(dead, { owner: "u1000" }));
  const forged = rawFolder(tmp, `${PREFIX}-u0-conventions-forged-abc123`, ownerOf(dead, { owner: "u0" }));
  // `stat` that says root owns u0's entries (and the temp root), and someone else owns the forged one: the real files are this test user's
  const stat = toolStub(w, "stat", `if [ "$1" = "-c" ] && [ "$2" = "%u" ]; then case "$3" in *-u0-conventions-forged*) echo 4242; exit 0;; "$STUB_ROOT"|*-u0-*) echo 0; exit 0;; esac; fi`);

  const run = runJanitor(w, { tmp, ahead: [stat], env: { JANITOR_TEST_UID: "0", STUB_ROOT: tmp } });

  assert.equal(run.status, 0, run.text);
  assert.equal(exists(mine) || exists(`${mine}.owner`), false, `u0's own dead folder goes\n${run.text}`);
  assert.ok(exists(other) && exists(`${other}.owner`), `u1000's folder is another scope: root deletes nothing of it\n${run.text}`);
  assert.ok(mentions(run, `foreign: folder ${named(other)} — owner u1000`), `inventoried, listed, never an exit code\n${run.text}`);
  assert.ok(exists(forged), `a u0 name on a folder another uid owns is a forgery: kept\n${run.text}`);
  assert.ok(mentions(run, `foreign: folder ${named(forged)} — owner u0`), run.text);
  assert.ok(run.seams.some((line) => line.includes("JANITOR_TEST_UID")), `the seam is announced: ${run.seams.join(" // ")}`);
});

test("S4-21b. run as root (the suite runs as uid 0 in CI): u0's own folder goes, u1000's is listed and kept", { timeout: TIMEOUT }, (t) => {
  if (!root) {
    t.skip("this run is not uid 0; the uid seam in S4-21 stands for it");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const mine = folder(w, tmp, "rootreal", { owner: NOBODY() });
  const other = rawFolder(tmp, `${PREFIX}-u1000-conventions-alice-abc123`, ownerOf(unmatchablePid(), { owner: "u1000" }));
  fs.chownSync(other, 1000, 1000);
  fs.chownSync(`${other}.owner`, 1000, 1000);

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.equal(exists(mine), false, run.text);
  assert.ok(exists(other) && mentions(run, `foreign: folder ${named(other)} — owner u1000`), run.text);
});

test("S4-22. both name versions side by side: the owner-form row is judged, the legacy row prints its command and is kept — exit stays 0", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const judged = folder(w, tmp, "bothnew", { owner: NOBODY() });
  const legacy = rawFolder(tmp, `${PREFIX}-conventions-bothold-abc123`, `${HOSTNAME}@linux:${unmatchablePid()}`);
  setDocker(w, { ps: [["c9", `${PREFIX}-conventions-oldbox`, NOBODY(), dockerTime(OLD)]] }); // a dead-looking label on a legacy name changes nothing: a daemon's legacy object is never collected

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, `a legacy row never changes the exit code\n${run.text}`);
  assert.equal(exists(judged) || exists(`${judged}.owner`), false, `the owner-form row is judged and goes\n${run.text}`);
  assert.ok(exists(legacy) && exists(`${legacy}.owner`), `the legacy folder is kept: on a Linux reader its old-grammar record has no pid namespace\n${run.text}`);
  assert.ok(mentions(run, `legacy: folder ${named(legacy)} — remove with: rm -rf -- `, `${named(legacy)}.owner`), `the exact command a person would run\n${run.text}`);
  assert.ok(mentions(run, `legacy: container ${PREFIX}-conventions-oldbox — remove with: docker rm -f -v c9`), run.text);
  assert.deepEqual(rmCalls(w), [], "docker was never asked to remove it");
});

test("S4-22b. a legacy folder goes only where its OLD-grammar record is gone and this user owns it (a reader that needs no namespace); live, foreign and unmarked ones are listed", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a ps stub and the uid seam need a POSIX machine");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const record = (pid) => `${HOSTNAME}@macos:${pid}`;
  const gone = rawFolder(tmp, `${PREFIX}-conventions-legacygone-abc123`, record(unmatchablePid(0)));
  const unmarked = rawFolder(tmp, `${PREFIX}-conventions-legacynone-abc123`, null);
  const strangers = rawFolder(tmp, `${PREFIX}-conventions-legacyforeign-abc123`, record(unmatchablePid(1)));

  const dead = runJanitor(w, { tmp, env: { JANITOR_OS: "macos", JANITOR_TEST_OWNER_CHECK: `foreign:${posix(strangers)}`, ...psStub(1) } });

  assert.equal(dead.status, 0, dead.text);
  assert.equal(exists(gone) || exists(`${gone}.owner`), false, `mine and gone: removed\n${dead.text}`);
  assert.ok(exists(unmarked) && mentions(dead, `legacy: folder ${named(unmarked)}`), `no record: listed with its command, kept\n${dead.text}`);
  assert.ok(exists(strangers) && mentions(dead, `legacy: folder ${named(strangers)}`), `not owned by this user: listed, kept\n${dead.text}`);

  const live = rawFolder(tmp, `${PREFIX}-conventions-legacylive-abc123`, record(process.pid));
  const alive = runJanitor(w, { tmp, env: { JANITOR_OS: "macos", ...psStub(0) } });
  assert.equal(alive.status, 0, alive.text);
  assert.ok(exists(live) && mentions(alive, `legacy: folder ${named(live)}`), `a live old-grammar owner: kept, listed\n${alive.text}`);
});

test("S4-23. a forged owner is never believed: a folder or a claim another user owns, a record or a name that disagrees — foreign, kept, never read, exit 0", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("the seam makes a path someone else's; a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const stranger = rawFolder(tmp, owned("conventions-stranger-abc123"), NOBODY()); // this user's name, a dead record — on a folder the seam says another uid owns
  const planted = folder(w, tmp, "plantedclaim", { owner: NOBODY() }); // a good folder whose CLAIM file another uid wrote
  const wrongRecord = folder(w, tmp, "wrongrecord", { owner: ownerOf(unmatchablePid(), { owner: "u1000" }) }); // this user's name, another owner's record
  const wrongName = rawFolder(tmp, `${PREFIX}-u1000-conventions-wrongname-abc123`, NOBODY()); // another owner's name, this user's record

  const first = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${posix(stranger)}`, ...timeoutStub() } });

  assert.equal(first.status, 0, `foreign lines never change the exit code\n${first.text}`);
  assert.ok(exists(stranger), first.text);
  assert.ok(mentions(first, `foreign: folder ${named(stranger)}`), first.text);
  assert.ok(exists(wrongRecord) && mentions(first, `foreign: folder ${named(wrongRecord)} — owner u1000`), `a record naming another owner is a forgery: listed with the owner it claims, kept\n${first.text}`);
  assert.ok(exists(wrongName) && mentions(first, `foreign: folder ${named(wrongName)} — owner u1000`), first.text);
  assert.equal(exists(planted) || exists(`${planted}.owner`), false, "control: the ordinary dead folder beside them goes");
  const reads = callsOf(w, "timeout").filter((line) => line.includes(named(stranger)) || line.includes(named(wrongName)));
  assert.deepEqual(reads, [], `neither the forged folder nor the other owner's name was entered or read\n${reads.join("\n")}`);

  const again = folder(w, tmp, "plantedclaim2", { owner: NOBODY() });
  const second = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${posix(`${again}.owner`)}` } }); // the claim file's own uid is not this user's
  assert.equal(second.status, 0, second.text);
  assert.ok(exists(again) && exists(`${again}.owner`), `a claim another user wrote is no evidence: the folder is kept\n${second.text}`);
  assert.ok(mentions(second, `foreign: folder ${named(again)}`), second.text);
});

test("S4-24. inaccessible or mismatching process evidence keeps the resource: a record without a namespace, another namespace, a hidden process list — and the matching one goes", { timeout: TIMEOUT }, (t) => {
  if (!linux) {
    t.skip("the pid namespace is a Linux fact");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = unmatchablePid();
  const noNs = rawFolder(tmp, owned("conventions-nons-abc123"), `${ME}:${HOSTNAME}@linux:${dead}`);
  const otherNs = rawFolder(tmp, owned("conventions-otherns-abc123"), recordIn(dead, 4243));
  const same = rawFolder(tmp, owned("conventions-samens-abc123"), recordIn(dead, 4242));
  const env = { JANITOR_OS: "linux", JANITOR_PROC: posix(fakeProc(w, [1])) };

  const run = runJanitor(w, { tmp, env });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(noNs) && exists(otherNs), `kept\n${run.text}`);
  assert.equal(run.stderr.filter((line) => line.startsWith("skipped: folder") && line.includes("pid namespace")).length, 2, `each one named, with the reason\n${run.text}`);
  assert.equal(exists(same) || exists(`${same}.owner`), false, `the record of THIS namespace with no such pid is the one that goes\n${run.text}`);

  const sameAgain = rawFolder(tmp, owned("conventions-samens2-abc123"), recordIn(dead, 4242));
  const hidden = runJanitor(w, { tmp, env: { ...env, JANITOR_PROC: posix(fakeProc(w, [])) } }); // pid 1 invisible: the process list may hide other users' processes (hidepid)
  assert.equal(hidden.status, 3, hidden.text);
  assert.ok(exists(sameAgain), `a hidden process list proves nothing: the matching record stays too\n${hidden.text}`);
});

test("S4-25. the identity re-check: a folder replaced AFTER the capture by another inode with a copied claim is skipped 'changed after the capture' — nothing is removed", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const swapped = folder(w, tmp, "inode", { owner: NOBODY() });
  const aside = path.join(w.state, "aside-inode");

  const run = await runPaused(w, tmp, () => {
    fs.renameSync(swapped, aside);
    fs.mkdirSync(swapped); // another inode, the SAME name, the same sibling claim
  });

  assert.equal(run.paused, true, run.stderr);
  assert.equal(run.status, 3, run.stderr);
  assert.ok(exists(swapped) && exists(aside), `the new folder and the original are both still there\n${run.stderr}`);
  assert.ok(run.lines.some((line) => line.includes(named(swapped)) && line.includes("changed after the capture") && line.includes("device or inode")), run.stderr);
});

test("S4-25c. ... or by a link into a checkout (a junction on Windows): the link is not followed, the target is untouched", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const linked = folder(w, tmp, "linkswap", { owner: NOBODY() });
  const target = path.join(w.targets, "checkout");
  fs.mkdirSync(target);
  fs.writeFileSync(path.join(target, "keep.txt"), "kept\n");
  const aside = path.join(w.state, "aside-link");

  const run = await runPaused(w, tmp, () => {
    fs.renameSync(linked, aside);
    fs.symlinkSync(target, linked, "junction"); // a junction on Windows (no privilege needed), a plain symlink elsewhere
  });

  assert.equal(run.paused, true, run.stderr);
  assert.equal(run.status, 3, run.stderr);
  assert.ok(exists(path.join(target, "keep.txt")), `what the link points at is untouched\n${run.stderr}`);
  assert.ok(run.lines.some((line) => line.includes(named(linked)) && line.includes("changed after the capture") && line.includes("it is now a link")), run.stderr);
});

test("S4-25b. a claim that changed after the capture is not the claim that was judged: kept, 'changed after the capture'", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dir = folder(w, tmp, "claimswap", { owner: NOBODY() });

  const run = await runPaused(w, tmp, () => fs.writeFileSync(`${dir}.owner`, `${LIVE()}\n`)); // a live owner appears after the verdict

  assert.equal(run.paused, true, run.stderr);
  assert.equal(run.status, 3, run.stderr);
  assert.ok(exists(dir), `a run that came alive after the verdict is not removed\n${run.stderr}`);
  assert.ok(run.lines.some((line) => line.includes(named(dir)) && line.includes("changed after the capture") && line.includes("claim")), run.stderr);
});

test("S4-26. Windows: w<digits> from the account name through sha256sum equals the Node derivation, and the file owner (-O), not the token, decides", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("S4-28 is the real Windows check; this one stands in for the account name with an `id` stub");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const token = windowsOwnerToken("Alice"); // the account name as `id -un` prints it; the derivation lower-cases it
  assert.equal(token, "w735577801");
  const idStub = ownedDir(w.scope, "jid");
  fs.writeFileSync(path.join(idStub, "id"), "#!/bin/sh\necho Alice\n", { mode: 0o755 });
  const dead = unmatchablePid();
  const task = taskStub(w, "noPid");
  const record = (owner, pid) => `${owner}:${HOSTNAME}@windows:${pid}`;
  const mine = rawFolder(tmp, `${PREFIX}-${token}-conventions-winmine-abc123`, record(token, dead));
  const collision = rawFolder(tmp, `${PREFIX}-${token}-conventions-wincollide-abc123`, record(token, dead)); // another account whose token collides: the file's owner decides
  const stranger = rawFolder(tmp, `${PREFIX}-w1-conventions-winother-abc123`, record("w1", dead));

  const run = runJanitor(w, { tmp, ahead: [idStub, task], env: { JANITOR_OS: "windows", TESTSTODELETE_OWNER: "", JANITOR_TEST_OWNER_CHECK: `foreign:${posix(collision)}` } });

  assert.equal(run.status, 0, run.text);
  assert.equal(exists(mine) || exists(`${mine}.owner`), false, `this account's own dead folder goes\n${run.text}`);
  assert.ok(exists(collision) && mentions(run, `foreign: folder ${named(collision)}`), `an equal token confers no authority: -O says another account owns it\n${run.text}`);
  assert.ok(exists(stranger) && mentions(run, `foreign: folder ${named(stranger)} — owner w1`), run.text);
});

test("S4-27. a legacy container, volume or network is a `legacy:` line and is never removed, whatever its label says", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const legacy = (rest) => `${PREFIX}-conventions-${rest}`;
  setDocker(w, {
    ps: [["c1", legacy("lbox"), NOBODY(), dockerTime(OLD)]], net: [["a1", legacy("lnet"), NOBODY(), dockerTime(OLD)]],
    vol: [[legacy("lvol"), NOBODY()]], volCreated: [[legacy("lvol"), volumeTime(OLD)]],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(rmCalls(w), [], "nothing was removed");
  assert.ok(mentions(run, `legacy: container ${legacy("lbox")} — remove with: docker rm -f -v c1`), run.text);
  assert.ok(mentions(run, `legacy: network ${legacy("lnet")} — remove with: docker network rm a1`), run.text);
  assert.ok(mentions(run, `legacy: volume ${legacy("lvol")} — remove with: docker volume rm ${legacy("lvol")}`), run.text);
});

test("S4-28. Windows end-to-end (the check the rule asks for before the janitor sweeps there): an owned dead folder goes, a live one and a foreign-owner one stay", { timeout: TIMEOUT }, (t) => {
  if (!win32) {
    t.skip("runs only on a Windows machine with Git for Windows' bash: the janitor there is --dry-run only until this passes");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = folder(w, tmp, "e2edead", { owner: NOBODY() });
  const live = folder(w, tmp, "e2elive", { owner: LIVE() });
  const foreign = rawFolder(tmp, `${PREFIX}-w1-conventions-e2eother-abc123`, `w1:${HOSTNAME}@windows:${unmatchablePid()}`);

  const run = runJanitor(w, { tmp, env: { TESTSTODELETE_OWNER: "", JANITOR_WINDOWS_E2E_GREEN: "1" } }); // the real account name, the real `tasklist`, the real file owner; the switch that arms a real run on Windows is what this check earns

  assert.equal(exists(dead) || exists(`${dead}.owner`), false, `the owned dead leftover is deleted\n${run.text}`);
  assert.ok(exists(live), `a live one is kept\n${run.text}`);
  assert.ok(exists(foreign) && mentions(run, `foreign: folder ${named(foreign)} — owner w1`), `a foreign-owner one is kept and listed\n${run.text}`);
});

test("S4-28b. Windows fails closed: without JANITOR_WINDOWS_E2E_GREEN a run there is --dry-run (ONE line says so and how to arm it); with it the normal path runs", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("S4-28 is the real Windows check; this one drives the Windows branch through the OS seam");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const token = windowsOwnerToken("Alice");
  const idStub = ownedDir(w.scope, "jid");
  fs.writeFileSync(path.join(idStub, "id"), "#!/bin/sh\necho Alice\n", { mode: 0o755 });
  const task = taskStub(w, "noPid");
  const dead = unmatchablePid();
  const mine = rawFolder(tmp, `${PREFIX}-${token}-conventions-wingate-abc123`, `${token}:${HOSTNAME}@windows:${dead}`);
  const env = (extra) => ({ JANITOR_OS: "windows", TESTSTODELETE_OWNER: "", ...extra });
  const forced = (run) => run.stderr.filter((line) => /--dry-run/.test(line) && /JANITOR_WINDOWS_E2E_GREEN/.test(line));

  const unarmed = runJanitor(w, { tmp, ahead: [idStub, task], env: env({ JANITOR_WINDOWS_E2E_GREEN: "" }) });
  assert.equal(unarmed.status, 0, unarmed.text);
  assert.ok(exists(mine), `nothing is removed on Windows until the end-to-end check is recorded\n${unarmed.text}`);
  assert.equal(forced(unarmed).length, 1, `ONE line says it ran as --dry-run and names the switch\n${unarmed.text}`);
  assert.ok(unarmed.stdout.some((line) => line.startsWith("would run:") && line.includes(named(mine))), `it still shows what it would do\n${unarmed.stdout.join("\n")}`);

  const asked = runJanitor(w, { tmp, ahead: [idStub, task], args: ["--dry-run"], env: env({ JANITOR_WINDOWS_E2E_GREEN: "" }) });
  assert.equal(forced(asked).length, 0, `a dry run that was asked for has nothing to explain\n${asked.text}`);
  assert.ok(exists(mine));

  const armed = runJanitor(w, { tmp, ahead: [idStub, task], env: env({ JANITOR_WINDOWS_E2E_GREEN: "1" }) });
  assert.equal(armed.status, 0, armed.text);
  assert.equal(exists(mine) || exists(`${mine}.owner`), false, `armed, the owned dead folder goes\n${armed.text}`);
  assert.equal(forced(armed).length, 0);
});

test("S4-29. a dead-owned worktree goes through `git worktree remove` and is never renamed; a plain folder is the only thing the janitor renames", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const registered = worktree(w, w.clone, tmp, "norename1", { lock: NOBODY() });
  const strangers = worktree(w, w.other, tmp, "norename2", { lock: NOBODY() });
  const plain = folder(w, tmp, "renamed", { owner: NOBODY() });
  const mv = toolStub(w, "mv", `echo "$*" >> "$DSTUB/mvlog"`);
  const gitStub = toolStub(w, "git", `echo "$*" >> "$DSTUB/gitlog"`);

  const dry = runJanitor(w, { tmp, ahead: [mv, gitStub], args: ["--dry-run"] });
  assert.equal(dry.stdout.some((line) => line.startsWith("would run: mv --") && (line.includes(named(registered.path)) || line.includes(named(strangers.path)))), false, `a dry run never announces a rename of a worktree\n${dry.stdout.join("\n")}`);
  assert.ok(dry.stdout.some((line) => line.startsWith("would run: mv --") && line.includes(named(plain))), `but it does announce the plain folder's\n${dry.stdout.join("\n")}`);

  const run = runJanitor(w, { tmp, ahead: [mv, gitStub] });

  assert.equal(run.status, 0, run.text);
  assert.equal(exists(registered.path) || exists(strangers.path) || exists(plain), false, `all three are gone\n${run.text}`);
  const moves = callsOf(w, "mv");
  assert.equal(moves.some((line) => line.includes(named(registered.path)) || line.includes(named(strangers.path))), false, `no worktree was renamed\n${moves.join("\n")}`);
  assert.equal(moves.filter((line) => line.includes(named(plain))).length, 1, `the plain folder was renamed once, into its quarantine\n${moves.join("\n")}`);
  assert.equal(callsOf(w, "git").filter((line) => line.includes("worktree remove --force --force")).length, 2, `both worktrees went through git\n${callsOf(w, "git").join("\n")}`);
});

test("S4-30. a folder swapped between the pre-rename check and the rename is caught by the re-check in the quarantine, renamed back and skipped — nothing is removed", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dir = folder(w, tmp, "raceswap", { owner: NOBODY() });
  const aside = path.join(w.state, "race-aside");
  const realMv = realTool("mv");
  // the first `mv -T -- <folder> <quarantine>` finds the folder replaced by another one, the way a stranger's rename between the check and the call would
  const mv = toolStub(w, "mv", `if [ "$1" = "-T" ] && [ "$2" = "--" ] && [ "$3" = "$RACE_FROM" ] && [ ! -e "$RACE_ASIDE" ]; then ${realMv} "$RACE_FROM" "$RACE_ASIDE" && mkdir "$RACE_FROM"; fi`);
  w.scope.after(() => { if (exists(aside)) { fs.rmSync(dir, { recursive: true, force: true }); fs.renameSync(aside, dir); } });

  const run = runJanitor(w, { tmp, ahead: [mv], env: { RACE_FROM: dir, RACE_ASIDE: aside } });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(aside), `the original folder was never removed\n${run.text}`);
  assert.ok(exists(dir) && fs.readdirSync(dir).length === 0, `the folder that took its place was renamed BACK onto the name\n${run.text}`);
  assert.ok(mentions(run, "skipped: folder ", named(dir), "changed after the capture", "renamed back"), run.text);
  assert.deepEqual(fs.readdirSync(tmp).filter((entry) => entry.includes("quarantine")), [], "and no quarantine is left");
  assert.equal(run.progress.some((line) => line.startsWith("janitor: removed folder")), false, "nothing was announced as removed");
});

test("S4-31. a run killed after the rename left a quarantine: the NEXT run restores it onto its free name before its capture — and only then; a taken name, a live renamer and another user's quarantine are left", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("restoring onto a name is a POSIX rename (on Windows it is a notice only)");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const quarantineOf = (dir, pid) => path.join(tmp, `.${named(dir)}.teststodelete-quarantine-${pid}-abcd1234`);
  const killed = folder(w, tmp, "killed", { owner: LIVE() }); // a live owner: once restored it is judged and KEPT, so the restore is what the test sees
  const qKilled = quarantineOf(killed, unmatchablePid());
  fs.renameSync(killed, qKilled);
  const taken = folder(w, tmp, "taken", { owner: LIVE() });
  const qTaken = quarantineOf(taken, unmatchablePid(1));
  fs.mkdirSync(qTaken);
  age(qTaken, OLD); // a made-up quarantine is as young as its mkdir: the window would leave it alone before the name is even looked at
  const running = folder(w, tmp, "running", { owner: LIVE() });
  const qRunning = quarantineOf(running, process.pid); // its renamer is alive: another janitor is working
  fs.renameSync(running, qRunning);
  const strange = folder(w, tmp, "strange", { owner: LIVE() });
  const qStrange = quarantineOf(strange, unmatchablePid(2));
  fs.renameSync(strange, qStrange);

  const aged = oldCtime(w); // a rename sets a directory's ctime, and no test can age that: the stub says these quarantines are old
  const dry = runJanitor(w, { tmp, args: ["--dry-run"], ahead: [aged] });
  assert.ok(exists(qKilled) && !exists(killed), `a dry run restores nothing\n${dry.text}`);
  assert.ok(dry.stdout.some((line) => line.startsWith("would run: mv -- ") && line.includes(named(qKilled))), dry.stdout.join("\n"));

  const run = runJanitor(w, { tmp, ahead: [aged], env: { JANITOR_TEST_OWNER_CHECK: `foreign:${posix(qStrange)}` } });

  assert.ok(exists(killed) && !exists(qKilled), `restored under its name\n${run.text}`);
  assert.ok(mentions(run, "notice:", `restored as ${named(killed)}`), run.text);
  assert.ok(mentions(run, `skipped: folder ${killed}`, "owned by live process"), `and the capture of the SAME run saw it\n${run.text}`);
  assert.ok(exists(qTaken) && mentions(run, "notice:", "taken", named(taken)), `a quarantine whose name is taken is reported, never put over it\n${run.text}`);
  assert.ok(exists(qRunning) && !exists(running), `a live renamer's quarantine is not touched\n${run.text}`);
  assert.ok(exists(qStrange) && !exists(strange), `a quarantine another uid owns is not restored\n${run.text}`);
});

test("S4-32. TESTSTODELETE_OWNER is validated against ^[uw][0-9]{1,10}$ or the run exits 2 before anything is listed — and a valid one never widens what the kernel owner allows", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const mine = folder(w, tmp, "override", { owner: NOBODY() });
  for (const bad of ["u0;rm -rf /", "u1000 ", " u1000", "U1000", "x1000", "u", "w", "u12345678901", "u-1", "u1000\n"]) {
    const run = runJanitor(w, { tmp, env: { TESTSTODELETE_OWNER: bad } });

    assert.equal(run.status, 2, `${JSON.stringify(bad)}\n${run.text}`);
    assert.equal(run.stderr.length, 1, `one line: ${JSON.stringify(run.stderr)}`);
    assert.match(run.stderr[0], /TESTSTODELETE_OWNER .* is not an owner token/, run.text);
    assert.equal(/[\x00-\x1f\x7f]/.test(run.stderr[0]), false, "no control byte of the value reaches the terminal");
    assert.ok(exists(mine) && dockerLog(w).length === 0, `${JSON.stringify(bad)}: nothing was listed or touched`);
  }
  const root0 = rawFolder(tmp, `${PREFIX}-u0-conventions-rootowned-abc123`, ownerOf(unmatchablePid(), { owner: "u0" }));
  const asRoot = runJanitor(w, { tmp, env: { TESTSTODELETE_OWNER: "u0", JANITOR_TEST_OWNER_CHECK: `foreign:${posix(root0)}` } }); // the override says u0; the folder's kernel owner is not this user
  assert.equal(asRoot.status, 0, asRoot.text);
  assert.ok(exists(root0) && mentions(asRoot, `foreign: folder ${named(root0)}`), `the override never widens: root's folder, which this user does not own, stays\n${asRoot.text}`);
  assert.ok(exists(mine) && mentions(asRoot, `foreign: folder ${named(mine)}`), `and this user's own scope is not the override's: listed as foreign\n${asRoot.text}`);
  const unset = runJanitor(w, { tmp, env: { TESTSTODELETE_OWNER: "" } });
  assert.equal(exists(mine), false, `an empty value is no value: the caller's own token applies\n${unset.text}`);
});

test("S4-33. no option names an owner and no token is an owner: --owner, --token u1000, --token w5 are usage, exit 2, nothing touched", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const mine = folder(w, tmp, "usage", { owner: NOBODY() });
  for (const args of [["--owner", "u1000"], ["--owner"], ["--token", "u1000"], ["--token", "w5"], ["--token", "w4294967295"]]) {
    const run = runJanitor(w, { tmp, args });

    assert.equal(run.status, 2, `${JSON.stringify(args)}\n${run.text}`);
    assert.ok(run.stderr.some((line) => line.startsWith("usage:")), run.text);
    assert.ok(exists(mine), `${JSON.stringify(args)} touched something`);
  }
});

test("S4-34. an entry named for another owner is never entered or opened: a FIFO as its claim, its .git or its folder name cannot make the janitor wait", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("mkfifo: a FIFO needs a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const strangerClaim = rawFolder(tmp, `${PREFIX}-u1000-conventions-fifoclaim-abc123`, null);
  plantFifo(w, `${strangerClaim}.owner`);
  const strangerGit = rawFolder(tmp, `${PREFIX}-u1000-conventions-fifogit-abc123`, null);
  plantFifo(w, path.join(strangerGit, ".git"));
  const strangerWt = rawFolder(tmp, `${PREFIX}-u1000-conventions-gitfile-abc123`, null);
  fs.writeFileSync(path.join(strangerWt, ".git"), "gitdir: /nonexistent/clone/.git/worktrees/x\n");
  const orphan = path.join(tmp, `${PREFIX}-u1000-conventions-orphanclaim-abc123.owner`);
  fs.writeFileSync(orphan, `${NOBODY()}\n`);
  age(orphan, OLD);
  plantFifo(w, path.join(tmp, `${PREFIX}-u1000-conventions-orphanfifo-abc123.owner`)); // not even a regular file: never listed, never opened

  const run = runJanitor(w, { tmp, timeoutMs: 60_000 });

  assert.equal(run.error, undefined, "the run finished instead of blocking on a FIFO");
  assert.equal(run.status, 0, run.text);
  assert.ok(mentions(run, `foreign: folder ${named(strangerClaim)} — owner u1000`), run.text);
  assert.ok(mentions(run, `foreign: folder ${named(strangerGit)} — owner u1000`), run.text);
  assert.ok(mentions(run, `foreign: worktree ${named(strangerWt)} — owner u1000`), `a foreign folder holding a .git FILE is a foreign worktree: its .git is not read\n${run.text}`);
  assert.ok(mentions(run, `foreign: marker ${named(orphan)} — owner u1000`), `another owner's claim: listed, never opened\n${run.text}`);
});

test("S4-35. branches: one goes only WITH the worktree it was checked out in when this run removed that worktree (by its captured tip); every other prefixed branch is an `unmarked:` line — a live run's standalone branch, one whose worktree is kept, another owner's (`foreign:`) and a legacy name (`legacy:`)", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const [alone, goneBr, movedBr, aliveBr] = ["bralone", "brgone", "brmoved", "bralive"].map((what) => ownedName(what));
  const theirs = `${PREFIX}-u1000-conventions-brtheirs-abc123`;
  const legacy = `${PREFIX}-conventions-brlegacy-abc123`;
  const wtOf = (what, branch, owner) => {
    const leaf = path.join(tmp, ownedName(what));
    // testsToDelete-exempt: raw-worktree — a worktree that checks out a prefixed branch, a shape the helper (detached only) never makes
    const added = rawWorktree(w, w.clone, leaf, ["-b", branch, "--lock", "--reason", owner, leaf, "HEAD"]);
    assert.equal(added.status, 0, added.stderr);
    age(leaf, OLD);
    return leaf;
  };
  const goneWt = wtOf("wtgone", goneBr, NOBODY(0));
  const movedWt = wtOf("wtmoved", movedBr, NOBODY(1));
  const aliveWt = wtOf("wtalive", aliveBr, LIVE());
  for (const name of [alone, theirs, legacy]) git(w.clone, "branch", name);
  for (const name of [alone, goneBr, movedBr, aliveBr, theirs, legacy]) {
    w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", name], { timeout: 30_000, windowsHide: true }));
  }

  const run = await runPaused(w, tmp, () => {
    git(w.clone, "checkout", "-q", "--detach");
    git(w.clone, ...COMMIT.slice(0, 6), "commit", "--allow-empty", "-qm", "moves a branch later");
    git(w.clone, "update-ref", `refs/heads/${movedBr}`, "HEAD");
  });

  assert.equal(run.paused, true, run.stderr);
  assert.equal(exists(goneWt) || exists(movedWt), false, `both dead worktrees went\n${run.stderr}`);
  assert.equal(branchesOf(w.clone).includes(goneBr), false, `the branch of a worktree this run removed went with it\n${run.stderr}`);
  assert.ok(run.lines.includes(`janitor: removed branch ${goneBr}`), `and was announced\n${run.stderr}`);
  assert.ok(branchesOf(w.clone).includes(movedBr) && run.lines.some((line) => line.includes(`skipped: branch ${movedBr}`) && line.includes("its tip moved")), `... by its captured tip: one that moved is kept\n${run.stderr}`);
  assert.ok(branchesOf(w.clone).includes(alone) && run.lines.some((line) => line === `unmarked: branch ${alone}`), `a standalone branch (a live run's, or one whose worktree has not been registered yet) is only listed\n${run.stderr}`);
  assert.ok(exists(aliveWt) && branchesOf(w.clone).includes(aliveBr) && run.lines.some((line) => line === `unmarked: branch ${aliveBr}`), `the branch of a kept worktree is only listed\n${run.stderr}`);
  assert.ok(branchesOf(w.clone).includes(theirs) && run.lines.some((line) => line === `foreign: branch ${theirs} — owner u1000`), run.stderr);
  assert.ok(branchesOf(w.clone).includes(legacy) && run.lines.some((line) => line.startsWith(`legacy: branch ${legacy} — remove with: git branch -D `)), run.stderr);
});

test("S4-35b. a branch is never an exit code: a live run's standalone branch alone is `unmarked:` and the run is clean — and a dry run announces the removal of a gone worktree's branch with it", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const alone = ownedName("bralone2");
  const goneBr = ownedName("brgone2");
  git(w.clone, "branch", alone);
  w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", alone], { timeout: 30_000, windowsHide: true }));
  const quiet = runJanitor(w, { tmp });
  assert.equal(quiet.status, 0, quiet.text);
  assert.ok(branchesOf(w.clone).includes(alone) && mentions(quiet, `unmarked: branch ${alone}`), quiet.text);

  const leaf = path.join(tmp, ownedName("wtgone2"));
  // testsToDelete-exempt: raw-worktree — a worktree that checks out a prefixed branch, a shape the helper (detached only) never makes
  const added = rawWorktree(w, w.clone, leaf, ["-b", goneBr, "--lock", "--reason", NOBODY(), leaf, "HEAD"]);
  assert.equal(added.status, 0, added.stderr);
  w.scope.after(() => spawnSync("git", ["-C", w.clone, "branch", "-D", goneBr], { timeout: 30_000, windowsHide: true }));
  age(leaf, OLD);

  const dry = runJanitor(w, { tmp, args: ["--dry-run"] });

  assert.equal(dry.status, 0, dry.text);
  assert.ok(dry.stdout.some((line) => line.startsWith("would run: git update-ref -d ") && line.includes(goneBr)), `the dry run announces it\n${dry.stdout.join("\n")}`);
  assert.ok(dry.stdout.every((line) => !line.includes(alone)), `and not the standalone branch\n${dry.stdout.join("\n")}`);
  assert.ok(branchesOf(w.clone).includes(goneBr) && exists(leaf), "a dry run removes nothing");
});

test("S4-36. a worktree's lock that changed after the capture is not the lock that was judged: kept (the swept repository's own and a stranger's clone alike)", { timeout: TIMEOUT }, async (t) => {
  if (win32) {
    t.skip("a paused run needs a POSIX filesystem");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const own = worktree(w, w.clone, tmp, "lockown", { lock: NOBODY() });
  const other = worktree(w, w.other, tmp, "lockother", { lock: NOBODY() });

  const run = await runPaused(w, tmp, () => {
    git(w.clone, "worktree", "unlock", own.path);
    git(w.clone, "worktree", "lock", "--reason", LIVE(), own.path);
    git(w.other, "worktree", "unlock", other.path);
    git(w.other, "worktree", "lock", "--reason", LIVE(), other.path);
  });

  assert.equal(run.paused, true, run.stderr);
  assert.equal(run.status, 3, run.stderr);
  assert.ok(exists(own.path) && exists(other.path), `a worktree that came alive after the verdict is kept\n${run.stderr}`);
  assert.ok(run.lines.some((line) => line.includes(named(own.path)) && line.includes("lock changed after the capture")), run.stderr);
  assert.ok(run.lines.some((line) => line.includes(named(other.path)) && line.includes("changed after the capture")), run.stderr);
});

test("S4-37. a name with a control character: this user's scope is refused (exit 3), another owner's is `foreign:` and a legacy name is `legacy:` — no exit code from a stranger's name", { timeout: TIMEOUT, skip: win32 ? "Windows file names cannot hold control characters" : false }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const stranger = rawFolder(tmp, `${PREFIX}-u1000-conventions-ctl\nline-abc123`, null);
  const legacy = rawFolder(tmp, `${PREFIX}-conventions-ctl\nline-abc123`, null);

  const quiet = runJanitor(w, { tmp });

  assert.equal(quiet.status, 0, `another owner's and a legacy name never change the exit code\n${quiet.text}`);
  assert.ok(exists(stranger) && exists(legacy), "both kept");
  assert.ok(mentions(quiet, "foreign: entry", "owner u1000"), quiet.text);
  assert.ok(mentions(quiet, "legacy: entry"), quiet.text);
  assert.equal(/[\x00-\x09\x0b-\x1f\x7f]/.test(quiet.stderr.join("\n")), false, "no control byte reaches stderr");
  const own = rawFolder(tmp, `${owned("conventions-ctl")}\nline-abc123`, null);
  const refused = runJanitor(w, { tmp });
  assert.equal(refused.status, 3, refused.text);
  assert.ok(exists(own) && refused.stderr.some((line) => line.startsWith("skipped: ") && line.includes("control character")), refused.text);
});

test("S4-22c. a legacy WORKTREE (registered here, or in another clone) goes only when its lock names an old-grammar owner that is gone; a dead-looking Linux reader keeps it listed", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a ps stub must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const record = `${HOSTNAME}@macos:${unmatchablePid()}`;
  const here = path.join(tmp, `${PREFIX}-conventions-legacywt1-abc123`);
  const there = path.join(tmp, `${PREFIX}-conventions-legacywt2-abc123`);
  // testsToDelete-exempt: raw-worktree — a worktree named in the form before the owner segment, which the helper never makes
  const first = rawWorktree(w, w.clone, here, ["--detach", "--lock", "--reason", record, here, "HEAD"]);
  assert.equal(first.status, 0, first.stderr);
  // testsToDelete-exempt: raw-worktree — the same legacy shape in another clone
  const second = rawWorktree(w, w.other, there, ["--detach", "--lock", "--reason", record, there, "HEAD"]);
  assert.equal(second.status, 0, second.stderr);
  age(here, OLD);
  age(there, OLD);

  const linuxReader = runJanitor(w, { tmp });
  assert.equal(linuxReader.status, 0, linuxReader.text);
  assert.ok(exists(here) && exists(there), `a Linux reader cannot place an old-grammar pid: both are kept\n${linuxReader.text}`);
  assert.ok(mentions(linuxReader, `legacy: worktree ${named(here)} — remove with: git worktree remove --force --force `), linuxReader.text);
  assert.ok(mentions(linuxReader, `legacy: worktree ${named(there)} — remove with: git --git-dir=`), linuxReader.text);

  const macReader = runJanitor(w, { tmp, env: { JANITOR_OS: "macos", ...psStub(1) } });
  assert.equal(macReader.status, 0, macReader.text);
  assert.equal(exists(here) || exists(there), false, `on a reader that needs no namespace the gone old-grammar owner is the second key\n${macReader.text}`);
  assert.equal(listedIn(w.clone).includes(named(here)) || listedIn(w.other).includes(named(there)), false, "and both are unregistered");
});

test("S4-38. two users, one daemon: a daemon object has no kernel owner, so the label's owner is the evidence — another owner's container is `foreign:` (never removed), a label naming someone else under this user's name is `foreign:` too, this user's dead one goes", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = unmatchablePid();
  setDocker(w, {
    ps: [
      ["c1", `${PREFIX}-u1000-conventions-bobs-abc123`, ownerOf(dead, { owner: "u1000" }), dockerTime(OLD)], // another user's, dead: theirs to remove
      ["c2", owned("conventions-forged"), ownerOf(dead, { owner: "u1000" }), dockerTime(OLD)], // this user's name, another owner's label
      ["c3", owned("conventions-mine"), NOBODY(), dockerTime(OLD)],
    ],
    net: [["a1", `${PREFIX}-u1000-conventions-bobnet-abc123`, ownerOf(dead, { owner: "u1000" }), dockerTime(OLD)]],
    vol: [[`${PREFIX}-u1000-conventions-bobvol-abc123`, ownerOf(dead, { owner: "u1000" })]], volCreated: [[`${PREFIX}-u1000-conventions-bobvol-abc123`, volumeTime(OLD)]],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, `foreign lines never change the exit code\n${run.text}`);
  assert.deepEqual(rmCalls(w), ["rm -f -v c3"], `only this user's own dead container was removed\n${run.text}`);
  assert.ok(mentions(run, `foreign: container ${PREFIX}-u1000-conventions-bobs-abc123 — owner u1000`), run.text);
  assert.ok(mentions(run, `foreign: container ${owned("conventions-forged")} — owner u1000`), `a label that names another owner under this user's name is unknown: kept, listed with the owner it claims\n${run.text}`);
  assert.ok(mentions(run, "foreign: network ", "owner u1000") && mentions(run, "foreign: volume ", "owner u1000"), run.text);
});

test("S4-39. a volume has no id: it is re-inspected just before it is removed, and one whose creation time or label changed since the capture is kept", { timeout: TIMEOUT }, async (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const [same, recreated, relabelled] = ["vsame", "vnew", "vlabel"].map((what) => owned(`conventions-${what}`));
  const dead = NOBODY();
  const created = volumeTime(OLD); // ONE instant: docker prints whole seconds, and two calls can straddle a second
  setDocker(w, {
    vol: [[same, dead], [recreated, dead], [relabelled, dead]],
    volCreated: [same, recreated, relabelled].map((name) => [name, created]),
  });

  const run = await runPaused(w, tmp, () => {
    setDocker(w, { // what a re-created volume of the same name, and a relabelled one, would answer
      vol: [[same, dead], [recreated, dead], [relabelled, LIVE()]],
      volCreated: [[same, created], [recreated, volumeTime(60_000)], [relabelled, created]],
    });
  });

  assert.equal(run.paused, true, run.stderr);
  assert.deepEqual(rmCalls(w), [`volume rm ${same}`], `only the unchanged volume was removed\n${run.stderr}`);
  assert.ok(run.lines.some((line) => line.startsWith(`skipped: volume ${recreated}`) && line.includes("changed after the capture")), run.stderr);
  assert.ok(run.lines.some((line) => line.startsWith(`skipped: volume ${relabelled}`) && line.includes("changed after the capture")), run.stderr);
  assert.equal(run.status, 3, run.stderr);
});

// --- S4 review fixes ---------------------------------------------------------------------------------------------------------
// The worktree lock of the SWEPT clone is read like any claim, a registration without a folder is kept, a quarantine is restored
// only when old (legacy ones too), the forward rename never goes INTO a directory, and the volume label means one thing on both paths.

/** The admin dir `<clone>/worktrees/<name>` a worktree's own `.git` file names. */
const adminOf = (wt) => /^gitdir: (.*)$/m.exec(fs.readFileSync(path.join(wt, ".git"), "utf8"))[1].trim();

test("S4-40a. the lock of a worktree registered in the SWEPT clone is read like a claim: a record longer than 512 bytes is unreadable (as in Node), never read whole from porcelain", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const parts = NOBODY().split(":"); // owner : host@os : pid [: start : ns] — the start is a run of digits of any length in the grammar
  if (linux) parts[3] = `${parts[3]}${"0".repeat(600)}`;
  else parts.push(`1${"0".repeat(600)}`);
  const long = parts.join(":");
  assert.ok(long.length > 512);
  const wt = worktree(w, w.clone, tmp, "longlock", { lock: long });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(wt.path) && listedIn(w.clone).includes(named(wt.path)), `kept, registered\n${run.text}`);
  assert.ok(mentions(run, `skipped: wt-git`, `${named(wt.path)} — owner '-' is unreadable`), run.text);
});

test("S4-40b. a lock file another user owns is no evidence: the swept clone's worktree is `foreign:` and kept (the kernel-owner seam names the lock file)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.clone, tmp, "foreignlock", { lock: NOBODY() });

  const run = runJanitor(w, { tmp, env: { JANITOR_TEST_OWNER_CHECK: `foreign:${posix(adminOf(wt.path))}/locked` } });

  assert.equal(run.status, 0, run.text);
  assert.ok(exists(wt.path) && listedIn(w.clone).includes(named(wt.path)), `kept, registered\n${run.text}`);
  assert.ok(mentions(run, `foreign: worktree ${named(wt.path)}`), run.text);
});

test("S4-40c. the swept clone must be sound like any clone: one writable by its group keeps every worktree registered in it (kept, named) — closed again, it is swept", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("POSIX modes");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.clone, tmp, "gwclone", { lock: NOBODY() });
  const dir = path.join(w.clone, ".git");
  fs.chmodSync(dir, 0o775);
  w.scope.after(() => fs.chmodSync(dir, 0o755));

  const open = runJanitor(w, { tmp });

  assert.equal(open.status, 3, open.text);
  assert.ok(exists(wt.path) && listedIn(w.clone).includes(named(wt.path)), `kept, registered\n${open.text}`);
  assert.ok(mentions(open, `${named(wt.path)} — owner '-group-or-world-writable' is unreadable`), open.text);

  fs.chmodSync(dir, 0o755);
  const closed = runJanitor(w, { tmp });

  assert.equal(closed.status, 0, closed.text);
  assert.equal(exists(wt.path), false, `closed to the group, the worktree goes\n${closed.text}`);
});

test("S4-40d. a registration whose FOLDER is gone is kept and listed (a notice), never pruned — Node's decide keeps it too", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const wt = worktree(w, w.clone, tmp, "nofolder", { lock: NOBODY() });
  const gone = path.join(w.state, "gone-wt");
  fs.renameSync(wt.path, gone);
  w.scope.after(() => { if (exists(gone) && !exists(wt.path)) fs.renameSync(gone, wt.path); });
  fs.rmSync(gone, { recursive: true, force: true });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  assert.ok(listedIn(w.clone).includes(named(wt.path)), `still registered: nothing pruned it\n${run.text}`);
  assert.ok(mentions(run, "notice:", `worktree ${named(wt.path)}`, "folder is gone"), run.text);
  assert.equal(run.progress.some((line) => line.startsWith("janitor: removed worktree")), false, run.text);
});

test("S4-41. a LEGACY name's quarantine, left by a killed run, is put back like any other (the same owner and dead-renamer checks)", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("restoring onto a name is a POSIX rename (on Windows it is a notice only)");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const legacy = rawFolder(tmp, `${PREFIX}-conventions-legacyq-abc123`, `${HOSTNAME}@linux:${unmatchablePid()}`);
  const quarantine = path.join(tmp, `.${named(legacy)}.teststodelete-quarantine-${unmatchablePid(1)}-abcd1234`);
  fs.renameSync(legacy, quarantine);
  const live = rawFolder(tmp, `${PREFIX}-conventions-legacylive-abc123`, `${HOSTNAME}@linux:${unmatchablePid()}`);
  const qLive = path.join(tmp, `.${named(live)}.teststodelete-quarantine-${process.pid}-abcd1234`); // its renamer is alive
  fs.renameSync(live, qLive);

  const run = runJanitor(w, { tmp, ahead: [oldCtime(w)] });

  assert.ok(exists(legacy) && !exists(quarantine), `restored under its legacy name\n${run.text}`);
  assert.ok(mentions(run, "notice:", `restored as ${named(legacy)}`), run.text);
  assert.ok(exists(qLive) && !exists(live), `a live renamer's is left\n${run.text}`);
  assert.equal(run.status, 0, run.text);
});

test("S4-42. the forward rename never goes INTO a directory: a quarantine name that is taken between the check and the rename keeps the folder, whole and where it was", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dir = folder(w, tmp, "intoq", { owner: NOBODY() });
  fs.writeFileSync(path.join(dir, "keep.txt"), "kept\n");
  age(dir, OLD); // writing a file made it young
  w.scope.after(() => { for (const q of fs.readdirSync(tmp).filter((entry) => entry.includes("quarantine"))) fs.rmSync(path.join(tmp, q), { recursive: true, force: true }); });
  // the moment before the forward rename (whatever its spelling: source, then destination, are the last two arguments) a stranger's directory holding a file appears under the quarantine name
  const mv = toolStub(w, "mv", `src=""; dst=""; for a; do src="$dst"; dst="$a"; done; if [ "$src" = "$RACE_FROM" ]; then mkdir "$dst" && echo x > "$dst/theirs"; fi`);

  const run = runJanitor(w, { tmp, ahead: [mv], env: { RACE_FROM: dir } });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(path.join(dir, "keep.txt")), `the folder is whole, where it was\n${run.text}`);
  assert.deepEqual(fs.readdirSync(tmp).filter((entry) => entry.includes("quarantine")).flatMap((q) => fs.readdirSync(path.join(tmp, q))), ["theirs"], "and nothing went into the directory that appeared");
  assert.ok(mentions(run, "skipped: folder ", named(dir), "could not be renamed into quarantine"), run.text);
  assert.equal(run.progress.some((line) => line.startsWith("janitor: removed folder")), false);
});

test("S4-43a. a restore reserves the name with a directory only its owner can enter (mode 700), and a rename that fails leaves no placeholder behind", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("POSIX modes");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const killed = folder(w, tmp, "reserve", { owner: LIVE() });
  const quarantine = path.join(tmp, `.${named(killed)}.teststodelete-quarantine-${unmatchablePid()}-abcd1234`);
  fs.renameSync(killed, quarantine);
  w.scope.after(() => fs.rmSync(quarantine, { recursive: true, force: true }));
  const mv = toolStub(w, "mv", `for last; do :; done; stat -c %a "$last" >> "$DSTUB/mvmode"; exit 1`);

  const run = runJanitor(w, { tmp, ahead: [mv, oldCtime(w)] });

  assert.deepEqual(fs.readFileSync(path.join(w.state, "mvmode"), "utf8").trim().split("\n"), ["700"], `the reserved name, at the moment of the rename\n${run.text}`);
  assert.equal(exists(killed), false, `no placeholder is left when the rename could not be made\n${run.text}`);
  assert.ok(exists(quarantine) && mentions(run, "notice:", "kept"), run.text);
});

test("S4-43b. a quarantine is restored only when OLD (its ctime and mtime past the window): a young one may belong to a janitor in another pid namespace that is still working on it", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("restoring onto a name is a POSIX rename (on Windows it is a notice only)");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const killed = folder(w, tmp, "youngq", { owner: LIVE() });
  const quarantine = path.join(tmp, `.${named(killed)}.teststodelete-quarantine-${unmatchablePid()}-abcd1234`);
  fs.renameSync(killed, quarantine); // its ctime is NOW

  const young = runJanitor(w, { tmp });
  assert.ok(exists(quarantine) && !exists(killed), `a quarantine younger than the window is left alone\n${young.text}`);

  age(quarantine, OLD); // mtime old, ctime still now: still young
  const half = runJanitor(w, { tmp });
  assert.ok(exists(quarantine) && !exists(killed), `its ctime is what a rename sets: still young\n${half.text}`);

  const old = runJanitor(w, { tmp, ahead: [oldCtime(w)] });
  assert.ok(exists(killed) && !exists(quarantine), `old by both clocks, it is restored\n${old.text}`);
});

test("S4-43c. a quarantine that is already gone before `rm -rf` is a vanished target: a notice, the claim kept, never `removed`", { timeout: TIMEOUT }, (t) => {
  if (win32) {
    t.skip("a stub tool must come first on PATH");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dir = folder(w, tmp, "qvanish", { owner: NOBODY() });
  const rm = realTool("rm");
  const find = toolStub(w, "find", `case "$1" in *.teststodelete-quarantine-*) ${rm} -rf "$1";; esac`); // another run removed it a moment before this one's `rm -rf`

  const run = runJanitor(w, { tmp, ahead: [find] });

  assert.equal(run.status, 0, run.text);
  assert.ok(mentions(run, "notice:", "vanished after the capture"), run.text);
  assert.ok(exists(`${dir}.owner`), `the claim is kept: the folder was not removed by this run\n${run.text}`);
  assert.equal(run.progress.some((line) => line.startsWith("janitor: removed folder")), false, "never announced as removed");
});

test("S4-44. a volume's label reads the same on both paths: what real docker prints for `volume ls` and for `volume inspect` — the quotes of Go's %q included — is one label, so a dead volume goes", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const [dead, live] = ["vquote", "vquotelive"].map((what) => owned(`conventions-${what}`));
  const created = volumeTime(OLD);
  setDocker(w, {
    vol: [[dead, NOBODY()], [live, LIVE()]],
    volCreated: [[dead, created], [live, created]],
    mode: ["quote-ls"], // `volume ls --format '{{printf "%q" .Name}}\t{{printf "%q" (.Label …)}}'` prints "name"<TAB>"label"
  });

  const run = runJanitor(w, { tmp });

  assert.deepEqual(rmCalls(w), [`volume rm ${dead}`], `the dead volume was removed, not 'changed after the capture'\n${run.text}`);
  assert.ok(mentions(run, `skipped: volume ${live}`, "owned by live process"), run.text);
  assert.equal(mentions(run, "changed after the capture"), false, run.text);
});

test("S4-45. another owner's folder is never ENTERED: its name is read first, so `canon` never changes directory into it (strace sees no chdir to it); a legacy name still is", { timeout: TIMEOUT }, (t) => {
  const strace = win32 ? "" : realTool("strace");
  if (strace === "") {
    t.skip("needs strace (Linux)");
    return;
  }
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const theirs = rawFolder(tmp, `${PREFIX}-u1000-conventions-noenter-abc123`, null);
  const theirsWt = rawFolder(tmp, `${PREFIX}-u1000-conventions-noenterwt-abc123`, null);
  fs.writeFileSync(path.join(theirsWt, ".git"), "gitdir: /nowhere/.git/worktrees/x\n");
  const mine = rawFolder(tmp, `${PREFIX}-${ME}-conventions-enters-abc123`, null);
  const log = path.join(w.state, "strace.log");
  const probe = spawnSync(strace, ["-qq", "-o", log, "-e", "trace=chdir", "true"], { encoding: "utf8" });
  if (probe.status !== 0) {
    t.skip(`strace cannot trace here: ${probe.stderr}`);
    return;
  }

  const run = spawnSync(strace, ["-f", "-qq", "-o", log, "-e", "trace=chdir", BASH, SCRIPT], { cwd: w.clone, env: envFor(w, { tmp, docker: true, minAge: 60, ahead: [], extra: {} }), encoding: "utf8", timeout: 240_000 });

  const entered = fs.readFileSync(log, "utf8");
  assert.ok(entered.includes(named(mine)), `the trace works, and this user's own folder is entered: ${run.stderr}`);
  assert.equal(entered.includes(named(theirs)), false, `another owner's folder was entered\n${entered}`);
  assert.equal(entered.includes(named(theirsWt)), false, `another owner's worktree folder was entered\n${entered}`);
  assert.ok(run.stderr.includes(`foreign: folder ${named(theirs)}`) && run.stderr.includes(`foreign: worktree ${named(theirsWt)}`), run.stderr);
});

test("S4-46. the worktree the janitor runs from: this user's scope is `skipped` (exit 3), but a legacy or foreign name is a listed line and never an exit code", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const legacyLeaf = path.join(tmp, `${PREFIX}-conventions-selfleg-abc123`);
  const foreignLeaf = path.join(tmp, `${PREFIX}-u1000-conventions-selfforeign-abc123`);
  const mineLeaf = path.join(tmp, ownedName("selfmine"));
  for (const leaf of [legacyLeaf, foreignLeaf, mineLeaf]) {
    // testsToDelete-exempt: raw-worktree — the three names the helper never makes (a legacy one, another owner's) and one of this user's, run FROM
    const added = rawWorktree(w, w.clone, leaf, ["--detach", leaf, "HEAD"]);
    assert.equal(added.status, 0, added.stderr);
    age(leaf, OLD);
  }

  const legacy = runJanitor(w, { tmp, cwd: legacyLeaf });
  assert.equal(legacy.status, 0, legacy.text);
  assert.ok(mentions(legacy, "notice:", "worktree", named(legacyLeaf), "the janitor runs from it"), legacy.text);

  const foreign = runJanitor(w, { tmp, cwd: foreignLeaf });
  assert.equal(foreign.status, 0, foreign.text);
  assert.ok(mentions(foreign, `foreign: worktree ${named(foreignLeaf)} — owner u1000`), foreign.text);

  const mine = runJanitor(w, { tmp, cwd: mineLeaf });
  assert.equal(mine.status, 3, mine.text);
  assert.ok(mentions(mine, "skipped: worktree", named(mineLeaf), "the janitor runs from it"), mine.text);
  assert.ok(exists(legacyLeaf) && exists(foreignLeaf) && exists(mineLeaf), "nothing was removed");
});
