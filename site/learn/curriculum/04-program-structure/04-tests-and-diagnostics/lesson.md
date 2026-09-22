---
id: structure_tests
slug: tests-and-diagnostics
title: Turn failures into evidence
context: program-structure
objective: Choose diagnostics or tests based on the claim being protected.
category: program-structure
difficulty: intermediate
prerequisites: ["structure_projects"]
command: reference
source: openspec/specs/language-meta--contracts-and-effects--testing/spec.md
vocabulary: ["boundary","contract","program","structure"]
hints: ["A diagnostic proves rejection; a test protects behavior."]
questions: [{"id":"structure_tests_q1","text":"Which evidence protects rejection of invalid source?","options":["A diagnostic fixture","A runtime output assertion"],"correctIndex":0}]
---

## Hook and goal

Choose diagnostics or tests based on the claim being protected. A diagnostic proves rejection; a test protects behavior.

## Predict

Predict whether an invalid return type belongs in runtime output testing or a diagnostic fixture.

## Run

```beskid
i32 Main() {
  return 0;
}
```

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
test AddReturnsSum() {
  // A test item owns a focused behavioral claim.
}
```

## Investigate

Diagnostics describe invalid source at a phase; tests establish intended behavior for valid source. Keep a fixture small enough to explain one rule.

## Modify

Classify unknown type, arithmetic output, and closed-channel behavior by the evidence each needs.

## Make and retrieve

Make a bug card: smallest source, command, observation, expected rule. Retrieve why it is useful.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

```beskid
// Bad diagnostic fixture: the return violates its declared result type.
i32 Score() { return "high"; }
```

Do not assert only a nonzero exit; state which rule must be rejected.

## Recap and next link

Tests protect behavior and diagnostics protect rules. Next: model expected failure as data.
