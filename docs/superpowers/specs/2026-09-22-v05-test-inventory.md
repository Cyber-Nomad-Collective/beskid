# v0.5 Test Inventory & Coverage Map — 2026-09-22

Slice: `cov-setup` (per `~/.claude/handoffs/v05-agent-rules.md`, updated with the
"Build location" hard rule: all cargo/beskid_cli builds and test runs happen
**only** on the remote NixOS builder, `/workspace/compiler-cov` with
`CARGO_TARGET_DIR=/target/cov`. Nothing was built or run locally.)

Source worktree: `/Users/mikserek/Projects/beskid/.worktrees/compiler-f6-native-descriptor-contract`
Remote copy: `root@10.66.0.2:/var/lib/beskid-codex-build/work/compiler-cov`
(reachable via `ssh -J root@bdziam.dev root@10.66.0.2`, container `beskid-codex-build`)

**Rsync timestamps (re-sync from these markers if the worktree has moved on):**
- Main tree rsync started/finished: `2026-09-22T17:42:50Z` / `2026-09-22T17:43:02Z`
- Tracked fixture `obj/` dirs (`beskid_tests_projects/fixtures`, `beskid_tests_mods/fixtures`) synced: `2026-09-22T17:44:05Z`

---

## 1. Test target inventory

### 1a. Beskid (`.bproj`) test targets — 84 total

| Project | `.bproj` | Targets |
|---|---|---|
| `corelib/beskid_corelib/tests/corelib_tests` | `corelib_tests.bproj` | 75 targets (see `cov-groups.json`, groups `beskid-corelib-1..4`) — covers System.Syscall/Output/Input/Error, Console (Ansi/Format/Controls/Facade/Terminal), Core (Results/Optional/Bytes/Encoding/Math/Random/Args/ErrorHandling/String/Process/Threading/ExpressionBody), CompilerSdk, Concurrency (Channel/Mutex/Clock/Hub/WaitGroup/FiberHandle/StatusAbi), Collections (Array/List/Map/Set/Queue/Stack/Tier1/generic), Query, System (Fs/Path/Time/Environment/RuntimeInit), Text (Cursor/Parser/Regex/Casing/ParserCombinator/RegexIntegration), Pest (GrammarParse/EmitGolden), Network (Types/Dns/Tcp/Udp/Scope), Http (Codec/Serialization/Exchange) |
| `runtime/beskid/tests/runtime_semantics` | `runtime_semantics.bproj` | `LifecycleTests`, `CompositionTests`, `SchedulerTests`, `ExternalWorkTests`, `GcTests` (slow/native), `ProcessIoTests`, `NetworkNativeTests` (slow/native) |
| `corelib/packages/network/tests/compile-fail` | `network_rejections.bproj` | `RawHandle`, `UdpIsNotStream` (compile-fail negative tests) |

Every Beskid target run needs `rm -rf <project>/obj/beskid/cache` first (stale
incremental cache) and `BESKID_RUNTIME_PREFIX=/workspace/verify/network-kit.cov`.

### 1b. Rust test binaries — 12 crates unit-tested + ~145 integration test files across ~20 crates

From `cargo metadata --no-deps` run **on the remote box** (`/tmp/meta.json`,
`/tmp/cov-groups.json` mirrors this). v0.5-relevant crates with `#[test]`
integration binaries: `beskid_abi` (23), `beskid_isle` (22), `beskid_queries`
(7), `beskid_engine` (20 — includes `foundation_io_native`, slow), `beskid_codegen`
(6), `beskid_manifest` (5), `beskid_aot` (4), `beskid_analysis` (6),
`beskid_pckg_server` (6), `beskid_up` (3), plus single-test crates
`beskid_artifacts`, `beskid_pckg_artifacts`, `beskid_pckg_auth`, `beskid_lsp`,
`abfall`. The `beskid_tests_*` and `beskid_e2e_tests` crates are lib crates
whose tests live inside `src/` (`cargo test -p <crate> --lib`); `beskid_tests_projects`
and `beskid_tests_aot` and `beskid_e2e_tests` are the slow/e2e-shaped ones.
(`salsa`, `cargo-cross` are vendored/unrelated — excluded.)

## 2. Groups (13 groups, ~8 "core" + dedicated slow lanes)

See `cov-groups.json` for exact machine-readable commands. Summary:

| Group | Kind | Count | Notes |
|---|---|---|---|
| `beskid-corelib-1..4` | beskid | 19/19/19/18 | corelib_tests.bproj split into 4 even chunks |
| `beskid-runtime-semantics` | beskid | 7 | `GcTests`, `NetworkNativeTests` are slow/native — run solo if the group times out |
| `beskid-network-compile-fail` | beskid | 2 | fast, negative-compile tests |
| `cargo-fast-libs` | cargo | 19 | beskid_manifest/artifacts/analysis/pckg_artifacts/pckg_auth/up/lsp/abfall |
| `cargo-isle-codegen` | cargo | 28 | beskid_isle + beskid_codegen |
| `cargo-abi-queries` | cargo | 34 | beskid_abi + beskid_queries + beskid_aot |
| `cargo-pckg-server` | cargo | 6 | HTTP-contract-heavy, isolated for pckg server |
| `cargo-tests-lib-crates` | cargo | 9 | beskid_tests_{support,surface,lsp,pckg,interop,cli,composition,abi,mods} `--lib` |
| `cargo-engine-jit-SLOW` | cargo | 20 | beskid_engine — includes `foundation_io_native`, JIT/native fixture tests |
| `cargo-tests-projects-e2e-SLOW` | cargo | 3 | beskid_tests_projects, beskid_tests_aot, beskid_e2e_tests `--lib` |

## 3. Spec requirement → test mapping (50 requirements across 3 changes)

`beskid-v0-5-foundations` (30 reqs), `beskid-v0-5-networking` (16 reqs),
`beskid-v0-5-http` (4 reqs). Full extracted list with Stable IDs and scenario
counts: `reqs.json` / `reqs_mapped.json` in the scratchpad (automated
keyword-`rg` candidates in `reqs_mapped.json` are noisy — treat as a starting
point, not ground truth; the mapping below is the reviewed version, using the
actual `.bproj` target names and crate test files as authority).

### Foundations
- Core.Bytes copy/cursors (`BSP-REQ-8E1AF054C89D`, `BSP-REQ-391C7C5A5DD6`) → `CoreBytesTests`
- Core.Encoding UTF-8/Hex/Base64 (`BSP-REQ-6B3A72539DE6`, `BSP-REQ-C1442592D817`) → `CoreEncodingUtf8Tests`
- Core.Syscall `ReadBytesWith` (`BSP-REQ-277D7253AE0E`) → `SystemSyscallApiTests`, `SystemSyscallErgonomicsTests`
- Core.Time sleep (`BSP-REQ-D613601481B2`, `-8851DD840BC2`, `-CB2C00464517`, `-75347DC0B10F`) → `SystemTimeTests` + `beskid_abi::scheduler_lifecycle_sources`
- Channels (`BSP-REQ-D00CFBE68D28`, `-6D7DDA9E739B`, `-3B24A87BD7B8`, `-987344126476`, `-AF2C1DDC351E`) → `ConcurrencyChannelApiTests` + `beskid_engine::spawn_scheduler`/`fiber_value_transfer`
- External waits / scheduler (`BSP-REQ-B206035816D3`, `-6CF93216D4C9`, `-52284EABE5E1`, `-A0D58F1B3E21`, `-896BA6C917E9`, `-A371B8519429`) → `runtime_semantics::SchedulerTests`, `ExternalWorkTests` + `beskid_abi::canonical_scheduler_sources`, `runtime_kit_build`
- Fiber lifecycle/spawn (`BSP-REQ-F61E094A4838`, `-075328D8F9ED`, `-EBF704693274`, `-8CE166C9D003`, `-14D405F2C1C7`, `-6DA154A4738C`) → `ConcurrencyFiberHandleTests`, `runtime_semantics::LifecycleTests`/`CompositionTests` + `beskid_queries::semantic_facts::closures_and_spawn`
- Scoped cleanup / Disposable / Core.IO (`BSP-REQ-91BA42B54DE1`, `-0A5892A2DB9C`, `-F25A4DF4DEA0`) → `beskid_engine::scoped_cleanup_native` + `beskid_queries::semantic_facts::scoped_cleanup`
- Scoped-use grammar (`BSP-REQ-49672AF267D1`) → `beskid_analysis::scoped_use` test file — **GAP**: no `.bproj` corelib target exercises the runtime semantics, only the parser-level unit test.

### Networking
- UDP (`BSP-REQ-74F9B2C8A6D0`, `-2A5DC9E7F4B3`) → `NetworkUdpTests`, `runtime_semantics::NetworkNativeTests`
- TCP (`BSP-REQ-D15E92AB4C76`, `-410CB8F5E97A`, `-E6A31C7D095B`) → `NetworkTcpTests`, `NetworkNativeTests`
- Network.Errors (`BSP-REQ-CAB59E0274D1`) → covered indirectly across `NetworkTcpTests`/`NetworkUdpTests`/`NetworkDnsTests`; **no dedicated error-union target** — GAP (3 scenarios, only partial coverage).
- Network.Types (`BSP-REQ-17C4F8A02D65`) → `NetworkTypesTests`
- Network scope exclusion (`BSP-REQ-93E6F1A8C57D`) → `NetworkScopeTests`
- DNS (`BSP-REQ-29D8A7C6E340`, `-6F03B4D9A82E`) → `NetworkDnsTests`
- Reactor/native backends, socket terminal winner, shutdown idempotency (`BSP-REQ-5B97C4F1D3A8`, `-F902B81D6E4C`, `-8A21D67C43FE`) → `runtime_semantics::NetworkNativeTests` + `beskid_engine::native_runtime_kit_smoke` — thin coverage, mostly one native integration test carrying all three requirements. **GAP risk**: shutdown idempotency/leak audit has no assertion found in any test name; flag for the networking slice owner to confirm.
- Foundation Core.IO/Disposable reuse for network streams (`BSP-REQ-4E7D12C9B6A0`) → same as above, thin.
- Socket ABI handle / builtin registry (`BSP-REQ-3D4E0AE8B901`, `-B094EDC16A72`) → `beskid_abi::canonical_hub_sources`, `beskid_codegen::isle_adapter::corelib_services` — **GAP**: no test asserts "one generated implementation path" directly; likely implicit via `rule_coverage` in `beskid_isle`, needs confirmation.
- network_rejections compile-fail targets (`RawHandle`, `UdpIsNotStream`) map to `BSP-REQ-93E6F1A8C57D` (scope exclusion) as negative tests.

### HTTP
- Bounded/unambiguous framing (`BSP-REQ-7E14A36F9F29`, `-58182F687E87`) → `HttpCodecTests`
- Host field (`BSP-REQ-6CAA5AC6F4E3`) → `HttpSerializationTests`
- One transport path (`BSP-REQ-9E0DE26CF08F`) → `HttpExchangeTests`

## 4. Coverage gaps ranked by release impact

1. **HIGH** — Network shutdown idempotency / leak audit (`BSP-REQ-8A21D67C43FE`) and
   Foundation Core.IO/Disposable reuse for network streams (`BSP-REQ-4E7D12C9B6A0`):
   only reachable through `runtime_semantics::NetworkNativeTests`, a single
   slow native-integration target carrying multiple requirements — no
   targeted assertion found. Release-blocking if the networking slice ships
   without a dedicated leak-audit test.
2. **HIGH** — Network.Errors closed union (`BSP-REQ-CAB59E0274D1`, 3 scenarios):
   no target asserts the union is *closed* (exhaustive/no unlisted variant);
   existing TCP/UDP/DNS tests only exercise individual error paths.
3. **MEDIUM** — Socket builtin registry "one generated implementation path"
   (`BSP-REQ-B094EDC16A72`) and opaque generation-tagged ABI handle
   (`BSP-REQ-3D4E0AE8B901`): coverage is implicit through ISLE rule-coverage
   and canonical-source tests, not a direct assertion of the requirement text.
4. **MEDIUM** — Scoped-use grammar form (`BSP-REQ-49672AF267D1`): only a
   parser-level unit test (`beskid_analysis::scoped_use`); no `.bproj`
   corelib target exercises end-to-end runtime semantics for scoped `use`.
5. **LOW** — Several foundations scheduler requirements (external-wait
   capacity, exactly-one-winner, monotonic generation-tagged timers) are
   covered only by `beskid_abi::canonical_scheduler_sources`/`scheduler_lifecycle_sources`
   plus `runtime_semantics::SchedulerTests`/`ExternalWorkTests` — adequate but
   concentrated in few targets; a regression there could silently mask
   multiple requirement failures.

## 5. Unchecked `tasks.md` items describing observable behavior

`openspec/changes/{beskid-v0-5-foundations,beskid-v0-5-networking,beskid-v0-5-http}/tasks.md`
are **entirely unchecked** in the main repo (33 + 19 + 12 = 64 items, 0
checked) — this reflects the main repo's OpenSpec tracking, not the
worktree's actual implementation state (the worktree has substantial
uncommitted implementation per its dirty `git status`). Runner agents should
not treat "0 checked" as "0 implemented" — cross-reference against the
worktree diff and the coordination board
(`~/.claude/handoffs/networking-coordination.md`) instead. Full task text is
in the three `tasks.md` files; not reproduced here to avoid drift from the
source of truth.

## 6. Runner environment

- Remote copy: `/workspace/compiler-cov` (rsync markers above).
- CLI build: `cargo build -p beskid_cli --bin beskid_cli` with
  `CARGO_TARGET_DIR=/target/cov`, launched detached on the remote box at
  `2026-09-22T17:44:10Z`, **finished `EXIT=0` at 17:57 UTC** (13m44s,
  `/target/cov/debug/beskid_cli`, log `/tmp/cov-build.log` inside the
  `beskid-codex-build` container).
- Runtime kit: built at `2026-09-22T17:58:53Z`–~17:59:40Z via
  `/target/cov/debug/beskid_cli runtime-kit build-native-host --prefix /workspace/verify/network-kit.cov --profile debug`,
  **EXIT=0**, kit at `/workspace/verify/network-kit.cov/lib/beskid-runtime/abi-5/x86_64-unknown-linux-gnu/debug`
  (log `/tmp/cov-kit.log`).
- **Smoke-tested both command templates**: a `beskid` group command
  (`network_rejections::RawHandle`, compile-fail project) ran end-to-end
  against the new kit (compiled, resolved, produced `Tests complete in
  10.3s` — worth a follow-up: it reported "No diagnostics"/"No tests found"
  for a compile-fail target, which the networking slice owner should check
  independently of this inventory task); a `cargo` group command
  (`beskid_artifacts::roundtrip`) ran and passed 5/5. Runner agents can
  proceed directly.
- All commands in `cov-groups.json` are pre-formatted for
  `podman exec ... bash -c "..."` on `root@10.66.0.2` via the `bdziam.dev`
  jump host and assume the CLI + kit above exist.

## 7. Follow-ups for the coordinator

- CLI and runtime kit are built and smoke-tested (section 6) — runner agents
  can start immediately from `cov-groups.json`.
- The compile-fail smoke test (`RawHandle`) reported "No diagnostics"/"No
  tests found" instead of an expected rejection — flag this to whoever owns
  `corelib/packages/network/tests/compile-fail` before trusting that group's
  pass/fail signal; it may be a legitimate CLI output-format quirk for
  compile-fail targets rather than a real regression, but it was not
  investigated further here (out of scope for `cov-setup`).
- The spec→test mapping in section 3 is a reviewed-but-not-exhaustive first
  pass; the automated keyword search (`reqs_mapped.json`) produced too much
  noise to trust directly — a runner with more budget should re-derive hits
  by grepping actual `.bd` test source under
  `corelib/beskid_corelib/tests/corelib_tests/src/**` for scenario-level
  assertions instead of file-level keyword hits.
