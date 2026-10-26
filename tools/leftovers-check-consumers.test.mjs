#!/usr/bin/env node
/**
 * The guard (`leftovers-check.mjs`) and the helper (`lib/owned.mjs`) as SHIPPED FILES for consumers (S8, decision 11 of
 * `todo/PLAN_test_leftovers_merged_core.md`; the review fixes of PR #82): where a repository's token lives, which shell names are
 * dynamic, which files a profile reads, what the cure texts say. Like `leftovers-check.test.mjs`, this file carries the violations
 * as fixture strings, so the guard does not read it (`EXCLUDED_FILES`). Every scratch repository is an owned folder.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { git } from "./lib/git.mjs";
import { ownedDir } from "./lib/owned.mjs";
import { CURES, EXCLUDED_FILES, isScanned, main, tokenConstants } from "./leftovers-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** A git repository in an owned folder holding `files` (path → text); returns its path. */
function tree(t, files = {}) {
  const repo = ownedDir(t, "consumers");
  git(repo, "init", "-q");
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(repo, name)), { recursive: true });
    fs.writeFileSync(path.join(repo, name), text);
  }
  return repo;
}

/** Run the guard and capture `{ code, text }` (stdout and stderr together). */
function guard(repo, extra = []) {
  const lines = [];
  const code = main(["--repo", repo, ...extra], { out: (line) => lines.push(line), err: (line) => lines.push(line) });
  return { code, text: lines.join("\n") };
}

const table = (rows) => ["# Rule", "", "## Tokens", "", "| token | family | repository |", "|---|---|---|", ...rows, "", "## Never", ""].join("\n");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

// 1 — the token is written by each repository, never by the shipped helper -------------------------------------------------------

const ORG_ROW = "the org1 service";
const ORG_RULE = table(["| `conventions` | dew_flow | the shared-rules repository |", `| \`org1\` | org | ${ORG_ROW} |`]);
const ORG_TOKEN = `export const REPO_TOKEN = "org1";\nexport const REPO_ROW = "${ORG_ROW}";\n`;
const orgArgs = (repo, extra = []) => ["--rule", path.join(repo, "rule.md"), "--token", "org1", "--identity", ORG_ROW, ...extra];

/** A consumer that copied the shipped helper BYTE FOR BYTE (and, unless `token` is false, wrote its own token file beside it). */
function copier(t, { token = ORG_TOKEN, extra = {} } = {}) {
  const repo = tree(t, { "tools/x.test.mjs": "const a = 1;\n", "rule.md": ORG_RULE, ...(token === false ? {} : { "tools/lib/owned-token.mjs": token }), ...extra });
  fs.mkdirSync(path.join(repo, "tools", "lib"), { recursive: true });
  fs.copyFileSync(path.join(root, "tools", "lib", "owned.mjs"), path.join(repo, "tools", "lib", "owned.mjs"));
  return repo;
}

test("S8 review 1. the shipped helper holds no token: a copy of it carries nothing this repository chose", () => {
  const helper = read("tools", "lib", "owned.mjs");
  assert.doesNotMatch(helper, /\b(?:REPO_TOKEN|RepoToken|REPO_ROW)\s*=/, "no constant declared in the shipped helper");
  assert.doesNotMatch(helper, /["'`]conventions["'`]/, "this repository's token is not spelled in the shipped helper");
  assert.doesNotMatch(helper, /shared-rules repository/, "nor its row");
  const own = read("tools", "lib", "owned-token.mjs");
  assert.match(own, /export const REPO_TOKEN = "conventions";/);
  assert.match(own, /export const REPO_ROW = "the shared-rules repository";/);
  assert.match(own, /writes its OWN/i, "the header says that a repository copying the shipped tools writes its own file");
  assert.match(read("README.md"), /owned-token\.mjs/, "the README says so too");
});

test("S8 review 1. a repository with a byte copy of owned.mjs and its own owned-token.mjs passes the guard under its own token", (t) => {
  const repo = copier(t);
  const result = guard(repo, orgArgs(repo));
  assert.equal(result.code, 0, result.text);
  assert.deepEqual(tokenConstants(repo).map((entry) => `${entry.file}=${entry.value}`), ["tools/lib/owned-token.mjs=org1"], "the one constant is the repository's own; the helper holds none");
  const wrong = guard(repo, ["--rule", path.join(repo, "rule.md")]);
  assert.equal(wrong.code, 1, "the default token is this repository's: another repository's constant is not it");
  assert.match(wrong.text, / — token — /);
});

test("S8 review 1. a copy of owned.mjs without owned-token.mjs is a finding that names the missing file", (t) => {
  const repo = copier(t, { token: false });
  const result = guard(repo, orgArgs(repo));
  assert.equal(result.code, 1, result.text);
  assert.match(result.text, /tools\/lib\/owned\.mjs:\d+ — token — .*owned-token\.mjs/, result.text);
  assert.match(result.text, /missing/);
  assert.match(result.text, /REPO_TOKEN/, "and says what the file holds");
  assert.match(CURES.token, /owned-token\.mjs/, "the cure text names the file");
});

test("S8 review 1. a tracked mount of the shared files is not scanned for token constants under --profile node, and is without it", (t) => {
  const mount = ".agents/conventions";
  const repo = copier(t, { extra: { [`${mount}/tools/lib/owned-token.mjs`]: 'export const REPO_TOKEN = "conventions";\nexport const REPO_ROW = "the shared-rules repository";\n' } });
  fs.copyFileSync(path.join(root, "tools", "lib", "owned.mjs"), path.join(repo, mount, "tools", "lib", "owned.mjs"));
  git(repo, "add", ".");
  const profiled = guard(repo, orgArgs(repo, ["--profile", "node"]));
  assert.equal(profiled.code, 0, profiled.text);
  assert.deepEqual(tokenConstants(repo, "node").map((entry) => entry.file), ["tools/lib/owned-token.mjs"]);
  const plain = guard(repo, orgArgs(repo));
  assert.equal(plain.code, 1, "without the profile the mount is the repository's own tree, as today");
  assert.match(plain.text, /token constants differ/);
  assert.deepEqual(tokenConstants(repo).map((entry) => entry.file).sort(), [`${mount}/tools/lib/owned-token.mjs`, "tools/lib/owned-token.mjs"]);
  const shared = tree(t, { "tools/x.test.mjs": "const a = 1;\n", "rule.md": ORG_RULE, ".claude/rules/shared/tools/lib/owned-token.mjs": 'export const REPO_TOKEN = "conventions";\n', "tools/lib/owned-token.mjs": ORG_TOKEN });
  assert.equal(guard(shared, orgArgs(shared, ["--profile", "node"])).code, 0, "the other mount path too");
});

test("S8 review 1. a node_modules copy is not read for constants under the profile; the missing-file finding skips a mount's copy", (t) => {
  const repo = copier(t, { extra: { "node_modules/pkg/owned-token.mjs": 'export const REPO_TOKEN = "other";\n', ".gitignore": "" } });
  git(repo, "add", "-f", "node_modules/pkg/owned-token.mjs");
  assert.equal(guard(repo, orgArgs(repo, ["--profile", "node"])).code, 0);
  const noToken = copier(t, { token: false });
  fs.mkdirSync(path.join(noToken, ".agents", "conventions", "tools", "lib"), { recursive: true });
  fs.copyFileSync(path.join(root, "tools", "lib", "owned.mjs"), path.join(noToken, ".agents", "conventions", "tools", "lib", "owned.mjs"));
  const result = guard(noToken, orgArgs(noToken, ["--profile", "node"]));
  assert.equal(result.code, 1, "the repository's own copy still lacks its file");
  assert.equal(result.text.split("\n").filter((line) => /owned-token\.mjs/.test(line) && /^\s+\S+:\d+ — token/.test(line)).length, 1, "and the mount's copy is not a second finding: " + result.text);
});

test("S8 review 1. this repository's guard reads the constant from owned-token.mjs and the helper re-exports it", async () => {
  const token = await import("./lib/owned-token.mjs");
  const helper = await import("./lib/owned.mjs");
  assert.equal(helper.REPO_TOKEN, token.REPO_TOKEN);
  assert.equal(helper.REPO_ROW, token.REPO_ROW);
  assert.deepEqual(tokenConstants(root).map((entry) => `${entry.file}=${entry.value}`), ["tools/lib/owned-token.mjs=conventions"]);
  assert.equal(guard(root).code, 0);
});

test("S8 review 1. the exclusion list is two files: the guard's own tests", () => {
  assert.deepEqual([...EXCLUDED_FILES], ["tools/leftovers-check.test.mjs", "tools/leftovers-check-consumers.test.mjs"]);
  assert.equal(isScanned("tools/leftovers-check-consumers.test.mjs"), false);
});
