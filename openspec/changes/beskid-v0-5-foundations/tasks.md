## 1. Validate the normative baseline

- [ ] 1.1 Run `openspec validate beskid-v0-5-foundations --strict --no-interactive` and correct every change-layout or scenario error before implementation.
- [ ] 1.2 Preserve the acceptance matrix in `design.md`; each stable requirement ID MUST keep one named parser, semantic, runtime, corelib, JIT, AOT, or native proof target.

## 2. Introduce the language and corelib contracts

- [ ] 2.1 Introduce the bindable `spawn` grammar and AST form in `compiler/crates/beskid_analysis/src/beskid.pest` and `compiler/crates/beskid_analysis/src/syntax/expressions/spawn_expression.rs`; add parser snapshots for `Fiber<i64> f = spawn Compute();` and a captured spawn block.
- [ ] 2.2 Introduce spawn type inference, ignored-handle diagnostics, transferable-capture checks, and terminal-handle diagnostics in `compiler/crates/beskid_analysis/src/types/checker/spawn.rs`, `compiler/crates/beskid_analysis/src/types/checker/statements.rs`, and `compiler/crates/beskid_analysis/src/types/result.rs`.
- [ ] 2.3 Extend the existing `Fiber<T>`, `FiberError`, `Channel<T>`, `ChannelError`, and `ChannelOptions` contracts in `compiler/corelib/packages/concurrency/src/Concurrency/` without changing the established `Detach() -> unit`, `Cancel() -> unit`, closed `FiberError`, or channel-option surfaces.
- [ ] 2.4 Introduce `use` grammar and scoped-binding AST nodes, then require `Disposable.Dispose() -> Result<unit, DisposeError>`, lexical non-escape diagnostics, a `Result<T, E>` enclosing callable, and exactly one explicit cleanup conversion from `DisposeError` to `E`; add missing/ambiguous-conversion and non-`Result` diagnostics.
- [ ] 2.5 Introduce `Core.Disposable`, `Core.IO.Reader`, `Writer`, `Closer`, `Stream`, and `IoError` in `compiler/corelib/packages/foundation/src/Core/`; implement `ReadExact`, `WriteAll`, EOF, no-progress, invalid-range validation order, zero-length bypass, idempotent close, and the explicit `DisposeError -> IoError::CloseFailed` cleanup conversion.
- [ ] 2.6 Introduce overlap-safe `Core.Bytes.Copy`, checked reader/writer cursors, strict Utf8/Hex/Base64 validators, the HTTP ASCII helper, and the `ReadBytesWith -> Result<u8[], SyscallError>` declaration correction.

## 3. Migrate runtime ownership and completion paths

- [ ] 3.1 Replace scalar fiber result and capture transport through generation-safe semantic facts, generated ISLE rules, `compiler/runtime_manifest.bsol`, and canonical Beskid runtime modules under `compiler/runtime/beskid/src/Runtime/` with the canonical typed ABI-value descriptor and GC-rooted slots.
- [ ] 3.2 Implement one traced ABI-value channel representation in canonical Beskid runtime modules under `compiler/runtime/beskid/src/Runtime/`; expose only the trusted manifest intrinsics needed for barriers and parking, with no Rust runtime or scalar fallback.
- [ ] 3.3 Route external completions through scheduler IDs, inbound commands, and the owner wake primitive in canonical Beskid runtime modules; target adapters expose only manifest-authorized platform operations and MUST NOT create a second scheduler implementation.
- [ ] 3.4 Add monotonic timer registration/cancellation and the shared atomic winner transition for readiness, close, cancellation, timeout, and duplicate wake in the canonical runtime scheduler state.
- [ ] 3.5 Lower scoped `use` cleanup through semantic facts and generated ISLE rules on normal completion, `return`, postfix `?`, and supported nested exits in reverse declaration order.

## 4. Delete superseded paths

- [ ] 4.1 Delete the scalar-only fiber and channel result paths after the generic ABI-value tests pass.
- [ ] 4.2 Delete TLS-local external completion delivery after owner-routed wake tests pass.
- [ ] 4.3 Preserve ordinary `use Package.Module;` imports, delete only the ambiguous fallback that interprets `use Type name = expression;` as an import, and prohibit a `using` compatibility alias after parser and semantic migration pass.
- [ ] 4.4 Delete independent partial-transfer loops in foundation-level stream APIs after `Core.IO` is the public contract.

## 5. Verify Foundation evidence

- [ ] 5.1 Run `cargo test -p beskid_tests analysis::spawn`, generation-safe query tests, generated ISLE/codegen suites, and canonical runtime conformance fixtures from `compiler/`.
- [ ] 5.2 Run focused JIT, AOT, and native runtime-kit fixtures for aggregate fiber results, `Channel<OwnedResource>` using a Foundation-local opaque disposable fixture, owner wake, timer cancellation, scoped `use`, bytes, encoding, and Core.IO.
- [ ] 5.3 Run `just corelib`, `just compiler`, and the available native runtime-kit scheduler smoke from `compiler/`.
- [ ] 5.4 Run `openspec validate beskid-v0-5-foundations --strict --no-interactive` and `bun run openspec:validate`; reserve release-wide catalog regeneration and publication for the final HTTP/release change.
- [ ] 5.5 Compile Foundation-local examples for spawn/join, aggregate fiber results, generic value/resource channels, owner-routed completion, timers, scoped `use`, bytes/encoding, and Core.IO through analysis, JIT, AOT, and every available native kit; do not depend on Networking or HTTP types.
