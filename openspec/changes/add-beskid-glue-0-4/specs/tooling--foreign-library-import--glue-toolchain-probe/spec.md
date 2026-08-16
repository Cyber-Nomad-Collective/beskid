## ADDED Requirements

### Requirement: Crossplatform toolchain checking contract
The toolchain SHALL define a `ToolchainProbe` contract that resolves external tools (`rustc`, `cargo`, `dotnet`, `linker`, `dotscope`) against a `ToolSpec` and returns a `ResolvedTool` or an atomized `ToolchainError`. The `ToolSpec` SHALL carry the tool name, version constraint, target triple, capability tag, exact path, and expected sha256. The `ResolvedTool` SHALL carry the resolved path, version, and sha256, and SHALL provide a `satisfies()` method that compares against a `ToolSpec`. The `ToolchainError` SHALL be atomized: each variant SHALL carry the failing field, expected value, and actual value, mirroring the `Status`/`FiberJoinStatus` atomized-result pattern. The toolchain probe SHALL fail closed: no tool is resolved as available until validation passes. There SHALL be no fuzzy search-path fallback.

**Stable ID:** `BSP-REQ-GLUE-TOOLCHAIN-PROBE`

#### Scenario: Tool resolves against an exact spec
- **GIVEN** a `ToolSpec` for `rustc` with an exact path and sha256
- **WHEN** the `ToolchainProbe` resolves it
- **THEN** the result is a `ResolvedTool` with the same path and sha256 and `satisfies()` returns true

#### Scenario: Missing tool fails closed with an atomized error
- **GIVEN** a `ToolSpec` for `dotnet` at a path that does not exist
- **WHEN** the `ToolchainProbe` resolves it
- **THEN** the result is a `ToolchainError` variant naming the tool, the expected path, and the actual missing path

#### Scenario: Hash mismatch fails closed with an atomized error
- **GIVEN** a `ToolSpec` for `rustc` with an expected sha256 that does not match the resolved binary
- **WHEN** the `ToolchainProbe` resolves it
- **THEN** the result is a `ToolchainError` variant naming the tool, the expected sha256, and the actual sha256

### Requirement: ToolCapability enum covers glue toolchain tools
The `ToolCapability` enum SHALL cover the tools a glue backend needs: `Rustc`, `Cargo`, `Dotnet`, `Linker`, and `Dotscope`. Each `ToolSpec` SHALL declare one `ToolCapability`. The toolchain probe SHALL use the capability to select the discovery strategy (e.g. `rustc --version` for `Rustc`, `dotnet --version` for `Dotnet`). 0.4 defines the scaffold; 0.5 implements the discovery logic. The scaffold SHALL be fail-closed: no `ResolvedTool` is produced until the discovery and validation logic is implemented.

**Stable ID:** `BSP-REQ-GLUE-TOOLCHAIN-CAPABILITIES`

#### Scenario: Rustc capability selects rustc version discovery
- **GIVEN** a `ToolSpec` with `ToolCapability::Rustc`
- **WHEN** the toolchain probe discovers the tool (0.5)
- **THEN** it invokes `rustc --version` and parses the version

#### Scenario: Dotscope capability selects dotscope discovery
- **GIVEN** a `ToolSpec` with `ToolCapability::Dotscope`
- **WHEN** the toolchain probe discovers the tool (0.5)
- **THEN** it resolves the `dotscope` crate from the Cargo dependency graph and validates its version
