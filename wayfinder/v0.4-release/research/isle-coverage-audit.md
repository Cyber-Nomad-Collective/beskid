# ISLE Lowering Coverage Audit — Beskid Compiler v0.4

**Date:** 2026-07-31
**Scope:** `compiler/crates/beskid_isle/` ISLE rules vs. full `IndexedNodeKind` syntax catalogue

---

## 1. Executive Summary

| Metric | Count |
|---|---|
| Total syntax kinds (`IndexedNodeKind::ALL`) | **89** |
| ISLE-lowered kinds (`IsleLowered`) | **28** (32%) |
| Intentionally rejected (`UnsupportedTypedOperation`) | **10** (11%) |
| Structural / scaffolding (`Structural`) | **51** (57%) |
| Total ISLE rule count (across 14 `.isle` files) | **70** |
| ISLE rule files with real rules | 11 of 14 |

**Key finding:** The ISLE lowering boundary is well-defined and exhaustively classified. Every one of the 89 syntax kinds has an explicit disposition in `classify_syntax_node_kind()`. There are no "missing" or "orphaned" kinds — the 10 unsupported operations are intentionally release-rejected for v0.4 with documented rationales.

---

## 2. Architecture Overview

```
Syntax (89 kinds)
  │
  ├─ classify_syntax_node_kind()  ← beskid_isle/src/lib.rs
  │
  ├── IsleLowered (28 kinds)  ──→  ISLE rules (14 .isle files)
  │                                   │
  │                                   └── generated::Context impl
  │                                       (beskid_lower.rs, from build.rs)
  │
  ├── UnsupportedTypedOperation (10 kinds)  ──→  Rejection diagnostics
  │                                               (beskid_codegen/tests/isle_adapter.rs)
  │
  └── Structural (51 kinds)  ──→  Never lowered directly
                                   (container/helper AST nodes)
```

**Production pipeline:** `TypedProgram` → `CodegenInput` → ISLE → stock-verifier-clean CLIF (AOT-only, host composition). The old HIR/`Lowerable` path is retired (`retired_hir_lowering_path()`).

**ISLE DSL:** The compiler uses Cranelift's ISLE DSL. Rules are authored in 14 `.isle` files under `compiler/crates/beskid_isle/isle/` and compiled at build time by `build.rs` into `beskid_lower.rs`.

---

## 3. IsleLowered Constructs (28 syntax kinds → 28 ISLE NodeKinds)

### 3.1 Expressions

| Syntax Kind | ISLE NodeKind | Rule File | Rule Count |
|---|---|---|---|
| `LiteralExpression` | `LiteralExpression` | `literals.isle` | 5 (Integer, Float, String, Char, Boolean) |
| `GroupedExpression` | `GroupedExpression` | `expressions.isle` | 1 (transparent passthrough) |
| `UnaryExpression` | `UnaryExpression` | `unary_casts.isle` | 2 (Neg, Not) |
| `BinaryExpression` | `BinaryExpression` | `binary.isle`, `control_flow.isle`, `dispatch.isle` | 19 binary ops + 2 short-circuit + 3 string ops + 2 enum ops = 26 |
| `AssignExpression` | `AssignExpression` | `memory.isle` | 3 (local, field, index targets) |
| `CallExpression` | `CallExpression` | `calls.isle`, `runtime_intrinsics.isle`, `dispatch.isle` | 5 (Direct, PrimitiveNumericConversion, InlineLambda, RuntimeIntrinsic, Dynamic) |
| `PathExpression` | `PathExpression` | `memory.isle` | 1 (local read) |
| `MemberExpression` | `FieldExpression` | `memory.isle` | 1 (field read) |
| `IndexExpression` | `IndexExpression` | `memory.isle`, `dispatch.isle` | 2 (Array, String) |
| `ArrayLiteralExpression` | `ArrayLiteralExpression` | `memory.isle` | 1 |
| `StructLiteralExpression` | `StructLiteralExpression` | `memory.isle` | 1 |
| `EnumConstructorExpression` | `EnumLiteralExpression` | `memory.isle` | 1 |
| `MatchExpression` | `MatchExpression` | `memory.isle` | 2 (value + statement forms) |
| `RangeExpression` | `RangeExpression` | Used via ForStatement facts | — |
| `BlockExpression` | `BlockExpression` | `expressions.isle`, `statements.isle` | 2 (expr + stmt forms) |
| `SpawnExpression` | `SpawnExpression` | `expressions.isle` | 1 |

### 3.2 Statements

| Syntax Kind | ISLE NodeKind | Rule File | Rule Count |
|---|---|---|---|
| `ExpressionStatement` | `ExpressionStatement` | `statements.isle` | 1 |
| `ReturnStatement` | `ReturnStatement` | `statements.isle` | 1 |
| `LetStatement` | `LetStatement` | `statements.isle` | 1 |
| `IfStatement` | `IfStatement` | `control_flow.isle` | 1 |
| `WhileStatement` | `WhileStatement` | `control_flow.isle` | 1 |
| `BreakStatement` | `BreakStatement` | `control_flow.isle` | 1 |
| `ContinueStatement` | `ContinueStatement` | `control_flow.isle` | 1 |
| `ForStatement` | `ForStatement` | `control_flow.isle` | 2 (Range, Iterator/Other) |

### 3.3 Items

| Syntax Kind | ISLE NodeKind | Rule File | Rule Count |
|---|---|---|---|
| `Program` | `Program` | Top-level emission | — |
| `FunctionDefinition` | `FunctionDefinition` | `items.isle` | 1 (body extraction) |
| `TestDefinition` | `TestDefinition` | `items.isle` + `statements.isle` | 2 (body + statement) |
| `MethodDefinition` | `MethodDefinition` | `items.isle` + `statements.isle` | 2 (body + statement) |

### 3.4 Aliases

Two syntax kinds are intentionally aliased to the same ISLE `NodeKind` for convenience:
- `Literal` → `LiteralExpression` (wrapper and leaf share lowering)
- `Block` → `BlockExpression` (statement and expression blocks share lowering)

---

## 4. UnsupportedTypedOperation (10 kinds)

These 10 syntax kinds are intentionally **release-rejected** at the ISLE boundary. The compiler emits span-bearing diagnostic rejections for each (verified in `beskid_codegen/tests/isle_adapter.rs`).

| Syntax Kind | Rationale | Target Wave |
|---|---|---|
| `HostDefinition` | Composition host declaration; not an executable ISLE item | W5 (composition) |
| `RegistryBlock` | Composition registry block; not an executable ISLE item | W5 (composition) |
| `RegistryEntry` | Composition registry entry; not an executable ISLE item | W5 (composition) |
| `ScopeDefinition` | Composition scope definition; not an executable ISLE item | W5 (composition) |
| `ScopeHook` | Composition scope hook; not an executable ISLE item | W5 (composition) |
| `WithStatement` | Composition scope bracket; waits on container facts | W5 (composition) |
| `LaunchStatement` | Composition launch bracket; waits on container facts | W5 (composition) |
| `CodeStringLiteral` | Fenced code strings unsupported in both HIR and ISLE paths | TBD |
| `TryExpression` | Desugars to `match` before codegen; out of ISLE scope | CYB-174 (desugaring) |
| `LambdaExpression` | Freestanding lambda values | W4.2, CYB-25, CYB-173 |

**Known Linear issues:**
- **CYB-173** — LambdaExpression ISLE lowering (expression form)
- **CYB-174** — TryExpression desugaring to match control-flow (normalization, not ISLE)
- **CYB-25** — Freestanding lambda values (W4.2 milestone)

### 4.1 Composition Group (W5)

Five kinds (`HostDefinition`, `RegistryBlock`, `RegistryEntry`, `ScopeDefinition`, `ScopeHook`) are composition declarations that never produce executable code directly. Two more (`WithStatement`, `LaunchStatement`) are composition scope brackets that require container facts not yet available in the ISLE boundary. All seven gate on the W5/composition milestone.

### 4.2 TryExpression (CYB-174)

`TryExpression` is lowered to HIR but **must be desugared** to `match` control-flow during normalization, before codegen. It does not need ISLE rules — it needs a normalization pass in `beskid_analysis`.

### 4.3 LambdaExpression (CYB-173, CYB-25)

Freestanding lambda values are not yet lowered. This is the primary expression-level gap. The HIR already defines `HirLambdaExpression` with parameters and body, and the AST→HIR lowering preserves it, but the ISLE boundary classifies it as `UnsupportedTypedOperation`.

---

## 5. Structural Kinds (51 kinds)

These are language scaffolding / helper nodes that are never directly lowered through ISLE. They serve as containers, type wrappers, declarations, or macro artifacts.

### 5.1 Container / Wrapper Nodes (7)

`Node`, `Statement`, `Expression`, `Block`, `ElseBranch`, `MatchArm`, `Pattern`

### 5.2 Type System Nodes (5)

`Type`, `Path`, `PathSegment`, `EnumPath`, `PrimitiveType`

### 5.3 Declaration / Module Nodes (8)

`ConstantDefinition`, `ExtendTypeDefinition`, `TypeDefinition`, `EnumDefinition`, `EnumVariant`, `ModuleDeclaration`, `InlineModule`, `UseDeclaration`

### 5.4 Contract Nodes (4)

`ContractDefinition`, `ContractNode`, `ContractMethodSignature`, `ContractEmbedding`

### 5.5 Attribute Nodes (5)

`Attribute`, `AttributeDeclaration`, `AttributeTarget`, `AttributeParameter`, `AttributeArgument`

### 5.6 Test Metadata Nodes (4)

`TestMetaSection`, `TestMetadataEntry`, `TestSkipSection`, `TestSkipEntry`

### 5.7 Code String / String Interpolation (2)

`CodeStringSegment`, `StringLiteralPart`

### 5.8 Pattern Matching (2)

`EnumPattern`, `Literal`

### 5.9 Field / Parameter / Identifier / Visibility (5)

`Field`, `Parameter`, `Identifier`, `Visibility`, `StructLiteralField`

### 5.10 Host / Composition (1)

`HostBodyItem`

### 5.11 Macro System (4)

`MacroFragmentKind`, `MacroParameter`, `MacroDefinition`, `MacroInvocation`, `MacroMetavariable`

### 5.12 Operator Enums (2)

`BinaryOp`, `UnaryOp`

### 5.13 Lambda (1)

`LambdaParameter`

---

## 6. ISLE Rule File Inventory

| File | Rules | Purpose |
|---|---|---|
| `types.isle` | 0 | Type definitions for ISLE DSL (NodeKind, CallKind, etc.) |
| `ast.isle` | 0 | Extractor/constructor declarations for AST facts |
| `primitives.isle` | 0 | CLIF primitive declarations (iconst, load, store, icmp, fadd, etc.) |
| `expressions.isle` | 3 | GroupedExpression, BlockExpression, SpawnExpression |
| `literals.isle` | 5 | Integer, Float, String, Char, Boolean literals |
| `binary.isle` | 19 | All binary operators (arithmetic, comparison, bitwise, enum eq) |
| `unary_casts.isle` | 2 | Negation, logical not |
| `calls.isle` | 3 | Direct, PrimitiveNumericConversion, InlineLambda calls |
| `runtime_intrinsics.isle` | 1 | RuntimeIntrinsic calls |
| `dispatch.isle` | 5 | Dynamic dispatch, string concatenation/comparison/indexing |
| `statements.isle` | 10 | All statement forms + expression statements + item bodies |
| `control_flow.isle` | 8 | Short-circuit AND/OR, if/else, while, for, break, continue |
| `memory.isle` | 11 | Locals, arrays, structs, enums, match, field/index access |
| `items.isle` | 3 | FunctionDefinition, TestDefinition, MethodDefinition body extraction |
| **Total** | **70** | |

---

## 7. Recommended Linear Issue Groups

### Group A: Expression Forms (priority: W4.2)

**Issue:** "ISLE lowering for LambdaExpression and TryExpression"  
**Covers:** `LambdaExpression`, `TryExpression`  
**Depends on:** CYB-25 (closure/lambda type system), CYB-174 (try desugaring)  
**Notes:** `LambdaExpression` needs ISLE lowering rules (via closure environment/allocation facts). `TryExpression` needs desugaring to `match` control-flow during HIR normalization, not ISLE rules per se.

### Group B: Composition Constructs (priority: W5)

**Issue:** "ISLE lowering for composition scope brackets (with/launch) and host declarations"  
**Covers:** `WithStatement`, `LaunchStatement`, `HostDefinition`, `RegistryBlock`, `RegistryEntry`, `ScopeDefinition`, `ScopeHook`  
**Depends on:** Composition container facts in ISLE boundary  
**Notes:** Currently blocked on container fact infrastructure. All seven kinds should be enabled together when composition facts are available.

### Group C: CodeStringLiteral (priority: TBD)

**Issue:** "ISLE lowering for CodeStringLiteral"  
**Covers:** `CodeStringLiteral`  
**Notes:** Currently unsupported in both HIR and ISLE paths. AST→HIR lowering desugars code strings to string concatenation via `lower_code_string_expression()`, but the raw `CodeStringLiteral` AST node is still classified as unsupported at the ISLE boundary.

---

## 8. CI/Test Commands

| Command | What it runs |
|---|---|
| `just corelib` | Corelib tests via release `beskid_cli` (`compiler/corelib/beskid_corelib/tests/corelib_tests`) |
| `just compiler` | Full compiler workspace `cargo test` |
| `just tests` | Both corelib + compiler |
| `just replace` | Build release CLI + LSP, overwrite installed binaries |

ISLE coverage tests live in:
- `compiler/crates/beskid_isle/tests/rule_coverage.rs` — exhaustive catalogue verification
- `compiler/crates/beskid_codegen/tests/isle_adapter.rs` — rejection evidence for unsupported kinds
- `compiler/crates/beskid_codegen/tests/parsed_project_isle_harness.rs` — end-to-end lowering harness

---

## 9. Verification Checklist

- [x] Every `IndexedNodeKind` variant has an explicit arm in `classify_syntax_node_kind()`
- [x] No silent catch-all fallback exists in the classification
- [x] `UNSUPPORTED_TYPED_OPERATION_KINDS` constant matches the classify function bijectively
- [x] Every unsupported kind has a documented rejection rationale for v0.4
- [x] Every `NodeKind` (ISLE) variant has a CLIF evidence test file
- [x] Every ISLE rule group file contains at least one real rule
- [x] All binary/unary operator facts have corresponding ISLE rules
- [x] MethodDefinition and SpawnExpression are confirmed production-supported (not unsupported)
