## ADDED Requirements

### Requirement: CodegenInput is the sole lowering boundary
Code generation MUST accept only a `CodegenInput` containing typed-program identity, AST roots and keys, semantic-query access, target metadata, and the ABI-v5 manifest; it MUST NOT accept HIR.

#### Scenario: HIR-free codegen entry
- **GIVEN** a validated typed program
- **WHEN** JIT or AOT requests code generation
- **THEN** both backends consume the same `CodegenInput` and generated ISLE rules

## REMOVED Requirements

### Requirement: Cranelift lowering via lower_source: Decision [D-COMP-IR-0009]
**Reason**: `lower_source` and its Rust `Lowerable` implementations consume HIR and duplicate rule selection.
**Migration**: Invoke the generated ISLE lowering entry with `CodegenInput`.

### Requirement: Supersede lower_source production entry: Decision [D-COMP-IR-0011]
**Reason**: All legacy and transitional lowering entry points are replaced by one generated ISLE path.
**Migration**: Use the sole `CodegenInput` lowering boundary.
