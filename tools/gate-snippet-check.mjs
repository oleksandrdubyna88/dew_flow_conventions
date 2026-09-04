#!/usr/bin/env node
// gate-snippet-check.mjs — the review-gate block lives in the mounted rule, and nowhere else.
//
// The ConnectOtherAIs gate is taught to a repository's main AI by a block of text. It used to be
// PASTED into each repository's CLAUDE.md, and pasted text does not move when its source does:
// measured 2026-09-04, dew_flow_creds_for_devs carried v2 while the extension handed out v5 —
// three revisions behind, missing the COMMANDS block entirely. Nobody was careless; that is simply
// what happens to a copy.
//
// So the block is now `common/coai-review-gate.md` in this repository, and a consumer gets it
// through the submodule it already mounts — which makes a consumer-owned copy the defect, exactly
// as README.md's editing discipline says ("a consumer repository never carries its own copy of a
// shared rule"). This check is the headless half of that: the extension's panel can only see a
// repository somebody has opened in VS Code, and a repository nobody opened is precisely the one
// that goes stale.
//
// Freshness of the mounted copy needs no mechanism here — that is the submodule pin, and
// pin-check.mjs already fails while a pin lags its remote.
//
// Run from a consumer repo root:  node .claude/rules/shared/tools/gate-snippet-check.mjs [--warn]
// `--warn` says everything it found and exits 0 — for a repository whose copy cannot be removed
// yet (see ROLLOUT.md; the same flag post-deploy-check.mjs and http-coverage.mjs carried while
// their backfill was outstanding). Adopt without it everywhere else.

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

/** The sentence the block is recognised by — the same one the extension's panel looks for. */
const MARKER = "Multi-model review gate (ConnectOtherAIs)";

/** The version marker the block carries since v2; its absence means "pasted before versioning". */
const VERSION = /<!-- coai-snippet v(\d+) -->/;

/** Where the shared rule lands inside a mount. */
const CANONICAL = path.join("common", "coai-review-gate.md");

/** The files a CLI reads as instructions — the classic home of a pasted copy. */
const INSTRUCTION_FILES = ["CLAUDE.md", "AGENTS.md", "GEMINI.md", ".github/copilot-instructions.md"];

/** Where a repository keeps rules once there are too many for one page. */
const RULE_TREES = [".claude/rules", ".cursor/rules"];

/** Generated or vendored trees are somebody else's content, never this repository's copy. */
const NOT_OURS = new Set(["node_modules", "bin", "obj", ".git", "dist", "out", "artifacts", "vendor", "packages"]);

const warnOnly = process.argv.includes("--warn");

/** Every submodule path this repository declares, as forward-slash relative paths. */
function mountPaths() {
  try {
    const lines = execFileSync("git", ["config", "-f", ".gitmodules", "--get-regexp", String.raw`^submodule\..*\.path$`], {
      encoding: "utf8",
    }).trim();

    return lines
      .split("\n")
      .filter(Boolean)
      .map((line) => line.slice(line.indexOf(" ") + 1).trim().replaceAll("\\", "/"));
  } catch {
    return [];
  }
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function versionIn(text) {
  const found = VERSION.exec(text);

  return found === null ? "unversioned" : `v${found[1]}`;
}

/**
 * Every `.md` under the rule trees that is NOT inside a mount.
 *
 * A bounded walk rather than a list of names: a copy is as likely to be filed under a local rule
 * nobody thought to enumerate as in CLAUDE.md, and "the paths I remembered to check" is how the
 * first copy went unnoticed for three revisions. Symlinks are not followed — a link out of the
 * repository is not this repository's copy, and following one turns a check into a crawl.
 */
function localRuleFiles(mounts) {
  const found = [];
  for (const tree of RULE_TREES) {
    walk(tree, mounts, found);
  }

  return found;
}

function walk(dir, mounts, found) {
  const inMount = mounts.some((m) => dir === m || dir.startsWith(`${m}/`));
  if (inMount || !fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const child = `${dir}/${entry.name}`;
    if (entry.isSymbolicLink() || NOT_OURS.has(entry.name)) {
      continue;
    }
    if (entry.isDirectory()) {
      walk(child, mounts, found);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdc")) {
      found.push(child);
    }
  }
}

const mounts = mountPaths();
const canonical = mounts.map((m) => `${m}/${CANONICAL.replaceAll("\\", "/")}`).find((p) => fs.existsSync(p));

// A mount UNDER a rule tree is this family's rules submodule, whatever it is named. Distinguishing
// it from a code submodule is what separates the two ways there can be no canonical file: a
// repository that never adopted the rule (fine, nothing to check) from one that mounts it and did
// not get it (an uninitialised or broken submodule — a repository with no gate rule at all, which
// must not read as adoption).
const rulesMounts = mounts.filter((m) => RULE_TREES.some((t) => m.startsWith(`${t}/`) || m === t));

if (canonical === undefined && rulesMounts.length > 0) {
  console.error(
    `gate-snippet-check: ${rulesMounts.join(", ")} is mounted but carries no ${CANONICAL.replaceAll("\\", "/")}. ` +
      "The rule this repository loads is not there — run " +
      `git submodule update --init ${rulesMounts[0]}, and if it is initialised, the mount is pinned ` +
      "to a commit older than the rule.",
  );
  process.exit(warnOnly ? 0 : 1);
}

if (canonical === undefined) {
  console.log(
    "gate-snippet-check: no mounted coai-review-gate.md — this repository has not adopted the shared rule, " +
      "so a pasted block is the only place it could live. Nothing to check.",
  );
  process.exit(0);
}

const mounted = versionIn(read(canonical));
const copies = [...INSTRUCTION_FILES, ...localRuleFiles(mounts)]
  .map((file) => ({ file, text: read(file) }))
  .filter(({ text }) => text.includes(MARKER))
  .map(({ file, text }) => ({ file, version: versionIn(text) }));

if (copies.length === 0) {
  console.log(`gate-snippet-check: OK — the gate rule is only at ${canonical} (${mounted}).`);
  process.exit(0);
}

for (const copy of copies) {
  const note = copy.version === mounted ? "identical version, still a second copy" : `${copy.version} against ${mounted} mounted`;
  console.error(`gate-snippet-check: OWN COPY ${copy.file} — ${note}`);
}
console.error(
  `gate-snippet-check: ${copies.length} copy(ies) of the gate rule outside ${canonical}. ` +
    "A consumer never carries its own copy of a shared rule (README.md, Editing discipline) — " +
    "delete the block; the mounted rule is already loaded in every session.",
);

if (warnOnly) {
  console.error("gate-snippet-check: --warn — reported, not failed.");
  process.exit(0);
}

process.exit(1);
