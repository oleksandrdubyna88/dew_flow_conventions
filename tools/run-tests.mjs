#!/usr/bin/env node
/**
 * This repository's own `npm test`: `node --test` at lowered priority with a worker cap that never RAISES a
 * small machine — the shape `common/local-cpu-budget.md` §1 asks of a runner script.
 *
 * <p>The first version was `node tools/low-priority.mjs node --test --test-concurrency=8`, and CI measured what
 * the rule now says: `--test-concurrency` is exact, so the 4-vCPU runner went from node's 3 workers to 8, and
 * `tools · selftest` from 13 s to 21 s (single runs, 2026-10-09 against 2026-10-11). A runner script can compute
 * `min(8, CPUs - 1)`, which is node's own default wherever that is already at most 8.</p>
 *
 * <p>Before the suite starts, `runWithSweep` collects what a KILLED earlier run could not clean up
 * (`lib/leftovers-sweep.mjs`, rule §4 of `common/test-leftovers.md`). It reports on one line and never changes the
 * exit code: the suite's own is the only verdict.</p>
 *
 * <p>Two roots, never one. `REPO_ROOT` is this checkout and nothing else — it never follows the environment, so
 * every importer that reads it (a test making a worktree of "this repository") gets the real one. The repository the
 * SWEEP serves is `sweepRepoRoot()`: this checkout by default, because the worktrees it may remove are the ones its
 * own `git worktree list` names. `RUN_TESTS_REPO_ROOT` points the sweep at another repository instead and
 * exists for ONE reader: the test that runs this file as a child. That test must sweep a disposable repository,
 * because this checkout's worktree list is shared with every test running beside it — a young prefixed worktree
 * another test made a moment ago changed the report from `preserved 1` to `preserved 2` and failed the suite on a
 * loaded machine (2026-10-15). Empty means unset; a relative value is resolved against the working directory. `sweepRepoRoot()` reads the variable when it is
 * called, so the seam is visible at one place only: the default of `runWithSweep`'s `repo`.</p>
 *
 *   node tools/run-tests.mjs [extra node --test arguments...]
 *   RUN_TESTS_REPO_ROOT=<dir> node tools/run-tests.mjs [...]     (test seam: the sweep serves <dir>; REPO_ROOT does not change)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { availableParallelism } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sweepLeftovers } from "./lib/leftovers-sweep.mjs";
import { exitCodeFor, lowerOwnPriority } from "./low-priority.mjs";

/** The checkout this runner belongs to. Always — the environment never changes it (see `sweepRepoRoot`). */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The repository whose worktrees the sweep may remove: `REPO_ROOT`, or `RUN_TESTS_REPO_ROOT` when set (a test seam; empty is unset). */
export function sweepRepoRoot(env = process.env) {
  return env.RUN_TESTS_REPO_ROOT ? path.resolve(env.RUN_TESTS_REPO_ROOT) : REPO_ROOT;
}

/** The family cap. */
export const CAP = 8;

/** `node --test`'s worker count for a machine with `threads` hardware threads: its own default, never above the cap. */
export function testConcurrency(threads = availableParallelism()) {
  return Math.max(1, Math.min(CAP, threads - 1));
}

/** The argument list of the one `node --test` this runner starts. */
export function testArgs(extra = [], threads = availableParallelism()) {
  return ["--test", `--test-concurrency=${testConcurrency(threads)}`, ...extra];
}

/**
 * The environment of the one `node --test` this runner starts: a COPY of `env` with git's automatic maintenance
 * switched off for every git process of the run, through git's own environment config (`GIT_CONFIG_COUNT`,
 * `GIT_CONFIG_KEY_<n>`, `GIT_CONFIG_VALUE_<n>`). One entry, `maintenance.auto=false`, is appended after the entries
 * already there; a missing or invalid count reads as 0, and no existing slot is overwritten. `env` is never mutated.
 *
 * <p>Why: after a commit git starts `git maintenance run --auto --quiet --detach`, a DETACHED background process the
 * fixture never asked for. Its worktree-prune task deletes a hand-made `.git/worktrees/<name>` that has no `gitdir`
 * file (measured with git 2.53.0). Seen as a CI failure of janitor test 22a at ca4b266 (2026-10-27): `mkfifo` found
 * its folder gone a moment after the test made it. That the maintenance was the cause on the runner is not proven;
 * that it can do this is. The variable is a request to git, and the suite's own test observes that it takes effect
 * (`low-priority.test.mjs`).</p>
 */
export function testEnv(env = process.env) {
  const raw = env.GIT_CONFIG_COUNT ?? "";
  const count = /^[0-9]{1,6}$/.test(raw) ? Number(raw) : 0;
  return {
    ...env,
    GIT_CONFIG_COUNT: String(count + 1),
    [`GIT_CONFIG_KEY_${count}`]: "maintenance.auto",
    [`GIT_CONFIG_VALUE_${count}`]: "false",
  };
}

/**
 * Run the suite and return the exit code to leave with: the child's own, or 128 + the signal's number when a
 * signal ended it, never a plain 1 that a caller could not tell from a failing test. `spawn` is a seam for tests.
 */
export function runTests(extra = [], spawn = spawnSync) {
  const result = spawn(process.execPath, testArgs(extra), { stdio: "inherit", env: testEnv() });
  if (result.error) {
    process.stderr.write(`run-tests: ${result.error.message}\n`);
    return 1;
  }
  return exitCodeFor(result.status, result.signal);
}

/** The sweep's one report line, then what it lists (`foreign:`, `legacy:`, `unmarked:`), then one line per error; nothing at all when the sweep found nothing. */
function reportSweep({ removed, preserved, errors, listed = [] }) {
  if (removed.length + preserved.length + errors.length + listed.length === 0) return;
  process.stderr.write(`run-tests: leftovers — removed ${removed.length}, preserved ${preserved.length}
`);
  for (const line of listed) process.stderr.write(`run-tests: ${line}
`);
  for (const error of errors) process.stderr.write(`run-tests: leftovers error: ${error}
`);
}

/**
 * Sweep, then run the suite. A sweep that throws is one stderr line; the exit code is the suite's either way.
 * `sweep` and `spawn` are seams for tests.
 */
export function runWithSweep(extra = [], { spawn = spawnSync, sweep = sweepLeftovers, repo = sweepRepoRoot() } = {}) {
  try {
    reportSweep(sweep({ repo }));
  } catch (error) {
    process.stderr.write(`run-tests: leftovers sweep failed (${error?.message ?? error})\n`);
  }
  return runTests(extra, spawn);
}

const invokedDirectly = (() => {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  lowerOwnPriority();
  process.exit(runWithSweep(process.argv.slice(2)));
}
