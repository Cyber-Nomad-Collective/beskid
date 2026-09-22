---
id: data_match
title: Match and exhaustiveness
context: data-modeling
objective: Plan a response for every enum alternative.
prerequisites: ["data_enums"]
command: reference
difficulty: intermediate
category: data-modeling
vocabulary: ["contract","diagnostic","invariant"]
source: openspec/specs/language-meta--type-system--types/spec.md
hints: ["Predict before checking.","Use the named source; do not infer syntax from another language."]
questions: [{"id":"data_match_q1","text":"What useful prompt appears when an enum gains a new variant?","options":["Every incomplete match must decide its behavior","All old matches silently choose a default"],"correctIndex":0}]
---

## Hook and goal

At the city gate, each kind of traveller needs a desk. A hidden queue is a bug waiting for a name.

## Predict

List variants and predict the response for each before drafting a case expression.

## Run

```beskid
// Source-shaped case plan; current grammar must verify it before use.
match state { Ready => 1, Done => 0 }
```

Reference-only until `match` grammar and exhaustiveness diagnostics are captured in this curriculum.

## Investigate

Matching relates a pattern to a case. Exhaustiveness makes every declared alternative visible and turns a new variant into an actionable prompt at each decision site.

## Modify

Add a state to a paper enum and update every response row.

## Make and retrieve

Make a match plan: input, variants, arm result, default policy. Retrieve why wildcards can hide future work.

## Failure clinic

Broken code, used only to isolate a parser condition:

```beskid
i32 Main( {
  return 0;
}
```

Observed condition: parsing cannot form the parameter list after Main. Repair: write the empty parameter list as Main(), then rerun the lesson command before interpreting any follow-on messages.

For a missing case, choose behavior rather than adding a wildcard merely to remove feedback.

## Recap and next link

Exhaustive matches keep state models honest. Next, retrieve collections with an explicit bounds story.
