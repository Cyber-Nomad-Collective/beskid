## Context

Beskid compiles through Cranelift (`cranelift-codegen`, `cranelift-frontend`, `cranelift-module`, `cranelift-object` and `cranelift-jit`, version 0.136.0 in `compiler/Cargo.lock`). The collector is non-moving, stop-the-world and per-thread, and a collection starts only inside a runtime call. Roots today come from four sources (`MarkRoots` in `Runtime/Mem/Gc/RootsHandles.bd`): the TLS `RootFrame` chain, the external root stack (`gc_register_root`), suspended fibers, and the root-handle stack. Generated code feeds the second and the fourth source by explicit calls. Cranelift already preserves frame pointers for Beskid code (`crates/beskid_codegen/src/cranelift_host.rs` sets `preserve_frame_pointers`, and `crates/beskid_aot/src/object_module.rs` asserts it).

## Cranelift user stack maps (primary sources)

- `cranelift-codegen` 0.136.0, `src/ir/user_stack_maps.rs`, module documentation: a safepoint is a program point where it must be safe to run GC, and "all non-tail call instructions are considered safepoints". A stack map describes where the live GC-managed values are at one safepoint. The maps are "user-defined": the CLIF producer identifies the GC values and Cranelift spills them and records the entries. Each `UserStackMap` belongs to one instruction pointer, holds the frame size, and is a bitmap with one bit per stack word. Incoming stack arguments are recorded in the callee's map. https://github.com/bytecodealliance/wasmtime/blob/main/cranelift/codegen/src/ir/user_stack_maps.rs
- `cranelift-frontend` 0.136.0, `src/frontend.rs`: `FunctionBuilder::declare_value_needs_stack_map(val)` and `FunctionBuilder::declare_var_needs_stack_map(var)` (call before any definition of the variable). "All values that are uses of this variable will be spilled to the stack before each safepoint and reloaded afterwards." `make_stack_map_alias_region` assigns an alias region to the inserted spills and reloads. https://github.com/bytecodealliance/wasmtime/blob/main/cranelift/frontend/src/frontend.rs and https://docs.rs/cranelift-frontend/latest/cranelift_frontend/struct.FunctionBuilder.html
- `cranelift-codegen` `src/machinst/buffer.rs`: `MachBufferFinalized::user_stack_maps()` returns `(CodeOffset, frame size, UserStackMap)` for each safepoint, and `UserStackMap::entries()` yields `(type, SP offset)` pairs. https://github.com/bytecodealliance/wasmtime/blob/main/cranelift/codegen/src/machinst/buffer.rs
- `cranelift-object` and `cranelift-jit` 0.136.0 compile through `Context::compile` inside `define_function`, so `Context::compiled_code()` gives the finalized buffer, and its stack maps, after each `Module::define_function`.
- Wasmtime uses these maps for its GC-reference support (`crates/cranelift/src/func_environ/gc` in the Wasmtime repository); it is the production reference user.

## Decisions

1. **Every managed value is declared, nothing is registered.** Lowering calls `declare_value_needs_stack_map` for each SSA value of a managed type (string, array, record, closure environment, Dynamic cell) and `declare_var_needs_stack_map` for each managed `Variable`. A value that is not live across a call is not spilled, so a function that cannot reach a collection pays nothing, and the root-elision analysis has no purpose.
2. **The interior-pointer convention stays.** A string or array reference is the ABI view address, not the object header. The marker already normalizes it through `ManagedObjectForReference`; stack-map roots go through the same path.
3. **One table per module, keyed by return address.** For each function the emitter writes the function's offset and its list of `(code offset of the safepoint return address, frame size, set bits)`. AOT: a read-only section, plus a registration call from the module's initializer. JIT: the table is registered when the JIT module is finalized and unregistered when it is freed. The runtime keeps the tables sorted by code range.
4. **The collector walks frames by frame pointer.** From the runtime entry of a collection it walks the frame-pointer chain of the current thread, and of every suspended fiber from its saved context, to the native boundary. For each return address that falls in a registered table it marks the listed words relative to that frame's stack pointer. A return address outside every table is a host or runtime frame and has no managed slots: those frames keep using root handles and the external root stack.
5. **No safepoint filtering.** Cranelift treats every non-tail call as a safepoint. Calls to runtime services that cannot collect also spill live references; the cost is a store and a load per live reference per call. This is acceptable and removes the correctness risk of a hand-kept non-collecting list.
6. **Non-moving collector, so no relocation.** The spill slots are read only; Beskid does not update them. A future moving collector can update them, because Cranelift reloads after each safepoint.

## ABI and runtime impact

- New ABI-v5 manifest entries (or an ABI version step, decided by the ABI owner): the stack-map table layout and `beskid_rt_v5_stack_maps_register` / `beskid_rt_v5_stack_maps_unregister` exports. The ABI artifacts are regenerated by the manifest generator.
- `gc_register_root` and `gc_unregister_root` stay for hosts and the runtime corpus itself, but generated program code no longer imports them. The TLS `RootFrame` chain is removed once no generated code produces frames.
- The fiber scheduler must publish the saved frame pointer and stack bounds of each suspended fiber; the scheduler record already holds the stack base and the architecture context.
- Every runtime kit and every published Mod artifact is rebuilt; kits and artifacts of 0.6 are rejected by the existing exact-digest checks.
- The runtime corpus is compiled by the same pipeline. Runtime functions that collect (allocation paths) are the collection entry points; the walk starts above them.

## Removed design

The manual root protocol in `crates/beskid_isle/src/context/roots.rs`, the `trapz` checks after root registration, the construction-temporary root handles in lowering, and `crates/beskid_isle/src/root_elision.rs` are deleted in the same change. No compatibility path keeps the old protocol.

## Risks

- A reference that lowering does not declare is not a root. Mitigation: a CLIF verifier pass that rejects a call while a value of a managed type is live and undeclared, and the 0.6.x `BESKID_GC_STRESS=alloc:1,verify` pass in CI.
- Windows x64 frame walking with frame pointers in mixed host frames. Mitigation: the walk stops at the first return address outside Beskid code and the runtime entry records the managed frame boundary.
