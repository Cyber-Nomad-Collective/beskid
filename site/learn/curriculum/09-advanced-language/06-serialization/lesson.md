---
id: advanced_serialization
slug: serialization
title: Turn values into portable records carefully
context: advanced-language
objective: Treat serialization as an explicit contract between data shape, version, and error handling.
category: advanced-language
difficulty: intermediate
prerequisites: ["advanced_mods"]
command: reference
source: openspec/specs/language-meta--metaprogramming--serialization/spec.md
vocabulary: ["boundary","contract","advanced","language"]
hints: ["Serialization preserves a stated representation, not every implementation detail."]
questions: [{"id":"advanced_serialization_q1","text":"Predict what breaks when a stored field changes without a version or compatibility rule.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Treat serialization as an explicit contract between data shape, version, and error handling. Serialization preserves a stated representation, not every implementation detail.

## Predict

Predict what breaks when a stored field changes without a version or compatibility rule.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Reference-only serialization design: the Mod owns [Serialize] generation.
[Serialize]
type QuestRecord { string title, i32 score }
```

## Investigate

Reference-only: serialization APIs and generated forms require verified feature support.

## Modify

Define one record’s stable fields, absent-field policy, version, and malformed-input outcome.

## Make and retrieve

Make a serialization contract card and retrieve it.

## Failure clinic

```beskid
// Bad compatibility policy: stored shape changes without a version/migration rule.
type QuestRecord { i32 points }
```

Do not serialize private layout merely because it is convenient today.

## Recap and next link

Portable data needs a versioned agreement. Next: cross an FFI boundary cautiously.
