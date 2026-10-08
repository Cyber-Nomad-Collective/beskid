## ADDED Requirements

### Requirement: Registered executable callable identities
Native Mod preparation SHALL derive each executable callable identity from its exact current registered declaration key, concrete signature and actual emitted function in the same typed codegen artifact. Declaration leaf names and caller-supplied linker symbols SHALL NOT establish callable authority. Equal leaf names in separate owners SHALL retain distinct callable identities. Stale, foreign, unavailable or unapplied generic declaration keys SHALL NOT resolve to an executable callable. A physical pointer signature alone SHALL NOT authorize casting a native host request into a Beskid SDK object; the native bridge SHALL construct and extract typed SDK values through canonical layout authority.

#### Scenario: Equal method names retain exact emitted identities (MOD-06-09)
- **GIVEN** distinct registered function and method declarations with the same leaf name
- **WHEN** the prepared module emits them and a native bridge selects either declaration
- **THEN** exact keys resolve to their distinct emitted symbols and concrete signatures, without leaf-name matching

#### Scenario: Stale callable selection rejected (MOD-06-10)
- **GIVEN** an emitted prepared module and a declaration key from another generation or source owner
- **WHEN** a native bridge requests the callable
- **THEN** no executable identity is returned and no invocation occurs

#### Scenario: Contract discovery retains registered declaration identity (MOD-06-11)
- **GIVEN** types declaring separate contracts whose methods have the same leaf name
- **WHEN** native adapter preparation discovers their conformances
- **THEN** each conformance resolves to its exact registered contract declaration key, including exact receiver identity for impl blocks
- **AND** discovery alone does not establish canonical SDK provenance or a validated implementation witness

#### Scenario: Equal pointer ABI does not authorize different request types (MOD-06-12)
- **GIVEN** a contract method expecting a string and a declared implementation accepting a byte array
- **WHEN** native adapter preparation validates the implementation witness
- **THEN** the differing source identities reject the implementation even though both use pointer ABI representation
- **AND** witnesses from another project or generation are unavailable before native invocation

#### Scenario: Native requests use typed SDK constructors (MOD-06-13)
- **GIVEN** a validated native invocation context and canonical SDK request declarations
- **WHEN** the bridge constructs compilation, workspace, catalog and contract request values
- **THEN** ordinary typed SDK constructors allocate the exact managed objects with compiler-emitted descriptors and field tracing
- **AND** each returned object is rooted before another allocation, without casting native request memory into SDK objects

### Requirement: Actual assembly generation authority for native Mods
Production Mod collection/generation/analysis and typed pipeline operations SHALL carry the current `ProgramAssembly.SyntaxGenerationId` or identical registered Salsa syntax generation. Absent generation SHALL explicitly mean unavailable authority; zero or a hardcoded epoch SHALL NOT authorize structural construction, query or pipeline edits. The native structural request, host arena, read-only query surface and resulting node provenance SHALL agree on owner/generation; changes to source assembly SHALL invalidate stale handles and facts.

#### Scenario: Current assembly identity reaches generator (MOD-06-07)
- **GIVEN** an assembled source generation and a native structural Mod
- **WHEN** production dispatch and typed pipeline merge run
- **THEN** request/arena/query/merge use that exact generation rather than hardcoded zero or one

#### Scenario: Stale or absent authority rejected (MOD-06-08)
- **GIVEN** a previous-generation handle or no assembled generation
- **WHEN** a structural constructor/query/edit is requested
- **THEN** it rejects before effects instead of fabricating an epoch or rebuilding a shadow semantic model

### Requirement: Every discovered Mod has a qualified executable artifact
The host SHALL reject a discovered Mod dependency lacking its validated executable descriptor before collection, generation, analysis or rewrite. The host SHALL construct default dispatch solely from validated executable artifact paths and SHALL NOT install a recording stub when an invoker is absent. Absence of Mod dependencies SHALL continue to skip Mod execution.

#### Scenario: Missing descriptor cannot silently disable a dependency (MOD-06-14)
- **GIVEN** a discovered Mod dependency with no executable descriptor
- **WHEN** native invoker preparation or collection is requested
- **THEN** preparation fails with the dependency identity and collection cannot succeed with empty registrations

### Requirement: Source-qualified Mod instance construction
A native adapter SHALL obtain each managed contract receiver through an exact registered source factory with a nominally matching result, or through a current field-free aggregate construction proven by canonical layout facts. The canonical `ModFactory<T>` contract SHALL expose `T Create(CollectRequest context)`; an applied implementation witness SHALL preserve the exact nominal T rather than its physical pointer representation. Factory receivers SHALL satisfy the same construction rules. Construction cycles, missing factories, ambiguous factories and incompatible factory results SHALL fail before contract invocation. The host SHALL root each constructed managed receiver before further allocation and SHALL NOT pass a null receiver or manufacture field defaults.

#### Scenario: Stateful receiver is fully initialized by its source factory (MOD-06-15)
- **GIVEN** a registered Mod receiver with fields and an exact source factory conforming to ModFactory of that receiver
- **WHEN** its native adapter is prepared and invoked
- **THEN** the factory receives the typed current collection context, returns the exact managed receiver and the adapter roots it before calling the validated contract method

#### Scenario: Physically equal foreign factory result is rejected (MOD-06-16)
- **GIVEN** a factory returning a different nominal receiver whose native representation is also a pointer
- **WHEN** native adapter preparation validates the factory
- **THEN** it rejects before native invocation without casting the factory result or inventing defaults

### Requirement: Current-source executable cache selection
The host SHALL inspect executable cache candidates against the current complete source, manifest, lock, SDK, target and runtime-provider closure. It SHALL select only one qualified current candidate, SHALL NOT select the lexicographically first or most recent candidate, and SHALL reject multiple qualified candidates as ambiguous. Stale candidates SHALL NOT establish execution authority. If no current candidate qualifies, the failure SHALL identify the need to rebuild rather than execute stale source.

#### Scenario: Stale cache cannot outrank current source (MOD-06-17)
- **GIVEN** a lexicographically earlier stale executable and one qualified executable matching the complete current closure
- **WHEN** the host prepares the Mod dependency
- **THEN** only the qualified current executable is selected

#### Scenario: Two qualified executables are ambiguous (MOD-06-18)
- **GIVEN** two distinct cache candidates qualifying for the same current Mod dependency
- **WHEN** the host selects its native executable
- **THEN** preparation fails before collection with an ambiguity diagnostic instead of choosing by path or timestamp

### Requirement: Issued compilation syntax entry root
The typed SDK Compilation request SHALL carry an entryRoot with the canonical nominal NodeRef source type. The host SHALL issue it from the actual borrowed registered assembly, preserving its source unit, current syntax generation, root node and active invocation issuer. File names, mutable counters and user-created pointer-shaped values SHALL NOT establish entry-root authority. Query traversal SHALL consume issued roots and validate every referenced owner, generation and invocation before projecting facts. Generic visitors SHALL execute Enter and Exit in Beskid source around recursive Children traversal; visitor receivers and function pointers SHALL NOT cross the host callback transport.

#### Scenario: Compilation supplies its actual registered root (MOD-06-19)
- **GIVEN** a native Mod invocation with a registered source assembly
- **WHEN** its typed compilation request is constructed
- **THEN** entryRoot identifies that assembly's actual root with the active issuer and generation, and Query accepts it without reconstructing syntax from a file path

#### Scenario: SDK field uses a qualified nominal leaf
- **GIVEN** a SDK declaration with a fully qualified nominal field type whose homonymous source module is not separately imported
- **WHEN** the production dependency closure is assembled
- **THEN** the complete nominal source module is materialized and its field retains the exact nominal type identity

#### Scenario: Foreign root and visitor pointer are rejected (MOD-06-20)
- **GIVEN** a NodeRef from another assembly or closed invocation, or a visitor receiver offered as a raw pointer
- **WHEN** a native query or traversal is requested
- **THEN** stale or foreign query authority is rejected and visitor execution remains in typed Beskid source

### Requirement: Bounded flat SDK syntax collections
Generated SDK mirrors of Rust syntax vectors SHALL use a canonical managed array record with one typed items field. The machine correspondence SHALL identify this representation explicitly and preserve every element's order, source metadata and numeric width. Native transport SHALL bound collection count and bytes independently of structural nesting depth; a flat collection SHALL NOT consume one structural depth level per element. Generation and invocation SHALL reject the retired recursive Cons/Empty representation rather than retaining a compatibility decoder.

#### Scenario: Flat collection exceeds the nesting limit (MOD-06-21)
- **GIVEN** an issued syntax projection containing 257 flat elements and an admitted structural depth bound of 128
- **WHEN** it crosses the generated typed SDK and native callback transport
- **THEN** all elements retain their exact order and values without constructing a recursive list or increasing the stack depth limit

#### Scenario: Collection exceeds its independent count budget (MOD-06-22)
- **GIVEN** a syntax collection exceeding the invocation's admitted element count or byte budget
- **WHEN** a worker constructs or returns that collection
- **THEN** invocation fails before publishing a contribution, and the structural depth limit is unchanged

### Requirement: Lossless generated declaration wrappers
Native typed syntax contributions SHALL transport complete SpannedContractDefinition, SpannedTypeDefinition and SpannedFunctionDefinition values, including their source span and node identity. The host SHALL map those wrappers through the canonical machine correspondence and issue fresh merged syntax generation authority. Bare declaration payloads SHALL NOT be accepted as a compatibility substitute or supplied with fabricated wrapper metadata.

#### Scenario: Generated declaration retains its wrapper (MOD-06-23)
- **GIVEN** a qualified generator returning a complete typed declaration wrapper
- **WHEN** the native host translates and merges the contribution
- **THEN** its source span and declaration contents are preserved and its resulting semantic authority belongs to the newly registered merged generation

### Requirement: Owned native invocation transport
The host SHALL transport compiler-issued compilation, workspace, package, and target context as owned typed values through the isolated ABI2 worker. Public pointer views and raw image paths SHALL NOT issue executable native authority. AttributeGenerator contributions SHALL retain their complete source SpannedAttributeDeclaration wrappers through typed decoding and fresh-generation merge.

#### Scenario: Owned request remains valid after context cloning
- **GIVEN** a qualified native contract and an owned compilation request
- **WHEN** the request is cloned and transported to the isolated worker
- **THEN** strings, package registrations, and target arrays SHALL retain their exact values without borrowed host pointer views
- **AND** callbacks SHALL borrow only the current invocation authority on its owning thread

#### Scenario: MOD-06-24 Attribute declaration metadata survives execution
- **GIVEN** an AttributeGenerator returning a source-issued SpannedAttributeDeclaration
- **WHEN** the host decodes and merges its contribution
- **THEN** the declaration node, source span, and node identifier SHALL remain intact
- **AND** the merged program SHALL receive a fresh registered generation

### Requirement: Owned typed rewriter replacement
An admitted native rewriter SHALL be able to return a newly constructed typed program item or direct declaration projection. The registered syntax provider SHALL validate its canonical Rust AST kind, bounded structure and current host-owned target before queuing replacement. Replacement SHALL retain the target's outer source provenance and leading documentation; supplied numeric node identities SHALL NOT issue generation authority. Applying the pipeline SHALL publish an owned program for fresh-generation registration.

#### Scenario: Rewriter constructs a new declaration
- **GIVEN** a current issued host declaration and an admitted typed rewriter
- **WHEN** the rewriter returns a newly constructed canonical declaration projection
- **THEN** the provider queues its typed replacement without requiring an existing replacement NodeRef or textual parsing

#### Scenario: Forged target or malformed projection
- **GIVEN** a foreign target, a mismatched projection kind or an over-budget replacement
- **WHEN** owned replacement is requested
- **THEN** the provider rejects it before mutating the pending program

### Requirement: Immutable prepared executable issuance
Prepared executable entries and their emitted artifact SHALL form an immutable compiler-issued packet with read-only inspection. A private initialization or native authority plan SHALL remain bound to the exact lowered bodies, data, imports, exports and descriptor plans. Consuming or cloning a general codegen artifact SHALL NOT permit altered contents to retain privileged initialization authority; privileged emission SHALL validate the complete private structural binding before emission.

#### Scenario: Caller cannot substitute a prepared body
- **GIVEN** an issued prepared entrypoint packet
- **WHEN** a caller inspects its entries and emitted artifact
- **THEN** its public API provides no mutable field or replacement constructor

#### Scenario: Cloned artifact has changed body or descriptor data
- **GIVEN** a cloned artifact retaining a private initialization plan
- **WHEN** its body, data, imports, exports or descriptor plans differ from the issued snapshot
- **THEN** privileged emission rejects the artifact before generating an executable initializer

### Requirement: Directional native transport closure
The native producer SHALL derive separate recursive codec closures from issued entry and callback signatures. Host-to-source decoding SHALL include entry requests, factory requests and callback results; source-to-host encoding SHALL include entry results and callback parameters. Exact source constructors SHALL be required for decoded nominal values. Output-only nominal values SHALL use their issued layouts and encoders without fabricated constructors or unrelated decoding requirements.

#### Scenario: Generated result has no input constructor
- **GIVEN** an issued generated contribution or result type used only as an entry result
- **WHEN** native transport is emitted
- **THEN** its recursive encoder is emitted without requiring or inventing a source constructor

#### Scenario: Callback result requires a constructor
- **GIVEN** a nominal type used as a callback result with no issued source constructor
- **WHEN** native transport is emitted
- **THEN** preparation fails before invocation

### Requirement: Compiler SDK dependency closure
The compiler SDK package SHALL declare its Foundation dependency explicitly through the canonical project graph. SDK source imports of Core collections, Optional, and Results SHALL resolve at their package-native `Core.*` paths from that verified dependency closure, without a source-authority bypass.

#### Scenario: MOD-06-27 SDK compilation resolves Foundation source imports
- **GIVEN** the installed compiler SDK package and its declared Foundation dependency
- **WHEN** the canonical resolver prepares the SDK for native Mod compilation
- **THEN** Core.Collections.Array, Core.Optional, and Core.Results resolve through the dependency graph and retain preparation-issued package provenance

### Requirement: Exclusive typed native Mod protocol
Native Mod execution SHALL use the qualified CABI2 producer and invocation-scoped owned transport. The compiler SHALL NOT expose raw V1 request mirrors, pointer-valued structural contribution handles, or the legacy structural callback registry as an alternate dispatch path. The host structural arena SHALL retain owned typed AST contributions and opaque checked numeric identities independently of the native ABI.

#### Scenario: MOD-06-28 Retired raw structural protocol cannot dispatch
- **GIVEN** a raw V1 request or relocatable Mod object without private executable producer authority
- **WHEN** a caller requests native contract execution
- **THEN** execution is rejected and no raw callback or AST pointer conversion is available
