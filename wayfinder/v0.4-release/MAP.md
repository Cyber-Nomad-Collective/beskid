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

## Not yet specified

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
