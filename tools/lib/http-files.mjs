// Parsing `.http` files — shared by http-run.mjs (which selects requests by tag) and
// http-coverage.mjs (which reads their paths).
//
// ONE parser, not one per tool: the two need the same three facts out of a file — where a request
// block starts, what it is called, and what it is tagged — and a second reading of the same format
// is how the two drift into disagreeing about which requests exist.
//
// The format is httpyac's, which is the VS Code REST-Client format: `###` separates blocks, a block
// carries `# @name`-style metadata comments above its request line.

import * as fs from "node:fs";
import * as path from "node:path";

const REQUEST_LINE = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/;
const META_LINE = /^\s*#\s*@(\w+)(?:\s+(.*))?$/;

/** Directories never worth walking for `.http` files. */
const SKIP_DIRS = new Set(["node_modules", ".git", "bin", "obj", "target", "dist", "artifacts"]);

/** Every `.http` file under `root`, sorted so a run's order does not depend on the filesystem. */
export function findHttpFiles(root) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // an unreadable directory is not a finding for these tools to make
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".http")) {
        found.push(full);
      }
    }
  };
  walk(root);
  return found;
}

/**
 * Split a `.http` file into blocks.
 *
 * A block keeps its RAW text, separator line included, so a filtered subset can be written back out
 * as a valid `.http` file without re-rendering anything. Re-rendering is how a filter starts
 * changing the requests it was only supposed to select.
 *
 * A block with no request line is a PRELUDE — file-level variables and comments. Those are kept by
 * every filter, because dropping them silently unsets the variables the surviving requests use.
 */
export function parseHttpFile(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = { rawLines: [], meta: [], name: "", tags: new Set(), request: null };

  const push = () => {
    if (current.rawLines.length > 0) blocks.push(finish(current));
    current = { rawLines: [], meta: [], name: "", tags: new Set(), request: null };
  };

  for (const line of lines) {
    if (line.startsWith("###")) push();
    current.rawLines.push(line);

    const meta = META_LINE.exec(line);
    if (meta) {
      const [, tag, rest] = meta;
      current.tags.add(tag);
      if (tag === "name" && rest) current.name = rest.trim();
      if (tag === "uncovered") current.meta.push({ tag, text: (rest ?? "").trim() });
    }

    if (!current.request) {
      const request = REQUEST_LINE.exec(line);
      if (request) current.request = { method: request[1], target: request[2] };
    }
  }
  push();
  return blocks;
}

function finish(block) {
  return {
    raw: block.rawLines.join("\n"),
    name: block.name,
    tags: block.tags,
    request: block.request,
    uncovered: block.meta.filter((m) => m.tag === "uncovered").map((m) => m.text),
    isPrelude: block.request === null,
  };
}

/**
 * The text of a file reduced to its prelude plus the blocks carrying `# @<tag>`.
 *
 * Returns `""` when nothing matched, so a caller can tell "this file has no prod requests" from
 * "this file is all prod" without counting blocks itself.
 */
export function filterByTag(text, tag) {
  const blocks = parseHttpFile(text);
  const kept = blocks.filter((b) => b.isPrelude || b.tags.has(tag));
  if (!kept.some((b) => !b.isPrelude)) return "";
  return kept.map((b) => b.raw).join("\n");
}

/**
 * The route path a request line addresses, or `""` when it does not look like one.
 *
 * `{{baseUrl}}/api/vault?limit=5` → `/api/vault`, and an absolute URL loses its origin the same way.
 * A `{{variable}}` standing in for a path SEGMENT survives as `{}`, which is what lets a coverage
 * match treat it like the route template's own `{id}` placeholder.
 */
export function requestPath(target) {
  let rest = target.trim();
  rest = rest.replace(/^\{\{[^}]*\}\}/, "");              // {{baseUrl}}/api/x
  rest = rest.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, ""); // http://host:1234/api/x
  rest = rest.split(/[?#]/)[0];
  if (!rest.startsWith("/")) return "";
  rest = rest.replace(/\{\{[^}]*\}\}/g, "{}");             // a variable standing in for a segment
  return rest.length > 1 ? rest.replace(/\/+$/, "") : rest;
}

/**
 * Every request in a tree, and every `@uncovered` declaration, each carrying its file.
 *
 * They come back in separate lists rather than one tagged list: an `@uncovered` line is a statement
 * ABOUT a missing request, and a caller that has to filter it out of a request list is one `if` away
 * from counting a declared gap as coverage.
 */
export function collectRequests(root) {
  const requests = [];
  const uncovered = [];
  for (const file of findHttpFiles(root)) {
    for (const block of parseHttpFile(fs.readFileSync(file, "utf8"))) {
      if (block.request) {
        requests.push({
          file,
          name: block.name,
          method: block.request.method,
          path: requestPath(block.request.target),
          tags: block.tags,
        });
      }
      for (const text of block.uncovered) uncovered.push({ file, text });
    }
  }
  return { requests, uncovered };
}
