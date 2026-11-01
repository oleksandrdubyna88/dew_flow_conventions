// The gate record and its checks (plan section 4.3, 4.4). A rule that carries `path_tasks` is a GATED rule: its
// `paths` select only in a scope that also names one of those tasks. A gate must be justified, and the record in
// research/selection-matrix.json -> gates says how: it MIRRORS the `tasks:` line of the rule its requirement's text came
// from (a source with no `tasks:` mirrors as "no gate"), or it is DECLARED with a reason. This module checks that
// provenance; `caseFindings` checks the selection cases of a record against the defined positive and negatives.
//
//   "<rule id>": { "mirrors": "<source id>" | "declared": { "path_tasks": [...], "reason": "<at least 20 chars>" },
//                  "epic": "E2".."E6", "cases": [ { "tasks": [t], "files": [f...], "selected": true|false } ] }

import { TASKS, matchesPaths, selectRules, targetPath } from "./rule-catalog.mjs";

export const MIN_REASON = 20;
const OWNING_EPICS = Object.freeze(["E2", "E3", "E4", "E5", "E6"]);

const sameSet = (a, b) => a.length === b.length && new Set(a).size === new Set(b).size && a.every(item => b.includes(item));
const listed = items => `[${items.join(", ")}]`;

export function provenanceFindings(catalog, gates, landedEpics) {
  const findings = [];
  const byId = new Map(catalog.map(rule => [rule.id, rule]));
  const record = gates ?? {};

  for (const rule of catalog) {
    if (rule.pathTasks.length && !Object.hasOwn(record, rule.id)) {
      findings.push(`${rule.id} carries path_tasks but has no gate record — mirror its source or declare it`);
    }
  }

  for (const [id, entry] of Object.entries(record)) {
    const hasMirrors = Object.hasOwn(entry, "mirrors");
    const hasDeclared = Object.hasOwn(entry, "declared");
    if (hasMirrors === hasDeclared) {
      findings.push(`${id}: a gate record has exactly one of mirrors and declared (found ${hasMirrors ? "both" : "neither"})`);
    }
    if (!OWNING_EPICS.includes(entry.epic)) findings.push(`${id}: a gate record names its owning epic among ${OWNING_EPICS.join(", ")} (found ${entry.epic === undefined ? "none" : entry.epic})`);
    const rule = byId.get(id);
    if (!rule) {
      if (landedEpics.includes(entry.epic)) findings.push(`${id}: a gate record for a rule that does not exist, and its epic ${entry.epic} has landed`);
      continue;
    }
    if (hasMirrors && !hasDeclared) {
      const source = byId.get(entry.mirrors);
      if (!source) { findings.push(`${id}: mirrors ${entry.mirrors}, which is not a rule`); continue; }
      if (source.tasks.length) {
        if (!sameSet(rule.pathTasks, source.tasks)) {
          findings.push(`${id}: path_tasks ${listed(rule.pathTasks)} does not equal the tasks ${listed(source.tasks)} of ${source.id} it mirrors`);
        }
      } else if (rule.pathTasks.length) {
        findings.push(`${id}: ${source.id} has no tasks: line; declare the applicability change instead`);
      }
    }
    if (hasDeclared && !hasMirrors) {
      const declared = entry.declared ?? {};
      if (!rule.pathTasks.length) findings.push(`${id}: declared a gate but the rule has no path_tasks`);
      else if (!Array.isArray(declared.path_tasks) || !sameSet(rule.pathTasks, declared.path_tasks)) {
        findings.push(`${id}: declared path_tasks ${listed(declared.path_tasks ?? [])} does not equal the rule's ${listed(rule.pathTasks)}`);
      }
      if (typeof declared.reason !== "string" || declared.reason.trim().length < MIN_REASON) {
        findings.push(`${id}: a declared gate needs a reason of at least ${MIN_REASON} characters`);
      }
    }
  }
  return findings;
}

// The negative-case definition (plan section 4.4). Every record needs at least one positive case. A GATED rule needs a
// positive through the gate (a matching file and a task of the gate — a `tasks:` line that selects it does not count), a
// negative whose file matches its paths with every task outside the gate (the gate, not the path, is what refuses), and a
// negative with a task inside the gate and no matching file (the path, not the gate, is what refuses). An UNGATED rule (a
// mirror of a path-only source) needs a negative with no matching file. Every task is known, every file root-relative, and
// — when the rule exists — each case holds under `selectRules`. A record for a rule that does not exist yet is checked for
// its shape only: whether it is gated is not knowable until the rule lands.
export function caseFindings(catalog, gates) {
  const findings = [];
  const byId = new Map(catalog.map(rule => [rule.id, rule]));
  for (const [id, entry] of Object.entries(gates ?? {})) {
    const cases = Array.isArray(entry.cases) ? entry.cases : [];
    if (!cases.length) { findings.push(`${id}: a gate record needs selection cases — at least one positive and the defined negatives`); continue; }
    const rule = byId.get(id);
    const label = (item, index) => `${id} case ${index + 1} (${(item.tasks ?? []).join(",")} ${(item.files ?? []).join(" + ") || "(no file)"})`;
    const sound = [];
    cases.forEach((item, index) => {
      const here = label(item, index);
      let ok = Array.isArray(item.tasks) && item.tasks.length > 0 && Array.isArray(item.files) && typeof item.selected === "boolean";
      if (!ok) { findings.push(`${here}: a case is { tasks: [..], files: [..], selected: true|false }`); return; }
      for (const task of item.tasks) if (!Object.hasOwn(TASKS, task)) { findings.push(`${here}: unknown task ${task}`); ok = false; }
      for (const file of item.files) {
        try { targetPath(file); } catch { findings.push(`${here}: ${file} is not a root-relative file`); ok = false; }
      }
      if (ok) sound.push({ item, here });
    });
    if (!sound.some(({ item }) => item.selected)) findings.push(`${id}: no positive case (selected: true) — a gate that selects nothing is untested`);
    if (!rule) continue;
    for (const { item, here } of sound) {
      const selected = selectRules(catalog, item.tasks, item.files).some(chosen => chosen.id === id);
      if (selected !== item.selected) findings.push(`${here}: recorded selected: ${item.selected}, but the selector says ${selected}`);
    }
    const negatives = sound.filter(({ item }) => !item.selected).map(({ item }) => item);
    const touches = item => item.files.some(file => matchesPaths(rule, file));
    const positives = sound.filter(({ item }) => item.selected).map(({ item }) => item);
    if (rule.pathTasks.length) {
      if (positives.length && !positives.some(item => touches(item) && item.tasks.some(task => rule.pathTasks.includes(task)))) {
        findings.push(`${id}: no positive case through the gate — a matching file and a gate task`);
      }
      if (!negatives.some(item => touches(item) && item.tasks.every(task => !rule.pathTasks.includes(task)))) {
        findings.push(`${id}: no negative case with a matching file and every task outside the gate [${rule.pathTasks.join(", ")}] — the gate's refusal is untested`);
      }
      if (!negatives.some(item => !touches(item) && item.tasks.some(task => rule.pathTasks.includes(task)))) {
        findings.push(`${id}: no negative case with a task inside the gate and no matching file — the path's refusal is untested`);
      }
    } else if (!negatives.some(item => !touches(item))) {
      findings.push(`${id}: no negative case with no matching file — the path's refusal is untested`);
    }
  }
  return findings;
}
