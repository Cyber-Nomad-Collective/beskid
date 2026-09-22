---
id: foundations_values
title: Values, literals, and types
context: foundations
objective: Explain literals as values and types as operation contracts.
prerequisites: ["foundations_main"]
command: analyze
difficulty: beginner
category: foundations
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/language-meta--type-system--types/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"foundations_values_q1","text":"In let name = 42, what is 42?","options":["An integer literal bound to name","The name of the variable"],"correctIndex":0}]
---

## Hook and goal

An inventory label prevents a map, a key, and a coin being confused. Learn the difference between a written literal and its promised shape.

## Predict

In `i32 score = 7`, predict which part is a value, which is a name, and which is a type.

## Run

```beskid
i32 Main() {
  let name = 42;
  return 0;
}
```

Reference-only while literals and declaration syntax are reverified against the active parser.

## Investigate

A literal writes an immediate value. A type describes permitted operations and required shapes at a boundary. Explicit types make callers' expectations visible.

## Modify

Classify three planned values as integer, Boolean, or text, then state one operation each category should not silently accept.

## Make and retrieve

Make a source/value/type table. From memory, finish: “a literal is written; a type is …”.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

When types conflict, first write expected and found. An annotation cannot make an incompatible value mean something else.

## Recap and next link

Values have shapes; names keep them available.
