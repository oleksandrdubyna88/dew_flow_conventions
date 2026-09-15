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

/** `<!-- owns: <token> — <reason> -->`. The reason is what makes it a decision and not an allowlist. */
const MARKER = /<!--\s*owns:\s*([^\s—-][^—\n]*?)\s*(?:—|--)\s*([^>]*?)\s*-->/gi;

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
    const token = match[1].trim();
    const reason = (match[2] ?? "").trim();
    if (!isReason(reason)) malformed.push({ token, reason });
    else tokens.push(token);
  }
  // A marker with no separator at all never matches above, so catch the bare shape separately.
  for (const match of text.matchAll(/<!--\s*owns:\s*([^\s—>-][^>\n]*?)\s*-->/gi)) {
    const body = match[1].trim();
    if (!/—|--/.test(body)) malformed.push({ token: body, reason: "" });
  }
  return { tokens, malformed };
}

/** Product references in one file, as `{ file, line, kind, token }`, markers already stripped. */
export function findingsIn(text, file) {
  const withoutMarkers = text.replace(MARKER, "").replace(/<!--\s*owns:[^>]*-->/gi, "");
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

/** `depends:` entries that point at a repo-local rule — the direction that cannot resolve. */
export function downwardDependencies(text) {
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (frontmatter === null) return [];
  const depends = /depends:\s*\[([^\]]*)\]/.exec(frontmatter[1]);
  if (depends === null) return [];
  return [...depends[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]).filter((id) => id.startsWith("local."));
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
 * The scan. Returns an exit code rather than calling process.exit, so importing this module for its
 * parsers runs nothing — the same guard post-deploy-check uses, and the reason the tests can exercise
 * findingsIn and markersIn without the whole corpus being scanned on import.
 */
export function main() {
  const root = process.cwd();

  // The baseline is read before anything is scanned, so an unreadable or malformed one stops the run
  // rather than silently allowing everything: a ratchet that cannot be loaded must not look like a
  // ratchet that found nothing.
  let baseline;
  const baselineFile = path.join(root, BASELINE_PATH ?? BASELINE_DEFAULT);
  if (fs.existsSync(baselineFile)) {
    try {
      baseline = JSON.parse(fs.readFileSync(baselineFile, "utf8")).files;
      if (baseline === null || typeof baseline !== "object") throw new Error("no `files` map");
    } catch (error) {
      console.error(`ownership-check: ${BASELINE_PATH ?? BASELINE_DEFAULT} could not be read as a baseline (${error.message}).`);
      console.error("  A baseline that does not parse would switch the ratchet off and still look green.");
      return 1;
    }
  } else if (BASELINE_PATH !== undefined) {
    console.error(`ownership-check: no baseline at ${BASELINE_PATH}.`);
    return 1;
  }
  const files = rulesIn(root);

  if (files.length === 0) {
    // Zero findings because nothing was read looks exactly like zero findings because everything was
    // clean. Say which one this is.
    console.error("ownership-check: scanned no rule files under common/, csharp/, rust/, typescript/.");
    console.error("  Run it from the conventions repository root; from anywhere else it would report a");
    console.error("  clean bill of health for a corpus it never opened.");
    return 1;
  }

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
    const declared = markers.tokens.map((t) => t.toLowerCase());
    for (const finding of findingsIn(text, file)) {
      if (declared.some((token) => finding.token.toLowerCase().includes(token))) continue;
      findings.push(finding);
    }
  }

  if (findings.length === 0 && malformed.length === 0 && downward.length === 0) {
    console.log(`ownership-check: OK — ${files.length} shared rule(s), no undeclared product references.`);
    return 0;
  }

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

  if (findings.length > 0) {
    console.error("");
    console.error(`ownership-check: ${findings.length} product reference(s) in ${new Set(findings.map((f) => f.file)).size} of ${files.length} shared rules.`);
    console.error("  Apply the one-second test (common/rule-ownership.md): would another repository still");
    console.error("  need that sentence if the named one did not exist? If yes, anonymise the citation and");
    console.error("  keep its date. If no, move it to the repository that owns it. A name that IS the");
    console.error("  instruction declares itself in the same file:");
    console.error("      <!-- owns: <token> — why a generic form would be unusable -->");
  }

  // A marker with no reason and a shared rule depending on a local id are defects in the mechanism,
  // not a backlog of names — no baseline forgives them, and --warn is the only thing that can.
  const mechanismBroken = malformed.length > 0 || downward.length > 0;

  if (WARN) {
    console.log("ownership-check: --warn — reported, not failed.");
    return 0;
  }

  if (baseline !== undefined && !mechanismBroken) {
    const perFile = new Map();
    for (const f of findings) perFile.set(f.file, (perFile.get(f.file) ?? 0) + 1);

    const over = [];
    for (const [file, count] of perFile) {
      const allowed = baseline[file.replaceAll("\\", "/")] ?? 0;
      if (count > allowed) over.push({ file, count, allowed });
    }

    if (over.length === 0) {
      const total = findings.length;
      const budget = Object.values(baseline).reduce((n, v) => n + v, 0);
      console.log(`ownership-check: within the baseline — ${total} finding(s) against ${budget} recorded, none over its file's count.`);
      if (total < budget) console.log("  Under the baseline: lower the counts in the baseline file so the ground that was won is held.");
      return 0;
    }

    console.error("");
    for (const o of over) {
      console.error(`ownership-check: OVER BASELINE ${o.file} — ${o.count} finding(s), ${o.allowed} recorded.`);
    }
    console.error("  The count for that file GREW. Usually that is an undeclared product reference somebody");
    console.error("  added; it can also be an existing one duplicated by a reword or a split sentence. Either");
    console.error("  way `git diff` against the base branch shows which line, and the cure is the same:");
    console.error("  anonymise it, declare it with an `owns:` marker, or move it to the repository that owns it.");
    console.error("  The backlog is allowed while it is worked off. Nothing may be ADDED to it — and a file");
    console.error("  getting cleaner never buys room for another file to get worse.");
    return 1;
  }
  return 1;

}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
