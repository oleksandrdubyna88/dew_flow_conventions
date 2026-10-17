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
 * plus two that are about the guard's own grammar:
 *   exemption     a `testsToDelete-exempt:` comment that is not well-formed
 *   token         this repository's token is not a row of the rule's `## Tokens` table (§1)
 *
 * Why it exists as a script and not as a paragraph: the rule has said "name it, own it, remove it" since the
 * audit of 2026-10-14, and the audit found no compliant site in six repositories — a sentence nobody can be
 * told is red about is a sentence nobody follows. This file is the red.
 *
 * Run from anywhere:
 *
 *     node tools/leftovers-check.mjs [--repo <dir>] [--token <t>] [--rule <path>]
 *
 * Exit 0 clean, 1 with every finding printed (`file:line — <class> — <text>`), 2 when it scanned nothing or its
 * arguments are bad — an empty scan is a broken discovery, never a clean repository.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { LineCounter, parseDocument } from "yaml";

import { gitOutput } from "./lib/git.mjs";
import { REPO_TOKEN } from "./lib/owned.mjs";
import { isReason } from "./ownership-check.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The files the scan never reads: the guard's own test carries the violations as fixture strings. A test pins this list. */
export const EXCLUDED_FILES = Object.freeze(["tools/leftovers-check.test.mjs"]);

/** Every class an exemption may name (`ryuk-off` never; `exemption` and `token` are not resources). */
export const EXEMPTIBLE = Object.freeze(["raw-temp", "raw-worktree", "docker-run", "docker-name", "shared-store"]);

export const CURES = Object.freeze({
  "raw-temp": "Make temp folders with ownedDir(t, what) from tools/lib/owned.mjs — common/test-leftovers.md §7 (raw-temp), §2.",
  "raw-worktree": "Make worktrees with ownedWorktree(t, repo, what) from tools/lib/owned.mjs — common/test-leftovers.md §7 (raw-worktree), §3.",
  "docker-run": "Add --rm, or the complete carve-out: a testsToDelete name, a remover step on every path after the diagnostics — common/test-leftovers.md §5, §7 (docker-run).",
  "docker-name": "Give the container, volume, network, compose project or test-built image one of the three spellings of testsToDelete-<repo>-<what>-<id> — common/test-leftovers.md §1, §7 (docker-name).",
  "shared-store": "Isolate the store per run, or add `testsToDelete-exempt: shared-store — <reason with lock: …>` — common/test-leftovers.md §6, §7 (shared-store).",
  "ryuk-off": "Leave Testcontainers' reaper on; this class takes no exemption — common/test-leftovers.md §5, §7 (ryuk-off).",
  exemption: "Write `testsToDelete-exempt: <class> — <reason>` with a class of §7 (not ryuk-off) and a real reason — common/test-leftovers.md §7 (the exemption grammar).",
  token: "Register this repository's token as a row of the rule's `## Tokens` table before using it — common/test-leftovers.md §1.",
});

const PREFIX_OK = /^teststodelete[-_]/i;
const TOKEN_SHAPE = /^[a-z0-9]{2,12}$/;
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

/** The files to read, from git's own idea of the tree (tracked plus untracked-not-ignored). Throws when `repo` is not a repository. */
export function discover(repo) {
  const listing = gitOutput(repo, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
  return [...new Set(listing.split("\0").filter(Boolean))].filter(isScanned).sort();
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

function lineFindings(file, lines, exemptions) {
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
    ];
    for (const [cls, hits] of checks) if (hits.length > 0) add(index, cls, [...new Set(hits)].map((hit) => `\`${hit}\``).join(", "));
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
    while (/\\\s*$/.test(text) && index + 1 < to) {
      index += 1;
      text = `${text.replace(/\\\s*$/, " ")}${lines[index].trim()}`;
    }
    commands.push({ line, text });
  }
  return commands;
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
    for (const name of [...flagValues(tokens, ["--name"]), ...arrayForm]) if (!PREFIX_OK.test(name)) bad(`\`--name ${name}\` is not a testsToDelete name`);
  }
  for (const match of command.text.matchAll(/\bdocker\s+(volume|network)\s+create\b/g)) {
    const name = createdName(tokens, tokens.indexOf("create", tokens.indexOf(match[1])));
    if (name === "") bad(`\`docker ${match[1]} create\` makes an unnamed ${match[1]}`);
    else if (!PREFIX_OK.test(name)) bad(`\`docker ${match[1]} create ${name}\` is not a testsToDelete name`);
  }
  for (const name of composeProjectNames(tokens)) if (!PREFIX_OK.test(name)) bad(`the compose project \`${name}\` is not a testsToDelete name`);
  for (const match of command.text.matchAll(/\bWithName\(\s*"([^"]*)"/g)) if (!PREFIX_OK.test(match[1])) bad(`\`WithName("${match[1]}")\` is not a testsToDelete name`);
  if (/\bdocker\s+build\b/.test(command.text)) {
    for (const tag of flagValues(tokens, ["-t", "--tag"])) {
      const published = [...pushed].some((image) => image === tag || stripTag(image) === stripTag(tag));
      if (!PREFIX_OK.test(tag) && !published) bad(`the image \`${tag}\` a test builds is not a testsToDelete name`);
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
export function scanText(file, text) {
  const lines = text.split(/\r?\n/);
  const exemptions = readExemptions(file, lines);
  const docker = dockerFindings(file, lines, text).filter((entry) => !isExempt(exemptions, entry.cls, entry.line));
  return [...exemptions.findings, ...lineFindings(file, lines, exemptions), ...docker];
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
    const [token = "", family = ""] = cells(section[index]);
    rows.push({ token: token.replace(/`/g, ""), family, line: start + index + 2 });
  }
  return { heading: start + 1, header: cells(section[headerAt]), rows };
}

const EXPECTED_HEADER = ["token", "family", "repository"];

/** Findings (class `token`) when `token` is not a registered row of `ruleText`'s `## Tokens` table. Fails closed: a rule with no table registers nothing. */
export function tokenFindings(ruleText, token, rulePath = "common/test-leftovers.md") {
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
  for (const row of table.rows) {
    if (seen.has(row.token)) found.push(...at(row.line, `the token \`${row.token}\` is listed twice in ${rulePath}`));
    seen.add(row.token);
    if (row.family !== "dew_flow") found.push(...at(row.line, `the row \`${row.token}\` of ${rulePath} has family \`${row.family}\`; this public copy lists only \`dew_flow\``));
  }
  if (!seen.has(token)) found.push(...at(table.heading, `the token \`${token}\` is not a row of the \`## Tokens\` table of ${rulePath}`));
  return found;
}

// --- the repository ------------------------------------------------------------------------------------------

/** The rule text the token is checked against: `--rule`, else the repository's own, else the one beside this tool. */
export function resolveRule(repo, rule) {
  const candidates = rule === undefined ? [path.join(repo, "common", "test-leftovers.md"), path.join(HERE, "..", "common", "test-leftovers.md")] : [rule];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

/** Scan a repository: `{ files, findings }`. `files` is how many files were read — zero is a broken discovery. */
export function scanRepository({ repo, token = REPO_TOKEN, rule } = {}) {
  const files = discover(repo);
  const findings = [];
  for (const file of files) {
    const absolute = path.join(repo, file);
    if (fs.existsSync(absolute)) findings.push(...scanText(file, fs.readFileSync(absolute, "utf8")));
  }
  const rulePath = resolveRule(repo, rule);
  const ruleText = rulePath === undefined ? "" : fs.readFileSync(rulePath, "utf8");
  findings.push(...tokenFindings(ruleText, token, rulePath === undefined ? "common/test-leftovers.md (not found)" : path.basename(path.dirname(rulePath)) + "/" + path.basename(rulePath)));
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.cls.localeCompare(b.cls));
  return { files: files.length, findings };
}

// --- the command line ----------------------------------------------------------------------------------------

const USAGE = "usage: node tools/leftovers-check.mjs [--repo <dir>] [--token <t>] [--rule <path>]";

/** Parse the arguments: `{ repo, token, rule }` or `{ error }`. */
export function parseArguments(argv) {
  const options = { repo: process.cwd(), token: REPO_TOKEN, rule: undefined };
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index].replace(/^--/, "");
    if (!["repo", "token", "rule"].includes(name) || !argv[index].startsWith("--") || argv[index + 1] === undefined) return { error: `unknown or incomplete argument \`${argv[index]}\`` };
    options[name] = name === "token" ? argv[index + 1] : path.resolve(argv[index + 1]);
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

/** Run the guard: the exit code (0 clean, 1 findings, 2 scanned nothing or bad arguments). `io` is a seam for tests. */
export function main(argv = process.argv.slice(2), io = { out: (text) => console.log(text), err: (text) => console.error(text) }) {
  const options = parseArguments(argv);
  if (options.error !== undefined) {
    io.err(`leftovers-check: ${options.error}\n${USAGE}`);
    return 2;
  }
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
