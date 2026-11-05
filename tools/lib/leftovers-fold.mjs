// The folding reader of the structural guard (`tools/leftovers-check.mjs`, F30): a SPELLING reader of one line, as the C# template's
// `GuardLiterals`. It reads the string literals of a line the way the language does, so the prefix cannot be hidden from the classes
// `legacy-name` and `owner-blind` by how it is spelled:
//
//   JavaScript / TypeScript   '…', "…", `…`; joined over `+`, `.concat(…)`, `[…].join(<literal>)` and `${'…'}` holes that hold only a
//                             literal; `\uXXXX`, `\u{…}`, `\xXX` and the plain escapes decoded; a one-character class `[T]` read as `T`.
//   shell (and workflow lines) '…', "…", $'…'; adjacent quoted strings with no space between them are one string; in $'…' `\xXX`, `\uXXXX`
//                             and the plain escapes are decoded.
//   PowerShell                '…', "…"; joined over `+` and over `-join <literal>` of a literal array. No decoding.
//
// Not data flow. A name built from a variable, across lines, from the environment or at run time is not seen, and a template hole that
// holds anything but a literal stays as it is (`${LEGACY_WORD}x` is no word): folding never invents one. A regex that spells a
// character with a regex escape (`\\u0054` in a string) is not decoded a second time either.
//
// The module holds the pure reading: `foldLine`, and the two literal-level readings the folded line feeds — `bareWordHits` and
// `pieceHits`. The classes themselves (`legacyNameHits`, `classifyLine`) stay in the guard; it runs them over `foldLine(...).text`.

const OPEN = "\u0001";
const CLOSE = "\u0002";
const WORD = "teststo" + "delete"; // the prefix, in two pieces: this module is a detector and the machine scan reads it too

/** The extensions whose lines are read, and the kind of reading each gets. A workflow reads as shell, for the lines that hold a quote. */
const KIND_BY_EXTENSION = Object.freeze({
  ".mjs": "js", ".cjs": "js", ".js": "js", ".ts": "js", ".mts": "js", ".cts": "js", ".tsx": "js", ".jsx": "js",
  ".sh": "sh", ".yml": "sh", ".yaml": "sh",
  ".ps1": "ps1",
});

/** `'js' | 'sh' | 'ps1' | undefined` for a file extension (with its dot). */
export const foldKind = (extension) => KIND_BY_EXTENSION[extension];

const mark = (quote, body) => `${OPEN}${quote}${body.replaceAll(OPEN, "\uFFFD").replaceAll(CLOSE, "\uFFFD")}${CLOSE}`;
const MARKED = `${OPEN}(.)([^${CLOSE}]*)${CLOSE}`;
const MARKED_RE = new RegExp(MARKED, "g");
const rx = (source, flags = "g") => new RegExp(source, flags);

const SIMPLE_ESCAPES = Object.freeze({ n: "\n", r: "\r", t: "\t", 0: "\0", b: "\b", f: "\f", v: "\v", a: "\u0007" });
const fromCode = (code) => (Number.isInteger(code) && code >= 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "\uFFFD");
const SIMPLE = (letter) => SIMPLE_ESCAPES[letter] ?? letter;

// --- JavaScript -------------------------------------------------------------------------------------------------------------

const JS_LITERAL = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
// one escape, or a `${'…'}` hole that holds only a literal (its content is decoded in turn)
const JS_ESCAPE = /\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})|\\([\s\S])|\$\{\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*\}/g;
const SINGLE_CLASS = /\[([^\]\\^-])\]/g;

function decodeJs(body, template) {
  const decoded = body.replace(JS_ESCAPE, (all, braced, unicode, hex, plain, holeSingle, holeDouble) => {
    if (braced !== undefined) return fromCode(Number.parseInt(braced, 16));
    if (unicode !== undefined) return fromCode(Number.parseInt(unicode, 16));
    if (hex !== undefined) return fromCode(Number.parseInt(hex, 16));
    if (plain !== undefined) return SIMPLE(plain);
    const hole = holeSingle ?? holeDouble;
    return template && hole !== undefined ? decodeJs(hole, false) : all;
  });
  return decoded.replace(SINGLE_CLASS, "$1");
}

const MARK_ANY = `${OPEN}.[^${CLOSE}]*${CLOSE}`;
const JS_PLUS = rx(`${CLOSE}\\s*\\+\\s*${OPEN}.`);
// `.concat(` with literals first: the leading literal arguments join the receiver; any other argument stays, as `.concat(<rest>)`
const JS_CONCAT = rx(`${CLOSE}\\s*\\.concat\\(\\s*((?:${MARK_ANY}\\s*,\\s*)*${MARK_ANY})\\s*(\\)|,\\s*(?=[^)\\s]))`);
const JS_JOIN = rx(`\\[\\s*((?:${MARK_ANY}\\s*,\\s*)*${MARK_ANY})\\s*,?\\s*\\]\\s*\\.join\\(\\s*${MARKED}\\s*\\)`);

/** Marked text with every join applied, until none applies: `[…].join(<literal>)`, `.concat(…)`, `+`. */
function joinJs(marked) {
  let text = marked;
  for (let round = 0; round < 8; round += 1) {
    const next = text
      .replace(JS_JOIN, (_all, items, _quote, separator) => {
        const parts = [...items.matchAll(MARKED_RE)];
        return mark(parts[0][1], parts.map((part) => part[2]).join(separator));
      })
      .replace(JS_CONCAT, (_all, items, end) => [...items.matchAll(MARKED_RE)].map((part) => part[2]).join("") + CLOSE + (end === ")" ? "" : ".concat(")) // the match starts at the CLOSE of the receiver: its body stays before it
      .replace(JS_PLUS, "");
    if (next === text) return next;
    text = next;
  }
  return text;
}

function foldJs(line) {
  const marked = line.replace(JS_LITERAL, (_all, single, double, template) => {
    if (single !== undefined) return mark("'", decodeJs(single, false));
    if (double !== undefined) return mark('"', decodeJs(double, false));
    return mark("`", decodeJs(template, true));
  });
  return joinJs(marked);
}

// --- shell ------------------------------------------------------------------------------------------------------------------

const SH_LITERAL = /\$'((?:[^'\\]|\\.)*)'|'([^']*)'|"((?:[^"\\]|\\.)*)"/g;
const ANSI_ESCAPE = /\\u([0-9a-fA-F]{1,4})|\\U([0-9a-fA-F]{1,8})|\\x([0-9a-fA-F]{1,2})|\\([0-7]{1,3})|\\([\s\S])/g;

const decodeAnsi = (body) => body.replace(ANSI_ESCAPE, (_all, u4, u8, hex, octal, plain) => {
  if (u4 !== undefined) return fromCode(Number.parseInt(u4, 16));
  if (u8 !== undefined) return fromCode(Number.parseInt(u8, 16));
  if (hex !== undefined) return fromCode(Number.parseInt(hex, 16));
  if (octal !== undefined) return fromCode(Number.parseInt(octal, 8));
  return SIMPLE(plain);
});

const SH_ADJACENT = rx(`${CLOSE}${OPEN}.`); // two quoted strings with no space between them are one word

function foldSh(line) {
  const marked = line.replace(SH_LITERAL, (_all, ansi, single, double) => {
    if (ansi !== undefined) return mark("'", decodeAnsi(ansi));
    if (single !== undefined) return mark("'", single);
    return mark('"', double.replace(/\\([$`"\\])/g, "$1"));
  });
  return marked.replace(SH_ADJACENT, "");
}

// --- PowerShell -------------------------------------------------------------------------------------------------------------

const PS_LITERAL = /'((?:[^']|'')*)'|"((?:[^"`]|`[\s\S]|"")*)"/g;
const PS_PLUS = rx(`${CLOSE}\\s*\\+\\s*${OPEN}.`);
const PS_JOIN = rx(`\\(?\\s*((?:${MARK_ANY}\\s*,\\s*)+${MARK_ANY})\\s*\\)?\\s*-join\\s*${MARKED}`, "gi");

function foldPs(line) {
  const marked = line.replace(PS_LITERAL, (_all, single, double) => (single !== undefined ? mark("'", single.replaceAll("''", "'")) : mark('"', double.replaceAll('""', '"'))));
  const joined = marked.replace(PS_JOIN, (_all, items, _quote, separator) => {
    const parts = [...items.matchAll(MARKED_RE)];
    return mark(parts[0][1], parts.map((part) => part[2]).join(separator));
  });
  return joined.replace(PS_PLUS, "").replace(PS_PLUS, "");
}

// --- the line ---------------------------------------------------------------------------------------------------------------

const FOLDERS = { js: foldJs, sh: foldSh, ps1: foldPs };

/**
 * `{ text, literals }` (pure). `text` is the line with every string literal decoded and joined, each written back in its own quotes;
 * `literals` are the contents of those joined literals, in order. A line with no quote, or a file kind that is not read, comes back
 * unchanged with no literals.
 */
export function foldLine(line, extension) {
  const kind = foldKind(extension);
  if (kind === undefined || !/['"`]/.test(line) || line.includes(OPEN) || line.includes(CLOSE)) return { text: line, literals: [] };
  const marked = FOLDERS[kind](line);
  const literals = [...marked.matchAll(MARKED_RE)].map((match) => match[2]);
  return { text: marked.replace(MARKED_RE, "$1$2$1"), literals };
}

// --- what the folded literals say -------------------------------------------------------------------------------------------

const WORD_ANYWHERE = rx(WORD, "gi");
/** What may follow the word without being a sweep: an owner segment between separators (a regex writes one as `[-_]`), the exempt marker word, the quarantine sibling's word. */
const ALLOWED_AFTER_WORD = /^(?:[-_]|\[-_\])(?:[uw][0-9]{1,10}(?:[-_]|\[-_\])|(?:exempt|quarantine)(?![a-z0-9]))/i;
/** The owner placed by a variable or a placeholder right after the separator (`-${owner}-`, `-$OWNER-`, `-<owner>-`): the classifier's own `owner-aware` shapes. */
const PLACED_OWNER = /^(?:[-_]|\[-_\])(?:\$|\{|<[^<>]*owner)/i;
/** The owner label key (`testsToDelete.owner`): a docker label's name, not a name and not a pattern — the classifier skips it too. */
const LABEL_KEY = /^\.owner(?![a-z0-9])/i;
/** A second segment that is a name: a legacy name, which the class `legacy-name` reads (or the owner form's own `u1000`, allowed above). */
const SECOND_SEGMENT = /^(?:[-_])[a-z0-9]/i;
const ENVIRONMENT_USE = new RegExp(`^${WORD.toUpperCase()}_[A-Z]+(?![A-Za-z0-9])`);

/**
 * The word, whole, in a literal and followed by neither an owner segment, nor a marker word, nor an environment variable's tail, nor a
 * second segment that is a name (the class `legacy-name` judges that one): `testsToDelete`, `testsToDelete-`, `testsToDelete-*`,
 * `testsToDelete[-_]`. The C# template's `BareWordHits`, so the unanchored regex string and the bare word are seen with no removal on the line.
 */
export function bareWordHits(literals) {
  return literals.flatMap((literal) => [...literal.matchAll(WORD_ANYWHERE)].flatMap((word) => {
    const rest = literal.slice(word.index + word[0].length);
    const allowed = ALLOWED_AFTER_WORD.test(rest) || LABEL_KEY.test(rest) || PLACED_OWNER.test(rest) || SECOND_SEGMENT.test(rest) || ENVIRONMENT_USE.test(literal.slice(word.index));
    return allowed ? [] : [`${word[0]}${rest.slice(0, 3)}`];
  }));
}

/** The shortest piece of the word a literal may hold. The measure of 2026-11-05 (`todo/PLAN_F30_folding_reader.md`): 5 hits product words, `sto` hits 2386 literals in one tree. */
export const MINIMUM_PIECE = 6;
const TESTS_END = 5; // `tests`
const DELETE_START = 7; // `delete`
/** Every substring of the word that crosses the join of its two halves (not wholly inside `tests`, not wholly inside `delete`) and has at least `MINIMUM_PIECE` characters, longest first. */
const PIECES = (() => {
  const pieces = [];
  for (let length = WORD.length; length >= MINIMUM_PIECE; length -= 1) {
    for (let at = 0; at + length <= WORD.length; at += 1) if (at + length > TESTS_END && at < DELETE_START) pieces.push(WORD.slice(at, at + length));
  }
  return pieces;
})();
const PIECE_RE = new RegExp(PIECES.join("|"), "i");

/** A literal that holds a crossing piece of the word and not the whole word — half of the prefix, however it was split. */
export function pieceHits(literals) {
  return literals.flatMap((literal) => {
    if (new RegExp(WORD, "i").test(literal)) return [];
    const piece = PIECE_RE.exec(literal);
    return piece === null ? [] : [`${piece[0]} (a piece of the prefix word)`];
  });
}
