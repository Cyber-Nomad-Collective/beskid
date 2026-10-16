## ADDED Requirements

### Requirement: Stdio bridge is provisional and fail-closed
The Glue stdio bridge SHALL be a provisional capability. It SHALL carry no delivery obligation for beskid 0.6, and no release acceptance SHALL depend on it. Delivered Rust Glue SHALL NOT route a call through the stdio bridge. Until a process round trip is qualified, every operation of the bridge that has no qualified implementation SHALL fail closed with a typed error before it starts a child process, sends a frame or dispatches a call. The bridge SHALL NOT fall back to the in-process checked C ABI path, and that path SHALL NOT fall back to the bridge. Promotion of this capability SHALL require a test in which Beskid starts a generated Rust peer process, completes the handshake, completes one call, cancels one call and shuts down the session.

#### Scenario: Unqualified bridge cannot qualify a release
- **GIVEN** a release candidate whose only Glue evidence is stdio bridge codec, envelope or session tests
- **WHEN** release acceptance is evaluated
- **THEN** the stdio evidence does not satisfy any 0.6 obligation and Rust Glue acceptance depends only on the owned-path evidence

#### Scenario: Unimplemented bridge operation fails closed
- **GIVEN** a bridge operation without a qualified implementation
- **WHEN** a caller invokes it
- **THEN** it returns a typed error before any child process, frame or dispatch effect, and no other transport is selected

### Requirement: Stdio bridge framing and shared value encoding
Stdio bridge wire frames SHALL consist of u32 little-endian frame-body byte length followed by a shared-serialization-adapter envelope containing protocol version 1, message kind, canonical library identity, session generation, request ID, binding/method identity, shape identities and payload or typed error. Handshake SHALL verify protocol/target/ABI/layout/library/binding compatibility before calls. Message kinds SHALL distinguish handshake/request/response/error/cancel/shutdown/acknowledgement. Payload maximum SHALL be 16 MiB, decoded depth 64, aggregate nodes/entries 1,048,576, scalar bytes 16 MiB and outstanding requests 256, checked before allocations/effects; length includes full body. Glue SHALL depend on shared serialization Encoder/Decoder/SerializationLimits and typed Encode/Decode contracts; its format adapter SHALL preserve IEEE bits and strict UTF-8, with explicit owned byte conveniences. Generic resources/addresses/raw dynamic payload pointers SHALL NOT be serialized; checked handle tokens are explicit Glue protocol fields. The bridge SHALL NOT introduce a second codec metadata authority.

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

### Requirement: Bridge cancellation shutdown and checked handle lifecycle
The stdio bridge SHALL run a bounded pump on existing Beskid fibers/Core.IO/cooperative wait/cancellation. Each request SHALL settle exactly once; cancellation SHALL remove its waiter and reject late replies without resurrecting state. Process exit, foreign failure, malformed message and decode failure SHALL return typed terminal errors and release owned resources. Opaque handle values SHALL be host-owned checked identities bound to library/backend/session/generation/shape, with no public raw construction bypass. Close SHALL stop admission, settle pending calls, send shutdown and allow at most 5 s for acknowledgement/exit before terminating and reaping; repeated close SHALL be idempotent. All success/failure/cancel/close paths SHALL release pipe handles, pending buffers, transfer owners and GC roots once. Peer stdout SHALL contain protocol frames only; stderr SHALL drain separately with bounded retained diagnostics.

#### Scenario: Cancellation and late response
- **GIVEN** a cancelled request receives a late response or concurrent exit
- **WHEN** pump settles it
- **THEN** one cancellation terminal result remains and no waiter/resource is resurrected (R4-IO-06..08)

#### Scenario: Close and stale handle
- **GIVEN** a session closes with pending calls, then slot is reused
- **WHEN** an old handle is called and close repeats
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

### Requirement: Public Glue facade excludes raw declaration-era tags

The public Glue package SHALL expose the canonical envelope, bounded binary codec, incremental pump, and cooperative session APIs. It SHALL NOT expose a raw integer tag constructor, a raw `Handle` accessor, or a declaration-era message carrier whose only identity is a caller-supplied integer tag. Wire library names, generations, binding digests, and decoded data SHALL remain descriptive protocol inputs and SHALL NOT grant native callback, descriptor, or opaque owner admission. The package SHALL NOT declare Glue Mod contracts or Glue selection attributes.

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
