// Ceilings for the child processes a TEST starts. Imported by tests only (the same standing as lib/idle-chain.mjs);
// no tool reads it.
//
// A test's wall-clock ceiling often also covers the child's own start-up (a contained run starts pwsh, then node),
// and a loaded machine stretches start-up without limit. A ceiling that includes it then measures the machine, not
// the behaviour the test names. Two kinds of call exist and they are treated differently:
//
//  - The child prints NOTHING before the behaviour under test (it ends on its own, git or a CLI answers at
//    completion). There is no start-up signal to widen on, so there is no widening: ONE hang-guard ceiling,
//    GUARD_MS. It is generous because it guards against a hang, never against slowness.
//  - The child prints a readiness line BEFORE the behaviour under test. Only then may a ceiling be widened, and only
//    while that line is absent (start-up not done). `startupBudget(...).run` does that: it tries a small ceiling,
//    widens it while the line has not appeared, spends from ONE total per file, and fails with a distinct message
//    when the total is gone. Each attempt starts a FRESH child; a caller must use a child that holds no state a
//    retry would inherit (a fixture that is re-created per attempt, or none).

import { run } from "./proc.mjs";

/** The one ceiling of a run with no start-up signal: a hang guard. */
export const GUARD_MS = 180_000;

/** Ceilings tried in turn, small first, for a run that has a readiness line. */
export const STARTUP_BUDGETS_MS = [5_000, 30_000, 120_000];

/** The most one test file may spend widening ceilings; past it a permanent start-up regression fails, with its own message. */
export const STARTUP_TOTAL_MS = 300_000;

/** Whether an attempt tested what it was meant to: see `runWhenReady`. A pure function so its edges can be pinned. */
export function isConclusive({ startedAt, budgetMs, ready, timedOut, runwayMs }) {
  if (!Number.isFinite(ready)) return false; // anything that is not a number is "no readiness line"
  return !timedOut || startedAt + budgetMs - ready >= runwayMs;
}

/**
 * @param {{budgets?: number[], totalMs?: number}} [options]
 * @returns {{runWhenReady: Function, spentMs: () => number}}
 */
export function startupBudget({ budgets = STARTUP_BUDGETS_MS, totalMs = STARTUP_TOTAL_MS } = {}) {
  let spent = 0;

  /**
   * Run `command args` with a ceiling, widened only while `readyAt` finds no readiness line.
   *
   * One options object. `readyAt(result)` (required, a function) returns the epoch milliseconds at which the child
   * said it was ready, or anything that is not a number when the line never appeared (the child prints `Date.now()`
   * itself, so readiness is a fact about the child's clock, not about when output reached us). `runwayMs` is how
   * much of the ceiling must remain after readiness for a run that reached its ceiling to count. `timeoutMs`, when
   * given, is the first ceiling tried (the file's wider ceilings still follow it). `run` is the runner, `(command,
   * args, options) => Promise<{timedOut: boolean, ...}>`, proc.mjs's `run` by default; every other option
   * (`containTree`, `maxOutputBytes`, `cwd`, `env`, ...) is handed to it as is, with `timeoutMs` set to the ceiling.
   *
   * An attempt is CONCLUSIVE when the line appeared and either the run ended on its own, or the deadline still left
   * `runwayMs` after readiness. An inconclusive attempt is retried (a fresh child) with the next ceiling; the
   * ceiling under test is therefore never widened on a run that had its full say. Each attempt is billed the lesser
   * of its ceiling and its real elapsed time against the file's total, and nothing is started once the total is gone.
   *
   * Returns `{result, budgetMs, startedAt, readyAt, elapsedMs}` of the conclusive attempt.
   */
  async function runWhenReady(t, command, args, { timeoutMs, readyAt, runwayMs = 0, run: runner = run, ...runOptions } = {}) {
    if (typeof readyAt !== "function") throw new TypeError("runWhenReady needs readyAt, a function from a run result to the child's readiness timestamp");
    const ceilings = timeoutMs === undefined ? budgets : [timeoutMs, ...budgets.filter(budget => budget > timeoutMs)];
    const wallStart = performance.now();
    let anyReady = false;
    let granted = 0;
    for (const ceiling of ceilings) {
      const budgetMs = Math.floor(Math.min(ceiling, totalMs - spent)); // run() takes whole milliseconds, 1 at least
      if (budgetMs < 1) break;
      granted += budgetMs;
      const startedAt = Date.now();
      const begin = performance.now();
      const result = await runner(command, args, { ...runOptions, timeoutMs: budgetMs });
      const elapsedMs = performance.now() - begin;
      spent += Math.ceil(Math.min(budgetMs, elapsedMs)); // whole milliseconds, so the remainder is whole too
      const ready = readyAt(result);
      anyReady ||= Number.isFinite(ready);
      if (isConclusive({ startedAt, budgetMs, ready, timedOut: result.timedOut, runwayMs })) {
        return { result, budgetMs, startedAt, readyAt: ready, elapsedMs };
      }
      t?.diagnostic?.(Number.isFinite(ready)
        ? `readiness line ${startedAt + budgetMs - ready} ms before the ${budgetMs} ms ceiling, under the ${runwayMs} ms runway; widening`
        : `no readiness line within ${budgetMs} ms (start-up not complete); widening`);
    }
    const wallMs = Math.round(performance.now() - wallStart);
    const why = anyReady
      ? `start-up completed but left less than ${runwayMs} ms before the ceiling in every attempt`
      : "start-up never completed — the readiness line never appeared";
    throw new Error(`${why} (ceilings tried: ${granted} ms in total; elapsed wall time: ${wallMs} ms; total cap ${totalMs} ms)`);
  }

  return { runWhenReady, spentMs: () => spent };
}
