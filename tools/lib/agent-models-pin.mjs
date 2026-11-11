/**
 * The version pin of the agent-models mod. The session self-install upgrades an installed copy by `plugin.json` version
 * alone (`settings/hooks/lib/agent-models-decide.mjs`), so a change to one of the installed files (`MOD_FILES`) WITHOUT a new
 * version would reach nobody. `tools/agent-models-pins.json` holds, per released version, the sha256 of each of the files
 * that release held (a file's `INTRODUCED` release says from which one); `checkPin` compares a mod folder with it. Rows are only ever added.
 *
 * `node tools/lib/agent-models-pin.mjs --print` prints the row of the current `mods/agent-models` as JSON, ready to be
 * merged into the table after a version bump.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { INTRODUCED, MOD_FILES, PLUGIN_JSON, compareVersions, parseJsonObject, parseVersion } from '../../settings/hooks/lib/agent-models-decide.mjs';

const TOOLS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE_MOD = path.join(TOOLS, '..', 'mods', 'agent-models');
const PIN_FILE = 'tools/agent-models-pins.json';

/** `{ "<version>": { "<rel>": "<sha256>", … one per file the release held } }`, read once from the committed table. */
export const PINS = JSON.parse(fs.readFileSync(path.join(TOOLS, 'agent-models-pins.json'), 'utf8'));

const sha256OrNull = file => {
  try {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  } catch {
    return null;
  }
};

function versionOfFolder(modDir) {
  try {
    const version = parseJsonObject(fs.readFileSync(path.join(modDir, PLUGIN_JSON)))?.version;
    return parseVersion(version) ? version : null;
  } catch {
    return null;
  }
}

/** The files a release of `version` held: `MOD_FILES` minus those whose `INTRODUCED` release is later (derived, never retyped). */
const filesOf = version => MOD_FILES.filter(rel => INTRODUCED[rel] === undefined || compareVersions(parseVersion(version), INTRODUCED[rel]) >= 0);

/** The row for `modDir`: the version it declares and the sha256 of each file that release held (null for one that cannot be read). */
export function printRow(modDir) {
  const version = versionOfFolder(modDir);
  return { [version]: Object.fromEntries(filesOf(version).map(rel => [rel, sha256OrNull(path.join(modDir, rel))])) };
}

/** `{ ok: true }` or `{ problem }` naming the file or the version, in words that say what to do. */
export function checkPin(modDir, pins) {
  const version = versionOfFolder(modDir);
  if (version === null) return { problem: `mods/agent-models/${PLUGIN_JSON} has no readable MAJOR.MINOR.PATCH version` };
  const row = pins[version];
  if (row === undefined) {
    return { problem: `version ${version} of mods/agent-models has no row in ${PIN_FILE} — add it with node tools/lib/agent-models-pin.mjs --print` };
  }
  const changed = MOD_FILES.find(rel => sha256OrNull(path.join(modDir, rel)) !== row[rel]);
  if (changed !== undefined) {
    return { problem: `mods/agent-models/${changed} changed but plugin.json still says ${version} — bump the version in mods/agent-models/${PLUGIN_JSON} and add its row` };
  }
  return { ok: true };
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes('--print')) {
  process.stdout.write(`${JSON.stringify(printRow(LIVE_MOD), null, 2)}\n`);
}
