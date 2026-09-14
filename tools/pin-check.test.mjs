#!/usr/bin/env node
/**
 * `pin-check.mjs`'s own tests — and until 2026-09-14 it had none, while
 * [.github/workflows/ci.yml](../.github/workflows/ci.yml) said in a comment that it "tests itself
 * against tools/fixtures". It does not, and did not: every change to the one file six repositories
 * run in CI shipped on a green build that never executed it.
 *
 * There are no checked-in fixtures here, deliberately. The thing under test is a statement about
 * two repositories — *is this pin the tip of the ref it tracks* — and a directory of files cannot
 * express "a release branch that lags its own default branch". So each case builds real Git
 * repositories in a temp directory.
 *
 * The gitlink is written with `update-index --cacheinfo` rather than `git submodule add`, for two
 * reasons. `pin-check` never reads the submodule's CONTENTS — only `rev-parse HEAD:<path>`,
 * `config -f .gitmodules` and `ls-remote` — so cloning one would test something the tool does not
 * do. And Git ≥ 2.38 refuses local-path submodule clones without `protocol.file.allow`, which is a
 * trap this file has no reason to walk into.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const tool = path.join(here, "pin-check.mjs");

const git = (cwd, ...args) =>
  execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", timeout: 20000, windowsHide: true }).trim();

/** Run the real tool in a repository, the way a consumer's CI step runs it. */
function run(cwd) {
  const result = spawnSync(process.execPath, [tool], { cwd, encoding: "utf8", timeout: 30000 });
  return { code: result.status, out: `${result.stdout}${result.stderr}` };
}

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pin-check-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

/**
 * A bare remote with two commits on its default branch and `release` left at the FIRST — the shape
 * the whole release-ref design exists to produce: a published version deliberately behind the tip.
 */
function remote(root, name, defaultBranch = "main") {
  // Forward slashes: a backslash is an ESCAPE inside a .gitmodules value, so a Windows path written
  // verbatim there is `fatal: bad config line`, which looks like a tool bug and is not one.
  const url = path.join(root, `${name}.git`).replaceAll("\\", "/");
  execFileSync("git", ["init", "-q", "--bare", `--initial-branch=${defaultBranch}`, url], { timeout: 20000 });
  const work = path.join(root, `${name}-work`);
  execFileSync("git", ["clone", "-q", url, work], { timeout: 20000 });
  const commit = (message) =>
    git(work, "-c", "user.name=Pin test", "-c", "user.email=pin@example.invalid", "-c", "commit.gpgsign=false",
      "commit", "-q", "--allow-empty", "-m", message);
  commit("published");
  const release = git(work, "rev-parse", "HEAD");
  commit("written since");
  const tip = git(work, "rev-parse", "HEAD");
  git(work, "push", "-q", "origin", defaultBranch);
  git(work, "push", "-q", "origin", `${release}:refs/heads/release`);
  return { url, release, tip };
}

/** A consumer: one commit carrying a gitlink per mount, plus the `.gitmodules` that describes it. */
function consumer(root, name, mounts) {
  const repo = path.join(root, name);
  execFileSync("git", ["init", "-q", "--initial-branch=main", repo], { timeout: 20000 });
  const lines = [];
  for (const mount of mounts) {
    lines.push(`[submodule "${mount.path}"]`, `\tpath = ${mount.path}`, `\turl = ${mount.url}`);
    if (mount.branch) lines.push(`\tbranch = ${mount.branch}`);
    git(repo, "update-index", "--add", "--cacheinfo", `160000,${mount.pin},${mount.path}`);
  }
  fs.writeFileSync(path.join(repo, ".gitmodules"), `${lines.join("\n")}\n`);
  git(repo, "add", ".gitmodules");
  git(repo, "-c", "user.name=Pin test", "-c", "user.email=pin@example.invalid", "-c", "commit.gpgsign=false",
    "commit", "-q", "-m", "pinned");
  return repo;
}

test("a pin at the release tip passes while the default branch has moved on", t => {
  // THE point of the change. Against the pre-2026-09-14 tool this fails with STALE, because it
  // compared every pin against `ls-remote <url> HEAD` — the live default-branch tip — so a
  // deliberately published older version was indistinguishable from drift.
  const root = workspace(t);
  const rules = remote(root, "conventions");
  const repo = consumer(root, "app", [{ path: ".agents/conventions", url: rules.url, branch: "release", pin: rules.release }]);
  const { code, out } = run(repo);
  assert.equal(code, 0, out);
  assert.match(out, /OK — 1 pin\(s\) at the tip of the ref each tracks/);
  assert.match(out, /\.agents\/conventions → release/);
});

test("a pin BEHIND the release it tracks is stale, and the fix line names update --remote", t => {
  // The teeth. Freezing the ref must not mean the check stopped checking.
  const root = workspace(t);
  const rules = remote(root, "conventions");
  git(path.join(root, "conventions-work"), "push", "-q", "-f", "origin", `${rules.tip}:refs/heads/release`);
  const repo = consumer(root, "app", [{ path: ".agents/conventions", url: rules.url, branch: "release", pin: rules.release }]);
  const { code, out } = run(repo);
  assert.equal(code, 1, out);
  assert.match(out, /STALE \.agents\/conventions/);
  assert.match(out, /git submodule update --remote \.agents\/conventions/);
});

test("a submodule with no branch key is judged against the remote's default branch, exactly as before", t => {
  // The backward-compatibility guarantee, asserted rather than argued: five consumers declare no
  // branch on the day this lands, and git's own default for an unset key IS the remote HEAD.
  const root = workspace(t);
  const code2 = remote(root, "library");
  const atTip = consumer(root, "at-tip", [{ path: "external/library", url: code2.url, pin: code2.tip }]);
  assert.equal(run(atTip).code, 0, run(atTip).out);
  assert.match(run(atTip).out, /external\/library → the default branch/);

  const behind = consumer(root, "behind", [{ path: "external/library", url: code2.url, pin: code2.release }]);
  const result = run(behind);
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /STALE external\/library/);
});

test("a default branch that is not called main still resolves", t => {
  const root = workspace(t);
  const rules = remote(root, "conventions", "trunk");
  const repo = consumer(root, "app", [{ path: "mount", url: rules.url, pin: rules.tip }]);
  const { code, out } = run(repo);
  assert.equal(code, 0, out);
});

test("a rules pin on release and two code pins on their own defaults are judged separately", t => {
  // dew_flow_rag_qln's literal shape, and the one configuration this rollout must not break: its
  // two CODE pins keep following their own tips while the rules pin beside them follows `release`.
  const root = workspace(t);
  const rules = remote(root, "conventions");
  const mcp = remote(root, "mcp");
  const bench = remote(root, "bench");
  const repo = consumer(root, "rag", [
    { path: ".claude/rules/shared", url: rules.url, branch: "release", pin: rules.release },
    { path: "external/mcp", url: mcp.url, pin: mcp.tip },
    { path: "external/bench", url: bench.url, pin: bench.tip },
  ]);
  const { code, out } = run(repo);
  assert.equal(code, 0, out);
  assert.match(out, /3 pin\(s\)/);
  assert.match(out, /\.claude\/rules\/shared → release/);
  assert.match(out, /external\/mcp → the default branch/);
});

test("a branch the remote does not have is NO SUCH REF, never a silent OK", t => {
  // `git ls-remote` answers exit 0 and an EMPTY body for a pattern that matches nothing. Read as a
  // tip, that empty string makes every pin look stale against a blank sha; read as a miss, it is
  // the one thing it can be — a name that is not there.
  const root = workspace(t);
  const rules = remote(root, "conventions");
  const repo = consumer(root, "app", [{ path: "mount", url: rules.url, branch: "not-cut-yet", pin: rules.tip }]);
  const { code, out } = run(repo);
  assert.equal(code, 1, out);
  assert.match(out, /NO SUCH REF mount/);
  assert.match(out, /has no refs\/heads\/not-cut-yet/);
  assert.doesNotMatch(out, /STALE/);
});

test("an unreachable remote is a WARN, and the run still exits 0", t => {
  // Preserved promise: offline local runs stay usable; CI runners have the network.
  const root = workspace(t);
  const repo = consumer(root, "app", [
    // Any well-formed sha: the remote is never reached, so nothing resolves it. Not all-zeroes,
    // which git refuses outright as a gitlink ("cache entry has null sha1").
    { path: "mount", url: path.join(root, "absent.git").replaceAll("\\", "/"), pin: "b".repeat(40) },
  ]);
  const { code, out } = run(repo);
  assert.equal(code, 0, out);
  assert.match(out, /WARN cannot reach/);
});

test("a repository with no .gitmodules has nothing to check, and says so", t => {
  const root = workspace(t);
  const repo = path.join(root, "plain");
  execFileSync("git", ["init", "-q", "--initial-branch=main", repo], { timeout: 20000 });
  const { code, out } = run(repo);
  assert.equal(code, 0, out);
  assert.match(out, /no \.gitmodules/);
});

test("the pin is read from the commit, not the index", t => {
  // README's Editing discipline says so and nothing tested it: after `update --remote` + `add`, the
  // check still reports STALE until the commit exists, because the pin is what a clone gets. Do not
  // read that first STALE as a second failure and start debugging the bump.
  const root = workspace(t);
  const rules = remote(root, "conventions");
  const repo = consumer(root, "app", [{ path: "mount", url: rules.url, branch: "release", pin: rules.tip }]);
  assert.equal(run(repo).code, 1, "staged at the wrong sha, and not yet committed");
  git(repo, "update-index", "--cacheinfo", `160000,${rules.release},mount`);
  assert.equal(run(repo).code, 1, "the index now holds the right sha, but the commit does not");
  git(repo, "-c", "user.name=Pin test", "-c", "user.email=pin@example.invalid", "-c", "commit.gpgsign=false",
    "commit", "-q", "-m", "bump");
  assert.equal(run(repo).code, 0, "and only the commit makes it green");
});

test("a .gitmodules path that is not a gitlink is a finding, not a crash", t => {
  // A half-added submodule, or a typo in `path`. Named, rather than thrown: a raw git stderr dump
  // is not something a reader can act on, and `git mv` of a mount leaves exactly this shape behind.
  const root = workspace(t);
  const rules = remote(root, "conventions");
  const repo = consumer(root, "app", [{ path: "mount", url: rules.url, branch: "release", pin: rules.release }]);
  fs.appendFileSync(path.join(repo, ".gitmodules"),
    `[submodule "ghost"]\n\tpath = ghost\n\turl = ${rules.url}\n`);
  git(repo, "add", ".gitmodules");
  git(repo, "-c", "user.name=Pin test", "-c", "user.email=pin@example.invalid", "-c", "commit.gpgsign=false",
    "commit", "-q", "-m", "declare a mount that was never added");
  const { code, out } = run(repo);
  assert.equal(code, 1, out);
  assert.match(out, /NO SUCH REF ghost/);
  assert.match(out, /not committed as a submodule at that path/);
});
