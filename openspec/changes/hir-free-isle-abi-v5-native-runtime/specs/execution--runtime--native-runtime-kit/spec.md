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

### Requirement: Fixed runtime-kit installation layout
Runtime kits MUST install under `lib/beskid-runtime/abi-5/<target>/<debug|release>/` with `abi.json` at the profile root and target-named artifacts in `static/` and `shared/`.

#### Scenario: Installed-prefix smoke
- **GIVEN** a packaged toolchain installed to an empty prefix
- **WHEN** runtime-kit discovery runs without source-tree fallbacks
- **THEN** JIT and AOT use the exact installed target/profile kit
