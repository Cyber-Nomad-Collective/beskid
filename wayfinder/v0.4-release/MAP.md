## Destination

v0.4.0 released with all GitHub CI/CD gates green: 100% corelib test matrix passing (61/61 targets), complete ISLE lowering for every remaining compiler construct, macOS arm64 + Windows x86-64 runtime kits built and verified, tracker seed data synced, CHANGELOG 0.4.0 cut, catalog regenerated and embeddable, and platform-spec synced with OpenSpec with improved UX and expanded document sections. v0.5 is out of scope.

## Notes

- Domain: compiler ISLE lowering, corelib gate quality, runtime-kit builds, tracker data sync, OpenSpec catalog, platform-spec site
- Skills: domain-modeling (OpenSpec terminology), codebase-design (ISLE lowering coverage), changelog (CHANGELOG cutoff), diagnosing-bugs (JIT SIGILL)
- This map carries execution into its tickets — the destination requires build/delivery work, not just decisions
- CYB-170/171/173/174/177 reference by Linear issue key; create linked issues if they don't exist yet
- Linear is the canonical tracker; labels `wayfinder:map` on the map, `wayfinder:<type>` on each ticket

## Decisions so far

- [ISLE lowering coverage audit](beskid/wayfinder/v0.4-release/tickets/01-isle-coverage-audit.md) — 89 syntax kinds, 28 ISLE-lowered (32%), 10 intentionally rejected, 51 structural. Only two real gaps: LambdaExpression (CYB-173, needs ISLE rules) and TryExpression (CYB-174, needs desugaring, not ISLE). Every kind has an explicit classification arm; no silent gaps exist.
- [Corelib gate current state](beskid/wayfinder/v0.4-release/tickets/02-corelib-matrix-state.md) — 61 targets in `corelib_tests.bproj`. **Updated 2026-07-31:** Local run shows SyscallWrite (3/3 PASS), SyscallApi (2/2 PASS), but ~80% of targets hang indefinitely during codegen/JIT. The SIGILL is resolved; the hang is the new P0 blocker.
- [Compiler submodule fix](beskid/wayfinder/v0.4-release/tickets/13-compiler-submodule-fix.md) — `flatten_member_as_path_declaration` implemented; all clippy warnings fixed; compiler builds clean; `just replace` installs successfully; runtime kit staged. All 59 `beskid_isle` and 86 `beskid_codegen` isle_adapter tests pass.
- [ISLE Syscall fact fixes](beskid/wayfinder/v0.4-release/tickets/11-isle-syscall-fact-fixes.md) — Cross-module call resolution fixed; ISLE comparison operators consolidated (CompareOp, EnumEq/EnumNotEq, lower_compare dispatcher); enum discriminant comparison implemented with `binary_enum_layout`; clippy gate cleared. Corelib pipeline reaches type-checking and lowering phases.
- [Generic specialization cross-module harvesting](beskid/wayfinder/v0.4-release/tickets/12-jit-sigill-debug.md) — Added root-based specialization collection to resolve_module_items so generic functions called from test modules are specialized. Partial fix for CYB-140; full fix requires cross-module specialization propagation.
- [JIT SIGILL and codegen hang debug](beskid/wayfinder/v0.4-release/tickets/12-jit-sigill-debug.md) — Root cause: compile error in emit_clif_block (ExtFuncData not imported, ExternalName::user wrong API). Fixed: full path cranelift_codegen::ir::ExtFuncData, ExternalName::testcase. clif_block_body export added to beskid_queries. Grammar fixed: ClifBlockExpression uses opaque body capture instead of Block. Runtime kit import_allowlist extended with C math functions. JIT validator checks import_allowlist; declare_import_allowlist_symbols pre-declares them. CoreMathTests 23/23 PASS. SystemOutputWriteLineTests, SystemOutputWriteTests, ConsoleAnsiEscapeTests all PASS.
- [Clif block feature](tickets/14-clif-native-block.md) — Full `clif { ... }` block expression: Pest grammar, ClifBlockExpression AST node, NodeKind::ClifBlock classification, ISLE lowering rule, emit_clif_block constructor (parses `call @symbol(%N)` / `return %N`, emits CLIF `call` via ExternalName::testcase), clif_block_body salsa query, function_param_values Vec for %N resolution. All 10 __math_* calls in Core.Math.Math.bd replaced with clif blocks. 3 golden tests pass CLIF verifier. Rule coverage updated.
- [Pre-flight gates fixed](tickets/15-gates-fix.md) — OpenSpec catalog regenerated (AGENTS.md hash drift resolved). TryExpression added to rule_coverage evidence table. All host-tier gates pass: openspec, conformance, platform-integration, supply-chain-security.
- [Tooling improvements](tickets/16-tooling.md) — Submodule guard script for multi-repo visibility. Pre-commit hook for dirt detection. CODEOWNERS for domain-based review assignment. Local preflight wired with submodule guard.
- [CHANGELOG finalized](tickets/17-changelog-finalize.md) — Stale 2025-07-17 [0.4.0] block removed. Date set to 2026-08-06. Unreleased section cleared. 17 lines added (clif block, math rewrite, tooling).
- [CHANGELOG cutoff](tickets/08-changelog-040-cutoff.md) — `[0.4.0] - 2026-08-06` exists in `CHANGELOG.md`, with `Unreleased` retained for post-0.4.
- [Catalog embeddability](tickets/04-catalog-embeddability.md) — `openspec:catalog` rebuilds `openspec/catalog.json` and `openspec:validate` now passes clean (`206 passed, 0 failed`) with revision `0cdc1bfda83c` committed.
- [Tracker seed sync](tickets/07-tracker-seed-sync.md) — v0.4 seed payload schema issues were fixed (`status` and `statusColumn`), and `pnpm seed:validate` now passes for all 5 versions, including v0.4 (`54 tasks, 8 workstreams, 6 deliverables`).
- [Platform-spec sync scope](tickets/03-platform-spec-sync-scope.md) — Existing OpenSpec capability documents remain the v0.4 authority; the reader already provides accessible searchable navigation and hybrid rendering. Release verification is catalog regeneration and validation followed by the platform-spec production build; no new release-summary normative content is warranted.

## Not yet specified

- **Corelib test matrix full run** — requires CI (builds beskid_cli --release, stages runtime kit, runs 61-target test suite). Local corelib gate is too slow to run here; triggered via `corelib.yml` workflow on push to main.

- **CI/CD verification and staging deployment** — depends on all prior tickets completing; a final integration/verification ticket will be created
- **Release version bump and tag** — depends on CHANGELOG cutoff and CI green; will be created as the final task once all gates pass

## Out of scope

- v0.5 foundations (spawn, channels, timers, `use`, Core.IO)
- v0.5 networking (CYB-61)
- v0.5 HTTP (CYB-62)
- HIR-free ISLE ABI-v5 native runtime migration
- Any compiler work beyond what's needed for 0.4 CI green
- Open VSX extension publishing (deferred from v0.4)
- Production OAuth deployment (deferred from v0.4 platform-dx deliverable)
- Composition constructs (W5): HostDefinition, RegistryBlock/Entry, ScopeDefinition/Hook, WithStatement, LaunchStatement
- CodeStringLiteral ISLE lowering (TBD, not a 0.4 blocker)
