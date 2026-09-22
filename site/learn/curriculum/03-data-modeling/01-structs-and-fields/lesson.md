---
id: data_structs
title: Structs and fields
context: data-modeling
objective: Group related facts under one identity and state its invariant.
prerequisites: ["flow_retrieval"]
command: reference
difficulty: intermediate
category: data-modeling
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/language-meta--type-system--types/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"data_structs_q1","text":"What makes two fields belong in the same struct?","options":["They describe one identity and lifecycle","They happen to share a primitive type"],"correctIndex":0}]
---

## Hook and goal

A character sheet holds facts about one character, not every fact in the game. Model identity before fields.

## Predict

Predict whether name, health, and location belong to one entity or unrelated locals.

## Run

```beskid
// Source-shaped model; verify declaration syntax before compiling.
struct Quest { i32 reward; }
```

Reference-only until active compiler fixtures establish struct declaration and construction syntax.

## Investigate

A struct gives a named shape to related fields. Its invariant describes meaningful combinations; fields should share identity and lifecycle, not merely be convenient to store together.

## Modify

Sketch a `Quest` record with required, optional, and derived facts.

## Make and retrieve

Make a record card: entity, fields with types, invariant. Retrieve why it is more than a large variable.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

If a record becomes a junk drawer, split by identity or responsibility; do not duplicate facts that can disagree.

## Recap and next link

Structs hold related facts. Next, give a typed receiver behavior.
