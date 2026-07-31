# Corelib Test Matrix — Current State

> Research date: 2026-07-31
> Compiler tip: `compiler/` submodule with uncommitted local changes (does not build)
> Last CI evidence: 2026-07-23, Actions run [29977866969](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866969), exit **132**

---

## Canonical Gate Commands

### Primary: Native corelib gate (CI + local)

```bash
# Full gate (quality checks + build + test), from superrepo root:
CORELIB_REPORT_DIR=tmp bash scripts/ci/corelib-gate.sh
```

This runs quality validation on the corelib workspace/manifests, builds `beskid_cli` release, stages a native ABI-v5 runtime kit, then executes:

```bash
./target/release/beskid_cli test \
  --project corelib/beskid_corelib/tests/corelib_tests \
  --all-targets \
  --plain
```

### Local fast path (justfile)

```bash
# From compiler/ workspace root:
just corelib
```

Equivalent to:
```bash
cargo build -p beskid_cli --release --quiet
./target/release/beskid_cli test \
  --project corelib/beskid_corelib/tests/corelib_tests \
  --all-targets
```

### Compiler-internal spine gates (Rust-level, mostly ignored)

```bash
# Typecheck matrix (all 61 entries, one shared Salsa session):
cargo test -p beskid_tests corelib_tests_front_end_typechecks_matrix -- --nocapture --test-threads=1

# Fast smoke (5 entries):
BESKID_CORELIB_SPINE_SMOKE=1 cargo test -p beskid_tests corelib_tests_front_end_typechecks_matrix -- --nocapture --test-threads=1

# Codegen spine (14 selected entries):
cargo test -p beskid_tests corelib_tests_codegen -- --nocapture --test-threads=1

# Skip spine gates entirely:
BESKID_SKIP_CORELIB_SPINE=1 cargo test -p beskid_tests
```

### Single-target bisect

```bash
./target/release/beskid_cli test \
  --project corelib_tests.bproj \
  --target SystemSyscallWriteTests \
  --plain
```

---

## Test Matrix Structure

The test suite lives in `compiler/corelib/beskid_corelib/tests/corelib_tests/` and is split across two gating layers:

| Layer | File | Count | Status |
|---|---|---|---|
| **Production** (`beskid_cli test`) | `corelib_tests.bproj` | **61 targets** | Runs in CI; last observed exiting 132 (SIGILL) |
| **Spine typecheck** (Rust) | `corelib_spine_catalog.rs` | **61 entries** | `#[ignore]` — "blocked by syntax-ISLE gaps" |
| **Spine codegen** (Rust) | `corelib_tests_codegen.rs` | **14 entries** | `#[ignore]` — same reason |

### Target counts by package/domain

| Domain | File prefix | Targets |
|---|---|---|
| **System** (I/O, FS, time, paths) | `system/` | 8 |
| **Console** (ANSI, formatting, controls) | `console/` | 17 |
| **Core** (Results, Optional, Bytes, Encoding, Math, Random, Args, ExpressionBody) | `core/` | 8 |
| **Collections** (Array, List, Map, Set, Queue, Stack, Tier1, Collections) | `collections/` | 8 |
| **Concurrency** (Channel, Mutex, WaitGroup, Fiber, Clock, Hub, Status) | `concurrency/` | 7 |
| **Text** (Cursor, Parser, Regex, Casing, Combinator, Pest) | `text/` | 8 |
| **Query** | `query/` | 1 |
| **Compiler SDK** (Surface, Emitter) | `compiler-sdk/` | 2 |
| **Total** | | **61** |

### Codegen spine entries (14 selected)

The 14 codegen spine tests cover representative entrypoints across the matrix, from `corelib_tests_codegen.rs`:

1. `syscall_result_predicates_have_call_derived_pointer_specializations` — SyscallWriteTests
2. `channel_module_import_smoke_lowers_to_clif` — ChannelApiTests
3. `style_chain_bold_wraps_lowers` — AnsiStyleChainTests
4. `strip_bold_plain_lowers` — FormatMarkdownTests
5. `parse_env_columns_lowers` — TerminalPlatformTests
6. `messages_channel_factory_lowers` — ConsoleMessageChannelTests
7. `panel_ascii_frame_lowers` — ControlsPanelTests
8. `system_error_writeline_smoke_lowers` — ErrorWriteTests
9. `system_input_read_smoke_lowers` — InputReadTests
10. `vertical_stack_render_lowers` — ControlsLayoutTests
11. `hub_register_accepts_channel_lowers` — HubRegisterTests
12. `slice_returns_substring_lowers` — FormatScanTests
13. `text_cursor_from_starts_at_zero_lowers` — TextCursorTests
14. `text_parser_literal_matches_prefix_lowers` — TextParserTests

All 14 are `#[ignore]` — same diagnostics as the typecheck matrix.

---

## Last Known CI Results (2026-07-23)

From [corelib-build-report-29977866969.md](../../docs/superpowers/plans/2026-07-23-0.4-closure-research/corelib-build-report-29977866969.md):

| Phase | Result | Duration |
|---|---|---|
| resolve Corelib workspace | PASS | 0s |
| quality checks | PASS | 0s |
| resolve Corelib test inputs | PASS | 0s |
| build beskid_cli (release) | PASS | 147s |
| stage native runtime kit | PASS | 33s |
| run Corelib tests | **FAIL (exit 132)** | 2s |

### Suite-level outcomes (before SIGILL crash)

| Suite | Outcome |
|---|---|
| `SystemSyscallWriteTests` | 3 FAIL — `MissingRuleOrFact` on `TestDefinition` |
| `SystemSyscallApiTests` | 2 FAIL — `MissingRuleOrFact` on `Syscall.Read` `Block@91` |
| `SystemSyscallErgonomicsTests` | 3 FAIL — `MissingRuleOrFact` on `TestDefinition` |
| `SystemOutputWriteLineTests` | CLIF generation OK (9 functions) → Finalize JIT → **SIGILL / core dump** (process killed) |
| **Remaining 57 targets** | Never executed |

**Summary**: 4 of 61 targets attempted, 0 passed, 4 failed (3 on ISLE gaps, 1 on JIT crash). Known passing baseline at that point: **effectively 0/61 at the JIT level**, though the front-end typecheck matrix may have higher pass rates (the spine tests are ignored so no hard data).

---

## Known Failure Categories

### P0: ISLE gaps on Corelib Syscall surfaces (C1)

- **Symptom**: `isle.missing emit_item_statement` → `Lowering(MissingRuleOrFact … TestDefinition@…)`
- **Affected**: All Syscall write/read/ergonomics targets (~8 named fails); likely dozens more once gate runs further
- **Owner**: Compiler crates — `beskid_isle` item/statement selection + `beskid_codegen` SyntaxNodeFacts + enum-match facts (`beskid_queries`)
- **Tracking**: CYB-137 (discard-payload matches), parent CYB-133

### P0: Post-JIT native abort (SIGILL/exit 132) (C2)

- **Symptom**: `clif.end outcome=ok` (9 functions), Finalize JIT, then `Illegal instruction` / core dump
- **Affected**: Any Corelib test that reaches JIT execution after successful CLIF generation — blocks whole matrix
- **Owner**: `beskid_engine` JIT finalize/execute + ABI-v5 kit symbols + Output→Syscall call ABI
- **Tracking**: No dedicated Linear issue; needs new tracking under CYB-9

### P1: Latent ANSI/string/generic ABI issues (C3)

- **Symptom**: Not yet observed (SIGILL kills process first). Historical: allocation overflow, null string handle, `no call-derived ABI specialization`
- **Affected**: Console/ANSI/progress-bar modules; large secondary Corelib surface
- **Tracking**: CYB-134 (allocation overflow), CYB-138, CYB-156/157/158/159, CYB-140/162/163

### Ongoing work

| Task | Status | Notes |
|---|---|---|
| `corelib-matrix-green` (42/42 → 61/61) | Substantially complete | "Baseline no longer 5/42 — corelib gate substantially green"; expanded to 61 targets since original 42 |
| `compiler-resolve-codegen-waves` | In Progress | Wave 1–2 Done (enum/generics/Capabilities); remaining: Ansi.Sgr codegen, CLIF gate expansion |
| `corelib-collections-storage-wiring` | Backlog | Blocked on matrix green |
| `corelib-system-fs-host-backed` | Backlog | Blocked on matrix green + collections wiring |
| `corelib-harness-perf` (`<5min` target) | In Progress | Single `--all-targets` CI run landed; sub-5min target blocked on matrix green |
| `corelib-stub-replacement` | In Progress | Intentionally count-only stubs until matrix green exits |

---

## Historical Context: 42/42 → 61

The original v0.4 goal was **42/42** targets for the corelib matrix (tracked in `corelib-matrix-green` task with title "Corelib test matrix green (42/42 just corelib)"). Since then the test suite expanded to **61 targets** in `corelib_tests.bproj`. The CHANGELOG (Unreleased section) references "the 61-entry typecheck matrix and 14-entry codegen spine".

The 42/42 baseline referenced in the tracker (June 2026) described a state where only 5 of 42 targets passed. Since then, compiler waves W0–W6 completed (HIR-free ISLE lowering, canonical ABI-v5 runtime, ABI-v5 kits, HIR retirement), bringing the gate to "substantially green" — though remaining ISLE gaps (LambdaExpression CYB-173, TryExpression desugaring CYB-174, macOS/Windows kit smokes CYB-170/171) prevent full closure.

---

## Dashboard / Report URLs

| Resource | URL |
|---|---|
| Corelib CI workflow (latest) | [`.github/workflows/corelib.yml`](../../.github/workflows/corelib.yml) |
| Last known CI report | [Actions run 29977866969](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866969) |
| Last known report artifact | `corelib-build-report-29977866969.md` (14-day retention; artifact [29977866969](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866969)) |
| CHANGELOG (corelib entries) | [`CHANGELOG.md`](../../CHANGELOG.md) — Unreleased section |
| Compiler CHANGELOG | [`compiler/CHANGELOG.md`](../../compiler/CHANGELOG.md) — Unreleased section |
| v0.4 closure research | [`docs/superpowers/plans/2026-07-23-0.4-closure-research/`](../../docs/superpowers/plans/2026-07-23-0.4-closure-research/) |

---

## Key Files

| File | Role |
|---|---|
| `compiler/justfile` | `just corelib` target definition |
| `compiler/corelib/beskid_corelib/tests/corelib_tests/corelib_tests.bproj` | 61-test-target manifest |
| `scripts/ci/corelib-gate.sh` | CI gate script (quality + build + kit + test) |
| `.github/workflows/corelib.yml` | CI workflow definition |
| `compiler/crates/beskid_tests/src/spine/corelib_spine_catalog.rs` | 61-entry typecheck catalog + 5-entry smoke subset |
| `compiler/crates/beskid_tests/src/spine/corelib_tests_typecheck.rs` | Rust-level typecheck matrix (all `#[ignore]`d) |
| `compiler/crates/beskid_tests/src/spine/corelib_tests_codegen.rs` | Rust-level codegen spine (14 entries, all `#[ignore]`d) |
| `compiler/crates/beskid_tests/src/spine/corelib_spine_harness.rs` | Shared spine harness (timeouts, env filtering) |
| `beskid_tracker/data/v0.4/tasks/corelib-matrix-green.json` | Tracker task: "Corelib test matrix green (42/42)" |
| `beskid_tracker/data/v0.4/tasks/compiler-resolve-codegen-waves.json` | Tracker task: current ISLE/resolve work |

---

## Reproduction Notes

The current local compiler tip does not build (`beskid_queries` compilation error: `flatten_member_as_path_declaration` not found) due to uncommitted changes in the `compiler/` submodule. The pre-built `target/release/beskid_cli` binary exists but cannot run because:

1. It requires an installed ABI-v5 prefix (`<prefix>/bin/beskid_cli`), not a bare `target/release/` binary
2. The staged runtime kit (`target/native-runtime-kit/`) is stale and fails ABI validation

To reproduce locally on a clean checkout:

```bash
# From superrepo root:
cd compiler
just corelib
# Or with explicit env:
BESKID_RUNTIME_PREFIX=target/native-runtime-kit \
  cargo run --release -p beskid_cli -- test \
  --project corelib/beskid_corelib/tests/corelib_tests \
  --all-targets --plain
```
