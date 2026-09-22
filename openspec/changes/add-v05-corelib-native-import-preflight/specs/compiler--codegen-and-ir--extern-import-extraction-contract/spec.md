## ADDED Requirements

### Requirement: Corelib native imports require exact source and manifest preflight

Before a reference compiler backend adds a Corelib-native adapter to its artifact import set, it SHALL retain and validate the exact Corelib declaration
triple of logical source path, service name, and adapter. The declaration SHALL
resolve through the compiler-minted source-scoped Corelib capability. The
compiler SHALL validate it against the canonical ABI-v5 manifest for the
selected target and SHALL require exactly one generated binding for every
supported target. Every binding SHALL use the declared adapter as its target
implementation and SHALL have an identical parameter/result shape. The
target-independent source-builtin class SHALL instead resolve through exactly
one generated source declaration with the same service name, adapter, and
shape; that declaration applies uniformly to every supported target. The
compiler SHALL reject an unknown, copied, source-mismatched,
adapter-mismatched, duplicate, target-incomplete, or target-shape-mismatched
declaration before producing a JIT or AOT backend artifact.

This requirement governs Corelib runtime services, not user `Extern` imports.
It SHALL NOT infer a library, accept a native-symbol alias, introduce a
fallback, or invoke a Glue backend. Glue remains fail-closed and deferred to
v0.6.

**Stable ID:** `BSP-REQ-CORELIB-NATIVE-IMPORT-PREFLIGHT-001`

#### Scenario: Networking service is admitted only from its canonical Corelib source

- **GIVEN** `Network/Internal.bd` from the compiler-embedded Corelib corpus
  calls `__network_open` with adapter `beskid_rt_v5_network_open`
- **WHEN** module lowering prepares the import for a supported target
- **THEN** the compiler admits the adapter only after its source declaration
  and every generated target binding pass the Corelib-native-import preflight

#### Scenario: copied networking declaration is rejected

- **GIVEN** a copied or user source declares `__network_open` with adapter
  `beskid_rt_v5_network_open`
- **WHEN** lowering attempts to prepare a Corelib-native import
- **THEN** the compiler rejects it before any backend artifact is produced

#### Scenario: target binding drift is rejected

- **GIVEN** a generated binding for a Corelib service has a missing target,
  duplicate target, different adapter implementation, or different ABI shape
- **WHEN** the compiler preflights that service
- **THEN** the compiler rejects the artifact rather than guessing a compatible
  target binding

#### Scenario: target-independent source builtin remains exact

- **GIVEN** a canonical Corelib source calls a target-independent source
  builtin such as `__fiber_yield`
- **WHEN** lowering prepares its native import
- **THEN** the compiler admits it only when exactly one generated source-builtin
  declaration preserves the same name, adapter, and ABI shape for every
  supported target
