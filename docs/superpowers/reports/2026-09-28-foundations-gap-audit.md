# v0.5 Foundations gap audit — 2026-09-28

This is a source-and-evidence audit, not a declaration that unchecked tasks
are missing behavior or that passing matrices close all acceptance scenarios.
Source inspected: compiler `bdacf7fb8d74b562f1ca1b3f17b30cc48451a596`,
Corelib `a289712663c37e82b5a80d2006d86f1de43fe79e`, and the integrated
root branch. The compiler/Corelib checkout is dirty from generated v1 locks
and `obj/`, so it cannot currently produce clean release attestation.

## Confirmed gates and gaps

| Area | Current evidence | Remaining proof or decision |
| --- | --- | --- |
| OpenSpec structure, tasks 1.1/5.4 | `pnpm exec openspec validate beskid-v0-5-foundations --strict --no-interactive` exited 0, and `bun run openspec:validate` exited 0 with 218/218 items on 2026-09-28. | The current validation closes 5.4. It does not prove that 1.1 happened *before* original implementation, nor any runtime scenario. |
| Public timer and owner-routed wait, tasks 2.7/3.4/5.6/5.7/5.11 | `Core.Time.Time.bd`, `external_wait.c`, and `fiber_value_transfer.rs` contain the typed, bounded, JIT/static/shared and fatal-child test paths. | Run the named focused cases on the final exact source and retain nonzero counts and raw logs. Earlier passing workspace totals do not identify each required source route. |
| Fiber terminal payloads, task 5.12 | `Concurrency.FiberError.bd` declares the three payload-bearing variants; `Fiber.bd` reconstructs terminal errors. | `fiber_value_transfer.bd:41-66` matches `Cancelled(_, _)` without asserting nonzero fields and checks panic code/length rather than exact message after consumed storage reuse. No focused StackOverflow detail transport case was found. The task is partial, not merely untested. |
| Foundation transfer causes, task 5.13 | `foundation_io.bd:256-263` asserts `ReadExact` propagates `PeerReset`. | The `WriteAll` fixture at `foundation_io.bd:286-299` checks `NoProgress`, not preservation of a `WriteFailed(TransferFailure)` payload. A Foundation-local cause writer and second acceptance pass are needed. |
| Windows F4 routes, tasks 5.9/5.10 | The Rust harness contains Windows branches; older Windows engine runs passed. | Record nonzero per-case Windows F4-S/F4-V/F4-R/owner-transport results with the final compiler/Corelib/kit identities. Code branches and broad engine totals do not prove those exact cells. |
| Heap layout, task 6.11 | `runtime_manifest.bsol` and generated tests agree on a 328-byte `BeskidHeapState` with `current_span_by_class[14]` and mark-FIFO pointers after byte 200. | The approved [span-heap design](../specs/2026-09-22-gc-span-heap-design.md) and task 6.11 specify a 200-byte state with bulk span/mark bookkeeping out of line. The normative OpenSpec GC requirement only demands manifest/source parity, which the current test may meet. Resolve this design/task divergence explicitly; do not label it a runtime failure solely from the size difference. |
| GC source parity, task 6.2 | `beskid_abi/src/runtime_source/tests.rs:660-730` compares selected numeric source constants to manifest offsets. | The test's enumerated file list omits current `Gc/Span.bd`, `Marking.bd`, and `Verify.bd`; the task asks for every current `Gc/*.bd` plus Lifecycle. Expand the inventory and fail on a new unexamined file. |
| Root-stack exhaustion reason, task 6.16 | The runtime uses `HEAP_FAILURE_ROOT_STACK_FAILED = 4`, and `heap_growth_native.rs:335-352` expects `R4` with fatal trap code 5 and process exit 101. | The approved design's acceptance table and task 6.16 name *failure reason* 5. This is distinct from trap code 5. Decide whether to amend the design/task to R4 or change runtime/tests to R5; the normative OpenSpec only requires a distinct reason. |
| Heap negative/structural proof, tasks 6.12/6.14/6.15/6.17 | Span allocation, FIFO marking, per-span sweep, verifier and stress source paths are implemented; earlier `heap_growth_native` cases passed. | The generated size-class table script, same-span single-dequeue counter case, half-span free-slot proof, no-emitted-write-barrier golden, and deliberately corrupt mark-bit verifier rejection were not found in the current named test harnesses. These are specified proof targets, not implied by broad behavioral tests. |
| Heap executable env/cross-route proof, tasks 6.9/6.18/6.19 | Earlier heap-growth and Text/Pest Corelib logs pass named cases. | No source-SHA-bound final run for `BESKID_HEAP_MAX_BYTES=abc`, `512K`, and observable `2M`; cap/fault/stress helper paths are static AOT only. The Sep 27 logs do not identify the current candidate SHA, and the task asks for exact-source JIT/static/native kit evidence. |

The 816-byte layout in task 6.1 was an interim growable-region step and is
superseded by the later span-heap task 6.11; this audit does not ask to restore
816 bytes. The 328-versus-200 question concerns the final target.

## Evidence handling

- A fresh Linux builder snapshot was populated with `git archive` from compiler
  `bdacf7fb8d74b562f1ca1b3f17b30cc48451a596` and Corelib
  `a289712663c37e82b5a80d2006d86f1de43fe79e`. This excludes the local
  test-generated v1 lock edits and `obj/`; it is not the older, differing
  `/workspace/compiler-v05-integration-2` snapshot. On 2026-09-28,
  `cargo test -j 4 -p beskid_abi --test external_owner_transport -- --nocapture`
  passed 1/1, and `cargo test -j 4 -p beskid_engine --test fiber_value_transfer
  -- --nocapture` passed 8/8. The latter executed JIT, static, and shared
  routes, including four fatal timer-status cases per route. The emitted
  native-kit source hash was
  `81a1e6e45e7a246f5f0b7a9d4948ad95beb0e66d33c614c0b5d4be51a0be5251`.
  `external_wait_native` passed 1/1 on AOT, native-kit, and JIT callback routes,
  including its 600-case owner/winner matrix. With `--test-threads=4` as well
  as `-j 4`, `foundation_io_native` passed 26, failed 0, and ignored 6 staged
  runtime-kit executable cases. A fresh `beskid_cli runtime-kit
  build-native-host --profile debug` then produced the exact-source kit at
  `/workspace/verify/foundation-kit-bdacf7fb`; rerunning the six with
  `BESKID_RUNTIME_PREFIX` and `BESKID_RUNTIME_KIT_PROFILE=debug` passed 6/6.
  Together the two runs cover all 32 tests, with no failures. The
  `foundation_io_transfers_validate_ranges_and_handle_partial_eof_and_progress`
  case passed on JIT, AOT, and native kit, but does not assert the missing
  `WriteAll` cause payload. These passes do not close the narrower missing
  assertions identified above.
- On the same source snapshot, `cargo test -j 4 -p beskid_engine --test
  heap_growth_native -- --nocapture --test-threads=4` passed 13/13. The log
  includes JIT/AOT/native-kit growth, size-class sweep and span reuse, deep
  recursion and fiber-root cases, a diagnosable root-stack failure, and the
  cap and stress cases currently implemented. It does not settle the
  328-versus-200 layout or R4-versus-R5 design mismatch, nor prove the
  negative/structural cases absent from the current harness.
- The exact-source `beskid_abi` test
  `runtime_source::tests::heap_source_constants_match_the_manifest_heap_layouts`
  passed 1/1. This establishes parity for its enumerated files only;
  `Gc/Span.bd`, `Gc/Marking.bd`, and `Gc/Verify.bd` are not enumerated by that
  test, so the task 6.2 inventory remains open.
- Passing local macOS Rust workspace and Corelib/runtime matrices are recorded
  in [candidate readiness](2026-09-27-v05-candidate-readiness.md), with their
  actual revisions and eligibility limits. They are not substituted for the
  narrower F4/F6 scenarios above.
- The Sep 27 builder logs report passing heap and Corelib cases but contain no
  source SHA. They are useful regression evidence, not final source-bound
  release attestation for `bdacf7fb`.
- The full Foundation task list remains the acceptance inventory. Closing a
  line requires its specified behavior and named proof, not a matching source
  symbol or an aggregate pass count alone.
