/**
 * The reader of `package.json` for the guard's `--profile node` (`tools/leftovers-check.mjs`, F3 of
 * `todo/PLAN_test_leftovers_merged_core_followups.md`): an npm script is a script of the repository, though it sits in a manifest and not in a
 * file the guard selects by shape. It parses the JSON and scans each `scripts` value as ONE shell pseudo-file (a value with line breaks is
 * one line per line break), so the classes and their detection are exactly the ones of a `.sh` file — a chain (`&&`, `||`, `;`, a pipe) and an
 * environment prefix are covered because the detectors search the whole line. The finding keeps the manifest's path and names the script; its line is the
 * line of that key inside the top-level `scripts` object (the line of `"scripts"` when the key cannot be placed) — never the same key of `dependencies`.
 *
 * Fail closed: a manifest that is not valid JSON, is not an object, or whose `scripts` is not an object of strings is ONE `unreadable` finding, never a
 * silent skip. No `scripts` field is valid and has nothing to scan. JSON has no comments, so a manifest takes NO inline exemption: a marker inside a
 * script value is made inert here (it exempts nothing), and a finding is cured by rewriting the script — for example, calling a script file the guard reads.
 * The raw-temp baseline is not applied to a manifest: a baseline entry is for a file the guard reads as text.
 */

import { finding } from "./leftovers-shell.mjs";

export const MANIFEST_NAME = "package.json";
/** The name a script is scanned under: a `.sh` file, so the shell-only detectors (`mktemp`) apply; every finding is renamed to the manifest. */
const PSEUDO_FILE = "package-script.sh";
// A marker inside a value must exempt nothing: `exempt:` becomes `exempt :`, which the exemption grammar does not read (the text stays, so the other classes still see it).
const INERT_MARKER = new RegExp(`(${"testsTo" + "Delete"}-exempt):`, "g");

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Where the keys of the top-level `scripts` object sit: `{ scripts, keys }` (1-based lines; `scripts` is undefined without one). A walk over the text that tracks strings and
 * depth, so a key of the same name in `dependencies` or in a nested object is never taken for a script. The last `scripts` wins, as `JSON.parse` does.
 */
export function scriptLines(text) {
  const keys = new Map();
  let scripts;
  let line = 1;
  let depth = 0;
  let armed = false; // the key `scripts` at depth 1 was just read: the next `{` opens it
  let inScripts = false;
  const colon = /\s*:/y;
  for (let at = 0; at < text.length; at += 1) {
    const char = text[at];
    if (char === "\n") line += 1;
    else if (char === '"') {
      let end = at + 1;
      while (end < text.length && text[end] !== '"') end += text[end] === "\\" ? 2 : 1;
      colon.lastIndex = end + 1;
      if (colon.test(text)) {
        const key = JSON.parse(text.slice(at, end + 1));
        if (depth === 1 && key === "scripts") [armed, scripts] = [true, line];
        else if (depth === 2 && inScripts) keys.set(key, line);
      }
      at = end;
    } else if (char === "{" || char === "[") {
      depth += 1;
      if (armed && char === "{") {
        inScripts = true;
        keys.clear();
      }
      armed = false;
    } else if (char === "}" || char === "]") {
      if (inScripts && depth === 2) inScripts = false;
      depth -= 1;
    } else if (char === ",") armed = false;
  }
  return { scripts, keys };
}

/**
 * `{ findings, scanned }` of one manifest. `bytes` is its content; `scan(name, text)` is the guard's text scan (so this module imports nothing from it). `scanned` says whether
 * anything was read — a script, or an unreadable manifest — so a repository whose only manifests have no `scripts` is still "scanned nothing".
 */
export function manifestFindings(file, bytes, scan) {
  const text = bytes.toString("utf8").replace(/^﻿/, "");
  const unreadable = (why) => ({ findings: [finding(file, 1, "unreadable", `could not be read: ${why} — a package.json is read only as JSON whose \`scripts\` is an object of strings`)], scanned: true });
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return unreadable(`not valid JSON (${error.message.split("\n")[0]})`);
  }
  if (!isObject(parsed)) return unreadable("the top level is not an object");
  if (!("scripts" in parsed)) return { findings: [], scanned: false };
  const entries = isObject(parsed.scripts) ? Object.entries(parsed.scripts) : undefined;
  if (entries === undefined || !entries.every(([, value]) => typeof value === "string")) return unreadable("`scripts` is not an object of strings");
  const where = scriptLines(text);
  const findings = entries.flatMap(([name, value]) => {
    const line = where.keys.get(name) ?? where.scripts ?? 1;
    return scan(PSEUDO_FILE, value.replace(INERT_MARKER, "$1 :").split(/\r?\n/).join("\n")).map((entry) => ({ ...entry, file, line, text: `${entry.text} — script \`${name}\`` }));
  });
  return { findings, scanned: entries.length > 0 };
}
