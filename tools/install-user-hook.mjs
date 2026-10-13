#!/usr/bin/env node
/**
 * Install (or remove, or verify) the subagent-model PreToolUse hook in a USER's Claude Code home.
 *
 * <p>`node tools/install-user-hook.mjs [--install | --uninstall | --check] [--force] [--home <dir>] [--source <file>]`.
 * Exit 0 on success, 1 on a refusal or drift, 2 on bad arguments; one-line messages go to stderr.</p>
 *
 * <p>The logic lives in `settings/hooks/lib/user-guard-install.mjs`; this file is only the CLI. `--uninstall`
 * also writes `~/.claude/hooks/subagent-model.optout` so the session self-install does not undo it;
 * an explicit `--install` deletes that marker. `--force` installs over a NEWER installed guard (without
 * it that is refused); every install writes `subagent-model.installed.json` (provenance), which `--check`
 * prints and verifies and `--uninstall` removes.</p>
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

import { check, install, uninstall } from '../settings/hooks/lib/user-guard-install.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SOURCE = path.resolve(HERE, '..', 'settings', 'hooks', 'subagent-model.mjs');

/** Parsed CLI arguments, or `{ error }` (exit 2). */
export function parseArgs(argv) {
  const out = { action: '', home: os.homedir(), source: DEFAULT_SOURCE, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (['--install', '--uninstall', '--check'].includes(arg)) {
      if (out.action) return { error: `only one of --install, --uninstall, --check may be given (got --${out.action} and ${arg})` };
      out.action = arg.slice(2);
    } else if (arg === '--force') {
      out.force = true;
    } else if (arg === '--home' || arg === '--source') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) return { error: `${arg} needs a value` };
      out[arg.slice(2)] = path.resolve(value);
      i += 1;
    } else return { error: `unknown argument ${arg}; usage: [--install | --uninstall | --check] [--home <dir>] [--source <file>]` };
  }
  return { ...out, action: out.action || 'install' };
}

const ACTIONS = { install: a => install({ ...a, clearOptout: true }), uninstall, check };

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
