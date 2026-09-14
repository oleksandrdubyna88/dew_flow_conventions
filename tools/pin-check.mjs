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
// Checks the COMMITTED pin (`git rev-parse HEAD:<path>`), not the working tree, so a locally updated
// but uncommitted submodule still fails — the pin is what a clone gets.
//
// Run from a consumer repo root:  node .agents/conventions/tools/pin-check.mjs
// A remote that cannot be reached is a WARNING, not a failure — offline local runs stay usable;
// CI runners have the network.

import { git as gitIn } from "./lib/git.mjs";

// The family's one process launcher rather than a second one here: it bounds the call at 30 s, which
// matters for the one call in this file that can hang forever — a remote that accepts the connection
// and then says nothing is not "unreachable", it is endless.
const git = (...args) => gitIn(".", ...args);

let pathLines;
try {
  pathLines = git("config", "-f", ".gitmodules", "--get-regexp", String.raw`^submodule\..*\.path$`);
} catch {
  console.log("pin-check: no .gitmodules in this repository — nothing to check.");
  process.exit(0);
}

/**
 * The ref a pin is MEANT to follow — "" for the remote's default branch.
 *
 * Unset is not a special case invented here: git's own default for the key is the remote HEAD, so a
 * submodule that declares nothing is compared against exactly what it was compared against before
 * this key existed.
 */
const trackedBranch = name => {
  try {
    return git("config", "-f", ".gitmodules", "--get", `submodule.${name}.branch`);
  } catch {
    return ""; // `git config --get` exits 1 for a key that is not there.
  }
};

const describe = branch => (branch === "" ? "the default branch" : branch);

const failures = [];
const missing = [];
const checked = [];

for (const line of pathLines.split("\n").filter(Boolean)) {
  const firstSpace = line.indexOf(" ");
  const key = line.slice(0, firstSpace);
  const path = line.slice(firstSpace + 1);
  const name = key.slice("submodule.".length, -".path".length);
  const url = git("config", "-f", ".gitmodules", "--get", `submodule.${name}.url`);

  let pinned;
  try {
    pinned = git("rev-parse", `HEAD:${path}`);
  } catch {
    // Declared in .gitmodules but not a gitlink in the commit: a half-added submodule, or a typo in
    // `path`. Named rather than thrown — a raw git stderr dump is not something a reader can act on,
    // and `git mv` of a mount leaves exactly this shape behind.
    missing.push({ path, url, branch: "", reason: "declared in .gitmodules but not committed as a submodule at that path" });
    continue;
  }

  const branch = trackedBranch(name);
  // A named branch is asked for in FULL: a bare `release` would also match refs/tags/release, and a
  // tag is not something `git submodule update --remote` can ever move a pin to.
  const ref = branch === "" ? "HEAD" : `refs/heads/${branch}`;

  let answer;
  try {
    answer = git("ls-remote", url, ref);
  } catch (error) {
    console.log(`pin-check: WARN cannot reach ${url} — skipping ${path} (${error.message.split("\n")[0]}).`);
    continue;
  }

  // `ls-remote` answers exit 0 and an EMPTY body for a pattern that matches nothing. Read as a tip,
  // that empty string makes every pin look stale against a blank sha; read as a miss, it is the one
  // thing it can be — a name that is not there.
  const remote = answer.split(/\s+/)[0];
  if (remote === undefined || remote === "") {
    missing.push({ path, url, branch, reason: "" });
    continue;
  }

  checked.push({ path, ref: describe(branch) });
  if (pinned !== remote) failures.push({ path, url, pinned, remote, ref: describe(branch) });
}

if (failures.length === 0 && missing.length === 0) {
  const at = checked.map(c => `${c.path} → ${c.ref}`).join(", ");
  console.log(`pin-check: OK — ${checked.length} pin(s) at the tip of the ref each tracks (${at}).`);
  process.exit(0);
}

for (const m of missing) {
  console.error(`pin-check: NO SUCH REF ${m.path}`);
  if (m.reason !== "") {
    console.error(`  ${m.reason}  (${m.url})`);
    continue;
  }
  console.error(`  .gitmodules asks this pin to follow \`${m.branch}\`, and ${m.url} has no refs/heads/${m.branch}.`);
  console.error("  A branch that is not there cannot be lagged behind, so this is a configuration error");
  console.error("  rather than a stale pin: either the release ref was never cut, or the name is misspelt here.");
  console.error(`  fix:   cut \`${m.branch}\` in the rules repository through its promote-release workflow, or drop`);
  console.error(`         \`branch = ${m.branch}\` from .gitmodules to follow the default branch as before.`);
}

for (const f of failures) {
  console.error(`pin-check: STALE ${f.path}`);
  console.error(`  pinned ${f.pinned}`);
  console.error(`  ${f.ref}  ${f.remote}  (${f.url})`);
  console.error(`  fix:   git submodule update --remote ${f.path} && git add ${f.path} && commit`);
}

console.error(
  `pin-check: ${failures.length} stale, ${missing.length} unresolvable pin(s). A consumer follows the ` +
    "ref its .gitmodules names — `release` for the shared rules, which moves when a rule author " +
    "promotes a reviewed commit and never when main does. See the conventions README, Editing discipline.",
);
process.exit(1);
