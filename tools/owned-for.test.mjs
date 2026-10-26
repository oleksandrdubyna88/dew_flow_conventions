#!/usr/bin/env node
/**
 * `ownedFor({ token, row })` of `lib/owned.mjs` (story S8, decision 11 of `todo/PLAN_test_leftovers_merged_core.md`): the helper of
 * `common/test-leftovers.md` §2 bound to ANOTHER repository's token, so a consumer wraps the shipped file instead of porting it.
 *
 * What these tests prove, and what they do not: the names, the sweep pattern and the room a `what` has are asked of the bound API
 * and of this repository's plain exports on the same inputs; nothing here runs another repository's sweep. Every folder a test makes
 * under a consumer token lives in a PRIVATE parent made by `ownedDir` of this repository, so no `testsToDelete-<owner>-sso-…` name
 * is ever a leftover in the shared temp root.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";

import { git } from "./lib/git.mjs";
import * as owned from "./lib/owned.mjs";
import { ID_LENGTH, MAX_NAME, OWNER_GRAMMAR, PREFIX, REPO_ROW, REPO_TOKEN, cleanupScope, ownedDir, ownedFor, ownedName, ownedPattern, readOwner, thisOwnerToken } from "./lib/owned.mjs";

const OWNER = thisOwnerToken();
const COMMIT = ["-c", "user.name=Owned for test", "-c", "user.email=owned@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-qm", "fixture"];
/** The functions whose behaviour depends on the token — the six that name or match a resource of THIS repository. */
const BOUND = ["ownedPrefix", "ownedPattern", "legacyPattern", "ownedName", "ownedDir", "ownedWorktree"];

test("ownedFor: a name carries the consumer's token, not this repository's", () => {
  const sso = ownedFor({ token: "sso", row: "the sso service" });
  assert.equal(sso.token, "sso");
  assert.equal(sso.row, "the sso service");
  assert.equal(sso.ownedPrefix("pg"), `${PREFIX}${OWNER}-sso-pg-`);
  assert.match(sso.ownedName("pg"), new RegExp(`^${PREFIX}${OWNER}-sso-pg-[A-Za-z0-9]{${ID_LENGTH}}$`));
  assert.notEqual(sso.ownedName("pg"), sso.ownedName("pg"), "an id is drawn each time");
});

test("ownedFor: the pattern of a consumer refuses this repository's names and another owner's, and the other way round", () => {
  const sso = ownedFor({ token: "sso" });
  const mine = `${PREFIX}${OWNER}-sso-pg-abc123`;
  assert.ok(sso.ownedPattern().test(mine));
  assert.ok(sso.ownedPattern().test(mine.toLowerCase()), "case-insensitive, as the rule says");
  assert.ok(sso.ownedPattern().test(`teststodelete_${OWNER}_sso_pg_abc123`), "the SQL spelling");
  assert.ok(!sso.ownedPattern().test(`${PREFIX}${OWNER}-${REPO_TOKEN}-pg-abc123`), "a conventions name is not an sso name");
  assert.ok(!sso.ownedPattern().test(`${PREFIX}u1-sso-pg-abc123`) || OWNER === "u1", "another owner's name");
  assert.ok(!sso.ownedPattern("u1").test(mine) || OWNER === "u1", "an explicit owner narrows to that owner");
  assert.ok(!sso.ownedPattern().test(`${PREFIX}${OWNER}-ssox-pg-abc123`), "a longer token is not this token");
  assert.ok(!ownedPattern().test(mine), "and this repository's pattern refuses the consumer's name");
  assert.ok(sso.legacyPattern().test(`${PREFIX}sso-pg-abc123`), "the legacy form names the consumer's token");
  assert.ok(!sso.legacyPattern().test(`${PREFIX}${REPO_TOKEN}-pg-abc123`));
  assert.throws(() => sso.ownedPattern("conventions"), TypeError, "an owner that is not of the grammar is refused");
});

test("ownedFor: the room a `what` has is budgeted under the consumer's token", () => {
  const sso = ownedFor({ token: "sso" });
  const room = MAX_NAME - `${PREFIX}${OWNER}-sso-`.length - 1 - ID_LENGTH;
  assert.equal(sso.ownedName("a".repeat(room)).length, MAX_NAME);
  assert.throws(() => sso.ownedName("a".repeat(room + 1)), /the whole name would pass 63 characters/);
  assert.throws(() => ownedName("a".repeat(room + 1)), /the whole name would pass 63 characters/, "a longer token has less room: this repository's is eight characters longer");
  assert.throws(() => sso.ownedPrefix("a/b"), TypeError);
  assert.throws(() => sso.ownedPrefix("-x"), TypeError);
});

test("ownedFor: a bad token or row throws a TypeError that names the legal shape", () => {
  for (const token of ["SSO", "u12", "w1", "u1234567890", "x", "a".repeat(13), "ss-o", "ss_o", "", undefined, null, 5, {}]) {
    assert.throws(() => ownedFor({ token }), (error) => error instanceof TypeError && /\[a-z0-9\]\{2,12\}/.test(error.message) && /owner/.test(error.message), JSON.stringify(token));
  }
  assert.throws(() => ownedFor(), TypeError);
  assert.throws(() => ownedFor({}), TypeError);
  for (const row of ["", "  ", 5, "a\nb"]) assert.throws(() => ownedFor({ token: "sso", row }), TypeError, JSON.stringify(row));
  for (const token of ["u1a", "ab", "a".repeat(12), "s5o", "u12345678901"]) assert.doesNotThrow(() => ownedFor({ token }), token);
  assert.ok(OWNER_GRAMMAR.test("u12") && !OWNER_GRAMMAR.test("u1a"), "the grammar these tokens are judged against");
});

test("ownedFor: a folder under a consumer token is claimed first, named by the token and removed with its claim", async (t) => {
  const parent = ownedDir(t, "for-parent");
  const scope = cleanupScope();
  const sso = ownedFor({ token: "sso" });
  const dir = sso.ownedDir(scope, "pgdata", { parent });
  const name = dir.split(/[\\/]/).at(-1);
  assert.match(name, new RegExp(`^${PREFIX}${OWNER}-sso-pgdata-[A-Za-z0-9]{${ID_LENGTH}}$`));
  assert.ok(fs.statSync(dir).isDirectory());
  assert.ok(sso.ownedPattern().test(name));
  assert.equal(readOwner(dir, "folder").owner, OWNER, "the claim beside it names the caller");
  assert.ok(fs.existsSync(`${dir}.owner`));
  await scope.close();
  assert.ok(!fs.existsSync(dir) && !fs.existsSync(`${dir}.owner`), "the scope removed the folder and its claim");
});

test("ownedFor: a worktree under a consumer token is locked with the run's record and removed with its scope", async (t) => {
  const parent = ownedDir(t, "for-wt-parent");
  const repo = ownedDir(t, "for-wt-repo");
  git(repo, "init", "-q");
  git(repo, ...COMMIT);
  const scope = cleanupScope();
  const sso = ownedFor({ token: "sso" });
  const worktree = sso.ownedWorktree(scope, repo, "wt", { parent });
  const name = worktree.path.split(/[\\/]/).at(-1);
  assert.match(name, new RegExp(`^${PREFIX}${OWNER}-sso-wt-[A-Za-z0-9]{${ID_LENGTH}}$`));
  assert.equal(readOwner(worktree.path, "worktree").owner, OWNER, "the lock reason is the record");
  await scope.close();
  assert.ok(!fs.existsSync(worktree.path));
});

test("ownedFor: this repository's own token through ownedFor and the plain exports agree on the same inputs", () => {
  const same = ownedFor({ token: REPO_TOKEN, row: REPO_ROW });
  for (const what of ["a", "pg-data", "x".repeat(24)]) assert.equal(same.ownedPrefix(what), owned.ownedPrefix(what), what);
  for (const owner of [undefined, "u7", "w4294967295"]) {
    assert.equal(same.ownedPattern(owner).source, owned.ownedPattern(owner).source, String(owner));
    assert.equal(same.ownedPattern(owner).flags, owned.ownedPattern(owner).flags);
  }
  assert.equal(same.legacyPattern().source, owned.legacyPattern().source);
  assert.equal(same.ownedName("n").replace(/[A-Za-z0-9]{6}$/, ""), owned.ownedName("n").replace(/[A-Za-z0-9]{6}$/, ""));
  for (const what of ["a".repeat(80), "", "a/b", "-a"]) {
    const message = (fn) => { try { fn(); } catch (error) { return `${error.constructor.name}: ${error.message}`; } return "no throw"; };
    assert.equal(message(() => same.ownedPrefix(what)), message(() => owned.ownedPrefix(what)), JSON.stringify(what));
  }
  assert.equal(same.token, REPO_TOKEN);
  assert.equal(same.row, REPO_ROW);
});

test("ownedFor: the bound API holds every function of the module; the six that depend on the token are bound, the rest are the module's own", () => {
  const sso = ownedFor({ token: "sso" });
  const functions = Object.entries(owned).filter(([name, value]) => typeof value === "function" && name !== "ownedFor");
  assert.ok(functions.length > 30, "the module's functions were enumerated: " + functions.length);
  for (const [name, fn] of functions) {
    assert.equal(typeof sso[name], "function", `${name} is part of the bound API`);
    if (BOUND.includes(name)) assert.notEqual(sso[name], fn, `${name} is bound to the token`);
    else assert.equal(sso[name], fn, `${name} does not depend on the token and is the module's own`);
  }
  for (const name of BOUND) assert.ok(functions.some(([found]) => found === name), `${name} is a function of the module`);
});

test("ownedFor: the plain exports stay bound to this repository, whatever was bound before", () => {
  ownedFor({ token: "sso" });
  assert.match(ownedName("x"), new RegExp(`^${PREFIX}${OWNER}-${REPO_TOKEN}-x-`));
  assert.equal(owned.ownedPrefix("x"), `${PREFIX}${OWNER}-${REPO_TOKEN}-x-`);
});
