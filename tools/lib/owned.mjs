// Owned test resources: the Node encoding of `common/test-leftovers.md` §1–§3 for this repository.
//
// What it owns. Every temp folder or git worktree a test here makes goes through `ownedDir` / `ownedWorktree`:
// the name comes from one constant (`REPO_TOKEN`, rule §1, written in the repository's own `owned-token.mjs`; a consumer may bind another with `ownedFor`) behind the caller's owner token (`u<uid>`, or `w<digits>`
// on Windows), and the claim is written FIRST, under that name, with an exclusive create (rule §2).
//
// The order is the whole safety: claim → register → create. A claim that already exists is somebody else's name, so a
// new id is drawn. A folder that already exists under the claimed name is a squatter's: it is never adopted and
// never removed — one warning names it, the helper REMOVES its own claim (only while it still holds exactly what the helper
// wrote: a claim of a run that dies later must never govern a folder this run did not create), and a new id is drawn. So nothing the helper made ever exists unclaimed, and an UNMARKED
// resource of the owner form is nobody's the helper knows: the sweep lists it and never collects it.
//
// Why teardown never throws. It runs inside `t.after` / `finally`, where a throw would replace the test's own
// failure with a cleanup failure and hide the real one. Each step has its own `try/catch`; when a resource
// cannot be removed it stays prefixed AND claimed and ONE warning line names it, so the next run's sweep (and the
// janitor) can still judge it by its owner. A half-removed, unclaimed folder is the one outcome never produced:
// the folder goes first, its claim last.
//
// Where the owner lives (rule §3). Never inside the resource — a test that makes a repository at the folder, or a
// smoke run that refuses a worktree holding an untracked file, must see exactly what it made. A folder's owner is
// the sibling `<folder>.owner` in the same parent; a worktree's is the reason of its lock
// (`git worktree add --detach --lock --reason`), which also makes `git worktree prune` skip it. Reading a
// worktree's owner goes through its own `.git` file, so it works for any clone's tree.
//
// The record is `<owner>:<host>@<os>:<pid>[:<start>[:<ns>]]` — ONE grammar for a claim and a lock reason. The start
// is written only where the OS gives it WITHOUT spawning a process (a `/proc` read on Linux), and on Linux the pid
// namespace rides with it: two namespaces can share one host name, never a pid space. Nothing here spawns
// PowerShell or `ps`, and nothing uses Node's own clock (`performance.timeOrigin`) as a start.
//
// Two keys, three answers. The name SELECTS (its owner segment), the kernel owner and the record AUTHORISE, and
// liveness decides whether the run is gone. "No process has that pid" is the ONLY thing that makes an owner `gone`:
// a query that was refused or failed, two starts that disagree by more than the tolerance (a reused pid, or a skewed
// clock), a process list that may hide other users' processes, a record of another owner, host or namespace, and a
// resource another uid owns are all `unknown` — the resource is kept and named, never deleted on a guess (rule §3).

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { git } from "./git.mjs";
import { REPO_ROW, REPO_TOKEN } from "./owned-token.mjs"; // each repository writes its own `owned-token.mjs`; this file is the same bytes everywhere and holds no token

export { REPO_ROW, REPO_TOKEN };

export const PREFIX = "testsToDelete-";                              // rule §1
export const OWNER_GRAMMAR = /^[uw][0-9]{1,10}$/;                    // rule §1 — reserved: no repo token matches it
export const MAX_NAME = 63;                                          // rule §1
export const ID_LENGTH = 6;                                          // mkdtemp's six (D1)
export const START_TOLERANCE_S = 2;                                  // rule §3
export const MAX_CLAIM_BYTES = 512;                                  // rule §3: one line, line end included. `janitor.sh` reads 513 bytes of a claim file to see one past it.
export const TOKEN_SHAPE = /^[a-z0-9]{2,12}$/;                       // rule §1 — the shape of a repository token
const MAX_DRAWS = 3;                                                 // rule §2: a taken claim or a squatted name draws a new id, a few times

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CONTROL = /[\u0000-\u001f\u007f]/;
const OWNER_TEXT = /^([uw][0-9]{1,10}):([^@:\s]+@(linux|macos|windows)):(\d+)(?::(\d+)(?::(\d+))?)?$/;
const LEGACY_OWNER_TEXT = /^([^@:\s]+@(linux|macos|windows)):(\d+)(?::(\d+))?$/; // the grammar before the owner segment: `<host>@<os>:<pid>[:<start>]`
const OS_TAGS = { linux: "linux", darwin: "macos", win32: "windows" };
const CLOCK_TICKS_PER_SECOND = 100; // `CLK_TCK` on every Linux this family runs on; reading it would spawn `getconf`

/** The one place a test learns the temp root (the guard's `raw-temp` class refuses every other spelling). */
export function tempRoot() {
  return os.tmpdir();
}

function warn(message) {
  process.stderr.write(`owned: ${message}\n`);
}

function messageOf(error) {
  return error?.code ?? error?.message ?? String(error);
}

// --- the owner token (rule §1) ---------------------------------------------------------------------------------

/** `text` with the ASCII letters `A`–`Z` lower-cased and nothing else changed (no locale, no Unicode folding). */
export function asciiLower(text) {
  return String(text).replace(/[A-Z]/g, (letter) => String.fromCharCode(letter.charCodeAt(0) + 32));
}

/**
 * The Windows owner token, `w<digits>` (rule §1): the account name without its domain, `A`–`Z` lower-cased, the UTF-8 bytes
 * of that name ALONE (no line end), SHA-256, the first four bytes as a big-endian unsigned integer, decimal without leading
 * zeros — 1 to 10 digits. A collision confers no authority: the file's owner does.
 */
export function windowsOwnerToken(username) {
  const digest = crypto.createHash("sha256").update(Buffer.from(asciiLower(username), "utf8")).digest();
  return `w${digest.readUInt32BE(0)}`;
}

/**
 * The token of the user a process runs as: `u<uid>` on POSIX (`u0` is root's own scope, not every scope), `w<digits>` on
 * Windows. `TESTSTODELETE_OWNER` overrides it when set to the grammar and THROWS when set to anything else — an invalid value
 * refuses, it never falls back; the override never widens what the caller may delete (the kernel owner decides, rule §3).
 * An empty value is no value.
 */
export function ownerToken({ platform = process.platform, uid, username, env = process.env } = {}) {
  const override = env.TESTSTODELETE_OWNER;
  if (override !== undefined && override !== "") {
    if (!OWNER_GRAMMAR.test(override)) throw new Error(`owned: TESTSTODELETE_OWNER ${JSON.stringify(override)} is not an owner token (${OWNER_GRAMMAR})`);
    return override;
  }
  if (platform === "win32") return windowsOwnerToken(username ?? os.userInfo().username);
  return `u${uid ?? process.getuid()}`;
}

let cachedToken;

/** This process's owner token, computed once. */
export function thisOwnerToken() {
  cachedToken ??= ownerToken();
  return cachedToken;
}

// --- names (rule §1) -----------------------------------------------------------------------------------------------

/** `testsToDelete-<owner>-<token>-` — the part of every name of the repository that owns `token` that is not `<what>` or the id. */
function nameBase(token, owner = thisOwnerToken()) {
  return `${PREFIX}${owner}-${token}-`;
}

function checkWhat(what, token) {
  if (typeof what !== "string" || what === "") throw new TypeError(`owned: \`what\` must be a non-empty string, got ${JSON.stringify(what)}`);
  if (/[/\\]/.test(what) || CONTROL.test(what)) throw new TypeError(`owned: \`what\` may not hold a path separator or a control character: ${JSON.stringify(what)}`);
  if (what.startsWith("-")) throw new TypeError(`owned: \`what\` may not start with "-": ${JSON.stringify(what)}`);
  const base = nameBase(token);
  const room = MAX_NAME - base.length - 1 - ID_LENGTH; // the owner is budgeted BEFORE `what` (rule §1): never truncate a finished name
  if (what.length > room) {
    throw new TypeError(`owned: the whole name would pass ${MAX_NAME} characters — \`what\` is ${what.length}, the most is ${room} under the owner \`${thisOwnerToken()}\`: ${JSON.stringify(what)}`);
  }
}

function checkScope(scope) {
  if (typeof scope?.after !== "function") throw new TypeError("owned: `scope` must have an `after(fn)` method (a node:test context or a cleanupScope())");
}

function prefixFor(token, what) {
  checkWhat(what, token);
  return `${nameBase(token)}${what}-`;
}

function patternFor(token, owner = thisOwnerToken()) {
  if (!OWNER_GRAMMAR.test(owner)) throw new TypeError(`owned: ${JSON.stringify(owner)} is not an owner token`);
  return new RegExp(`^teststodelete[-_]${owner}[-_]${token}[-_]`, "i");
}

const legacyPatternFor = (token) => new RegExp(`^teststodelete[-_]${token}[-_]`, "i");

/** `testsToDelete-<owner>-<repo>-<what>-` — the part of the name before the random id. */
export function ownedPrefix(what) {
  return prefixFor(REPO_TOKEN, what);
}

/** What this repository's sweep matches for ONE owner: `^testsToDelete-<owner>-<repo>-`, all three spellings, case-insensitive (rule §1, §4). */
export function ownedPattern(owner = thisOwnerToken()) {
  return patternFor(REPO_TOKEN, owner);
}

/** What the sweep LISTS as legacy: this repository's token straight after the prefix, the form from before the owner segment. */
export function legacyPattern() {
  return legacyPatternFor(REPO_TOKEN);
}

// Spelled in two pieces: this is a reader of names, not a sweep, and the machine scan reads this file too.
const NAME_SEGMENTS = new RegExp(`^${"teststo" + "delete"}[-_]([^-_]+)(?:[-_]([^-_]+))?`, "i");

/**
 * The version of a name, read from its ONE second segment against the reserved grammar, never by counting separators:
 * `{ form: "owner", owner, token? }`, `{ form: "legacy", token }`, or `{ form: "none" }` for a name that is not prefixed.
 */
export function classifyName(name) {
  const match = NAME_SEGMENTS.exec(String(name));
  if (match === null) return { form: "none" };
  const second = match[1].toLowerCase();
  if (OWNER_GRAMMAR.test(second)) return match[2] === undefined ? { form: "owner", owner: second } : { form: "owner", owner: second, token: match[2].toLowerCase() };
  return { form: "legacy", token: second };
}

function randomId() {
  let id = "";
  while (id.length < ID_LENGTH) {
    for (const byte of crypto.randomBytes(ID_LENGTH * 2)) {
      if (byte < 248 && id.length < ID_LENGTH) id += ID_ALPHABET[byte % ID_ALPHABET.length]; // 248 = 4 × 62: no modulo bias
    }
  }
  return id;
}

function nameFor(token, what) {
  return prefixFor(token, what) + randomId();
}

/** A fresh, unused name: the prefix, the caller's owner, this repository's token, `what` and six random characters of [A-Za-z0-9]. */
export function ownedName(what) {
  return nameFor(REPO_TOKEN, what);
}

/** Is `child` strictly inside `parent`? Both already resolved; compared case-insensitively with `pathApi` (the Windows one on Windows). A longer sibling name is not a child. */
export function isInsideProfile(child, parent, pathApi = path) {
  const relative = pathApi.relative(pathApi.resolve(parent).toLowerCase(), pathApi.resolve(child).toLowerCase());
  return relative !== "" && !relative.startsWith("..") && !pathApi.isAbsolute(relative);
}

/**
 * Is `target` the caller's? POSIX: the real uid owns the entry itself (a link is not followed). Windows has no uid and a shared
 * temp root (`TEMP=C:\Temp`, CI accounts sharing one) would erase the scope key, so it FAILS CLOSED: only a path inside the current
 * user's profile (a per-user `%TEMP%` lives there), compared on resolved real paths, is the caller's — anything else, and anything
 * that cannot be resolved, is listed and never touched. The janitor's `-O` is the file-owner check on that side.
 */
export function isMine(target, { platform = process.platform, home } = {}) {
  if (platform === "win32") {
    try {
      return isInsideProfile(fs.realpathSync.native(target), fs.realpathSync.native(home ?? os.userInfo().homedir), path.win32);
    } catch {
      return false;
    }
  }
  try {
    return fs.lstatSync(target).uid === process.getuid();
  } catch {
    return false;
  }
}

/** A scope outside `node:test`: `after(fn)` registers, `close()` runs last-registered-first and never rejects. */
export function cleanupScope() {
  const callbacks = [];
  return {
    after(fn) {
      if (typeof fn !== "function") throw new TypeError("owned: `after` takes a function");
      callbacks.push(fn);
    },
    async close() {
      while (callbacks.length > 0) {
        try {
          await callbacks.pop()();
        } catch (error) {
          warn(`a cleanup callback failed (${messageOf(error)})`);
        }
      }
    },
  };
}

// --- the owner record (rule §3) ---------------------------------------------------------------------------------

/** Field 22 of `/proc/<pid>/stat`, over `btime`, as integer Unix seconds — or `undefined` when it cannot be read. */
export function startFromProcStat(statText, btimeSeconds) {
  if (typeof statText !== "string" || !Number.isFinite(btimeSeconds)) return undefined;
  const close = statText.lastIndexOf(")"); // the command name may hold spaces and parentheses
  if (close < 0) return undefined;
  const fields = statText.slice(close + 1).trim().split(/\s+/); // field 3 is index 0, so field 22 is index 19
  if (fields.length < 20 || !/^\d+$/.test(fields[19])) return undefined;
  return Math.floor(btimeSeconds + Number(fields[19]) / CLOCK_TICKS_PER_SECOND);
}

function readLinuxStart(pid) {
  try {
    const btime = /^btime\s+(\d+)\s*$/m.exec(fs.readFileSync("/proc/stat", "utf8"));
    return btime === null ? undefined : startFromProcStat(fs.readFileSync(`/proc/${pid}/stat`, "utf8"), Number(btime[1]));
  } catch {
    return undefined;
  }
}

/** This process's pid namespace as the decimal inode of `/proc/self/ns/pid` (rule §3), or `undefined` where there is none to read. */
export function readPidNamespace() {
  if (process.platform !== "linux") return undefined;
  try {
    const match = /^pid:\[(\d+)\]$/.exec(fs.readlinkSync("/proc/self/ns/pid"));
    return match === null ? undefined : Number(match[1]);
  } catch {
    return undefined;
  }
}

/** A pid a process can have: a positive safe integer. 0 and the negatives address process GROUPS; the rest address nothing. */
export function isProcessId(pid) {
  return Number.isSafeInteger(pid) && pid > 0;
}

/**
 * Is `pid` alive on this machine? Three NAMED answers, never a flag with an invisible third value:
 * `{ state: "dead" }` (no such process — the ONE answer that means gone), `{ state: "unknown" }` (the query was
 * refused or failed, or `pid` is not a process id at all: nothing is known), or `{ state: "live", start? }` —
 * `start` only on Linux. Never spawns a process, and never signals anything but a real process id.
 */
export function processProbe(pid) {
  if (!isProcessId(pid)) return { state: "unknown" };
  if (process.platform === "win32" && pid === 1) return { state: "unknown" }; // Windows has no pid 1: process.kill says ESRCH, which proves nothing
  try {
    process.kill(pid, 0);
  } catch (error) {
    return { state: error?.code === "ESRCH" ? "dead" : "unknown" };
  }
  const start = process.platform === "linux" ? readLinuxStart(pid) : undefined;
  return start === undefined ? { state: "live" } : { state: "live", start };
}

/** Is the process list possibly hiding other users' processes (`hidepid`)? On Linux, process 1 is always there: when even it is invisible, a missing process proves nothing. */
export function hidepidActive() {
  return process.platform === "linux" && !fs.existsSync("/proc/1");
}

let cachedOwner;

/** A machine's DNS host name as an owner writes it: each run of `@`, `:` or whitespace becomes ONE `-`; nothing is trimmed, the case is kept. `janitor.sh`'s `host_norm` is the same rule, pinned by `owner-conformance.test.mjs`. */
export function hostName(raw) {
  return raw.replace(/[@:\s]+/g, "-");
}

/** The host part of an owner: `hostName(raw)`, and under WSL `~` and the normalised distribution name — distributions share one host name and one Docker daemon but not pid spaces, so another distribution's claim must be another host's. `janitor.sh`'s `host_id` is the same rule. */
export function hostId(raw, distro = "") {
  return distro.trim() === "" ? hostName(raw) : `${hostName(raw)}~${hostName(distro)}`;
}

/** This process: `{ owner, host: "<hostname>@<linux|macos|windows>", pid, start?, ns? }`, computed once. `ns` is Linux's pid namespace and only rides with `start`. Throws on any other platform. */
export function thisOwner() {
  if (cachedOwner !== undefined) return cachedOwner;
  const tag = OS_TAGS[process.platform];
  if (tag === undefined) throw new Error(`owned: no owner shape for platform ${process.platform}`);
  const owner = { owner: thisOwnerToken(), host: `${hostId(os.hostname(), process.env.WSL_DISTRO_NAME ?? "")}@${tag}`, pid: process.pid };
  const start = tag === "linux" ? processProbe(process.pid).start : undefined;
  if (start !== undefined) {
    owner.start = start;
    const ns = readPidNamespace();
    if (ns !== undefined) owner.ns = ns;
  }
  cachedOwner = Object.freeze(owner);
  return cachedOwner;
}

/** `<owner>:<host>:<pid>`, then `:<start>` when there is one, then `:<ns>` — only together with a start. */
export function formatOwner(owner) {
  const start = owner.start === undefined ? "" : `:${owner.start}`;
  const ns = owner.start === undefined || owner.ns === undefined ? "" : `:${owner.ns}`;
  return `${owner.owner}:${owner.host}:${owner.pid}${start}${ns}`;
}

/** The record of the form before the owner segment, `<host>:<pid>[:<start>]` — what an old claim holds. Only the legacy path reads or writes it. */
export function formatLegacyOwner(owner) {
  return `${owner.host}:${owner.pid}${owner.start === undefined ? "" : `:${owner.start}`}`;
}

/** The owner a text names, or `{ unreadable: true }` — git's own `added with --lock` among the latter, and any text longer than `MAX_CLAIM_BYTES`. */
export function parseOwner(text) {
  if (typeof text === "string" && Buffer.byteLength(text) > MAX_CLAIM_BYTES) return { unreadable: true };
  const match = OWNER_TEXT.exec(typeof text === "string" ? text.replace(/\r?\n$/, "") : "");
  if (match === null) return { unreadable: true };
  const owner = { owner: match[1], host: match[2], pid: Number(match[4]) };
  if (match[5] !== undefined) owner.start = Number(match[5]);
  if (match[6] !== undefined) owner.ns = Number(match[6]);
  return owner;
}

/** The old grammar `<host>@<os>:<pid>[:<start>]`, for a LEGACY name's record only: `{ host, pid, start? }` or `{ unreadable: true }`. */
export function parseLegacyOwner(text) {
  if (typeof text === "string" && Buffer.byteLength(text) > MAX_CLAIM_BYTES) return { unreadable: true };
  const match = LEGACY_OWNER_TEXT.exec(typeof text === "string" ? text.replace(/\r?\n$/, "") : "");
  if (match === null) return { unreadable: true };
  const owner = { host: match[1], pid: Number(match[3]) };
  if (match[4] !== undefined) owner.start = Number(match[4]);
  return owner;
}

/**
 * The record a helper writes: the run's own, handed down in `TESTSTODELETE_RUN` when that is set and valid (so what a child
 * makes belongs to the run, not to a helper that exits), else this process's. A value that is not the grammar, or whose owner
 * is not the caller's, is refused — the process's own record is used and one warning says so.
 */
export function runRecord(env = process.env) {
  const given = env.TESTSTODELETE_RUN;
  if (given === undefined || given === "") return thisOwner();
  const parsed = parseOwner(given);
  if (parsed.unreadable === true || parsed.owner !== thisOwner().owner) {
    warn("TESTSTODELETE_RUN is not a record of this user — ignored, this process's own record is used");
    return thisOwner();
  }
  return parsed;
}

/** Write the claim beside `dir` (never inside it). `wx`: a claim that is already there is somebody else's. Returns the text written. */
export function writeOwner(dir) {
  const text = `${formatOwner(runRecord())}\n`;
  fs.writeFileSync(`${dir}.owner`, text, { flag: "wx" });
  return text;
}

/** Remove the claim beside `dir` only while it still holds exactly `written` — a claim another run put there since is not ours to remove. Never throws. */
export function removeClaimIfStill(dir, written) {
  try {
    if (fs.readFileSync(`${dir}.owner`, "utf8") === written) fs.rmSync(`${dir}.owner`, { force: true });
  } catch (error) {
    if (error?.code !== "ENOENT") warn(`could not remove the claim ${dir}.owner (${messageOf(error)}) — left for the start-of-run sweep`);
  }
}

/** The absolute gitdir of a linked worktree at `dir` (its `.git` FILE says `gitdir: <g>`), or "". Never throws. */
export function gitdirOf(dir) {
  try {
    const dotGit = path.join(dir, ".git");
    if (!fs.statSync(dotGit).isFile()) return "";
    const line = /^gitdir:[ \t]*(.*?)[ \t]*$/.exec(fs.readFileSync(dotGit, "utf8").split(/\r?\n/)[0]);
    return line === null || line[1] === "" ? "" : path.resolve(dir, line[1]); // `--relative-paths` writes a relative one
  } catch {
    return "";
  }
}

/**
 * The raw text of a claim or lock file, through the ONE safe read: `null` when there is no file, `{ unreadable: true }` when it is
 * no regular file (a FIFO would block a read forever) or cannot be read, `{ unreadable: true, reason: "foreign-uid" }` when the
 * scope key (`mine`) says the caller does not own it — a stranger's claim is no evidence. At most `MAX_CLAIM_BYTES + 1` bytes are read.
 */
export function readClaimText(file, mine = isMine, { checkOwner = true } = {}) {
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch (error) {
    return error?.code === "ENOENT" ? null : { unreadable: true };
  }
  if (!stat.isFile()) return { unreadable: true };
  if (checkOwner && !mine(file)) return { unreadable: true, reason: "foreign-uid" };
  try {
    const fd = fs.openSync(file, "r");
    try {
      const buffer = Buffer.alloc(MAX_CLAIM_BYTES + 1);
      const read = fs.readSync(fd, buffer, 0, buffer.length, 0);
      return buffer.toString("utf8", 0, read);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return { unreadable: true };
  }
}

/** The record in `file`: the text of `readClaimText` parsed, or its `null` / `{ unreadable }` answer as it is. */
function readRecordFile(file, mine, options) {
  const read = readClaimText(file, mine, options);
  return typeof read === "string" ? parseOwner(read) : read;
}

function readFolderOwner(target, mine) {
  return readRecordFile(`${target}.owner`, mine);
}

function readWorktreeOwner(target, mine) {
  try {
    if (!fs.statSync(path.join(target, ".git")).isFile()) return null; // a repository rooted here, not a linked worktree
  } catch {
    return null;
  }
  const gitdir = gitdirOf(target);
  if (gitdir === "" || !fs.existsSync(gitdir)) return { unreadable: true }; // a deleted clone: fail closed, never "unmarked"
  // The lock lives in the clone, which is the caller's own repository (the sweep reads it from the caller's `git worktree list`) and
  // may sit outside the profile on Windows; POSIX still requires the caller's uid on the file, and the worktree FOLDER is judged by `mine`.
  return readRecordFile(path.join(gitdir, "locked"), mine, { checkOwner: process.platform !== "win32" });
}

/** `null` (unmarked), an owner, or `{ unreadable: true }`. `kind` is "folder" (sibling claim) or "worktree" (lock reason). */
export function readOwner(target, kind, { mine = isMine } = {}) {
  if (kind === "folder") return readFolderOwner(target, mine);
  if (kind === "worktree") return readWorktreeOwner(target, mine);
  throw new TypeError(`owned: unknown kind ${JSON.stringify(kind)}`);
}

/**
 * Rule §3's order, for a record of the owner form. `facts`: `callerOwner` (default: this process's token), `nameOwner` (the
 * owner segment of the resource's name), `kernelMine` (the kernel owner is the caller — `false` makes it unknown), `hidepid`.
 * Unreadable/unmarked → unknown; the record's owner not the caller's, or not the name's → unknown; the kernel owner another's →
 * unknown; foreign host → unknown; on a Linux reader a record without a namespace, or in another one → unknown; a pid no process
 * can have → unknown; `state: "dead"` (no such pid) → gone — unless the process list may hide others' → unknown; a refused or
 * failed query → unknown; alive → live, or unknown when both starts differ by more than the tolerance.
 */
export function ownerState(owner, probe = processProbe, facts = {}) {
  if (owner === null || owner === undefined || owner.unreadable === true) return "unknown";
  const me = thisOwner();
  if (owner.owner !== (facts.callerOwner ?? me.owner)) return "unknown";
  if (facts.nameOwner !== undefined && facts.nameOwner !== owner.owner) return "unknown";
  if (facts.kernelMine === false) return "unknown";
  if (owner.host.toLowerCase() !== me.host.toLowerCase()) return "unknown";
  if (me.host.toLowerCase().endsWith("@linux") && (owner.ns === undefined || owner.ns !== me.ns)) return "unknown"; // two namespaces can share a host name, never a pid space
  if (!isProcessId(owner.pid)) return "unknown"; // pid 0, a negative, a fraction or one past 2^53 is no process: never asked, never gone
  if (owner.pid === 1 && owner.host.toLowerCase().endsWith("@windows")) return "unknown"; // Windows has no pid 1; a bash started by a native process reports it for itself and its parent
  let seen;
  try {
    seen = probe(owner.pid);
  } catch {
    return "unknown";
  }
  if (seen?.state === "dead") return (facts.hidepid ?? hidepidActive()) ? "unknown" : "gone"; // the one answer that deletes: no process has that pid, in a list that hides none
  if (seen?.state !== "live") return "unknown"; // unknown, refused, failed, silent or in any other shape (a bare `alive: false` too)
  if (owner.start === undefined || seen.start === undefined) return "live"; // pid reuse then PRESERVES
  return Math.abs(owner.start - seen.start) <= START_TOLERANCE_S ? "live" : "unknown"; // a mismatch is never proof of death
}

/** The legacy record's liveness, for a LEGACY name the caller owns: the same procedure on `{ host, pid, start? }` (no owner, no namespace). */
export function legacyOwnerState(owner, probe = processProbe, facts = {}) {
  if (owner === null || owner === undefined || owner.unreadable === true) return "unknown";
  // §3: on a Linux reader a record without a pid namespace is unknown. A legacy record never has one, so on Linux it is ALWAYS unknown —
  // its pid may live in a container whose pid space this process cannot see. Substituting our own namespace would erase that rule.
  if ((facts.platform ?? process.platform) === "linux") return "unknown";
  const me = thisOwner();
  return ownerState({ ...owner, owner: me.owner, ns: me.ns }, probe, { ...facts, callerOwner: me.owner });
}

// --- creation and removal ------------------------------------------------------------------------------------

/** Remove a link (symlink or Windows junction) and never what it points at. Refuses anything that is not a link. */
export function removeLink(link) {
  if (!fs.lstatSync(link).isSymbolicLink()) throw new Error(`owned: ${link} is not a link`);
  if (process.platform !== "win32") {
    fs.unlinkSync(link);
    return;
  }
  try {
    fs.rmdirSync(link); // a junction or a directory symlink
  } catch (error) {
    if (error?.code !== "ENOTDIR") throw error;
    fs.unlinkSync(link); // a file symlink
  }
}

/** Remove `dir`, then its `.owner` sibling. Never throws; on failure the leftover stays prefixed AND claimed, with one warning. */
export function removeQuietly(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch (error) {
    warn(`could not remove ${dir} (${messageOf(error)}) — left for the start-of-run sweep`);
    return false; // the claim stays with it
  }
  return removeClaim(dir);
}

/** Remove only the claim beside `dir` (the helper's own, whose folder was never made by it). Never throws. */
export function removeClaim(dir) {
  const sibling = `${dir}.owner`;
  try {
    fs.rmSync(sibling, { force: true });
  } catch (error) {
    warn(`could not remove ${sibling} (${messageOf(error)}) — left for the start-of-run sweep`);
    return false;
  }
  return true;
}

/**
 * A folder `testsToDelete-<owner>-<repo>-<what>-<id>` in `parent`, removed with its sibling claim when `scope` ends. The order
 * is rule §2's: the claim is written FIRST with an exclusive create (a claim already there is somebody else's name — draw a new
 * id), the cleanup is registered as the very next statement, and only then is the folder made, exclusively (`mkdir`, never a
 * create that succeeds on an existing folder). A folder already there under the claimed name is a squatter's: never adopted,
 * never removed — one warning names it, this run's claim is removed again at once (only while it still holds exactly what was
 * written), and a new id is drawn.
 */
export function ownedDir(scope, what, options) {
  return dirFor(REPO_TOKEN, scope, what, options);
}

function dirFor(token, scope, what, { parent = tempRoot() } = {}) {
  checkScope(scope);
  const prefix = prefixFor(token, what);
  for (let draw = 0; draw < MAX_DRAWS; draw += 1) {
    const dir = path.resolve(parent, prefix + randomId());
    let written;
    try {
      written = writeOwner(dir);
    } catch (error) {
      if (error?.code === "EEXIST") continue; // somebody else's claim on this name
      throw new Error(`owned: could not claim ${dir}: ${messageOf(error)}`, { cause: error });
    }
    const made = { folder: false, claimed: true };
    scope.after(() => { // the very next statement: claim → register → create
      if (made.folder) removeQuietly(dir);
      else if (made.claimed) removeClaim(dir);
    });
    try {
      fs.mkdirSync(dir);
    } catch (error) {
      if (error?.code !== "EEXIST") throw new Error(`owned: could not create ${dir}: ${messageOf(error)}`, { cause: error });
      warn(`${dir} already exists under the name this run claimed — it is not this run's and is left alone; drawing another name`);
      made.claimed = false; // the claim goes before another id is drawn, so a claim of a run that dies later can never govern a folder this run did not create
      removeClaimIfStill(dir, written);
      continue;
    }
    made.folder = true;
    return dir;
  }
  throw new Error(`owned: no free name for ${JSON.stringify(what)} in ${parent} after ${MAX_DRAWS} draws`);
}

function attempt(label, step, { quiet = false } = {}) {
  try {
    step();
    return true;
  } catch (error) {
    if (!quiet) warn(`${label} failed (${messageOf(error)})`);
    return false;
  }
}

function tearDownWorktree(repo, worktree, hooks) {
  let hooksSucceeded = true;
  for (const hook of hooks) {
    hooksSucceeded = attempt(`beforeRemove for ${worktree}`, hook) && hooksSucceeded;
  }
  const repoStands = fs.existsSync(repo); // node:test runs `after` hooks first-registered-first: the repository can be gone already
  if (repoStands) {
    attempt("unlock", () => git(repo, "worktree", "unlock", worktree), { quiet: true }); // already unlocked is not news
    attempt(`worktree remove ${worktree}`, () => git(repo, "worktree", "remove", "--force", "--force", worktree));
  }
  if (hooksSucceeded && fs.existsSync(worktree)) removeQuietly(worktree); // git leaves a directory that held a junction
  if (!hooksSucceeded) warn(`${worktree} may still hold a link; left for the start-of-run sweep`);
  if (repoStands) attempt("worktree prune", () => git(repo, "worktree", "prune"));
}

/**
 * A detached worktree of `repo` at `ref`, named `testsToDelete-<owner>-<repo>-<what>-<id>` directly in `parent`, locked
 * with the run's record as the reason (create and claim are one command; a path that already exists makes git refuse, and
 * nothing is adopted). `beforeRemove(fn)` adds a step that must succeed before the directory is removed — the junction
 * unlink; if one fails the directory is left alone.
 */
export function ownedWorktree(scope, repo, what, options) {
  return worktreeFor(REPO_TOKEN, scope, repo, what, options);
}

function worktreeFor(token, scope, repo, what, { ref = "HEAD", parent = tempRoot() } = {}) {
  checkScope(scope);
  const reason = formatOwner(runRecord());
  const worktree = path.resolve(parent, nameFor(token, what));
  git(repo, "worktree", "add", "--detach", "--lock", "--reason", reason, worktree, ref);
  const hooks = [];
  scope.after(() => tearDownWorktree(repo, worktree, hooks)); // the very next statement
  return { path: worktree, beforeRemove: (fn) => { hooks.push(fn); } };
}

// --- a consumer's token (decision 11) ----------------------------------------------------------------------------

// The functions that do not depend on the token: a name's version, the owner record, liveness, removal. `ownedFor` hands them on as they are.
// A test enumerates the module's own exports against this list and the six bound ones, so a function added above and forgotten here is red.
const TOKEN_FREE = {
  tempRoot, asciiLower, windowsOwnerToken, ownerToken, thisOwnerToken, classifyName, isInsideProfile, isMine, cleanupScope, startFromProcStat,
  readPidNamespace, isProcessId, processProbe, hidepidActive, hostName, hostId, thisOwner, formatOwner, formatLegacyOwner, parseOwner,
  parseLegacyOwner, runRecord, writeOwner, removeClaimIfStill, gitdirOf, readClaimText, readOwner, ownerState, legacyOwnerState, removeLink,
  removeQuietly, removeClaim,
};

/** `token` or a TypeError naming the legal shape: `[a-z0-9]{2,12}`, and never of the owner grammar (a token that read as an owner would make every name ambiguous, rule §1). */
function checkToken(token) {
  if (typeof token !== "string" || !TOKEN_SHAPE.test(token) || OWNER_GRAMMAR.test(token)) {
    throw new TypeError(`owned: \`token\` must match ${TOKEN_SHAPE} and must not be of the owner grammar ${OWNER_GRAMMAR}, got ${JSON.stringify(token)}`);
  }
}

/** `row` is the "repository" column of the token's row in the rule's `## Tokens` table: one non-blank line, or absent. */
function checkRow(row) {
  if (row !== undefined && (typeof row !== "string" || row.trim() === "" || CONTROL.test(row))) {
    throw new TypeError(`owned: \`row\` must be one non-blank line of text (the "repository" column of the token's row), got ${JSON.stringify(row)}`);
  }
}

/**
 * This helper bound to ANOTHER repository's token — what a consumer wraps, instead of porting the file. `token` is that repository's
 * row of the rule's `## Tokens` table (`[a-z0-9]{2,12}`, not of the owner grammar); `row` is its "repository" column, which the
 * guard takes as `--identity`. The result holds every function of this module: the six whose behaviour depends on the token
 * (`ownedPrefix`, `ownedPattern`, `legacyPattern`, `ownedName`, `ownedDir`, `ownedWorktree`) are bound to `token`, the others
 * are this module's own, so one object is the whole API. The plain exports stay bound to `REPO_TOKEN`: nothing here changes them.
 */
export function ownedFor({ token, row } = {}) {
  checkToken(token);
  checkRow(row);
  return Object.freeze({
    token,
    row,
    ownedPrefix: (what) => prefixFor(token, what),
    ownedPattern: (owner) => patternFor(token, owner),
    legacyPattern: () => legacyPatternFor(token),
    ownedName: (what) => nameFor(token, what),
    ownedDir: (scope, what, options) => dirFor(token, scope, what, options),
    ownedWorktree: (scope, repo, what, options) => worktreeFor(token, scope, repo, what, options),
    ...TOKEN_FREE,
  });
}
