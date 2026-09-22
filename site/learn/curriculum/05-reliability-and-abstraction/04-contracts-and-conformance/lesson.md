---
id: reliability_contracts
slug: contracts-and-conformance
title: Promise behavior, not resemblance
context: reliability-and-abstraction
objective: Use contracts to declare the capabilities a type offers to callers.
category: reliability-and-abstraction
difficulty: intermediate
prerequisites: ["reliability_generics"]
command: reference
source: openspec/specs/language-meta--contracts-and-effects--contracts/spec.md
vocabulary: ["boundary","contract","reliability","and"]
hints: ["A contract is an explicit capability promise checked by conformance."]
questions: [{"id":"reliability_contracts_q1","text":"Predict why two lookalike fields do not necessarily mean two types share a supported behavior.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Use contracts to declare the capabilities a type offers to callers. A contract is an explicit capability promise checked by conformance.

## Predict

Predict why two lookalike fields do not necessarily mean two types share a supported behavior.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
contract QuestStore {
  // The owning package declares callable members here.
}
```

## Investigate

Contracts name behavior that callers may rely on; conformance is a checked declaration rather than a coincidence of member shapes.

## Modify

For a storage capability, list operations callers need and details they must not know.

## Make and retrieve

Make a capability statement and retrieve why it belongs at a boundary.

## Failure clinic

```beskid
// Bad boundary: consumers depend on storage instead of a contract operation.
store.entries;
```

Do not make a contract for a single local helper with no interchangeable provider.

## Recap and next link

Contracts protect behavior across implementations. Next: put local behavior into callable values.
