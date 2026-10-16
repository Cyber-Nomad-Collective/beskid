## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v07-precise-stack-maps --strict` and regenerate `openspec/catalog.json` when the change is applied.
- [ ] 1.2 Decide with the ABI owner whether the stack-map table is an ABI-v5 addition or an ABI version step.

## 2. Introduce

- [ ] 2.1 Lowering: declare every managed SSA value and managed variable with `declare_value_needs_stack_map` / `declare_var_needs_stack_map`; add a CLIF check that rejects an undeclared managed value live across a call.
- [ ] 2.2 Emission: collect `user_stack_maps()` per function after `define_function`; write the module stack-map table (AOT section, JIT registration at finalization).
- [ ] 2.3 Runtime: stack-map table registry; frame-pointer walk for the current thread and suspended fibers; mark the listed slots through `ManagedObjectForReference`.
- [ ] 2.4 Manifest: table layout and registration exports in `runtime_manifest.bsol`; regenerate the ABI artifacts with the official generator.

## 3. Delete

- [ ] 3.1 Remove `gc_register_root` / `gc_unregister_root` emission, the registration `trapz`, construction-temporary root handles in lowering, the TLS `RootFrame` chain, and `crates/beskid_isle/src/root_elision.rs`.

## 4. Verify

- [ ] 4.1 Run all native-kit, Corelib, Serialization Mod, `runtime_semantics`, interop and release suites on Linux x86_64, macOS aarch64 and Windows x86_64.
- [ ] 4.2 Run the `BESKID_GC_STRESS=alloc:1,verify` pass from `v061-gc-stress-and-poison` and record that it passes with no manual root emission.
