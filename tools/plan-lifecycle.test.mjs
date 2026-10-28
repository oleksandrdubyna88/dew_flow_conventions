#!/usr/bin/env node
/**
 * `plan-lifecycle.mjs`'s own tests: a parent plan and its epic document (`PLAN_<topic>_E1.md`) sit side by
 * side in `todo/`, and the folder's index must name BOTH. The epic document is the one a hurried edit
 * forgets, because the parent already has its row.
 *
 * The second half is the change-ledger check (`lib/plan-ledger.mjs`, E1 of `todo/PLAN_plan_change_control.md`),
 * seen from outside: a folder of plans is built, the checker is SPAWNED on it, and the exit code and the lines on
 * stderr are the assertions. The grammar itself is tested on strings in `plan-ledger.test.mjs`; what only a
 * spawn can show lives here — that the check reads `todo/` and not `research/`, that a stopped plan is not called
 * misfiled, that a throw inside the parser is a finding and not a crash, and that the hint line comes only with a
 * `changes` finding. Case names W1–W9 are the stories document's.
 */

import { test } from "node:test";
import * as nodeModule from "node:module";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { ownedDir } from "./lib/owned.mjs";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "plan-lifecycle.mjs");

function repo(t, readmeRows) {
  const root = ownedDir(t, "plan-lifecycle ");
  const put = (name, text) => {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), text);
  };
  const plan = title => `# PLAN — ${title}\n\n> Status: **in progress, 2026-10-13.** Work is still open.\n\nBody.\n`;
  put("todo/PLAN_x.md", plan("parent"));
  put("todo/PLAN_x_E1.md", plan("epic one"));
  put("todo/README.md", `# todo\n\n## Currently open\n\n| Plan | What |\n|---|---|\n${readmeRows}\n`);
  put("research/README.md", "# research\n");
  return root;
}

const lifecycle = root => spawnSync(process.execPath, [script, root], { encoding: "utf8", timeout: 10000 });
const row = name => `| [${name}](${name}) | open |`;

test("a parent plan and its epic document are clean only when the todo index lists both", t => {
  const clean = lifecycle(repo(t, [row("PLAN_x.md"), row("PLAN_x_E1.md")].join("\n")));
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(clean.stdout, /clean/);

  const missing = lifecycle(repo(t, row("PLAN_x.md")));
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /todo\/README\.md omits PLAN_x_E1\.md/);
  assert.doesNotMatch(missing.stderr, /omits PLAN_x\.md/);
});

// ---- the change ledger, seen from outside ----

const IN_PROGRESS = "> Status: **in progress, 2026-10-28.** Work is open.";
const STOPPED = "> Status: **stopped for re-review, 2026-10-28.** Two changes after approval.";
const epoch = state => `> Epoch 1 · approved 2026-10-21 · by reviewers · state: ${state}`;
const ENTRY_1 = "- 1.1 · 2026-10-26 · owner · epics — consumers need the helper as a shipped file; S8 added";
const ENTRY_2 = "- 1.2 · 2026-10-26 · reviewer · approach — restore before capture; S3 and S4 rewritten";
const A = (state = "open") => [epoch(state), "", ENTRY_1];
const A2 = (state = "open") => [...A(state), ENTRY_2];

/** The same shape as `plan-ledger.test.mjs`'s `plan` (the two files share no module): a status block, a ledger, a body. */
const ledgerPlan = (ledger, { status = IN_PROGRESS } = {}) =>
  ["# PLAN — x", "", status, "", ...(ledger === null ? [] : ["## Plan changes", "", ...ledger, ""]), "## Goal", "", "Body.", ""].join("\n");

/** A folder of plans with an index that lists every one of them, so no `index` finding hides the one under test. */
function estate(t, files) {
  const root = ownedDir(t, "plan-lifecycle ");
  const put = (name, text) => {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), text);
  };
  for (const [name, text] of Object.entries(files)) put(name, text);
  const plans = folder => Object.keys(files).filter(n => n.startsWith(`${folder}/PLAN_`)).map(n => n.slice(folder.length + 1));
  put("todo/README.md", `# todo\n\n## Currently open\n\n| Plan | What |\n|---|---|\n${plans("todo").map(row).join("\n")}\n`);
  put("research/README.md", `# research\n\n${plans("research").join("\n")}\n`);
  return root;
}

test("W1 a plan with no ledger is clean; W2 the same plan with a second change in an open epoch is red, in the class column, with the hint", t => {
  const none = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(null) }));
  assert.equal(none.status, 0, none.stderr);
  assert.match(none.stdout, /clean/);

  const one = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(A()) }));
  assert.equal(one.status, 0, one.stderr);

  const two = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(A2()) }));
  assert.equal(two.status, 1, two.stdout + two.stderr);
  assert.match(two.stderr, /^  changes   todo\/PLAN_x\.md — .*epoch 1 has 2 changes/m, "class padded to 10, the file named");
  assert.match(two.stderr, /common\/plan-change-control\.md/, "the hint line names the rule");
});

test("W3 a stories document's ledger counts in its parent and is red; W4 with no parent it is clean", t => {
  const withParent = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(null), "todo/PLAN_x_E1.md": ledgerPlan(A()) }));
  assert.equal(withParent.status, 1, withParent.stdout + withParent.stderr);
  assert.match(withParent.stderr, /changes   todo\/PLAN_x_E1\.md/);
  assert.match(withParent.stderr, /its changes count in the parent/);

  const orphan = lifecycle(estate(t, { "todo/PLAN_x_E1.md": ledgerPlan(A()) }));
  assert.equal(orphan.status, 0, orphan.stderr);
});

test("W5 research/ is history and is not read; the same ledger in todo/ is", t => {
  const promoted = "> Status: **IMPLEMENTED, 2026-10-01.** All of it shipped.";
  const history = lifecycle(estate(t, { "research/PLAN_old.md": ledgerPlan(A2(), { status: promoted }) }));
  assert.equal(history.status, 0, history.stdout + history.stderr);

  const open = lifecycle(estate(t, { "todo/PLAN_old.md": ledgerPlan(A2()) }));
  assert.equal(open.status, 1, open.stdout + open.stderr);
  assert.match(open.stderr, /changes   todo\/PLAN_old\.md/);
});

test("W6 a stopped plan whose status also says 'all … done' is not misfiled: the stop phrase lifts the totality verdict", t => {
  const status = "> Status: **stopped for re-review, 2026-10-28.** All four stories of E1 are done; E2 has not started.";
  const stopped = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(A2("stopped"), { status }) }));
  assert.equal(stopped.status, 0, stopped.stdout + stopped.stderr);
  assert.match(stopped.stdout, /clean/);
});

test("W6b without the stop phrase the totality check still works", t => {
  const status = "> Status: **in progress, 2026-10-28.** All four stories of E1 are done; E2 has not started.";
  const found = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(null, { status }) }));
  assert.equal(found.status, 1, found.stdout + found.stderr);
  assert.match(found.stderr, /misfiled/);
});

test("W6c the stop phrase lifts the totality verdict only — never a self-reported misfiling or `implemented`", t => {
  const admits = "> Status: **stopped for re-review, 2026-10-28.** All of it is done; it belongs in research/ now.";
  const misfiled = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(A2("stopped"), { status: admits }) }));
  assert.equal(misfiled.status, 1, misfiled.stdout + misfiled.stderr);
  assert.match(misfiled.stderr, /misfiled/);

  const promoted = "> Status: **implemented, 2026-10-28.** Stopped for re-review before the last story.";
  const promotedForm = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(A2("stopped"), { status: promoted }) }));
  assert.equal(promotedForm.status, 1, promotedForm.stdout + promotedForm.stderr);
  assert.match(promotedForm.stderr, /misfiled/);
});

test("W7 the stop phrase counts only in the status block's first paragraph", t => {
  const second = `${IN_PROGRESS}\n>\n> The plan is stopped for re-review.`;
  const found = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(A2("stopped"), { status: second }) }));
  assert.equal(found.status, 1, found.stdout + found.stderr);
  assert.match(found.stderr, /changes   todo\/PLAN_x\.md — .*stopped for re-review/);

  const first = lifecycle(estate(t, { "todo/PLAN_x.md": ledgerPlan(A2("stopped"), { status: STOPPED }) }));
  assert.equal(first.status, 0, first.stdout + first.stderr);
});

test("W8 an index finding alone carries no ledger hint: the hint comes only with a `changes` finding", t => {
  const missing = lifecycle(repo(t, row("PLAN_x.md")));
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /todo\/README\.md omits PLAN_x_E1\.md/);
  assert.doesNotMatch(missing.stderr, /plan-change-control\.md/);
});

// W9 swaps the lib for one that throws, with a resolve hook preloaded by `--import`, so the checker needs no test seam.
// Every name plan-lifecycle.mjs imports from the lib must be exported by the stub, or the child dies at link time — a
// crash, which is not the case under test. `module.registerHooks` exists from Node 22.15; CI runs the latest 22.x, `engines`
// says `>=20`, so an older local Node skips with a reason.
const THROWING_LEDGER = "data:text/javascript," + encodeURIComponent(
  "export const STOP_PHRASE = /x/; export const parentPlanOf = () => null;" +
  " export function ledgerFindings() { throw new Error('stub: the parser threw'); }");
const SWAP_LEDGER = "data:text/javascript," + encodeURIComponent(
  `import { registerHooks } from "node:module"; registerHooks({ resolve(s, c, n) {` +
  ` return s.endsWith("/plan-ledger.mjs") ? { url: ${JSON.stringify(THROWING_LEDGER)}, shortCircuit: true } : n(s, c); } });`);

test("W9 a throw inside the parser is a finding that names the file, not a crash", { skip: nodeModule.registerHooks ? false : "module.registerHooks needs Node 22.15 or later" }, t => {
  const root = estate(t, { "todo/PLAN_x.md": ledgerPlan(A()) });
  const swapped = spawnSync(process.execPath, ["--import", SWAP_LEDGER, script, root], { encoding: "utf8", timeout: 10000 });
  assert.equal(swapped.status, 1, swapped.stdout + swapped.stderr);
  assert.match(swapped.stderr, /changes   todo\/PLAN_x\.md/);
  assert.match(swapped.stderr, /could not be read/);
  assert.match(swapped.stderr, /stub: the parser threw/, "the message, not the stack");
  assert.doesNotMatch(swapped.stderr, /^\s+at /m, "no stack line");
  assert.doesNotMatch(swapped.stderr, /Node\.js v/, "no crash banner");

  // the twin: the same estate with the real lib is clean, so the red above came from the swap and nothing else
  const real = lifecycle(root);
  assert.equal(real.status, 0, real.stdout + real.stderr);
});
