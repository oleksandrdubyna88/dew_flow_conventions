// rule-body.mjs — what a rule's body IS, in one place.
//
// Three things read these files and every one of them had its own answer. The resolver folded CRLF
// and stripped frontmatter; the ownership check anchored on `\n` and did not fold, which made it
// silently blind on a Windows working copy; the body freeze folded and stripped again, in its own
// copy of the same two expressions.
//
// Two reviewers found the consequence independently: if the resolver ever normalises differently,
// the freeze hashes bytes that are not what six repositories load, and it blesses or refuses a policy
// change on the wrong evidence. So the definition lives here, and everything calls it.
//
// Dependency-free on purpose. The ownership check runs BEFORE `npm ci` — that is what lets it be the
// first step in the job — so anything it imports must import nothing itself.

/**
 * Line endings folded.
 *
 * `core.autocrlf` rewrites this corpus on checkout, so one file is LF on CI and CRLF on the machine
 * somebody is editing it on. Every pattern over these files anchors on `\n`.
 */
export const folded = (text) => text.replaceAll("\r\n", "\n");

/** A rule's body: what is left after the frontmatter, folded. This is what gets hashed and loaded. */
export function bodyOf(text) {
  return folded(text).replace(/^---\n[\s\S]*?\n---\n/, "");
}

// A fence opens on 0-3 spaces and three or more backticks or tildes; it closes on 0-3 spaces, the SAME character, at
// least as many of them, and nothing else but whitespace (CommonMark). Four spaces is an indented code block, not a fence.
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

/**
 * Text with fenced code BLOCKS removed. What is left includes inline spans, backticks and all.
 *
 * Every line of a fence — opener, content, closer — becomes an EMPTY line, so what is left keeps the file's line
 * numbers (the plan-change check says "line 90" and means the file's). An unclosed fence runs to the end of the text,
 * as a renderer draws it.
 *
 * This is the ONE fence definition: the heading list, the marker reader and the plan ledger all read through it, so no
 * two of them can disagree about whether a line is inside a block. It used to know only column-0 triple backticks,
 * non-greedy. Measured on 2026-10-28 over the `todo/` and `research/` folders of eight checkouts, that missed 213
 * indented fence lines and three four-backtick fences — a renderer hides their content, and a check that read it would
 * be a false red — and a four-backtick fence holding a triple-backtick line closed early and leaked the lines after it.
 * Over the 38 rule files no recorded heading list changed (`node tools/rule-bodies.mjs` stays in step), so the
 * widening cost nothing recorded.
 */
export function outsideFencedBlocks(text) {
  let fence = null; // the opener's marker while a fence is open
  return folded(text)
    .split("\n")
    .map((line) => {
      if (fence === null) {
        const open = FENCE_OPEN.exec(line);
        // a backtick fence's info string may not hold a backtick: that line is inline code, not an opener
        if (open === null || (open[1].startsWith("`") && open[2].includes("`"))) return line;
        fence = open[1];
        return "";
      }
      const close = FENCE_CLOSE.exec(line);
      if (close !== null && close[1].startsWith(fence[0]) && close[1].length >= fence.length) fence = null;
      return "";
    })
    .join("\n");
}

/**
 * Text with fenced code blocks AND inline code spans removed.
 *
 * Used for markers, where something inside backticks is being SHOWN rather than GIVEN: the rule that
 * documents the `owns:` syntax was reported as carrying a malformed marker, by the check it defines.
 * Findings are the exception and read the whole text, because a product name in an example is still a
 * product name.
 */
export function outsideFences(text) {
  return outsideFencedBlocks(text).replace(/`[^`\n]*`/g, "");
}

/**
 * A body's markdown headings, in order.
 *
 * Fenced BLOCKS are stripped and inline spans are not, and the difference is the whole of it. Without
 * the first, `# @name vault_get_returns_the_callers_blob` inside an `.http` sample is recorded as a
 * heading — measured: four such lines across two rules. With the second, a heading loses the words it
 * is about: '### 7. `git status` answers WHAT' was recorded as '### 7.  answers WHAT', six times
 * across five rules, which an automated reviewer caught by reading the manifest diff. A fence is a
 * block being shown; an inline span inside a heading is part of the heading.
 */
export function sectionsOf(body) {
  return outsideFencedBlocks(body).split("\n").filter((line) => /^#{1,4} /.test(line));
}
