// moved-blocks.mjs (library) — the checker and the recorder behind tools/moved-blocks.mjs.
//
// research/moved-blocks.json is ONE JSON array, append-only, of three entry shapes (todo/PLAN_node_rule_parity.md section
// 4.3). A move is whole lines and whole fences: a block is a range of lines of a source file, hashed as the folded text of
// those lines with a closing line end, and measured in bytes.
//
//   baseline    { id, status: "planned", epic, source, lines, beforeCommit, sha256, length [, supersededBy] }
//   activation  { id, activates, destination, destinationLines, beforeCommit }                 an owning epic, unchanged bytes
//   superseding { id, supersedes, justifiedBy, justifiedFiles, epic, source, lines, beforeCommit,
//                 sha256, length, destination, destinationLines }                                an owning epic, changed bytes
//
// The checker reads NO history, so it runs in a depth-1 checkout: a block is found by its hash anywhere in the file, which
// is why a section added above it does not break the check and a changed byte does. Everything that needs git (the commit
// exists, the bytes at that commit, the files a justifying commit touches) is done by the RECORDER, when the entry is
// written and history is at hand, and the facts are recorded in the entry.

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

import { gitOutput } from "./git.mjs";
import { fenceDepth, folded } from "./rule-body.mjs";

export const MANIFEST = "research/moved-blocks.json";
export const OWNING_EPICS = Object.freeze(["E2", "E3", "E4", "E5", "E6"]);

const BASELINE_KEYS = ["id", "status", "epic", "source", "lines", "beforeCommit", "sha256", "length"];
const ACTIVATION_KEYS = ["id", "activates", "destination", "destinationLines", "beforeCommit"];
const SUPERSEDING_KEYS = ["id", "supersedes", "justifiedBy", "justifiedFiles", "epic", "source", "lines", "beforeCommit", "sha256", "length", "destination", "destinationLines"];
const ID = /^[a-z][a-z0-9-]*$/;
const COMMIT = /^[0-9a-f]{40}$/;
const HASH = /^[0-9a-f]{64}$/;
const LINES = /^([1-9][0-9]*)-([1-9][0-9]*)$/;
const TAIL = "\n]\n";

export class Refusal extends Error {
  constructor(message) { super(message); this.name = "Refusal"; }
}

const sha256Hex = text => createHash("sha256").update(text).digest("hex");

// ---- lines and blocks ---------------------------------------------------------------------------------------------------

/** The lines of a text, folded, without the empty element a final line end leaves; `terminated` says whether it had one. */
export function linesOf(content) {
  const lines = folded(content).split("\n");
  const terminated = lines.length > 0 && lines[lines.length - 1] === "";
  if (terminated) lines.pop();
  return { lines, terminated };
}

const blockText = (lines, from, to) => `${lines.slice(from - 1, to).join("\n")}\n`;

/** `N` or `N-M`, from <= to, normalised to `N-M`. Anything else is not a whole-line range. */
export function parseRange(range) {
  const match = /^([1-9][0-9]*)(?:-([1-9][0-9]*))?$/.exec(String(range));
  const whole = "a move is whole lines; split the line by whitespace first (E1.S0b)";
  if (!match) throw new Refusal(`${JSON.stringify(range)} is not a range of whole lines: ${whole}`);
  const from = Number(match[1]);
  const to = match[2] === undefined ? from : Number(match[2]);
  if (from > to) throw new Refusal(`${JSON.stringify(range)} runs backwards: ${whole}`);
  return { from, to };
}

/** The block a range names in a text, or a Refusal: past the end, or starting or ending inside a fence. */
export function blockOf(content, from, to, label) {
  const { lines, terminated } = linesOf(content);
  const depth = fenceDepth(content);
  const split = "the range would split a fenced block; move the whole fence or split by whitespace first (E1.S0b)";
  if (from > lines.length) throw new Refusal(`lines ${from}-${to} are past the end of ${label} (${lines.length} lines)`);
  if (from > 1 && depth[from - 2]) throw new Refusal(`${split} — line ${from - 1} ends inside a fence`);
  if (to > lines.length) throw new Refusal(`lines ${from}-${to} are past the end of ${label} (${lines.length} lines)`);
  if (depth[to - 1]) throw new Refusal(`${split} — line ${to} ends inside a fence`);
  if (to === lines.length && !terminated) throw new Refusal(`the last line of ${label} has no line end; a block ends with one`);
  const text = blockText(lines, from, to);
  return { text, length: Buffer.byteLength(text), sha256: sha256Hex(text) };
}

/** Where a block sits in a text: the 1-based `from-to` of every window of its line count that hashes to it. */
export function findRuns(content, count, length, hash) {
  const { lines } = linesOf(content);
  const found = [];
  for (let at = 0; at + count <= lines.length; at += 1) {
    const text = blockText(lines, at + 1, at + count);
    if (Buffer.byteLength(text) === length && sha256Hex(text) === hash) found.push(`${at + 1}-${at + count}`);
  }
  return found;
}

const countOf = lines => { const { 1: from, 2: to } = LINES.exec(lines); return Number(to) - Number(from) + 1; };

// ---- the checker ---------------------------------------------------------------------------------------------------------

function safeRelative(root, relative) {
  if (typeof relative !== "string" || !relative || relative.includes("\\") || relative.startsWith("/") || /^[A-Za-z]:/.test(relative) || relative.split("/").includes("..")) return null;
  const full = path.resolve(root, relative);
  return full.startsWith(path.resolve(root) + path.sep) ? full : null;
}

const shapeOf = entry => (entry && typeof entry === "object" && !Array.isArray(entry)
  ? Object.hasOwn(entry, "status") ? "baseline" : Object.hasOwn(entry, "activates") ? "activation" : Object.hasOwn(entry, "supersedes") ? "superseding" : "unknown"
  : "unknown");

function schemaFindings(entry, shape, root) {
  const here = `${entry?.id ?? "(no id)"}`;
  const keys = Object.keys(entry);
  const findings = [];
  const wanted = shape === "baseline" ? BASELINE_KEYS : shape === "activation" ? ACTIVATION_KEYS : SUPERSEDING_KEYS;
  const allowed = shape === "baseline" ? [...BASELINE_KEYS, "supersededBy"] : wanted;
  for (const key of wanted) if (!Object.hasOwn(entry, key)) findings.push(`${here}: the ${shape} entry has no ${key}`);
  for (const key of keys) if (!allowed.includes(key)) findings.push(`${here}: the ${shape} entry has an unknown field ${key}`);
  if (!ID.test(entry.id ?? "")) findings.push(`${here}: id is lower-case words joined by -`);
  if (shape === "baseline" && entry.status !== "planned") findings.push(`${here}: a baseline's status is planned`);
  if (shape !== "activation" && !OWNING_EPICS.includes(entry.epic)) findings.push(`${here}: epic is one of ${OWNING_EPICS.join(", ")}`);
  for (const key of ["source", "destination"]) if (Object.hasOwn(entry, key) && !safeRelative(root, entry[key])) findings.push(`${here}: ${key} is a root-relative path inside the repository`);
  for (const key of ["lines", "destinationLines"]) {
    const match = Object.hasOwn(entry, key) ? LINES.exec(entry[key] ?? "") : null;
    if (Object.hasOwn(entry, key) && (!match || Number(match[1]) > Number(match[2]))) findings.push(`${here}: ${key} is from-to, whole lines, from <= to`);
  }
  if (!COMMIT.test(entry.beforeCommit ?? "")) findings.push(`${here}: beforeCommit is 40 hex`);
  if (shape !== "activation") {
    if (!HASH.test(entry.sha256 ?? "")) findings.push(`${here}: sha256 is 64 hex`);
    if (!Number.isSafeInteger(entry.length) || entry.length < 1) findings.push(`${here}: length is a positive byte count`);
  }
  if (shape === "superseding") {
    if (!COMMIT.test(entry.justifiedBy ?? "")) findings.push(`${here}: justifiedBy is 40 hex`);
    if (!Array.isArray(entry.justifiedFiles) || entry.justifiedFiles.length !== 1 || entry.justifiedFiles[0] !== entry.source) findings.push(`${here}: justifiedFiles is exactly [source] — a justifying commit touches only the block's source file`);
  }
  return findings;
}

export function verifyManifest(root, entries, landedEpics) {
  if (!Array.isArray(entries)) return [`${MANIFEST} is not a JSON array`];
  const findings = [];
  const shapes = entries.map(shapeOf);
  const index = new Map();
  entries.forEach((entry, at) => {
    if (shapes[at] === "unknown") { findings.push(`entry ${at + 1}: none of the three shapes (a baseline has status, an activation activates, a superseding entry supersedes)`); return; }
    if (index.has(entry.id)) findings.push(`${entry.id}: id appears twice`);
    else index.set(entry.id, at);
  });
  const schema = [];
  entries.forEach((entry, at) => { if (shapes[at] !== "unknown") schema.push(...schemaFindings(entry, shapes[at], root)); });
  findings.push(...schema);
  if (findings.length) return findings; // the references below assume well-formed entries

  const baseline = id => (index.has(id) && shapes[index.get(id)] === "baseline" ? entries[index.get(id)] : null);
  const activations = new Map();
  const supersessions = new Map();
  entries.forEach((entry, at) => {
    if (shapes[at] === "activation" || shapes[at] === "superseding") {
      const key = shapes[at] === "activation" ? "activates" : "supersedes";
      const target = entry[key];
      if (!index.has(target)) findings.push(`${entry.id}: ${key} ${target}, which is no entry`);
      else if (!baseline(target)) findings.push(`${entry.id}: ${key} ${target}, which is not a baseline`);
      else if (index.get(target) >= at) findings.push(`${entry.id}: ${key} ${target}, which comes later — a reference points back`);
      else (shapes[at] === "activation" ? activations : supersessions).set(target, [...((shapes[at] === "activation" ? activations : supersessions).get(target) ?? []), entry]);
    }
    if (shapes[at] === "baseline" && Object.hasOwn(entry, "supersededBy")) {
      const by = index.has(entry.supersededBy) ? entries[index.get(entry.supersededBy)] : null;
      if (!by || shapes[index.get(entry.supersededBy)] !== "superseding" || by.supersedes !== entry.id) findings.push(`${entry.id}: supersededBy ${entry.supersededBy}, which is no superseding entry for it`);
      else if (index.get(entry.supersededBy) <= at) findings.push(`${entry.id}: supersededBy ${entry.supersededBy}, which comes earlier — a reference points forward`);
    }
  });
  for (const [target, list] of supersessions) {
    if (!Object.hasOwn(baseline(target), "supersededBy") && list.length === 1) findings.push(`${target}: superseded by ${list[0].id}, which the baseline does not record as supersededBy`);
  }

  const read = relative => {
    const full = safeRelative(root, relative);
    return full && fs.existsSync(full) && fs.statSync(full).isFile() ? fs.readFileSync(full, "utf8") : null;
  };
  const checkMove = (entry, source, hash, length, count) => {
    const destination = read(entry.destination);
    if (destination === null) { findings.push(`${entry.id}: the destination ${entry.destination} does not exist`); return; }
    const { lines } = linesOf(destination);
    const [, from, to] = LINES.exec(entry.destinationLines);
    if (Number(to) - Number(from) + 1 !== count || Number(to) > lines.length || sha256Hex(blockText(lines, Number(from), Number(to))) !== hash) {
      findings.push(`${entry.id}: ${entry.destination} lines ${entry.destinationLines} do not hold the block's bytes — a move never changes the block's words`);
    } else if (findRuns(destination, count, length, hash).length !== 1) {
      findings.push(`${entry.id}: ${entry.destination} holds the block more than once; a move places it exactly once`);
    }
    const origin = read(source);
    if (origin !== null && findRuns(origin, count, length, hash).length > 0) findings.push(`${entry.id}: ${source} still holds the block that moved to ${entry.destination}`);
  };

  entries.forEach((entry, at) => {
    if (shapes[at] === "baseline") {
      const acts = activations.get(entry.id) ?? [];
      const sups = supersessions.get(entry.id) ?? [];
      if (acts.length + sups.length > 1) { findings.push(`${entry.id}: paired more than once (${acts.length} activation(s), ${sups.length} supersession(s)); a baseline is activated once or superseded once`); return; }
      if (acts.length + sups.length === 1) return; // judged through its pair; a superseded baseline is evidence only
      if (landedEpics.includes(entry.epic)) findings.push(`${entry.id}: unpaired baseline whose epic has landed (${entry.epic}) — activate it, supersede it, or the epic did not finish its move`);
      const origin = read(entry.source);
      if (origin === null) findings.push(`${entry.id}: the source ${entry.source} does not exist`);
      else {
        const runs = findRuns(origin, countOf(entry.lines), entry.length, entry.sha256);
        if (runs.length !== 1) findings.push(`${entry.id}: ${entry.source} holds ${runs.length} line-start runs of the recorded block (${entry.length} B), expected exactly one — a byte changed, or the block moved without an activation`);
      }
    } else if (shapes[at] === "activation") {
      const base = baseline(entry.activates);
      if (base && (activations.get(entry.activates) ?? []).length === 1 && !(supersessions.get(entry.activates) ?? []).length) {
        checkMove(entry, base.source, base.sha256, base.length, countOf(base.lines));
      }
    } else if (shapes[at] === "superseding") {
      const base = baseline(entry.supersedes);
      if (base && (supersessions.get(entry.supersedes) ?? []).length === 1 && !(activations.get(entry.supersedes) ?? []).length) {
        if (base.source !== entry.source) findings.push(`${entry.id}: supersedes ${base.id} of ${base.source}, but is recorded for ${entry.source}`);
        checkMove(entry, entry.source, entry.sha256, entry.length, countOf(entry.lines));
      }
    }
  });
  return findings;
}

export function summary(entries) {
  const count = shape => entries.filter(entry => shapeOf(entry) === shape).length;
  return { baselines: count("baseline"), activated: count("activation"), superseded: count("superseding") };
}

// ---- the recorder --------------------------------------------------------------------------------------------------------

const manifestFile = root => path.join(root, MANIFEST);

function readManifest(root) {
  const file = manifestFile(root);
  if (!fs.existsSync(file)) throw new Refusal(`${MANIFEST} does not exist; start it as "[\\n]\\n"`);
  const text = fs.readFileSync(file, "utf8");
  if (!text.endsWith(TAIL) && text !== "[]\n") throw new Refusal(`${MANIFEST} must be a JSON array that ends with a closing bracket on its own line`);
  let entries;
  try { entries = JSON.parse(text); } catch (error) { throw new Refusal(`${MANIFEST} is not valid JSON: ${error.message}`); }
  if (!Array.isArray(entries)) throw new Refusal(`${MANIFEST} is not a JSON array`);
  return { text, entries };
}

/** The new file text: the entry inserted before the closing bracket, with its separating comma; every earlier byte stays. */
export function appendEntry(text, entry) {
  const head = text === "[]\n" ? "[" : text.slice(0, -TAIL.length);
  const json = JSON.stringify(entry, null, 2).split("\n").map(line => `  ${line}`).join("\n");
  return `${head}${head === "[" ? "\n" : ",\n"}${json}${TAIL}`;
}

/** The one in-place edit the file ever gets: a superseded baseline gains `supersededBy`, after its last field. */
export function markSuperseded(text, id, by) {
  // Tolerant of spacing: the file is append-only and may have been hand-formatted, and the key order is the only thing relied on.
  const own = new RegExp(`"id"\\s*:\\s*${JSON.stringify(id).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
  const found = [...text.matchAll(own)];
  if (found.length !== 1) throw new Refusal(`${id} is not exactly one entry of ${MANIFEST}`);
  const at = found[0].index;
  const tail = /"length"\s*:\s*\d+/.exec(text.slice(at));
  if (!tail) throw new Refusal(`${id} has no length field to append after`);
  const end = at + tail.index + tail[0].length;
  return `${text.slice(0, end)},\n    "supersededBy": ${JSON.stringify(by)}${text.slice(end)}`;
}

function write(root, text) {
  JSON.parse(text); // never write what would not parse
  const file = manifestFile(root);
  const temporary = `${file}.tmp`;
  try {
    fs.writeFileSync(temporary, text);
    fs.renameSync(temporary, file);
  } catch (error) {
    try { fs.rmSync(temporary, { force: true }); } catch { /* the failure below is the one to report */ }
    throw new Refusal(`${MANIFEST} could not be written (${error.message}); nothing was changed`);
  }
}

function resolveCommit(root, commit) {
  if (typeof commit !== "string" || !/^[0-9A-Za-z][0-9A-Za-z._/@{}^~-]*$/.test(commit)) throw new Refusal(`${JSON.stringify(commit)} is not a commit`);
  try { return gitOutput(root, ["rev-parse", "--verify", "--quiet", `${commit}^{commit}`]).trim(); } catch { throw new Refusal(`unknown commit ${commit}`); }
}

function sourceAt(root, commit, source) {
  if (!safeRelative(root, source)) throw new Refusal(`${JSON.stringify(source)} is not a root-relative file inside the repository`);
  try { return gitOutput(root, ["show", `${commit}:${source}`]); } catch { throw new Refusal(`${source} does not exist at ${commit}`); }
}

function checkNew(id, epic, entries) {
  if (!ID.test(id ?? "")) throw new Refusal(`${JSON.stringify(id)} is not an id (lower-case words joined by -)`);
  if (entries.some(entry => entry.id === id)) throw new Refusal(`${id} already exists in ${MANIFEST}; ids are never reused`);
  if (!OWNING_EPICS.includes(epic)) throw new Refusal(`epic ${JSON.stringify(epic)} is none of ${OWNING_EPICS.join(", ")}`);
}

export function recordBaseline(root, { source, range, commit, epic, id }) {
  const { text, entries } = readManifest(root);
  checkNew(id, epic, entries);
  const { from, to } = parseRange(range);
  const resolved = resolveCommit(root, commit);
  const block = blockOf(sourceAt(root, resolved, source), from, to, `${source} at ${resolved}`);
  const entry = { id, status: "planned", epic, source, lines: `${from}-${to}`, beforeCommit: resolved, sha256: block.sha256, length: block.length };
  write(root, appendEntry(text, entry));
  return entry;
}

function placeIn(root, destination, block) {
  const full = safeRelative(root, destination);
  if (!full) throw new Refusal(`${JSON.stringify(destination)} is not a root-relative file inside the repository`);
  if (!fs.existsSync(full)) throw new Refusal(`${destination} does not exist in the working tree; place the block there before recording`);
  const runs = findRuns(fs.readFileSync(full, "utf8"), block.text.split("\n").length - 1, block.length, block.sha256);
  if (runs.length !== 1) throw new Refusal(`the block is in ${destination} ${runs.length} time(s) as whole lines, expected exactly once`);
  return runs[0];
}

export function recordMove(root, { source, range, commit, destination, epic, id, supersedes, justifiedBy }) {
  const { text, entries } = readManifest(root);
  checkNew(id, epic, entries);
  const { from, to } = parseRange(range);
  const resolved = resolveCommit(root, commit);
  const block = blockOf(sourceAt(root, resolved, source), from, to, `${source} at ${resolved}`);
  const paired = new Set(entries.flatMap(entry => [entry.activates, entry.supersedes].filter(Boolean)));
  const unpaired = entries.filter(entry => entry.status === "planned" && entry.source === source && !paired.has(entry.id) && !Object.hasOwn(entry, "supersededBy"));
  const same = unpaired.find(entry => entry.sha256 === block.sha256 && entry.length === block.length);

  if (same) {
    if (supersedes || justifiedBy) throw new Refusal(`the block is unchanged from ${same.id}: it is activated, not superseded — drop --supersedes and --justified-by`);
    if (epic !== same.epic) throw new Refusal(`${same.id} belongs to ${same.epic}, not ${epic}`);
    const destinationLines = placeIn(root, destination, block);
    const entry = { id, activates: same.id, destination, destinationLines, beforeCommit: resolved };
    write(root, appendEntry(text, entry));
    return entry;
  }

  // A block that equals a baseline which is already paired is not "a changed block": say which pairing took it.
  const taken = entries.find(entry => entry.status === "planned" && entry.source === source && paired.has(entry.id) && entry.sha256 === block.sha256 && entry.length === block.length)
    ?? entries.find(entry => entry.status === "planned" && entry.source === source && Object.hasOwn(entry, "supersededBy") && entry.sha256 === block.sha256 && entry.length === block.length);
  if (taken) {
    const by = entries.find(entry => entry.activates === taken.id);
    const over = entries.find(entry => entry.supersedes === taken.id);
    const how = by ? `activated by ${by.id}` : `superseded by ${over?.id ?? taken.supersededBy}`;
    throw new Refusal(`baseline ${taken.id} is already ${how}; a block moves once — to move it again, record the new location as a new baseline from the destination`);
  }
  if (!supersedes) throw new Refusal(`the block differs from every unpaired baseline of ${source}: a changed block needs --supersedes <baseline id> and --justified-by <commit>`);
  if (!justifiedBy) throw new Refusal(`superseding ${supersedes} needs --justified-by <commit>, the commit that changed the block's words`);
  const old = unpaired.find(entry => entry.id === supersedes);
  if (!old) throw new Refusal(`${supersedes} is not an unpaired baseline of ${source}`);
  if (epic !== old.epic) throw new Refusal(`${old.id} belongs to ${old.epic}, not ${epic}`);
  const justifying = resolveCommit(root, justifiedBy);
  // A merge commit's own diff is a combination of its parents', so what it "touches" is not one file's change.
  const parents = gitOutput(root, ["rev-list", "--parents", "-n", "1", justifying]).trim().split(/\s+/).length - 1;
  if (parents > 1) throw new Refusal(`commit ${justifying} is a merge commit (${parents} parents); a justifying commit is one ordinary commit that changed the block's source file`);
  const touched = gitOutput(root, ["show", "--name-only", "--pretty=format:", "--no-renames", justifying]).split("\n").map(line => line.trim()).filter(Boolean);
  const others = touched.filter(file => file !== source);
  if (others.length || !touched.includes(source)) {
    throw new Refusal(`commit ${justifying} touches ${others.length ? others.join(", ") : "no file"} besides ${source}; a justifying commit touches only the block's source file`);
  }
  const destinationLines = placeIn(root, destination, block);
  const entry = {
    id, supersedes, justifiedBy: justifying, justifiedFiles: [source], epic, source, lines: `${from}-${to}`, beforeCommit: resolved,
    sha256: block.sha256, length: block.length, destination, destinationLines,
  };
  write(root, appendEntry(markSuperseded(text, supersedes, id), entry));
  return entry;
}
