# Security policy

## Supported versions

Beskid is pre-1.0. Security fixes go to the latest release line only.

| Version | Supported |
| --- | --- |
| Latest stable release (rolling tag `cli-stable`, currently 0.5.x) | Yes |
| `cli-unstable` builds | Fixed forward, no backports |
| Older releases | No |

Services run by the project (beskid-lang.org, pckg, Tracker, auth) are always
on the current deployment.

## Reporting a vulnerability

Do not open a public issue for a vulnerability.

1. Preferred: use GitHub's private vulnerability reporting on the affected
   repository (**Security** tab, **Report a vulnerability**). For the compiler
   that is `Cyber-Nomad-Collective/beskid_compiler`; for everything in this
   superrepo, `Cyber-Nomad-Collective/beskid`.
2. If that is not available, email the maintainer at
   `pmikstacki@cybernomad.it` with "SECURITY" in the subject.

Include what you can: affected component and version, steps to reproduce,
impact, and any suggested fix. You will get an acknowledgement, and the fix
will be coordinated with you before anything is disclosed.

## Scope

In scope:

- The compiler, runtime and runtime kits (including ABI v5 kit validation).
- The package registry and its client: package integrity, publication and
  authentication.
- The auth hub and the services behind it.
- Release and CI pipelines: credential exposure, unsigned or tampered
  artifacts.
- Editor extensions and the language server.

Out of scope:

- Vulnerabilities in third-party dependencies that are already public; report
  those upstream, and tell us if Beskid needs to act.
- Denial of service through extreme input sizes in the compiler, unless it
  affects a hosted service.
- Social engineering of maintainers.

## How the project limits exposure

Native builders hold no publication credentials. Stable releases are published
only through a manual, `main`-only Woodpecker lane in which a single final step
receives a scoped token. Production is reconciled only by Watchtower. Runtime
kits that are missing, mismatched or tampered fail closed. Details are in
`docs/operations/woodpecker.md`.
