## Why

On x86_64 the compiler builds its Cranelift target ISA with no CPU features. Cranelift then lowers the CLIF `swizzle` and `shuffle` instructions to a call to its runtime helper `__cranelift_x86_pshufb`, because the SSSE3 `pshufb` instruction is not enabled. No runtime kit defines that helper. Every Linux x86_64 program that links the Corelib AES or ChaCha20 code fails at the link step with E4021 (`undefined reference to __cranelift_x86_pshufb`). This stops TLS, QUIC, WebSocket, HTTPS and the crypto tests. The JIT detects the host CPU instead, so the JIT and AOT compile one program for different instruction sets.

## What Changes

- Every x86_64 target (`x86_64-unknown-linux-gnu`, `x86_64-pc-windows-msvc`) has one CPU baseline: the x86-64-v2 microarchitecture level of the x86-64 psABI (SSE3, SSSE3, SSE4.1, SSE4.2, POPCNT, CMPXCHG16B, LAHF-SAHF). AOT object emission, the JIT and the compiler tests build the ISA with this baseline and no feature above it, also when the host CPU has more features.
- The `aarch64-apple-darwin` target uses the Cranelift Armv8.0-A default with no optional extension, also for the JIT on the host.
- The JIT stops with an error before code generation when the host CPU does not have every baseline feature.
- Generated code never calls a Cranelift runtime helper (a `__cranelift_*` symbol). If Cranelift emits such a call, the build stops with new code **E4004** before the link step. The JIT stops with the same message before it runs code.
- The install pages state the CPU requirement.

## Capabilities

### Modified Capabilities
- `compiler--build-pipeline--backends-jit-aot`.

## Sources

- x86-64 psABI, section 3.1.1 "Processor Architecture", microarchitecture levels table (gitlab.com/x86-psABIs/x86-64-ABI): x86-64-v2 adds CMPXCHG16B, LAHF-SAHF, POPCNT, SSE3, SSE4_1, SSE4_2, SSSE3 to the baseline.
- Cranelift 0.136.0 `cranelift-codegen-meta/src/isa/x86.rs`: preset `x86-64-v2` = `sse42 && has_popcnt && has_cmpxchg16b` (SSE4.2 implies SSE4.1, SSSE3 and SSE3). `cranelift-codegen/src/isa/x64/lower.isle` `lower_pshufb`: without `has_ssse3` a `swizzle` or a two-input `shuffle` becomes `LibCall::X86Pshufb` (`__cranelift_x86_pshufb` in `cranelift-module`); `ceil`/`floor`/`trunc`/`nearest` become libm calls without `has_sse41`; `fma` is a libm call without `has_fma` (x86-64-v3).
- Red Hat Enterprise Linux 9 builds for x86-64-v2 (developers.redhat.com, "Building Red Hat Enterprise Linux 9 for the x86-64-v2 microarchitecture level", 2021-01-05).
- Windows 11 24H2 does not boot on a CPU without SSE4.2 and POPCNT, so every supported Windows x86_64 host is at least x86-64-v2.
- Debian, Ubuntu and Fedora keep x86-64-v1 for the distribution. Beskid does not take v1, because v1 has no `pshufb` and the Corelib AES and ChaCha20 code would need a software shuffle helper in every runtime kit. CPUs without x86-64-v2 (before Intel Nehalem, 2008, and AMD Bulldozer, 2011) are not supported.

## Impact

`beskid_codegen` (new shared ISA constructor), `beskid_aot` object emission, `beskid_engine` JIT, compiler tests that build an x86_64 ISA, Docs install pages. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. A program built by 0.6.7 for x86_64 needs an x86-64-v2 CPU. Reversion: remove the baseline and give every runtime kit a `__cranelift_x86_pshufb` helper.
