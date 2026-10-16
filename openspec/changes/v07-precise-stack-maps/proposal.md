## Why

Generated code roots managed values by hand. Lowering emits `gc_register_root` for every managed local and parameter at its binding and `gc_unregister_root` on every exit edge (`crates/beskid_isle/src/context/roots.rs`). Construction temporaries take root handles. A separate analysis (`crates/beskid_isle/src/root_elision.rs`) removes these calls from functions that cannot reach a collection. The rooting bugs found in 0.5 and 0.6 came from this design: a temporary that no emitted root covered, a root released on one exit edge too early, or an elision proof that a later change made wrong. Since 0.6.0 such a bug traps (`v06-runtime-fail-fast`), and from 0.6.x a stress mode finds it in CI (`v061-gc-stress-and-poison`). Neither removes the cause.

Cranelift, the code generator that Beskid uses, can compute the roots itself. With user stack maps, the producer marks which SSA values are GC references. Cranelift then spills each such value that is live across a safepoint to a stack slot, reloads it after the safepoint, and records a stack map for each safepoint. The collector reads the maps for the frames on the stack and finds the exact roots. A value that is live is in the map by construction, and a value that is dead is not. This removes the class of rooting bugs, and it removes the runtime calls for root registration.

## What Changes

- Lowering declares every managed SSA value and every managed variable with `FunctionBuilder::declare_value_needs_stack_map` and `FunctionBuilder::declare_var_needs_stack_map`. It emits no `gc_register_root`, no `gc_unregister_root` and no root handle for a construction temporary.
- The root-elision analysis and its non-collecting service list are deleted.
- Code emission collects `MachBufferFinalized::user_stack_maps()` for each function (code offset, frame size, `UserStackMap`) and writes them into one stack-map table per module: a read-only section of the AOT object, and a table that the JIT registers with the runtime when it finalizes a module.
- The collector walks the frame-pointer chain of the current thread and of each suspended fiber. It finds the stack map of each return address in the registered tables and marks the words that the map lists. It still marks the root-handle stack and the external root stack that hosts, Glue and C use.
- **BREAKING (ABI):** the runtime ABI adds the stack-map table format and registration exports and removes `gc_register_root` and `gc_unregister_root` from the set that generated code imports. The runtime kit and every published Mod artifact must be rebuilt.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `execution--runtime--memory-and-gc-runtime-contract`: precise stack roots from compiler-generated stack maps replace manual root registration in generated code.

## Impact

Compiler: `beskid_isle` (`context/roots.rs`, `root_elision.rs`, every lowering that roots a temporary), `beskid_codegen` (module emission, checked-effect and trampoline emission, JIT finalization), `beskid_aot` (object section). Runtime: `Runtime/Mem/Gc/{RootsHandles,Marking}.bd`, the fiber scheduler (suspended-stack walk), `runtime_manifest.bsol` and the regenerated ABI artifacts. Tests: every native-kit and Corelib suite, plus the 0.6.x GC stress pass, which becomes the main proof that the maps are complete.
