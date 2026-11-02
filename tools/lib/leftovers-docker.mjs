/**
 * The docker pass of `tools/leftovers-check.mjs` (rule §7: `docker-run`, `docker-name`): logical command lines, the names a command creates, and the carve-out of a
 * `docker run` without `--rm`, for a script, a workflow step and a JavaScript argument array. Moved whole out of the guard so it stays under the file-size limit of
 * the coding style; nothing here changed.
 */

import { DYNAMIC, MASK, PREFIX_OK, closingOf, finding, isComment, isDynamicName, literalizeSingleQuoted, maskExpansions, nameOk, restoreDollar } from "./leftovers-shell.mjs";

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

const itemWord = (item) => {
  const literal = /^(["'`])(.*)\1$/s.exec(item);
  if (literal === null || (literal[1] === "`" && /^\$\{[^]*\}$/.test(literal[2]) && closingOf(literal[2], 1) === literal[2].length - 1)) return DYNAMIC; // a template that is wholly one `${…}` is a value, not a literal
  return literal[2].replace(/\s+/g, "_");
};

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
  const tokens = words(maskExpansions(literalizeSingleQuoted(command.text))).map((word) => word.replaceAll(MASK, " "));
  const found = [];
  const bad = (text) => found.push(finding(file, command.line, "docker-name", restoreDollar(text)));
  if (/\bdocker\b/.test(command.text)) {
    const arrayForm = [...command.text.matchAll(/["']--name["']\s*,\s*["']([^"']*)["']/g)].map((match) => match[1]);
    for (const name of [...flagValues(tokens, ["--name"]), ...arrayForm]) if (!nameOk(name)) bad(`\`--name ${name}\` is not an owner-form leftover name`);
  }
  for (const match of command.text.matchAll(/\bdocker\s+(volume|network)\s+create\b/g)) {
    const name = createdName(tokens, tokens.indexOf("create", tokens.indexOf(match[1])));
    if (name === "") bad(`\`docker ${match[1]} create\` makes an unnamed ${match[1]}`);
    else if (!nameOk(name)) bad(`\`docker ${match[1]} create ${name}\` is not an owner-form leftover name`);
  }
  for (const name of composeProjectNames(tokens)) if (!PREFIX_OK.test(name) && !isDynamicName(name)) bad(`the compose project \`${name}\` is not an owner-form leftover name`);
  for (const match of command.text.matchAll(/\bWithName\(\s*"([^"]*)"/g)) if (!PREFIX_OK.test(match[1])) bad(`\`WithName("${match[1]}")\` is not an owner-form leftover name`);
  if (/\bdocker\s+build\b/.test(command.text)) {
    for (const tag of flagValues(tokens, ["-t", "--tag"])) {
      const published = [...pushed].some((image) => image === tag || stripTag(image) === stripTag(tag));
      if (!nameOk(tag) && !published) bad(`the image \`${tag}\` a test builds is not an owner-form leftover name`);
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

function workflowJobs(file, lines, text, yaml) {
  const { LineCounter, parseDocument } = yaml();
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

export function dockerFindings(file, lines, text, yaml) {
  const isWorkflow = /^\.github\/workflows\//.test(file);
  const jobs = isWorkflow ? workflowJobs(file, lines, text, yaml) : undefined;
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

