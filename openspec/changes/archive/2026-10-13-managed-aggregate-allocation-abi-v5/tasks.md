## 1. Specification and contract

- [x] 1.1 Create OpenSpec change `managed-aggregate-allocation-abi-v5` with proposal and capability spec
- [ ] 1.2 Validate the spec passes `openspec validate-standard`
- [ ] 1.3 Update `Bootstrap.bd` OOM behavior from null-return to trap
- [ ] 1.4 Update `aggregate_static.rs` to set `flags` bit 0 = 1 for aggregates
- [ ] 1.5 Update closure descriptor emission to set `flags` bit 0 = 0

## 2. Canonical Beskid GC module (CYB-29)

- [ ] 2.1 Create `compiler/runtime/beskid/src/Runtime/Gc.bd` — heap abstraction, mark/sweep, write barriers
- [ ] 2.2 Implement `beskid_rt_v5_heap_create` — heap initialization with config
- [ ] 2.3 Implement `beskid_rt_v5_heap_alloc` — GC-tracked allocation replacing `SystemAllocate` for objects
- [ ] 2.4 Implement mark/sweep collector: mark roots, trace pointer maps, sweep free list
- [ ] 2.5 Implement `gc_register_root`, `gc_unregister_root`, `gc_root_handle`, `gc_unroot_handle`
- [ ] 2.6 Implement `gc_write_barrier` — insertion barrier for concurrent marking
- [ ] 2.7 Implement `gc_collect`, `gc_collect_if_needed`, `gc_bytes_allocated`, `gc_object_count`, `gc_phase`, `gc_external_root_count`
- [ ] 2.8 Add GC capability denial tests for untrusted callers
- [ ] 2.9 Add GC reachability, cycle, barrier, root lifetime, and collection-pressure tests

## 3. Canonical Beskid strings (CYB-30)

- [ ] 3.1 Create `compiler/runtime/beskid/src/Runtime/Strings.bd`
- [ ] 3.2 Implement `str_new`, `str_len`, `str_eq`, `str_concat`, `str_from_i64`, `str_slice`
- [ ] 3.3 Add UTF-8 validation and bounds checking
- [ ] 3.4 Add string tests

## 4. Canonical Beskid collections (CYB-30)

- [ ] 4.1 Create `compiler/runtime/beskid/src/Runtime/Collections.bd`
- [ ] 4.2 Implement `array_new`, `array_len`
- [ ] 4.3 Implement `bytes_compare`, `bytes_copy`, `bytes_from_str`, `bytes_get`, `bytes_set`
- [ ] 4.4 Add collection tests

## 5. Canonical Beskid scheduler and fibers (CYB-31)

- [ ] 5.1 Create `compiler/runtime/beskid/src/Runtime/Scheduler.bd` and `Fiber.bd`
- [ ] 5.2 Implement fiber primitives: `fiber_spawn`, `fiber_spawn_with_cancel_slot`, `fiber_cancel`, `fiber_join_status`, `fiber_join_value`, `fiber_detach`, `fiber_yield`, `fiber_current_id`, `fiber_now_millis`, `fiber_processor_count`
- [ ] 5.3 Implement scheduler run loop with cooperative scheduling
- [ ] 5.4 Integrate with assembly context switch helpers
- [ ] 5.5 Add scheduler and fiber tests

## 6. Remaining runtime builtins (CYB-31)

- [ ] 6.1 Channels: `channel_create`, `channel_send`/`try_send`, `channel_receive`/`try_receive`, `channel_close`
- [ ] 6.2 Composition: `composition_bind_plural`, `composition_container_create`/`drop`, `composition_launch`, `composition_register`, `composition_resolve`/`resolve_plural`, `composition_scope_*`, `composition_shutdown`
- [ ] 6.3 Clocks: `clock_monotonic_nanos`, `clock_realtime_nanos`
- [ ] 6.4 Callbacks: `beskid_register_callbacks`, `install_callback_trampoline`
- [ ] 6.5 Mutex: `mutex_create`, `mutex_lock`/`try_lock`, `mutex_unlock`
- [ ] 6.6 Hub: `hub_create`, `hub_register`/`unregister`, `hub_wait_receive`/`wait_receive_index`/`wait_receive_status`/`wait_receive_value`
- [ ] 6.7 Events: `event_get_handler`, `event_len`, `event_subscribe`, `event_unsubscribe_first`
- [ ] 6.8 Dynamic: `dynamic_cast_checked`, `dynamic_cell_create`/`wrap`, `dynamic_map_aot`/`fallback`, `dynamic_object_alloc`
- [ ] 6.9 Misc: `panic`, `panic_str`, `runtime_preempt_check`, `wait_group_*`, `process_exit`, `process_getpid`, `env_*`, `fs_*`, `tty_winsize`, `test_bytes_*`

## 7. Kit build integration and verification

- [ ] 7.1 Expand `canonical_runtime_sources()` to include all new `.bd` files
- [ ] 7.2 Verify canonical runtime compiles through `TypedProgram` → `CodegenInput` → ISLE → verified CLIF
- [ ] 7.3 Verify kit build produces artifacts without Rust runtime linkage
- [ ] 7.4 Run JIT and AOT empty-prefix smokes on macOS arm64
- [ ] 7.5 Run retired-pattern and binary-provenance audits
