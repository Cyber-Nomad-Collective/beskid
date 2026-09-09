import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

Hand-written Cranelift calls bypass the shared ABI catalog and desynchronize JIT, AOT, and runtime `extern "C-unwind"` implementations.

## Decision

| Rule | Detail |
| --- | --- |
| Catalog | `BUILTIN_SPECS` in `beskid_abi::builtins` is the **sole** source of Cranelift import signatures (**ABI-002**) |
| Codegen | `declare_builtin_imports` builds `FuncId`s only from specs |
| Diverging builtins | `AbiReturnKind::Never` for `panic` so unreachable blocks are correct |
| Parity | Symbol strings in specs **must** match `RUNTIME_EXPORT_SYMBOLS` entries (**ABI-001**) |

## Consequences

New builtins require spec, `BUILTIN_SPECS`, `symbols.rs`, and `beskid_runtime::builtins` in one change set.

## Verification anchors

`compiler/crates/beskid_codegen`; `compiler/crates/beskid_abi/src/builtins.rs`.
