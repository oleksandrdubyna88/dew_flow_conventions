#!/usr/bin/env node
// build-flags-check.mjs — a .NET repository actually carries the build-flags policy.
//
// Enforces csharp/dotnet-build.md. That rule exists because five autonomous sessions building at
// once cannot reuse each other's MSBuild workers, so every concurrent build opens its own pool:
// measured 2026-09-11 at 72 worker processes holding 10 775 MB on a 44 GB machine, beside Postgres,
// Docker and a running e2e suite.
//
// Only half of the policy can live in a file, and this checks that half is really there and really
// says what it must:
//
//   * `Directory.Build.rsp` at the repository root containing `-nr:false` — the response file is
//     found by walking up from the PROJECT being built, so the root covers every invocation.
//   * NO `-m` in that file. Measured: `-m:4` in a response file leaves the peak at 11 workers /
//     1232 MB, exactly the control, because `dotnet build` injects its own `-maxcpucount` and the
//     command line beats the response file. A file that carries `-m` is a file that lies about what
//     it is doing, which is worse than not having one.
//   * NO `-noautorsp` in a workflow. It suppresses the response file ENTIRELY, so a runner that
//     reaches for it to widen a build silently discards `-nr:false` too — and it never needs to,
//     because the command line already wins.
//
// Run from a consumer repository root:  node .agents/conventions/tools/build-flags-check.mjs
// A repository with no C# in it passes without an opinion.

import fs from "node:fs";
import path from "node:path";

const SKIP = new Set([".git", "node_modules", "bin", "obj", "artifacts", "parity", ".vs", "packages", "dist", "coverage", ".next"]);
const PROJECT = /\.(csproj|slnx|sln)$/i;
// `-{1,2}|/` in both, and that is not cosmetic: the hook accepts `--maxcpucount:8` as a real switch
// and has a test saying so. A checker that read only a single dash let an rsp carrying the inert
// `--maxcpucount:4` pass as clean, and called a correct `--nodeReuse:false` file unswitched — two
// halves of one rule disagreeing about the syntax they both police.
const NODE_REUSE_OFF = /^(-{1,2}|\/)(nr|nodereuse):false$/i;
const MAX_CPU = /^(-{1,2}|\/)(m|maxcpucount)(:|=|$)/i;
// Every spelling dotnet accepts, and the reason the `-{1,2}` is not decoration: `--noAutoResponse`
// is the form people write, and a single-dash pattern misses it while looking correct.
const NO_AUTO_RESPONSE = /(^|[\s"'([{&|;])(-{1,2}|\/)no-?auto-?(rsp|response)\b/i;

/**
 * Every C# project or solution in the repository, submodules excluded.
 *
 * <p>A filesystem walk rather than `git ls-files`: a project added but not yet staged is still a
 * project this policy governs, and the index is not the question being asked. A nested directory
 * with its own `.git` is a submodule and belongs to its own repository's check.</p>
 */
function projectFiles(root, dir = root, found = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    // A subtree this process cannot read still leaves the response file answerable, and a checker
    // that throws EACCES is a red CI step that says nothing about the policy.
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue;
      if (dir !== root && fs.existsSync(path.join(full, ".git"))) continue;
      projectFiles(root, full, found);
    } else if (PROJECT.test(entry.name)) {
      found.push(path.relative(root, full));
    }
  }
  return found;
}

/** The switches a response file actually supplies, comments and blank lines removed. */
function responseSwitches(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"))
    .flatMap(line => line.split(/\s+/));
}

function workflowFiles(root) {
  const dir = path.join(root, ".github", "workflows");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => /\.ya?ml$/i.test(name))
    .map(name => path.join(".github", "workflows", name));
}

/**
 * Findings for one repository root. Empty means the policy is in place — or that there is no C#
 * here at all, which `isDotnet` distinguishes for the caller.
 */
export function buildFlagsFindings(root) {
  const projects = projectFiles(root);
  if (projects.length === 0) return { isDotnet: false, findings: [] };

  const findings = [];
  const rsp = path.join(root, "Directory.Build.rsp");

  if (!fs.existsSync(rsp)) {
    findings.push(
      `Directory.Build.rsp is missing from the repository root, and ${projects.length} C# project(s) build here `
      + `(${projects[0]}${projects.length > 1 ? ", …" : ""}). Create it with one line: -nr:false`);
  } else if (!fs.statSync(rsp).isFile()) {
    // A directory (or anything else) under that name reads as EISDIR and would crash the check —
    // and it holds no switches, so the policy is as absent as if the file were missing.
    findings.push("Directory.Build.rsp at the repository root is not a file. It must be a text file whose "
      + "first line is -nr:false");
  } else {
    const switches = responseSwitches(fs.readFileSync(rsp, "utf8"));
    if (!switches.some(flag => NODE_REUSE_OFF.test(flag))) {
      findings.push(
        "Directory.Build.rsp does not switch node reuse off. It must contain -nr:false, spelled exactly, "
        + `on its own line. Found: ${switches.length ? switches.join(" ") : "(nothing)"}`);
    }
    const maxCpu = switches.find(flag => MAX_CPU.test(flag));
    if (maxCpu) {
      findings.push(
        `Directory.Build.rsp carries ${maxCpu}, which is measured to do nothing — dotnet build injects its own `
        + "-maxcpucount and the command line beats the response file. Remove it and put -m:N on the build command.");
    }
  }

  for (const file of workflowFiles(root)) {
    if (NO_AUTO_RESPONSE.test(fs.readFileSync(path.join(root, file), "utf8"))) {
      findings.push(
        `${file} suppresses the response file, which discards -nr:false with it. Pass -m:N on the command line `
        + "instead — it already overrides the file.");
    }
  }

  return { isDotnet: true, findings };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("build-flags-check.mjs")) {
  const root = process.cwd();
  const { isDotnet, findings } = buildFlagsFindings(root);
  if (!isDotnet) {
    console.log("build-flags-check: no C# project or solution here — nothing to check.");
    process.exit(0);
  }
  if (findings.length === 0) {
    console.log("build-flags-check: OK — the response file is present and says -nr:false.");
    process.exit(0);
  }
  console.error("build-flags-check: FAILED — csharp/dotnet-build.md is not in place here.\n");
  for (const finding of findings) console.error(`  * ${finding}`);
  process.exit(1);
}
