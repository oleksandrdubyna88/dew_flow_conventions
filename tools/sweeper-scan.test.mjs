#!/usr/bin/env node
/**
 * `lib/sweeper-scan.mjs`'s classifier (`classifyLine`) — S5a of the merged-core plan — and, in later stories, the
 * scan itself (`scanSweepers`) and its command line.
 *
 * Every line below that spells a sweeping pattern is BUILT from two pieces (`P` and `Q`), so this file holds no
 * line that the classifier it tests would call broad: the repository's own scan reads this file too.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { broadLines, classifyLine } from "./lib/sweeper-scan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const P = "teststo" + "delete"; // the prefix, lower case
const Q = "testsTo" + "Delete"; // the prefix, as the rule writes it

test("S5a 1 the three lines of the rule text on main at 2c96f83 are owner-blind", () => {
  // the fixture holds the prefix as @@PFX@@, so this repository's own scan does not read the old text as a sweeper
  const old = fs.readFileSync(path.join(here, "fixtures", "sweeper-scan", "rule-2c96f83.md"), "utf8").replaceAll("@@PFX@@", P);
  const lines = broadLines(old);
  assert.equal(lines.length, 3, `the old text has three broad lines, got ${JSON.stringify(lines)}`);
  assert.deepEqual(lines, [20, 35, 129]);
});

test("S5a 2 a prefix with nothing after it is broad, in a regex, a glob, a path and a filter", () => {
  const broad = [
    `grep -i '^${P}-'`,
    `grep -i '^${P}[-_]'`,
    `grep -iE "^(${P})[-_]x"`,
    `find "$T" -iname '${Q}-*'`,
    `Get-ChildItem $env:TEMP -Filter '${Q}-*'`,
    `Where-Object Name -like '${Q}*'`,
    `ls /tmp/${Q}-*`,
    `docker ps --filter name=${P}-`,
    `docker ps -a --filter "name=${Q}" --format '{{.Names}}'`,
    `docker volume ls --filter=name=${P}_`,
    `git for-each-ref refs/heads | grep -i '/${Q}-[^/]*$'`,
    `name.startsWith("${Q}-")`,
    `GLOB='${P}[-_]*'`,
    `find /tmp -regex '.*${P}-.*'`,
  ];
  for (const line of broad) assert.equal(classifyLine(line), "broad", line);
});

test("S5a 3 a prefix followed by an owner segment is owner-aware, not broad", () => {
  const aware = [
    `grep -i '^${P}[-_]u1000[-_]'`,
    `grep -iE "^${P}[-_]\${OWNER}[-_]"`,
    `grep -i '^${P}[-_]<owner>[-_]x'`,
    `grep -iE '^${P}[-_]u[0-9]+[-_]'`,
    `grep -iE '^${P}[-_](u|w)[0-9]{1,10}[-_]'`,
    `docker ps --filter "name=^${Q}-w42-api-"`,
    `new RegExp(\`^${P}[-_]\${owner}[-_]\`, "i")`,
  ];
  for (const line of aware) assert.equal(classifyLine(line), "owner-aware", line);
});

test("S5a 4 a literal first segment that cannot be an owner is narrow: it reaches only legacy names", () => {
  for (const line of [`grep -i '^${P}-conventions-'`, `grep -i '^${P}[-_]conventions[-_]'`, `grep -i '/${Q}-wt-gate'`]) {
    assert.equal(classifyLine(line), null, line);
  }
});

test("S5a 5 a bare u or w after the prefix reaches every owner: broad", () => {
  for (const line of [`grep -i '^${P}-w.*'`, `grep -i '^${P}-u'`, `grep -i '^${P}-u.*'`]) {
    assert.equal(classifyLine(line), "broad", line);
  }
});

test("S5a 6 a line holding one owner-aware and one broad pattern is broad", () => {
  assert.equal(classifyLine(`a=^${P}-u1000-; b=^${P}-`), "broad");
});

test("S5a 7 a line that is not a pattern is nothing: a name, a sentence, a folder named like the prefix", () => {
  for (const line of [
    `created ${Q}-u1000-api-pg-k3f9a1 for the run`,
    `the prefix ${Q} is a promise`,
    `cd /srv/${Q}`,
    `const MARKER = /(?:\/\*|\*|<!--)\s*${Q}-exempt:(.*)$/;`,
    "no prefix here at all",
    "",
  ]) assert.equal(classifyLine(line), null, line);
});

test("S5a 8 the not-a-sweeper marker never clears a line unless the caller says it honours one", () => {
  const line = `xargs rm -rf '^${P}-' # not-a-sweeper`;
  assert.equal(classifyLine(line), "broad", "the guard's reading has no comment exemption");
  assert.equal(classifyLine(line, { honourMarker: true }), null, "the scan of a sibling's files during the transition");
});

test("S5a 9 upper and lower case are read alike", () => {
  assert.equal(classifyLine(`grep -i '^${Q.toUpperCase()}-'`), "broad");
  assert.equal(classifyLine(`grep -i '^${P}-U1000-'`), "owner-aware");
});

test("S5a 10 the classifier's own module and this test spell no broad line", () => {
  for (const file of ["lib/sweeper-scan.mjs", "sweeper-scan.test.mjs"]) {
    const text = fs.readFileSync(path.join(here, file), "utf8");
    assert.deepEqual(broadLines(text), [], `${file} must not hold a line its own classifier calls broad`);
  }
});

// --- S5b: the scan ---------------------------------------------------------------------------------------------------

import { spawnSync } from "node:child_process";
import { ownedDir, cleanupScope } from "./lib/owned.mjs";
import { git } from "./lib/git.mjs";
import { scanSweepers, parseCsv } from "./lib/sweeper-scan.mjs";
import { main } from "./sweeper-scan.mjs";

function lifoScope(t) {
  const scope = cleanupScope();
  t.after(() => scope.close());
  return scope;
}

/** A checkout holding `files` (path → text) in an owned folder. */
function checkout(t, files) {
  const dir = ownedDir(lifoScope(t), "scan checkout");
  git(dir, "init", "-q");
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), text);
  }
  return dir;
}

const NO_CRONTAB = () => ({ status: 1, stdout: "", stderr: "no crontab for somebody", error: undefined });
const reply = (stdout) => ({ status: 0, stdout, stderr: "", error: undefined });
const failed = (stderr = "denied") => ({ status: 1, stdout: "", stderr, error: undefined });

function realRun(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error };
}

/** `answers(command, args)` for everything but git, which is real. */
const withGit = (answers) => (command, args) => (command === "git" ? realRun(command, args) : answers(command, args));

function runScan(argv, deps = {}) {
  const out = [];
  const err = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => err.push(line) }, { run: withGit(NO_CRONTAB), home: path.join(here, "no-such-home"), platform: "linux", ...deps });
  return { code, out: out.join("\n"), err: err.join("\n") };
}

const BLIND = `docker ps -a | grep -i '^${P}-' | xargs -r docker rm -f`;
const ALLOWLIST_TEXT = () => fs.readFileSync(path.join(here, "fixtures", "owner-blind-allowlist.json"), "utf8");

test("S5b 1 the proposed rule texts yield no owner-blind line, and this repository is clean", () => {
  const dir = path.join(here, "..");
  assert.deepEqual(broadLines(fs.readFileSync(path.join(dir, "common", "test-leftovers.md"), "utf8")), []);
  assert.deepEqual(broadLines(fs.readFileSync(path.join(dir, "common", "test-leftovers-janitor.md"), "utf8")), []);
  const result = runScan(["--root", dir]);
  assert.equal(result.code, 0, `${result.out}\n${result.err}`);
});

test("S5b 2 an owner-blind sweeper in a checkout is exit 1 and named by file and line; a clean checkout is exit 0", (t) => {
  const found = runScan(["--root", checkout(t, { "ops/clean.sh": "echo hello\n", "ops/sweep.sh": `#!/bin/sh\n${BLIND}\n` })]);
  assert.equal(found.code, 1, found.err);
  assert.match(found.out, /sweep\.sh:2 — owner-blind/);
  const clean = runScan(["--root", checkout(t, { "ops/clean.sh": "echo hello\n" })]);
  assert.equal(clean.code, 0, clean.err);
});

test("S5b 3 prose is not a sweeper, a rule-text copy is", (t) => {
  assert.equal(runScan(["--root", checkout(t, { "docs/notes.md": `${BLIND}\n`, "x.sh": "echo\n" })]).code, 0, "a Markdown file of notes is prose");
  assert.equal(runScan(["--root", checkout(t, { "vendor/test-leftovers.md": `${BLIND}\n`, "x.sh": "echo\n" })]).code, 1, "a copy of the rule text is read");
});

test("S5b 4 the not-a-sweeper marker passes a line only with --honour-marker", (t) => {
  const dir = checkout(t, { "tools/detect.sh": `${BLIND} # not-a-sweeper\n` });
  assert.equal(runScan(["--root", dir]).code, 1, "no comment clears a line by default");
  assert.equal(runScan(["--root", dir, "--honour-marker"]).code, 0, "the transition for the sibling's own detector lines");
});

test("S5b 5 the allowlist passes the janitor's line by file, line and hash — and nothing else", (t) => {
  const script = fs.readFileSync(path.join(here, "janitor.sh"), "utf8");
  assert.equal(runScan(["--root", checkout(t, { "tools/janitor.sh": script, "tools/fixtures/owner-blind-allowlist.json": ALLOWLIST_TEXT() })]).code, 0);
  assert.equal(runScan(["--root", checkout(t, { "other/janitor.sh": script, "tools/fixtures/owner-blind-allowlist.json": ALLOWLIST_TEXT() })]).code, 1, "the same text in another file");
});

test("S5b 6 unreadable evidence in the requested scope is exit 2, and the findings are still printed", (t) => {
  const dirty = checkout(t, { "ops/sweep.sh": `${BLIND}\n` });
  const crontab = runScan(["--root", dirty], { run: withGit((command) => (command === "crontab" ? failed("permission denied") : failed())) });
  assert.equal(crontab.code, 2, crontab.err);
  assert.match(crontab.err, /unreadable: crontab -l/);
  assert.match(crontab.out, /sweep\.sh:1 — owner-blind/, "what was found is not hidden by what was not read");
  const noGit = runScan(["--root", dirty], { run: (command) => (command === "git" ? failed("fatal") : NO_CRONTAB()) });
  assert.equal(noGit.code, 2, "a checkout whose files cannot be listed");
  assert.equal(runScan(["--root", ownedDir(lifoScope(t), "scan nothing")]).code, 2, "no checkout under the root: scanned nothing is not a clean machine");
});

test("S5b 7 --system reads /etc-style job files and every home; the user scope does not", (t) => {
  const host = ownedDir(lifoScope(t), "scan host");
  fs.mkdirSync(path.join(host, "etc", "cron.d"), { recursive: true });
  fs.writeFileSync(path.join(host, "etc", "cron.d", "sweeps"), `*/5 * * * * root ${BLIND}\n`);
  fs.mkdirSync(path.join(host, "home", "alice", ".config", "systemd", "user"), { recursive: true });
  fs.writeFileSync(path.join(host, "home", "alice", ".config", "systemd", "user", "sweep.service"), `[Service]\nExecStart=/bin/sh -c "${BLIND}"\n`);
  const dir = checkout(t, { "x.sh": "echo\n" });
  const user = runScan(["--root", dir], { hostRoot: host, platform: "linux" });
  assert.equal(user.code, 0, `the user scope does not read /etc or other homes: ${user.out}\n${user.err}`);
  const system = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(system.code, 1);
  assert.match(system.out, /sweeps:1 — owner-blind/);
  assert.match(system.out, /sweep\.service:2 — owner-blind/);
});

test("S5b 8 a scheduled job that calls a janitor or a sweep by name is a finding; a comment is not a job", (t) => {
  const host = ownedDir(lifoScope(t), "scan jobs");
  fs.mkdirSync(path.join(host, "etc"), { recursive: true });
  const janitor = path.join(host, "opt", "rules", "tools", "janitor.sh");
  fs.mkdirSync(path.dirname(janitor), { recursive: true });
  fs.writeFileSync(janitor, "#!/bin/sh\necho a janitor\n");
  fs.writeFileSync(path.join(host, "etc", "crontab"), `# bash ${janitor} in a comment\n0 3 * * * u bash "${janitor}"\n`);
  const result = runScan(["--root", checkout(t, { "x.sh": "echo\n" }), "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(result.code, 1);
  assert.match(result.out, /crontab:2 — calls-a-sweep/);
  assert.doesNotMatch(result.out, /crontab:1/);
});

test("S5b 9 Windows: the Task Scheduler is read directly; a failing schtasks falls back to PowerShell; both failing is exit 2", (t) => {
  const dir = checkout(t, { "x.sh": "echo\n" });
  const janitor = path.join(ownedDir(lifoScope(t), "scan tasks"), "janitor.sh");
  fs.writeFileSync(janitor, "#!/bin/sh\necho a janitor\n");
  const csv = `"HostName","TaskName","Task To Run"\r\n"BOX","\\Nightly","bash.exe ""${janitor}"" --dry-run"\r\n"BOX","\\Other","cmd.exe /c echo"\r\n`;
  const found = runScan(["--root", dir], { run: withGit((command) => (command === "schtasks" ? reply(csv) : failed())), platform: "win32" });
  assert.equal(found.code, 1, found.err);
  assert.match(found.out, /scheduled task \\Nightly:1 — calls-a-sweep/);
  const fallback = runScan(["--root", dir], { run: withGit((command) => (command === "schtasks" ? failed("ERROR") : reply(`Nightly\tbash.exe "${janitor}"\n`))), platform: "win32" });
  assert.equal(fallback.code, 1, "the PowerShell fallback is read");
  const closed = runScan(["--root", dir], { run: withGit(() => failed()), platform: "win32" });
  assert.equal(closed.code, 2, "an unqueryable Task Scheduler is unreadable evidence");
  assert.match(closed.err, /Task Scheduler/);
  const missing = runScan(["--root", dir], { run: withGit(() => ({ status: null, stdout: "", stderr: "", error: Object.assign(new Error("spawn"), { code: "ENOENT" }) })), platform: "win32" });
  assert.equal(missing.code, 2, "no schtasks and no PowerShell");
});

test("S5b 10 parseCsv keeps a quoted comma and a doubled quote in its cell", () => {
  assert.deepEqual(parseCsv('"a","b,c","d ""q"""\r\n"x","y","z"\r\n'), [["a", "b,c", 'd "q"'], ["x", "y", "z"]]);
});

test("S5b 11 the scan never deletes: the checkout is the same afterwards", (t) => {
  const dir = checkout(t, { "ops/sweep.sh": `${BLIND}\n`, "ops/other.txt": "x\n" });
  const snapshot = () => fs.readdirSync(dir, { recursive: true }).sort().map((name) => [name, fs.statSync(path.join(dir, name)).isFile() ? fs.readFileSync(path.join(dir, name), "utf8") : ""]);
  const before = snapshot();
  runScan(["--root", dir]);
  assert.deepEqual(snapshot(), before);
});

test("S5b 12 a bad argument is exit 2 with the usage line, and scanSweepers is exported for the guard's tests", () => {
  const result = runScan(["--bogus"]);
  assert.equal(result.code, 2);
  assert.match(result.err, /usage: node tools\/sweeper-scan\.mjs/);
  assert.equal(typeof scanSweepers, "function");
});

// --- review round: unanchored sweepers, and the scripts a job runs ----------------------------------------------------

test("R3 unanchored sweepers: a prefix with no owner after it, beside a deletion verb or as the argument of a matcher, is broad", () => {
  const W = P; // the prefix in lower case; the upper-case spelling is Q
  const broad = [
    `ls /tmp | grep ${Q} | xargs rm -rf`,
    `docker ps -a --format '{{.Names}}' | grep ${Q} | xargs docker rm -f`,
    `/${Q}-/i.test(n)`,
    `if (n.includes("${Q}-")) fs.rmSync(n, { recursive: true })`,
    `n.includes("${Q}-")`,
    `if re.match(r"${Q}-", n): shutil.rmtree(n)`,
    `re.match(r"${Q}-", n)`,
    `Get-ChildItem $env:TEMP | Where-Object { $_.Name -match '${Q}' } | Remove-Item -Recurse -Force`,
    `$_.Name -match '${Q}'`,
    `if name.startswith("${Q}"): os.remove(name)`,
    `name.startswith("${Q}")`,
    `find /tmp -maxdepth 1 -name '*${W}*' -delete`,
    `rm -rf /tmp/${W}*`,
    `grep -i ${W} list.txt`,
  ];
  for (const line of broad) assert.equal(classifyLine(line), "broad", line);
  const fine = [
    `grep ${Q}-u1000- list.txt`,
    `ls /tmp | grep '${Q}-u1000-' | xargs rm -rf`,
    `n.includes("${Q}-u1000-")`,
    `rm -rf "/tmp/${Q}-u1000-api-x-abc123"`,
    `echo "the prefix ${Q} is a promise" # rm is not run`,
    `const PREFIX = "${Q}-";`,
    `docker rm -f ${Q}-u1000-api-pg-k3f9a1`,
    `grep ${Q}-conventions- legacy.txt`,
  ];
  for (const line of fine) assert.notEqual(classifyLine(line), "broad", line);
});

test("R4a a home folder that cannot be listed is unreadable evidence; only a missing one is nothing", (t) => {
  const host = ownedDir(lifoScope(t), "scan homes");
  const dir = checkout(t, { "x.sh": "echo\n" });
  const unreadableHome = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux", readDir: (target) => { if (target.endsWith("home")) throw Object.assign(new Error("denied"), { code: "EACCES" }); return fs.readdirSync(target, { withFileTypes: true }); } });
  assert.equal(unreadableHome.code, 2, unreadableHome.err);
  assert.match(unreadableHome.err, /unreadable: .*home — EACCES/);
  const noHomes = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(noHomes.code, 0, `no /home at all is nothing to read: ${noHomes.out}\n${noHomes.err}`);
});

test("R4b a cron line's script is READ and classified; a missing script is unreadable, never clean", (t) => {
  const host = ownedDir(lifoScope(t), "scan scripts");
  const home = path.join(host, "home", "alice");
  fs.mkdirSync(path.join(home, "bin"), { recursive: true });
  fs.writeFileSync(path.join(home, "bin", "clean-tmp.sh"), `#!/bin/sh\nrm -rf /tmp/${P}*\n`);
  const crontab = (text) => ({ run: withGit((command) => (command === "crontab" ? reply(text) : failed())), home, hostRoot: host, platform: "linux" });
  const dir = checkout(t, { "x.sh": "echo\n" });
  const found = runScan(["--root", dir], crontab("@hourly ~/bin/clean-tmp.sh\n"));
  assert.equal(found.code, 1, `${found.out}\n${found.err}`);
  assert.match(found.out, /clean-tmp\.sh:2 — owner-blind/);
  const missing = runScan(["--root", dir], crontab("@hourly ~/bin/gone.sh\n"));
  assert.equal(missing.code, 2, missing.err);
  assert.match(missing.err, /unreadable: crontab -l: .*gone\.sh — script not found/);
  const relative = runScan(["--root", dir], crontab("0 3 * * * cd /srv && ./sweep.sh\n"));
  assert.equal(relative.code, 2, "a relative script cannot be resolved: unreadable");
  const interpreter = runScan(["--root", dir], crontab(`30 2 * * * bash "${path.join(home, "bin", "clean-tmp.sh")}" --quiet\n`));
  assert.equal(interpreter.code, 1, "the script an interpreter runs");
  const harmless = runScan(["--root", dir], crontab("MAILTO=me\n0 3 * * * /usr/bin/env true\n# @hourly ~/bin/gone.sh\n"));
  assert.equal(harmless.code, 0, `${harmless.out}\n${harmless.err}`);
});

test("R4c systemd ExecStart= and drop-in *.conf files, and Windows task actions (quoted, with %VAR%), are followed to their script", (t) => {
  const host = ownedDir(lifoScope(t), "scan units");
  const sweep = path.join(host, "opt", "sweep.sh");
  fs.mkdirSync(path.dirname(sweep), { recursive: true });
  fs.writeFileSync(sweep, `#!/bin/sh\nfind /tmp -name '${Q}-*' -delete\n`);
  const unitDir = path.join(host, "etc", "systemd", "system");
  fs.mkdirSync(path.join(unitDir, "tidy.service.d"), { recursive: true });
  fs.writeFileSync(path.join(unitDir, "tidy.service"), "[Service]\nExecStart=/usr/bin/true\n");
  fs.writeFileSync(path.join(unitDir, "tidy.service.d", "override.conf"), `[Service]\nExecStartPre=-"${sweep}" now\n`);
  const dir = checkout(t, { "x.sh": "echo\n" });
  const system = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(system.code, 1, `${system.out}\n${system.err}`);
  assert.match(system.out, /sweep\.sh:2 — owner-blind/);
  fs.writeFileSync(path.join(unitDir, "tidy.service.d", "override.conf"), "[Service]\nExecStart=\nExecStart=/opt/missing/run.sh\n");
  const missing = runScan(["--root", dir, "--system"], { hostRoot: host, platform: "linux" });
  assert.equal(missing.code, 2);
  assert.match(missing.err, /run\.sh — script not found/);
  const script = path.join(host, "scripts", "my sweep.ps1");
  fs.mkdirSync(path.dirname(script), { recursive: true });
  fs.writeFileSync(script, `Get-ChildItem $env:TEMP | Where-Object { $_.Name -match '${Q}' } | Remove-Item -Recurse -Force\n`);
  const csv = `"HostName","TaskName","Task To Run"\r\n"BOX","\\Tidy","powershell.exe -File ""%SWEEPHOME%\\my sweep.ps1"""\r\n`;
  const previous = process.env.SWEEPHOME;
  process.env.SWEEPHOME = path.dirname(script);
  t.after(() => { if (previous === undefined) delete process.env.SWEEPHOME; else process.env.SWEEPHOME = previous; });
  const task = runScan(["--root", dir], { run: withGit((command) => (command === "schtasks" ? reply(csv) : failed())), platform: "win32" });
  assert.equal(task.code, 1, `${task.out}\n${task.err}`);
  assert.match(task.out, /my sweep\.ps1:1 — owner-blind/);
});

// Security pass (PR #82, M-2): the machine scan reads only the allowlist shipped beside the tool, pinned to the janitor's file ---------

const SWEEP_LINE = `find "\${TMPDIR:-/tmp}" -maxdepth 1 -name '${Q}-*' -mmin +60 -exec rm -rf {} +`;
const ownAllowlist = () => JSON.stringify({ entries: [{ file: "scripts/sweep.sh", line: 2, sha256: createHash("sha256").update(SWEEP_LINE, "utf8").digest("hex") }] });

test("M-2. a checkout's own allowlist never silences its sweeper — with --root <checkout> and with --root <parent>", (t) => {
  const consumerFiles = { "scripts/sweep.sh": `#!/usr/bin/env bash\n${SWEEP_LINE}\n`, "tools/fixtures/owner-blind-allowlist.json": ownAllowlist() };
  const direct = runScan(["--root", checkout(t, consumerFiles)]);
  assert.equal(direct.code, 1, `${direct.out}\n${direct.err}`);
  assert.match(direct.out, /sweep\.sh:2 — owner-blind/, "--root <consumer>: the consumer's own entry did not clear its sweeper");
  const parent = ownedDir(lifoScope(t), "scan parent");
  const inner = path.join(parent, "consumer");
  fs.mkdirSync(inner);
  git(inner, "init", "-q");
  for (const [name, text] of Object.entries(consumerFiles)) {
    fs.mkdirSync(path.dirname(path.join(inner, name)), { recursive: true });
    fs.writeFileSync(path.join(inner, name), text);
  }
  const above = runScan(["--root", parent]);
  assert.equal(above.code, 1, `${above.out}\n${above.err}`);
  assert.match(above.out, /sweep\.sh:2 — owner-blind/, "--root <parent>: found too");
});

test("M-2. an entry is read only when it names tools/janitor.sh: the shipped file's entry does not clear the same text elsewhere or under another name", (t) => {
  const script = fs.readFileSync(path.join(here, "janitor.sh"), "utf8");
  assert.equal(runScan(["--root", checkout(t, { "tools/janitor.sh": script })]).code, 0, "the shipped janitor, with no allowlist of its own in the tree");
  assert.equal(runScan(["--root", checkout(t, { "tools/janitor.sh": script, "tools/fixtures/owner-blind-allowlist.json": JSON.stringify({ entries: [] }) })]).code, 0, "an empty allowlist in the tree removes nothing");
  assert.equal(runScan(["--root", checkout(t, { "scripts/janitor.sh": script })]).code, 1, "the janitor text under another path");
});
