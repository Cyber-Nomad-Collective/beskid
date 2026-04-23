---
title: "Glossary and Conformance"
---


## Purpose
This document defines canonical terminology and conformance language used across Beskid specifications.

## Conformance keywords
Normative documents use these terms:
- **MUST**: absolute requirement.
- **SHOULD**: strong recommendation unless a documented reason exists.
- **MAY**: optional behavior.

## Canonical term ownership
- Language grammar/syntax terms: `docs/spec/lexical-and-syntax.md`.
- Type-system terms: `docs/spec/types.md`.
- Lambda/closure semantics: `docs/spec/lambdas-and-closures.md`.
- Event semantics: `docs/spec/events.md`.
- FFI/Extern language contract: `docs/spec/ffi-and-extern.md`.
- Test harness syntax/semantics: `docs/spec/testing.md`.
- Runtime ABI/syscall ownership: `docs/execution/runtime/syscalls-and-abi-boundary.md`.
- Corelib API contracts: `docs/corelib/`.

## Distinct feature rule
Each language/runtime feature has exactly one canonical definition location.
Other documents should reference the canonical location instead of redefining behavior.

## Cross-spec coupling rule
When behavior spans multiple areas:
1. Define language semantics in `docs/spec`.
2. Define lowering/runtime behavior in `docs/execution`.
3. Define API surface in `docs/corelib`.
4. Link across documents; do not duplicate definitions.
