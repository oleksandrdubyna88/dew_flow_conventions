// Argument parsing of the toy greeter: `--name Ada --shout` -> { name: "Ada", shout: true }.
import { KNOWN_OPTIONS } from "./config.mjs";

const FLAGS = new Set(["shout"]);

/** Parse an argv list into overrides. Unknown options and missing values are errors, never ignored. */
export function parseArgs(argv) {
  const overrides = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const key = arg.slice(2);
    if (!KNOWN_OPTIONS.includes(key)) throw new Error(`Unknown option: ${arg}`);
    if (FLAGS.has(key)) {
      overrides[key] = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`Missing value: ${arg}`);
    overrides[key] = value;
    index += 1;
  }
  return overrides;
}
