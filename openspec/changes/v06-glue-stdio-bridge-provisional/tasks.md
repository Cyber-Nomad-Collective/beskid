## 1. Validate
- [x] 1.1 Validate this change with OpenSpec and confirm that `v06-rust-glue-integration` no longer contains stdio requirements. (`openspec validate --strict` passes for both changes; the Rust Glue deltas mention stdio only to exclude it; 2026-10-13.)
- [x] 1.2 Remove R4-IO-01..12 and R4-STDIO-12..22 from the 0.6 required release cases, or mark them provisional, in the release case manifest (`scripts/ci/release-cases-v06.json` `provisional_cases`; R4-GEN-04..06 are listed there too, with no spec change, because the Glue Mod contracts are deleted in 0.6.0; 2026-10-13).

## 2. Introduce (no 0.6 obligation)
- [ ] 2.1 Implement the stdio handshake, frame pump, errors, cancellation and late reply, checked handles, shutdown, termination, reap and GC cleanup (R4-IO). Former `v06-rust-glue-integration` task 3.5.
- [ ] 2.2 Bind opaque stdio values to the privately admitted native owner, image, provider and connection epoch before dispatch, and prove restart, replay, foreign brand, forged envelope and failed cleanup denial (R4-STDIO-20..22). Former `v06-rust-glue-integration` task 3.6.
- [ ] 2.3 Make every bridge operation without a qualified implementation return a typed error before effects. Remaining: `corelib_glue` `Session.bd` and `crates/beskid_glue` implement the protocol; no fail-closed gate for unqualified operations was found and no test asserts the typed error.

## 3. Verify before promotion
- [ ] 3.1 Add a native test in which Beskid starts the generated Rust peer, completes the handshake, completes one call, cancels one call and shuts down within the five-second budget.
- [ ] 3.2 Run that test natively on Linux x86_64, macOS aarch64 and Windows x86_64 before any text calls the bridge delivered.
