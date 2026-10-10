#!/usr/bin/env node
/**
 * Run a command at lowered CPU priority, with its exit code, its output and its signals intact.
 *
 *   node <conventions>/tools/low-priority.mjs <command> [args...]
 *
 * <p>The rule is `common/local-cpu-budget.md`; the measurements that chose this method are in
 * `research/2026-10-10_windows_cpu_priority.md`. In one paragraph: a process that lowers ITSELF
 * before it spawns hands that priority to every child and grandchild — Windows passes the
 * BelowNormal and Idle classes to a child created without a class of its own, POSIX passes the nice
 * value through fork — so lowering the wrapper lowers the whole tree, with no race against children
 * that start before somebody gets round to lowering them. `start /belownormal`, the obvious
 * Windows spelling, was measured returning 0 for a child that exited 37, which is why this file
 * exists at all.</p>
 *
 * <p><b>It only ever lowers.</b> A caller already at Idle or nice 19 stays there; raising a priority
 * somebody chose would be this tool overruling them. <b>Under `CI` it lowers nothing</b>: a runner
 * is a dedicated machine with nobody to protect, and the rule exempts CI.</p>
 *
 * <p>No dependencies, deliberately: a consumer mounts this repository as a submodule and must be
 * able to run the file without an `npm ci` inside the mount.</p>
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** BelowNormal on Windows; nice 19 elsewhere — the two levels the record measured. */
export const TARGET = process.platform === "win32" ? os.constants.priority.PRIORITY_BELOW_NORMAL : 19;

/** `CI` set to anything but an explicit false means a CI runner. */
export function isCi(env = process.env) {
  const value = String(env.CI ?? "").trim().toLowerCase();
  return value !== "" && value !== "false" && value !== "0";
}

/**
 * Lower the calling process to {@link TARGET} unless it is already lower, or this is CI.
 * Returns the priority the process ends up at. Higher numbers are LOWER priority on every platform
 * (`os.getPriority` maps Windows' classes onto the nice scale), so "already lower" is `>=`.
 */
export function lowerOwnPriority(env = process.env) {
  const current = os.getPriority(0);
  if (isCi(env) || current >= TARGET) return current;
  os.setPriority(0, TARGET);
  return os.getPriority(0);
}

/** The extensions Windows would try for a bare name, lower-cased, `.exe` first when unset. */
function pathExtensions(env) {
  return String(env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean).map(ext => ext.toLowerCase());
}

/** Find a command the way cmd.exe would: as given if it has a path, otherwise on PATH, with PATHEXT. */
export function resolveWindowsCommand(command, env = process.env, cwd = process.cwd()) {
  const extensions = pathExtensions(env);
  const hasExtension = extensions.includes(path.extname(command).toLowerCase());
  const candidates = name => (hasExtension ? [name] : extensions.map(ext => name + ext));
  const dirs = /[\\/]/.test(command)
    ? [path.resolve(cwd, path.dirname(command))]
    : String(env.PATH ?? env.Path ?? "").split(path.delimiter).filter(Boolean);
  const base = /[\\/]/.test(command) ? path.basename(command) : command;
  for (const dir of dirs) {
    for (const name of candidates(base)) {
      const full = path.join(dir, name);
      try { if (fs.statSync(full).isFile()) return full; } catch { /* not here */ }
    }
  }
  return "";
}

const CMD_META = /([()\][%!^"`<>&|;, *?])/g;

/**
 * Quote one argument for `cmd.exe /d /s /c "…"` running a batch file: the C runtime's quoting
 * first (backslashes before a quote doubled, the quote escaped), then every cmd metacharacter
 * caret-escaped — the quotes included, so cmd never enters a quoted state in which `%` would still
 * expand. A shim re-parses its `%*`, so an argument gets a second round. This is cross-spawn's
 * algorithm, applied more widely: cross-spawn doubles only for node_modules/.bin shims, this file
 * doubles for every batch file (see launchPlan).
 */
export function quoteForCmd(arg, doubleEscape = false) {
  let text = String(arg).replace(/(\\*)"/g, '$1$1\\"').replace(/(\\*)$/, "$1$1");
  text = `"${text}"`.replace(CMD_META, "^$1");
  return doubleEscape ? text.replace(CMD_META, "^$1") : text;
}

/** What to actually start: [file, args, extra spawn options]. */
export function launchPlan(command, args, env = process.env, cwd = process.cwd()) {
  if (command === "node") return [process.execPath, args, {}];
  if (process.platform !== "win32") return [command, args, {}];
  const found = resolveWindowsCommand(command, env, cwd);
  if (!found) return ["", args, {}];
  if (!/\.(cmd|bat)$/i.test(found)) return [found, args, {}];
  // Every batch file is treated as a shim that re-parses its `%*`: npm's own npm.cmd and npx.cmd do,
  // and so does every shim npm writes into node_modules/.bin. A single round of escaping let
  // `with"quote` end the quoted region inside the shim and run `&b` as a command — measured by the
  // shim test. The batch file's own path is parsed once, by the outer cmd.exe.
  const line = [quoteForCmd(found), ...args.map(arg => quoteForCmd(arg, true))].join(" ");
  return [env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `"${line}"`], { windowsVerbatimArguments: true }];
}

const FORWARDED = ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"];

function main(argv) {
  const [command, ...args] = argv;
  if (!command) {
    process.stderr.write("usage: node low-priority.mjs <command> [args...]\n"
      + "Runs <command> at BelowNormal (Windows) / nice 19 (elsewhere); exit code and output are the command's.\n");
    process.exit(2);
  }
  lowerOwnPriority();
  const [file, fileArgs, extra] = launchPlan(command, args);
  if (!file) {
    process.stderr.write(`low-priority: command not found: ${command}\n`);
    process.exit(127);
  }
  // Terminating the wrapper must not orphan anything it started. Off a terminal the child gets a
  // process group of its own, and a signal is passed to the whole group — so `wrapper → npm → test
  // workers` ends together even when the middle process does not pass signals on. On a terminal the
  // child stays in the foreground group (a background group would be stopped the moment it read the
  // TTY), where Ctrl+C reaches every process anyway, and a signal is passed to the child. On Windows
  // a console's Ctrl+C / Ctrl+Break already reaches every attached process, so the wrapper only has
  // to stay alive until the child has finished.
  const ownGroup = process.platform !== "win32" && !process.stdin.isTTY;
  const child = spawn(file, fileArgs, { stdio: "inherit", detached: ownGroup, ...extra });

  const handlers = FORWARDED.map(signal => {
    const handler = () => {
      if (process.platform === "win32") return;
      try { if (ownGroup) process.kill(-child.pid, signal); else child.kill(signal); } catch { /* gone */ }
    };
    try { process.on(signal, handler); } catch { /* signal unsupported on this platform */ }
    return [signal, handler];
  });

  child.on("error", error => {
    process.stderr.write(`low-priority: ${command}: ${error.message}\n`);
    process.exit(error.code === "ENOENT" ? 127 : 126);
  });
  child.on("exit", (code, signal) => {
    for (const [name, handler] of handlers) process.off(name, handler);
    if (signal && process.platform !== "win32") {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

/** Run as a script, not imported: compared through realpath, so a drive-letter case or a junction cannot split them. */
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) main(process.argv.slice(2));
