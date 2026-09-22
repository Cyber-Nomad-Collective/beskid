---
id: advanced_mods
slug: mods-and-conditional-compilation
title: Let tools contribute under a contract
context: advanced-language
objective: Explain compiler mods as constrained tooling contributions rather than hidden source mutation.
category: advanced-language
difficulty: intermediate
prerequisites: ["advanced_macros"]
command: reference
source: openspec/specs/compiler--compiler-mods--mod-host-bridge/spec.md
vocabulary: ["boundary","contract","advanced","language"]
hints: ["Mods are governed contributions with declared capabilities and diagnostics."]
questions: [{"id":"advanced_mods_q1","text":"Predict why generated code still needs the same semantic checks as handwritten code.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain compiler mods as constrained tooling contributions rather than hidden source mutation. Mods are governed contributions with declared capabilities and diagnostics.

## Predict

Predict why generated code still needs the same semantic checks as handwritten code.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Reference-only compiler-mod flow:
// source -> declared capability -> typed AST contribution -> analysis
```

## Investigate

Reference-only: mod host execution needs a project artifact and capability setup.

## Modify

Draw input source, mod capability, generated contribution, analysis, and diagnostics.

## Make and retrieve

Make a mod review ledger and retrieve who owns each generated declaration.

## Failure clinic

```beskid
// Bad mod behavior: emitting untyped formatted text bypasses the host contract.
macro GeneratedText() { }
```

Do not allow an unconstrained generator to bypass language or project rules.

## Recap and next link

Mods extend tooling under contracts. Next: make serialization boundaries explicit.
