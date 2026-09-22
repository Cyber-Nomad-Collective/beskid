---
id: foundations_main
title: Main and exit codes
context: foundations
objective: Make a valid entry point and explain what its result communicates.
prerequisites: []
command: analyze
difficulty: beginner
category: foundations
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/tooling--cli--build-analyze-run-contract/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"foundations_main_q1","text":"Which line supplies the value promised by an i32 Main signature?","options":["The return expression","The closing brace"],"correctIndex":0}]
---

## Hook and goal

A program begins at a named, typed doorway. Explain `Main`, its return promise, and the host-facing result.

## Predict

Predict which token chooses the entry point and whether `return 0` is a command or a value.

## Run

```beskid
i32 Main() {
  return 0;
}
```

Reference-only until this lesson has a current compiler fixture. Compare the active entry-point specification with the existing Learn smoke example before promoting source to interactive.

## Investigate

`Main` is an entrypoint contract; its signature states the shape of completion. A return expression must meet the declared return type. Diagnostics are evidence about a marked source location and rule.

## Modify

Change the intended exit value on paper, then state what has not changed: entrypoint identity and return type.

## Make and retrieve

Write a launch card: entrypoint, return type, success result. From memory, explain why the type belongs in the signature.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

Do not guess at a marked token. Separate an entrypoint-name problem from an incompatible-return problem, then fix the earliest diagnostic.

## Recap and next link

Typed entrypoints make program boundaries explicit. Next, distinguish written literals from their types.
