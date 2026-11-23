# Retired installer — frozen copy of the old agent-models session step

These six files are the agent-models installer as released in commit `c598a11` (the last release that ships it,
the pin every consumer holds), taken with `git show c598a11:settings/hooks/<path>`. No byte is edited:

- `hooks/ensure-user-guard.mjs`
- `hooks/lib/user-guard-install.mjs`
- `hooks/lib/agent-models-decide.mjs`
- `hooks/lib/agent-models-read.mjs`
- `hooks/lib/agent-models-swap.mjs`
- `hooks/lib/agent-models-install.mjs`

**Never wired, never copied to a consumer.** The only reader is `tools/mods-marketplace-step.test.mjs`. It runs
the old step (`ensureAgentModelsMod`) against the same home as the new step, to prove that the tombstone in
`~/.claude/mods/agent-models.optout` stops a consumer on an old pin from installing the mod again. That test is
the second implementation of the marker contract (`common/testing.md`: two implementations of one contract).

The mod bytes are not stored here. The control case reads the seven 1.4.0 mod files from git history at test
time (`git show c598a11:mods/agent-models/<file>`), so the history of `c598a11` must be present in the clone
that runs the tests.
