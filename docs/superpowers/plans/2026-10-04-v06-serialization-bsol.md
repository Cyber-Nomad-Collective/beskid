# v0.6 Generic Serialization and Native BSOL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver complete reusable generic serialization, checked GC-safe dynamic mapping, and native Beskid BSOL syntax/schema/import/migration/typed read-write on every required target.

**Architecture:** The Serialization Mod owns eligibility and incremental typed AST adapters; the Serialization library owns format-neutral values, stable shape metadata and encoder/decoder contracts. Native BSOL preserves a syntax document and validates/composes profiles before typed mapping; Rust BSOL remains bootstrap tooling and runs the same normative corpus. Dynamic cells use canonical allocation descriptors and checked registered mapping, never raw-pointer transport or structural coercion.

**Tech Stack:** Beskid corelib packages/mods, generation-bound Salsa semantic facts, TypedProgram → CodegenInput → ISLE → verified CLIF, ABI-v5 allocation metadata, standalone Rust BSOL corpus harness.

**Spec:** `docs/superpowers/specs/2026-10-04-beskid-v0-6-release-design.md`; normative deltas below must land through OpenSpec before implementation.

## Global Constraints

- Required native targets: Linux x64, macOS arm64 and Windows x64; complete shape and BSOL coverage is mandatory, intermediate milestones do not narrow release scope.
- Preserve canonical allocation/descriptor and semantic-query authority; no retired HIR/Lowerable or per-request semantic rebuilds.
- `[Serialize]` belongs to Serialization Mod; Collector plus incremental Generator emit structural typed AST, never formatted Beskid source.
- Native corelib parsing/writing/schema validation execute Beskid implementation; no Rust parser forwarding.
- Parsing performs no implicit network access; imports consume an explicit controlled-root locked-identity host adapter.
- Naming follows PascalCase types/functions/methods and camelCase locals/parameters; no emoji in docs.
- Plan-only preparation: no builds, product edits, commits or pushes were performed for this document. During execution ignore GitNexus; inspect direct source callers/references before symbol edits and review the exact diff before commits. Root integration owns catalog and gitlinks.

## Review Focus

- Forced GC during nested dynamic construction must retain payload, destination and descriptor roots (Task 2).
- SDK types advertising unavailable primitives must receive compiler diagnostics before adapter emission (Tasks 1, 3).
- Comments/quoted values containing migration field spellings must survive without unintended rewrites (Task 7).
- Alias/import diamonds and symlink root escape must resolve deterministically or fail with source spans (Task 6).
- Escapes, number precision and duplicate names must have one Rust/native interpretation rather than permissive parser divergence (Tasks 4, 5).

## Source-bound findings and prerequisite decisions

Baseline inspected: root `f67ae4f2`, compiler `95c203ff`, corelib `7e3da7ee5dc3efc73f3ff5b49eb2ef8730d7a109`. Record standalone BSOL SHA with candidate evidence. GitNexus query `dynamic type descriptor collector generator typed AST serialization` on `beskid_compiler_main` supplied navigation, but its `emit_type_descriptors` result does not match current `module_emission/data.rs`; current file emits artifact-owned closure/aggregate/array static plans. Treat graph results as navigation until verified against pinned files.

Useful foundations:

- `compiler/corelib/packages/compiler-sdk/src/Beskid/Compiler/Collect.bd` defines typed contribution items; `Emitter/Contribution.bd` combines item arrays independently from code outputs. `Emitter/Nodes.bd` exposes structural node helpers. Existing SDK tests are in `beskid_corelib/tests/corelib_tests/src/compiler-sdk/`.
- `compiler/crates/beskid_analysis/src/mod_host/capabilities.rs` maps Collector to `read_project_sources`, Generator/AttributeGenerator to `emit_syntax`, Analyzer to `query_semantic_snapshot`; existing incremental replay tests reside in `beskid_tests_mods/src/mods/incremental_replay.rs`.
- `compiler/crates/beskid_queries/src/semantic_contract/` and `compiler/crates/beskid_isle/src/facts/` supply the canonical typed/layout/call authority; `beskid_codegen/src/module_emission/data.rs` emits canonical aggregate and array plans.
- Corelib foundation already includes String, Array, text/Pest/Regex and generated Pest mod foundations; reuse them after native compile probes, do not assume Rust-equivalent parser behavior.
- `beskid_bsol/crates/bsol-syntax/src/bsol.pest` plus `ast.rs`, schema `load/{imports_extends,rules,fields,variants,migrations}.rs`, `compose.rs`, analysis `semantic.rs`, `resolver.rs`, `validate/` and `migrate.rs` contain the real standalone semantics. `crates/bsol/tests/conformance.rs` already self-validates schema.v1/v2 and exercises embedded profiles.

Hard prerequisites (must prove before promising adapter feasibility):

1. `mod_host/native.rs::invoke_generator` explicitly falls back to `StubContractInvoker`; opaque generator handles are not materialized. Collector loading/linking/missing-symbol/null also falls back. Production serialization must fail closed and actually execute native Collector/Generator; scripted tests do not satisfy this.
2. `mod_host/emit_bridge.rs::materialize_program_item` currently reparses source text. Serialization must use validated generation-owned structural handles, preserve provenance and validate generation ownership; this source helper is not the required typed AST path.
3. `runtime/beskid/src/Runtime/Dynamic/Dynamic.bd::DynamicCellCreate` allocates 32 bytes with a null allocation descriptor and writes shape ID zero. `DynamicCastChecked` compares that zero slot only; map AOT/fallback ignore the mapping and return the source payload. None proves registered nonzero shapes, copying or GC safety.
4. Actual surface `syntax/types/primitive_type.rs` enumerates bool, i32, i64, u32, u8, pointer, word, f64, char, string, unit, never. SDK Collect.bd uses u64 even though that keyword is absent from this inventory. Do not silently promise i8/i16/u16/u64/f32/usize: freeze the supported surface matrix and prove SDK ABI fields compile, or implement required primitive additions across parser, semantic facts, ABI/layout, numeric conversion and ISLE under the primitive-owner plan. `word` is target width and never a portable serialized number without an explicit width declaration.
5. Generic record instantiation, enum payload construction/matches, arrays/maps/options, contract calls and generated extend-type helpers need end-to-end semantic and ISLE probes. Existing types or unit tests are insufficient evidence; missing legality/layout facts are mandatory compiler prerequisite work, not permission to replace generic adapters with dynamic dictionaries.

## Normative deltas and acceptance IDs

Root creates `openspec/changes/v06-serialization-native-bsol/` deltas for these existing capabilities; each SHALL statement receives positive and rejection scenarios, then catalog regeneration through the existing generator.

| Capability | Exact proposed requirement | Acceptance |
| --- | --- | --- |
| `language-meta--metaprogramming--serialization` | Serialization SHALL support primitive, string, explicitly encoded bytes, instantiated generic records, nested records, arrays/lists, string-key maps, payload enums and optional values through generated typed adapters; unsupported resource/closure/raw-pointer/reference shapes SHALL fail before lowering. Format-neutral encoding SHALL not require dynamic boxing. | SER-01, SER-02, SER-03 |
| same | Eligibility SHALL use resolved instantiated semantic types; `[Serialize]` ownership/transitive activation SHALL remain in the Mod; adapters SHALL be structural AST with generation ownership and deterministic incremental replacement. | SER-04 |
| same | Encoding/decoding SHALL obey limits and policies in this plan, report path/span/code and never publish partial destination values. Stable registered shape identities SHALL include package/type/generic arguments/version and reject incompatible collisions. | SER-05, SER-06 |
| `compiler--compiler-mods--mod-host-bridge` and `typed-emitter-and-transforms` | Required native Collector/Generator failure SHALL be terminal; returned structural handles SHALL be validated and materialized without source-text reparsing. Stale or foreign-generation handles SHALL be rejected. | MOD-06-01, MOD-06-02 |
| `compiler--codegen-and-ir--dynamic-types-and-mapping` | Dynamic wrapping SHALL register nonzero stable shape identity and traced payload metadata; checked casts SHALL reject unknown/wrong shapes; mapping SHALL allocate a fresh destination and perform descriptor-approved field conversion atomically. | DYN-06-01..05 |
| `tooling--manifests-and-lockfiles--bsol` | Native corelib SHALL implement the shared syntax document, v1/v2 profiles, imports, references, composition, constraints, migration and typed read/write with deterministic semantic round trips and a shared Rust/native corpus. | BSOL-06-01..08 |
| same | Canonical grammar SHALL settle source/doc disagreements explicitly: attribute syntax, escapes, empty maps, list numeric values and numeric scalar extensions; migration SHALL operate on selected syntax nodes and preserve unselected content semantically. | BSOL-06-09 |

Existing JSON package wording remains a format example; amend it to admit BSOL as required adapter and a small internal JSON conformance adapter without implying an additional broad public JSON product.

## Frozen interface and policy decisions

All signatures below are proposed new Beskid APIs, not claims about current symbols. Types belong to the stated package; `Result<T,E>` and `Option<T>` must use existing corelib forms or be supplied/proven by Task 1 before these declarations land.

- `Core.Serialization`: `ShapeId` (stable digest), `ShapeDescriptor`, `FieldDescriptor`, `VariantDescriptor`, `DataValue`, `SerializationLimits`, `SerializationError`; `Encoder.EncodeValue(DataValue) -> Result<unit,SerializationError>`, `Decoder.DecodeValue() -> Result<DataValue,SerializationError>`, generated `Encode<T>(T value, Encoder encoder, SerializationLimits limits)` and `Decode<T>(Decoder decoder, SerializationLimits limits) -> Result<T,SerializationError>`.
- DataValue preserves Unit, Bool, Signed(i64), Unsigned(decimal digits plus declared width), Float(f64), UnicodeScalar(char), String, Bytes, Sequence, ordered Record, ordered string-key Map, tagged Variant and Optional. Unsupported keys fail eligibility. IDs are digest-derived from canonical package identity/type name/type parameters/schema version/field signature, never AST numeric IDs; registration compares full canonical identity and descriptor, rejects incompatible hash collisions and registration drift.
- `Core.Dynamic`: `Wrap<T>(T value, ShapeDescriptor shape) -> Result<dynamic,DynamicError>`, `Cast<T>(dynamic value, ShapeId expected) -> Result<T,DynamicError>`, `Map(dynamic value, ShapeId destination) -> Result<dynamic,DynamicError>`. Compiler-created mapping tables authorize exact fields/types, optional/default injection and approved lossless numeric widening; narrowing, ad hoc string conversion and unknown source fields fail. Destination is fresh and remains private until all fields succeed.
- Defaults: duplicate record/map/BSOL assignment keys reject with both spans; unknown typed fields reject unless type explicitly allows extras; required missing fields reject, optional fields become None, declared defaults apply only to missing fields and are type-checked at generation. Unknown enum tags reject. Record fields emit declaration order; map keys emit ordinal UTF-8 byte order. Cycles reject using active-path object identities; repeated acyclic aliases serialize by value. Resources/handles/closures/raw pointers/arbitrary reference graphs are ineligible.
- Limits default to 8 MiB input/output, depth 128, 100,000 nodes/collection entries total, 1 MiB scalar text/bytes, 256 imports, import depth 32, 8 MiB total resolved schema bytes; callers may lower or explicitly raise within checked word/address bounds. Count before allocating and use checked arithmetic. Allocation failure returns AllocationFailed with no partial value; implement recoverable allocation seam if current primitives only trap.
- Decode UTF-8 strictly, reject unpaired surrogate escapes/non-scalars; preserve valid Unicode without normalization. Integer parsing is exact checked decimal; f64 is shortest round-trip finite representation, preserve negative zero, reject NaN/Infinity in BSOL/JSON. No implicit integer-to-float precision loss. Bytes are explicit tagged base64 with strict decoding; optional is explicit tagged absent/present representation rather than ambiguous missing/null.
- BSOL syntax model: `Document`, `Block`, `Assignment`, `Attribute`, `Reference`, `Value`, byte `Span`, ordered item collections. Preserve identifier vs string, block kind/label, schemaless flag, attributes and references separately from DataValue. Canonical output uses two spaces, LF, one terminal LF; edit/comment preservation is a separate API and not promised by semantic round trip.
- `Core.Bsol`: `Parse(string text, BsolLimits limits) -> Result<Document,BsolError>`, `Write(Document document, BsolLimits limits) -> Result<string,BsolError>`, `LoadProfile(Document document, SchemaResolver resolver, BsolLimits limits) -> Result<Profile,BsolError>`, `Validate(Document document, Profile profile) -> Result<ValidatedDocument,BsolError>`, `ResolveReferences(ValidatedDocument document)`, `PlanMigration(Document document, Profile target)`, `ApplyMigration(Document document, MigrationPlan plan)`, `Read<T>(string text, Profile profile, SchemaResolver resolver, SerializationLimits limits) -> Result<T,BsolError>`, `Write<T>(T value, Profile profile, SerializationLimits limits) -> Result<string,BsolError>` (overload or namespace separation must preserve both document/typed roles).
- SchemaResolver resolves File(root-relative path), Git(url, immutable revision, relative path), Registry(package, exact version, relative path), Pckg shorthand and alias to owned UTF-8 plus canonical identity/digest. Host materializes locked packages/repositories before calls. Reject absolute/path traversal/symlink escape, mutable git refs, unresolved locks, duplicate aliases and import cycles; diamond imports deduplicate canonical identities. No network in parser/library.

## File and milestone boundaries

New corelib packages follow current `packages/<name>/src/<Namespace>/` plus `.bproj` and export layout; obtain exact manifest form from existing compiler-sdk/foundation packages when executing. Package names: `serialization`, `bsol`; mod `mods/serialization_mod` owns `[Serialize]`. Dependency: bsol → serialization → serialization_mod → compiler-sdk; no bsol dependency in generic serialization.

### Task 1: Real Mod SDK typed generation and shape feasibility (independent compiler milestone)

**Files:** Modify compiler `crates/beskid_analysis/src/mod_host/{native,emit_bridge,generate,query_bridge,capabilities}.rs`, `crates/beskid_abi/src/mod_contract/` as needed; corelib `packages/compiler-sdk/src/Beskid/Compiler/Emitter/{Nodes,Items,Contribution}.bd`; tests `crates/beskid_tests_mods/src/mods/serialization_generation.rs` (create), `beskid_corelib/tests/corelib_tests/src/compiler-sdk/SerializationShapeProbeTests.bd` (create). Canonical facts and ISLE changes belong to `crates/beskid_queries/src/semantic_contract/` and `crates/beskid_isle/src/facts/` with one generation authority.

**Interfaces:** consumes existing CollectRequest/GenerationRequest/SyntaxContributionItem; produces actual native structural contribution materialization and a read-only instantiated serializable-shape query over generation-bound facts. Query contains visibility, field order/types, generic substitutions, enum payloads and declaration spans; opaque handles have generation/owner/kind validation.

- [ ] Write failing `native_generator_emits_generic_record_adapter_without_source`, `native_required_mod_failure_is_terminal`, `stale_structural_handle_rejected`, `sdk_primitive_inventory_compiles`, `shape_probe_record_enum_array_option_map`. Assert contribution has zero codeOutputs, two distinct generic instantiations resolve different field types, malformed/foreign handles diagnose, and missing mod artifact cannot report success.
- [ ] Run `cargo test -p beskid_tests_mods serialization_generation` from compiler; run candidate `beskid test --project corelib/beskid_corelib/tests/corelib_tests --all-targets`. Expected FAIL on stub dispatch/materialization or unsupported primitive/type capability; retain diagnostic evidence.
- [ ] Wire production native generator result ownership/materialization and query bridge; add minimal structured emitter nodes for record construction, field access, calls, branches, enum matching and extend-type helpers. Resolve u64 SDK inconsistency through the primitive owner, never substitute unchecked signed casts.
- [ ] Re-run above plus `cargo test -p beskid_analysis mod_host`; PASS includes real native entry execution and stock CLIF verification for generated probe program. No scripted-only proof.
- [ ] Review/commit isolated compiler/corelib changes after direct source scope verification; report exact prerequisite closure to serialization worker.

### Task 2: Registered traced dynamic cells and fresh mapping (independent runtime milestone)

**Files:** Modify `compiler/runtime/beskid/src/Runtime/Dynamic/Dynamic.bd`, canonical descriptor/allocation modules under `Runtime/`; ABI declaration `crates/beskid_abi/include/beskid_runtime_abi_v5.h`; create `compiler/runtime/beskid/tests/runtime_semantics/src/DynamicTests.bd`; create corelib `packages/serialization/src/Core/Dynamic/Checked.bd` and `beskid_corelib/tests/corelib_tests/src/serialization/DynamicTests.bd`.

**Interfaces:** produces Wrap/Cast/Map and ShapeDescriptor registration above. ABI cell layout change/version must go through runtime-kit authority; retain ABI-v5 only if compatible reserved slots suffice, otherwise primitive/runtime owner updates exact ABI version coherently.

- [ ] Add DYN-06-01..05 cases: two nonzero shapes, wrong cast, unknown shape/collision registration, fresh compatible mapping, incompatible mapping, generic instantiation distinction, repeated create/drop and forced GC nested string/array/record retention. Assert destination mutation cannot mutate source and partial failure creates no visible object.
- [ ] Run candidate corelib tests and the actual runtime harness; expected FAIL because shape zero/map identity/null allocation descriptor.
- [ ] Replace placeholder operations with registered descriptors, traced cell layout and descriptor-approved mappings; root all in-progress values across allocating calls, use canonical barriers/cleanup. Remove ignored mapping behavior and reject unregistered reflection.
- [ ] Run focused dynamic/GC tests plus runtime-kit ABI/layout validation and semantic/ISLE allocation tests; require pass under forced collection and allocation-failure injection.
- [ ] Review/commit independently; this milestone proves feasibility but does not ship generic serialization or complete BSOL.

### Task 3: Eligibility and incremental adapters (generic serialization milestone)

**Files:** Create `compiler/corelib/mods/serialization_mod/{serialization_mod.bproj,Src/Attributes.bd,Src/Eligibility.bd,Src/Collect.bd,Src/Generate.bd}` following `corelib_pest_gen.bproj` and `corelib_compiler_sdk.bproj` conventions; `packages/serialization/{corelib_serialization.bproj,src/Core/Serialization/Contracts.bd,src/Core/Serialization/Metadata.bd,src/Core/Serialization/Limits.bd,src/Core/Serialization/Errors.bd}`; tests `.../corelib_tests/src/serialization/GeneratedAdapterTests.bd`, compiler `beskid_tests_mods/src/mods/serialization_generation.rs`.

**Interfaces:** consumes Task 1 typed shape query/emitter and Task 2 registrations; produces format-neutral Encode<T>/Decode<T>, deterministic generated metadata and adapters.

- [ ] Add SER-01..06: nested GenericRecord<i32>/GenericRecord<string>, all supported primitives, payload enum, optional absence/presence, array/list/map, bytes; reject unsupported map key/resource/closure/pointer/never/opaque reference, inaccessible construction, recursive cycle, incompatible shape registration. Assert transitive library dependency activates attribute and changed field invalidates only affected adapters; removal removes generated artifacts.
- [ ] Run `cargo test -p beskid_tests_mods serialization_generation`; candidate corelib all-targets tests expect FAIL before implementation.
- [ ] Implement Collector/Analyzer/AttributeGenerator/Generator in Beskid; generic adapter bodies are typed AST and use statically specialized calls, not dynamic boxing. Add canonical descriptors with trace metadata and explicit stable versioning; constructor/default diagnostics retain source spans.
- [ ] Run same commands plus `cargo test -p beskid_queries --test semantic_facts` and `cargo test -p beskid_isle`; adapt target spelling only after Cargo manifest inspection. PASS requires installed standalone generated adapters executing, not merely AST snapshots.
- [ ] Review/commit package/mod dependency closure with no legacy generator/source fallback.

### Task 4: Format-neutral data/policy and second-format proof

**Files:** Create serialization `DataValue.bd`, `Encode.bd`, `Decode.bd`, `Numeric.bd`, `Unicode.bd`; tests `serialization/PolicyTests.bd`, `serialization/JsonFixtureAdapter.bd` (internal test adapter).

**Interfaces:** consumes generated adapters; produces complete bounded owned DataValue contracts and one small JSON test adapter proving metadata independence from BSOL.

- [ ] Add boundary assertions for signed limits/u32/u8/target word width, integer >2^53 never coerced to float, negative zero, nonfinite rejection, invalid UTF-8/surrogate escapes, bytes encoding, depth 128/129, sizes at limit/+1, duplicate/unknown/missing/default fields, enum tag failure and cycle vs repeated alias. Inject allocation failure and assert error path and atomic destination.
- [ ] Run candidate corelib test project; expected FAIL on missing contracts/policies.
- [ ] Implement exact policies above with checked accounting; JSON fixture uses the same typed adapter and descriptor to round-trip a generic nested record.
- [ ] Re-run and assert BSOL-free serialization dependency closure; PASS all SER cells and JSON internal proof.
- [ ] Review/commit standalone generic milestone. Full native BSOL remains required.

### Task 5: Shared grammar/corpus and native syntax parser/writer

**Files:** Create `beskid_bsol/conformance/{manifest.bsol,cases/,expected/}` and `crates/bsol/tests/native_corpus.rs`; modify canonical `crates/bsol-syntax/src/{bsol.pest,ast.rs,build/}` and tree-sitter grammar through existing sync script only as required by normative deltas. Create corelib `packages/bsol/src/Core/Bsol/{Syntax.bd,Lexer.bd,Parser.bd,Writer.bd,Errors.bd,Limits.bd}`; tests `bsol/SyntaxTests.bd`, `bsol/CorpusTests.bd`.

**Interfaces:** produces Parse/Write and ordered syntax model; corpus records case ID, input UTF-8/digest, expected document structure, normalized diagnostics/spans, canonical output and profile expectation. Both implementations consume identical files.

- [ ] Write BSOL-06-01/02/09 corpus cases for nested/labeled/schemaless blocks, assignments, lists with inline blocks, maps, attributes on blocks/assignments, @kind/label and @label references, identifiers vs strings, comments and spans. Include empty map, numbers in lists, escaped quote/backslash/control/non-BMP, duplicate keys and truncated tokens.
- [ ] Run `cargo test --manifest-path beskid_bsol/Cargo.toml -p bsol --test native_corpus` and candidate corelib tests; expect mismatches/missing native parser.
- [ ] Resolve doc/source disagreement through root normative decision before parser edits: current v2 docs show bracket attributes but actual Pest uses `@Name(args)`; existing quoted_string rule lacks escape decoding, inline_map requires an entry, list item omits numeric literals, scalars accept unsigned decimals only. Choose canonical @ syntax, strict escaped strings, empty maps, numeric lists and signed/finite-decimal scalars to support required shape matrix; update Rust/tooling/tree-sitter and native together. Retain v1 existing document semantics; versioned additions must be explicit in corpus.
- [ ] Implement lexer/parser in Beskid and deterministic writer; preserve source distinctions/spans. Generic typed record representation uses labeled `record` blocks, fields as assignments, nested record/sequence values as inline blocks where grammar permits, explicit variant/optional/bytes tagged blocks. Freeze this precise representation in golden corpus before adapters consume it; no unordered dictionary replacement.
- [ ] Re-run both harnesses; require semantic Parse(Write(Parse(x))) equality and identical diagnostics, bounded fuzz corpus/no panic tests. Native binary dependency inspection must show no Rust BSOL parser import.
- [ ] Review/commit independently working document API and shared corpus.

### Task 6: Profiles, controlled imports, validation and references

**Files:** Create native BSOL `Schema/{Model,Load,Compose,Resolver,Validate,Constraints,References}.bd`; tests `bsol/{SchemaTests,ImportTests,ReferenceTests}.bd`; expand shared corpus and Rust `bsol/tests/native_corpus.rs`.

**Interfaces:** consumes Parse/Write; produces Profile/SchemaResolver/Validate/ResolveReferences and ordered diagnostic results. Import materialization host adapter lives at installed app/host boundary, not lexer.

- [ ] Add BSOL-06-03..06 cases for schema.v1/v2 self-validation; all actual embedded profiles including board.v3/workspace/project/runtime/configuration; keyword/keywords/free_ident matchers and exceptions; scope/label/cardinality/extras/nested_extras/schemaless; primitive/list/map/ref field types, union/variants, require lists, default/min/max/pattern/required_if, extends/mixes/extend overlays. Assert missing/duplicate references and kind mismatch with spans.
- [ ] Add file/git/registry/shorthand/alias resolution, locked immutable identity, diamond import, alias collision, cycles, path traversal and symlink escape, bounds and offline cache-miss rejection. Test inheritance conflict/order, cyclic extends/mixes and invalid regex diagnostics.
- [ ] Run both corpus commands from Task 5; expected FAIL on missing native schema APIs.
- [ ] Port semantic contracts from actual schema load/compose/analysis source, not docs alone. Keep full ordered validation model; explicitly compare coercion semantics (e.g. quoted identifiers) with shared oracle. Use existing regex engine with bounded input and reject unsupported patterns explicitly; do not approximate constraint matching.
- [ ] Re-run both harnesses and real `.bproj`/workspace/runtime fixtures; PASS identical profile and reference results. Cache keyed canonical identity/digest plus schema version, never mutable path alone.
- [ ] Review/commit full schema milestone.

### Task 7: Structural migration and typed BSOL mapping

**Files:** Create native `Schema/Migration.bd`, `Adapter.bd`, `Typed.bd`; modify Rust `bsol-analysis/src/migrate.rs` where normative changes require; tests `bsol/{MigrationTests,TypedTests}.bd`; shared corpus migration cases; create `compiler/corelib/examples/bsol-config/{project.bproj,Src/Main.bd,config.bsol}` using existing project convention.

**Interfaces:** consumes serialization adapters plus Task 6 validated profiles; produces PlanMigration/ApplyMigration/Read<T>/Write<T> and standalone generic-record configuration journey.

- [ ] Write BSOL-06-07/08 migration routes using actual MigrationSpec fields: detect profile_version_missing, when block_kind/field/field_value/missing_field, AddField/RenameField/ReplaceValue. Assert route ambiguity/no route/cycle/rename collision failure, idempotence, target revalidation, comments and unrelated nested values containing matching text unaffected. Freeze ordered rewrite semantics and profile route provenance in corpus.
- [ ] Add typed round trips for every shape from Task 3, generic nested config with optional/enum/map/bytes, exact numeric/Unicode and duplicate/default/unknown policies; invalid diagnostics include field path and syntax spans.
- [ ] Run both corpus harnesses and corelib tests; expected FAIL before migration/typed mapping.
- [ ] Implement structural migration over selected document nodes, not global text replacement (`apply_migration` currently uses string replace/rfind and is unsuitable for safe parity). Update Rust tooling to the same normative corrected semantics; preserve successful old real fixtures. Validate migrated syntax/profile/references before typed decode. Instantiate direct generated typed adapter calls for known T; optional registered dynamic path retains syntax document fidelity.
- [ ] Execute installed example to read/validate/decode/update/write/re-read a GenericConfig<string>, assert canonical output and second typed value; prove allocation/depth failures do not publish output.
- [ ] Review/commit full native package, migration tooling alignment and consumer example.

### Task 8: Integrated all-target qualification and documentation

**Files:** Update existing `scripts/ci/woodpecker-release-evidence.mjs`/aggregator through release owner, add required data case entries to candidate consumer manifest; document package APIs/example in canonical website/book surfaces through docs owner. This worker must not create a second evidence authority.

**Interfaces:** produces source-bound SER/MOD/DYN/BSOL cells and installed native consumer evidence for root candidate packet.

- [ ] Add failing evidence-validator fixture where one shared-corpus/native-target/shape case is missing, skipped, timeout or source-mismatched; assert release qualification rejects it.
- [ ] Run evidence-validator unit tests and focused release tests; expect FAIL until manifest requirements land.
- [ ] Register all acceptance IDs and case matrix, exact command/tool/source/artifact/input digest, native dependency check and retained output digest. README/book records limits, shape eligibility, import adapter configuration, migration semantics and semantic-vs-edit round trip.
- [ ] On Linux x64/macOS arm64/Windows x64 run compiler semantic/ISLE/runtime/corelib gates and installed example/shared corpus with exact candidate bytes; require every mandatory cell executed/pass. GC stress/unsupported generation/profile imports are mandatory, not waived by scalar milestones.
- [ ] Final review confirms complete scope and removal of placeholder/stub success paths; root owns integration/candidate freeze/publication. No release success claim from unit tests alone.

## Dependency and review handoff

Task 1 and Task 2 are independent feasibility work; Task 3 needs both, Task 4 needs Task 3. Task 5 can proceed after grammar/API normative freeze independently of generator implementation; Task 6 needs Task 5; Task 7 needs Tasks 4 and 6; Task 8 needs all. Compiler primitive additions, semantic/ISLE legality and runtime-kit ABI updates are explicit dependency-owned gates. If probes fail, implement the missing obligation through the owning plan and rerun the same case; do not redefine required serialization scope.

Self-review: all design shape classes, checked dynamic proofs, v1/v2 syntax/profile/import/reference/migration semantics, shared corpus, installed example and three-target evidence have owners above. Actual standalone profile versions (including board.v3) are retained; JSON is a narrow independence fixture. No product code/builds/commits/pushes were performed during planning.

## Concrete canonical Mod shape prerequisite: records, enums and package identity

Implementation finding (2026-10-04): `compiler/crates/beskid_analysis/src/mod_host/semantic.rs` exposes only `ModSemanticShape.fields`; `compiler/crates/beskid_queries/src/semantic_contract/mod_shapes.rs` projects only `TypeDefinition`. `mod_semantic_authority.rs` also validates/searches only `NodeKind::TypeDefinition`. These are hard prerequisites for generic enum/optional/recursive serialization, not permission to reduce Task 3 to records. Existing registered-assembly handles, source spans, bounded identity traversal and generic substitutions are useful foundations.

**Public model and exact ownership boundary.** Replace the flat field member with `ModSemanticShapeBody::Record { fields: Vec<ModSemanticField> } | Enum { variants: Vec<ModSemanticVariant> }`. A variant carries its declared name, checked ordinal, exact `ModSemanticDeclaration` and ordered payload fields. Each payload retains the same `ModSemanticField` name/type/ownership/declaration contract as a record field. A unit variant has an empty payload; it does not become a fabricated unit field. `ModSemanticShape` retains declaration and substituted type arguments and gains an authority-produced `ModSemanticNominalIdentity`; its body is the sole structural discriminator. Update SDK/boundary consumers and tests together; do not retain a compatibility `fields` projection that makes enums appear to be records.

**Canonical projection APIs/files.** Extend the existing tracked `mod_shape_projection(db, syntax, declarationKey, arguments)` in `semantic_contract/mod_shapes.rs`; do not introduce a parser or second semantic tree. Dispatch the indexed declaration as `TypeDefinition` or `EnumDefinition`, check exact generic arity and build the existing substitution environment. For an enum, get each variant key with `SyntaxIndex::direct_child_id(program, enumKey.node, DynNodeRef::from(variant))`, then each payload field key with `direct_child_id(program, variantKey.node, DynNodeRef::from(field))`. Preserve declaration order and source-bound keys/spans. Resolve every field through `generic_source_type_identity_with_substitutions` and the existing managed-reference judgment; reject unsupported field kinds, function/associated/This identities and unbound generic arguments. Validate duplicate variant/field identities before exposing a complete shape. Keep identity traversal depth/work bounds.

Extend `ModSemanticQueryAuthority::validate_key` and `nominal_key` to both nominal declaration kinds, preserving current project/generation/tree/issuer checks. Reuse `issue(declarationKey, canonicalArguments)` and its handle interner so a recursive enum field issues the existing nominal handle instead of recursively expanding the whole graph. Applied arguments originate in canonical source-type/specialization facts; a caller cannot submit an arbitrary textual signature, field list or guessed type-argument vector as semantic authority. `type_shape(handle)` consumes only a handle issued by that invocation. Add any source-site application resolver through the canonical query boundary, not a public unchecked `resolve_type_with_args` shortcut. Propagate the new body/variant DTO through the existing compiler Mod SDK generation and its typed AST contribution transport.

**Immutable package provenance prerequisite.** `stable_declaration_identity` in `semantic_contract/calls/generics/source_identity.rs:156` currently produces a module/declaration string. It does not prove a package version. `ProgramAssembly`/`SourceUnit` carry no resolved versions/artifact proof; `AssemblyModule.package` is only a package name; `ResolvedDependencyProject` has no version. `ProjectSession.lockfile_digest` identifies the whole lock snapshot and must not masquerade as an exact per-package version or enter ShapeId merely because an unrelated dependency changed. Existing verified `ProjectLockDependencyEntry` exposes source, registry, exact resolved version and artifact digest and is the correct upstream input.

Add a prepare-owned `AssemblyPackageIdentities` map keyed by canonical compilation source roots, containing immutable `AssemblyPackageIdentity` entries: canonical package/source identity, exact declared/resolved version and verified artifact digest/provenance. Use private construction and read-only accessors; only the verified workspace preparation/materialization path creates entries. Registry/Git entries consume locked exact version/revision and verified cache/artifact proof. A host or path package consumes its declared manifest identity/version and the verified revision/source snapshot; it must not fabricate a registry version or use an absolute machine path as portable identity. Import aliases and materialized-directory names are not package identities.

Bind this map to `ProgramAssembly`, its registered session, syntax generation and revision snapshot. `ModSemanticQueryAuthority::for_registered_assembly` verifies that package provenance belongs to the exact registered assembly, alongside its existing unit/tree checks. A foreign/caller-constructed map, stale revision, ambiguous root ownership or absent required provenance rejects. Project/session constructors alone do not grant package authority. Project preparation and assembly registration must forward the same proof; no runtime filesystem reread or caller-provided expected signature can substitute for it.

Project `ModSemanticNominalIdentity { packageIdentity, exactVersion, declarationPath, typeArguments }` from those facts. Use the declaring module path and declaration name, not visibility aliases, absolute source paths, AST node numbers, generation numbers or opaque issuer tokens as persistent identity. Keep artifact digest available as verified provenance; encode the exact ShapeId inputs under Task 3's native serialization contract. Do not silently append an entire lock digest or unrelated package content to the stable wire identity. Recursive nominal references retain canonical declaration identity plus applied arguments so shape traversal terminates without dropping recursive type support.

**RED/GREEN tests and commands.** Extend `compiler/crates/beskid_queries/tests/mod_semantic_authority.rs` using real registered `ProgramAssembly`/`ProjectSession` and verified preparation fixtures. Add record control; unit plus multi-field enum variants; ordered variant/payload declarations with exact source spans; recursive enum handle reuse; enum `Container<T>` substituted through a record/array and explicit canonical application; imported qualified enum with an identically named local record; all fixed-width primitive/f32 projections from the authoritative primitive inventory; unsupported/unbound identities, duplicate declarations, stale/foreign handles and changed-generation rejection. Assert exact payload ownership, never infer GC status from pointer width.

Add preparation/registration tests proving two copies of the same verified package/version/declaration produce the same portable identity despite different materialized paths; different source identity/version/applied arguments produce distinct identities; unrelated lock updates do not alter a package's semantic identity; forged package maps, missing version/proof and stale revision fail closed. Keep current shape tests as behavior controls while migrating their `fields` assertions to the explicit Record body. Test the native Mod SDK adapter with both bodies and a stale handle; tests must not construct an accepted shape from arbitrary DTO fields.

Run root-serialized `cargo test -p beskid_queries --test mod_semantic_authority`, the corresponding `beskid_analysis` verified assembly/package preparation tests, compiler Mod semantic-boundary tests and regenerated SDK/typed-contribution native tests. Observe genuine missing-body/provenance RED before production implementation; require all positive/negative cases GREEN before Task 3 publishes generic codec metadata. Current read-only audit is not implementation or native qualification. Full native BSOL imports/migration/pattern/typed mapping and generic serialization remain mandatory subsequent gates.


### Package identity implementation checkpoint (2026-10-04)

`projects/package_identity.rs` now privately issues immutable verified roots after preparation and lock synchronization. Registry entries retain the verified registry/artifact digest and require the manifest's exact version to equal the locked version. Local/Corelib entries retain their actual manifest version and sorted relative source-tree SHA-256, with no registry claim. Original/materialized roots must share byte snapshots; symlinks/nonregular entries reject. Assembly carries the opaque proof and typed-program registration binds it to `(ProjectSession, SyntaxGenerationId)`; Mod authority rejects stale file/manifest/lock snapshots or differing registered source bytes. Synthetic constructors retain an empty proof and expose `package: None`, never invented versions. Canonical shape metadata also exposes the source-authority declaration identity.

The Record/Enum authority suite passed 5 tests in root's `.build/v06-mod-enum-shape-green-candidate.log`. Package test fixture `v06_package_identity.rs` was authored first, but its RED execution was explicitly deferred during the runtime/descriptor migration; missing APIs were confirmed by source, not an observed failing test. No package GREEN is claimed. Required command: `cargo test -p beskid_analysis --test v06_package_identity`, then authority/session and registry regressions. SHA hashing and validation are compiler-side preparation proof, not a substitute for native Corelib SHA or typed serialization implementation.

Alias-independent declaration metadata is now implemented separately from query resolution identity: `ModPackageDeclaration { source_path, lexical_path }` comes from verified relative source roots and exact source AST ancestry. Inline-module/type/enum names are read from canonical registered keys. `declaration_identity` retains the assembly-qualified lookup name and is documented as nonportable; stable ShapeId consumers must use package provenance + package declaration + recursively canonical type arguments. Synthetic shapes have neither package nor package declaration. A real prepared-assembly regression compares copied roots and verifies synthetic ineligibility; it remains unrun pending root's serialized gate.

### Native format contract implementation checkpoint

New Core.Serialization.Contracts defines transactional Encoder primitive/container operations, Serializable<E>.WriteTyped and Decoder<T>.ReadTyped. Encode<T,E> uses canonical contract bounds and aborts unpublished encoder state on begin/body/commit errors; Decode<T,D> delegates to a concrete typed generated decoder, never an erased universal value registry. New Descriptors/Registry modules preserve ordered fields/variants, exact width/generic identifiers and full descriptor/signature collision checks; registration and lookup copy managed descriptor containers. Native SHA256 hashes signatures. RegistryTests contains actual abc vector, signature limit and incompatible registration/owned-copy scenarios, all currently unrun. Runtime registry data does not grant compiler semantic eligibility: only compiler-generated canonical signatures and typed adapters from registered package/declaration facts satisfy the generic serializer authority.

Remaining concrete implementation seams: Serialization Mod structural generated conformance and canonical signature assembly; native BSOL serialization.v1 typed arena mapping and BsolBinding<T> application-profile mapping; exact finite float bit reinterpretation plus correctly rounded decimal codec; checked active-path managed identity and allocation failures; native profile host import adapter and migration. These remain release obligations, not unsupported compatibility paths or completion claims. Existing BSOL Parser finite-range screening is not a correctly rounded typed float codec. Existing RFC4648/UTF8 Corelib foundations are reusable.


### Generated defaults and directional field bounds ruling

Use a source-resolved zero-argument default factory, retained by exact declaration and specialized return type; invoke it only for absent input. Present malformed input remains an error. Skipped decoding fields need admitted typed construction, otherwise reject generation. Never invent zero or empty defaults. This follows the useful design precedent of [Serde named defaults](https://serde.rs/attr-default.html) and [field attributes](https://serde.rs/field-attrs.html), while beskid authority remains the registered source/package and current specialization.

Derive encoder and decoder bounds from actual generated field operations independently; phantom parameters do not receive blanket bounds. Validate explicit overrides against the operations, current source contracts and receiver substitutions. [Serde bound derivation](https://serde.rs/attr-bound.html) supports this direction-specific policy. Keep Reader typed operations rather than relying on a universal value: [Serde's deserializer implementation guide](https://serde.rs/impl-deserializer.html) explains why expected-type hints are required by formats that are not self-describing.

Required fixture matrix: absent/default succeeds with exact typed value; present valid input does not invoke factory; present malformed input rejects without default invocation; wrong return primitive and wrong nominal generic application reject; parameterized/foreign/stale factory rejects; skipped field without construction rejects; phantom parameter remains unconstrained; actual field parameter receives directional bound; explicit insufficient override rejects; concrete specialization rechecks default/bounds after source or package change. These are required implementation cases, not executed test claims. Compiler and embedded source remain frozen during root gate86332; template-carrier and generated Reader integration are unfinished.
