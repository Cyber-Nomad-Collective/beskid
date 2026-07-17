## ADDED Requirements

### Requirement: Manifest-authoritative native runtime kit
The toolchain MUST generate runtime-kit metadata, symbols, layouts, traps, and hashes from `compiler/runtime_manifest.bsol` and MUST reject artifacts that do not exactly match it.

#### Scenario: Coherent kit resolution
- **GIVEN** an installed ABI-v5 kit for a supported target and profile
- **WHEN** JIT or AOT resolves the kit
- **THEN** target, profile, ABI, allowlists, layouts, and hashes all match before load or link

#### Scenario: Mixed runtime artifacts
- **GIVEN** runtime metadata and binaries from different builds
- **WHEN** the toolchain validates the kit
- **THEN** validation fails before user code runs

### Requirement: Beskid runtime and assembly boundary
The canonical runtime MUST be Beskid source compiled through the production AST/Salsa-to-ISLE-to-CLIF path, and target assembly MUST export only `beskid_arch_v5_context_init` and `beskid_arch_v5_context_switch`.

#### Scenario: Runtime artifact provenance
- **GIVEN** a release runtime binary
- **WHEN** provenance and export audits run
- **THEN** no Rust runtime object or unapproved assembly export is present

### Requirement: Complete canonical runtime corpus
The canonical `beskid-runtime-native` source package MUST implement lifecycle, trap delivery, TLS, allocation, non-moving mark/sweep collection, root frames and barriers, strings, collections, scheduler and concurrency, composition, clocks, callbacks, and the approved target OS adapters. User packages MUST NOT invoke trusted intrinsics directly.

#### Scenario: Canonical runtime capability matrix
- **GIVEN** the canonical runtime source package and ABI-v5 manifest
- **WHEN** runtime capability, layout, trap, GC, scheduler, collection, and intrinsic-access tests run
- **THEN** every required capability is implemented through canonical Beskid source or one approved platform import, and untrusted packages are rejected

#### Scenario: Runtime compilation path
- **GIVEN** a runtime-kit build request
- **WHEN** the canonical runtime is compiled
- **THEN** it passes through the same expanded-AST, Salsa, `CodegenInput`, ISLE, and CLIF-verification path as an application

### Requirement: Fixed runtime-kit installation layout
Runtime kits MUST install under `lib/beskid-runtime/abi-5/<target>/<debug|release>/` with `abi.json` at the profile root and target-named artifacts in `static/` and `shared/`.

#### Scenario: Installed-prefix smoke
- **GIVEN** a packaged toolchain installed to an empty prefix
- **WHEN** runtime-kit discovery runs without source-tree fallbacks
- **THEN** JIT and AOT use the exact installed target/profile kit

#### Scenario: Three-target, two-profile artifact matrix
- **GIVEN** Linux x86-64, macOS arm64, and Windows x86-64 release lanes
- **WHEN** debug and release runtime kits are built and installed
- **THEN** each lane contains the manifest-matched static and shared artifacts and passes JIT and AOT installed-prefix smokes without a source-tree or Rust-runtime fallback

### Requirement: Binary provenance is a release gate
The release pipeline MUST inspect every produced runtime and linked application artifact for manifest allowlist conformance and forbidden Rust/bridge/host/unwind provenance.

#### Scenario: Forbidden linked provenance
- **GIVEN** a candidate runtime or linked application binary containing a forbidden symbol family or object provenance
- **WHEN** the release provenance audit runs
- **THEN** the build fails before packaging and reports the artifact and matched provenance
