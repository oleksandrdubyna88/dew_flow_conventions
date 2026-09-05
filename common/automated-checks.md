# Automated checks — what a reviewer, a scanner or a bot reports is work, down to zero (MANDATORY)

> Extends [pull-requests.md](pull-requests.md), which governs how a change reaches `main`. This rule
> governs what the machinery around a repository REPORTS — CodeRabbit, SonarCloud, GitHub's security
> checks (Dependabot alerts, secret scanning, code scanning), the formatting and title checks in CI —
> and what those reports oblige you to do. Adopted 2026-09-05, when all of it was switched on at once
> across the family's public repositories.

## The rule

1. **A report is a task, not a notification.** Every open item — a CodeRabbit thread, a SonarCloud
   issue or a failed quality gate, a Dependabot alert, a secret-scanning alert, a code-scanning alert,
   a red formatting or title check — is fixed, updated or answered until the count is **zero**. A
   repository with open items is a repository with work in it that nobody has claimed.
2. **Verify before you fix.** Each item is first checked for accuracy (does the code do what the
   report says?) and for rightness (does this repository's rule agree — `CLAUDE.md`,
   `.claude/rules/**`?). A report that is accurate and right is fixed. A report that is wrong is
   answered where it was made — the thread, the issue's *resolve as false positive / won't fix* with a
   reason, the alert's dismissal with a reason — and that reason names the code or the rule.
3. **When the fix would break the product, stop and ask.** If honouring a report would break this
   family's logic — the trust boundary in the vault, the Native AOT constraint on the gate, the
   run-tests-as-executables rule, a measured decision recorded in `research/` — or would leave the
   application inoperable, the item is NOT fixed to make a number go down. It is put to the person,
   with the report, the code and the rule side by side, and the outcome is one of two things: the code
   changes because the person agreed, or **the rule changes** so that the report stops being raised —
   a suppression with a reason in the tool's own configuration (`.coderabbit.yaml`, the SonarCloud
   quality profile or `sonar.issue.ignore.*`, the Dependabot `ignore` list) and a sentence here or in
   the repository's rules saying why.
4. **Updates are the same rule.** A Dependabot pull request is merged when its checks are green and
   nothing in the family's pins forbids it (FluentAssertions stays on 7.x; Aspire bumps as a pair);
   otherwise it is closed with the reason on it. A security alert is not left open because the bump is
   inconvenient.
5. **Zero is checked, not assumed.** Before a release, and at the end of any autonomous task on the
   repository, the counts are read — `gh pr view --comments`, SonarCloud's project page or
   `api/issues/search`, `gh api repos/{owner}/{repo}/dependabot/alerts?state=open`,
   `…/secret-scanning/alerts?state=open`, `…/code-scanning/alerts?state=open` — and the numbers go into
   the pull request description or the task's summary. A number nobody read is a number nobody can
   trust.

## For an agent working autonomously

The *Work autonomously* order names the pull request; this rule names what comes back on it. Open the
pull request, wait about five minutes, read every report, verify each, fix or answer, and if anything
would break the product — ask, with the evidence, rather than deciding alone. A green check bought by
weakening an assertion, suppressing a rule without a reason, or reformatting a test until it passes is
the one forbidden move; it turns the machinery into decoration.

## Never

- Never dismiss, resolve or suppress a report without a written reason that names the code or the rule.
- Never weaken a test, a rule or a quality gate to make a report disappear.
- Never leave a security alert open because the fix is inconvenient — fix it or bring it to the person.
- Never call a repository done with open items you have not read.

## Definition of Done

- [ ] Every CodeRabbit thread on the pull request is fixed or answered with a reason, and resolved.
- [ ] SonarCloud's quality gate passes and its new-code issues are zero — or each remaining one is
      resolved with a reason in SonarCloud.
- [ ] Dependabot, secret-scanning and code-scanning alerts are zero, or each open one has a reason and
      an owner.
- [ ] Anything that could not be fixed without breaking the product was put to the person, and the
      rule was changed rather than the number.
- [ ] The counts were read and written into the pull request description or the task summary.

## Mirrors

A shared rule, mounted through the `.claude/rules/shared` submodule. Repositories where these tools are
on today: `dew_flow_connect_other_ais`, `dew_flow_conventions`, `dew_flow_creds_for_devs` (CodeRabbit,
SonarCloud, GitHub security checks); every `dew_flow_*` repository (Dependabot alerts and automated
security fixes, secret scanning where GitHub allows it).
