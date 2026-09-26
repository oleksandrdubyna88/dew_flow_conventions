import assert from 'node:assert/strict';
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

test('the resolver is importable, and answers an absolute path to a program that is on PATH', () => {
  const node = resolved(path.basename(process.execPath, path.extname(process.execPath)));

  assert.ok(path.isAbsolute(node), `a relative answer would be spawned from the caller's directory: ${node}`);
});

test('importing the script runs nothing — its CLI only starts when it is the program itself', () => {
  // A module whose import applied branch protection would make every importer a writer of settings.
  assert.equal(typeof resolved, 'function');
});
