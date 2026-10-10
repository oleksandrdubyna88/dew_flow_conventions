// Lowers this process — and every worker it starts — through the shared rules' one implementation
// (common/local-cpu-budget.md). Copied verbatim from the conventions repository's
// tools/templates/lower-priority-preload.mjs; only the MOUNT line differs per repository.
//
//   node --import ./scripts/lower-priority.mjs --test --test-concurrency=8
//
// A mount that is absent is CI's normal state (CI checks no submodule out, and CI is exempt), so it
// lowers nothing — locally it says so once. Anything else, a mount that is present but broken
// included, fails the run loudly: only the intended absence falls back.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MOUNT = new URL("../.agents/conventions/tools/low-priority.mjs", import.meta.url);

if (existsSync(MOUNT)) {
  (await import(MOUNT.href)).lowerOwnPriority();
} else if (!process.env.CI && !process.env.LOW_PRIORITY_PRELOAD_NOTICE) {
  process.env.LOW_PRIORITY_PRELOAD_NOTICE = "1";
  process.stderr.write(`low-priority: ${fileURLToPath(MOUNT)} is absent (git submodule update --init) — this run is NOT lowered\n`);
}
