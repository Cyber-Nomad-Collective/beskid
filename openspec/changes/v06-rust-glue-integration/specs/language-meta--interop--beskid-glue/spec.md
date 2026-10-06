## ADDED Requirements

### Requirement: Rust Glue manual and generated equivalence
Rust Glue 0.6 SHALL deliver both import and export directions for the entire required primitive/ownership profile. A hand-written Rust/Beskid C ABI fixture and boundary manifest SHALL establish observable results, errors and ownership first; generated adapters SHALL compile, link and execute equivalently, including failure rules. Qualification SHALL execute the same required manifest natively on Linux x86_64, macOS aarch64 and Windows x86_64 against installed candidate bytes. Emitted text, compile-only cross builds or scalar-only subsets SHALL NOT count as delivery. Missing/skipped/timeout/mixed-source evidence SHALL fail required acceptance.

#### Scenario: Manual and generated match
- **GIVEN** complete manual/generated import/export fixture matrix and installed candidate
- **WHEN** native qualification executes
- **THEN** results/errors/releases and all target cells pass with exact source/tool/runtime/package/input/output identities (R4-CALL-01..04)

#### Scenario: Partial implementation rejected
- **GIVEN** only integers emit or one direction/target is unexecuted
- **WHEN** release evidence is validated
- **THEN** required Glue completion is rejected

### Requirement: Canonical stdio transport and shared value encoding
Delivered Glue calls between Beskid and Rust services SHALL use one stdio transport. Local wrappers SHALL use C ABI and exported Beskid bodies SHALL remain canonical AOT. Wire frames SHALL consist of u32 little-endian frame-body byte length followed by a shared-serialization-adapter envelope containing protocol version 1, message kind, canonical library identity, session generation, request ID, binding/method identity, shape identities and payload or typed error. Handshake SHALL verify protocol/target/ABI/layout/library/binding compatibility before calls. Message kinds SHALL distinguish handshake/request/response/error/cancel/shutdown/acknowledgement. Payload maximum SHALL be 16 MiB, decoded depth 64, aggregate nodes/entries 1,048,576, scalar bytes 16 MiB and outstanding requests 256, checked before allocations/effects; length includes full body. Glue SHALL depend on shared serialization Encoder/Decoder/SerializationLimits and typed Encode/Decode contracts; its format adapter SHALL preserve IEEE bits and strict UTF-8, with explicit owned byte conveniences. Generic resources/addresses/raw dynamic payload pointers SHALL NOT be serialized; checked handle tokens are explicit Glue protocol fields. No second codec metadata authority or in-process alternative Glue transport SHALL be introduced.

#### Scenario: Partial frames and limits
- **GIVEN** fragmented headers/body, partial writes, zero progress, truncation or frame exceeding limit
- **WHEN** the bridge exchanges messages
- **THEN** valid fragments reconstruct exactly; invalid/oversize/truncated frames terminate with typed error before unsafe allocation (R4-IO-01..04)

#### Scenario: Handshake mismatch
- **GIVEN** wrong version/library/ABI/layout/method or shape identity
- **WHEN** a peer handshakes or dispatches
- **THEN** mismatch fails before foreign/Beskid invocation (R4-IO-05)

#### Scenario: Typed format fidelity
- **GIVEN** shared codecs receive full Glue values including NaN/inf/-0 and embedded NUL UTF-8
- **WHEN** Glue adapter encodes/decodes
- **THEN** bits and valid text match; invalid text and raw resource/address shapes reject

### Requirement: Bridge cancellation shutdown and checked tag lifecycle
The stdio bridge SHALL run a bounded pump on existing Beskid fibers/Core.IO/cooperative wait/cancellation. Each request SHALL settle exactly once; cancellation SHALL remove its waiter and reject late replies without resurrecting state. Process exit, foreign failure, malformed message and decode failure SHALL return typed terminal errors and release owned resources. GlueTag and opaque handles SHALL be host-owned checked identities bound to library/backend/session/generation/shape, with no public raw construction bypass. Close SHALL stop admission, settle pending calls, send shutdown and allow at most 5 s for acknowledgement/exit before terminating and reaping; repeated close SHALL be idempotent. All success/failure/cancel/close paths SHALL release pipe handles, pending buffers, transfer owners and GC roots once. Peer stdout SHALL contain protocol frames only; stderr SHALL drain separately with bounded retained diagnostics.

#### Scenario: Cancellation and late response
- **GIVEN** a cancelled request receives a late response or concurrent exit
- **WHEN** pump settles it
- **THEN** one cancellation terminal result remains and no waiter/resource is resurrected (R4-IO-06..08)

#### Scenario: Close and stale tag
- **GIVEN** a session closes with pending calls, then slot is reused
- **WHEN** old tag is called and close repeats
- **THEN** old generation fails, repeated close is harmless and all child/pipe/buffer/root owners are released (R4-IO-09..12)

#### Scenario: Foreign failure and forced GC
- **GIVEN** an export allocates/collects while a peer fails or stops answering shutdown
- **WHEN** failure/close completes
- **THEN** live roots remain valid until settlement, termination/reap meets 5 s grace and no resources remain

### Requirement: Stdio version one envelope encoding
The Glue shared-serialization format adapter SHALL emit envelope fields in this order: u16 little-endian protocol version, u8 message kind, u8 reserved flags equal to zero, u64 little-endian session generation, u64 little-endian request ID, u32 little-endian UTF-8 canonical-library byte length plus its bytes, 32-byte binding identity digest, u32 little-endian shape-identity count plus each 32-byte digest in signature parameter-then-return order, and u32 little-endian payload byte length plus payload bytes. Kind numbers SHALL be handshake=0, request=1, response=2, error=3, cancel=4, shutdown=5 and acknowledgement=6; unknown kinds/nonzero flags/trailing bytes SHALL reject. Library bytes SHALL be strict UTF-8 capped at 4096 bytes and shape count SHALL be capped at 256 before allocation. Control messages without a binding SHALL use a zero binding digest and zero shape count. Request ID zero SHALL be reserved for handshake/shutdown; call IDs SHALL be positive, unique per session and never reused, and exhaustion SHALL close the session. The body length SHALL equal the exact envelope length and fit the 16 MiB cap. Handshake payload SHALL use a shared typed descriptor for target, ABI, layout band and binding-manifest digest; errors SHALL use a shared typed descriptor with stable error code and bounded UTF-8 detail. All descriptor registration and payload value encoding SHALL consume the generic serialization authority and Glue's documented format adapter, with no raw object addresses or best-effort shape coercion.

#### Scenario: Independent peers agree on envelope bytes
- **GIVEN** Rust and Beskid peers encoding identical version-one request metadata and shared typed payload
- **WHEN** each peer emits the frame
- **THEN** field order, little-endian widths, digests and lengths match byte-for-byte and either peer decodes the other frame

#### Scenario: Invalid envelope cannot dispatch
- **GIVEN** a frame with an unknown kind, reserved flags, trailing bytes, oversized library/shape count or reused call ID
- **WHEN** the receiver validates the envelope
- **THEN** it rejects before allocation beyond limits or method dispatch and returns a typed terminal protocol error


### Requirement: Bit-preserving binary value adapter
The version-one Glue binary adapter SHALL consume the format-neutral shared DataValue and Encoder/Decoder contracts. Its value tags SHALL be unit=0, bool=1, signed=2, unsigned=3, float=4, Unicode scalar=5, UTF-8 string=6, bytes=7, array=8, list=9, record=10, map=11, variant=12 and optional=13. Integer and float values SHALL carry an explicit one-byte width followed by exactly eight little-endian bytes; integer widths SHALL be 8/16/32/64 with range validation and float widths SHALL be 32/64 with zero upper bits for f32. Bool SHALL carry exactly zero or one; a scalar SHALL carry u32 little-endian valid Unicode scalar. Strings, byte vectors and names SHALL use u32 little-endian byte length and strict UTF-8 for textual fields. Collections SHALL use u32 little-endian element count; record and map entries SHALL carry a textual name followed by a value, preserving order and rejecting duplicate names. Record and variant SHALL carry the descriptive 32-byte shape digest before their fields or variant name and payload. Optional SHALL carry zero or one followed by its corresponding zero or one payload value. Unknown tags, invalid widths/ranges/scalars, trailing bytes and policy violations SHALL reject. Decoder SHALL debit depth, aggregate nodes and scalar/total bytes before copying or reserving storage; encoder SHALL retain unpublished owned output until commit and abort without publishing partial bytes. Shape digests in DataValue SHALL confer no native descriptor, callback or ownership capability.

#### Scenario: IEEE and unsigned values cross unchanged
- **GIVEN** u64 high bits, each signed width boundary, f32/f64 negative zero, infinities and distinct NaN payloads
- **WHEN** the shared value is encoded and decoded through Glue binary version one
- **THEN** width, integer value and every IEEE bit are preserved without BSOL/JSON coercion

#### Scenario: Malformed collection remains unpublished
- **GIVEN** a collection whose declared count exceeds the remaining node budget or a string whose length exceeds the remaining scalar budget
- **WHEN** Glue decodes the value
- **THEN** it rejects before allocating the declared storage or admitting a call



### Requirement: Loader-issued native descriptor and callback closure
The private producer and loader SHALL admit every Dynamic payload/cell descriptor and constructor, reader or transform callback through an exact source-qualified signature, source digest, image role and verified symbol-address owner before provider registration. The provider SHALL retain the admitted closure in the canonical traced owner record chain, bound to the process issuer, session, library and generation, and SHALL test membership before descriptor dereference or callback invocation. Closure publication SHALL be once-only, bounded to 4096 rows and included in the aggregate 16 MiB owner budget. Native addresses SHALL remain private compiler transport and SHALL NOT appear in serialized values or portable artifact authority. A public shape or mapping registration SHALL NOT extend this closure. The process lease SHALL retain every owning image through heap destruction, and close SHALL invalidate membership and clear retained closure payloads before image release.

#### Scenario: Invalid pointer rejects before memory access
- **GIVEN** a live admitted library and a shape DTO containing an unadmitted descriptor or callback address
- **WHEN** registration is requested
- **THEN** registration fails before dereferencing the descriptor, calling the callback or allocating a shape record

#### Scenario: Valid bytes do not grant image authority
- **GIVEN** a rehashed signature packet with descriptor or callback addresses belonging to another image
- **WHEN** the private loader compares the current source and pinned symbol owners
- **THEN** it rejects closure publication and exposes no usable shape or mapping tag

#### Scenario: Closed library cannot reuse admitted addresses
- **GIVEN** a library with an admitted closure that has been closed and a subsequent library reusing an address
- **WHEN** an old generation requests registration or invocation
- **THEN** the old issuer/session/library/generation fails and the process lease keeps descriptor images pinned until the heap is destroyed

### Requirement: Public Glue facade excludes raw declaration-era tags

The public Glue package SHALL expose the canonical envelope, bounded binary codec, incremental pump, and cooperative session APIs. It SHALL NOT expose a `GlueTag.New(i64)` raw constructor, a raw `Handle` accessor, or a declaration-era message carrier whose only identity is a caller-supplied integer tag. Wire library names, generations, binding digests, and decoded data SHALL remain descriptive protocol inputs and SHALL NOT grant native callback, descriptor, or opaque owner admission. Existing Glue attributes and required Mod contract invocation SHALL remain available through the canonical typed compiler path.

#### Scenario: Public protocol modules replace raw tag construction
- **GIVEN** an ordinary source consumer of the public Glue package
- **WHEN** it imports the package protocol facade
- **THEN** it can resolve Envelope, BinaryCodec, Pump, and Session without obtaining a public raw tag or native owner constructor (R4-STDIO-12)

#### Scenario: Decoded protocol identity does not grant native admission
- **GIVEN** a decoded envelope containing a caller-chosen library name, generation, and binding digest
- **WHEN** it is presented without a privately produced image and live checked owner domain
- **THEN** native descriptor, callback, and opaque-owner admission remains unavailable (R4-STDIO-13)

### Requirement: Cancellation and shutdown controls carry no value payload

Version-one Cancel and Shutdown frames SHALL carry an empty payload byte vector. A shutdown acknowledgement SHALL also carry an empty payload; a handshake acknowledgement SHALL instead echo the exact typed compatibility payload. A unit method argument or result SHALL retain its ordinary binary value encoding and SHALL NOT be substituted for an empty control payload. The reciprocal source session SHALL consume cancellation delivery ownership before publishing the empty-payload Cancel frame, and it SHALL still complete bounded process cleanup after a valid empty-payload shutdown acknowledgement.

#### Scenario: Reciprocal control frames agree without value coercion
- **GIVEN** Rust and Beskid peers using the version-one envelope
- **WHEN** a request is cancelled or the session shuts down
- **THEN** both peers encode a zero-length control payload, whereas an ordinary unit value encodes its unit tag (R4-STDIO-14)

#### Scenario: Unit bytes cannot masquerade as a shutdown control
- **GIVEN** a Shutdown or Cancel frame with the binary unit tag as its payload
- **WHEN** the receiving peer validates the control envelope
- **THEN** it rejects the frame before control effects or value dispatch (R4-STDIO-15)

### Requirement: Terminal session cleanup retains its checked outcome
The reciprocal source session SHALL retain the checked terminal cleanup outcome after invalidation, explicit close, or disposal. Repeated close SHALL return that retained outcome without claiming successful cleanup after a failed terminate/reap operation. A protocol shutdown acknowledgement SHALL NOT replace the checked operating-system cleanup outcome. An explicit close that fails protocol admission after successful operating-system cleanup SHALL retain that protocol failure.

#### Scenario: R4-STDIO-16 Repeated close preserves cleanup failure
- **GIVEN** a source session whose terminate/reap operation fails
- **WHEN** close is called again after terminal invalidation
- **THEN** it returns the retained cleanup failure and does not report success

#### Scenario: R4-STDIO-17 Repeated close preserves protocol failure
- **GIVEN** a malformed shutdown acknowledgement and successful operating-system cleanup
- **WHEN** explicit close completes and is subsequently repeated
- **THEN** both calls report the retained protocol failure

### Requirement: Reciprocal shutdown shares one absolute cleanup deadline
The reciprocal source session SHALL bound explicit shutdown by the earlier of its caller-issued deadline and a five-second deadline sampled at shutdown admission. It SHALL derive the acknowledgement deadline by reserving one second from that same issued overall deadline, without independently sampling an acknowledgement timeout. It SHALL invoke canonical process CloseUntil with the original overall deadline after every acknowledgement outcome, including timeout, malformed acknowledgement, transport failure, and expired deadline. Async close SHALL retain the owner fiber's final outcome and SHALL join that owner at most once after cleanup publication. A caller that stops waiting SHALL NOT discard the owner's process cleanup obligation.

#### Scenario: R4-STDIO-18 Acknowledgement cannot extend shutdown budget
- **GIVEN** a caller-issued close deadline and a peer that delays its acknowledgement
- **WHEN** the reserved acknowledgement interval expires
- **THEN** the session invokes terminate/reap with the original earlier overall deadline and does not start another five-second budget

#### Scenario: R4-STDIO-19 Repeated async close observes one owner result
- **GIVEN** an async session whose bridge owner completed cleanup
- **WHEN** close is called more than once
- **THEN** each call observes the retained checked outcome and the owner is joined at most once

### Requirement: Rust owner mappings are declared in Beskid source
Rust owner mappings SHALL come from a closed source attribute `RustOwner` on the canonical Glue declaration, read through generation-bound binding facts.

On a `GlueHandle` type whose `Library` names a manifest Rust glue owner, `[RustOwner(Path:"<rust path>")]` SHALL be required. It SHALL map that type's complete owner brand to the Rust type.

On a method of an `Extern` contract whose `Library` names a Rust glue owner, `[RustOwner(Path:"<rust path>", Fallible:<bool>)]` SHALL be optional. Absent arguments SHALL default to `Path` = `implementation::<symbol>` and `Fallible` = `false`. The mapping SHALL be keyed by the exact binding identity.

A Rust path SHALL be `::`-separated ASCII identifiers whose first segment is `implementation`. `crate`, `self`, `super`, `std`, `core`, raw identifiers and generic arguments SHALL be rejected. The attribute SHALL be rejected in each of these cases:
- duplicated;
- with unknown or repeated arguments;
- `Fallible` on a type;
- placed on any other declaration;
- naming a library that has no Rust glue block.

The owner build SHALL derive its type and callable inputs only from these facts. Caller-supplied brand or identity tables SHALL NOT be accepted. The mapping text SHALL be part of the owner source inventory digest. A Rust implementation whose signature disagrees with the declared mapping or fallibility SHALL fail the owner compilation, not be adapted at runtime.

#### Scenario: Declared mappings drive the owner build
- **GIVEN** the manual owned fixture with `[RustOwner(Path:"implementation::ManualOwned")]` on `ManualOpaque` and `Fallible:true` on `glue_bytes`, `glue_utf8` and `glue_failure`
- **WHEN** the Rust owner build input is formed
- **THEN** it contains exactly one type mapping for the `ManualOpaque` brand and one callable mapping per imported binding identity, with the declared or default paths and fallibility

#### Scenario: Missing or misplaced mappings fail before generation
- **GIVEN** a `GlueHandle` type without `RustOwner`, a duplicate `RustOwner`, `RustOwner` on an Export function, or a path such as `std::process::abort`
- **WHEN** the Glue binding facts are queried
- **THEN** the query rejects the declaration with its source span before any owner source is generated

#### Scenario: Mapping change changes owner identity
- **GIVEN** two otherwise identical builds that differ only in one `RustOwner` path or `Fallible` value
- **WHEN** both owner source inventories are formed
- **THEN** their source digests differ
