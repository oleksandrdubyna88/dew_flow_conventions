// Running the real-process "already lower" case of tools/low-priority.test.mjs, and explaining why it failed.
//
// A process at the Idle class gets no CPU while anything at a higher class wants the core, so a chain of
// Idle-class node processes can take as long as the machine stays busy. This helper gives the chain a
// ceiling, kills the WHOLE tree at it (tools/lib/proc.mjs — by pid: a job object on Windows, the process
// group elsewhere, never by image name), and keeps "starved" apart from every other way a run can fail.

import { run } from "./proc.mjs";

/**
 * Run `command args` with a ceiling of `budgetMs` and report it the way `child_process.spawnSync` does:
 * `{status, signal, error, stdout, stderr}`. The ceiling being reached is `error.code === "ETIMEDOUT"` and
 * nothing else is; a process that could not start is `error.code` = the reason; a kill is `status === -1`.
 */
export async function runChain(command, args, { budgetMs, env } = {}) {
  const result = await run(command, args, { env, timeoutMs: budgetMs, containTree: true });
  const error = (result.timedOut && { code: "ETIMEDOUT" })
    || (result.spawnFailed && { code: result.spawnError })
    || undefined;
  return { status: error ? null : result.code, signal: null, error, stdout: result.out, stderr: result.err };
}

/**
 * The failure message for a chain that did not exit 0. Starvation is claimed ONLY for the ceiling being
 * reached; a spawn error or a signal says what it was, because "starved" for an `ENOENT` sends the reader
 * to the wrong place.
 */
export function chainFailure(result, budgetMs) {
  const tail = result.stderr ? `\n${result.stderr}` : "";
  if (result.error?.code === "ETIMEDOUT") {
    return `the Idle-class chain was starved of CPU: no answer within ${budgetMs} ms (ETIMEDOUT); the tree was killed${tail}`;
  }
  if (result.error) {
    return `the chain could not be run: ${result.error.code ?? "unknown"} ${result.error.message ?? ""}`.trimEnd() + tail;
  }
  if (result.signal) return `the chain was ended by signal ${result.signal}${tail}`;
  return `the chain exited with status ${result.status}${tail}`;
}
