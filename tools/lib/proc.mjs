// Running a child process with a ceiling, and killing the whole tree when it is reached.
//
// [common/reliability.md](../../common/reliability.md): "a timed-out child process is a killed child
// process". A timeout that merely stops WAITING leaves an orphan holding the port you are about to
// probe — and on Windows `child.kill()` reaches the shell and none of its children, which is exactly
// the case both callers here have (httpyac under node, a checklist command under a shell).

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const contained = Symbol("job supervisor");

/** Kill a process and everything it started. `taskkill /T` on Windows, the process group elsewhere. */
export function killTree(child) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    if (child[contained]) { child.kill(); return; } // Closing the supervisor closes its job.
    if (child.exitCode !== null) return;
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
export function run(command, args, { cwd, env, timeoutMs = 60_000, shell = false, stdout,
  maxOutputBytes = 4 * 1024 * 1024, containTree = false, signal } = {}) {
  if (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes < 1 || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error("Process timeout and output budget must be positive integers");
  }
  if (containTree && shell) throw new Error("Contained processes require exe and argv, not a shell");
  const useJob = containTree && process.platform === "win32";
  // PowerShell 7 is the supported Windows host; execution policy is never overridden.
  const actualCommand = useJob ? "pwsh.exe" : command;
  const actualArgs = useJob ? ["-NoProfile", "-NonInteractive", "-File",
    fileURLToPath(new URL("./process-job.ps1", import.meta.url)), "-Request",
    Buffer.from(JSON.stringify({command,args})).toString("base64")] : args;
  return new Promise((resolve) => {
    const child = spawn(actualCommand, actualArgs, {
      cwd,
      env,
      shell,
      stdio: ["ignore", stdout ?? "pipe", "pipe"],
      detached: process.platform !== "win32",
      windowsHide: true,
    });
    child[contained] = useJob;

    const output = {out:[],err:[]};
    let captured = 0, overflow = false, cancelled = false;
    const capture = (name, chunk) => {
      const room = Math.max(0, maxOutputBytes - captured);
      if (room) output[name].push(chunk.subarray(0,room));
      captured += Math.min(room,chunk.length);
      if (chunk.length > room && !overflow) { overflow = true; killTree(child); }
    };
    child.stdout?.on("data", chunk => capture("out",chunk));
    child.stderr?.on("data", chunk => capture("err",chunk));

    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, timeoutMs);
    const cancel = () => { cancelled = true; killTree(child); };
    signal?.addEventListener("abort",cancel,{once:true});
    if (signal?.aborted) cancel();
    let spawnError;
    child.on("error", error => { spawnError = error; });
    // A child can exit with descendants still holding its pipes. End our process group now.
    if (containTree && !useJob) child.on("exit", () => killTree(child));
    child.on("close", code => {
      clearTimeout(timer);
      signal?.removeEventListener("abort",cancel);
      resolve({ code: overflow || cancelled || timedOut ? -1 : code ?? -1,
        out: Buffer.concat(output.out).toString("utf8"),
        err: Buffer.concat(output.err).toString("utf8"),
        timedOut, overflow, cancelled, spawnFailed: !!spawnError,
        ...(spawnError ? {spawnError:spawnError.code ?? "spawn failed"} : {}) });
    });
  });
}
