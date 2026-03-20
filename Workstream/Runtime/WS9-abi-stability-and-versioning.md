# WS9: ABI Stability and Versioning

Owner: Runtime + AOT + Engine
Status: Planned

## Scope
- Freeze the exported runtime symbol set and add CI guards
- Manage ABI versioning for future changes

## Deliverables
- runtime-abi-v1.0.md with symbol list and signatures
- CI check that asserts RUNTIME_EXPORT_SYMBOLS matches a frozen snapshot

## Tasks
1. Freeze symbol set
   - Audit symbols in beskid_abi::symbols and runtime exports
   - Update snapshot test (beskid_tests) and block accidental drift
2. ABI version management
   - Document bump policy; update BESKID_RUNTIME_ABI_VERSION when breaking
   - Provide helpful error if prebuilt runtime ABI mismatches (already exists)
3. Tooling
   - Simple script to diff symbol sets between commits/releases

## Acceptance Criteria
- Snapshot tests pass; any symbol drift breaks CI with clear message
- runtime-abi-v1.0.md published

## Risks/Mitigations
- Hidden transitive exports: centralize through ABI crate; keep one source of truth

## References
- compiler/crates/beskid_abi/src/symbols.rs
- compiler/crates/beskid_tests/src/abi/contracts.rs

