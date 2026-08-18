#!/usr/bin/env node
/**
 * The plan lifecycle, checked instead of merely described.
 *
 * `common/planning-docs.md` has said since it was written that a finished plan moves to `research/` and
 * becomes documentation. It described HOW, and nothing checked WHETHER — so in `dew_flow_rag_qln`
 * `PLAN_runtime_panel` spent a day in `todo/` carrying a status line that asked, in writing, to be moved,
 * and in `dew_flow_mcp` two promoted plans were absent from the folder's own index. Nobody tripped over
 * either, because there was nothing to trip on.
 *
 * ONE implementation for the whole family, living beside the rule it enforces. The alternative was a copy
 * per repository — and one of the four is Rust, so that would have meant the same rule in two languages,
 * which is the drift `common/logging-serilog.md` already documents the cost of. This check reads MARKDOWN,
 * not code, so nothing about it needs to be written twice.
 *
 * Run from a repository root:
 *
 *     node .claude/rules/shared/tools/plan-lifecycle.mjs
 *
 * Exit 0 when clean, 1 with every finding printed. A repository without both plan folders exits 0 and says
 * so — not every repository in the family has plans yet, and inventing a failure for that would train
 * people to ignore the check.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/** The status must be findable without reading the document — the rule says line 2 or 3; this allows a
 *  little slack for a title block, and nothing like "somewhere in section 2". */
const STATUS_WITHIN_LINES = 6;

/**
 * A plan in `todo/` that is actually finished — and the two ways to tell WITHOUT guessing at prose.
 *
 * The first attempt scored phrases: "shipped"/"implemented" against a list of open-work words. Run against
 * the two real cases it was meant to judge, it was wrong BOTH ways.
 *
 * - `dew_flow_rag_qln · todo/PLAN_gpu_arbitration.md` says *"steps 1–3 shipped … **Steps 4–7 are the
 *   work**: no consumer participates, so today it arbitrates nothing"* — plainly open, and flagged as
 *   finished, because none of those words was on the open list. A false failure is how a check gets
 *   switched off, so this one mattered most.
 * - `PLAN_runtime_panel`, the case the check was WRITTEN for, said *"the panel SHIPPED … two DoD items
 *   remain open; the plan belongs in `research/` and is awaiting a promotion"* — and was not flagged,
 *   because "remain open" read as open work. It had no teeth for its own founding case.
 *
 * So prose scoring is out. What is left is crisp and answers both: the convention's own promoted form, and
 * a plan SAYING it is in the wrong folder. A partially implemented plan — the normal state of half this
 * folder — matches neither and is left alone, which is what the rule asks for anyway.
 */
const PROMOTED_VERDICT = /status:\s*\*\*\s*implemented\b/i;

/**
 * A plan claiming its work is finished IN TOTAL, in words other than the convention's own.
 *
 * Added 2026-08-18 after a third miss, and this one had been sitting in `todo/` for a day:
 * `PLAN_unclaimed_collections` opened *"Status: **all six steps built 2026-08-17. The open tail is what the
 * claim source cannot see"*. Every word of that is true and none of them is "implemented", so the check
 * called the folder clean while an implemented plan read as outstanding work — exactly the failure this file
 * exists to prevent.
 *
 * The discriminator is TOTALITY, not the verb: half this folder legitimately says "steps 1-3 implemented",
 * "phase 3 shipped", "items 1-9 are DONE", and every one of those is a partial plan that belongs where it
 * is. So the match needs an "all"/"every" quantifier reaching a completion verb inside one clause, and
 * refuses when a negation precedes it — "not all steps are done" is the opposite claim.
 */
const TOTALITY_VERDICT =
  /(?<!\bnot\s)(?<!\bnothing\s)\b(?:all|every)\b[^.;]{0,60}?\b(?:built|shipped|done|implemented|complete)\b/i;

/** A plan that reports its own misfiling. Both phrasings are taken from the real status line above. */
const SELF_REPORTED_MISFILING = [
  "belongs in `research/`",
  "belongs in research/",
  "awaiting a promotion",
  "awaiting promotion",
];

/** A markdown link to a local file, e.g. `](../research/PLAN_x.md)`. */
const LOCAL_MD_LINK = /\]\(([^)\s#]+\.md)(?:#[^)\s]*)?\)/g;

/** A table row whose first cell links a plan — the shape every folder index uses. Anchored to the line
 *  start so prose mentioning a plan is not mistaken for an index entry. */
const INDEX_ROW = /^\|\s*\[(PLAN_[A-Za-z0-9_]+\.md)\]/gm;

/**
 * The heading that opens the list of plans still to be built.
 *
 * Anchoring on it is not a nicety. Two of the four repositories put their PROMOTED plans in a second table
 * in the same file, and a scan of the whole file reads those rows as open work — which is a false failure
 * naming three innocent plans, and a false failure is how a check gets switched off.
 */
const OPEN_SECTION = /^##\s+Currently open\s*$/im;

const isPlan = (name) => /^PLAN_[A-Za-z0-9_]+\.md$/.test(name);

const plansIn = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter(isPlan).sort() : [];

const markdownIn = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort() : [];

/**
 * The first paragraph of the status block: the line carrying `Status:` plus the quoted lines directly
 * under it, stopping at the first blank quote line.
 *
 * Only the first paragraph counts. A status block routinely goes on to narrate history — "this line said
 * *plan only* until the series had run", "phase 2 was dropped" — and reading the whole block would let
 * that prose contradict the verdict.
 */
function statusParagraph(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

  let start = -1;
  for (let i = 0; i < Math.min(lines.length, STATUS_WITHIN_LINES); i++) {
    if (/status:/i.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) return "";

  const paragraph = [];
  for (let i = start; i < lines.length; i++) {
    const trimmed = lines[i].trimStart();
    if (!trimmed.startsWith(">") || trimmed.replace(/^>+/, "").trim().length === 0) break;
    paragraph.push(lines[i]);
  }

  return paragraph.join(" ").toLowerCase();
}

/** Finished, by the convention's own promoted form or by the plan's own admission. In `todo/` either is a
 *  misfiling; anything less certain is left alone deliberately — see the constants above. */
const isFullyDone = (status) =>
  PROMOTED_VERDICT.test(status)
  || TOTALITY_VERDICT.test(status)
  || SELF_REPORTED_MISFILING.some((m) => status.includes(m));

/** Not started. In `research/` that is a misfiling — the folder documents the system as it is, and an
 *  unstarted plan documents nothing. These three openings are unambiguous in a way "shipped" is not. */
const isUnstarted = (status) =>
  !PROMOTED_VERDICT.test(status)
  && ["plan only", "not started", "proposed"].some((m) => status.includes(m));

/** The rows of the "Currently open" table alone — from its heading to the next one. */
function openSectionRows(readme) {
  const text = fs.readFileSync(readme, "utf8");
  const opening = text.match(OPEN_SECTION);
  if (!opening) return { found: false, rows: [] };

  const from = opening.index + opening[0].length;
  const rest = text.slice(from);
  const nextHeading = rest.search(/^##\s/m);
  const section = nextHeading < 0 ? rest : rest.slice(0, nextHeading);

  return {
    found: true,
    rows: [...section.matchAll(INDEX_ROW)].map((m) => m[1]).sort(),
  };
}

function checkStatuses(root, findings) {
  for (const folder of ["todo", "research"]) {
    for (const file of plansIn(path.join(root, folder))) {
      const status = statusParagraph(path.join(root, folder, file));

      if (status.length === 0) {
        findings.push(`status    ${folder}/${file} — no status line in the first ${STATUS_WITHIN_LINES} lines`);
      } else if (folder === "todo" && isFullyDone(status)) {
        findings.push(`misfiled  ${folder}/${file} — its status reads as promoted; it belongs in research/`);
      } else if (folder === "research" && isUnstarted(status)) {
        findings.push(`misfiled  ${folder}/${file} — unstarted; it belongs in todo/`);
      }
    }
  }
}

/**
 * Every relative link in the two folders that does not resolve.
 *
 * In CI this also catches the failure the rule names separately — a README row committed without the plan
 * it links, "a broken link in every clone but yours". A clean checkout does not have the untracked file,
 * so the link simply does not resolve. On a developer's machine it does, which is why that case can only
 * be caught here.
 */
function checkLinks(root, findings) {
  for (const folder of ["todo", "research"]) {
    const dir = path.join(root, folder);
    for (const file of markdownIn(dir)) {
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      for (const [, target] of text.matchAll(LOCAL_MD_LINK)) {
        if (target.includes("://")) continue;

        const resolved = path.resolve(dir, target);

        // A link that climbs out of the repository is a CROSS-REPOSITORY link, and the rule forbids it in
        // as many words: "cross-repository citations are paths, not links — a relative link that resolves
        // only on one machine is worse than a citation that names its source". Reported as its own finding
        // rather than as a missing file, because on a developer's machine the sibling checkout usually IS
        // there and the link resolves. That is precisely the failure: it passes where it is written and
        // fails everywhere else. Existence is deliberately not consulted here — consulting it is what made
        // this class invisible.
        if (!resolved.startsWith(root + path.sep)) {
          findings.push(
            `link      ${folder}/${file} -> ${target} — leaves the repository; cite the path ` +
              "(`repo · folder/file.md:line`) instead of linking it",
          );
          continue;
        }

        if (!fs.existsSync(resolved)) {
          findings.push(`link      ${folder}/${file} -> ${target}`);
        }
      }
    }
  }
}

/** The open table is the folder's index — what a human reads to see what is left. An index that silently
 *  omits one of its own plans is worse than no index, because it reads as complete. */
function checkTodoIndex(root, findings) {
  const readme = path.join(root, "todo", "README.md");
  if (!fs.existsSync(readme)) {
    findings.push("index     todo/README.md is missing");
    return;
  }

  const { found, rows } = openSectionRows(readme);
  if (!found) {
    findings.push('index     todo/README.md has no "## Currently open" heading to read');
    return;
  }

  const onDisk = plansIn(path.join(root, "todo"));
  for (const plan of onDisk.filter((p) => !rows.includes(p))) {
    findings.push(`index     todo/README.md omits ${plan}`);
  }
  for (const row of rows.filter((r) => !onDisk.includes(r))) {
    findings.push(`index     todo/README.md still lists ${row}, which is not in the folder`);
  }
}

/**
 * Every promoted plan is mentioned by the research index.
 *
 * Deliberately weaker than the `todo/` check, and the reason is measured rather than assumed: the four
 * repositories head this section three different ways ("Implemented plans, in the order they shipped",
 * "What is here", "Currently here"), and two of them mix plan rows into one table with `architecture.md`
 * and the module documents. Demanding an exact table under a fixed heading would fail three repositories
 * for formatting. "Is it mentioned at all" is the guarantee that actually matters — a promoted plan no
 * index names is one nobody will find, which is most of what promotion was for.
 */
function checkResearchIndex(root, findings) {
  const readme = path.join(root, "research", "README.md");
  if (!fs.existsSync(readme)) {
    findings.push("index     research/README.md is missing");
    return;
  }

  const text = fs.readFileSync(readme, "utf8");
  for (const plan of plansIn(path.join(root, "research"))) {
    if (!text.includes(plan)) {
      findings.push(`index     research/README.md never mentions ${plan}`);
    }
  }
}

function main() {
  const root = path.resolve(process.argv[2] ?? process.cwd());
  const hasFolders = ["todo", "research"].every((f) => fs.existsSync(path.join(root, f)));

  if (!hasFolders) {
    console.log(`plan-lifecycle: ${root} has no todo/ + research/ pair — nothing to check.`);
    return 0;
  }

  const findings = [];
  checkStatuses(root, findings);
  checkLinks(root, findings);
  checkTodoIndex(root, findings);
  checkResearchIndex(root, findings);

  if (findings.length === 0) {
    console.log("plan-lifecycle: clean.");
    return 0;
  }

  console.error(`plan-lifecycle: ${findings.length} finding(s) — see common/planning-docs.md\n`);
  for (const finding of findings.sort()) console.error(`  ${finding}`);
  console.error("\nPromote a finished plan with /promote-plan; it performs the whole move in one pass.");
  return 1;
}

process.exit(main());
