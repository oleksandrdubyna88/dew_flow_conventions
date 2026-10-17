#!/usr/bin/env node
/**
 * `tools/janitor.sh` — the round-3 liveness and input-hardening verdicts (code gate findings 7, 10, 13, 21, 26, 27, 28,
 * 29 and 33 of E1), kept apart from `janitor.test.mjs` so two branches can grow their tests without touching one file.
 *
 *   7   the Windows `tasklist` snapshot is matched on its PID FIELD, not on any column
 *  10/21/27  one volume that vanished between `docker volume ls` and `inspect` is a notice, not a failed run
 *  26   under `hidepid` a missing /proc/<pid> proves nothing: it is UNKNOWN, not dead (seam: `JANITOR_PROC`)
 *  28   `JANITOR_MIN_AGE_MINUTES` is digits only, and is never evaluated as shell arithmetic
 *  29   owner text any local user can write never reaches stderr as a control sequence
 *  33   a failed `tasklist` is announced ONCE, with its exit status and first line of stderr
 *  13   the header says `--dry-run` prints on STDOUT
 *
 * The harness is the one of `janitor.test.mjs` in small: the real script under a real bash (Git for Windows' bash on
 * Windows, never WSL's), a private TMPDIR, two young clones and a stub `docker` first on PATH. Dead owners are pids no
 * query can match (`lib/unmatchable-pid.mjs`), asserted before and after every run — never the pid of a killed child.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { git } from "./lib/git.mjs";
import { assertNoSuchProcess, unmatchablePid } from "./lib/unmatchable-pid.mjs";
import { cleanupScope, ownedDir, thisOwner } from "./lib/owned.mjs";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "janitor.sh");
const win32 = process.platform === "win32";
const HOUR = 3_600_000;
const OLD = 3 * HOUR;
const TIMEOUT = 3_600_000; // a janitor run spawns dozens of processes, and a loaded Windows machine spawns in seconds each
const RUN_TIMEOUT = 1_800_000;
const TAB = "\t";
const COMMIT = ["-c", "user.name=Janitor test", "-c", "user.email=janitor@example.invalid", "-c", "commit.gpgsign=false",
  "commit", "--allow-empty", "-qm", "fixture"];
const LINUX_TOOLS = ["bash", "sed", "awk", "grep", "find", "head", "tr", "cut", "xargs", "git", "hostname", "uname", "date", "stat", "rm", "env"];

// --- bash, PATH, the run ---------------------------------------------------------------------------------------

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
/** A folder as the script's own bash spells it (`/c/…`, never `C:/…`) — see `janitor.test.mjs`. */
const posix = (p) => (win32 ? slash(p).replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`) : p);

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

function runJanitor(w, { tmp, args = [], ahead = [], env: extra = {} }) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^(path|git_.*|tmpdir|janitor_.*|dstub)$/i.test(key)) env[key] = value;
  }
  Object.assign(env, {
    PATH: [...ahead, pathFor(w)].join(path.delimiter), TMPDIR: posix(tmp), JANITOR_MIN_AGE_MINUTES: "60", DSTUB: slash(w.state), ...extra,
  });
  for (let i = 0; i < 5; i += 1) assertNoSuchProcess(unmatchablePid(i));
  const result = spawnSync(BASH, [slash(SCRIPT), ...args], { cwd: w.clone, env, encoding: "utf8", timeout: RUN_TIMEOUT, windowsHide: true });
  for (let i = 0; i < 5; i += 1) assertNoSuchProcess(unmatchablePid(i));
  const raw = result.stderr ?? "";
  const stderr = raw.split(/\r?\n/).filter(Boolean);
  const stdout = (result.stdout ?? "").split(/\r?\n/).filter(Boolean);
  return { status: result.status, stdout, stderr, raw, text: stderr.join("\n"), error: result.error };
}

// --- the stub docker (volumes only: that is all these tests ask of it) ------------------------------------------

const STUB = `#!/bin/sh
S="$DSTUB"
printf '%s\\n' "$*" >> "$S/log"
last=""; for a in "$@"; do last="$a"; done
emit() { [ -f "$1" ] || return 0; while IFS= read -r l || [ -n "$l" ]; do printf '%s\\n' "$l"; done < "$1"; }
has() { [ -f "$S/mode" ] || return 1; while IFS= read -r l || [ -n "$l" ]; do [ "$l" = "$1" ] && return 0; done < "$S/mode"; return 1; }
TAB=$(printf '\\t')
Q=""; for a in "$@"; do case "$a" in *'%q'*) Q=".q";; esac; done   # a template that quotes the label (Go's %q): the fixture files hold what docker prints in each mode
created() { [ -f "$S/volcreated.tsv" ] || return 0; while IFS= read -r l || [ -n "$l" ]; do case "$l" in "$1$TAB"*) printf '%s\\n' "\${l#*"$TAB"}";; esac; done < "$S/volcreated.tsv"; }
case "$1" in
  ps) emit "$S/ps$Q.tsv";;
  network)
    case "$2" in
      ls) emit "$S/net$Q.tsv";;
      rm) ;;
    esac;;
  volume)
    case "$2" in
      ls) emit "$S/vol$Q.tsv";;
      inspect)
        if [ "$3" = "--format" ]; then
          fmt="$4"; shift 4; rc=0
          if has fail-inspect; then echo "Cannot connect to the Docker daemon at unix:///var/run/docker.sock" >&2; exit 1; fi
          for n in "$@"; do
            if has "vanish:$n"; then echo "Error: No such volume: $n" >&2; rc=1; continue; fi
            c="$(created "$n")"; printf '%s\\t%s\\n' "$n" "$c"
          done
          exit $rc
        fi
        exit 1;;
      rm) ;;
    esac;;
esac
exit 0
`;

const dockerTime = (msAgo) => `${new Date(Date.now() - msAgo).toISOString().replace("T", " ").replace(/\.\d+Z$/, "")} +0000 UTC`;
const volumeTime = (msAgo) => new Date(Date.now() - msAgo).toISOString().replace(/\.\d+Z$/, "Z");
const rows = (list) => list.map((cells) => cells.join(TAB)).join("\n") + (list.length > 0 ? "\n" : "");

/** Go's `%q` of a string: what `{{printf "%q" (.Label …)}}` prints — one line, whatever the label holds. */
function goQuote(text) {
  const named = { "\n": "\\n", "\t": "\\t", "\r": "\\r", '"': '\\"', "\\": "\\\\" };
  const escaped = [...text].map((ch) => {
    const code = ch.codePointAt(0);
    if (named[ch] !== undefined) return named[ch];
    return code < 0x20 || code === 0x7f ? `\\x${code.toString(16).padStart(2, "0")}` : ch;
  });
  return `"${escaped.join("")}"`;
}
const quotedAt = (list, column) => list.map((cells) => cells.map((cell, i) => (i === column ? goQuote(cell) : cell)));

/**
 * `ps`/`net` rows: id, name, owner label, created; `vol`: name, owner label. Each is written twice, the way docker prints it
 * for the two kinds of template: raw (the label as it is — a newline in it is a newline in docker's output) and `.q` (the label
 * quoted, so it is one line whatever it holds).
 */
function setDocker(w, { ps = [], vol = [], volCreated = [], net = [], mode = [] } = {}) {
  fs.writeFileSync(path.join(w.state, "ps.tsv"), rows(ps));
  fs.writeFileSync(path.join(w.state, "ps.q.tsv"), rows(quotedAt(ps, 2)));
  fs.writeFileSync(path.join(w.state, "net.tsv"), rows(net));
  fs.writeFileSync(path.join(w.state, "net.q.tsv"), rows(quotedAt(net, 2)));
  fs.writeFileSync(path.join(w.state, "vol.tsv"), rows(vol));
  fs.writeFileSync(path.join(w.state, "vol.q.tsv"), rows(quotedAt(vol, 1)));
  fs.writeFileSync(path.join(w.state, "volcreated.tsv"), rows(volCreated));
  fs.writeFileSync(path.join(w.state, "mode"), mode.map((line) => `${line}\n`).join(""));
  fs.rmSync(path.join(w.state, "log"), { force: true });
}

const dockerLog = (w) => {
  try {
    return fs.readFileSync(path.join(w.state, "log"), "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
};

// --- the world -------------------------------------------------------------------------------------------------

function makeWorld(t) {
  if (BASH === "") {
    t.skip("Git for Windows bash not found");
    return null;
  }
  const scope = cleanupScope();
  t.after(() => scope.close());
  const roots = ownedDir(scope, "jlclones");
  const clone = path.join(roots, "a");
  fs.mkdirSync(clone);
  git(clone, "init", "-q");
  git(clone, ...COMMIT);
  const w = { scope, clone, stubDir: ownedDir(scope, "jlstub"), state: ownedDir(scope, "jlstate"), binDir: ownedDir(scope, "jlbin") };
  fs.writeFileSync(path.join(w.stubDir, "docker"), STUB, { mode: 0o755 });
  if (!win32) {
    for (const tool of LINUX_TOOLS) {
      const found = spawnSync("sh", ["-c", `command -v ${tool}`], { encoding: "utf8" });
      assert.equal(found.status, 0, `the janitor needs \`${tool}\` and this machine has none`);
      fs.symlinkSync(found.stdout.trim(), path.join(w.binDir, tool));
    }
  }
  setDocker(w);
  return w;
}

const makeTmp = (w, what = "jltmp") => ownedDir(w.scope, what);
const HOST = thisOwner().host;
const OWNER_AS = (os, pid) => `${HOST.split("@")[0]}@${os}:${pid}`;
const exists = (p) => fs.existsSync(p);
const named = (dir) => path.basename(dir);

function age(target, msAgo) {
  const when = new Date(Date.now() - msAgo);
  fs.utimesSync(target, when, when);
}

/** A claimed folder in `tmp` (`owner`: raw text of its `.owner` file), aged. */
function folder(w, tmp, what, { owner, ageMs = OLD }) {
  const dir = ownedDir(w.scope, what, { parent: tmp });
  fs.writeFileSync(`${dir}.owner`, owner);
  age(dir, ageMs);
  return dir;
}

/** A directory holding a `tasklist` stub that logs its argv, then runs `body`. */
function taskStub(w, body) {
  const dir = ownedDir(w.scope, "jllive");
  fs.writeFileSync(path.join(dir, "tasklist"), `#!/bin/sh\necho "tasklist $*" >> "$DSTUB/tasklistlog"\n${body}\n`, { mode: 0o755 });
  return dir;
}

const callsOf = (w, name) => {
  try {
    return fs.readFileSync(path.join(w.state, `${name}log`), "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
};

// --- 7: the tasklist snapshot is matched on the PID field -----------------------------------------------------------

test("L1. Windows liveness reads the PID column only: the pid's digits in another column do not make a dead owner live (gate 7)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const pid = unmatchablePid();
  // the digits of `pid` sit in the session-name and session-number columns, each one a quoted field with a comma after it
  const body = `printf '"node.exe","4242","${pid}","${pid}","1 K"\\r\\n"x${pid}.exe","4244","Console","1","${pid} K"\\r\\n'`;
  const dead = folder(w, tmp, "lvcols", { owner: `${OWNER_AS("windows", pid)}\n` });

  const run = runJanitor(w, { tmp, ahead: [taskStub(w, body)], env: { JANITOR_OS: "windows" } });

  assert.equal(run.status, 0, run.text);
  assert.equal(exists(dead) || exists(`${dead}.owner`), false, `a pid in another column is not a live process\n${run.text}`);
});

test("L1b. ... and a pid that IS in the PID column is live, with the CRLF a real tasklist prints", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const pid = unmatchablePid();
  const live = folder(w, tmp, "lvfield", { owner: `${OWNER_AS("windows", pid)}\n` });

  const run = runJanitor(w, { tmp, ahead: [taskStub(w, `printf '"node.exe","${pid}","Console","1","9 K"\\r\\n'`)], env: { JANITOR_OS: "windows" } });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(live), run.text);
  assert.equal(run.stderr.filter((line) => line.includes("owned by live process")).length, 1, run.text);
});

// --- 33: a failed tasklist is announced once --------------------------------------------------------------------

test("L2. A failed tasklist prints ONE notice with its exit status and first stderr line, then one skip line per resource (gate 33)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dirs = [0, 1, 2].map((i) => folder(w, tmp, `lvf${i}`, { owner: `${OWNER_AS("windows", unmatchablePid(i))}\n` }));
  const stub = taskStub(w, `echo "ERROR: Access denied by policy" >&2; echo "second line" >&2; exit 5`);

  const run = runJanitor(w, { tmp, ahead: [stub], env: { JANITOR_OS: "windows" } });

  assert.equal(run.status, 3, run.text);
  const notices = run.stderr.filter((line) => /tasklist/.test(line) && !line.startsWith("skipped:"));
  assert.equal(notices.length, 1, `one notice naming the failure, got [${notices.join(" // ")}]\n${run.text}`);
  assert.ok(notices[0].includes("5") && notices[0].includes("Access denied by policy"), notices[0]);
  assert.equal(notices[0].includes("second line"), false, "only the FIRST line of stderr");
  for (const dir of dirs) {
    assert.equal(run.stderr.filter((line) => line.includes("liveness unknown") && line.includes(named(dir))).length, 1, run.text);
    assert.ok(exists(dir), `kept\n${run.text}`);
  }
  assert.equal(callsOf(w, "tasklist").length, 1, "and still one snapshot");
});

test("L2b. A tasklist that exits 0 with no process list is announced once too", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  folder(w, tmp, "lvempty0", { owner: `${OWNER_AS("windows", unmatchablePid(0))}\n` });
  folder(w, tmp, "lvempty1", { owner: `${OWNER_AS("windows", unmatchablePid(1))}\n` });

  const run = runJanitor(w, { tmp, ahead: [taskStub(w, "exit 0")], env: { JANITOR_OS: "windows" } });

  assert.equal(run.status, 3, run.text);
  assert.equal(run.stderr.filter((line) => /tasklist/.test(line) && !line.startsWith("skipped:")).length, 1, run.text);
});

// --- 21/27/10: one volume vanishing is not a failed run ------------------------------------------------------------

test("L3. A volume that vanished between `ls` and `inspect` is a notice: the other old volumes are still removed (gates 10/21/27)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const names = ["testsToDelete-v-a", "testsToDelete-v-b", "testsToDelete-v-c"];
  setDocker(w, {
    vol: names.map((name) => [name, ""]), volCreated: names.map((name) => [name, volumeTime(OLD)]), mode: ["vanish:testsToDelete-v-b"],
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, `a vanished volume is not a failure\n${run.text}`);
  const removed = dockerLog(w).filter((line) => line.startsWith("volume rm "));
  assert.deepEqual(removed, ["volume rm testsToDelete-v-a", "volume rm testsToDelete-v-c"], run.text);
  assert.ok(run.stderr.some((line) => line.includes("testsToDelete-v-b") && line.includes("vanished")), run.text);
  assert.equal(run.stderr.some((line) => line.includes("listing failed")), false, run.text);
});

test("L3b. A real docker failure during the inspect is still a failed listing: exit 1, nothing removed", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const kept = folder(w, tmp, "inspectfail", { owner: `${OWNER_AS("windows", unmatchablePid())}\n` });
  setDocker(w, { vol: [["testsToDelete-v-a", ""]], volCreated: [["testsToDelete-v-a", volumeTime(OLD)]], mode: ["fail-inspect"] });

  const run = runJanitor(w, { tmp, env: { JANITOR_OS: "macos" } });

  assert.equal(run.status, 1, run.text);
  assert.ok(run.stderr.some((line) => line.includes("a listing failed — nothing was removed")), run.text);
  assert.equal(dockerLog(w).some((line) => line.startsWith("volume rm")), false, "nothing removed");
  assert.ok(exists(kept), run.text);
});

test("L3c. Each volume gets ITS OWN creation time from the map: the young one stays, the old one goes", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const names = Array.from({ length: 12 }, (_, i) => `testsToDelete-v-${String(i).padStart(2, "0")}`);
  setDocker(w, {
    vol: names.map((name) => [name, ""]), volCreated: names.map((name, i) => [name, volumeTime(i === 5 ? 60_000 : OLD)]),
  });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 0, run.text);
  const removed = dockerLog(w).filter((line) => line.startsWith("volume rm ")).map((line) => line.slice(10));
  assert.deepEqual(removed, names.filter((_, i) => i !== 5), run.text);
  assert.equal(dockerLog(w).filter((line) => line.startsWith("volume inspect")).length, 1, "one batch inspect while it works");
});

// --- 26: hidepid -----------------------------------------------------------------------------------------------------

/** A stand-in for /proc: `entries` are the pid folders it holds. */
function fakeProc(w, entries) {
  const dir = ownedDir(w.scope, "jlproc");
  for (const entry of entries) fs.mkdirSync(path.join(dir, String(entry)));
  return dir;
}

test("L4. Linux: when /proc hides other users' processes (pid 1 invisible), a missing pid is UNKNOWN and its resource is kept (gate 26)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const kept = folder(w, tmp, "hidepid", { owner: `${OWNER_AS("linux", unmatchablePid())}\n` });

  const run = runJanitor(w, { tmp, env: { JANITOR_OS: "linux", JANITOR_PROC: posix(fakeProc(w, [])) } });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(kept) && exists(`${kept}.owner`), `an invisible pid is not a dead one\n${run.text}`);
  assert.equal(run.stderr.filter((line) => line.includes("liveness unknown") && line.includes(named(kept))).length, 1, run.text);
});

test("L4b. Linux: with pid 1 visible a missing /proc/<pid> is dead, and a present one is live", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const proc = posix(fakeProc(w, [1, 5555]));
  const dead = folder(w, tmp, "procdead", { owner: `${OWNER_AS("linux", unmatchablePid())}\n` });
  const live = folder(w, tmp, "proclive", { owner: `${OWNER_AS("linux", 5555)}\n` });

  const run = runJanitor(w, { tmp, env: { JANITOR_OS: "linux", JANITOR_PROC: proc } });

  assert.equal(run.status, 3, run.text);
  assert.equal(exists(dead) || exists(`${dead}.owner`), false, `visible pid 1 and no such pid: dead\n${run.text}`);
  assert.ok(exists(live), run.text);
  assert.equal(run.stderr.filter((line) => line.includes("owned by live process 5555")).length, 1, run.text);
});

// --- 28: JANITOR_MIN_AGE_MINUTES ----------------------------------------------------------------------------------------

test("L5. JANITOR_MIN_AGE_MINUTES is digits only: anything else is refused in one line, exit 1, and is never evaluated (gate 28)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const marks = ownedDir(w.scope, "jlmark");
  const kept = folder(w, tmp, "agebad", { owner: `${OWNER_AS("macos", unmatchablePid())}\n` });
  const injected = `${posix(marks)}/pwned`;
  for (const value of [`a[$(echo x>${injected})]`, "1+1", "-5", "0x10", "abc", "6 0", "9999999999999999999"]) {
    const run = runJanitor(w, { tmp, env: { JANITOR_OS: "macos", JANITOR_MIN_AGE_MINUTES: value } });

    assert.equal(run.status, 1, `${JSON.stringify(value)}\n${run.text}`);
    assert.equal(run.stderr.length, 1, `one line for ${JSON.stringify(value)}: ${run.text}`);
    assert.ok(run.stderr[0].startsWith("janitor: JANITOR_MIN_AGE_MINUTES"), run.text);
    assert.ok(exists(kept), `nothing removed for ${JSON.stringify(value)}`);
  }
  assert.equal(exists(path.join(marks, "pwned")), false, "the value was executed as arithmetic");
});

test("L5b. A leading zero is a decimal number of minutes, not octal", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const fifty = folder(w, tmp, "age50", { owner: `${OWNER_AS("macos", unmatchablePid())}\n`, ageMs: 50 * 60_000 });

  const run = runJanitor(w, { tmp, env: { JANITOR_OS: "macos", JANITOR_MIN_AGE_MINUTES: "060" } }); // octal 060 = 48 minutes

  assert.equal(run.status, 0, run.text);
  assert.ok(exists(fifty), `a 50-minute-old folder is inside a 60-minute window\n${run.text}`);
});

// --- 29: control characters in owner text ---------------------------------------------------------------------------------

test("L6. An owner written with escape sequences and a newline reaches stderr as one printable line (gate 29)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const evil = folder(w, tmp, "evilowner", { owner: "x\x1b[2J\x1b]0;pwned\x07hello\rworld\nskipped: folder /etc — forged\n" });

  const run = runJanitor(w, { tmp });

  assert.equal(run.status, 3, run.text);
  assert.ok(exists(evil), run.text);
  assert.equal(/[\x00-\x09\x0b-\x1f\x7f]/.test(run.raw), false, `a control character reached stderr: ${JSON.stringify(run.raw)}`);
  assert.equal(run.stderr.length, 1, `one skip line, not a forged second one: ${JSON.stringify(run.stderr)}`);
  assert.ok(run.stderr[0].startsWith("skipped: folder ") && run.stderr[0].includes("is unreadable"), run.text);
});

/** A label a stranger wrote: a newline, then a whole record of its own that ends where docker's real record continues. */
const FORGE_CONTAINER = "x\ncFORGED\ttestsToDelete-conventions-forged\t";
const FORGE_NETWORK = "x\nnFORGED\ttestsToDelete-conventions-nforged\t";

test("L6b. A container or network label holding a newline cannot forge a capture row: the forged id is never removed (gate 29)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  setDocker(w, {
    ps: [["c1", "testsToDelete-conventions-real", FORGE_CONTAINER, dockerTime(OLD)]],
    net: [["n1", "testsToDelete-conventions-nreal", FORGE_NETWORK, dockerTime(OLD)]],
  });

  const run = runJanitor(w, { tmp });

  const calls = dockerLog(w).filter((line) => /^(rm|network rm) /.test(line));
  assert.deepEqual(calls, [], `nothing may be removed — the forged rows named cFORGED and nFORGED\n${run.text}`);
  assert.equal(run.status, 3, run.text);
  assert.equal(run.stderr.filter((line) => line.startsWith("skipped: ")).length, 2, `exactly the two real resources are skipped: ${JSON.stringify(run.stderr)}`);
  assert.equal(run.stderr.some((line) => /^skipped: (container|network) [^ ]*forged/i.test(line)), false, `a forged resource was captured: ${JSON.stringify(run.stderr)}`);
  assert.equal(/[\x00-\x09\x0b-\x1f\x7f]/.test(run.raw), false, `a control character reached stderr: ${JSON.stringify(run.raw)}`);
});

test("L6c. A volume label holding a newline cannot forge a volume row", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const real = "testsToDelete-conventions-vreal";
  const forged = "testsToDelete-conventions-vforged";
  setDocker(w, {
    vol: [[real, `x\n${forged}`]], volCreated: [[real, volumeTime(OLD)], [forged, volumeTime(OLD)]],
  });

  const run = runJanitor(w, { tmp });

  assert.deepEqual(dockerLog(w).filter((line) => line.startsWith("volume rm ")), [], `neither volume may be removed: the real one has an unreadable owner\n${run.text}`);
  assert.equal(run.status, 3, run.text);
  assert.equal(run.stderr.some((line) => line.startsWith(`skipped: volume ${forged}`)), false, `a forged volume was captured: ${JSON.stringify(run.stderr)}`);
  assert.equal(run.stderr.filter((line) => line.startsWith("skipped: volume ")).length, 1, run.text);
});

test("L6d. A readable owner label still works through the quoted template: dead → removed, live → kept", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const dead = `${OWNER_AS("linux", unmatchablePid())}`;
  const proc = posix(fakeProc(w, [1, 5555]));
  setDocker(w, {
    ps: [["c1", "testsToDelete-conventions-dead", dead, dockerTime(OLD)], ["c2", "testsToDelete-conventions-none", "", dockerTime(OLD)],
      ["c3", "testsToDelete-conventions-live", OWNER_AS("linux", 5555), dockerTime(OLD)]],
    net: [["n1", "testsToDelete-conventions-ndead", dead, dockerTime(OLD)]],
    vol: [["testsToDelete-conventions-vdead", dead]], volCreated: [["testsToDelete-conventions-vdead", volumeTime(OLD)]],
  });

  const run = runJanitor(w, { tmp, env: { JANITOR_OS: "linux", JANITOR_PROC: proc } });

  assert.equal(run.status, 3, `the live container is the one skip\n${run.text}`);
  assert.deepEqual(dockerLog(w).filter((line) => /^(rm|network rm|volume rm) /.test(line)).sort(),
    ["network rm n1", "rm -f -v c1", "rm -f -v c2", "volume rm testsToDelete-conventions-vdead"], run.text);
  assert.ok(run.stderr.some((line) => line.startsWith("skipped: container testsToDelete-conventions-live") && line.includes("owned by live process 5555")), run.text);
});

// --- the host name: normalised exactly as owned.mjs does, compared case-insensitively ------------------------------------

// Git for Windows' bash puts /usr/bin first on its own PATH, so a `hostname` stub cannot win there: the script reads JANITOR_HOSTNAME (a test seam, like JANITOR_OS).

test("L13. A machine name holding a space, ':' or '@' is normalised like owned.mjs (one dash per run), and the comparison ignores case", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const proc = posix(fakeProc(w, [1]));
  const env = { JANITOR_OS: "linux", JANITOR_PROC: proc };
  const dead = unmatchablePid();
  const same = folder(w, tmp, "hostsame", { owner: `my-host-x-y@linux:${dead}\n` });
  const upper = folder(w, tmp, "hostupper", { owner: `MY-HOST-X-Y@linux:${dead}\n` });
  const other = folder(w, tmp, "hostother", { owner: `my-host@linux:${dead}\n` });

  const run = runJanitor(w, { tmp, env: { ...env, JANITOR_HOSTNAME: "my host:x@y" } });

  assert.equal(exists(same) || exists(`${same}.owner`), false, `the owner this machine writes (my-host-x-y) is ours, and its process is gone\n${run.text}`);
  assert.equal(exists(upper) || exists(`${upper}.owner`), false, `the same name in another case is the same host\n${run.text}`);
  assert.ok(exists(other), `a different name is another host\n${run.text}`);
  assert.ok(run.stderr.some((line) => line.includes("belongs to my-host@linux, not this host")), run.text);
  assert.equal(run.status, 3, run.text);
});

// --- orphan claims: a `<name>.owner` whose folder does not exist (a claim-first helper that died before it created) -------

function orphanClaim(tmp, name, text) {
  const file = path.join(tmp, `${name}.owner`);
  fs.writeFileSync(file, text);
  age(file, OLD);
  return file;
}

test("L12. An orphan claim is judged by its owner: gone is removed, live and unreadable stay; --token narrows it and --dry-run keeps it", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const proc = posix(fakeProc(w, [1, 5555]));
  const env = { JANITOR_OS: "linux", JANITOR_PROC: proc };
  const gone = (name) => orphanClaim(tmp, name, `${OWNER_AS("linux", unmatchablePid())}\n`);
  const liveClaim = orphanClaim(tmp, "testsToDelete-alpha-orphanlive", `${OWNER_AS("linux", 5555)}\n`);
  const garbled = orphanClaim(tmp, "testsToDelete-alpha-orphangarbled", "not an owner\n");
  const alpha = gone("testsToDelete-alpha-orphangone");
  const beta = gone("testsToDelete-beta-orphangone");

  const dry = runJanitor(w, { tmp, args: ["--dry-run", "--token", "alpha"], env });
  assert.equal(dry.status, 3, dry.text);
  assert.deepEqual([alpha, beta, liveClaim, garbled].filter((file) => !exists(file)), [], `a dry run removes nothing\n${dry.text}`);
  const would = dry.stdout.filter((line) => line.startsWith("would run:"));
  assert.equal(would.some((line) => line.includes("orphangone") && line.includes("alpha")), true, `the alpha orphan is announced: ${would.join(" // ")}`);
  assert.equal(would.some((line) => line.includes("beta")), false, `--token alpha never announces beta: ${would.join(" // ")}`);

  const narrowed = runJanitor(w, { tmp, args: ["--token", "alpha"], env });
  assert.equal(exists(alpha), false, `the dead alpha claim is removed\n${narrowed.text}`);
  assert.ok(exists(beta), `--token alpha leaves the beta claim\n${narrowed.text}`);
  assert.ok(exists(liveClaim) && exists(garbled), `a live or unreadable claim stays\n${narrowed.text}`);
  assert.ok(narrowed.stderr.some((line) => line.startsWith("skipped: marker ") && line.includes("owned by live process 5555")), narrowed.text);
  assert.equal(narrowed.status, 3, narrowed.text);

  const all = runJanitor(w, { tmp, env });
  assert.equal(exists(beta), false, `without --token the beta claim goes too\n${all.text}`);
  assert.ok(exists(liveClaim) && exists(garbled), all.text);
});

// --- 13: the header ------------------------------------------------------------------------------------------------------------

test("L7. The header says --dry-run prints its `would run:` lines on STDOUT (gate 13)", () => {
  const header = fs.readFileSync(SCRIPT, "utf8").split(/\r?\n/).filter((line) => line.startsWith("#")).join(" ").replace(/#\s+/g, "");
  assert.match(header, /--dry-run prints `would run: …` lines on STDOUT/);
});

// --- the claim reader and the process id (decided after the first review of this round) ---------------------------

/** A `ps` that says "no such process" (rc 1) for every pid and logs its calls, as a bash FUNCTION (see `janitor.test.mjs`). */
const psSaysNoSuchProcess = { "BASH_FUNC_ps%%": '() {  echo "ps $*" >> "$DSTUB/pslog"; return 1\n}' };

test("L9. A claim of more than ONE line is unreadable and kept; one trailing line end (LF or CRLF) is still one line (i29, g08)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const claim = (pid) => OWNER_AS("macos", pid);
  const blank = folder(w, tmp, "blankline", { owner: `${claim(unmatchablePid(0))}\n\n` });
  const second = folder(w, tmp, "twolines", { owner: `${claim(unmatchablePid(1))}\nsecond\n` });
  const crcr = folder(w, tmp, "crcr", { owner: `${claim(unmatchablePid(2))}\r\r\n` });
  const lf = folder(w, tmp, "oneLF", { owner: `${claim(unmatchablePid(3))}\n` });
  const crlf = folder(w, tmp, "oneCRLF", { owner: `${claim(unmatchablePid(4))}\r\n` });

  const run = runJanitor(w, { tmp, env: { JANITOR_OS: "macos", ...psSaysNoSuchProcess } });

  assert.equal(run.status, 3, run.text);
  for (const dir of [blank, second, crcr]) {
    assert.ok(exists(dir), `${named(dir)} is more than one line: unreadable, so kept\n${run.text}`);
    assert.equal(run.stderr.filter((line) => line.includes("is unreadable") && line.includes(named(dir))).length, 1, run.text);
  }
  for (const dir of [lf, crlf]) assert.equal(exists(dir) || exists(`${dir}.owner`), false, `${named(dir)} is one line: dead and removed\n${run.text}`);
});

test("L9b. owner_ok itself takes exactly one trailing CR off before it validates (g08 on a bash whose $(...) keeps it)", { timeout: TIMEOUT }, (t) => {
  if (BASH === "") {
    t.skip("Git for Windows bash not found");
    return;
  }
  const text = fs.readFileSync(SCRIPT, "utf8").split(/\r?\n/);
  const start = text.findIndex((line) => line.startsWith("owner_ok()"));
  assert.ok(start >= 0, "owner_ok is defined at the top level");
  // the value goes in on stdin, NUL-terminated: an argument would be rewritten by the Windows command line
  const probe = (value) => spawnSync(BASH, ["-c", `${text[start]}\nIFS= read -r -d '' v; owner_ok "$v" && echo valid || echo invalid`], {
    input: `${value}\0`, encoding: "utf8", windowsHide: true,
  }).stdout.trim();
  assert.equal(probe("h@linux:1\r"), "valid", "one trailing CR is a CRLF line end that lost its LF");
  assert.equal(probe("h@linux:1\r\r"), "invalid", "exactly one");
  assert.equal(probe("h@li\rnux:1"), "invalid", "a CR inside is not a line end");
});

test("L10. A pid that cannot name a process (0, leading zero, wider than 2^53-1) is UNKNOWN and the process list is never asked (v23, v24)", { timeout: TIMEOUT }, (t) => {
  const w = makeWorld(t);
  if (w === null) return;
  const tmp = makeTmp(w);
  const kept = ["0", "1234567890123456789012345", "007", "9007199254740992"].map((pid, i) => folder(w, tmp, `badpid${i}`, { owner: `${OWNER_AS("macos", pid)}\n` }));
  const edge = folder(w, tmp, "edgepid", { owner: `${OWNER_AS("macos", "9007199254740991")}\n` }); // 2^53-1: a valid id that nothing holds

  const run = runJanitor(w, { tmp, env: { JANITOR_OS: "macos", ...psSaysNoSuchProcess } });

  assert.equal(run.status, 3, run.text);
  for (const dir of kept) {
    assert.ok(exists(dir), `${named(dir)} names no process: kept\n${run.text}`);
    assert.equal(run.stderr.filter((line) => line.includes("liveness unknown") && line.includes(named(dir))).length, 1, run.text);
  }
  assert.deepEqual(callsOf(w, "ps"), ["ps -p 9007199254740991 -o pid="], "only the one valid id reached ps");
  assert.equal(exists(edge) || exists(`${edge}.owner`), false, `2^53-1 is the largest valid id, and nothing holds it: dead\n${run.text}`);
});

// --- --token: one repository's leftovers only ------------------------------------------------------------------------------------

/** A folder named `name` straight in `tmp`, unclaimed and old: nobody's, so the janitor removes it when it judges it. */
function plainFolder(tmp, name) {
  const dir = path.join(tmp, name);
  fs.mkdirSync(dir);
  age(dir, OLD);
  return dir;
}

const TOKEN_SWEPT = ["testsToDelete-alpha-a1b2c3", "teststodelete-alpha-a1b2c4", "teststodelete_alpha_a1b2c5", "TESTSTODELETE-ALPHA-a1b2c6"];
const TOKEN_KEPT = ["testsToDelete-alphabet-d1e2f3", "testsToDelete-beta-d1e2f4", "teststodelete_beta_d1e2f5"];

function tokenWorld(t) {
  const w = makeWorld(t);
  if (w === null) return null;
  const tmp = makeTmp(w, "jltokens");
  w.swept = TOKEN_SWEPT.map((name) => plainFolder(tmp, name));
  w.kept = TOKEN_KEPT.map((name) => plainFolder(tmp, name));
  w.tmp = tmp;
  setDocker(w, {
    ps: [["c1", "testsToDelete-alpha-c0ffee", "", dockerTime(OLD)], ["c2", "testsToDelete-beta-c0ffef", "", dockerTime(OLD)], ["c3", "teststodelete-alphabet-c0fff0", "", dockerTime(OLD)]],
    vol: [["teststodelete_alpha_v00001", ""], ["teststodelete_beta_v00002", ""]],
    volCreated: [["teststodelete_alpha_v00001", volumeTime(OLD)], ["teststodelete_beta_v00002", volumeTime(OLD)]],
  });
  return w;
}

test("L11. --token alpha sweeps only testsToDelete-alpha-… in all three spellings and any case — anchored, so 'alphabet' and 'beta' stay", { timeout: TIMEOUT }, (t) => {
  const w = tokenWorld(t);
  if (w === null) return;

  const run = runJanitor(w, { tmp: w.tmp, args: ["--token", "alpha"], env: { JANITOR_OS: "macos" } });

  assert.equal(run.status, 0, run.text);
  assert.deepEqual(w.swept.filter((dir) => exists(dir)), [], `every alpha folder goes
${run.text}`);
  assert.deepEqual(w.kept.filter((dir) => !exists(dir)), [], `no other token is touched
${run.text}`);
  const removed = dockerLog(w).filter((line) => /^(rm|volume rm) /.test(line));
  assert.deepEqual(removed, ["rm -f -v c1", "volume rm teststodelete_alpha_v00001"], `only alpha's container and volume
${run.text}`);
});

test("L11b. --token and --dry-run combine in either order: the same would-run lines on stdout, nothing removed", { timeout: TIMEOUT }, (t) => {
  const w = tokenWorld(t);
  if (w === null) return;
  for (const args of [["--token", "alpha", "--dry-run"], ["--dry-run", "--token", "alpha"]]) {
    setDocker(w, { ps: [["c1", "testsToDelete-alpha-c0ffee", "", dockerTime(OLD)], ["c2", "testsToDelete-beta-c0ffef", "", dockerTime(OLD)]] });

    const run = runJanitor(w, { tmp: w.tmp, args, env: { JANITOR_OS: "macos" } });

    assert.equal(run.status, 0, `${args.join(" ")}
${run.text}`);
    assert.deepEqual([...w.swept, ...w.kept].filter((dir) => !exists(dir)), [], "a dry run removes nothing");
    assert.deepEqual(dockerLog(w).filter((line) => /^rm /.test(line)), [], "and calls no rm");
    const would = run.stdout.filter((line) => line.startsWith("would run:"));
    assert.ok(would.some((line) => line.includes("docker rm -f -v c1")), `${args.join(" ")}: ${would.join(" // ")}`);
    assert.equal(would.some((line) => line.includes("c2") || /beta|alphabet/i.test(line)), false, `only alpha is announced: ${would.join(" // ")}`);
    assert.equal(would.filter((line) => /alpha/i.test(line) && line.includes("rm -rf")).length, TOKEN_SWEPT.length, would.join(" // "));
  }
});

test("L11c. An invalid token — or any unknown argument — exits 2 with a usage line and removes nothing", { timeout: TIMEOUT }, (t) => {
  const w = tokenWorld(t);
  if (w === null) return;
  const bad = [["--token"], ["--token", ""], ["--token", "Alpha"], ["--token", "a-b"], ["--token", "al pha"], ["--token", "a*"], ["--token", "../x"], ["--token", "alpha", "extra"], ["--bogus"]];
  for (const args of bad) {
    const run = runJanitor(w, { tmp: w.tmp, args, env: { JANITOR_OS: "macos" } });

    assert.equal(run.status, 2, `${JSON.stringify(args)}
${run.text}`);
    assert.ok(run.stderr.some((line) => line.startsWith("usage:") && line.includes("--token")), `${JSON.stringify(args)}: ${run.text}`);
    assert.deepEqual([...w.swept, ...w.kept].filter((dir) => !exists(dir)), [], `${JSON.stringify(args)} removed something`);
    assert.deepEqual(dockerLog(w), [], `${JSON.stringify(args)} reached docker`);
  }
});

test("L11d. The header documents --token", () => {
  const header = fs.readFileSync(SCRIPT, "utf8").split(/\r?\n/).filter((line) => line.startsWith("#")).join(" ").replace(/#\s+/g, "");
  assert.match(header, /--token <t>/);
  assert.match(header, /Usage:\s+bash tools\/janitor\.sh \[--dry-run\] \[--token <t>\]/);
});
