---
id: reliability_generics
slug: generic-reusable-code
title: Reuse the rule, not the accident
context: reliability-and-abstraction
objective: Explain how type parameters make reusable code vary only where its contract allows.
category: reliability-and-abstraction
difficulty: intermediate
prerequisites: ["reliability_errors"]
command: reference
source: openspec/specs/language-meta--type-system--types/spec.md
vocabulary: ["boundary","contract","reliability","and"]
hints: ["A generic varies a declared type role rather than weakening all checking."]
questions: [{"id":"reliability_generics_q1","text":"Predict why an ordering helper needs a comparison capability instead of assuming numbers.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain how type parameters make reusable code vary only where its contract allows. A generic varies a declared type role rather than weakening all checking.

## Predict

Predict why an ordering helper needs a comparison capability instead of assuming numbers.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
type Box<T> {
  T value,
}
```

## Investigate

Generic arguments fill named type parameters. Arity is checked at use sites; generic code remains constrained by its stated operations.

## Modify

Describe a Cache<T>: which operations are independent of T and which require more capability?

## Make and retrieve

Make the sentence “generic code varies ___.” Retrieve its missing word.

## Failure clinic

```beskid
// Bad use: Box declares one type parameter, not two.
Box<i32, string> score;
```

Do not add a generic just to hide an unclear API.

## Recap and next link

Generics make variation explicit. Next: state behavioral conformance.
