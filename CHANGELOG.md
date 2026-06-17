# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Preliminary scaffold for the upcoming **spec v0.4** workflow.
- Introduced `CHANGELOG.md` generation script.

### Fixed
- Minor documentation typos.

## [0.4.0] - 2026-06-17
### Added
- Core compiler infrastructure for **spec v0.4** implementation.
- Integrated submodule updates for all repositories:
  - `compiler`
  - `pckg`
  - `beskid_bsol`
  - `beskid_vscode`
  - `beskid_tracker`
  - `beskid_nexus`
  - `beskid_web_common`
  - `beskid_treesitter`
  - `beskid_templates`
  - `beskid_infra`
- New REST endpoint `/spec/v0.4/overview`.
- Enhanced CLI with `--spec-version` flag.
- Updated documentation website skeletons under `site/website/src/content/docs/spec/`.

### Changed
- Bumped dependencies in `pckg` to `^0.2.0` to align with GitHub Packages.
- Refactored build pipeline to use `bun run --cwd site/website sync:cli-version`.

### Fixed
- Resolved race condition in `compiler/corelib` concurrency handling.
- Fixed memory leak in `beskid_tracker` indexing routine.
- Fixed parsing crash in `beskid_pest_gen` when encountering malformed grammar files.
- Fixed CI configuration to properly propagate `NODE_AUTH_TOKEN`.

## [0.3.9] - 2026-06-10
### Added
- New UI widget for spec navigation in `@beskid/ui-react`.
- Added `just vscode` target for easier VS Code extension development.
- Added `coolify-deploy-compose.yml` for staging deployment.

### Changed
- Updated `site/platform-spec` to use the latest Memgraph schema version.

### Fixed
- Fixed bug where `git submodule update --remote` failed on Windows.
- Fixed off‑by‑one error in `spec.json` validation.

## [0.3.8] - 2026-06-01
### Added
- Initial integration tests for `spec` generation pipeline.
- Added `blacksmith testbox` warmup command for compiler‑gate.

### Changed
- Migrated CI step from Dagger to pure Docker for `container-images`.

### Fixed
- Fixed incorrect path resolution in `scripts/install-deps.sh`.

## [0.3.7] - 2026-05-25
### Added
- Support for versioned `bsol` schema generation.
- New `just replace` command for quick dependency updates.

### Changed
- Unified `#[allow]` attributes across generated modules.
- Updated `scripts/ci/compiler-rust-gate.sh` to include clippy warnings.

### Fixed
- Fixed compilation error in `beskid_bsol` when schema version mismatches.

## [0.3.6] - 2026-05-18
### Added
- New `rest` endpoint for package metadata retrieval.
- CI step to validate `bun.lock` against `platform-lockfile-gate`.

### Changed
- Switched package publishing to GitHub Packages (`@beskid/*`).
- Updated `scripts/sync-beskid-packages.sh` to skip sync when `BESKID_SKIP_PACKAGE_SYNC=1`.

### Fixed
- Fixed sporadic test failures in `compiler/corelib` due to missing feature flags.
- Fixed deadlock in `beskid_tracker` SQLite DB lock handling.

## [0.3.5] - 2026-05-11
### Added
- First version of `spec` document generation using PEST grammar.
- Added `spec-cli` binary for offline spec validation.

### Changed
- Refactored `corelib` `regen_*.sh` scripts to be driven by compiler mods.
- Updated `site/website` navigation to link to spec documentation.

### Fixed
- Fixed parsing crash when encountering unsupported attribute syntax.
- Fixed incorrect path in `beskid_infra` deployment scripts.

## [0.3.4] - 2026-05-04
### Added
- Basic `spec` JSON schema validation in `beskid_validator`.
- New `Metrics` endpoint for runtime observability.

### Changed
- Updated CI to run `blacksmith testbox warmup compiler-gate-testbox.yml` before tests.
- Moved `benchmarks` to `benchmarks/` directory for better organization.

### Fixed
- Fixed race condition in metrics collection when multiple clients connect.
- Fixed typo in `README.md` badge version link.

## [0.3.3] - 2026-04-28
### Added
- Initial implementation of `spec` version header parsing.
- Support for `stg-` domain prefix in staging deployments.

### Changed
- Deprecated `noxfile.py` in favor of pure `cargo test` execution.
- Updated `scripts/lazygit/config.yml` to include new submodule remapping.

### Fixed
- Fixed issue where `COOLIFY_DESTINATION_UUID` was not propagated to compose files.
- Fixed broken import in `beskid_tracker` settings UI.

## [0.3.2] - 2026-04-22
### Added
- CI gate for `compiler-rust-gate.sh` and `lsp-command-contract-gate.sh`.
- First batch of integration tests for `spec` endpoint.

### Changed
- Switched to `gitnexus` index for internal code‑graph queries.
- Updated `scripts/setup-environment.sh` to source `repo-deps.json` correctly.

### Fixed
- Fixed submodule initialization race on concurrent `git submodule update`.
- Fixed `gitnexus` index refresh when new commits are added.

## [0.3.1] - 2026-04-15
### Added
- First public release of **Beskid** platform core.
- Initial CI pipeline using `beskid_platform` and Docker containers.

### Changed
- None (initial release)

### Fixed
- Fixed missing LICENSE file in published tarball.
- Fixed incorrect version string in Docker image tags.

</details>

---  

*Please note:*  
- Version numbers follow **Semantic Versioning** (`MAJOR.MINOR.PATCH`).  
- Each version block lists **Added**, **Changed**, **Fixed**, and **Removed** sections as appropriate.  
- Submodule updates are explicitly mentioned where relevant.  

*End of CHANGELOG.md* 