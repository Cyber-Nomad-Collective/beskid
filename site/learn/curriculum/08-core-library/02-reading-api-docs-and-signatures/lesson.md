---
id: corelib_api_docs
slug: reading-api-docs-and-signatures
title: Read the promise before the implementation
context: core-library
objective: Use signatures and documentation to predict a corelib call’s inputs, output, and failure modes.
category: core-library
difficulty: intermediate
prerequisites: ["corelib_discovery"]
command: reference
source: openspec/specs/language-meta--surface-syntax--documentation-comments/spec.md
vocabulary: ["boundary","contract","core","library"]
hints: ["A signature is a compact contract; docs add purpose and edge cases."]
questions: [{"id":"corelib_api_docs_q1","text":"Predict which facts are known from Result<T, E> before reading implementation source.","options":["It follows the stated contract.","It is a timing or implementation guess."],"correctIndex":0}]
---

## Hook and goal

Use signatures and documentation to predict a corelib call’s inputs, output, and failure modes. A signature is a compact contract; docs add purpose and edge cases.

## Predict

Predict which facts are known from Result<T, E> before reading implementation source.

## Run

Reference-only: this capability has no lesson-specific compiler proof in the current Learn runtime. Read the cited specification and do not present this package as an interactive acceptance exercise.

```beskid
// Read receiver, success payload, and error payload before implementation.
Core.Results.Result<T, ChannelError> Receive<T>(Channel<T> self)
```

## Investigate

Reference-only: inspect public package source and governing specification before creating a runnable import lesson.

## Modify

Annotate a fictional signature with parameter role, return shape, ownership, and failure path.

## Make and retrieve

Make a signature-reading checklist and retrieve it.

## Failure clinic

```beskid
// Bad assumption: Receive can fail on closed or cancelled state.
T value = channel.Receive();
```

Do not infer undocumented behavior from a convenient implementation detail.

## Recap and next link

Read promises before machinery. Next: choose practical collection shapes.
