## 1. Validate

- [ ] 1.1 Validate this change with `openspec validate v06-runtime-limits --strict` and regenerate `openspec/catalog.json`.

## 2. Introduce

- [x] 2.1 Add growable vector, FIFO ring and chunked record table helpers to `Runtime/Fiber/Scheduler/Storage.bd`; subsystem tables become chunked tables created on first use.
- [x] 2.2 Make the fiber table, run queue and pending spawn/cancel/wake lists growable; add `fiber_stack_max` to the scheduler header; move the no-fiber sentinel outside the 32-bit slot range.
- [x] 2.3 Make channels, mutexes, wait groups and hubs chunked records with FIFO waiter vectors; hub registrations grow on demand.
- [x] 2.4 Make poll tasks, monitors, links and the ready queue growable; make external waits and timers growable.
- [x] 2.5 Size composition slots to the plan and grow owned values on demand.
- [x] 2.6 Remove the fixed heap cap; read `BESKID_HEAP_MAX` and `BESKID_FIBER_STACK_MAX` in `ProcessInit`; delete the host-side `BESKID_HEAP_MAX_BYTES` parser.
- [x] 2.7 Update `runtime_manifest.bsol` layouts; make `write_v5_artifacts` refresh the `AbiValue.bd` prelude; regenerate the ABI on the builder.
- [x] 2.8 Tests: 10,000-fiber chains (engine fixture and Corelib suite), 1,000 channels/mutexes/wait groups and a 1,000-member hub (Corelib suite), `BESKID_HEAP_MAX` and `BESKID_FIBER_STACK_MAX` acceptance and rejection, opt-in allocation beyond 1 GiB.

## 3. Verify

- [ ] 3.1 Run `cargo test --locked -p beskid_manifest -p beskid_abi -p beskid_engine` on the builder with the rebuilt kit.
- [ ] 3.2 Run the Corelib `ConcurrencySuite` and `Network*` targets with the rebuilt CLI.
