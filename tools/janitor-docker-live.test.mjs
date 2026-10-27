#!/usr/bin/env node
/**
 * `tools/janitor.sh` against the REAL docker — the one live check of a contract with two implementations.
 *
 * `janitor.test.mjs` runs the script against a stub `docker`. The stub is a second implementation of what docker's
 * `--format` templates print, and it can disagree with the real one: measured 2026-10-27 on Docker 29.9.1, `docker
 * volume inspect --format '{{.Name}}\t{{.CreatedAt}}'` prints a LITERAL backslash and `t` (docker `ps` and `network ls`
 * turn `\t` into a tab; `volume inspect` does not). The stub printed a real tab whatever the template said, so the suite
 * stayed green while on a real daemon no volume was ever swept (every one read as "vanished after the capture").
 *
 * This file takes the volume-inspect templates out of the script BY CONTENT, makes a real labelled volume, and asks the
 * real daemon what each template prints. It skips, saying why, when there is no `docker` or the daemon does not answer.
 * Everything it creates is named `testsToDelete-<owner>-conventions-…` and is removed by name in a `finally`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { formatOwner, ownedName, runRecord } from "./lib/owned.mjs";

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "janitor.sh");
const SECONDS = 30_000;
const docker = (...args) => spawnSync("docker", args, { encoding: "utf8", timeout: SECONDS, windowsHide: true });

/** The `--format` templates the script passes to `docker volume inspect` for the CAPTURE (a template followed by the end of the argument list or a redirect). The re-check at the removal builds its own with a tab and is not one of them. */
function captureTemplates(text) {
  return [...text.matchAll(/volume inspect --format '([^']*)'(?=\s)/g)].map((match) => match[1]);
}

const EXPECTED_TEMPLATES = 2; // the batch call and the per-name fallback of `volume_created`

test("live 1. the capture's volume-inspect templates are found in the script (the scan below cannot pass by matching nothing)", () => {
  const templates = captureTemplates(fs.readFileSync(SCRIPT, "utf8"));
  assert.equal(templates.length, EXPECTED_TEMPLATES, `expected the batch and the per-name template, found [${templates.join(" // ")}]`);
  for (const template of templates) assert.ok(template.includes("{{.Name}}") && template.includes("{{.CreatedAt}}"), template);
});

test("live 2. real `docker volume inspect` prints a REAL tab between the name and the creation time for each capture template", { timeout: 120_000 }, (t) => {
  if (docker("version", "--format", "{{.Server.Version}}").status !== 0) {
    t.skip("no `docker` on PATH, or the daemon does not answer `docker version`");
    return;
  }
  const templates = captureTemplates(fs.readFileSync(SCRIPT, "utf8"));
  assert.equal(templates.length, EXPECTED_TEMPLATES);
  const name = ownedName("livevol");
  const created = docker("volume", "create", "--label", `testsToDelete.owner=${formatOwner(runRecord())}`, name);
  assert.equal(created.status, 0, `creating the live volume failed: ${created.stderr}`);
  try {
    for (const template of templates) {
      const inspected = docker("volume", "inspect", "--format", template, name);
      assert.equal(inspected.status, 0, `docker volume inspect failed: ${inspected.stderr}`);
      const out = inspected.stdout.replace(/\r?\n$/, "");
      const fields = out.split("\t");
      assert.equal(fields.length, 2, `template ${template} printed ${JSON.stringify(out)} — expected name, a real tab, creation time`);
      assert.equal(fields[0], name, out);
      assert.ok(fields[1].length > 0 && !fields[1].includes("\\"), `no creation time in ${JSON.stringify(out)}`);
    }
  } finally {
    docker("volume", "rm", name);
  }
});
