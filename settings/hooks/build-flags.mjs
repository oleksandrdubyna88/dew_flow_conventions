#!/usr/bin/env node
/**
 * Refuse a .NET build command that does not bound its own worker pool.
 *
 * <p>Copied verbatim into each consumer as `.claude/hooks/build-flags.mjs` and wired by
 * `settings/settings.json` as a `PreToolUse` hook on the shell tools, exactly like
 * `load-instructions.mjs`. It enforces the half of `csharp/dotnet-build.md` that no file can
 * enforce.</p>
 *
 * <p><b>Why a hook and not a line in the rule.</b> Measured 2026-09-11: `-nr:false` can be delivered
 * by `Directory.Build.rsp`, but `-m` cannot — `dotnet build` injects its own `-maxcpucount` and the
 * command line beats the response file, so `-m:4` in a file leaves the peak at eleven workers and
 * 1232 MB, exactly the control. The only place `-m` works is the command line, and on this machine
 * the command line is written by five autonomous sessions at once. That is precisely the shape of
 * rule that decays quietly, and this repository's answer to that shape is a check.</p>
 *
 * <p><b>It only ever refuses; it never rewrites.</b> A denial comes back to the model with the flag
 * to add, which costs one retry. Any internal error allows the command: a hook that fails closed on
 * its own bug would stop every build in the family, which is a worse outcome than the one it
 * prevents.</p>
 */

/**
 * The verbs that open a worker pool.
 *
 * <p>`restore` is in the list because it was measured, not assumed: on the same 12-project solution
 * `dotnet restore` with no flags peaked at <b>11 workers and retained all 11</b> — identical to a
 * full build. The first draft of this hook exempted it on the reasoning that restore does not
 * compile, which is true and irrelevant; the pool is opened to evaluate the projects, not to compile
 * them. `dotnet test` is deliberately absent: this family does not run it at all
 * (`common/testing.md`), and policing a forbidden command belongs to that rule, not this one.</p>
 */
const BUILD_VERB = /(^|[\s"'([{&|;])(dotnet\s+(build|msbuild|publish|pack|restore)|msbuild(\.exe)?)([\s"')\]}]|$)/i;

/** Any spelling of the switch that bounds the pool, including `-m 4` with a space. */
const HAS_MAX_CPU = /(^|\s)(-{1,2}|\/)(m|maxcpucount)([:=]\s*\d+|\s+\d+)/i;

/**
 * One shell command per element, so `git commit -m "x" && dotnet build` is judged on the segment
 * that actually builds. Without this split the `-m` of an unrelated command satisfies the check —
 * `git commit -m` being the obvious one, and the one a session runs all day.
 */
function segments(command) {
  return String(command).split(/&&|\|\||[;|\n]/);
}

/** The reason to refuse, or an empty string when there is nothing to say. */
export function buildFlagsRefusal(command) {
  const offending = segments(command).find(part => BUILD_VERB.test(part) && !HAS_MAX_CPU.test(part));
  if (!offending) return "";
  return (
    "csharp/dotnet-build.md: this build does not bound its worker pool. Add -m:4 (or the number this "
    + "repository sets) to the command:\n\n    " + offending.trim() + " -m:4\n\n"
    + "Measured on this family's machine: without it one build peaks at 11 MSBuild workers and 1222 MB, "
    + "with it 3 workers and 365 MB, and it is no slower. Several sessions build here at once, so the "
    + "peaks add up — 72 workers holding 10.7 GB is what this prevents. -m cannot be put in "
    + "Directory.Build.rsp or an environment variable; the command line is the only place it works."
  );
}

/** Read the hook payload from stdin. */
async function payload() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

if (process.argv[1]?.endsWith("build-flags.mjs")) {
  try {
    const input = await payload();
    const refusal = buildFlagsRefusal(input?.tool_input?.command ?? "");
    if (refusal) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: refusal,
        },
      }));
    }
  } catch {
    // Allow. See the class comment: this hook must never be the reason a build cannot run.
  }
  process.exit(0);
}
