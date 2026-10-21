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
 *   owner-blind   a pattern, glob or filter that matches the prefix with no owner segment after it — the shape of a sweeper
 *                 that cannot tell one user's leftovers from another's. It takes NO inline exemption: the one pass is
 *                 `tools/fixtures/owner-blind-allowlist.json`, keyed by file, line and the sha256 of the line
 * plus two that are about the guard's own grammar:
 *   exemption     a `testsToDelete-exempt:` comment that is not well-formed
 *   token         this repository's token is not a row of the rule's `## Tokens` table (§1), or is of the owner grammar
 *
 * Why it exists as a script and not as a paragraph: the rule has said "name it, own it, remove it" since the
 * audit of 2026-10-14, and the audit found no compliant site in six repositories — a sentence nobody can be
 * told is red about is a sentence nobody follows. This file is the red.
 *
 * Run from anywhere:
 *
 *     node tools/leftovers-check.mjs [--repo <dir>] [--token <t>] [--identity <row>] [--rule <path>] [--allowlist <path>]
 *     node tools/leftovers-check.mjs --update-allowlist [--repo <dir>]
 *
 * `--update-allowlist` rewrites the allowlist from the CURRENT `tools/janitor.sh`: every non-comment line the classifier calls
 * broad in that one file, by its line number and hash. The diff is what a reviewer reads; nothing else is ever added.
 *
 * `--identity` is the "repository" column of the token's row in the rule's `## Tokens` table — which repository the token is.
 * It defaults to this repository's own row (`REPO_ROW`) ONLY for this repository's own token; any other `--token` without
 * an `--identity` fails closed, so a token can never be proven to belong to a repository by accident.
 *
 * Exit 0 clean, 1 with every finding printed (`file:line — <class> — <text>`), 2 when it scanned nothing or its
 * arguments are bad — an empty scan is a broken discovery, never a clean repository.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { LineCounter, parseDocument } from "yaml";

import { gitOutput } from "./lib/git.mjs";
import { OWNER_GRAMMAR, REPO_ROW, REPO_TOKEN } from "./lib/owned.mjs";
import { classifyLine, lineSha256 } from "./lib/sweeper-scan.mjs";
import { isReason } from "./ownership-check.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The files the scan never reads: the guard's own test carries the violations as fixture strings. A test pins this list. */
export const EXCLUDED_FILES = Object.freeze(["tools/leftovers-check.test.mjs"]);

/** Every class an exemption may name (`ryuk-off` never; `exemption` and `token` are not resources). */
export const EXEMPTIBLE = Object.freeze(["raw-temp", "raw-worktree", "docker-run", "docker-name", "legacy-name", "shared-store"]);

/**
 * TEMPORARY. The janitor's own tests still feed it names of the form before the owner segment, because the shipped janitor
 * still reads that form; the story that makes the janitor owner-aware retargets them and empties this list (a test pins that).
 * Only `legacy-name` is skipped in these files — every other class, owner-blind included, still applies.
 */
export const LEGACY_NAME_PENDING = Object.freeze(["tools/janitor.test.mjs", "tools/janitor-liveness.test.mjs", "tools/janitor-paths.test.mjs", "tools/owner-conformance.test.mjs"]);

/** The repository's one sweeper script and the file that allowlists its inventory line (rule §7). */
export const JANITOR_FILE = "tools/janitor.sh";
export const ALLOWLIST_FILE = "tools/fixtures/owner-blind-allowlist.json";

export const CURES = Object.freeze({
  "raw-temp": "Make temp folders with ownedDir(t, what) from tools/lib/owned.mjs — common/test-leftovers.md §7 (raw-temp), §2.",
  "raw-worktree": "Make worktrees with ownedWorktree(t, repo, what) from tools/lib/owned.mjs — common/test-leftovers.md §7 (raw-worktree), §3.",
  "docker-run": "Add --rm, or the complete carve-out: a testsToDelete name, a remover step on every path after the diagnostics — common/test-leftovers.md §5, §7 (docker-run).",
  "docker-name": "Give the container, volume, network, compose project or test-built image one of the three spellings of testsToDelete-<repo>-<what>-<id> — common/test-leftovers.md §1, §7 (docker-name).",
  "legacy-name": "Build every name with the owner segment: testsToDelete-<owner>-<repo>-<what>-<id> from ownedName()/the helper of this repository — common/test-leftovers.md §1, §7 (legacy-name).",
  "owner-blind": "Match the caller's owner after the prefix (^testsToDelete-<owner>-<repo>-), or delete the sweep and use the shipped janitor; this class takes no exemption — common/test-leftovers.md §7 (owner-blind), the barrier.",
  "shared-store": "Isolate the store per run, or add `testsToDelete-exempt: shared-store — <reason with lock: …>` — common/test-leftovers.md §6, §7 (shared-store).",
  "ryuk-off": "Leave Testcontainers' reaper on; this class takes no exemption — common/test-leftovers.md §5, §7 (ryuk-off).",
  exemption: "Write `testsToDelete-exempt: <class> — <reason>` with a class of §7 (not ryuk-off) and a real reason — common/test-leftovers.md §7 (the exemption grammar).",
  token: "Register this repository's token as a row of the rule's `## Tokens` table before using it — common/test-leftovers.md §1.",
});

const PREFIX_OK = /^teststodelete[-_][uw][0-9]{1,10}[-_]/i; // the OWNER form: one of the three spellings, then an owner segment
/** A name the guard may accept: one of the three spellings, or a value an argument array hides from it (never guessed at). */
const nameOk = (name) => PREFIX_OK.test(name) || name === DYNAMIC;
const TOKEN_SHAPE = /^[a-z0-9]{2,12}$/;
// The prefix is spelled in two pieces below: these are detectors, and the machine scan reads this file too.
const WORD = "teststo" + "delete";
const LEGACY_LITERAL = new RegExp(`${WORD}[-_]([a-z0-9]+)`, "gi");
/** The second segments that are not names: the quarantine sibling (`.<name>.<prefix>-quarantine-…`) and an environment variable (`TESTSTODELETE_OWNER`: upper case, underscore). */
const notAName = (match) => match[1].toLowerCase() === "exempt" || match[1].toLowerCase() === "quarantine" || new RegExp(`^${WORD.toUpperCase()}_[A-Z]+$`).test(match[0]);
const LEGACY_BUILT = new RegExp(`${WORD}[-_]\\$\\{?\\s*(?:REPO_TOKEN|RepoToken|repoToken)\\b`, "i");
const MARKER = /(?:\/\/|#|--|\/\*|\*|<!--)\s*testsToDelete-exempt:(.*)$/;
const JS_FILE = /\.(?:mjs|js|cjs)$/;

// --- discovery -----------------------------------------------------------------------------------------------

/** Whether a repository-relative path (forward slashes) is one the guard reads. `tools/lib/**` is product code, never scanned. */
export function isScanned(file) {
  if (EXCLUDED_FILES.includes(file) || file.startsWith("tools/lib/")) return false;
  return (
    (file.startsWith("tools/") && file.endsWith(".test.mjs")) ||
    (file.startsWith("tools/fixtures/") && JS_FILE.test(file)) ||
    /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file) ||
    (file.startsWith(".github/scripts/") && /\.(?:mjs|js|sh)$/.test(file)) ||
    /\.(?:sh|ps1)$/.test(file)
  );
}

/** Paths in code-unit order — the order a bare `.sort()` gives, stated, so it never depends on the locale. */
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** The files to read, from git's own idea of the tree (tracked plus untracked-not-ignored). Throws when `repo` is not a repository. */
export function discover(repo) {
  const listing = gitOutput(repo, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
  return [...new Set(listing.split("\0").filter(Boolean))].filter(isScanned).sort(byCodeUnit);
}

// --- lines, comments, exemptions -----------------------------------------------------------------------------

const isComment = (line) => /^\s*(?:\/\/|#|-- |--$)/.test(line);

const finding = (file, line, cls, text) => ({ file, line, cls, text });

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

/** `COMPOSE_PROJECT_NAME=x` or `: x` on a line: one hit when x is not a testsToDelete name — a compose project's containers carry the project's name. */
function composeEnvHits(line) {
  return [...line.matchAll(/COMPOSE_PROJECT_NAME["']?\s*[:=]\s*["']?([^\s"';,}]*)/g)]
    .filter((match) => !PREFIX_OK.test(match[1]))
    .map((match) => `COMPOSE_PROJECT_NAME is not a testsToDelete name: ${match[1] === "" ? "(empty)" : match[1]}`);
}

/** `legacy-name` hits of a line: a literal whose second segment is no owner (and no `exempt` marker word), or a prefix built from the token alone. */
function legacyNameHits(line) {
  const literal = [...line.matchAll(LEGACY_LITERAL)]
    .filter((match) => !notAName(match) && !OWNER_GRAMMAR.test(match[1].toLowerCase()))
    .map((match) => match[0]);
  return LEGACY_BUILT.test(line) ? [...literal, "a prefix built from the repository token"] : literal;
}

/** Is the line allowlisted: the file, the 1-based line and the hash of its text all equal one entry. */
const allowed = (allowlist, file, number, text) => allowlist.some((entry) => entry.file === file && entry.line === number && entry.sha256 === lineSha256(text));

function lineFindings(file, lines, exemptions, allowlist) {
  const extra = RAW_TEMP_BY_EXTENSION[path.extname(file)] ?? [];
  const found = [];
  const add = (index, cls, text) => {
    if (cls === "ryuk-off" || !isExempt(exemptions, cls, index + 1)) found.push(finding(file, index + 1, cls, text));
  };
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
    for (const [cls, hits] of checks) if (hits.length > 0) add(index, cls, [...new Set(hits)].map((hit) => `\`${hit}\``).join(", "));
    // owner-blind: no exemption of any kind — the allowlist (file, line, hash) is the one pass
    if (classifyLine(line) === "broad" && !allowed(allowlist, file, index + 1, line)) found.push(finding(file, index + 1, "owner-blind", "matches the prefix with no owner segment after it"));
  });
  return found;
}

// --- docker --------------------------------------------------------------------------------------------------

/** Logical command lines (a trailing `\` joins the next), skipping whole-line comments: `{ line, text }`, `line` 1-based, within [from, to). */
function commandsIn(lines, from, to) {
  const commands = [];
  for (let index = from; index < to; index += 1) {
    if (isComment(lines[index])) continue;
    let text = lines[index];
    const line = index + 1;
    while ((/\\\s*$/.test(text) || OPEN_DOCKER_ARRAY.test(text)) && index + 1 < to) {
      index += 1;
      text = `${text.replace(/\\\s*$/, " ")} ${lines[index].trim()}`;
    }
    commands.push({ line, text: flattenDockerArrays(text) });
  }
  return commands;
}

// A JavaScript test starts docker as `execFileSync("docker", ["run", "--rm", …])`: the arguments are an array, not a command line.
// Each such call is rewritten to the command line it stands for (`docker run --rm …`), so every class below reads one shape. An
// item that is not a string literal is a value the guard cannot see: it becomes DYNAMIC and is never guessed at.
const DYNAMIC = "«value»";
const OPEN_DOCKER_ARRAY = /(["'`])docker\1\s*,\s*\[[^\]]*$/;
const DOCKER_ARRAY = /(["'`])docker\1\s*,\s*\[([^\]]*)\]/g;

/** The top-level, comma-separated items of an array body (a comma inside quotes or brackets does not split). */
function arrayItems(body) {
  const items = [];
  let item = "";
  let quote = "";
  let depth = 0;
  for (const char of body) {
    if (quote !== "") quote = char === quote ? "" : quote;
    else if (/["'`]/.test(char)) quote = char;
    else if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    if (char === "," && quote === "" && depth === 0) {
      items.push(item);
      item = "";
    } else item += char;
  }
  return [...items, item].map((entry) => entry.trim()).filter(Boolean);
}

const itemWord = (item) => /^(["'`])(.*)\1$/s.exec(item)?.[2].replace(/\s+/g, "_") ?? DYNAMIC;

/** `execFileSync("docker", ["run", "--rm", NAME])` → `execFileSync( docker run --rm «value» )`: the words the shell form has. */
function flattenDockerArrays(text) {
  return text.replace(DOCKER_ARRAY, (_match, _quote, body) => ` docker ${arrayItems(body).map(itemWord).join(" ")} `);
}

const words = (text) => text.split(/\s+/).filter(Boolean).map((word) => word.replace(/^["']+|["',;]+$/g, ""));

/** The value of `--flag value` / `--flag=value` (repeatable), from a command's words. */
function flagValues(tokens, flags) {
  const values = [];
  tokens.forEach((token, index) => {
    for (const flag of flags) {
      if (token === flag && tokens[index + 1] !== undefined) values.push(tokens[index + 1]);
      else if (token.startsWith(`${flag}=`)) values.push(token.slice(flag.length + 1));
    }
  });
  return values;
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const stripTag = (image) => image.replace(/:[^:/]*$/, "");

/** The named volumes of a `docker run` (a source with no `/`, not starting `.`, `$` or `~`, not a drive letter). */
function namedVolumes(tokens) {
  return flagValues(tokens, ["-v", "--volume"])
    .map((spec) => spec.split(":")[0])
    .filter((source) => source !== "" && !/[/\\]/.test(source) && !/^[.$~]/.test(source) && !/^[A-Za-z]$/.test(source));
}

const NETWORK_OPTIONS_WITH_VALUE = new Set(["-d", "--driver", "--label", "-l", "-o", "--opt", "--subnet", "--gateway", "--ip-range", "--scope", "--ipam-driver", "--name"]);

/** The name argument of `docker volume|network create`, or "" when there is none. */
function createdName(tokens, createAt) {
  for (let index = createAt + 1; index < tokens.length; index += 1) {
    if (!tokens[index].startsWith("-")) return tokens[index];
    if (NETWORK_OPTIONS_WITH_VALUE.has(tokens[index])) index += 1;
  }
  return "";
}

const COMPOSE_VALUE_FLAGS = new Set(["-f", "--file", "-p", "--project-name", "--profile", "--env-file", "--project-directory", "--parallel", "--ansi", "--progress"]);

/** The project names a `docker compose` / `docker-compose` command line gives, from its GLOBAL options only (`-p` after the subcommand is `--publish`). */
function composeProjectNames(tokens) {
  const at = tokens.findIndex((token, index) => token === "docker-compose" || (token === "compose" && tokens[index - 1] === "docker"));
  if (at < 0) return [];
  const names = [];
  for (let index = at + 1; index < tokens.length && tokens[index].startsWith("-"); index += 1) {
    const token = tokens[index];
    const inline = /^--project-name=(.*)$/.exec(token);
    if (inline !== null) names.push(inline[1]);
    else if (COMPOSE_VALUE_FLAGS.has(token)) {
      if (token === "-p" || token === "--project-name") names.push(tokens[index + 1] ?? "");
      index += 1;
    }
  }
  return names;
}

/** `docker-name` findings of one command; `pushed` is the set of images the scope publishes. */
function nameFindings(file, command, pushed) {
  const tokens = words(command.text);
  const found = [];
  const bad = (text) => found.push(finding(file, command.line, "docker-name", text));
  if (/\bdocker\b/.test(command.text)) {
    const arrayForm = [...command.text.matchAll(/["']--name["']\s*,\s*["']([^"']*)["']/g)].map((match) => match[1]);
    for (const name of [...flagValues(tokens, ["--name"]), ...arrayForm]) if (!nameOk(name)) bad(`\`--name ${name}\` is not a testsToDelete name`);
  }
  for (const match of command.text.matchAll(/\bdocker\s+(volume|network)\s+create\b/g)) {
    const name = createdName(tokens, tokens.indexOf("create", tokens.indexOf(match[1])));
    if (name === "") bad(`\`docker ${match[1]} create\` makes an unnamed ${match[1]}`);
    else if (!nameOk(name)) bad(`\`docker ${match[1]} create ${name}\` is not a testsToDelete name`);
  }
  for (const name of composeProjectNames(tokens)) if (!PREFIX_OK.test(name)) bad(`the compose project \`${name}\` is not a testsToDelete name`);
  for (const match of command.text.matchAll(/\bWithName\(\s*"([^"]*)"/g)) if (!PREFIX_OK.test(match[1])) bad(`\`WithName("${match[1]}")\` is not a testsToDelete name`);
  if (/\bdocker\s+build\b/.test(command.text)) {
    for (const tag of flagValues(tokens, ["-t", "--tag"])) {
      const published = [...pushed].some((image) => image === tag || stripTag(image) === stripTag(tag));
      if (!nameOk(tag) && !published) bad(`the image \`${tag}\` a test builds is not a testsToDelete name`);
    }
  }
  return found;
}

const pushedImages = (commands) => new Set(commands.flatMap((command) => [...command.text.matchAll(/\bdocker\s+push\s+(\S+)/g)].map((match) => match[1].replace(/^["']|["']$/g, ""))));

const RUN_COMMAND = /\bdocker\s+run\b/;
const hasRm = (tokens) => tokens.includes("--rm") || tokens.some((token) => token.startsWith("--rm="));

function removerWords(name, volumes) {
  const container = new RegExp(`docker\\s+rm\\s+-f\\s+-v\\s+${escapeRegExp(name)}(?![\\w.-])`);
  return { container, volumes: volumes.map((volume) => new RegExp(`docker\\s+volume\\s+rm\\s+${escapeRegExp(volume)}(?![\\w.-])`)) };
}

/** The `.sh` carve-out: a `trap '…' EXIT` on an earlier line whose body removes the container and each volume with `|| true`. */
function trapCoversRun(lines, runLine, name, volumes) {
  const wanted = [`docker\\s+rm\\s+-f\\s+-v\\s+${escapeRegExp(name)}\\s*\\|\\|\\s*true`, ...volumes.map((volume) => `docker\\s+volume\\s+rm\\s+${escapeRegExp(volume)}\\s*\\|\\|\\s*true`)];
  return lines.slice(0, runLine - 1).some((line) => {
    const trap = /\btrap\s+(["'])(.*?)\1\s+EXIT\b/.exec(line);
    return trap !== null && wanted.every((pattern) => new RegExp(pattern).test(trap[2]));
  });
}

/** What a `docker run` command declares: whether it carries `--rm`, and the one name and volumes the carve-out must clean up. */
function runFacts(command) {
  const tokens = words(command.text);
  const names = flagValues(tokens, ["--name"]);
  return { rm: hasRm(tokens), name: names[0], volumes: namedVolumes(tokens) };
}

const dropsRm = (file, command) => finding(file, command.line, "docker-run", "`docker run` permits dropping --rm: no complete carve-out (§5)");

function scriptRunFindings(file, lines, commands) {
  return commands
    .filter((command) => RUN_COMMAND.test(command.text))
    .flatMap((command) => {
      const facts = runFacts(command);
      if (facts.rm) return [];
      const covered = facts.name !== undefined && [facts.name, ...facts.volumes].every((name) => PREFIX_OK.test(name)) && trapCoversRun(lines, command.line, facts.name, facts.volumes);
      return covered ? [] : [dropsRm(file, command)];
    });
}

/** A workflow step reduced to what the carve-out reads. */
function stepFacts(step, lineCounter, linesCount) {
  const startLine = lineCounter.linePos(step.range[0]).line;
  const endLine = Math.min(linesCount, Math.max(startLine, lineCounter.linePos(Math.max(step.range[0], step.range[1] - 1)).line));
  const run = step.get("run");
  const guard = String(step.get("if") ?? "");
  const keeps = step.get("continue-on-error");
  return {
    startLine,
    endLine,
    run: typeof run === "string" ? run : "",
    always: guard.includes("always()"),
    continues: keeps === true || keeps === "true",
  };
}

function readsName(step, name) {
  const reader = new RegExp(`docker\\s+(?:logs|cp|inspect|wait|exec|diff)\\b[^\\n]*${escapeRegExp(name)}(?![\\w.-])`);
  return reader.test(step.run.replace(/\\\r?\n\s*/g, " "));
}

function removesAll(step, name, volumes) {
  const text = step.run.replace(/\\\r?\n\s*/g, " ");
  const { container, volumes: volumeRemovers } = removerWords(name, volumes);
  return step.always && step.continues && container.test(text) && volumeRemovers.every((remover) => remover.test(text));
}

/** The workflow carve-out: a LATER `if: always()` + `continue-on-error: true` step removes everything, after every reader. */
function stepCoversRun(steps, at, facts) {
  if (facts.name === undefined || ![facts.name, ...facts.volumes].every((name) => PREFIX_OK.test(name))) return false;
  const lastReader = steps.reduce((last, step, index) => (readsName(step, facts.name) ? index : last), -1);
  return steps.some((step, index) => index > at && index > lastReader && removesAll(step, facts.name, facts.volumes));
}

function jobRunFindings(file, steps, commands) {
  return commands
    .filter((command) => RUN_COMMAND.test(command.text))
    .flatMap((command) => {
      const at = steps.findIndex((step) => command.line >= step.startLine && command.line <= step.endLine);
      const facts = runFacts(command);
      if (facts.rm) return [];
      return at >= 0 && stepCoversRun(steps, at, facts) ? [] : [dropsRm(file, command)];
    });
}

function workflowJobs(file, lines, text) {
  const lineCounter = new LineCounter();
  const document = parseDocument(text, { lineCounter });
  if (document.errors.length > 0) return undefined;
  const jobs = document.get("jobs", true);
  const found = [];
  for (const pair of jobs?.items ?? []) {
    const job = pair.value;
    const stepsNode = job?.get?.("steps", true);
    const steps = (stepsNode?.items ?? []).filter((step) => typeof step?.get === "function").map((step) => stepFacts(step, lineCounter, lines.length));
    const from = lineCounter.linePos(job.range[0]).line - 1;
    const to = Math.min(lines.length, lineCounter.linePos(Math.max(job.range[0], job.range[1] - 1)).line);
    found.push({ steps, from, to });
  }
  return found;
}

function dockerFindings(file, lines, text) {
  const isWorkflow = /^\.github\/workflows\//.test(file);
  const jobs = isWorkflow ? workflowJobs(file, lines, text) : undefined;
  if (jobs === undefined) {
    const commands = commandsIn(lines, 0, lines.length);
    const pushed = pushedImages(commands);
    return [...commands.flatMap((command) => nameFindings(file, command, pushed)), ...scriptRunFindings(file, lines, commands)];
  }
  return jobs.flatMap(({ steps, from, to }) => {
    const commands = commandsIn(lines, from, to);
    const pushed = pushedImages(commands);
    return [...commands.flatMap((command) => nameFindings(file, command, pushed)), ...jobRunFindings(file, steps, commands)];
  });
}

// --- one file, the whole repository --------------------------------------------------------------------------

/** Every finding of one file's text (`file` is the repository-relative path with forward slashes). */
export function scanText(file, text, allowlist = []) {
  const lines = text.split(/\r?\n/);
  const exemptions = readExemptions(file, lines);
  const docker = dockerFindings(file, lines, text).filter((entry) => !isExempt(exemptions, entry.cls, entry.line));
  return [...exemptions.findings, ...lineFindings(file, lines, exemptions, allowlist), ...docker];
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
export function tokenFindings(ruleText, token, rulePath = "common/test-leftovers.md", identity = REPO_ROW) {
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
    if (row.family !== "dew_flow") found.push(...at(row.line, `the row \`${row.token}\` of ${rulePath} has family \`${row.family}\`; this public copy lists only \`dew_flow\``));
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

/** Every token constant of the repository: `[{ file, line, value }]`. */
export function tokenConstants(repo) {
  const found = [];
  for (const file of candidateFiles(repo)) {
    if (!CONSTANT_FILE.test(file) || EXCLUDED_FILES.includes(file) || !fs.existsSync(path.join(repo, file))) continue;
    const lines = fs.readFileSync(path.join(repo, file), "utf8").split(/\r?\n/);
    lines.forEach((text, index) => found.push(...lineConstants(text, index).map((entry) => ({ file, ...entry }))));
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

/** The rule text the token is checked against: `--rule`, else the repository's own, else the one beside this tool. */
export function resolveRule(repo, rule) {
  const candidates = rule === undefined ? [path.join(repo, "common", "test-leftovers.md"), path.join(HERE, "..", "common", "test-leftovers.md")] : [rule];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

/** The allowlist entries: `--allowlist`, else the repository's own file, else the one beside this tool; `[]` when there is none. A file that is not the shape is an error, never "no entries". */
export function loadAllowlist(repo, explicit) {
  const file = [explicit, path.join(repo, ALLOWLIST_FILE), path.join(HERE, "..", ALLOWLIST_FILE)].find((candidate) => candidate !== undefined && fs.existsSync(candidate));
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
  const entries = lines.flatMap((text, index) => (!isComment(text) && classifyLine(text) === "broad" ? [{ file: JANITOR_FILE, line: index + 1, sha256: lineSha256(text) }] : []));
  const target = explicit ?? path.join(repo, ALLOWLIST_FILE);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify({ about: "The only lines the owner-blind class of tools/leftovers-check.mjs passes: the janitor's inventory line, by file, 1-based line and sha256 of the line's text. Regenerate with: node tools/leftovers-check.mjs --update-allowlist. A reviewer reads the diff of this file beside the script.", entries }, null, 2)}\n`);
  return entries;
}

/** Scan a repository: `{ files, findings }`. `files` is how many files were read — zero is a broken discovery. `identity` is the repository column of the token's row: this repository's own for its own token, else blank (fails closed). */
export function scanRepository({ repo, token = REPO_TOKEN, rule, identity = token === REPO_TOKEN ? REPO_ROW : "", allowlist } = {}) {
  const files = discover(repo);
  const findings = [];
  const entries = Array.isArray(allowlist) ? allowlist : loadAllowlist(repo, allowlist);
  for (const file of files) {
    const absolute = path.join(repo, file);
    if (fs.existsSync(absolute)) findings.push(...scanText(file, fs.readFileSync(absolute, "utf8"), entries));
  }
  const rulePath = resolveRule(repo, rule);
  const ruleText = rulePath === undefined ? "" : fs.readFileSync(rulePath, "utf8");
  const ruleName = rulePath === undefined ? "common/test-leftovers.md (not found)" : path.basename(path.dirname(rulePath)) + "/" + path.basename(rulePath);
  findings.push(...tokenFindings(ruleText, token, ruleName, identity), ...constantFindings(tokenConstants(repo), token, ruleText, ruleName, identity));
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.cls.localeCompare(b.cls));
  return { files: files.length, findings };
}

// --- the command line ----------------------------------------------------------------------------------------

const USAGE = "usage: node tools/leftovers-check.mjs [--repo <dir>] [--token <t>] [--identity <row>] [--rule <path>] [--allowlist <path>] | --update-allowlist   (--identity: the repository column of the token's row; without it only this repository's own token passes)";

/** Parse the arguments: `{ repo, token, rule, identity }` (`identity` stays unset unless given) or `{ error }`. */
export function parseArguments(argv) {
  const options = { repo: process.cwd(), token: REPO_TOKEN, rule: undefined, identity: undefined, allowlist: undefined, update: false };
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index].replace(/^--/, "");
    if (argv[index] === "--update-allowlist") {
      options.update = true;
      index -= 1; // a flag takes no value
      continue;
    }
    if (!["repo", "token", "identity", "rule", "allowlist"].includes(name) || !argv[index].startsWith("--") || argv[index + 1] === undefined) return { error: `unknown or incomplete argument \`${argv[index]}\`` };
    options[name] = ["token", "identity"].includes(name) ? argv[index + 1] : path.resolve(argv[index + 1]);
  }
  return options;
}

function report(findings, io) {
  const printed = new Set();
  io.err(`leftovers-check: ${findings.length} finding(s) — see common/test-leftovers.md §7`);
  for (const entry of findings) {
    io.err(`  ${entry.file}:${entry.line} — ${entry.cls} — ${entry.text}`);
    printed.add(entry.cls);
  }
  io.err("");
  for (const cls of Object.keys(CURES).filter((name) => printed.has(name))) io.err(`  ${cls}: ${CURES[cls]}`);
}

function runUpdate(options, io) {
  try {
    const entries = updateAllowlist(options.repo, options.allowlist);
    io.out(`leftovers-check: allowlist rewritten — ${entries.length} entr${entries.length === 1 ? "y" : "ies"} from ${JANITOR_FILE}`);
    return 0;
  } catch (error) {
    io.err(`leftovers-check: cannot update the allowlist: ${error.message.split("\n")[0]}`);
    return 2;
  }
}

/** Run the guard: the exit code (0 clean, 1 findings, 2 scanned nothing or bad arguments). `io` is a seam for tests. */
export function main(argv = process.argv.slice(2), io = { out: (text) => console.log(text), err: (text) => console.error(text) }) {
  const options = parseArguments(argv);
  if (options.error !== undefined) {
    io.err(`leftovers-check: ${options.error}\n${USAGE}`);
    return 2;
  }
  if (options.update) return runUpdate(options, io);
  let result;
  try {
    result = fs.existsSync(options.repo) ? scanRepository(options) : { files: 0, findings: [] };
  } catch (error) {
    io.err(`leftovers-check: cannot read ${options.repo}: ${error.message.split("\n")[0]}`);
    return 2;
  }
  if (result.files === 0) {
    io.err(`leftovers-check: scanned nothing under ${options.repo} — discovery broke; the repository is not clean`);
    return 2;
  }
  if (result.findings.length === 0) {
    io.out(`leftovers-check: clean (${result.files} files).`);
    return 0;
  }
  report(result.findings, io);
  return 1;
}

const invokedDirectly = (() => {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (invokedDirectly) process.exitCode = main();
