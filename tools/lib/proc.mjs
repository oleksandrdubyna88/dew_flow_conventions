// Running a child process with a ceiling, and killing the whole tree when it is reached.
//
// [common/reliability.md](../../common/reliability.md): "a timed-out child process is a killed child
// process". A timeout that merely stops WAITING leaves an orphan holding the port you are about to
// probe — and on Windows `child.kill()` reaches the shell and none of its children, which is exactly
// the case both callers here have (httpyac under node, a checklist command under a shell).

import { spawn } from "node:child_process";

/** Kill a process and everything it started. `taskkill /T` on Windows, the process group elsewhere. */
export function killTree(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-child.pid, "SIGKILL"); // the group, created by detached: true below
  } catch {
    try { child.kill("SIGKILL"); } catch { /* already gone */ }
  }
}

/**
 * Run a command, capture its output, and stop it at `timeoutMs`.
 *
 * `timedOut` is reported separately from the exit code because they are different facts: a command
 * killed at its ceiling has whatever exit code the kill produced, and reading that as the command's
 * own verdict is the "a timeout is not a cancellation" trap in reliability.md.
 */
export function run(command, args, { cwd, env, timeoutMs = 60_000, shell = false, stdout } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell,
      stdio: ["ignore", stdout ?? "pipe", "pipe"],
      detached: process.platform !== "win32",
    });

    let out = "";
    let err = "";
    child.stdout?.on("data", (chunk) => { out += chunk; });
    child.stderr?.on("data", (chunk) => { err += chunk; });

    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ code: -1, out, err: `${err}${error.message}`, timedOut, spawnFailed: true });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, out, err, timedOut, spawnFailed: false });
    });
  });
}
