#!/usr/bin/env node
/**
 * Install (or remove, or verify) the subagent-model PreToolUse hook in a USER's Claude Code home.
 *
 * <p>`node tools/install-user-hook.mjs [--install | --uninstall | --check] [--force] [--unreleased] [--home <dir>] [--source <file>]`.
 * Exit 0 on success, 1 on a refusal or drift, 2 on bad arguments; one-line messages go to stderr.</p>
 *
 * <p>The logic lives in `settings/hooks/lib/user-guard-install.mjs`; this file is only the CLI. `--uninstall`
 * also writes `~/.claude/hooks/subagent-model.optout` so the session self-install does not undo it;
 * an explicit `--install` deletes that marker. `--force` installs over a NEWER installed guard, or over one changed
 * since its install (its bytes match neither the manifest's `sha256` and `previous` nor the source); without it both
 * are refused. `--unreleased` installs a guard that is not the released one (its sha256 and version differ from
 * `RELEASED_GUARD`, the pair baked into this release): without it such an install is refused, because the guard in
 * ~/.claude runs for every repository on the machine (the owner's go, 2026-11-11). Every install writes `subagent-model.installed.json` (provenance), which `--check`
 * prints and verifies and `--uninstall` removes.</p>
 *
 * <p>`--check` also prints one `effort:` line — `high for every model`, or the settings that are not
 * `high` (`effortLevel xhigh, sonnet unset`). It is information only: it never changes the exit code,
 * because the session self-install (`ensure-user-guard.mjs`) converges effort itself at every start.</p>
 *
 * <p><b>Why a tool and not "paste this into settings.json".</b> A user-level `settings.json` is shared
 * by every project on the machine and is edited by hand, by `/config`, and by other sessions. A
 * hand-merge either duplicates the entry on the second try or drops somebody else's hook. So the merge
 * is a pure function that never mutates its input, keeps every other key and entry in order, and
 * REPLACES our entry in place on upgrade — running the installer twice leaves the same bytes.</p>
 *
 * <p><b>It refuses before it changes anything.</b> A settings file that does not parse as a JSON object
 * is the user's data, not ours to overwrite: the run stops with the file and the hook copy untouched.
 * The file is re-read immediately before the write and compared with the bytes the merge was computed
 * from, because another session writing the same file in between would otherwise be silently lost.
 * The original bytes are also kept as `settings.json.bak-subagent-model-<UTC stamp>`.</p>
 *
 * <p><b>The command is passed as `command: "node"` plus `args`</b>, never as one shell string, so a home
 * directory containing spaces or quotes cannot change what runs. "Ours" is recognised by the installed
 * path in `args[0]`, normalised (case-insensitive on Windows), not by the matcher — so an entry whose
 * matcher was edited is still found and upgraded rather than duplicated.</p>
 */
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { RELEASED_GUARD, check, install, uninstall } from '../settings/hooks/lib/user-guard-install.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SOURCE = path.resolve(HERE, '..', 'settings', 'hooks', 'subagent-model.mjs');

/** Parsed CLI arguments, or `{ error }` (exit 2). */
export function parseArgs(argv) {
  const out = { action: '', home: os.homedir(), source: DEFAULT_SOURCE, force: false, unreleased: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (['--install', '--uninstall', '--check'].includes(arg)) {
      if (out.action) return { error: `only one of --install, --uninstall, --check may be given (got --${out.action} and ${arg})` };
      out.action = arg.slice(2);
    } else if (arg === '--force') {
      out.force = true;
    } else if (arg === '--unreleased') {
      out.unreleased = true;
    } else if (arg === '--home' || arg === '--source') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) return { error: `${arg} needs a value` };
      out[arg.slice(2)] = path.resolve(value);
      i += 1;
    } else return { error: `unknown argument ${arg}; usage: [--install | --uninstall | --check] [--force] [--unreleased] [--home <dir>] [--source <file>]` };
  }
  return { ...out, action: out.action || 'install' };
}

/** Install, after the release check: a guard that is not the released one needs `--unreleased`, and nothing is written. */
export function installChecked(a) {
  const r = install({ ...a, clearOptout: true, released: a.unreleased ? null : RELEASED_GUARD });
  if (r.code !== 0 && /is not the released guard/.test(r.lines.at(-1) ?? '')) {
    return { ...r, lines: [...r.lines.slice(0, -1), `refused: ${r.lines.at(-1)}; --unreleased installs it anyway (the guard in ~/.claude runs for every repository)`] };
  }
  return r;
}

const ACTIONS = { install: installChecked, uninstall, check };

if (process.argv[1]?.endsWith('install-user-hook.mjs')) {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    process.stderr.write(`${args.error}\n`);
    process.exit(2);
  }
  const { code, lines } = ACTIONS[args.action](args);
  for (const line of lines) process.stderr.write(`${line}\n`);
  process.exit(code);
}
