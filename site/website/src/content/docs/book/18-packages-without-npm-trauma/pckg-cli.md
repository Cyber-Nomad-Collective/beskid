---
title: "The pckg CLI"
description: Pack and upload flows through beskid pckg—not a second package manager hiding in the bushes.
tableOfContents: true
---

import { Aside } from '@astrojs/starlight/components';

`beskid pckg` is the toolchain entry for registry operations: credential configuration, artifact packing, upload, and related workflows implemented in the **`beskid_pckg`** crate and the **pckg** registry service.

<Aside type="caution">
Scaffolding templates use **`beskid new`**, not `pckg`. There is no `beskid pkg` command — `pckg` is the canonical spelling in every context.
</Aside>

## Commands you will actually use

```bash
beskid pckg configure --api-key "$BESKID_PCKG_API_KEY"
beskid pckg whoami
beskid pckg pack --package acme.math --source . --output acme.math.bpk
beskid pckg upload acme.math --artifact acme.math.bpk
```

## What happens during upload

1. **`beskid pckg pack`** — collects source, generates API docs for library packages, selects an exact semantic version, and assembles the `.bpk` artifact
2. **`beskid pckg upload`** — reads that version from artifact-root `package.json` and streams `version`, checksum, and artifact bytes to **`POST /api/packages/<name>/versions`**
3. **Server-side validation** — manifest integrity, checksum match, review/moderation policy enforcement
4. **Catalog update** — version appears in search and listing endpoints; project fetch/lock flows can resolve it

The registry does not assign a different version during upload. Package/version coordinates are immutable: publish a new artifact version instead of replacing existing bytes.

## Authentication

`beskid pckg` loads credentials from, in order:

1. `--bearer-token` / `--api-key` CLI flags (highest priority)
2. `BESKID_PCKG_TOKEN` / `BESKID_PCKG_API_KEY` environment variables
3. `.beskid/pckg/repositories.json` (written by `beskid pckg configure`)

Publisher operations (`upload`, `yank`, `unyank`) require a valid publish-scoped credential.

## See also

- [pckg command reference](/book/reference/cli/commands/pckg/) — full subcommand and flag reference
- [Publish your first package (reference)](/book/reference/publish-first-package/) — end-to-end walkthrough with commands
- [Packages without npm trauma](/book/18-packages-without-npm-trauma/) — chapter overview
- [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/) — automatic doc generation during pack
- [Registry client](/platform-spec/tooling/registry-client/)
- [pckg client contract](/platform-spec/tooling/registry-client/pckg-client-contract/)
