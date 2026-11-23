/**
 * Shared fixtures of `tools/mods-marketplace.test.mjs` and `tools/mods-marketplace-step.test.mjs`: a temporary home, the
 * words of the scenarios (old, reg, engine, tomb) and the helpers that compare folders. Every path of the home is
 * spelled out HERE, independent of `paths()` of the lib, so a changed path in the lib is a red test.
 *
 * Temporary homes are made by `ownedDir` only. Never `os.homedir()`, never the real ~/.claude or ~/.claude.json: every
 * helper takes the home it was given, `sandbox` asserts it is not the real one, and a spawned hook gets HOME,
 * USERPROFILE and CLAUDE_CONFIG_DIR pointed into the temp folder.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ANCHOR, INLINE_ID, MARKETPLACE, PLUGIN_ID, anchorEntry, ensureModsMarketplace, tombstoneBytes } from '../../settings/hooks/lib/mods-marketplace.mjs';
import { PREFIX, ownedDir } from './owned.mjs';

export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const HOUR = 3600 * 1000;
/** The clock of every test: no test reads the real one; times are `NOW ± n` hours. */
export const NOW = new Date('2026-11-23T12:00:00.000Z');
export const at = hours => new Date(NOW.getTime() + hours * HOUR);
export const IS_ROOT = process.getuid?.() === 0;
export const D = path.delimiter;

/** The seven files of the 1.4.0 mod the old installer vouched for (names only: the bytes here are fixtures). */
export const OLD_FILES = ['.claude-plugin/plugin.json', 'hooks/hooks.json', 'hooks/register.tsx', 'hooks/prompts.ts', 'hooks/tasks.tsx', 'hooks/limits.tsx', 'types/index.d.ts'];
/** What the engine puts in the folder that the old record does not name: a top-level tsconfig.json and the folder .claude-plugin/types with its contents (read on this machine, 2026-11-23). */
export const EXTRAS = ['tsconfig.json', '.claude-plugin/types/claude-code/index.d.ts'];

/** The folder a `readdirSync` entry sits in: `parentPath` from Node 20.12, `path` before it (the repository accepts Node 20+). */
export const direntFolder = entry => entry.parentPath ?? entry.path;

/** Every file under `dir` → { bytes (hex), mtimeMs }; the record a "nothing was touched" test compares. */
export function snapshot(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = path.join(direntFolder(entry), entry.name);
    out[path.relative(dir, file)] = { bytes: fs.readFileSync(file).toString('hex'), mtimeMs: fs.statSync(file).mtimeMs };
  }
  return out;
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

/** Every entry under `dir` (files, folders, links) as a sorted list of relative names; the shape a "nothing is left" test reads. */
export const names = dir => (fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).map(n => n.split(path.sep).join('/')).sort() : []);

const write = (file, data, mode) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data, mode === undefined ? undefined : { mode });
};
const json = value => `${JSON.stringify(value, null, 2)}\n`;

/**
 * A temporary home (empty; `.claude` is not made) and the paths of everything the step may name. The home is asserted
 * to be a fresh folder that is not the real one.
 */
export function sandbox(t, what = 'mods-marketplace') {
  const root = ownedDir(t, what);
  const home = path.join(root, 'home');
  fs.mkdirSync(home);
  if (path.resolve(home) === path.resolve(os.homedir()) || !path.basename(root).startsWith(PREFIX)) {
    throw new Error(`the test home ${home} is not a temporary folder`);
  }
  const claude = path.join(home, '.claude');
  const mods = path.join(claude, 'mods');
  const plugins = path.join(claude, 'plugins');
  const s = {
    root, home, claude, mods, plugins,
    settings: path.join(claude, 'settings.json'),
    oldFolder: path.join(mods, 'agent-models'),
    oldManifest: path.join(mods, 'agent-models.installed.json'),
    oldReported: path.join(mods, 'agent-models.reported.json'),
    optout: path.join(mods, 'agent-models.optout'),
    state: path.join(mods, 'dew-flow-mods.seen.json'),
    installed: path.join(plugins, 'installed_plugins.json'),
    known: path.join(plugins, 'known_marketplaces.json'),
    cacheRoot: path.join(plugins, 'cache', 'dew-flow-mods', 'agent-models'),
  };
  const home_ = {
    ...s,
    /** The settings as an object, or null when there is no file. */
    readSettings: () => (fs.existsSync(s.settings) ? JSON.parse(fs.readFileSync(s.settings, 'utf8')) : null),
    writeSettings: value => write(s.settings, typeof value === 'string' ? value : json(value)),
    backups: () => (fs.existsSync(s.claude) ? fs.readdirSync(s.claude).filter(f => f.includes('.bak-subagent-model-')).sort() : []),
    readState: () => (fs.existsSync(s.state) ? JSON.parse(fs.readFileSync(s.state, 'utf8')) : null),
    writeState: value => write(s.state, typeof value === 'string' ? value : json(value)),
    /** The tombstone the step writes, at `when` (a Date). */
    tomb: (when = NOW) => write(s.optout, tombstoneBytes(when)),
    /** The old copy at version `v`: the files its record names, the record, the engine's extras and the variable that lists it. */
    old: (v = '1.4.0', { variable = true, extras = true, settings = true } = {}) => {
      const files = {};
      for (const rel of OLD_FILES) {
        files[rel] = Buffer.from(rel === '.claude-plugin/plugin.json' ? `${JSON.stringify({ name: 'agent-models', version: v })}\n` : `// old ${v} ${rel}\n`);
        write(path.join(s.oldFolder, rel), files[rel]);
      }
      if (extras) for (const rel of EXTRAS) write(path.join(s.oldFolder, rel), `// engine extra ${rel}\n`);
      write(s.oldManifest, json({ version: v, source: '/elsewhere', sha256: Object.fromEntries(OLD_FILES.map(rel => [rel, sha(files[rel])])), installedAt: '2026-01-01T00:00:00.000Z', by: 'self-install' }));
      if (variable && settings) home_.mergeSettings({ env: { CLAUDE_CODE_PLUGIN_DIRS: s.oldFolder } });
      return files;
    },
    /** The engine's side at version `v`: the `known` entry, the cache folder with its plugin.json and the record. */
    engine: (v = '1.6.0', { known = true, cache = true, record = true } = {}) => {
      if (known) write(s.known, json({ [MARKETPLACE]: { source: { ...ANCHOR }, installLocation: path.join(plugins, 'marketplaces', MARKETPLACE), lastUpdated: '2026-11-23T00:00:00.000Z' } }));
      const installPath = path.join(s.cacheRoot, v);
      if (cache) write(path.join(installPath, '.claude-plugin', 'plugin.json'), json({ name: 'agent-models', version: v }));
      if (record) write(s.installed, json({ version: 2, plugins: { [PLUGIN_ID]: [{ scope: 'user', installPath, version: v, installedAt: '2026-11-23T00:00:00.000Z', lastUpdated: '2026-11-23T00:00:00.000Z' }] } }));
      return installPath;
    },
    /** The two keys the step writes, built by the lib's own builder, merged into the settings (other members kept). */
    reg: (extra = {}) => home_.mergeSettings({
      extraKnownMarketplaces: { [MARKETPLACE]: anchorEntry() }, enabledPlugins: { [PLUGIN_ID]: true }, ...extra,
    }),
    /** Deep merge of one level below the top: `value`'s objects are merged into the settings' objects. */
    mergeSettings: value => {
      const now = home_.readSettings() ?? {};
      for (const [key, v] of Object.entries(value)) {
        now[key] = v !== null && typeof v === 'object' && !Array.isArray(v) && now[key] !== null && typeof now[key] === 'object' ? { ...now[key], ...v } : v;
      }
      home_.writeSettings(now);
    },
    /** Sets `enabledPlugins[id]`. */
    plugin: (id, value) => home_.mergeSettings({ enabledPlugins: { [id]: value } }),
    /** The state of a start that has done step 1 at `when`: tombstone, the inline switch off, `retiredAt`. */
    retired: (when, version) => {
      home_.tomb(when);
      home_.plugin(INLINE_ID, false);
      home_.writeState({ retiredAt: when.toISOString(), version });
    },
    /** `snapshot` of the home without the state file: the step's own bookkeeping is not what "untouched" is about. */
    frozen: () => {
      const snap = snapshot(home);
      delete snap[path.join('.claude', 'mods', 'dew-flow-mods.seen.json')];
      return snap;
    },
    /** The step, in process, on this home. */
    step: (options = {}) => ensureModsMarketplace({ home, env: {}, now: () => NOW, ...options }),
    /** The lines of a result (`line` is joined with \n). */
    linesOf: result => (result.line === '' ? [] : result.line.split('\n')),
  };
  return home_;
}

export { ANCHOR, INLINE_ID, MARKETPLACE, PLUGIN_ID };
