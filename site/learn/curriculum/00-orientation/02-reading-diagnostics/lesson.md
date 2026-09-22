---
id: orientation_diagnostics
context: orientation
title: Read diagnostics as evidence
objective: Locate the first relevant compiler diagnostic, identify its phase, and make a narrow repair.
prerequisites: ["orientation_learning_loop"]
command: parse
difficulty: beginner
category: orientation
vocabulary: ["diagnostic", "source span", "parse", "resolution", "type checking"]
source: openspec/specs/compiler--front-end--grammar-and-parser-contract/spec.md
hints: ["Start with the earliest actionable diagnostic.", "Separate the marked code from follow-on messages."]
questions: [{"id":"orientation_diagnostics_q1","text":"Which diagnostic should you usually investigate first?","options":["The earliest actionable diagnostic","The message with the most unfamiliar words"],"correctIndex":0}]
---

## Hook and goal

A compiler diagnostic is a trail marker, not an insult and not a patch recipe. It tells you where the compiler lost a required relationship and often which phase noticed it. Your goal is to translate that marker into a small hypothesis, repair the cause, and recheck without creating a larger mystery.

## Predict

Imagine a function whose declared return type and returned value disagree. Predict the phase most likely to complain: parsing, name resolution, or type checking. Then predict what facts the message needs to show you before you edit: location, expected shape, found shape, and rule.

## Run

```beskid
i32 Main() {
  return 42;
}
```

Reference-only: diagnostic wording and source locations are compiler-version evidence, so this lesson does not freeze a made-up error transcript. In an interactive package, run the command named in that package and preserve the observed message when reporting a real issue.

## Investigate

Read feedback in this order:

1. **Location** — open the primary marked span and enough surrounding code to see its role.
2. **Phase** — decide whether the issue is syntax/parsing, name resolution, type compatibility, or a later command boundary.
3. **Expectation** — state what the position promised, such as a declared type, known name, or closing delimiter.
4. **Observed code** — state what the compiler actually saw.
5. **Smallest cause** — identify the earliest edit that could make expectation and observation agree.

One early parse problem can cascade into noisy later messages. Conversely, a well-formed parse can still contain a name that resolves nowhere or a value that violates a type promise. The phase changes the repair strategy.

## Modify

Translate three hypothetical messages into plain language:

- missing delimiter → the program's written shape cannot be parsed;
- unknown identifier → this use has no declaration in scope;
- incompatible return → the expression does not meet the function's promised output.

For each, write one narrow repair and one tempting but unrelated edit you will avoid.

## Make and retrieve

Make a diagnostic note with five headings: *location, phase, expected, found, smallest repair*. Now cover the lesson and classify those three hypothetical messages from memory. On the next real error, fill in the note before changing source.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

Do not fix the last message first when an earlier parse diagnostic remains. Do not “solve” an unknown name by renaming unrelated declarations. Do not widen a public type merely to quiet one incompatible value. Fix the first causal mismatch, rerun the same command, and only then interpret remaining diagnostics.

## Recap and next link

Diagnostics become useful when you locate the code, name the phase, and repair one causal mismatch. With that habit established, the foundations lessons introduce typed values, bindings, expressions, and functions.
