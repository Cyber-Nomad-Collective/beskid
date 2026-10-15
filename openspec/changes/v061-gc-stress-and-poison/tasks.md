## 1. Validate

- [x] 1.1 Validate this change with `openspec validate v061-gc-stress-and-poison --strict` and regenerate `openspec/catalog.json` when the change is applied.

## 2. Introduce

- [ ] 2.1 Read and parse `BESKID_GC_STRESS` in `ProcessInit` (`Runtime/Bootstrap/Lifecycle.bd`); trap with the variable name on a malformed value. (implemented on v06x/runtime 20e87ac8; awaiting gate)
- [ ] 2.2 Move `StressShouldCollect` to the start of every managed allocation path (`GcAlloc`, `GcTryAlloc`, array and string construction). (implemented on v06x/runtime 20e87ac8; awaiting gate)
- [ ] 2.3 Run `GcHeapVerify` before and after each collection when `verify` is set; trap `runtime_internal_corruption` (10) on a failure; add the poison-header check to the verifier. (implemented on v06x/runtime 20e87ac8; awaiting gate)
- [ ] 2.4 Declare the debug-kit build-profile fact in `runtime_manifest.bsol` and regenerate the ABI artifacts with the official generator. (implemented on v06x/runtime 20e87ac8; awaiting gate)
- [ ] 2.5 Debug kit: poison freed slots in `Sweep.bd`; add the quarantine FIFO with its byte budget and `BESKID_GC_QUARANTINE`. (implemented on v06x/runtime 20e87ac8; awaiting gate)
- [ ] 2.6 Tests: native-kit fixtures that show (a) a missing root found by `alloc:1` and not without it, (b) `verify` trapping on a corrupted span, (c) a dangling reference to a quarantined slot trapping through the fail-fast check, (d) malformed `BESKID_GC_STRESS` rejection, (e) release kit unchanged without the variable. (implemented on v06x/runtime 20e87ac8; awaiting gate)

## 3. Integrate

- [ ] 3.1 Add the Linux stress step to the Woodpecker validation lane in `scripts/ci/`: Corelib tests and `runtime_semantics` with `BESKID_GC_STRESS=alloc:1,verify` against the debug kit.

## 4. Verify

- [ ] 4.1 Run the stress step on the builder and record the per-suite pass counts and wall time.
- [ ] 4.2 Run the ordinary affected crates, Corelib, Serialization Mod and `runtime_semantics` suites to show no change without the variable.
