## Why

Owner decision, 2026-10-15: a memory-safety error in the runtime must stop the process with a diagnostic. It must not continue with a substitute value.

The 0.6.0 runtime string services did not obey this rule. `str_concat` and `str_slice` returned null when an operand was a freed managed string, because `gc_root_handle` returned 0 for a freed object. Every later operation then continued with the null value. `str_len`, `str_eq` and `str_cmp` read the freed memory and returned whatever it held. A recent rooting bug in generated code thus showed as an empty string, not as a crash. The cause was found only after a long search.

Other managed runtimes treat this class of error as fatal. Go stops with `fatal error: found bad pointer in Go heap`. .NET calls `Environment.FailFast` on heap corruption. HotSpot writes an `hs_err` fatal error log. Chrome MiraclePtr crashes on a use of a freed `raw_ptr`. Beskid does the same.

## What Changes

- A runtime service that receives a non-null managed reference that is not a live managed object traps with code 6 (`invalid_or_stale_handle`). The diagnostic names the service, for example `beskid runtime trap v5: invalid_or_stale_handle (6): str_concat: managed string operand is not live (use after collection)`. The service does not return a substitute value.
- The rule applies to `str_len`, `str_eq`, `str_cmp`, `str_concat`, `str_slice`, the string adoption of `beskid_rt_v5_fs_read_text`, `gc_root_handle`, `beskid_rt_v5_gc_try_root_handle` and `beskid_rt_v5_abi_value_initialize`.
- A null reference is not a dead object. Each service keeps its null contract. A failed handle admission in a checked scope stays a recorded checked failure.
- The trap code, the trap name and the trap path exist in the ABI-v5 manifest. The ABI does not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `execution--runtime--memory-and-gc-runtime-contract`: adds the fail-fast rule for a dead managed operand.

## Impact

Runtime: `compiler/runtime/beskid/src/Runtime/Mem/Gc/RootsHandles.bd` (`RequireLiveManagedReference`, `TrapManagedOperandNotLive`, root-handle admission), `Data/Strings.bd`, `Data/Utf8ViewRecord.bd`, `Mem/AbiValue.bd`. The check reads span metadata only. It does not allocate and does not collect, so `str_len`, `str_eq` and `str_cmp` stay in the root-elision list of non-collecting services.

Tests: `compiler/crates/beskid_engine/tests/native_kit/use_after_collection_native.rs` with the fixture `tests/fixtures/use_after_collection.c`, in the static and the shared runtime library.

Follow-up changes: `v061-gc-stress-and-poison` finds more of these errors in CI. `v07-precise-stack-maps` removes the class of rooting bugs that causes them.
