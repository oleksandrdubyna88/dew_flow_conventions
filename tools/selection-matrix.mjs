#!/usr/bin/env node
// selection-matrix.mjs — the selection baseline of todo/PLAN_node_rule_parity.md (sections 4.1, 4.3, 5; D12).
//
// `research/selection-matrix.json` records the exact ids each of 108 representative scopes selects (12 file sets x 9 tasks),
// the single-read pins (the scopes that must fit one 32 KiB read) and the gate records. The rule-body freeze hashes a rule's
// body after its front matter, so an edit to `paths`, `tasks` or `path_tasks` — which changes what every consumer's agents
// receive — passes it. This file is what notices: tools/selection-matrix.test.mjs fails on a hand edit and on a selector
// change nobody regenerated for.
//
// Run:    node tools/selection-matrix.mjs            verify the committed file against the catalog (exit 0 / 1)
//         node tools/selection-matrix.mjs --write    regenerate it (temporary file, then rename)
//         node tools/selection-matrix.mjs --bytes    print the summed-bytes table (research/module_rules.md)
// Anything else is usage, exit 2. The files are the catalog's own; the tool reads no history and needs no git.

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCatalog, selectRules } from "./lib/rule-catalog.mjs";
import { folded } from "./lib/rule-body.mjs";

export const MATRIX_FILE = "research/selection-matrix.json";

export const FILE_SETS = Object.freeze([
  [], ["src/x.cs"], ["src/x.csproj"], ["Directory.Build.props"], ["ui/a.ts"], ["src/a.mjs"],
  ["src/x.cs", "ui/a.ts"], ["package.json"], ["tsconfig.json"], [".npmrc"], ["src/webview/page.ts"], ["src/main.rs"],
].map(files => Object.freeze(files)));

export const TASKS_PINNED = Object.freeze(["inspect", "ui", "gpu", "storage", "implement", "test", "audit", "logging", "dependencies"]);

const SINGLE_READ_TASKS = Object.freeze(["inspect", "ui", "gpu", "storage"]);
const scopeName = (task, files) => files.length ? `${task} ${files.join(" + ")}` : `${task} (no file)`;

export const SCOPES = Object.freeze(TASKS_PINNED.flatMap(task => FILE_SETS.map(files => Object.freeze({ name: scopeName(task, files), tasks: [task], files }))));

// The 22 pins (plan section 5): scopes that fit one read today and stay on the single-read list.
const PINNED = {
  inspect: ["", "src/x.cs", "src/x.csproj", "ui/a.ts", "tsconfig.json", ".npmrc", "Directory.Build.props", "src/a.mjs", "src/webview/page.ts"],
  ui: ["", "tsconfig.json", ".npmrc", "Directory.Build.props"],
  gpu: ["", "src/x.cs", "tsconfig.json", ".npmrc", "Directory.Build.props"],
  storage: ["", "tsconfig.json", ".npmrc", "Directory.Build.props"],
};

// Bytes of the 18 scopes that were over one read when the baseline was taken (E1, after the whitespace splits).
const OVER = {
  inspect: { "src/x.cs + ui/a.ts": 34703, "package.json": 35409, "src/main.rs": 40743 },
  ui: { "package.json": 37622, "src/main.rs": 42956 },
  gpu: { "src/x.csproj": 35375, "ui/a.ts": 33563, "src/x.cs + ui/a.ts": 38176, "package.json": 38882, "src/webview/page.ts": 33563, "src/main.rs": 44216 },
  storage: { "src/x.cs": 34019, "src/x.csproj": 37101, "ui/a.ts": 35289, "src/x.cs + ui/a.ts": 39902, "package.json": 40608, "src/webview/page.ts": 35289, "src/main.rs": 45942 },
};
const UI_LANGUAGE = { "src/x.cs": null, "src/x.csproj": 34115, "ui/a.ts": null, "src/a.mjs": null, "src/x.cs + ui/a.ts": 36916, "src/webview/page.ts": null };
const D5 = "D5: ui with a language file is off the single-read list (plan section 5)";
const SPLIT = {
  gpu: { "src/a.mjs": "fits today (27,680 B); a split read after E3 (about 33,839 B), 32,380 B or less after E4; unpinned by the plan (section 5)" },
  storage: { "src/a.mjs": "fits today (29,406 B); about 35,565 B after E3 and about 33,300 B after E6 — over one read, unpinned (plan section 5)" },
};
const bytes = number => number.toLocaleString("en-US");

// The 48 single-read scope names -> { oneRead: true } or { oneRead: false, why }.
export const ONE_READ = Object.freeze(Object.fromEntries(SINGLE_READ_TASKS.flatMap(task => FILE_SETS.map(files => {
  const key = files.join(" + ");
  const name = scopeName(task, files);
  if (PINNED[task].includes(key)) return [name, Object.freeze({ oneRead: true })];
  if (task === "ui" && Object.hasOwn(UI_LANGUAGE, key)) {
    const over = UI_LANGUAGE[key];
    return [name, Object.freeze({ oneRead: false, why: over ? `${D5}; over one read today: ${bytes(over)} B` : D5 })];
  }
  if (SPLIT[task]?.[key]) return [name, Object.freeze({ oneRead: false, why: SPLIT[task][key] })];
  if (OVER[task]?.[key]) return [name, Object.freeze({ oneRead: false, why: `over one read today: ${bytes(OVER[task][key])} B` })];
  throw new Error(`selection-matrix: no pin or reason for ${name}`);
}))));

// Gate records, written by the epic that lands the rule (todo/PLAN_node_rule_parity.md section 4.4). Empty at E1.
export const GATES = Object.freeze({});

const NOTE = "The exact ids each representative scope selects, the single-read pins and the gate records "
  + "(todo/PLAN_node_rule_parity.md sections 4.1, 4.3, 5; D12). Generated by tools/selection-matrix.mjs --write; the test "
  + "fails on a hand edit or a selection the file does not record. Owning epics add gate records to GATES in the tool.";

/** Code-unit order, stated, so the file never depends on the locale. */
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const idsOf = (catalog, scope) => selectRules(catalog, scope.tasks, [...scope.files]).map(rule => rule.id).sort(byCodeUnit);

export function render(catalog) {
  const entries = SCOPES.map(scope => {
    const pin = ONE_READ[scope.name];
    const head = [`"name": ${JSON.stringify(scope.name)}`, `"tasks": ${JSON.stringify(scope.tasks)}`, `"files": ${JSON.stringify(scope.files)}`];
    if (pin) head.push(`"oneRead": ${pin.oneRead}`);
    if (pin && !pin.oneRead) head.push(`"why": ${JSON.stringify(pin.why)}`);
    return `    {${head.join(", ")},\n     "ids": ${JSON.stringify(idsOf(catalog, scope))}}`;
  });
  const gates = JSON.stringify(GATES, null, 2).replaceAll("\n", "\n  ");
  return `{\n  "note": ${JSON.stringify(NOTE)},\n  "scopes": [\n${entries.join(",\n")}\n  ],\n  "gates": ${gates}\n}\n`;
}

// What moved, per scope: the ids a recorded scope no longer selects and the ids it now selects that it did not.
export function idDrift(catalog, parsed) {
  const findings = [];
  const recorded = new Map((parsed.scopes ?? []).map(scope => [scope.name, scope]));
  for (const scope of SCOPES) {
    const entry = recorded.get(scope.name);
    if (!entry) { findings.push(`${scope.name}: not recorded in ${MATRIX_FILE}`); continue; }
    const now = idsOf(catalog, scope);
    const added = now.filter(id => !entry.ids.includes(id));
    const removed = entry.ids.filter(id => !now.includes(id));
    if (added.length || removed.length) {
      findings.push(`${scope.name}: the selection moved${added.length ? `; now also ${added.join(", ")}` : ""}${removed.length ? `; no longer ${removed.join(", ")}` : ""}`);
    }
  }
  const known = new Set(SCOPES.map(scope => scope.name));
  for (const name of recorded.keys()) if (!known.has(name)) findings.push(`${name}: recorded but not a scope of the tool`);
  return findings;
}

// F9 of the E1 stories document: summed bytes of the selected rules, one row per file set, one column per task.
export function bytesTable(catalog) {
  const rows = FILE_SETS.map(files => {
    const cells = TASKS_PINNED.map(task => bytes(selectRules(catalog, [task], [...files]).reduce((sum, rule) => sum + rule.bytes, 0)));
    const first = files.length ? files.map(file => `\`${file}\``).join(" + ") : "(no file)";
    return `| ${first} | ${cells.join(" | ")} |`;
  });
  return [`| Files | ${TASKS_PINNED.join(" | ")} |`, `|---|${TASKS_PINNED.map(() => "---:").join("|")}|`, ...rows].join("\n");
}

export function main(argv, root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")) {
  const usage = () => { console.error("usage: node tools/selection-matrix.mjs [--write | --bytes]"); return 2; };
  if (argv.length > 1 || (argv.length === 1 && !["--write", "--bytes"].includes(argv[0]))) return usage();
  const catalog = loadCatalog(root);
  const file = path.join(root, MATRIX_FILE);
  if (argv[0] === "--bytes") { console.log(bytesTable(catalog)); return 0; }
  const text = render(catalog);
  if (argv[0] === "--write") {
    const temporary = `${file}.tmp`;
    try {
      fs.writeFileSync(temporary, text);
      fs.renameSync(temporary, file);
    } catch (error) {
      try { fs.rmSync(temporary, { force: true }); } catch { /* the failure below is the one to report */ }
      console.error(`selection-matrix: ${MATRIX_FILE} could not be written (${error.message}); nothing was changed.`);
      return 1;
    }
    console.log(`selection-matrix: ${MATRIX_FILE} written (${SCOPES.length} scopes). The diff beside the rule change is what a reviewer reads.`);
    return 0;
  }
  // Line endings folded, as every other reader of the corpus does: `core.autocrlf` rewrites a checkout on Windows.
  const current = fs.existsSync(file) ? folded(fs.readFileSync(file, "utf8")) : "";
  if (current === text) { console.log(`selection-matrix: in step — ${SCOPES.length} scopes.`); return 0; }
  let parsed = {};
  try { parsed = JSON.parse(current); } catch { /* an unreadable file is reported below */ }
  const moved = idDrift(catalog, parsed);
  console.error(`selection-matrix: ${MATRIX_FILE} is out of step with the catalog.`);
  for (const finding of moved) console.error(`  ${finding}`);
  if (!moved.length) console.error("  The ids agree; the file differs in its note, pins, reasons or layout from what the tool renders.");
  console.error("  If the change was deliberate: node tools/selection-matrix.mjs --write, and read the diff.");
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
