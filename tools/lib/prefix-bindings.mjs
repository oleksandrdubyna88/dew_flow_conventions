// A prefix held in a variable of the SAME file — the half of the owner-blind classifier (`sweeper-scan.mjs`, `classifyLines`)
// that reads assignments. A sweep line often carries no literal prefix: `P='<prefix>-'` on one line, `find … -name "${P}*" … rm -rf`
// on another. `prefixBindings` finds the names a file assigns a value that holds the prefix word, `readings` writes those values
// into a line (every combination of the values of the names the line uses), and the caller judges each reading while every report
// keeps the ORIGINAL line (its number, its hash).
//
// What is traced. An assignment in shell (`NAME=`, also after `export`/`local`/`readonly`/`declare`/`typeset` and after `;`, `&&`,
// `then`), PowerShell (`$NAME =`, `$env:NAME =`), JavaScript/TypeScript (`const|let|var NAME =`) or Python (`NAME = `, PEP 8 spacing).
// The value is the WHOLE right-hand side, up to `;`, a top-level `,`, an unbalanced `)`, a comment or the end of the line: adjacent
// literals are folded, a shell word of several quoted pieces is one word, and every operand that is not a literal (`+ owner +`,
// `"$OWNER"`) is kept as an interpolation, so the classifier sees an owner segment. A value is bound only when ONE literal piece
// holds the prefix word as written: `'teststo' + 'delete'` is the family's own spelling of "not the prefix" and binds nothing. The known bindings are written into the value
// first, so an alias (`P="$BASE"`), a path (`P="$TMPDIR/$BASE"`) and a default (`P="${X:-<prefix>-}"`) bind too, to a TRUE fixed point:
// the loop ends when no binding changes; a value longer than MAX_VALUE or a name with MAX_VALUES values stops growing (the cycle guard).
// A use is `$NAME`, `${NAME}` or `${NAME<operator>…}` (not the length `${#NAME}`), `$env:NAME`, and — for a name bound in script code —
// a bare `NAME` outside a string, a longer identifier and a property access.
//
// Conservative on purpose: a name assigned such a value ANYWHERE in the file is bound on EVERY line, whatever the scope, the order or
// a later reassignment — the error is then a false `broad`, which keeps the barrier closed, never a missed sweep.
// Limits (not traced; the plan that tracks this check records them too):
//   - a name bound in another file, the environment, a value built over several lines or passed as an argument;
//   - a value whose prefix word is split over two literal pieces (`'teststo''delete-'`, `"teststo" + "delete-"`) binds nothing: this
//     family's own spelling of "not the prefix" for detector and test code — a real sweeper written that way is missed (follow-up F14);
//   - from a script operand that is not literal-only, only its string literals holding the word bind (`'<prefix>-'.lower()`,
//     `'<prefix>-' || x`, a conditional, `-replace`), and a plain call (a dotted name, simple arguments, one nesting level) is kept as
//     written; a call nested deeper, a regex literal, an arrow, an object and an environment name that merely holds the word bind nothing;
//   - `'<prefix>-' + STAR`: any non-literal operand after the prefix reads as an owner segment, so the use is owner-aware;
//   - a right-hand side is read to 1024 characters: past that only its literals and word-runs bind;
//   - Python f-strings and `Path.glob` at the USE, a glob built by concatenation with the removal on another line, a quoted glob
//     (`[[ "$n" == "$P"* ]]`), Python without PEP 8 spacing, a second assignment on one shell line or a second JS declarator, shell
//     arrays, PowerShell `[string]$P`, `$script:P` and PowerShell's case-insensitive names.

export const PREFIX_WORD = "teststo" + "delete"; // spelled in two pieces: this file is read by the machine scan too

const SHELL = "shell"; // `$NAME`, `${NAME}`, `$env:NAME` are uses (shell, PowerShell)
const CODE = "code"; //   a bare `NAME` is a use too (JavaScript, TypeScript, Python)
const MAX_VALUE = 512;
const MAX_VALUES = 32;
/** A right-hand side is read up to this many characters: a value over MAX_VALUE never binds once folded, and an unclosed bracket must not make a long line quadratic. */
const MAX_EXPRESSION = 1024;
const MAX_OPERATOR = 512; // the longest `${NAME<operator>…}` tail read as one use
/** Above this many readings of one line (the product of the value counts of the names it uses) the caller judges the line broad. */
export const MAX_READINGS = 256;

const IDENT = String.raw`[A-Za-z_][A-Za-z0-9_]*`;
const TYPE = String.raw`(?:\s*:[^=]*[^=\s])?`; // a type annotation; `[^=]*[^=\s]` cannot backtrack quadratically on a run of spaces
// where an assignment starts; each ends right after the `=` and the spaces after it, and the value is read from there by `scanExpression`
const SHELL_ASSIGN_RE = new RegExp(String.raw`(?:^|[;&|({]|\b(?:then|do|else)\b)\s*(?:(?:export|local|readonly|declare|typeset)(?:\s+-\w+)*\s+)*(${IDENT})=`, "g");
const POWERSHELL_ASSIGN_RE = new RegExp(String.raw`(?:^|[;{(])\s*\$(?:env:)?(${IDENT})\s*=(?!=)\s*`, "g");
const SCRIPT_DECLARE_RE = new RegExp(String.raw`\b(?:const|let|var)\s+(${IDENT})${TYPE}\s*=(?![=>])\s*`, "g");
const PYTHON_ASSIGN_RE = new RegExp(String.raw`^\s*(${IDENT})${TYPE}\s+=(?!=)\s*`, "g"); // PEP 8 spacing: it is what tells it from a shell assignment
const STRING_PREFIX_RE = /[rRbBuUfF]/; // a Python string prefix (`f'…'` keeps its `{name}` as an interpolation)
const CLOSER = { "(": ")", "[": "]", "{": "}" };

/** The assignments of one line: `{ name, family, syntax, rhs, holds, truncated, start, end }` (`holds`: the right-hand side holds the prefix word) (`start`/`end` are the span of the whole assignment in the line). */
export function assignments(line) {
  if (!line.includes("=")) return [];
  const found = [];
  const read = (re, family, syntax) => {
    for (const match of line.matchAll(re)) {
      const expression = scanExpression(line, match.index + match[0].length, syntax === "sh");
      found.push({ name: match[1], family, syntax, rhs: expression.text, holds: holdsPrefix(expression.text), truncated: expression.truncated, start: match.index, end: expression.end });
    }
  };
  read(SHELL_ASSIGN_RE, SHELL, "sh");
  read(POWERSHELL_ASSIGN_RE, SHELL, "ps");
  read(SCRIPT_DECLARE_RE, CODE, "js");
  read(PYTHON_ASSIGN_RE, CODE, "py");
  return found;
}

/** `line` without the spans of the given assignments (exactly those characters, by offset): what is left of the line is where its uses are. */
export function withoutAssignments(line, items) {
  const spans = items.map(({ start, end }) => [start, end]).sort((x, y) => x[0] - y[0]);
  let out = "";
  let from = 0;
  for (const [start, end] of spans) {
    if (start > from) out += line.slice(from, start);
    from = Math.max(from, end);
  }
  return out + line.slice(from);
}

/** The right-hand side that starts at `start`: `{ text, end, truncated }` — to the first top-level terminator (see the header), quotes and brackets respected, at most MAX_EXPRESSION characters. */
function scanExpression(line, start, shell) {
  const stack = [];
  const limit = Math.min(line.length, start + MAX_EXPRESSION);
  let quote = null;
  for (let index = start; index < limit; index += 1) {
    const char = line[index];
    if (quote !== null) {
      if (char === "\\" && (!shell || quote !== "'")) index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") { quote = char; continue; }
    if (shell && char === "\\") { index += 1; continue; }
    const opener = shell ? (char === "$" && (line[index + 1] === "(" || line[index + 1] === "{") ? line[(index += 1)] : null) : char in CLOSER ? char : null;
    if (stack.length > 0) {
      if (char === CLOSER[stack.at(-1)]) stack.pop();
      else if (opener !== null) stack.push(opener);
      continue;
    }
    if (opener !== null) { stack.push(opener); continue; }
    const ends = shell ? /[\s;&|)]/.test(char) : char === ";" || char === "," || char === ")" || char === "]" || char === "}" || char === "#" || (char === "/" && line[index + 1] === "/");
    if (ends) return { text: line.slice(start, index), end: index, truncated: false };
  }
  return { text: line.slice(start, limit), end: limit, truncated: limit < line.length };
}

/** The pieces of a shell word, quotes and escapes removed: `'a'"$B"c` is `a`, `$B`, `c` (each quoted part, and each unquoted run, is one piece). */
function shellPieces(word) {
  const pieces = [];
  let current = "";
  let quote = null;
  const flush = () => { if (current !== "") pieces.push(current); current = ""; };
  for (let index = 0; index < word.length; index += 1) {
    const char = word[index];
    if (quote === null && char === "\\") { current += word[(index += 1)] ?? ""; continue; }
    if (quote === '"' && char === "\\" && /["\\$`]/.test(word[index + 1] ?? "")) { current += word[(index += 1)]; continue; }
    if (quote === null && (char === "'" || char === '"')) { flush(); quote = char; } else if (char === quote) { flush(); quote = null; } else current += char;
  }
  flush();
  return pieces;
}

/** The inner texts of `operand` when it is only string literals (`'a' "b"`, `f'x'`, a template), else null. */
function literalTexts(operand) {
  const out = [];
  let index = 0;
  const skipSpaces = () => { while (/\s/.test(operand[index] ?? "")) index += 1; };
  skipSpaces();
  if (index >= operand.length) return null;
  while (index < operand.length) {
    for (let letters = 0; letters < 2 && STRING_PREFIX_RE.test(operand[index] ?? ""); letters += 1) index += 1;
    const quote = operand[index];
    if (quote !== "'" && quote !== '"' && quote !== "`") return null;
    let end = index + 1;
    while (end < operand.length && operand[end] !== quote) end += operand[end] === "\\" ? 2 : 1;
    if (end >= operand.length) return null;
    out.push(operand.slice(index + 1, end));
    index = end + 1;
    skipSpaces();
  }
  return out;
}

/** `text` split at its top-level `+` (outside quotes and brackets). */
function splitPlus(text) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let from = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote !== null) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
    } else if (char === "'" || char === '"' || char === "`") quote = char;
    else if (char in CLOSER) depth += 1;
    else if (char === ")" || char === "]" || char === "}") depth -= 1;
    else if (char === "+" && depth === 0) { parts.push(text.slice(from, index)); from = index + 1; }
  }
  return [...parts, text.slice(from)];
}

export const holdsPrefix = (value) => value.toLowerCase().includes(PREFIX_WORD);

// A non-literal operand is kept as written only when it is a plain call (`path.join(os.tmpdir(), "<prefix>-")`: a dotted name, simple
// arguments, no braces, no arrow) with the prefix word inside a string literal: a regex literal, an object, a function or an environment
// name that merely holds the word (`TESTSTODELETE_OWNER`) is not a value the name stands for, and binding it would flag every use of the name.
const CALL_RE = /^[\w.$]+\((?:[^(){}]|\([^(){}]*\))*\)$/;
const QUOTED_PREFIX_RE = new RegExp(String.raw`["'\x60][^"'\x60]*${PREFIX_WORD}`, "i");
const keptOperand = (operand) => CALL_RE.test(operand.trim()) && QUOTED_PREFIX_RE.test(operand);

/** The inner texts of every closed string literal in `text`, nested ones included. */
function quotedLiterals(text) {
  const found = [];
  let quote = null;
  let from = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote === null) {
      if (char === "'" || char === '"' || char === "`") { quote = char; from = index + 1; }
    } else if (char === "\\") index += 1;
    else if (char === quote) { found.push(text.slice(from, index)); quote = null; }
  }
  return found;
}

const WORD_RUN_RE = new RegExp(String.raw`[^\s'"\x60;&|()]*${PREFIX_WORD}[^\s'"\x60;&|()]{0,128}`, "gi");

/**
 * The values a right-hand side can stand for that hold the prefix word. The whole value: the pieces joined — shell words unquoted; script
 * operands folded, a literal operand as its inner text(s), a plain call holding the word in a string kept as written (`keptOperand`),
 * anything else as `${x}`; it counts only when ONE piece holds the word as written, so `'teststo' + 'delete'` (two pieces, this family's
 * own spelling of "not the prefix") holds nothing. Beside it, every string literal that holds the word inside an operand that is not a
 * literal (`'<prefix>-'.toLowerCase()`, `'<prefix>-' || x`, `'<prefix>-' if a else …`, `-replace`) is a value of its own. A right-hand side
 * cut at MAX_EXPRESSION adds the word-runs of its text: a value that long is read conservatively, never dropped.
 */
function candidates(text, syntax, truncated) {
  const found = [];
  if (syntax === "sh") {
    const pieces = shellPieces(text);
    if (pieces.some(holdsPrefix)) found.push(pieces.join(""));
  } else {
    const pieces = [];
    for (const operand of splitPlus(text)) {
      const literals = literalTexts(operand);
      if (literals !== null) { pieces.push(...literals); continue; }
      pieces.push(keptOperand(operand) ? operand.trim() : "${x}");
      found.push(...quotedLiterals(operand).filter(holdsPrefix));
    }
    if (pieces.some(holdsPrefix)) found.push(pieces.join(""));
  }
  if (truncated) found.push(...(text.match(WORD_RUN_RE) ?? []));
  return found;
}

// --- uses ----------------------------------------------------------------------------------------------------------------

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Which characters of the line sit inside a string literal (`'`, `"` or a backtick, with backslash escapes), the quotes included. */
function stringMask(line) {
  const mask = new Array(line.length).fill(false);
  let quote = null;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote === null) {
      if (char === "'" || char === '"' || char === "`") { quote = char; mask[index] = true; }
    } else {
      mask[index] = true;
      if (char === "\\") { index += 1; mask[index] = true; } else if (char === quote) quote = null;
    }
  }
  return mask;
}

/** The use pattern for a set of bindings, built ONCE per pass over a file (`null` when nothing is bound). */
function makeUses(bindings) {
  if (bindings.size === 0) return null;
  const names = [...bindings.keys()].sort((a, b) => b.length - a.length);
  const alternation = names.map(escapeRegExp).join("|");
  const re = new RegExp(String.raw`\$\{(${alternation})(?:[:%#/^,@][^}]{0,${MAX_OPERATOR}})?\}|\$(?:env:)?(${alternation})(?![A-Za-z0-9_])|(?<![A-Za-z0-9_$.])(${alternation})(?![A-Za-z0-9_$])`, "g");
  return { bindings, names, re };
}

/** `line` with every use of a bound name replaced by what `choose(name, entry)` returns; a name in `own` (assigned on the line) is left alone. */
function replaceUses(line, uses, own, choose) {
  let mask;
  return line.replace(uses.re, (match, braced, dollar, bare, offset) => {
    const name = braced ?? dollar ?? bare;
    if (own.has(name)) return match;
    const entry = uses.bindings.get(name);
    if (bare !== undefined && (entry.family !== CODE || (mask ??= stringMask(line))[offset])) return match;
    const value = choose(name, entry);
    return bare === undefined ? value : `"${value}"`;
  });
}

/**
 * Every reading of `line`: the line with the bound names it uses replaced by their values, one reading per combination of the values
 * of THOSE names (names the line does not use do not multiply anything). `[line]` when it uses none; `null` above MAX_READINGS.
 */
export function readings(line, uses, own = new Set()) {
  if (uses === null || !uses.names.some((name) => line.includes(name))) return [line];
  const used = new Map();
  replaceUses(line, uses, own, (name, entry) => { used.set(name, entry); return ""; });
  if (used.size === 0) return [line];
  const entries = [...used];
  if (entries.some(([, entry]) => entry.overflow)) return null; // a name that outgrew its bounds: some of its values are unknown
  const total = entries.reduce((product, [, entry]) => product * entry.values.length, 1);
  if (total > MAX_READINGS) return null;
  return Array.from({ length: total }, (_, k) => {
    let rest = k;
    const pick = new Map(entries.map(([name, entry]) => {
      const value = entry.values[rest % entry.values.length];
      rest = Math.floor(rest / entry.values.length);
      return [name, value];
    }));
    return replaceUses(line, uses, own, (name) => pick.get(name));
  });
}

/** `line` with every use of a bound name replaced by its `variant`-th value (the last one when it has fewer). */
export function expandLine(line, bindings, variant = 0) {
  const uses = makeUses(bindings);
  if (uses === null) return line;
  const own = new Set(assignments(line).map((item) => item.name));
  return replaceUses(line, uses, own, (name, entry) => entry.values[Math.min(variant, entry.values.length - 1)]);
}

export { makeUses };

// --- bindings ------------------------------------------------------------------------------------------------------------

/**
 * `Map<name, { family, values, overflow }>` of the names the `items` (assignments) give a value holding the prefix word, to a true fixed
 * point. A name that outgrows MAX_VALUES or MAX_VALUE is marked `overflow`: a line that uses it is judged broad by the caller.
 */
function bindItems(items) {
  const bindings = new Map();
  const set = (item, entry, values, overflow) => bindings.set(item.name, { family: entry?.family ?? item.family, values, overflow });
  const markOverflow = (item) => {
    const entry = bindings.get(item.name);
    if (entry?.overflow) return false;
    set(item, entry, entry?.values ?? [], true);
    return true;
  };
  const bind = (item, value) => {
    const entry = bindings.get(item.name);
    if (entry?.values.includes(value)) return false;
    if (value.length > MAX_VALUE || (entry?.values.length ?? 0) >= MAX_VALUES) return markOverflow(item);
    set(item, entry, [...(entry?.values ?? []), value], entry?.overflow ?? false);
    return true;
  };
  for (let changed = true; changed;) {
    changed = false;
    const uses = makeUses(bindings);
    for (const item of items) {
      const long = item.rhs.length > MAX_VALUE; // a value that long never binds as a whole: only its literals and word-runs can, and they need no reading
      if (!item.holds && (long || !uses?.names.some((name) => item.rhs.includes(name)))) continue; // nothing to read in it
      const found = long ? [item.rhs] : readings(item.rhs, uses, new Set([item.name]));
      if (found === null) { if (markOverflow(item)) changed = true; continue; } // reads a name of unknown value: overflow, never narrowed
      for (const text of found) for (const value of candidates(text, item.syntax, item.truncated)) if (bind(item, value)) changed = true;
    }
  }
  return bindings;
}

/**
 * The bindings of a text (see the header). `skip` is a set of 1-based line numbers whose assignments bind nothing: the lines the
 * caller's allowlist passes and, for a caller that honours the transition marker, the lines that carry it. `perLine` (the result of
 * `assignments` for each line) is taken from a caller that has it already.
 */
export function prefixBindings(text, { skip = new Set(), perLine } = {}) {
  const source = String(text);
  if (!holdsPrefix(source)) return new Map();
  const found = perLine ?? source.split(/\r?\n/).map(assignments);
  return bindItems(found.flatMap((list, index) => (skip.has(index + 1) ? [] : list)));
}
