#!/usr/bin/env node
/**
 * Install (or remove, or verify) the subagent-model PreToolUse hook in a USER's Claude Code home.
 *
 * <p>`node tools/install-user-hook.mjs [--install | --uninstall | --check] [--home <dir>] [--source <file>]`.
 * Exit 0 on success, 1 on a refusal or drift, 2 on bad arguments; one-line messages go to stderr.</p>
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
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const MATCHER = 'Agent|Task';
const BACKUP_TAG = 'settings.json.bak-subagent-model-';
const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SOURCE = path.resolve(HERE, '..', 'settings', 'hooks', 'subagent-model.mjs');

/** Where the hook and the settings live for a home. */
export function targets(home) {
  const dir = path.resolve(home, '.claude');
  return { dir, hook: path.join(dir, 'hooks', 'subagent-model.mjs'), settings: path.join(dir, 'settings.json') };
}

const normalise = p => (process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p));

/** The entry this tool owns. */
export function entryFor(hookPath) {
  return { matcher: MATCHER, hooks: [{ type: 'command', command: 'node', args: [hookPath] }] };
}

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

const itemIsOurs = (item, hookPath) =>
  isObject(item) && Array.isArray(item.args) && typeof item.args[0] === 'string' &&
  normalise(item.args[0]) === normalise(hookPath);

const entryIsOurs = (entry, hookPath) =>
  isObject(entry) && Array.isArray(entry.hooks) && entry.hooks.some(item => itemIsOurs(item, hookPath));

const preToolUse = settings => (isObject(settings.hooks) && Array.isArray(settings.hooks.PreToolUse) ? settings.hooks.PreToolUse : []);

/** The PreToolUse entries that are ours, in order. */
export function findEntries(settings, hookPath) {
  return preToolUse(settings).filter(entry => entryIsOurs(entry, hookPath));
}

/** A copy of `settings` with our entry installed: replaced in place when present, appended otherwise. */
export function mergeEntry(settings, hookPath) {
  const next = structuredClone(settings);
  if (!isObject(next.hooks)) next.hooks = {};
  if (!Array.isArray(next.hooks.PreToolUse)) next.hooks.PreToolUse = [];
  const list = next.hooks.PreToolUse;
  const at = list.findIndex(e => entryIsOurs(e, hookPath));
  if (at < 0) {
    list.push(entryFor(hookPath));
    return next;
  }
  list[at] = entryFor(hookPath);
  // A hand-made twin collapses into the first copy.
  next.hooks.PreToolUse = list.filter((e, i) => i <= at || !entryIsOurs(e, hookPath));
  return next;
}

/** A copy of `settings` without our hook items; emptied entries, `PreToolUse` and `hooks` are dropped. */
export function removeEntry(settings, hookPath) {
  const next = structuredClone(settings);
  if (!isObject(next.hooks) || !Array.isArray(next.hooks.PreToolUse)) return next;
  next.hooks.PreToolUse = next.hooks.PreToolUse.flatMap(entry => {
    if (!entryIsOurs(entry, hookPath)) return [entry];
    const hooks = entry.hooks.filter(item => !itemIsOurs(item, hookPath));
    return hooks.length ? [{ ...entry, hooks }] : [];
  });
  if (next.hooks.PreToolUse.length === 0) delete next.hooks.PreToolUse;
  if (Object.keys(next.hooks).length === 0) delete next.hooks;
  return next;
}

/** One line per way the installation differs from what `--install` writes; empty when clean. */
export function drift(settings, hookPath, installedBytes, sourceBytes) {
  const out = [];
  if (installedBytes === null) out.push(`hook file missing: ${hookPath}`);
  else if (!installedBytes.equals(sourceBytes)) out.push(`hook file differs from the source: ${hookPath}`);
  const ours = findEntries(settings, hookPath);
  if (ours.length === 0) out.push('no PreToolUse entry for the hook in settings.json');
  if (ours.length > 1) out.push(`${ours.length} PreToolUse entries for the hook (expected exactly one)`);
  if (ours.length === 1) {
    const [entry] = ours;
    const item = entry.hooks.find(i => itemIsOurs(i, hookPath));
    if (entry.matcher !== MATCHER) out.push(`matcher is ${JSON.stringify(entry.matcher)}, expected "${MATCHER}"`);
    if (item.command !== 'node') out.push(`command is ${JSON.stringify(item.command)}, expected "node"`);
  }
  return out;
}

function writeAtomic(dest, data) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, dest);
}

const readOrNull = file => (fs.existsSync(file) ? fs.readFileSync(file) : null);

const sameBytes = (a, b) => (a === null || b === null ? a === b : a.equals(b));

/** Parsed settings from bytes, or an `error` phrase when they are not a JSON object. */
function parseSettings(bytes) {
  if (bytes === null) return { settings: {} };
  try {
    const value = JSON.parse(bytes.toString('utf8').replace(/^﻿/, ''));
    return isObject(value) ? { settings: value } : { error: 'is not a JSON object' };
  } catch (e) {
    return { error: `does not parse (${e.message})` };
  }
}

const stamp = (now = new Date()) => now.toISOString().replace(/\.\d+Z$/, 'Z').replace(/[-:]/g, '');

function writeBackup(settingsPath, bytes) {
  for (let n = 0; ; n += 1) {
    const file = path.join(path.dirname(settingsPath), `${BACKUP_TAG}${stamp()}${n ? `-${n}` : ''}`);
    try {
      fs.writeFileSync(file, bytes, { flag: 'wx' });
      return file;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    }
  }
}

const result = (code, lines) => ({ code, lines });
const serialise = settings => `${JSON.stringify(settings, null, 2)}\n`;
const unparsable = (file, error) => result(1, [`${file} ${error}; nothing changed — fix or move the file and run again`]);

/** The refusal shared by install and uninstall when settings.json moved under us. */
const CHANGED = 'settings.json changed while installing; nothing written to it — run again';

/**
 * Install the hook. `beforeWrite` is a test seam (runs after the merge is computed and the backup is
 * taken, before the final re-read) and is deliberately not reachable from the CLI.
 */
export function install({ home, source, beforeWrite = () => {} }) {
  const t = targets(home);
  if (!fs.existsSync(source)) return result(1, [`source hook not found: ${source} — pass --source <file>`]);
  const original = readOrNull(t.settings);
  const parsed = parseSettings(original);
  if (parsed.error) return unparsable(t.settings, parsed.error);
  const merged = mergeEntry(parsed.settings, t.hook);
  const sourceBytes = fs.readFileSync(source);
  const upToDate = original !== null && original.equals(Buffer.from(serialise(merged))) && sameBytes(readOrNull(t.hook), sourceBytes);
  if (upToDate) return result(0, ['already installed']);
  writeAtomic(t.hook, sourceBytes);
  const lines = [`wrote ${t.hook}`];
  if (original !== null) lines.push(`backup ${writeBackup(t.settings, original)}`);
  beforeWrite();
  if (!sameBytes(readOrNull(t.settings), original)) return result(1, [...lines, CHANGED]);
  writeAtomic(t.settings, serialise(merged));
  return result(0, [...lines, `wrote ${t.settings} (hooks.PreToolUse: ${MATCHER})`]);
}

/** Remove only what `install` added. */
export function uninstall({ home, beforeWrite = () => {} }) {
  const t = targets(home);
  const original = readOrNull(t.settings);
  const parsed = parseSettings(original);
  if (parsed.error) return unparsable(t.settings, parsed.error);
  const present = findEntries(parsed.settings, t.hook).length > 0;
  const hookThere = fs.existsSync(t.hook);
  if (!present && !hookThere) return result(0, ['not installed']);
  const lines = [];
  if (present) {
    lines.push(`backup ${writeBackup(t.settings, original)}`);
    beforeWrite();
    if (!sameBytes(readOrNull(t.settings), original)) return result(1, [CHANGED]);
    writeAtomic(t.settings, serialise(removeEntry(parsed.settings, t.hook)));
    lines.push(`removed the hook entry from ${t.settings}`);
  }
  if (hookThere) {
    fs.rmSync(t.hook);
    lines.push(`deleted ${t.hook}`);
  }
  return result(0, lines);
}

/** Exit 0 only when the installation is exactly what `install` would write. */
export function check({ home, source }) {
  const t = targets(home);
  if (!fs.existsSync(source)) return result(1, [`source hook not found: ${source} — pass --source <file>`]);
  const parsed = parseSettings(readOrNull(t.settings));
  if (parsed.error) return result(1, [`${t.settings} ${parsed.error}`]);
  const lines = drift(parsed.settings, t.hook, readOrNull(t.hook), fs.readFileSync(source));
  return lines.length ? result(1, lines) : result(0, ['installed and current']);
}

/** Parsed CLI arguments, or `{ error }` (exit 2). */
export function parseArgs(argv) {
  const out = { action: '', home: os.homedir(), source: DEFAULT_SOURCE };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (['--install', '--uninstall', '--check'].includes(arg)) {
      if (out.action) return { error: `only one of --install, --uninstall, --check may be given (got --${out.action} and ${arg})` };
      out.action = arg.slice(2);
    } else if (arg === '--home' || arg === '--source') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) return { error: `${arg} needs a value` };
      out[arg.slice(2)] = path.resolve(value);
      i += 1;
    } else return { error: `unknown argument ${arg}; usage: [--install | --uninstall | --check] [--home <dir>] [--source <file>]` };
  }
  return { ...out, action: out.action || 'install' };
}

const ACTIONS = { install, uninstall, check };

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
