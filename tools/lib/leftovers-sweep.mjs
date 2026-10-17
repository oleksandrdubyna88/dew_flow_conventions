// The start-of-run sweep: the Node encoding of `common/test-leftovers.md` §4 for this repository.
//
// What it removes. Only what is provably nobody's: a temp folder or a git worktree whose name starts with THIS
// repository's token (`OWNED_PATTERN` — never another repository's, never the bare prefix) and whose owner is
// `gone` (its process is dead on this host), or that carries no owner at all and is older than the minimum age —
// `ownedDir`/`ownedWorktree` never leave an unmarked new-form resource of a live run, so "unmarked and old" can
// only mean "nobody's" (rule §2).
//
// What it keeps, and says why. `young` (the age is a SELECTOR that keeps the sweep off a resource between
// creation and claim, not an authority), `live`, `foreign host`, `unknown` (the pid query was refused),
// `unreadable` (a claim that does not parse, a bare `locked`), and `other clone`: a folder holding a `.git` FILE
// that this repository's own `git worktree list` does not show is some other clone's worktree (this machine holds
// several clones with one repo token). It is never judged as an unmarked folder, whether its gitdir reads, points
// at a deleted clone, or does not parse.
//
// Order. Worktrees first (only those this repository lists), then folders, then orphaned claims. A tree's
// top-level links (a `node_modules` junction) are unlinked BEFORE anything is removed, so a removal can never
// follow one into its target. Never throws: every failure is an `errors` entry, and the caller decides what to
// print — a sweep never changes a run's exit code.

import * as fs from "node:fs";
import * as path from "node:path";

import { git } from "./git.mjs";
import { OWNED_PATTERN, ownerState, parseOwner, processProbe, readOwner, removeLink, removeQuietly, tempRoot, thisOwner } from "./owned.mjs";

export const MIN_AGE_MS = 10 * 60_000; // rule §4: ten minutes

const OWNER_SUFFIX = ".owner";

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

/** Rule §4's table for one candidate: `{ remove: true }` or `{ remove: false, reason }`. */
function decide({ owner, ageMs, minAgeMs, state }) {
  if (ageMs < minAgeMs) return { remove: false, reason: "young" };
  if (owner === null || owner === undefined) return { remove: true };
  if (owner.unreadable === true) return { remove: false, reason: "unreadable" };
  const seen = state(owner);
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

function removeWorktree(repo, worktree) {
  if (fs.existsSync(worktree)) unlinkTopLevelLinks(worktree);
  try {
    git(repo, "worktree", "unlock", worktree);
  } catch { /* not locked is not news */ }
  let failure;
  try {
    git(repo, "worktree", "remove", "--force", "--force", worktree);
  } catch (error) {
    failure = error;
  }
  if (fs.existsSync(worktree)) removeQuietly(worktree); // git leaves a directory that held a junction
  if (fs.existsSync(worktree)) throw new Error(`could not remove it${failure === undefined ? "" : ` (${messageOf(failure)})`}`);
}

function sweepWorktrees(context, listing) {
  const { repo, now, minAgeMs, state, result } = context;
  let acted = false;
  for (const entry of listing.slice(1)) { // the first block is the main worktree, never a candidate
    if (!OWNED_PATTERN.test(path.basename(entry.path))) continue;
    const owner = fs.existsSync(entry.path) ? readOwner(entry.path, "worktree") : ownerFromLock(entry.locked);
    const verdict = decide({ owner, ageMs: ageOf(entry.path, now), minAgeMs, state });
    if (!verdict.remove) {
      result.preserved.push({ path: entry.path, reason: verdict.reason });
      continue;
    }
    acted = true;
    try {
      removeWorktree(repo, entry.path);
      result.removed.push(entry.path);
    } catch (error) {
      result.errors.push(`worktree ${entry.path}: ${messageOf(error)}`);
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
  const { tmp, now, minAgeMs, state, result } = context;
  for (const entry of fs.readdirSync(tmp, { withFileTypes: true })) {
    const dir = path.join(tmp, entry.name);
    if (!entry.isDirectory() || !OWNED_PATTERN.test(entry.name) || listedPaths.some((listed) => same(listed, dir))) continue;
    if (hasGitFile(dir)) { // a linked worktree this repository does not list
      result.preserved.push({ path: dir, reason: "other clone" });
      continue;
    }
    const verdict = decide({ owner: readOwner(dir, "folder"), ageMs: ageOf(dir, now), minAgeMs, state });
    if (!verdict.remove) {
      result.preserved.push({ path: dir, reason: verdict.reason });
      continue;
    }
    try {
      unlinkTopLevelLinks(dir);
      if (!removeQuietly(dir)) throw new Error("it could not be removed");
      result.removed.push(dir);
    } catch (error) {
      result.errors.push(`folder ${dir}: ${messageOf(error)}`);
    }
  }
}

function sweepOrphanClaims(context) {
  const { tmp, now, minAgeMs, state, result } = context;
  for (const entry of fs.readdirSync(tmp, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(OWNER_SUFFIX) || !OWNED_PATTERN.test(entry.name)) continue;
    const claim = path.join(tmp, entry.name);
    const folderPath = claim.slice(0, -OWNER_SUFFIX.length);
    if (fs.existsSync(folderPath) || ageOf(claim, now) < minAgeMs) continue;
    // A claim with no folder is what a helper that claims FIRST leaves when it dies between the claim and the create. It is a
    // claim like any other: its owner decides — gone removes it; live, foreign, unknown and unreadable keep it.
    const verdict = decide({ owner: readOwner(folderPath, "folder"), ageMs: Infinity, minAgeMs, state });
    if (!verdict.remove) {
      result.preserved.push({ path: claim, reason: verdict.reason });
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
 * temp root; `probe` the liveness query (a seam for tests), asked at most once per pid. Never throws.
 */
export function sweepLeftovers({ repo, tmp = tempRoot(), now = Date.now(), minAgeMs = MIN_AGE_MS, probe = processProbe } = {}) {
  const result = { removed: [], preserved: [], errors: [] };
  const asked = new Map();
  const cached = (pid) => {
    if (!asked.has(pid)) asked.set(pid, probe(pid));
    return asked.get(pid);
  };
  const context = { repo, tmp, now, minAgeMs, result, state: (owner) => ownerState(owner, cached) };
  const listing = step(result, "worktree list", () => listWorktrees(repo));
  if (listing !== undefined) step(result, "worktrees", () => sweepWorktrees(context, listing));
  step(result, "folders", () => sweepFolders(context, (listing ?? []).map((entry) => entry.path)));
  step(result, "claims", () => sweepOrphanClaims(context));
  return result;
}
