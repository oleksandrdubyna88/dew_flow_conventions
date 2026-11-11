/**
 * Shared fixtures of the agent-models test files (`agent-models-decide.test.mjs`, `agent-models-read.test.mjs`,
 * `agent-models-pin.test.mjs`, `agent-models-install.test.mjs`, `agent-models-swap.test.mjs`,
 * `agent-models-refusals.test.mjs`, `agent-models-report.test.mjs`): the source and target trees, the temporary home, the
 * rename seam and the lines the installer prints, built from the same constants the tests assert with.
 *
 * Temporary homes are made by `ownedDir` only — never `os.homedir()`, never the real ~/.claude.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import * as mod from '../../settings/hooks/lib/agent-models-install.mjs';
import { MOD_FILES } from '../../settings/hooks/lib/agent-models-decide.mjs';
import { ownedDir } from './owned.mjs';

/** The seven files of the mod, taken from the installer's own list, never typed a second time. */
export const FILES = [...MOD_FILES];
export const D = path.delimiter;
export const NOW = new Date('2026-11-10T00:00:00Z');
export const T = '~/.claude/mods/agent-models';
export const S = '~/.claude/settings.json';
export const IS_ROOT = process.getuid?.() === 0;
export const EMPTY_REC = { restored: null, removed: [], skipped: [], refused: null };

export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const installedLine = v => `agent-models mod ${v} installed into ${T} and registered in ${S} (CLAUDE_CODE_PLUGIN_DIRS) — loads from the next session`;
/** `replaced` is the folder name the differing copy was kept as (A3), or undefined when the old copy matched its record. */
export const upgradedLine = (i, v, replaced) => `agent-models mod upgraded in ${T} (version ${i} → ${v}${replaced === undefined ? '' : `; the copy that differed from its install record was kept as ~/.claude/mods/${replaced}`}) — loads from the next session`;
export const stampOf = date => date.toISOString().replace(/[-:]/g, '').replace('.', '');
export const replacedName = (date = NOW) => `agent-models.replaced-${stampOf(date)}`;
export const OPTOUT = '~/.claude/mods/agent-models.optout';
export const editedLine = v => `agent-models mod in ${T} is version ${v} but its files differ from this repository's and from its install record — left as it is (said once); delete the folder to reinstall, or create ${OPTOUT} to turn this step off`;
export const newerLine = (installed, v) => `agent-models mod in ${T} is version ${installed}, newer than this repository's ${v} — left as it is (said once; create ${OPTOUT} to turn this step off)`;
export const RETRY_TAIL = '; the next session start registers it';
export const HAND_TAIL = '; fix it by hand — nothing changes until then';
export const carriedText = n => `; carried over ${n} ${n === 1 ? 'entry' : 'entries'} of this session's CLAUDE_CODE_PLUGIN_DIRS, because the settings value replaces the shell's`;
export const registeredLine = `agent-models mod registered in ${S} (CLAUDE_CODE_PLUGIN_DIRS) — loads from the next session`;
export const notRegistered = (v, reason, tail = RETRY_TAIL) => `agent-models mod ${v} installed into ${T} but NOT registered in ${S}: ${reason}${tail}`;
export const notInstalled = reason => `agent-models mod NOT installed into ${T}: ${reason}`;
export const symlinkLine = target => notInstalled(`${target} is a symlink; it is never renamed aside or deleted through (said once; create ${OPTOUT} to turn this step off)`);
export const escaped = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The bytes of one source file at a version: distinct and non-empty per file. */
export function fixtureBytes(rel, version) {
  if (rel === '.claude-plugin/plugin.json') return Buffer.from(`${JSON.stringify({ name: 'agent-models', version })}\n`);
  return Buffer.from(`// fixture ${rel}\nexport const here = ${JSON.stringify(rel)};\n`);
}

/** The released identity of a fixture tree: what a test tells `readSource` to accept. Built from bytes, never typed. */
export const fixtureReleased = (version, overrides = {}) => ({
  version,
  sha256: Object.fromEntries(FILES.map(rel => [rel, sha(overrides[rel] ?? fixtureBytes(rel, version))])),
});

export function writeTree(dir, version, overrides = {}) {
  for (const rel of FILES) {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, overrides[rel] ?? fixtureBytes(rel, version));
  }
}

/** Every file under `dir` → { bytes (hex), mtimeMs }; the record a "nothing was touched" test compares. */
export function snapshot(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = path.join(entry.parentPath, entry.name);
    out[path.relative(dir, file)] = { bytes: fs.readFileSync(file).toString('hex'), mtimeMs: fs.statSync(file).mtimeMs };
  }
  return out;
}

/** The files (not folders) under `dir`, sorted, relative with `/`. */
export const treeFiles = dir => Object.keys(snapshot(dir)).map(f => f.split(path.sep).join('/')).sort();

export const goodManifest = (version, files, source = '/somewhere') => ({
  version,
  source,
  sha256: Object.fromEntries(FILES.map(rel => [rel, sha(files[rel])])),
  installedAt: '2026-01-01T00:00:00.000Z',
  by: 'seed',
});

/** A temporary home and source. The paths are spelled out here, independent of `modTargets`. */
export function sandbox(t, { version = '1.2.3' } = {}) {
  const root = ownedDir(t, 'agent-models');
  const home = path.join(root, 'home');
  const source = path.join(root, 'source');
  fs.mkdirSync(home);
  writeTree(source, version);
  const claude = path.join(home, '.claude');
  const t_ = {
    mods: path.join(claude, 'mods'),
    target: path.join(claude, 'mods', 'agent-models'),
    manifest: path.join(claude, 'mods', 'agent-models.installed.json'),
    settings: path.join(claude, 'settings.json'),
    reported: path.join(claude, 'mods', 'agent-models.reported.json'),
  };
  const writeSettings = value => {
    fs.mkdirSync(claude, { recursive: true });
    fs.writeFileSync(t_.settings, typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  };
  const registered = (extra = {}) => ({ ...extra, env: { CLAUDE_CODE_PLUGIN_DIRS: t_.target } });
  const s = {
    root, home, source, t_, claude, writeSettings, registered,
    readSettings: () => (fs.existsSync(t_.settings) ? fs.readFileSync(t_.settings, 'utf8') : null),
    backups: (dir = claude) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.includes('.bak-subagent-model-')) : []),
    listMods: () => (fs.existsSync(t_.mods) ? fs.readdirSync(t_.mods).sort() : null),
    installedBytes: rel => fs.readFileSync(path.join(t_.target, rel)),
    reported: () => (fs.existsSync(t_.reported) ? JSON.parse(fs.readFileSync(t_.reported, 'utf8')) : null),
    manifest: () => (fs.existsSync(t_.manifest) ? JSON.parse(fs.readFileSync(t_.manifest, 'utf8')) : null),
    sourceFile: rel => path.join(source, rel),
    /** A target at `version` made of the fixture bytes for `version`; its manifest matches unless `manifest` says otherwise. */
    seedTarget({ version: v = version, overrides = {}, manifest } = {}) {
      writeTree(t_.target, v, overrides);
      const files = Object.fromEntries(FILES.map(rel => [rel, fs.readFileSync(path.join(t_.target, rel))]));
      const doc = manifest === undefined ? goodManifest(v, files) : manifest;
      if (doc !== null) fs.writeFileSync(t_.manifest, `${JSON.stringify(doc, null, 2)}\n`);
      return files;
    },
    ensure: (opts = {}) => mod.ensureAgentModels({ home, source, by: 'test', now: () => NOW, released: fixtureReleased(version), ...opts }),
  };
  return s;
}

export function symlinkOrSkip(t, target, link) {
  try {
    fs.symlinkSync(target, link);
    return true;
  } catch (e) {
    t.skip(`symlinks are not permitted here (${e.code})`);
    return false;
  }
}

/** A rename seam that records every call and lets `fail(callNumber, from, to)` throw before delegating. */
export function renameSeam(fail = () => {}) {
  const calls = [];
  const seam = (from, to) => {
    calls.push([from, to]);
    fail(calls.length, from, to);
    fs.renameSync(from, to);
  };
  return { calls, seam };
}
export const failing = code => Object.assign(new Error(`${code}: injected`), { code });

export const NOTHING_RAN = EMPTY_REC;
