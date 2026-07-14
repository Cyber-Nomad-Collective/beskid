# Unified Distribution and Updater Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce every Beskid distribution artifact from one generated SemVer and add a safe `beskid up` manager for direct installations.

**Architecture:** CI resolves one SemVer and creates immutable CLI/LSP bundles plus a checksum-bearing release manifest before updating aliases or package channels. `beskid_up` validates that manifest, manages versioned direct-install payloads, and delegates package-manager updates; the CLI forwards `beskid up` requests to it.

**Tech Stack:** Rust 2024, Clap, Tokio, Reqwest with rustls, SHA-256, GitHub Actions, Bash, Bun/Open VSX, WiX, Snapcraft, Homebrew.

## Global Constraints

- Preserve the native Linux, Apple Silicon macOS, and Windows build matrix.
- Use immutable `vMAJOR.MINOR.PATCH` release assets as every package input; refresh rolling aliases only after immutable publication succeeds.
- Never self-modify Homebrew, Snap, MSI/EXE, or DMG installations.
- Accept only HTTPS manifest artifact URLs from the configured Beskid release origin and verify SHA-256 before activation.
- The VSIX, CLI, LSP, direct bundles, installer packages, Homebrew formula, and Snap version use the same CI-resolved SemVer.

---

### Task 1: Canonical release contract

**Files:**
- Create: `scripts/ci/resolve-beskid-version.sh`
- Create: `scripts/ci/test/resolve-beskid-version.test.sh`
- Modify: `scripts/ci/compute-cli-version.sh`
- Modify: `.github/workflows/compiler.yml`

**Interfaces:**
- Produces: `BESKID_RELEASE_VERSION`, a strict `MAJOR.MINOR.PATCH` value.
- Produces: `beskid-release.json`, containing schema version, version, commit, target bundles, SHA-256 hashes, and release notes URL.

- [ ] **Step 1: Write failing resolver tests**

```bash
assert_equals "0.2.7" "$(GITHUB_REF=refs/tags/v0.2.7 GITHUB_REF_NAME=v0.2.7 bash scripts/ci/resolve-beskid-version.sh)"
assert_fails env GITHUB_REF=refs/tags/v0.2 bash scripts/ci/resolve-beskid-version.sh
```

- [ ] **Step 2: Run the resolver tests and verify failure**

Run: `bash scripts/ci/test/resolve-beskid-version.test.sh`

Expected: FAIL because `resolve-beskid-version.sh` does not exist.

- [ ] **Step 3: Implement the shared resolver and make the former CLI resolver a compatibility delegate**

```bash
exec "$(dirname "$0")/resolve-beskid-version.sh" "$@"
```

- [ ] **Step 4: Pass the resolved value through compiler build and publish jobs using `BESKID_RELEASE_VERSION`**

```yaml
env:
  BESKID_RELEASE_VERSION: ${{ needs.version.outputs.version }}
```

- [ ] **Step 5: Run tests and YAML lint**

Run: `bash scripts/ci/test/resolve-beskid-version.test.sh && actionlint .github/workflows/compiler.yml`

Expected: PASS.

### Task 2: `beskid_up` manifest and installation core

**Files:**
- Create: `compiler/crates/beskid_up/Cargo.toml`
- Create: `compiler/crates/beskid_up/src/lib.rs`
- Create: `compiler/crates/beskid_up/src/manifest.rs`
- Create: `compiler/crates/beskid_up/src/install.rs`
- Create: `compiler/crates/beskid_up/src/platform.rs`
- Create: `compiler/crates/beskid_up/tests/manifest_and_install.rs`
- Modify: `compiler/Cargo.toml`

**Interfaces:**
- `ReleaseManifest::select_bundle(target: &str) -> Result<&Bundle, UpError>`
- `DirectInstall::install_verified(bundle: &Bundle, archive: &Path) -> Result<Version, UpError>`
- `DirectInstall::activate(version: &Version) -> Result<(), UpError>`

- [ ] **Step 1: Write tests for malformed manifests, target mismatch, checksum mismatch, atomic activation, and rollback**

```rust
assert!(ReleaseManifest::from_json("{}").is_err());
assert_eq!(store.active_version()?, Version::parse("1.2.3")?);
```

- [ ] **Step 2: Run the crate tests and verify failure**

Run: `cargo test -p beskid_up`

Expected: FAIL because the workspace member is absent.

- [ ] **Step 3: Implement only typed manifest parsing, SHA-256 validation, staged archive extraction, and atomic active-pointer replacement**

```rust
pub fn install_verified(&self, bundle: &Bundle, archive: &Path) -> Result<Version, UpError>;
```

- [ ] **Step 4: Run focused tests**

Run: `cargo test -p beskid_up`

Expected: PASS.

### Task 3: Updater executable and CLI integration

**Files:**
- Create: `compiler/crates/beskid_up/src/main.rs`
- Create: `compiler/crates/beskid_up/src/commands.rs`
- Create: `compiler/crates/beskid_up/tests/commands.rs`
- Modify: `compiler/crates/beskid_cli/Cargo.toml`
- Modify: `compiler/crates/beskid_cli/src/cli.rs`
- Modify: `compiler/crates/beskid_cli/src/main.rs`

**Interfaces:**
- `beskid-up check|install <version>|update|list|use <version>|remove <version>|auto-update`
- `beskid up <same arguments>` delegates with the caller's stdin/stdout/stderr and exit status.

- [ ] **Step 1: Add failing command parsing and delegation tests**

```rust
assert_eq!(parse(["beskid-up", "check"])?, Command::Check);
assert!(parse(["beskid-up", "remove", "latest"]).is_err());
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `cargo test -p beskid_up command && cargo test -p beskid_cli up`

Expected: FAIL because neither command surface exists.

- [ ] **Step 3: Implement `beskid-up` commands and a thin `beskid up` process delegation**

```rust
Command::new("beskid-up").args(args).status()?.exit_ok()?;
```

- [ ] **Step 4: Add package-manager detection with explicit-confirmation-only native invocation**

```rust
enum InstallOwner { Direct, Homebrew, Snap, WindowsInstaller, Dmg }
```

- [ ] **Step 5: Run focused tests**

Run: `cargo test -p beskid_up && cargo test -p beskid_cli`

Expected: PASS.

### Task 4: Immutable bundles and manifest publication

**Files:**
- Create: `scripts/ci/build-beskid-bundle.sh`
- Create: `scripts/ci/build-beskid-release-manifest.sh`
- Create: `scripts/ci/test/release-manifest.test.sh`
- Modify: `scripts/ci/build-release-artifact.sh`
- Modify: `scripts/ci/publish-release-stream.sh`
- Modify: `.github/workflows/compiler.yml`

**Interfaces:**
- Bundle: `beskid-<version>-<target>.tar.gz` or `.zip`, containing matching CLI, LSP, `beskid-up`, runtime kit, licenses, and `bundle.json`.
- Manifest: `beskid-release.json` uploads to immutable release before `cli-latest` / `lsp-latest` update.

- [ ] **Step 1: Write a fixture-driven manifest test**

```bash
assert_json '.version == "1.2.3" and (.bundles | length == 3)' release.json
assert_sha_matches bundle.tar.gz release.json
```

- [ ] **Step 2: Run test and verify failure**

Run: `bash scripts/ci/test/release-manifest.test.sh`

Expected: FAIL because bundle and manifest builders do not exist.

- [ ] **Step 3: Build checksummed target bundles and emit a deterministic manifest**

- [ ] **Step 4: Change publication ordering so immutable assets plus manifest upload completes before aliases**

- [ ] **Step 5: Run fixture tests and actionlint**

Run: `bash scripts/ci/test/release-manifest.test.sh && actionlint .github/workflows/compiler.yml`

Expected: PASS.

### Task 5: Package outputs consume the release contract

**Files:**
- Modify: `.github/workflows/distribute.yml`
- Modify: `beskid_distrib/windows/beskid.wxs`
- Create: `beskid_distrib/windows/beskid.bundle.wxs`
- Create: `beskid_distrib/macos/build-dmg.sh`
- Modify: `beskid_distrib/macos/Formula/beskid.rb.tpl`
- Modify: `beskid_distrib/snap/snapcraft.yaml`
- Modify: `beskid_distrib/scripts/fetch-rolling-assets.sh`

**Interfaces:**
- Windows release assets: signed-ready `beskid-<version>-windows-amd64.exe` bootstrapper plus MSI payload.
- macOS release asset: `beskid-<version>-darwin-arm64.dmg` containing the direct-install bundle.
- Homebrew and Snap resolve the immutable bundle/version from the release manifest.

- [ ] **Step 1: Add fixture checks asserting every renderer consumes one manifest version**
- [ ] **Step 2: Implement WiX Burn EXE bootstrapper around the existing MSI, preserving MSI install/uninstall behavior**
- [ ] **Step 3: Implement a minimal macOS DMG wrapper around the direct-install bundle**
- [ ] **Step 4: Move Homebrew and Snap to immutable manifest-derived artifacts**
- [ ] **Step 5: Run packaging render tests and actionlint**

### Task 6: VS Code extension version and LSP alignment

**Files:**
- Modify: `.github/workflows/publish-open-vsx.yml`
- Modify: `scripts/ci/open-vsx-publish.sh`
- Create: `scripts/ci/test/open-vsx-version.test.sh`

**Interfaces:**
- `BESKID_RELEASE_VERSION` is required by Open VSX packaging and used for the extension package version and bundled LSP build metadata.

- [ ] **Step 1: Write a test proving an explicit release version overrides git-derived values**
- [ ] **Step 2: Pass the compiler release version to the VSIX job**
- [ ] **Step 3: Remove the duplicate extension SemVer resolver and require the shared value**
- [ ] **Step 4: Run the script test and actionlint**

### Task 7: Documentation, changelog, and full verification

**Files:**
- Modify: `README.md`
- Modify: `beskid_distrib/README.md`
- Modify: `docs/distribution/SECRETS.md`
- Modify: `CHANGELOG.md`
- Modify: `GLOSSARY.md`

- [ ] **Step 1: Document direct install, update ownership, rollback, and package-manager delegation**
- [ ] **Step 2: Add Keep a Changelog entries and glossary definitions for release manifest and direct installation**
- [ ] **Step 3: Run the focused Rust, shell, packaging, and CI validation commands**

Run: `cargo test -p beskid_up -p beskid_cli && bash scripts/ci/test/resolve-beskid-version.test.sh && bash scripts/ci/test/release-manifest.test.sh && bash scripts/ci/test/open-vsx-version.test.sh && actionlint .github/workflows/compiler.yml .github/workflows/distribute.yml .github/workflows/publish-open-vsx.yml`

Expected: PASS.
