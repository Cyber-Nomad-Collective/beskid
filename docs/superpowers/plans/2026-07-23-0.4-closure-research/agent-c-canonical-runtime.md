# Agent C — Canonical runtime research (Beskid 0.4)

**Verdict:** Canonical Beskid runtime is a single-file Bootstrap corpus. Lifecycle/TLS/root frames/managed-object allocate compile through `TypedProgram → CodegenInput → ISLE → verified CLIF` and stage into ABI-v5 kits, but GC/strings/scheduler/composition/clocks/callbacks still live as process-linked Rust soft builtins. OpenSpec “complete corpus” (2.6 / 6.8.1) is not met.

---

## Inventory: Beskid-source runtime

| Path | Role |
| --- | --- |
| `/Users/mikserek/Projects/beskid/compiler/runtime/beskid/beskid-runtime-native.bproj` | Sole canonical package (`beskid-runtime-native` 0.4.0) |
| `/Users/mikserek/Projects/beskid/compiler/runtime/beskid/src/Runtime/Bootstrap.bd` | **Only** Beskid runtime source (~495 LOC); all ABI-v5 C exports |
| `/Users/mikserek/Projects/beskid/compiler/runtime_manifest.bsol` | ABI-v5 SOT (exports, layouts, traps, intrinsics, platform imports, assembly) |
| `/Users/mikserek/Projects/beskid/compiler/crates/beskid_abi/assembly/<triple>/` | Approved OS adapters: `context.S`/`context.asm`, `platform.S`/`platform.asm`, `platform_tls.c` |
| `/Users/mikserek/Projects/beskid/compiler/corelib/packages/runtime/src/Runtime/*` | **Not** canonical ABI-v5 corpus — ABI-v4 tags / no-op `RegisterHandlers` |

`canonical_runtime_sources()` embeds exactly one unit: `src/Runtime/Bootstrap.bd`  
(`/Users/mikserek/Projects/beskid/compiler/crates/beskid_abi/src/runtime_source.rs`).

**Bootstrap-owned ABI-v5 exports:**  
`abi_version`, `library_attach/detach`, `process_init/shutdown`, `thread_attach/detach`, `managed_object_allocate`, `closure_environment_allocate/capture_store/root/root_current`, `fiber_spawn_with_cancel_slot` (**stub: clears cancel slot, returns 0**), `trap`.

---

## Completed vs missing capabilities

| Capability | Status | Evidence |
| --- | --- | --- |
| Lifecycle (process/library attach) | **PARTIAL** | Bootstrap stamps `abi_version`, attach/detach; no heap/scheduler install |
| Traps | **PARTIAL** | Export + `trap(...)` intrinsic wrapper; trap codes in manifest; delivery via platform/intrinsic path — not a full diagnostic policy module |
| TLS | **PARTIAL** | `BeskidTlsState` alloc/install/detach in Bootstrap; `tls_get`/`tls_set` in `platform_tls.c` |
| Allocation (system) | **PARTIAL** | `SystemAllocate`/`SystemFree` → `system_allocate`/`system_free` in `platform.S` (mmap/munmap) |
| Managed object allocate | **PARTIAL** | Descriptor validate + header stamp + zero-fill; no free-list/heap accounting |
| Roots / LIFO frames | **PARTIAL** | Push/pop/root-slot helpers; no collector traversal |
| Write barriers | **MISSING** (Beskid) / **RUST-LIVE** | Rust `gc_write_barrier` in Engine soft builtins |
| Mark/sweep GC | **MISSING** (Beskid) / **RUST-LIVE** | Abfall heap in `beskid_runtime`; Bootstrap explicitly has no `CollectGarbage`/`Sweep` |
| Strings | **MISSING** (Beskid) / **RUST-LIVE** | `str_*` in Rust builtins; Corelib handlers still ABI-v4 shaped |
| Collections | **MISSING** (Beskid) / **RUST-LIVE** | `array_*`, channels, etc. in Rust |
| Scheduler / concurrency | **STUB** / **RUST-LIVE** | Fiber export stubs; real fibers/channels/mutex/wait_group in Rust; CYB-126 Done for symbol surface only |
| Clocks | **MISSING** / **RUST-LIVE** | `fiber_now_millis` etc. in Rust |
| Callbacks | **MISSING** / **RUST-LIVE** | `beskid_register_callbacks`, events in Rust |
| Composition | **MISSING** / **RUST-LIVE** | Full `composition_*` set registered on JIT |
| OS adapters (approved) | **PARTIAL-DONE** | Three-target assembly+TLS; platform imports `_exit`/`mmap`/`munmap`/`write` (Linux/Darwin) + Win32 equivalents |
| Context switch assembly | **DONE** | Only `beskid_arch_v5_context_init` / `beskid_arch_v5_context_switch` |

**Linear vs source reality:** CYB-28 remains **Todo** even though much of W5.1 surface exists in Bootstrap — acceptance (“no Rust host/bridge object required”) fails because Engine still process-links `beskid_runtime`.

---

## Exact source and ABI gaps

### Source gaps (need new `.bd` modules under `compiler/runtime/beskid/`)

1. **Heap / GC** — mark worklist, sweep/free-list, barriers, OOM→trap (`out_of_memory`), heap pointer in `BeskidRuntimeState.heap` (layout exists; unused).
2. **Strings / collections** — ABI layouts for string/array handles not exported as Beskid modules; still Rust + corelib v4 tags (`corelib/.../Runtime/Abi.bd`).
3. **Scheduler** — real fiber spawn using `beskid_arch_v5_context_*`; Bootstrap stub cannot run work.
4. **Composition / clocks / callbacks** — no Beskid modules; all soft builtins.
5. **Trap body** — Bootstrap only forwards; platform must own write+`_exit(101)` completeness (verify per-target objects).

### ABI / linkage gaps

| Gap | Path |
| --- | --- |
| Soft builtins vs kit allowlist | Kit exports only `beskid_rt_v5_*`; JIT still registers ~38 Rust symbols in `beskid_engine/src/jit_module.rs` (`process_linked_soft_builtins`) |
| Live Rust crates | `beskid_runtime`, `beskid_runtime_bridge`, `beskid_runtime_handlers`, `beskid_host` |
| Builtin symbols still generated | `beskid_analysis/.../builtins.inc.rs` (`interop_dispatch_*`, `gc_*`, `fiber_spawn`, …) |
| Fiber spawn semantics | Manifest export exists; implementation is no-op (`return 0`) — CYB-126 closed symbol/routing, not scheduler |
| Manifest layouts unused by Beskid code | `BeskidRuntimeState.heap/handles/scheduler`, arch contexts — reserved for future modules |
| Corelib “runtime” package | Legacy ABI-v4; must not be mistaken for canonical corpus |

### Intrinsic ownership split (intentional)

| Kind | Owner |
| --- | --- |
| `pointer_add`, `raw_*`, `memory_*`, word casts | Compiler/ISLE (e.g. `emit_memory_set` in `beskid_isle`) |
| `system_allocate` / `system_free` | Target `platform.S` / `.asm` |
| `tls_get` / `tls_set` | Target `platform_tls.c` |
| Context init/switch | Target `context.S` / `.asm` only |

---

## Dependency graph

```text
runtime_manifest.bsol
        │
        ├─► beskid_manifest / beskid_abi (generated abi-v5.json, audits, kit metadata)
        │
        ├─► Bootstrap.bd ──► TypedProgram (capability) ──► CodegenInput ──► ISLE ──► verified CLIF
        │                         │
        │                         └─► beskid_aot::emit_host_platform_library_pair
        │                                   + context + platform objects
        │                                   └─► ABI-v5 kit under lib/beskid-runtime/abi-5/...
        │
        └─► (still parallel) beskid_runtime (+ bridge/host/handlers)
                    ▲
                    └── beskid_engine JIT soft-builtin registration
                            blocks W6 provenance / “canonical only”

Corelib smoke path (cross-scope):
  Foundation Output/Syscall ──► syntax ISLE (Agent A) ──► JIT execute (Agent D)
       │                              │
       └── needs strings/alloc correctness (Agent B aggregates) + kit attach
```

**Issue DAG (runtime-owned):**  
CYB-28 → CYB-29 → CYB-30 / CYB-31 → CYB-32 (Linux kits) → CYB-33/34 → CYB-66; CYB-10 blocks on retirement after consumers leave Rust.

---

## ISLE / kit compile evidence

| Claim | Evidence | Result |
| --- | --- | --- |
| Bootstrap through production path | `parsed_project_isle_harness.rs::canonical_runtime_production_path_lowers_trusted_intrinsics_to_verified_clif` | **PASS** (unit) |
| Kit build uses that path | `beskid_aot/src/api.rs::emit_host_platform_library_pair` → `lower_canonical_runtime_prepared_syntax` | **Implemented** |
| CI stages kit | Corelib gate report `29977866969`: stage native runtime kit **PASS** (3 files, 96K) | **PASS** |
| Hosted execute | Same report: `clif.end outcome=ok` then **SIGILL / exit 132** on `output_writeline_smoke` | **FAIL** |
| Sole production runtime | Engine still links Rust soft builtins; OpenSpec 2.6 / 6.8.1 / 6.8.2 unchecked | **Not met** |

Corpus size: `canonical_runtime_sources().len() == 1` (asserted in `canonical_runtime_sources.rs`).

---

## Recommended implementation slices

1. **Close CYB-28 acceptance gaps without expanding corpus** — lifecycle/trap/TLS capability tests; prove kit-only load for those symbols; document remaining soft builtins as explicit debt (do not claim Done while `jit_module` registers Rust).
2. **Minimal Linux smoke corpus (after A/D unblock)** — only what `Core.Output` / hello needs: trap+write path stable, managed alloc + roots already present; avoid full GC until smoke demands it.
3. **CYB-29 heap/GC** — mark/sweep + barriers; migrate `gc_*` off soft builtins.
4. **CYB-30 strings/collections** — replace Rust `str_*`/`array_*`; wire Corelib service authority.
5. **CYB-31 scheduler** — replace fiber stub with context-switch queue; migrate composition/clocks/callbacks last.
6. **Matrix** — CYB-32 first (Linux debug+release static/shared); then 33/34.

---

## Tests to write first

| Suite | First fixtures |
| --- | --- |
| Capability / lifecycle | ProcessInit does **not** `tls_set(runtime)`; ThreadAttach allocates 32-byte TLS; detach free; out-of-order pop fails closed |
| Trap | Each trap code → exit 101 + diagnostic; untrusted package denied `trap` intrinsic |
| Alloc / roots | Descriptor mismatch → null; pointer-map overflow guards; Push/Pop LIFO; root_current without TLS fails |
| GC (after CYB-29) | Reachability, cycle retention, barrier on store, collect under root pressure, OOM→`out_of_memory` |
| Scheduler | Zero-capture spawn actually runs entry (today stub returns 0); cancel slot; no `interop_dispatch_*` in CLIF |
| Collections | Bounds trap; growth under GC pressure; string eq → ABI `str_eq` without Rust |
| Kit provenance | Soft-builtin symbols **absent** from kit; audit fails if Rust object linked |

Existing anchors: `beskid_abi/tests/canonical_runtime_sources.rs`, `runtime_bootstrap_contract.rs`, `runtime_kit_*.rs`, Engine `native_runtime_kit_smoke.rs` / `abi_v5_jit_runtime_kit.rs`.

---

## Linux-first critical path → cross-target

Aligned with `0.4-critical-path.md`:

1. Agent A: Corelib syntax-ISLE (`MissingRuleOrFact` on TestDefinition/Block/Output) — CYB-132/133.
2. Agent B: generic/aggregate ABI specialization / string handles — CYB-140/134/156–159.
3. Agent D: post-JIT SIGILL on OutputWriteLine + kit attachment — RC2.
4. **Agent C consume:** one empty-prefix Linux JIT+AOT smoke on staged kit (CYB-32 cell).
5. Expand Bootstrap only as smoke requires (CYB-28→29→30…).
6. Then macOS (CYB-33; note CYB-129 fiber SIGILL) and Windows (CYB-34 / COFF import lib).
7. CYB-66 consumer cutover; CYB-10 delete Rust runtime.

**Minimum Linux compile-and-run corpus:**  
`Bootstrap.bd` + Linux platform/TLS/context objects + Foundation `Core/Output` (+ Syscall) — **not** full GC/scheduler/collections. Kit already stages; execute is the gap.

---

## Assumptions

1. “Canonical runtime” means only `compiler/runtime/beskid/**` + manifest-approved assembly, not `corelib/packages/runtime`.
2. Compiler-lowered memory/pointer intrinsics count as approved, not “Rust runtime.”
3. CYB-28 stays open until Rust soft builtins are unnecessary for acceptance, even if Bootstrap text looks feature-complete for lifecycle.
4. Fiber export stub does **not** satisfy W5.4 scheduler acceptance.
5. Corelib CI SIGILL is primarily Engine/codegen/kit-call (Agent D), not missing Bootstrap source for Output.

---

## Cross-scope deps (A / B / D)

| Agent | Dependency on C | C blocked by |
| --- | --- | --- |
| **A** (syntax ISLE / Corelib facts) | Needs stable runtime symbols for Output/Syscall lowerings | C needs A before Corelib-shaped smoke programs lower |
| **B** (generic/enum/aggregate ABI) | Managed alloc + future GC consume correct layouts/handles | Huge alloc / string corruption (CYB-134/156) pollutes runtime blame |
| **D** (JIT/SIGILL / kit attach) | Needs correct kit exports + no illegal trampoline into Rust | C cannot claim Linux proof until D’s execute is green |

**RC3 (this agent):** Bootstrap-thin + live Rust — ownership CYB-28–31.  
**Do not expand** full GC/scheduler corpus until Linux smoke executes; expand only as demanded by that program.