// The parity matrix (E1.S3): research/parity-inventory.json lists every requirement of todo/PLAN_node_rule_parity.md section 3
// (P, R, G); research/parity-matrix.json has one row per entry with a C# side and a TypeScript side. In the first epic every
// real row is `planned` or `deliberately-absent`; the machinery that will hold an ACTIVATED row to its claims is proven here
// on fixtures that carry the planned selectors of P2 and P3, and on the real section headings for the MUST/SHOULD mood.
//
// `parityFindings` lives in this file on purpose: it is the check the owning epics run, and a test is where a check this
// size is kept honest. It does not read git history and needs no network.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { loadCatalog, selectRules } from "./lib/rule-catalog.mjs";
import { bodyOf, sectionsOf } from "./lib/rule-body.mjs";
import { LANDED_EPICS } from "./lib/parity-epics.mjs";
import { ownedDir } from "./lib/owned.mjs";
import { TASKS_PINNED } from "./selection-matrix.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => {
  const full = path.join(sourceRoot, file);
  assert.ok(fs.existsSync(full), `${file} is missing — E1.S3 writes it from the tables of the plan (the inventory and the matrix are the contract this test holds)`);
  return JSON.parse(fs.readFileSync(full, "utf8"));
};

// ---- the check ---------------------------------------------------------------------------------------------------------

const OWNING_EPICS = Object.freeze(["E2", "E3", "E4", "E5", "E6"]);
const ID = /^[PRG][1-9][0-9]*$/;
const RULE_ID = /^[a-z][a-z0-9.-]*$/;
const NAME = /^[a-z0-9][a-z0-9-]*$/;
const INVENTORY_STATUS = ["counterpart", "deliberately-absent", "planned"];
const ROW_STATUS = ["planned", "equal", "stronger-ts", "stronger-cs", "deliberately-absent"];
const CONSEQUENCES = ["none", "test-fails", "check-fails", "build-fails", "hook-refuses"];
const ROW_KEYS = ["inventory", "topic", "status", "epic", "reason", "strength", "csharp", "typescript"];
const ACTIVE_KEYS = ["delivery", "enforcement", "selectors", "mood", "consequence", "suppression"];
const MIN_REASON = 20;

// Plan section 4.1: a requirement that is deliberately stronger on one side. P4 only: complexity is lint-enforced in
// TypeScript and prose in C#. Any other `stronger-*` row is a finding with or without a reason.
export const STRONGER_EXCEPTIONS = Object.freeze(["P4"]);

// Plan section 4.1: the file sets that stand for each other across the two languages. The configuration kind (the
// compiler's own file, `tsconfig.json`) is deliberately not paired with a C# file: it is not compared.
export const CORRESPONDENCE = Object.freeze([
  [[], []],
  [["src/x.cs"], ["ui/a.ts"]],
  [["src/x.cs"], ["src/a.mjs"]],
  [["src/x.cs"], ["src/webview/page.ts"]],
  [["src/x.csproj"], ["package.json"]],
]);

const epicNumber = epic => (typeof epic === "string" && /^E[1-9]$/.test(epic) ? Number(epic.slice(1)) : null);
const same = (a, b) => a.length === b.length && new Set(a).size === new Set(b).size && a.every(item => b.includes(item));
const text = value => typeof value === "string" && value.trim().length > 0;
const idsOf = side => (side.delivery ?? []).map(item => item.id);
const listFiles = files => (files.length ? files.join(" + ") : "none");

/** Which of the four variants a side is: `absent`, `planned`, `present` (a deliberately-absent row's existing text), `active`. */
export function sideShape(side) {
  if (!side || typeof side !== "object" || Array.isArray(side)) return "invalid";
  const keys = Object.keys(side);
  if (side.absent === true) return keys.length === 1 ? "absent" : "invalid";
  if (Object.hasOwn(side, "planned")) return keys.every(key => ["planned", "delivery"].includes(key)) ? "planned" : "invalid";
  if (keys.length === 1 && keys[0] === "delivery") return "present";
  return ACTIVE_KEYS.every(key => Object.hasOwn(side, key)) && keys.every(key => ACTIVE_KEYS.includes(key)) ? "active" : "invalid";
}

/** Whether any of the rules is selected for the one task and these files — a side's delivery is the UNION of its locations. */
export function union(catalog, ids, tasks, files) {
  const selected = new Set(selectRules(catalog, tasks, files).map(rule => rule.id));
  return ids.some(id => selected.has(id));
}

/**
 * Whether a heading carries (MANDATORY) itself or through an ancestor: walk from the section's own heading to each preceding
 * heading of a lower level up to the H1. A section under a marked H1 is as binding as the H1 says.
 */
export function isMandatory(sections, section) {
  let index = sections.indexOf(section);
  if (index < 0) return false;
  let level = /^#+/.exec(section)[0].length;
  if (section.includes("(MANDATORY)")) return true;
  for (index -= 1; index >= 0; index -= 1) {
    const here = /^#+/.exec(sections[index])[0].length;
    if (here >= level) continue;
    level = here;
    if (sections[index].includes("(MANDATORY)")) return true;
  }
  return false;
}

/** The `CHECKED_RULES` a check tool exports; a missing file or export is a finding, not an exception. */
export async function checkedRules(root, tool) {
  if (!NAME.test(tool)) return { finding: `check tool ${JSON.stringify(tool)} is not a plain tool name` };
  const file = path.join(root, "tools", `${tool}.mjs`);
  if (!fs.existsSync(file)) return { finding: `tools/${tool}.mjs does not exist` };
  let loaded;
  try { loaded = await import(pathToFileURL(file).href); } catch (error) { return { finding: `tools/${tool}.mjs does not load: ${error.message}` }; }
  if (!Array.isArray(loaded.CHECKED_RULES)) return { finding: `tools/${tool}.mjs does not export CHECKED_RULES` };
  return { rules: loaded.CHECKED_RULES };
}

export async function parityFindings({ inventory, matrix, catalog, sectionsById, landedEpics, root }) {
  const findings = [];
  const byId = new Map(catalog.map(rule => [rule.id, rule]));
  const entries = Array.isArray(inventory?.entries) ? inventory.entries : [];
  const rows = Array.isArray(matrix?.rows) ? matrix.rows : [];

  // (1) the inventory
  const seen = new Set();
  for (const entry of entries) {
    const here = `inventory ${entry.id}`;
    if (!ID.test(entry.id ?? "")) findings.push(`${here}: an id is P, R or G and a number`);
    if (seen.has(entry.id)) findings.push(`${here}: id appears twice`);
    seen.add(entry.id);
    if (!text(entry.topic)) findings.push(`${here}: a topic is required`);
    if (!["csharp", "typescript", "both"].includes(entry.side)) findings.push(`${here}: side is csharp, typescript or both`);
    if (!INVENTORY_STATUS.includes(entry.status)) findings.push(`${here}: status is ${INVENTORY_STATUS.join(", ")}`);
    if (entry.status === "planned" && !OWNING_EPICS.includes(entry.epic)) findings.push(`${here}: a planned entry names an owning epic among ${OWNING_EPICS.join(", ")}`);
    if (entry.status !== "planned" && Object.hasOwn(entry, "epic")) findings.push(`${here}: only a planned entry has an epic`);
    if (entry.status === "deliberately-absent" && !(typeof entry.reason === "string" && entry.reason.trim().length >= MIN_REASON)) findings.push(`${here}: a deliberately-absent entry carries a reason of at least ${MIN_REASON} characters`);
    if (entry.status !== "deliberately-absent" && Object.hasOwn(entry, "reason")) findings.push(`${here}: only a deliberately-absent entry has a reason`);
    for (const absence of entry.scopedAbsences ?? []) {
      if (!text(absence?.scope) || !(typeof absence?.reason === "string" && absence.reason.trim().length >= MIN_REASON)) findings.push(`${here}: a scoped absence is { scope, reason of at least ${MIN_REASON} characters }`);
    }
  }
  const entryById = new Map(entries.map(entry => [entry.id, entry]));

  // (2) one to one
  const rowCount = new Map();
  for (const row of rows) rowCount.set(row.inventory, (rowCount.get(row.inventory) ?? 0) + 1);
  for (const entry of entries) {
    if (!rowCount.has(entry.id)) findings.push(`${entry.id}: the inventory has no matrix row`);
  }
  for (const [id, count] of rowCount) {
    if (!entryById.has(id)) findings.push(`${id}: a matrix row with no inventory entry`);
    else if (count > 1) findings.push(`${id}: ${count} matrix rows for one inventory entry`);
  }

  for (const row of rows) {
    const id = row.inventory;
    const entry = entryById.get(id);
    const before = findings.length;
    for (const key of Object.keys(row)) {
      if (key === "suppression") findings.push(`${id}: suppression lives on each active side, never on the row`);
      else if (!ROW_KEYS.includes(key)) findings.push(`${id}: unknown row field ${key}`);
    }
    if (entry && entry.topic !== row.topic) findings.push(`${id}: topic differs from the inventory's`);
    if (!text(row.strength)) findings.push(`${id}: a strength phrase is required`);
    const sides = { csharp: row.csharp, typescript: row.typescript };
    const kinds = Object.fromEntries(Object.entries(sides).map(([name, side]) => [name, sideShape(side)]));
    for (const [name, kind] of Object.entries(kinds)) if (kind === "invalid") findings.push(`${id}: the ${name} side is none of absent, planned, present or active`);
    const values = Object.values(kinds);

    // (4) a planned side
    for (const [name, side] of Object.entries(sides)) {
      if (kinds[name] !== "planned") continue;
      if (!OWNING_EPICS.includes(side.planned)) findings.push(`${id}: the ${name} side is planned for ${side.planned}, which is no owning epic (${OWNING_EPICS.join(", ")})`);
      for (const location of side.delivery ?? []) if (!RULE_ID.test(location?.id ?? "")) findings.push(`${id}: the ${name} side intends a delivery id that is not a rule id`);
    }

    // (5) the row's status follows from its sides
    const planned = values.includes("planned");
    const absent = values.includes("absent");
    let expected = null;
    if (values.includes("invalid")) expected = null;
    else if (planned && !absent) expected = ["planned"];
    else if (absent && !planned && values.every(kind => kind === "absent" || kind === "present")) expected = ["deliberately-absent"];
    else if (values.every(kind => kind === "active")) expected = ["equal", "stronger-ts", "stronger-cs"];
    const presentMisplaced = values.includes("present") && !(expected?.[0] === "deliberately-absent");
    if (presentMisplaced) findings.push(`${id}: the present-side variant (just a delivery) is valid only in a deliberately-absent row`);
    else if (expected === null && !values.includes("invalid")) findings.push(`${id}: the sides (${values.join(", ")}) are not a legal combination`);
    if (!ROW_STATUS.includes(row.status)) findings.push(`${id}: status is ${ROW_STATUS.join(", ")}`);
    else if (expected && !expected.includes(row.status)) findings.push(`${id}: status ${row.status} does not follow from the sides (${values.join(", ")}); expected ${expected.join(" or ")}`);

    // the epic of a planned row is the latest of its planned sides
    const epic = row.epic;
    let epicOk = false;
    if (row.status === "planned") {
      if (!OWNING_EPICS.includes(epic)) findings.push(`${id}: a planned row names its owning epic among ${OWNING_EPICS.join(", ")} (found ${epic === undefined ? "none" : epic})`);
      else {
        epicOk = true;
        const sideEpics = Object.entries(sides).filter(([name]) => kinds[name] === "planned").map(([, side]) => side.planned);
        if (sideEpics.every(item => OWNING_EPICS.includes(item))) {
          const latest = Math.max(...sideEpics.map(epicNumber));
          if (epicNumber(epic) !== latest) findings.push(`${id}: the row's epic ${epic} is not the latest of its planned sides (E${latest})`);
        }
        // (8) a planned row of a landed epic
        if (landedEpics.includes(epic)) findings.push(`${id}: planned for ${epic}, which has landed — the row must be active, absent or removed`);
      }
    } else if (Object.hasOwn(row, "epic")) findings.push(`${id}: only a planned row has an epic`);

    // (6) strength and the reason
    if (row.status === "stronger-ts" || row.status === "stronger-cs") {
      if (!STRONGER_EXCEPTIONS.includes(id)) findings.push(`${id}: ${row.status} is whitelisted for ${STRONGER_EXCEPTIONS.join(", ")} only`);
      else if (!text(row.reason)) findings.push(`${id}: a stronger row records its reason`);
    } else if (Object.hasOwn(row, "reason")) {
      findings.push(`${id}: only a stronger row carries a reason here; a deliberately-absent reason is the inventory's`);
    }

    // (7) inventory and row agree
    if (entry && ROW_STATUS.includes(row.status)) {
      const wanted = row.status === "planned" ? "planned" : row.status === "deliberately-absent" ? "deliberately-absent" : "counterpart";
      if (entry.status !== wanted) findings.push(`${id}: the inventory says ${entry.status}, the row says ${row.status}`);
      else if (wanted === "planned" && epicOk && entry.epic !== epic) findings.push(`${id}: the inventory says epic ${entry.epic}, the row says ${epic}`);
    }

    // (3) delivery locations of an active side and of a deliberately-absent row's present side
    for (const [name, side] of Object.entries(sides)) {
      if (kinds[name] !== "active" && kinds[name] !== "present") continue;
      if (!Array.isArray(side.delivery) || !side.delivery.length) { findings.push(`${id}: the ${name} side names no delivery location`); continue; }
      for (const location of side.delivery) {
        if (!byId.has(location?.id)) findings.push(`${id}: the ${name} side delivers in ${location?.id}, which is not a rule in the catalog`);
        else if (!(sectionsById.get(location.id) ?? []).includes(location.section)) findings.push(`${id}: the ${name} side delivers in ${location.id} under ${JSON.stringify(location.section)}, which is not one of its sections`);
      }
    }
    if (findings.length > before) continue; // a row already wrong in shape or location is not also judged against reality

    // (10) an active side against reality
    const active = Object.entries(sides).filter(([name]) => kinds[name] === "active");
    for (const [name, side] of active) {
      for (const item of side.selectors) {
        const rule = byId.get(item?.id);
        if (!rule) { findings.push(`${id}: the ${name} side lists selectors for ${item?.id}, which is not a rule`); continue; }
        for (const [field, actual] of [["paths", rule.paths], ["path_tasks", rule.pathTasks], ["tasks", rule.tasks]]) {
          if (!Array.isArray(item[field]) || !same(item[field], actual)) findings.push(`${id}: the ${name} side's ${field} for ${rule.id} is ${JSON.stringify(item[field])}, the front matter says ${JSON.stringify(actual)}`);
        }
      }
      const mandatory = side.delivery.some(location => isMandatory(sectionsById.get(location.id), location.section));
      if (!["MUST", "SHOULD"].includes(side.mood)) findings.push(`${id}: the ${name} side's mood is MUST or SHOULD`);
      else if ((side.mood === "MUST") !== mandatory) findings.push(`${id}: the ${name} side says ${side.mood}, but its sections ${mandatory ? "carry" : "do not carry"} (MANDATORY) themselves or through a heading above them`);
      if (!CONSEQUENCES.includes(side.consequence)) findings.push(`${id}: the ${name} side's consequence is ${CONSEQUENCES.join(", ")}`);
      if (!["none", "inline-with-reason"].includes(side.suppression)) findings.push(`${id}: the ${name} side's suppression is none or inline-with-reason`);
      if (!Array.isArray(side.enforcement) || !side.enforcement.length) { findings.push(`${id}: the ${name} side lists no enforcement class (prose is one)`); continue; }
      for (const item of side.enforcement) {
        if (item.class === "prose") continue;
        if (item.class === "test") {
          const file = typeof item.test === "string" ? path.resolve(root, item.test) : null;
          if (!file || !file.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(file)) findings.push(`${id}: the ${name} side's test ${JSON.stringify(item.test)} does not exist`);
        } else if (item.class === "check") {
          const loaded = await checkedRules(root, item.tool);
          if (loaded.finding) findings.push(`${id}: the ${name} side's check — ${loaded.finding}`);
          else for (const rule of idsOf(side)) if (!loaded.rules.includes(rule)) findings.push(`${id}: the ${name} side's check ${item.tool} does not list ${rule} in CHECKED_RULES`);
        } else if (item.class === "hook") {
          if (!NAME.test(item.hook ?? "") || !fs.existsSync(path.join(root, "settings/hooks", `${item.hook}.mjs`))) findings.push(`${id}: the ${name} side's hook ${JSON.stringify(item.hook)} is not settings/hooks/<hook>.mjs`);
        } else findings.push(`${id}: the ${name} side's enforcement class ${JSON.stringify(item.class)} is prose, test, check or hook`);
      }
    }

    // (9) equality: the union of each side's delivery behaves the same on the corresponding file sets, and the facts agree
    if (row.status === "equal" && active.length === 2) {
      const [cs, ts] = [row.csharp, row.typescript];
      for (const task of TASKS_PINNED) {
        for (const [csFiles, tsFiles] of CORRESPONDENCE) {
          const csDelivers = union(catalog, idsOf(cs), [task], csFiles);
          const tsDelivers = union(catalog, idsOf(ts), [task], tsFiles);
          if (csDelivers !== tsDelivers) findings.push(`${id}: for the task ${task} on ${listFiles(csFiles)} (C#) and ${listFiles(tsFiles)} (TypeScript), C# ${csDelivers ? "delivers" : "delivers nothing"} and TypeScript ${tsDelivers ? "delivers" : "delivers nothing"}`);
        }
      }
      if (cs.mood !== ts.mood) findings.push(`${id}: mood differs (${cs.mood} against ${ts.mood})`);
      if (!same([...new Set(cs.enforcement.map(item => item.class))], [...new Set(ts.enforcement.map(item => item.class))])) findings.push(`${id}: enforcement classes differ`);
      if (cs.consequence !== ts.consequence) findings.push(`${id}: consequence differs (${cs.consequence} against ${ts.consequence})`);
      if (cs.suppression !== ts.suppression) findings.push(`${id}: suppression differs (${cs.suppression} against ${ts.suppression})`);
    }
  }
  return findings;
}

// ---- helpers for the cases ---------------------------------------------------------------------------------------------

const clone = value => structuredClone(value);
const realSections = () => new Map(read("research/rule-bodies.json").rules.map(rule => [rule.id, rule.sections]));
const sectionsFromCatalog = catalog => new Map(catalog.map(rule => [rule.id, sectionsOf(bodyOf(rule.text))]));
const selectorsFor = (catalog, ids) => ids.map(id => {
  const rule = catalog.find(candidate => candidate.id === id);
  return { id, paths: [...rule.paths], path_tasks: [...rule.pathTasks], tasks: [...rule.tasks] };
});
const realCatalog = loadCatalog(sourceRoot);
const realWorld = () => ({ inventory: read("research/parity-inventory.json"), matrix: read("research/parity-matrix.json"), catalog: realCatalog, sectionsById: realSections(), landedEpics: LANDED_EPICS, root: sourceRoot });
const rowOf = (world, id) => world.matrix.rows.find(row => row.inventory === id);
const entryOf = (world, id) => world.inventory.entries.find(entry => entry.id === id);
const named = (findings, ...patterns) => patterns.every(pattern => findings.some(finding => pattern.test(finding)));

// An active side: delivery locations (id, section), enforcement, selectors read from the catalog, mood, consequence, suppression.
function activeSide(catalog, delivery, extra = {}) {
  return {
    delivery: delivery.map(([id, section]) => ({ id, section })),
    enforcement: [{ class: "check", tool: "strictness-check" }],
    selectors: selectorsFor(catalog, delivery.map(([id]) => id)),
    mood: "SHOULD",
    consequence: "check-fails",
    suppression: "inline-with-reason",
    ...extra,
  };
}

// The real-row proof of P2 and P3: the real C# doctrine, the TypeScript doctrine with E3's planned front matter, the
// compiler-strictness rule, the always core, and a check tool exporting CHECKED_RULES — all in an owned folder.
function proofWorld(t, { checked = ["csharp.doctrine", "typescript.doctrine", "typescript.compiler-strictness"], withP4 = false } = {}) {
  const root = ownedDir(t, "parity proof");
  for (const name of ["common/coding-style.md", "common/knowledge-base.md", "common/security.md", "csharp/doctrine.md"]) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, name), path.join(root, name));
  }
  fs.mkdirSync(path.join(root, "typescript"), { recursive: true });
  const paths = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts", "**/*.js", "**/*.mjs", "**/*.cjs", "**/package.json"];
  fs.writeFileSync(path.join(root, "typescript/doctrine.md"), `---\nid: "typescript.doctrine"\nload: "conditional"\npaths: ${JSON.stringify(paths)}\n---\n# TypeScript doctrine\n\n## 0. The compiler is the floor\n\nA statement every source-file scope sees.\n`);
  fs.writeFileSync(path.join(root, "typescript/compiler-strictness.md"), `---\nid: "typescript.compiler-strictness"\nload: "conditional"\npaths: ["**/tsconfig*.json"]\n---\n# Compiler strictness\n\n## 1. Strict mode\n\nThe configuration file says it.\n`);
  fs.mkdirSync(path.join(root, "tools"), { recursive: true });
  fs.writeFileSync(path.join(root, "tools/strictness-check.mjs"), `export const CHECKED_RULES = ${JSON.stringify(checked)};\n`);
  fs.mkdirSync(path.join(root, "settings/hooks"), { recursive: true });
  fs.writeFileSync(path.join(root, "settings/hooks/probe.mjs"), "// a hook that exists\n");
  const catalog = loadCatalog(root);
  const sectionsById = sectionsFromCatalog(catalog);
  const cs = () => activeSide(catalog, [["csharp.doctrine", "## 1. Language & runtime"]]);
  const ts = () => activeSide(catalog, [["typescript.doctrine", "## 0. The compiler is the floor"], ["typescript.compiler-strictness", "## 1. Strict mode"]]);
  const entries = [{ id: "P2", topic: "warnings are errors", side: "csharp", status: "counterpart" }, { id: "P3", topic: "nullability is enforced", side: "both", status: "counterpart" }];
  const rows = [
    { inventory: "P2", topic: "warnings are errors", status: "equal", strength: "a file plus a CI check on both sides; equal", csharp: cs(), typescript: ts() },
    { inventory: "P3", topic: "nullability is enforced", status: "equal", strength: "raised on both sides; equal", csharp: cs(), typescript: ts() },
  ];
  if (withP4) {
    entries.push({ id: "P4", topic: "complexity ceiling", side: "csharp", status: "counterpart" });
    rows.push({ inventory: "P4", topic: "complexity ceiling", status: "equal", strength: "prose against lint", csharp: activeSide(catalog, [["csharp.doctrine", "## 6. Pure functions, small methods"]], { enforcement: [{ class: "prose" }], consequence: "none", suppression: "none" }), typescript: ts() });
  }
  return { inventory: { entries }, matrix: { rows }, catalog, sectionsById, landedEpics: [], root };
}

// ---- the cases ---------------------------------------------------------------------------------------------------------

test("the real inventory and matrix hold 31 entries and rows, one to one, every row planned or deliberately absent", async () => {
  const world = realWorld();
  assert.equal(world.inventory.entries.length, 31);
  assert.equal(world.matrix.rows.length, 31);
  assert.deepEqual(await parityFindings(world), [], "the real files are consistent with the catalog and the epics");
  const statuses = new Set(world.matrix.rows.map(row => row.status));
  assert.deepEqual([...statuses].sort(), ["deliberately-absent", "planned"], "E1 activates no row");
  assert.deepEqual(world.matrix.rows.filter(row => row.status === "deliberately-absent").map(row => row.inventory).sort(), ["G4", "G5", "P8", "R4", "R5"]);
  for (const id of ["P8", "R4", "R5"]) {
    const row = rowOf(world, id);
    assert.ok([row.csharp, row.typescript].some(side => sideShape(side) === "present"), `${id}: the present side is its existing text`);
  }
});

test("the present-side variant is accepted only on a deliberately-absent row, and a row never carries a suppression", async () => {
  const world = realWorld();
  const present = rowOf(world, "P8").csharp;
  const onPlanned = realWorld();
  rowOf(onPlanned, "P9").csharp = clone(present);
  const planned = await parityFindings(onPlanned);
  assert.ok(named(planned, /P9: the present-side variant/), planned.join("\n"));
  const rowLevel = realWorld();
  rowOf(rowLevel, "P9").suppression = "none";
  assert.ok(named(await parityFindings(rowLevel), /P9: suppression lives on each active side/));
  const reasoned = realWorld();
  rowOf(reasoned, "P8").reason = "a reason on the row";
  assert.ok(named(await parityFindings(reasoned), /P8: only a stronger row carries a reason/));
});

test("the present-side variant on an equal row is a finding", async t => {
  const world = proofWorld(t);
  rowOf(world, "P2").csharp = { delivery: [{ id: "csharp.doctrine", section: "## 1. Language & runtime" }] };
  const findings = await parityFindings(world);
  assert.ok(named(findings, /P2: the present-side variant/), findings.join("\n"));
});

test("the real-row proof: P2 and P3 as equal rows pass the union comparison on source and manifest scopes", async t => {
  assert.deepEqual(await parityFindings(proofWorld(t)), []);
});

test("without the TypeScript source-file statement, P2 and P3 fail the union: a .ts scope would deliver nothing", async t => {
  const world = proofWorld(t);
  for (const id of ["P2", "P3"]) {
    const ts = rowOf(world, id).typescript;
    ts.delivery = ts.delivery.filter(location => location.id === "typescript.compiler-strictness");
    ts.selectors = ts.selectors.filter(item => item.id === "typescript.compiler-strictness");
  }
  const findings = await parityFindings(world);
  assert.ok(named(findings, /P2: for the task \w+ on src\/x\.cs \(C#\) and ui\/a\.ts \(TypeScript\), C# delivers and TypeScript delivers nothing/, /P3: for the task/), findings.slice(0, 4).join("\n"));
});

test("P4 may be stronger on the TypeScript side with a reason; any other row may not", async t => {
  const world = proofWorld(t, { withP4: true });
  rowOf(world, "P4").status = "stronger-ts";
  rowOf(world, "P4").reason = "complexity is lint-enforced in TypeScript and prose in C#";
  assert.deepEqual(await parityFindings(world), []);
  delete rowOf(world, "P4").reason;
  assert.ok(named(await parityFindings(world), /P4: a stronger row records its reason/));
  const other = proofWorld(t);
  rowOf(other, "P2").status = "stronger-ts";
  rowOf(other, "P2").reason = "a reason that does not matter, the whitelist is the point";
  assert.ok(named(await parityFindings(other), /P2: stronger-ts is whitelisted for P4 only/));
});

test("an equal row that names a missing rule, or a section the rule does not have, is one finding each", async t => {
  const world = proofWorld(t);
  rowOf(world, "P2").csharp.delivery[0].id = "csharp.missing";
  const missing = await parityFindings(world);
  assert.equal(missing.length, 1, missing.join("\n"));
  assert.match(missing[0], /P2: the csharp side delivers in csharp\.missing, which is not a rule/);
  const other = proofWorld(t);
  rowOf(other, "P3").csharp.delivery[0].section = "## 99. A section that is not there";
  const section = await parityFindings(other);
  assert.equal(section.length, 1, section.join("\n"));
  assert.match(section[0], /P3: .*csharp\.doctrine.*not one of its sections/);
});

test("a planned row needs an owning epic among E2 to E6, and so does each planned side", async () => {
  const bare = realWorld();
  delete rowOf(bare, "P9").epic;
  const noEpic = await parityFindings(bare);
  assert.equal(noEpic.length, 1, noEpic.join("\n"));
  assert.match(noEpic[0], /P9: a planned row names its owning epic/);
  const nine = realWorld();
  rowOf(nine, "P9").epic = "E9";
  const wrong = await parityFindings(nine);
  assert.equal(wrong.length, 1, wrong.join("\n"));
  assert.match(wrong[0], /P9: .*E9/);
  const first = realWorld();
  rowOf(first, "P9").csharp.planned = "E1";
  const side = await parityFindings(first);
  assert.equal(side.length, 1, side.join("\n"));
  assert.match(side[0], /P9: the csharp side is planned for E1, which is no owning epic/);
});

test("the inventory and the matrix agree: an entry with no row, a row with no entry, two rows, a different status or epic, a reason on the wrong row", async () => {
  const noRow = realWorld();
  noRow.matrix.rows = noRow.matrix.rows.filter(row => row.inventory !== "P9");
  assert.deepEqual(await parityFindings(noRow), ["P9: the inventory has no matrix row"]);
  const noEntry = realWorld();
  noEntry.inventory.entries = noEntry.inventory.entries.filter(entry => entry.id !== "P9");
  assert.deepEqual(await parityFindings(noEntry), ["P9: a matrix row with no inventory entry"]);
  const twice = realWorld();
  twice.matrix.rows.push(clone(rowOf(twice, "P9")));
  assert.deepEqual(await parityFindings(twice), ["P9: 2 matrix rows for one inventory entry"]);
  const status = realWorld();
  entryOf(status, "P9").status = "counterpart";
  delete entryOf(status, "P9").epic;
  const statusFindings = await parityFindings(status);
  assert.equal(statusFindings.length, 1, statusFindings.join("\n"));
  assert.match(statusFindings[0], /P9: the inventory says counterpart, the row says planned/);
  const epic = realWorld();
  entryOf(epic, "P9").epic = "E3";
  const epicFindings = await parityFindings(epic);
  assert.equal(epicFindings.length, 1, epicFindings.join("\n"));
  assert.match(epicFindings[0], /P9: the inventory says epic E3, the row says E2/);
  const reason = realWorld();
  rowOf(reason, "G4").reason = "the reason belongs to the inventory, not the row";
  assert.ok(named(await parityFindings(reason), /G4: only a stronger row carries a reason/));
  const reasonless = realWorld();
  delete entryOf(reasonless, "G4").reason;
  assert.ok(named(await parityFindings(reasonless), /inventory G4: a deliberately-absent entry carries a reason/));
});

test("mood follows the (MANDATORY) mark of the heading or of any heading above it, on the real sections", async () => {
  const catalog = realCatalog;
  const row = (id, section, mood, ruleId) => ({
    inventory: id, topic: `topic ${id}`, status: "equal", strength: "x",
    csharp: activeSide(catalog, [[ruleId, section]], { enforcement: [{ class: "prose" }], consequence: "none", suppression: "none", mood }),
    typescript: activeSide(catalog, [[ruleId, section]], { enforcement: [{ class: "prose" }], consequence: "none", suppression: "none", mood }),
  });
  const MUST_SECTION = "### A timeout is not a cancellation — and .NET spells them the same";
  const SHOULD_SECTION = "## Every feature ships with tests, in the same task";
  const build = (mustMood, shouldMood) => ({
    inventory: { entries: ["P90", "P91"].map(id => ({ id, topic: `topic ${id}`, side: "csharp", status: "counterpart" })) },
    matrix: { rows: [row("P90", MUST_SECTION, mustMood, "common.reliability"), row("P91", SHOULD_SECTION, shouldMood, "common.testing")] },
    catalog, sectionsById: realSections(), landedEpics: [], root: sourceRoot,
  });
  assert.deepEqual(await parityFindings(build("MUST", "SHOULD")), [], "the heading inherits its MANDATORY from the H1 above it; the other has none");
  const flippedMust = await parityFindings(build("SHOULD", "SHOULD"));
  assert.equal(flippedMust.length, 2, "both sides of the row say it");
  assert.ok(flippedMust.every(finding => /^P90: the (csharp|typescript) side says SHOULD, but its sections carry \(MANDATORY\)/.test(finding)), flippedMust.join("\n"));
  const flippedShould = await parityFindings(build("MUST", "MUST"));
  assert.ok(named(flippedShould, /P91: .*MUST.*do not carry/));
  assert.equal(isMandatory(["# A (MANDATORY)", "## B", "### C"], "### C"), true);
  assert.equal(isMandatory(["# A (MANDATORY)", "## B (x)", "# D", "### C"], "### C"), false, "a marked H1 that is not above the section does not count");
});

test("an active side is held to reality: its selectors, its check tool's CHECKED_RULES and its hook", async t => {
  const selectors = proofWorld(t);
  rowOf(selectors, "P2").csharp.selectors[0].paths = ["**/*.cs"];
  const wrongSelector = await parityFindings(selectors);
  assert.equal(wrongSelector.length, 1, wrongSelector.join("\n"));
  assert.match(wrongSelector[0], /P2: the csharp side's paths for csharp\.doctrine/);
  const unchecked = proofWorld(t, { checked: ["csharp.doctrine", "typescript.doctrine"] });
  const missingId = await parityFindings(unchecked);
  assert.ok(named(missingId, /P2: the typescript side's check strictness-check does not list typescript\.compiler-strictness/), missingId.join("\n"));
  const hook = proofWorld(t);
  rowOf(hook, "P2").typescript.enforcement = [{ class: "hook", hook: "nope" }, { class: "check", tool: "strictness-check" }];
  rowOf(hook, "P2").csharp.enforcement = [{ class: "hook", hook: "probe" }, { class: "check", tool: "strictness-check" }];
  const noHook = await parityFindings(hook);
  assert.equal(noHook.length, 1, noHook.join("\n"));
  assert.match(noHook[0], /P2: the typescript side's hook "nope"/);
});

test("a planned row of an epic that has landed is a finding", async () => {
  const world = realWorld();
  world.landedEpics = ["E3"];
  const findings = await parityFindings(world);
  for (const id of ["P2", "P3", "P4", "P21", "G1"]) assert.ok(named(findings, new RegExp(`${id}: planned for E3, which has landed`)), `${id}\n${findings.join("\n")}`);
  assert.equal(findings.length, 5);
});
