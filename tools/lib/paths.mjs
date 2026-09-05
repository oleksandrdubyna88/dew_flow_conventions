/**
 * A path a CLI flag named, resolved and REQUIRED to stay inside the repository it is run against.
 *
 * Every tool here takes paths from its arguments — a suite root, an artifacts directory, a route
 * table, a checklist — resolves them and then reads, writes or in one case `rm -rf`s them. SonarCloud
 * (S8707, 2026-09-05) put it plainly: a path canonicalised from CLI-controlled data must be validated
 * before use, and "LLMs running this code with faulty CLI arguments can escape file system
 * restrictions". An agent IS the usual caller of these tools. So there is one door: a path either
 * resolves under `root`, or the tool stops with a named finding before touching anything.
 */
import * as path from "node:path";

/**
 * `candidate` resolved against `root`, or an Error naming both when it would leave `root`.
 *
 * `root` itself is allowed (`within(root, ".")` is `root`); a parent, a sibling or an absolute path
 * elsewhere is not. A symlink that escapes is not followed here — the check is lexical, which is
 * what the finding asked for and what a CI run over its own checkout needs.
 */
export function within(root, candidate, what = "path") {
  const base = path.resolve(root);
  const resolved = path.resolve(base, candidate);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error(`${what} "${candidate}" resolves to ${resolved}, outside the repository ${base}`);
  }
  return resolved;
}
