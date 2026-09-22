---
id: foundations_expressions
title: Operators and expressions
context: foundations
objective: Evaluate a small expression and its type before running a tool.
prerequisites: ["foundations_bindings"]
command: analyze
difficulty: beginner
category: foundations
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/language-meta--type-system--types/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"foundations_expressions_q1","text":"What is evaluated before the equality comparison in first + second == 3?","options":["The addition first + second","The return statement"],"correctIndex":0}]
---

## Hook and goal

Expressions are workshop stations: each takes values and produces a value. Learn to trace the stations before asking the compiler.

## Predict

For a nested calculation, predict each inner result and its type.

## Run

```beskid
i32 Main() {
  return 1 + 2;
}
```

Reference-only until the precise operator surface is compiler-verified for this curriculum.

## Investigate

An expression produces a value; operators require compatible operands and produce a result type. Parentheses make intended grouping visible when precedence would distract a reader.

## Modify

Add parentheses to a paper expression and say whether behavior or only readability changes.

## Make and retrieve

Make a trace table: subexpression, input types, result. Retrieve why an operand error may not be an operator error.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

Inspect operand types before replacing an operator. Preserve intended grouping while repairing the mismatched input.

## Recap and next link

Expressions compute values. Next, name a computation as a function.
