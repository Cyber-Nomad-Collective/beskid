---
description: Runtime allocator + GC scaffolding
---

# Runtime allocator + GC scaffolding

## Purpose
Define the minimal runtime surface needed to support heap-allocated aggregates and future GC.

## Runtime ABI summary
- `string = {ptr, len}`
- `array = {ptr, len, cap}`
- `struct/enum = *mut u8` (heap pointer)
- Heap objects begin with a **type descriptor pointer**.

## Type descriptor
**TypeDescriptor fields (v0)**
- `size: usize`
- `align: usize`
- `ptr_count: u32`
- `ptr_offsets: *const usize` (array of offsets)
- `name: *const u8` (optional, for diagnostics)

**Notes**
- Descriptors are emitted as read-only module data objects.
- Pointer offsets are byte offsets from the object base.

## Allocation API
**Builtin**: `alloc(size, type_desc_ptr) -> *mut u8`

Behavior:
- Allocates `size` bytes (aligned) and writes `type_desc_ptr` at offset 0.
- Returns a pointer to the object base.
- Allocation accounting increments a global counter (for GC triggers later).

## Root registration (scaffolding)
**Builtins**
- `gc_register_root(ptr_addr)`
- `gc_unregister_root(ptr_addr)`

**gc-arena model**
- All GC interactions occur inside `Arena::mutate`.
- The runtime stores the arena root object; `DynamicRootSet` is used to pin values across calls.
- Values must not escape the mutation callback unless stored in the root object.

Guidelines:
- `ptr_addr` is the address of a stack slot holding a pointer.
- Codegen should register locals that hold heap pointers when entering a scope.

## Root object schema (recommended)
- `globals`: persistent global values (function globals, constants).
- `dynamic_roots`: `DynamicRootSet` for host-visible handles.
- `runtime_state`: allocator counters, intern tables, and runtime caches.

**Concrete draft**
```
struct RuntimeRoot {
    globals: Vec<Gc<'gc, AnyValue>>,
    dynamic_roots: DynamicRootSet<'gc>,
    runtime_state: RuntimeState,
}
```

## Dynamic root handles
- `gc_root_handle` returns a stable `u64` handle for a value stored in the runtime handle table (v0).
- `gc_unroot_handle` releases the handle when the host no longer needs the value.
- A future revision may back handles with `DynamicRootSet`.

## Runtime integration
### Arena lifecycle
- `pecan_engine` owns a single `Arena<Root>` per engine instance.
- Each JIT entrypoint executes inside `arena.mutate(|mc, root| { ... })`.
- The arena root persists across runs to hold globals and dynamic roots.
- JIT entrypoints must always be invoked through the engine wrapper to guarantee `mutate`.

### Mutation handle plumbing
- The engine sets a thread-local pointer to the active `Mutation` when entering `mutate`.
- Runtime builtins read the TLS `Mutation` to allocate or manipulate GC pointers.
- Builtins should fail fast if called without an active `Mutation`.

**Recommended API**
```
fn set_current_mutation(mc: *mut Mutation<'_>);
fn clear_current_mutation();
fn with_current_mutation<R>(f: impl FnOnce(&Mutation<'_>) -> R) -> R;
```

### Host boundary rules
- Values crossing the host boundary must be stored in the arena root object.
- Host-visible values are represented as `u64` root handles (no raw `Gc` outside mutate).
- JIT calls from the host must always enter through the engine wrapper to guarantee `mutate`.

### Example: TLS mutation + root handles
```rust
// Engine entrypoint wrapper (host side)
engine.with_arena(|arena, root| {
    arena.mutate(|mc, root| {
        runtime::set_current_mutation(mc);
        let result = jit_entrypoint();
        runtime::clear_current_mutation();
        result
    })
});

// Runtime builtin (called from JIT)
pub fn alloc(size: usize, type_desc: *const TypeDescriptor) -> *mut u8 {
    runtime::with_current_mutation(|mc| {
        gc_alloc(mc, size, type_desc)
    })
}

// Host-visible value pinning
let handle = gc_root_handle(value_ptr); // returns u64 handle
// ... store handle on host side ...
gc_unroot_handle(handle);
```

## Write barrier (scaffolding)
**Builtin**: `gc_write_barrier(dst_obj, value_ptr)`

Guidelines:
- Call before storing a heap pointer into another heap object.
- No-op until GC is enabled.

## Match + member access lowering constraints
- Enum tag stored at payload offset 0 (after header).
- Member loads/stores use descriptor offsets.
- Match lowering reads tag and branches; payload field loads use offsets.

## Descriptor data objects
- Type descriptors are emitted as module data objects and referenced by pointer in heap object headers.

## Future GC integration notes
- Planned Go-style concurrent mark/sweep.
- Roots: stack, globals, and temporary registers registered explicitly.
- Write barriers will become mandatory once GC is active.

## References
- Runtime ABI: `docs/execution/06-runtime-abi.md`
- Builtins list: `docs/execution/07-runtime-builtins.md`
