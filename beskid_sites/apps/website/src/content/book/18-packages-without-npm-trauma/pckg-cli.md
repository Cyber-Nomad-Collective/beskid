---
title: "The pckg CLI"
description: Pack, configure, and upload through beskid pckg, not a second package manager hiding in the bushes.
tableOfContents: true
---

`beskid pckg` is the toolchain entry for registry operations: packing, authentication, upload, and lookups, implemented in the **`beskid_pckg`** crates and the **pckg** registry service.

<Aside type="caution">
Scaffolding templates use **`beskid new`**, not `pckg`. There is no `beskid pkg` command. `pckg` is the canonical spelling in every context.
</Aside>

## Commands you will actually use

```bash
beskid pckg pack --package ./acme_math.bproj --output ./dist
beskid pckg configure --api-key <token>
beskid pckg upload --artifact ./dist/acme_math.bpk acme_math
beskid pckg whoami
```

`beskid pckg --help` lists the full command surface: `pack`, `upload`, `configure`, `list`, `search`, `details`, `versions`, `download`, `yank`, `unyank`, `whoami`. There is no `login` and no `publish` subcommand; `configure` stores the credential, `upload` does the publishing.

## What happens during pack and upload

1. **`beskid pckg pack`** collects source, runs the documentation pass for library packages (skip it with `--skip-docs` if you already generated docs and just want them validated), and assembles a `.bpk` artifact.
2. **`beskid pckg upload --artifact <path> <package>`** streams the artifact to the registry.
3. **Server-side validation** checks manifest integrity, checksum match, and review policy, then assigns the version (see [Registry-assigned versions](/book/18-packages-without-npm-trauma/registry-versions/)).
4. **Catalog update**: the version appears in `beskid pckg search` / `beskid pckg list`, and dependents can pull it.

## Authentication

`beskid pckg` reads credentials from, in priority order:

1. `--bearer-token` / `--api-key` CLI flags
2. `BESKID_PCKG_TOKEN` / `BESKID_PCKG_API_KEY` environment variables
3. `.beskid/pckg/repositories.json`, written by `beskid pckg configure --api-key <token>`

`upload`, `yank`, and `unyank` are publisher operations and need a `Publisher` or `SuperAdmin` role on the account behind the credential.

## See also

- [pckg command reference](/book/reference/cli/commands/pckg/) — full subcommand and flag reference
- [Publish your first package](/book/18-packages-without-npm-trauma/publish-first-package/) — end-to-end walkthrough
- [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/) — the doc generation `pack` runs automatically
- [Registry client](/platform-spec/tooling/registry-client/)
