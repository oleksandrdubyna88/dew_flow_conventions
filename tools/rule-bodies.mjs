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
// the freeze has.
//
// Run:    node tools/rule-bodies.mjs                       verify, and name every drifted rule
//         node tools/rule-bodies.mjs --update <id> [<id>…] record those rules' bodies as they are now
// Exit:   0 in step, or updated.  1 drift, an unknown id, or a rule with no entry.

import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = "research/rule-bodies.json";

/** The same text the resolver reads: CRLF folded, frontmatter removed. Hash what a consumer loads. */
export function bodyOf(root, source) {
  const text = fs.readFileSync(path.join(root, source), "utf8").replaceAll("\r\n", "\n");
  return text.replace(/^---\n[\s\S]*?\n---\n/, "");
}

export function recordFor(root, entry) {
  const body = bodyOf(root, entry.source);
  return {
    bodySha256: createHash("sha256").update(body).digest("hex"),
    sections: body.split("\n").filter((line) => /^#{1,4} /.test(line)),
  };
}

/** Which recorded rules no longer match their file, as `{ id, hash, sections }` flags. */
export function drifted(root, manifest) {
  const out = [];
  for (const entry of manifest.rules) {
    const now = recordFor(root, entry);
    const hash = now.bodySha256 !== entry.bodySha256;
    const sections = JSON.stringify(now.sections) !== JSON.stringify(entry.sections);
    if (hash || sections) out.push({ id: entry.id, hash, sections });
  }
  return out;
}

export function main(argv, root = path.resolve(here, "..")) {
  const manifestFile = path.join(root, MANIFEST);
  if (!fs.existsSync(manifestFile)) {
    console.error(`rule-bodies: no ${MANIFEST} under ${root}.`);
    return 1;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const updateAt = argv.indexOf("--update");

  if (updateAt === -1) {
    const drift = drifted(root, manifest);
    if (drift.length === 0) {
      console.log(`rule-bodies: OK — ${manifest.rules.length} rule(s) match their recorded body.`);
      return 0;
    }
    for (const d of drift) {
      const what = [d.hash ? "body" : "", d.sections ? "headings" : ""].filter(Boolean).join(" and ");
      console.error(`rule-bodies: DRIFT ${d.id} — its ${what} changed without the record moving.`);
    }
    console.error(`  If the edit was deliberate: node tools/rule-bodies.mjs --update ${drift.map((d) => d.id).join(" ")}`);
    console.error("  If it was not, the diff against the base branch is the answer to what happened.");
    return 1;
  }

  const ids = argv.slice(updateAt + 1).filter((argument) => !argument.startsWith("--"));
  if (ids.length === 0) {
    console.error("rule-bodies: --update needs at least one rule id.");
    console.error("  Naming what you changed is the point: there is no --all, because a button that");
    console.error("  records every body would bless the edit you did not notice making.");
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
    const before = entry.bodySha256;
    Object.assign(entry, recordFor(root, entry));
    const moved = before === entry.bodySha256 ? "unchanged" : `${before.slice(0, 12)} → ${entry.bodySha256.slice(0, 12)}`;
    console.log(`rule-bodies: ${id} — ${moved}, ${entry.sections.length} heading(s).`);
  }
  if (failed) return 1;

  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`rule-bodies: ${MANIFEST} written. The diff beside the prose is what a reviewer reads.`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
