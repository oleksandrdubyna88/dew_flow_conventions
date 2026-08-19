#!/usr/bin/env node
// pin-check.mjs — every submodule pin in this repository equals its remote's tip.
//
// Enforces README.md "Editing discipline": a rule change and the pin bumps are ONE task — so a pin
// that lags its remote is drift, and drift is a red check rather than a habit someone remembers.
// The 2026-08-19 audit found exactly that: three consumers two commits behind (one of them missing
// gpu-lease.md entirely), and the product pin external/dew_flow_mcp stale against its own main —
// each a live instance of the failure this file exists to make loud.
//
// Checks the COMMITTED pin (`git rev-parse HEAD:<path>`), not the working tree, so a locally
// updated but uncommitted submodule still fails — the pin is what a clone gets.
//
// Run from a consumer repo root:  node .claude/rules/shared/tools/pin-check.mjs
// A remote that cannot be reached is a WARNING, not a failure — offline local runs stay usable;
// CI runners have the network.

import { execFileSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

let pathLines;
try {
  pathLines = git("config", "-f", ".gitmodules", "--get-regexp", String.raw`^submodule\..*\.path$`);
} catch {
  console.log("pin-check: no .gitmodules in this repository — nothing to check.");
  process.exit(0);
}

const failures = [];
let checked = 0;

for (const line of pathLines.split("\n").filter(Boolean)) {
  const firstSpace = line.indexOf(" ");
  const key = line.slice(0, firstSpace);
  const path = line.slice(firstSpace + 1);
  const name = key.slice("submodule.".length, -".path".length);
  const url = git("config", "-f", ".gitmodules", "--get", `submodule.${name}.url`);

  const pinned = git("rev-parse", `HEAD:${path}`);

  let remote;
  try {
    // ls-remote HEAD = the remote's default branch tip, whatever it is named.
    remote = git("ls-remote", url, "HEAD").split(/\s+/)[0];
  } catch (error) {
    console.log(`pin-check: WARN cannot reach ${url} — skipping ${path} (${error.message.split("\n")[0]}).`);
    continue;
  }

  checked += 1;
  if (pinned !== remote) {
    failures.push({ path, url, pinned, remote });
  }
}

if (failures.length === 0) {
  console.log(`pin-check: OK — ${checked} pin(s) at their remote tips.`);
  process.exit(0);
}

for (const f of failures) {
  console.error(`pin-check: STALE ${f.path}`);
  console.error(`  pinned ${f.pinned}`);
  console.error(`  remote ${f.remote}  (${f.url})`);
  console.error(`  fix:   git submodule update --remote ${f.path} && git add ${f.path} && commit`);
}
console.error(
  `pin-check: ${failures.length} stale pin(s). A rule change and the pin bumps are one task — ` +
    "see .claude/rules/shared/README.md, Editing discipline.",
);
process.exit(1);
