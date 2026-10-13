## ADDED Requirements

### Requirement: ABI-v5 Bsol manifest is the sole runtime contract authority
`compiler/runtime_manifest.bsol` SHALL be the sole input for ABI-v5 runtime
symbols, signatures, layouts, traps, capabilities, target adapter bindings,
ordered OS-import allowlists, static/shared kit metadata, and deterministic
hashes. Generated Rust declarations, C headers, ABI JSON, ISLE import facts,
JIT/AOT allowlists, canonical runtime validation, and kit validation MUST agree
exactly with that manifest and MUST fail closed on missing, duplicate,
orphaned, target-mismatched, signature-mismatched, capability-mismatched, or
hash-mismatched data. Generated application code SHALL call direct versioned
`beskid_rt_v5_*` exports; it MUST NOT use a runtime dispatch registry,
envelope, tag, handler registration, bridge anchor, or Rust-host symbol table.

#### Scenario: Manifest and generated import agree
- **GIVEN** an ABI-v5 runtime export used by typed ISLE lowering
- **WHEN** generated ABI artifacts, CLIF imports, and a selected runtime kit are
  validated
- **THEN** symbol, signature, capability, target, layout dependencies, and hash
  all derive from the same Bsol declaration before link or load

#### Scenario: Legacy manifest or dispatch path is rejected
- **GIVEN** a build input or artifact referencing `runtime_manifest.toml`, an
  ABI-v3 dispatch entrypoint, a dispatch tag, or a Rust bridge anchor
- **WHEN** contract generation or runtime-kit validation runs
- **THEN** it fails before execution and does not generate or select a
  compatibility route

### Requirement: Array access remains outside the runtime call ABI
The ABI-v5 manifest SHALL own typed array layouts, rooted allocation/growth,
construction finish, and pointer write barriers. It MUST NOT declare
`array_get` or `array_set`, and generated registries, CLIF, runtime kits, and
linked applications MUST NOT contain those element-access symbols. Bounds,
typed address calculation, loads, and stores SHALL be emitted directly by the
generation-bound ISLE rule using manifest-derived layout facts.

#### Scenario: ABI audit finds no element access export
- **GIVEN** generated ABI-v5 artifacts and a linked application that indexes an
  array
- **WHEN** manifest, import, export, and binary allowlists are audited
- **THEN** no `array_get` or `array_set` symbol or dispatch route exists and the
  application's verified CLIF contains the direct checked access

## REMOVED Requirements

### Requirement: BUILTIN_SPECS is sole Cranelift import source: Decision [D-EXEC-ABI-0003]
**Reason**: ABI-v5 import facts derive from `runtime_manifest.bsol` and are
consumed by typed ISLE lowering; the ABI-v3 `BUILTIN_SPECS` registry is not a
runtime authority.

**Migration**: Regenerate the exact ABI-v5 declarations and allowlists from
`runtime_manifest.bsol`, migrate every direct caller, then delete the legacy
registry and reject its production use.

### Requirement: Runtime builtins use C-unwind exports: Decision [D-EXEC-ABI-0004]
**Reason**: The canonical runtime is Beskid source compiled through the
production typed AST/Salsa -> ISLE -> verified CLIF path. Rust C-unwind
builtins are forbidden runtime provenance for produced ABI-v5 programs.

**Migration**: Implement each required export in canonical Beskid source or
one manifest-selected target adapter and delete Rust runtime/host/bridge
exports after provenance tests pass.

### Requirement: Manifest-generated registries: Decision [D-EXEC-ABI-0007]
**Reason**: `runtime_manifest.toml`, kernel/dispatch registries, handler tables,
and bridge anchors are superseded by direct ABI-v5 contracts generated from
`runtime_manifest.bsol`.

**Migration**: Move all symbol, signature, layout, capability, target binding,
allowlist, and hash data to the Bsol manifest; migrate JIT/AOT and runtime-kit
consumers; then delete TOML/v3 generation and fallback artifacts.
