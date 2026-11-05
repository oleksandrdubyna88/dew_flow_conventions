#!/usr/bin/env node
/**
 * The barrier's scan (`common/test-leftovers.md`, *The barrier*): which owner-blind sweepers are still enabled on this machine?
 *
 *     node tools/sweeper-scan.mjs [--root <dir>] [--system] [--honour-marker]
 *
 * User scope by default: the caller's checkouts and worktrees under `--root` (default: the current folder), the caller's crontab,
 * the caller's systemd user units, and — on Windows — the caller's scheduled tasks, read directly (`schtasks /query /fo csv /v`,
 * then `Get-ScheduledTask` through PowerShell). `--system` (an administrator) adds /etc/crontab, /etc/cron*, /var/spool/cron,
 * /etc/systemd/system and every home. It deletes nothing and runs no sweep.
 *
 * Exit 0: nothing found and everything read. 1: owner-blind lines or scheduled sweeps were found. 2: anything in the requested
 * scope could not be read (an unqueryable Task Scheduler included), or nothing was scanned — the barrier stays CLOSED until a
 * person records an attestation for what the scan could not see. 2 outranks 1: unread evidence is never "nothing found", and
 * the findings are printed either way.
 *
 * `--honour-marker` (transition only) lets a line that carries `not-a-sweeper` pass: a sibling rule repository still writes that
 * marker on its own detector lines. Without it no comment clears a line here, exactly as in the guard.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { loadAllowlist } from "./leftovers-check.mjs";
import { scanSweepers } from "./lib/sweeper-scan.mjs";

const USAGE = "usage: node tools/sweeper-scan.mjs [--root <dir>] [--system] [--honour-marker]";
const clean = (text) => String(text).replace(/[^\x20-\x7e]/g, "?"); // a path or a line is text somebody else wrote: no escape reaches the terminal

/** `{ root, system, honourMarker }` or `{ error }`. */
export function parseArguments(argv) {
  const options = { root: process.cwd(), system: false, honourMarker: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--system") options.system = true;
    else if (argv[index] === "--honour-marker") options.honourMarker = true;
    else if (argv[index] === "--root" && argv[index + 1] !== undefined) options.root = path.resolve(argv[(index += 1)]);
    else return { error: `unknown or incomplete argument \`${clean(argv[index])}\`` };
  }
  return options;
}

/** The allowlist shipped beside this tool and no other: nothing inside the scanned evidence configures a machine-wide control. */
const allowlistFor = () => loadAllowlist();

/** The exit code. `deps` (`run`, `platform`, `home`) are seams for tests. */
export function main(argv = process.argv.slice(2), io = { out: (text) => console.log(text), err: (text) => console.error(text) }, deps = {}) {
  const options = parseArguments(argv);
  if (options.error !== undefined) {
    io.err(`sweeper-scan: ${options.error}\n${USAGE}`);
    return 2;
  }
  let allowlist;
  try {
    allowlist = allowlistFor();
  } catch (error) {
    io.err(`sweeper-scan: ${clean(error.message)}`);
    return 2;
  }
  const result = scanSweepers({ ...options, allowlist, ...deps });
  for (const entry of result.findings) io.out(`${clean(entry.path)}:${entry.line} — ${entry.reason}`);
  for (const entry of result.unreadable) io.err(`unreadable: ${clean(entry.path)} — ${clean(entry.why)}`);
  if (result.unreadable.length > 0) {
    io.err(`sweeper-scan: ${result.unreadable.length} place(s) could not be read — the barrier stays closed until a person attests for them`);
    return 2;
  }
  if (result.files === 0 && result.findings.length === 0) {
    io.err("sweeper-scan: scanned nothing — discovery broke; this is not a clean machine");
    return 2;
  }
  if (result.findings.length > 0) {
    io.err(`sweeper-scan: ${result.findings.length} owner-blind sweeper line(s) — the barrier is closed`);
    return 1;
  }
  io.out(`sweeper-scan: none found (${result.files} file(s) read) — the barrier is open for this scope`);
  return 0;
}

const invokedDirectly = (() => {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (invokedDirectly) process.exitCode = main();
