---
specLevel: feature
title: '{Feature}'
status: Proposed
owner:
  name: Language specification team
  email: language-spec@beskid-lang.org
submitter:
  name: Language specification team
  email: language-spec@beskid-lang.org
---

## Summary
This feature defines {feature summary} — the syntax forms, type rules, and evaluation semantics that constitute this language feature.

## Syntax
Describe the surface syntax for this feature using PEST grammar excerpts. Include:
- Keyword and token forms
- Production rules from `beskid.pest`
- Any contextual constraints (e.g., "must appear inside a block", "must be followed by an expression")

## Type rules
Specify the type-checking rules for this feature:
- Expected types for each syntactic position
- Type inference constraints
- Subtyping or coercion rules

## Evaluation semantics
Describe how this feature behaves at runtime:
- Evaluation order
- Effect on control flow
- Interaction with panic/error handling
- Memory and reference semantics if applicable

## Implementation anchors
When behavior changes, update the listed anchors first so the rest of the hub can remain stable.

## Decisions
The decision summary below is generated from the hub's `adr/` directory.
<!-- spec:generate:adr-index -->
<!-- /spec:generate:adr-index -->

## Articles
The article reading order below is generated from the hub's `articles/` directory.
<!-- spec:generate:article-index -->
<!-- /spec:generate:article-index -->
