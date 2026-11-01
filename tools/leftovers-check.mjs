#!/usr/bin/env node
/**
 * The structural guard of `common/test-leftovers.md` §7: red on every way a test can create something it will
 * not remove, outside the one helper (`tools/lib/owned.mjs`), and red when it scanned nothing.
 *
 * What it refuses, as classes of the rule's §7 table:
 *   raw-temp      a temp path made by hand (`mkdtemp`, `tmpdir()`, `TEMP`/`TMP`/`TMPDIR`, `GetTempPath`, `CreateTempSubdirectory`,
 *                 `GetTempFileName`, `mktemp`)
 *   raw-worktree  any `git worktree add`
 *   docker-run    a `docker run` with neither `--rm` nor the complete carve-out of §5
 *   docker-name   a `--name`, `volume create`, `network create`, `WithName`, a compose project name (`-p`, `--project-name`,
 *                 `COMPOSE_PROJECT_NAME`), or the tag of an image a test builds,
 *                 that is not one of the three spellings of §1
 *   shared-store  a `DROP`, `TRUNCATE`, `FLUSH` or delete-all against an unprefixed name
 *   ryuk-off      `TESTCONTAINERS_RYUK_DISABLED` set to true — no exemption accepted
 *   legacy-name   a literal, or a constant-built prefix, that spells a prefixed name whose second segment is not an owner (§1)
 *   owner-blind   a pattern, glob or filter that matches the prefix with no owner segment after it, written literally or through a
 *                 variable the same file assigns a value holding the prefix (a name from another file, the environment or an
 *                 argument is not traced) — the shape of a sweeper that cannot tell one user's leftovers from another's. It takes NO inline exemption: the one pass is
 *                 `tools/fixtures/owner-blind-allowlist.json`, keyed by file, line and the sha256 of the line
 * plus two that are about the guard's own grammar:
 *   exemption     a `testsToDelete-exempt:` comment that is not well-formed
 *   token         this repository's token is not a row of the rule's `## Tokens` table (§1), or is of the owner grammar, or a copied `owned.mjs` has
 *                 no `owned-token.mjs` beside it (the shipped helper holds no token: each repository writes its OWN `tools/lib/owned-token.mjs` — `REPO_TOKEN`, `REPO_ROW` — and never copies another's)
 *
 * Why it exists as a script and not as a paragraph: the rule has said "name it, own it, remove it" since the
 * audit of 2026-10-14, and the audit found no compliant site in six repositories — a sentence nobody can be
 * told is red about is a sentence nobody follows. This file is the red.
 *
 * Run from anywhere:
 *
 *     node tools/leftovers-check.mjs [--repo <dir>] [--token <t>] [--identity <row>] [--rule <path>] [--allowlist <path>] [--profile node]
 *     node tools/leftovers-check.mjs --update-allowlist [--repo <dir>]
 *     node tools/leftovers-check.mjs [--repo <dir>] --baseline
 *     node tools/leftovers-check.mjs [--repo <dir>] --print-baseline
 *     node tools/leftovers-check.mjs [--repo <dir>] --baseline-shrinks --base <git-ref> [--allow-create]
 *
 * `--update-allowlist` rewrites the allowlist from the CURRENT `tools/janitor.sh`: every non-comment line the classifier calls
 * broad in that one file, by its line number and hash. The diff is what a reviewer reads; nothing else is ever added.
 *
 * `--identity` is the "repository" column of the token's row in the rule's `## Tokens` table — which repository the token is.
 * It defaults to this repository's own row (`REPO_ROW`) ONLY for this repository's own token; any other `--token` without
 * an `--identity` fails closed, so a token can never be proven to belong to a repository by accident.
 *
 * `--profile node` is for a Node CONSUMER that mounts this repository and runs this file instead of porting it: it adds the consumer's tracked
 * `*.test.<ext>` and `*.spec.<ext>` files (ext: ts, tsx, mts, cts, js, mjs, cjs) and EVERY text file under the root folders `scripts/`, `test/` and `tests/` — an extensionless
 * `scripts/start-db` too; a file with a NUL byte in its first 8 KiB, or a known binary or media extension (png, pdf, zip, woff2, …), is binary and is never read — to the scan, and never reads
 * `node_modules/` or the mount paths `.claude/rules/shared/` and `.agents/conventions/` — for the scan AND for the token constants. Without it the scan is exactly this repository's own. The token
 * check reads the `## Tokens` table of the rule beside the guard (or `--rule`) whatever families it lists, and needs the `--token` row to name `--identity`.
 * A `docker-name` value that is wholly a shell expansion (`"${name}"`, `"$(f a)"`) is dynamic, never a finding: a text scan cannot know what it builds — a
 * known limit of a text scan, since `$(…)` runs a command and a variable reads the environment. Two things the text itself says are judged: a literal DEFAULT
 * (`${V:-w}`, `${V-w}`, `${V:=w}`, `${V=w}`, `w` with no `$`) is the name the command gets when V is unset, so `w` must be in the owner form; and a single-quoted
 * `'${name}'` is no expansion in a shell, so it is the literal text `${name}`.
 * Workflows are read with `yaml@2`: this guard's own copy first, then the scanned repository's (`node_modules` of the consumer), else exit 2 with the one
 * sentence that says to add `yaml@2` as a devDependency — and only when the repository has a workflow. Not here: a `module-load` class (needs a parser).
 *
 * `--baseline` reads the repository's `raw-temp` baseline (rule §7, `common/test-leftovers-baseline.md`, `tools/lib/raw-temp-baseline.mjs`): ONE fixed path, `raw-temp-baseline.json`
 * at the repository root, a regular file, never a symlink (a link is a `baseline` finding in a scan and exit 2 in the shrink check). It is a multiset of `raw-temp` sites — file and
 * the sha256 of the trimmed line, one entry per occurrence — for sites that run inside an owned run folder; a scope's proof is a test file this scan discovered that carries
 * `testsToDelete-baseline-proof: <root>`. It is read ONLY when `--baseline` is given. A site up to its entries passes; one more is `raw-temp`; a stale entry, an entry under no scope or
 * under a scope whose proof is missing, another class, a malformed file are class `baseline` (exit 1, with the cure). Only an unreadable path is exit 2.
 * `--print-baseline` prints, to stdout only, the baseline of the current scan's `raw-temp` findings (`scopes` empty, to be written by hand) for the one creation.
 * `--baseline-shrinks --base <git-ref>` compares that file with `git show <ref>:raw-temp-baseline.json`: a new key, a raised count, a new or wider scope, a narrowed scope that does not
 * keep its base proof, or a changed proof is exit 1; a creation is exit 1 unless `--allow-create`, which belongs only in the creation PR's own run (never in a standing CI command) and is
 * honoured only while the path has no history behind the base ref; an unresolved base ref, a git failure, or a shallow clone asked about a creation is exit 2 naming the cause and the fetch to
 * run. A CI checkout fetches the base ref first (`git fetch origin <base-branch> --depth=1`). No command writes a baseline.
 *
 * Exit 0 clean, 1 with every finding printed (`file:line — <class> — <text>`), 2 when it scanned nothing or its
 * arguments are bad — an empty scan is a broken discovery, never a clean repository.
 */

import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { gitOutput } from "./lib/git.mjs";
import { OWNER_GRAMMAR } from "./lib/owned.mjs";
import { PREFIX_OK, composeEnvHits, finding, isComment } from "./lib/leftovers-shell.mjs";
import { dockerFindings } from "./lib/leftovers-docker.mjs";
import { REPO_ROW, REPO_TOKEN } from "./lib/owned-token.mjs";
import { BASELINE_FILE, PROOF_MARKER, createApplier, loadBaselineAt, siteSha256 } from "./lib/raw-temp-baseline.mjs";
import { PROFILES, parseArguments, runCli } from "./lib/leftovers-cli.mjs";

export { PROFILES, parseArguments };
import { JANITOR_FILE, classifyLine, classifyLines, lineSha256 } from "./lib/sweeper-scan.mjs";
import { isReason } from "./ownership-check.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The files the scan never reads: the guard's own tests carry the violations as fixture strings. A test pins this list. */
export const EXCLUDED_FILES = Object.freeze(["tools/leftovers-check.test.mjs", "tools/leftovers-check-consumers.test.mjs"]);

/** Every class an exemption may name (`ryuk-off` never; `exemption` and `token` are not resources). */
export const EXEMPTIBLE = Object.freeze(["raw-temp", "raw-worktree", "docker-run", "docker-name", "legacy-name", "shared-store"]);

/**
 * Files whose `legacy-name` findings are skipped. EMPTY since the janitor reads the owner form: its own tests no longer
 * spell a name of the form before the owner segment (a test that needs one builds it from pieces at run time), so no file
 * is exempt from the class. A test pins that it stays empty.
 */
export const LEGACY_NAME_PENDING = Object.freeze([]);

/** The repository's one sweeper script and the file that allowlists its inventory line (rule §7). */
export { JANITOR_FILE };
export const ALLOWLIST_FILE = "tools/fixtures/owner-blind-allowlist.json";

/**
 * The rule file the messages point at when nothing is resolved yet: the detail, which holds the `## Tokens` table since the
 * split of 2026-11-01. `curesFor(ruleName)` rewrites every message to the file `resolveRule` actually found — on a mount from
 * before the split that is `common/test-leftovers.md`, which there holds the whole text — so a cure never names a file the
 * mount does not have.
 */
export const DEFAULT_RULE_NAME = "common/test-leftovers-detail.md";

/** `common/<file>` for a resolved rule path, or a name that says the rule was not found. */
export const ruleNameOf = (rulePath) => (rulePath === undefined ? "common/test-leftovers.md (not found)" : path.basename(path.dirname(rulePath)) + "/" + path.basename(rulePath));

export const CURES = Object.freeze({
  "raw-temp": "Make temp folders with ownedDir(t, what) from tools/lib/owned.mjs — common/test-leftovers-detail.md §7 (raw-temp), §2.",
  "raw-worktree": "Make worktrees with ownedWorktree(t, repo, what) from tools/lib/owned.mjs — common/test-leftovers-detail.md §7 (raw-worktree), §3.",
  "docker-run": "Add --rm, or the complete carve-out: a testsToDelete-<owner>-<repo>-<what>-<id> name, a remover step on every path after the diagnostics — common/test-leftovers-detail.md §5, §7 (docker-run).",
  "docker-name": "Give the container, volume, network, compose project or test-built image one of the three spellings of testsToDelete-<owner>-<repo>-<what>-<id> — common/test-leftovers-detail.md §1, §7 (docker-name).",
  "legacy-name": "Build every name with the owner segment: testsToDelete-<owner>-<repo>-<what>-<id> from ownedName()/the helper of this repository — common/test-leftovers-detail.md §1, §7 (legacy-name).",
  "owner-blind": "Match the caller's owner after the prefix (^testsToDelete-<owner>-<repo>-), or delete the sweep and use the shipped janitor; this class takes no exemption — common/test-leftovers-detail.md §7 (owner-blind), the barrier.",
  "shared-store": "Isolate the store per run, or add `testsToDelete-exempt: shared-store — <reason with lock: …>` — common/test-leftovers-detail.md §6, §7 (shared-store).",
  "ryuk-off": "Leave Testcontainers' reaper on; this class takes no exemption — common/test-leftovers-detail.md §5, §7 (ryuk-off).",
  baseline: "Remove the stale or out-of-scope entry from the baseline, or move the site into the helper; nothing adds to it — common/test-leftovers-detail.md §7 (the `raw-temp` baseline).",
  exemption: "Write `testsToDelete-exempt: <class> — <reason>` with a class of §7 (not ryuk-off) and a real reason — common/test-leftovers-detail.md §7 (the exemption grammar).",
  token: "Register this repository's token as a row of the rule's `## Tokens` table before using it — common/test-leftovers-detail.md § Tokens (§1 of the rule) — and write it, with its row, in this repository's own tools/lib/owned-token.mjs beside the copied owned.mjs (never copy another repository's).",
});

/** The cures, each pointing at `ruleName` — the file the scan resolved (see `resolveRule`). */
export const curesFor = (ruleName) => Object.fromEntries(Object.entries(CURES).map(([cls, text]) => [cls, text.replaceAll(DEFAULT_RULE_NAME, ruleName)]));

const TOKEN_SHAPE = /^[a-z0-9]{2,12}$/;
// The prefix is spelled in two pieces below: these are detectors, and the machine scan reads this file too.
const WORD = "teststo" + "delete";
const LEGACY_LITERAL = new RegExp(`${WORD}[-_]([a-z0-9]+)`, "gi");
/** The proof marker of the `raw-temp` baseline is a marker word, as `exempt` is, not a name — in its exact case, with a folder path after it (an image tag spelled like it is a name). */
const isProofMarker = (match) => {
  const rest = match.input.slice(match.index);
  return rest.startsWith(PROOF_MARKER) && /^\s+\S+\//.test(rest.slice(PROOF_MARKER.length));
};
/** The second segments that are not names: the quarantine sibling (`.<name>.<prefix>-quarantine-…`) and an environment variable (`TESTSTODELETE_OWNER`: upper case, underscore). */
const notAName = (match) => match[1].toLowerCase() === "exempt" || isProofMarker(match) || match[1].toLowerCase() === "quarantine" || new RegExp(`^${WORD.toUpperCase()}_[A-Z]+$`).test(match[0]);
const LEGACY_BUILT = new RegExp(`${WORD}[-_]\\$\\{?\\s*(?:REPO_TOKEN|RepoToken|repoToken)\\b`, "i");
const MARKER = /(?:\/\/|#|--|\/\*|\*|<!--)\s*testsToDelete-exempt:(.*)$/;
const JS_FILE = /\.(?:mjs|js|cjs)$/;

// --- the yaml package -----------------------------------------------------------------------------------------

/**
 * `yaml@2` cannot be used: the one thing a consumer must do about it. Never an `ERR_MODULE_NOT_FOUND` stack. `wrongVersion` is set when a `yaml` WAS found
 * and it is not version 2 (a repository with `yaml@1` in its tree is told so, not that there is none).
 */
export class YamlMissingError extends Error {
  constructor({ wrongVersion = false } = {}) {
    super(wrongVersion
      ? "leftovers-check: the `yaml` package that was found is not version 2 (it lacks `LineCounter`) — add `yaml@2` as a devDependency of the repository being scanned (npm install --save-dev yaml@2)."
      : "leftovers-check: the `yaml` package (version 2) is needed to read workflows and cannot be found — add `yaml@2` as a devDependency of the repository being scanned (npm install --save-dev yaml@2).");
    this.name = "YamlMissingError";
    this.wrongVersion = wrongVersion;
  }
}

/**
 * Where `yaml` is looked for, in order: this guard's own resolution (the repository the guard lives in), then the scanned repository's — from its root,
 * which `createRequire` walks up whether or not a `package.json` sits there. Test seam: `main`, `scanRepository` and `loadYaml` take replacements.
 */
export const YAML_RESOLVERS = Object.freeze({
  own: () => createRequire(import.meta.url)("yaml"),
  scanned: (repo) => createRequire(path.join(repo, "noop.js"))("yaml"),
});

const isYamlTwo = (module) => typeof module?.parseDocument === "function" && typeof module?.LineCounter === "function";

/** The `yaml` module of version 2, or a `YamlMissingError` (`wrongVersion` when one was found and is not version 2). Only a MISSING module is "not found": any other failure of a resolver is the caller's. */
export function loadYaml(repo, resolvers = {}) {
  const { own, scanned } = { ...YAML_RESOLVERS, ...resolvers }; // a seam may replace one of the two
  let wrongVersion = false;
  for (const resolve of [() => own(), ...(repo === undefined ? [] : [() => scanned(repo)])]) {
    try {
      const module = resolve();
      if (isYamlTwo(module)) return module;
      wrongVersion = true;
    } catch (error) {
      if (error?.code !== "MODULE_NOT_FOUND" && error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
    }
  }
  throw new YamlMissingError({ wrongVersion });
}

// --- discovery -----------------------------------------------------------------------------------------------

/** The profiles of `--profile`: what a consumer's tree adds to the scan. `node` is the Node consumers of this family. */

// The `node` profile: a consumer's tests and scripts, wherever they sit. `node_modules` and the two places the shared rules are mounted
// are never read under it — a mount holds this repository's own scripts, which are not the consumer's to be judged.
const NODE_EXTENSIONS = "ts|tsx|mts|cts|js|mjs|cjs";
const NODE_TEST = new RegExp(`\\.(?:test|spec)\\.(?:${NODE_EXTENSIONS})$`);
const NODE_TREE = /^(?:scripts|test|tests)\/.+/; // EVERY file under these three root folders, whatever its name: a script need not have an extension (`scripts/start-db`)
const BINARY_EXTENSION = /\.(?:png|jpe?g|gif|webp|avif|ico|bmp|tiff?|pdf|zip|gz|tgz|bz2|xz|7z|tar|jar|woff2?|ttf|otf|eot|mp[34]|mov|webm|wav|ogg|wasm|so|dll|dylib|exe|bin|class|sqlite3?|db)$/i; // known binary and media files: never text, never read
const NODE_NEVER = /(?:^(?:\.claude\/rules\/shared\/|\.agents\/conventions\/))|(?:(?:^|\/)node_modules\/)/;

function checkProfile(profile) {
  if (profile !== undefined && !PROFILES.includes(profile)) throw new TypeError(`unknown profile \`${profile}\` (the profiles are: ${PROFILES.map((name) => `\`${name}\``).join(", ")})`);
}

/**
 * Whether a repository-relative path (forward slashes) is one the guard reads. `tools/lib/**` is product code, never scanned.
 * `profile` adds a consumer's files (`node`); without one the set is exactly this repository's own.
 */
export function isScanned(file, profile) {
  checkProfile(profile);
  if (profile === "node" && NODE_NEVER.test(file)) return false;
  if (EXCLUDED_FILES.includes(file) || file.startsWith("tools/lib/")) return false;
  return (
    (file.startsWith("tools/") && file.endsWith(".test.mjs")) ||
    (file.startsWith("tools/fixtures/") && JS_FILE.test(file)) ||
    /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file) ||
    (file.startsWith(".github/scripts/") && /\.(?:mjs|js|sh)$/.test(file)) ||
    /\.(?:sh|ps1)$/.test(file) ||
    (profile === "node" && (NODE_TEST.test(file) || (NODE_TREE.test(file) && !BINARY_EXTENSION.test(file))))
  );
}

/** A file that holds a NUL byte in its first 8 KiB is binary (git's own test, and a UTF-16 text file too): it is not text to be read for names. */
const isBinary = (bytes) => bytes.subarray(0, 8192).includes(0);

/** Paths in code-unit order — the order a bare `.sort()` gives, stated, so it never depends on the locale. */
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** The files to read, from git's own idea of the tree (tracked plus untracked-not-ignored). Throws when `repo` is not a repository. */
export function discover(repo, profile) {
  checkProfile(profile);
  return listFiles(repo).filter((file) => isScanned(file, profile));
}

/** Every file git knows in `repo`, tracked or untracked-not-ignored, in code-unit order. */
function listFiles(repo) {
  const listing = gitOutput(repo, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
  return [...new Set(listing.split("\0").filter(Boolean))].sort(byCodeUnit);
}

// --- lines, comments, exemptions -----------------------------------------------------------------------------



/** Parse every `testsToDelete-exempt:` comment: `{ valid: Map<class, Set<line>>, findings }`. */
export function readExemptions(file, lines) {
  const valid = new Map(EXEMPTIBLE.map((cls) => [cls, new Set()]));
  const findings = [];
  lines.forEach((line, index) => {
    const marker = MARKER.exec(line);
    if (marker === null) return;
    const problem = exemptionProblem(marker[1]);
    if (problem.cls === undefined) findings.push(finding(file, index + 1, "exemption", problem.text));
    else valid.get(problem.cls).add(index + 1);
  });
  return { valid, findings };
}

/** `{ cls }` when the text after the marker is a valid exemption, else `{ text }` saying why not. */
function exemptionProblem(rest) {
  const parsed = /^\s*([^\s—]*)\s*(?:—\s*(.*?))?\s*(?:\*\/|-->)?\s*$/.exec(rest);
  const cls = parsed?.[1] ?? "";
  const reason = parsed?.[2] ?? "";
  if (cls === "") return { text: "an exemption names no class" };
  if (cls === "ryuk-off") return { text: "`ryuk-off` accepts no exemption" };
  if (cls === "owner-blind") return { text: "`owner-blind` accepts no exemption: the allowlist (file, line, hash) is the only pass" };
  if (!EXEMPTIBLE.includes(cls)) return { text: `an exemption names an unknown class \`${cls}\`` };
  if (!isReason(reason)) return { text: `the exemption of \`${cls}\` carries no reason (ten characters, three words, not a placeholder)` };
  if (cls === "shared-store" && !reason.includes("lock:")) return { text: "the exemption of `shared-store` must name its lock (`lock: …`)" };
  return { cls };
}

const isExempt = (exemptions, cls, line) => exemptions.valid.get(cls)?.has(line) === true || exemptions.valid.get(cls)?.has(line - 1) === true;

// --- the single-line classes ---------------------------------------------------------------------------------

const RAW_TEMP = [
  /\bmkdtemp(?:Sync)?\s*\(/,
  /\btmpdir\s*\(/,
  /process\.env\.(?:TEMP|TMP|TMPDIR)\b/,
  /\btemp_dir\s*\(/,
  /GetTempPath/,
  /CreateTempSubdirectory/,
  /GetTempFileName/,
];
const RAW_TEMP_BY_EXTENSION = { ".sh": [/\bmktemp\b/], ".ps1": [/New-TemporaryFile|\$env:TE?MP\b/] };
const RAW_WORKTREE = [/["']worktree["']\s*,\s*["']add["']/, /\bworktree\s+add\b/];
const RYUK_OFF = /TESTCONTAINERS_RYUK_DISABLED\s*[:=]\s*["']?true/i;
const SHARED_STORE = [
  { pattern: /\bDROP\s+(?:DATABASE|SCHEMA|TABLE)\s+(?:IF\s+EXISTS\s+)?(["'`]?[\w.$-]*)/, named: true },
  { pattern: /\bTRUNCATE\s+(?:TABLE\s+)?(["'`]?[\w.$-]*)/, named: true },
  { pattern: /\bFLUSH(?:ALL|DB)\b/, named: false },
  { pattern: /deleteMany\(\s*\{\s*\}\s*\)/, named: false },
];

function sharedStoreHit(line) {
  for (const { pattern, named } of SHARED_STORE) {
    const match = pattern.exec(line);
    if (match !== null && !(named && PREFIX_OK.test(match[1].replace(/^["'`]/, "")))) return [match[0].trim()];
  }
  return [];
}

/** Every pattern's hit on the line, so a line that breaks a class twice is listed twice. */
function allMatches(patterns, line) {
  return patterns.flatMap((pattern) => {
    const match = pattern.exec(line);
    return match === null ? [] : [match[0].trim()];
  });
}

/** `legacy-name` hits of a line: a literal whose second segment is no owner (and no `exempt` marker word), or a prefix built from the token alone. */
function legacyNameHits(line) {
  const literal = [...line.matchAll(LEGACY_LITERAL)]
    .filter((match) => !notAName(match) && !OWNER_GRAMMAR.test(match[1].toLowerCase()))
    .map((match) => match[0]);
  return LEGACY_BUILT.test(line) ? [...literal, "a prefix built from the repository token"] : literal;
}

function lineFindings(file, lines, exemptions, allowlist, baseline) {
  const extra = RAW_TEMP_BY_EXTENSION[path.extname(file)] ?? [];
  const found = [];
  const add = (index, cls, text) => {
    if (cls === "ryuk-off" || !isExempt(exemptions, cls, index + 1)) found.push(finding(file, index + 1, cls, text));
  };
  const verdicts = classifyLines(lines.join("\n"), { allowlist, file }); // the file's own prefix bindings are read once, for every line
  lines.forEach((line, index) => {
    if (isComment(line)) return;
    const checks = [
      ["raw-temp", allMatches([...RAW_TEMP, ...extra], line)],
      ["raw-worktree", allMatches(RAW_WORKTREE, line).slice(0, 1)],
      ["shared-store", sharedStoreHit(line)],
      ["ryuk-off", RYUK_OFF.test(line) ? ["TESTCONTAINERS_RYUK_DISABLED"] : []],
      ["docker-name", composeEnvHits(line)],
      ["legacy-name", LEGACY_NAME_PENDING.includes(file) ? [] : legacyNameHits(line)],
    ];
    for (const [cls, hits] of checks) {
      if (hits.length === 0) continue;
      // the baseline passes a `raw-temp` hit up to its entries; a line with a valid exemption is exempt first and consumes none
      if (cls === "raw-temp" && baseline !== undefined && !isExempt(exemptions, cls, index + 1) && baseline.take(file, siteSha256(line))) continue;
      add(index, cls, [...new Set(hits)].map((hit) => `\`${hit}\``).join(", "));
    }
    // owner-blind: no exemption of any kind — the allowlist (file, line, hash) is the one pass
    if (verdicts[index] === "broad") found.push(finding(file, index + 1, "owner-blind", "matches the prefix with no owner segment after it"));
  });
  return found;
}

// --- one file, the whole repository --------------------------------------------------------------------------

/**
 * Every finding of one file's text (`file` is the repository-relative path with forward slashes). `yaml` returns the yaml module and is called only
 * for a workflow: by default the guard's own resolution, which throws a `YamlMissingError` when there is none.
 */
export function scanText(file, text, allowlist = [], yaml = () => loadYaml(undefined), baseline = undefined) {
  const lines = text.split(/\r?\n/);
  const exemptions = readExemptions(file, lines);
  const docker = dockerFindings(file, lines, text, yaml).filter((entry) => !isExempt(exemptions, entry.cls, entry.line));
  return [...exemptions.findings, ...lineFindings(file, lines, exemptions, allowlist, baseline), ...docker];
}

// --- the token ------------------------------------------------------------------------------------------------

const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

/** The rule's `## Tokens` table: `{ heading, header, rows }` (`heading` = 1-based line, `header` = cells or undefined, `rows` = [{ token, family, line }]). */
export function parseTokenTable(ruleText) {
  const lines = ruleText.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+Tokens\s*$/.test(line));
  if (start < 0) return { heading: 0, header: undefined, rows: [] };
  const end = lines.findIndex((line, index) => index > start && /^#{1,2}\s/.test(line));
  const section = lines.slice(start + 1, end < 0 ? lines.length : end);
  const headerAt = section.findIndex((line, index) => /^\s*\|/.test(line) && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(section[index + 1] ?? "") && section[index + 1].includes("-"));
  if (headerAt < 0) return { heading: start + 1, header: undefined, rows: [] };
  const rows = [];
  for (let index = headerAt + 2; index < section.length && /^\s*\|/.test(section[index]); index += 1) {
    const [token = "", family = "", repository = ""] = cells(section[index]);
    rows.push({ token: token.replace(/`/g, ""), family, repository, line: start + index + 2 });
  }
  return { heading: start + 1, header: cells(section[headerAt]), rows };
}

const EXPECTED_HEADER = ["token", "family", "repository"];

/** A registered token must also be THIS repository's: its row's repository column is the one `identity` (`REPO_ROW` in the helper) names. No identity is a finding — the check fails closed. */
function belongsFindings(row, token, identity, rulePath) {
  const at = (text) => [finding(rulePath, row.line, "token", text)];
  if (identity.trim() === "") {
    return at(`this repository's identity is unknown, so the token \`${token}\` cannot be proven to belong to it — set REPO_ROW in the repository's helper (or pass --identity) to exactly the "repository" column of the row of \`${token}\` in ${rulePath} (## Tokens), which says \`${row.repository}\``);
  }
  if (row.repository.trim().toLowerCase() === identity.trim().toLowerCase()) return [];
  return at(`the token \`${token}\` belongs to \`${row.repository}\` in ${rulePath}, not to this repository (\`${identity}\`)`);
}

/** Findings (class `token`) when `token` is not a registered row of `ruleText`'s `## Tokens` table, or is the row of another repository. Fails closed: a rule with no table registers nothing. */
export function tokenFindings(ruleText, token, rulePath = ruleNameOf(resolveRule(path.join(HERE, ".."))), identity = REPO_ROW) {
  const at = (line, text) => [finding(rulePath, Math.max(line, 1), "token", text)];
  if (!TOKEN_SHAPE.test(token)) return at(1, `the token \`${token}\` is not [a-z0-9]{2,12} (${rulePath})`);
  const table = parseTokenTable(ruleText);
  if (table.heading === 0) return at(1, `${rulePath} has no \`## Tokens\` section — the token \`${token}\` is not registered`);
  if (table.header === undefined) return at(table.heading, `${rulePath} has no table under \`## Tokens\` — the token \`${token}\` is not registered`);
  if (table.header.length !== 3 || !EXPECTED_HEADER.every((name, index) => table.header[index].toLowerCase() === name)) {
    return at(table.heading, `the \`## Tokens\` table of ${rulePath} is not \`| token | family | repository |\` — the token \`${token}\` is not registered`);
  }
  const found = [];
  const seen = new Set();
  if (OWNER_GRAMMAR.test(token)) found.push(...at(table.heading, `the token \`${token}\` matches the owner grammar ${OWNER_GRAMMAR} of ${rulePath} §1 — no repository may be named like an owner`));
  for (const row of table.rows) {
    if (seen.has(row.token)) found.push(...at(row.line, `the token \`${row.token}\` is listed twice in ${rulePath}`));
    seen.add(row.token);
  }
  if (!seen.has(token)) found.push(...at(table.heading, `the token \`${token}\` is not a row of the \`## Tokens\` table of ${rulePath}`));
  else found.push(...belongsFindings(table.rows.find((row) => row.token === token), token, identity, rulePath));
  return found;
}

// --- the repository ------------------------------------------------------------------------------------------

// A repository has one helper per test language (rule §2), each holding the token ONCE. The constants are found by shape, in every
// tracked source file — the helper itself lives where the scan above does not look — and they must all be the same and a row of the table.
const TOKEN_CONSTANT = /\b(?:REPO_TOKEN|RepoToken)\b\s*(?::\s*[\w<>[\]]+\s*)?=\s*["']([^"'\n]*)["']/g;
const CONSTANT_FILE = /\.(?:mjs|cjs|js|ts|cs|sh|ps1|py|rs)$/;

/**
 * The files that can hold a token constant: tracked, or untracked and not ignored (what `ls-files --cached --others --exclude-standard`
 * lists), narrowed by git itself to the ones that name `REPO_TOKEN` or `RepoToken` — a repository is not read file by file.
 * `git grep` exits 1 for "no match", which is an empty answer; every other failure is the caller's.
 */
function candidateFiles(repo) {
  try {
    const listing = gitOutput(repo, ["grep", "-l", "-z", "-I", "-F", "--untracked", "-e", "REPO_TOKEN", "-e", "RepoToken"]);
    return [...new Set(listing.split("\0").filter(Boolean))].sort(byCodeUnit);
  } catch (error) {
    if (error.status === 1) return [];
    throw error;
  }
}

/** Every token constant of one line, each `{ line, value }` — one declaration may name both spellings, so a line can hold several. A comment line holds none. */
function lineConstants(text, index) {
  if (isComment(text)) return [];
  return [...text.matchAll(TOKEN_CONSTANT)].map((match) => ({ line: index + 1, value: match[1] }));
}

/**
 * Every token constant of the repository: `[{ file, line, value }]`. The shipped helper holds none — `tools/lib/owned.mjs` re-exports the constants
 * from the `owned-token.mjs` each repository writes, and a re-export is no declaration — so a byte copy of it never adds a second token.
 * Under a profile the mount paths and `node_modules/` are not the repository's own tree (the same exclusions as `isScanned`).
 */
export function tokenConstants(repo, profile) {
  checkProfile(profile);
  const found = [];
  for (const file of candidateFiles(repo)) {
    if (profile === "node" && NODE_NEVER.test(file)) continue;
    if (!CONSTANT_FILE.test(file) || EXCLUDED_FILES.includes(file) || !fs.existsSync(path.join(repo, file))) continue;
    const lines = fs.readFileSync(path.join(repo, file), "utf8").split(/\r?\n/);
    lines.forEach((text, index) => found.push(...lineConstants(text, index).map((entry) => ({ file, ...entry }))));
  }
  return found;
}

const HELPER_FILE = "owned.mjs";
const TOKEN_FILE = "owned-token.mjs";
const TOKEN_IMPORT = /\bfrom\s+["']\.\/owned-token\.mjs["']/;

/**
 * Findings (class `token`): a copy of the shipped helper — an `owned.mjs` that imports `./owned-token.mjs` — with no `owned-token.mjs` beside it.
 * The copy holds no token (it is the same bytes everywhere), so without the file the helper cannot load and the guard would have no constant to check.
 * A copy under a profile's mount paths or `node_modules/` is not the repository's own.
 */
export function tokenFileFindings(repo, profile) {
  checkProfile(profile);
  const found = [];
  for (const file of listFiles(repo)) {
    if (path.posix.basename(file) !== HELPER_FILE || (profile === "node" && NODE_NEVER.test(file)) || !fs.existsSync(path.join(repo, file))) continue;
    const dir = path.posix.dirname(file);
    if (fs.existsSync(path.join(repo, dir, TOKEN_FILE))) continue;
    const at = fs.readFileSync(path.join(repo, file), "utf8").split(/\r?\n/).findIndex((line) => !isComment(line) && TOKEN_IMPORT.test(line));
    if (at >= 0) {
      found.push(finding(file, at + 1, "token", `${file} imports ./${TOKEN_FILE}, which is missing — write ${path.posix.join(dir, TOKEN_FILE)} with this repository's own REPO_TOKEN (its row of the rule's \`## Tokens\` table) and REPO_ROW (that row's repository column), never a copy of another repository's`));
    }
  }
  return found;
}

/** Findings (class `token`): constants that differ, and every constant that is not this repository's registered token. */
export function constantFindings(constants, token, ruleText, rulePath, identity = REPO_ROW) {
  const values = [...new Set(constants.map((entry) => entry.value))];
  const found = [];
  if (values.length > 1) {
    const where = constants.map((entry) => `\`${entry.value}\` in ${entry.file}:${entry.line}`).join(", ");
    found.push(finding(constants[0].file, constants[0].line, "token", `token constants differ: ${where} — every helper of a repository holds the same token (§2)`));
  }
  for (const value of values) if (value !== token) found.push(...tokenFindings(ruleText, value, rulePath, identity));
  return found;
}

/**
 * The rule text the token is checked against: `--rule`, else the repository's own, else the one beside this tool. The `## Tokens`
 * table lives in `common/test-leftovers-detail.md` since the split of 2026-11-01; `common/test-leftovers.md` (the core) is tried
 * after it in each place, for a mount from before the split that still holds the table there.
 */
export function resolveRule(repo, rule) {
  const candidates = rule === undefined
    ? [repo, path.join(HERE, "..")].flatMap((base) => [path.join(base, "common", "test-leftovers-detail.md"), path.join(base, "common", "test-leftovers.md")])
    : [rule];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

/**
 * The allowlist entries: the file the operator names with `--allowlist`, else the one shipped beside this tool — NEVER a file of the scanned
 * repository (a scanned tree must not configure the control that judges it: §7 `owner-blind`). `[]` when there is none. A file that is not the
 * shape is an error, never "no entries". Whatever the file holds, `passes` passes only an entry that names the janitor's own file.
 */
export function loadAllowlist(explicit) {
  const file = [explicit, path.join(HERE, "..", ALLOWLIST_FILE)].find((candidate) => candidate !== undefined && fs.existsSync(candidate));
  if (file === undefined) return [];
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(parsed.entries) || !parsed.entries.every((entry) => typeof entry.file === "string" && Number.isInteger(entry.line) && /^[0-9a-f]{64}$/.test(entry.sha256))) {
    throw new Error(`${file} is not an allowlist: { entries: [{ file, line, sha256 }] }`);
  }
  return parsed.entries;
}

/** Rewrite the allowlist from the CURRENT janitor script: its broad, non-comment lines, by line number and hash. Returns the entries written. */
export function updateAllowlist(repo, explicit) {
  const script = path.join(repo, JANITOR_FILE);
  const lines = fs.readFileSync(script, "utf8").split(/\r?\n/);
  // the allowlist is the lines broad ON THEIR OWN: a line broad only through a variable's value is never entered, so the file this
  // writes cannot be widened by a binding (the inventory line's own variables are sanctioned by the entry, at read time)
  const entries = lines.flatMap((text, index) => (!isComment(text) && classifyLine(text) === "broad" ? [{ file: JANITOR_FILE, line: index + 1, sha256: lineSha256(text) }] : []));
  const target = explicit ?? path.join(repo, ALLOWLIST_FILE);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify({ about: "The only lines the owner-blind class of tools/leftovers-check.mjs passes: the janitor's inventory line, by file, 1-based line and sha256 of the line's text. Regenerate with: node tools/leftovers-check.mjs --update-allowlist. A reviewer reads the diff of this file beside the script.", entries }, null, 2)}\n`);
  return entries;
}

/** The applier of the repository's baseline (`true`, or `loadBaselineAt`'s result); `files` are what the scan will read, where a scope's proof must be. */
function appliedBaseline(baseline, repo, files) {
  const loaded = baseline === true ? loadBaselineAt(repo) : baseline;
  return createApplier(loaded, repo, BASELINE_FILE, new Set(files));
}

/**
 * Scan a repository: `{ files, findings }`. `files` is how many files were read — zero is a broken discovery. `identity` is the repository column of the token's
 * row: this repository's own for its own token, else blank (fails closed). `profile` is a `--profile` (`node`). `resolvers` is the yaml seam of `loadYaml`.
 * `baseline` is `true` (read the repository's one baseline path) or a loaded baseline (`loadBaselineAt`), else nothing: a baseline is read only when asked for.
 */
export function scanRepository({ repo, token = REPO_TOKEN, rule, identity = token === REPO_TOKEN ? REPO_ROW : "", allowlist, profile, resolvers, baseline } = {}) {
  const files = discover(repo, profile);
  const findings = [];
  const entries = Array.isArray(allowlist) ? allowlist : loadAllowlist(allowlist);
  let yamlModule;
  const yaml = () => (yamlModule ??= loadYaml(repo, resolvers)); // read at the first workflow, so a repository with none needs none
  const applier = baseline === undefined || baseline === false ? undefined : appliedBaseline(baseline, repo, files);
  let read = 0;
  for (const file of files) {
    const absolute = path.join(repo, file);
    if (!fs.existsSync(absolute)) continue;
    const bytes = fs.readFileSync(absolute);
    if (isBinary(bytes)) continue;
    read += 1;
    findings.push(...scanText(file, bytes.toString("utf8"), entries, yaml, applier));
  }
  if (applier !== undefined) findings.push(...applier.finalFindings()); // the global reconcile: every entry no line matched, whatever file it names
  const rulePath = resolveRule(repo, rule);
  const ruleText = rulePath === undefined ? "" : fs.readFileSync(rulePath, "utf8");
  const ruleName = ruleNameOf(rulePath);
  findings.push(...tokenFindings(ruleText, token, ruleName, identity), ...constantFindings(tokenConstants(repo, profile), token, ruleText, ruleName, identity), ...tokenFileFindings(repo, profile));
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.cls.localeCompare(b.cls));
  return { files: read, findings, rule: ruleName };
}

/** Run the guard: the exit code (0 clean, 1 findings, 2 scanned nothing, no yaml or bad arguments). `io` and `resolvers` (where `yaml` is looked for) are seams for tests. */
export function main(argv = process.argv.slice(2), io = { out: (text) => console.log(text), err: (text) => console.error(text) }, resolvers = undefined) {
  return runCli(argv, io, resolvers, { scanRepository, updateAllowlist, JANITOR_FILE, YamlMissingError, curesFor });
}

const invokedDirectly = (() => {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (invokedDirectly) process.exitCode = main();
