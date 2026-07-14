# Unified Distribution and Updater Design

Date: 2026-07-13
Status: Approved

## Goal

Ship the Beskid CLI, LSP, runtime kit, editor extension, and platform packages
from one generated release version and one release manifest. Provide
`beskid_up`, exposed through `beskid up`, to check, install, update, select,
and remove direct-download toolchain versions without taking ownership of
package-manager installations.

## Decisions

- Preserve the native three-target compiler build matrix and existing
  distribution recipes. Do not introduce cargo-dist as a competing release
  pipeline.
- Generate one SemVer value once per release in a generic CI resolver. Every
  release consumer receives that value as an explicit input.
- Publish immutable versioned artifacts before updating rolling aliases.
- Publish one checksum-bearing release manifest which describes the CLI/LSP
  bundle for each target. The updater downloads only artifacts listed in that
  manifest and verifies the recorded SHA-256 before activation.
- `beskid_up` owns only direct-download installations. Homebrew, Snap, Windows
  installer, and DMG installations remain owned by their native installer or
  package manager; the updater detects and delegates to them only after an
  explicit confirmation.
- Automatic updates are opt-in periodic checks. They notify by default and
  never silently mutate a package-managed installation.
- The VS Code package version is supplied from the same resolved release
  SemVer at packaging time; it is not a second version authority.

## Architecture

`scripts/ci/resolve-beskid-version.sh` emits a valid release SemVer. CI passes
that value to CLI, LSP, VSIX, bundle, and package builders. The compiler
release publisher creates an immutable release containing per-target bundles,
checksums, and `beskid-release.json`; it then refreshes the rolling aliases.
Platform packaging consumes only immutable release assets and the manifest.

`compiler/crates/beskid_up` contains release-manifest parsing, platform and
installation detection, checksum verification, direct-install layout
management, and command orchestration. Its `beskid-up` executable performs
the process handoff necessary to update a running CLI safely. The `beskid`
CLI delegates the `up` command to this package rather than reimplementing the
logic.

Direct installations use one root with versioned payload directories and a
single active-version pointer. A payload contains matching CLI, LSP, runtime
kit, licenses, and release metadata. Download is staged in a temporary
directory, verified, then atomically promoted; a failed download never changes
the active version. Rollback selects a previously verified payload.

## Errors and Safety

Malformed manifests, unsupported targets, checksum mismatches, incomplete
bundles, and activation failures are explicit errors and leave the current
version active. The updater only accepts HTTPS release URLs from the configured
Beskid release origin. Package-manager detection explains the native update
command and requires confirmation before executing it.

## Verification

Unit tests cover SemVer resolution, manifest validation, target selection,
checksum verification, direct-install activation and rollback, and
package-manager delegation. CI tests assert that every artifact and installer
uses the resolved version and that release publication cannot update rolling
aliases before immutable assets and their manifest exist. Platform smoke jobs
install a produced bundle and verify matching CLI/LSP versions.
