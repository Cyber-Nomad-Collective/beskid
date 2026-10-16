## Why

`v06-rust-glue-integration` stated that delivered Glue calls between Beskid and Rust use one stdio transport. The code that passes its tests calls Rust owners in process through the checked C ABI, and no test starts a Rust peer process and completes a call over stdio (docs/research/2026-10-13-glue-design-review.md). The stdio bridge is a different capability: a process-isolated plugin protocol in the style of Erlang ports, not FFI. This change keeps its requirements as a separate, clearly provisional capability so that the 0.6 Rust Glue text describes the delivered path only.

## What Changes

- Add the provisional capability `language-meta--interop--glue-stdio-bridge`. It holds the stdio requirements moved unchanged in substance from `v06-rust-glue-integration`: framing and shared value encoding, cancellation and shutdown lifecycle, the version-one envelope, the binary value adapter, the public facade, empty control payloads, retained cleanup outcomes, the shared shutdown deadline and opaque stdio value ownership (R4-IO-01..12, R4-STDIO-12..22).
- Add a fail-closed provisional status requirement: no 0.6 delivery obligation, no fallback in either direction between the bridge and the in-process path, and a named promotion test.
- Remove references to `GlueTag`, Glue Mod contracts and Glue selection attributes from the moved text.

## Capabilities

### New Capabilities
- `language-meta--interop--glue-stdio-bridge`: provisional stdio bridge between Beskid and a foreign peer process.

### Modified Capabilities
- None.

## Impact

The corelib package `corelib_glue` (`Envelope.bd`, `BinaryCodec.bd`, `Pump.bd`, `Session.bd`) and the Rust crate `beskid_glue` are the informative implementation anchors. Their existing unit tests (`crates/beskid_glue/tests/stdio_peer.rs`, corelib `glue/BinaryCodecTests.bd`, `glue/ControlEnvelopeTests.bd`) remain informative and do not qualify any release obligation. The release qualification cases R4-IO-01..12 and R4-STDIO-12..22 move out of the 0.6 required set. Public standard links remain /docs/standard/.

## Compatibility, Migration and Reversion

No users exist. Nothing is deprecated. The bridge stays provisional until the promotion test passes natively on the required targets; reversion deletes this change and the provisional package without effect on delivered Rust Glue.
