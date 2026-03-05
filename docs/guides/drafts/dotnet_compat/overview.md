# C# → Beskid Transpiler Specification

## Status: Draft

## 0. Overview

This document specifies how to translate C# source code into idiomatic Beskid source code. The goal is **cross-compilation, not interop** — the output is standard `.bd` files that feed into the existing Beskid compiler pipeline (parser → analysis → HIR → Cranelift → JIT/AOT).

### Design principles

1. **Beskid-native output.** Generated `.bd` code must be idiomatic, readable, and indistinguishable from hand-written Beskid.
2. **Structs only.** C# classes and structs both map to Beskid `type` declarations. There is no class hierarchy in the output.
3. **No .NET runtime dependency.** The transpiled code runs on Beskid's GC, allocator, and standard library. The CLR is not involved at any stage.
4. **Incremental coverage.** The transpiler starts with a well-defined C# subset and expands over time. Unsupported constructs produce clear compile-time errors with migration guidance.

### Architecture

```
                          ┌──────────────────────┐
  .cs source files ──────►│  C# Parser           │
                          │  (tree-sitter-c-sharp)│
                          └──────────┬───────────┘
                                     │ CST
                          ┌──────────▼───────────┐
                          │  Semantic Model       │
                          │  (type resolution,    │
                          │   BCL facade map)     │
                          └──────────┬───────────┘
                                     │ Typed C# AST
                          ┌──────────▼───────────┐
                          │  Transpiler Core      │
                          │  (C# AST → Beskid    │
                          │   source emission)    │
                          └──────────┬───────────┘
                                     │ .bd source files
                          ┌──────────▼───────────┐
                          │  Beskid Compiler      │
                          │  (existing pipeline)  │
                          └──────────────────────┘
```

### Crate: `beskid_dotnet`

A new workspace crate responsible for:
- Parsing C# via `tree-sitter-c-sharp`
- Building a typed C# AST with resolved symbols
- Resolving BCL types via a built-in facade map
- Emitting Beskid `.bd` source text

### Document structure

| Document | Contents |
|---|---|
| `overview.md` | This file |
| `type-mapping.md` | Primitive types, structs, enums, generics |
| `construct-mapping.md` | Statements, expressions, control flow |
| `class-flattening.md` | Class hierarchy elimination strategy |
| `bcl-facade.md` | BCL type mapping to Beskid stdlib |
| `unsupported.md` | Explicitly unsupported C# features and error strategy |
| `tooling.md` | CLI integration, project model, incremental workflow |
