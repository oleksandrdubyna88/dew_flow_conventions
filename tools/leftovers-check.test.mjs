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
import { fileURLToPath } from "node:url";

import { git } from "./lib/git.mjs";
import { MAX_CLAIM_BYTES, REPO_ROW, REPO_TOKEN, ownedDir } from "./lib/owned.mjs";
import { EXCLUDED_FILES, main, scanRepository, scanText, tokenConstants, tokenFindings, parseTokenTable } from "./leftovers-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RULE = path.join(root, "common", "test-leftovers.md");

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

const NAME = "testsToDelete-x-abc123";
const VOLUME = "testsToDelete-x-data-abc123";

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
  assert.equal(one(t, "tools/r.sh", "docker run -d --rm --name testsToDelete-x-abc123 img\n").code, 0);
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
  assert.equal(one(t, "tools/ok.sh", "docker volume create testsToDelete-x-cache-abc123\n").code, 0);
  assert.equal(one(t, "tools/ok2.test.mjs", 'new ContainerBuilder().WithName("testsToDelete-x-db-abc123");\n').code, 0);
});

test("2. docker-name: a compose project name — -p, --project-name, COMPOSE_PROJECT_NAME — needs a spelling", (t) => {
  const GOOD = "testsToDelete-x-stack-abc123";
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
    `docker-compose -f a.yml -p teststodelete-x-s-abc123 up -d`,
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
  assert.equal(one(t, "tools/b.sh", "docker build -t testsToDelete-x-img-abc123 .\n").code, 0);
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
  assert.equal(one(t, "tools/d.sh", 'psql -c "DROP DATABASE testsToDelete-x-db-abc123"\n').code, 0);
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

test("3a. the repository's token is a row of the rule's table; the table is the seven rows of this family", () => {
  const table = parseTokenTable(fs.readFileSync(RULE, "utf8"));
  assert.deepEqual(table.header.map((cell) => cell.toLowerCase()), ["token", "family", "repository"]);
  assert.deepEqual(table.rows.map((row) => row.token), ["conventions", "creds", "mcp", "sidecar", "coai", "bench", "qln"]);
  assert.equal(new Set(table.rows.map((row) => row.token)).size, 7);
  for (const row of table.rows) {
    assert.match(row.token, /^[a-z0-9]{2,12}$/);
    assert.equal(row.family, "dew_flow");
  }
  assert.ok(table.rows.some((row) => row.token === REPO_TOKEN));
  assert.deepEqual(tokenFindings(fs.readFileSync(RULE, "utf8"), "conventions"), []);
  assert.deepEqual(tokenFindings(fs.readFileSync(RULE, "utf8"), "qln", undefined, "the code-search product"), [], "qln is a registered token — of the code-search product");
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

test("3a. tokenFindings: no section, no table, two columns, a duplicate, a foreign family, token only in the wrong column", () => {
  assert.equal(tokenFindings("# Rule\n\n## Never\n", "conventions").length, 1, "no ## Tokens section");
  assert.equal(tokenFindings("# Rule\n\n## Tokens\n\nprose only\n", "conventions").length, 1, "no table");
  assert.equal(tokenFindings(table(["| `conventions` | dew_flow |"], "| token | family |"), "conventions").length, 1, "two columns");
  assert.equal(tokenFindings(table(["| `conventions` | dew_flow | the shared-rules repository |", "| `conventions` | dew_flow | the shared-rules repository |"]), "conventions").length, 1, "duplicate");
  assert.equal(tokenFindings(table(["| `conventions` | dew_flow | the shared-rules repository |", "| `other` | elsewhere | b |"]), "conventions").length, 1, "foreign family");
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
  assert.equal(code('execFileSync("docker", ["run", "-d", "--name", "testsToDelete-x-abc123", "img"]);').code, 1, "no --rm");
  assert.equal(code("spawn('docker', ['run', '-d', 'img']);").code, 1, "no --rm, no name");
  assert.equal(code('execFileSync("docker", ["run", "--rm", "-d", "img"]);').code, 0, "--rm");
  assert.equal(code('execFileSync("docker", ["run", "--rm=true", "img"]);').code, 0, "--rm=true");
  assert.equal(code('execFileSync("docker", ["volume", "create", "data"]);').code, 1, "unprefixed volume");
  assert.equal(code('execFileSync("docker", ["network", "create", "web"]);').code, 1, "unprefixed network");
  assert.equal(code('execFileSync("docker", ["volume", "create"]);').code, 1, "unnamed volume");
  assert.equal(code('execFileSync("docker", ["volume", "create", "-d", "local", "web"]);').code, 1, "an option with a value before the name");
  assert.equal(code('execFileSync("docker", ["volume", "create", "testsToDelete-x-data-abc123"]);').code, 0, "a prefixed volume");
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

test("4. the exclusion list is exactly one file", () => {
  assert.deepEqual([...EXCLUDED_FILES], ["tools/leftovers-check.test.mjs"]);
});

test("5. spaces and Unicode survive the migration: the three tests still make such paths", () => {
  const source = (name) => fs.readFileSync(path.join(root, "tools", name), "utf8");
  assert.match(source("rules.test.mjs"), /ownedDir\(t,\s*"rules Unicode пробел"\)/);
  assert.match(source("migrate-rules.test.mjs"), /ownedDir\(t,\s*"migration пробел"\)/);
  assert.match(source("plan-lifecycle.test.mjs"), /ownedDir\(t,\s*"plan-lifecycle "\)/);
});
