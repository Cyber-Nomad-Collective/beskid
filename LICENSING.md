# Beskid licensing policy

Beskid uses licenses according to what a component does. A more specific
license file or package declaration overrides the repository default for that
component. Third-party code always retains its upstream license and notices.

## Apache-2.0: language, toolchain, and reusable code

Unless a path is listed below or carries its own license, Beskid-owned software
in this repository is licensed under the [Apache License 2.0](LICENSE). This
includes the compiler, language tooling, editor integrations, grammars, build
and deployment tooling, reusable UI and client packages, project templates,
the core library, and native runtime components.

The permissive runtime boundary is intentional. Using the Beskid compiler does
not determine the license of source code supplied to it or of generated
programs. Apache-2.0 runtime, core-library, startup, template, or generated code
incorporated into an output may be used under Apache-2.0. Third-party code
incorporated into an output remains subject to its own terms.

## AGPL-3.0-only: network services

Beskid-owned deployable network-service application code is licensed under the
[GNU Affero General Public License v3.0 only](LICENSES/AGPL-3.0-only.txt). This
rule applies to:

- `site/auth/`
- `site/learn/`
- the application code in `site/website/`
- `beskid_sites/apps/website/`
- the pckg service, Tracker service, and Beskid-owned service packages in their
  independent repositories
- `compiler/crates/beskid_pckg_server/`

Reusable libraries, protocol contracts, SDKs, clients, templates, and runtime
components consumed by those services remain Apache-2.0 when their package
metadata or local license says so. The `beskid_sites/apps/shell-template/`
scaffold is Apache-2.0 so applications generated from it are not forced to use
AGPL.

Operators who modify an AGPL-covered service and let users interact with that
version over a network must prominently offer those users the complete
Corresponding Source required by AGPL section 13. Official container images
carry their SPDX license and source-repository metadata and include the
applicable license texts.

## Documentation and examples

Human-readable prose in `docs/`, `openspec/`, and
`site/website/src/content/` is licensed under
[Creative Commons Attribution 4.0 International](LICENSES/CC-BY-4.0.txt),
unless a file says otherwise. Source-code examples and machine-readable example
projects are Apache-2.0 unless they carry another license.

## Brand assets and trademarks

The source code of `site/beskid_brand/` is Apache-2.0. The Beskid name, logos,
service marks, and visual brand assets are not granted under the software or
documentation licenses. Apache-2.0 section 6 also excludes trademark rights.
Use of those identifiers requires separate permission except where applicable
law permits nominative use.

## Independent repositories and third-party exceptions

Git submodules are independent repositories and ship their own license and
notice files. The parent repository's default does not overwrite them.

`beskid_nexus/` is derived from GitNexus and remains governed by the PolyForm
Noncommercial License 1.0.0 and the required notice in that repository. Its
upstream code cannot be sublicensed as AGPL-3.0-only. Moving Nexus to the Beskid
service policy requires upstream permission or replacement and clean isolation
of the inherited implementation.

Vendored dependencies under paths such as `vendor/` retain their original
licenses. Nothing in this policy removes an existing third-party copyright,
license, attribution, or notice requirement.

## SPDX identifiers

- `Apache-2.0` means Apache License 2.0.
- `AGPL-3.0-only` means GNU Affero General Public License v3.0 only; it does not
  automatically permit later versions.
- `CC-BY-4.0` means Creative Commons Attribution 4.0 International.
- `SEE LICENSE IN LICENSING.md` marks an aggregate workspace containing more
  than one licensing boundary.

Run `pnpm licenses:check` from the repository root to verify package metadata
against [license-policy.json](license-policy.json).
