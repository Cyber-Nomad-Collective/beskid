---
id: advanced_docs
slug: documentation-comments
title: Leave a map for the next traveler
context: advanced-language
objective: Use documentation comments as attached item documentation, not ordinary narration.
category: advanced-language
difficulty: intermediate
prerequisites: ["advanced_attributes"]
command: reference
source: openspec/specs/language-meta--surface-syntax--lexical-and-syntax/spec.md
vocabulary: ["boundary","contract","advanced","language"]
hints: ["Exactly /// begins an item documentation run; // is an ordinary comment."]
questions: [{"id":"advanced_docs_q1","text":"Predict whether //// attaches documentation under the lexical rule.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Use documentation comments as attached item documentation, not ordinary narration. Exactly /// begins an item documentation run; // is an ordinary comment.

## Predict

Predict whether //// attaches documentation under the lexical rule.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
/// Returns the visible score for a completed quest.
i32 Score() { return 0; }
```

## Investigate

Reference-only: comment attachment needs a parser/documentation fixture before UI validation.

## Modify

Write one item’s purpose, inputs, output, failure behavior, and ownership note.

## Make and retrieve

Make a documentation checklist and retrieve the slash-count rule.

## Failure clinic

```beskid
//// This does not form an attached documentation run.
i32 Score() { return 0; }
```

Do not document what code already states while omitting why the API exists.

## Recap and next link

Docs preserve intent at the declaration. Next: inspect macro boundaries.
