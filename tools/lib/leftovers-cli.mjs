/**
 * The command line of `tools/leftovers-check.mjs`: the arguments, the usage text and the run of one command (a scan, `--update-allowlist`, `--print-baseline`,
 * `--baseline-shrinks`). Moved out of the guard so that file stays under the size limit of the coding style; behaviour unchanged.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { REPO_TOKEN } from "./owned-token.mjs";
import { BASELINE_FILE, baselineShrinks, loadBaselineAt, printBaseline } from "./raw-temp-baseline.mjs";

/** The profiles of `--profile`: a consumer's file set the scan adds. */
export const PROFILES = Object.freeze(["node"]);

export const USAGE = "usage: node tools/leftovers-check.mjs [--repo <dir>] [--token <t>] [--identity <row>] [--rule <path>] [--allowlist <path>] [--profile node] [--baseline] | --update-allowlist | --print-baseline | --baseline-shrinks --base <git-ref> [--allow-create]   (--identity: the repository column of the token's row; without it only this repository's own token passes; --profile node: a Node consumer's tests and scripts too; --baseline: read the raw-temp baseline, the file raw-temp-baseline.json at the repository root (never a symlink), only when given; --print-baseline: print the current raw-temp sites as a baseline to stdout, writes nothing; --baseline-shrinks: refuse a baseline that grew against the base ref — a CI checkout fetches the base ref first: git fetch origin <base-branch> --depth=1; --allow-create passes only the one creation, a path with no history behind the base, and belongs only in the creation PR\'s own run, never in the standing CI command)";

const FLAGS = Object.freeze({ "--update-allowlist": "update", "--print-baseline": "printBaseline", "--allow-create": "allowCreate", "--baseline": "baseline", "--baseline-shrinks": "baselineShrinks" });
const PLAIN_VALUES = ["token", "identity", "profile", "base"]; // taken as written; every other value option is a path
const VALUE_NAMES = Object.freeze({ repo: "repo", token: "token", identity: "identity", rule: "rule", allowlist: "allowlist", profile: "profile", base: "base" });

/** Parse the arguments: `{ repo, token, rule, identity, profile, baseline, … }` (everything but `repo` and `token` stays unset unless given) or `{ error }`. */
export function parseArguments(argv) {
  const options = { repo: process.cwd(), token: REPO_TOKEN, rule: undefined, identity: undefined, allowlist: undefined, profile: undefined, update: false, baseline: false, printBaseline: false, baselineShrinks: false, base: undefined, allowCreate: false };
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index].replace(/^--/, "");
    if (Object.hasOwn(FLAGS, argv[index])) {
      options[FLAGS[argv[index]]] = true;
      index -= 1; // a flag takes no value
      continue;
    }
    if (!Object.hasOwn(VALUE_NAMES, name) || !argv[index].startsWith("--") || argv[index + 1] === undefined) return { error: `unknown or incomplete argument \`${argv[index]}\`` };
    if (argv[index + 1].startsWith("--")) return { error: `\`${argv[index]}\` needs a value, not the option \`${argv[index + 1]}\`` };
    options[VALUE_NAMES[name]] = PLAIN_VALUES.includes(name) ? argv[index + 1] : path.resolve(argv[index + 1]);
  }
  if (options.profile !== undefined && !PROFILES.includes(options.profile)) return { error: `unknown profile \`${options.profile}\` (the only profile is \`${PROFILES.join("`, `")}\`)` };
  if (options.baselineShrinks && options.base === undefined) return { error: "`--baseline-shrinks` needs `--base <git-ref>`" };
  if (!options.baselineShrinks && (options.base !== undefined || options.allowCreate)) return { error: "`--base` and `--allow-create` belong to `--baseline-shrinks`" };
  if (options.printBaseline && options.baseline) return { error: "`--print-baseline` lists the sites a baseline would carry; it cannot be combined with `--baseline`" };
  return options;
}

function report(findings, io, ruleName, curesFor) {
  const printed = new Set();
  const cures = curesFor(ruleName);
  io.err(`leftovers-check: ${findings.length} finding(s) — see ${ruleName} §7`);
  for (const entry of findings) {
    io.err(`  ${entry.file}:${entry.line} — ${entry.cls} — ${entry.text}`);
    printed.add(entry.cls);
  }
  io.err("");
  for (const cls of Object.keys(cures).filter((name) => printed.has(name))) io.err(`  ${cls}: ${cures[cls]}`);
}

function runUpdate(options, io, { updateAllowlist, JANITOR_FILE }) {
  try {
    const entries = updateAllowlist(options.repo, options.allowlist);
    io.out(`leftovers-check: allowlist rewritten — ${entries.length} entr${entries.length === 1 ? "y" : "ies"} from ${JANITOR_FILE}`);
    return 0;
  } catch (error) {
    io.err(`leftovers-check: cannot update the allowlist: ${error.message.split("\n")[0]}`);
    return 2;
  }
}

function runShrinks(options, io) {
  const { code, lines } = baselineShrinks({ repo: options.repo, base: options.base, allowCreate: options.allowCreate });
  for (const line of lines) (code === 0 ? io.out : io.err)(`leftovers-check: --baseline-shrinks: ${line}`);
  return code;
}

/**
 * Run the guard: the exit code (0 clean, 1 findings, 2 scanned nothing, no yaml or bad arguments). `io` and `resolvers` (where `yaml` is looked for) are seams for
 * tests; `engine` is the guard's own scan (`scanRepository`, `updateAllowlist`, `JANITOR_FILE`, `YamlMissingError`, `curesFor`), passed in so this module needs nothing from it.
 */
export function runCli(argv, io, resolvers, engine) {
  const { scanRepository, YamlMissingError, curesFor } = engine;
  const options = parseArguments(argv);
  if (options.error !== undefined) {
    io.err(`leftovers-check: ${options.error}\n${USAGE}`);
    return 2;
  }
  if (options.update) return runUpdate(options, io, engine);
  if (options.baselineShrinks) return runShrinks(options, io);
  let baseline;
  if (options.baseline) {
    try {
      baseline = loadBaselineAt(options.repo);
    } catch (error) {
      io.err(`leftovers-check: cannot read the baseline ${BASELINE_FILE} in ${options.repo}: ${error.message.split("\n")[0]}`);
      return 2;
    }
  }
  let result;
  try {
    result = fs.existsSync(options.repo) ? scanRepository({ ...options, baseline, resolvers }) : { files: 0, findings: [] };
  } catch (error) {
    if (error instanceof YamlMissingError) {
      io.err(error.message);
      return 2;
    }
    io.err(`leftovers-check: cannot read ${options.repo}: ${error.message.split("\n")[0]}`);
    return 2;
  }
  if (result.files === 0) {
    io.err(`leftovers-check: scanned nothing under ${options.repo} — discovery broke; the repository is not clean`);
    return 2;
  }
  if (options.printBaseline) {
    const { baseline: listed, missing } = printBaseline(result.findings, options.repo);
    if (missing.length > 0) {
      io.err(`leftovers-check: --print-baseline: the line of ${missing.join(", ")} cannot be read — the file changed during the scan; run it again`);
      return 2;
    }
    io.out(JSON.stringify(listed, null, 2));
    return 0;
  }
  if (result.findings.length === 0) {
    io.out(`leftovers-check: clean (${result.files} files).`);
    return 0;
  }
  report(result.findings, io, result.rule, curesFor);
  return 1;
}
