---
title: "Beskid Semantic Analysis Specification"
description: Beskid Semantic Analysis Specification
---


## Goals
- Provide a structured, staged semantic analysis pipeline for Beskid.
- Enable ergonomic diagnostics creation (macro-based) with rich source spans.
- Build on existing AST query API for traversal and rule execution.

## Diagnostics Model
### Diagnostic Type
Use miette-based diagnostics for consistent, Rust-like errors.

**Core fields**
- `code`: stable error code string (e.g., `R0001`, `T0009`).
- `message`: primary error text.
- `span`: source span (byte range) for label.
- `help`: optional guidance.
- `severity`: `Error | Warning | Note`.
- `source`: named source for snippet rendering.

**Implementation sketch**
```rust
#[derive(thiserror::Error, miette::Diagnostic, Debug)]
#[error("{message}")]
pub struct SemanticDiagnostic {
    #[source_code]
    pub source: miette::NamedSource<String>,
    #[label("{label}")]
    pub span: miette::SourceSpan,
    pub message: String,
    pub label: String,
    #[help]
    pub help: Option<String>,
    pub code: Option<String>,
    pub severity: Severity,
}
```

### Diagnostic Macro
Provide a macro for concise authoring:
```rust
// diag!(ctx, span, code, message, label = "...", help = "...")
```
Macro should:
- convert `SpanInfo` into `SourceSpan`.
- capture source from context.
- attach code and severity.

### Diagnostic Categories
- **Name Resolution** (`R0xxx`)
- **Name Resolution Warnings** (`R1xxx`)
- **Type Checking** (`T0xxx`)

## Rule Engine
### Rule Trait
```rust
pub trait Rule {
    fn name(&self) -> &'static str;
    fn run(&self, ctx: &mut RuleContext, program: &Program);
}
```

### RuleContext
Holds shared analysis state:
- `source_name: String`
- `source: String`
- `diagnostics: Vec<SemanticDiagnostic>`
- `options: AnalysisOptions`

### Rule Execution
Rules are organized in semantic stages and executed deterministically:
- **Stage 0**: prelude building (collect type/enum/contract signatures)
- **Stage 1**: name resolution + scoping
- **Stage 2**: type checking (expressions, calls, returns)
- **Stage 3**: control flow + patterns

### Query Integration
Rules should use `Query` API:
- `Query::from(program).descendants()`
- `of::<Type>()`, `filter_typed()` helpers

## Current Integration Status
- Resolver/type diagnostics are emitted via `builtin_rules()`.
- CLI `analyze` runs builtin rules and prints miette diagnostics.
- Resolver and type errors are mapped to codes `R0001..` and `T0001..`.

## Semantic Data Structures
### Symbol Table
- Scope stack with shadowing rules.
- Entries: `SymbolKind` (Var, Function, Type, EnumVariant, ContractMethod).
- Store `SpanInfo` for diagnostics.

### Type Database
- Collect `type`, `enum`, `contract` definitions.
- Map type names to definitions.
- Map enum variants to fields/signatures.

## Staged Rule List (Initial)
### Stage 0: Collection
- Duplicate type/enum/contract name
- Duplicate enum variant in same enum
- Duplicate contract method signature

### Stage 1: Name Resolution
- Undefined variable
- Use before declaration (if required)
- Duplicate binding in same scope
- Shadowing (warn)

### Stage 2: Type Checking
- Unknown type name in annotation
- Unknown enum path
- Assignment type mismatch
- Return type mismatch
- Call argument count mismatch
- Field access on non-struct
- Struct literal unknown fields / missing fields
- Enum constructor arity mismatch
- Contract argument/assignment compatibility requires explicit conformance (`type Type : Contract`)

### Stage 6: Contracts & Methods
- Declared conformance validation (`type Type : Contract` + `impl Type { ... }`)
- Missing required contract methods for declared conformance
- Contract method signature mismatch for declared conformance
- Contract not satisfied when explicit declaration is missing

### Stage 3: Control Flow & Patterns
- `break/continue` outside loop
- Non-boolean condition in `if`/`while`
- Match arm type mismatch
- Non-exhaustive match (optional)
- Duplicate bindings in pattern

## Diagnostics UX
- Prefer label text like `"expected i32, found string"`.
- Provide help for common issues (e.g., missing field).
- Use stable codes to enable suppression later.

## Output Format
- CLI should output miette diagnostics with proper file/line snippets.
- Optionally support `--format=json` for machine-readable diagnostics.

## Conformance expectations

An implementation conforms to this document when it provides:

1. A deterministic rule execution model over the same input program.
2. Stable diagnostic categories and codes for equivalent semantic failures.
3. Source-accurate diagnostic ranges for parser-resolved spans.
4. Consistent behavior between CLI analysis and editor/LSP analysis surfaces.
5. A single semantic source of truth in `beskid_analysis` reused by downstream tools.
