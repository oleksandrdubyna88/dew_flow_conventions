import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';

import { resolved } from '../.github/scripts/branch-protection.mjs';

/**
 * The resolver is the family's ONE way for a script in `.github/scripts/` to find `git` or `gh`.
 *
 * <p>Exported on 2026-09-26: `dew_flow_connect_other_ais` gave two new release scripts
 * (`release-anchors.mjs`, `docs-only-title.mjs`) this function instead of a second copy of it —
 * SonarCloud's S4036 fires on a bare name handed to the spawner — and its copy of this file took the
 * `export`. This copy keeps pace, so the two do not drift.</p>
 */

test('the resolver is importable, and finds a program on PATH by its absolute path', () => {
  // A PATH this test controls, not the machine's: a node started by absolute path need not have its
  // own directory on PATH, and the case would fail with the resolver working. (CodeRabbit, PR #56.)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolver-'));
  const name = 'coai-resolver-probe';
  const program = path.join(dir, name + (process.platform === 'win32' ? '.exe' : ''));
  const before = process.env.PATH;
  try {
    fs.writeFileSync(program, '');
    fs.chmodSync(program, 0o755);
    process.env.PATH = dir;

    assert.equal(resolved(name), program, 'the resolver did not answer the program on PATH, absolutely');
  } finally {
    process.env.PATH = before;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('importing the script runs nothing — its CLI only starts when it is the program itself', () => {
  // A module whose import applied branch protection would make every importer a writer of settings.
  assert.equal(typeof resolved, 'function');
});
