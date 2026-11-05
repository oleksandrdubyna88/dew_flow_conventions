#!/usr/bin/env node
/**
 * `leftovers-check.mjs`'s own tests (E1 S4): the guard is green over THIS repository, red on every class of
 * `common/test-leftovers.md` §7 on a tree written at runtime, red on a scan of nothing, and red on an
 * unregistered token. Fixtures are strings written into owned folders — never committed under a name
 * `node --test` would discover; this file is the one the guard itself does not read (it carries the violations).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

import { spawnSync } from "node:child_process";
import { git } from "./lib/git.mjs";
import * as fold from "./lib/leftovers-fold.mjs";
import * as sweeper from "./lib/sweeper-scan.mjs";
import { MAX_CLAIM_BYTES, OWNER_GRAMMAR, REPO_ROW, REPO_TOKEN, TOKEN_SHAPE, classifyName, ownedDir } from "./lib/owned.mjs";
import { CURES, EXCLUDED_FILES, FOLDING_ALLOWANCES, LEGACY_NAME_PENDING, isScanned, main, parseArguments, resolveRule, scanRepository, scanText, tokenConstants, tokenFindings, parseTokenTable } from "./leftovers-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RULE = path.join(root, "common", "test-leftovers-detail.md"); // the rule file that holds the Tokens table since the split

test("resolveRule: --rule wins; else the repository's detail, then its core (an old mount), then the files beside the tool in that order", (t) => {
  const repo = ownedDir(t, "resolve rule");
  const core = path.join(repo, "common", "test-leftovers.md");
  const detail = path.join(repo, "common", "test-leftovers-detail.md");
  assert.equal(resolveRule(repo, undefined), RULE, "nothing in the repository: the detail beside the tool");
  fs.mkdirSync(path.dirname(core), { recursive: true });
  fs.writeFileSync(core, "## Tokens\n");
  assert.equal(resolveRule(repo, undefined), core, "a mount from before the split holds the table in the core");
  fs.writeFileSync(detail, "## Tokens\n");
  assert.equal(resolveRule(repo, undefined), detail, "the detail is preferred over the core beside it");
  const explicit = path.join(repo, "rule.md");
  fs.writeFileSync(explicit, "## Tokens\n");
  assert.equal(resolveRule(repo, explicit), explicit, "--rule is the only candidate");
  assert.equal(resolveRule(repo, path.join(repo, "absent.md")), undefined, "an absent --rule resolves to nothing, never to a fallback");
});

/** A git repository in an owned folder holding `files` (path → text); returns its path. */
function tree(t, files = {}) {
  const repo = ownedDir(t, "leftovers");
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

const one = (t, name, text) => guard(tree(t, { [name]: text }));
const FOOT = "\n";

// the workflow shapes of the docker carve-out -----------------------------------------------------------------

const NAME = "testsToDelete-u1000-x-abc123";
const VOLUME = "testsToDelete-u1000-x-data-abc123";

function workflow({ run = `docker run -d --name ${NAME} img`, steps = [] } = {}) {
  const body = [
    "name: x", "on: push", "jobs:", "  j:", "    runs-on: ubuntu-latest", "    steps:",
    "      - name: start", `        run: ${run}`,
    ...steps.flatMap(({ name, run: command, always, keep }) => [
      `      - name: ${name}`,
      ...(always ? ["        if: always()"] : []),
      ...(keep ? ["        continue-on-error: true"] : []),
      `        run: ${command}`,
    ]),
  ];
  return body.join("\n") + FOOT;
}

const logs = { name: "logs", run: `docker logs ${NAME}` };
const remover = (extra = {}, command = `docker rm -f -v ${NAME}`) => ({ name: "cleanup", run: command, always: true, keep: true, ...extra });

// 1 ---------------------------------------------------------------------------------------------------------------

test("the report names the rule file the scan resolved: the detail where it exists, the core on an older core-only mount", (t) => {
  const table = "## Tokens\n\n| token | family | repository |\n|---|---|---|\n| `conventions` | dew_flow | the shared-rules repository |\n";
  const finding = { "tools/x.test.mjs": "import fs from 'node:fs';\nconst d = fs.mkdtempSync('x-');\n" };
  const old = guard(tree(t, { ...finding, "common/test-leftovers.md": table }));
  assert.equal(old.code, 1);
  assert.match(old.text, /see common\/test-leftovers\.md §7/, "the header names the core of an old mount");
  assert.match(old.text, /raw-temp: .*common\/test-leftovers\.md §7 \(raw-temp\)/, "the cure names the core of an old mount");
  assert.doesNotMatch(old.text, /test-leftovers-detail\.md/, "an old mount has no detail file to point at");
  const split = guard(tree(t, { ...finding, "common/test-leftovers.md": "# the core\n", "common/test-leftovers-detail.md": table }));
  assert.equal(split.code, 1);
  assert.match(split.text, /see common\/test-leftovers-detail\.md §7/, "the header names the detail where it exists");
  assert.match(split.text, /raw-temp: .*common\/test-leftovers-detail\.md §7 \(raw-temp\)/, "the cure names the detail where it exists");
  assert.doesNotMatch(split.text, /raw-temp: .*common\/test-leftovers\.md §7/);
});

test("1. this repository passes the guard", () => {
  const result = guard(root);
  assert.equal(result.code, 0, result.text);
  assert.match(result.text, /clean/);
});

test("1b. every site of the migration table is gone: no mkdtemp, no tmpdir, no raw worktree in tools/*.test.mjs", () => {
  const offenders = fs.readdirSync(path.join(root, "tools")).filter((name) => name.endsWith(".test.mjs") && !EXCLUDED_FILES.includes(`tools/${name}`))
    .filter((name) => /mkdtemp|\btmpdir\s*\(|process\.env\.TEMP/.test(fs.readFileSync(path.join(root, "tools", name), "utf8")));
  assert.deepEqual(offenders, []);
});

// 2 — break-it per class -----------------------------------------------------------------------------------------

test("2. raw-temp: mkdtempSync, os.tmpdir(), process.env.TMPDIR each name their line", (t) => {
  for (const [code, pattern] of [
    ["const d = fs.mkdtempSync(path.join(base, 'x-'));", /mkdtempSync/],
    ["const d = os.tmpdir();", /tmpdir/],
    ["const d = process.env.TMPDIR;", /TMPDIR/],
    ["const d = process.env.TEMP ?? '/tmp';", /TEMP/],
  ]) {
    const result = one(t, "tools/x.test.mjs", `import fs from 'node:fs';\n${code}\n`);
    assert.equal(result.code, 1, code);
    assert.match(result.text, /tools\/x\.test\.mjs:2 — raw-temp/);
    assert.match(result.text, pattern);
  }
});

test("2. raw-temp in the other languages: mktemp in .sh, New-TemporaryFile and $env:TEMP in .ps1, GetTempPath", (t) => {
  assert.equal(one(t, "tools/a.sh", "d=$(mktemp -d)\n").code, 1);
  assert.equal(one(t, "tools/a.ps1", "$f = New-TemporaryFile\n").code, 1);
  assert.equal(one(t, "tools/b.ps1", "$d = $env:TEMP\n").code, 1);
  assert.equal(one(t, "tools/c.test.mjs", "const p = Path.GetTempPath();\n").code, 1);
});

test("2. raw-temp in C#: Directory.CreateTempSubdirectory and Path.GetTempFileName name their line", (t) => {
  for (const [code, pattern] of [
    ["var d = Directory.CreateTempSubdirectory(\"x-\");", /CreateTempSubdirectory/],
    ["var f = Path.GetTempFileName();", /GetTempFileName/],
  ]) {
    const result = one(t, "tools/x.test.mjs", `// c#\n${code}\n`);
    assert.equal(result.code, 1, code);
    assert.match(result.text, /tools\/x\.test\.mjs:2 — raw-temp/);
    assert.match(result.text, pattern);
  }
});

test("2. raw-temp: a whole-line comment is not a use; a lookalike word is not a use", (t) => {
  assert.equal(one(t, "tools/x.test.mjs", "// mkdtempSync is what we replaced\n# tmpdir()\nconst a = 'mkdtemp';\n").code, 0);
});

test("2. raw-worktree: git(r,\"worktree\",\"add\",p) and `git worktree add` both name their line", (t) => {
  const js = one(t, "tools/x.test.mjs", 'git(r,"worktree","add",p);\n');
  assert.equal(js.code, 1);
  assert.match(js.text, /x\.test\.mjs:1 — raw-worktree/);
  assert.equal(one(t, "tools/y.sh", "git worktree add ../w main\n").code, 1);
});

test("2. docker-run: a named run with no remover is `permits dropping --rm`", (t) => {
  const result = one(t, ".github/workflows/w.yml", workflow());
  assert.equal(result.code, 1);
  assert.match(result.text, /w\.yml:\d+ — docker-run — .*permits dropping --rm/);
});

test("2. docker-run: --rm is complete by itself", (t) => {
  assert.equal(one(t, ".github/workflows/w.yml", workflow({ run: "docker run --rm img" })).code, 0);
  assert.equal(one(t, "tools/r.sh", "docker run -d --rm --name testsToDelete-u1000-x-abc123 img\n").code, 0);
});

test("2. docker-run: the carve-out — a later always() + continue-on-error step AFTER the readers is clean", (t) => {
  assert.equal(one(t, ".github/workflows/w.yml", workflow({ steps: [logs, remover()] })).code, 0);
});

test("2. docker-run: the remover BEFORE the logs step is a finding", (t) => {
  const result = one(t, ".github/workflows/w.yml", workflow({ steps: [remover(), logs] }));
  assert.equal(result.code, 1);
  assert.match(result.text, /docker-run/);
});

test("2. docker-run: without always() is a finding; without continue-on-error is a finding", (t) => {
  assert.equal(one(t, ".github/workflows/w.yml", workflow({ steps: [logs, remover({ always: false })] })).code, 1);
  assert.equal(one(t, ".github/workflows/w.yml", workflow({ steps: [logs, remover({ keep: false })] })).code, 1);
});

test("2. docker-run: an exec reader (or cp, inspect, wait, diff) after the remover is a finding", (t) => {
  for (const verb of ["exec", "cp", "inspect", "wait", "diff"]) {
    const reader = { name: "after", run: `docker ${verb} ${NAME} true` };
    assert.equal(one(t, ".github/workflows/w.yml", workflow({ steps: [remover(), reader] })).code, 1, verb);
  }
});

test("2. docker-run: a named volume must be removed too, and must carry a testsToDelete name", (t) => {
  const run = `docker run -d --name ${NAME} -v ${VOLUME}:/data img`;
  const both = remover({}, `docker rm -f -v ${NAME}\n          docker volume rm ${VOLUME}`).run;
  const full = { ...remover(), run: `|\n          ${both}` };
  assert.equal(one(t, ".github/workflows/w.yml", workflow({ run, steps: [logs, remover()] })).code, 1, "volume not removed");
  assert.equal(one(t, ".github/workflows/w.yml", workflow({ run, steps: [logs, full] })).code, 0, "volume removed");
  assert.equal(one(t, ".github/workflows/w.yml", workflow({ run: `docker run -d --name ${NAME} -v data:/data img`, steps: [logs, remover()] })).code, 1, "unprefixed volume");
});

test("2. docker-run in .sh: a trap on an EARLIER line is clean, a trap after the run is a finding", (t) => {
  const trap = `trap 'docker rm -f -v ${NAME} || true; docker volume rm ${VOLUME} || true' EXIT`;
  const run = `docker run -d --name ${NAME} -v ${VOLUME}:/data img`;
  assert.equal(one(t, "tools/s.sh", `${trap}\n${run}\n`).code, 0);
  assert.equal(one(t, "tools/s.sh", `${run}\n${trap}\n`).code, 1);
  assert.equal(one(t, "tools/s.sh", `trap 'docker rm -f -v ${NAME} || true' EXIT\n${run}\n`).code, 1, "volume missing from the trap");
});

test("2. docker-name: volume create / network create / --name / WithName without a spelling", (t) => {
  const volume = one(t, "tools/v.sh", "docker volume create cache\n");
  assert.equal(volume.code, 1);
  assert.match(volume.text, /v\.sh:1 — docker-name/);
  assert.equal(one(t, "tools/n.sh", "docker network create net\n").code, 1);
  assert.equal(one(t, "tools/c.sh", "docker run --rm --name web img\n").code, 1);
  assert.equal(one(t, "tools/w.test.mjs", 'new ContainerBuilder().WithName("db");\n').code, 1);
  assert.equal(one(t, "tools/ok.sh", "docker volume create testsToDelete-u1000-x-cache-abc123\n").code, 0);
  assert.equal(one(t, "tools/ok2.test.mjs", 'new ContainerBuilder().WithName("testsToDelete-u1000-x-db-abc123");\n').code, 0);
});

test("2. docker-name: a compose project name — -p, --project-name, COMPOSE_PROJECT_NAME — needs a spelling", (t) => {
  const GOOD = "testsToDelete-u1000-x-stack-abc123";
  for (const command of [
    "docker compose -p web up -d",
    "docker compose --project-name web up -d",
    "docker compose --project-name=web up -d",
    "docker-compose -p web up -d",
    "docker compose -f a.yml -p web up -d",
    "COMPOSE_PROJECT_NAME=web docker compose up -d",
    "export COMPOSE_PROJECT_NAME=web",
  ]) {
    const result = one(t, "tools/c.sh", `${command}\n`);
    assert.equal(result.code, 1, command);
    assert.match(result.text, /c\.sh:1 — docker-name/, command);
  }
  const workflow = ["name: x", "on: push", "jobs:", "  j:", "    runs-on: ubuntu-latest", "    env:", "      COMPOSE_PROJECT_NAME: web", "    steps:", "      - run: docker compose up -d"].join("\n") + FOOT;
  assert.equal(one(t, ".github/workflows/c.yml", workflow).code, 1, "a workflow env");
  assert.equal(one(t, "tools/c.test.mjs", 'spawn("docker", ["compose", "up"], { env: { COMPOSE_PROJECT_NAME: "web" } });\n').code, 1, "a spawn env");
  for (const command of [
    `docker compose -p ${GOOD} up -d`,
    `docker compose --project-name ${GOOD} up -d`,
    `docker-compose -f a.yml -p teststodelete-u1000-x-s-abc123 up -d`,
    `COMPOSE_PROJECT_NAME=${GOOD} docker compose up -d`,
    "docker compose up -d",
    "docker compose run -p 8080:80 svc",
    "docker compose -f a.yml run -p 8080:80 svc",
  ]) assert.equal(one(t, "tools/ok.sh", `${command}\n`).code, 0, command);
  assert.equal(one(t, "tools/ok.test.mjs", `spawn("docker", ["compose", "up"], { env: { COMPOSE_PROJECT_NAME: "${GOOD}" } });\n`).code, 0);
  assert.equal(one(t, "tools/ex.sh", "# testsToDelete-exempt: docker-name — the compose file is the product's own sample\ndocker compose -p web up -d\n").code, 0, "an exemption clears it");
});

test("2. docker-name: a test-built image tag; a pushed one is the publish and out of scope", (t) => {
  assert.equal(one(t, "tools/b.sh", "docker build -t app .\n").code, 1);
  assert.equal(one(t, "tools/b.sh", "docker build -t app .\ndocker push app\n").code, 0);
  assert.equal(one(t, "tools/b.sh", "docker build -t testsToDelete-u1000-x-img-abc123 .\n").code, 0);
  const published = [
    "name: x", "on: push", "jobs:", "  publish:", "    runs-on: ubuntu-latest", "    steps:",
    "      - run: docker build -t reg/app:1 .", "      - run: docker push reg/app:1",
  ].join("\n") + FOOT;
  assert.equal(one(t, ".github/workflows/p.yml", published).code, 0);
  assert.equal(one(t, ".github/workflows/p.yml", published.replace("docker push reg/app:1", "echo built")).code, 1);
});

test("2. shared-store: TRUNCATE is a finding; an exemption with a lock clears it; one without lock: is an `exemption`", (t) => {
  const sql = 'psql -c "TRUNCATE TABLE users"\n';
  const reason = "pg:5432 users; reuse intentional; lock: pg_advisory_lock(42)";
  const bare = one(t, "tools/d.sh", sql);
  assert.equal(bare.code, 1);
  assert.match(bare.text, /d\.sh:1 — shared-store/);
  assert.equal(one(t, "tools/d.sh", `# testsToDelete-exempt: shared-store — ${reason}\n${sql}`).code, 0);
  const noLock = one(t, "tools/d.sh", `# testsToDelete-exempt: shared-store — pg:5432 users; reuse intentional\n${sql}`);
  assert.equal(noLock.code, 1);
  assert.match(noLock.text, /d\.sh:1 — exemption/);
  assert.match(noLock.text, /d\.sh:2 — shared-store/);
});

test("2. shared-store: the other shapes, a prefixed target, and prose never match", (t) => {
  assert.equal(one(t, "tools/d.sh", 'psql -c "DROP DATABASE prod"\n').code, 1);
  assert.equal(one(t, "tools/d.sh", "redis-cli FLUSHALL\n").code, 1);
  assert.equal(one(t, "tools/d.test.mjs", "await users.deleteMany({});\n").code, 1);
  assert.equal(one(t, "tools/d.sh", 'psql -c "DROP DATABASE testsToDelete-u1000-x-db-abc123"\n').code, 0);
  assert.equal(one(t, "tools/d.sh", "# the table was truncated\necho truncated rows\n").code, 0);
  assert.equal(one(t, "tools/d.sh", "-- TRUNCATE TABLE users\n").code, 0, "a SQL comment line");
});

test("2. ryuk-off: TESTCONTAINERS_RYUK_DISABLED true is a finding, even under an exemption", (t) => {
  const yaml = "env:\n  TESTCONTAINERS_RYUK_DISABLED: \"true\"\n";
  const plain = one(t, ".github/workflows/r.yml", `name: x\non: push\n${yaml}jobs: {}\n`);
  assert.equal(plain.code, 1);
  assert.match(plain.text, /r\.yml:4 — ryuk-off/);
  const exempt = one(t, "tools/r.sh", "# testsToDelete-exempt: ryuk-off — this is a perfectly fine reason\nexport TESTCONTAINERS_RYUK_DISABLED=true\n");
  assert.equal(exempt.code, 1);
  assert.match(exempt.text, /r\.sh:1 — exemption/);
  assert.match(exempt.text, /r\.sh:2 — ryuk-off/);
  assert.equal(one(t, "tools/r.sh", "export TESTCONTAINERS_RYUK_DISABLED=false\n").code, 0);
});

test("2. exemptions: a well-formed one clears its class; the line above or the same line both count", (t) => {
  const reason = "a relative-path worktree the helper never makes here";
  assert.equal(one(t, "tools/x.test.mjs", `// testsToDelete-exempt: raw-worktree — ${reason}\ngit(r,"worktree","add",p);\n`).code, 0);
  assert.equal(one(t, "tools/x.test.mjs", `git(r,"worktree","add",p); // testsToDelete-exempt: raw-worktree — ${reason}\n`).code, 0);
  assert.equal(one(t, "tools/x.test.mjs", `// testsToDelete-exempt: raw-temp — ${reason}\ngit(r,"worktree","add",p);\n`).code, 1, "the wrong class clears nothing");
  assert.equal(one(t, "tools/x.test.mjs", `// testsToDelete-exempt: raw-temp — ${reason}\n\nconst d = os.tmpdir();\n`).code, 1, "two lines above is too far");
  assert.equal(one(t, "tools/x.test.mjs", `// testsToDelete-exempt: raw-temp — ${reason}\nconst d = os.tmpdir();\n`).code, 0);
});

test("2. exemption: reason-less, placeholder, class-less, unknown, ryuk-off are findings of class exemption", (t) => {
  for (const marker of [
    "testsToDelete-exempt: raw-temp — needed",
    "testsToDelete-exempt: raw-temp",
    "testsToDelete-exempt: — a perfectly fine reason here",
    "testsToDelete-exempt: nonsense — a perfectly fine reason here",
    "testsToDelete-exempt: ryuk-off — a perfectly fine reason here",
    "testsToDelete-exempt:",
  ]) {
    const result = one(t, "tools/x.test.mjs", `// ${marker}\nconst a = 1;\n`);
    assert.equal(result.code, 1, marker);
    assert.match(result.text, /x\.test\.mjs:1 — exemption/, marker);
  }
});

test("2. an exemption is inline only: no side file clears anything", (t) => {
  const repo = tree(t, { "tools/x.test.mjs": "const d = os.tmpdir();\n", ".leftovers-exempt": "tools/x.test.mjs\n", "exemptions.json": '{"raw-temp":["tools/x.test.mjs"]}' });
  assert.equal(guard(repo).code, 1);
});

test("2. scanText finds findings in the shape `file:line — class — text` through main()", (t) => {
  const result = one(t, "tools/x.test.mjs", "\nconst d = os.tmpdir();\n");
  assert.match(result.text, /^ {2}tools\/x\.test\.mjs:2 — raw-temp — `tmpdir\(`$/m);
  assert.match(result.text, /^ {2}raw-temp: .*§7/m, "one cure sentence per class, naming the rule");
});

test("2. scanText is pure: the same text twice gives the same findings", () => {
  const text = "const d = os.tmpdir();\n";
  assert.deepEqual(scanText("tools/x.test.mjs", text), scanText("tools/x.test.mjs", text));
});

// 3 ----------------------------------------------------------------------------------------------------------------

test("3. a scan of nothing is exit 2 with the discovery-broke sentence; so is a missing --repo", (t) => {
  const empty = guard(tree(t));
  assert.equal(empty.code, 2);
  assert.match(empty.text, /scanned nothing under .* — discovery broke; the repository is not clean/);
  const unrelated = guard(tree(t, { "README.md": "# nothing to scan\n" }));
  assert.equal(unrelated.code, 2, "files exist but none is in scope");
  const missing = guard(path.join(tree(t), "no-such-folder"));
  assert.equal(missing.code, 2);
  assert.equal(guard(root, ["--bogus", "x"]).code, 2, "bad arguments");
});

test("3. discovery reads the shapes of the brief and nothing under tools/lib", (t) => {
  const bad = "const d = os.tmpdir();\n";
  const read = (name) => one(t, name, bad).code;
  assert.equal(read("tools/a.test.mjs"), 1);
  assert.equal(read("tools/fixtures/f/helper.mjs"), 1);
  assert.equal(read(".github/scripts/s.mjs"), 1);
  assert.equal(read("deep/er/x.sh"), 1);
  assert.equal(read("deep/er/x.ps1"), 1);
  assert.equal(one(t, ".github/workflows/w.yaml", `name: x\non: push\njobs:\n  j:\n    runs-on: x\n    steps:\n      - run: echo ${bad}`).code, 1);
  assert.equal(one(t, "tools/lib/product.mjs", bad).code, 2, "product code is not scanned (and then nothing else is)");
  assert.equal(one(t, "tools/a.mjs", bad).code, 2, "a tool that is not a test is not scanned");
});

// 3a ---------------------------------------------------------------------------------------------------------------

test("3a. the repository's token is a row of the rule's table; the table is the eight rows of this family", () => {
  const table = parseTokenTable(fs.readFileSync(RULE, "utf8"));
  assert.deepEqual(table.header.map((cell) => cell.toLowerCase()), ["token", "family", "repository"]);
  assert.deepEqual(table.rows.map((row) => row.token), ["conventions", "creds", "mcp", "sidecar", "coai", "bench", "qln", "r9700"]);
  assert.equal(new Set(table.rows.map((row) => row.token)).size, 8);
  for (const row of table.rows) {
    assert.match(row.token, /^[a-z0-9]{2,12}$/);
  }
  assert.ok(table.rows.some((row) => row.token === REPO_TOKEN));
  assert.deepEqual(tokenFindings(fs.readFileSync(RULE, "utf8"), "conventions"), []);
  assert.deepEqual(tokenFindings(fs.readFileSync(RULE, "utf8"), "qln", undefined, "the code-search product"), [], "qln is a registered token — of the code-search product");
});

test("3a. a token that ends in digits parses as a token, never as an owner or an id", () => {
  // r9700 (the R9700 tuning toolkit) is the first registered token with digits: it must not read as the owner
  // grammar `^[uw][0-9]{1,10}$`, and a name of it must classify with r9700 as its token, whatever follows.
  assert.equal(OWNER_GRAMMAR.test("r9700"), false);
  assert.equal(TOKEN_SHAPE.test("r9700"), true);
  for (const name of ["testsToDelete-u1000-r9700-series-k3f9a1", "teststodelete_w123456_r9700_pg_abc123", "teststodelete-u1000-r9700-9700-000000"]) {
    assert.deepEqual(classifyName(name), { form: "owner", owner: name.split(/[-_]/)[1].toLowerCase(), token: "r9700" }, name);
  }
  assert.deepEqual(tokenFindings(fs.readFileSync(RULE, "utf8"), "r9700", undefined, "the R9700 vLLM tuning toolkit"), [], "r9700 is a registered token — of the R9700 vLLM tuning toolkit");
});

test("3a. a registered token is not enough: the row of REPO_TOKEN must name THIS repository", () => {
  const rule = fs.readFileSync(RULE, "utf8");
  assert.equal(REPO_ROW, "the shared-rules repository", "the helper's one statement of which row is this repository's");
  for (const [token, owner] of [["coai", "the multi-model review extension and server"], ["qln", "the code-search product"], ["bench", "the measuring harness"]]) {
    const found = tokenFindings(rule, token);
    assert.equal(found.length, 1, token);
    assert.ok(found[0].text.includes("belongs to `" + owner + "`"), "names the row's repository: " + found[0].text);
    const run = guard(root, ["--token", token]);
    assert.equal(run.code, 1, token);
    assert.match(run.text, / — token — /, token);
  }
});

test("3a. fail closed: an unknown identity of this repository is a finding, never a pass", () => {
  const rule = fs.readFileSync(RULE, "utf8");
  for (const identity of ["", "   "]) {
    const found = tokenFindings(rule, "conventions", undefined, identity);
    assert.equal(found.length, 1, JSON.stringify(identity));
    assert.match(found[0].text, /identity/);
  }
});

test("3a. break-it: an unregistered, upper-case or one-character token is exit 1, class token", () => {
  for (const token of ["nosuchtoken", "Conventions", "x"]) {
    const result = guard(root, ["--token", token]);
    assert.equal(result.code, 1, token);
    assert.match(result.text, / — token — /, token);
  }
});

const table = (rows, header = "| token | family | repository |") => ["# Rule", "", "## Tokens", "", header, header.includes("repository") ? "|---|---|---|" : "|---|---|", ...rows, "", "## Never", ""].join("\n");

test("3a. tokenFindings: no section, no table, two columns, a duplicate, a second family, token only in the wrong column", () => {
  assert.equal(tokenFindings("# Rule\n\n## Never\n", "conventions").length, 1, "no ## Tokens section");
  assert.equal(tokenFindings("# Rule\n\n## Tokens\n\nprose only\n", "conventions").length, 1, "no table");
  assert.equal(tokenFindings(table(["| `conventions` | dew_flow |"], "| token | family |"), "conventions").length, 1, "two columns");
  assert.equal(tokenFindings(table(["| `conventions` | dew_flow | the shared-rules repository |", "| `conventions` | dew_flow | the shared-rules repository |"]), "conventions").length, 1, "duplicate");
  assert.equal(tokenFindings(table(["| `conventions` | dew_flow | the shared-rules repository |", "| `other` | elsewhere | b |"]), "conventions").length, 0, "a second family's rows are read, not refused (a consumer's rule lists its own beside this one's)");
  assert.equal(tokenFindings(table(["| `creds` | dew_flow | conventions |"]), "conventions").length, 1, "only in the repository column");
  assert.equal(tokenFindings(table(["| `conventions` | dew_flow | the shared-rules repository |"]), "conventions").length, 0, "the happy path");
});

test("3a. --rule points the token check at another rule text", (t) => {
  const repo = tree(t, { "tools/x.test.mjs": "const a = 1;\n", "other.md": table(["| `zzz` | dew_flow | a |"]) });
  assert.equal(guard(repo, ["--rule", path.join(repo, "other.md")]).code, 1);
  assert.equal(guard(repo, ["--rule", path.join(repo, "other.md"), "--token", "zzz"]).code, 1, "registered, but as another repository's row");
  const own = tree(t, { "tools/x.test.mjs": "const a = 1;", "other.md": table(["| `conventions` | dew_flow | " + REPO_ROW + " |"]) });
  assert.equal(guard(own, ["--rule", path.join(own, "other.md")]).code, 0);
});

test("3a. one helper per language: every token constant in the repository is the same and is a row of the table", (t) => {
  const rule = table(["| `conventions` | dew_flow | " + REPO_ROW + " |", "| `other` | dew_flow | another repository |"]);
  const files = (extra) => ({ "tools/x.test.mjs": "const a = 1;", "rule.md": rule, ...extra });
  const own = tree(t, files({ "helper/owned.mjs": 'export const REPO_TOKEN = "conventions";\n', "helper/owned.sh": 'REPO_TOKEN="conventions"\n', "helper/Owned.cs": 'public const string RepoToken = "conventions";\n' }));
  assert.equal(guard(own, ["--rule", path.join(own, "rule.md")]).code, 0, "three languages, one token");

  const differ = tree(t, files({ "helper/owned.mjs": 'export const REPO_TOKEN = "conventions";\n', "helper/owned.sh": 'REPO_TOKEN="other"\n' }));
  const result = guard(differ, ["--rule", path.join(differ, "rule.md")]);
  assert.equal(result.code, 1, result.text);
  assert.match(result.text, /token constants differ/);
  assert.match(result.text, /helper\/owned\.mjs/);
  assert.match(result.text, /helper\/owned\.sh/);

  const unregistered = tree(t, files({ "helper/owned.mjs": 'export const REPO_TOKEN = "conventions";\n', "helper/owned.sh": 'REPO_TOKEN="zzz"\n' }));
  assert.match(guard(unregistered, ["--rule", path.join(unregistered, "rule.md")]).text, /zzz/, "an unregistered constant is named");
  const comment = tree(t, files({ "helper/owned.sh": '# REPO_TOKEN="zzz" was the old name\nREPO_TOKEN="conventions"\n' }));
  assert.equal(guard(comment, ["--rule", path.join(comment, "rule.md")]).code, 0, "a comment is not a constant");
});

test("3a. A: two token constants on ONE line are both read, not only the first", (t) => {
  const rule = table(["| `conventions` | dew_flow | " + REPO_ROW + " |", "| `other` | dew_flow | another repository |"]);
  const repo = tree(t, { "tools/x.test.mjs": "const a = 1;", "rule.md": rule, "helper/owned.mjs": 'export const REPO_TOKEN = "conventions", RepoToken = "other";\n' });
  const result = guard(repo, ["--rule", path.join(repo, "rule.md")]);
  assert.equal(result.code, 1, "the second constant of the line differs from the first: " + result.text);
  assert.match(result.text, /token constants differ/);
  assert.match(result.text, /`conventions` in helper\/owned\.mjs:1/);
  assert.match(result.text, /`other` in helper\/owned\.mjs:1/);
  const same = tree(t, { "tools/x.test.mjs": "const a = 1;", "rule.md": rule, "helper/owned.mjs": 'export const REPO_TOKEN = "conventions", RepoToken = "conventions";\n' });
  assert.equal(guard(same, ["--rule", path.join(same, "rule.md")]).code, 0, "two equal constants on one line are one token");
});

test("3a. B: tokenConstants reads the tracked and the untracked-not-ignored files that hold a constant, nothing else", (t) => {
  const repo = tree(t, {
    ".gitignore": "ignored.mjs\n",
    "tracked.mjs": 'export const REPO_TOKEN = "t1";\n',
    "sub dir/пробел.ts": 'const RepoToken: string = "t2";\n',
    "ignored.mjs": 'export const REPO_TOKEN = "t3";\n',
    "notes.md": 'REPO_TOKEN = "t4"\n',
    "plain.mjs": "export const nothing = 1;\n",
    "commented.sh": '# REPO_TOKEN="t5"\n',
    "tools/leftovers-check.test.mjs": 'const REPO_TOKEN = "t6";\n',
  });
  git(repo, "add", "tracked.mjs");
  const found = tokenConstants(repo).map((entry) => `${entry.file}:${entry.line}=${entry.value}`);
  assert.deepEqual(found, ["sub dir/пробел.ts:1=t2", "tracked.mjs:1=t1"]);
  assert.deepEqual(tokenConstants(tree(t, { "plain.mjs": "export const nothing = 1;\n" })), [], "a repository with no constant at all is an empty answer, not an error");
});

test("3a. C: another repository's token passes with its own identity, and fails closed without one", (t) => {
  const rule = table(["| `conventions` | dew_flow | " + REPO_ROW + " |", "| `other` | dew_flow | another repository |"]);
  const files = { "tools/x.test.mjs": "const a = 1;", "rule.md": rule, "helper/owned.mjs": 'export const REPO_TOKEN = "other";\n' };
  const repo = tree(t, files);
  const ruleArgs = ["--rule", path.join(repo, "rule.md"), "--token", "other"];

  const passes = guard(repo, [...ruleArgs, "--identity", "another repository"]);
  assert.equal(passes.code, 0, passes.text);
  assert.deepEqual(scanRepository({ repo, token: "other", rule: path.join(repo, "rule.md"), identity: "another repository" }).findings, []);

  const closed = guard(repo, ruleArgs);
  assert.equal(closed.code, 1, "no identity, no pass");
  assert.match(closed.text, / — token — .*identity/);
  assert.equal(scanRepository({ repo, token: "other", rule: path.join(repo, "rule.md"), identity: "" }).findings.length, 1);

  const wrong = guard(repo, [...ruleArgs, "--identity", REPO_ROW]);
  assert.equal(wrong.code, 1, "another repository's identity does not make the token this one's");
  assert.match(wrong.text, /belongs to `another repository`/);

  const own = tree(t, { "tools/x.test.mjs": "const a = 1;", "rule.md": rule, "helper/owned.mjs": 'export const REPO_TOKEN = "conventions";\n' });
  assert.equal(guard(own, ["--rule", path.join(own, "rule.md")]).code, 0, "the default token keeps this repository's own identity");
  assert.equal(guard(own, ["--rule", path.join(own, "rule.md"), "--identity", "another repository"]).code, 1, "an explicit identity replaces the default one");
  assert.match(guard(own, ["--identity"]).text, /unknown or incomplete argument/);
});

test("3a. D: a blank identity says what to set and names the value the token's row expects", () => {
  const rule = table(["| `other` | dew_flow | another repository |"]);
  const found = tokenFindings(rule, "other", "rule.md", "");
  assert.equal(found.length, 1);
  assert.match(found[0].text, /REPO_ROW/);
  assert.match(found[0].text, /--identity/);
  assert.match(found[0].text, /"repository" column/);
  assert.ok(found[0].text.includes("`another repository`"), "names the expected value: " + found[0].text);
  assert.ok(found[0].text.includes("`other`"), "names the token: " + found[0].text);
});

test("3a. E: janitor.sh's claim limit is the one number of owned.mjs", () => {
  const script = fs.readFileSync(path.join(root, "tools", "janitor.sh"), "utf8");
  const compared = [...script.matchAll(/"\$\{#raw\}"\s+-gt\s+(\d+)/g)].map((match) => Number(match[1]));
  const read = [...script.matchAll(/head -c (\d+)/g)].map((match) => Number(match[1]));
  assert.deepEqual(compared, [MAX_CLAIM_BYTES], "claim_norm refuses a claim longer than MAX_CLAIM_BYTES");
  assert.deepEqual(read, [MAX_CLAIM_BYTES + 1], "claim_of reads one byte past MAX_CLAIM_BYTES, so an over-long claim is seen");
});

test("7. docker-run and docker-name: the argument-array form of a JavaScript call is read like the command line", (t) => {
  const code = (body) => one(t, "tools/d.test.mjs", body + "\n");
  assert.equal(code('execFileSync("docker", ["run", "-d", "--name", "testsToDelete-u1000-x-abc123", "img"]);').code, 1, "no --rm");
  assert.equal(code("spawn('docker', ['run', '-d', 'img']);").code, 1, "no --rm, no name");
  assert.equal(code('execFileSync("docker", ["run", "--rm", "-d", "img"]);').code, 0, "--rm");
  assert.equal(code('execFileSync("docker", ["run", "--rm=true", "img"]);').code, 0, "--rm=true");
  assert.equal(code('execFileSync("docker", ["volume", "create", "data"]);').code, 1, "unprefixed volume");
  assert.equal(code('execFileSync("docker", ["network", "create", "web"]);').code, 1, "unprefixed network");
  assert.equal(code('execFileSync("docker", ["volume", "create"]);').code, 1, "unnamed volume");
  assert.equal(code('execFileSync("docker", ["volume", "create", "-d", "local", "web"]);').code, 1, "an option with a value before the name");
  assert.equal(code('execFileSync("docker", ["volume", "create", "testsToDelete-u1000-x-data-abc123"]);').code, 0, "a prefixed volume");
  assert.equal(code('execFileSync("docker", ["network", "create", ownedName("net")]);').code, 0, "a name the guard cannot see is not guessed at");
  assert.equal(code('execFileSync("docker", ["build", "-t", "plain-image", "."]);').code, 1, "an image a test builds");
  assert.equal(code('execFileSync("docker", ["rm", "-f", "-v", NAME]);').code, 0, "a remover is not a run");
  const wide = code('execFileSync("docker", [\n  "run",\n  "-d",\n  "img",\n]);');
  assert.equal(wide.code, 1, "an array spread over lines");
  assert.match(wide.text, /d\.test\.mjs:1 — docker-run/);
  const exempt = code('// testsToDelete-exempt: docker-run — a short-lived probe the test removes below\nexecFileSync("docker", ["run", "img"]);');
  assert.equal(exempt.code, 0, "the exemption still works");
});

test("2. raw-temp: RUNNER_TEMP is a job-scoped namespace, not a finding", (t) => {
  assert.equal(one(t, "tools/x.test.mjs", "const d = process.env.RUNNER_TEMP;\n").code, 0);
  assert.equal(one(t, "tools/a.sh", "d=\"$RUNNER_TEMP/run\"\n").code, 0);
  assert.equal(one(t, ".github/workflows/a.yml", ["name: x", "on: push", "jobs:", "  j:", "    runs-on: ubuntu-latest", "    steps:", "      - run: echo \"$RUNNER_TEMP\""].join("\n") + FOOT).code, 0);
});

// 4 / 5 ------------------------------------------------------------------------------------------------------------

test("4. the exclusion list is exactly the guard's own two test files", () => {
  assert.deepEqual([...EXCLUDED_FILES], ["tools/leftovers-check.test.mjs", "tools/leftovers-check-consumers.test.mjs"]);
});

test("5. spaces and Unicode survive the migration: the three tests still make such paths", () => {
  const source = (name) => fs.readFileSync(path.join(root, "tools", name), "utf8");
  assert.match(source("rules.test.mjs"), /ownedDir\(t,\s*"rules ü пробел"\)/);
  assert.match(source("migrate-rules.test.mjs"), /ownedDir\(t,\s*"migration пробел"\)/);
  assert.match(source("plan-lifecycle.test.mjs"), /ownedDir\(t,\s*"plan-lifecycle "\)/);
});

// 3b / merged core: owner grammar, legacy-name, owner-blind, the allowlist ----------------------------------------------

// The prefix is spelled in two pieces so that this file, which the guard does not read but the machine scan does, holds no
// line the shared classifier calls broad.
const Q = "testsTo" + "Delete";
const P = "teststo" + "delete";
const JANITOR = "tools/janitor.sh";
const ALLOWLIST = path.join(root, "tools", "fixtures", "owner-blind-allowlist.json");

test("3b. a token of the owner grammar is a `token` finding: no repository may be named like an owner", () => {
  const rule = fs.readFileSync(RULE, "utf8").replace("| `qln` | dew_flow |", "| `u1000` | dew_flow |");
  const found = tokenFindings(rule, "u1000");
  assert.ok(found.some((entry) => entry.cls === "token" && /owner grammar/.test(entry.text)), JSON.stringify(found));
  assert.ok(tokenFindings(rule, "w42").some((entry) => /owner grammar/.test(entry.text)));
  assert.ok(tokenFindings(rule, "u12345678901").every((entry) => !/owner grammar/.test(entry.text)), "eleven digits are not the grammar");
  assert.deepEqual(tokenFindings(fs.readFileSync(RULE, "utf8"), "conventions"), []);
});

test("2. legacy-name: a literal in any of the three spellings with no owner segment, and a REPO_TOKEN-built prefix", (t) => {
  for (const line of [
    `const n = "${Q}-api-pg-k3f9a1";`,
    `const n = "${P}-api-pg-k3f9a1";`,
    `const n = "${P}_api_pg_k3f9a1";`,
    "const n = `" + Q + "-${REPO_TOKEN}-pg-${id}`;",
  ]) {
    const result = one(t, "tools/x.test.mjs", `${line}\n`);
    assert.equal(result.code, 1, line);
    assert.match(result.text, /x\.test\.mjs:1 — legacy-name/, line);
  }
  assert.equal(one(t, "tools/ok.test.mjs", `const n = "${Q}-u1000-api-pg-k3f9a1";\nconst m = "${Q}-w42-api-x";\n`).code, 0, "the owner form is the form");
  assert.equal(one(t, "tools/ok2.test.mjs", `// ${Q}-api-pg-k3f9a1 is what the old rule said\n`).code, 0, "a comment names it");
});

test("2. legacy-name is exemptible with a reason; the exemption of an unknown class is not accepted", (t) => {
  const reason = "a fixture that proves the old form is still refused";
  assert.equal(one(t, "tools/x.test.mjs", `// ${Q}-exempt: legacy-name — ${reason}\nconst n = "${Q}-api-pg-k3f9a1";\n`).code, 0);
});

test("2. owner-blind: a prefix-only regex, glob and docker filter are findings", (t) => {
  for (const [file, line] of [
    ["tools/a.sh", `docker ps -a --format '{{.Names}}' | grep -i '^${Q}-' | xargs -r docker rm -f`],
    ["tools/b.sh", `find "$TMPDIR" -iname '${Q}-*' -mmin +60 -exec rm -rf {} +`],
    ["tools/c.sh", `docker ps -a --filter "name=${P}"`],
    ["tools/d.test.mjs", `const rx = /^${P}[-_]/i;`],
  ]) {
    const result = one(t, file, `${line}\n`);
    assert.equal(result.code, 1, line);
    assert.ok(result.text.includes(`${file}:1 — owner-blind`), `${line}\n${result.text}`);
  }
  assert.equal(one(t, "tools/e.sh", `grep -i '^${P}[-_]u1000[-_]' list\n`).code, 0, "an owner after the prefix is not blind");
});

test("2. owner-blind: a prefix held in a variable of the same file is a finding at the use lines; a name bound in another file is not traced", (t) => {
  const uses = ['find "${TMPDIR:-/tmp}" -maxdepth 1 -name "${P}*" -mmin +60 -exec rm -rf {} +', 'rm -rf "$TMPDIR/$P"*'];
  const repo = tree(t, {
    "tools/a.sh": ["#!/usr/bin/env bash", `P='${Q}-'`, ...uses, ""].join("\n"),
    "tools/b.sh": ["#!/usr/bin/env bash", ...uses, ""].join("\n"),
  });
  const result = guard(repo);
  assert.equal(result.code, 1, result.text);
  assert.ok(result.text.includes("tools/a.sh:3 — owner-blind"), result.text);
  assert.ok(result.text.includes("tools/a.sh:4 — owner-blind"), result.text);
  assert.ok(!result.text.includes("tools/b.sh"), `a name this file does not assign is not traced:\n${result.text}`);
});

test("2. owner-blind: a LEGACY literal held in a variable stays a legacy-name finding and is not owner-blind", (t) => {
  const text = ["#!/usr/bin/env bash", `P='${Q}-myrepo-preflight-'`, 'find "${TMPDIR:-/tmp}" -maxdepth 1 -name "${P}*" -mmin +60 -exec rm -rf {} +', 'rm -rf "$TMPDIR/$P"*', ""].join("\n");
  const result = one(t, "tools/c.sh", text);
  assert.equal(result.code, 1, result.text);
  assert.match(result.text, /tools\/c\.sh:2 — legacy-name/);
  assert.ok(!result.text.includes("owner-blind"), result.text);
});

test("2. owner-blind: the pass of the janitor's inventory line covers the uses of its variables — in the janitor only, and only while the line's hash matches", (t) => {
  const assign = `RX='${P}[-_]'; GLOB='${P}[-_]*'`;
  const use = `awk -v rx="^$RX" 'tolower($1) ~ rx' && find "$T" -iname "$GLOB"`;
  const entry = { file: JANITOR, line: 2, sha256: sha(assign) };
  const text = ["#!/usr/bin/env bash", assign, use, ""].join("\n");
  const broadAt = (repo) => scanRepository({ repo, allowlist: [entry] }).findings.filter((found) => found.cls === "owner-blind").map((found) => found.line);
  assert.deepEqual(broadAt(tree(t, { [JANITOR]: text })), [], "the janitor: the passed line and its uses are clean");
  assert.deepEqual(broadAt(tree(t, { "tools/other.sh": text })), [2, 3], "the same two lines in another file: the sanction is per allowlisted line, not per variable name");
  assert.deepEqual(broadAt(tree(t, { [JANITOR]: text.replace(`GLOB='${P}[-_]*'`, `GLOB='${P}[-_]**'`) })), [2, 3], "one byte changed on the passed line: the line is reported and its uses with it");
});

test("2. --update-allowlist writes exactly the janitor's one inventory line: a line broad only through a variable is never entered", (t) => {
  const repo = tree(t, {});
  fs.writeFileSync(path.join(repo, "x.txt"), "x\n");
  fs.mkdirSync(path.join(repo, "tools"), { recursive: true });
  fs.copyFileSync(path.join(root, JANITOR), path.join(repo, JANITOR));
  assert.equal(guard(repo, ["--update-allowlist"]).code, 0);
  const written = JSON.parse(fs.readFileSync(path.join(repo, "tools", "fixtures", "owner-blind-allowlist.json"), "utf8"));
  const shipped = JSON.parse(fs.readFileSync(ALLOWLIST, "utf8"));
  assert.deepEqual(written.entries, shipped.entries, "the janitor's inventory line and nothing the variables' uses would add");
  assert.equal(written.entries.length, 1);
});

test("2. owner-blind takes NO inline exemption: an annotated arbitrary rm -rf sweep is still a finding", (t) => {
  const reason = "inventory only, deletion is gated per row by something";
  const annotated = one(t, "tools/s.sh", `# ${Q}-exempt: owner-blind — ${reason}\nfind /tmp -iname '${Q}-*' -exec rm -rf {} +\n`);
  assert.equal(annotated.code, 1);
  assert.match(annotated.text, /s\.sh:2 — owner-blind/, "the sweep itself is the finding");
  assert.match(annotated.text, /s\.sh:1 — exemption — .*owner-blind/, "and the annotation says it clears nothing");
  const trailing = one(t, "tools/s2.sh", `docker ps -a | grep -i '^${Q}-' | xargs docker rm -f # ${Q}-exempt: owner-blind — ${reason}\n`);
  assert.equal(trailing.code, 1);
  assert.match(trailing.text, /owner-blind/);
});

test("2. the allowlist clears the janitor's inventory line and not the same text in another file or at another line", (t) => {
  const line = `RX='${P}[-_]'; GLOB='${P}[-_]*'`;
  const text = `#!/usr/bin/env bash\n${line}\n`;
  const repo = tree(t, { [JANITOR]: text });
  const entry = (extra = {}) => ({ file: JANITOR, line: 2, sha256: sha(line), ...extra });
  const cleared = scanRepository({ repo, allowlist: [entry()] });
  assert.deepEqual(cleared.findings.filter((found) => found.cls === "owner-blind"), []);
  const hit = (list) => scanRepository({ repo, allowlist: list }).findings.filter((found) => found.cls === "owner-blind").length;
  assert.equal(hit([]), 1);
  assert.equal(hit([entry({ file: "tools/other.sh" })]), 1, "another file");
  assert.equal(hit([entry({ line: 3 })]), 1, "another line");
  assert.equal(hit([entry({ sha256: sha(`${line} `)})]), 1, "one byte of difference");
  const elsewhere = tree(t, { "tools/other.sh": text });
  assert.equal(scanRepository({ repo: elsewhere, allowlist: [entry()] }).findings.filter((found) => found.cls === "owner-blind").length, 1, "the same text in another file is not cleared");
});

import { createHash } from "node:crypto";
const sha = (text) => createHash("sha256").update(text, "utf8").digest("hex");

test("2. the shipped allowlist is exactly the janitor's inventory line, and pins the shipped script", () => {
  const list = JSON.parse(fs.readFileSync(ALLOWLIST, "utf8"));
  assert.equal(list.entries.length, 1, "ONE entry");
  const [entry] = list.entries;
  assert.equal(entry.file, JANITOR);
  const lines = fs.readFileSync(path.join(root, JANITOR), "utf8").split(/\r?\n/);
  assert.equal(sha(lines[entry.line - 1]), entry.sha256, `tools/janitor.sh:${entry.line} is not the line the allowlist pins`);
});

/** The inventory line of this repository's janitor, as the shipped allowlist pins it. */
const INVENTORY_LINE = JSON.parse(fs.readFileSync(ALLOWLIST, "utf8")).entries[0].line;
/** The `owner-blind` findings on that line of the janitor in a scanned tree. A copy of the janitor in another tree draws the folded readings' findings elsewhere (D6: a consumer has no allowance), so the allowlist is judged on its line. */
const inventoryBlind = (repo, allowlist) => scanRepository({ repo, rule: RULE, allowlist }).findings.filter((entry) => entry.file === JANITOR && entry.line === INVENTORY_LINE && entry.cls === "owner-blind");

test("2. break-it: one byte changed on the janitor's inventory line makes the guard red until --update-allowlist", (t) => {
  const repo = tree(t, {});
  fs.mkdirSync(path.join(repo, "tools", "fixtures"), { recursive: true });
  const script = fs.readFileSync(path.join(root, JANITOR), "utf8").replace(/\r\n/g, "\n");
  fs.writeFileSync(path.join(repo, JANITOR), script);
  const named = path.join(repo, "tools", "fixtures", "owner-blind-allowlist.json");
  fs.copyFileSync(ALLOWLIST, named);
  fs.writeFileSync(path.join(repo, "tools", "x.test.mjs"), "const a = 1;\n");
  assert.deepEqual(inventoryBlind(repo), [], "the shipped allowlist passes the inventory line");
  fs.writeFileSync(path.join(repo, JANITOR), script.replace(`GLOB='${P}[-_]*'`, `GLOB='${P}[-_]**'`));
  assert.equal(inventoryBlind(repo).length, 1, "one byte changed: the line is red");
  const red = guard(repo);
  assert.equal(red.code, 1, red.text);
  assert.match(red.text, new RegExp(`janitor\\.sh:${INVENTORY_LINE} — owner-blind`));
  assert.equal(guard(repo, ["--update-allowlist"]).code, 0);
  assert.equal(inventoryBlind(repo).length, 1, "the scanned tree's own allowlist is never read: the shipped one still pins the old line");
  assert.deepEqual(inventoryBlind(repo, named), [], "regenerated from the current file, named by the operator");
});

test("2. no file is exempt from the legacy-name class: the pending list is empty, so a legacy literal in a janitor test is a finding", (t) => {
  assert.deepEqual([...LEGACY_NAME_PENDING], []);
  const legacy = `const n = "${Q}-api-pg-k3f9a1";\n`;
  assert.equal(one(t, "tools/janitor.test.mjs", legacy).code, 1, "a legacy literal in a janitor test is a finding like anywhere else");
  assert.equal(one(t, "tools/janitor.test.mjs", `find /tmp -iname '${Q}-*'\n`).code, 1, "an owner-blind sweep there is one too");
  assert.equal(one(t, "tools/janitor.test.mjs", "const d = os.tmpdir();\n").code, 1, "and so is every other class");
});

// S8 — a consumer's tree: --profile node, dynamic shell names, yaml from the scanned repository, any family's rows ------------------

const CONSUMER_RULE = table(["| `conventions` | dew_flow | the shared-rules repository |", "| `sso` | org | the sso service |"]);
const CONSUMER_ROW = "the sso service";
const COMMIT = ["-c", "user.name=Guard test", "-c", "user.email=guard@example.invalid", "-c", "commit.gpgsign=false", "commit", "-qm", "consumer"];
const WORKFLOW = ["name: x", "on: push", "jobs:", "  j:", "    runs-on: ubuntu-latest", "    steps:", "      - run: echo ok"].join("\n") + FOOT;

/** A Node consumer of the shared rules: a committed git repository (a scratch of this test, not this checkout) with the rule beside it. */
function consumer(t, files = {}) {
  const files0 = {
    "src/a.test.ts": 'import { mkdtempSync } from "node:fs";\nconst d = mkdtempSync(join(tmpdir(), "x-"));\n',
    "scripts/x.sh": '#!/usr/bin/env bash\ndocker run --rm --name "${name}" img\n',
    ".github/workflows/w.yaml": WORKFLOW,
    "src/owned.ts": 'export const REPO_TOKEN = "sso";\n',
    "rule.md": CONSUMER_RULE,
    ...files,
  };
  const repo = tree(t, Object.fromEntries(Object.entries(files0).filter(([, text]) => text !== undefined))); // `undefined` drops a default file
  git(repo, "add", ".");
  git(repo, ...COMMIT);
  return repo;
}

const asConsumer = (repo, extra = []) => ["--rule", path.join(repo, "rule.md"), "--token", "sso", "--identity", CONSUMER_ROW, ...extra];

test("S8 (a). --profile node adds the consumer's test files; without it the scan is today's and does not see the .ts", (t) => {
  const repo = consumer(t);
  const profiled = guard(repo, asConsumer(repo, ["--profile", "node"]));
  assert.equal(profiled.code, 1, profiled.text);
  const found = profiled.text.split("\n").filter((line) => /^\s+\S+:\d+ — /.test(line));
  assert.equal(found.length, 1, "exactly the raw-temp, nothing for the dynamic name: " + profiled.text);
  assert.match(found[0], /^\s+src\/a\.test\.ts:2 — raw-temp/);
  const plain = guard(repo, asConsumer(repo));
  assert.equal(plain.code, 0, plain.text);
  assert.match(plain.text, /clean \(2 files\)/, "the .sh and the workflow, as today");
  assert.deepEqual(scanRepository({ repo, token: "sso", identity: CONSUMER_ROW, rule: path.join(repo, "rule.md"), profile: "node" }).files, 3);
});

test("S8 (a). a profile that scans nothing is still exit 2; an unknown profile is an argument error naming the legal value", (t) => {
  const bare = consumer(t, { "src/a.test.ts": "const a = 1;\n", "scripts/x.sh": undefined, ".github/workflows/w.yaml": undefined });
  assert.equal(guard(bare, asConsumer(bare)).code, 2);
  const none = tree(t, { "README.md": "# nothing\n" });
  const result = guard(none, ["--profile", "node"]);
  assert.equal(result.code, 2);
  assert.match(result.text, /scanned nothing/);
  assert.equal(parseArguments(["--profile", "node"]).profile, "node");
  assert.equal(parseArguments([]).profile, undefined);
  const unknown = guard(none, ["--profile", "python"]);
  assert.equal(unknown.code, 2);
  assert.match(unknown.text, /unknown profile `python`.*node/);
});

test("S8 (a). isScanned: the profile adds the test and script shapes, drops node_modules and the mount paths, and changes nothing without it", () => {
  const yes = ["src/a.test.ts", "a.spec.tsx", "deep/er/b.test.mts", "c.spec.cts", "x.test.js", "y.test.mjs", "z.test.cjs", "scripts/build.ts", "scripts/deep/x.mjs",
    "test/helpers/db.ts", "tests/e2e/a.ts", "test/setup.sh", "tools/a.test.mjs", ".github/workflows/w.yml", "deep/x.sh"];
  const no = ["node_modules/pkg/a.test.js", "packages/x/node_modules/p/a.test.js", ".claude/rules/shared/tools/a.test.mjs", ".claude/rules/shared/scripts/x.sh",
    ".agents/conventions/tools/a.test.mjs", ".agents/conventions/x.sh", "src/app.ts", "README.md", "scripts/logo.png", "tools/lib/x.test.ts", "tools/leftovers-check.test.mjs"];
  for (const file of yes) assert.equal(isScanned(file, "node"), true, `${file} is read under the profile`);
  for (const file of no) assert.equal(isScanned(file, "node"), false, `${file} is never read under the profile`);
  for (const file of ["src/a.test.ts", "a.spec.tsx", "scripts/build.ts", "test/helpers/db.ts", "tests/e2e/a.ts", "src/app.ts"]) assert.equal(isScanned(file), false, `${file} is not read without it`);
  for (const file of ["tools/a.test.mjs", "deep/x.sh", ".claude/rules/shared/scripts/x.sh", "node_modules/p/x.sh"]) assert.equal(isScanned(file), true, `${file}: today's set is unchanged`);
});

test("S8 (a). the classes that read text work the same on .ts, .tsx, .mts and .cts as on .mjs", () => {
  const snippets = {
    "raw-temp": 'const d: string = mkdtempSync(join(tmpdir(), "x-"));',
    "raw-worktree": 'git(repo as string, "worktree", "add", p);',
    "docker-run": 'execFileSync("docker", ["run", "-d", "img"] as string[]);',
    "docker-name": 'execFileSync("docker", ["volume", "create", "data"]);',
    "legacy-name": `const n: string = "${Q}-api-pg-k3f9a1";`,
    "owner-blind": `const rx: RegExp = /^${P}[-_]/i;`,
    "shared-store": 'await db.query("TRUNCATE TABLE users");',
    "ryuk-off": 'process.env.TESTCONTAINERS_RYUK_DISABLED = "true";',
    exemption: `// ${Q}-exempt: docker-run`,
  };
  for (const [cls, snippet] of Object.entries(snippets)) {
    const baseline = scanText("tools/a.test.mjs", `${snippet}\n`).map((entry) => entry.cls);
    assert.ok(baseline.includes(cls), `${cls} is found in .mjs: ${JSON.stringify(baseline)}`);
    for (const file of ["src/a.test.ts", "src/a.test.tsx", "src/a.test.mts", "src/a.spec.cts"]) {
      assert.deepEqual(scanText(file, `${snippet}\n`).map((entry) => entry.cls), baseline, `${cls} in ${file}`);
    }
  }
  const exempt = `// ${Q}-exempt: raw-temp — a probe the test removes below\nconst d = mkdtempSync(join(tmpdir(), "x-"));\n`;
  assert.deepEqual(scanText("src/a.test.ts", exempt), [], "an exemption works in a .ts file");
});

test("S8 (b). a docker-name that is wholly a shell expansion is dynamic; one that mixes text and an expansion is judged as today", (t) => {
  const GOOD = "testsToDelete-u1000-x-abc123";
  const sh = (line) => one(t, "scripts/a.sh", `${line}\n`).code;
  for (const line of [
    'docker run --rm --name "${name}" img',
    "docker run --rm --name ${name} img",
    'docker run --rm --name "$name" img',
    'docker run --rm --name="${name}" img',
    'docker run --rm --name "$(mk pg data)" img',
    'docker volume create "${volume}"',
    'docker network create "$(netname web)"',
    'docker compose -p "${project}" up -d',
    'docker build -t "${tag}" .',
    'COMPOSE_PROJECT_NAME="${project}" docker compose up -d',
    "export COMPOSE_PROJECT_NAME=${project}",
    "export COMPOSE_PROJECT_NAME=$(mk stack)",
    `docker run --rm --name "\${name:-${GOOD}}" img`,
  ]) assert.equal(sh(line), 0, line);
  for (const line of [
    'docker run --rm --name "web-${id}" img',
    'docker run --rm --name "${prefix}-web" img',
    'docker run --rm --name "$(mk pg)-x" img',
    'docker run --rm --name "${name" img',
    'docker run --rm --name "$(mk pg" img',
    'docker run --rm --name web img',
    'docker volume create "cache-${id}"',
    'docker compose -p "web-${id}" up -d',
    'COMPOSE_PROJECT_NAME="web-${id}" docker compose up -d',
    'docker run --rm --name "testsToDelete-${owner}-x-${id}" img',
  ]) assert.equal(sh(line), 1, line);
  assert.equal(sh(`docker run --rm --name "${GOOD}-\${id}" img`), 0, "a literal prefix that is a name, then an expansion: as today");
  assert.equal(sh('docker run -d --name "${name}" img'), 1, "dynamic is about the NAME: a run with no --rm is still a docker-run finding");
  const ts = (line) => one(t, "tools/a.test.mjs", `${line}\n`).code;
  assert.equal(ts('execFileSync("docker", ["run", "--rm", "--name", `${name}`, "img"]);'), 0, "an array item that is wholly an interpolation");
  assert.equal(ts('execFileSync("docker", ["run", "--rm", "--name", `web-${id}`, "img"]);'), 1, "an array item that mixes text and an interpolation");
});

test("S8 (c). yaml: the guard's own resolution first, then the scanned repository's, else exit 2 with one sentence", (t) => {
  const ownMissing = () => { throw Object.assign(new Error("Cannot find module 'yaml'"), { code: "MODULE_NOT_FOUND" }); };
  const real = createRequire(import.meta.url)("yaml");
  const lines = [];
  const run = (repo, resolvers, extra = []) => {
    lines.length = 0;
    const code = main(["--repo", repo, ...asConsumer(repo, extra)], { out: (line) => lines.push(line), err: (line) => lines.push(line) }, resolvers);
    return { code, text: lines.join("\n") };
  };
  const broken = consumer(t, { ".github/workflows/w.yaml": WORKFLOW.replace("echo ok", "docker run -d img") });
  assert.equal(run(broken, { own: () => real, scanned: ownMissing }).code, 1, "the guard's own yaml is enough, and the workflow's docker-run is found");
  const viaRepo = run(broken, { own: ownMissing, scanned: () => real });
  assert.equal(viaRepo.code, 1, "the scanned repository's yaml parses the workflow: " + viaRepo.text);
  assert.match(viaRepo.text, /w\.yaml:\d+ — docker-run/);

  const missing = run(broken, { own: ownMissing, scanned: ownMissing });
  assert.equal(missing.code, 2);
  assert.equal(missing.text.split("\n").length, 1, "ONE sentence: " + missing.text);
  assert.match(missing.text, /yaml@2/);
  assert.match(missing.text, /devDependency/);
  assert.doesNotMatch(missing.text, /ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND|at /);
  assert.equal(run(broken, { own: ownMissing, scanned: () => ({}) }).code, 2, "a yaml that is not version 2 (no parseDocument) is no yaml");
  const other = run(broken, { own: () => { throw new RangeError("not a missing module"); }, scanned: () => real });
  assert.equal(other.code, 2);
  assert.match(other.text, /cannot read .*not a missing module/);
  assert.doesNotMatch(other.text, /yaml@2/, "only a missing module is a missing yaml");

  const noWorkflows = consumer(t, { ".github/workflows/w.yaml": undefined });
  assert.equal(run(noWorkflows, { own: ownMissing, scanned: ownMissing }).code, 0, "yaml is read only when a workflow is: a consumer with none needs none");
});

test("S8 (c). yaml found by createRequire from the scanned repository when the guard's own resolution fails", (t) => {
  const repo = consumer(t, { ".github/workflows/w.yaml": WORKFLOW.replace("echo ok", "docker run -d img"), ".gitignore": "node_modules/\n" });
  fs.mkdirSync(path.join(repo, "node_modules"));
  fs.symlinkSync(path.dirname(createRequire(import.meta.url).resolve("yaml/package.json")), path.join(repo, "node_modules", "yaml"), "dir");
  const lines = [];
  const code = main(["--repo", repo, ...asConsumer(repo)], { out: (line) => lines.push(line), err: (line) => lines.push(line) },
    { own: () => { throw Object.assign(new Error("Cannot find module 'yaml'"), { code: "MODULE_NOT_FOUND" }); } });
  assert.equal(code, 1, lines.join("\n"));
  assert.match(lines.join("\n"), /w\.yaml:\d+ — docker-run/);
});

test("S8 (d). the token check reads whatever families the table lists and requires the --token row to name --identity", (t) => {
  const repo = consumer(t);
  const ok = guard(repo, asConsumer(repo));
  assert.equal(ok.code, 0, "a table with a second family passes: " + ok.text);
  const other = guard(repo, ["--rule", path.join(repo, "rule.md"), "--token", "sso", "--identity", "the shared-rules repository"]);
  assert.equal(other.code, 1);
  assert.match(other.text, / — token — the token `sso` belongs to `the sso service` in .*, not to this repository/);
  const none = guard(repo, ["--rule", path.join(repo, "rule.md"), "--token", "sso"]);
  assert.equal(none.code, 1, "no identity is no pass");
  assert.match(none.text, / — token — .*identity/);
  const unregistered = guard(repo, ["--rule", path.join(repo, "rule.md"), "--token", "zzz", "--identity", CONSUMER_ROW]);
  assert.equal(unregistered.code, 1);
  assert.match(unregistered.text, /not a row of the `## Tokens` table/);
});

// Security pass (PR #82, M-1): the allowlist is the one shipped beside the tool and pins the janitor's file ---------------------

const SWEEP_LINE = `find "\${TMPDIR:-/tmp}" -maxdepth 1 -name '${Q}-*' -mmin +60 -exec rm -rf {} +`;
const blindIn = (result, file) => result.text.split("\n").filter((line) => line.includes(`${file}:`) && /owner-blind/.test(line));

test("M-1. a scanned repository's own allowlist never clears its own sweeper: the entry names another file than the janitor", (t) => {
  const own = JSON.stringify({ entries: [{ file: "scripts/sweep.sh", line: 2, sha256: sha(SWEEP_LINE) }] });
  const repo = consumer(t, { "scripts/sweep.sh": `#!/usr/bin/env bash\n${SWEEP_LINE}\n`, "tools/fixtures/owner-blind-allowlist.json": own });
  const found = guard(repo, asConsumer(repo, ["--profile", "node"]));
  assert.equal(blindIn(found, "scripts/sweep.sh").length, 1, `the consumer's own allowlist cleared its sweeper: ${found.text}`);
});

test("M-1. an entry for another file in an allowlist the operator names is ignored: only the janitor's file can pass", (t) => {
  const repo = consumer(t, { "scripts/sweep.sh": `#!/usr/bin/env bash\n${SWEEP_LINE}\n` });
  const named = path.join(ownedDir(t, "allowlist"), "list.json");
  fs.writeFileSync(named, JSON.stringify({ entries: [{ file: "scripts/sweep.sh", line: 2, sha256: sha(SWEEP_LINE) }] }));
  const found = guard(repo, asConsumer(repo, ["--profile", "node", "--allowlist", named]));
  assert.equal(blindIn(found, "scripts/sweep.sh").length, 1, found.text);
  assert.equal(scanRepository({ repo, token: "sso", identity: CONSUMER_ROW, rule: path.join(repo, "rule.md"), profile: "node", allowlist: [{ file: "scripts/sweep.sh", line: 2, sha256: sha(SWEEP_LINE) }] })
    .findings.filter((entry) => entry.cls === "owner-blind").length, 1, "the same through the programmatic seam");
});

test("M-1. the shipped allowlist, read from beside the tool, still passes this repository's own janitor line — whatever the scanned tree holds", (t) => {
  const real = guard(root);
  assert.equal(real.code, 0, real.text);
  const repo = tree(t, {});
  fs.mkdirSync(path.join(repo, "tools", "fixtures"), { recursive: true });
  fs.writeFileSync(path.join(repo, JANITOR), fs.readFileSync(path.join(root, JANITOR), "utf8").replace(/\r\n/g, "\n"));
  fs.writeFileSync(path.join(repo, "tools", "x.test.mjs"), "const a = 1;\n");
  assert.deepEqual(inventoryBlind(repo), [], "no allowlist in the scanned tree: the shipped one passes the identical janitor line");
  fs.writeFileSync(path.join(repo, "tools", "fixtures", "owner-blind-allowlist.json"), JSON.stringify({ entries: [] }));
  assert.deepEqual(inventoryBlind(repo), [], "an empty allowlist in the scanned tree does not remove the shipped pass");
});

// F30 — the folding reader (todo/PLAN_F30_folding_reader.md, D1 to D6) ------------------------------------------------------
//
// Four checks (D5). 1: a table of spellings, each row a fixture file with a clean neighbour line before and after it, an exact line
// and an exact class, compared as a LIST of `line:class` (a doubled class is a failure). 2: a table of lines that must stay `[]`: a
// false finding is a defect of the reader and its cure is a new row. 3: each reading has a row that only it finds (the mutants of the
// record, `research/2026-11-05_f30_folding_reader.md`, were each run by hand against these rows). 4: time, by a step counter on the
// reader and not by a wall clock, and the 256 KiB limit with its finding.

const NEIGHBOURS = {
  ".mjs": ["const clean = 1;", "const clean2 = 2;"],
  ".cjs": ["const clean = 1;", "const clean2 = 2;"],
  ".ts": ["const clean: number = 1;", "const clean2 = 2;"],
  ".tsx": ["const clean = 1;", "const clean2 = 2;"],
  ".mts": ["const clean = 1;", "const clean2 = 2;"],
  ".js": ["const clean = 1;", "const clean2 = 2;"],
  ".jsx": ["const clean = 1;", "const clean2 = 2;"],
  ".cts": ["const clean = 1;", "const clean2 = 2;"],
  ".yaml": ["name: ci", "# clean"],
  ".sh": ["echo clean", "echo clean2"],
  ".ps1": ["Write-Output 'clean'", "Write-Output 'clean2'"],
  ".yml": ["name: ci", "# clean"],
};

/** The findings of `scanText` as a sorted list of `line:class`, the line counted inside the row (the neighbour line before it is line 0). */
const listOf = (found, offset = 1) => found.map((entry) => ({ line: entry.line - offset, cls: entry.cls }))
  .sort((a, b) => a.line - b.line || (a.cls < b.cls ? -1 : a.cls > b.cls ? 1 : 0)).map((entry) => `${entry.line}:${entry.cls}`);

/** The fixture of a row: a clean line, the row's lines, a clean line. */
function fixtureOf(file, lines) {
  const [before, after] = NEIGHBOURS[path.extname(file)];
  return `${[before, ...lines, after].join("\n")}\n`;
}

/** Row = [kind, file, the row's lines, the list `line:class` the guard answers, the list it answers with the folded reading off (the file in `foldingAllowances`)]. */
const SPELLINGS = [
  // what the guard already finds: a whole literal, a glob or a regex over the word
  ["a whole legacy literal", "scripts/zz.mjs", [`const n = "${Q}-coai-x-abc123";`], ["1:legacy-name"], ["1:legacy-name"]],
  ["a bare-word glob passed to a removal", "scripts/zz.mjs", [`fs.rmSync(path.join(base, "${Q}-*"), { recursive: true });`], ["1:owner-blind"], ["1:owner-blind"]],
  // D4: one class for one cause. A pattern in the tail of the bare word is owner-blind only when the line has no legacy-name reading (raw or folded, exempted or not)
  ["a glob alone in a literal stays owner-blind", "scripts/zz.mjs", [`const a = '${Q}-*';`], ["1:owner-blind"], ["1:owner-blind"]],
  ["an owner letter and a star: legacy-name alone, as at the release", "scripts/zz.mjs", [`const a = '${Q}-u*';`], ["1:legacy-name"], ["1:legacy-name"]],
  ["an owner letter and .*: legacy-name alone", "scripts/zz.mjs", [`const a = '${Q}-u.*';`], ["1:legacy-name"], ["1:legacy-name"]],
  ["a w and a ?: legacy-name alone", "scripts/zz.mjs", [`const a = '${Q}-w?';`], ["1:legacy-name"], ["1:legacy-name"]],
  ["an owner letter and a group: legacy-name alone", "scripts/zz.mjs", [`const a = '${Q}-u(x)';`], ["1:legacy-name"], ["1:legacy-name"]],
  ["the same, split over +: legacy-name alone", "scripts/zz.mjs", ["const a = 'tests' + 'To' + 'Delete-u*';"], ["1:legacy-name"], []],
  ["a legacy-name exemption above an owner letter and a star clears the line, as at the release", "scripts/zz.mjs", [`// ${Q}-exempt: legacy-name — a probe the test removes`, `const a = '${Q}-u*';`], [], []],
  ["a pattern with no legacy-name reading stays owner-blind (a regex string)", "scripts/zz.mjs", [`const a = new RegExp('${Q}[-_]u');`], ["1:owner-blind"], []],
  ["N8 of coai: a glob in a loop draws ONE class", "scripts/zz.mjs", [`for (const f of fs.globSync('${Q}-*')) fs.rmSync(f, { recursive: true });`], ["1:owner-blind"], ["1:owner-blind"]],
  ["a regex literal over the word", "scripts/zz.mjs", [`const rx = /${Q}[-_]/i;`], ["1:owner-blind"], ["1:owner-blind"]],
  ["an anchored RegExp string", "scripts/zz.mjs", [`const rx = new RegExp("^${Q}[-_]");`], ["1:owner-blind"], ["1:owner-blind"]],
  // F30's sixteen: the spellings that no line of the measure found
  ["a split over +", "scripts/zz.mjs", ['const n = "testsTo" + "Delete-agent-" + id;'], ["1:legacy-name"], []],
  ["a split over .concat", "scripts/zz.mjs", ['const n = "testsTo".concat("Delete-agent-", id);'], ["1:legacy-name"], []],
  ["an array joined with an empty string", "scripts/zz.mjs", ["const n = ['testsTo', 'Delete-agent-'].join('');"], ["1:legacy-name"], []],
  ["a template hole that holds a literal", "scripts/zz.mjs", ["const n = `testsTo${'Delete'}-agent-${id}`;"], ["1:legacy-name"], []],
  ["a \\u escape", "scripts/zz.mjs", ['const n = "tests\\u0054\\u006fDelete-agent-";'], ["1:legacy-name"], []],
  ["a \\u{} escape", "scripts/zz.mjs", ['const n = "tests\\u{54}\\u{6f}Delete-agent-";'], ["1:legacy-name"], []],
  ["a \\x escape", "scripts/zz.mjs", ['const n = "tests\\x54\\x6fDelete-agent-";'], ["1:legacy-name"], []],
  ["a one-character class in a plain literal (only the literal's decoding finds it)", "scripts/zz.mjs", ['const n = "tests[T][o]Delete-agent-";'], ["1:legacy-name"], []],
  ["a whole word in a literal on a line the classifier already calls broad draws ONE class", "scripts/zz.mjs", [`fs.rmSync(path.join(tmp, "${Q}"), { recursive: true });`], ["1:owner-blind"], ["1:owner-blind"]],
  ["a bare word on a line that the RAW reading calls broad (through its comment) draws ONE class", "scripts/zz.mjs", [`const w = "${Q}"; // rm -rf ${Q}-*`], ["1:owner-blind"], ["1:owner-blind"]],
  ["a regex at the start of a line holds a quote", "scripts/zz.mjs", ["/'/.test(x); const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a regex after return holds a quote", "scripts/zz.mjs", ["  return /'/.test(s) ? 'tests' + 'To' + 'Delete-x' : null;"], ["1:legacy-name"], []],
  ["a regex after => holds a quote", "scripts/zz.mjs", ["const f = (s) => /'/.test(s) && 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["the plan's row: a regex that holds a quote, then a split in two", "scripts/zz.mjs", ["const a = /'/; const n = 'testsTo' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a one-character class in a RegExp string", "scripts/zz.mjs", ['const rx = new RegExp("^tests[T]oDelete[-_]");'], ["1:owner-blind"], []],
  ["a one-character class in a regex literal (the decoded-code reading is the only one)", "scripts/zz.mjs", ["const rx = /^tests[T]oDelete[-_]/;"], ["1:owner-blind"], []],
  ["a \\x escape in a regex literal (the decoded-code reading)", "scripts/zz.mjs", ["const rx = /^tests\\x54oDelete[-_]/;"], ["1:owner-blind"], []],
  ["half of the word", "scripts/zz.mjs", ['const half = "testsTo";'], ["1:legacy-name"], []],
  ["the other half, with the join in it", "scripts/zz.mjs", ['const half = "sToDele";'], ["1:legacy-name"], []],
  ["the bare word", "scripts/zz.mjs", [`const w = "${Q}";`], ["1:legacy-name"], []],
  ["the bare word in single quotes, lower case", "scripts/zz.mjs", [`const w = '${P}';`], ["1:legacy-name"], []],
  ["an unanchored regex string (a pattern tail stays owner-blind)", "scripts/zz.mjs", [`const rx = new RegExp("${Q}[-_]");`], ["1:owner-blind"], []],
  ["rmSync over a joined prefix", "scripts/zz.mjs", ['fs.rmSync(path.join(tmp, "testsTo" + "Delete"), { recursive: true });'], ["1:owner-blind"], []],
  ["a joined glob passed to a removal", "scripts/zz.mjs", ['fs.rmSync(path.join(tmp, "testsTo" + "Delete-*"));'], ["1:owner-blind"], []],
  ["the classifier's own execSync line", "scripts/zz.mjs", ["execSync('rm -rf /tmp/testsTo' + 'Delete *');"], ["1:owner-blind"], []],
  ["the same split in a .cjs", "scripts/zz.cjs", ['const n = "testsTo" + "Delete-agent-";'], ["1:legacy-name"], []],
  ["the same split in a .ts", "src/zz.test.ts", ['const n: string = "testsTo" + "Delete-agent-";'], ["1:legacy-name"], []],
  // the owner letter that a + continues is not a bare word: the line is a legacy-name of today (benchmark's exec-probe-stop.test.mjs:86)
  ["the owner letter and a + after it", "scripts/zz.mjs", [`const marker = '${Q}-u' + process.getuid() + '-bench-trackedchild-' + process.pid;`], ["1:legacy-name"], ["1:legacy-name"]],
  // the prefix built from the token alone: only the folded text holds it whole (D5 item 3, legacyNameHits on folded text)
  ["a line of a child script in a multi-line template (benchmark's exec-probe-stop.test.mjs:86): a call a space away is no pattern tail", "scripts/zz.mjs", ["const child = `", `  const marker = '${Q}-u' + process.getuid() + '-bench-trackedchild-' + process.pid;`, "`;"], ["2:legacy-name"], ["2:legacy-name"]],
  ["a prefix built from the repository token, split", "scripts/zz.mjs", ["const n = 'testsTo' + 'Delete-${REPO_TOKEN}';"], ["1:legacy-name"], []],
  // a row that only the join finds: no half of it holds a crossing piece of 6, so a join that is off answers []
  ["three pieces over +", "scripts/zz.mjs", ['const n = "tests" + "To" + "Delete-agent-" + id;'], ["1:legacy-name"], []],
  ["three pieces over .concat", "scripts/zz.mjs", ['const n = "tests".concat("To", "Delete-agent-", id);'], ["1:legacy-name"], []],
  ["three pieces over .concat, then another .concat", "scripts/zz.mjs", ['const n = "tests".concat("To").concat("Delete-agent-", id);'], ["1:legacy-name"], []],
  ["three pieces in an array joined", "scripts/zz.mjs", ['const n = ["tests", "To", "Delete-agent-"].join("") + id;'], ["1:legacy-name"], []],
  ["two pieces in an array joined with a separator that is part of the word", "scripts/zz.mjs", ['const n = ["tests", "Delete-agent-"].join("To");'], ["1:legacy-name"], []],
  ["three pieces over a template hole", "scripts/zz.mjs", ["const n = `tests${'To'}Delete-agent-${id}`;"], ["1:legacy-name"], []],
  ["three pieces, the first in parentheses", "scripts/zz.mjs", ['const n = ("tests") + ("To") + "Delete-agent-";'], ["1:legacy-name"], []],
  ["three pieces, a template for one", "scripts/zz.mjs", ["const n = 'tests' + `To` + 'Delete-agent-';"], ["1:legacy-name"], []],
  // D2: the joins read spaces around their operators and a literal in parentheses, in every place a literal can stand
  ["an array of templates joined", "scripts/zz.mjs", ["const n = [`tests`,`To`,`Delete-x`].join('');"], ["1:legacy-name"], []],
  ["a space before the ( of .concat", "scripts/zz.mjs", ["const n = 'tests'.concat ('To', 'Delete-x');"], ["1:legacy-name"], []],
  ["spaces around the dot of .concat", "scripts/zz.mjs", ["const n = 'tests' . concat('To', 'Delete-x');"], ["1:legacy-name"], []],
  ["a space before the ( of .join", "scripts/zz.mjs", ["const n = ['tests','To','Delete-x'].join ('');"], ["1:legacy-name"], []],
  ["spaces everywhere in an array join, and a trailing comma", "scripts/zz.mjs", ["const n = [ 'tests' , 'To' , 'Delete-x' , ] . join ( '' );"], ["1:legacy-name"], []],
  ["a literal in parentheses as a .concat argument", "scripts/zz.mjs", ["const n = 'tests'.concat(('To'), 'Delete-x');"], ["1:legacy-name"], []],
  ["a literal in parentheses as an array item", "scripts/zz.mjs", ["const n = [('tests'),'To','Delete-x'].join('');"], ["1:legacy-name"], []],
  ["a literal in parentheses as the separator of .join", "scripts/zz.mjs", ["const n = ['tests','To','Delete-x'].join((''));"], ["1:legacy-name"], []],
  ["a trailing comma in .concat", "scripts/zz.mjs", ["const n = 'tests'.concat('To','Delete-x',);"], ["1:legacy-name"], []],
  ["a trailing comma in an array", "scripts/zz.mjs", ["const n = ['tests','To','Delete-x',].join('');"], ["1:legacy-name"], []],
  ["spaces between ] and .join", "scripts/zz.mjs", ["const n = ['tests','To','Delete-x'] .join('');"], ["1:legacy-name"], []],
  ["a split after a regex that holds a quote (the regex is recognised)", "scripts/zz.mjs", ["const a = /'/; const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split after a regex that holds a slash in a class", "scripts/zz.mjs", ["const a = /[/']/; const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split after a division", "scripts/zz.mjs", ["const a = b / c; const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split after a string that holds //", "scripts/zz.mjs", ['const u = "http://x"; const n = "tests" + "To" + "Delete-x";'], ["1:legacy-name"], []],
  ["a split after a block comment on the line", "scripts/zz.mjs", ["/* don't */ const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split behind a control byte in the line", "scripts/zz.mjs", [`const c = "\u0001\u0002"; const n = 'tests' + 'To' + 'Delete-x';`], ["1:legacy-name"], []],
  ["a split after a block comment that ends on an earlier line", "scripts/zz.mjs", ["/* a comment", "that ends here */ const n = 'tests' + 'To' + 'Delete-x';"], ["2:legacy-name"], []],
  ["a split after a multi-line template that holds /* (the template tracks its state)", "scripts/zz.mjs", ["const css = `", "a { background: url(x/*.png) }", "`;", "const n = 'tests' + 'To' + 'Delete-x';"], ["4:legacy-name"], []],
  ["a split after a template whose hole holds braces and a /* in the body", "scripts/zz.mjs", ["const t = `${ { a: 1 }.a } /* in the body`; const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split after a template whose hole holds an object and a nested template (the hole's brace depth is counted)", "scripts/zz.mjs", ["const t = `${ { a: 1 }.a + `'` } `; const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split in the line after a multi-line hole", "scripts/zz.mjs", ["const t = `a ${ f(", "  'x') } b`; const n = 'tests' + 'To' + 'Delete-x';"], ["2:legacy-name"], []],
  ["a piece in the body of a multi-line template", "scripts/zz.mjs", ["const t = `", "fixture testsTo here", "`;"], ["2:legacy-name"], []],
  ["a split in a .tsx file", "src/zz.tsx", ["const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split in a .mts file", "src/zz.mts", ["const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split in a .js file", "src/zz.js", ["const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split in a .jsx file", "src/zz.jsx", ["const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a split in a .cts file", "src/zz.cts", ["const n = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  // an owner-blind line with a legacy-name exemption stays owner-blind (no exemption of that class exists)
  ["an owner-blind line with a legacy-name exemption stays owner-blind", "scripts/zz.mjs", [`fs.rmSync("testsTo" + "Delete-*"); // ${Q}-exempt: legacy-name — a probe the test removes`], ["1:owner-blind"], []],
  ["a legacy-name hit of the bare word is cleared by its exemption", "scripts/zz.mjs", [`const w = "${Q}"; // ${Q}-exempt: legacy-name — a probe the test removes`], [], []],
  ["a legacy-name hit of the piece is cleared by its exemption on the line above", "scripts/zz.mjs", [`// ${Q}-exempt: legacy-name — a probe the test removes`, 'const half = "testsTo";'], [], []],
  // the split sweeps of D4: the file's folded lines bind a prefix built in pieces as a whole one binds
  // D2: a line that starts with # is code in JavaScript (a private field), and the code after #> is code in PowerShell: the folded readings read what the reader keeps; a comment line reads nothing
  ["a private field line (starts with #) is code in JavaScript", "scripts/zz.mjs", ["  #p = 'tests' + 'To' + 'Delete-x';"], ["1:legacy-name"], []],
  ["a private method that sweeps a joined glob", "scripts/zz.mjs", ["  #sweep = () => fs.rmSync('tests' + 'To' + 'Delete-*');"], ["1:owner-blind"], []],
  ["the code after #> in PowerShell", "scripts/zz.ps1", ["<# a comment", "#> $n = 'tests' + 'To' + 'Delete-x'"], ["2:legacy-name"], []],
  ["a # line in a multi-line template is template text", "scripts/zz.mjs", ["const t = `", "# 'testsTo'", "`;"], ["2:legacy-name"], []],
  ["a // line in a multi-line template is template text", "scripts/zz.mjs", ["const t = `", "// testsTo", "`;"], ["2:legacy-name"], []],
  ["a prefix in pieces, a sweep over the name on the next line", "scripts/zz.mjs", ["const P = 'testsTo' + 'Delete-';", "fs.rmSync(P + x);"], ["1:legacy-name", "2:owner-blind"], []],
  ["a prefix in pieces, a sweep over the name; an exemption clears the first line only", "scripts/zz.mjs", [`const P = 'testsTo' + 'Delete-'; // ${Q}-exempt: legacy-name — a probe the test removes`, "fs.rmSync(P + x);"], ["2:owner-blind"], []],
  ["a RegExp over a joined prefix on one line", "scripts/zz.mjs", ['const rx = new RegExp("^testsTo" + "Delete-");'], ["1:owner-blind"], []],
  ["a RegExp over a name the binding reading does not follow: the guard follows only what that reading follows (a stated limit)", "scripts/zz.mjs", ["const P = 'testsTo' + 'Delete-';", "const rx = new RegExp(`^${P}`);"], ["1:legacy-name"], []],
  ["a whole prefix in a constant, startsWith on it (the binding reading of today: line 2 is owner-blind at the release too)", "scripts/zz.mjs", [`const P = '${Q}-';`, "names.filter((n) => n.startsWith(P));"], ["1:legacy-name", "2:owner-blind"], ["2:owner-blind"]],
  ["a whole prefix passed to a call: legacy-name, and a person reads it", "scripts/zz.mjs", [`sweep('${Q}-');`], ["1:legacy-name"], []],
  ["a prefix in two constants and a sum: the first piece only", "scripts/zz.mjs", ["const A = 'testsTo';", "const B = 'Delete-';", "rmSync(A + B + x);"], ["1:legacy-name"], []],
  // .sh and workflow lines: touching pieces, quoted or not
  ["a .sh adjacency, legacy", "scripts/zz.sh", ["mkdir \"$TMPDIR\"/'testsTo''Delete-agent-1'"], ["1:legacy-name"], []],
  ["a .sh adjacency of three pieces", "scripts/zz.sh", ["mkdir \"$TMPDIR\"/'tests''To''Delete-agent-1'"], ["1:legacy-name"], []],
  ["a .sh word of an unquoted and a quoted piece", "scripts/zz.sh", ['mkdir /tmp/testsTo"Delete-agent-1"'], ["1:legacy-name"], []],
  ["a .sh word with the unquoted pieces around a quoted one", "scripts/zz.sh", ['mkdir /tmp/tests"To"Delete-agent-1'], ["1:legacy-name"], []],
  ["a .sh adjacency, glob", "scripts/zz.sh", ["rm -rf \"$TMPDIR\"/'testsTo''Delete-*'"], ["1:owner-blind"], []],
  ["a .sh adjacency of double quotes", "scripts/zz.sh", ['rm -rf "$TMPDIR"/"testsTo""Delete-"*'], ["1:owner-blind"], []],
  ["a .sh $'...' with a \\x escape", "scripts/zz.sh", ["rm -rf $'tests\\x54oDelete-*'"], ["1:owner-blind"], []],
  ["a .sh $'...' with an octal escape", "scripts/zz.sh", ["rm -rf $'tests\\124oDelete-*'"], ["1:owner-blind"], []],
  ["a .sh $'...' with a \\u escape", "scripts/zz.sh", ["rm -rf $'tests\\u0054oDelete-*'"], ["1:owner-blind"], []],
  ["a .sh half of the word", "scripts/zz.sh", ["HALF='testsTo'"], ["1:legacy-name"], []],
  ["a .sh word after an escaped apostrophe", "scripts/zz.sh", ["echo don\\'t; mkdir 'tests''To''Delete-x'"], ["1:legacy-name"], []],
  ["a .sh word after a comment sign inside a word", "scripts/zz.sh", ["echo a#b 'tests''To''Delete-x'"], ["1:legacy-name"], []],
  ["a .sh prefix in pieces, a sweep over the name on the next line", "scripts/zz.sh", ["P='testsTo''Delete-'", 'rm -rf "$TMPDIR"/"$P"*'], ["1:legacy-name", "2:owner-blind"], []],
  ["a .sh word after an assignment", "scripts/zz.sh", ["export NAME='tests''To''Delete-x'"], ["1:legacy-name"], []],
  // a workflow reads as .sh
  ["a workflow run line", ".github/workflows/zz.yml", ["jobs:", "  j:", "    runs-on: ubuntu-latest", "    steps:", "      - run: rm -rf /tmp/'testsTo''Delete-*'"], ["5:owner-blind"], []],
  ["a .yaml workflow run line of three pieces", ".github/workflows/zz.yaml", ["jobs:", "  j:", "    runs-on: ubuntu-latest", "    steps:", "      - run: mkdir /tmp/'tests''To''Delete-x'"], ["5:legacy-name"], []],
  ["a workflow run line of three pieces", ".github/workflows/zz.yml", ["jobs:", "  j:", "    runs-on: ubuntu-latest", "    steps:", "      - run: mkdir /tmp/'tests''To''Delete-x'"], ["5:legacy-name"], []],
  // .ps1: + and -join
  ["a .ps1 split over +", "scripts/zz.ps1", ['Remove-Item ("testsTo" + "Delete-*")'], ["1:owner-blind"], []],
  ["a .ps1 legacy split over +", "scripts/zz.ps1", ['$n = "testsTo" + "Delete-agent-1"'], ["1:legacy-name"], []],
  ["a .ps1 three pieces over +", "scripts/zz.ps1", ['$n = "tests" + "To" + "Delete-agent-1"'], ["1:legacy-name"], []],
  ["a .ps1 three pieces, one in parentheses", "scripts/zz.ps1", ['$n = ("tests") + ("To") + "Delete-agent-1"'], ["1:legacy-name"], []],
  ["a .ps1 -join", "scripts/zz.ps1", ['$n = ("testsTo", "Delete-agent-1") -join ""'], ["1:legacy-name"], []],
  ["a .ps1 -join of three pieces", "scripts/zz.ps1", ['$n = ("tests", "To", "Delete-agent-1") -join ""'], ["1:legacy-name"], []],
  ["a .ps1 split after a block comment on the line", "scripts/zz.ps1", ["<# a 'quote #> $n = 'tests' + 'To' + 'Delete-x'"], ["1:legacy-name"], []],
  ["a .ps1 split after a multi-line block comment", "scripts/zz.ps1", ["<# a comment", "with 'a quote #> $n = 'tests' + 'To' + 'Delete-x'"], ["2:legacy-name"], []],
  ["a .ps1 prefix in pieces, a sweep over the name on the next line", "scripts/zz.ps1", ['$P = "tests" + "To" + "Delete-"', 'Remove-Item "$P*"'], ["1:legacy-name", "2:owner-blind"], []],
];

const foldedOff = (file) => ({ foldingAllowances: [file] });

test("F30 table 1: each spelling of the prefix is a finding on its exact line, with its class, as a list", () => {
  const wrong = [];
  for (const [kind, file, lines, expected] of SPELLINGS) {
    const got = listOf(scanText(file, fixtureOf(file, lines)));
    if (JSON.stringify(got) !== JSON.stringify(expected)) wrong.push(`${kind} [${file}] ${JSON.stringify(lines)}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
  }
  assert.deepEqual(wrong, [], "rows that answer the wrong list");
});

test("F30 table 1: the reader switched off (the file in foldingAllowances) leaves only the raw readings: the durable reader-off check", () => {
  const wrong = [];
  for (const [kind, file, lines, , raw] of SPELLINGS) {
    const got = listOf(scanText(file, fixtureOf(file, lines), [], undefined, undefined, foldedOff(file)));
    if (JSON.stringify(got) !== JSON.stringify(raw)) wrong.push(`${kind} [${file}]: raw expected ${JSON.stringify(raw)}, got ${JSON.stringify(got)}`);
  }
  assert.deepEqual(wrong, [], "rows whose raw reading is not what the table says");
  const needReader = SPELLINGS.filter((row) => JSON.stringify(row[3]) !== JSON.stringify(row[4]));
  assert.ok(needReader.length >= 60, `${needReader.length} rows are found only by the folding reader`);
});

test("F30 table 1: the table holds at least F30's sixteen, D2's kinds, and every row's lines are distinct", () => {
  assert.ok(SPELLINGS.length >= 80);
  assert.equal(new Set(SPELLINGS.map((row) => row[2].join("\n") + row[1])).size, SPELLINGS.length);
  for (const extension of [".mjs", ".cjs", ".ts", ".tsx", ".mts", ".sh", ".ps1", ".yml"]) assert.ok(SPELLINGS.some((row) => row[1].endsWith(extension)), `a row for ${extension}`);
});

const WORDS = ["toDelete", "testStatus", "testString", "testStep", "testStart", "testStop", "testStore", "testStub", "latestStable", "latestStatus", "latestStore", "filesToDelete",
  "snapshotsToDelete", "autoDelete", "doDelete", "repoDelete", "codelet", "modelEtag", "histoDelta", "hostStopped", "chatModelEdits", "restore", "history", "todo/PLAN_x.md",
  "snapshotsToPrune", "tellClientsToCatchUp", "filesToDeleted"];
const PIECES = ["testsTo", "ToDelete", "testsT", "sToDel", "oDelete", "teststo", "todelete", "TESTSTO", "TODELETE", "testsTo-", "ToDelete-*", "stsToD", "sToDelete"];

test("F30 table 1: the 13 real pieces of the measure are each a legacy-name on their line", () => {
  assert.equal(PIECES.length, 13);
  for (const piece of PIECES) assert.deepEqual(listOf(scanText("scripts/zz.mjs", fixtureOf("x.mjs", [`const a = ${JSON.stringify(piece)};`]))), ["1:legacy-name"], piece);
});

/** Row = [the lines, the file, why it is no finding]. */
const CLEAN = [
  ...WORDS.map((word) => [[`const a = ${JSON.stringify(word)};`], "scripts/zz.mjs", `the product word ${word}`]),
  [["const a = 'tests' + 'Run' + 'ToDo';"], "scripts/zz.mjs", "tests, Run, To and Do: the joined literal holds no crossing piece of 6"],
  [["const a = 'testing' + ' Delete';"], "scripts/zz.mjs", "tests and Delete apart"],
  [['const a = "TestsTo";'], "scripts/zz.mjs", "TestsTo, with a capital first letter, is not a form of the word"],
  [['const a = "xtestsTo";'], "scripts/zz.mjs", "a letter touches the piece"],
  [['const a = "testsToy";'], "scripts/zz.mjs", "a letter touches the piece"],
  [['const a = "testsToDeleted";'], "scripts/zz.mjs", "a longer word"],
  [['const a = "testsToDeleteCount";'], "scripts/zz.mjs", "a longer word"],
  [['const a = "mytestsToDelete";'], "scripts/zz.mjs", "a longer word, on the left"],
  [['const a = "a testsToDelete entry is listed";'], "scripts/zz.mjs", "prose: a space on each side"],
  [['const a = "see testsToDelete, then stop";'], "scripts/zz.mjs", "prose: a comma and a space after the word"],
  [['const a = "the testsToDelete.";'], "scripts/zz.mjs", "prose: a full stop at the literal's end"],
  [['const a = "(the testsToDelete) rule";'], "scripts/zz.mjs", "prose: a bracket and a space after the word"],
  [["const n = `${LEGACY_WORD}x`;"], "scripts/zz.mjs", "a template hole that holds a variable is not read: folding never invents a word"],
  [["const n = `${LEGACY_WORD}-${id}`;"], "scripts/zz.mjs", "a template hole that holds a variable is not read"],
  [["const n = `${'te'}${'st'}${id}`;"], "scripts/zz.mjs", "holes that hold literals, then a variable: no word"],
  [['const n = "testsTo" + "Delete-u1000-coai-x-" + id;'], "scripts/zz.mjs", "an owner-form name split over +: the joined literal holds the whole word in the owner form"],
  [['const n = ["testsTo", "Delete-w42-coai-"].join("") + id;'], "scripts/zz.mjs", "an owner-form name split over .join"],
  [["const n = `testsTo${'Delete'}-u1000-coai-${id}`;"], "scripts/zz.mjs", "an owner-form name split over a template hole"],
  [['const n = "testsTo" + "Delete-" + "u1000" + "-coai-x";'], "scripts/zz.mjs", "an owner-form name split over three +"],
  [[`const n = "${Q}-u1000-coai-x-abc123";`], "scripts/zz.mjs", "the owner form, whole"],
  [[`const e = "// ${Q}-exempt: raw-temp — a probe the test removes";`], "scripts/zz.mjs", "the exempt marker word"],
  [[`const q = ".x.${P}-quarantine-1-ab";`], "scripts/zz.mjs", "the quarantine sibling's word"],
  [[`execFileSync("docker", ["volume", "create", "--label", \`${Q}.owner=\${owner}\`, name]);`], "scripts/zz.mjs", "the owner label key is a docker label's name, not a name and not a pattern"],
  [[`const e = process.env.${P.toUpperCase()}_RUN;`], "scripts/zz.mjs", "an environment variable, not in a literal"],
  [[`const e = "${P.toUpperCase()}_RUN";`], "scripts/zz.mjs", "an environment variable name in a literal"],
  // found on the real trees (2026-11-05): each was a false finding of the first reader
  [[`        run: grep -Eq "^[[:space:]]+$words: .*/${Q}-[uw][0-9]{1,10}-coai-$what-[A-Za-z0-9]{6}" "$LOG" || exit 1`], ".github/workflows/zz.yml", "an owner as a class [uw] before digits is an owner segment (coai's ci.yml)"],
  [[`        run: first=$(grep -v "${Q}-[uw][0-9]" "$LOG" || true)`], ".github/workflows/zz.yml", "an owner as a class [uw] before digits (coai's ci.yml)"],
  [[`assert.equal(existsSync(path.join(base, 'in-score')), true, 'a ${Q} entry under score-tmp is listed, never removed');`], "scripts/zz.mjs", "a sentence in an assertion message (benchmark's heldout-run.test.mjs)"],
  [[`const rx = new RegExp("${Q}-[uw]\\\\d{1,10}-x-");`], "scripts/zz.mjs", "an owner as a class [uw] before \\d, in a RegExp string"],
  // comments of each kind hold pieces only: a comment is removed before the folded readings
  [["// const n = 'tests' + 'To' + 'Delete-x';"], "scripts/zz.mjs", "a whole-line // comment"],
  [["const a = 1; // const n = 'tests' + 'To' + 'Delete-x'; 'testsTo'"], "scripts/zz.mjs", "a trailing // comment"],
  [["const a = 1; /* 'testsTo' + 'Delete-x' */"], "scripts/zz.mjs", "a trailing /* */ comment"],
  [["/**", " * const n = 'tests' + 'To' + 'Delete-x'; 'testsTo'", " */"], "scripts/zz.mjs", "a JSDoc block"],
  [["/*", "const n = 'tests' + 'To' + 'Delete-x';", "*/"], "scripts/zz.mjs", "commented-out code in a block comment with no stars"],
  [["const a = 1; /* a comment that opens", "const n = 'testsTo';", "and ends */ const b = 2;"], "scripts/zz.mjs", "a block comment that opens after code and holds a line of code"],
  [["const a = 1; // don't", "const b = 2;"], "scripts/zz.mjs", "an apostrophe in a comment pairs with nothing"],
  [["# const n = 'testsTo'"], "scripts/zz.sh", "a whole-line # comment in .sh"],
  [[`# rm -rf ${Q}-*`], "scripts/zz.sh", "a whole-line # comment that holds a sweep"],
  [["// const n = 'testsTo'; rm -rf 'tests' + 'To' + 'Delete-*'"], "scripts/zz.mjs", "a whole-line // comment: the folded readings read nothing"],
  [["echo hi # 'testsTo' 'tests''To''Delete-x'"], "scripts/zz.sh", "a trailing # comment in .sh"],
  [["echo don\\'t"], "scripts/zz.sh", "echo don\\'t: an escaped apostrophe opens no literal"],
  [['echo "it\'s fine"'], "scripts/zz.sh", "an apostrophe inside double quotes"],
  [["      - run: echo 'it''s'  # 'testsTo'"], ".github/workflows/zz.yml", "a workflow line with a # comment"],
  [["$a = 1 # 'testsTo'"], "scripts/zz.ps1", "a trailing # comment in .ps1"],
  [["<# a block comment", "$n = 'tests' + 'To' + 'Delete-x'", "#>", "$b = 2"], "scripts/zz.ps1", "commented-out code in a .ps1 block comment"],
  [["<# 'testsTo' #> $b = 2"], "scripts/zz.ps1", "a one-line .ps1 block comment"],
  // a literal that is no code
  [["const css = `", "a { background: url(x/*.png) }", "`;"], "scripts/zz.mjs", "a multi-line template that holds /* opens no block comment"],
  [["const r = /'/; const s = 'a' + 'b';"], "scripts/zz.mjs", "a regex that holds a quote"],
];

test("F30 table 2: product words, pieces that touch a letter, comments, prose and owner forms are no finding", () => {
  const wrong = CLEAN.flatMap(([lines, file, why]) => {
    const text = path.extname(file) === ".yml" ? `${lines.join("\n")}\n` : fixtureOf(file, lines);
    const found = scanText(file, text);
    return found.length === 0 ? [] : [`${JSON.stringify(lines)} (${why}): ${JSON.stringify(found.map((entry) => `${entry.line}:${entry.cls}`))}`];
  });
  assert.deepEqual(wrong, [], "lines that must stay []");
  assert.ok(CLEAN.length >= 70);
});

test("F30 table 2: a whole name in a comment is a finding today and stays one; a whole-line comment is not read", () => {
  assert.deepEqual(listOf(scanText("scripts/zz.mjs", fixtureOf("x.mjs", [`const a = 1; // ${Q}-coai-x-abc123`]))), ["1:legacy-name"]);
  assert.deepEqual(listOf(scanText("scripts/zz.mjs", fixtureOf("x.mjs", [`// ${Q}-coai-x-abc123`]))), []);
});

test("F30 limits: JSX text is not told from code: an apostrophe stops that line's reading, and nothing crashes", () => {
  assert.deepEqual(listOf(scanText("src/zz.tsx", fixtureOf("x.tsx", ["const el = <p>don't</p>; const n = 'tests' + 'To' + 'Delete-x';"]))), [], "the stated limit of D2");
  assert.deepEqual(listOf(scanText("src/zz.tsx", fixtureOf("x.tsx", ["const el = <p>don't</p>;", "const n = 'tests' + 'To' + 'Delete-x';"]))), ["2:legacy-name"], "the next line is read");
  assert.deepEqual(listOf(scanText("scripts/zz.mjs", fixtureOf("x.mjs", ["const n = `tests` + `To` + `Delete-x`;"]))), ["1:legacy-name"], "templates are operands too");
  assert.deepEqual(listOf(scanText("scripts/zz.mjs", fixtureOf("x.mjs", ["const n = `${`tests`}${`To`}`;"]))), [], "a template nested in a hole is not read");
  assert.deepEqual(listOf(scanText("scripts/zz.mjs", fixtureOf("x.mjs", ["const n = `${`}`}`; const m = 'tests' + 'To' + 'Delete-x';"]))), ["1:legacy-name"], "a nested template that holds a brace keeps the state");
});

// D6: the allowances are this repository's own, and only when the scan is of this repository ---------------------------------------

test("F30 D6: the folding allowances are exactly the listed files; each exists and still needs its place", () => {
  assert.ok(Object.isFrozen(FOLDING_ALLOWANCES));
  assert.deepEqual([...FOLDING_ALLOWANCES], [...FOLDING_ALLOWANCES].sort(), "sorted, so a new entry shows in a diff");
  assert.equal(new Set(FOLDING_ALLOWANCES).size, FOLDING_ALLOWANCES.length);
  for (const file of FOLDING_ALLOWANCES) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} exists`);
    assert.ok(isScanned(file), `${file} is a file the guard scans`);
    const text = fs.readFileSync(path.join(root, file), "utf8");
    const allowed = scanText(file, text, [], undefined, undefined, { foldingAllowances: FOLDING_ALLOWANCES });
    const folded = scanText(file, text, [], undefined, undefined, { foldingAllowances: [] });
    assert.ok(folded.length > allowed.length, `${file} still draws a finding from the folding reader without its allowance: remove a stale entry`);
  }
});

test("F30 D6: scanText has no allowance by default; an allowance silences the folded readings and nothing else", () => {
  const file = FOLDING_ALLOWANCES[0];
  const split = 'const n = "testsTo" + "Delete-agent-";\n';
  assert.deepEqual(scanText(file, split).map((entry) => entry.cls), ["legacy-name"], "no option, no allowance: a listed name draws the finding");
  assert.deepEqual(scanText(file, split, [], undefined, undefined, { foldingAllowances: FOLDING_ALLOWANCES }).map((entry) => entry.cls), []);
  assert.deepEqual(scanText(file, `const n = "${Q}-agent-1";\n`, [], undefined, undefined, { foldingAllowances: FOLDING_ALLOWANCES }).map((entry) => entry.cls), ["legacy-name"], "a whole name in a listed file is still a finding");
});

test("F30 D6: a consumer inherits no allowance by a matching path: tools/janitor.sh of another repository is read", (t) => {
  const repo = tree(t, { "tools/janitor.sh": "mkdir /tmp/tests\"To\"'Delete-agent-1'\n" });
  const found = scanRepository({ repo, rule: RULE }).findings.filter((entry) => entry.file === "tools/janitor.sh");
  assert.deepEqual(found.map((entry) => `${entry.line}:${entry.cls}`), ["1:legacy-name"]);
  const own = scanText("tools/janitor.sh", "mkdir /tmp/tests\"To\"'Delete-agent-1'\n", [], undefined, undefined, { foldingAllowances: FOLDING_ALLOWANCES });
  assert.deepEqual(own, [], "the same line in this repository's own janitor, through the allowance list");
});

test("F30 D6: this repository's own scan applies the allowances (the guard is green over its own root)", () => {
  const real = scanRepository({ repo: root });
  assert.deepEqual(real.findings.map((entry) => `${entry.file}:${entry.line}:${entry.cls}`), []);
});

test("F30 D6: the janitor's allowlisted inventory line draws no owner-blind through the folded readings either", () => {
  const text = fs.readFileSync(path.join(root, JANITOR), "utf8").replace(/\r\n/g, "\n");
  const entries = JSON.parse(fs.readFileSync(ALLOWLIST, "utf8")).entries;
  const found = scanText(JANITOR, text, entries, undefined, undefined, { foldingAllowances: [] });
  const line = entries[0].line;
  assert.deepEqual(found.filter((entry) => entry.line === line).map((entry) => entry.cls), [], "the line the allowlist passes draws nothing from any reading");
  const without = scanText(JANITOR, text, [], undefined, undefined, { foldingAllowances: [] });
  assert.ok(without.some((entry) => entry.line === line && entry.cls === "owner-blind"), "without the allowlist the same line is owner-blind");
});

// the reader itself ----------------------------------------------------------------------------------------------------------------

const readerOf = (extension, ...lines) => fold.foldFile(lines, extension).lines.map((entry) => ({ text: entry.text, literals: entry.literals.map((literal) => literal.value) }));

test("F30 reader: foldFile joins, decodes, removes comments and keeps the quotes; a hole that holds anything but a literal stays", () => {
  const rows = [
    // [extension, line, the folded text, the joined literals]
    [".mjs", 'const n = "testsTo".concat("Delete-agent-", id);', 'const n = "testsToDelete-agent-".concat(id);', ["testsToDelete-agent-"]],
    [".mjs", 'const n = "a".concat("b").concat("c", x);', 'const n = "abc".concat(x);', ["abc"]],
    [".mjs", "const n = `testsTo${'Delete'}-${x}`;", "const n = `testsToDelete-${x}`;", ["testsToDelete-${x}"]],
    [".mjs", "const n = `${LEGACY_WORD}x`;", "const n = `${LEGACY_WORD}x`;", ["${LEGACY_WORD}x"]],
    [".mjs", "const n = ['a', 'b'].join('-') + 'c';", "const n = 'a-bc';", ["a-bc"]],
    [".ts", "const n = 'tests\\x54o' + \"Del\\u0065te\";", "const n = 'testsToDelete';", ["testsToDelete"]],
    [".mjs", 'const n = "a" + id + "b";', 'const n = "a" + id + "b";', ["a", "b"]],
    [".mjs", 'const n = ("a") + ("b");', "const n = ('ab');".replace(/'/g, '"'), ["ab"]],
    [".mjs", "const n = 'a'; // 'b' + 'c'", "const n = 'a'; ", ["a"]],
    [".mjs", "const n = 'a'; /* 'b' */ const m = 'c';", "const n = 'a';  const m = 'c';", ["a", "c"]],
    [".mjs", "const r = /'/g; const n = 'a' + 'b';", "const r = /'/g; const n = 'ab';", ["ab"]],
    [".mjs", "const r = a / b; const n = 'a' + 'b'; const t = 'c' / 2;", "const r = a / b; const n = 'ab'; const t = 'c' / 2;", ["ab", "c"]],
    [".sh", "rm -rf $'tests\\x54oDelete-*' \"a\"'b'", `rm -rf '${Q}-*' "ab"`, [`${Q}-*`, "ab"]],
    [".sh", "mkdir /tmp/tests\"To\"'Delete-x' # c", `mkdir "/tmp/testsToDelete-x" `, ["/tmp/testsToDelete-x"]],
    [".yml", "      - run: echo 'a''b'", "      - run: echo 'ab'", ["ab"]],
    [".ps1", '$n = ("testsTo", "Delete-agent-1") -join ""', '$n = ("testsToDelete-agent-1")', ["testsToDelete-agent-1"]],
    [".ps1", "$n = 'a' + \"b\" + 'c'", "$n = 'abc'", ["abc"]],
    [".mjs", "no quote on this line", "no quote on this line", []],
  ];
  for (const [extension, line, text, literals] of rows) {
    const [folded] = readerOf(extension, line);
    assert.equal(folded.text, text, line);
    assert.deepEqual(folded.literals, literals, line);
  }
  assert.deepEqual([".mjs", ".cjs", ".js", ".ts", ".mts", ".cts", ".tsx", ".jsx"].map(fold.foldKind), Array(8).fill("js"));
  assert.deepEqual([".sh", ".yml", ".yaml", ".ps1", ".md", ".py", ".bash", ".cmd", ""].map(fold.foldKind), ["sh", "sh", "sh", "ps1", undefined, undefined, undefined, undefined, undefined]);
  assert.equal(fold.foldFile(['a "testsTo" + "Delete" in a document'], ".md"), null, "a kind that is not listed is not read");
});

test("F30 reader: no marker character is put in the text, so a control byte in a line turns nothing off; a decoded newline never splits a line", () => {
  const [row] = readerOf(".mjs", `const c = "\u0001\u0002"; const n = 'tests' + 'To' + 'Delete-x';`);
  assert.equal(row.text, `const c = "\u0001\u0002"; const n = 'testsToDelete-x';`);
  const [escaped] = readerOf(".mjs", 'const n = "a\\nb" + "\\r";');
  assert.doesNotMatch(escaped.text, /[\r\n]/, "the folded text is one line");
  assert.deepEqual(escaped.literals, ["a\nb\r"], "the literal itself is decoded");
});

test("F30 reader: state crosses lines for a block comment and a template, and for nothing else", () => {
  const rows = readerOf(".mjs", "const a = 1; /* open", "'testsTo' in the comment", "closed */ const b = 'x' + 'y';", "const t = `x ${ f(", "  'q') } /* still template", "end`; const c = 'p' + 'r';");
  assert.deepEqual(rows[0], { text: "const a = 1; ", literals: [] });
  assert.deepEqual(rows[1], { text: "", literals: [] });
  assert.deepEqual(rows[2], { text: " const b = 'xy';", literals: ["xy"] });
  assert.equal(rows[3].literals.join("|"), "x ", "the template's body before its hole is a literal portion");
  assert.equal(rows[3].text, "const t = `x ${ f(", "the hole is code and is kept as written");
  assert.deepEqual(rows[4], { text: "  'q') } /* still template", literals: [" /* still template"] }, "the hole's tail is code, the template goes on after it");
  assert.deepEqual(rows[5], { text: "`; const c = 'pr';".replace("`;", "end`;"), literals: ["end", "pr"] });
});

test("F30 reader: a file that ends inside a block comment is one unreadable finding on the line it opens; a template is no such finding", () => {
  const found = scanText("scripts/zz.mjs", "const a = 1;\n/* never closed\nconst b = 2;\n");
  assert.deepEqual(found.map((entry) => `${entry.line}:${entry.cls}`), ["2:unreadable"]);
  assert.match(found[0].text, /block comment/);
  assert.deepEqual(scanText("scripts/zz.ps1", "<# never closed\n$a = 1\n").map((entry) => `${entry.line}:${entry.cls}`), ["1:unreadable"]);
  assert.deepEqual(scanText("scripts/zz.mjs", "const a = `never closed\nconst b = 2;\n").map((entry) => entry.cls), [], "D1 names the block comment only");
});

test("F30 reader: the bare word and the piece rule read literals, and never an operand", () => {
  const literal = (value, plus = false) => ({ value, plus });
  const bare = (...values) => fold.bareWordHits(values.map((value) => literal(value)));
  assert.deepEqual(bare(`${Q}-u1000-coai-`, `${Q}[-_]w42[-_]`, `${Q}-exempt: x`, `.x.${P}-quarantine-1`, `${P.toUpperCase()}_RUN`, `${Q}.owner=u1`, `${Q}-agent-x`, `${Q}-\${owner}-`), { blind: [], legacy: [] },
    "an owner form, the marker words, an environment name, the label key, a name (legacyNameHits') and a placed owner are no bare word");
  assert.equal(bare(Q, `${Q}-`, `${P}_`, `x ${Q}-`).legacy.length, 4);
  assert.deepEqual(bare(`${Q}-*`, `${Q}[-_]`, `${Q}-(x)`, `${Q}-?`, `${Q}\\d`).legacy, [], "a tail that holds [, (, ?, * or \\ is a pattern");
  assert.equal(bare(`${Q}-*`, `${Q}[-_]`, `${Q}-(x)`, `${Q}-?`, `${Q}\\d`).blind.length, 5);
  assert.deepEqual(bare(`${Q}-[uw]\\d{1,10}-x`, `${Q}-[uw][0-9]`, `${Q}-[uw][0-9]{1,10}-`, `${Q}-[uw]\\d`), { blind: [], legacy: [] }, "[uw] with a digit form after it is an owner");
  assert.equal(bare(`${Q}-[uw]`).blind.length, 1, "[uw] with no digit form after it reaches every owner");
  assert.equal(bare(`${Q}-[uw]x`).blind.length, 1);
  assert.deepEqual(bare(`a ${Q} entry`, `see ${Q}, then`, `the ${Q}.`, `a ${Q}) rule`), { blind: [], legacy: [] }, "prose: a space before the word, and after it a space or , . : ) then a space or the end");
  assert.equal(bare(`${Q} entry`).legacy.length, 1, "no space before the word: not prose");
  assert.equal(bare(`a ${Q}-x ${Q}`).legacy.length, 1, "the second occurrence ends the literal");
  assert.deepEqual(bare(`${Q}d`, `${Q}Count`, `x${Q}`, `${Q}2`), { blind: [], legacy: [] }, "a letter or digit at either side makes it another word");
  assert.deepEqual(fold.bareWordHits([literal(`${Q}-u`, true)]), { blind: [], legacy: [] }, "the owner letter at the end of a literal that a + continues");
  assert.equal(fold.bareWordHits([literal(`${Q}-u`, false)]).legacy.length, 1, "the owner letter and nothing after it is a bare `u`: it reaches every owner");
  assert.equal(fold.bareWordHits([literal(`${Q}-uu`, true)]).legacy.length, 0, "-uu is a narrow second segment, which legacyNameHits judges");
  assert.equal(bare(`${P.toUpperCase()}_U`, `${P.toUpperCase()}_W`).legacy.length, 2, "the extra for the _U and _W environment names is gone");
  assert.deepEqual(fold.pieceHits(["restore", "history", "todo/x", "hostStopped", "chatModelEdits", `${Q}-x`].map(literal)), [], "no piece of 6 in a product word; the whole word is judged by bareWordHits");
  assert.equal(fold.pieceHits(["testsTo"].map(literal)).length, 1);
  assert.equal(fold.pieceHits(["TESTSTO", "teststo", "TODELETE"].map(literal)).length, 3, "the three forms of the word: camel, lower, upper");
  assert.equal(fold.pieceHits(["Teststo", "tESTSTO"].map(literal)).length, 0, "any other mix of cases is no form");
  assert.equal(fold.pieceHits(["xTODELETEx"].map(literal)).length, 0, "a letter at a side");
  assert.equal(fold.pieceHits(["1TODELETE2", "-testsTo-"].map(literal)).length, 2, "a digit or a dash at a side is not a letter");
  assert.equal(fold.pieceHits(["sToDel"].map(literal)).length, 1, "6 characters that cross the join");
  assert.equal(fold.pieceHits(["sToDe"].map(literal)).length, 0, "5 is below the minimum");
  assert.equal(fold.pieceHits(["Delete", "tests", "testS"].map(literal)).length, 0, "a half that sits wholly inside one word is no crossing piece");
});

test("F30 reader: decodeCode reads a one-character class and the \\x, \\u escapes of a regex literal", () => {
  assert.equal(fold.decodeCode("/^tests[T]oDelete[-_]/"), `/^${Q}[-_]/`);
  assert.equal(fold.decodeCode("/^tests\\x54o\\u0044elete\\u{65}/"), `/^${Q}e/`);
  assert.equal(fold.decodeCode("/[a-z][0-9][-_][^x]/"), "/[a-z][0-9][-_][^x]/", "a class of more than one character stays");
  assert.equal(fold.decodeCode("nothing to decode"), "nothing to decode");
});

// D5 item 4: time and size ---------------------------------------------------------------------------------------------------------

const MiB = 1024 * 1024;
const repeatTo = (unit, size) => unit.repeat(Math.ceil(size / unit.length)).slice(0, size);
const stepsOf = (extension, line) => {
  const meter = { steps: 0 };
  const result = fold.foldFile([line], extension, { meter });
  assert.ok(result !== null);
  return meter.steps;
};

const HOSTILE = [
  [".mjs", "an escaped single quote", (size) => repeatTo("\\'", size)],
  [".mjs", "an escaped double quote", (size) => repeatTo('\\"', size)],
  [".mjs", "a literal and a comma", (size) => repeatTo("'a',", size)],
  [".mjs", "spaces after a literal", (size) => `x = 'a'${" ".repeat(size)}`],
  [".mjs", "a literal, spaces, a literal", (size) => repeatTo(`'a'${" ".repeat(61)}`, size)],
  [".mjs", "a literal and a plus that continues nothing", (size) => repeatTo("'a' + ", size)],
  [".mjs", "a backtick and a quote", (size) => repeatTo("`\"", size)],
  [".mjs", "an open regex class", (size) => repeatTo("= /[ ", size)],
  [".mjs", "the word, repeated", (size) => repeatTo(`${Q} `, size)],
  [".mjs", "a plus and parentheses that never close", (size) => repeatTo("'a' + ((", size)],
  [".mjs", "arrays of parenthesised literals that never close", (size) => repeatTo("[('a'), (", size)],
  [".mjs", "spaces around .concat and its argument", (size) => repeatTo("'a' . concat ( ('a') ", size)],
  [".mjs", "a long run of opening parentheses after a bracket", (size) => `x = [${"(".repeat(size)}`],
  [".mjs", "an array that never closes", (size) => `x = [${repeatTo("'a', ", size)}`],
  [".mjs", "a concat that never closes", (size) => `x = 'a'.concat(${repeatTo("'a', ", size)}`],
  [".mjs", "holes that never close", (size) => repeatTo("`${'", size)],
  [".mjs", "a block comment that never closes", (size) => repeatTo("/* ' ", size)],
  [".sh", "an escaped quote", (size) => repeatTo("\\'", size)],
  [".sh", "touching pieces", (size) => repeatTo('"a"', size)],
  [".sh", "spaces after a literal", (size) => `x 'a'${" ".repeat(size)}`],
  [".sh", "a quote that never closes", (size) => repeatTo("echo '", size)],
  [".ps1", "a doubled quote", (size) => repeatTo("''", size)],
  [".ps1", "a list that never closes", (size) => repeatTo("'a',", size)],
  [".ps1", "a plus chain", (size) => repeatTo("'a' + ", size)],
];

test("F30 time: the reader's step counter grows linearly at 1, 2, 4 and 8 MB, for every hostile line", () => {
  assert.equal(typeof fold.foldFile, "function");
  const wrong = [];
  for (const [extension, kind, build] of HOSTILE) {
    const sizes = extension === ".mjs" ? [1, 2, 4, 8] : [1, 2, 4];
    const steps = sizes.map((mib) => stepsOf(extension, build(mib * MiB)));
    steps.forEach((count, index) => {
      if (count > 24 * sizes[index] * MiB) wrong.push(`${extension} ${kind}: ${count} steps at ${sizes[index]} MB`);
      if (index > 0 && count > 2.3 * steps[index - 1]) wrong.push(`${extension} ${kind}: ${steps[index - 1]} -> ${count} steps, more than double`);
    });
  }
  assert.deepEqual(wrong, []);
});

test("F30 time: one run of 32 MB, of the reader alone", () => {
  const size = 32 * MiB;
  const count = stepsOf(".mjs", repeatTo("'a', = /[ \\' ", size));
  assert.ok(count <= 24 * size, `${count} steps at 32 MB`);
});

test("F30 time: many lines cost the same per byte as one", () => {
  const lines = Array.from({ length: 20000 }, (_, index) => `const n${index} = 'a' + 'b'; // 'x'`);
  const meter = { steps: 0 };
  const result = fold.foldFile(lines, ".mjs", { meter });
  assert.equal(result.lines.length, 20000);
  assert.ok(meter.steps <= 24 * lines.join("\n").length);
});

const bigLine = (size) => `const a = "${"a".repeat(size - 13)}";`;

test("F30 limit: a folded line over 256 KiB is not read by the folded readings and is ONE unreadable finding with its text", () => {
  assert.equal(fold.FOLD_LIMIT, 256 * 1024);
  const text = `${bigLine(300 * 1024)}\n`;
  const found = scanText("scripts/zz.mjs", `const clean = 1;\n${text}const clean2 = 2;\n`);
  assert.deepEqual(found.map((entry) => `${entry.line}:${entry.cls}`), ["2:unreadable"]);
  assert.equal(found[0].text, "line 2 is 300 KiB: the folded reading stops at 256 KiB");
  assert.equal(found[0].file, "scripts/zz.mjs");
  const exactly = scanText("scripts/zz.mjs", `${bigLine(256 * 1024)}\n`);
  assert.deepEqual(exactly, [], "256 KiB exactly is read");
  const over = scanText("scripts/zz.mjs", `${bigLine(256 * 1024 + 1)}\n`);
  assert.deepEqual(over.map((entry) => entry.text), ["line 1 is 257 KiB: the folded reading stops at 256 KiB"]);
});

test("F30 limit: the raw readings stay as they are on a line over the limit; the other lines are still read", () => {
  const long = `const a = "${"a".repeat(300 * 1024)}"; const n = "${Q}-coai-x-abc123";`;
  const found = scanText("scripts/zz.mjs", `${long}\nconst m = "tests" + "To" + "Delete-x";\n`);
  assert.deepEqual(listOf(found, 0), ["1:legacy-name", "1:unreadable", "2:legacy-name"]);
});

test("F30 limit: a line that is long before folding and short after it (a comment) is read", () => {
  const found = scanText("scripts/zz.mjs", `const n = "tests" + "To" + "Delete-x"; // ${"c".repeat(400 * 1024)}\n`);
  assert.deepEqual(found.map((entry) => entry.cls), ["legacy-name"]);
});

test("F30 limit: any throw in the reader is ONE unreadable finding that names the file, never a crash and never a clean result", () => {
  const boom = () => {
    throw new RangeError("boom");
  };
  const found = scanText("scripts/zz.mjs", `const n = "${Q}-coai-x-abc123";\nconst m = 1;\n`, [], undefined, undefined, { reader: boom });
  assert.deepEqual(found.map((entry) => `${entry.file}:${entry.line}:${entry.cls}`).sort(), ["scripts/zz.mjs:1:legacy-name", "scripts/zz.mjs:1:unreadable"], "the raw readings still run; ONE unreadable");
  assert.match(found.find((entry) => entry.cls === "unreadable").text, /boom/);
  const clean = scanText("scripts/zz.mjs", "const m = 1;\n", [], undefined, undefined, { reader: boom });
  assert.deepEqual(clean.map((entry) => entry.cls), ["unreadable"], "a file with nothing else is not clean");
  assert.equal(scanText("scripts/zz.mjs", "const m = 1;\n", [], undefined, undefined, { reader: () => null }).length, 0, "a reader that does not read the kind adds nothing");
});

test("F30 limit: the unreadable class names its wider use in its cure, and the guard's header says so", () => {
  assert.match(CURES.unreadable, /folded reading|folding reader/);
  assert.match(fs.readFileSync(path.join(root, "tools", "leftovers-check.mjs"), "utf8"), /256 KiB/);
});

// F30 review fix 2 — the classifier's cost on a raw line (todo/PLAN_F30_folding_reader.md, Goal: a hostile line never hangs) -----------

/** The matcher test of `looseVerdicts` as it was at the release: a regular expression run on everything before each occurrence of the word, quadratic on a repeated word. The oracle of the differential test. */
const OLD_MATCHER = /(?:\bgrep\b|\bfindstr\b|-i?match\b|-i?like\b|\.test\(|\.includes\(|\.match\(|\.search\(|\bre\.\w+\(|startswith\(|endswith\(|-iname\b|(?<![-\w])-name\b|-regex\b)[^|;]*$/;
/** `looseVerdicts` as it was at the release, for a line that holds no deleting word (so only the matcher arms an occurrence). */
function oldLooseVerdicts(lower) {
  const verdicts = [];
  for (const match of lower.matchAll(new RegExp(P, "g"))) {
    const before = lower.slice(0, match.index);
    const rest = lower.slice(match.index + match[0].length);
    if (/[a-z0-9_.]$/.test(before) || rest.startsWith(".owner")) continue;
    if (OLD_MATCHER.test(before)) verdicts.push(sweeper.verdictAfter(rest));
  }
  return verdicts;
}

const PIECES_OF_LINE = [P, `x${P}`, `${P}.owner`, `${P}x`, `${P}-`, `${P}-u1-`, ".", "grep ", "-name ", "-iname ", "-regex ", ".test(", ".includes(", ".match(", ".search(", "startswith(", "endswith(", "re.f(", "re.x" + P + "(", "findstr ", "-match ", "-imatch ", "-like ", "-ilike ", "-NAME ", "x-name ", "xgrep ", "grep", "|", ";", "(", ")", " ", "'", "a", "_", "*"];

test("F30 classifier: looseVerdicts answers what the regular expression of the release answered, over every line of up to four pieces and 30000 random ones", () => {
  assert.equal(typeof sweeper.looseVerdicts, "function");
  const small = [P, `x${P}`, `${P}.owner`, `${P}-`, "grep ", "-name ", ".test(", "re.x" + P + "(", "|", ";", " ", "a"];
  const lines = [""];
  let frontier = [""];
  for (let length = 1; length <= 4; length += 1) {
    frontier = frontier.flatMap((head) => small.map((piece) => head + piece));
    lines.push(...frontier);
  }
  let seed = 12345;
  const next = (limit) => (seed = (seed * 1103515245 + 12345) % 2147483648) % limit;
  for (let count = 0; count < 30000; count += 1) lines.push(Array.from({ length: 1 + next(14) }, () => PIECES_OF_LINE[next(PIECES_OF_LINE.length)]).join(""));
  const wrong = lines.filter((line) => JSON.stringify(sweeper.looseVerdicts(line.toLowerCase())) !== JSON.stringify(oldLooseVerdicts(line.toLowerCase())));
  assert.deepEqual(wrong.slice(0, 5), [], `${wrong.length} of ${lines.length} lines answer differently`);
  assert.ok(lines.length > 40000);
});

test("F30 classifier: a token that holds the word arms a later occurrence and not an earlier one; a pipe or a semicolon disarms (the differential rows by hand)", () => {
  assert.deepEqual(sweeper.looseVerdicts(`re.x${P}( ${P}-`), ["broad"], "the token re.x…( holds the first occurrence, a longer word: it arms the second");
  assert.deepEqual(sweeper.looseVerdicts(`grep ${P} | ${P}-`), ["broad"], "armed for the first; the pipe disarms the second");
  assert.deepEqual(sweeper.looseVerdicts(`grep ${P}-a ; ${P}-`), [null], "the semicolon disarms the second");
  assert.deepEqual(sweeper.looseVerdicts(`${P}-a grep ${P}-b`), [null], "only the second is armed");
});

const MIB = 1024 * 1024;
const CLASSIFIER_CHILD = `
import { scanText } from ${JSON.stringify(pathToFileURL(path.join(root, "tools", "leftovers-check.mjs")).href)};
const [unit, mib] = process.argv.slice(1);
const line = "x = " + unit.repeat(Math.ceil(Number(mib) * 1048576 / unit.length));
const started = Date.now();
const found = scanText("scripts/zz.mjs", line + "\\n");
console.log(JSON.stringify({ seconds: (Date.now() - started) / 1000, classes: [...new Set(found.map((entry) => entry.cls))].sort() }));
`;
const CLASSIFIER_UNITS = [
  ["the word", `${Q} `], ["rm and the word", `rm ${Q} `], ["grep and the word", `grep ${Q} `], ["the word and a pipe", `${Q}| `], ["the word and a glob", `${Q}-*`],
  ["a quoted name and a comma", `'${Q}-',`], ["a path anchor", `/${Q}-`],
  ["an escaped single quote", "\\'"], ["an escaped double quote", '\\"'], ["a literal and a comma", "'a',"], ["spaces after a literal", `'a'${" ".repeat(61)}`], ["a backtick and a quote", '`"'], ["an open regex class", "= /[ "],
];

test("F30 time: scanText on one hostile line of 2 MiB ends within 60 s, for the repeated word and for D5's lines (the classifier is linear on a raw line)", () => {
  const slow = [];
  for (const [name, unit] of CLASSIFIER_UNITS) {
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", CLASSIFIER_CHILD, unit, "2"], { encoding: "utf8", timeout: 60_000 });
    if (child.status !== 0) slow.push(`${name}: ${child.error?.code ?? `exit ${child.status}`} ${child.stderr.slice(0, 200)}`);
  }
  assert.deepEqual(slow, [], "lines that did not end in 60 s");
});

test("F30 time: a file with 300000 findings is read to the end (no call spreads the list of findings)", (t) => {
  const repo = tree(t, { "scripts/many.sh": "t=$(mktemp)\n".repeat(300000) });
  const found = scanRepository({ repo, rule: RULE }).findings.filter((entry) => entry.file === "scripts/many.sh");
  assert.equal(found.length, 300000);
});
