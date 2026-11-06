// The shell, workflow and PowerShell scanners of the folding reader (`tools/lib/leftovers-fold.mjs`, D1 of `todo/PLAN_F30_folding_reader.md`): the same forward-only walk as the JavaScript scanner, for
// `.sh` (and yaml, which reads as `.sh`) and `.ps1`. Split out of the fold file so each stays under the style maximum of 800 lines (the first commit of epoch 3 moved the code; later commits changed it with the rest of the reader).
// The fold file imports `foldSh` and `foldPs`; this file imports the shared operand and output helpers from the fold file. Each side uses the other only at call time, so the import cycle is safe
// (the two scanners are function declarations, which exist before either module runs).

import { BACKSLASH, C, Out, chain, decodeAnsi, groupParens, isQuote, isSpace, openState, plusFollows, readOperand, skipSpaces } from "./leftovers-fold.mjs";

/** A PowerShell literal that opens at `at` and closes on this line: `{ end, value }` (the body as written: no decoding), or null. */
function readPsLiteral(line, at, ctx) {
  const n = line.length;
  const quote = line.charCodeAt(at);
  if (!isQuote(quote)) return null;
  let j = at + 1;
  while (j < n) {
    const c = line.charCodeAt(j);
    if (quote === 34 && c === 96) j += 2;
    else if (c === quote) {
      if (line.charCodeAt(j + 1) === quote) j += 2;
      else {
        ctx.steps += j - at;
        return { end: j + 1, value: line.slice(at + 1, j), quote: line[at] };
      }
    } else j += 1;
  }
  ctx.steps += n - at;
  return null;
}

// --- shell and workflow lines -----------------------------------------------------------------------------------------------

const SH_DELIMITER = new Set([32, 9, 59, 38, 124, 60, 62, 40, 41]); // space, tab, ; & | < > ( )

/**
 * The shell word that starts at `at` (its first character is no delimiter): `{ end, value, quote, prefix }`, where `quote` is "" for a word with no quoted piece, or
 * `undefined` when a quote never closes. The touching pieces, quoted or not, are one value; `prefix` is where the literal starts: an `=` before the first quote ends the code
 * before it (`P='a''b'` keeps `P=` as code).
 */
function readShWord(line, at, ctx) {
  const n = line.length;
  let j = at;
  let value = "";
  let quote = "";
  let prefix = at;
  let run = at;
  const flush = (to) => {
    if (to > run) value += line.slice(run, to);
  };
  while (j < n) {
    const c = line.charCodeAt(j);
    if (SH_DELIMITER.has(c)) break;
    if (c === BACKSLASH) {
      flush(j);
      value += j + 1 < n ? line[j + 1] : "\\";
      j += 2;
      run = j;
    } else if (c === 39) {
      flush(j);
      const close = line.indexOf("'", j + 1);
      if (close < 0) {
        ctx.steps += n - at; // a failed word has cost the scan to the line's end
        return undefined;
      }
      ctx.steps += close - j;
      if (quote === "") quote = "'";
      value += line.slice(j + 1, close);
      j = close + 1;
      run = j;
    } else if (c === 34) {
      flush(j);
      let k = j + 1;
      let from = k;
      let piece = "";
      while (k < n && line.charCodeAt(k) !== 34) {
        if (line.charCodeAt(k) === BACKSLASH && k + 1 < n && "$`\"\\".includes(line[k + 1])) {
          piece += line.slice(from, k) + line[k + 1];
          k += 2;
          from = k;
        } else k += line.charCodeAt(k) === BACKSLASH ? 2 : 1;
      }
      if (k >= n) {
        ctx.steps += n - at;
        return undefined;
      }
      ctx.steps += k - j;
      if (quote === "") quote = '"';
      value += piece + line.slice(from, k);
      j = k + 1;
      run = j;
    } else if (c === 36 && line.charCodeAt(j + 1) === 39) {
      flush(j);
      let k = j + 2;
      while (k < n && line.charCodeAt(k) !== 39) k += line.charCodeAt(k) === BACKSLASH ? 2 : 1;
      if (k >= n) {
        ctx.steps += n - at;
        return undefined;
      }
      ctx.steps += k - j;
      if (quote === "") quote = "'";
      value += decodeAnsi(line.slice(j + 2, k));
      j = k + 1;
      run = j;
    } else {
      if (c === 61 && quote === "") { // an `=` before the first quote ends the code prefix
        prefix = j + 1;
        value = "";
        run = j + 1;
      }
      j += 1;
    }
  }
  flush(Math.min(j, n));
  ctx.steps += Math.min(j, n) - at;
  return { end: Math.min(j, n), value, quote, prefix };
}

function scanShLine(line, out, ctx) {
  const n = line.length;
  let i = 0;
  let runStart = 0;
  let wordStart = true;
  while (i < n) {
    const c = line.charCodeAt(i);
    ctx.steps += 1;
    if (SH_DELIMITER.has(c)) {
      i += 1;
      wordStart = true;
    } else if (c === 35 && wordStart) { // a comment: the rest of the line
      out.code(line.slice(runStart, i));
      return;
    } else {
      const word = readShWord(line, i, ctx);
      if (word === undefined) { // a quote with no closer: the rest of the line is not read
        out.code(line.slice(runStart));
        return;
      }
      if (word.quote !== "") {
        out.code(line.slice(runStart, word.prefix));
        out.lit(word.quote, word.value, line.slice(word.prefix, word.end), false);
        runStart = word.end;
      }
      i = word.end;
      wordStart = false;
    }
  }
  out.code(line.slice(runStart));
}

export function foldSh(lines, ctx) {
  const result = lines.map((line) => {
    const out = new Out(false);
    scanShLine(line, out, ctx);
    return { ...out.finish(), start: "code" };
  });
  return { lines: result, unreadable: [] };
}

// --- PowerShell -------------------------------------------------------------------------------------------------------------

/**
 * `"a", "b" -join ""` that starts with the literal `first`: the items may each sit in parentheses, the whole list may, the operator may have no space at its sides, and its separator may
 * sit in parentheses. `own` is the number of groups right before `first` (`groupParens`): the closers of the list may close those and no others, because a call is not a parenthesis.
 * Returns `{ end, value, left }` (`left`: the groups not closed), or `{ fail }` with the index its reading reached.
 */
function tryPsJoin(line, first, ctx, own) {
  const items = [first.value];
  let left = own;
  let j = first.end;
  for (;;) {
    let k = skipSpaces(line, j, ctx);
    let closers = 0;
    while (line.charCodeAt(k) === 41) {
      closers += 1;
      k = skipSpaces(line, k + 1, ctx);
    }
    if (closers > left) return { fail: k };
    left -= closers;
    if (line.charCodeAt(k) === 44) {
      const lit = readOperand(line, k + 1, ctx, readPsLiteral);
      if (lit === null) return { fail: k };
      items.push(lit.value);
      j = lit.end;
      continue;
    }
    if (line.slice(k, k + 5).toLowerCase() !== "-join" || !(isSpace(line.charCodeAt(k + 5)) || isQuote(line.charCodeAt(k + 5)) || line.charCodeAt(k + 5) === 40)) return { fail: k };
    const separator = readOperand(line, k + 5, ctx, readPsLiteral);
    if (separator === null) return { fail: k };
    return { end: separator.end, value: items.join(separator.value), left };
  }
}

function scanPsLine(line, number, st, out, ctx) {
  const n = line.length;
  let i = 0;
  let runStart = 0;
  let failedUntil = -1; // a list that failed at its first literal fails from every later literal of it too: no second try
  if (st.stack.length > 0) {
    const close = line.indexOf("#>");
    ctx.steps += close < 0 ? n : close + 2;
    if (close < 0) return;
    st.stack.pop();
    i = runStart = close + 2;
  }
  let boundary = true; // `#` starts a comment only at the start of a token
  while (i < n) {
    const c = line.charCodeAt(i);
    ctx.steps += 1;
    if (c === 60 && line.charCodeAt(i + 1) === 35) { // <#
      out.code(line.slice(runStart, i));
      const close = line.indexOf("#>", i + 2);
      ctx.steps += (close < 0 ? n : close + 2) - i;
      if (close < 0) {
        st.stack.push(C);
        st.commentLine = number;
        return;
      }
      i = runStart = close + 2;
      boundary = true;
    } else if (c === 35 && boundary) {
      out.code(line.slice(runStart, i));
      return;
    } else if (isQuote(c)) {
      const first = readPsLiteral(line, i, ctx);
      if (first === null) { // a quote with no closer: the rest of the line is not read
        out.code(line.slice(runStart));
        return;
      }
      let end = first.end;
      let value = first.value;
      let tail = "";
      const own = groupParens(line, i, ctx, false);
      let left = own;
      if (i >= failedUntil) {
        const list = tryPsJoin(line, first, ctx, own);
        if (list.fail !== undefined) failedUntil = list.fail;
        else {
          end = list.end;
          value = list.value;
          left = list.left;
          tail = ")".repeat(own - list.left);
        }
      }
      const next = chain(line, end, value, ctx, false, readPsLiteral, left);
      out.code(line.slice(runStart, i));
      out.lit(line[i], next.value, line.slice(i, next.end), plusFollows(line, next.end, ctx));
      out.textOnly(tail + ")".repeat(next.closers));
      i = runStart = next.end;
      boundary = false;
    } else {
      boundary = isSpace(c) || c === 40 || c === 123 || c === 59 || c === 124 || c === 44;
      i += 1;
    }
  }
  out.code(line.slice(runStart));
}

export function foldPs(lines, ctx) {
  const st = { stack: [], commentLine: 0 };
  const result = lines.map((line, index) => {
    const out = new Out(false);
    const start = st.stack.length > 0 ? "comment" : "code";
    scanPsLine(line, index + 1, st, out, ctx);
    return { ...out.finish(), start };
  });
  return { lines: result, unreadable: st.stack.length > 0 ? openState("a block comment", st.commentLine) : [] };
}
