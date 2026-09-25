---
title: "Publish your first package"
description: Pack, configure, and upload. The three commands between a local project and a registry release.
tableOfContents: true
---

The full flow is pack the artifact, store a credential, upload it:

```bash
beskid pckg pack --package ./acme_math.bproj --output ./dist
beskid pckg configure --api-key <token>
beskid pckg upload --artifact ./dist/acme_math.bpk acme_math
```

Uploading needs a `Publisher` or `SuperAdmin` role on the account behind the credential; packing does not.

## Before you upload

- `beskid pckg pack` runs the documentation pass by default, so `.beskid/docs/api.json` exists before the artifact is assembled. See [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/).
- Run tests (`beskid test`) if your package is more than a manifest cosplay.
- Confirm public API boundaries. See [Package public surface](/book/19-public-api-that-survives-review/package-public-surface/): registry consumers import what you exported, not what you "meant."

## See also

- [pckg command reference](/book/reference/cli/commands/pckg/) — full subcommand and flag reference
- [The pckg CLI](/book/18-packages-without-npm-trauma/pckg-cli/) — pack, configure, upload, and authentication in more detail
- [Packages without npm trauma](/book/18-packages-without-npm-trauma/) — chapter overview
