---
id: advanced_ffi
slug: ffi-boundaries
title: Cross the border with a manifest
context: advanced-language
objective: Explain FFI as a declared ABI boundary with explicit types, ownership, and linking rules.
category: advanced-language
difficulty: intermediate
prerequisites: ["advanced_serialization"]
command: reference
source: openspec/specs/language-meta--interop--ffi-and-extern/spec.md
vocabulary: ["boundary","contract","advanced","language"]
hints: ["Foreign calls need an ABI contract, not a guessed signature."]
questions: [{"id":"advanced_ffi_q1","text":"Predict why matching a function name is insufficient evidence that a foreign call is safe.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain FFI as a declared ABI boundary with explicit types, ownership, and linking rules. Foreign calls need an ABI contract, not a guessed signature.

## Predict

Predict why matching a function name is insufficient evidence that a foreign call is safe.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Reference boundary record: ABI C, symbol quest_score, i32 -> i32.
extern i32 quest_score(i32 questId);
```

## Investigate

Reference-only: FFI requires project link metadata and target-specific verification.

## Modify

For a foreign function, record ABI, symbol, parameter representation, result representation, ownership, and failure mode.

## Make and retrieve

Make an FFI border card and retrieve every field.

## Failure clinic

```beskid
// Bad FFI assumption: a name alone does not establish pointer ownership or ABI.
extern pointer quest_score(pointer questId);
```

Do not call unmanifested symbols or assume platform layouts coincide.

## Recap and next link

FFI is a strict boundary. Next: understand the memory rules that keep all boundaries safe.
