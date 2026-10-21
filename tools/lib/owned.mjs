// Owned test resources: the Node encoding of `common/test-leftovers.md` §1–§3 for this repository.
//
// What it owns. Every temp folder or git worktree a test here makes goes through `ownedDir` / `ownedWorktree`:
// the name comes from one constant (`REPO_TOKEN`, rule §1), the cleanup is registered on the NEXT statement
// after the resource exists, and only then is the claim written. If the claim cannot be written the resource is
// removed and the call throws — so "unmarked and old" can only ever mean "nobody's" (rule §2), which is what
// the start-of-run sweep (S3) rests on.
//
// Why registration comes before the claim. A throw between create and register would leak an unclaimed folder;
// a throw between register and claim leaks nothing (the registered teardown removes it). Order is the whole
// safety: create → register → claim.
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
// Starts. The owner carries the process start time only where the OS gives it WITHOUT spawning a process: a
// `/proc` read on Linux. Windows and macOS write the two-field form, and a reader that has no start on either
// side treats an alive pid as live — pid reuse then PRESERVES, the safe direction. Nothing here spawns
// PowerShell or `ps`, and nothing uses Node's own clock (`performance.timeOrigin`) as a start.
//
// Three answers, never two. "No process has that pid" is the ONLY thing that makes an owner `gone`: a query that
// was refused or failed, and two starts that disagree by more than the tolerance (a reused pid, or a skewed clock),
// are `unknown` — the resource is kept and named, never deleted on a guess (rule §3).

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { git } from "./git.mjs";

export const PREFIX = "testsToDelete-";                              // rule §1
export const REPO_TOKEN = "conventions";                             // rule §1 — the ONLY place the token is written
export const REPO_ROW = "the shared-rules repository";                // rule §1 — the `## Tokens` row (its repository column) that names THIS repository: a token is only this repository's if its row says so
export const OWNED = `${PREFIX}${REPO_TOKEN}-`;
export const OWNED_PATTERN = /^teststodelete[-_]conventions[-_]/i;   // what this repository's sweep matches (rule §1, §4)
export const MAX_NAME = 63;                                          // rule §1
export const ID_LENGTH = 6;                                          // mkdtemp's six (D1)
export const START_TOLERANCE_S = 2;                                  // rule §3

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CONTROL = /[\u0000-\u001f\u007f]/;
const OWNER_TEXT = /^([^@:\s]+@(linux|macos|windows)):(\d+)(?::(\d+))?$/;
const OS_TAGS = { linux: "linux", darwin: "macos", win32: "windows" };
const CLOCK_TICKS_PER_SECOND = 100; // `CLK_TCK` on every Linux this family runs on; reading it would spawn `getconf`

/** The one place a test learns the temp root (S4's `raw-temp` class refuses every other spelling). */
export function tempRoot() {
  return os.tmpdir();
}

function warn(message) {
  process.stderr.write(`owned: ${message}\n`);
}

function messageOf(error) {
  return error?.code ?? error?.message ?? String(error);
}

function checkWhat(what) {
  if (typeof what !== "string" || what === "") throw new TypeError(`owned: \`what\` must be a non-empty string, got ${JSON.stringify(what)}`);
  if (/[/\\]/.test(what) || CONTROL.test(what)) throw new TypeError(`owned: \`what\` may not hold a path separator or a control character: ${JSON.stringify(what)}`);
  if (what.startsWith("-")) throw new TypeError(`owned: \`what\` may not start with "-": ${JSON.stringify(what)}`);
  if (OWNED.length + what.length + 1 + ID_LENGTH > MAX_NAME) {
    throw new TypeError(`owned: the whole name would pass ${MAX_NAME} characters — \`what\` is ${what.length}, the most is ${MAX_NAME - OWNED.length - 1 - ID_LENGTH}: ${JSON.stringify(what)}`);
  }
}

function checkScope(scope) {
  if (typeof scope?.after !== "function") throw new TypeError("owned: `scope` must have an `after(fn)` method (a node:test context or a cleanupScope())");
}

/** `testsToDelete-<repo>-<what>-` — the part of the name before the random id. */
export function ownedPrefix(what) {
  checkWhat(what);
  return `${OWNED}${what}-`;
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

/** A fresh, unused name: the prefix plus six random characters of [A-Za-z0-9]. */
export function ownedName(what) {
  return ownedPrefix(what) + randomId();
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

// --- the owner -----------------------------------------------------------------------------------------------

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

let cachedOwner;

/** A machine's DNS host name as an owner writes it: each run of `@`, `:` or whitespace becomes ONE `-`; nothing is trimmed, the case is kept. `janitor.sh`'s `host_norm` is the same rule, pinned by `owner-conformance.test.mjs`. */
export function hostName(raw) {
  return raw.replace(/[@:\s]+/g, "-");
}

/** The host part of an owner: `hostName(raw)`, and under WSL `~` and the normalised distribution name — distributions share one host name and one Docker daemon but not pid spaces, so another distribution's claim must be another host's. `janitor.sh`'s `host_id` is the same rule. */
export function hostId(raw, distro = "") {
  return distro.trim() === "" ? hostName(raw) : `${hostName(raw)}~${hostName(distro)}`;
}

/** This process:`{ host: "<hostname>@<linux|macos|windows>", pid, start? }`, computed once. Throws on any other platform. */
export function thisOwner() {
  if (cachedOwner !== undefined) return cachedOwner;
  const tag = OS_TAGS[process.platform];
  if (tag === undefined) throw new Error(`owned: no owner shape for platform ${process.platform}`);
  const owner = { host: `${hostId(os.hostname(), process.env.WSL_DISTRO_NAME ?? "")}@${tag}`, pid: process.pid };
  const start = tag === "linux" ? processProbe(process.pid).start : undefined;
  if (start !== undefined) owner.start = start;
  cachedOwner = Object.freeze(owner);
  return cachedOwner;
}

/** `<host>:<pid>` plus `:<start>` when there is one. */
export function formatOwner(owner) {
  return `${owner.host}:${owner.pid}${owner.start === undefined ? "" : `:${owner.start}`}`;
}

/** The longest claim a reader accepts, in bytes, line end included. `janitor.sh` reads 513 bytes of a claim file to see one past it. */
export const MAX_CLAIM_BYTES = 512;

/** The owner a text names, or `{ unreadable: true }` — git's own `added with --lock` among the latter, and any text longer than `MAX_CLAIM_BYTES`. */
export function parseOwner(text) {
  if (typeof text === "string" && Buffer.byteLength(text) > MAX_CLAIM_BYTES) return { unreadable: true };
  const match = OWNER_TEXT.exec(typeof text === "string" ? text.replace(/\r?\n$/, "") : "");
  if (match === null) return { unreadable: true };
  const owner = { host: match[1], pid: Number(match[3]) };
  if (match[4] !== undefined) owner.start = Number(match[4]);
  return owner;
}

/** Write the claim beside `dir` (never inside it). `wx`: a claim that is already there is somebody else's. */
export function writeOwner(dir) {
  fs.writeFileSync(`${dir}.owner`, `${formatOwner(thisOwner())}\n`, { flag: "wx" });
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

function readFolderOwner(target) {
  try {
    return parseOwner(fs.readFileSync(`${target}.owner`, "utf8"));
  } catch (error) {
    return error?.code === "ENOENT" ? null : { unreadable: true };
  }
}

function readWorktreeOwner(target) {
  try {
    if (!fs.statSync(path.join(target, ".git")).isFile()) return null; // a repository rooted here, not a linked worktree
  } catch {
    return null;
  }
  const gitdir = gitdirOf(target);
  if (gitdir === "" || !fs.existsSync(gitdir)) return { unreadable: true }; // a deleted clone: fail closed, never "unmarked"
  try {
    return parseOwner(fs.readFileSync(path.join(gitdir, "locked"), "utf8"));
  } catch (error) {
    return error?.code === "ENOENT" ? null : { unreadable: true };
  }
}

/** `null` (unmarked), an owner, or `{ unreadable: true }`. `kind` is "folder" (sibling claim) or "worktree" (lock reason). */
export function readOwner(target, kind) {
  if (kind === "folder") return readFolderOwner(target);
  if (kind === "worktree") return readWorktreeOwner(target);
  throw new TypeError(`owned: unknown kind ${JSON.stringify(kind)}`);
}

/** Rule §3's order: unreadable/unmarked → unknown; foreign host → unknown; a pid no process can have → unknown; `state: "dead"` (no such pid) → gone; a refused or failed query → unknown; alive → live, or unknown when both starts differ by more than the tolerance. */
export function ownerState(owner, probe = processProbe) {
  if (owner === null || owner === undefined || owner.unreadable === true) return "unknown";
  if (owner.host.toLowerCase() !== thisOwner().host.toLowerCase()) return "unknown";
  if (!isProcessId(owner.pid)) return "unknown"; // pid 0, a negative, a fraction or one past 2^53 is no process: never asked, never gone
  if (owner.pid === 1 && owner.host.toLowerCase().endsWith("@windows")) return "unknown"; // Windows has no pid 1; a bash started by a native process reports it for itself and its parent
  let seen;
  try {
    seen = probe(owner.pid);
  } catch {
    return "unknown";
  }
  if (seen?.state === "dead") return "gone"; // the one answer that deletes: no process has that pid
  if (seen?.state !== "live") return "unknown"; // unknown, refused, failed, silent or in any other shape (a bare `alive: false` too)
  if (owner.start === undefined || seen.start === undefined) return "live"; // pid reuse then PRESERVES
  return Math.abs(owner.start - seen.start) <= START_TOLERANCE_S ? "live" : "unknown"; // a mismatch is never proof of death
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
  const sibling = `${dir}.owner`;
  try {
    fs.rmSync(sibling, { force: true });
  } catch (error) {
    warn(`could not remove ${sibling} (${messageOf(error)}) — left for the start-of-run sweep`);
    return false;
  }
  return true;
}

/** A folder `testsToDelete-<repo>-<what>-<id>` in `parent`, claimed by a sibling `.owner`, removed when `scope` ends. */
export function ownedDir(scope, what, { parent = tempRoot() } = {}) {
  checkScope(scope);
  const prefix = ownedPrefix(what);
  const dir = path.resolve(fs.mkdtempSync(path.join(parent, prefix)));
  scope.after(() => removeQuietly(dir)); // the very next statement: create → register → claim
  try {
    writeOwner(dir);
  } catch (error) {
    removeQuietly(dir);
    throw new Error(`owned: could not claim ${dir}: ${messageOf(error)}`, { cause: error });
  }
  return dir;
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
 * A detached worktree of `repo` at `ref`, named `testsToDelete-<repo>-<what>-<id>` directly in `parent`, locked
 * with the owner as the reason (create and claim are one command). `beforeRemove(fn)` adds a step that must
 * succeed before the directory is removed — the junction unlink; if one fails the directory is left alone.
 */
export function ownedWorktree(scope, repo, what, { ref = "HEAD", parent = tempRoot() } = {}) {
  checkScope(scope);
  const reason = formatOwner(thisOwner());
  const worktree = path.resolve(parent, ownedName(what));
  git(repo, "worktree", "add", "--detach", "--lock", "--reason", reason, worktree, ref);
  const hooks = [];
  scope.after(() => tearDownWorktree(repo, worktree, hooks)); // the very next statement
  return { path: worktree, beforeRemove: (fn) => { hooks.push(fn); } };
}
