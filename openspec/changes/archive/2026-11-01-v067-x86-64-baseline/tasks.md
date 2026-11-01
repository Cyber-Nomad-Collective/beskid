## 1. Spec
- [x] 1.1 Write the backends delta (x86_64 baseline, aarch64 baseline, JIT host check, E4004).
- [x] 1.2 State the CPU requirement on the Docs install pages.
## 2. Implementation
- [x] 2.1 One ISA constructor in `beskid_codegen` for AOT, JIT and tests; x86-64-v2 for x86_64 targets.
- [x] 2.2 E4004 for a Cranelift runtime helper call in AOT and the JIT.
- [x] 2.3 Regression tests: AES and ChaCha20 program linked and run on Linux x86_64; no undefined `__cranelift_*` symbol in an object for each x86_64 target.
