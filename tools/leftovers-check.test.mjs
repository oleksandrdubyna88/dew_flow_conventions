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
import { fileURLToPath } from "node:url";

import { git } from "./lib/git.mjs";
import { MAX_CLAIM_BYTES, REPO_ROW, REPO_TOKEN, ownedDir } from "./lib/owned.mjs";
import { EXCLUDED_FILES, LEGACY_NAME_PENDING, isScanned, main, parseArguments, scanRepository, scanText, tokenConstants, tokenFindings, parseTokenTable } from "./leftovers-check.mjs";

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

test("3a. the repository's token is a row of the rule's table; the table is the seven rows of this family", () => {
  const table = parseTokenTable(fs.readFileSync(RULE, "utf8"));
  assert.deepEqual(table.header.map((cell) => cell.toLowerCase()), ["token", "family", "repository"]);
  assert.deepEqual(table.rows.map((row) => row.token), ["conventions", "creds", "mcp", "sidecar", "coai", "bench", "qln"]);
  assert.equal(new Set(table.rows.map((row) => row.token)).size, 7);
  for (const row of table.rows) {
    assert.match(row.token, /^[a-z0-9]{2,12}$/);
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
    assert.match(result.text, new RegExp(`${file.replace(".", "\.")}:1 — owner-blind`), line);
  }
  assert.equal(one(t, "tools/e.sh", `grep -i '^${P}[-_]u1000[-_]' list\n`).code, 0, "an owner after the prefix is not blind");
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

test("2. break-it: one byte changed on the janitor's inventory line makes the guard red until --update-allowlist", (t) => {
  const repo = tree(t, {});
  fs.mkdirSync(path.join(repo, "tools", "fixtures"), { recursive: true });
  const script = fs.readFileSync(path.join(root, JANITOR), "utf8").replace(/\r\n/g, "\n");
  fs.writeFileSync(path.join(repo, JANITOR), script);
  const named = path.join(repo, "tools", "fixtures", "owner-blind-allowlist.json");
  fs.copyFileSync(ALLOWLIST, named);
  fs.writeFileSync(path.join(repo, "tools", "x.test.mjs"), "const a = 1;\n");
  assert.equal(guard(repo).code, 0, guard(repo).text);
  fs.writeFileSync(path.join(repo, JANITOR), script.replace(`GLOB='${P}[-_]*'`, `GLOB='${P}[-_]**'`));
  const red = guard(repo);
  assert.equal(red.code, 1, red.text);
  assert.match(red.text, /janitor\.sh:\d+ — owner-blind/);
  assert.equal(guard(repo, ["--update-allowlist"]).code, 0);
  assert.equal(guard(repo).code, 1, "the scanned tree's own allowlist is never read: the shipped one still pins the old line");
  assert.equal(guard(repo, ["--allowlist", named]).code, 0, "regenerated from the current file, named by the operator");
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
  assert.equal(guard(repo).code, 0, "no allowlist in the scanned tree: the shipped one passes the identical janitor line");
  fs.writeFileSync(path.join(repo, "tools", "fixtures", "owner-blind-allowlist.json"), JSON.stringify({ entries: [] }));
  assert.equal(guard(repo).code, 0, "an empty allowlist in the scanned tree does not remove the shipped pass");
});
