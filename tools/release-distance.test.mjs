#!/usr/bin/env node
/**
 * `release-distance.mjs`'s tests.
 *
 * The thing under test is a relationship between two refs on a remote, so the cases build real
 * repositories rather than asserting against hand-made objects. The one thing a fixture could not
 * express at all is the case this check exists for: a `release` that is WEEKS old, which needs a
 * commit with a backdated committer date.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { EXIT, measure } from "./release-distance.mjs";

const git = (cwd, ...args) =>
  execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", timeout: 20000, windowsHide: true }).trim();

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "release-distance-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString();

/**
 * A remote with `main` some commits deep. `release` is left unset; each case pushes it where it
 * wants. `ageDays` backdates every commit, which is how the age bound is exercised at all.
 */
function scene(t, { commits = 3, ageDays = 0 } = {}) {
  const root = workspace(t);
  const url = path.join(root, "conventions.git").replaceAll("\\", "/");
  execFileSync("git", ["init", "-q", "--bare", "--initial-branch=main", url], { timeout: 20000 });
  const work = path.join(root, "work");
  execFileSync("git", ["clone", "-q", url, work], { timeout: 20000 });

  const shas = [];
  for (let i = 0; i < commits; i += 1) {
    const when = daysAgo(ageDays);
    execFileSync("git", ["-C", work,
      "-c", "user.name=Distance test", "-c", "user.email=d@example.invalid", "-c", "commit.gpgsign=false",
      "commit", "-q", "--allow-empty", "-m", `commit ${i}`,
    ], { timeout: 20000, env: { ...process.env, GIT_AUTHOR_DATE: when, GIT_COMMITTER_DATE: when } });
    shas.push(git(work, "rev-parse", "HEAD"));
  }
  git(work, "push", "-q", "origin", "main");

  // An unrelated history, for the divergence case: a commit that shares no ancestor with main.
  const orphanDir = path.join(root, "orphan");
  execFileSync("git", ["clone", "-q", url, orphanDir], { timeout: 20000 });
  git(orphanDir, "checkout", "-q", "--orphan", "elsewhere");
  execFileSync("git", ["-C", orphanDir,
    "-c", "user.name=Distance test", "-c", "user.email=d@example.invalid", "-c", "commit.gpgsign=false",
    "commit", "-q", "--allow-empty", "-m", "unrelated",
  ], { timeout: 20000 });
  const orphan = git(orphanDir, "rev-parse", "HEAD");
  git(orphanDir, "push", "-q", "origin", "elsewhere");
  // `publish` pushes from `work`, which has never seen that object — without this the push fails
  // with "bad object", a fixture fault that looks nothing like the divergence being tested.
  git(work, "fetch", "-q", "origin", "elsewhere");

  const clone = path.join(root, "runner");
  execFileSync("git", ["clone", "-q", url, clone], { timeout: 20000 });
  return {
    shas,
    orphan,
    raw: (...args) => git(clone, ...args),
    publish: (sha) => git(work, "push", "-q", "-f", "origin", `${sha}:refs/heads/release`),
    measure: (bounds) => measure((...args) => git(clone, ...args), bounds),
  };
}

test("a release at main's tip is within bounds", (t) => {
  const s = scene(t, { commits: 3 });
  s.publish(s.shas.at(-1));
  const verdict = s.measure();
  assert.equal(verdict.code, EXIT.WITHIN, verdict.headline);
  assert.equal(verdict.commits, 0);
});

test("an ordinary quiet week does not fire", (t) => {
  // The check must not nag. A release a few commits behind, published recently, is a deliberate
  // state — and a check that fires on that is one people switch off.
  const s = scene(t, { commits: 5 });
  s.publish(s.shas[0]);
  const verdict = s.measure();
  assert.equal(verdict.code, EXIT.WITHIN, verdict.headline);
  assert.equal(verdict.commits, 4);
});

test("a release too many commits behind main FAILS, and says why that is not a summary", (t) => {
  const s = scene(t, { commits: 6 });
  s.publish(s.shas[0]);
  const verdict = s.measure({ maxCommits: 2 });
  assert.equal(verdict.code, EXIT.PAST, verdict.headline);
  assert.match(verdict.headline, /release has stopped moving/);
  assert.match(verdict.lines.join("\n"), /5 commits ahead of release \(limit 2\)/);
  assert.match(verdict.lines.join("\n"), /every pin-check is green/);
});

test("a release whose commit is old FAILS even when main has barely moved", (t) => {
  // The case the whole file exists for, and the one distance alone would miss: nothing is being
  // written AND nothing is being published, so every consumer is green on rules nobody has touched.
  const s = scene(t, { commits: 2, ageDays: 90 });
  s.publish(s.shas.at(-1));
  const verdict = s.measure({ maxDays: 30 });
  assert.equal(verdict.code, EXIT.PAST, verdict.headline);
  assert.match(verdict.lines.join("\n"), /release points at is 90 days old \(limit 30\)/);
  assert.equal(verdict.commits, 0, "distance alone would have called this healthy");
});

test("no release yet is not a fault, and says so in those words", (t) => {
  // Before the first promotion there is nothing to be behind. Worth stating, because "not published
  // yet" and "publishing has stopped" look identical from a consumer's side and only one is fine.
  const s = scene(t, { commits: 2 });
  const verdict = s.measure();
  assert.equal(verdict.code, EXIT.WITHIN, verdict.headline);
  assert.match(verdict.headline, /release does not exist yet/);
  assert.match(verdict.lines.join("\n"), /nothing has been published/i);
});

test("a remote that cannot be reached is UNDECIDED, not a distance of zero", (t) => {
  const root = workspace(t);
  const clone = path.join(root, "repo");
  execFileSync("git", ["init", "-q", "--initial-branch=main", clone], { timeout: 20000 });
  const verdict = measure((...args) => git(clone, ...args));
  assert.equal(verdict.code, EXIT.UNDECIDED, verdict.headline);
});

test("a release that is not an ancestor of main is divergence, not a small distance", (t) => {
  // The ref has no server-side protection (README records that as accepted), so it CAN be moved by
  // hand to something unrelated. `rev-list release..main` then counts only main-side commits and can
  // answer a small number, and a recently force-moved ref passes the age bound too — so both metrics
  // report health while what consumers load is not on main's history at all.
  const s = scene(t, { commits: 3 });
  s.publish(s.orphan);
  const verdict = s.measure();
  assert.equal(verdict.code, EXIT.PAST, verdict.headline);
  assert.match(verdict.headline, /release is not on main/);
  assert.match(verdict.lines.join("\n"), /neither metric means anything/);
});

test("a fetch that fails is UNDECIDED, not a measurement of stale refs", (t) => {
  // The refs resolve, so the absent-release branch is not taken; the fetch is what breaks. Without
  // this the tool could go on to measure whatever the clone happened to have, and report a distance
  // computed from refs nobody refreshed.
  const s = scene(t, { commits: 2 });
  s.publish(s.shas[0]);
  const verdict = measure((...args) => {
    if (args[0] === "fetch") throw Object.assign(new Error("fatal: unable to access"), { stderr: "fatal: unable to access" });
    return s.raw(...args);
  });
  assert.equal(verdict.code, EXIT.UNDECIDED, verdict.headline);
  assert.match(verdict.headline, /fetch failed/);
});
