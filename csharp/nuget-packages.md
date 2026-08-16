---
paths:
  - "**/*.csproj"
  - "**/Directory.Packages.props"
  - "**/Directory.Build.props"
---
# NuGet packages — approval, freshness, licence

Central package management is on: **versions live in `Directory.Packages.props`**, a `.csproj` carries
only `<PackageReference Include="..." />` with no version.

## Before adding any package

Classify it by publisher and check its maintenance state on nuget.org. Do not guess — look.

| Publisher | Freshness | Action |
|---|---|---|
| Microsoft / a company or foundation with an institutional maintenance commitment | released within the last 12 months | **Allowed** — add it |
| Same, but **no release for over a year** | — | **Ask the operator first**, naming the package, its last release date, and why it is still the right choice |
| A private individual or a small personal project | any | **Always ask first**, with a justification: what it is for, why hand-written code or an existing dependency does not cover it, its last release, and its author |

A GitHub organisation with a single personal maintainer counts as a private individual, however popular
the package is.

## Licence before version (MANDATORY)

Establish the licence **before** adding or bumping anything, in any ecosystem — NuGet, Cargo, npm, a
container image, a file dropped into `wwwroot`. These products may be distributed, and a licence mistake
is a shipping blocker rather than a note for later. Record the finding beside the pin.

Two family-wide decisions are already load-bearing and are commented in each repo's
`Directory.Packages.props`:

- **FluentAssertions stays at 7.2.2.** 7.2.2 is the last Apache-2.0 release; 8.x moved to a licence
  that is non-commercial only. Do not bump it, and do not let a tool bump it.
- **Aspire SDK and Hosting packages move as a matched pair.** A straddled version spawns a second stray
  dashboard on a random port.

## Bumping

Monthly, to the latest **stable** — never a preview; the family is strictly .NET 10. Bump the whole set
together and run the suite; a transitive constraint that forces an older pin gets a comment saying which
package forces it and when to revisit, not a silent downgrade.

```powershell
dotnet list package --outdated
Invoke-RestMethod "https://api.nuget.org/v3/registration5-gz-semver2/<package-id-lowercase>/index.json"
```

## Prefer nothing

The cheapest dependency is the one not taken. Several repos hold their domain and contract projects at
**zero** package references with an architecture test that keeps it that way — reach outward only when
the capability is genuinely not in the base class library.

## Definition of Done

- [ ] Version pinned centrally; the `.csproj` carries no version attribute.
- [ ] Publisher and freshness checked against the table; approval obtained where the table demands it.
- [ ] Licence established and recorded before the pin landed.
- [ ] Any zero-reference project the repo guards still references nothing — its architecture test proves it.
