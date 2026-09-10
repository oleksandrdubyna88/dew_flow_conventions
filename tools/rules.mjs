#!/usr/bin/env node
// The error boundary stays outside third-party imports so a fresh clone gets recovery guidance.
try {
  const { run } = await import("./lib/rule-cli.mjs");
  console.log(run(process.argv.slice(2)));
} catch (error) {
  const operation = ["check", "explain", "read"].includes(process.argv[2]) ? process.argv[2] : "usage";
  const hint = error.code === "ERR_MODULE_NOT_FOUND"
    ? " Run npm ci --ignore-scripts in the conventions checkout, then retry."
    : "";
  console.error(`rules ${operation}: INCOMPLETE — ${error.message}${hint}`);
  process.exitCode = 1;
}
