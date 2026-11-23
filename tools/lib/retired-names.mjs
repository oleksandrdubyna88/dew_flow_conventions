// The scan behind `tools/retired-names.test.mjs` (A4 of the dew_flow_mods plan): the names of the retired agent-models
// installer and mod, and the few places where they may still stand. Plain functions over a Map of path → text, so a test can
// plant a hit without writing a file; `trackedFiles` is the one function that touches the disk and git.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { gitOutput } from './git.mjs';

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The retired names, as patterns over one line (the first two over the folder, case-insensitive, with either separator).
 *
 * <p>`mods/agent-models` is the folder of the mod in this repository (it moved to `dew_flow_mods`). Two spellings of it are not
 * that, and only these two: the person's own old copy `~/.claude/mods/agent-models` (also `~\.claude\mods\agent-models`), which the
 * new step names to retire it, and a path qualified by a commit hash of 7 to 40 hex digits (`c598a11:mods/agent-models/…`), which a
 * test reads from history. A hash must not be the tail of a longer word, and `HEAD:`, a branch name or `$HOME/.claude/` are
 * hits. The split form of a path join, `'mods', 'agent-models'`, is the second pattern.</p>
 */
export const NAMES = [
  { name: 'mods/agent-models', pattern: /(?<!~[\\/]\.claude[\\/])(?<!(?<!\w)[0-9a-f]{7,40}:)mods[\\/]+agent-models/i },
  { name: 'mods, agent-models', pattern: /['"`]mods['"`]\s*,\s*['"`]agent-models['"`]/i },
  { name: 'RELEASED_MOD', pattern: /RELEASED_MOD/ },
  { name: 'agent-models-pins', pattern: /agent-models-pins/ },
];

/** Where a name may stand, with the reason; `names` limits the exemption to some names (all when absent). */
export const ALLOWED = [
  { file: /^(?:todo|research)\/PLAN_/, reason: 'the plan files are the history of the work, and a plan file is never rewritten for a later name' },
  { file: /^tools\/fixtures\/retired-installer\//, reason: 'the frozen copy of the old step is the old names, byte for byte (F1 holds its hashes)' },
  { file: /^research\/dew_flow_mods_probe_E\d+\.md$/, reason: 'the engine probe is a dated record of what was observed on the mod as it then was' },
  { file: /^tools\/(?:lib\/retired-names\.mjs|retired-names\.test\.mjs)$/, reason: 'the scan lists the names and plants them' },
  { file: /^tools\/mods-marketplace-step\.test\.mjs$/, names: ['RELEASED_MOD', 'mods/agent-models', 'mods, agent-models'], reason: 'the control M5p imports the frozen step\'s own constant under another name, reads the 1.4.0 mod from history by a commit variable and lays it out in the frozen consumer folder' },
];

const allowed = (file, name) => ALLOWED.some(rule => rule.file.test(file) && (rule.names === undefined || rule.names.includes(name)));

/** Every hit of a Map of path → text, as `{ file, line, name }`, sorted by file, line, then the order of NAMES. */
export function scanFiles(files) {
  const hits = [];
  for (const [file, text] of files) {
    text.split('\n').forEach((line, index) => {
      for (const { name, pattern } of NAMES) {
        if (pattern.test(line) && !allowed(file, name)) hits.push({ file, line: index + 1, name });
      }
    });
  }
  const order = name => NAMES.findIndex(n => n.name === name);
  return hits.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line || order(a.name) - order(b.name)));
}

/**
 * Every tracked file and every untracked file git does not ignore, as path → text (paths with `/`). A file git lists that is
 * gone from the disk (deleted, not yet staged) and a file that is not UTF-8 text are left out.
 */
export function trackedFiles(repo = REPO) {
  const listing = gitOutput(repo, ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { timeoutMs: 60_000 });
  const found = new Map();
  for (const file of listing.split('\0').filter(Boolean)) {
    const full = path.join(repo, file);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
    const bytes = fs.readFileSync(full);
    if (bytes.includes(0)) continue;
    found.set(file, bytes.toString('utf8'));
  }
  return found;
}
