// Configuration defaults of the toy greeter. Every default lives here and nowhere else.
export const DEFAULTS = Object.freeze({
  name: "world",
  greeting: "Hello",
  punctuation: "!",
  shout: false,
});

/** A new options object: the defaults, then the overrides that are actually set. */
export function withDefaults(overrides = {}) {
  const defined = Object.entries(overrides).filter(([, value]) => value !== undefined);
  return { ...DEFAULTS, ...Object.fromEntries(defined) };
}

/** The option names the command line may set; `parseArgs` rejects everything else. */
export const KNOWN_OPTIONS = Object.freeze(Object.keys(DEFAULTS));
