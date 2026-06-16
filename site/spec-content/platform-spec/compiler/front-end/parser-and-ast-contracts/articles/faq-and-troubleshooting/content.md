---
title: FAQ and troubleshooting
description: Common parser and syntax questions with practical debugging guidance.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

### Why does one syntax error produce many diagnostics?

Look for missing parser recovery boundaries. A single malformed token can cascade if parsing keeps consuming nodes with shifted spans.

### Where should I add a new language form first?

Start in `beskid.pest`, then add syntax node mapping, then update resolver/analysis consumers. Skipping syntax mapping leads to unresolved or partially shaped nodes.

### How do I know if a bug is parser or semantic?

If syntax nodes are malformed or missing fields, fix parser/syntax first. If nodes are correct but rule checks fail, continue in `analysis/rules` or resolver passes.
