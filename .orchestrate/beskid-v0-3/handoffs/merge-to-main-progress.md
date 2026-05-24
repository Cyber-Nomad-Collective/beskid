# merge-to-main-progress (v0.3 CI stabilization)

## Summary

Post-merge CI stabilization and v0.3 track completion on `main` (2026-05-24).

## CI fixes landed

| Area | Fix |
| --- | --- |
| Docs site | MDX table escape in `tooling/formatter/index.mdx` line 128 |
| JIT / Runtime CI | Composition builtins in `beskid_engine/src/jit_module.rs` |
| Corelib | Prelude duplicate `Contracts`; MVP fixture `Std.System.Output.WriteLine` |
| AOT build | `AotBuildRequest.external_libraries` / `library_search_paths` on all initializers; CLI uses `link_libraries_for_artifact` |
| ABI allowlist | `RUNTIME_EXPORT_SYMBOLS` frozen snapshot includes callback + dynamic builtins |
| Runtime bridge | Rebuilt `beskid_runtime_bridge` after new exports |

## v0.3 tracks completed (this session)

| Track | Status |
| --- | --- |
| export-ffi-link-time | `[Export]` codegen + AOT export table + `beskid_register_callbacks` + link libraries; `ffi_v03_link_time.rs` un-ignored; interop tests; spec traceability updated |
| codegen-coverage-dynamic-types | Dynamic runtime + CLIF helpers + mapping eligibility; `dynamic-types-and-mapping.mdx` → Standard; 9 `codegen::dynamic_types` + 4 `runtime::dynamic` tests |

## Verification (local, 2026-05-24)

```text
cd site/website && bun run verify:trudoc -- --preset ci --strict  → pass
cd compiler && cargo check --workspace                              → pass
cd compiler && cargo test -p beskid_tests --lib --test-threads=1    → 775 pass, 2 ignored
cd compiler && cargo test -p beskid_tests interop::                 → 8 pass
cd compiler && cargo test -p beskid_tests codegen::dynamic_types    → 9 pass
cd compiler && cargo test -p beskid_tests runtime::dynamic          → 4 pass
cd compiler && cargo test -p beskid_codegen dynamic                 → 4 pass
cd compiler && cargo build -p beskid_runtime_bridge                 → pass
```

## Coolify (Beskid project `tosg8kc80g8go00sgcswsccg`)

Redeploy **beskid site** (`rsso488sscg80kookoo00sk4`) and **Pckg** (`fotldmgwdsxttpde914u8ktr`) after docs-site + compiler CI green on pushed SHA. Prior MCP deploy failed: Coolify server unreachable at `https://coolify.bdziam.dev`.
