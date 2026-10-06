## Context and source authority

Plan: `docs/superpowers/plans/2026-10-04-v06-serialization-bsol.md`; design: `docs/superpowers/specs/2026-10-04-beskid-v0-6-release-design.md`. Baseline root f67ae4f2/compiler95c203ff/corelib7e3da7ee. OpenSpec is normative; Rust/native implementations and shared corpus are conformance subjects. GitNexus was used for navigation and checked against source because indexed descriptor paths were stale.

## Decisions

Three layers: Serialization Mod collects/analyzes resolved instantiated shapes and emits incremental structural adapters; Serialization library owns generic metadata/value contracts; native BSOL owns ordered syntax, profile validation and its format adapter. Static T takes specialized code; dynamic is optional registered runtime shape support. Primitive slice supplies fixed widths and f32 via the canonical type capability; SDK primitive probes and legal semantic/ISLE operations gate implementation.

Native Generator opaque handles must be materialized through a validated generation-owned structural bridge. Source text reparsing and production stub success are removed from required native contribution paths. Generation-bound semantic queries remain the sole eligibility/layout authority, and codegen consumes approved plans through TypedProgram/CodegenInput/ISLE. No retired HIR lowering or independent reflection path.

Dynamic descriptors use canonical allocation and trace metadata. Stable SHA-256 shape identity is a canonical signature separate from allocation-local nonzero u32 registry tags; full signature comparison detects digest/tag collision and incompatible version registration. Cell descriptor traces its payload; intermediate source/destination values stay rooted. Mapping is fresh owned value construction with lossless registered conversion and atomic publication.

BSOL syntax is independent from generic DataValue: identifiers, strings, block labels/kinds, ordered items, attributes, references, raw schemaless bodies and spans are retained. Strict canonical lexical fixes apply to native and standalone Rust/tooling together. Typed encoding uses explicit wrapper tags defined in the normative delta rather than inference from dictionary shape. Profile imports are resolved only through host-materialized locked identity; no network in parser or native library.

Migration rewrites target syntax nodes, replacing the existing substring/rfind implementation. Default insertion belongs to the selected matching block; rename/value replacement cannot touch comments, quoted text or unrelated nodes. Routes are unambiguous and revalidate the destination before exposure.

## Limits and lifecycle

Shared defaults are 8 MiB input/output/resolved schema bytes, depth128, aggregate100000 nodes/entries, scalar1MiB, imports256/import depth32. Explicit format adapters may supply stricter/different documented limits (Glue has its own envelope); checked accounting and allocation failure remain mandatory. Generic floating values retain width/bits; BSOL/JSON permit finite shortest roundtrip only, while Glue format owns its bit-preserving transport policy. Unknown resource/handle/pointer graphs never become general serializable shapes.

## Observability and security

Structured diagnostic code, source byte span and field/import path identify failures; execution/corpus evidence records case/source/input/target/artifact identity. Never log payload contents or credentials as diagnostic context. Controlled roots, symlink resolution, immutable revisions, locked registry versions, cycle limits, Unicode and allocation checks apply before exposing values. Atomic destination publication prevents incomplete decoded objects and failed migration output.

## Deleted and preserved paths

Remove production required-Mod stub fallback, serialization source-code contribution/reparse, zero-shape wrapping, ignored-map identity return, unregistered reflection, unsafe substring migration and stale HIR-based dynamic contract. Rust BSOL remains bootstrap tooling; ordinary native corelib must not forward to its parser. General CodeString APIs unrelated to serialization need not be removed. Canonical allocator/runtime-kit authority and user files are preserved.

## Rollout and rollback

Land normative deltas, feasibility probes, real native generator/dynamic proof, generic adapters, shared syntax, schema/import/reference behavior, migration/typed example, then integrated evidence. Milestones are separately testable, all are required for final v0.6. Candidate rollback restores a coherent source/artifact closure; a published shape version requires explicit migration rather than silent compatibility fallback.
## Collection owner source provenance prerequisite

The observed nested-owner RED is separate from source authorization. `collection_operation` currently checks only the declaration path suffix `Core/Collections/Array.bd`, while its public comment claims a same-named user declaration receives no authority. A user-owned file at that suffix can therefore be treated as intrinsic Array.Append and bypass its source body. The initial owner-fact fixture used a stub body and did not distinguish this defect; it now includes exact canonical Array and ArrayIter source, without claiming copied source grants canonical authority.

The existing `build_typed_program_with_corelib_services` path is the authority seam. Its `exact_compiler_owned_corelib_unit` checks exact canonical source plus canonical physical/origin identity or a loader-issued trusted selected path, rejects symlink origins, and records `(SourceUnitId, SyntaxGenerationId)` in `corelib_source_paths`. Canonical Array already participates through its `__array_len` service. Collection intrinsic classification must consume that registered current-generation logical source identity, rather than create another path/hash registry or treat a matching suffix as sufficient.

Before changing the authorization guard, add a real user-owned `Core/Collections/Array.bd` collision fixture whose Append body has an observable effect and returns its argument; it must retain ordinary direct-call behavior and no CollectionOperation fact. Also reject an exact copied canonical file without trusted ownership, and verify stale generation rejection. The positive owner fixture must obtain genuine authority through the production registration/loader path after that guard exists; a fabricated capability or direct registry insertion is not an acceptable test fix. Root owns serialized RED/GREEN gates; this diagnosis does not claim the provenance defect fixed.
