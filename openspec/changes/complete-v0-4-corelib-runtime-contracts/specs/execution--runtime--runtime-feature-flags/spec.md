## ADDED Requirements

### Requirement: Required ABI-v5 runtime semantics are not feature-gated
Every supported ABI-v5 runtime kit SHALL provide the same mandatory managed
array storage, descriptor tracing, typed growth, bounds behavior, roots,
barriers, and filesystem adapter semantics. A build feature MAY enable
observability or implementation diagnostics only when it does not add, remove,
or alter a public/core/runtime semantic capability, ABI symbol, layout,
failure outcome, or conformance result. Runtime-kit metadata MUST reject a
semantic feature combination that would make required behavior unavailable.

#### Scenario: Array storage is present in every supported kit
- **GIVEN** any supported target/profile ABI-v5 runtime kit
- **WHEN** a non-empty managed array is allocated and used by a Corelib
  collection
- **THEN** real descriptor-backed storage, checked access, growth, roots, and
  barriers are available without an `arrays_backing` feature

#### Scenario: Diagnostic feature does not change behavior
- **GIVEN** two otherwise identical kits that differ only in an approved
  observability feature
- **WHEN** the same collection and filesystem conformance programs run
- **THEN** their public values, failures, symbols, layouts, and conformance
  results are identical

## REMOVED Requirements

### Requirement: Cargo features are separate from ABI version: Decision [D-EXEC-RT-0014]
**Reason**: The ABI-v5 canonical runtime is not a Rust Cargo runtime and
required semantics cannot vary by build feature. Observability-only switches
are governed by the replacement requirement.

**Migration**: Remove runtime-semantic Cargo features and record only
non-semantic observability metadata that leaves ABI and behavior unchanged.

### Requirement: arrays_backing gates array element storage: Decision [D-EXEC-RT-0015]
**Reason**: Header-only or null-backed non-empty arrays violate mandatory
Corelib collection behavior and descriptor-precise managed storage.

**Migration**: Make typed backing storage mandatory in every ABI-v5 kit,
remove the feature and its test combinations, and reject any artifact that
retains header-only semantics.
