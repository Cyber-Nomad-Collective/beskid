## ADDED Requirements

### Requirement: Direct ABI-v5 runtime calls
Generated application code MUST call exact versioned `beskid_rt_v5_*` symbols with target-correct signatures and MUST NOT use dispatch tags, envelopes, handler registration, generic return routers, or pointer-as-integer conventions.

#### Scenario: Application import validation
- **GIVEN** a generated application module
- **WHEN** ABI validation inspects its imports
- **THEN** every runtime import exactly matches the manifest-generated ABI-v5 allowlist

### Requirement: Whole-kit ABI compatibility
The toolchain MUST reject mixed ABI versions, targets, profiles, layouts, symbol allowlists, or hashes before link or execution.

#### Scenario: ABI-v4 and ABI-v5 component mix
- **GIVEN** an ABI-v5 compiler and an ABI-v4 runtime artifact
- **WHEN** runtime-kit validation runs
- **THEN** validation fails without loading or linking the artifact

## REMOVED Requirements

### Requirement: ABI v3 kernel shrink bump: Decision [D-EXEC-ABI-0009]
**Reason**: ABI v5 replaces the v3/v4 runtime boundary with direct manifest-authoritative calls and a coherent runtime kit.
**Migration**: Rebuild and distribute compiler, runtime, corelib, and tooling as one ABI-v5 bundle.
