---
title: Contracts
description: Structural contract declarations, conformance lists, and embedding.
  Distinct from compiler Mod SDK contracts and from runtime requires/ensures
  (not in v0.1 grammar).
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-21
---

## Normative specification

### Scope

Defines **`contract` declarations** — structural interfaces that types **implement** via conformance lists. This is distinct from **compiler Mod contracts** ([Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/)).

### Syntax

```beskid
contract Disposable
{
    unit Dispose();
}
```

- **`contract Name { items }`** declares required members.
- Items **may** be method signatures (`T name(params);`) or **embeddings** (`OtherContract;`) that flatten member requirements.
- Types declare implementation with **`type T : I, J { … }`**.

### Static rules

- Implementing types **must** supply every required member with compatible signature (**E1601**, **E1602**, **E1606**).
- Conflicting embedded contract methods **must** error (**E1004**).
- Duplicate contract method names in one contract **must** error (**E1003**).
- Invalid conformance targets **must** error (**E1607**).

### Dynamic semantics

- Contract calls use static dispatch on the receiver’s type after conformance is proven.
- Contracts **may** be used as namespaces for static-style calls when the resolver provides contract-as-namespace fallback.

### Diagnostics

Contract band **E1601–E1607**. Registry: [Diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

### Conformance

All `Standard` types advertising conformance **must** pass contract satisfaction in the reference compiler.

## Decisions

- **D-LM-CON-001 — Structural contracts:** Beskid contracts are nominal surfaces checked structurally, not runtime interface tables in v0.1.
- **D-LM-CON-002 — Embedding:** Contract embedding composes requirements without inheritance syntax.
- **D-LM-CON-003 — No `requires`/`ensures` in v0.1:** Design-by-contract assertions are deferred; `contract` items are interface shapes only.
- **D-LM-CON-004 — Distinct from Mod SDK:** Compiler mod `contract` placements follow [Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/), not this user-language surface.

## Implementation anchors
- `compiler/crates/beskid_analysis/src/types/` — contract declaration and structural conformance checking
- `compiler/crates/beskid_analysis/src/analysis/` — diagnostic emission for contract violations (E1601–E1607)

## Platform view

Structural `contract` declarations and type conformance lists. Compiler mods and optional future runtime contract checks are specified elsewhere.
