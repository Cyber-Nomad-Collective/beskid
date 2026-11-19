## Frame discovery

A managed caller publishes a stack-allocated checkpoint while a call can observe live GC references. The checkpoint refers directly to metadata for its own function. The reference is relocated by the AOT linker or JIT module. This keeps code and metadata in the same module lifetime and supports several simultaneously loaded modules.

The compiler uses the managed-reference facts at lowering time. Cranelift assigns spill slots and computes liveness at calls. Emission uses the finalized machine return PC and stack-pointer-relative offsets. A nonallocating push captures its return PC and associates the matching map with the caller's stack pointer. A matching pop restores the previous checkpoint after normal return. The compiler emits both calls around a safepoint only when there are roots to publish. Trap exits follow the runtime's termination contract.

The TLS frame head is switched along with fiber context. Collection visits the active chain and each suspended chain, including managed frames separated by a host callback. The collector uses the existing managed-reference normalization for strings and array views. External host roots, runtime handles and globals retain their own lifetimes.

Each function table begins with the eight-byte `BSKGC\0\x01\0` marker, total table size, machine-code size, the relocated function address and the safepoint count. Each safepoint carries its return-PC offset, frame size, root count and stack-pointer-relative root offsets. Sizes, counts and offsets are 32-bit little-endian integers on the supported targets. Tables have eight-byte alignment and include trailing padding in their declared size. A malformed map stops the collection before sweep.

## Migration and release

Program code uses precise stack maps by default. The compiler emits a threshold check at source `while` and range-loop headers. Native byte-buffer adapters keep the managed header live until the borrowed payload returns. Host roots and runtime-owned handles remain explicit where their lifetime extends beyond a managed frame.

A single module can include managed program code and the collector bootstrap. Each managed function publishes its own live roots. Functions from the compiler-verified bootstrap corpus implement the collector with native pointers and explicitly owned roots. The compiler rejects bootstrap functions that require stack maps. A module can bind its own checkpoint functions when their definitions come from that corpus and match the runtime ABI.

## Native qualification

Run from the compiler workspace on each release host with a native C compiler and LLVM tools installed.

```sh
cargo test --locked -p beskid_engine --no-fail-fast \
  --test stack_maps_native --test stack_maps_parked --test stack_maps_jit -- --show-output
```

The AOT callback fixture builds matching debug and release runtime kits. On Linux an additional link with checkpoint publication disabled must fail with a missing live object. Each 0.7 Woodpecker platform build runs the native tests and includes its log in the checksummed artifacts.
