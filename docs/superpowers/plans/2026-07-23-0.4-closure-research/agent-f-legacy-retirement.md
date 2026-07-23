# Agent F — Legacy retirement & provenance (read-only)

**Agent:** [Agent F](1412cd9c-8e7b-4946-b2de-c49c6521ed94)  
**Pins:** compiler tip scan — `active production=3402; deprecated fallback=40; retired dependencies=16; provenance fixtures=0` via `compiler/scripts/verify-hir-free-abi-v5.sh`.  
**Linear:** CYB-10 In Progress (blocked by CYB-9); CYB-35/36/39/67 Todo; CYB-84/85/86 Backlog; CYB-37/38 Duplicate of W6.3a/W6.4a.  
**OpenSpec:** `1.4` and all `4.*` still unchecked in `openspec/changes/hir-free-isle-abi-v5-native-runtime/tasks.md`.

---

### Deletion graph

Ordered clusters (edges = “delete only after”):

```text
[W5 kits + Beskid runtime corpus]
        CYB-32/33/34, CYB-28–31, CYB-66
                │
                ▼
① Engine soft-builtin cutover (CYB-85 / CYB-86)
        beskid_engine::jit_module process_linked_soft_builtins
        + interop_dispatch_* registration
        + is_runtime_builtin / BUILTIN_SPECS approval bypass
                │
        ├──────────────────────┐
        ▼                      ▼
② Rust runtime graph     ③ Generated soft-builtin authority
        beskid_runtime            builtins.inc.rs / ABI SYM_INTEROP_*
        beskid_runtime_handlers   runtime_bridge link_anchor.rs
        beskid_runtime_bridge
        beskid_host
        abfall + corosensei (via runtime)
                │
                ▼
④ Lowerable / legacy codegen API (CYB-36 → CYB-84)
        beskid_codegen::lowering/** (still `pub use Lowerable, lower_node, lower_program…`)
        FunctionDefIndex UnitHir path
                │
                ▼
⑤ HIR model + caches (CYB-35 → CYB-84)
        beskid_analysis/src/hir/**
        services/lower.rs, document hir_units
        queries materializer build_hir_units
        CLI doc HirVisibility
                │
                ▼
⑥ Obsolete deps / features / docs (CYB-67)
        workspace members, Cargo features, compatibility docs
                │
                ▼
⑦ Authoritative gates (CYB-39)
        zero-violation scan + per-artifact provenance in CI
                │
                ▼
⑧ W7 sign-off (CYB-11 / CYB-40)
```

**Live vs miscategorized vs docs (tip scan):**

| Cluster | Live production (real) | Miscategorized “active” | Test / fixture | Docs |
| --- | --- | --- | --- | --- |
| HIR (`~3079` hits) | ~1773 outside `hir/` + analysis/codegen callers; `beskid_analysis/src/hir/**` ~1193 is the implementation to delete | `beskid_tests` **112** hits tagged active (crate uses `src/`, not `tests/`) | 1 true `tests/` | Gate scans `*.rs` only — docs out of scope |
| Lowerable (`268`) | `beskid_codegen` ~146 + analysis HIR lowering ~115; **public re-export** in `beskid_codegen/src/lib.rs` | 2 in `beskid_tests` | 11 in `*/tests/*` | not scanned |
| Rust linkage (`41`) | **40 in `beskid_engine`** (`beskid_runtime::…`); 1 codegen comment | — | — | — |
| Deprecated fallback (`40`) | **14 true prod:** Engine `interop_dispatch_*`×8, `beskid_runtime` interop×5, `register_kernel_exports` string in `beskid_manifest` | 12 in `beskid_tests` | 2 + 12 generated (`symbols.rs`, `link_anchor.rs`, `builtins.inc.rs`) | — |
| Retired Cargo deps (`16`) | workspace member line + Engine/tests/host/bridge/handlers | crate `name =` lines inflate count | tests Cargo.toml | — |
| Canonical DISPATCH (`156`) | intentional evidence (must **not** fail gate) | — | — | — |

**Hard live edge:** Engine still process-links Rust soft builtins including all four `interop_dispatch_*` (`compiler/crates/beskid_engine/src/jit_module.rs` ~279–400). Comments state exact kits export only `beskid_rt_v5_*`; soft builtins stay in process-linked `beskid_runtime`.

**Already gone / not on AOT Cargo graph:** `UsePrebuilt`, `RuntimeLinkProfile::Minimal`, `BESKID_RUNTIME_ARCHIVE`, `bootstrap_dispatch_handlers` have **no** remaining `.rs` bodies (patterns kept as tripwires). CLI/REPL/AOT `Cargo.toml` have **no** `beskid_runtime` dep. LSP/queries source have **no** `\bHir`/`Lowerable` hits (queries still call `build_hir_units` via materializer — name doesn’t match HIR regex).

---

### Prerequisites per deletion cluster

| Cluster | Prerequisites (evidence) |
| --- | --- |
| **① Engine soft-builtins / dispatch** | Exact ABI-v5 kits supply every symbol Engine currently registers from Rust; Corelib/JIT smokes green without `is_runtime_builtin` bypass; CYB-82 claimed Done but residual registration remains — treat as W5/W6 handoff debt |
| **② Rust runtime crates** | ① done; no Engine/tests/bridge callers; OpenSpec 4.3 (Abfall/corosensei/panic/unwind out of produced programs) |
| **③ Generated soft-builtin tables** | Manifest/ISLE no longer emit `interop_dispatch_*`; regenerate `builtins.inc.rs` / ABI symbols from Beskid runtime only |
| **④ Lowerable** | No production/test construction of `Lowerable`; `FunctionDefIndex` off `UnitHir`; harness already rejects *some* public surface — crate still `pub use`s `Lowerable`/`lower_program` (delete that API) |
| **⑤ HIR** | Frontend/doc/CLI off `Hir*`; `beskid_queries` materializer not calling `build_hir_units`; analysis `services/lower.rs` / `document.rs` migrated (OpenSpec 3.1–3.2 still unchecked despite Linear W4 Done — reconcile carefully) |
| **⑥ Obsolete deps** | ②–⑤ deleted; inventory of features/docs; lockfile clean |
| **⑦ Gate authority** | Zero scan violations; real artifact provenance (not fixture round-trip); CI wiring |

**Do not start CYB-35/36 deletions** while Engine still needs Rust objects or while queries/document still materialize HIR units — scan will stay red and builds will break.

---

### Authoritative scan design

Current script strengths (`verify-hir-free-abi-v5.sh`):

- Categories for burn-down; **no production allowlist** (header + `test-verify-hir-free-abi-v5.sh`).
- Separates canonical ABI-v5 `DISPATCH_*` evidence from deprecated reachability.
- Dependency scan on `Cargo.toml` for `beskid_runtime(?:_bridge)?|beskid_host`.
- Provenance fixture self-check for three triples (currently passes — `provenance fixtures=0`).

**False negatives / broad patterns to fix under CYB-39:**

1. **Category undercount of tests:** `beskid_tests/**` and `beskid_e2e_tests/**` → treat as test-support (today: active).
2. **Implementation vs caller:** optionally report `*/hir/**` and `*/lowering/**` as `legacy-implementation` so burn-down ≠ “callers left”.
3. **Dependency regex incomplete:** misses `beskid_runtime_handlers`, `abfall`, `corosensei`, workspace `members =` false precision (one line → many crates). Prefer `cargo metadata` + explicit retired package set.
4. **Linkage scan too narrow:** only `beskid_aot|codegen|engine|cli|repl` `src/` — misses `beskid_tests`, bridge, handlers, manifest codegen emitting `register_kernel_exports`.
5. **Dead tripwires:** `UsePrebuilt` / `Minimal` / `BESKID_RUNTIME_ARCHIVE` never hit on tip → false sense of coverage for kit fallbacks; replace with live patterns (`is_runtime_builtin`, `process_linked_soft_builtins`, `beskid_runtime::`).
6. **`\bHir[A-Z]` breadth:** huge true-positive set inside HIR itself; fine for fail-closed zero target, bad as progress metric (RC note already: don’t burn down on raw DISPATCH counts).
7. **Non-`.rs` gaps:** `.isle`, generated JSON, docs, shell — out of scan; OK if policy is source+Cargo only, document that.
8. **Provenance gap (critical):** gate runs `--fixture | verify` on **synthetic allowlist text**, not `nm`/`objdump` of built `.a`/`.so`/`.dylib`/EXE/REPL/CLI. `verify_shared` / `verify_static_archive` exist in `runtime_provenance.rs` but are **not** invoked by the gate. OpenSpec requires inspecting **every produced artifact** — currently unmet. Gate is **not** in `.github/workflows` (only Docker `provenance: mode=min`).

**Proposed authoritative layers:**

1. Source retired-pattern scan (refined categories; fail closed; zero allowlist except reviewed fixtures).
2. Cargo/metadata retired-package closure.
3. Per-artifact symbol-list extract (platform adapters) → `beskid_runtime_provenance --verify` / `--verify-shared` / static-archive variant.
4. Consumer binaries: Engine, REPL, CLI, release bundles, linked app smokes — must not define/import forbidden families (`rust`, `__rust`, `abfall`, `corosensei`, `panic`, `_Unwind`, … from manifest audit JSON).

---

### Minimal reviewed fixture allowlist

OpenSpec permits fixtures only via **explicit reviewed allowlist**; script today forbids any allowlist. Recommended minimal set (review once, shrink to empty by 0.4):

| Path / pattern | Why temporary | Exit criterion |
| --- | --- | --- |
| `compiler/scripts/test-verify-hir-free-abi-v5.sh` synthetic trees under `BESKID_HIR_FREE_SCAN_ROOT` | Gate self-test only | Keep forever as negative fixtures outside prod tree |
| Negative CLIF fixtures asserting **absence** of `interop_dispatch_*` in `isle_adapter.rs` tests | Documents forbidden symbol | Keep as assertions, not allowlist of production symbols |
| Historical golden symbol-lists under `beskid_abi/tests/**` that inject `_beskid_runtime_bridge_init` / `__Unwind_Resume` to prove rejection | Test-only poison | Keep |

**Not allowlistable for release:** `builtins.inc.rs` / `SYM_INTEROP_DISPATCH_*` / `link_anchor.rs` / Engine registration / `beskid_runtime` interop — these are production debt, not fixtures.

Canonical `DISPATCH_*` / `dispatch_route_for_symbol` stay **evidence**, never allowlisted violations.

---

### Acceptance commands and release-gate integration

**Local / Linear evidence (already cited on CYB-35/39):**
```bash
bash compiler/scripts/verify-hir-free-abi-v5.sh
bash compiler/scripts/test-verify-hir-free-abi-v5.sh
bash compiler/scripts/verify-runtime-provenance.sh <symbol-list-or-->
cargo test -p beskid_abi --test runtime_provenance_audit --test runtime_provenance_cli
cargo test --workspace --all-targets
```

**Missing for OpenSpec 1.4 / 5.4 / 6.10.2 (must add under CYB-39):**
```bash
# After each kit / AOT / JIT / CLI / REPL / release-bundle build:
# 1) extract defined+undefined symbols → portable list
# 2) beskid_runtime_provenance --verify | --verify-shared as appropriate
# 3) fail if forbidden_symbol_families match or export/import drift
```

**CI:** wire `verify-hir-free-abi-v5.sh` into Compiler gate (and kit/corelib/distribute jobs that produce binaries). Today: **not wired** in `.github/workflows`.

**Checkbox policy:** do not check OpenSpec `1.4` until scan is release-blocking in CI; do not check `4.*` until deletion clusters green; `6.10.2` last.

---

### Assumptions

1. Linear W4 “Done” means entrypoint migration, not deletion — residual HIR/`Lowerable` is expected W6 debt (matches `0.4-current-state.md`).
2. CYB-37/38 Duplicate → execute via CYB-85/86 only.
3. Codex owns CYB-10 children; Cursor does not close them.
4. First Linux compile-and-run proof (CYB-32) may still use transitional soft builtins; **release** claim “canonical Beskid runtime only” cannot until ①–② delete.
5. Provenance fixture green ≠ binary clean.
6. Agent scopes A–D inferred from critical-path RCs (facts/ISLE, runtime corpus, kits/matrix, Engine/JIT execute).

---

### Cross-scope blockers from A–D

| From | Blocks W6 because |
| --- | --- |
| **A — facts / syntax-ISLE (RC1/RC4)** | Cannot prove consumers off HIR/`Lowerable` while Corelib still fails `MissingRuleOrFact` / specialization; OpenSpec `2.3`/`3.*` unchecked |
| **B — Beskid runtime corpus (RC3)** | Engine cannot drop Rust `beskid_runtime::*` until Bootstrap+ corpus exports GC/sched/syscall/composition equivalents in exact kits |
| **C — kit matrix / Linux proof (CYB-32+)** | CYB-85 blocked_by CYB-32/33/34/66; no deletion of Rust kits fallbacks until empty-prefix JIT+AOT green |
| **D — Engine/JIT execute (RC2 SIGILL)** | Soft-builtin / kit attachment bugs mean “delete `interop_dispatch_*`” without a working replacement re-breaks Corelib; need attribution before cutover |

**Inbound to F:** CYB-10 blocked_by CYB-9.  
**Outbound from F:** CYB-39 blocks CYB-40/W7 evidence.

---

### Codebase facts (evidence table)

| Fact | Evidence |
| --- | --- |
| Tip scan red | `verify-hir-free-abi-v5.sh` summary: 3402/40/16 |
| Engine wires `interop_dispatch_*` | `beskid_engine/src/jit_module.rs` |
| Retired crates still workspace members | `compiler/Cargo.toml` members + Engine/tests Cargo.toml |
| Lowerable still public | `beskid_codegen/src/lib.rs` `pub use lowering::{… Lowerable …}` |
| HIR still large | ~2405 hits in `beskid_analysis` alone |
| Provenance is fixture-only in gate | `verify_provenance_fixture` → `--fixture \| verify-runtime-provenance` |
| Forbidden families defined | ABI audit JSON includes `rust`, `abfall`, `corosensei`, `panic`, `_Unwind`, … |
| Gate not in GH Actions | `rg` over `.github/workflows` finds no hir-free script |
| OpenSpec 1.4 / 4.* open | `openspec/changes/hir-free-isle-abi-v5-native-runtime/tasks.md` |
