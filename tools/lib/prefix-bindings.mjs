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
// holds the prefix word as written: `'teststo' + 'delete'` is the family's own spelling of "not the prefix" and binds nothing.
// Only a STRING-SHAPED value binds: a literal, a template or shell word of literals and names, a bound name, a case conversion of one
// (`.toLowerCase()`, `.toUpperCase()`, Python `.lower()`/`.upper()`, `String(X)`, `str(X)`), or a call of PATH_JOIN_CALLS or a pathlib join
// (`Path(a) / X`) whose arguments are such. A bound name passed to a call other than a path join or a case conversion, or reached through a
// member access or a subscript (`volumeFiles(s.from)`, `base.length`, `'{}-'.format(X)`, `X.concat('-')`), binds nothing: that would be taint,
// not value tracing. The word comes from an ORIGINAL literal of the file or from a bound name's value, never
// from a literal that expansion wrote into a call. The known bindings are written into the value, so an alias (`P="$BASE"`), a path
// (`P="$TMPDIR/$BASE"`) and a default (`P="${X:-<prefix>-}"`) bind too, to a TRUE fixed point: the loop ends when no binding changes; a name's
// own placeholder stays a placeholder in its value. A cycle ends through PROVENANCE, not through names: every bound value carries its own name
// and the provenance of the values it actually TOOK (a use that stays a placeholder, or an operand that is no value, adds nothing), and a build of X
// never takes a value whose provenance holds X. So a name another function reuses keeps its other values, and a word inside a string literal is no
// dependency: only a real use is (`$NAME`, `${NAME…}`, a template's `${NAME}`, a bare code name outside a string). The provenance is exact by
// construction, so an error in it can only be a refused value: one whose derivation ran through the name that builds it. What that can lose is a
// variant of a value the name already holds, with text the cycle added around it; it reads as a MISSED reading only if that added text changes what
// follows the prefix (a parameter operator that strips it) — limit J6. It never adds a value, and it never makes a name overflow. A value longer than
// MAX_VALUE or a name with MAX_VALUES values stops growing (`overflow`: a line that uses it is judged broad), and so does a name whose right-hand
// side is cut at MAX_EXPRESSION with the prefix word in the part that was not read.
// A command substitution is the placeholder `${-}` (no identifier, so no use pattern matches it, and the classifier reads it as an owner segment).
// A use is `$NAME`, `${NAME}` or `${NAME<operator>…}` (not the length `${#NAME}`), `$env:NAME`, and — for a name bound in script code —
// a bare `NAME` outside a string, a longer identifier and a property access.
//
// Conservative on purpose: a name assigned such a value ANYWHERE in the file is bound on EVERY line, whatever the scope, the order or
// a later reassignment — the error is then a false `broad`, which keeps the barrier closed, never a missed sweep.
// Limits (not traced; the plan that tracks this check records them too):
//   - a name bound in another file, the environment, a value built over several lines or passed as an argument;
//   - a value whose prefix word is split over two literal pieces (`'teststo''delete-'`, `"teststo" + "delete-"`) binds nothing: this
//     family's own spelling of "not the prefix" for detector and test code — a real sweeper written that way is missed (follow-up F14);
//   - from a script operand that is not string-shaped, only its ORIGINAL string literals holding the word bind (`'<prefix>-' || x`, a
//     conditional, `-replace`); a regex literal, an arrow, an object, a command substitution and an environment name that merely holds the
//     word bind nothing; a bound name passed to a call other than a path join or a case conversion, or reached through a member access,
//     binds nothing (`'{}-'.format(X)`, `'%s-' % X`, `[a, X].join('/')`, `X.concat('-')`, `$(echo "$X" | tr …)`, `$(printf '%s-' "$X")`);
//   - a placeholder glued directly BEFORE the prefix (`P="$D<prefix>-"`, a self-append `P="$P<prefix>-"`) is not read as a prefix: null;
//   - a line that holds the prefix word thousands of times after expansion costs the classifier time quadratic in that count;
//   - J7: a parameter operator that can strip the owner segment (`${P%%-u*}`, `${P%-*}`, `${P#…}`) is expanded to the bound value as if the operator
//     were absent, so the use reads with the owner segment it may have removed (owner-aware); and a value read right after the prefix separator that
//     is empty or holds no owner still reads as an owner (follow-up F15). Found 2026-10-28 by consultation; not a regression of the pre-F12 classifier;
//   - `'<prefix>-' + STAR`: any non-literal operand after the prefix reads as an owner segment, so the use is owner-aware;
//   - a right-hand side is read to 1024 characters: past that only its literals and word-runs bind, and a prefix word in the part not read makes the name overflow;
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

/**
 * The assignments of one line: `{ name, family, syntax, rhs, holds, truncated, tailHolds, start, end }` (`holds`: the right-hand side holds the prefix word;
 * `tailHolds`: a right-hand side cut at MAX_EXPRESSION has the word where it was not read, or across the cut) (`start`/`end` are the span of the whole
 * assignment in the line).
 */
export function assignments(line) {
  if (!line.includes("=")) return [];
  const found = [];
  let lastWord; // where the prefix word last starts in the line: found once, for the cut right-hand sides
  const read = (re, family, syntax) => {
    for (const match of line.matchAll(re)) {
      const expression = scanExpression(line, match.index + match[0].length, syntax === "sh");
      if (expression.truncated) lastWord ??= line.toLowerCase().lastIndexOf(PREFIX_WORD);
      const tailHolds = expression.truncated && lastWord + PREFIX_WORD.length > expression.end;
      found.push({ name: match[1], family, syntax, rhs: expression.text, holds: holdsPrefix(expression.text), truncated: expression.truncated, tailHolds, start: match.index, end: expression.end });
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

/** `text` split at its top-level characters for which `isSeparator` holds (outside quotes and brackets). */
function splitTop(text, isSeparator) {
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
    else if (depth === 0 && isSeparator(char)) { parts.push(text.slice(from, index)); from = index + 1; }
  }
  return [...parts, text.slice(from)];
}

/** The index of the bracket that closes the one at `open`, quotes respected; -1 when it does not close. */
function closingIndex(text, open) {
  let depth = 0;
  let quote = null;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
    if (quote !== null) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
    } else if (char === "'" || char === '"' || char === "`") quote = char;
    else if (char in CLOSER) depth += 1;
    else if ((char === ")" || char === "]" || char === "}") && (depth -= 1) === 0) return index;
  }
  return -1;
}

export const holdsPrefix = (value) => value.toLowerCase().includes(PREFIX_WORD);

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

/** The calls that join path parts: their arguments, when literals or names, make a string, so a value built by one is a value. */
export const PATH_JOIN_CALLS = ["path.join", "path.resolve", "path.posix.join", "path.win32.join", "os.path.join", "Join-Path", "[IO.Path]::Combine"];

/** The arguments of `operand` when it is a call of PATH_JOIN_CALLS (`name(a, b)`, or PowerShell's `Join-Path a b`), else null. */
function pathJoinArgs(operand) {
  let text = operand.trim();
  while (text.startsWith("(") && closingIndex(text, 0) === text.length - 1) text = text.slice(1, -1).trim();
  const name = PATH_JOIN_CALLS.find((call) => text.startsWith(call) && !/^[\w.$]/.test(text.slice(call.length)));
  if (name === undefined) return null;
  const rest = text.slice(name.length);
  if (/^\s*\(/.test(rest)) {
    const open = text.indexOf("(", name.length);
    return closingIndex(text, open) === text.length - 1 ? splitTop(text.slice(open + 1, -1), (char) => char === ",") : null;
  }
  if (name !== "Join-Path" || !/^\s/.test(rest)) return null;
  return splitTop(rest, (char) => /\s/.test(char)).map((arg) => arg.trim()).filter((arg) => arg !== "" && !/^-[A-Za-z]+$/.test(arg));
}

/**
 * What stands for a value nobody can read (an operand that is not a literal and not a bound name, a command substitution): an interpolation, which
 * the classifier reads as an owner segment. `${-}` is no identifier, so no use pattern matches it: a file's own variable can be called `x`.
 */
const PLACEHOLDER = "${-}";
/** An alternative is `{ pieces, prov }`: the pieces of one reading of an operand, and the names its values were built through (`prov`, see `evaluate`). */
const alternative = (pieces, prov = []) => ({ pieces, prov: new Set(prov) });
const cross = (left, right) => left.flatMap((head) => right.map((tail) => alternative([...head.pieces, ...tail.pieces], [...head.prov, ...tail.prov])));
/** An operand that is not a literal and not a bound name: an interpolation, which the classifier reads as an owner segment. */
const unknown = () => alternative([PLACEHOLDER]);
const CASE_CALL_RE = /^([\s\S]+?)\s*\.\s*(?:to(?:Locale)?(?:Lower|Upper)Case|lower|upper)\s*\(\s*\)\s*$/;
const STRING_CALL_RE = { js: /^String\s*\(/, py: /^str\s*\(/ }; // the identity conversion of each script family
const PATHLIB_RE = /^(?:pathlib\s*\.\s*)?(?:Pure)?Path\s*\(/;
const SCRIPT_NAME_RE = /^\s*([A-Za-z_]\w*)\s*$/;
const POWERSHELL_NAME_RE = /^\s*\$(?:env:)?([A-Za-z_]\w*)\s*$/;

/** The indexes of the values of `entry` a build of `target` may use: not a value that was itself built through `target` (that is the cycle). */
const usableValues = (entry, target) => entry.values.flatMap((_, index) => (target === null || !entry.prov[index].has(target) ? [index] : []));

/** `text` is `open…)` and nothing else: the arguments of the call, split at its top-level commas, else null. */
function callArgs(text, openIndex) {
  return closingIndex(text, openIndex) === text.length - 1 ? splitTop(text.slice(openIndex + 1, -1), (char) => char === ",") : null;
}

/** The alternatives of a pathlib join `Path(a, b) / X / Y` (a `Path(…)` alone too), else null. */
function pathlibAlternatives(operand, syntax, ctx) {
  const text = operand.trim();
  const head = PATHLIB_RE.exec(text);
  if (head === null) return null;
  const open = head[0].length - 1;
  const close = closingIndex(text, open);
  if (close < 0) return null;
  const rest = text.slice(close + 1).trim();
  if (rest !== "" && !rest.startsWith("/")) return null;
  const parts = [...splitTop(text.slice(open + 1, close), (char) => char === ","), ...(rest === "" ? [] : splitTop(rest.slice(1), (char) => char === "/"))];
  return joined(parts, syntax, ctx);
}

/** The operands joined with `/` between them, every combination of their alternatives. */
function joined(args, syntax, ctx) {
  let combos = [alternative([])];
  args.forEach((arg, index) => { combos = cross(combos, cross(index === 0 ? [alternative([])] : [alternative(["/"])], operandAlternatives(arg, syntax, ctx))); });
  return combos;
}

/**
 * The alternatives (`{ pieces, prov }`) one operand of a script right-hand side can stand for. A STRING-SHAPED operand only: a literal (its
 * `${NAME}` forms expanded), a bound name (one alternative per usable value), a case conversion or `String(…)`/`str(…)` of such, a path-join
 * call or a pathlib join whose arguments are such. Anything else — any other call, a member access, a subscript, whatever it takes as
 * arguments — is an interpolation: a bound name given to it does NOT make its result a value. `prov` is every name the operand mentions (bound
 * or not) and every name its values were built through.
 */
function operandAlternatives(operand, syntax, ctx) {
  const literals = literalTexts(operand);
  if (literals !== null) {
    let combos = [alternative([])];
    for (const inner of literals) {
      const variants = expandReadings(inner, ctx.uses, { allowBare: false, target: ctx.target });
      if (variants === null) ctx.overflow = true;
      combos = cross(combos, (variants ?? [{ text: inner, prov: new Set() }]).map(({ text, prov }) => alternative([text], prov)));
    }
    return combos;
  }
  const name = (syntax === "ps" ? POWERSHELL_NAME_RE : SCRIPT_NAME_RE).exec(operand)?.[1];
  if (name !== undefined) {
    const entry = ctx.bindings.get(name);
    if (entry === undefined || (syntax !== "ps" && entry.family !== CODE)) return [unknown()];
    if (entry.overflow) ctx.overflow = true;
    const usable = usableValues(entry, ctx.target);
    return usable.length === 0 ? [unknown()] : usable.map((index) => alternative([entry.values[index]], entry.prov[index]));
  }
  const converted = CASE_CALL_RE.exec(operand);
  if (converted !== null) return operandAlternatives(converted[1], syntax, ctx); // the classifier reads the word in either case
  const text = operand.trim();
  if (STRING_CALL_RE[syntax]?.test(text)) {
    const args = callArgs(text, text.indexOf("("));
    if (args !== null && args.length === 1) return operandAlternatives(args[0], syntax, ctx);
  }
  if (syntax === "py") {
    const pathlib = pathlibAlternatives(operand, syntax, ctx);
    if (pathlib !== null) return pathlib;
  }
  const args = pathJoinArgs(operand);
  return args === null ? [unknown()] : joined(args, syntax, ctx);
}

/** The shell text with every command substitution (`$(…)`, backticks) made PLACEHOLDER: what a command prints is not the value of a word that holds a bound name. */
function maskSubstitutions(text) {
  let out = "";
  let single = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "'") single = !single;
    if (!single && char === "$" && text[index + 1] === "(") {
      const end = closingIndex(text, index + 1);
      out += PLACEHOLDER;
      index = end < 0 ? text.length : end;
    } else if (!single && char === "`") {
      const end = text.indexOf("`", index + 1);
      out += PLACEHOLDER;
      index = end < 0 ? text.length : end;
    } else out += char;
  }
  return out;
}

/**
 * The values a right-hand side can stand for that hold the prefix word, `{ values: [{ value, prov }], overflow }`. Only a STRING-SHAPED value binds: a
 * shell word (unquoted, its `$NAME` forms expanded, command substitutions masked) or script operands that are literals, bound names, case
 * conversions or path-join calls (`operandAlternatives`). The word must come from an ORIGINAL literal or from a bound name's value, and it counts
 * only when ONE piece holds it as written, so `'teststo' + 'delete'` (two pieces, this family's own spelling of "not the prefix") holds nothing.
 * Beside the whole value, every original string literal that holds the word inside an operand that is not a literal (`'<prefix>-' || x`, a
 * conditional, `-replace`) is a value of its own. A right-hand side cut at MAX_EXPRESSION adds the word-runs of its text: never dropped.
 *
 * `prov` is the PROVENANCE of a value: the name that holds it and the provenance of the values it actually TOOK. A name used without a value (unbound,
 * or every value refused) adds nothing. A build of X never takes a value whose provenance holds X: every value carries its own name, so a cycle back
 * to X is refused, and only the cyclic VALUES of a name are dropped, never the name — a name another function reuses keeps its other values.
 */
function evaluate(item, uses, bindings) {
  const found = [];
  const ctx = { uses, bindings, target: item.name, overflow: false };
  if (item.syntax === "sh") {
    const masked = maskSubstitutions(item.rhs);
    const variants = expandReadings(masked, uses, { allowBare: false, target: item.name });
    if (variants === null) ctx.overflow = true;
    for (const { text, prov } of variants ?? [{ text: masked, prov: new Set() }]) {
      const pieces = shellPieces(text);
      if (pieces.some(holdsPrefix)) found.push({ value: pieces.join(""), prov });
    }
  } else {
    let combos = [alternative([])];
    for (const operand of splitTop(item.rhs, (char) => char === "+")) {
      if (combos.length <= MAX_READINGS) combos = cross(combos, operandAlternatives(operand, item.syntax, ctx));
      else ctx.overflow = true;
      if (literalTexts(operand) === null) found.push(...quotedLiterals(operand).filter(holdsPrefix).map((value) => ({ value, prov: new Set() })));
    }
    for (const { pieces, prov } of combos) if (pieces.some(holdsPrefix)) found.push({ value: pieces.join(""), prov });
  }
  if (item.truncated) found.push(...(item.rhs.match(WORD_RUN_RE) ?? []).map((value) => ({ value, prov: new Set() })));
  return { values: found, overflow: ctx.overflow };
}

// --- uses ----------------------------------------------------------------------------------------------------------------

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The index of the `/` that closes a regular-expression literal opening at `start`; -1 when none opens there (it opens after nothing or after an
 * operator, never after a word or a closing bracket: that is a division); NOT_CLOSED when one opens and the line ends before it closes.
 */
function regexLiteralEnd(line, start) {
  const before = line.slice(0, start).trimEnd().at(-1);
  if ((before !== undefined && !"([{,;:=!&|?+-*%<>~^".includes(before)) || /[/*]/.test(line[start + 1] ?? "/")) return -1;
  let inClass = false;
  for (let index = start + 1; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\\") index += 1;
    else if (char === "[") inClass = true;
    else if (char === "]") inClass = false;
    else if (char === "/" && !inClass) return index;
  }
  return NOT_CLOSED;
}
const NOT_CLOSED = -2;

/** Which characters of the line sit inside a string literal (`'`, `"` or a backtick, with backslash escapes), the quotes included. */
function stringMask(line) {
  const mask = new Array(line.length).fill(false);
  let quote = null;
  let scanning = true; // a scan that reached the end of the line without closing is not started again: a run of `/[` would rescan the line from each `/`
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote === null) {
      if (char === "'" || char === '"' || char === "`") { quote = char; mask[index] = true; }
      else if (char === "/" && scanning) {
        const end = regexLiteralEnd(line, index);
        if (end > index) { mask.fill(true, index, end + 1); index = end; } else if (end === NOT_CLOSED) scanning = false;
      }
    } else {
      mask[index] = true;
      if (char === "\\") { index += 1; mask[index] = true; } else if (char === quote) quote = null;
    }
  }
  return mask;
}

const useRegex = (alternation, operator) => new RegExp(String.raw`\$\{(${alternation})(?:[:%#/^,@][^}]{0,${operator}})?\}|\$(?:env:)?(${alternation})(?![A-Za-z0-9_])|(?<![A-Za-z0-9_$.])(${alternation})(?![A-Za-z0-9_$])`, "g");

/** The use pattern for a set of bindings, built ONCE per pass over a file (`null` when nothing is bound). */
function makeUses(bindings) {
  if (bindings.size === 0) return null;
  const names = [...bindings.keys()].sort((a, b) => b.length - a.length);
  return { bindings, names, re: useRegex(names.map(escapeRegExp).join("|"), MAX_OPERATOR), familyOf: (name) => bindings.get(name)?.family };
}

/**
 * `line` with every use replaced by what `choose(name, entry)` returns (`undefined`: the use stays as written); a name in `own` (assigned on the
 * line) is left alone.
 */
function replaceUses(line, uses, own, choose, allowBare = true) {
  let mask;
  return line.replace(uses.re, (match, braced, dollar, bare, offset) => {
    const name = braced ?? dollar ?? bare;
    if (own.has(name)) return match;
    const family = uses.familyOf(name);
    if (family === undefined) return match;
    if (bare !== undefined && (!allowBare || family !== CODE || (mask ??= stringMask(line))[offset])) return match;
    const value = choose(name, uses.bindings.get(name));
    if (value === undefined) return match;
    return bare === undefined ? value : `"${value}"`;
  });
}

/**
 * Every reading of `line`, `{ text, prov }`: the line with the bound names it uses replaced by their values, one reading per combination of the
 * values of THOSE names (names the line does not use do not multiply anything). `prov` is the provenance of the values picked, nothing else: a use
 * that stays as written adds no name. With a `target`, a value built through the target is not taken: its use stays as written. `null` above
 * MAX_READINGS, or when a name it uses outgrew its bounds.
 */
function expandReadings(line, uses, { own = new Set(), allowBare = true, target = null } = {}) {
  const none = new Set();
  if (uses === null || !uses.names.some((name) => line.includes(name))) return [{ text: line, prov: none }];
  const used = new Map();
  replaceUses(line, uses, own, (name, entry) => { used.set(name, entry); }, allowBare);
  if (used.size === 0) return [{ text: line, prov: none }];
  const entries = [...used].map(([name, entry]) => ({ name, entry, usable: usableValues(entry, target) }));
  if (entries.some(({ entry }) => entry.overflow)) return null; // a name that outgrew its bounds: some of its values are unknown
  const total = entries.reduce((product, { usable }) => product * Math.max(usable.length, 1), 1);
  if (total > MAX_READINGS) return null;
  return Array.from({ length: total }, (_, k) => {
    let rest = k;
    const pick = new Map();
    const prov = new Set();
    for (const { name, entry, usable } of entries) {
      if (usable.length === 0) continue; // every value was built through the target: the use stays as written
      const index = usable[rest % usable.length];
      rest = Math.floor(rest / usable.length);
      pick.set(name, entry.values[index]);
      for (const through of entry.prov[index]) prov.add(through);
    }
    return { text: replaceUses(line, uses, own, (name) => pick.get(name), allowBare), prov };
  });
}

/** Every reading of `line` as text: the line with the bound names it uses replaced by their values; `[line]` when it uses none; `null` above MAX_READINGS. */
export function readings(line, uses, own = new Set(), allowBare = true) {
  return expandReadings(line, uses, { own, allowBare })?.map(({ text }) => text) ?? null;
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
 * `Map<name, { family, values, prov, overflow }>` of the names the `items` (assignments) give a value holding the prefix word, to a true fixed
 * point. `prov[i]` is the provenance of `values[i]` (see `evaluate`): when two builds give one value, the smaller provenance is kept. A name that
 * outgrows MAX_VALUES or MAX_VALUE is marked `overflow`: a line that uses it is judged broad by the caller.
 */
function bindItems(items) {
  const bindings = new Map();
  const set = (item, entry, values, prov, overflow) => bindings.set(item.name, { family: entry?.family ?? item.family, values, prov, overflow });
  const markOverflow = (item) => {
    const entry = bindings.get(item.name);
    if (entry?.overflow) return false;
    set(item, entry, entry?.values ?? [], entry?.prov ?? [], true);
    return true;
  };
  const bind = (item, { value, prov }) => {
    const entry = bindings.get(item.name);
    const through = new Set([...prov, item.name]);
    const known = entry?.values.indexOf(value) ?? -1;
    if (known >= 0) {
      if ([...entry.prov[known]].every((name) => through.has(name))) return false; // nothing to drop from the provenance it has
      const shared = new Set([...entry.prov[known]].filter((name) => through.has(name)));
      set(item, entry, entry.values, entry.prov.map((old, index) => (index === known ? shared : old)), entry.overflow);
      return true;
    }
    if (value.length > MAX_VALUE || (entry?.values.length ?? 0) >= MAX_VALUES) return markOverflow(item);
    set(item, entry, [...(entry?.values ?? []), value], [...(entry?.prov ?? []), through], entry?.overflow ?? false);
    return true;
  };
  for (let changed = true; changed;) {
    changed = false;
    const uses = makeUses(bindings);
    for (const item of items) {
      if (item.tailHolds && markOverflow(item)) changed = true; // the word is past what was read: some value is unknown, the safe direction is broad
      const long = item.rhs.length > MAX_VALUE; // a value that long never binds as a whole: only its literals and word-runs can
      if (!item.holds && (long || !uses?.names.some((name) => item.rhs.includes(name)))) continue; // nothing to read in it
      const { values, overflow } = evaluate(item, uses, bindings);
      if (overflow && markOverflow(item)) changed = true; // it reads a name of unknown value: overflow, never narrowed
      for (const value of values) if (bind(item, value)) changed = true;
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
