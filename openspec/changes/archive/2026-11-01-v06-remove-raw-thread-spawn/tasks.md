## 1. Validate
- [ ] 1.1 Validate this change with OpenSpec and confirm that no corelib, compiler, test or documentation source names `Thread.Spawn`, `Thread.Join`, `ThreadError`, `LinuxPthread` or `DarwinPthread`.
  - Remaining: OpenSpec validation passes (`openspec validate v06-remove-raw-thread-spawn --strict`), and `compiler/corelib`, the runtime and the corelib docs are clean. Six tracked stale dependency snapshots still contain the old `ThreadError.bd` and `Thread.bd` (`compiler/crates/beskid_tests_mods/fixtures/mods/sample_mod/obj/beskid/deps/**` and `compiler/crates/beskid_tests_projects/fixtures/projects/meta_manifest/{stub_meta_host,multi_member_workspace/app,multi_member_workspace/tools}/obj/beskid/deps/**`); delete or regenerate them. `compiler/crates/beskid_codegen/tests/parsed_project_isle_harness/control_flow.rs` declares its own local `LinuxPthread { sched_yield }` contract, which is test-local and not the corelib contract.

## 2. Delete
- [x] 2.1 Delete `Spawn`, `Join`, the `Thread` type, the pthread contracts and `ThreadError.bd`; keep `Yield`. Evidence: `compiler/corelib/packages/foundation/src/Core/Threading/` holds only `Thread.bd` with `Yield` calling `__thread_yield`.
- [x] 2.2 Delete the `thread_surface_imports` corelib test and update `beskid_corelib/docs/Core/Threading.md`, the concurrency README and the workspace description. Evidence: `compiler/corelib/beskid_corelib/docs/Core/Threading.md`, `compiler/corelib/packages/concurrency/README.md`, `compiler/corelib/CHANGELOG.md`; no `thread_surface_imports` remains in `compiler/corelib`.

## 3. Verify
- [ ] 3.1 Run the corelib test suite and the `beskid_abi` runtime source tests (`canonical_thread_yield_is_source_authorized_and_platform_neutral` in `compiler/crates/beskid_abi/src/runtime_source/tests.rs`).
  - Remaining: no run is recorded in the repository; needs a builder run.
