---
title: "Scheduling stubs (v0.1)"
description: Placeholders for future scheduling without affecting the runtime ABI in v0.1.
---

Status
- Scheduling is intentionally out of scope for v0.1. The runtime remains single-threaded.
- Two feature-gated helpers exist as stubs for future work (crate: beskid_runtime, feature: sched):
  - rt_yield(): calls std::thread::yield_now()
  - rt_now_millis(): i64 UNIX epoch milliseconds

Build
- Disabled by default. Enable with: `cargo check -p beskid_runtime --features sched`
- No ABI guarantees are made for these stubs beyond v0.1.

Notes
- Any future scheduler must align with the language spec for async/await or event loops.
- The stubs are provided to help early experiments and are not required by the compiler today.

