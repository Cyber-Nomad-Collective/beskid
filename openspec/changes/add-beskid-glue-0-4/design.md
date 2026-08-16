## Context

The Beskid compiler lowers typed syntax through a single Cranelift CLIF
backend. The `Interop.Contracts` vocabulary exists only as normative
prose in `openspec/specs/language-meta--interop--interop-contracts`; it
defines type-shape classes, call-shape classes, ownership classes, a
conformance envelope, and interop view types, but none are instantiated
as Rust types. The C ABI profile permits interop view types
(`CStringView`, `CBuffer`, `CArrayView`) that do not exist in corelib.
The codegen pipeline is CLIF-only with no seam for a source-emitting
backend. Host linker and external tool discovery is ad hoc (`CC` env or
`cc`/`cl` fallback), not under the same hash-verified manifest
discipline as the ABI-v5 runtime kit. The compiler mod SDK has six
contract kinds (Collector, Generator, AttributeGenerator, Analyzer,
Rewriter, GrammarGenerator) with no glue-specific contracts.

This change introduces the contracts, typed models, backend seam,
toolchain probe scaffold, glue mod contracts, and corelib interop views
that 0.5 language-specific generation will consume.

## Decisions

### D-GLUE-0001: Backend abstraction, not a new mod contract kind

A glue backend is introduced as a `Backend` trait at the `CodegenInput`
boundary, not as a seventh mod contract kind. The existing
`lower_syntax_program` is wrapped by `CraneliftClifBackend`; `RustSource`
and `DotNetProject` backends are declared and fail closed. Backend
selection is via a `--backend` CLI flag, not via a mod contract
invocation.

Alternative considered: add a `GlueGenerator` mod contract kind.
Rejected because glue backends consume the full `CodegenInput` (typed
program, roots, target, ABI manifest), not per-item syntax
contributions. Mod contracts operate at `mod.generate`/`mod.rewrite`
before `lower.ready`; backends operate after `lower.ready`. They are
different seams with different inputs.

### D-GLUE-0002: Glue instantiates Interop.Contracts, not duplicate

`Beskid.Glue` consumes the `Interop.Contracts` vocabulary instantiated
as Rust types in `beskid_abi::interop`. It does not define a parallel
type-shape or ownership vocabulary. The C ABI profile and Rust ABI
profile bind the Interop.Contracts primitives via `bind()` methods;
they do not redefine them. This makes `Interop.Contracts` the single
source of truth for foreign-boundary type shapes.

Alternative considered: let `Beskid.Glue` define its own type-shape
enum. Rejected because it duplicates the normative vocabulary and
creates drift between the glue model and the ABI profiles.

### D-GLUE-0003: 0.4 is contracts cutoff, 0.5 is generation

0.4 ships: the typed Interop.Contracts Rust model, the `Backend` trait
and `BackendKind` enum, the `ToolchainProbe` scaffold, the seven glue
mod contract ids, the `Core.Interop` corelib package, the `mod.glue`
phase id, and the `--backend` CLI flag. All glue backends fail closed
with `NotImplementedFor0_4`. 0.5 ships: language-specific Rust crate
emission, .NET project emission via dotscope signature read/write,
stdio-protocol runtime implementation, and corelib glue runtime
implementations.

Alternative considered: ship a minimal Rust source emitter in 0.4.
Rejected because the stdio-protocol runtime and corelib glue runtime
are prerequisites for a usable glue backend; shipping a source emitter
without them produces non-functional output.

### D-GLUE-0004: Stdio bridge is a Beskid fiber with host typed tag objects

The stdio bridge is a generated Beskid fiber that exchanges
`StdioBridgeMessage` values over a channel. Each imported foreign
library is represented by a host typed tag object (`GlueTag`) carrying
the backend kind and library identity. The fiber marshals calls
through the tag object and the stdio message protocol. Glue rules
(type mapping, symbol emission, link args, signature read/write,
toolchain probe, stdio bridge generation) live in Beskid `type=Mod`
packages; the host seam (backend trait dispatch, Interop.Contracts
typed model, filesystem/process I/O for dotscope/rustc/dotnet) is Rust.

Alternative considered: direct FFI calls without a stdio bridge.
Rejected because the stdio bridge decouples Beskid GC from foreign
memory management, supports both directions (import and export), and
extends to other protocols (sockets, pipes) in 0.5+ without a new
architecture.

## Goals / Non-Goals

**Goals:**

- Instantiate `Interop.Contracts` as typed Rust models in
  `beskid_abi::interop` with C and Rust ABI profile bindings.
- Introduce a `Backend` trait and `BackendKind` enum at the
  `CodegenInput` boundary; wire `CraneliftClif` to the existing
  `lower_syntax_program`; declare `RustSource` and `DotNetProject` and
  fail closed.
- Add a `ToolchainProbe` scaffold in `beskid_abi::toolchain` modeled on
  the ABI-v5 runtime kit discovery/validation, covering rustc, cargo,
  dotnet, linker, and dotscope.
- Add a `Core.Interop` corelib package with `CStringView`, `CBuffer`,
  `CArrayView` record types matching ABI-v5 `BeskidStr`/`BeskidArray`
  layouts.
- Add seven `Beskid.Glue.*` contract ids to `SDK_MOD_CONTRACTS` and a
  `mod.glue` phase id between `mod.rewrite` and `lower.ready`.
- Add a `--backend` CLI flag (default `clif`); glue backends error
  immediately with `NotImplementedFor0_4`.
- Define the `Beskid.Glue` corelib package with glue attributes
  (`[Glue]`, `[GlueImport]`, `[GlueExport]`), `GlueTag` type,
  `StdioBridgeMessage` type, and seven atomized contracts.

**Non-Goals:**

- Language-specific Rust crate emission or .NET project emission (0.5).
- stdio-protocol runtime implementation (0.5).
- dotscope integration for .NET signature read/write (0.5).
- Corelib glue runtime implementations (0.5).
- A JIT glue execution path or glue sandboxing beyond existing mod
  capability policy.
- Changing the existing CLIF codegen path or `CodegenArtifact` layout.

## Risks / Trade-offs

- [Backend trait adds dispatch overhead] -> The `CraneliftClif` backend
  wraps the existing `lower_syntax_program` with no extra runtime cost;
  dispatch is static via `BackendKind` enum match, not dynamic trait
  objects in the hot path.
- [Seven new mod contract ids bloat the closed set] -> The set remains
  closed and compile-time checked; the seven ids mirror the existing
  SDK pattern and are discovered by the same registration scan.
- [Interop view types use `pointer` which is rarely exposed] -> The
  `pointer` primitive exists in `PrimitiveType` and is the correct
  type for address-sized tokens; using `i64` would lose pointer-width
  portability.
- [ToolchainProbe scaffold has no real resolution yet] -> The scaffold
  defines the typed `ToolSpec`, `ResolvedTool`, and atomized
  `ToolchainError` variants; 0.5 fills the resolution logic. The
  scaffold is fail-closed: no tool is resolved as available until
  validation is implemented.
- [mod.glue phase has no orchestrator yet] -> The phase id is declared
  and ordered; 0.5 wires the orchestrator. Existing phases are
  unaffected.

## Migration Plan

1. Validate this change strictly and validate the repository OpenSpec
   standard without running compiler or Cargo commands.
2. Add the typed Interop.Contracts Rust model in
   `beskid_abi/src/interop.rs` with C and Rust profile submodules.
3. Add the `Backend` trait, `BackendKind` enum, `BackendArtifact`
   enum, and `CraneliftClifBackend` in
   `beskid_codegen/src/backend.rs`; declare `RustSource` and
   `DotNetProject` failing closed.
4. Add the `ToolchainProbe` scaffold in `beskid_abi/src/toolchain.rs`.
5. Add the `Core.Interop` corelib package with `CStringView`,
   `CBuffer`, `CArrayView` and register it in `CoreLib.bws`.
6. Add the `Beskid.Glue` corelib package with glue attributes,
   `GlueTag`, `StdioBridgeMessage`, and seven contracts; register it
   in `CoreLib.bws`.
7. Extend `SDK_MOD_CONTRACTS` with seven `Beskid.Glue.*` contract ids.
8. Add the `mod.glue` phase id between `mod.rewrite` and
   `lower.ready` in all phase order arrays.
9. Add the `--backend` CLI flag to `BuildArgs`; validate it parses;
   error on glue backends with `NotImplementedFor0_4`.
10. Run focused verification: `cargo check -p beskid_abi`,
    `cargo test -p beskid_pipeline`, OpenSpec `validate-standard`;
    update catalog/changelog/traceability evidence.

Rollback before deletion reverts the complete typed model, backend
seam, toolchain probe, glue package, and CLI flag wave. After
deletion, rollback selects the last complete release bundle. It never
reinstates a CLIF-only pipeline without a backend trait, an
uninstantiated Interop.Contracts vocabulary, an ad hoc toolchain
discovery, or a six-contract mod SDK as the production path.

## Open Questions

None. The backend seam, Interop.Contracts instantiation, toolchain
probe shape, glue contract set, phase ordering, and CLI flag are fixed
by this change. Language-specific emission rules, stdio-protocol
wire format, and dotscope integration remain 0.5 implementation
detail constrained by these contracts.
