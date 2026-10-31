// The gate record and its checks (plan section 4.3, 4.4). A rule that carries `path_tasks` is a GATED rule: its
// `paths` select only in a scope that also names one of those tasks. A gate must be justified, and the record in
// research/selection-matrix.json -> gates says how: it MIRRORS the `tasks:` line of the rule its requirement's text came
// from (a source with no `tasks:` mirrors as "no gate"), or it is DECLARED with a reason. This module checks that
// provenance. The selection cases of a record are checked by `caseFindings` (added with the selection baseline).
//
//   "<rule id>": { "mirrors": "<source id>" | "declared": { "path_tasks": [...], "reason": "<at least 20 chars>" },
//                  "epic": "E2".."E6", "cases": [ { "tasks": [t], "files": [f...], "selected": true|false } ] }

export const MIN_REASON = 20;

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
