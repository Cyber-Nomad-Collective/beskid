## ADDED Requirements

### Requirement: Backend trait at the CodegenInput boundary
The compiler SHALL lower typed syntax through a `Backend` trait at the `CodegenInput` boundary. The `Backend` trait SHALL be object-safe with a `kind()` method returning a `BackendKind` and a `lower()` method consuming `&CodegenInput`, `&dyn TargetIsa`, and `&[SyntaxModuleItem]` to produce a `BackendArtifact`. The `CraneliftClif` backend SHALL wrap the existing `lower_syntax_program` and produce a `BackendArtifact::Clif(CodegenArtifact)`. The `RustSource` and `DotNetProject` backends SHALL be declared and SHALL fail closed with `BackendError::NotImplementedFor0_4` until 0.5. The backend SHALL NOT be selected via a new mod contract kind; it SHALL be selected via a `--backend` CLI flag or manifest flag.

**Stable ID:** `BSP-REQ-BACKEND-TRAIT`

#### Scenario: CraneliftClif backend produces a CLIF artifact
- **GIVEN** a `CodegenInput` and `SyntaxModuleItem` list
- **WHEN** the `CraneliftClif` backend lowers them
- **THEN** the result is a `BackendArtifact::Clif(CodegenArtifact)` with verified Cranelift functions

#### Scenario: RustSource backend fails closed in 0.4
- **GIVEN** a `--backend glue-rust` CLI flag
- **WHEN** the CLI validates the backend kind
- **THEN** the CLI errors immediately with a `NotImplementedFor0_4` message naming the backend kind

#### Scenario: DotNetProject backend fails closed in 0.4
- **GIVEN** a `--backend glue-dotnet` CLI flag
- **WHEN** the CLI validates the backend kind
- **THEN** the CLI errors immediately with a `NotImplementedFor0_4` message naming the backend kind

### Requirement: BackendKind enum and selection
The compiler SHALL define a `BackendKind` enum with variants `CraneliftClif`, `RustSource`, and `DotNetProject`. `BackendKind` SHALL provide `as_str()` returning the CLI string (`clif`, `glue-rust`, `glue-dotnet`) and `from_str()` parsing the CLI string. The default backend SHALL be `CraneliftClif`. The `--backend` CLI flag SHALL accept any `BackendKind` string; glue backends SHALL error before lowering begins. The backend selection SHALL NOT fork the lowering pipeline; all backends consume the same `CodegenInput` and `SyntaxModuleItem` inputs.

**Stable ID:** `BSP-REQ-BACKEND-KIND`

#### Scenario: Default backend is CraneliftClif
- **GIVEN** a build invocation without a `--backend` flag
- **WHEN** the CLI resolves the backend kind
- **THEN** the backend is `CraneliftClif` and the build proceeds through the CLIF path

#### Scenario: Unknown backend string is rejected
- **GIVEN** a `--backend wat` CLI flag
- **WHEN** the CLI parses the backend kind
- **THEN** the CLI errors with `BackendKindParseError` naming the unknown value and the accepted set

### Requirement: BackendArtifact enum
The compiler SHALL define a `BackendArtifact` enum with variants `Clif(CodegenArtifact)`, `RustSource(String)`, and `DotNetProject(String)`. 0.4 SHALL populate only the `Clif` variant; the `RustSource` and `DotNetProject` variants SHALL be declared but never produced. The `BackendArtifact` SHALL extend the shared-codegen-artifact contract: the CLIF variant carries the existing `CodegenArtifact` schema; the source variants carry a generated source string (0.5). Consumers SHALL use `expect_clif()` to extract the `CodegenArtifact` from the `Clif` variant; calling `expect_clif()` on a source variant SHALL panic.

**Stable ID:** `BSP-REQ-BACKEND-ARTIFACT`

#### Scenario: CLIF artifact extracts via expect_clif
- **GIVEN** a `BackendArtifact::Clif(artifact)`
- **WHEN** `expect_clif()` is called
- **THEN** the inner `CodegenArtifact` is returned

#### Scenario: Source artifact panics on expect_clif
- **GIVEN** a `BackendArtifact::RustSource(source)` (0.5)
- **WHEN** `expect_clif()` is called
- **THEN** the call panics because the artifact is not a CLIF artifact
