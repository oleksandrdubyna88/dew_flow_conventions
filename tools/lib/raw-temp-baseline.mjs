/**
 * The `raw-temp` baseline of `common/test-leftovers-detail.md` §7: one ratcheting, membership-keyed file that carries the `raw-temp` sites of a
 * repository whose test runner owns a run folder. Nothing here writes a baseline; the guard (`tools/leftovers-check.mjs`) reads one only when named.
 *
 *   { "class": "raw-temp", "scopes": [{ "root", "proof" }], "entries": [{ "file", "sha256", "line" }] }
 *
 * - ONE fixed path: `raw-temp-baseline.json` at the repository root, a regular file, never a symlink (a link could turn a grown baseline into an
 *   "allowed creation"); the guard and the shrink check both refuse a link;
 * - a MULTISET: one entry per occurrence, keyed by the file and `siteSha256` (the trimmed line); `line` is a hint, never a key;
 * - a scope's `proof` is a TEST file under its `root`, discovered by the same scan, that carries a line of `testsToDelete-baseline-proof: <root>` (the root
 *   exactly, then only whitespace or a comment closer) — the guard checks the declaration, a reviewer checks the substance; an entry outside every scope, or
 *   under a scope whose proof does not hold, clears nothing; an entry belongs to the most specific scope that holds its file;
 * - it only shrinks: `baselineShrinks` compares the working copy with the base ref and refuses a new key, a raised count, a new or wider scope, a
 *   changed proof and any creation but the first.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { gitOutput } from "./git.mjs";

export const BASELINE_CLASS = "raw-temp";
/** The one path of a baseline, relative to the repository root. */
export const BASELINE_FILE = "raw-temp-baseline.json";
/** The marker a scope's proof file carries, spelled in two pieces: this module is read by tools that scan for the prefix word. */
export const PROOF_MARKER = "testsTo" + "Delete-baseline-proof:";
const SHA256 = /^[0-9a-f]{64}$/;

/** The hash of a site: sha256 of the line with leading and trailing whitespace and any `\r` removed, so a re-indent or an EOL change keeps the entry. */
export const siteSha256 = (line) => createHash("sha256").update(line.replaceAll("\r", "").trim()).digest("hex");

const finding = (file, line, text) => ({ file, line, cls: "baseline", text });
/** A repository-relative path in normal form: forward slashes, no leading slash, no drive, no empty, `.` or `..` segment. */
const isRelative = (value) => typeof value === "string" && value !== "" && !value.includes("\\") && !value.startsWith("/") && !/^[A-Za-z]:/.test(value)
  && value.replace(/\/$/, "").split("/").every((part) => part !== "" && part !== "." && part !== "..");
const isFolder = (value) => typeof value === "string" && value.endsWith("/") && isRelative(value);
/** A test file by its name or place: `x.test.mjs`, `x.spec.ts`, `XTests.cs`, `x_test.go`, `x-test.js`, or anything under a `test/` or `tests/` folder. */
const isTestFile = (file) => /(?:\.(?:test|spec)|Tests?|[_-]test)\.[A-Za-z0-9]+$/.test(file) || /(?:^|\/)tests?\//.test(file);

/** The first thing wrong with a parsed baseline, naming the field, or `undefined`. */
function problemOf(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return "the file is not an object";
  if (data.class !== BASELINE_CLASS) return `\`class\` must be exactly \`${BASELINE_CLASS}\` (found ${data.class === undefined ? "none" : JSON.stringify(data.class)}); no other class has a baseline`;
  if (!Array.isArray(data.scopes)) return "`scopes` is missing or is not a list";
  if (!Array.isArray(data.entries)) return "`entries` is missing or is not a list";
  for (const [index, scope] of data.scopes.entries()) {
    if (scope === null || typeof scope !== "object") return `\`scopes[${index}]\` is not an object`;
    if (!isFolder(scope.root)) return `\`scopes[${index}].root\` must be a repository-relative folder with a trailing \`/\` and forward slashes`;
    if (!isRelative(scope.proof) || !scope.proof.startsWith(scope.root) || scope.proof.endsWith("/") || scope.proof === BASELINE_FILE) return `\`scopes[${index}].proof\` must be a file under its root \`${scope.root}\` (a test file the scan discovers)`;
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

const realOrSelf = (target) => {
  try {
    return fs.realpathSync(target);
  } catch {
    return path.resolve(target);
  }
};

/** Why `repo`'s baseline file may not be read as one — a symlink, or a real folder that is not the repository's own — or `undefined`. */
function pathRefusal(repo, file) {
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch {
    return undefined; // absent: the read says so
  }
  if (stat.isSymbolicLink()) return `${BASELINE_FILE} is a symlink — the baseline is a regular file at the repository root and never a link (a link can point a grown baseline anywhere)`;
  if (realOrSelf(path.dirname(file)) !== realOrSelf(repo)) return `${BASELINE_FILE} does not lie in the repository folder itself — the baseline is at the repository root`;
  return undefined;
}

/**
 * The baseline of `repo`: its ONE path, `raw-temp-baseline.json` at the root. A symlink is refused as a `{ problem }` (the scan reports it as a
 * `baseline` finding); an unreadable path or a folder throws (the guard's exit 2).
 */
export function loadBaselineAt(repo) {
  const file = path.join(repo, BASELINE_FILE);
  const refusal = pathRefusal(repo, file);
  return refusal === undefined ? loadBaseline(file) : { problem: refusal, file };
}

/** Whether a scope's proof is a test file the scan discovered, outside the baseline itself, with a marker line for exactly its root. */
function proofHolds(repo, scope, discovered) {
  if (!discovered.has(scope.proof) || !isTestFile(scope.proof)) return false;
  let text;
  try {
    text = fs.readFileSync(path.join(repo, scope.proof), "utf8");
  } catch {
    return false;
  }
  return text.split(/\r?\n/).some((line) => {
    const at = line.indexOf(PROOF_MARKER);
    if (at < 0) return false;
    // the marker, exactly the root, then only whitespace or one comment closer to the end of the line
    return /^[ \t]*(.*?)[ \t]*(?:\*\/|-->)?[ \t]*$/.exec(line.slice(at + PROOF_MARKER.length))?.[1] === scope.root;
  });
}

const keyOf = (entry) => `${entry.file}\0${entry.sha256}`;

/**
 * What the scan asks of a loaded baseline. `take(file, sha)` is called by the per-file scan for each `raw-temp` hit in line order and answers whether an
 * entry passes it (that entry is then matched); `finalFindings()` is called once after every file and reconciles the whole baseline: a malformed file,
 * a scope whose proof does not hold, an entry under no scope, and every entry no hit matched. Nothing is applied from a malformed file.
 * `label` is how the baseline file is named in a finding. `discovered` is the set of files the scan read: a proof must be one of them.
 * The entries that can still pass are indexed by key once, so a take is not a scan of the baseline.
 */
export function createApplier(loaded, repo, label, discovered = new Set()) {
  if (loaded.problem !== undefined) return { take: () => false, finalFindings: () => [finding(label, 1, loaded.problem)] };
  const scopes = loaded.scopes.map((scope) => ({ ...scope, proven: proofHolds(repo, scope, discovered) }));
  const scopeOf = (file) => scopes.filter((scope) => file.startsWith(scope.root)).sort((a, b) => b.root.length - a.root.length)[0]; // the most specific, whatever the list's order
  const entries = loaded.entries.map((entry) => ({ ...entry, scope: scopeOf(entry.file), used: false }));
  const available = new Map(); // key → the unused entries that apply, in list order
  for (const entry of entries) if (entry.scope?.proven === true) available.set(keyOf(entry), [...(available.get(keyOf(entry)) ?? []), entry]);
  return {
    take(file, sha256) {
      const queue = available.get(keyOf({ file, sha256 }));
      const entry = queue?.shift();
      if (entry === undefined) return false;
      entry.used = true;
      return true;
    },
    finalFindings: () => [
      ...scopes.filter((scope) => !scope.proven).map((scope) => finding(label, 1, `scope \`${scope.root}\`: proof missing — \`${scope.proof}\` is not a test file this scan discovered, or does not carry \`${PROOF_MARKER} ${scope.root}\` (the root exactly, then only whitespace or a comment closer); no entry under it applies`)),
      ...entries.filter((entry) => entry.scope === undefined).map((entry) => finding(entry.file, entry.line, "entry is outside every scope — it clears nothing; remove it")),
      ...entries.filter((entry) => entry.scope?.proven === true && !entry.used).map((entry) => finding(entry.file, entry.line, "entry has no line — no `raw-temp` line of this file has this content (the site is gone or changed); remove the entry")),
    ],
  };
}

/**
 * The baseline that lists every `raw-temp` finding of a scan, for the one creation: `{ baseline, missing }`, `scopes` empty, to be written by hand. A finding
 * whose line cannot be read (the file changed under the scan) is listed in `missing` as `file:line`, never a crash and never a guessed entry.
 */
export function printBaseline(findings, repo) {
  const cache = new Map();
  const linesOf = (file) => {
    if (!cache.has(file)) cache.set(file, fs.readFileSync(path.join(repo, file), "utf8").split(/\r?\n/));
    return cache.get(file);
  };
  const sites = findings.filter((entry) => entry.cls === BASELINE_CLASS).map((entry) => ({ entry, text: linesOf(entry.file)[entry.line - 1] }));
  return {
    baseline: { about: "raw-temp sites inside the owned run folder; only shrinks — common/test-leftovers-detail.md §7", class: BASELINE_CLASS, scopes: [], entries: sites.filter((site) => site.text !== undefined).map(({ entry, text }) => ({ file: entry.file, sha256: siteSha256(text), line: entry.line })) },
    missing: sites.filter((site) => site.text === undefined).map(({ entry }) => `${entry.file}:${entry.line}`),
  };
}

// --- the shrink check ------------------------------------------------------------------------------------------------

const FETCH = "git fetch origin <base-branch> --depth=1";
const countKeys = (entries) => entries.reduce((counts, entry) => counts.set(keyOf(entry), (counts.get(keyOf(entry)) ?? 0) + 1), new Map());
const segments = (root) => root.split("/").filter(Boolean);
/** Whether folder `inner` is `outer` or lies under it, by whole path segments. */
const within = (inner, outer) => segments(outer).length <= segments(inner).length && segments(outer).every((part, index) => segments(inner)[index] === part);

/** A git call that never throws: `{ ok, out }` or `{ ok: false, why }` with git's own sentence. Paths are literal, never patterns. */
function runGit(repo, args) {
  try {
    return { ok: true, out: gitOutput(repo, ["--literal-pathspecs", ...args]) };
  } catch (error) {
    const said = String(error.stderr ?? "").trim() || String(error.message).split("\n")[0];
    return { ok: false, why: `git ${args[0]} failed: ${said}` };
  }
}

/** What a working scope may be against the base's: `undefined` when it is a shrink, else the sentence. */
function scopeGrowth(scope, baseScopes) {
  const same = baseScopes.find((base) => base.root === scope.root);
  if (same !== undefined) return same.proof === scope.proof ? undefined : `changed proof for scope \`${scope.root}\`: \`${same.proof}\` → \`${scope.proof}\``;
  const inside = baseScopes.find((base) => within(base.root, scope.root));
  if (inside !== undefined) return `wider scope \`${scope.root}\` — it holds the base scope \`${inside.root}\``;
  const holder = baseScopes.filter((base) => within(scope.root, base.root)).sort((a, b) => b.root.length - a.root.length)[0];
  if (holder === undefined) return `new scope \`${scope.root}\``;
  const keeps = scope.proof === holder.proof && holder.proof.startsWith(scope.root);
  return keeps ? undefined : `narrowed scope \`${scope.root}\` must keep the proof of the base scope that holds it (\`${holder.proof}\` of \`${holder.root}\`), and that proof must lie under the new root`;
}

/** Why a creation is refused or cannot be judged: `{ code, line }`, or `undefined` when the path never had history behind the base. */
function creationVerdict(repo, base) {
  const shallow = runGit(repo, ["rev-parse", "--is-shallow-repository"]);
  if (!shallow.ok) return { code: 2, line: shallow.why };
  if (shallow.out.trim() === "true") {
    return { code: 2, line: "this is a shallow clone, so whether the baseline path ever had history cannot be known — run `git fetch --unshallow`, then the check again" };
  }
  const seen = runGit(repo, ["log", base, "--format=%H", "--", BASELINE_FILE]); // the history behind the base ref only: another ref would make a local run and CI disagree
  if (!seen.ok) return { code: 2, line: seen.why };
  const first = seen.out.split("\n").find(Boolean);
  return first === undefined ? undefined : { code: 1, line: `a re-creation: \`${BASELINE_FILE}\` already has history behind ${base} (commit ${first.slice(0, 12)}); the baseline is created once and never again — see common/test-leftovers-baseline.md` };
}

const refuse = (line) => ({ code: 2, lines: [line] });

/**
 * `--baseline-shrinks`: `raw-temp-baseline.json` at the root of `repo`'s git repository, in the working tree, against `git show <base>:raw-temp-baseline.json`.
 * Returns `{ code, lines }` — 0 passes, 1 refuses (every reason in `lines`), 2 cannot judge (a symlink or folder in its place, a repository folder that is not
 * the git root, an unresolved base ref, a git failure, a shallow clone for a creation, an unreadable base copy). Never writes anything.
 */
export function baselineShrinks({ repo, base, allowCreate = false }) {
  const file = path.join(repo, BASELINE_FILE);
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch (error) {
    if (error.code !== "ENOENT") return refuse(`${BASELINE_FILE} cannot be read: ${error.message.split("\n")[0]}`);
  }
  if (stat?.isSymbolicLink()) return refuse(`${BASELINE_FILE} is a symlink — the baseline is a regular file at the repository root and never a link`);
  if (stat !== undefined && !stat.isFile()) return refuse(`${BASELINE_FILE} is not a regular file`);
  const top = runGit(repo, ["rev-parse", "--show-toplevel"]);
  if (!top.ok) return refuse(top.why);
  const rel = path.relative(realOrSelf(top.out.trim()), realOrSelf(repo));
  if (rel !== "" || path.isAbsolute(rel)) return refuse(`${repo} is not the root of the git repository (${top.out.trim()}) — the baseline is judged at the repository root`);
  if (base.startsWith("-") || !runGit(repo, ["rev-parse", "--verify", "--quiet", `${base}^{commit}`]).ok) {
    return refuse(`the base ref \`${base}\` is not available here — fetch it first (\`${FETCH}\` or the repository's own fetch), then run the check again; an unresolved base is never a pass`);
  }
  if (stat === undefined) return { code: 0, lines: [`${BASELINE_FILE}: absent now — drained (it only shrinks, and nothing is left)`] };
  const working = parseBaseline(fs.readFileSync(file, "utf8"));
  if (working.problem !== undefined) return { code: 1, lines: [`${BASELINE_FILE}: not a baseline — ${working.problem}`] };
  const listed = runGit(repo, ["ls-tree", "--name-only", base, "--", BASELINE_FILE]);
  if (!listed.ok) return refuse(listed.why);
  if (listed.out.trim() === "") {
    if (!allowCreate) return { code: 1, lines: [`${BASELINE_FILE}: a creation (absent at ${base}) — pass --allow-create in the one creation PR's own run, and record it there; never in a standing CI command`] };
    const refused = creationVerdict(repo, base);
    return refused === undefined ? { code: 0, lines: [`${BASELINE_FILE}: the one creation, allowed — it never had history behind ${base}`] } : { code: refused.code, lines: [`${BASELINE_FILE}: ${refused.line}`] };
  }
  const shown = runGit(repo, ["show", `${base}:${BASELINE_FILE}`]);
  if (!shown.ok) return refuse(shown.why);
  const before = parseBaseline(shown.out);
  if (before.problem !== undefined) return refuse(`${BASELINE_FILE}: the copy at ${base} is not a baseline (${before.problem}) — a shrink cannot be judged against it`);
  const baseCounts = countKeys(before.entries);
  const problems = [...countKeys(working.entries)].flatMap(([key, count]) => {
    const was = baseCounts.get(key) ?? 0;
    const [entryFile, sha256] = key.split("\0");
    if (count <= was) return [];
    return [was === 0 ? `new key — ${entryFile} ${sha256} is not in ${base}` : `raised count — ${entryFile} ${sha256}: ${was} → ${count} entries`];
  });
  const growth = working.scopes.map((scope) => scopeGrowth(scope, before.scopes)).filter((text) => text !== undefined);
  const all = [...problems, ...growth].map((text) => `${BASELINE_FILE}: ${text}`);
  return all.length === 0 ? { code: 0, lines: [`${BASELINE_FILE}: only shrinks against ${base}`] } : { code: 1, lines: all };
}
