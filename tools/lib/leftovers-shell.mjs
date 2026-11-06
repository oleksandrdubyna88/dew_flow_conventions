/**
 * The line-level helpers the scan and the docker pass share (`tools/leftovers-check.mjs`, `tools/lib/leftovers-docker.mjs`): the owner-form name test, a finding, what a
 * comment line is, and the reading of a shell value that is wholly an expansion (`"${x}"`, `"$(f a)"`) or has a literal default. Moved whole out of the guard so it
 * stays under the file-size limit of the coding style. F30 made two readings linear on a line that repeats them, with the same answers on what a person writes: `composeEnvHits` and `maskExpansions`.
 */

export const PREFIX_OK = /^teststodelete[-_][uw][0-9]{1,10}[-_]/i; // the OWNER form: one of the three spellings, then an owner segment
export const DYNAMIC = "«value»";
/** A name the guard may accept: one of the three spellings, a value an argument array hides from it, or a value that is wholly a shell expansion (never guessed at). */
export const nameOk = (name) => PREFIX_OK.test(name) || name === DYNAMIC || isDynamicName(name);
export const isComment = (line) => /^\s*(?:\/\/|#|-- |--$)/.test(line);
export const finding = (file, line, cls, text) => ({ file, line, cls, text });

// A value that is wholly a shell expansion — `"${x}"`, `$x`, `"$(f a b)"` — is dynamic: a text scan cannot know what it builds, the way it cannot
// know a JavaScript array item that is no literal. The consumer's own tests cover the helper that builds it. A value that MIXES literal text and an
// expansion is not wholly one, and is judged as it always was, on the text it has. Two exceptions, both about what the text itself says:
//   * `${V:-w}`, `${V-w}`, `${V:=w}`, `${V=w}` with a default `w` that holds no `$` and is not empty names `w` whenever V is unset, so `w` is judged as a name
//     (a default in the owner form passes; any other default is a finding). `$(…)`, a default with a `$` in it and `${V:+w}` stay dynamic:
//     a known limit of a text scan, which cannot run the command or know the environment.
//   * a single-quoted `'${x}'` is no expansion to the shell: it is the literal text `${x}` and is judged as text.
export const SIMPLE_VARIABLE = /^\$[A-Za-z_][A-Za-z0-9_]*$/;
export const LITERAL_DEFAULT = /^\$\{[A-Za-z_][A-Za-z0-9_]*:?[-=]([^${}]+)\}$/;
export const MASK = "\u0001";
export const LITERAL_DOLLAR = "\u0002";

/** `text` with the `$` inside every single-quoted span made `LITERAL_DOLLAR` — the shell does not expand there. A quote inside double quotes opens nothing. */
export function literalizeSingleQuoted(text) {
  let out = "";
  let quote = "";
  for (const char of text) {
    if (quote === "") {
      if (char === "'" || char === '"') quote = char;
      out += char;
    } else if (char === quote) {
      quote = "";
      out += char;
    } else out += quote === "'" && char === "$" ? LITERAL_DOLLAR : char;
  }
  return out;
}

export const restoreDollar = (text) => text.replaceAll(LITERAL_DOLLAR, "$");

/** The literal default of an expansion (`${V:-w}` → `w`), or undefined when it has none, an empty one, or one that holds a `$`. */
export const literalDefault = (expansion) => LITERAL_DEFAULT.exec(expansion)?.[1];

/** Is `value` a whole expansion that may stay unjudged: a default it has is in the owner form. */
export function isDynamicName(value) {
  if (!isWholeExpansion(value)) return false;
  const fallback = literalDefault(value.replace(/^["']+|["']+$/g, ""));
  return fallback === undefined || PREFIX_OK.test(fallback);
}

/** The index of the bracket that closes the one at `open` (`(` or `{`), nesting counted, or -1 when it never closes. */
export function closingOf(text, open) {
  const up = text[open];
  const down = up === "(" ? ")" : "}";
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === up) depth += 1;
    else if (text[index] === down && (depth -= 1) === 0) return index;
  }
  return -1;
}

/** Is `value` (outer quotes ignored) ONE shell expansion from its first character to its last? An expansion that never closes is not. */
export function isWholeExpansion(value) {
  const bare = value.replace(/^["']+|["']+$/g, "");
  if (SIMPLE_VARIABLE.test(bare)) return true;
  return /^\$[({]/.test(bare) && closingOf(bare, 1) === bare.length - 1;
}

/** Every `(` and `{` of `text` with its closer, in one pass: what `closingOf` answers for each, which a test compares. Asked once per opener, `closingOf` is quadratic on a line of openers that never close (F30). */
export function closersOf(text) {
  const closers = new Map();
  const open = { "(": [], "{": [] };
  const opener = { ")": "(", "}": "{" };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "(" || char === "{") open[char].push(index);
    else if (char === ")" || char === "}") {
      const at = open[opener[char]].pop();
      if (at !== undefined) closers.set(at, index);
    }
  }
  return closers;
}

/** `text` with the whitespace inside every balanced `$(…)` and `${…}` made `MASK`, so that splitting on whitespace keeps an expansion in one word. */
export function maskExpansions(text) {
  const closers = closersOf(text);
  let masked = "";
  for (let index = 0; index < text.length; index += 1) {
    const end = text[index] === "$" && (text[index + 1] === "(" || text[index + 1] === "{") ? closers.get(index + 1) ?? -1 : -1;
    if (end < 0) masked += text[index];
    else {
      masked += text.slice(index, end + 1).replace(/\s/g, MASK);
      index = end;
    }
  }
  return masked;
}

/** How many characters at the start of `rest` are a whole expansion that ends the value (a quote, a space, `;` `,` `}` or the end follows). 0 when none. */
export function leadingExpansion(rest) {
  const end = /^\$[({]/.test(rest) ? closingOf(rest, 1) + 1 : /^\$[A-Za-z_][A-Za-z0-9_]*/.exec(rest)?.[0].length ?? 0;
  return end > 0 && /^(?:[\s"';,}]|$)/.test(rest.slice(end)) ? end : 0;
}

const COMPOSE_ASSIGNMENTS_READ = 64; // a person writes one or two on a line. One reading can cost the rest of the line, so a line that repeats it is a named hit, not a hang (F30)
const VALUE_SHOWN = 200; // the hit names the value; a long one is cut in the text, so the hits of one line stay small

const shown = (value) => (value.length > VALUE_SHOWN ? `${value.slice(0, VALUE_SHOWN)}…` : value);

/** `COMPOSE_PROJECT_NAME=x` or `: x` on a line: one hit when x is not an owner-form leftover name — a compose project's containers carry the project's name. A line that assigns it more than `COMPOSE_ASSIGNMENTS_READ` times is one more hit that says so. */
export function composeEnvHits(line) {
  const matches = [...line.matchAll(/COMPOSE_PROJECT_NAME["']?\s*[:=]\s*["']?/g)];
  if (matches.length === 0) return [];
  const literal = literalizeSingleQuoted(line); // once for the line: per assignment it was quadratic on a repeated one
  const hits = matches.slice(0, COMPOSE_ASSIGNMENTS_READ).flatMap((match) => {
    const rest = literal.slice(match.index + match[0].length);
    const length = leadingExpansion(rest);
    if (length > 0) {
      const fallback = literalDefault(rest.slice(0, length));
      return fallback === undefined || PREFIX_OK.test(fallback) ? [] : [`COMPOSE_PROJECT_NAME defaults to a name that is not an owner-form leftover name: ${shown(fallback)}`];
    }
    const value = /^[^\s"';,}]*/.exec(rest)[0];
    return PREFIX_OK.test(value) ? [] : [`COMPOSE_PROJECT_NAME is not an owner-form leftover name: ${value === "" ? "(empty)" : shown(restoreDollar(value))}`];
  });
  return matches.length > COMPOSE_ASSIGNMENTS_READ ? [...hits, `COMPOSE_PROJECT_NAME is assigned ${matches.length} times on this line: only the first ${COMPOSE_ASSIGNMENTS_READ} are read`] : hits;
}

