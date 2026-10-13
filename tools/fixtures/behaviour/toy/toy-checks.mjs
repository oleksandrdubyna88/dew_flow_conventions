// The toy's own checks. Run with: node --test tools/fixtures/behaviour/toy/toy-checks.mjs
// The name avoids node's default test globs on purpose: the repository's `npm test` never runs the toy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "./args.mjs";
import { withDefaults } from "./config.mjs";
import { formatGreeting, render } from "./format.mjs";

test("the default greeting greets the world", () => {
  assert.equal(formatGreeting(), "Hello, world!");
});

test("--shout upper-cases the whole line", () => {
  assert.equal(formatGreeting(parseArgs(["--shout"])), "HELLO, WORLD!");
});

test("--name replaces the name and keeps the other defaults", () => {
  assert.equal(formatGreeting(parseArgs(["--name", "Ada"])), "Hello, Ada!");
});

test("an unknown option is an error, not a silent default", () => {
  assert.throws(() => parseArgs(["--colour", "red"]), /Unknown option/);
});

test("render ends with one newline and withDefaults ignores undefined overrides", () => {
  assert.equal(render({ name: undefined }), "Hello, world!\n");
  assert.equal(withDefaults({ name: undefined }).name, "world");
});
