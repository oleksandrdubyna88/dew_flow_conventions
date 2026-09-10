# Shared rules resolver

`tools/rules.mjs check|explain|read --repo PATH --task NAME --file ROOT_RELATIVE_PATH`
discovers the target Git root, checks the instruction adapters and submodule, validates
metadata, selects rules and optionally returns their canonical text. Tasks/files repeat.
`--only ID` bounds one read without changing the selected scope.

`tools/lib/rule-catalog.mjs` owns task vocabulary, YAML validation, glob matching,
dependency expansion, source hashes and payload budgets. It uses `yaml` (ISC) and
`picomatch` (MIT), exact versions in `package-lock.json`, installed with lifecycle scripts
disabled. These capabilities were absent from the existing tools; a second custom YAML
parser or glob engine was avoided. Existing lexical path validation is reused from
`tools/lib/paths.mjs`, supplemented with real-path checks for instruction sources.

Metadata keys: `id`, `load`, optional `paths`, `tasks`, `depends`. Unknown fields/tasks,
duplicate ids/keys, empty bodies, missing dependencies and cycles are errors even in
unselected rules. All Markdown in the four rule directories must declare metadata.
Local rules use the same schema and `local.*` ids. The migration inventory records every
original rule section and body hash; it is historical evidence, not a second selector.

Limits: 2 KiB metadata per file, 256 KiB per source, 256 sources / 4 MiB catalog,
16 KiB always core, 256 KiB manifest, 32 KiB canonical text per read. Overflow fails
explicitly. The resolver does not persist artifacts and therefore has no retention job.

Consumer SHA verification compares the actual checkout to the index gitlink and reports
the HEAD pin separately. A staged migration is named as staged, not as committed. A dirty
mounted source fails; source-repository development is explicitly labelled working-tree mode.
Global/managed instruction policy is not visible to this process. `resolved` means source
selection succeeded, not that an agent read or complied with it.

References: [yaml parser](https://eemeli.org/yaml/),
[picomatch](https://github.com/micromatch/picomatch),
[Codex instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[Claude imports](https://code.claude.com/docs/en/memory#agentsmd).
