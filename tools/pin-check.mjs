#!/usr/bin/env node
// pin-check.mjs — every submodule pin equals the tip of the ref it TRACKS.
//
// Enforces README.md "Editing discipline": a pin that lags what it follows is drift, and drift is a
// red check rather than a habit someone remembers. The 2026-08-19 audit found exactly that: three
// consumers two commits behind (one of them missing a whole rule), and a product pin stale against
// its own main — each a live instance of the failure this file exists to make loud.
//
// Which ref a pin follows is `submodule.<name>.branch` in .gitmodules — git's own key, whose
// documented default for an unset key IS the remote's HEAD. So the shared rules follow `release`,
// which moves when a person promotes a reviewed commit, while code pins that declare nothing go on
// following their own default branch exactly as before.
//
// Until 2026-09-14 every pin was compared against `ls-remote <url> HEAD` unconditionally, so the
// expected value was the rules repository's LIVE tip, resolved at CI run time. That made the check a
// function of somebody else's merge rather than of this pull request: main moved 95 times in 29 days,
// and each of those commits reddened every open pull request in six repositories at once. A published
// older version was indistinguishable from drift, which is why README's own "consumers retain their
// approved pins" policy could not be implemented.
//
// Checks the COMMITTED pin, not the working tree, so a locally updated but uncommitted submodule
// still fails — the pin is what a clone gets. It is read from `ls-tree` rather than `rev-parse`
// because only the tree entry's MODE says whether a path is a gitlink at all: `rev-parse HEAD:<path>`
// succeeds for any committed object and hands back a TREE id for a directory, which then compares
// unequal to a remote commit and reads as a stale pin whose suggested cure cannot work.
//
// Run from a consumer repo root:  node .agents/conventions/tools/pin-check.mjs
// A remote that cannot be reached is a WARNING, not a failure — offline local runs stay usable;
// CI runners have the network.

import { git as gitIn } from "./lib/git.mjs";

// The family's one process launcher rather than a second one here: it bounds every call at 30 s,
// which matters for the one call in this file that can hang forever — a remote that accepts the
// connection and then says nothing is not "unreachable", it is endless.
const git = (...args) => gitIn(".", ...args);

let configLines;
try {
  configLines = git("config", "-f", ".gitmodules", "--get-regexp", String.raw`^submodule\.`);
} catch {
  console.log("pin-check: no .gitmodules in this repository — nothing to check.");
  process.exit(0);
}

// One read of the whole file instead of three `--get` subprocesses per submodule. `--get-regexp`
// prints `key value`, and a value may contain spaces, so only the FIRST space is a separator.
const declared = new Map();
for (const line of configLines.split("\n").filter(Boolean)) {
  const space = line.indexOf(" ");
  const key = space === -1 ? line : line.slice(0, space);
  const value = space === -1 ? "" : line.slice(space + 1);
  const match = /^submodule\.(.+)\.(path|url|branch)$/.exec(key);
  if (match === null) continue;
  const [, name, field] = match;
  if (!declared.has(name)) declared.set(name, {});
  declared.get(name)[field] = value;
}

/**
 * The ref a pin follows, resolved to something `ls-remote` can match.
 *
 * Three shapes are legal in git and all three appear in the wild: a plain branch name, a fully
 * qualified `refs/heads/...`, and `.` — git's shorthand for "the branch this superproject is on".
 * Prepending refs/heads/ blindly turns the last two into `refs/heads/refs/heads/release` and
 * `refs/heads/.`, neither of which matches anything, so a supported configuration was reported as a
 * configuration error.
 */
function resolveRef(branch) {
  if (branch === "") return { ref: "HEAD", label: "the default branch" };
  if (branch.startsWith("refs/")) return { ref: branch, label: branch.replace(/^refs\/heads\//, "") };
  if (branch !== ".") return { ref: `refs/heads/${branch}`, label: branch };

  const head = git("rev-parse", "--abbrev-ref", "HEAD");
  if (head === "HEAD") return { error: "`branch = .` follows this superproject's current branch, and HEAD is detached." };
  return { ref: `refs/heads/${head}`, label: head };
}

const stale = [];
const notCommitted = [];
const unresolved = [];
const checked = [];

for (const [name, entry] of declared) {
  const path = entry.path;
  if (path === undefined || path === "") continue; // a section with no path declares no submodule.

  if (entry.url === undefined || entry.url === "") {
    notCommitted.push({ path, problem: "is declared in .gitmodules with no url, so there is nothing to compare it against", cure: `add a url to the [submodule "${name}"] section, or delete the section` });
    continue;
  }
  const url = entry.url;

  // `ls-tree` rather than `rev-parse`: only the mode tells a gitlink (160000) from a directory or a
  // file committed at the same path.
  let listing;
  try {
    listing = git("ls-tree", "HEAD", "--", path);
  } catch {
    listing = "";
  }
  const treeEntry = /^(\d+) (\w+) ([0-9a-f]+)/.exec(listing);
  if (treeEntry === null || treeEntry[1] !== "160000") {
    notCommitted.push({
      path,
      problem: treeEntry === null
        ? "is declared in .gitmodules but nothing is committed at that path"
        : `is committed as a ${treeEntry[2]}, not as a submodule — a gitlink has mode 160000`,
      cure: `git add ${path} && commit, or remove the [submodule "${name}"] section`,
    });
    continue;
  }
  const pinned = treeEntry[3];

  const resolved = resolveRef(entry.branch ?? "");
  if (resolved.error !== undefined) {
    unresolved.push({ path, url, message: resolved.error, cure: "name a branch explicitly, or check out a branch in this repository" });
    continue;
  }

  // Say which remote is about to be probed BEFORE probing it: each call can spend the launcher's
  // 30-second bound, and a CI log that prints nothing until the end reads as a hang.
  console.log(`pin-check: ${path} → ${resolved.label} (${url})`);

  let answer;
  try {
    answer = git("ls-remote", url, resolved.ref);
  } catch (error) {
    console.log(`pin-check: WARN cannot reach ${url} — skipping ${path} (${error.message.split("\n")[0]}).`);
    continue;
  }

  // `ls-remote` answers exit 0 and an EMPTY body for a pattern that matches nothing. Read as a tip,
  // that empty string makes every pin look stale against a blank sha; read as a miss, it is the one
  // thing it can be — a name that is not there.
  const remote = answer.split(/\s+/)[0];
  if (remote === undefined || remote === "") {
    unresolved.push({
      path,
      url,
      message: entry.branch === undefined || entry.branch === ""
        ? `${url} advertises no default branch — it may be an empty repository.`
        : `.gitmodules asks this pin to follow \`${entry.branch}\`, and ${url} has no ${resolved.ref}.`,
      cure: entry.branch === undefined || entry.branch === ""
        ? "push a first commit to that remote"
        : `create or push \`${resolved.label}\` in ${url}, or correct the branch name in .gitmodules`,
    });
    continue;
  }

  checked.push({ path, label: resolved.label });
  if (pinned !== remote) stale.push({ path, url, pinned, remote, label: resolved.label });
}

if (stale.length === 0 && notCommitted.length === 0 && unresolved.length === 0) {
  const at = checked.map(c => `${c.path} → ${c.label}`).join(", ");
  console.log(`pin-check: OK — ${checked.length} pin(s) at the tip of the ref each tracks (${at}).`);
  process.exit(0);
}

for (const f of notCommitted) {
  console.error(`pin-check: NOT COMMITTED ${f.path}`);
  console.error(`  ${f.path} ${f.problem}.`);
  console.error("  The defect is local: nothing about a remote branch is involved.");
  console.error(`  fix:   ${f.cure}`);
}

for (const f of unresolved) {
  console.error(`pin-check: NO SUCH REF ${f.path}`);
  console.error(`  ${f.message}`);
  console.error("  A ref that is not there cannot be lagged behind, so this is a configuration error");
  console.error("  rather than a stale pin.");
  console.error(`  fix:   ${f.cure}`);
}

for (const f of stale) {
  console.error(`pin-check: STALE ${f.path}`);
  console.error(`  pinned ${f.pinned}`);
  console.error(`  ${f.label}  ${f.remote}  (${f.url})`);
  console.error(`  fix:   git submodule update --remote ${f.path} && git add ${f.path} && commit`);
}

const counts = [
  stale.length > 0 ? `${stale.length} stale` : "",
  notCommitted.length > 0 ? `${notCommitted.length} not committed` : "",
  unresolved.length > 0 ? `${unresolved.length} unresolvable` : "",
].filter(Boolean).join(", ");

console.error(
  `pin-check: ${counts}. A consumer follows the ref its .gitmodules names — \`release\` for the ` +
    "shared rules, which moves when a rule author promotes a reviewed commit and never when main " +
    "does. See the conventions README, Editing discipline.",
);
process.exit(1);
