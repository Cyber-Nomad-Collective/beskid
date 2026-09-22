---
id: structure_visibility
slug: visibility-and-public-apis
title: Draw the public doorway
context: program-structure
objective: Distinguish a public API promise from a private implementation detail.
category: program-structure
difficulty: intermediate
prerequisites: ["structure_modules"]
command: reference
source: openspec/specs/language-meta--program-structure--modules-and-visibility/spec.md
vocabulary: ["boundary","contract","program","structure"]
hints: ["A public declaration is a promise across a module boundary."]
questions: [{"id":"structure_visibility_q1","text":"Which change is riskier for other modules?","options":["Changing a public parameter type","Refactoring a private helper"],"correctIndex":0}]
---

## Hook and goal

Distinguish a public API promise from a private implementation detail. A public declaration is a promise across a module boundary.

## Predict

Predict whether changing a public parameter or a private helper is more likely to affect another module.

## Run

```beskid
// A public signature is a consumer-facing promise.
pub i32 Score();
```

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
pub type QuestSummary {
  pub i32 score,
}
```

## Investigate

Visibility marks what consumers may depend on. Keep public surfaces narrow and expose capabilities rather than storage details.

## Modify

Sort Send, Receive, a queue id, and a status decoder into public counter or private workshop.

## Make and retrieve

Make a two-column API list and retrieve why `pub` is more than decoration.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

```beskid
// Bad boundary: external code reaches an implementation detail.
summary.internalQueue;
```

Do not expose every ancestor to cure one access error; locate the intended boundary.

## Recap and next link

Public APIs are promises. Next: collect modules into a resolved project.
