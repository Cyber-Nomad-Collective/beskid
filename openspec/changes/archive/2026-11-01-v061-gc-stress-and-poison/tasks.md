## 1. Validate

- [x] 1.1 Validate this change with `openspec validate v061-gc-stress-and-poison --strict` and regenerate `openspec/catalog.json` when the change is applied.

## 2. Introduce

- [x] 2.1 Read and parse `BESKID_GC_STRESS` in `ProcessInit` (`Runtime/Bootstrap/Lifecycle.bd`); trap with the variable name on a malformed value. (implemented on v06x/runtime 20e87ac8; verified by gate 3 on Linux x64)
- [x] 2.2 Move `StressShouldCollect` to the start of every managed allocation path (`GcAlloc`, `GcTryAlloc`, array and string construction). (implemented on v06x/runtime 20e87ac8; verified by gate 3 on Linux x64)
- [x] 2.3 Run `GcHeapVerify` before and after each collection when `verify` is set; trap `runtime_internal_corruption` (10) on a failure; add the poison-header check to the verifier. (implemented on v06x/runtime 20e87ac8; verified by gate 3 on Linux x64)
- [x] 2.4 Declare the debug-kit build-profile fact in `runtime_manifest.bsol` and regenerate the ABI artifacts with the official generator. (implemented on v06x/runtime 20e87ac8; verified by gate 3 on Linux x64)
- [x] 2.5 Debug kit: poison freed slots in `Sweep.bd`; add the quarantine FIFO with its byte budget and `BESKID_GC_QUARANTINE`. (implemented on v06x/runtime 20e87ac8; verified by gate 3 on Linux x64)
- [x] 2.6 Tests: native-kit fixtures that show (a) a missing root found by `alloc:1` and not without it, (b) `verify` trapping on a corrupted span, (c) a dangling reference to a quarantined slot trapping through the fail-fast check, (d) malformed `BESKID_GC_STRESS` rejection, (e) release kit unchanged without the variable. (implemented on v06x/runtime 20e87ac8; verified by gate 3 on Linux x64)

## 3. Integrate

- [ ] 3.1 Add the Linux stress step to the Woodpecker validation lane in `scripts/ci/`: Corelib tests and `runtime_semantics` with `BESKID_GC_STRESS=alloc:1,verify` against the debug kit.

## 4. Verify

- [x] 4.1 Run the stress step on the builder and record the per-suite pass counts and wall time. (gate 3 on the builder: runtime_semantics alloc:1,verify 9/9 in 65 s; corelib_tests per target 32/34 in 1230 s, the two compile failures fixed in compiler c062e3e3 and rerun under stress: ProcessSuite 9/9, BsolSerializationWireTests 25/25)
- [x] 4.2 Run the ordinary affected crates, Corelib, Serialization Mod and `runtime_semantics` suites to show no change without the variable. (gate 3 on Linux x64: workspace 3823/1 with the one failure fixed and rerun, corelib_tests 34/34 after the g9 fixes, serialization_mod 2/2, runtime_semantics 9/9)
