## Exact-kit architecture status

**Verdict (compiler `ec164ff9`):** W3 route is **implemented and fail-closed for kit discovery**. JIT/AOT both resolve through one shared ABI path. Release is **not** exact-kit-only at execution: Engine still injects process-linked Rust soft builtins (`interop_dispatch_*`, etc.).

### Coordinate and layout

Installed kit identity is exactly:

```text
<prefix>/lib/beskid-runtime/abi-5/<triple>/<debug|release>/
  abi.json
  static/...
  shared/...
```

- Prefix: `BESKID_RUNTIME_PREFIX`, else `<exe>/../` (`installed_runtime_prefix` / `ENV_RUNTIME_PREFIX` in `beskid_abi::runtime_kit`).
- Lookup: `resolve_installed_runtime_kit(prefix, target, profile)` → optional `resolve_canonical_runtime_kit` (adds embedded corpus `source_hash` match).
- **Library form is not a lookup key.** Both static and shared (plus Windows import lib) are always required and hash-verified together via `artifact_paths_for_target`.

### Consumer split (same resolver, different artifact)

| Consumer | Resolver | Kit artifact used |
| --- | --- | --- |
| JIT (`JitRuntimeKit::load`, `BeskidJitModule::new_with_runtime_kit`) | `resolve_canonical_runtime_kit` | **shared** dylib/so/dll; `dlsym`/`GetProcAddress` for `loader_required_exports` |
| AOT (`bundled::resolve_aot_runtime_kit` → `prepare_runtime`) | same | **static** archive only (`RuntimeArtifact.staticlib_path`) |
| Tooling publish | `build_canonical_runtime_kit` / `beskid_tools::toolchain::runtime_kit::build_native_host` | both forms into empty prefix |

Shared symbols: `resolve_installed_runtime_kit`, `resolve_canonical_runtime_kit`, `build_runtime_kit`, `installed_runtime_prefix`, `exact_kit_metadata_path`.

### Validation surface (`RuntimeKitMetadata::validate` + `AbiManifestV5`)

Enforced on resolve/build:

- schema `RUNTIME_KIT_SCHEMA_VERSION == 1`, `abi_version == ABI_V5` (`BESKID_RUNTIME_ABI_VERSION = 5`)
- `TargetMetadata::validate()` against supported triples only
- embedded equality to `AbiManifestV5::canonical_runtime(target)` (layouts, traps, exports, platform imports, bootstrap/`beskid_rt_v5_trap`, etc.)
- `layout_hash` / `source_hash` SHA-256 format + contract/audit consistency
- portable relative artifact paths; exact static/shared/(import) path set per object format
- import/export/`loader_required_exports` allowlists (unique; must match `RuntimeAuditMetadata`)
- on resolve: per-artifact SHA-256 of regular files; target/profile must match request
- on canonical resolve: kit `source_hash` must equal compiler-embedded `canonical_runtime_source_hash()`

Capability/metadata for **source authority** (separate from kit file resolve): `CanonicalRuntimeProof`, `RuntimeIntrinsicCapability`, `CorelibServiceCapability` in `runtime_source.rs` (embedded Bootstrap / Foundation facades).

### JIT vs AOT and `CodegenInput`

- **Same lowering product:** both consume `CodegenArtifact` produced from `CodegenInput` → ISLE (`beskid_engine::services`, AOT `api` / prepared syntax).
- **Same kit resolver:** `resolve_canonical_runtime_kit`.
- **Different kit handle:** `JitRuntimeKit` (shared + symbol map) vs AOT `RuntimeArtifact` (static path + `export_allowlist`).
- Soft builtins (`BUILTIN_SPECS` / dispatch) are exempted from “must be kit export” in both `beskid_codegen::linking::validate` and JIT `validate_exact_symbol_references`, then **JIT supplies addresses from `beskid_runtime`** via `process_linked_soft_builtins()`.

---

## Remaining fallback routes (live vs dead)

### Dead / removed for kit discovery (asserted in code)

- Search-path / nearest-version kit fallback — documented absent (`runtime_kit.rs` L18–21).
- Profile fallback (debug↔release) — `ProfileMismatch` fails closed.
- Target fallback — `TargetMismatch` / unsupported triple fails closed.
- Prebuilt/standalone mint path for host emit — rejected in `beskid_aot::api` comments; tests assert no `libbeskid_runtime_bridge.a` archive fallback (`abi_v5_runtime_kit.rs`).
- AOT `default_runtime_strategy` / `installed_runtime_strategy` — exact prefix/target/profile only.

### Live compatibility / non-kit fallbacks (blocking W6)

| Route | Status | Location |
| --- | --- | --- |
| `process_linked_soft_builtins()` registering `beskid_runtime::interop_dispatch_*`, `panic_str`, syscalls, GC, composition, … | **LIVE** | `beskid_engine/src/jit_module.rs` |
| `is_runtime_builtin` / `is_dispatch_symbol` allowing those symbols past kit allowlist | **LIVE** | `jit_module.rs`, `beskid_codegen/src/linking/validate.rs` |
| `beskid_runtime`, `beskid_runtime_bridge`, `beskid_runtime_handlers`, `beskid_host` crates | **LIVE** (workspace members) | CYB-85 |
| `ensure-runtime-bridge.sh` | **orphaned script** (CI callers migrated; script still on disk) | `compiler/scripts/ensure-runtime-bridge.sh` |
| User `library_search_paths` / `-L` | **LIVE** but for user externs, not kit resolve | AOT linker / Engine link_libraries |
| `LinkMode::PreferDynamic` | **LIVE** but only affects host linker `-Wl,-Bdynamic` for **output** SharedLib; **does not** select kit shared artifact | `beskid_aot/src/linker.rs` |
| `canonical_corelib_syscall_service_capability` alias | harmless rename | `runtime_source.rs` |

Kit-lookup fallbacks under CYB-86 are largely already gone; what remains is **dispatch/soft-builtin reachability** and retirement of Rust runtime objects (CYB-85/86 backlog under CYB-10).

---

## Implementation and deletion order

1. **Finish W5 matrix kits** (CYB-32/33/34): debug+release static+shared (+ Windows import) with provenance, for all three triples — so kit exports can absorb soft builtins.
2. **Move soft builtins into ABI-v5 kit / Beskid runtime** (or delete language paths that need them) so JIT no longer needs `process_linked_soft_builtins`.
3. **Delete** `process_linked_soft_builtins`, process-linked `interop_dispatch_*` registration, and `is_runtime_builtin` exemptions once every referenced symbol is a kit export.
4. **CYB-85:** remove `beskid_runtime` / bridge / handlers / envelopes from production linkage; delete `ensure-runtime-bridge.sh`.
5. **CYB-86:** static inventory proving no legacy resolver/dispatch callsites; make ABI manifest sole authority.
6. Wire **AOT PreferDynamic** to kit `shared_library` if shared-linked AOT is a release requirement (today AOT always links static kit).
7. Fix Linux verify script test name (below) before claiming clean-prefix Engine/REPL proof.

Do not delete Rust runtime until Linux + macOS + Windows matrix smokes are green without process-linked symbols (CYB-85 blocked by CYB-32/33/34/66/82 per Linear).

---

## Linux proof requirements

Minimum clean-prefix Linux x86_64 proof:

1. Empty prefix → `runtime-kit build-native-host` (or matrix build).
2. Layout: `…/abi-5/x86_64-unknown-linux-gnu/{debug,release}/{abi.json,static/,shared/}`.
3. Provenance: `beskid_runtime_provenance --verify` / `--verify-shared` (as in `verify-native-runtime-kit-linux.sh`).
4. `BESKID_RUNTIME_PREFIX` + `BESKID_RUNTIME_KIT_PROFILE` → Engine + AOT + REPL ignored smokes.
5. No bridge archive; no process-linked soft builtins for release claim (currently still present — proof is only “kit loads + trivial Main”, not “kit-only”).

**Known script defect:** `verify-native-runtime-kit-linux.sh` runs  
`staged_linux_runtime_kit_executes_a_canonical_entrypoint`, but the test is named  
`staged_runtime_kit_executes_a_canonical_entrypoint` (`native_runtime_kit_smoke.rs`). Matrix script uses the correct name. Linux gate that only runs the verify script will miss Engine smoke / fail filter.

Corelib still aborts post-JIT (`SIGILL` / exit 132 on OutputWriteLine) — kit staging can pass while execution fails (`0.4-current-state.md`).

---

## Full matrix gaps

Supported host triples (`host_runtime_triple`): Linux x86_64, Darwin arm64, Windows x86_64.

| Cell | Static published | Shared published | JIT smoke (shared) | AOT smoke (static resolve) | REPL smoke | Hosted CI |
| --- | --- | --- | --- | --- | --- | --- |
| Linux debug | yes (gate staging) | yes | ignored test; verify name bug | hermetic unit + ignored staged | ignored Linux-only | rust/corelib gate stages **single** profile via `stage-native-runtime-kit.sh` |
| Linux release | via matrix script | via matrix script | matrix loop | matrix loop | not in matrix loop | **no dedicated Linux matrix job** in `compiler.yml` |
| macOS arm64 debug/release | tooling exists | tooling exists | CYB-33 In Progress | same | weak | **no** macOS kit matrix job |
| Windows x86_64 debug/release | matrix script + import libs | yes | matrix | matrix | — | `windows-runtime-kit-matrix` **needs green gate** (often skipped) |
| AOT PreferDynamic → kit `.so/.dylib/.dll` | N/A | published but **unused by AOT link** | — | **gap** | — | — |

`LinkMode` does not choose which kit library form to consume; AOT always uses static.

---

## Required tests and smoke commands

**Unit / hermetic (always):**
```bash
cargo test -p beskid_abi --test runtime_kit_resolution --test runtime_kit_build --test abi_v5_contract
cargo test -p beskid_aot --test abi_v5_runtime_kit -- --skip staged_
cargo test -p beskid_engine --test abi_v5_jit_runtime_kit
cargo test -p beskid_engine --test native_runtime_kit_smoke fresh_native_runtime_kit_executes_a_canonical_entrypoint
```

**Stage + Linux verify (after fixing test name):**
```bash
cd compiler
export BESKID_RUNTIME_PREFIX="$PWD/target/native-runtime-kit"
export BESKID_RUNTIME_KIT_PROFILE=debug
bash scripts/stage-native-runtime-kit.sh
# intended:
cargo test -p beskid_engine --test native_runtime_kit_smoke \
  staged_runtime_kit_executes_a_canonical_entrypoint -- --ignored --exact
cargo test -p beskid_repl staged_linux_runtime_kit_evaluates_a_snippet -- --ignored --exact
```

**Full host debug+release matrix:**
```bash
export BESKID_RUNTIME_PREFIX="$PWD/target/native-runtime-kit-matrix"
bash scripts/stage-native-runtime-kit-matrix.sh   # needs llvm-nm
```

**CI migration gate (bridge callers):**
```bash
bash scripts/verify-native-runtime-kit-ci.sh
```

---

## Assumptions

- “Exact kit” means prefix/target/profile + hash/manifest validation; not “zero Rust symbols in the Engine process.”
- W3 Done means discovery/validation/API cutover, not W6 deletion of soft builtins.
- Shared kit is for JIT; static for AOT until PreferDynamic is wired to kit shared.
- Only three triples are in scope; musl etc. correctly fail closed.
- Embedded Bootstrap corpus (`runtime/beskid/.../Bootstrap.bd`) is the sole publishable `source_hash` authority.

---

## Cross-scope deps

| Dep | Why |
| --- | --- |
| `beskid_codegen` `CodegenInput` / ISLE / `linking::validate` | Shared artifact + builtin exemption |
| `beskid_queries` TypedProgram / semantic contract | Facts feeding CodegenInput |
| Canonical Beskid runtime corpus + Corelib (CYB-28–31, CYB-9) | Kit contents and execution smoke |
| CYB-32/33/34 matrix | Blocks CYB-85 deletion |
| CYB-85/86 retirement | Live `interop_dispatch_*` / bridge crates |
| Clippy/compiler gate | Blocks Windows matrix job (`needs: gate`) |
| `beskid_cli` `runtime-kit` commands / `beskid_tools::toolchain::runtime_kit` | Publish path |
| OpenSpec `execution--runtime--native-runtime-kit` tasks 2.7 / 5.3 / 6.3 | Still unchecked vs Linear Done |

**Bottom line:** Exact installed-prefix discovery/validation is real and shared. The remaining ABI-v5 debt is not alternate resolvers — it is **live Rust soft-builtin attachment**, **AOT never consuming kit shared**, **incomplete three-target evidence**, and a **broken Linux verify filter name**.