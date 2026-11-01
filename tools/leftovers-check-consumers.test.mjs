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
import { CURES, EXCLUDED_FILES, isScanned, loadYaml, main, scanRepository, tokenConstants, YamlMissingError } from "./leftovers-check.mjs";

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
