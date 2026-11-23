/**
 * The session-start step that registers the `dew-flow-mods` plugin marketplace in `~/.claude/settings.json` and then retires
 * the old copy of the agent-models mod in `~/.claude/mods` (E3 of `todo/PLAN_dew_flow_mods.md`, story 3.1). The decisions are
 * pure functions over values read first (`decideRegistration`, `decideRetirement`, `decideRemoval`); the reads are
 * `readMarker`, `readProof`, `readOldFolder`; `ensureModsMarketplace` is the one sequencing and never throws.
 *
 * Imports only `node:` builtins and `./user-guard-install.mjs`, because a consumer runs this file from its verbatim copy in
 * `.claude/hooks/lib/` with nothing installed beside it. It starts no child process, opens no connection and sets no timer;
 * it reads no environment variable and names no home of its own: the caller passes both, and every path it may read, write or
 * delete is built by `paths`. `settings.json` is written only through `commitSettings` of the guard core (the one road: a
 * re-read of the bytes and of the resolved file, then an atomic write at the real file with its own mode, after a backup).
 *
 * The state machine (the state is read from disk at every start, nothing is kept in memory between starts):
 *   S0 not registered           -> write the two keys (only the absent ones)                                   -> S1
 *   S1 registered, proof not whole -> nothing is touched; after three days the manual command is said once    -> S2
 *   S2 proof whole, `agent-models@inline` absent -> step 1: the tombstone (exclusive create, read back), then that
 *                                  switch set to false, then `retiredAt` stored                               -> S3
 *   S3 marker ours, inline false, less than 24 h since `retiredAt` -> nothing                                  -> S4
 *   S4 24 h or more             -> step 2: our entry leaves env.CLAUDE_CODE_PLUGIN_DIRS, the old folder is renamed aside
 *                                  and deleted, then its record and its reported file; or `left`, named once  -> S5
 *   S5 nothing of the old copy left -> the version line when the installed version changed; the shell warning
 * Nothing is written at all (not even the state file) when the person's own opt-out marker is there.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  backupOnce, commitSettings, isHardLinkFailure, isObject, lstatOrNull, normalise, parseSettings, readOrNull, serialise, settingsFileOf,
  sha256, writableReason, writeAtomic,
} from './user-guard-install.mjs';

export const MARKETPLACE = 'dew-flow-mods';
export const PLUGIN_ID = 'agent-models@dew-flow-mods';
export const INLINE_ID = 'agent-models@inline';
/** The trust anchor: the only source the step writes, and the only one it retires an old copy against. */
export const ANCHOR = Object.freeze({ source: 'git', url: 'https://github.com/oleksandrdubyna88/dew_flow_mods.git', ref: 'release' });
export const STEP2_DELAY_MS = 24 * 3600 * 1000;
export const INSTALL_WAIT_MS = 72 * 3600 * 1000;
export const MAX_RECORD_BYTES = 1 << 20;
export const MAX_FOLDER_ENTRIES = 500;

const MAX_MARKER_BYTES = 4096;
const PLUGIN_DIRS_KEY = 'CLAUDE_CODE_PLUGIN_DIRS';
const RETIRED_TAG = 'agent-models.retired-';
/** Exactly what the step's own rename writes: `agent-models.retired-<milliseconds>-<pid>`; a look-alike name is never ours. */
const RETIRED_ASIDE = /^agent-models\.retired-\d+-\d+$/;
const SHOWN_SETTINGS = '~/.claude/settings.json';
const SHOWN_MODS = '~/.claude/mods';
const SHOWN_OLD = '~/.claude/mods/agent-models';
const SHOWN_OPTOUT = '~/.claude/mods/agent-models.optout';
const TOMBSTONE_NOTE = 'written by the dew-flow-mods registration step of the conventions session start: the agent-models mod is now installed from the dew-flow-mods marketplace, so an installer that honours this marker must not copy the old mod again';

const codeOf = e => e?.code ?? e?.message ?? 'error';
const digestOf = text => sha256(String(text)).slice(0, 12);
const skipped = () => ({ action: 'skipped', line: '', lines: [] });

/** The one builder of the settings entry the step writes. */
export const anchorEntry = () => ({ source: { ...ANCHOR }, autoUpdate: true });

/** Every path the lib may name; nothing else is read, written or deleted. */
export function paths(home, env) {
  const claude = path.resolve(home, '.claude');
  const mods = path.join(claude, 'mods');
  const cache = env?.CLAUDE_CODE_PLUGIN_CACHE_DIR;
  const plugins = typeof cache === 'string' && cache !== '' ? path.resolve(cache) : path.join(claude, 'plugins');
  return {
    claude,
    settings: path.join(claude, 'settings.json'),
    mods,
    oldFolder: path.join(mods, 'agent-models'),
    oldManifest: path.join(mods, 'agent-models.installed.json'),
    oldReported: path.join(mods, 'agent-models.reported.json'),
    optout: path.join(mods, 'agent-models.optout'),
    state: path.join(mods, 'dew-flow-mods.seen.json'),
    plugins,
    installed: path.join(plugins, 'installed_plugins.json'),
    known: path.join(plugins, 'known_marketplaces.json'),
    cacheRoot: path.join(plugins, 'cache', MARKETPLACE, 'agent-models'),
  };
}

/** The bytes of the tombstone: the one builder. `now` is a Date. */
export function tombstoneBytes(now) {
  return serialise({ tombstone: MARKETPLACE, at: now.toISOString(), note: TOMBSTONE_NOTE });
}

// ---------------------------------------------------------------------------------------------------------------------
// what the person is told
// ---------------------------------------------------------------------------------------------------------------------

/** Every line the step can say, as functions; the tests read them and never retype them. */
export const LINES = Object.freeze({
  registered: () => `agent-models: marketplace ${MARKETPLACE} registered in ${SHOWN_SETTINGS} — Claude Code installs the mod at the next interactive start; a copy in ${SHOWN_MODS} keeps working until then`,
  retired: (version, hadFolder) => `agent-models ${version} is installed from ${MARKETPLACE}; ${hadFolder ? `the old copy in ${SHOWN_OLD} is switched off and is removed after 24 hours — ` : ''}the new copy loads from the next session`,
  removed: () => `agent-models: the old copy ${SHOWN_OLD} and its ${PLUGIN_DIRS_KEY} entry were removed`,
  updated: (from, to) => `agent-models updated ${from} → ${to} (dew_flow_mods release)`,
  conflict: () => `agent-models: the ${MARKETPLACE} entry in ${SHOWN_SETTINGS} (extraKnownMarketplaces) is not the trusted source — left as it is, and the old copy is not retired (said once)`,
  autoUpdateOff: () => `agent-models: auto-update of ${MARKETPLACE} is off in ${SHOWN_SETTINGS} — the mod changes only when you run: claude plugin update ${PLUGIN_ID} (said once)`,
  inlineTrue: () => `agent-models: ${INLINE_ID} is switched on in ${SHOWN_SETTINGS} (you run the folder copy) — the old copy in ${SHOWN_OLD} stays and is not retired (said once)`,
  proof: reason => `agent-models: the old copy is not retired: ${reason} (said once)`,
  left: reason => `agent-models: the old copy ${SHOWN_OLD} stays: ${reason} — its ${PLUGIN_DIRS_KEY} entry and its record stay too (said once)`,
  wait: () => `agent-models: Claude Code has not installed the mod from ${MARKETPLACE} yet — run: claude plugin install ${PLUGIN_ID} (said once)`,
  shell: () => `agent-models: this session's ${PLUGIN_DIRS_KEY} still lists ${SHOWN_OLD}, which is removed — take it out of your shell profile (said once)`,
  changed: what => `${SHOWN_SETTINGS} changed while ${what}; nothing of ours was written to it — the next start tries again`,
  notRegistered: reason => `agent-models: marketplace NOT registered: ${reason}`,
  couldNotRun: code => `agent-models: the dew-flow-mods step could not run (${code})`,
  notRetired: reason => `agent-models: old copy NOT retired: ${reason}`,
  notRemoved: reason => `agent-models: old copy NOT removed: ${reason}`,
  deleteFailed: code => `the folder of the old copy, renamed aside, could not be deleted (${code}) — the next start tries again`,
});

/** The order of the lines of one start, and so of the action: the first kind present. */
const KIND_ORDER = ['registered', 'retired', 'removed', 'updated', 'told', 'refused'];

// ---------------------------------------------------------------------------------------------------------------------
// registration
// ---------------------------------------------------------------------------------------------------------------------

/** True when `source` has exactly the keys source, url and ref, with the anchor's values. */
function isAnchorSource(source) {
  return isObject(source) && Object.keys(source).sort().join() === 'ref,source,url' && Object.keys(ANCHOR).every(key => source[key] === ANCHOR[key]);
}

const isAnchorEntry = entry => isObject(entry) && isAnchorSource(entry.source);
const own = (object, key) => isObject(object) && Object.hasOwn(object, key);
const refuse = reason => ({ action: 'refuse', reason });

/** `settings` with the absent keys of the registration added; a key that exists keeps its place and members, a new top-level key goes last. */
function withRegistration(settings) {
  const next = structuredClone(settings);
  if (!Object.hasOwn(next, 'extraKnownMarketplaces')) next.extraKnownMarketplaces = {};
  if (!Object.hasOwn(next.extraKnownMarketplaces, MARKETPLACE)) next.extraKnownMarketplaces[MARKETPLACE] = anchorEntry();
  if (!Object.hasOwn(next, 'enabledPlugins')) next.enabledPlugins = {};
  if (!Object.hasOwn(next.enabledPlugins, PLUGIN_ID)) next.enabledPlugins[PLUGIN_ID] = true;
  return next;
}

/**
 * The registration decision over `parseSettings(bytes)`; the first match wins: `refuse` (unparsable, or a key we write into is
 * not an object), `off` (the person's switch), `conflict` (an entry that is not the anchor), `write` (a key is absent), `none`
 * (both present; `autoUpdateOff` when the entry's autoUpdate is not true).
 */
export function decideRegistration(parsed) {
  if (parsed.error) return refuse(`${SHOWN_SETTINGS} ${parsed.error}`);
  const { settings } = parsed;
  for (const key of ['env', 'extraKnownMarketplaces', 'enabledPlugins']) {
    if (Object.hasOwn(settings, key) && !isObject(settings[key])) return refuse(`${SHOWN_SETTINGS}: ${key} is not an object`);
  }
  const hasPlugin = own(settings.enabledPlugins, PLUGIN_ID);
  const hasMarket = own(settings.extraKnownMarketplaces, MARKETPLACE);
  if (hasPlugin && settings.enabledPlugins[PLUGIN_ID] !== true) return { action: 'off' };
  if (hasMarket && !isAnchorEntry(settings.extraKnownMarketplaces[MARKETPLACE])) {
    return { action: 'conflict', digest: digestOf(JSON.stringify(settings.extraKnownMarketplaces[MARKETPLACE])) };
  }
  if (!hasPlugin || !hasMarket) return { action: 'write', next: withRegistration(settings) };
  return settings.extraKnownMarketplaces[MARKETPLACE].autoUpdate === true ? { action: 'none' } : { action: 'none', autoUpdateOff: true };
}

// ---------------------------------------------------------------------------------------------------------------------
// the reads
// ---------------------------------------------------------------------------------------------------------------------

/** 'absent', 'dir', or 'bad' (a link, a file, anything else, or a path that cannot be looked at): the state of the `mods` folder. */
function modsKind(file) {
  try {
    const stat = lstatOrNull(file);
    if (stat === null) return 'absent';
    return stat.isDirectory() ? 'dir' : 'bad';
  } catch {
    return 'bad';
  }
}

/**
 * The tombstone's judge, given the marker's path: 'absent', 'ours' (a regular file by lstat, at most 4 KB, that parses to an object
 * with `tombstone: 'dew-flow-mods'`) or 'person' (everything else: empty, a folder, a link, other JSON, anything that cannot be read).
 */
export function readMarker(file) {
  try {
    const stat = lstatOrNull(file);
    if (stat === null) return 'absent';
    if (!stat.isFile() || stat.size > MAX_MARKER_BYTES) return 'person';
    const bytes = fs.readFileSync(file);
    if (bytes.length > MAX_MARKER_BYTES) return 'person';
    const value = JSON.parse(bytes.toString('utf8'));
    return isObject(value) && value.tombstone === MARKETPLACE ? 'ours' : 'person';
  } catch {
    return 'person';
  }
}

/** A small JSON object file: `{ missing }`, `{ say }` (why it cannot be used, naming the file) or `{ value }`. Never writes. */
function readRecord(file) {
  const name = path.basename(file);
  try {
    const stat = lstatOrNull(file);
    if (stat === null) return { missing: true };
    if (!stat.isFile()) return { say: `${name} is not a regular file` };
    if (stat.size > MAX_RECORD_BYTES) return { say: `${name} is larger than 1 MB` };
    const bytes = fs.readFileSync(file);
    if (bytes.length > MAX_RECORD_BYTES) return { say: `${name} is larger than 1 MB` };
    const value = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
    return isObject(value) ? { value } : { say: `${name} is not a JSON object` };
  } catch (e) {
    return e instanceof SyntaxError ? { say: `${name} does not parse` } : { say: `${name} could not be read (${codeOf(e)})` };
  }
}

const notYet = { whole: false };
const say = reason => ({ whole: false, say: reason });

/** The install records of the engine for our plugin: `{ record }`, or a not-yet / say answer. */
function readInstallRecord(p) {
  const file = readRecord(p.installed);
  if (file.missing) return notYet;
  if (file.say) return say(file.say);
  const name = path.basename(p.installed);
  if (file.value.version !== 2) return say(`${name} has a format this step does not know (version ${JSON.stringify(file.value.version)})`);
  if (!isObject(file.value.plugins)) return say(`${name} has a format this step does not know (plugins is not an object)`);
  if (!Object.hasOwn(file.value.plugins, PLUGIN_ID)) return notYet;
  const records = file.value.plugins[PLUGIN_ID];
  if (!Array.isArray(records) || !records.every(isObject)) return say(`${name} has a format this step does not know (the records of ${PLUGIN_ID})`);
  const users = records.filter(record => record.scope === 'user');
  if (users.length === 0) return notYet;
  if (users.length > 1) return say(`${name} holds ${users.length} user records of ${PLUGIN_ID}`);
  const [record] = users;
  if (typeof record.installPath !== 'string' || typeof record.version !== 'string') return say(`${name} has a record of ${PLUGIN_ID} with no installPath or version`);
  return { record };
}

/** Why `installPath` is not a folder of our cache; '' when it is one by its text. */
function installPathProblem(p, installPath) {
  if (!path.isAbsolute(installPath)) return `the recorded installPath is not an absolute path`;
  const relative = path.relative(p.cacheRoot, installPath);
  if (relative === '' || path.isAbsolute(relative) || relative.split(path.sep)[0] === '..') return `the recorded installPath is not inside the plugin cache of ${MARKETPLACE}`;
  return '';
}

/**
 * The whole proof that the engine installed the plugin, or why not. `{ whole: true, version, installPath }`; else
 * `{ whole: false }` (not yet, silent) or `{ whole: false, say }` (a shape or a fact that is wrong, said once). Both of the
 * engine's record files are read, never written. A gitCommitSha is never read.
 */
export function readProof(p, settings) {
  if (decideRegistration({ settings }).action !== 'none') return notYet;
  const known = readRecord(p.known);
  if (known.missing) return notYet;
  if (known.say) return say(known.say);
  if (!own(known.value, MARKETPLACE)) return notYet;
  if (!isAnchorEntry(known.value[MARKETPLACE])) return say(`${path.basename(p.known)} lists ${MARKETPLACE} with another url or ref than the trusted source`);
  const installed = readInstallRecord(p);
  if (installed.record === undefined) return installed;
  const { installPath, version } = installed.record;
  const problem = installPathProblem(p, installPath);
  if (problem) return say(`${path.basename(p.installed)}: ${problem}`);
  let stat;
  try {
    stat = lstatOrNull(installPath);
  } catch (e) {
    return say(`${installPath} could not be read (${codeOf(e)})`);
  }
  if (stat === null) return notYet;
  if (!stat.isDirectory()) return say(`the recorded installPath of ${PLUGIN_ID} is a link or not a folder`);
  try {
    if (lstatOrNull(path.join(installPath, '.orphaned_at')) !== null) return say(`the installed copy of ${PLUGIN_ID} has a .orphaned_at file`);
  } catch (e) {
    return say(`.orphaned_at could not be read (${codeOf(e)})`);
  }
  const manifest = readRecord(path.join(installPath, '.claude-plugin', 'plugin.json'));
  if (manifest.missing) return notYet;
  if (manifest.say) return say(manifest.say);
  if (manifest.value.name !== 'agent-models') return say(`plugin.json of the installed copy names ${JSON.stringify(manifest.value.name)}, not agent-models`);
  if (manifest.value.version !== version) return say(`plugin.json of the installed copy is version ${JSON.stringify(manifest.value.version)}, the record says ${version}`);
  return { whole: true, version, installPath };
}

const left = reason => ({ kind: 'left', reason });

/** The first thing in the old folder that is not a plain file or folder, or the count past the limit; '' when it is clean. */
function walkProblem(root) {
  let count = 0;
  const pending = [root];
  while (pending.length > 0) {
    const dir = pending.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      count += 1;
      if (count > MAX_FOLDER_ENTRIES) return `it holds more than ${MAX_FOLDER_ENTRIES} entries`;
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) return `it holds a link (${path.relative(root, full)})`;
      if (entry.isDirectory()) pending.push(full);
      else if (!entry.isFile()) return `it holds something that is neither a file nor a folder (${path.relative(root, full)})`;
    }
  }
  return '';
}

/** What the record vouches for: `{ kind: 'missing' }`, `{ kind: 'removable' }`, or `{ kind: 'left', reason }`. Reads only; the bytes of named files are hashed. */
export function readOldFolder(p, uid) {
  try {
    const stat = lstatOrNull(p.oldFolder);
    if (stat === null) return { kind: 'missing' };
    if (stat.isSymbolicLink()) return left('it is a link, and a link is never deleted through');
    if (!stat.isDirectory()) return left('it is not a folder');
    if (uid !== undefined && stat.uid !== uid) return left(`it belongs to another user (uid ${stat.uid})`);
    const record = readRecord(p.oldManifest);
    if (record.missing) return left('it has no install record (agent-models.installed.json)');
    if (record.say) return left(`its install record cannot be used: ${record.say}`);
    const sums = record.value.sha256;
    if (!isObject(sums) || Object.keys(sums).length === 0) return left('its install record names no file');
    for (const [relative, digest] of Object.entries(sums)) {
      const parts = relative.split(/[\\/]/);
      if (path.isAbsolute(relative) || parts.some(part => part === '' || part === '..')) return left(`its install record names ${JSON.stringify(relative)}, which is not a path inside the folder`);
      const file = lstatOrNull(path.join(p.oldFolder, relative));
      if (file === null) return left(`${relative}, named by its install record, is missing`);
      if (!file.isFile()) return left(`${relative}, named by its install record, is not a regular file`);
      if (typeof digest !== 'string' || sha256(fs.readFileSync(path.join(p.oldFolder, relative))) !== digest) return left(`${relative} was changed after it was installed`);
    }
    const problem = walkProblem(p.oldFolder);
    return problem ? left(problem) : { kind: 'removable' };
  } catch (e) {
    return left(`it could not be read (${codeOf(e)})`);
  }
}

const isFileAt = file => {
  try {
    return lstatOrNull(file)?.isFile() === true;
  } catch {
    return false;
  }
};

/** What an interrupted step 2 may have left: `retired-*` real folders of our uid, and a record and a reported file. */
function readLeftovers(p, uid) {
  const retired = [];
  try {
    for (const entry of fs.readdirSync(p.mods, { withFileTypes: true })) {
      if (!RETIRED_ASIDE.test(entry.name) || !entry.isDirectory()) continue;
      if (uid === undefined || lstatOrNull(path.join(p.mods, entry.name))?.uid === uid) retired.push(entry.name);
    }
  } catch {
    // no mods folder, or one that cannot be listed: nothing is left that we can name
  }
  return { retired, manifest: isFileAt(p.oldManifest), reported: isFileAt(p.oldReported) };
}

// ---------------------------------------------------------------------------------------------------------------------
// the retirement decisions
// ---------------------------------------------------------------------------------------------------------------------

/**
 * `stop` (nothing is touched), `step1` (what is still to write: the tombstone, the switch) or `retired` (step 1 is done: the
 * removal decides). `marker` is 'absent' | 'ours' | 'person'; `inline` is the value of enabledPlugins[INLINE_ID], undefined when absent.
 */
export function decideRetirement({ marker, registration, inline, proof }) {
  if (registration.action !== 'none' || proof.whole !== true || marker === 'person') return { action: 'stop' };
  if (inline !== undefined && inline !== false) return { action: 'stop', why: 'inline' };
  if (marker === 'ours' && inline === false) return { action: 'retired' };
  return { action: 'step1', tombstone: marker !== 'ours', inline: inline === undefined };
}

/**
 * What step 2 does. `retiredAt` and `now` are milliseconds (`retiredAt` null when absent or unreadable); `listed` says our entry is
 * in env.CLAUDE_CODE_PLUGIN_DIRS; `folder` is `readOldFolder`'s answer; `leftovers` is `{ retired, manifest, reported }`.
 */
export function decideRemoval({ retirement, retiredAt, now, listed, folder, leftovers }) {
  if (retirement.action !== 'retired') return { action: 'none' };
  if (!Number.isFinite(retiredAt) || retiredAt > now) return { action: 'stamp' };
  if (now - retiredAt < STEP2_DELAY_MS) return { action: 'wait' };
  if (folder.kind === 'left') return { action: 'left', reason: folder.reason };
  const removeFolder = folder.kind === 'removable';
  const sweep = leftovers.retired.length > 0 || leftovers.manifest || leftovers.reported;
  if (!listed && !removeFolder && !sweep) return { action: 'done' };
  return { action: 'remove', entry: listed, folder: removeFolder, sweep };
}

// ---------------------------------------------------------------------------------------------------------------------
// the state file
// ---------------------------------------------------------------------------------------------------------------------

const timeText = value => (typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : undefined);
const emptyState = () => ({ said: {} });

/** The state file, each field checked when read: anything that is not what it should be reads as absent. */
function readState(file) {
  try {
    const stat = lstatOrNull(file);
    if (stat === null || !stat.isFile() || stat.size > MAX_RECORD_BYTES) return emptyState();
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!isObject(value)) return emptyState();
    const said = isObject(value.said) ? Object.fromEntries(Object.entries(value.said).filter(([, at]) => typeof at === 'string')) : {};
    return { registeredAt: timeText(value.registeredAt), retiredAt: timeText(value.retiredAt), version: typeof value.version === 'string' ? value.version : undefined, said };
  } catch {
    return emptyState();
  }
}

const stateText = state => JSON.stringify({
  ...(state.registeredAt === undefined ? {} : { registeredAt: state.registeredAt }),
  ...(state.retiredAt === undefined ? {} : { retiredAt: state.retiredAt }),
  ...(state.version === undefined ? {} : { version: state.version }),
  ...(Object.keys(state.said).length === 0 ? {} : { said: state.said }),
});

// ---------------------------------------------------------------------------------------------------------------------
// the sequencing
// ---------------------------------------------------------------------------------------------------------------------

const expandHome = (entry, home) => (entry.startsWith('~/') || entry.startsWith('~\\') ? path.join(home, entry.slice(2)) : entry);
const isOurEntry = (entry, p, home) => entry !== '' && normalise(expandHome(entry, home)) === normalise(p.oldFolder);
const listsOldFolder = (value, p, home) => typeof value === 'string' && value.split(path.delimiter).some(entry => isOurEntry(entry, p, home));

/** The settings without our entry in env.CLAUDE_CODE_PLUGIN_DIRS: other entries verbatim and in order; the key goes when the value is empty; env stays. */
function withoutOurEntry(settings, p, home) {
  const next = structuredClone(settings);
  const kept = next.env[PLUGIN_DIRS_KEY].split(path.delimiter).filter(entry => !isOurEntry(entry, p, home));
  if (kept.join(path.delimiter) === '') delete next.env[PLUGIN_DIRS_KEY];
  else next.env[PLUGIN_DIRS_KEY] = kept.join(path.delimiter);
  return next;
}

/** Why the settings write must not start; null when it may. */
function blockedReason(original, target) {
  if (target.refusal) return target.reason;
  if (target.dangling) return `${SHOWN_SETTINGS} is a link to a file that does not exist`;
  const file = original === null ? '' : writableReason(target.file);
  if (file) return `${SHOWN_SETTINGS} ${file}`;
  // A fresh machine has no ~/.claude yet: the write makes it, so the nearest folder that exists must take the new one.
  let folder = path.dirname(target.file);
  while (!fs.existsSync(folder) && path.dirname(folder) !== folder) folder = path.dirname(folder);
  const reason = writableReason(folder);
  return reason ? `the folder of ${SHOWN_SETTINGS} ${reason}` : null;
}

/** The result of one start: the lines with their kinds, kept in the order of `KIND_ORDER`. */
class Outcome {
  constructor(state, when) {
    this.state = state;
    this.when = when;
    this.entries = [];
    this.live = new Set();
    this.version = undefined;
  }

  add(kind, line) { this.entries.push({ kind, line }); }

  /** A line said once per state entered: `key` stays live while the state holds, and the line is added only when the key is new. */
  tell(kind, key, line) {
    this.live.add(key);
    if (Object.hasOwn(this.state.said, key)) return;
    this.state.said[key] = this.when.toISOString();
    this.add(kind, line);
  }

  result() {
    const lines = KIND_ORDER.flatMap(kind => this.entries.filter(e => e.kind === kind).map(e => e.line));
    const action = KIND_ORDER.find(kind => this.entries.some(e => e.kind === kind)) ?? 'none';
    return { action, line: lines.join('\n'), lines };
  }
}

/** Runs one start. Throws on an unexpected error; `ensureModsMarketplace` turns that into a refusal. */
function run(options) {
  const { home, env, now, uid, beforeWrite, beforeMarker, beforeRename, remove, stopAfter, sessionSource } = options;
  const p = paths(home, env);
  const when = now();
  const nowMs = when.getTime();
  const mods = modsKind(p.mods);
  const marker = mods === 'dir' ? readMarker(p.optout) : 'absent';
  if (marker === 'person') return skipped();
  // A link (or anything that is not a folder): the step never writes a tombstone through it, so any file there is the person's opt-out.
  if (mods === 'bad' && fs.existsSync(p.optout)) return skipped();
  const out = new Outcome(mods === 'bad' ? emptyState() : readState(p.state), when);
  const before = stateText(out.state);

  /** Prune what is no longer live, store the state when it changed, and answer. A failed write is tolerated: a line then repeats. */
  const finish = () => {
    out.state.said = Object.fromEntries(Object.entries(out.state.said).filter(([key]) => out.live.has(key)));
    if (out.version !== undefined) {
      const stored = out.state.version;
      if (stored !== undefined && stored !== out.version && !out.entries.some(e => e.kind === 'retired')) out.add('updated', LINES.updated(stored, out.version));
      out.state.version = out.version;
    }
    if (mods !== 'bad' && stateText(out.state) !== before) {
      try {
        writeAtomic(p.state, `${stateText(out.state)}\n`, 0o644);
      } catch {
        // tolerated: a line repeats, a clock starts again
      }
    }
    return out.result();
  };
  const refused = line => out.tell('refused', `refused:${digestOf(line)}`, line);

  let original;
  let target;
  try {
    original = readOrNull(p.settings);
    target = settingsFileOf(p.settings);
  } catch (e) {
    refused(LINES.notRegistered(`${SHOWN_SETTINGS} could not be read (${codeOf(e)})`));
    return finish();
  }

  /** The one settings write of a start, through the one road. Returns the road's answer, or a refusal text. */
  const commit = next => {
    const reason = blockedReason(original, target);
    if (reason) return { refusal: reason };
    const prepare = () => { if (original !== null) backupOnce(target.file, original, fs.statSync(target.file).mode & 0o777); };
    return commitSettings({ settingsPath: p.settings, original, target, data: serialise(next), beforeWrite, prepare, replace: false });
  };

  const parsed = parseSettings(original);
  const registration = decideRegistration(parsed);
  if (registration.action === 'refuse') {
    refused(LINES.notRegistered(registration.reason));
    return finish();
  }
  if (registration.action === 'off') return finish();
  if (registration.action === 'conflict') {
    out.tell('told', `conflict:${registration.digest}`, LINES.conflict());
    return finish();
  }
  if (registration.action === 'write') {
    let done;
    try {
      done = commit(registration.next);
    } catch (e) {
      const why = isHardLinkFailure(e)
        ? `${SHOWN_SETTINGS} could not be created (${codeOf(e)}): this filesystem cannot make the hard link the creation needs`
        : `${SHOWN_SETTINGS} could not be written (${codeOf(e)})`;
      refused(LINES.notRegistered(why));
      return finish();
    }
    if (done.refusal) refused(LINES.notRegistered(done.refusal));
    else if (done.written) {
      out.state.registeredAt = when.toISOString();
      out.add('registered', LINES.registered());
    } else if (decideRegistration(parseSettings(done.now)).action !== 'none') refused(LINES.notRegistered(LINES.changed('registering')));
    return finish();
  }

  // The settings hold the registration: the retirement. `settings` here has `env`, `enabledPlugins` as objects or absent.
  const { settings } = parsed;
  if (registration.autoUpdateOff) out.tell('told', 'auto-update-off', LINES.autoUpdateOff());
  const inline = own(settings.enabledPlugins, INLINE_ID) ? settings.enabledPlugins[INLINE_ID] : undefined;
  const proof = readProof(p, settings);
  if (proof.say) out.tell('told', `proof:${digestOf(proof.say)}`, LINES.proof(proof.say));
  if (!proof.whole) {
    const registeredAt = Date.parse(out.state.registeredAt ?? '');
    if (!proof.say && Number.isFinite(registeredAt) && nowMs - registeredAt >= INSTALL_WAIT_MS) out.tell('told', 'wait', LINES.wait());
    return finish();
  }
  out.version = proof.version;
  const retirement = decideRetirement({ marker, registration, inline, proof });
  if (retirement.action === 'stop') {
    if (retirement.why === 'inline') out.tell('told', 'inline-true', LINES.inlineTrue());
    return finish();
  }
  if (mods === 'bad') {
    refused(LINES.notRetired(`${SHOWN_MODS} is a link or not a folder, so the tombstone cannot be written there`));
    return finish();
  }

  if (retirement.action === 'step1') {
    if (retirement.tombstone) {
      beforeMarker();
      try {
        writeAtomic(p.optout, tombstoneBytes(when), 0o644, { replace: false });
      } catch (e) {
        const why = isHardLinkFailure(e)
          ? `${SHOWN_OPTOUT} could not be created (${codeOf(e)}): this filesystem cannot make the hard link the creation needs`
          : `${SHOWN_OPTOUT} could not be written (${codeOf(e)})`;
        refused(LINES.notRetired(why));
        return finish();
      }
      if (readMarker(p.optout) !== 'ours') return skipped();
      if (stopAfter === 'tombstone') return { action: 'none', line: '', lines: [] };
    }
    if (retirement.inline) {
      const next = structuredClone(settings);
      next.enabledPlugins[INLINE_ID] = false;
      let done;
      try {
        done = commit(next);
      } catch (e) {
        refused(LINES.notRetired(`${SHOWN_SETTINGS} could not be written (${codeOf(e)})`));
        return finish();
      }
      if (done.refusal) {
        refused(LINES.notRetired(done.refusal));
        return finish();
      }
      if (!done.written) {
        const again = parseSettings(done.now);
        const settled = decideRegistration(again).action === 'none' && again.settings.enabledPlugins?.[INLINE_ID] === false;
        if (!settled) refused(LINES.notRetired(LINES.changed('retiring')));
        return finish();
      }
      if (stopAfter === 'inline') return { action: 'none', line: '', lines: [] };
    }
    out.state.retiredAt = when.toISOString();
    let hadFolder = false;
    try {
      hadFolder = lstatOrNull(p.oldFolder) !== null;
    } catch {
      hadFolder = false;
    }
    out.add('retired', LINES.retired(proof.version, hadFolder));
    return finish();
  }

  // S3 / S4 / S5: step 1 is done.
  const envValue = settings.env?.[PLUGIN_DIRS_KEY];
  let folder = readOldFolder(p, uid());
  if (folder.kind === 'removable' && envValue !== undefined && typeof envValue !== 'string') folder = left(`${PLUGIN_DIRS_KEY} in ${SHOWN_SETTINGS} is not a string`);
  const decision = decideRemoval({
    retirement, retiredAt: Date.parse(out.state.retiredAt ?? ''), now: nowMs, listed: listsOldFolder(envValue, p, home), folder, leftovers: readLeftovers(p, uid()),
  });
  if (decision.action === 'stamp') out.state.retiredAt = when.toISOString();
  else if (decision.action === 'left') out.tell('told', `left:${digestOf(decision.reason)}`, LINES.left(decision.reason));
  else if (decision.action === 'done') {
    // Only at a start: a resumed, cleared or compacted session can run on a process env from before step 2, and then the line may be false.
    if (sessionSource === 'startup' && listsOldFolder(env?.[PLUGIN_DIRS_KEY], p, home)) out.tell('told', 'shell', LINES.shell());
  } else if (decision.action === 'remove') {
    const result = removeOldCopy({ p, home, settings, decision, commit, beforeRename, remove, stopAfter, when, uid: uid() });
    if (result.stopped) return { action: 'none', line: '', lines: [] };
    // "Removed" names the old copy: it is not said next to a refusal that says part of it is still there.
    if (result.removed && !result.refusal) out.add('removed', LINES.removed());
    if (result.refusal) refused(LINES.notRemoved(result.refusal));
  }
  return finish();
}

/** Step 2: our entry leaves the variable, the old folder goes by a rename and a delete, then its record and reported file, and what a killed run left. */
function removeOldCopy({ p, home, settings, decision, commit, beforeRename, remove, stopAfter, when, uid }) {
  let removed = false;
  let deleteFailure;
  /** The delete of a folder renamed aside; a failure (a kill, a busy file) is kept to be said, and the sweep of the next start retries. */
  const tryRemove = target => {
    try {
      remove(target);
      return true;
    } catch (e) {
      deleteFailure ??= codeOf(e);
      return false;
    }
  };
  try {
    if (decision.entry) {
      const done = commit(withoutOurEntry(settings, p, home));
      if (done.refusal) return { refusal: done.refusal };
      if (!done.written) {
        const again = parseSettings(done.now);
        const settled = decideRegistration(again).action === 'none' && !listsOldFolder(again.settings.env?.[PLUGIN_DIRS_KEY], p, home);
        return settled ? { removed } : { refusal: LINES.changed('removing') };
      }
      removed = true;
      if (stopAfter === 'variable') return { stopped: true };
    }
    if (decision.folder) {
      const aside = path.join(p.mods, `${RETIRED_TAG}${when.getTime()}-${process.pid}`);
      beforeRename();
      let renamed = true;
      try {
        fs.renameSync(p.oldFolder, aside);
      } catch (e) {
        // Two starts at once: the other one took the folder already, and it says what it did; nothing is said here for it.
        if (e?.code !== 'ENOENT') throw e;
        renamed = false;
      }
      if (renamed) {
        if (stopAfter === 'rename') return { stopped: true };
        if (tryRemove(aside)) removed = true;
        if (stopAfter === 'folder') return { stopped: true };
      }
    }
    if (decision.sweep) {
      for (const entry of readLeftovers(p, uid).retired) {
        if (tryRemove(path.join(p.mods, entry))) removed = true;
      }
      for (const file of [p.oldManifest, p.oldReported]) {
        if (!isFileAt(file)) continue;
        try {
          fs.rmSync(file);
          removed = true;
        } catch (e) {
          if (e?.code !== 'ENOENT') throw e; // two starts at once: the other one removed it
        }
      }
    }
  } catch (e) {
    return { refusal: `a file could not be removed (${codeOf(e)})`, removed };
  }
  return deleteFailure === undefined ? { removed } : { refusal: LINES.deleteFailed(deleteFailure), removed };
}

/**
 * One start of the step; never throws. `home` and `env` are the caller's; the other options are test seams: `now` (a Date), `uid`,
 * `beforeWrite` (called before each settings write, as the road's seam), `beforeMarker` (before the tombstone is created), `beforeRename` (before the old folder is renamed aside), `remove`
 * (the delete of the folder renamed aside) and `stopAfter` (`'tombstone' | 'inline' | 'variable' | 'rename' | 'folder'`: the function
 * returns `none` right after that sub-step and writes nothing more, the disk state of a process killed there). `sessionSource` is the
 * SessionStart payload's `source`: the shell line is said only when it is `startup`.
 * Answers `{ action, line, lines }`; the action is the first of registered, retired, removed, updated, told, refused, else none or skipped.
 */
export function ensureModsMarketplace({
  home, env = {}, now = () => new Date(), uid = () => process.getuid?.(), beforeWrite = () => {}, beforeMarker = () => {}, beforeRename = () => {},
  remove = target => fs.rmSync(target, { recursive: true, force: false }), stopAfter, sessionSource,
} = {}) {
  try {
    return run({ home, env, now, uid, beforeWrite, beforeMarker, beforeRename, remove, stopAfter, sessionSource });
  } catch (e) {
    const line = LINES.couldNotRun(codeOf(e));
    return { action: 'refused', line, lines: [line] };
  }
}
