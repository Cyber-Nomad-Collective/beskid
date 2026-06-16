---
title: Type inference - FAQ and troubleshooting
description: Common issues, troubleshooting, and locked decisions for Beskid type inference.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## Locked decisions

| Decision | ID | Summary |
| --- | --- | --- |
| Fail on ambiguity | D-LM-INF-001 | Prefer errors over guessing |
| Public API annotations | D-LM-INF-002 | Exported functions should declare return types |
| No nullable inference | D-LM-INF-003 | Inference must not introduce nullable types |
| Contextual lambdas | D-LM-INF-004 | Untyped parameters need expected function type |

## FAQ

### Why does `let x = []` fail?

The compiler cannot infer the element type of an empty array without context. Add an explicit type: `let i32[] x = [];`.

### Do I need to annotate every variable?

No. Simple literals and expressions with unambiguous types infer automatically. Annotate when the type is not obvious from the initializer.

### Can inference fail across function boundaries?

Return type inference works within a single function body. Cross-function inference is not supported; function signatures must be self-contained.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **E1202** | Ambiguous type — add explicit annotation |
| **E1203** | Missing generic arguments at call site |
| **W1203** | Implicit numeric narrowing — add explicit cast |
| Lambda parameter error | No expected function type in context |
