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
// A whole file is read with `classifyLines`: it also traces a prefix held in a variable the SAME file assigns (`P='<prefix>-'` then
// `find … -name "${P}*"`); a name from another file, the environment or an argument is not traced. A variable assigned on a line the
// allowlist passes (the janitor's inventory line) is not traced either, so that one pass covers its variables' uses and nothing else.
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

// An UNANCHORED use of the prefix is a sweep too when the line deletes something or the prefix is what a matcher is given:
// `ls | grep <prefix> | xargs rm -rf`, `n.includes("<prefix>-")`, `re.match(r"<prefix>-", n)`, `$_.Name -match '<prefix>'`.
const DELETION_RE = /(?:^|[^a-z0-9_-])(?:rm|rmdir|unlink|del|erase)(?=\s|$)|remove-item|docker\s+(?:(?:container|volume|network|image)\s+)?(?:rm|rmi|prune)\b|rmsync|rmtree|xargs|-delete\b|os\.remove|\.unlink\(|\.rmdir\(/;
const MATCHER_RE = /(?:\bgrep\b|\bfindstr\b|-i?match\b|-i?like\b|\.test\(|\.includes\(|\.match\(|\.search\(|\bre\.\w+\(|startswith\(|endswith\(|-iname\b|(?<![-\w])-name\b|-regex\b)[^|;]*$/;
const PREFIX_WORD = "teststo" + "delete"; // spelled in two pieces: this file is read by the machine scan too
const PREFIX_WORD_RE = new RegExp(PREFIX_WORD, "g");

/** The verdicts of the unanchored occurrences of the prefix, when the line deletes or the prefix is a matcher's argument. */
function looseVerdicts(lower) {
  const verdicts = [];
  const deletes = DELETION_RE.test(lower.replace(/\s#.*$/, "")); // a trailing shell comment deletes nothing
  for (const match of lower.matchAll(PREFIX_WORD_RE)) {
    const before = lower.slice(0, match.index);
    const rest = lower.slice(match.index + match[0].length);
    if (/[a-z0-9_.]$/.test(before) || rest.startsWith(".owner")) continue; // a longer word, or the label key
    if (deletes || MATCHER_RE.test(before)) verdicts.push(SEPARATOR_RE.test(rest) ? verdictAfter(rest) : "broad");
  }
  return verdicts;
}

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
  verdicts.push(...looseVerdicts(lower));
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

// --- a prefix held in a variable of the same file -----------------------------------------------------------------------
//
// A sweep line often carries no literal prefix: `P='<prefix>-'` on one line, `find … -name "${P}*" … rm -rf` on another.
// `prefixBindings` finds the names a file assigns a LITERAL value holding the prefix word, `expandLine` writes those values
// into a line, and `classifyLines` judges the expanded line while every report keeps the ORIGINAL line (its number, its hash).
// Conservative on purpose: a name assigned a prefix value ANYWHERE in the file is bound on EVERY line, whatever the scope,
// the order or a later reassignment — the error is then a false `broad`, which keeps the barrier closed, never a missed sweep.
// Not traced: a name bound in another file, the environment, a value built over several lines or passed as an argument.

const SHELL = "shell"; // `$NAME`, `${NAME}`, `$env:NAME` are uses (shell, PowerShell)
const CODE = "code"; //   a bare `NAME` is a use too (JavaScript, TypeScript, Python)
const MAX_ALIAS_PASSES = 8;
const VALUE = String.raw`(?:'([^']*)'|"([^"]*)"|\x60([^\x60]*)\x60|([^\s;'"\x60,)]+))`; // quoted with ' " or a backtick, or bare: groups 1-4
const IDENT = String.raw`[A-Za-z_][A-Za-z0-9_]*`;
const SHELL_ASSIGN_RE = new RegExp(String.raw`(?:^|[;&|({]|\b(?:then|do|else)\b)\s*(?:(?:export|local|readonly|declare|typeset)(?:\s+-\w+)*\s+)*(${IDENT})=${VALUE}`, "g");
const POWERSHELL_ASSIGN_RE = new RegExp(String.raw`(?:^|[;{(])\s*\$(?:env:)?(${IDENT})\s*=(?!=)\s*${VALUE}`, "g");
const SCRIPT_DECLARE_RE = new RegExp(String.raw`\b(?:const|let|var)\s+(${IDENT})\s*(?::[^=]+)?=(?![=>])\s*${VALUE}`, "g");
const PYTHON_ASSIGN_RE = new RegExp(String.raw`^\s*(${IDENT})(?:\s*:[^=]+?)?\s+=(?!=)\s*[rRbBuU]{0,2}${VALUE}`, "g"); // PEP 8 spacing: it is what tells it from a shell assignment
const ALIAS_OF_RE = new RegExp(String.raw`^(?:\$\{(${IDENT})\}|\$(?:env:)?(${IDENT})|(${IDENT}))$`);

/** The assignments of one line: `{ name, family, value, quoted }`, where `value` is the text between the quotes (or the bare word). */
function assignments(line) {
  const found = [];
  const read = (re, family) => {
    for (const match of line.matchAll(re)) {
      const quoted = match[2] !== undefined || match[3] !== undefined || match[4] !== undefined;
      found.push({ name: match[1], family, value: match[2] ?? match[3] ?? match[4] ?? match[5], quoted });
    }
  };
  read(SHELL_ASSIGN_RE, SHELL);
  read(POWERSHELL_ASSIGN_RE, SHELL);
  read(SCRIPT_DECLARE_RE, CODE);
  read(PYTHON_ASSIGN_RE, CODE);
  return found;
}

/** The name a value refers to when the WHOLE value is one reference (`$BASE`, `${BASE}`, or a bare identifier in script code), else undefined. */
function aliasTarget({ value, family, quoted }) {
  const match = ALIAS_OF_RE.exec(value);
  if (match === null) return undefined;
  if (match[3] !== undefined) return family === CODE && !quoted ? match[3] : undefined; // a bare word is a reference only in script code
  return match[1] ?? match[2];
}

/** A value is a literal prefix value when it holds the prefix word and no interpolation. */
const holdsPrefix = (value) => value.toLowerCase().includes(PREFIX_WORD) && !/[${]/.test(value);

/**
 * `Map<name, { family, values: string[] }>` — the names `text` assigns a literal value that holds the prefix word
 * (case-insensitive), in shell (`NAME=`, after `export`/`local`/…), JS/TS (`const|let|var NAME =`), Python (`NAME =`) or
 * PowerShell (`$NAME =`), plus the names whose whole value is a reference to a bound name (to a fixed point). An assignment on
 * a line number in `sanctioned` binds nothing: those are the lines the allowlist passes (see `classifyLines`).
 */
export function prefixBindings(text, sanctioned = new Set()) {
  const all = String(text).split(/\r?\n/).flatMap((line, index) => (sanctioned.has(index + 1) ? [] : assignments(line)));
  const bindings = new Map();
  const bind = (name, family, value) => {
    const entry = bindings.get(name) ?? { family, values: [] };
    if (entry.values.includes(value)) return false;
    bindings.set(name, { family: entry.family, values: [...entry.values, value] });
    return true;
  };
  for (const item of all) if (holdsPrefix(item.value)) bind(item.name, item.family, item.value);
  for (let pass = 0; pass < MAX_ALIAS_PASSES; pass += 1) {
    let changed = false;
    for (const item of all) {
      const target = aliasTarget(item);
      for (const value of target !== undefined && bindings.has(target) ? bindings.get(target).values : []) changed = bind(item.name, item.family, value) || changed;
    }
    if (!changed) break;
  }
  return bindings;
}

/** Which characters of the line sit inside a string literal (`'`, `"` or a backtick, with backslash escapes), the quotes included. */
function stringMask(line) {
  const mask = new Array(line.length).fill(false);
  let quote = null;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote === null) {
      if (char === "'" || char === '"' || char === "`") { quote = char; mask[index] = true; }
    } else {
      mask[index] = true;
      if (char === "\\") { index += 1; mask[index] = true; } else if (char === quote) quote = null;
    }
  }
  return mask;
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The line with every use of a bound name replaced by its value: `${NAME}`, `$NAME` (word-bounded) and `$env:NAME` anywhere; for
 * a name bound in script code a bare `NAME` too, quoted — as a whole token only: not inside a longer identifier, not after a `.`,
 * not inside a string literal. A name the line itself assigns is left alone (the binding's own line). `variant` picks the
 * `variant`-th value of a name assigned several (the last one when it has fewer).
 */
export function expandLine(line, bindings, variant = 0) {
  const own = new Set(assignments(line).map((item) => item.name));
  const names = [...bindings.keys()].filter((name) => !own.has(name)).sort((a, b) => b.length - a.length);
  if (names.length === 0) return line;
  const alternation = names.map(escapeRegExp).join("|");
  const re = new RegExp(String.raw`\$\{(${alternation})\}|\$(?:env:)?(${alternation})(?![A-Za-z0-9_])|(?<![A-Za-z0-9_$.])(${alternation})(?![A-Za-z0-9_$])`, "g");
  const inString = stringMask(line);
  return line.replace(re, (match, braced, dollar, bare, offset) => {
    const entry = bindings.get(braced ?? dollar ?? bare);
    if (bare !== undefined && (entry.family !== CODE || inString[offset])) return match;
    const value = entry.values[Math.min(variant, entry.values.length - 1)];
    return bare === undefined ? value : `"${value}"`;
  });
}

const RANK = { broad: 2, "owner-aware": 1 };
const stronger = (a, b) => ((RANK[b] ?? 0) > (RANK[a] ?? 0) ? b : a);

/**
 * The verdict of every line of a text, `classifyLine`'s, read through the file's own prefix bindings: a line is judged as written
 * and again with each bound name replaced by its value (one reading per value a name was assigned); the strongest verdict wins.
 * The result is indexed like the lines, so a caller reports the ORIGINAL line, its number and its hash.
 * `sanctioned` (1-based line numbers, empty by default) is the lines the caller's allowlist passes for this file: an assignment
 * made on one of them binds nothing, so the pass of the janitor's inventory line also covers the uses of the variables that
 * line assigns — and no other line. The sanction is per allowlisted line (file, number, hash), never per variable name.
 */
export function classifyLines(text, { sanctioned = new Set(), ...options } = {}) {
  const lines = String(text).split(/\r?\n/);
  const bindings = prefixBindings(text, sanctioned);
  const readings = Math.max(1, ...[...bindings.values()].map((entry) => entry.values.length));
  return lines.map((line) => {
    let verdict = classifyLine(line, options);
    if (bindings.size === 0 || verdict === "broad") return verdict;
    for (let variant = 0; variant < readings; variant += 1) {
      const expanded = expandLine(line, bindings, variant);
      if (expanded !== line) verdict = stronger(verdict, classifyLine(expanded, options));
    }
    return verdict;
  });
}

/** The lines of a text that `classifyLines` calls broad, as 1-based numbers. */
export function broadLines(text, options) {
  return classifyLines(text, options).flatMap((verdict, index) => (verdict === "broad" ? [index + 1] : []));
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
  try {
    const head = Buffer.alloc(Math.min(8192, stat.size));
    const fd = fs.openSync(file, "r");
    try {
      fs.readSync(fd, head, 0, head.length, 0);
    } finally {
      fs.closeSync(fd);
    }
    if (head.includes(0)) return null; // binary (a program): no line of it is a command, whatever its size
    if (stat.size > MAX_FILE_BYTES) {
      sink.unreadable(file, `larger than ${MAX_FILE_BYTES} bytes`);
      return undefined;
    }
    return fs.readFileSync(file).toString("utf8");
  } catch (error) {
    sink.unreadable(file, error?.code ?? "unreadable");
    return undefined;
  }
}

/** The repository's one sweeper script: the only file an allowlist entry can name (rule §7 `owner-blind`). */
export const JANITOR_FILE = "tools/janitor.sh";

const passes = (allowlist, relative, number, line) => relative === JANITOR_FILE
  && allowlist.some((entry) => entry.file === JANITOR_FILE && entry.file === relative && entry.line === number && entry.sha256 === lineSha256(line));

function classifyText(sink, display, text, options) {
  const { allowlist, relative, honourMarker, jobs, kind } = options;
  sink.read.files += 1;
  const lines = text.split(/\r?\n/);
  const sanctioned = new Set(lines.flatMap((line, index) => (passes(allowlist, relative, index + 1, line) ? [index + 1] : [])));
  const verdicts = classifyLines(text, { honourMarker, sanctioned });
  lines.forEach((line, index) => {
    const number = index + 1;
    if (verdicts[index] === "broad") {
      if (!passes(allowlist, relative, number, line)) sink.found({ path: display, line: number, reason: SCAN_REASONS.OWNER_BLIND });
    } else if (jobs && !isCommentLine(line) && CALLS_A_SWEEP_RE.test(line)) {
      sink.found({ path: display, line: number, reason: SCAN_REASONS.CALLS_A_SWEEP });
    }
  });
  if (jobs && kind !== undefined) followScripts(sink, display, lines, options);
}

// --- following a job to the script it runs ---------------------------------------------------------------------------
// A job line often only NAMES a script (`@hourly ~/bin/clean-tmp.sh`, `ExecStart=/opt/sweep.sh`, a task's action). The script
// is what sweeps, so it is read and classified like any file; one that cannot be found or resolved is unreadable evidence, never
// "clean". One level only: what the script itself calls is not followed.

const INTERPRETERS = new Set(["bash", "sh", "dash", "zsh", "ksh", "node", "nodejs", "python", "python3", "perl", "ruby", "pwsh", "powershell", "powershell.exe", "pwsh.exe", "cmd", "cmd.exe", "bash.exe", "sh.exe", "env", "nice", "ionice", "flock", "timeout", "sudo", "xargs"]);
const SYSTEM_BIN = /^\/(?:usr\/)?s?bin\//;
const EXEC_KEYS = /^\s*Exec(?:Start|StartPre|StartPost|Stop|StopPost|Reload|Condition)\s*=\s*(.*)$/;

/** Split a command into words, quote-aware; a backslash escapes only on POSIX (a Windows path is full of them). */
export function splitCommand(text, { windows = false } = {}) {
  const words = [];
  let word = "";
  let quote = "";
  let any = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote !== "") {
      if (char === quote) quote = "";
      else if (char === "\\" && !windows && quote === '"' && /[$`"\\]/.test(text[index + 1] ?? "")) word += text[(index += 1)]; // inside double quotes a backslash escapes only these
      else word += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      any = true;
    } else if (char === "\\" && !windows && index + 1 < text.length) {
      word += text[(index += 1)];
      any = true;
    } else if (/\s/.test(char)) {
      if (word !== "" || any) words.push(word);
      word = "";
      any = false;
    } else word += char;
  }
  if (word !== "" || any) words.push(word);
  return words;
}

/** The words of a scheduled task's action. The Task Scheduler prints the program UNQUOTED even when its path holds spaces, so the program is taken up to its executable extension. */
function taskWords(action) {
  const unquoted = /^([^"'].*?\.(?:exe|bat|cmd|com|ps1|vbs|msc))(?=\s|$)(.*)$/i.exec(action);
  return unquoted === null ? splitCommand(action, { windows: true }) : [unquoted[1], ...splitCommand(unquoted[2], { windows: true })];
}

/** The command words of one job line, by kind of job, or `undefined` when the line is not a command. */
function commandOf(line, kind, windows) {
  const trimmed = line.trim();
  if (trimmed === "" || isCommentLine(trimmed)) return undefined;
  if (kind === "systemd") {
    const exec = EXEC_KEYS.exec(trimmed)?.[1].trim();
    return exec === undefined || exec === "" ? undefined : splitCommand(exec.replace(/^[-@:+!]+/, ""), { windows });
  }
  if (kind === "task") return taskWords(trimmed);
  if (/^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(trimmed)) return undefined; // MAILTO=…, PATH=…
  const rest = splitCommand(trimmed, { windows }).slice(trimmed.startsWith("@") ? 1 : 5);
  return kind === "cron-system" ? rest.slice(1) : rest;
}

/** `%VAR%`, `~`, `$HOME`, `${HOME}` and `$VAR` expanded; a word still holding `$` or `%…%` is unresolved. */
function expandWord(word, { home, windows, env }) {
  const lookup = (name) => (windows ? Object.entries(env).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] : env[name]);
  const expanded = word
    .replace(/%([A-Za-z0-9_]+)%/g, (all, name) => lookup(name) ?? all)
    .replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (all, name) => (name === "HOME" ? home : (lookup(name) ?? all)));
  return expanded === "~" || expanded.startsWith("~/") || expanded.startsWith("~\\") ? home + expanded.slice(1) : expanded;
}

/** The words of a command that name a script: a path-like command, an interpreter's script, and any word with a script extension. */
export function scriptWords(words, { windows = false } = {}) {
  const found = [];
  const baseOf = (word) => path.basename(word.replaceAll("\\", "/")).toLowerCase();
  const pathLike = (word) => /[\\/]|^~|^\$|^%/.test(word);
  const option = (word) => word.startsWith("-") || (windows && /^\/[A-Za-z]$/.test(word)) || word.includes("=");
  words.forEach((word, index) => {
    const previous = words[index - 1] ?? "";
    if (/^\d*>/.test(word) || /^\d*>>?$/.test(previous) || option(word) || /^[a-z]+:\/\//i.test(word)) return; // a redirection target or an option
    const interpreter = index === 0 && INTERPRETERS.has(baseOf(word)); // the interpreter is a program; what it runs is the script
    if (!interpreter && (SCRIPT_EXTENSION.test(word) || (index === 0 && pathLike(word)))) found.push(word);
  });
  const executable = baseOf(words[0] ?? "");
  if (INTERPRETERS.has(executable)) {
    const inline = words.findIndex((word, index) => index > 0 && /^(?:-c|-command|-encodedcommand|-e|\/c|\/k)$/i.test(word)); // what follows is code, not a script
    const script = words.slice(1, inline < 0 ? undefined : inline).find((word) => !option(word) && pathLike(word));
    if (script !== undefined && !found.includes(script)) found.push(script);
  }
  return found;
}

function followScripts(sink, label, lines, options) {
  const windows = options.platform === "win32";
  for (const line of lines) {
    const words = commandOf(line, options.kind, windows);
    if (words === undefined) continue;
    for (const word of scriptWords(words, { windows })) followOne(sink, label, word, options, windows);
  }
}

function followOne(sink, label, word, options, windows) {
  let expanded = expandWord(word, { home: options.home, windows, env: options.env });
  if (windows && path.sep === "/") expanded = expanded.replaceAll("\\", "/"); // a Windows path read on a POSIX host (only a test does that)
  const absolute = path.isAbsolute(expanded) || /^[A-Za-z]:[\\/]/.test(expanded);
  if (!absolute || /[$%]/.test(expanded)) {
    sink.unreadable(`${label}: ${word}`, "script not found");
    return;
  }
  if (!SCRIPT_EXTENSION.test(expanded) && SYSTEM_BIN.test(expanded.replaceAll("\\", "/"))) return; // a system binary that is not here is nobody's script
  if (!fs.existsSync(expanded)) {
    sink.unreadable(`${label}: ${word}`, "script not found");
    return;
  }
  const text = readTextFile(expanded, sink);
  if (typeof text === "string") classifyText(sink, expanded, text, { ...options, relative: undefined, jobs: false, kind: undefined });
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

function scanJobFile(file, sink, context, kind) {
  const text = readTextFile(file, sink);
  if (typeof text === "string") classifyText(sink, file, text, { ...context, relative: undefined, jobs: true, kind });
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
  classifyText(sink, "crontab -l", listing.stdout, { ...context, relative: undefined, jobs: true, kind: "cron" });
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
    classifyText(sink, `scheduled task ${name}`, action, { ...context, relative: undefined, jobs: true, kind: "task" }); // followed to the script it runs
  }
}

// --- homes and system folders -------------------------------------------------------------------------------------

/** The home folders of the machine. A base folder that is not there is nothing; one that cannot be listed is unreadable evidence, never "no homes". */
function homesOf(platform, hostRoot, sink, readDir) {
  const base = platform === "win32" ? path.join(process.env.SystemDrive ?? "C:", "Users") : path.join(hostRoot, platform === "darwin" ? "Users" : "home");
  let names = [];
  try {
    names = readDir(base).filter((entry) => entry.isDirectory()).map((entry) => path.join(base, entry.name));
  } catch (error) {
    if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") sink.unreadable(base, error?.code ?? "unreadable");
  }
  return platform === "win32" ? names : [path.join(hostRoot, "root"), ...names];
}

/** A systemd unit, or a drop-in `*.conf` inside a `<unit>.d` folder: the files whose Exec lines run something. */
const isUnitFile = (file) => /\.(?:service|timer)$/.test(file) || /\.d[\\/][^\\/]+\.conf$/.test(file);

function scanSystemdUser(home, sink, context) {
  for (const file of jobFilesUnder(path.join(home, ".config", "systemd", "user"), sink, { recursive: true })) {
    if (isUnitFile(file)) scanJobFile(file, sink, context, "systemd");
  }
}

function scanSystemScope(sink, context, platform, hostRoot) {
  const at = (...parts) => path.join(hostRoot, ...parts);
  if (platform !== "win32") {
    scanJobFile(at("etc", "crontab"), sink, context, "cron-system");
    const folders = [[at("etc", "cron.d"), "cron-system"], [at("etc", "cron.hourly"), undefined], [at("etc", "cron.daily"), undefined], [at("etc", "cron.weekly"), undefined],
      [at("etc", "cron.monthly"), undefined], [at("var", "spool", "cron"), "cron"], [at("var", "spool", "cron", "crontabs"), "cron"]];
    for (const [dir, kind] of folders) {
      for (const file of jobFilesUnder(dir, sink, { recursive: false })) scanJobFile(file, sink, context, kind);
    }
    for (const file of jobFilesUnder(at("etc", "systemd", "system"), sink, { recursive: true })) {
      if (isUnitFile(file)) scanJobFile(file, sink, context, "systemd");
    }
  }
  for (const home of homesOf(platform, hostRoot, sink, context.readDir)) scanSystemdUser(home, sink, context);
}

/**
 * `scanSweepers({ root, system, allowlist, honourMarker, platform, run, home, hostRoot })` → `{ findings, unreadable, files }`.
 * `findings` are `{ path, line, reason }`; `unreadable` are `{ path, why }`; `files` counts what was read. `run(command, args)` is a
 * seam (`{ status, stdout, stderr, error }`). Never deletes, never throws for a unit it cannot read — that unit is `unreadable`.
 */
export function scanSweepers({ root, system = false, allowlist = [], honourMarker = false, platform = process.platform, run = defaultRun, home = os.homedir(), hostRoot = path.parse(process.cwd()).root, env = process.env, readDir = (dir) => fs.readdirSync(dir, { withFileTypes: true }) } = {}) {
  const sink = collector();
  const context = { allowlist, honourMarker, platform, home, env, readDir };
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
