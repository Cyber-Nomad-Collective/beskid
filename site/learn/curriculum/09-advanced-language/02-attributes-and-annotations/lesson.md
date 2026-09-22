---
id: advanced_attributes
slug: attributes-and-annotations
title: Attach a label with consequences
context: advanced-language
objective: Explain attributes as declared metadata whose meaning belongs to a consuming tool or rule.
category: advanced-language
difficulty: intermediate
prerequisites: ["advanced_extend"]
command: reference
source: openspec/specs/language-meta--surface-syntax--lexical-and-syntax/spec.md
vocabulary: ["boundary","contract","advanced","language"]
hints: ["An attribute is metadata; its effect must be specified by a consumer."]
questions: [{"id":"advanced_attributes_q1","text":"Predict why an unknown annotation should not be assumed to change a program.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Explain attributes as declared metadata whose meaning belongs to a consuming tool or rule. An attribute is metadata; its effect must be specified by a consumer.

## Predict

Predict why an unknown annotation should not be assumed to change a program.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
[Trace]
i32 Score() { return 0; }
```

## Investigate

Reference-only: attribute consumers and exact accepted arguments require feature-specific verification.

## Modify

For a proposed attribute, name its target, arguments, consumer, and observable effect.

## Make and retrieve

Make an annotation contract card and retrieve it.

## Failure clinic

```beskid
// Bad: unknown/invalid attribute target has no declared consumer.
[Trace]
let score = 0;
```

Do not add decorative metadata with no specified reader.

## Recap and next link

Attributes are contracts with tools. Next: write documentation comments that attach correctly.
