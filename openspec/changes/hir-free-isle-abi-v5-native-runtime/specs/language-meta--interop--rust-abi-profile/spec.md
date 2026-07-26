## ADDED Requirements

### Requirement: Canonical ABI-v5 native runtime authority
The canonical runtime ABI SHALL be ABI-v5 and SHALL be implemented only by the
manifest-derived canonical Beskid runtime corpus and its two target assembly
contexts. `runtime_manifest.bsol` SHALL be the sole authority for runtime
symbols, signatures, layouts, import allowlists, generated bindings, and kit
identity. JIT, AOT, CLI, and release bundles SHALL resolve only an exact,
hash-validated installed ABI-v5 runtime kit and SHALL reject a missing,
tampered, wrong-target, wrong-profile, or older ABI kit before user code runs.

#### Scenario: Host resolves an exact native kit
- **GIVEN** a compiler artifact requiring ABI-v5 for its target and profile
- **WHEN** a host prepares execution or links an AOT artifact
- **THEN** it loads the exact installed canonical runtime kit and does not
  construct, register, link, or fall back to a Rust runtime, bridge, host, or
  dispatch envelope

### Requirement: Native host services use manifest-approved direct calls
Canonical runtime source SHALL implement host-facing services through
manifest-approved platform imports and target assembly adapters. Generated
programs SHALL import only manifest-declared ABI-v5 runtime symbols; they SHALL
NOT invoke `interop_dispatch_*`, register a handler table, or depend on a
host-owned static fallback.

#### Scenario: Missing legacy handler registration is irrelevant
- **GIVEN** an ABI-v5 program that uses a canonical runtime service
- **WHEN** it executes with an exact runtime kit
- **THEN** its behavior does not depend on `beskid_host_register_all`,
  `beskid_register_handlers`, or a Rust dispatch table

## REMOVED Requirements

### Requirement: ABI v4 runtime/host split: Decision [D-EXEC-RT-0017]

