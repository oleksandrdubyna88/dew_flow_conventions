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

/**
 * Text with fenced code blocks and inline code spans removed.
 *
 * Used where something inside a fence is being SHOWN rather than GIVEN: a marker in an example is
 * documentation, and a `#` comment in a shell sample is not a heading. Findings are the exception and
 * read the whole text, because a product name in an example is still a product name.
 */
export function outsideFences(text) {
  return folded(text).replace(/^```[\s\S]*?^```/gm, "").replace(/`[^`\n]*`/g, "");
}

/**
 * A body's markdown headings, in order.
 *
 * Fences are stripped first. Without that, `# @name vault_get_returns_the_callers_blob` inside an
 * `.http` sample is recorded as a heading — measured: four such lines across two rules — and editing
 * a comment in a code sample reports that the rule's HEADINGS changed.
 */
export function sectionsOf(body) {
  return outsideFences(body).split("\n").filter((line) => /^#{1,4} /.test(line));
}
