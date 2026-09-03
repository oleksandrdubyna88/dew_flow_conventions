#!/usr/bin/env node
/**
 * The tools' own tests. `node --test tools/` from this repository's root, or run this file directly.
 *
 * Two obligations from [common/testing.md](../common/testing.md) shape what is here:
 *
 *  - **A scan that matches nothing passes forever.** `http-coverage.mjs` is a regex over source text,
 *    so it has a companion test asserting it still finds a KNOWN route — including the one the
 *    fixture formats across three lines, which is precisely what a line-by-line scan would lose.
 *  - **A fixture the code rejects proves nothing.** The end-to-end cases run the real tools against
 *    `fixtures/repo`, whose right answers are known, rather than asserting against hand-made objects
 *    the tools have never seen.
 *
 * The one thing NOT covered here is `http-run.mjs` end to end, because that needs httpyac installed
 * and this repository has no API to install it for. Its two decision points are covered as units:
 * the JUnit reader and the environment-versus-contract verdict, which is where every judgement it
 * makes actually lives. The exit codes themselves are exercised in the first repository that adopts
 * a suite — said plainly rather than left as an assumed gap.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { filterByTag, parseHttpFile, requestPath } from "./lib/http-files.mjs";
import { parseJUnit, verdict } from "./lib/junit.mjs";
import { pathsMatch, scanRoutes } from "./http-coverage.mjs";
import { inspect, parseTable } from "./post-deploy-check.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureRepo = path.join(here, "fixtures", "repo");
const httpFixture = fs.readFileSync(path.join(fixtureRepo, "http", "vault", "vault.http"), "utf8");
const sourceFixture = fs.readFileSync(path.join(fixtureRepo, "src", "VaultEndpoints.cs"), "utf8");

function runTool(tool, args, cwd = fixtureRepo) {
  const result = spawnSync(process.execPath, [path.join(here, tool), ...args], { cwd, encoding: "utf8" });
  return { code: result.status, out: `${result.stdout}${result.stderr}` };
}

// ── .http parsing ────────────────────────────────────────────────────────────────────────────────

test("a request block is found with its name, its tags and its verb", () => {
  const blocks = parseHttpFile(httpFixture).filter((b) => !b.isPrelude);
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].name, "vault_get_returns_the_callers_blob");
  assert.ok(blocks[0].tags.has("prod"));
  assert.equal(blocks[0].request.method, "GET");
  assert.ok(!blocks[1].tags.has("prod"));
});

test("an @uncovered declaration is read as a declaration, never as a request", () => {
  const blocks = parseHttpFile(httpFixture);
  const declared = blocks.flatMap((b) => b.uncovered);
  assert.equal(declared.length, 1);
  assert.match(declared[0], /^503 —/);
  assert.ok(blocks.every((b) => b.uncovered.length === 0 || b.request === null));
});

test("filtering by tag keeps the file's prelude, so the surviving requests keep their variables", () => {
  const filtered = filterByTag(httpFixture, "prod");
  assert.match(filtered, /@contentType = application\/json/);
  assert.match(filtered, /vault_get_returns_the_callers_blob/);
  assert.doesNotMatch(filtered, /vault_put_replaces_the_blob/);
});

test("filtering by a tag nothing carries returns nothing, not a prelude that looks like a suite", () => {
  assert.equal(filterByTag(httpFixture, "smoke"), "");
});

test("a request path loses its host, its variables and its query, and keeps its segments", () => {
  assert.equal(requestPath("{{baseUrl}}/api/vault?limit=5"), "/api/vault");
  assert.equal(requestPath("https://host:5001/api/vault"), "/api/vault");
  assert.equal(requestPath("{{baseUrl}}/api/items/{{id}}/history"), "/api/items/{}/history");
  assert.equal(requestPath("not-a-path"), "");
});

// ── the JUnit reader, which is where http-run.mjs's judgement lives ───────────────────────────────

const junit = (cases) =>
  `<?xml version="1.0"?><testsuites><testsuite name="s">${cases}</testsuite></testsuites>`;

test("a document that is not a report is INVALID, never an empty pass", () => {
  assert.equal(parseJUnit("").valid, false);
  assert.equal(parseJUnit("Error: connect ECONNREFUSED 127.0.0.1:5875").valid, false);
  assert.equal(parseJUnit(junit("")).valid, false); // zero cases exercised nothing
});

test("a report with no failures passes", () => {
  const report = parseJUnit(junit('<testcase name="health" />'));
  assert.equal(report.valid, true);
  assert.equal(verdict(report).outcome, "pass");
});

test("an assertion failure is a CONTRACT regression", () => {
  const report = parseJUnit(junit(
    '<testcase name="vault_get"><failure message="AssertionError: expected 200 to equal 404" /></testcase>'));
  assert.equal(verdict(report).outcome, "contract");
});

test("a refused connection is an ENVIRONMENT failure — the API was never exercised", () => {
  const report = parseJUnit(junit(
    '<testcase name="vault_get"><error message="RequestError: connect ECONNREFUSED 127.0.0.1:5875" /></testcase>'));
  assert.equal(verdict(report).outcome, "environment");
});

test("one real assertion failure among connection errors is still a contract regression", () => {
  const report = parseJUnit(junit(
    '<testcase name="a"><error message="connect ECONNREFUSED" /></testcase>' +
    '<testcase name="b"><failure message="AssertionError: shape" /></testcase>'));
  const outcome = verdict(report);
  assert.equal(outcome.outcome, "contract");
  assert.equal(outcome.environmental.length, 1);
  assert.equal(outcome.contractual.length, 1);
});

test("a script block's own ReferenceError is environmental — a broken test, not a broken API", () => {
  const report = parseJUnit(junit(
    '<testcase name="a"><error message="ReferenceError: reponse is not defined" /></testcase>'));
  assert.equal(verdict(report).outcome, "environment");
});

// ── the route scan, and the companion test that keeps it honest ──────────────────────────────────

test("the scan finds every route in the fixture, the one formatted across lines included", () => {
  const routes = scanRoutes(sourceFixture);
  const named = routes.map((r) => `${r.method} ${r.path}`);
  assert.deepEqual(named.sort(), [
    "DELETE /api/vault/{id}",
    "GET /api/vault",
    "PUT /api/vault",
  ]);
});

test("the scan reads an axum route with the method from its handler", () => {
  const routes = scanRoutes('let app = Router::new().route("/health", get(health_probe));');
  assert.deepEqual(routes.map((r) => `${r.method} ${r.path}`), ["GET /health"]);
});

test("a placeholder matches a value, on either side, and a shorter path does not match", () => {
  assert.ok(pathsMatch("/api/vault/{id}", "/api/vault/abc-123"));
  assert.ok(pathsMatch("/api/vault/abc", "/api/vault/{}"));
  assert.ok(pathsMatch("/files/{*rest}", "/files/a/b/c"));
  assert.ok(!pathsMatch("/api/vault/{id}", "/api/vault"));
  assert.ok(!pathsMatch("/api/vault", "/api/team"));
});

test("http-coverage names the route the fixture suite does not cover, and fails", () => {
  const { code, out } = runTool("http-coverage.mjs", []);
  assert.equal(code, 1);
  assert.match(out, /MISSING\s+DELETE \/api\/vault\/\{id\}/);
  assert.match(out, /2\/3 route\(s\) covered/);
  assert.match(out, /1 @uncovered declaration/);
});

test("--warn reports the same finding and exits 0 — the state a repository adopts in", () => {
  const { code, out } = runTool("http-coverage.mjs", ["--warn"]);
  assert.equal(code, 0);
  assert.match(out, /MISSING/);
});

// ── POST_DEPLOY.md, shape and run ────────────────────────────────────────────────────────────────

const table = (rows) =>
  ["Target: x", "Last verified: 2026-09-03 · x · 1", "",
    "| # | What a person loses | Check | Auto |", "|---|---|---|---|", ...rows].join("\n");

test("the fixture checklist is well shaped: two items, one of them automated", () => {
  const { findings, items } = inspect(fs.readFileSync(path.join(fixtureRepo, "POST_DEPLOY.md"), "utf8"));
  assert.deepEqual(findings, []);
  assert.equal(items.length, 2);
  assert.equal(items.filter((i) => !i.manual).length, 1);
});

test("the thirteenth item is a finding, because the cap is a number and not an adjective", () => {
  const rows = Array.from({ length: 13 }, (_, i) => `| ${i + 1} | loses a thing | \`true\` | auto |`);
  const { findings } = inspect(table(rows));
  assert.equal(findings.length, 1);
  assert.match(findings[0], /13 items — the cap is 12/);
});

test("a missing stamp is a finding — a list nobody has run is the same as no list", () => {
  const { findings } = inspect("Target: x\n\n| # | What a person loses | Check | Auto |\n|---|---|---|---|\n| 1 | a thing | `true` | auto |");
  assert.equal(findings.length, 1);
  assert.match(findings[0], /Last verified/);
});

test("an item that claims to be automated and holds no command is a finding", () => {
  const { findings } = inspect(table(["| 1 | a thing | check it somehow | auto |"]));
  assert.equal(findings.length, 1);
  assert.match(findings[0], /holds no `command`/);
});

test("an item that says neither auto nor manual is a finding", () => {
  const { findings } = inspect(table(["| 1 | a thing | `true` | sometimes |"]));
  assert.match(findings.join(" "), /neither "auto" nor "manual"/);
});

test("the table reader finds the table under prose, and only its rows", () => {
  const { headers, rows } = parseTable(table(["| 1 | a | `true` | auto |", "| 2 | b | x | manual |"]));
  assert.equal(headers.length, 4);
  assert.equal(rows.length, 2);
});

test("the target reaches a command as an environment variable, and a wrong one FAILS the run", () => {
  const pass = runTool("post-deploy-check.mjs", ["--target", "ok"]);
  assert.equal(pass.code, 0);
  assert.match(pass.out, /PASS {2}1\./);
  assert.match(pass.out, /MANUAL {2}2\./);

  const fail = runTool("post-deploy-check.mjs", ["--target", "not-the-fixture-target"]);
  assert.equal(fail.code, 1);
  assert.match(fail.out, /FAIL {2}1\./);
  assert.match(fail.out, /The deploy is not done/);
});

test("without --target the check is structural only and executes nothing", () => {
  const { code, out } = runTool("post-deploy-check.mjs", []);
  assert.equal(code, 0);
  assert.match(out, /shape OK/);
  assert.doesNotMatch(out, /PASS|FAIL/);
});

test("a missing checklist is a finding, and --warn is how a repository adopts", () => {
  const empty = fs.mkdtempSync(path.join(process.env.TEMP ?? "/tmp", "pdc-"));
  try {
    assert.equal(runTool("post-deploy-check.mjs", [], empty).code, 1);
    assert.equal(runTool("post-deploy-check.mjs", ["--warn"], empty).code, 0);
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});

// ── http-run.mjs's configuration refusals ────────────────────────────────────────────────────────

test("a tag no request carries is a configuration error, never an empty pass", () => {
  const { code, out } = runTool("http-run.mjs", ["--tag", "nothing-carries-this"]);
  assert.equal(code, 4);
  assert.match(out, /no request in http carries "# @nothing-carries-this"/);
});

test("a missing suite is a configuration error that names where the requests belong", () => {
  const { code, out } = runTool("http-run.mjs", ["no-such-tree"]);
  assert.equal(code, 4);
  assert.match(out, /http-contracts\.md puts the requests in http\/<group>\//);
});

test("httpyac absent is a configuration error carrying the pinned install command", () => {
  const { code, out } = runTool("http-run.mjs", []);
  assert.equal(code, 4);
  assert.match(out, /npm install --save-dev httpyac@\d+\.\d+\.\d+/);
});
