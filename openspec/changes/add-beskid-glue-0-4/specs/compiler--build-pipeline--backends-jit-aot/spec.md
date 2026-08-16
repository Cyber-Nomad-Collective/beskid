## MODIFIED Requirements

### Requirement: BackendArtifact extends the shared codegen artifact
The shared-codegen-artifact contract SHALL be extended to allow a `BackendArtifact` enum with `Clif(CodegenArtifact)`, `RustSource(String)`, and `DotNetProject(String)` variants. 0.4 SHALL populate only the `Clif` variant; the `RustSource` and `DotNetProject` variants SHALL be declared and SHALL fail closed with `BackendError::NotImplementedFor0_4`. The `Clif` variant SHALL carry the existing `CodegenArtifact` schema; both JIT and AOT link flows SHALL accept the `Clif` variant without forking lowering. Source-emitting backends (0.5) SHALL consume the same `CodegenInput` and `SyntaxModuleItem` inputs as the CLIF backend; they SHALL NOT fork the lowering pipeline or rebuild `ProgramAssembly`. The backend SHALL be selected via a `--backend` CLI flag (default `clif`); the selection SHALL NOT create an alternate pipeline or bypass the `prepare_compilation` spine.

**Stable ID:** `BSP-REQ-BACKEND-SHARED-ARTIFACT`

#### Scenario: CLIF variant is accepted by JIT and AOT
- **GIVEN** a `BackendArtifact::Clif(artifact)` produced by the `CraneliftClif` backend
- **WHEN** JIT or AOT consumes it via `expect_clif()`
- **THEN** the inner `CodegenArtifact` is accepted without forking lowering

#### Scenario: Source variant fails closed in 0.4
- **GIVEN** a `--backend glue-rust` or `--backend glue-dotnet` CLI flag
- **WHEN** the CLI validates the backend kind before lowering
- **THEN** the CLI errors with `NotImplementedFor0_4` and no lowering occurs

#### Scenario: Backend selection does not fork the pipeline
- **GIVEN** a build with `--backend clif` (the default)
- **WHEN** the pipeline runs
- **THEN** it uses the same `prepare_compilation` spine, `CodegenInput`, and `SyntaxModuleItem` inputs as a build without the flag
