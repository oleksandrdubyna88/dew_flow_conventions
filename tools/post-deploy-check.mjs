#!/usr/bin/env node
/**
 * `POST_DEPLOY.md` — checked for shape in CI, and RUN against the deployed thing after a deploy.
 *
 * Enforces [common/post-deploy-checks.md](../common/post-deploy-checks.md). Two modes, and the
 * difference between them is the whole point of the rule:
 *
 *   (default)          structural only. No network, no commands executed. Is the file there, is it
 *                      still under its cap, does every item carry a command or admit it is manual,
 *                      does it say when it was last verified and against what.
 *   --target <value>   additionally RUNS each automated item against that target. This is the only
 *                      mode that produces evidence, because the rule's premise is that a green build
 *                      says nothing about the machine now running it.
 *
 * ON EXECUTING COMMANDS. Run mode spawns the file's `Check` commands through a shell — they contain
 * pipes, and a checklist that cannot pipe is a checklist people keep outside the file.
 * [common/security.md](../common/security.md) forbids a shell STRING built from input, and that is
 * exactly what is avoided here: the command text is the repository's own content, and `--target`,
 * the one value from outside, is exported as `$TARGET` and never substituted into the text. Every
 * command runs under a timeout that kills its process tree.
 *
 * Usage (from a repository root):
 *
 *     node .claude/rules/shared/tools/post-deploy-check.mjs [options]
 *
 *       --file <path>      default: POST_DEPLOY.md
 *       --target <value>   run the automated items against this target (exported as $TARGET)
 *       --timeout <ms>     per command (default 30000)
 *       --warn             report findings but exit 0 — the state a repository starts in
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { run } from "./lib/proc.mjs";

/** The cap the rule states. A number, because "keep it short" is not something a check can read. */
const MAX_ITEMS = 12;

const options = {
  file: { type: "string", default: "POST_DEPLOY.md" },
  target: { type: "string" },
  timeout: { type: "string", default: "30000" },
  warn: { type: "boolean", default: false },
};

/** Rows of the first markdown table in the document, as arrays of trimmed cells. */
export function parseTable(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line, i) =>
    line.trim().startsWith("|") && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? ""));
  if (start < 0) return { headers: [], rows: [] };

  const cells = (line) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const headers = cells(lines[start]);
  const rows = [];
  for (let i = start + 2; i < lines.length; i += 1) {
    if (!lines[i].trim().startsWith("|")) break;
    rows.push(cells(lines[i]));
  }
  return { headers, rows };
}

/** Locate the columns by their headings, so a file may add columns without breaking the check. */
function columnsOf(headers) {
  const find = (...needles) =>
    headers.findIndex((h) => needles.some((n) => h.toLowerCase().includes(n)));
  return {
    symptom: find("lose", "breaks", "symptom", "what a person"),
    check: find("check", "command"),
    auto: find("auto", "how"),
  };
}

/** The command inside a cell's backticks, or "" — a cell without one has no command to run. */
function commandOf(cell) {
  return /`([^`]+)`/.exec(cell)?.[1]?.trim() ?? "";
}

export function inspect(text) {
  const findings = [];
  const { headers, rows } = parseTable(text);

  if (!/^\s*Target:\s*\S/m.test(text)) {
    findings.push('no "Target:" line — the file must name the thing it checks and how to reach it');
  }
  const stamp = /^\s*Last verified:\s*(.+)$/m.exec(text);
  if (!stamp) {
    findings.push('no "Last verified:" stamp — a list nobody has run is the same as no list');
  } else if (!/\d{4}-\d{2}-\d{2}/.test(stamp[1])) {
    findings.push(`the "Last verified:" stamp carries no date: ${stamp[1].trim()}`);
  }

  if (rows.length === 0) {
    findings.push("no table of items — nothing here can be run or counted");
    return { findings, items: [] };
  }

  const columns = columnsOf(headers);
  if (columns.symptom < 0 || columns.check < 0 || columns.auto < 0) {
    findings.push(`the table's headings do not name what a person loses, the check, and auto/manual: ${headers.join(" | ")}`);
    return { findings, items: [] };
  }

  if (rows.length > MAX_ITEMS) {
    findings.push(`${rows.length} items — the cap is ${MAX_ITEMS}. A new item enters only with the removal of a named weaker one.`);
  }

  const items = [];
  rows.forEach((row, index) => {
    const number = index + 1;
    const symptom = row[columns.symptom] ?? "";
    const check = row[columns.check] ?? "";
    const auto = (row[columns.auto] ?? "").toLowerCase();
    const command = commandOf(check);

    if (symptom.length === 0 || symptom === "…") {
      findings.push(`item ${number} does not say what a person loses if it is broken`);
    }
    if (!["auto", "manual"].includes(auto)) {
      findings.push(`item ${number} is neither "auto" nor "manual" (found "${row[columns.auto] ?? ""}")`);
    }
    if (auto === "auto" && command.length === 0) {
      findings.push(`item ${number} claims to be automated but its check holds no \`command\``);
    }
    items.push({ number, symptom, command, manual: auto !== "auto" });
  });

  return { findings, items };
}

async function runItems(items, target, timeoutMs) {
  const env = { ...process.env, TARGET: target };
  let failed = 0;

  for (const item of items) {
    if (item.manual || item.command.length === 0) continue;
    const result = await run(item.command, [], { env, timeoutMs, shell: true });
    const ok = result.code === 0 && !result.timedOut;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${item.number}. ${item.symptom}`);
    if (!ok) {
      failed += 1;
      console.log(`        ${item.command}`);
      const detail = result.timedOut
        ? `timed out after ${timeoutMs} ms`
        : (result.err.trim().split("\n")[0] || result.out.trim().split("\n")[0] || `exit ${result.code}`);
      console.log(`        ${detail}`);
    }
  }
  return failed;
}

async function main() {
  const { values: flags } = parseArgs({ options });
  const file = path.resolve(process.cwd(), flags.file);

  if (!fs.existsSync(file)) {
    console.log(`post-deploy-check: ${flags.file} is missing.`);
    console.log("  post-deploy-checks.md: every repository has one — where nothing is deployed anywhere");
    console.log("  yet, your own installation is the target and the list still runs at every release.");
    return flags.warn ? 0 : 1;
  }

  const { findings, items } = inspect(fs.readFileSync(file, "utf8"));
  const automated = items.filter((i) => !i.manual).length;
  console.log(`post-deploy-check: ${flags.file} — ${items.length} item(s), ${automated} automated, cap ${MAX_ITEMS}.`);

  for (const finding of findings) console.log(`  ${finding}`);

  if (!flags.target) {
    if (findings.length === 0) console.log("post-deploy-check: shape OK. Pass --target <value> to actually run it.");
    return findings.length === 0 ? 0 : (flags.warn ? 0 : 1);
  }

  console.log(`post-deploy-check: running ${automated} automated item(s) against ${flags.target}`);
  const failed = await runItems(items, flags.target, Number(flags.timeout));

  const manual = items.filter((i) => i.manual);
  for (const item of manual) console.log(`  MANUAL  ${item.number}. ${item.symptom}`);
  if (manual.length > 0) {
    console.log(`post-deploy-check: ${manual.length} item(s) need a person — this run does not cover them.`);
  }

  if (failed > 0) {
    console.log("");
    console.log(`${failed} check(s) FAILED against ${flags.target}. The deploy is not done.`);
    return 1;
  }
  if (findings.length > 0) return flags.warn ? 0 : 1;

  console.log(`post-deploy-check: every automated item passed. Update the "Last verified:" stamp.`);
  return 0;
}

// Only when run as a command. `inspect` and `parseTable` are imported by selftest.test.mjs, and a
// module that runs its main on import cannot be tested — nor should importing it execute anything.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(`post-deploy-check: ${error.stack ?? error.message}`);
      process.exit(4);
    });
}
