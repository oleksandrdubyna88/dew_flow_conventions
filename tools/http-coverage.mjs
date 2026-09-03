#!/usr/bin/env node
/**
 * Every HTTP route this repository serves has at least one request in `http/`.
 *
 * Enforces the coverage half of [common/http-contracts.md](../common/http-contracts.md). The rule's
 * trigger — "a new endpoint ships with its .http in the same commit" — is a habit, and a habit that
 * nothing checks is the failure `common/planning-docs.md` already measured twice.
 *
 * TWO SOURCES OF ROUTES, and the order matters:
 *
 *   --routes <file.json>   what the application itself says it serves. PREFERRED, and the shape
 *                          `common/testing.md` demands: "enumerate, never retype". A route added
 *                          without a request then cannot hide behind a scanner's blind spot.
 *   (nothing)              a text scan of the sources, as a bootstrap. It is a regex over
 *                          `MapGet("…")` / `.route("…")`, so it sees literal paths and nothing else.
 *
 * A repository graduates from the second to the first by teaching its host to print its route table.
 * Until then the scan's own blindness is guarded: finding ZERO routes in a tree that has sources is
 * reported as a configuration error, never as full coverage — a scan that matches nothing otherwise
 * passes forever.
 *
 * Usage (from a repository root):
 *
 *     node .claude/rules/shared/tools/http-coverage.mjs [options]
 *
 *       --http <dir>       the .http tree (default: http)
 *       --routes <file>    JSON route table: ["GET /api/x", …] or [{"method","path"}, …]
 *       --source <dir>     source tree to scan; repeatable (default: each existing src, src_… , hosts)
 *       --warn             report findings but exit 0 — the state a repository starts in
 *       -v, --verbose      also list what IS covered
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { collectRequests } from "./lib/http-files.mjs";

const SOURCE_EXTENSIONS = new Set([".cs", ".rs", ".ts", ".js", ".mjs", ".fs"]);
const SKIP_DIRS = new Set(["node_modules", ".git", "bin", "obj", "target", "dist", "artifacts", "external"]);

/** `MapGet("/api/x"` and friends. `\s*` spans newlines, so a call formatted across lines still matches. */
const DOTNET_MAP = /\bMap(Get|Post|Put|Delete|Patch|Head|Options)\s*(?:<[^>]*>)?\s*\(\s*"([^"]*)"/g;
/** axum's `.route("/x", get(handler))` — the method comes from the handler argument when it is there. */
const RUST_ROUTE = /\.route\s*\(\s*"([^"]*)"\s*,\s*(?:([a-z]+)\s*\()?/g;
/** `MapGroup("/api/mcp")` and axum's `.nest("/api", …)` — a route inside one carries only its TAIL. */
const GROUP_PREFIX = /\b(?:MapGroup|nest)\s*\(\s*"([^"]*)"/g;
/** `@uncovered DELETE /api/x — why` — a declaration that names the route it stands for. */
const DECLARED_ROUTE = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)\s*[—-]?\s*(.*)$/s;

const options = {
  http: { type: "string", default: "http" },
  routes: { type: "string" },
  source: { type: "string", multiple: true, default: [] },
  warn: { type: "boolean", default: false },
  verbose: { type: "boolean", short: "v", default: false },
};

function walkSources(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkSources(full, files);
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Route registrations found in source text. Literal paths only — that is the whole limitation.
 *
 * Every route also carries the GROUP PREFIXES declared in its file. A route mapped inside a group
 * holds only its tail (`/health`, served at `/api/mcp/health`), and a tail is indistinguishable from
 * an absolute path — both start with `/`. Measured on the `dew_flow_mcp` pilot: two routes reported
 * MISSING while a green suite was exercising both. Attaching the file's prefixes lets the match try
 * `prefix + tail` as well, which is far tighter than matching by suffix and guessing.
 */
export function scanRoutes(text, file = "") {
  const prefixes = [...text.matchAll(GROUP_PREFIX)].map((m) => m[1]).filter((p) => p.startsWith("/"));
  const routes = [];
  for (const match of text.matchAll(DOTNET_MAP)) {
    routes.push({ method: match[1].toUpperCase(), path: match[2], file, prefixes });
  }
  for (const match of text.matchAll(RUST_ROUTE)) {
    routes.push({ method: (match[2] ?? "any").toUpperCase(), path: match[1], file, prefixes });
  }
  return routes;
}

/** A path segment that stands for a value rather than being one: `{id}`, `:id`, `{}` from a variable. */
function isPlaceholder(segment) {
  return segment === "{}" || /^\{.*\}$/.test(segment) || /^:/.test(segment);
}

function isCatchAll(segment) {
  return /^\{\*/.test(segment) || segment === "*" || /^\*/.test(segment);
}

/** Does a request address this route? Segment by segment, with placeholders matching anything. */
export function pathsMatch(routePath, requestPath) {
  if (routePath === "" || requestPath === "") return false;
  const route = routePath.split("/").filter(Boolean);
  const request = requestPath.split("/").filter(Boolean);

  for (let i = 0; i < route.length; i += 1) {
    if (isCatchAll(route[i])) return true;
    if (i >= request.length) return false;
    if (isPlaceholder(route[i]) || isPlaceholder(request[i])) continue;
    if (route[i].toLowerCase() !== request[i].toLowerCase()) return false;
  }
  return route.length === request.length;
}

/**
 * A route mapped inside a group carries only its own tail (`""`, `"/{id}"`) because the prefix lives
 * on the `MapGroup` call. The scan cannot resolve that without parsing C#, so such a route is matched
 * by SUFFIX — deliberately loose. The `--routes` table is what removes the guesswork.
 */
function candidatePaths(route) {
  const prefixed = (route.prefixes ?? []).map((prefix) => {
    const base = prefix.replace(/\/+$/, "");
    if (route.path === "") return base;
    return route.path.startsWith("/") ? `${base}${route.path}` : `${base}/${route.path}`;
  });
  return [route.path, ...prefixed];
}

/** Does a declaration stand for this route? Same matching a request gets, prefixes included. */
function sameRoute(declaration, route) {
  if (declaration.method !== route.method && route.method !== "ANY" && route.method !== "") return false;
  return candidatePaths(route).some((candidate) => candidate !== "" && pathsMatch(candidate, declaration.path));
}

function matchesAnyRequest(route, requests) {
  const candidates = candidatePaths(route);
  return requests.some((request) => {
    if (route.method !== "ANY" && request.method !== route.method && route.method !== "") return false;
    if (candidates.some((candidate) => candidate !== "" && pathsMatch(candidate, request.path))) return true;
    // Last resort, and only for a tail the scan could not root: a group whose prefix is declared in
    // another file. Deliberately loose, and the reason `--routes` exists.
    return !route.path.startsWith("/") && route.path !== "" && request.path.endsWith(route.path);
  });
}

function loadRouteTable(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const list = Array.isArray(data) ? data : data.routes;
  if (!Array.isArray(list)) throw new Error(`${file} holds no array of routes`);
  return list.map((entry) => {
    if (typeof entry === "string") {
      const [method, routePath] = entry.trim().split(/\s+/);
      return { method: method.toUpperCase(), path: routePath ?? "", file };
    }
    return { method: String(entry.method ?? "ANY").toUpperCase(), path: entry.path ?? "", file };
  });
}

function defaultSources(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && (e.name === "src" || e.name === "hosts" || e.name.startsWith("src_")))
    .map((e) => path.join(root, e.name));
}

function main() {
  const { values: flags } = parseArgs({ options });
  const root = process.cwd();
  const httpRoot = path.resolve(root, flags.http);

  let routes;
  if (flags.routes) {
    routes = loadRouteTable(path.resolve(root, flags.routes));
    console.log(`http-coverage: ${routes.length} route(s) from ${flags.routes} (the application's own table).`);
  } else {
    const sources = (flags.source.length > 0 ? flags.source.map((s) => path.resolve(root, s)) : defaultSources(root))
      .filter((dir) => fs.existsSync(dir));
    const files = sources.flatMap((dir) => walkSources(dir));
    routes = files.flatMap((file) => scanRoutes(fs.readFileSync(file, "utf8"), path.relative(root, file)));

    if (routes.length === 0 && files.length > 0) {
      console.log(`http-coverage: scanned ${files.length} source file(s) and found NO route registrations.`);
      console.log("  Either this repository serves no HTTP (then drop this check from its CI), or the");
      console.log("  scan has stopped matching. A scan that matches nothing passes forever — so this is");
      console.log("  a configuration error, not coverage.");
      return 4;
    }
    if (routes.length === 0) {
      console.log("http-coverage: no sources and no routes — nothing to check.");
      return 0;
    }
    console.log(`http-coverage: ${routes.length} route registration(s) scanned from source (bootstrap mode).`);
    console.log("  Prefer --routes <file.json> printed by the application itself: enumerate, never retype.");
  }

  const { requests, uncovered } = fs.existsSync(httpRoot)
    ? collectRequests(httpRoot)
    : { requests: [], uncovered: [] };

  // An `@uncovered` line that NAMES a route — `@uncovered DELETE /api/x — why` — is a declared gap:
  // a decision on the record, for a route no request can reach (it needs a vector store, a card, a
  // second account). Without this the check could never be armed anywhere that has one, and a
  // permanently red check is one somebody switches off. A declaration that names only a status stays
  // what it was: a note, counted and not linked to any route.
  const declarations = uncovered
    .map((entry) => ({ ...entry, match: DECLARED_ROUTE.exec(entry.text) }))
    .filter((entry) => entry.match !== null)
    .map((entry) => ({
      method: entry.match[1].toUpperCase(),
      path: entry.match[2],
      why: entry.match[3]?.trim() ?? "",
      file: entry.file,
    }));

  const unmatched = routes.filter((route) => !matchesAnyRequest(route, requests));
  const declared = unmatched.filter((route) => declarations.some((d) => sameRoute(d, route)));
  const missing = unmatched.filter((route) => !declarations.some((d) => sameRoute(d, route)));
  const covered = routes.length - unmatched.length;

  console.log(`http-coverage: ${requests.length} request(s) in ${flags.http}, ${uncovered.length} @uncovered declaration(s).`);
  console.log(`http-coverage: ${covered}/${routes.length} route(s) covered, ${declared.length} declared.`);

  if (flags.verbose) {
    for (const route of routes.filter((r) => matchesAnyRequest(r, requests))) {
      console.log(`  covered    ${route.method} ${route.path}`);
    }
  }
  for (const route of declared) {
    const why = declarations.find((d) => sameRoute(d, route))?.why ?? "";
    console.log(`  DECLARED   ${route.method} ${route.path} — ${why}`);
  }
  for (const route of missing) {
    console.log(`  MISSING    ${route.method} ${route.path}${route.file ? `  (${route.file})` : ""}`);
  }

  if (missing.length === 0) return 0;
  console.log("");
  console.log(`${missing.length} route(s) have no request. http-contracts.md: an endpoint ships with its`);
  console.log(".http in the same commit — write them under http/<group>/, or declare the gap by naming");
  console.log("the route: `# @uncovered DELETE /api/x — why no request can reach it`.");
  return flags.warn ? 0 : 1;
}

// Only when run as a command. The pure halves — scanRoutes, pathsMatch — are imported by
// selftest.test.mjs, and a module that exits on import cannot be tested.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exit(main());
  } catch (error) {
    console.error(`http-coverage: ${error.message}`);
    process.exit(4);
  }
}
