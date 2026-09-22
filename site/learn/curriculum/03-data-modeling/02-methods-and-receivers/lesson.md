---
id: data_methods
title: Methods and receivers
context: data-modeling
objective: Resolve a method call from the receiver's static type.
prerequisites: ["data_structs"]
command: reference
difficulty: intermediate
category: data-modeling
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/language-meta--type-system--method-dispatch/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"data_methods_q1","text":"What does static dispatch inspect first for receiver.method()?","options":["The receiver's static type","A guessed runtime branch"],"correctIndex":0}]
---

## Hook and goal

Asking a lantern to `Light()` works only if its known type publishes that ability. Start resolution at the receiver, not a wish.

## Predict

Predict the facts needed for `receiver.method(args)`: receiver type, member name, and argument shapes.

## Run

```beskid
// Source-shaped call; verify declarations in the cited dispatch specification.
quest.Complete()
```

Reference-only while example syntax is verified. The governing rule requires a matching member on the receiver's static type.

## Investigate

Method calls use postfix member access. Resolution matches member name, arity, and argument types; v0.1 dispatch is static. New extensions use `extend type`.

## Modify

Write a method contract: receiver, inputs, output, invariant preserved.

## Make and retrieve

Make a dispatch checklist: static type, member set, signature, result. Retrieve it without notes.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

An unknown member is not fixed by a runtime branch. Inspect the static receiver type and its declared members.

## Recap and next link

Methods organize behavior around data. Next, enumerate mutually exclusive states.
