---
title: "Publish your first package"
description: End-to-end flow from local project to first registry release.
---

import { Aside } from '@astrojs/starlight/components';

## 1. Prepare project metadata

Ensure `Project.proj` has valid project metadata, at least one target, and explicit dependency declarations.

## 2. Authenticate

```bash
beskid pckg login
beskid pckg whoami
```

<Aside type="caution">
Your account must have `Publisher` or `SuperAdmin` role. Authentication will succeed but publish will fail without the right role.
</Aside>

## 3. Validate package locally

```bash
beskid pckg publish --dry-run
```

This performs local checks without uploading:

- manifest validity
- source/package consistency
- deterministic package assembly

## 4. Publish

```bash
beskid pckg publish
```

Server-side pipeline validates `.bpk`, records metadata, and places submission into review/publish flow.

## 5. Verify and consume

```bash
beskid pckg search my-package
beskid pckg add my-package@^1.0.0
beskid pckg install
```

<Aside type="note">
If package is moderated before public availability, wait for approval status in the **pckg registry** publisher workspace. Moderation status is per-package and per-version.
</Aside>

## Troubleshooting

<Aside type="caution">

**"Authentication succeeded but publish failed"** — your account lacks the `Publisher` role. Contact a registry admin.

**"No deterministic entrypoint"** — pack can't resolve the project entrypoint. Ensure `Project.proj` exists, or exactly one `.bd` file at the source root.

**"Checksum mismatch"** — the `--checksum-sha256` flag doesn't match the artifact. Regenerate: `shasum -a 256 package.bpk`.

</Aside>

## See also

- [pckg command reference](/book/reference/cli/commands/pckg/) — full subcommand and flag reference
- [Packages without npm trauma](/book/18-packages-without-npm-trauma/) — chapter overview and concepts
- [The pckg CLI](/book/18-packages-without-npm-trauma/pckg-cli/) — tutorial walkthrough of `beskid pckg`
- [Doc and api.json](/book/16-corelib-batteries-with-opinions/doc-and-api-json/) — generated API docs for pckg ingestion
- [Package public surface](/book/19-public-api-that-survives-review/package-public-surface/) — what registry consumers see
