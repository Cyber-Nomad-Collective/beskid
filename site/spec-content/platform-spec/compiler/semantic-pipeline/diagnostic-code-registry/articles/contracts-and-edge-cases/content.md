---
title: Contracts and edge cases
description: Stability requirements and risky changes in the diagnostic registry.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

Registry contracts:

- Codes must be unique and semantically stable once published.
- Rules may evolve messages, but not silently repurpose existing codes.
- Deprecated codes should remain documented until consumer migration is complete.

Edge cases:

- Splitting one broad issue into multiple specific codes can break external filters.
- Merging codes can hide important distinctions used by editor workflows.
- Reordering kinds without preserving explicit mappings may create accidental code churn.
