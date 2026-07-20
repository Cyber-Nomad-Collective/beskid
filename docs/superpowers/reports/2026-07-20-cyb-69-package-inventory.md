# CYB-69 — Package and installed-prefix inventory (W7.C2)

Evidence-only inventory for parent CYB-41. No repairs, builds, allowlist edits, or runtime-behavior changes were performed.

## Revisions

| Item | Value |
| --- | --- |
| Inventory date (UTC) | 2026-07-20T10:37:07Z |
| Host | Darwin arm64 (`mac-d.local`, kernel 25.5.0) |
| Worktree | `/Users/mikserek/Projects/beskid/.worktrees/cyb-69` |
| Branch | `cursor/cyb-69-w7c-evidence` |
| Superproject (root) SHA | `9f1d88fd86fdff2ccb6d14dc2e2c687bc8b06f7f` |
| Compiler SHA | `79eccbd9fa8dd975b8ed6dfcfb6056eb1894efef` (`79eccbd`) |
| Guidance | `docs/superpowers/reports/2026-07-20-0.4-readiness-baseline.md`, `docs/superpowers/plans/2026-07-14-0.4-release-closure.md`, `compiler/docs/abi-v5-native-runtime-kit-ci.md` |

Logs: [`cyb-69-logs/`](./cyb-69-logs/).

## Expected release matrix

Per `compiler/docs/abi-v5-native-runtime-kit-ci.md` and `compiler/runtime_manifest.bsol`, release evidence requires static **and** shared kits for each of:

- Targets: `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, `x86_64-pc-windows-msvc`
- Profiles: `debug`, `release`

Layout: `lib/beskid-runtime/abi-5/<target>/<debug|release>/{abi.json,static/…,shared/…}`.

A complete matrix is 3 targets × 2 profiles × 2 linkages = **12 cells**.

## Matrix status (this host)

Status key:

- **present** — artifact files found on this machine (paths below)
- **absent** — not found under worktree or known host kit prefixes
- **not runnable here** — verification/smoke requires another OS/arch; not invented

| Target | Profile | Static | Shared | Notes |
| --- | --- | --- | --- | --- |
| `aarch64-apple-darwin` | release | present | present | Only staged kit on machine; outside worktree (main checkout `compiler/target/`) |
| `aarch64-apple-darwin` | debug | absent | absent | Required for matrix completeness; `build_matrix` demands both profiles |
| `x86_64-unknown-linux-gnu` | debug | absent | absent | not runnable here (macOS arm64 host) |
| `x86_64-unknown-linux-gnu` | release | absent | absent | not runnable here; `verify-native-runtime-kit-linux.sh` exits 1 on non-Linux |
| `x86_64-pc-windows-msvc` | debug | absent | absent | not runnable here |
| `x86_64-pc-windows-msvc` | release | absent | absent | not runnable here |

**Summary:** 2 of 12 cells present (macOS arm64 release static+shared); 10 cells absent or not runnable on this host.

Worktree-local installed prefix: **none** (`compiler/target` missing; no `native-runtime-kit` under the worktree).

## Artifact paths found

### Worktree (`.worktrees/cyb-69`)

| Path | Observation |
| --- | --- |
| `compiler/target/` | Does not exist |
| `compiler/obj/beskid/cache/salsa/` | Only unrelated salsa cache (`manifest.json` + one `.bd`); not a runtime kit |
| `compiler/runtime_manifest.bsol` | Source-of-truth ABI-v5 manifest (14 400 bytes); not a published kit |
| `compiler/corelib/packages/` | Source packages (`foundation`, `runtime`, `console`, …); not OS/installable runtime-kit packages |
| OS packages (`.deb` / `.rpm` / `.msi` / `.pkg` / installer archives) under `compiler/` | None found |

### Host machine (outside worktree)

Staged kit under the main checkout (not this worktree):

`/Users/mikserek/Projects/beskid/compiler/target/native-runtime-kit/lib/beskid-runtime/abi-5/aarch64-apple-darwin/release/`

| File | Size | Role |
| --- | --- | --- |
| `abi.json` | 23 022 B | Kit metadata (mtime 2026-07-17 13:05) |
| `static/libbeskid_runtime.a` | 8 528 B | Static library (ar archive) |
| `shared/libbeskid_runtime.dylib` | 53 992 B | Mach-O arm64 dylib |

Full tree + `file(1)` + full `abi.json`: [`cyb-69-logs/host-main-repo-native-runtime-kit.txt`](./cyb-69-logs/host-main-repo-native-runtime-kit.txt).  
Metadata excerpt: [`cyb-69-logs/abi-json-excerpt.txt`](./cyb-69-logs/abi-json-excerpt.txt).

No other `abi.json` or `lib/beskid-runtime/**` trees were found under `/Users/mikserek/Projects/beskid`.

## Hash / manifest excerpts

From host `abi.json` (verified against on-disk bytes):

| Field | Value |
| --- | --- |
| `abi_version` | 5 |
| `schema_version` | 1 |
| `target.triple` | `aarch64-apple-darwin` |
| `profile` | `release` |
| `layout_hash` | `5284ec72f700baaa14c46d9ef5ab324246c775d24f3baf1e4465f21f85cfdc10` |
| `source_hash` | `5f821cc4edede0f20740e1035dc75fee74b51a495a986b5537231048311b62fb` |
| static `sha256` (claimed = actual) | `08d69f3f3da0f1ba5d5ab59a9261d782c160f163c349e6110b3e64ced2b12f09` |
| shared `sha256` (claimed = actual) | `109bd0e8f7f1f2e26b2c4ccad1607791578e91abee92ddf6b6459eef2b484e04` |
| abi.json file sha256 | `8996febe4b0b489d10b1826104ea67ab277078a661ab54a238124bb2db35327f` |

Import allowlist (excerpt): `_exit`, `_tlv_bootstrap`, `mmap`, `munmap`, `write`.  
Export allowlist includes loader-required symbols such as `beskid_library_attach_v5`, `beskid_rt_v5_abi_version`, `beskid_rt_v5_process_init`, `beskid_arch_v5_context_init`, `beskid_arch_v5_context_switch`, plus memory/TLS/system intrinsics.

`runtime_manifest.bsol` header declares `abi_version = 5`, package `beskid-runtime-native`, and the three matrix targets above.

**Not proven:** that `source_hash` / `layout_hash` match a fresh build from compiler `79eccbd` (kit stamped 2026-07-17; inventory is 2026-07-20). No rebuild was performed.

## Installed-prefix smoke evidence

| Smoke | Result |
| --- | --- |
| Worktree clean-prefix stage + JIT/AOT smoke | Not run (would build); no worktree prefix to smoke |
| `beskid_engine` test `fresh_native_runtime_kit_executes_a_canonical_entrypoint` | Present in tree (`compiler/crates/beskid_engine/tests/native_runtime_kit_smoke.rs`); **not executed** this session (builds kit) |
| Linux `verify-native-runtime-kit-linux.sh` evidence | not runnable here |
| Windows dumpbin / prefix smoke | not runnable here |

## Commands and exit codes

| Command | Exit | Log |
| --- | --- | --- |
| `./compiler/scripts/verify-native-runtime-kit-ci.sh` | 0 | [`verify-native-runtime-kit-ci.txt`](./cyb-69-logs/verify-native-runtime-kit-ci.txt) |
| `./compiler/scripts/verify-native-runtime-kit-linux.sh` | 1 | [`verify-native-runtime-kit-linux.txt`](./cyb-69-logs/verify-native-runtime-kit-linux.txt) — stderr: `Linux native runtime-kit evidence requires an x86_64 Linux host` |
| `./compiler/scripts/verify-corelib-tests-parity.sh` | 0 | [`verify-corelib-tests-parity.txt`](./cyb-69-logs/verify-corelib-tests-parity.txt) — `corelib_tests parity ok (58 targets)` |
| `./compiler/scripts/verify-runtime-provenance.sh` (no args) | 64 | [`verify-runtime-provenance.txt`](./cyb-69-logs/verify-runtime-provenance.txt) — usage requires `<symbol-list>\|-`; no fixture supplied in inventory scope |
| `./compiler/scripts/stage-native-runtime-kit.sh` | **not run** | Would `cargo run -p beskid_cli -- runtime-kit build-native-host` ([`stage-script-not-run.txt`](./cyb-69-logs/stage-script-not-run.txt)) |
| `scripts/ci/corelib-gate.sh` | **not run** | Builds/stages kits and runs full corelib suite; out of inventory-only scope |

CI caller wiring (read-only): callers use `scripts/stage-native-runtime-kit.sh` + `BESKID_RUNTIME_PREFIX`; no `ensure-runtime-bridge.sh` references in the four listed CI callers — consistent with CI gate exit 0. See [`ci-caller-runtime-wiring.txt`](./cyb-69-logs/ci-caller-runtime-wiring.txt). Script `compiler/scripts/ensure-runtime-bridge.sh` still exists on disk.

## Discrepancies (recorded, not repaired)

1. **Worktree has no installed ABI-v5 prefix** — no `compiler/target/native-runtime-kit`; CYB-41 clean-prefix smoke cannot be claimed from this worktree alone.
2. **Only 2/12 matrix cells exist on this machine** — `aarch64-apple-darwin` / `release` / static+shared only.
3. **macOS debug kit absent** — matrix API requires both debug and release; host tree has release only.
4. **Linux cells absent; Linux verifier not runnable on Darwin arm64** — exit 1 expected; no Linux artifacts invented.
5. **Windows cells absent; Windows smokes not runnable here.**
6. **Host kit lives outside the evidence worktree** — main checkout path only; not reproducible from worktree checkout alone without rebuild.
7. **Kit age vs compiler tip unproven** — artifacts dated 2026-07-17; inventory pins compiler `79eccbd` on 2026-07-20; no hash recomputation from current sources.
8. **No OS/distribution package artifacts** found for runtime kits (no `.deb`/`.msi`/etc. under inventory search).
9. **`corelib/packages/*` are source packages**, not published installed-prefix kits — do not satisfy package-matrix acceptance by themselves.
10. **Installed-prefix execution smoke not freshly captured** — smoke test source exists; not run (would build).
11. **Provenance gate not exercised with a symbol list** — script exit 64 without fixture; platform symbol dump not collected this session.
12. **Legacy bridge script still present** (`ensure-runtime-bridge.sh`) while CI callers appear migrated to `stage-native-runtime-kit.sh` — inventory note only; retirement is W6/CYB-10 scope.

**Discrepancy count: 12**

## Interpretation for CYB-41

This inventory supports: “on this macOS arm64 host, one stale-dated release static+shared `aarch64-apple-darwin` kit exists outside the worktree with self-consistent `abi.json` hashes; CI wiring no longer references `ensure-runtime-bridge` in the checked callers; corelib test-list parity is green.”

It does **not** support: three-target debug/release installed-prefix closure, clean-prefix Linux compile-and-run proof, Windows kits, worktree-local smoke, or freshness of the found kit against compiler `79eccbd`.
