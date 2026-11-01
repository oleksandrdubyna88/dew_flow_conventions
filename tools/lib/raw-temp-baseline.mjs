/**
 * The `raw-temp` baseline of `common/test-leftovers-detail.md` §7: one ratcheting, membership-keyed file that carries the `raw-temp` sites of a
 * repository whose test runner owns a run folder. Nothing here writes a baseline; the guard (`tools/leftovers-check.mjs`) reads one only when named.
 *
 *   { "class": "raw-temp", "scopes": [{ "root", "proof" }], "entries": [{ "file", "sha256", "line" }] }
 *
 * - a MULTISET: one entry per occurrence, keyed by the file and `siteSha256` (the trimmed line); `line` is a hint, never a key;
 * - a scope's `proof` is a file under its `root` that carries `testsToDelete-baseline-proof: <root>` — the guard checks the declaration, a reviewer
 *   checks the substance; an entry outside every scope, or under a scope whose proof does not hold, clears nothing;
 * - it only shrinks: `baselineShrinks` compares the working copy with the base ref and refuses a new key, a raised count, a new or wider scope, a
 *   changed proof and any creation but the first.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { gitOutput } from "./git.mjs";

export const BASELINE_CLASS = "raw-temp";
/** The marker a scope's proof file carries, spelled in two pieces: this module is read by tools that scan for the prefix word. */
export const PROOF_MARKER = "testsTo" + "Delete-baseline-proof:";
const SHA256 = /^[0-9a-f]{64}$/;

/** The hash of a site: sha256 of the line with leading and trailing whitespace and any `\r` removed, so a re-indent or an EOL change keeps the entry. */
export const siteSha256 = (line) => createHash("sha256").update(line.replaceAll("\r", "").trim()).digest("hex");

const finding = (file, line, text) => ({ file, line, cls: "baseline", text });
const isFolder = (value) => typeof value === "string" && value.endsWith("/") && isRelative(value);
const isRelative = (value) => value !== "" && !value.includes("\\") && !value.startsWith("/") && !/^[A-Za-z]:/.test(value) && !value.split("/").includes("..");

/** The first thing wrong with a parsed baseline, naming the field, or `undefined`. */
function problemOf(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return "the file is not an object";
  if (data.class !== BASELINE_CLASS) return `\`class\` must be exactly \`${BASELINE_CLASS}\` (found ${data.class === undefined ? "none" : JSON.stringify(data.class)}); no other class has a baseline`;
  if (!Array.isArray(data.scopes)) return "`scopes` is missing or is not a list";
  if (!Array.isArray(data.entries)) return "`entries` is missing or is not a list";
  for (const [index, scope] of data.scopes.entries()) {
    if (scope === null || typeof scope !== "object") return `\`scopes[${index}]\` is not an object`;
    if (!isFolder(scope.root)) return `\`scopes[${index}].root\` must be a repository-relative folder with a trailing \`/\` and forward slashes`;
    if (!isRelative(scope.proof) || !scope.proof.startsWith(scope.root) || scope.proof === scope.root) return `\`scopes[${index}].proof\` must be a file under its root \`${scope.root}\``;
  }
  for (const [index, item] of data.entries.entries()) {
    if (item === null || typeof item !== "object") return `\`entries[${index}]\` is not an object`;
    if (!isRelative(item.file) || item.file.endsWith("/")) return `\`entries[${index}].file\` must be a repository-relative path with forward slashes (no backslash, no leading slash, no \`..\`)`;
    if (typeof item.sha256 !== "string" || !SHA256.test(item.sha256)) return `\`entries[${index}].sha256\` must be 64 lower-case hex digits`;
    if (!Number.isInteger(item.line) || item.line < 1) return `\`entries[${index}].line\` must be a 1-based integer hint`;
  }
  return undefined;
}

/** `{ scopes, entries }` for a valid baseline text, else `{ problem }` naming the field. */
export function parseBaseline(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { problem: "the file is not JSON" };
  }
  const problem = problemOf(data);
  return problem === undefined ? { scopes: data.scopes.map(({ root, proof }) => ({ root, proof })), entries: data.entries.map(({ file, sha256, line }) => ({ file, sha256, line })) } : { problem };
}

/** Read a baseline file: the parse result plus its `file`. Throws only when the path cannot be read (the guard's exit 2). */
export function loadBaseline(file) {
  return { ...parseBaseline(fs.readFileSync(file, "utf8")), file };
}

/** Whether a scope's proof file is in the tree and carries the marker for exactly its root. */
function proofHolds(repo, scope) {
  let text;
  try {
    text = fs.readFileSync(path.join(repo, scope.proof), "utf8");
  } catch {
    return false;
  }
  const marked = new RegExp(`${PROOF_MARKER}[ \\t]*(\\S+)`, "g");
  return [...text.matchAll(marked)].some((match) => match[1].replace(/(?:\*\/|-->)$/, "") === scope.root);
}

/**
 * What the scan asks of a loaded baseline. `take(file, sha)` is called by the per-file scan for each `raw-temp` hit in line order and answers whether an
 * entry passes it (that entry is then matched); `finalFindings()` is called once after every file and reconciles the whole baseline: a malformed file,
 * a scope whose proof does not hold, an entry under no scope, and every entry no hit matched. Nothing is applied from a malformed file.
 * `label` is how the baseline file is named in a finding (its path relative to the repository).
 */
export function createApplier(loaded, repo, label) {
  if (loaded.problem !== undefined) return { take: () => false, finalFindings: () => [finding(label, 1, loaded.problem)] };
  const scopes = loaded.scopes.map((scope) => ({ ...scope, proven: proofHolds(repo, scope) }));
  const entries = loaded.entries.map((entry) => ({ ...entry, scope: scopes.find((scope) => entry.file.startsWith(scope.root)), used: false }));
  const applies = (entry) => entry.scope?.proven === true;
  return {
    take(file, sha256) {
      const entry = entries.find((candidate) => !candidate.used && applies(candidate) && candidate.file === file && candidate.sha256 === sha256);
      if (entry === undefined) return false;
      entry.used = true;
      return true;
    },
    finalFindings: () => [
      ...scopes.filter((scope) => !scope.proven).map((scope) => finding(label, 1, `scope \`${scope.root}\`: proof missing — \`${scope.proof}\` is not in the tree or does not carry \`${PROOF_MARKER} ${scope.root}\`; no entry under it applies`)),
      ...entries.filter((entry) => entry.scope === undefined).map((entry) => finding(entry.file, entry.line, "entry is outside every scope — it clears nothing; remove it")),
      ...entries.filter((entry) => applies(entry) && !entry.used).map((entry) => finding(entry.file, entry.line, "entry has no line — no `raw-temp` line of this file has this content (the site is gone or changed); remove the entry")),
    ],
  };
}

/** The baseline that lists every `raw-temp` finding of a scan, for the one creation: `scopes` empty, to be written by hand. `repo` is where the files are read. */
export function printBaseline(findings, repo) {
  const cache = new Map();
  const linesOf = (file) => {
    if (!cache.has(file)) cache.set(file, fs.readFileSync(path.join(repo, file), "utf8").split(/\r?\n/));
    return cache.get(file);
  };
  const entries = findings.filter((entry) => entry.cls === BASELINE_CLASS).map((entry) => ({ file: entry.file, sha256: siteSha256(linesOf(entry.file)[entry.line - 1]), line: entry.line }));
  return { about: "raw-temp sites inside the owned run folder; only shrinks — common/test-leftovers-detail.md §7", class: BASELINE_CLASS, scopes: [], entries };
}

// --- the shrink check ------------------------------------------------------------------------------------------------

const FETCH = "git fetch origin <base-branch> --depth=1";
const keyOf = (entry) => `${entry.file}\0${entry.sha256}`;
const countKeys = (entries) => entries.reduce((counts, entry) => counts.set(keyOf(entry), (counts.get(keyOf(entry)) ?? 0) + 1), new Map());
const canonical = (target) => {
  const absolute = path.resolve(target);
  try {
    return fs.realpathSync(absolute);
  } catch {
    try {
      return path.join(fs.realpathSync(path.dirname(absolute)), path.basename(absolute));
    } catch {
      return absolute;
    }
  }
};
const tryGit = (repo, args) => {
  try {
    return gitOutput(repo, args);
  } catch {
    return undefined;
  }
};

/** What a working scope may be against the base's: `undefined` when it is a shrink, else the sentence. */
function scopeGrowth(scope, baseScopes) {
  const same = baseScopes.find((base) => base.root === scope.root);
  if (same !== undefined) return same.proof === scope.proof ? undefined : `changed proof for scope \`${scope.root}\`: \`${same.proof}\` → \`${scope.proof}\``;
  const inside = baseScopes.find((base) => base.root.startsWith(scope.root));
  if (inside !== undefined) return `wider scope \`${scope.root}\` — it holds the base scope \`${inside.root}\``;
  return baseScopes.some((base) => scope.root.startsWith(base.root)) ? undefined : `new scope \`${scope.root}\``;
}

/** Why a creation is refused or cannot be judged: `{ code, line }`, or `undefined` when the path never had history. */
function creationVerdict(repo, rel, base) {
  if (tryGit(repo, ["rev-parse", "--is-shallow-repository"])?.trim() === "true") {
    return { code: 2, line: "this is a shallow clone, so whether the baseline path ever had history cannot be known — run `git fetch --unshallow`, then the check again" };
  }
  const seen = [tryGit(repo, ["log", base, "--format=%H", "--", rel]), tryGit(repo, ["log", "--all", "--not", "HEAD", "--format=%H", "--", rel])]; // history behind the base, and on any other ref
  const first = seen.flatMap((output) => (output ?? "").split("\n")).find(Boolean);
  return first === undefined ? undefined : { code: 1, line: `a re-creation: \`${rel}\` already has history (commit ${first.slice(0, 12)}); the baseline is created once and never again — see common/test-leftovers-detail.md §7` };
}

/**
 * `--baseline-shrinks`: the baseline `file` in the working tree against `git show <base>:<file>`. Returns `{ code, lines }` — 0 passes, 1 refuses
 * (every reason in `lines`), 2 cannot judge (unresolved base ref, shallow clone for a creation, unreadable base copy). Never writes anything.
 */
export function baselineShrinks({ repo, file, base, allowCreate = false }) {
  const top = tryGit(repo, ["rev-parse", "--show-toplevel"]);
  const rel = top === undefined ? undefined : path.relative(canonical(top.trim()), canonical(file)).split(path.sep).join("/");
  if (rel === undefined || rel.startsWith("../") || rel === "") return { code: 2, lines: [`${file} is not inside the git repository ${repo}`] };
  if (base.startsWith("-") || tryGit(repo, ["rev-parse", "--verify", "--quiet", `${base}^{commit}`]) === undefined) {
    return { code: 2, lines: [`the base ref \`${base}\` is not available here — fetch it first (\`${FETCH}\` or the repository's own fetch), then run the check again; an unresolved base is never a pass`] };
  }
  if (!fs.existsSync(file)) return { code: 0, lines: [`${rel}: absent now — drained (it only shrinks, and nothing is left)`] };
  const working = parseBaseline(fs.readFileSync(file, "utf8"));
  if (working.problem !== undefined) return { code: 1, lines: [`${rel}: not a baseline — ${working.problem}`] };
  const baseText = tryGit(repo, ["show", `${base}:${rel}`]);
  if (baseText === undefined) {
    if (!allowCreate) return { code: 1, lines: [`${rel}: a creation (absent at ${base}) — pass --allow-create in the one creation PR and record it there; the guard accepts one creation only`] };
    const refused = creationVerdict(repo, rel, base);
    return refused === undefined ? { code: 0, lines: [`${rel}: the one creation, allowed — it never had history`] } : { code: refused.code, lines: [`${rel}: ${refused.line}`] };
  }
  const before = parseBaseline(baseText);
  if (before.problem !== undefined) return { code: 2, lines: [`${rel}: the copy at ${base} is not a baseline (${before.problem}) — a shrink cannot be judged against it`] };
  const baseCounts = countKeys(before.entries);
  const problems = [...countKeys(working.entries)].flatMap(([key, count]) => {
    const was = baseCounts.get(key) ?? 0;
    const [entryFile, sha256] = key.split("\0");
    if (count <= was) return [];
    return [was === 0 ? `new key — ${entryFile} ${sha256} is not in ${base}` : `raised count — ${entryFile} ${sha256}: ${was} → ${count} entries`];
  });
  const growth = working.scopes.map((scope) => scopeGrowth(scope, before.scopes)).filter((text) => text !== undefined);
  const all = [...problems, ...growth].map((text) => `${rel}: ${text}`);
  return all.length === 0 ? { code: 0, lines: [`${rel}: only shrinks against ${base}`] } : { code: 1, lines: all };
}
