/**
 * The exemptions of the structural guard (`tools/leftovers-check.mjs`, `common/test-leftovers-detail.md` §7, and for the kind `container-scoped`
 * `common/test-leftovers-exemptions.md`): the reader of the `testsToDelete-exempt:` comments, what makes one valid, the `shared-store` table that
 * both the finding and the container-teardown reading come from, and the reach of a marker. Moved out of the guard so it stays under the file-size
 * limit of the coding style; the guard re-exports the names it exported before.
 *
 * The owner of a `container-scoped` marker is read by ONE pattern (`NAMED_OWNER`) that the C# template (`LeftoversGuardExemptions.cs`, `NamedOwner`)
 * spells the same way. What is emulated of .NET: `\s` is `[\f\n\r\t\v\x85\p{Z}]`, and `\b` is an edge of `[\p{L}\p{Mn}\p{Nd}\p{Pc}]` plus the zero-width
 * non-joiner and joiner (U+200C, U+200D), which .NET counts as word characters. Letters are matched in ASCII case by explicit classes and the pattern has no
 * `i` flag, so no Unicode case folding applies (JavaScript's `/iu` folds U+017F to `s`, .NET does not). What is NOT emulated: any other difference
 * between the two engines' Unicode tables (a code point one engine classifies and the other does not), and a Unicode digit or letter outside the
 * classes written here.
 */
import { PREFIX_OK, finding } from "./leftovers-shell.mjs";
import { isReason } from "../ownership-check.mjs";

/** Every class an exemption may name (`ryuk-off` never; `exemption` and `token` are not resources). */
export const EXEMPTIBLE = Object.freeze(["raw-temp", "raw-worktree", "docker-run", "docker-name", "legacy-name", "shared-store"]);

/**
 * The kinds of marker that are DECLARATIONS, not classes of finding (`common/test-leftovers-exemptions.md`, extending §6 (b)): `container-scoped` says that a database or namespace lives and dies with the container
 * its fixture or job owns. It is kept apart from `EXEMPTIBLE` so that list keeps its meaning — the finding classes an exemption may name. The kind clears one class,
 * `shared-store`, and only a hit that is the container's own teardown (`CONTAINER_TEARDOWN`); it needs an owner in its reason, not a `lock:`.
 */
export const DECLARATION_KINDS = Object.freeze(["container-scoped"]);

const MARKER = /(?:\/\/|#|--|\/\*|\*|<!--)\s*testsToDelete-exempt:(.*)$/;

/** Parse every `testsToDelete-exempt:` comment: `{ valid: Map<class, Set<line>>, findings }`. */
export function readExemptions(file, lines) {
  const valid = new Map([...EXEMPTIBLE, ...DECLARATION_KINDS].map((cls) => [cls, new Set()]));
  const findings = [];
  lines.forEach((line, index) => {
    const marker = MARKER.exec(line);
    if (marker === null) return;
    const problem = exemptionProblem(marker[1]);
    if (problem.cls === undefined) findings.push(finding(file, index + 1, "exemption", problem.text));
    else valid.get(problem.cls).add(index + 1);
  });
  return { valid, findings };
}

export const OWNER_SENTENCE =
  "the exemption of `container-scoped` must name what it lives and dies with: `lives and dies with` or `live and die with`, then an optional article and an owner of two characters or more that is not an article and does not start with an article followed by punctuation (`the PostgresFixture container`, not `the-fixture`)";

/** `{ cls }` when the text after the marker is a valid exemption, else `{ text }` saying why not. */
export function exemptionProblem(rest) {
  const parsed = /^\s*([^\s—]*)\s*(?:—\s*(.*?))?\s*(?:\*\/|-->)?\s*$/.exec(rest);
  const cls = parsed?.[1] ?? "";
  const reason = parsed?.[2] ?? "";
  if (cls === "") return { text: "an exemption names no class" };
  if (cls === "ryuk-off") return { text: "`ryuk-off` accepts no exemption" };
  if (cls === "owner-blind") return { text: "`owner-blind` accepts no exemption: the allowlist (file, line, hash) is the only pass" };
  if (!EXEMPTIBLE.includes(cls) && !DECLARATION_KINDS.includes(cls)) return { text: `an exemption names an unknown class \`${cls}\`` };
  if (!isReason(reason)) return { text: `the exemption of \`${cls}\` carries no reason (ten characters, three words, not a placeholder)` };
  if (cls === "shared-store" && !reason.includes("lock:")) return { text: "the exemption of `shared-store` must name its lock (`lock: …`)" };
  if (cls === "container-scoped" && !namesOwner(reason)) return { text: OWNER_SENTENCE };
  return { cls };
}

// The owner of a `container-scoped` marker: the spelling at a word edge, whitespace, an optional article and whitespace, then a word whose first character is a letter, a digit or `_` and that has one or more
// of those or `.` or `-` after it, and that does not start with an article followed by a word edge (`a.`, `the-x`, `a.b` name no owner; `x.`, `_x`, `its_x` do).
const SPACE = String.raw`[\f\n\r\t\v\x85\p{Z}]`;
const WORD_CHAR = String.raw`[\p{L}\p{Mn}\p{Nd}\p{Pc}‌‍]`;
/** `word` with every ASCII letter as a class of its two cases: the pattern has no `i` flag. */
const anyCase = (word) => [...word].map((char) => (/[a-z]/.test(char) ? `[${char}${char.toUpperCase()}]` : char)).join("");
const ARTICLE = `(?:${["the", "a", "an", "its", "this", "that"].map(anyCase).join("|")})`;
const between = (...words) => words.map(anyCase).join(`${SPACE}+`);
export const NAMED_OWNER = new RegExp(
  `(?<!${WORD_CHAR})(?:${between("lives", "and", "dies")}|${between("live", "and", "die")})${SPACE}+${anyCase("with")}${SPACE}+(?:${ARTICLE}${SPACE}+)?(?!${ARTICLE}(?!${WORD_CHAR}))[\\p{L}\\p{N}_][\\p{L}\\p{N}_.-]+`,
  "u",
);

/** Whether a `container-scoped` reason names its owner: after `lives and dies with` or `live and die with`, an optional article and then an owner of two characters or more that is no article (and does not start with one before punctuation). */
export const namesOwner = (reason) => NAMED_OWNER.test(reason);

/** Whether the marker of `cls` (a class or a kind) reaches `line`: its own line or the line above. */
export const isExempt = (exemptions, cls, line) => exemptions.valid.get(cls)?.has(line) === true || exemptions.valid.get(cls)?.has(line - 1) === true;

// --- the shared-store table ----------------------------------------------------------------------------------

export const SHARED_STORE = [
  { pattern: /\bDROP\s+(?:DATABASE|SCHEMA|TABLE)\s+(?:IF\s+EXISTS\s+)?(["'`]?[\w.$-]*)/, named: true },
  { pattern: /\bTRUNCATE\s+(?:TABLE\s+)?(["'`]?[\w.$-]*)/, named: true },
  { pattern: /\bFLUSH(?:ALL|DB)\b/, named: false },
  { pattern: /deleteMany\(\s*\{\s*\}\s*\)/, named: false },
];

const isOwnName = ({ named }, match) => named && PREFIX_OK.test(match[1].replace(/^["'`]/, ""));

/** The first hit of the first pattern that hits an unprefixed name — the finding's text, as it has always been. */
export function sharedStoreHit(line) {
  for (const entry of SHARED_STORE) {
    const match = entry.pattern.exec(line);
    if (match !== null && !isOwnName(entry, match)) return [match[0].trim()];
  }
  return [];
}

/** A copy of `pattern` that is global and keeps every flag it had. */
export const globalCopy = (pattern) => new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);

/** Every hit of every pattern of the table on the line (an owner-form name is no hit), in the table's order and then the line's. */
export const sharedStoreMatches = (line) =>
  SHARED_STORE.flatMap((entry) => [...line.matchAll(globalCopy(entry.pattern))].filter((match) => !isOwnName(entry, match)).map((match) => match[0].trim()));

/** The hits that are a container's own teardown: a whole database or schema dropped, or one Redis database flushed. `DROP TABLE`, `TRUNCATE`, `FLUSHALL` and delete-all are resets, not teardowns. */
const CONTAINER_TEARDOWN = /^(?:DROP\s+(?:DATABASE|SCHEMA)\b|FLUSHDB$)/;

/** The `shared-store` hits of the line that are NOT a container teardown. Under a valid `container-scoped` marker these are the findings; empty means the line is cleared. */
export const nonTeardownHits = (line) => sharedStoreMatches(line).filter((hit) => !CONTAINER_TEARDOWN.test(hit));

/** Whether EVERY `shared-store` hit of the line is a container teardown (and there is at least one): a teardown beside a reset on one line clears nothing. */
export const isContainerTeardown = (line) => sharedStoreMatches(line).length > 0 && nonTeardownHits(line).length === 0;
