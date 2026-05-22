---
title: "Publish your first package"
description: Pointer to the reference workflow—authenticate, dry-run, publish, verify on the registry.
tableOfContents: true
---

The step-by-step guide with commands and role requirements lives in the reference tree—this section exists so the tutorial nav has a landing page that does not duplicate every flag.

## Read this next

**[Publish your first package](/book/reference/publish-first-package/)** — manifest checks, `beskid pckg login`, dry-run, publish, consume.

## Before you publish

- Run `beskid doc` so `.beskid/docs/api.json` exists for pckg docs ingestion.
- Run tests (`beskid test`) if your package is more than a manifest cosplay.
- Confirm public API boundaries (chapter 19)—registry consumers import what you exported, not what you "meant."
