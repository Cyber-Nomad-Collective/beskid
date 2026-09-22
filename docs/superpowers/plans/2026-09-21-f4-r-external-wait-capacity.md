# F4-R external-wait capacity and race acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the existing single owner-scheduler external-wait service admits every legal live fiber, rejects duplicate registration, and preserves one-winner/timer generation semantics through its real Engine, static-native, and shared-native routes.

**Architecture:** Keep `runtime/beskid/src/Runtime/Fiber/Scheduler/External.bd` unchanged unless the test first exposes a concrete defect. Extend the existing `external_wait.c` conformance driver only: generated-layout-derived parked waiters plus its controller occupy the scheduler's complete live-fiber population, while the controller drives the genuine exported register, post, pump, try-complete, park, release, and cancel transitions. The existing Rust route harness continues to compile the same driver into static, shared, and JIT-callback forms.

**Tech Stack:** Beskid scheduler source, ABI-v5 runtime kits, C11/pthreads fixture, Rust `cargo test`, Engine JIT, static and shared native linking.

**Spec:** `openspec/changes/beskid-v0-5-foundations/specs/execution--runtime--fiber-scheduler-and-stacks/spec.md` (`BSP-REQ-A0D58F1B3E21`, `BSP-REQ-896BA6C917E9`, `BSP-REQ-A371B8519429`) and `openspec/changes/beskid-v0-5-foundations/specs/core-library--stability-and-api-shape--core-time/spec.md`.

## Global Constraints

- Preserve the one existing owner scheduler, inbound command queue, atomic winner, monotonic deadline heap, and register/park/release path; add no `Core.IO` or timer lifecycle path.
- Legal capacity is one active external wait per live valid fiber. Do not invent a 17th valid fiber, fake a handle, shrink a limit for tests, or turn duplicate rejection into a public capacity result.
- Use exported transitions and `ExternalPump(now)` with explicit values. Do not inspect or overwrite scheduler memory, use wall-clock sleeps to make races occur, or copy scheduler completion logic into C.
- The C driver is observation/orchestration only. Engine, static-native, and shared-native execution remain distinct acceptance routes.
- Preserve the existing wake-before/during/after-park race matrix, heap test, cancellation/I/O test, and detached-shutdown test.
- F4-W and F7 remain open: Unix-only execution is not Windows or supported-target acceptance.

## Review Focus

- A full legal population must mean every live valid fiber has exactly one wait, not 32 physical records or a fabricated next handle; Task 1 derives the controller-plus-waiter population from generated ABI layout authority.
- A duplicate must leave the original token, active count, timer state, and eventual winner unchanged; Task 1 attempts it from the owning controller before completion.
- A released record must reject old cancellation generation after the same fiber reacquires; Task 1 sends old cancellation before current readiness and proves only the current token wins.
- A timeout already claimed by `ExternalPump(deadline)` must survive later fiber cancellation before resumption; Task 2 observes the local timeout/release first and the later independent cancelled Join separately.
- Determinism applies to an explicitly ordered command queue plus a supplied `now`, not to unconstrained producer or equal-deadline heap order; Task 2 asserts command-before-deadline and membership-only equal-deadline outcomes.

---

### Task 1: Full legal admission, duplicate rejection, and generation-safe reuse

**Files:**
- Modify: `compiler/crates/beskid_engine/tests/fixtures/external_wait.c`
- Modify: `compiler/CHANGELOG.md` (only the F4-R bullet; do not stage adjacent user entries)
- Test: `compiler/crates/beskid_engine/tests/external_wait_native.rs`

**Interfaces:**
- Consumes: `fiber_spawn(void *, void *) -> int64_t`, `fiber_current_id() -> int64_t`, `beskid_rt_v5_external_wait_register(uintptr_t, uintptr_t, int64_t) -> uintptr_t`, `beskid_rt_v5_external_wait_park(uintptr_t) -> uintptr_t`, `beskid_rt_v5_external_wait_release(uintptr_t) -> uint8_t`, `beskid_rt_v5_external_wait_post(uintptr_t, uintptr_t, uintptr_t) -> uint8_t`, `beskid_rt_v5_external_pump(int64_t)`, and fixture callback `TryComplete`.
- Produces: `full_legal_capacity()` called from `RunExternalWaitFixture`; its successful return means all legal waiter fibers were admitted, duplicate registration left state unchanged, and a released generation rejected stale cancellation before the replacement completed.

- [ ] **Step 1: Add the failing full-legal-capacity driver case**

  Add fixture state for `BESKID_TEST_SCHEDULER_FIBER_CAPACITY - 1` waiter handles/tokens, a controller token, a registration count, and a waiter-release count. Derive `BESKID_TEST_SCHEDULER_FIBER_CAPACITY` only from generated ABI layout macros `BESKID_SCHEDULER_STATE_SIZE`, `BESKID_SCHEDULER_STATE_FIBERS_OFFSET`, and `BESKID_FIBER_RECORD_SIZE`; add a C11 static assertion that the derived count is at least two. Spawn that many `capacity_waiter_entry` fibers followed by one `capacity_controller_entry`; do not hard-code `FIBER_TABLE_MAX`, `15`/`16`, or spawn another fiber. Each waiter must register its own deadline-less wait, record its real handle/token, then park and release after source `EXTERNAL_READY` (`1`) wins.

  ```c
  enum {
      BESKID_TEST_SCHEDULER_FIBER_CAPACITY =
          (BESKID_SCHEDULER_STATE_SIZE - BESKID_SCHEDULER_STATE_FIBERS_OFFSET) /
          BESKID_FIBER_RECORD_SIZE,
      CAPACITY_WAITERS = BESKID_TEST_SCHEDULER_FIBER_CAPACITY - 1,
  };
  _Static_assert(BESKID_TEST_SCHEDULER_FIBER_CAPACITY >= 2,
                 "scheduler requires controller plus waiter");
  static uintptr_t capacity_tokens[CAPACITY_WAITERS];
  static int64_t capacity_handles[CAPACITY_WAITERS];
  static size_t capacity_registered, capacity_released;

  static void *capacity_waiter_entry(void *argument) {
      size_t index = capacity_registered;
      int64_t handle = fiber_current_id();
      uintptr_t token = beskid_rt_v5_external_wait_register(handle, 9, -1);
      assert(handle >= 0 && token != 0);
      capacity_handles[index] = handle;
      capacity_tokens[index] = token;
      ++capacity_registered;
      assert(beskid_rt_v5_external_wait_park(token) == 1);
      assert(beskid_rt_v5_external_wait_release(token));
      ++capacity_released;
      return argument;
  }
  ```

  Spawn every waiter with the existing rooted managed fixture `value`, never an integer-cast slot index: native fiber entry arguments are captured as managed values. The owner scheduler assigns a slot from `capacity_registered` before incrementing it, so each sequential registration records one unique observation without inventing a second C-argument ABI.

- [ ] **Step 2: Verify the new capacity case fails before its controller exists**

  Run: `cargo test -p beskid_engine --test external_wait_native -- --nocapture`

  Expected: FAIL because `RunExternalWaitFixture` calls the new full-legal-capacity case but the controller/orchestration implementation is absent; a prior race-matrix pass is not sufficient evidence.

- [ ] **Step 3: Implement owner-controller orchestration through real transitions**

  In `capacity_controller_entry`, wait only by scheduler `beskid_rt_v5_fiber_yield()` until every derived waiter registration is observed. Assert active count `CAPACITY_WAITERS`, register the controller's own deadline-bearing wait to make active count `BESKID_TEST_SCHEDULER_FIBER_CAPACITY`, then attempt a second registration with that exact controller handle and assert zero return plus unchanged active count and original token. Use a fixed future monotonic `capacity_deadline`, then call `ExternalPump(capacity_deadline)` and require the original controller token to return timeout `4`; this proves duplicate rejection did not mutate or discard the original timer state.

  Release the timed controller token, then re-register on the same still-valid controller handle; require a nonzero changed token. Submit the old token with cancellation source `3` before the new token with readiness source `1`, call `beskid_rt_v5_external_pump(-1)`, and require the old generation to be a no-op while the new token returns `1` and releases. Then post readiness for each parked waiter in a defined array order, pump once, and yield until every waiter release occurs.

  ```c
  static void *capacity_controller_entry(void *argument) {
      while (capacity_registered != CAPACITY_WAITERS) beskid_rt_v5_fiber_yield();
      assert(beskid_rt_v5_external_active_count() == CAPACITY_WAITERS);
      int64_t handle = fiber_current_id();
      int64_t deadline = clock_monotonic_nanos() + 1000000000;
      uintptr_t old = beskid_rt_v5_external_wait_register(handle, 9, deadline);
      assert(old && beskid_rt_v5_external_active_count() == BESKID_TEST_SCHEDULER_FIBER_CAPACITY);
      assert(!beskid_rt_v5_external_wait_register(handle, 9, -1));
      beskid_rt_v5_external_pump(deadline);
      assert(beskid_rt_v5_external_wait_park(old) == 4);
      assert(beskid_rt_v5_external_wait_release(old));
      uintptr_t current = beskid_rt_v5_external_wait_register(handle, 9, -1);
      assert(current && current != old);
      assert(beskid_rt_v5_external_wait_post(owner, old, 3));
      assert(beskid_rt_v5_external_wait_post(owner, current, 1));
      beskid_rt_v5_external_pump(-1);
      assert(beskid_rt_v5_external_wait_park(current) == 1);
      assert(beskid_rt_v5_external_wait_release(current));
      for (size_t i = 0; i < CAPACITY_WAITERS; ++i)
          assert(beskid_rt_v5_external_wait_post(owner, capacity_tokens[i], 1));
      beskid_rt_v5_external_pump(-1);
      while (capacity_released != CAPACITY_WAITERS) beskid_rt_v5_fiber_yield();
      assert(beskid_rt_v5_external_active_count() == 0);
      return argument;
  }
  ```

  Join the controller and all derived waiters from the host only after controller orchestration finishes. Then spawn one replacement fiber and require reuse of the consumed controller record (`(uint32_t)newHandle == (uint32_t)oldControllerHandle` and `newHandle != oldControllerHandle`). From that replacement fiber, assert `fiber_cancel(oldControllerHandle, 9)` is false, assert every stale completion source for the old controller token loses, then register/complete/release its own current token. This separates stale fiber-handle denial from same-live-fiber stale-token denial. Print one conformance line with derived capacity, actual registration count, every active-count checkpoint, old/current generations, and final active count; the line is evidence, while assertions remain the oracle.

- [ ] **Step 4: Run the full native route matrix and keep only the focused changelog entry**

  Run:

  ```sh
  cargo test -p beskid_engine --test external_wait_native -- --nocapture
  cargo test -p beskid_abi --test external_owner_transport -- --nocapture
  ```

  Expected: PASS with the same C driver succeeding in Engine forwarding callback, static-native executable, and shared-native executable; preserve the existing deadlock child assertion. Add a concise `Changed` bullet to `compiler/CHANGELOG.md` recording full legal external-wait admission, duplicate rejection, release/reuse, and stale generation evidence. Stage only that bullet if surrounding changelog text is user-owned.

- [ ] **Step 5: Commit Task 1 only**

  ```sh
  git add crates/beskid_engine/tests/fixtures/external_wait.c
  git add -p CHANGELOG.md
  git commit -m "test(runtime): prove legal external wait capacity"
  ```

### Task 2: Timer winner integrity and deterministic pump boundaries

**Files:**
- Modify: `compiler/crates/beskid_engine/tests/fixtures/external_wait.c`
- Test: `compiler/crates/beskid_engine/tests/external_wait_native.rs`

**Interfaces:**
- Consumes: Task 1's retained `complete_wait`, owner, active-count, and join helpers plus `beskid_rt_v5_external_pump(i64)` and `fiber_cancel(int64_t, int64_t)`.
- Produces: `timer_winner_before_resume()` and `pump_order_cases()` called from `RunExternalWaitFixture`; their assertions prove timeout and command ordering through the canonical winner transition.

- [ ] **Step 1: Add failing timer-winner and command-order cases**

  Add a timer waiter that records its real token/handle and parks against a fixed future monotonic deadline. Add a controller fiber that waits by `fiber_yield()` only until the waiter has registered; it must not use `sleep`, `alarm`, raw runtime state, or an unattached host thread to race the scheduler.

  Add a second case with a posted readiness command and a due timer for the same real token. Add an equal-deadline pair whose test records each returned source but deliberately does not encode a FIFO expectation.

- [ ] **Step 2: Verify the new race cases fail before owner-controller arbitration is implemented**

  Run: `cargo test -p beskid_engine --test external_wait_native -- --nocapture`

  Expected: FAIL from the newly wired but undefined stage symbols in the native fixture link. This proves that the existing AOT/native route executes the new stage calls before their controller implementation exists; a race test that merely terminates or depends on timing is not an acceptable red result.

- [ ] **Step 3: Implement deterministic owner-controller assertions**

  In the timeout case, controller calls `beskid_rt_v5_external_pump(deadline)` after the peer parks; it then calls `fiber_cancel(peer_handle, 9)` before yielding. Assert the active count is already zero and the later cancellation cannot replace timeout. Yield until the peer records local source `4` and releases its timer registration, then have the host assert the peer's later Join is cancelled and finish that error handle. This preserves the specified distinction between a timeout winner and an independently observed later fiber-cancellation outcome.

  In the command-before-deadline case, controller posts readiness source `1` for the exact token before calling `ExternalPump(deadline)` and asserts the owner-visible active count reaches zero. It then yields until the peer records/release source `1`; only then assert that outcome, while timer delivery is a losing/no-op transition. For two equal-deadline registrations, pump once, assert owner-visible active count reaches zero, yield until both peers record/release, then assert both distinct tokens completed exactly once with source `4`; treat the observed pair as a set rather than FIFO order.

  ```c
  /* Controller establishes order; ExternalPump drains commands before timers. */
  assert(beskid_rt_v5_external_wait_post(owner, command_token, 1));
  beskid_rt_v5_external_pump(command_deadline);
  assert(beskid_rt_v5_external_active_count() == 0);
  while (!command_released) beskid_rt_v5_fiber_yield();
  assert(command_outcome == 1);

  beskid_rt_v5_external_pump(timeout_deadline);
  assert(beskid_rt_v5_external_active_count() == 0);
  assert(fiber_cancel(timeout_handle, 9));
  while (!timeout_released) beskid_rt_v5_fiber_yield();
  assert(timeout_outcome == 4);
  assert(fiber_join_status(timeout_handle) == 1);
  assert(fiber_join_error_finish(timeout_handle));
  ```

  Emit route-readable observations of owner ID, generation, winner source, active count, and case name. Keep `race_matrix`, `timer_heap`, sticky-cancellation/I/O, and detached-shutdown cases intact; new helpers must reuse their existing `join_success` and `complete_wait` seams.

- [ ] **Step 4: Run acceptance and regression evidence**

  Run:

  ```sh
  cargo test -p beskid_engine --test external_wait_native -- --nocapture
  cargo test -p beskid_abi --test external_owner_transport -- --nocapture
  cargo test -p beskid_engine --test fiber_value_transfer source_timer_sleep_has_typed_outcomes_and_owned_registration -- --nocapture
  ```

  Expected: PASS. Record target triple, runtime-kit source hash, static/shared artifact identities, and nonzero case counts in the task report. Do not claim Windows, Linux, or F7 closure from this macOS run.

- [ ] **Step 5: Commit Task 2 only**

  ```sh
  git add crates/beskid_engine/tests/fixtures/external_wait.c
  git commit -m "test(runtime): prove timer winner ordering"
  ```

## Self-review

- **Spec coverage:** Task 1 covers `BSP-REQ-A0D58F1B3E21` and the release/stale portion of `BSP-REQ-896BA6C917E9`; Task 2 covers timeout/cancellation and command/timer contenders under `BSP-REQ-896BA6C917E9` and `BSP-REQ-A371B8519429`, including the independent later cancelled Join permitted by the Core.Time contract. Existing race, detached-shutdown, and owner transport evidence remains required and is explicitly retained.
- **Placeholder scan:** No task asks an implementer to choose an unspecified capacity, fabricate a handle, or invent an ordering; every controller transition and expected source is named.
- **Type consistency:** C uses the ABI header's existing `uintptr_t` token and source conventions; `TryComplete` remains the fixture callback already exercised in Engine, static, and shared routes.
- **Review focus:** Each listed failure mode has a named assertion in its owning task; equal deadlines intentionally prove membership only because no FIFO rule is normative.

## Execution Handoff

Plan saved at `docs/superpowers/plans/2026-09-21-f4-r-external-wait-capacity.md`. The user has already chosen subagent-driven execution and authorized implementation. Execute Task 1 with a fresh implementer and reviewer before Task 2; finish with a fresh whole-branch review. F4-W, Linux, and F7 remain separate follow-on work.
