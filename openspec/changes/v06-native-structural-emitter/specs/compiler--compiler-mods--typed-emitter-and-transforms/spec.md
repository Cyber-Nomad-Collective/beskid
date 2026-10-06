## ADDED Requirements

### Requirement: Explicit native structural generator constructor ABI
Required native structural Generator artifacts SHALL declare structural ABI version1 through `beskid_mod_structural_generator_abi_version()->u32` and a separately declared structural entrypoint. The host SHALL reject missing/wrong discriminator before interpreting a structural request or result. `ModStructuralGenerationRequestV1` SHALL contain explicit version/size, unchanged legacy generation context, a versioned size-checked constructor table with opaque context token and actual syntax generation, and a read-only semantic handle. The legacy `ModGenerationRequest` layout SHALL NOT be silently appended or reinterpreted. Constructor callbacks SHALL accept bounded typed node specifications and return status/kind/opaque handle; required-capability absence SHALL be terminal, with no stub, generated source parsing or raw AST pointer cast. ABI offset/size assertions SHALL cover all three required native targets.

#### Scenario: Native constructor builds actual nodes (MOD-06-03)
- **GIVEN** a real native structural artifact with matching version and table using function and generic-record constructors
- **WHEN** production invokes its registered entrypoint and materializes returned handles
- **THEN** new static function and record nodes merge with provenance and zero CodeString outputs, followed by current semantic validation

#### Scenario: ABI discriminator gates signature (MOD-06-04)
- **GIVEN** missing or wrong artifact discriminator, request version/size or callback capability
- **WHEN** required structural generation is requested
- **THEN** generation fails before incompatible dispatch and no legacy or stub path supplies successful output

### Requirement: Native structural callback authority and bounds
The node budget SHALL cover the sum of all successfully inserted contributions in one invocation arena. Insertion SHALL reserve that budget atomically with publication, including concurrent callbacks. A rejected insertion SHALL preserve previously issued handles and the remaining budget; selecting only a subset of contributions for materialization SHALL NOT reset or enlarge the insertion budget.

Structural constructor callbacks SHALL validate current registration owner, actual generation, active invocation context, contribution kind and lifetime. Opaque node/context tokens SHALL be host lookup identities never dereferenced as AST/context addresses, never reused after close, and rejected when stale/foreign/null. Arena bounds SHALL be at most4096 items,65536 nodes and depth128; strings SHALL be at most1MiB and constructor slices at most4096 entries. Callback input views SHALL be validated/copied during invocation; retained callbacks after invocation ends SHALL fail without touching freed context. Materialization SHALL validate the entire output before publication and preserve source/generator/span provenance; semantic operations SHALL consume the read-only generation-bound query handle, with missing facts terminal.

#### Scenario: Independently legal contributions exceed the invocation budget
- **GIVEN** several contributions each fit the per-tree depth bound and together exhaust the arena node budget
- **WHEN** another contribution is inserted, including through concurrent callbacks
- **THEN** insertion fails with a bounds error and earlier handles remain valid without publishing the rejected contribution

#### Scenario: Invalid handles cannot materialize (MOD-06-05)
- **GIVEN** wrong owner/generation/kind, foreign/null token or a closed arena
- **WHEN** structural output is materialized
- **THEN** a checked error occurs with no partial nodes published and no AST pointer dereference

#### Scenario: Bounded constructors and late callbacks (MOD-06-06)
- **GIVEN** a constructor exceeds limits or retains a callback token after native invocation returns
- **WHEN** it attempts node construction
- **THEN** construction fails before excessive allocation/publication or freed-context access

### Requirement: Registered assembly semantic shape authority
The native structural semantic bridge SHALL derive its generation and project owner from the existing registered ProgramAssembly and Salsa syntax authority. Before issuing a semantic type handle it SHALL validate the source unit registration, current generation, project owner and declaration kind. Read-only consumers SHALL receive issuer-bound opaque handles, not unchecked AST keys or raw addresses as authority. Shape access SHALL delegate to canonical semantic queries without a second shape cache, HIR rebuild, source reflection or ABI-offset inference. Shapes SHALL preserve canonical declaration identity, applied generic arguments and substitution, source-ordered named fields, and source-proven managed-reference classification. Unsupported or unresolved shapes SHALL return a checked unavailable result, never a guessed primitive or ownership class.

#### Scenario: Current primitive and composite fields (MOD-06-07)
- **GIVEN** a real materialized assembly registered with the canonical query database containing primitive fields and a nested nominal type with a managed string field
- **WHEN** a native structural consumer resolves the current type through its assembly-bound semantic authority
- **THEN** the read-only shape preserves declaration/source/generation identity, field order, primitive identity, nested nominal identity and managed-reference facts

#### Scenario: Applied generic field retains canonical substitution (MOD-06-08)
- **GIVEN** a current source field of an applied nominal type such as Box<i32> whose declaration contains a T value field
- **WHEN** the semantic bridge queries that field's type shape
- **THEN** the handle retains the Box declaration and i32 argument identity and exposes the value field as i32 with scalar ownership
- **AND** an unapplied or unsupported generic shape returns unavailable rather than inferring from layout offsets or erased nominal names

#### Scenario: Foreign semantic authority is rejected (MOD-06-09)
- **GIVEN** a stale generation, unregistered source unit, foreign project owner, non-type declaration or handle issued by another semantic authority
- **WHEN** type resolution or shape access is requested
- **THEN** no shape is returned and no secondary syntax or semantic snapshot is created

### Requirement: Complete adapter constructor and provenance path
The structural constructor surface required for serialization SHALL represent supported primitive and composite field types, applied generics, callable parameters/results, field access, calls, literals, result propagation and function bodies as typed nodes. It SHALL support real adapter functions that consume canonical codec interfaces and actual source fields; empty unit functions and generic-only records SHALL NOT satisfy full adapter delivery. Source unit, actual generation, generator owner and origin span SHALL travel with each generated item through native materialization, GeneratorOutcome, typed merge and subsequent semantic registration. Any unavailable constructor or semantic fact required by an adapter SHALL terminate generation without parsing generated text or emitting a partial successful adapter.

#### Scenario: Real field adapter body materializes (MOD-06-10)
- **GIVEN** a current eligible type with primitive and composite fields and available canonical semantic and codec contracts
- **WHEN** its native serialization generator builds encode/decode adapter functions through typed constructors
- **THEN** the functions contain actual typed parameters, result types and field/codec call bodies, preserve provenance through merge, and pass current semantic validation

#### Scenario: Provenance survives typed merge (MOD-06-11)
- **GIVEN** a generated item with a canonical source-unit identity, actual assembly generation, generator registration and origin span
- **WHEN** native output becomes GeneratorOutcome and merges into the host typed program
- **THEN** subsequent semantic registration and diagnostics can recover the same source/generator/span provenance without an arena-only side channel

### Requirement: Lossless compiler SDK syntax mirrors
The generated compiler SDK SHALL preserve the canonical Rust syntax data model's scalar widths and signedness, source spans and node identifiers, optional absence, list element identity, generic bounds and attached documentation metadata. Traversal annotations SHALL control navigation and SHALL NOT erase data from reflected constructor schemas. Concrete source wrappers SHALL retain their wrapped typed node and its source metadata. Generated constructor schemas SHALL be produced from canonical source declarations; hand-written duplicate syntax declarations and source-text reconstruction SHALL NOT substitute for these schemas.

#### Scenario: Generic function mirror retains source authority [SDK0601]
- **GIVEN** a canonical function declaration with spanned identifiers, parameters, return type, generic contract bounds and parameter documentation
- **WHEN** its SDK constructor schema is regenerated
- **THEN** every field SHALL retain its typed value, optionality and source metadata, including fields excluded from child traversal

#### Scenario: Numeric and byte identities remain distinct [SDK0602]
- **GIVEN** canonical fields containing signed and unsigned integer widths, f32 and f64, optional numeric values and byte lists
- **WHEN** their SDK schemas are regenerated
- **THEN** their widths, signedness, optional absence and byte element identity SHALL remain distinct without coercion to i64, f64 or string

### Requirement: Source-issued serialization contribution bindings
The Mod host SHALL decode every native structural contribution into the complete typed source AST before considering serialization metadata. A generated ImplBlock contribution MAY describe a target semantic handle and contribution index; that description SHALL NOT grant authority. The invocation-scoped compiler provider SHALL reject duplicate or out-of-range indices, foreign or stale target handles, and mismatched contribution targets before issuing any private compiled metadata. Emission SHALL revalidate the generated implementation and exact applied contract witnesses against the current merged generation.

#### Scenario: MOD-06-25 Full implementation contribution retains target correspondence
- **GIVEN** a qualified generator returns a complete SpannedImplBlock and a unique binding to a currently issued target handle
- **WHEN** the parent decodes the contribution during the live invocation
- **THEN** it retains the complete implementation AST and privately issued correspondence for post-merge revalidation

#### Scenario: MOD-06-26 Descriptive bindings cannot qualify foreign contributions
- **GIVEN** a generator supplies a duplicate index, an unknown index, or a foreign target handle
- **WHEN** the parent validates generated bindings
- **THEN** it rejects the result without issuing serialization metadata or publishing generated syntax
