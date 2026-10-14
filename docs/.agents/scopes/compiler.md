# Scope: compiler

The Rust compiler, CLI, language server, native runtime and the core library.
Lives in the `compiler/` submodule (repository `beskid_compiler`), with
`compiler/corelib/` as a nested submodule. Normative behaviour is in
`openspec/specs/compiler--*`, `language-meta--*` and `tooling--*`.

## Layout

- `compiler/` is a Cargo workspace. Crates are named `beskid_<domain>`
  (for example `beskid_queries`, `beskid_lsp`, `beskid_pckg_server`).
- `compiler/corelib/` holds the standard library as Beskid sources (`.bd`),
  not as a Rust crate: `corelib`, foundation, runtime and the Mod SDK.
- `compiler/runtime_manifest.bsol` is the source of the ABI v5 runtime
  contract. `abi.json` is generated from it.
- Clone with `--recursive`, or corelib will be missing.

## Pipeline

Production lowering is fixed:

`TypedProgram` → `CodegenInput` → Cranelift ISLE → CLIF that passes the stock
Cranelift verifier.

- Reject any HIR or `Lowerable` compatibility entry point. HIR is retired.
- Cranelift ISLE is also the path for porting runtime pieces from Rust to
  Beskid over time.

## Semantic authority

- Generation-bound Salsa and syntax facts in `beskid_queries` are the semantic
  authority for the LSP and IDE features. Do not rebuild HIR per request and do
  not keep a second snapshot path.
- These facts are keyed by `AstNodeKey`; see "AST semantic facts" in
  `GLOSSARY.md`.

## ABI v5 and runtime kits

- Three targets only: `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`,
  `x86_64-pc-windows-msvc`. Runtime exports are `beskid_rt_v5_*`.
- Runtime kits are found by exact installed-prefix discovery and validated.
  Missing, mismatched or tampered kits fail closed.

## Commands

| Task | Command |
| --- | --- |
| Build | `cargo build` in `compiler/` |
| Install `beskid` and `beskid_lsp` into the toolchain | `just replace` (root or `compiler/`) |
| Corelib spine smoke test | `BESKID_CORELIB_SPINE_SMOKE=1 just test-corelib-spine` |
| Compiler gate as CI runs it | `scripts/ci/compiler-rust-gate.sh` |
| Corelib gate | `scripts/ci/corelib-gate.sh` |

The root `just gate` does not run the compiler gate. Use the compiler
repository's own commands for focused work.

## Conventions

- **Naming.** PascalCase for types, functions and methods; camelCase for locals
  and parameters; crates `beskid_<domain>`.
- **Readable traces.** In compiler and ISLE traces, show real names with span
  and construct detail. Expand `SourceUnitId`, `AstNodeKey` and `#gN:nM` into
  names instead of printing raw numeric ids. (Upstream maintainer preference.)
- **Terminal UI.** `beskid hi` and every full-screen terminal interface except
  `beskid graph --tui` were removed in 0.5.1. An older preference for `beskid hi`
  on macOS (menu shortcut Ctrl+M instead of F10) no longer has a target. The
  general rule it carried still holds for remaining interactive surfaces:
  keep shortcuts centralized and clickable with a mouse.

## Before changing behaviour

Any change a user can observe needs an OpenSpec change first. See
[openspec-standard.md](openspec-standard.md).
