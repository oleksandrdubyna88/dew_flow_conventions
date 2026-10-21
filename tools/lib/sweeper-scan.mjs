// The sweeper classifier of `common/test-leftovers.md` §7 (class `owner-blind`) and of the barrier: "is this line a
// pattern that sweeps the prefix, and does it say WHOSE leftovers it means?"
//
// ONE implementation. The structural guard (`tools/leftovers-check.mjs`), the machine scan (`tools/sweeper-scan.mjs`) and
// the rule-text checks all read lines through `classifyLine`; a second copy of these shapes is how one reader comes to
// call a line safe that another calls a sweep.
//
// What a verdict means.
//   'broad'        a sweep pattern that matches the prefix and no owner segment (or a bare `u` / `w`, which reaches every
//                  owner): on a machine several OS users share it deletes another user's live resources.
//   'owner-aware'  a sweep pattern whose owner segment starts right after the prefix's separator: a literal owner, a
//                  variable, a placeholder, or an owner grammar.
//   null           not a sweep pattern: a name, a sentence, a folder merely named like the prefix, or a literal first
//                  segment that no owner can start with (`conventions`, `wt`) — such a pattern reaches only LEGACY names,
//                  which the guard's `legacy-name` class and the janitor's `legacy:` lines already own.
//
// A line carrying `not-a-sweeper` is honoured ONLY when the caller asks (`honourMarker`): the corporate sibling's tools use
// it on their own detector lines and the scan reads those files during the transition. The guard never asks — in this
// repository no comment clears an owner-blind line (rule §7); the one pass is a hash-keyed allowlist.

import { createHash } from "node:crypto";

export const NOT_A_SWEEPER = "not-a-sweeper";

// What follows the prefix: its separator, then (for an owner-aware pattern) an owner segment. Both are matched on the
// lower-cased line, so a `U\d` or `[-_]` is read however the author cased it.
const SEPARATOR = String.raw`(?:\[[-_]{2}\]|\((?:\?:)?(?:\[[-_]{2}\]|[-_]\|[-_])\)|[-_])`;
const SEPARATOR_RE = new RegExp(`^${SEPARATOR}`);
const OWNER_START_RE = /^(?:\(\?:|\()?(?:[uw](?:\\{1,4}d|\d|\[0-9\]|\$|\{)|[uw]\|[uw]\)|\[uw\]|\$|\{|<[^<>]*owner)/;
// A literal name after the separator (`wt-…`, `conventions-…`) matches only names that start with it, and no name of the
// owner form starts with a letter-continued `u` or `w`: such a pattern cannot reach another user's leftovers, so it is
// narrow and not a sweep. A bare `u` or `w` (`u.*`, `w`) is not literal: it reaches every owner.
const NARROW_RE = /^(?![uw](?![a-z0-9]))[a-z0-9]/;
const ANCHORED_RE = /(\^(?:\(\?:|\()?|\\?\/)teststodelete/g; // a regex anchor, or a path anchor
// A leading star is a glob only when it is not a regex quantifier (`\s*`, `)*`) that happens to sit before the prefix.
const GLOB_RE = /(?<![\w\])}])(\*)?teststodelete(?:(?:[-_]|\[[-_]{1,2}\])?\*)?/g;
// A docker name filter is a SUBSTRING match unless it is anchored with `^`; the anchored ones are read above.
const FILTER_RE = /(?:--filter(?:\s+|=)|-f\s+)["']?name=["']?(?!\^)teststodelete/g;
// A prefix test written as a method call: `startsWith("<prefix>-")`.
const STARTS_WITH_RE = /startswith\(\s*["'`]teststodelete(?=[-_])/g;

/** What the text after the prefix says: an owner segment, a narrow literal name, or (anything else) every owner. */
function verdictAfter(rest) {
  const separator = SEPARATOR_RE.exec(rest);
  if (separator === null) return "broad";
  const after = rest.slice(separator[0].length);
  if (OWNER_START_RE.test(after)) return "owner-aware";
  return NARROW_RE.test(after) ? null : "broad";
}

/** The verdict of every occurrence of the prefix in the (lower-cased) line that is a pattern shape; a narrow literal name has none. */
function occurrenceVerdicts(lower) {
  const verdicts = [];
  for (const match of lower.matchAll(ANCHORED_RE)) {
    const rest = lower.slice(match.index + match[0].length);
    const isPathAnchor = !match[1].startsWith("^");
    if (isPathAnchor && !/^[-_[]/.test(rest)) continue; // a folder simply named like the prefix is not a prefix match
    verdicts.push(verdictAfter(rest));
  }
  for (const match of lower.matchAll(GLOB_RE)) {
    const isGlob = match[0].endsWith("*") || match[1] === "*"; // the prefix and a separator and a star, or a leading star
    if (isGlob) verdicts.push("broad");
  }
  for (const match of lower.matchAll(FILTER_RE)) verdicts.push(verdictAfter(lower.slice(match.index + match[0].length)));
  for (const match of lower.matchAll(STARTS_WITH_RE)) {
    verdicts.push(verdictAfter(lower.slice(match.index + match[0].length)));
  }
  return verdicts;
}

/**
 * `'broad' | 'owner-aware' | null` (pure). A line is a sweep pattern when it holds, case-insensitively, the prefix in one of
 * these shapes: a regex anchor, a path anchor (followed by `-`, `_` or a character class), a glob, a docker name filter
 * that is not anchored, or a `startsWith` call. It is owner-aware when an owner segment starts right after the prefix's
 * separator, else broad; a line with both is broad.
 */
export function classifyLine(text, { honourMarker = false } = {}) {
  const lower = String(text).toLowerCase();
  if (honourMarker && lower.includes(NOT_A_SWEEPER)) return null;
  const verdicts = occurrenceVerdicts(lower);
  if (verdicts.includes("broad")) return "broad";
  return verdicts.includes("owner-aware") ? "owner-aware" : null;
}

/** The lines of a text that `classifyLine` calls broad, as 1-based numbers. */
export function broadLines(text, options) {
  return String(text).split(/\r?\n/).flatMap((line, index) => (classifyLine(line, options) === "broad" ? [index + 1] : []));
}

/** The hash an allowlist entry pins a line by: sha256 of the line's text, line end excluded, as lower-case hex. */
export function lineSha256(line) {
  return createHash("sha256").update(String(line).replace(/\r?\n$/, ""), "utf8").digest("hex");
}
