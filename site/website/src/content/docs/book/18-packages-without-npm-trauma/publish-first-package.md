---
title: "Publish your first package"
description: Pointer to the verified package preparation, upload, and consumption procedure.
tableOfContents: true
---

The step-by-step guide with commands and role requirements lives in the reference tree—this section exists so the tutorial nav has a landing page that does not duplicate every flag.

## Read this next

**[Publish a package](/docs/packages/publish/)** — protect the API key, create the package record, pack, inspect, upload, and verify the immutable version.

## Before you publish

- Run `beskid doc` so `.beskid/docs/api.json` exists for pckg registry docs ingestion.
- Run tests (`beskid test`) if your package is more than a manifest cosplay.
- Confirm public API boundaries — see [Package public surface](/book/19-public-api-that-survives-review/package-public-surface/): registry consumers import what you exported, not what you "meant."

## See also

- [pckg command reference](/book/reference/cli/commands/pckg/) — full subcommand and flag reference
- [The pckg CLI](/book/18-packages-without-npm-trauma/pckg-cli/) — tutorial walkthrough
- [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/) — generated API docs ingested by pckg registry
- [Packages without npm trauma](/book/18-packages-without-npm-trauma/) — chapter overview
