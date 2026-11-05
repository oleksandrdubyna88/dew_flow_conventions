#!/usr/bin/env node
/**
 * One table of owner vectors, run against BOTH implementations of `common/test-leftovers.md` §3.
 *
 * The rule's owner grammar and liveness procedure are written twice: `owner_ok()` / `liveness()` in `tools/janitor.sh`
 * (the host-wide janitor) and `parseOwner` / `ownerState` in `tools/lib/owned.mjs` (the Node sweep). Nothing but a
 * reader's care kept the two on the same language and the same verdicts. This file is that care, as a test: the
 * vectors live in `tools/fixtures/owner-vectors.json` (data, not a test), each vector carries the reason for its
 * expected value taken from the rule's wording, and each is asked of both sides. A disagreement is a red subtest
 * that names the vector and BOTH answers; this file never edits either implementation.
 *
 * Grammar. The Node side is `parseOwner` (the merged record) and `parseLegacyOwner` (the form before the owner segment). The
 * bash side is `owner_ok` and `legacy_owner_ok`, cut out of `tools/janitor.sh` BY NAME (the script has no seam: it runs top to
 * bottom when it is executed, and a seam would be a change to a hash-pinned file) together with any helper function it calls,
 * and run in a private bash. The bash side is handed the text the way the janitor hands it: after `claim_norm`, the janitor's
 * own read of a claim. The same cut asks bash for the name's form (`name_form`), the Windows owner token (`win_token`) and the
 * pure half of the scope key (`scope_ok`, `ns_ok`); the scope table is also put to the real janitor, with the kernel owner
 * made someone else's through its `-O` seam.
 *
 * Verdicts. The Node side is `ownerState` through its `probe` seam. The bash side is the real janitor, run over a
 * private TMPDIR with one old claimed folder per vector and stubs for the liveness tools — `ps` (the non-Windows
 * branch, through JANITOR_OS=macos) and `tasklist` (the Windows branch, through JANITOR_OS=windows; two runs, because a
 * stub that fails fails for every pid). The outcome is mapped back to the rule's three words: the folder removed is
 * `gone`; kept with "owned by live process" is `live`; kept with any other reason is `unknown`. The Linux branch
 * (/proc) cannot be stubbed and is not run. A vector whose verdict depends on comparing two start times that DISAGREE
 * is `node`-only: the janitor never reads a start, which §3 allows ("the reader cannot read the live one → live");
 * for those the janitor is held to the one property that matters — it must not delete.
 *
 * Bash. On Windows it is Git for Windows' bash, from `git --exec-path` — never WSL's. Absent: the bash halves skip
 * with a diagnostic and the Node halves still run.
 *
 * Scratch follows the rule under test: every folder is made by `ownedDir`, removed in place.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { git } from "./lib/git.mjs";
import { assertNoSuchProcess, unmatchablePid } from "./lib/unmatchable-pid.mjs";
import * as owned from "./lib/owned.mjs";
import { cleanupScope, ownerState, ownedDir, parseLegacyOwner, thisOwner, thisOwnerToken } from "./lib/owned.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, "janitor.sh");
const VECTORS = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures", "owner-vectors.json"), "utf8"));
const win32 = process.platform === "win32";
const HOUR = 3_600_000;
const OLD = 3 * HOUR; // the janitor's window is 60 minutes
const TIMEOUT = 3_600_000; // a janitor run spawns dozens of processes; a loaded Windows machine spawns in seconds each
const RUN_TIMEOUT = 1_800_000;
const LIVE_START = 1_790_000_000;
const ME = thisOwnerToken(); // the caller's owner token: the janitor under test derives the same one from its own uid
// Exactly what the script calls (a private PATH of symlinks proves it).
const LINUX_TOOLS = ["bash", "sed", "awk", "grep", "find", "head", "tr", "cut", "xargs", "git", "hostname", "uname", "date", "stat", "rm", "env", "readlink", "mv", "mkdir", "rmdir", "id", "sha256sum"];

// --- bash and PATH (the same locating rules as tools/janitor.test.mjs) ----------------------------------------

function locateBash() {
  if (!win32) return { bash: fs.existsSync("/bin/bash") ? "/bin/bash" : "", gitRoot: "" };
  const found = spawnSync("git", ["--exec-path"], { encoding: "utf8", windowsHide: true });
  if (found.status !== 0) return { bash: "", gitRoot: "" };
  const gitRoot = path.resolve(found.stdout.trim(), "..", "..", "..");
  const bash = path.join(gitRoot, "bin", "bash.exe");
  const systemRoot = (process.env.SystemRoot ?? process.env.WINDIR ?? "").toLowerCase();
  if (systemRoot !== "" && bash.toLowerCase().startsWith(systemRoot)) return { bash: "", gitRoot }; // WSL's, never
  return { bash: fs.existsSync(bash) ? bash : "", gitRoot };
}

const { bash: BASH, gitRoot: GIT_ROOT } = locateBash();
const slash = (p) => p.replaceAll("\\", "/");
/** A folder as the script's own bash spells it (`/c/Users/…`, never `C:/…`; see janitor.test.mjs `posix`). */
const posix = (p) => (win32 ? slash(p).replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`) : p);
const exists = (p) => fs.existsSync(p);

function lifo(t) {
  const scope = cleanupScope();
  t.after(() => scope.close());
  return scope;
}

// --- the bash side of the grammar: owner_ok, cut out of the script by name --------------------------------------

/** Top-level `name() {` definitions of the script: name → index of its first line. */
function definedFunctions(lines) {
  const found = new Map();
  lines.forEach((line, index) => {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\(\)\s*\{/.exec(line);
    if (m !== null && !found.has(m[1])) found.set(m[1], index);
  });
  return found;
}

function parsesAsBash(snippet) {
  return spawnSync(BASH, ["-n"], { input: snippet, encoding: "utf8", windowsHide: true }).status === 0;
}

/** The text of one function: from its first line to the shortest run of lines that bash parses. `""` when it is absent. */
function extractFunction(lines, start) {
  for (let end = start; end < lines.length; end += 1) {
    const snippet = lines.slice(start, end + 1).join("\n");
    if (parsesAsBash(snippet)) return snippet;
  }
  return "";
}

/** Top-level lines of the script that assign one of `names` (a function reads a variable the script sets just above it). */
function assignmentLines(scriptText, names) {
  return scriptText.split(/\r?\n/).filter((line) => names.some((name) => line.startsWith(`${name}=`))).join("\n");
}

/** The function `root`, plus `extra` and every other top-level function of the script that they (transitively) name. */
function ownerOkSource(scriptText, root = "owner_ok", extra = ["claim_norm"]) {
  const lines = scriptText.split(/\r?\n/);
  const defined = definedFunctions(lines);
  const wanted = [root, ...extra];
  const parts = new Map();
  while (wanted.length > 0) {
    const name = wanted.pop();
    if (parts.has(name) || !defined.has(name)) continue;
    const text = extractFunction(lines, defined.get(name));
    parts.set(name, text);
    const body = text.replace(/^[^{]*\{/, "");
    for (const other of defined.keys()) {
      if (new RegExp(`(^|[^A-Za-z0-9_])${other}([^A-Za-z0-9_]|$)`).test(body)) wanted.push(other);
    }
  }
  return parts.has(root) && parts.get(root) !== "" ? [...parts.values()].join("\n") : "";
}

/** For every vector: does `fn` (`owner_ok` or `legacy_owner_ok`) accept it, as the janitor would be handed it? */
function bashGrammarAnswers(t, vectors, fn = "owner_ok") {
  const scope = lifo(t);
  const source = ownerOkSource(fs.readFileSync(SCRIPT, "utf8"), fn);
  assert.notEqual(source, "", `${fn} could not be cut out of tools/janitor.sh by name — the conformance test needs a seam it can find`);
  const dir = ownedDir(scope, "ocgram");
  const harness = path.join(dir, "grammar.sh");
  fs.writeFileSync(harness, `${assignmentLines(fs.readFileSync(SCRIPT, "utf8"), ["LC_ALL"])}
${source}
while IFS= read -r -d '' raw; do
  v="$(claim_norm "$raw")"   # the janitor's own read of a claim file (claim_of keeps the trailing newlines claim_norm judges)
  if ${fn} "$v"; then echo 1; else echo 0; fi
done
`);
  const input = Buffer.from(vectors.map((v) => `${v.text}\0`).join(""), "utf8");
  const result = spawnSync(BASH, [slash(harness)], { input, encoding: "utf8", windowsHide: true });
  const lines = (result.stdout ?? "").split(/\r?\n/).filter(Boolean);
  assert.equal(lines.length, vectors.length, `the bash harness answered ${lines.length} of ${vectors.length} vectors (status ${result.status})\n${result.stderr}`);
  return new Map(vectors.map((v, i) => [v.id, lines[i] === "1"]));
}

// --- grammar -------------------------------------------------------------------------------------------------

const GRAMMAR = VECTORS.grammar.vectors;
const nodeAccepts = (text) => parseLegacyOwner(text).unreadable !== true; // the grammar before the owner segment: a LEGACY name's record

test("the tables are what they claim: ≥ 25 grammar vectors, ≥ 10 verdict vectors, unique ids, a reason on each", () => {
  assert.ok(GRAMMAR.length >= 25, `${GRAMMAR.length} grammar vectors`);
  assert.ok(VECTORS.verdicts.vectors.length >= 10, `${VECTORS.verdicts.vectors.length} verdict vectors`);
  const ids = [...GRAMMAR, ...VECTORS.verdicts.vectors].map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length, "vector ids are unique");
  for (const v of [...GRAMMAR, ...VECTORS.verdicts.vectors]) assert.ok(typeof v.why === "string" && v.why.length > 10, `${v.id} has a reason`);
  assert.ok(GRAMMAR.some((v) => v.valid) && GRAMMAR.some((v) => !v.valid), "both valid and invalid forms");
  assert.deepEqual([...new Set(VECTORS.verdicts.vectors.map((v) => v.expected))].sort(), ["gone", "live", "unknown"], "all three verdicts");
});

test("grammar: every vector of the form before the owner segment, asked of parseLegacyOwner (owned.mjs) and legacy_owner_ok (janitor.sh)", { timeout: TIMEOUT }, async (t) => {
  let bashSays = null;
  if (BASH === "") t.diagnostic("bash not found: the bash half of every grammar vector is skipped");
  else bashSays = bashGrammarAnswers(t, GRAMMAR, "legacy_owner_ok");
  for (const v of GRAMMAR) {
    await t.test(`${v.id} ${JSON.stringify(v.text)} → ${v.valid ? "valid" : "invalid"}`, () => {
      const word = (accepted) => (accepted === null ? "not run" : accepted ? "valid" : "invalid");
      const node = nodeAccepts(v.text);
      const bash = bashSays === null ? null : bashSays.get(v.id);
      const message = `vector ${v.id} ${JSON.stringify(v.text)}: rule §3 says ${word(v.valid)} (${v.why}); `
        + `node parseLegacyOwner says ${word(node)}; bash legacy_owner_ok says ${word(bash)}`;
      assert.deepEqual({ node, bash: bash ?? v.valid }, { node: v.valid, bash: v.valid }, message);
    });
  }
});

// --- host names: one normalisation rule on both sides ---------------------------------------------------------

const HOSTNAMES = VECTORS.hostnames.vectors;

/** What `host_id` (janitor.sh, cut out by name) prints for each raw host name and distribution; two NUL-separated texts in, one line out. */
function bashHostNames(t, vectors) {
  const scope = lifo(t);
  const source = ownerOkSource(fs.readFileSync(SCRIPT, "utf8"), "host_id", []);
  assert.notEqual(source, "", "host_id could not be cut out of tools/janitor.sh by name");
  const dir = ownedDir(scope, "ochost");
  const harness = path.join(dir, "host.sh");
  fs.writeFileSync(harness, `${source}
while IFS= read -r -d '' raw && IFS= read -r -d '' distro; do
  printf '[%s]\\n' "$(host_id "$raw" "$distro")"
done
`);
  const input = Buffer.from(vectors.map((v) => `${v.raw}\0${v.distro ?? ""}\0`).join(""), "utf8");
  const result = spawnSync(BASH, [slash(harness)], { input, encoding: "utf8", windowsHide: true });
  const lines = (result.stdout ?? "").split(/\r?\n/).filter(Boolean).map((line) => line.slice(1, -1));
  assert.equal(lines.length, vectors.length, `the bash harness answered ${lines.length} of ${vectors.length} names (status ${result.status})\n${result.stderr}`);
  return new Map(vectors.map((v, i) => [v.id, lines[i]]));
}

test("host names: every raw name is normalised alike by hostName (owned.mjs) and host_norm (janitor.sh)", { timeout: TIMEOUT }, async (t) => {
  assert.equal(typeof owned.hostId, "function", "owned.mjs exports hostId(raw, distro) — the host part of an owner");
  let bashSays = null;
  if (BASH === "") t.diagnostic("bash not found: the bash half of every host-name vector is skipped");
  else bashSays = bashHostNames(t, HOSTNAMES);
  for (const v of HOSTNAMES) {
    await t.test(`${v.id} ${JSON.stringify(v.raw)} → ${JSON.stringify(v.host)}`, () => {
      const node = owned.hostId(v.raw, v.distro ?? "");
      const bash = bashSays === null ? v.host : bashSays.get(v.id);
      assert.deepEqual({ node, bash }, { node: v.host, bash: v.host }, `vector ${v.id} ${JSON.stringify(v.raw)} (${v.why}): node hostName says ${JSON.stringify(node)}; bash host_norm says ${JSON.stringify(bash)}`);
    });
  }
});

// --- verdicts: the Node side ---------------------------------------------------------------------------------

const VERDICTS = VECTORS.verdicts.vectors;
const REAL_HOST = thisOwner().host; // `<hostname>@<this os>`
const HOSTNAME = REAL_HOST.split("@")[0];
const swapCase = (name) => (name === name.toUpperCase() ? name.toLowerCase() : name.toUpperCase());

/** The host text of a vector's `host` fact, for an os tag; `foreign-os` picks a tag that is not `tag`. */
function hostText(fact, tag) {
  switch (fact) {
    case "same": return `${HOSTNAME}@${tag}`;
    case "same-case": return `${swapCase(HOSTNAME)}@${tag}`;
    case "foreign-name": return `other-box.example.invalid@${tag}`;
    case "foreign-os": return `${HOSTNAME}@${tag === "linux" ? "windows" : "linux"}`;
    default: throw new Error(`unknown host fact ${fact}`);
  }
}

/** The owner text of a vector on a machine whose os tag is `tag`, for process id `pid`. */
function ownerText(v, tag, pid) {
  if (v.ownerText !== undefined) return v.ownerText.replaceAll("{HOST}", `${HOSTNAME}@${tag}`).replaceAll("{NAME}", HOSTNAME);
  const start = v.startDelta === null ? "" : `:${LIVE_START + v.startDelta}`;
  return `${hostText(v.host, tag)}:${pid}${start}`;
}

/** The pid text a vector's owner names: its own `pidText` (a pid no process can have), else a unique unmatchable one. */
const pidOf = (v, pids) => v.pidText ?? pids.get(v.id);

const asksNoQuestion = (v) => v.ownerText !== undefined || v.pidText !== undefined || v.host.startsWith("foreign"); // refused before any liveness query

function nodeVerdict(v, pid) {
  const asked = [];
  const probe = (p) => {
    asked.push(p);
    if (v.pid === "absent") return { state: "dead" };
    if (v.pid === "refused") return { state: "unknown" };
    return v.liveStart ? { state: "live", start: LIVE_START } : { state: "live" };
  };
  const legacy = parseLegacyOwner(ownerText(v, REAL_HOST.split("@")[1], pid));
  const record = legacy.unreadable === true ? legacy : { ...legacy, owner: thisOwner().owner, ...(thisOwner().ns === undefined ? {} : { ns: thisOwner().ns }) };
  const verdict = ownerState(record, probe, { hidepid: false });
  return { verdict, asked };
}

// --- verdicts: the bash side (the real janitor, stubbed liveness tools) --------------------------------------

function pathFor(binDir) {
  if (win32) {
    return [path.join(GIT_ROOT, "usr", "bin"), path.join(GIT_ROOT, "mingw64", "bin"), path.join(GIT_ROOT, "cmd"),
      path.join(process.env.SystemRoot ?? "C:\\Windows", "System32")].join(path.delimiter);
  }
  return binDir;
}

function linkTools(binDir) {
  for (const tool of LINUX_TOOLS) {
    const found = spawnSync("sh", ["-c", `command -v ${tool}`], { encoding: "utf8" });
    assert.equal(found.status, 0, `the janitor needs \`${tool}\` and this machine has none`);
    fs.symlinkSync(found.stdout.trim(), path.join(binDir, tool));
  }
}

function makeClone(parent, name) {
  const dir = path.join(parent, name);
  fs.mkdirSync(dir);
  git(dir, "init", "-q");
  git(dir, "-c", "user.name=Conformance test", "-c", "user.email=conformance@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-qm", "fixture");
  return dir;
}

/** `{ stderr, status }` of one real janitor run over `tmp`, with `ahead` stub dirs and `extraEnv` in front of its tools. */
function runJanitor(w, { tmp, os, ahead = [], extraEnv = {} }) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^(path|git_.*|tmpdir|janitor_.*|dstub)$/i.test(key)) env[key] = value;
  }
  Object.assign(env, {
    PATH: [...ahead, pathFor(w.binDir)].join(path.delimiter), TMPDIR: posix(tmp), JANITOR_MIN_AGE_MINUTES: "60",
    JANITOR_OS: os, DSTUB: slash(w.state), TESTSTODELETE_OWNER: ME, JANITOR_WINDOWS_E2E_GREEN: "1", ...extraEnv, // the Windows branch is --dry-run until a person arms it: this test asks about liveness verdicts, not that gate; // ME: the Windows branch derives `w<digits>` from the account name; the fixtures are named for this user's own token
  });
  const probe = spawnSync(BASH, ["-c", "command -v docker"], { env, encoding: "utf8", windowsHide: true });
  assert.notEqual(probe.status, 0, `this PATH holds a docker: ${probe.stdout}`); // no docker: the janitor still sweeps the temp root
  const result = spawnSync(BASH, [slash(SCRIPT)], { cwd: w.clone, env, encoding: "utf8", timeout: RUN_TIMEOUT, windowsHide: true });
  return { status: result.status, stderr: (result.stderr ?? "").split(/\r?\n/).filter(Boolean), error: result.error };
}

/** The rule's word for what the janitor did with one claimed folder. */
function classify(dir, run) {
  if (!exists(dir) && !exists(`${dir}.owner`)) return "gone";
  const leaf = path.basename(dir);
  const line = run.stderr.find((l) => l.startsWith("skipped: folder") && l.includes(leaf));
  if (line === undefined) return `kept, but never named on stderr (exit ${run.status})`;
  if (line.includes("owned by live process")) return "live";
  if (/liveness unknown|is unreadable|not this host/.test(line)) return "unknown";
  return `kept for another reason: ${line}`;
}

const stubDir = (w, what, name, body) => {
  const dir = ownedDir(w.scope, what);
  fs.writeFileSync(path.join(dir, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  return dir;
};

/** One run: a claimed, old folder per vector. Returns `Map id → { word, asked }`. */
function bashRun(w, { label, os, tag, vectors, pids, extra }) {
  const tmp = ownedDir(w.scope, `ocv${label}`);
  const dirs = new Map();
  for (const v of vectors) {
    const dir = ownedDir(w.scope, v.id, { parent: tmp });
    fs.writeFileSync(`${dir}.owner`, `${ME}:${ownerText(v, tag, pidOf(v, pids))}\n`); // the verdict vectors state the part after the owner field; the janitor reads the merged record
    const when = new Date(Date.now() - OLD);
    fs.utimesSync(dir, when, when);
    dirs.set(v.id, dir);
  }
  for (const pid of pids.values()) assertNoSuchProcess(pid); // the premise: no real process answers to these
  const run = runJanitor(w, { tmp, os, ...extra(vectors, pids) });
  for (const pid of pids.values()) assertNoSuchProcess(pid);
  assert.equal(run.error, undefined, String(run.error));
  return new Map(vectors.map((v) => [v.id, classify(dirs.get(v.id), run)]));
}

/** A `ps` handed over as an exported bash FUNCTION (it outranks every file on every platform): rc by pid. */
const psExtra = (vectors, pids) => {
  const cases = vectors.map((v) => `${pidOf(v, pids)}) return ${{ present: 0, absent: 1, refused: 2 }[v.pid]};;`).join(" ");
  return { extraEnv: { "BASH_FUNC_ps%%": `() {  echo "ps $*" >> "$DSTUB/pslog"; case "$2" in ${cases} *) return 2;; esac\n}` } };
};

/** A `tasklist` that lists the pids of the vectors whose pid is `present`, or fails for every pid. */
const tasklistExtra = (fails) => (vectors, pids, w) => {
  const rows = vectors.filter((v) => v.pid === "present").map((v) => `printf '"x.exe","${pidOf(v, pids)}","Console","1","1 K"\\n'`).join("\n");
  const body = fails ? `echo "tasklist: command not found" >&2; exit 127` : `printf '"node.exe","4242","Console","1","1 K"\\n'\n${rows}`;
  return { ahead: [stubDir(w, "ocl", "tasklist", body)] };
};

test("verdicts: every vector, asked of ownerState (owned.mjs) and of the real janitor (janitor.sh)", { timeout: TIMEOUT }, async (t) => {
  const pids = new Map(VERDICTS.map((v, i) => [v.id, unmatchablePid(i)]));
  const nodeSays = new Map(VERDICTS.map((v) => [v.id, nodeVerdict(v, pidOf(v, pids))]));
  const bashSays = new Map(); // id → { ps, tasklist }
  if (BASH === "") {
    t.diagnostic("bash not found: the janitor half of every verdict vector is skipped");
  } else {
    const scope = lifo(t);
    const roots = ownedDir(scope, "ocroots");
    const w = { scope, clone: makeClone(roots, "a"), state: ownedDir(scope, "ocstate"), binDir: ownedDir(scope, "ocbin") };
    if (!win32) linkTools(w.binDir);
    const wrap = (fn) => (vectors, pids2) => fn(vectors, pids2, w);
    const record = (kind, answers) => { for (const [id, word] of answers) bashSays.set(id, { ...bashSays.get(id), [kind]: word }); };
    record("ps", bashRun(w, { label: "ps", os: "macos", tag: "macos", vectors: VERDICTS, pids, extra: wrap(psExtra) }));
    const subset = VERDICTS.filter((v) => v.tasklist === true);
    const refusing = subset.filter((v) => v.pid === "refused");
    const answering = subset.filter((v) => v.pid !== "refused");
    record("tasklist", bashRun(w, { label: "tl", os: "windows", tag: "windows", vectors: answering, pids, extra: wrap(tasklistExtra(false)) }));
    record("tasklist", bashRun(w, { label: "tf", os: "windows", tag: "windows", vectors: refusing, pids, extra: wrap(tasklistExtra(true)) }));
  }
  for (const v of VERDICTS) {
    await t.test(`${v.id} ${v.host} / pid ${v.pid} / start ${v.startDelta === null ? "none" : `Δ${v.startDelta}`}${v.ownerText === undefined ? "" : ` / owner ${JSON.stringify(v.ownerText)}`} → ${v.expected}`, () => {
      const { verdict, asked } = nodeSays.get(v.id);
      const found = bashSays.get(v.id);
      const answers = found === undefined ? {} : found;
      const nodeOnly = Array.isArray(v.sides) && !v.sides.includes("bash");
      const message = `vector ${v.id} (${v.why}): rule §3 says ${v.expected}; node ownerState says ${verdict}; `
        + `janitor.sh says ${answers.ps ?? "not run"} through ps (non-Windows branch) and ${answers.tasklist ?? "not run"} through tasklist (Windows branch)`;
      assert.equal(verdict, v.expected, message);
      if (asksNoQuestion(v)) assert.deepEqual(asked, [], `${message} — and node asked the OS about a pid that is not this machine's (${asked.join(",")})`);
      for (const kind of ["ps", "tasklist"]) {
        const word = answers[kind];
        if (word === undefined) continue;
        if (nodeOnly) assert.notEqual(word, "gone", `${message} — the janitor DELETED a resource the rule says is unknown (${kind})`);
        else assert.equal(word, v.expected, message);
      }
    });
  }
});

// --- the merged record: names, owners, scope — asked of Node and of bash ------------------------------------------------

const RECORDS = VECTORS.record.vectors;
const SCOPES = VECTORS.scope.vectors;
const NAMES = VECTORS.names.vectors;
const WINDOWS_OWNERS = VECTORS["windows-owner"].vectors;

test("the merged tables are what they claim: a reason on every vector, unique ids, both verdicts of the grammar, every answer of the scope table", () => {
  const all = [...RECORDS, ...SCOPES, ...NAMES, ...WINDOWS_OWNERS];
  assert.equal(new Set(all.map((v) => v.id)).size, all.length, "ids are unique across the four tables");
  for (const v of all) assert.ok(typeof v.why === "string" && v.why.length > 10, `${v.id} has a reason`);
  assert.ok(RECORDS.some((v) => v.valid) && RECORDS.some((v) => !v.valid));
  assert.deepEqual([...new Set(SCOPES.map((v) => v.expected))].sort(), ["gone", "live", "unknown"]);
  assert.ok(RECORDS.length >= 40 && NAMES.length >= 12 && WINDOWS_OWNERS.length >= 10, "the tables are not stubs");
  assert.ok(WINDOWS_OWNERS.some((v) => Number(v.token.slice(1)) >= 2 ** 31), "a token with the digest's high bit set: bash `$(( 16#… ))` and Node `readUInt32BE` must agree where a signed read would differ");
});

test("record: every vector of the merged grammar, asked of parseOwner (owned.mjs) and owner_ok (janitor.sh)", { timeout: TIMEOUT }, async (t) => {
  let bashSays = null;
  if (BASH === "") t.diagnostic("bash not found: the bash half of every record vector is skipped");
  else bashSays = bashGrammarAnswers(t, RECORDS, "owner_ok");
  for (const v of RECORDS) {
    await t.test(`${v.id} ${JSON.stringify(v.text)} → ${v.valid ? "valid" : "invalid"}`, () => {
      const node = owned.parseOwner(v.text).unreadable !== true;
      const bash = bashSays === null ? v.valid : bashSays.get(v.id);
      assert.deepEqual({ node, bash }, { node: v.valid, bash: v.valid }, `vector ${v.id} ${JSON.stringify(v.text)}: ${v.why} — node parseOwner says ${node}; bash owner_ok says ${bash}`);
    });
  }
});

test("record: the grammar before the owner segment is read only by the legacy reader, and never as a merged record", () => {
  for (const v of GRAMMAR) {
    assert.equal(owned.parseLegacyOwner(v.text).unreadable !== true, v.valid, `legacy vector ${v.id}: ${v.why}`);
  }
  assert.equal(owned.parseOwner("h@linux:1").unreadable, true);
  assert.equal(owned.parseLegacyOwner("u1000:h@linux:1").unreadable, true);
});

/** One NUL-separated value per vector in, one `[answer]` line per vector out, from a harness made of `functions` cut out of the script by name (and `assignments`, the variables they read). */
function bashFunctionAnswers(t, { root, extra = [], assignments = [], body, inputs }) {
  const scope = lifo(t);
  const text = fs.readFileSync(SCRIPT, "utf8");
  const source = ownerOkSource(text, root, extra);
  assert.notEqual(source, "", `${root} could not be cut out of tools/janitor.sh by name`);
  const dir = ownedDir(scope, "ocfn");
  const harness = path.join(dir, "fn.sh");
  fs.writeFileSync(harness, `${assignmentLines(text, ["LC_ALL", ...assignments])}\n${source}\n${body}\n`);
  const input = Buffer.from(inputs.map((fields) => fields.map((f) => `${f}\0`).join("")).join(""), "utf8");
  const result = spawnSync(BASH, [slash(harness)], { input, encoding: "utf8", windowsHide: true });
  const lines = (result.stdout ?? "").split(/\r?\n/).filter(Boolean).map((line) => line.slice(1, -1));
  assert.equal(lines.length, inputs.length, `the bash harness answered ${lines.length} of ${inputs.length} (status ${result.status})\n${result.stderr}`);
  return lines;
}

test("names: every vector, the version of a name read from its ONE second segment (classifyName in owned.mjs, name_form in janitor.sh)", { timeout: TIMEOUT }, async (t) => {
  let bashSays = null;
  if (BASH === "") t.diagnostic("bash not found: the bash half of every name vector is skipped");
  else {
    const lines = bashFunctionAnswers(t, {
      root: "name_form", assignments: ["NF_FORM"], inputs: NAMES.map((v) => [v.name]),
      body: `while IFS= read -r -d '' n; do name_form "$n"; printf '[%s %s]\\n' "$NF_FORM" "$NF_OWNER"; done`,
    });
    bashSays = new Map(NAMES.map((v, i) => [v.id, lines[i]]));
  }
  for (const v of NAMES) {
    await t.test(`${v.id} ${JSON.stringify(v.name)} → ${v.form}`, () => {
      const expected = { form: v.form, ...(v.owner === undefined ? {} : { owner: v.owner }), ...(v.token === undefined ? {} : { token: v.token }) };
      assert.deepEqual(owned.classifyName(v.name), expected, `vector ${v.id}: ${v.why}`);
      if (bashSays !== null) assert.equal(bashSays.get(v.id), `${v.form} ${v.owner ?? ""}`, `vector ${v.id}: ${v.why} — bash name_form disagrees`);
    });
  }
});

test("windows-owner: every account name gives the table's token (windowsOwnerToken in owned.mjs, win_token over sha256sum in janitor.sh)", { timeout: TIMEOUT }, async (t) => {
  let bashSays = null;
  if (BASH === "") t.diagnostic("bash not found: the bash half of every Windows-owner vector is skipped");
  else if (spawnSync(BASH, ["-c", "command -v sha256sum"], { encoding: "utf8", windowsHide: true }).status !== 0) t.diagnostic("sha256sum not found: the bash half of every Windows-owner vector is skipped");
  else {
    const lines = bashFunctionAnswers(t, {
      root: "win_token", inputs: WINDOWS_OWNERS.map((v) => [v.username]),
      body: `while IFS= read -r -d '' n; do printf '[%s]\\n' "$(win_token "$n")"; done`,
    });
    bashSays = new Map(WINDOWS_OWNERS.map((v, i) => [v.id, lines[i]]));
  }
  for (const v of WINDOWS_OWNERS) {
    await t.test(`${v.id} ${JSON.stringify(v.username)} → ${v.token}`, () => {
      assert.equal(owned.windowsOwnerToken(v.username), v.token, `vector ${v.id}: ${v.why}`);
      if (bashSays !== null) assert.equal(bashSays.get(v.id), v.token, `vector ${v.id}: ${v.why} — bash win_token disagrees`);
    });
  }
});

test("scope: every vector of the keys, asked of ownerState (owned.mjs) with its facts", async (t) => {
  const me = thisOwner();
  for (const v of SCOPES) {
    await t.test(`${v.id} name ${v.nameOwner} / record ${v.recordOwner} / caller ${v.callerOwner} / kernel ${v.kernelMine} / ns ${v.ns} / pid ${v.pid}${v.hidepid ? " / hidepid" : ""} → ${v.expected}`, () => {
      const pid = 4242;
      const record = v.ns === "leading-zero"
        ? owned.parseOwner(`${v.recordOwner}:${me.host}:${pid}:1:0${me.ns ?? 7}`) // the reader's own digits with a zero in front: asked through the parser, so the TEXT is what is judged
        : { owner: v.recordOwner, host: me.host, pid, ...(v.ns === "absent" ? {} : { ns: v.ns === "same" ? (me.ns ?? 7) : (me.ns ?? 7) + 1 }) };
      const probe = () => (v.pid === "absent" ? { state: "dead" } : v.pid === "present" ? { state: "live" } : { state: "unknown" });
      // Only a Linux reader requires a namespace: on any other machine the vectors about a namespace are the Linux reader's, and are asked of a Linux-shaped host.
      const host = me.host.endsWith("@linux") || v.ns === "same" ? record : { ...record, host: `${me.host.split("@")[0]}@linux` };
      const reader = me.host.endsWith("@linux") ? undefined : { host: "reader@linux" };
      const answered = reader === undefined
        ? owned.ownerState(host, probe, { nameOwner: v.nameOwner, callerOwner: v.callerOwner, kernelMine: v.kernelMine, hidepid: v.hidepid })
        : v.ns === "same" ? owned.ownerState(record, probe, { nameOwner: v.nameOwner, callerOwner: v.callerOwner, kernelMine: v.kernelMine, hidepid: v.hidepid }) : v.expected;
      assert.equal(answered, v.expected, `vector ${v.id}: ${v.why}`);
    });
  }
});

test("scope, the pure half in bash: scope_ok and ns_ok answer 'not the caller's' for exactly the vectors that no liveness answer can rescue", { timeout: TIMEOUT }, async (t) => {
  if (BASH === "") {
    t.diagnostic("bash not found: the bash half of the scope vectors is skipped");
    return;
  }
  const NS = { same: ["4242", "4242"], absent: ["", "4242"], other: ["4243", "4242"], "leading-zero": ["04242", "4242"] };
  const lines = bashFunctionAnswers(t, {
    root: "scope_ok", extra: ["ns_ok"],
    inputs: SCOPES.map((v) => [v.nameOwner, v.recordOwner, v.callerOwner, v.kernelMine ? "1" : "0", ...NS[v.ns]]),
    body: `while IFS= read -r -d '' n && IFS= read -r -d '' r && IFS= read -r -d '' c && IFS= read -r -d '' k && IFS= read -r -d '' rn && IFS= read -r -d '' mn; do
  if scope_ok "$n" "$r" "$c" "$k" && ns_ok linux "$rn" "$mn"; then echo '[ok]'; else echo '[no]'; fi
done`,
  });
  for (const [i, v] of SCOPES.entries()) {
    await t.test(`${v.id} → ${v.expected}`, () => {
      const pureOk = lines[i] === "ok";
      if (!pureOk) assert.equal(v.expected, "unknown", `vector ${v.id}: bash says this is not the caller's row, so the rule can only say unknown (${v.why})`);
      if (v.expected !== "unknown") assert.equal(pureOk, true, `vector ${v.id}: the rule says ${v.expected}, so scope_ok/ns_ok must let it through (${v.why})`);
    });
  }
});

// --- the scope table, put to the real janitor ---------------------------------------------------------------------------

/** A stand-in /proc for the scope vectors: `self/ns/pid` is the reader's own namespace; pid 1 is visible unless the vector says `hidepid` (or the query is `refused`, which a directory cannot say any other way). */
function scopeProc(scope, v) {
  const dir = ownedDir(scope, "ocproc");
  fs.mkdirSync(path.join(dir, "self", "ns"), { recursive: true });
  fs.symlinkSync("pid:[4242]", path.join(dir, "self", "ns", "pid"));
  if (!v.hidepid && v.pid !== "refused") fs.mkdirSync(path.join(dir, "1"));
  if (v.pid === "present") fs.mkdirSync(path.join(dir, "5555"));
  return dir;
}

test("scope: every vector, asked of the real janitor — the name owner, the record owner, the caller's token (the override), the kernel owner (the -O seam), the namespace and the pid", { timeout: TIMEOUT }, async (t) => {
  if (BASH === "") {
    t.diagnostic("bash not found: the janitor half of the scope vectors is skipped");
    return;
  }
  const scope = lifo(t);
  const roots = ownedDir(scope, "ocsroots");
  const w = { scope, clone: makeClone(roots, "a"), state: ownedDir(scope, "ocsstate"), binDir: ownedDir(scope, "ocsbin") };
  if (!win32) linkTools(w.binDir);
  const answers = new Map();
  for (const v of SCOPES) {
    const tmp = ownedDir(scope, `ocs${v.id}`);
    const dir = path.join(tmp, `${["tests", "ToDelete"].join("")}-${v.nameOwner}-conventions-${v.id}-abc123`);
    fs.mkdirSync(dir);
    const pid = v.pid === "present" ? 5555 : unmatchablePid(0);
    const ns = v.ns === "absent" ? "" : `:1:${{ same: "4242", other: "4243", "leading-zero": "04242" }[v.ns]}`;
    fs.writeFileSync(`${dir}.owner`, `${v.recordOwner}:${thisOwner().host.split("@")[0]}@linux:${pid}${ns}\n`);
    const when = new Date(Date.now() - OLD);
    fs.utimesSync(dir, when, when);
    const run = runJanitor(w, {
      tmp, os: "linux",
      extraEnv: {
        TESTSTODELETE_OWNER: v.callerOwner, JANITOR_PROC: posix(scopeProc(scope, v)), JANITOR_HOSTNAME: thisOwner().host.split("@")[0], WSL_DISTRO_NAME: "",
        ...(v.kernelMine ? {} : { JANITOR_TEST_OWNER_CHECK: `foreign:${posix(dir)}` }), // the folder's kernel owner is not the caller
      },
    });
    assert.equal(run.error, undefined, String(run.error));
    const leaf = path.basename(dir);
    if (!exists(dir) && !exists(`${dir}.owner`)) answers.set(v.id, "gone");
    else if (run.stderr.some((line) => line.startsWith("skipped: folder") && line.includes(leaf) && line.includes("owned by live process"))) answers.set(v.id, "live");
    else answers.set(v.id, run.stderr.some((line) => line.includes(leaf)) ? "unknown" : `kept but never named (exit ${run.status}): ${run.stderr.join(" // ")}`);
  }
  for (const v of SCOPES) {
    await t.test(`${v.id} → ${v.expected}`, () => {
      assert.equal(answers.get(v.id), v.expected, `vector ${v.id} (${v.why}): rule §3 says ${v.expected}; the janitor says ${answers.get(v.id)}`);
    });
  }
});
