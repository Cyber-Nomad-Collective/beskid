# Beskid ABI-v5 rewrite guide

This guide contains the coordination rules needed by implementers of the HIR-free ISLE/CLIF and native-runtime rewrite. The approved design is `docs/superpowers/specs/2026-07-13-hir-free-isle-native-runtime-design.md`; the delivery sequence is `docs/superpowers/plans/2026-07-13-hir-free-isle-native-runtime.md`.

## Rewrite invariants

- Expanded AST nodes plus generation-safe Salsa facts are the sole semantic representation. Do not add HIR adapters, shadow caches, or source-offset-only identities.
- Generated ISLE rules are the sole language-operation lowering layer. Every typed operation has exactly one rule and every emitted function passes `verify_function`.
- ABI v5 calls manifest-declared `beskid_rt_v5_*` symbols directly. Do not add dispatch tags, envelopes, handler registration, ABI-v4 fallback, or a universal System V/pointer-as-`i64` assumption.
- `compiler/runtime_manifest.bsol` is the symbol/layout authority; generated `abi.json` is the exact target/profile allowlist and hash contract. Never hand-edit generated ABI files.
- There is one hosted Beskid runtime in debug and release profiles. Only `beskid_arch_v5_context_init` and `beskid_arch_v5_context_switch` may be implemented in target assembly.
- Only the canonical runtime compilation may receive the trusted runtime-intrinsic capability. The capability is not serializable or inheritable by user packages.
- The supported target set is exactly `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and `x86_64-pc-windows-msvc`, all little-endian with 64-bit pointers.
- Runtime traps use codes 1–10, call `beskid_rt_v5_trap`, and terminate with status 101; there is no panic, unwind, resume, or compatibility handler.
- The cutover is big-bang. A task checkout may temporarily leave untouched legacy consumers for compilation, but the integration branch must delete HIR, ABI-v4, and the Rust runtime before acceptance.

## Parallel-agent ownership

| Agent domain | Write scope | Knowledge file |
|---|---|---|
| Frontend contracts and migration | AST identities, Salsa queries, parser/expansion indexes, analysis spine | `~/.agents/knowledge/frontend-salsa.md` |
| ABI contracts | Runtime manifest/model, validation, deterministic ABI metadata | `~/.agents/knowledge/abi-v5.md` |
| Specification | Root `GUIDE.md`, `GLOSSARY.md`, and `docs/superpowers/` design/plan | `~/.agents/knowledge/abi-v5-spec.md` |
| LSP migration | Document indexes and LSP semantic consumers | `~/.agents/knowledge/lsp-hir-free.md` |
| Codegen | ISLE terms/rules, CLIF construction boundary, coverage/verifier gates | `~/.agents/knowledge/isle-codegen.md` |
| Runtime and assembly | Beskid runtime sources, trusted capability, target assembly | `~/.agents/knowledge/native-runtime.md` |
| Kit/JIT/AOT integration | Runtime-kit build/resolution, linking, wrappers, library lifetime | `~/.agents/knowledge/runtime-kit.md` |
| CI and distribution | Target matrix, bundles, packages, installed-prefix smoke tests | `~/.agents/knowledge/abi-v5-distribution.md` |

Use disjoint worktrees and write scopes. Do not edit another agent's checkout, `Cargo.lock`, generated files, submodule pointers, or another agent's knowledge file. Before an existing symbol edit, run GitNexus upstream impact analysis and warn on high/critical risk. Before commit, run focused tests and GitNexus change detection. Audit `~/.agents` and worktree-only coordination files so none can be staged or pushed.
