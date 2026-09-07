---
title: "From gc-arena to Stock CLIF: A Two-Year Honesty Arc"
description: "The Beskid runtime journey -- from Pecan's gc-arena experiments through Rust handlers to ISLE-native stock Cranelift CLIF. Not a straight line. An honesty arc."
date: 2026-07-24
blogStatus: released
release: Runtime
---

Every language project has a runtime story. Most of them are lies — "designed from first principles, implemented in six months, stable ever since." Beskid's runtime story is not a straight line. It is an **honesty arc**: a series of decisions where we chose the less wrong path, documented what we learned, and kept moving.

This post is the index. The full story lives in four phase posts:

- **[Phase 1: gc-arena](/blog/runtime-01-gc-arena/)** (February 2026) — The research spike that asked whether Rust arena allocators could become a GC. The answer was "probably, but not yet" — and the pattern of honest retreat became the project's default stance.
- **[Phase 2: Rust Handlers](/blog/runtime-02-rust-handlers/)** (March–June 2026) — 34 frozen kernel exports, 77 soft dispatch ops, hand-written Rust handlers threaded through a registration chain across every crate. It worked. For a while.
- **[Phase 3: The Silent Gap](/blog/runtime-03-silent-gap/)** (June 2026) — A corelib test passed against a handler that was correct by the old spec but wrong by the new one. The CI gate was green. The behavior was silently wrong. The Rust-first runtime died that day.
- **[Phase 4: ISLE Shift](/blog/runtime-04-isle-shift/)** (July 2026) — The boundary change: ISLE rules emit stock Cranelift CLIF, verified by Cranelift's own verifier. From trust to verify. A correctness contract, not a runtime.

The arc continues. Cohort 1 is in progress. The migration can stop at any boundary — Rust fallbacks remain. Not "we know the answer." Not "the runtime is done." Just: here is what we tried, here is what we learned, here is where we are going, and here is the verifier that will tell us if we're wrong.

## Provenance

[Approved ISLE runtime-port design](https://github.com/Cyber-Nomad-Collective/beskid/blob/main/docs/superpowers/specs/2026-07-11-isle-runtime-port-design.md) · [ABI builtins authority](/platform-spec/execution/abi-and-host/builtins-and-symbols/adr/0003-builtin-specs-sole-clif-source/) · [runtime registration authority](/platform-spec/core-library/compiler-integration/corelib-injection-and-resolution/adr/0010-runtime-registration-authority/)
