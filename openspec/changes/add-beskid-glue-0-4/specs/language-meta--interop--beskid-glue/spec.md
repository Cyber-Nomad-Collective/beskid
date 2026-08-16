## ADDED Requirements

### Requirement: Beskid.Glue model
`Beskid.Glue` SHALL define a glue model that represents Beskid constructs for foreign consumption through a common `Interop.Contracts` vocabulary. The glue model SHALL consist of glue attributes (`[Glue]`, `[GlueImport]`, `[GlueExport]`), a `GlueTag` type carrying the backend kind and library identity, a `StdioBridgeMessage` type for fiber-mediated foreign calls, and seven atomized glue contracts. The glue model SHALL NOT duplicate the `Interop.Contracts` vocabulary; it SHALL consume the typed Rust models in `beskid_abi::interop`. Glue rules (type mapping, symbol emission, link args, signature read/write, toolchain probe, stdio bridge generation) SHALL live in Beskid `type=Mod` packages; the host seam (backend trait dispatch, Interop.Contracts typed model, filesystem/process I/O) SHALL be Rust.

**Stable ID:** `BSP-REQ-GLUE-MODEL`

#### Scenario: Glue attributes mark foreign boundaries
- **GIVEN** a Beskid type or function annotated with `[Glue]`
- **WHEN** the glue mod processes the annotation
- **THEN** the glue model produces a foreign-facing binding for that type or function

#### Scenario: GlueImport marks a foreign library import
- **GIVEN** a Beskid contract annotated with `[GlueImport(Library: "foreign_lib")]`
- **WHEN** the glue mod processes the annotation
- **THEN** the glue model produces a `GlueTag` for the foreign library and a stdio bridge binding

#### Scenario: GlueExport marks a Beskid export to a foreign library
- **GIVEN** a Beskid function annotated with `[GlueExport]`
- **WHEN** the glue mod processes the annotation
- **THEN** the glue model produces a foreign-callable binding that the foreign library can invoke through the stdio bridge

### Requirement: Stdio bridge fiber
`Beskid.Glue` SHALL generate a stdio bridge as a Beskid fiber that exchanges `StdioBridgeMessage` values over a channel. Each imported foreign library SHALL be represented by a host typed tag object (`GlueTag`) carrying the backend kind and library identity. The fiber SHALL marshal calls through the tag object and the stdio message protocol. The stdio bridge SHALL support both directions: import (read foreign library signatures and produce Beskid bindings) and export (expose Beskid functions to a foreign library). 0.4 defines the contract; 0.5 implements the runtime protocol.

**Stable ID:** `BSP-REQ-GLUE-STDIO-BRIDGE`

#### Scenario: Stdio bridge fiber marshals an import call
- **GIVEN** a `GlueTag` for an imported foreign library and a `StdioBridgeMessage` requesting a foreign function call
- **WHEN** the stdio bridge fiber processes the message
- **THEN** the fiber dispatches the call through the tag object and returns the result as a `StdioBridgeMessage`

#### Scenario: Stdio bridge fiber marshals an export call
- **GIVEN** a foreign library invoking a Beskid function through the stdio bridge
- **WHEN** the stdio bridge fiber receives the call request
- **THEN** the fiber dispatches the call to the Beskid function and returns the result to the foreign library

### Requirement: Seven atomized glue contracts
`Beskid.Glue` SHALL define seven atomized glue contracts in the compiler mod SDK: `TypeMapping` (`MapType`), `SymbolEmission` (`EmitSymbol`), `LinkArgs` (`ResolveLinkArgs`), `SignatureReader` (`ReadSignatures`), `SignatureWriter` (`WriteSignatures`), `ToolchainProbe` (`ResolveTool` + `ValidateTool`), and `StdioBridge` (`GenerateBridge`). Each contract SHALL be a closed SDK contract id in `SDK_MOD_CONTRACTS` with an entry method. The contracts SHALL be discovered by the same registration scan as the existing six compiler mod contracts.

**Stable ID:** `BSP-REQ-GLUE-CONTRACTS`

#### Scenario: TypeMapping maps a Beskid type to an Interop.Contracts type shape
- **GIVEN** a Beskid primitive type `i32`
- **WHEN** the `TypeMapping` contract maps it
- **THEN** the result is a `TypeShape` with `TypeShapeClass::Scalar` and `OwnershipClass::Borrow`

#### Scenario: SymbolEmission emits a foreign-callable symbol
- **GIVEN** a Beskid function annotated with `[GlueExport]`
- **WHEN** the `SymbolEmission` contract processes it
- **THEN** the result is a foreign-callable symbol name and ABI signature

#### Scenario: ToolchainProbe resolves a tool against a spec
- **GIVEN** a `ToolSpec` for `rustc` with a version constraint and target
- **WHEN** the `ToolchainProbe` contract resolves it
- **THEN** the result is a `ResolvedTool` with the exact path and sha256, or an atomized `ToolchainError`

### Requirement: GlueTag host typed tag object
`Beskid.Glue` SHALL define a `GlueTag` type that carries the backend kind (`GlueBackendKind`: `Rust` or `DotNet`) and the library identity for each imported or exported foreign library. The `GlueTag` SHALL be a host typed tag object: the host (Rust) owns the tag allocation and identity; Beskid code references the tag through an opaque handle. The stdio bridge fiber SHALL use the `GlueTag` to dispatch calls to the correct foreign library.

**Stable ID:** `BSP-REQ-GLUE-TAG`

#### Scenario: GlueTag carries backend kind and library identity
- **GIVEN** an imported Rust crate `foreign_lib`
- **WHEN** the glue mod creates a `GlueTag` for it
- **THEN** the tag carries `GlueBackendKind::Rust` and the library identity `foreign_lib`

#### Scenario: GlueTag dispatches to the correct library
- **GIVEN** two imported libraries with distinct `GlueTag` values
- **WHEN** the stdio bridge fiber receives a call for one tag
- **THEN** the fiber dispatches the call to the library identified by that tag and not the other
