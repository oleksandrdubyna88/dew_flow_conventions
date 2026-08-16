# Security Guidelines

## Mandatory checks before ANY commit

- [ ] No hardcoded secrets (API keys, passwords, tokens, connection strings)
- [ ] All user inputs validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized HTML)
- [ ] Authentication/authorization verified where the surface has any
- [ ] Error messages don't leak sensitive data

## Secret management

- NEVER hardcode secrets in source code — environment variables, `dotnet user-secrets`, or a secret
  manager.
- Validate that required secrets are present at startup.
- Rotate any secret that may have been exposed.

## External processes

Launch external processes as **exe + argv, never a shell string, always with a timeout — and the
timeout kills the entire process tree** (`Process.Kill(entireProcessTree: true)` on the
cancel/timeout path, before the launcher returns). This family clones and checks out repositories at
operator-supplied urls, so an unescaped shell string is an injection surface, not a style issue; and
a timeout that merely stops *waiting* leaves an orphan holding locks and handles — see
[reliability.md](reliability.md). Reference implementation:
`dew_flow_benchmark · src/Bench.Infrastructure/Process/ProcessRunner.cs`.

## Security response protocol

If a security issue is found:

1. STOP immediately.
2. Run a full security review of the affected surface.
3. Fix CRITICAL issues before continuing.
4. Rotate any exposed secrets.
5. Review the codebase for the same pattern elsewhere.
