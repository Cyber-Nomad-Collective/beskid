## ADDED Requirements

### Requirement: Current syntax declaration resolution
The semantic SDK SHALL expose ResolveSyntaxType(NodeRef) returning Result<SemanticHandle,SemanticError>. Its host operation SHALL validate the exact invocation-issued syntax reference, source unit, generation and declaration kind before deriving the canonical declaration and invoking the existing semantic authority. The operation SHALL NOT reconstruct an issuer from source strings, spans, node numbers or a transported descriptive declaration. A generic declaration without concrete type arguments SHALL require the separate template authority and SHALL NOT acquire a concrete shape through this resolver.

#### Scenario: Current concrete syntax type
- **GIVEN** a Collector's current issuer-owned reference to a concrete record or enum declaration
- **WHEN** ResolveSyntaxType executes in that invocation
- **THEN** it returns the current semantic handle for that exact declaration.

#### Scenario: Forged stale or generic reference
- **WHEN** ResolveSyntaxType receives a fabricated reference, stale generation, foreign invocation, non-type node or unapplied generic declaration
- **THEN** it returns a structured semantic error and grants no concrete shape or serialization identity.

### Requirement: Separate generic template contribution authority
The SDK SHALL expose an opaque TypeTemplate that retains an invocation-issued syntax reference to an unapplied generic record or enum declaration. ResolveSyntaxTemplate SHALL validate the exact current reference and nonempty declared generic parameter list. A TypeTemplate SHALL NOT be a SemanticHandle, concrete TypeShape or stable ShapeId. BindTemplate SHALL associate one typed implementation contribution with that template; the host SHALL validate unique in-range contribution indices, exact declared receiver and parameter correspondence, full implementation bounds and immutable original source/package provenance before retaining a private non-deserializable carrier. New generations SHALL revalidate the admitted original declaration and actual contributed generic implementation. Concrete adapters and metadata SHALL require separate exact argument substitution, bound and current-generation validation.

#### Scenario: Generic template binding
- **GIVEN** a current reference to an annotated generic record or payload enum
- **WHEN** the Mod resolves its template and binds a structural generic implementation
- **THEN** the host retains an issuer-owned template/contribution proof without granting a concrete shape.

#### Scenario: Descriptive template forgery
- **WHEN** a source or transported value supplies copied template metadata, a stale reference, a repeated contribution index or an unrelated receiver
- **THEN** binding rejects before executable adapters or descriptors are published.

### Requirement: Required native Mod invocation fails closed
A production-required Collector, AttributeGenerator or Generator SHALL execute its actual AOT artifact and registered entry point. Missing artifacts, linker/load failure, absent symbol, null/malformed result or unsupported result materialization SHALL produce a terminal diagnostic; the host SHALL NOT substitute StubContractInvoker success. Artifact/library/result lifetime SHALL remain valid through checked contribution materialization.

#### Scenario: Required native failure (MOD-06-01)
- **GIVEN** a required serialization Mod has a missing object, symbol or null result
- **WHEN** the host invokes it
- **THEN** compilation fails with the concrete native failure rather than continuing with stub results

#### Scenario: Real native generator (MOD-06-01)
- **GIVEN** a valid required native generator artifact
- **WHEN** the host invokes generation
- **THEN** the actual entry executes and its checked typed contribution becomes input to the canonical pipeline

### Requirement: Source-scoped canonical generated paths
The host SHALL expose a read-only canonical path planning operation for a current invocation-issued syntax reference and a bounded closed catalog of canonical serialization, reader, result, numeric and collection declarations. Planning SHALL require the exact current compiler-registered canonical source and unique declaration. It SHALL derive routes solely from the requesting source unit's registered assembly namespace visibility and verify that each returned route identifies that same declaration. A descriptive route DTO SHALL NOT grant semantic, provider or package authority. Equivalent aliases to one exact declaration SHALL select the shortest visible route, breaking ties lexically; absent visibility or ambiguous declaration correspondence SHALL fail closed. The host SHALL reject forged, foreign, stale, closed-invocation, unknown and repeated selector requests. Generated syntax SHALL consume these routes rather than assume a universal namespace prefix.

#### Scenario: Generated reader uses the caller's actual namespace
- **WHEN** a caller requests a canonical Reader declaration through a current issued reference
- **THEN** the host returns a visible assembly-derived route resolving to that exact canonical declaration
- **AND** neither a copied declaration nor a caller-selected prefix grants eligibility

#### Scenario: Canonical declaration lacks a caller route
- **WHEN** canonical source exists but the requesting unit has no unambiguous visible route to it
- **THEN** path planning rejects before generated syntax publication

#### Scenario: Foreign invocation cannot request even an empty plan
- **WHEN** an invocation presents another invocation's syntax reference
- **THEN** path planning rejects before catalog processing
