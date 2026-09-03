#!/usr/bin/env node
/**
 * Run a repository's `.http` contract suite and answer with an EXIT CODE, not a log tail.
 *
 * Enforces [common/http-contracts.md](../common/http-contracts.md). Ported from the frozen
 * `ClaudeRag` prototype (`tools/http-smoke/`), whose value was never the httpyac invocation — it was
 * the three things around it, each of which had to be learnt:
 *
 *   1. The verdict is a code. `0` pass · `1` CONTRACT REGRESSION · `3` environment · `4` configuration
 *      · `5` no valid report. "Read the code, not the log tail" exists because a run whose stack never
 *      started prints pages of red that say nothing about the API.
 *   2. A report you did not just produce proves nothing. The previous one is deleted before the run
 *      and the new one must exist, parse, and contain test cases — otherwise exit `5`, which means
 *      INCONCLUSIVE and never "probably fine".
 *   3. `--all` is mandatory: without it httpyac can drop into an interactive region picker and hang a
 *      headless run forever. `--name` is silently ignored whenever `--all` is passed, so selecting a
 *      subset is done by choosing FILES — which is why `--tag` materialises a filtered tree instead.
 *
 * Usage (from a repository root):
 *
 *     node .claude/rules/shared/tools/http-run.mjs [path] [options]
 *
 *       path                 tree holding the .http files (default: http)
 *       --target <url>       base url, handed to httpyac as --var baseUrl=<url>
 *       --tag <name>         run only requests carrying "# @<name>" (e.g. prod)
 *       --require-env <NAME> refuse to start unless this variable is set; repeatable
 *       --var name=value     an extra variable (repeatable)
 *       --env <name>         httpyac environment name
 *       --timeout <ms>       per-request timeout (default 60000)
 *       --wall-timeout <ms>  ceiling for the whole run (default 900000)
 *       --artifacts <dir>    report + logs (default .http-artifacts)
 *       --bail               stop at the first failure
 *       -v, --verbose        print the failing cases' messages in full
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";
import { parseArgs } from "node:util";

import { filterByTag, findHttpFiles } from "./lib/http-files.mjs";
import { parseJUnit, verdict } from "./lib/junit.mjs";
import { run } from "./lib/proc.mjs";

const EXIT = { ok: 0, contractRegression: 1, environmentFailure: 3, configurationError: 4, noValidReport: 5 };

/** The httpyac version this runner was written against; named in the install hint, never assumed. */
const KNOWN_GOOD = "6.16.7";

const options = {
  target: { type: "string" },
  tag: { type: "string" },
  "require-env": { type: "string", multiple: true, default: [] },
  var: { type: "string", multiple: true, default: [] },
  env: { type: "string" },
  timeout: { type: "string", default: "60000" },
  "wall-timeout": { type: "string", default: "900000" },
  artifacts: { type: "string", default: ".http-artifacts" },
  bail: { type: "boolean", default: false },
  verbose: { type: "boolean", short: "v", default: false },
};

function log(line = "") {
  console.log(line);
}

/**
 * Locate httpyac's own entry script.
 *
 * Resolved through the package rather than through `node_modules/.bin`, and then run with `node`:
 * the `.bin` shim on Windows is a `.cmd`, which recent Node refuses to spawn without a shell, and a
 * shell string is what [common/security.md](../common/security.md) forbids. This route needs neither.
 */
function locateHttpyac(...roots) {
  for (const root of roots) {
    let manifestPath;
    try {
      manifestPath = createRequire(path.join(root, "package.json")).resolve("httpyac/package.json");
    } catch {
      continue; // not installed from here — try the next root
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const bin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.httpyac;
    if (bin) {
      return { found: true, entry: path.join(path.dirname(manifestPath), bin), version: manifest.version };
    }
  }
  return { found: false };
}

/**
 * Write the requests carrying `--tag` into a parallel tree, preserving each file's prelude.
 *
 * This is the answer to `--name` being unusable with `--all`. Files that contain no tagged request
 * are simply absent from the result, so the caller can tell "nothing is tagged" from "everything is".
 */
function materialiseTagged(files, sourceRoot, destination, tag) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  // httpyac looks for its config from each file's directory upwards, and the filtered tree lives
  // somewhere else entirely — so a suite whose variables come from a config beside it would run
  // with none of them. Carry the config along rather than leaving that to be discovered as 401s.
  for (const name of ["httpyac.config.js", ".httpyac.config.js", "httpyac.config.mjs"]) {
    const config = path.join(sourceRoot, name);
    if (fs.existsSync(config)) fs.copyFileSync(config, path.join(destination, name));
  }
  const written = [];
  for (const file of files) {
    const filtered = filterByTag(fs.readFileSync(file, "utf8"), tag);
    if (filtered.trim().length === 0) continue;
    const target = path.join(destination, path.relative(sourceRoot, file));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, filtered, "utf8");
    written.push(target);
  }
  return written;
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs({ options, allowPositionals: true });
  } catch (error) {
    log(`http-run: ${error.message}`);
    return EXIT.configurationError;
  }
  const flags = parsed.values;
  const root = process.cwd();
  const suiteRoot = path.resolve(root, parsed.positionals[0] ?? "http");

  // A secret the suite needs and does not have is CONFIGURATION, and saying so here is the only
  // place it can still be said plainly: once the run starts, a missing token arrives as a wall of
  // 401s that reads exactly like an auth regression.
  const missing = flags["require-env"].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    log(`http-run: required environment variable(s) not set: ${missing.join(", ")}.`);
    log("  The suite needs them to authenticate. Set them and re-run — this is not an API failure.");
    return EXIT.configurationError;
  }

  if (!fs.existsSync(suiteRoot)) {
    log(`http-run: no suite at ${path.relative(root, suiteRoot) || suiteRoot}.`);
    log("  http-contracts.md puts the requests in http/<group>/ — create it, or pass the path.");
    return EXIT.configurationError;
  }

  const allFiles = findHttpFiles(suiteRoot);
  if (allFiles.length === 0) {
    log(`http-run: ${path.relative(root, suiteRoot)} holds no .http files.`);
    return EXIT.configurationError;
  }

  const artifacts = path.resolve(root, flags.artifacts);
  fs.mkdirSync(artifacts, { recursive: true });
  const reportPath = path.join(artifacts, "report.xml");
  fs.rmSync(reportPath, { force: true }); // never read a report you did not just produce

  let files = allFiles;
  if (flags.tag) {
    files = materialiseTagged(allFiles, suiteRoot, path.join(artifacts, `tagged-${flags.tag}`), flags.tag);
    if (files.length === 0) {
      log(`http-run: no request in ${path.relative(root, suiteRoot)} carries "# @${flags.tag}".`);
      log("  Tagging is deliberate and per request — an empty selection is a configuration error, not a pass.");
      return EXIT.configurationError;
    }
  }

  // The repository root, or beside the suite: a repo whose only Node dependency is this suite keeps
  // the pin next to the requests rather than growing a package.json at its root for one tool.
  const httpyac = locateHttpyac(root, suiteRoot);
  if (!httpyac.found) {
    log("http-run: httpyac is not installed in this repository.");
    log(`  npm install --save-dev httpyac@${KNOWN_GOOD}   (at the repository root, or in ${path.relative(root, suiteRoot) || "the suite folder"})`);
    log("  The pin belongs in the repository that has an API — a repository without one installs nothing.");
    return EXIT.configurationError;
  }

  const variables = [...flags.var];
  if (flags.target) variables.push(`baseUrl=${flags.target}`);

  const args = [
    httpyac.entry, "send", ...files.map((f) => path.relative(root, f)),
    "--all",                       // never optional: without it httpyac can wait on an interactive picker
    "--no-color", "--junit", "--output", "none",
    "--timeout", flags.timeout,
    ...(flags.env ? ["--env", flags.env] : []),
    ...(flags.bail ? ["--bail"] : []),
    ...variables.flatMap((v) => ["--var", v]),
  ];

  log(`http-run: httpyac ${httpyac.version}, ${files.length} file(s)${flags.tag ? ` tagged @${flags.tag}` : ""}${flags.target ? ` against ${flags.target}` : ""}`);

  // The JUnit document goes straight to a file descriptor. Measured in the ClaudeRag spike: httpyac
  // writes the XML and exits, and a buffered pipe can lose the tail to the exit.
  const reportFd = fs.openSync(reportPath, "w");
  let result;
  try {
    result = await run(process.execPath, args, {
      cwd: root,
      timeoutMs: Number(flags["wall-timeout"]),
      stdout: reportFd,
    });
  } finally {
    fs.closeSync(reportFd);
  }

  if (result.err.trim().length > 0) {
    fs.writeFileSync(path.join(artifacts, "httpyac-stderr.log"), result.err, "utf8");
  }
  if (result.timedOut) {
    log(`http-run: the run exceeded its ${flags["wall-timeout"]} ms ceiling and was killed.`);
    log("  ENVIRONMENT FAILURE — the API contract was not exercised.");
    return EXIT.environmentFailure;
  }

  const report = parseJUnit(fs.existsSync(reportPath) ? fs.readFileSync(reportPath, "utf8") : "");
  if (!report.valid) {
    log(`http-run: no valid report at ${path.relative(root, reportPath)} (httpyac exited ${result.code}).`);
    log("  This run proved NOTHING about the API. Read artifacts/httpyac-stderr.log.");
    return EXIT.noValidReport;
  }

  const outcome = verdict(report);
  const requests = new Set(report.cases.map((c) => c.classname)).size;
  log(`http-run: ${requests} request(s), ${report.cases.length} check(s), ${outcome.failed.length} failed.`);

  if (outcome.outcome === "pass") return EXIT.ok;

  for (const testCase of outcome.failed) {
    const kind = outcome.contractual.includes(testCase) ? "CONTRACT" : "environment";
    // The request's name first: an assertion reading "status == 400" names neither what was asked
    // for nor where, and that is the line somebody has to act on.
    log(`  ${kind.padEnd(11)} ${testCase.classname || "(unnamed request)"} › ${testCase.name}`);
    for (const failure of testCase.failures) {
      const message = flags.verbose ? failure.message : failure.message.split("\n")[0];
      log(`              ${message}`);
    }
  }

  if (outcome.outcome === "environment") {
    log("");
    log("ENVIRONMENT FAILURE — every failure is transport or harness, not a broken promise.");
    log("Report it as: the suite could not run. The API contract was NOT exercised.");
    return EXIT.environmentFailure;
  }

  log("");
  log("CONTRACT REGRESSION — the API answered, and answered differently than the suite requires.");
  log("Never weaken an assertion or change production code to make this green.");
  return EXIT.contractRegression;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`http-run: ${error.stack ?? error.message}`);
    process.exit(EXIT.configurationError);
  });
