# WS5: FFI and Externs Stability

Owner: Runtime + Engine + Analysis
Status: Planned

## Scope
- Freeze allowed FFI types and mapping (platform-aware)
- Provide safe path for byte-pointer params (temporary: pointer-sized ints; future: ref u8)
- Platform coverage plan (Linux first; macOS/Windows stubs)

## Deliverables
- ffi.md with allowed types, signatures, examples
- Enforced diagnostics with codes (T090104) at analysis time
- libc demos (getpid; write) and security controls documented

## Tasks
1. Type policy
   - Allowed params: bool, u8, i32, i64, f64, pointer-sized (usize/i64)
   - Allowed returns: same + unit
   - Validator in analysis + JIT signature check
2. Byte pointer parameters
   - Current: pass as i64 (helpers provided) and document
   - Future: language-level ref u8; update codegen + policy + demos
3. Platform strategy
   - Linux dlopen/dlsym (done)
   - macOS/Windows: design stubs + feature gates + clear errors
4. Security
   - Allow/Deny lists (done); examples in docs

## Acceptance Criteria
- Analysis errors T090104 with helpful hints
- Demos compile/run on Linux with feature flag
- Platform stubs compile on unsupported OSes and emit friendly errors

## Risks/Mitigations
- Pointer-size differences: use usize in mapping; convert carefully at boundaries

## References
- compiler/crates/beskid_engine/src/engine.rs, src/jit_module.rs
- compiler/crates/beskid_analysis/src/types/context/context.rs
- compiler/docs/extern-policy-v0-1.md

