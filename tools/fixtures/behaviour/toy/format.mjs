// Output formatting of the toy greeter. Plain text only, one line.
import { withDefaults } from "./config.mjs";

/** The greeting line for a set of options. */
export function formatGreeting(options = {}) {
  const { greeting, name, punctuation, shout } = withDefaults(options);
  const line = `${greeting}, ${name}${punctuation}`;
  return shout ? line.toUpperCase() : line;
}

/** What the command line prints: the greeting and a trailing newline. */
export function render(options = {}) {
  return `${formatGreeting(options)}\n`;
}
