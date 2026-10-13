# toy greeter

A tiny command-line greeter used as a frozen task for the behaviour smoke. It is not part of the product.

## Usage

```
node toy --name Ada --shout
```

| Option | Meaning | Default |
|---|---|---|
| `--name <text>` | who to greet | `world` |
| `--greeting <text>` | the opening word | `Hello` |
| `--punctuation <text>` | the closing mark | `!` |
| `--shout` | upper-case the line | off |

Output is one plain-text line. Unknown options are errors.

## Files

- `args.mjs` parses the command line into overrides.
- `config.mjs` holds every default.
- `format.mjs` turns options into the output line.
- `toy-checks.mjs` holds the checks (`node --test tools/fixtures/behaviour/toy/toy-checks.mjs`).
