#!/usr/bin/env node
/**
 * The guard (`leftovers-check.mjs`) and the helper (`lib/owned.mjs`) as SHIPPED FILES for consumers (S8, decision 11 of
 * `research/PLAN_test_leftovers_merged_core.md`; the review fixes of PR #82): where a repository's token lives, which shell names are
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
import { CURES, EXCLUDED_FILES, isPackageManifest, isScanned, loadYaml, main, scanRepository, tokenConstants, YamlMissingError } from "./leftovers-check.mjs";

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

// 2 — a dynamic shell name with a literal default is judged on the default ---------------------------------------------------------

const Q = "testsTo" + "Delete"; // spelled in two pieces: the machine scan reads this file and must find no line that matches the prefix with no owner after it
const GOOD = `${Q}-u1000-x-abc123`;
const sh = (t, line) => guard(tree(t, { "scripts/a.sh": `${line}\n` }));

test("S8 review 2. ${V:-w}, ${V-w}, ${V:=w} and ${V=w}: a default with no `$` is the name the command gets when V is unset, and is judged as a name", (t) => {
  for (const operator of [":-", "-", ":=", "="]) {
    const fixed = sh(t, `docker run --rm --name "\${PG${operator}pg-test}" img`);
    assert.equal(fixed.code, 1, `\${PG${operator}pg-test}: ${fixed.text}`);
    assert.match(fixed.text, /scripts\/a\.sh:1 — docker-name — `--name \$\{PG\S+pg-test\}` is not an owner-form/);
    assert.equal(sh(t, `docker run --rm --name "\${PG${operator}${GOOD}}" img`).code, 0, `\${PG${operator}<owner form>}: a default in the owner form passes`);
  }
  assert.equal(sh(t, "docker run --rm --name ${PG:-pg-test} img").code, 1, "unquoted");
  assert.equal(sh(t, 'docker run --rm --name="${PG:-pg-test}" img').code, 1, "--name=");
  assert.equal(sh(t, 'docker volume create "${V:-cache}"').code, 1, "a volume");
  assert.equal(sh(t, 'docker network create "${N:-web}"').code, 1, "a network");
  assert.equal(sh(t, 'docker build -t "${TAG:-img:dev}" .').code, 1, "an image a test builds");
});

test("S8 review 2. a compose project name: -p, --project-name and COMPOSE_PROJECT_NAME with a literal default are judged on it", (t) => {
  for (const line of [
    'docker compose -p "${PROJECT:-myproj}" up -d',
    'docker compose --project-name "${PROJECT:-myproj}" up -d',
    'docker compose --project-name="${PROJECT:-myproj}" up -d',
    'docker-compose -p ${PROJECT:-myproj} up -d',
    "COMPOSE_PROJECT_NAME=${X:-fixed} docker compose up -d",
    'COMPOSE_PROJECT_NAME="${X:-fixed}" docker compose up -d',
    "export COMPOSE_PROJECT_NAME=${X:-fixed}",
    "COMPOSE_PROJECT_NAME: ${X:-fixed}",
    "COMPOSE_PROJECT_NAME=${X-fixed}",
  ]) {
    const result = sh(t, line);
    assert.equal(result.code, 1, `${line}: ${result.text}`);
    assert.match(result.text, /docker-name/, line);
  }
  for (const line of [
    `docker compose -p "\${PROJECT:-${GOOD}}" up -d`,
    `COMPOSE_PROJECT_NAME="\${X:-${GOOD}}" docker compose up -d`,
    `export COMPOSE_PROJECT_NAME=\${X:-${GOOD}}`,
  ]) assert.equal(sh(t, line).code, 0, line);
});

test("S8 review 2. still dynamic: a default that holds a `$`, an empty default, an alternate-value operator, a bare variable, `$(…)`", (t) => {
  for (const line of [
    'docker run --rm --name "${PG:-$OTHER}" img',
    'docker run --rm --name "${PG:-${OTHER:-x}}" img',
    'docker run --rm --name "${PG:-$(mk pg)}" img',
    'docker run --rm --name "${PG:-}" img',
    'docker run --rm --name "${PG:+fixed}" img',
    'docker run --rm --name "$PG" img',
    'docker run --rm --name "$(mk pg)" img',
    'docker compose -p "${PROJECT:-$USER}" up -d',
    "COMPOSE_PROJECT_NAME=${X:-$Y}",
  ]) assert.equal(sh(t, line).code, 0, line);
});

test("S8 review 2. a default plus more text is judged as text, as it always was", (t) => {
  assert.equal(sh(t, 'docker run --rm --name "${PG:-pg}-x" img').code, 1);
  assert.equal(sh(t, `docker run --rm --name "\${PG:-pg}-\${id}" img`).code, 1);
  assert.equal(sh(t, `docker run --rm --name "${GOOD}-\${id}" img`).code, 0);
});

test("S8 review 2. a single-quoted '${x}' is a shell literal: the name is the text `${x}`, a finding; double quotes and no quotes stay dynamic", (t) => {
  for (const line of [
    "docker run --rm --name '${name}' img",
    "docker run --rm --name='${name}' img",
    "docker run --rm --name '$name' img",
    "docker volume create '${volume}'",
    "docker compose -p '${project}' up -d",
    "COMPOSE_PROJECT_NAME='${project}' docker compose up -d",
    "export COMPOSE_PROJECT_NAME='$project'",
  ]) {
    const result = sh(t, line);
    assert.equal(result.code, 1, `${line}: ${result.text}`);
    assert.match(result.text, /docker-name/, line);
  }
  const shown = sh(t, "docker run --rm --name '${name}' img").text;
  assert.ok(shown.includes("`--name ${name}`"), "the finding names the text as written, not a masked one: " + shown);
  for (const line of [
    'docker run --rm --name "${name}" img',
    'docker run --rm --name "it\'s ${name}" img',
    "docker run --rm --name ${name} img",
    `docker run --rm --name '${GOOD}' img`,
  ]) assert.equal(sh(t, line).code, line.includes("it's") ? 1 : 0, line);
});

test("S8 review 2. the header says that a `$(…)` is dynamic because a text scan cannot know it", () => {
  const header = read("tools", "leftovers-check.mjs").slice(0, 6000);
  assert.match(header, /\$\(…\)/);
  assert.match(header, /known limit/i);
  assert.match(header, /default/);
});

// 4 — the profile's scripts and tests, the cure texts, the yaml version ------------------------------------------------------------

const COMMIT = ["-c", "user.name=Guard test", "-c", "user.email=guard@example.invalid", "-c", "commit.gpgsign=false", "commit", "-qm", "consumer"];

test("S8 review 4a. under --profile node every TEXT file of scripts/, test/ and tests/ is read, extensionless ones included", (t) => {
  const repo = tree(t, {
    "scripts/start-db": '#!/bin/sh\ndocker run --rm --name fixed img\n',
    "test/fixtures/run": "docker run --rm --name fixed2 img\n",
    "tests/helpers/up.cmd": "docker run --rm --name fixed3 img\n",
    "src/a.test.ts": "const a = 1;\n",
  });
  const profiled = guard(repo, ["--profile", "node"]);
  assert.equal(profiled.code, 1, profiled.text);
  for (const file of ["scripts/start-db:2", "test/fixtures/run:1", "tests/helpers/up.cmd:1"]) assert.match(profiled.text, new RegExp(`${file} — docker-name`), file);
  assert.equal(guard(tree(t, { "scripts/start-db": "docker run --rm --name fixed img\n", "tools/x.test.mjs": "const a = 1;\n" })).code, 0, "without the profile the extensionless file is not read, as today");
  for (const file of ["scripts/start-db", "scripts/deep/run", "test/Makefile", "tests/data.json", "tests/e2e/up.cmd"]) assert.equal(isScanned(file, "node"), true, `${file} is read under the profile`);
  for (const file of ["scripts/start-db", "test/Makefile", "tests/data.json"]) assert.equal(isScanned(file), false, `${file} is not read without it`);
  for (const file of ["scripts/logo.png", "test/fixtures/photo.JPG", "tests/a.zip", "scripts/fonts/x.woff2", "test/data.sqlite", "scripts/tool.exe", "test/lib.wasm", "tests/a.pdf", "scripts/node_modules/p/x", "src/start-db", "docs/scripts/x.sh.bak"]) {
    assert.equal(isScanned(file, "node"), false, `${file} is never read under the profile`);
  }
});

test("S8 review 4a. a file with a NUL byte in its first 8 KiB is binary and skipped; one with a NUL later is text", (t) => {
  const line = "docker run --rm --name fixed img\n";
  const repo = tree(t, { "src/a.test.ts": "const a = 1;\n" });
  fs.mkdirSync(path.join(repo, "scripts"));
  fs.writeFileSync(path.join(repo, "scripts", "blob"), Buffer.concat([Buffer.from([0x7f, 0x45, 0x00, 0x01]), Buffer.from(line)]));
  fs.writeFileSync(path.join(repo, "scripts", "late"), Buffer.concat([Buffer.from(line), Buffer.alloc(8192, 0x20), Buffer.from([0])]));
  const result = scanRepository({ repo, profile: "node", rule: path.join(root, "common", "test-leftovers-detail.md") });
  const where = result.findings.filter((entry) => entry.cls === "docker-name").map((entry) => entry.file);
  assert.deepEqual(where, ["scripts/late"], "blob is binary (a NUL at byte 2); late holds its first NUL after 8 KiB and is read");
  assert.equal(result.files, 2, "the skipped binary is not counted as scanned: a.test.ts and late");
  const onlyBinary = tree(t, {});
  fs.mkdirSync(path.join(onlyBinary, "scripts"));
  fs.writeFileSync(path.join(onlyBinary, "scripts", "blob"), Buffer.from([0, 1, 2]));
  assert.equal(guard(onlyBinary, ["--profile", "node"]).code, 2, "a profile that read only binaries scanned nothing");
});

test("S8 review 4a. the header says which files the profile reads", () => {
  const header = read("tools", "leftovers-check.mjs").slice(0, 6500);
  assert.match(header, /every text file/i);
  assert.match(header, /NUL/);
});

test("S8 review 4b. no cure text names the legacy form: a name is testsToDelete-<owner>-<repo>-<what>-<id>", () => {
  for (const [cls, text] of Object.entries(CURES)) {
    assert.doesNotMatch(text, new RegExp(`${Q}-<(?!owner>)`), `${cls}: ${text}`);
    assert.doesNotMatch(text, new RegExp(`${Q}-<repo>`), `${cls} names the form before the owner segment`);
  }
  assert.ok(CURES["docker-name"].includes(`${Q}-<owner>-<repo>-<what>-<id>`));
  assert.ok(CURES["docker-run"].includes(`${Q}-<owner>-`));
});

test("S8 review 4c. a yaml of another version is reported as the wrong version, not as missing", (t) => {
  const missing = () => { throw Object.assign(new Error("Cannot find module 'yaml'"), { code: "MODULE_NOT_FOUND" }); };
  const v1 = { parseDocument: () => ({}), stringify: () => "" }; // yaml@1 has parseDocument and no LineCounter
  assert.throws(() => loadYaml(undefined, { own: () => v1 }), (error) => error instanceof YamlMissingError && /not version 2/.test(error.message) && /yaml@2/.test(error.message) && !/cannot be found/.test(error.message));
  assert.throws(() => loadYaml("/repo", { own: missing, scanned: () => v1 }), /not version 2/);
  assert.throws(() => loadYaml("/repo", { own: missing, scanned: missing }), /cannot be found/, "nothing found stays 'cannot be found'");
  assert.throws(() => loadYaml("/repo", { own: () => v1, scanned: missing }), /not version 2/, "a v1 found first still says so when the other resolver finds nothing");
  const real = loadYaml(undefined);
  assert.equal(loadYaml("/repo", { own: () => v1, scanned: () => real }), real, "a version 2 anywhere wins");
  const repo = tree(t, { ".github/workflows/w.yaml": ["name: x", "on: push", "jobs:", "  j:", "    runs-on: ubuntu-latest", "    steps:", "      - run: echo ok"].join("\n") + "\n", "tools/x.test.mjs": "const a = 1;\n" });
  git(repo, "add", ".");
  git(repo, ...COMMIT);
  const lines = [];
  const code = main(["--repo", repo], { out: (line) => lines.push(line), err: (line) => lines.push(line) }, { own: () => v1, scanned: () => v1 });
  assert.equal(code, 2);
  assert.equal(lines.length, 1, "one sentence: " + lines.join("\n"));
  assert.match(lines[0], /not version 2/);
});

// 5 — F3: under --profile node the guard also reads the `scripts` of every package.json of the repository's own tree -----------------

const SWEEP = ["rm -rf /tmp/tests", "ToDelete-*"].join(""); // an owner-blind sweep: the prefix, no owner segment (in pieces, so the sweeper scan of this repository does not read it as one)
const manifest = (scripts, extra = {}) => `${JSON.stringify({ name: "consumer", version: "1.0.0", ...extra, scripts }, null, 2)}\n`;
const node = (repo, extra = []) => guard(repo, ["--profile", "node", ...extra]);
/** The findings of one file, from the structured scan. */
const foundIn = (repo, file) => scanRepository({ repo, profile: "node", rule: path.join(root, "common", "test-leftovers-detail.md") }).findings.filter((entry) => entry.file === file);
const BASE = { "src/a.test.ts": "const a = 1;\n" }; // something else to read, so a clean tree is not "scanned nothing"

test("F3 1. a pretest that sweeps the prefix with no owner is a finding that names the package.json and the script", (t) => {
  const repo = tree(t, { ...BASE, "package.json": manifest({ pretest: SWEEP }) });
  const result = node(repo);
  assert.equal(result.code, 1, result.text);
  assert.match(result.text, /package\.json:5 — owner-blind — /);
  assert.match(result.text, /script `pretest`/);
  const [one, ...rest] = foundIn(repo, "package.json");
  assert.equal(rest.length, 0, "one finding for one line");
  assert.equal(one.cls, "owner-blind");
});

test("F3 2. companion: an ordinary script is clean — the reader does not flag every script", (t) => {
  const repo = tree(t, { ...BASE, "package.json": manifest({ test: "node scripts/run-tests.mjs", build: "tsc -p .", lint: "eslint . && prettier --check ." }) });
  const result = node(repo);
  assert.equal(result.code, 0, result.text);
});

test("F3 3. a posttest that makes a temp folder is raw-temp, as the same line in a .sh file is", (t) => {
  const repo = tree(t, { ...BASE, "package.json": manifest({ posttest: "mktemp -d" }), "scripts/same.sh": "mktemp -d\n" });
  const [one, ...rest] = foundIn(repo, "package.json");
  assert.equal(rest.length, 0);
  assert.equal(one.cls, "raw-temp");
  assert.match(one.text, /mktemp/);
  assert.equal(foundIn(repo, "scripts/same.sh")[0].cls, "raw-temp", "the shell line gives the same class");
});

test("F3 4. a package.json under node_modules/ and under the two mount paths is not read", (t) => {
  const bad = manifest({ pretest: SWEEP });
  const repo = tree(t, { ...BASE, "node_modules/dep/package.json": bad, ".agents/conventions/package.json": bad, ".claude/rules/shared/package.json": bad, "packages/x/node_modules/y/package.json": bad });
  const result = node(repo);
  assert.equal(result.code, 0, result.text);
  for (const file of ["node_modules/dep/package.json", ".agents/conventions/package.json", ".claude/rules/shared/package.json", "packages/x/node_modules/y/package.json"]) assert.equal(foundIn(repo, file).length, 0, file);
  for (const file of ["node_modules/dep/package.json", ".agents/conventions/package.json", ".claude/rules/shared/package.json", "packages/x/node_modules/y/package.json"]) assert.equal(isPackageManifest(file, "node"), false, `${file} is not a manifest the profile reads`);
  assert.equal(isPackageManifest("packages/x/package.json", "node"), true);
  assert.equal(isPackageManifest("packages/x/package.json"), false, "without the profile none is read");
});

test("F3 5. a package.json that is not valid JSON is ONE finding that names the file; the scan does not crash and does not skip it", (t) => {
  for (const [what, text] of [["truncated", '{ "scripts": { "pretest": '], ["empty", ""], ["binary", "{\u0000}"], ["a list", "[]"], ["scripts is a string", '{ "scripts": "npm test" }'], ["scripts is a list", '{ "scripts": ["a"] }'], ["a script is not a string", '{ "scripts": { "test": 1 } }'], ["scripts is null", '{ "scripts": null }']]) {
    const repo = tree(t, { ...BASE, "package.json": text });
    const found = foundIn(repo, "package.json");
    assert.equal(found.length, 1, `${what}: ${JSON.stringify(found)}`);
    assert.equal(found[0].cls, "unreadable", what);
    assert.match(found[0].text, /package\.json|could not be read/, what);
    const result = node(repo);
    assert.equal(result.code, 1, `${what}: ${result.text}`);
    assert.match(result.text, /package\.json:\d+ — unreadable — /, what);
  }
  const only = tree(t, { "package.json": "not json" });
  assert.equal(node(only).code, 1, "a repository whose only input is an unreadable manifest is a finding, not 'scanned nothing'");
});

test("F3 6. without --profile node the same tree's package.json gives no finding", (t) => {
  const repo = tree(t, { "tools/x.test.mjs": "const a = 1;\n", "package.json": manifest({ pretest: SWEEP, posttest: "mktemp -d" }), "bad/package.json": "{" });
  const result = guard(repo);
  assert.equal(result.code, 0, result.text);
  assert.equal(scanRepository({ repo, rule: path.join(root, "common", "test-leftovers-detail.md") }).findings.filter((entry) => entry.file.endsWith("package.json")).length, 0);
  assert.equal(isScanned("package.json"), false);
  assert.equal(isScanned("package.json", "node"), false, "the manifest is read by its own reader, not as a text file");
});

test("F3 7. a nested package.json is read and the finding names that path", (t) => {
  const repo = tree(t, { ...BASE, "src_vs_code/package.json": manifest({ pretest: SWEEP }), "package.json": manifest({ test: "node a.mjs" }) });
  const result = node(repo);
  assert.equal(result.code, 1, result.text);
  assert.match(result.text, /src_vs_code\/package\.json:5 — owner-blind — .*script `pretest`/);
  assert.deepEqual(foundIn(repo, "package.json"), [], "the clean root manifest has none");
});

test("F3 8. the line is the line of the key inside `scripts`, never the same key of another object", (t) => {
  const text = ['{', '  "name": "x",', '  "dependencies": {', '    "pretest": "x"', '  },', '  "config": { "scripts": { "pretest": "y" } },', '  "scripts": {', '    "lint": "eslint .",', `    "pretest": ${JSON.stringify(SWEEP)}`, '  },', '  "devDependencies": { "pretest": "z" }', '}', ''].join("\n");
  const repo = tree(t, { ...BASE, "package.json": text });
  const [one, ...rest] = foundIn(repo, "package.json");
  assert.equal(rest.length, 0);
  assert.equal(one.line, 9, "the key `pretest` inside the top-level scripts object");
  const reordered = tree(t, { ...BASE, "package.json": ['{', '  "scripts": {', `    "pretest": ${JSON.stringify(SWEEP)}`, '  },', '  "dependencies": { "pretest": "x" }', '}', ''].join("\n") });
  assert.equal(foundIn(reordered, "package.json")[0].line, 3);
  const oneLine = tree(t, { ...BASE, "package.json": `{ "dependencies": { "pretest": "x" }, "scripts": { "pretest": ${JSON.stringify(SWEEP)} } }\n` });
  assert.equal(foundIn(oneLine, "package.json")[0].line, 1);
});

test("F3 9. a chain is read like a shell line: the second command, a pipe, a `;`, an environment prefix and a line break are found", (t) => {
  for (const [what, value] of [["&&", `node a.mjs && ${SWEEP}`], ["||", `node a.mjs || ${SWEEP}`], [";", `node a.mjs; ${SWEEP}`], ["pipe", `echo y | ${SWEEP}`], ["env prefix", `FOO=1 ${SWEEP}`], ["line break", `node a.mjs\n${SWEEP}`]]) {
    const repo = tree(t, { ...BASE, "package.json": manifest({ test: value }) });
    const found = foundIn(repo, "package.json");
    assert.equal(found.length, 1, `${what}: ${JSON.stringify(found)}`);
    assert.equal(found[0].cls, "owner-blind", what);
    assert.equal(found[0].line, 5, `${what}: the line of the key`);
  }
});

test("F3 10. a package.json with no scripts field is valid and has nothing to scan: no finding", (t) => {
  const repo = tree(t, { ...BASE, "package.json": `${JSON.stringify({ name: "x", dependencies: { pretest: "1" } }, null, 2)}\n`, "empty/package.json": "{}\n", "noscripts/package.json": manifest({}) });
  const result = node(repo);
  assert.equal(result.code, 0, result.text);
});

test("F3 11. the manifest has no inline exemption: a marker inside a script value exempts nothing, on its own line above or on the same line", (t) => {
  const marker = "testsToDelete-exempt: raw-temp — a reason that is long enough";
  const repo = tree(t, { ...BASE, "package.json": manifest({ above: `# ${marker}\nmktemp -d`, same: `mktemp -d # ${marker}`, pretest: SWEEP }) });
  const found = foundIn(repo, "package.json");
  assert.deepEqual(found.map((entry) => `${entry.cls}:${entry.line}`).sort(), ["owner-blind:7", "raw-temp:5", "raw-temp:6"], JSON.stringify(found));
});

test("F3 12. the header and the README say what the profile reads of a package.json and that it has no exemption", () => {
  const header = read("tools", "leftovers-check.mjs").slice(0, 9500);
  assert.match(header, /package\.json/);
  assert.match(header, /`scripts`/);
  assert.match(header, /no (?:inline )?exemption/i);
  assert.match(header, /always the line of the script's KEY/, "a finding's line is the key's line, also for a value with line breaks");
  assert.match(read("README.md"), /`scripts` values of every `package\.json`/);
});

// F3 review fixes -------------------------------------------------------------------------------------------------------------------

test("F3 13. [Opus 1] a clean package.json does not hide `scanned nothing`: tests the profile does not find plus a manifest is still exit 2", (t) => {
  const repo = tree(t, { "__tests__/a.ts": "const a = 1;\n", "package.json": manifest({ test: "jest" }) });
  const result = node(repo);
  assert.equal(result.code, 2, result.text);
  assert.match(result.text, /scanned nothing/);
  assert.equal(node(tree(t, { "__tests__/a.ts": "const a = 1;\n", "package.json": manifest({}), "b/package.json": "{}" })).code, 2, "manifests with no scripts count for nothing either");
  assert.equal(node(tree(t, { "__tests__/a.ts": "const a = 1;\n", "package.json": manifest({ pretest: SWEEP }) })).code, 1, "a manifest that yields a finding is a finding, not 'scanned nothing'");
  assert.equal(node(tree(t, { "package.json": "not json" })).code, 1, "an unreadable manifest alone stays exit 1");
});

test("F3 14. [Opus 2] --print-baseline lists no manifest site: no baseline can carry one", (t) => {
  const repo = tree(t, { "src/a.test.ts": "const d = mkdtempSync(join(tmpdir(), 'x'));\n", "package.json": manifest({ posttest: "mktemp -d" }) });
  const result = node(repo, ["--print-baseline"]);
  assert.equal(result.code, 0, result.text);
  const listed = JSON.parse(result.text);
  assert.deepEqual(listed.entries.map((entry) => entry.file), ["src/a.test.ts"], "the test file's site is listed, the manifest's is not");
});

test("F3 15. [Opus 3] the `unreadable` cure points at a place that exists", () => {
  assert.doesNotMatch(CURES.unreadable, /§7/, "the rule has no section for the node profile");
  assert.match(CURES.unreadable, /leftovers-check\.mjs/);
  assert.match(read("tools", "leftovers-check.mjs").slice(0, 9500), /`unreadable`/, "and the header it names does say what the class is");
});

test("F3 16. [code1 0] the BOM is written as an escape, not as an invisible character", () => {
  assert.doesNotMatch(read("tools", "lib", "leftovers-package.mjs"), /\uFEFF/, "no U+FEFF character in the source: the regex says \\uFEFF");
});

test("F3 17. [Opus 4] the key walker: CRLF, a BOM, escaped quotes, and a nested `config.scripts` before the top-level one", (t) => {
  const crlf = ["{", '  "name": "x",', '  "scripts": {', '    "a": "echo ok",', `    "pretest": ${JSON.stringify(SWEEP)}`, "  }", "}", ""].join("\r\n");
  assert.equal(foundIn(tree(t, { ...BASE, "package.json": crlf }), "package.json")[0].line, 5, "CRLF");
  assert.equal(foundIn(tree(t, { ...BASE, "package.json": `\uFEFF${crlf}` }), "package.json")[0].line, 5, "a BOM in front");
  const escaped = ["{", '  "name": "a \\"scripts\\": {",', '  "scripts": {', '    "x\\"y": "echo ok",', `    "pre\\"test": ${JSON.stringify(SWEEP)},`, '    "q": "echo \\"pretest\\": 1"', "  }", "}", ""].join("\n");
  const found = foundIn(tree(t, { ...BASE, "package.json": escaped }), "package.json");
  assert.deepEqual(found.map((entry) => entry.line), [5], "escaped quotes in a value and in a key do not end the string early");
  const nested = ["{", '  "config": {', '    "scripts": {', '      "pretest": "x"', "    }", "  },", '  "scripts": {', `    "pretest": ${JSON.stringify(SWEEP)}`, "  }", "}", ""].join("\n");
  assert.equal(foundIn(tree(t, { ...BASE, "package.json": nested }), "package.json")[0].line, 8, "the top-level scripts, not the nested one");
  const flat = `{"config":{"scripts":{"pretest":"x"}},"scripts":{"pretest":${JSON.stringify(SWEEP)}}}`;
  assert.equal(foundIn(tree(t, { ...BASE, "package.json": flat }), "package.json")[0].line, 1);
});

test("F3 18. [code1 7] a manifest that cannot be read after discovery is ONE unreadable finding and the scan goes on", (t) => {
  const repo = tree(t, { ...BASE, "good/package.json": manifest({ pretest: SWEEP }) });
  fs.symlinkSync(".", path.join(repo, "package.json"), "dir"); // listed as a file by git, read as a directory
  const found = scanRepository({ repo, profile: "node", rule: path.join(root, "common", "test-leftovers-detail.md") }).findings;
  assert.deepEqual(found.filter((entry) => entry.file === "package.json").map((entry) => entry.cls), ["unreadable"]);
  assert.deepEqual(found.filter((entry) => entry.file === "good/package.json").map((entry) => entry.cls), ["owner-blind"], "the next manifest is still scanned");
});

test("F3 19. [code1 8] a control character in a script name is escaped in the finding text", (t) => {
  const scripts = { "pre\ntest": SWEEP, "x\u001b[31my": "mktemp -d" };
  const repo = tree(t, { ...BASE, "package.json": manifest(scripts) });
  const found = foundIn(repo, "package.json");
  assert.equal(found.length, 2);
  for (const entry of found) assert.doesNotMatch(entry.text, /[\u0000-\u001f\u007f]/, JSON.stringify(entry.text));
  assert.match(found.map((entry) => entry.text).join("\n"), /script `pre\\u000atest`/);
  assert.match(found.map((entry) => entry.text).join("\n"), /script `x\\u001b\[31my`/);
  const text = node(repo).text;
  assert.doesNotMatch(text.replaceAll("\n", ""), /\u001b/, "no raw ESC on the terminal");
  const bad = foundIn(tree(t, { ...BASE, "package.json": '{ "scripts": {\n"a\u001b": }' }), "package.json");
  assert.doesNotMatch(bad[0].text, /[\u0000-\u001f\u007f]/, "the reason of an unreadable manifest is escaped too");
});
