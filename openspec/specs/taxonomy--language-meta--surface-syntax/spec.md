<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Surface Syntax Specification

## Purpose

This capability preserves and governs the migrated Beskid standard contract for Surface Syntax, including its legacy provenance and review status.

## Requirements

### Requirement: Surface Syntax conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-ADF04C2BED00`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Surface Syntax

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/surface-syntax/`  
**Source:** `site/spec-content/platform-spec/language-meta/surface-syntax/content.md`  
**SHA-256:** `05a22079e9c2e22d0e9afa587529cdd6b20db12367bd6abf1406b301da58f48a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Overview

The Surface Syntax area defines the lexical and syntactic structure of Beskid — the token-level rules and grammar productions that form the foundation for all later semantic analysis. Every feature hub in the language semantics domain may introduce new syntax forms that build upon this base.

## Features

### Lexical and syntax

The foundational grammar for Beskid: identifiers, keywords, literals, comments, whitespace rules, and the top-level program structure. All other features extend this base grammar.

- **Grammar authority:** `beskid.pest` is the single syntactic truth.
- **Compiler contract:** The pest grammar produces syntax items consumed by the parser facade (`beskid_compiler_syntax_facade`).
- **Diagnostic band:** E115x for HIR/syntax-level diagnostics.

### Documentation comments

Structured `///` comments that attach human-readable contracts to declarations. Tooling must preserve them through formatting and refactors without changing semantics.

## Cross-cutting concerns

- Syntax forms defined in other areas (e.g., `spawn` in evaluation, `match` in type system) extend the base grammar from this area. Each feature hub should specify its syntax using PEST grammar excerpts.
- The formatter (`tooling/formatter/`) operates on the AST produced by parsers built on this grammar.
- Compiler mods (`compiler/compiler-mods/`) consume the syntax domain model for code generation.

## Related areas

- [Lexical and Syntax](../surface-syntax/lexical-and-syntax/) — the authoritative feature hub
- [Compiler front-end](/platform-spec/compiler/front-end/) — how the compiler consumes this grammar
- [Compiler mods / syntax facade](/platform-spec/compiler/compiler-mods/beskid-compiler-syntax-facade/) — mod-side access to syntax structures
``````

</details>
