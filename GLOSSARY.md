# Glossary

## ABI v5

The direct-call native application binary interface for the rewritten Beskid compiler and runtime. It supports only little-endian 64-bit `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and `x86_64-pc-windows-msvc`; all runtime exports are versioned `beskid_rt_v5_*` symbols and its exact contracts are generated from `compiler/runtime_manifest.bsol` into `abi.json`.

## AST semantic facts

Generation-scoped results computed by Salsa for expanded AST nodes, including resolution, types, signatures, call lowering, cast intent, control flow, and runtime-intrinsic authorization. They are keyed by `AstNodeKey` and replace HIR as the semantic input to tooling and code generation.

## HIR-free

The compiler invariant that no high-level intermediate representation type, lowering pass, cache, adapter, serialization, or compatibility path exists between expanded AST/Salsa facts and ISLE/CLIF code generation.

## ISLE rule layer

The exhaustive generated rule set that consumes typed AST shape plus AST semantic facts and emits stock CLIF. Every typed operation has exactly one rule, and every generated function must pass Cranelift verification.

## Native runtime kit

The installed ABI-v5 target/profile directory containing `abi.json` and the matching static and shared artifacts for the single hosted Beskid runtime. A kit is usable only when its ABI, target, profile, layouts, sources, symbols, and hashes exactly match the compiled program.

## Runtime intrinsic

A manifest-declared primitive or platform operation available only while compiling the canonical Beskid runtime under a non-forgeable trusted compiler capability. User packages cannot name, import, inherit, or invoke runtime intrinsics.
