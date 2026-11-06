// The folding reader of the structural guard (`tools/leftovers-check.mjs`, F30; `todo/PLAN_F30_folding_reader.md` D1 to D4): a SPELLING reader of text a person wrote in their own
// repository. It is not a defence against a hostile author and not data flow: a name built from a variable, across lines, from the environment or at run time is not seen.
//
// ONE forward-only scanner per file kind (D1). It walks the file once and answers, for each line, `{ text, code, literals, size }`: `text` is the line with the comments removed and every string
// literal decoded and joined, each written back in its own quotes; `code` the line with the comments removed and nothing else changed (`decodeCode` reads it); `literals` `[{ value, plus }]`, the
// joined literals in order (`plus`: a `+` follows, so an owner letter at the literal's end is continued). Nothing is re-tried but a join that fails: an unterminated quote ends that line's reading, a regex literal with no
// closer on its line is a division and the line gets no second try, and a lookahead (an array, a `+` or `.concat` operand) scans only what it can join, once, and then the text is lexed as ordinary code (twice in all; a test counts the steps). No marker character is put in the text, so a control byte turns nothing off.
// Only a block comment and a template (with its `${}` depth) cross lines; a join is read within one line.
//
// What it reads, by kind, is D2's table (the promise); the header of the guard states it, with what is not read and the limits. In short: .mjs .cjs .js .ts .tsx .jsx .mts .cts: comments `//` `/* */`, literals '…' "…" `…` (a `${'a'}` hole
// that holds only a quoted literal), a regex literal (after `( , = : [ ! & | ? { ;`, `=>`, `return`, `typeof`, `case` and at a line's start; after any other token a `/` is a division), joins `+` `.concat(…)` `['a', 'b'].join(<literal>)`, decoded `\uXXXX` `\u{…}` `\xXX` and a class `[T]`; .sh .yml .yaml: comments `#` at the start of a
// word, '…' "…" $'…', a word's touching pieces; .ps1: comments `#` `<# #>`, '…' "…", `+`, binary `-join`. Not read: a template nested in a hole, a literal in an expression hole, unary `-join`, a comment between operands,
// `.ps1` here-strings, `.sh` heredocs, a nested `"$(…)"`, an extensionless script, every other kind. JSX text is not told from code: `<p>don't</p>` stops that line's reading, `<p>src/*.ts</p>` hides every line to the next `*/`, and a backtick in
// JSX text or in a regex at an unlisted position leaves the reader inside a template: the later spellings of that file are silently not read, and that is no finding.
//
// The module holds the pure reading: `foldFile`, `decodeCode`, and the two literal-level readings the folded literals feed, `bareWordHits` and `pieceHits`. The classes stay in the guard.

import { foldPs, foldSh } from "./leftovers-fold-shell.mjs";
import { verdictAfter } from "./sweeper-scan.mjs";

/** A folded line over this many characters does not go to the folded readings (a bound on their work; the plan's D5 keeps it): the guard says so in one `unreadable` finding. */
export const FOLD_LIMIT = 256 * 1024;
const WORD = "teststo" + "delete"; // the prefix, in two pieces: this module is a detector and the machine scan reads it too

const KIND_BY_EXTENSION = Object.freeze({
  ".mjs": "js", ".cjs": "js", ".js": "js", ".ts": "js", ".mts": "js", ".cts": "js", ".tsx": "js", ".jsx": "js",
  ".sh": "sh", ".yml": "sh", ".yaml": "sh",
  ".ps1": "ps1",
});

/** `'js' | 'sh' | 'ps1' | undefined` for a file extension (with its dot). */
export const foldKind = (extension) => KIND_BY_EXTENSION[extension];

// --- decoding ---------------------------------------------------------------------------------------------------------------

const SIMPLE_ESCAPES = Object.freeze({ n: "\n", r: "\r", t: "\t", 0: "\0", b: "\b", f: "\f", v: "\v" }); // JavaScript: `\a` is `a`
const ANSI_ESCAPES = Object.freeze({ ...SIMPLE_ESCAPES, a: "\u0007" }); // a shell $'…' has the bell too
export const fromCode = (code) => (Number.isInteger(code) && code >= 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "�");
export const simple = (letter, table = SIMPLE_ESCAPES) => table[letter] ?? letter;

// one escape of a JavaScript literal, or a one-character class
const JS_DECODE = /\\(?:u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|([\s\S]))|\[([^\]\\^-])\]/g;
// the escapes and the class alone, for a regex literal (the code reading does not lex a regex)
const CODE_DECODE = /\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})|\[([^\]\\^-])\]/g;
const HOLE_LITERAL = /^\$\{\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*\}$/s;

/** The body of a JS string or template segment, decoded: `\uXXXX`, `\u{…}`, `\xXX`, the plain escapes and a class `[T]` read as `T`. */
function decodeJs(body) {
  if (body.indexOf("\\") < 0 && body.indexOf("[") < 0) return body;
  return body.replace(JS_DECODE, (_all, braced, unicode, hex, plain, cls) => {
    if (braced !== undefined) return fromCode(Number.parseInt(braced, 16));
    if (unicode !== undefined) return fromCode(Number.parseInt(unicode, 16));
    if (hex !== undefined) return fromCode(Number.parseInt(hex, 16));
    if (plain !== undefined) return simple(plain);
    return cls;
  });
}

/** `code` (a JS line, comments removed) with `\uXXXX`, `\u{…}`, `\xXX` and a one-character class written as the character: so `/^tests[T]oDelete[-_]/` reads as its plain form. It does not lex a regex. */
export function decodeCode(code) {
  if (code.indexOf("\\") < 0 && code.indexOf("[") < 0) return code;
  return code.replace(CODE_DECODE, (_all, braced, unicode, hex, cls) => {
    if (braced !== undefined) return fromCode(Number.parseInt(braced, 16));
    if (unicode !== undefined) return fromCode(Number.parseInt(unicode, 16));
    if (hex !== undefined) return fromCode(Number.parseInt(hex, 16));
    return cls;
  });
}

const ANSI_ESCAPE = /\\u([0-9a-fA-F]{1,4})|\\U([0-9a-fA-F]{1,8})|\\x([0-9a-fA-F]{1,2})|\\([0-7]{1,3})|\\([\s\S])/g;
export const decodeAnsi = (body) => body.replace(ANSI_ESCAPE, (_all, u4, u8, hex, octal, plain) => {
  if (u4 !== undefined) return fromCode(Number.parseInt(u4, 16));
  if (u8 !== undefined) return fromCode(Number.parseInt(u8, 16));
  if (hex !== undefined) return fromCode(Number.parseInt(hex, 16));
  if (octal !== undefined) return fromCode(Number.parseInt(octal, 8));
  return simple(plain, ANSI_ESCAPES);
});

// --- one line of output -----------------------------------------------------------------------------------------------------

/** A string built in chunks that counts its size always and keeps the text only while `keep` is true. */
class Chunks {
  constructor() {
    this.parts = [];
    this.buffer = "";
    this.size = 0;
  }

  add(piece, keep) {
    this.size += piece.length;
    if (!keep) return;
    this.buffer += piece;
    if (this.buffer.length > 32768) {
      this.parts.push(this.buffer);
      this.buffer = "";
    }
  }

  value() {
    return this.parts.join("") + this.buffer;
  }
}

/**
 * The answer for one line. Text and code stop being kept once either passes FOLD_LIMIT (`oversize`): the reader goes on counting, so a 32 MB line costs no memory, and the guard answers one
 * finding for it instead of running the quadratic classifier.
 */
export class Out {
  constructor(isJs) {
    this.isJs = isJs;
    this.text = new Chunks();
    this.codeText = new Chunks();
    this.literals = [];
    this.oversize = false;
  }

  append(chunks, piece) {
    chunks.add(piece, !this.oversize);
    if (!this.oversize && (this.text.size > FOLD_LIMIT || this.codeText.size > FOLD_LIMIT)) {
      this.oversize = true;
      this.text = Object.assign(new Chunks(), { size: this.text.size });
      this.codeText = Object.assign(new Chunks(), { size: this.codeText.size });
      this.literals = [];
    }
  }

  /** Code as written (the comments are already left out by the caller). */
  code(raw) {
    if (raw === "") return;
    this.append(this.text, raw);
    if (this.isJs) this.append(this.codeText, raw);
  }

  /** Text only: the closers and the `.concat(` that a join leaves behind. */
  textOnly(piece) {
    if (piece !== "") this.append(this.text, piece);
  }

  /** A literal: `raw` is its source (the code reading), `value` its decoded content. `opened` and `closed` say whether this line holds its quotes (a template spans lines). */
  lit(quote, value, raw, plus, opened = true, closed = true) {
    const flat = value.indexOf("\n") >= 0 || value.indexOf("\r") >= 0 ? value.replace(/[\r\n]/g, " ") : value; // a decoded line break never splits the folded line
    this.append(this.text, (opened ? quote : "") + flat + (closed ? quote : ""));
    if (this.isJs) this.append(this.codeText, raw);
    if (!this.oversize) this.literals.push({ value, plus });
  }

  finish() {
    const size = Math.max(this.text.size, this.codeText.size);
    return this.oversize ? { text: "", code: "", literals: [], size, oversize: true } : { text: this.text.value(), code: this.codeText.value(), literals: this.literals, size, oversize: false };
  }
}

// --- JavaScript -------------------------------------------------------------------------------------------------------------

export const BACKSLASH = 92;
const SLASH = 47;
const STAR = 42;
const T = -1; // a template body on the stack
export const C = -2; // a block comment on the stack; a number >= 0 is a `${` hole and holds its brace depth
export const isSpace = (c) => c === 32 || c === 9 || c === 13 || c === 10 || c === 11 || c === 12 || c === 0xa0 || c === 0xfeff;
const isIdent = (c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 || c === 36 || c > 127;
export const isQuote = (c) => c === 39 || c === 34;
const REGEX_AFTER = new Set([40, 44, 61, 58, 91, 33, 38, 124, 63, 123, 59]); // ( , = : [ ! & | ? { ;
const KEYWORDS_BEFORE_REGEX = new Set(["return", "typeof", "case"]);
const VALUE = 1; // the previous token ends a value: a `/` is a division
const OPENER = 2; // the previous token starts an expression: a `/` opens a regex
const EVENT = { EOL: 0, QUOTE: 1, TICK: 2, BRACKET: 3, LINE_COMMENT: 4, BLOCK_COMMENT: 5, LBRACE: 6, RBRACE: 7 };

/** The index of the first non-space at or after `from`. Counts the characters it passes (every helper does, so a test sees all the work of a line). */
export const skipSpaces = (line, from, ctx) => {
  let j = from;
  while (j < line.length && isSpace(line.charCodeAt(j))) j += 1;
  ctx.steps += j - from;
  return j;
};

/** The index after the closing quote of the literal that opens at `at`, or -1 when the line ends first. */
function lexQuoted(line, at, ctx) {
  const quote = line.charCodeAt(at);
  const n = line.length;
  let j = at + 1;
  while (j < n) {
    const c = line.charCodeAt(j);
    if (c === BACKSLASH) j += 2;
    else if (c === quote) {
      ctx.steps += j - at;
      return j + 1;
    } else j += 1;
  }
  ctx.steps += n - at;
  return -1;
}

/** The index after a regex literal whose body starts at `from`, or -1 when the line has no closer. */
function regexEnd(line, from, ctx) {
  const n = line.length;
  let inClass = false;
  let j = from;
  while (j < n) {
    const c = line.charCodeAt(j);
    if (c === BACKSLASH) j += 2;
    else if (inClass) {
      if (c === 93) inClass = false;
      j += 1;
    } else if (c === 91) {
      inClass = true;
      j += 1;
    } else if (c === SLASH) {
      ctx.steps += j - from + 1;
      return j + 1;
    } else j += 1;
  }
  ctx.steps += n - from;
  return -1;
}

/** Whether a literal (a quote or a backtick), maybe in parentheses, starts at `from` after spaces. */
function operandFollows(line, from, ctx) {
  let j = skipSpaces(line, from, ctx);
  while (line.charCodeAt(j) === 40) j = skipSpaces(line, j + 1, ctx);
  return isQuote(line.charCodeAt(j)) || line.charCodeAt(j) === 96;
}

/**
 * The next thing the driver must decide, from `from` on: sets `state.at` and returns an EVENT. Whitespace, identifiers, numbers, punctuation, a regex literal and a
 * division are passed here, and the previous token (`state.prev`) is kept for the next `/`. `state.hole` makes `{` and `}` events (a template hole counts them);
 * `state.arrays` makes a `[` followed by a quote an event (the top level reads `['a', 'b'].join(…)`).
 */
function nextEvent(line, from, ctx, state) {
  const n = line.length;
  let i = from;
  let prev = state.prev;
  while (i < n) {
    const c = line.charCodeAt(i);
    ctx.steps += 1;
    if (isSpace(c)) {
      i += 1;
      continue;
    }
    if (isIdent(c)) {
      const start = i;
      while (i < n && isIdent(line.charCodeAt(i))) i += 1;
      ctx.steps += i - start - 1;
      const length = i - start;
      prev = (length === 4 || length === 6) && KEYWORDS_BEFORE_REGEX.has(line.slice(start, i)) ? OPENER : VALUE;
    } else if (isQuote(c) || c === 96 || (c === 91 && state.arrays && operandFollows(line, i + 1, ctx))) {
      state.at = i;
      state.prev = prev;
      return c === 96 ? EVENT.TICK : c === 91 ? EVENT.BRACKET : EVENT.QUOTE;
    } else if (c === SLASH) {
      const d = line.charCodeAt(i + 1);
      if (d === SLASH || d === STAR) {
        state.at = i;
        state.prev = prev;
        return d === SLASH ? EVENT.LINE_COMMENT : EVENT.BLOCK_COMMENT;
      }
      if (!ctx.noRegex && (state.start || prev === OPENER)) {
        const end = regexEnd(line, i + 1, ctx);
        if (end < 0) {
          ctx.noRegex = true; // no closer on the line: a division, and the line gets no second try, in code or in any hole of it
          prev = OPENER;
          i += 1;
        } else {
          i = end;
          prev = VALUE;
        }
      } else {
        prev = OPENER;
        i += 1;
      }
    } else if (state.hole && (c === 123 || c === 125)) {
      state.at = i;
      state.prev = c === 123 ? OPENER : VALUE;
      return c === 123 ? EVENT.LBRACE : EVENT.RBRACE;
    } else if (c === 62 && line.charCodeAt(i - 1) === 61) { // =>
      prev = OPENER;
      i += 1;
    } else {
      prev = REGEX_AFTER.has(c) ? OPENER : VALUE;
      i += 1;
    }
    state.start = false;
  }
  state.prev = prev;
  state.at = n;
  return EVENT.EOL;
}

// a template under construction: its decoded value, where its source starts on this line, and where its outermost `${` opened (-1 when it opened on an earlier line)
const newTemplate = (rawStart, opened) => ({ value: "", rawStart, opened, holeStart: -1 });
const newHoleState = () => ({ prev: OPENER, hole: true, arrays: false, start: true, at: 0 });

/** A literal that opens at `at` and closes on this line: `{ end, value }`, or null. Used for the operands of a join. */
function readLiteral(line, at, ctx) {
  const c = line.charCodeAt(at);
  if (isQuote(c)) {
    const end = lexQuoted(line, at, ctx);
    return end < 0 ? null : { end, value: decodeJs(line.slice(at + 1, end - 1)), quote: line[at] };
  }
  if (c === 96) {
    const inner = { stack: [T], ts: newTemplate(at, true) };
    const end = lexTemplate(line, at + 1, inner, new Out(true), ctx);
    return inner.stack.length === 0 ? { end, value: inner.ts.value, quote: "`" } : null;
  }
  return null;
}


/** After a literal that ends at `end`: whether a `+` follows (a `)` and spaces may come first). */
export function plusFollows(line, end, ctx) {
  let j = end;
  while (j < line.length && (isSpace(line.charCodeAt(j)) || line.charCodeAt(j) === 41)) j += 1;
  ctx.steps += j - end;
  return line.charCodeAt(j) === 43 && line.charCodeAt(j + 1) !== 43 && line.charCodeAt(j + 1) !== 61;
}

/** A literal with any number of parentheses around it, spaces allowed: `{ end, value, quote }`, or null. `read` is the language's `readLiteral`. */
export function readOperand(line, at, ctx, read = readLiteral) {
  let j = skipSpaces(line, at, ctx);
  let open = 0;
  while (line.charCodeAt(j) === 40) {
    open += 1;
    j = skipSpaces(line, j + 1, ctx);
  }
  ctx.steps += j - at;
  const literal = read(line, j, ctx);
  if (literal === null) return null;
  let end = literal.end;
  for (let t = 0; t < open; t += 1) {
    const m = skipSpaces(line, end, ctx);
    if (line.charCodeAt(m) !== 41) return null;
    end = m + 1;
  }
  return { end, value: literal.value, quote: literal.quote };
}

/** The position of the `(` of `. name (` that starts at `at` (the dot), or -1: spaces are allowed around the dot and before the parenthesis. */
function methodOpen(line, at, name, ctx) {
  if (line.charCodeAt(at) !== 46) return -1;
  const k = skipSpaces(line, at + 1, ctx);
  if (!line.startsWith(name, k)) return -1;
  const open = skipSpaces(line, k + name.length, ctx);
  return line.charCodeAt(open) === 40 ? open : -1;
}

const isPlus = (line, j) => line.charCodeAt(j) === 43 && line.charCodeAt(j + 1) !== 43 && line.charCodeAt(j + 1) !== 61;

/** The literal arguments of a `.concat(` whose `(` is just before `from`: `{ value, end, closed, count }`; `end` is after the `)` when closed, else at the first argument that is no literal. */
function concatArguments(line, from, ctx) {
  let j = skipSpaces(line, from, ctx);
  let value = "";
  let count = 0;
  for (;;) {
    const lit = readOperand(line, j, ctx);
    if (lit === null) return { value, end: j, closed: false, count };
    count += 1;
    value += lit.value;
    j = skipSpaces(line, lit.end, ctx);
    if (line.charCodeAt(j) === 44) {
      j = skipSpaces(line, j + 1, ctx);
      if (line.charCodeAt(j) === 41) return { value, end: j + 1, closed: true, count };
    } else return line.charCodeAt(j) === 41 ? { value, end: j + 1, closed: true, count } : { value, end: lit.end, closed: false, count };
  }
}

// A keyword before `(` makes it a group and not a call: `return ('a') + 'b'` joins, `f('a') + 'b'` does not (D2: a call is not a parenthesis).
const KEYWORDS_BEFORE_GROUP = new Set(["return", "typeof", "case", "await", "yield", "throw", "delete", "void", "in", "of", "instanceof", "else", "do", "if", "while", "for", "switch", "with", "catch"]);

/**
 * How many of the parentheses that stand right before the literal at `at` (spaces allowed) are groups and not calls (D2). The run of `(` before the literal is counted; the outermost
 * of them is a call, and does not count, when a `)` or `]` stands right before it, or an identifier that is no keyword (`js`: spaces may come between; PowerShell: none may, because
 * `Remove-Item ("a" + "b")` is a command and its argument group). A closer after the literal may cross only these. Counts the characters it passes.
 */
export function groupParens(line, at, ctx, js) {
  let j = at - 1;
  let opens = 0;
  let outer = -1;
  for (;;) {
    while (j >= 0 && isSpace(line.charCodeAt(j))) j -= 1;
    if (j < 0 || line.charCodeAt(j) !== 40) break;
    opens += 1;
    outer = j;
    j -= 1;
  }
  let call = false;
  let stop = j;
  if (opens > 0) {
    let k = outer - 1;
    if (js) while (k >= 0 && isSpace(line.charCodeAt(k))) k -= 1;
    const c = k < 0 ? 0 : line.charCodeAt(k);
    if (c === 41 || c === 93) call = true;
    else if (isIdent(c)) {
      let w = k;
      while (w >= 0 && isIdent(line.charCodeAt(w))) w -= 1;
      call = !KEYWORDS_BEFORE_GROUP.has(line.slice(w + 1, k + 1));
      stop = Math.min(stop, w);
    }
  }
  ctx.steps += at - stop;
  return call ? opens - 1 : opens;
}

/**
 * The joins after a literal, as far as they go: `+` (an operand may sit in parentheses) and, for JavaScript, `.concat(<literals>)`. Each is read on the characters it
 * joins and nothing is tried twice. `own` is the number of parentheses right before the literal that are groups (`groupParens`): the closers between the operands may close
 * those and no others, because the value of `f('a')` is not `'a'`. Returns `{ value, end, closers, carry }`: the closers are the `)` that came right after the left operand
 * (kept, after the joined literal), and `carry` is `.concat(` when a non-literal argument follows the joined ones.
 */
export function chain(line, end, value, ctx, js, read, own) {
  const n = line.length;
  let e = end;
  let joined = value;
  let closers = 0;
  let open = own;
  let carry = "";
  for (;;) {
    let j = skipSpaces(line, e, ctx);
    let c = 0;
    while (j < n && line.charCodeAt(j) === 41) {
      c += 1;
      j = skipSpaces(line, j + 1, ctx);
    }
    ctx.steps += j - e + 1;
    if (c > open) break; // a closer of a call, or of a group that does not hold this literal
    if (isPlus(line, j)) {
      const operand = readOperand(line, j + 1, ctx, read);
      if (operand === null) break;
      joined += operand.value;
      closers += c;
      open -= c;
      e = operand.end;
    } else if (js && methodOpen(line, j, "concat", ctx) >= 0) {
      const args = concatArguments(line, methodOpen(line, j, "concat", ctx) + 1, ctx);
      if (args.count === 0) break;
      joined += args.value;
      closers += c;
      open -= c;
      e = args.end;
      if (!args.closed) {
        carry = ".concat(";
        break;
      }
    } else break;
  }
  return { value: joined, end: e, closers, carry };
}

/** `['a', 'b'].join('-')` that opens at `at` (spaces around its operators, a literal in parentheses anywhere a literal stands): `{ end, value, quote }`, or null. */
function tryJoinArray(line, at, ctx) {
  let j = skipSpaces(line, at + 1, ctx);
  const items = [];
  let quote;
  for (;;) {
    const lit = readOperand(line, j, ctx);
    if (lit === null) return null;
    quote ??= lit.quote;
    items.push(lit.value);
    j = skipSpaces(line, lit.end, ctx);
    if (line.charCodeAt(j) === 44) {
      j = skipSpaces(line, j + 1, ctx);
      if (line.charCodeAt(j) === 93) break;
    } else if (line.charCodeAt(j) === 93) break;
    else return null;
  }
  const open = methodOpen(line, skipSpaces(line, j + 1, ctx), "join", ctx);
  if (open < 0) return null;
  const separator = readOperand(line, open + 1, ctx);
  if (separator === null) return null;
  j = skipSpaces(line, separator.end, ctx);
  if (line.charCodeAt(j) !== 41) return null;
  ctx.steps += j - at;
  return { end: j + 1, value: items.join(separator.value), quote };
}

/**
 * Reads template bodies, holes and the comments inside holes from `from`, with the stack in `st`, until the outermost template closes (returns the index after its
 * closing backtick) or the line ends (returns the line's length, and the stack says what is still open). The outermost template collects its value: the decoded
 * segments, a `${'a'}` hole as the literal's decoded text, any other hole as written. A hole that spans lines is code: its text goes out as code and the template
 * goes on after it. A template nested in a hole is lexed for its state and read no further (D2).
 */
function lexTemplate(line, from, st, out, ctx) {
  const n = line.length;
  const stack = st.stack;
  const ts = st.ts;
  let i = from;
  let segment = from; // the start of the outermost template's unflushed body text
  let hole = null; // the code state inside a hole
  while (i < n) {
    const top = stack[stack.length - 1];
    if (top === C) {
      const close = line.indexOf("*/", i);
      ctx.steps += (close < 0 ? n : close + 2) - i;
      if (close < 0) i = n;
      else {
        stack.pop();
        i = close + 2;
      }
    } else if (top === T) {
      let j = i;
      while (j < n) {
        const c = line.charCodeAt(j);
        if (c === BACKSLASH) j += 2;
        else if (c === 96 || (c === 36 && line.charCodeAt(j + 1) === 123)) break;
        else j += 1;
      }
      ctx.steps += Math.min(j, n) - i + 1;
      if (j >= n) {
        if (stack.length === 1) ts.value += decodeJs(line.slice(segment, n));
        i = n;
      } else if (line.charCodeAt(j) === 96) {
        if (stack.length === 1) ts.value += decodeJs(line.slice(segment, j));
        stack.pop();
        i = j + 1;
        if (stack.length === 0) return i;
      } else {
        if (stack.length === 1) {
          ts.value += decodeJs(line.slice(segment, j));
          ts.holeStart = j;
        }
        stack.push(0);
        hole = newHoleState();
        i = j + 2;
      }
    } else {
      hole ??= newHoleState();
      const event = nextEvent(line, i, ctx, hole);
      const at = hole.at;
      if (event === EVENT.EOL) i = n;
      else if (event === EVENT.QUOTE) {
        const end = lexQuoted(line, at, ctx);
        i = end < 0 ? n : end;
        hole.prev = VALUE;
        hole.start = false;
      } else if (event === EVENT.TICK) {
        stack.push(T);
        i = at + 1;
      } else if (event === EVENT.LBRACE) {
        stack[stack.length - 1] += 1;
        i = at + 1;
      } else if (event === EVENT.RBRACE) {
        i = at + 1;
        if (stack[stack.length - 1] > 0) stack[stack.length - 1] -= 1;
        else {
          stack.pop();
          if (stack.length === 1) { // the outermost hole closed
            if (ts.holeStart >= 0) {
              const raw = line.slice(ts.holeStart, i);
              const literal = HOLE_LITERAL.exec(raw);
              ts.value += literal === null ? raw : decodeJs(literal[1] ?? literal[2]);
              ts.holeStart = -1;
            } else {
              out.code(line.slice(0, i)); // the hole began on an earlier line: its tail is code
              ts.rawStart = i;
            }
            segment = i;
          }
        }
      } else if (event === EVENT.LINE_COMMENT) i = n;
      else { // a block comment inside a hole
        const close = line.indexOf("*/", at + 2);
        ctx.steps += (close < 0 ? n : close + 2) - at;
        if (close < 0) {
          stack.push(C);
          i = n;
        } else i = close + 2;
      }
    }
  }
  if (stack.length === 0) return i;
  // the line ended with the template open
  if (stack.length === 1) out.lit("`", ts.value, line.slice(ts.rawStart, n), false, ts.opened, false);
  else if (ts.holeStart >= 0) {
    out.lit("`", ts.value, line.slice(ts.rawStart, ts.holeStart), false, ts.opened, false);
    out.code(line.slice(ts.holeStart, n));
  } else out.code(line);
  ts.value = "";
  ts.opened = false;
  ts.rawStart = 0;
  ts.holeStart = -1;
  return n;
}

function scanJsLine(line, number, st, out, ctx) {
  ctx.noRegex = false; // one flag for the line, shared by its code and every hole of it (D1): a regex that fails to close is tried once
  const n = line.length;
  const stack = st.stack;
  const state = { prev: 0, hole: false, arrays: true, start: true, at: 0 };
  let i = 0;
  let runStart = 0;
  if (stack.length > 0) {
    if (stack[0] === C) {
      const close = line.indexOf("*/");
      ctx.steps += close < 0 ? n : close + 2;
      if (close < 0) return;
      stack.pop();
      i = runStart = close + 2;
    } else {
      const end = lexTemplate(line, 0, st, out, ctx);
      if (stack.length > 0) return;
      out.lit("`", st.ts.value, line.slice(st.ts.rawStart, end), false, false, true);
      i = runStart = end;
      state.start = false;
      state.prev = VALUE;
    }
  }
  for (;;) {
    const event = nextEvent(line, i, ctx, state);
    const at = state.at;
    if (event === EVENT.EOL) {
      out.code(line.slice(runStart));
      return;
    }
    if (event === EVENT.LINE_COMMENT) {
      out.code(line.slice(runStart, at));
      return;
    }
    if (event === EVENT.BLOCK_COMMENT) {
      out.code(line.slice(runStart, at));
      const close = line.indexOf("*/", at + 2);
      ctx.steps += (close < 0 ? n : close + 2) - at;
      if (close < 0) {
        stack.push(C);
        st.openLine = number; // the outermost open state: the stack was empty here
        return;
      }
      i = runStart = close + 2;
      continue;
    }
    let literal = null;
    let quote = line[at];
    if (event === EVENT.QUOTE) {
      const end = lexQuoted(line, at, ctx);
      if (end < 0) { // an unterminated quote stops this line's reading
        out.code(line.slice(runStart));
        return;
      }
      literal = { end, value: decodeJs(line.slice(at + 1, end - 1)) };
    } else if (event === EVENT.BRACKET) {
      literal = tryJoinArray(line, at, ctx);
      if (literal === null) {
        i = at + 1;
        state.prev = OPENER;
        state.start = false;
        continue;
      }
      quote = literal.quote;
    } else { // a template: the code before it goes out first, then its body is read
      out.code(line.slice(runStart, at));
      runStart = at;
      st.ts = newTemplate(at, true);
      st.openLine = number; // the outermost open state: the stack was empty here
      stack.push(T);
      const end = lexTemplate(line, at + 1, st, out, ctx);
      if (stack.length > 0) return; // it goes on to the next line, and has said what it holds on this one
      literal = { end, value: st.ts.value };
    }
    const joined = chain(line, literal.end, literal.value, ctx, true, readLiteral, groupParens(line, at, ctx, true));
    out.code(line.slice(runStart, at));
    out.lit(quote, joined.value, line.slice(at, joined.end), plusFollows(line, joined.end, ctx));
    out.textOnly(")".repeat(joined.closers));
    out.textOnly(joined.carry);
    i = runStart = joined.end;
    state.prev = VALUE;
    state.start = false;
  }
}

/** The one `unreadable` finding of a file that ends inside `what` ("a block comment", "a template"), on the line where the outermost open state opened (D1). */
export const openState = (what, line) => [{ line, text: `the file ends inside ${what} that opens on line ${line}: the folded reading cannot tell what is code after it` }];

/** The state a line starts in: `code`, inside a `template` (at any depth) or inside a `comment` (a block comment). The guard's comment gate reads it (D4). */
const startState = (stack) => (stack.length === 0 ? "code" : stack[0] === C ? "comment" : "template");

function foldJs(lines, ctx) {
  const st = { stack: [], ts: null, openLine: 0 };
  const result = lines.map((line, index) => {
    const out = new Out(true);
    const start = startState(st.stack);
    scanJsLine(line, index + 1, st, out, ctx);
    return { ...out.finish(), start };
  });
  return { lines: result, unreadable: st.stack.length === 0 ? [] : openState(st.stack[0] === C ? "a block comment" : "a template", st.openLine) };
}


// --- the file ---------------------------------------------------------------------------------------------------------------

const FOLDERS = { js: foldJs, sh: foldSh, ps1: foldPs };

/**
 * Reads a whole file, once. `lines` are its lines (split on `\r?\n`); `extension` has its dot. Returns `null` for a kind that is not read, else
 * `{ lines: [{ text, code, literals, size, oversize }], unreadable: [{ line, text }] }` with one entry per line. `meter`, when given, is `{ steps }` and counts the characters the
 * reader looked at, so a test can prove it linear without a clock.
 */
export function foldFile(lines, extension, { meter } = {}) {
  const kind = foldKind(extension);
  if (kind === undefined) return null;
  const ctx = { steps: 0 };
  const result = FOLDERS[kind](lines, ctx);
  if (meter !== undefined) meter.steps += ctx.steps;
  return result;
}

// --- what the folded literals say -------------------------------------------------------------------------------------------

const WORD_RE = new RegExp(WORD, "gi");
const WHOLE_WORD = new RegExp(WORD, "i");
const isAlnum = (c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
/** The owner label key (`testsToDelete.owner`): a docker label's name, not a name and not a pattern. */
const LABEL_KEY = /^\.owner(?![a-z0-9])/i;
const OWNER_LETTER = /^[-_][uw]$/i;
/** After the separator, the class `[uw]` is an owner only with a digit form after it (`[0-9]` or `\d`, with or without a quantifier). */
const CLASS_OWNER = /^(?:[-_]|\[[-_]{2}\])\[uw\]/;
const DIGIT_FORM = /^(?:\[0-9\]|\\{1,4}d)/;
const PATTERN_TAIL = /[[(?*\\]/;
const TAIL_TOKEN = /^\S*/; // the tail of the word is the run of characters that touch it: `testsToDelete-u' + f()` is not a pattern because of the call a space away

/** Whether the text after the word, `rest` (up to the next occurrence of the word), is an owner or a narrow second segment, as the classifier reads it, with the `[uw]` class held to its digit form. */
function ownerAfter(rest) {
  const lower = rest.toLowerCase();
  if (verdictAfter(lower) === "broad") return false;
  const cls = CLASS_OWNER.exec(lower);
  return cls === null || DIGIT_FORM.test(lower.slice(cls[0].length));
}

/**
 * The bare word (D4): a literal that holds the whole word, with a boundary each side (no letter or digit touches it), followed by none of: the owner form or a narrow
 * second segment as the classifier reads it (`verdictAfter`; this covers the exempt, quarantine and proof marker words and `TESTSTODELETE_RUN`), `[uw]` with a digit form
 * after it, the label key `.owner`, the owner letter at the end of a literal that a `+` continues, prose (a space before the word, and after it a space, or `,` `.` `:` `)`
 * and then a space or the literal's end). What is left is `{ blind, legacy }`: a tail that holds `[`, `(`, `?`, `*` or `\` is a pattern and is `owner-blind` (the tail is the run of characters
 * that touch the word, up to the next space), unless `legacyAt(text)` says that `legacyNameHits` reads that same occurrence (`text` is the literal from the occurrence on: then it is `legacy-name`
 * alone, as `'testsToDelete-u*'` is at the release); the rest is `legacy-name`. `literals` are `[{ value, plus }]`.
 */
export function bareWordHits(literals, legacyAt = () => false) {
  const blind = [];
  const legacy = [];
  for (const { value, plus } of literals) {
    if (value.length < WORD.length) continue;
    const found = [...value.matchAll(WORD_RE)];
    found.forEach((match, index) => {
      const start = match.index;
      const stop = start + WORD.length;
      if ((start > 0 && isAlnum(value.charCodeAt(start - 1))) || (stop < value.length && isAlnum(value.charCodeAt(stop)))) return;
      const rest = value.slice(stop, index + 1 < found.length ? found[index + 1].index : value.length);
      const next = value[stop];
      const prose = start > 0 && /\s/.test(value[start - 1]) && next !== undefined && (/\s/.test(next) || (",.:)".includes(next) && (stop + 1 === value.length || /\s/.test(value[stop + 1]))));
      const letter = plus && value.length - stop === 2 && OWNER_LETTER.test(value.slice(stop));
      if (ownerAfter(rest) || LABEL_KEY.test(rest) || prose || letter) return;
      const pattern = PATTERN_TAIL.test(TAIL_TOKEN.exec(rest)[0]);
      if (pattern && legacyAt(value.slice(start))) return; // one cause, one class: legacyNameHits reads this occurrence
      (pattern ? blind : legacy).push(`${value.slice(start, stop)}${rest.slice(0, 3)}`);
    });
  }
  return { blind, legacy };
}

/** The shortest piece of the word a literal may hold. The measure of 2026-11-05 (`todo/PLAN_F30_folding_reader.md`): 5 hits product words, `sto` hits 2386 literals in one tree. */
export const MINIMUM_PIECE = 6;
const TESTS_END = 5; // `tests`
const DELETE_START = 7; // `delete`
const FORMS = ["testsToDelete", WORD, WORD.toUpperCase()]; // the word's own forms: camel, lower, upper
/** Every substring of a form that crosses the join of its two halves (not wholly inside `tests`, not wholly inside `Delete`) and has at least `MINIMUM_PIECE` characters, longest first. */
const PIECE_RES = FORMS.map((form) => {
  const pieces = [];
  for (let length = form.length; length >= MINIMUM_PIECE; length -= 1) {
    for (let at = 0; at + length <= form.length; at += 1) if (at + length > TESTS_END && at < DELETE_START) pieces.push(form.slice(at, at + length));
  }
  return new RegExp(`(?<![A-Za-z])(?:${pieces.join("|")})(?![A-Za-z])`);
});

/** A literal that holds a crossing piece of the word in one of its forms, no letter at its sides, and not the whole word: half of the prefix, however it was split. `literals` are `[{ value, plus }]`. */
export function pieceHits(literals) {
  return literals.flatMap(({ value }) => {
    if (value.length < MINIMUM_PIECE || WHOLE_WORD.test(value)) return [];
    for (const re of PIECE_RES) {
      const piece = re.exec(value);
      if (piece !== null) return [`${piece[0]} (a piece of the prefix word)`];
    }
    return [];
  });
}
