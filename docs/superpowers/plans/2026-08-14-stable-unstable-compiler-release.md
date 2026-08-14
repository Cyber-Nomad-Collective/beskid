# Stable and Unstable Compiler Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish fully gated stable compiler releases and best-effort unstable releases with exact centralized versions, independent native platform pairs, structured state, and complete release notes.

**Architecture:** The version resolver owns the channel suffix, each native matrix lane produces a CLI/LSP pair plus a result document, and a release-state aggregator is the single publication policy boundary. The publisher renders human-readable notes from that machine-readable state.

**Tech Stack:** Bash, jq, GitHub Actions YAML, `gh`, Rust native build commands, shell contract tests.

## Global Constraints

- Stable release behavior remains fully gated by the current compiler and LSP gate.
- The unstable version is the usual version plus exactly `-unstable`; it has no commit suffix.
- Commit provenance belongs in release metadata and notes.
- macOS, Linux, and Windows build independently.
- Test failures do not block unstable publication and must appear in release state and notes.
- Failed CI commands retain raw logs and structured diagnostics with component, stage, platform, command, authoritative identifier when available, source location, and reason.
- Unstable requires at least one platform with both CLI and LSP binaries.
- Do not change compiler/runtime, LSP implementation, applications, or website UI.
- Do not commit or push this work.

---

### Task 1: Central channel-aware version contract

**Files:**
- Modify: `scripts/ci/resolve-beskid-version.sh`
- Modify: `scripts/ci/test/resolve-beskid-version.test.sh`
- Modify: `scripts/ci/test/release-version-contract.test.sh`

**Interfaces:**
- Consumes: `GITHUB_REF`, `GITHUB_RUN_NUMBER`, `RELEASE_CHANNEL`.
- Produces: `0.4.<run>` for stable or `0.4.<run>-unstable` for unstable.

- [ ] Add failing assertions for the exact unstable suffix and unsupported channels.
- [ ] Run `bash scripts/ci/test/resolve-beskid-version.test.sh` and confirm the unstable assertion fails.
- [ ] Make `resolve-beskid-version.sh` validate the channel and append only `-unstable` for unstable.
- [ ] Run the resolver and release-version contract tests and confirm they pass.

### Task 2: Platform-pair result and release-state contracts

**Files:**
- Create: `scripts/ci/build-release-state.sh`
- Create: `scripts/ci/test/build-release-state.test.sh`
- Modify: `scripts/ci/test/run-cicd-foundation-tests.sh`

**Interfaces:**
- Consumes: channel, version, compiler SHA, superrepo SHA, gate result, output path, and zero or more platform-result JSON paths.
- Produces: schema-versioned `release-state.json`; exits nonzero when stable is not fully eligible or unstable has no complete platform pair.

- [ ] Write fixtures and failing tests for complete stable state, failed stable gate, partial unstable success, and zero-pair unstable failure.
- [ ] Run `bash scripts/ci/test/build-release-state.test.sh` and confirm failure because the aggregator is absent.
- [ ] Implement deterministic jq aggregation with explicit available/missing artifacts, successful/failed tests, and failed platforms.
- [ ] Run the new test and the CI foundation suite.

### Task 3: Release-note rendering and publication

**Files:**
- Create: `scripts/ci/render-compiler-release-notes.sh`
- Modify: `scripts/ci/publish-release-stream.sh`
- Modify: `scripts/ci/test/publish-release-stream.test.sh`

**Interfaces:**
- Consumes: `release-state.json` and stream name.
- Produces: Markdown sections named Channel, Available artifacts, Missing artifacts, Successful tests, Failed tests, and Commit provenance.

- [ ] Extend the publish test to require all six note sections and the release-state asset.
- [ ] Run `bash scripts/ci/test/publish-release-stream.test.sh` and confirm the new assertions fail.
- [ ] Implement the renderer and pass the state file into immutable and rolling publication.
- [ ] Update existing-release paths with `gh release edit --notes-file` before clobbering assets.
- [ ] Run the publish test and shell syntax checks.

### Task 4: Independent native CLI/LSP platform lanes

**Files:**
- Create: `scripts/ci/build-release-platform.sh`
- Create: `scripts/ci/test/build-release-platform.test.sh`
- Modify: `.github/workflows/compiler.yml`
- Modify: `scripts/ci/test/release-version-contract.test.sh`

**Interfaces:**
- Consumes: target, CLI asset name, LSP asset name, version, channel, output directory.
- Produces: whichever binaries build successfully plus `platform-result-<target>.json`; stable exits nonzero on either failure, unstable exits zero after recording outcomes.

- [ ] Write a failing harness test using a stubbed `build-release-artifact.sh` for full success, one-binary failure, and both-binary failure.
- [ ] Run the new harness test and confirm failure because the wrapper is absent.
- [ ] Implement the wrapper with independent build attempts and deterministic JSON.
- [ ] Replace separate CLI/LSP matrices with one three-platform pair matrix, preserving current runner, linker, cache, and target setup.
- [ ] Make the version job depend on the gate result and select stable on automatic gate success, unstable on automatic gate failure, while honoring manual channel input.
- [ ] Add aggregation and a single publisher that downloads all result/artifact outputs and applies release eligibility.
- [ ] Run workflow contract tests and parse the YAML locally.

### Task 5: Release documentation and final verification

**Files:**
- Modify: `scripts/README.md`
- Modify: `.github/README.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: implemented workflow behavior.
- Produces: maintainer documentation and an Unreleased changelog entry.

- [ ] Document stable/unstable selection, independent pair builds, release state, note sections, and deferred consumer audit.
- [ ] Add a concise Keep a Changelog entry without disturbing existing entries.
- [ ] Run `bash -n` on changed shell scripts, targeted tests, the full CI foundation suite, workflow syntax validation, `git diff --check`, and GitNexus `detect_changes`.
- [ ] Review `git status` and confirm no protected implementation or website files changed.

### Task 6: Unified diagnostic reporting

**Files:**
- Create: `scripts/ci/render-ci-failure.sh`
- Create: `scripts/ci/run-ci-reported-command.sh`
- Create: `scripts/ci/test/render-ci-failure.test.sh`
- Modify: `.github/workflows/compiler.yml`
- Modify: `.github/workflows/corelib.yml`
- Modify: `scripts/ci/build-release-platform.sh`
- Modify: `scripts/ci/build-release-state.sh`

**Interfaces:**
- Consumes: component, stage, platform, command, raw command log, and retained-log path.
- Produces: annotations, job-summary Markdown, raw-log artifacts, and schema-versioned failure JSON with `identifier` and `location` fields.

- [ ] Add fixtures for Rust test names, Beskid test names, Windows runner paths, source line/column, opaque AST keys, and unavailable identifiers.
- [ ] Run `bash scripts/ci/test/render-ci-failure.test.sh` and confirm failure while the renderer is absent.
- [ ] Implement evidence-only identifier enrichment and project-relative path normalization.
- [ ] Wrap compiler, LSP, and Corelib gates and merge native-platform diagnostics into release state and notes.
- [ ] Run diagnostic, workflow-contract, shell-syntax, and `actionlint` checks.
