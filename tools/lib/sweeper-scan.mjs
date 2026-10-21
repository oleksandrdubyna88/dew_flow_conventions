// The sweeper classifier of `common/test-leftovers.md` §7 (class `owner-blind`) and of the barrier: "is this line a
// pattern that sweeps the prefix, and does it say WHOSE leftovers it means?"
//
// ONE implementation. The structural guard (`tools/leftovers-check.mjs`), the machine scan (`tools/sweeper-scan.mjs`) and
// the rule-text checks all read lines through `classifyLine`; a second copy of these shapes is how one reader comes to
// call a line safe that another calls a sweep.
//
// What a verdict means.
//   'broad'        a sweep pattern that matches the prefix and no owner segment (or a bare `u` / `w`, which reaches every
//                  owner): on a machine several OS users share it deletes another user's live resources.
//   'owner-aware'  a sweep pattern whose owner segment starts right after the prefix's separator: a literal owner, a
//                  variable, a placeholder, or an owner grammar.
//   null           not a sweep pattern: a name, a sentence, a folder merely named like the prefix, or a literal first
//                  segment that no owner can start with (`conventions`, `wt`) — such a pattern reaches only LEGACY names,
//                  which the guard's `legacy-name` class and the janitor's `legacy:` lines already own.
//
// A line carrying `not-a-sweeper` is honoured ONLY when the caller asks (`honourMarker`): the corporate sibling's tools use
// it on their own detector lines and the scan reads those files during the transition. The guard never asks — in this
// repository no comment clears an owner-blind line (rule §7); the one pass is a hash-keyed allowlist.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export const NOT_A_SWEEPER = "not-a-sweeper";

// What follows the prefix: its separator, then (for an owner-aware pattern) an owner segment. Both are matched on the
// lower-cased line, so a `U\d` or `[-_]` is read however the author cased it.
const SEPARATOR = String.raw`(?:\[[-_]{2}\]|\((?:\?:)?(?:\[[-_]{2}\]|[-_]\|[-_])\)|[-_])`;
const SEPARATOR_RE = new RegExp(`^${SEPARATOR}`);
const OWNER_START_RE = /^(?:\(\?:|\()?(?:[uw](?:\\{1,4}d|\d|\[0-9\]|\$|\{)|[uw]\|[uw]\)|\[uw\]|\$|\{|<[^<>]*owner)/;
// A literal name after the separator (`wt-…`, `conventions-…`) matches only names that start with it, and no name of the
// owner form starts with a letter-continued `u` or `w`: such a pattern cannot reach another user's leftovers, so it is
// narrow and not a sweep. A bare `u` or `w` (`u.*`, `w`) is not literal: it reaches every owner.
const NARROW_RE = /^(?![uw](?![a-z0-9]))[a-z0-9]/;
const ANCHORED_RE = /(\^(?:\(\?:|\()?|\\?\/)teststodelete/g; // a regex anchor, or a path anchor
// A leading star is a glob only when it is not a regex quantifier (`\s*`, `)*`) that happens to sit before the prefix.
const GLOB_RE = /(?<![\w\])}])(\*)?teststodelete(?:(?:[-_]|\[[-_]{1,2}\])?\*)?/g;
// A docker name filter is a SUBSTRING match unless it is anchored with `^`; the anchored ones are read above.
const FILTER_RE = /(?:--filter(?:\s+|=)|-f\s+)["']?name=["']?(?!\^)teststodelete/g;
// A prefix test written as a method call: `startsWith("<prefix>-")`.
const STARTS_WITH_RE = /startswith\(\s*["'`]teststodelete(?=[-_])/g;

/** What the text after the prefix says: an owner segment, a narrow literal name, or (anything else) every owner. */
function verdictAfter(rest) {
  const separator = SEPARATOR_RE.exec(rest);
  if (separator === null) return "broad";
  const after = rest.slice(separator[0].length);
  if (OWNER_START_RE.test(after)) return "owner-aware";
  return NARROW_RE.test(after) ? null : "broad";
}

/** The verdict of every occurrence of the prefix in the (lower-cased) line that is a pattern shape; a narrow literal name has none. */
function occurrenceVerdicts(lower) {
  const verdicts = [];
  for (const match of lower.matchAll(ANCHORED_RE)) {
    const rest = lower.slice(match.index + match[0].length);
    const isPathAnchor = !match[1].startsWith("^");
    if (isPathAnchor && !/^[-_[]/.test(rest)) continue; // a folder simply named like the prefix is not a prefix match
    verdicts.push(verdictAfter(rest));
  }
  for (const match of lower.matchAll(GLOB_RE)) {
    const isGlob = match[0].endsWith("*") || match[1] === "*"; // the prefix and a separator and a star, or a leading star
    if (isGlob) verdicts.push("broad");
  }
  for (const match of lower.matchAll(FILTER_RE)) verdicts.push(verdictAfter(lower.slice(match.index + match[0].length)));
  for (const match of lower.matchAll(STARTS_WITH_RE)) {
    verdicts.push(verdictAfter(lower.slice(match.index + match[0].length)));
  }
  return verdicts;
}

/**
 * `'broad' | 'owner-aware' | null` (pure). A line is a sweep pattern when it holds, case-insensitively, the prefix in one of
 * these shapes: a regex anchor, a path anchor (followed by `-`, `_` or a character class), a glob, a docker name filter
 * that is not anchored, or a `startsWith` call. It is owner-aware when an owner segment starts right after the prefix's
 * separator, else broad; a line with both is broad.
 */
export function classifyLine(text, { honourMarker = false } = {}) {
  const lower = String(text).toLowerCase();
  if (honourMarker && lower.includes(NOT_A_SWEEPER)) return null;
  const verdicts = occurrenceVerdicts(lower);
  if (verdicts.includes("broad")) return "broad";
  return verdicts.includes("owner-aware") ? "owner-aware" : null;
}

/** The lines of a text that `classifyLine` calls broad, as 1-based numbers. */
export function broadLines(text, options) {
  return String(text).split(/\r?\n/).flatMap((line, index) => (classifyLine(line, options) === "broad" ? [index + 1] : []));
}

/** The hash an allowlist entry pins a line by: sha256 of the line's text, line end excluded, as lower-case hex. */
export function lineSha256(line) {
  return createHash("sha256").update(String(line).replace(/\r?\n$/, ""), "utf8").digest("hex");
}

// --- the machine scan ----------------------------------------------------------------------------------------------
//
// `scanSweepers` reads what could delete leftovers on THIS machine, in the scope asked for, and deletes nothing:
//   user scope (the default)  the caller's checkouts and worktrees under `root`, the caller's crontab, the caller's
//                             systemd user units, the caller's scheduled tasks (Windows);
//   `system`                  adds /etc/crontab, /etc/cron*, /var/spool/cron, /etc/systemd/system and every home.
// A finding is a line `classifyLine` calls broad (and the allowlist does not pass), or a scheduled job that calls a janitor or
// a sweep by name (it must be bumped or disabled before the barrier opens). Evidence the scan could not read is `unreadable`,
// and that keeps the barrier CLOSED: unread is never "nothing found".

export const SCAN_REASONS = Object.freeze({ OWNER_BLIND: "owner-blind", CALLS_A_SWEEP: "calls-a-sweep" });
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_DEPTH = 3;
const SKIP_DIRECTORIES = new Set(["node_modules", ".git"]);
const CALLS_A_SWEEP_RE = /janitor(?:\.sh)?|leftovers-sweep|sweep-own-leftovers/i;
const SCRIPT_EXTENSION = /\.(?:sh|bash|mjs|cjs|js|ts|py|ps1|cmd|bat)$/i;

const isCommentLine = (line) => /^\s*[#;]/.test(line);
const posixPath = (file) => file.replaceAll("\\", "/");

function defaultRun(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 60_000, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error };
}

/** The accumulating answer: findings and unreadable places, each de-duplicated. */
function collector() {
  const found = new Map();
  const unreadable = new Map();
  const read = { files: 0 };
  return {
    read,
    found: (entry) => found.set(`${entry.path}\0${entry.line}\0${entry.reason}`, Object.freeze(entry)),
    unreadable: (target, why) => unreadable.set(target, Object.freeze({ path: target, why })),
    result: () => ({
      findings: [...found.values()].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : a.line - b.line)),
      unreadable: [...unreadable.values()].sort((a, b) => (a.path < b.path ? -1 : 1)),
      files: read.files,
    }),
  };
}

/** Text of a file the scan may read: `null` when absent or binary (not evidence), `undefined` when it exists and could not be read or is too big. */
function readTextFile(file, sink) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") return null;
    sink.unreadable(file, error?.code ?? "unreadable");
    return undefined;
  }
  if (!stat.isFile()) return null;
  if (stat.size > MAX_FILE_BYTES) {
    sink.unreadable(file, `larger than ${MAX_FILE_BYTES} bytes`);
    return undefined;
  }
  try {
    const buffer = fs.readFileSync(file);
    return buffer.subarray(0, 8192).includes(0) ? null : buffer.toString("utf8"); // binary: no line of it is a command
  } catch (error) {
    sink.unreadable(file, error?.code ?? "unreadable");
    return undefined;
  }
}

const passes = (allowlist, relative, number, line) => relative !== undefined
  && allowlist.some((entry) => entry.file === relative && entry.line === number && entry.sha256 === lineSha256(line));

function classifyText(sink, display, text, { allowlist, relative, honourMarker, jobs }) {
  sink.read.files += 1;
  text.split(/\r?\n/).forEach((line, index) => {
    const number = index + 1;
    if (classifyLine(line, { honourMarker }) === "broad") {
      if (!passes(allowlist, relative, number, line)) sink.found({ path: display, line: number, reason: SCAN_REASONS.OWNER_BLIND });
    } else if (jobs && !isCommentLine(line) && CALLS_A_SWEEP_RE.test(line)) {
      sink.found({ path: display, line: number, reason: SCAN_REASONS.CALLS_A_SWEEP });
    }
  });
}

// --- checkouts ---------------------------------------------------------------------------------------------------

/** Working trees at or below `root`: a folder holding `.git` (file or folder), to a few levels, never entering one. */
function checkoutsUnder(root, sink) {
  const found = [];
  const visit = (dir, depth) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") sink.unreadable(dir, error?.code ?? "unreadable");
      return;
    }
    if (entries.some((entry) => entry.name === ".git")) {
      found.push(dir);
      return;
    }
    if (depth >= MAX_DEPTH) return;
    for (const entry of entries) if (entry.isDirectory() && !SKIP_DIRECTORIES.has(entry.name)) visit(path.join(dir, entry.name), depth + 1);
  };
  visit(root, 0);
  return found;
}

/** Prose is not a sweeper: a Markdown file is read only when it is a copy of the rule text itself (its file name says so). */
const readable = (name) => !/\.md$/i.test(name) || /^test-leftovers/i.test(path.basename(name));

function scanCheckout(checkout, sink, context, run) {
  const listing = run("git", ["-C", checkout, "ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
  if (listing.error !== undefined || listing.status !== 0) {
    sink.unreadable(checkout, "git could not list its files");
    return;
  }
  for (const name of new Set(listing.stdout.split("\0").filter(Boolean))) {
    if (!readable(name)) continue;
    const text = readTextFile(path.join(checkout, name), sink);
    if (typeof text === "string") classifyText(sink, path.join(checkout, name), text, { ...context, relative: posixPath(name), jobs: false });
  }
}

// --- scheduled jobs ----------------------------------------------------------------------------------------------

function scanJobFile(file, sink, context) {
  const text = readTextFile(file, sink);
  if (typeof text === "string") classifyText(sink, file, text, { ...context, relative: undefined, jobs: true });
}

/** Files of a folder: one level, or the tree to a few levels (systemd units). A folder that cannot be read is unreadable, one that is absent is nothing. */
function jobFilesUnder(dir, sink, { recursive }) {
  const files = [];
  const visit = (current, depth) => {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") sink.unreadable(current, error?.code ?? "unreadable");
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory() && recursive && depth < MAX_DEPTH) visit(full, depth + 1);
      else if (entry.isFile() || entry.isSymbolicLink()) files.push(full);
    }
  };
  visit(dir, 0);
  return files;
}

function scanUserCrontab(sink, context, run) {
  const listing = run("crontab", ["-l"]);
  if (listing.error !== undefined) {
    if (listing.error.code !== "ENOENT") sink.unreadable("crontab -l", listing.error.code ?? "failed");
    return; // no crontab program: no crontab to read
  }
  if (listing.status !== 0) {
    if (!/no crontab/i.test(listing.stderr)) sink.unreadable("crontab -l", `exit ${listing.status}`);
    return;
  }
  classifyText(sink, "crontab -l", listing.stdout, { ...context, relative: undefined, jobs: true });
}

/** CSV text → rows of cells; a quoted comma or line end stays in its cell. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const endCell = () => { row.push(cell); cell = ""; };
  const endRow = () => { endCell(); if (row.length > 1 || row[0] !== "") rows.push(row); row = []; };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (quoted) cell += char;
    else if (char === ",") endCell();
    else if (char === "\n" || char === "\r") { if (char === "\r" && text[index + 1] === "\n") index += 1; endRow(); }
    else cell += char;
  }
  if (cell !== "" || row.length > 0) endRow();
  return rows;
}

/** The action text of every scheduled task the caller can see: `[{ name, action }]`, or `undefined` when the Task Scheduler could not be queried either way. */
function queryScheduledTasks(run) {
  const csv = run("schtasks", ["/query", "/fo", "csv", "/v"]);
  if (csv.error === undefined && csv.status === 0) {
    const rows = parseCsv(csv.stdout).filter((row) => row.length > 1);
    const header = rows[0]?.map((cell) => cell.trim().toLowerCase()) ?? [];
    const action = header.indexOf("task to run");
    const name = header.indexOf("taskname");
    if (action >= 0) return rows.slice(1).filter((row) => row.join() !== rows[0].join()).map((row) => ({ name: row[name] ?? "", action: row[action] ?? "" }));
  }
  const script = "Get-ScheduledTask | ForEach-Object { $n = $_.TaskName; $_.Actions | ForEach-Object { $n + [char]9 + $_.Execute + ' ' + $_.Arguments } }";
  const ps = run("powershell", ["-NoProfile", "-NonInteractive", "-Command", script]);
  if (ps.error === undefined && ps.status === 0) {
    return ps.stdout.split(/\r?\n/).filter(Boolean).map((line) => ({ name: line.split("\t")[0], action: line.split("\t").slice(1).join(" ") }));
  }
  return undefined;
}

function scanScheduledTasks(sink, context, run) {
  const tasks = queryScheduledTasks(run);
  if (tasks === undefined) {
    sink.unreadable("Task Scheduler", "neither schtasks nor Get-ScheduledTask could be queried");
    return;
  }
  for (const { name, action } of tasks) {
    classifyText(sink, `scheduled task ${name}`, action, { ...context, relative: undefined, jobs: true });
    for (const token of action.split(/[\s"']+/).filter((word) => SCRIPT_EXTENSION.test(word))) scanJobFile(token, sink, context); // the script the task runs
  }
}

// --- homes and system folders -------------------------------------------------------------------------------------

function homesOf(platform, hostRoot) {
  const base = platform === "win32" ? path.join(process.env.SystemDrive ?? "C:", "Users") : path.join(hostRoot, platform === "darwin" ? "Users" : "home");
  let names = [];
  try {
    names = fs.readdirSync(base, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => path.join(base, entry.name));
  } catch { /* no home folders to list: the scan names what it read, not what is missing */ }
  return platform === "win32" ? names : [path.join(hostRoot, "root"), ...names];
}

function scanSystemdUser(home, sink, context) {
  for (const file of jobFilesUnder(path.join(home, ".config", "systemd", "user"), sink, { recursive: true })) {
    if (/\.(?:service|timer)$/.test(file)) scanJobFile(file, sink, context);
  }
}

function scanSystemScope(sink, context, platform, hostRoot) {
  const at = (...parts) => path.join(hostRoot, ...parts);
  if (platform !== "win32") {
    scanJobFile(at("etc", "crontab"), sink, context);
    for (const dir of [at("etc", "cron.d"), at("etc", "cron.hourly"), at("etc", "cron.daily"), at("etc", "cron.weekly"), at("etc", "cron.monthly"), at("var", "spool", "cron"), at("var", "spool", "cron", "crontabs")]) {
      for (const file of jobFilesUnder(dir, sink, { recursive: false })) scanJobFile(file, sink, context);
    }
    for (const file of jobFilesUnder(at("etc", "systemd", "system"), sink, { recursive: true })) {
      if (/\.(?:service|timer)$/.test(file)) scanJobFile(file, sink, context);
    }
  }
  for (const home of homesOf(platform, hostRoot)) scanSystemdUser(home, sink, context);
}

/**
 * `scanSweepers({ root, system, allowlist, honourMarker, platform, run, home, hostRoot })` → `{ findings, unreadable, files }`.
 * `findings` are `{ path, line, reason }`; `unreadable` are `{ path, why }`; `files` counts what was read. `run(command, args)` is a
 * seam (`{ status, stdout, stderr, error }`). Never deletes, never throws for a unit it cannot read — that unit is `unreadable`.
 */
export function scanSweepers({ root, system = false, allowlist = [], honourMarker = false, platform = process.platform, run = defaultRun, home = os.homedir(), hostRoot = path.parse(process.cwd()).root } = {}) {
  const sink = collector();
  const context = { allowlist, honourMarker };
  const guarded = (unit, work) => {
    try { work(); } catch (error) { sink.unreadable(unit, error?.code ?? error?.message ?? "failed"); }
  };
  if (root !== undefined) {
    const checkouts = checkoutsUnder(path.resolve(root), sink);
    for (const checkout of checkouts) guarded(checkout, () => scanCheckout(checkout, sink, context, run));
    if (checkouts.length === 0) sink.unreadable(path.resolve(root), "no checkout found under it");
  }
  if (platform === "win32") guarded("Task Scheduler", () => scanScheduledTasks(sink, context, run));
  else {
    guarded("crontab -l", () => scanUserCrontab(sink, context, run));
    guarded("systemd user units", () => scanSystemdUser(home, sink, context));
  }
  if (system) guarded("system scope", () => scanSystemScope(sink, context, platform, hostRoot));
  return sink.result();
}
