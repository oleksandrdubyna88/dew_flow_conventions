#!/usr/bin/env node
// ownership-check.mjs — a shared rule names no product.
//
// This repository holds what several products share. It had drifted: measured 2026-09-14, **53
// references to a named repository across 19 of 27 rule files**, 27 of them in one rule. The drift is
// not untidiness, it is a mechanism — a rule that cites a product's file is a rule somebody edits
// whenever that product is worked on, so working in any consumer produced a commit here by design.
// That was half the answer to "why does every pull request change the conventions".
//
// The rule this enforces is common/rule-ownership.md, and its test is one second long: would another
// repository still need that sentence if the named one did not exist? This file answers the
// mechanical half of that question — it finds the names, and a human decides what each one means.
//
// The detector is a PATTERN, not a list of the six repositories. A list would pass the seventh
// repository to join the family, which is the one nobody would think to add.
//
// Run from this repository's root:  node tools/ownership-check.mjs [--warn] [--baseline <path>]
// Exit: 0 clean, or --warn.  1 findings, a malformed marker, a downward dependency, or nothing scanned.

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/** The four directories loadCatalog walks. Anything outside them is not a rule. */
const RULE_DIRECTORIES = ["common", "csharp", "rust", "typescript"];

/** Every repository in this family is `dew_flow_<name>`. The pattern, so a new one is caught too. */
const REPOSITORY = /\bdew_flow_[a-z0-9_]+\b/gi;

/** The predecessor programme's checkout, frozen and no longer a source, still cited by name. */
const LEGACY = /\bClaudeRag\b/g;

/** Product names that are not repository names. Word-bounded, case-insensitive. */
const PRODUCTS = /\b(coai|ConnectOtherAIs|connect_other_ais|CredsForDevs|creds_for_devs|rag_qln|RagQln)\b/gi;

/**
 * An MCP tool name, which is the densest product reference in this corpus and the one a word-bounded
 * search cannot see: `_` is a word character, so `\bcoai\b` does NOT match inside `mcp__coai__open`.
 * That gap hid itself twice — the tool reported a clean file, and a fixture written to prove the
 * `owns:` marker worked passed because nothing had been detected to declare.
 *
 * Matched by SHAPE rather than by product, so another vendor's tools are caught the same way. These
 * are also the likeliest legitimate `owns:` declarations: a tool name is what a session must type,
 * and there is no generic spelling of it.
 */
const MCP_TOOL = /\bmcp__[a-z0-9]+__[a-z0-9_]+\b/gi;

/**
 * The ambiguous nouns — matched ONLY behind a determiner that makes them specific.
 *
 * Measured over the 27 rule files before this check existed: the definite form appears 24 times and
 * is almost always a product reference ("the sidecar has no Serilog", "the benchmark's contract"),
 * while the indefinite form appears 6 times and is always generic. Matching the bare noun would also
 * fire on `tasks: ["benchmark"]`, which is a legal value in the task vocabulary — and a check that
 * refuses a legal file is a check somebody switches off within the week.
 */
const DEFINITE = /\b(?:the|its|our)\s+(sidecar|benchmark|daemon|extension|panel|broker|vault|crate|gate)\b/gi;

/**
 * `<!-- owns: <token> — <reason> -->`. The reason is what makes it a decision and not an allowlist.
 *
 * The pattern captures the whole comment body and the SPLIT happens in JavaScript. Spelling the two
 * halves as one regex meant a lazy run of "anything but an em dash" immediately before an alternation
 * that can match a hyphen — super-linear backtracking, reported by the scanner, and it needed a
 * second pattern beside it for the separator-less shape. One capture reads the same and cannot
 * backtrack: `[^>]` never crosses the `>` that ends the comment.
 */
const MARKER = /<!--\s*owns:([^>]*)-->/gi;

/** Where a marker's token ends and its reason begins: an em dash, or two hyphens. */
const SEPARATOR = /—|--/;

/**
 * A reason has to say something. Ten characters and three words stop "ok", "needed" and "see above";
 * a placeholder list stops the next few that occurred to a reviewer.
 *
 * No check can judge whether a justification is HONEST — that is what review is for, and the marker
 * is deliberately visible in the diff so a reviewer sees it. What this can do is refuse the shapes
 * that are obviously not a reason at all.
 */
const MIN_REASON = 10;
const MIN_REASON_WORDS = 3;
const PLACEHOLDER = /^(see above|see below|needed|required|necessary|obvious|todo|tbd|n\/?a|because|why|reason|it is needed)\b/i;

/** Whether a marker's reason is a reason, rather than the shape of one. */
export const isReason = (reason) =>
  reason.length >= MIN_REASON
  && reason.split(/\s+/).filter(Boolean).length >= MIN_REASON_WORDS
  && !PLACEHOLDER.test(reason);

const WARN = process.argv.includes("--warn");

/**
 * The ratchet, PER FILE.
 *
 * `--warn` alone would let a NEW product reference merge unnoticed for as long as the backfill takes,
 * which defeats the one thing this rule promises — that the drift cannot recur.
 *
 * A single repository-wide number would not fix it either, and that was the first attempt: if one
 * author removes ten references from one rule while another adds two to a different rule, the total
 * still falls and the additions merge unseen. Worse, every cleanup pull request would have to edit
 * the CI workflow to lower the number, so concurrent cleanups conflict on the one line they all
 * touch. A reduction in one file must never buy capacity in another.
 *
 * So the baseline is a map of file -> count. A file over its recorded count fails; a file under it is
 * the cleanup working; a file with findings and NO entry is new drift. The armed state is deleting
 * the baseline file, at which point any finding at all fails.
 */
const BASELINE_DEFAULT = "tools/ownership-baseline.json";
const baselineIndex = process.argv.indexOf("--baseline");
const BASELINE_PATH = baselineIndex === -1 ? undefined : process.argv[baselineIndex + 1];
/**
 * `--baseline` as the LAST argument reads as no flag at all, and the run would then check the
 * default baseline while its author believed it was checking another one — a silent answer to a
 * different question. The same shape as `--max-days soon` becoming NaN in `release-distance`.
 */
const BASELINE_PATH_MISSING = baselineIndex !== -1 && BASELINE_PATH === undefined;

/**
 * Text with fenced code blocks removed.
 *
 * Used for MARKERS only, never for findings. A marker is an instruction to this tool, and one inside
 * a fence OR an inline code span is being SHOWN rather than GIVEN. Not hypothetical: the rule that
 * documents this syntax was reported as carrying a malformed marker, by the check it defines. A
 * product NAME in a fence is still a product name, so findings keep reading them.
 */
const outsideFences = (text) =>
  text.replace(/^```[\s\S]*?^```/gm, "").replace(/`[^`\n]*`/g, "");

/** Every `owns:` token declared in one file, and the markers that failed to declare anything. */
export function markersIn(raw) {
  const text = outsideFences(raw);
  const tokens = [];
  const malformed = [];
  for (const match of text.matchAll(MARKER)) {
    const body = match[1].trim();
    const at = body.search(SEPARATOR);
    const token = (at === -1 ? body : body.slice(0, at)).trim();
    const reason = at === -1 ? "" : body.slice(at).replace(SEPARATOR, "").trim();
    // A separator-less marker declares nothing and lands here as a reason of "", which is the same
    // verdict by the same route rather than a second pattern that has to be kept in step.
    if (token === "" || !isReason(reason)) malformed.push({ token, reason });
    else tokens.push(token);
  }
  return { tokens, malformed };
}

/** Product references in one file, as `{ file, line, kind, token }`, markers already stripped. */
export function findingsIn(text, file) {
  const withoutMarkers = text.replace(MARKER, "");
  const lines = withoutMarkers.split("\n");
  const found = [];
  for (const [index, line] of lines.entries()) {
    for (const [pattern, kind] of [[REPOSITORY, "REPOSITORY"], [LEGACY, "LEGACY"], [PRODUCTS, "PRODUCT"], [MCP_TOOL, "PRODUCT"], [DEFINITE, "PRODUCT"]]) {
      for (const match of line.matchAll(pattern)) {
        found.push({ file, line: index + 1, kind, token: match[0] });
      }
    }
  }
  return found;
}

/**
 * `depends:` entries that point at a repo-local rule — the direction that cannot resolve.
 *
 * The resolver parses frontmatter with a real YAML parser, so `["local.x"]`, `[local.x]` and a
 * block sequence of `- local.x` are three legal spellings of one thing. This tool has no YAML
 * dependency on purpose — it runs before `npm ci`, which is what lets it be the FIRST check —
 * so it reads all three by hand. A reader of only the quoted flow form would pass two spellings of
 * the dependency that stops rule loading everywhere it is missing.
 */
export function downwardDependencies(text) {
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (frontmatter === null) return [];

  const flow = /^depends:[ \t]*\[([^\]]*)\]/m.exec(frontmatter[1]);
  const items = [];
  if (flow !== null) {
    items.push(...flow[1].split(",").map((item) => item.trim()));
  } else {
    // A block sequence: `depends:` on its own line, then indented `- item` lines until the next key.
    //
    // Read line by line rather than as `(?:[ \t]+-[^\n]*\n?)+`, which the scanner reported as
    // exponential backtracking. Measured before replacing it: it is not — that group can match one
    // line many ways, but nothing follows it, so the engine takes the first way and never retries;
    // 22 `- item` runs on one line matched in under a millisecond. What the report was right about
    // is that the pattern cannot be read for the guarantee, and the loop below can: it takes each
    // line once.
    const lines = frontmatter[1].split("\n");
    const start = lines.findIndex((line) => /^depends:[ \t]*(?:#[^\n]*)?$/.test(line));
    if (start === -1) return [];
    for (const line of lines.slice(start + 1)) {
      const item = /^[ \t]+-[ \t]*(.*)$/.exec(line);
      if (item === null) break;
      items.push(item[1].trim());
    }
  }

  return items
    .map((item) => item.replace(/^["']|["']$/g, "").trim())
    .filter((id) => id.startsWith("local."));
}

export function rulesIn(root) {
  const files = [];
  for (const dir of RULE_DIRECTORIES) {
    const full = path.join(root, dir);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full).sort()) {
      if (name.endsWith(".md")) files.push(path.join(dir, name));
    }
  }
  return files;
}

/**
 * The baseline, or the reason there is none.
 *
 * Read before anything is scanned, so an unreadable or malformed one stops the run rather than
 * silently allowing everything: a ratchet that cannot be LOADED must not look like a ratchet that
 * found nothing. `{ failed: true }` means the run is over; `{ baseline: undefined }` means there is
 * no baseline file, which is the armed state.
 */
function loadBaseline(root) {
  const named = BASELINE_PATH ?? BASELINE_DEFAULT;
  const file = path.join(root, named);

  if (!fs.existsSync(file)) {
    if (BASELINE_PATH === undefined) return { baseline: undefined };
    console.error(`ownership-check: no baseline at ${BASELINE_PATH}.`);
    return { failed: true };
  }

  try {
    const baseline = JSON.parse(fs.readFileSync(file, "utf8")).files;
    if (baseline === null || typeof baseline !== "object") throw new Error("no `files` map");
    return { baseline };
  } catch (error) {
    console.error(`ownership-check: ${named} could not be read as a baseline (${error.message}).`);
    console.error("  A baseline that does not parse would switch the ratchet off and still look green.");
    return { failed: true };
  }
}

/** Normalised for comparison: a marker and a finding are the same name however they were typed. */
const normalise = (token) => token.toLowerCase().replace(/\s+/g, " ").trim();

/** Every file's findings, malformed markers and downward dependencies, in one pass over the corpus. */
function scanCorpus(root, files) {
  const findings = [];
  const malformed = [];
  const downward = [];

  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    const markers = markersIn(text);
    for (const bad of markers.malformed) malformed.push({ file, ...bad });
    for (const id of downwardDependencies(text)) downward.push({ file, id });

    // A marker grants its token in the file that carries it, and nowhere else — otherwise one
    // declaration would licence the name across the corpus, which is an allowlist with extra steps.
    //
    // The comparison is EXACT. It was `includes` first, which made a short declaration an allowlist
    // for the corpus: `<!-- owns: e — … -->` is a perfectly well-formed marker, and `e` sits inside
    // every `dew_flow_*` name there is.
    const declared = new Set(markers.tokens.map(normalise));
    for (const finding of findingsIn(text, file)) {
      if (declared.has(normalise(finding.token))) continue;
      findings.push(finding);
    }
  }

  return { findings, malformed, downward };
}

/** Everything that was found, printed in full whatever the baseline goes on to decide. */
function report({ findings, malformed, downward }, fileCount) {
  for (const f of findings) {
    console.error(`ownership-check: ${f.kind} ${f.file}:${f.line} — "${f.token}"`);
  }
  for (const m of malformed) {
    console.error(`ownership-check: MARKER ${m.file} — "owns: ${m.token}" carries no reason.`);
    console.error("  The reason is the whole difference between a decision and an allowlist somebody grew.");
  }
  for (const d of downward) {
    console.error(`ownership-check: DEPENDS ${d.file} — depends on ${d.id}.`);
    console.error("  A shared rule never depends on a repo-local one: it would resolve only in the");
    console.error("  repositories that happen to have it and fail everywhere else, stopping rule loading.");
  }

  if (findings.length === 0) return;
  const inFiles = new Set(findings.map((f) => f.file)).size;
  console.error("");
  console.error(`ownership-check: ${findings.length} product reference(s) in ${inFiles} of ${fileCount} shared rules.`);
  console.error("  Apply the one-second test (common/rule-ownership.md): would another repository still");
  console.error("  need that sentence if the named one did not exist? If yes, anonymise the citation and");
  console.error("  keep its date. If no, move it to the repository that owns it. A name that IS the");
  console.error("  instruction declares itself in the same file:");
  console.error("      <!-- owns: <token> — why a generic form would be unusable -->");
}

/** Each file's findings against its recorded count, as `{ over, below }`. */
function compareToBaseline(findings, baseline) {
  const perFile = new Map();
  for (const f of findings) {
    const key = f.file.replaceAll("\\", "/");
    perFile.set(key, (perFile.get(key) ?? 0) + 1);
  }

  const over = [];
  const below = [];
  for (const file of new Set([...perFile.keys(), ...Object.keys(baseline)])) {
    const count = perFile.get(file) ?? 0;
    const allowed = baseline[file] ?? 0;
    if (count > allowed) over.push({ file, count, allowed });
    else if (count < allowed) below.push({ file, count, allowed });
  }
  return { over, below };
}

/**
 * The ratchet's verdict.
 *
 * The recorded count is a floor as well as a ceiling. A file allowed to sit UNDER its number leaves
 * room a reference can be added back into later, under the old count, with nothing to say a word —
 * the same hole the per-file split closed, one level down. So a cleanup is not finished until the
 * baseline says so, in the same commit, which is what makes the number a record of the corpus rather
 * than a budget somebody remembers to spend.
 */
function judgeBaseline(findings, baseline) {
  const { over, below } = compareToBaseline(findings, baseline);

  if (over.length === 0 && below.length === 0) {
    console.log(`ownership-check: at the baseline — ${findings.length} finding(s), every file at its recorded count.`);
    return 0;
  }

  console.error("");
  for (const b of below) {
    const cure = b.count === 0 ? "remove its entry" : `lower it to ${b.count}`;
    console.error(`ownership-check: BELOW BASELINE ${b.file} — ${b.count} finding(s), ${b.allowed} recorded — ${cure}.`);
  }
  if (below.length > 0) {
    console.error("  That file got cleaner, which is the work. It is not finished until the baseline moves");
    console.error("  with it: a number left above what the file carries is room a later reference can be");
    console.error("  added back into without this check saying anything at all.");
  }
  for (const o of over) {
    console.error(`ownership-check: OVER BASELINE ${o.file} — ${o.count} finding(s), ${o.allowed} recorded.`);
  }
  if (over.length === 0) return 1;

  console.error("  The count for that file GREW. Usually that is an undeclared product reference somebody");
  console.error("  added; it can also be an existing one duplicated by a reword or a split sentence. Either");
  console.error("  way `git diff` against the base branch shows which line, and the cure is the same:");
  console.error("  anonymise it, declare it with an `owns:` marker, or move it to the repository that owns it.");
  console.error("  The backlog is allowed while it is worked off. Nothing may be ADDED to it — and a file");
  console.error("  getting cleaner never buys room for another file to get worse.");
  return 1;
}

/**
 * The scan. Returns an exit code rather than calling process.exit, so importing this module for its
 * parsers runs nothing — the same guard post-deploy-check uses, and the reason the tests can exercise
 * findingsIn and markersIn without the whole corpus being scanned on import.
 */
export function main() {
  const root = process.cwd();

  if (BASELINE_PATH_MISSING) {
    console.error("ownership-check: --baseline needs a path after it.");
    console.error(`  Without one this would have checked ${BASELINE_DEFAULT} and said nothing about it.`);
    return 1;
  }

  const loaded = loadBaseline(root);
  if (loaded.failed) return 1;

  const files = rulesIn(root);
  if (files.length === 0) {
    // Zero findings because nothing was read looks exactly like zero findings because everything was
    // clean. Say which one this is.
    console.error("ownership-check: scanned no rule files under common/, csharp/, rust/, typescript/.");
    console.error("  Run it from the conventions repository root; from anywhere else it would report a");
    console.error("  clean bill of health for a corpus it never opened.");
    return 1;
  }

  const scan = scanCorpus(root, files);
  if (scan.findings.length === 0 && scan.malformed.length === 0 && scan.downward.length === 0) {
    console.log(`ownership-check: OK — ${files.length} shared rule(s), no undeclared product references.`);
    return 0;
  }

  report(scan, files.length);

  if (WARN) {
    console.log("ownership-check: --warn — reported, not failed.");
    return 0;
  }

  // A marker with no reason and a shared rule depending on a local id are defects in the MECHANISM,
  // not a backlog of names — no baseline forgives them, and --warn is the only thing that can.
  const mechanismBroken = scan.malformed.length > 0 || scan.downward.length > 0;
  if (loaded.baseline === undefined || mechanismBroken) return 1;

  return judgeBaseline(scan.findings, loaded.baseline);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
