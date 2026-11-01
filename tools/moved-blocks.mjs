#!/usr/bin/env node
// moved-blocks.mjs — records and verifies the move of text between rule files (todo/PLAN_node_rule_parity.md section 4.3).
//
// research/moved-blocks.json says, for each block that will move, what its bytes are TODAY (a baseline, `planned`) and, once an
// owning epic has moved it, where it went (an activation for unchanged bytes, a superseding entry for changed ones). The
// checker needs no git history; the recorder needs it once, when an entry is written.
//
// Run:    node tools/moved-blocks.mjs                                       verify (exit 0 / 1)
//         node tools/moved-blocks.mjs --baseline <source> <from>-<to> <commit> <epic> <id>
//         node tools/moved-blocks.mjs --record <source> <from>-<to> <commit> <destination> <epic> <id>
//                                     [--supersedes <baseline id> --justified-by <commit>]
// A range is whole lines (`N` or `N-M`); a column range, a range that splits a fence, lines past the end, an unknown commit and
// an existing id are refused and write nothing. Anything else is usage, exit 2.

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { LANDED_EPICS } from "./lib/parity-epics.mjs";
import { MANIFEST, Refusal, recordBaseline, recordMove, summary, verifyManifest } from "./lib/moved-blocks.mjs";

const USAGE = "usage: node tools/moved-blocks.mjs [--baseline <source> <from>-<to> <commit> <epic> <id> | --record <source> <from>-<to> <commit> <destination> <epic> <id> [--supersedes <id> --justified-by <commit>]]";

export function main(argv, root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")) {
  try {
    if (argv.length === 0) {
      const file = path.join(root, MANIFEST);
      if (!fs.existsSync(file)) { console.error(`moved-blocks: ${MANIFEST} does not exist`); return 1; }
      let entries;
      try { entries = JSON.parse(fs.readFileSync(file, "utf8")); } catch (error) { console.error(`moved-blocks: ${MANIFEST} is not valid JSON: ${error.message}`); return 1; }
      const findings = verifyManifest(root, entries, LANDED_EPICS);
      if (findings.length) {
        console.error(`moved-blocks: ${findings.length} finding(s) in ${MANIFEST}`);
        for (const finding of findings) console.error(`  ${finding}`);
        return 1;
      }
      const { baselines, activated, superseded } = summary(entries);
      console.log(`moved-blocks: OK — ${baselines} baseline(s), ${activated} activated, ${superseded} superseded`);
      return 0;
    }
    if (argv[0] === "--baseline" && argv.length === 6) {
      const [, source, range, commit, epic, id] = argv;
      const entry = recordBaseline(root, { source, range, commit, epic, id });
      console.log(`moved-blocks: baseline ${entry.id} — ${entry.source} lines ${entry.lines}, ${entry.length} B`);
      return 0;
    }
    if (argv[0] === "--record" && argv.length >= 7) {
      const [, source, range, commit, destination, epic, id, ...flags] = argv;
      const options = {};
      for (let at = 0; at < flags.length; at += 2) {
        const key = { "--supersedes": "supersedes", "--justified-by": "justifiedBy" }[flags[at]];
        if (!key || flags[at + 1] === undefined || Object.hasOwn(options, key)) { console.error(USAGE); return 2; }
        options[key] = flags[at + 1];
      }
      const entry = recordMove(root, { source, range, commit, destination, epic, id, ...options });
      console.log(`moved-blocks: ${entry.activates ? `activation ${entry.id} of ${entry.activates}` : `supersession ${entry.id} of ${entry.supersedes}`} — ${entry.destination} lines ${entry.destinationLines}`);
      return 0;
    }
    console.error(USAGE);
    return 2;
  } catch (error) {
    if (error instanceof Refusal) { console.error(`moved-blocks: refused — ${error.message}`); return 1; }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
