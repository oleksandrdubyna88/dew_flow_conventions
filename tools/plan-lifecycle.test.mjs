#!/usr/bin/env node
/**
 * `plan-lifecycle.mjs`'s own tests: a parent plan and its epic document (`PLAN_<topic>_E1.md`) sit side by
 * side in `todo/`, and the folder's index must name BOTH. The epic document is the one a hurried edit
 * forgets, because the parent already has its row.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "plan-lifecycle.mjs");

function repo(t, readmeRows) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plan-lifecycle "));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
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
