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
 *   node tools/run-tests.mjs [extra node --test arguments...]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { lowerOwnPriority } from "./low-priority.mjs";

/** The family cap. */
export const CAP = 8;

/** `node --test`'s worker count for a machine with `threads` hardware threads: its own default, never above the cap. */
export function testConcurrency(threads = availableParallelism()) {
  return Math.max(1, Math.min(CAP, threads - 1));
}

function main(extra) {
  lowerOwnPriority();
  const result = spawnSync(process.execPath, ["--test", `--test-concurrency=${testConcurrency()}`, ...extra], { stdio: "inherit" });
  if (result.error) {
    process.stderr.write(`run-tests: ${result.error.message}\n`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

const invokedDirectly = (() => {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (invokedDirectly) main(process.argv.slice(2));
