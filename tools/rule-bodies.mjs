#!/usr/bin/env node
// rule-bodies.mjs — the other half of the body freeze.
//
// `research/rule-bodies.json` records what every shared rule's body IS, and rules.test.mjs fails when
// a body changes and its record does not. That is deliberate: a rule is what six repositories load as
// policy, and an edit nobody recorded is an edit nobody reviewed.
//
// What was missing is the way to record it. The story that introduced the freeze updated the manifest
// with an uncommitted script, which makes the procedure executable by its author and by nobody else —
// a reviewer named that as the gap, and they were right: the alternative is re-deriving sha256 over a
// body-after-frontmatter by hand.
//
// This is NOT an update-everything button. It recomputes the ids you NAME, so the command is a
// statement about what you changed, and a rule you edited by accident is still a red suite rather
// than a silently blessed diff. `--all` does not exist, and adding it would remove the only property
// the freeze has — so the word is REFUSED rather than ignored, because a flag that is silently
// dropped reports success for a job it did not do.
//
// What a body IS lives in lib/rule-body.mjs, which the resolver and the ownership check read through
// as well. Two reviewers found the reason independently: a private copy of that extraction hashes
// bytes that are not what consumers load, and the freeze then blesses or refuses a policy change on
// the wrong evidence.
//
// Run:    node tools/rule-bodies.mjs                       verify, and name every drifted rule
//         node tools/rule-bodies.mjs --update <id> [<id>…] record those rules' bodies as they are now
// Exit:   0 in step, or updated.  1 drift, an unknown id, an unrecorded rule, or a failed write.

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { bodyOf as bodyFrom, sectionsOf } from "./lib/rule-body.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = "research/rule-bodies.json";

/** The four directories the resolver walks. A file outside them is not a rule. */
const RULE_DIRECTORIES = ["common", "csharp", "rust", "typescript"];

/** The same text the resolver reads: CRLF folded, frontmatter removed. Hash what a consumer loads. */
export function bodyOf(root, source) {
  return bodyFrom(fs.readFileSync(path.join(root, source), "utf8"));
}

export function recordFor(root, entry) {
  const body = bodyOf(root, entry.source);
  return {
    bodySha256: createHash("sha256").update(body).digest("hex"),
    sections: sectionsOf(body),
  };
}

/** Every rule file on disk, as repository-relative paths with forward slashes. */
export function rulesOnDisk(root) {
  const found = [];
  for (const directory of RULE_DIRECTORIES) {
    const full = path.join(root, directory);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full).sort()) {
      if (name.endsWith(".md")) found.push(`${directory}/${name}`);
    }
  }
  return found;
}

/**
 * Everything out of step, as `{ id, hash, sections, missing, unrecorded }`.
 *
 * It walks the DISK as well as the manifest. Reading only the manifest meant a new rule file entered
 * policy distribution with no freeze over it while this tool reported OK, and a deleted or renamed
 * source came back as a bare ENOENT instead of a sentence naming the rule that lost its file.
 */
export function drifted(root, manifest) {
  const out = [];
  const recorded = new Set();

  for (const entry of manifest.rules) {
    recorded.add(entry.source);
    if (!fs.existsSync(path.join(root, entry.source))) {
      out.push({ id: entry.id, missing: true });
      continue;
    }
    const now = recordFor(root, entry);
    const hash = now.bodySha256 !== entry.bodySha256;
    const sections = JSON.stringify(now.sections) !== JSON.stringify(entry.sections);
    if (hash || sections) out.push({ id: entry.id, hash, sections });
  }

  for (const source of rulesOnDisk(root)) {
    if (recorded.has(source)) continue;
    const declared = /^id:\s*"?([^"\n]+)"?/m.exec(fs.readFileSync(path.join(root, source), "utf8"));
    out.push({ id: declared === null ? source : declared[1].trim(), source, unrecorded: true });
  }

  return out;
}

/** Replace the manifest with no window in which it is half-written. */
function writeManifest(file, manifest) {
  const temporary = `${file}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
    fs.renameSync(temporary, file);
    return true;
  } catch (error) {
    try { fs.rmSync(temporary, { force: true }); } catch { /* the failure below is the one to report */ }
    console.error(`rule-bodies: ${MANIFEST} could not be written (${error.message}).`);
    console.error("  Nothing was changed. This file is the freeze's only record, so a half-written one");
    console.error("  would fail every rule at once and could be committed by accident.");
    return false;
  }
}

function report(drift) {
  for (const d of drift) {
    if (d.missing) {
      console.error(`rule-bodies: MISSING ${d.id} — its recorded source is not on disk.`);
    } else if (d.unrecorded) {
      console.error(`rule-bodies: UNRECORDED ${d.id} (${d.source}) — a rule with no entry in ${MANIFEST}.`);
    } else {
      const what = [d.hash ? "body" : "", d.sections ? "headings" : ""].filter(Boolean).join(" and ");
      console.error(`rule-bodies: DRIFT ${d.id} — its ${what} changed without the record moving.`);
    }
  }

  const editable = drift.filter((d) => !d.missing && !d.unrecorded).map((d) => d.id);
  if (editable.length > 0) {
    console.error(`  If the edit was deliberate: node tools/rule-bodies.mjs --update ${editable.join(" ")}`);
    console.error("  If it was not, the diff against the base branch is the answer to what happened.");
  }
  if (drift.some((d) => d.unrecorded || d.missing)) {
    console.error(`  A rule that was added, renamed or removed changes ${MANIFEST} by hand, once —`);
    console.error("  because a tool that did it for you would let a rule join or leave policy unnoticed.");
  }
}

export function main(argv, root = path.resolve(here, "..")) {
  const manifestFile = path.join(root, MANIFEST);
  if (!fs.existsSync(manifestFile)) {
    console.error(`rule-bodies: no ${MANIFEST} under ${root}.`);
    return 1;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));

  // Two shapes, and nothing else. `--update` must come FIRST when it comes at all: searching the
  // whole argv for it meant `--all` on its own quietly became a verification run that printed OK on a
  // clean corpus — which a caller who believed in `--all` would read as "recorded" — and
  // `--typo --update <id>` updated the manifest with the typo ignored.
  if (argv.length > 0 && argv[0] !== "--update") {
    console.error(`rule-bodies: ${argv[0]} is not how this is run.`);
    console.error("  node tools/rule-bodies.mjs                       verify every recorded rule");
    console.error("  node tools/rule-bodies.mjs --update <id> [<id>…] record those rules' bodies");
    return 1;
  }
  const updateAt = argv.length === 0 ? -1 : 0;

  if (updateAt === -1) {
    const drift = drifted(root, manifest);
    if (drift.length === 0) {
      console.log(`rule-bodies: OK — ${manifest.rules.length} rule(s) match their recorded body.`);
      return 0;
    }
    report(drift);
    return 1;
  }

  const ids = argv.slice(updateAt + 1);
  const flag = ids.find((argument) => argument.startsWith("--"));
  if (flag !== undefined) {
    console.error(`rule-bodies: ${flag} is not an option here.`);
    console.error("  Naming what you changed is the point, so there is no --all: a button that recorded");
    console.error("  every body would bless the edit you did not notice making. Nothing was changed.");
    return 1;
  }
  if (ids.length === 0) {
    console.error("rule-bodies: --update needs at least one rule id.");
    return 1;
  }

  let failed = false;
  for (const id of ids) {
    const entry = manifest.rules.find((rule) => rule.id === id);
    if (entry === undefined) {
      console.error(`rule-bodies: no entry for ${id} in ${MANIFEST}.`);
      console.error("  A NEW rule records its body in the same commit — add the entry by hand, once.");
      failed = true;
      continue;
    }
    if (!fs.existsSync(path.join(root, entry.source))) {
      console.error(`rule-bodies: ${id} has no file at ${entry.source}.`);
      failed = true;
      continue;
    }
    const before = entry.bodySha256;
    Object.assign(entry, recordFor(root, entry));
    const moved = before === entry.bodySha256 ? "unchanged" : `${before.slice(0, 12)} → ${entry.bodySha256.slice(0, 12)}`;
    console.log(`rule-bodies: ${id} — ${moved}, ${entry.sections.length} heading(s).`);
  }
  if (failed) return 1;

  if (!writeManifest(manifestFile, manifest)) return 1;
  console.log(`rule-bodies: ${MANIFEST} written. The diff beside the prose is what a reviewer reads.`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
