## ADDED Requirements

### Requirement: Normalized Glue binding identity
Each Glue binding SHALL consume the existing Interop.Contracts type/call/ownership vocabulary and record backend, canonical library identity, foreign symbol, import/export direction, selected target, C ABI, user FFI layout band, signature semantic shapes and ownership. Identity SHALL be deterministic from these fields, independent of AST numeric IDs or discovery order. Ambiguous/colliding identities and Extern/Glue annotations on the same boundary SHALL be rejected before lowering. GC-managed source references SHALL NOT cross as ordinary FFI pointers or wire addresses.

#### Scenario: Identity covers semantics
- **GIVEN** two bindings differ only in ownership, direction, target or library
- **WHEN** normalization and compatibility validation run
- **THEN** they have distinct checked identities and mismatched peers fail before call (R4-BIND-01..03)

#### Scenario: Exclusive annotations
- **GIVEN** a contract or method carries both Extern and Glue annotation
- **WHEN** semantic analysis runs
- **THEN** a source diagnostic rejects it before generation (R4-BIND-04)


### Requirement: Opaque stdio values retain admitted native ownership
The Glue stdio adapter SHALL admit an opaque value only through the current privately qualified native owner artifact and its canonical shared provider, full brand, library, generation and live borrow authority. The adapter SHALL bind each connection epoch to the actual peer process and admitted source/image closure, retain owner and provider image leases through callback completion and cleanup, and deny descriptive token envelopes that lack this authority before dispatch. A serialized integer, map, shape digest or peer handshake alone SHALL NOT issue ownership.

#### Scenario: Restarted peer denies a prior connection token
- **GIVEN** an opaque value admitted by one peer process and connection epoch
- **WHEN** that peer exits and a new connection presents the prior value, including coincident numeric token fields
- **THEN** admission fails before callback effects because the actual process and connection authority differ (R4-STDIO-20).

#### Scenario: Forged or foreign opaque envelope has no callback effects
- **GIVEN** a descriptive envelope containing a token and full brand but no matching current privately admitted owner domain
- **WHEN** the adapter receives it, or receives a token from another admitted brand or library
- **THEN** it rejects the request before foreign pointer exposure, typed decode publication or callback effects (R4-STDIO-21).

#### Scenario: Cancelled opaque call preserves ownership until cleanup settles
- **GIVEN** an actual owning Rust artifact and a live borrowed opaque call on an admitted connection
- **WHEN** cancellation, panic or shutdown occurs and cleanup remains busy or fails
- **THEN** the adapter retains the owner and provider image leases, reports the cleanup failure, and does not claim release or unload until canonical ownership settles (R4-STDIO-22).
