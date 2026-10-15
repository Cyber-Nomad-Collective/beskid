## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v06-runtime-fail-fast --strict` and regenerate `openspec/catalog.json` when the change is applied.

## 2. Introduce

- [x] 2.1 Add `RequireLiveManagedReference` and `TrapManagedOperandNotLive` to `Runtime/Mem/Gc/RootsHandles.bd`. The diagnostic is written from packed ASCII words into system memory, because a managed string cannot be allocated while the runtime reports a heap violation.
- [x] 2.2 Make `gc_root_handle` and `beskid_rt_v5_gc_try_root_handle` trap on a non-null reference that is not live. They return 0 only for null, a missing heap, or a failed handle admission.
- [x] 2.3 Check every non-null operand of `str_len`, `str_eq`, `str_cmp`, `str_concat` and `str_slice` before the first read.
- [x] 2.4 Check both handles of `Utf8RecordAdopt` and the payload of `beskid_rt_v5_abi_value_initialize`.
- [x] 2.5 Test: `compiler/crates/beskid_engine/tests/native_kit/use_after_collection_native.rs` frees one operand per service with `gc_collect` in `tests/fixtures/use_after_collection.c`, requires exit status 101 and the exact diagnostic in the static and the shared runtime library, and requires a rooted control run to succeed.

## 3. Verify

- [ ] 3.1 Run `cargo test --locked -p beskid_engine --test native_kit use_after_collection` on the baseline runtime (expected failure: the services return a substitute) and with this change (expected pass).
- [ ] 3.2 Run the affected crates, `beskid_tests_projects`, the Corelib tests (33/33), the Serialization Mod tests, `runtime_semantics` (9/9), and the interop suite against a release-shaped prefix.
