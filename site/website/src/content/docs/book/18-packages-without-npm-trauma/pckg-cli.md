---
title: "The pckg CLI"
description: Publish, login, and dry-run flows through beskid pckg—not a second package manager hiding in the bushes.
tableOfContents: true
---

import { Aside } from '@astrojs/starlight/components';

`beskid pckg` is the toolchain entry for registry operations: authentication, dry-run validation, publish, and related workflows implemented in the **`beskid_pckg`** crate and the **pckg** registry service.

<Aside type="caution">
Scaffolding templates use **`beskid new`**, not `pckg`. There is no `beskid pkg` command — `pckg` is the canonical spelling in every context.
</Aside>

## Commands you will actually use

```bash
beskid pckg login
beskid pckg whoami
beskid pckg publish --dry-run
beskid pckg publish
```

## What happens during publish

1. **`beskid pckg pack`** (run automatically) — collects source, generates API docs for library packages, assembles `.bpk` artifact
2. **`POST /api/packages/<name>/publish`** — streaming upload with progress reporting; the server assigns the next semver
3. **Server-side validation** — manifest integrity, checksum match, review/moderation policy enforcement
4. **Catalog update** — version appears in search and listing endpoints; dependents can `beskid pckg add` it

## Authentication

`beskid pckg` loads credentials from, in order:

1. `--bearer-token` / `--api-key` CLI flags (highest priority)
2. `BESKID_PCKG_TOKEN` / `BESKID_PCKG_API_KEY` environment variables
3. `.beskid/pckg/repositories.json` (written by `beskid pckg configure`)

Publisher operations (`publish`, `yank`, `unyank`) require a `Publisher` or `SuperAdmin` role.

## See also

- [pckg command reference](/book/reference/cli/commands/pckg/) — full subcommand and flag reference
- [Publish your first package (reference)](/book/reference/publish-first-package/) — end-to-end walkthrough with commands
- [Packages without npm trauma](/book/18-packages-without-npm-trauma/) — chapter overview
- [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/) — automatic doc generation during pack
- [Registry client](/platform-spec/tooling/registry-client/)
- [pckg client contract](/platform-spec/tooling/registry-client/pckg-client-contract/)
