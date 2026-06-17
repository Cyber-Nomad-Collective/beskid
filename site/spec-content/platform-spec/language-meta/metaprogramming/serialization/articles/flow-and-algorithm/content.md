---
title: Serialization packages - Flow and algorithm
description: Step-by-step processing, algorithms, and data flow for Serialization packages.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-15
---

## Processing steps

The normative algorithm for this feature is defined in the compiler implementation. This article provides an informative overview of the processing flow.

## Data flow

```mermaid
flowchart LR
    input[Input] --> process[Processing]
    process --> output[Output]
```

## Algorithm outline

1. Parse the relevant syntax from the source
2. Resolve names and types according to the rules in the parent hub
3. Lower to intermediate representation
4. Code generation

> **Note:** Detailed flow documentation is being developed. Refer to the compiler implementation for the authoritative algorithm.
