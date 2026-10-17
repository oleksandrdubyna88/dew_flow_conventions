// Running the real-process "already lower" case of tools/low-priority.test.mjs, and explaining why it failed.
//
// A process at the Idle class gets no CPU while anything at a higher class wants the core, so a chain of
// Idle-class node processes can take as long as the machine stays busy. This helper gives the chain a
// ceiling, kills the WHOLE tree at it (tools/lib/proc.mjs — by pid: a job object on Windows, the process
// group elsewhere, never by image name), and keeps "starved" apart from every other way a run can fail.

import { MAX_TIMER_MS, run } from "./proc.mjs";

/**
 * Run `command args` with a ceiling of `budgetMs` and report it the way `child_process.spawnSync` does:
 * `{status, signal, error, stdout, stderr}`.
 *
 * - `budgetMs` is required and must be a positive safe integer no larger than `MAX_TIMER_MS` (a timer clamps more to 1 ms); anything else is a `TypeError`, never a
 *   silent fall back to `run()`'s own default.
 * - `maxOutputBytes` is passed to `run()` as is; omitted, `run()`'s own cap applies.
 * - `error.code` is `"ETIMEDOUT"` when the ceiling was reached (and for nothing else), `"EOVERFLOW"` when
 *   the output cap was, or the reason a process could not start. In each case `status` is null.
 * - A process ended by a signal has `status === null` and `signal` set.
 *
 * Every outcome except a spawn failure has ended the whole tree: `run()` runs it contained.
 */
export async function runChain(command, args, { budgetMs, env, maxOutputBytes } = {}) {
  if (!Number.isSafeInteger(budgetMs) || budgetMs < 1 || budgetMs > MAX_TIMER_MS) {
    throw new TypeError(`runChain needs budgetMs as a positive safe integer of at most ${MAX_TIMER_MS}, got ${String(budgetMs)}`);
  }
  const result = await run(command, args, { env, timeoutMs: budgetMs, containTree: true, ...(maxOutputBytes === undefined ? {} : { maxOutputBytes }) });
  const error = (result.timedOut && { code: "ETIMEDOUT" })
    || (result.overflow && { code: "EOVERFLOW" })
    || (result.spawnFailed && { code: result.spawnError })
    || undefined;
  const signal = result.signal ?? null;
  return { status: error || signal ? null : result.code, signal, error, stdout: result.out, stderr: result.err };
}

/**
 * The failure message for a result of {@link runChain} that did not exit 0. It describes what runChain
 * emits and nothing wider: those results guarantee the tree was contained, so "the tree was killed" is
 * true of them. Starvation is claimed ONLY for the ceiling being reached; an overflow, a spawn error and a
 * signal each say what they were, because "starved" for an `ENOENT` sends the reader to the wrong place.
 */
export function chainFailure(result, budgetMs) {
  const tail = result.stderr ? `\n${result.stderr}` : "";
  if (result.error?.code === "ETIMEDOUT") {
    return `the Idle-class chain was starved of CPU: no answer within ${budgetMs} ms (ETIMEDOUT); the tree was killed${tail}`;
  }
  if (result.error?.code === "EOVERFLOW") {
    return `the chain's output exceeded the capture limit; the tree was killed (EOVERFLOW)${tail}`;
  }
  if (result.error) return `the chain could not be run: ${result.error.code}${tail}`;
  if (result.signal) return `the chain was ended by signal ${result.signal}${tail}`;
  return `the chain exited with status ${result.status}${tail}`;
}
