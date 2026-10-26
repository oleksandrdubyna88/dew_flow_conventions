// The start-of-run sweep: the Node encoding of `common/test-leftovers.md` §4 for this repository.
//
// Scope selects, liveness authorises, uncertainty preserves. A resource is removed only on TWO keys, both required:
//   scope        its name's owner, its record's owner and the caller's token are ONE, this repository's token is its
//                own, and the kernel owner of the folder (and of its claim) is the caller (`isMine`);
//   abandonment  the record's liveness is `gone` — no process has that pid, in a process list that hides none.
// Everything else is kept and named: `young` (the age is a SELECTOR that keeps the sweep off a resource between
// creation and claim, never an authority), `live`, `foreign host`, `unknown`, `unreadable`, `foreign-uid` (another uid owns
// it, whatever its name says), `unmarked` (an owner-form resource with no claim is nobody's the helper knows — it is
// listed, never collected, however old), `other clone` (a folder holding a `.git` FILE that this repository's own
// `git worktree list` does not show is some other clone's worktree), `legacy` and `replaced`.
//
// The lists. What a sweep may not touch it still says: `foreign:` (another owner's resource of this repository's token),
// `legacy:` (a name from before the owner segment, with the exact command a person would run) and `unmarked:`. They go in
// `result.listed` and never change anything.
//
// Removal is by identity, never by a name read earlier. A PLAIN folder: its `(dev, ino)` and its claim are re-checked, it
// is renamed atomically to the sibling `.<name>.teststodelete-quarantine-<pid>-<hex>` (same parent, so never across a file
// system; a leading `.` so no prefix match reaches it), checked again there, and only then removed — what changed in between
// is renamed back and named `replaced`. A WORKTREE is never renamed (a rename breaks its gitdir pointers): the same
// identity and lock-reason re-check, then `git worktree remove --force --force`. A quarantine a killed sweep left is
// restored under its name when that is free, and reported `quarantine-conflict` when it is taken — never over an existing
// folder. A tree's top-level links (a `node_modules` junction) are unlinked BEFORE anything is removed, so a removal can never
// follow one into its target.
//
// Order. Quarantine restores, worktrees (only those this repository lists), folders, orphaned claims. Never throws: every
// failure is an `errors` entry, and the caller decides what to print — a sweep never changes a run's exit code.

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { git } from "./git.mjs";
import {
  REPO_TOKEN, classifyName, gitdirOf, isMine, legacyOwnerState, ownerState, parseLegacyOwner, parseOwner, processProbe, readClaimText, readOwner,
  removeLink, removeQuietly, tempRoot, thisOwner, thisOwnerToken,
} from "./owned.mjs";

export const MIN_AGE_MS = 10 * 60_000; // rule §4: ten minutes

const OWNER_SUFFIX = ".owner";
const QUARANTINE = /^\.(.+)\.teststodelete-quarantine-(\d+)-([0-9a-f]+)$/i;

/** One line saying what went wrong: an errno code, or the first line of the message. */
function messageOf(error) {
  return String(error?.code ?? error?.message ?? error).split(/\r?\n/)[0];
}

const same = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

/** The worktrees `git worktree list --porcelain` shows, the main one first: `{ path, locked?: string }`. */
export function listWorktrees(repo) {
  return git(repo, "worktree", "list", "--porcelain").split(/\r?\n\r?\n/).flatMap((block) => {
    const lines = block.split(/\r?\n/);
    const head = lines.find((line) => line.startsWith("worktree "));
    const lock = lines.find((line) => line === "locked" || line.startsWith("locked "));
    return head === undefined ? [] : [{ path: path.resolve(head.slice("worktree ".length)), locked: lock?.slice("locked".length).trim() }];
  });
}

/** What a name says about whose it is, for THIS repository: `own` (the caller's), `foreign` (another owner's), `legacy` (before the owner segment) or `other` (not this repository's business). */
function relationOf(name, owner) {
  const parsed = classifyName(name);
  if (parsed.form === "owner") {
    if (parsed.token !== REPO_TOKEN) return { relation: "other" };
    return parsed.owner === owner ? { relation: "own", nameOwner: parsed.owner } : { relation: "foreign", nameOwner: parsed.owner };
  }
  return parsed.form === "legacy" && parsed.token === REPO_TOKEN ? { relation: "legacy" } : { relation: "other" };
}

/** Rule §4's table for one own-scope candidate: `{ remove: true }` or `{ remove: false, reason }`. */
function decide({ owner, ageMs, minAgeMs, state, mine, nameOwner }) {
  if (ageMs < minAgeMs) return { remove: false, reason: "young" };
  if (!mine) return { remove: false, reason: "foreign-uid" };
  if (owner === null || owner === undefined) return { remove: false, reason: "unmarked" };
  if (owner.unreadable === true) return { remove: false, reason: owner.reason ?? "unreadable" };
  const seen = state(owner, nameOwner);
  if (seen === "gone") return { remove: true };
  if (seen === "live") return { remove: false, reason: "live" };
  return { remove: false, reason: owner.host.toLowerCase() === thisOwner().host.toLowerCase() ? "unknown" : "foreign host" };
}

/** Age in ms; a directory that is not there is old (prune handles its registration). */
function ageOf(target, now) {
  try {
    return now - fs.statSync(target).mtimeMs;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/** Is the quarantine as old as the window by BOTH stamps — its rename (ctime) and its last deletion (mtime)? What cannot be stat-ed is not old. */
function pastWindow(target, now, minAgeMs) {
  try {
    const stat = fs.lstatSync(target);
    return now - stat.ctimeMs >= minAgeMs && now - stat.mtimeMs >= minAgeMs;
  } catch {
    return false;
  }
}

/** Unlink every top-level symbolic link (a junction included) and never what it points at. */
function unlinkTopLevelLinks(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.lstatSync(full).isSymbolicLink()) removeLink(full);
  }
}

function hasGitFile(dir) {
  try {
    return fs.lstatSync(path.join(dir, ".git")).isFile();
  } catch {
    return false;
  }
}

/** The owner a porcelain lock line names, for a tree whose directory is already gone. */
function ownerFromLock(locked) {
  return locked === undefined ? null : parseOwner(locked);
}

// --- identity ---------------------------------------------------------------------------------------------------

/** `{ dev, ino, directory }` of an entry itself (a link is not followed), or `undefined` when it is not there. */
function identityOf(target) {
  try {
    const stat = fs.lstatSync(target, { bigint: true });
    return { dev: stat.dev, ino: stat.ino, directory: stat.isDirectory() };
  } catch {
    return undefined;
  }
}

const sameIdentity = (a, b) => a !== undefined && b !== undefined && a.dev === b.dev && a.ino === b.ino && a.directory === b.directory;

/** The text of a folder's claim or a worktree's lock reason now, or `null` (none) — what "the claim is still the one I judged" compares. */
const UNREADABLE = "\0unreadable"; // what a claim that is no regular file, is another uid's, or cannot be read compares as

function claimTextOf(target, kind, mine = isMine) {
  const read = kind === "worktree"
    ? readClaimText(path.join(gitdirOf(target) || path.join(target, ".no-gitdir"), "locked"), mine, { checkOwner: process.platform !== "win32" })
    : readClaimText(`${target}${OWNER_SUFFIX}`, mine); // the ONE safe read: lstat, regular file, the caller's, at most 513 bytes — never a FIFO, never a stranger's claim
  if (typeof read === "string") return read;
  return read === null ? null : UNREADABLE;
}

/** What identifies a candidate at the moment BEFORE it is judged: its device and inode, then its claim text. */
function capture(target, kind, mine = isMine) {
  const identity = identityOf(target);
  return { identity, claim: claimTextOf(target, kind, mine), mine };
}

/** Is what is at `target` still what was judged? */
function unchanged(target, kind, captured) {
  return sameIdentity(identityOf(target), captured.identity) && claimTextOf(target, kind, captured.mine) === captured.claim;
}

function quarantineName(dir) {
  return path.join(path.dirname(dir), `.${path.basename(dir)}.teststodelete-quarantine-${process.pid}-${crypto.randomBytes(4).toString("hex")}`);
}

/**
 * Put a quarantined folder back under `original` only if that name is FREE; `false` when it is taken (or cannot be had). Where the
 * name was reserved with an empty folder and the rename then failed, the placeholder is removed — only while it is still a real folder
 * of the caller's AND empty (`rmdir` refuses a folder that has anything in it): a name taken over in between is never touched, and the
 * quarantine stays, listed, instead of being orphaned behind a claim nobody can read.
 */
function restoreOnto(quarantined, original, mine, hooks = {}) {
  if (process.platform === "win32") {
    try {
      fs.renameSync(quarantined, original); // a directory rename onto an existing one fails here: the move is exclusive by itself
      return true;
    } catch {
      return false;
    }
  }
  try {
    fs.mkdirSync(original, { mode: 0o700 }); // exclusive: an existing folder or file under the name refuses
  } catch {
    return false;
  }
  try {
    hooks.afterReserve?.(original, quarantined);
    fs.renameSync(quarantined, original);
    return true;
  } catch {
    removeOwnEmptyPlaceholder(original, mine);
    return false;
  }
}

function removeOwnEmptyPlaceholder(placeholder, mine) {
  try {
    if (fs.lstatSync(placeholder).isDirectory() && mine(placeholder)) fs.rmdirSync(placeholder);
  } catch { /* gone, or not empty, or not ours: leave it */ }
}

/**
 * Remove a plain folder by identity: re-check `(dev, ino)` and its claim, rename it away atomically, check it again where it
 * is, remove it, then its claim. A change in between renames it back (onto its own name, only if still free) and says `replaced`.
 * `{ removed: true }` or `{ removed: false, reason }`.
 */
function removeFolderByIdentity(dir, captured, hooks) {
  hooks.afterVerdict?.(dir);
  if (!unchanged(dir, "folder", captured)) return { removed: false, reason: "replaced" };
  const quarantine = quarantineName(dir);
  fs.renameSync(dir, quarantine);
  hooks.afterRename?.(dir, quarantine);
  if (!sameIdentity(identityOf(quarantine), captured.identity) || claimTextOf(dir, "folder", captured.mine) !== captured.claim) {
    if (!restoreOnto(quarantine, dir, captured.mine, hooks)) return { removed: false, reason: "quarantine-conflict", path: quarantine };
    return { removed: false, reason: "replaced" };
  }
  unlinkTopLevelLinks(quarantine);
  if (!removeQuietly(quarantine)) throw new Error("it could not be removed");
  fs.rmSync(`${dir}${OWNER_SUFFIX}`, { force: true });
  return { removed: true };
}

function removeWorktree(repo, worktree, captured, hooks) {
  hooks.afterVerdict?.(worktree);
  if (fs.existsSync(worktree) && !unchanged(worktree, "worktree", captured)) return { removed: false, reason: "replaced" };
  if (fs.existsSync(worktree)) unlinkTopLevelLinks(worktree);
  try {
    git(repo, "worktree", "unlock", worktree);
  } catch { /* not locked is not news */ }
  let failure;
  try {
    git(repo, "worktree", "remove", "--force", "--force", worktree); // never a rename: it would break the gitdir pointers
  } catch (error) {
    failure = error;
  }
  if (fs.existsSync(worktree)) removeQuietly(worktree); // git leaves a directory that held a junction
  if (fs.existsSync(worktree)) throw new Error(`could not remove it${failure === undefined ? "" : ` (${messageOf(failure)})`}`);
  return { removed: true };
}

// --- the lists --------------------------------------------------------------------------------------------------

/** The command a person would run to remove a legacy resource by hand, for this platform. */
function legacyCommand(kind, target) {
  if (kind === "worktree") return `git worktree remove --force --force ${shellQuote(target)}`;
  if (process.platform === "win32") return `Remove-Item -Recurse -Force ${shellQuote(target)}, ${shellQuote(`${target}${OWNER_SUFFIX}`)}`;
  return `rm -rf -- ${shellQuote(target)} ${shellQuote(`${target}${OWNER_SUFFIX}`)}`;
}

function shellQuote(text) {
  return process.platform === "win32" ? `'${text.replaceAll("'", "''")}'` : `'${text.replaceAll("'", "'\\''")}'`;
}

/** The sweep's reporting: a preserved entry, and (for what is not the caller's to remove) one listed line. */
function reporter(result) {
  const lines = {
    foreign: (kind, target, owner) => result.listed.push(`foreign: ${kind} ${path.basename(target)} — owner ${owner}`),
    legacy: (kind, target) => result.listed.push(`legacy: ${kind} ${path.basename(target)} — remove with: ${legacyCommand(kind, target)}`),
    unmarked: (kind, target) => result.listed.push(`unmarked: ${kind} ${path.basename(target)}`),
  };
  return {
    ...lines,
    keep: (target, reason) => result.preserved.push({ path: target, reason }),
    explain(kind, target, reason, nameOwner) {
      this.keep(target, reason);
      if (reason === "unmarked") lines.unmarked(kind, target);
      if (reason === "foreign-uid") lines.foreign(kind, target, nameOwner);
    },
  };
}

// --- the passes -------------------------------------------------------------------------------------------------

/** The legacy verdict of a folder or worktree: the old-grammar record and its liveness, kernel owner first. */
function decideLegacy({ kind, target, locked, ageMs, minAgeMs, probe, mine, platform }) {
  if (ageMs < minAgeMs) return { remove: false, reason: "young" };
  if (!mine(target)) return { remove: false, reason: "legacy" };
  const text = kind === "worktree" ? (claimTextOf(target, "worktree", mine) ?? locked ?? null) : claimTextOf(target, "folder", mine);
  if (text === null || text === UNREADABLE) return { remove: false, reason: "legacy" };
  const old = parseLegacyOwner(text);
  if (old.unreadable === true) return { remove: false, reason: "legacy" };
  return legacyOwnerState(old, probe, { platform }) === "gone" ? { remove: true } : { remove: false, reason: "legacy" };
}

function judge(context, entry) {
  const { now, minAgeMs, state, mine } = context;
  const { target, kind, relation, nameOwner } = entry;
  if (relation === "legacy") {
    return decideLegacy({ kind, target, locked: entry.locked, ageMs: ageOf(target, now), minAgeMs, probe: context.probe, mine, platform: context.platform });
  }
  const owner = fs.existsSync(target) ? readOwner(target, kind, { mine }) : ownerFromLock(entry.locked);
  return decide({ owner, ageMs: ageOf(target, now), minAgeMs, state, mine: mine(target), nameOwner });
}

function record(context, entry, verdict) {
  const { report } = context;
  if (verdict.remove) return;
  if (entry.relation === "legacy") {
    report.keep(entry.target, verdict.reason);
    if (verdict.reason === "legacy") report.legacy(entry.kind, entry.target);
    return;
  }
  report.explain(entry.kind, entry.target, verdict.reason, entry.nameOwner);
}

function sweepWorktrees(context, listing) {
  const { repo, result } = context;
  let acted = false;
  for (const listed of listing.slice(1)) { // the first block is the main worktree, never a candidate
    const related = relationOf(path.basename(listed.path), context.owner);
    if (related.relation === "other") continue;
    if (related.relation === "foreign") {
      context.report.foreign("worktree", listed.path, related.nameOwner);
      continue;
    }
    const entry = { ...related, kind: "worktree", target: listed.path, locked: listed.locked };
    const captured = capture(listed.path, "worktree", context.mine); // identity first, BEFORE the claim is read and the verdict made
    context.hooks.afterCapture?.(listed.path);
    const verdict = judge(context, entry);
    if (!verdict.remove) {
      record(context, entry, verdict);
      continue;
    }
    acted = true;
    try {
      const done = removeWorktree(repo, listed.path, captured, context.hooks);
      if (done.removed) result.removed.push(listed.path);
      else context.report.keep(listed.path, done.reason);
    } catch (error) {
      result.errors.push(`worktree ${listed.path}: ${messageOf(error)}`);
    }
  }
  if (acted) {
    try {
      git(repo, "worktree", "prune");
    } catch (error) {
      result.errors.push(`worktree prune: ${messageOf(error)}`);
    }
  }
}

function sweepFolders(context, listedPaths) {
  const { tmp, result } = context;
  for (const dirent of fs.readdirSync(tmp, { withFileTypes: true })) {
    const dir = path.join(tmp, dirent.name);
    const related = relationOf(dirent.name, context.owner);
    if (!dirent.isDirectory() || related.relation === "other" || listedPaths.some((listed) => same(listed, dir))) continue;
    if (related.relation === "foreign") {
      context.report.foreign("folder", dir, related.nameOwner);
      continue;
    }
    if (hasGitFile(dir)) { // a linked worktree this repository does not list
      context.report.keep(dir, "other clone");
      continue;
    }
    const entry = { ...related, kind: "folder", target: dir };
    const captured = capture(dir, "folder", context.mine); // identity first, BEFORE the claim is read and the verdict made
    context.hooks.afterCapture?.(dir);
    const verdict = judge(context, entry);
    if (!verdict.remove) {
      record(context, entry, verdict);
      continue;
    }
    removeFolder(context, dir, result, captured);
  }
}

function removeFolder(context, dir, result, captured) {
  try {
    const done = removeFolderByIdentity(dir, captured, context.hooks);
    if (done.removed) result.removed.push(dir);
    else context.report.keep(done.path ?? dir, done.reason);
  } catch (error) {
    result.errors.push(`folder ${dir}: ${messageOf(error)}`);
  }
}

function sweepOrphanClaims(context) {
  const { tmp, now, minAgeMs, state, result, mine } = context;
  for (const dirent of fs.readdirSync(tmp, { withFileTypes: true })) {
    if (!dirent.isFile() || !dirent.name.endsWith(OWNER_SUFFIX)) continue;
    const claim = path.join(tmp, dirent.name);
    const folderPath = claim.slice(0, -OWNER_SUFFIX.length);
    const related = relationOf(path.basename(folderPath), context.owner);
    if (related.relation === "other" || fs.existsSync(folderPath) || ageOf(claim, now) < minAgeMs) continue;
    if (related.relation === "foreign") {
      context.report.foreign("claim", claim, related.nameOwner);
      continue;
    }
    // A claim with no folder is what a helper that claims FIRST leaves when it dies between the claim and the create. It is a
    // claim like any other: its owner decides — gone removes it; live, foreign, unknown and unreadable keep it.
    const verdict = related.relation === "legacy"
      ? decideLegacy({ kind: "claim", target: folderPath, ageMs: Infinity, minAgeMs, probe: context.probe, mine: () => mine(claim), platform: context.platform })
      : decide({ owner: readOwner(folderPath, "folder", { mine }), ageMs: Infinity, minAgeMs, state, mine: mine(claim), nameOwner: related.nameOwner });
    if (!verdict.remove) {
      record(context, { ...related, kind: "claim", target: claim }, verdict);
      continue;
    }
    try {
      fs.rmSync(claim, { force: true });
      result.removed.push(claim);
    } catch (error) {
      result.errors.push(`claim ${claim}: ${messageOf(error)}`);
    }
  }
}

/** A quarantine a killed sweep left: put it back under its name when the name is free and its renamer is gone; report it when the name is taken. */
function restoreQuarantines(context) {
  const { tmp, result, mine } = context;
  for (const dirent of fs.readdirSync(tmp, { withFileTypes: true })) {
    const found = QUARANTINE.exec(dirent.name);
    if (found === null || !dirent.isDirectory() || relationOf(found[1], context.owner).relation === "other") continue;
    const quarantined = path.join(tmp, dirent.name);
    if (!mine(quarantined) || context.probe(Number(found[2]))?.state !== "dead") continue; // another uid's, or its renamer may still be working
    if (!pastWindow(quarantined, context.now, context.minAgeMs)) continue; // a renamer in another pid namespace has a pid this process cannot see: it is "dead" here and may be mid-delete
    const original = path.join(tmp, found[1]);
    if (restoreOnto(quarantined, original, mine, context.hooks)) result.listed.push(`notice: restored ${found[1]} from a quarantine a killed sweep left`);
    else context.report.keep(quarantined, "quarantine-conflict");
  }
}

/** Run one step; a failure of the step is one `errors` entry and the next step still runs. */
function step(result, label, run) {
  try {
    return run();
  } catch (error) {
    result.errors.push(`${label}: ${messageOf(error)}`);
    return undefined;
  }
}

/**
 * Collect what a killed run left behind. `repo` is the repository whose worktrees this sweep may remove; `tmp` the
 * temp root; `probe` the liveness query (a seam for tests), asked at most once per pid; `mine` the kernel-owner question
 * (a seam: a second uid cannot be had in a test); `hooks.afterCapture` / `hooks.afterVerdict` / `hooks.afterRename` / `hooks.afterReserve` (seams: a change between the
 * capture, the verdict and the removal). Never throws. `result.listed` holds the `foreign:` / `legacy:` / `unmarked:` lines.
 */
export function sweepLeftovers({ repo, tmp = tempRoot(), now = Date.now(), minAgeMs = MIN_AGE_MS, probe = processProbe, mine = isMine, hooks = {}, platform = process.platform } = {}) {
  const result = { removed: [], preserved: [], listed: [], errors: [] };
  const asked = new Map();
  const cached = (pid) => {
    if (!asked.has(pid)) asked.set(pid, probe(pid));
    return asked.get(pid);
  };
  const owner = thisOwnerToken();
  const state = (record, nameOwner) => ownerState(record, cached, { nameOwner, callerOwner: owner, kernelMine: true });
  const context = { repo, tmp, now, minAgeMs, result, owner, mine, hooks, platform, probe: cached, state, report: reporter(result) };
  step(result, "quarantines", () => restoreQuarantines(context));
  const listing = step(result, "worktree list", () => listWorktrees(repo));
  if (listing !== undefined) step(result, "worktrees", () => sweepWorktrees(context, listing));
  step(result, "folders", () => sweepFolders(context, (listing ?? []).map((entry) => entry.path)));
  step(result, "claims", () => sweepOrphanClaims(context));
  return result;
}
